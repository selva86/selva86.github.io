---
title: "ggplot2 geom_text() in R: Add Text Labels to a Plot"
slug: "ggplot2-geom_text-in-R"
description: "Use ggplot2 geom_text() to add text labels at coordinates in R. Covers hjust, vjust, size, vs geom_label, ggrepel, and 5 worked examples."
keywords: "ggplot2 geom_text, R text label plot, geom_text hjust vjust, geom_text vs geom_label, ggplot annotate text, ggrepel"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "ggplot2-functions"
fr_parent: "ggplot2-Tutorial-With-R.html"
auto_link_terms: "geom_text()|ggplot2 geom_text|text label plot|geom_text vs geom_label|annotate text"
auto_link_case_sensitive: true
target_keyword: "ggplot2 geom_text"
sibling_block_enabled: true
difficulty: "Beginner"
---

# ggplot2 geom_text() in R: Add Text Labels to a Plot

<p class="lead">The <code>geom_text()</code> function in ggplot2 places TEXT LABELS at specified (x, y) coordinates. Combined with hjust, vjust, and size aesthetics, it adds annotations to scatter plots and bar charts.</p>

[QUICK ANSWER]
ggplot(df, aes(x, y, label = name)) + geom_text()
geom_text(hjust = 0, vjust = -1)         # offset positioning
geom_text(size = 3, color = "red")
geom_label()                              # boxed version
ggrepel::geom_text_repel()                # auto-adjust to avoid overlap

[DECISION TREE: Is geom_text() the right tool?]
- text labels at coordinates: geom_text()
- boxed labels: geom_label()
- avoid overlap: ggrepel::geom_text_repel()
- one-off annotations: annotate("text", ...)
- numeric labels above bars: geom_text(aes(label = value), vjust = -0.5)

## What geom_text() does in one sentence

**`geom_text()` places text from the `label` aesthetic at each (x, y) coordinate.** Width-zero text; place labels exactly at points.

## Syntax

**`geom_text(mapping = NULL, data = NULL, hjust = 0.5, vjust = 0.5, size = 3.88, ...)`. Requires aes(x, y, label).**

```r title="Label points with car names"
library(ggplot2)

mtcars |>
  tibble::rownames_to_column("car") |>
  head(10) |>
  ggplot(aes(wt, mpg, label = car)) +
  geom_point() +
  geom_text(hjust = -0.1, size = 3)
```

[TIP]
**Use `ggrepel::geom_text_repel()` for plots with many labels.** It automatically shifts overlapping labels apart, much cleaner than manual hjust/vjust.

## Five common patterns

### 1. Label scatter points

```r title="Annotate each point"
ggplot(df, aes(x, y, label = name)) +
  geom_point() +
  geom_text(hjust = -0.2)
```

### 2. Numeric labels on bars

```r title="Show values above bars"
mtcars |>
  count(cyl) |>
  ggplot(aes(factor(cyl), n)) +
  geom_col() +
  geom_text(aes(label = n), vjust = -0.5)
```

### 3. Different text per point

```r title="Conditional labels"
mtcars |>
  tibble::rownames_to_column("car") |>
  mutate(label = ifelse(mpg > 30, car, "")) |>
  ggplot(aes(wt, mpg, label = label)) +
  geom_point() +
  geom_text(hjust = -0.1)
```

Empty string for unlabeled points.

### 4. ggrepel for non-overlapping

```r title="Auto-adjust labels"
library(ggrepel)
ggplot(mtcars, aes(wt, mpg, label = rownames(mtcars))) +
  geom_point() +
  geom_text_repel()
```

### 5. With size aesthetic

```r title="Size by value"
ggplot(df, aes(x, y, label = name, size = importance)) +
  geom_text()
```

[KEY INSIGHT]
**For overlapping labels, `ggrepel::geom_text_repel` is much better than manual offsets.** It uses force-directed placement to avoid collisions.

## geom_text() vs geom_label() vs ggrepel

| Function | Style | Best for |
|---|---|---|
| `geom_text()` | Plain text | Lightweight labels |
| `geom_label()` | Boxed text | High-contrast labels |
| `ggrepel::geom_text_repel()` | Plain + auto-place | Many overlapping labels |
| `ggrepel::geom_label_repel()` | Boxed + auto-place | High-contrast non-overlap |

## A practical workflow

**Use ggrepel for any plot with more than a handful of labels.**

```r
library(ggrepel)

mtcars |>
  tibble::rownames_to_column("car") |>
  ggplot(aes(wt, mpg, label = car)) +
  geom_point() +
  geom_text_repel(max.overlaps = 15, size = 3)
```

Cleaner than manual hjust/vjust placement.

## Common pitfalls

**Pitfall 1: overlap.** Many labels at similar coordinates overlap. ggrepel fixes this.

**Pitfall 2: hjust/vjust confusion.** hjust = 0 is left-aligned (label TO THE RIGHT of point); hjust = 1 is right-aligned (label TO THE LEFT). Test interactively.

[WARNING]
**Default `geom_text()` size is 3.88 (in mm).** Often too small. Use `size = 3` to `5` for typical plots.

## Try it yourself

**Try it:** Add car name labels to a scatter of wt vs mpg using ggrepel. Save to `ex_plot`.

```r title="Your turn: scatter with labels"
library(ggrepel)

ex_plot <- mtcars |>
  tibble::rownames_to_column("car") |>
  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_plot <- mtcars |>
  tibble::rownames_to_column("car") |>
  ggplot(aes(wt, mpg, label = car)) +
  geom_point() +
  geom_text_repel(size = 3)
```

**Explanation:** ggrepel automatically places labels to avoid overlap.

</details>

## Related ggplot2 functions

After mastering geom_text, look at:

- `geom_label()`: boxed version
- `ggrepel::geom_text_repel()`: anti-overlap
- `annotate("text", ...)`: one-off labels
- `geom_text(check_overlap = TRUE)`: simple anti-overlap (less polished than ggrepel)

## FAQ

**What does geom_text do in ggplot2?**

`geom_text()` places text from the label aesthetic at (x, y) coordinates.

**What is the difference between geom_text and geom_label?**

geom_text is plain text. geom_label adds a colored box behind the text. Use geom_label for high-contrast over busy plots.

**How do I avoid label overlap?**

Use `ggrepel::geom_text_repel()` (or geom_label_repel). They auto-shift labels to prevent collisions.

**How do I position labels relative to points?**

hjust/vjust: 0 is left/bottom-aligned; 1 is right/top-aligned. Negative values offset further. Test interactively.

**Can I conditionally label points?**

Yes. Pass an empty string for points to skip: `mutate(label = ifelse(condition, name, ""))`.
