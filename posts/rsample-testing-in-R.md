---
title: "rsample testing() in R: Get the Test Set From a Split"
slug: rsample-testing-in-R
description: "Extract the test set from an rsplit with rsample testing() in R. Covers initial_split, holdout scoring, vfold_cv assessment folds, and tidymodels workflows."
keywords: "rsample testing, testing function R, rsample testing examples, R test set rsample, testing tidymodels, extract test data rsample"
mathjax: false
webr: true
date: 2026-05-22
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "testing()|rsample testing|rsample::testing()|test set|extract test data"
auto_link_case_sensitive: true
target_keyword: "rsample testing"
sibling_block_enabled: true
difficulty: Beginner
---

# rsample testing() in R: Get the Test Set From a Split

<p class="lead">The rsample testing() function in R pulls the held-out partition out of an rsplit object as a data frame, giving you the final, untouched scoring set that measures honest model performance.</p>

[QUICK ANSWER]
testing(split)                       # extract test rows
nrow(testing(split))                 # count test rows
testing(split) |> head()             # peek at first test rows
split |> testing()                   # pipe-friendly call
testing(fold)                        # held-out rows of a CV fold
assessment(fold)                     # same role for vfold/bootstrap
predict(model, testing(split))       # score model on the test set

[DECISION TREE: Is testing() the right tool?]
- pull test rows from an rsplit: testing(split)
- pull training rows from the same split: training(split)
- get assessment (held-out) of a CV fold: assessment(fold)
- get analysis (held-in) of a CV fold: analysis(fold)
- build the rsplit first: initial_split(df, prop = 0.8)
- predict and score on the test set: predict(model, testing(split))

## What testing() does

**testing() returns the held-out subset of an rsplit object as a data frame.** It is the companion of training() and is the only sanctioned way to access the rows your model has not seen. The function takes a single argument: an rsplit object produced by initial_split(), validation_split(), or any other rsample splitter. It looks up the test indices stored inside the split and materializes those rows of the source data as a tibble.

The function exists because rsplit objects are not data frames. They hold integer indices and a pointer to the original frame, so producing a split costs almost nothing. testing() converts the held-out indices back into a usable data frame at the moment you actually need it for scoring or final evaluation.

## Syntax and arguments

**The signature mirrors training() exactly.** testing() takes the rsplit and nothing else.

```r title="testing function signature"
testing(x, ...)
```

- **x**: an rsplit object. Usually the return value of initial_split() or validation_split(), or a single element pulled out of a vfold_cv() or bootstraps() resample column.
- **...**: reserved for method dispatch. You almost never pass anything here.

On a v-fold or bootstrap resample, testing(fold) returns the assessment (held-out) rows of that fold. assessment(x) is an alias with identical behaviour; pick the name that matches your workflow vocabulary.

[TIP]
**Call testing() once and assign the result.** Every call materializes a fresh data frame, so repeating testing(split)$y inside a loop copies the same rows on every iteration. Save the test frame to a variable, then index it as needed.

## testing() examples

### Pull the test rows from a split

**Create the split first with initial_split(), then call testing() to get the held-out rows.** The return value is a regular tibble ready to score against.

```r title="Extract test rows from initial_split"
library(rsample)

set.seed(42)
iris_split <- initial_split(iris, prop = 0.8)
iris_test  <- testing(iris_split)

nrow(iris_test)
#> [1] 30
dim(iris_test)
#> [1] 30  5
```

The split sends 120 rows to training and the remaining 30 to testing. The shape of iris_test is identical to iris itself: same columns, fewer rows.

### Score a fitted model on the test set

**testing() is the rsplit-friendly source for the newdata argument of predict().** Fit on training(split), then push the test frame through predict() to get honest holdout error.

```r title="Compute holdout MSE on mtcars"
set.seed(123)
m_split <- initial_split(mtcars, prop = 0.8)
fit     <- lm(mpg ~ wt + hp, data = training(m_split))
pred    <- predict(fit, newdata = testing(m_split))

mean((testing(m_split)$mpg - pred)^2)
#> [1] 10.18243
```

The model never saw the rows that testing(m_split) returns, so the mean squared error here is an unbiased estimate of out-of-sample prediction loss. Reuse the same m_split for every test-set call so you score on the same rows you trained around.

### testing() on a vfold_cv resample

**On a cross-validation fold, testing() returns the assessment (held-out) rows.** It is mechanically identical to assessment(fold) and is convenient when you want to keep one verb across single-holdout and CV code.

```r title="Extract one CV fold test set"
set.seed(123)
cv_folds   <- vfold_cv(iris, v = 5)
first_fold <- cv_folds$splits[[1]]

nrow(testing(first_fold))
#> [1] 30
nrow(training(first_fold))
#> [1] 120
```

Each of the five folds carves out a different 30-row assessment slice. Looping over cv_folds$splits with map() or a workflow_set() is how tidymodels computes cross-validated metrics without ever touching the final initial_split() test set.

## testing() vs assessment() and training()

**Pick the function that matches the kind of split you are unpacking.** training()/testing() and analysis()/assessment() are aliases that produce the same rows, but the names signal the resampling phase.

