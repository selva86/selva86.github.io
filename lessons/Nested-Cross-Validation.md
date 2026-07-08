---
title: "Model Evaluation Lesson 3: Nested Cross-Validation"
catalog_blurb: "How to report a tuned model's accuracy honestly, not an optimistic guess."
description: "Nested cross-validation in R: why tuning and scoring on the same folds inflates your accuracy, and how an outer loop delivers an honest estimate of a tuned model."
keywords: "nested cross-validation, nested CV, hyperparameter tuning, model selection bias, optimistic bias, cross-validation in R, outer loop inner loop, winners curse, R"
post_type: "LESSON"
curriculum_id: "6.70.3"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-evaluation-tuning"
course_title: "Model Evaluation and Tuning in R"
course_lesson: "3"
course_total: "7"
course_landing: "R-Model-Evaluation-Course.html"
course_next: "Hyperparameter-Tuning-Strategies.html"
course_prev: "Grouped-Blocked-and-Time-Aware-CV.html"
---

=== step === cover
::eyebrow Lesson 3 of 7
## Nested Cross-Validation

You run a small bakery and want to predict tomorrow's cake sales from the day's high temperature. You try eight candidate models, use cross-validation to score each, and keep the best: it lands 7.7 cakes off, on average. You quote that number to your supplier. The trouble is you picked that model *because* it scored best on those exact folds, so 7.7 is the luckiest of eight tries, not the honest truth. This lesson shows you how to get a number you can actually stand behind.

By the end you will be able to:

- Explain why tuning and scoring on the same cross-validation flatters your accuracy
- Set up nested cross-validation: an outer loop that grades, wrapping an inner loop that tunes
- Say exactly what the outer scores estimate, and how you still choose the final model to ship

**Prerequisites:** Lesson 1 (k-fold cross-validation), Lesson 2 (grouped and time-aware CV), and you know that "tuning" means trying several settings of a knob and keeping the best. You can fit `lm()` and call `predict()`.

::widget cv-folds {}

=== step === concept
::eyebrow The trap
## One cross-validation cannot both choose and grade

In Lesson 2 you plugged the leak where a careless *split* lets test rows sneak into training. There is a subtler leak left, and it does not come from the split at all. It comes from *choosing*.

Here is the whole problem in one sentence: **if you use one cross-validation to pick the best model AND to report its score, that score is too good.** Picking the winner is itself a decision made from the folds, so the winner's fold score is partly real skill and partly the luck that made it come out on top this time.

An everyday version: let 20 students each guess tomorrow's temperature, then crown whoever guessed closest and announce "my best student predicts within 1 degree." Tomorrow that same student is off by 6. You never measured the student's skill. You measured the luck of picking the best of 20 after seeing the answer.

[WARNING]
The more candidates you compare on the same folds (degrees, values of `mtry`, penalties, whole algorithms), the more the winner's score is inflated. Comparing two models barely bends it; comparing fifty bends it a lot. This is the winner's curse, and it is invisible unless you look for it.

=== step === concept
::eyebrow See it in numbers
## The optimism, measured

Let us catch the bias red-handed. We will simulate 120 days of the bakery so we know the real truth: sales genuinely follow a gentle curve in temperature, plus day-to-day noise. Build the data once (each lesson runs in a fresh R session):

```r
# 120 days: cake sales vs the day's high temperature (simulated so we know the truth).
set.seed(1)
n     <- 120
temp  <- runif(n, 5, 35)                                  # daily high, degrees C
sales <- 40 + 6 * temp - 0.15 * temp^2 + rnorm(n, 0, 8)   # a curve + noise (sd 8 cakes)
cake  <- data.frame(temp = temp, sales = sales)
dim(cake)
#> [1] 120   2
```

The tuning knob is the **polynomial degree**: how curvy a line we fit. Degree 1 is a straight line, degree 8 wiggles a lot. We score each degree with plain 5-fold CV and keep the best, exactly what you would do in practice:

```r
cv_rmse <- function(degree, df, k = 5) {
  set.seed(7)
  fold <- sample(rep(1:k, length.out = nrow(df)))
  err  <- numeric(k)
  for (f in 1:k) {
    tr <- df[fold != f, ]                                 # training folds
    va <- df[fold == f, ]                                 # the held-out fold
    fit    <- lm(sales ~ poly(temp, degree), data = tr)
    err[f] <- sqrt(mean((va$sales - predict(fit, va))^2))
  }
  mean(err)                                               # RMSE: the typical miss in cakes, averaged over folds
}

degrees <- 1:8
scores  <- sapply(degrees, cv_rmse, df = cake)
round(scores, 2)
#> [1] 12.34  7.78  7.86  7.77  7.68  7.80  7.83  7.81
best <- degrees[which.min(scores)]
c(best_degree = best, reported_rmse = round(min(scores), 2))
#>   best_degree reported_rmse
#>          5.00          7.68
```

Degree 5 wins at 7.68 cakes. But look closer: degrees 2 through 8 are all bunched between 7.68 and 7.86, a spread smaller than the day-to-day noise. The "winner" beat the pack by a hair of luck, not by being genuinely better. Now the tell: the noise alone is 8 cakes, so **no model can truly predict within less than about 8**. A reported 7.68 is below the noise floor: physically too good to be real. Let us prove it on 5,000 fresh days the model never saw:

```r
# The honest test: a big fresh sample from the same process the CV never touched.
set.seed(99)
fresh    <- data.frame(temp = runif(5000, 5, 35))
fresh$sales <- 40 + 6 * fresh$temp - 0.15 * fresh$temp^2 + rnorm(5000, 0, 8)
fit_best <- lm(sales ~ poly(temp, best), data = cake)    # the winner, refit on all 120 days
honest   <- sqrt(mean((fresh$sales - predict(fit_best, fresh))^2))
c(reported_rmse = round(min(scores), 2), honest_rmse = round(honest, 2))
#> reported_rmse   honest_rmse
#>          7.68          8.38
```

You told your supplier 7.68. The truth is 8.38. That 0.70-cake gap is pure optimism, and it grows with the number of candidates you compared.

=== step === quiz
::eyebrow Check yourself
## Where did the gap come from?

The naive procedure reported 7.68 cakes, but the model's true error on fresh data was 8.38. What is the main cause of that gap?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- The chosen model overfit the 120 training rows, so it does worse on new data ::no That is ordinary overfitting, and cross-validation already guards against it (each fold is scored on held-out rows). The gap here is extra, on top of that: it comes from how the winner was chosen.
- The dataset of 120 days is simply too small to estimate error well ::no A bigger dataset would shrink the gap but not remove it. Even with millions of rows, picking the best of several candidates on the scoring folds still biases the winner's score downward.
- We chose the best of eight candidates on the same folds we then reported, so the winner's fold score includes the luck that made it win ::ok Exactly. Selecting the minimum of several noisy scores lands on whichever candidate got lucky on these folds, so that minimum is biased low. The scoring folds were used up making the choice.

=== step === concept
::eyebrow The fix
## Two loops: one to tune, one to grade

The cure is to keep the two jobs on separate data. Tuning gets its own cross-validation; grading gets a different one that never sees the tuning. That is nested cross-validation: a loop inside a loop.

- The **outer loop** exists only to grade. It rotates a held-out fold, just like ordinary k-fold, but that fold is sacred: nothing about tuning is allowed to touch it.
- The **inner loop** runs *inside each outer training set*. It does the full tune-and-pick (all eight degrees, 5-fold CV, keep the best) using only the outer-training rows.

For each outer fold you tune from scratch on the inner data, refit the chosen degree on the outer-training rows, and score it once on the untouched outer fold. Because the outer fold played no part in choosing the degree, its error is an honest test of the *whole procedure*. Here is that flow:

::widget process-flow {"steps":[{"title":"Outer split","sub":"hold out fold o - used only to score, never to tune"},{"title":"Inner CV","sub":"on the other folds, tune the degree by k-fold CV"},{"title":"Refit best","sub":"fit the chosen degree on all outer-training rows"},{"title":"Score fold o","sub":"predict the held-out fold once - a fair test"},{"title":"Average","sub":"mean of the outer scores is the honest estimate"}]}

