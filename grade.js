#!/usr/bin/env node
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { compile } = require('./lib/compile');

const IDS = [1, 2, 3, 4, 5, 6];
const TIMEOUT_MS = 10000;

function usage() {
  console.log(`Usage:
  node grade.js <file.ts> -a <1-6>        grade one submission
  node grade.js <folder>  [-a <1-6>]      grade every .ts file in the folder (recursively)
Options:
  -a, --assignment N   assignment number (1-6). If omitted it is inferred from a folder name
                       (1..6, v3, assignment_2_3 ...) or from the file name (..._v3.ts, ..._2_3.ts).
  -o, --out DIR        write results.csv, results.json and feedback/<student>.txt to DIR
  -q, --quiet          only print the summary table`);
}

function parseArgs(argv) {
  const o = { target: null, assignment: null, out: null, quiet: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '-a' || a === '--assignment') o.assignment = Number(argv[++i]);
    else if (a === '-o' || a === '--out') o.out = argv[++i];
    else if (a === '-q' || a === '--quiet') o.quiet = true;
    else if (a === '-h' || a === '--help') o.help = true;
    else o.target = a;
  }
  return o;
}

function inferAssignment(file) {
  const parts = path.relative(process.cwd(), path.resolve(file)).split(path.sep);
  const dirs = parts.slice(0, -1).reverse();
  for (const d of dirs) {
    const m = d.match(/^(?:assignment[_ -]?)?(?:2[_-])?(?:v|version)?([1-6])$/i);
    if (m) return Number(m[1]);
  }
  const base = path.basename(file, path.extname(file));
  const m = base.match(/(?:^|[_\-. ])(?:v|version|a2_|assignment_?2_|2_)([1-6])(?=$|[_\-. ])/i);
  return m ? Number(m[1]) : null;
}

function listTs(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...listTs(p));
    else if (/\.ts$/.test(e.name) && !/\.d\.ts$/.test(e.name)) out.push(p);
  }
  return out.sort();
}

const clamp = (n) => Math.max(0, Math.min(1, n));
function normalize(r) {
  if (typeof r === 'boolean') return { score: r ? 1 : 0 };
  if (typeof r === 'number') return { score: clamp(r) };
  return { score: clamp(r.score === undefined ? (r.pass ? 1 : 0) : r.score), note: r.note };
}

function runChild(js, id) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'grader-'));
  const jsFile = path.join(tmp, 'submission.js');
  fs.writeFileSync(jsFile, js);
  try {
    const r = spawnSync(process.execPath, [path.join(__dirname, 'lib', 'runner.js'), jsFile, String(id)], {
      encoding: 'utf8',
      timeout: TIMEOUT_MS,
      maxBuffer: 10 * 1024 * 1024,
    });
    if (r.error && r.error.code === 'ETIMEDOUT') return { failure: `timed out after ${TIMEOUT_MS / 1000}s (infinite loop?)` };
    const i = (r.stdout || '').lastIndexOf('__RESULT__');
    if (i === -1) return { failure: `runner crashed: ${(r.stderr || '').trim().split('\n').pop()}` };
    return JSON.parse(r.stdout.slice(i + '__RESULT__'.length));
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

function grade(file, id) {
  const rubric = require(`./lib/rubrics/a${id}.js`);
  const c = compile(file);
  const items = [];
  const add = (section, title, points, r) => {
    const n = normalize(r);
    items.push({ section, title, points, earned: Math.round(points * n.score * 10) / 10, note: n.note || '' });
  };

  // Static (structure) checks.
  const ctx = { sf: c.sf, source: c.source };
  for (const it of rubric.static) {
    let r;
    try {
      r = it.check(ctx);
    } catch (e) {
      r = { score: 0, note: `check error: ${e.message}` };
    }
    add('Structure', it.title, it.points, r);
  }

  // Runtime checks (run the compiled code in a child process).
  const run = c.js ? runChild(c.js, id) : { failure: 'no JavaScript emitted' };
  rubric.runtime.forEach((it, i) => {
    const r = run.failure ? { score: 0, note: run.failure } : run.results[i];
    add('Behaviour', it.title, it.points, r);
  });

  const order = ['Structure', 'Behaviour'];
  items.sort((a, b) => order.indexOf(a.section) - order.indexOf(b.section));

  const total = items.reduce((s, i) => s + i.earned, 0);
  const max = items.reduce((s, i) => s + i.points, 0);
  return { file, assignment: id, title: rubric.title, total: Math.round(total * 10) / 10, max, items, output: run.loadLogs || [] };
}

function formatReport(r) {
  const lines = [`${path.basename(r.file)}  —  Assignment 2-${r.assignment} (${r.title})  —  ${r.total}/${r.max}`];
  let section = '';
  for (const i of r.items) {
    if (i.section !== section) {
      section = i.section;
      lines.push(`  [${section}]`);
    }
    const mark = i.earned === i.points ? '✔' : i.earned === 0 ? '✘' : '◐';
    lines.push(`   ${mark} ${String(i.earned).padStart(4)}/${String(i.points).padEnd(3)} ${i.title}${i.note ? `  — ${i.note}` : ''}`);
  }
  lines.push(`  Program output: ${r.output.length ? r.output.map((o) => JSON.stringify(o)).join(' | ') : '(none)'}`);
  return lines.join('\n');
}

function csvCell(v) {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function main() {
  const o = parseArgs(process.argv.slice(2));
  if (o.help || !o.target) return usage();
  if (!fs.existsSync(o.target)) return console.error(`Not found: ${o.target}`);
  if (o.assignment !== null && !IDS.includes(o.assignment)) return console.error('Assignment must be 1-6');

  const files = fs.statSync(o.target).isDirectory() ? listTs(o.target) : [o.target];
  const results = [];
  for (const f of files) {
    const id = o.assignment || inferAssignment(f);
    if (!id) {
      console.error(`SKIP ${f}: cannot infer assignment number, use -a N`);
      continue;
    }
    const r = grade(f, id);
    r.student = path.basename(f, '.ts');
    results.push(r);
    if (!o.quiet) console.log(formatReport(r) + '\n');
  }
  if (!results.length) return;

  if (results.length > 1 || o.quiet) {
    console.log('Summary');
    for (const r of results) console.log(`  ${r.student.padEnd(30)} A2-${r.assignment}  ${String(r.total).padStart(5)}/${r.max}`);
  }

  if (o.out) {
    fs.mkdirSync(path.join(o.out, 'feedback'), { recursive: true });
    fs.writeFileSync(path.join(o.out, 'results.json'), JSON.stringify(results, null, 2));
    const rows = [['student', 'assignment', 'total', 'max', 'file']];
    for (const r of results) {
      rows.push([r.student, r.assignment, r.total, r.max, r.file]);
      fs.writeFileSync(path.join(o.out, 'feedback', `${r.student}_A2-${r.assignment}.txt`), formatReport(r) + '\n');
    }
    fs.writeFileSync(path.join(o.out, 'results.csv'), rows.map((r) => r.map(csvCell).join(',')).join('\n') + '\n');
    console.log(`\nWrote ${o.out}/results.csv, results.json and feedback/`);
  }
}

if (require.main === module) main();
module.exports = { grade, IDS };
