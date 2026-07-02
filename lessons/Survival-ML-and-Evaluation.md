---
title: "Survival Analysis Lesson 7: Survival ML and Evaluation"
catalog_blurb: "How to score a survival model honestly so its predictions can be trusted."
description: "Fit a random survival forest, then score any survival model honestly: Harrell's C-index for ranking and the time-dependent Brier score for calibration, in R."
keywords: "random survival forest in R, Harrell C-index, concordance survival model, time-dependent Brier score, IPCW, survival model evaluation, calibration, ranger, model discrimination"
post_type: "LESSON"
curriculum_id: "6.150.7"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-survival"
course_title: "Survival Analysis"
course_lesson: "7"
course_total: "7"
course_landing: "R-Survival-Analysis-Course.html"
course_next: ""
course_prev: "Competing-Risks-and-Cumulative-Incidence.html"
---

=== step === cover
::eyebrow Lesson 7 of 7
## Survival ML and Evaluation

Every model in this course so far, the Kaplan-Meier curve, the Cox model, the Weibull fit, the Fine-Gray model, was a shape you chose by hand. This last lesson does two new things. First, you let a model learn the shape of risk for you: a random survival forest. Second, and this is the part most courses skip, you learn to answer the only question that matters once a model exists: how good is it, honestly? Dr. Rao has built a recurrence model for her cancer clinic and needs to know whether to trust it before a single patient hears its number.

By the end of this lesson you will be able to:

- Explain what a random survival forest predicts and why it assumes nothing about the shape of risk
- Score a survival model's ranking with Harrell's C-index, on data it never saw
- Score whether its predicted probabilities are actually right with the time-dependent Brier score, and see why you need both

**Prerequisites:** [Lesson 1](Survival-Data-and-Censoring.html) (the survival function and censoring), [Lesson 2](Kaplan-Meier-and-the-Log-Rank-Test.html) (the KM curve), and [Lesson 3](Cox-Proportional-Hazards.html) (the Cox model and its linear predictor). You can read a coefficient table and run R.

The widget below is the whole second half of the lesson in one picture. A model can be confident and still be wrong: drag the slider and watch its predicted probabilities drift away from what actually happens. Learning to catch that is the skill this lesson builds.

::widget calibration-curve {}

=== step === concept
::eyebrow The model
## Let the forest learn the shape

Recall Lesson 3. To use a Cox model you commit, in advance, to a shape: every covariate acts on the log-hazard in a straight line, and the hazard ratio between any two patients stays constant for all time. That is the proportional-hazards assumption, and Lesson 4 was all about checking it. A random survival forest throws that commitment away and lets the data draw the shape.

It is built like the classification forests you may have seen, with one twist for censored time. Grow many decision trees. Each tree splits patients into groups, but instead of choosing splits to separate two classes, it chooses the split that most separates survival, scored by the log-rank statistic you met in Lesson 2. Every patient lands in a leaf, and that leaf holds a small Kaplan-Meier curve built from the patients in it. Send a new patient down all the trees, average the leaf curves, and you get one smooth predicted survival curve for that patient, with no proportional-hazards assumption and no Weibull anywhere.

::widget tree-diagram {"root":"tumor grade 3 plus?","l":"age under 52?","r":"age under 59?","leaves":["lower risk","higher risk","high risk","highest risk"]}

First, Dr. Rao's cohort of 400 patients, built right here so the page is self-contained (run this once; later blocks reuse `dat`, `train` and `test`):

```r
library(survival)

set.seed(11)
n      <- 400
age    <- round(runif(n, 40, 80))            # years
nodes  <- rpois(n, 4)                         # cancer-positive lymph nodes
grade  <- sample(1:3, n, replace = TRUE)      # tumor grade, 1 (mild) to 3 (aggressive)

# a real risk signal: the recurrence hazard rises with age, nodes and grade
lp     <- 0.04 * (age - 60) + 0.15 * nodes + 0.5 * (grade - 1)
t_evt  <- rexp(n, rate = 0.02 * exp(lp))      # month of recurrence, if we saw it
t_cens <- runif(n, 0, 60)                     # dropout or end of study, in months

time   <- pmin(t_evt, t_cens)                 # we observe whichever comes first
status <- as.integer(t_evt <= t_cens)         # 1 = recurrence seen, 0 = censored
dat    <- data.frame(time = round(time, 1), status, age, nodes, grade)
table(dat$status)
#>
#>   0   1
#> 119 281
```

The building block of the forest is a single survival tree, and that one you can grow right here with `rpart`. Handing it `Surv(time, status)` as the response tells it to split on survival, not on a class. We also carve off a held-out test set now, because every honest score later depends on it:

```r
library(rpart)

set.seed(1)
idx   <- sample(nrow(dat), 0.7 * nrow(dat))   # 70% to train, 30% held out for scoring
train <- dat[idx, ]
test  <- dat[-idx, ]

stree <- rpart(Surv(time, status) ~ age + nodes + grade, data = train,
               control = rpart.control(cp = 0.02))
stree
#> n= 280
#>
#> node), split, n, deviance, yval
#>       * denotes terminal node
#>
#>  1) root 280 379.2137 1.0000000
#>    2) grade< 2.5 169 218.2516 0.7620804
#>      4) age< 51.5  46  47.1395 0.4030200 *
#>      5) age>=51.5 123 153.2829 0.9901318
#>       10) nodes< 2.5 38  47.3188 0.5780007 *
#>       11) nodes>=2.5 85  93.7298 1.2817000 *
#>    3) grade>=2.5 111 133.2254 1.6240180
#>      6) age< 58.5 58  79.0148 1.1909480 *
#>      7) age>=58.5 53  43.3282 2.3413410 *
```

Read the leaves. The `yval` column is a relative event rate: the youngest, low-grade patients (node 4) sit at 0.40, while the older, high-grade patients (node 7) are at 2.34, nearly six times higher. The tree carved the cohort into risk groups with no shape imposed on how risk grows.

A forest is hundreds of such trees, each grown on a bootstrap sample and averaged. That needs the `ranger` package, which does not run in the browser, so this block is one to run on your own machine:

```r-static
# install.packages("ranger") first, then run locally
rsf <- ranger::ranger(Surv(time, status) ~ age + nodes + grade, data = train,
                      num.trees = 500, importance = "permutation")
rsf
#> Ranger result
#> Type:                             Survival
#> Number of trees:                  500
#> Sample size:                      280
#> Mtry:                             2
#> Splitrule:                        logrank
#> Number of unique death times:     125
#> OOB prediction error (1-C):       0.362

# every test patient gets a full predicted survival curve (one column per death time)
pred <- predict(rsf, data = test)
dim(pred$survival)
#> [1] 120 125
```

We now have a model that predicts a whole curve per patient. The rest of the lesson is the question that actually matters: is it any good?

=== step === quiz
::eyebrow Check yourself
## What did the forest give you?

You fit a random survival forest to Dr. Rao's data. For one new patient, what does it hand you, and what did it assume about how risk changes over time?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- A single predicted survival time, the number of months until recurrence, assuming risk stays constant ::no A forest does not output one time. Each tree sends the patient to a leaf holding a Kaplan-Meier curve, and averaging those gives a whole predicted survival curve, with no constant-risk assumption.
- A full predicted survival curve, having assumed no proportional-hazards or parametric shape ::ok Right. Each tree drops the patient into a leaf with its own KM curve; the forest averages them into a smooth survival curve for that patient, learned from the data with no PH or Weibull form baked in.
- A hazard ratio for each covariate, exactly like a Cox model ::no That is Cox output. A forest is nonparametric: it predicts curves, not one interpretable hazard ratio per covariate. It reports variable importance instead.
- Nothing usable, because random forests cannot handle censored data ::no They handle it directly: splits are chosen by the log-rank statistic and each leaf is a Kaplan-Meier curve, both of which are built for censoring.

=== step === concept
::eyebrow Why scoring is hard
## You cannot grade a survival model with accuracy

Here is the trap. With an ordinary classifier you would predict yes or no, compare to the truth, and report accuracy. A survival model breaks that in two ways at once, and both trace back to the same source: censored time.

First, the model does not output a label. It outputs a curve, a predicted probability of surviving for every future month. There is no single yes or no to check. Second, the truth itself is often unknown. A patient censored at 18 months has no recorded recurrence, but that does not mean they were cured; you simply stopped watching. Count them as a non-event and you flatter the model.

So honest evaluation splits into two separate questions, and a good report answers both.

::widget process-flow {"steps":[{"title":"Hold out","sub":"score on patients the model never trained on"},{"title":"Predict a curve","sub":"each patient gets a survival curve, not a label"},{"title":"Discrimination","sub":"does it rank who fails first? the C-index"},{"title":"Calibration","sub":"are the predicted probabilities right? the Brier score"}]}

**Discrimination** asks whether the model gets the ORDER right: given two patients, does it assign the higher risk to the one who actually fails sooner? **Calibration** asks whether the NUMBERS are right: of all the patients it called 30 percent likely to survive, did about 30 percent actually survive? A model can ace one and fail the other, so we measure them separately, with a different tool each. The rest of the lesson is those two tools.

