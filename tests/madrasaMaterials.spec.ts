import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildUserPrompt, checkOutput, citationFor, numberedSteps, outputSchema, redactNames, untashkeeledArabic, SYSTEM_PROMPT,
} from '../supabase/functions/_shared/madrasaMaterials.ts';

const unit = { title: 'Wudu', description: 'steps', book_reference: 'Book 3', page_from: 10, page_to: 15 };
const act = (type: string) => ({ title: 't', type, duration_minutes: 8, materials: [], how_to_run: ['a'], learning_point: 'l', extension: 'e' });
const good = {
  parent_notes: 'Today your child learned wudu.\n\n### What we covered\nx\n### Key ideas\ny\n### Talk about it at home\nz\n\nThis was covered in class from Book 3, pp. 10–15.',
  homework: '**Goal:** Draw.\n\n1. Fold paper.\n2. Draw the steps.\n3. Show a parent.',
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

test('homework numbering: 2-4 steps, starting at 1, sequential', () => {
  const s = ['parent_notes', 'homework', 'teacher_activities'] as const;
  const hw = (h: string) => checkOutput({ ...good, homework: h }, [unit], [...s]).hard.join();
  assert.equal(hw('1. a\n2. b'), '');
  assert.match(hw('2. a\n3. b\n4. c'), /numbered 1, 2, 3.*found 2, 3, 4/);           // the Zakat bug: began at step 2
  assert.match(hw('1. a\n2. b\n3. c\n4. d\n5. e'), /5 numbered steps; the maximum is 4/);
  assert.match(hw('1. a\n3. b'), /in order \(found 1, 3\)/);
  assert.match(hw('Just do some drawing with a parent.'), /needs 2-4 numbered steps/);
  assert.deepEqual(numberedSteps('Goal\n1. a\n  2) b\nnot 3. x'), [1, 2]);
});

test('prompt carries the lower-edge age rule and the 4-step cap', () => {
  assert.match(SYSTEM_PROMPT, /lower edge of the stated age band/);
  assert.match(SYSTEM_PROMPT, /under-9s unless each is glossed in one child-friendly phrase/);
  assert.match(SYSTEM_PROMPT, /never more than 4/);
});
