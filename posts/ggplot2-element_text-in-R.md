---
title: "ggplot2 element_text() in R: Style Every Text Element"
slug: "ggplot2-element_text-in-R"
description: "Use ggplot2 element_text() in R to style titles, axis labels, legends, and facet strips. Covers size, face, color, family, angle, hjust, vjust with 7 examples."
keywords: "ggplot2 element_text, element_text in R, ggplot2 font size, ggplot2 rotate axis labels, hjust vjust, ggplot2 title font, ggplot2 face bold, ggplot2 family font"
mathjax: false
webr: true
date: "2026-05-14"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "ggplot2-functions"
fr_parent: "ggplot2-Tutorial-With-R.html"
auto_link_terms: "element_text()|element_line()|element_rect()|element_blank()|theme()|labs()|theme_minimal()"
auto_link_case_sensitive: true
target_keyword: "ggplot2 element_text"
sibling_block_enabled: true
difficulty: "Intermediate"
---

# ggplot2 element_text() in R: Style Every Text Element

<p class="lead">The <code>element_text()</code> function in ggplot2 styles every text element on a plot, titles, axis labels, legends, facet strips, and captions. You pass it inside <code>theme()</code> with arguments like <code>size</code>, <code>face</code>, <code>color</code>, <code>family</code>, <code>angle</code>, <code>hjust</code>, and <code>vjust</code>.</p>

[QUICK ANSWER]
element_text(size = 14)                                # bigger text
element_text(face = "bold")                            # bold title
element_text(color = "navy")                           # color text
element_text(family = "serif")                         # change font family
element_text(angle = 45, hjust = 1)                    # rotate axis labels
element_text(margin = margin(t = 10))                  # add top margin
element_text(size = 12, face = "italic", color = "grey40") # combine styles

[DECISION TREE: Is element_text() the right tool?]
- style a text element inside theme(): element_text(size = 14, face = "bold")
- style a line or grid: element_line(color = "black")
- style a filled background or border: element_rect(fill = "white")
- hide an element entirely: element_blank()
- change the words shown (not the look): labs(title = "...", x = "...")
- pick a different built-in look: theme_minimal(), theme_classic()

## What element_text() does in ggplot2

**`element_text()` builds a text-styling specification that ggplot2 plugs into any text slot.** It does not render anything by itself. You always pass the result to `theme()` as the value of a text argument, like `plot.title = element_text(size = 16)`.

Every text element in a ggplot2 plot has a name: `plot.title`, `plot.subtitle`, `plot.caption`, `axis.title`, `axis.text`, `legend.title`, `legend.text`, `strip.text`. Each one accepts an `element_text()` value. The helper makes styling reusable, you write one `element_text(size = 14)` and apply it everywhere.

Theme arguments inherit from broader categories. Setting `text = element_text(family = "Arial")` propagates the font to every other text element. More specific settings, like `axis.text`, override the broader ones.

[KEY INSIGHT]
**`element_text()` is a specification, not a styled string.** ggplot2 stores the spec, then applies it when rendering. This is why you can swap fonts across 50 plots by changing one base theme.

## Syntax and arguments

**`element_text(family, face, color, size, hjust, vjust, angle, lineheight, margin)` covers every styling need.** Each argument has a sensible default, so you only specify what you want to change.

```r title="Load ggplot2 and create a base plot"
library(ggplot2)

p <- ggplot(mtcars, aes(wt, mpg, color = factor(cyl))) +
  geom_point(size = 3) +
  labs(title = "Fuel Economy by Weight",
       subtitle = "mtcars dataset, 32 cars",
       x = "Weight (1000 lbs)",
       y = "Miles per gallon",
       color = "Cylinders",
       caption = "Source: 1974 Motor Trend")

p
```

The default theme renders all text in a moderate grey sans-serif. Every element you see, title, subtitle, axis labels, caption, legend, can be restyled with one `element_text()` per slot.

| Argument | Type | Common values |
|---|---|---|
| `family` | character | "sans", "serif", "mono", "Arial", "Times" |
| `face` | character | "plain", "bold", "italic", "bold.italic" |
| `color` | character | named colors, hex codes, "grey40" |
| `size` | numeric | 8 to 24 (points) |
| `hjust` | numeric | 0 (left), 0.5 (center), 1 (right) |
| `vjust` | numeric | 0 (bottom), 0.5 (middle), 1 (top) |
| `angle` | numeric | 0 to 360 degrees |
| `margin` | margin() | margin(t, r, b, l) in points |

