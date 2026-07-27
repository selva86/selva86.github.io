---
title: "Random Intercepts and Slopes with lme4 in R"
slug: "Random-Intercepts-and-Slopes-in-R"
description: "Learn random intercepts and slopes in R with lme4. Fit lmer models on grouped data, read the random-effects table, get p-values, and understand partial pooling."
keywords: "random intercepts and slopes, lme4, mixed models in R, random slope model, lmer, partial pooling, random effects, sleepstudy example, hierarchical model, multilevel model"
mathjax: true
webr: true
date: "2026-07-27"
curriculum_id: "ST2-11.2"
post_type: "C"
auto_link_terms: "random intercepts and slopes|random intercept|random slope|mixed model|mixed models in R|linear mixed model|lme4|lmer|partial pooling|random effects|multilevel model|hierarchical model|variance components"
auto_link_case_sensitive: false
sidebar_section: "Statistics"
sidebar_title: "Random Intercepts & Slopes"
sidebar_order: "171"
difficulty: "Intermediate"
---

<p class="lead">Random intercepts and slopes let a single model give every group in your data its own baseline and its own trend, while still sharing what all the groups have in common. This guide builds that idea from scratch on one small dataset, shows you how to fit the model with the <code>lme4</code> package, and walks through every line of the output so you can read it with confidence. It uses base R plus <code>lme4</code>, and the examples run right here in your browser.</p>

## Why do repeated measurements need random intercepts and slopes?

Most real datasets are not a flat list of independent rows. They come in groups: several test scores per student, many visits per patient, repeated readings per sensor. When you measure the same subject more than once, those measurements are related to each other, and pretending they are independent leads you astray. Random intercepts and slopes are the tool that respects that grouping.

We will work with `sleepstudy`, a dataset that ships with `lme4`. It records the reaction time (in milliseconds) of 18 people across 10 days of restricted sleep. Each person was measured once per day, so every person contributes 10 related rows. Let's load it and look.

```r title="Load lme4 and the sleepstudy data"
library(lme4)
data("sleepstudy")
head(sleepstudy, 4)
#>   Reaction Days Subject
#> 1 249.5600    0     308
#> 2 258.7047    1     308
#> 3 250.8006    2     308
#> 4 321.4398    3     308
```

Each row is one measurement. `Reaction` is the outcome we want to explain, `Days` is how long the person has been sleep-deprived, and `Subject` is the person's ID. The first four rows are all subject 308, which is the grouping we care about. Let's confirm the shape of the data.

```r title="Count subjects and measurements"
c(subjects = nlevels(sleepstudy$Subject), measurements = nrow(sleepstudy))
#>     subjects measurements
#>           18          180
range(table(sleepstudy$Subject))
#> [1] 10 10
```

So we have 18 subjects and 180 measurements, which works out to exactly 10 rows per person. That balanced, repeated structure is the classic setting for mixed models. The naive approach is to ignore `Subject` entirely and fit one straight line to all 180 points.

```r title="Fit one pooled line for everyone"
pooled <- lm(Reaction ~ Days, data = sleepstudy)
round(coef(pooled), 1)
#> (Intercept)        Days
#>       251.4        10.5
```

This says the average person starts around 251 ms and slows by about 10.5 ms per day. Treating all 180 rows as one pile is called complete pooling, because it pools every subject together and forgets who is who. The problem is that people are not the same, and forcing them onto one line hides that.

To see how different people really are, we can go to the opposite extreme and fit a separate line for each subject. The `lmList()` helper in `lme4` does exactly that.

```r title="Fit a separate line per subject"
by_subject <- lmList(Reaction ~ Days | Subject, data = sleepstudy)
round(coef(by_subject)[1:5, ], 1)
#>     (Intercept) Days
#> 308       244.2 21.8
#> 309       205.1  2.3
#> 310       203.5  6.1
#> 330       289.7  3.0
#> 331       285.7  5.3
```

