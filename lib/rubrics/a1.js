'use strict';
// Assignment 2-1: basic class decorator (AddCreationDate on User).
const A = require('../ast');

const info = (sf) => {
  const fn = A.findFunction(sf, 'AddCreationDate');
  return { fn, body: A.bodyText(fn) };
};

module.exports = {
  id: 1,
  title: 'Basic Class Decorator',
  names: ['User', 'AddCreationDate'],
  static: [
    {
      title: 'User class declared',
      points: 5,
      check: ({ sf }) => !!A.findClass(sf, 'User'),
    },
    {
      title: 'AddCreationDate is a function taking the constructor as its only argument',
      points: 10,
      check: ({ sf }) => {
        const { fn } = info(sf);
        if (!fn) return { score: 0, note: 'AddCreationDate not found' };
        return fn.parameters.length === 1;
      },
    },
    {
      title: 'Decorator sets createdAt on target.prototype to new Date()',
      points: 10,
      check: ({ sf }) => {
        const { fn, body } = info(sf);
        if (!fn) return false;
        const hasDate = A.findAll(fn.body, (n) => A.ts.isNewExpression(n) && n.expression.getText() === 'Date').length > 0;
        return /\.prototype/.test(body) && /createdAt/.test(body) && hasDate;
      },
    },
    {
      title: '@AddCreationDate applied to User',
      points: 10,
      check: ({ sf }) => {
        const cls = A.findClass(sf, 'User');
        return !!cls && A.describeDecorators(cls).some((d) => d.name === 'AddCreationDate' && !d.isCall);
      },
    },
    {
      title: 'User is instantiated',
      points: 5,
      check: ({ source }) => /new\s+User\s*\(/.test(source),
    },
  ],
  runtime: [
    {
      title: 'User.prototype.createdAt is a Date set by the decorator',
      points: 15,
      test: ({ scope }) => {
        const U = scope.User;
        if (!U) return { score: 0, note: 'User not found' };
        return Object.prototype.hasOwnProperty.call(U.prototype, 'createdAt') && U.prototype.createdAt instanceof Date;
      },
    },
    {
      title: 'Instances inherit createdAt from the prototype',
      points: 10,
      test: ({ scope }) => {
        const u = new scope.User();
        return u.createdAt instanceof Date && !Object.prototype.hasOwnProperty.call(u, 'createdAt');
      },
    },
    {
      title: 'createdAt is printed to the console',
      points: 10,
      test: ({ loadLogs }) => {
        const y = String(new Date().getFullYear());
        return loadLogs.some((l) => l.args.some((a) => a instanceof Date) || (l.text.includes(y) && /\d{2}:\d{2}/.test(l.text)));
      },
    },
    {
      title: 'AddCreationDate works on any class',
      points: 5,
      test: ({ scope }) => {
        class T {}
        const R = scope.AddCreationDate(T) || T;
        return new R().createdAt instanceof Date;
      },
    },
  ],
};
