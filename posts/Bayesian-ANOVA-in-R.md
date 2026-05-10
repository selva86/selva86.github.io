---
title: "Bayesian ANOVA in R With BayesFactor: Report Evidence, Not Just p-values"
slug: "Bayesian-ANOVA-in-R"
description: "Run Bayesian ANOVA in R with the BayesFactor package. Bayes factors quantify evidence directly; sample posterior group means and run custom contrasts."
keywords: "Bayesian ANOVA R, BayesFactor package, anovaBF, Bayes factor ANOVA, two-way Bayesian, repeated measures Bayesian, Bayesian factorial, evidence quantification"
auto_link_terms: "Bayesian ANOVA|BayesFactor package|anovaBF|Bayes factor|BF10|BF01|model comparison Bayesian|posterior group means|repeated measures Bayesian|factorial Bayesian|evidence ratio|Bayesian hypothesis testing"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-05-10"
curriculum_id: "5.2.9"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Bayesian ANOVA"
sidebar_order: 127
difficulty: "Intermediate"
---

# Bayesian ANOVA in R With BayesFactor: Report Evidence, Not Just p-values

<p class="lead">Frequentist ANOVA returns an F-statistic and a p-value: "p = 0.03, reject the null." That sentence is famously hard to interpret correctly. Bayesian ANOVA via the BayesFactor package returns a Bayes factor: a direct ratio of how plausible the data is under one model versus another. "BF = 8" means the data is 8 times more likely under the model with the group effect than under the null. That phrasing is what stakeholders actually want to hear, and the BayesFactor package computes it for one-way, two-way, factorial, and repeated-measures designs in one line.</p>

## What does Bayesian ANOVA give you that frequentist ANOVA does not?

Three things. First, *direct evidence*. A Bayes factor is the ratio of the marginal likelihood of two models. BF = 8 says the data is 8 times more likely under model A than model B.

There is no null-hypothesis logic to translate, no Type I error rate to convert, no "rejecting the null" language.

Second, *evidence for the null*. A p-value above 0.05 says you "fail to reject" the null but cannot quantify support for it. A Bayes factor below 1 (e.g., BF = 0.2) says the data is 5 times more likely under the null than the alternative. Bayesian methods quantify both directions of evidence.

Third, *posterior over the group means*. After running anovaBF, you can extract the posterior distribution over each group's mean with one extra call. That gives you per-group credible intervals and direct comparisons (probability that group A's mean exceeds group B's), all without writing a separate model.

The BayesFactor package is also pure R with no external Stan dependency, which makes it the fastest Bayesian-ANOVA tool to install and use.

```r title="Run a Bayesian ANOVA in three lines"
library(BayesFactor)

set.seed(2026)

# Three groups with different means: control, treatment_A, treatment_B
df_anova <- data.frame(
  outcome = c(rnorm(20, 50, 5), rnorm(20, 55, 5), rnorm(20, 53, 5)),
  group   = factor(rep(c("control", "treatment_A", "treatment_B"), each = 20))
)

bf <- anovaBF(outcome ~ group, data = df_anova)
bf
#> Bayes factor analysis
#> --------------
#> [1] group : 6.245   ±0.01%
#>
#> Against denominator:
#>   Intercept only
#> ---
#> Bayes factor type: BFlinearModel, JZS
```

Walk through what just happened. We simulated three groups with means 50, 55, 53 and standard deviation 5. The truth: there is a real group effect.

`anovaBF(outcome ~ group, data)` fit two models internally: one with `group` as a predictor (the alternative) and one without (the null, "Intercept only"). It then computed the ratio of their marginal likelihoods.

The output BF = 6.245 says the data is 6.2 times more likely under the model with `group` than under the null. That is moderate-to-strong evidence for the group effect.

Compare to a frequentist ANOVA on the same data:

```r title="Frequentist ANOVA on the same data"
summary(aov(outcome ~ group, data = df_anova))
#>             Df Sum Sq Mean Sq F value  Pr(>F)
#> group        2   270    134.8   5.392 0.00712 **
#> Residuals   57  1424     25.0
```

Walk through the comparison. The F-test gives p = 0.0071: the null is rejected at conventional thresholds. Strictly, that means "if there were no group effect, we would see a F-statistic at least this large 0.7% of the time."

