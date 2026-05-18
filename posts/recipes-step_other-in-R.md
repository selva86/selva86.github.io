---
title: "recipes step_other() in R: Collapse Rare Factor Levels"
slug: recipes-step_other-in-R
description: "recipes step_other() in R pools infrequent factor levels into an 'other' category. Learn the threshold argument, worked examples, and the most common pitfalls."
keywords: "recipes step_other, step_other function R, recipes step_other examples, collapse rare factor levels R, lump infrequent categories R, recipes preprocessing R"
mathjax: false
webr: true
date: 2026-05-18
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: Categorical-Data-in-R.html
auto_link_terms: "step_other()|recipes step_other|recipes::step_other()|collapse rare factor levels|pool infrequent levels"
auto_link_case_sensitive: true
target_keyword: recipes step_other
sibling_block_enabled: true
difficulty: Beginner
---

# recipes step_other() in R: Collapse Rare Factor Levels

<p class="lead">recipes step_other() pools infrequent factor levels into a single "other" category during preprocessing, so rare categories do not generate unstable dummy columns in your model.</p>

[QUICK ANSWER]
step_other(rec, all_nominal_predictors())          # default 5% threshold
step_other(rec, city, threshold = 0.1)             # pool levels under 10%
step_other(rec, city, threshold = 35)              # pool levels under 35 times
step_other(rec, city, other = "rare_city")         # rename the pooled level
step_other(rec, all_nominal_predictors(), id = "x")  # set a custom step id
bake(prep(rec), new_data = NULL)                   # apply and view result

[DECISION TREE: Is step_other() the right tool?]
- pool rare factor levels: step_other(rec, var, threshold = 0.05)
- reserve a slot for unseen levels: step_novel(rec, var)
- turn factors into dummy columns: step_dummy(rec, var)
- label missing factor values: step_unknown(rec, var)
- drop near-constant predictors: step_nzv(rec, all_predictors())
- collapse levels outside a recipe: forcats::fct_lump_prop(x, 0.05)

## What step_other() does

**step_other() is a recipe step that collapses rare categorical levels.** It scans a factor column, finds the levels that occur less often than a threshold, and relabels every one of them as `"other"`. The frequent levels are left untouched. Adding the step to a recipe records the decision; the actual pooling runs later when you call `prep()`.

Rare levels are a real modeling problem. A factor with 40 cities where 30 of them appear two or three times will expand into 40 dummy columns under one-hot encoding. Most of those columns are almost entirely zeros, which inflates dimensionality, slows training, and produces coefficients estimated from a handful of rows. Worse, a level present in the test set but absent from training breaks many models outright.

`step_other()` solves all of this at once. By folding the long tail of rare levels into a single `"other"` bucket, you cut the column count, stabilise the estimates, and give every future unseen category a safe place to land. It is one of the most common steps in a tidymodels preprocessing pipeline for exactly this reason.

## step_other() syntax and arguments

**The signature is small but the threshold argument carries all the logic.** A typical call selects columns inside a recipe pipeline:

```r title="The step_other function signature"
step_other(
  recipe,
  ...,                 # columns to pool (tidyselect)
  role = NA,
  trained = FALSE,
  threshold = 0.05,    # proportion (<1) or count (>=1)
  other = "other",     # name of the pooled level
  objects = NULL,
  skip = FALSE,
  id = rand_id("other")
)
```

The two arguments you actually tune are `threshold` and `other`. `threshold` decides which levels count as rare, and `other` names the bucket they land in. The remaining arguments are managed by recipes itself and can be left at their defaults.

The column selector in `...` accepts any tidyselect helper. Passing a bare column name pools just that variable, while `all_nominal_predictors()` pools every categorical predictor in one call, which is the usual choice for a real pipeline.

| Argument | Default | Purpose |
|---|---|---|
| `...` | required | Columns to pool, chosen with tidyselect helpers |
| `threshold` | `0.05` | Below this rate, a level is pooled |
| `other` | `"other"` | Name given to the collapsed level |
| `skip` | `FALSE` | If `TRUE`, the step is bypassed when baking new data |

[KEY INSIGHT]
**The threshold flips meaning at 1.** A value below 1 is read as a proportion of the training rows. A value of 1 or more is read as a raw frequency count. `threshold = 0.05` and `threshold = 50` answer different questions on a 1,000-row dataset.

