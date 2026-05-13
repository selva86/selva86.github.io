---
title: "ggplot2 ylab() in R: Set the Y Axis Label"
slug: "ggplot2-ylab-in-R"
description: "Use ggplot2 ylab() in R to set, change, or remove the y axis label. Covers units, multi-line wrapping, plotmath expressions, ylab vs labs, and 6 examples."
keywords: "ylab, ggplot2 ylab, ggplot2 y axis label, change y axis label ggplot, ggplot2 remove y label, ylab vs labs, ggplot2 ylab expression, ylab NULL"
mathjax: false
webr: true
date: "2026-05-14"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "ggplot2-functions"
fr_parent: "ggplot2-Tutorial-With-R.html"
auto_link_terms: "ylab()|ggplot2 ylab|ggplot2 y axis label|change y axis label|remove y axis label|ylab vs labs"
auto_link_case_sensitive: true
target_keyword: "ggplot2 ylab"
sibling_block_enabled: true
difficulty: "Beginner"
---

# ggplot2 ylab() in R: Set the Y Axis Label

<p class="lead">The <code>ylab()</code> function in ggplot2 sets the y axis label of a plot in a single short call. It is the single-axis shortcut for <code>labs(y = ...)</code>, useful when only the y axis title needs to change and every other label should be left alone.</p>

[QUICK ANSWER]
ylab("Miles per gallon")                             # set the y axis label
ylab(NULL)                                           # remove the y axis label
ylab("")                                             # keep slot, blank text
ylab("Fuel economy\n(miles per gallon)")             # multi-line y label
ylab(expression(MPG~(mu*g/L)))                       # math expression label
p + ylab("MPG") + theme(axis.title.y = element_text(face = "bold"))   # bold
labs(y = "Miles per gallon")                         # the long form

[DECISION TREE: Is ylab() the right tool?]
- only the y axis label: ylab("Miles per gallon")
- only the x axis label: xlab("Weight (1000 lbs)")
- y, x and title in one call: labs(y = ..., x = ..., title = ...)
- style the label font, color, or angle: theme(axis.title.y = element_text(...))
- format the tick numbers, not the label: scale_y_continuous(labels = scales::comma)
- label a secondary right-side axis: scale_y_continuous(sec.axis = sec_axis(...))
- relabel category levels on the axis: scale_y_discrete(labels = c(...))
- the plot title or subtitle: ggtitle("My title")

## What ylab() does in one sentence

**`ylab()` writes the y axis title slot of a ggplot2 plot, and only that slot.** Every other label (x axis, plot title, subtitle, caption, tag, legend) needs `xlab()`, `ggtitle()`, or `labs()` to set it.

It is a thin wrapper around `labs(y = ...)`. The two calls `ylab("MPG")` and `labs(y = "MPG")` produce identical output. Reach for `ylab()` when the y axis label is the only thing changing on the plot, because the call reads as a single intent.

## Syntax

**`ylab(label)`. The single argument is the text shown to the left of the y axis.** Pass a character string, `NULL` to remove the label, or an `expression()` for math notation.

```r title="Load ggplot2 and set a y axis label"
library(ggplot2)

p <- ggplot(mtcars, aes(wt, mpg)) + geom_point()

p + ylab("Miles per gallon")
```

The base plot `p` is reused across the next examples, so each block isolates the y-label change.

[TIP]
**Always include units in the y axis label.** "Miles per gallon" or "Population (millions)" beats a bare "MPG" or "Population", because the reader does not have to guess the scale. Units in parentheses is the convention in scientific publishing and on dashboards.

## Six common ylab() patterns

### 1. Set a basic label

```r title="Plain text label"
p + ylab("Fuel economy")
```

### 2. Label with units in parentheses

```r title="Units make the label self-explanatory"
p + ylab("Fuel economy (miles per gallon)")
```

### 3. Remove the y axis label

```r title="Drop the label completely"
p + ylab(NULL)
```