The Bayes factor gives BF = 6.2: "the data is 6.2 times more likely under the alternative than the null." Both methods reach the same qualitative conclusion (the group effect is real), but the Bayes factor is much easier to communicate.

![BayesFactor ANOVA flow](screenshots/Bayesian-ANOVA-in-R-bf-flow.webp)
*Figure 1: BayesFactor ANOVA workflow. Pass the formula and data to anovaBF(), get a Bayes factor for each model considered, then sample from the posterior over group means.*

[KEY INSIGHT]
**A Bayes factor is the *ratio of evidence*, not a probability.** BF = 6.2 does not mean "62% probability the alternative is true." It means "the data updates your prior odds of the alternative versus null by a factor of 6.2." If you started with 1:1 prior odds, your posterior odds are 6.2:1, which is about 86% probability for the alternative.

**Try it:** Compute BF the other way (null over alternative) by using `1/bf`. Verify the relationship.

```r title="Your turn: invert the Bayes factor"
# 1 / bf
#> Expected: about 0.16, the data is 0.16 times as likely under the null
```

<details>
<summary>Click to reveal solution</summary>

```r title="Invert BF solution"
1 / bf
#> Bayes factor analysis
#> --------------
#> [1] Intercept only : 0.1601 ±0.01%
#>
#> Against denominator:
#>   group
```

Inverting a Bayes factor swaps which model is the numerator. `1/bf = 0.16` says the data is 0.16 times as likely under the null as under the alternative, which is just the same evidence expressed the other way. Researchers report whichever direction is more intuitive for their narrative.

</details>

## How do I run anovaBF() on a one-way design?

The minimal usage. `anovaBF(formula, data)` returns a BayesFactor object. The `[1]` indicates you can index into it for multiple models in a multi-factor design (next section). For a one-way design with one grouping factor, there is just one model versus the null.

```r title="One-way ANOVA with explicit prior settings"
bf_default <- anovaBF(outcome ~ group, data = df_anova)
bf_strong  <- anovaBF(outcome ~ group, data = df_anova,
                      rscaleFixed = "ultrawide")  # less informative prior

c(
  bf_default = round(extractBF(bf_default)$bf, 3),
  bf_strong  = round(extractBF(bf_strong)$bf, 3)
)
#> bf_default  bf_strong
#>      6.245      4.842
```

Walk through what changed. `rscaleFixed` controls the prior scale on the group effects. Default is "medium"; "wide" and "ultrawide" are progressively less informative. With ultrawide, the BF drops slightly (4.84 vs 6.25) because the wider prior dilutes the evidence.

For most one-way designs the default is fine. Document which scale you used; reviewers may ask whether your conclusion is robust to the prior choice.

To get the posterior over the group means, sample from the BayesFactor object:

```r title="Sample posterior group means"
post_samples <- posterior(bf_default, iterations = 10000)
head(post_samples, 3)
#>          mu group-control group-treatment_A group-treatment_B sig2 g_group
#> [1,] 53.34       -2.93           1.69            1.21           29.97  0.55
#> [2,] 52.74       -2.50           1.83            0.74           24.13  0.39
#> [3,] 52.99       -3.20           1.39            1.85           28.83  0.32

# Posterior median for each group (mu + group deviation)
group_means <- t(apply(post_samples[, 1:4], 1, function(row) {
  c(control     = row[1] + row[2],
    treatment_A = row[1] + row[3],
    treatment_B = row[1] + row[4])
}))
apply(group_means, 2, function(m) {
  c(median = round(median(m), 2),
    q025   = round(quantile(m, 0.025), 2),
    q975   = round(quantile(m, 0.975), 2))
})
#>            control treatment_A treatment_B
#> median       49.71       55.07       53.18
#> q025         47.50       52.85       51.00
#> q975         51.91       57.21       55.36
```

Walk through the output. `posterior(bf, iterations = 10000)` returned 10000 posterior draws across the parameters. `mu` is the grand mean; `group-control`, `group-treatment_A`, `group-treatment_B` are the group-level deviations from the grand mean. `sig2` is the residual variance.

We computed each group's mean as `mu + group deviation` per draw, then summarised. The posterior medians (49.7, 55.1, 53.2) recover the simulated truth (50, 55, 53) closely. The 95% credible intervals tell you where each group mean is with what uncertainty.

