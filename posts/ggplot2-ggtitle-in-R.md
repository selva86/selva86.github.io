---
title: "ggplot2 ggtitle() in R: Add Titles and Subtitles"
slug: "ggplot2-ggtitle-in-R"
description: "Use ggplot2 ggtitle() in R to add a title and subtitle to a plot. Covers centering, styling, multi-line titles, ggtitle vs labs, and 6 working examples."
keywords: "ggtitle, ggplot2 title, ggplot2 ggtitle, ggplot2 subtitle, ggplot2 add title, ggtitle vs labs, ggplot2 center title, ggplot2 multi-line title"
mathjax: false
webr: true
date: "2026-05-14"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "ggplot2-functions"
fr_parent: "ggplot2-Tutorial-With-R.html"
auto_link_terms: "ggtitle()|ggplot2 ggtitle|ggplot2 title|ggplot2 subtitle|ggplot2 multi-line title|center ggplot title|ggtitle vs labs"
auto_link_case_sensitive: true
target_keyword: "ggplot2 ggtitle"
sibling_block_enabled: true
difficulty: "Beginner"
---

# ggplot2 ggtitle() in R: Add Titles and Subtitles

<p class="lead">The <code>ggtitle()</code> function in ggplot2 adds a title (and optionally a subtitle) to a plot in a single short call. It is the title-only shortcut for <code>labs()</code>, useful when you do not need to set captions, tags, or axis labels.</p>

[QUICK ANSWER]
ggtitle("My title")                                                  # title only
ggtitle("My title", subtitle = "My subtitle")                        # title + subtitle
ggtitle("Line one\nLine two")                                        # multi-line title
ggtitle(NULL)                                                        # remove the title
p + ggtitle("T") + theme(plot.title = element_text(hjust = 0.5))     # center the title
p + ggtitle("T") + theme(plot.title = element_text(face = "bold"))   # bold the title
labs(title = "My title")                                             # the long form

[DECISION TREE: Is ggtitle() the right tool?]
- only a title (and maybe subtitle): ggtitle("My title")
- title plus caption, tag, or alt text: labs(title = ..., caption = ...)
- just an axis label: xlab("X") or ylab("Y")
- style font size, color, or position: theme(plot.title = element_text(...))
- annotate inside the plot panel: annotate("text", x, y, label = "...")
- relabel category names: scale_x_discrete(labels = c(...))
- format tick numbers: scale_y_continuous(labels = scales::comma)

## What ggtitle() does in one sentence

**`ggtitle()` writes the title and subtitle slots of a ggplot2 plot, and only those slots.** Every other label (caption, tag, axis names, legend titles, alt text) needs `labs()` or one of the axis shortcuts.

It is a thin wrapper around `labs()`. The two calls `ggtitle("T", subtitle = "S")` and `labs(title = "T", subtitle = "S")` produce identical output. Reach for `ggtitle()` when a title is the only label you need to change, because the call reads cleanly.

## Syntax

**`ggtitle(label, subtitle = waiver())`. The first argument is the title text; the second is the subtitle.** Pass `NULL` to clear a slot, or omit the subtitle argument to leave it untouched.

```r title="Load ggplot2 and add a title"
library(ggplot2)

p <- ggplot(mtcars, aes(wt, mpg)) + geom_point()

p + ggtitle("Heavier cars get fewer miles per gallon")
```

The base plot `p` is reusable, so you can keep adding labels to the same object across examples.

[TIP]
**Write the title as the chart's takeaway, not its description.** "Heavier cars get fewer miles per gallon" beats "MPG vs weight" because Google snippet boxes and slide-deck readers retain the conclusion, not the axes.

## Six common ggtitle() patterns

### 1. Title only

```r title="One title, nothing else"
p + ggtitle("Fuel economy by car weight")
```

### 2. Title plus subtitle

```r title="Title with a smaller subtitle line"
p + ggtitle(
  "Heavier cars are less efficient",
  subtitle = "32 cars from the 1974 Motor Trend road tests"
)
```

The subtitle renders directly below the title in a slightly smaller, lighter font.

### 3. Multi-line title via newline

```r title="Break a long title across two lines"
p + ggtitle("Fuel efficiency drops\nas cars get heavier")
```

A `\n` inside the string forces a line break inside the title slot. Useful when the title would otherwise be clipped on narrow plots.

### 4. Center the title

```r title="Center alignment via hjust"
p + ggtitle("Fuel efficiency by weight") +
  theme(plot.title = element_text(hjust = 0.5))
```

`hjust = 0` is left, `0.5` is center, `1` is right. The default in current ggplot2 is left-aligned.

### 5. Style the title font

```r title="Bold, colored, larger title"
p + ggtitle("Fuel efficiency by weight") +
  theme(plot.title = element_text(face = "bold", color = "#1f77b4", size = 16))
```

`face` accepts `"plain"`, `"bold"`, `"italic"`, or `"bold.italic"`. Color takes any valid R color string. Size is in points.

### 6. Remove a default title

```r title="Drop a previously-set title"
p_titled <- p + ggtitle("Will be removed")
p_titled + ggtitle(NULL)
```

`NULL` removes the slot completely; an empty string `""` keeps an empty gap above the plot.

[KEY INSIGHT]
**`ggtitle()` only writes; it never styles.** Spacing, font, and alignment all live in `theme(plot.title = element_text(...))`. Separating content (`ggtitle`) from presentation (`theme`) is the ggplot2 grammar's whole point.

