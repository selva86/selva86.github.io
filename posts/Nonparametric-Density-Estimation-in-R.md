---
title: "Nonparametric Density Estimation in R: KDE, Bandwidth Selection"
slug: "Nonparametric-Density-Estimation-in-R"
description: "Master nonparametric density estimation in R: KDE with density(), bandwidth selection (bw.nrd0, bw.SJ, bw.ucv), and ggplot2 plotting with full examples."
keywords: "nonparametric density estimation R, kernel density estimation, density() R, bandwidth selection R, bw.nrd0, bw.SJ, KDE in R, geom_density, R density plot"
auto_link_terms: "kernel density estimation|nonparametric density estimation|bandwidth selection|Sheather-Jones bandwidth|Silverman's rule of thumb|cross-validation bandwidth|KDE in R"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-30"
curriculum_id: "FR-nonp-10"
post_type: "FR"
fr_parent: "When-to-Use-Nonparametric-Tests-in-R.html"
difficulty: "Intermediate"
---

# Nonparametric Density Estimation in R: KDE, Bandwidth Selection

<p class="lead">Nonparametric density estimation lets you visualize the shape of a continuous variable without assuming any specific distribution. In R, the workhorse is <code>density()</code>, which builds a smooth kernel density estimate (KDE) by averaging tiny bumps placed at every observation.</p>

## How do you build a kernel density estimate in R?

Pick any continuous variable and you can see its shape in three lines of code. The base function `density()` does the heavy lifting: it places a small bump (a kernel) on each data point, sums all the bumps, and returns a smooth curve. Pass that curve to `plot()` and you get an instant picture of where values cluster, how skewed they are, and whether the distribution has more than one peak.

We'll start with `faithful$eruptions`, the eruption durations of Old Faithful. It's a built-in dataset and a classic teaching example because the distribution is clearly bimodal.

```r title="First KDE on Old Faithful eruptions"
# Build a kernel density estimate
d_eruptions <- density(faithful$eruptions)
plot(d_eruptions, main = "KDE: Old Faithful eruption duration")
#> 
#> Call:
#> 	density.default(x = faithful$eruptions)
#> 
#> Data: faithful$eruptions (272 obs.); Bandwidth 'bw' = 0.3348
#> 
#>        x                y            
#>  Min.   :0.5957   Min.   :0.0002262  
#>  1st Qu.:1.9728   1st Qu.:0.0514171  
#>  Median :3.3500   Median :0.1447010  
#>  Mean   :3.3500   Mean   :0.1814334  
#>  Max.   :4.7272   Max.   :0.4842095
```

The plot shows two distinct peaks, around 2 minutes and 4.5 minutes, telling us short and long eruptions form separate clusters. A histogram with a poorly chosen bin width could easily hide that. The `density` object also reports a chosen bandwidth (`bw = 0.3348`) and 512 evaluation points by default. We'll come back to bandwidth in a moment.

[KEY INSIGHT]
**A KDE is a smoothed histogram with no bin-edge choice.** Histograms force you to pick bin widths and starting points; small changes can move bars around. KDE replaces both choices with a single bandwidth parameter that controls smoothness directly.

**Try it:** Compute and plot the KDE of `iris$Sepal.Length`. Does the distribution look unimodal or multimodal?

```r title="Your turn: KDE of iris Sepal.Length"
# Try it: build and plot the density of iris$Sepal.Length

# Uncomment and complete:
# ex_iris_dens <- density( ??? )
# plot(ex_iris_dens, main = "KDE: iris Sepal.Length")
#> Expected: a curve with one main peak near 5.0 and a smaller shoulder near 6.5
```

<details>
<summary>Click to reveal solution</summary>

```r title="iris Sepal.Length KDE solution"
ex_iris_dens <- density(iris$Sepal.Length)
plot(ex_iris_dens, main = "KDE: iris Sepal.Length")
#> A curve with a tall peak near 5.0 and a softer shoulder near 6.5,
#> hinting at a mixture of species
```

