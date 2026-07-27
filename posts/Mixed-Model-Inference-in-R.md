---
title: "Mixed Model Inference in R: p-Values and Bootstrap"
slug: "Mixed-Model-Inference-in-R"
description: "Mixed models in R skip p-values by default. Get honest inference with likelihood ratio tests, Satterthwaite and Kenward-Roger df, and the parametric bootstrap."
keywords: "mixed model inference in R, lme4 p-values, lmerTest, Satterthwaite approximation, Kenward-Roger, parametric bootstrap mixed model, likelihood ratio test, bootMer, confint lme4"
auto_link_terms: "mixed model inference|mixed model p-values|p-values for mixed models|lmerTest|Satterthwaite approximation|Kenward-Roger|parametric bootstrap for mixed models|bootMer|likelihood ratio test for mixed models|PBmodcomp|confidence intervals for mixed models|random effects significance"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-07-27"
curriculum_id: "ST2-11.4"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Mixed Model Inference"
sidebar_order: "157"
difficulty: "Advanced"
---

<p class="lead">Fit a mixed model with lme4 and you get estimates, standard errors, and t-values, but no p-value column. That is deliberate. This tutorial walks through every honest way to test a fixed effect in R: the t-as-z shortcut, the likelihood ratio test, the Satterthwaite and Kenward-Roger degrees-of-freedom methods, and the parametric bootstrap, all with runnable code and real output.</p>

We use the built-in `sleepstudy` data throughout, and base our work on a model you may already know how to fit. If the fitting step is new to you, read [Random Intercepts and Slopes with lme4](Random-Intercepts-and-Slopes-in-R.html) first, then come back here for the inference.

## Why does lme4 leave the p-value column blank?

Here is the situation that sends most people searching for answers. You fit a mixed model, ask for the summary, and the fixed-effects table has a `t value` column but no p-value next to it. Let's reproduce that with the classic `sleepstudy` experiment, where 18 subjects had their reaction time measured over 10 days of sleep restriction.

The model below says reaction time changes with `Days`, and it lets each subject have their own baseline and their own rate of slowing down. That per-subject wiggle room is the random-effects part, written `(Days | Subject)`.

```r title="Fit a mixed model and inspect the fixed effects"
library(lme4)
data(sleepstudy)
fm <- lmer(Reaction ~ Days + (Days | Subject), data = sleepstudy)
round(coef(summary(fm)), 3)
#>             Estimate Std. Error t value
#> (Intercept)  251.405      6.825  36.838
#> Days          10.467      1.546   6.771
```

Read that table one column at a time. `Estimate` says reaction time starts near 251 ms and rises about 10.5 ms for each extra day of sleep loss. `Std. Error` is the uncertainty in each estimate. `t value` is just the estimate divided by its standard error, so 10.467 / 1.546 gives 6.771. What is missing is the final column you get from `lm()`: the p-value.

This is not a bug. To turn a t-value into a p-value you need a reference distribution, and that distribution needs a "denominator degrees of freedom" number that says how much independent information the data really carry. In an ordinary regression that number is simple. In a mixed model the observations are not independent (measurements from the same subject are correlated), so the effective degrees of freedom sit somewhere between "number of subjects" and "number of rows", and there is no exact formula for where.

[KEY INSIGHT]
**The blank p-value column is honesty, not laziness.** The author of lme4 left it out because any single p-value would rely on a degrees-of-freedom guess that can be wrong, sometimes badly wrong, for small studies. The rest of this tutorial is really a tour of the different ways to make that guess defensible.

**Try it:** Pull just the `Days` row out of the fixed-effects table, keeping only its estimate and standard error.

```r title="Your turn: extract the Days row"
# The fixed-effects table is coef(summary(fm)).
# Index it by the row name "Days" and the two columns you want.
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Extract the Days row solution"
round(coef(summary(fm))["Days", c("Estimate", "Std. Error")], 3)
#>   Estimate Std. Error 
#>     10.467      1.546 
```

**Explanation:** `coef(summary(fm))` returns a plain matrix, so you can index it with `["Days", c("Estimate", "Std. Error")]` exactly like any other matrix.

</details>

## Can you read significance straight off the t-value?

