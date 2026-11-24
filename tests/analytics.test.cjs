const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load() {
  const window = { dataLayer: [], sessionStorage: { getItem: k => saved.get(k), setItem: (k,v) => saved.set(k,v) } };
  const saved = new Map();
  const code = ts.transpileModule(fs.readFileSync('src/components/Analytics.tsx','utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX }
  }).outputText;
  const exports = {};
  const sandbox = { exports, window, require: id => {
    if (id === 'react') return { useEffect: () => {} };
    if (id === 'react/jsx-runtime') return { jsx: (type, props) => ({type,props}), jsxs: (type, props) => ({type,props}) };
    if (id === 'next/script') return { default: 'script' };
    if (id === '@/lib/attribution') return { getAttribution: () => null };
    throw new Error(id);
  }};
  vm.runInNewContext(code, sandbox);
  return { api: exports, window, sandbox };
}
test('accepted quote queues the existing Ads lead conversion once per offer, without contact data', () => {
  const {api,window} = load();
  assert.equal(typeof api.trackLeadSubmission, 'function');
  api.trackLeadSubmission(901);
  api.trackLeadSubmission(901);
  const events = window.dataLayer.map(x => Array.from(x)).filter(x => x[0] === 'event' && x[1] === 'conversion');
  assert.equal(events.length, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(events[0][2])), {
    send_to: 'AW-583352549/POO5CMWl_5AYEOWBlZYC', value: 50, currency: 'USD', transaction_id: 'junkerz-offer-901'
  });
});
test('invalid offer never records a submitted lead', () => {
  const {api,window} = load();
  assert.equal(typeof api.trackLeadSubmission, 'function');
  for (const id of [0,-1,NaN,undefined]) api.trackLeadSubmission(id);
  assert.equal(window.dataLayer.length,0);
});
test('Google initialization configures Ads and real website-call measurement', () => {
  const {api,window,sandbox} = load();
  const nodes = api.default().props.children;
  const init = nodes.find(x => x.props.id === 'ga-init');
  sandbox.dataLayer = window.dataLayer;
  vm.runInNewContext(init.props.children,sandbox);
  const configs = window.dataLayer.map(x=>Array.from(x)).filter(x=>x[0]==='config');
  assert.ok(configs.some(x=>x[1]==='AW-583352549'));
  assert.ok(configs.some(x=>x[1]==='AW-583352549/ygzLCNmyifoCEOWBlZYC' && x[2].phone_conversion_number==='817-420-9180'));
});
function tapEnv(path, beaconOk = true) {
  const env = load();
  const beacons = [];
  env.window.location = { pathname: path };
  env.window.matchMedia = () => ({ matches: true });
  env.window.navigator = { sendBeacon: (url, body) => { beacons.push([url, JSON.parse(body)]); return beaconOk; } };
  env.sandbox.fetch = (url, opts) => { beacons.push(['fetch:' + url, JSON.parse(opts.body)]); return Promise.resolve(); };
  return { ...env, beacons };
}
test('phone tap goes to Google Analytics as a real gtag event and to our own counter, with no phone number', () => {
  const { api, window, beacons } = tapEnv('/cash-for-junk-cars/dallas');
  api.trackContactTap('tel:+18174209180', 'header');
  const gtagEvents = window.dataLayer.map(x => Array.from(x)).filter(x => x[0] === 'event');
  assert.equal(gtagEvents.length, 1);
  assert.equal(gtagEvents[0][1], 'call_tap');
  assert.equal(gtagEvents[0][2].tap_source, 'header');
  assert.ok(window.dataLayer.some(x => x.event === 'call_click'));
  assert.deepEqual(beacons, [['/api/junkyard-public/tap', { kind: 'call', page: '/cash-for-junk-cars/dallas', source: 'header', device: 'mobile' }]]);
  assert.ok(!JSON.stringify(beacons).includes('8174209180'));
});
test('text and email taps are counted; other links are not', () => {
  const { api, beacons } = tapEnv('/contact-us');
  api.trackContactTap('sms:+18174209180');
  api.trackContactTap('mailto:info@junkerz.com');
  api.trackContactTap('https://junkerz.com/quote');
  assert.deepEqual(beacons.map(b => [b[1].kind, b[1].source]), [['text', 'link'], ['email', 'link']]);
  assert.ok(!JSON.stringify(beacons).includes('info@junkerz.com'));
});
test('buyer and driver pages are not counted as customer taps', () => {
  const { api, beacons, window } = tapEnv('/buyers/won-cars/12');
  api.trackContactTap('tel:+15555550100');
  assert.equal(beacons.length, 0);
  assert.equal(window.dataLayer.length, 0);
});
test('falls back to fetch when the beacon is refused', () => {
  const { api, beacons } = tapEnv('/', false);
  api.trackContactTap('tel:+18174209180');
  assert.equal(beacons.at(-1)[0], 'fetch:/api/junkyard-public/tap');
});
