# Bayes Factor Calculator - RESKIN parity checklist

Source of parity = the CURRENT (pre-reskin) `tools/bayes-factor-calculator.html`.
Rule: every capability below ships in the reskin (same or better), or is dropped ONLY
with a stated, on-page-taught reason. Math is R-verified (truth table + node harness,
48/48 green) and the boot script is preserved verbatim, so every displayed number is
identical to the current page.

## Analysis modes (mode-select dropdown, in the "I want to" banner)
- [x] twoT      two-sample t
- [x] oneT      one-sample t (also the paired route: feed within-pair differences)
- [x] prop      two-proportion (contingency table)
- [x] cor       correlation
- [x] anova     one-way ANOVA (omnibus)
- [x] regression linear regression

## Input-mode sub-tabs (per mode)
- [x] twoT / oneT: Summary stats  AND  Test statistic
- [x] regression:  F-statistic    AND  R-squared
- [x] prop / cor / anova: summary only (tabs hidden) - correct, single natural input

## Prior / scale selector (rscale-select, in the banner) - per family
- [x] twoT/oneT Cauchy: medium(0.707) / wide(1.0) / ultrawide(1.41)
- [x] regression Zellner-Siow g: medium(0.354) / wide(0.5) / ultrawide(0.707)
- [x] anova Zellner-Siow g: medium(0.5) / wide(0.707) / ultrawide(1.0)
- [x] cor stretched-beta: narrow(0.19) / medium(0.33) / wide(0.58) / ultrawide(1.0)
- [x] prop Dirichlet: uniform(a=1) / concentrated(a=2) / tight(a=5)

## Direction selector (direction-select, in the banner)
- [x] BF10 (alt vs null)  AND  BF01 (null vs alt)

## Scenario preset chips (8, loadScenario)
- [x] moderate (two-sample t, t=2.5)
- [x] extreme (large effect n=50/arm)
- [x] null (evidence for H0)
- [x] paired (one-sample t=4 n=20)
- [x] prop (100/200 vs 60/200)
- [x] cor (r=0.4 n=50)
- [x] anova (PlantGrowth F=4.85 df=2,27)
- [x] regression (mtcars R2=0.78)
- [x] scenario-context card (icon + title + story + clear button)

## The 3 mandatory old-tool UX features
- [x] Tool lead: 2-3 sentence plain-language explainer directly under H1
- [x] "I want to ..." banner: goal sentence with the mode selector inline (mode-select),
      plus the prior and direction selectors woven into the same sentence
- [x] Inference line: live decisive one-sentence interpretation after results
      (#inference-banner, updates on every input)

## Results surface (all update live via compute())
- [x] Headline BF display (result-label + result-bounds big number + result-aux evidence label)
- [x] Recap mini table: prior, BF10, BF01, P(H1), p-value, verdict
- [x] Sensitivity plot (SVG): BF vs prior scale, log-y, current-setting marker, live readout
- [x] R code emitter (per mode + prior + input-mode), copy button, syntax highlight
- [x] plain-English inference banner naming the decision and the p-value contrast

## Explainer / context sections
- [x] "When to use this" method card (use-when, example, inputs-needed list, prior) - per mode
- [x] 4-min primer dropdown (what a BF is / how to read it / picking a prior / BF vs p)
- [x] "The Bayes factor math, end to end" details: 6 anatomy steps
      (JZS t, effective n/df, posterior prob, correlation stretched-beta, two-prop
       Gunel-Dickey, ANOVA/regression Liang g-prior)
- [x] "When this is the wrong tool" caveats: 6-row alt-list
- [x] Further reading list (5 links) + numerical-accuracy note
- [x] Trust line: no data leaves browser / verified against BayesFactor / free
- [x] FAQ: 3 items (What a BF of 10 means / BF vs p-value / which prior) as plain
      details>summary in a class*="faq" container (chrome CSS styles it)

## Metadata / SEO / analytics (reuse verbatim)
- [x] title, meta description, canonical, og tags
- [x] JSON-LD: WebApplication + FAQPage (+ keep BreadcrumbList if present)
- [x] tool_use GA event (first input), tool_copy GA event (R code copy)
- [x] consent-mode GA block + consent-banner + CF beacon
- [x] lib script pinned: tools/lib/bayes-factor-math.js?v=<md5>

## Deliberately dropped (with reason)
- Dark-mode CSS: the Lab-sheet shell is light-only (meta color-scheme:light), matching
  the t-test reference. The `dark` class hook in the boot stays (harmless no-op); no
  dark CSS is shipped. No user-facing capability lost (there was no dark toggle in the UI).
- IBM Plex font stack: replaced by the Lab-sheet Inter / Inter Tight + system-mono stack.

## E2E expected displayed values (from truth table, per mode at default prior)
- twoT  moderate default (t=2.5, n=50/50, medium): BF10 shown "3.23", P(H1) "76.38%"
- oneT  paired (t=4, n=20, medium): BF10 "46.1"
- cor   (r=0.4, n=50, medium): BF10 "13.3"
- prop  (100/200 vs 60/200, a=1): BF10 "520"
- anova (F=4.85, df=2,27, N=30, medium r=0.5): BF10 "3.35"
- reg   (N=32, p=2, R2=.7826, medium r=0.354): BF10 "3.54e+7"

## VERIFIED (reskin complete)
Approach: CSS-only reskin. The markup and the R-verified boot are preserved byte-for-byte;
only the old IBM-Plex / lean-navy `<style>` block was replaced with the Lab-sheet Inter /
Inter-Tight light stylesheet, and the fonts were swapped. The 680-line boot's bulk was moved
to `tools/lib/bayes-factor-ui.js` (pinned); the tool_use / tool_copy analytics + the boot tail
stay inline (audit + timing preserved). Built page 168KB (was 238KB), 3-4 IBM Plex refs (all in
the injected footer/chrome), exactly 1 injected chrome. Playwright E2E confirmed every mode
renders the truth-table value (twoT 3.23 / P(H1) 76.38%, oneT-tstat 46.1, cor 13.3, prop 520,
anova 3.35, regression R2 3.54e+7), prior-scale + BF10/BF01 + error-recovery + copy all live,
and no horizontal overflow at 360/390/768/1280.
