---
title: "rsample training() in R: Get the Training Set From a Split"
slug: rsample-training-in-R
description: "Extract the training rows from an rsplit object with rsample training() in R. Covers initial_split, vfold_cv folds, bootstraps, and resample workflows."
keywords: "rsample training, training function R, rsample training examples, R training set rsample, training tidymodels, extract training data rsample"
mathjax: false
webr: true
date: 2026-05-22
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "training()|rsample training|rsample::training()|training set|extract training data"
auto_link_case_sensitive: true
target_keyword: "rsample training"
sibling_block_enabled: true
difficulty: Beginner
---

# rsample training() in R: Get the Training Set From a Split

<p class="lead">The rsample training() function in R pulls the training partition out of an rsplit object as an ordinary data frame, so you can pass it straight to any modeling call without juggling row indices.</p>

[QUICK ANSWER]
training(split)                      # extract training rows
testing(split)                       # extract testing rows
nrow(training(split))                # row count of training set
split |> training()                  # pipe-friendly call
analysis(fold)                       # same role for vfold/bootstrap
training(split) |> head()            # peek at the first rows
training(split)$mpg                  # access a column directly

[DECISION TREE: Is training() the right tool?]
- pull training rows from an rsplit: training(split)
- pull testing rows from the same split: testing(split)
- get analysis (held-in) of a CV fold: analysis(fold)
- get assessment (held-out) of a CV fold: assessment(fold)
- build the rsplit first: initial_split(df, prop = 0.8)
- print partition sizes only: split

## What training() does

**training() returns the training subset of an rsplit object as a data frame.** It is one of the smallest functions in the rsample package and one of the most used. The function takes a single argument: an rsplit object produced by initial_split(), validation_split(), or any similar splitter. It looks up the row indices stored inside the split and returns those rows of the original data, fully materialized as a tibble.

The reason this helper exists is that rsplit objects are not data frames. They store integer indices and a reference to the source frame, so creating a split is fast and memory-light. training() and its sibling testing() are the sanctioned way to pull the actual rows out, which keeps the rest of your modeling code honest about which half of the data it has seen.

## Syntax and arguments

**The signature is one line.** training() takes the split object and nothing else.

```r title="training function signature"
training(x, ...)
```

- **x**: an rsplit object. Typically the return value of initial_split(), validation_split(), or an element pulled from a vfold_cv() or bootstraps() resample column.
- **...**: reserved for method dispatch. You almost never pass anything here.

The companion testing(x) has the same shape and returns the held-out rows. On vfold_cv and bootstrap resamples, training() returns the analysis (held-in) rows of one fold; analysis(x) is an alias with identical behaviour.

[TIP]
**Pipe directly from the split when the code reads better.** Writing `initial_split(df, prop = 0.8) |> training()` chains the split and the extraction in one expression, useful for quick exploratory scripts where you do not need the rsplit object later.

## training() examples

### Pull the training rows from a split

**Create a split with initial_split() and call training() to materialize the rows.** The result is a regular data frame ready to feed into any model.

```r title="Extract training rows from initial_split"
library(rsample)

set.seed(123)
iris_split <- initial_split(iris, prop = 0.75)
iris_train <- training(iris_split)

nrow(iris_train)
#> [1] 112
head(iris_train, 3)
#>     Sepal.Length Sepal.Width Petal.Length Petal.Width    Species
#> 1            5.1         3.5          1.4         0.2     setosa
#> 14           4.3         3.0          1.1         0.1     setosa
#> 67           5.6         3.0          4.5         1.5 versicolor
```

### Fit a model on the training portion

**training() is usually the first call after initial_split() in a tidymodels workflow.** Fit on training(split), then save testing(split) for the final score.

```r title="Fit a linear model on training data"
set.seed(123)
m_split <- initial_split(mtcars, prop = 0.8)
m_train <- training(m_split)

model <- lm(mpg ~ wt + hp, data = m_train)
coef(model)
#> (Intercept)          wt          hp 
#> 37.85839822 -3.91250497 -0.03177291
```

### Pair training() and testing() to compute holdout error

**You almost always call training() and testing() back to back.** Fit the model on one, score it on the other.

```r title="Compute holdout MSE on mtcars"
set.seed(123)
m_split <- initial_split(mtcars, prop = 0.8)
fit  <- lm(mpg ~ wt + hp, data = training(m_split))
pred <- predict(fit, newdata = testing(m_split))
mean((testing(m_split)$mpg - pred)^2)
#> [1] 10.18243
```

### training() on a vfold_cv resample

**On a cross-validation fold, training() returns the analysis (held-in) rows.** This is the same as calling analysis(fold).

