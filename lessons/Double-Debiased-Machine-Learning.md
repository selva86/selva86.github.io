---
title: "Causal Inference for Decisions Lesson 9: Double-Debiased Machine Learning"
catalog_blurb: "Use machine learning for a causal study's messy parts without biasing the effect."
description: "Use flexible machine learning for the nuisance models in a causal study, then cross-fit and residualise so the treatment effect stays unbiased and root-n, in R."
keywords: "double machine learning, debiased machine learning, DML, cross-fitting, Neyman orthogonality, partialling out, doubly robust, treatment effect, causal inference, R"
post_type: "LESSON"
curriculum_id: "6.180.9"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-causal-decisions"
course_title: "Causal Inference for Decisions"
course_lesson: "9"
course_total: "11"
course_landing: "R-Causal-Decisions-Course.html"
course_next: "Sensitivity-Analysis-and-Placebo-Tests.html"
course_prev: "Uplift-and-Heterogeneous-Effects.html"
---

=== step === cover
::eyebrow Lesson 9 of 11
## Double-Debiased Machine Learning

In Lesson 8 you split one average effect into a per-customer one. Look back across the whole course and every method leaned on a model of the messy background: a propensity score, an outcome regression. So far those models were tidy straight lines. But real confounding is rarely a straight line, and the honest fix is to let a flexible machine-learning model soak it up.

Here is the catch this lesson exists to solve: drop a random forest into the estimator naively and it quietly **poisons your effect**. Double-debiased machine learning is the recipe that lets you use any flexible learner for the background and still recover a treatment effect that is unbiased and comes with an honest confidence interval.

By the end of this lesson you will be able to:

- Explain why a flexible ML model, plugged in naively, biases a causal-effect estimate
- Write the orthogonal "partialling-out" score: residualise the outcome AND the treatment, then regress one residual on the other
- Apply cross-fitting to strip out the bias a model creates by scoring the very rows it trained on
- Run a full double-machine-learning estimate in R and read its confidence interval, recovering an effect that naive methods miss

**Prerequisites:** [Lesson 2](Inverse-Probability-Weighting-and-Doubly-Robust.html) (the propensity score, the doubly-robust idea, the average treatment effect) and [Lesson 1](Matching-and-the-Propensity-Score.html) (confounding, the no-unmeasured-confounding assumption, overlap). You can fit a `glm`, an `lm`, and a `randomForest`, read a `predict` output, and subset with base R.

::widget causal-dag {}

=== step === concept
::eyebrow The setup
## One perk, a smart targeting system, and hidden confounding

Meet **Priya**, a data scientist at **FreshCart**, an online grocer. Last quarter FreshCart handed some customers a **free-delivery perk** and Priya wants the honest answer to one question: how many extra dollars of monthly spend did the perk actually cause?

She cannot just compare perk-holders to everyone else, because the perk was not handed out at random. An automated targeting system decided who got it, reading a stack of customer signals: app **engagement**, order **recency**, typical **basket** size, and more. Those same signals also drive spend. So the customers who got the perk were already the bigger spenders. That is textbook confounding, the exact `Z -> X`, `Z -> Y` picture on the cover, and it is what makes a raw comparison lie.

We can write this as a **partially linear model**. Let \(Y\) be a customer's monthly spend, \(D\) the perk (1 if they got it, 0 if not), and \(X\) the bundle of customer signals:

\[ Y = \theta D + g(X) + \varepsilon, \qquad D = m(X) + \nu. \]

Read it in plain words. \(\theta\) (theta) is the one number Priya wants: the dollars of spend the perk causes, assumed the same for everyone. \(g(X)\), the **outcome nuisance**, is the baseline spend a customer would have anyway given their signals. \(m(X) = \mathbb{E}[D \mid X]\), the **propensity nuisance**, is their chance of being targeted. The two \(g\) and \(m\) are "nuisances" because Priya does not care about them for their own sake, but she cannot get \(\theta\) right without dealing with them. The last two symbols, \(\varepsilon\) (epsilon) and \(\nu\) (nu), are plain random noise: the leftover wiggle in spend, and in who got targeted, that nothing systematic explains. Here is the data, built to have a true effect of exactly **$12**, with \(g\) and \(m\) both bent into genuinely nonlinear shapes.

