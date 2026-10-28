import { createPdf } from './pdf-common.js';

export async function buildSpec(snapshot) {
  const { copy, lang } = snapshot;
  const pdf = await createPdf(snapshot, copy['pdf.specTitle']);
  const date = new Intl.DateTimeFormat(lang, { dateStyle: 'medium', timeStyle: 'short' });
  pdf.paragraph(`${copy['pdf.exported']}: ${date.format(new Date(snapshot.exportedAt))}`);
  pdf.image(snapshot.image);
  pdf.paragraph(`${copy['price.illustrative']}: ${snapshot.price}`, { bold: true, size: 14 });
  pdf.heading(copy['spec.illustrative']);
  pdf.table(null, snapshot.rows, [92, 82]);
  pdf.paragraph(snapshot.note);
  pdf.paragraph(copy['spec.source'], { bold: true, url: snapshot.specSource });
  pdf.paragraph(snapshot.specSource, { size: 9, url: snapshot.specSource });
  return pdf.finish();
}
