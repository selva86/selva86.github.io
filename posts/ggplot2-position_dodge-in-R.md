---
title: "ggplot2 position_dodge() in R: Side-by-Side Bars and Points"
slug: "ggplot2-position_dodge-in-R"
description: "Use ggplot2 position_dodge() to place overlapping bars, points, and error bars side-by-side. Covers width, preserve, and position_dodge2 with examples."
keywords: "position_dodge, ggplot2 position_dodge, position_dodge2, grouped bar chart ggplot2, dodge points ggplot2, dodge error bars, R position_dodge"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "ggplot2-functions"
fr_parent: "ggplot2-Tutorial-With-R.html"
auto_link_terms: "position_dodge()|ggplot2 position_dodge|position_dodge2()|dodge position adjustment|grouped bar chart"
auto_link_case_sensitive: true
target_keyword: "position_dodge"
sibling_block_enabled: true
difficulty: "Beginner"
---

# ggplot2 position_dodge() in R: Side-by-Side Bars and Points

<p class="lead">The <code>position_dodge()</code> function in ggplot2 shifts overlapping objects horizontally so they sit side by side. Use it for grouped bar charts, dodged points, or aligned error bars.</p>

[QUICK ANSWER]
geom_bar(position = "dodge")                                     # quick grouped bars
geom_bar(position = position_dodge(width = 0.9))                 # explicit width
geom_point(position = position_dodge(width = 0.5))               # dodge points
geom_errorbar(position = position_dodge(width = 0.9), width=.2)  # dodge error bars
geom_bar(position = position_dodge(preserve = "single"))         # keep bar widths
geom_col(position = position_dodge2(width = 0.9))                # mixed widths
geom_point(position = position_dodge(0.6))                       # first arg = width

[DECISION TREE: Is position_dodge() the right tool?]
- side-by-side bars by group: position_dodge(width = 0.9)
- side-by-side points or jittered points: position_dodge() or position_jitterdodge()
- align error bars with grouped bars: position_dodge(width = 0.9) on both
- bars stacked on top of each other: position_stack()
- 100 percent stacked bars: position_fill()
- random scatter to reduce overplotting: position_jitter()
- mixed bar widths within a group: position_dodge2()

## What position_dodge() does in one sentence

**`position_dodge()` shifts overlapping objects side by side along the x axis, so groups within a category become visible instead of overlapping.** It is a position adjustment, not a geom; you pass it to a geom's `position =` argument.

The default position for most discrete geoms is `"stack"` (bars stack vertically) or `"identity"` (points draw on top of each other). `position_dodge` is what turns those into the familiar grouped layout.

## Syntax

**The function takes two arguments: `width` (horizontal shift) and `preserve` (how to handle uneven group sizes).**

```r title="Load ggplot2 and set up data"
library(ggplot2)

# Built-in dataset: mpg
head(mpg[, c("class", "drv", "hwy")], 3)

# Summary table for grouped bars
counts <- as.data.frame(table(mpg$class, mpg$drv))
names(counts) <- c("class", "drv", "n")
head(counts, 3)
```

The full signature is:

```
position_dodge(width = NULL, preserve = c("total", "single"))
position_dodge2(width = NULL, preserve = c("total", "single"),
                padding = 0.1, reverse = FALSE)
```

- **`width`**: the horizontal distance between dodged objects. For bars use the bar width (default `0.9`). For points pick a value like `0.3` to `0.7`.
- **`preserve`**: `"total"` (default) keeps the combined width of all dodged objects constant; `"single"` keeps each object's width constant. Use `"single"` when groups have different counts.
- **`padding`** (`position_dodge2` only): gap between objects, fraction of width.
- **`reverse`**: flip the dodge order.

[TIP]
**Match the `width` across layers.** If you dodge bars with `width = 0.9` and add error bars, pass the same value to `geom_errorbar(position = position_dodge(width = 0.9))` or they will not align.

## Six common patterns

### 1. Grouped bar chart with the shortcut

```r title="Grouped bars using the string shortcut"
ggplot(mpg, aes(x = class, fill = drv)) +
  geom_bar(position = "dodge")
```

Passing `position = "dodge"` is shorthand for `position_dodge()` with default arguments. The bars within each `class` separate by `drv` (4-wheel, front, rear).

### 2. Explicit width control

```r title="Dodge with an explicit width"
ggplot(mpg, aes(x = class, fill = drv)) +
  geom_bar(position = position_dodge(width = 0.9))
```

The result looks identical to example 1, but you now control the spacing. Reducing `width` to `0.7` packs bars closer; raising it to `1.0` pushes them apart.

### 3. Dodge points within categories

```r title="Side-by-side jittered points"
ggplot(mpg, aes(x = class, y = hwy, color = drv)) +
  geom_point(position = position_dodge(width = 0.6),
             alpha = 0.6)
```

Points by `drv` separate horizontally inside each `class`. Without dodge, points from all three drivetrains stack on the same x position and hide each other.

### 4. Align bars and error bars

```r title="Bars plus matched error bars"
agg <- aggregate(hwy ~ class + drv, data = mpg,
                 FUN = function(x) c(mean = mean(x), se = sd(x)/sqrt(length(x))))
agg <- do.call(data.frame, agg)
names(agg)[3:4] <- c("mean", "se")

ggplot(agg, aes(x = class, y = mean, fill = drv)) +
  geom_col(position = position_dodge(width = 0.9)) +
  geom_errorbar(aes(ymin = mean - se, ymax = mean + se),
                position = position_dodge(width = 0.9),
                width = 0.2)
```

Both layers share `width = 0.9`, so the error bars sit centered on their bars. Mismatched widths are the most common cause of "floating" error bars.

### 5. Keep bar widths fixed across uneven groups