Yes, roughly, and this is the fastest sanity check you can do. When a study has plenty of data, the t-value behaves almost like a z-value from a standard normal curve. A z of about 2 marks the 5% two-sided cutoff, so the rule of thumb is simple: if the absolute t-value is bigger than 2, the effect is probably significant at the 0.05 level.

Our `Days` t-value is 6.771, which is far past 2, so we already expect a tiny p-value. Let's make that concrete by treating the t-value as a z-value and reading the two-sided tail probability off the normal curve.

```r title="Approximate a p-value from the t statistic"
t_days <- coef(summary(fm))["Days", "t value"]
p_approx <- 2 * pnorm(abs(t_days), lower.tail = FALSE)
c(t_value = round(t_days, 3), p_approx = signif(p_approx, 3))
#>   t_value  p_approx 
#> 6.771e+00 1.270e-11 
```

`pnorm(abs(t_days), lower.tail = FALSE)` gives the probability of seeing a z at least this large in one tail, and doubling it covers both tails. The result, about 1.3e-11, is the "t-as-z" or Wald p-value. It says that if `Days` truly had no effect, a t-value this extreme would be almost impossible.

That answer is fine here because the effect is huge. The danger shows up when a t-value sits near the 2 boundary and the study has only a handful of groups.

[WARNING]
**The t-as-z shortcut is anti-conservative with few groups.** Treating t as z pretends you have infinite degrees of freedom, so it gives p-values that are too small when you have, say, 8 or 12 subjects. Near the borderline it can call a null effect significant. Use it as a quick gut-check, not as the number you report.

**Try it:** Apply the rule of thumb directly. Write one line that returns `TRUE` when the `Days` effect clears the "absolute t greater than 2" bar.

```r title="Your turn: apply the |t| > 2 rule"
# Grab the Days t value from coef(summary(fm)) and compare its
# absolute value against 2.
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="The |t| > 2 rule solution"
abs(coef(summary(fm))["Days", "t value"]) > 2
#> [1] TRUE
```

**Explanation:** `abs()` strips the sign so the test works for negative effects too, and the comparison returns a single `TRUE` or `FALSE`.

</details>

## How do you get a real p-value with a likelihood ratio test?

The likelihood ratio test (LRT) gives you a p-value without ever needing to know the degrees of freedom of a t distribution. The idea is to compare two models: the full model that includes `Days`, and a null model that drops it. If dropping `Days` barely hurts the fit, the effect was not doing much. If it hurts a lot, `Days` matters.

"How well a model fits" is measured by its log-likelihood, and twice the gap in log-likelihood follows a known chi-squared curve:

$$D = 2\left(\ell_{\text{full}} - \ell_{\text{null}}\right) \sim \chi^2_{k}$$

Where:
- $\ell_{\text{full}}$ and $\ell_{\text{null}}$ are the maximized log-likelihoods of the two models
- $k$ is the number of parameters you removed (here, 1: the `Days` slope)
- $D$ is the deviance difference, which the chi-squared curve turns into a p-value

There is one setup rule. For testing a fixed effect this way, both models must be fit by plain maximum likelihood, not the default REML (restricted maximum likelihood), so we pass `REML = FALSE`. Then `anova()` does the comparison.

```r title="Likelihood ratio test for the Days effect"
fm_ml   <- lmer(Reaction ~ Days + (Days | Subject), data = sleepstudy, REML = FALSE)
null_ml <- lmer(Reaction ~ 1    + (Days | Subject), data = sleepstudy, REML = FALSE)
anova(null_ml, fm_ml)
#> Data: sleepstudy
#> Models:
#> null_ml: Reaction ~ 1 + (Days | Subject)
#> fm_ml: Reaction ~ Days + (Days | Subject)
#>         npar    AIC    BIC  logLik -2*log(L)  Chisq Df Pr(>Chisq)    
#> null_ml    5 1785.5 1801.4 -887.74    1775.5                         
#> fm_ml      6 1763.9 1783.1 -875.97    1751.9 23.537  1  1.226e-06 ***
```

