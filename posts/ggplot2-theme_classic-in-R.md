---
title: "ggplot2 theme_classic() in R: L-Shape Axis Theme for Papers"
slug: "ggplot2-theme_classic-in-R"
description: "Use ggplot2 theme_classic() in R to render plots with a white background, no gridlines, and L-shape axes. Six examples, base_size tips, and 4 pitfalls."
keywords: "ggplot2 theme_classic, theme_classic R, ggplot2 classic theme, theme_classic vs theme_minimal, theme_classic vs theme_bw, no gridlines ggplot2"
mathjax: false
webr: true
date: "2026-05-14"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "ggplot2-functions"
fr_parent: "ggplot2-Tutorial-With-R.html"
auto_link_terms: "theme_classic()|theme_minimal()|theme_bw()|theme_light()|theme_void()|theme_grey()|theme_dark()|element_text()|element_blank()|element_line()|element_rect()|base_size|theme_set()|axis.line"
auto_link_case_sensitive: true
target_keyword: "ggplot2 theme_classic"
sibling_block_enabled: true
difficulty: "Beginner"
---

# ggplot2 theme_classic() in R: L-Shape Axis Theme for Papers

<p class="lead"><code>theme_classic()</code> applies a publication-ready theme to ggplot2 plots with a white background, no gridlines, and L-shape axis lines along the bottom and left edges only. It is the default choice for scientific journals and academic papers that prefer visible axis ticks over background grids.</p>

[QUICK ANSWER]
theme_classic()                                          # default classic theme
theme_classic(base_size = 14)                            # larger text for journals
theme_classic(base_family = "serif")                     # serif font for papers
theme_classic(base_size = 11, base_line_size = 0.5)      # thicker axis lines
p + theme_classic()                                      # apply to existing plot
p + theme_classic() + theme(legend.position = "top")     # move legend after base
p + theme_classic() + theme(panel.grid.major.y = element_line()) # add y-grid back
theme_set(theme_classic())                               # set as session default

[DECISION TREE: Is theme_classic() the right tool?]
- white background, no grid, L-shape axes: theme_classic()
- white background WITH light gridlines: theme_minimal()
- white background with full panel border: theme_bw()
- no axes, no grid (for maps): theme_void()
- light grey grid with light border (slides): theme_light()
- the original grey panel ggplot2 look: theme_grey()
- override a single element only: theme(plot.title = element_text(...))

## What theme_classic() does in ggplot2

**`theme_classic()` strips ggplot2's panel grid and replaces the full panel border with two axis lines along the bottom and left edges.** The result looks like a hand-drawn scientific figure: white panel, visible ticks, no visual noise.

It is one of seven complete themes in ggplot2 (`theme_grey`, `theme_minimal`, `theme_bw`, `theme_classic`, `theme_light`, `theme_dark`, `theme_void`). Add it with `+ theme_classic()` after geoms and labels.

Internally, `theme_classic()` builds on `theme_bw()` by removing panel gridlines and the panel border, then drawing a single line for `axis.line.x` and `axis.line.y` only. Axis ticks stay visible, which is why most journals accept it as is.

[KEY INSIGHT]
**`theme_classic()` favors precision over fast reading.** Without gridlines, readers rely on axis ticks to estimate values, so a small journal-column scatter works well, but a wide dashboard with many points loses readability.

## Syntax and arguments

**`theme_classic()` accepts four optional arguments that scale the entire theme proportionally.** The defaults match the standard 6-by-4 inch ggplot2 figure.

```r title="Inspect theme_classic arguments"
library(ggplot2)
args(theme_classic)
#> function (base_size = 11, base_family = "", base_line_size = base_size/22,
#>     base_rect_size = base_size/22)
#> NULL
```

The four arguments:

- `base_size`: numeric. Base font size in points (default 11). All text elements scale relative to this value.
- `base_family`: character. Base font family (default `""`). Common values are `"serif"`, `"sans"`, `"mono"`, or a registered custom font name.
- `base_line_size`: numeric. Base width for line elements (default `base_size/22`). Controls axis line and tick thickness.
- `base_rect_size`: numeric. Base width for rectangle borders (default `base_size/22`). Has no visible effect on most plots since the panel border is already removed.

[NOTE]
**Setting `base_size` alone scales `base_line_size` and `base_rect_size` proportionally.** Override them explicitly only when you want axis lines to be thicker or thinner than the proportional default, for example a 0.8pt axis line on a 14pt slide.

## Common theme_classic() patterns

**These six patterns cover the everyday uses of `theme_classic()`.** Each example uses a different base plot so you can see how the theme adapts across scatter, bar, and line geoms.

