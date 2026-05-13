---
title: "ggplot2 labs() in R: Title, Subtitle, Caption and Axes"
slug: "ggplot2-labs-in-R"
description: "Master ggplot2 labs() in R to set title, subtitle, caption, axis labels, tag, and legend titles in one call. Includes 6 examples and accessibility tips."
keywords: "ggplot2 labs, ggplot2 title, ggplot2 subtitle, ggplot2 caption, ggplot2 axis labels, labs() vs ggtitle, ggplot2 tag, ggplot2 legend title"
mathjax: false
webr: true
date: "2026-05-14"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "ggplot2-functions"
fr_parent: "ggplot2-Tutorial-With-R.html"
auto_link_terms: "labs()|ggplot2 labs|ggplot2 title|ggplot2 subtitle|ggplot2 caption|ggplot2 axis labels|labs() vs ggtitle"
auto_link_case_sensitive: true
target_keyword: "ggplot2 labs"
sibling_block_enabled: true
difficulty: "Beginner"
---

# ggplot2 labs() in R: Title, Subtitle, Caption and Axes

<p class="lead">The <code>labs()</code> function in ggplot2 sets every text label on a plot, title, subtitle, caption, tag, axis names, and legend titles, in a single call. It is the modern replacement for <code>ggtitle()</code>, <code>xlab()</code> and <code>ylab()</code>.</p>

[QUICK ANSWER]
labs(title = "Main title")                   # plot title
labs(subtitle = "Below title")               # subtitle line
labs(caption = "Source: mtcars")             # bottom-right caption
labs(x = "Weight (1000 lbs)", y = "MPG")     # axis labels
labs(tag = "Fig. 1")                         # top-left tag
labs(color = "Cylinders")                    # legend title
labs(alt = "Scatter of mpg vs weight")       # accessibility alt text

[DECISION TREE: Is labs() the right tool?]
- set any plot label: labs(title = ..., x = ..., y = ...)
- only the title, terse: ggtitle("My title")
- only one axis label: xlab("x") or ylab("y")
- annotate INSIDE the plot: annotate("text", ...)
- rotate axis labels: theme(axis.text.x = element_text(angle = 45))
- relabel category values: scale_x_discrete(labels = c(...))
- format numeric labels: scale_y_continuous(labels = scales::comma)

## What labs() does in one sentence

**`labs()` is the one function for every plot label in ggplot2.** It accepts arguments for title, subtitle, caption, tag, axis names, alt text, and any aesthetic that drives a legend (color, fill, size, shape, linetype). Passing `NULL` to any argument removes that label.

## Syntax

**`labs(title = NULL, subtitle = NULL, caption = NULL, tag = NULL, alt = NULL, x = NULL, y = NULL, ...)`. The `...` slot accepts any aesthetic name to override its legend title.**

```r title="Set every label in one call"
library(ggplot2)

ggplot(mtcars, aes(wt, mpg, color = factor(cyl))) +
  geom_point() +
  labs(
    title    = "Fuel efficiency drops as cars get heavier",
    subtitle = "32 cars from the 1974 Motor Trend road tests",
    caption  = "Source: mtcars dataset",
    x        = "Weight (1000 lbs)",
    y        = "Miles per gallon",
    color    = "Cylinders",
    tag      = "Fig. 1"
  )
```

[TIP]
**Write the title as the chart's takeaway, not its description.** "Fuel efficiency drops as cars get heavier" beats "MPG vs weight" because Google snippets and chart consumers retain the conclusion, not the axes.

## Six common patterns

### 1. Title only

```r title="Just a title"
ggplot(mtcars, aes(wt, mpg)) +
  geom_point() +
  labs(title = "Fuel economy by car weight")
```

### 2. Title plus subtitle

```r title="Two-line header"
ggplot(mtcars, aes(wt, mpg)) +
  geom_point() +
  labs(
    title    = "Heavier cars are less efficient",
    subtitle = "1974 Motor Trend road tests, n = 32"
  )
```

### 3. Axis labels with units

```r title="Always include units"
ggplot(mtcars, aes(wt, mpg)) +
  geom_point() +
  labs(x = "Weight (1000 lbs)", y = "Miles per gallon (US)")
```

### 4. Caption for the data source

```r title="Source credit"
ggplot(economics, aes(date, unemploy)) +
  geom_line() +
  labs(
    title   = "US unemployment over time",
    caption = "Source: economics dataset, ggplot2"
  )
```

### 5. Override a legend title

```r title="Rename the legend"
ggplot(iris, aes(Sepal.Length, Sepal.Width, color = Species)) +
  geom_point() +
  labs(color = "Iris species")
```

### 6. Remove a default label

```r title="Drop the y axis label"
ggplot(mtcars, aes(wt, mpg)) +
  geom_point() +
  labs(y = NULL)
```

