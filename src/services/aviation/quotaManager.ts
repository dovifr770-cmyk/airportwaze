// ─── AviationStack Quota Manager ─────────────────────────────────────────────
// Tracks API usage against the free tier limit (100 calls/month).
// Persists state in localStorage (web) / AsyncStorage (native).
// Auto-resets counter at the start of each calendar month.
// When quota is exhausted → caller falls back to static database.

import { Platform } from 'react-native';

const STORAGE_KEY  = 'aviationstack_quota';
const FREE_LIMIT   = 100; // calls per month on the free plan

interface QuotaState {
  count:    number;   // calls used this month
  month:    string;   // "YYYY-MM" — resets when month changes
  lastCall: number;   // ms timestamp of last API call
}

// ── Storage adapter (web = localStorage, native = AsyncStorage) ────────────────

async function read(): Promise<QuotaState | null> {
  try {
    const raw =
      Platform.OS === 'web'
        ? localStorage.getItem(STORAGE_KEY)
        : (await import('@react-native-async-storage/async-storage')).default
            .then(m => m.getItem(STORAGE_KEY));

    const str = typeof raw === 'string' ? raw : await raw;
    return str ? (JSON.parse(str) as QuotaState) : null;
  } catch {
    return null;
  }
}

async function write(state: QuotaState): Promise<void> {
  try {
    const str = JSON.stringify(state);
    if (Platform.OS === 'web') {
      localStorage.setItem(STORAGE_KEY, str);
    } else {
      const AS = (await import('@react-native-async-storage/async-storage')).default;
      await (await AS).setItem(STORAGE_KEY, str);
    }
  } catch {
    // Silently fail — worst case we undercount
  }
}

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns current quota usage without incrementing.
 */
export async function getQuotaStatus(): Promise<{
  used: number;
  limit: number;
  remaining: number;
  hasQuota: boolean;
  resetsAt: string;
}> {
  const state = await read();
  const month = currentMonth();

  const used = (state && state.month === month) ? state.count : 0;
  const remaining = Math.max(0, FREE_LIMIT - used);

  // Next reset: first day of next month
  const [y, m] = month.split('-').map(Number);
  const nextMonth = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;

  return {
    used,
    limit: FREE_LIMIT,
    remaining,
    hasQuota: remaining > 0,
    resetsAt: `${nextMonth}-01`,
  };
}

/**
 * Checks if a call can be made and increments the counter.
 * Returns true if the call is allowed, false if quota is exhausted.
 */
export async function consumeQuota(): Promise<boolean> {
  const month = currentMonth();
  const state = await read();

  // If new month, reset counter
  const current: QuotaState =
    state && state.month === month
      ? state
      : { count: 0, month, lastCall: 0 };

  if (current.count >= FREE_LIMIT) {
    return false; // Quota exhausted — use fallback
  }

  current.count   += 1;
  current.lastCall = Date.now();
  await write(current);
  return true;
}

/**
 * Returns true if AviationStack is configured AND quota remains.
 */
export async function canUseAviationStack(): Promise<boolean> {
  const key = process.env.EXPO_PUBLIC_AVIATION_STACK_KEY;
  if (!key || key.startsWith('your-') || key === '') return false;
  return consumeQuota();
}
