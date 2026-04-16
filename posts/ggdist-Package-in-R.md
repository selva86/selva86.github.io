---
title: "ggdist Package in R: Visualize Distributions & Uncertainty (Raincloud Plots)"
slug: ggdist-Package-in-R
description: "Master ggdist in R: build raincloud plots, half-eye plots, and uncertainty bands with stat_halfeye, stat_dots, and stat_interval — runnable examples."
keywords: "ggdist, raincloud plot, R uncertainty visualization, stat_halfeye, stat_dots, stat_interval, ggplot2 distribution, half-eye plot, stat_pointinterval, ggdist tutorial"
auto_link_terms: "ggdist|ggdist package|raincloud plot|stat_halfeye()|stat_dots()|stat_interval()|stat_pointinterval()"
auto_link_case_sensitive: true
mathjax: false
webr: true
date: 2026-04-14
curriculum_id: FR-inte-3
post_type: FR
fr_parent: ggplot2-Distribution-Charts.html
difficulty: "Intermediate"
---

# ggdist Package in R: Visualize Distributions & Uncertainty (Raincloud Plots)

<p class="lead">The <code>ggdist</code> package extends ggplot2 with geoms and stats that draw raw data, full distributions, and uncertainty intervals in the same frame — the foundation for raincloud plots and uncertainty visuals in R.</p>

## What is a raincloud plot and when should you use one?

A raincloud plot shows three things at once: the raw observations (the rain), the kernel density (the cloud), and a summary box for the quartiles. It tells you at a glance whether a group has outliers, bimodality, or just a wide spread — details a plain boxplot hides. Let's build one on the `iris` dataset so you can see the payoff before we break apart the pieces.

The code below layers three geoms on the same `Species → Sepal.Length` mapping: `stat_halfeye()` for the half-density cloud, `geom_boxplot()` for the quartile box, and `stat_dots()` for the raw observations pushed to one side. Run the block and watch three familiar plots fuse into one.

```r
library(ggplot2)
library(ggdist)

ggplot(iris, aes(x = Species, y = Sepal.Length, fill = Species)) +
  stat_halfeye(adjust = 0.5, width = 0.6, justification = -0.2,
               .width = 0, point_colour = NA) +
  geom_boxplot(width = 0.12, outlier.shape = NA, alpha = 0.5) +
  stat_dots(side = "left", justification = 1.1, binwidth = 0.05) +
  coord_flip() +
  labs(title = "Sepal length by species", y = "Sepal length (cm)", x = NULL) +
  theme_minimal()
#> A raincloud plot appears: each species has a density cloud on the right,
#> a quartile box in the middle, and a strip of dots on the left.
```

Look at `virginica`: the cloud is noticeably wider than the box suggests, and the dots on the left reveal a small cluster near 7.7 cm that a boxplot would smooth away. This is the whole point — the raincloud shows *shape*, not just quartiles. Readers notice the long tail and ask the right follow-up question.

[KEY INSIGHT]
**One raincloud plot replaces a boxplot, a histogram, and a dot plot stacked together.** You get central tendency, spread, individual values, and distributional shape in a single frame — and the reader's eye naturally fuses them.

**Try it:** Rebuild the same plot, but show `Petal.Width` instead of `Sepal.Length`. The rest stays the same — only the `y` mapping changes.

```r
# Try it: raincloud for Petal.Width
ggplot(iris, aes(x = Species, y = ___, fill = Species)) +
  stat_halfeye(adjust = 0.5, width = 0.6, justification = -0.2,
               .width = 0, point_colour = NA) +
  geom_boxplot(width = 0.12, outlier.shape = NA, alpha = 0.5) +
  stat_dots(side = "left", justification = 1.1, binwidth = 0.05) +
  coord_flip() +
  theme_minimal()
#> Expected: three clouds — setosa tight near 0.2, versicolor around 1.3, virginica around 2.0.
```

<details>
<summary>Click to reveal solution</summary>