Look at the range. Subject 308 starts at 244 ms and degrades fast, at 21.8 ms per day, while subject 309 starts lower at 205 ms and barely changes, at 2.3 ms per day. The intercepts differ and the slopes differ. Fitting 18 completely separate lines is called no pooling, because each subject is estimated on its own with no help from the others.

![Three ways to handle grouped data: complete pooling, no pooling, and the partial pooling that mixed models use.](screenshots/Random-Intercepts-and-Slopes-in-R-pooling-spectrum.webp)

*Figure 1: Three ways to handle grouped data; mixed models take the middle path.*

Neither extreme is satisfying. Complete pooling throws away real differences between people, and no pooling throws away the fact that all 18 people are still humans doing the same task, so their lines should not be wildly independent. A mixed model takes the middle road, called partial pooling, and that is what random intercepts and slopes give you.

[KEY INSIGHT]
**A mixed model sits between one line for everyone and a separate line for each group.** It gives each subject its own intercept and slope, but pulls those personal estimates toward the group average, borrowing strength across subjects. That balance is why mixed models handle repeated measurements so well.

**Try it:** Pull out subject 309's own intercept and slope from the `by_subject` fit above. The row name you want is `"309"`.

```r title="Your turn: one subject's own line"
# Uncomment and fill in the row name for subject 309.
# round(coef(by_subject)["___", ], 1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="One subject line solution"
round(coef(by_subject)["309", ], 1)
#>     (Intercept) Days
#> 309       205.1  2.3
```

**Explanation:** Subject 309 starts at about 205 ms and slows by only 2.3 ms per day. Indexing the `lmList` coefficients by the subject ID gives that subject's private OLS line.

</details>

## What is a random intercept?

A random intercept is the simplest mixed model. It says every subject shares the same slope, but each one gets to shift the whole line up or down by their own amount. In plain terms, everyone degrades at the same rate, but some people are naturally faster or slower to begin with.

You fit it with `lmer()`, the mixed-model workhorse in `lme4`. The formula looks like an ordinary regression, `Reaction ~ Days`, plus a new piece in parentheses: `(1 | Subject)`. Read that as "give each Subject its own intercept," because `1` is R's shorthand for the intercept.

```r title="Fit a random-intercept model"
ri <- lmer(Reaction ~ Days + (1 | Subject), data = sleepstudy)
summary(ri)
#> Linear mixed model fit by REML ['lmerMod']
#> Formula: Reaction ~ Days + (1 | Subject)
#>    Data: sleepstudy
#>
#> REML criterion at convergence: 1786.5
#>
#> Scaled residuals:
#>     Min      1Q  Median      3Q     Max
#> -3.2257 -0.5529  0.0109  0.5188  4.2506
#>
#> Random effects:
#>  Groups   Name        Variance Std.Dev.
#>  Subject  (Intercept) 1378.2   37.12
#>  Residual              960.5   30.99
#> Number of obs: 180, groups:  Subject, 18
#>
#> Fixed effects:
#>             Estimate Std. Error t value
#> (Intercept) 251.4051     9.7467   25.79
#> Days         10.4673     0.8042   13.02
#>
#> Correlation of Fixed Effects:
#>      (Intr)
#> Days -0.371
```

This output has two halves, and telling them apart is the key skill. The bottom half, "Fixed effects," is the part that looks like ordinary regression. The average person starts at 251 ms and slows by 10.5 ms per day, which matches the pooled line from earlier. These are the effects that apply to everyone, so they are called fixed effects.

The top half, "Random effects," is the new part and it describes variation, not a single line. It reports two variances. The `Subject (Intercept)` standard deviation of 37.1 ms says that individual starting points scatter around the average intercept with a spread of about 37 ms. The `Residual` standard deviation of 31 ms is the day-to-day noise left over within a subject after the model accounts for the person.

[NOTE]
**A random effect is summarized by a variance, not by 18 separate numbers.** Instead of estimating an intercept for every subject as free parameters, the model estimates a single number, the spread of the subject intercepts, and assumes they follow a bell curve around the average. That is why the summary shows one standard deviation for `Subject`, not eighteen coefficients like the fixed effects in [Read-lm-Output-in-R](Read-lm-Output-in-R.html).

