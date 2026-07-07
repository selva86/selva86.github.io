---
title: "Advanced Supervised Learning Lesson 5: Stacking and the Super Learner"
catalog_blurb: "Combine several models into one that beats the best of them."
description: "Stacking and the Super Learner in R from scratch: why out-of-fold predictions matter, blending base learners with a meta-learner, and honest convex weights."
keywords: "stacking, stacked generalization, super learner, ensemble learning, meta-learner, out-of-fold predictions, cross-validation, model blending, R"
post_type: "LESSON"
curriculum_id: "6.140.5"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-advanced-supervised"
course_title: "Advanced Supervised Learning"
course_lesson: "5"
course_total: "8"
course_landing: "R-Advanced-Supervised-Learning-Course.html"
course_next: "Bayesian-Optimization-for-Hyperparameters.html"
course_prev: "Gaussian-Processes-for-Regression.html"
---

=== step === cover
::eyebrow Lesson 5 of 8
## Stacking and the Super Learner

In Lesson 4 you gave a regression model a conscience: a Gaussian process that predicts a value AND admits how sure it is. This lesson does something different with your growing toolbox. Instead of crowning one winner and discarding the rest, it keeps several models and teaches a second model to blend them.

Meet Nadia. She runs a coffee cart outside a train station, and she has logged cups sold in **160 fifteen-minute windows**: the hour of day, and the cups she sold. Demand has a morning rush, an evening rush, and a sharp jump at noon when the office across the road breaks for lunch. Nadia has built three models to forecast demand for her ordering app: a **straight line**, a **smooth curve**, and a **regression tree**. Her app has room for one. Which does she ship?

The surprising answer this lesson defends: **none of them alone.** By the end you will be able to:

- Explain why picking a single best model leaves accuracy on the table, and why a plain average can even hurt
- Build a stacking ensemble in R: out-of-fold predictions, a meta-learner, and the blend weights it learns
- See why the meta-learner must be trained on out-of-fold predictions, not in-sample ones, and what goes wrong when it is not
- Turn a stack into a Super Learner with convex weights, and score the whole thing honestly with nested cross-validation

**Prerequisites:** several strong, different learners already in hand ([decision trees](Decision-Trees-for-Classification.html), [SVMs](Support-Vector-Machines-Maximum-Margin.html), [Gaussian processes](Gaussian-Processes-for-Regression.html) from this course), [k-fold cross-validation](Cross-Validation-Strategies.html) as an honest accuracy estimate, [linear regression](Linear-Regression.html) with `lm()`, and the [overfitting idea](The-Bias-Variance-Tradeoff.html) from the ML Workflow course.

The interactive below is the lesson's payoff in miniature: three base learners and the stack built on top of them. Toggle to **Test error** and the stacked bar sits lowest; toggle to **Blend weights** to see how much the meta-learner leans on each. We will build every piece of this from scratch.

::widget stacking-blend {}

=== step === concept
::eyebrow The problem
## Three good models, one slot

Each lesson runs in a fresh R session, so we start by typing Nadia's log into the machine. We build her 160 windows and, separately, a larger fresh fortnight of data to score models on honestly, so no model is ever judged on rows it trained on.

```r
set.seed(1)
n <- 160
cart <- data.frame(hour = round(runif(n, 6, 20), 2))          # 6am to 8pm
mean_cups <- 12 +
  18 * exp(-((cart$hour - 8)^2)  / (2 * 1.2^2)) +             # morning rush
  14 * exp(-((cart$hour - 18)^2) / (2 * 1.5^2)) +             # evening rush
  8  * (cart$hour >= 12)                                      # lunch office crowd: a hard jump
cart$cups <- round(mean_cups + rnorm(n, 0, 4))               # cups sold in a 15-min window

set.seed(2)                                                   # a fresh fortnight, held out for scoring
m <- 300
test <- data.frame(hour = round(runif(m, 6, 20), 2))
test$cups <- round(12 +
  18 * exp(-((test$hour - 8)^2)  / (2 * 1.2^2)) +
  14 * exp(-((test$hour - 18)^2) / (2 * 1.5^2)) +
  8  * (test$hour >= 12) + rnorm(m, 0, 4))

rmse <- function(pred, truth) sqrt(mean((truth - pred)^2))    # our scoreboard: lower is better
head(cart)
#>    hour cups
#> 1  9.72   16
#> 2 11.21   12
#> 3 14.02   25
#> 4 18.71   26
#> 5  8.82   29
#> 6 18.58   34
```

