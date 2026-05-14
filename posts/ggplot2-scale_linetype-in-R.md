---
title: "ggplot2 scale_linetype() in R: Map Factor to Line Patterns"
slug: "ggplot2-scale_linetype-in-R"
description: "Use ggplot2 scale_linetype() in R to map a factor to dashed, dotted, and solid line patterns. Covers scale_linetype_manual(), legends, hex codes, 5 examples."
keywords: "ggplot2 scale_linetype, scale_linetype function R, ggplot2 scale_linetype examples, R linetype ggplot, scale_linetype_manual ggplot, ggplot2 dashed line, change line type ggplot"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "ggplot2-functions"
fr_parent: "ggplot2-Tutorial-With-R.html"
auto_link_terms: "scale_linetype()|ggplot2 scale_linetype|scale_linetype_manual()|scale_linetype_identity()|ggplot linetype"
auto_link_case_sensitive: true
target_keyword: "ggplot2 scale_linetype"
sibling_block_enabled: true
difficulty: "Beginner"
---

# ggplot2 scale_linetype() in R: Map Factor to Line Patterns

<p class="lead">The <code>scale_linetype()</code> function in ggplot2 maps a discrete (factor) variable to line patterns, so each group draws with a different dash style. It is the core scale behind any chart that uses the <code>linetype</code> aesthetic to separate trends without color.</p>

[QUICK ANSWER]
scale_linetype()                                            # default discrete palette
scale_linetype(name = "Group")                              # tune legend title
scale_linetype_manual(values = c("dashed", "dotted"))       # pick patterns by name
scale_linetype_manual(values = c("A" = "solid", "B" = "dashed"))  # named values
scale_linetype_manual(values = c(1, 2, 4))                  # integer codes 0 to 6
scale_linetype_identity()                                   # column values ARE the linetype
scale_linetype(na.value = "blank")                          # hide NA group

[DECISION TREE: Is scale_linetype() the right tool?]
- map a factor to line pattern: scale_linetype()
- pick specific patterns per level: scale_linetype_manual()
- column already holds names like "solid": scale_linetype_identity()
- linetype by a CONTINUOUS variable: scale_linetype_binned()
- thicker lines, not dashed: geom_line(linewidth = 1.2)
- color, not pattern, by group: scale_color_brewer()
- one fixed pattern for every line: geom_line(linetype = "dashed")

## What scale_linetype() does in one sentence

**`scale_linetype()` maps each level of a discrete variable to a unique dash pattern so groups stay visually separable without color.** ggplot2 picks from the 6 named patterns ("solid", "dashed", "dotted", "dotdash", "longdash", "twodash") plus "blank" in a fixed cycle, with the option to pass custom hex strings for unlimited dash designs.

## Syntax and arguments

**`scale_linetype(name = waiver(), breaks = waiver(), labels = waiver(), limits = NULL, na.value = "blank", guide = "legend")`.** The `na.value` argument controls how missing groups draw; default `"blank"` hides them. There is no `values` argument on `scale_linetype()` itself; to pick specific patterns use `scale_linetype_manual()`.

```r title="Default mapping with mtcars"
library(ggplot2)

mt <- aggregate(mpg ~ cyl + gear, data = mtcars, FUN = mean)
mt$cyl <- factor(mt$cyl)

ggplot(mt, aes(gear, mpg, linetype = cyl, group = cyl)) +
  geom_line(linewidth = 1) +
  scale_linetype()
```

The `linetype = cyl` mapping inside `aes()` tells ggplot which variable controls the dash style. `scale_linetype()` then auto-picks one pattern per factor level. With three cyl levels, ggplot assigns "solid", "dashed", "dotted" in order.

[TIP]
**Always set linewidth at 1 or higher when linetype is the encoding.** The default `linewidth = 0.5` makes short dashes and dots look almost identical, especially on retina displays or in thumbnails. Bump to 1 or 1.2 inside `geom_line()` for legibility.

## Five common patterns

### 1. Default scale_linetype() with a factor

```r title="Default linetypes by cyl"
ggplot(mt, aes(gear, mpg, linetype = cyl, group = cyl)) +
  geom_line(linewidth = 1, color = "steelblue") +
  labs(title = "Mean MPG by gear, split by cyl")
```

