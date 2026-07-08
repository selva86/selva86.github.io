---
title: "Gradient Boosting Lesson 2: LightGBM and CatBoost in R"
catalog_blurb: "The modern fast boosters, how they handle categories, and which one to pick."
description: "You built a booster by hand in Lesson 1. Now meet the fast ones: histogram splits, leaf-wise growth, native categorical handling, and when to pick LightGBM vs CatBoost."
keywords: "LightGBM in R, CatBoost in R, histogram based gradient boosting, categorical features, target encoding, leaf-wise growth, XGBoost, gradient boosting, machine learning"
post_type: "LESSON"
curriculum_id: "6.40.2"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-boosting"
course_title: "Gradient Boosting in R"
course_lesson: "2"
course_total: "6"
course_landing: "R-Gradient-Boosting-Course.html"
course_next: "The-Hyperparameters-That-Matter.html"
course_prev: "Gradient-Boosting-from-Scratch.html"
---

=== step === cover
::eyebrow Lesson 2 of 6
## LightGBM and CatBoost in R

In Lesson 1 you built a booster by hand: start at the average, fit each shallow tree to the leftover errors, and add a shrunken slice. It works. But that hand-rolled loop is slow, because at every split it sorts each feature and tries every possible threshold.

Sam's riverside kiosk has grown into a citywide bike-share, with a log of a few million rides. Each ride has a temperature, an hour, one of 300 start stations, and a weekday. To predict demand, the hand-rolled loop would have to test millions of thresholds at every split, and choke on those 300 stations. The production boosters keep the exact same boosting idea from Lesson 1 and make it fast enough for data like this.

By the end of this lesson you will be able to:

- Explain histogram splits: why bucketing a feature makes the split search fast, and why that speed holds as the data grows
- Contrast leaf-wise (best-first) tree growth with the older level-by-level way, and the knob that keeps it honest
- Turn a 300-value category into one useful number instead of 300 one-hot columns, without leaking the target
- Pick between LightGBM, CatBoost, and XGBoost for a given problem, and write the R that trains each

**Prerequisites:** Lesson 1, [Gradient Boosting from Scratch](Gradient-Boosting-from-Scratch.html) (the residual loop and the learning rate), and you have met overfitting (the [Bias-Variance Tradeoff](The-Bias-Variance-Tradeoff.html) lesson).

::widget process-flow {"steps":[{"title":"Bin every feature","sub":"bucket each column into about 255 groups once, then split only on bucket edges"},{"title":"Grow leaf-first","sub":"split the leaf with the biggest gain next, not level by level"},{"title":"Handle categories natively","sub":"turn a 300-value column into numbers, skip the one-hot explosion"}]}

=== step === concept
::eyebrow The bottleneck
## The slow part is the split search

Remember what a tree does at every node: it tries to find the best place to split. For a numeric feature like temperature, "best" means testing a threshold between each pair of neighbouring values, "below 8.2 vs above", "below 8.4 vs above", and so on, scoring each one. With \(n\) rows a feature can have up to \(n\) distinct values, so up to \(n\) candidate thresholds to score, per feature, at every single node.

Write \(n\) for the number of rows and \(p\) for the number of features. Scanning every candidate at a node costs on the order of \(n \cdot p\) work, and a booster grows hundreds of trees, each with many nodes. On Sam's few-million-row log that is the wall you hit: the arithmetic is simple, but there is an enormous amount of it.

[KEY INSIGHT]
The exact split search is what makes a from-scratch booster slow. Its cost grows with the number of rows, and it repeats at every node of every tree. The two modern boosters attack exactly this, and the first idea is almost embarrassingly simple.

=== step === concept
::eyebrow Meet the data
## Sam's citywide ride log

Every lesson starts a fresh R session, so we build a 5,000-ride slice of Sam's log right here. Each row is one ride: the temperature, the hour, the start station (one of 300), the weekday, and how many bikes went out.

