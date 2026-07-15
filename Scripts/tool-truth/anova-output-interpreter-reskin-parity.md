# ANOVA Output Interpreter - Reskin Parity Checklist

Reskin of `tools/anova-output-interpreter.html` to the Lab-sheet v2 shell.
Owner order 2026-07-14 ("re-work it professionally"). Parity source = the
pre-reskin `tools/anova-output-interpreter.html` in the worktree.

**Reskin type:** token retheme + font swap + dark strip + minify (glm precedent).
The markup, element IDs and the verified JS are kept BYTE-IDENTICAL (the
`body_content` slice is copied verbatim). Only the `<style>` block, the head
font link and the page weight change. Math lib `anova-math.js` is untouched
and its Node harness is green (178 PASS / 0 FAIL).

Every capability below ships unchanged in v2.

## Modes / method toggles
- [x] Sum-of-squares Type selector: **Type I / Type II / Type III**
      - as the "I want to read a <select> ANOVA table" banner dropdown (`#banner-type-select`)
      - synced with the pill row (`#banner-pill` buttons `data-type=I/II/III`)
      - `setType()` drives both; Type II is the default
- [x] alpha (significance threshold) picker: **0.01 / 0.05 / 0.10** (`#alpha-picker`, `setAlpha()`), 0.05 default
- [x] Live "mode meaning" context text updates per Type (`#mode-meaning`, `#method-use-when`, `#method-example`, `#method-inputs-needed`)

## Scenario presets (5 cards, `loadScenario()`)
- [x] Compare 3+ group means - mtcars mpg ~ cyl (aov, one-way) `data-scenario="oneway"` (default active)
- [x] Two factors with an interaction - ToothGrowth len ~ supp * dose `data-scenario="factorial"`
- [x] Two factors, additive - warpbreaks breaks ~ wool + tension `data-scenario="additive"`
- [x] Type III, unbalanced design - mtcars mpg ~ cyl + gear (car) `data-scenario="type3"`
- [x] Paste my own ANOVA output `data-scenario="custom"`

## Input formats (paste parser)
- [x] `summary(aov(...))` output (Df / Sum Sq / Mean Sq / F value / Pr(>F) column order)
- [x] `car::Anova(..., type="II"/"III")` output (Sum Sq / Df / F value / Pr(>F) column order)
- [x] Type III intercept row handling
- [x] "< 2.2e-16" and scientific notation p-values
- [x] Significance-codes lines tolerated
- [x] Free-text paste box (`#paste-input`, `onPasteChange()`)

## Recomputed outputs (verified math, `anova-math.js`)
- [x] Per-term F recomputed as (SS/df)/(SS_resid/df_resid)
- [x] Per-term exact upper-tail p via R's F distribution (pf / ibeta)
- [x] eta-squared, partial eta-squared per term
- [x] omega-squared, partial omega-squared per term (floored at 0 like effectsize)
- [x] Cohen's f per term
- [x] Total SS, residual SS, model R-squared, adjusted R-squared
- [x] Per-term result table + verdict (`#result-area`, aria-live)
- [x] Parse status line (`#parse-status`)

## Visualization
- [x] SVG bar chart: Sum of Squares contribution per term, residual in grey (`#viz-svg`)
- [x] Live caption + readout (`#viz-caption`, `#viz-readout`)

## The 3 mandatory old-tool UX features
- [x] Tool lead under H1 (`.tool-lead`) - plain-language what/drop-in/get-back
- [x] "I want to ..." banner as the mode selector (`.banner-sentence` + `#banner-type-select`) before inputs
- [x] Live inference line after results (`.inference-banner`, `#inference-banner`)

## R code emitter
- [x] Live copy-ready R code block reproducing every number (`#r-code-rebuild`, webr-container, copy button)
- [x] Fires `tool_copy` on copy

## Explainer / anatomy / reference sections
- [x] 4-min primer dropdown (`.primer-dropdown`): what ANOVA does / why 3 Types / what to report / picking which Type
- [x] Anatomy of an ANOVA table (5 steps: SS partition, MS+F, effect sizes, Type triad, R-squared) - collapsible
- [x] "When this is the wrong tool" caveats (dl.alt-list, 5 rows)
- [x] FAQ (4 items, plain details/summary in `.faq-section`) - matches FAQPage JSON-LD
- [x] Trust line (`.trust`) - no data leaves browser / verified vs pf() + effectsize / free
- [x] Further reading list (`.further-list`, 7 links) + numerical-accuracy note

## Metadata / SEO (kept verbatim, already passed audit)
- [x] Title "Free ANOVA Output Interpreter: Read aov() in R" (40-60ch)
- [x] Meta description, keywords, canonical, OG, Twitter card
- [x] JSON-LD: WebApplication + BreadcrumbList + FAQPage (3 blocks)

## Analytics / trust
- [x] GA consent-mode (gtag) block inline
- [x] consent-banner.js
- [x] Cloudflare beacon
- [x] tool_use (once per session, first interaction) + tool_copy (report + rcode) - kept INLINE in the tool JS

## Reskin design changes (the point of this pass)
- [x] Font: IBM Plex Sans/Serif/Mono -> Inter / Inter Tight / system mono (system-ui code)
- [x] Palette: lean-navy tokens -> Lab-sheet green (`--c-accent` navy #1d3158 -> green #1f7a55, warm bg #fbfbf9)
- [x] Hardcoded navy/blue colors remapped to green (viz, scenario cards, ci-display, param hover, primer)
- [x] Dark-mode surface (html.dark) stripped (no toggle exists; inert)
- [x] CSS minified (comments + indentation stripped) to hit <200KB built
- [x] Bespoke masthead/footer omitted from source; build.py injects site chrome + SITE-FOOTER-V2

## Waivers / deliberate drops
- (none) - zero feature loss. Dark mode removed but was never reachable (no toggle in injected chrome).
- WebR/`.webr-editor` dark code-editor syntax colors KEPT (terminal-style code block, orthogonal to page theme).
