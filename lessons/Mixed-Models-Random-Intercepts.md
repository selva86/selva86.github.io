---
title: "Advanced Regression Lesson 12: Mixed Models and Random Intercepts"
catalog_blurb: "How to handle data that comes in groups, giving each group its own baseline."
description: "Model grouped data in R with lme4: fit random intercepts so each group gets its own baseline, use partial pooling to steady small groups, and read the ICC."
keywords: "mixed models, random intercepts, partial pooling, lme4, lmer, multilevel model, hierarchical model, intraclass correlation, ICC, clustered data, R"
post_type: "LESSON"
curriculum_id: "6.130.12"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-reg-glm-expert"
course_title: "Advanced Regression and GLMs"
course_lesson: "12"
course_total: "13"
course_landing: "R-Advanced-Regression-Course.html"
course_next: "Mixed-Models-Random-Slopes-and-GLMMs.html"
course_prev: "Beta-and-Ordinal-Regression.html"
---

=== step === cover
::eyebrow Lesson 12 of 13
## Mixed Models and Random Intercepts

Every model so far in this course has leaned on one quiet assumption: that your rows are independent, each one a fresh and unrelated draw. Real data rarely obliges.

Maya, the customer-success data scientist from Lesson 11, has 184 customer accounts. They are not scattered at random: they belong to 12 sales **regions**, and each region has its own local support team, its own culture, its own baseline happiness. Two accounts in the same region are more alike than two accounts picked from different regions. Treat them as independent and you fool yourself about how much you really know.

This lesson gives every group its own intercept while still letting the groups learn from one another, an idea called **partial pooling**. Drag the slider below to feel it: several groups, some tiny and noisy, being gently pulled toward a shared average.

By the end of this lesson you will be able to:

- Say why grouped data breaks the independence assumption, and why ignoring the groups makes your estimate of the overall level look more certain than it is
- Write and fit a **random-intercept** model with `lmer`, and read its fixed effects and its two variance components
- Explain **partial pooling** (why small groups shrink toward the average) and compute the **intraclass correlation** that measures how grouped your data is

**Prerequisites:** you can fit and read [a linear model](OLS-Regression-from-Scratch.html), and you are comfortable reading a coefficient, a standard error, and a variance.

::widget shrinkage-pool {}

=== step === concept
::eyebrow The setup
## When your data comes in groups

Here is Maya's book of accounts, built right here so every line on this page runs in interactive R. Each account has its hours of guided `onboarding` (the same lever from Lesson 11) and a monthly `satisfaction` score from 0 to 100. Crucially, each account belongs to one of 12 `region`s, and every region carries its own hidden baseline (some regions are simply happier places to be a customer):

```r
set.seed(2026)
sizes  <- c(38, 30, 25, 22, 18, 15, 12, 9, 6, 4, 3, 2)   # accounts per region: some big, some tiny
region <- factor(rep(sprintf("R%02d", 1:12), times = sizes))
n      <- length(region)                                  # 184 accounts in all
region_base  <- rnorm(12, 0, 6)                           # each region's own baseline offset
onboarding   <- round(runif(n, 0, 8), 1)                  # hours of guided onboarding
satisfaction <- 62 + 2.5 * onboarding +                   # grand baseline + onboarding effect
                region_base[as.integer(region)] +         # the region's own shift, up or down
                rnorm(n, 0, 5)                             # account-level noise
accounts <- data.frame(region, onboarding, satisfaction = round(satisfaction, 1))
table(accounts$region)          # how many accounts each region has
#> 
#> R01 R02 R03 R04 R05 R06 R07 R08 R09 R10 R11 R12 
#>  38  30  25  22  18  15  12   9   6   4   3   2 
```

Notice the imbalance: region R01 has 38 accounts to average over, while R12 has just 2. That imbalance is the whole drama of this lesson. Plot satisfaction against onboarding and colour by region, and a second fact appears: the points climb with onboarding (the effect Maya cares about), but each region's cloud sits at its **own height**. Those heights are the baselines we have to account for.

