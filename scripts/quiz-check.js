import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import questions from '../src/data/quiz.json' with { type: 'json' };
import { createQuizSession } from '../src/features/quiz/quiz-state.js';
import { listAttempts, saveAttempt, validAttempt, MAX_ATTEMPTS } from '../src/features/quiz/attempts.js';

const content = readFileSync(new URL('../docs/content-and-assets.md', import.meta.url), 'utf8');
assert.deepEqual(questions.map((q) => q.id), Array.from({ length: 8 }, (_, i) => `q${i + 1}`));
assert.deepEqual(questions.map((q) => q.answer), ['a', 'pin', 'b', 'a', 'gauge', 'a', 'b', 'b']);
assert.equal(questions.filter((q) => q.type === 'choice').length, 6);
assert.equal(questions.filter((q) => q.emergency).map((q) => q.id).join(), 'q6');
for (const question of questions) {
  for (const value of [question.question, question.explanation, ...(question.choices ?? []).map((c) => c.label)]) {
    for (const lang of ['en', 'id']) assert.ok(value[lang] && content.includes(value[lang]), `${question.id}: ${lang} text must match approved content`);
  }
  assert.ok(question.sources.length);
  for (const source of question.sources) {
    assert.ok(source.label && source.url.startsWith('https://'));
    assert.ok(content.includes(source.url.split('#')[0]), 'source must be documented');
  }
}

const started = Date.parse('2026-10-28T01:00:00.000Z');
function complete(score, now = started) {
  const session = createQuizSession();
  assert.equal(session.answer('a'), false);
  session.start(now);
  assert.equal(session.next(), false);
  for (const [index, question] of questions.entries()) {
    assert.equal(session.answer('unknown'), false);
    const wrong = question.type === 'choice' ? question.choices.find((c) => c.id !== question.answer).id : 'body';
    assert.equal(session.answer(index < score ? question.answer : wrong, now + (index + 1) * 1250), true);
    assert.equal(session.phase, 'feedback');
    assert.equal(session.answer(question.answer), false, 'first answer locks');
    assert.equal(session.answers.length, index + 1);
    assert.equal(!!session.attempt, index === questions.length - 1, 'only complete sessions create attempts');
    assert.equal(session.next(), true);
  }
  assert.equal(session.phase, 'summary');
  assert.equal(session.next(), false);
  const attempt = session.attempt;
  assert.equal(attempt.score, score);
  assert.equal(attempt.passed, score >= 6);
  assert.equal(attempt.durationSec, 10);
  assert.equal(validAttempt(attempt), true);
  session.start(now + 50000);
  assert.equal(session.phase, 'question');
  assert.equal(session.index, 0);
  assert.equal(session.attempt, null);
  assert.equal(session.answers.length, 0);
  return attempt;
}
for (const score of [0, 5, 6, 8]) complete(score);
const leverAnswer = createQuizSession();
leverAnswer.start(started);
leverAnswer.answer('a', started); leverAnswer.next(); leverAnswer.answer('handle', started);
assert.deepEqual(leverAnswer.answers[1], { qId: 'q2', given: 'handle', correct: false }, 'part 1 is not the safety pin');
const backwards = createQuizSession();
backwards.start(started);
for (const question of questions) { backwards.answer(question.answer, started - 1000); backwards.next(); }
assert.equal(backwards.attempt.durationSec, 0, 'clock changes cannot create negative duration');

const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
const values = new Map();
let writes = 0;
let failRead = false;
let failWrite = false;
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
  getItem(key) { if (failRead) throw Error('read blocked'); return values.get(key) ?? null; },
  setItem(key, value) { if (failWrite) throw Error('quota'); writes++; values.set(key, value); },
} });
try {
  assert.deepEqual(listAttempts(), { status: 'ok', attempts: [] });
  const oldAttempt = complete(0);
  oldAttempt.answers[1].given = 'handle';
  const oldBytes = JSON.stringify({ schemaVersion: 1, attempts: [oldAttempt] });
  values.set('apar3d:attempts', oldBytes);
  assert.deepEqual(listAttempts().attempts, [oldAttempt], 'previous scores and IDs remain valid without rescoring');
  assert.equal(values.get('apar3d:attempts'), oldBytes, 'reading previous history does not rewrite it');
  values.clear();
  const entries = Array.from({ length: MAX_ATTEMPTS + 1 }, (_, i) => complete(i % 9, started + i * 20000));
  for (const entry of entries) assert.equal(saveAttempt(entry).status, 'ok');
  assert.equal(listAttempts().attempts.length, 20);
  assert.equal(listAttempts().attempts[0].id, entries.at(-1).id);
  assert.ok(!listAttempts().attempts.some((entry) => entry.id === entries[0].id));
  const saved = values.get('apar3d:attempts');
  const writeCount = writes;
  assert.equal(saveAttempt(entries.at(-1)).status, 'ok');
  assert.equal(writes, writeCount, 'same attempt is not written twice');
  assert.equal(saveAttempt({ ...entries.at(-1), durationSec: 100 }).status, 'invalid');
  assert.equal(values.get('apar3d:attempts'), saved);
  for (const bad of ['{', 'null', '[]', '{"schemaVersion":2,"attempts":[]}',
    JSON.stringify({ schemaVersion: 1, attempts: [{ ...entries[0], passed: !entries[0].passed }] }),
    JSON.stringify({ schemaVersion: 1, attempts: [entries[0], entries[0]] })]) {
    values.set('apar3d:attempts', bad);
    assert.equal(saveAttempt(entries[1]).status, 'invalid');
    assert.equal(values.get('apar3d:attempts'), bad, 'invalid history is preserved');
  }
  values.set('apar3d:attempts', saved);
  const fresh = complete(8, started + 1000000);
  failRead = true;
  assert.equal(saveAttempt(fresh).status, 'unavailable');
  failRead = false;
  failWrite = true;
  assert.equal(saveAttempt(fresh).status, 'unavailable');
  assert.equal(values.get('apar3d:attempts'), saved);
  failWrite = false;
  for (const change of [{ score: 7 }, { total: 9 }, { durationSec: -1 }, { id: '' },
    { finishedAt: 'invalid' }, { startedAt: '2027-01-01T00:00:00.000Z' },
    { answers: [...fresh.answers].reverse() }, { answers: fresh.answers.map((a) => ({ ...a, given: 'unknown' })) }]) {
    assert.equal(validAttempt({ ...fresh, ...change }), false);
  }
} finally {
  if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage);
  else delete globalThis.localStorage;
}
console.log('Quiz: approved bilingual content, answer locking, 0/5/6/8 scores, duration, retry and safe 20-attempt storage passed.');
