---
title: "Causal Inference for Decisions Lesson 9: Double Machine Learning"
catalog_blurb: "Use flexible machine learning for confounding without biasing your treatment effect."
description: "Use flexible machine learning for the confounders, with cross-fitting and Neyman-orthogonal scores, to estimate an unbiased treatment effect in R, from scratch."
keywords: "double machine learning, DML, debiased machine learning, causal inference, cross-fitting, Neyman orthogonality, partially linear model, treatment effect, random forest, R"
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
## Double Machine Learning

In Lesson 8 you used machine-learning models to predict a different treatment effect for every customer. Here is the sharp question that raises, made concrete. BrightLearn, an online course platform, sells an hour-by-hour tutoring add-on, and its team wants a single number: how many extra exam points does one weekly hour of tutoring actually cause? The obvious move is to throw a flexible model like a random forest at the data and read the effect off. Do that and the answer comes back badly wrong, more than double the truth, because the model quietly biases it. This lesson shows the fix, a way to keep the random forest for the messy parts and still recover one honest treatment effect, and it is one of the most useful ideas in modern causal inference.

By the end you will be able to:

- Explain why plugging a machine-learning model straight into a causal estimate biases it
- Use partialling-out to turn two prediction models into one honest treatment effect
- Cross-fit two random forests in R to recover an effect that ordinary regression gets badly wrong

**Prerequisites:** Lessons 1 and 2 of this course (confounding and potential outcomes, the propensity score and covariate adjustment); you can fit `lm` and a random forest in R and read a coefficient with its confidence interval.

::widget causal-dag {}

=== step === concept
::eyebrow The running example
## The number that lies

We met BrightLearn on the cover: an online course platform whose optional add-on is live one-on-one tutoring, booked by the hour. Its product team asks a question worth real money: **how many extra exam points does one weekly hour of tutoring actually cause?** Get it right and they know what the add-on is worth; get it wrong and they price it, or push it, on a fantasy.

Each lesson runs in a fresh R session, so we build BrightLearn's data right here. We plant the true answer ourselves, **2 points per weekly hour**, so at the very end we can check who recovered it. Four measured student traits drive everything, and they act through sharp thresholds, not neat straight lines (real behaviour usually does).

```r
set.seed(2024)
n <- 1500
ability <- runif(n)   # aptitude score, 0 (low) to 1 (high)
prior   <- runif(n)   # grade in the previous course, 0 to 1
study   <- runif(n)   # weekly self-study, 0 to 1
engage  <- runif(n)   # how much they use the platform, 0 to 1

# Weekly tutoring HOURS booked (the treatment). Keener, abler students book more.
tutoring <- 4 + 4 * (ability > 0.5) + 3 * (prior > 0.6) + 2 * (study < 0.3) + rnorm(n)

# Final exam SCORE. The TRUE causal effect is 2 points per weekly hour (we set it).
score <- 2 * tutoring + 30 + 15 * (ability > 0.5) + 10 * (prior > 0.6) +
         8 * (study < 0.3) + 6 * engage + rnorm(n, sd = 3)

dat <- data.frame(score, tutoring, ability, prior, study, engage)
round(head(dat, 4), 2)
#>   score tutoring ability prior study engage
#> 1 66.06     8.00    0.84  0.41  0.99   0.74
#> 2 42.86     4.29    0.32  0.16  0.87   0.42
#> 3 81.18    11.53    0.68  0.74  0.43   0.95
#> 4 63.00     7.83    0.70  0.49  0.61   0.14
```

Now the obvious thing: regress score on tutoring and read the slope.

```r
round(coef(lm(score ~ tutoring, data = dat))[["tutoring"]], 2)
#> [1] 5.17
```

The data says each weekly hour is worth **5.17 points**. But we planted the truth at **2**. The naive number is off by more than a factor of two, and nothing in the regression output warns you.

