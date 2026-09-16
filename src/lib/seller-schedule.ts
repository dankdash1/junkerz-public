// George 2026-09-15: seven two-hour windows, the same list the admin uses.
// Every window is a Central-time (America/Chicago) window: the backend keys
// its own pickup_time.WINDOWS by these exact labels.
export const TIME_WINDOWS = [
  '7am-9am', '9am-11am', '11am-1pm', '1pm-3pm', '3pm-5pm', '5pm-7pm', '7pm-9pm',
] as const;
export type TimeWindow = typeof TIME_WINDOWS[number];

// Map the human-readable window to the START hour (24h) so we can build
// a real ISO timestamp for the backend's eta_at column. Without this,
// the backend stored NULL eta_at and the calendar bucketed the pickup
// to today instead of the chosen date (George 2026-05-18 bug report).
export const WINDOW_START_HOUR: Record<TimeWindow, number> = {
  '7am-9am': 7,
  '9am-11am': 9,
  '11am-1pm': 11,
  '1pm-3pm': 13,
  '3pm-5pm': 15,
  '5pm-7pm': 17,
  '7pm-9pm': 19,
};

export const PICKUP_TIME_ZONE = 'America/Chicago';

export function isTimeWindow(value: unknown): value is TimeWindow {
  return typeof value === 'string' && (TIME_WINDOWS as readonly string[]).includes(value);
}

/** Keep the seller's calendar date alongside the UTC travel timestamp, plus the window label when one was chosen. */
export function schedulePayload(selected: Date, window?: TimeWindow) {
  const year = selected.getFullYear();
  const month = String(selected.getMonth() + 1).padStart(2, '0');
  const day = String(selected.getDate()).padStart(2, '0');
  const payload: { pickup_date: string; eta_at: string; window?: TimeWindow } = {
    pickup_date: `${year}-${month}-${day}`, eta_at: selected.toISOString(),
  };
  if (window) payload.window = window;
  return payload;
}

/**
 * The window a quick pick lands in. Quick picks are the backend's own
 * shortcuts (tomorrow morning = 9am-11am, tomorrow afternoon = 1pm-3pm);
 * "immediately" is a 24-hour promise, not a window, so it sends none.
 * A label that spells out one of the seven windows wins over the key.
 */
export function windowForQuickPick(key: string, label = ''): TimeWindow | undefined {
  const spelled = TIME_WINDOWS.find((window) => label.includes(window));
  if (spelled) return spelled;
  if (key === 'tomorrow_pm') return '1pm-3pm';
  if (['tomorrow_am', 'in_2_days', 'this_weekend'].includes(key)) return '9am-11am';
  return undefined;
}

/** "Tue, Sep 16, 9:00 AM" on the Central clock, for the confirmation screen. */
export function formatCentral(iso: string): string | null {
  const when = new Date(iso);
  if (Number.isNaN(when.getTime())) return null;
  // Newer ICU puts a narrow no-break space before AM/PM; a plain space reads
  // (and copies) the same everywhere.
  return new Intl.DateTimeFormat('en-US', {
    timeZone: PICKUP_TIME_ZONE, weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  }).format(when).replace(/ /g, ' ');
}

export function quickPickDate(key: string, now = new Date()): Date {
  const selected = new Date(now);
  if (key === 'immediately') {
    return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }
  if (key === 'this_weekend') {
    selected.setDate(selected.getDate() + ((6 - selected.getDay() + 7) % 7 || 7));
    selected.setHours(selected.getHours() + 2);
    return selected;
  }
  if (!['tomorrow_am', 'tomorrow_pm', 'in_2_days'].includes(key)) {
    throw new Error('Unknown pickup window');
  }
  selected.setDate(selected.getDate() + (key === 'in_2_days' ? 2 : 1));
  selected.setHours(key === 'tomorrow_pm' ? 14 : 10, 0, 0, 0);
  return selected;
}