```r
ggplot(iris, aes(x = Species, y = Petal.Width, fill = Species)) +
  stat_halfeye(adjust = 0.5, width = 0.6, justification = -0.2,
               .width = 0, point_colour = NA) +
  geom_boxplot(width = 0.12, outlier.shape = NA, alpha = 0.5) +
  stat_dots(side = "left", justification = 1.1, binwidth = 0.05) +
  coord_flip() +
  theme_minimal()
#> setosa's cloud is extremely narrow — nearly all values sit at 0.2 cm.
```

**Explanation:** Swapping the `y` aesthetic is enough; every layer inherits the same mapping from `ggplot()`.

</details>

## How does stat_halfeye() draw the half-density cloud?

`stat_halfeye()` is the core ggdist function. It draws a half-density slab plus an interval underneath, and every raincloud plot's "cloud" layer is this function. Two parameters matter most: `adjust` controls the kernel bandwidth (smoothness), and `.width` sets which intervals to draw below the density.

The code below shows `stat_halfeye()` in isolation on iris, with two different `adjust` values so you can see how bandwidth changes the shape. Lower `adjust` = wigglier density; higher `adjust` = smoother.

```r
library(patchwork)  # to place plots side by side

p1 <- ggplot(iris, aes(x = Sepal.Length, y = Species, fill = Species)) +
  stat_halfeye(adjust = 0.5, .width = c(0.66, 0.95)) +
  labs(title = "adjust = 0.5 (wiggly)") +
  theme_minimal() + theme(legend.position = "none")

p2 <- ggplot(iris, aes(x = Sepal.Length, y = Species, fill = Species)) +
  stat_halfeye(adjust = 2, .width = c(0.66, 0.95)) +
  labs(title = "adjust = 2 (smooth)") +
  theme_minimal() + theme(legend.position = "none")

p1 + p2
#> Two half-density plots side by side: the left is bumpier and shows
#> local peaks; the right is a smooth bell shape. The black bars below
#> each density are the 66% (thick) and 95% (thin) intervals.
```

Notice the intervals underneath each density. The thick black bar is the 66% interval (middle two-thirds of the data) and the thin bar is the 95% interval. Setting `.width = c(0.66, 0.95)` drew both at once, which is the convention for showing nested uncertainty without clutter.

[TIP]
**Pass a vector to .width to draw nested intervals in one call.** `c(0.5, 0.8, 0.95)` gives you three bars of decreasing thickness — readers see the uncertainty hierarchy without needing a legend.

**Try it:** Draw the same halfeye but suppress the interval bar entirely by setting `.width = 0`.

```r
# Try it: density only, no interval bar
ggplot(iris, aes(x = Sepal.Length, y = Species, fill = Species)) +
  stat_halfeye(adjust = 1, .width = ___) +
  theme_minimal()
#> Expected: clouds only, no bars underneath.
```

<details>
<summary>Click to reveal solution</summary>

```r
ggplot(iris, aes(x = Sepal.Length, y = Species, fill = Species)) +
  stat_halfeye(adjust = 1, .width = 0) +
  theme_minimal()
#> The half-densities render without any interval bar below them.
```

**Explanation:** `.width = 0` tells ggdist to skip the interval geom entirely, leaving only the slab (density).

</details>

## How do stat_dots() and stat_slab() complete the raincloud?

`stat_dots()` draws a quantile dot plot — every dot represents a slice of the distribution, so the shape of the dot cloud is itself informative. `stat_slab()` is the density-only sibling of `stat_halfeye()`: same cloud, no interval bar. Together with `geom_boxplot()` they form the three layers of a raincloud plot.

The block below stacks all three on a single iris plot, styled more carefully than the opening example. Pay attention to `side = "left"` on `stat_dots()` — that's what pushes the rain to one side while the cloud floats on the other.

```r
ggplot(iris, aes(x = Species, y = Sepal.Length, fill = Species)) +
  stat_slab(adjust = 0.5, width = 0.6, justification = -0.2,
            slab_alpha = 0.6) +
  geom_boxplot(width = 0.12, outlier.shape = NA, alpha = 0.8) +
  stat_dots(side = "left", justification = 1.15,
            binwidth = 0.04, dotsize = 0.8) +
  coord_flip() +
  scale_fill_brewer(palette = "Set2") +
  labs(title = "Raincloud plot: three layers revealed",
       y = "Sepal length (cm)", x = NULL) +
  theme_minimal() + theme(legend.position = "none")
#> A cleaner raincloud plot with a pastel palette. The slab forms the cloud,
#> the boxplot sits inside it, and the quantile dots form the rain.
```