**Explanation:** `density()` accepts any numeric vector. The shoulder you see is the contribution of the larger species (versicolor and virginica) overlapping with setosa.

</details>

## What does R's density() function actually return?

A `density` object is just a list with a few useful pieces. The two you'll reach for most often are `x` (the grid of input values where the estimate was evaluated, 512 points by default) and `y` (the estimated density at each grid point). Knowing the structure lets you treat the KDE as data, not just a plot.

Here's the full structure for the eruptions estimate.

```r title="Inspect the density object"
str(d_eruptions)
#> List of 7
#>  $ x        : num [1:512] 0.596 0.604 0.612 0.62 0.628 ...
#>  $ y        : num [1:512] 0.000266 0.000284 0.000302 0.000322 0.000342 ...
#>  $ bw       : num 0.335
#>  $ n        : int 272
#>  $ call     : language density.default(x = faithful$eruptions)
#>  $ data.name: chr "faithful$eruptions"
#>  $ has.na   : logi FALSE
#>  - attr(*, "class")= chr "density"
```

`bw` is the bandwidth, `n` is the original sample size (272), and the `x`/`y` pair lets you read off the estimated density anywhere on the curve. Want the density at a specific value? Build a function from the curve with `approxfun()`.

```r title="Evaluate the density at any x value"
# Turn the KDE into a function you can call
dfun <- approxfun(d_eruptions$x, d_eruptions$y, rule = 2)

# Estimated density at 2.0 and 4.5 minutes (the two peaks)
dfun(c(2.0, 4.5))
#> [1] 0.4055288 0.4842095

# Density at the trough between peaks
dfun(3.0)
#> [1] 0.05796673
```

The two peaks have density values around 0.40 and 0.48 (the right peak is slightly taller), while the trough at 3 minutes is more than 7x lower. That ratio is what makes the bimodality visually clear and is also useful when you want to compute things like the relative likelihood of two values under the estimated distribution.

[TIP]
**`approxfun()` turns a KDE into a callable function.** That makes downstream computation easy: integrate over a region, find the mode with `optimize()`, or compare two distributions point-by-point.

**Try it:** Use `dfun()` to estimate the density at x = 4 minutes. Is it closer to the trough or the peak?

```r title="Your turn: evaluate density at x = 4"
# Try it: call dfun() at x = 4

# Uncomment and complete:
# ex_dval <- dfun( ??? )
# ex_dval
#> Expected: a value near 0.32, between trough (0.06) and right peak (0.48)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Density at x = 4 solution"
ex_dval <- dfun(4.0)
ex_dval
#> [1] 0.3232566
```

**Explanation:** 4.0 sits on the climb up to the right peak at 4.5, so the density (~0.32) is between the trough value (~0.06) and the peak value (~0.48).

</details>

## Which kernel function should you choose?

A kernel is the small bump R places on each data point. `density()` supports seven shapes: `gaussian` (the default), `epanechnikov`, `rectangular`, `triangular`, `biweight`, `cosine`, and `optcosine`. Each is a non-negative function that integrates to 1. They differ in how their weight tapers off near the edges, but on real data the visual differences are tiny when the bandwidth is held fixed.

Let's overlay three of them at the same bandwidth so you can see for yourself.

```r title="Compare three kernels at the same bandwidth"
x <- faithful$eruptions
h <- 0.3  # fix bandwidth so only the kernel shape changes

plot(density(x, bw = h, kernel = "gaussian"),
     main = "Same bandwidth, three kernels", lwd = 2)
lines(density(x, bw = h, kernel = "epanechnikov"), col = "red", lwd = 2)
lines(density(x, bw = h, kernel = "rectangular"), col = "blue", lwd = 2)
legend("topright", c("gaussian", "epanechnikov", "rectangular"),
       col = c("black", "red", "blue"), lwd = 2)
#> Three nearly-overlapping curves; rectangular looks slightly less smooth
```

