import { describe, expect, it } from 'vitest';
import {
  defaultSnapIndex,
  isShortLandscape,
  nearestSnap,
  sheetBounds,
} from '../src/ui/sheet.js';

describe('sheetBounds', () => {
  it('maps 25/50/75 fractions within available height', () => {
    expect(sheetBounds(844, 728, 176)).toEqual([211, 422, 633]);
    expect(sheetBounds(800, 684, 176)).toEqual([200, 400, 600]);
  });

  it('clamps to minimum and available on short viewports', () => {
    expect(sheetBounds(390, 274, 176)).toEqual([176, 195, 274]);
    expect(sheetBounds(390, 286, 88)).toEqual([97.5, 195, 286]);
    expect(sheetBounds(240, 124, 176)).toEqual([124, 124, 124]);
    expect(sheetBounds(300, 184, 176)).toEqual([176, 176, 184]);
    expect(sheetBounds(200, 0, 176)).toEqual([0, 0, 0]);
  });
});

describe('nearestSnap', () => {
  it('picks the closest snap and prefers the lower on ties', () => {
    expect(nearestSnap(300, [240, 640])).toBe(240);
    expect(nearestSnap(500, [240, 640])).toBe(640);
    expect(nearestSnap(300, [200, 400, 600])).toBe(200);
    expect(nearestSnap(440, [211, 422, 633])).toBe(422);
    expect(nearestSnap(180, sheetBounds(390, 274, 176))).toBe(176);
    expect(nearestSnap(260, sheetBounds(390, 274, 176))).toBe(274);
  });
});

describe('short landscape defaults', () => {
  it('detects short landscape and defaults to peek', () => {
    expect(isShortLandscape(844, 390)).toBe(true);
    expect(isShortLandscape(390, 844)).toBe(false);
    expect(isShortLandscape(1024, 390)).toBe(false);
    expect(defaultSnapIndex(844, 390)).toBe(0);
    expect(defaultSnapIndex(390, 844)).toBe(1);
  });
});
