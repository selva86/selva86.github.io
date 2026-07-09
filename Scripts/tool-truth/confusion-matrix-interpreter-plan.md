# confusion-matrix-interpreter v2 — build plan + parity checklist

Rebuild of `tools/confusion-matrix-interpreter.html` (pre-v2, Jul 8 batch: old IBM-Plex `--c-*`
shell, inline unverified math) onto the v2 **Lab sheet** shell with a **R-verified math lib**.
Ground truth: `caret::confusionMatrix()` (caret + e1071 installed, R 4.6.0).

## Pass 0 — FEATURE INVENTORY of the predecessor (every capability accounted for)

| # | Old capability | v2 disposition |
|---|----------------|----------------|
| 1 | Mode: Binary 2×2 (TP/FP/FN/TN) | KEEP — matrix inputs, predicted×actual labeled |
| 2 | Mode: Multi-class k×k (2–6, editable labels) | KEEP — editable k×k grid + labels |
| 3 | Mode: Paste caret output (auto-detect binary/multi, honor Positive class) | KEEP — textarea + parser |
| 4 | Binary metrics: accuracy+CI, sensitivity, specificity, precision/PPV, NPV, F1, F0.5, F2, balanced acc, prevalence, kappa, MCC, LR+, LR- | KEEP ALL |
| 5 | Multi metrics: per-class (prec/rec/spec/F1/support), macro P/R/F1, weighted P/R/F1, micro-F1(=acc), accuracy+CI, kappa, multiclass MCC (Gorodkin), balanced acc | KEEP ALL |
| 6 | Confidence level 80/90/95/99 (accuracy CI) | KEEP — 4-button level selector |
| 7 | Cost-ratio number input → F-beta | WAIVE the free input; **F0.5 + F2 always shown** in the more-line (cost story preserved) + taught in method table. Reason: a fiddly free number harms clarity; the two standard cost-weighted F scores cover it. |
| 8 | Scenario presets: spam, screening, fraud, iris, digits, custom | KEEP all 6 |
| 9 | What-if viz sliders: prevalence/sensitivity/specificity (binary) regenerate a pop-10000 matrix; n_classes (multi) | KEEP as a dedicated **Base-rate explorer** panel (binary) — the base-rate-fallacy lesson, PPV vs prevalence |
| 10 | R code emitter (caret::confusionMatrix), live | KEEP — live, base-R-parseable |
| 11 | 3 UX features: tool-lead, "I want to…" banner, inference line | KEEP |
| 12 | Method column (useWhen/example/inputs) | FOLD into How-computed + below-fold method/glossary table |
| 13 | FAQ + WebApplication/FAQPage/Breadcrumb JSON-LD | KEEP / refresh |

## v2 correctness upgrades (the reason for the rebuild)

- **Accuracy CI: Wilson → Clopper-Pearson exact** — caret uses `binom.test()` (exact), old tool used Wilson. FIX.
- **Add No Information Rate + `P-Value [Acc > NIR]`** — caret prints them; old tool omitted. `p = P(X>=correct), X~Binom(N,NIR)` via regularized incomplete beta.
- **Add McNemar's test p-value** — caret prints it; binary 2×2 (continuity-corrected) + k×k (Bowker).
- **Verified `tools/lib/classification-math.js`** — every displayed number tested vs caret truth at ≤1e-6.

## Signature visual

Primary results viz = **confusion-matrix heatmap** (2×2 or k×k), cells shaded by count, diagonal
accented, TP/FP/FN/TN annotated, aria-labelled, updates live. Secondary = base-rate explorer curve.

## Math to verify vs caret

Binary: accuracy, accuracyLower/Upper (Clopper-Pearson at 80/90/95/99), NIR, accPValue,
kappa, mcnemarP, sensitivity, specificity, PPV, NPV, prevalence, detectionRate, detectionPrevalence,
balancedAccuracy, precision, recall, F1, F0.5, F2, MCC, LR+, LR-.
Multi: accuracy, CI, NIR, accPValue, kappa, per-class byClass, macro/weighted P/R/F1, Gorodkin MCC, balAcc.

Note: caret PPV/NPV use prevalence-adjusted forms; with prevalence = observed they reduce to
TP/(TP+FP) and TN/(TN+FN) — verified equal in the truth script, so the lib uses the naive form.

## Passes 1–4

1. `confusion-matrix-interpreter.R` → `.json` (binary + multi + edge: zero-TP, all-negative, tiny n, perfect, 50/50 random, rare-event).
2. `tools/lib/classification-math.js` (UMD) + `test-confusion-matrix-interpreter-math.js` gate ≤1e-6.
3. Page on Lab-sheet shell (copy effect-size shell). No em dashes, no data-tool-v2, no bespoke masthead. Inter + system mono.
4. Gates: Playwright E2E vs truth, build.py --only chrome check (1 injected chrome, sidebar), 390px no-overflow, parity checkoff, commit explicit paths to `tools-v2`.