[KEY INSIGHT]
This is not sampling noise, more data would keep landing near 5, not near 2. The trouble is that the students who book more tutoring are already different, and those same differences lift their scores. That is confounding, and defeating it is the whole point of this lesson.

=== step === concept
::eyebrow Why it lies
## The hidden third factor

Picture the three things in play. Tutoring hours (the treatment) and exam score (the outcome) are what we care about. But a student's underlying keenness and aptitude sit behind both: an abler, more motivated student books more tutoring AND scores higher, entirely on their own. Draw that and the problem jumps out, there is a second route connecting tutoring to score that has nothing to do with tutoring causing anything.

Switch the widget below to the confounder pattern and run its R. A variable Z drives both X and Y; ignore it and X looks like it moves Y even when it does not. Put Z into the model and the fake effect collapses to about zero. That is exactly BrightLearn's situation, with Z standing in for the student traits.

::widget causal-dag {}

To get an honest effect we must compare students who are alike on those traits, so the only thing left to explain a score gap is the tutoring itself. Writing \(Y\) for score, \(D\) for tutoring hours and \(X\) for the measured traits, we need

\[ \{Y^{d}\}_{d}\ \perp\!\!\!\perp\ D \mid X, \]

read as: once we hold the measured traits \(X\) fixed, how much tutoring a student books is unrelated to the scores they would get at any level of tutoring. This is the **ignorability** (no-unmeasured-confounding) assumption from Lesson 1. Every method today rides on it.

=== step === quiz
::eyebrow Check yourself
## What went wrong with 5.17?

The naive regression reported 5.17 points per weekly tutoring hour; the planted truth is 2. Why is it so far off?

::quiz {"correct":2,"gate":true,"difficulty":"beginner"}
- The sample of 1,500 students is too small, so the estimate is just noisy ::no It is not noise. With 1,500 rows the estimate is quite precise; it is precisely wrong. Rerun with even more data and it keeps landing near 5, not near 2.
- Abler, keener students both book more tutoring and score higher, so the slope mixes tutoring's real effect with those trait differences ::ok Exactly. That is confounding: the traits push tutoring and score up together, and the naive slope credits all of it to tutoring. Only by holding the traits fixed can you isolate the causal part.
- Tutoring genuinely has no effect, and 5.17 is entirely an illusion ::no Tutoring does help; we planted a real effect of 2. The 5.17 is not pure illusion, it is the true 2 plus a confounding inflation of about 3.

=== step === concept
::eyebrow The formalism
## Splitting the world in two

Here is the model that makes the fix precise. We assume the exam score is the tutoring effect plus whatever the traits do on their own, and that tutoring hours are themselves driven by the traits plus some genuinely random slack:

\[ Y = \theta\,D + g(X) + \varepsilon, \qquad D = m(X) + \nu. \]

Take it symbol by symbol.

- \(Y\) is the outcome (exam score), \(D\) the treatment (weekly tutoring hours), \(X\) the measured traits.
- \(\theta\) (theta) is the one number we want: the causal points-per-hour. It is a single slope, assumed the same for everyone, which is why this is the **partially linear** model, linear in \(D\), anything-at-all in \(X\).
- \(g(X)\) is the **outcome nuisance**: everything about the traits that moves the score, apart from tutoring. In BrightLearn it is that jumble of threshold effects.
- \(m(X) = E[D \mid X]\) is the **treatment nuisance**: the tutoring hours you would predict from the traits alone. For a yes/no treatment this is exactly the propensity score from Lesson 2; here, with a continuous treatment, it is its natural generalization.
- \(\varepsilon\) (epsilon) and \(\nu\) (nu) are the leftover randomness in score and in tutoring, the parts no trait can predict.

We call \(g\) and \(m\) **nuisances** because we do not care about them for their own sake; they are only in the way of seeing \(\theta\). The whole game is to pull \(\theta\) out cleanly without having to estimate \(g\) and \(m\) perfectly.

