// 2026-11-09: the bid-rule "what cars do you want" rebuild (George's approved layout).
// Each make carries its own years and models; the form reads back what the buyer
// asked for; English or Spanish; Save ends in "Saved" or "Not saved".
import React from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  describeWants, displayMake, wantsFromRule, wantsPayload, wantsProblem, type WantsState,
} from '@/lib/rule-wants';
import BidRuleForm from '@/components/buyers/BidRuleForm';
import { ruleSummary } from '@/components/buyers/RuleFields';

const api = vi.hoisted(() => ({
  me: vi.fn(), setLanguage: vi.fn(), getRule: vi.fn(), createRule: vi.fn(), updateRule: vi.fn(),
  testRule: vi.fn(), zipLookup: vi.fn(), places: vi.fn(),
}));
const replace = vi.hoisted(() => vi.fn());
vi.mock('@/lib/buyer-api', () => ({ buyerApi: api }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));

const MAKES = [{ id: 4268, name: 'FORD' }, { id: 4279, name: 'HONDA' }, { id: 4263, name: 'TOYOTA' }];
const MODELS: Record<string, { name: string; category: string }[]> = {
  '4263': [{ name: 'Camry', category: 'car' }, { name: 'Tacoma', category: 'truck' }, { name: 'Tundra', category: 'truck' }],
  '4279': [{ name: 'Accord', category: 'car' }, { name: 'CR-V', category: 'suv' }, { name: 'Civic', category: 'car' }],
  '4268': [{ name: 'F-150', category: 'truck' }, { name: 'Focus', category: 'car' }],
};
const fetchMock = vi.fn();
let store: Record<string, string> = {};

beforeEach(() => {
  vi.resetAllMocks();
  store = {};
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: vi.fn((k: string) => store[k] ?? null),
      setItem: vi.fn((k: string, v: string) => { store[k] = v; }),
      removeItem: vi.fn((k: string) => { delete store[k]; }),
    },
  });
  window.history.replaceState({}, '', '/buyers/bid-rules/new');
  api.me.mockResolvedValue({ preferred_language: 'en' });
  api.setLanguage.mockResolvedValue({ ok: true });
  fetchMock.mockImplementation(async (url: string) => {
    const u = new URL(url, 'https://junkerz.test');
    if (u.pathname.endsWith('/makes/by-category')) {
      const cats = u.searchParams.get('categories');
      // Trucks narrow the list: Honda builds no truck in this fixture.
      const makes = cats === 'truck' ? MAKES.filter((m) => m.name !== 'HONDA') : MAKES;
      return new Response(JSON.stringify({ makes }));
    }
    if (u.pathname.endsWith('/models/by-make')) {
      return new Response(JSON.stringify({ models: MODELS[u.searchParams.get('make_id') ?? ''] ?? [] }));
    }
    return new Response('{}', { status: 404 });
  });
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(cleanup);

// ---- pure: reading old rules, the payload, the read-back list -------------------

const certain = (cards: Partial<WantsState['cards'][number]>[]): WantsState => ({
  mode: 'certain', year_min: '', year_max: '', legacyModels: [],
  cards: cards.map((c, i) => ({ key: `k${i}`, make: '', make_id: null, year_min: '', year_max: '', models: [], ...c })),
});

test('buyer 2087 rule 732 (no makes, 2005-2018) opens as Any make 2005-2018 and saves the same fields', () => {
  const w = wantsFromRule({ year_min: 2005, year_max: 2018, makes: null, models: null, make_ids: null, model_ids: null });
  expect(w).toMatchObject({ mode: 'any', year_min: '2005', year_max: '2018', cards: [] });
  expect(wantsPayload(w)).toEqual({
    year_min: 2005, year_max: 2018, makes: null, make_ids: null, model_ids: null, models: null, vehicle_wants: null,
  });
  expect(describeWants([], w, 'en').lines).toEqual(['Any make, any type, 2005–2018']);
});

