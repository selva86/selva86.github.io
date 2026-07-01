# DS Advanced tier (§13-22) — interactive lessons plan

Scope: the 10 `adv`-tier Data Scientist roadmap sections (§13-22), 65 base curriculum items.
Model: 1-1 item→lesson, **multi-part where a topic is rich**, merge only where an item is too thin.
Target: ~80 interactive lessons + 10 end-of-section quizzes (8-12 Q each) + 10 course landings.
Rule carried from batch 2: every lesson gate-clean (0/0), every runnable-R block + every widget's emitted R **WebR-verified**, cover carries a visual (R1), no WebR mention, single-colon quiz titles.
"Remove redundant entries": once a section has interactive lessons in `courses.json`, `roadmap-role.js` already **drops the flat item list** (same dedup shipped for §6-12). No source edit needed; the flat `S(...)` items stay as a no-JS fallback.

Tiering: these render under the DS roadmap **Advanced** band (already tier-banded). Access: Advanced = Pro (per positional gate; `lesson_access` can override the first lesson of a section to free as a taste).

---

## Lesson arc by section (item → lesson; ⧉ = new widget, ♻ = reuse)

### §13 ds-reg-glm-expert — Regression and GLMs, the expert cut  (9 items → 13 lessons)
1. Robust regression I: M-estimators & why OLS breaks — ⧉robust-weights ♻leverage-point,ols-fit
2. Robust regression II: MM-estimation, breakdown point, `rlm`/`lmrob` — ⧉robust-weights ♻residual-plot
3. Quantile regression — ⧉quantile-lines
4. Regularized regression I: ridge & the bias-variance of shrinkage — ⧉coef-path
5. Regularized regression II: lasso, elastic net, the coefficient path & selection — ⧉coef-path
6. GAMs I: splines & smooths (`mgcv`) — ⧉spline-smoother
7. GAMs II: choosing smoothness, concurvity, `gam.check` — ⧉spline-smoother ♻residual-plot
8. Count models: Poisson, overdispersion & negative binomial — ⧉count-dist
9. Zero-inflated & hurdle models (`pscl`) — ⧉count-dist
10. Gamma & Tweedie regression (positive/heavy-tailed) — ⧉glm-family-shapes
11. Beta & ordinal/multinomial regression (`betareg`,`polr`,`VGAM`) — ⧉ordinal-cumlogit ♻glm-family-shapes
12. Mixed models I: random intercepts & partial pooling (`lme4`) — ⧉shrinkage-pool
13. Mixed models II: random slopes, GLMMs, convergence — ⧉shrinkage-pool

### §14 ds-advanced-supervised — Advanced supervised learning  (6 → 8)
1. SVM I: the maximum-margin classifier — ⧉kernel-svm ♻decision-region
2. SVM II: the kernel trick (poly/RBF), C & gamma — ⧉kernel-svm
3. Regularized discriminant analysis & shrinkage covariance — ♻decorrelation ⧉(shrink-cov, small)
4. Gaussian processes for regression & uncertainty — ⧉gp-posterior
5. Stacking & the Super Learner — ⧉stacking-blend
6. Bayesian optimization for hyperparameters — ⧉bayesopt-acq ♻tuning-search
7. Approximate nearest neighbors at scale (HNSW/ANNOY) — ♻knn-vote ⧉(ann-graph, small)
8. Putting it together: a tuned, stacked model end to end — ♻learning-curve

### §15 ds-survival — Survival and time-to-event  (6 → 7)
1. Survival data, censoring & the survival/hazard functions — ⧉km-curve
2. Kaplan-Meier & the log-rank test — ⧉km-curve
3. Cox proportional hazards & the hazard ratio — ⧉hazard-ratio
4. Checking proportional hazards; time-varying covariates — ♻residual-plot ⧉hazard-ratio
5. Parametric & AFT models (`flexsurv`) — ⧉glm-family-shapes(reuse for distributions)
6. Competing risks & cumulative incidence (Fine-Gray) — ⧉competing-risks
7. Survival ML & evaluating survival models (C-index, Brier) — ♻calibration-curve

### §16 ds-bayesian — Bayesian and hierarchical modeling  (6 → 8)
1. The Bayesian update: prior × likelihood → posterior — ⧉bayes-update
2. Conjugacy & choosing priors — ⧉bayes-update
3. MCMC I: why we sample; the Metropolis idea — ⧉mcmc-walk
4. MCMC II: HMC/NUTS, diagnostics (R-hat, ESS, traces) in `brms`/`rstanarm` — ⧉mcmc-walk
5. Hierarchical models & partial pooling — ⧉shrinkage-pool (shared w/ §13)
6. Posterior predictive checks & the Bayesian workflow — ⧉ppc-overlay
7. Model comparison: LOO, WAIC — ♻calibration-curve
8. Bayesian regression & GLMs, end to end — ♻ols-fit

