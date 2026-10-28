import { createPdf, validPdfName } from './pdf-common.js';

export async function buildReport(snapshot) {
  const { copy, lang, attempt, rows, name } = snapshot;
  if (!validPdfName(name)) throw new RangeError('pdf.nameUnsupported');
  const pdf = await createPdf(snapshot, copy['pdf.reportTitle']);
  const number = new Intl.NumberFormat(lang);
  const date = new Intl.DateTimeFormat(lang, { dateStyle: 'medium', timeStyle: 'short' });
  const percent = new Intl.NumberFormat(lang, { style: 'percent', maximumFractionDigits: 1 });
  pdf.paragraph(`${copy['results.name']}: ${name || '-'}`, { bold: true });
  pdf.paragraph(`${copy['pdf.date']}: ${date.format(new Date(attempt.finishedAt))}`);
  pdf.paragraph(`${copy['pdf.score']}: ${number.format(attempt.score)}/${number.format(attempt.total)} (${percent.format(attempt.score / attempt.total)})`, { bold: true, size: 14 });
  pdf.paragraph(`${copy['pdf.status']}: ${copy[attempt.passed ? 'quiz.passed' : 'quiz.failed']}`);
  pdf.paragraph(copy['quiz.duration'].replace('{seconds}', number.format(attempt.durationSec)));
  pdf.heading(copy['results.answers']);
  pdf.table([copy['results.question'], copy['results.answer'], copy['results.outcome']],
    rows.map((row, i) => [`${i + 1}. ${row.question}`, row.given, copy[row.correct ? 'quiz.correct' : 'quiz.incorrect']]),
    [82, 60, 32]);
  return pdf.finish();
}
