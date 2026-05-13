---
title: "ggplot2 theme_minimal() in R: Clean White-Background Theme"
slug: "ggplot2-theme_minimal-in-R"
description: "Use ggplot2 theme_minimal() in R for clean white-background plots with light gridlines. Covers base_size, fonts, and theme() overrides with 5 examples."
keywords: "ggplot2 theme_minimal, theme_minimal R, ggplot2 minimal theme, base_size, ggplot2 themes, theme_minimal vs theme_bw"
mathjax: false
webr: true
date: "2026-05-14"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "ggplot2-functions"
fr_parent: "ggplot2-Tutorial-With-R.html"
auto_link_terms: "theme_minimal()|theme_bw()|theme_classic()|theme_light()|theme_void()|theme_grey()|element_text()|element_blank()|element_line()|element_rect()|base_size|theme_set()"
auto_link_case_sensitive: true
target_keyword: "ggplot2 theme_minimal"
sibling_block_enabled: true
difficulty: "Beginner"
---

# ggplot2 theme_minimal() in R: Clean White-Background Theme

<p class="lead"><code>theme_minimal()</code> applies a clean white-background theme to ggplot2 plots with light grey gridlines, no panel border, and no axis ticks. It is one of seven complete theme bundles shipped with ggplot2 and the most popular choice for reports, dashboards, and slide decks.</p>

[QUICK ANSWER]
theme_minimal()                                           # default minimal theme
theme_minimal(base_size = 14)                             # larger text for slides
theme_minimal(base_family = "serif")                      # serif font
theme_minimal(base_size = 11, base_line_size = 0.4)       # thinner gridlines
p + theme_minimal()                                       # apply to existing plot
p + theme_minimal() + theme(legend.position = "top")      # override after base
p + theme_minimal() + theme(panel.grid = element_blank()) # drop all gridlines

[DECISION TREE: Is theme_minimal() the right tool?]
- clean white background with light grid: theme_minimal()
- white background with NO grid at all: theme_classic()
- white background, light grid, full panel border: theme_bw()
- white background, no grid, no axes (for maps): theme_void()
- override individual elements only: theme(plot.title = element_text(...))
- want the grey ggplot2 default back: theme_grey()

## What theme_minimal() does in ggplot2

**`theme_minimal()` replaces ggplot2's grey default with a clean white panel and removes panel borders and axis ticks.** Light grey gridlines remain so readers can still gauge values, but visual noise drops sharply.

It is one of seven built-in themes (`theme_grey`, `theme_minimal`, `theme_bw`, `theme_classic`, `theme_light`, `theme_dark`, `theme_void`). Add it with `+ theme_minimal()` after your geoms and labels, before any `theme()` override calls.

Internally, `theme_minimal()` builds on `theme_bw()` by stripping the panel border, axis ticks, and strip backgrounds. The result is the cleanest theme that still shows gridlines.

[KEY INSIGHT]
**Pick your base theme before you customize anything else.** `theme_minimal()` is opinionated about backgrounds, grids, and ticks. Overriding those defaults later means writing more code than just picking the right base from the start.

## Syntax and arguments

**`theme_minimal()` takes four optional arguments that scale the entire theme proportionally.** Default values produce ggplot2's standard sizing for a typical 6-by-4 inch figure.

```r title="Inspect theme_minimal arguments"
library(ggplot2)
args(theme_minimal)
#> function (base_size = 11, base_family = "", base_line_size = base_size/22,
#>     base_rect_size = base_size/22)
#> NULL
```

The four arguments:

- `base_size`: numeric. Base font size in points (default 11). All text elements scale relative to this value.
- `base_family`: character. Base font family (default `""`). Use `"serif"`, `"sans"`, `"mono"`, or a registered custom font name.
- `base_line_size`: numeric. Base width for line elements (default `base_size/22`). Scales gridlines, axis ticks, and strip lines.
- `base_rect_size`: numeric. Base width for rectangle borders (default `base_size/22`). Scales panel and strip borders.

[NOTE]
**Setting `base_size` automatically scales `base_line_size` and `base_rect_size` proportionally.** Pass them explicitly only when you want lines or borders to differ from the proportional default, for example slimmer gridlines on a slide with large text.