=== step === widget
::eyebrow Feel the outer loop
## Watch the grading loop rotate

This is the **outer** loop. Step through it: each red fold is held out and scored once, while the blue folds train. The trick that makes it nested is hidden inside every blue block: a whole inner cross-validation runs there, trying all eight degrees and keeping the best, all before the red fold is ever touched. The red fold's score is therefore honest.

::widget cv-folds {"k":5}

The average of the outer scores is your reported number. It is not the score of one lucky model; it is what the tune-and-fit *recipe* earns on data it never used to tune.

=== step === concept
::eyebrow What it estimates
## What the outer scores actually mean

Write the outer folds as \(D_1, \dots, D_K\), and let \(D_{-k}\) mean all the data except fold \(k\). On each outer round the inner CV picks the degree that minimizes inner error on \(D_{-k}\):

\[ \hat\lambda_k = \arg\min_{\lambda}\ \text{CV}_{\text{inner}}(\lambda;\, D_{-k}) \]

Here \(\lambda\) is the hyperparameter (our degree), and \(\hat\lambda_k\) is whatever the inner loop chose on that round. Refit with \(\hat\lambda_k\) on \(D_{-k}\) to get the model \(\hat f_k\), score it on the untouched fold \(D_k\) to get error \(e_k\), and average:

\[ \widehat{\text{Err}}_{\text{nested}} = \frac{1}{K}\sum_{k=1}^{K} e_k \]

Read that carefully, because it is the whole point: the chosen degree \(\hat\lambda_k\) can differ from fold to fold. Nested CV is **not** estimating "how good is degree 5." It is estimating **how good is the procedure** "tune the degree, then fit," treated as one automatic method. That is exactly the number you can promise a stakeholder, because it is what your method delivers on genuinely new data.

[KEY INSIGHT]
Nested CV grades a *recipe*, not a fixed model. So it does not hand you the model to deploy. Once the estimate looks acceptable, you run the same inner tuning one more time on **all** the data to pick the final degree and fit the model you actually ship.

Let us compute it and put the three numbers side by side:

```r
# Nested CV: OUTER loop grades honestly, INNER loop (cv_rmse) tunes on outer-train only.
set.seed(1)
K_out <- 5; K_in <- 5
o_fold <- sample(rep(1:K_out, length.out = nrow(cake)))
outer_err <- numeric(K_out)

for (o in 1:K_out) {
  train_o <- cake[o_fold != o, ]                          # outer-training rows
  test_o  <- cake[o_fold == o, ]                          # held out - never tuned on
  inner   <- sapply(1:8, cv_rmse, df = train_o, k = K_in) # inner CV picks the degree
  best_o  <- which.min(inner)
  fit_o   <- lm(sales ~ poly(temp, best_o), data = train_o)
  outer_err[o] <- sqrt(mean((test_o$sales - predict(fit_o, test_o))^2))
}

round(outer_err, 2)                                       # one honest score per outer fold
#> [1] 7.47 7.34 9.63 6.84 9.40
c(naive  = round(min(scores), 2),                         # tuned AND scored on the same CV
  nested = round(mean(outer_err), 2),                     # outer loop never saw the tuning
  truth  = round(honest, 2))                              # error on 5,000 fresh days
#>  naive nested  truth
#>   7.68   8.14   8.38
```

The naive number (7.68) sits below the noise floor: a fantasy. Nested CV reports 8.14, a hair's breadth from the true 8.38 and safely above 8. Same data, same models. The only thing that changed is that grading was kept away from tuning.

=== step === quiz
::eyebrow Check yourself
## What does nested CV give you?

You finish a nested cross-validation and get an estimated RMSE of 8.14 cakes. What have you actually produced?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The exact hyperparameters (here, the degree) you should deploy ::no Each outer fold may pick a different degree, so nested CV does not name one setting to ship. It grades the tune-and-fit procedure, not a single configuration.
- An honest estimate of how well the whole tune-and-fit procedure will do on new data; you still refit on all the data to get the final model ::ok Right. The 8.14 is the procedure's expected error. To get the model you deploy, run the inner tuning once more on all the data, pick the degree, and fit it.
- The final trained model, ready to serve predictions ::no Nested CV throws its models away; each was fit only to score an outer fold. It is an evaluation tool, not a training run. The shippable model is fit afterward on the full dataset.