```r
set.seed(2024)
n <- 1500
engagement <- runif(n)                       # app engagement score, 0 to 1
recency    <- runif(n)                        # how recently they ordered, 0 to 1
basket     <- runif(n)                        # typical basket-size score, 0 to 1
noise_feat <- runif(n)                        # an irrelevant signal, along for the ride
value <- sin(2 * pi * engagement) + 4 * (recency - 0.5)^2 + 1.5 * engagement * basket
perk  <- rbinom(n, 1, plogis(2 * value - 1))              # who the system targeted
spend <- 12 * perk + 34 + 20 * value + rnorm(n, 0, 8)     # TRUE perk effect = $12
fresh <- data.frame(engagement, recency, basket, noise_feat, perk, spend)
head(round(fresh[, c("engagement", "recency", "perk", "spend")], 2), 4)
#>   engagement recency perk spend
#> 1       0.84    0.41    0 49.52
#> 2       0.32    0.16    1 77.86
#> 3       0.68    0.74    0 26.24
#> 4       0.70    0.49    0 34.92
```

Now the naive comparison Priya must not trust: the raw gap between perk-holders and everyone else.

```r
c(control   = round(mean(spend[perk == 0]), 1),
  treated   = round(mean(spend[perk == 1]), 1),
  naive_gap = round(mean(spend[perk == 1]) - mean(spend[perk == 0]), 1))
#>   control   treated naive_gap
#>      39.8      65.9      26.1
```

**$26.1**, more than double the truth. The targeting system stacked the high-value customers into the perk group, and that stack, not the perk, is most of the gap.

=== step === concept
::eyebrow The fix, and its trap
## Partial out the background, but do it right

Priya knows the Lesson 1 move: adjust for the confounders. So she regresses spend on the perk plus all four signals, letting the line "hold the signals fixed."

```r
round(coef(lm(spend ~ perk + engagement + recency + basket + noise_feat, data = fresh))["perk"], 1)
#> perk
#> 21.4
```

Better, **$21.4** instead of $26.1, but still nowhere near $12. The problem is the straight line. Our \(g(X)\) has a `sin` wave and a squared bend in it, and a linear term cannot follow those curves, so a chunk of the confounding survives the adjustment and leaks into the perk coefficient. This is exactly where a flexible learner earns its place: a random forest can bend to whatever shape \(g\) and \(m\) really are.

The clean way to use that flexibility is **partialling out**, an old idea (Frisch-Waugh-Lovell, Robinson 1988) with a modern engine. Predict the background out of both sides and keep only what it cannot explain:

\[ \tilde{Y} = Y - g(X), \qquad \tilde{D} = D - m(X). \]

\(\tilde{Y}\) (Y-tilde) is the part of spend the signals do not account for. \(\tilde{D}\) (D-tilde) is the part of "who got the perk" the signals do not account for, the as-good-as-random leftover after the targeting rule is subtracted off. Substitute into the model and the whole nonlinear \(g(X)\) cancels, leaving a plain line through the origin:

\[ \tilde{Y} = \theta \, \tilde{D} + \varepsilon. \]

So \(\theta\) is just the slope of the outcome residual on the treatment residual. That regression is the **orthogonal score**: its estimating equation, \(\mathbb{E}\!\left[(\tilde{Y} - \theta \tilde{D})\,\tilde{D}\right] = 0\), has a property called **Neyman orthogonality**, meaning it is flat, to first order, with respect to small errors in \(g\) and \(m\). A slightly-off forest barely moves \(\theta\). That flatness is what makes it safe to plug a regularised ML model into the background.

::widget process-flow {"steps":[{"title":"Model the outcome","sub":"predict spend from the signals X: that is g(X)"},{"title":"Model the treatment","sub":"predict who got the perk from the same X: that is m(X)"},{"title":"Take residuals","sub":"strip X out of both: Y minus g(X), and D minus m(X)"},{"title":"Regress residual on residual","sub":"the slope of Y-tilde on D-tilde is the effect theta"}]}