You can still recover each subject's own line. The `coef()` function combines the shared fixed effects with each subject's personal deviation.

```r title="See each subject's fitted line"
head(coef(ri)$Subject, 4)
#>     (Intercept)     Days
#> 308    292.1888 10.46729
#> 309    173.5556 10.46729
#> 310    188.2965 10.46729
#> 330    255.8115 10.46729
```

Notice the `Days` column is identical for every subject, at 10.47. That is the point of a random intercept model: the slope is shared, so the fitted lines are parallel, and only the intercept moves up or down. Subject 308 sits high at 292 ms and subject 309 sits low at 174 ms, but both slow at the same rate.

**Try it:** The `ranef()` function shows each subject's intercept deviation from the average, rather than the full intercept. Print the deviation for subject 330.

```r title="Your turn: one subject's intercept shift"
# ranef() returns deviations from the average intercept.
# ranef(ri)$Subject["___", , drop = FALSE]
```

<details>
<summary>Click to reveal solution</summary>

```r title="Intercept deviation solution"
ranef(ri)$Subject["330", , drop = FALSE]
#>     (Intercept)
#> 330    4.406442
```

**Explanation:** Subject 330 sits about 4.4 ms above the average intercept of 251.4 ms, which gives their personal intercept of about 255.8 ms, exactly what `coef()` reported.

</details>

## How do you add a random slope?

A random intercept lets people start in different places, but our earlier per-subject fit showed that people also degrade at different rates. Subject 308 lost 21.8 ms per day while subject 309 lost only 2.3. To let the slope vary by subject, you add the predictor inside the parentheses: `(Days | Subject)`. Read that as "give each Subject its own intercept and its own slope for Days."

```r title="Fit a random-slope model"
rs <- lmer(Reaction ~ Days + (Days | Subject), data = sleepstudy)
summary(rs)
#> Linear mixed model fit by REML ['lmerMod']
#> Formula: Reaction ~ Days + (Days | Subject)
#>    Data: sleepstudy
#>
#> REML criterion at convergence: 1743.6
#>
#> Scaled residuals:
#>     Min      1Q  Median      3Q     Max
#> -3.9536 -0.4634  0.0231  0.4634  5.1793
#>
#> Random effects:
#>  Groups   Name        Variance Std.Dev. Corr
#>  Subject  (Intercept) 612.10   24.741
#>           Days         35.07    5.922   0.07
#>  Residual             654.94   25.592
#> Number of obs: 180, groups:  Subject, 18
#>
#> Fixed effects:
#>             Estimate Std. Error t value
#> (Intercept)  251.405      6.825  36.838
#> Days          10.467      1.546   6.771
#>
#> Correlation of Fixed Effects:
#>      (Intr)
#> Days -0.138
```

The fixed effects barely moved: the average person still starts at 251 ms and slows by 10.5 ms per day. What changed is the random-effects block, which now has three lines instead of one. There is a spread for the intercept (24.7 ms), a brand new spread for the slope (5.9 ms per day), and a `Corr` column.

That slope spread is the heart of this model. It says subjects differ in their day-to-day degradation with a standard deviation of about 5.9 ms per day. Some people barely slow down while others slow much faster, and the model now measures how much that varies. The `Corr` value of 0.07 is the correlation between a subject's intercept and slope, telling you whether people who start slow also tend to degrade fast; here it is near zero, so the two are roughly unrelated.

The formula piece `(Days | Subject)` is doing several jobs at once, so it helps to break it apart.

![What (Days given Subject) tells lmer to estimate: a random intercept plus a random slope, along with the correlation between them.](screenshots/Random-Intercepts-and-Slopes-in-R-formula-anatomy.webp)

*Figure 2: What each piece of (Days | Subject) tells lmer to estimate.*

