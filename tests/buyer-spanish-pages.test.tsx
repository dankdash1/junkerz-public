// 2026-11-10 (George): the English / Español switch on the buyer pages changes the
// WHOLE page, not just the bid-rule form. Sign-up, login, the menu, documents,
// dashboard + checklist and the bid-rules list, in both languages.
import React from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BuyersLayout from '@/app/buyers/layout';
import Signup from '@/app/buyers/signup/page';
import Login from '@/app/buyers/login/page';
import Dashboard from '@/app/buyers/dashboard/page';
import Documents from '@/app/buyers/signup/documents/page';
import BidRulesList from '@/app/buyers/bid-rules/page';
import BidRuleForm from '@/components/buyers/BidRuleForm';
import { BUYER_TEXT_TABLES } from '@/components/buyers/buyerText';
import { ruleText } from '@/components/buyers/ruleText';

const api = vi.hoisted(() => ({
  signupConfig: vi.fn(), signup: vi.fn(), login: vi.fn(), me: vi.fn(), setLanguage: vi.fn(),
  onboardingStatus: vi.fn(), listRules: vi.fn(), uploadDocument: vi.fn(), signTerms: vi.fn(),
  getRule: vi.fn(), createRule: vi.fn(), updateRule: vi.fn(), testRule: vi.fn(), zipLookup: vi.fn(), places: vi.fn(),
}));
const replace = vi.hoisted(() => vi.fn());
const nav = vi.hoisted(() => ({ path: '/buyers/signup' }));
vi.mock('@/lib/buyer-api', () => ({ buyerApi: api }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  usePathname: () => nav.path,
  useParams: () => ({}),
}));

const status = { policy_version: 2, approval_ready: false, payment_ready: false, approved: false, active: false, items: [
  { key: 'w9', label: 'W-9', kind: 'document' as const, required: false, requested: true, completed: false, review_status: 'missing', next_action_url: '/buyers/signup/documents#w9' },
  { key: 'id', label: 'Photo ID', kind: 'document' as const, required: true, requested: true, completed: false, review_status: 'missing', next_action_url: '/buyers/signup/documents#id' },
  { key: 'terms', label: 'Sign Terms of Service', kind: 'terms' as const, required: true, requested: true, completed: false, review_status: 'missing', next_action_url: '/buyers/signup/documents#terms' },
  { key: 'card', label: 'Card on file', kind: 'payment' as const, required: true, requested: true, completed: false, review_status: 'missing', next_action_url: '/buyers/settings' },
] };

let store: Record<string, string> = {};
let browserLanguages: string[] = ['en-US'];

function at(path: string, search = '') {
  nav.path = path;
  window.history.replaceState({}, '', path + search);
}

beforeEach(() => {
  vi.resetAllMocks();
  store = {};
  browserLanguages = ['en-US'];
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: vi.fn((k: string) => store[k] ?? null),
      setItem: vi.fn((k: string, v: string) => { store[k] = v; }),
      removeItem: vi.fn((k: string) => { delete store[k]; }),
    },
  });
  Object.defineProperty(window.navigator, 'languages', { configurable: true, get: () => browserLanguages });
  Object.defineProperty(window.navigator, 'language', { configurable: true, get: () => browserLanguages[0] });
  api.signupConfig.mockResolvedValue({ required_fields: [], all_fields: [], onboarding: status, form_ticket: 'ticket-1' });
  api.setLanguage.mockResolvedValue({ ok: true });
  api.me.mockResolvedValue({ business_name: 'Yonke Fort Worth', active: false, balance_cents: 0 });
  api.onboardingStatus.mockResolvedValue(status);
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ makes: [], models: [] }))));
  at('/buyers/signup');
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const signupPage = () => render(<BuyersLayout><Signup /></BuyersLayout>);

// ---- the sign-up page --------------------------------------------------------

