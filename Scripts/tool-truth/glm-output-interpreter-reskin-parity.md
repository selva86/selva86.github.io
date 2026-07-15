# glm() Output Interpreter — Reskin Feature-Parity Inventory

Acceptance checklist for the reskin of `tools/glm-output-interpreter.html`.
Zero feature loss is the hard rule. Every item below is extracted verbatim from the ACTUAL page markup + inline UI JS (`Scripts/tool-truth/_glm_content.html`, `Scripts/tool-truth/_glm_scripts.html`) and the head/JSON-LD of `tools/glm-output-interpreter.html`. Preserve every id, class, label, option value, and copy string.

---

## 1. Modes / submodes

The mode selector appears in TWO synced places: the `#mode-tabs` button group and the in-sentence `#banner-sentence` dropdown ("I want to ... from R's summary(glm()) output.").

- [ ] Mode tab group `id="mode-tabs"` with two buttons `.submode-tab`
- [ ] Mode `data-mode="single"` — button label **"Interpret one model"** — `onclick="setMode('single')"` — default active. Shows `#single-input-area`, hides `#compare-input-area`, shows `#viz-svg` forest plot, viz title "Coefficient forest plot". Parses one `summary(glm())` block.
- [ ] Mode `data-mode="compare"` — button label **"Compare 2+ models"** — `onclick="setMode('compare')"`. Shows `#compare-input-area`, hides `#viz-svg`, shows `#viz-compare`, viz title "Deviance & AIC by model". Parses 2–5 model blocks, model-comparison table + nested tests.
- [ ] Banner sentence template (`renderBannerSentence`): `I want to <param select> from R's <span class="param is-static">summary(glm())</span> output.` Options in that `<select onchange="setMode(this.value)">`: `single` → "interpret one model", `compare` → "compare 2+ models" (exact lowercased labels from `opts` array).
- [ ] `setMode` also rewrites `#viz-caption` per mode (compare: "Residual deviance (lower = better fit) and AIC (lower = better trade-off) per model." / single: "Estimate ± NN% CI per predictor (intercept omitted) on the link scale; the dashed line marks no effect.").

## 2. Scenario presets (`.scenario-card` chips, `data-scenario=`)

Band prompt: **"Try a real-world example to load."** Grid `.scenarios-grid`; each chip has an inline SVG icon, `.scenario-name`, `.scenario-sub`, and `onclick="loadScenario('<key>')"`. On load, `loadScenario` forces `single` mode, resets `family-override-sel` to `auto`, sets `#glm-input` value, shows `#scenario-note` story text (except custom), toasts "Loaded: <name>".

- [ ] `data-scenario="logistic_mtcars"` — name **"Logistic on mtcars"** / sub **"am ~ wt + hp, binomial"** — SCENARIOS story "Predict transmission type (am: auto vs manual) from weight and horsepower." Loads binomial logistic `glm(am ~ wt + hp, family = binomial, data = mtcars)` summary. **Default scenario loaded on `DOMContentLoaded`.**
- [ ] `data-scenario="poisson_warpbreaks"` — name **"Poisson counts"** / sub **"breaks ~ wool + tension"** — SCENARIOS name "Poisson on warpbreaks", story "Predict the number of warp breaks from wool type (A / B) and tension level (L / M / H)." Loads `glm(breaks ~ wool + tension, family = poisson, data = warpbreaks)`.
- [ ] `data-scenario="quasipoisson"` — name **"Quasi-Poisson"** / sub **"overdispersed counts"** — story "Same data, quasi-Poisson family lets dispersion float to absorb overdispersion." Loads `glm(breaks ~ wool + tension, family = quasipoisson, ...)` with dispersion 4.262 and `AIC: NA`.
- [ ] `data-scenario="logistic_interaction"` — name **"Logistic + interaction"** / sub **"admit ~ score * type"** — name "Logistic with interaction", story "Probability of admission depending on score and an applicant-type interaction." Loads `glm(admit ~ score * type, family = binomial, data = adm)` (includes `score:typeB` interaction row).
- [ ] `data-scenario="gamma"` — name **"Gamma (log link)"** / sub **"wait ~ load + priority"** — story "Wait time (positive continuous) modeled with Gamma + log link; coefficients exponentiate to multiplicative effects." Loads `glm(wait ~ load + priority, family = Gamma(link = "log"), data = svc)`, dispersion 0.521.
- [ ] `data-scenario="custom"` — name **"Paste my own glm output"** / sub **"paste your own summary(glm)"** — story "Paste your own summary(glm()) output above." Empty `output`; hides scenario note, does NOT overwrite `#glm-input`.