[WARNING]
**The bar term always adds a random intercept, even when you only name a slope.** Writing `(Days | Subject)` gives you a random slope for `Days`, a random intercept, and the correlation between them, all three at once. If you truly want a random slope with no random intercept, which is rare, you must write `(0 + Days | Subject)`. Most of the time the default with the intercept is what you want.

If you like seeing the model written out, here is what a random-intercept-and-slope model says for reaction time $y$ of subject $j$ on day $i$. If formulas are not your thing, skip past the equation to the next code block; the summary above already gives you the same information.

$$y_{ij} = (\beta_0 + b_{0j}) + (\beta_1 + b_{1j})\,x_{ij} + \epsilon_{ij}$$

Where:

- $\beta_0$ and $\beta_1$ = the fixed intercept and slope, shared by everyone
- $b_{0j}$ and $b_{1j}$ = subject $j$'s random shifts away from that shared intercept and slope
- $x_{ij}$ = the number of days of sleep deprivation
- $\epsilon_{ij}$ = the leftover within-subject noise

The random shifts $b_{0j}$ and $b_{1j}$ are the numbers summarized by those two standard deviations in the output. Now let's see each subject's full line, intercept and slope together.

```r title="See each subject's intercept and slope"
head(coef(rs)$Subject, 4)
#>     (Intercept)      Days
#> 308    253.6637 19.666262
#> 309    211.0064  1.847605
#> 310    212.4447  5.018429
#> 330    275.0957  5.652936
```

Now the `Days` column varies. Subject 308 degrades at 19.7 ms per day while subject 309 barely moves at 1.8. Compare these to the separate-lines fit from the first section: 308 was 21.8 and 309 was 2.3. The mixed model gives numbers in the same neighborhood but nudged toward the group, which is the partial pooling we will unpack soon.

**Try it:** From the random-slope model, read subject 308's personal slope for `Days` out of `coef(rs)$Subject`. Round it to two decimals.

```r title="Your turn: one subject's slope"
# Index coef(rs)$Subject by the subject row and the "Days" column.
# round(coef(rs)$Subject["___", "Days"], 2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="One subject slope solution"
round(coef(rs)$Subject["308", "Days"], 2)
#> [1] 19.67
```

**Explanation:** Subject 308 slows by about 19.7 ms per day, the steepest degradation among the people we have looked at, and well above the average of 10.5.

</details>

## How do you read the random-effects table and get p-values?

The random-effects table is where beginners get stuck, so let's slow down on it. The cleanest way to see just those numbers is `VarCorr()`, which strips away the rest of the summary.

```r title="Show the variance components"
print(VarCorr(rs), comp = c("Variance", "Std.Dev."))
#>  Groups   Name        Variance Std.Dev. Corr
#>  Subject  (Intercept) 612.100  24.7407
#>           Days         35.072   5.9221  0.066
#>  Residual             654.940  25.5918
```

Each row is a source of variation. The intercept standard deviation of 24.7 ms is how much people differ in their starting reaction time. The `Days` standard deviation of 5.9 is how much they differ in their daily degradation. The residual of 25.6 ms is the noise left inside a subject once their personal line is accounted for. Reading these standard deviations, rather than the variances, keeps everything in the original millisecond units.

You may have noticed the summary printed no p-values for the fixed effects, only `t value`. That is deliberate. The author of `lme4` argues that the exact degrees of freedom for these t statistics are not well defined for mixed models, so the package refuses to guess. You have two solid ways to get significance instead.

The first is a confidence interval, which many statisticians prefer anyway. The `confint()` function computes intervals for both the fixed effects and the variance components.

```r title="Confidence intervals for every parameter"
confint(rs, oldNames = FALSE)
#>                                    2.5 %      97.5 %
#> sd_(Intercept)|Subject        14.3813850  37.7158318
#> sd_Days|Subject                3.8011641   8.7533825
#> cor_Days.(Intercept)|Subject  -0.4815008   0.6849863
#> sigma                         22.8982669  28.8579965
#> (Intercept)                  237.6806955 265.1295147
#> Days                           7.3586533  13.5759188
```

