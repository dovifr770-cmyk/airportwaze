// ─── Social Recommendations Agent ────────────────────────────────────────────
// Fetches real-time tips from Reddit's public JSON API.
// Reddit allows read-only public access without auth (per their API terms).
// We search r/travel, r/flights, r/solotravel and airport-specific subreddits.
// NOTE: On web, Reddit is blocked by CORS — fallback tips are used instead.
//       On native (iOS/Android) the Reddit API is called with a 6-second timeout.

import { Platform } from 'react-native';

export interface SocialTip {
  id:          string;
  source:      'reddit';
  subreddit:   string;
  title:       string;
  snippet:     string;   // First 200 chars of top comment or body
  score:       number;   // Reddit upvotes (quality signal)
  url:         string;
  category:    TipCategory;
  airport:     string;
  terminal?:   string;
  fetchedAt:   number;   // ms timestamp
}

export type TipCategory =
  | 'food'
  | 'lounge'
  | 'security'
  | 'navigation'
  | 'connection'
  | 'shopping'
  | 'wifi'
  | 'general';

interface RedditListing {
  data: {
    children: Array<{
      data: {
        id: string;
        title: string;
        selftext: string;
        score: number;
        subreddit: string;
        permalink: string;
        url: string;
        num_comments: number;
        created_utc: number;
      };
    }>;
  };
}

// ── Category detection from text ─────────────────────────────────────────────

const CATEGORY_KEYWORDS: Record<TipCategory, string[]> = {
  food:       ['food', 'restaurant', 'eat', 'lunch', 'dinner', 'breakfast', 'cafe', 'coffee', 'burger', 'pizza', 'sushi'],
  lounge:     ['lounge', 'club', 'priority pass', 'centurion', 'admirals', 'skyclub', 'polaris'],
  security:   ['security', 'tsa', 'precheck', 'global entry', 'line', 'queue', 'wait', 'customs'],
  navigation: ['gate', 'terminal', 'walk', 'airtrain', 'shuttle', 'transfer', 'transit', 'map'],
  connection: ['connection', 'layover', 'connecting', 'tight', 'missed', 'minimum'],
  shopping:   ['shop', 'duty free', 'store', 'buy', 'purchase', 'gift', 'souvenir'],
  wifi:       ['wifi', 'wi-fi', 'internet', 'connection', 'signal', 'charging'],
  general:    [],
};

function detectCategory(text: string): TipCategory {
  const lower = text.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS) as Array<[TipCategory, string[]]>) {
    if (keywords.some((kw) => lower.includes(kw))) return cat;
  }
  return 'general';
}

function extractSnippet(text: string, maxLen = 200): string {
  if (!text || text === '[removed]' || text === '[deleted]') return '';
  return text.length > maxLen ? text.slice(0, maxLen).trimEnd() + '…' : text;
}

// ── Reddit fetch ──────────────────────────────────────────────────────────────

const REDDIT_BASE = 'https://www.reddit.com';
const SUBREDDITS = ['travel', 'flights', 'solotravel', 'traveling'];

async function fetchRedditSearch(
  query: string,
  subreddit?: string,
  sort: 'top' | 'relevance' = 'top',
  timeframe: 'month' | 'year' | 'all' = 'year',
  timeoutMs = 6000,
): Promise<RedditListing | null> {
  const path = subreddit
    ? `/r/${subreddit}/search.json`
    : '/search.json';

  const params = new URLSearchParams({
    q:       query,
    sort,
    t:       timeframe,
    limit:   '10',
    type:    'link',
    ...(subreddit ? { restrict_sr: '1' } : {}),
  });

  const url = `${REDDIT_BASE}${path}?${params.toString()}`;

  // Abort after timeoutMs to prevent hanging on CORS/network issues
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      // Note: 'User-Agent' is not allowed in browser fetch — omitted
      headers: { 'Accept': 'application/json' },
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    return await res.json() as RedditListing;
  } catch {
    clearTimeout(timer);
    return null; // timeout, CORS error, network error — use fallback tips
  }
}

// ── Parse listing into SocialTip[] ───────────────────────────────────────────

function parseListing(
  listing: RedditListing,
  airportCode: string,
  terminal?: string,
): SocialTip[] {
  const now = Date.now();
  return listing.data.children
    .filter((c) => c.data.score > 2) // filter low-quality posts
    .map((c) => {
      const d = c.data;
      const fullText = `${d.title} ${d.selftext}`;
      return {
        id:        d.id,
        source:    'reddit' as const,
        subreddit: d.subreddit,
        title:     d.title,
        snippet:   extractSnippet(d.selftext || d.title),
        score:     d.score,
        url:       `${REDDIT_BASE}${d.permalink}`,
        category:  detectCategory(fullText),
        airport:   airportCode,
        terminal,
        fetchedAt: now,
      };
    })
    .sort((a, b) => b.score - a.score); // highest score first
}

