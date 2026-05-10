---
title: "dplyr transmute() in R: Mutate and Drop Old Columns"
slug: "dplyr-transmute-in-R"
description: "Use dplyr transmute() to create new columns and drop unspecified ones in R. Covers transmute vs mutate(.keep=none), superseded status, and 5 examples."
keywords: "dplyr transmute, R transmute, transmute vs mutate, mutate keep none, dplyr transmute superseded, R drop columns transmute"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "dplyr-functions"
fr_parent: "Data-Wrangling-With-dplyr.html"
auto_link_terms: "transmute()|dplyr transmute|transmute vs mutate|mutate keep none|drop columns transmute"
auto_link_case_sensitive: true
target_keyword: "dplyr transmute"
sibling_block_enabled: true
difficulty: "Beginner"
---

# dplyr transmute() in R: Mutate and Drop Old Columns

<p class="lead">The <code>transmute()</code> function in dplyr is like <code>mutate()</code> but DROPS all columns not mentioned. As of dplyr 1.1, it is superseded by <code>mutate(.keep = "none")</code>, which is preferred in new code.</p>

[QUICK ANSWER]
transmute(df, kpm = mpg * 1.609)              # only kpm column survives
transmute(df, mpg, kpm = mpg * 1.609)         # mpg + kpm; rest dropped
mutate(df, kpm = mpg * 1.609, .keep = "none") # modern equivalent
mutate(df, kpm = mpg * 1.609, .keep = "used") # mpg + kpm; rest dropped
mutate(df, .keep = "all")                     # all columns; default
df |> select(mpg) |> mutate(kpm = mpg * 1.609)# explicit alternative

[DECISION TREE: transmute, mutate, or .keep?]
- modern code, drop unmentioned columns: mutate(.keep = "none")
- modern code, keep mentioned + new: mutate(.keep = "used")
- legacy code or quick interactive use: transmute()
- keep ALL columns + new ones: mutate() (default)
- explicit projection: select() then mutate()
- rename only: rename() (not transmute)

## What transmute() does in one sentence

**`transmute(df, ...)` evaluates each `...` expression to create new columns, then drops EVERY column not named in the call.** It is `mutate()` plus a `select()` to keep only the new (and explicitly mentioned) columns.

`transmute()` is "superseded" in dplyr 1.1: still works, but `mutate(.keep = ...)` is the recommended replacement. The old function remains for backward compatibility.

## Syntax

**`transmute(.data, ...)`. Same expression syntax as mutate; output keeps only mentioned columns.**

```r title="Convert mpg to kilometres per litre"
library(dplyr)

mtcars |>
  transmute(kpl = mpg * 0.425) |>
  head(3)
#>                       kpl
#> Mazda RX4          8.925
#> Mazda RX4 Wag      8.925
#> Datsun 710         9.690
```

[TIP]
**For new code, prefer `mutate(.keep = "none")` over `transmute()`.** Same result, modern API, easier to discover via `mutate` docs.

## Five common patterns

### 1. Single derived column

```r title="Drop everything else, keep only the new column"
mtcars |>
  transmute(kpl = mpg * 0.425) |>
  head(3)
#>                       kpl
#> Mazda RX4          8.925
```

### 2. Keep some original columns

```r title="Carry mpg forward, add kpl"
mtcars |>
  transmute(mpg, kpl = mpg * 0.425) |>
  head(3)
#>                    mpg   kpl
#> Mazda RX4         21.0 8.925
```

Bare column names mean "keep this column unchanged".

### 3. Multiple new columns

```r title="Create several at once"
mtcars |>
  transmute(
    kpl    = mpg * 0.425,
    weight_kg = wt * 453.6,
    power_kg  = hp / weight_kg
  ) |>
  head(3)
```

Just like mutate, all references in the right side resolve against the input frame.

### 4. Rename via transmute

```r title="Rename columns by mentioning"
mtcars |>
  transmute(
    miles_per_gal = mpg,
    cylinders     = cyl
  ) |>
  head(3)
#>                    miles_per_gal cylinders
#> Mazda RX4                   21.0         6
```

For rename-only, `rename()` is clearer; transmute happens to support it as a side effect.

### 5. Modern equivalent with mutate(.keep)

```r title="dplyr 1.1+ recommended form"
mtcars |>
  mutate(kpl = mpg * 0.425, .keep = "none") |>
  head(3)
#>                       kpl
#> Mazda RX4          8.925
```

`.keep = "none"` drops all input columns. `.keep = "used"` keeps only those referenced in the right-hand side.

