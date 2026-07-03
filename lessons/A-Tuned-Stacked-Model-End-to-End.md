---
title: "Advanced Supervised Learning Lesson 8: A Tuned Stacked Model End to End"
catalog_blurb: "Tune, stack and honestly evaluate several models as one complete pipeline."
description: "Build one honest ML pipeline in R: tune an SVM, a Gaussian process and a random forest, stack them with convex weights, and evaluate on a sealed test set."
keywords: "hyperparameter tuning, model selection, winner's curse, stacking, cross-validation, nested cross-validation, sealed test set, SVM, Gaussian process, random forest, R"
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
## A Tuned Stacked Model End to End

In Lesson 7 you gave a music service its "More like this" shelf back, trading a sliver of exactness for a thousand-fold speedup. That closed the last gap in the toolbox. This final lesson opens the whole toolbox at once: kernels, Gaussian processes, forests, stacking, honest tuning, and assembles them into the thing you actually ship, one pipeline whose final number you would bet money on.

Priya is back at the used-car lot from Lesson 5, and this time the dealership hands her the full ledger: 900 cars of every brand tier, not 240 hatchbacks. Her Lesson 5 stack had a known weakness, every base model ran on factory-default dials. Today she tunes each family properly, stacks the tuned members, and reports one number to her manager. The danger is that each of those steps offers a tempting shortcut that quietly poisons the final number, and the shortcuts look identical to the honest moves until you grade them.

By the end of this lesson you will be able to:

- Explain the winner's curse: why the best score found by trying many settings flatters you, and why trying MORE settings makes the flattery worse
- Tune three different model families with one honest recipe: cross-validated grids for the SVM and the Gaussian process, out-of-bag error for the forest, every choice made inside the training cars
- Assemble the tuned stack end to end: out-of-fold columns, convex trust shares, final refits, and the two-stage prediction path
- Say exactly which of the pipeline's numbers you promise, and why every other number was spent the moment it picked a winner

**Prerequisites:** [Stacking and the Super Learner](Stacking-and-the-Super-Learner.html) (this lesson reuses its machinery wholesale), [Kernel SVMs](Kernel-SVMs-and-the-Kernel-Trick.html) (cost and gamma), [Gaussian Processes for Regression](Gaussian-Processes-for-Regression.html) (the lengthscale), [k-fold cross-validation](Cross-Validation-Strategies.html), and the [random forest course](RF-Course-Lesson-3.html) (mtry and out-of-bag error).

The whole lesson is four moves, in an order that never bends:

::widget process-flow {"steps":[{"title":"Seal the exam","sub":"lock 300 cars away before any decision is made"},{"title":"Tune inside the training cars","sub":"cross-validated grids for the SVM and GP, out-of-bag for the forest"},{"title":"Stack the tuned members","sub":"out-of-fold columns, convex trust shares, final refits"},{"title":"Sit the exam once","sub":"one honest number, promised and then retired"}]}

=== step === concept
::eyebrow The full lot
## Nine hundred cars and a sealed envelope

Lesson 5 priced 240 hatchbacks using two facts per car. The full ledger is a richer world: 900 cars, four facts each. **age** in years, **km** driven in thousands, the **brand tier** (budget, mid or premium), and the number of recorded **accidents**. Price is in thousands of dollars, so an error of 1.0 is a thousand-dollar miss. As in Lesson 5 we write the ledger ourselves, because knowing the truth lets us grade every shortcut later: premium brands start higher and depreciate slower, each recorded accident knocks 15 percent off whatever the car would have fetched, old high-mileage cars drop off the scrap cliff, and cars under 18 months carry a small showroom premium. A thousand dollars of noise stands in for everything a ledger cannot see.