=== step === concept
::eyebrow Discrimination
## Harrell's C-index: getting the order right

Start with the intuition, because the formula is just this idea counted up. Take any two patients whose fates you can compare, meaning you know which one recurred first. (If the earlier of the two was censored, you cannot tell who would have failed first, so that pair is skipped.) The model gets a pair right, a concordant pair, if it gave the higher risk to the patient who actually recurred first. Harrell's concordance index, the C-index, is simply the fraction of comparable pairs the model orders correctly:

\[ C = \frac{\text{number of concordant pairs}}{\text{number of comparable pairs}}. \]

A \(C\) of \(0.5\) is a coin flip: the model orders patients no better than chance. A \(C\) of \(1.0\) is a perfect ranking. In practice \(0.6\) to \(0.75\) is typical for clinical risk models. If you have met the AUC for a yes/no classifier, the C-index is its survival cousin, the same concordance idea extended to censored time. Slide the threshold below to feel discrimination as pure ranking: a higher AUC means the score separates the two groups better, which is exactly what the C-index measures for survival.

::widget roc-curve {}

Now compute it for Dr. Rao's Cox model. The `concordance()` function in the survival package does the pair counting for you. Point it at the fitted model and it reports the C-index on the training data:

```r
cox <- coxph(Surv(time, status) ~ age + nodes + grade, data = train)
concordance(cox)                       # C-index on the training data
#> Call: concordance.coxph(object = cox)
#>
#> n= 280
#> Concordance= 0.6884 se= 0.02021
```

That 0.688 is optimistic, though: the model has already seen these patients. The honest number is on the held-out test set. The one subtlety is direction. `predict(type = "lp")` returns the linear predictor, where a HIGHER value means MORE risk and so SHORTER survival, while `concordance()` by default expects a larger score to mean longer survival. `reverse = TRUE` tells it the score is a risk score:

```r
lp_test <- predict(cox, newdata = test, type = "lp")   # risk score: higher = more risk
concordance(Surv(time, status) ~ lp_test, data = test, reverse = TRUE)
#> Call: concordance.formula(object = Surv(time, status) ~ lp_test,
#>     data = test, reverse = TRUE)
#>
#> n= 120
#> Concordance= 0.7085 se= 0.0335

cox_weak <- coxph(Surv(time, status) ~ age, data = train)   # a model that knows only age
lp_weak  <- predict(cox_weak, newdata = test, type = "lp")
concordance(Surv(time, status) ~ lp_weak, data = test, reverse = TRUE)$concordance
#> [1] 0.6184
```

The full model scores 0.71 on patients it never saw; the weaker, age-only model scores 0.62. Both beat a coin flip, and the C-index cleanly ranks the two the way you would hope.

=== step === tryit
::eyebrow Your turn
## Score it on the held-out patients

The single most common way people fool themselves is scoring on the training data (that optimistic 0.688). The honest C-index uses the patients the model never trained on. Fill in the blank so the linear predictor is computed on the held-out test set.

```r
lp_test <- predict(cox, newdata = ____, type = "lp")
concordance(Surv(time, status) ~ lp_test, data = test, reverse = TRUE)
```
::check {"regex":"newdata\\s*=\\s*test","gate":true,"difficulty":"intermediate","ok":"Exactly. Scoring on test, the patients the model never saw, gives the honest 0.71. The training concordance is always the more flattering number, because the model already fit those rows.","no":"Point predict() at the held-out data: newdata = test. Scoring on train reports the optimistic training C-index, not how the model does on new patients."}
::solution
```r
lp_test <- predict(cox, newdata = test, type = "lp")
concordance(Surv(time, status) ~ lp_test, data = test, reverse = TRUE)
```

=== step === concept
::eyebrow Calibration and accuracy
## The time-dependent Brier score

A high C-index only means the ranking is good. It says nothing about whether a predicted "30 percent chance of surviving two years" is actually right. That is calibration, and the tool for it is the Brier score: at a chosen horizon \(t^{\star}\), it is the average squared gap between the predicted survival probability and what actually happened.

For patient \(i\) with predicted survival \(\hat S(t^{\star}\mid x_i)\), the target is \(1\) if they are still event-free at \(t^{\star}\) and \(0\) if they have already had the event. Averaging the squared error would be the plain Brier score, but censoring means some targets are unknown, so each known case is up-weighted by \(\hat G\), the Kaplan-Meier probability that a patient was still under observation:

