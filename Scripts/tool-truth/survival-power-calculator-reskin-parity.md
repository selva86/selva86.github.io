# Reskin parity checklist - survival-power-calculator

Source of truth = the CURRENT (pre-reskin) `tools/survival-power-calculator.html`
(old IBM Plex design, 224 KB, 67 "IBM Plex" refs). Target = Lab-sheet v2 shell
(copied from `tools/t-test-calculator.html`). Math/lib unchanged and re-verified
green (`node Scripts/tool-truth/test-survival-power-math.js` -> 1254 assertions,
max rel err 1.97e-13). ZERO feature loss is the rule.

## Modes / method toggles (KEEP ALL)
- [ ] Solve-for select: `n` (total sample size), `events` (total events), `power` (power given n)
- [ ] Formula toggle: Schoenfeld / Freedman
- [ ] Given-n input row appears only in `power` mode

## Scenario presets (6 chips - KEEP ALL, same input values)
- [ ] cancer   (HR 0.7, a .05, pw .80, k 1, med 12, A 24, F 12, drop 0)
- [ ] rare     (HR 0.5, med 36, A 12, F 24)
- [ ] dropout  (HR 0.7, med 18, A 24, F 18, drop 0.10)
- [ ] longfu   (HR 0.6, med 24, A 0, F 60)
- [ ] balanced (HR 0.65, med 15, A 18, F 18)
- [ ] ratio    (HR 0.7, k 2, med 12, A 24, F 12)
- [ ] Each chip loads title + story context + clear button

## Inputs (9 - KEEP ALL, same ids/defaults for lib reuse)
- [ ] in-hr (0.7), in-alpha select (.01/.025/.05/.10, def .05), in-power select (.70/.80/.85/.90/.95, def .80)
- [ ] in-k (1), in-median (12), in-accrual (24), in-fu (12), in-dropout (0), in-given-n (350, power mode)
- [ ] setSelectNumeric fix retained (String(0.80) trap)

## Outputs / interactivity (KEEP ALL)
- [ ] Result display: label + big number + aux, all 3 solve-for branches
- [ ] Callouts: HR=1, near-1 HR, dropout>50%, neg A/F, zero study time, n>1e6, low avg P(event)
- [ ] Recap "How we got there": lamC, lamT, P(event) C/T, avg, D, n  (-> Lab-sheet `.how` steps)
- [ ] "I want to ..." banner: inline solve-for select IS the mode selector; parametrized sentence
- [ ] Inference line: live per-mode decisive sentence
- [ ] Tool lead paragraph under H1
- [ ] Interactive KM viz: control (solid) + treatment (dashed) exponential curves, accrual + follow-up shaded bands, axes, legend, live readout
- [ ] Viz sliders (4): HR, median, accrual, follow-up -> live recompute of whole page
- [ ] R code emitter: base-R, 3 solve-for branches x 2 formula branches, copy button + tool_copy GA

## Below-the-fold content (KEEP ALL)
- [ ] Primer (4 paragraphs: what it answers, HR intuition, events vs n, accrual/follow-up)
- [ ] "When to use this" method context (use-when, example, inputs-needed list)
- [ ] Anatomy (5 formula steps: Schoenfeld events, median->hazard, P(event), dropout, Freedman)
- [ ] Caveats "When this is the wrong tool" (5 rows: non-PH, competing risks, cluster, group-sequential, Bayesian/sim)
- [ ] Further reading (5 links incl. power-analysis + effect-size tools)
- [ ] Numerical accuracy note
- [ ] FAQ (3 items) as plain <details><summary> in class*="faq"

## Meta / trust / analytics (KEEP verbatim)
- [ ] title (52 ch, within 40-60), meta description, canonical, OG, Twitter
- [ ] JSON-LD: WebApplication + BreadcrumbList + FAQPage (verbatim)
- [ ] Trust line: qnorm/pnorm + integrate cross-check claims
- [ ] GA consent-mode + tool_use (1st input) + tool_copy + consent-banner + CF beacon
- [ ] Lib tags pinned: normal-math.js?v=8f6fd067, survival-math.js?v=e764df72 (normal loads first)

## Deliberately dropped / changed (with stated reason)
- [ ] WebR interactive Run/Reset -> STATIC copyable R block (matches the v2 Lab-sheet shell used by
      every other v2 tool; bayes-theorem + roc-auc reskins did the same). Full runnable base-R is
      still shown and copyable; live experimentation is preserved via the KM viz sliders which
      recompute the whole page. Drop webr-init.min.js + webr.min.css. NOT a capability loss for
      the tool's core job (planning a survival trial).
- [ ] `.tool-meta` stat-triplet strip ("events, n, or power - Schoenfeld - Freedman - Runs in your
      browser") -> REMOVED. This is exactly the "stat-triplet flex copy" AI-tell the owner flagged
      (2026-07-13). The tool lead already conveys the same context in a plain sentence.
- [ ] No eyebrow kicker, no in-page footer (injected chrome supplies masthead + site footer).
