---
title: "ggplot2 stat_smooth() in R: Stat-Side Trend Smoothing"
slug: "ggplot2-stat_smooth-in-R"
description: "Use ggplot2 stat_smooth() to fit trend lines in R with examples: stat vs geom duality, the geom argument, computed variables, and geom_smooth comparison."
keywords: "ggplot2 stat_smooth, stat_smooth function R, stat_smooth vs geom_smooth, ggplot2 trend line stat, R smoothing stat, ggplot2 computed variables, after_stat smoother"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "ggplot2-functions"
fr_parent: "ggplot2-Tutorial-With-R.html"
auto_link_terms: "stat_smooth()|ggplot2 stat_smooth|stat-side smoothing|ggplot2::stat_smooth()|stat_smooth ggplot|ggplot stat_smooth"
auto_link_case_sensitive: true
target_keyword: "ggplot2 stat_smooth"
sibling_block_enabled: true
difficulty: "Beginner"
---

# ggplot2 stat_smooth() in R: Stat-Side Trend Smoothing

<p class="lead">The <code>stat_smooth()</code> function in ggplot2 is the stat-side twin of <code>geom_smooth()</code>: same fitted curve, same confidence ribbon, but written from the statistical-transformation angle. Reach for it when you want to pair the smoother with a non-default geom or surface its fitted values via <code>after_stat()</code>.</p>

[QUICK ANSWER]
ggplot(df, aes(x, y)) + stat_smooth()                              # default loess
ggplot(df, aes(x, y)) + stat_smooth(method = "lm")                 # linear fit
ggplot(df, aes(x, y)) + stat_smooth(method = "lm", se = FALSE)     # no CI band
ggplot(df, aes(x, y)) + stat_smooth(geom = "line")                 # custom geom
ggplot(df, aes(x, y)) + stat_smooth(geom = "ribbon", alpha = 0.3)  # band only
ggplot(df, aes(x, y)) + stat_smooth(method = "lm", fullrange = TRUE)
ggplot(df, aes(x, y)) + stat_smooth(aes(weight = w), method = "lm")

[DECISION TREE: Is stat_smooth() the right tool?]
- stat-first phrasing, default line plus ribbon: stat_smooth(method = "lm")
- you prefer the geom-first name: geom_smooth(method = "lm")
- you need the fitted values themselves: stat_smooth(aes(y = after_stat(y)))
- a non-default geom for the smoother: stat_smooth(geom = "step")
- one model with full diagnostics: fit lm() then geom_line()
- band only, no line: stat_smooth(geom = "ribbon")
- group-specific lines: aes(group = grp) + stat_smooth(method = "lm")

## What stat_smooth() does in one sentence

**`stat_smooth()` fits a smoother to (x, y) data and returns a fitted line plus a confidence ribbon, identical in output to `geom_smooth()`.** The two functions share the same layer constructor under the hood; they differ only in which side of the stat geom pairing you name first.

For most exploratory work, `geom_smooth()` reads more naturally because you are usually thinking "add a trend line". You reach for `stat_smooth()` in three situations: when you want the statistical transformation visible in the call so reviewers see the model intent, when you swap the default geom (replace line plus ribbon with a step, a ribbon-only band, or fitted points), or when you need to surface the computed columns (`y`, `ymin`, `ymax`, `se`) through `after_stat()` for downstream mapping.

ggplot2 documents `stat_smooth()` and `geom_smooth()` as a paired layer, both calling `StatSmooth$compute_group()`. Anything you can pass to one, you can pass to the other. The arguments `method`, `formula`, `se`, `span`, `level`, `n`, `fullrange`, and `na.rm` mean the same thing in both calls.

## Syntax

**`stat_smooth()` takes the same aesthetics as `geom_smooth()`, plus a `geom` argument that overrides the default visual.**

```r title="Load ggplot2 and define a small dataset"
library(ggplot2)

set.seed(42)
df <- data.frame(
  x = seq(0, 10, length.out = 80),
  y = 3 + 0.7 * seq(0, 10, length.out = 80) + rnorm(80, sd = 1.2)
)
head(df, 3)
#>           x        y
#> 1 0.0000000 4.646438
#> 2 0.1265823 4.011937
#> 3 0.2531646 2.748366
```

The full signature:

```r title="stat_smooth function signature"
stat_smooth(mapping = NULL, data = NULL, geom = "smooth",
            position = "identity", ..., method = NULL, formula = NULL,
            se = TRUE, n = 80, span = 0.75, fullrange = FALSE,
            level = 0.95, method.args = list(), na.rm = FALSE,
            orientation = NA, show.legend = NA, inherit.aes = TRUE)
```

