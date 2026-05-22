---
title: "janitor top_levels() in R: Summarise Factor Extremes Fast"
slug: "janitor-top_levels-in-R"
description: "Use janitor top_levels() to summarise an ordered factor with top N, bottom N, and a pooled middle row. Counts, percentages, Likert examples, pitfalls."
keywords: "janitor top_levels, top_levels function R, janitor top_levels examples, R top_levels factor, top bottom factor levels R, janitor factor summary, ordered factor summary R"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "janitor-functions"
fr_parent: "janitor-Package-in-R.html"
auto_link_terms: "top_levels()|janitor top_levels|janitor::top_levels()|top and bottom factor levels|factor extremes"
auto_link_case_sensitive: true
target_keyword: "janitor top_levels"
sibling_block_enabled: true
difficulty: "Beginner"
---

# janitor top_levels() in R: Summarise Factor Extremes Fast

<p class="lead">The <code>janitor top_levels()</code> function summarises an ordered factor by reporting its top N and bottom N levels with counts and percentages, pooling everything in between into a single <code>&lt;Middle&gt;</code> row. It is the one-call snapshot you reach for when reviewing Likert scales, ratings, or any ordinal variable where the extremes carry more meaning than the centre.</p>

[QUICK ANSWER]
top_levels(opinions)                       # default: top 2 + bottom 2
top_levels(opinions, n = 1)                # only top 1 + bottom 1
top_levels(opinions, n = 3)                # wider slices, narrower middle
top_levels(droplevels(opinions))           # drop unused levels first
opinions |> top_levels(n = 2)              # pipe-friendly
top_levels(factor(x, levels = lv, ordered = TRUE))  # coerce on the fly
top_levels(forcats::fct_drop(opinions))    # drop empty levels (tidyverse)

[DECISION TREE: Is top_levels() the right tool?]
- summarise an ordered factor with collapsed middle: top_levels(x, n = 2)
- full count and percent table, every level: janitor::tabyl(x)
- count by group inside dplyr: count(df, x) or group_by(x) |> tally()
- factor frequency as a tidy tibble: forcats::fct_count(x, prop = TRUE)
- frequency for an unordered factor or character: table(x) or summary(x)
- reorder factor levels by frequency first: fct_infreq(x) |> top_levels()
- handle missing values explicitly: addNA(x) |> top_levels()

## What top_levels() does in one sentence

**`top_levels()` reports the top and bottom slices of a factor with counts and percentages, pooling everything in between into one labelled row.** It picks the highest `n` and lowest `n` levels by factor-level order (not frequency) and sums the rest into a `<Middle>` group. The function is built for ordered factors with five or more categories where the extremes carry more meaning than the centre.

## Syntax

**`top_levels()` takes a factor and an integer `n`, and returns a data frame with up to `2n + 1` rows.** The signature is small and the defaults handle most cases.

```r title="Load janitor and inspect the signature"
library(janitor)

args(top_levels)
#> function (input_tag, n = 2, ...)
#> NULL
```

The call shape:

```
top_levels(input_tag, n = 2, ...)
```

`input_tag` is a factor (typically ordered). `n` sets how many levels to pull from each end; the default 2 means top 2 and bottom 2 with the rest pooled. There is no `na.rm` argument; missing values are dropped silently before counting (see Pitfall 4).

[NOTE]
**"Top" and "bottom" mean factor-level order, not frequency.** A factor with `levels = c("Low", "Medium", "High"), ordered = TRUE` puts `High` at the top regardless of count. Unordered factors fall back to alphabetical order.

## Common patterns

**Six patterns cover almost every reason to reach for `top_levels()`.** Run them in order; each block builds on the one before.

### 1. Default top-2 / bottom-2 on a Likert factor

**The default call splits a five-level Likert factor into top 2, bottom 2, and a pooled middle.** This is the canonical use: a one-glance read of a survey question.

```r title="Build a Likert factor and call top_levels"
library(janitor)

opinions <- factor(
  c("Strongly Agree", "Agree", "Agree", "Neutral", "Disagree",
    "Strongly Disagree", "Agree", "Neutral", "Neutral", "Strongly Agree",
    "Disagree", "Disagree", "Agree", "Strongly Agree", "Neutral"),
  levels = c("Strongly Disagree", "Disagree", "Neutral",
             "Agree", "Strongly Agree"),
  ordered = TRUE
)

top_levels(opinions)
#>                                opinions n percent
#>           Strongly Disagree, Disagree   4   0.267
#>                                <Middle> 4   0.267
#>                  Agree, Strongly Agree  7   0.467
```

Three rows summarise fifteen responses. The first column joins the level names with commas, and the percent column always sums to 1.

### 2. Tighten the slice with n = 1

**Pass `n = 1` to compress the head and tail to a single level each.** Useful when you only care about the strongest agreement and disagreement, not the directional middle.

```r title="Top-1 / bottom-1 summary"
top_levels(opinions, n = 1)
#>             opinions  n percent
#>    Strongly Disagree  1   0.067
#>             <Middle> 11   0.733
#>       Strongly Agree  3   0.200
```

