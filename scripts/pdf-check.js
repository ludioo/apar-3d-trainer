import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildReport } from '../src/features/pdf/pdf-report.js';
import { createPdf, snapshotPdf, validPdfName, APP_URL } from '../src/features/pdf/pdf-common.js';
import { buildResults } from '../src/features/results/results-data.js';
import questions from '../src/data/quiz.json' with { type: 'json' };
import hotspots from '../src/data/hotspots.json' with { type: 'json' };

const theme = { paper: '#ffffff', ink: '#16191e', muted: '#545b66', rule: '#c7cbd1', accent: '#ffc629' };
for (const name of ['', 'Barkah', 'a'.repeat(60), "José D’Angelo", '<script>alert(1)</script>']) assert.ok(validPdfName(name));
for (const name of ['a'.repeat(61), '名字', 'Barkah🔥', 'a\nb', 'a\u0000b', 'name\u2015', 'name\u2016', 'name\u2017', null]) assert.ok(!validPdfName(name));
for (const lang of ['en', 'id']) {
  const dictionary = JSON.parse(readFileSync(new URL(`../src/i18n/${lang}.json`, import.meta.url), 'utf8'));
  const snapshot = snapshotPdf((key) => dictionary[key], lang, theme);
  assert.equal(snapshot.copy.disclaimer, dictionary.disclaimer);
  assert.ok(snapshot.sources.length >= 2);
  assert.ok(snapshot.emergencyUrl.startsWith('https://layanan112.komdigi.go.id/'));
  const continued = await createPdf(snapshot, snapshot.copy['pdf.reportTitle']);
  continued.paragraph(Array(140).fill('Long source text crossing a page boundary.').join('\n'), { size: 9 });
  assert.ok(continued.doc.getNumberOfPages() > 1);
  assert.equal(continued.doc.getFontSize(), 9, 'page header must not change the continuation font');
  for (const score of [0, 5, 6, 8]) {
    const latest = { id: 'latest', finishedAt: '2026-10-28T01:00:20.000Z', durationSec: 20, score, total: 8, passed: score >= 6,
      answers: questions.map((q, index) => ({ qId: q.id, correct: index < score,
        given: index < score ? q.answer : q.type === 'choice' ? q.choices.find((c) => c.id !== q.answer).id : 'body' })) };
    const report = buildResults([latest, { id: 'older' }], questions, hotspots, lang);
    assert.equal(report.latest, latest);
    assert.equal(report.rows.length, 8);
    for (const name of ['', 'a'.repeat(60)]) {
      const doc = await buildReport({ ...snapshot, attempt: latest, rows: report.rows, name });
      const content = doc.internal.pages.slice(1).flat().join('\n');
      assert.ok(content.includes(score >= 6 ? dictionary['quiz.passed'] : dictionary['quiz.failed']));
      if (score === 5) assert.ok(content.includes(lang === 'id' ? '62,5%' : '62.5%'));
      for (const required of ['113', '112', 'Komdigi', 'PER.04/MEN/1980', APP_URL, ...snapshot.sources.map((s) => s.label)]) {
        assert.ok(content.includes(required), `Missing ${required} in ${lang} report`);
      }
      assert.ok(doc.getNumberOfPages() >= 2);
      assert.ok(doc.output().startsWith('%PDF-'));
    }
    await assert.rejects(buildReport({ ...snapshot, attempt: latest, rows: report.rows, name: '🔥' }), /pdf.nameUnsupported/);
  }
}
console.log('PDF checks passed: latest result, 0/5/6/8 scores, EN/ID, names, sources, emergency and multipage output.');