=== step === concept
::eyebrow Idea 1 of 2
## Partial the traits out of both sides

The trick is beautifully symmetric. Predict the score from the traits and keep what is left over. Predict the tutoring hours from the traits and keep what is left over. Then regress one leftover on the other.

Writing \(\tilde Y = Y - g(X)\) for the outcome residual and \(\tilde D = D - m(X)\) for the treatment residual, the effect is just their simple slope:

\[ \theta = \frac{\operatorname{Cov}(\tilde Y, \tilde D)}{\operatorname{Var}(\tilde D)}. \]

Why does this work? \(\tilde D\) is the part of a student's tutoring that the traits could NOT predict, the random slack \(\nu\). Among students the traits rate identically, it is as-good-as-random who books an extra hour, so relating the score leftover to that slack isolates the causal slope. Residualizing the treatment too, not just the outcome, is the "double" in double machine learning.

Let us do it with ordinary linear regressions for \(g\) and \(m\) first, so you can see the machinery on something familiar:

```r
# Residualize each side on the traits with plain linear models, then regress the leftovers.
score_lin <- resid(lm(score    ~ ability + prior + study + engage, data = dat))
tut_lin   <- resid(lm(tutoring ~ ability + prior + study + engage, data = dat))
round(coef(lm(score_lin ~ tut_lin))[["tut_lin"]], 2)
#> [1] 4.39
```

That 4.39 is no coincidence. Partialling-out with linear models gives the exact same number as putting the traits straight into the regression:

```r
round(coef(lm(score ~ tutoring + ability + prior + study + engage, data = dat))[["tutoring"]], 2)
#> [1] 4.39
```

They match to the decimal. This identity has a name, the **Frisch-Waugh-Lovell theorem**, and it is the bridge from "adjust for X" to "residualize on X." We have moved the naive 5.17 down to 4.39. Better, but the truth is 2. Something is still wrong.

=== step === concept
::eyebrow Idea 1, finished
## Why straight lines were never going to be enough

Look again at how we built the data: the traits act through thresholds (`ability > 0.5`, `prior > 0.6`), sharp steps rather than gentle slopes. A linear model for \(g\) and \(m\) can only draw straight lines through that, so it leaves a chunk of the trait effect unexplained, and that leftover leaks straight back into \(\theta\). Worse, in real life you never know the true shape, so you can never hand-write the correct controls.

So replace the two linear models with something that can bend to any shape: a flexible machine-learning learner such as a random forest, which splits exactly on thresholds like `ability > 0.5` and captures them almost perfectly.

There is a catch, and it is the reason double machine learning has to be careful. A flexible learner is deliberately BIASED. To avoid chasing noise it shrinks and smooths its predictions, trading a little bias for a lot less variance. Drag the complexity slider below: a too-flexible model overfits, a too-stiff one underfits, and every useful learner lives in between, carrying some bias on purpose.

::widget bias-variance {}

[KEY INSIGHT]
If you shoved a biased predictor of the score straight into a naive estimate of \(\theta\), that built-in bias would ride along into your effect. Partialling-out is what saves you: because we residualize BOTH sides, the estimate is first-order insensitive to small errors in \(g\) and \(m\). This robustness is called **Neyman orthogonality**, and it is exactly what lets us use a biased ML learner for the nuisances without wrecking \(\theta\).

=== step === quiz
::eyebrow Check yourself
## Why residualize the treatment?

A colleague suggests a shortcut: "Let's just predict score from the traits with a random forest, subtract to get the score residual, and regress that on raw tutoring hours. One model, less work." Why is that not double machine learning, and why can it stay biased?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Raw tutoring is still tangled with the traits, so its trait-driven part sneaks the confounding back in; you must residualize the treatment too, so what remains is the as-good-as-random slack ::ok Right. Regressing on raw tutoring leaves m(X) inside it, and any error in the score model then correlates with that trait-driven part. Residualizing both sides is what makes the score orthogonal, first-order insensitive, to nuisance error.
- It works fine; residualizing only the outcome is the standard method and gives the same answer ::no It is not the same. Dropping the treatment-side residualization loses Neyman orthogonality, so the learner's bias leaks into the effect. The symmetry, both sides, is the whole point.
- A random forest cannot predict a continuous outcome like score, so the first model is invalid ::no A random forest predicts continuous outcomes perfectly well (regression trees). The flaw here is statistical, not that the model cannot run.

