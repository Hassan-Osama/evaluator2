'use strict';
// Assignment 2-4: class decorator factory (InjectRole('Admin') on AdminDashboard).
const A = require('../ast');

module.exports = {
  id: 4,
  title: 'Class Decorator Factory',
  names: ['AdminDashboard', 'InjectRole'],
  static: [
    {
      title: 'AdminDashboard class declared',
      points: 5,
      check: ({ sf }) => !!A.findClass(sf, 'AdminDashboard'),
    },
    {
      title: 'InjectRole(roleName: string) returns a decorator taking the constructor',
      points: 10,
      check: ({ sf }) => {
        const fn = A.findFunction(sf, 'InjectRole');
        if (!fn) return { score: 0, note: 'InjectRole not found' };
        const inner = A.returnedFunction(fn);
        return fn.parameters.length === 1 && A.typeText(fn.parameters[0]) === 'string' &&
          !!inner && inner.parameters.length === 1;
      },
    },
    {
      title: 'Inner decorator attaches role = roleName to target.prototype',
      points: 10,
      check: ({ sf }) => {
        const inner = A.returnedFunction(A.findFunction(sf, 'InjectRole'));
        if (!inner) return false;
        const t = A.bodyText(inner);
        return /\.prototype/.test(t) && /role/.test(t) && /roleName/.test(t);
      },
    },
    {
      title: "@InjectRole('Admin') applied to AdminDashboard",
      points: 10,
      check: ({ sf }) => {
        const cls = A.findClass(sf, 'AdminDashboard');
        return !!cls && A.describeDecorators(cls).some(
          (d) => d.name === 'InjectRole' && d.isCall && /^['"`]Admin['"`]$/.test(d.args[0] || '')
        );
      },
    },
    {
      title: 'AdminDashboard instantiated',
      points: 5,
      check: ({ source }) => /new\s+AdminDashboard\s*\(/.test(source),
    },
  ],
  runtime: [
    {
      title: "new AdminDashboard().role === 'Admin'",
      points: 10,
      test: ({ scope }) => new scope.AdminDashboard().role === 'Admin',
    },
    {
      title: 'role lives on the prototype (inherited, not an own instance property)',
      points: 10,
      test: ({ scope }) => {
        const proto = scope.AdminDashboard.prototype;
        return Object.prototype.hasOwnProperty.call(proto, 'role') &&
          !Object.prototype.hasOwnProperty.call(new scope.AdminDashboard(), 'role');
      },
    },
    {
      title: 'Factory is configurable and instances are independent',
      points: 10,
      test: ({ scope }) => {
        class A1 {}
        class B1 {}
        const a = scope.InjectRole('Guest')(A1) || A1;
        const b = scope.InjectRole('Editor')(B1) || B1;
        return new a().role === 'Guest' && new b().role === 'Editor';
      },
    },
    {
      title: 'The inherited role is printed to the console',
      points: 10,
      test: ({ loadLogs }) => loadLogs.some((l) => /\bAdmin\b/.test(l.text)),
    },
  ],
};
