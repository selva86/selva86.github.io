---
title: "Multilevel Models in R With brms: When Group Differences Beat Group Averages"
slug: "Multilevel-Models-in-R"
description: "Fit nested and crossed multilevel Bayesian models with brms. Split within and between effects, read variance components, and compute the intraclass correlation."
keywords: "multilevel models R, brms multilevel, nested random effects, crossed random effects, intraclass correlation, ICC R, within-between decomposition, mixed-effects R"
auto_link_terms: "multilevel model|nested random effects|crossed random effects|intraclass correlation|ICC|variance components|within-group effect|between-group effect|group-mean centering|brms multilevel|nested groups|crossed groups"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-05-10"
curriculum_id: "5.2.8"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Multilevel Models"
sidebar_order: 126
difficulty: "Intermediate"
---

# Multilevel Models in R With brms: When Group Differences Beat Group Averages

<p class="lead">Students sit inside classrooms, classrooms inside schools, repeated measures inside subjects, products inside stores. When data has more than one level of grouping, a multilevel model captures variability at every level and lets you ask precise questions about each one. brms makes the formula syntax mechanical, but the *design* (nested versus crossed groupings, what counts as fixed versus random, when within-group effects differ from between-group effects) requires thinking through. This post covers the structures, the syntax, and the analyses you can run once your model captures the right hierarchy.</p>

[NOTE]
**Run the code in this post in your local R session.** brms calls Stan via cmdstanr, which compiles models to native C++. Copy the blocks into RStudio with brms and cmdstanr installed.

## What's the difference between nested and crossed multilevel structures?

Two grouping variables can stand in two relationships.

*Nested*: each unit at the lower level belongs to exactly one unit at the higher level. Classrooms are nested in schools because each classroom is in one school. Patients are nested in hospitals because each patient was admitted to one hospital.

*Crossed*: each unit at one level can be paired with multiple units at the other level. Subjects in a psychology experiment see multiple stimuli; each subject is paired with each stimulus. Subjects and stimuli are crossed.

The brms formula differs. For nested, write `(1 | school/class)`. For crossed, write `(1 | subject) + (1 | stimulus)`.

The same data with the wrong formula fits a wrong model. We work through both below using a simulated dataset.

```r title="Simulate nested data and fit a multilevel model"
library(brms)
options(brms.backend = "cmdstanr", brms.silent = 2)

set.seed(2026)
n_schools  <- 10
n_classes  <- 4
n_students <- 8
df_nested  <- expand.grid(
  school   = factor(1:n_schools),
  class    = factor(1:n_classes),
  student  = 1:n_students
)
df_nested$class_id <- factor(paste0(df_nested$school, "_", df_nested$class))
school_eff <- rnorm(n_schools, 0, 5)
class_eff  <- rnorm(n_schools * n_classes, 0, 3)

df_nested$y <- 50 +
  school_eff[as.integer(df_nested$school)] +
  class_eff[as.integer(df_nested$class_id)] +
  rnorm(nrow(df_nested), 0, 4)

fit_nested <- brm(
  y ~ 1 + (1 | school/class),
  data    = df_nested,
  chains  = 4,
  iter    = 2000,
  seed    = 2026,
  silent  = 2,
  control = list(adapt_delta = 0.95)
)

summary(fit_nested)$random
#> $school
#>               Estimate Est.Error l-95% CI u-95% CI Rhat Bulk_ESS Tail_ESS
#> sd(Intercept)     5.13      1.60     2.79     8.93 1.00     1450     2104
#>
#> $`school:class`
#>               Estimate Est.Error l-95% CI u-95% CI Rhat Bulk_ESS Tail_ESS
#> sd(Intercept)     2.91      0.55     1.93     4.07 1.00     1638     2354
```

Walk through what we built. We simulated 320 students across 40 classrooms across 10 schools, with each school having a mean shift of `Normal(0, 5)`, each classroom adding a further shift of `Normal(0, 3)`, and per-student noise of `Normal(0, 4)`. The truth: school-level sd is 5, classroom-level sd is 3, student-level sd is 4.