[KEY INSIGHT]
Residualising the treatment too, not just the outcome, is the whole trick. It removes the confounding channel (the part of \(D\) that \(X\) explains) and buys the estimate its insensitivity to nuisance error. Regress the outcome residual on the raw perk instead and you throw that protection away.

=== step === quiz
::eyebrow Check yourself
## Why residualise the treatment?

Priya subtracts the outcome model \(g(X)\) from spend, giving \(\tilde{Y}\). Why does she ALSO subtract the propensity model \(m(X)\) from the 0/1 perk indicator, instead of just regressing \(\tilde{Y}\) on the raw perk?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Because a random forest cannot use a 0/1 variable as a predictor, so the perk has to be turned into a continuous residual first ::no A forest handles a 0/1 variable fine, and that is not the reason. The residualising is about confounding, not about data types.
- Because \(\tilde{D}\) strips the part of "who got the perk" that the signals explain, leaving an as-good-as-random remnant; that is what makes the estimate insensitive to small errors in the outcome model (Neyman orthogonality) ::ok Exactly. Partialling X out of the treatment removes the confounding channel and makes the score orthogonal, so a slightly-wrong g(X) no longer biases theta. Residualising only the outcome loses that guarantee.
- It makes no real difference: it only rescales the coefficient into tidier units, and the estimate would be identical either way ::no It is not a rescaling. Regressing on the raw perk leaves the confounding that X explains inside the treatment variable, so the estimate stays biased and loses its orthogonality protection.

=== step === concept
::eyebrow The second trap
## The overfitting trap: never score the rows you trained on

Orthogonality handles a slightly-wrong model. It does not handle a model that has **memorised its own training data**. If Priya fits the forests on all 1,500 customers and then asks those same forests to predict those same customers, the forest has already seen each answer. Its residuals come out artificially tiny and tangled up with each row's own noise, and that tangle sneaks straight into \(\theta\). Watch it happen: fit both forests on the full data, residualise in-sample, and read the slope.

```r
library(randomForest)
set.seed(1)
g_all <- randomForest(spend ~ engagement + recency + basket + noise_feat, data = fresh, ntree = 200)
m_all <- randomForest(factor(perk) ~ engagement + recency + basket + noise_feat, data = fresh, ntree = 200)
y_res <- fresh$spend - predict(g_all, fresh)             # in-sample: the forest has SEEN these rows
d_res <- fresh$perk  - predict(m_all, fresh, type = "prob")[, 2]
round(coef(lm(y_res ~ d_res))["d_res"], 1)
#> d_res
#>  14.5
```

**$14.5.** Much closer than the linear $21.4, but it has overshot the true $12 and sailed past it, and worse, we have no honest way to know by how much. This is the same overfitting you have met all course: a flexible model fits the training rows too well and pays for it out of sample. Slide the widget to feel it, training error keeps falling while genuine, held-out error bottoms out and then climbs.

::widget bias-variance {}

=== step === concept
::eyebrow The cure for the second trap
## Cross-fitting: fit on other rows, predict on these

The escape is simple and strict: **never let a model predict a row it was trained on.** Split the data into \(K\) folds. To residualise the customers in fold 1, train the forests on folds 2 through 5 and predict into fold 1. Then rotate: fold 2 gets its residuals from a model trained on the others, and so on, until every customer has an out-of-fold residual from a model that never saw them. This is **cross-fitting**, the twin of the cross-validation you already know, and it is the "double" in double machine learning: once for orthogonality, once for cross-fitting. Step through the folds below.

::widget cv-folds {"k":5}

Each customer is scored exactly once, always by a model blind to them, so the memorisation that inflated the in-sample estimate has nowhere to hide.

=== step === tryit
::eyebrow In R
## Residualise a held-out half

Before the full five-fold loop, feel the core move with a single split: train on one random half, residualise the OTHER half with models that never saw it. The treatment residual line is done for you. Fill in the blank so the outcome residual `yr2` is predicted on `held`, the half kept back from training.

