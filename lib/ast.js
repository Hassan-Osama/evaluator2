'use strict';
const ts = require('typescript');

function walk(node, cb) {
  cb(node);
  ts.forEachChild(node, (c) => walk(c, cb));
}

function findAll(node, pred) {
  const out = [];
  walk(node, (n) => {
    if (pred(n)) out.push(n);
  });
  return out;
}

function findClass(sf, name) {
  return findAll(sf, (n) => ts.isClassDeclaration(n) && n.name && n.name.text === name)[0] || null;
}

// Finds `function name() {}` or `const name = (...) => {}` / `function () {}` and returns the function-like node.
function findFunction(sf, name) {
  for (const n of findAll(sf, () => true)) {
    if (ts.isFunctionDeclaration(n) && n.name && n.name.text === name) return n;
    if (
      ts.isVariableDeclaration(n) &&
      ts.isIdentifier(n.name) &&
      n.name.text === name &&
      n.initializer &&
      (ts.isArrowFunction(n.initializer) || ts.isFunctionExpression(n.initializer))
    ) {
      return n.initializer;
    }
  }
  return null;
}

function findMethod(cls, name) {
  if (!cls) return null;
  return cls.members.find((m) => ts.isMethodDeclaration(m) && m.name.getText() === name) || null;
}

function findProperty(cls, name) {
  if (!cls) return null;
  return cls.members.find((m) => ts.isPropertyDeclaration(m) && m.name.getText() === name) || null;
}

function decoratorsOf(node) {
  return (ts.canHaveDecorators(node) && ts.getDecorators(node)) || [];
}

// Returns [{ name, isCall, args: [text] }] for each decorator on `node`.
function describeDecorators(node) {
  return decoratorsOf(node).map((d) => {
    const e = d.expression;
    if (ts.isCallExpression(e)) {
      return { name: e.expression.getText(), isCall: true, args: e.arguments.map((a) => a.getText()) };
    }
    return { name: e.getText(), isCall: false, args: [] };
  });
}

function typeText(param) {
  return param.type ? param.type.getText().replace(/\s+/g, '') : null;
}

function bodyText(fn) {
  return fn && fn.body ? fn.body.getText() : '';
}

// The first function-like node returned by `fn` (for decorator factories).
function returnedFunction(fn) {
  if (!fn || !fn.body) return null;
  if (!ts.isBlock(fn.body)) {
    return ts.isArrowFunction(fn.body) || ts.isFunctionExpression(fn.body) ? fn.body : null;
  }
  for (const r of findAll(fn.body, (n) => ts.isReturnStatement(n))) {
    const e = r.expression;
    if (e && (ts.isArrowFunction(e) || ts.isFunctionExpression(e))) return e;
  }
  return null;
}

function callsTo(node, textPattern) {
  return findAll(node, (n) => ts.isCallExpression(n) && textPattern.test(n.expression.getText()));
}

module.exports = {
  ts,
  walk,
  findAll,
  findClass,
  findFunction,
  findMethod,
  findProperty,
  decoratorsOf,
  describeDecorators,
  typeText,
  bodyText,
  returnedFunction,
  callsTo,
};