Now Nadia's three models. They are deliberately simple and very different in shape: a line that can only tilt, a degree-5 polynomial that can bend smoothly, and a tree that predicts a flat value inside step-like ranges of the hour. These three stand in for the richer learners you built earlier (the SVMs, GPs and forests); stacking works exactly the same whatever the learners are, and these three run live and give the same numbers every time.

```r
library(rpart)
fit_lin  <- lm(cups ~ hour, data = cart)                      # a straight line
fit_poly <- lm(cups ~ poly(hour, 5), data = cart)             # a smooth curve
fit_tree <- rpart(cups ~ hour, data = cart,                   # a step function
                  control = rpart.control(cp = 0.002, minbucket = 5))

base_rmse <- c(
  linear = rmse(predict(fit_lin,  test), test$cups),
  poly   = rmse(predict(fit_poly, test), test$cups),
  tree   = rmse(predict(fit_tree, test), test$cups))
round(base_rmse, 3)
#> linear   poly   tree
#>  7.162  5.050  4.867
```

The tree wins, just, at 4.867 cups of typical error; the smooth curve is close behind; the straight line is hopeless (it cannot represent two rush hours with one slope). The naive move is to ship the tree and bin the other two. But look at WHERE each model is right before you throw anything away.

```r
library(ggplot2)
grid <- data.frame(hour = seq(6, 20, by = 0.1))
fits <- rbind(
  data.frame(hour = grid$hour, cups = predict(fit_lin,  grid), model = "linear"),
  data.frame(hour = grid$hour, cups = predict(fit_poly, grid), model = "poly (smooth)"),
  data.frame(hour = grid$hour, cups = predict(fit_tree, grid), model = "tree"))
ggplot(cart, aes(hour, cups)) +
  geom_point(colour = "grey70", size = 1.2) +
  geom_line(data = fits, aes(hour, cups, colour = model), linewidth = 1) +
  labs(title = "Three models, each right in a different place",
       x = "hour of day", y = "cups sold (15-min window)") +
  theme_minimal(base_size = 13)
```

Press Run. The smooth curve traces the two rushes gracefully but rounds off the sharp noon jump. The tree nails the noon jump (a clean step) but climbs the rushes in coarse stairs. The line just splits the difference everywhere. **Each model is wrong exactly where another is right.** Throwing two of them away throws away the corrections they could make. Keeping all three is the whole idea.

=== step === concept
::eyebrow Why it works
## Combining helps because their mistakes disagree

Before we combine anything, it is worth being precise about WHY combining could help at all, because the answer tells us exactly when it will not. The key quantity is not how accurate the models are on their own, but how much their **errors** agree.

Compute the residual (actual minus predicted) for each model on the test set, and correlate the three columns of residuals.

```r
resid <- data.frame(
  linear = test$cups - predict(fit_lin,  test),
  poly   = test$cups - predict(fit_poly, test),
  tree   = test$cups - predict(fit_tree, test))
round(cor(resid), 2)
#>        linear poly tree
#> linear   1.00 0.85 0.62
#> poly     0.85 1.00 0.78
#> tree     0.62 0.78 1.00
```

::widget correlation-heatmap {"vars":["linear","poly","tree"],"matrix":[[1,0.85,0.62],[0.85,1,0.78],[0.62,0.78,1]]}

Read the grid. Every pair is positively correlated (they are all chasing the same demand curve, so when demand is genuinely surprising they tend to miss together), but none of the correlations is close to 1. The tree and the line disagree the most (r = 0.62): where the tree steps, the line slides. That disagreement is the raw material a blend feeds on.

Here is why, made exact. Suppose you average \(M\) models whose errors each have variance \(\sigma^2\) and whose errors have average pairwise correlation \(\rho\). The error variance of their average is

\[ \operatorname{Var}(\text{average}) = \rho\,\sigma^2 \;+\; \frac{1-\rho}{M}\,\sigma^2 \]

Every symbol in words: \(\sigma^2\) is how much one model's error bounces around; \(\rho\) is how much two models' errors move together (0 = independent mistakes, 1 = identical mistakes); \(M\) is how many models. The second term, the part averaging can kill, shrinks as you add models; the first term is a **floor** set by \(\rho\). Perfectly correlated errors (\(\rho = 1\)) leave the floor at the full \(\sigma^2\): averaging buys nothing. Independent errors (\(\rho = 0\)) let the whole thing fall toward \(\sigma^2/M\). 

