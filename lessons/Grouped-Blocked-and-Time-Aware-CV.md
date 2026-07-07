---
title: "Model Evaluation Lesson 2: Grouped, Blocked, and Time-Aware CV"
catalog_blurb: "Resample grouped or time-ordered data so your accuracy score stays honest."
description: "Grouped, blocked and time-aware cross-validation in R: why random k-fold leaks and flatters your score when rows share a group or sit in time order, and how to resample honestly."
keywords: "grouped cross-validation, time series cross-validation, blocked cross-validation, rolling origin, group k-fold, data leakage, resampling, rsample, model evaluation, R"
post_type: "LESSON"
curriculum_id: "6.70.2"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-evaluation-tuning"
course_title: "Model Evaluation and Tuning in R"
course_lesson: "2"
course_total: "7"
course_landing: "R-Model-Evaluation-Course.html"
course_next: "Nested-Cross-Validation.html"
course_prev: "Cross-Validation-Strategies.html"
---

=== step === cover
::eyebrow Lesson 2 of 7
## Grouped, Blocked, and Time-Aware CV

In Lesson 1 you took the luck out of a model's score: k-fold cross-validation rotates the holdout so every row is tested once, then averages for a steady number you can trust.

That trick has a hidden assumption, and when it breaks it breaks quietly. Meet **Bean Theory**, a small coffee chain. Their model predicts a café's daily cups sold, and 5-fold cross-validation gave it a rock-steady error of about 4.7 cups. Everyone was happy, until they opened a new café and the same model was off by 15. Nothing was wrong with the model. Something was wrong with the folds.

By the end of this lesson you will be able to:

- Explain why random k-fold reports a dishonest, too-good score when rows are grouped or time-ordered
- Build grouped folds that keep each group (each café) entirely in train or validation
- Build time-aware folds that always train on the past and validate on the future

**Prerequisites:** you finished [Lesson 1 on cross-validation](Cross-Validation-Strategies.html), you can fit a model with `lm()` and call `predict()`, and you have met the idea of [data leakage](Train-Validation-Test-and-Data-Leakage.html). Flip the switch below to see leakage in action, the exact trap this lesson defuses.

::widget data-split {}

=== step === concept
::eyebrow The hidden assumption
## The hidden assumption in k-fold

k-fold cross-validation shuffles the rows and deals them into folds at random. That shuffle only makes sense if the rows are **independent and interchangeable**: any row is as good as any other to hold out, and knowing one row tells you nothing special about another.

Huge amounts of real data quietly violate that. Two patterns come up again and again:

- **Grouped rows.** Many rows belong to the same underlying thing: 20 days of sales from the *same* café, 12 visits from the *same* patient, 100 clicks from the *same* user. Rows inside a group are alike, so a random shuffle scatters copies of the same group across every fold.
- **Time-ordered rows.** Rows arrive in sequence, and the future depends on the past: yesterday's sales predict today's. A random shuffle mixes future and past together, letting the model learn from days that, in real life, had not happened yet.

The widget below is ordinary random k-fold: it deals the rows into folds and rotates which one is held out. It is exactly the right tool when rows really are interchangeable, and exactly the wrong one when they are not. Watch it rotate, then hold that picture in mind as we feed it data that is *not* interchangeable.

::widget cv-folds {}

=== step === concept
::eyebrow The trap
## A score that looks too good

Let us make Bean Theory concrete. Six cafés, 20 days of cups sold each, 120 rows in all. Every café has its own steady daily level, some are busy, some are quiet, plus day-to-day noise. We build the data right here, because each lesson runs in a fresh R session.

```r
# Bean Theory: 6 cafes, 20 days of cups sold each. Each cafe has its own level.
set.seed(1)
cafes <- c("Rowan St", "Dockside", "Maple Ave", "Harbor", "Elm", "Quay")
level <- c(58, 84, 41, 72, 50, 66)          # each cafe's own average daily cups (hidden)
names(level) <- cafes

bean <- do.call(rbind, lapply(cafes, function(cf) {
  data.frame(cafe = cf, cups = round(level[[cf]] + rnorm(20, 0, 5)))
}))
bean$cafe <- factor(bean$cafe, levels = cafes)
table(bean$cafe)                             # 20 rows per cafe
#>
#>  Rowan St  Dockside Maple Ave    Harbor       Elm      Quay
#>        20        20        20        20        20        20
```

Our model is the simplest thing that uses the group: predict a day's cups by that café's *average* cups in the training rows. "Fitting" just means computing each café's average; "predicting" means looking up the café. Now score it with plain random 5-fold cross-validation.