## Seven styling patterns with element_text()

### 1. Bold, larger title

```r title="Larger bold title in navy"
p + theme(
  plot.title = element_text(size = 18, face = "bold", color = "navy")
)
```

`size` is in points. `face` accepts `"plain"`, `"bold"`, `"italic"`, or `"bold.italic"`. Use these to set hierarchy across title, subtitle, and axis text.

### 2. Rotate x-axis labels

```r title="Angle x-axis labels 45 degrees"
ggplot(mtcars, aes(factor(cyl), mpg)) +
  geom_boxplot() +
  theme(axis.text.x = element_text(angle = 45, hjust = 1, vjust = 1))
```

`angle` rotates around the label's center by default. Add `hjust = 1` so the right edge aligns with the tick, otherwise labels overlap the axis line.

[TIP]
**Set both `hjust` and `vjust` when rotating.** `hjust = 1` aligns the right edge; `vjust = 1` aligns the top edge. Together they keep rotated labels visually anchored.

### 3. Center the title

```r title="Center-align the plot title"
p + theme(
  plot.title = element_text(hjust = 0.5),
  plot.subtitle = element_text(hjust = 0.5)
)
```

`hjust` accepts 0 (left), 0.5 (center), 1 (right). The default for `plot.title` is 0 (left), which is why centering needs an explicit override.

### 4. Custom font family

```r title="Apply a serif font to all text"
p + theme(
  text = element_text(family = "serif"),
  plot.title = element_text(face = "bold", size = 16)
)
```

Setting `text = element_text(...)` cascades to every text element. Individual settings still override the cascade. To use Google Fonts or system fonts, register them first via `showtext::font_add_google()` or `extrafont::font_import()`.

### 5. Style the caption and subtitle

```r title="Subdued grey caption, italic subtitle"
p + theme(
  plot.subtitle = element_text(size = 11, color = "grey30", face = "italic"),
  plot.caption  = element_text(size = 9, color = "grey50", hjust = 0)
)
```

The default caption is right-aligned (`hjust = 1`). Set `hjust = 0` to left-align it under the axis label.

### 6. Margin around text

```r title="Add space below the title"
p + theme(
  plot.title = element_text(size = 16, face = "bold",
                            margin = margin(t = 0, r = 0, b = 10, l = 0))
)
```

`margin(t, r, b, l)` is in points. Use it when titles crowd the panel or axis labels collide with tick marks.

### 7. Style facet strip text

```r title="Bold white text on a dark facet strip"
ggplot(mtcars, aes(wt, mpg)) +
  geom_point() +
  facet_wrap(~ cyl) +
  theme(
    strip.text = element_text(color = "white", face = "bold", size = 12),
    strip.background = element_rect(fill = "grey30")
  )
```

`strip.text` controls facet header text. Pair it with `strip.background = element_rect(...)` to restyle the surrounding box.

[WARNING]
**`hjust` and `vjust` reverse when text is rotated.** A vertical y-axis label with `angle = 90` reads bottom-to-top, so `hjust = 0` puts the start of the word at the bottom of the axis, not the left. Always preview after changing angles.

## element_text() vs the other element_*() helpers

**Each text slot accepts only `element_text()` or `element_blank()`.** Other slots accept `element_line()` or `element_rect()`. Mixing them throws an error.

| Helper | Used for | Example slot | Returns |
|---|---|---|---|
| `element_text()` | Text styling | plot.title, axis.text | Text spec |
| `element_line()` | Lines and axes | axis.line, panel.grid | Line spec |
| `element_rect()` | Filled rectangles | panel.background, strip.background | Rect spec |
| `element_blank()` | Hide an element | any slot | Empty spec |

If you pass `element_line()` to `plot.title`, R errors with `'plot.title' must be an element_text object`. Match the helper to the slot.

## Common pitfalls

**Pitfall 1: Forgetting `theme()`.** `element_text()` returns a specification but renders nothing on its own. Always wrap it: `+ theme(plot.title = element_text(...))`.

