/** Keep the seller's calendar date alongside the UTC travel timestamp. */
export function schedulePayload(selected: Date) {
  const year = selected.getFullYear();
  const month = String(selected.getMonth() + 1).padStart(2, '0');
  const day = String(selected.getDate()).padStart(2, '0');
  return { pickup_date: `${year}-${month}-${day}`, eta_at: selected.toISOString() };
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