[KEY INSIGHT]
Combining models pays off in proportion to how much their errors DISAGREE. Nadia's three learners are only partly decorrelated (0.62 to 0.85), so the gain here will be real but modest, and that is exactly the honest expectation. Three near-identical models would gain almost nothing, a fact we will cash in when deciding whether stacking is worth it.

=== step === concept
::eyebrow The baseline
## First instinct: just average them

The simplest way to keep all three is to average their predictions. No training, no weights, just the mean of the three numbers at every hour.

```r
avg_pred <- (predict(fit_lin, test) + predict(fit_poly, test) + predict(fit_tree, test)) / 3
round(c(base_rmse, average = avg_pred |> rmse(test$cups)), 3)
#> linear    poly    tree average
#>  7.162   5.050   4.867   5.208
```

Look closely: the plain average scores 5.208, which is **worse than the tree alone** (4.867). That stings, and it is the whole limitation of equal weights in one number. Averaging gave the hopeless straight line (RMSE 7.16) exactly the same one-third vote as the tree. A model that is both weak and correlated with the others does not cancel error, it adds it. Down-weighting the line and leaning on the curve and the tree would obviously do better, but a plain average has no way to know that.

[NOTE]
A simple average is a fine, robust default when your models are all of similar strength (it is hard to beat and impossible to overfit). It fails exactly when they are not, because it cannot tell a strong member from a weak one. What Nadia needs is a blend that LEARNS the weights.

=== step === quiz
::eyebrow Check yourself
## When does a plain average help?

You average several models' predictions. When does that average beat the best single model among them?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Always: an average is at least as good as its best member, by definition ::no An average can be worse than its best member, which is exactly what you just saw: the weak straight line dragged the equal-weight average (5.21) below the tree alone (4.87).
- When the members are individually decent AND make different, weakly correlated errors, so their mistakes partly cancel ::ok Right. Averaging cancels the part of the error the members do NOT share, so the payoff grows as their errors decorrelate. A member that is both weak and correlated with the rest just adds error to the pool.
- Only when all the members are equally accurate ::no Equal accuracy is neither required nor enough. What matters is that good members make different mistakes; and a plain average still wastes that by giving a weak member the same vote as a strong one, which is the gap stacking closes.

=== step === concept
::eyebrow The idea
## Stacking: let a model learn the blend

Think of the three base learners as a panel of specialists: one good on trends, one on smooth curvature, one on sharp thresholds. A plain average is a manager who counts every vote equally. **Stacking** hires a smarter manager: a second model, the **meta-learner**, whose entire job is to learn, from data, how much to trust each specialist. Stacking (Wolpert, 1992) is that two-level idea.

Write it down. Call the base learners \(f_1, f_2, \dots, f_M\) (here \(M = 3\): line, curve, tree). The stacked prediction for an input \(x\) is a weighted combination of their predictions:

\[ \hat f(x) \;=\; w_0 \;+\; \sum_{m=1}^{M} w_m\, f_m(x) \]

Here \(f_m(x)\) is base learner \(m\)'s prediction, and \(w_0, w_1, \dots, w_M\) are the meta-learner's weights (\(w_0\) is an intercept that shifts the whole blend). The meta-learner chooses those weights to minimize squared error over the training rows:

\[ \min_{w}\ \sum_{i=1}^{n} \Big( y_i \;-\; w_0 \;-\; \sum_{m=1}^{M} w_m\, z_{im} \Big)^2 \]

where \(y_i\) is the true cups for row \(i\), \(n\) is the number of rows, and \(z_{im}\) is base learner \(m\)'s prediction for row \(i\). That is just a linear regression: the response is the truth, and the three predictors are the three base learners' predictions. So the natural first attempt is to fit `lm()` with the base predictions as inputs. Let each model predict its own training rows, then regress the truth on those columns.

```r
P <- cbind(linear = predict(fit_lin,  cart),      # each base scores its OWN training rows
           poly   = predict(fit_poly, cart),
           tree   = predict(fit_tree, cart))
meta_leak <- lm(cart$cups ~ P)                    # the meta-learner: truth on base predictions
round(coef(meta_leak), 3)
#> (Intercept)     Plinear       Ppoly       Ptree
#>      -0.208      -0.004       0.035       0.978
```