```r
# "Fit" = each cafe's average cups in the training rows; "predict" = look up the cafe.
cafe_rmse <- function(train, valid) {
  mu       <- tapply(train$cups, train$cafe, mean)   # each cafe's training average
  fallback <- mean(train$cups)                        # used only if a cafe is unseen in training
  pred     <- mu[as.character(valid$cafe)]
  pred[is.na(pred)] <- fallback
  sqrt(mean((valid$cups - pred)^2))                   # RMSE, in cups
}

set.seed(2)
fold   <- sample(rep(1:5, length.out = nrow(bean)))   # random fold labels, 120 rows shuffled
random <- numeric(5)
for (f in 1:5) random[f] <- cafe_rmse(bean[fold != f, ], bean[fold == f, ])
round(mean(random), 2)                                 # random 5-fold CV error
#> [1] 4.74
```

An error of **4.74 cups**. That is right at the floor set by the day-to-day noise we baked in (an SD of 5), the best any model could hope for, so it looks almost perfect. It is not.

[WARNING]
Read what the random split actually did. Because the shuffle scatters each café's 20 days across all five folds, *every fold's training set already contains days from every café*. The model never has to predict a café it has not seen, it just looks up an average it memorized from that café's other days. The score measures memory, not the thing we care about: how well the model does on a **new** café.

=== step === concept
::eyebrow The fix
## Grouped CV: keep each group whole

If the question is "how well will this do on a café we have not opened yet?", then the validation set has to *be* a café the model never trained on. That is grouped cross-validation: instead of shuffling rows, you hold out **whole groups**. With six cafés, hold out one café at a time, train on the other five, and predict the held-out café cold. This is leave-one-group-out (the group version of leave-one-out from Lesson 1).

Write the groups as \(g = 1, 2, \dots, G\) (here \(G = 6\) cafés). Let \(\mathcal{D}_g\) be all the rows in group \(g\), and let \(f^{(-g)}\) be the model trained on every group *except* \(g\). Grouped CV holds out one whole group at a time and averages the error \(L\) across all of them:

\[ \mathrm{CV}_{\text{group}} = \frac{1}{G}\sum_{g=1}^{G} L\!\left(f^{(-g)},\ \mathcal{D}_g\right) \]

Each café is scored exactly once, as a café the model has never met, which is the situation you are genuinely in when a new location opens.

```r
# Grouped CV: hold out one WHOLE cafe at a time (leave-one-cafe-out).
grouped <- numeric(length(cafes))
for (i in seq_along(cafes)) {
  hold       <- cafes[i]
  grouped[i] <- cafe_rmse(bean[bean$cafe != hold, ],   # train on the other five cafes
                          bean[bean$cafe == hold, ])   # score the held-out cafe cold
}
round(grouped, 2)          # error for each cafe when it is the new one
#> [1]  6.03 26.34 25.20 13.05 14.85  6.41
round(mean(grouped), 2)    # grouped CV error
#> [1] 15.32
```

**15.32 cups**, more than three times the flattering 4.74. *This* is the number Bean Theory actually gets on a new café, and it is the honest one. Notice the per-café errors: Dockside (the busiest) and Maple Ave (the quietest) are punished hardest, because predicting a distinctive café as "just an average café" misses by the most. The middle-of-the-pack cafés barely suffer.

[KEY INSIGHT]
The right cross-validation mirrors the real prediction task. If you will deploy to new groups, validate on held-out groups. If group identity leaks into training, the score answers a question you never asked.

One limit to respect: grouped CV can only make as many folds as you have groups, and each fold must have enough groups left to train on. Six cafés is thin; leave-one-out is fine here, but with two or three groups a grouped estimate is too wobbly to trust.

=== step === quiz
::eyebrow Check yourself
## Why did the first score lie?

Random 5-fold gave 4.74 cups; grouped CV gave 15.32 on the same data and the same model. Why was the random number so much lower?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Random folds put some days from every café into every training set, so the model only ever looked up a café it had already memorized, never predicting a new one ::ok Exactly. The leak is that group identity crossed the fold boundary. Each café appeared in both training and validation, so the model was graded on memory, not on generalizing to a new café.
- Grouped CV makes only 6 folds instead of 5, so its average is just noisier and happens to be higher ::no Fold count is not the culprit: 5 versus 6 folds would nudge the average, not triple it. The jump is the task changing from a café the model has seen to one it has not.
- Grouped CV trains on less data, so its model is weaker and scores worse ::no Training on five cafés instead of a shuffled 80% is a tiny data difference and would not triple the error. The error tripled because the task changed from a seen café to an unseen one.

=== step === tryit
::eyebrow Your turn
## Hold out a whole café