The three curves trace almost the same shape. The rectangular kernel (a flat box) is a touch jagged at the edges; the other two are smooth. In published comparisons, the Epanechnikov kernel is theoretically optimal for minimizing mean integrated squared error, but the efficiency gap to Gaussian is roughly 5%, well below what bandwidth choice can do.

[NOTE]
**Pick the bandwidth carefully; let the kernel default to gaussian.** Switching kernels rarely changes a real conclusion. Switching bandwidths can swap a unimodal interpretation for a bimodal one.

**Try it:** Re-plot the eruptions KDE with `kernel = "epanechnikov"` and the default bandwidth.

```r title="Your turn: switch to the Epanechnikov kernel"
# Try it: change the kernel argument

# Uncomment and complete:
# ex_epan <- density(faithful$eruptions, kernel = ??? )
# plot(ex_epan, main = "Eruptions KDE, Epanechnikov kernel")
#> Expected: a curve almost identical to the default gaussian fit
```

<details>
<summary>Click to reveal solution</summary>

```r title="Epanechnikov kernel solution"
ex_epan <- density(faithful$eruptions, kernel = "epanechnikov")
plot(ex_epan, main = "Eruptions KDE, Epanechnikov kernel")
#> Bandwidth 'bw' = 0.3348, same default selector, almost identical shape
```

**Explanation:** R picks the bandwidth with `bw.nrd0` regardless of the kernel argument, so swapping kernels at the default settings barely moves the curve.

</details>

## How do you select the bandwidth?

Bandwidth is the single most important choice in nonparametric density estimation. A small bandwidth makes every data point its own narrow spike (a wiggly, noisy curve). A large bandwidth blurs the data into one wide hill (oversmoothed, peaks gone). The good news: R ships with five data-driven selectors that pick a sensible value for you.

Silverman's rule of thumb is a closed-form formula based on the spread of the data:

$$h_{\text{Silverman}} = 0.9 \cdot \min\!\left(\hat\sigma, \frac{\text{IQR}}{1.34}\right) \cdot n^{-1/5}$$

Where:
- $\hat\sigma$ = sample standard deviation
- $\text{IQR}$ = interquartile range
- $n$ = sample size

It's fast and works well for unimodal, near-normal data. Other selectors (Scott's rule, unbiased and biased cross-validation, the Sheather-Jones plug-in) trade speed for better behavior on tricky distributions.

```r title="Compute all five bandwidth selectors"
x <- faithful$eruptions

bw_silv  <- bw.nrd0(x)   # Silverman's rule (default)
bw_scott <- bw.nrd(x)    # Scott's rule
bw_ucv   <- bw.ucv(x)    # Unbiased cross-validation
bw_bcv   <- bw.bcv(x)    # Biased cross-validation
bw_sj    <- bw.SJ(x)     # Sheather-Jones plug-in

c(silverman = bw_silv, scott = bw_scott, ucv = bw_ucv,
  bcv = bw_bcv, SJ = bw_sj)
#>  silverman      scott        ucv        bcv         SJ 
#> 0.33483994 0.39450637 0.10394933 0.34953474 0.13928847
```

The five selectors disagree by more than a factor of three on the same data. Silverman, Scott, and biased cross-validation cluster around 0.33-0.40 (they assume something close to a smooth, single-peak shape). Unbiased CV and Sheather-Jones drop to ~0.10-0.14 because they detect that this distribution is bimodal and want a narrower bandwidth to preserve both peaks. That spread is exactly why the choice matters.

Now plot four KDEs with deliberately different bandwidths so you can see what each value does to the curve.

