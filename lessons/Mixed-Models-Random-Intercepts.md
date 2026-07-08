---
title: "Advanced Regression Lesson 12: Mixed Models and Random Intercepts"
catalog_blurb: "How to give each group its own baseline while sharing information across them."
description: "Fit random-intercept mixed models in R with lme4: give each group its own baseline, read the ICC, and watch partial pooling steady noisy small groups."
keywords: "mixed models, random intercepts, partial pooling, ICC, intraclass correlation, lme4, lmer, multilevel model, hierarchical model, shrinkage, random effects, R"
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

Every model so far in this course has trusted each row on its own: one customer, one claim, one account, each an independent draw. But data rarely arrives that tidy. It comes in **groups** (patients within a clinic, students within a school, repeated visits from the same person) and rows inside a group resemble each other in ways the model has to respect.

Meet **Dr. Anna Reyes**, who runs a network of eight walk-in clinics. Every clinic delivered the same recovery programme and scored each patient's recovery from 0 to 100. One clinic saw 40 patients; another saw just 2. Two questions keep her up at night: how good is each clinic *really*, and can she trust a tiny clinic whose two patients happened to score high? A **mixed model** answers both, by letting every clinic keep its own baseline while borrowing strength from the whole network.

By the end of this lesson you will be able to:

- Say why treating grouped observations as independent is a mistake, and why the two obvious fixes both fail
- Fit a **random-intercept** model in R and read its two variance components
- Read the **intraclass correlation (ICC)**: how much of the variation is between clinics rather than within
- Explain **partial pooling**: why the shakiest small clinics get pulled hardest toward the average

**Prerequisites:** you can fit and read [an ordinary linear model](OLS-Regression-from-Scratch.html), and you are comfortable with variance, standard deviation, and a factor column in R.

::widget shrinkage-pool {}

=== step === concept
::eyebrow The data
## Eight clinics, wildly different sizes

Here is Dr. Reyes's network, built right here so every line on this page runs. Eight clinics, each with its own true baseline recovery level, and a very unequal number of patients. We bring in a predictor later; for now, just the clinic each patient attended and their recovery score:

```r
library(lme4)
set.seed(7)

clinic_names <- c("Ashby", "Brook", "Cedar", "Dale", "Elm", "Fern", "Gale", "Hill")
n_per        <- c(3, 25, 4, 40, 2, 30, 5, 12)            # patients seen at each clinic
clinic       <- factor(rep(clinic_names, n_per))
N            <- length(clinic)                            # 121 patients in all

clinic_base  <- setNames(rnorm(8, 0, 7), clinic_names)   # each clinic's own baseline shift
sessions     <- rpois(N, 6)                              # therapy sessions attended (used later)
recovery     <- 50 + clinic_base[as.character(clinic)] +
                1.4 * sessions + rnorm(N, 0, 6)          # recovery score
recovery     <- round(pmin(100, pmax(0, recovery)), 1)   # keep it on the 0-100 scale

recov <- data.frame(clinic, sessions, recovery)
head(recov)
#>   clinic sessions recovery
#> 1  Ashby        6     79.7
#> 2  Ashby        1     72.6
#> 3  Ashby       12     83.0
#> 4  Brook        5     49.6
#> 5  Brook        7     54.9
#> 6  Brook        5     57.2
```

Now the headline problem. Put each clinic's patient count next to its raw average recovery:

```r
data.frame(
  n        = as.integer(table(recov$clinic)),
  raw_mean = round(tapply(recov$recovery, recov$clinic, mean), 1)
)
#>       n raw_mean
#> Ashby  3     78.4
#> Brook 25     54.3
#> Cedar  4     56.0
#> Dale  40     55.4
#> Elm    2     52.5
#> Fern  30     51.3
#> Gale   5     61.1
#> Hill  12     56.6
```

**Ashby** looks spectacular: an average of 78, far above everyone else. But it saw only **3 patients**. Should Dr. Reyes crown it the best clinic in the network, or is three patients simply too few to trust? The bar chart makes the imbalance plain: a couple of towering bars built on almost no evidence, the rest bunched together on solid samples.

::widget chart-plotter {"data":[{"x":"Ashby","y":78.4},{"x":"Brook","y":54.3},{"x":"Cedar","y":56.0},{"x":"Dale","y":55.4},{"x":"Elm","y":52.5},{"x":"Fern","y":51.3},{"x":"Gale","y":61.1},{"x":"Hill","y":56.6}],"geoms":["bar"],"x":"clinic","y":"recovery"}

