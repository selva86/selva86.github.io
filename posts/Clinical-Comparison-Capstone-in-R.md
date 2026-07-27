---
title: "Capstone: A Clinical-Style Group Comparison in R"
slug: "Clinical-Comparison-Capstone-in-R"
description: "A two-arm clinical-style comparison in R, end to end: protocol, power, a Table 1 with standardized mean differences, the primary test, ANCOVA, and reporting."
keywords: "clinical trial analysis in R, two-arm comparison, intention-to-treat, ANCOVA in R, standardized mean difference, power analysis R, Welch t-test, CONSORT"
auto_link_terms: "clinical trial analysis in R|two-arm comparison|intention-to-treat|per-protocol analysis|standardized mean difference|baseline balance|ANCOVA adjustment|Welch t-test|minimally important difference|CONSORT flow|primary endpoint|clinical comparison capstone|group comparison in R|Table 1 fallacy"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-07-27"
curriculum_id: "ST2-13.2"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Clinical Comparison Capstone"
sidebar_order: "180"
difficulty: "Advanced"
---

<p class="lead">A clinical-style comparison asks one clean question, does the treatment beat the control, and answers it with a discipline that separates what you decided before seeing the data from what the data suggested afterward. This capstone runs that whole workflow on one simulated two-arm trial whose true effect we already know, so every number on the page is checkable against the truth.</p>

This is a capstone, so it stitches together skills you have met one at a time: power, a group test, effect sizes, and covariate adjustment. We will run a small blood-pressure program evaluation from protocol to final report, using base R plus a little dplyr and ggplot2. The same pattern fits any two-arm A/B comparison, a new checkout flow against the old one, a coaching program against a waitlist, so read "patient" as "unit" and "clinic" as "your team" whenever you like.

## What are we comparing, and what did we lock in first?

A two-arm comparison has exactly two groups. One arm gets the new thing, here a 12-week program to lower blood pressure, and the other arm gets standard care. Everyone is randomly assigned to an arm, and we compare a single agreed-on number between the two. That number, and the exact way we will compare it, are decided before we see a single result. Writing those rules down first is preregistration in miniature, and it is what stops us from fishing for a story after the fact.

Let us make "decided in advance" concrete by storing the protocol as a small table and printing it. Everything below flows from these six decisions.

```r title="Lock the protocol before any data exists"
library(dplyr)
protocol <- data.frame(
  item = c("Hypothesis", "Primary endpoint", "Analysis set",
           "Primary test", "Alpha (two-sided)", "Min. important difference"),
  decision = c("Program lowers week-12 SBP vs standard care",
               "Systolic blood pressure (mmHg) at week 12",
               "Intention-to-treat (all randomized, as assigned)",
               "Welch two-sample t-test",
               "0.05",
               "5 mmHg"),
  stringsAsFactors = FALSE
)
protocol
#>                        item                                         decision
#> 1                Hypothesis      Program lowers week-12 SBP vs standard care
#> 2          Primary endpoint        Systolic blood pressure (mmHg) at week 12
#> 3              Analysis set Intention-to-treat (all randomized, as assigned)
#> 4              Primary test                          Welch two-sample t-test
#> 5         Alpha (two-sided)                                             0.05
#> 6 Min. important difference                                           5 mmHg
```

That table is the contract. The primary endpoint is the one outcome that decides success, systolic blood pressure (SBP) at week 12. The analysis set is intention-to-treat, meaning we analyze people in the arm they were randomized to, no matter what they actually did later. Alpha is our error budget for a false positive, set at the usual 0.05. The minimally important difference, 5 mmHg, is the smallest change we would call clinically worth having.

![The two-arm parallel design: randomize once, measure the same endpoint in both arms.](screenshots/Clinical-Comparison-Capstone-in-R-trial-design.webp)

*Figure 1: The two-arm parallel design: randomize once, measure the same endpoint in both arms.*

[KEY INSIGHT]
**Prespecification is the spine of the whole analysis.** Every choice you make before seeing outcomes, the endpoint, the test, the alpha, is a promise; every choice you make after seeing outcomes is a hypothesis for next time, not a conclusion from this study.

**Try it:** A protocol needs its endpoints written down. Build a small data frame called `ex_endpoints` with a `type` column ("Primary", "Secondary", "Secondary") and an `endpoint` column naming the week-12 SBP as primary and two sensible secondaries.

```r title="Your turn: list the endpoints"
# Fill in the endpoint column, then run.
# The primary is SBP at week 12; add two secondary endpoints of your own.
ex_endpoints <- data.frame(
  type = c("Primary", "Secondary", "Secondary"),
  endpoint = c("", "", "")   # replace the empty strings
)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Endpoints table solution"
ex_endpoints <- data.frame(
  type = c("Primary", "Secondary", "Secondary"),
  endpoint = c("SBP at week 12",
               "Proportion with SBP below 130 mmHg",
               "Change in SBP from baseline")
)
ex_endpoints
#>        type                           endpoint
#> 1   Primary                     SBP at week 12
#> 2 Secondary Proportion with SBP below 130 mmHg
#> 3 Secondary        Change in SBP from baseline
```

