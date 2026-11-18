'use strict';
// Assignment 2-5: method decorator (Deprecated on Api.oldFetchData).
const A = require('../ast');

const WARN = (k) => `Warning: ${k} is deprecated`;

module.exports = {
  id: 5,
  title: 'Method Decorator',
  names: ['Api', 'Deprecated'],
  static: [
    {
      title: 'Api class with oldFetchData() method',
      points: 5,
      check: ({ sf }) => !!A.findMethod(A.findClass(sf, 'Api'), 'oldFetchData'),
    },
    {
      title: 'Deprecated(target: any, propertyKey: string, descriptor: PropertyDescriptor)',
      points: 10,
      check: ({ sf }) => {
        const fn = A.findFunction(sf, 'Deprecated');
        if (!fn) return { score: 0, note: 'Deprecated not found' };
        const t = fn.parameters.map(A.typeText);
        return fn.parameters.length === 3 && t[0] === 'any' && t[1] === 'string' && t[2] === 'PropertyDescriptor';
      },
    },
    {
      title: 'Stores the original function from descriptor.value',
      points: 5,
      check: ({ sf }) => /=\s*descriptor\.value\b/.test(A.bodyText(A.findFunction(sf, 'Deprecated'))),
    },
    {
      title: 'Overwrites descriptor.value with a wrapper that calls original.apply(this, args)',
      points: 10,
      check: ({ sf }) => {
        const t = A.bodyText(A.findFunction(sf, 'Deprecated'));
        return /descriptor\.value\s*=/.test(t) && /\.apply\(\s*this\s*,\s*args\s*\)/.test(t);
      },
    },
    {
      title: '@Deprecated applied to oldFetchData',
      points: 5,
      check: ({ sf }) => {
        const m = A.findMethod(A.findClass(sf, 'Api'), 'oldFetchData');
        return !!m && A.describeDecorators(m).some((d) => d.name === 'Deprecated' && !d.isCall);
      },
    },
    {
      title: 'Api instantiated and oldFetchData() called',
      points: 5,
      check: ({ source }) => /new\s+Api\s*\(/.test(source) && /\.oldFetchData\s*\(/.test(source),
    },
  ],
  runtime: [
    {
      title: 'Api.oldFetchData() logs "Warning: oldFetchData is deprecated"',
      points: 10,
      test: ({ scope, capture }) => {
        const r = capture(() => new scope.Api().oldFetchData());
        return r.logs.some((l) => l.includes(WARN('oldFetchData')));
      },
    },
    {
      title: 'Warning is logged before the original method runs',
      points: 10,
      test: ({ scope, logs, capture }) => {
        class T {
          m() {
            logs.push({ text: 'ORIGINAL', args: ['ORIGINAL'] });
          }
        }
        const r = capture(() => {
          const d = Object.getOwnPropertyDescriptor(T.prototype, 'm');
          Object.defineProperty(T.prototype, 'm', scope.Deprecated(T.prototype, 'm', d) || d);
          new T().m();
        });
        const w = r.logs.findIndex((l) => l.includes(WARN('m')));
        const o = r.logs.indexOf('ORIGINAL');
        return w !== -1 && o !== -1 && w < o;
      },
    },
    {
      title: 'Original receives this and arguments, and its return value is kept',
      points: 10,
      test: ({ scope, helpers }) => {
        class T {
          constructor() {
            this.v = 7;
          }
          m(a, b) {
            return this.v + a + b;
          }
        }
        helpers.applyMethodDecorator(T, 'm', scope.Deprecated);
        return new T().m(1, 2) === 10;
      },
    },
    {
      title: 'Warning uses the decorated method name (propertyKey)',
      points: 5,
      test: ({ scope, helpers, capture }) => {
        class T {
          fooBar() {}
        }
        helpers.applyMethodDecorator(T, 'fooBar', scope.Deprecated);
        return capture(() => new T().fooBar()).logs.some((l) => l.includes(WARN('fooBar')));
      },
    },
    {
      title: 'Demo output contains the warning',
      points: 5,
      test: ({ loadLogs }) => loadLogs.some((l) => l.text.includes(WARN('oldFetchData'))),
    },
  ],
};