`NULL` removes the slot and the plot reclaims the horizontal space to the left of the axis. An empty string (`ylab("")`) keeps the slot blank, leaving a gap.

### 4. Multi-line label via newline

```r title="Wrap a long y label across two lines"
p + ylab("Fuel economy\n(miles per gallon)")
```

A `\n` inside the string forces a line break. Wrapping the y label is more common than wrapping the x label, because vertical text on the left side has limited horizontal room before it starts crowding the plot.

### 5. Math notation via expression()

```r title="Subscripts, superscripts, Greek letters"
p + ylab(expression(Concentration~(mu*g/L)))
```

`expression()` accepts R's plotmath syntax. Use `~` for spaces, `^` for superscripts, `[]` for subscripts, and Greek names like `mu`, `sigma`, or `theta` for symbols. Run `?plotmath` for the full grammar.

### 6. ylab() works for discrete y axes too

```r title="The same call labels a factor axis"
ggplot(mtcars, aes(mpg, factor(cyl))) +
  geom_boxplot() +
  ylab("Number of cylinders")
```

There is no separate function for discrete axes. `ylab()` writes whatever the y axis is, continuous or discrete, log-scaled or linear.

[KEY INSIGHT]
**`ylab()` only writes text; it never styles.** Font weight, size, color, and rotation all live in `theme(axis.title.y = element_text(...))`. Keeping content (`ylab`) separate from presentation (`theme`) is the ggplot2 grammar's whole point.

## ylab() vs labs() vs xlab() vs ggtitle()

**`ylab()` is the single-axis shortcut; `labs()` covers every slot at once.** Pick `ylab()` when only the y label is changing, and `labs()` when the x label, plot title, or any other slot also needs an update.

| Function | Sets | When to reach for it |
|---|---|---|
| `ylab()` | Y axis label only | Single-axis tweak |
| `xlab()` | X axis label only | Single-axis tweak |
| `labs()` | Every label at once (x, y, title, subtitle, caption, tag, legend) | Multiple labels in one call |
| `ggtitle()` | Plot title (and optional subtitle) | Title-only edits |