**Explanation:** Secondary endpoints support the story but never overrule the primary. Reaching a clinical target (SBP below 130) and the raw change from baseline are natural companions to the primary week-12 level.

</details>

## How many patients do we need, and how did we decide?

Sample size is not a guess, it is a calculation you do before enrolling anyone. You feed in three numbers you already committed to: the smallest difference worth detecting (our 5 mmHg), how spread out the outcome is (its standard deviation), and the power you want, which is the chance of detecting a real effect if it exists. The convention is 80% power. R turns those into a required sample size with `power.t.test()`.

```r title="Sample size from the minimally important difference"
pw <- power.t.test(delta = 5, sd = 15, sig.level = 0.05, power = 0.80)
pw
#>
#>      Two-sample t test power calculation
#>
#>               n = 142.2466
#>           delta = 5
#>              sd = 15
#>       sig.level = 0.05
#>           power = 0.8
#>     alternative = two.sided
#>
#> NOTE: n is number in *each* group
```

R tells us we need about 142 people per arm to have an 80% chance of detecting a 5 mmHg difference when the outcome has a standard deviation of 15 mmHg. We will round up and enroll 150 per arm to leave room for dropout. Notice how the answer depends entirely on assumptions we chose in advance, not on any data.

To build intuition, let us watch power climb as the sample grows. We sweep a range of per-arm sizes and read off the power for each.

```r title="Compute a power curve across sample sizes"
grid <- data.frame(n_per_arm = seq(60, 220, by = 20))
grid$power <- sapply(grid$n_per_arm, function(nn)
  power.t.test(n = nn, delta = 5, sd = 15, sig.level = 0.05)$power)
grid$power <- round(grid$power, 3)
grid
#>   n_per_arm power
#> 1        60 0.441
#> 2        80 0.554
#> 3       100 0.650
#> 4       120 0.730
#> 5       140 0.794
#> 6       160 0.844
#> 7       180 0.884
#> 8       200 0.914
#> 9       220 0.937
```

At 60 per arm we would miss a real 5 mmHg effect more than half the time. By 140 per arm we cross the 80% line, which matches the 142 the formula gave us. The same numbers are easier to feel as a curve, so let us draw it.

```r title="Plot the power curve"
library(ggplot2)
p_power <- ggplot(grid, aes(n_per_arm, power)) +
  geom_line(color = "#4C6EF5", linewidth = 1) +
  geom_hline(yintercept = 0.80, linetype = "dashed") +
  labs(x = "Sample size per arm", y = "Power",
       title = "Power to detect a 5 mmHg difference (SD = 15)") +
  theme_minimal()
p_power
```

The dashed line is our 80% target, and the curve shows the sample size where we clear it. The curve is steep on the left and flat on the right: past a point, buying more patients barely buys more power, which is useful when a budget is tight.

[TIP]
**Power the study for the smallest effect worth acting on, not the effect you hope to see.** If you plug in an optimistic 10 mmHg because you expect a big win, you will enroll too few people and be underpowered for the modest-but-real effect that actually shows up.

**Try it:** Suppose you only care about detecting a larger 8 mmHg difference (same SD of 15, same 80% power). Use `power.t.test()` to find the required sample size per arm. Do you need more people or fewer?

```r title="Your turn: sample size for a bigger effect"
# Goal: n per arm to detect delta = 8, sd = 15, power = 0.80.
# Hint: call power.t.test() and read off n, then round up with ceiling().
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Sample size for delta 8 solution"
ex_pw <- power.t.test(delta = 8, sd = 15, sig.level = 0.05, power = 0.80)
ceiling(ex_pw$n)
#> [1] 57
```

**Explanation:** A larger effect is easier to see, so it needs fewer people, only 57 per arm here versus 142 for a 5 mmHg effect. Bigger effects are cheaper to detect.

</details>

## Are the two groups comparable at baseline?

Now the trial runs. We enroll 150 patients per arm and record their baseline traits: age, sex, body-mass index, and starting SBP. Because this is a simulation, we get to know the truth, and we build the data so the program truly lowers SBP by about 8 mmHg in people who stick with it. That known effect is our answer key.

```r title="Simulate the randomized baseline sample"
set.seed(2025)
n <- 150
sim_arm <- function(arm, n) {
  data.frame(
    arm      = arm,
    age      = round(rnorm(n, 55, 10)),
    female   = rbinom(n, 1, 0.5),
    bmi      = round(rnorm(n, 28, 4), 1),
    base_sbp = round(rnorm(n, 150, 15))
  )
}
trial <- rbind(sim_arm("Control", n), sim_arm("Treatment", n))
trial$arm <- factor(trial$arm, levels = c("Control", "Treatment"))
nrow(trial)
table(trial$arm)
#> [1] 300
#>
#>   Control Treatment
#>       150       150
```

