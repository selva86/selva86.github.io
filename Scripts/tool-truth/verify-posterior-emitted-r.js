/* Runs the R blocks the page emitted (captured by the E2E) VERBATIM in real R
   and diffs every #> comment against what R actually prints.

   The #> comments are a contract: a reader copies the block, runs it, and must
   see exactly those numbers. That makes them a FORMATTING problem as much as a
   math one -- R prints 7 significant digits, drops trailing zeros, pads the
   exponent to two digits, and gives a whole vector ONE common format driven by
   the element needing the most decimals. A value that is numerically perfect
   can still print differently. Nothing is injected into the code: #> is already
   a comment and Rscript auto-prints top-level expressions.

   Run: node Scripts/tool-truth/verify-posterior-emitted-r.js */
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const RSCRIPT = 'C:/Program Files/R/R-4.6.0/bin/Rscript.exe';
const blocks = JSON.parse(fs.readFileSync(path.join(__dirname, 'posterior-emitted-r.json'), 'utf8'));
const tmp = path.join(os.tmpdir(), 'posterior-emit');
if (!fs.existsSync(tmp)) fs.mkdirSync(tmp, { recursive: true });

let pass = 0, fail = 0, lines = 0;
const fails = [];

blocks.forEach((b, i) => {
  const file = path.join(tmp, 'blk' + i + '.R');
  fs.writeFileSync(file, b.code, 'utf8');
  let out;
  try {
    out = execFileSync(RSCRIPT, [file], { encoding: 'utf8', timeout: 60000 });
  } catch (e) {
    fail++; fails.push(`${b.id}: R failed to run -- ${String(e.message).slice(0, 200)}`);
    return;
  }
  const actual = out.split(/\r?\n/).filter(s => s.trim() !== '');
  const expected = b.code.split('\n').filter(s => s.trim().startsWith('#>')).map(s => s.trim().replace(/^#>\s?/, ''));
  if (actual.length !== expected.length) {
    fail++;
    fails.push(`${b.id}: emitted ${expected.length} #> lines but R printed ${actual.length}`);
    return;
  }
  expected.forEach((e, j) => {
    lines++;
    if (e.trim() === actual[j].trim()) pass++;
    else { fail++; fails.push(`${b.id}\n      emitted: ${e}\n      R says : ${actual[j]}`); }
  });
});

console.log(`${pass}/${lines} emitted #> lines match R exactly (${blocks.length} blocks)`);
if (fails.length) { console.log('\nMISMATCHES:'); fails.slice(0, 25).forEach(f => console.log('  - ' + f)); }
process.exit(fail ? 1 : 0);