test('an older rule with one year range and a list of makes becomes one card per make with that range', () => {
  const w = wantsFromRule({
    year_min: 2010, year_max: 2020, makes: ['Honda'], make_ids: [4263],
    make_names: { '4263': 'TOYOTA' },
  });
  expect(w.mode).toBe('certain');
  expect(w.cards.map((c) => [c.make, c.make_id, c.year_min, c.year_max, c.models])).toEqual([
    ['Honda', null, '2010', '2020', []],
    ['TOYOTA', 4263, '2010', '2020', []],
  ]);
  const p = wantsPayload(w);
  expect(p).toMatchObject({ year_min: null, year_max: null, makes: null, make_ids: null, model_ids: null, models: null });
  expect(p.vehicle_wants).toEqual([
    { make: 'Honda', make_id: null, year_min: 2010, year_max: 2020, models: [] },
    { make: 'TOYOTA', make_id: 4263, year_min: 2010, year_max: 2020, models: [] },
  ]);
});

test("George's 11-09 Toyota rule (make_ids only, no years) shows TOYOTA, any year, not 'Make #4263'", () => {
  const w = wantsFromRule({ make_ids: [4263], make_names: { '4263': 'TOYOTA' } });
  expect(describeWants([], w, 'en').lines).toEqual(['Toyota, any model, any type, any year']);
});

test('old picked model ids keep their names on their own make; typed models apply to every make', () => {
  const w = wantsFromRule({
    makes: ['Honda'], models: ['Civic E2E'], model_ids: [77],
    model_names: { '77': { name: 'Tacoma', make_id: 4263, make: 'TOYOTA' } },
  });
  expect(w.cards.map((c) => [c.make, c.models])).toEqual([
    ['Honda', ['Civic E2E']],
    ['TOYOTA', ['Civic E2E', 'Tacoma']],
  ]);
});

test('typed models with no make are kept, shown and saved unchanged', () => {
  const w = wantsFromRule({ models: ['Camry'] });
  expect(w).toMatchObject({ mode: 'any', legacyModels: ['Camry'] });
  expect(wantsPayload(w).models).toEqual(['Camry']);
});

test('cards saved before read back as cards, with each make keeping its own years', () => {
  const w = wantsFromRule({ vehicle_wants: [
    { make: 'TOYOTA', make_id: 4263, year_min: 2008, year_max: 2018, models: [] },
    { make: 'HONDA', make_id: 4279, year_min: 2010, year_max: 2020, models: ['Civic', 'Accord'] },
  ] });
  expect(describeWants(['truck'], w, 'en').lines).toEqual([
    'Toyota trucks, any model, 2008–2018',
    'Honda Civic and Accord trucks, 2010–2020',
  ]);
  expect(describeWants(['truck'], w, 'es').lines).toEqual([
    'Pickups Toyota, cualquier modelo, 2008–2018',
    'Honda Civic y Accord (pickups), 2010–2020',
  ]);
});

test('a model outside the picked types is called out instead of silently matching nothing', () => {
  const w = certain([{ make: 'HONDA', make_id: 4279, year_min: '2010', year_max: '2020', models: ['Civic'] }]);
  const out = describeWants(['truck'], w, 'en', { civic: 'car' });
  expect(out.warnings).toEqual([
    'Honda Civic is not one of the types you picked (trucks), so this rule will never take it.',
  ]);
  expect(describeWants(['car'], w, 'en', { civic: 'car' }).warnings).toEqual([]);
});

test('problems: no make, an empty card, years backwards', () => {
  expect(wantsProblem(certain([]))).toEqual({ kind: 'needOneMake' });
  expect(wantsProblem(certain([{ make: '' }]))).toEqual({ kind: 'cardNeedsMake' });
  expect(wantsProblem(certain([{ make: 'TOYOTA', year_min: '2018', year_max: '2008' }])))
    .toEqual({ kind: 'cardYearOrder', make: 'Toyota' });
  expect(wantsProblem({ mode: 'any', year_min: '2020', year_max: '2005', cards: [], legacyModels: [] }))
    .toEqual({ kind: 'yearOrder' });
});

test('make names read naturally but are never translated', () => {
  expect(displayMake('TOYOTA')).toBe('Toyota');
  expect(displayMake('LAND ROVER')).toBe('Land Rover');
  expect(displayMake('MERCEDES-BENZ')).toBe('Mercedes-Benz');
  expect(displayMake('BMW')).toBe('BMW');
  expect(displayMake('Honda')).toBe('Honda');
});