test('sign-up: Español turns the whole page Spanish, English turns it back', async () => {
  signupPage();
  expect(await screen.findByRole('heading', { name: 'Create Junkerz Buyer Account' })).toBeTruthy();
  expect(await screen.findByText("What you'll need before you can win cars")).toBeTruthy();
  expect(screen.getByText(/Reply STOP to opt out/)).toBeTruthy();

  await userEvent.click(screen.getByRole('button', { name: 'Español' }));
  expect(screen.getByRole('heading', { name: 'Crear su cuenta de comprador en Junkerz' })).toBeTruthy();
  expect(screen.getByText('Su nombre')).toBeTruthy();
  expect(screen.getByText('Dirección de la yarda')).toBeTruthy();
  expect(screen.getByText('Datos para entrar')).toBeTruthy();
  expect(screen.getByText('Datos del negocio')).toBeTruthy();
  expect(screen.getByText(/Más datos \(opcional\)/)).toBeTruthy();
  expect(screen.getByText(/Responda STOP para cancelar/)).toBeTruthy();
  expect(screen.getByRole('link', { name: 'Política de privacidad' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Crear cuenta y continuar' })).toBeTruthy();
  // the checklist preview follows too
  expect(screen.getByText('Lo que necesita antes de poder ganar carros')).toBeTruthy();
  expect(screen.getByText('Identificación con foto')).toBeTruthy();
  expect(document.body.textContent).not.toContain('Create account + continue');
  expect(document.body.textContent).not.toContain('Business profile');
  expect(store.buyer_lang).toBe('es');
  expect(screen.getByRole('button', { name: 'Español' }).getAttribute('aria-pressed')).toBe('true');

  await userEvent.click(screen.getByRole('button', { name: 'English' }));
  expect(screen.getByRole('heading', { name: 'Create Junkerz Buyer Account' })).toBeTruthy();
  expect(screen.getByText('Your name')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Create account + continue' })).toBeTruthy();
  expect(store.buyer_lang).toBe('en');
  // a visitor with no login is never sent to the account (that would bounce them to login)
  expect(api.me).not.toHaveBeenCalled();
  expect(api.setLanguage).not.toHaveBeenCalled();
});

test('sign-up: ?lang=es opens in Spanish and is remembered', async () => {
  at('/buyers/signup', '?lang=es');
  signupPage();
  expect(await screen.findByRole('heading', { name: 'Crear su cuenta de comprador en Junkerz' })).toBeTruthy();
  expect(store.buyer_lang).toBe('es');
});

test('sign-up: ?lang=en wins over a remembered Spanish choice', async () => {
  store.buyer_lang = 'es';
  at('/buyers/signup', '?lang=en');
  signupPage();
  expect(await screen.findByRole('heading', { name: 'Create Junkerz Buyer Account' })).toBeTruthy();
  expect(store.buyer_lang).toBe('en');
});

test('sign-up: a Spanish browser opens in Spanish when nothing is remembered', async () => {
  browserLanguages = ['es-MX', 'en'];
  signupPage();
  expect(await screen.findByRole('heading', { name: 'Crear su cuenta de comprador en Junkerz' })).toBeTruthy();
});

test('sign-up: a remembered English choice beats a Spanish browser', async () => {
  browserLanguages = ['es-US'];
  store.buyer_lang = 'en';
  signupPage();
  await waitFor(() => expect(screen.getByRole('button', { name: 'English' }).getAttribute('aria-pressed')).toBe('true'));
  expect(screen.getByRole('heading', { name: 'Create Junkerz Buyer Account' })).toBeTruthy();
});

async function fillSignup(container: HTMLElement) {
  const email = container.querySelector('main input[type="email"]') as HTMLInputElement;
  const password = container.querySelector('main input[type="password"]') as HTMLInputElement;
  await userEvent.type(email, 'yarda@example.com');
  await userEvent.type(password, 'Password123!');
  const business = screen.getByText(/Nombre del negocio|Business name/).parentElement!.querySelector('input')!;
  await userEvent.type(business, 'Yonke El Güero');
}

test('sign-up: the payload still carries preferred_language (es after Español)', async () => {
  api.signup.mockResolvedValue({ buyer_id: 77 });
  api.login.mockResolvedValue({ token: 'tok' });
  const { container } = signupPage();
  await screen.findByRole('heading', { name: 'Create Junkerz Buyer Account' });
  await userEvent.click(screen.getByRole('button', { name: 'Español' }));
  await fillSignup(container);
  await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta y continuar' }));
  await waitFor(() => expect(api.signup).toHaveBeenCalledTimes(1));
  expect(api.signup.mock.calls[0][0]).toMatchObject({
    email: 'yarda@example.com', business_name: 'Yonke El Güero', preferred_language: 'es', form_ticket: 'ticket-1',
  });
  await waitFor(() => expect(replace).toHaveBeenCalledWith('/buyers/signup/documents'));
});

test('sign-up: the payload carries preferred_language en by default', async () => {
  api.signup.mockResolvedValue({ buyer_id: 78 });
  api.login.mockResolvedValue({ token: 'tok' });
  const { container } = signupPage();
  await screen.findByRole('heading', { name: 'Create Junkerz Buyer Account' });
  await fillSignup(container);
  await userEvent.click(screen.getByRole('button', { name: 'Create account + continue' }));
  await waitFor(() => expect(api.signup).toHaveBeenCalledTimes(1));
  expect(api.signup.mock.calls[0][0].preferred_language).toBe('en');
});

test('sign-up: a server refusal reads in Spanish and switches with the page', async () => {
  api.signup.mockRejectedValue(new Error('email_exists'));
  const { container } = signupPage();
  await screen.findByRole('heading', { name: 'Create Junkerz Buyer Account' });
  await userEvent.click(screen.getByRole('button', { name: 'Español' }));
  await fillSignup(container);
  await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta y continuar' }));
  expect(await screen.findByText(/Ya hay una cuenta con este correo/)).toBeTruthy();
  await userEvent.click(screen.getByRole('button', { name: 'English' }));
  expect(screen.getByText(/An account with this email already exists/)).toBeTruthy();
});

test('sign-up: an unknown server error is not shown as a raw code alone', async () => {
  api.signup.mockRejectedValue(new Error('HTTP 502'));
  const { container } = signupPage();
  await screen.findByRole('heading', { name: 'Create Junkerz Buyer Account' });
  await userEvent.click(screen.getByRole('button', { name: 'Español' }));
  await fillSignup(container);
  await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta y continuar' }));
  expect(await screen.findByText('Algo salió mal (HTTP 502). Intente de nuevo.')).toBeTruthy();
});

// ---- login ----------------------------------------------------------------

test('login: Spanish words and a Spanish wrong-password message', async () => {
  at('/buyers/login');
  api.login.mockRejectedValue(new Error('bad_credentials'));
  const { container } = render(<BuyersLayout><Login /></BuyersLayout>);
  await screen.findByRole('heading', { name: 'Junkerz Buyer Login' });
  await userEvent.click(screen.getByRole('button', { name: 'Español' }));
  expect(screen.getByRole('heading', { name: 'Entrar como comprador de Junkerz' })).toBeTruthy();
  expect(screen.getByRole('link', { name: '¿Olvidó su contraseña?' })).toBeTruthy();
  expect(screen.getByRole('link', { name: 'Registrarse' }).getAttribute('href')).toBe('/buyers/signup');
  await userEvent.type(container.querySelector('input[type="email"]')!, 'a@b.co');
  await userEvent.type(container.querySelector('input[type="password"]')!, 'nope');
  await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));
  expect(await screen.findByText('El correo o la contraseña no son correctos.')).toBeTruthy();
  expect(api.me).not.toHaveBeenCalled();
});

// ---- logged-in pages ------------------------------------------------------------

test('dashboard + checklist + menu open in the account language (Spanish)', async () => {
  store.buyer_token = 'tok';
  at('/buyers/dashboard');
  api.me.mockResolvedValue({ business_name: 'Yonke Fort Worth', active: false, balance_cents: 0, preferred_language: 'es' });
  render(<BuyersLayout><Dashboard /></BuyersLayout>);
  expect(await screen.findByText('Cuenta pendiente de aprobación')).toBeTruthy();
  // the menu (Estado de cuenta / Reclamos are only in the menu)
  expect(screen.getByRole('link', { name: 'Estado de cuenta' })).toBeTruthy();
  expect(screen.getByRole('link', { name: 'Reclamos' })).toBeTruthy();
  expect(screen.getAllByRole('link', { name: 'Reglas de oferta' }).length).toBeGreaterThan(0);
  expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeTruthy();
  expect(screen.getByText('Saldo disponible')).toBeTruthy();
  expect(screen.getByText('Pasos para empezar a comprar')).toBeTruthy();
  expect(screen.getByRole('link', { name: 'Completar: Identificación con foto' }).getAttribute('href'))
    .toBe('/buyers/signup/documents#id');
  expect(screen.getByRole('link', { name: 'Completar: Tarjeta registrada' }).getAttribute('href')).toBe('/buyers/settings');
  expect(screen.getByText('Aprobación del negocio pendiente')).toBeTruthy();
  expect(api.setLanguage).not.toHaveBeenCalled();
});

test('on a logged-in page the switch changes everything and saves to the account', async () => {
  store.buyer_token = 'tok';
  at('/buyers/dashboard');
  render(<BuyersLayout><Dashboard /></BuyersLayout>);
  expect(await screen.findByText('Account pending approval')).toBeTruthy();
  await userEvent.click(screen.getByRole('button', { name: 'Español' }));
  expect(screen.getByText('Cuenta pendiente de aprobación')).toBeTruthy();
  expect(screen.getByRole('link', { name: 'Inicio' })).toBeTruthy();
  expect(api.setLanguage).toHaveBeenCalledWith('es');
  await userEvent.click(screen.getByRole('button', { name: 'English' }));
  expect(screen.getByText('Account pending approval')).toBeTruthy();
  expect(screen.getByRole('link', { name: 'Complete Photo ID' })).toBeTruthy();
  expect(api.setLanguage).toHaveBeenLastCalledWith('en');
});

test('documents step in Spanish: upload labels, terms and buttons', async () => {
  store.buyer_token = 'tok';
  store.buyer_lang = 'es';
  at('/buyers/signup/documents');
  render(<BuyersLayout><Documents /></BuyersLayout>);
  expect(await screen.findByRole('heading', { name: 'Suba sus documentos' })).toBeTruthy();
  expect(screen.getByLabelText('Subir: Identificación con foto')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Acepto los Términos de servicio' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Saltar por ahora' })).toBeTruthy();
});