## 3. GLM families / link functions (`#family-override-sel`)

Select `id="family-override-sel"` label **"Family / link"** with `<small>auto-detected from Call</small>`, `onchange="parseAndRender()"`, `aria-label="Family and link override"`. 11 options (1 auto + 10 family/link combos matching the `FAMILIES` registry):

- [ ] `value="auto"` → "Auto-detect" (default; uses `detectFamily` on the Call line)
- [ ] `value="binomial-logit"` → "binomial(logit) - logistic" (registry label "binomial(logit) / logistic", exp:true, scale:odds)
- [ ] `value="binomial-probit"` → "binomial(probit)" (exp:false, scale:latent)
- [ ] `value="binomial-cloglog"` → "binomial(cloglog)" (exp:false, scale:cloglog)
- [ ] `value="poisson-log"` → "poisson(log)" (exp:true, scale:rate)
- [ ] `value="quasipoisson-log"` → "quasipoisson(log)" (exp:true, scale:rate)
- [ ] `value="quasibinomial-logit"` → "quasibinomial(logit)" (exp:true, scale:odds)
- [ ] `value="gaussian-identity"` → "gaussian(identity)" (exp:false, scale:linear)
- [ ] `value="Gamma-inverse"` → "Gamma(inverse)" (exp:false, scale:inverse)
- [ ] `value="Gamma-log"` → "Gamma(log)" (exp:true, scale:rate)
- [ ] `value="negbin-log"` → "negative binomial (log)" (registry label "negative binomial(log)", family negbin via `glm.nb(`, exp:true, scale:rate)
- [ ] Auto-detect logic (`detectFamily`): recognizes `glm.nb(` → negbin; regex on `family = fam(link)`; defaults link per family (gaussian→identity, binomial→logit, poisson→log, quasipoisson→log, quasibinomial→logit, Gamma→inverse); unknown families fall back to `{scale:'unknown'}` badge "Family: unknown".
- [ ] z-vs-t reference (`distForFamily`): binomial / poisson / negbin → **z**; all others → **t**. Quasi families (`isQuasiFamily`) = quasipoisson/quasibinomial. `dispersionDfOffset` = 1 for gaussian/Gamma (affects BIC k).

## 4. Input formats

- [ ] Single-model paste box `<textarea id="glm-input" class="paste-box" spellcheck="false" oninput="parseAndRender()">` with multi-line placeholder ("Call:\nglm(formula = y ~ x1 + x2, family = binomial, data = d)\n...Coefficients:...Null deviance...Residual deviance...AIC:...").
- [ ] Container `id="single-input-area"` (shown in single mode).
- [ ] Compare container `id="compare-input-area"` (display:none by default). Holds `id="compare-models-list"` (JS-rendered paste blocks) + `<button id="compare-add-btn" class="add-model-btn" onclick="addCompareModel()">+ Add another model</button>`.
- [ ] Compare paste blocks are dynamically built (`renderCompareInputs`): each is `.model-paste-block` > `.model-paste-label` (span "Model N" + optional `.model-remove` "×" button `onclick="removeCompareModel(N)"` for i>2) > `<textarea class="paste-box compare" id="glm-input-N">` with per-index placeholder. IDs `glm-input-1` … `glm-input-5`.
- [ ] Compare model count: starts at `compareCount = 2`, `COMPARE_MAX = 5`; add button disabled at max; remove re-indexes textarea values; min 2 (guarded).
- [ ] CI-level row `id="ci-level-row"` label **"CI level"**, `role="group"`, three `.submode-tab` buttons with `data-ci`: `data-ci="0.9"` "90%" (`onclick="setCILevel(0.9)"`), `data-ci="0.95"` "95%" (default active), `data-ci="0.99"` "99%". `setCILevel` re-renders CI columns, viz caption, and R-code `level=`.
- [ ] Family override select `#family-override-sel` (see §3) — an input control.
- [ ] Parser (`parseGlmSummary`) accepts: leading `> ` prompts stripped; multi-line wrapped `Call:` block; `Coefficients:` table with Estimate/Std. Error/z or t value/Pr; glued `< 2e-16` / scientific notation / `NA` tokens; Signif codes line skipped; `(Dispersion parameter for <fam> family taken to be <phi|NA>)`; `Null deviance: X on D degrees of freedom`; `Residual deviance: ...`; `AIC: X|NA`; `Number of Fisher Scoring iterations: N`.