test('the rules list reads make cards the way the form does', () => {
  expect(ruleSummary({
    vehicle_categories: ['truck'],
    vehicle_wants: [{ make: 'TOYOTA', make_id: 4263, year_min: 2008, year_max: 2018, models: [] }],
  })).toBe('Toyota trucks, any model, 2008–2018 · anywhere');
});

// ---- the page --------------------------------------------------------------------

async function pickOption(select: HTMLElement, label: string) {
  await waitFor(() => expect(within(select).getByRole('option', { name: label })).toBeTruthy());
  await userEvent.selectOptions(select, within(select).getByRole('option', { name: label }));
}

test('new rule: Trucks + Toyota 2008-2018, any model — the list reads it back and Save sends one card', async () => {
  api.createRule.mockResolvedValue({ id: 901 });
  render(<BidRuleForm />);
  await userEvent.type(screen.getByLabelText('Bid amount ($)'), '500');
  await userEvent.click(screen.getByRole('button', { name: 'Trucks' }));
  // One place for years: Any make shows a range; Only certain makes hides it.
  expect(screen.getByLabelText('From year')).toBeTruthy();
  await userEvent.click(screen.getByRole('radio', { name: 'Only certain makes' }));
  expect(screen.queryByLabelText('From year')).toBeNull();

  const card = screen.getByTestId('make-card');
  const make = within(card).getByLabelText('Make');
  await waitFor(() => expect(within(make).queryByRole('option', { name: 'Honda' })).toBeNull()); // trucks narrow makes
  await pickOption(make, 'Toyota');
  await userEvent.selectOptions(within(card).getByLabelText('Toyota: From year'), '2008');
  await userEvent.selectOptions(within(card).getByLabelText('Toyota: To year'), '2018');
  // models offered are Toyota trucks only
  const models = within(card).getByLabelText('Toyota: Models');
  await waitFor(() => expect(within(models).getByRole('option', { name: 'Tacoma' })).toBeTruthy());
  expect(within(models).queryByRole('option', { name: 'Camry' })).toBeNull();
  expect(within(models).getByRole('option', { name: 'Any model' })).toBeTruthy();

  expect(screen.getByTestId('you-will-get').textContent).toBe('Toyota trucks, any model, 2008–2018');
  // no "+ Add make" / "+ Add model" buttons any more
  expect(screen.queryByRole('button', { name: '+ Add make' })).toBeNull();
  expect(screen.queryByRole('button', { name: '+ Add model' })).toBeNull();

  await userEvent.click(screen.getByRole('button', { name: 'Save' }));
  await waitFor(() => expect(api.createRule).toHaveBeenCalledOnce());
  expect(api.createRule.mock.calls[0][0]).toMatchObject({
    bid_cents: 50000,
    vehicle_categories: ['truck'],
    year_min: null, year_max: null, makes: null, make_ids: null, model_ids: null, models: null,
    vehicle_wants: [{ make: 'TOYOTA', make_id: 4263, year_min: 2008, year_max: 2018, models: [] }],
  });
  // the edit page reads it back from the server and shows Saved
  expect(replace).toHaveBeenCalledWith('/buyers/bid-rules/901?saved=1');
});