The heart of grouped CV is the split: the validation set is *every* row of the held-out café, and the training set is *every* row that is not. Fill in the blank so `train` holds all rows that are NOT the held-out café.

```r
# Fill the blank: train on every cafe EXCEPT the held-out one.
hold  <- "Dockside"
valid <- bean[bean$cafe == hold, ]     # the held-out cafe (all its rows)
train <- bean[bean$cafe ____ hold, ]   # everything EXCEPT that cafe
c(train = nrow(train), valid = nrow(valid))
```
::check {"regex":"!=\\s*hold","gate":true,"difficulty":"beginner","ok":"That is it: bean$cafe != hold keeps every row whose cafe is not the held-out one, so no Dockside row can leak into training.","no":"You want the complement of the held-out cafe. Use != (not ==): bean$cafe != hold keeps every row that is NOT Dockside."}
::solution
```r
hold  <- "Dockside"
valid <- bean[bean$cafe == hold, ]
train <- bean[bean$cafe != hold, ]
c(train = nrow(train), valid = nrow(valid))
#> train valid
#>   100    20
```

=== step === concept
::eyebrow The other kind of dependence
## Time order: never train on the future

Grouping is one way rows stop being interchangeable. **Time** is the other. Let us follow a single café, Dockside, day by day for four months, 120 days of a slowly rising trend plus a weekend bump and noise.

```r
# One cafe over time: 120 days, a rising trend + a weekend bump + noise.
set.seed(3)
n       <- 120
day     <- 1:n
weekend <- as.integer(day %% 7 %in% c(6, 0))
cups    <- 55 + 0.6 * day + 12 * weekend + rnorm(n, 0, 4)
dock    <- data.frame(day = day, weekend = weekend, cups = round(cups))
head(dock, 3)
#>   day weekend cups
#> 1   1       0   52
#> 2   2       0   55
#> 3   3       0   58
```

Now score a forecasting model (a random forest on the day number and weekend flag) with plain random 5-fold. Watch it flatter us again.

```r
# Random 5-fold on time-ordered data: past and future days both land in training.
suppressPackageStartupMessages(library(randomForest))
set.seed(4)
fold    <- sample(rep(1:5, length.out = n))
rand_ts <- numeric(5)
for (f in 1:5) {
  tr         <- dock[fold != f, ]
  va         <- dock[fold == f, ]
  fit        <- randomForest(cups ~ day + weekend, data = tr)
  rand_ts[f] <- sqrt(mean((va$cups - predict(fit, va))^2))
}
round(mean(rand_ts), 2)     # random 5-fold error
#> [1] 7.97
```

**7.97 cups.** But look at what the random shuffle allowed: to predict day 50, the model was allowed to train on days 49 and 51. It interpolates between neighbours that surround the target in time. In a real forecast you never have that, tomorrow has no "day after" to lean on yet. The random score is measuring a task you will never actually face.

The k-fold widget below rotates the holdout just as before. The problem is not the rotation, it is *which* rows a fold is allowed to hold out. For ordered data, a fold must be a slice of time, not a random scatter.

::widget cv-folds {"k":5}

=== step === concept
::eyebrow The time-aware fix
## Rolling-origin cross-validation

The honest rule for ordered data is simple: **always train on the past, validate on the future.** Pick a cut-off day, train on everything up to it, and test on the days that come next. Then roll the cut-off forward and repeat. This is called rolling-origin (or forward-chaining, or time-series) cross-validation, and because each validation block is a contiguous chunk of time it is one form of **blocked** CV.

Order the rows by time and write each row's timestamp as \(\tau_i\). Pick cut-off points (origins) \(t_1 < t_2 < \dots < t_m\). At origin \(t_j\) the model \(f^{(\le t_j)}\) trains only on the past, \(\{\,i : \tau_i \le t_j\,\}\), and is scored on a future window of width \(h\), \(\{\,i : t_j < \tau_i \le t_j + h\,\}\):

\[ \mathrm{CV}_{\text{time}} = \frac{1}{m}\sum_{j=1}^{m} L\!\left(f^{(\le t_j)},\ \{\,i : t_j < \tau_i \le t_j + h\,\}\right) \]

The training window sits *entirely before* the validation window, so the model can never peek at the future.

```r
# Time-aware CV: train on the PAST up to each cut-off, forecast the next 10 days, roll forward.
origins <- c(70, 80, 90, 100, 110)
time_cv <- numeric(length(origins))
for (j in seq_along(origins)) {
  cut        <- origins[j]
  tr         <- dock[dock$day <= cut, ]                       # everything up to today
  va         <- dock[dock$day > cut & dock$day <= cut + 10, ] # the next 10 days (the future)
  fit        <- randomForest(cups ~ day + weekend, data = tr)
  time_cv[j] <- sqrt(mean((va$cups - predict(fit, va))^2))
}
round(time_cv, 2)          # error at each rolling origin
#> [1] 12.40 14.83 14.65 16.83 17.67
round(mean(time_cv), 2)    # time-aware CV error
#> [1] 15.28
```