The meta-learner handed the tree almost the entire weight (0.978) and all but ignored the curve and the line. Put it to work on the fresh test set (each base predicts the new rows, the meta blends them):

```r
Ptest <- cbind(1, linear = predict(fit_lin,  test),
                  poly   = predict(fit_poly, test),
                  tree   = predict(fit_tree, test))
round(rmse(as.numeric(Ptest %*% coef(meta_leak)), test$cups), 3)
#> [1] 4.837
```

A test RMSE of 4.837, barely better than shipping the tree alone (4.867), and worse than what we are about to get. The meta-learner essentially rebuilt the tree and threw the diversity away. Why did it trust the tree so blindly?

=== step === concept
::eyebrow The trap
## A model grading its own homework

The answer is a subtle, dangerous form of cheating, and it hides in the phrase "predict its own training rows." A flexible model has already SEEN those rows, so its predictions on them are flattering, not honest. Measure exactly how flattering for the tree, the model the meta trusted. Compare its error on its own training rows to its error on the fresh test set.

```r
insample_rmse <- apply(P, 2, function(pr) rmse(pr, cart$cups))   # each base on its own rows
round(c(in_sample = unname(insample_rmse["tree"]),
        on_test   = unname(base_rmse["tree"])), 3)
#> in_sample   on_test
#>     3.291     4.867
```

The tree scores **3.291 on its own rows but 4.867 on fresh data**. That gap is the tree flattering itself: on training rows it partly memorized, so it looks far better than it really is. The meta-learner, shown only the flattering 3.29 version, naturally concluded the tree was the star and handed it the weight. It was fooled by a self-graded report card. The rigid straight line cannot pull this trick (it is too inflexible to memorize anything), which is exactly why a flexible learner is the dangerous one to trust in-sample. This mistake has a name: **leakage**, information about the answer sneaking into a model's inputs.

[WARNING]
The more flexible a base learner, the harder it flatters itself in-sample, and the worse this gets. A 1-nearest-neighbour model, or a fully grown tree, scores a perfect RMSE of 0 on its own training rows (every point is its own closest match), so a meta-learner trained on in-sample predictions would hand it 100% of the weight and the stack would collapse into that one overfit model. Training the meta-learner on in-sample predictions is not a small inefficiency; it quietly defeats the entire point of stacking.

=== step === concept
::eyebrow The fix
## Out-of-fold predictions

The fix is to give the meta-learner HONEST base predictions: for every row, a prediction from a model that never saw that row. Cross-validation already does exactly this. Split the training data into K folds; for each fold, train the base learners on the other K minus 1 folds and predict the held-out fold. Every row gets a prediction made without it. Step through the folds below to feel the rotation, then we build it.

::widget cv-folds {"k":5}

Do that for all three base learners and you get a matrix with one column per learner and one row per training row: the **out-of-fold predictions**, sometimes called the level-one data. This matrix, not the in-sample one, is what the meta-learner should see.

```r
K <- 5
set.seed(7)
fold <- sample(rep(1:K, length.out = nrow(cart)))          # assign each row to a fold
Z <- matrix(NA, nrow(cart), 3, dimnames = list(NULL, c("linear", "poly", "tree")))
for (k in 1:K) {
  tr <- cart[fold != k, ]                                  # train on the other four folds
  ho <- which(fold == k)                                   # predict the held-out fold
  Z[ho, "linear"] <- predict(lm(cups ~ hour, tr), cart[ho, ])
  Z[ho, "poly"]   <- predict(lm(cups ~ poly(hour, 5), tr), cart[ho, ])
  Z[ho, "tree"]   <- predict(rpart(cups ~ hour, tr,
                        control = rpart.control(cp = 0.002, minbucket = 5)), cart[ho, ])
}
round(head(Z), 1)
#>      linear poly tree
#> [1,]   21.7 22.4 17.7
#> [2,]   22.3 17.6 13.7
#> [3,]   24.0 20.3 21.4
#> [4,]   27.6 30.9 30.6
#> [5,]   20.7 23.9 24.5
#> [6,]   26.4 31.0 29.3
```

Now score each column against the truth and line it up against the flattering in-sample errors from the last step. These out-of-fold numbers are the models' HONEST error rates, because no row was predicted by a model that trained on it.