| Function | Returns | Use with |
|---|---|---|
| `testing()` | Held-out rows | initial_split(), validation_split() |
| `training()` | Held-in rows | initial_split(), validation_split() |
| `assessment()` | Held-out rows | vfold_cv(), bootstraps() resamples |
| `analysis()` | Held-in rows | vfold_cv(), bootstraps() resamples |

testing(fold) and assessment(fold) return identical rows on a vfold split; testing(split) and assessment(split) return identical rows on an initial_split. The convention is purely vocabulary: train and test name the final hold-out partition, while analysis and assessment name the inner resampling loop used for tuning. Sticking to the matched pair stops reviewers from confusing one resampling phase for another.

[KEY INSIGHT]
**The test set is a budget, not a sandbox.** Every time you tune, refit, or eyeball metrics on testing(split), you spend some of its statistical innocence. Tune on vfold_cv assessment folds; reserve testing() for one final score per modeling project. rsample makes this discipline easy because the test rows live behind a function call, not a free-floating data frame.

## Common pitfalls

**Three mistakes account for most testing() misuse.**

- **Peeking at the test set during model selection.** testing() is the final scoring set; running it through fit() to "see how it does" and then retraining leaks information. Use vfold_cv() folds for tuning and reserve testing() for the last call.
- **Calling testing() on a raw data frame.** testing() dispatches on the rsplit class. Passing it the source frame raises `no applicable method for 'testing' applied to an object of class "data.frame"`. Build the rsplit with initial_split() first.
- **Recomputing testing() inside a loop.** Each call rebuilds the test frame from indices. Inside map() or a for loop, assign testing(split) once to a variable and reuse it; otherwise you pay the materialization cost on every iteration.

[WARNING]
**Reassigning the source frame after the split silently changes the test set.** rsplits store indices, not row copies. Filter, sort, or overwrite the original data frame and testing(split) will return rows from the new state. Either freeze the source frame for the lifetime of the split, or rebuild the split after any change.

## Try it yourself

**Try it:** Split airquality with a 70/30 ratio and a fixed seed, then save the test rows to ex_test and report how many complete cases the test set contains.

```r title="Your turn extract a test set"
# Try it: 70/30 split + count complete-case test rows
set.seed(7)
ex_split <- # your code here
ex_test  <- # your code here

sum(complete.cases(ex_test))
#> Expected: a positive integer below nrow(ex_test)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(7)
ex_split <- initial_split(airquality, prop = 0.7)
ex_test  <- testing(ex_split)

nrow(ex_test)
#> [1] 46
sum(complete.cases(ex_test))
#> [1] 32
```

**Explanation:** initial_split() with prop = 0.7 reserves 30 percent of airquality's 153 rows for testing, giving 46 test rows. complete.cases() flags rows without missing values; the count is below 46 because airquality's Ozone and Solar.R columns carry NAs that the split does not impute.

</details>

## Related rsample functions

**testing() is one half of a two-part API; these companions complete the workflow.**

- `training()`: extract the held-in rows from the same rsplit object.
- `assessment()` and `analysis()`: same as testing() and training() but named for CV and bootstrap resamples.
- `initial_split()`: build the rsplit object that testing() unpacks.
- `validation_split()`: create an explicit train/validation rsplit when you want a named middle partition.
- `vfold_cv()` and `bootstraps()`: build resample collections whose splits unpack with the same two verbs.

For the full tidymodels evaluation flow, see the [rsample reference](https://rsample.tidymodels.org/reference/index.html) on the package site.

[NOTE]
**Coming from scikit-learn?** testing(split) replaces the X_test, y_test pair that train_test_split() returns. tidymodels keeps features and outcome together as one data frame; you choose what is feature and what is outcome at fit() time, not at split time.

## FAQ

**What does testing() return in rsample?**

testing() returns a data frame containing the held-out rows of an rsplit object. The rsplit stores row indices and a reference to the source data; testing() resolves those indices and gives the rows back as a tibble. The result has the same columns as the source frame, just the test subset of rows.

**What is the difference between testing() and assessment() in rsample?**

The two functions are mechanically identical. Both return the held-out rows of an rsplit. The names are vocabulary cues: testing() pairs with training() for a single hold-out partition produced by initial_split(), while assessment() pairs with analysis() for cross-validation or bootstrap resamples. Use the pair that matches the splitter you called so the workflow phase stays unambiguous.

**Can testing() be used without calling initial_split() first?**

No. testing() dispatches on the rsplit class, so you have to produce a split first with initial_split(), validation_split(), or any other rsample splitter that returns an rsplit object. Passing a raw data frame raises a method-dispatch error pointing at the missing class.

**Is it safe to call testing() multiple times on the same split?**

Yes, but each call rematerializes the rows. The values returned are identical because the indices inside the rsplit do not change, but the data frame is built fresh on each call. Inside a loop, assign testing(split) to a variable once and reuse it instead of paying the rebuild cost every iteration.

**Should I use testing() for model tuning?**

No. The test set is a one-shot scoring budget. Tune hyperparameters and compare models on vfold_cv() assessment folds; reserve testing(split) for the single final score that goes into your report. Reusing testing() during tuning leaks information from the holdout and inflates apparent performance.