Under the hood, every shortcut calls `labs()`. Mixing them in one plot works (each writes its own slot), but a single `labs()` call is easier to maintain than four scattered calls. See the official ggplot2 reference for [labs()](https://ggplot2.tidyverse.org/reference/labs.html).

[NOTE]
**Coming from base R?** `ylab("MPG")` replaces the `ylab` argument of `plot()`, `hist()`, and `boxplot()`. Unlike base R, the ggplot2 version is a separate layer added with `+`, so you can apply it conditionally or store it in a reusable object for theming.

## Common pitfalls

**Pitfall 1: confusing the label with the tick numbers.** `ylab()` controls the title to the left of the axis, not the numbers along it. To reformat the tick numbers (commas, percents, dollars), use `scale_y_continuous(labels = scales::comma)` or `scales::percent`.

**Pitfall 2: `ylab("")` leaves a blank gap.** An empty string keeps the slot and reserves horizontal space. Use `NULL` (`ylab(NULL)`) to remove the slot completely and let the plot reclaim the room.

**Pitfall 3: setting the label inside `aes()`.** Writing `aes(y = mpg)` only maps the column; it does not set the label. The label defaults to the column name (`"mpg"`), and you override it with `ylab("Miles per gallon")` or `labs(y = ...)`.

**Pitfall 4: forgetting that `coord_flip()` swaps the axes.** After `coord_flip()`, the y axis appears horizontally at the bottom, but `ylab()` still writes the original y slot. The label moves with the axis. Use `labs(x = ..., y = ...)` if the swap confuses readers, since the slot meaning is unchanged but the visual position is not.

**Pitfall 5: ylab() does not label a secondary axis.** A right-side secondary y axis is set by `scale_y_continuous(sec.axis = sec_axis(~ ., name = "Right label"))`. Calling `ylab()` only writes the primary (left) y axis.

[WARNING]
**Calling `ylab()` twice on the same plot overwrites the first call.** `p + ylab("A") + ylab("B")` shows "B". This is silent; there is no warning. The last layer wins for any label slot in ggplot2, so a single canonical `ylab()` call near the end of the plot pipeline avoids surprises.

## Try it yourself

**Try it:** Plot `wt` vs `mpg` from `mtcars`. Add a y axis label with units, an x axis label with units, and use `\n` to wrap the y label across two lines. Save the plot to `ex_ylabeled`.

```r title="Your turn: set both axis labels with a wrapped y label"
ex_ylabeled <- ggplot(mtcars, aes(wt, mpg)) +
  geom_point() +
  # your code here

ex_ylabeled
#> Expected: scatter with two-line "Fuel economy / (miles per gallon)" on y, "Weight (1000 lbs)" on x
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_ylabeled <- ggplot(mtcars, aes(wt, mpg)) +
  geom_point() +
  ylab("Fuel economy\n(miles per gallon)") +
  xlab("Weight (1000 lbs)")

ex_ylabeled
```

**Explanation:** `ylab()` writes the y slot and `xlab()` writes the x slot, each as a separate layer added with `+`. The `\n` inside the y label forces a line break so the long unit phrase fits without clipping the plot panel.

</details>

## Related ggplot2 functions

After mastering `ylab()`, look at:

- `xlab()`: the x axis equivalent
- `labs()`: set every label (x, y, title, subtitle, caption, tag, legend) in one call
- `ggtitle()`: the plot title shortcut
- `theme()`: control font size, color, weight, and angle of axis titles and tick text
- `scale_y_continuous(name = ...)`: an alternative way to set the y label that also lets you control breaks, limits, and tick formatting in the same call

## FAQ

**How do I change the y axis label in ggplot2?**

Use `ylab("Your label")` and add it to the plot with `+`. For example, `ggplot(mtcars, aes(wt, mpg)) + geom_point() + ylab("Miles per gallon")` renders a scatter plot with "Miles per gallon" to the left of the y axis. The `labs(y = "Miles per gallon")` form is equivalent and is preferred when the x label or plot title is being set in the same call.

**What is the difference between ylab() and labs() in ggplot2?**

`ylab()` sets only the y axis label; `labs()` sets every label on the plot, including x axis, title, subtitle, caption, tag, and legend titles. Both produce identical output when only the y slot is involved, because `ylab()` is defined as a thin wrapper around `labs(y = ...)`. Use `ylab()` for single-axis tweaks and `labs()` when several slots change in one call.

**How do I remove the y axis label in ggplot2?**

Pass `NULL`: `ylab(NULL)`. This removes the label slot completely and the plot reclaims the horizontal space to the left of the axis. Passing an empty string (`ylab("")`) is different: it keeps an empty slot beside the axis, leaving a visible gap that usually looks like a layout bug. Use `NULL` to drop the label, and `""` only when the gap is wanted as a spacer.

**How do I rotate or change the font of the y axis label in ggplot2?**

`ylab()` only writes text. Styling lives in `theme()`. Add `theme(axis.title.y = element_text(face = "bold", color = "navy", size = 12, angle = 90))`. The default y label is rotated 90 degrees so it reads bottom-to-top; pass `angle = 0` to make it horizontal, which is more readable but consumes more horizontal space. Tick numbers along the y axis are styled separately with `theme(axis.text.y = ...)`.

**Can I use math notation or Greek letters in ylab()?**

Yes. Pass an `expression()` instead of a string: `ylab(expression(mu[y]~(mg/dL)))` renders as a Greek mu with a subscript y followed by "(mg/dL)". Use `~` for spaces, `^` for superscripts, `[]` for subscripts, and Greek names like `mu`, `sigma`, `theta` for symbols. Run `?plotmath` for the full grammar.