Read the bottom two rows first, since they are the fixed effects. The `Days` interval runs from 7.4 to 13.6 and does not include zero, so the average degradation is clearly real. The `sd_Days|Subject` interval runs from 3.8 to 8.8 and also stays well above zero, which is early evidence that subjects genuinely differ in their slopes, not just their intercepts.

If you want an actual p-value in the familiar format, the `lmerTest` package adds one by approximating the degrees of freedom. It is a standard CRAN package, but it is not part of the browser sandbox here, so run this block in a local R session.

```r-static title="Get p-values with lmerTest locally"
library(lmerTest)
rs_p <- lmer(Reaction ~ Days + (Days | Subject), data = sleepstudy)
coef(summary(rs_p))
#>              Estimate Std. Error       df   t value     Pr(>|t|)
#> (Intercept) 251.40510   6.824597 16.99973 36.838090 1.171558e-17
#> Days         10.46729   1.545790 16.99998  6.771481 3.263824e-06
```

Now the `Days` effect carries a p-value of about 0.000003, comfortably significant. Notice the estimates and standard errors are identical to the plain `lme4` fit; `lmerTest` only adds the degrees-of-freedom column and the resulting p-value, so nothing else about your model changes.

[TIP]
**Report a confidence interval alongside or instead of a p-value.** An interval like "10.5 ms per day, 95 percent CI 7.4 to 13.6" tells the reader the effect size and its uncertainty in one line, which is more informative than a bare p-value. The `confint()` output above gives you these for free.

**Try it:** The residual standard deviation is the within-subject noise. Pull it straight out of the fitted model with `sigma()` and round it to two decimals.

```r title="Your turn: the residual noise"
# sigma() returns the residual standard deviation of a fitted model.
# round(sigma(___), 2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Residual noise solution"
round(sigma(rs), 2)
#> [1] 25.59
```

**Explanation:** After each subject's own line is fit, about 25.6 ms of day-to-day scatter remains. That matches the `Residual` row in the variance table.

</details>

## Random intercepts vs random slopes: which do you need?

You now have two models: `ri` with only random intercepts, and `rs` with random intercepts and slopes. Adding a random slope costs extra parameters, so you should only keep it if it earns its place. The clean way to decide is a likelihood ratio test, which asks whether the bigger model fits significantly better than the smaller one. The `anova()` function runs it.

```r title="Compare the two models"
anova(ri, rs)
#> Data: sleepstudy
#> Models:
#> ri: Reaction ~ Days + (1 | Subject)
#> rs: Reaction ~ Days + (Days | Subject)
#>    npar    AIC    BIC  logLik -2*log(L)  Chisq Df Pr(>Chisq)
#> ri    4 1802.1 1814.8 -897.04    1794.1
#> rs    6 1763.9 1783.1 -875.97    1751.9 42.139  2  7.072e-10 ***
```

The test statistic is a chi-square of 42.1 on 2 degrees of freedom, with a p-value of 7e-10. That is tiny, so the random-slope model fits far better and you should keep it. In plain terms, subjects really do differ in how fast they degrade, not just in where they start, so forcing a shared slope would be wrong here.

![A short decision guide for choosing between a random intercept and a random slope.](screenshots/Random-Intercepts-and-Slopes-in-R-choose-flow.webp)

*Figure 3: Deciding between a random intercept and a random slope.*

[NOTE]
**anova() on lme4 models refits with maximum likelihood, so its AIC differs from AIC().** The comparison above prints AIC values of 1802 and 1764, while calling `AIC(ri, rs)` directly gives 1794 and 1756. The gap is because `lmer` fits with REML by default for accurate variance estimates, but a likelihood ratio test needs plain maximum likelihood, so `anova()` quietly refits both models that way. Both routes agree the random-slope model wins.

There is one subtlety worth knowing. This test checks whether a variance is zero, and zero sits on the edge of what a variance can be, since variances cannot go negative. That makes the standard p-value slightly conservative, meaning the true p-value is even smaller than reported. So when `anova()` says the random slope is significant, you can trust it comfortably.

