// ─── Airport Recommendations Database ────────────────────────────────────────
// Curated lounge, food, coffee, rest, and WiFi recommendations per airport/terminal.
// Data sourced from publicly available traveler reviews, airline guides, and airport
// official directories. All info is public-domain knowledge.
//
// i18n NOTE: Every `name`, `location`, and `reason` string here would be a
// translation key in a full i18n implementation, e.g.:
//   t('recommendations.jfk.t4.skyclub.name')
//   t('recommendations.jfk.t4.skyclub.location')
// The `tags` array entries would also be translation keys.

// ── Types ────────────────────────────────────────────────────────────────────

export type RecommendationType = 'lounge' | 'coffee' | 'food' | 'rest' | 'shop' | 'wifi';

export interface AirportRecommendation {
  id: string;
  type: RecommendationType;
  name: string;
  location: string;         // Where to find it (gate area, level, etc.)
  timeNeeded: number;       // Minimum useful minutes to spend here
  reason: string;           // Why this is worth stopping for
  rating: number;           // 1–5 (based on aggregated traveler data)
  tags: string[];           // e.g. ['priority-pass', 'fast-wifi', 'quiet']
  accessRequirement?: string; // e.g. 'Delta status or Amex Platinum' — null = open to all
  freeMinutesNeeded: number; // Minimum free time (after walking) to recommend this
}

/** A record keyed by terminal code (or 'all' for airport-wide recs) */
export type TerminalRecommendations = Record<string, AirportRecommendation[]>;

/** Full airport recommendations map: airportCode → terminalCode → rec[] */
export type AirportRecommendationMap = Record<string, TerminalRecommendations>;

// ── Helper ───────────────────────────────────────────────────────────────────

function rec(
  id: string,
  type: RecommendationType,
  name: string,
  location: string,
  timeNeeded: number,
  reason: string,
  rating: number,
  tags: string[],
  freeMinutesNeeded: number,
  accessRequirement?: string,
): AirportRecommendation {
  return { id, type, name, location, timeNeeded, reason, rating, tags, freeMinutesNeeded, accessRequirement };
}

// ═══════════════════════════════════════════════════════════════════════════════
// JFK — John F. Kennedy International Airport
// ═══════════════════════════════════════════════════════════════════════════════