```r
oof_rmse <- apply(Z, 2, function(pr) rmse(pr, cart$cups))
round(rbind(in_sample = insample_rmse, out_of_fold = oof_rmse), 3)
#>             linear  poly  tree
#> in_sample    6.220 4.719 3.291
#> out_of_fold  6.351 4.958 4.574
```

Read the two rows together. The rigid line barely moves (6.22 to 6.35), the smooth curve moves a little (4.72 to 4.96), and the tree lurches from a fantasy 3.291 to an honest **4.574**. The more flexible the learner, the more out-of-fold exposes its self-flattery. And out-of-fold, the tree and the curve are much closer rivals than the in-sample numbers suggested, which is exactly the truth the meta-learner needs to weigh them fairly.

=== step === tryit
::eyebrow Your turn
## Build one out-of-fold prediction

The heart of the loop above is one line: train a model on the folds that are NOT `k`, then predict the rows that ARE fold `k`. You have `cart` and `fold` in your session. Fill in the blank so the tree, trained on the other four folds, predicts the rows it never saw.

```r
k  <- 3
tr <- cart[fold != k, ]          # train on the other four folds
ho <- which(fold == k)           # row indices of the held-out fold
oof_tree <- predict(rpart(cups ~ hour, tr,
              control = rpart.control(cp = 0.002, minbucket = 5)), ____)
round(head(oof_tree, 5), 1)
```
::check {"regex":"cart\\s*\\[\\s*ho","gate":true,"difficulty":"intermediate","ok":"Yes. The tree trained on the other folds now predicts cart[ho, ], the rows it never saw, giving honest out-of-fold predictions: 21.4, 24.5, 19.5, 13.0, 13.0.","no":"Predict the held-out rows, cart[ho, ], the fold the tree did NOT train on. Those are the honest predictions the meta-learner needs."}
::solution
```r
k  <- 3
tr <- cart[fold != k, ]
ho <- which(fold == k)
oof_tree <- predict(rpart(cups ~ hour, tr,
              control = rpart.control(cp = 0.002, minbucket = 5)), cart[ho, ])
round(head(oof_tree, 5), 1)
#>    3    5   13   26   28
#> 21.4 24.5 19.5 13.0 13.0
```

=== step === concept
::eyebrow The payoff
## Fit the meta, read the win

Now refit the meta-learner, but on the out-of-fold matrix `Z` instead of the flattering in-sample matrix `P`. Everything else is identical.

```r
meta <- lm(cart$cups ~ Z)                                  # meta trained on OUT-OF-FOLD preds
round(coef(meta), 3)
#> (Intercept)     Zlinear       Zpoly       Ztree
#>       1.148      -0.010       0.304       0.659
```

A completely different, and honest, verdict. Instead of collapsing onto the tree (0.978 before), the meta-learner now leans on the tree (0.659) AND the curve (0.304) together, the two learners that genuinely complement each other, and gives the weak line essentially nothing. That is stacking exploiting the diversity we measured earlier. The whole recipe, start to finish, is just four moves:

::widget process-flow {"steps":[{"title":"Cross-validate each base learner","sub":"K-fold: predict every training row from models that never saw it"},{"title":"Collect the out-of-fold predictions","sub":"one column per learner, one row per training row: the matrix Z"},{"title":"Fit the meta-learner on Z","sub":"it learns the blend weights from honest, not self-graded, predictions"},{"title":"Refit the bases on all the data","sub":"to predict a new row: run the bases, then the meta on top of them"}]}

Score the honest stack on the fresh test set, using the base learners refit on all of Nadia's data (that is what `Ptest` already holds), with the meta on top.

```r
stack_rmse <- rmse(as.numeric(Ptest %*% coef(meta)), test$cups)
round(stack_rmse, 3)
#> [1] 4.724
```

**4.724, below every single base learner** (linear 7.16, poly 5.05, tree 4.87) and below the plain average (5.21). Modest, as we predicted from the correlations, but real, and free: Nadia already trained these three models. Put the whole scoreboard on one chart.

```r
scoreboard <- data.frame(
  model = c("linear", "poly", "tree", "average", "stacked"),
  rmse  = c(base_rmse, average = avg_pred |> rmse(test$cups), stacked = stack_rmse))
scoreboard$model <- factor(scoreboard$model, levels = scoreboard$model)
ggplot(scoreboard, aes(model, rmse, fill = model == "stacked")) +
  geom_col(width = 0.65, show.legend = FALSE) +
  geom_text(aes(label = round(rmse, 2)), vjust = -0.4, size = 4) +
  scale_fill_manual(values = c("grey65", "#2563a8")) +
  labs(title = "The stack beats every learner it is built from",
       x = NULL, y = "test RMSE (cups)") +
  theme_minimal(base_size = 13)
```

