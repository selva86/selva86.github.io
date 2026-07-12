# chi-square-calculator v2 — build plan (R-verified math lib)

Slug: `chi-square-calculator`. Worktree `_wt-tools`, branch `tools-v2`.

## Verdict on scope
The page is ALREADY on the v2 Lab-sheet shell (shell/workshop/ws-* A-B-C, banner, scenario chips,
primer, mosaic, runnable R editor, verdict + inference banner, anatomy/caveats/further-reading).
What is missing is exactly what the recent v2 batch (bootstrap, normality, MTC, confusion-matrix)
delivered: an **R-verified math library** + **specific bug fixes**. Chi-square today inlines its
math (`chiIndependence`, `chiGoF`, `pchisq`) and has **no truth table and no lib**.

So this rebuild = extract + R-verify the math into `tools/lib/chisq-math.js`, wire the page to it,
and fix the bugs the inventory surfaced. No from-scratch UI rewrite (would risk parity loss).

## Pass 0 — FEATURE INVENTORY / parity checklist (must all survive)
Modes:
- [ ] Independence (2-way table) — chisq.test(tbl, correct=FALSE)
- [ ] Goodness-of-fit (1 row obs vs expected; uniform default; proportions or counts)
- [ ] Homogeneity (same math as independence; prose differs)
Inputs:
- [ ] Paste table (TSV/CSV/space), header row + row-label column tolerated
- [ ] GoF: second "Expected" textarea (counts or proportions or blank=uniform)
- [ ] Alpha picker 0.001/0.01/0.05(default)/0.10 + custom numeric
- [ ] Yates' continuity correction checkbox (2x2 only, default off)
Presets (6): vaccine 2x2, dietary 2x3, income 3x3, dice GoF-uniform, proportions GoF-9:3:3:1, custom
Outputs:
- [ ] χ², df, p; expected-counts; standardized residuals (=chisq.test$stdres); Cramér's V; Cohen's w
- [ ] Expected-count<5 / n<30 / E=0 diagnostics + Fisher's exact handoff button
- [ ] Verdict line + full plain-English inference banner + "How we got there" recap + English read
Viz:
- [ ] Mosaic plot (SVG), tint ∝ standardized residual; GoF bar-mosaic
R emitter:
- [ ] Runnable WebR editor: chisq.test(...) + $expected + $stdres + cramerV/Cohen w + mosaicplot; append fisher.test when E<5
Prose:
- [ ] Primer dropdown, Anatomy (5 steps), "When this is the wrong tool" (6 rows), Further reading, accuracy note
3 UX features:
- [ ] tool-lead under H1 (present)
- [ ] "I want to ..." banner — **BUG: decorative, no select. FIX: make flavor a real mode <select>**
- [ ] live inference line (present)

## Bugs to fix (found in inventory + code read)
1. **"I want to ..." banner is decorative** — `#banner-flavor` has a caret but no `<select>`; owner
   rule (SKILL Pass 3.2) requires the goal phrase BE the mode selector. Wire an inline select→setMode.
2. **parseTable drops labeled data rows** — per-token numeric test `"Vaccine".replace(/[^\d\-.eE]/g,'')`
   = `"e"` → NaN → `allNumeric=false` → whole row skipped. So vaccine/dietary/income presets (row labels)
   may not parse. Verify empirically; fix by dropping non-numeric label tokens, not whole rows.
3. **No visible FAQ** — 3 Q&A live only in JSON-LD. Surface them as a below-fold FAQ section.
4. **Unverified math** — replace inlined math with R-verified `tools/lib/chisq-math.js`.

## Pass 1 — R truth (`chi-square-calculator.R` → `.json`), R 4.6.0
Cases: IND 2x2 (Yates off+on) + fisher, IND 2x3, IND 3x3, IND small-expected 2x2,
GoF uniform (dice), GoF proportions (Mendelian), GoF 2-cat (df=1), HOM==IND check.
Per case dump: statistic, parameter(df), p.value, expected, stdres, residuals(Pearson),
cramerV (standard uncorrected formula), cohenW=sqrt(stat/N), plus fisher.test$p.value for 2x2s.

## Pass 2 — `tools/lib/chisq-math.js` (UMD, reuses NormalMath incomplete gamma)
API: independence(tbl,{correct}), goodnessOfFit(obs,{expected|probs}), fisher2x2(tbl), pchisq/qchisq.
Node harness `test-chi-square-calculator-math.js` vs the JSON, gate ≤1e-6 (aim 1e-7).

## Pass 3 — wire page
Load normal-math.js + chisq-math.js; delegate `chiIndependence`/`chiGoF` to the lib (remap field names
to the page's `.chi/.p/.cramerV/.cohenW/...`); fix parseTable; wire banner select; render FAQ.

## Pass 4 — gates
Playwright E2E vs truth (every mode+preset), chrome check (1 injected, canonical navbar, sidebar),
mobile 390px no overflow, parity checklist, commit explicit paths to tools-v2, push, CF preview E2E.
Do NOT merge to master (batched owner step).