```r
set.seed(3)
half  <- sample(c(TRUE, FALSE), nrow(fresh), replace = TRUE)   # two random halves
train <- fresh[half, ]                                          # models learn here
held  <- fresh[!half, ]                                         # and are judged here
gA <- randomForest(spend ~ engagement + recency + basket + noise_feat, data = train, ntree = 200)
mA <- randomForest(factor(perk) ~ engagement + recency + basket + noise_feat, data = train, ntree = 200)
yr2 <- held$spend - predict(gA, ____)                           # residualise the held-out spend
dr2 <- held$perk  - predict(mA, held, type = "prob")[, 2]
round(coef(lm(yr2 ~ dr2))["dr2"], 1)
```
::check {"regex":"gA,\\s*held","gate":true,"difficulty":"intermediate","ok":"That is the whole idea: gA was trained on `train` and now predicts the untouched `held` rows, so the residual carries no memorisation. The single-split effect lands at $11.5, already close to the true $12.","no":"Predict on the held-out half, the rows the model never trained on: predict(gA, held). Using `train` here would score the rows the forest already memorised, the exact trap we are avoiding."}
::solution
```r
set.seed(3)
half  <- sample(c(TRUE, FALSE), nrow(fresh), replace = TRUE)
train <- fresh[half, ]
held  <- fresh[!half, ]
gA <- randomForest(spend ~ engagement + recency + basket + noise_feat, data = train, ntree = 200)
mA <- randomForest(factor(perk) ~ engagement + recency + basket + noise_feat, data = train, ntree = 200)
yr2 <- held$spend - predict(gA, held)
dr2 <- held$perk  - predict(mA, held, type = "prob")[, 2]
round(coef(lm(yr2 ~ dr2))["dr2"], 1)
#> dr2
#> 11.5
```

=== step === concept
::eyebrow Putting it together
## Double-debiased, end to end

Now the full recipe: five folds, forests fit out-of-fold, residuals pooled, one final residual-on-residual line. Because the score is orthogonal AND every residual is out-of-fold, the estimate is **root-n**: its error shrinks at the same honest \(1/\sqrt{n}\) rate a textbook estimator enjoys, so the standard error and 95% interval that `lm` prints are trustworthy.

::widget process-flow {"steps":[{"title":"Split into K folds","sub":"random folds, so every row is held out exactly once"},{"title":"Fit nuisances out of fold","sub":"train g(X) and m(X) on the other folds only"},{"title":"Residualise held-out rows","sub":"predict into the fold the models never saw, then subtract"},{"title":"Pool and regress","sub":"stack all out-of-fold residuals, regress Y-tilde on D-tilde"},{"title":"Read the effect and CI","sub":"the slope is root-n; its interval is honest"}]}

```r
set.seed(7)
K <- 5
fold <- sample(rep(1:K, length.out = nrow(fresh)))       # random fold labels
yr <- dr <- numeric(nrow(fresh))
for (k in 1:K) {
  tr <- fold != k; te <- fold == k                       # fit OUT of fold k, predict INTO it
  gk <- randomForest(spend ~ engagement + recency + basket + noise_feat, data = fresh[tr, ], ntree = 200)
  mk <- randomForest(factor(perk) ~ engagement + recency + basket + noise_feat, data = fresh[tr, ], ntree = 200)
  yr[te] <- fresh$spend[te] - predict(gk, fresh[te, ])   # out-of-fold outcome residual
  dr[te] <- fresh$perk[te]  - predict(mk, fresh[te, ], type = "prob")[, 2]
}
fit <- lm(yr ~ dr)                                        # the orthogonal score: residual on residual
round(summary(fit)$coefficients["dr", ], 2)
#>   Estimate Std. Error    t value   Pr(>|t|)
#>      11.64       0.54      21.76       0.00
```

There it is: **$11.64**, within pennies of the planted $12, with a real standard error. Turn it into a confidence interval.

```r
theta <- coef(fit)["dr"]; se <- summary(fit)$coefficients["dr", 2]
round(c(effect = unname(theta), lo = unname(theta) - 1.96 * se, hi = unname(theta) + 1.96 * se), 1)
#> effect     lo     hi
#>   11.6   10.6   12.7
```

The 95% interval runs **$10.6 to $12.7**, and it covers the truth. Line the estimates up and the story is complete: naive **$26.1**, linear adjustment **$21.4**, naive ML **$14.5**, and double-debiased ML **$11.6** with an honest interval. Only the last one is both close and trustworthy.

