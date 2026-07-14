# Bayes' Theorem Calculator - RESKIN parity checklist (Pass 0)

Parity source: the pre-reskin `tools/bayes-theorem-calculator.html` (228 KB, IBM Plex old
design). This is a design reskin only: the R-verified math (`tools/lib/bayes-math.js`,
pinned `?v=10bf0f9c`, 26/26 node harness green) and every feature ship unchanged on the
Lab-sheet v2 shell. Zero feature loss. Every line below must ship in v2 or be dropped only
with a stated, on-page reason.

## Metadata / head (reuse verbatim - passed the metadata audit)
- [x] Title `Free Bayes' Theorem Calculator: PPV, NPV & Base Rates` (53ch, in 40-60)
- [x] meta description, keywords, author, robots, referrer
- [x] canonical + icon
- [x] Open Graph (7) + Twitter Card (4)
- [x] JSON-LD WebApplication (featureList of 5 modes, softwareVersion 2.0)
- [x] JSON-LD BreadcrumbList (3)
- [x] JSON-LD FAQPage (3 Q, verbatim incl. the U+00D7 multiplication sign)
- [x] GA4 consent-mode block + consent-banner.js + CF beacon (from shell)

## Modes (5) - banner-sentence `#mode-select`
- [x] generic Bayes           fields: prior P(H), P(D|H), P(D|~H)
- [x] medical screening (def) fields: prevalence, sensitivity, specificity
- [x] false-positive paradox  fields: prevalence, sensitivity, specificity
- [x] spam classifier         fields: P(spam), P(word|spam), P(word|ham)
- [x] two-test chaining       fields: prevalence, sens1, spec1, sens2, spec2

## Scenario chips (6) - `loadScenario()`
- [x] hiv    (medical prev .001 sens .99 spec .95) - default on load
- [x] mammo  (medical .01/.80/.90)
- [x] covid  (medical .05/.85/.97)
- [x] drug   (medical .04/.95/.93)
- [x] poly   (medical .10/.85/.60)
- [x] sanity (generic prior .5 pdh .5 pdnh .5)
- [x] each chip carries a story blurb + icon + title (scenario-context band, clear button)

## Input handling
- [x] Units toggle: auto / fraction / percent (`setUnits`, parseProb auto-detect % and >1)
- [x] per-mode text inputs with label + hint, `data-key`, live `oninput`
- [x] invalid class on out-of-[0,1]/NaN; clears on fix

## Outputs (all update live on every input/toggle/slider/scenario)
- [x] live plain-English summary (`#summary`, aria-live) - per-mode wording
- [x] posterior card: mode-specific label (PPV / P(disease|pos) / P(spam|word) / posterior),
      big value = pct + 6dp, aux = numerator / denominator
- [x] LR block (LR+, LR-, pre-odds, post-odds) - medical/paradox only, hidden otherwise
- [x] step-by-step derivation table (prior, P(D|H), P(D|~H), numerator, +term, denominator, posterior)
- [x] population walkthrough "In a population of 10,000" (TP/FN/FP/TN rows, PPV line)
- [x] chain mode: 2-step derivation + chained population walkthrough
- [x] live R code emitter (per mode: medical/paradox, spam, chain, generic) + copy button (tool_copy)
- [x] mosaic SVG viz (sick|well columns x TP/FN/FP/TN) + readout, aria-label
- [x] 3 what-if sliders (prior, sens, spec) two-way bound to inputs (`onSlider`/`syncSliders`)
- [x] inference line (decisive, per-mode, live) - the required UX feature #3
- [x] method column "When to use this / Use when / Inputs needed" - per-mode copy

## Explainer / below-fold sections
- [x] tool lead under H1 (UX feature #1) - kept
- [x] "I want to update my beliefs with <mode select>" banner (UX feature #2) - kept
- [x] 4-min primer dropdown (What Bayes says / base-rate fallacy / medical intuition / picking a mode)
- [x] Anatomy of Bayes' rule (5 formula cards: generic, medical PPV/NPV, LR, spam, chain)
- [x] "When this is the wrong tool" caveats (5 rows: Bayes factors, continuous LR, prevalence
      from same sample, imperfect gold standard, dependent tests)
- [x] Further reading (3 links: Conditional-Probability, Sample-Spaces, Logistic-Regression)
- [x] numerical-accuracy note (closed-form, stable to prior=1e-9)
- [x] FAQ (3 Q) as plain <details><summary> in class*="faq" container (chrome styles it)
- [x] Go-deeper / related-tool links (next-tool row: CI calc, confusion-matrix)

## Trust / analytics
- [x] trust line: no data leaves browser / verified against R / free
- [x] tool_use once per session on first genuine interaction (not boot)
- [x] tool_copy on R-code copy
- [x] lib pinned `bayes-math.js?v=10bf0f9c`

## Design gate (v2)
- [x] Inter / Inter Tight, system mono for code (NO IBM Plex in own CSS; <=10 total from footer)
- [x] no bespoke masthead, no data-tool-v2, exactly 1 injected chrome
- [x] no in-page footer of my own (injected chrome supplies it)
- [x] no em dashes, no eyebrow kicker above H1, no stat-triplet flex, never name the R runtime
- [x] <200 KB built

## Deliberately dropped / changed (with reason - taught or benign)
- WebR live editor container -> replaced by a static "same test in R" copyable block. Reason:
  Lab-sheet tools ship a static, instantly-copyable R block (owner v2 pattern); the runtime is
  never named. The R code is still live and reproduces the displayed result. (Same call the
  other v2 reskins made - see anova/bayes v1 note.)
- "COPY-READY" / "INTERACTIVE" badges and lane chrome -> folded into the plain R-code card +
  mosaic card. Reason: cosmetic labels, no capability lost.

## Verification (Pass 4)
- [x] VERIFIED 2026-07-15: reskinned to Lab-sheet shell; build injected chrome; all 5 modes + edge cases E2E-asserted vs truth table (rendered values exact); 26/26 node harness green (lib unchanged, pinned 10bf0f9c); design gate PASS (184KB file / 198KB rendered, 3 IBM Plex in injected footer, 1 injected chrome, 0 em dashes); responsive 360/390/1280 no overflow; audit clean except environmental localhost 404s (/api/me + CF RUM).
- Added (no feature loss): hero mode pills synced to the banner select; journal-ready report line + copy button.