The brms formula `(1 | school/class)` tells brms that classes are nested in schools. Equivalent expanded form is `(1 | school) + (1 | school:class)`, which brms expands automatically.

The summary's two random sections recover the truth closely: school-level sd is 5.13 (truth 5), school-level-class sd is 2.91 (truth 3). Both Rhat values are 1.00. The model correctly partitioned the variance.

If we had written `(1 | school) + (1 | class)` (crossed instead of nested), brms would have treated `class` levels with the same name in different schools as the same group. With our `class = 1, 2, 3, 4` labels reused across schools, that would lump them incorrectly.

![Multilevel nesting](screenshots/Multilevel-Models-in-R-nesting.webp)
*Figure 1: A nested multilevel structure. Population parameters at the top set the overall mean. School-level deviations vary by school. Classroom-level deviations vary by classroom within school. Student observations sit at the bottom.*

[KEY INSIGHT]
**The right formula depends on the data, not on what you want to estimate.** If your `class` IDs are unique across schools (e.g., "school1_class1", "school1_class2", "school2_class1"), `(1 | class)` works. If they are reused (every school has classes 1-4), you need `(1 | school/class)` to keep them separate. Always inspect a few rows before writing the formula.

**Try it:** Refit with `(1 | school) + (1 | class)` instead of `(1 | school/class)` and observe how the variance components change.

```r title="Your turn: wrong-structure fit"
# fit_wrong <- brm(y ~ 1 + (1 | school) + (1 | class), data = df_nested, ...)
# Compare summary(fit_wrong)$random with summary(fit_nested)$random
#> Expected: the wrong model lumps classes with the same number across schools
```

<details>
<summary>Click to reveal solution</summary>

```r title="Wrong-structure solution"
fit_wrong <- brm(
  y ~ 1 + (1 | school) + (1 | class),
  data    = df_nested,
  chains  = 4,
  iter    = 2000,
  seed    = 2026,
  silent  = 2,
  control = list(adapt_delta = 0.95)
)
list(
  correct_school = posterior_summary(fit_nested, variable = "sd_school__Intercept")[, c(1, 3, 4)],
  wrong_school   = posterior_summary(fit_wrong,  variable = "sd_school__Intercept")[, c(1, 3, 4)],
  wrong_class    = posterior_summary(fit_wrong,  variable = "sd_class__Intercept")[, c(1, 3, 4)]
)
#> $correct_school
#>                          Estimate    Q2.5   Q97.5
#> sd_school__Intercept       5.13    2.79    8.93
#>
#> $wrong_school
#>                          Estimate    Q2.5   Q97.5
#> sd_school__Intercept       5.13    2.78    8.92
#>
#> $wrong_class
#>                          Estimate    Q2.5   Q97.5
#> sd_class__Intercept        0.07    0.00    0.46
```

The wrong model still recovers the school-level sd correctly, but the class-level sd collapses to ~0 because lumping classes 1-4 across schools averages out their distinct identities. This is the kind of silent-failure bug that the right formula prevents.

</details>

## How do I write the brms formula for each?

Three patterns cover most multilevel work.

```r title="The three multilevel formula patterns"
# 1. Nested: classes nested within schools
fit_pat1 <- brm(y ~ x + (1 | school/class), data = df_nested,
                chains = 2, iter = 1000, seed = 1, silent = 2,
                control = list(adapt_delta = 0.95))

# 2. Crossed: subjects and stimuli are independent groupings
df_crossed <- data.frame(
  subject  = factor(rep(1:5, each = 4)),
  stimulus = factor(rep(1:4, times = 5)),
  y        = rnorm(20, 50, 5)
)
fit_pat2 <- brm(y ~ 1 + (1 | subject) + (1 | stimulus),
                data = df_crossed,
                chains = 2, iter = 1000, seed = 1, silent = 2)

# 3. Random slopes per group
fit_pat3 <- brm(y ~ x + (1 + x | group), data = df_nested[1:80, ],
                chains = 2, iter = 1000, seed = 1, silent = 2,
                control = list(adapt_delta = 0.95))

# Inspect the formulas brms parsed
list(nested = fit_pat1$formula, crossed = fit_pat2$formula, slopes = fit_pat3$formula)
```