```r title="Visualize how bandwidth changes the curve"
plot(density(x, bw = bw_silv / 4), main = "Effect of bandwidth", lwd = 2)
lines(density(x, bw = bw_silv),     col = "red",   lwd = 2)
lines(density(x, bw = bw_silv * 4), col = "blue",  lwd = 2)
lines(density(x, bw = bw_sj),       col = "darkgreen", lwd = 2)
legend("topright",
       c("h/4 (under-smoothed)", "Silverman", "4h (over-smoothed)", "Sheather-Jones"),
       col = c("black", "red", "blue", "darkgreen"), lwd = 2)
#> Black: spiky and bumpy; Blue: a single wide hill (peaks lost);
#> Red: smooth bimodal; Green: bimodal with sharper peaks
```

Look at the blue curve, at four times Silverman's bandwidth, the bimodal shape is gone and you'd never guess Old Faithful had two eruption regimes. The black curve has invented spurious peaks. Red and green both recover the truth, but the Sheather-Jones fit has cleaner, sharper peaks. That is the typical pattern: when in doubt, prefer `bw.SJ`.

![Decision flowchart for choosing a bandwidth selector](screenshots/Nonparametric-Density-Estimation-in-R-bandwidth-selectors.webp)
*Figure 1: How to pick a bandwidth selector based on your data's shape.*

[TIP]
**Default to `bw.SJ` when shape is unknown.** It is the best general-purpose plug-in selector available and copes with multimodal distributions far better than Silverman's rule.

[WARNING]
**Silverman's rule oversmooths multimodal data.** Because the formula assumes a Gaussian shape, it picks a bandwidth that is too large when the truth has multiple peaks. You can lose entire modes without noticing.

**Try it:** Compute `bw.SJ()` on `airquality$Wind`. Is it larger or smaller than `bw.nrd0()` for the same vector?

```r title="Your turn: bandwidth on airquality$Wind"
# Try it: compare bw.SJ and bw.nrd0 on airquality$Wind

# Uncomment and complete:
# ex_bw <- c(SJ = bw.SJ( ??? ), nrd0 = bw.nrd0( ??? ))
# ex_bw
#> Expected: SJ ~ 0.73,  nrd0 ~ 1.10
```

<details>
<summary>Click to reveal solution</summary>

```r title="Bandwidth comparison solution"
ex_bw <- c(SJ = bw.SJ(airquality$Wind), nrd0 = bw.nrd0(airquality$Wind))
ex_bw
#>        SJ      nrd0 
#> 0.7340361 1.1042573
```

**Explanation:** Sheather-Jones gives roughly two-thirds of Silverman's value. The wind data has a small right shoulder; SJ shrinks the bandwidth to keep that detail.

</details>

## How do you plot density curves in ggplot2?

`geom_density()` is the ggplot2 equivalent of `plot(density(x))`. It uses the same machinery under the hood and accepts the same `bw` and `kernel` arguments, plus an `adjust` multiplier that scales whatever bandwidth was picked.

```r title="ggplot density with default settings"
library(ggplot2)

ggplot(faithful, aes(x = eruptions)) +
  geom_density(fill = "steelblue", alpha = 0.5) +
  labs(title = "Old Faithful eruption durations",
       x = "Eruption duration (minutes)", y = "Density") +
  theme_minimal()
#> A filled blue bimodal density curve
```

The `adjust` argument is the fastest way to compare smoothness levels without recomputing bandwidths by hand. `adjust = 0.5` halves the chosen bandwidth (more detail), `adjust = 2` doubles it (smoother).

```r title="Smoothness knob: adjust = 0.5 vs 2"
ggplot(faithful, aes(x = eruptions)) +
  geom_density(adjust = 0.5, color = "red",  size = 1) +
  geom_density(adjust = 2.0, color = "blue", size = 1) +
  geom_density(adjust = 1.0, color = "black", size = 1) +
  labs(title = "Same data, three smoothness levels",
       subtitle = "red = adjust 0.5  |  black = 1.0  |  blue = 2.0",
       x = "Eruption duration") +
  theme_minimal()
#> Red curve picks up extra wiggles, blue erases the dip between peaks
```