=== step === concept
::eyebrow Idea 2 of 2
## Cross-fitting: never score a row with a model that saw it

One subtlety remains. If you fit the forest for \(g\) on the same rows where you then compute residuals, the forest has partly memorized those rows, so its residuals there are artificially small in a way that quietly correlates with \(\tilde D\). That is overfitting bias, and it can spoil the honesty of your confidence interval however orthogonal the score is.

The fix is **cross-fitting**. Split the rows into K folds. To residualize a fold, fit the two nuisance forests on the OTHER folds and predict into the held-out one. Rotate until every row has been residualized by models that never trained on it. It is the rotating-holdout idea from cross-validation, used here not to score a model but to compute clean residuals. Step through the folds below.

::widget cv-folds {"k":5}

[NOTE]
Cross-fitting is what earns you a trustworthy standard error when the nuisances are flexible ML: it removes the own-row bias that would otherwise demand unrealistically well-behaved learners. On a large, clean sample the point estimate barely moves with or without it, but the guarantee, valid root-n inference no matter how you fit the nuisances, is why every serious DML implementation cross-fits by default.

=== step === widget
::eyebrow The recipe
## Double machine learning, in five steps

Put the two ideas together and you have the whole method. Orthogonalize (residualize both sides) so the estimate shrugs off nuisance error; cross-fit so overfitting cannot sneak in. Everything else is bookkeeping.

::widget process-flow {"steps":[{"title":"Split into K folds","sub":"divide the rows at random into K equal groups"},{"title":"Fit both nuisance models","sub":"on the other folds, predict the outcome and the treatment from X"},{"title":"Residualize the held-out fold","sub":"subtract the predictions to get outcome and treatment residuals"},{"title":"Rotate through every fold","sub":"so each row is residualized by models that never saw it"},{"title":"Regress residual on residual","sub":"the slope is the effect; its standard error is valid"}]}

That is double machine learning: two nuisance models, one orthogonal score, cross-fit. Now let us run it on BrightLearn.

=== step === concept
::eyebrow In R
## Cross-fit two forests

Here is the whole estimator in base R plus one call to `randomForest`. We loop over 5 folds; each pass fits the outcome forest \(g\) and the treatment forest \(m\) on the other four folds, then residualizes the held-out fold. When the loop finishes, every row carries an outcome residual and a treatment residual computed honestly out-of-fold.

```r
library(randomForest)
set.seed(1)
K       <- 5
folds   <- sample(rep(1:K, length.out = n))   # a random fold label for each row
Xcols   <- c("ability", "prior", "study", "engage")
score_res <- numeric(n)   # score,   minus what the traits predict
tut_res   <- numeric(n)   # tutoring, minus what the traits predict

for (k in 1:K) {
  train <- folds != k     # fit the nuisance forests on the OTHER folds
  hold  <- folds == k     # residualize on THIS held-out fold
  g_fit <- randomForest(dat[train, Xcols], dat$score[train],    ntree = 200)  # outcome model g(X)
  m_fit <- randomForest(dat[train, Xcols], dat$tutoring[train], ntree = 200)  # treatment model m(X)
  score_res[hold] <- dat$score[hold]    - predict(g_fit, dat[hold, Xcols])
  tut_res[hold]   <- dat$tutoring[hold] - predict(m_fit, dat[hold, Xcols])
}
round(c(resid_sd = sd(tut_res), raw_sd = sd(dat$tutoring)), 2)
#> resid_sd   raw_sd 
#>     1.08     2.81 
```