```r title="Use preserve to fix bar widths"
mpg_sub <- mpg[mpg$class %in% c("compact", "midsize", "suv"), ]
mpg_sub <- mpg_sub[!(mpg_sub$class == "compact" & mpg_sub$drv == "r"), ]

ggplot(mpg_sub, aes(x = class, fill = drv)) +
  geom_bar(position = position_dodge(preserve = "single"))
```

Compact has only 2 drv groups; midsize and suv have 3. With `preserve = "total"` (default), compact bars would balloon to fill the slot. `preserve = "single"` keeps every bar the same width.

### 6. Mixed-width bars with position_dodge2

```r title="Dodge bars of varying widths"
df <- data.frame(
  cat = rep(c("A", "B", "C"), each = 2),
  grp = rep(c("X", "Y"), 3),
  val = c(3, 5, 7, 4, 6, 8),
  w   = c(0.4, 0.8, 0.6, 0.6, 0.5, 0.7)
)

ggplot(df, aes(x = cat, y = val, fill = grp, width = w)) +
  geom_col(position = position_dodge2(preserve = "single"))
```

`position_dodge2()` handles varying bar widths cleanly. Plain `position_dodge` assumes equal widths and produces overlaps when widths differ.

[KEY INSIGHT]
**Dodge is a layout rule, not a statistic.** It only moves objects; it does not aggregate, count, or transform values. If your bars look wrong, the fix is usually in the data or the stat, not in the dodge width.

## position_dodge vs alternatives

**Pick the position adjustment that matches the visual question you are asking.**

| Position adjustment | Effect | Use when |
|---|---|---|
| `position_dodge()` | Side-by-side groups | Compare group values within a category |
| `position_stack()` | Stack on top of each other | Show composition of a total |
| `position_fill()` | Stack scaled to 100% | Compare proportions across categories |
| `position_jitter()` | Random noise | Reduce overplotting of identical x values |
| `position_jitterdodge()` | Dodge then jitter | Grouped boxplots with raw points overlaid |
| `position_dodge2()` | Smarter dodge | Varying widths or `preserve = "single"` cases |

Decision rule: if your group variable maps to `fill` or `color` and you want a visible split, reach for `position_dodge`. If you want a total bar broken into parts, reach for `position_stack`.

[NOTE]
**Coming from base R `barplot()`?** Side-by-side bars come from `beside = TRUE`. In ggplot2 the equivalent is `geom_bar(position = "dodge")`.

## Common pitfalls

**Pitfall 1: width mismatch.** Bars use `width = 0.9` by default, but error bars or points often default to other widths. Always set `position_dodge(width = X)` to the same value across all layers in a grouped plot.

**Pitfall 2: forgetting `preserve = "single"`.** When groups have different counts (e.g., some categories lack one level), the default `preserve = "total"` makes those bars wider. Use `"single"` for visually consistent widths.

**Pitfall 3: dodging a single-group plot.** If your data has only one level in `fill`, dodge has nothing to separate and your bars sit centered as if no dodge was applied. Verify your group variable actually varies.

## Try it yourself

**Try it:** Build a grouped bar of `mpg` counts by `class`, filled by `drv`, with explicit `width = 0.9`. Save to `ex_plot`.

```r title="Your turn: dodge mpg by drv"
ex_plot <- ggplot(mpg, aes(x = class, fill = drv)) +
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_plot <- ggplot(mpg, aes(x = class, fill = drv)) +
  geom_bar(position = position_dodge(width = 0.9))
ex_plot
```

**Explanation:** Setting `width = 0.9` matches the bar default, so the dodged groups stay within their class slot and remain visually aligned with any error bars you might overlay later.

</details>

## Related ggplot2 functions

After mastering position_dodge, look at:

- `position_stack()`: stack bars or areas on top of each other
- `position_fill()`: stack to 100% proportion
- `position_jitter()`: add random noise to reduce overplotting
- `position_jitterdodge()`: combine dodge and jitter for grouped points
- `position_dodge2()`: dodge with varying widths and smarter preserve

See the official reference at [ggplot2.tidyverse.org](https://ggplot2.tidyverse.org/reference/position_dodge.html) for the full signature.

## FAQ

**What does position_dodge do in ggplot2?**

`position_dodge()` shifts overlapping geom objects horizontally so groups within a category appear side by side. It does not change values; it only adjusts x positions. The default `width` matches a bar's width (0.9), and you typically apply it through `geom_bar(position = "dodge")` or `geom_point(position = position_dodge(width = 0.5))` to compare groups.

**What is the difference between position_dodge and position_dodge2?**

`position_dodge` assumes equal object widths within a group and can overlap or distort when widths vary. `position_dodge2` handles variable widths and applies `preserve = "single"` more intuitively, keeping each object's width constant across uneven group counts. Use `position_dodge2` whenever bars carry a `width` aesthetic or groups have different numbers of levels.

**How do I set the width in position_dodge?**

Pass `width` as the first argument: `position_dodge(width = 0.9)`. The value is in x-axis units; 0.9 matches the default `geom_bar` width. Smaller values pack bars closer; larger values push them apart. To align error bars or points with grouped bars, set the same `width` on every layer.

**How do I dodge error bars over bars?**

Use the same `position_dodge(width = 0.9)` on both `geom_col()` (or `geom_bar`) and `geom_errorbar()`. If the widths differ, error bars float off-center. Set `geom_errorbar(width = 0.2)` separately to control the horizontal cap size; that argument is distinct from the dodge width.

**What is preserve = "single" in position_dodge?**

`preserve` controls how dodge handles groups of unequal size. The default `"total"` keeps the combined slot width constant, so missing categories make the remaining bars wider. `preserve = "single"` keeps each bar the same width regardless of group count, which is usually what you want when comparing categories that lack some levels.