The `geom = "smooth"` default produces the familiar line plus ribbon. Override it to redirect the fitted output into any geom that accepts the computed columns.

[NOTE]
**`stat_smooth()` and `geom_smooth()` build the exact same layer.** Choose by what reads better at the call site; performance and output are identical.

## Examples that suit stat_smooth() specifically

**These six patterns lean on the stat-first phrasing, especially the `geom` argument.** Each one is harder to express cleanly with `geom_smooth()`.

### 1. Default linear fit, stat-first phrasing

```r title="Linear smoother with default ribbon"
ggplot(df, aes(x, y)) +
  geom_point(alpha = 0.6) +
  stat_smooth(method = "lm")
```

Identical visual to `geom_smooth(method = "lm")`. The stat-first phrasing reads "add a smooth transformation, draw with the default geom" and is the convention in stat-heavy reports where the modeling step is the focus.

### 2. Replace the default geom with a step

```r title="Same fitted values, drawn as steps"
ggplot(df, aes(x, y)) +
  geom_point(alpha = 0.5) +
  stat_smooth(method = "lm", geom = "step",
              color = "firebrick", se = FALSE)
```

Passing `geom = "step"` reroutes the smoothed predictions through `geom_step()` instead of `geom_smooth()`'s default. Useful when the underlying data is naturally stepped (counts, rankings) but you still want a model-based summary on top.

### 3. Ribbon-only confidence band

```r title="Confidence band without a fitted line"
ggplot(df, aes(x, y)) +
  geom_point(alpha = 0.5) +
  stat_smooth(method = "lm", geom = "ribbon",
              alpha = 0.25, fill = "steelblue")
```

`geom = "ribbon"` keeps the confidence band and hides the line. Useful when you overlay multiple bands or when the fitted line is drawn separately for emphasis later in the layer stack.

### 4. Access fitted values via after_stat()

```r title="Map the smoother computed y back into the plot"
ggplot(df, aes(x, y)) +
  geom_point(alpha = 0.5) +
  stat_smooth(method = "lm", se = FALSE) +
  stat_smooth(method = "lm", geom = "point",
              aes(y = after_stat(y)),
              color = "orange", size = 2)
```

`stat_smooth()` exposes computed columns named `y`, `ymin`, `ymax`, `se`, and `flipped_aes`. `after_stat(y)` pulls the fitted value at each predicted x so you can plot it as points, segments, or labels.

### 5. Extend the line beyond the data range

```r title="Extrapolate fit to plot extent"
ggplot(df, aes(x, y)) +
  geom_point(alpha = 0.5) +
  stat_smooth(method = "lm", fullrange = TRUE) +
  xlim(-2, 12)
```

`fullrange = TRUE` projects the fitted line across the full x-axis instead of stopping at the data's x range. Use when you need to show extrapolation explicitly and label it as such.

### 6. Weighted regression

```r title="Weight observations by a column"
df$w <- runif(nrow(df), 0.1, 1)
ggplot(df, aes(x, y)) +
  geom_point(aes(size = w), alpha = 0.5) +
  stat_smooth(aes(weight = w), method = "lm", color = "darkgreen")
```

Mapping `weight = w` makes ggplot pass the weight vector through to the underlying `lm()` call. Heavier rows pull the line harder, matching inverse-variance or sampling-design adjustments.

[KEY INSIGHT]
**The `geom` argument is the whole reason `stat_smooth()` exists as a separate name.** Without it, `geom_smooth()` covers every case. Whenever you want "the fitted values from a smoother, but drawn as something other than a line and ribbon", swap `geom_smooth()` for `stat_smooth(geom = "...")` and you are done.

## stat_smooth() vs geom_smooth(): a side-by-side

**Both calls construct the same ggplot2 layer; the difference is which side of the stat geom pairing reads more naturally at the call site.**

| Aspect | `stat_smooth()` | `geom_smooth()` |
|---|---|---|
| Default geom | `smooth` (line plus ribbon) | `smooth` (line plus ribbon) |
| Default stat | `smooth` | `smooth` |
| Override target | `geom` argument | `stat` argument |
| Reads as | "compute a smoother, draw it" | "draw a smoothed line" |
| Method options | identical | identical |
| Computed columns | `y`, `ymin`, `ymax`, `se` | same, via `after_stat()` |
| Best for | swapping the visual representation | adding a quick trend line |

If you write a lot of plots with custom geoms (`geom_step`, `geom_ribbon`, points on fitted values), `stat_smooth()` keeps the smoother visible in the function name. If you just want a regression line on a scatter, `geom_smooth()` reads better.

