---
title: "ggplot2 Geom Exercises: 16 Practice Problems with Solutions"
slug: "ggplot2-Geom-Exercises"
description: "Practice every ggplot2 geom with 16 solved exercises: scatter, bar, histogram, boxplot, line, smooth, tile, and more. Runnable code and full solutions."
keywords: "ggplot2 geom exercises, geom_point exercises, geom_bar exercises, geom_histogram exercises, ggplot2 boxplot exercises, ggplot2 practice problems, R visualization exercises, ggplot2 exercises with solutions, geom_smooth exercises"
auto_link_terms: "ggplot2 geom exercises|geom exercises R|ggplot2 chart type exercises|ggplot visualization exercises|geom practice problems|ggplot2 geom practice"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-05-13"
curriculum_id: "E3.4"
post_type: "EX"
sidebar_title: "ggplot2 Geoms (16 problems)"
fr_parent: "ggplot2-Distribution-Charts.html"
target_keyword: "ggplot2 geom exercises"
difficulty: "Mixed"
---

# ggplot2 Geom Exercises: 16 Practice Problems with Solutions

<p class="lead">Sixteen graded exercises that drill the core ggplot2 geoms used in real R work: points, bars, histograms, boxplots, violins, lines, smooths, tiles, and annotation layers. Every problem ships with runnable starter code and a hidden step-by-step solution.</p>

Run the setup block once before working through any exercise. Variables and packages persist across blocks, so you can use them anywhere on the page.

```r title="Run this once before any exercise"
library(ggplot2)
library(dplyr)
library(forcats)
library(tidyr)
library(tibble)
```

## Section 1. Points and scatter geoms (3 problems)

### Exercise 1.1: Plot mpg vs wt with a basic scatter geom

**Task:** A junior analyst onboarding to the team wants to confirm the well-known inverse relationship between vehicle weight and fuel economy. Using the built-in `mtcars` dataset, draw a scatter plot of `mpg` on the y-axis versus `wt` on the x-axis with `geom_point()` and save the plot object to `ex_1_1`.

**Expected result:**

```
#> ggplot scatter object
#> mapping: aes(x = wt, y = mpg)
#> layer:   geom_point()
#> visible pattern: clear negative slope, 32 points, mpg falls from ~33 at wt=1.5 to ~10 at wt=5.4
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point()

ex_1_1
#> Scatter with 32 points; mpg trends downward as wt increases
```

**Explanation:** `aes()` maps data columns to visual channels, and `geom_point()` then draws a layer of points using those mappings. Because both `wt` and `mpg` are numeric, ggplot picks a continuous scale for each axis automatically. Writing the aesthetics inside `geom_point(aes(...))` instead of at the top level gives the same picture, but the global form makes the mapping reusable when you add more layers like `geom_smooth()`.

</details>

### Exercise 1.2: Reduce overplotting on a discrete axis with geom_jitter

**Task:** A fuel-economy analyst plotting `cty` against the discrete `class` column of `mpg` notices that points stack into vertical strips and obscure density inside each class. Switch from `geom_point()` to `geom_jitter()` with a modest horizontal width and zero vertical noise. Save the chart to `ex_1_2`.

**Expected result:**

```
#> Jittered scatter: x=class (7 levels: 2seater, compact, midsize, minivan, pickup, subcompact, suv), y=cty
#> Points spread horizontally inside each class strip
#> compact/midsize cluster ~ cty 18-25; pickup/SUV cluster ~ cty 10-17
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- ggplot(mpg, aes(x = class, y = cty)) +
  geom_jitter(width = 0.2, height = 0, alpha = 0.7)

ex_1_2
#> 234 points spread horizontally within 7 class strips
```

**Explanation:** `geom_jitter()` adds random noise to point positions so overlapping marks become visible. Setting `height = 0` keeps `cty` values exact and only the x positions wiggle; jittering on a numeric axis would distort the data you came to read. The `width` parameter is in units of the discrete axis (so 0.2 spans 20% of one category). `alpha` gives extra transparency when many points still land on top of each other.

</details>