[TIP]
**`posterior()` returns an MCMC object compatible with the coda package.** You can use `coda::summary()` on it for traceplots and per-parameter summaries, or convert to a matrix for custom calculations.

**Try it:** Compute the posterior probability that treatment_A's mean exceeds the control mean.

```r title="Your turn: probability of difference"
# Compute group_means[, 'treatment_A'] - group_means[, 'control']
# Compute mean(diff > 0)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Probability of difference solution"
diff_a_vs_c <- group_means[, "treatment_A"] - group_means[, "control"]
c(
  median_diff = round(median(diff_a_vs_c), 2),
  ci          = paste0("[", round(quantile(diff_a_vs_c, 0.025), 2),
                       ", ", round(quantile(diff_a_vs_c, 0.975), 2), "]"),
  prob_pos    = round(mean(diff_a_vs_c > 0), 3)
)
#>   median_diff               ci         prob_pos
#>          5.32   [2.13, 8.43]            0.999
```

The posterior median difference is 5.3 mpg (close to the truth of 5) with 95% credible interval `[2.1, 8.4]`. Posterior probability that treatment_A exceeds control is 99.9%, decisive evidence.

</details>

## How do I read a Bayes factor and interpret its magnitude?

Standard interpretation thresholds (Jeffreys, 1961; refined by Kass and Raftery):

| Bayes factor | Evidence for alternative |
|---|---|
| BF < 1 | Negative evidence (data favours null) |
| 1 to 3 | Anecdotal |
| 3 to 10 | Moderate |
| 10 to 30 | Strong |
| 30 to 100 | Very strong |
| > 100 | Extreme/decisive |

Most published results in the social sciences would land in the "anecdotal" or "moderate" zones if reported as Bayes factors, which is one reason switching from p-values to BF is sometimes resisted.

Below we run anovaBF on a near-null dataset and see what an inconclusive BF looks like.

```r title="A near-null dataset"
set.seed(2026)
df_null <- data.frame(
  outcome = c(rnorm(20, 50, 5), rnorm(20, 51, 5), rnorm(20, 50.5, 5)),
  group   = factor(rep(c("A", "B", "C"), each = 20))
)
bf_null <- anovaBF(outcome ~ group, data = df_null)
bf_null
#> [1] group : 0.279   ±0.01%
```

Walk through the result. BF = 0.28 says the data is 0.28 times as likely under the model with the group effect than under the null. Equivalently, BF for the null is `1/0.28 = 3.6`: the data is 3.6 times more likely under the null. That is moderate evidence *for* the null.

The frequentist version would give a non-significant p-value and we would have to say "we failed to reject the null," which is hedge-y. The BF lets us say "the data moderately supports the null."

```r title="Compare frequentist and Bayesian on the near-null"
freq_p <- summary(aov(outcome ~ group, data = df_null))[[1]]$`Pr(>F)`[1]
c(
  freq_p_value = round(freq_p, 3),
  bf_alt       = round(extractBF(bf_null)$bf, 3),
  bf_null      = round(1 / extractBF(bf_null)$bf, 3)
)
#>  freq_p_value       bf_alt        bf_null
#>         0.785        0.279          3.582
```

Walk through. p = 0.79 (high, not significant). BF for alternative = 0.28; BF for null = 3.58. Both methods conclude there is no support for a group effect, but the Bayesian version actively supports the null with moderate evidence rather than just failing to find evidence against it.

[NOTE]
**BF thresholds are not p-value thresholds.** A BF of 3 is roughly equivalent to a p-value of 0.05 for a two-sided test, but they encode different things. BF directly compares model fit; p-value measures only how surprising the data is under the null. Do not translate "BF > 3" as "significant"; describe it in evidence-ratio terms.

**Try it:** Compute the BF for null vs alternative on the near-null dataset and check that it lands in the "moderate" range.

```r title="Your turn: evidence for null"
# 1 / bf_null
#> Expected: BF for null around 3 to 4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Evidence for null solution"
1 / bf_null
#> [1] Intercept only : 3.582 ±0.01%
#>
#> Against denominator: group
```

BF = 3.58 for the null model versus the alternative. This is in the "moderate evidence" range. We can confidently say the data favours the null; we cannot say "definitive" because BF would need to be over 10 for that.