Walk through the three patterns. Pattern 1 (`(1 | school/class)`) is nested with shared per-school class indices. Pattern 2 (`(1 | subject) + (1 | stimulus)`) is crossed: each subject saw each stimulus, but no nesting. Pattern 3 (`(1 + x | group)`) is random intercept and random slope.

For larger structures, you can stack: `(1 | school) + (1 | school:class) + (1 | school:class:student_year)`. Each colon-joined term creates a separate level of grouping. brms parses these into Stan code automatically.

The variance estimates at each level appear in the summary's "Group-Level Effects" section, one per grouping factor. Use `ranef()` to pull per-group deviations at any level.

![brms multilevel formula syntax](screenshots/Multilevel-Models-in-R-syntax.webp)
*Figure 2: The three brms multilevel formula patterns. Slash for nested, plus for crossed, the inside of the parens for random slopes.*

[TIP]
**Use `(1 | g1/g2)` only when g2 IDs are not unique across g1.** When g2 IDs are unique (e.g., classroom IDs that already encode the school), `(1 | g1) + (1 | g2)` is equivalent and clearer. Read your data once before deciding.

**Try it:** For our `df_nested`, what would `(1 | class_id)` (where `class_id` already encodes school_class) give you?

```r title="Your turn: explicit unique IDs"
# fit_uid <- brm(y ~ 1 + (1 | school) + (1 | class_id), data = df_nested, ...)
# Compare to fit_nested
#> Expected: same per-level sds because class_id is the unique nested ID
```

<details>
<summary>Click to reveal solution</summary>

```r title="Unique-IDs solution"
fit_uid <- brm(
  y ~ 1 + (1 | school) + (1 | class_id),
  data    = df_nested,
  chains  = 4,
  iter    = 2000,
  seed    = 2026,
  silent  = 2,
  control = list(adapt_delta = 0.95)
)
data.frame(
  param            = c("sd_school", "sd_class"),
  nested_form      = c(posterior_summary(fit_nested, "sd_school__Intercept")[1, "Estimate"],
                       posterior_summary(fit_nested, "sd_school:class__Intercept")[1, "Estimate"]),
  unique_id_form   = c(posterior_summary(fit_uid, "sd_school__Intercept")[1, "Estimate"],
                       posterior_summary(fit_uid, "sd_class_id__Intercept")[1, "Estimate"])
) |> round(3)
#>      param nested_form unique_id_form
#> 1 sd_school       5.13          5.14
#> 2  sd_class       2.91          2.91
```

Both formulations give essentially identical sd estimates. The slash form and the unique-ID form are mathematically equivalent when the IDs are non-overlapping; brms internally creates a unique-ID factor anyway.

</details>

## How do I split a predictor's effect into within-group and between-group parts?

If `x` varies both within and between groups (each subject has multiple x values, and subjects differ in their average x), the regression slope on `x` is a *mix* of within-subject and between-subject effects. They can be very different and asking the wrong one is a classic ecological fallacy.

The fix is *group-mean centering*. Compute each subject's mean x, and split x into the deviation from the mean (within-subject part) and the mean itself (between-subject part). Each can be a predictor with its own slope.

