# /write-tool lm-output-interpreter - build plan + parity checklist

Predecessor: `tools/lm-output-interpreter.html` (self-contained, softwareVersion 2.0,
dateModified 2026-05-02). Rich tool: single + compare modes, forest plot, per-coefficient
plain-English, AIC/BIC/nested-anova comparison. Already carries tool-lead, an "I want to..."
banner, and an inference band. This pass = rebuild-in-place to the current v2 bar:
**verified math lib** (replacing three unverified approximations), correct + live R code,
90/95/99 CI selector, visible FAQ, GA events, trust line, copyable report line, contract
title. No capability dropped except in-browser R execution (waived + taught on-page, below).

## Pass 0 - full feature inventory of the predecessor (all preserved unless waived)

**Modes (2):** `single` (paste one `summary(lm())`) and `compare` (2-5 pasted summaries).
Mode selector rendered twice + kept in sync: pill tabs (`Single model` / `Compare 2+ models`)
AND an inline `<select>` inside the "I want to interpret ..." banner sentence.

**Scenarios (6):** mtcars (`mpg ~ wt + hp`, default on boot), iris (`Sepal.Length ~ Sepal.Width + Species`),
factor (`score ~ method + age`), interaction (`mpg ~ wt * hp`), poly (`mpg ~ poly(hp, 2)`),
custom (clears textarea). NOTE bug to fix: iris card says "Predict petal size" but the model
is Sepal.Length -> relabel truthfully.

**Parser** `parseLmSummary`: Call + formula (`lm(formula = ...)`), outcome/response name,
Residuals 5-number summary, coefficient table (name / estimate / SE / t / p / signif stars /
aliased-NA flag; last-4-numeric-token rule; glues `< 2e-16`), Residual standard error + residual
df, Multiple R^2, Adjusted R^2, F-statistic + numdf + dendf + model p-value. Strips `> ` prompts,
handles scientific notation, recognizes `Signif. codes` terminator. Derives `n = df + k`.

**Computed / re-computed math:**
- 95% CI per coefficient (`est +/- qt(.975,df)*SE`).  [only 95% today]
- `qnorm` (Acklam), `qt` (Cornish-Fisher, qnorm fallback for df>1000).  [APPROXIMATE]
- AIC/BIC/logLik "kernels": `n*log(RSS/n)+2*(k+1)` etc (constant dropped -> different-n guard).  [APPROXIMATE]
- Nested-model anova F: `F=((RSS_s-RSS_b)/df1)/(RSS_b/df2)`, p via Wilson-Hilferty cube-root.  [APPROXIMATE]
- Percent variance = `r2*100`; strongest predictor = min non-intercept p.
- NOT computed (absent, and stays absent): standardized betas, VIF (only suggested), fitted values.

**Interactivity:** mode tabs + banner select; `+ Add another model` / per-model `x` remove (2-5);
6 scenario chips; live parse on input; primer disclosure; two bottom collapsibles; (predecessor
also: WebR Run/Reset - see waiver).

**Outputs:** dynamic banner sentence; workshop 3 columns (Context / Paste / Read) w/ parse-status
line; SINGLE: live-summary sentence, decision card (6 verdicts), Call echo, coefficient table
(name/est/SE/t/p+stars/CI), fit grid tiles (R^2 / adjR^2 / F(df1,df2) / F p), fit-explanation
sentence, per-coefficient plain-English read (aliased / intercept / interaction / polynomial /
factor-level / continuous branches; 4 evidence verdicts), diagnostic callouts (rank-deficient,
few df, R^2>0.99 leakage, no signal, |t|>100, multicollinearity->vif, large RSE); COMPARE:
comparison table (formula / n / resid df / R^2 / adjR^2 / RSE / F / F p / AIC / BIC / logLik with
best-cell highlight), different-n guard, nested-anova callout or "not nested", verdict paragraph,
"how to read this comparison" caveats. Inference band. Visualization lane: SINGLE forest plot
(estimate dot +/- CI, zero line, sig terms accented, readout); COMPARE R^2/AIC two-panel bar.
R-code emitter (single + compare variants; formula/data lifted from parse). Anatomy collapsible
(5 formula steps), "when this is the wrong tool" table, further-reading links, numerical note.
FAQ present ONLY as JSON-LD today.

**Other:** copy button on R block; Cloudflare Web Analytics beacon (NO GA); `runSmokeTests()`;
canonical/OG/Twitter/JSON-LD (WebApplication + BreadcrumbList + FAQPage); dark mode; reduced motion.

## Gaps found vs the current v2 bar (this pass fixes)

1. **Three unverified approximations in the math.** `qt` = Cornish-Fisher, `qnorm` = Acklam,
   nested-F p = Wilson-Hilferty cube-root. None checked against R.
   -> FIX: `tools/lib/lm-math.js` (UMD) composing the verified `ttest-math` (exact `tCDF`/`tQuantile`
   via `ibeta`) + a new **exact F-CDF** (`pf` from the same `ibeta`), plus exact coefficient
   p (`2*pt(-|t|,df)`), CIs, adjusted R^2, R^2<->F, and **exact** AIC/BIC/logLik (not kernels).
   Truth table `Scripts/tool-truth/lm-output-interpreter.{R,json}` (7 real models + 7 coef edges +
   7 F edges + 5 adjR^2 + 3 nested-anova + 4 IC), node harness `test-lm-output-interpreter-math.js`,
   gate all <=1e-6 rel.