=== step === quiz
::eyebrow Check yourself
## Why out-of-fold?

Why must the meta-learner be trained on out-of-fold predictions rather than the base models' predictions on their own training rows?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Out-of-fold prediction is just a faster way to get the same predictions ::no It is not about speed. It is actually K times MORE work. It is about honesty: in-sample predictions are a genuinely different, over-optimistic set of numbers.
- On its own training rows a flexible learner predicts too well, so a meta trained on those over-trusts it; out-of-fold predictions reveal each learner's true skill, so the weights are honest ::ok Exactly. The tree's in-sample RMSE (3.29) flattered it; its honest out-of-fold RMSE (4.57) is worse, and the meta trained on out-of-fold predictions weights it sensibly (0.66) alongside the curve (0.30) instead of collapsing onto it.
- Out-of-fold predictions stop the base learners themselves from overfitting ::no The base learners are unchanged, and a deep tree still overfits. Out-of-fold changes only what the META sees: honest predictions instead of self-graded ones. Overfit bases are fine, as long as the meta judges them out-of-fold.

=== step === concept
::eyebrow The refinement
## The Super Learner: a convex blend with a guarantee

Our `lm` meta-learner was free to do whatever least squares wanted, including a slightly negative weight on the line and an intercept of 1.148. That works, but the weights are hard to read and, with many correlated base learners, an unconstrained regression can chase noise. The **Super Learner** (van der Laan, Polley and Hubbard, 2007) pins the meta-learner down to a **convex combination**: weights that are non-negative and sum to one.

\[ \hat f(x) \;=\; \sum_{m=1}^{M} w_m\, f_m(x), \qquad w_m \ge 0, \quad \sum_{m=1}^{M} w_m = 1 \]

A convex combination is just a weighted average whose weights are genuine proportions, so \(w = (0.04, 0.31, 0.66)\) reads directly as "trust the tree 66%, the curve 31%, the line 4%." To find those weights we minimize the same squared error over the out-of-fold matrix `Z`, but subject to the constraint. A clean way to enforce it in base R is to optimize over unconstrained numbers passed through a **softmax**, which always returns non-negative values summing to one.

```r
sse <- function(theta) {
  w <- exp(theta) / sum(exp(theta))              # softmax: forces w >= 0 and sum(w) = 1
  mean((cart$cups - as.numeric(Z %*% w))^2)      # squared error of the convex blend
}
opt <- optim(c(0, 0, 0), sse, method = "BFGS")
w   <- exp(opt$par) / sum(exp(opt$par))
names(w) <- colnames(Z)
round(w, 3)
#> linear   poly   tree
#>  0.036  0.306  0.659
```

```r
sl_pred <- cbind(predict(fit_lin, test), predict(fit_poly, test), predict(fit_tree, test)) %*% w
round(rmse(sl_pred, test$cups), 3)
#> [1] 4.705
```

RMSE 4.705, a hair better than the unconstrained stack and far easier to interpret and to trust. The name "Super Learner" comes with a genuine theoretical promise, the **oracle property**: as the sample grows, the Super Learner's expected loss converges to that of the best possible convex combination of the learners in your library, the combination you could only pick if you already knew the truth (the "oracle"). In plain words: **you are asymptotically no worse than the best blend achievable from your set of models**, without knowing in advance which blend that is. That is a strong, honest guarantee, and note its limit: it is about the best blend of the models you GAVE it. A library of three mediocre learners caps how good the Super Learner can be.

=== step === concept
::eyebrow Honest scoring
## How good is the stack, really?

One more piece of rigor, because it is a classic way stacking flatters itself. We measured the stack on a separate test set, which is honest. But suppose Nadia has no test set to spare and wants to estimate the stack's error from her 160 rows alone. She cannot just report the meta-learner's error on `Z`: the meta-learner was FIT on `Z`, so scoring it there is the same self-grading trap, one level up. The fix is **nested cross-validation**: an outer CV loop in which the entire stacking procedure (build `Z`, fit the meta) happens on the inner data, and is then scored on an outer fold it never touched.