```r
set.seed(42)
n <- 5000
rides <- data.frame(
  temp    = round(rnorm(n, mean = 18, sd = 7), 2),                        # deg C, continuous
  hour    = sample(0:23, n, replace = TRUE),                             # hour of the day
  station = factor(sample(sprintf("st_%03d", 1:300), n, replace = TRUE)), # 300 start stations
  weekday = factor(sample(c("Mon","Tue","Wed","Thu","Fri","Sat","Sun"), n, TRUE))
)
# demand rises on pleasant days and at rush hour, so there is a real signal to learn
rides$rented <- with(rides,
  round(40 + 3 * temp - 0.08 * temp^2 + 12 * (hour %in% c(8, 9, 17, 18)) + rnorm(n, 0, 5)))
str(rides)
#> 'data.frame':	5000 obs. of  5 variables:
#>  $ temp   : num  27.6 14.1 20.5 22.4 20.8 ...
#>  $ hour   : int  4 4 3 9 7 11 1 22 5 22 ...
#>  $ station: Factor w/ 300 levels "st_001","st_002",..: 154 286 45 268 273 216 189 189 276 84 ...
#>  $ weekday: Factor w/ 7 levels "Fri","Mon","Sat",..: 1 5 7 5 2 5 5 1 6 6 ...
#>  $ rented : num  71 64 73 84 67 67 64 60 55 73 ...
```

Two things about this data will drive the whole lesson: `temp` is continuous with thousands of distinct values (the speed problem), and `station` has 300 levels (the categorical problem). We take them in that order.

=== step === widget
::eyebrow The fix, part 1
## Histogram-based splits

Here is the idea that makes LightGBM fast. Before growing any tree, it bins each numeric feature once: it lays a grid of about 255 buckets over the feature's range and files every value into a bucket. That is exactly what a histogram does, and you can see it below: press Run to draw the distribution of `temp` as buckets.

::widget chart-plotter {"data":[{"x":34},{"x":10},{"x":13},{"x":15},{"x":11},{"x":11},{"x":23},{"x":17},{"x":19},{"x":33},{"x":20},{"x":37},{"x":34},{"x":20},{"x":31},{"x":21},{"x":12},{"x":16},{"x":18},{"x":25},{"x":24},{"x":23},{"x":27},{"x":8},{"x":27},{"x":19},{"x":23},{"x":22},{"x":11},{"x":16}],"geoms":["histogram"],"x":"temp"}

Now the payoff: when the tree looks for a split, it no longer tests a threshold between every pair of values. It only tests the bucket edges, about 255 of them, no matter how many rows there are. The feature was binned once, up front; every split after that is cheap.

=== step === concept
::eyebrow The payoff, measured
## Count the candidates

Let us count, on the real data, how many split points the two approaches consider for `temp`.

```r
# EXACT search: every distinct temperature is a candidate cut point
length(unique(rides$temp))
#> [1] 2329

exact_cuts <- length(unique(rides$temp)) - 1   # a threshold sits between each pair
exact_cuts
#> [1] 2328

# HISTOGRAM search: bucket temp into 255 bins ONCE; only the bin edges are candidates
temp_bins <- cut(rides$temp, breaks = 255)
nlevels(temp_bins)
#> [1] 255

c(exact = exact_cuts, histogram = 255, fewer_by = round(exact_cuts / 255, 1))
#>     exact histogram  fewer_by
#>    2328.0     255.0       9.1
```

At just 5,000 rows the histogram already tests about 9 times fewer split points. And this is the part that matters: on Sam's full multi-million-row log the exact count keeps climbing with the data, while the histogram count stays pinned at 255. The split search stops scaling with the number of rows. The cost is a tiny loss of precision (a split can only land on a bucket edge, not between two exact values), and with 255 buckets that loss is almost always negligible.

=== step === quiz
::eyebrow Check yourself
## Why histogram splits are fast

LightGBM buckets each numeric feature into a fixed number of bins (about 255) before it ever looks for a split. Why does that make training so much faster on a large dataset?

::quiz {"correct":1,"gate":true,"difficulty":"beginner"}
- It tests far fewer candidate cut points per feature, and that count stays fixed even as the number of rows grows ::ok Right. Exact search tries a threshold between every pair of distinct values (up to n of them); binning caps the candidates at about 255 no matter how many rows there are, so the split search stops scaling with the data.
- Binning rounds the data, which makes each tree more accurate ::no It is the opposite: binning slightly blurs the thresholds, so it costs a tiny bit of accuracy, it does not add any. The whole win is speed, far fewer split points to score.
- It lets the model skip the split search entirely on binned features ::no The model still searches for the best split; it just has far fewer candidates to check (the bin edges) instead of every distinct value.

=== step === widget
::eyebrow The fix, part 2
## Leaf-wise growth

