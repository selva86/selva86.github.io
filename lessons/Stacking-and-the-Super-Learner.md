---
title: "Advanced Supervised Learning Lesson 5: Stacking and the Super Learner"
catalog_blurb: "Blend several models with cross-validation so the combination beats the best single one."
description: "Stacking in R from scratch: why diverse models blend well, out-of-fold predictions, a meta-learner that beats every base model, and Super Learner weights."
keywords: "stacking, stacked generalization, super learner, ensemble learning, meta-learner, out-of-fold predictions, model blending, stacking in R, SuperLearner package"
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

In Lesson 4 a Gaussian process predicted kiln temperatures and confessed how sure it was. This lesson keeps the honesty theme but changes the question. You now have a shelf of strong learners: SVMs, discriminant blends, GPs, trees. When several of them are good, why crown one?

Meet Priya, who prices trade-ins for a used-car dealership. Cars arrive at the lot every week; quote too little and the seller walks next door, quote too much and the lot eats the loss at resale. Her evidence is two years of history: **240 hatchbacks**, each with three facts, the car's age in years, the kilometres driven (in thousands), and the price it actually resold for (in thousands of dollars). She has built three price models: a linear regression, a deep decision tree, and an RBF SVM. On held-out cars they score within a whisker of each other, and her instinct says pick the winner, delete the rest.

That instinct throws money away. The three models make **different** mistakes, and a fourth model, trained to combine them, prices cars better than any of the three alone. Building that fourth model correctly, without cheating, is called stacking, and its most principled form is the Super Learner. By the end of this lesson you will be able to:

- Measure how differently two models fail with an error-correlation matrix, and explain why disagreeing errors are fuel for blending
- Explain why the blending model must be trained on out-of-fold predictions, and show exactly what happens to the blend weights when you cheat
- Build a complete stack in R: the out-of-fold matrix, the meta-learner, and the two-stage prediction path
- Say what the Super Learner adds: convex weights, the discrete Super Learner, and the oracle guarantee in plain words

**Prerequisites:** [k-fold cross-validation](Cross-Validation-Strategies.html) (the machinery this lesson repurposes), [linear regression](Linear-Regression.html), [decision trees](Decision-Trees-for-Classification.html) and the [bias-variance trade-off](The-Bias-Variance-Tradeoff.html), and this course's [SVM lessons](Kernel-SVMs-and-the-Kernel-Trick.html).

The interactive below is the destination in miniature: three base learners, each cross-validated, blended by a meta-learner. Toggle between the test errors (the stacked bar sits lowest) and the blend weights (how much the meta-learner trusts each model). We will build this exact pipeline on Priya's cars, step by step.

::widget stacking-blend {}

=== step === concept
::eyebrow The contenders
## Three good models, one price to quote

Each lesson runs in a fresh R session, so we start by writing Priya's sales ledger ourselves. Building it by hand has a teaching payoff: we know the truth the models are chasing. Prices fall along a smooth depreciation curve as cars age; every thousand kilometres shaves a little more off; and old, heavily driven cars drop off a small cliff (past a point, buyers pay scrap-plus-a-bit, not book value). Real ledgers hide their formula. Ours shows it, so we can see why each model succeeds where it does.

```r
library(rpart)     # decision trees
library(e1071)     # support vector machines
library(ggplot2)

set.seed(29)
n   <- 240
age <- round(runif(n, 0.5, 12), 1)                     # years on the road
km  <- round(age * runif(n, 6, 14) + runif(n, 0, 15))  # thousand km, grows with age
price <- round(3.5 + 26 * exp(-0.15 * age) - 0.02 * km +
               ifelse(age > 8 & km > 90, -3, 0) +      # the scrap-value cliff
               rnorm(n, 0, 1.1), 2)                    # everything a ledger cannot see
cars_sold <- data.frame(age, km, price)
head(cars_sold, 4)
#>   age km price
#> 1 1.6 17 23.29
#> 2 3.3 47 17.98
#> 3 1.7 22 24.90
#> 4 4.2 62 16.57
```

