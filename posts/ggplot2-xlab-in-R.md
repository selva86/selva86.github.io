---
title: "ggplot2 xlab() in R: Set the X Axis Label"
slug: "ggplot2-xlab-in-R"
description: "Use ggplot2 xlab() in R to set, change, or remove the x axis label. Covers units, multi-line labels, plotmath expressions, xlab vs labs, and 6 examples."
keywords: "xlab, ggplot2 xlab, ggplot2 x axis label, change x axis label ggplot, ggplot2 remove x label, xlab vs labs, ggplot2 xlab expression, xlab NULL"
mathjax: false
webr: true
date: "2026-05-14"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "ggplot2-functions"
fr_parent: "ggplot2-Tutorial-With-R.html"
auto_link_terms: "xlab()|ggplot2 xlab|ggplot2 x axis label|change x axis label|remove x axis label|xlab vs labs"
auto_link_case_sensitive: true
target_keyword: "ggplot2 xlab"
sibling_block_enabled: true
difficulty: "Beginner"
---

# ggplot2 xlab() in R: Set the X Axis Label

<p class="lead">The <code>xlab()</code> function in ggplot2 sets the x axis label of a plot in a single short call. It is the single-axis shortcut for <code>labs(x = ...)</code>, useful when you only need to rename or remove the x axis title and leave every other label alone.</p>

[QUICK ANSWER]
xlab("Weight (1000 lbs)")                            # set the x axis label
xlab(NULL)                                           # remove the x axis label
xlab("")                                             # keep slot, blank text
xlab("Line one\nLine two")                           # multi-line x label
xlab(expression(Weight~(kg^2)))                      # math expression label
p + xlab("Weight") + theme(axis.title.x = element_text(face = "bold"))   # bold
labs(x = "Weight (1000 lbs)")                        # the long form

[DECISION TREE: Is xlab() the right tool?]
- only the x axis label: xlab("Weight (1000 lbs)")
- only the y axis label: ylab("Miles per gallon")
- x and y plus title in one call: labs(x = ..., y = ..., title = ...)
- style the label font or angle: theme(axis.title.x = element_text(...))
- format the tick numbers, not the label: scale_x_continuous(labels = scales::comma)
- rotate tick text 45 degrees: theme(axis.text.x = element_text(angle = 45))
- relabel category levels on the axis: scale_x_discrete(labels = c(...))
- the title or subtitle of the plot: ggtitle("My title")

## What xlab() does in one sentence

**`xlab()` writes the x axis title slot of a ggplot2 plot, and only that slot.** Every other label (y axis, plot title, subtitle, caption, tag, legend) needs `ylab()`, `ggtitle()`, or `labs()`.

It is a thin wrapper around `labs(x = ...)`. The two calls `xlab("Weight")` and `labs(x = "Weight")` produce identical output. Reach for `xlab()` when the x axis label is the only thing you are changing, because the call reads as a single intent.

## Syntax

**`xlab(label)`. The single argument is the text shown below the x axis.** Pass a character string, `NULL` to remove the label, or an `expression()` for math notation.

```r title="Load ggplot2 and set an x axis label"
library(ggplot2)

p <- ggplot(mtcars, aes(wt, mpg)) + geom_point()

p + xlab("Weight (1000 lbs)")
```

The base plot `p` is reusable across the next examples, so each block isolates the x-label change.

[TIP]
**Always include units in the axis label.** "Weight (1000 lbs)" outperforms "Weight" because the reader does not have to read the data dictionary to interpret the scale. The parens-with-units pattern is the convention in scientific publishing and on dashboards.

## Six common xlab() patterns

### 1. Set a basic label

```r title="Plain text label"
p + xlab("Car weight")
```

### 2. Label with units in parentheses

```r title="Units make the label self-explanatory"
p + xlab("Weight (1000 lbs)")
```

### 3. Remove the x axis label

```r title="Drop the label completely"
p + xlab(NULL)
```

`NULL` removes the slot and the plot reclaims the vertical space below the axis. An empty string (`xlab("")`) keeps the slot blank, leaving a gap.

### 4. Multi-line label via newline

```r title="Break a long label across two lines"
p + xlab("Weight of the vehicle\nin thousands of pounds")
```

A `\n` inside the string forces a line break. Useful on narrow plots where a long label would otherwise be clipped.

### 5. Math notation via expression()

```r title="Subscripts, superscripts, Greek letters"
p + xlab(expression(Weight~(kg^2)))
```

`expression()` accepts R's plotmath syntax. Use `~` for spaces, `^` for superscripts, and Greek letters like `mu` or `sigma` for symbols. See `?plotmath` for the full grammar.

### 6. xlab() works for discrete axes too

```r title="The same call labels a factor axis"
ggplot(mtcars, aes(factor(cyl), mpg)) +
  geom_boxplot() +
  xlab("Number of cylinders")
```

There is no separate function for discrete axes. `xlab()` writes whatever the x axis is, continuous or discrete.

[KEY INSIGHT]
**`xlab()` only writes text; it never styles.** Font weight, size, color, and angle all live in `theme(axis.title.x = element_text(...))`. Keeping content (`xlab`) separate from presentation (`theme`) is the ggplot2 grammar's whole point.

## xlab() vs labs() vs ylab() vs ggtitle()

**`xlab()` is the single-axis shortcut; `labs()` covers every slot at once.** Pick `xlab()` when only the x label is changing, and `labs()` when you also need the y label, plot title, or any other slot.

