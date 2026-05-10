---
title: "ggplot2 geom_bar() vs geom_col() in R: Bar Charts Made Easy"
slug: "ggplot2-geom_bar-in-R"
description: "Use ggplot2 geom_bar() and geom_col() to build bar charts in R. Covers stacked, grouped (dodged), horizontal bars, sorted bars, and 7 worked examples."
keywords: "geom_bar, geom_col, ggplot2 bar chart, bar plot in R, stacked bar ggplot2, grouped bar ggplot2, horizontal bar chart"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "ggplot2-functions"
fr_parent: "ggplot2-Tutorial-With-R.html"
auto_link_terms: "geom_bar()|geom_col()|ggplot2 bar chart|bar plot ggplot2|stacked bar chart"
auto_link_case_sensitive: true
target_keyword: "geom_bar"
sibling_block_enabled: true
difficulty: "Beginner"
---

# ggplot2 geom_bar() vs geom_col() in R: Bar Charts Made Easy

<p class="lead">The <code>geom_bar()</code> function in ggplot2 counts rows by category and draws bars; <code>geom_col()</code> uses values you provide directly. Use geom_bar for frequency tables, geom_col for pre-aggregated data.</p>

[QUICK ANSWER]
ggplot(df, aes(x = category)) + geom_bar()                          # count rows
ggplot(df, aes(x = category, y = value)) + geom_col()               # use y values
ggplot(df, aes(x = category, fill = group)) + geom_bar()            # stacked
ggplot(df, aes(x = category, fill = group)) + geom_bar(position = "dodge")  # grouped
ggplot(df, aes(x = category, fill = group)) + geom_bar(position = "fill")   # 100% stacked
ggplot(df, aes(x, y)) + geom_col() + coord_flip()                   # horizontal
ggplot(df, aes(x = reorder(category, -count), y = count)) + geom_col()  # sorted

[DECISION TREE: Is geom_bar() the right tool?]
- count rows per category: geom_bar()
- use a precomputed value column: geom_col()
- stacked bars: geom_bar(position = "stack") (default)
- side-by-side bars: geom_bar(position = "dodge")
- 100%-stacked: geom_bar(position = "fill")
- horizontal bars: geom_col() + coord_flip()
- show distribution (continuous x): geom_histogram()

## What geom_bar() and geom_col() do in one sentence

**`geom_bar()` counts rows in each x category and draws a bar of that height; `geom_col()` uses the y values you provide directly without counting.** They produce identical-looking output but expect different inputs: geom_bar wants raw rows; geom_col wants pre-aggregated `(category, value)` pairs.

If you find yourself writing `geom_bar(stat = "identity")`, you actually want `geom_col()`. They are equivalent but `geom_col()` is the modern, less-confusing form.

## Syntax

**Both functions take an `aes()` mapping. `geom_bar()` requires only `x`; `geom_col()` requires both `x` and `y`.**

```r title="Load ggplot2 and set up data"
library(ggplot2)

library(forcats)
library(scales)
# Raw row data (one row per observation)
mpg_subset <- mpg[, c("class", "manufacturer")]

# Pre-aggregated data (one row per category)
class_counts <- as.data.frame(table(mpg$class))
names(class_counts) <- c("class", "n")
```

The full signatures:

```
geom_bar(mapping = NULL, data = NULL, stat = "count", position = "stack",
         ..., width = NULL, na.rm = FALSE, orientation = NA, show.legend = NA,
         inherit.aes = TRUE)
geom_col(mapping = NULL, data = NULL, position = "stack", ...)
```

[TIP]
**Use `geom_col()` whenever you have pre-aggregated data.** `geom_bar(stat = "identity")` produces the same result but is harder to read. `geom_col` is the cleaner alternative introduced in ggplot2 2.2+.

## Seven common patterns

### 1. Count rows with geom_bar

```r title="Count cars per class"
ggplot(mpg, aes(x = class)) +
  geom_bar(fill = "steelblue")
```

`geom_bar()` calls `stat = "count"` internally, tallying rows per `class`. No y aesthetic needed.

### 2. Use precomputed values with geom_col

```r title="Use a value column directly"
ggplot(class_counts, aes(x = class, y = n)) +
  geom_col(fill = "darkorange")
```

`geom_col()` plots y as bar height. Use this when you have a frequency table or any table with one row per category.

### 3. Stacked bars with fill aesthetic

```r title="Stack by drivetrain within class"
ggplot(mpg, aes(x = class, fill = drv)) +
  geom_bar()
```

`fill = drv` automatically stacks bars colored by drivetrain. Total bar height = total count per class.

### 4. Side-by-side (dodged) bars

```r title="Grouped bars with position = dodge"
ggplot(mpg, aes(x = class, fill = drv)) +
  geom_bar(position = "dodge")
```

`position = "dodge"` places each fill group's bar SIDE-BY-SIDE instead of stacked. Useful for comparing magnitudes across groups within each x category.

### 5. 100% stacked bars

```r title="Proportion of each drivetrain per class"
ggplot(mpg, aes(x = class, fill = drv)) +
  geom_bar(position = "fill") +
  scale_y_continuous(labels = scales::percent)
```

`position = "fill"` makes every bar reach 1.0 (or 100%). Inside each bar, fill segments show PROPORTIONS of each group within that x category.

### 6. Horizontal bars

```r title="Flip x and y for horizontal bars"
ggplot(mpg, aes(x = class)) +
  geom_bar() +
  coord_flip()
```

