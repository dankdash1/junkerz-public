const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const { test } = require('node:test');

const dependencies = process.env.SEAT17_DEPS || path.join(__dirname, '..');
const load = createRequire(path.join(dependencies, 'package.json'));
const { JSDOM } = load('jsdom');
const { transformSync } = createRequire(load.resolve('vite/package.json'))('esbuild');
const React = load('react');
const component = process.env.SEAT17_COMPONENT || path.join(__dirname,
  '../src/app/(site)/quote/result/page.tsx');
const compiled = transformSync(fs.readFileSync(component, 'utf8'), {
  loader: 'tsx', format: 'cjs', jsx: 'automatic',
}).code;

for (const es of [false, true]) {
  const cases = [
    { seeded: false, scenario: 'pending → failed lookup → ready' },
    { seeded: true, scenario: 'pending → failed lookup → ready' },
    { seeded: false, scenario: 'initial failure → ready' },
    { seeded: false, scenario: 'permanent failure' },
    { seeded: true, scenario: 'permanent failure' },
  ];
  for (const { seeded, scenario } of cases) {
    test(`${es ? 'ES' : 'EN'} / ${seeded ? 'seeded' : 'unseeded'}: ${scenario}`, async () => {
      const dom = new JSDOM('<div id="root"></div>');
      global.window = dom.window;
      global.document = dom.window.document;
      global.IS_REACT_ACT_ENVIRONMENT = true;

      const { createRoot } = load('react-dom/client');
      const root = createRoot(document.getElementById('root'));
      const pending = es ? 'Un compañero está confirmando este número ahora.' :
        'One of our team is confirming this number now.';
      const error = es ? 'No pudimos cargar su oferta.' : "We couldn't load your offer.";
      const finalCopy = es ? 'Oferta garantizada' : 'Your offer is guaranteed';
      const query = new URLSearchParams({ id: '42', review: '1' });
      if (es) query.set('lang', 'es');
      if (seeded) query.set('cents', '45000');
      const calls = [];
      const delays = [];
      const originalTimeout = global.setTimeout;
      global.setTimeout = (callback, delay, ...args) => {
        if (delay !== 5000) return originalTimeout(callback, delay, ...args);
        delays.push(callback);
      };
      const Leaf = () => null;
      const imports = {
        'next/navigation': { useSearchParams: () => query },
        'next/link': ({ children, ...props }) => React.createElement('a', props, children),
        'lucide-react': new Proxy({}, { get: () => Leaf }),
        '@/components/ui/button': { Button: ({ children, ...props }) => React.createElement('button', props, children) },
        '@/components/Logo': Leaf,
        '@/lib/site': { NOT_LIVE_COPY: { en: {}, es: {} }, PICKUPS_LIVE: true, SITE: { phoneHref: 'tel:000' } },
        '@/lib/api': { async getOffer(id) {
          calls.push(id);
          const fail = scenario === 'permanent failure' ||
            calls.length === (scenario === 'initial failure → ready' ? 1 : 2);
          if (fail) throw new TypeError('synthetic network failure');
          return calls.length === 1
            ? { status: 'reviewing', offer_cents: 45000, requires_human_approval: true }
            : { status: 'ready', offer_cents: 57500, requires_human_approval: false };
        } },
      };
      const module = { exports: {} };
      const requireComponent = (name) => Object.hasOwn(imports, name) ? imports[name] : load(name);
      try {
        new Function('require', 'module', 'exports', compiled)(requireComponent, module, module.exports);
        await React.act(async () => root.render(React.createElement(module.exports.default)));
        const ui = () => document.body.textContent;
        if (scenario !== 'pending → failed lookup → ready') {
          const permanent = scenario === 'permanent failure';
          const wait = es ? 'Estamos calculando su oferta…' : 'Working out your offer…';
          const last = permanent ? 24 : 2;
          const assertSeededPending = () => {
            assert.match(ui(), /450/);
            assert.ok(ui().includes(pending), 'seeded amount lost pending wording');
            assert.ok(!ui().includes(finalCopy), 'seeded amount appears confirmed');
            assert.ok(!ui().includes(error), 'load error replaced the seeded quote');
          };
          for (let attempt = 1; attempt < last; attempt++) {
            assert.equal(calls.length, attempt);
            if (seeded) assertSeededPending();
            else assert.ok(ui().includes(wait), `localized loading lost on failed attempt ${attempt}`);
            assert.ok(!ui().includes(error), `terminal wording shown on attempt ${attempt}`);
            assert.equal(delays.length, 1, `expected a single retry after attempt ${attempt}`);
            await React.act(async () => delays.shift()());
          }
          assert.deepEqual(calls, Array(last).fill(42));
          if (permanent && seeded) {
            assertSeededPending();
          } else if (permanent) {
            assert.ok(ui().includes(error), 'localized terminal error missing');
            assert.ok(!ui().includes(wait), 'loading remained after retry budget was exhausted');
          } else {
            assert.match(ui(), /575/);
            assert.ok(ui().includes(finalCopy), 'localized ready wording missing');
            assert.ok(!ui().includes(error), 'transient error remained after recovery');
          }
          assert.equal(delays.length, 0, 'unexpected poll scheduled after terminal state');
          return;
        }
        assert.match(ui(), /450/);
        assert.ok(ui().includes(pending));
        assert.deepEqual(calls, [42]);
        await React.act(async () => delays.shift()());
        assert.deepEqual(calls, [42, 42]);
        assert.ok(!ui().includes(error), 'pending UI replaced by load error');
        assert.match(ui(), /450/);
        assert.ok(ui().includes(pending));
        assert.equal(delays.length, 1, 'retry timer missing after transient rejection');
        await React.act(async () => delays.shift()());
        assert.deepEqual(calls, [42, 42, 42]);
        assert.match(ui(), /575/);
        assert.ok(ui().includes(finalCopy));
        assert.ok(!ui().includes(pending));
        assert.equal(delays.length, 0, 'polling continued after ready');
      } finally {
        await React.act(async () => root.unmount());
        global.setTimeout = originalTimeout;
        dom.window.close();
        delete global.window;
        delete global.document;
        delete global.IS_REACT_ACT_ENVIRONMENT;
      }
    });
  }
}