## ggtitle() vs labs() vs xlab()/ylab()

**`ggtitle()` is a shortcut for the two title slots; `labs()` covers every slot at once.** Pick `ggtitle()` when title is the only label you are changing, and `labs()` when you also need axis labels, captions, tags, or legend titles.

| Function | Sets | When to reach for it |
|---|---|---|
| `ggtitle()` | Title and subtitle | Title-only edits; short and readable |
| `labs()` | All labels (title, subtitle, caption, tag, axis, legend) | Multiple labels in one call |
| `xlab()` / `ylab()` | One axis label | Single-axis tweak |

Under the hood, every shortcut calls `labs()`. Mixing them in one plot works (each writes its own slot), but a single `labs()` call is easier to maintain than four scattered calls. See the official ggplot2 reference for [labs()](https://ggplot2.tidyverse.org/reference/labs.html).

[NOTE]
**Coming from base R?** `ggtitle("Main")` replaces the `main` argument of `plot()` and the `main` argument of `hist()`. There is no separate `sub` slot in ggplot2; use the `subtitle` argument instead.

## Common pitfalls

**Pitfall 1: long titles get clipped.** A title wider than the plot panel is cut off when the plot is exported small. Add `\n` for a manual line break, or shrink the font with `theme(plot.title = element_text(size = 12))`.

**Pitfall 2: `ggtitle("", "Subtitle")` leaves an empty title line.** Passing an empty string keeps the slot and reserves vertical space. Use `NULL` to remove the slot, or just omit the argument.

**Pitfall 3: positional vs named arguments.** `ggtitle("A", "B")` works because `subtitle` is the second positional argument, but `ggtitle("A", subtitle = "B")` is more readable and avoids surprises when the function signature changes.

**Pitfall 4: setting alignment on the wrong element.** `theme(text = element_text(hjust = 0.5))` does NOT center the title; it targets every text element. Target the title specifically with `theme(plot.title = element_text(hjust = 0.5))`.

[WARNING]
**`hjust` on `plot.title` aligns to the plot panel, not the full image.** If your plot has a wide legend or strip text, a centered title can look off-center next to the visible panel. Add `plot.title.position = "plot"` to align relative to the full image instead.

## Try it yourself

**Try it:** Plot `wt` vs `mpg` from `mtcars`. Add a takeaway-style title, a subtitle naming the dataset, and center both. Save the plot to `ex_titled`.

```r title="Your turn: title plus centered subtitle"
ex_titled <- ggplot(mtcars, aes(wt, mpg)) +
  geom_point() +
  # your code here

ex_titled
#> Expected: a centered title above a centered subtitle
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_titled <- ggplot(mtcars, aes(wt, mpg)) +
  geom_point() +
  ggtitle(
    "Heavier cars burn more fuel",
    subtitle = "mtcars, 1974 Motor Trend road tests"
  ) +
  theme(
    plot.title    = element_text(hjust = 0.5),
    plot.subtitle = element_text(hjust = 0.5)
  )

ex_titled
```

**Explanation:** `ggtitle()` writes the text; `theme()` styles the position. Each label (title and subtitle) needs its own `element_text(hjust = 0.5)` to center, because they are separate theme elements.

</details>

## Related ggplot2 functions

After mastering `ggtitle()`, look at:

- `labs()`: set every label (title, subtitle, caption, tag, axis, legend) in one call
- `xlab()`, `ylab()`: single-axis shortcuts
- `theme()`: control font size, color, weight, and position of every label
- `element_text()`: the building block passed to `theme()` to style any text element
- `annotate()`: add free-floating text inside the plot panel rather than above it

## FAQ

**How do I add a title to a ggplot in R?**

Use `ggtitle("Your title")` and add it to the plot with `+`. For example, `ggplot(mtcars, aes(wt, mpg)) + geom_point() + ggtitle("MPG vs weight")` builds a scatter plot with a title above it. To add a subtitle as well, pass `subtitle = "..."` as the second argument.

**What is the difference between ggtitle() and labs()?**

`ggtitle()` sets only the title and subtitle slots; `labs()` sets every label on the plot (title, subtitle, caption, tag, axis labels, alt text, legend titles). Both produce identical output when only the title slot is involved. `ggtitle()` is just a shortcut around `labs(title = ..., subtitle = ...)`.

**How do I center a ggplot title?**

Add `theme(plot.title = element_text(hjust = 0.5))`. `hjust = 0` is left-aligned (the default), `0.5` is centered, and `1` is right-aligned. If you also have a subtitle, set `plot.subtitle = element_text(hjust = 0.5)` to center it as well; the two are independent theme elements.

**How do I add a subtitle in ggplot2?**

Pass `subtitle = "..."` as the second argument to `ggtitle()`, for example `ggtitle("Main title", subtitle = "Below the main title")`. The subtitle renders directly below the title in a slightly smaller, lighter font. To style it, add `theme(plot.subtitle = element_text(face = "italic"))`.

**How do I make a multi-line title in ggplot2?**

Insert a `\n` inside the title string: `ggtitle("Line one\nLine two")`. The plot panel renders each segment on its own line and the slot expands vertically to fit. This is useful when the title is too long for the plot width and would otherwise be clipped.

**How do I remove a title from a ggplot?**

Pass `NULL`: `ggtitle(NULL)`. This removes the title slot completely and the plot reclaims that vertical space. Passing an empty string (`ggtitle("")`) is different: it keeps an empty slot above the plot, which usually looks like a layout bug.