The `Chisq` value of 23.537 is the deviance difference $D$, `Df` is 1 because we removed one parameter, and `Pr(>Chisq)` of 1.2e-06 is your p-value. Adding `Days` improves the fit far more than chance would allow, so the slope is real.

[TIP]
**Always refit with REML = FALSE before an LRT of fixed effects.** REML-based likelihoods are not comparable across models with different fixed effects, so an LRT on REML fits is invalid. If you forget, recent lme4 versions quietly refit for you, but doing it yourself keeps the logic visible.

The LRT is trustworthy for fixed effects when your sample is not tiny. It is less reliable for testing whether a variance component is zero, because that hypothesis sits on the boundary of what is possible (a variance cannot go below zero), which makes the naive chi-squared p-value too large. We return to that boundary problem in the exercises.

**Try it:** You do not have to read the p-value off the printed table by eye. Pull it out of the `anova()` result directly.

```r title="Your turn: extract the LRT p-value"
# anova(null_ml, fm_ml) returns a data frame with a column
# named "Pr(>Chisq)". The comparison p-value is its 2nd entry.
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Extract the LRT p-value solution"
signif(anova(null_ml, fm_ml)[["Pr(>Chisq)"]][2], 3)
#> [1] 1.23e-06
```

**Explanation:** The first row of the table is the null model (no test), so the p-value lives in the second row of the `Pr(>Chisq)` column.

</details>

## How do you get p-values with Satterthwaite and Kenward-Roger degrees of freedom?

The likelihood ratio test sidesteps degrees of freedom, but many fields still want the familiar per-coefficient p-value in the summary table. Two methods estimate the missing denominator degrees of freedom so a t-test or F-test becomes possible: the Satterthwaite approximation and the Kenward-Roger approximation. Both try to answer "how much independent information does this effect really rest on?" with a fractional degrees-of-freedom number.

The `lmerTest` package adds these p-values to `lmer` output automatically, and the `pbkrtest` package supplies the Kenward-Roger machinery. These two packages are not part of the in-browser code sandbox, so run the blocks in this section in your own R or RStudio session. The output shown is the real result from R 4.6.0.

```r-static title="Satterthwaite p-values with lmerTest"
library(lmerTest)
fm_lt <- lmer(Reaction ~ Days + (Days | Subject), data = sleepstudy)
anova(fm_lt)
#> Type III Analysis of Variance Table with Satterthwaite's method
#>      Sum Sq Mean Sq NumDF DenDF F value    Pr(>F)    
#> Days  30031   30031     1    17  45.853 3.264e-06 ***
```

Loading `lmerTest` and refitting gives an ANOVA table with a real p-value of 3.3e-06 for `Days`. The key number is `DenDF`, the estimated denominator degrees of freedom: 17, which is close to "18 subjects minus 1". That matches intuition, because the `Days` effect is learned mostly from how the 18 subjects differ, not from all 180 rows.

You can also see the per-coefficient version, which now carries a `df` and a `Pr(>|t|)` column that plain lme4 refused to print.

```r-static title="Per-coefficient Satterthwaite table"
summary(fm_lt)$coefficients
#>             Estimate Std. Error       df   t value     Pr(>|t|)
#> (Intercept) 251.40510   6.824597 16.99973 36.838090 1.171558e-17
#> Days         10.46729   1.545790 16.99998  6.771481 3.263824e-06
```

The Kenward-Roger method is a more refined cousin that also adjusts the standard errors, and it is the safest choice for small samples. You request it by name.

```r-static title="Kenward-Roger p-values"
anova(fm_lt, ddf = "Kenward-Roger")
#> Type III Analysis of Variance Table with Kenward-Roger's method
#>      Sum Sq Mean Sq NumDF DenDF F value    Pr(>F)    
#> Days  30031   30031     1    17  45.853 3.264e-06 ***
```

For this balanced, well-behaved dataset Satterthwaite and Kenward-Roger agree exactly (both land on 17 degrees of freedom). They diverge on smaller or messier designs, where Kenward-Roger's extra correction tends to hold the false-positive rate closest to the advertised 5%.

[NOTE]
**Satterthwaite and Kenward-Roger are the default recommendation for linear mixed models.** Simulation studies find both keep Type I error near 5% even with few groups, which is exactly where the t-as-z shortcut fails. Reach for the likelihood ratio test or the bootstrap when the degrees-of-freedom methods do not apply, such as for generalized (non-Gaussian) mixed models.

