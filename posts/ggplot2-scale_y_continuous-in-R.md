---
title: "ggplot2 scale_y_continuous() in R: Customize the Y Axis"
slug: "ggplot2-scale_y_continuous-in-R"
description: "Use ggplot2 scale_y_continuous() to customize the y-axis breaks, labels, limits, and transformations in R. Covers scales package, breaks, 5 examples."
keywords: "ggplot2 scale_y_continuous, R y axis breaks, scale_y_continuous labels, scale_y_continuous limits, dollar format axis"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "ggplot2-functions"
fr_parent: "ggplot2-Tutorial-With-R.html"
auto_link_terms: "scale_y_continuous()|ggplot2 scale_y_continuous|y axis breaks|y axis labels|continuous y scale"
auto_link_case_sensitive: true
target_keyword: "ggplot2 scale_y_continuous"
sibling_block_enabled: true
difficulty: "Beginner"
---

# ggplot2 scale_y_continuous() in R: Customize the Y Axis

<p class="lead">The <code>scale_y_continuous()</code> function in ggplot2 customizes the Y axis on plots with a continuous (numeric) y mapping. It is the y-axis sister of <code>scale_x_continuous()</code>.</p>

[QUICK ANSWER]
+ scale_y_continuous(breaks = seq(0, 100, 10))
+ scale_y_continuous(labels = scales::dollar)
+ scale_y_continuous(limits = c(0, 50))
+ scale_y_continuous(trans = "log10")
+ scale_y_continuous(name = "Revenue ($)")

[DECISION TREE: Is scale_y_continuous() the right tool?]
- numeric y axis customization: scale_y_continuous()
- log-scale y: scale_y_log10()
- discrete y: scale_y_discrete()
- date y: scale_y_date()
- secondary axis: scale_y_continuous(sec.axis = ...)

## What scale_y_continuous() does in one sentence

**`scale_y_continuous()` controls the Y axis: breaks (tick positions), labels (tick text), limits (range), transformations.** Identical to scale_x_continuous but for y.

## Syntax

**`scale_y_continuous(name = waiver(), breaks = waiver(), labels = waiver(), limits = NULL, trans = "identity", sec.axis = waiver(), ...)`.**

```r title="Dollar-formatted y axis"
library(ggplot2)
library(scales)

ggplot(economics, aes(date, unemploy)) +
  geom_line() +
  scale_y_continuous(
    breaks = seq(0, 16000, 4000),
    labels = comma
  )
```

[TIP]
**Use `scales::dollar` / `scales::comma` / `scales::percent` for common label formats.** They're functions, not strings.

## Five common patterns

### 1. Custom breaks

```r title="Tick every 1000"
+ scale_y_continuous(breaks = seq(0, 10000, 1000))
```

### 2. Dollar-formatted labels

```r title="Money axis"
+ scale_y_continuous(labels = scales::dollar)
```

### 3. Percent labels

```r title="Proportion to %"
+ scale_y_continuous(labels = scales::percent)
```

### 4. Log scale

```r title="Log y"
+ scale_y_log10(labels = scales::comma)
```

### 5. Secondary y axis

```r title="Two y scales"
+ scale_y_continuous(
    name = "Primary (count)",
    sec.axis = sec_axis(~ . / 100, name = "Secondary (%)")
)
```

[KEY INSIGHT]
**For a secondary axis, both must be linearly related.** ggplot intentionally restricts dual y-axes to discourage misleading visualizations.

## scale_y_continuous() vs scale_y_log10() vs coord_cartesian

| Function | Best for |
|---|---|
| `scale_y_continuous()` | General y customization |
| `scale_y_log10()` | Shortcut for log y |
| `scale_y_sqrt()` | Square-root y |
| `coord_cartesian(ylim)` | Zoom without dropping data |

## A practical workflow

**Combine breaks, labels, and trans for production-ready axes.**

```r
ggplot(sales, aes(month, revenue)) +
  geom_col() +
  scale_y_continuous(
    name = "Revenue (USD)",
    breaks = seq(0, 100000, 20000),
    labels = scales::dollar,
    expand = expansion(mult = c(0, 0.1))
  )
```

Dollar formatting + breaks + tight bottom expansion.

## Common pitfalls

**Pitfall 1: limits drops data.** Use `coord_cartesian(ylim = c(0, 100))` to zoom without dropping.

**Pitfall 2: dual axes can mislead.** ggplot's `sec.axis` allows it but only with a linear transformation; don't combine unrelated scales.

[WARNING]
**`scale_y_continuous(limits = ...)` DROPS data outside; `coord_cartesian(ylim = ...)` ZOOMS only.** Use coord_cartesian when stats need the full data.

## Try it yourself

**Try it:** Plot mtcars wt vs hp with y axis log-transformed and comma labels. Save to `ex_plot`.

```r title="Your turn: log y with commas"
library(scales)

ex_plot <- mtcars |>
  ggplot(aes(wt, hp)) +
  geom_point() +
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_plot <- ggplot(mtcars, aes(wt, hp)) +
  geom_point() +
  scale_y_log10(labels = comma)
```

**Explanation:** scale_y_log10 with comma formatting.

</details>

## Related ggplot2 functions

After mastering scale_y_continuous, look at:

- `scale_x_continuous()`: same for x
- `scale_y_log10()` / `scale_y_sqrt()`: shortcuts
- `scale_y_date()`: time-axis y
- `scale_y_discrete()`: discrete y
- `coord_cartesian(ylim)`: zoom only
- `expand` / `expansion()`: control axis padding

## FAQ

**What does scale_y_continuous do in ggplot2?**

`scale_y_continuous()` customizes the Y axis when y is continuous numeric: breaks, labels, limits, transformations.

**How do I add a secondary y axis?**

Pass `sec.axis = sec_axis(~ . / 100, name = "...")`. The transformation must be linear.

**What is the difference between scale_y_continuous limits and coord_cartesian?**

limits drops data outside. coord_cartesian zooms only. Use coord_cartesian for stats integrity.

**How do I format y as dollars?**

`scale_y_continuous(labels = scales::dollar)`. Use `comma`, `percent` similarly.

**Can I log-transform with scale_y_continuous?**

Yes: `scale_y_continuous(trans = "log10")`. Or use `scale_y_log10()` as a shortcut.