### §17 ds-experimentation — Experimentation and online learning  (6 → 7)
1. Designing for power: effect size, alpha, n — ⧉power-curve
2. Variance reduction: CUPED & stratification — ⧉cuped-variance
3. Experiment pitfalls: peeking, SRM, network effects — ♻null-distribution
4. Cluster & switchback experiments — ⧉(switchback-grid, small)
5. Multi-armed bandits: explore vs exploit, regret — ⧉bandit-explore
6. Thompson sampling & Bayesian bandits — ⧉bandit-explore
7. Contextual bandits & off-policy evaluation (IPS/DR) — ♻bandit-explore

### §18 ds-causal-decisions — Causal inference for decisions  (9 → 11)
1. Matching & the propensity score (`MatchIt`) — ⧉matching-overlap ♻causal-dag
2. Inverse-probability weighting & doubly-robust (`WeightIt`) — ⧉matching-overlap
3. Difference-in-differences & parallel trends — ⧉did-parallel
4. Modern DiD: staggered adoption & the negative-weights problem — ⧉did-parallel
5. Regression discontinuity (`rdrobust`) — ⧉rdd-cutoff
6. Instrumental variables & 2SLS (`ivreg`) — ⧉iv-2stage
7. Synthetic control (`tidysynth`) — ⧉synth-control
8. Uplift & heterogeneous effects; causal forests (`grf`) — ⧉uplift-curve
9. Double/debiased ML (`DoubleML`) — ♻causal-dag ⧉(dml-flow, small)
10. Sensitivity analysis & placebo tests — ♻did-parallel
11. Mediation analysis — ♻causal-dag

### §19 ds-robustness-drift — Robustness, drift and distribution shift  (6 → 7)
1. Kinds of shift: covariate, label, concept — ⧉shift-types
2. Detecting shift (PSI, KS, classifier-2-sample) — ♻drift-monitor
3. Adapting: reweighting & retraining triggers — ♻drift-monitor
4. Out-of-distribution & novelty detection — ⧉ood-detect
5. Group robustness / DRO & worst-group accuracy — ♻fairness-metrics ⧉(worst-group)
6. Adversarial robustness — ⧉adversarial-perturb
7. A monitoring & robustness playbook — ♻drift-monitor

### §20 ds-anomaly — Anomaly detection and advanced unsupervised  (6 → 7)
1. What is an anomaly? density, distance & the base-rate trap — ♻cluster-validate
2. Isolation forest & extended isolation forest (`isotree`) — ⧉isolation-forest
3. Local outlier factor & one-class SVM — ⧉lof-density ♻kernel-svm
4. Autoencoders for anomalies (reconstruction error) — ⧉autoencoder-recon
5. Time-series anomaly detection — ♻drift-monitor
6. Kernel PCA, sparse PCA & NMF — ♻pca-projection ⧉(nmf-parts)
7. Self-supervised / contrastive representation — ♻decorrelation

### §21 ds-uncertainty — Uncertainty: conformal, calibration, probabilistic  (5 → 7)
1. Prediction intervals you can trust — ♻regression-intervals
2. Conformal prediction I: split conformal & guaranteed coverage — ⧉conformal-bands
3. Conformal prediction II: CQR, Mondrian/class-conditional, APS for classification — ⧉conformal-bands
4. Quantile & distributional regression for uncertainty — ♻quantile-lines
5. Calibration, deep: reliability, Platt/isotonic, multi-class — ♻calibration-curve
6. The bootstrap & the jackknife+ — ♻bootstrap-sample
7. Reporting uncertainty honestly — ♻calibration-curve

### §22 ds-xai-fairness-privacy — Explainability, fairness & privacy (deep)  (6 → 8)
1. SHAP interactions & the H-statistic — ♻shap-bars ⧉(shap-interaction)
2. LIME & local surrogates — ⧉lime-local
3. Anchors & counterfactual explanations (recourse) — ⧉counterfactual-recourse
4. Global surrogate & feature-interaction detection — ♻tree-diagram ♻pdp-curve
5. Fairness I: metrics & the impossibility result — ♻fairness-metrics
6. Fairness II: mitigation (pre/in/post-processing) — ♻fairness-metrics
7. Differential privacy: the privacy-utility tradeoff — ⧉dp-noise
8. Membership-inference attacks & governance — ♻dp-noise

**Lesson total ≈ 83; quizzes 10.**

---

## New widgets to build (~30 core; each emits runnable R, WebR-verified)

