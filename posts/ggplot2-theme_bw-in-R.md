---
title: "ggplot2 theme_bw() in R: White Theme With Panel Border"
slug: "ggplot2-theme_bw-in-R"
description: "Use ggplot2 theme_bw() in R for publication plots with a white background, light grey gridlines, and a full panel border. Six examples and 4 pitfalls."
keywords: "ggplot2 theme_bw, theme_bw R, ggplot2 bw theme, theme_bw vs theme_classic, theme_bw vs theme_minimal, base_size, ggplot2 black and white theme"
mathjax: false
webr: true
date: "2026-05-14"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "ggplot2-functions"
fr_parent: "ggplot2-Tutorial-With-R.html"
auto_link_terms: "theme_bw()|theme_classic()|theme_minimal()|theme_light()|theme_void()|theme_grey()|theme_dark()|element_text()|element_blank()|element_line()|element_rect()|base_size|theme_set()|panel.border|panel.grid"
auto_link_case_sensitive: true
target_keyword: "ggplot2 theme_bw"
sibling_block_enabled: true
difficulty: "Beginner"
---

# ggplot2 theme_bw() in R: White Theme With Panel Border

<p class="lead"><code>theme_bw()</code> applies a black-and-white theme to ggplot2 plots with a white panel background, light grey gridlines, and a full rectangular panel border. It is the internal base for both <code>theme_classic()</code> and <code>theme_minimal()</code>, and the standard choice for engineering reports and publication figures that need a visible plot frame.</p>

[QUICK ANSWER]
theme_bw()                                                  # default bw theme
theme_bw(base_size = 14)                                    # larger text for slides
theme_bw(base_family = "serif")                             # serif font for papers
theme_bw(base_size = 11, base_line_size = 0.4)              # thinner grid + border
p + theme_bw()                                              # apply to existing plot
p + theme_bw() + theme(panel.grid.minor = element_blank())  # drop minor gridlines
p + theme_bw() + theme(legend.position = "top")             # override after base
theme_set(theme_bw())                                       # set as session default

[DECISION TREE: Is theme_bw() the right tool?]
- white background, full border, light gridlines: theme_bw()
- white background, NO panel border, lighter feel: theme_minimal()
- white background, no gridlines, L-shape axes only: theme_classic()
- white background with light grey border and ticks: theme_light()
- no axes, no grid, no border (for maps): theme_void()
- the original ggplot2 grey panel: theme_grey()
- override a single element only: theme(panel.border = element_rect(...))

## What theme_bw() does in ggplot2

**`theme_bw()` strips ggplot2's grey panel and replaces it with a white background, light grey gridlines, and a full rectangular black border around the panel.** Axis ticks remain visible. The result resembles graph paper inside a thin frame.

It is one of seven complete themes in ggplot2 (`theme_grey`, `theme_minimal`, `theme_bw`, `theme_classic`, `theme_light`, `theme_dark`, `theme_void`). Internally, `theme_bw()` is the parent that `theme_minimal()` and `theme_classic()` both build on.

[KEY INSIGHT]
**Reach for `theme_bw()` when readers must read precise values from the grid AND see a bounded plot area.** The panel border separates the data region from titles and legends visually, which matters when the figure sits inside dense report text or a multi-panel layout.

## theme_bw() syntax and arguments

**`theme_bw()` accepts four optional arguments that scale the entire theme proportionally.** The defaults match the standard 6-by-4 inch ggplot2 figure.

```r title="Inspect theme_bw arguments"
library(ggplot2)
args(theme_bw)
#> function (base_size = 11, base_family = "", base_line_size = base_size/22,
#>     base_rect_size = base_size/22)
#> NULL
```

The four arguments:

- `base_size`: numeric. Base font size in points (default 11). All text elements scale relative to this value.
- `base_family`: character. Base font family (default `""`). Common values are `"serif"`, `"sans"`, `"mono"`, or a registered custom font name.
- `base_line_size`: numeric. Base width for line elements (default `base_size/22`). Controls gridline and axis tick thickness.
- `base_rect_size`: numeric. Base width for rectangle borders (default `base_size/22`). Controls the panel border thickness, which is visible in `theme_bw()` (unlike `theme_classic()` and `theme_minimal()`).

[NOTE]
**`base_rect_size` is the argument that actually matters for `theme_bw()`.** Because `theme_bw()` retains the panel border, scaling `base_rect_size` directly changes how heavy the plot frame looks on the page. Set it explicitly when the proportional default is too thick or too thin for your output medium.

## Common theme_bw() patterns

**These six patterns cover the everyday uses of `theme_bw()`.** Each example shows how the theme adapts across scatter, bar, and faceted layouts.

### 1. Apply theme_bw() to a scatter plot