We have 300 patients, split evenly. Because we drew both arms from the same recipe, they are random samples of one population, which is exactly what randomization guarantees in a real trial. Next we generate week-12 outcomes. Some patients do not adhere to the program, some drop out before week 12, and higher starting values tend to fall more (a real effect called regression to the mean). The `set.seed()` call makes the whole thing reproducible.

```r title="Simulate outcomes, adherence, and dropout"
set.seed(11)
trial$adherent  <- rbinom(nrow(trial), 1,
                    ifelse(trial$arm == "Treatment", 0.85, 0.95))
trial$completed <- rbinom(nrow(trial), 1, 0.94)
effect_i <- ifelse(trial$arm == "Treatment",
             ifelse(trial$adherent == 1, -8, -3), 0)
rtm <- -0.30 * (trial$base_sbp - 150)
trial$sbp12 <- round(trial$base_sbp + rtm - 3 + effect_i +
                     rnorm(nrow(trial), 0, 8))
trial$sbp12[trial$completed == 0] <- NA
sum(is.na(trial$sbp12))
head(trial, 3)
#> [1] 17
#>       arm age female  bmi base_sbp adherent completed sbp12
#> 1 Control  61      0 28.7      145        1         1   131
#> 2 Control  55      0 24.6      168        1         1   154
#> 3 Control  63      0 29.2      158        1         1   146
```

Seventeen patients have a missing week-12 value because they did not complete the study. Adherent treatment patients get the full 8 mmHg benefit; non-adherent ones get only a partial 3 mmHg; control patients get none. This is a realistic, messy data set, and it is the one our prespecified plan now has to face.

Before analyzing the outcome, we check whether randomization did its job of making the arms comparable. The right tool is the standardized mean difference (SMD): the gap between arm means measured in units of pooled spread. In symbols:

$$\text{SMD} = \frac{\bar{x}_\text{treatment} - \bar{x}_\text{control}}{\sqrt{(s^2_\text{treatment} + s^2_\text{control})/2}}$$

Where:

- $\bar{x}_\text{treatment}$ and $\bar{x}_\text{control}$ are the arm means of a baseline variable
- $s^2_\text{treatment}$ and $s^2_\text{control}$ are the arm variances
- the denominator is the pooled standard deviation of the two arms

A common rule of thumb is that an absolute SMD above 0.1 flags a noticeable imbalance. Let us build the Table 1 that every trial report opens with.

```r title="Build Table 1 with standardized mean differences"
smd <- function(x, g) {
  m <- tapply(x, g, mean)
  s <- tapply(x, g, sd)
  as.numeric((m[2] - m[1]) / sqrt((s[1]^2 + s[2]^2) / 2))
}
bvars <- c("age", "female", "bmi", "base_sbp")
tab1 <- data.frame(
  variable  = bvars,
  Control   = sapply(bvars, function(v) mean(trial[[v]][trial$arm == "Control"])),
  Treatment = sapply(bvars, function(v) mean(trial[[v]][trial$arm == "Treatment"])),
  SMD       = sapply(bvars, function(v) smd(trial[[v]], trial$arm)),
  row.names = NULL
)
tab1[, -1] <- round(tab1[, -1], 3)
tab1
#>   variable Control Treatment    SMD
#> 1      age  54.147    56.180  0.195
#> 2   female   0.500     0.473 -0.053
#> 3      bmi  28.001    28.043  0.011
#> 4 base_sbp 149.507   148.980 -0.035
```

Read the SMD column. Sex, BMI, and the all-important baseline SBP sit far below 0.1, so those are well balanced. Age is the exception at 0.20: the treatment arm is about two years older by chance. That is a normal event in a trial of this size, a reminder that randomization balances groups on average, not perfectly in every single draw. The right response is not alarm and not a significance test, it is to lean on the covariate adjustment we planned for.

[WARNING]
**Never run hypothesis tests on baseline characteristics to "check" randomization.** Because both arms were sampled from the same population, any baseline difference is by definition due to chance, so a p-value answers a question that has no meaning here. This mistake is so common it has a name, the Table 1 fallacy. Report standardized differences instead and adjust for strong prognostic variables (those that predict the outcome) you named in advance.

**Try it:** Compute the standardized mean difference for `bmi` on its own using the `smd()` helper defined above. Is it below the 0.1 threshold?

```r title="Your turn: compute the SMD for BMI"
# Use the smd() function on trial$bmi and trial$arm.
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="SMD for BMI solution"
ex_smd_bmi <- smd(trial$bmi, trial$arm)
round(ex_smd_bmi, 3)
#> [1] 0.011
```

