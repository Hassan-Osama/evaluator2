'use strict';
// Child process: runs a compiled student submission, then executes the hidden runtime tests of the rubric
// inside the same scope so they can reach non-exported classes/decorators by name.
// Usage: node runner.js <compiled.js> <assignmentId>
const fs = require('fs');
const util = require('util');
const path = require('path');

const [, , jsFile, id] = process.argv;
const rubric = require(path.join(__dirname, 'rubrics', `a${id}.js`));
const helpers = require('./rubrics/helpers.js');

const logs = [];
const record = (...args) => logs.push({ text: util.format(...args), args });
const fakeConsole = {};
for (const k of ['log', 'info', 'warn', 'error', 'debug', 'trace', 'table', 'dir']) fakeConsole[k] = record;
for (const k of ['group', 'groupEnd', 'time', 'timeEnd', 'assert', 'count']) fakeConsole[k] = () => {};

let scope = {};
const names = rubric.names;
const getters = names
  .map((n) => `get ${n}() { try { return ${n}; } catch (e) { return undefined; } }`)
  .join(',');
const body = `"use strict";\n__setScope({${getters}});\n${fs.readFileSync(jsFile, 'utf8')}`;

process.on('uncaughtException', () => {});
process.on('unhandledRejection', () => {});

let loadError = null;
try {
  const mod = { exports: {} };
  new Function('exports', 'require', 'module', 'console', '__setScope', body)(
    mod.exports,
    require,
    mod,
    fakeConsole,
    (s) => (scope = s)
  );
} catch (e) {
  loadError = e;
}

const loadLogs = logs.slice();
const env = {
  scope,
  logs,
  loadLogs,
  loadError: loadError && { name: loadError.name, message: String(loadError.message) },
  helpers,
  // Runs fn and returns the console lines it produced, its result, and any error it threw.
  capture(fn) {
    const start = logs.length;
    let result;
    let error = null;
    try {
      result = fn();
    } catch (e) {
      error = e;
    }
    return { logs: logs.slice(start).map((l) => l.text), result, error };
  },
};

const results = rubric.runtime.map((item) => {
  try {
    const r = item.test(env);
    if (typeof r === 'boolean') return { score: r ? 1 : 0 };
    if (typeof r === 'number') return { score: r };
    return { score: r.score === undefined ? (r.pass ? 1 : 0) : r.score, note: r.note };
  } catch (e) {
    return { score: 0, note: `test error: ${e && e.message}` };
  }
});

process.stdout.write('\n__RESULT__' + JSON.stringify({ results, loadError: env.loadError, loadLogs: loadLogs.map((l) => l.text) }));
process.exit(0);