## Common theme_minimal() patterns

**These five patterns cover the everyday uses of `theme_minimal()`.** Each example builds on the same base scatter plot so you can compare the visual effect of every override.

### 1. Apply theme_minimal() to a basic plot

```r title="Default theme_minimal applied"
p <- ggplot(mtcars, aes(wt, mpg)) +
  geom_point(color = "steelblue", size = 3) +
  labs(title = "MPG vs Weight",
       subtitle = "mtcars dataset",
       x = "Weight (1000 lbs)",
       y = "Miles per gallon")

p + theme_minimal()
```

The white background replaces grey, gridlines stay subtle, and no border surrounds the panel.

### 2. Scale up base_size for slides

```r title="Larger text for presentations"
p + theme_minimal(base_size = 16)
```

`base_size = 16` enlarges every text element together. Axis ticks, titles, legend labels, and strip text all grow proportionally with no per-element overrides needed.

### 3. Change the font family

```r title="Serif font with theme_minimal"
p + theme_minimal(base_family = "serif")
```

`"serif"`, `"sans"` (default), and `"mono"` work without any setup. For custom fonts like "Roboto" or "Lato", register them first with `showtext::font_add_google()` or `extrafont::font_import()`.

### 4. Combine with theme() for fine-tuning

```r title="Base theme plus targeted overrides"
p +
  theme_minimal(base_size = 12) +
  theme(
    plot.title = element_text(face = "bold"),
    panel.grid.minor = element_blank(),
    legend.position = "top"
  )
```

[TIP]
**Always place `theme()` after `theme_minimal()`, not before.** Earlier theme calls are overwritten by later ones on the same element. The last theme in the chain wins.

### 5. Strip all gridlines while keeping the minimal base

```r title="Minimal with no gridlines"
p + theme_minimal() + theme(panel.grid = element_blank())
```

`panel.grid = element_blank()` removes major and minor gridlines in both directions. The white background and unbordered panel from `theme_minimal()` stay intact.

## theme_minimal() vs other minimalist themes

**Pick the right base for the medium.** Reports, papers, slides, and maps each have a preferred theme, and choosing the wrong one means rewriting overrides you did not need.

| Theme | Background | Gridlines | Panel border | Axis ticks | Best for |
|---|---|---|---|---|---|
| `theme_minimal()` | White | Light grey major + minor | None | None | Reports, dashboards |
| `theme_bw()` | White | Light grey major + minor | Full border | Visible | Publication figures |
| `theme_classic()` | White | None | L-shape axes only | Visible | Scientific papers |
| `theme_light()` | White | Light grey | Light grey border | Visible | Slides, presentations |
| `theme_void()` | White | None | None | None | Maps, sparklines |
| `theme_grey()` | Grey | White major + minor | None | Visible | ggplot2 default |

If a reviewer demands visible axis ticks, `theme_minimal()` is the wrong base. Switch to `theme_bw()` or `theme_classic()` instead. If you need a full panel border for a publication figure, `theme_bw()` is the closest cousin.

## Set theme_minimal() as the session default

**Call `theme_set(theme_minimal())` once and every subsequent ggplot call uses theme_minimal() automatically.** This avoids repeating `+ theme_minimal()` on dozens of plots.

```r title="Apply theme_minimal globally"
theme_set(theme_minimal(base_size = 12))

ggplot(mtcars, aes(wt, mpg)) + geom_point()           # uses theme_minimal
ggplot(iris, aes(Sepal.Length, Petal.Length)) +
  geom_point(aes(color = Species))                    # also uses theme_minimal
```

Reset with `theme_set(theme_grey())` to return to the ggplot2 default. Use this pattern in scripts that produce many plots with a consistent look.

## Common pitfalls

**Pitfall 1: Calling `theme()` before `theme_minimal()`.** `p + theme(text = element_text(size = 14)) + theme_minimal()` discards your size change because `theme_minimal()` comes last in the chain. Reverse the order.

