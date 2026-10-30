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
  hint.className = 'quiz__hint quiz__muted';
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
  const passingScore = document.createElement('p');
  const duration = document.createElement('p');
  const saved = document.createElement('p');
  saved.setAttribute('role', 'status');
  const review = document.createElement('section');
  review.className = 'quiz__review';
  const reviewHeading = document.createElement('h4');
  reviewHeading.id = 'quiz-review-heading';
  review.setAttribute('aria-labelledby', reviewHeading.id);
  const reviewList = document.createElement('ol');
  review.append(reviewHeading, reviewList);
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
  const results = button('results', tools);
  const disclaimer = document.createElement('p');
  disclaimer.className = 'quiz__muted';
  const nav = document.createElement('div');
  nav.className = 'quiz__nav';
  const next = button('next', nav);
  body.append(progress, heading, hint, choices, feedback, contacts, score, passingScore, duration, saved, review, tools, disclaimer);
  element.append(body, nav);
  let currentId;
  const observer = new ResizeObserver(() => {
    element.style.setProperty('--quiz-nav-height', `${nav.getBoundingClientRect().height}px`);
  });

  function renderReview(attempt, lang) {
    reviewList.replaceChildren();
    if (!attempt) return;
    for (const answer of attempt.answers) {
      const question = questions.find((entry) => entry.id === answer.qId);
      const answerLabel = (id) => question.type === 'pick-hotspot'
        ? hotspots.find((hotspot) => hotspot.id === id).title[lang]
        : question.choices.find((choice) => choice.id === id).label[lang];
      const item = document.createElement('li');
      const title = document.createElement('h5');
      title.textContent = question.question[lang];
      const given = document.createElement('p');
      given.textContent = t('quiz.yourAnswer').replace('{answer}', () => answerLabel(answer.given));
      const outcome = document.createElement('p');
      outcome.className = 'quiz__review-outcome';
      outcome.dataset.correct = String(answer.correct);
      outcome.textContent = t(answer.correct ? 'quiz.correct' : 'quiz.incorrect');
      item.append(title, given, outcome);
      if (!answer.correct) {
        const correction = document.createElement('p');
        correction.textContent = t('quiz.correctAnswer').replace('{answer}', () => answerLabel(question.answer));
        item.append(correction);
      }
      reviewList.append(item);
    }
  }

  function render({ session, ready, saveFailed }) {
    const scrollTop = element.scrollTop;
    const lang = getLang();
    const question = questions[session.index];
    const answer = session.answers[session.index];
    const summary = session.phase === 'summary';
    const pick = question.type === 'pick-hotspot';
    element.dataset.phase = session.phase;
    element.dataset.question = question.id;
    if (currentId !== question.id) {
      currentId = question.id;
      choices.after(feedback);
      choices.replaceChildren();
      for (const choice of question.choices ?? hotspots) {
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
    hint.hidden = summary;
    hint.textContent = t(!ready ? 'quiz.loading' : pick ? 'quiz.pickHint' : 'quiz.choiceHint');
    choices.hidden = summary;
    const options = [...choices.querySelectorAll(':scope > button')];
    options.forEach((button, index) => {
      const choice = (question.choices ?? hotspots)[index];
      button.textContent = pick ? t('quiz.part').replace('{n}', index + 1) : choice.label[lang];
      button.disabled = !ready || !!answer;
      button.setAttribute('aria-pressed', String(answer?.given === choice.id));
      button.dataset.result = !answer ? '' : choice.id === question.answer ? 'correct'
        : choice.id === answer.given ? 'wrong' : '';
    });
    feedback.hidden = summary || !answer;
    if (answer && !summary) {
      const selected = options.find((option) => option.dataset.choice === answer.given);
      if (feedback.previousElementSibling !== selected) selected.after(feedback);
    }
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
    restart.hidden = training.hidden = results.hidden = !summary;
    restart.disabled = !ready;
    restart.textContent = t('quiz.restart');
    training.textContent = t('quiz.training');
    results.textContent = t('results.view');
    score.hidden = passingScore.hidden = duration.hidden = review.hidden = !summary;
    passingScore.textContent = t('quiz.passingScore');
    reviewHeading.textContent = t('quiz.review');
    renderReview(summary ? session.attempt : null, lang);
    if (summary) {
      const attempt = session.attempt;
      score.textContent = `${attempt.score}/${attempt.total} · ${new Intl.NumberFormat(lang, { style: 'percent', maximumFractionDigits: 1 }).format(attempt.score / attempt.total)}`;
      duration.textContent = t('quiz.duration').replace('{seconds}', new Intl.NumberFormat(lang).format(attempt.durationSec));
    }
    saved.hidden = !session.attempt;
    saved.className = saveFailed ? 'quiz__error' : 'quiz__muted';
    saved.textContent = t(saveFailed ? 'quiz.saveFailed' : 'quiz.saved');
    nav.hidden = summary;
    next.disabled = !answer;
    next.textContent = t(session.index === questions.length - 1 ? 'quiz.viewScore' : 'quiz.next');
    disclaimer.textContent = t('disclaimer');
    element.scrollTop = scrollTop;
  }
  return { element, render,
    focusHeading() { element.scrollTop = 0; heading.focus({ preventScroll: true }); },
    focusFeedback() { feedback.focus({ preventScroll: true }); },
    enter() { observer.observe(nav); },
    exit() { observer.disconnect(); },
  };
}