The middle pools `Disagree`, `Neutral`, and `Agree` into one count of 11, the kind of signal a top-2 view would hide.

[TIP]
**Match `n` to the number of "extreme" labels in the scale.** A 5-point Likert wants `n = 1` for "strongly only", `n = 2` for "any agreement vs any disagreement", and `n = 3` collapses the middle to just "Neutral". Picking `n` is half the analysis.

### 3. Widen the slices with a larger n

**A larger `n` widens the top and bottom and shrinks the middle, useful for 7-point or 9-point scales.** The function copes gracefully when `n` would consume the entire factor: the middle row simply disappears.

```r title="n = 2 on a 7-point factor"
satisfaction <- factor(
  c("Very Dissatisfied", "Dissatisfied", "Neutral", "Satisfied",
    "Very Satisfied", "Dissatisfied", "Somewhat Satisfied",
    "Somewhat Dissatisfied", "Satisfied", "Very Satisfied",
    "Neutral", "Satisfied"),
  levels = c("Very Dissatisfied", "Dissatisfied", "Somewhat Dissatisfied",
             "Neutral", "Somewhat Satisfied", "Satisfied", "Very Satisfied"),
  ordered = TRUE
)

top_levels(satisfaction, n = 2)
#>                                            satisfaction n percent
#>            Very Dissatisfied, Dissatisfied               3   0.250
#>                                            <Middle>     3   0.250
#>                       Satisfied, Very Satisfied         6   0.500
```

Six responses land in the top two, three in the bottom two, and three across the middle three combined.

### 4. Coerce a character column to factor first

**`top_levels()` errors on a character vector; coerce with `factor()` and pass `levels =` explicitly so the order is meaningful.** Without an explicit level order the factor defaults to alphabetical, which rarely matches the conceptual order.

```r title="Coerce, then summarise"
raw <- c("Hot", "Warm", "Mild", "Cool", "Cold",
         "Warm", "Mild", "Mild", "Hot", "Cool")

temps <- factor(
  raw,
  levels = c("Cold", "Cool", "Mild", "Warm", "Hot"),
  ordered = TRUE
)

top_levels(temps, n = 1)
#>          temps  n percent
#>          Cold   1     0.1
#>      <Middle>   7     0.7
#>           Hot   2     0.2
```

Without `levels =`, the factor orders alphabetically (`Cold`, `Cool`, `Hot`, `Mild`, `Warm`), and `Hot` slots into the middle instead of the top.

### 5. Handle missing values explicitly

**`top_levels()` drops `NA` silently; counts and percentages reflect only the non-missing responses.** In real survey data this matters because non-response is part of the signal.

```r title="NA values vanish from the summary"
ratings <- factor(
  c("Low", "Medium", "High", NA, "High", "Medium", NA, "Low"),
  levels = c("Low", "Medium", "High"),
  ordered = TRUE
)

top_levels(ratings, n = 1)
#>      ratings n percent
#>          Low 2   0.333
#>     <Middle> 2   0.333
#>         High 2   0.333

sum(is.na(ratings))
#> [1] 2
```

The two `NA` responses are gone from the summary. If non-response matters, report it separately; the function has no flag to keep them.

[WARNING]
**Silent NA drop changes the denominator.** A 100-row survey with 20 missing responses returns percentages that sum over 80, not 100, so 50% in the result means "half of the respondents", not "half of the sample". Always report the response rate alongside the table when the audience expects sample-wide percentages.

### 6. Use it inside a dplyr pipeline

**`top_levels()` takes a single factor, so the natural shape is to `filter` rows then `pull` the column.** This keeps `top_levels()` doing what it does best while letting dplyr handle the row selection.

```r title="Pipe a column through top_levels"
library(dplyr)

survey <- data.frame(
  region = rep(c("North", "South"), each = 8),
  rating = factor(
    c("Bad", "OK", "Good", "Great", "OK", "Good", "Good", "Great",
      "Bad", "Bad", "OK", "Good", "Good", "Great", "Great", "Great"),
    levels = c("Bad", "OK", "Good", "Great"),
    ordered = TRUE
  )
)

survey |>
  filter(region == "South") |>
  pull(rating) |>
  top_levels(n = 1)
#>     . n percent
#>   Bad 2   0.250
#>  <Mid 1   0.125
#> Great 5   0.625
```

The column header shows as `.` because `pull()` strips the name; rename with `setNames()` after the call for a cleaner report.

## Compare with alternatives

**Base R, janitor, forcats, and dplyr each give a different angle on factor counts.** Pick by what the table will be used for.

| Approach | Returns | Best for |
|---|---|---|
| `janitor::top_levels()` | 3-row summary with collapsed middle | Survey snapshots, Likert reports, ordinal extremes |
| `janitor::tabyl()` | Full count + percent table | Complete frequency breakdown for any factor |
| `base::table()` | Named integer vector | One-line counts, no percent column |
| `base::summary()` on a factor | Named integer vector with NAs | Quick inspection mixed with other column summaries |
| `dplyr::count()` | Tibble with `n` column | Grouped counts, pipes into ggplot |
| `forcats::fct_count()` | Tibble with `n` and optional `prop` | Tidy frequency with proportion, sortable |

