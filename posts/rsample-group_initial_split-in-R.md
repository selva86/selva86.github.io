---
title: "rsample group_initial_split() in R: Group-Safe Splits"
slug: rsample-group_initial_split-in-R
description: "Split grouped data with rsample group_initial_split() in R. Keeps all rows of a group in one set, with prop, strata, set.seed, and group leakage examples."
keywords: "rsample group_initial_split, group_initial_split function R, rsample group_initial_split examples, grouped train test split R, tidymodels grouped split, group based split"
mathjax: false
webr: true
date: 2026-05-22
post_type: PSEO
category_id: function-deep
subcategory_id: tidymodels-family
fr_parent: tidymodels-Exercises-in-R.html
auto_link_terms: "group_initial_split()|rsample group_initial_split|rsample::group_initial_split()|grouped initial split|group based split"
auto_link_case_sensitive: true
target_keyword: "rsample group_initial_split"
sibling_block_enabled: true
difficulty: Beginner
---

# rsample group_initial_split() in R: Group-Safe Splits

<p class="lead">The rsample group_initial_split() function in R creates a train/test partition that keeps every row of a group in the same set, preventing data leakage when observations are clustered by patient, customer, store, or session.</p>

[QUICK ANSWER]
group_initial_split(df, group_var)                           # default 75/25 by group
group_initial_split(df, group_var, prop = 0.8)               # custom group proportion
group_initial_split(df, group_var, strata = y)               # group split + outcome strata
training(split)                                              # extract training rows
testing(split)                                               # extract testing rows
set.seed(123); group_initial_split(df, group_var)            # reproducible group split
group_initial_split(df, group_var, pool = 0.05)              # small group pooling

[DECISION TREE: Is group_initial_split() the right tool?]
- one split with grouped data: group_initial_split(df, group)
- standard random single split: initial_split(df, prop = 0.8)
- grouped k-fold cross-validation: group_vfold_cv(df, group)
- time-ordered single split: initial_time_split(df, prop = 0.8)
- stratified outcome only: initial_split(df, strata = y)
- three-way train/val/test: initial_validation_split(df)
- repeated grouped resamples: group_bootstraps(df, group)

## What group_initial_split() does

**group_initial_split() partitions a data frame once by group, so every row sharing a group identifier stays together in training or testing.** It belongs to the rsample package, the resampling engine of the tidymodels ecosystem. Instead of sampling individual rows, it samples whole groups and assigns each one entirely to a single side of the split.

The point of a grouped split is to stop information from a single subject leaking across both sets. If a patient has ten visits and three appear in training while seven appear in testing, the model sees the same patient twice and reports an inflated accuracy that will not hold on new patients. group_initial_split() guarantees that does not happen.

## Syntax and arguments

**The signature mirrors initial_split() with one extra argument that names the grouping column.**

```r title="group_initial_split function signature"
group_initial_split(
  data,           # the data frame to split
  group,          # column that identifies the groups
  prop = 3/4,     # approximate proportion of rows sent to training
  strata = NULL,  # optional outcome column for stratification within groups
  breaks = 4,     # bins used when strata is numeric
  pool = 0.1      # small-group pooling threshold for strata
)
```

The arguments you reach for in practice:

- **data**: the data frame or tibble to partition.
- **group**: unquoted column name that holds the group identifier (subject ID, customer ID, store ID).
- **prop**: target fraction of rows in training. The actual ratio shifts slightly because whole groups are assigned at random.
- **strata**: optional outcome column, applied at the group level when stratification is needed.
- **pool**: strata levels smaller than this fraction get pooled together before splitting.

## group_initial_split() examples

### Basic grouped split with simulated patient data

**Call group_initial_split() with a data frame and the grouping column to see how rows distribute by group.** Each subject_id ends up entirely in one set.

```r title="Create a grouped train test split"
library(rsample)
library(dplyr)

set.seed(123)
patients <- tibble(
  subject_id = rep(paste0("P", 1:20), each = 5),
  visit      = rep(1:5, 20),
  outcome    = rnorm(100)
)

grp_split <- group_initial_split(patients, group = subject_id)
grp_split
#> <Training/Testing/Total>
#> <75/25/100>
```

### Confirm no subject appears in both sets

**The whole point of grouped splitting is that the training and testing subject lists are disjoint.** Inspect the unique IDs in each set to verify.

```r title="Verify zero group overlap"
train_ids <- unique(training(grp_split)$subject_id)
test_ids  <- unique(testing(grp_split)$subject_id)

length(intersect(train_ids, test_ids))
#> [1] 0

length(train_ids)
#> [1] 15
length(test_ids)
#> [1] 5
```

### Set a custom group proportion

**Pass prop to change the fraction of groups assigned to training.** With 20 subjects, prop = 0.8 sends 16 subjects to training and 4 to testing.

```r title="Use a custom 80 20 group split"
set.seed(123)
grp_split_80 <- group_initial_split(patients, group = subject_id, prop = 0.8)
length(unique(training(grp_split_80)$subject_id))
#> [1] 16
length(unique(testing(grp_split_80)$subject_id))
#> [1] 4
```

### Stratify the outcome while preserving groups

**Combine group with strata when the outcome is imbalanced and observations are clustered.** rsample assigns each group to a stratum first, then splits within strata.