[KEY INSIGHT]
**`mutate(.keep = ...)` covers four cases that previously required transmute, mutate, or select+mutate.** Options: `"all"` (default, keeps everything), `"used"` (keeps used + new), `"unused"` (keeps unused + new), `"none"` (keeps only new). One verb, four behaviors.

## transmute() vs mutate() vs select+mutate

**Three ways to "compute new columns and drop the rest" in dplyr.**

| Approach | Style | Status |
|---|---|---|
| `transmute(df, x = ...)` | Old | Superseded (still works) |
| `mutate(df, x = ..., .keep = "none")` | Modern | Recommended |
| `select(df, kept_cols) |> mutate(x = ...)` | Explicit | Always clear |

When to use which:

- `mutate(.keep = "none")` for new code.
- `transmute()` if you encounter it in legacy code (no need to rewrite).
- `select() |> mutate()` when you want fine-grained column control before computation.

## A practical workflow

**The most common transmute pattern is "convert units" or "extract derived metrics" with no need to keep the source columns.**

Examples:

- Unit conversion: `transmute(kpl = mpg * 0.425, kg = wt * 453.6)`
- Index calculation: `transmute(id, total = price * qty, margin = (price - cost) / price)`
- Z-score normalization: `transmute(across(everything(), ~ (.x - mean(.x)) / sd(.x)))`

When the source columns are no longer needed downstream (and you don't want to clutter), transmute (or `mutate(.keep = "none")`) is the cleanest pattern.

## Common pitfalls

**Pitfall 1: forgot to keep needed columns.** `transmute(kpl = mpg * 0.425)` drops `mpg`, `cyl`, etc. If downstream code needs them, list them explicitly: `transmute(mpg, cyl, kpl = mpg * 0.425)`.

**Pitfall 2: doesn't preserve grouping vars unless mentioned.** A grouped tibble's grouping columns ARE kept by transmute (dplyr 1.0+); but if you ungroup AND transmute, expect them to be dropped.

[WARNING]
**`transmute()` is "superseded" in dplyr 1.1: `mutate(.keep = ...)` is preferred.** Superseded means "still works, no plans to remove, but new code should use the alternative". You don't need to rewrite existing transmute calls.

## Try it yourself

**Try it:** From `mtcars`, create a result with ONLY two columns: `mpg_per_cyl = mpg / cyl` and `power_to_weight = hp / wt`. Save to `ex_metrics`.

```r title="Your turn: derived metrics only"
ex_metrics <- mtcars |>
  # your code here

head(ex_metrics)
#> Expected: just 2 columns
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_metrics <- mtcars |>
  transmute(
    mpg_per_cyl     = mpg / cyl,
    power_to_weight = hp / wt
  )

head(ex_metrics, 3)
#>                    mpg_per_cyl power_to_weight
#> Mazda RX4              3.500000        42.05607
#> Mazda RX4 Wag          3.500000        38.25714
#> Datsun 710             5.700000        62.93706

# Modern equivalent:
ex_metrics_modern <- mtcars |>
  mutate(
    mpg_per_cyl     = mpg / cyl,
    power_to_weight = hp / wt,
    .keep = "none"
  )
```

**Explanation:** `transmute()` (or `mutate(.keep = "none")`) creates the two new columns and drops all originals. Result: 32 rows × 2 columns.

</details>

## Related dplyr functions

After mastering transmute, look at:

- `mutate(.keep = ...)`: modern replacement
- `mutate()`: keep all columns + new ones
- `select()`: pick specific columns (no computation)
- `rename()`: rename without computing
- `summarise()`: collapse rows (transmute keeps row count)
- `mutate(across(...))`: apply same transformation across columns

For computing new columns ALONGSIDE all originals, just use `mutate()` (default `.keep = "all"`).

## FAQ

**What is the difference between transmute and mutate in dplyr?**

`mutate()` keeps ALL columns and adds the new ones. `transmute()` keeps ONLY the columns you mention (new or explicitly named originals); everything else is dropped.

**Is transmute deprecated in dplyr?**

Superseded, not deprecated. As of dplyr 1.1, `mutate(.keep = "none")` is the preferred replacement. transmute() still works and is not slated for removal.

**How do I keep some original columns with transmute?**

Mention them by bare name: `transmute(df, mpg, kpl = mpg * 0.425)` keeps `mpg` and the new `kpl`; drops everything else.

**What is mutate(.keep = "none") in dplyr?**

`.keep = "none"` is an argument to `mutate()` that drops all input columns, keeping only the new ones. It is the modern equivalent of `transmute()`.

**Does transmute respect group_by?**

Yes. On a grouped tibble, transmute computes per-group expressions and keeps the grouping columns automatically (dplyr 1.0+).
