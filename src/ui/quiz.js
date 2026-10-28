import { getLang, t } from '../i18n/i18n.js';
import hotspots from '../data/hotspots.json';
import emergency from '../data/emergency.json';
import './quiz.css';

export function initQuizUi(questions, actions) {
  const element = document.createElement('section');
  element.className = 'quiz';
  const body = document.createElement('div');
  body.className = 'quiz__body';
  const progress = document.createElement('p');
  progress.className = 'quiz__progress';
  const heading = document.createElement('h3');
  heading.tabIndex = -1;
  const hint = document.createElement('p');
  hint.className = 'quiz__muted';
  const choices = document.createElement('div');
  choices.className = 'quiz__choices';
  choices.setAttribute('role', 'group');
  heading.id = 'quiz-question';
  choices.setAttribute('aria-labelledby', heading.id);
  const feedback = document.createElement('section');
  feedback.className = 'quiz__feedback';
  feedback.tabIndex = -1;
  feedback.setAttribute('role', 'status');
  feedback.setAttribute('aria-atomic', 'true');
  const feedbackTitle = document.createElement('h4');
  const correctAnswer = document.createElement('p');
  const explanation = document.createElement('p');
  const sources = document.createElement('div');
  sources.className = 'quiz__sources';
  feedback.append(feedbackTitle, correctAnswer, explanation, sources);
  const contacts = document.createElement('section');
  contacts.className = 'quiz__contacts';
  const emergencyTitle = document.createElement('h4');
  const fire = document.createElement('a');
  fire.href = `tel:${emergency.fire}`;
  const general = document.createElement('a');
  general.href = `tel:${emergency.general}`;
  const emergencySource = document.createElement('a');
  emergencySource.href = emergency.sourceUrl;
  emergencySource.target = '_blank';
  emergencySource.rel = 'noopener noreferrer';
  contacts.append(emergencyTitle, fire, general, emergencySource);
  const score = document.createElement('p');
  score.className = 'quiz__score';
  const duration = document.createElement('p');
  const saved = document.createElement('p');
  saved.setAttribute('role', 'status');
  const tools = document.createElement('div');
  tools.className = 'quiz__tools';
  function button(action, parent) {
    const el = document.createElement('button');
    el.type = 'button';
    el.dataset.quiz = action;
    el.addEventListener('click', actions[action]);
    parent.appendChild(el);
    return el;
  }
  const resetView = button('resetView', tools);
  const restart = button('restart', tools);
  const training = button('training', tools);
  const disclaimer = document.createElement('p');
  disclaimer.className = 'quiz__muted';
  const nav = document.createElement('div');
  nav.className = 'quiz__nav';
  const next = button('next', nav);
  body.append(progress, heading, hint, choices, feedback, contacts, score, duration, saved, tools, disclaimer);
  element.append(body, nav);
  let currentId;
  const observer = new ResizeObserver(() => {
    element.style.setProperty('--quiz-nav-height', `${nav.getBoundingClientRect().height + 8}px`);
  });

  function render({ session, ready, saveFailed }) {
    const lang = getLang();
    const question = questions[session.index];
    const answer = session.answers[session.index];
    const summary = session.phase === 'summary';
    const pick = question.type === 'pick-hotspot';
    element.dataset.phase = session.phase;
    element.dataset.question = question.id;
    if (currentId !== question.id) {
      currentId = question.id;
      choices.replaceChildren();
      for (const choice of question.choices ?? []) {
        const option = document.createElement('button');
        option.type = 'button';
        option.dataset.choice = choice.id;
        option.addEventListener('click', () => actions.answer(choice.id));
        choices.appendChild(option);
      }
      sources.replaceChildren();
      for (const source of question.sources) {
        const link = document.createElement('a');
        link.href = source.url;
        link.textContent = source.label;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        sources.appendChild(link);
      }
    }
    progress.hidden = summary;
    progress.textContent = t('quiz.progress').replace('{n}', session.index + 1).replace('{total}', questions.length);
    heading.textContent = summary ? t(session.attempt.passed ? 'quiz.passed' : 'quiz.failed') : question.question[lang];
    hint.hidden = summary || !!answer;
    hint.textContent = t(!ready ? 'quiz.loading' : pick ? 'quiz.pickHint' : 'quiz.choiceHint');
    choices.hidden = summary || pick;
    [...choices.children].forEach((button, index) => {
      const choice = question.choices[index];
      button.textContent = choice.label[lang];
      button.disabled = !ready || !!answer;
      button.setAttribute('aria-pressed', String(answer?.given === choice.id));
      button.dataset.result = !answer ? '' : choice.id === question.answer ? 'correct'
        : choice.id === answer.given ? 'wrong' : '';
    });
    feedback.hidden = summary || !answer;
    feedback.dataset.correct = String(answer?.correct);
    feedbackTitle.textContent = t(answer?.correct ? 'quiz.correct' : 'quiz.incorrect');
    const label = pick ? hotspots.find((hotspot) => hotspot.id === question.answer).title[lang]
      : question.choices.find((choice) => choice.id === question.answer).label[lang];
    correctAnswer.textContent = t('quiz.correctAnswer').replace('{answer}', () => label);
    explanation.textContent = question.explanation[lang];
    sources.setAttribute('aria-label', t('quiz.sources'));
    contacts.hidden = summary || !answer || !question.emergency;
    emergencyTitle.textContent = t('emergency.title');
    fire.textContent = t('emergency.fire');
    general.textContent = t('emergency.general');
    emergencySource.textContent = t('emergency.source');
    resetView.hidden = summary || !pick;
    resetView.disabled = !ready;
    resetView.textContent = t('quiz.resetView');
    restart.hidden = training.hidden = !summary;
    restart.disabled = !ready;
    restart.textContent = t('quiz.restart');
    training.textContent = t('quiz.training');
    score.hidden = duration.hidden = !summary;
    if (summary) {
      const attempt = session.attempt;
      score.textContent = `${attempt.score}/${attempt.total} · ${new Intl.NumberFormat(lang, { style: 'percent' }).format(attempt.score / attempt.total)}`;
      duration.textContent = t('quiz.duration').replace('{seconds}', new Intl.NumberFormat(lang).format(attempt.durationSec));
    }
    saved.hidden = !session.attempt;
    saved.className = saveFailed ? 'quiz__error' : 'quiz__muted';
    saved.textContent = t(saveFailed ? 'quiz.saveFailed' : 'quiz.saved');
    nav.hidden = summary;
    next.disabled = !answer;
    next.textContent = t(session.index === questions.length - 1 ? 'quiz.viewScore' : 'quiz.next');
    disclaimer.textContent = t('disclaimer');
  }
  return { element, render,
    focusHeading() { element.scrollTop = 0; heading.focus({ preventScroll: true }); },
    focusFeedback() { feedback.focus({ preventScroll: true }); feedback.scrollIntoView({ block: 'start' }); },
    enter() { observer.observe(nav); },
    exit() { observer.disconnect(); },
  };
}
