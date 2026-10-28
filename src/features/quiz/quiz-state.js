import questions from '../../data/quiz.json' with { type: 'json' };
import hotspots from '../../data/hotspots.json' with { type: 'json' };

export function validGiven(question, given) {
  return question.type === 'choice' ? question.choices.some((choice) => choice.id === given)
    : hotspots.some((hotspot) => hotspot.id === given);
}

export function createQuizSession() {
  let index = 0;
  let phase = 'idle';
  let startedAt;
  let answers = [];
  let attempt = null;
  let id;
  return {
    get index() { return index; },
    get phase() { return phase; },
    get answers() { return answers; },
    get attempt() { return attempt; },
    start(now = Date.now()) {
      id = Array.from(crypto.getRandomValues(new Uint32Array(4)), (value) => value.toString(16).padStart(8, '0')).join('');
      startedAt = new Date(now).toISOString();
      index = 0;
      answers = [];
      attempt = null;
      phase = 'question';
    },
    answer(given, now = Date.now()) {
      const question = questions[index];
      if (phase !== 'question' || !validGiven(question, given)) return false;
      answers.push({ qId: question.id, given, correct: given === question.answer });
      phase = 'feedback';
      if (answers.length === questions.length) {
        const score = answers.filter((answer) => answer.correct).length;
        const finishedAt = new Date(Math.max(now, Date.parse(startedAt))).toISOString();
        attempt = { id, startedAt, finishedAt,
          durationSec: Math.round((Date.parse(finishedAt) - Date.parse(startedAt)) / 1000),
          score, total: questions.length, passed: score / questions.length >= 0.75,
          answers: [...answers] };
      }
      return true;
    },
    next() {
      if (phase !== 'feedback') return false;
      if (attempt) phase = 'summary';
      else { index++; phase = 'question'; }
      return true;
    },
  };
}