```r
super_cv <- function(dat, Kout = 5, Kin = 5, seed = 11) {
  set.seed(seed)
  ofold <- sample(rep(1:Kout, length.out = nrow(dat)))
  pred  <- numeric(nrow(dat))
  for (o in 1:Kout) {
    dev  <- dat[ofold != o, ]                     # build the whole stack here
    hold <- dat[ofold == o, ]                     # outer holdout: untouched while building
    ifold <- sample(rep(1:Kin, length.out = nrow(dev)))
    Zi <- matrix(NA, nrow(dev), 3)
    for (k in 1:Kin) {                            # inner CV -> out-of-fold preds for the meta
      itr <- dev[ifold != k, ]; iho <- which(ifold == k)
      Zi[iho, 1] <- predict(lm(cups ~ hour, itr), dev[iho, ])
      Zi[iho, 2] <- predict(lm(cups ~ poly(hour, 5), itr), dev[iho, ])
      Zi[iho, 3] <- predict(rpart(cups ~ hour, itr,
                     control = rpart.control(cp = 0.002, minbucket = 5)), dev[iho, ])
    }
    ob <- function(th) { ww <- exp(th)/sum(exp(th)); mean((dev$cups - as.numeric(Zi %*% ww))^2) }
    ww <- { op <- optim(c(0,0,0), ob, method = "BFGS"); exp(op$par)/sum(exp(op$par)) }
    Ph <- cbind(predict(lm(cups ~ hour, dev), hold),        # bases refit on the dev set...
                predict(lm(cups ~ poly(hour, 5), dev), hold),
                predict(rpart(cups ~ hour, dev,
                   control = rpart.control(cp = 0.002, minbucket = 5)), hold))
    pred[ofold == o] <- Ph %*% ww                           # ...blended, scored on the holdout
  }
  rmse(pred, dat$cups)
}
round(super_cv(cart), 3)
#> [1] 4.252
```

The honest, no-test-set estimate is 4.252, comfortably below every base learner's own out-of-fold error (the best was the tree at 4.574). It differs from the 4.72 we measured on the separate test set simply because the two use different random draws of data, but they agree on the verdict that matters: **the stack generalizes better than the best learner in it, and both numbers were earned without any model grading its own work.**

=== step === tryit
::eyebrow Your turn
## Predict with the stack

Nadia wants a forecast for 12:30, just after the lunch jump. The stack's prediction is each base model's prediction at that hour, blended by the convex weights `w` (still in your session). Fill in the blank.

```r
new       <- data.frame(hour = 12.5)                 # 12:30, just after the lunch jump
base_pred <- unname(c(predict(fit_lin, new), predict(fit_poly, new), predict(fit_tree, new)))
base_pred                                            #  22.9  17.0  16.8
stacked   <- ____                                    # blend them with the convex weights w
round(stacked, 1)
```
::check {"regex":"w\\s*\\*|\\*\\s*w|%\\*%|weighted\\.mean","gate":true,"difficulty":"intermediate","ok":"That blends the three predictions by how much the Super Learner trusts each: 0.036*22.9 + 0.306*17.0 + 0.659*16.8 = 17.1 cups. The tree and the curve carry the forecast; the line barely counts.","no":"Weight each base prediction by w and add them up: sum(w * base_pred), or base_pred %*% w. Because the convex weights w sum to 1, this is a weighted average."}
::solution
```r
new       <- data.frame(hour = 12.5)
base_pred <- unname(c(predict(fit_lin, new), predict(fit_poly, new), predict(fit_tree, new)))
stacked   <- sum(w * base_pred)
round(stacked, 1)
#> [1] 17.1
```

=== step === concept
::eyebrow In practice
## Production tools, and when stacking breaks

You have now built every part a stacking library contains: the out-of-fold matrix, the meta-learner, and the two-stage prediction path. In real work you hand those parts to a package. The `SuperLearner` package is the direct implementation of this lesson: give it a library of learners and it cross-validates them and fits the convex meta-learner for you.

```r-static
# Run locally (install.packages("SuperLearner")). It cross-validates a whole library
# of learners and returns each one's CV risk and its convex (non-negative) weight.
sl <- SuperLearner::SuperLearner(
  Y = cart$cups, X = cart["hour"],
  SL.library = c("SL.lm", "SL.rpart", "SL.polymars"),
  method     = "method.NNLS"      # non-negative least squares -> convex weights
)
sl                                # prints each learner's risk and its coefficient
```