2. **CI level fixed at 95%.** -> ADD a 90 / 95 / 99 confidence-level selector (recomputes every
   coefficient CI + the forest-plot whiskers live). Truth covers all three levels.
3. **AIC/BIC/logLik were approximate kernels** forcing a hard different-n guard.
   -> Compute EXACT `AIC`/`BIC`/`logLik` from `(n, RSS, npar)`, verified vs `stats::AIC/BIC/logLik`.
   Keep an *informational* caveat that comparing models fit on different rows (different n) is a
   data question, not a math one - but the numbers are now the real R values.
4. **Nested-anova F p-value via cube-root approximation.** -> exact `pf` via `ibeta`, verified vs
   `anova(fit1, fit2)` on real nested models.
5. **FAQ only in JSON-LD.** -> render a VISIBLE FAQ section (same 3 Q&A) below the fold, keep JSON-LD.
6. **No GA `tool_use`/`tool_copy`, no consent-mode gtag, no consent-banner.js.** -> ADD (match t-test/vif).
   Keep the Cloudflare beacon too.
7. **No standard trust line.** -> ADD `<p class="trust">No data leaves your browser / Verified against
   R's lm(), confint() & anova() / Free`.
8. **No copyable one-line report.** -> ADD `#report` + Copy button (fires `tool_copy`): a journal-ready
   single-sentence summary of the parsed model.
9. **Non-contract title.** `lm() Output Interpreter . r-statistics.co` -> contract 40-60ch
   `Free lm() Output Interpreter: Read Your R Regression` (51 ch).
10. **iris scenario mislabelled** ("petal" vs Sepal.Length model). -> fix the card copy.

## Deliberately changed capability (stated + taught on-page, per Pass 0 rule)

- **In-browser R execution (WebR Run/Reset) is dropped.** Replaced by a live-updating, R-verified,
  copy-paste-ready code block (the vif-interpreter pattern, the freshest sibling). Reason taught in
  the "same thing in R" trust note: this tool starts from output you already produced by running
  `lm()` in your own R session, so you already have R; the snippet reproduces every number shown
  and is meant to paste back into that session. Removes a heavy runtime and keeps the page lean.
  (Rubric 6 is met by correctness of the emitted code, not by executing it here.)

## Parity checklist (every predecessor capability ships)

- [ ] single mode + compare mode (2-5 models, add/remove)
- [ ] mode pills + banner `<select>` kept in sync
- [ ] all 6 scenarios (iris relabelled), mtcars default on boot
- [ ] full parser (call/formula, residuals, coef table w/ stars + aliased, RSE+df, R^2, adjR^2, F+dfs+p; `>`/`< 2e-16`/scientific)
- [ ] parse-status line + workshop 3 columns (Context/Paste/Read)
- [ ] decision card (6 verdicts) + live-summary sentence
- [ ] coefficient table (name/est/SE/t/p+stars/CI) with 90/95/99 selector  [+improvement]
- [ ] fit grid tiles (R^2 / adjR^2 / F(df1,df2) / F p)
- [ ] per-coefficient plain-English read (aliased/intercept/interaction/poly/factor/continuous)
- [ ] diagnostic callouts (all 7)
- [ ] compare table (formula/n/df/R^2/adjR^2/RSE/F/Fp/AIC/BIC/logLik, best highlighted) - EXACT AIC/BIC/logLik
- [ ] nested-anova callout (exact p) or "not nested"; different-n informational caveat; verdict paragraph; caveats list
- [ ] inference band (single + compare variants)
- [ ] forest plot (single) + R^2/AIC bar (compare), live readout
- [ ] R-code emitter (single + compare), live from parse, copyable
- [ ] tool-lead, "I want to..." banner mode selector, inference line (the 3 UX features)
- [ ] anatomy collapsible, wrong-tool table, further reading, numerical note
- [ ] VISIBLE FAQ + JSON-LD (WebApplication + FAQPage + BreadcrumbList)
- [ ] trust line, copyable #report line, GA tool_use/tool_copy + consent + CF beacon
- [ ] contract title, canonical, meta desc, OG
- [~] WebR execution -> WAIVED, replaced by live copyable verified block (reason on-page)

## Pass 4 gates

- [ ] Node math harness: ALL truth cases <=1e-6 rel (aim 1e-7+)
- [ ] Playwright E2E vs truth table (both modes, CI levels, scenarios, edge pastes, R block reproduces, forest plot)
- [ ] build.py chrome injection check (1 injected chrome, 0 own masthead, sidebar present)
- [ ] mobile 390px no horizontal overflow
- [ ] parity checklist above fully checked
- [ ] CF preview + prod poll after batched owner merge