**Try it:** Compare the two models by AIC instead, using `AIC()` directly on both fitted objects. Lower AIC is better.

```r title="Your turn: compare by AIC"
# Pass both fitted models to AIC() in one call.
# AIC(___, ___)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Compare by AIC solution"
AIC(ri, rs)
#>    df      AIC
#> ri  4 1794.465
#> rs  6 1755.628
```

**Explanation:** The random-slope model scores 1756 against 1794 for the intercept-only model, an improvement of nearly 40 points, which strongly favors keeping the random slope.

</details>

## How does partial pooling shrink each subject's line?

We keep saying a mixed model pulls each subject toward the group average. Now let's actually watch it happen by lining up the two extremes: the no-pooling slopes from the separate per-subject fits, and the partial-pooling slopes from the mixed model.

```r title="Compare no-pooling and partial-pooling slopes"
no_pool <- coef(by_subject)[c("308", "335", "331"), ]
partial <- coef(rs)$Subject[c("308", "335", "331"), ]
round(data.frame(no_pool_slope = no_pool$Days, partial_slope = partial$Days,
                 row.names = c("308", "335", "331")), 2)
#>     no_pool_slope partial_slope
#> 308         21.76         19.67
#> 335         -2.88         -0.28
#> 331          5.27          7.40
```

Every partial-pooling slope is closer to the group average than its no-pooling twin. The population slope is 10.5 ms per day, so watch the pull toward it. Subject 308's steep 21.8 is reined in to 19.7, subject 335's odd negative slope of -2.9 is pulled up to -0.3, and subject 331's shallow 5.3 is nudged up to 7.4. Extreme subjects move the most, and subjects near the average barely move.

```r title="The population average line"
round(fixef(rs), 2)
#> (Intercept)        Days
#>      251.41       10.47
```

The `fixef()` values are the center of gravity that every subject is pulled toward. This is why partial pooling is so useful: a subject with a noisy or extreme personal estimate gets stabilized by the group, while a subject with a clear signal keeps most of their own character.

[KEY INSIGHT]
**Shrinkage borrows strength from the whole group to protect against overreacting to one subject.** A subject who happens to look extreme on 10 noisy days is probably not as extreme as they appear, so the model discounts the surprise and pulls them back toward what everyone else is doing. This is the single biggest reason mixed models predict new data better than fitting each group alone.

**Try it:** Compute how far subject 335's slope was shrunk, the no-pooling slope minus the partial-pooling slope. Use the row names from the block above.

```r title="Your turn: measure the shrinkage"
# Subtract the partial-pooling slope from the no-pooling slope for subject 335.
# round(coef(by_subject)["335", "Days"] - coef(rs)$Subject["335", "Days"], 2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Measure the shrinkage solution"
round(coef(by_subject)["335", "Days"] - coef(rs)$Subject["335", "Days"], 2)
#> [1] -2.6
```

**Explanation:** Subject 335's slope moved by 2.6 ms per day toward the group average. The negative sign shows the no-pooling estimate was below the pooled one, so shrinkage pulled it upward.

</details>

## Practice Exercises

These exercises combine several ideas from the guide. Try each before opening the solution. They use their own variable names, prefixed with `my_`, so they will not disturb the models you fit above.

### Exercise 1: Fit, compare, and find the steepest subject

Using `sleepstudy`, fit both a random-intercept model and a random-slope model, compare them with AIC, then find which subject has the steepest fitted slope in the random-slope model.

```r title="Exercise 1 starter"
# 1. Fit my_ri with (1 | Subject) and my_rs with (Days | Subject).
# 2. Compare them with AIC().
# 3. From coef(my_rs)$Subject, find the row name with the largest Days value.
#    Hint: which.max() returns the position of the maximum.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
my_ri <- lmer(Reaction ~ Days + (1 | Subject), data = sleepstudy)
my_rs <- lmer(Reaction ~ Days + (Days | Subject), data = sleepstudy)
AIC(my_ri, my_rs)
#>       df      AIC
#> my_ri  4 1794.465
#> my_rs  6 1755.628
my_slopes <- coef(my_rs)$Subject
rownames(my_slopes)[which.max(my_slopes$Days)]
#> [1] "308"
```