**15.28 cups**, nearly double the random split's 7.97, and it *climbs* as the origin moves later (12.40 up to 17.67). That climb is the real lesson: a tree-based model cannot predict values higher than any it trained on, so as the rising trend carries sales past everything it has seen, the forecast falls further behind. Random k-fold hid that completely by always giving the model a future day to interpolate from.

[NOTE]
Rolling-origin comes in two flavours. **Expanding window** keeps all history in training (what we did: `day <= cut`). **Sliding window** keeps only the most recent stretch (`day > cut - w & day <= cut`), which is better when old patterns go stale. Both always put the validation block in the future.

=== step === quiz
::eyebrow Check yourself
## Which split is honest?

You are forecasting next quarter's demand from three years of daily sales, and you want a cross-validation score you can actually promise the business. Which resampling scheme gives an honest estimate?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Random k-fold, because it uses every day for validation exactly once and averages away the luck ::no Random k-fold drops future days into the training set for a past validation day, which is exactly the look-ahead leak. Using every day once does not undo training on the future.
- Rolling-origin CV that trains only on days before each cut-off and validates on the days after ::ok Right. Training always sits before validation, so the model is scored the way it will really be used: forecasting the future from the past. It is the only option here without look-ahead leakage.
- Leave-one-out CV, because holding out a single day is the smallest possible leak ::no Holding out one day still lets the other 1,094 days, many of them after the held-out day, into training. Size of the holdout is not the issue; direction of time is. LOOCV still trains on the future.

=== step === concept
::eyebrow In practice
## Match the scheme to your data

You now have the whole decision. Before you resample, ask what makes your rows *not* interchangeable, and pick the scheme that mirrors how the model will really be used.

In a real project you do not hand-roll these loops. The `rsample` package (part of tidymodels) builds grouped and time-aware resamples for you, and keeps them reproducible:

```r-static
library(rsample)

# Grouped: every fold holds out whole cafes, never splitting one across folds.
group_folds <- group_vfold_cv(bean, group = cafe, v = 6)

# Time-aware: expanding-window origins over the ordered day index, forecasting 10 days ahead.
time_folds <- sliding_index(dock, index = day, lookback = Inf, assess_stop = 10)
```

[KEY INSIGHT]
The mechanics change, the principle does not: whatever information you will *not* have at prediction time must be kept out of every training fold. Grouped CV keeps out other rows of the same group; time-aware CV keeps out the future.

::widget process-flow {"steps":[{"title":"Rows independent?","sub":"one row per thing, no time order: plain k-fold from Lesson 1"},{"title":"Rows grouped?","sub":"many rows per entity (cafe, patient, user): hold out whole groups"},{"title":"Rows in time order?","sub":"future depends on the past: train on the past, test on the future"}]}

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [Forecasting: Principles and Practice, Time series cross-validation (free)](https://otexts.com/fpp3/tscv.html) - Hyndman and Athanasopoulos on rolling-origin evaluation, the clearest treatment of "train on the past, test on the future."
- [scikit-learn user guide: Cross-validation](https://scikit-learn.org/stable/modules/cross_validation.html) - the GroupKFold and TimeSeriesSplit sections, with diagrams that make grouped and time-aware folds click (the concepts transfer straight to R).
- [An Introduction to Statistical Learning, ch. 5 (free PDF)](https://www.statlearning.com/) - the cross-validation foundations this lesson builds on.
- [rsample: group_vfold_cv() reference](https://rsample.tidymodels.org/reference/group_vfold_cv.html) - the real R function for grouped resampling, with worked examples.
- [rsample: sliding_period() reference](https://rsample.tidymodels.org/reference/sliding_period.html) - time-based resampling (expanding and sliding windows) in tidymodels.

=== step === complete
## Lesson 2 complete

You can now spot the folds that lie. Random k-fold assumes rows are independent and interchangeable; when they share a group or sit in time order, a random shuffle leaks information across the fold boundary and flatters your score. The fix mirrors the real task: hold out **whole groups** when you will deploy to new groups, and **train on the past, test on the future** when time matters. On Bean Theory both honest schemes landed near 15 cups, the number a random split hid.

Next, Lesson 3: Nested cross-validation. Once you start *tuning* a model, a single cross-validation loop starts flattering you all over again, and you will learn to put one honest loop inside another so the score you report survives contact with reality.