**Pitfall 2: Wrong slot name.** Use `axis.title.x` (lowercase, dotted). `axis_title_x` or `AxisTitleX` will fail silently in older ggplot2 versions and error in newer ones. Type `?theme` for the canonical list.

**Pitfall 3: Font not found.** If `family = "Helvetica"` is not installed, R falls back to its default sans-serif WITHOUT warning. Register custom fonts first, or stick with `"sans"`, `"serif"`, `"mono"`.

**Pitfall 4: Confusing `plot.title.position` with `hjust`.** `hjust` aligns within the title box; `plot.title.position = "plot"` (ggplot2 3.3+) aligns the title to the whole plot area, including the y-axis label space. Use the latter when you want a true left-edge title.

## Try it yourself

**Try it:** Build a scatter plot of mpg vs wt from mtcars. Make the title bold size 16 in navy, rotate the x-axis labels 30 degrees, and italicize the caption. Save to `ex_styled`.

```r title="Your turn: style every text element"
ex_styled <- ggplot(mtcars, aes(wt, mpg)) +
  geom_point() +
  labs(title = "MPG vs Weight",
       caption = "Source: mtcars") +
  # your code here

ex_styled
#> Expected: a styled scatter plot
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_styled <- ggplot(mtcars, aes(wt, mpg)) +
  geom_point() +
  labs(title = "MPG vs Weight",
       caption = "Source: mtcars") +
  theme(
    plot.title = element_text(size = 16, face = "bold", color = "navy"),
    axis.text.x = element_text(angle = 30, hjust = 1),
    plot.caption = element_text(face = "italic")
  )
ex_styled
```

**Explanation:** Each text slot gets its own `element_text()` call. The title and caption styles are isolated; the rotated axis text uses `hjust = 1` to align rotated text to the tick marks.

</details>

## Related ggplot2 functions

After mastering element_text(), explore these companions:

- `theme()`: the wrapper that accepts every element_*() spec
- `element_line()`, `element_rect()`, `element_blank()`: matching helpers for lines, rectangles, and hidden elements
- `labs()`: set the actual title, subtitle, axis names, and caption text
- `margin()`: build the margin spec for text padding and plot edges
- `theme_minimal()`, `theme_classic()`, `theme_bw()`: pre-built base themes to layer styles on
- `showtext` package: load Google Fonts and custom system fonts for use in `family`

For the canonical argument list, see the [ggplot2 element_text reference](https://ggplot2.tidyverse.org/reference/element.html).

## FAQ

**How do I change the font size of axis labels in ggplot2?**

Pass `element_text(size = N)` to `axis.text` inside `theme()`. For example, `theme(axis.text = element_text(size = 12))` sets both x and y axis tick labels to size 12. Target a single axis with `axis.text.x` or `axis.text.y`. Sizes are in points; 8 to 14 is the readable range for most plots.

**Why is my custom font not showing in ggplot2?**

R only sees fonts that are registered in its graphics device. Use `extrafont::font_import()` once to register system fonts, or `showtext::font_add_google("Roboto")` plus `showtext_auto()` for Google Fonts. Without registration, R silently falls back to its default sans-serif and your `family` setting is ignored.

**What is the difference between hjust and vjust in element_text?**

`hjust` controls horizontal alignment, 0 is left, 0.5 is center, 1 is right. `vjust` controls vertical alignment, 0 is bottom, 0.5 is middle, 1 is top. For rotated text, both axes rotate too, so `hjust` controls alignment along the new horizontal direction of the rotated label. Always preview after changing `angle`.

**Can I use element_text() for plot annotations?**

No. `element_text()` only styles theme slots (titles, axis labels, legends, facet strips). For text drawn inside the plot panel, use `geom_text()`, `geom_label()`, or `annotate("text", ...)`, which accept `size`, `fontface`, `color`, and `family` arguments directly rather than through `element_text()`.

**How do I bold only part of a ggplot2 title?**

Base ggplot2 does not support partial-bold strings. Use the `ggtext` package and replace `element_text()` with `element_markdown()` from ggtext. Then write your title as `"Plot of **mpg** vs wt"` with markdown bold syntax. The package parses the markdown and renders the bold portion correctly.
