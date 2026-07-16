/* Runs the R blocks the page emitted (captured by the E2E) VERBATIM in real R
   and diffs every #> comment against what R actually prints.

   The #> comments are a contract: a reader copies the block, runs it, and must
   see exactly those numbers. That makes them a FORMATTING problem as much as a
   math one -- R prints 7 significant digits and flips to scientific below
   1e-4, so a value that is numerically perfect can still print differently.
   Nothing is injected into the code: #> is already a comment and Rscript
   auto-prints top-level expressions.

   Run: node Scripts/tool-truth/verify-beta-emitted-r.js */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const RSCRIPT = 'C:/Program Files/R/R-4.6.0/bin/Rscript.exe';
const blocks = JSON.parse(fs.readFileSync(
  path.join(__dirname, 'beta-emitted-r.json'), 'utf8'));

let pass = 0, fail = 0;
const tmp = path.join(require('os').tmpdir(), 'beta-emit');
if (!fs.existsSync(tmp)) fs.mkdirSync(tmp, { recursive: true });

for (const b of blocks) {
  const file = path.join(tmp, b.label + '.R');
  fs.writeFileSync(file, b.code + '\n');
  let out;
  try {
    out = execFileSync(RSCRIPT, [file], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    console.log(`RUN FAILED ${b.label}: ${e.stderr || e.message}`);
    fail++; continue;
  }
  // What R printed, in order: strip the "[1] " index prefixes.
  const printed = out.split('\n')
    .map(l => l.trim()).filter(l => /^\[\d+\]/.test(l))
    .map(l => l.replace(/^\[\d+\]\s*/, '').trim());
  // What the page claimed R would print.
  const claimed = b.code.split('\n')
    .filter(l => l.includes('#>'))
    .map(l => l.slice(l.indexOf('#>') + 2).trim());

  if (printed.length !== claimed.length) {
    console.log(`COUNT MISMATCH ${b.label}: page claims ${claimed.length} outputs, R printed ${printed.length}`);
    console.log('  R said: ' + JSON.stringify(printed));
    fail++; continue;
  }
  for (let i = 0; i < claimed.length; i++) {
    if (printed[i] === claimed[i]) pass++;
    else {
      fail++;
      console.log(`MISMATCH ${b.label} line ${i + 1}:\n  page #> ${claimed[i]}\n  R      ${printed[i]}`);
    }
  }
}

console.log(`\nemitted-R blocks: ${blocks.length}  #> lines matched: ${pass}  mismatched: ${fail}`);
process.exit(fail === 0 ? 0 : 1);
