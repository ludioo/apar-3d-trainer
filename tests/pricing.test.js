import { describe, expect, it } from 'vitest';
import product from '../src/data/product.json';
import { calculatePrice, getSpecs } from '../src/features/configurator/pricing.js';

const prices = [
  [
    [250000, 16],
    [400000, 26],
    [600000, 38],
    [800000, 51],
  ],
  [
    [500000, 33],
    [650000, 43],
    [850000, 55],
    [1050000, 68],
  ],
  [
    [350000, 23],
    [500000, 33],
    [700000, 45],
    [900000, 58],
  ],
  [
    [200000, 13],
    [350000, 23],
    [550000, 35],
    [750000, 48],
  ],
];

const specs = [
  [
    [8, 12, 18, 24],
    [2, 3, 4, 5],
    [2, 5, 9, 13],
  ],
  [
    [6, 10, 16, 22],
    [1, 1.5, 2, 2.5],
    [3, 8, 15, 22],
  ],
  [
    [12, 20, 30, 40],
    [2, 3, 4, 5],
    [2.5, 5.5, 10, 14],
  ],
  [
    [15, 25, 40, 55],
    [3, 4, 5, 6],
    [2.5, 5.5, 10, 14],
  ],
];

describe('calculatePrice / getSpecs', () => {
  it('covers all 96 configurations without mutating input', () => {
    let count = 0;
    for (const [a, agent] of product.options.agent.entries()) {
      for (const [c, capacity] of product.options.capacity.entries()) {
        for (const color of product.options.color) {
          for (const bracketEnabled of [false, true]) {
            const config = {
              agentId: agent.id,
              capacityId: capacity.id,
              colorId: color.id,
              bracketEnabled,
            };
            const before = JSON.stringify(config);
            const [IDR, USD] = prices[a][c];
            expect(calculatePrice(product, config)).toEqual({
              IDR: IDR + (bracketEnabled ? 50000 : 0),
              USD: USD + (bracketEnabled ? 3 : 0),
            });
            expect(getSpecs(product, config)).toEqual({
              agent: agent.id,
              capacity: capacity.kg,
              fireClasses: agent.fireClasses,
              dischargeTime: specs[a][0][c],
              range: specs[a][1][c],
              weight: specs[a][2][c],
            });
            expect(JSON.stringify(config)).toBe(before);
            count++;
          }
        }
      }
    }
    expect(count).toBe(96);
  });

  it('throws RangeError for unknown option ids', () => {
    const valid = {
      agentId: 'powder_abc',
      capacityId: '6kg',
      colorId: 'red',
      bracketEnabled: false,
    };
    for (const key of ['agentId', 'capacityId', 'colorId']) {
      expect(() => calculatePrice(product, { ...valid, [key]: 'unknown' })).toThrow(RangeError);
    }
    expect(() => getSpecs(product, { ...valid, agentId: 'unknown' })).toThrow(RangeError);
    expect(() => getSpecs(product, { ...valid, capacityId: 'unknown' })).toThrow(RangeError);
  });
});