```r
library(e1071)          # the SVM (Lesson 2)
library(kernlab)        # the Gaussian process (Lesson 4)
library(randomForest)   # the forest (the random forest course)
library(ggplot2)

set.seed(42)
n    <- 900
age  <- round(runif(n, 0.5, 12), 1)                     # years on the road
km   <- round(age * runif(n, 6, 14) + runif(n, 0, 15))  # thousand km, grows with age
tier <- sample(c("budget", "mid", "premium"), n, TRUE)
accidents <- rbinom(n, 2, 0.15)                         # recorded accidents, mostly 0
rate <- c(budget = 0.20, mid = 0.15, premium = 0.11)[tier]  # premium fades slowest
mult <- c(budget = 0.75, mid = 1.00, premium = 1.35)[tier]  # ...and starts highest
price <- (3 + 26 * exp(-rate * age) * mult - 0.015 * km) * 0.85^accidents +
         ifelse(age > 8 & km > 100, -3, 0) +            # the scrap-value cliff
         ifelse(age < 1.5, 3, 0) +                      # the nearly-new premium
         rnorm(n, 0, 1)                                 # what no ledger records
lot <- data.frame(age, km, tier = factor(tier), accidents,
                  price = round(pmax(price, 0.3), 2))
head(lot, 4)
#>    age km    tier accidents price
#> 1 11.0 87 premium         0 10.54
#> 2 11.3 76  budget         1  2.40
#> 3  3.8 41 premium         0 25.63
#> 4 10.1 76  budget         1  4.05
```

An 11-year premium car with 87,000 km still fetched 10,540 dollars; the 11.3-year budget car right below it, one accident on file, went for 2,400. Tier bends the whole depreciation curve and accidents multiply it: interactions everywhere, exactly the terrain where different model families draw genuinely different shapes.

Before anyone touches a dial, one move decides whether every number that follows can be trusted. Priya seals 300 cars in an envelope: the **test set**, her final exam. State the rule of the whole lesson as an invariant: **every learned choice, every dial, fold and trust share, is computed from the 600 training cars alone.** The envelope is opened once, at the very end, to grade the finished pipeline.

```r
set.seed(101)
test_id <- sample(n, 300)
train <- lot[-test_id, ]             # 600 cars: every decision happens here
test  <- lot[test_id, ]              # 300 cars: sealed until the last step
rmse  <- function(actual, pred) sqrt(mean((actual - pred)^2))
c(train = nrow(train), test = nrow(test))
#> train  test 
#>   600   300
```

RMSE (root mean squared error) is the typical size of a quote's miss, in thousands of dollars, the same yardstick as Lesson 5. The interactive below shows the split and its cardinal sin: flip the leak switch and watch what a score turns into when information the model should never have seen sneaks past the boundary.

::widget data-split {}

[KEY INSIGHT]
A test set does not measure a model. It measures a model that was never, in any way, chosen because of it. Break that once and the envelope is just more training data wearing a costume.

=== step === concept
::eyebrow The trap
## Tune against one slice and the score starts lying

Each model family Priya wants on the lot carries **hyperparameters**: dials the fit cannot set for itself, because they control what kind of fit is attempted in the first place. The SVM's cost and gamma (Lesson 2), the Gaussian process's lengthscale (Lesson 4), the forest's mtry (the forest course). Someone has to choose them, and the only way to choose is to try settings and score them.

Her first instinct is tidy enough. Set aside 60 of the 600 training cars as a **validation slice** (the sealed 300 stay sealed, she knows that much), fit every candidate on the other 540, keep whichever candidate misses the 60 by the least. Here are 40 random dial settings for the SVM, judged exactly that way:

```r
set.seed(22)
val_id <- sample(nrow(train), 60)
fit_tr <- train[-val_id, ]           # 540 cars the candidates fit on
val    <- train[val_id, ]            # ONE 60-car slice does all the judging

set.seed(11)
cand <- data.frame(cost  = round(4^runif(40, 0, 3), 1),      # 1 to 64
                   gamma = round(10^runif(40, -2.3, 0), 4))  # 0.005 to 1
val_score <- sapply(1:40, function(j) {
  m <- svm(price ~ ., data = fit_tr, cost = cand$cost[j], gamma = cand$gamma[j])
  rmse(val$price, predict(m, val))
})
cbind(cand, val = round(val_score, 3))[which.min(val_score), ]
#>    cost  gamma  val
#> 35 29.4 0.7235 1.13
```

Candidate 35 misses the slice by 1,130 dollars a car, comfortably the best number anyone has seen on this lot. Priya is ready to celebrate. Look at the winning dials first, though: gamma 0.72 is the spiky, memorizing end of Lesson 2's dial, the setting that draws islands around individual cars. Why would the judging crown a memorizer?

