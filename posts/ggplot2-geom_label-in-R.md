---
title: "ggplot2 geom_label() in R: Boxed Text Labels"
slug: "ggplot2-geom_label-in-R"
description: "Use ggplot2 geom_label() to add boxed text labels in R. Covers fill, padding, vs geom_text, ggrepel, and 5 worked examples."
keywords: "ggplot2 geom_label, R boxed labels, geom_label fill, geom_label vs geom_text, ggrepel label, label.padding"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "ggplot2-functions"
fr_parent: "ggplot2-Tutorial-With-R.html"
auto_link_terms: "geom_label()|ggplot2 geom_label|boxed text label|geom_label fill|geom_label vs geom_text"
auto_link_case_sensitive: true
target_keyword: "ggplot2 geom_label"
sibling_block_enabled: true
difficulty: "Beginner"
---

# ggplot2 geom_label() in R: Boxed Text Labels

<p class="lead">The <code>geom_label()</code> function in ggplot2 places text labels with a COLORED BACKGROUND BOX, useful for high-contrast labels over busy plots. It is the boxed version of <code>geom_text()</code>.</p>

[QUICK ANSWER]
ggplot(df, aes(x, y, label = name)) + geom_label()
geom_label(fill = "yellow", color = "black")
geom_label(label.padding = unit(0.5, "lines"))
geom_label(label.r = unit(0.3, "lines"))   # rounded corners
ggrepel::geom_label_repel()                 # auto-adjust

[DECISION TREE: Is geom_label() the right tool?]
- need high-contrast labels: geom_label() (boxed)
- minimal labels: geom_text() (no box)
- many overlapping labels: ggrepel::geom_label_repel()
- one-off annotations: annotate("label", ...)
- legend-style highlights: geom_label()

## What geom_label() does in one sentence

**`geom_label()` is `geom_text()` with a filled background box, providing visual contrast against busy plots.** Useful when label readability matters.

## Syntax

**`geom_label(label.padding = unit(0.25, "lines"), label.r = unit(0.15, "lines"), label.size = 0.25, ...)`. Box-specific arguments plus all geom_text args.**

```r title="Boxed labels on scatter"
library(ggplot2)

library(tibble)
mtcars |>
  tibble::rownames_to_column("car") |>
  head(5) |>
  ggplot(aes(wt, mpg, label = car)) +
  geom_point() +
  geom_label(hjust = -0.1, fill = "lightyellow")
```

[TIP]
**`geom_label` is best for important annotations that must stand out.** Use sparingly; many labels with boxes clutter the plot.

## Five common patterns

### 1. Standard boxed label

```r title="Replace text with label"
ggplot(df, aes(x, y, label = name)) +
  geom_label()
```

### 2. Custom fill

```r title="Yellow boxes"
ggplot(df, aes(x, y, label = name)) +
  geom_label(fill = "yellow")
```

### 3. Conditional labels

```r title="Only outliers"
mtcars |>
  tibble::rownames_to_column("car") |>
  ggplot(aes(wt, mpg, label = ifelse(mpg > 30, car, ""))) +
  geom_point() +
  geom_label(fill = "lightblue")
```

### 4. ggrepel for non-overlapping

```r title="Auto-place boxes"
library(ggrepel)
ggplot(mtcars, aes(wt, mpg, label = rownames(mtcars))) +
  geom_point() +
  geom_label_repel(max.overlaps = 10, size = 3)
```

### 5. Rounded corners

```r title="Soft edges"
ggplot(df, aes(x, y, label = name)) +
  geom_label(label.r = unit(0.5, "lines"), fill = "lightgreen")
```

[KEY INSIGHT]
**Use `geom_label` when contrast matters; use `geom_text` when minimal styling is fine.** geom_label adds visual weight; too many boxes clutter.

## geom_label() vs geom_text() vs ggrepel

| Function | Box | Avoid overlap |
|---|---|---|
| `geom_label()` | Yes | No |
| `geom_text()` | No | No |
| `geom_label_repel()` | Yes | Yes |
| `geom_text_repel()` | No | Yes |

For many labels, prefer the repel variants.

## A practical workflow

**Use geom_label sparingly for "must-see" annotations.**

```r
mtcars |>
  tibble::rownames_to_column("car") |>
  ggplot(aes(wt, mpg)) +
  geom_point() +
  geom_label(
    data = ~ filter(.x, mpg > 30),
    aes(label = car),
    fill = "lightyellow", hjust = -0.1
  )
```

Only the high-mpg cars get boxed labels.

## Common pitfalls

**Pitfall 1: too many labels.** geom_label adds visual weight; many boxes clutter the plot. Use sparingly or switch to geom_text.

**Pitfall 2: positioning.** Like geom_text, hjust/vjust position the box relative to (x, y).

[WARNING]
**`geom_label` covers underlying points and lines.** If a box overlaps a point, you can't see the point. Use alpha or carefully position.

## Try it yourself

**Try it:** Plot mpg vs wt with boxed labels for cars where mpg > 28. Save to `ex_plot`.

```r title="Your turn: selective boxed labels"
ex_plot <- mtcars |>
  tibble::rownames_to_column("car") |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_plot <- mtcars |>
  tibble::rownames_to_column("car") |>
  ggplot(aes(wt, mpg)) +
  geom_point() +
  geom_label(
    data = ~ filter(.x, mpg > 28),
    aes(label = car),
    fill = "lightyellow",
    hjust = -0.1
  )
```

**Explanation:** Filter to high-mpg cars; geom_label highlights them with yellow boxes.

</details>

## Related ggplot2 functions

After mastering geom_label, look at:

- `geom_text()`: plain text
- `ggrepel::geom_label_repel()`: anti-overlap boxed labels
- `annotate("label", ...)`: one-off labels
- `geom_text_repel()`: anti-overlap plain

## FAQ

**What does geom_label do in ggplot2?**

`geom_label()` places text labels with a colored background box at (x, y) coordinates.

**What is the difference between geom_label and geom_text?**

geom_label adds a filled box; geom_text is plain. Use label for contrast over busy backgrounds.

**How do I prevent labels from overlapping?**

Use `ggrepel::geom_label_repel()`. It auto-shifts labels to avoid collisions.

**Can I customize the box appearance?**

Yes. `label.padding` controls inside spacing; `label.r` controls corner rounding; `fill` sets background color.

**Should I use geom_label or geom_text?**

label for IMPORTANT must-read annotations. text for minimal styling. Many labels with boxes look cluttered; use sparingly.