=== step === concept
::eyebrow Two tempting mistakes
## Ignore the clinics, or trust them blindly

Faced with grouped data, two shortcuts tempt everyone. Both are wrong, and seeing exactly *how* they are wrong is the whole motivation for mixed models.

**Shortcut 1, complete pooling: ignore the clinics.** Pretend every patient is just a patient, pour all 121 into one pot, and report a single number.

```r
round(mean(recov$recovery), 1)   # one number for the whole network
#> [1] 55
```

Tidy, but it throws away a real fact: clinics genuinely differ. Reporting 55 for everyone tells Ashby's patients and Fern's patients the same story, when their clinics are plainly not the same.

**Shortcut 2, no pooling: trust each clinic completely.** Give every clinic its own separate estimate, which is exactly the raw-mean column you just saw. This respects that clinics differ, but it trusts a clinic with 2 patients as fully as one with 40:

```r
recov[recov$clinic == "Elm", ]   # Elm's entire evidence base
#>    clinic sessions recovery
#> 73    Elm        5     56.1
#> 74    Elm        5     48.9
```

Elm's estimate of 52.5 rests on **two people**. If one of them had recovered a little worse, Elm's "score" would swing wildly. No pooling has no way to say *I have barely any evidence here*: it reports the noisy average with a straight face.

[KEY INSIGHT]
Complete pooling ignores real differences between groups; no pooling trusts every group equally, even the ones built on two data points. The right answer lives in between: trust a big clinic's average, but be sceptical of a tiny one and lean it toward the crowd. That in-between is **partial pooling**, and a mixed model does it for you.

=== step === quiz
::eyebrow Check yourself
## What is wrong with no pooling?

Dr. Reyes is tempted to just publish each clinic's raw average (the no-pooling estimate) and be done. What is the core danger of doing that here?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Raw averages are biased: they systematically overstate every clinic's true recovery level ::no A raw group mean is unbiased for that clinic on its own; the problem is not bias, it is reliability. A mean from 2 patients is extremely noisy, and no pooling has no way to discount it.
- The tiny clinics get noisy, unreliable estimates that no pooling has no way to discount ::ok Right. Elm's average rests on 2 patients and could swing on a single case, yet no pooling treats it as seriously as Dale's average of 40. The shakiest numbers end up looking as trustworthy as the solid ones.
- It uses too much data, so the estimates overfit the whole network ::no No pooling actually uses too LITTLE data per estimate (each clinic alone). The issue is small within-clinic samples, not too much data.
- Nothing is wrong; each clinic's own average is always the best possible estimate for that clinic ::no A clinic's own average ignores everything the other clinics reveal about a typical clinic. For a tiny, noisy clinic, borrowing some of that shared information beats its raw mean.

=== step === concept
::eyebrow The middle path
## A random intercept: each clinic shifted from a shared centre

Here is the idea that threads the needle. We keep a single overall recovery level for the network, and we let each clinic sit a little above or below it. Crucially, those clinic shifts are not eight free numbers we chase individually. We assume they are **draws from one bell-shaped distribution** centred on zero, and we estimate the *width* of that distribution instead.

Write patient \(i\) at clinic \(j\):

\[ y_{ij} = \beta_0 + u_j + \varepsilon_{ij}, \qquad u_j \sim \mathcal{N}(0, \tau^2), \qquad \varepsilon_{ij} \sim \mathcal{N}(0, \sigma^2). \]

Reading each piece in plain words:

- \(y_{ij}\) is the recovery score of patient \(i\) at clinic \(j\).
- \(\beta_0\) ("beta-nought") is the **grand mean**: the typical recovery level across the whole network.
- \(u_j\) ("u-j") is clinic \(j\)'s **random intercept**, how far that clinic sits above or below the grand mean. Ashby's is positive, Fern's is negative.
- \(\tau^2\) ("tau-squared") is the **between-clinic variance**: how spread out those clinic shifts are. This single number is what we estimate, instead of eight separate intercepts.
- \(\varepsilon_{ij}\) ("epsilon") is the leftover patient-level noise, and \(\sigma^2\) ("sigma-squared") is the **within-clinic variance**: how much patients scatter around their own clinic's level.

