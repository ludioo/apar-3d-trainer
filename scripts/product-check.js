import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import product from '../src/data/product.json' with { type: 'json' };
import { calculatePrice, getSpecs } from '../src/features/configurator/pricing.js';

const prices = [
  [[250000, 16], [400000, 26], [600000, 38], [800000, 51]],
  [[500000, 33], [650000, 43], [850000, 55], [1050000, 68]],
  [[350000, 23], [500000, 33], [700000, 45], [900000, 58]],
  [[200000, 13], [350000, 23], [550000, 35], [750000, 48]],
];
const specs = [
  [[8, 12, 18, 24], [2, 3, 4, 5], [2, 5, 9, 13]],
  [[6, 10, 16, 22], [1, 1.5, 2, 2.5], [3, 8, 15, 22]],
  [[12, 20, 30, 40], [2, 3, 4, 5], [2.5, 5.5, 10, 14]],
  [[15, 25, 40, 55], [3, 4, 5, 6], [2.5, 5.5, 10, 14]],
];
assert.equal(product.illustrative, true);
assert.deepEqual(product.options.agent.map((item) => item.id), ['powder_abc', 'co2', 'foam_afff', 'water']);
assert.deepEqual(product.options.capacity.map((item) => item.kg), [1, 3, 6, 9]);
assert.deepEqual(product.options.capacity.map((item) => item.scale), [0.65, 0.82, 1, 1.12]);
assert.deepEqual(product.options.agent.map((item) => item.fireClasses), [['A', 'B', 'C'], ['B', 'C'], ['A', 'B'], ['A']]);
assert.deepEqual(product.specTemplate, ['agent', 'capacity', 'fireClasses', 'dischargeTime', 'range', 'weight']);
for (const lang of ['en', 'id']) {
  const dict = JSON.parse(readFileSync(new URL(`../src/i18n/${lang}.json`, import.meta.url), 'utf8'));
  for (const agent of product.options.agent) assert.equal(dict[`config.agent.${agent.id}`], agent.label[lang]);
  for (const field of product.specTemplate) assert.ok(dict[`spec.${field}`]);
}
let count = 0;
for (const [a, agent] of product.options.agent.entries()) {
  assert.match(agent.visual.strip, /^#[\da-f]{6}$/i);
  assert.match(agent.visual.ink, /^#[\da-f]{6}$/i);
  for (const [c, capacity] of product.options.capacity.entries()) {
    for (const color of product.options.color) {
      for (const bracketEnabled of [false, true]) {
        const config = { agentId: agent.id, capacityId: capacity.id, colorId: color.id, bracketEnabled };
        const before = JSON.stringify(config);
        const [IDR, USD] = prices[a][c];
        assert.deepEqual(calculatePrice(product, config), {
          IDR: IDR + (bracketEnabled ? 50000 : 0), USD: USD + (bracketEnabled ? 3 : 0),
        });
        assert.deepEqual(getSpecs(product, config), {
          agent: agent.id, capacity: capacity.kg, fireClasses: agent.fireClasses,
          dischargeTime: specs[a][0][c], range: specs[a][1][c], weight: specs[a][2][c],
        });
        assert.equal(JSON.stringify(config), before, 'calculations must not mutate configuration');
        count++;
      }
    }
  }
}
assert.equal(count, 96);
const valid = { agentId: 'powder_abc', capacityId: '6kg', colorId: 'red', bracketEnabled: false };
for (const key of ['agentId', 'capacityId', 'colorId']) {
  assert.throws(() => calculatePrice(product, { ...valid, [key]: 'unknown' }), RangeError);
}
assert.throws(() => getSpecs(product, { ...valid, agentId: 'unknown' }), RangeError);
assert.throws(() => getSpecs(product, { ...valid, capacityId: 'unknown' }), RangeError);
console.log(`product-check ok: ${count} configurations, both currencies, approved specifications, invalid IDs`);