| Estimate | Perk effect | Trustworthy? |
|---|---|---|
| Naive difference | $26.1 | No, fully confounded |
| Linear adjustment | $21.4 | No, cannot fit nonlinear \(g\) |
| Naive ML plug-in | $14.5 | No, overfit, no valid interval |
| **Double-debiased ML** | **$11.6** | **Yes, root-n, CI [10.6, 12.7]** |

[WARNING]
DML fixes the bias that ML *creates* (regularisation error and overfitting). It does NOT relax the causal assumptions from Lesson 1. You still need **no unmeasured confounding** (every signal that drove both the perk and spend must be inside \(X\)) and **overlap** (every kind of customer had some real chance of either arm). A confounder missing from \(X\) sinks DML exactly as it sinks every method in this course.

In practice you would reach for the `DoubleML` package rather than hand-roll the loop. It wires the folds, learners, and orthogonal score together and reports the same effect with proper inference (it needs a full R install, so read it, do not run it here):

```r-static
library(DoubleML); library(mlr3); library(mlr3learners)
dml_data <- double_ml_data_from_data_frame(fresh, y_col = "spend", d_cols = "perk",
              x_cols = c("engagement", "recency", "basket", "noise_feat"))
dml_plr <- DoubleMLPLR$new(dml_data,
             ml_l = lrn("regr.ranger"), ml_m = lrn("classif.ranger"), n_folds = 5)
dml_plr$fit()
dml_plr$summary()          # the same partialling-out effect, with a standard error and CI
```

=== step === quiz
::eyebrow Check yourself
## What DML does and does not buy you

Cross-fitted DML recovered $12 where the naive and linear estimates failed. A teammate wants to use it on a new study. Which threat does DML give you **no** protection against?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- A baseline outcome \(g(X)\) that is a wild nonlinear shape ::no That is precisely what DML handles: the flexible forest bends to whatever shape g takes, and orthogonality keeps its small errors from biasing theta.
- The nuisance forests overfitting the data they are scored on ::no Cross-fitting handles that one directly: every residual is computed by a model that never saw that row, so overfitting cannot leak into the estimate.
- An unmeasured confounder, a signal that drove both the treatment and the outcome but is not in \(X\) ::ok Right. DML fixes the bias that machine learning introduces, not the bias from a confounder you never measured. No-unmeasured-confounding and overlap are assumptions DML inherits, not ones it repairs.

=== step === concept
::eyebrow Go deeper
## References

Four authoritative places to take this further:

- [Chernozhukov et al. (2018), Double/Debiased Machine Learning for Treatment and Structural Parameters (The Econometrics Journal)](https://doi.org/10.1111/ectj.12097) - the paper that defined DML: orthogonal scores plus cross-fitting, with the root-n theory.
- [Robinson (1988), Root-N-Consistent Semiparametric Regression (Econometrica)](https://doi.org/10.2307/1912705) - the partially-linear-model partialling-out this lesson is built on.
- [DoubleML for R: user guide and docs](https://docs.doubleml.org/stable/) - the production package that automates the folds, learners, and score you hand-rolled here.
- [Applied Causal Inference Powered by ML and AI (free online book)](https://causalml-book.org/) - Chernozhukov, Hansen, Kallus, Spindler and Syrgkanis on DML and modern causal ML, with worked code.

=== step === complete
## Lesson 9 complete

You saw why flexible machine learning, dropped naively into a causal estimate, biases it in two distinct ways, and you fixed both: **orthogonality** (residualise the treatment as well as the outcome, so small nuisance errors cannot move the effect) and **cross-fitting** (score every row with a model blind to it, so overfitting cannot leak in). Together they turned a confounded $26 and an overfit $14.5 into a root-n **$11.6** with an interval that actually covers the truth. And you kept the honesty: DML cleans up ML's bias, not the assumptions every causal claim rests on.

Next, Lesson 10: Sensitivity Analysis and Placebo Tests. No observational estimate is assumption-free, so the mature move is to ask how strong an unmeasured confounder would have to be to overturn your result, and to run placebo checks that should come back null if your design is sound.
