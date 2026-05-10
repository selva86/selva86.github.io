---
title: "ggplot2 geom_col() in R: Bar Charts From Pre-Computed Heights"
slug: "ggplot2-geom_col-in-R"
description: "Use ggplot2 geom_col() to build bar charts where bar height is pre-computed in R. Covers vs geom_bar, fill, position, theme, and 5 worked examples."
keywords: "ggplot2 geom_col, R bar chart geom_col, geom_col vs geom_bar, ggplot2 column chart, geom_col fill, geom_col position"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "ggplot2-functions"
fr_parent: "ggplot2-Tutorial-With-R.html"
auto_link_terms: "geom_col()|ggplot2 geom_col|bar chart precomputed|geom_col vs geom_bar|column chart"
auto_link_case_sensitive: true
target_keyword: "ggplot2 geom_col"
sibling_block_enabled: true
difficulty: "Beginner"
---

# ggplot2 geom_col() in R: Bar Charts From Pre-Computed Heights

<p class="lead">The <code>geom_col()</code> function in ggplot2 draws bar charts where the bar HEIGHT is taken directly from a y aesthetic. It is the right choice when you have pre-computed totals or values, unlike <code>geom_bar()</code> which counts rows.</p>

[QUICK ANSWER]
ggplot(df, aes(x, y)) + geom_col()
ggplot(df, aes(x, y, fill = group)) + geom_col(position = "dodge")
ggplot(df, aes(x, y, fill = group)) + geom_col(position = "stack")
ggplot(df, aes(x, y, fill = group)) + geom_col(position = "fill")  # 100% stacked
ggplot(df, aes(x, y)) + geom_bar(stat = "identity")  # equivalent to geom_col

[DECISION TREE: geom_col or geom_bar?]
- pre-computed height (y aesthetic): geom_col()
- count of rows per category: geom_bar() (default stat = "count")
- want to override stat: geom_bar(stat = ...)
- horizontal bars: geom_col() + coord_flip() or aes(y, x)

## What geom_col() does in one sentence

**`geom_col()` draws a bar chart where each bar's height is the y-aesthetic value from the data.** Unlike geom_bar (which counts rows by default), geom_col uses the values you provide directly.

## Syntax

**`geom_col(mapping = NULL, data = NULL, position = "stack", ...)`. Default position is "stack".**

```r title="Bar chart of pre-computed totals"
library(ggplot2)
library(dplyr)

mtcars |>
  count(cyl) |>
  ggplot(aes(factor(cyl), n)) +
  geom_col()
```

[TIP]
**Use `geom_col` when y is a value (height); use `geom_bar` when y comes from counting.** Both produce bars; the difference is what's on the y axis.

## Five common patterns

### 1. Standard column chart

```r title="Pre-computed counts"
mtcars |>
  count(cyl) |>
  ggplot(aes(factor(cyl), n)) +
  geom_col()
```

### 2. Filled by group

```r title="Color bars by another variable"
mtcars |>
  count(cyl, gear) |>
  ggplot(aes(factor(cyl), n, fill = factor(gear))) +
  geom_col()
```

Default position is "stack".

### 3. Dodged bars

```r title="Side-by-side instead of stacked"
mtcars |>
  count(cyl, gear) |>
  ggplot(aes(factor(cyl), n, fill = factor(gear))) +
  geom_col(position = "dodge")
```

### 4. 100% stacked

```r title="Proportions"
mtcars |>
  count(cyl, gear) |>
  ggplot(aes(factor(cyl), n, fill = factor(gear))) +
  geom_col(position = "fill")
```

### 5. Horizontal bars

```r title="Flip axes"
mtcars |>
  count(cyl) |>
  ggplot(aes(n, factor(cyl))) +
  geom_col()
```

[KEY INSIGHT]
**`geom_col()` is `geom_bar(stat = "identity")` in disguise.** The two produce identical output for the same y values; geom_col is just shorter and clearer when you have pre-computed heights.

## geom_col() vs geom_bar() vs geom_histogram()

| Function | Default stat | Best for |
|---|---|---|
| `geom_col()` | identity | Pre-computed heights |
| `geom_bar()` | count | Frequency of categories |
| `geom_histogram()` | bin | Numeric distribution |

When to use which:

- geom_col when y is your data's value.
- geom_bar when y should be a count of rows.
- geom_histogram for numeric x with binning.

## A practical workflow

**The "summarise then plot" pattern uses geom_col directly.**

```r
sales |>
  group_by(quarter) |>
  summarise(total = sum(revenue)) |>
  ggplot(aes(quarter, total)) +
  geom_col() +
  scale_y_continuous(labels = scales::comma)
```

Compute totals first, then plot. geom_col plots the totals directly.

## Common pitfalls

**Pitfall 1: forgetting y is value not count.** geom_col EXPECTS a y aesthetic with values. If you pass count-style data without aggregation, you'll plot wrong heights.

**Pitfall 2: factor ordering.** Bars appear in alphabetical / factor-level order. Use `forcats::fct_reorder` to sort by value.

[WARNING]
**Default position for `geom_col()` (and `geom_bar()`) is "stack".** When you have multiple bars at the same x, they stack. For side-by-side, pass `position = "dodge"`.

## Try it yourself

**Try it:** Plot a bar chart of mean mpg per cyl. Save to `ex_plot`.

```r title="Your turn: mean mpg per cyl"
ex_plot <- mtcars |>
  group_by(cyl) |>
  summarise(mean_mpg = mean(mpg)) |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_plot <- mtcars |>
  group_by(cyl) |>
  summarise(mean_mpg = mean(mpg)) |>
  ggplot(aes(factor(cyl), mean_mpg)) +
  geom_col() +
  labs(x = "Cylinders", y = "Mean MPG")
```

**Explanation:** Compute mean per cyl, then plot directly with geom_col.

</details>

## Related ggplot2 functions

After mastering geom_col, look at:

- `geom_bar()`: count-based bars
- `geom_histogram()`: numeric distribution
- `geom_point()`: scatter
- `position_dodge()` / `position_stack()` / `position_fill()`: positioning
- `coord_flip()`: rotate axes

## FAQ

**What does geom_col do in ggplot2?**

`geom_col()` draws bar charts where each bar's height comes directly from the y aesthetic. Equivalent to `geom_bar(stat = "identity")`.

**What is the difference between geom_col and geom_bar?**

geom_col uses identity stat (height from y). geom_bar defaults to count stat (height from row count). Use geom_col for pre-computed values; geom_bar for raw counting.

**How do I make bars side by side?**

Pass `position = "dodge"`: `geom_col(position = "dodge")`. Default is stack.

**How do I sort bars by value?**

Use `forcats::fct_reorder(category, value)` for the x aesthetic. ggplot draws factor levels in order.

**Can I make horizontal bars with geom_col?**

Yes. Either swap aesthetics: `aes(value, category)`, or chain `+ coord_flip()` after.
