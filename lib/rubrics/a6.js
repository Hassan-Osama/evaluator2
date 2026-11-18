'use strict';
// Assignment 2-6: method decorator factory (MultiplyResult(10) on Calculator.getBaseValue).
const A = require('../ast');

module.exports = {
  id: 6,
  title: 'Method Decorator Factory',
  names: ['Calculator', 'MultiplyResult'],
  static: [
    {
      title: 'Calculator class with getBaseValue() method',
      points: 5,
      check: ({ sf }) => !!A.findMethod(A.findClass(sf, 'Calculator'), 'getBaseValue'),
    },
    {
      title: 'getBaseValue() returns 5',
      points: 5,
      check: ({ sf }) => {
        const m = A.findMethod(A.findClass(sf, 'Calculator'), 'getBaseValue');
        return !!m && /return\s+5\s*;?/.test(A.bodyText(m));
      },
    },
    {
      title: 'MultiplyResult(factor: number) returns a decorator(target, propertyKey, descriptor)',
      points: 10,
      check: ({ sf }) => {
        const fn = A.findFunction(sf, 'MultiplyResult');
        if (!fn) return { score: 0, note: 'MultiplyResult not found' };
        const inner = A.returnedFunction(fn);
        return fn.parameters.length === 1 && A.typeText(fn.parameters[0]) === 'number' &&
          !!inner && inner.parameters.length === 3;
      },
    },
    {
      title: 'Wrapper runs the original via apply(this, args) and multiplies the result by factor',
      points: 10,
      check: ({ sf }) => {
        const inner = A.returnedFunction(A.findFunction(sf, 'MultiplyResult'));
        const t = A.bodyText(inner);
        return /\.apply\(\s*this\s*,\s*args\s*\)/.test(t) && /\*\s*factor|factor\s*\*/.test(t);
      },
    },
    {
      title: '@MultiplyResult(10) applied to getBaseValue',
      points: 5,
      check: ({ sf }) => {
        const m = A.findMethod(A.findClass(sf, 'Calculator'), 'getBaseValue');
        return !!m && A.describeDecorators(m).some((d) => d.name === 'MultiplyResult' && d.isCall && d.args[0] === '10');
      },
    },
    {
      title: 'Calculator instantiated and getBaseValue() called/printed',
      points: 5,
      check: ({ source }) => /new\s+Calculator\s*\(/.test(source) && /console\.log\([^;]*getBaseValue\s*\(|=\s*\w+\.getBaseValue\s*\(/.test(source),
    },
  ],
  runtime: [
    {
      title: 'new Calculator().getBaseValue() === 50',
      points: 10,
      test: ({ scope }) => new scope.Calculator().getBaseValue() === 50,
    },
    {
      title: 'Output prints 50',
      points: 10,
      test: ({ loadLogs }) => loadLogs.some((l) => /\b50\b/.test(l.text)),
    },
    {
      title: 'Factory is generic (MultiplyResult(3) triples a result)',
      points: 10,
      test: ({ scope, helpers }) => {
        class T {
          m() {
            return 4;
          }
        }
        helpers.applyMethodDecorator(T, 'm', scope.MultiplyResult(3));
        return new T().m() === 12;
      },
    },
    {
      title: 'Wrapper forwards this and arguments to the original',
      points: 10,
      test: ({ scope, helpers }) => {
        class T {
          constructor() {
            this.base = 2;
          }
          m(a, b) {
            return this.base + a + b;
          }
        }
        helpers.applyMethodDecorator(T, 'm', scope.MultiplyResult(10));
        return new T().m(1, 2) === 50;
      },
    },
  ],
};