// ── Cache ─────────────────────────────────────────────────────────────────────

interface CacheEntry {
  tips:      SocialTip[];
  fetchedAt: number;
}

const CACHE = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Fetch crowd-sourced tips for an airport (and optional terminal).
 * On native: uses Reddit's public JSON API (no auth required).
 * On web: always returns curated fallback tips to avoid CORS/freeze issues.
 */
export async function fetchAirportInsights(
  airportCode: string,
  terminal?: string,
): Promise<SocialTip[]> {
  const cacheKey = `${airportCode}_${terminal ?? ''}`;
  const cached   = CACHE.get(cacheKey);

  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.tips;
  }

  // On web, Reddit API is blocked by CORS and can freeze the renderer —
  // return curated fallback tips immediately.
  if (Platform.OS === 'web') {
    const result = getFallbackTips(airportCode);
    CACHE.set(cacheKey, { tips: result, fetchedAt: Date.now() });
    return result;
  }

  const baseQuery = terminal
    ? `${airportCode} terminal ${terminal} tips`
    : `${airportCode} airport tips tricks`;

  // Run two searches in parallel (native only)
  const [generalSearch, travelSearch] = await Promise.all([
    fetchRedditSearch(baseQuery, undefined, 'top', 'year'),
    fetchRedditSearch(`${airportCode} airport`, 'travel', 'top', 'year'),
  ]);

  const allTips: SocialTip[] = [];

  if (generalSearch) {
    allTips.push(...parseListing(generalSearch, airportCode, terminal));
  }
  if (travelSearch) {
    const travelTips = parseListing(travelSearch, airportCode, terminal);
    // De-duplicate by id
    const seenIds = new Set(allTips.map((t) => t.id));
    allTips.push(...travelTips.filter((t) => !seenIds.has(t.id)));
  }

  // If we got nothing (offline / rate-limited), return curated fallback tips
  const result = allTips.length > 0 ? allTips.slice(0, 12) : getFallbackTips(airportCode);

  CACHE.set(cacheKey, { tips: result, fetchedAt: Date.now() });
  return result;
}

/**
 * Offline-safe fallback tips. Used when Reddit API is unreachable.
 */
