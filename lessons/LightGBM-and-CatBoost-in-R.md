---
title: "Gradient Boosting Lesson 2: LightGBM and CatBoost in R"
catalog_blurb: "The modern fast boosters, how they handle categories, and which one to pick."
description: "Meet LightGBM and CatBoost in R: histogram split-finding for speed, native categorical handling that beats one-hot encoding, why target encoding leaks, and how to choose between them and XGBoost."
keywords: "LightGBM in R, CatBoost in R, gradient boosting, histogram binning, native categorical features, target encoding leakage, ordered target statistics, XGBoost vs LightGBM, lgb.train, boosting"
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

In Lesson 1 you hand-built a booster from `rpart` stumps for Sam's single bike kiosk: start at the mean, fit each new tree to the residuals, add a shrunken slice scaled by the learning rate. It worked. But it was slow, and it only knew how to read one number, the temperature.

Sam's kiosk has since grown into a chain of 12 across the city. Every rental record now also carries which kiosk it came from and what the weather was, and there are far more days to learn from. Your hand-rolled loop would crawl through all that data, and it has no idea what to do with a "kiosk" column that is text, not a number. Closing exactly those two gaps, raw speed and handling categories, is what LightGBM and CatBoost were built for.

By the end of this lesson you will be able to:

- Explain why histogram (binned) split-finding makes these boosters so fast
- Explain why one-hot encoding fails on high-cardinality categories, and how LightGBM and CatBoost split on categories directly
- See why naive target encoding leaks, and how CatBoost's ordered target statistics fix it
- Choose between LightGBM, CatBoost and XGBoost for a given job

**Prerequisites:** Lesson 1 ([Gradient Boosting from Scratch](Gradient-Boosting-from-Scratch.html): residuals, the learning rate, shallow trees in sequence). You can run R and you know what a factor (categorical) column is.

::widget process-flow {"steps":[{"title":"Histogram splits","sub":"bin each feature so the tree tries a few hundred edges, not every value"},{"title":"Native categories","sub":"split on text columns directly, no one-hot blow-up"},{"title":"Pick the right tool","sub":"LightGBM for speed, CatBoost for categories, both beat hand-rolling"}]}

=== step === concept
::eyebrow Why they are fast
## Histogram split-finding

Recall how a tree picks a split. At each node it scans a feature and tries a threshold, keeping the cut that best separates the data. The plain method (the one your `rpart` stumps used) is exact: sort the rows by the feature and test a threshold between every pair of neighbouring values.

For one feature that is about \(N - 1\) candidate splits, where \(N\) is the number of rows reaching that node. Across \(d\) features the work at a single node is on the order of \(O(N d)\), and the booster repeats it at every node, of every tree. On Sam's old 24-day kiosk that was nothing. On the full chain it is the bottleneck.

The fix that defines a modern booster: **bin each feature once** into a small, fixed number of buckets, say \(B = 255\). Now the tree only tries the \(B - 1\) bin edges, so the per-node work drops to \(O(B d)\). Let us build Sam's chain and see the collapse for real. (Each lesson runs in a fresh R session, so we build the data right here, run this once.)

```r
set.seed(42)
n <- 1500
kiosks <- c("Riverside","Old Town","Harbor","University","Market Sq","North Park",
            "Airport","Stadium","Lakeside","West End","Central","Suburb Mall")

sales <- data.frame(
  temp    = runif(n, -2, 36),                          # daily high (deg C), full sensor precision
  kiosk   = factor(sample(kiosks, n, replace = TRUE)), # which of the 12 kiosks
  weather = factor(sample(c("sunny","cloudy","rainy"), n, replace = TRUE,
                          prob = c(0.5, 0.3, 0.2))),
  weekend = rbinom(n, 1, 2/7)                           # 1 on Sat or Sun
)

kiosk_base <- setNames(runif(length(kiosks), 60, 260), kiosks)  # each kiosk's own baseline demand
sales$rentals <- round(
  kiosk_base[as.character(sales$kiosk)] +
  260 * exp(-((sales$temp - 22)^2) / 120) +                     # demand peaks near 22 deg C
  ifelse(sales$weather == "rainy", -70,
         ifelse(sales$weather == "cloudy", -20, 0)) +
  sales$weekend * 55 +
  rnorm(n, 0, 25)
)

nrow(sales)            # rows: plenty for split-finding speed to matter
#> [1] 1500
nlevels(sales$kiosk)   # a categorical with 12 levels
#> [1] 12
```