```r title="Group split with outcome stratification"
patients2 <- patients |>
  mutate(class = if_else(outcome > 0, "high", "low"))

set.seed(123)
grp_strat <- group_initial_split(patients2, group = subject_id, strata = class)
table(training(grp_strat)$class)
#> 
#> high  low 
#>   37   38
```

## group_initial_split() vs other split functions

**group_initial_split() is the right choice whenever rows share an identifier that the model should not see twice.** The other rsample splitters serve different scenarios.

| Function | Produces | Use when |
|---|---|---|
| `group_initial_split()` | One split with groups intact | Clustered or repeated-measures data |
| `initial_split()` | One row-level random split | Independent observations |
| `group_vfold_cv()` | k folds, groups intact | Cross-validation on clustered data |
| `initial_time_split()` | One time-ordered split | Time series or panel data |
| `group_bootstraps()` | Many group-level resamples | Variance estimates on clustered data |

A clinical pipeline often pairs both: `group_initial_split()` to carve off a final patient-level hold-out, then `group_vfold_cv()` on the training patients for hyperparameter tuning.

[KEY INSIGHT]
**Row-level proportions are approximate; group-level proportions are exact.** Because whole groups are assigned at random, the realized row ratio depends on group sizes. If groups vary wildly in size, a 75/25 group split can produce a 60/40 row split or worse. Inspect both the group count and the row count after splitting.

## Common pitfalls

**Three mistakes account for most grouped-split bugs.**

- **Forgetting set.seed().** group_initial_split() shuffles groups at random. Without a seed before the call, the partition changes every run and your reported metrics drift between sessions.
- **Using initial_split() on clustered data.** This is the silent failure mode this function fixes. A normal random split scatters a single subject across both sets, the model memorizes that subject, and offline accuracy looks great while production accuracy collapses.
- **Confusing group with strata.** group keeps observations together; strata balances an outcome variable. They solve different problems and can be combined. Passing the outcome to group will create one group per outcome value and ruin the split.

[WARNING]
**Strata at the group level is not the same as strata at the row level.** When you pass both group and strata, rsample assigns one stratum to each group (typically the modal outcome or first value). If outcomes vary within a group, stratification cannot be perfectly balanced. Check the resulting class counts before training.

## Try it yourself

**Try it:** Use the simulated `patients` data above. Make a 70/30 group_initial_split by `subject_id`, then save the unique training subject IDs to `ex_train_ids`.

```r title="Your turn: split patients by subject"
# Try it: 70/30 group split of patients
set.seed(42)
ex_split     <- # your code here
ex_train_ids <- # your code here

length(ex_train_ids)
#> Expected: 14
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)
ex_split     <- group_initial_split(patients, group = subject_id, prop = 0.70)
ex_train_ids <- unique(training(ex_split)$subject_id)
length(ex_train_ids)
#> [1] 14
```

**Explanation:** prop = 0.70 targets 70 percent of the 20 subjects, which rounds to 14 in training and 6 in testing. The row count will not be exactly 70/30 because group sizes are equal here, but in real data the row ratio drifts further.

</details>

## Related rsample functions

**group_initial_split() is the entry point for grouped workflows; these extend it.**

- `training()` and `testing()`: extract the two data frames from a grouped split object.
- `group_vfold_cv()`: build k-fold cross-validation folds with groups intact.
- `group_bootstraps()`: generate group-level bootstrap resamples.
- `group_mc_cv()`: Monte Carlo cross-validation that respects group membership.
- `initial_split()`: the row-level counterpart for independent observations.

[NOTE]
**Coming from scikit-learn?** group_initial_split() is the tidymodels equivalent of `GroupShuffleSplit` followed by a single `next()` call. The group argument matches scikit-learn's `groups` parameter, and the function honors strata in the same way.

## FAQ

**When should I use group_initial_split() instead of initial_split()?**

Use group_initial_split() whenever a single real-world entity contributes multiple rows. Common cases include repeated patient visits, multiple orders per customer, multiple sessions per user, longitudinal measurements, and panel data. A regular initial_split() shuffles rows independently, so the same subject can land in training and testing. The model then partly memorizes that subject and offline performance becomes optimistic.

**Does group_initial_split() guarantee an exact 75/25 row ratio?**

No. The function guarantees that whole groups are kept together and targets the prop value at the group level. Because group sizes vary, the realized row ratio drifts. With 20 subjects and prop = 0.75, you get 15 groups in training and 5 in testing exactly, but the row counts depend on how many observations each subject contributes. For tighter row balance, prefer groups of similar size or accept the drift.

**Can I use group_initial_split() with a numeric group identifier?**

Yes. The group argument accepts any column type that uniquely identifies a cluster, including integers, characters, and factors. rsample treats each distinct value as a group label. If the column has accidental duplicates across what you consider different clusters, those clusters are merged into one group, which usually is not what you want. Verify the column has the right cardinality before splitting.

**How does group_initial_split() interact with set.seed()?**

Call set.seed() with any integer immediately before the function. The random selection of groups is deterministic given a fixed seed and a fixed R version, so the same script reproduces the same partition. Moving the seed to a different script, switching R versions, or rerunning with a different rsample version can shift which groups end up where. Keep the seed and the split in the same chunk for reproducibility.