A 1.6-year-old car with 17,000 km resold for 23,290 dollars; a 4.2-year-old with 62,000 km fetched 16,570. Priya locks 60 cars away as the final exam (the test set, touched only to score finished models) and trains on the other 180. Her tree is grown deep on purpose (`cp = 0.001`, `minsplit = 5`) so its small leaves can carve out the scrap cliff. Remember that choice; it is about to matter.

```r
test_id <- sample(n, 60)                 # 60 cars locked away: the final exam
train <- cars_sold[-test_id, ]
test  <- cars_sold[test_id, ]

rmse <- function(actual, pred) sqrt(mean((actual - pred)^2))

m_lin  <- lm(price ~ age + km, data = train)
m_tree <- rpart(price ~ age + km, data = train, cp = 0.001, minsplit = 5)
m_svm  <- svm(price ~ age + km, data = train)          # RBF kernel by default

p_test <- data.frame(linear = predict(m_lin,  test),
                     tree   = predict(m_tree, test),
                     svm    = predict(m_svm,  test))
round(sapply(p_test, rmse, actual = test$price), 3)
#> linear   tree    svm 
#>  1.543  1.464  1.289 
```

RMSE (root mean squared error) is the typical size of a quote's miss, in the same units as price: the SVM misses a typical unseen car by about 1,290 dollars, the linear model by about 1,540. A close race with one apparent winner. But now look at the **shape** each family draws, with mileage held at 60,000 km:

```r
grid_cars <- data.frame(age = seq(0.5, 12, by = 0.1), km = 60)
fits <- rbind(
  data.frame(model = "linear",    age = grid_cars$age, price = predict(m_lin,  grid_cars)),
  data.frame(model = "deep tree", age = grid_cars$age, price = predict(m_tree, grid_cars)),
  data.frame(model = "RBF SVM",   age = grid_cars$age, price = predict(m_svm,  grid_cars))
)
ggplot(train, aes(age, price)) +
  geom_point(alpha = 0.3, size = 1.6) +
  geom_line(data = fits, aes(colour = model), linewidth = 1) +
  labs(title = "Three families, three shapes (mileage fixed at 60,000 km)",
       x = "age (years)", y = "sale price (thousand dollars)", colour = NULL) +
  theme_minimal(base_size = 13)
```

The straight line cannot bend, so it overprices the middle-aged cars and keeps falling long after real prices flatten. The deep tree is a staircase: it can catch the cliff, but each step wobbles with the handful of cars that defined it. The SVM bends smoothly, and rounds off sharp corners for the same reason. Three honest workers, three different blind spots.

[KEY INSIGHT]
A model family is the set of shapes it is allowed to draw. Different families are therefore wrong in different places, and "wrong in different places" is not a nuisance. It is a resource you can spend.

=== step === concept
::eyebrow Diversity
## Errors that disagree are an asset

Watch the three models argue about individual cars from the test set:

```r
round(cbind(test, p_test)[c("11", "77", "107"), ], 2)
#>      age  km price linear  tree   svm
#> 11  11.8 164  0.67  -0.87  2.97  2.68
#> 77  10.8  82  6.44   4.84  7.04  6.96
#> 107  4.9  48 16.69  16.20 13.83 15.00
```

Car 11, an 11.8-year workhorse with 164,000 km, actually sold for 670 dollars. The linear model quotes **minus 870 dollars**: a straight line that keeps falling has no idea where to stop. The tree and SVM stay sane. But on car 107, a 4.9-year car, the roles flip: the linear model is closest (16.20 against the true 16.69) while the deep tree misses by almost 2,900 dollars. And on car 77, an old car that dodged the cliff, the linear model is the one caught flat. No model is always the fool; each is the fool somewhere different.

Put one number on "somewhere different": correlate the models' errors across all 60 test cars.

```r
res <- test$price - p_test        # each model's error on each unseen car
round(cor(res), 2)
#>        linear tree  svm
#> linear   1.00 0.45 0.65
#> tree     0.45 1.00 0.79
#> svm      0.65 0.79 1.00
```