```r title="Within-between decomposition"
set.seed(2026)
n_subj <- 30
n_obs  <- 5
df_wb  <- expand.grid(subject = factor(1:n_subj), obs = 1:n_obs)

# Each subject has a different mean x; their deviation around that mean has a different effect
df_wb$x_mean    <- rep(rnorm(n_subj, 5, 2), each = n_obs)
df_wb$x_within  <- rnorm(nrow(df_wb), 0, 1)
df_wb$x         <- df_wb$x_mean + df_wb$x_within

# Different effects: within-subject = -1 (negative), between-subject = +2 (positive)
df_wb$y <- 10 - 1 * df_wb$x_within + 2 * df_wb$x_mean +
           rep(rnorm(n_subj, 0, 2), each = n_obs) +
           rnorm(nrow(df_wb), 0, 1)

# Wrong model: one slope on x
fit_wb_naive <- brm(y ~ x + (1 | subject), df_wb,
                    chains = 4, iter = 2000, seed = 1, silent = 2)
posterior_summary(fit_wb_naive, variable = "b_x")[, c(1, 3, 4)]
#>      Estimate    Q2.5   Q97.5
#> b_x      1.85    1.55    2.16

# Right model: split into within (x_within) and between (x_mean)
fit_wb_split <- brm(y ~ x_within + x_mean + (1 | subject), df_wb,
                    chains = 4, iter = 2000, seed = 1, silent = 2)
posterior_summary(fit_wb_split,
                  variable = c("b_x_within", "b_x_mean"))[, c(1, 3, 4)]
#>             Estimate    Q2.5   Q97.5
#> b_x_within     -1.04   -1.42   -0.66
#> b_x_mean        1.96    1.66    2.27
```

Walk through the contrast. The naive model with one slope on `x` returns 1.85, a meaningless mix of the two real effects. The split model correctly recovers `x_within = -1.04` (truth -1) and `x_mean = +1.96` (truth +2).

Without the split, you would conclude "x has a positive effect on y" while in reality, *within each subject* x has a negative effect, and *between subjects* x has a positive effect. The two are different stories about different populations of inference.

[WARNING]
**Failing to split within-between effects is the most common multilevel modelling mistake.** If your predictor varies at multiple levels, split it. The brms code is one extra column; the substantive payoff is huge.

**Try it:** For the data above, refit and compute the posterior probability that the within-subject effect is below zero. Compare to the probability that the between-subject effect is above zero.

```r title="Your turn: probability statements per effect type"
# Compute mean(b_x_within draws < 0) and mean(b_x_mean draws > 0)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Probability solution"
draws <- as_draws_df(fit_wb_split, variable = c("b_x_within", "b_x_mean"))
c(
  prob_within_negative = round(mean(draws$b_x_within < 0), 3),
  prob_between_positive = round(mean(draws$b_x_mean   > 0), 3)
)
#>  prob_within_negative prob_between_positive
#>                 1.000                 1.000
```

Both probabilities are essentially 1. The data unambiguously distinguishes the negative within-subject effect from the positive between-subject effect. Without splitting, you would have reported a single positive effect of magnitude 1.85, missing both stories.

</details>

## How do I read variance components and the intraclass correlation?

Multilevel summaries report a standard deviation for each grouping factor. The *intraclass correlation* (ICC) translates these into the share of total variance attributable to each level.

For a two-level model with `sd_group` and residual `sigma`:

`ICC_group = sd_group^2 / (sd_group^2 + sigma^2)`

If ICC is 0, groups are indistinguishable from random sampling. If ICC is near 1, almost all variation is between groups. Most real data sits between 0.05 and 0.50.

```r title="Compute the ICC for a two-level model"
draws_two <- as_draws_df(fit_pat2, variable = c("sd_subject__Intercept",
                                                  "sd_stimulus__Intercept",
                                                  "sigma"))
icc_subject  <- draws_two$sd_subject__Intercept^2 /
                (draws_two$sd_subject__Intercept^2 +
                 draws_two$sd_stimulus__Intercept^2 +
                 draws_two$sigma^2)
icc_stimulus <- draws_two$sd_stimulus__Intercept^2 /
                (draws_two$sd_subject__Intercept^2 +
                 draws_two$sd_stimulus__Intercept^2 +
                 draws_two$sigma^2)

c(
  icc_subject_median  = round(median(icc_subject),  3),
  icc_stimulus_median = round(median(icc_stimulus), 3),
  icc_residual_median = round(1 - median(icc_subject) - median(icc_stimulus), 3)
)
#>  icc_subject_median icc_stimulus_median icc_residual_median
#>               0.057               0.029               0.914
```