The second speed-and-accuracy idea is about how the tree grows. An older booster grows level by level: it splits every leaf on the current level before going deeper, so the tree stays balanced. LightGBM grows leaf-wise instead: at each step it looks at every open leaf, finds the single one whose best split would reduce the loss the most, and splits only that leaf, wherever it happens to sit.

::widget process-flow {"steps":[{"title":"Score every leaf","sub":"for each open leaf, find its best split and the gain it would add"},{"title":"Split the single best","sub":"grow only the one leaf with the largest gain, wherever it sits"},{"title":"Stop at the budget","sub":"cap num_leaves or max_depth so one branch cannot run away"}]}

Because it always spends its next split where it helps most, a leaf-wise tree squeezes more accuracy out of the same number of splits.

[WARNING]
The catch: always chasing the biggest gain can grow one branch very deep and start memorizing noise, especially on small data. You keep it in check with `num_leaves` (the main dial) and `max_depth`. That is the trade for the extra accuracy, and it is the first thing to tune, which is exactly what Lesson 3 is about.

=== step === quiz
::eyebrow Check yourself
## The catch with leaf-wise growth

LightGBM grows its trees leaf-wise: each step splits the single leaf that promises the biggest gain, wherever it sits. Compared with growing level by level, what must you guard against?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Leaf-wise growth changes the loss function the trees are fit to ::no The loss is unchanged; it is still boosting on the residuals of your chosen loss. Leaf-wise only changes which leaf gets split next, not what is being optimized.
- It can dig one branch very deep and overfit, so you cap it with num_leaves or max_depth ::ok Exactly. Chasing the biggest gain can grow a lopsided, very deep branch that memorizes noise, especially on small data. num_leaves (and max_depth) is the dial that keeps a leaf-wise tree honest.
- Leaf-wise trees can only be used for classification, not regression ::no The growth strategy is independent of the task. Leaf-wise works for regression and classification alike.

=== step === concept
::eyebrow The categorical problem
## Why one-hot explodes

Now the second half of the story: those 300 stations. The classic way to feed a text category to a model is one-hot encoding, turning one column into one 0/1 column per level. With 300 stations that is 300 new columns. Let us see it.

```r
# One-hot: each of the 300 stations becomes its own 0/1 column
onehot <- model.matrix(~ station - 1, data = rides)
dim(onehot)
#> [1] 5000  300
```

One column became 300, almost all zeros. Worse than the size: a tree can now only ask "is this ride at station 154, yes or no" one station at a time, so it takes many shallow splits to say anything useful about stations, and each split sees very little data. High-cardinality categories are exactly where one-hot hurts most.

=== step === concept
::eyebrow Native handling
## Target statistics: one number, not 300 columns

The modern boosters do not one-hot. They replace each category with a single informative number derived from the target. The simplest version is the mean target for that category: replace each station with the average demand seen at that station.

Formally, for a category value \(k\), the smoothed target statistic is

\[ \hat{x}_{k} = \frac{\sum_{j=1}^{n} \mathbf{1}[c_j = k]\, y_j \;+\; a\,p}{\sum_{j=1}^{n} \mathbf{1}[c_j = k] \;+\; a} \]

where \(c_j\) is the category of row \(j\), \(y_j\) is its target (bikes rented), \(\mathbf{1}[c_j = k]\) is 1 when row \(j\) belongs to category \(k\) and 0 otherwise, \(p\) is the global average target (the prior), and \(a\) is a small smoothing weight. In words: a station with many rides is trusted to its own mean, while a station with only a handful of rides is pulled toward the global average \(p\), so a rare station cannot swing the model on thin evidence. Here is the plain (unsmoothed) mean version in R:

```r
# Target (mean) encoding: replace each station with its average demand -> ONE column
rides$station_te <- ave(rides$rented, rides$station, FUN = mean)
head(rides[, c("station", "rented", "station_te")])
#>   station rented station_te
#> 1  st_154     71   64.13333
#> 2  st_286     64   62.47059
#> 3  st_045     73   63.06250
#> 4  st_268     84   69.12500
#> 5  st_273     67   66.19231
#> 6  st_216     67   69.06667
```

One numeric column now carries what 300 one-hot columns did, and a tree can split it with a single threshold. LightGBM does a version of this internally (it sorts the categories by this statistic and splits the sorted order); CatBoost builds it in as its headline feature. But the naive mean above hides a trap.