![Raincloud anatomy: dots, density, and boxplot layered into one plot](screenshots/ggdist-Package-in-R-raincloud-anatomy.webp)
*Figure 1: A raincloud plot layers three geoms — stat_dots for raw observations, stat_halfeye (or stat_slab) for the density cloud, and geom_boxplot for quartile summaries.*

Each dot in `stat_dots()` is not a raw observation — it's a *quantile dot*, placed at an even slice of the distribution. That's why changing `binwidth` affects how dots are spaced but not their total count per group. The dot cloud's shape mirrors the density curve, giving the reader a second redundant signal that the pattern is real, not an artifact.

**Try it:** Move `stat_dots()` to `side = "right"` so the rain and the cloud switch sides. Leave everything else.

```r
# Try it: flip which side the dots sit on
ggplot(iris, aes(x = Species, y = Sepal.Length, fill = Species)) +
  stat_slab(adjust = 0.5, width = 0.6, justification = -0.2) +
  geom_boxplot(width = 0.12, outlier.shape = NA) +
  stat_dots(side = ___, justification = 1.15, binwidth = 0.04) +
  coord_flip() + theme_minimal()
#> Expected: the dot strip appears on the same side as the cloud, overlapping visually.
```

<details>
<summary>Click to reveal solution</summary>

```r
ggplot(iris, aes(x = Species, y = Sepal.Length, fill = Species)) +
  stat_slab(adjust = 0.5, width = 0.6, justification = -0.2) +
  geom_boxplot(width = 0.12, outlier.shape = NA) +
  stat_dots(side = "right", justification = 1.15, binwidth = 0.04) +
  coord_flip() + theme_minimal()
#> Dots and cloud overlap — this is why the convention is to put them on opposite sides.
```

**Explanation:** `side = "right"` places the dot cloud on the same side as the `stat_slab` density. The two geoms overlap, which is exactly why rainclouds put dots on `"left"` by default.

</details>

## How do you show uncertainty with stat_interval() and stat_pointinterval()?

Most raincloud tutorials stop at the cloud. But ggdist's real superpower is visualizing *uncertainty intervals* — the job that would otherwise need a custom `geom_errorbar()`. `stat_interval()` draws multiple nested confidence bands at once, and `stat_pointinterval()` draws a single point estimate with its interval attached.

The code below summarises `mpg` by number of cylinders from `mtcars`, then uses `stat_pointinterval()` to show the mean and three nested intervals at 50%, 80%, and 95% widths. No model needed — ggdist computes the intervals directly from the data.

```r
mt_df <- mtcars
mt_df$cyl <- factor(mt_df$cyl)

ggplot(mt_df, aes(x = cyl, y = mpg, colour = cyl)) +
  stat_pointinterval(.width = c(0.5, 0.8, 0.95),
                     point_size = 3) +
  labs(title = "Fuel economy by cylinder count",
       subtitle = "Point = mean; bars = 50%, 80%, 95% intervals",
       y = "Miles per gallon", x = "Cylinders") +
  theme_minimal() + theme(legend.position = "none")
#> Three clusters on the x-axis (4, 6, 8 cylinders), each with a central dot
#> and three stacked interval bars of decreasing thickness. 4-cyl cars
#> clearly have higher mpg and a wider 95% band due to small sample size.
```

The three nested bars do the work of a conventional error bar plus two reference intervals in one geom. Readers immediately see that 4-cylinder cars have both higher mean mpg *and* wider uncertainty (because only 11 of the 32 cars in mtcars are 4-cylinder). That's a story a single error bar couldn't tell.

[NOTE]
**ggdist computes intervals from raw data by default.** You don't need to fit a model — `stat_pointinterval()` uses the sample quantiles. If you *do* have a model (e.g., a Bayesian posterior), pass samples via the `dist_sample()` helper and ggdist will compute intervals from those instead.

**Try it:** Swap `stat_pointinterval()` for `stat_interval()` (same `.width` values) and see how the plot changes.