In the tidymodels world the same idea ships as the `stacks` package (it stacks tuned `workflow` objects with a penalized meta-learner), and `mlr3pipelines` builds stacks as reusable graphs. Whichever you use, the decision of whether to stack at all is yours, and it follows from everything above.

| Situation | Should you stack? |
|---|---|
| Several strong, DIVERSE learners (a tree, a linear model, a GP), data to spare | Yes: this is exactly stacking's sweet spot |
| A few near-identical models, or copies of one model | No: their errors are correlated, so there is nothing to cancel |
| A tiny dataset (dozens of rows) | Rarely: the K-fold split leaves too little to fit the meta reliably |
| One model already clearly dominates and interpretability matters | Often no: a small gain may not be worth the added complexity |

And the failure modes, honestly. **Correlated learners:** as the averaging identity warned, if the base learners make the same mistakes the blend cannot improve on them, a stack of look-alikes is wasted compute. **Cost:** stacking multiplies training by roughly K (the folds) times the number of learners, and every prediction must run all of them. **Meta overfit:** with few rows or many learners, even the meta-learner can overfit the out-of-fold matrix, which is why the Super Learner constrains it (convex weights) and why you evaluate with nested CV. **Leaky preprocessing:** any scaling, imputation or feature selection must happen INSIDE each fold, or the leak you closed for the meta sneaks back in through the base learners' inputs.

[KEY INSIGHT]
Stacking is not a free lunch that always wins; it is a principled way to spend compute converting model DIVERSITY into accuracy. Its ceiling is the best blend of the learners you supply, and its cost is real. Feed it strong, different learners with honest out-of-fold predictions, and it reliably beats picking one.

=== step === quiz
::eyebrow Check yourself
## When is stacking worth it?

Nadia's stack beat her best single model by a little. When is stacking most worth its extra machinery?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Always: a stack is mathematically guaranteed to beat its best base learner on new data ::no There is no such guarantee. A stack can tie, or with too few rows or a leak even lose. Here it won by a modest amount precisely because the three learners were only partly diverse.
- When you have several strong but DIVERSE base learners and enough data to cross-validate, so the meta has real, different signals to blend and the CV cost is affordable ::ok Right. Diversity supplies the un-shared error to cancel, and data supplies honest out-of-fold predictions. Three near-identical models, or a few dozen rows, and stacking earns little for its K-times cost.
- When you stack many copies of your single best model to reinforce it ::no Copies of one model are perfectly correlated: nothing to cancel, no gain, just cost. Stacking rewards disagreement between learners, not repetition of one.

=== step === concept
::eyebrow Go deeper
## References

Five authoritative places to take this further:

- [Wolpert (1992), Stacked Generalization, Neural Networks 5(2)](https://doi.org/10.1016/S0893-6080(05)80023-1) - the paper that introduced stacking and the out-of-fold construction you built here.
- [Breiman (1996), Stacked Regressions, Machine Learning 24](https://doi.org/10.1007/BF00117832) - shows why non-negative (convex) weights make stacked regression robust, the idea behind the Super Learner.
- [van der Laan, Polley and Hubbard (2007), Super Learner](https://doi.org/10.2202/1544-6115.1309) - the cross-validated, convex version with the oracle guarantee.
- [The Elements of Statistical Learning, ch. 8 (free PDF)](https://hastie.su.domains/ElemStatLearn/) - model averaging and stacking in the wider context of ensembles.
- [The SuperLearner R package (CRAN)](https://cran.r-project.org/package=SuperLearner) - the production implementation of everything in this lesson.

=== step === complete
## Lesson 5 complete

You stopped throwing away good models. You saw that Nadia's three learners each win somewhere and that a plain average can lose because it cannot tell a strong member from a weak one. You measured why blending works at all (decorrelated errors) and built a stack from scratch: a meta-learner that learns the weights, trained on out-of-fold predictions so no model grades its own homework, beating every base learner it was made of. You upgraded it to a Super Learner with interpretable convex weights and the oracle guarantee, scored the whole thing honestly with nested cross-validation, and drew the honest line on when stacking earns its keep.

Next, Lesson 6: Bayesian Optimization for Hyperparameters. Every model in this lesson, and in the stack, ran on settings we chose by hand. When each setting is expensive to test, choosing them well becomes its own search problem, and the same Gaussian process from Lesson 4 comes back as the engine that solves it.