=== step === concept
::eyebrow The trap
## Target leakage

Look again at how `station_te` was computed: each row's encoding is the mean demand of its station, and that mean includes the row's own `rented` value. The feature has peeked at the answer. For a busy station with hundreds of rides, one row barely moves the mean, so the peek is harmless. But for a station with only a couple of rides, the encoding is basically that row's own label handed back to the model, a feature that looks brilliant in training and collapses on new data. This is target leakage, and it is worst exactly where you most need help: rare categories.

[WARNING]
Naive target encoding leaks the target, and the leak is largest for rare categories, the ones with the least data to spare. Never encode a category using its own row's label.

The fix is to compute each row's encoding without that row's own target. The simplest form is leave-one-out: use the mean of the *other* rows at the station. CatBoost goes further with ordered target statistics: it puts the rows in a random order and, for row \(i\), uses only the rows \(j\) that come before it (\(j < i\)), so no row ever sees its own label and no later row leaks backward either. You will build the leave-one-out version next.

=== step === tryit
::eyebrow Your turn
## Leave one out

Below is a leakage-safe target encoding for `station`. It removes each row's own demand from the group total before dividing, so no row sees its own label, and it blends in the global average (the `prior`) so a rare station is not trusted blindly. Fill in the blank so the row's own `rented` value is the thing removed from the numerator.

```r
prior  <- mean(rides$rented)                              # global average demand, the fallback
n_k    <- ave(rides$rented, rides$station, FUN = length)  # rides at each station
sum_k  <- ave(rides$rented, rides$station, FUN = sum)     # total demand at each station

# each row: the mean of the OTHER rides at its station, pulled toward the prior
loo_te <- (sum_k - ____ + prior) / n_k
head(round(loo_te, 1))
```
::check {"regex":"sum_k\\s*-\\s*rides\\$rented","gate":true,"difficulty":"intermediate","ok":"That removes the row's own label from the total, so the encoding is built only from the OTHER rides at the station. That is the leakage-safe version CatBoost automates for you.","no":"Subtract the row's own target: (sum_k - rides$rented + prior) / n_k. Leaving rides$rented in the total is exactly the leak you are trying to remove."}
::solution
```r
prior  <- mean(rides$rented)
n_k    <- ave(rides$rented, rides$station, FUN = length)
sum_k  <- ave(rides$rented, rides$station, FUN = sum)

loo_te <- (sum_k - rides$rented + prior) / n_k
head(round(loo_te, 1))
#> [1] 63.8 62.6 62.6 68.0 66.2 69.0
```

=== step === concept
::eyebrow Choosing
## LightGBM vs CatBoost vs XGBoost

Three boosters dominate tabular machine learning, and they share the histogram-split idea but differ where it counts. Here is how to choose.

| | LightGBM | CatBoost | XGBoost |
|---|---|---|---|
| Split finding | histogram bins | histogram bins | histogram bins (hist mode) or exact |
| Tree growth | leaf-wise (best-first) | symmetric (oblivious) trees | level-wise by default |
| Categoricals | native, you name the columns | native, ordered target statistics | one-hot or encode yourself |
| Shines when | data is huge, speed matters | many categoricals, few tuning cycles | you want the battle-tested baseline |
| Tuning effort | more careful (num_leaves and friends) | light, strong defaults | moderate |

There is no universal winner. LightGBM is the speed champion on very large data and tunes to top accuracy, but it needs a firmer hand on `num_leaves` and you must tell it which columns are categorical. CatBoost handles categoricals for you with the leakage-safe ordered statistics and tends to be excellent out of the box, so it is the low-effort pick when categories dominate. XGBoost is the dependable, widely supported default. A common workflow is to start with the one that fits your data shape, then try the others if you need the last bit of accuracy.

=== step === quiz
::eyebrow Check yourself
## Which booster fits?

You have a churn dataset that is mostly high-cardinality text columns (city, device, plan, referrer), it is not huge, and you want a strong model with as little tuning as possible. Which booster is the natural first pick?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- CatBoost: it handles the many categorical columns natively with leakage-safe ordered target statistics, and is known for strong out-of-the-box defaults ::ok Right. CatBoost was built for exactly this: lots of categoricals, minimal tuning, and encoding handled for you without leaking. It is the low-effort strong baseline when categories dominate.
- LightGBM, because it is always the most accurate booster regardless of the data ::no No booster is always most accurate. LightGBM is the speed champion on very large data and tunes to excellent accuracy, but it usually needs more tuning care and you must tell it which columns are categorical.
- One-hot encode everything, then any booster will do ::no One-hot on high-cardinality columns is the explosion this lesson warns about: hundreds of sparse columns, weaker splits, and slower training. Native categorical handling exists precisely to avoid it.

