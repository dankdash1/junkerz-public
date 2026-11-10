import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import Signup from '@/app/buyers/signup/page';
import OnboardingChecklist from '@/components/buyers/OnboardingChecklist';

// George 2026-11-10: short sign-up (name + address up front, the rest folded),
// photo ID + card required, W-9 optional.
const status = { policy_version: 2, approval_ready: false, payment_ready: false, approved: false, active: false, items: [
  { key: 'w9', label: 'W-9', kind: 'document' as const, required: false, requested: true, completed: false, review_status: 'missing', next_action_url: '/buyers/signup/documents#w9' },
  { key: 'id', label: 'Photo ID', kind: 'document' as const, required: true, requested: true, completed: false, review_status: 'missing', next_action_url: '/buyers/signup/documents#id' },
  { key: 'card', label: 'Card on file', kind: 'payment' as const, required: true, requested: true, completed: false, review_status: 'missing', next_action_url: '/buyers/settings' },
] };
vi.mock('@/lib/buyer-api', () => ({ buyerApi: { signupConfig: vi.fn(async () => ({ required_fields: ['contact_name', 'address'], onboarding: status, form_ticket: 't' })) } }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }));
afterEach(cleanup);

test('name and address are up front and required; extras are folded away', async () => {
  const { container } = render(<Signup />);
  expect(await screen.findByText('Your name *')).toBeTruthy();
  expect(screen.getByText('Yard address *')).toBeTruthy();
  const more = screen.getByText(/More details \(optional\)/).closest('details')!;
  expect(more.hasAttribute('open')).toBe(false);
  expect(more.textContent).toContain('Website');
  expect(more.textContent).toContain('License number');
  expect(container.textContent).toContain('skip those for now');
});

test('card is a required step with its own link, no separate payment line', () => {
  render(<OnboardingChecklist status={status} />);
  expect(screen.getByText('Card on file')).toBeTruthy();
  expect(screen.getByRole('link', { name: 'Complete Card on file' }).getAttribute('href')).toBe('/buyers/settings');
  expect(screen.queryByText('Add a payment method')).toBeNull();
  expect(screen.getByText('W-9').parentElement!.textContent).toContain('optional');
});