## 5. Method / "use when" explainer blocks (`.ws-method`)

Left aside `.ws-method`, tag "Context". `#family-display` badge (JS: `<span class="family-badge">Family: <label></span>` or `.family-badge.unknown` "Family: unknown"). Collapsible `<details class="ws-method-collapse" open><summary>How to read your glm() output</summary>` containing:

- [ ] `<h5>Use when</h5>` → `<p id="method-use-when">` (set by `updateMethodMeta` from `METHOD_META[family].useWhen`)
- [ ] `<p class="use-when-example" id="method-example">` → "e.g. " + `METHOD_META[family].example`
- [ ] `<h5>Inputs needed</h5>` → `<ul class="inputs-needed" id="method-inputs-needed">` (list from `METHOD_META[family].inputs`)
- [ ] `METHOD_META` per-family content (all must be preserved):
  - `binomial`: useWhen "Binary outcome (yes / no, 0 / 1)." example "survived ~ age + class on Titanic" inputs [Full summary(glm()) text; Coefficient table with z values; Null and residual deviance lines; AIC line]
  - `poisson`: "Count outcome where the variance roughly equals the mean." example "breaks ~ wool + tension on warpbreaks" inputs [...; z values column; Deviance and AIC lines; Watch residual deviance / df greater than 1]
  - `quasipoisson`: "Count outcome with overdispersion (variance bigger than the mean)." example "crashes ~ volume, family = quasipoisson" inputs [...; t values column (not z); Dispersion parameter line; AIC will read NA, that is normal]
  - `quasibinomial`: "Binary / proportion data with extra-binomial variance." example "cbind(ok, fail) ~ dose, family = quasibinomial" inputs [...; t values column; Dispersion parameter line; AIC will read NA]
  - `Gamma`: "Strictly positive continuous outcome (durations, costs)." example "wait ~ load, family = Gamma(link = \"log\")" inputs [...; Dispersion parameter line; Null and residual deviance]
  - `gaussian`: "Continuous outcome. Identity-link Gaussian glm equals lm()." example "mpg ~ wt + hp, family = gaussian" inputs [...; Note: the lm interpreter gives cleaner R-squared output]
  - `negbin`: "Count outcome with overdispersion you want to model directly." example "glm.nb(crashes ~ volume + weather)" inputs [Full summary(glm.nb()) text; Theta line if shown; Deviance and AIC lines]
- [ ] "Anatomy of summary(glm)" collapsible `<details class="section">` (Read more) with 5 `.anatomy-step` blocks (`.anatomy-formula` + `.anatomy-body`): (1) Link + coefficient scale, (2) Wald statistic + p-value, (3) Deviance + likelihood-ratio test, (4) Overdispersion / goodness of fit, (5) Comparing models. Preserve all formula text and body prose verbatim.
- [ ] Primer dropdown `<details class="primer-dropdown">` "New to reading glm() output? Read the 4-min primer" with 4 body paragraphs (What glm() does / Reading the coefficient table / What deviance and AIC mean / Picking which model to trust).

## 6. Results / outputs (right main `.ws-output`, tag "Read")

Static shells that JS populates (`parseAndRender` single / `renderCompare` compare):