\[ \mathrm{BS}(t^{\star}) = \frac{1}{n}\sum_{i=1}^{n}\left[ \frac{\hat S(t^{\star}\mid x_i)^2 \, \mathbb{1}(T_i \le t^{\star},\ \delta_i = 1)}{\hat G(T_i)} + \frac{\bigl(1 - \hat S(t^{\star}\mid x_i)\bigr)^2 \, \mathbb{1}(T_i > t^{\star})}{\hat G(t^{\star})} \right]. \]

Here \(T_i\) is the observed time and \(\delta_i\) the event indicator. The first term counts patients who had the event by \(t^{\star}\) (target \(0\)), the second counts those known to survive past it (target \(1\)), and patients censored before \(t^{\star}\) drop out, their fate handled through the weights. Those inverse-probability-of-censoring weights, from Graf and colleagues (1999), are what keep the score honest under censoring. Lower is better; \(0\) is perfect.

The widget shows what calibration means: bin the predictions and plot predicted against observed frequency. Sitting on the diagonal is perfect; bowing away from it is over- or under-confidence, and the Brier score is one number for how far off the whole picture is.

::widget calibration-curve {}

Compute it at 24 months for the Cox model. First the censoring curve \(\hat G\) and the model's predicted 24-month survival for each test patient:

```r
tstar <- 24                                    # score survival to 24 months

# G(t): the Kaplan-Meier of the CENSORING process (flip the indicator).
# It is how likely a patient was still under observation at time t.
cens_fit <- survfit(Surv(time, 1 - status) ~ 1, data = test)
Gstep    <- stepfun(cens_fit$time, c(1, cens_fit$surv))

sf      <- survfit(cox, newdata = test)        # a predicted curve per test patient
S_tstar <- as.numeric(summary(sf, times = tstar)$surv)   # P(survive past 24 mo), one per patient
round(head(S_tstar), 3)
#> [1] 0.002 0.473 0.298 0.060 0.092 0.392
```

Then the censoring-weighted squared error, with a null model (one marginal KM curve for everyone) as a yardstick for what "no skill" scores:

```r
ev_before <- test$time <= tstar & test$status == 1   # had the event by 24 mo (target 0)
surv_past <- test$time >  tstar                       # known event-free past 24 mo (target 1)

brier <- function(Shat) {
  term_before <- ifelse(ev_before, (0 - Shat)^2 / Gstep(test$time), 0)
  term_past   <- ifelse(surv_past, (1 - Shat)^2 / Gstep(tstar),     0)
  mean(term_before + term_past)
}

bs_full <- brier(S_tstar)                                     # the Cox model
km0     <- survfit(Surv(time, status) ~ 1, data = train)      # null: same curve for everyone
bs_null <- brier(rep(summary(km0, times = tstar)$surv, nrow(test)))
round(c(cox = bs_full, null = bs_null), 3)
#>   cox  null
#> 0.198 0.250
```

The Cox model scores 0.198 against the null's 0.250: predicting each patient's own curve beats quoting the cohort average to everyone. That gap is the model's calibration skill. Average the Brier score over many horizons instead of just 24 months and you get the Integrated Brier Score, a single summary of the whole curve.

=== step === quiz
::eyebrow Check yourself
## Two numbers that can disagree

Model A and Model B are scored on the same held-out patients. Model A has the higher C-index; Model B has the lower (better) Brier score at 24 months. What is the most accurate reading?

::quiz {"correct":3,"gate":true,"difficulty":"advanced"}
- Model A is simply better, since a higher C-index always means a better model ::no The C-index measures only RANKING (discrimination). It says nothing about whether the predicted probabilities are numerically right, which is what the Brier score checks.
- The results must be a mistake, because the better model should win on both ::no Not a mistake. Discrimination and calibration are different properties; a model can rank patients well yet report probabilities that are systematically off, and the reverse can happen too.
- Model A ranks patients better, but Model B's predicted probabilities are more accurate; which to prefer depends on whether you need ranking or trustworthy numbers ::ok Exactly. The C-index rewards getting the ORDER right; the Brier score rewards getting the NUMBERS right. They can disagree, so you report both and choose by the decision at hand (triage ordering versus a quotable risk).
- The two scores measure the same thing, so one of them was computed wrong ::no They measure different things: discrimination (order) versus calibration and accuracy (are the probabilities right). Disagreement is expected, not an error.

=== step === tryit
::eyebrow Your turn
## Same ranking, wrecked calibration

Here is the proof that you need both numbers. Take the SAME model's predictions and make them over-confident: push every probability toward 0 or 1. That keeps the ranking of patients identical, so the C-index must be unchanged. Fill in the held-out data so the two C-indexes are computed on `test`.