```r title="Default theme_bw on iris"
p1 <- ggplot(iris, aes(Sepal.Length, Petal.Length, color = Species)) +
  geom_point(size = 2) +
  labs(title = "Petal length vs sepal length",
       x = "Sepal length (cm)",
       y = "Petal length (cm)")

p1 + theme_bw()
```

The grey panel disappears, a thin black border frames the plot area, and faint grey gridlines remain in the background. Axis ticks stay visible so readers can read values directly from the axes.

### 2. Scale up base_size for a slide

```r title="Larger text for presentations"
p1 + theme_bw(base_size = 16)
```

`base_size = 16` enlarges every text element together. Gridlines and the panel border also scale via `base_line_size` and `base_rect_size`, keeping the visual weight balanced.

### 3. Drop minor gridlines for a cleaner look

```r title="bw theme with only major grid"
p1 +
  theme_bw(base_size = 12) +
  theme(panel.grid.minor = element_blank())
```

The minor gridlines (the lighter pair between major ticks) add visual noise on small figures. Setting `panel.grid.minor = element_blank()` removes them while keeping the major grid for value lookup. This is the most common override applied on top of `theme_bw()`.

### 4. Apply theme_bw() with faceting

```r title="bw theme with faceted strips"
ggplot(mtcars, aes(wt, mpg)) +
  geom_point() +
  facet_wrap(~ cyl, labeller = label_both) +
  theme_bw(base_size = 12)
```

`theme_bw()` ships with light grey strip backgrounds that match the panel border in tone. Faceted plots feel like a uniform grid of mini-figures rather than separate floating panels.

### 5. Use theme_bw() for an engineering report

```r title="bw with thicker border for reports"
month_means <- aggregate(Ozone ~ Month, airquality, mean, na.rm = TRUE)

ggplot(month_means, aes(factor(Month), Ozone)) +
  geom_col(fill = "steelblue") +
  labs(x = "Month", y = "Mean ozone (ppb)") +
  theme_bw(base_size = 12, base_rect_size = 0.7)
```

Bumping `base_rect_size` to 0.7 draws a heavier border that survives black-and-white printing. Gridlines stay subtle because they scale with `base_line_size`, left at the default.

### 6. Build a custom theme on top of theme_bw()

```r title="Extend bw with overrides"
my_report_theme <- function(base_size = 12) {
  theme_bw(base_size = base_size) +
    theme(
      plot.title = element_text(face = "bold", hjust = 0),
      panel.grid.minor = element_blank(),
      panel.border = element_rect(linewidth = 0.6),
      strip.background = element_rect(fill = "grey95", color = NA)
    )
}

p1 + my_report_theme()
```

[TIP]
**Wrap `theme_bw()` plus your overrides in a function and reuse it across every figure in a report.** This is exactly how `ggthemes::theme_economist()` and `cowplot::theme_cowplot()` are built. Keep the wrapper near the top of your analysis script so all plots inherit the same look.

## theme_bw() vs theme_classic, theme_minimal, and theme_light

**Pick the right base before customizing.** The seven built-in themes each cover a different reader expectation; the wrong base means writing extra `theme()` overrides you did not need.

| Theme | Background | Gridlines | Panel border | Axis ticks | Best for |
|---|---|---|---|---|---|
| `theme_bw()` | White | Light grey major + minor | Full black border | Visible | Engineering reports, publication figures |
| `theme_classic()` | White | None | L-shape axes only | Visible | Scientific papers, journals |
| `theme_minimal()` | White | Light grey major + minor | None | None | Reports, dashboards |
| `theme_light()` | White | Light grey | Light grey border | Visible | Slides, presentations |
| `theme_void()` | White | None | None | None | Maps, sparklines |
| `theme_grey()` | Grey | White major + minor | None | Visible | ggplot2 default |
| `theme_dark()` | Dark grey | Lighter grey | None | Visible | Dark-mode dashboards |

If you want the same grid but a softer frame, switch to `theme_light()` (light grey border instead of black). If you do not need the frame at all, switch to `theme_minimal()`. If readers should not see gridlines, switch to `theme_classic()`.

## Set theme_bw() as the session default

**Call `theme_set(theme_bw())` once and every later ggplot inherits it automatically.** This avoids repeating `+ theme_bw()` across a multi-figure report.

```r title="Apply theme_bw globally"
theme_set(theme_bw(base_size = 12))

ggplot(mtcars, aes(wt, mpg)) + geom_point()             # uses theme_bw
ggplot(iris, aes(Sepal.Length, Petal.Length)) +
  geom_point(aes(color = Species))                      # also uses theme_bw
```

Reset with `theme_set(theme_grey())` to return to ggplot2's default.

## Common pitfalls when using theme_bw()