- [ ] `#parse-status` — status text: "Awaiting paste…", `<span class="ok">✓ Parsed</span>`, `<span class="warn">Partial parse</span>`, `<span class="ok">✓ N models parsed</span>`, `<span class="warn">N model(s) parsed</span>`.
- [ ] `#parse-errors` — one `<div class="parse-error">` per parser error (missing table / partial summary messages).
- [ ] `#summary` (`.live-summary`) — plain-English summary sentence ("Your <family> model has N predictors of <outcome>. Deviance pseudo-R² = X. K of N are significant at α = 0.05." / compare variant).
- [ ] `#decision-card` (`.decision-card`, hidden by default) — verdict card: `#dc-icon` + `#dc-verdict` + `#dc-rationale`. `modelDecision` classes/verdicts: `broken` ("Model has structural problems" / "Too few degrees of freedom" / "Likely separation" / "Suspiciously near-perfect fit"), `solid` ("Solid model" / "Significant but modest"), `weak` ("Borderline" / "No detectable signal" / "Inputs incomplete"). Icons `!` / `✓` / `?`.
- [ ] `#callouts-area` — diagnostic callouts `.callout[.danger]` with `.callout-icon`: aliased coefficients, likely separation (brglm2/logistf), high Fisher iterations (≥25), overdispersion (Poisson→quasipoisson/glm.nb, binomial→quasibinomial), quasi dispersion inflation, gaussian-identity==lm() note, very few residual df (<5). Compare mode: "Mixed families" callout when >1 family.
- [ ] `#result-area` (`aria-live="polite"`) — main results HTML:
  - Coefficient table `.coef-table` (`.coltag` "Coefficients") — columns: name, est, [OR/RR/exp(b) when exp family], SE, z|t, p (+`.sig-stars`), CI column (exp-CI or plain CI). Aliased rows get `.aliased` class + "NA".
  - Fit grid `.fit-grid` of `.fit-cell` (`.fit-key`/`.fit-val`/`.fit-sub`): pseudo-R2 (deviance), LR chi-sq (df), LR p, AIC, and either phi (dispersion) OR D/df ratio (OK/mild/over-disp color-coded), plus GOF p for poisson/binomial.
  - "Coefficient by coefficient" (`.coltag`) — one `.coef-interp` per coef: `.ci-name` (`<code>` name + `.ci-badge` verdict) + `.ci-text` (interpretation from `interpretCoefficient`). Verdict badges from `pVerdict`: "no evidence"(none)/"weak"(weak)/"evidence"(evidence)/"strong"(strong)/"unknown"(none).
  - Journal report row `.report-row` — `<span class="report" id="report">` line + `<button class="copy" id="copybtn" onclick="copyReport()">Copy</button>`.
- [ ] Compare mode `#result-area`: `.compare-table` model-comparison table (Model, Predictors, Family, n, resid df, null dev, resid dev, AIC, BIC, pseudo-R2; best-AIC row `.best`), nested-test table `.compare-table` (Pair, Test, statistic, df, p; `.lrt-row`/`.lrt-label`), `.compare-recommendation`, `.compare-caveats` (5-bullet caveats list).
- [ ] Inference section: `.method-intro` `<p id="method-intro">` (static: "We're reading your GLM output and translating each coefficient onto the odds / rate scale.") + `<p class="inference-banner" id="inference-banner">` (JS: model description / strongest predictor / compare AIC + nested LR summary).
- [ ] `#family-display` family badge (also in §5).
- [ ] Toast area `<div class="toast-area" id="toast-area">` — transient `.toast` messages.

## 7. R code emitter (`#r-code-rebuild`, `updateRCode`)

Copy-ready R in the `.webr-editor#r-code-rebuild` lane ("R code" / badge "COPY-READY", block title "Reproduce in R"). Syntax-highlighted via spans `.fn`, `.keyword`, `.number`, `.string`, `.comment`.

- [ ] **No-input default template:** `# Logistic on mtcars` → `fit <- glm(am ~ wt + hp, data = mtcars, family = binomial)` / `summary(fit)` / `exp(coef(fit))` / `exp(confint.default(fit))`.
- [ ] **Single-model template:** `# Reproduce the model` → `fit <- glm(<formula>, data = <data>, family = <family|Gamma(link="..")>)` (or `MASS::glm.nb(...)` for negbin) / `summary(fit)`; then for exp families `# Exponentiated coefficients (odds ratios|rate ratios)` → `exp(coef(fit))` / `exp(confint.default(fit, level = <ciLevel>))`, else `# Coefficient CIs (Wald)` → `confint.default(fit, level = <ciLevel>)`; then `# Deviance pseudo-R2 and LR test vs the null` → `1 - fit$deviance / fit$null.deviance` / `anova(fit, test = "Chisq")`.
- [ ] **Compare template (≥2 models):** `# Compare GLM fits` → one `fitK <- glm(...)`/`MASS::glm.nb(...)` per model; `# AIC and BIC (NA for quasi families)` → `AIC(fit1, fit2, ...)`; `BIC(...)`; `# Likelihood-ratio (or F) test for nested pairs` → `anova(fit1, ..., test = "Chisq"|"F")` (F when quasi); `# Deviance pseudo-R2 for the largest model` → `1 - fitLast$deviance / fitLast$null.deviance`.
- [ ] Data name auto-extracted from `data = <name>` in the Call (fallback `d` / `mtcars`).
- [ ] Copy: `.webr-copy-btn` (event-delegated) copies editor text, toasts "R code copied", fires GA `tool_copy` (what:'rcode').

