import test from 'node:test';
import assert from 'node:assert/strict';
import { TIME_WINDOWS, WINDOW_START_HOUR, formatCentral, isTimeWindow, schedulePayload, quickPickDate, windowForQuickPick } from '../src/lib/seller-schedule.ts';

process.env.TZ = 'America/Los_Angeles';
test('custom evening keeps seller calendar date across UTC midnight', () => {
  const selected = new Date(2026, 8, 15, 17);
  assert.deepEqual(schedulePayload(selected), {
    pickup_date: '2026-09-15', eta_at: '2026-09-16T00:00:00.000Z',
  });
});
test('a chosen window travels next to pickup_date and eta_at, verbatim', () => {
  const selected = new Date(2026, 8, 15, 17);
  assert.deepEqual(schedulePayload(selected, '5pm-7pm'), {
    pickup_date: '2026-09-15', eta_at: '2026-09-16T00:00:00.000Z', window: '5pm-7pm',
  });
  assert.equal('window' in schedulePayload(selected), false);
});
test('the seven two-hour windows are unchanged and each names its start hour', () => {
  assert.deepEqual([...TIME_WINDOWS], ['7am-9am', '9am-11am', '11am-1pm', '1pm-3pm', '3pm-5pm', '5pm-7pm', '7pm-9pm']);
  assert.deepEqual(TIME_WINDOWS.map((w) => WINDOW_START_HOUR[w]), [7, 9, 11, 13, 15, 17, 19]);
  assert.equal(isTimeWindow('1pm-3pm'), true);
  assert.equal(isTimeWindow('1pm-4pm'), false);
});
test('quick picks name the window the backend uses, except an immediate pickup', () => {
  assert.equal(windowForQuickPick('tomorrow_am'), '9am-11am');
  assert.equal(windowForQuickPick('tomorrow_pm'), '1pm-3pm');
  assert.equal(windowForQuickPick('in_2_days'), '9am-11am');
  assert.equal(windowForQuickPick('this_weekend'), '9am-11am');
  assert.equal(windowForQuickPick('immediately'), undefined);
  assert.equal(windowForQuickPick('tomorrow_am', 'Tomorrow, 7am-9am'), '7am-9am');
});
test('confirmation times are printed on the Central clock regardless of the browser zone', () => {
  // 18:00Z on 2026-09-16 is 1:00 PM CDT; this process is on Pacific time.
  assert.equal(formatCentral('2026-09-16T18:00:00Z'), 'Wed, Sep 16, 1:00 PM');
  assert.equal(formatCentral('2026-12-16T15:00:00Z'), 'Wed, Dec 16, 9:00 AM');
  assert.equal(formatCentral('garbage'), null);
});
test('quick picks resolve against seller day near UTC midnight', () => {
  const now = new Date(2026, 8, 13, 22);
  const d = quickPickDate('in_2_days', now);
  assert.equal(schedulePayload(d).pickup_date, '2026-09-15');
  assert.equal(d.getHours(), 10);
  assert.equal(quickPickDate('tomorrow_pm', now).getHours(), 14);
  assert.equal(schedulePayload(quickPickDate('tomorrow_am', now)).pickup_date, '2026-09-14');
});
test('immediate means 24 hours and weekend matches Saturday rule', () => {
  const now = new Date(2026, 8, 13, 10);
  assert.equal(quickPickDate('immediately', now).getTime() - now.getTime(), 24*60*60*1000);
  assert.equal(schedulePayload(quickPickDate('this_weekend', now)).pickup_date, '2026-09-19');
});