::widget chart-plotter {"data":[{"x":0.5,"y":73,"fill":"West"},{"x":2,"y":76,"fill":"West"},{"x":3.5,"y":80,"fill":"West"},{"x":5,"y":85,"fill":"West"},{"x":6.5,"y":87,"fill":"West"},{"x":7.5,"y":90,"fill":"West"},{"x":0.3,"y":64,"fill":"East"},{"x":1.8,"y":68,"fill":"East"},{"x":3,"y":71,"fill":"East"},{"x":4.5,"y":75,"fill":"East"},{"x":6,"y":79,"fill":"East"},{"x":7.8,"y":83,"fill":"East"},{"x":0.8,"y":59,"fill":"South"},{"x":2.2,"y":62,"fill":"South"},{"x":3.6,"y":66,"fill":"South"},{"x":5.1,"y":69,"fill":"South"},{"x":6.4,"y":73,"fill":"South"},{"x":7.2,"y":75,"fill":"South"},{"x":1,"y":84,"fill":"Nordics"},{"x":2.5,"y":88,"fill":"Nordics"},{"x":4,"y":91,"fill":"Nordics"},{"x":1.5,"y":85,"fill":"Nordics"},{"x":3,"y":89,"fill":"Nordics"},{"x":0.5,"y":83,"fill":"Nordics"}],"geoms":["point"],"x":"onboarding","y":"satisfaction","code":{"point":"ggplot(region_sample, aes(onboarding, satisfaction, colour = group)) +\n  geom_point(size = 2) +\n  labs(colour = \"region\", y = \"satisfaction (CSAT)\")"}}

Two accounts from the same region share that region's height, so they are **correlated**: knowing one tells you something about the other. That is precisely the independence assumption breaking, and ordinary regression has no idea it is happening.

=== step === concept
::eyebrow The two easy wrong answers
## Ignore the groups, or give each its own

Faced with grouped data, there are two tempting shortcuts, and both are traps.

**Complete pooling** ignores region entirely and fits one line to all 184 accounts:

```r
pool <- lm(satisfaction ~ onboarding, data = accounts)
round(summary(pool)$coefficients, 3)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)   60.381      0.968  62.378        0
#> onboarding     2.354      0.217  10.857        0
```

Those standard errors are computed as if all 184 accounts were independent. They are not: accounts cluster inside regions, so you hold far fewer truly independent pieces of information than 184. Counting correlated observations as if each were fresh evidence has a name, **pseudoreplication**, and it quietly distorts your uncertainty. Hold on to that intercept standard error of 0.968; in a few steps the honest model will tell a different story about it.

**No pooling** swings the other way: give every region its own separate intercept (a fixed dummy per region, or a separate fit per region). Now region R12, with its **two** accounts, gets an intercept estimated from two noisy points, and the model trusts it completely. You also spend 12 parameters on baselines alone.

One shortcut throws the groups away; the other trusts each group blindly, even the ones with almost no data. The right answer lives in between, and the slider you met on the cover was showing it.

=== step === quiz
::eyebrow Check yourself
## Why not just fit one line?

Maya fits `lm(satisfaction ~ onboarding)` on all 184 accounts, ignoring region, and reports the result. Those 184 accounts actually come from just 12 regions, and accounts in the same region are correlated. What is the main problem with her reported result?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Nothing is wrong: more rows always means a better, more trustworthy estimate ::no More rows only help if they are independent. Correlated accounts carry overlapping information, so 184 clustered accounts are worth far less than 184 independent ones.
- Her reported precision is inflated: she is treating 184 correlated accounts as if they were 184 independent ones, so she knows the overall level less well than her small standard error claims ::ok Right. That is pseudoreplication: clustering means fewer independent pieces of information than the row count suggests, so the lm overstates how precisely it pins down the overall level (its intercept standard error is too small).
- The onboarding coefficient is guaranteed to be biased toward zero ::no Ignoring region mainly distorts the uncertainty, not necessarily the slope estimate itself. The clearest, most reliable damage is standard errors that are too small.
- Nothing can be done unless every region has the same number of accounts ::no Mixed models handle unbalanced groups gracefully; unequal region sizes are exactly what partial pooling is built for.