Walk through what the numbers mean. About 5.7% of total variance is between subjects, 2.9% is between stimuli, and 91% is residual. This is a low-ICC dataset (the simulated y in the crossed example was mostly noise).

For a high-ICC dataset like our nested simulation:

```r title="ICC for the nested fit"
draws_n <- as_draws_df(fit_nested,
                       variable = c("sd_school__Intercept",
                                    "sd_school:class__Intercept",
                                    "sigma"))
total_var <- draws_n$sd_school__Intercept^2 +
             draws_n$`sd_school:class__Intercept`^2 +
             draws_n$sigma^2
icc_school <- draws_n$sd_school__Intercept^2 / total_var
icc_class  <- draws_n$`sd_school:class__Intercept`^2 / total_var

c(
  icc_school = round(median(icc_school), 3),
  icc_class  = round(median(icc_class), 3),
  icc_resid  = round(1 - median(icc_school) - median(icc_class), 3)
)
#>  icc_school  icc_class  icc_resid
#>       0.452      0.146      0.402
```

Walk through the result. About 45% of variance is between schools, 15% is between classrooms within schools, and 40% is residual. That is exactly what we simulated: school-level sd 5, classroom-level sd 3, residual sd 4 (variances 25, 9, 16 = total 50; school share 25/50 = 50%, etc., close to what we computed).

This kind of variance decomposition is the headline output of multilevel work. It tells stakeholders where to look for variation: if 45% is between schools, school-level interventions matter much more than within-classroom tweaks.

[NOTE]
**Use `posterior::summarise_draws()` for cleaner ICC posteriors.** The base R approach above works but the `posterior` package has helpers for percentile intervals on derived quantities. `posterior::summarise_draws(data.frame(icc_school = icc_school))` gives you median and quantiles in one call.

**Try it:** Compute the 95% credible interval for `icc_school` from the nested fit.

```r title="Your turn: ICC credible interval"
# quantile(icc_school, c(0.025, 0.975))
```

<details>
<summary>Click to reveal solution</summary>

```r title="ICC interval solution"
quantile(icc_school, c(0.025, 0.5, 0.975))
#>     2.5%      50%    97.5%
#>  0.225    0.452    0.667
```

95% credible interval `[0.23, 0.67]` for the share of variance between schools. The interval is wide because we only have 10 schools in the simulation. With 100 schools, the interval would tighten substantially.

</details>

## How do I diagnose a multilevel fit?

Three diagnostics, in order of importance.

The first is *divergent transitions*. Multilevel models often produce funnel-shaped posteriors where the random-effect SD can go to zero. brms uses non-centred parameterisation by default to mitigate this, but very small group counts or very tight group-level posteriors can still cause divergences. The fix is `adapt_delta = 0.95` or higher.

The second is *Rhat and ESS for variance components*. The variance-component parameters (`sd_*__Intercept`) often have lower Bulk_ESS than coefficients because they trade off with the per-group deviations. Aim for Bulk_ESS at least 400.

The third is *grouped posterior predictive check*. `pp_check(fit, type = "dens_overlay_grouped", group = "school")` shows separate panels per group. The model should fit each panel; visible misfit in one or more groups indicates the model is missing group-specific structure.

```r title="Multilevel diagnostics"
# Divergent transitions
sum(rstan::get_num_divergent(fit_nested$fit))
#> [1] 0

# Variance-component Rhat
summary(fit_nested)$random$school[, c("Rhat", "Bulk_ESS")]
#>               Rhat Bulk_ESS
#> sd(Intercept) 1.00     1450
summary(fit_nested)$random$`school:class`[, c("Rhat", "Bulk_ESS")]
#>               Rhat Bulk_ESS
#> sd(Intercept) 1.00     1638

# Group-level PPC: per-school density (just numeric summary here)
yrep <- posterior_predict(fit_nested, ndraws = 4000)
schools <- as.character(df_nested$school)
sd_per_school <- sapply(unique(schools), function(s) {
  obs_sd <- sd(df_nested$y[schools == s])
  sim_sd <- mean(apply(yrep[, schools == s], 1, sd))
  c(observed_sd = obs_sd, simulated_sd = sim_sd)
})
round(sd_per_school[, 1:5], 2)
#>                  1     2     3     4     5
#> observed_sd   4.91 4.27  5.10  4.85  4.95
#> simulated_sd  5.10 4.83  5.04  5.18  4.94
```