The mapping `linetype = cyl` is enough to trigger `scale_linetype()` implicitly. You only call `scale_linetype()` directly when you want to tune the legend, the breaks, or the NA value. For full control over which pattern each level gets, jump to `scale_linetype_manual()` in pattern 2.

### 2. Manual patterns with scale_linetype_manual()

```r title="Hand-pick patterns per level"
ggplot(mt, aes(gear, mpg, linetype = cyl, group = cyl)) +
  geom_line(linewidth = 1) +
  scale_linetype_manual(values = c("4" = "solid",
                                   "6" = "dashed",
                                   "8" = "dotted"))
```

Use `scale_linetype_manual()` whenever you need a specific pattern per group. Valid `values` are the named strings ("solid", "dashed", "dotted", "dotdash", "longdash", "twodash"), integer codes 0 to 6, or custom hex strings like "1F" (1 unit on, 15 off).

[KEY INSIGHT]
**The 6 named line patterns ARE the palette.** Unlike color, where you have millions of values, linetype is genuinely discrete. If your factor has more than 6 levels, pair linetype with color or facet rather than pushing more dashes the eye cannot distinguish.

### 3. Custom dash patterns with hex strings

```r title="Custom dash with hex pattern"
ggplot(mt, aes(gear, mpg, linetype = cyl, group = cyl)) +
  geom_line(linewidth = 1.1) +
  scale_linetype_manual(values = c("4" = "solid",
                                   "6" = "1F",
                                   "8" = "62"))
```

Hex strings encode the on-off pattern: `"1F"` is 1 unit on, 15 off (sparse dots), `"62"` is 6 on, 2 off (long dash). Each character (0 to 9, A to F) is a hex unit of pen up or down, alternating. This unlocks unlimited custom patterns past the 6 named ones.

### 4. linetype plus color for double-encoding

```r title="Double-encode group with linetype and color"
ggplot(mt, aes(gear, mpg, linetype = cyl, color = cyl, group = cyl)) +
  geom_line(linewidth = 1.1) +
  scale_linetype_manual(values = c("solid", "dashed", "dotted")) +
  scale_color_brewer(palette = "Set1")
```

When `linetype` and `color` both map to the same variable, ggplot merges the two legends into one. This double-encoding is best for print or grayscale fallback: the line stays readable when color is lost in photocopy or for color-blind readers.

[WARNING]
**Mapping linetype to a numeric column errors.** `aes(linetype = mpg)` triggers "A continuous variable cannot be mapped to the linetype aesthetic." Cast to a factor first with `factor(cut(mpg, 3))`, or use `scale_linetype_binned()` to bin automatically.

### 5. Tidy legend with custom labels

```r title="Custom legend title and labels"
ggplot(mt, aes(gear, mpg, linetype = cyl, group = cyl)) +
  geom_line(linewidth = 1) +
  scale_linetype(
    name = "Cylinders",
    labels = c("4" = "4 cyl",
               "6" = "6 cyl",
               "8" = "8 cyl")
  )
```

The `name` argument renames the legend header. The `labels` argument relabels each factor level for display, useful for engineering units, scientific notation, or shorter display strings without rewriting the underlying factor.

## scale_linetype() vs scale_linetype_manual() vs scale_linetype_identity()

| Function | Source of pattern | Use when |
|---|---|---|
| `scale_linetype()` | Auto picks from 6 named patterns | Up to 6 groups, any pattern works |
| `scale_linetype_manual()` | You pass `values = c(...)` | Specific pattern per group needed |
| `scale_linetype_identity()` | Column itself holds "solid", "dashed", or codes | Data already encodes the pattern |
| `scale_linetype_discrete()` | Alias for `scale_linetype()` | Legacy code or explicit clarity |
| `scale_linetype_binned()` | Continuous variable binned into patterns | Linetype by numeric range |

## Common pitfalls

**Pitfall 1: more than 6 levels.** `scale_linetype()` warns and recycles patterns once you push past the named palette. Use `scale_linetype_manual()` with hex strings to extend, or switch the encoding to color or faceting.

**Pitfall 2: forgot `group =`.** Mapping `linetype` to a factor usually creates the grouping automatically, but if you ALSO map `color` to a different variable, ggplot may not split the line. Add `group = interaction(grp1, grp2)` to be explicit.