## 8. Tables (below the fold)

- [ ] "When this is the wrong tool" — `<details class="section">` (Caveats) with `<dl class="alt-list">` (`.alt-header`, `.alt-header-right`): rows — "A continuous, roughly Gaussian outcome" → lm() interpreter; "Clustered or repeated-measures data" → lme4::glmer; "Probability-scale (marginal) effects" → margins/marginaleffects; "Perfect separation in a logistic fit" → brglm2/logistf/Bayesian; "Ordinal or multinomial outcomes" → MASS::polr / nnet::multinom / VGAM. Preserve all `<dt>`/`<dd>` verbatim.
- [ ] Further reading `.further-list` (6 links): Logistic-Regression-With-R.html, Generalized-Linear-Models.html, Poisson-and-Negative-Binomial-Regression.html, Model-Selection-in-R.html, lm-output-interpreter.html, confidence-interval-calculator.html.
- [ ] Numerical-accuracy note `.numerical-accuracy-note` (verbatim paragraph on parser tolerance, R 4.6.0 verification, Wald CIs).
- [ ] Anatomy table (5 `.anatomy-step`) — see §5.
- [ ] Coefficient / fit-grid / compare / nested tables are JS-generated — see §6.

## 9. FAQ (verbatim)

Visible `.faq-list` (`<details class="faq-item">`), 3 questions:

- [ ] "How do I interpret a logistic regression coefficient in R?"
- [ ] "What does the residual deviance tell me, and how do I check for overdispersion?"
- [ ] "Why is AIC reported as NA for a quasipoisson or quasibinomial model?"

FAQPage JSON-LD `mainEntity` — same 3 questions (answer text differs slightly from visible; preserve both):
- [ ] "How do I interpret a logistic regression coefficient in R?"
- [ ] "What does the residual deviance tell me, and how do I check for overdispersion?"
- [ ] "Why is AIC reported as NA for a quasipoisson or quasibinomial model?"

## 10. JSON-LD blocks (3)

- [ ] **WebApplication** — name "glm() Output Interpreter"; applicationCategory EducationalApplication; isAccessibleForFree true; softwareVersion "2.0"; dateModified "2026-07-09"; keywords [glm, logistic regression, poisson regression, odds ratio, rate ratio, deviance, AIC, pseudo R squared, summary glm]; educationalLevel intermediate. `featureList`:
  1. "Parses summary(glm()) output (call, family, coefficient table, deviance, AIC)"
  2. "Auto-detects the family and link, or override across 10 family/link combinations"
  3. "Exponentiates coefficients to odds ratios (logit) or rate ratios (log) with CIs"
  4. "Model-level likelihood-ratio test, pseudo-R2, and overdispersion / deviance goodness-of-fit checks"
  5. "Coefficient forest plot on the ratio scale (estimate +/- CI per term)"
  6. "Compare 2-5 models by AIC, BIC, deviance, and nested likelihood-ratio (or quasi F) tests"
- [ ] **BreadcrumbList** — Home → Tools → glm() Output Interpreter (3 ListItems).
- [ ] **FAQPage** — 3 Question/Answer pairs (see §9).

## 11. Meta (verbatim)

- [ ] `<title>Free glm() Output Interpreter: Read Your R GLM</title>`
- [ ] `<meta name="description" content="Paste summary(glm(...)) output: coefficients read as odds or rate ratios, deviance and AIC explained, overdispersion checked, models compared with LR tests.">`
- [ ] `<link rel="canonical" href="https://r-statistics.co/tools/glm-output-interpreter.html">`
- [ ] H1 `.tool-title` "glm() Output Interpreter"
- [ ] Lead `.tool-lead` (verbatim: "R's glm() fits logistic, Poisson, and other generalized linear models. Paste a summary(glm(...)) block to get a per-coefficient plain-English read on the right scale (odds ratios for logistic, rate ratios for Poisson), a deviance / AIC / pseudo-R2 fit verdict, overdispersion checks, and a Compare-models view with likelihood-ratio tests.")

