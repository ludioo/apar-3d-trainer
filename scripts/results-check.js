import assert from 'node:assert/strict';
import { clearUserData } from '../src/core/storage.js';
import { buildResults, readParticipantName, saveParticipantName } from '../src/features/results/results-data.js';
import { createQuizSession } from '../src/features/quiz/quiz-state.js';
import { listAttempts, saveAttempt } from '../src/features/quiz/attempts.js';
import { createTrainingSession, createSweep } from '../src/features/training/training-state.js';
import questions from '../src/data/quiz.json' with { type: 'json' };
import hotspots from '../src/data/hotspots.json' with { type: 'json' };

const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
const values = new Map();
let blocked = new Set();
let failRead = false;
let failWrite = false;
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
  getItem(key) { if (failRead) throw Error('read blocked'); return values.get(key) ?? null; },
  setItem(key, value) { if (failWrite) throw Error('write blocked'); values.set(key, value); },
  removeItem(key) { if (blocked.has(key)) throw Error('delete blocked'); values.delete(key); },
} });
try {
  assert.deepEqual(readParticipantName(), { status: 'ok', name: '' });
  for (const name of ['', '   ', '  Barkah  ', 'a'.repeat(60), '<img src=x onerror=alert(1)>']) {
    assert.deepEqual(saveParticipantName(name), { status: 'ok', name: name.trim() });
    assert.equal(readParticipantName().name, name.trim());
  }
  const before = values.get('apar3d:participantName');
  for (const value of ['a'.repeat(61), null, 12]) assert.equal(saveParticipantName(value).status, 'nameInvalid');
  assert.equal(values.get('apar3d:participantName'), before);
  for (const value of ['{', 'null', '42', JSON.stringify('a'.repeat(61))]) {
    values.set('apar3d:participantName', value);
    assert.equal(readParticipantName().status, 'invalid');
    assert.equal(values.get('apar3d:participantName'), value);
  }
  failRead = true;
  assert.equal(readParticipantName().status, 'unavailable');
  failRead = false;
  failWrite = true;
  assert.equal(saveParticipantName('Barkah').status, 'unavailable');
  failWrite = false;

  const session = createQuizSession();
  const attempts = [];
  for (let i = 0; i < 21; i++) {
    session.start(Date.parse('2026-10-28T01:00:00.000Z') + i * 100000);
    const expectedScore = [0, 5, 6, 8][i % 4];
    for (const [index, question] of questions.entries()) {
      const wrong = question.type === 'choice' ? question.choices.find((choice) => choice.id !== question.answer).id : 'body';
      session.answer(index < expectedScore ? question.answer : wrong, Date.parse('2026-10-28T01:00:00.000Z') + i * 100000 + 20000);
      session.next();
    }
    attempts.unshift(session.attempt);
    assert.equal(saveAttempt(session.attempt).status, 'ok');
    for (const lang of ['en', 'id']) {
      const report = buildResults(listAttempts().attempts, questions, hotspots, lang);
      assert.equal(report.latest.id, session.attempt.id);
      assert.equal(report.ratio, expectedScore / 8);
      assert.equal(report.latest.passed, expectedScore >= 6);
      assert.equal(report.rows.length, 8);
      assert.equal(report.rows[1].given, hotspots.find((h) => h.id === (expectedScore > 1 ? 'pin' : 'body')).title[lang]);
      assert.equal(report.rows[0].question, questions[0].question[lang]);
    }
  }
  const history = listAttempts().attempts;
  const snapshot = JSON.stringify(history);
  const report = buildResults(history, questions, hotspots, 'id');
  assert.equal(report.history.length, 20);
  assert.equal(report.history[0].id, attempts.at(-2).id);
  assert.equal(report.history.at(-1).id, attempts[0].id);
  assert.equal(JSON.stringify(history), snapshot, 'presentation does not mutate history');
  assert.deepEqual(buildResults([], questions, hotspots, 'en'), { latest: null, history: [], ratio: 0, rows: [] });
  session.reset();
  assert.equal(session.phase, 'idle');
  assert.equal(session.attempt, null);
  assert.deepEqual(session.answers, []);
  assert.equal(session.index, 0);
  assert.equal(session.answer('a'), false, 'cleared sessions cannot save an old result');
  const training = createTrainingSession(4);
  const sweep = createSweep();
  training.start();
  training.complete();
  training.next();
  sweep.update(100);
  training.reset(); sweep.reset();
  assert.equal(training.phase, 'intro');
  assert.equal(training.index, 0);
  assert.deepEqual(training.status, [null, null, null, null]);
  assert.equal(sweep.count, 0);
  assert.equal(sweep.value, 0);

  const keys = ['attempts', 'configs', 'participantName', 'trainingDone'];
  values.set('apar3d:lang', '"id"');
  values.set('another-app:key', 'keep');
  for (const key of keys) values.set(`apar3d:${key}`, 'data');
  blocked = new Set(['apar3d:configs']);
  assert.equal(clearUserData().status, 'partial');
  assert.equal(values.get('apar3d:configs'), 'data');
  assert.ok(!values.has('apar3d:attempts'));
  for (const key of keys) values.set(`apar3d:${key}`, 'data');
  blocked = new Set(keys.map((key) => `apar3d:${key}`));
  assert.equal(clearUserData().status, 'unavailable');
  for (const key of keys) assert.equal(values.get(`apar3d:${key}`), 'data');
  blocked.clear();
  assert.equal(clearUserData().status, 'ok');
  for (const key of keys) assert.ok(!values.has(`apar3d:${key}`));
  assert.equal(values.get('apar3d:lang'), '"id"');
  assert.equal(values.get('another-app:key'), 'keep');
  assert.equal(clearUserData().status, 'ok', 'clear is safe to repeat');
} finally {
  if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage);
  else delete globalThis.localStorage;
}
console.log('Results checks passed: scores/history, bilingual answers, participant name, session reset and scoped/partial deletion.');
