---
title: "ggplot2 scale_color_brewer() in R: ColorBrewer Palettes"
slug: "ggplot2-scale_color_brewer-in-R"
description: "Use ggplot2 scale_color_brewer() to apply named ColorBrewer palettes to discrete groups in R. Covers Set1, Set2, Dark2, qualitative, sequential, 5 examples."
keywords: "ggplot2 scale_color_brewer, R ColorBrewer palette, scale_color_brewer Set1, qualitative palette ggplot, sequential brewer"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "ggplot2-functions"
fr_parent: "ggplot2-Tutorial-With-R.html"
auto_link_terms: "scale_color_brewer()|ggplot2 scale_color_brewer|ColorBrewer palette|qualitative palette|sequential brewer"
auto_link_case_sensitive: true
target_keyword: "ggplot2 scale_color_brewer"
sibling_block_enabled: true
difficulty: "Beginner"
---

# ggplot2 scale_color_brewer() in R: ColorBrewer Palettes

<p class="lead">The <code>scale_color_brewer()</code> function in ggplot2 applies named ColorBrewer palettes to discrete groups. ColorBrewer palettes are designed for cartography but work great for any categorical visualization.</p>

[QUICK ANSWER]
+ scale_color_brewer(palette = "Set1")
+ scale_color_brewer(palette = "Dark2", direction = -1)
+ scale_fill_brewer(palette = "Spectral")
+ RColorBrewer::display.brewer.all()        # see all palettes
+ scale_color_manual(values = ...)           # custom alternative

[DECISION TREE: Is scale_color_brewer() the right tool?]
- discrete categories with named palette: scale_color_brewer()
- 2-12 distinct categories: qualitative (Set1, Set2, Dark2)
- ordered categories: sequential (Blues, Reds, Greens)
- diverging data: diverging (RdBu, Spectral)
- continuous gradient: scale_color_distiller()

## What scale_color_brewer() does in one sentence

**`scale_color_brewer(palette = "Set1")` colors discrete groups using a named ColorBrewer palette.** ColorBrewer (cynthia.bristows.com/colorbrewer) is a standard set of perceptually balanced palettes.

## Syntax

**`scale_color_brewer(palette = "Set1", direction = 1, type = "seq", ...)`. type is "seq" (sequential), "qual" (qualitative), or "div" (diverging).**

```r title="Set1 qualitative palette"
library(ggplot2)

ggplot(mtcars, aes(wt, mpg, color = factor(cyl))) +
  geom_point(size = 3) +
  scale_color_brewer(palette = "Set1")
```

[TIP]
**Use qualitative palettes (Set1, Set2, Dark2) for unordered categories; sequential (Blues, Reds) for ordered; diverging (RdBu, Spectral) for centered data.**

## Five common patterns

### 1. Set1 (default qualitative)

```r title="Distinct colors"
+ scale_color_brewer(palette = "Set1")
```

### 2. Dark2 (more saturated)

```r title="Better on white background"
+ scale_color_brewer(palette = "Dark2")
```

### 3. Sequential ordered

```r title="Ordered factor levels"
+ scale_color_brewer(palette = "Blues")
```

### 4. Reverse direction

```r title="Light to dark or vice versa"
+ scale_color_brewer(palette = "Blues", direction = -1)
```

### 5. fill version

```r title="For bar / area"
+ scale_fill_brewer(palette = "Pastel1")
```

[KEY INSIGHT]
**ColorBrewer palettes are MAX 8-12 colors.** For more categories, use viridis or a custom palette. ColorBrewer's strength is perceptual balance for small N.

## scale_color_brewer() vs scale_color_viridis_d() vs scale_color_manual

| Function | Source | Color count |
|---|---|---|
| `scale_color_brewer()` | ColorBrewer | 3-12 |
| `scale_color_viridis_d()` | Viridis | Any |
| `scale_color_manual()` | Custom | Any |
| `scale_color_grey()` | Greyscale | 2-9 |

When to use which:

- brewer for 3-9 categorical levels.
- viridis for many levels or perceptual uniformity.
- manual for custom / brand colors.

## A practical workflow

**Browse all ColorBrewer palettes with `RColorBrewer::display.brewer.all()` then pick one.**

```r
# Browse palettes
RColorBrewer::display.brewer.all()

# Apply
ggplot(df, aes(x, y, color = group)) +
  geom_line() +
  scale_color_brewer(palette = "Dark2")
```

## Common pitfalls

**Pitfall 1: too many categories.** ColorBrewer maxes at 8-12. With more, ggplot warns and recycles or interpolates.

**Pitfall 2: wrong palette type.** Don't use sequential palettes for unordered categories; use qualitative.

[WARNING]
**`scale_color_brewer` requires `RColorBrewer` package.** ggplot installs it as a dependency, but in stripped environments you may need to install separately.

## Try it yourself

**Try it:** Color mtcars points by cyl using "Dark2" palette. Save to `ex_plot`.

```r title="Your turn: Dark2 palette"
ex_plot <- mtcars |>
  ggplot(aes(wt, mpg, color = factor(cyl))) +
  geom_point(size = 3) +
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_plot <- ggplot(mtcars, aes(wt, mpg, color = factor(cyl))) +
  geom_point(size = 3) +
  scale_color_brewer(palette = "Dark2")
```

**Explanation:** Dark2 is a saturated qualitative palette good on white backgrounds.

</details>

## Related ggplot2 / RColorBrewer functions

After mastering scale_color_brewer, look at:

- `scale_fill_brewer()`: fill version
- `scale_color_distiller()`: continuous version of brewer
- `scale_color_viridis_d()`: viridis alternative
- `scale_color_manual()`: custom values
- `RColorBrewer::display.brewer.all()`: visualize all palettes

## FAQ

**What does scale_color_brewer do in ggplot2?**

`scale_color_brewer(palette = "Set1")` assigns colors from a named ColorBrewer palette to discrete factor levels.

**What is the difference between scale_color_brewer and scale_color_viridis_d?**

brewer uses ColorBrewer's curated palettes (small N). viridis is perceptually uniform and works for any number of levels.

**How many categories can scale_color_brewer handle?**

Most ColorBrewer palettes max at 8-12 colors. For more, use viridis or manual colors.

**What is the difference between qualitative, sequential, and diverging palettes?**

qualitative for unordered groups (Set1). sequential for ordered (Blues). diverging for data centered on a midpoint (RdBu, Spectral).

**Can I see all ColorBrewer palettes in R?**

Yes. `RColorBrewer::display.brewer.all()` shows every palette in a grid.