test('a second make starts with the years of the card above; models are picked from the dropdown', async () => {
  api.createRule.mockResolvedValue({ id: 902 });
  render(<BidRuleForm />);
  await userEvent.type(screen.getByLabelText('Bid amount ($)'), '300');
  await userEvent.click(screen.getByRole('radio', { name: 'Only certain makes' }));
  let cards = screen.getAllByTestId('make-card');
  await pickOption(within(cards[0]).getByLabelText('Make'), 'Toyota');
  await userEvent.selectOptions(within(cards[0]).getByLabelText('Toyota: From year'), '2010');
  await userEvent.selectOptions(within(cards[0]).getByLabelText('Toyota: To year'), '2020');
  await userEvent.click(screen.getByRole('button', { name: '+ Add another make' }));
  cards = screen.getAllByTestId('make-card');
  await pickOption(within(cards[1]).getByLabelText('Make'), 'Honda');
  expect((within(cards[1]).getByLabelText('Honda: From year') as HTMLSelectElement).value).toBe('2010');
  expect((within(cards[1]).getByLabelText('Honda: To year') as HTMLSelectElement).value).toBe('2020');
  await pickOption(within(cards[1]).getByLabelText('Honda: Models'), 'Civic');
  await pickOption(within(cards[1]).getByLabelText('Honda: Models'), 'Accord');
  expect(within(cards[1]).getByLabelText('Honda: Models').querySelector('option')?.textContent).toBe('Add a model');
  expect(screen.getByTestId('you-will-get').textContent).toBe(
    'Toyota, any model, any type, 2010–2020' + 'Honda Civic and Accord, any type, 2010–2020');
  await userEvent.click(within(cards[1]).getByRole('button', { name: 'Remove Accord' }));
  await userEvent.click(screen.getByRole('button', { name: 'Save' }));
  await waitFor(() => expect(api.createRule).toHaveBeenCalledOnce());
  expect(api.createRule.mock.calls[0][0].vehicle_wants).toEqual([
    { make: 'TOYOTA', make_id: 4263, year_min: 2010, year_max: 2020, models: [] },
    { make: 'HONDA', make_id: 4279, year_min: 2010, year_max: 2020, models: ['Civic'] },
  ]);
});

test('an empty card is refused with a red Not saved, and nothing is sent', async () => {
  render(<BidRuleForm />);
  await userEvent.type(screen.getByLabelText('Bid amount ($)'), '300');
  await userEvent.click(screen.getByRole('radio', { name: 'Only certain makes' }));
  await userEvent.click(screen.getByRole('button', { name: 'Save' }));
  expect((await screen.findByRole('alert')).textContent).toBe(
    'Not saved: Pick a make on every card, or remove the empty card.');
  expect(api.createRule).not.toHaveBeenCalled();
});

test("edit: George's Toyota rule opens as a Toyota card; Save shows green Saved after reading back", async () => {
  window.history.replaceState({}, '', '/buyers/bid-rules/734');
  const rule734 = {
    id: 734, name: 'Toyota', bid_cents: 90000, active: true, year_min: null, year_max: null,
    makes: null, models: null, make_ids: [4263], model_ids: null, vehicle_wants: null,
    make_names: { '4263': 'TOYOTA' }, model_names: {}, vehicle_categories: null,
    conditions: ['runs'], title_statuses: ['clean'], zip_center: '76102', zip_radius_miles: 50,
  };
  const savedBack = { ...rule734, make_ids: null,
    vehicle_wants: [{ make: 'TOYOTA', make_id: 4263, year_min: 2008, year_max: 2018, models: [] }] };
  api.getRule.mockResolvedValueOnce(rule734).mockResolvedValueOnce(savedBack);
  api.updateRule.mockResolvedValue({ ok: true });
  api.zipLookup.mockResolvedValue({ zip: '76102', city: 'Fort Worth', state: 'TX' });
  render(<BidRuleForm ruleId={734} />);
  const card = await screen.findByTestId('make-card');
  expect((within(card).getByLabelText('Make') as HTMLSelectElement).value).toBe('4263');
  expect(screen.getByTestId('you-will-get').textContent).toBe('Toyota, any model, any type, any year');
  await userEvent.selectOptions(within(card).getByLabelText('Toyota: From year'), '2008');
  await userEvent.selectOptions(within(card).getByLabelText('Toyota: To year'), '2018');
  await userEvent.click(screen.getByRole('button', { name: 'Save' }));
  expect((await screen.findByRole('status')).textContent).toContain('Saved');
  expect(api.updateRule.mock.calls[0][0]).toBe(734);
  expect(api.updateRule.mock.calls[0][1]).toMatchObject({
    make_ids: null, makes: null, year_min: null, year_max: null,
    vehicle_wants: [{ make: 'TOYOTA', make_id: 4263, year_min: 2008, year_max: 2018, models: [] }],
  });
  expect(api.getRule).toHaveBeenCalledTimes(2);
  // changing anything after Save takes the green Saved away until the next Save
  await userEvent.selectOptions(within(screen.getByTestId('make-card')).getByLabelText('Toyota: To year'), '2019');
  expect(screen.queryByRole('status')).toBeNull();
});

