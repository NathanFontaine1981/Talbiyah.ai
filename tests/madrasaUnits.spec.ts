// Run with: npm run test:unit   (Node >= 22.18 strips TypeScript types natively)
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseUnitLines, parseReference, classifyRow, toUpsertPayload, formatCitation, revalidate,
} from '../src/lib/madrasaUnits.ts';

const one = (text) => parseUnitLines(text)[0];

test('canonical line', () => {
  const r = one('3 | Wudu | steps and why | Book 3 pp 12–15');
  assert.deepEqual(
    [r.unit_number, r.title, r.description, r.book_reference, r.page_from, r.page_to, r.errors],
    [3, 'Wudu', 'steps and why', 'Book 3', 12, 15, []],
  );
});

test('page notation variants', () => {
  const cases = [
    ['Book 3 pp 12-15', 'Book 3', 12, 15],
    ['Book 3 pp. 12 – 15', 'Book 3', 12, 15],
    ['Book 3, p. 12', 'Book 3', 12, 12],
    ['Book 3 p12', 'Book 3', 12, 12],
    ['Book 3 pages 12 to 15', 'Book 3', 12, 15],
    ['Book 3 (pp 12—15)', 'Book 3', 12, 15],
    ['Book 3 12-15', 'Book 3', 12, 15],
    ['12-15', '', 12, 15],
    ['Book 3', 'Book 3', null, null],
    ['Book 3-4', 'Book 3-4', null, null],   // a hyphenated label is not a page range
    ['', '', null, null],
  ];
  for (const [raw, ref, from, to] of cases) {
    const r = parseReference(raw);
    assert.deepEqual([r.book_reference, r.page_from, r.page_to], [ref, from, to], raw);
  }
});

test('messy input: extra spaces, missing description, no pipes around', () => {
  const rows = parseUnitLines('   4   |   Salah   |   |  Book 3   pp   20-22  \n5|Fasting\n');
  assert.equal(rows.length, 2);
  assert.deepEqual([rows[0].unit_number, rows[0].title, rows[0].description, rows[0].book_reference, rows[0].page_from, rows[0].page_to], [4, 'Salah', '', 'Book 3', 20, 22]);
  assert.deepEqual([rows[1].unit_number, rows[1].title, rows[1].errors], [5, 'Fasting', []]);
});

test('three fields: third is a citation, not a description', () => {
  const r = one('6 | Zakat | Book 3 pp 30-31');
  assert.deepEqual([r.description, r.book_reference, r.page_from, r.page_to], ['', 'Book 3', 30, 31]);
  const d = one('6 | Zakat | giving to those in need');
  assert.deepEqual([d.description, d.book_reference], ['giving to those in need', '']);
});

test('unit number forms, header and comment lines, blank lines, CRLF, tabs', () => {
  const rows = parseUnitLines('No | Topic | Description | Book\r\n# my notes\r\n\r\nUnit 1. | Intro\r\n#2 | Pillars\r\n3\tWudu\tsteps\tBook 3 p. 4');
  assert.deepEqual(rows.map((r) => [r.unit_number, r.title, r.line]), [[1, 'Intro', 4], [2, 'Pillars', 5], [3, 'Wudu', 6]]);
  assert.equal(rows[2].page_from, 4);
});

test('per-line validation errors carry the line number', () => {
  const rows = parseUnitLines('1 | Good\nx | No number\n3 |  \n4 | Backwards | | Book 3 pp 20-10\njust text');
  assert.deepEqual(rows.map((r) => [r.line, r.errors.length > 0]), [[1, false], [2, true], [3, true], [4, true], [5, true]]);
  assert.match(rows[1].errors[0], /Unit number/);
  assert.match(rows[2].errors[0], /title/i);
  assert.match(rows[3].errors.join(), /before the start page/);
});

test('duplicate unit numbers within a paste are flagged on every occurrence, and clear when fixed', () => {
  let rows = parseUnitLines('2 | A\n2 | B\n3 | C');
  assert.ok(rows[0].errors.some((e) => /more than once/.test(e)));
  assert.ok(rows[1].errors.some((e) => /more than once/.test(e)));
  assert.equal(rows[2].errors.length, 0);
  rows = revalidate(rows.map((r, i) => (i === 1 ? { ...r, unit_number: 4 } : r)));
  assert.deepEqual(rows.map((r) => r.errors.length), [0, 0, 0]);
});

test('re-paste is idempotent: classify against saved units, payload keyed by unit number', () => {
  const saved = [{ id: 'a', unit_number: 1, title: 'Intro', description: '', book_reference: 'Book 3', page_from: 1, page_to: 3 }];
  const rows = parseUnitLines('1 | Intro | | Book 3 pp 1-3\n1b');
  assert.equal(classifyRow(rows[0], saved), 'unchanged');
  assert.equal(classifyRow({ ...rows[0], title: 'Introduction' }, saved), 'update');
  assert.equal(classifyRow({ ...rows[0], unit_number: 2 }, saved), 'new');
  const payload = toUpsertPayload('c1', [rows[0]]);
  assert.deepEqual(payload, [{ class_id: 'c1', unit_number: 1, title: 'Intro', description: null, book_reference: 'Book 3', page_from: 1, page_to: 3 }]);
});

test('formatCitation', () => {
  assert.equal(formatCitation({ book_reference: 'Book 3', page_from: 12, page_to: 15 }), 'Book 3, pp. 12–15');
  assert.equal(formatCitation({ book_reference: 'Book 3', page_from: 12, page_to: 12 }), 'Book 3, p. 12');
  assert.equal(formatCitation({ book_reference: '', page_from: null, page_to: null }), '');
});