Because of what a 60-car score actually is. Write candidate \(j\)'s honest quality as \(R_j\), the RMSE it would earn on unlimited future cars. The slice reports \(\hat{R}_j = R_j + \varepsilon_j\), where \(\varepsilon_j\) (epsilon) is sampling noise from those particular 60 cars, sometimes up, sometimes down. Selection keeps the smallest reported score among the \(J\) candidates tried, and the smallest is biased:

\[ \mathbb{E}\Big[\min_{j \le J} \hat{R}_j\Big] \;<\; \min_{j \le J} R_j \quad \text{whenever the noise has any spread.} \]

In words: the expected best-reported score sits below the best true quality, because the min operator hunts through all \(J\) candidates for the luckiest downward noise, and the more candidates you try, the luckier the luckiest one gets. Auction theorists call this arithmetic the **winner's curse**: the winning bid tends to come from whoever most overestimated the prize. Here the prize is a pretty validation score, and candidate 35 overbid.

We built this world, so we can do something Priya must not: grade candidates against the sealed 300 without consequence (for her, even one peek would spend the exam). Here is what the search promised versus what it would have delivered, as it tried more candidates:

```r
curse <- t(sapply(c(5, 10, 20, 40), function(J) {
  b <- which.min(val_score[1:J])     # the winner after J tries
  m <- svm(price ~ ., data = fit_tr, cost = cand$cost[b], gamma = cand$gamma[b])
  c(tried = J, promised = round(val_score[b], 3),
    delivered = round(rmse(test$price, predict(m, test)), 3))
}))
curse
#>      tried promised delivered
#> [1,]     5    1.291     1.276
#> [2,]    10    1.153     1.338
#> [3,]    20    1.153     1.338
#> [4,]    40    1.130     1.448
```

Read it row by row, because this table is the reason the lesson exists. After 5 tries the promise was roughly honest: 1.291 promised, 1.276 delivered. Every "improvement" after that was the search digging into the slice's noise. The promise fell to 1.130 while the model Priya would actually ship got worse at every step, ending at 1.448. Trying more candidates made the report prettier and the product worse, simultaneously.

You have met this shape before. It appears whenever one signal is optimized against for long enough: the optimized signal keeps falling while the truth bottoms out and climbs away. Below, the optimized signal is training error over boosting rounds and the truth is validation error; in Priya's table the optimized signal was the slice score over candidates tried, and the truth was the exam. Slide the stopping point and watch the curves part company.

::widget learning-curve {}

[KEY INSIGHT]
A score you optimize against stops being a measurement. The slice never changed; what changed is how hard the search leaned on its noise. Every yardstick in this pipeline gets used for one decision and then retired, and the sealed exam is used exactly once, ever.

=== step === quiz
::eyebrow Check yourself
## Two hundred candidates later

A colleague sees Priya's table, shrugs, and scores 200 random dial settings against the same 60-car slice. The best validation RMSE drops to 1.05, the prettiest number yet, and he announces that the model has improved. Has it?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Yes: 200 candidates search the dial space more thoroughly than 40, so the winner should be genuinely better, and the falling score confirms it ::no More candidates do cover the dial space better, and early in a search that genuinely helps. But the judge is still 60 noisy cars: past a point the search stops finding better models and starts finding luckier scores. In the table, going from 5 to 40 tries made the promise 0.16 prettier and the delivered model 0.17 worse.
- There is no evidence either way: 1.05 is the minimum of 200 noisy numbers, so it is expected to flatter, and only a yardstick nothing was optimized against can say whether this winner beats the old one ::ok Exactly. The min digs deeper into the slice's noise as candidates pile up, so a falling best-score is what you would see even if every candidate were equally good. Rejudge the finalists on data they never courted and the mirage evaporates.
- The score 1.05 is optimistic, but the ranking is still trustworthy: the top candidate of 200 is still the best model, you just should not quote its score ::no With noise this large, the top of the leaderboard is decided by luck, not merit: that is exactly how gamma 0.72, a memorizer, outranked every smooth candidate on Priya's slice. The curse corrupts the choice itself, not just the number attached to it.
- The progress is real but should be discounted: a seasoned rule of thumb is to halve the improvement and report roughly 1.10 ::no There is no fixed discount rate. How much the minimum flatters depends on how many candidates were tried and how noisy the slice is, neither of which a haircut knows. The fix is a cleaner yardstick, not a corrected lie.