Regression/GLM: **robust-weights** (M-est down-weighting an outlier; `rlm`), **quantile-lines** (τ lines; `quantreg::rq`), **coef-path** (lasso/ridge path vs λ; `glmnet`), **spline-smoother** (GAM wiggliness; `mgcv::gam`), **count-dist** (excess-zero counts; Poisson/ZIP/NB; `pscl`), **glm-family-shapes** (Gamma/Tweedie/Beta densities), **ordinal-cumlogit** (proportional-odds category curves; `MASS::polr`), **shrinkage-pool** (partial pooling; `lme4::lmer`) — *reused in §16*.
Supervised: **kernel-svm** (linear/poly/RBF boundary + margin + SVs; `e1071::svm`), **gp-posterior** (GP mean+band, lengthscale; `kernlab`), **stacking-blend** (base→meta weights), **bayesopt-acq** (surrogate+EI stepping).
Survival: **km-curve** (KM step + censoring + log-rank; `survival`), **hazard-ratio** (two curves under HR), **competing-risks** (cumulative incidence).
Bayesian: **bayes-update** (prior×likelihood→posterior), **mcmc-walk** (Metropolis trace+hist, burn-in/mixing), **ppc-overlay** (observed vs replicated).
Experimentation: **power-curve** (n vs power; `power.*.test`), **cuped-variance** (CI shrink from covariate), **bandit-explore** (arms, ε-greedy vs Thompson, regret) — *reused §17*.
Causal: **matching-overlap** (propensity overlap + balance; `MatchIt`), **did-parallel** (2 trends + DiD estimate), **rdd-cutoff** (jump at cutoff, bandwidth), **iv-2stage** (instrument→exogenous variation), **synth-control** (donor weights vs treated), **uplift-curve** (Qini/uplift; `grf`).
Robustness/Anomaly: **shift-types** (covariate/label/concept), **ood-detect** (score threshold), **adversarial-perturb** (small perturbation flips pred), **isolation-forest** (path-length isolation; `isotree`), **lof-density** (local density outliers), **autoencoder-recon** (reconstruction error via PCA proxy).
Uncertainty/XAI/privacy: **conformal-bands** (calibration residuals → guaranteed-coverage band), **lime-local** (local linear surrogate), **counterfactual-recourse** (minimal flip), **dp-noise** (ε vs noise vs utility).
Small/optional (fold in if time): shrink-cov, ann-graph, switchback-grid, worst-group, nmf-parts, dml-flow, shap-interaction.

Reuse heavily from the 56-widget library (causal-dag, drift-monitor, calibration-curve, shap-bars, fairness-metrics, pdp-curve, regression-intervals, residual-plot, ols-fit, leverage-point, decision-region, bootstrap-sample, learning-curve, null-distribution, knn-vote, tree-diagram, decorrelation, cluster-validate, pca-projection, tuning-search).

---

## Quizzes (10, one per section, 8-12 Q)
Same content type as §6-12: `lesson_kind:quiz`, single-colon title "`<Course>`: Quiz", 8-12 gated `::quiz` steps + 2 runnable-R concept steps + cover + complete; grounded, real-misconception distractors. Advanced topics → mostly intermediate/advanced difficulty.

## Course landings (10)
One `posts/R-<Section>-Course.md` (post_type C) per section-course, listing its lessons — same shape as R-Model-Evaluation-Course.md.

---

## Execution phases
1. **Widgets first** (~30) — build in `www/lesson-widgets/`, register, bundle; verify each `mount()` + emitted R runs in WebR. (The quality lever; lessons SELECT from these.)
2. **Curriculum → `Plans/lessons-curriculum.md`** (the 10 courses + arcs) → `build_lessons_tracker.py` + seed `lessons-status.json` pending.
3. **Batch in waves** via `Scripts/batch_lessons.py` (fresh `claude -p` per lesson; PLAN→BUILD→check→publish→gate). Wave A: §13-15, Wave B: §16-18, Wave C: §19-22. Babysit each.
4. **Quizzes** — hand-author 10 (8-12 Q), gate + WebR verify.
5. **Roadmap wire** — courses.json auto-surfaces lessons+quiz rows; dedup drops flat lists; add the 10 landings; tier-band stays.
6. **Mobile QA** (mandatory) — Playwright at 360/390/414px on: a lesson of each new widget type (no text/tag overlap, widget SVG responsive, code boxes fit), a quiz, each section landing, the DS roadmap (nav one line, §13-22 interactive rows clean), the main roadmap. Fix overlaps in `lesson-mode.css`/widget CSS before merge.
7. **Ship** — branch → CF preview → verify → merge to master; re-trigger if the large build stalls (as in the §6-12 deploy).

## Scale & trade-offs
- ~83 lessons ≈ 28h batch runtime + ~30 widgets (~15-25h careful hand-build) + 10 quizzes. Multi-day; run in waves.
- Pro-gated (Advanced tier) → these deepen the paid offer; first lesson of each section can be free as a taste.
- SEO: interactive lessons are crawlable; no tutorials deleted (advanced topics have few/no existing tutorials to preserve).
- Biggest quality lever = the widgets. Biggest risk = widget breadth; mitigate by building + WebR-verifying all widgets before the batch so lessons never reference a missing/broken widget.