The word **mixed** is now literal: the model mixes a **fixed effect** (\(\beta_0\), one number for everyone) with a **random effect** (\(u_j\), one per clinic, all tied together by the shared \(\tau^2\)).

[KEY INSIGHT]
Modelling the clinic shifts as draws from a single \(\mathcal{N}(0, \tau^2)\) is exactly what buys partial pooling. Because all eight clinics inform one variance \(\tau^2\), a clinic with little data cannot wander far on its own: the shared distribution reins it in.

=== step === tryit
::eyebrow Your turn
## Fit the random-intercept model

The `lme4` package fits it with `lmer`. The fixed part is the familiar formula; the new piece is the random-intercept term in parentheses, `(1 | clinic)`, which reads *"let the intercept (the `1`) vary by `clinic`"*. Start with the simplest model, just a grand mean plus a per-clinic intercept, no predictor yet. Fill in the random term.

```r
library(lme4)
m0 <- lmer(recovery ~ 1 + ____, data = recov)
summary(m0)
```
::check {"regex":"\\(\\s*1\\s*\\|\\s*clinic\\s*\\)","gate":true,"difficulty":"beginner","ok":"Right. (1 | clinic) lets the intercept vary by clinic: one shared grand mean plus a clinic-specific shift drawn from N(0, tau squared).","no":"The random-intercept term is (1 | clinic): the 1 is the intercept, and | clinic says let it vary by clinic."}
::solution
```r
library(lme4)
m0 <- lmer(recovery ~ 1 + (1 | clinic), data = recov)
summary(m0)
#> Linear mixed model fit by REML ['lmerMod']
#> Formula: recovery ~ 1 + (1 | clinic)
#>    Data: recov
#>
#> REML criterion at convergence: 792.1
#>
#> Scaled residuals:
#>      Min       1Q   Median       3Q      Max
#> -2.39083 -0.60498 -0.01962  0.47327  3.01726
#>
#> Random effects:
#>  Groups   Name        Variance Std.Dev.
#>  clinic   (Intercept) 60.85    7.801
#>  Residual             35.23    5.936
#> Number of obs: 121, groups:  clinic, 8
#>
#> Fixed effects:
#>             Estimate Std. Error t value
#> (Intercept)   57.970      2.891   20.05
```

=== step === concept
::eyebrow Reading the fit
## Two variances tell the whole story

Ignore everything in that output except the **Random effects** block, because it is the heart of a mixed model:

```r
library(lme4)
m0 <- lmer(recovery ~ 1 + (1 | clinic), data = recov)
as.data.frame(VarCorr(m0))[, c("grp", "vcov")]
#>        grp     vcov
#> 1   clinic 60.85047
#> 2 Residual 35.23086
```

Two numbers, and each answers a real question:

- **clinic = 60.85** is \(\tau^2\), the **between-clinic variance**: how much clinics differ from one another. Its square root, about 7.8 points, is the typical gap between a clinic and the network average.
- **Residual = 35.23** is \(\sigma^2\), the **within-clinic variance**: how much patients scatter *inside* a clinic. Its square root is about 5.9 points.

Notice the grand mean the model reported: `(Intercept) = 57.97`, not the 55 we got from `mean(recovery)`. They differ because the simple patient average is dragged down by the big low-scoring clinics (Fern with 30 patients, Brook with 25), while the mixed model weights the eight clinics more evenly. The model's 58 is *the typical clinic*, not *the typical patient*. (The `t value` of 20 just says that average is clearly not zero; `lmer` prints no p-value on purpose, which we return to at the end.)

=== step === concept
::eyebrow How much is the clinic?
## The intraclass correlation (ICC)

Those two variances answer Dr. Reyes's deepest question: *how much does the clinic you walk into actually matter?* The **intraclass correlation**, the ICC, is their ratio:

\[ \rho = \frac{\tau^2}{\tau^2 + \sigma^2}, \]

where \(\tau^2\) is the between-clinic variance, \(\sigma^2\) the within-clinic variance, and \(\tau^2 + \sigma^2\) therefore the total variance in recovery scores. The ICC is the **share of that total variation that lives between clinics**. Compute it straight from the fit:

```r
library(lme4)
m0 <- lmer(recovery ~ 1 + (1 | clinic), data = recov)
vc <- as.data.frame(VarCorr(m0))
between <- vc$vcov[vc$grp == "clinic"]     # tau^2
within  <- vc$vcov[vc$grp == "Residual"]   # sigma^2
round(between / (between + within), 2)
#> [1] 0.63
```