**Explanation:** The random-slope model wins on AIC by nearly 40 points, and subject 308 has the steepest degradation of all 18 people, slowing fastest under sleep deprivation.

</details>

### Exercise 2: A random slope on a different dataset

The built-in `ChickWeight` data tracks the `weight` of chicks over `Time`, grouped by `Chick`. Fit a random-intercept-and-slope model of weight on time, then print the fixed effects and the variance components. This proves the same recipe works on any grouped dataset.

```r title="Exercise 2 starter"
# Fit weight ~ Time + (Time | Chick) with lmer on ChickWeight.
# Then print fixef() and VarCorr() of the fit.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
my_chick <- lmer(weight ~ Time + (Time | Chick), data = ChickWeight)
round(fixef(my_chick), 2)
#> (Intercept)        Time
#>       29.18        8.45
print(VarCorr(my_chick), comp = "Std.Dev.")
#>  Groups   Name        Std.Dev. Corr
#>  Chick    (Intercept) 11.8549
#>           Time         3.7608  -0.951
#>  Residual             12.7869
```

**Explanation:** The average chick starts near 29 grams and gains about 8.5 grams per unit time. The `Time` standard deviation of 3.76 shows chicks differ a lot in growth rate, and the strong negative correlation of -0.95 means chicks that start heavier tend to grow more slowly.

</details>

### Exercise 3: Rebuild a subject's line by hand

Confirm you understand where each subject's line comes from. For subject 309 in the random-slope model `rs`, add the fixed effects to that subject's random deviations from `ranef()`, and check that the result matches `coef(rs)$Subject`.

```r title="Exercise 3 starter"
# 1. Get fixef(rs) for the shared intercept and slope.
# 2. Get ranef(rs)$Subject["309", ] for subject 309's deviations.
# 3. Add them element by element, then compare to coef(rs)$Subject["309", ].
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
my_fix <- fixef(rs)
my_re  <- ranef(rs)$Subject["309", ]
my_line <- c(intercept = my_fix[["(Intercept)"]] + my_re[["(Intercept)"]],
             slope     = my_fix[["Days"]] + my_re[["Days"]])
round(my_line, 2)
#> intercept     slope
#>    211.01      1.85
round(unlist(coef(rs)$Subject["309", ]), 2)
#> (Intercept)        Days
#>      211.01        1.85
```

**Explanation:** Adding subject 309's random deviations to the fixed effects reproduces `coef()` exactly. This is the whole idea in one line: a subject's fitted line is the population line plus that subject's personal shifts.

</details>

## Frequently Asked Questions

### What is the difference between a fixed effect and a random effect?

A fixed effect is a single value estimated for the whole dataset, like the average slope of 10.5 ms per day that applies to everyone. A random effect is a set of group-specific deviations that are assumed to follow a bell curve, summarized by a variance rather than by one coefficient per group. Use a fixed effect when you care about the specific levels, and a random effect when the levels are a sample from a larger population, like these 18 subjects standing in for people in general.

### When should I use (1 | group) versus (x | group)?

Use `(1 | group)` when groups differ only in their baseline level, so parallel lines are enough. Use `(x | group)`, which is short for `(1 + x | group)`, when the effect of `x` itself varies by group, so the lines need different slopes. A likelihood ratio test with `anova()` tells you whether the extra random slope is worth its cost, as it was in this guide.

### Why does lme4 not print p-values?

The exact degrees of freedom for the t statistics in a mixed model are not well defined, so `lme4` deliberately reports the t value without a p-value rather than print a number it cannot justify. To get a p-value, load the `lmerTest` package, which approximates the degrees of freedom, or report a confidence interval from `confint()` instead. Many analysts prefer the confidence interval because it shows the effect size and its uncertainty together.

### What does a singular fit or boundary warning mean?

