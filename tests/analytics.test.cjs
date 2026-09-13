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
