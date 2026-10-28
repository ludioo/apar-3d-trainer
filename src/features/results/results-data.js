import { read, set } from '../../core/storage.js';

export const MAX_PARTICIPANT_LENGTH = 60;

export function readParticipantName() {
  const result = read('participantName');
  if (result.status === 'empty') return { status: 'ok', name: '' };
  if (result.status !== 'ok') return result;
  return typeof result.value === 'string' && result.value.length <= MAX_PARTICIPANT_LENGTH
    ? { status: 'ok', name: result.value.trim() } : { status: 'invalid' };
}

export function saveParticipantName(value) {
  if (typeof value !== 'string' || value.length > MAX_PARTICIPANT_LENGTH) return { status: 'nameInvalid' };
  const name = value.trim();
  return { status: set('participantName', name) ? 'ok' : 'unavailable', name };
}

export function buildResults(attempts, questions, hotspots, lang) {
  const latest = attempts[0] ?? null;
  return {
    latest,
    history: [...attempts].reverse(),
    ratio: latest ? latest.score / latest.total : 0,
    rows: latest ? latest.answers.map((answer) => {
      const question = questions.find((entry) => entry.id === answer.qId);
      const given = question.type === 'choice'
        ? question.choices.find((choice) => choice.id === answer.given).label[lang]
        : hotspots.find((hotspot) => hotspot.id === answer.given).title[lang];
      return { question: question.question[lang], given, correct: answer.correct };
    }) : [],
  };
}