**Try it:** The p-value above is just a t-test with a chosen degrees-of-freedom value. Reproduce the Satterthwaite p-value yourself using base R, the `Days` t-value of 6.7715, and the estimated 17 degrees of freedom.

```r title="Your turn: rebuild the Satterthwaite p-value"
# Use pt() with df = 17 for the two-sided tail probability.
# Double the upper tail: 2 * pt(t, df, lower.tail = FALSE).
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Rebuild the Satterthwaite p-value solution"
signif(2 * pt(6.7715, df = 17, lower.tail = FALSE), 3)
#> [1] 3.26e-06
```

**Explanation:** This is exactly what `lmerTest` did internally: it plugged the estimated degrees of freedom into an ordinary t-distribution, which is why the result matches the table's 3.26e-06.

</details>

## How do you turn estimates into confidence intervals?

A p-value tells you whether an effect differs from zero. A confidence interval tells you the plausible range for its size, which is usually the more useful thing to report. lme4 gives you three flavors through one function, `confint()`, and here we cover the two fast ones.

The quickest is the Wald interval, which assumes the estimate follows a symmetric bell curve and adds and subtracts a multiple of the standard error:

$$\hat{\beta} \pm z_{1-\alpha/2}\,\widehat{\text{SE}}(\hat{\beta})$$

Where $\hat{\beta}$ is the estimate, $\widehat{\text{SE}}$ is its standard error, and $z_{1-\alpha/2}$ is about 1.96 for a 95% interval. The `parm = "beta_"` argument restricts the output to the fixed effects.

```r title="Wald confidence intervals for the fixed effects"
round(confint(fm, parm = "beta_", method = "Wald"), 2)
#>              2.5 % 97.5 %
#> (Intercept) 238.03 264.78
#> Days          7.44  13.50
```

The `Days` slope plausibly lies between 7.44 and 13.50 ms per day. Because the interval sits well above zero, this agrees with every p-value we have computed: the effect is clearly positive.

The Wald interval is fast but leans on that symmetry assumption. The profile interval drops the assumption by tracing how the likelihood actually changes as each parameter moves, so it can come out slightly asymmetric and is generally more accurate.

```r title="Profile-likelihood confidence intervals"
round(confint(fm, parm = "beta_", method = "profile"), 2)
#>              2.5 % 97.5 %
#> (Intercept) 237.68 265.13
#> Days          7.36  13.58
```

The profile interval for `Days`, 7.36 to 13.58, is a touch wider than the Wald one. For fixed effects in a healthy model the two usually agree closely, as they do here. The gap grows for variance parameters, where symmetry is a poor assumption and the profile interval is the one to trust.

**Try it:** Not every report wants 95%. Build a 90% Wald interval for the `Days` slope by setting the `level` argument.

```r title="Your turn: a 90% confidence interval"
# confint() takes a level argument (default 0.95).
# Set level = 0.90 and parm = "Days".
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="90% confidence interval solution"
round(confint(fm, parm = "Days", method = "Wald", level = 0.90), 2)
#>       5 %  95 %
#> Days 7.92 13.01
```

**Explanation:** A 90% interval is narrower than a 95% one because you are asking for less confidence, so the labels change to the 5% and 95% quantiles.

</details>

## How does the parametric bootstrap give inference you can trust?

Every method so far leans on a mathematical approximation: the normal curve, the chi-squared curve, or an estimated degrees-of-freedom number. The parametric bootstrap replaces the approximation with brute force. The recipe is short: treat your fitted model as if it were the truth, simulate many fresh datasets from it, refit the model to each one, and watch how much the estimate bounces around. That spread is a direct, assumption-light picture of your uncertainty.

lme4 wires this straight into `confint()` with `method = "boot"`. We set a seed so the random simulation is repeatable, and use a modest number of simulations to keep it quick.

```r title="Parametric bootstrap confidence intervals"
set.seed(101)
round(confint(fm, parm = "beta_", method = "boot", nsim = 100), 2)
#>              2.5 % 97.5 %
#> (Intercept) 237.65 266.05
#> Days          7.10  13.39
```

