---
title: "tidymodels Lesson 1: Preprocess with recipes"
catalog_blurb: "Build a preprocessing pipeline that learns only on training data, leak-free."
description: "Build a tidymodels recipe in R: one reusable pipeline that learns scaling, imputation and dummy coding on training data, then applies it to new data leak-free."
keywords: "tidymodels, recipes, preprocessing in R, data leakage, prep and bake, feature engineering, step_normalize, step_dummy, imputation, train test split"
post_type: "LESSON"
curriculum_id: "6.50.1"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-tidymodels"
course_title: "Modeling with tidymodels"
course_lesson: "1"
course_total: "7"
course_landing: "R-tidymodels-Course.html"
course_next: "Define-Models-with-parsnip.html"
course_prev: ""
---

=== step === cover
::eyebrow Lesson 1 of 7
## Preprocess with recipes

You have framed a problem, fit a regression, and trained a classifier. Real models need one more thing first: clean, model-ready data. Picture a lender sizing up twelve loan applicants: incomes run into the tens of thousands, ages sit near forty, one person's employment history is missing, and `home` is the words own, rent, or mortgage. No model can use that table as-is. A `recipe` is the tidymodels way to package the fix into one reusable object that learns from your training data and applies itself, identically, to everything else.

By the end of this lesson you will be able to:

- Say why raw columns (different scales, text categories, missing values) are not model-ready
- Explain preprocessing leakage, the quiet mistake that makes your scores look better than they are
- Build a recipe, learn its numbers from the training set with `prep()`, and apply them to new data with `bake()`

**Prerequisites:** you can run R and use the `|>` pipe, and you have met the [train/test split and why leakage matters](Train-Validation-Test-and-Data-Leakage.html).

::widget process-flow {"steps":[{"title":"recipe()","sub":"declare the steps your data needs: impute, scale, dummy"},{"title":"prep()","sub":"learn the numbers (medians, means, sds) from the training set only"},{"title":"bake()","sub":"apply the learned recipe to any data: train, test, or future rows"}]}

=== step === concept
::eyebrow The problem
## Raw data is not model-ready

Meet our running example: a lender deciding who is likely to default. Twelve applicants, each with an income, an age, how many months they have been employed, and whether they own, rent, or have a mortgage.

```r
loans <- data.frame(
  applicant = c("Maria","James","Priya","Ahmed","Lena","Tom",
                "Sara","Ravi","Nina","Omar","Eva","Liu"),
  income    = c(52000, 38000, 64000, 71000, 45000, 29000,
                88000, 41000, 60000, 33000, 95000, 47000),
  age       = c(41, 26, 35, 52, 29, 23, 48, 31, 39, 27, 55, 33),
  employed  = c(60, 18, 40, 120, 22, 8, 96, 30, 54, NA, 140, 44),
  home      = factor(c("own","rent","mortgage","own","rent","rent",
                       "mortgage","rent","mortgage","rent","own","mortgage")),
  defaulted = factor(c("no","yes","no","no","yes","yes",
                       "no","no","no","yes","no","no"))
)
loans
#>    applicant income age employed     home defaulted
#> 1      Maria  52000  41       60      own        no
#> 2      James  38000  26       18     rent       yes
#> 3      Priya  64000  35       40 mortgage        no
#> 4      Ahmed  71000  52      120      own        no
#> 5       Lena  45000  29       22     rent       yes
#> 6        Tom  29000  23        8     rent       yes
#> 7       Sara  88000  48       96 mortgage        no
#> 8       Ravi  41000  31       30     rent        no
#> 9       Nina  60000  39       54 mortgage        no
#> 10      Omar  33000  27       NA     rent       yes
#> 11       Eva  95000  55      140      own        no
#> 12       Liu  47000  33       44 mortgage        no
```

Three things stop most models from using this as-is:

1. **Different scales.** Income runs into the tens of thousands; age sits around forty. A model that measures distance (kNN, SVM) or penalizes coefficients (lasso, ridge) will be dominated by income purely because its numbers are bigger.
2. **Text categories.** `home` is the words own, rent, mortgage. Most algorithms only do arithmetic, so a category has to become numbers.
3. **A missing value.** Omar's `employed` is `NA`. Many models refuse to run with a gap in the data.

A recipe is how we fix all three, in one place, the right way.

=== step === concept
::eyebrow The trap to avoid
## The leakage trap

Here is the mistake almost everyone makes once. To put income and age on the same scale you **standardize** them: subtract the mean and divide by the standard deviation,

\[ z = \frac{x - \bar{x}}{s} \]