</details>

## How do I do two-way ANOVA and compare interaction models?

For a 2x2 or larger factorial design, anovaBF compares all model variants automatically. Each row of the output is one model versus the null.

```r title="Two-way ANOVA with interaction"
set.seed(2026)
df_two <- expand.grid(
  factor_A = factor(c("low", "high")),
  factor_B = factor(c("control", "treatment")),
  rep      = 1:25
)
df_two$y <- 50 + 5 * (df_two$factor_A == "high") +
            3 * (df_two$factor_B == "treatment") +
            2 * (df_two$factor_A == "high" & df_two$factor_B == "treatment") +
            rnorm(nrow(df_two), 0, 5)

bf_two <- anovaBF(y ~ factor_A * factor_B, data = df_two)
bf_two
#> [1] factor_A                                : 1.821e+04 ±0.01%
#> [2] factor_B                                : 18.50     ±0.01%
#> [3] factor_A + factor_B                     : 5.612e+05 ±2.1%
#> [4] factor_A + factor_B + factor_A:factor_B : 4.301e+05 ±2.7%
```

Walk through what each line means. anovaBF reported four model variants:
1. `factor_A` only: BF = 18,210 against the null. Strong evidence for an A effect.
2. `factor_B` only: BF = 18.5. Moderate-to-strong evidence for a B effect alone.
3. Both main effects: BF = 561,200. Combined main-effects model is much better than null.
4. Both mains plus interaction: BF = 430,100. Interaction model is best in absolute terms but barely better than mains-only.

To compare model 4 (interaction) vs model 3 (mains only):

```r title="Compare the interaction model directly"
bf_interact_vs_main <- bf_two[4] / bf_two[3]
bf_interact_vs_main
#> [1] factor_A + factor_B + factor_A:factor_B : 0.766
```

Walk through what we just computed. Dividing model 4's BF by model 3's BF gives the interaction-vs-main BF directly: 0.77. The interaction does NOT add evidence over and above the main effects. The data is 0.77 times as likely under the interaction model.

This is the right way to test for an interaction with BayesFactor: directly compare the two models, not their ratios against the null. With BF = 0.77, the interaction is "anecdotal" (close to 1), so we do not need it.

[TIP]
**Always compare the most-complex and next-simpler model directly, not just both against the null.** Model selection in BayesFactor is bf_complex / bf_simpler. Reporting only "BF = 430,100" for the interaction model is misleading; the relevant comparison is interaction-vs-mains.

**Try it:** Compute BF for the main-effects model versus the A-only model.

```r title="Your turn: incremental BF for adding factor B"
# bf_two[3] / bf_two[1]
#> Expected: BF for adding factor B over and above factor A
```

<details>
<summary>Click to reveal solution</summary>

```r title="Incremental BF solution"
bf_two[3] / bf_two[1]
#> [1] factor_A + factor_B : 30.84
```

BF = 30.8 for adding factor B over and above factor A. That is "very strong evidence", adding factor B substantially improves the model. So we keep both main effects. The interaction (BF = 0.77) does not add evidence and gets dropped.

</details>

## How does Bayesian ANOVA handle within-subject (repeated measures) designs?

For repeated measures, treat the subject as a random factor. anovaBF supports this via `whichRandom = "subject"`.

```r title="Repeated measures ANOVA with BayesFactor"
set.seed(2026)
n_subj <- 30
df_rm  <- expand.grid(
  subject = factor(1:n_subj),
  time    = factor(c("pre", "mid", "post"))
)
subj_eff   <- rnorm(n_subj, 0, 4)[as.integer(df_rm$subject)]
time_eff   <- c(0, 2, 4)[as.integer(df_rm$time)]
df_rm$y    <- 50 + subj_eff + time_eff + rnorm(nrow(df_rm), 0, 2)

bf_rm <- anovaBF(y ~ time + subject, data = df_rm,
                 whichRandom = "subject")
bf_rm
#> [1] time + subject : 1.022e+09 ±0.81%
```

Walk through what we did. The formula `y ~ time + subject` includes both the time factor and a per-subject intercept. `whichRandom = "subject"` tells anovaBF that subject should be treated as a nuisance random factor (we do not care about its effect, we just want to control for it).