The red line keeps tiny bumps the truth probably doesn't have. The blue line collapses the bimodality into a flatter hill. The black middle setting is the default and looks right. `adjust` is a quick visual A/B knob: change one number, redraw, decide.

[KEY INSIGHT]
**`adjust` is multiplicative on whatever bandwidth was chosen.** That makes it consistent across selectors. If you switch `bw = "SJ"`, `adjust = 1.5` still means "1.5x whatever SJ picked," which is far more interpretable than typing raw numbers.

**Try it:** Build a ggplot density of `iris$Sepal.Length` with one curve per `Species`, using `fill = Species` and `alpha = 0.4`.

```r title="Your turn: per-Species density plot"
# Try it: map fill = Species inside aes()

# Uncomment and complete:
# ex_iris_g <- ggplot(iris, aes(x = Sepal.Length, fill = ??? )) +
#   geom_density(alpha = 0.4) + theme_minimal()
# ex_iris_g
#> Expected: three overlapping density curves, one per Species
```

<details>
<summary>Click to reveal solution</summary>

```r title="Per-species iris density solution"
ex_iris_g <- ggplot(iris, aes(x = Sepal.Length, fill = Species)) +
  geom_density(alpha = 0.4) +
  theme_minimal()
ex_iris_g
#> Three overlapping curves; setosa (red) sits below versicolor and virginica
```

**Explanation:** Mapping `fill = Species` automatically groups the data and draws one curve per level. The `alpha` value lets all three remain visible where they overlap.

</details>

## How do you estimate bivariate density (2D KDE)?

When you have two continuous variables, a 2D kernel density estimate gives you a heat map of joint density: how often each (x, y) region appears in the data. The base R implementation is `MASS::kde2d()`, and ggplot2 wraps it as `geom_density_2d()` and `geom_density_2d_filled()`.

```r title="2D KDE with MASS::kde2d on Old Faithful"
library(MASS)

k2 <- kde2d(faithful$eruptions, faithful$waiting, n = 60)

image(k2, xlab = "Eruption duration", ylab = "Waiting time",
      main = "2D KDE: Old Faithful")
contour(k2, add = TRUE)
#> A heat map with two warm regions (~2.0, 55) and (~4.5, 80)
```

The image shows two warm spots (high joint density) corresponding to the two eruption regimes, short eruptions tend to follow short waits and long eruptions follow long waits. The contour lines highlight that the joint distribution has two distinct modes, mirroring the bimodality in the marginal eruption density.

For a publication-quality version with sensible defaults, use ggplot2.

```r title="ggplot 2D density with filled contours"
ggplot(faithful, aes(x = eruptions, y = waiting)) +
  geom_density_2d_filled(alpha = 0.8) +
  geom_point(color = "white", size = 0.8) +
  labs(title = "Joint density of eruption and waiting time") +
  theme_minimal() +
  theme(legend.position = "none")
#> Filled contour map with the raw points overlaid in white
```

Overlaying the raw points (in white) on the filled contours is a nice sanity check: the dense regions of the heat map should sit where the points actually cluster.

**Try it:** Build a 2D filled-contour density plot of `mtcars$mpg` (x) versus `mtcars$wt` (y) using `geom_density_2d_filled()`.

```r title="Your turn: 2D density of mtcars mpg vs wt"
# Try it: ggplot with geom_density_2d_filled

# Uncomment and complete:
# ex_kde2 <- ggplot(mtcars, aes(x = ??? , y = ??? )) +
#   geom_density_2d_filled(alpha = 0.8) +
#   geom_point(color = "white", size = 1.2) +
#   theme_minimal() + theme(legend.position = "none")
# ex_kde2
#> Expected: a contour map with one or two warm regions in the lower-right
```

<details>
<summary>Click to reveal solution</summary>

```r title="mtcars 2D density solution"
ex_kde2 <- ggplot(mtcars, aes(x = mpg, y = wt)) +
  geom_density_2d_filled(alpha = 0.8) +
  geom_point(color = "white", size = 1.2) +
  theme_minimal() +
  theme(legend.position = "none")
ex_kde2
#> A warm region around (15-20 mpg, 3.0-3.7 wt) and a smaller one near (25, 2)
```

