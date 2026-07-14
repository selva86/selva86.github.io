# ROC / AUC Calculator - Reskin Parity Checklist (Pass 0)

Source of parity: the pre-reskin `tools/roc-auc-calculator.html` in the worktree
(commit 53702fe0f). This is a RESKIN to the Lab-sheet v2 shell. Zero feature loss.
Math lib (`tools/lib/roc-math.js?v=9c2f3788`) and truth table
(`Scripts/tool-truth/roc-auc.json`, harness 505 checks / 0 failures) are already
green and are NOT rebuilt.

## A. Metadata / head (reuse verbatim unless noted)
- [x] Title: "Free ROC Curve & AUC Calculator: Thresholds + DeLong CI" (49 ch, in 40-60 contract) - KEEP
- [x] Meta description (155 ch) - KEEP
- [x] Keywords, author, robots, referrer, canonical - KEEP
- [x] Open Graph + Twitter card block - KEEP
- [x] JSON-LD WebApplication (name/desc/url/featureList/keywords) - KEEP, but FIX stale featureList line "DeLong 95% confidence interval (logit-transformed)" -> AUC-scale clamped (the lib is linear-clamped; logit was the v1 bug)
- [x] JSON-LD BreadcrumbList - KEEP
- [x] JSON-LD FAQPage (5 Q&A) - KEEP verbatim
- [ ] Fonts: swap IBM Plex Sans/Serif/Mono -> Inter + Inter Tight (Lab-sheet); code uses system ui-monospace

## B. Modes / compute variation
- ROC is single-mode (no test-type tabs). Parameter variation:
  - [ ] Confidence level select: 90 / 95 (default) / 99  -> the inline `.psel` in the "I want to..." banner (id=`conf-level`)
  - [ ] Cost ratio FN:FP numeric input (default 1)      -> input id=`cost-ratio`
  - [ ] Decision threshold slider (0-100 -> score range) -> id=`thresh-slider`, live confusion matrix

## C. Scenario presets (6) - render as scenario chips
- [ ] `perfect`  - "An ideal classifier" (AUC 1.0, 20 rows)
- [ ] `mtcars`   - "Predict from mtcars" (real glm, AUC ~0.92, 32 rows)
- [ ] `imbal`    - "Lots of negatives, few positives" (20 pos / 180 neg)
- [ ] `breast`   - "Cancer screening dataset" (AUC ~0.89, 60 rows) [DEFAULT on load]
- [ ] `random`   - "Barely better than coin flip" (AUC ~0.59)
- [ ] `custom`   - "Paste my own labels and scores" (clears box)
- [ ] Scenario context box (icon + title + story + clear button)
- Frozen datasets DATASETS{} + SCENARIOS{} carried verbatim (identical to roc-auc.json)

## D. Inputs
- [ ] Paste textarea (2 cols: y score), whitespace/comma/semicolon parse - id=`paste-input`
- [ ] Cost ratio FN:FP numeric - id=`cost-ratio`
- [ ] Live recompute on every input (paste, cost, conf) + slider
- [ ] "Load example" convenience button (old had Compute + Try-example; live-compute supersedes explicit Compute)

## E. Outputs / results
- [ ] AUC value + DeLong CI headline (id=`result-bounds`) + n/n+/n-/SE/DeLong aux (id=`result-aux`)
- [ ] NEW (enhancement): vchip verdict (discrimination level word), tinted plain-English box, copyable journal-ready report line
- [ ] Three optimal-threshold cards (Youden / F1 / Cost-weighted), clickable to set threshold - id=`opt-trio`, `opt-*-t`, `opt-*-d`, class `opt-card.active`
- [ ] Live confusion matrix at current threshold (TP/FP/FN/TN grid) - id=`cmat-area`, classes cmat/cmh/cmrowlbl/cmcell.tp.fp.fn.tn/cmcount/cmlbl
- [ ] Metrics mini (Acc/F1/Sens/Spec/PPV/NPV/MCC) - id=`metrics-area`, classes metrics-mini/mm-row/mm-key/mm-val
- [ ] Recap "How we got there" (U, n+.n-, SE, t) - id=`recap-mini`/`recap-rows`
- [ ] Inference line (decisive, live) - id=`inference-banner`
- [ ] Method-intro static sentence - id=`method-intro`