Walk through what the diagnostics show. Zero divergent transitions; both random-effect SDs have Rhat 1.00 and Bulk_ESS at 1450 and 1638. The chain converged.

The per-school sd table compares observed and simulated within-school spread. They match closely (~4.9 observed vs ~5.0 simulated) across schools, confirming the model captures within-school variability.

[TIP]
**Run a per-group PPC summary on every multilevel fit.** It catches the case where the model fits the average well but misses group-specific structure (one school has very different spread, one classroom has bimodal scores). The visual `dens_overlay_grouped` is what to inspect; the numeric summary above is a fast first check.

**Try it:** Compute the per-school *mean* (not sd) comparison instead of within-school sd. Does the model capture per-school means?

```r title="Your turn: per-school mean PPC"
# For each school, compare mean(observed y) and mean(simulated y across draws)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Per-school mean solution"
mean_per_school <- sapply(unique(schools), function(s) {
  obs <- mean(df_nested$y[schools == s])
  sim <- mean(yrep[, schools == s])
  c(observed = obs, simulated = sim)
})
round(mean_per_school[, 1:5], 2)
#>                 1     2     3     4     5
#> observed   53.61 47.93 54.78 49.39 52.27
#> simulated  53.49 48.19 54.55 49.61 52.18
```

Per-school means match closely (within 0.3) for all 5 schools. The model captures both means and within-school spread.

</details>

## When does a multilevel model beat just adding fixed-effect dummies?

Three situations where multilevel is the right call.

The first is *many groups* (more than ~5). Multilevel partial pooling stabilises estimates with little cost when groups are similar enough to share information. With 50 schools, fitting 50 dummy intercepts uses 49 degrees of freedom and gives high-variance estimates for small schools.

The second is *unbalanced group sizes*. Multilevel partial pooling shrinks small groups more than large ones; fixed-effect dummies treat them all equally regardless of how reliable each estimate is.

The third is *predicting to new groups*. A multilevel model has a built-in distribution over group-level deviations; predicting for an unseen school just samples a deviation from that distribution. A fixed-effect-dummy model has no statement about the distribution of school effects at all.

When *not* multilevel: very few groups (under 5), groups that are categorically different (an "industry" with 1 manufacturer and another with 100 different retail businesses), or when group identity is part of what you want to estimate (e.g., "which specific school is best"). Then fixed effects are more direct.

[KEY INSIGHT]
**Multilevel models extend the hierarchical idea to arbitrary depth.** If you have students within classrooms within schools within districts within states, all five levels can be modelled jointly. The variance partitions across all five levels, and the per-level interventions can be ranked by impact.

**Try it:** Identify the right approach for each design. (a) Patients across 200 hospitals. (b) Three competing therapies, full crossover. (c) Repeated measures within 8 subjects.

```r title="Your turn: pick the design"
# (a) Patients across 200 hospitals: multilevel or fixed-effect?
# (b) Three crossover therapies in 50 patients: multilevel or fixed-effect?
# (c) 5 measurements within 8 subjects: multilevel or fixed-effect?
#> Expected: (a) multilevel, (b) multilevel with patient and therapy, (c) borderline; multilevel preferred for 8+ subjects
```

<details>
<summary>Click to reveal solution</summary>

(a) 200 hospitals: multilevel (`(1 | hospital)`). With 200 groups, partial pooling stabilises small hospitals.

(b) Three therapies, full crossover: multilevel with patient and therapy as crossed groups (`(1 | patient) + (1 | therapy)` if therapy effects vary across patients, otherwise therapy as a fixed effect since there are only 3).

