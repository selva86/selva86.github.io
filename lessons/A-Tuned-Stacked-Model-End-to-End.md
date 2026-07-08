---
title: "Advanced Supervised Learning Lesson 8: A Tuned, Stacked Model End to End"
catalog_blurb: "Assemble tuning, stacking and honest evaluation into one trustworthy pipeline."
description: "The capstone: tune an SVM, a Gaussian process and a random forest by cross-validation, stack them on out-of-fold predictions, and grade the whole pipeline once on a sealed test set."
keywords: "model stacking, super learner, hyperparameter tuning, cross-validation, out-of-fold predictions, winner's curse, nested cross-validation, ensemble learning, e1071, kernlab, randomForest, R"
post_type: "LESSON"
curriculum_id: "6.140.8"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-advanced-supervised"
course_title: "Advanced Supervised Learning"
course_lesson: "8"
course_total: "8"
course_landing: "R-Advanced-Supervised-Learning-Course.html"
course_next: ""
course_prev: "Approximate-Nearest-Neighbors-at-Scale.html"
---

=== step === cover
::eyebrow Lesson 8 of 8
## A Tuned, Stacked Model End to End

Across this course you have built a cabinet of very different learners: the maximum-margin SVM, kernels that bend a boundary, a discriminant blend, a Gaussian process that admits its own uncertainty, and behind you the whole random forest. This final lesson stops adding new machines and does the thing a working data scientist actually gets paid for: assemble them into one pipeline that tunes itself honestly, blends its members, and reports a number you can promise out loud.

Meet Marcus. He runs a used-car lot, and every trade-in is a negotiation that starts with one question: what is this car worth? He has a ledger of **900 past sales**, each with the car's age, odometer reading, brand tier and accident history, and the price it eventually sold for. He wants a single model that prices a trade-in to within about a thousand dollars, and he wants to know that the "within a thousand dollars" is real and not a number he fooled himself into believing.

The diagram is the whole lesson in four moves. By the end you will be able to:

- Explain the winner's curse: why the best score you find by trying many settings flatters you, and why trying even more settings makes it worse
- Tune three model families with one honest recipe, every choice made from the training cars alone
- Build the tuned stack end to end: out-of-fold columns, convex blend weights, a two-stage prediction
- Evaluate the pipeline honestly, on one sealed test set touched exactly once, and say which number you are allowed to promise

**Prerequisites:** the [stacking lesson](Stacking-and-the-Super-Learner.html) (out-of-fold predictions and a meta-learner blend, which this lesson tunes and hardens), the [kernel SVM](Kernel-SVMs-and-the-Kernel-Trick.html) (cost and gamma), [Gaussian processes](Gaussian-Processes-for-Regression.html) (the lengthscale), the [random forest course](RF-Course-Lesson-3.html) (mtry and out-of-bag error), and k-fold [cross-validation](Cross-Validation-Strategies.html).

::widget process-flow {"steps":[{"title":"Seal the exam","sub":"lock away a test set and do not touch it until the very end"},{"title":"Tune in CV","sub":"pick every hyperparameter by cross-validation, on the training cars only"},{"title":"Stack","sub":"blend the tuned learners on their out-of-fold predictions"},{"title":"Grade once","sub":"score the sealed test set a single time; that number is the promise"}]}

=== step === concept
::eyebrow The one rule that governs everything
## Seal the exam before you start

Everything that goes wrong in a modeling project goes wrong because some number that was supposed to estimate the future got to peek at the future first. So before we fit a single model, we make one commitment and never break it: a chunk of Marcus's cars is sealed away as a **test set**, an exam the pipeline does not get to see. Every later choice, which hyperparameters, which blend weights, is a function of the training cars **only**. The test set is opened once, at the very end, to grade the finished pipeline.

The score we will grade with is root mean squared error, the typical dollar miss:

\[ \text{RMSE} = \sqrt{\tfrac{1}{n}\sum_{i=1}^{n}\left(y_i - \hat{y}_i\right)^2} \]

where \(y_i\) is what car \(i\) actually sold for, \(\hat{y}_i\) is what the model guessed, and \(n\) is the number of cars scored. It is in the same units as price (thousands of dollars here), so an RMSE of 1.2 means "typically off by about \$1,200."

