import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildUserPrompt, checkOutput, citationFor, outputSchema, redactNames, untashkeeledArabic,
} from '../supabase/functions/_shared/madrasaMaterials.ts';

const unit = { title: 'Wudu', description: 'steps', book_reference: 'Book 3', page_from: 10, page_to: 15 };
const act = (type: string) => ({ title: 't', type, duration_minutes: 8, materials: [], how_to_run: ['a'], learning_point: 'l', extension: 'e' });
const good = {
  parent_notes: 'Today your child learned wudu.\n\n### What we covered\nx\n### Key ideas\ny\n### Talk about it at home\nz\n\nThis was covered in class from Book 3, pp. 10–15.',
  homework: 'Draw the steps on plain paper with a parent.',
  teacher_activities: [act('game'), act('drill'), act('role-play')],
};

test('citation wording', () => {
  assert.equal(citationFor(unit), 'covered in class from Book 3, pp. 10–15');
  assert.equal(citationFor({ ...unit, page_to: 10 }), 'covered in class from Book 3, p. 10');
  assert.equal(citationFor({ title: 'x', book_reference: 'Book 3' }), 'covered in class from Book 3');
  assert.equal(citationFor({ title: 'x' }), null);
});

test('a good output passes with no problems', () => {
  const c = checkOutput(good, [unit], ['parent_notes', 'homework', 'teacher_activities']);
  assert.deepEqual(c, { hard: [], warnings: [] });
});

test('hard failures: opener, citation count, book mention without citation, series name, activity count', () => {
  const all = ['parent_notes', 'homework', 'teacher_activities'] as const;
  const s = [...all];
  assert.match(checkOutput({ ...good, parent_notes: 'We learned wudu.' }, [unit], s).hard.join(), /Today your child learned/);
  assert.match(checkOutput({ ...good, parent_notes: good.parent_notes + ' ' + 'covered in class from Book 3, pp. 10–15' }, [unit], s).hard.join(), /exactly once in parent_notes \(found 2\)/);
  assert.match(checkOutput({ ...good, parent_notes: good.parent_notes.replace('This was covered in class from Book 3, pp. 10–15.', '') }, [unit], s).hard.join(), /found 0/);
  assert.match(checkOutput({ ...good, parent_notes: 'Today your child learned x. See Book 3 p. 4.' }, [{ title: 'Wudu' }], s).hard.join(), /no citation was supplied/);
  assert.match(checkOutput({ ...good, homework: 'Use the Safar book' }, [unit], s).hard.join(), /Safar/);
  assert.match(checkOutput({ ...good, teacher_activities: [act('game')] }, [unit], s).hard.join(), /3 or 4/);
});

test('warnings: missing tashkeel and off-brief homework', () => {
  const w = checkOutput({ ...good, homework: 'Print the worksheet. Say الوضوء aloud.' }, [unit], ['parent_notes', 'homework', 'teacher_activities']).warnings.join();
  assert.match(w, /Arabic without tashkeel/);
  assert.match(w, /something other than/);
});

test('tashkeel detector', () => {
  assert.deepEqual(untashkeeledArabic('بِسْمِ اللَّهِ'), []);
  assert.deepEqual(untashkeeledArabic('صَلَاةٌ and صلاة'), ['صلاة']);
  assert.deepEqual(untashkeeledArabic('plain English only'), []);
});

test('name redaction: case-insensitive, possessives, whole words only, longest first', () => {
  const names = ['Aisha', 'Ali', 'Test Alif', 'Test', 'Alif'];
  const r = redactNames("Aisha's mum and aisha, plus Alison and Ali. Test Alif too.", names);
  assert.equal(r.text, '[a child] mum and [a child], plus Alison and [a child]. [a child] too.');
  assert.equal(r.redactions, 4);
  assert.deepEqual(redactNames('nothing here', names), { text: 'nothing here', redactions: 0 });
});

test('model prompt carries only age band, topics, citation and emphasis', () => {
  const p = buildUserPrompt({ ageBand: 'Year 3, ages 7-8', units: [unit], emphasis: 'Stress salah.', sections: ['parent_notes'] });
  assert.match(p, /Year 3, ages 7-8/);
  assert.match(p, /covered in class from Book 3, pp\. 10–15/);
  assert.match(p, /Stress salah\./);
  assert.doesNotMatch(p, /Islamic Studies|Cheadle|Safar|Randa/i);
});

test('schema only requires the requested sections', () => {
  assert.deepEqual(outputSchema(['teacher_activities']).required, ['teacher_activities']);
  assert.deepEqual(Object.keys(outputSchema(['parent_notes', 'homework']).properties as object), ['parent_notes', 'homework']);
});
