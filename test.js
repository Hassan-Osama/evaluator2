'use strict';
// Self-check: rubrics sum to 80 and the reference solutions get full marks.
const assert = require('assert');
const path = require('path');
const { grade, IDS } = require('./grade');

for (const id of IDS) {
  const r = require(`./lib/rubrics/a${id}.js`);
  const pts = [...r.static, ...r.runtime].reduce((s, i) => s + i.points, 0);
  assert.strictEqual(pts, 80, `rubric ${id} sums to ${pts}, expected 80`);

  const res = grade(path.join(__dirname, 'examples', 'correct', `reference_v${id}.ts`), id);
  const missed = res.items.filter((i) => i.earned < i.points).map((i) => i.title);
  assert.deepStrictEqual(missed, [], `reference_v${id} lost points`);
  console.log(`ok  assignment ${id}`);
}