test('documents step: an upload refusal reads in Spanish', async () => {
  store.buyer_token = 'tok';
  store.buyer_lang = 'es';
  at('/buyers/signup/documents');
  api.uploadDocument.mockRejectedValue(new Error('file_too_large'));
  render(<BuyersLayout><Documents /></BuyersLayout>);
  const input = await screen.findByLabelText('Subir: Identificación con foto');
  await userEvent.upload(input as HTMLInputElement, new File(['x'], 'id.png', { type: 'image/png' }));
  expect(await screen.findByRole('alert')).toHaveProperty('textContent', 'Ese archivo pesa más de 10 MB. Elija uno más chico.');
});

test('bid-rules list in Spanish: headings, ON/OFF, priority, channels and the summary', async () => {
  store.buyer_token = 'tok';
  store.buyer_lang = 'es';
  at('/buyers/bid-rules');
  api.listRules.mockResolvedValue([{ id: 9, bid_cents: 15000, active: true, priority: 10,
    notification_preference: ['email', 'sms'], weekly_count_used: 2, max_per_week: 5,
    year_min: 2005, year_max: null, vehicle_categories: ['truck'], zip_center: '76102', zip_radius_miles: 40 }]);
  render(<BuyersLayout><BidRulesList /></BuyersLayout>);
  expect(await screen.findByRole('heading', { name: 'Reglas de oferta' })).toBeTruthy();
  expect(screen.getByText('Regla 9')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'ACTIVA' })).toBeTruthy();
  expect(screen.getByText('Alta')).toBeTruthy();
  expect(screen.getByText('Correo, Mensaje de texto (SMS)')).toBeTruthy();
  expect(screen.getByText('pickups · 2005–el más nuevo · cualquier marca · 40 millas de 76102')).toBeTruthy();
  expect(screen.getByRole('link', { name: 'Editar' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Copiar' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Borrar' })).toBeTruthy();
});