=== step === concept
::eyebrow The fix
## Score every candidate on five folds, not one slice

The slice failed for two reasons: it was small, 60 cars of noise, and it was static, so every candidate got to court the same 60 cars. Cross-validation attacks both at once, with machinery you already own. Deal the 600 training cars into 5 folds. Each candidate is fit 5 times, each time on 4 folds, and scored on the fold it never saw; its report card is the average of the 5 misses. Every training car judges every candidate exactly once, and no lucky corner of the data crowns a winner alone. Step through the rotation:

::widget cv-folds {"k":5}

```r
set.seed(7)
fold <- sample(rep(1:5, length.out = nrow(train)))   # dealt once, reused all lesson

cv_rmse <- function(fit_fun) {       # fit_fun: training data in, fitted model out
  miss <- numeric(5)
  for (k in 1:5) {
    tr <- train[fold != k, ]         # fit on four folds...
    m  <- fit_fun(tr)
    miss[k] <- rmse(train$price[fold == k], predict(m, train[fold == k, ]))
  }
  mean(miss)                         # ...average the five honest misses
}

svm_grid <- expand.grid(cost = c(1, 4, 16, 64), gamma = c(0.02, 0.05, 0.1, 0.2))
svm_grid$cv <- round(sapply(1:nrow(svm_grid), function(j)
  cv_rmse(function(tr) svm(price ~ ., data = tr,
                           cost = svm_grid$cost[j], gamma = svm_grid$gamma[j]))), 3)
head(svm_grid[order(svm_grid$cv), ], 3)
#>    cost gamma    cv
#> 8    64  0.05 1.231
#> 12   64  0.10 1.246
#> 11   16  0.10 1.248
```

The steadier judging crowns cost 64 with gamma 0.05: the smooth end of the dial, fourteen times gentler than the slice's memorizing 0.72. Two practical notes on the search itself. A deliberate 16-setting grid replaces the 40 random stabs, because a steadier yardstick needs fewer, better-placed shots. And the grid is affordable only because each fit takes well under a second here; when one fit costs 25 minutes, you spend candidates the way Lesson 6 taught, with a Gaussian process choosing the next setting worth trying.

[WARNING]
The winning 1.231 is still the best of 16 numbers, so a mild winner's curse lives inside it too; fold-averaged scores just carry far less noise for the min to mine. The rule the whole lesson turns on: **a score used to choose is spent by the choosing.** 1.231 picked the SVM's dials, so 1.231 is not a number anyone promises. The promise comes from the envelope, later.

=== step === concept
::eyebrow Same recipe, other families
## Tune the Gaussian process and the forest

The recipe generalizes: pick each family's dial, walk a small grid, judge with a score no candidate can court. For the Gaussian process the dial is the **lengthscale** (Lesson 4): how far one car's price echoes across the age-km-tier space. `gausspr()` expresses it through the RBF kernel parameter \(\sigma = 1 / (2\ell^2)\), where \(\ell\) is the lengthscale after the inputs are standardized, so a BIG sigma means a short lengthscale and a wiggly fit, and a small sigma means a long, stiff one. We hold the noise dial at `var = 0.05`, saying a few percent of price variance is unlearnable noise, and walk sigma across a factor of twenty:

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

A clean U: too stiff at 0.02 (the surface cannot bend around the scrap cliff), too wiggly at 0.40 (it starts chasing the thousand-dollar noise), best at 0.10 with a cross-validated 1.249. One dial, one honest curve, done.

The forest brings its own yardstick, and it is free. Every tree trains on a bootstrap resample that leaves out roughly a third of the cars, so each car can be scored by the trees that never saw it: the **out-of-bag (OOB) error** from the forest course, cross-validation without folding anything. One forest per mtry value:

```r
set.seed(7)
oob <- sapply(1:4, function(m)
  sqrt(tail(randomForest(price ~ ., data = train, ntree = 400, mtry = m)$mse, 1)))
round(setNames(oob, paste0("mtry=", 1:4)), 3)
#> mtry=1 mtry=2 mtry=3 mtry=4 
#>  2.716  1.392  1.375  1.385
```

