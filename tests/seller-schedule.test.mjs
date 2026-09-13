import test from 'node:test';
import assert from 'node:assert/strict';
import { schedulePayload, quickPickDate } from '../src/lib/seller-schedule.ts';

process.env.TZ = 'America/Los_Angeles';
test('custom evening keeps seller calendar date across UTC midnight', () => {
  const selected = new Date(2026, 8, 15, 17);
  assert.deepEqual(schedulePayload(selected), {
    pickup_date: '2026-09-15', eta_at: '2026-09-16T00:00:00.000Z',
  });
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