test('inside the buyers layout the bid-rule form has one language switch (the one at the top)', async () => {
  store.buyer_token = 'tok';
  at('/buyers/bid-rules/new');
  render(<BuyersLayout><BidRuleForm /></BuyersLayout>);
  expect(await screen.findByRole('heading', { name: 'New Bid Rule' })).toBeTruthy();
  expect(screen.getAllByRole('button', { name: 'Español' })).toHaveLength(1);
  await userEvent.click(screen.getByRole('button', { name: 'Español' }));
  expect(screen.getByRole('heading', { name: 'Nueva regla de oferta' })).toBeTruthy();
  expect(screen.getByRole('link', { name: 'Reglas de oferta' })).toBeTruthy();
});

// ---- no missing translations ----------------------------------------------------------

function keyPaths(o: unknown, prefix = ''): string[] {
  if (typeof o === 'function') return [`${prefix}()`];
  if (o === null || typeof o !== 'object' || Array.isArray(o)) return [prefix];
  return Object.keys(o as Record<string, unknown>).sort()
    .flatMap((k) => keyPaths((o as Record<string, unknown>)[k], prefix ? `${prefix}.${k}` : k));
}

test('every key in the Spanish buyer table is in the English one, and the reverse', () => {
  const en = keyPaths(BUYER_TEXT_TABLES.en);
  const es = keyPaths(BUYER_TEXT_TABLES.es);
  expect(es.filter((k) => !en.includes(k))).toEqual([]);
  expect(en.filter((k) => !es.includes(k))).toEqual([]);
  // no empty strings slipped in
  const empty = (o: unknown): boolean => typeof o === 'string' ? o.trim() === ''
    : o && typeof o === 'object' ? Object.values(o).some(empty) : false;
  expect(empty(BUYER_TEXT_TABLES.es)).toBe(false);
  expect(empty(BUYER_TEXT_TABLES.en)).toBe(false);
});