=== step === concept
::eyebrow The idea
## The random-intercept model

Partial pooling comes from one elegant change to the linear model. Write the satisfaction of account \(i\) in region \(j\) as:

\[ y_{ij} = \beta_0 + \beta_1\,x_{ij} + u_j + \varepsilon_{ij}, \]

and read it piece by piece. \(y_{ij}\) is the satisfaction of the \(i\)-th account in region \(j\); \(x_{ij}\) is that account's onboarding hours. \(\beta_0\) is the **grand intercept** (the overall baseline across all regions) and \(\beta_1\) is the onboarding slope, shared by every region. So far this is ordinary regression.

The new term is \(u_j\): a single number for each region that shifts its whole line **up or down** from the grand baseline. R12's line might sit 9 points below average, R01's 5 points above. The residual \(\varepsilon_{ij}\) is the leftover account-level noise, as usual.

Here is the move that makes it a *mixed* model. Instead of estimating 12 free intercepts, we assume the region shifts are themselves draws from a normal distribution:

\[ u_j \sim N(0, \tau^2), \qquad \varepsilon_{ij} \sim N(0, \sigma^2). \]

\(\tau^2\) ("tau squared") is the **between-region variance**, how much regions differ from one another, and \(\sigma^2\) ("sigma squared") is the **within-region variance**, how much accounts differ inside a region. We estimate just these two variances, not 12 separate intercepts. The \(\beta_0, \beta_1\) are called **fixed effects** (one value each); the \(u_j\) are **random effects** (drawn from a distribution).

[KEY INSIGHT]
By treating the region shifts as a sample from \(N(0, \tau^2)\), the model estimates ONE number, \(\tau^2\), instead of 12 loose intercepts. That single shared distribution is what lets a small region borrow strength from all the others, rather than standing alone on its two data points.

=== step === concept
::eyebrow In R
## Fit it with lmer

The `lme4` package fits this model. Its formula adds one new piece to the familiar `y ~ x`: the term `(1 | region)`. Read it as "let the intercept (the `1`) vary by (the `|`) region". That single term is the whole random-intercept model.

```r
library(lme4)
m1 <- lmer(satisfaction ~ onboarding + (1 | region), data = accounts)
summary(m1)
#> Linear mixed model fit by REML ['lmerMod']
#> Formula: satisfaction ~ onboarding + (1 | region)
#>    Data: accounts
#> 
#> REML criterion at convergence: 1119.9
#> 
#> Scaled residuals: 
#>      Min       1Q   Median       3Q      Max 
#> -2.60984 -0.63786 -0.08588  0.67629  2.66212 
#> 
#> Random effects:
#>  Groups   Name        Variance Std.Dev.
#>  region   (Intercept) 23.59    4.857   
#>  Residual             22.11    4.702   
#> Number of obs: 184, groups:  region, 12
#> 
#> Fixed effects:
#>             Estimate Std. Error t value
#> (Intercept)  58.9846     1.5996   36.87
#> onboarding    2.4290     0.1536   15.81
```

Two blocks matter (you can read past the top `REML` line, which just names the default method `lmer` uses to estimate the variances). **Random effects** reports the two variances you just met: the `region` row is \(\tau^2\) (here 23.6, with its square root 4.86 shown as a standard deviation), and `Residual` is \(\sigma^2\) (22.1). Regions differ about as much as accounts within a region do. **Fixed effects** is the ordinary coefficient table: the grand intercept \(\beta_0\) and the shared onboarding slope \(\beta_1\). One thing is missing next to them, a p-value column: degrees of freedom are genuinely hard to pin down for mixed models, so `lmer` reports the t value and leaves the call to you (as a rough guide, a t value beyond about 2 marks a clear effect).