The bootstrap interval for `Days`, 7.10 to 13.39, lands in the same neighborhood as the Wald and profile intervals. When all three roughly agree, you can be confident the approximations were safe. When the bootstrap disagrees, trust the bootstrap.

To really see what is happening, collect the individual simulated slopes with `bootMer` and look at their distribution. `bootMer` refits the model to each simulated dataset and records whatever statistic you ask for, which you supply as a function. Here that function is `fixef(m)[["Days"]]`: `fixef()` pulls the vector of fixed-effect estimates out of a fitted model, and `[["Days"]]` keeps the slope. `bootMer` returns an object whose `$t` component holds one recorded value per simulation, so `boot_slope$t` is the full set of 200 replicate slopes.

```r title="Collect bootstrap replicates and their interval"
set.seed(202)
boot_slope <- bootMer(fm, FUN = function(m) fixef(m)[["Days"]], nsim = 200)
round(quantile(boot_slope$t, c(0.025, 0.975)), 2)
#>  2.5% 97.5% 
#>  7.22 13.23 
```

Taking the 2.5% and 97.5% quantiles of the 200 refitted slopes gives a 95% interval of 7.22 to 13.23, built entirely from simulation. Plotting the full set of replicates shows the bell-like spread the interval summarizes, with the two cutoffs marked.

```r title="Plot the bootstrap distribution of the slope"
library(ggplot2)
ggplot(data.frame(slope = boot_slope$t), aes(slope)) +
  geom_histogram(bins = 30, fill = "#6C5CE7", colour = "white") +
  geom_vline(xintercept = quantile(boot_slope$t, c(0.025, 0.975)),
             linetype = "dashed") +
  labs(title = "Bootstrap distribution of the Days slope",
       x = "Estimated slope (ms per day)", y = "Count")
```

The histogram is centered near the estimate of 10.5 and tapers off symmetrically, which is why the bootstrap and Wald intervals matched: for this model the sampling distribution really is close to normal.

The bootstrap can also produce a p-value for the whole `Days` effect, through `PBmodcomp` in the `pbkrtest` package. It runs the same full-versus-null comparison as the likelihood ratio test, but instead of trusting the chi-squared curve, it simulates the null world many times and counts how often chance alone beats your observed result.

```r-static title="Bootstrapped likelihood ratio test with PBmodcomp"
library(pbkrtest)
set.seed(303)
PBmodcomp(fm_ml, null_ml, nsim = 100)
#> large : Reaction ~ Days + (Days | Subject)
#>          stat df   p.value    
#> LRT    23.537  1 1.226e-06 ***
#> PBtest 23.537     0.009901 ** 
```

Two p-values appear. `LRT` is the same chi-squared p-value as before. `PBtest` is the bootstrap p-value, and it is larger (0.0099) because with only 100 simulations the smallest p-value it can report is about 1/101. Both agree that `Days` matters, but the bootstrap is honest about the resolution limit of a small simulation.

[WARNING]
**Small nsim gives coarse, unstable bootstrap p-values.** With 100 simulations the finest p-value is roughly 0.01, and results can shift between runs. Use at least 1000 simulations, and 5000 or more when a decision hinges on the number. The tradeoff is time: each simulation refits the whole model.

[TIP]
**Set a seed before any bootstrap so your results reproduce.** Calling `set.seed()` right before `confint(..., method = "boot")` or `bootMer()` means you and a colleague get identical intervals from identical code, which matters when a reviewer asks you to rerun the analysis.

**Try it:** You have bootstrapped the slope. Now bootstrap the intercept and report its 95% interval.

```r title="Your turn: bootstrap the intercept"
# Use bootMer with FUN returning fixef(m)[["(Intercept)"]].
# Set a seed, use nsim = 100, then take the 2.5% and 97.5% quantiles.
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Bootstrap the intercept solution"
set.seed(55)
bi <- bootMer(fm, FUN = function(m) fixef(m)[["(Intercept)"]], nsim = 100)
round(quantile(bi$t, c(0.025, 0.975)), 2)
#>   2.5%  97.5% 
#> 235.47 263.44 
```

