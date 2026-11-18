'use strict';
// Assignment 2-2: basic property decorator (ReadOnlyProperty on Profile.username).
const A = require('../ast');

const READONLY_RE = /read[- ]?only|cannot assign|not writable/i;

module.exports = {
  id: 2,
  title: 'Basic Property Decorator',
  names: ['Profile', 'ReadOnlyProperty'],
  // Reassigning a read-only property in the demo may legitimately crash the program.
  allowedLoadError: (e) => READONLY_RE.test(e.message),
  static: [
    {
      title: 'Profile class with a username: string property',
      points: 10,
      check: ({ sf }) => {
        const p = A.findProperty(A.findClass(sf, 'Profile'), 'username');
        return !!p && !!p.type && p.type.getText() === 'string';
      },
    },
    {
      title: 'ReadOnlyProperty(target: any, propertyKey: string)',
      points: 10,
      check: ({ sf }) => {
        const fn = A.findFunction(sf, 'ReadOnlyProperty');
        if (!fn) return { score: 0, note: 'ReadOnlyProperty not found' };
        const t = fn.parameters.map(A.typeText);
        return fn.parameters.length === 2 && t[0] === 'any' && t[1] === 'string';
      },
    },
    {
      title: 'Uses Object.defineProperty(target, propertyKey, { writable: false })',
      points: 10,
      check: ({ sf }) => {
        const fn = A.findFunction(sf, 'ReadOnlyProperty');
        if (!fn) return false;
        return A.callsTo(fn, /^Object\.defineProperty$/).some((c) =>
          /writable\s*:\s*false/.test(c.arguments[2] ? c.arguments[2].getText() : '')
        );
      },
    },
    {
      title: '@ReadOnlyProperty applied to username',
      points: 5,
      check: ({ sf }) => {
        const p = A.findProperty(A.findClass(sf, 'Profile'), 'username');
        return !!p && A.describeDecorators(p).some((d) => d.name === 'ReadOnlyProperty' && !d.isCall);
      },
    },
    {
      title: 'Profile instantiated and username reassigned',
      points: 5,
      check: ({ source }) => /new\s+Profile\s*\(/.test(source) && /\.username\s*=[^=]/.test(source),
    },
  ],
  runtime: [
    {
      title: 'Profile.prototype.username is non-writable',
      points: 10,
      test: ({ scope }) => {
        const d = Object.getOwnPropertyDescriptor(scope.Profile.prototype, 'username');
        return !!d && d.writable === false;
      },
    },
    {
      title: 'ReadOnlyProperty makes any property read-only (throws on assignment)',
      points: 10,
      test: ({ scope }) => {
        class T {}
        scope.ReadOnlyProperty(T.prototype, 'x');
        try {
          new T().x = 1;
        } catch (e) {
          return e instanceof TypeError;
        }
        return false;
      },
    },
    {
      title: 'Read-only is enforced on Profile (constructing or reassigning throws TypeError)',
      points: 10,
      test: ({ scope }) => {
        let p;
        try {
          p = new scope.Profile('alice');
        } catch (e) {
          return e instanceof TypeError ? { score: 1, note: 'constructor assignment threw' } : false;
        }
        try {
          p.username = 'changed';
        } catch (e) {
          return e instanceof TypeError;
        }
        return { score: 0, note: 'reassignment did not throw' };
      },
    },
    {
      title: 'Demo shows the read-only error (logged or thrown)',
      points: 10,
      test: ({ loadLogs, loadError }) =>
        loadLogs.some((l) => READONLY_RE.test(l.text)) || (!!loadError && READONLY_RE.test(loadError.message)),
    },
  ],
};