An ICC of **0.63** is large. It says **63% of the variation in recovery scores is explained by which clinic a patient attended**, and only 37% by patient-to-patient differences within a clinic. Which clinic you go to matters more than who you are.

The ICC has a second, equivalent reading worth holding onto: it is the **correlation between any two patients treated at the same clinic**. Two patients from Ashby correlate 0.63; they resemble each other far more than two patients picked from different clinics. That correlation is exactly the non-independence that complete pooling ignored, and that a mixed model is built to handle.

[KEY INSIGHT]
The ICC turns "are my groups meaningfully different?" into one number. Near 0, groups barely differ and a plain model is fine; near 1, group membership dominates and ignoring it would badly understate your uncertainty. At 0.63, these clinics are emphatically real.

=== step === quiz
::eyebrow Check yourself
## Reading an ICC

A colleague fits a random-intercept model to exam scores of students grouped by school and reports an ICC of **0.08**. What does that tell you?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- Schools explain most of the variation in scores, so which school a student attends is what matters most ::no That would be a HIGH ICC near 1. An ICC of 0.08 says schools explain only 8% of the variation; almost all of it is between students within a school.
- The mixed model has failed, because a valid ICC must be above 0.5 ::no Any ICC in the range 0 to 1 is valid. A small ICC is a real, common finding (here, schools differ only slightly), not a failure.
- Only about 8% of the variation is between schools; two students in the same school are barely more alike than students from different schools ::ok Right. ICC = 0.08 means schools account for 8% of the total variance, and two students in the same school correlate only 0.08. The grouping is weak, though not necessarily ignorable.
- The average exam score is 8% higher in the best school than in the worst ::no The ICC is a share of variance, not a difference in means. It says nothing directly about the gap between the top and bottom school's averages.

=== step === widget
::eyebrow The payoff
## Partial pooling: borrow strength

Now the reward. A mixed model reports neither extreme. It gives each clinic a **partially pooled** estimate that sits between its own raw mean and the grand mean, and it decides *where* between them by how much data the clinic has. Slide the dial below from no pooling toward complete pooling and watch the small clinics get dragged toward the centre while the big ones hold their ground:

::widget shrinkage-pool {}

The estimates `lmer` actually produced are its partially pooled intercepts. Put them next to the raw means and the shrinkage is unmistakable:

```r
library(lme4)
m0 <- lmer(recovery ~ 1 + (1 | clinic), data = recov)
raw    <- tapply(recov$recovery, recov$clinic, mean)   # no-pooling estimate
pooled <- coef(m0)$clinic[, "(Intercept)"]             # partial-pooled estimate
data.frame(n      = as.integer(table(recov$clinic)),
           raw    = round(raw, 1),
           pooled = round(pooled, 1),
           pulled = round(pooled - raw, 1))
#>        n  raw pooled pulled
#> Ashby  3 78.4   75.1   -3.3
#> Brook 25 54.3   54.4    0.1
#> Cedar  4 56.0   56.2    0.3
#> Dale  40 55.4   55.4    0.0
#> Elm    2 52.5   53.7    1.2
#> Fern  30 51.3   51.4    0.1
#> Gale   5 61.1   60.8   -0.3
#> Hill  12 56.6   56.6    0.1
```

Read the `pulled` column. The big clinics barely move: Dale (40 patients) shifts 0.0, Fern and Brook by 0.1. The small clinics are tugged toward the centre: Ashby's suspicious 78.4 is reeled in to 75.1, and Elm's 52.5 is nudged up to 53.7. The model quietly discounts a bold claim made on thin evidence.

How hard each clinic is pulled follows a shrinkage weight \(\lambda_j\):

\[ \lambda_j = \frac{n_j\,\tau^2}{n_j\,\tau^2 + \sigma^2}, \]

where \(n_j\) is clinic \(j\)'s number of patients, \(\tau^2\) the between-clinic variance and \(\sigma^2\) the within-clinic variance. The pooled estimate lands \(\lambda_j\) of the way from the grand mean to the clinic's own raw mean. When \(n_j\) is large, \(\lambda_j \to 1\) and the clinic keeps its own average; when \(n_j\) is tiny, \(\lambda_j\) shrinks and the clinic is pulled toward the grand mean. You never told the model to do this; it falls straight out of the shared \(\mathcal{N}(0, \tau^2)\) assumption.

