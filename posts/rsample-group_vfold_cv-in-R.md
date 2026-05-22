---
title: "rsample group_vfold_cv() in R: Group-Aware CV Splits"
slug: rsample-group_vfold_cv-in-R
description: "Build group-aware v-fold cross-validation splits with rsample group_vfold_cv() in R. Covers v, balance, leave-one-group-out, and how to prevent group leakage."
keywords: "rsample group_vfold_cv, group_vfold_cv function R, rsample group_vfold_cv examples, R group cross validation, group v-fold cv tidymodels, grouped k-fold cross validation R, group resampling R"
mathjax: false
webr: true
date: 2026-05-22
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "group_vfold_cv()|rsample group_vfold_cv|rsample::group_vfold_cv()|group-aware cross-validation|grouped v-fold cross-validation"
auto_link_case_sensitive: true
target_keyword: "rsample group_vfold_cv"
sibling_block_enabled: true
difficulty: Beginner
---

# rsample group_vfold_cv() in R: Group-Aware CV Splits

<p class="lead">The rsample group_vfold_cv() function in R builds v-fold cross-validation splits that keep every observation from the same group inside a single fold, so models trained on hierarchical data never see leaked information from the assessment set.</p>

[QUICK ANSWER]
group_vfold_cv(df, patient_id, v = 4)              # 4 group-aware folds
group_vfold_cv(df, patient_id)                     # leave-one-group-out
group_vfold_cv(df, patient_id, v = 5, balance = "observations")  # balance rows
group_vfold_cv(df, patient_id, v = 5, balance = "groups")        # equal groups per fold
group_vfold_cv(df, patient_id, v = 5, repeats = 3) # repeated grouped CV
analysis(folds$splits[[1]])                        # training rows of fold 1
assessment(folds$splits[[1]])                      # held-out rows of fold 1
set.seed(42); group_vfold_cv(df, patient_id)       # reproducible folds

[DECISION TREE: Is group_vfold_cv() the right tool?]
- groups must stay together across folds: group_vfold_cv(df, group_var, v = 5)
- rows are independent observations: vfold_cv(df, v = 10)
- one fold per group (leave-one-group-out): group_vfold_cv(df, group_var)
- single train/test split with grouping: group_initial_split(df, group_var)
- time-ordered windows: rolling_origin(df, initial = 100)
- monte carlo random splits: mc_cv(df, prop = 0.8, times = 25)
- standard stratified resampling: vfold_cv(df, v = 10, strata = y)

## What group_vfold_cv() does

**group_vfold_cv() partitions a data frame into v folds so that every observation from a single group lands in exactly one fold.** It belongs to the rsample package, the resampling engine of the tidymodels stack. Groups are defined by a variable you pass to the `group` argument: patient IDs, customer IDs, sentence IDs, sensor IDs, anything that ties multiple rows to the same underlying unit.

The function returns a tibble of `rsplit` objects in a `splits` list-column. Each split stores the row indices that belong to the analysis (training) portion and the assessment (held-out) portion of one fold. Because group membership is preserved, a patient who appears five times in the data will contribute all five rows to one and only one fold.

[KEY INSIGHT]
**Group leakage is the silent killer of clustered-data models.** If the same patient, customer, or session appears in both the training and assessment portion of a fold, the model has effectively seen the test answer key during training. Ordinary `vfold_cv()` cannot prevent this. `group_vfold_cv()` is the fix.

## Syntax and arguments

**The signature has one required argument plus four tuning knobs.**

```r title="group_vfold_cv signature"
group_vfold_cv(
  data,
  group   = NULL,
  v       = NULL,
  repeats = 1,
  balance = c("groups", "observations"),
  ...
)
```

| Argument | Purpose | Default |
|----------|---------|---------|
| `data` | Data frame or tibble to resample | required |
| `group` | Column whose values define the groups | required |
| `v` | Number of folds; `NULL` means leave-one-group-out | `NULL` |
| `repeats` | Number of independent resampling rounds | `1` |
| `balance` | `"groups"` for equal group counts per fold; `"observations"` for equal row counts | `"groups"` |

Setting `v = NULL` produces one fold per unique group, the leave-one-group-out variant. Setting `v` to a smaller integer buckets groups together. The `balance` argument matters when group sizes are uneven and you care about fold-to-fold sample size stability.

## group_vfold_cv() examples

**Five examples cover the practical shape of grouped resampling.** They use a small synthetic patient cohort with 8 patients and 5 visits each. Each block builds on the previous one, so variables persist across runs.

### Group-aware 4-fold CV

**Build the data first, then ask for 4 folds.** A naive split would shuffle visits across folds; the grouped call keeps all five visits per patient together.

