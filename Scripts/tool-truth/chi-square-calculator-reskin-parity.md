# chi-square-calculator RESKIN - Pass 0 parity checklist

Reskin the CURRENT `tools/chi-square-calculator.html` (old IBM-Plex/lean-navy body, 241KB,
75 IBM Plex refs) to the Lab-sheet v2 shell copied from `tools/t-test-calculator.html`.
Math is untouched: `tools/lib/chisq-math.js` (219/219 vs R 4.6.0), verified this session.
Every capability below ships in v2 (same or better) or is dropped with a stated + on-page reason.

## Metadata (reuse verbatim - already passed audit)
- [ ] Title "Free Chi-Square Test Calculator (Independence, GoF)" (51ch, in 40-60 contract)
- [ ] Meta description (157ch), canonical, og:*, twitter:* preserved
- [ ] 3 JSON-LD blocks verbatim: WebApplication+featureList, BreadcrumbList, FAQPage(3 Q)

## Modes (3)
- [ ] Independence (2-way table) -> ChisqMath.independence(tbl, yates)
- [ ] Goodness-of-fit (obs vs expected/uniform) -> ChisqMath.goodnessOfFit(obs, exp)
- [ ] Homogeneity (same math as independence; prose differs)
- [ ] Mode pills + banner <select> both call setMode() and stay in sync

## "I want to..." banner
- [ ] "I want a [test of independence / goodness-of-fit test / test of homogeneity v] on
      [NxM table] at alpha = [0.05]." Real <select> = the mode selector (banner-flavor-select)
- [ ] banner-table-text + banner-alpha update live (updateBanner)

## Per-mode method explainer (was "ws-method" column)
- [ ] method-use-when + method-example + method-inputs-needed update per mode

## Scenario presets (6 chips)
- [ ] vaccine 2x2 | dietary 2x3 | income 3x3 | dice GoF-uniform | proportions GoF-9:3:3:1 | custom
- [ ] SCENARIOS data verbatim; loadScenario syncs state.rawTable/rawExpected (the preset-fix)
- [ ] scenario-context (sc-icon/sc-title/sc-story) surfaced + clear button

## Inputs
- [ ] paste-box textarea (label switches table <-> observed counts by mode)
- [ ] gof-expected textarea (shown only in gof; counts/proportions/blank=uniform)
- [ ] alpha picker 0.001/0.01/0.05(default)/0.10 + custom numeric (setAlpha/setAlphaFromInput)
- [ ] Yates checkbox (shown only for 2x2 independence/homog; onchange recompute)
- [ ] parseTable/parseRow verbatim (drops label/header tokens; the vaccine/dietary fix)
- [ ] human error messages, cleared on fix (ierr + results empty state)

## Outputs
- [ ] verdict headline + vchip (p < / >= alpha) + verdict-line (Reject/Fail H0 + effect)
- [ ] stats grid: chi-square, df, p, effect (Cramer's V | Cohen's w, label switches), n
- [ ] residuals table: independence tinted cells (O / E / r) + row/col totals; GoF 3-row table
      tint classes high/med pos/neg at |1.96| / |1|; legend + swatches
- [ ] diagnostics callouts: expected<5 (+Fisher handoff button), n<30, expected==0 (danger)
- [ ] plain-English "strongest deviation" box (english-read)
- [ ] inference banner: full plain-English sentence per mode (renderInferenceBanner verbatim)
- [ ] NEW: journal-ready copyable report line (was absent; skill mandates it)
- [ ] "how this is computed" live steps (E, chi-square, p, effect) - folds old recap-mini

## Visualization
- [ ] Mosaic plot SVG (bar-mosaic for GoF, two-way for independence); tint = residColor
      diverging green(+)/grey(0)/red(-); in-cell counts; viz caption + readout; aria-label

## R code emitter
- [ ] Live "same test in R" per mode: chisq.test + $expected + $stdres + cramerV/Cohen w +
      mosaicplot; appends fisher.test(tbl) when any expected<5. Copy button.
- [ ] DROPPED with reason (taught by the family + trust line): the in-browser runnable R editor.
      v2 direction across the tool family (t-test, ab-test) is a STATIC copyable R block that
      still updates live. The tool is a calculator; the R block is a reproduce-in-R reference.
      Removes WebR weight (webr.min.css / webr-init.min.js) toward the <200KB design gate.

## Prose (below the fold) - preserved verbatim, eyebrow kickers dropped (owner AI-tell)
- [ ] tool-lead under H1
- [ ] "New to chi-square?" 4-min primer dropdown (4 paras)
- [ ] Anatomy of the chi-square test (5 steps: E, chi-square+df, stdres, effect size, Yates)
- [ ] When this is the wrong tool (6-row table: E<5, paired, ordinal, stratified, binned, 3-way)
- [ ] FAQ (3 Q&A) as plain <details><summary> in a class*="faq" container (chrome skins it)
- [ ] Further reading links (5): 4 tutorials + confidence-interval-calculator
- [ ] Numerical-accuracy note

## Wiring / infra
- [ ] libs pinned: normal-math.js?v=8f6fd067, chisq-math.js?v=85926985, +chi-square-calculator-ui.js?v=<md5>
- [ ] engine externalized to tools/lib/chi-square-calculator-ui.js (rendered-size audit gate);
      onclick-referenced fns stay `function` decls (global); GA tool_use/tool_copy + boot INLINE
- [ ] GA consent-mode block (G-D5XKCMN7FR) + consent-banner.js + CF beacon
- [ ] tool_use once on first input; tool_copy on copy-button click (strings inline in page)

## Dropped (with reason)
- WebR runnable R editor -> static copyable live R block (v2 family direction; see above)
- `.tool-meta` stat-triplet strip ("3 modes . one tool . ...") -> owner AI-tell, removed
- eyebrow kickers above section titles -> owner AI-tell, removed
- recap-mini panel -> folded into the stats grid (n tile) + the live "how computed" steps
- IBM Plex font stack + old lean-navy CSS -> Lab-sheet (Inter / Inter Tight) shell