[KEY INSIGHT]
Partial pooling is automatic regularization for groups: every group's estimate is shrunk toward the overall mean by an amount set by how little data it has. It is the single most useful thing a mixed model does, and the reason its estimates beat both extremes on a fresh sample.

=== step === quiz
::eyebrow Check yourself
## Which clinic moves most?

In the table above, which clinic's estimate was pulled furthest from its raw mean toward the network average, and why?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Ashby: it has few patients (n = 3) AND a raw mean far above the centre, so the model discounts the surprise most ::ok Right. Shrinkage grows when a group has little data and sits far from the grand mean. Ashby is both, so its 78.4 is pulled the hardest, down to 75.1.
- Dale: with 40 patients it has the most data, so the model adjusts it the most ::no It is the opposite. Dale's large sample makes lambda close to 1, so it keeps its own average almost exactly (pulled 0.0). More data means LESS shrinkage.
- Elm: it has the fewest patients (n = 2), so it must be pulled the most ::no Small n pulls hard, but Elm's raw mean (52.5) already sits near the grand mean, so there is little distance to pull it across. Shrinkage depends on distance too, not sample size alone.
- All clinics are pulled by the same amount, because they share one tau squared ::no They share one tau squared, but the pull lambda also depends on each clinic's own n (and its distance from the mean), so the amount differs clinic to clinic.

=== step === tryit
::eyebrow Your turn
## Add a predictor: one shared slope

So far the model only had a grand mean. But Dr. Reyes also recorded how many therapy **sessions** each patient attended, and more sessions should mean better recovery. A random-intercept model handles this beautifully: it fits **one shared slope** for sessions across all clinics, while still giving **each clinic its own intercept**. Add `sessions` as a fixed effect.

```r
library(lme4)
m1 <- lmer(recovery ~ ____ + (1 | clinic), data = recov)
summary(m1)
```
::check {"regex":"sessions","gate":true,"difficulty":"beginner","ok":"Right. sessions enters as a fixed effect, one slope shared by every clinic, while (1 | clinic) keeps each clinic its own baseline.","no":"Put sessions in as the fixed predictor: recovery ~ sessions + (1 | clinic)."}
::solution
```r
library(lme4)
m1 <- lmer(recovery ~ sessions + (1 | clinic), data = recov)
summary(m1)
#> Random effects:
#>  Groups   Name        Variance Std.Dev.
#>  clinic   (Intercept) 63.06    7.941
#>  Residual             25.80    5.079
#> Number of obs: 121, groups:  clinic, 8
#>
#> Fixed effects:
#>             Estimate Std. Error t value
#> (Intercept)  49.5488     3.1858  15.553
#> sessions      1.3789     0.2123   6.497
```

Two things changed. The **sessions** slope is 1.38, so each extra therapy session adds about 1.4 recovery points, and its \(|t| = 6.5\) is comfortably large. And the **Residual** variance dropped from 35.2 to 25.8, because sessions now explains some of the within-clinic scatter that used to be unexplained noise.

=== step === concept
::eyebrow The geometry
## Parallel lines: one slope, eight intercepts

`coef()` spells out what the random intercept did to each clinic. It hands back a fitted line per clinic, the shared fixed effects plus that clinic's own intercept shift:

```r
library(lme4)
m1 <- lmer(recovery ~ sessions + (1 | clinic), data = recov)
round(coef(m1)$clinic, 1)
#>       (Intercept) sessions
#> Ashby        67.3      1.4
#> Brook        45.0      1.4
#> Cedar        47.6      1.4
#> Dale         46.9      1.4
#> Elm          46.3      1.4
#> Fern         43.4      1.4
#> Gale         52.9      1.4
#> Hill         47.1      1.4
```

Every clinic shares the **same slope of 1.4** (a session helps just as much wherever you go) but keeps its **own intercept**: Ashby starts high at 67, Fern low at 43. Geometrically these are eight **parallel lines**, one per clinic, shifted up and down. That is precisely what a random *intercept* means, and precisely its limitation. Letting the slope vary too, so the lines are no longer parallel, is the random-slopes model of Lesson 13.

=== step === concept
::eyebrow Handle with care
## Where random intercepts wobble

A mixed model is powerful, not magic. Four cautions before you trust one:

- **You need enough groups.** \(\tau^2\) is a variance *of the group effects*, and you cannot estimate a variance well from a handful of numbers. With fewer than about five groups there is too little to go on; eight (as here) is a workable minimum, and more is better. With very few groups, put them in as ordinary fixed-effect dummies instead.
- **Singular fits.** When the groups barely differ, `lmer` may estimate \(\tau^2\) as essentially zero and warn `boundary (singular) fit`. That is the model telling you the grouping explains almost nothing (a near-zero ICC), and a plain `lm` may be all you need.
- **Groups are assumed exchangeable.** The random-effects story treats the eight clinics as interchangeable draws from one population of clinics. If a "group" is really a fixed category you care about individually (say, treatment versus control), model it as a fixed effect, not a random one.
- **No p-values by default, on purpose.** You saw `lmer` print a `t value` but no p-value. With random effects the exact denominator degrees of freedom are unknown, so a naive p-value would be wrong. Use \(|t| > 2\) as a rough screen, and a likelihood-ratio test (`anova`) or `confint(m1)` for real inference.

[WARNING]
A random *intercept* assumes every group shares the same slope: eight parallel lines. If a predictor's effect genuinely differs by group (sessions help far more at some clinics than others), that assumption is wrong, and you need the random *slopes* of Lesson 13.

=== step === quiz
::eyebrow Putting it together
## Pick the model

A learning-science team measures the same **20 students** once a week for **10 weeks**, giving 200 rows: each student contributes 10 correlated measurements. They want the effect of week on the score, without pretending the 200 rows are independent. Which model respects the grouping?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- `lm(score ~ week)` on all 200 rows ::no That is complete pooling: it treats all 200 measurements as independent, ignores that each student's 10 rows are correlated, and its standard errors come out too small. This is exactly the trap the lesson warns about.
- `lmer(score ~ week + (1 | student))` ::ok Right. week is the fixed effect (the shared trend you care about), and (1 | student) gives each student their own intercept, absorbing the repeated-measures correlation so the uncertainty stays honest.
- `lmer(score ~ student + (1 | week))` ::no This puts student in as a fixed effect and makes week the grouping, which is backwards. You want each STUDENT to have a random intercept, because the repeated measurements are nested within students.
- A separate `lm(score ~ week)` fit for each of the 20 students ::no That is no pooling: 20 tiny, noisy fits with nothing shared between them. A random intercept pools information across students and gives each a steadier estimate.

=== step === concept
::eyebrow Go deeper
## References

- [Bates, Mächler, Bolker and Walker (2015), Fitting Linear Mixed-Effects Models Using lme4 (JSS 67:1)](https://doi.org/10.18637/jss.v067.i01) - the paper for the package you used here; the definitive reference for `lmer` syntax and what it estimates.
- [Harrison et al. (2018), A brief introduction to mixed effects modelling and multi-model inference in ecology (PeerJ 6:e4794)](https://doi.org/10.7717/peerj.4794) - a friendly, practical walkthrough of random effects, the ICC, and the common pitfalls.
- [Gelman and Hill, Data Analysis Using Regression and Multilevel/Hierarchical Models](http://www.stat.columbia.edu/~gelman/arm/) - the standard text on partial pooling and multilevel models, and the source of the shrinkage intuition used here.
- [UCLA OARC, Introduction to Linear Mixed Models](https://stats.oarc.ucla.edu/other/mult-pkg/introduction-to-linear-mixed-models/) - a clear, example-driven primer that maps every term to its R output.

=== step === complete
## Lesson 12 complete

You can now model data that arrives in groups without lying about it. A **random intercept** gives every group its own baseline drawn from a shared \(\mathcal{N}(0, \tau^2)\), which you fit with `lmer(y ~ ... + (1 | group))` and read from two variance components. The **ICC**, \(\tau^2/(\tau^2+\sigma^2)\), tells you how much the grouping matters; **partial pooling** shrinks the shakiest small groups toward the centre automatically, so their estimates stop swinging on two data points.

Next, Lesson 13: **Random Slopes and GLMMs**. Here every clinic shared one slope, eight parallel lines. But what if sessions help far more at some clinics than others? Random *slopes* let each group's slope vary too. And when the outcome is a count or a yes/no rather than a score, the **generalized** linear mixed model marries everything you have learned about links and families to the random effects you met today, along with the convergence warnings that come with them.