First, Marcus's ledger. Each lesson runs in a fresh R session, so we build the 900-car lot right here, with real structure baked in: cars depreciate at a rate that depends on brand tier, hard driving and accidents knock money off, and a couple of sharp effects (a nearly-new bump, an old-and-thrashed cliff) that only a flexible model can catch.

```r
library(e1071)          # support vector machine
library(kernlab)        # Gaussian process
library(randomForest)   # random forest

set.seed(42)
n    <- 900
age  <- round(runif(n, 0.5, 12), 1)                     # years on the road
km   <- round(age * runif(n, 6, 14) + runif(n, 0, 15))  # thousand km on the odometer
tier <- sample(c("budget", "mid", "premium"), n, TRUE)  # brand tier
accidents <- rbinom(n, 2, 0.15)                         # prior accidents: 0, 1 or 2

rate <- c(budget = 0.20, mid = 0.15, premium = 0.11)[tier]   # how fast the tier loses value
mult <- c(budget = 0.75, mid = 1.00, premium = 1.35)[tier]   # its price level when new
price <- (3 + 26 * exp(-rate * age) * mult - 0.015 * km) * 0.85^accidents +
         ifelse(age > 8 & km > 100, -3, 0) +   # old-and-thrashed cliff
         ifelse(age < 1.5,          3, 0) +    # nearly-new bump
         rnorm(n, 0, 1)                        # everything we did not measure
lot <- data.frame(age, km, tier = factor(tier), accidents,
                  price = round(pmax(price, 0.3), 2))   # price in $1,000s
head(lot, 4)
#>    age km    tier accidents price
#> 1 11.0 87 premium         0 10.54
#> 2 11.3 76  budget         1  2.40
#> 3  3.8 41 premium         0 25.63
#> 4 10.1 76  budget         1  4.05
```

Now the split, and the promise. Two thirds of the lot, 600 cars, become the training ground; the other 300 are the sealed exam. We also define `rmse()` once, since every step from here scores with it.

```r
set.seed(101)
test_id <- sample(n, 300)          # 300 cars sealed away as the exam
train   <- lot[-test_id, ]         # 600 cars to build everything on
test    <- lot[test_id, ]

rmse <- function(actual, predicted) sqrt(mean((actual - predicted)^2))
c(train = nrow(train), test = nrow(test), sd_price = round(sd(train$price), 2))
#>    train     test sd_price
#>   600.00   300.00     8.36
```

The last number sets the bar. Prices in the training set have a standard deviation of \$8,360, so a model that just guessed the average price every time would miss by about that much. Anything we build has to beat 8.36 by a wide margin to be worth Marcus's trust. The widget shows the split, and the one way it all falls apart: flip the switch and watch a leaked feature turn the test score into a fantasy.

::widget data-split {}

=== step === concept
::eyebrow The trap
## The best score you find is a liar

Here is the mistake almost everyone makes first, and it is worth making it in the open so we never make it again. Marcus wants to tune his SVM's two dials, `cost` and `gamma`. The obvious plan: peel a small **validation slice** off the training cars, try a bunch of `(cost, gamma)` pairs, keep the pair that scores best on the slice. Let us do exactly that, honestly, on one 60-car slice.

```r
set.seed(22)
val_id <- sample(nrow(train), 60)  # ONE 60-car validation slice
fit_tr <- train[-val_id, ]         # 540 cars each candidate fits on
val    <- train[val_id, ]

set.seed(11)
cand <- data.frame(cost  = round(4^runif(40, 0, 3), 1),     # 40 random (cost, gamma) pairs
                   gamma = round(10^runif(40, -2.3, 0), 4))
val_rmse <- sapply(1:40, function(j) {
  m <- svm(price ~ ., data = fit_tr, cost = cand$cost[j], gamma = cand$gamma[j])
  rmse(val$price, predict(m, val))
})
cand$val <- round(val_rmse, 3)
cand[which.min(cand$val), ]        # the candidate that "won" the slice
#>    cost  gamma  val
#> 35 29.4 0.7235 1.13
```

Candidate 35 looks superb: it misses the 60 validation cars by only \$1,130. But watch what happens as we let more and more candidates compete on that same little slice. For each budget of candidates tried, we take the slice's favourite and, just this once, peek at the sealed test set to see what that favourite really delivers. (You never get to see this last column while tuning. We reveal it here only to expose the trap.)