function getFallbackTips(airportCode: string): SocialTip[] {
  const now = Date.now();
  const base = (id: string, title: string, snippet: string, cat: TipCategory): SocialTip => ({
    id, source: 'reddit', subreddit: 'travel',
    title, snippet, score: 100,
    url: `https://www.reddit.com/r/travel`,
    category: cat, airport: airportCode,
    fetchedAt: now,
  });

  const tipsByAirport: Record<string, SocialTip[]> = {
    JFK: [
      base('jfk1', 'JFK AirTrain — use it!', 'AirTrain between terminals is free and runs every few minutes. T8→T5 takes ~12 min. Much faster than walking the terminal halls.', 'navigation'),
      base('jfk2', 'Best food: Terminal 5', 'JetBlue\'s T5 has the best dining selection at JFK — stone ovens, coffee bars, and a full sit-down area, even if you\'re not on JetBlue.', 'food'),
      base('jfk3', 'Security lines at T4', 'TSA PreCheck lanes move 3× faster. T4 international can be 45+ min at peak times — budget accordingly.', 'security'),
      base('jfk4', 'Free WiFi at JFK', 'Boingo WiFi is free for 30 min. After that, use your phone hotspot — speeds are better than the paid tier anyway.', 'wifi'),
      base('jfk5', 'JFK Centurion Lounge (T4)', 'Amex Centurion and Delta Sky Club are both in T4. Priority Pass: T4 Korean Air lounge is the best option.', 'lounge'),
      base('jfk6', 'T8 connection tip', 'If arriving at T8 (AA) and connecting to T5 (JetBlue), give yourself at least 90 min — you must exit, take AirTrain, re-clear security.', 'connection'),
    ],
    LAX: [
      base('lax1', 'LAX inter-terminal shuttle', 'The LAX-it shuttle runs between terminals landside. Airside connections between adjacent terminals are possible — check your airline.', 'navigation'),
      base('lax2', 'Tom Bradley International (TBIT)', 'TBIT connects airside to T4, T5, T6, T7. If you\'re connecting internationally, you may not need to re-clear security.', 'connection'),
      base('lax3', 'Best coffee at LAX', 'Coffee Bean & Tea Leaf in TBIT is a solid pick. Urth Caffé in Terminal 7 is worth the walk if you have time.', 'food'),
      base('lax4', 'LAX security wait', 'TBIT security can be 30-40 min at peak (7am–9am, 3pm–6pm). TSA PreCheck is significantly faster at all terminals.', 'security'),
      base('lax5', 'LAX lounge access', 'Star Alliance lounge in TBIT is excellent. Priority Pass: Air France lounge (TBIT) is top-rated.', 'lounge'),
    ],
    ORD: [
      base('ord1', 'ORD tunnel between terminals', 'The underground pedestrian tunnel connects Terminal 1, 2, 3 — much faster than taking the ATS train when it\'s crowded.', 'navigation'),
      base('ord2', 'O\'Hare ATS train', 'The Airport Transit System runs between all terminals 24/7. T1→T3 is about 5 min. International Terminal 5 requires the ATS.', 'connection'),
      base('ord3', 'Best food: Terminal 3', 'Publican Tavern and Chicago-style deep dish pizza options in T3 are must-tries for a Chicago layover.', 'food'),
      base('ord4', 'ORD security tips', 'T1 (United) security can be brutal. If you have TSA PreCheck, the dedicated lane at T1 is usually under 10 min.', 'security'),
      base('ord5', 'Centurion Lounge at ORD', 'Amex Centurion is in T3 post-security — open to all Amex Platinum/Reserve cardholders. United Club is T1/T2.', 'lounge'),
    ],
    LHR: [
      base('lhr1', 'Heathrow Express', 'Heathrow Express to Paddington is 15 min and runs every 15 min. Worth the £25 if you\'re tight on time.', 'navigation'),
      base('lhr2', 'T5 is BA\'s home', 'Terminal 5 is British Airways\' hub and is one of the best-designed airport terminals in the world. Give yourself extra time to explore.', 'general'),
      base('lhr3', 'LHR security at T3', 'T3 (non-BA international) security can be very slow. Budget 45-60 min at peak times. No TSA PreCheck — use EU gates if eligible.', 'security'),
      base('lhr4', 'LHR transit', 'Transferring from T3/T4 to T5 requires the inter-terminal train (free) — about 15-20 min total. Factor this into tight connections.', 'connection'),
      base('lhr5', 'Lounge access at LHR', 'Plaza Premium Lounge (T3) accepts Priority Pass. BA\'s Galleries Club (T5) is excellent if you have oneworld status.', 'lounge'),
      base('lhr6', 'Duty free at LHR', 'T5 duty free is extensive — whisky, luxury goods, and UK confectionery. Prices are often better than city shops.', 'shopping'),
    ],
  };

  if (airportCode in tipsByAirport) return tipsByAirport[airportCode];

  return [
    base('gen1', `${airportCode} — check the official app`, 'Download the airport\'s official app for real-time gate updates, security wait times, and indoor maps.', 'navigation'),
    base('gen2', `${airportCode} lounge access`, 'Priority Pass and credit card lounges can save you from a long wait. Check which cards you carry before buying lounge access.', 'lounge'),
    base('gen3', `${airportCode} security`, 'TSA PreCheck and Global Entry significantly reduce security wait times. Worth the investment for frequent travelers.', 'security'),
    base('gen4', `${airportCode} food & coffee`, 'Check the airport website for dining options by terminal — food quality varies significantly between concourses.', 'food'),
  ];
}

/** Returns the Ionicons name for a tip category */
export function tipCategoryIcon(category: TipCategory): string {
  const icons: Record<TipCategory, string> = {
    food:       'restaurant-outline',
    lounge:     'bed-outline',
    security:   'shield-outline',
    navigation: 'map-outline',
    connection: 'flash-outline',
    shopping:   'bag-outline',
    wifi:       'wifi-outline',
    general:    'bulb-outline',
  };
  return icons[category];
}

/** Returns a color for a tip category */
export function tipCategoryColor(category: TipCategory): string {
  const colors: Record<TipCategory, string> = {
    food:       '#FF6B00',
    lounge:     '#7C3AED',
    security:   '#EF4444',
    navigation: '#1A73E8',
    connection: '#F59E0B',
    shopping:   '#EC4899',
    wifi:       '#10B981',
    general:    '#6B7280',
  };
  return colors[category];
}