Now count the candidate splits for temperature the two ways. Exact split-finding would consider every distinct value; histogram binning collapses them to a fixed handful. (We bin into 32 here so the drop is easy to see on screen; 255 is the common default.)

```r
length(unique(sales$temp))          # exact method: one candidate split per distinct value
#> [1] 1500

sales$temp_bin <- cut(sales$temp, breaks = 32, labels = FALSE)
length(unique(sales$temp_bin))      # histogram method: at most 32 bin edges to scan
#> [1] 32
```

[KEY INSIGHT]
Binning trades a sliver of resolution for a large speed and memory win: candidate splits per feature fall from about \(N\) to a fixed \(B\), no matter how many rows you have. That one change is most of why LightGBM and CatBoost train so much faster than the loop you wrote by hand.

=== step === quiz
::eyebrow Check yourself
## What does binning buy?

Binning a continuous feature into a few hundred buckets before searching for splits mainly buys a booster what?

::quiz {"correct":1,"gate":true,"difficulty":"beginner"}
- Speed: the tree scans a few hundred bin edges instead of every distinct value, at a usually negligible cost in accuracy ::ok Exactly. Fewer candidate splits per node means far less work, and the lost resolution between bin edges almost never changes which feature wins. Speed and memory, for a sliver of precision.
- Higher accuracy, because grouping values removes noise from the data ::no Binning is a speed and memory optimization; accuracy stays about the same, often a hair lower. "Removing noise" is not what it does, and it is not why you would do it.
- The ability to handle categorical (text) features ::no Binning applies to continuous features. Categorical columns are handled by a different mechanism, which is exactly the next thing you will meet.

=== step === concept
::eyebrow The categorical problem
## The one-hot trap

Sam's `kiosk` column is text: 12 location names. A tree cannot split on text directly, so the reflex is one-hot encoding, turn the one column into a 0/1 indicator column per category. Watch what that does to the width of the data.

```r
onehot <- model.matrix(~ kiosk - 1, data = sales)   # one 0/1 column per kiosk
dim(onehot)                                          # rows x columns
#> [1] 1500   12
```

Twelve kiosks is mild. But one-hot scales with the number of categories, not the number of rows. A `zip_code` with 5,000 values becomes 5,000 sparse columns; each split can only ask "is it this one category, yes or no," so the data fragments into thin slivers and the tree struggles to find a good cut.

[NOTE]
High-cardinality categoricals (zip codes, product IDs, user IDs) are where one-hot hurts most: the feature space explodes, memory balloons, and splits become weak. This is the everyday pain that native categorical handling removes.

=== step === concept
::eyebrow How they really do it
## Native categorical handling

LightGBM and CatBoost never make those columns. They split on a category column **directly**: LightGBM sorts the categories by their average target and finds the single best way to partition them in one split, so 12 (or 5,000) categories cost roughly a sorted pass, not an exploded matrix.

CatBoost leans even harder on the target. The simplest version is **target encoding**: replace each category with the mean target seen for it. One number per category, no new columns.

```r
# Target encoding: replace each kiosk with the mean rentals at that kiosk.
sales$kiosk_te <- ave(sales$rentals, sales$kiosk, FUN = mean)
head(sales[, c("kiosk", "rentals", "kiosk_te")], 4)
```

Neat, but it hides a trap. Each row's encoded value was computed from a group that **includes that row's own target**. For a rare category, the code is basically the row's own answer leaking back in as a feature. Make a kiosk that appears exactly once and watch:

```r
# A brand-new kiosk with a single record:
demo <- rbind(
  data.frame(kiosk = as.character(sales$kiosk[1:5]), rentals = sales$rentals[1:5]),
  data.frame(kiosk = "Pop-up", rentals = 999)
)
demo$kiosk_te <- ave(demo$rentals, demo$kiosk, FUN = mean)
demo$kiosk_te[demo$kiosk == "Pop-up"]   # its code is exactly its own rentals
#> [1] 999
```