```r title="Load tidymodels and build group data"
library(tidymodels)

set.seed(42)
patients <- tibble(
  patient_id = rep(paste0("P", 1:8), each = 5),
  visit      = rep(1:5, times = 8),
  bp         = round(rnorm(40, mean = 130, sd = 8))
)
head(patients, 6)
#> # A tibble: 6 x 3
#>   patient_id visit    bp
#>   <chr>      <int> <dbl>
#> 1 P1             1   142
#> 2 P1             2   125
#> 3 P1             3   127
#> 4 P1             4   136
#> 5 P1             5   131
#> 6 P2             1   135
```

Each patient has five rows. Pass the data and the group column to `group_vfold_cv()`.

```r title="Build 4 group-aware folds"
folds <- group_vfold_cv(patients, group = patient_id, v = 4)
folds
#> # Group V-fold cross-validation 
#> # A tibble: 4 x 2
#>   splits           id       
#>   <list>           <chr>    
#> 1 <split [30/10]>  Resample1
#> 2 <split [30/10]>  Resample2
#> 3 <split [30/10]>  Resample3
#> 4 <split [30/10]>  Resample4
```

Each split shows `[30/10]`, meaning 30 analysis rows and 10 assessment rows. With 8 patients and 4 folds, each fold holds out exactly 2 patients, which is 10 rows.

### Confirm zero group leakage

**No patient should appear in both halves of a split.** Verify it directly with `intersect()`.

```r title="Confirm no patient appears in both sets"
train1 <- analysis(folds$splits[[1]])
test1  <- assessment(folds$splits[[1]])

intersect(unique(train1$patient_id), unique(test1$patient_id))
#> character(0)
```

An empty character vector is the success signal. If you ever see a non-empty intersection here, group preservation has broken and you have a bug upstream.

### Leave-one-group-out (v = NULL)

**Drop the `v` argument to get one fold per group.** With 8 patients, you get 8 folds and each fold holds out exactly one patient.

```r title="Leave-one-group-out cross-validation"
logo <- group_vfold_cv(patients, group = patient_id)
nrow(logo)
#> [1] 8

assessment(logo$splits[[1]]) |> 
  pull(patient_id) |>
  unique()
#> [1] "P1"
```

Leave-one-group-out is appropriate when you have a moderate number of groups (10 to 50) and need every group evaluated independently. With hundreds of groups it gets expensive, so pick a smaller `v`.

[TIP]
**Choose v based on group count, not row count.** With 50 patients, `v = 5` gives 10 patients per fold; with 500 patients, `v = 10` gives 50 per fold. Keep at least 5 groups in every assessment fold so per-fold metrics are not dominated by a single noisy group.

### Balance by observations instead of groups

**Switch the `balance` argument when group sizes vary widely.** The default `balance = "groups"` produces folds with similar group counts but uneven row counts; `balance = "observations"` flips the priority.

```r title="Balance folds by observations instead of group count"
uneven <- tibble(
  group_id = c(rep("A", 2), rep("B", 4), rep("C", 10), rep("D", 14)),
  y        = rnorm(30)
)

obs_folds <- group_vfold_cv(uneven, group = group_id, v = 2,
                            balance = "observations")
map_int(obs_folds$splits, ~ nrow(assessment(.x)))
#> [1] 14 16
```

Compare that to the default. Two folds, two groups each, but very different row counts.

```r title="Default balance puts equal group counts per fold"
grp_folds <- group_vfold_cv(uneven, group = group_id, v = 2,
                            balance = "groups")
map_int(grp_folds$splits, ~ nrow(assessment(.x)))
#> [1] 12 18
```

### Repeated grouped CV

**Repeats stabilize the performance metric.** Set `repeats = 3` to run the grouping procedure three independent times.

```r title="Repeated grouped CV"
set.seed(7)
rep_folds <- group_vfold_cv(patients, group = patient_id,
                            v = 4, repeats = 3)
nrow(rep_folds)
#> [1] 12
```

You get 12 splits total (4 folds times 3 repeats). Average your metric across all 12 for a tighter estimate.

## group_vfold_cv() vs vfold_cv()

**Use group_vfold_cv() the moment your rows are not independent.** The two functions look similar but solve different problems.

| Function | Use when | Risk if misused |
|----------|----------|-----------------|
| `vfold_cv()` | Rows are independent (one row per unit) | None for IID data |
| `group_vfold_cv()` | Multiple rows belong to the same unit (panel, repeated measures, hierarchical) | Performance estimates inflated by leakage if you use vfold_cv() instead |

Here is the leakage demonstrated. The naive `vfold_cv()` on the patient data splits one patient's visits across both halves.