Now compare the standard errors with the complete-pooling `lm`, because they move in opposite directions and each direction teaches something. The intercept's standard error **grew**, from 0.97 to 1.60: the `lm`, treating 184 correlated accounts as independent, had overstated how precisely it knew the overall baseline, exactly the pseudoreplication trap. The onboarding slope's standard error **shrank**, from 0.217 to 0.154: because onboarding varies *within* a region, lifting the region-to-region differences out into the random intercept stripped away noise that had been blurring the slope, so it is now measured more sharply.

[KEY INSIGHT]
A mixed model does not simply inflate your uncertainty; it gets it right. Whether a quantity is measured between groups (the overall level) or within them (a predictor that varies inside each group) decides which way its standard error moves.

=== step === tryit
::eyebrow Your turn
## Write the random-intercept term

Maya wants each region to have its own baseline satisfaction while sharing one onboarding slope. Complete the formula with the random-intercept term for `region`, then run it.

```r
library(lme4)
m1 <- lmer(satisfaction ~ onboarding + ____, data = accounts)
summary(m1)
```
::check {"regex":"\\(\\s*1\\s*\\|\\s*region\\s*\\)","gate":true,"difficulty":"beginner","ok":"Right. (1 | region) lets the intercept vary by region: one baseline per region, drawn from a shared normal distribution, with the onboarding slope held common across regions.","no":"You want the intercept to vary by region: add (1 | region). The 1 is the intercept, the bar means varies by, and region is the grouping factor."}
::solution
```r
library(lme4)
m1 <- lmer(satisfaction ~ onboarding + (1 | region), data = accounts)
```

=== step === widget
::eyebrow The heart of it
## Partial pooling and shrinkage

This is what `lmer` did under the hood. Each group starts at its own raw average (the faint dots), but the model pulls every estimate toward the grand mean, and it pulls the **small, noisy groups hardest**. Slide from "no pooling" (trust each group alone) to "complete pooling" (one number for all) and watch the tiny groups swing while the big ones barely move. It is drawn here as eight clinics, but the logic is identical to Maya's regions.

::widget shrinkage-pool {}

The amount each group is pulled is not arbitrary. A region's estimate is a precision-weighted blend of its own mean and the grand mean, with weight

\[ \lambda_j = \frac{n_j\,\tau^2}{n_j\,\tau^2 + \sigma^2}, \]

where \(n_j\) is the number of accounts in region \(j\), \(\tau^2\) the between-region variance and \(\sigma^2\) the within-region variance. When a region is large (\(n_j\) big), \(\lambda_j\) sits near 1 and the model trusts the region's own mean. When it is tiny (like R12's two accounts), \(\lambda_j\) is small and the estimate is pulled most of the way back to the grand mean. Small groups borrow strength from the whole, so you get a sensible number for R12 without pretending its two points are gospel.

[KEY INSIGHT]
Partial pooling is automatic regularization for grouped data: more honest than no pooling (which overfits tiny groups) and more informative than complete pooling (which erases real group differences).

=== step === concept
::eyebrow One number for "how grouped?"
## The intraclass correlation (ICC)

How much does region matter at all? The **intraclass correlation** answers with a single number: the share of the total variation that lives *between* regions rather than within them:

\[ \rho = \frac{\tau^2}{\tau^2 + \sigma^2}. \]

\(\rho\) ("rho") runs from 0 to 1. Near 0, regions are basically interchangeable and grouping barely matters. Near 1, almost all the variation is between regions, and which region an account belongs to tells you most of its satisfaction. \(\rho\) is also, exactly, the correlation between two accounts drawn from the same region, which is why it measures how badly the independence assumption was being violated. Pull the two variances straight out of the fitted model:

```r
library(lme4)
m1 <- lmer(satisfaction ~ onboarding + (1 | region), data = accounts)
vc   <- as.data.frame(VarCorr(m1))
tau2 <- vc$vcov[vc$grp == "region"]    # between-region variance
sig2 <- vc$vcov[vc$grp == "Residual"]  # within-region variance
round(c(tau2 = tau2, sigma2 = sig2, ICC = tau2 / (tau2 + sig2)), 3)
#>   tau2 sigma2    ICC 
#> 23.589 22.106  0.516
```