**Explanation:** The only change from the slope version is the statistic inside `FUN`; the simulate-refit-collect machinery is identical.

</details>

## Which inference method should you choose?

You now have five tools, and the right one depends on what you are testing and how much data you have. The flowchart below turns that into a quick decision.

![Flowchart for choosing a mixed model inference method](screenshots/Mixed-Model-Inference-in-R-decision-flow.webp)
*Figure 1: A quick guide to picking a mixed model inference method.*

Here is the same advice as a table you can keep next to your keyboard.

| Method | Best for | Runs in R with | Watch out for |
|---|---|---|---|
| t-as-z (Wald) | A fast gut-check | base lme4 | Too optimistic with few groups |
| Likelihood ratio test | Fixed effects, decent sample | base lme4 (`anova`) | Refit with `REML = FALSE` first |
| Satterthwaite df | Per-coefficient p-values | `lmerTest` | Linear (Gaussian) models only |
| Kenward-Roger df | Small samples, safest df method | `lmerTest` + `pbkrtest` | Slower on big models |
| Parametric bootstrap | Variance components, awkward cases | `lme4`, `pbkrtest` | Needs many simulations, time |

For an everyday linear mixed model, Kenward-Roger or Satterthwaite p-values plus a profile confidence interval will serve you well. Switch to the bootstrap when you are testing a variance component or when your groups are few and you want a method that leans on no distributional shortcut.

**Try it:** Encode the "how many groups" part of the rule as a helper function.

```r title="Your turn: a method-picker helper"
# Write ex_pick(n_groups) that returns
#   "Kenward-Roger or bootstrap" when n_groups < 30
#   "Satterthwaite or LRT is fine" otherwise.
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Method-picker helper solution"
ex_pick <- function(n_groups) {
  if (n_groups < 30) "Kenward-Roger or bootstrap" else "Satterthwaite or LRT is fine"
}
c(small = ex_pick(12), large = ex_pick(60))
#>                          small                          large 
#>    "Kenward-Roger or bootstrap" "Satterthwaite or LRT is fine" 
```

**Explanation:** The cutoff of 30 groups is a common rule of thumb, not a hard law; with borderline group counts, prefer the safer small-sample method.

</details>

## Complete Example: comparing every method on one slope

Let's bring the fixed-effect methods together for the `Days` slope in one table, so you can see them side by side. This reuses the objects built earlier in the tutorial (`fm`, `p_approx`, `null_ml`, `fm_ml`, and `boot_slope`), assembling their answers into a single data frame.

```r title="Assemble a one-slope inference summary"
inference_summary <- data.frame(
  method   = c("t as z (Wald)", "Likelihood ratio test", "Profile CI", "Bootstrap CI"),
  days_est = round(fixef(fm)[["Days"]], 2),
  detail   = c(
    paste0("p = ", signif(p_approx, 3)),
    paste0("p = ", signif(anova(null_ml, fm_ml)[["Pr(>Chisq)"]][2], 3)),
    paste(round(confint(fm, parm = "Days", method = "profile"), 2), collapse = " to "),
    paste(round(quantile(boot_slope$t, c(0.025, 0.975)), 2), collapse = " to ")
  )
)
inference_summary
#>                  method days_est        detail
#> 1         t as z (Wald)    10.47  p = 1.27e-11
#> 2 Likelihood ratio test    10.47  p = 1.23e-06
#> 3            Profile CI    10.47 7.36 to 13.58
#> 4          Bootstrap CI    10.47 7.22 to 13.23
```

Every method points to the same conclusion: the `Days` slope is about 10.5 ms per day, clearly different from zero, with a confidence interval roughly from 7 to 14. The p-values differ in scale (the t-as-z one is the smallest, because it is the most optimistic), but they all sit far below any sensible threshold. When your methods agree like this, you can report the result with confidence. When they disagree, the disagreement itself is telling you the approximations are strained, and the bootstrap is your tie-breaker.

## Practice Exercises

These combine several ideas from the tutorial. Try each before opening the solution. The exercises use distinct variable names so they will not overwrite the objects built above.

### Exercise 1: Is the random slope earning its place?