**Pitfall 3: NA rows draw as solid lines.** The default `na.value = "blank"` hides them, but if a user override changes that default and NA groups exist, they appear as solid lines next to your real groups. Drop NA rows before plotting or set `na.value = "blank"` explicitly.

## Try it yourself

**Try it:** Plot the built-in `Loblolly` data with `age` on x, `height` on y, and `Seed` (as a factor) controlling line type. Limit to three seeds, use `scale_linetype_manual()` to assign solid, dashed, and dotted, and save the plot to `ex_lt`.

```r title="Your turn: Loblolly linetypes"
library(ggplot2)
lob <- subset(Loblolly, Seed %in% c("301", "303", "305"))

ex_lt <- lob |>
  ggplot(aes(age, height, linetype = Seed, group = Seed)) +
  # your code here

ex_lt
#> Expected: three lines, one per Seed
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_lt <- ggplot(lob, aes(age, height, linetype = Seed, group = Seed)) +
  geom_line(linewidth = 1) +
  scale_linetype_manual(values = c("301" = "solid",
                                   "303" = "dashed",
                                   "305" = "dotted"),
                        name = "Seed source")

ex_lt
```

**Explanation:** `subset()` keeps only three Seed levels so the manual mapping has exact matches for `values`. `scale_linetype_manual(values = ...)` then assigns one named pattern per Seed, and `name =` sets the legend header.

</details>

## Related ggplot2 functions

After mastering `scale_linetype()`, look at:

- `geom_line()`: the main geom that uses the linetype aesthetic
- `scale_linetype_manual()`: pick specific patterns per level
- `scale_linetype_identity()`: when the data column holds pattern names directly
- `scale_color_brewer()`: pair color with linetype for accessible group encoding
- `aes()`: where you map `linetype = variable` in the first place

For the full reference, see the [official ggplot2 scale_linetype page](https://ggplot2.tidyverse.org/reference/scale_linetype.html).

## FAQ

**What line types does ggplot2 support?**

ggplot2 supports 6 named patterns plus "blank": "solid" (1), "dashed" (2), "dotted" (3), "dotdash" (4), "longdash" (5), "twodash" (6), and "blank" (0). You can pass either the names or the integer codes anywhere `linetype = ...` is accepted, including fixed values in `geom_line(linetype = ...)` and mapped values in `scale_linetype_manual(values = ...)`. For unlimited custom patterns, pass hex strings like `"1F"` or `"62"` that encode the on-off pen sequence.

**How do I change line type in ggplot2 without mapping a variable?**

Set `linetype` as a constant inside the geom call, not inside `aes()`. For example, `geom_line(linetype = "dashed")` makes every line dashed regardless of data. The key distinction: `linetype = "dashed"` inside `aes()` would treat the literal string "dashed" as a one-level factor, which is rarely what you want. Outside `aes()`, the value is a fixed graphical setting that applies to all lines drawn by that geom.

**What is the difference between scale_linetype and scale_linetype_manual?**

`scale_linetype()` auto-assigns patterns from the fixed palette of 6 named line types. `scale_linetype_manual()` lets you specify exactly which pattern each factor level gets via `values = c(...)`. Use `scale_linetype()` for quick exploratory plots where any clear separation suffices, and `scale_linetype_manual()` for publication plots where the pattern-to-group mapping must be deliberate, reproducible, and consistent across figures in a paper.

**Can I map a continuous variable to linetype in ggplot2?**

Not directly. ggplot2 errors with "A continuous variable cannot be mapped to the linetype aesthetic" because linetype is inherently discrete. Two workarounds: bin the variable into 3 to 5 categories with `cut(x, 4)` and map the result, or use `scale_linetype_binned()` which does the binning for you. For continuous trend encoding, prefer `linewidth` (line thickness) or `alpha` (line opacity), both of which handle continuous mappings natively.

**Why do my dashed and dotted lines look the same?**

The default `linewidth = 0.5` makes short dashes and dots visually indistinguishable, especially on retina displays or when the chart is small. Bump `linewidth` to 1 or 1.2 inside `geom_line()` and the gaps render large enough to read. If lines still merge, switch to higher-contrast patterns like "longdash" and "twodash", or double-encode with color so the chart stays readable even at thumbnail size.