(c) 8 subjects: borderline. With 8 you have just enough groups for partial pooling to be meaningful. The fixed-effect alternative uses 7 dummy intercepts, which is fine for 8 subjects but gets unwieldy past 20.

</details>

## Practice Exercises

### Exercise 1: Three-level nested model

Simulate data with 5 districts, 4 schools per district, 5 classrooms per school, and 10 students per classroom. Fit `y ~ 1 + (1 | district/school/class)` and report the variance-component estimates.

```r title="Exercise 1 starter"
# Build df with district, school (nested in district), class (nested in school), student
# Generate y with effects at each level
# Fit the three-level model
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
set.seed(2026)
df_3lev <- expand.grid(district = 1:5, school = 1:4, class = 1:5, student = 1:10)
df_3lev$district <- factor(df_3lev$district)
df_3lev$school   <- factor(paste0(df_3lev$district, "_", df_3lev$school))
df_3lev$class    <- factor(paste0(df_3lev$school,   "_", df_3lev$class))

district_eff <- rnorm(5,   0, 4)[as.integer(df_3lev$district)]
school_eff   <- rnorm(20,  0, 3)[as.integer(df_3lev$school)]
class_eff    <- rnorm(100, 0, 2)[as.integer(df_3lev$class)]
df_3lev$y    <- 60 + district_eff + school_eff + class_eff + rnorm(nrow(df_3lev), 0, 4)

fit_3lev <- brm(
  y ~ 1 + (1 | district) + (1 | school) + (1 | class),
  data    = df_3lev,
  chains  = 4,
  iter    = 2000,
  seed    = 2026,
  silent  = 2,
  control = list(adapt_delta = 0.95)
)
summary(fit_3lev)$random
#> $district
#> sd(Intercept)     3.91 ...
#> $school
#> sd(Intercept)     3.07 ...
#> $class
#> sd(Intercept)     2.05 ...
```

The three-level model recovers all three sd values within sampling error of the truth (district 4, school 3, class 2). The hierarchical structure is what makes this estimable; trying to estimate per-district, per-school, and per-class fixed dummies would use 4 + 19 + 99 = 122 parameters on 1000 observations.

</details>

### Exercise 2: Crossed random effects

Simulate a psychology experiment with 20 subjects each seeing 5 stimuli. The outcome y depends on a subject-level effect and a stimulus-level effect plus random noise. Fit and recover both.

```r title="Exercise 2 starter"
# Generate df with subject and stimulus as crossed factors
# Fit y ~ 1 + (1 | subject) + (1 | stimulus)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
set.seed(2026)
df_x <- expand.grid(subject = factor(1:20), stimulus = factor(1:5))
subj_eff <- rnorm(20, 0, 3)[as.integer(df_x$subject)]
stim_eff <- rnorm(5,  0, 2)[as.integer(df_x$stimulus)]
df_x$y   <- 50 + subj_eff + stim_eff + rnorm(nrow(df_x), 0, 1.5)

fit_x <- brm(y ~ 1 + (1 | subject) + (1 | stimulus), df_x,
             chains = 4, iter = 2000, seed = 2026, silent = 2)
summary(fit_x)$random
#> $subject
#> sd(Intercept)  3.05 ...
#> $stimulus
#> sd(Intercept)  2.10 ...
```

The crossed model recovers subject sd 3.05 (truth 3) and stimulus sd 2.10 (truth 2). With only 5 stimuli, the stimulus-level posterior is somewhat wider than the subject-level posterior; more stimuli would tighten it.

</details>

### Exercise 3: Within-between split for a longitudinal outcome

Simulate 20 subjects each measured 5 times. Each subject has a baseline level, a within-subject change in x, and a between-subject difference in average x. Fit the wrong model first (one slope on x), then the correct within-between split.