### 1. Apply theme_classic() to a scatter plot

```r title="Default theme_classic on iris"
p1 <- ggplot(iris, aes(Sepal.Length, Petal.Length, color = Species)) +
  geom_point(size = 2) +
  labs(title = "Petal length vs sepal length",
       x = "Sepal length (cm)",
       y = "Petal length (cm)")

p1 + theme_classic()
```

The grey panel disappears, the panel border is gone, and only the bottom and left axes are drawn. Axis ticks remain visible so readers can read values without a grid.

### 2. Scale up base_size for a journal figure

```r title="Larger text for a journal column"
p1 + theme_classic(base_size = 14)
```

`base_size = 14` enlarges every text element together. Most two-column journal layouts require 9 to 12pt labels at the final printed size; bumping `base_size` to 14 and saving at 4 inches wide keeps the rendered text in that range.

### 3. Switch to a serif font for papers

```r title="Serif font with theme_classic"
p1 + theme_classic(base_family = "serif")
```

`"serif"`, `"sans"`, and `"mono"` work without setup. For Times New Roman or Computer Modern (LaTeX defaults), register the font with `extrafont::font_import()` or `showtext::font_add()` before passing its family name.

### 4. Apply theme_classic() to a bar chart

```r title="Classic theme on a bar chart"
month_means <- aggregate(Ozone ~ Month, airquality, mean, na.rm = TRUE)

ggplot(month_means, aes(factor(Month), Ozone)) +
  geom_col(fill = "steelblue") +
  labs(x = "Month", y = "Mean ozone (ppb)") +
  theme_classic(base_size = 12)
```

Bar charts often work better with `theme_classic()` than with `theme_minimal()` because the absence of gridlines lets each bar stand out without competing horizontal lines.

### 5. Add a subtle y-grid back for readability

```r title="Classic with selective gridlines"
p1 +
  theme_classic(base_size = 12) +
  theme(
    panel.grid.major.y = element_line(color = "grey90", linewidth = 0.3),
    legend.position = "top"
  )
```

[TIP]
**Restoring only the horizontal major grid keeps the publication look while helping readers gauge values.** Avoid restoring both x and y grids; that defeats the purpose of `theme_classic()` and you might as well use `theme_bw()` instead.

### 6. Combine with theme() for fine-tuning

```r title="Classic with title and axis tweaks"
p1 +
  theme_classic(base_size = 12) +
  theme(
    plot.title = element_text(face = "bold", hjust = 0.5),
    axis.line = element_line(linewidth = 0.6),
    axis.ticks.length = unit(0.2, "cm")
  )
```

`theme()` always follows `theme_classic()`. Earlier theme calls on the same plot are overwritten by later ones, so the order in the chain decides who wins.

## theme_classic() vs other ggplot2 themes

**Pick the right base theme before customizing anything.** The seven built-in themes each cover a different reader expectation, and choosing the wrong one means rewriting overrides you did not need.

| Theme | Background | Gridlines | Panel border | Axis ticks | Best for |
|---|---|---|---|---|---|
| `theme_classic()` | White | None | L-shape axes only | Visible | Scientific papers, journals |
| `theme_minimal()` | White | Light grey major + minor | None | None | Reports, dashboards |
| `theme_bw()` | White | Light grey major + minor | Full border | Visible | Publication figures |
| `theme_light()` | White | Light grey | Light grey border | Visible | Slides, presentations |
| `theme_void()` | White | None | None | None | Maps, sparklines |
| `theme_grey()` | Grey | White major + minor | None | Visible | ggplot2 default |
| `theme_dark()` | Dark grey | Lighter grey | None | Visible | Dark-mode dashboards |

If you need a full panel border, switch to `theme_bw()`. If readers must scan many data points for value lookup, switch to `theme_minimal()` or restore the grid as shown in pattern 5.

## Set theme_classic() as the session default

**Call `theme_set(theme_classic())` once and every later ggplot call inherits the theme automatically.** This avoids repeating `+ theme_classic()` across dozens of plots in a manuscript script.

```r title="Apply theme_classic globally"
theme_set(theme_classic(base_size = 12))

ggplot(mtcars, aes(wt, mpg)) + geom_point()              # uses theme_classic
ggplot(iris, aes(Sepal.Length, Petal.Length)) +
  geom_point(aes(color = Species))                       # also uses theme_classic
```

Reset with `theme_set(theme_grey())` to return to ggplot2's default. Keep the global call at the top of your analysis script so every figure in the paper or report inherits the same look.

## Common pitfalls