Sit with the first number, because it is the quiet scandal of this step. mtry is how many features each split may consider, and for regression `randomForest()` defaults to a third of them: here exactly 1 of the 4. A tree whose every split must use one randomly assigned feature keeps being handed `accidents` when the split it needs is on `age`. De-correlating the trees is the forest's whole trick, but with only four features that de-correlation costs far more tree strength than it returns. The untuned default would have shipped a 2,716-dollar typical miss; one tuned dial halves it, with mtry 3 winning by a nose over 4. And 400 trees sits comfortably past the flattening point of the OOB curve, the shape you can drag below (the forest course's churn model, same curves, different lot):

::widget oob-tuner {}

Three families, three dials, three honest yardsticks, and not one glance at the sealed 300:

| Family | Dial tuned | Judged by | Winner | Score (for choosing only) |
|---|---|---|---|---|
| SVM | cost, gamma | 5-fold CV | cost 64, gamma 0.05 | 1.231 |
| Gaussian process | lengthscale (sigma) | 5-fold CV | sigma 0.10 | 1.249 |
| Random forest | mtry | out-of-bag error | mtry 3 | 1.375 |

=== step === concept
::eyebrow The stack returns
## Honest columns for the tuned four

From here, Lesson 5 takes over with upgraded members. Four base learners: the tuned SVM, the tuned GP, the tuned forest, and plain linear regression. Keep the linear model even though you can guess it will struggle on a lot full of interactions: Lesson 5's deepest point was that a weak model with DIFFERENT mistakes can still earn a seat, and the committee, not us, should make that call. The meta-learner needs **out-of-fold predictions**, every car predicted by models that never trained on it, and we reuse the same 5 folds dealt in the grid step:

```r
set.seed(7)
oof <- data.frame(linear = rep(NA_real_, nrow(train)), svm = NA_real_,
                  gp = NA_real_, rf = NA_real_)
for (k in 1:5) {
  tr <- train[fold != k, ]
  te <- which(fold == k)
  oof$linear[te] <- predict(lm(price ~ ., data = tr), train[te, ])
  oof$svm[te]    <- predict(svm(price ~ ., data = tr,
                                cost = 64, gamma = 0.05), train[te, ])
  oof$gp[te]     <- as.numeric(predict(gausspr(price ~ ., data = tr, kernel = "rbfdot",
                                kpar = list(sigma = 0.1), var = 0.05), train[te, ]))
  oof$rf[te]     <- predict(randomForest(price ~ ., data = tr,
                                ntree = 400, mtry = 3), train[te, ])
}
round(sapply(oof, rmse, actual = train$price), 3)
#> linear    svm     gp     rf 
#>  2.199  1.240  1.259  1.410
```

The honest report card: the two kernel machines nearly tied around 1.25, the forest at 1.41, and the linear model wrecked at 2.199 by exactly the structure we built into this lot. A flat plane cannot bend a different depreciation curve for each tier, and it has no way to multiply anything by an accident count. Now the numbers that decide how much blending can pay, the error correlations:

```r
res <- train$price - oof             # each model's miss on each unseen car
round(cor(res), 2)
#>        linear  svm   gp   rf
#> linear   1.00 0.56 0.60 0.46
#> svm      0.56 1.00 0.98 0.68
#> gp       0.60 0.98 1.00 0.68
#> rf       0.46 0.68 0.68 1.00
```

::widget correlation-heatmap {"vars":["linear","svm","gp","rf"],"matrix":[[1,0.56,0.60,0.46],[0.56,1,0.98,0.68],[0.60,0.98,1,0.68],[0.46,0.68,0.68,1]]}

One matrix, three verdicts. The SVM and the GP correlate at **0.98**: they are clones. Of course they are. One draws its surface with RBF kernels around support vectors, the other with an RBF covariance; two dialects of the same smooth worldview, and tuning pushed both to the same smoothness. Lesson 5's variance formula says the shared part of the error is the floor no blend digs below, so this pair blends to almost nothing. The forest disagrees with both at 0.68: its axis-aligned staircase and its appetite for tier and accident splits make genuinely different mistakes, and that 0.68 is where the blend's gains will come from. The linear model is the most independent voice in the room at 0.46 to 0.60, but independence is not competence: its mistakes are different AND enormous. Whether that trade deserves a seat is precisely the question the meta-learner answers next.

=== step === concept
::eyebrow Open the envelope
## The blend, the refits, and the exam sat once

