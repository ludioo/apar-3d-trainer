import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import steps from '../src/data/pass-steps.json' with { type: 'json' };
import emergency from '../src/data/emergency.json' with { type: 'json' };
import { createTrainingSession, createSweep, holdProgress } from '../src/features/training/training-state.js';

const content = readFileSync(new URL('../docs/content-and-assets.md', import.meta.url), 'utf8');
assert.deepEqual(emergency, { fire: '113', general: '112', sourceUrl: 'https://layanan112.komdigi.go.id/tentang' });
const table = content.split('## Langkah PASS (`pass-steps.json`)')[1].split('## Kuis')[0];
assert.deepEqual(steps.map(({ id, hotspot, interaction }) => [id, hotspot, interaction]), [
  ['pull', 'pin', 'click'], ['aim', 'nozzle', 'click'], ['squeeze', 'handle', 'hold'], ['sweep', 'nozzle', 'drag'],
]);
for (const step of steps) {
  const row = table.split(/\r?\n/).find((line) => line.startsWith(`| \`${step.id}\` |`)).split('|');
  assert.equal(step.instruction.en, row[3].trim());
  assert.equal(step.instruction.id, row[4].trim());
  assert.ok(step.title.en && step.title.id);
}
const session = createTrainingSession(steps.length);
assert.equal(session.next(), false);
session.complete();
assert.equal(session.status[0], null);
session.start();
session.back();
assert.equal(session.index, 0);
assert.equal(session.next(), false);
session.complete();
assert.equal(session.next(), true);
session.complete(true);
session.back();
assert.equal(session.index, 0);
assert.deepEqual(session.status, ['done', 'skipped', null, null]);
session.next(); session.next();
assert.equal(session.index, 2);
assert.equal(session.next(), false);
session.complete(); session.next(); session.complete(true); session.next();
assert.equal(session.phase, 'complete');
session.restart();
assert.equal(session.phase, 'steps');
assert.equal(session.index, 0);
assert.deepEqual(session.status, [null, null, null, null]);
assert.equal(holdProgress(100, 1099), 0.999);
assert.equal(holdProgress(100, 1100), 1);
assert.equal(holdProgress(100, 3000), 1);
assert.equal(holdProgress(100, 0), 0);

const sweep = createSweep();
assert.equal(sweep.value, 0);
assert.equal(sweep.target, 'right');
assert.equal(sweep.cycles, 0);
for (const value of [0, 5, 50, 94]) assert.equal(sweep.update(value), 0, 'middle and wrong end do not count');
assert.equal(sweep.value, 94, 'partial position is kept');
assert.equal(sweep.update(95), 1, 'right zone begins at 95');
assert.equal(sweep.cycles, 0, 'outbound pass alone is not a cycle');
assert.equal(sweep.target, 'left');
for (const value of [100, 95, 50, 6]) assert.equal(sweep.update(value), 1, 'same end and middle cannot count twice');
assert.equal(sweep.update(5), 2, 'left zone ends at 5');
assert.equal(sweep.cycles, 1);
assert.equal(sweep.target, 'right');
assert.equal(sweep.update(100), 3);
assert.equal(sweep.update(0), 4);
assert.equal(sweep.cycles, 2);
assert.equal(sweep.update(100), 5);
assert.equal(sweep.update(0), 6);
assert.equal(sweep.cycles, 3);
assert.equal(sweep.update(100), 6, 'count stops at three cycles');
assert.equal(sweep.value, 0, 'completed control does not move');
sweep.reset();
assert.equal(sweep.value, 0);
assert.equal(sweep.count, 0);
assert.equal(sweep.target, 'right');
for (const value of [NaN, Infinity, -1, 101, '100', null]) {
  assert.equal(sweep.update(value), 0);
  assert.equal(sweep.value, 0, 'invalid range value is ignored');
}
console.log('training-check ok: PASS source, session navigation, skip/restart, hold boundary, slider zones/cycles/position/reset');