**Explanation:** An SMD of 0.011 is essentially zero, so BMI is beautifully balanced between the arms. No test, no worry, just a number you report.

</details>

## Did the treatment work? The prespecified primary analysis

This is the moment the protocol was written for. Our plan named a Welch two-sample t-test on week-12 SBP, analyzed by intention-to-treat. Intention-to-treat means we compare arms as randomized, including patients who did not fully adhere. It answers the honest, policy-relevant question, "what happens when we offer this program," rather than the flattering question, "what happens in the perfect patient." We use the observed week-12 values (a complete-case ITT), and we will account for the missing ones in the reporting section.

```r title="Run the prespecified primary test"
itt <- subset(trial, !is.na(sbp12))
primary <- t.test(sbp12 ~ arm, data = itt)
primary
#>
#> 	Welch Two Sample t-test
#>
#> data:  sbp12 by arm
#> t = 4.4218, df = 280.85, p-value = 1.401e-05
#> alternative hypothesis: true difference in means between group Control and group Treatment is not equal to 0
#> 95 percent confidence interval:
#>   3.996326 10.409328
#> sample estimates:
#>   mean in group Control mean in group Treatment
#>                146.4014                139.1986
```

R compares Control against Treatment, so its confidence interval is for "Control minus Treatment" and comes out positive. That is a little awkward to read, so let us flip it to the more natural "Treatment minus Control" (a negative number means the program lowered SBP) and print a clean summary.

```r title="Report the effect as Treatment minus Control"
m <- tapply(itt$sbp12, itt$arm, mean)
delta <- as.numeric(m["Treatment"] - m["Control"])
ci <- as.numeric(-rev(primary$conf.int))
cat(sprintf("Treatment mean: %.1f mmHg\n", m["Treatment"]))
cat(sprintf("Control mean:   %.1f mmHg\n", m["Control"]))
cat(sprintf("Effect (Treatment - Control): %.1f mmHg\n", delta))
cat(sprintf("95%% CI: %.1f to %.1f mmHg\n", ci[1], ci[2]))
cat(sprintf("p-value: %.3g\n", primary$p.value))
#> Treatment mean: 139.2 mmHg
#> Control mean:   146.4 mmHg
#> Effect (Treatment - Control): -7.2 mmHg
#> 95% CI: -10.4 to -4.0 mmHg
#> p-value: 1.4e-05
```

The program lowered week-12 SBP by 7.2 mmHg on average, with a 95% confidence interval from 4.0 to 10.4 mmHg lower. Because we built the data with a true effect near 8 mmHg (diluted a little by non-adherence), this estimate lands right where the truth is, which is reassuring. The whole interval sits below zero and beyond our 5 mmHg importance threshold at its far end, and the p-value is tiny, so by our own prespecified rule this is a clear, clinically meaningful win. The confidence interval matters more than the p-value: it tells you the plausible range of the real effect, not just that it differs from zero. If you want a refresher, see the guide on [confidence intervals](Confidence-Intervals-in-R.html).

[NOTE]
**We used a complete-case ITT for teaching clarity.** A strict intention-to-treat analysis handles missing outcomes with a method such as multiple imputation rather than dropping them. With only 17 missing values spread evenly across arms, the shortcut barely moves the estimate here, but flag it as a limitation in a real report.

**Try it:** One of our secondary endpoints was the proportion of patients reaching a controlled SBP below 130 mmHg. Compute that proportion for each arm using `tapply()`.

```r title="Your turn: proportion reaching SBP below 130"
# Make a TRUE/FALSE vector for sbp12 < 130, then average it within each arm.
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Proportion controlled solution"
itt$controlled <- itt$sbp12 < 130
ctab <- tapply(itt$controlled, itt$arm, mean)
round(ctab, 3)
#>   Control Treatment
#>     0.106     0.220
```

**Explanation:** About 22% of treatment patients reached control versus 11% of controls, roughly double. Averaging a TRUE/FALSE vector gives a proportion, because R treats TRUE as 1 and FALSE as 0.

</details>

## Would a different analysis change the answer?

A single test is never the whole story. A robust result should survive being poked at, so we run three sensitivity analyses and line them up against the primary. Each pokes a different assumption. This is where the "decided in advance versus data-driven" spine matters most: these were all named in the protocol as supportive analyses, so they strengthen the primary rather than replace it.

![The spine of the chapter: what is decided before the data versus what the data drives.](screenshots/Clinical-Comparison-Capstone-in-R-prespecified-vs-posthoc.webp)

*Figure 2: The spine of the chapter: what is decided before the data versus what the data drives.*

The first check drops the normality assumption. The Wilcoxon rank-sum test compares the arms using ranks, not raw values, and returns a Hodges-Lehmann estimate of the typical shift between them. For more on this test, see the [Mann-Whitney U test](Mann-Whitney-U-Test-in-R.html) guide.