## 12. Trust line (verbatim)

- [ ] `.trust`: **"No data leaves your browser · Verified against R's `glm()`, `confint.default()` & `anova()` · Free"**

## 13. Sliders / what-if / copy buttons / GA events

- [ ] Sliders `type="range"`: **NONE** in this tool (no range inputs present).
- [ ] What-if interactivity: live re-render on every `oninput`/`onchange` (paste box, compare boxes, family select, CI tabs, mode tabs, scenario chips). No numeric sliders.
- [ ] Copy buttons: (a) `#copybtn` `.copy` "Copy" → `copyReport()` copies `#report` textContent; (b) `.webr-copy-btn` (in R-code lane header) → event-delegated copy of `.webr-editor` text.
- [ ] GA events (`gtag`): `tool_use` (fired once on first shell pointerdown/input via `markUsed`, `{tool:'glm-output-interpreter'}`); `tool_copy` `{tool:'glm-output-interpreter', what:'report'}` on report copy; `tool_copy` `{tool:'glm-output-interpreter', what:'rcode'}` on R-code copy.
- [ ] Toasts (`toast()`): "Loaded: <name>", "R code copied", auto-remove after 3200ms.
- [ ] Dark-mode: on load, `localStorage 'rstat_dark' === '1'` adds `.dark` to `<html>`.
- [ ] `window.runSmokeTests()` console self-test (8 assertions against SCENARIOS.logistic_mtcars). Keep referenced IDs/behaviour intact.
- [ ] Visualization lane: forest plot `#viz-svg` (single) with `#viz-caption` + `#viz-readout`; compare bars `#viz-compare` (residual deviance + AIC bars). Lane header `#viz-title` toggles "Coefficient forest plot" / "Deviance & AIC by model", badge "VISUAL".

## 14. Scripts / external libs loaded

- [ ] `/tools/lib/normal-math.js?v=8f6fd067`
- [ ] `/tools/lib/ttest-math.js?v=53c42e8a`
- [ ] `/tools/lib/glm-math.js?v=40899d57` (GLMMath: coefStat, coefCI, expCI, pseudoR2, lrTest, nestedChisq, nestedF, dispersionRatio, devianceGOF, bicFromAic, chisqUpper)
- [ ] GA gtag deferred loader (G-D5XKCMN7FR), `/www/consent-banner.js?v=2`, Cloudflare beacon.

---

## JS element-ID contract

Every DOM id the inline UI JS reads or writes (via `$()`=getElementById, getElementById, or dynamically created). A reskin MUST keep all of these.

Static ids in markup, read/written by JS:
- [ ] `banner-sentence` — innerHTML (mode dropdown sentence)
- [ ] `scenario-note` — textContent + classList `.show`
- [ ] `mode-tabs` — querySelectorAll `#mode-tabs .submode-tab` (active toggle)
- [ ] `family-override-sel` — `.value` read (getActiveFamily), reset in loadScenario; `onchange` handler
- [ ] `ci-level-row` — querySelectorAll `#ci-level-row .submode-tab` (active toggle)
- [ ] `single-input-area` — `.style.display`
- [ ] `glm-input` — `.value` read/write
- [ ] `compare-input-area` — `.style.display`
- [ ] `compare-models-list` — `.innerHTML`
- [ ] `compare-add-btn` — `.disabled`
- [ ] `family-display` — `.innerHTML`
- [ ] `method-use-when` — `.innerHTML`
- [ ] `method-example` — `.textContent`
- [ ] `method-inputs-needed` — `.innerHTML`
- [ ] `parse-status` — `.innerHTML`
- [ ] `parse-errors` — `.innerHTML`
- [ ] `summary` — `.innerHTML` / `.textContent`
- [ ] `decision-card` — `.style.display`, `.className`
- [ ] `dc-icon` — `.textContent`
- [ ] `dc-verdict` — `.textContent`
- [ ] `dc-rationale` — `.textContent`
- [ ] `callouts-area` — `.innerHTML`
- [ ] `result-area` — `.innerHTML`
- [ ] `r-code-rebuild` — `.innerHTML` (R code editor)
- [ ] `viz-title` — `.textContent`
- [ ] `viz-svg` — `.innerHTML`, `.style.display`
- [ ] `viz-compare` — `.innerHTML`, `.style.display`
- [ ] `viz-caption` — `.textContent`
- [ ] `viz-readout` — `.innerHTML` / `.textContent`
- [ ] `inference-banner` — `.innerHTML`
- [ ] `toast-area` — `.appendChild`