**Explanation:** `geom_density_2d_filled()` runs `MASS::kde2d()` internally and bins the result into filled contour bands, with `aes(fill = stat(level))` mapped automatically.

</details>

## Practice Exercises

### Exercise 1: Compare three bandwidth selectors

Compute `bw.nrd0`, `bw.SJ`, and a manual bandwidth of `0.5` on `airquality$Wind`. Save the three values into a named numeric vector called `my_bws`. Print it.

```r title="Capstone 1 starter"
# Hint: use bw.nrd0() and bw.SJ() on airquality$Wind, plus the literal 0.5

# my_bws <- c(...)


```

<details>
<summary>Click to reveal solution</summary>

```r title="Capstone 1 solution"
my_bws <- c(
  nrd0   = bw.nrd0(airquality$Wind),
  SJ     = bw.SJ(airquality$Wind),
  manual = 0.5
)
my_bws
#>      nrd0        SJ    manual 
#> 1.1042573 0.7340361 0.5000000
```

**Explanation:** Sheather-Jones picks a bandwidth two-thirds the size of Silverman's. The manual `0.5` value is even smaller and would produce the noisiest curve of the three.

</details>

### Exercise 2: Faceted ggplot density per Species

Plot the density of `iris$Sepal.Length` faceted by `Species` in three panels. Use `bw = "SJ"` so each panel uses its own Sheather-Jones bandwidth, and store the plot as `my_facet_plot`.

```r title="Capstone 2 starter"
# Hint: use facet_wrap(~ Species) and bw = "SJ" inside geom_density()

# my_facet_plot <- ggplot(...) + ...


```

<details>
<summary>Click to reveal solution</summary>

```r title="Capstone 2 solution"
my_facet_plot <- ggplot(iris, aes(x = Sepal.Length, fill = Species)) +
  geom_density(bw = "SJ", alpha = 0.6) +
  facet_wrap(~ Species, ncol = 1) +
  theme_minimal() +
  theme(legend.position = "none")
my_facet_plot
#> Three stacked panels, each showing one species' Sepal.Length density
```

**Explanation:** Passing `bw = "SJ"` as a string tells ggplot2 to call `bw.SJ()` on each facet's subset of data, giving each species its own data-driven bandwidth.

</details>

### Exercise 3: 2D density of Old Faithful with overlay

Build a bivariate density plot of `faithful$eruptions` (x) and `faithful$waiting` (y) using `geom_density_2d()` for unfilled contour lines, overlaid on a `geom_point()` scatter. Save the plot as `my_kde2d`.

```r title="Capstone 3 starter"
# Hint: layer geom_point() then geom_density_2d() so contours sit on top

# my_kde2d <- ggplot(faithful, ...) + ...


```

<details>
<summary>Click to reveal solution</summary>

```r title="Capstone 3 solution"
my_kde2d <- ggplot(faithful, aes(x = eruptions, y = waiting)) +
  geom_point(alpha = 0.5, color = "grey40") +
  geom_density_2d(color = "steelblue", size = 0.8) +
  labs(title = "Old Faithful: scatter with density contours") +
  theme_minimal()
my_kde2d
#> A scatterplot of points with two clear clusters and blue contour rings around each
```

**Explanation:** Layering scatter + contour lines is a great sanity check for 2D KDE: if your contours don't enclose the dense regions of points, your bandwidth is wrong.

</details>

## Complete Example

End-to-end pipeline on `airquality$Wind`: pick a sensible bandwidth, fit the KDE, evaluate the density at a point of interest, and produce a polished ggplot.