```r title="Robustness check 1: nonparametric Wilcoxon"
np <- wilcox.test(sbp12 ~ arm, data = itt, conf.int = TRUE)
np_est <- as.numeric(-np$estimate)
np_ci  <- as.numeric(-rev(np$conf.int))
cat(sprintf("Hodges-Lehmann shift (Treatment - Control): %.1f mmHg\n", np_est))
cat(sprintf("95%% CI: %.1f to %.1f mmHg | p = %.3g\n", np_ci[1], np_ci[2], np$p.value))
#> Hodges-Lehmann shift (Treatment - Control): -7.0 mmHg
#> 95% CI: -10.0 to -4.0 mmHg | p = 1.07e-05
```

The nonparametric shift is 7.0 mmHg lower, almost identical to the primary. The second check is the most useful one in practice: ANCOVA, which is a linear model for week-12 SBP with the arm and the baseline SBP as predictors. Adjusting for the starting value soaks up a big chunk of patient-to-patient variation, which usually shrinks the confidence interval.

```r title="Robustness check 2: ANCOVA adjusting for baseline"
ancova <- lm(sbp12 ~ arm + base_sbp, data = itt)
ct <- summary(ancova)$coefficients
ci_arm <- confint(ancova)
ancova_out <- data.frame(
  term      = rownames(ct),
  estimate  = round(ct[, "Estimate"], 3),
  std_error = round(ct[, "Std. Error"], 3),
  conf_low  = round(ci_arm[, 1], 2),
  conf_high = round(ci_arm[, 2], 2),
  p_value   = signif(ct[, "Pr(>|t|)"], 3),
  row.names = NULL
)
ancova_out
adj_est <- ct["armTreatment", "Estimate"]; adj_lo <- ci_arm["armTreatment", 1]
adj_hi <- ci_arm["armTreatment", 2];       adj_p  <- ct["armTreatment", "Pr(>|t|)"]
#>           term estimate std_error conf_low conf_high  p_value
#> 1  (Intercept)   35.749     5.156    25.60     45.90 2.83e-11
#> 2 armTreatment   -6.962     0.998    -8.93     -5.00 2.15e-11
#> 3     base_sbp    0.742     0.034     0.67      0.81 8.43e-62
```

The `armTreatment` row is our adjusted effect: 7.0 mmHg lower, with a 95% interval from 8.9 to 5.0. Look at the standard error, 0.998, versus the primary test's, which we will confirm is much larger in a moment. Adjusting for baseline SBP made the estimate more precise without changing its size. The third check is per-protocol: analyze only patients who completed and adhered. This answers "how well does the program work when actually followed," a fair question, but a fragile one, because adherers are self-selected and no longer a randomized comparison.

```r title="Robustness check 3: per-protocol sensitivity"
pp <- subset(trial, completed == 1 & adherent == 1 & !is.na(sbp12))
pp_test <- t.test(sbp12 ~ arm, data = pp)
mpp <- tapply(pp$sbp12, pp$arm, mean)
pp_delta <- as.numeric(mpp["Treatment"] - mpp["Control"])
pp_ci <- as.numeric(-rev(pp_test$conf.int))
cat(sprintf("Per-protocol n: %d\n", nrow(pp)))
cat(sprintf("Effect: %.1f mmHg | 95%% CI: %.1f to %.1f | p = %.3g\n",
            pp_delta, pp_ci[1], pp_ci[2], pp_test$p.value))
#> Per-protocol n: 259
#> Effect: -7.7 mmHg | 95% CI: -11.1 to -4.4 | p = 6.7e-06
```

Per-protocol shows a slightly larger 7.7 mmHg because it keeps only the full-benefit adherers. That larger number is not "more correct," it answers a different, easier question than intention-to-treat. Now line all four analyses up in one table.

```r title="Compare all four analyses side by side"
results <- data.frame(
  analysis = c("Primary (Welch t-test, ITT)",
               "Nonparametric (Wilcoxon, ITT)",
               "ANCOVA (baseline-adjusted, ITT)",
               "Per-protocol (Welch t-test)"),
  estimate = round(c(delta, np_est, adj_est, pp_delta), 1),
  ci_low   = round(c(ci[1], np_ci[1], adj_lo, pp_ci[1]), 1),
  ci_high  = round(c(ci[2], np_ci[2], adj_hi, pp_ci[2]), 1),
  p_value  = signif(c(primary$p.value, np$p.value, adj_p, pp_test$p.value), 3),
  row.names = NULL
)
results
#>                          analysis estimate ci_low ci_high  p_value
#> 1     Primary (Welch t-test, ITT)     -7.2  -10.4    -4.0 1.40e-05
#> 2   Nonparametric (Wilcoxon, ITT)     -7.0  -10.0    -4.0 1.07e-05
#> 3 ANCOVA (baseline-adjusted, ITT)     -7.0   -8.9    -5.0 2.15e-11
#> 4     Per-protocol (Welch t-test)     -7.7  -11.1    -4.4 6.70e-06
```