where \(x\) is one applicant's income, \(\bar{x}\) is the average income, and \(s\) is the standard deviation of income. The trap is hiding in \(\bar{x}\) and \(s\): they are numbers you have to **estimate from data**, and the only honest source for them is the training set. Compute them over the whole table and you have peeked at the rows you were supposed to hold back.

```r
set.seed(7)
idx   <- sample(nrow(loans), 8)
train <- loans[idx, ]            # 8 applicants to learn from
test  <- loans[-idx, ]           # 4 held back, never seen in training

mean(loans$income)   # the mean over ALL 12 applicants, test included
#> [1] 55250
mean(train$income)   # the mean over the 8 training applicants only
#> [1] 56750
```

Those are different numbers. If you scale with `55250`, that value was shaped partly by the test applicants, so a little information about them has leaked into how you prepare the training data.

[WARNING]
Any number you learn from data, a mean, a standard deviation, a median used to fill gaps, the set of category levels, must be computed on the training set alone. Learn it from the full dataset and your test score becomes optimistic: you measured a model that had already glimpsed its own exam.

This is exactly the bookkeeping a recipe does for you.

=== step === quiz
::eyebrow Check yourself
## Spot the leak

You normalize `income` using the mean and standard deviation of the entire dataset, then split into train and test and fit a model. What is wrong?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Nothing is wrong; scaling a column never causes problems ::no Scaling itself is fine. The problem is WHERE the mean and sd came from: computed over the whole dataset, they were shaped by the test rows.
- The mean and sd were computed using the test rows too, so test information leaked into preparation and the score will look better than it really is ::ok Exactly. Every statistic you learn (a mean, an sd, an imputation value, the category levels) must come from training rows only. Over the whole set, it is leakage.
- You forgot to scale the target column, `defaulted`, as well ::no The target is a category here and is not scaled. The issue is the source of the scaling statistics, not which columns get scaled.

=== step === concept
::eyebrow The blueprint
## A recipe is a blueprint

A recipe has two parts. First, `recipe(formula, data = train)` reads the column **roles** from a formula: what is the outcome, what are the predictors. Then you add `step_*` functions that declare the transformations, choosing columns with role-aware selectors like `all_numeric_predictors()` and `all_nominal_predictors()` instead of naming columns by hand.

```r
library(recipes)
rec <- recipe(defaulted ~ income + age + employed + home, data = train) |>
  step_impute_median(all_numeric_predictors()) |>   # fill gaps with the median
  step_normalize(all_numeric_predictors()) |>       # mean 0, sd 1
  step_dummy(all_nominal_predictors())              # categories -> 0/1 columns
summary(rec)            # the role each column will play
#> # A tibble: 5 x 4
#>   variable  type      role      source
#>   <chr>     <list>    <chr>     <chr>
#> 1 income    <chr [2]> predictor original
#> 2 age       <chr [2]> predictor original
#> 3 employed  <chr [2]> predictor original
#> 4 home      <chr [3]> predictor original
#> 5 defaulted <chr [3]> outcome   original
```

The order matters: impute first (so there is no gap when we scale), then normalize, then dummy-code. But notice what has NOT happened yet. No median, no mean, no sd has been computed. The recipe is only a **plan**:

```r
tidy(rec)[, c("number", "operation", "type", "trained")]
#> # A tibble: 3 x 4
#>   number operation type          trained
#>    <int> <chr>     <chr>         <lgl>
#> 1      1 step      impute_median FALSE
#> 2      2 step      normalize     FALSE
#> 3      3 step      dummy         FALSE
```

[NOTE]
`trained` is `FALSE` for every step. A recipe is a list of instructions, like a cooking recipe written on a card. Nothing has been measured or mixed. That happens next.

::widget process-flow {"steps":[{"title":"step_impute_median","sub":"fill each missing number with the training median"},{"title":"step_normalize","sub":"rescale each number to mean 0 and sd 1"},{"title":"step_dummy","sub":"turn each category into 0/1 indicator columns"}]}

=== step === concept
::eyebrow Learn the numbers
## prep(): learn from the training set

`prep()` runs the recipe against the training data and records the actual numbers each step needs: the median to fill Omar's gap, the mean and sd to scale each column, the set of `home` levels. This is the single moment any learning happens, and it happens on `train` alone.

```r
prepped <- prep(rec, training = train)
tidy(prepped, number = 2)[, c("terms", "statistic", "value")]   # the normalize step
#> # A tibble: 6 x 3
#>   terms    statistic   value
#>   <chr>    <chr>       <dbl>
#> 1 income   mean      56750
#> 2 age      mean         35.8
#> 3 employed mean         55.5
#> 4 income   sd        24737.
#> 5 age      sd           11.2
#> 6 employed sd           43.0
```