## F. Visualizations (SVG, live)
- [ ] ROC curve staircase + shaded fill + diagonal + threshold marker dot - id=`roc-svg`, caption, readout
- [ ] Score-distribution overlay by outcome (pos/neg histograms) + threshold line - id=`dist-svg`
- [ ] Threshold slider row (id=`thresh-slider`, `thresh-val`)
- [ ] Calibration: Brier score + reliability diagram (deciles vs diagonal) - id=`calib-area`

## G. R-code emitter (live, reproduces displayed numbers)
- [ ] library(pROC), y/score vectors, roc(), auc(), ci.auc(method="delong"), coords best youden, mean((score-y)^2) Brier - id=`r-code-roc`, copy button -> tool_copy

## H. Explainer / below-fold sections
- [ ] 4-min primer dropdown (4 paragraphs: what ROC/AUC mean, reading curve+threshold, picking optimum, when ROC is wrong)
- [ ] "ROC anatomy and DeLong derivation" details (5 anatomy steps w/ formula + prose) - FIX step 3 stale "logit scale ... back-transform" -> linear AUC-scale clamped to [0,1]
- [ ] "When this is the wrong tool" alt-list (5 rows: multi-class, survival, imbalance, only-confusion-matrix, probabilities-matter)
- [ ] "When to use / inputs needed / what you get" method context (old ws-method aside) -> fold into a method/how section
- [ ] Trust line: no data leaves browser / verified vs pROC / free
- [ ] FAQ (5 details, plain <details><summary>) - KEEP verbatim
- [ ] Further reading (3 links: logistic regression, confusion-matrix tool, logistic diagnostics) + numerical-accuracy note

## I. Analytics / infra
- [ ] GA consent-mode gtag block (G-D5XKCMN7FR) + tool_use (once) + tool_copy
- [ ] consent-banner.js + Cloudflare beacon
- [ ] aria-live on results, aria-labels on inputs/svg
- [ ] toast area (small-n / perfect-AUC warnings) - id=`toast-area`

## J. Drops (with reason, taught on-page where user-visible)
- Explicit "Compute" button: dropped in favor of live recompute (industry-standard for these calculators; example loader retained).
- Bootstrap CI option: already absent in v1 body (only mentioned in stale featureList) - a browser cannot reproduce pROC's resampling seed; DeLong is exact + deterministic. Taught in FAQ "why not a bootstrap". Remove stale featureList "Bootstrap CI option" line.
- No feature that computes a number is dropped.

## VERIFICATION (Pass 4, local E2E on http://127.0.0.1:8237)
- Math harness green (505 checks / 0 failures) - lib unchanged, not rebuilt.
- Rendered values vs truth table, every scenario + conf level + edge case:
  - breast@95 AUC 0.886 CI [0.794,0.977] SE 0.0468, Youden 0.710 (sens 0.83/spec 0.93), F1 0.877, Brier 0.1593
  - mtcars 0.921 [0.831,1.000]; imbal 0.877 [0.797,0.958] n=200 (20/180); random 0.594 [0.467,0.720]; perfect 1.000
  - conf 99 -> [0.765,1.000]; junk paste -> "too few rows"; one-class -> "need both classes"
  - Fixed carried-over grammar bug: article now "a good"/"an excellent"/"a near-random"
- Interactivity: opt-card clicks set threshold, slider snaps to grid + live confusion matrix, aria-live=polite.
- Responsive: 360/390 no page overflow (scrollW 345/375); grid + opt-trio collapse to 1 col; R-code pre scrolls internally.
- Design gate: 3 IBM Plex refs (chrome footer only), 177KB rendered (<200), 1 injected chrome, tool-chrome style present, 0 em-dash/JetBrains/eyebrow/data-tool-v2/webr.
- page_audit (single-slug, local): only finding is the environmental /api/me 404 + CF-beacon console noise, IDENTICAL on the reference t-test page (injected-chrome backend absent on a static localhost server; 200 on prod). All 3 tool libs load 200.
- Externalized for the size budget (sanctioned pattern): frozen datasets -> tools/lib/roc-auc-data.js?v=14817625; UI controller -> tools/lib/roc-auc-ui.js?v=d3013693; roc-math.js?v=9c2f3788 unchanged. tool_use/tool_copy kept in-page via inline window.RocGA shim.
- Every Pass 0 capability shipped; drops (explicit Compute button -> live recompute; stale Bootstrap CI + logit-CI featureList text) are correct per the verified linear-clamped DeLong math.