Dynamically-created ids (built by JS, then read):
- [ ] `glm-input-1` … `glm-input-5` — compare-mode paste boxes (`glm-input-<i>`), read/write `.value`
- [ ] `report` — journal report `<span>`, `.textContent` read by copyReport
- [ ] `copybtn` — report copy button, `.textContent`

Present in markup but NOT touched by JS (static — still must remain):
- [ ] `method-intro` — static inference intro paragraph (id present, not read/written by JS)

Selector-based hooks (querySelector/querySelectorAll — classes/attrs that must exist):
- [ ] `.scenario-card` (+ `data-scenario` / `.dataset.scenario`) — active-toggle
- [ ] `#mode-tabs .submode-tab` (+ `data-mode` / `.dataset.mode`)
- [ ] `#ci-level-row .submode-tab` (+ `data-ci` / `.dataset.ci`)
- [ ] `.shell` — markUsed pointerdown/input listeners
- [ ] `.webr-copy-btn`, `.webr-code-block`, `.webr-editor` — R-code copy delegation

---

## Dynamic classes emitted by JS

Every class name appearing inside a JS string / innerHTML template (or set via `className`/`classList`). The new CSS MUST style all of these.

Layout / state toggles:
- [ ] `active` (scenario-card, submode-tab)
- [ ] `show` (scenario-note)
- [ ] `toast`
- [ ] `dark` (on `<html>`)

Family / status:
- [ ] `family-badge`, `family-badge unknown`
- [ ] `ok`, `warn` (parse-status spans)
- [ ] `parse-error`

Decision card (className `decision-card ` + cls):
- [ ] `decision-card`, `broken`, `solid`, `weak`

Callouts:
- [ ] `callout`, `callout-icon`, `danger` (`callout danger`, `callout ` + cls where cls ∈ {`danger`, ``})

Coefficient table:
- [ ] `coltag`
- [ ] `coef-table`
- [ ] `num`
- [ ] `aliased` (row cls)
- [ ] `sig-stars`

Fit grid:
- [ ] `fit-grid`, `fit-cell`, `fit-key`, `fit-val`, `fit-sub`

Coefficient-by-coefficient:
- [ ] `coef-interp`, `ci-name`, `ci-text`
- [ ] `ci-badge` + verdict cls: `none`, `weak`, `evidence`, `strong`

Report:
- [ ] `report-row`, `report`, `copy`

Banner sentence:
- [ ] `param`, `param-caret`, `param is-static`
- [ ] `insig`, `sig` (inference banner significance spans)

Compare mode:
- [ ] `compare-table`
- [ ] `best` (best-AIC row)
- [ ] `formula-cell`
- [ ] `lrt-row`, `lrt-label`
- [ ] `compare-recommendation`
- [ ] `compare-caveats`
- [ ] `model-paste-block`, `model-paste-label`, `model-remove`
- [ ] `paste-box`, `paste-box compare`

Compare bars viz:
- [ ] `compare-bars-title`
- [ ] `compare-bar-row`, `compare-bar-label`, `compare-bar-track`, `compare-bar-val`
- [ ] `compare-bar-fill`, `compare-bar-fill aic`

Forest plot SVG classes:
- [ ] `fp-ref`, `fp-reflabel`
- [ ] `fp-line`, `fp-line sig`
- [ ] `fp-cap`, `fp-cap sig`
- [ ] `fp-dot`, `fp-dot sig`
- [ ] `fp-term`

R-code syntax highlight spans:
- [ ] `fn`, `keyword`, `number`, `string`, `comment`

(Note: `sig` / `insig` also appear standalone in the inference-banner template; the forest-plot `sig` is appended as `fp-line sig` etc.)
