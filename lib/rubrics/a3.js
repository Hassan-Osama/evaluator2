'use strict';
// Assignment 2-3: basic parameter decorator (TrackIndex on Invoice.calculateTotal).
const A = require('../ast');

const msg = (i, m) => `Parameter at index ${i} in method ${m} was decorated`;

module.exports = {
  id: 3,
  title: 'Basic Parameter Decorator',
  names: ['Invoice', 'TrackIndex'],
  static: [
    {
      title: 'Invoice.calculateTotal(price: number, tax: number)',
      points: 10,
      check: ({ sf }) => {
        const m = A.findMethod(A.findClass(sf, 'Invoice'), 'calculateTotal');
        if (!m) return { score: 0, note: 'calculateTotal not found' };
        const [p, t] = m.parameters;
        return m.parameters.length === 2 && p.name.getText() === 'price' && A.typeText(p) === 'number' &&
          t.name.getText() === 'tax' && A.typeText(t) === 'number';
      },
    },
    {
      title: 'TrackIndex(target, propertyKey: string, parameterIndex: number)',
      points: 10,
      check: ({ sf }) => {
        const fn = A.findFunction(sf, 'TrackIndex');
        if (!fn) return { score: 0, note: 'TrackIndex not found' };
        const t = fn.parameters.map(A.typeText);
        return fn.parameters.length === 3 && t[1] === 'string' && t[2] === 'number' && t[0] !== null;
      },
    },
    {
      title: '@TrackIndex applied to the first parameter (price) only',
      points: 10,
      check: ({ sf }) => {
        const m = A.findMethod(A.findClass(sf, 'Invoice'), 'calculateTotal');
        if (!m) return false;
        const on = m.parameters.map((p) => A.describeDecorators(p).some((d) => d.name === 'TrackIndex'));
        return on[0] === true && on.slice(1).every((x) => !x);
      },
    },
    {
      title: 'Invoice instantiated and calculateTotal(100, 15) called',
      points: 10,
      check: ({ source }) => /new\s+Invoice\s*\(/.test(source) && /calculateTotal\s*\(\s*100\s*,\s*15\s*\)/.test(source),
    },
  ],
  runtime: [
    {
      title: 'Logs "Parameter at index 0 in method calculateTotal was decorated"',
      points: 15,
      test: ({ loadLogs }) =>
        loadLogs.some((l) => l.text.toLowerCase().includes(msg(0, 'calculateTotal').toLowerCase())),
    },
    {
      title: 'Message is logged exactly once (only the decorated parameter)',
      points: 5,
      test: ({ loadLogs }) => loadLogs.filter((l) => /was decorated/i.test(l.text)).length === 1,
    },
    {
      title: 'Message wording matches the specification exactly',
      points: 5,
      test: ({ loadLogs }) => loadLogs.some((l) => l.text.replace(/^['"`]|['"`]$/g, '').trim() === msg(0, 'calculateTotal')),
    },
    {
      title: 'TrackIndex reports any index / method name',
      points: 10,
      test: ({ scope, capture }) => {
        class T {}
        const r = capture(() => scope.TrackIndex(T.prototype, 'foo', 2));
        return !r.error && r.logs.some((l) => l.toLowerCase().includes(msg(2, 'foo').toLowerCase()));
      },
    },
    {
      title: 'calculateTotal(100, 15) runs without error',
      points: 5,
      test: ({ scope }) => {
        new scope.Invoice().calculateTotal(100, 15);
        return true;
      },
    },
  ],
};
