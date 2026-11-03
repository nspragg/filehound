// Smoke test: runs every script in examples/ and fails if any exits non-zero.
// Examples import 'filehound', which resolves to dist/, so build first.
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const dir = join(root, 'examples');
const examples = readdirSync(dir).filter((name) => name.endsWith('.ts')).sort();

let failed = 0;
for (const name of examples) {
  const started = performance.now();
  const result = spawnSync(process.execPath, [join(dir, name)], {
    cwd: root,
    stdio: ['ignore', 'ignore', 'inherit']
  });
  const ms = Math.round(performance.now() - started);
  if (result.status === 0) {
    console.log(`ok   ${name} (${ms}ms)`);
  } else {
    failed++;
    console.log(`FAIL ${name} (exit ${result.status ?? result.signal})`);
  }
}

console.log(`${examples.length - failed}/${examples.length} examples passed`);
process.exitCode = failed > 0 ? 1 : 0;