That ICC of 0.52 says about half the variation in satisfaction sits between regions rather than within them: substantial, and far too much to sweep aside. It is also the correlation you would expect between any two accounts from the same region, and it is the number that told us pseudoreplication would have burned us.

[WARNING]
Random intercepts need enough groups to estimate \(\tau^2\). With only a handful of regions (fewer than about five or six) the between-group variance is barely identifiable, and `lmer` may report a variance of exactly zero (a "singular fit"). And a random intercept assumes every region shares the *same* onboarding slope, with only the baseline shifting. When the slope itself varies by group, you need random slopes, which is Lesson 13.

=== step === quiz
::eyebrow Putting it together
## Read the model

A colleague fits a random-intercept model of test `score` on `study_hours` for students grouped by `school`, and finds an ICC of 0.30 with a clearly nonzero between-school variance. Which reading is correct?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- About 30% of the variation in scores is between schools; schools differ enough that a plain lm ignoring school would understate the uncertainty ::ok Right. An ICC of 0.30 means roughly a third of the variance is between schools, so two students in the same school correlate at 0.30; ignoring school (complete pooling) would report standard errors that are too small.
- An ICC of 0.30 means the model explains 30% of the variance, like an R-squared ::no The ICC is not an R-squared. It is the share of unexplained variance that sits between groups (tau squared over tau squared plus sigma squared), not the variance explained by predictors.
- Because 0.30 is below 0.5, school can safely be ignored and a plain lm used ::no A nonzero ICC of 0.30 is substantial: a third of the variance is between schools, so ignoring it still gives pseudoreplicated, over-confident standard errors. There is no 0.5 cutoff.
- The 30% is the amount each small school is shrunk toward the grand mean ::no A group's shrinkage depends on its own size through lambda = n tau squared over (n tau squared plus sigma squared), not on the ICC. The ICC measures how grouped the data is overall, not any one group's pull.

=== step === concept
::eyebrow Go deeper
## References

- [Gelman and Hill (2007), Data Analysis Using Regression and Multilevel/Hierarchical Models](http://www.stat.columbia.edu/~gelman/arm/) - the definitive, readable treatment of partial pooling and when to reach for it.
- [Bates, Machler, Bolker and Walker (2015), Fitting Linear Mixed-Effects Models Using lme4 (JSS 67:1)](https://doi.org/10.18637/jss.v067.i01) - the paper behind the lme4 package and the lmer() function you used here.
- [Harrison et al. (2018), A brief introduction to mixed effects modelling and multimodel inference in ecology (PeerJ)](https://doi.org/10.7717/peerj.4794) - a practical, example-led walkthrough of random intercepts, the ICC, and common pitfalls.
- [Nakagawa and Schielzeth (2013), A general and simple method for obtaining R-squared from generalized linear mixed-effects models](https://doi.org/10.1111/j.2041-210x.2012.00261.x) - where the variance-partition and ICC ideas for mixed models are laid out cleanly.

=== step === complete
## Lesson 12 complete

You can now handle data that arrives in groups. You know that ignoring the groups (complete pooling) understates your uncertainty through pseudoreplication, and that giving each group a free intercept (no pooling) overfits the small ones. The fix is a **random intercept**: `lmer(y ~ x + (1 | group))` gives every group its own baseline drawn from a shared \(N(0, \tau^2)\), reads out the between- and within-group variances, and applies **partial pooling** so small groups borrow strength. And you can measure how grouped your data is with the **ICC**, \(\tau^2 / (\tau^2 + \sigma^2)\).

Next, Lesson 13: Random Slopes and GLMMs. Here every region shared one onboarding slope; next you will let the *slope* vary by group too (some regions may respond to onboarding far more than others), extend mixed models to non-normal outcomes like counts and yes/no data with GLMMs, and learn to read and fix the convergence warnings that come with them.