The Pop-up code is 999, the very value we are trying to predict. A model would look brilliant in training and fall apart on new data. This is **target leakage**.

CatBoost's fix is **ordered target statistics**: shuffle the rows into a random order, then encode each row using only the rows that came *before* it.

\[ \hat{x}_i = \frac{\sum_{j \prec i,\; c_j = c_i} y_j \;+\; a\,p}{\bigl|\{\, j \prec i : c_j = c_i \,\}\bigr| \;+\; a} \]

Here \(c_i\) is row \(i\)'s category, \(y_j\) is the target of an earlier row \(j\), and \(j \prec i\) means "\(j\) comes before \(i\) in the random order." \(p\) is a prior (the global mean target) and \(a > 0\) is a smoothing weight that pulls thin categories toward \(p\). Because the sum runs only over earlier rows, row \(i\) never sees its own \(y_i\), so the leak is closed.

[WARNING]
Plain target encoding with the full group mean (the `ave` trick above) leaks, and the leak is invisible until you score new data. Use a leakage-safe scheme: CatBoost does this automatically, or do it inside a cross-validation fold by hand.

=== step === tryit
::eyebrow Your turn
## Target-encode the weather

You just saw target encoding on `kiosk`. Apply the same idea to the `weather` column: replace each weather type with its mean rentals. The pattern is `ave(target, group, FUN = ...)`. Fill in the function that turns a group's rentals into one number.

```r
sales$weather_te <- ave(sales$rentals, sales$weather, FUN = ____)
tapply(sales$weather_te, sales$weather, mean)   # one encoded value per weather type
```
::check {"regex":"FUN\\s*=\\s*mean","gate":true,"difficulty":"beginner","ok":"Right: the encoding for each weather type is the mean rentals seen for it. (And yes, the full-group mean leaks; CatBoost would compute it from earlier rows only.)","no":"You want the group average, so pass FUN = mean. That collapses each weather type to its mean rentals."}
::solution
```r
sales$weather_te <- ave(sales$rentals, sales$weather, FUN = mean)
tapply(sales$weather_te, sales$weather, mean)
```

=== step === concept
::eyebrow In R
## Train it for real

Here is the real workflow for both libraries on Sam's chain. One thing first: LightGBM and CatBoost are compiled C++ libraries, so unlike every snippet above they do **not** run in the interactive session here. Install each once and run these blocks in R on your own machine.

LightGBM takes a numeric matrix plus the names of the columns that are categorical, and splits on them natively (no one-hot):

```r-static
# install.packages("lightgbm")
library(lightgbm)

X <- data.matrix(sales[, c("temp", "kiosk", "weather", "weekend")])  # factors -> integer codes
y <- sales$rentals

dtrain <- lgb.Dataset(X, label = y,
                      categorical_feature = c("kiosk", "weather"))   # handled natively

params <- list(
  objective     = "regression",
  metric        = "rmse",
  num_leaves    = 31,      # leaf-wise growth: the main complexity knob
  learning_rate = 0.05,
  max_bin       = 255      # the histogram resolution from step 2
)

model <- lgb.train(params, dtrain, nrounds = 500)
preds <- predict(model, X)
```

CatBoost is even less fuss: hand it the factors as-is and it applies ordered target statistics internally.

```r-static
# CatBoost ships from its own release page, not CRAN; install once, then:
library(catboost)

pool <- catboost.load_pool(
  data  = sales[, c("temp", "kiosk", "weather", "weekend")],
  label = sales$rentals,
  cat_features = c(1, 2)        # 0-based: kiosk and weather
)

model <- catboost.train(pool, params = list(
  loss_function = "RMSE",
  iterations    = 500,
  learning_rate = 0.05,
  depth         = 6
))
```

=== step === widget
::eyebrow Read what it learned
## Which features mattered

A trained booster ranks its features by **gain**: how much each feature improved the loss, summed over every split that used it. On Sam's chain, temperature dominates (it drives the rental hump), the kiosk's own baseline comes next, then the weekend lift and the weather. Run this locally on the model above:

```r-static
imp <- lgb.importance(model)   # columns: Feature, Gain, Cover, Frequency
imp
```

