---
title: "rsample initial_split() in R: Make a Train/Test Split"
slug: rsample-initial_split-in-R
description: "Split data into training and testing sets with rsample initial_split() in R. Covers prop, strata, set.seed reproducibility, and the training() helper."
keywords: "rsample initial_split, initial_split function R, rsample initial_split examples, R train test split, initial_split tidymodels, split data training testing R"
mathjax: false
webr: true
date: 2026-05-19
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "initial_split()|rsample initial_split|rsample::initial_split()|train test split|initial split"
auto_link_case_sensitive: true
target_keyword: "rsample initial_split"
sibling_block_enabled: true
difficulty: Beginner
---

# rsample initial_split() in R: Make a Train/Test Split

<p class="lead">The rsample initial_split() function in R creates a single train/test partition of your data, so you can fit a model on one slice and measure honest performance on data it never saw.</p>

[QUICK ANSWER]
initial_split(df)                          # default 75/25 split
initial_split(df, prop = 0.8)              # custom 80/20 split
initial_split(df, strata = y)              # stratified by outcome
training(split)                            # extract training set
testing(split)                             # extract testing set
initial_split(df, prop = 0.7, strata = y)  # stratified custom split
set.seed(123); initial_split(df)           # reproducible split

[DECISION TREE: Is initial_split() the right tool?]
- one train/test split: initial_split(df, prop = 0.8)
- stratified single split: initial_split(df, strata = y)
- k-fold cross-validation: vfold_cv(df, v = 10)
- repeated resampling: bootstraps(df, times = 25)
- time-ordered split: initial_time_split(df, prop = 0.8)
- keep groups intact: group_initial_split(df, group_var)
- separate validation set: initial_validation_split(df)

## What initial_split() does

**initial_split() partitions a data frame once into a training set and a testing set.** It belongs to the rsample package, the resampling engine of the tidymodels ecosystem. The function does not copy your data twice. It returns a lightweight `rsplit` object that stores the row indices for each partition, and you pull the actual data frames out later with `training()` and `testing()`.

The point of a train/test split is honesty. You fit and tune your model on the training set, then score it once on the testing set to estimate how it will behave on genuinely new data. Touching the testing set during development leaks information and inflates your reported accuracy.

## Syntax and arguments

**The signature is short, and most calls only need the first one or two arguments.**

```r title="initial_split function signature"
initial_split(
  data,           # the data frame to split
  prop = 3/4,     # proportion of rows sent to training
  strata = NULL,  # column to stratify the split by
  breaks = 4,     # bins used when strata is numeric
  pool = 0.1      # small-group pooling threshold for strata
)
```

The arguments you reach for in practice:

- **data**: the data frame or tibble to partition.
- **prop**: the fraction of rows assigned to training. The default `3/4` gives a 75/25 split.
- **strata**: a column name. The split is performed within each level of this variable so class proportions are preserved.
- **breaks**: when `strata` is numeric, the number of quantile bins used to stratify.
- **pool**: strata levels smaller than this fraction of the data are pooled together before splitting.

## initial_split() examples

### Basic 75/25 split

**Call initial_split() on a data frame and print the result to see the partition sizes.** The `iris` dataset has 150 rows, so the default `3/4` proportion sends 112 rows to training.

```r title="Create a default train test split"
library(rsample)

set.seed(123)
iris_split <- initial_split(iris)
iris_split
#> <Training/Testing/Total>
#> <112/38/150>
```

### Extract the training and testing sets

**The split object is not a data frame, so extract the two sets with training() and testing().** These helpers return ordinary data frames you can pass to any modeling function.

```r title="Pull out training and testing data"
train_data <- training(iris_split)
test_data  <- testing(iris_split)

nrow(train_data)
#> [1] 112
nrow(test_data)
#> [1] 38
```

### Set a custom proportion

**Pass prop to change the split ratio.** A value of `0.80` keeps 80 percent of rows for training, a common choice when the dataset is small.

```r title="Use a custom 80 20 split"
set.seed(123)
split_80 <- initial_split(iris, prop = 0.80)
split_80
#> <Training/Testing/Total>
#> <120/30/150>
```

### Stratify by the outcome

**Use strata to keep the outcome distribution balanced across both sets.** Without stratification a random split can leave one class over-represented in training. Here every species stays evenly split.

```r title="Stratified split by a factor column"
set.seed(123)
strat_split <- initial_split(iris, prop = 0.75, strata = Species)
table(training(strat_split)$Species)
#> 
#>     setosa versicolor  virginica 
#>         37         37         37
```

## initial_split() vs other resampling functions

**initial_split() makes one split; the other rsample functions make many.** Choose based on how you plan to estimate model performance.