The BF is 1.02e+09, decisive evidence for the time effect even after accounting for subject-level variation. Without controlling for subjects, the BF would be much smaller (or even null) because subject-level variation would inflate the residual.

To extract the posterior over time means after marginalising over subjects, use `posterior()` with appropriate filtering:

```r title="Posterior over time means in repeated measures"
post_rm <- posterior(bf_rm, iterations = 10000)

# Posterior medians for time effects (relative to the grand mean)
time_cols   <- grep("^time-", colnames(post_rm), value = TRUE)
time_post   <- post_rm[, time_cols]
apply(time_post, 2, function(d) {
  c(median = round(median(d), 2),
    q025   = round(quantile(d, 0.025), 2),
    q975   = round(quantile(d, 0.975), 2))
})
#>          time-pre time-mid time-post
#> median      -2.06    -0.05     2.11
#> q025        -2.92    -0.91     1.28
#> q975        -1.13     0.84     2.93
```

Walk through the output. Each column is one time level's deviation from the grand mean. Pre is at -2.06 (below average); mid is near zero; post is +2.11 (above average).

The simulated truth was time effects of `c(0, 2, 4)`; centred on the mean, those become `c(-2, 0, 2)`. Recovered correctly.

[KEY INSIGHT]
**Repeated-measures BF naturally controls for subject effects without adding parameters to interpret.** The BF you report is for the time factor *after* subject-level variation has been accounted for. Stakeholders see the right number; the nuisance variation is handled silently.

**Try it:** Compute the probability that the post mean exceeds the pre mean.

```r title="Your turn: pre vs post probability"
# diff <- time_post[, 'time-post'] - time_post[, 'time-pre']
# mean(diff > 0)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Pre vs post solution"
diff_post_pre <- time_post[, "time-post"] - time_post[, "time-pre"]
c(
  median   = round(median(diff_post_pre), 2),
  ci       = paste0("[", round(quantile(diff_post_pre, 0.025), 2),
                    ", ", round(quantile(diff_post_pre, 0.975), 2), "]"),
  prob_pos = round(mean(diff_post_pre > 0), 4)
)
#>          median            ci         prob_pos
#>            4.17    [3.13, 5.20]           1.0000
```

Posterior median difference is 4.17 with 95% credible interval `[3.13, 5.20]`. Posterior probability that post exceeds pre is 100% across all 10000 draws. Decisive evidence.

</details>

## When should I use BayesFactor vs brms for ANOVA-style designs?

Both can do Bayesian ANOVA, with different strengths.

`BayesFactor::anovaBF()`:
- Pure R, no Stan dependency, fast install and fast first run.
- Returns Bayes factors directly. The interpretation is "how much does the data update the odds of model A vs model B."
- Limited to factorial and repeated-measures designs supported by the JZS prior. Custom likelihoods, hierarchical structures, non-standard predictors are not supported.

`brms`:
- Full flexibility: any family, any custom prior, any hierarchical structure.
- Returns posterior samples; you compute Bayes factors yourself via `bayes_factor()` (which uses bridgesampling under the hood and is slower).
- Requires Stan installation and 30-90 second model compile time.

The decision rule: if your design is a standard factorial or repeated-measures ANOVA, use BayesFactor. If you need custom likelihood, hierarchical structure, or non-standard predictors, use brms. For everything in between, both work.

```r title="Comparing BayesFactor and brms on a one-way design"
# BayesFactor
bf_one <- extractBF(anovaBF(outcome ~ group, data = df_anova))$bf

# brms with bridgesampling-based BF
fit_brms_alt  <- brms::brm(outcome ~ group, df_anova,
                           save_pars = save_pars(all = TRUE),
                           chains = 4, iter = 4000, seed = 2026, silent = 2)
fit_brms_null <- brms::brm(outcome ~ 1, df_anova,
                           save_pars = save_pars(all = TRUE),
                           chains = 4, iter = 4000, seed = 2026, silent = 2)
brms_bf <- brms::bayes_factor(fit_brms_alt, fit_brms_null)$bf

c(BayesFactor_BF = round(bf_one, 3),
  brms_BF        = round(brms_bf, 3))
#>  BayesFactor_BF        brms_BF
#>           6.245          5.81
```