## step_other() examples

**Every example below uses one skewed factor column so the effect of each setting is easy to compare.** The `sales` data frame holds 200 rows with a `city` factor whose levels range from very common (NYC, LA) to very rare (Reno, Tulsa). Watch how the same column is pooled three different ways.

### Pool levels below a proportion

**Start with the default 5% threshold.** Here `step_other()` pools every city that appears in fewer than 5% of the 200 training rows. Five percent of 200 is 10, so any level seen fewer than 10 times is rare.

```r title="Pool rare levels with step_other"
library(recipes)

set.seed(42)
city <- sample(
  c("NYC", "LA", "Chicago", "Boston", "Miami", "Reno", "Tulsa"),
  size = 200, replace = TRUE,
  prob = c(0.42, 0.31, 0.17, 0.04, 0.03, 0.02, 0.01)
)
sales <- data.frame(city = factor(city), revenue = rnorm(200, 100, 20))

rec <- recipe(revenue ~ city, data = sales) |>
  step_other(city, threshold = 0.05)

baked <- bake(prep(rec), new_data = NULL)
table(baked$city)
#> 
#> Chicago      LA     NYC   other 
#>      34      62      84      20
```

Boston, Miami, Reno, and Tulsa all fell below the 10-row cutoff, so their rows now read `"other"`. Chicago, LA, and NYC clear the bar and survive as their own levels. The factor went from seven levels to four without dropping a single row of data.

### Use a frequency count threshold

**Pass a value of 1 or more to switch to count mode.** Now any level seen fewer than 35 times is pooled, regardless of dataset size.

```r title="Use a frequency count threshold"
rec_count <- recipe(revenue ~ city, data = sales) |>
  step_other(city, threshold = 35)

table(bake(prep(rec_count), new_data = NULL)$city)
#> 
#>    LA    NYC other 
#>    62    84    54
```

Chicago drops into `"other"` this time because 34 occurrences is under the count of 35. Count thresholds are handy when you have a fixed minimum sample size per level in mind, for example a rule that every modeled category must be backed by at least 35 observations. Because the rule is an absolute count, it behaves consistently no matter how many rows the training set has.

### Rename the pooled level

**The `other` argument controls the new label.** Combine it with `all_nominal_predictors()` to pool every categorical predictor at once.

```r title="Rename the pooled level"
rec_named <- recipe(revenue ~ city, data = sales) |>
  step_other(all_nominal_predictors(), threshold = 0.05,
             other = "rare_city")

levels(bake(prep(rec_named), new_data = NULL)$city)
#> [1] "Chicago"   "LA"        "NYC"       "rare_city"
```

[NOTE]
**Unseen levels at prediction time also land in "other".** When `bake()` meets a city that was not in the training data, `step_other()` assigns it to the pooled level instead of raising an error. That makes the trained recipe robust to new categories.

```r title="Unseen levels fall into other"
new_cities <- data.frame(
  city = factor(c("NYC", "Portland", "LA")),
  revenue = c(120, 95, 110)
)
bake(prep(rec), new_data = new_cities)$city
#> [1] NYC   other LA   
#> Levels: Chicago LA NYC other
```

## step_other() vs step_novel() vs fct_lump_prop()

**All three shrink the level count, but they fire at different times.** Pick by where and when you need the pooling to happen.

| Tool | Package | Pooling happens | Best for |
|---|---|---|---|
| `step_other()` | recipes | During `prep()` on training data | Pooling known rare levels in a pipeline |
| `step_novel()` | recipes | At `bake()` on new data | Reserving a slot for future unseen levels |
| `fct_lump_prop()` | forcats | Immediately, on a vector | Quick exploratory collapsing outside a recipe |

Use `step_other()` for production preprocessing because it learns the rare levels once on training data and reapplies the exact same mapping to every later dataset. That consistency is what prevents data leakage: the test set never gets a say in which levels are rare. Reach for `fct_lump_prop()` only for ad hoc cleanup before you build a recipe, and add `step_novel()` when you expect genuinely new categories to arrive after the model ships.

## Common pitfalls

**Three mistakes account for most broken `step_other()` recipes.**