[KEY INSIGHT]
**The names in `labs(...)` must match the aesthetic names in `aes(...)`.** If you map `aes(color = cyl)`, the legend title is set by `labs(color = "...")`. Mismatch the name and ggplot2 silently keeps the default.

## labs() vs ggtitle() vs xlab() vs ylab()

**`labs()` consolidates four older helpers into one call.** Each shortcut still works, but every label lives in one place when you use `labs()`.

| Function | Sets | When to use |
|---|---|---|
| `labs()` | All labels at once | Default; one place to edit every text element |
| `ggtitle()` | Title (and optional subtitle) | Quick one-off title |
| `xlab()` | X axis only | Single-axis tweak |
| `ylab()` | Y axis only | Single-axis tweak |

Mixing them works (each writes its own slot), but a single `labs()` call is easier to maintain than four scattered calls. The official ggplot2 reference at [ggplot2.tidyverse.org/reference/labs.html](https://ggplot2.tidyverse.org/reference/labs.html) treats the shorter forms as wrappers around `labs()`.

[NOTE]
**Coming from base R?** `labs(title = "...", x = "...", y = "...")` replaces the `main`, `xlab`, and `ylab` arguments of `plot()` and the `xlab`/`ylab`/`main` arguments of `hist()`.

## Common pitfalls

**Pitfall 1: wrong aesthetic name.** `aes(colour = cyl)` (British spelling) needs `labs(colour = "...")`, not `labs(color = "...")`. ggplot2 accepts both spellings in `aes()`, but `labs()` argument names must match the spelling you used.

**Pitfall 2: titles overflow narrow plots.** A long title gets clipped when the plot is exported small. Add `\n` for a manual line break, or use `theme(plot.title = element_text(size = 12))` to shrink it.

**Pitfall 3: `alt` is invisible in standalone plots.** The `alt` argument is read by screen readers when the plot is embedded in a Quarto, R Markdown, or Shiny output. It does not display visually. Set it anyway for accessibility.

[WARNING]
**`labs(title = "")` is not the same as `labs(title = NULL)`.** An empty string keeps the title slot and leaves a blank gap above the plot. `NULL` removes the slot entirely.

## Try it yourself

**Try it:** Plot `wt` vs `mpg` from `mtcars`, colored by `factor(cyl)`. Add a takeaway-style title, a subtitle naming the dataset, units on both axes, and rename the legend to "Cylinders". Save the plot to `ex_plot`.

```r title="Your turn: label every slot"
ex_plot <- ggplot(mtcars, aes(wt, mpg, color = factor(cyl))) +
  geom_point() +
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_plot <- ggplot(mtcars, aes(wt, mpg, color = factor(cyl))) +
  geom_point() +
  labs(
    title    = "Heavier cars burn more fuel",
    subtitle = "mtcars, 1974 Motor Trend",
    x        = "Weight (1000 lbs)",
    y        = "Miles per gallon",
    color    = "Cylinders"
  )
ex_plot
```

**Explanation:** One `labs()` call sets all five text slots. The legend title matches the `color` aesthetic in `aes()`.

</details>

## Related ggplot2 functions

After mastering `labs()`, look at:

- `ggtitle()`: title-only shortcut
- `xlab()`, `ylab()`: single-axis shortcuts
- `theme()`: control font size, color, and position of every label
- `scale_x_continuous(labels = ...)`: format axis tick labels
- `annotate()`: add text inside the plot panel

## FAQ

**What does labs() do in ggplot2?**

`labs()` sets the title, subtitle, caption, tag, axis labels, alt text, and any legend title in a single call. It is the unified labels function, replacing the older `ggtitle()`, `xlab()`, and `ylab()` shortcuts. You can override any single slot or remove it by passing `NULL`.

**What is the difference between labs() and ggtitle()?**

`ggtitle()` only sets the title (and optionally the subtitle). `labs()` sets every label on the plot. If you only need a title, both work; if you need multiple labels, `labs()` keeps them in one place. The ggplot2 source defines `ggtitle()` as a thin wrapper around `labs()`.

**How do I add a subtitle in ggplot2?**

Pass `subtitle = "..."` to `labs()`. The subtitle renders below the title in a slightly smaller, lighter font. To style it further, add `theme(plot.subtitle = element_text(face = "italic"))`.

**How do I change the legend title?**

The legend title is controlled by the aesthetic name. If you mapped `aes(color = group)`, write `labs(color = "Group")`. The argument name must match the aesthetic (color, fill, size, shape, linetype, alpha).

**How do I remove the x axis label?**

Pass `NULL`: `labs(x = NULL)`. Passing an empty string (`x = ""`) leaves an empty slot that still consumes vertical space.

**Can I set alt text for accessibility?**

Yes. Pass `alt = "..."`. The alt text is read by screen readers when the plot is embedded in HTML output from Quarto, R Markdown, or Shiny. It does not show on the plot itself.
