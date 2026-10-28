import { read, set } from '../../core/storage.js';
import questions from '../../data/quiz.json' with { type: 'json' };
import { validGiven } from './quiz-state.js';

export const MAX_ATTEMPTS = 20;
const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const iso = (value) => typeof value === 'string' && Number.isFinite(Date.parse(value))
  && new Date(value).toISOString() === value;

export function validAttempt(entry) {
  if (!object(entry) || typeof entry.id !== 'string' || !/^[a-f0-9]{32}$/.test(entry.id)
    || !iso(entry.startedAt) || !iso(entry.finishedAt) || Date.parse(entry.finishedAt) < Date.parse(entry.startedAt)
    || entry.durationSec !== Math.round((Date.parse(entry.finishedAt) - Date.parse(entry.startedAt)) / 1000)
    || entry.total !== questions.length || !Array.isArray(entry.answers) || entry.answers.length !== questions.length) return false;
  if (!entry.answers.every((answer, index) => object(answer) && answer.qId === questions[index].id
    && validGiven(questions[index], answer.given) && answer.correct === (answer.given === questions[index].answer))) return false;
  const score = entry.answers.filter((answer) => answer.correct).length;
  return entry.score === score && entry.passed === (score / questions.length >= 0.75);
}

export function listAttempts() {
  const result = read('attempts');
  if (result.status === 'empty') return { status: 'ok', attempts: [] };
  if (result.status !== 'ok') return result;
  const data = result.value;
  if (!object(data) || data.schemaVersion !== 1 || !Array.isArray(data.attempts)
    || data.attempts.length > MAX_ATTEMPTS || !data.attempts.every(validAttempt)
    || new Set(data.attempts.map((entry) => entry.id)).size !== data.attempts.length) return { status: 'invalid' };
  return { status: 'ok', attempts: [...data.attempts].sort((a, b) => b.finishedAt.localeCompare(a.finishedAt)) };
}

export function saveAttempt(attempt) {
  if (!validAttempt(attempt)) return { status: 'invalid' };
  const result = listAttempts();
  if (result.status !== 'ok') return result;
  const existing = result.attempts.find((entry) => entry.id === attempt.id);
  if (existing) return { status: JSON.stringify(existing) === JSON.stringify(attempt) ? 'ok' : 'invalid' };
  const attempts = [attempt, ...result.attempts]
    .sort((a, b) => b.finishedAt.localeCompare(a.finishedAt)).slice(0, MAX_ATTEMPTS);
  // shortcut: localStorage read/modify/write is not transactional across tabs; use Web Locks for simultaneous writers.
  return { status: set('attempts', { schemaVersion: 1, attempts }) ? 'ok' : 'unavailable' };
}