```r
S_over    <- plogis(3 * qlogis(pmin(pmax(S_tstar, 1e-3), 1 - 1e-3)))  # push toward the extremes
risk_full <- 1 - S_tstar
risk_over <- 1 - S_over

c(full = concordance(Surv(time, status) ~ risk_full, data = test, reverse = TRUE)$concordance,
  over = concordance(Surv(time, status) ~ risk_over, data = ____, reverse = TRUE)$concordance)
```
::check {"regex":"data\\s*=\\s*test","gate":true,"difficulty":"advanced","ok":"Right, both come back at 0.7085. The C-index depends only on the ORDER of the risk scores, and squashing the probabilities toward 0 and 1 does not change their order, so discrimination is untouched.","no":"Score both on the held-out set: data = test. The point is that the two risk scores share an identical ordering, so their C-index is the same on the same data."}
::solution
```r
S_over    <- plogis(3 * qlogis(pmin(pmax(S_tstar, 1e-3), 1 - 1e-3)))
risk_full <- 1 - S_tstar
risk_over <- 1 - S_over

c(full = concordance(Surv(time, status) ~ risk_full, data = test, reverse = TRUE)$concordance,
  over = concordance(Surv(time, status) ~ risk_over, data = test, reverse = TRUE)$concordance)
#> full  over
#> 0.7085 0.7085
```

Identical C-index. Now score the same two sets of probabilities with the Brier score, which cares about the numbers, not just their order:

```r
round(c(cox = brier(S_tstar), overconfident = brier(S_over)), 3)
#>           cox overconfident
#>         0.198         0.227
```

Same ranking, same C-index, but the over-confident probabilities are measurably worse: 0.227 against 0.198. A single number could never have caught that. This is why an honest report always carries both.

=== step === concept
::eyebrow Go deeper
## References

Five authoritative places to take survival ML and its evaluation further:

- [Ishwaran, Kogalur, Blackstone and Lauer (2008), "Random Survival Forests", Annals of Applied Statistics 2(3)](https://doi.org/10.1214/08-AOAS169) - the paper that defined the method you fit here.
- [Wright and Ziegler (2017), "ranger: A Fast Implementation of Random Forests for High Dimensional Data in C++ and R", Journal of Statistical Software 77(1)](https://doi.org/10.18637/jss.v077.i01) - the package used for the forest, including its survival mode.
- [Therneau, "The concordance statistic and the Cox model" (survival package vignette, CRAN)](https://cran.r-project.org/web/packages/survival/vignettes/concordance.pdf) - the canonical R reference for the C-index and the `concordance()` function.
- [Gerds and Schumacher (2006), "Consistent Estimation of the Expected Brier Score in General Survival Models with Right-Censored Event Times", Biometrical Journal 48(6)](https://doi.org/10.1002/bimj.200610301) - the theory behind the censoring-weighted Brier score you computed.
- [James, Witten, Hastie and Tibshirani, "An Introduction to Statistical Learning", ch. 11 (free PDF)](https://www.statlearning.com/) - a gentle, rigorous chapter on survival analysis and evaluation.

=== step === complete
## Lesson 7 complete, and the course with it

You closed the loop. A **random survival forest** grows many survival trees, each split by the log-rank statistic and each leaf a Kaplan-Meier curve, then averages them into a predicted survival curve per patient, with no proportional-hazards or parametric shape assumed. And you learned to score any survival model honestly, on data it never saw, along two separate axes: **Harrell's C-index** for discrimination, the fraction of comparable pairs it ranks correctly (0.71 for the full Cox model, 0.62 for the age-only one), and the **time-dependent Brier score** for calibration and accuracy, the censoring-weighted squared error of its probabilities (0.198 against a null of 0.250). The finale tied them together: an over-confident copy of the same model kept an identical C-index but a worse Brier, proof that ranking well and being right are different things, and that you need both numbers before you trust a model with a patient.

One honest surprise is worth keeping. On this cohort the plain Cox model came out a little ahead of the forest (its held-out C-index 0.71 against the forest's out-of-bag C-index of 0.64, the 1 - 0.362 it reported above), because the true risk really was close to proportional, exactly what Cox assumes. A forest earns its keep when the shape is genuinely complex; the only way to know either way is to score them, which is the skill you now have.

That completes Survival Analysis. You began with what makes time-to-event data special, built the Kaplan-Meier curve and the Cox model, checked their assumptions, handled parametric, competing-risks and now machine-learning settings, and finished able to let a model learn the shape and to judge it fairly. Every model you fit from here, you can defend with a number.