[WARNING]
**`theme()` calls after `theme_bw()` win; `theme()` calls before lose.** A chain like `p + theme(text = element_text(size = 14)) + theme_bw()` discards the size change because `theme_bw()` comes last and reapplies its own defaults. Reverse the order so `theme()` comes after the base.

**Pitfall 2: Gridlines disappear when you blank the panel.** Setting `panel.background = element_blank()` on top of `theme_bw()` also hides the gridlines because they render against the panel layer. To keep grid but drop the fill, use `panel.background = element_rect(fill = NA, color = NA)` instead.

**Pitfall 3: Border looks too heavy on small figures.** The default `base_rect_size` works at 6-by-4 inches but feels thick on a tiny inset or a 2-by-2 panel. Reduce it with `theme_bw(base_rect_size = 0.4)` or override directly via `theme(panel.border = element_rect(linewidth = 0.4))`.

**Pitfall 4: Custom font silently falls back.** If `base_family = "Times New Roman"` still shows the default sans font, R cannot find the font on your system. Register it first with `extrafont::font_import()` or `showtext::font_add()`, or stick to safe values `"serif"`, `"sans"`, or `"mono"`.

## Try it yourself

**Try it:** Apply `theme_bw()` with `base_size = 13` to a mtcars scatter, bold and center the title, and drop the minor gridlines. Save the result to `ex_bw_plot`.

```r title="Your turn: bw with overrides"
ex_bw_plot <- ggplot(mtcars, aes(wt, mpg)) +
  geom_point(color = "darkblue", size = 2.5) +
  labs(title = "MPG vs Weight",
       x = "Weight (1000 lbs)", y = "Miles per gallon") +
  # your code here

ex_bw_plot
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_bw_plot <- ggplot(mtcars, aes(wt, mpg)) +
  geom_point(color = "darkblue", size = 2.5) +
  labs(title = "MPG vs Weight",
       x = "Weight (1000 lbs)", y = "Miles per gallon") +
  theme_bw(base_size = 13) +
  theme(
    plot.title = element_text(face = "bold", hjust = 0.5),
    panel.grid.minor = element_blank()
  )
ex_bw_plot
```

**Explanation:** `theme_bw(base_size = 13)` sets the base theme. The follow-up `theme()` bolds and centers the title, then strips the minor gridlines to keep only the major grid. Order matters: `theme()` must come after `theme_bw()` so the overrides survive.

</details>

## Related ggplot2 themes and helpers

After mastering `theme_bw()`, explore its closest companions:

- `theme_classic()`, `theme_minimal()`, `theme_light()`, `theme_void()`: alternative built-in themes
- `theme()`: element-by-element customization for titles, gridlines, panel borders
- `element_text()`, `element_line()`, `element_rect()`, `element_blank()`: element constructors
- `theme_set()`: global default theme for every plot in the session
- `ggthemes` package: `theme_economist`, `theme_few`, `theme_tufte` built on `theme_bw()`

See the [ggplot2 complete themes documentation](https://ggplot2.tidyverse.org/reference/ggtheme.html).

## FAQ

**What is theme_bw() in ggplot2?**

`theme_bw()` is a built-in ggplot2 theme that gives plots a white background, light grey major and minor gridlines, and a full rectangular black panel border. Axis ticks remain visible. It is one of seven complete themes in ggplot2 and the internal base that `theme_classic()` and `theme_minimal()` both extend. Use it when you want a bounded plot area with visible gridlines for value reads.

**What is the difference between theme_bw() and theme_classic()?**

Both use a white background and visible axis ticks, but `theme_bw()` keeps light grey gridlines and a full rectangular panel border, while `theme_classic()` removes both, leaving only the bottom and left axis lines. Pick `theme_bw()` for engineering reports that depend on the grid, and `theme_classic()` for journal submissions.

**How is theme_bw() different from theme_minimal()?**

`theme_bw()` keeps a full black panel border around the plot area; `theme_minimal()` drops the border. Both share a white background and light grey gridlines, but `theme_minimal()` also removes axis ticks. Choose `theme_bw()` when the figure needs a visible frame, and `theme_minimal()` when you want a lighter look without a bounding box.

**How do I remove minor gridlines from theme_bw()?**

Append `theme(panel.grid.minor = element_blank())` after `theme_bw()`. The minor gridlines are the lighter pair drawn between major ticks; removing them is the most common manual override applied on top of `theme_bw()` because they often look noisy on small figures. To strip ALL gridlines (major and minor), use `theme(panel.grid = element_blank())` instead.

**How do I set theme_bw() as the default for every plot?**

Call `theme_set(theme_bw())` at the top of your script. Every later `ggplot()` call inherits the theme automatically. Reset with `theme_set(theme_grey())` to restore the ggplot2 default. This is the standard way to enforce a consistent look across figures in a report.