| Function | Sets | When to reach for it |
|---|---|---|
| `xlab()` | X axis label only | Single-axis tweak |
| `ylab()` | Y axis label only | Single-axis tweak |
| `labs()` | Every label at once (x, y, title, subtitle, caption, tag, legend) | Multiple labels in one call |
| `ggtitle()` | Plot title (and optional subtitle) | Title-only edits |

Under the hood, every shortcut calls `labs()`. Mixing them in one plot works (each writes its own slot), but a single `labs()` call is easier to maintain than four scattered calls. See the official ggplot2 reference for [labs()](https://ggplot2.tidyverse.org/reference/labs.html).

[NOTE]
**Coming from base R?** `xlab("Weight")` replaces the `xlab` argument of `plot()`, `hist()`, and `boxplot()`. Unlike base R, the ggplot2 version is a separate layer added with `+`, so you can apply it conditionally or store it in a reusable object.

## Common pitfalls

**Pitfall 1: confusing the label with the tick text.** `xlab()` controls the title under the axis, not the numbers along it. To rotate or reformat the tick labels, use `theme(axis.text.x = element_text(angle = 45))` or `scale_x_continuous(labels = scales::comma)`.

**Pitfall 2: `xlab("")` leaves a blank gap.** An empty string keeps the slot and reserves vertical space. Use `NULL` (`xlab(NULL)`) to remove the slot completely.

**Pitfall 3: setting the label inside `aes()`.** Writing `aes(x = wt)` only maps the column; it does not set the label. The label defaults to the column name (`"wt"`), and you override it with `xlab("Weight (1000 lbs)")` or `labs(x = ...)`.

**Pitfall 4: forgetting that `coord_flip()` swaps the axes.** After `coord_flip()`, the x axis appears on what was the y position, but `xlab()` still writes the original x slot. The label appears on the rotated axis. Use `labs(x = ..., y = ...)` if the swap confuses readers.

[WARNING]
**Calling `xlab()` twice on the same plot overwrites the first call.** `p + xlab("A") + xlab("B")` shows "B". This is silent; there is no warning. The last layer wins for any label slot in ggplot2.

## Try it yourself

**Try it:** Plot `wt` vs `mpg` from `mtcars`. Add an x axis label with units, a y axis label with units, and remove the default plot title space. Save the plot to `ex_labeled`.

```r title="Your turn: set both axis labels"
ex_labeled <- ggplot(mtcars, aes(wt, mpg)) +
  geom_point() +
  # your code here

ex_labeled
#> Expected: scatter with "Weight (1000 lbs)" under x and "Miles per gallon" beside y
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_labeled <- ggplot(mtcars, aes(wt, mpg)) +
  geom_point() +
  xlab("Weight (1000 lbs)") +
  ylab("Miles per gallon")

ex_labeled
```

**Explanation:** `xlab()` writes the x slot and `ylab()` writes the y slot. Each is a separate layer added with `+`. A single `labs(x = "...", y = "...")` call would produce identical output with one fewer line.

</details>

## Related ggplot2 functions

After mastering `xlab()`, look at:

- `ylab()`: the y axis equivalent
- `labs()`: set every label (x, y, title, subtitle, caption, tag, legend) in one call
- `ggtitle()`: the plot title shortcut
- `theme()`: control font size, color, weight, and angle of axis titles and tick text
- `scale_x_continuous(name = ...)`: an alternative way to set the x label that also lets you control breaks and limits in the same call

## FAQ

**How do I change the x axis label in ggplot2?**

Use `xlab("Your label")` and add it to the plot with `+`. For example, `ggplot(mtcars, aes(wt, mpg)) + geom_point() + xlab("Weight (1000 lbs)")` renders a scatter plot with "Weight (1000 lbs)" under the x axis. The `labs(x = "Weight (1000 lbs)")` form is equivalent and is preferred when you are also setting the y label or title in the same call.

**What is the difference between xlab() and labs() in ggplot2?**

`xlab()` sets only the x axis label; `labs()` sets every label on the plot, including y axis, title, subtitle, caption, tag, and legend titles. Both produce identical output when only the x slot is involved, because `xlab()` is defined as a thin wrapper around `labs(x = ...)`. Use `xlab()` for single-axis tweaks and `labs()` when you are changing multiple slots.

**How do I remove the x axis label in ggplot2?**

Pass `NULL`: `xlab(NULL)`. This removes the label slot completely and the plot reclaims the vertical space. Passing an empty string (`xlab("")`) is different: it keeps an empty slot below the axis, leaving a visible gap that usually looks like a layout bug. Use `NULL` when you want the label gone, and `""` only when you want the gap as a spacer.

**How do I rotate or change the font of the x axis label in ggplot2?**

`xlab()` only writes text. Styling lives in `theme()`. Add `theme(axis.title.x = element_text(face = "bold", color = "navy", size = 12, angle = 0))`. To rotate the tick numbers below the label, use `theme(axis.text.x = element_text(angle = 45, hjust = 1))`. The label itself is rarely rotated; rotation is usually applied to tick text on crowded discrete axes.

**Can I use math notation or Greek letters in xlab()?**

Yes. Pass an `expression()` instead of a string: `xlab(expression(mu[x]~(kg)))` renders as a Greek mu with a subscript x followed by "(kg)". Use `~` for spaces, `^` for superscripts, `[]` for subscripts, and Greek names like `mu`, `sigma`, `theta` for symbols. Run `?plotmath` for the full grammar.