**1. Placing step_other() after step_dummy().** Once `step_dummy()` has expanded a factor into indicator columns, there is no factor left to pool. The rare levels each keep their own sparse column.

```r title="Wrong order leaves rare levels unpooled"
# Wrong: dummy columns are created before pooling
recipe(revenue ~ city, data = sales) |>
  step_dummy(city) |>
  step_other(city)        # no effect, city is already numeric

# Right: pool first, then encode
recipe(revenue ~ city, data = sales) |>
  step_other(city, threshold = 0.05) |>
  step_dummy(city)
```

**2. Confusing the threshold scale.** `threshold = 5` does not mean 5%. It means a count of 5. Write `threshold = 0.05` for a 5% proportion.

**3. Setting the threshold too high.** A large threshold such as `0.5` pools every level except the most common one, collapsing real signal into the `"other"` bucket. The model then sees a near-binary split and loses the structure you wanted it to learn. Start low, inspect the resulting `table()` of levels, and raise the threshold only if the rare bucket stays tiny relative to the rows you keep.

## Try it yourself

**Try it:** Pool the `clarity` factor of a 150-row sample so that any grade seen in under 8% of rows becomes `"other"`. Save the prepped recipe to `ex_rec`.

```r title="Your turn: pool rare clarity levels"
library(recipes)
set.seed(1)
gem <- data.frame(
  clarity = factor(sample(c("IF", "VVS1", "VS1", "SI1", "I1"),
                          150, replace = TRUE,
                          prob = c(0.03, 0.05, 0.40, 0.45, 0.07))),
  price = rnorm(150, 500, 80)
)

ex_rec <- # your code here

table(bake(ex_rec, new_data = NULL)$clarity)
#> Expected: an "other" level appears
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_rec <- recipe(price ~ clarity, data = gem) |>
  step_other(clarity, threshold = 0.08) |>
  prep()

table(bake(ex_rec, new_data = NULL)$clarity)
#> 
#>   SI1   VS1 other 
#>    68    60    22
```

**Explanation:** A threshold of 0.08 pools any clarity grade below 8% of the 150 rows. IF, VVS1, and I1 each fall short, so their rows collapse into `"other"`.

</details>

## Related recipes functions

**step_other() rarely works alone.** These steps handle the neighboring categorical preprocessing tasks:

- [recipes step_dummy()](recipes-step_dummy-in-R.html) converts the pooled factor into model-ready indicator columns.
- [recipes step_novel()](recipes-step_novel-in-R.html) reserves a level for categories that appear only in future data.
- [recipes step_unknown()](recipes-step_unknown-in-R.html) gives missing factor values an explicit label.
- [recipes step_nzv()](recipes-step_nzv-in-R.html) drops predictors that stay nearly constant after pooling.
- [recipes recipe()](recipes-recipe-in-R.html) is the pipeline object every step is added to.

See the official [step_other reference](https://recipes.tidymodels.org/reference/step_other.html) for the full argument list.

## FAQ

**What does step_other() do in R?**

`step_other()` is a recipes preprocessing step that collapses infrequent factor levels into one pooled level named `"other"`. During `prep()` it learns which levels fall below the threshold on the training data, then `bake()` applies that mapping to any dataset. The result is a factor with fewer levels, which keeps one-hot encodings compact and stops rare categories from producing unstable model coefficients.

**What is the default threshold for step_other()?**

The default `threshold` is `0.05`, meaning any level that occurs in fewer than 5% of the training rows is pooled. Because the value is below 1, recipes treats it as a proportion. If you pass a value of 1 or greater, it is read as a raw frequency count instead, so `threshold = 20` pools every level seen fewer than 20 times regardless of dataset size.

**Should step_other() come before or after step_dummy()?**

`step_other()` must come before `step_dummy()`. Pooling works on a factor column, so it has to run while the variable is still categorical. If `step_dummy()` runs first, the factor is already expanded into numeric indicator columns and there is nothing left for `step_other()` to collapse. The correct recipe order is `step_other()` then `step_dummy()`.

**How does step_other() handle new factor levels?**

When `bake()` processes data containing a level that was not present during training, `step_other()` assigns that novel level to the `"other"` bucket. This happens automatically and prevents prediction-time errors from unexpected categories. If you instead want a dedicated label for unseen levels, add `step_novel()` to the recipe before `step_other()`.
