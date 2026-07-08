# /write-tool vif-interpreter - build plan + parity checklist

Predecessor: `tools/vif-interpreter.html` built in commit 27cd13012 (tools-suite redesign).
Already a v2 page (injected chrome, tool-lead, banner, inference line, FAQ/WebApplication JSON-LD).
This pass = rebuild-in-place to the current bar: verified math lib, correct+live R, and the
mandatory v2 elements the original build omitted. No capability dropped.

## Pass 0 - full feature inventory of the predecessor (all preserved)

- Two input modes: `vif` (paste car::vif output) and `cor` (paste correlation matrix).
- Parser robustness: named vector, per-line name/value, GVIF 3-col table (GVIF, Df, GVIF^(1/(2Df))),
  matrix with row labels, `Inf`/`NaN` tokens, leading `>` prompt strip.
- 5 scenario presets: clean, borderline, problem, cor-matrix, gvif.
- Correlation-matrix mode: auto-drops a response column (mpg/y/response/outcome/target),
  computes VIF = diag(solve(R)), condition number, correlation heatmap.
- Adjustable thresholds (low/high) via two number inputs AND two range sliders (synced).
- Per-predictor table: VIF, tolerance (1/VIF), SE inflation (sqrt VIF), Df (GVIF), traffic-light flag.
- Big "Max VIF" number, plain-English box, condition-number block w/ eigenvalues, per-predictor
  recommendation callouts, VIF<1 anomaly + single-predictor warnings.
- SVG bar chart with threshold reference lines; live viz readout.
- 3 UX features already present: tool-lead, "I want to..." banner w/ mode label, inference line.
- Content: 3-min primer, 5-step anatomy, "when this is the wrong tool" table, further reading,
  numerical-accuracy note. WebApplication + FAQPage + BreadcrumbList JSON-LD.

## Gaps found vs the current v2 bar (this pass fixes)

1. Linear algebra (invert, eigen) was INLINE and unverified - no tools/lib, no R truth table.
   -> DONE: `tools/lib/vif-math.js` (UMD) + `Scripts/tool-truth/vif-interpreter.{R,json}` +
      node harness `test-vif-interpreter-math.js`. 76/76 pass at <=1e-6.
      Verified: diag(solve(cor(X))) == car::vif() to 12 digits; condition number
      sqrt(max/min eig of cor) == kappa(scale(X), exact=TRUE).
2. R "Reproduce in R" block was STATIC and WRONG: emitted kappa(model.matrix(fit), exact=TRUE)
   = 1504.97 for the default scenario while the tool displays 5.47. Did not reproduce user paste.
   -> FIX: live renderRCode() reflecting current mode/data; condition number via eigen(R);
      reproduces the exact displayed VIFs + condition number. Runnable block kept (parity),
      live-updates while un-hydrated, yields to user edits after hydration.
3. No GA tool_use/tool_copy, no consent-mode gtag block, no consent-banner.js. -> ADD (match t-test).
4. No trust line. -> ADD ("No data leaves your browser / Verified against R's car::vif() / Free").
5. No copyable report line. -> ADD `#report` + Copy button (fires tool_copy).
6. Prose: condition-number anatomy + numerical note misdescribed the computation
   (claimed base::kappa cross-check). -> FIX to sqrt(eig) / kappa(scale(X)).

## Parity checklist (every predecessor capability ships)

- [x] vif mode + cor mode
- [x] all parser formats (named vec, per-line, GVIF table, matrix, Inf/NaN, `>` strip)
- [x] 5 scenarios
- [x] response auto-drop + heatmap (cor mode)
- [x] threshold number inputs + sliders (synced)
- [x] per-predictor table (VIF/tol/SE/Df/flag)
- [x] max-VIF headline, plain-English, condition block + eigenvalues, recommendations, anomaly/1-pred warnings
- [x] SVG bar chart + threshold lines + readout
- [x] tool-lead, banner mode selector, inference line
- [x] primer / anatomy / wrong-tool / further-reading / numerical note
- [x] JSON-LD (WebApplication + FAQPage + BreadcrumbList)
- [x] runnable R block (kept; now correct + live)

## Pass 4 gates

- [ ] Playwright E2E vs truth table (all modes, edge cases, R block reproduces)
- [ ] build.py chrome injection check (1 injected chrome, 0 own masthead, sidebar present)
- [ ] mobile 390px no overflow
- [x] parity checklist above
- [ ] CF preview + prod poll after merge