```r
curse <- t(sapply(c(5, 10, 20, 40), function(J) {
  b <- which.min(val_rmse[1:J])                   # best of the first J candidates
  m <- svm(price ~ ., data = fit_tr, cost = cand$cost[b], gamma = cand$gamma[b])
  c(candidates_tried = J,
    slice_promised   = round(val_rmse[b], 3),                          # what the slice advertised
    test_delivered   = round(rmse(test$price, predict(m, test)), 3))   # what the exam actually paid
}))
curse
#>      candidates_tried slice_promised test_delivered
#> [1,]                5          1.291          1.276
#> [2,]               10          1.153          1.338
#> [3,]               20          1.153          1.338
#> [4,]               40          1.130          1.448
```

Read the two right-hand columns against each other. The more candidates we try, the better the slice score gets (1.291 down to 1.130), and the **worse** the real model gets (1.276 up to 1.448). Trying harder made things worse. This is the **winner's curse**, and it has a precise cause. Each slice score is the true skill plus noise, \(s_j = \mu_j + \varepsilon_j\), where \(\mu_j\) is candidate \(j\)'s real error and \(\varepsilon_j\) is the luck of which 60 cars landed in the slice. When you take the minimum over \(m\) candidates,

\[ \mathbb{E}\!\left[\min_{j \le m} s_j\right] \;\le\; \min_{j \le m} \mu_j \]

the minimum of noisy scores is biased low, and the bias grows with \(m\): more candidates give the noise more chances to produce a flattering fluke. The "winner" is often just the candidate whose \(\varepsilon_j\) was most negative on this particular slice, not the one with the best \(\mu_j\). Candidate 35's `gamma` of 0.72 is a wild, spiky setting; proper tuning will crown a `gamma` near 0.05 instead.

The shape to burn into memory is below. The widget's literal story is early stopping: as you push a knob (boosting rounds) to minimize a score watched on one held-out slice, the watched score keeps improving while the real error bottoms out and then climbs. Swap "boosting rounds" for "number of candidates you try on one slice" and it is the very trap you just walked into.

::widget learning-curve {}

=== step === quiz
::eyebrow Check yourself
## Why did trying harder hurt?