**Pitfall 2: Expecting `theme_minimal()` to remove ALL gridlines.** It keeps light grey major and minor gridlines on purpose. To strip them, layer `theme(panel.grid = element_blank())` after.

**Pitfall 3: Custom font silently fails.** If `base_family = "Roboto"` still shows the default sans font, R cannot find Roboto on your system. Register it first with showtext or extrafont, or fall back to `"sans"`, `"serif"`, or `"mono"`.

**Pitfall 4: `base_size` too small for figures exported large.** ggplot2 sizes text in points relative to the device. A 6-inch PNG saved at 300 dpi shrinks text proportionally. Increase `base_size` to 14 or 16 when saving figures larger than 8 inches wide.

## Try it yourself

**Try it:** Apply `theme_minimal()` with `base_size = 14` to the mtcars scatter plot, make the plot title bold, and remove minor gridlines. Save the result to `ex_plot`.

```r title="Your turn: minimal with overrides"
ex_plot <- ggplot(mtcars, aes(wt, mpg)) +
  geom_point() +
  labs(title = "MPG vs Weight") +
  # your code here

ex_plot
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_plot <- ggplot(mtcars, aes(wt, mpg)) +
  geom_point() +
  labs(title = "MPG vs Weight") +
  theme_minimal(base_size = 14) +
  theme(
    plot.title = element_text(face = "bold"),
    panel.grid.minor = element_blank()
  )
ex_plot
```

**Explanation:** `theme_minimal(base_size = 14)` sets a larger base font for every element. The subsequent `theme()` overrides the title face and strips the minor grid. Order matters: `theme()` must follow `theme_minimal()` so the overrides win.

</details>

## Related ggplot2 themes and helpers

After mastering `theme_minimal()`, explore these companions:

- `theme_bw()`, `theme_classic()`, `theme_light()`, `theme_void()`: alternative pre-built themes
- `theme()`: low-level element-by-element customization for titles, legends, and gridlines
- `element_text()`, `element_line()`, `element_rect()`, `element_blank()`: element constructors used inside `theme()`
- `theme_set()`: set a global default theme for every plot in the session
- `ggthemes` package: extra bundles like `theme_economist`, `theme_fivethirtyeight`, `theme_wsj`
- `hrbrthemes` package: information-graphics themes like `theme_ipsum` with built-in typography

## FAQ

**What is theme_minimal() in ggplot2?**

`theme_minimal()` is a built-in ggplot2 theme that gives plots a white background, light grey gridlines, no panel border, and no axis ticks. It is one of seven complete themes (alongside `theme_grey`, `theme_bw`, `theme_classic`, `theme_light`, `theme_dark`, and `theme_void`) and the most common choice for reports and dashboards thanks to its clean, distraction-free look.

**How is theme_minimal() different from theme_bw()?**

Both use a white background and light grey gridlines, but `theme_bw()` adds a full rectangular border around the panel and keeps axis ticks visible. `theme_minimal()` removes both the panel border and axis ticks, leaving only the gridlines as visual references. Choose `theme_minimal()` for modern reports and dashboards, and `theme_bw()` for scientific publications that prefer a framed figure with visible ticks.

**How do I change the font size in theme_minimal()?**

Pass `base_size` as a numeric argument: `theme_minimal(base_size = 14)`. Every text element (plot title, axis labels, legend, strip text) scales proportionally relative to `base_size`. To restyle just one element, layer `theme(plot.title = element_text(size = 18))` after `theme_minimal()` in the same plot expression.

**Can I remove all gridlines from theme_minimal()?**

Yes. Add `theme(panel.grid = element_blank())` after `theme_minimal()` to drop both major and minor gridlines. To remove only one set, target `panel.grid.major` or `panel.grid.minor`, or be even more specific with directional variants like `panel.grid.major.x`. The white background and missing panel border from `theme_minimal()` stay intact.

**How do I set theme_minimal() as the default for all plots?**

Call `theme_set(theme_minimal())` once at the top of your script. Every subsequent `ggplot()` call uses `theme_minimal()` automatically, so you do not need to write `+ theme_minimal()` on each chart. Reset with `theme_set(theme_grey())` to return to ggplot2's default theme.
