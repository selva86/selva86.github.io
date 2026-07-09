# effect-size-converter v2 - build plan, parity checklist, inspection matrix

Rebuild of the old `tools/effect-size-converter.html` (IBM-Plex, pre-Lab-sheet) onto the
canonical Lab sheet shell, with R-verified math and Playwright-verified rendering.

## Ground truth
- `Scripts/tool-truth/effect-size-converter.R` -> `.json` (42 cases, base R 4.6.0).
- Conversions are exact closed forms; the two inverted quantities use R as arbiter:
  exact Hedges' J via `lgamma`, exact d CI via `pt(.,ncp)` + `uniroot` (noncentral t).
- `tools/lib/effect-size-math.js` verified by `test-effect-size-converter-math.js`:
  **259/259 assertions, worst rel error 2.0e-10** (even the noncentral-t CI).

## Pass 0 - FEATURE PARITY vs the old tool

| Old capability | v2 status |
|---|---|
| 6 source metrics: d, g, r, OR, eta2, f | KEPT (mode pills + banner select) |
| 8 targets: d, g, r, OR, eta2, f, CLES, NNT | KEPT (banner target select) |
| All pairwise conversions | KEPT + R-verified |
| d confidence interval | UPGRADED: large-sample normal approx -> exact noncentral-t (MBESS::ci.smd) |
| r confidence interval (Fisher-z) | KEPT + R-verified |
| Hedges' J | UPGRADED: 1-3/(4N-9) approx -> exact lgamma J |
| 6 named scenarios + Custom | KEPT (t-test, OR 2x2, ANOVA, correlation, readable->CLES, large multi-group, Custom) |
| Interactive SVG viz (density overlap / scatter / 2x2 mosaic / variance bars) | KEPT (all 4, live) |
| Recap of every derived size | KEPT (5-tile translation grid + secondary line g/eta2/f/CI) |
| R-code emitter | UPGRADED: `effectsize` calls -> base-R closed forms that ALWAYS reproduce (no package needed); each snippet run in R and confirmed to reproduce the displayed headline |
| Extreme-value callouts | KEPT |
| Method column (use-when/example/inputs) | RESHAPED into below-fold "Which effect size is which" table + live input note |
| 3 FAQs | KEPT + expanded to 4 |
| OR baseline p1 -> RR / NNT | ADDED: the old tool exposed the p1 input labeled "for RR/NNT" but never computed it; v2 delivers clinical p2, risk ratio and NNT in the inference line |
| 90/95/99 CI level selector | ADDED (old was fixed 95%) |
| Dark-mode toggle | DROPPED - the canonical Lab sheet tools (t-test, power-analysis, ...) are light-only; matches the shell |
| Separate viz sliders | CONSOLIDATED into the single input card - the same values drive the live viz; not a statistical capability, a duplicate control |

3 mandatory UX features (owner rule 2026-07-08): tool lead under H1 (verified 362 chars),
"I want to convert <src> to <tgt> given <params>" banner with the mode selector inline
(2 synced selects, verified), live inference line after results (verified live-updating).

## Pass 4 - gate results
1. Local Playwright E2E vs the R truth JSON, RENDERED DOM values, all 6 source modes:
   **158/159 pass**; the 1 "miss" is `r=0.99 -> OR=1.14e11` compared with an absolute
   6e-3 tolerance (relative error 2e-13 - correct to machine precision).
2. Qualitative E2E: error handling (out-of-range r shows + clears), viz renders per mode,
   R-code updates on target switch and reproduces, report line, scenario load, pill/banner
   sync - all pass.
3. Chrome injection: exactly 1 `data-tool-chrome="injected"`, 1 site masthead, 27 sidebar
   tool links, single footer; idempotent across rebuilds.
4. Mobile 390px: `scrollWidth 375 <= innerWidth 390` (no horizontal overflow).
5. No em dashes, no CSS hex escapes, no IBM Plex / JetBrains Mono, no `data-tool-v2`.
6. Emitted R code executed in R 4.6.0: d->g 0.494, r->OR 3.129, OR->d 0.382, eta2->f 0.253,
   f->eta2 0.059 - all reproduce the displayed headline.

## Deliverables
- `tools/effect-size-converter.html` (Lab sheet, chrome-injected)
- `tools/lib/effect-size-math.js` (UMD; reuses normal-math + power-math)
- `Scripts/tool-truth/effect-size-converter.{R,json}`
- `Scripts/tool-truth/test-effect-size-converter-math.js`