Every method points the same way, an effect near 7 mmHg lower, all significant. The four estimates read even more clearly as a forest plot, where each dot is an estimate and each line is its confidence interval.

```r title="Draw a forest plot of the four estimates"
results$analysis <- factor(results$analysis, levels = rev(results$analysis))
p_forest <- ggplot(results, aes(estimate, analysis)) +
  geom_vline(xintercept = 0, linetype = "dashed", color = "grey60") +
  geom_pointrange(aes(xmin = ci_low, xmax = ci_high), color = "#4C6EF5") +
  labs(x = "Effect on week-12 SBP (mmHg), Treatment - Control", y = NULL,
       title = "Four analyses, one conclusion") +
  theme_minimal()
p_forest
```

All four intervals sit entirely to the left of the dashed zero line, so no reasonable analyst would look at this and conclude "no effect." That agreement is the real prize of a sensitivity analysis.

[KEY INSIGHT]
**When the prespecified primary and every sensitivity analysis agree, your conclusion is robust.** The ANCOVA also shows why adjustment is worth planning: by explaining part of the outcome with the baseline value, it cut the standard error by nearly 40% and tightened the interval, all without touching the point estimate.

**Try it:** The payoff of ANCOVA is precision. Pull the standard error of the treatment effect from the ANCOVA model and from the primary t-test, and compare them.

```r title="Your turn: compare the standard errors"
# The ANCOVA SE is coef(summary(ancova))["armTreatment", "Std. Error"].
# The primary t-test SE is primary$stderr. Round both and compare.
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Standard error comparison solution"
ex_ancova_se <- coef(summary(ancova))["armTreatment", "Std. Error"]
ex_primary_se <- primary$stderr
round(c(ancova_se = ex_ancova_se, primary_se = ex_primary_se), 3)
#>  ancova_se primary_se
#>      0.998      1.629
```

**Explanation:** The ANCOVA standard error (0.998) is much smaller than the unadjusted one (1.629). A smaller standard error means a narrower confidence interval and more power, which is exactly why prespecified baseline adjustment is standard practice in trials.

</details>

## How do we report this honestly, and what can it not claim?

A good report gives the effect in plain language, quantifies the uncertainty, and states clearly what the study cannot say. Start with a standardized effect size so readers can compare this result to studies with different scales. Cohen's d divides the raw effect by the pooled standard deviation:

$$d = \frac{\bar{x}_\text{treatment} - \bar{x}_\text{control}}{s_\text{pooled}}$$

Where $s_\text{pooled}$ is the standard deviation pooled across both arms. We convert our 7.2 mmHg effect and its interval into d.

```r title="Standardize the effect with Cohen's d"
nc <- sum(itt$arm == "Control"); nt <- sum(itt$arm == "Treatment")
vc <- var(itt$sbp12[itt$arm == "Control"])
vt <- var(itt$sbp12[itt$arm == "Treatment"])
pooled_sd <- sqrt(((nc - 1) * vc + (nt - 1) * vt) / (nc + nt - 2))
d <- delta / pooled_sd
d_ci <- ci / pooled_sd
cat(sprintf("Pooled SD: %.1f mmHg\n", pooled_sd))
cat(sprintf("Cohen's d: %.2f (95%% CI %.2f to %.2f)\n", d, d_ci[1], d_ci[2]))
#> Pooled SD: 13.7 mmHg
#> Cohen's d: -0.53 (95% CI -0.76 to -0.29)
```

A Cohen's d of 0.53 is a medium-sized effect by the usual convention. In plain words: "The program lowered week-12 systolic blood pressure by 7.2 mmHg on average (95% CI 4.0 to 10.4 mmHg), a medium effect of about half a standard deviation." The confidence interval carries the uncertainty, so we never report the point estimate alone. For more on choosing and reading these, see [effect size in R](Effect-Size-in-R.html).

Every trial report also shows where participants went, from randomization to analysis. This is the CONSORT-style flow, and reviewers expect it. We count patients at each stage from our own data.

```r title="Build the CONSORT-style participant flow"
flow <- data.frame(
  stage = c("Randomized", "Completed week 12",
            "Analyzed (ITT)", "Per-protocol set"),
  Control = c(
    sum(trial$arm == "Control"),
    sum(trial$arm == "Control" & trial$completed == 1),
    sum(trial$arm == "Control" & !is.na(trial$sbp12)),
    sum(trial$arm == "Control" & trial$completed == 1 & trial$adherent == 1)),
  Treatment = c(
    sum(trial$arm == "Treatment"),
    sum(trial$arm == "Treatment" & trial$completed == 1),
    sum(trial$arm == "Treatment" & !is.na(trial$sbp12)),
    sum(trial$arm == "Treatment" & trial$completed == 1 & trial$adherent == 1))
)
flow
#>               stage Control Treatment
#> 1        Randomized     150       150
#> 2 Completed week 12     142       141
#> 3    Analyzed (ITT)     142       141
#> 4  Per-protocol set     138       121
```