=== step === widget
::eyebrow Reading the model
## Which features mattered

After training, a booster can rank its features by how much they improved the loss across all splits, gain-based importance. For Sam's model it is no surprise that temperature and rush-hour dominate, with the station and weekday adding smaller lifts. This ranking is the first thing to look at after a model trains.

::widget importance-bars {"items":[{"label":"temp","value":100},{"label":"hour","value":72},{"label":"station","value":48},{"label":"weekday","value":19}]}

[WARNING]
Gain importance says a feature was useful for splitting, not that it causes demand, and it can flatter high-cardinality features like `station` (more categories give more chances to split). For decisions that matter, confirm with permutation importance or SHAP values, which you will meet later in the track.

=== step === concept
::eyebrow In R
## Train each for real

The two packages compile native C++ under the hood, so install them and run these blocks in your own R (they are shown here for reference and are not part of the runnable session above). The point is to see how little code it takes, and how each treats the categorical columns.

LightGBM: you hand it a numeric matrix and name which columns are categorical, so it never one-hots them.

```r-static
library(lightgbm)

feat <- c("temp", "hour", "station", "weekday")
dtrain <- lgb.Dataset(
  data  = data.matrix(rides[, feat]),   # factors become integer codes
  label = rides$rented,
  categorical_feature = c("station", "weekday")   # LightGBM splits these natively
)

params <- list(objective = "regression", learning_rate = 0.05, num_leaves = 63)
fit  <- lgb.train(params, dtrain, nrounds = 300)
pred <- predict(fit, data.matrix(rides[, feat]))

lgb.importance(fit)   # gain-based feature ranking
```

CatBoost: you pass the raw data frame with its factor columns and just point at which ones are categorical; the ordered target statistics happen inside.

```r-static
library(catboost)

feat <- c("temp", "hour", "station", "weekday")
pool <- catboost.load_pool(
  data  = rides[, feat],
  label = rides$rented,
  cat_features = c(2, 3)   # station and weekday, by 0-based column index
)

fit  <- catboost.train(pool, params = list(
  loss_function = "RMSE", learning_rate = 0.05, depth = 6, iterations = 300
))
pred <- catboost.predict(fit, pool)
```

Same data, same boosting idea from Lesson 1, but no one-hot in sight and fast enough for Sam's full log.

=== step === concept
::eyebrow Go deeper
## References

- [Ke et al. (2017), LightGBM: A Highly Efficient Gradient Boosting Decision Tree, NeurIPS](https://papers.nips.cc/paper/6907-lightgbm-a-highly-efficient-gradient-boosting-decision-tree) - the paper behind histogram splits and the speed tricks.
- [Prokhorenkova et al. (2018), CatBoost: unbiased boosting with categorical features](https://arxiv.org/abs/1706.09516) - ordered target statistics and ordered boosting, the leakage fix you saw here.
- [LightGBM documentation: Features](https://lightgbm.readthedocs.io/en/latest/Features.html) - histogram binning, leaf-wise growth, and native categorical splits, in plain terms.
- [LightGBM R package documentation](https://lightgbm.readthedocs.io/en/latest/R/index.html) - the R interface (lgb.Dataset, lgb.train) used above.
- [CatBoost R package](https://github.com/catboost/catboost/blob/master/catboost/R-package/README.md) - installing and calling CatBoost from R.

=== step === complete
## Lesson 2 complete

You now know what makes LightGBM and CatBoost fast and strong, and it is the same boosting idea from Lesson 1 with two engineering fixes and one categorical trick: histogram splits (bin each feature once, so the split search stops scaling with the data), leaf-wise growth (spend each split where it helps most, capped by num_leaves), and native categorical handling via leakage-safe target statistics instead of a one-hot explosion. You also have a clear rule for choosing among LightGBM, CatBoost, and XGBoost, and the R to train each.

Next, Lesson 3: The Hyperparameters That Matter. You met `num_leaves` and `learning_rate` in passing; now you will learn the handful of knobs that actually move a booster, how they interact, and how to set them without guessing.