```r
# Try it: stat_interval shows only the bands, no point
ggplot(mt_df, aes(x = cyl, y = mpg, colour = cyl)) +
  ___(.width = c(0.5, 0.8, 0.95)) +
  theme_minimal()
#> Expected: three bars per group, but no center dot.
```

<details>
<summary>Click to reveal solution</summary>

```r
ggplot(mt_df, aes(x = cyl, y = mpg, colour = cyl)) +
  stat_interval(.width = c(0.5, 0.8, 0.95)) +
  theme_minimal()
#> Three nested bars per cylinder group; center point is gone.
```

**Explanation:** `stat_interval()` draws interval bands only, while `stat_pointinterval()` adds the central point estimate on top. Use `stat_interval()` when the point itself would clutter the figure (e.g., many small groups).

</details>

## How do you visualize analytical distributions with dist_normal()?

So far every plot has been driven by raw data. But sometimes you want to draw a *named* distribution — a Normal, a Beta, a Student-t — to compare shapes, illustrate a concept, or overlay a theoretical curve on empirical data. ggdist's `dist_*` family lets you do this with the same stats you already know.

The trick is the `xdist` aesthetic. Instead of mapping `x` to a variable, you map `xdist` to a distribution object built with `dist_normal()`, `dist_beta()`, `dist_student_t()`, and friends. Then `stat_slab()` draws the parametric density directly.

```r
library(distributional)  # provides dist_normal, dist_beta, dist_student_t

df <- data.frame(
  name = c("Normal(0, 1)", "Student-t(3)", "Beta(2, 5)"),
  dist = c(dist_normal(0, 1), dist_student_t(df = 3), dist_beta(2, 5))
)

ggplot(df, aes(y = name, xdist = dist, fill = name)) +
  stat_slab() +
  labs(title = "Three distributions drawn from parameters alone",
       x = "Value", y = NULL) +
  theme_minimal() + theme(legend.position = "none")
#> Three stacked density curves: a symmetric bell (Normal), a taller-tailed
#> bell (Student-t with 3 df), and a right-skewed hump bounded on [0,1] (Beta).
```

Not a single data point touches `stat_slab()` here — ggdist asks the `distributional` package to evaluate each curve and draws the density. This is the same mechanism used to plot Bayesian posteriors: you pass `dist_sample(posterior_draws)` and ggdist handles the rest.

![ggdist function map: pick by what you want to show](screenshots/ggdist-Package-in-R-function-map.webp)
*Figure 2: Pick a ggdist function by what you want to show — distribution shape, uncertainty interval, or individual observations.*

[KEY INSIGHT]
**The same stat_slab() that draws a raincloud's cloud also draws a parametric distribution.** ggdist unifies raw-data densities, analytical distributions, and model posteriors under one API — learn the stats once, use them for all three.

**Try it:** Change the Student-t's degrees of freedom from 3 to 30. The shape should converge toward a Normal curve (a standard result from probability theory).

```r
# Try it: heavier vs lighter Student-t tails
df2 <- data.frame(
  name = c("t(df=3)", "t(df=___)"),
  dist = c(dist_student_t(df = 3), dist_student_t(df = ___))
)
ggplot(df2, aes(y = name, xdist = dist)) + stat_slab() + theme_minimal()
#> Expected: the df=30 curve is visibly narrower in the middle and has much lighter tails.
```

<details>
<summary>Click to reveal solution</summary>

```r
df2 <- data.frame(
  name = c("t(df=3)", "t(df=30)"),
  dist = c(dist_student_t(df = 3), dist_student_t(df = 30))
)
ggplot(df2, aes(y = name, xdist = dist)) + stat_slab() + theme_minimal()
#> The df=30 curve looks nearly identical to a standard Normal.
```

**Explanation:** As `df → ∞`, the Student-t distribution converges to the Normal. At `df = 30` the two are already visually indistinguishable, which is why statistics texts say "use Normal instead of t when n > 30."

</details>

## Practice Exercises

### Exercise 1: Raincloud for mtcars mpg by cylinder count

Build a raincloud plot of `mpg` grouped by `cyl` from `mtcars`. Use `stat_halfeye()` for the cloud, `geom_boxplot()` for the box, and `stat_dots()` for the rain. Flip the coordinates so cylinder counts appear on the y-axis.