**Pitfall 1: Calling `theme()` before `theme_classic()`.** A chain like `p + theme(text = element_text(size = 14)) + theme_classic()` discards your size change because `theme_classic()` comes last and reapplies its own defaults. Reverse the order so `theme()` comes after.

**Pitfall 2: Expecting gridlines to remain.** Unlike `theme_minimal()` and `theme_bw()`, `theme_classic()` removes BOTH major and minor gridlines. If the reader needs a grid, add it back selectively with `theme(panel.grid.major.y = element_line())` as shown in pattern 5.

**Pitfall 3: Facet strip backgrounds look bare.** `theme_classic()` strips the strip background fill, so `facet_wrap()` labels float on white. Restore them with `theme(strip.background = element_rect(fill = "grey90", color = NA))` if your audience expects boxed strip headers.

**Pitfall 4: Custom font silently falls back.** If `base_family = "Times New Roman"` still shows the default sans font, R cannot find the font on your system. Register it first with `extrafont` or `showtext`, or use the safe values `"serif"`, `"sans"`, or `"mono"`.

## Try it yourself

**Try it:** Apply `theme_classic()` with `base_size = 13` to a mtcars scatter, make the plot title bold and centered, and add a faint horizontal major grid. Save the result to `ex_classic_plot`.

```r title="Your turn: classic with overrides"
ex_classic_plot <- ggplot(mtcars, aes(wt, mpg)) +
  geom_point(color = "darkred", size = 2.5) +
  labs(title = "MPG vs Weight",
       x = "Weight (1000 lbs)", y = "Miles per gallon") +
  # your code here

ex_classic_plot
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_classic_plot <- ggplot(mtcars, aes(wt, mpg)) +
  geom_point(color = "darkred", size = 2.5) +
  labs(title = "MPG vs Weight",
       x = "Weight (1000 lbs)", y = "Miles per gallon") +
  theme_classic(base_size = 13) +
  theme(
    plot.title = element_text(face = "bold", hjust = 0.5),
    panel.grid.major.y = element_line(color = "grey90", linewidth = 0.3)
  )
ex_classic_plot
```

**Explanation:** `theme_classic(base_size = 13)` sets the base theme. The follow-up `theme()` bolds and centers the title, then restores only the horizontal major grid for value readability. Order matters: `theme()` must come after `theme_classic()` so the overrides survive.

</details>

## Related ggplot2 themes and helpers

After mastering `theme_classic()`, explore its closest companions:

- `theme_bw()`, `theme_minimal()`, `theme_light()`, `theme_void()`: alternative built-in themes
- `theme()`: element-by-element customization for titles, legends, and axis lines
- `element_text()`, `element_line()`, `element_rect()`, `element_blank()`: element constructors
- `theme_set()`: global default theme for every plot in the session
- `ggthemes` package: bundles like `theme_economist`, `theme_few`, `theme_tufte`
- `cowplot::theme_cowplot()`: publication-ready theme modeled on `theme_classic()`

See the [ggplot2 complete themes documentation](https://ggplot2.tidyverse.org/reference/ggtheme.html).

## FAQ

**What is theme_classic() in ggplot2?**

`theme_classic()` is a built-in ggplot2 theme that gives plots a white background, no gridlines, and L-shape axis lines along the bottom and left edges. Axis ticks remain visible. It is one of seven complete themes in ggplot2 and the standard choice for scientific journals and figures that prefer ticks over background grids.

**What is the difference between theme_classic() and theme_minimal()?**

`theme_classic()` removes all gridlines and draws two axis lines with visible ticks, producing the scientific paper look. `theme_minimal()` keeps light grey gridlines and removes both the panel border and axis ticks for a cleaner report look. Use `theme_classic()` when readers read precise values from ticks, and `theme_minimal()` when readers scan trends across a grid.

**How is theme_classic() different from theme_bw()?**

Both use a white background, but `theme_bw()` keeps gridlines and a full rectangular panel border, while `theme_classic()` strips the grid and the border, leaving only the bottom and left axis lines. Pick `theme_classic()` for journal submissions and `theme_bw()` for engineering reports that depend on the grid for value reads.

**How do I add gridlines back to theme_classic()?**

Append `theme(panel.grid.major = element_line(color = "grey90"))` after `theme_classic()` to restore both major grids. For a single direction, target `panel.grid.major.x` or `panel.grid.major.y`. Use a light colour like `"grey90"` so the grid stays subtle and does not compete with the data.

**How do I set theme_classic() as the default for every plot?**

Call `theme_set(theme_classic())` at the top of your script. Every later `ggplot()` call inherits the theme automatically. Reset with `theme_set(theme_grey())` to restore the ggplot2 default. This is the standard way to enforce a consistent look across all figures in a paper or report.