```r title="End-to-end: KDE pipeline on airquality$Wind"
# 1. Clean the data
wind <- na.omit(airquality$Wind)

# 2. Pick a bandwidth (Sheather-Jones for unknown shape)
h_sj <- bw.SJ(wind)

# 3. Fit the KDE with that bandwidth
kde_wind <- density(wind, bw = h_sj)

# 4. Evaluate density at a specific wind speed (10 mph)
wind_fun <- approxfun(kde_wind$x, kde_wind$y, rule = 2)
wind_fun(10)
#> [1] 0.0934

# 5. Plot with ggplot, layered on a histogram for context
ggplot(data.frame(wind = wind), aes(x = wind)) +
  geom_histogram(aes(y = ..density..), bins = 20,
                 fill = "grey80", color = "white") +
  geom_density(bw = h_sj, color = "darkred", size = 1) +
  labs(title = "Daily wind speed at NYC airports",
       subtitle = paste0("Sheather-Jones bandwidth = ", round(h_sj, 3)),
       x = "Wind (mph)", y = "Density") +
  theme_minimal()
#> Histogram bars in grey with a dark-red KDE curve overlaid
```

The full pipeline, top to bottom: drop missing values, choose `bw.SJ` because we don't want to assume normality, fit the KDE, expose it as a function so we can read off densities at any point of interest, then visualize with histogram + KDE overlay so the reader sees both the raw counts and the smoothed estimate.

## Summary

| Task | Function | When to use |
|---|---|---|
| Build a 1D KDE | `density(x)` | Any continuous variable |
| Evaluate KDE at a point | `approxfun(d$x, d$y)` | Need numeric density values |
| Default bandwidth | `bw.nrd0()` (Silverman) | Unimodal, near-normal data |
| Robust bandwidth | `bw.SJ()` (Sheather-Jones) | Multimodal or unknown shape |
| Cross-validated bandwidth | `bw.ucv()` / `bw.bcv()` | Want data-driven tuning |
| Plot in ggplot2 | `geom_density()` | Publication-ready, supports groups |
| 2D density | `MASS::kde2d()` or `geom_density_2d_filled()` | Two continuous variables |

Three key takeaways:

1. **Bandwidth dominates kernel.** Pick the bandwidth carefully; let the kernel default to gaussian.
2. **Default to `bw.SJ`** when the shape is unknown or potentially multimodal. It rarely fails badly.
3. **`adjust=` in ggplot2 is a multiplier**, so you can A/B test smoothness without recomputing.

## References

1. R Core Team. *density(), Kernel Density Estimation.* R stats package documentation. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/density.html)
2. R Core Team. *Bandwidth Selectors for Kernel Density Estimation.* R stats package documentation. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/bandwidth.html)
3. Sheather, S. J. and Jones, M. C. (1991). *A reliable data-based bandwidth selection method for kernel density estimation.* Journal of the Royal Statistical Society B, 53, 683-690.
4. Silverman, B. W. (1986). *Density Estimation for Statistics and Data Analysis.* Chapman and Hall.
5. Wand, M. P. and Jones, M. C. (1995). *Kernel Smoothing.* Chapman and Hall, Monographs on Statistics and Applied Probability 60.
6. Wickham, H. *geom_density, Smoothed density estimates.* ggplot2 documentation. [Link](https://ggplot2.tidyverse.org/reference/geom_density.html)
7. Venables, W. N. and Ripley, B. D. *MASS::kde2d(), Two-Dimensional Kernel Density Estimation.* MASS package documentation. [Link](https://stat.ethz.ch/R-manual/R-devel/library/MASS/html/kde2d.html)

## Continue Learning

- [When to Use Nonparametric Tests in R: Decision Guide](When-to-Use-Nonparametric-Tests-in-R.html), the parent decision guide that pointed you here.
- [Mann-Whitney U Test in R](Mann-Whitney-U-Test-in-R.html), once your KDE shows two distributions look different, this is the rank-based test for the location difference.
- [Wilcoxon Signed-Rank Test in R](Wilcoxon-Signed-Rank-Test-in-R.html), the matched-pairs alternative to the t-test.