```r
# Exercise 1: build a raincloud of mpg by cyl
# Hint: convert cyl to a factor first; use coord_flip()

ex_mt <- mtcars
ex_mt$cyl <- factor(ex_mt$cyl)

# Write your ggplot code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
ex_mt <- mtcars
ex_mt$cyl <- factor(ex_mt$cyl)

ggplot(ex_mt, aes(x = cyl, y = mpg, fill = cyl)) +
  stat_halfeye(adjust = 0.8, width = 0.6, justification = -0.2,
               .width = 0, point_colour = NA) +
  geom_boxplot(width = 0.12, outlier.shape = NA, alpha = 0.5) +
  stat_dots(side = "left", justification = 1.1, binwidth = 0.5) +
  coord_flip() +
  labs(title = "mtcars mpg by cylinder count",
       y = "Miles per gallon", x = "Cylinders") +
  theme_minimal() + theme(legend.position = "none")
#> A raincloud showing 4-cyl cars clearly separate from 8-cyl cars,
#> with 6-cyl in between.
```

**Explanation:** `cyl` must be a factor for ggplot to treat it as a grouping variable. The rest is the standard three-layer raincloud recipe from earlier sections.

</details>

### Exercise 2: Combine stat_halfeye and stat_pointinterval

Build a single plot that layers `stat_halfeye()` with a thin `.width = 0` (density only) and `stat_pointinterval()` at `.width = c(0.66, 0.95)` on top. Use `iris` and show `Sepal.Length` by `Species`. The effect: a density cloud *and* an explicit interval summary on the same figure.

```r
# Exercise 2: overlay halfeye density + pointinterval summary
# Hint: call both stat_* functions; give stat_halfeye .width = 0

ex_combo <- iris

# Write your ggplot code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
ex_combo <- iris

ggplot(ex_combo, aes(x = Species, y = Sepal.Length, fill = Species)) +
  stat_halfeye(adjust = 0.8, .width = 0, justification = -0.1,
               point_colour = NA, slab_alpha = 0.5) +
  stat_pointinterval(.width = c(0.66, 0.95),
                     position = position_nudge(x = -0.1)) +
  coord_flip() +
  theme_minimal() + theme(legend.position = "none")
#> Each species gets a density cloud AND a summary point with nested interval bars.
```

**Explanation:** `stat_halfeye()` handles the density shape, `stat_pointinterval()` adds the summary. `position_nudge()` offsets the interval slightly so the two layers don't overlap visually.

</details>

### Exercise 3: Three Beta distributions from parameters

Use `dist_beta()` and `stat_slab()` to plot Beta(1, 1), Beta(2, 5), and Beta(5, 2) on the same figure. These three shapes illustrate the uniform, right-skewed, and left-skewed cases of the Beta family.

```r
# Exercise 3: plot three Beta distributions
# Hint: build a data.frame with name + dist columns, then stat_slab

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
beta_df <- data.frame(
  name = c("Beta(1, 1)", "Beta(2, 5)", "Beta(5, 2)"),
  dist = c(dist_beta(1, 1), dist_beta(2, 5), dist_beta(5, 2))
)

ggplot(beta_df, aes(y = name, xdist = dist, fill = name)) +
  stat_slab() +
  labs(title = "Three shapes of the Beta distribution",
       x = "Value (0 to 1)", y = NULL) +
  theme_minimal() + theme(legend.position = "none")
#> A flat rectangle (Beta(1,1) = uniform), a right-skewed hump (Beta(2,5)),
#> and a left-skewed hump (Beta(5,2)).
```

**Explanation:** Beta(1, 1) is the uniform distribution on [0, 1]. Raising either shape parameter above 1 creates a hump; when the first exceeds the second the hump leans right, and vice versa.

</details>

## Putting It All Together

Let's close with an end-to-end raincloud on a larger dataset: `diamonds$price` by `cut`. This one uses every pattern from the tutorial — halfeye cloud, boxplot summary, quantile dots, coordinate flip, custom palette — and shows what a publication-ready figure looks like.