Lesson 5's convex committee, unchanged: route each weight through `exp` so all stay positive, divide by their sum so they total exactly 1, and let `optim()` pick the shares that make the blended out-of-fold predictions track the 600 true prices:

```r
sl_rmse <- function(b) {             # b: four free numbers -> a fair committee
  w <- exp(b) / sum(exp(b))          # all positive, summing to exactly 1
  rmse(train$price, as.matrix(oof) %*% w)
}
opt <- optim(c(0, 0, 0, 0), sl_rmse)
w <- exp(opt$par) / sum(exp(opt$par))
round(setNames(w, names(oof)), 2)
#> linear    svm     gp     rf 
#>   0.00   0.63   0.06   0.30 
round(rmse(train$price, as.numeric(as.matrix(oof) %*% w)), 3)
#> [1] 1.196
```

Three rulings the committee reached on its own. The linear model is benched at 0.00: an equal average would be forced to carry its 2,199-dollar misses, but a learned committee can simply say no. The forest, weakest of the three survivors on its own score, still holds a 0.30 seat, because disagreement is fuel, exactly as Lesson 5 promised. And the clone pair shares roughly a 0.70 seat between them. How that seat splits (0.63 against 0.06 here) is close to arbitrary: at correlation 0.98 the optimizer is choosing between near-identical columns, and handing the GP the SVM's share barely moves the blend's score on its own columns (1.196 becomes 1.206). The data pins down the seat, not which clone sits in it.