## Common pitfalls

**Pitfall 1: assuming `stat_smooth()` is more powerful than `geom_smooth()`.** It is not. They construct the same layer. The split exists for naming consistency with ggplot2's stat geom pattern, not for capability.

**Pitfall 2: forgetting to wrap `after_stat()` around computed names.** Writing `aes(y = y)` inside a second `stat_smooth()` layer refers to the raw data `y`, not the fitted value. Use `aes(y = after_stat(y))` to pull the smoother's prediction column.

[WARNING]
**The `geom = "..."` argument only works with geoms that accept the computed columns.** Mapping a smoother's output to `geom_bar()` or `geom_boxplot()` silently fails or warns. Stick to line, point, ribbon, segment, step, and text.

**Pitfall 3: chaining two identical `stat_smooth()` calls.** Two layers with the same `method`, `geom`, and aesthetics just draw the line twice. The second call is wasted work; use it only when you change `geom`, `color`, or `aes()`.

## Try it yourself

**Try it:** Add a linear `stat_smooth()` to the `mpg` dataset (x = `displ`, y = `hwy`) but draw the smoother as POINTS at each computed prediction instead of the default line. Save the plot to `ex_smooth`.

```r title="Your turn: smoother as points"
# Try it: render the smoother as points, not the default line
ex_smooth <- ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point(alpha = 0.4) +
  # your stat_smooth here

ex_smooth
#> Expected: scatter with extra orange points along the fitted line
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_smooth <- ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point(alpha = 0.4) +
  stat_smooth(method = "lm", geom = "point",
              color = "orange", size = 2, se = FALSE)

ex_smooth
```

**Explanation:** `geom = "point"` redirects the smoother's fitted predictions through `geom_point()`. By default `n = 80`, so you get 80 evenly spaced points along the fit. `se = FALSE` avoids drawing the ribbon, which `geom_point()` cannot interpret.

</details>

## Related ggplot2 functions

**After `stat_smooth()`, several stat and geom siblings are worth knowing.**

- `geom_smooth()`: the geom-first twin; identical layer, more natural for trend lines
- `stat_summary()`: arbitrary summary statistics on top of a scatter
- `stat_function()`: draw a user-supplied math function across x
- `stat_quantile()`: quantile regression smoother for non-mean trends
- `after_stat()` and `after_scale()`: access computed columns inside an aesthetic
- The official ggplot2 reference: [ggplot2.tidyverse.org/reference/geom_smooth.html](https://ggplot2.tidyverse.org/reference/geom_smooth.html)

For mixed-effects or non-Gaussian models, fit with `lme4::lmer()` or `mgcv::gam()` and use `ggeffects::ggpredict()` to extract predictions for plotting via `geom_line()`.

## FAQ

**What is the difference between stat_smooth and geom_smooth?**

There is no functional difference. Both construct the same ggplot2 layer with the same default stat (`StatSmooth`) and default geom (`GeomSmooth`). `stat_smooth()` reads more naturally when you override the geom (`geom = "step"`, `geom = "ribbon"`); `geom_smooth()` reads more naturally for a plain trend line. Pick whichever phrasing makes the modeling intent clearer at the call site.

**How do I access the fitted values from stat_smooth?**

`stat_smooth()` computes columns named `y`, `ymin`, `ymax`, `se`, and `flipped_aes`. Reference them inside `aes()` using `after_stat()`, for example `aes(y = after_stat(y))`. To get the raw fitted values into a data frame instead of plotting them, fit the model with `lm()` or `gam()` separately and call `predict()` with a grid of `newdata` values.

**Can I use stat_smooth without geom_point?**

Yes. `stat_smooth()` only needs `aes(x, y)` to fit and draw. The scatter points are a separate `geom_point()` layer you add for visual context. The smoother runs over the mapped `(x, y)` data regardless of whether points are drawn, so a plot with only `stat_smooth()` shows the fitted line and ribbon alone.

**Does stat_smooth work with categorical x?**

Not directly. A smoother requires a numeric x to fit a model over. For categorical x, use `stat_summary()` with `fun = mean` or `fun.data = mean_cl_normal` to draw a category-level summary, or convert the categorical to a numeric position before mapping it to x.

**Why does stat_smooth print a console message about method?**

When `method = NULL` (the default), ggplot2 picks LOESS for N below 1000 and GAM for larger and prints the choice. Pass `method = "lm"`, `"loess"`, or `"gam"` explicitly to silence the message and lock the behavior across data sizes, which keeps your plots reproducible as the dataset grows.