The table tells an honest story about attrition. Both arms started at 150. Completion was similar, but the per-protocol set drops much further in the treatment arm (121 versus 138), because adherence was harder there. That gap is exactly why the per-protocol analysis is a sensitivity check and not the headline.

![CONSORT-style participant flow with the real completion counts.](screenshots/Clinical-Comparison-Capstone-in-R-consort-flow.webp)

*Figure 3: CONSORT-style participant flow with the real completion counts.*

[WARNING]
**Per-protocol results can exaggerate a treatment because adherers are self-selected.** People who complete a program often differ from those who quit in ways you did not measure, so comparing adherent-treatment against adherent-control breaks the randomization that made the comparison fair. Report it, but let the intention-to-treat result lead.

What can this study not claim? It cannot promise the same 7 mmHg in a different population, since our patients were sampled from one recipe. It cannot attribute the effect to any single ingredient of the program, only to the whole package versus standard care. And being one simulated trial, it stands as one piece of evidence, not a final verdict. Naming these limits is not weakness, it is what makes the positive result credible.

**Try it:** For the CONSORT flow you often report how many were lost to follow-up in each arm. Count the patients per arm who did not complete week 12.

```r title="Your turn: count patients lost to follow-up"
# Lost to follow-up means completed == 0. Count per arm.
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Lost to follow-up solution"
ex_lost <- data.frame(
  arm = c("Control", "Treatment"),
  lost = c(sum(trial$arm == "Control" & trial$completed == 0),
           sum(trial$arm == "Treatment" & trial$completed == 0))
)
ex_lost
#>         arm lost
#> 1   Control    8
#> 2 Treatment    9
```

**Explanation:** Eight controls and nine treatment patients were lost, close to balanced, which is what you hope for. Very lopsided dropout would itself threaten the comparison.

</details>

## Practice Exercises

These bring several pieces of the workflow together. Use fresh variable names so you do not overwrite the objects built above.

### Exercise 1: Analyze the change from baseline

The change from baseline (week-12 SBP minus baseline SBP) is a common secondary endpoint. Using the `itt` data, compute the mean change for each arm and the difference between arms. Does the between-arm difference roughly match the primary effect of about 7 mmHg?

```r title="Exercise 1 starter"
# Compute itt$sbp12 - itt$base_sbp, average within arm with tapply(),
# then take Treatment minus Control.
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
my_change <- itt$sbp12 - itt$base_sbp
my_means <- tapply(my_change, itt$arm, mean)
my_diff <- as.numeric(my_means["Treatment"] - my_means["Control"])
round(my_means, 1)
round(my_diff, 1)
#>   Control Treatment
#>      -2.8      -9.7
#> [1] -6.9
```

**Explanation:** Control SBP fell 2.8 mmHg on its own (regression to the mean plus being in a trial), treatment fell 9.7 mmHg, and the 6.9 mmHg gap matches the primary analysis. Analyzing change and analyzing the week-12 level agree because randomization balanced the baseline.

</details>

### Exercise 2: A richer ANCOVA

Our age variable showed a small chance imbalance. Fit an ANCOVA that adjusts for baseline SBP plus age and BMI, and read off the treatment estimate and its standard error. Does adding those covariates change the effect much?

```r title="Exercise 2 starter"
# Fit lm(sbp12 ~ arm + base_sbp + age + bmi, data = itt).
# Then pull the "armTreatment" row of coef(summary(...)).
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
my_ancova2 <- lm(sbp12 ~ arm + base_sbp + age + bmi, data = itt)
round(coef(summary(my_ancova2))["armTreatment", c("Estimate", "Std. Error")], 3)
#>   Estimate Std. Error
#>     -7.155      1.009
```

**Explanation:** The adjusted effect is 7.2 mmHg lower with a standard error near 1.01, essentially unchanged from the baseline-only ANCOVA. When the extra covariates are balanced, adjusting for them barely moves the estimate, which is a good sign of a stable result.

</details>

### Exercise 3: Confirm your power by simulation

Trust the power calculation by testing it. Simulate 500 two-arm trials with 150 patients per arm, a true 8 mmHg effect, and an SD of 20, run a t-test on each, and report the fraction that reach significance. That fraction is the empirical power.

```r title="Exercise 3 starter"
# Write a function that simulates one trial and returns a t-test p-value,
# then use replicate() 500 times and compute mean(pvals < 0.05).
# Set a seed first for reproducibility.
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
set.seed(99)
sim_p <- function() {
  g <- rep(c("C", "T"), each = 150)
  y <- rnorm(300, ifelse(g == "T", -8, 0), 20)
  t.test(y ~ g)$p.value
}
pvals <- replicate(500, sim_p())
mean(pvals < 0.05)
#> [1] 0.934
```