::widget importance-bars {"items":[{"label":"temperature","value":100},{"label":"kiosk location","value":74},{"label":"weekend","value":41},{"label":"weather","value":29}]}

[WARNING]
Gain importance says a feature was *useful for splitting*, not that it *causes* the outcome, and it can flatter high-cardinality features that simply offer more places to split. For decisions that matter, confirm with permutation importance or SHAP values.

=== step === quiz
::eyebrow Check yourself
## Pick the right booster

Sam adds three more text columns to the chain data: `neighborhood`, `promo_code` and `supplier`, each with dozens to hundreds of distinct values, on about 3,000 rows. He wants strong accuracy with little tuning and little preprocessing. Which is the most natural first reach?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- CatBoost: it handles the high-cardinality text columns natively with leakage-safe ordered target statistics, and its defaults are strong on smaller data ::ok Exactly. Lots of high-cardinality categoricals plus a smallish, low-tuning brief is CatBoost's home turf: feed the raw factors, and ordered target statistics encode them without leaking or exploding the feature space.
- One-hot encode every text column, then train XGBoost ::no Hundreds of categories per column means thousands of sparse one-hot columns. That fragments the splits and balloons memory, the exact trap native handling exists to avoid.
- LightGBM with every text column left as raw strings ::no LightGBM is excellent, but it expects you to integer-code the categories and mark them, and its defaults overfit small data more readily than CatBoost's. More setup and tuning than this brief calls for.

=== step === concept
::eyebrow When to reach for which
## LightGBM vs CatBoost vs XGBoost

All three are histogram-based gradient boosters, and any of them will serve you well. The differences decide which is the *first* thing you reach for.

| | LightGBM | CatBoost | XGBoost |
|---|---|---|---|
| Split finding | histogram (binned) | histogram (binned) | histogram or exact |
| Tree growth | leaf-wise (deepens where it helps most) | symmetric (same split across a level) | level-wise by default |
| Categorical features | native split, integer-coded | native, ordered target statistics | encode first (one-hot or target) |
| Speed on big data | fastest | fast | fast |
| Defaults | strong, can overfit small data | strongest, holds up on small or noisy data | solid, huge ecosystem |
| Reach for it when | data is large and speed matters | many categoricals, you want great defaults | you want the mature, widely supported tool |

[KEY INSIGHT]
There is no universally best booster. LightGBM's leaf-wise growth wins on large data but overfits small data faster; CatBoost's symmetric trees plus ordered encoding make it the safe default when categoricals dominate; XGBoost is the most battle-tested with the widest tooling. Knowing the trade-off is the skill, not memorising a winner.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [Ke et al. (2017), LightGBM: A Highly Efficient Gradient Boosting Decision Tree (NeurIPS)](https://papers.nips.cc/paper/6907-lightgbm-a-highly-efficient-gradient-boosting-decision-tree) - the paper behind histogram binning and leaf-wise growth.
- [Prokhorenkova et al. (2018), CatBoost: unbiased boosting with categorical features](https://arxiv.org/abs/1706.09516) - introduces ordered target statistics and ordered boosting, the leakage fix you saw.
- [LightGBM docs: Features](https://lightgbm.readthedocs.io/en/latest/Features.html) - how histogram split-finding and leaf-wise growth work, with the speed and memory wins.
- [CatBoost docs: transforming categorical features to numerical](https://catboost.ai/docs/en/concepts/algorithm-main-stages_cat-to-numberic) - the exact ordered target-statistic encoding, from the source.
- [lightgbm on CRAN](https://cran.r-project.org/package=lightgbm) - install the R package and the `lgb.Dataset` / `lgb.train` API used here.

=== step === complete
## Lesson 2 complete

You now know what makes a modern booster modern: histogram split-finding collapses candidate splits from one-per-value to a fixed handful of bins, and native categorical handling skips the one-hot blow-up, with CatBoost's ordered target statistics encoding categories without leaking the answer. You saw the LightGBM and CatBoost training code, read a feature-importance ranking, and learned which to reach for first.

Next, Lesson 3: The Hyperparameters That Matter. You met `num_leaves`, `learning_rate`, `max_bin` and `nrounds` in passing here; now you will learn the few knobs that actually move a booster, how they trade off against each other, and how to set them without endless guessing.