### Exercise 1.3: Bubble chart by mapping size and color aesthetics on diamonds

**Task:** A retailer auditing the `diamonds` table wants a quick visual of how `carat`, `price`, and `cut` interact together. Sample 500 rows for legibility, then plot `price` against `carat` mapping `size` to `depth` and `color` to `cut`. Save the result to `ex_1_3`.

**Expected result:**

```
#> Bubble scatter: x=carat (0.2-3+), y=price (300-19k)
#> point size encodes depth (~55-70), color encodes cut (5 levels)
#> upward fanning pattern from origin, larger fanning at higher carat
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(1)
sampled <- slice_sample(diamonds, n = 500)

ex_1_3 <- ggplot(sampled, aes(x = carat, y = price, size = depth, color = cut)) +
  geom_point(alpha = 0.6)

ex_1_3
#> 500 bubbles, multi-color legend for cut, size legend for depth
```

**Explanation:** Mapping numeric columns (`depth`) to `size` and categorical columns (`cut`) to `color` is the standard "bubble chart" recipe. `alpha = 0.6` is critical with 500 overlapping markers because without it the underlying density structure is unreadable. `slice_sample()` is the modern dplyr replacement for `sample_n()`; setting a seed with `set.seed(1)` makes the random draw reproducible across runs and across collaborators.

</details>

## Section 2. Bar and column geoms (3 problems)

### Exercise 2.1: Count diamonds by cut using geom_bar

**Task:** A pricing manager preparing a Monday status update wants a simple frequency chart showing how many diamonds in the `diamonds` table fall into each `cut` category. Use `geom_bar()` (which counts rows automatically) on the `cut` column with no manual `y` aesthetic and save the chart to `ex_2_1`.

**Expected result:**

```
#> Bar chart: x=cut (5 levels: Fair, Good, Very Good, Premium, Ideal)
#> y = count of rows per cut
#> Ideal tallest (~21551), Fair shortest (~1610)
```

**Difficulty:** Beginner

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- ggplot(diamonds, aes(x = cut)) +
  geom_bar()

ex_2_1
#> 5 bars in cut order: Fair (1610), Good (4906), Very Good (12082), Premium (13791), Ideal (21551)
```

**Explanation:** `geom_bar()` defaults to `stat = "count"`, which silently runs a frequency tally on the categorical column you map to `x`. There is no `y` aesthetic in the original call because ggplot computes it via the stat. The bar order matches the factor levels of `cut`; since `diamonds$cut` is an ordered factor (Fair < Good < ... < Ideal), the bars come out in that natural order without any extra work.

</details>

### Exercise 2.2: Plot pre-summarised values with geom_col

**Task:** A fleet analyst already has a summary table of mean `mpg` per cylinder count and wants ggplot to plot those values literally, not to recount rows. Compute mean `mpg` grouped by `cyl` from `mtcars` with dplyr, then plot the result using `geom_col()` and save to `ex_2_2`.

**Expected result:**

```
#> Bar chart: x=cyl (factor: 4, 6, 8), y=mean mpg
#> bar heights ~ 26.66, 19.74, 15.10
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
summary_df <- mtcars |>
  group_by(cyl) |>
  summarise(mean_mpg = mean(mpg))

ex_2_2 <- ggplot(summary_df, aes(x = factor(cyl), y = mean_mpg)) +
  geom_col(fill = "steelblue")