Look at the income mean: `56750`. That is exactly `mean(train$income)` from before, not the leaky `55250` over the full table. The recipe used the training rows and nothing else.

[KEY INSIGHT]
`prep()` is where a recipe is fit, like fitting a model. The learned values (medians, means, sds, factor levels) are frozen into the prepped recipe so they can be reused, unchanged, on any future data.

=== step === concept
::eyebrow Apply the recipe
## bake(): apply it to new data

`bake()` takes a prepped recipe and applies its frozen numbers to a dataset. Hand it the held-out applicants and every test row is scaled with the **training** mean and sd, any gap is filled with the **training** median, and `home` is expanded into indicator columns.

```r
bake(prepped, new_data = test)
#> # A tibble: 4 x 6
#>   income    age employed defaulted home_own home_rent
#>    <dbl>  <dbl>    <dbl> <fct>        <dbl>     <dbl>
#> 1 -0.192  0.470    0.105 no               1         0
#> 2  0.576  1.45     1.50  no               1         0
#> 3 -0.475 -0.604   -0.779 yes              0         1
#> 4 -0.637 -0.425   -0.593 no               0         1
```

The text is gone: `home` became `home_own` and `home_rent` (the third level, mortgage, is the reference, so all-zero means mortgage). The numbers are centred near zero. No row was prepared using a statistic borrowed from itself.

[KEY INSIGHT]
Learn once on train (`prep`), apply anywhere (`bake`). Because the numbers come only from training, the recipe is **leak-free**; because they are frozen into one object, it is **reusable** on test data, on tomorrow's applicants, and on every resample you will meet in later lessons. The one rule: `prep()` on data that is genuinely your training set, never on the full table, or the leak comes right back.

=== step === quiz
::eyebrow Check yourself
## prep versus bake

In a recipe workflow, what is the difference between `prep()` and `bake()`?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- They do the same thing; you can call whichever you prefer ::no They are two distinct stages. One learns the parameters, the other applies them. Calling the wrong one will not preprocess your data.
- prep() learns the parameters (medians, means, sds, factor levels) from the training data; bake() applies those frozen parameters to any dataset ::ok Right. Learning happens once, on train, in prep(); applying happens as often as you like, on train, test, or future rows, in bake().
- prep() applies the transformations and bake() learns them from the data ::no It is the other way around: prep() learns from the training data, bake() applies what was learned.

=== step === tryit
::eyebrow Your turn
## Finish the recipe

This recipe imputes and normalizes, but it never turns the `home` categories into numbers, so a model would choke on the text. Add the missing step that dummy-codes the nominal predictors, then check it.

```r
rec2 <- recipe(defaulted ~ income + age + employed + home, data = train) |>
  step_impute_median(all_numeric_predictors()) |>
  step_normalize(all_numeric_predictors()) |>
  ____(all_nominal_predictors())   # turn the home categories into 0/1 columns
```
::check {"regex":"step_dummy","gate":true,"difficulty":"intermediate","ok":"That is it: step_dummy() expands each nominal predictor into 0/1 indicator columns, so the model sees numbers.","no":"You need the step that one-hot encodes categories: step_dummy(all_nominal_predictors())."}
::solution
```r
rec2 <- recipe(defaulted ~ income + age + employed + home, data = train) |>
  step_impute_median(all_numeric_predictors()) |>
  step_normalize(all_numeric_predictors()) |>
  step_dummy(all_nominal_predictors())
```

=== step === concept
::eyebrow Go deeper
## References

- [recipes package documentation (tidymodels)](https://recipes.tidymodels.org/) - the official reference for `recipe()`, `prep()`, `bake()`, and the role-aware selectors.
- [Tidy Modeling with R, ch. 8: Feature engineering with recipes](https://www.tmwr.org/recipes) - Kuhn and Silge's book chapter, the canonical walk-through of building recipes.
- [Feature Engineering and Selection (Kuhn and Johnson)](http://www.feat.engineering/) - the deeper why behind scaling, encoding, and imputation choices.
- [The full catalog of step_ functions](https://recipes.tidymodels.org/reference/index.html) - every transformation you can compose, from `step_pca()` to `step_other()`.

=== step === complete
## Lesson 1 complete

You can now spot preprocessing leakage and shut it down with a recipe: declare the steps once, `prep()` to learn the numbers from training data alone, `bake()` to apply them to anything. That single discipline, learn on train, apply anywhere, is the backbone of honest modeling.

Next, Lesson 2: Define models with parsnip. You will give that prepared data to a model through one consistent interface, so you can switch from a logistic regression to a random forest without rewriting your code, the perfect partner for the recipe you just built.
