import test from 'node:test';
import assert from 'node:assert/strict';
import { containsArabic, splitArabicRuns, splitMarkdownTables } from '../src/lib/arabicText.ts';
import { arabicToHtml, firstSentence, publishedNotesEmail } from '../supabase/functions/_shared/madrasaEmail.ts';

const BISMILLAH = 'بِسْمِ اللَّهِ';

test('runs: multi-word Arabic stays together; English around it is untouched', () => {
  const runs = splitArabicRuns(`Say ${BISMILLAH} (bismillah) then wash.`);
  assert.deepEqual(runs.map((r) => [r.arabic, r.text]), [[false, 'Say '], [true, BISMILLAH], [false, ' (bismillah) then wash.']]);
  assert.equal(containsArabic('plain'), false);
  assert.equal(containsArabic('صِدْقٌ'), true);
});

test('runs keep every tashkeel mark and the prophetic salutation ligature', () => {
  const [r] = splitArabicRuns('وُضُوءٌ');
  assert.equal(r.text, 'وُضُوءٌ');
  assert.equal([...r.text].filter((c) => /[ً-ْ]/.test(c)).length, 3);
  assert.equal(splitArabicRuns('Muhammad ﷺ').some((x) => x.arabic && x.text === 'ﷺ'), true);
});

test('markdown tables are separated from prose', () => {
  const md = '### Words\n| Arabic | Say | Meaning |\n|---|---|---|\n| وُضُوءٌ | wu-doo | washing |\n| صَلَاةٌ | sa-laah | prayer |\n\nAfter.';
  const b = splitMarkdownTables(md);
  assert.deepEqual(b.map((x) => x.kind), ['md', 'table', 'md']);
  const t = b[1] as { header: string[]; rows: string[][] };
  assert.deepEqual(t.header, ['Arabic', 'Say', 'Meaning']);
  assert.deepEqual(t.rows[1], ['صَلَاةٌ', 'sa-laah', 'prayer']);
});

test('email: Arabic is wrapped dir=rtl, HTML is escaped, tashkeel survives, link present', () => {
  const html = arabicToHtml(`Learn ${BISMILLAH} <b>&`);
  assert.match(html, /<span dir="rtl" lang="ar"[^>]*>بِسْمِ اللَّهِ<\/span>/);
  assert.match(html, /&lt;b&gt;&amp;/);
  const mail = publishedNotesEmail({ summary: `Today your child learned ${BISMILLAH}.`, portalUrl: 'https://talbiyah.ai/x?a=1&b=2', childFirstName: 'Test Alif' });
  assert.match(mail.html, /dir="rtl"/);
  assert.match(mail.html, /Read the full notes/);
  assert.match(mail.html, /href="https:\/\/talbiyah\.ai\/x\?a=1&amp;b=2"/);
  assert.match(mail.text, /Read the full notes: https:\/\/talbiyah\.ai/);
  assert.doesNotMatch(mail.html, /### |Key ideas/);   // never the full notes
});

test('firstSentence takes the opening line only', () => {
  assert.equal(firstSentence('Today your child learned **wudu**.\n\n### What we covered\nx'), 'Today your child learned wudu.');
});

test('app and email implementations find the same Arabic runs', () => {
  const samples = [`Say ${BISMILLAH} now`, 'Muhammad ﷺ taught صِدْقٌ، and أَمَانَةٌ.', 'no arabic', 'صَلَاةٌ'];
  for (const t of samples) {
    const fromApp = splitArabicRuns(t).filter((r) => r.arabic).map((r) => r.text);
    const fromEmail = [...arabicToHtml(t).matchAll(/<span dir="rtl"[^>]*>(.*?)<\/span>/g)].map((m) => m[1]);
    assert.deepEqual(fromEmail, fromApp, t);
  }
});

import { isTestAddress, joinNames, notesEmailSubject } from '../supabase/functions/_shared/madrasaEmail.ts';

test('test addresses are never emailed; real ones are', () => {
  for (const e of ['a@example.com', 'a@EXAMPLE.org', 'x@foo.test', 'x@bar.invalid']) assert.equal(isTestAddress(e), true, e);
  for (const e of ['mum@gmail.com', 'a@talbiyah.ai', 'a@examplecorp.com']) assert.equal(isTestAddress(e), false, e);
});

test('subjects name only the supplied children', () => {
  assert.equal(joinNames(['Alif']), 'Alif');
  assert.equal(joinNames(['Alif', 'Ba']), 'Alif and Ba');
  assert.equal(joinNames(['A', 'B', 'C']), 'A, B and C');
  assert.equal(notesEmailSubject({ kind: 'publish', childNames: ['Alif', 'Ba'] }), 'Class notes for Alif and Ba');
  assert.equal(notesEmailSubject({ kind: 'update', childNames: ['Alif'] }), 'Class notes for Alif (updated)');
});

test('email declares UTF-8 so Arabic survives clients that guess the charset', () => {
  const mail = publishedNotesEmail({ summary: `Say ${BISMILLAH}`, portalUrl: 'https://talbiyah.ai/madrasa/family' });
  assert.match(mail.html, /<meta charset="utf-8">/i);
  assert.match(mail.html, /<meta name="viewport"/);
});
