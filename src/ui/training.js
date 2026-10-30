import { getLang, t } from '../i18n/i18n.js';
import emergency from '../data/emergency.json';
import './training.css';

export function initTrainingUi(steps, actions) {
  const element = document.createElement('section');
  element.className = 'training';
  const stepper = document.createElement('ol');
  stepper.className = 'training__stepper';
  const indicators = steps.map(() => {
    const item = document.createElement('li');
    stepper.appendChild(item);
    return item;
  });
  const body = document.createElement('div');
  body.className = 'training__body';
  body.tabIndex = 0;
  const heading = document.createElement('h3');
  heading.tabIndex = -1;
  const instruction = document.createElement('p');
  const hint = document.createElement('p');
  hint.id = 'training-hint';
  hint.className = 'training__muted';
  const status = document.createElement('p');
  status.className = 'training__status';
  status.setAttribute('role', 'status');
  const feedback = document.createElement('div');
  feedback.className = 'training__feedback';
  feedback.append(hint, status);
  const sweepArea = document.createElement('div');
  sweepArea.className = 'training__sweep';
  const sweepLabel = document.createElement('label');
  sweepLabel.htmlFor = 'training-sweep';
  const sweepSides = document.createElement('div');
  sweepSides.className = 'training__sweep-sides';
  const left = document.createElement('span');
  const right = document.createElement('span');
  sweepSides.append(left, right);
  const sweepTrack = document.createElement('div');
  sweepTrack.className = 'training__sweep-track';
  const zones = ['left', 'right'].map((side) => {
    const zone = document.createElement('span');
    zone.className = 'training__sweep-zone';
    zone.dataset.side = side;
    zone.setAttribute('aria-hidden', 'true');
    return zone;
  });
  const sweepInput = document.createElement('input');
  sweepInput.type = 'range';
  sweepInput.id = 'training-sweep';
  sweepInput.min = '0';
  sweepInput.max = '100';
  sweepInput.step = '1';
  sweepInput.value = '0';
  sweepInput.setAttribute('aria-describedby', 'training-hint training-sweep-goal training-sweep-count');
  sweepTrack.append(...zones, sweepInput);
  const sweepGoal = document.createElement('p');
  sweepGoal.id = 'training-sweep-goal';
  sweepArea.append(sweepLabel, sweepSides, sweepTrack, sweepGoal);
  const sweepCount = document.createElement('p');
  sweepCount.id = 'training-sweep-count';
  sweepCount.setAttribute('role', 'status');
  sweepCount.setAttribute('aria-atomic', 'true');
  const controls = document.createElement('div');
  controls.className = 'training__tools';
  function button(action, parent = controls) {
    const el = document.createElement('button');
    el.type = 'button';
    el.dataset.training = action;
    el.addEventListener('click', actions[action]);
    parent.appendChild(el);
    return el;
  }
  const start = button('start');
  const restart = button('restart');
  const refocus = button('refocus');
  const interact = button('interact');
  interact.setAttribute('aria-describedby', 'training-hint');
  const interactLabel = document.createElement('span');
  const holdRing = document.createElement('span');
  holdRing.className = 'training__hold-ring';
  holdRing.setAttribute('aria-hidden', 'true');
  interact.append(interactLabel, holdRing);
  const skip = button('skip');
  const contacts = document.createElement('section');
  contacts.className = 'training__contacts';
  const emergencyTitle = document.createElement('h4');
  const fire = document.createElement('a');
  fire.href = `tel:${emergency.fire}`;
  const general = document.createElement('a');
  general.href = `tel:${emergency.general}`;
  const source = document.createElement('a');
  source.href = emergency.sourceUrl;
  source.target = '_blank';
  source.rel = 'noopener noreferrer';
  contacts.append(emergencyTitle, fire, general, source);
  const quizButton = button('quiz');
  const storageError = document.createElement('p');
  storageError.className = 'training__error';
  storageError.setAttribute('role', 'status');
  const disclaimer = document.createElement('p');
  disclaimer.className = 'training__disclaimer';
  body.append(heading, instruction, sweepArea, sweepCount, feedback, controls, contacts, storageError, disclaimer);
  const nav = document.createElement('div');
  nav.className = 'training__nav';
  const back = button('back', nav);
  const next = button('next', nav);
  element.append(stepper, body, nav);
  const navObserver = new ResizeObserver(() => {
    element.style.setProperty('--training-nav-height', `${nav.getBoundingClientRect().height + 8}px`);
  });

  function render({ session, ready, sweep, saveFailed }) {
    const lang = getLang();
    const isStep = session.phase === 'steps';
    const isComplete = session.phase === 'complete';
    const step = steps[session.index];
    const done = session.status[session.index];
    element.dataset.phase = session.phase;
    stepper.hidden = !isStep;
    stepper.setAttribute('aria-label', t('training.steps'));
    indicators.forEach((item, index) => {
      item.textContent = `${index + 1} ${steps[index].title[lang]}`;
      item.classList.toggle('is-done', !!session.status[index]);
      if (index === session.index) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
    });
    heading.textContent = isStep ? `${session.index + 1}/4 · ${step.title[lang]}` : t(isComplete ? 'training.complete' : 'training.intro');
    instruction.textContent = isStep ? step.instruction[lang] : t(isComplete ? 'training.completeNote' : 'training.introNote');
    feedback.hidden = !isStep;
    hint.classList.toggle('is-inactive', !!done);
    hint.textContent = t(`training.hint.${step.interaction}`);
    status.classList.toggle('is-inactive', !done);
    status.textContent = t(done === 'skipped' ? 'training.skipped' : 'training.success');
    sweepArea.hidden = !isStep || step.interaction !== 'drag';
    sweepArea.dataset.target = done ? '' : sweep.target;
    sweepLabel.textContent = t('training.sweepLabel');
    left.textContent = t('training.left');
    right.textContent = t('training.right');
    sweepInput.disabled = !ready || !isStep || step.interaction !== 'drag' || !!done;
    if (sweepInput.valueAsNumber !== sweep.value) sweepInput.value = String(sweep.value);
    const number = new Intl.NumberFormat(lang === 'id' ? 'id-ID' : 'en-US');
    const goalText = t('training.sweepGoal').replace('{side}', t(`training.${sweep.target}`));
    const valueText = t('training.sweepValue').replace('{position}', number.format(sweep.value))
      .replace('{n}', number.format(sweep.cycles));
    sweepInput.setAttribute('aria-valuetext', done ? valueText : `${valueText} ${goalText}`);
    if (sweepGoal.textContent !== goalText) sweepGoal.textContent = goalText;
    sweepGoal.classList.toggle('is-inactive', !!done);
    sweepCount.hidden = sweepArea.hidden;
    const cycleText = t('training.cycles').replace('{n}', number.format(sweep.cycles));
    if (sweepCount.textContent !== cycleText) sweepCount.textContent = cycleText;
    start.hidden = isStep || isComplete;
    start.disabled = !ready;
    start.textContent = t('training.start');
    restart.hidden = !isComplete;
    restart.disabled = !ready;
    restart.textContent = t('training.restart');
    refocus.hidden = !isStep;
    refocus.disabled = !ready;
    refocus.textContent = t('training.refocus');
    interact.hidden = !isStep || step.interaction === 'drag';
    interact.disabled = !ready || !!done;
    interact.dataset.interaction = step.interaction;
    holdRing.hidden = step.interaction !== 'hold';
    interactLabel.textContent = t(step.interaction === 'hold' ? 'training.holdAction' : 'training.clickAction');
    skip.hidden = !isStep;
    skip.disabled = !ready || !!done;
    skip.textContent = t('training.skip');
    nav.hidden = !isStep;
    back.disabled = session.index === 0;
    back.textContent = t('training.back');
    next.disabled = !ready || !done;
    next.textContent = t(session.index === steps.length - 1 ? 'training.finish' : 'training.next');
    contacts.hidden = !isComplete;
    emergencyTitle.textContent = t('emergency.title');
    fire.textContent = t('emergency.fire');
    general.textContent = t('emergency.general');
    source.textContent = t('emergency.source');
    quizButton.hidden = !isComplete;
    quizButton.disabled = !ready;
    quizButton.textContent = t('quiz.start');
    storageError.hidden = !saveFailed;
    storageError.textContent = t('training.storageError');
    disclaimer.textContent = t('disclaimer');
  }
  function focusHeading() {
    element.scrollTop = 0;
    heading.focus({ preventScroll: true });
    if (!sweepArea.hidden) sweepCount.scrollIntoView({ block: 'nearest' });
  }
  return { element, sweepInput, interact, render, focusHeading,
    progress(value) { holdRing.style.setProperty('--hold-progress', `${value * 360}deg`); },
    enter() { navObserver.observe(nav); },
    exit() { navObserver.disconnect(); },
  };
}