| Function | Produces | Use when |
|---|---|---|
| `initial_split()` | One train/test split | Final hold-out evaluation |
| `vfold_cv()` | k cross-validation folds | Tuning or robust performance estimates |
| `bootstrap()` / `bootstraps()` | Many resamples with replacement | Small data, variance estimates |
| `initial_time_split()` | One time-ordered split | Time series, no shuffling allowed |
| `group_initial_split()` | One split keeping groups intact | Grouped or clustered observations |

A typical tidymodels workflow uses both: `initial_split()` to carve off a final testing set, then `vfold_cv()` on the training set to tune the model.

[KEY INSIGHT]
**The rsplit object stores indices, not data.** Printing `iris_split` shows `<112/38/150>` rather than rows because rsample keeps pointers into the original data frame. This is why splits are cheap to create and why `training()` and `testing()` are the only way to get usable data frames out.

## Common pitfalls

**Three mistakes account for most train/test split bugs.**

- **Forgetting set.seed().** `initial_split()` shuffles rows at random. Without `set.seed()` before the call, every run produces a different split and your results are not reproducible. Set the seed in the same script, right before the split.
- **Using the testing set too early.** Calling `testing()` to inspect or tune your model leaks information. Reserve it for one final evaluation after all modeling decisions are locked.
- **Stratifying a continuous outcome without breaks.** When `strata` is numeric, rsample bins it into quantiles using `breaks`. The default of 4 is usually fine, but very skewed targets may need a different value, and tiny strata levels trigger the `pool` warning.

[WARNING]
**A split is only reproducible if the seed is set in the same session.** `set.seed(123)` followed by `initial_split()` gives the same partition every time, but moving the seed to another script or changing the R version can shift results. Keep the seed and the split together.

## Try it yourself

**Try it:** Split the `mtcars` dataset into a 70/30 train/test partition, then save the training rows to `ex_train`.

```r title="Your turn: split mtcars"
# Try it: 70/30 split of mtcars
set.seed(42)
ex_split <- # your code here
ex_train  <- # your code here

nrow(ex_train)
#> Expected: 22
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)
ex_split <- initial_split(mtcars, prop = 0.70)
ex_train <- training(ex_split)
nrow(ex_train)
#> [1] 22
```

**Explanation:** `prop = 0.70` sends 70 percent of the 32 rows to training. The product `32 * 0.70 = 22.4` is rounded down, so 22 rows land in `ex_train` and 10 in the testing set.

</details>

## Related rsample functions

**initial_split() is the entry point; these functions extend the workflow.**

- `training()` and `testing()`: extract the two data frames from a split object.
- `vfold_cv()`: build k-fold cross-validation folds from the training set.
- `bootstraps()`: generate bootstrap resamples for variance estimates.
- `group_initial_split()`: split while keeping all rows of a group together.
- `initial_validation_split()`: create a three-way train/validation/test split.

[NOTE]
**Coming from scikit-learn?** `initial_split()` plus `training()` and `testing()` is the tidymodels equivalent of `train_test_split(X, y, test_size=0.25)`. The `strata` argument matches scikit-learn's `stratify`.

## FAQ

**What is the default split ratio for initial_split()?**

The default `prop` argument is `3/4`, which sends 75 percent of rows to the training set and 25 percent to the testing set. For a 150-row dataset that is a 112/38 split. Pass a different `prop` value, such as `0.8`, to change the ratio. There is no single correct ratio: 75/25 and 80/20 are both common, and larger datasets can afford a smaller testing fraction.

**How do I make initial_split() reproducible?**

Call `set.seed()` with any integer immediately before `initial_split()`. The function selects training rows at random, so a fixed seed guarantees the same partition every time the script runs. Keep the seed and the split in the same script. Re-running with the same seed and the same R version reproduces the exact rows in each set.

**What is the difference between initial_split() and vfold_cv()?**

`initial_split()` creates one train/test split for a final hold-out evaluation. `vfold_cv()` creates k folds for cross-validation, used to tune hyperparameters or get a more stable performance estimate. They work together: split off a testing set with `initial_split()`, then apply `vfold_cv()` to the training portion during model tuning.

**When should I use the strata argument?**

Use `strata` when the outcome is imbalanced, such as a rare-event classification target. Stratified splitting preserves the class proportions in both the training and testing sets, so neither set is missing a class or skewed. For a numeric outcome, rsample bins the variable into quantiles first, controlled by the `breaks` argument.

**Can initial_split() handle time series data?**

Not directly. `initial_split()` shuffles rows, which breaks the time order a forecasting model depends on. Use `initial_time_split()` instead. It keeps the first `prop` fraction of rows as training and the most recent rows as testing, so the split respects chronology.