`coord_flip()` swaps x and y. Useful when category labels are long and would overlap on a vertical axis.

### 7. Sorted bars

```r title="Order bars by count"
ggplot(mpg, aes(x = forcats::fct_infreq(class))) +
  geom_bar() +
  coord_flip()
```

`fct_infreq()` from forcats reorders the factor levels by descending frequency. Combined with `coord_flip()`, this produces a clean ranked horizontal bar chart.

[KEY INSIGHT]
**`geom_bar()` and `geom_col()` are nearly identical visually but their INPUT differs.** geom_bar expects raw row data and counts internally. geom_col expects pre-aggregated values. Reach for whichever matches your data: row-level → geom_bar; aggregated → geom_col.

## geom_bar() / geom_col() vs base R barplot()

**Base R `barplot()` works on tables/vectors; ggplot2's bar geoms work on data frames with grouping baked in.**

| Task | ggplot2 | Base R |
|---|---|---|
| Count rows per category | `aes(x=cat) + geom_bar()` | `barplot(table(df$cat))` |
| Pre-aggregated values | `aes(x, y) + geom_col()` | `barplot(values, names = labels)` |
| Stacked | `aes(fill=grp) + geom_bar()` | `barplot(table(df$grp, df$cat))` |
| Grouped (dodged) | `position = "dodge"` | `beside = TRUE` |
| Horizontal | `+ coord_flip()` | `horiz = TRUE` |
| Sort by value | `aes(x = reorder(...))` | sort + barplot |

When to use which:

- Use ggplot2 for grouped, faceted, or publication bar charts.
- Use base `barplot()` for one-line frequency plots.

## Common pitfalls

**Pitfall 1: using geom_bar with pre-aggregated data.** If your data is already `(category, value)`, geom_bar will try to COUNT rows, ignoring your y values. Use `geom_col()` or `geom_bar(stat = "identity", aes(y = value))`.

**Pitfall 2: fill vs color confusion.** Bar charts use `fill` for the inside color and `color` for the outline. `aes(color = group)` only changes outlines; `aes(fill = group)` changes the bar interiors.

[WARNING]
**Stacked vs dodged matters for interpretation.** Stacked bars show TOTAL per category and PROPORTIONS within. Dodged bars compare ABSOLUTE values across groups. 100%-stacked compares PROPORTIONS only. Picking the wrong one misleads readers.

**Pitfall 3: x axis ordering.** ggplot orders categorical x alphabetically by default. To reorder by frequency: `aes(x = forcats::fct_infreq(class))`. By a value column: `aes(x = reorder(category, -value))`.

## Try it yourself

**Try it:** Build a horizontal bar chart from `mpg` showing the COUNT of cars per `manufacturer`, sorted from highest to lowest count. Save to `ex_plot`.

```r title="Your turn: ranked horizontal bars"
# Try it: count + sort + flip
ex_plot <- ggplot(mpg, aes(x = # your code here
                            )) +
  geom_bar() +
  coord_flip()

print(ex_plot)
#> Expected: horizontal bar chart, longest bar at top
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_plot <- ggplot(mpg, aes(x = forcats::fct_infreq(manufacturer))) +
  geom_bar(fill = "steelblue") +
  coord_flip() +
  labs(x = "Manufacturer", y = "Count")

print(ex_plot)
```

**Explanation:** `fct_infreq()` orders factor levels by descending frequency. After `coord_flip()`, the highest-frequency manufacturer appears at the TOP of the y axis (visually at the top of the chart).

</details>

## Related ggplot2 functions

After mastering `geom_bar()` and `geom_col()`, look at:

- `geom_histogram()`: bar-like display for continuous x (binned)
- `geom_freqpoly()`: line version of a histogram
- `geom_text()`: annotate bars with their values
- `position_dodge()`, `position_stack()`, `position_fill()`: explicit position controls
- `forcats::fct_reorder()`, `fct_infreq()`: factor-level ordering helpers
- `scale_y_continuous(labels = scales::percent)`: format y as percentages

For pictogram-style displays, the `waffle` package extends ggplot2 with `geom_waffle()`.

## FAQ

**What is the difference between geom_bar and geom_col in ggplot2?**

`geom_bar()` counts the number of rows in each x category. `geom_col()` uses values from a y column directly. If your data has one row per observation, use geom_bar. If you have pre-aggregated `(category, value)` pairs, use geom_col.

**How do I make a stacked bar chart in ggplot2?**

Map `fill = group` inside `aes()`: `geom_bar(aes(fill = group))`. Default position is "stack". For side-by-side bars, add `position = "dodge"`. For 100%-stacked, use `position = "fill"`.

**How do I sort bars in ggplot2 by count or value?**

By count (frequency): `aes(x = forcats::fct_infreq(category))` then `geom_bar()`. By value: `aes(x = reorder(category, -value))` then `geom_col()`. Add `coord_flip()` for horizontal sorted bars (often more readable for long labels).

**How do I add value labels to bars in ggplot2?**

Add `geom_text()` after `geom_col()`: `+ geom_text(aes(label = value), vjust = -0.3)`. The `vjust` controls vertical position relative to the bar top.

**How do I make horizontal bars in ggplot2?**

Add `coord_flip()` after the bar geom: `geom_bar() + coord_flip()`. Newer ggplot2 versions also support `aes(y = category)` directly which auto-flips. Use whichever feels cleaner.