Here is that matrix as a picture:

::widget correlation-heatmap {"vars":["linear","tree","svm"],"matrix":[[1,0.45,0.65],[0.45,1,0.79],[0.65,0.79,1]]}

If two models' errors correlated at 1.00, they would make the same mistake on every car and blending them would buy nothing. At 0.45, when the linear model overprices a car, the tree is doing something unrelated about half the time, so their mistakes partly cancel in an average. You met this arithmetic in the [random forest course](RF-Course-Lesson-2.html), and it is worth re-deriving because it is the entire economics of stacking. Suppose each model's error \(\varepsilon_m\) (epsilon: the miss on a given car) has typical spread \(\sigma\) (sigma: the RMSE-sized standard deviation) and every pair of errors correlates at \(\rho\) (rho). The averaged error \(\bar\varepsilon\) then has variance

\[ \mathrm{Var}(\bar\varepsilon) \;=\; \rho\,\sigma^2 \;+\; \frac{1-\rho}{M}\,\sigma^2 , \]

where \(M\) is the number of models blended. The second term shrinks as you add models; the first term, the **shared** part of the mistakes, never does. Disagreement (small \(\rho\)) is the fuel; the errors every model shares are the floor no blend can dig below. Test the theory with the crudest possible blend, an equal vote:

```r
p_avg <- rowMeans(p_test)         # every model gets an equal say
round(rmse(test$price, p_avg), 3)
#> [1] 1.234
```