A "boundary (singular) fit" warning means the model pushed a variance to zero or a correlation to plus or minus one, usually because the random-effects structure is too complex for the data to support. The fix is to simplify: drop the correlation with `(Days || Subject)`, or remove the random slope and keep only `(1 | Subject)`. The full random-slope model on `sleepstudy` fits cleanly, so you will not see the warning here, but you will meet it on smaller datasets.

### How many groups do I need for a random effect?

A rough rule of thumb is at least 5 to 10 groups, and ideally more than 20, before a variance component is estimated reliably. With very few groups, the spread of the random effect is hard to pin down, and you are often better off treating the grouping variable as a fixed effect with dummy variables. The 18 subjects in `sleepstudy` sit comfortably in the workable range. Everything in this guide also runs unchanged in a local RStudio session; install `lme4` once with `install.packages("lme4")`.

## Summary

Random intercepts and slopes let one model give every group its own line while sharing an overall trend, which is exactly what repeated-measurement data needs. You fit them with `lmer()`, choose the random structure with a likelihood ratio test, and read variation from the random-effects table rather than from a coefficient per group.

| Formula piece | What it does | When to use it |
|---|---|---|
| `Days` | Fixed effect: one shared slope for everyone | Always, for the average trend |
| `(1 \| Subject)` | Random intercept: each group shifts up or down | Groups differ in baseline only |
| `(Days \| Subject)` | Random intercept and slope, correlated | Groups differ in the effect too |
| `(0 + Days \| Subject)` | Random slope with no random intercept | Rare, only when baseline is truly shared |

![An overview of the whole workflow, from why mixed models to reading the output and choosing a structure.](screenshots/Random-Intercepts-and-Slopes-in-R-overview.webp)

*Figure 4: The whole workflow at a glance.*

The biggest ideas to carry with you: fixed effects describe the average and random effects describe the spread, the bar term `(x | group)` quietly adds a random intercept too, and partial pooling shrinks extreme groups toward the average so your estimates stay sensible.

## References

1. Bates, D., Mächler, M., Bolker, B., & Walker, S. (2015). *Fitting Linear Mixed-Effects Models Using lme4.* Journal of Statistical Software, 67(1). [Link](https://www.jstatsoft.org/article/view/v067i01) - the canonical paper behind `lme4`, with the theory and syntax for `lmer()`.
2. lme4 package vignette: *Fitting Linear Mixed-Effects Models Using lme4.* [Link](https://cran.r-project.org/web/packages/lme4/vignettes/lmer.pdf) - the official walkthrough, including the `sleepstudy` example used here.
3. lme4 on CRAN. [Link](https://cran.r-project.org/package=lme4) - the package home, with the reference manual and installation notes.
4. Clark, M. *Mixed Models with R: More Random Effects.* [Link](https://m-clark.github.io/mixed-models-with-R/random_slopes.html) - a clear, extended treatment of random slopes and variance components.
5. Mahr, T. *Plotting Partial Pooling in Mixed-Effects Models.* [Link](https://www.tjmahr.com/plotting-partial-pooling-in-mixed-effects-models/) - the best visual explanation of shrinkage, built on `sleepstudy`.
6. DeBruine, L., & Barr, D. J. *Learning Statistical Models Through Simulation in R.* [Link](https://psyteachr.github.io/stat-models-v1/introducing-linear-mixed-effects-models.html) - a simulation-first introduction to mixed models.
7. Bolker, B. *GLMM FAQ.* [Link](https://bbolker.github.io/mixedmodels-misc/glmmFAQ.html) - practical answers on p-values and singular fits, plus how many groups you really need.

## Continue Learning

- [How to Read lm() Output in R](Read-lm-Output-in-R.html) - the fixed-effects half of a mixed model is just ordinary regression, and this covers how to read it.
- [Linear Regression in R](Linear-Regression.html) - the straight-line model that random intercepts and slopes extend to grouped data.
- [GLM Diagnostics in R](GLM-Diagnostics-in-R.html) - once your model is fit, these checks confirm its assumptions hold.
