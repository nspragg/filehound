// Times common searches over a generated tree of empty files.
//
//   npm run bench                       benchmarks ./dist
//   npm run bench -- <module path> ...  also benchmarks other builds, e.g. an
//                                       installed V1 (node_modules/filehound)
//
// Each case runs once to warm up, then the median of RUNS timed runs is shown.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';

const RUNS = 7;
const require = createRequire(import.meta.url);

// 8 x 8 x 8 directories, ~93k files
function buildTree(dir, depth = 0) {
  const exts = ['js', 'json', 'txt', 'md', 'ts'];
  fs.mkdirSync(dir, {recursive: true});
  const files = depth === 3 ? 180 : 10;
  for (let i = 0; i < files; i++) {
    fs.writeFileSync(path.join(dir, `f${i}.${exts[i % exts.length]}`), '');
  }
  if (depth < 3) {
    for (let i = 0; i < 8; i++) {
      buildTree(path.join(dir, `d${i}`), depth + 1);
    }
  }
}

// V1 exports FileHound itself, with ext() as a method
function casesFor(lib, dir) {
  const FileHound = lib.FileHound ?? lib;
  const json = () => lib.ext
    ? FileHound.create().paths(dir).match(lib.ext('json'))
    : FileHound.create().paths(dir).ext('json');

  return {
    'find()': () => FileHound.create().paths(dir).find(),
    'findSync()': () => FileHound.create().paths(dir).findSync(),
    'find() ext json': () => json().find(),
    'find() depth 2': () => FileHound.create().paths(dir).depth(2).find()
  };
}

// The version from the nearest package.json, e.g. filehound@1.17.6
function labelFor(mod) {
  for (let dir = path.dirname(require.resolve(mod)); dir !== path.dirname(dir); dir = path.dirname(dir)) {
    const pkg = path.join(dir, 'package.json');
    if (fs.existsSync(pkg)) {
      const {name, version} = JSON.parse(fs.readFileSync(pkg, 'utf8'));
      return `${name}@${version}`;
    }
  }
  return mod;
}

async function time(fn) {
  await fn();
  const times = [];
  let count = 0;
  for (let i = 0; i < RUNS; i++) {
    const start = process.hrtime.bigint();
    count = (await fn()).length;
    times.push(Number(process.hrtime.bigint() - start) / 1e6);
  }
  times.sort((a, b) => a - b);
  return {median: times[Math.floor(times.length / 2)], count};
}

const modules = [path.resolve('dist/index.js'), ...process.argv.slice(2).map(m => path.resolve(m))];
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'filehound-bench-'));

try {
  buildTree(dir);
  const rows = {};
  for (const mod of modules) {
    const lib = require(mod);
    for (const [name, fn] of Object.entries(casesFor(lib, dir))) {
      const {median, count} = await time(fn);
      rows[name] ??= {};
      rows[name][mod === modules[0] ? `${labelFor(mod)} (local)` : labelFor(mod)] = `${median.toFixed(1)} ms (${count})`;
    }
  }
  console.log(`Node ${process.version}, median of ${RUNS} runs (result count)`);
  console.table(rows);
} finally {
  fs.rmSync(dir, {recursive: true, force: true});
}