test('every key in the Spanish bid-rule table is in the English one, and the reverse', () => {
  const en = keyPaths(ruleText('en'));
  const es = keyPaths(ruleText('es'));
  expect(es.filter((k) => !en.includes(k))).toEqual([]);
  expect(en.filter((k) => !es.includes(k))).toEqual([]);
});

test('the buyer SMS consent in Spanish keeps every part of the approved seller wording', () => {
  const es = BUYER_TEXT_TABLES.es.signup.smsConsent;
  for (const part of [
    'Al marcar esta casilla y darnos su teléfono, acepta recibir mensajes SMS de Junkerz',
    'La frecuencia de los mensajes puede variar.',
    'Pueden aplicar tarifas estándar de mensajes y datos.',
    'Responda STOP para cancelar.',
    'Responda HELP para recibir ayuda.',
    'No compartiremos su información móvil con terceros para fines promocionales o de marketing.',
  ]) expect(es).toContain(part);
  // the English disclosure is unchanged, word for word
  expect(BUYER_TEXT_TABLES.en.signup.smsConsent).toBe(
    'By checking this box and providing your phone number, you agree to receive SMS car-assignment, pickup and reminder messages from Junkerz. Message frequency may vary. Standard Message and Data Rates may apply. Reply STOP to opt out. Reply HELP for help. We will not share mobile information with third parties for promotional or marketing purposes. Leave the box unchecked and we contact you by email only. See our');
});
