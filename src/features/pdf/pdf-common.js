import questions from '../../data/quiz.json' with { type: 'json' };
import emergency from '../../data/emergency.json' with { type: 'json' };

export const APP_URL = 'https://trainer.barkahmauludi.com';
const COPY_KEYS = ['app.name', 'disclaimer', 'emergency.title', 'emergency.fire', 'emergency.general',
  'emergency.source', 'quiz.sources', 'quiz.passed', 'quiz.failed', 'quiz.correct', 'quiz.incorrect',
  'quiz.duration', 'results.question', 'results.answer', 'results.outcome', 'results.answers',
  'results.name', 'price.illustrative', 'spec.illustrative', 'spec.source',
  'pdf.reportTitle', 'pdf.specTitle', 'pdf.date', 'pdf.exported', 'pdf.score', 'pdf.status', 'pdf.page'];

export function snapshotPdf(t, lang, theme) {
  return { lang, theme, exportedAt: new Date().toISOString(),
    copy: Object.fromEntries(COPY_KEYS.map((key) => [key, t(key)])),
    sources: [...new Map(questions.flatMap((question) => question.sources).map((source) => [source.url, source])).values()],
    emergencyUrl: emergency.sourceUrl };
}

export function validPdfName(name) {
  // shortcut: standard Helvetica/WinAnsi only; embed a licensed Unicode font if broader names are required.
  return typeof name === 'string' && name.length <= 60 &&
    /^[\x20-\x7e\u00a0-\u00ff\u0152\u0153\u0160\u0161\u0178\u017d\u017e\u0192\u02c6\u02dc\u2013\u2014\u2018\u2019\u201a\u201c-\u201e\u2020-\u2022\u2026\u2030\u2039\u203a\u20ac]*$/u.test(name);
}

export async function createPdf(snapshot, title) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  const { theme, copy, lang } = snapshot;
  const margin = 18;
  const width = 174;
  const bottom = 275;
  let y;
  doc.setProperties({ title, author: copy['app.name'], subject: APP_URL });
  doc.setLanguage(lang === 'id' ? 'id-ID' : 'en-US');

  function page() {
    doc.setFillColor(theme.paper);
    doc.rect(0, 0, 210, 297, 'F');
    doc.setFillColor(theme.accent);
    doc.rect(margin, 13, 16, 2, 'F');
    doc.setFont('helvetica', 'bold').setFontSize(10).setTextColor(theme.ink);
    doc.text(copy['app.name'], margin, 23);
    doc.setFontSize(20);
    doc.text(title, margin, 35);
    y = 45;
  }
  function ensure(height) {
    if (y + height <= bottom) return;
    doc.addPage();
    page();
  }
  function paragraph(text, { bold = false, size = 10, url } = {}) {
    doc.setFont('helvetica', bold ? 'bold' : 'normal').setFontSize(size);
    const lines = doc.splitTextToSize(String(text), width);
    const lineHeight = size * 0.48;
    for (const line of lines) {
      ensure(lineHeight);
      doc.setFont('helvetica', bold ? 'bold' : 'normal').setFontSize(size).setTextColor(theme.ink).text(line, margin, y);
      if (url) doc.link(margin, y - lineHeight * 0.75, doc.getTextWidth(line), lineHeight, { url });
      y += lineHeight;
    }
    y += 3;
  }
  function heading(text) {
    ensure(20);
    y += 3;
    paragraph(text, { bold: true, size: 12 });
  }
  function table(headers, rows, widths) {
    function row(cells, bold) {
      doc.setFont('helvetica', bold ? 'bold' : 'normal').setFontSize(10);
      const lines = cells.map((cell, i) => doc.splitTextToSize(String(cell), widths[i] - 5));
      const height = Math.max(...lines.map((cell) => cell.length)) * 4.8 + 6;
      if (y + height > bottom) {
        doc.addPage(); page();
        if (!bold && headers) row(headers, true);
        doc.setFont('helvetica', bold ? 'bold' : 'normal').setFontSize(10);
      }
      let x = margin;
      for (let i = 0; i < cells.length; i++) {
        doc.setTextColor(theme.ink).text(lines[i], x + 1, y + 4, { lineHeightFactor: 1.36 });
        x += widths[i];
      }
      y += height;
      doc.setDrawColor(theme.rule).setLineWidth(0.2).line(margin, y - 2, margin + width, y - 2);
    }
    if (headers) row(headers, true);
    rows.forEach((cells) => row(cells, false));
    y += 4;
  }
  function image(data) {
    ensure(125);
    doc.addImage(data, 'JPEG', margin + 7, y, 160, 120);
    y += 126;
  }
  function finish() {
    ensure(32);
    heading(copy['quiz.sources']);
    for (const source of snapshot.sources) {
      const urlLines = doc.setFont('helvetica', 'normal').setFontSize(9).splitTextToSize(source.url, width).length;
      ensure(11 + urlLines * 4.32);
      paragraph(source.label, { bold: true });
      paragraph(source.url, { size: 9, url: source.url });
    }
    heading(copy['disclaimer']);
    paragraph(copy['emergency.title'], { bold: true });
    paragraph(copy['emergency.fire'], { url: 'tel:113' });
    paragraph(copy['emergency.general'], { url: 'tel:112' });
    paragraph(copy['emergency.source'], { size: 9, url: snapshot.emergencyUrl });
    paragraph(snapshot.emergencyUrl, { size: 9, url: snapshot.emergencyUrl });
    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i).setFont('helvetica', 'normal').setFontSize(8).setTextColor(theme.muted);
      doc.text(APP_URL, margin, 287);
      doc.link(margin, 283, 104, 5, { url: APP_URL });
      doc.text(`${copy['pdf.page']} ${i}/${pages}`, 192, 287, { align: 'right' });
    }
    return doc;
  }
  page();
  return { doc, paragraph, heading, table, image, finish };
}