So far we let each subject have their own slope with `(Days | Subject)`. Test whether that added flexibility is justified against a simpler model where subjects share one common slope but keep their own intercept, `(1 | Subject)`. Refit both by maximum likelihood and compare them with a likelihood ratio test.

```r title="Exercise 1 starter"
# Fit a random-intercept-only model rs_ml with (1 | Subject), REML = FALSE.
# Compare it to fm_ml (built earlier) with anova().

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
rs_ml <- lmer(Reaction ~ Days + (1 | Subject), data = sleepstudy, REML = FALSE)
anova(rs_ml, fm_ml)
#> Data: sleepstudy
#> Models:
#> rs_ml: Reaction ~ Days + (1 | Subject)
#> fm_ml: Reaction ~ Days + (Days | Subject)
#>       npar    AIC    BIC  logLik -2*log(L)  Chisq Df Pr(>Chisq)    
#> rs_ml    4 1802.1 1814.8 -897.04    1794.1                         
#> fm_ml    6 1763.9 1783.1 -875.97    1751.9 42.139  2  7.072e-10 ***
```

**Explanation:** The tiny p-value says the per-subject slopes matter, so the random slope stays. One caution: because this test is about variance components sitting on a boundary, the reported p-value is actually a little conservative (too large), so a borderline result here would deserve a bootstrap test rather than the naive chi-squared.

</details>

### Exercise 2: Does the model's standard error match the bootstrap?

The `Std. Error` in the summary table is itself an approximation. Check it by bootstrapping the `Days` slope 200 times and comparing the standard deviation of the bootstrap estimates to the model's reported standard error.

```r title="Exercise 2 starter"
# Model SE: coef(summary(fm))["Days", "Std. Error"].
# Bootstrap SE: set a seed, bootMer the Days slope with nsim = 200,
# then take sd() of the replicates. Compare the two.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
set.seed(404)
bslope2 <- bootMer(fm, FUN = function(m) fixef(m)[["Days"]], nsim = 200)
c(model_se = round(coef(summary(fm))["Days", "Std. Error"], 3),
  boot_se  = round(sd(bslope2$t), 3))
#> model_se  boot_se 
#>    1.546    1.406 
```

**Explanation:** The bootstrap standard error (1.406) is close to the model's (1.546), which is reassuring. The bootstrap value is slightly smaller because it does not assume the errors are perfectly normal; a large gap between the two would warn you the model-based standard error is unreliable.

</details>

### Exercise 3: A bootstrap prediction interval

Point predictions deserve uncertainty too. Estimate the mean reaction time on Day 5 for a typical subject (using only the fixed effects), and put a 95% bootstrap interval around it.

```r title="Exercise 3 starter"
# The fixed-effect prediction at Day 5 is
#   fixef(m)[["(Intercept)"]] + fixef(m)[["Days"]] * 5.
# Wrap that in a FUN for bootMer, set a seed, use nsim = 200,
# then take the point estimate plus the 2.5% and 97.5% quantiles.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
set.seed(707)
pred_fun <- function(m) fixef(m)[["(Intercept)"]] + fixef(m)[["Days"]] * 5
bp <- bootMer(fm, FUN = pred_fun, nsim = 200)
c(estimate = round(pred_fun(fm), 1),
  lwr = round(quantile(bp$t, 0.025), 1),
  upr = round(quantile(bp$t, 0.975), 1))
#>  estimate  lwr.2.5% upr.97.5% 
#>     303.7     285.9     320.9 
```

**Explanation:** The same `bootMer` engine bootstraps any function of the model, including a prediction. A typical subject is predicted to react in about 304 ms on Day 5, plausibly between 286 and 321 ms.

</details>

## Frequently Asked Questions

### Why does lmer give p-values once I load lmerTest but not before?

Loading `lmerTest` replaces the plain `lmer` with a version that estimates the denominator degrees of freedom (using Satterthwaite by default) and adds the p-value column. The underlying model fit is identical; only the summary method changes. Base lme4 leaves the column out because it will not commit to a single degrees-of-freedom rule.

### Should I fit with REML or maximum likelihood?