**Explanation:** About 93% of the simulated trials detected the effect, so the design is well powered for an 8 mmHg difference at this sample size. Simulation is a general way to check power for any design, even ones with no tidy formula.

</details>

## Frequently Asked Questions

### What is the difference between intention-to-treat and per-protocol?

Intention-to-treat analyzes every patient in the arm they were randomized to, regardless of whether they adhered, so it preserves randomization and answers "does offering this program help." Per-protocol keeps only patients who followed the protocol, which answers "does the program help when followed" but breaks the randomized comparison because adherers self-select. Intention-to-treat is the primary analysis; per-protocol is a supporting sensitivity check.

### Why should I not run a t-test on baseline characteristics?

Because both arms were randomly drawn from the same population, any baseline difference is due to chance by construction, so a significance test answers a question with no meaning. This is the Table 1 fallacy. Report standardized mean differences instead, and flag any variable with an absolute SMD above 0.1 as one you may want to adjust for.

### When should I use ANCOVA instead of a plain t-test?

Use ANCOVA whenever you have a baseline measurement of the outcome (or another strong prognostic covariate) recorded before randomization. Adjusting for it removes a large share of patient-to-patient variation, which shrinks the standard error and raises power, usually without changing the point estimate. Name the covariates in the protocol so the adjustment is prespecified, not fished for.

### Should the primary test be one-sided or two-sided?

Almost always two-sided. A two-sided test allows for the possibility that the treatment could help or harm, which is the honest default, and it is what regulators and journals expect. We prespecified two-sided at alpha 0.05, and you should have a strong, written reason before choosing one-sided.

### Why report a confidence interval when the p-value is already tiny?

The p-value only tells you the result is unlikely under "no effect." The confidence interval tells you the range of effect sizes the data support, so you can judge whether the effect is large enough to matter, not just whether it is nonzero. A result can be highly significant yet too small to be worth acting on, and only the interval reveals that.

### Does this analysis prove the program causes lower blood pressure?

Within this one randomized trial, the comparison supports a causal reading, because randomization makes the arms exchangeable at baseline. But it cannot promise the same effect in a different population, cannot credit any single component of the program, and is one study rather than a body of evidence. State those limits alongside the result.

## Summary

This capstone ran a two-arm comparison the way a trial statistician would, holding a hard line between what was decided in advance and what the data suggested afterward.

| Stage | What we did | Key output |
|---|---|---|
| Protocol | Fixed hypothesis, endpoint, alpha, and primary test before data | The locked protocol table |
| Power | Sized the study from a 5 mmHg minimally important difference | 142 per arm for 80% power |
| Baseline | Compared arms with standardized mean differences, not tests | SMDs mostly below 0.1 |
| Primary | Prespecified Welch t-test, intention-to-treat | 7.2 mmHg lower (95% CI 4.0 to 10.4) |
| Robustness | Wilcoxon, ANCOVA, and per-protocol sensitivity checks | All agree near 7 mmHg |
| Reporting | Cohen's d, CONSORT flow, and honest limits | d = 0.53, medium effect |

The single most transferable idea is the spine: prespecify the endpoint, the test, and the alpha, then let the primary analysis lead and treat everything data-driven as support or exploration. That discipline is what separates a credible group comparison from a story fitted to the numbers, and it applies to any two-arm evaluation you run.

## References

1. R Core Team. `power.t.test` documentation, the stats package. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/power.t.test.html)
2. Robinson, D., Hayes, A., and Couch, S. broom: tidy statistical model output. [Link](https://broom.tidyverse.org/reference/tidy.htest.html)
3. Pijls, B. G. The Table 1 Fallacy: significance testing of baseline covariate imbalance in randomised trials. PMC. [Link](https://pmc.ncbi.nlm.nih.gov/articles/PMC11512581/)
4. Kassambara, A. ANCOVA in R: The Ultimate Practical Guide. Datanovia. [Link](https://www.datanovia.com/en/lessons/ancova-in-r/)
5. CONSORT Group. The CONSORT Statement for reporting randomised trials. [Link](https://www.consort-statement.org/)
6. EQUATOR Network. CONSORT reporting guidelines. [Link](https://www.equator-network.org/reporting-guidelines/consort/)
7. Wickham, H., Cetinkaya-Rundel, M., and Grolemund, G. R for Data Science, 2nd Edition. [Link](https://r4ds.hadley.nz/)

## Continue Learning

- [Statistical Power Analysis in R](Statistical-Power-Analysis-in-R.html) goes deeper on sizing a study before you collect a single data point.
- [ANCOVA in R](ANCOVA-in-R.html) unpacks the baseline-adjusted model that tightened our confidence interval.
- [Effect Size in R](Effect-Size-in-R.html) explains how to choose, compute, and interpret standardized effects like Cohen's d.