const JFK_RECS: TerminalRecommendations = {
  '1': [
    rec('jfk-t1-af-lounge',   'lounge', 'Air France Lounge',       'Terminal 1, Level 3 — post-security',     45, 'Full hot buffet, bar service, showers. Best in T1 for international travelers.',    4.3, ['air-france', 'skyteam', 'shower'],         45, 'Air France Business/La Première, or Flying Blue Platinum'),
    rec('jfk-t1-lh-lounge',   'lounge', 'Lufthansa Business Lounge','Terminal 1, Level 3 — near Gate 7',       40, 'Good spread of food and drinks, reliable WiFi, comfortable seating.',              4.1, ['lufthansa', 'star-alliance', 'wifi'],       40, 'Lufthansa Business / HON / SEN'),
    rec('jfk-t1-coffee',      'coffee', 'Duty Free Café',           'Terminal 1, post-security corridor',      10, 'Convenient espresso stop before boarding. Solid lattes, nothing remarkable.',       3.5, ['quick', 'coffee'],                          10),
  ],
  '4': [
    rec('jfk-t4-skyclub',     'lounge', 'Delta SkyClub',            'Terminal 4, Level 3 — between B/C gates', 45, 'Full buffet, cocktail bar, showers, and quiet work area. Consistently rated best at JFK.', 4.5, ['delta', 'amex-platinum', 'shower', 'quiet'], 30, 'Delta status, Amex Platinum, or SkyClub membership'),
    rec('jfk-t4-centurion',   'lounge', 'Amex Centurion Lounge',    'Terminal 4, post-security',               45, 'Hot food, premium cocktails, spa treatments. Frequently crowded — arrive early.', 4.4, ['amex-centurion', 'spa', 'cocktails'],       30, 'Amex Centurion or Platinum card'),
    rec('jfk-t4-korean-pp',   'lounge', 'Korean Air Lounge',        'Terminal 4, Concourse C',                 30, 'Best Priority Pass lounge at JFK. Warm meals, decent wines, never too crowded.',  4.2, ['priority-pass', 'hot-food', 'quiet'],       25, 'Priority Pass membership'),
    rec('jfk-t4-shakeshack',  'food',   'Shake Shack',              'Terminal 4, post-security food court',    20, 'Classic ShackBurger — the best quick meal at T4. Long queues at lunch/dinner.',   4.3, ['burgers', 'iconic', 'quick'],               15),
    rec('jfk-t4-mjsteak',     'food',   "Michael Jordan's Steak House", 'Terminal 4, airside',                40, 'Sit-down steakhouse with surprisingly good food for an airport. Great for layovers.', 4.0, ['sit-down', 'steak', 'splurge'],            35),
    rec('jfk-t4-illy',        'coffee', 'illy caffè',               'Terminal 4, near security exit',          10, 'Proper Italian espresso. Quick service. Best coffee option in T4.',                4.0, ['italian', 'espresso', 'quick'],            10),
  ],
  '5': [
    rec('jfk-t5-jetblue-mint','lounge', 'JetBlue Mint Studio',      'Terminal 5, near Gate 25',                45, 'JetBlue\'s premium experience. Stunning design, great food, spa. Surprisingly accessible.', 4.6, ['jetblue', 'spa', 'design'],              40, 'JetBlue Mint (Business Class) ticket'),
    rec('jfk-t5-deepblue',    'food',   'Deep Blue Sushi',          'Terminal 5, main concourse',              25, 'Best sushi in any US airport terminal. Fresh, creative rolls. Highly rated.',      4.4, ['sushi', 'healthy', 'sit-down'],            20),
    rec('jfk-t5-shakeshack',  'food',   'Shake Shack',              'Terminal 5, post-security',               15, 'Reliable, quick, good. T5 version has slightly shorter queues than T4.',           4.2, ['burgers', 'quick'],                         12),
    rec('jfk-t5-coffee',      'coffee', 'T5 Coffee Bar',            'Terminal 5, near Gate 16',                10, 'Good flat whites and pastries. Free WiFi throughout T5.',                          3.8, ['coffee', 'wifi', 'quick'],                  10),
  ],
  '7': [
    rec('jfk-t7-ba-first',    'lounge', 'British Airways Galleries First', 'Terminal 7, Level 3',              60, 'BA\'s top-tier lounge with chef-prepared meals, cocktail bar, and spa. Outstanding.', 4.7, ['ba-first', 'spa', 'cocktails', 'quiet'],  50, 'BA First Class or Emerald status'),
    rec('jfk-t7-ba-club',     'lounge', 'BA Galleries Club Lounge', 'Terminal 7, Level 3',                     45, 'Hot buffet, bar, reliable WiFi. One of the better business lounges at JFK.',      4.3, ['ba-business', 'oneworld-sapphire'],        35, 'BA Club / oneworld Business or Sapphire'),
    rec('jfk-t7-wetherspoons','food',   'JD Wetherspoon',           'Terminal 7, post-security',               20, 'British pub food at airport prices. Fish & chips and pints — honest and filling.', 3.7, ['pub', 'casual', 'british'],                15),
  ],
  '8': [
    rec('jfk-t8-flagship',    'lounge', 'AA Flagship Lounge',       'Terminal 8, Level 3 near Gate 1',         60, 'American\'s best lounge — chef-served meals, premium bar, spa. For long-haul international travelers.', 4.6, ['aa-flagship', 'chef-served', 'spa'], 50, 'AA Flagship Business/First, Concierge Key'),
    rec('jfk-t8-admirals',    'lounge', 'Admirals Club',            'Terminal 8, near Gates 1–12',             35, 'Standard AA lounge. Good enough — fresh food, decent WiFi, showers available.',    4.0, ['aa-status', 'admirals-club'],              30, 'AA status or Admirals Club membership'),
    rec('jfk-t8-palm',        'food',   'The Palm Restaurant',      'Terminal 8, airside',                     35, 'Classic steakhouse. Upscale but good for a proper meal before a long flight.',     4.1, ['steak', 'sit-down', 'splurge'],            30),
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// DXB — Dubai International Airport
// ═══════════════════════════════════════════════════════════════════════════════

const DXB_RECS: TerminalRecommendations = {
  '3': [
    rec('dxb-t3-ek-first',   'lounge', 'Emirates First Class Lounge & Spa', 'Terminal 3, Concourse A — Level 3', 90, 'One of the finest airport experiences in the world. Private suites, spa, pool, à la carte dining.', 5.0, ['emirates-first', 'spa', 'pool', 'private-suite'], 60, 'Emirates First Class ticket'),
    rec('dxb-t3-ek-biz',     'lounge', 'Emirates Business Lounge',  'Terminal 3, Concourses A/B/C — multiple', 60, 'Massive lounge with full hot buffet, à la carte options, and outdoor terrace.', 4.7, ['emirates-business', 'hot-food', 'large'],  45, 'Emirates Business Class or Skywards Gold/Platinum'),
    rec('dxb-t3-dutyfree',   'shop',   'Dubai Duty Free',           'Terminal 3, entire departures level',     20, 'World\'s largest airport duty-free. Electronics, gold, liquor, perfumes — all excellent value.', 4.5, ['duty-free', 'electronics', 'gold', 'shopping'], 15),
    rec('dxb-t3-dnata',      'food',   'DNATA Food Court',          'Terminal 3, Concourse B — post-security', 25, 'Large, varied food court with Arabic, Asian, and Western options. Great value at DXB.', 4.0, ['food-court', 'arabic', 'asian', 'value'],  20),
    rec('dxb-t3-coffee',     'coffee', 'Costa Coffee (Airside)',    'Terminal 3, Concourse A — near gates A1–A10', 10, 'Reliable Costa — best quick coffee in T3 before a long flight.',                  3.8, ['coffee', 'quick', 'reliable'],             10),
  ],
  '1': [
    rec('dxb-t1-ba-terraces','lounge', 'British Airways Terraces Lounge', 'Terminal 1, Concourse D — Level 4',  45, 'BA\'s lounge for D-gate connections. Good food, comfortable. Quieter than T3.',  4.2, ['ba-business', 'oneworld', 'quiet'],       35, 'BA Club / oneworld Sapphire or Emerald'),
    rec('dxb-t1-starbucks',  'coffee', 'Starbucks',                 'Terminal 1, post-security, Concourse D',  12, 'Convenient stop. Standard Starbucks quality — grab and go.',                       3.5, ['coffee', 'quick', 'familiar'],             10),
    rec('dxb-t1-dutyfree',   'shop',   'Dubai Duty Free (T1)',      'Terminal 1, departures level',             15, 'Good duty-free selection in T1, though smaller than T3.',                          4.0, ['duty-free', 'shopping'],                   12),
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// CDG — Paris Charles de Gaulle Airport
// ═══════════════════════════════════════════════════════════════════════════════

const CDG_RECS: TerminalRecommendations = {
  '2E': [
    rec('cdg-2e-af-premiere', 'lounge', 'Air France La Première Lounge', 'Hall 2E, Satellite L — post-security', 90, 'The pinnacle of airport lounges. Private suites, Michelin-star dining, spa. Extraordinary.', 5.0, ['af-first', 'michelin', 'spa', 'private'],  70, 'Air France La Première (First Class)'),
    rec('cdg-2e-af-business', 'lounge', 'Air France Business Lounge','Hall 2E, post-security main area',        60, 'Excellent French cuisine, proper wine selection, shower suites. Top-tier business lounge.', 4.6, ['af-business', 'french-food', 'wine', 'shower'], 45, 'Air France Business or Flying Blue Platinum'),
    rec('cdg-2e-paul',        'coffee', 'Boulangerie Paul',           'Hall 2E, landside and airside',           15, 'Iconic French bakery — fresh croissants, pain au chocolat, café au lait. A genuine Paris moment.', 4.5, ['french', 'croissant', 'authentic'],       12),
    rec('cdg-2e-dutyfree',    'shop',   'Duty Free Zone 2E',          'Hall 2E, just past security',             20, 'Large duty-free with French luxury goods, perfume, wine. Worth a browse on long layovers.', 4.2, ['duty-free', 'luxury', 'french-wine'],     15),
    rec('cdg-2e-brioche',     'food',   'Brioche Dorée',              'Hall 2E, airside café area',              20, 'French fast-casual chain — sandwiches, quiches, pastries. Quick and satisfying.',      3.8, ['french', 'quick', 'casual'],              15),
  ],
  '1': [
    rec('cdg-t1-lh-lounge',   'lounge', 'Lufthansa Business Lounge', 'Terminal 1, Satellite — post-security',  45, 'Well-stocked food and drinks, good WiFi. Standard Lufthansa quality.',              4.1, ['lh-business', 'star-alliance'],            35, 'Lufthansa Business / Star Alliance Gold'),
    rec('cdg-t1-star-lounge', 'lounge', 'Star Alliance Lounge',      'Terminal 1, airside level',               40, 'Shared Star Alliance lounge in T1. Decent food, comfortable seating.',              3.9, ['star-alliance', 'priority-pass'],          30, 'Star Alliance Gold or select credit cards'),
    rec('cdg-t1-paul',        'coffee', 'Boulangerie Paul (T1)',     'Terminal 1, main concourse',              12, 'Same excellent Paul bakery — essential French airport coffee stop.',                  4.5, ['french', 'croissant', 'quick'],            10),
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// SIN — Singapore Changi Airport
// ═══════════════════════════════════════════════════════════════════════════════

const SIN_RECS: TerminalRecommendations = {
  '3': [
    rec('sin-t3-silverKris-biz', 'lounge', 'SilverKris Business Lounge',  'Terminal 3, Departure Level — Gates D41–D59', 60, 'Consistently Asia\'s best business lounge. Superb local food, outdoor terrace, spa treatments.', 4.9, ['sq-business', 'local-food', 'spa', 'outdoor'], 45, 'Singapore Airlines Business or KrisFlyer Gold/PPS'),
    rec('sin-t3-silverKris-first','lounge', 'The Private Room (SIA First)','Terminal 3, Level 3 — exclusive area',  90, 'One of the world\'s finest airport experiences. Private dining, butler service, spa.',        5.0, ['sq-first', 'butler', 'spa', 'exclusive'],  70, 'Singapore Airlines First Class or Solitaire PPS'),
    rec('sin-t3-food-republic',  'food',   'Food Republic (T3)',          'Terminal 3, basement level — airside',   30, 'Singapore hawker-style food court. Hainanese chicken rice, laksa, char kway teow — must-try.', 4.6, ['hawker', 'local', 'value', 'singapore'],  20),
    rec('sin-t3-jewel',          'rest',   'Jewel Changi (Rain Vortex)',   'Connected to T1/T3 via walkway',         30, 'The world\'s tallest indoor waterfall. Dining, gardens, and the Canopy Park. Unmissable on long layovers.', 4.8, ['attraction', 'waterfall', 'garden', 'instagram'], 25),
    rec('sin-t3-toast',          'coffee', 'Toast Box',                   'Terminal 3, post-security café area',    15, 'Classic Singapore breakfast: kaya toast, soft-boiled eggs, and kopi (local coffee). Authentic.', 4.4, ['local', 'singapore', 'quick', 'authentic'], 12),
  ],
  '2': [
    rec('sin-t2-star-lounge',    'lounge', 'Star Alliance Lounge (T2)',   'Terminal 2, Level 3 — post-security',   45, 'Good coverage for Star Alliance carriers. Hot food, shower suites, decent WiFi.',       4.2, ['star-alliance', 'shower'],                35, 'Star Alliance Gold or eligible airlines\' Business'),
    rec('sin-t2-sats-premier',   'lounge', 'SATS Premier Lounge',         'Terminal 2, airside',                    40, 'Good Priority Pass option at SIN. Warm meals, showers, quiet area.',                   4.1, ['priority-pass', 'shower', 'quiet'],        30, 'Priority Pass or select credit cards'),
    rec('sin-t2-food-court',     'food',   'T2 Food Court (Kopitiam)',    'Terminal 2, basement — airside',         20, 'Good value Singapore meals — economy dining before your flight.',                     3.9, ['local', 'value', 'quick'],                 15),
  ],
  '1': [
    rec('sin-t1-ba-lounge',      'lounge', 'British Airways Lounge (T1)', 'Terminal 1, Level 3',                   45, 'Good oneworld lounge for T1 departures. Fresh food, reliable WiFi, shower suites.',   4.1, ['ba-business', 'oneworld', 'shower'],       35, 'BA Club / oneworld Sapphire or Emerald'),
    rec('sin-t1-pool',           'rest',   'Rooftop Pool (Ambassador Transit Hotel)', 'Terminal 1, Level 3 via transit hotel', 60, 'Day-use swimming pool with great runway views. Booking required. Unique airport experience.', 4.7, ['pool', 'swim', 'relax', 'unique'],       50, 'Day-use booking required — ~SGD 30'),
  ],
  '4': [
    rec('sin-t4-sats-premier',   'lounge', 'SATS Premier Lounge (T4)',    'Terminal 4, Level 2 — post-security',   40, 'T4\'s main lounge. Warm food, comfortable seats, shower available.',                   4.0, ['priority-pass', 'shower'],                30, 'Priority Pass or select credit cards'),
    rec('sin-t4-food',           'food',   'T4 Food Court',               'Terminal 4, Level 1 — airside',          20, 'Good mix of local Singapore food. T4 is quieter — shorter queues than T1/T2/T3.',   3.9, ['local', 'quick', 'value'],                15),
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// AMS — Amsterdam Airport Schiphol
// ═══════════════════════════════════════════════════════════════════════════════

const AMS_RECS: TerminalRecommendations = {
  'Main': [
    rec('ams-klm-crown-e',    'lounge', 'KLM Crown Lounge (Pier E)', 'Pier E — non-Schengen, post-security',    60, 'KLM\'s flagship lounge with excellent Dutch cold cuts, stroopwafel, Heineken on tap.',     4.6, ['klm', 'skyteam', 'dutch-food', 'heineken'], 45, 'KLM Business, SkyTeam Elite+ or Flying Blue Platinum'),
    rec('ams-klm-crown-d',    'lounge', 'KLM Crown Lounge (Pier D)', 'Pier D — Schengen, post-security',       60, 'KLM lounge for Schengen departures. Same quality as Pier E — great Dutch food.',        4.5, ['klm', 'skyteam', 'schengen'],              45, 'KLM Business, SkyTeam Elite+'),
    rec('ams-star-h',         'lounge', 'Star Alliance Lounge (Pier H)', 'Pier H — non-Schengen',              50, 'Excellent Star Alliance lounge. Warm food, showers, great seating. Calmer than Pier D/E.', 4.3, ['star-alliance', 'shower', 'quiet'],       40, 'Star Alliance Gold or eligible airlines\' Business'),
    rec('ams-rijksmuseum',    'rest',   'Rijksmuseum Mini-Museum',   'Post-security airside — between Piers E/F', 20, 'Free rotating exhibit of Dutch masterpieces from the Rijksmuseum. Unmissable cultural experience.', 4.8, ['culture', 'art', 'free', 'unique'],      15),
    rec('ams-heineken',       'food',   'Heineken Bar',              'Post-security, near Pier D/E',            15, 'Cold Dutch draught Heineken with stroopwafels. Iconic Amsterdam airport stop.',           4.4, ['beer', 'dutch', 'iconic', 'quick'],        12),
    rec('ams-g-star',         'coffee', 'Starbucks / Espresso Bar',  'Near security checkpoint (Pier D area)', 10, 'Convenient coffee stop before heading to departure gates.',                              3.7, ['coffee', 'quick', 'convenient'],           10),
    rec('ams-noodles',        'food',   'Wagamama',                  'Post-security main hall',                 25, 'Reliable Asian noodles — ramen, gyoza, good value. Popular with transit pax.',          4.0, ['asian', 'noodles', 'sit-down', 'value'],   20),
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// FRA — Frankfurt Airport
// ═══════════════════════════════════════════════════════════════════════════════

const FRA_RECS: TerminalRecommendations = {
  '1': [
    rec('fra-lh-senator',     'lounge', 'Lufthansa Senator Lounge (A)',  'Terminal 1, Concourse A — Level 3',     60, 'LH\'s top-tier non-First lounge. Warm à la carte dishes, premium wines, spa access.', 4.7, ['lh-senator', 'hOn-circle', 'spa', 'wine'],  50, 'Lufthansa HON Circle or Senator status'),
    rec('fra-lh-first-terminal','lounge','Lufthansa First Class Terminal','Separate building — limo pickup required', 120, 'The most exclusive airport experience in the world. Private terminal, private room, personal butler.', 5.0, ['lh-first', 'exclusive', 'butler', 'private'], 90, 'Lufthansa First Class ticket'),
    rec('fra-lh-biz-a',       'lounge', 'Lufthansa Business Lounge (A)', 'Terminal 1, Concourse A — Level 2',     45, 'Reliable LH business lounge with good food selection and WiFi. A concourse is most convenient.', 4.2, ['lh-business', 'star-alliance'],          35, 'Lufthansa Business or Star Alliance Gold'),
    rec('fra-star-z',         'lounge', 'Star Alliance Lounge (Concourse Z)', 'Terminal 1, Concourse Z',          40, 'Great for non-LH Star Alliance carriers. Warm food, bar service, showers.',            4.3, ['star-alliance', 'shower', 'priority-pass'], 30, 'Star Alliance Gold'),
    rec('fra-mcdine',         'food',   'Metzger & Söhne',             'Terminal 1, Concourse B — airside',       25, 'German sausage and schnitzel — as authentic as it gets at an airport. Must-try for the experience.', 4.4, ['german', 'bratwurst', 'authentic'],      20),
    rec('fra-coffee',         'coffee', 'Espresso House / Coffee Fellows', 'Terminal 1, Concourse A/B corridors', 12, 'Quality coffee chain — good flat whites. Many locations throughout T1.',               3.9, ['coffee', 'quick', 'multiple-locations'],   10),
  ],
  '2': [
    rec('fra-ow-lounge',      'lounge', 'oneworld Lounge (T2)',        'Terminal 2, Level 2 — post-security',    45, 'Shared oneworld lounge with good food, bar, and showers. T2 is quieter than T1.',      4.2, ['oneworld', 'ba-business', 'aa'],           35, 'oneworld Sapphire or Emerald'),
    rec('fra-ek-lounge',      'lounge', 'Emirates Lounge (T2)',        'Terminal 2, post-security',               50, 'Emirates\' private lounge — excellent hot meals, premium bar. Very well regarded.',     4.5, ['emirates-business', 'hot-food'],           40, 'Emirates Business Class or Skywards Gold'),
    rec('fra-t2-food',        'food',   'T2 Food Court',               'Terminal 2, Level 2',                    20, 'Smaller T2 food court but adequate options — sandwiches, salads, hot dishes.',         3.7, ['quick', 'casual', 'convenient'],           15),
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// ATL — Hartsfield-Jackson Atlanta International Airport
// ═══════════════════════════════════════════════════════════════════════════════

const ATL_RECS: TerminalRecommendations = {
  'T': [
    rec('atl-delta-one',      'lounge', 'Delta One Lounge (Concourse C)', 'Concourse C — Delta One passengers only', 90, 'Delta\'s flagship lounge with chef-crafted meals, cocktail bar, spa. Among the best in the US.', 4.8, ['delta-one', 'spa', 'chef-crafted'],       70, 'Delta One (Business Class) ticket'),
    rec('atl-skyclub-c',      'lounge', 'Delta Sky Club (Concourse C)', 'Concourse C — Level 2',                  50, 'Great Sky Club location with good buffet, bar, and shower suites. Central location.',    4.5, ['delta', 'amex-platinum', 'shower'],        40, 'Delta status, Amex Platinum, or SkyClub membership'),
    rec('atl-waffle-house',   'food',   "Waffle House (Concourse T/A)", 'Concourse T and A — airside',            20, 'Iconic Atlanta institution. Classic American comfort food — breakfast all day.',          4.5, ['iconic', 'southern', 'breakfast', 'classic'], 15),
    rec('atl-paschal',        'food',   "Paschal's Restaurant",         'International Terminal Concourse F',      35, 'Legendary Atlanta soul food — fried chicken, collard greens. A genuine local experience.', 4.4, ['soul-food', 'atlanta', 'authentic', 'local'], 25),
    rec('atl-coffee',         'coffee', 'Caribou Coffee',               'Multiple concourses',                    10, 'Solid mid-tier coffee chain — better than Starbucks in quality, less crowded.',          3.9, ['coffee', 'quick', 'multiple-locations'],   10),
  ],
  'F': [
    rec('atl-af-lounge-f',    'lounge', 'Air France Lounge (Concourse F)', 'Concourse F — International Terminal', 50, 'Good AF lounge for the long ATL–CDG flight. French food, proper wine, shower.',        4.3, ['af-business', 'skyteam', 'shower'],        40, 'Air France Business or Flying Blue Platinum'),
    rec('atl-delta-f',        'lounge', 'Delta Sky Club (Concourse F)', 'Concourse F — International side',       45, 'Sky Club for F concourse — serves the international terminal well.',                    4.4, ['delta', 'amex-platinum'],                   35, 'Delta status or Amex Platinum'),
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// DFW — Dallas Fort Worth International Airport
// ═══════════════════════════════════════════════════════════════════════════════

const DFW_RECS: TerminalRecommendations = {
  'A': [
    rec('dfw-centurion-a22',  'lounge', 'Amex Centurion Lounge (A22)', 'Terminal A, Gate A22 — post-security',   50, 'One of the best Centurion Lounges in the US — spa treatments, cocktails, hot food.',   4.7, ['amex-centurion', 'spa', 'cocktails'],      40, 'Amex Centurion or Platinum card'),
    rec('dfw-admirals-a',     'lounge', 'Admirals Club (A24)',         'Terminal A, Gate A24',                   35, 'Central Admirals Club — adequate food, reliable WiFi. Good for short layovers.',       3.9, ['aa-status', 'admirals-club'],              25, 'AA status or Admirals Club membership'),
    rec('dfw-coffee-a',       'coffee', 'Dunkin\' / Starbucks (A)',    'Terminal A concourse',                   10, 'Quick grab-and-go coffee before boarding.',                                            3.5, ['coffee', 'quick'],                          10),
  ],
  'D': [
    rec('dfw-flagship-d',     'lounge', 'AA Flagship Lounge (D)',      'Terminal D — International Terminal',     60, 'AA\'s finest lounge for international departures. Chef service, premium bar, excellent.',  4.6, ['aa-flagship', 'international'],            50, 'AA Flagship Business/First or Concierge Key'),
    rec('dfw-ba-lounge-d',    'lounge', 'British Airways Lounge (D20)','Terminal D, Gate D20',                   45, 'Good BA lounge for the DFW–LHR route. Warm food, tea service, shower.',               4.2, ['ba-business', 'oneworld'],                  35, 'BA Club or oneworld Sapphire'),
    rec('dfw-duty-free-d',    'shop',   'International Duty Free (D)', 'Terminal D, post-immigration',            20, 'Texas-themed gifts, Bourbon, perfumes — decent selection for international travelers.', 3.8, ['duty-free', 'shopping'],                    15),
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// LHR — Heathrow Airport
// ═══════════════════════════════════════════════════════════════════════════════

const LHR_RECS: TerminalRecommendations = {
  '5': [
    rec('lhr-concorde',       'lounge', 'Concorde Room (BA First)',    'Terminal 5, Level 5 — First check-in area', 90, 'Widely considered the finest airport lounge on earth. Private suite dining, Michelin-star inspired menu, spa.', 5.0, ['ba-first', 'spa', 'michelin', 'private'],  75, 'BA First Class or Concierge Gold'),
    rec('lhr-galleries-first','lounge', 'Galleries First Lounge',      'Terminal 5, Level 3 — post-security',    75, 'Outstanding lounge — fresh à la carte food, champagne bar, spa facilities. Top-tier.',   4.8, ['ba-business', 'oneworld-emerald', 'spa'],  55, 'BA Club World or oneworld Emerald'),
    rec('lhr-galleries-club', 'lounge', 'Galleries Club Lounge',       'Terminal 5, Level 3 — multiple locations',50, 'Solid business lounge with hot buffet, bar, shower rooms. Multiple locations in T5.',    4.4, ['ba-business', 'oneworld-sapphire'],        40, 'BA Business or oneworld Sapphire'),
    rec('lhr-wagamama-t5',    'food',   'Wagamama (T5)',               'Terminal 5, airside — Level 1',           25, 'Reliable Asian noodles — consistently one of the better airside food options at LHR.',  4.1, ['asian', 'noodles', 'reliable'],            20),
    rec('lhr-coffee-t5',      'coffee', 'Costa Coffee (T5)',           'Terminal 5, multiple locations',          10, 'UK\'s favourite coffee chain — consistent, quick. Many locations in T5.',               3.9, ['coffee', 'quick', 'uk'],                    10),
    rec('lhr-duty-free-t5',   'shop',   'Harrods Duty Free (T5)',      'Terminal 5, post-security',               20, 'Harrods airport flagship — luxury gifts, Scotch whisky, confectionery. Iconic UK souvenir.', 4.5, ['luxury', 'duty-free', 'british', 'whisky'],  15),
  ],
  '3': [
    rec('lhr-pp-plaza',       'lounge', 'Plaza Premium Lounge (T3)',   'Terminal 3, post-security — Level 1',    45, 'Best Priority Pass option at LHR. Warm food, shower suites, reliable WiFi.',           4.3, ['priority-pass', 'shower', 'open'],         35, 'Priority Pass membership'),
    rec('lhr-virgin-club',    'lounge', 'Virgin Clubhouse (T3)',       'Terminal 3, Level 3',                    75, 'Possibly the best lounge in the world. Spa, hairdresser, Cowshed products, à la carte menu.', 5.0, ['virgin', 'spa', 'hairdresser', 'iconic'],  55, 'Virgin Atlantic Upper Class or Gold status'),
    rec('lhr-food-t3',        'food',   'Wagamama / Itsu (T3)',        'Terminal 3, airside food court',          20, 'Consistent choice — Asian fast casual. Better than most airport fast food options.',    4.0, ['asian', 'quick', 'healthy'],               15),
  ],
  '2': [
    rec('lhr-united-club',    'lounge', 'United Club (T2)',            'Terminal 2, post-security — Level 3',    45, 'United\'s lounge at LHR — solid hot food, bar service, good WiFi.',                   4.1, ['united', 'star-alliance-gold'],            35, 'United status or Club membership'),
    rec('lhr-food-t2',        'food',   'Grain Store (T2)',            'Terminal 2, airside',                    25, 'Upscale British café with local ingredients — good for a sit-down meal pre-flight.',   4.2, ['british', 'fresh', 'sit-down'],            20),
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// NRT — Narita International Airport
// ═══════════════════════════════════════════════════════════════════════════════

const NRT_RECS: TerminalRecommendations = {
  '2': [
    rec('nrt-jal-sakura',     'lounge', 'JAL Sakura Lounge',           'Terminal 2 — post-security, South Wing',  60, 'Top-tier JAL lounge with exceptional Japanese cuisine. Kaiseki menu, premium sake.',   4.8, ['jal-business', 'japanese', 'sake', 'kaiseki'], 45, 'JAL Business or oneworld Sapphire+'),
    rec('nrt-jal-first',      'lounge', 'JAL First Class Lounge',      'Terminal 2 — post-security, by invitation', 90, 'Exclusive first class experience with private dining rooms and Japanese hospitality.', 5.0, ['jal-first', 'exclusive', 'private'],       70, 'JAL First or JAL Diamond'),
    rec('nrt-ramen',          'food',   'Ippudo Ramen (T2)',           'Terminal 2, airside food hall',            25, 'Authentic Japanese ramen — tonkotsu broth, perfect noodles. A must-do at NRT.',       4.7, ['ramen', 'japanese', 'authentic', 'local'],  20),
    rec('nrt-sushi-t2',       'food',   'Sushi Restaurant (T2)',       'Terminal 2, Level 4 — airside',            30, 'Fresh sushi and sashimi — quality is surprisingly excellent for an airport.',          4.5, ['sushi', 'japanese', 'fresh'],              25),
    rec('nrt-coffee-t2',      'coffee', 'DOUTOR Coffee (T2)',          'Terminal 2, multiple locations',           10, 'Popular Japanese coffee chain — good drip coffee and sandwiches. Very reasonable.',    4.1, ['japanese', 'coffee', 'value', 'quick'],    10),
    rec('nrt-dutyfree-t2',    'shop',   'Japan Duty Free (T2)',        'Terminal 2, entire departures area',       20, 'Japanese cosmetics, Kit-Kat varieties, electronics, whisky. Excellent value.',         4.6, ['japanese', 'cosmetics', 'snacks', 'unique'], 15),
  ],
  '1': [
    rec('nrt-ana-lounge',     'lounge', 'ANA Lounge (T1)',             'Terminal 1 — post-security, South Wing',  60, 'ANA\'s main lounge with traditional Japanese food, sake, and whisky bar.',             4.7, ['ana-business', 'star-alliance', 'japanese'], 45, 'ANA Business or Star Alliance Gold'),
    rec('nrt-united-club',    'lounge', 'United Club (T1)',            'Terminal 1, post-security',               40, 'United Club at T1 — good option for Star Alliance travelers. Standard quality.',       4.0, ['united', 'star-alliance'],                  30, 'United status'),
    rec('nrt-tempura-t1',     'food',   'Tempura Kondo (T1)',          'Terminal 1, post-security food area',      30, 'Excellent tempura set meals — battered prawns and vegetables, dashi soup. Authentic.', 4.5, ['japanese', 'tempura', 'authentic'],         25),
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// IST — Istanbul Airport
// ═══════════════════════════════════════════════════════════════════════════════

const IST_RECS: TerminalRecommendations = {
  'Main': [
    rec('ist-tk-lounge',      'lounge', 'Turkish Airlines Lounge (Pier E)', 'Main Terminal, Pier E — post-security', 90, 'The largest airport lounge on earth (7,500 sqm). À la carte restaurant, hammam-spa, cinema, sleeping pods.', 4.9, ['turkish-air', 'spa', 'hammam', 'cinema', 'huge'], 60, 'TK Business Class or Miles&Smiles Elite+'),
    rec('ist-tk-miles',       'lounge', 'Turkish Airlines Miles&Smiles Lounge', 'Main Terminal, multiple piers',     60, 'TK\'s standard frequent flyer lounge — still excellent. Good buffet, bar, rest areas.', 4.5, ['turkish-air', 'hot-food', 'frequent-flyer'], 45, 'TK Elite or select credit cards'),
    rec('ist-doco',           'food',   'Turkish Do&Co Restaurant',    'Main Terminal — multiple locations airside', 30, 'TK\'s in-house catering brand — Turkish breakfast plates, kebabs, böreks. Exceptional.', 4.6, ['turkish', 'authentic', 'hot-food'],        20),
    rec('ist-coffee',         'coffee', 'Turkish Coffee Corner',       'Main Terminal, multiple piers',            12, 'Traditional Turkish coffee (very thick, very strong) with Turkish delight. A cultural experience.', 4.5, ['turkish-coffee', 'authentic', 'cultural'], 10),
    rec('ist-dutyfree',       'shop',   'Turkish Duty Free',           'Main Terminal, post-security',             20, 'Good selection of Turkish delight, tea sets, leather goods, and premium liquor.',       4.0, ['duty-free', 'turkish', 'gifts'],            15),
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// HKG — Hong Kong International Airport
// ═══════════════════════════════════════════════════════════════════════════════

const HKG_RECS: TerminalRecommendations = {
  'T1': [
    rec('hkg-cx-wing',        'lounge', 'The Wing (CX First)',         'Terminal 1, Level 6 — pre-security (landside)', 90, 'Cathay\'s first class lounge with private cabanas, spa, champagne bar. Among world\'s best.', 5.0, ['cx-first', 'spa', 'cabana', 'champagne'],  70, 'Cathay First or Marco Polo Diamond'),
    rec('hkg-cx-pier',        'lounge', 'The Pier (CX Business)',      'Terminal 1, Level 6 — pre-security',      75, 'Exceptionally designed lounge — outdoor terrace, noodle bar, shower suites. Benchmark business lounge.', 4.9, ['cx-business', 'noodle-bar', 'outdoor', 'design'], 55, 'Cathay Business or oneworld Sapphire+'),
    rec('hkg-crystal-pp',     'lounge', 'Plaza Premium (various)',     'Terminal 1 — multiple airside locations',  45, 'Several Plaza Premium locations. Good Priority Pass option in HKG — warm food, showers.', 4.1, ['priority-pass', 'shower'],                  35, 'Priority Pass membership'),
    rec('hkg-noodles',        'food',   'Ho Hung Kee Noodles',         'Terminal 1 — airside food court',          25, 'Michelin-recommended wontons and egg noodles. Authentic HK flavours in the airport.',    4.7, ['hk-food', 'wonton', 'michelin', 'noodles'],  20),
    rec('hkg-pret',           'coffee', 'Pret A Manger / Pacific Coffee', 'Terminal 1 — multiple airside locations', 12, 'Pacific Coffee is the local equivalent of Starbucks — solid coffees, good HK milk tea.', 3.9, ['coffee', 'quick', 'local'],                 10),
    rec('hkg-city-gate',      'shop',   'Duty Free & City Gate Mall',  'Terminal 1 — Arrival and departure halls',  20, 'Extensive duty-free — Chinese teas, cosmetics, electronics, Moutai. Good value.',       4.2, ['duty-free', 'chinese-tea', 'electronics'],  15),
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// ORD — O'Hare International Airport
// ═══════════════════════════════════════════════════════════════════════════════

const ORD_RECS: TerminalRecommendations = {
  '1': [
    rec('ord-polaris',        'lounge', 'United Polaris Lounge',       'Terminal 1, Level 2 — post-security',     60, 'One of United\'s best lounges — designed for long-haul pax with a focus on rest.',      4.6, ['united-polaris', 'sleep-pods', 'spa'],     45, 'United Polaris (Business Class) ticket'),
    rec('ord-united-club-b6', 'lounge', 'United Club (B6)',            'Terminal 1, Concourse B — Gate B6',       40, 'Reliable United Club — good food, bar, WiFi. Central Concourse B location.',            4.1, ['united-club', 'star-alliance'],             30, 'United status or Club membership'),
  ],
  '3': [
    rec('ord-centurion',      'lounge', 'Amex Centurion Lounge (T3)',  'Terminal 3, post-security',               50, 'Hot food, premium cocktails, spa. Great Chicago-themed food menu.',                    4.6, ['amex-centurion', 'spa', 'cocktails'],      40, 'Amex Centurion or Platinum card'),
    rec('ord-publican',       'food',   'Publican Tavern',             'Terminal 3, airside',                     30, 'Chicago craft beer hall with great food. A genuine, high-quality airport dining experience.', 4.5, ['chicago', 'craft-beer', 'sit-down'],      25),
    rec('ord-deep-dish',      'food',   'Pizzeria Due (Deep Dish)',    'Terminal 3 — airside',                     35, 'Chicago deep-dish pizza — a must-try on a Chicago layover. Filling and satisfying.',   4.4, ['chicago', 'deep-dish', 'iconic'],          25),
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// LAX — Los Angeles International Airport
// ═══════════════════════════════════════════════════════════════════════════════

const LAX_RECS: TerminalRecommendations = {
  'TBIT': [
    rec('lax-star-alliance',  'lounge', 'Star Alliance Lounge (TBIT)', 'Tom Bradley International Terminal, Level 4', 50, 'Excellent lounge with rooftop terrace, spa, and good international food selection.',  4.5, ['star-alliance', 'rooftop', 'spa'],        40, 'Star Alliance Gold or eligible airlines\' Business'),
    rec('lax-air-france-pp',  'lounge', 'Air France Lounge (TBIT)',    'Tom Bradley International, Level 3',         45, 'Top Priority Pass option at LAX — warm food, bar, shower suites, great views.',       4.4, ['priority-pass', 'af-business', 'shower'],  35, 'Air France Business or Priority Pass'),
    rec('lax-urth-caffe',     'coffee', 'Urth Caffé (TBIT)',           'Tom Bradley Terminal, airside',              15, 'LA-favourite organic coffee shop — excellent lattes and pastries. The best coffee at LAX.', 4.6, ['organic', 'la-icon', 'quality'],          12),
  ],
  '4': [
    rec('lax-admirals-aa',    'lounge', 'Admirals Club (T4)',          'Terminal 4, Level 3',                     40, 'Standard AA lounge — good enough for a layover. Hot food, shower available.',            3.9, ['aa-status', 'admirals-club'],              30, 'AA status or Admirals Club membership'),
  ],
  '5': [
    rec('lax-skyclub',        'lounge', 'Delta Sky Club (T5)',         'Terminal 5, post-security',               45, 'Delta\'s LAX lounge with good buffet, cocktail bar, shower suites.',                   4.3, ['delta', 'amex-platinum'],                   35, 'Delta status or Amex Platinum'),
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// Master registry export
// ═══════════════════════════════════════════════════════════════════════════════

export const AIRPORT_RECOMMENDATIONS: AirportRecommendationMap = {
  JFK: JFK_RECS,
  DXB: DXB_RECS,
  CDG: CDG_RECS,
  SIN: SIN_RECS,
  AMS: AMS_RECS,
  FRA: FRA_RECS,
  ATL: ATL_RECS,
  DFW: DFW_RECS,
  LHR: LHR_RECS,
  NRT: NRT_RECS,
  IST: IST_RECS,
  HKG: HKG_RECS,
  ORD: ORD_RECS,
  LAX: LAX_RECS,
};

// ── Lookup helpers ────────────────────────────────────────────────────────────

/**
 * Returns all recommendations for a given airport + terminal.
 * Falls back to the 'all' bucket if the terminal code isn't found.
 */
export function getRecommendationsForTerminal(
  airportCode: string,
  terminalCode: string,
): AirportRecommendation[] {
  const airportRecs = AIRPORT_RECOMMENDATIONS[airportCode.toUpperCase()];
  if (!airportRecs) return [];
  return airportRecs[terminalCode] ?? airportRecs['Main'] ?? airportRecs['all'] ?? [];
}

/**
 * Filters recommendations by type and minimum free-time budget.
 * Returns recs sorted by rating descending.
 */
export function filterRecommendations(
  recs: AirportRecommendation[],
  type: RecommendationType | null,
  freeMinutes: number,
): AirportRecommendation[] {
  return recs
    .filter((r) => (type === null || r.type === type) && r.freeMinutesNeeded <= freeMinutes)
    .sort((a, b) => b.rating - a.rating);
}

/**
 * Returns the single best lounge recommendation for the available free time.
 * Prefers accessible lounges (no access requirement) if free minutes are tight.
 */
export function getBestLounge(
  airportCode: string,
  terminalCode: string,
  freeMinutes: number,
): AirportRecommendation | null {
  const recs = getRecommendationsForTerminal(airportCode, terminalCode);
  const lounges = filterRecommendations(recs, 'lounge', freeMinutes);
  if (lounges.length === 0) return null;
  // Prioritise open-access lounges (Priority Pass / no listed requirement) for concise UX
  const openAccess = lounges.find((l) => !l.accessRequirement || l.accessRequirement.toLowerCase().includes('priority pass'));
  return openAccess ?? lounges[0];
}

/**
 * Returns the best food or coffee recommendation for the available free time.
 */
export function getBestFood(
  airportCode: string,
  terminalCode: string,
  freeMinutes: number,
  preferSitDown: boolean,
): AirportRecommendation | null {
  const recs = getRecommendationsForTerminal(airportCode, terminalCode);
  const foodTypes: RecommendationType[] = preferSitDown ? ['food'] : ['coffee', 'food'];
  const candidates = recs
    .filter((r) => foodTypes.includes(r.type) && r.freeMinutesNeeded <= freeMinutes)
    .sort((a, b) => b.rating - a.rating);
  return candidates[0] ?? null;
}