Use REML (the default) for your final estimates and confidence intervals, because it gives less biased variance components. Switch to `REML = FALSE` only when you run a likelihood ratio test that compares different fixed effects, since REML likelihoods are not comparable across those models. The Satterthwaite and Kenward-Roger methods work fine on REML fits.

### Which p-value should I actually report?

For an ordinary linear mixed model, report the Kenward-Roger or Satterthwaite p-value, since simulation studies show they control false positives best. Add a profile or bootstrap confidence interval so readers see the effect size and its uncertainty, not just a yes/no verdict.

### My model prints "boundary (singular) fit". Is my inference still valid?

A singular fit means a variance or correlation is estimated at its boundary (often zero), which makes p-values and standard errors for the random effects unreliable. Simplify the random-effects structure (for example, drop a correlation or a random slope), then rerun the inference on the simpler model. See [common lme4 convergence warnings](R-Error-lme4-Convergence.html) for the full playbook.

### Do these methods work for logistic or Poisson mixed models?

The likelihood ratio test and the parametric bootstrap work for generalized linear mixed models (GLMMs) fit with `glmer`. The Satterthwaite and Kenward-Roger degrees-of-freedom methods do not, because they are built for the Gaussian case. For a GLMM, lean on the bootstrap or the LRT.

## Summary

Mixed models withhold p-values because the denominator degrees of freedom are genuinely uncertain, and this tutorial gave you five honest ways to supply the missing inference.

![The mixed model inference toolbox](screenshots/Mixed-Model-Inference-in-R-toolbox.webp)
*Figure 2: The mixed model inference toolbox at a glance.*

| Takeaway | What to remember |
|---|---|
| No p-value column is intentional | The exact degrees of freedom for `lmer` are unknown |
| t-as-z is a shortcut, not a report | Fine when far from the boundary, risky near it |
| Likelihood ratio test needs ML | Refit with `REML = FALSE`, then `anova()` |
| Satterthwaite and Kenward-Roger | Best default p-values for linear mixed models, via `lmerTest` |
| Confidence intervals beat p-values | Wald is fast, profile is more accurate, bootstrap assumes least |
| Bootstrap is the tie-breaker | Simulate, refit, collect; use many simulations and a seed |

If your methods agree, report the result with confidence. If they disagree, the parametric bootstrap is your tie-breaker.

## References

1. Bates, D., et al. lme4 reference: getting p-values for fitted models. [Link](https://search.r-project.org/CRAN/refmans/lme4/html/pvalues.html)
2. lme4 reference: bootMer, model-based parametric bootstrap for mixed models. [Link](https://search.r-project.org/CRAN/refmans/lme4/html/bootMer.html)
3. lme4 reference: confint.merMod, Wald, profile, and boot confidence intervals. [Link](https://search.r-project.org/CRAN/refmans/lme4/html/confint.merMod.html)
4. Kuznetsova, A., Brockhoff, P. B., Christensen, R. H. B. lmerTest Package: Tests in Linear Mixed Effects Models. *Journal of Statistical Software* (2017). [Link](https://www.jstatsoft.org/article/view/v082i13)
5. Halekoh, U., Hojsgaard, S. A Kenward-Roger Approximation and Parametric Bootstrap Methods for Tests in Linear Mixed Models (pbkrtest). *Journal of Statistical Software* (2014). [Link](https://www.jstatsoft.org/article/view/v059i09)
6. Luke, S. G. Evaluating significance in linear mixed-effects models in R. *Behavior Research Methods* (2017). [Link](https://link.springer.com/article/10.3758/s13428-016-0809-y)
7. Bolker, B. GLMM FAQ: testing hypotheses and computing p-values. [Link](https://bbolker.github.io/mixedmodels-misc/glmmFAQ.html)

## Continue Learning

- [Random Intercepts and Slopes with lme4](Random-Intercepts-and-Slopes-in-R.html) - how to build the mixed model whose coefficients we test here.
- [Likelihood Ratio Tests and Pivotal Methods](Likelihood-Ratio-Tests-and-Pivotal-Methods.html) - the theory behind the LRT, generalized to any nested-model comparison.
- [The Bootstrap in R](Bootstrap-in-R.html) - the resampling idea from the ground up, before the mixed-model twist.