Walk through. Both methods give very similar Bayes factors (6.25 vs 5.81) on the same data. The small difference comes from prior choices: BayesFactor uses a default JZS prior; brms uses its own weakly informative defaults. Both are in the "moderate-to-strong" evidence zone.

For most one-way and factorial designs, BayesFactor is faster (no compile, no Stan dependency, runs in pure R). Reach for brms when you need its extra flexibility.

![Bayes factors vs p-values](screenshots/Bayesian-ANOVA-in-R-vs-pvalues.webp)
*Figure 2: F-tests give p-values; Bayes factors give direct evidence ratios. The interpretation in BF land is qualitatively different: BF > 3 is "moderate evidence", BF > 10 is "strong evidence", BF > 30 is "very strong".*

[NOTE]
**BayesFactor uses the JZS (Jeffreys-Zellner-Siow) prior by default.** It is a Cauchy prior on standardised effects, with scale parameter `rscaleFixed`. Most published BF results use this default; you can override with `rscaleFixed = "wide"` or `"ultrawide"` for less informative settings.

**Try it:** For the two-way design, compute the BF for the interaction term using brms-style `loo_compare` instead of BayesFactor. You should get a similar decision (interaction not preferred).

```r title="Your turn: brms LOO on the two-way design"
# Fit fit_main <- brm(y ~ factor_A + factor_B, df_two)
# Fit fit_inter <- brm(y ~ factor_A * factor_B, df_two)
# loo_compare(loo(fit_main), loo(fit_inter))
#> Expected: similar decision; interaction barely preferred or not at all
```

<details>
<summary>Click to reveal solution</summary>

```r title="brms LOO solution"
fit_main  <- brms::brm(y ~ factor_A + factor_B, df_two,
                       chains = 4, iter = 2000, seed = 1, silent = 2)
fit_inter <- brms::brm(y ~ factor_A * factor_B, df_two,
                       chains = 4, iter = 2000, seed = 1, silent = 2)
loo_compare(loo(fit_main), loo(fit_inter))
#>             elpd_diff se_diff
#> fit_inter     0.0       0.0
#> fit_main     -0.4       1.4
```

LOO ranks the interaction model first, but only by 0.4 elpd units with se 1.4. The ratio is well below 1 SE; LOO cannot reliably prefer the interaction. This matches the BayesFactor result (interaction-vs-mains BF = 0.77, anecdotal). Different methods, same conclusion.

</details>

## Practice Exercises

### Exercise 1: One-way ANOVA on real data

Use the built-in `iris` dataset. Test whether `Sepal.Length` differs across `Species` using BayesFactor. Report the BF and the posterior medians for each species mean.

```r title="Exercise 1 starter"
# bf_iris <- anovaBF(Sepal.Length ~ Species, data = iris)
# Pull posterior with posterior(bf_iris) and summarise per species
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
bf_iris <- anovaBF(Sepal.Length ~ Species, data = iris)
bf_iris
#> [1] Species : 1.041e+27

post_iris <- posterior(bf_iris, iterations = 10000)
species_cols <- grep("^Species-", colnames(post_iris), value = TRUE)
species_post <- post_iris[, "mu"] + post_iris[, species_cols]
apply(species_post, 2, function(m) {
  c(median = round(median(m), 2),
    q025   = round(quantile(m, 0.025), 2),
    q975   = round(quantile(m, 0.975), 2))
})
#>            Species-setosa Species-versicolor Species-virginica
#> median            5.01              5.94              6.59
#> q025              4.90              5.83              6.48
#> q975              5.13              6.06              6.71
```

BF is essentially infinite (10^27), decisive evidence that species differ in Sepal.Length. Per-species posterior medians are 5.01, 5.94, 6.59, with tight credible intervals because there are 50 observations per species.

</details>

### Exercise 2: Compare two factorial models

Use `mtcars`. Fit a Bayesian ANOVA with `mpg ~ am * cyl`. Compare the interaction model to the main-effects model directly.