In the curse table, the slice-promised RMSE fell from 1.291 (5 candidates) to 1.130 (40 candidates), yet the test-delivered RMSE rose from 1.276 to 1.448. Why did evaluating **more** candidates on the one slice produce a **worse** final model?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- The 60-car slice score is noisy, and the more candidates you let compete on that single slice, the more likely the winner is one whose low score is a lucky fit to the slice's particular noise rather than real skill ::ok Exactly. You are taking a minimum over noisy scores, which is biased low, and the bias grows with the number of candidates. The winner is increasingly the luckiest candidate on that slice, not the most skilled one, so its honest test error is higher.
- Larger cost and gamma make an SVM overfit its training data, so simply listing more candidates trains more overfit models ::no Some candidates are indeed spiky (candidate 35's gamma is 0.72), but that is not why trying MORE of them hurt. Even if every candidate were reasonable, selecting the best of many on one noisy slice would still be biased. The failure is in the selection, not the candidates.
- Forty candidates is too few to locate the true optimum; sweeping 400 would let the test-delivered error recover ::no It goes the wrong way: more candidates on one slice makes the selected model worse, not better. The fix is not more candidates on one slice, it is a less noisy score to select on, which is the next step.

=== step === concept
::eyebrow The fix
## Score with cross-validation, not one slice

The problem was never the SVM. It was that we selected on a score computed from one unlucky 60-car slice. The cure is to make the selection signal steadier by averaging over five slices instead of trusting one. That is **k-fold cross-validation**: cut the 600 training cars into 5 folds, and to score any recipe, fit it five times, each time holding out a different fold and measuring error on the held-out cars, then average. Every car gets predicted exactly once, by a model that never saw it.

```r
set.seed(7)
fold <- sample(rep(1:5, length.out = nrow(train)))   # give each training car a fold label 1..5

cv_rmse <- function(fit_fun) {          # 5-fold CV score for ANY fitting recipe
  miss <- numeric(5)
  for (k in 1:5) {
    held  <- which(fold == k)
    model <- fit_fun(train[-held, ])    # fit on the other four folds
    miss[k] <- rmse(train$price[held], predict(model, train[held, ]))
  }
  mean(miss)
}
```

`cv_rmse()` takes a *recipe*, a function that fits a model given data, and returns its averaged five-fold error. That one helper will score every candidate for every model family in this lesson, all on the same folds, so the comparisons are fair. Now tune the SVM properly: a small grid of sensible `cost` and `gamma` values, each scored by cross-validation.

```r
svm_grid <- expand.grid(cost = c(1, 4, 16, 64), gamma = c(0.02, 0.05, 0.1, 0.2))
svm_grid$cv <- sapply(1:nrow(svm_grid), function(j)
  cv_rmse(function(tr) svm(price ~ ., data = tr,
                           cost = svm_grid$cost[j], gamma = svm_grid$gamma[j])))
head(svm_grid[order(svm_grid$cv), ], 3)
#>    cost gamma       cv
#> 8    64  0.05 1.230577
#> 12   64  0.10 1.246467
#> 11   16  0.10 1.247646
```

The cross-validated winner is `cost = 64`, `gamma = 0.05`, scoring 1.231, a calm setting nothing like the spiky `gamma = 0.72` the single slice fell in love with. One caution that will matter at the end: this 1.231 is a score for **choosing**, not a number to promise. We evaluated 16 candidates and kept the best, so even this cross-validated minimum is a little optimistic by the same winner's-curse logic, just far less so than the one-slice score. The honest promise still has to come from the sealed exam.

[KEY INSIGHT]
Cross-validation buys you a low-variance signal to *select* on. It does not buy you a number to *report*. The moment a score is used to choose something, it stops being an unbiased estimate of the future, because you kept it precisely for being low.

::widget cv-folds {"k":5}

=== step === concept
::eyebrow The same recipe, three families
## Tune the GP and the forest the same honest way

The beauty of the `cv_rmse()` helper is that "tuning" is now the same act for every model: hand it a recipe with a dial set, read back one honest number, keep the best dial. The Gaussian process has one dial that matters here, the RBF kernel's `sigma` (its inverse lengthscale: bigger `sigma` means the model trusts only very nearby cars). Same grid-and-score move.

```r
gp_grid <- data.frame(sigma = c(0.02, 0.05, 0.1, 0.2, 0.4))
gp_grid$cv <- round(sapply(gp_grid$sigma, function(s)
  cv_rmse(function(tr) gausspr(price ~ ., data = tr, kernel = "rbfdot",
                               kpar = list(sigma = s), var = 0.05))), 3)
gp_grid
#>   sigma    cv
#> 1  0.02 1.487
#> 2  0.05 1.336
#> 3  0.10 1.249
#> 4  0.20 1.256
#> 5  0.40 1.291
```

`sigma = 0.10` wins at 1.249, and notice the familiar U-shape: too small and the GP is too stiff, too large and it chases noise. The forest has its own dial, `mtry`, the number of features each split is allowed to consider, and it comes with a gift you met in the random-forest course: **out-of-bag error**, a free cross-validation baked into the bagging itself. Every tree is grown on a bootstrap sample, so roughly a third of the cars are out-of-bag for that tree and can be scored for free, no separate folds needed.

```r
set.seed(7)
oob <- sapply(1:4, function(m)
  sqrt(tail(randomForest(price ~ ., data = train, ntree = 400, mtry = m)$mse, 1)))
round(setNames(oob, paste0("mtry=", 1:4)), 3)
#> mtry=1 mtry=2 mtry=3 mtry=4
#>  2.716  1.392  1.375  1.385
```

`mtry = 3` is best at 1.375. Look hard at `mtry = 1`: 2.716, more than twice as bad, and that is the **default** a regression forest would have picked on its own (regression uses `floor(p/3)`, which is 1 for four features). Left untuned, the forest here would have been nearly useless. Each family had a different tuning instrument, but the discipline was identical: one honest score, computed inside the training cars, choosing one dial.

| Family | Dial tuned | Honest scoring instrument | Winner |
|---|---|---|---|
| SVM | `cost`, `gamma` | 5-fold CV (`cv_rmse`) | 64, 0.05 -> 1.231 |
| Gaussian process | `sigma` | 5-fold CV (`cv_rmse`) | 0.10 -> 1.249 |
| Random forest | `mtry` | out-of-bag error | 3 -> 1.375 |

::widget oob-tuner {}

=== step === concept
::eyebrow Stacking, hardened
## Out-of-fold columns, and the correlation that runs the show

Now we assemble the stack. From the stacking lesson you know the recipe: a meta-learner should not learn to blend from predictions a base model made on cars it trained on (those are dishonestly good), but from **out-of-fold** predictions, each car predicted by a model that never saw it. So we rebuild the five-fold loop one more time, and in each fold we fit all four members, each with its tuned dial, and record their predictions on the held-out cars. We add a plain linear model as a fourth member, to see whether the fancy machines are even earning their keep.

```r
best_cost  <- svm_grid$cost[which.min(svm_grid$cv)]    # 64
best_gamma <- svm_grid$gamma[which.min(svm_grid$cv)]   # 0.05
best_sigma <- gp_grid$sigma[which.min(gp_grid$cv)]     # 0.10
best_mtry  <- which.min(oob)                           # 3

set.seed(7)
oof <- data.frame(linear = rep(NA_real_, nrow(train)),
                  svm = NA_real_, gp = NA_real_, rf = NA_real_)
for (k in 1:5) {
  tr <- train[fold != k, ]
  te <- which(fold == k)
  oof$linear[te] <- predict(lm(price ~ ., data = tr), train[te, ])
  oof$svm[te]    <- predict(svm(price ~ ., data = tr, cost = best_cost, gamma = best_gamma), train[te, ])
  oof$gp[te]     <- as.numeric(predict(gausspr(price ~ ., data = tr, kernel = "rbfdot",
                                       kpar = list(sigma = best_sigma), var = 0.05), train[te, ]))
  oof$rf[te]     <- predict(randomForest(price ~ ., data = tr, ntree = 400, mtry = best_mtry), train[te, ])
}
round(sapply(oof, function(p) rmse(train$price, p)), 3)   # each member's honest CV RMSE
#> linear    svm     gp     rf
#>  2.199  1.240  1.259  1.410
```

So on its own, the SVM is best (1.240), the GP close behind (1.259), the forest clearly worst of the three nonlinear members (1.410), and the linear model is out of its depth (2.199) against those sharp nonlinear effects. A tempting conclusion would be "just ship the SVM." Resist it, and look at something the solo scores hide: how the members' **mistakes** relate. Two models that are wrong on the same cars in the same direction have nothing to teach each other; two that are wrong on different cars can cover for each other. We measure that with the correlation of their out-of-fold errors.

```r
resid <- train$price - oof            # each member's out-of-fold error on every car
round(cor(resid), 2)
#>        linear  svm   gp   rf
#> linear   1.00 0.56 0.60 0.46
#> svm      0.56 1.00 0.98 0.68
#> gp       0.60 0.98 1.00 0.68
#> rf       0.46 0.68 0.68 1.00
```

There is the whole plot. The SVM and the GP are near **clones**: their errors correlate 0.98, because they are both smooth kernel machines that stumble on the same cars. The forest, splitting instead of smoothing, is wrong on **different** cars, correlating only 0.68 with each. It is the worst solo performer and the most valuable teammate, because it brings information the other two do not have.

::widget correlation-heatmap {"vars":["linear","svm","gp","rf"],"matrix":[[1,0.56,0.60,0.46],[0.56,1,0.98,0.68],[0.60,0.98,1,0.68],[0.46,0.68,0.68,1]]}

=== step === quiz
::eyebrow Check yourself
## Which member earns its place?

The forest has the worst solo out-of-fold RMSE of the three nonlinear members (1.410, versus the SVM's 1.240). Yet in a moment the blend will give the forest a healthy weight while nearly benching the more accurate GP. What makes the weaker forest more valuable to the stack than the stronger GP?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- A stack always distributes weight in proportion to each member's solo accuracy, so this cannot happen; the forest must actually have the lower error ::no A stack weights members by the value they ADD, not by solo accuracy. The forest genuinely has the higher solo RMSE (1.410 vs 1.240); it still earns more weight, which is exactly the point of the next step.
- The forest's errors are decorrelated from the SVM and GP (0.68 versus their mutual 0.98), so it is wrong on different cars and can cover mistakes the two kernel clones share; the GP mostly repeats what the SVM already says ::ok Right. Blending helps most when members err independently. The SVM and GP correlate 0.98, so adding the GP is nearly free redundancy; the forest at 0.68 brings genuinely new information, which is worth more to the blend than a little extra solo accuracy.
- The forest is less likely to have overfit, because out-of-bag error is more trustworthy than cross-validation ::no Out-of-bag and cross-validated errors are both honest held-out estimates; neither is what is going on here. The forest's value comes from its error correlation with the others (0.68), not from which validation scheme scored it.

=== step === concept
::eyebrow The blend
## Convex weights that split the clone seat

Now the meta-learner: choose weights \(w_i\) that mix the four out-of-fold columns into a single prediction with the lowest RMSE. We keep the weights **convex**, meaning each is at least zero and together they sum to one, so the blend is an honest weighted average that cannot invent prices outside the members' range. A clean trick enforces that: parametrize the weights through a softmax of four free numbers,

\[ w_i \;=\; \frac{e^{\beta_i}}{\sum_{k} e^{\beta_k}}, \qquad w_i \ge 0, \quad \sum_i w_i = 1, \]

and let a general optimizer search the \(\beta_i\) freely while the softmax guarantees the constraint. The blended prediction is then just \(\hat{y} = \sum_i w_i \hat{y}_i\).

```r
blend_rmse <- function(logits) {
  w <- exp(logits) / sum(exp(logits))              # softmax -> weights >= 0 that sum to 1
  rmse(train$price, as.matrix(oof) %*% w)
}
best <- optim(c(0, 0, 0, 0), blend_rmse)           # search the weight simplex
w    <- setNames(exp(best$par) / sum(exp(best$par)), names(oof))
round(w, 2)
#> linear    svm     gp     rf
#>   0.00   0.63   0.06   0.30
round(rmse(train$price, as.numeric(as.matrix(oof) %*% w)), 3)   # blended out-of-fold RMSE
#> [1] 1.196
```

Read the weights as the stack's verdict on its members. The linear model is **benched at 0.00**, correctly judged to add nothing the others lack. The forest, worst solo, takes a full 0.30 because its decorrelated errors are gold. And the SVM and GP together hold 0.69, but split it lopsidedly (0.63 and 0.06). That split is not meaningful: because the two are 0.98-correlated clones, only their *combined* weight is really determined. Shift it between them and the blend barely notices.

```r
w_swap <- w[c("linear", "gp", "svm", "rf")]        # hand the SVM's share to its clone, the GP
round(rmse(train$price, as.numeric(as.matrix(oof) %*% w_swap)), 3)
#> [1] 1.206
```

Swapping the two clone weights moves the blended RMSE from 1.196 to 1.206, a rounding error. The stack has essentially decided "give the smooth-kernel idea about 0.69 and the forest idea 0.30"; which clone carries the kernel share is a coin flip it does not care about.

=== step === concept
::eyebrow The moment of truth
## Refit, then open the exam exactly once

Every choice is now made: three tuned dials, one benched member, a set of blend weights, all derived from the 600 training cars without the test set contributing a single decision. The last steps are mechanical. Refit each member on **all** 600 training cars (no more holding folds out; that was only to get honest columns for the meta-learner), predict the sealed 300, blend, and grade. This is the two-stage prediction: stage one, each member prices the car; stage two, the weights combine them.

```r
m_lin <- lm(price ~ ., data = train)
m_svm <- svm(price ~ ., data = train, cost = best_cost, gamma = best_gamma)
m_gp  <- gausspr(price ~ ., data = train, kernel = "rbfdot",
                 kpar = list(sigma = best_sigma), var = 0.05)
set.seed(7)
m_rf  <- randomForest(price ~ ., data = train, ntree = 400, mtry = best_mtry)

P <- cbind(linear = predict(m_lin, test), svm = predict(m_svm, test),
           gp = as.numeric(predict(m_gp, test)), rf = predict(m_rf, test))
stack_pred <- as.numeric(P %*% w)      # stage two: blend the four columns with the weights
```

Now, and only now, we open the exam. To put the stack's number in context we also grade each tuned member alone, an equal-weight average, and three cautionary tales: the SVM the naive one-slice tuning chose, a plain linear model, and the forest at its untuned default.

```r
set.seed(7)
rf_default <- randomForest(price ~ ., data = train, ntree = 400)   # mtry defaults to 1
scores <- c(
  "stacked blend"   = rmse(test$price, stack_pred),
  "tuned SVM"       = rmse(test$price, P[, "svm"]),
  "tuned GP"        = rmse(test$price, P[, "gp"]),
  "equal average"   = rmse(test$price, rowMeans(P)),
  "tuned forest"    = rmse(test$price, P[, "rf"]),
  "slice-tuned SVM" = unname(curse[4, "test_delivered"]),
  "linear only"     = rmse(test$price, P[, "linear"]),
  "default forest"  = rmse(test$price, predict(rf_default, test)))
round(sort(scores), 3)
#>   stacked blend       tuned SVM        tuned GP   equal average    tuned forest
#>           1.161           1.222           1.232           1.278           1.301
#> slice-tuned SVM     linear only  default forest
#>           1.448           2.409           2.943
```

The stacked blend wins the exam at **1.161**, below every single member including the best solo SVM at 1.222. Blending a redundant clone (the GP) and a mediocre-but-decorrelated forest onto the SVM still beat the SVM alone, exactly as the error correlations promised. And the scoreboard also tells the story of this whole lesson in its lower half: the slice-tuned SVM (1.448) is the winner's curse made real, the default forest (2.943) is what "just fit a model" gets you, and both are worlds away from the tuned, stacked, honestly-graded top. Here is the same board as a picture.

```r
library(ggplot2)
board <- data.frame(model = names(scores), rmse = as.numeric(scores))
board$model <- reorder(board$model, -board$rmse)
ggplot(board, aes(rmse, model, fill = model == "stacked blend")) +
  geom_col(width = 0.72, show.legend = FALSE) +
  geom_text(aes(label = sprintf("%.3f", rmse)), hjust = -0.15, size = 3.4) +
  scale_fill_manual(values = c("#c5cdda", "#1f7a55")) +
  scale_x_continuous(expand = expansion(mult = c(0, 0.16))) +
  labs(title = "One sealed exam, taken once: the tuned stack wins",
       x = "test RMSE ($1,000s), lower is better", y = NULL) +
  theme_minimal(base_size = 13)
```

=== step === quiz
::eyebrow Check yourself
## Which number do you promise?

You now hold three numbers: the best SVM's cross-validated grid score (1.231), the blend's out-of-fold RMSE (1.196), and the stacked blend's score on the sealed test set (1.161). Marcus asks: "How far off will this be on next month's trade-ins?" Which number is the honest answer?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- 1.196, the out-of-fold blend RMSE, because it averages five folds and so is the most stable estimate ::no Stable is not the same as unbiased. The blend weights were chosen to minimize exactly that 1.196, so it is a score used for selection and is optimistically low, for the same reason the CV grid winner was. It is a fine number to build the stack on; it is not the promise.
- 1.161, the sealed test RMSE, because those 300 cars influenced no dial, no weight and no model choice, and were scored a single time at the very end ::ok Right. Only the test set was never used to decide anything, so its score is the one honest estimate of future error. That is why you sealed it on step 2 and did not touch it until now.
- 1.231, the SVM's cross-validated grid score, since cross-validation is the gold-standard estimate of generalization error ::no Cross-validation is an excellent way to CHOOSE, but a CV score you selected the winner from is still optimistic, and this one is also just a single member, not the shipped stack. The pipeline you actually deploy must be graded as a whole, once, on data it never saw.

::eyebrow The rule, in one table
The three numbers, and what each is honestly for:

| Number | Value | Computed from | Honest use |
|---|---|---|---|
| CV grid score | 1.231 | training cars, min over 16 candidates | choose the SVM's dials |
| OOF blend RMSE | 1.196 | training cars, min over blend weights | choose the blend weights |
| Sealed test RMSE | 1.161 | 300 untouched cars, scored once | the number you promise |

=== step === tryit
::eyebrow Your turn
## Price one trade-in with the finished pipeline

A customer rolls in with a 4.5-year-old mid-tier car, 52,000 km, no accidents. Run it through the finished two-stage pipeline: stage one asks each fitted member for a price, stage two blends them with the learned weights `w`. The `members` vector and `w` are both still in your session (`w` is ordered `linear, svm, gp, rf`, matching the columns of `members`). Fill in the blank with the blend.

```r
new_car <- data.frame(age = 4.5, km = 52,
                      tier = factor("mid", levels = levels(lot$tier)),
                      accidents = 0)
members <- c(linear = unname(predict(m_lin, new_car)),
             svm    = unname(predict(m_svm, new_car)),
             gp     = as.numeric(predict(m_gp, new_car)),
             rf     = unname(predict(m_rf, new_car)))
quote <- ____                       # blend the four member prices with the weights w
round(c(members, quote = quote), 2)
```
::check {"regex":"w\\s*\\*\\s*members|members\\s*\\*\\s*w|members\\s*%\\*%\\s*w|w\\s*%\\*%\\s*members","gate":true,"difficulty":"intermediate","ok":"That is the whole pipeline in one line: each member's price, weighted by w and summed. The quote lands at 15.32, a hair under the SVM's own 15.37 because the benched linear model's high guess gets zero say.","no":"Stage two is a weighted sum: sum(w * members). Because w and members are in the same order, that multiplies each member's price by its weight and adds them up."}
::solution
```r
new_car <- data.frame(age = 4.5, km = 52,
                      tier = factor("mid", levels = levels(lot$tier)),
                      accidents = 0)
members <- c(linear = unname(predict(m_lin, new_car)),
             svm    = unname(predict(m_svm, new_car)),
             gp     = as.numeric(predict(m_gp, new_car)),
             rf     = unname(predict(m_rf, new_car)))
quote <- sum(w * members)
round(c(members, quote = quote), 2)
#>  linear     svm      gp      rf   quote
#>   16.70   15.37   15.34   15.21   15.32
```

Notice the members disagree by more than a thousand dollars (16.70 down to 15.21), and the blend, ignoring the outvoted linear model, settles on \$15,320. That single number is what Marcus quotes, and thanks to the sealed exam he can add, honestly, "give or take about \$1,160."

=== step === concept
::eyebrow Go deeper
## References

Four places to take the capstone further:

- [Cawley and Talbot (2010), "On Over-fitting in Model Selection", JMLR 11](https://jmlr.org/papers/v11/cawley10a.html) - the winner's curse of step 3, formalized, and why nested cross-validation is the cure when you have no spare test set.
- [Varma and Simon (2006), "Bias in error estimation when using cross-validation for model selection", BMC Bioinformatics](https://bmcbioinformatics.biomedcentral.com/articles/10.1186/1471-2105-7-91) - measures how optimistic a selected CV score is, the exact reason 1.196 is not the promise.
- [The Elements of Statistical Learning, chapter 7 (free PDF)](https://hastie.su.domains/ElemStatLearn/) - model assessment and selection, the theory behind sealing a test set and the right and wrong ways to cross-validate.
- [Tidy Modeling with R (free book)](https://www.tmwr.org/) - how to run this whole pipeline in production with `tidymodels`: `rsample` for the split, `tune` for the grids, and `stacks` for the blend.

For the production version of exactly this stack, `stacks` wires the out-of-fold columns and the convex meta-learner together for you:

```r-static
library(tidymodels)
library(stacks)
# each base model is a tuned workflow; stacks() collects their out-of-fold
# predictions and blend_predictions() fits the non-negative meta-learner.
car_stack <- stacks() |>
  add_candidates(svm_res) |>
  add_candidates(gp_res) |>
  add_candidates(rf_res) |>
  blend_predictions() |>       # the convex blend we hand-built with optim()
  fit_members()                # refit each member on all training data
```

=== step === complete
## Lesson 8 complete

You have built the thing this whole course was preparing you for: not another model, but a disciplined pipeline that tunes, blends and grades itself honestly. You sealed a test set and never let it vote; you watched the winner's curse punish tuning on one noisy slice and cured it with cross-validation; you tuned an SVM, a Gaussian process and a forest with one honest recipe; you stacked them on out-of-fold columns and saw that a decorrelated, mediocre forest is worth more to a blend than a redundant, accurate clone; and you opened the exam exactly once to earn a number you can promise out loud.

That is the end of Advanced Supervised Learning. You started with a single maximum-margin line and finished with a tuned ensemble evaluated without self-deception, which is, in the end, most of what separates a model that demos well from one you would stake a business on. Take it to the certification, and to your own data.