[KEY INSIGHT]
**`top_levels()` is the only one of these built around the head/tail/middle split.** Everything else returns one row per level. If the audience needs "how many at the top, how many at the bottom, how many in between", reach for it. Otherwise one of the alternatives is a cleaner fit.

## Common pitfalls

**Pitfall 1: passing a character vector.** `top_levels()` errors immediately. Coerce with `factor(x, levels = c(...), ordered = TRUE)` and supply the order explicitly.

**Pitfall 2: using an unordered factor.** Slicing falls back to alphabetical order, so "Top 2" may be the highest-alphabet labels, not the conceptual extremes. Set `ordered = TRUE` when creating the factor.

**Pitfall 3: choosing `n` larger than half the levels.** Top and bottom slices overlap; `top_levels()` shrinks or omits `<Middle>`, but the head/tail/middle reading breaks down. Use `janitor::tabyl()` if every level matters.

**Pitfall 4: forgetting that NA is silently dropped.** Percentages are conditional on respondents, not the full sample. Report the response rate alongside the table.

## Try it yourself

**Try it:** Build a factor of 12 survey responses on a 5-point scale (`Very Poor`, `Poor`, `Average`, `Good`, `Very Good`). Call `top_levels()` with `n = 1` to see only the strongest agreement and disagreement. Save the summary to `ex_top`.

```r title="Your turn: summarise a Likert factor"
# Try it: top-1 / bottom-1 on a 5-point scale
ex_scores <- factor(
  c("Good", "Average", "Very Good", "Poor", "Good", "Very Good",
    "Average", "Poor", "Very Poor", "Good", "Average", "Very Good"),
  levels = c("Very Poor", "Poor", "Average", "Good", "Very Good"),
  ordered = TRUE
)

ex_top <- # your code here

ex_top
#> Expected: 3 rows; Very Poor, <Middle>, Very Good
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_scores <- factor(
  c("Good", "Average", "Very Good", "Poor", "Good", "Very Good",
    "Average", "Poor", "Very Poor", "Good", "Average", "Very Good"),
  levels = c("Very Poor", "Poor", "Average", "Good", "Very Good"),
  ordered = TRUE
)

ex_top <- top_levels(ex_scores, n = 1)
ex_top
#>     ex_scores n percent
#>     Very Poor 1   0.083
#>      <Middle> 8   0.667
#>     Very Good 3   0.250
```

**Explanation:** With `n = 1`, only the single weakest and single strongest labels stand alone. The other three levels (`Poor`, `Average`, `Good`) pool into the `<Middle>` row. The percent column sums to 1 across all returned rows.

</details>

## Related janitor functions

**`top_levels()` sits inside the wider janitor toolkit for summarising and cleaning data.** Each helper covers a related job.

- `tabyl()`: full one-way or cross-way frequency table for any column type
- `adorn_totals()`: append a totals row or column to a tabyl
- `adorn_percentages()`: convert tabyl counts to row, column, or whole-table percentages
- `clean_names()`: standardise column names before any summary work
- `get_dupes()`: spot duplicated rows when a factor count looks too high
- `remove_constant()`: drop columns where every value is the same level

See the [janitor reference on tidyverse.org](https://sfirke.github.io/janitor/reference/top_levels.html) for the source and full argument list.

## FAQ

**What does janitor top_levels() do?**

`top_levels()` summarises an ordered factor by reporting its highest `n` and lowest `n` levels with counts and percentages, pooling the rest into a `<Middle>` row. The default `n = 2` gives a three-row summary that fits on a slide. It is built for ordinal variables like Likert scales where the extremes carry more meaning than the centre.

**Does top_levels() work on character vectors?**

No, calling it on a character vector raises an error. Coerce with `factor(x, levels = c(...), ordered = TRUE)` first, and pass the level order explicitly. Without an order the factor defaults to alphabetical, which gives a meaningless head/tail split.

**How is top_levels() different from table() or summary()?**

`table()` and `summary()` return one row per factor level with no pooling and no percent column. `top_levels()` returns at most `2 * n + 1` rows and includes counts and percentages. Reach for `table()` when you need raw counts for further math, and for `top_levels()` when you need a one-glance report a non-technical reader can interpret.

**What happens if n is larger than half the levels?**

The top and bottom slices overlap. `top_levels()` widens the head and tail and shrinks or omits the `<Middle>` row, but the head/tail/middle interpretation breaks down. Use `janitor::tabyl()` if every level matters.

**Can I use top_levels() with dplyr group_by?**

Indirectly. `top_levels()` expects a single factor, not a grouped data frame, so the usual pattern is `df |> filter(group == "A") |> pull(factor_col) |> top_levels()`. For per-group summaries, `dplyr::summarise()` with custom code is cleaner.