ex_2_2
#> 3 bars: cyl=4 (26.66), cyl=6 (19.74), cyl=8 (15.10)
```

**Explanation:** `geom_col()` is the right choice when y-values are already computed; it uses `stat = "identity"` so heights map straight to your `y` column. `geom_bar(stat = "identity")` does exactly the same thing; `geom_col()` is shorthand for the common case. Wrapping `cyl` in `factor()` prevents ggplot from drawing a continuous x-axis with extra integer ticks for what is conceptually a three-category variable.

</details>

### Exercise 2.3: Compare stacked, dodged, and filled bar positions

**Task:** A marketing analyst presenting to leadership wants three side-by-side views of how `clarity` distributes within each `cut` level of `diamonds`. Build three bar charts with `geom_bar()` using `position = "stack"`, `"dodge"`, and `"fill"` respectively, then combine them into a named list saved to `ex_2_3`.

**Expected result:**

```
#> Named list of 3 ggplot objects
#> $stack: stacked bars, total per cut, colored segments by clarity
#> $dodge: 8 clarity bars side by side within each cut
#> $fill : 100% filled bars, all reaching 1, comparing clarity share
```

**Difficulty:** Advanced

```r title="Your turn"
ex_2_3 <- # your code here
length(ex_2_3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
p_stack <- ggplot(diamonds, aes(x = cut, fill = clarity)) +
  geom_bar(position = "stack")

p_dodge <- ggplot(diamonds, aes(x = cut, fill = clarity)) +
  geom_bar(position = "dodge")

p_fill <- ggplot(diamonds, aes(x = cut, fill = clarity)) +
  geom_bar(position = "fill")

ex_2_3 <- list(stack = p_stack, dodge = p_dodge, fill = p_fill)

length(ex_2_3)
#> [1] 3
```

**Explanation:** The `position` argument tells `geom_bar()` how to handle overlapping groups. `"stack"` (the default for filled bars) sums counts into one bar; `"dodge"` shifts each group side by side so you compare absolute counts; `"fill"` rescales every bar to the same height so you compare proportions rather than totals. The fill version is the right pick when group totals vary widely and you only care about composition. `position_dodge2()` handles uneven group counts more gracefully than plain `"dodge"`.

</details>

## Section 3. Distribution geoms (4 problems)

### Exercise 3.1: Histogram of diamond prices with a sensible binwidth

**Task:** A pricing intern auditing the catalog wants to see the shape of the `price` distribution in the `diamonds` table. Plot a histogram of `price` with `geom_histogram()` using `binwidth = 500` to control granularity and a white outline so individual bins are visible. Save the chart to `ex_3_1`.

**Expected result:**

```
#> Histogram: x=price ($300-$19000), y=count
#> binwidth=500; ~38 bins
#> strongly right-skewed; tallest bar near price ~$700-1200 with count ~9000+
```

**Difficulty:** Beginner

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- ggplot(diamonds, aes(x = price)) +
  geom_histogram(binwidth = 500, fill = "steelblue", color = "white")

ex_3_1
#> 38 bins of width $500 spanning $300-$19000, right-skewed distribution
```

**Explanation:** `binwidth` is preferred over `bins` because it carries interpretable units (dollars here, not "number of buckets"). The default of 30 bins triggers a warning ggplot prints because it almost never matches what your data wants. The white `color` argument outlines each bar so bin boundaries stand out against the fill. Right-skew is typical for prices since there is a floor at $0 but no ceiling on luxury items.

</details>

### Exercise 3.2: Overlay density curves by cut with alpha blending

**Task:** A jeweller curious whether the price distribution shape changes across `cut` quality wants overlapping density curves. Plot `geom_density()` of `price` with `fill = cut` and an alpha of 0.4 so all five curves remain visible. Save the chart to `ex_3_2`.

**Expected result:**

```
#> Overlayed density plot: x=price ($), y=density (smoothed)
#> 5 colored curves keyed by cut; all right-skewed
#> peaks cluster around $700-$1200 with slight variation across cuts
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- ggplot(diamonds, aes(x = price, fill = cut)) +
  geom_density(alpha = 0.4)

ex_3_2
#> 5 overlapping density curves colored by cut, all right-skewed with similar peaks
```

**Explanation:** `geom_density()` runs a kernel density estimator (default bandwidth via `bw.nrd0()`) for each level of the fill grouping. The y-axis is a probability density, not a count, so curves are area-comparable regardless of group size. Without `alpha`, the topmost fill (the highest factor level) hides everything beneath it. For very different group sizes, use `aes(y = after_stat(count))` to weight each density by group n so peak heights reflect frequencies, not pure shape.

</details>

### Exercise 3.3: Reorder factor levels with fct_reorder for cleaner boxplots

**Task:** A car-magazine reviewer wants a boxplot of `mpg::hwy` by `class` ordered from lowest to highest median (not alphabetical, which is the ggplot default). Use `forcats::fct_reorder()` to reorder `class` by median `hwy`, pipe into `ggplot()`, and add `geom_boxplot()`. Save the chart to `ex_3_3`.

**Expected result:**

```
#> Boxplot: x=class (reordered low->high by median hwy), y=hwy
#> 7 boxes
#> leftmost: pickup (median ~17); rightmost: compact (median ~28)
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- mpg |>
  mutate(class = fct_reorder(class, hwy, .fun = median)) |>
  ggplot(aes(x = class, y = hwy)) +
  geom_boxplot(fill = "lightyellow")

ex_3_3
#> 7 boxes in ascending median order; pickup leftmost (~17), compact rightmost (~28)
```

**Explanation:** Alphabetical ordering is the default but rarely what readers need; a sorted boxplot tells the story at a glance. `fct_reorder()` re-levels the factor by some summary of another variable (median by default; pass `.fun = mean` for the mean). The reorder happens inside the data frame, not on the plot, so any subsequent layer using `class` inherits the new ordering. For descending order, use `fct_reorder(class, hwy, .desc = TRUE)`.

</details>

### Exercise 3.4: Layer violin, narrow boxplot, and mean marker for richer distribution view

**Task:** A health-economics analyst wants a richer view of `iris::Sepal.Length` by `Species` showing both the full distribution shape and the median/IQR summary side by side. Layer `geom_violin()` with `geom_boxplot(width = 0.1)` and add a red mean point using `stat_summary()`. Save the chart to `ex_3_4`.

**Expected result:**

```
#> Combined violin + narrow boxplot per Species, with red mean dot
#> setosa narrow at Sepal.Length ~5.0
#> versicolor wider at ~5.9
#> virginica widest at ~6.6
```

**Difficulty:** Advanced

```r title="Your turn"
ex_3_4 <- # your code here
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_4 <- ggplot(iris, aes(x = Species, y = Sepal.Length)) +
  geom_violin(fill = "lightblue") +
  geom_boxplot(width = 0.1, fill = "white") +
  stat_summary(fun = mean, geom = "point", color = "red", size = 3)

ex_3_4
#> 3 violins with embedded boxplots and red mean dots: setosa, versicolor, virginica
```

**Explanation:** Layering geoms top to bottom is the ggplot way to combine views: violin shows the full distribution, boxplot narrows in on the IQR, and `stat_summary()` lets you mark any summary statistic without precomputing it. The `width = 0.1` shrinks the boxplot inside the violin so both stay legible. If you want a mean line rather than a point, swap `geom = "point"` for `geom = "crossbar"` and the same stat draws a horizontal segment at the mean.

</details>

## Section 4. Lines, areas, and smooths (3 problems)

### Exercise 4.1: Time-series line plot of US unemployment rate

**Task:** An economist preparing a one-pager wants to plot the US unemployment rate over time. Using the `economics` dataset, compute a `rate = unemploy / pop` column with dplyr, then pipe into `ggplot()` and draw `geom_line()` with `date` on the x-axis. Save the chart to `ex_4_1`.

**Expected result:**

```
#> Line chart: x=date (1967-2015), y=unemployment rate (0.012-0.045)
#> single continuous dark red line
#> multiple peaks during recession years (~1975, 1982, 1992, 2009)
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- economics |>
  mutate(rate = unemploy / pop) |>
  ggplot(aes(x = date, y = rate)) +
  geom_line(color = "darkred", linewidth = 0.8)

ex_4_1
#> Single line spanning 1967-2015 with visible peaks around 1982 and 2009 recessions
```

**Explanation:** `geom_line()` connects points in x-order, which is exactly what you want for time series. `linewidth` is the modern (ggplot2 3.4+) replacement for `size` on line geoms; `size` still works but emits a deprecation warning. If `date` were a character column instead of a Date class, the line would order alphabetically rather than chronologically (and the chart would be wrong); always cast time-like columns to Date or POSIXct before plotting.

</details>

### Exercise 4.2: Linear fit with confidence band via geom_smooth

**Task:** A car reviewer plotting `mpg` vs `wt` from `mtcars` wants to overlay a linear trend line and its 95% confidence band so readers can judge the fit at a glance. Add `geom_smooth(method = "lm")` on top of `geom_point()` with `se = TRUE` (the default) and save the chart to `ex_4_2`.

**Expected result:**

```
#> Scatter + linear fit line with gray confidence ribbon
#> negative slope (~-5.3 mpg per ton of weight)
#> ribbon narrow at center of wt, wider at extremes
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_2 <- ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point() +
  geom_smooth(method = "lm", se = TRUE, color = "blue")

ex_4_2
#> 32 points + blue regression line + gray 95% CI ribbon
```

**Explanation:** `geom_smooth()` fits a model and draws both the predicted line and its uncertainty ribbon in one layer. `method = "lm"` runs ordinary least squares; the default is `"loess"` for under 1000 rows and `"gam"` otherwise. The `se = TRUE` (default) ribbon is the confidence interval for the mean prediction, not a prediction interval; readers often misread this, so consider adding a caption clarifying which one you are showing.

</details>

### Exercise 4.3: Build a custom confidence ribbon from a fitted lm

**Task:** A statistics consultant wants a publication-quality plot of `mpg ~ wt` with explicit control over the 95% confidence ribbon (rather than the one `geom_smooth` builds internally). Fit `lm()`, predict over a grid with `interval = "confidence"`, then layer `geom_ribbon()` and `geom_line()` on the scatter. Save to `ex_4_3`.

**Expected result:**

```
#> Lightblue ribbon between lwr/upr + dark blue fit line + scatter points
#> ribbon narrows at the data centroid, widens at the wt extremes
#> ribbon, line, and points all on the same plot
```

**Difficulty:** Advanced

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- lm(mpg ~ wt, data = mtcars)
grid <- data.frame(wt = seq(min(mtcars$wt), max(mtcars$wt), length.out = 100))
pred <- predict(fit, newdata = grid, interval = "confidence")
band <- cbind(grid, as.data.frame(pred))

ex_4_3 <- ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point() +
  geom_ribbon(data = band, aes(x = wt, ymin = lwr, ymax = upr),
              inherit.aes = FALSE, fill = "lightblue", alpha = 0.5) +
  geom_line(data = band, aes(x = wt, y = fit),
            inherit.aes = FALSE, color = "darkblue", linewidth = 1)

ex_4_3
#> 32 points + lightblue 95% CI ribbon + darkblue fit line
```

**Explanation:** Building the ribbon manually with `predict(..., interval = "confidence")` gives you control that `geom_smooth()` hides: you can swap to `interval = "prediction"` (wider, accounts for residual variance) or transform the predictions before plotting. `inherit.aes = FALSE` is important because it prevents the ribbon and line layers from inheriting `y = mpg` from the top-level call; without it ggplot would error since `band` has no `mpg` column.

</details>

## Section 5. 2D density and heatmap geoms (2 problems)

### Exercise 5.1: Correlation heatmap with geom_tile

**Task:** A feature engineer wants to spot collinearity in `mtcars` quickly before fitting a regression. Compute the correlation matrix of the 11 numeric columns, pivot it to long format with `pivot_longer()`, then draw a `geom_tile()` heatmap and use `scale_fill_gradient2()` so positive and negative correlations are visually distinct. Save to `ex_5_1`.

**Expected result:**

```
#> 11x11 tile grid colored from red (-1) through white (0) to blue (1)
#> diagonal uniformly blue (self-correlation = 1)
#> strong red tile at mpg-wt (~-0.87) and cyl-disp pairs
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
cor_long <- as.data.frame(cor(mtcars)) |>
  rownames_to_column("var1") |>
  pivot_longer(-var1, names_to = "var2", values_to = "corr")

ex_5_1 <- ggplot(cor_long, aes(x = var1, y = var2, fill = corr)) +
  geom_tile(color = "white") +
  scale_fill_gradient2(low = "red", mid = "white", high = "blue",
                       midpoint = 0, limits = c(-1, 1))

ex_5_1
#> 11x11 heatmap; diagonal blue (corr=1); strong red between mpg-wt
```

**Explanation:** A correlation matrix is wide by default (each row a variable, each column a variable), but `geom_tile()` expects long format with three columns: x, y, and fill. `pivot_longer()` reshapes the matrix into one row per (var1, var2, corr) triple. `scale_fill_gradient2()` is the right scale for a signed metric: it sets a midpoint (0 here) so positive and negative correlations get visually distinct hues with white as the neutral.

</details>

### Exercise 5.2: 2D density heatmap with geom_bin2d on heavy data

**Task:** A data scientist wants to visualize the joint density of `price` vs `carat` across all 53,940 rows of `diamonds` without rendering an unreadable point cloud. Use `geom_bin2d()` with `bins = 40` and apply the viridis palette via `scale_fill_viridis_c()` for a perceptually uniform fill. Save to `ex_5_2`.

**Expected result:**

```
#> Rectangular bin heatmap: x=carat (0-5), y=price ($0-$19k)
#> viridis fill: yellow=high count, dark purple=low count
#> dense band along an upward-curving spine from origin
```

**Difficulty:** Advanced

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_2 <- ggplot(diamonds, aes(x = carat, y = price)) +
  geom_bin2d(bins = 40) +
  scale_fill_viridis_c()

ex_5_2
#> 40x40 bin grid; yellow patch at low carat/price, dark purple at sparse high end
```

**Explanation:** For 53,940 points, `geom_point()` produces an unreadable smear. `geom_bin2d()` partitions the x-y plane into a grid, counts observations per cell, and maps count to fill. `geom_hex()` is an alternative using hexagonal bins (smoother visually) but requires the `hexbin` package. The viridis palette is perceptually uniform and colorblind-safe, while the default ggplot continuous palette has uneven brightness that distorts perceived density.

</details>

## Section 6. Annotation geoms (1 problem)

### Exercise 6.1: Label outlier points with geom_text restricted to a subset

**Task:** A motorsport analyst plotting `mpg` vs `hp` from `mtcars` wants car names called out only for the four highest-`hp` vehicles, not all 32. Use `slice_max()` to filter, then draw `geom_point()` on the full data and `geom_text()` on the filtered subset with `vjust = -1` so labels float above their markers. Save to `ex_6_1`.

**Expected result:**

```
#> Scatter of mpg ~ hp with 32 points
#> 4 text labels above the top-4 hp points
#> Labels: Maserati Bora, Ford Pantera L, Camaro Z28, Duster 360
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
top_hp <- mtcars |>
  rownames_to_column("car") |>
  slice_max(hp, n = 4)

ex_6_1 <- ggplot(mtcars, aes(x = hp, y = mpg)) +
  geom_point() +
  geom_text(data = top_hp, aes(label = car), vjust = -1, size = 3)

ex_6_1
#> 32 points + 4 labels: Maserati Bora, Ford Pantera L, Camaro Z28, Duster 360
```

**Explanation:** Passing a filtered data frame to a single layer is the clean way to highlight a subset; `geom_point()` uses the global data (`mtcars`), while `geom_text()` overrides with `top_hp`. `vjust = -1` nudges the label one unit above the y position so the text does not overlap the marker. For overlapping labels, switch to `ggrepel::geom_text_repel()` which spaces them automatically and draws short leader lines from label to point.

</details>

## What to do next

You have practiced the core geom families in ggplot2. The natural next steps in the visualization track are:

- [ggplot2 Aesthetics Exercises](ggplot2-Aesthetics-Exercises.html): drill the mapping rules between data and visual channels.
- [ggplot2 Facets Exercises](ggplot2-Facets-Exercises-in-R.html): break a plot into small multiples by a grouping variable.
- [ggplot2 Themes Exercises](ggplot2-Themes-Exercises-in-R.html): customize the non-data ink (axis text, legend, panel grid, fonts).
- [ggplot2 Customization Exercises](ggplot2-Customization-Exercises.html): final polish for publication, including titles, captions, scales, and color.