test('edit: a refused save says Not saved with the reason', async () => {
  api.getRule.mockResolvedValue({ id: 5, bid_cents: 1000, active: true, year_min: 2005, year_max: 2018 });
  api.updateRule.mockRejectedValue(new Error('radius_needs_zip_center'));
  render(<BidRuleForm ruleId={5} />);
  await userEvent.click(await screen.findByRole('button', { name: 'Save' }));
  expect((await screen.findByRole('alert')).textContent).toBe(
    'Not saved: Pick the town for the circle from the list.');
  expect(screen.queryByRole('status')).toBeNull();
});

test('Español: labels, the You will get list and the save message are in Spanish, and the choice is saved', async () => {
  api.createRule.mockRejectedValue(new Error('bad_bid_cents'));
  render(<BidRuleForm />);
  await userEvent.click(screen.getByRole('button', { name: 'Español' }));
  expect(api.setLanguage).toHaveBeenCalledWith('es');
  expect(store.buyer_lang).toBe('es');
  expect(screen.getByRole('heading', { name: 'Nueva regla de oferta' })).toBeTruthy();
  expect(screen.getByText('¿Qué compra?')).toBeTruthy();
  expect(screen.getByText('Tipos de vehículo')).toBeTruthy();
  expect(screen.getByText('Dónde está el carro')).toBeTruthy();
  expect(screen.getByText('Filtros de condición')).toBeTruthy();
  await userEvent.click(screen.getByRole('button', { name: 'Pickups' }));
  await userEvent.click(screen.getByRole('radio', { name: 'Solo ciertas marcas' }));
  const card = screen.getByTestId('make-card');
  await pickOption(within(card).getByLabelText('Marca'), 'Toyota');
  await userEvent.selectOptions(within(card).getByLabelText('Toyota: Año desde'), '2008');
  await userEvent.selectOptions(within(card).getByLabelText('Toyota: Año hasta'), '2018');
  expect(screen.getByText('Recibirá:')).toBeTruthy();
  expect(screen.getByTestId('you-will-get').textContent).toBe('Pickups Toyota, cualquier modelo, 2008–2018');
  // the browser refuses an empty bid; a server refusal comes back in Spanish too
  await userEvent.type(screen.getByLabelText('Monto de la oferta ($)'), '5');
  await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));
  expect((await screen.findByRole('alert')).textContent).toBe(
    'No se guardó: La oferta debe ser una cantidad mayor que cero.');
});

test("the account's language opens the form in Spanish", async () => {
  api.me.mockResolvedValue({ preferred_language: 'es' });
  render(<BidRuleForm />);
  expect(await screen.findByRole('heading', { name: 'Nueva regla de oferta' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Guardar' })).toBeTruthy();
  expect(api.setLanguage).not.toHaveBeenCalled();
});

test('the page has no English left when in Spanish (every visible label switches)', async () => {
  api.me.mockResolvedValue({ preferred_language: 'es' });
  window.history.replaceState({}, '', '/buyers/bid-rules/7');
  api.getRule.mockResolvedValue({ id: 7, bid_cents: 1000, active: true, year_min: 2005, year_max: 2018,
    area_codes: ['817'], daily_count_used: 1 });
  render(<BidRuleForm ruleId={7} />);
  await screen.findByRole('heading', { name: 'Editar regla de oferta #7' });
  const text = document.body.textContent ?? '';
  for (const english of ['Save', 'Cancel', 'Vehicle types', 'What do you buy', 'You will get', 'Conditions',
    'Title statuses', 'Where the car is', 'Weekly budget', 'Who pays', 'Condition Filters', 'Priority',
    'Notification channels', 'Status', 'Used so far', 'area codes', 'Backtest', 'Any make', 'Years']) {
    expect(text.includes(english), `still English: ${english}`).toBe(false);
  }
});