The stack that ships uses base learners refit on ALL 600 training cars (the folds existed only to write the meta-learner's honest textbook), and it predicts in two stages: each member quotes, then the committee blends the quotes. Time to open the envelope. It is opened once, to grade the finished pipeline; while it is open we also grade the also-rans, an author's privilege that shows what each earlier decision was worth:

```r
m_lin <- lm(price ~ ., data = train)
m_svm <- svm(price ~ ., data = train, cost = 64, gamma = 0.05)
m_gp  <- gausspr(price ~ ., data = train, kernel = "rbfdot",
                 kpar = list(sigma = 0.1), var = 0.05)
set.seed(7)
m_rf  <- randomForest(price ~ ., data = train, ntree = 400, mtry = 3)

p_test <- cbind(linear = predict(m_lin, test), svm = predict(m_svm, test),
                gp = as.numeric(predict(m_gp, test)), rf = predict(m_rf, test))
set.seed(7)
rf_default <- randomForest(price ~ ., data = train, ntree = 400)  # untuned: mtry 1
exam <- data.frame(
  model = c("stacked blend", "tuned SVM", "tuned GP", "tuned forest", "linear",
            "equal average", "slice-tuned SVM", "default forest"),
  exam_rmse = round(c(rmse(test$price, as.numeric(p_test %*% w)),
                      rmse(test$price, p_test[, "svm"]),
                      rmse(test$price, p_test[, "gp"]),
                      rmse(test$price, p_test[, "rf"]),
                      rmse(test$price, p_test[, "linear"]),
                      rmse(test$price, rowMeans(p_test)),
                      curse[4, "delivered"],
                      rmse(test$price, predict(rf_default, test))), 3))
exam <- exam[order(exam$exam_rmse), ]
print(exam, row.names = FALSE)
#>            model exam_rmse
#>    stacked blend     1.161
#>        tuned SVM     1.222
#>         tuned GP     1.232
#>    equal average     1.278
#>     tuned forest     1.301
#>  slice-tuned SVM     1.448
#>           linear     2.409
#>   default forest     2.943
```

```r
ggplot(exam, aes(exam_rmse, reorder(model, -exam_rmse))) +
  geom_col(fill = "#1f7a55", width = 0.72) +
  geom_text(aes(label = sprintf("%.3f", exam_rmse)), hjust = -0.15, size = 3.3) +
  scale_x_continuous(limits = c(0, 3.4)) +
  labs(title = "The exam, opened once",
       subtitle = "typical miss per car on the 300 sealed cars (thousand dollars)",
       x = "test RMSE", y = NULL) +
  theme_minimal(base_size = 13)
```

Every decision in the lesson is priced on this board. The pipeline delivers **1.161**, beating the best single member (1.222) by about 61 dollars a car: stacking's usual small, reliable nose. The equal average (1.278) loses to the best single model here, unlike in Lesson 5, because it is forced to carry the linear model the committee benched. The slice-tuned memorizer costs 287 dollars a car over the honest pipeline, the winner's curse made cash. And the untuned default forest (2.943) against its tuned sibling (1.301) prices a single dial at 1,642 dollars a car.

[NOTE]
No 300 cars to spare? The honest substitute is **nested cross-validation**: an outer loop of folds wrapped around this entire recipe, grids, out-of-fold columns and blending rerun inside every outer fold, so selection never touches the outer scoring fold. It grades the recipe rather than one final model, and it costs a multiple of everything you just ran, but the logic is the same sealed envelope, rebuilt five times. Varma and Simon, in the references, measure exactly how large the optimism is when you skip it.

In production the hand-rolled loops compress into a few declarative lines; this is the same pipeline in tidymodels, to run on your own machine:

```r-static
# The production route (run locally): tune, collect out-of-fold columns, stack
library(tidymodels)
library(stacks)
folds   <- vfold_cv(train, v = 5)
svm_res <- tune_grid(svm_rbf(cost = tune(), rbf_sigma = tune(), mode = "regression"),
                     price ~ ., resamples = folds, grid = 16,
                     control = control_stack_grid())
rf_res  <- tune_grid(rand_forest(mtry = tune(), trees = 400, mode = "regression"),
                     price ~ ., resamples = folds, grid = 4,
                     control = control_stack_grid())
car_stack <- stacks() |>
  add_candidates(svm_res) |>
  add_candidates(rf_res) |>
  blend_predictions() |>     # convex weights on the out-of-fold columns
  fit_members()              # refit the surviving members on all the data
```

=== step === quiz
::eyebrow Check yourself
## Four numbers, one promise

Priya's manager wants a single number for the quarterly plan: "a typical quote will miss by about ____." The pipeline produced four candidates on its way here:

| Number | Where it came from | What it was used for |
|---|---|---|
| 1.130 | best of 40 candidates on one 60-car slice | the cautionary tale |
| 1.231 | the grid winner's 5-fold CV score | choosing the SVM's dials |
| 1.196 | the blend's score on its own out-of-fold columns | fitting the trust shares |
| 1.161 | the 300 sealed cars, touched once | nothing else, ever |

Which number does she promise?

::quiz {"correct":3,"gate":true,"difficulty":"advanced"}
- 1.196: it is cross-validated, it uses all 600 cars, and unlike the others it scores the complete stack rather than a single member ::no Those out-of-fold columns are exactly what the trust shares were optimized against, so 1.196 is an in-sample score one level up: Lesson 5's leak in a fancier costume. It answered its question, which weights to use, and was spent by the answer.
- 1.231: cross-validation is the gold standard, and this one was computed without ever touching the envelope ::no It is the smallest of 16 candidate scores, so a mild winner's curse sits inside it, and it grades one member, not the pipeline that ships. A score used to choose (it picked cost 64, gamma 0.05) is spent by the choosing.
- 1.161, and the envelope is now spent: any future promise needs cars this pipeline has never influenced ::ok Right on both halves. It is the only number in the table that no decision was optimized against, and quoting it retires it: the moment a rerun against those 300 cars influences anything, they become one more validation slice being mined.
- 1.161 for today, then re-open the envelope after each future improvement so the promise stays current ::no The second opening starts the slide: choose against the exam twice and it is just another slice. Step 3 showed where that road ends, 1.130 promised, 1.448 delivered. New promises need new cars, or nested cross-validation from scratch.

=== step === tryit
::eyebrow Your turn
## Quote Monday's first car

A 4.5-year mid-tier car with 52,000 km and a clean accident record rolls onto the lot. Priya's pipeline prices it in two stages. Stage one, every base member quotes: the refit members `m_lin`, `m_svm`, `m_gp`, `m_rf` are still in your session, as are the trust shares `w`. Stage two is yours: combine the four opinions into the one number she writes on the windshield, each opinion times its trust share, summed.

```r
new_car <- data.frame(age = 4.5, km = 52,
                      tier = factor("mid", levels = levels(lot$tier)), accidents = 0)
p_new <- c(linear = unname(predict(m_lin, new_car)),
           svm    = unname(predict(m_svm, new_car)),
           gp     = as.numeric(predict(m_gp, new_car)),
           rf     = unname(predict(m_rf, new_car)))
round(p_new, 2)
quote <- ____                    # stage two: blend the four opinions
round(quote, 2)
```
::check {"regex":"w\\s*\\*\\s*p_new|p_new\\s*\\*\\s*w|p_new\\s*%\\*%\\s*w|w\\s*%\\*%\\s*p_new","gate":true,"difficulty":"intermediate","ok":"That is the entire deployment path: four opinions, each multiplied by its learned trust share, summed. Note the linear model quoting 16.70 and the committee multiplying that opinion by 0.00: benched at prediction time too.","no":"Blend with the trust shares learned from the out-of-fold columns: each member's quote times its weight, added up, which in R is sum(w * p_new). The shares already sum to 1, so nothing else is needed."}
::solution
```r
new_car <- data.frame(age = 4.5, km = 52,
                      tier = factor("mid", levels = levels(lot$tier)), accidents = 0)
p_new <- c(linear = unname(predict(m_lin, new_car)),
           svm    = unname(predict(m_svm, new_car)),
           gp     = as.numeric(predict(m_gp, new_car)),
           rf     = unname(predict(m_rf, new_car)))
round(p_new, 2)
#> linear    svm     gp     rf 
#>  16.70  15.37  15.34  15.21 
quote <- sum(w * p_new)          # each opinion times its trust share
round(quote, 2)
#> [1] 15.32
```

The three working members agree within 160 dollars of each other. The linear model, still drawing flat planes through a curved world, asks for 1,300 more, and its 0.00 share silences it. Priya quotes 15,320 dollars, and she knows what that quote's typical miss is, because a sealed exam told her: about 1,160 dollars, measured honestly.

=== step === concept
::eyebrow Go deeper
## References

Five places to take the honest pipeline further, in reading order:

- [Cawley and Talbot (2010), "On Over-fitting in Model Selection and Subsequent Selection Bias in Performance Evaluation" (JMLR 11)](https://jmlr.org/papers/v11/cawley10a.html) - step 3's winner's curse made rigorous: why model selection overfits, how badly, and what controls it.
- [Varma and Simon (2006), "Bias in error estimation when using cross-validation for model selection" (BMC Bioinformatics 7:91)](https://bmcbioinformatics.biomedcentral.com/articles/10.1186/1471-2105-7-91) - measures the optimism of promising a tuned CV score, and shows nested cross-validation removing it.
- [Hastie, Tibshirani and Friedman, The Elements of Statistical Learning, chapter 7 (free PDF)](https://hastie.su.domains/ElemStatLearn/) - model assessment and selection: the train/validation/test contract underneath everything in this lesson.
- [stacks: tidymodels model stacking](https://stacks.tidymodels.org/) - the production route for steps 7 and 8: tuned candidates in, out-of-fold columns, penalized convex weights, member refits out.
- [Kuhn and Silge, Tidy Modeling with R](https://www.tmwr.org/) - grid search, workflow sets and resampling done end to end; chapters 10 to 15 are this lesson at industrial scale.

=== step === complete
## Lesson 8 complete

You built the whole thing, in the only order that works. A sealed exam first, before any decision. Then the demonstration that the natural way to tune, keeping the best score on one slice, promises 1.130, delivers 1.448, and gets worse the harder you search, because the minimum of noisy scores is a flatterer by construction. Then the honest recipe: five folds judging a 16-setting SVM grid (cost 64, gamma 0.05), the same folds walking the GP's lengthscale to sigma 0.10, and the forest judging itself out-of-bag, where the untuned default would have doubled the error. Then Lesson 5's machinery at full strength: out-of-fold columns for the tuned four, a correlation matrix that outed the SVM and GP as 0.98 clones and the forest as the useful dissenter, and a convex committee that benched the linear model, seated the forest at 0.30, and delivered 1.161 on the one exam ever sat, beating every member, the equal vote, and every shortcut on the board. You even know which number to say out loud, and why saying it retires it.

That completes Advanced Supervised Learning. The course opened with a straight line and the widest possible margin; it ends with margins, kernels, function distributions, committees and search strategies working as one honest pipeline. Carry the contract with you, because it travels: seal the exam, make every choice inside the training data, spend each score on one decision, and promise only the number nothing was optimized against. The models will keep changing. The envelope rule never does.
