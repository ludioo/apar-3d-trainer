import { getLang, t } from '../i18n/i18n.js';

const NS = 'http://www.w3.org/2000/svg';
function svgNode(tag, attributes, text) {
  const node = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  if (text !== undefined) node.textContent = text;
  return node;
}

export function renderHistory(chart, history, formatDate) {
  const percent = new Intl.NumberFormat(getLang(), { style: 'percent', maximumFractionDigits: 1 });
  chart.replaceChildren();
  chart.setAttribute('viewBox', '0 0 320 180');
  chart.setAttribute('role', 'img');
  chart.setAttribute('aria-labelledby', 'results-chart-title results-chart-description');
  const description = [];
  chart.append(svgNode('title', { id: 'results-chart-title' }, t('results.history')));
  for (const level of [0, 0.75, 1]) {
    const y = 144 - level * 120;
    chart.append(svgNode('text', { x: 0, y: y + 4, class: 'results-chart__label' }, percent.format(level)));
    chart.append(svgNode('line', { x1: 48, x2: 316, y1: y, y2: y,
      class: level === 0.75 ? 'results-chart__threshold' : 'results-chart__axis' }));
  }
  const step = 268 / history.length;
  history.forEach((attempt, index) => {
    const ratio = attempt.score / attempt.total;
    const text = t('results.attempt').replace('{n}', index + 1)
      .replace('{date}', formatDate(attempt.finishedAt))
      .replace('{score}', attempt.score).replace('{total}', attempt.total)
      .replace('{percent}', percent.format(ratio));
    description.push(text);
    const bar = svgNode('rect', { x: 48 + index * step + step * 0.15,
      y: 144 - ratio * 120, width: step * 0.7, height: ratio * 120,
      class: 'results-chart__bar', 'data-id': attempt.id, 'data-score': attempt.score });
    bar.append(svgNode('title', {}, text));
    chart.append(bar);
    if (index === 0 || index === history.length - 1) {
      chart.append(svgNode('text', { x: 48 + (index + 0.5) * step, y: 164,
        'text-anchor': 'middle', class: 'results-chart__label' }, new Intl.NumberFormat(getLang()).format(index + 1)));
    }
  });
  chart.append(svgNode('desc', { id: 'results-chart-description' }, description.join('. ')));
}