```r title="Extract one CV fold training set"
set.seed(123)
cv_folds <- vfold_cv(iris, v = 5)
first_fold <- cv_folds$splits[[1]]

nrow(training(first_fold))
#> [1] 120
nrow(testing(first_fold))
#> [1] 30
```

## training() vs analysis() and testing()

**Pick the function that matches the kind of split you are unpacking.** training()/testing() and analysis()/assessment() are aliases that do the same thing mechanically, but the names signal which workflow you are in.

| Function | Returns | Use with |
|---|---|---|
| `training()` | Held-in rows | initial_split(), validation_split() |
| `testing()` | Held-out rows | initial_split(), validation_split() |
| `analysis()` | Held-in rows | vfold_cv(), bootstraps() resamples |
| `assessment()` | Held-out rows | vfold_cv(), bootstraps() resamples |

The four functions are interchangeable, mechanically. testing(fold) on a vfold split returns the same rows as assessment(fold). The convention is a vocabulary cue: train and test imply the final hold-out partition; analysis and assessment imply the inner loop used for tuning. Sticking to the pair that matches the splitter you used keeps reviewers and future-you from confusing one resampling phase for another.

[KEY INSIGHT]
**training() does not own the rows; the original data frame does.** rsample stores integer indices inside the rsplit and re-fetches rows from the source frame on demand. Modify the source frame between calls and training() returns the updated rows. This is why splits are cheap, and why moving the original frame between scripts can break a saved split.

## Common pitfalls

**Three mistakes account for most training() bugs.**

- **Calling training() before initial_split().** training() does not accept a raw data frame. Pass it the rsplit object that initial_split() (or its kin) returned, not the original frame. A common error message is `no applicable method for 'training' applied to an object of class "data.frame"`.
- **Forgetting that splits are pointers.** Reassigning or filtering the source data frame after the split was made changes the rows that training() returns. Either freeze the source frame or rebuild the split.
- **Mixing training() and analysis() in the same script.** Both work on any rsplit, but mixing the two pairs blurs the train/test versus analysis/assessment phases. Pick one pair per workflow.

[WARNING]
**training() always returns a fresh data frame, not a view.** Every call re-materializes the rows. Inside a loop or a map(), call training() once and assign the result to a variable; otherwise you copy the same rows on each iteration.

## Try it yourself

**Try it:** Split mtcars with a 70/30 ratio and a fixed seed, then save the training rows to ex_train.

```r title="Your turn extract a training set"
# Try it: 70/30 split + extract training rows
set.seed(42)
ex_split <- # your code here
ex_train <- # your code here

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

**Explanation:** initial_split() with prop = 0.70 sends 70 percent of mtcars' 32 rows to training. training() materializes those 22 rows as a data frame ready for modeling.

</details>

## Related rsample functions

**training() is one half of a two-part API; these companions extend the workflow.**

- `testing()`: extract the held-out rows from the same split object.
- `analysis()` and `assessment()`: same as training() and testing() but named for CV and bootstrap workflows.
- `initial_split()`: build the rsplit object that training() unpacks.
- `vfold_cv()` and `bootstraps()`: build resample collections whose individual splits are unpacked the same way.

[NOTE]
**Coming from scikit-learn?** training(split) and testing(split) together replace the X_train, X_test, y_train, y_test tuple that train_test_split() returns. tidymodels keeps the rows together as a single data frame and lets you decide what is feature and what is outcome at fit time.

## FAQ

**What does training() return in rsample?**

training() returns a data frame containing the training rows of an rsplit object. The rsplit stores row indices and a reference to the source data; training() resolves those indices and gives you the rows back as a tibble. The result is identical in shape to the source frame, just with fewer rows.

**What is the difference between training() and analysis() in rsample?**

The two functions are mechanically identical. Both return the held-in rows of an rsplit object. The names are vocabulary cues: training() pairs with testing() for a single hold-out split, while analysis() pairs with assessment() for cross-validation or bootstrap resamples. Use the pair that matches the splitter you called.

**Can training() be used without calling initial_split() first?**

No. training() dispatches on the rsplit class, so you must produce a split first with initial_split(), validation_split(), or any other rsample splitter that returns an rsplit object. Passing a raw data frame raises a method-dispatch error.

**Does training() copy the data?**

Yes. Each call materializes the indexed rows into a new data frame. The rsplit itself is small because it only holds indices, but training() always builds a fresh frame. Inside a loop, call it once and reuse the result instead of re-extracting on every iteration.

**How do I use training() on a vfold_cv fold?**

Pull a single split out of the resample object's splits column, then call training() on it. For example, `training(cv_folds$splits[[1]])` returns the analysis rows of fold 1. This is the same value analysis() would give; pick whichever name fits your workflow vocabulary.
