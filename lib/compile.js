'use strict';
const ts = require('typescript');
const path = require('path');

// Compiler settings used to grade every submission. Edit here to change the grading environment.
// useDefineForClassFields=false matches the classic decorator semantics the assignments rely on
// (e.g. a prototype-level non-writable property must be enforced on instances).
const OPTIONS = {
  strict: true,
  target: ts.ScriptTarget.ES2020,
  module: ts.ModuleKind.CommonJS,
  lib: ['lib.es2020.d.ts', 'lib.dom.d.ts'],
  experimentalDecorators: true,
  useDefineForClassFields: false,
  moduleDetection: ts.ModuleDetectionKind.Force,
  types: [],
  skipLibCheck: true,
  noEmitOnError: false,
};

function compile(file) {
  const abs = path.resolve(file);
  const program = ts.createProgram([abs], OPTIONS);
  const sf = program.getSourceFile(abs);
  let js = null;
  program.emit(sf, (name, text) => {
    if (name.endsWith('.js')) js = text;
  });
  const diagnostics = ts
    .getPreEmitDiagnostics(program, sf)
    .map((d) => {
      const msg = ts.flattenDiagnosticMessageText(d.messageText, '\n');
      let line = null;
      if (d.file && d.start !== undefined) line = d.file.getLineAndCharacterOfPosition(d.start).line + 1;
      return { line, code: d.code, message: msg };
    });
  return { sf, js, diagnostics, source: sf.getFullText() };
}

module.exports = { compile, OPTIONS };