An unweighted average, no learning involved, already prices cars better than the best single model (1.234 against the SVM's 1.289). That is the diversity dividend paying out. But equal votes are a blunt instrument: the SVM has clearly earned more say than the line that quoted a negative price. Surely we can **learn** how much to trust each model. We can, and there is a trap on the way.

=== step === concept
::eyebrow The trap
## Never learn weights from flattering predictions

The natural move: treat the three models' predictions as three new columns, and regress the true price on them. The regression's coefficients are then the trust weights, learned from data. The blending model is called the **meta-learner** (a model whose inputs are other models' outputs), and the models feeding it are the **base learners**. One question decides whether this works: *which* predictions do you train the meta-learner on? First instinct: predictions on the training cars. We have them already.

```r
p_in <- data.frame(linear = predict(m_lin,  train),
                   tree   = predict(m_tree, train),
                   svm    = predict(m_svm,  train))
round(sapply(p_in, rmse, actual = train$price), 3)
#> linear   tree    svm 
#>  1.529  1.019  1.232 
```

Read the tree's number. On its own training cars it scores 1.019, comfortably the "best" model, nearly half a unit better than the 1.464 it earned on genuinely unseen cars in step 2. The deep tree, with its tiny 5-car leaves, has partly memorized the training set. It is not lying about the training cars; it is lying about the future. Hand these flattering columns to a meta-learner and it believes the lie:

```r
meta_naive <- lm(train$price ~ ., data = p_in)
round(coef(meta_naive), 2)
#> (Intercept)      linear        tree         svm 
#>       -0.05        0.03        0.85        0.12 
round(rmse(test$price, predict(meta_naive, p_test)), 3)
#> [1] 1.379
```

The meta-learner hands 0.85 of the vote to the memorizer, and the resulting blend scores **1.379** on the final exam: worse than the plain average (1.234), worse than the SVM alone (1.289). This is **leakage**: each training car's own price is partly memorized inside the tree's prediction for it, so the column that is supposed to say "how good is the tree on a car like this" secretly contains the answer sheet.

The fix follows from stating the requirement plainly: the meta-learner must see each base model *the way the future will see it*, predicting cars it never trained on. Cross-validation manufactures exactly that. Deal the 180 training cars into 5 folds. To get honest predictions for fold 1, train the three bases on folds 2 to 5 and predict fold 1's cars; then let fold 2 sit out, and so on around the wheel. Every training car ends up predicted by models that never saw it. These are **out-of-fold predictions** (OOF), and the 180-by-3 matrix of them (competition folk call it the level-one data) is the only safe textbook for the meta-learner. Step through the rotation:

::widget cv-folds {"k":5}

[KEY INSIGHT]
Stacking is cross-validation used as a factory rather than a scorekeeper. The product is not the CV score (we throw it away); it is the full column of honest predictions each model leaves behind on its way around the folds.

=== step === quiz
::eyebrow Check yourself
## Why not train the blender in-sample?

A colleague shrugs: "The three base models were fit on those 180 cars anyway. Why can the meta-learner not just use their predictions on those same cars?" What is the sharpest answer?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- The meta-learner's whole job is deciding how much to trust each base model, and in-sample predictions misreport exactly that: the deep tree looked like a 1.019 model when it is honestly a 1.5 one, so the learned weights are wrong for every future car ::ok Right. The weights are the product, and the inputs were flattery: 0.85 of the vote went to the memorizer. The same meta-learner jumps from 1.379 to a winning score the moment its training columns become honest, which is the next step.
- Nothing is wrong in principle, because the finished stack is still checked on the 60 held-out cars; the test set will catch any over-trust before it costs money ::no The test set measured the damage (1.379) but could not prevent it: the weights were already mislearned by then. Evaluation catches mistakes; it does not repair training. You would ship a worse blend, now with a certificate documenting exactly how much worse.
- The real problem is that lm is too flexible a meta-learner; averaging the in-sample predictions instead removes the incentive to over-trust any single model ::no A plain average does dodge this trap, but only by refusing to learn at all, and the whole point was to improve on equal votes. The leak lives in the input columns (flattering predictions), not in the meta-learner's flexibility: fix the inputs and even plain lm learns good weights.

=== step === concept
::eyebrow The build
## Build the honest stack

Fifteen lines. The loop below is the cross-validation you already know, with one twist: the score is thrown away and the predictions are kept.

```r
K <- 5
fold <- sample(rep(1:K, length.out = nrow(train)))   # fold labels dealt out like cards
oof <- data.frame(linear = rep(NA_real_, nrow(train)), tree = NA_real_, svm = NA_real_)

for (k in 1:K) {
  tr <- train[fold != k, ]                 # train on everything except fold k
  te <- which(fold == k)                   # ...then predict the rows fold k held out
  oof$linear[te] <- predict(lm(price ~ age + km, data = tr),  train[te, ])
  oof$tree[te]   <- predict(rpart(price ~ age + km, data = tr,
                                  cp = 0.001, minsplit = 5),  train[te, ])
  oof$svm[te]    <- predict(svm(price ~ age + km, data = tr), train[te, ])
}
round(sapply(oof, rmse, actual = train$price), 3)
#> linear   tree    svm 
#>  1.564  1.514  1.366 
```

Same three models, honest report card: the tree's 1.019 fantasy is now 1.514, close to the 1.464 it earns on the final exam. That agreement is the whole point: out-of-fold predictions preview the future. Now refit nothing, change nothing, except the columns the meta-learner reads:

```r
meta <- lm(train$price ~ ., data = oof)
round(coef(meta), 2)
#> (Intercept)      linear        tree         svm 
#>       -0.25        0.17        0.30        0.54 
round(rmse(test$price, predict(meta, p_test)), 3)
#> [1] 1.189
```

Identical code to the naive stack; only the training data changed. The vote redistributes (the SVM now leads at 0.54, the memorizing tree drops to 0.30) and the test RMSE lands at **1.189**, below every single model and below the plain average. Note how prediction works from here on, because it runs in two stages: for a new car, each base learner predicts first, then the meta-learner blends those three numbers. The base learners used at prediction time are the ones fit on **all** 180 training cars (`m_lin`, `m_tree`, `m_svm`); the folds existed only to build the meta-learner's honest textbook. That is exactly what `predict(meta, p_test)` just did. The full scoreboard:

```r
scoreboard <- data.frame(
  model = c("linear", "deep tree", "RBF SVM", "simple average",
            "naive stack (leaky)", "stacked on OOF"),
  test_rmse = round(c(sapply(p_test, rmse, actual = test$price),
                      rmse(test$price, p_avg),
                      rmse(test$price, predict(meta_naive, p_test)),
                      rmse(test$price, predict(meta, p_test))), 3))
print(scoreboard[order(scoreboard$test_rmse), ], row.names = FALSE)
#>                model test_rmse
#>       stacked on OOF     1.189
#>       simple average     1.234
#>              RBF SVM     1.289
#>  naive stack (leaky)     1.379
#>            deep tree     1.464
#>               linear     1.543
```

On a typical car the stack shaves about 100 dollars of error off Priya's best single model, and about 275 off the deep tree that the in-sample table would have crowned. Margins this size are normal for stacking: it wins by noses, not laps, but it wins the nose so reliably that the top of nearly every prediction-competition leaderboard is a stack.

=== step === concept
::eyebrow The Super Learner
## From stack to Super Learner

Give the recipe its formal clothes. With \(M\) base learners (here \(M = 3\)) and \(Z_{im}\) the out-of-fold prediction of learner \(m\) for training car \(i\), the stack predicts a new car \(x\) as

\[ \hat f(x) \;=\; \hat\alpha \;+\; \sum_{m=1}^{M} \hat w_m\, \hat f_m(x), \]

where \(\hat f_m(x)\) is base learner \(m\)'s own prediction for that car, \(\hat w_m\) is its learned weight, and \(\hat\alpha\) (alpha) is an intercept. The weights are chosen to make the blend track the true prices as closely as possible **on the honest columns**:

\[ (\hat\alpha, \hat w) \;=\; \arg\min_{\alpha,\, w}\; \sum_{i=1}^{n} \Big( y_i - \alpha - \sum_{m=1}^{M} w_m Z_{im} \Big)^{2} . \]

In words: \(y_i\) is car \(i\)'s true sale price, the inner sum is the blend's quote for it built from out-of-fold predictions, and \(\arg\min\) means "the intercept and weights that make the total squared miss smallest." That is precisely what `lm` computed in the last step.

The **Super Learner** (van der Laan, Polley and Hubbard, 2007) is this recipe with two amendments. First, the weights must form a fair committee: \(w_m \ge 0\) and \(\sum_m w_m = 1\), a combination called **convex weights**, with no intercept, so each weight reads directly as a share of trust and the blend can never leave the range of its members' opinions. One corner of that committee is worth naming: put weight 1 on the single learner with the best out-of-fold score and you get the **discrete Super Learner**, so "just pick the CV winner" is itself a special case of stacking. Second, the theory: the **oracle inequality**, which guarantees that as the dataset grows, the Super Learner performs essentially as well as the best weighted combination you could have picked with hindsight, including the best single learner. Fit the constrained weights with `optim`; we route each weight through `exp` so all stay positive, then divide by their sum so they total exactly 1:

```r
sl_rmse <- function(b) {                 # b: three free numbers -> a fair committee
  w <- exp(b) / sum(exp(b))              # all positive, summing to exactly 1
  rmse(train$price, as.matrix(oof) %*% w)
}
opt <- optim(c(0, 0, 0), sl_rmse)
w <- exp(opt$par) / sum(exp(opt$par))
round(setNames(w, names(oof)), 2)
#> linear   tree    svm 
#>   0.18   0.31   0.51 
round(rmse(test$price, as.matrix(p_test) %*% w), 3)
#> [1] 1.238
```

Half the trust goes to the SVM, a third to the tree, and a sixth to the straight line that once quoted a negative price: a flawed model still earns a seat when its errors disagree with the committee's. On these 60 cars the constrained blend (1.238) gives back a little of the unconstrained stack's 1.189, mostly because the intercept there also corrected a small shared bias. So why accept the constraint? **Stability.** With three genuinely different learners, unconstrained `lm` is safe. Stack fifteen highly correlated learners and unconstrained coefficients start chasing noise: two near-identical models can receive weights like +14 and -13.6 that cancel beautifully on the training columns and explode on new data. Breiman documented this in 1996: non-negativity is what made stacked regressions reliable. The constraint is a seatbelt you do not feel until the crash.

=== step === tryit
::eyebrow Your turn
## Keep the tree honest

The single most important line in this lesson is a subset. Below, the loop that rebuilds the tree's out-of-fold column is missing it: as written, nothing says fold `k` must stay out of the training rows. `K`, `fold`, `oof`, `train` and `rmse` are still in your session. Fill the blank so each fold's cars are predicted by a tree that never saw them; run mentally first, then check.

```r
for (k in 1:K) {
  tr <- train[____, ]              # <- the honesty of the whole stack lives here
  te <- which(fold == k)
  oof$tree[te] <- predict(rpart(price ~ age + km, data = tr,
                                cp = 0.001, minsplit = 5), train[te, ])
}
round(rmse(train$price, oof$tree), 3)
```
::check {"regex":"fold *!= *k","gate":true,"difficulty":"intermediate","ok":"That comparison is the entire integrity of stacking: fold k is predicted only by a tree that never trained on it, and the honest 1.514 reappears.","no":"Keep every row whose fold label is NOT k, which in R is train[fold != k, ]. Training on all the rows lets the tree predict cars it has memorized, and the flattering 1.019 sneaks back into the meta-learner."}
::solution
```r
for (k in 1:K) {
  tr <- train[fold != k, ]         # rows from every fold except k
  te <- which(fold == k)
  oof$tree[te] <- predict(rpart(price ~ age + km, data = tr,
                                cp = 0.001, minsplit = 5), train[te, ])
}
round(rmse(train$price, oof$tree), 3)
#> [1] 1.514
```

=== step === concept
::eyebrow In practice
## When stacking breaks, and the production tools

Stacking is not free, and it is not always the answer. Four ways it earns less than the headline, and one way it silently fails:

- **Compute, not statistics.** A stack of \(M\) learners with \(K\) folds costs \(K \times M\) fits plus \(M\) final refits: our 3-learner, 5-fold stack fit 18 models. Trivial here; painful when one base learner takes an hour.
- **Very few rows.** The out-of-fold columns are themselves estimates. On tiny datasets they are noisy, and the meta-learner starts overfitting *them*. Keep the committee small and constrained, or settle for the simple average.
- **Clones add nothing.** Step 3's formula is blunt: the shared error \(\rho\sigma^2\) never averages away. Stacking five random forests that differ only by seed buys almost nothing; diversity of *family* (linear, tree, kernel) is what lowers \(\rho\).
- **One dominant model.** When a single learner is far ahead of the rest, the weights collapse onto it and the stack matches it at 18 times the cost. The scoreboard tells you before you ship.
- **Leakage wears disguises.** The try-it fixed the visible leak, but any preprocessing that saw all the rows (imputation, target encoding, feature selection) re-opens it from inside the fold loop. The rule: everything a base learner learns from data must be re-learned inside each fold.

| Situation on the lot | Verdict |
|---|---|
| Several strong models from different families | Stack them; expect a small, consistent win |
| One model far ahead of the rest | Weights collapse onto it; stacking adds cost, not accuracy |
| Very few rows | Convex weights and few learners, or keep the simple average |
| Every point of accuracy is money | A stack is the standard finish |

In production you rarely hand-roll the loop. Two mature wrappers do it for you, shown here to run on your own machine:

```r-static
# The classic: the SuperLearner package (run locally)
library(SuperLearner)
sl <- SuperLearner(Y = train$price, X = train[, c("age", "km")],
                   SL.library = c("SL.glm", "SL.rpart", "SL.svm"),
                   cvControl  = list(V = 5))
sl$coef    # convex blend weights, learned exactly as in this lesson
```

```r-static
# The tidymodels route: stacks (run locally)
library(stacks)
car_stack <- stacks() |>
  add_candidates(lin_res) |>      # each *_res: a tuned workflow with saved OOF predictions
  add_candidates(tree_res) |>
  add_candidates(svm_res) |>
  blend_predictions() |>          # penalized non-negative weights; many drop to zero
  fit_members()                   # refit the surviving members on all the training data
```

Both do what you just did by hand: out-of-fold columns, a constrained meta-learner, full refits for deployment. You now know which line inside them is load-bearing.

=== step === quiz
::eyebrow Check yourself
## A guarantee, read correctly

Priya's manager skims the Super Learner paper and announces: "There is an oracle guarantee. So the stack is mathematically certain to beat the SVM on next quarter's cars; ship it and stop monitoring." Which reading of the theory is right?

::quiz {"correct":2,"gate":true,"difficulty":"advanced"}
- The manager is right about the guarantee but wrong to stop monitoring: the oracle inequality ensures the stack beats every base learner on any test set, but drift could still change which base model is best ::no The inequality promises no win on any given test set at all, drift or none. It is an asymptotic statement about matching the best weighted blend as data grows; on one quarter of cars the stack can lose to a base learner through ordinary sampling luck.
- Neither claim holds: the oracle result says that as data grows the Super Learner does essentially as well as the best weighted blend chosen with hindsight; on any single test set it can still lose to a base model, and next quarter's cars may not play by the training ledger's rules ::ok Exactly. It is a "you will not regret blending in the long run" theorem, not a per-quarter certificate. In practice the stack usually edges ahead, as ours did, but the learned trust shares assume the world that produced the training data, so monitoring stays.
- The guarantee only fails here because lm was the meta-learner; with proper non-negative weights the stacked model can no longer lose to any base learner on any dataset ::no The constraint buys stability, not certainty. A convex committee does contain every single learner (weight 1 on one member), so "pick the best" is inside what it optimizes over, but the guarantee is still asymptotic: our constrained blend beat the SVM 1.238 to 1.289 on this exam as a result, not as a law.

=== step === concept
::eyebrow Go deeper
## References

Five places to take stacking further, in reading order:

- [Wolpert (1992), "Stacked Generalization", Neural Networks 5(2)](https://www.sciencedirect.com/science/article/abs/pii/S0893608005800231) - the paper that named the idea; its "cross-validation partition" is exactly the out-of-fold loop you built.
- [Breiman (1996), "Stacked Regressions", Machine Learning 24](https://link.springer.com/article/10.1007/BF00117832) - short and readable; where the non-negativity constraint earned its keep on real regressions.
- [van der Laan, Polley and Hubbard (2007), "Super Learner"](https://pubmed.ncbi.nlm.nih.gov/17910531/) - the oracle inequality and the name; the statistical backbone of this lesson.
- [The SuperLearner package on CRAN](https://cran.r-project.org/package=SuperLearner) - the reference implementation; its vignette runs this lesson's workflow with dozens of ready-made wrappers.
- [stacks: tidymodels model stacking](https://stacks.tidymodels.org/) - the modern tidymodels route; the Getting Started article stacks tuned workflows exactly like our three.

=== step === complete
## Lesson 5 complete

You watched three good models each be the fool somewhere different, measured that disagreement with an error-correlation matrix, and saw an unweighted average already beat the best single model. Then you met the trap: a meta-learner trained on in-sample predictions handed 0.85 of the vote to a memorizing tree and lost to the plain average. Cross-validation, repurposed as a factory for honest out-of-fold predictions, fixed the inputs, and the same one-line meta-learner beat everything on the final exam. You formalized the blend in one equation, constrained it into a Super Learner committee with real shares of trust, learned why the discrete Super Learner makes "pick the CV winner" a special case, and read the oracle guarantee at its true strength: blend and you will not regret it in the long run.

Next, Lesson 6: Bayesian Optimization for Hyperparameters. This lesson took the deep tree's settings on faith, and a grid search over them would cost one full fit per candidate. Lesson 6 spends those fits the smart way: a Gaussian process (Lesson 4's tool) stands in for the expensive fit, and an acquisition function decides which setting deserves the next try.