```r title="Why ordinary v-fold leaks group signal"
set.seed(1)
naive <- vfold_cv(patients, v = 4)

train_p <- analysis(naive$splits[[1]])$patient_id
test_p  <- assessment(naive$splits[[1]])$patient_id

length(intersect(unique(train_p), unique(test_p)))
#> [1] 8
```

All 8 patients appear in both the training and assessment portion of fold 1. A model fit on the training portion has already seen rows belonging to every patient it will be scored against. The resulting RMSE will be optimistically low.

[WARNING]
**A clean train/test split is not enough on its own.** If you call `initial_split()` without grouping and then call `vfold_cv()` on the training portion, the same group can still cross folds inside the training data. Use `group_initial_split()` paired with `group_vfold_cv()` for a fully group-safe pipeline.

## Common pitfalls

**Three mistakes account for most failures with this function.**

1. **Forgetting the `group` argument.** The function does not infer the grouping variable; you have to pass it. Missing it errors immediately.

```r title="Pitfall: missing group argument"
group_vfold_cv(patients, v = 4)
#> Error in `group_vfold_cv()`: ! `group` is required when calling
#> `group_vfold_cv()`.
```

2. **Quoting the group name unnecessarily.** Tidyselect-style unquoted names work; so do strings; mixing them with double-bang `!!` does not.

```r title="Pitfall: do not double-bang"
group_var <- "patient_id"
group_vfold_cv(patients, group = !!group_var, v = 4)
#> Error: object 'group_var' not found, or invalid !! context.
# Correct: use .data pronoun or a bare string
group_vfold_cv(patients, group = group_var, v = 4)
```

3. **Setting `v` larger than the group count.** If you have 8 patients and ask for `v = 10`, the function errors. The maximum useful `v` is the unique group count.

## Try it yourself

**Try it:** Build a leave-one-group-out resampling object from `mtcars` using `cyl` as the group variable, then count how many folds you got. Save the result to `ex_cv`.

```r title="Your turn: LOGO on mtcars"
# Try it: leave-one-cyl-out CV
ex_cv <- # your code here

nrow(ex_cv)
#> Expected: 3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_cv <- group_vfold_cv(mtcars, group = cyl)
nrow(ex_cv)
#> [1] 3
```

**Explanation:** `mtcars$cyl` has 3 unique values (4, 6, 8). With `v` left at the default of `NULL`, `group_vfold_cv()` builds one fold per group, giving 3 splits.

</details>

## Related rsample functions

- [rsample vfold_cv()](rsample-vfold_cv-in-R.html) for standard v-fold CV when rows are independent
- [rsample loo_cv()](rsample-loo_cv-in-R.html) for leave-one-out CV at the row level
- [rsample mc_cv()](rsample-mc_cv-in-R.html) for Monte Carlo random splits
- [rsample initial_split()](rsample-initial_split-in-R.html) for the underlying train/test partition
- [rsample bootstraps()](rsample-bootstraps-in-R.html) for bootstrap resampling

External reference: the [rsample group_vfold_cv documentation](https://rsample.tidymodels.org/reference/group_vfold_cv.html) on the tidymodels site lists the full argument set and edge cases.

## FAQ

**What is the difference between group_vfold_cv and vfold_cv?**

`vfold_cv()` shuffles rows randomly into folds and assumes rows are independent. `group_vfold_cv()` assigns entire groups (all rows sharing a group ID) to one fold, so the same group never appears in both the training and assessment portion of a split. Use the grouped variant whenever multiple rows belong to the same patient, customer, session, or hierarchical unit.

**When should I leave v as NULL?**

Leave `v = NULL` to get leave-one-group-out cross-validation, one fold per unique group. It works well when group counts are moderate (roughly 10 to 50). With hundreds of groups, the full pass becomes slow and individual fold estimates become noisy, so pick a smaller integer `v` instead.

**Can I stratify and group at the same time?**

Not directly. `group_vfold_cv()` does not expose a `strata` argument because the grouping constraint and the stratification constraint can conflict. If you need both, a common workaround is to compute a group-level summary of the stratifier first, then pass the groups through `group_vfold_cv()`. The tidymodels team treats this as an open enhancement.

**Does group_vfold_cv work with time series?**

It can keep panels of time series together (one panel per group), but it does not enforce chronological order inside a fold. For time-aware grouped resampling, combine grouping with a rolling origin or use `sliding_window()` from rsample with a grouping pre-step. Pure `group_vfold_cv()` is fine for cross-sectional clustered data, not sequential forecasting.

**Is the function reproducible?**

Yes. Call `set.seed()` immediately before `group_vfold_cv()` and the same groups will land in the same folds every run. The seed governs the random assignment of groups to folds; the rows inside each group never reshuffle because they always move together.