The treatment residual is much tighter than raw tutoring (spread 1.08 versus 2.81): the forest soaked up the trait-driven part of who books tutoring, leaving the near-random slack behind. And 1.08 is close to the slack we actually built in (`rnorm(n)`, spread 1), a sign the forest recovered \(m(X)\) well.

=== step === tryit
::eyebrow Your turn
## Turn the residuals into the effect

Everything comes down to one line. You have `score_res` and `tut_res`, the two cross-fitted residual columns. Regress the outcome residual on the treatment residual; the slope is the causal effect. Fill in the treatment residual.

```r
dml <- lm(score_res ~ ____)   # regress the outcome leftover on the treatment leftover
round(coef(dml)[["tut_res"]], 2)
```
::check {"regex":"score_res\\s*~\\s*tut_res","gate":true,"difficulty":"intermediate","ok":"That is the estimate: about 2.15 points per weekly hour, a hair above the true 2 and worlds better than the naive 5.17. Two forests and one regression just recovered a causal effect that ordinary regression missed by more than double.","no":"Regress the outcome residual on the treatment residual: lm(score_res ~ tut_res)."}
::solution
```r
dml <- lm(score_res ~ tut_res)
round(coef(dml)[["tut_res"]], 2)
#> [1] 2.15
```

=== step === concept
::eyebrow The payoff
## Read the estimate, and its honesty

The residual-on-residual regression is an ordinary `lm`, so it hands you a valid standard error and confidence interval for free:

```r
est <- coef(dml)[["tut_res"]]
se  <- summary(dml)$coefficients["tut_res", "Std. Error"]
round(c(estimate = est, std_error = se,
        conf_low = est - 1.96 * se, conf_high = est + 1.96 * se), 2)
#>  estimate std_error  conf_low conf_high 
#>      2.15      0.08      1.99      2.31 
```

Line the four estimators up:

| Method | Effect per weekly hour | Off by |
|---|---|---|
| Truth (we planted it) | 2.00 | - |
| Naive regression | 5.17 | +3.17 |
| Linear controls | 4.39 | +2.39 |
| Double machine learning | 2.15 | +0.15 |

Naive credited tutoring with more than twice its real worth. Linear controls, even with all four traits, barely helped, because the confounding was not straight-line shaped. Double machine learning, using forests flexible enough to catch the thresholds, lands at 2.15 with a 95% interval of 1.99 to 2.31 that comfortably covers the true 2.

DML is not magic: 2.15 is not exactly 2, and that small gap is honest finite-sample slack the confidence interval already accounts for. In practice you would not hand-roll the loop; the `DoubleML` package does all of this, with your choice of learner, in a few lines:

```r-static
# In practice: the DoubleML package (run this in a full R install, not in this browser session).
library(DoubleML); library(mlr3)
dml_data <- double_ml_data_from_data_frame(dat,
              y_col = "score", d_cols = "tutoring",
              x_cols = c("ability", "prior", "study", "engage"))
dml_plr <- DoubleMLPLR$new(dml_data,
              ml_l = lrn("regr.ranger"), ml_m = lrn("regr.ranger"),
              n_folds = 5)
dml_plr$fit()
dml_plr$summary()
```

=== step === concept
::eyebrow The fine print
## When it works, and when it breaks

Double machine learning is powerful, not miraculous. Three conditions decide whether that 2.15 is trustworthy.

- **You still need ignorability.** DML removes bias from the confounders you MEASURED and fed into \(X\). A confounder you never recorded, say a private tutor a student hires outside BrightLearn, sits outside \(X\) and DML cannot touch it. It relaxes the FORM of the confounding, never the requirement that you measured it.
- **You need overlap.** Every kind of student must show some real variation in tutoring hours. If the ablest students ALWAYS book the maximum, there is no as-good-as-random slack \(\nu\) left for them, and no method can separate tutoring from ability there.
- **The nuisances must converge, together.** DML tolerates slow, biased learners because of a rate bargain: if each nuisance is estimated with error shrinking faster than \(n^{-1/4}\), then their PRODUCT shrinks faster than \(n^{-1/2}\), which is exactly fast enough for \(\theta\) to be root-n normal:

\[ \underbrace{\lVert \hat g - g\rVert \cdot \lVert \hat m - m\rVert}_{\text{product of the two errors}} = o\!\left(n^{-1/2}\right). \]

Read the product literally: neither model has to be excellent, but they cannot BOTH be poor. A forest that badly misfits \(g\) and \(m\) gives a badly biased \(\theta\), orthogonality or not. Garbage nuisances, garbage effect.

[WARNING]
DML is not a licence to stop thinking about confounders. It buys you freedom in the functional FORM of the nuisance models, not freedom from the no-unmeasured-confounding assumption. That assumption is precisely what the next lesson learns to stress-test.

=== step === quiz
::eyebrow Check yourself
## What DML does and does not fix

BrightLearn's analyst reruns the study but forgets to record whether each student also hired a private outside tutor, a factor that raises both BrightLearn tutoring and exam scores. She still runs the full cross-fit DML with random forests. What happens to her estimate?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- Cross-fitting automatically detects and removes the missing-confounder bias, so the estimate is still valid ::no Cross-fitting removes overfitting bias from the nuisance models; it has no way to adjust for a variable that is not in the data at all. It cannot fix what it cannot see.
- The forests are flexible enough to reconstruct the missing tutor variable from the others, so DML recovers the true effect ::no Flexible learners can only use the columns you give them. They cannot conjure a confounder that was never measured; whatever it shares with the recorded traits is only partially and accidentally captured.
- The estimate is biased again, because DML only defeats confounding from the traits you measured; an unmeasured confounder violates ignorability and no amount of ML fixes that ::ok Exactly. DML relaxes the FORM of the confounding you can model, not the need to have measured it. Leave a real confounder out and you are back to a biased effect, which is why the next lesson stress-tests this very assumption.

=== step === concept
::eyebrow Go deeper
## References

Four authoritative places to take this further:

- [Chernozhukov et al. (2018), Double/Debiased Machine Learning for Treatment and Structural Parameters (The Econometrics Journal)](https://doi.org/10.1111/ectj.12097) - the paper that defined the method: orthogonal scores, cross-fitting, and the root-n theory.
- [Robinson (1988), Root-N-Consistent Semiparametric Regression (Econometrica)](https://doi.org/10.2307/1912705) - the partially linear model and the partialling-out estimator DML generalizes.
- [Bach, Chernozhukov, Kurz and Spindler, the DoubleML package for R (documentation)](https://docs.doubleml.org/stable/) - the production implementation you would reach for instead of hand-coding the loop.
- [Chernozhukov et al. (2017), Double/Debiased/Neyman Machine Learning of Treatment Effects (American Economic Review, Papers and Proceedings)](https://doi.org/10.1257/aer.p20171038) - a short, readable companion to the full paper.

=== step === complete
## Lesson 9 complete

You can now put a random forest inside a causal estimate without letting it wreck the answer. Three ideas did the work: **partialling-out** both the outcome and the treatment, so the estimate shrugs off nuisance error (Neyman orthogonality); **flexible ML** for the two nuisance functions, so nonlinear confounding is actually captured; and **cross-fitting**, so overfitting cannot corrupt the inference. On BrightLearn they turned a naive 5.17 into an honest 2.15, with the true effect inside the confidence interval.

Next, Lesson 10: Sensitivity Analysis and Placebo Tests. Every method in this course, DML included, leans on the one assumption it cannot check from the data: that you measured every confounder. Next you will learn to ask how strong a hidden confounder would have to be to overturn your result, and to set traps that catch a biased design in the act.