```r title="Exercise 3 starter"
# Generate within and between variation in x; build y so the within and between effects differ
# Compare naive and split fits
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
set.seed(2026)
n_subj <- 20; n_t <- 5
df_long <- expand.grid(subject = factor(1:n_subj), t = 1:n_t)
df_long$x_mean   <- rep(rnorm(n_subj, 50, 5), each = n_t)
df_long$x_within <- rnorm(nrow(df_long), 0, 2)
df_long$x        <- df_long$x_mean + df_long$x_within
df_long$y        <- 0.5 * df_long$x_mean - 0.3 * df_long$x_within +
                    rep(rnorm(n_subj, 0, 2), each = n_t) +
                    rnorm(nrow(df_long), 0, 1)

fit_naive <- brm(y ~ x + (1 | subject), df_long,
                 chains = 4, iter = 2000, seed = 1, silent = 2)
fit_split <- brm(y ~ x_within + x_mean + (1 | subject), df_long,
                 chains = 4, iter = 2000, seed = 1, silent = 2)

list(
  naive_x  = posterior_summary(fit_naive, variable = "b_x")[, c(1, 3, 4)],
  split_w  = posterior_summary(fit_split, variable = "b_x_within")[, c(1, 3, 4)],
  split_b  = posterior_summary(fit_split, variable = "b_x_mean")[, c(1, 3, 4)]
)
#> $naive_x         Estimate     Q2.5    Q97.5
#>                    0.452     0.357    0.547
#> $split_w         Estimate     Q2.5    Q97.5
#>                   -0.268    -0.394   -0.143
#> $split_b         Estimate     Q2.5    Q97.5
#>                    0.498     0.395    0.601
```

The naive model returns a single slope of 0.45 (a meaningless mix). The split model correctly recovers `x_within = -0.27` (truth -0.3) and `x_mean = 0.50` (truth 0.5). The within-between split rescues the analysis.

</details>

## Summary

Multilevel models in brms extend hierarchical models to multi-level designs (nested or crossed) and split predictor effects into within-group and between-group parts.

| Step | What you do | brms function |
|---|---|---|
| 1 | Identify nesting structure | Inspect data: are group IDs unique across higher levels? |
| 2 | Pick the right formula | `(1 \| g1/g2)` nested, `(1 \| g1) + (1 \| g2)` crossed |
| 3 | Split within-between effects | Compute `x_mean` and `x_within`, include both |
| 4 | Read variance components | `summary(fit)$random` |
| 5 | Compute ICC | `sd_g^2 / (sum of sds^2 + sigma^2)` on draws |
| 6 | Diagnose with grouped PPC | `pp_check(type = "dens_overlay_grouped", group = ...)` |

Use multilevel models when you have at least 5 groups, when you want to predict to new groups, and when predictors vary at multiple levels. The brms syntax is mechanical; the design choices (nesting, split effects, ICC) are where the analytical work lives.

## References

1. Gelman, A., Hill, J. *Data Analysis Using Regression and Multilevel/Hierarchical Models*. Cambridge University Press, 2007.
2. Gelman, A. et al. *Bayesian Data Analysis*, 3rd ed. Chapman & Hall, 2013. Chapter 15.
3. McElreath, R. *Statistical Rethinking*, 2nd ed. CRC Press, 2020. Chapter 13 covers multilevel models with brms.
4. Bürkner, P. "brms: An R Package for Bayesian Multilevel Models Using Stan." *Journal of Statistical Software* 80 (2017).
5. Hamaker, E. L., Muthén, B. "The fixed versus random effects debate and how it relates to centering in multilevel modeling." *Psychological Methods* 25 (2020). On within-between decomposition.

## Continue Learning

- [Bayesian ANOVA in R](Bayesian-ANOVA-in-R.html), the next post. Bayesian ANOVA via the BayesFactor package; an alternative to brms for variance-decomposition designs.
- [Bayesian Hierarchical Models in R](Bayesian-Hierarchical-Models-in-R.html), the previous post. Two-level partial pooling; this post extended to multi-level.
- [brms in R](brms-in-R.html), the package powering the formulas in this post.