```r
set.seed(314)
dia_df <- diamonds[sample(nrow(diamonds), 2000), ]  # sub-sample for speed

ggplot(dia_df, aes(x = cut, y = price, fill = cut)) +
  stat_halfeye(adjust = 0.7, width = 0.6, justification = -0.15,
               .width = c(0.66, 0.95), slab_alpha = 0.7) +
  geom_boxplot(width = 0.1, outlier.shape = NA, alpha = 0.6) +
  stat_dots(side = "left", justification = 1.1,
            binwidth = 200, dotsize = 0.4, alpha = 0.6) +
  scale_y_continuous(labels = scales::dollar) +
  scale_fill_brewer(palette = "Set3") +
  coord_flip() +
  labs(title = "Diamond price by cut quality",
       subtitle = "Raincloud plot with 66% and 95% intervals on the cloud",
       y = "Price (USD)", x = NULL,
       caption = "Source: ggplot2::diamonds, n=2000 sub-sample") +
  theme_minimal() +
  theme(legend.position = "none")
#> A rich raincloud plot: 5 cuts on the y-axis, each with a density cloud
#> (fading into 66% and 95% intervals), a quartile box, and a strip of
#> sampled dots on the left. Note the strong right skew — most diamonds
#> cluster under $5000 but there's a long tail past $15,000.
```

The long right tail is the thing to notice. All five cuts have similar lower halves, but `Ideal` and `Premium` cuts extend further into the expensive range. A boxplot would show the medians as nearly equal and mislead you; the raincloud makes the tail story obvious.

## Summary

| Function | Shows | Typical use |
|---|---|---|
| `stat_halfeye()` | Half density + interval bar | Raincloud cloud layer; summary with uncertainty |
| `stat_slab()` | Density only (slab) | Parametric distributions, no intervals |
| `stat_dots()` | Quantile dots | Raincloud rain layer |
| `stat_interval()` | Nested interval bands | Forest-plot style summaries |
| `stat_pointinterval()` | Point + interval | Model/group summary with uncertainty |
| `dist_normal()` / `dist_beta()` / `dist_student_t()` | Parametric distribution objects | Plot without raw data via `xdist` aesthetic |

- **Rainclouds = halfeye + boxplot + dots.** Opposite sides prevent overlap.
- **`.width` accepts a vector.** Draw nested intervals in one call.
- **`xdist` + `dist_*()` plots distributions from parameters.** Same stats, no raw data needed.
- **Intervals come from raw quantiles by default.** No model required for `stat_pointinterval()`.
- **Use `adjust` to tune density smoothness.** Lower = wigglier, higher = smoother.

## References

1. ggdist documentation — Matthew Kay. [mjskay.github.io/ggdist](https://mjskay.github.io/ggdist/)
2. ggdist on CRAN — package reference manual. [cran.r-project.org/package=ggdist](https://cran.r-project.org/package=ggdist)
3. Allen, M., Poggiali, D., Whitaker, K., Marshall, T. R., & Kievit, R. A. — *Raincloud plots: a multi-platform tool for robust data visualization*. Wellcome Open Research (2019). [Link](https://wellcomeopenresearch.org/articles/4-63)
4. Kay, M. — *Uncertainty visualization with ggdist* (package vignette). [Link](https://mjskay.github.io/ggdist/articles/slabinterval.html)
5. Wilke, C. — *Fundamentals of Data Visualization*, Chapter 9: Visualizing distributions. [Link](https://clauswilke.com/dataviz/)
6. distributional package — Mitchell O'Hara-Wild. [pkg.mitchelloharawild.com/distributional](https://pkg.mitchelloharawild.com/distributional/)
7. tidyverse blog — ggdist release notes. [Link](https://www.tidyverse.org/tags/ggdist/)

## Continue Learning

1. [ggplot2 Distribution Charts: Histograms, Density, Boxplots](ggplot2-Distribution-Charts.html) — the parent post on basic distribution geoms
2. [ggplot2 Tutorial](ggplot2-Tutorial.html) — ggplot2 fundamentals if you want a refresher on layers and aesthetics
3. [Density Plot in R](Density-Plot-With-R.html) — base-R and lattice approaches to density visualization