=== step === tryit
::eyebrow Your turn
## Keep the outer fold sacred

The one rule that makes nested CV honest: inside the outer loop, the inner tuning may see **only** the outer-training rows, never the held-out fold. Fill the blank so `train_o` is every row that is *not* in outer fold `o`.

```r
o_fold  <- sample(rep(1:5, length.out = nrow(cake)))
o       <- 1
train_o <- cake[____, ]          # outer-TRAINING rows: everything NOT in fold o
test_o  <- cake[o_fold == o, ]   # outer-TEST fold: scored once, never tuned on
c(train = nrow(train_o), test = nrow(test_o))
```
::check {"regex":"o_fold\\s*!=\\s*o","gate":true,"difficulty":"beginner","ok":"That is it: o_fold != o keeps every row whose outer fold is not the current one, so the inner tuning never sees the held-out fold.","no":"The outer-test fold is o_fold == o, so the training set is its complement: use o_fold != o."}
::solution
```r
o_fold  <- sample(rep(1:5, length.out = nrow(cake)))
o       <- 1
train_o <- cake[o_fold != o, ]   # every row NOT in fold o
test_o  <- cake[o_fold == o, ]
c(train = nrow(train_o), test = nrow(test_o))
```

=== step === concept
::eyebrow Know your tool
## Is it worth it? When to reach for nested CV

Nested CV is not free. With an outer k of 5, an inner k of 5, and 8 candidates, you fit roughly \(5 \times 5 \times 8 = 200\) models just to produce one honest number, before you even train the final one. So spend it where the honesty matters:

- **Use it** on small or medium data, when you are comparing several models or tuning a real grid, and when you have to defend the reported score (a paper, a client, a go/no-go decision).
- **Skip it** when data is plentiful. A single generous held-out **test set**, untouched until the very end, does the same job far more cheaply: tune with ordinary CV on the training portion, then score once on the test set.

The catch with a single test set is the lesson you already know from Lesson 1: one held-out set is one draw, so its score wobbles. Nested CV rotates the outer fold to average that wobble away, which is why it wins on small data where you cannot spare a big test set.

In real projects you do not hand-roll the loops. The tidymodels `rsample` package builds the nested resamples for you (run this one locally, in a full R install):

```r-static
library(rsample)
# Outer loop of 5 folds, each wrapping an inner loop of 5 folds:
folds <- nested_cv(cake,
                   outside = vfold_cv(v = 5),
                   inside  = vfold_cv(v = 5))
# Tune on each `inner_resamples`, score on each outer split, average the outer scores.
```

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [Cawley & Talbot (2010), On Over-fitting in Model Selection and Subsequent Selection Bias in Performance Evaluation, JMLR 11](https://www.jmlr.org/papers/v11/cawley10a.html) - the definitive paper on exactly this bias, with nested CV as the fix.
- [Varma & Simon (2006), Bias in error estimation when using cross-validation for model selection, BMC Bioinformatics](https://doi.org/10.1186/1471-2105-7-91) - measures the optimism on real data and shows nested CV removes it.
- [An Introduction to Statistical Learning, ch. 5 (free PDF)](https://www.statlearning.com/) - the k-fold and validation-set foundations this lesson builds on.
- [tidymodels: Nested resampling](https://www.tidymodels.org/learn/work/nested-resampling/) - the same idea in production R code, worked end to end.

=== step === complete
## Lesson 3 complete

You can now report a tuned model's accuracy without fooling yourself. The trap: using one cross-validation to both choose the model and grade it lets the winner's luck leak into the score, so the number comes out too good, sometimes impossibly good. The fix: nested cross-validation puts an outer grading loop around an inner tuning loop, so the fold you score never helped pick the model. The outer scores estimate the whole tune-and-fit procedure, and you refit on all the data to get the model you actually ship.

Next, Lesson 4: Hyperparameter Tuning Strategies. You have been quietly running a grid search over eight degrees. Now you will learn to search smarter, grid, random and Bayesian, and how to spend a limited tuning budget where it pays off most.