```r title="Exercise 2 starter"
# Convert am and cyl to factors
# bf_mt <- anovaBF(mpg ~ am * cyl, data = mtcars2)
# Compare the two models with division
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
mtcars2     <- mtcars
mtcars2$am  <- factor(mtcars2$am)
mtcars2$cyl <- factor(mtcars2$cyl)

bf_mt <- anovaBF(mpg ~ am * cyl, data = mtcars2)
bf_mt
#> [1] am       :  86.71
#> [2] cyl      :  3.57e+11
#> [3] am + cyl :  8.41e+11
#> [4] am + cyl + am:cyl : 4.31e+11

c(
  interaction_vs_main = round(extractBF(bf_mt[4])$bf / extractBF(bf_mt[3])$bf, 3),
  cyl_vs_null         = round(extractBF(bf_mt[2])$bf, 3)
)
#>  interaction_vs_main         cyl_vs_null
#>                0.513     357055117812.000
```

Interaction-vs-mains BF is 0.51 (anecdotal evidence against interaction). The main effect of cyl alone is decisive (BF in the trillions). So the right model is `mpg ~ am + cyl` without interaction.

</details>

### Exercise 3: Repeated measures probability statement

Use the `df_rm` dataset above. Compute the posterior probability that the mid measurement exceeds the pre measurement (a smaller-magnitude difference than post-vs-pre).

```r title="Exercise 3 starter"
# Use bf_rm and posterior(bf_rm)
# Compute time-mid minus time-pre and report the probability
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
post_rm <- posterior(bf_rm, iterations = 10000)
diff_mid_pre <- post_rm[, "time-mid"] - post_rm[, "time-pre"]
c(
  median   = round(median(diff_mid_pre), 2),
  ci       = paste0("[", round(quantile(diff_mid_pre, 0.025), 2),
                    ", ", round(quantile(diff_mid_pre, 0.975), 2), "]"),
  prob_pos = round(mean(diff_mid_pre > 0), 3)
)
#>          median            ci         prob_pos
#>            2.01    [1.18, 2.84]            1.000
```

Posterior median difference is 2.0 with credible interval `[1.2, 2.8]`. Posterior probability that mid exceeds pre is 100%. Even though the difference is small (2 units vs 4 units for post-vs-pre), the within-subject design gives enough power to identify it decisively.

</details>

## Summary

The BayesFactor package gives you Bayesian ANOVA in pure R, with Bayes factors that quantify evidence directly and posterior samples for any group-mean comparison.

| Step | What you do | BayesFactor function |
|---|---|---|
| 1 | Load data, ensure factors are factor() | `factor()` |
| 2 | Run ANOVA | `anovaBF(formula, data)` |
| 3 | Read Bayes factors per model | print bf object |
| 4 | Compare models directly | `bf[i] / bf[j]` |
| 5 | Sample posterior over means | `posterior(bf, iterations = 10000)` |
| 6 | Compute custom contrasts | base R on the posterior matrix |

Use BayesFactor for standard factorial and repeated-measures designs. Use brms for everything else (custom families, hierarchical, non-standard predictors). The two methods generally agree on the same data, with BayesFactor being faster to install and run.

## References

1. Morey, R. D., Rouder, J. N. *BayesFactor: Computation of Bayes Factors for Common Designs*. R package documentation. [richarddmorey.github.io/BayesFactor](https://richarddmorey.github.io/BayesFactor/).
2. Rouder, J. N., Speckman, P. L., Sun, D., Morey, R. D., Iverson, G. "Bayesian t tests for accepting and rejecting the null hypothesis." *Psychonomic Bulletin & Review* 16 (2009). The JZS prior paper.
3. Kass, R. E., Raftery, A. E. "Bayes factors." *Journal of the American Statistical Association* 90 (1995). The interpretation thresholds.
4. Wagenmakers, E.-J. et al. "Bayesian inference for psychology, Part II: Example applications with JASP." *Psychonomic Bulletin & Review* 25 (2018).
5. Jeffreys, H. *Theory of Probability*, 3rd ed. Oxford University Press, 1961. The foundational text on Bayes factors.

## Continue Learning

- [The Bayesian Workflow in R](Bayesian-Workflow-in-R.html), the next post in the curriculum, summarising the full workflow from prior to posterior to predictive checks.
- [Multilevel Models in R](Multilevel-Models-in-R.html), the previous post. brms-based hierarchical/multilevel modelling.
- [brms in R](brms-in-R.html), the alternative tool for ANOVA-style designs when BayesFactor is too restrictive.
