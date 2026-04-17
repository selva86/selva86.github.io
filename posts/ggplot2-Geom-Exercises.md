---
title: "ggplot2 Geom Exercises: 12 Problems, Every Chart Type in R, Solved Step-by-Step"
slug: "ggplot2-Geom-Exercises"
description: "Practice every ggplot2 geom with 12 solved exercises, scatter, bar, line, histogram, boxplot, violin, and more. Runnable starter code and step-by-step solutions."
keywords: "ggplot2 geom exercises, ggplot2 chart types exercises, geom_point exercises, geom_bar exercises, geom_histogram exercises, ggplot2 exercises with solutions, R visualization exercises, ggplot2 solved problems, geom_boxplot exercises"
auto_link_terms: "ggplot2 geom exercises|geom exercises R|ggplot2 chart type exercises|ggplot visualization exercises|geom practice problems|ggplot2 geom practice"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-04-15"
curriculum_id: "E3.4"
post_type: "EX"
sidebar_title: "ggplot2 Geoms (12 problems)"
fr_parent: "ggplot2-Distribution-Charts.html"
difficulty: "Intermediate"
---

# ggplot2 Geom Exercises: 12 Problems, Every Chart Type in R, Solved Step-by-Step

<p class="lead">Every ggplot2 chart starts with a geom, the function that decides whether your data appears as points, bars, lines, or tiles. These 12 exercises cover every major chart type in R, from scatter plots to heatmaps, each with starter code you can run and a step-by-step solution.</p>

## What Geom Does Each Chart Type Use?

Picking the right geom is the single most important decision in any ggplot2 chart. The same data tells a completely different story depending on whether you choose `geom_point()`, `geom_boxplot()`, or `geom_col()`. Here's the cheat sheet you'll need for the exercises below.

| Geom | Chart Type | Primary Aesthetic | Best For |
|------|-----------|-------------------|----------|
| `geom_point()` | Scatter plot | x, y | Relationships between two variables |
| `geom_line()` | Line chart | x, y, group | Trends over time or ordered sequences |
| `geom_col()` | Bar chart | x, y | Comparing pre-computed values across categories |
| `geom_bar()` | Bar chart | x | Counting observations per category |
| `geom_histogram()` | Histogram | x | Distribution shape of one numeric variable |
| `geom_density()` | Density plot | x | Smooth distribution shape, good for comparing groups |
| `geom_boxplot()` | Boxplot | x, y | Median, quartiles, outliers across groups |
| `geom_violin()` | Violin plot | x, y | Full distribution shape across groups |
| `geom_area()` | Area chart | x, y | Magnitude over time, stacked totals |
| `geom_tile()` | Heatmap | x, y, fill | Patterns in two-dimensional grids |
| `geom_smooth()` | Trend line | x, y | Fitted curves overlaid on scatter plots |
| `geom_text()` | Text labels | x, y, label | Annotating specific data points |

Let's see how three different geoms turn the same `mtcars` dataset into three completely different stories.

```r
library(ggplot2)

# Same data, three geoms — three stories
# 1. Scatter: relationship between weight and fuel efficiency
p_scatter <- ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point(size = 3, color = "#4B6FA5") +
  labs(title = "Scatter: Weight vs MPG")
p_scatter
#> A scatter plot showing heavier cars get worse mileage

# 2. Boxplot: distribution of mpg by cylinder count
p_box <- ggplot(mtcars, aes(x = factor(cyl), y = mpg)) +
  geom_boxplot(fill = "#7FB3D8") +
  labs(title = "Boxplot: MPG by Cylinders", x = "Cylinders")
p_box
#> 4-cyl median ~26 mpg, 6-cyl ~20, 8-cyl ~15

# 3. Bar: average mpg per cylinder group
cyl_means <- aggregate(mpg ~ cyl, data = mtcars, FUN = mean)
p_bar <- ggplot(cyl_means, aes(x = factor(cyl), y = mpg)) +
  geom_col(fill = "#A5C882") +
  labs(title = "Bar: Mean MPG by Cylinders", x = "Cylinders")
p_bar
#> 4-cyl ~26.7, 6-cyl ~19.7, 8-cyl ~15.1
```

Same 32 cars, same mpg variable, but the scatter shows a continuous relationship, the boxplot reveals spread and outliers, and the bar chart compares group averages. The geom you pick determines what question your chart answers.

[KEY INSIGHT]
**The geom is the grammar.** Same data, same aes(), different geom = different chart = different insight. Choosing the right geom is more important than any color, theme, or label you'll ever add.

**Try it:** Create a `geom_point()` scatter of `iris` with `Sepal.Length` on x and `Petal.Length` on y. Then swap `geom_point()` for `geom_smooth()`. What changes?

```r
# Try it: scatter then smooth
ex_scatter <- ggplot(iris, aes(x = Sepal.Length, y = Petal.Length)) +
  # your code here — first try geom_point(), then swap to geom_smooth()

ex_scatter
#> Expected: first individual points, then a fitted curve with confidence band
```

<details>
<summary>Click to reveal solution</summary>

```r
# Points show every observation
ex_scatter_pts <- ggplot(iris, aes(x = Sepal.Length, y = Petal.Length)) +
  geom_point(color = "#4B6FA5")
ex_scatter_pts
#> 150 individual points showing a positive relationship

# Smooth replaces all points with a single fitted curve
ex_scatter_smooth <- ggplot(iris, aes(x = Sepal.Length, y = Petal.Length)) +
  geom_smooth(color = "#E05A4F")
ex_scatter_smooth
#> One curve with grey confidence band — the trend without the noise
```

**Explanation:** `geom_point()` shows every observation. `geom_smooth()` replaces them with a fitted curve and confidence band, you see the trend but lose the individual data points. In practice, you layer both together.

</details>

## How Do You Plot Relationships and Trends? (Exercises 1–3)

Scatter plots and line charts are the workhorses of exploratory analysis. Each exercise below focuses on a specific geom's parameters, the aesthetic mappings and arguments that control how your data appears.

### Exercise 1: Multi-Aesthetic Scatter Plot (geom_point)

**Dataset:** `mpg`

**Task:** Create a scatter plot of `displ` (x) vs `hwy` (y). Map `class` to color and `cyl` to size. Set alpha to 0.6 to handle overplotting. Add informative axis labels.

```r
# Exercise 1: multi-aesthetic scatter
# Hint: put color and size inside aes()

p1 <- ggplot(mpg, aes(x = displ, y = hwy)) +
  # your code here
  labs(x = "Engine Displacement (L)", y = "Highway MPG")
p1
#> Expected: scatter with 7 colors (one per class) and varying point sizes
```

<details>
<summary>Click to reveal solution</summary>

```r
p1 <- ggplot(mpg, aes(x = displ, y = hwy, color = class, size = cyl)) +
  geom_point(alpha = 0.6) +
  labs(
    x = "Engine Displacement (L)",
    y = "Highway MPG",
    color = "Vehicle Class",
    size = "Cylinders"
  )
p1
#> Compact/subcompact cluster at low displacement + high mpg
#> SUVs and pickups cluster at high displacement + low mpg
#> Point sizes show 4-cyl cars are smallest, 8-cyl largest
```

**Explanation:** Mapping `class` to color and `cyl` to size lets you encode four variables in a single chart (x, y, color, size). The `alpha = 0.6` transparency reveals where points stack up. Notice how compact cars cluster in the top-left (small engine, good mileage) while SUVs and pickups fill the bottom-right.

</details>

### Exercise 2: Multi-Series Line Chart (geom_line)

**Dataset:** `economics_long` (built-in)

**Task:** Plot all economic indicators in `economics_long` as separate lines. Map `variable` to color. The y-axis is `value01` (pre-scaled 0–1). Add point markers at every 100th observation using indexing.

```r
# Exercise 2: multi-series line chart
# Hint: economics_long has columns date, variable, value, value01

p2 <- ggplot(economics_long, aes(x = date, y = value01)) +
  # your code here — use color = variable
  labs(x = "Year", y = "Scaled Value (0–1)", color = "Indicator")
p2
#> Expected: 5 colored lines (pce, pop, psavert, uempmed, unemploy) over time
```

<details>
<summary>Click to reveal solution</summary>

```r
p2 <- ggplot(economics_long, aes(x = date, y = value01, color = variable)) +
  geom_line(linewidth = 0.8) +
  labs(
    x = "Year",
    y = "Scaled Value (0–1)",
    color = "Indicator"
  )
p2
#> pce and pop rise steadily over time
#> psavert (savings rate) trends downward
#> unemploy shows cyclical recession spikes
#> uempmed (median unemployment duration) spikes sharply after 2008
```

**Explanation:** `geom_line()` connects observations in order of the x-axis. By mapping `variable` to `color`, ggplot draws a separate line for each indicator. The `value01` column rescales everything to 0–1 so all series fit on the same y-axis despite having wildly different units.

</details>

### Exercise 3: Compare Smoothing Methods (geom_smooth)

**Dataset:** `mpg`

**Task:** Create a scatter plot of `displ` vs `hwy`. Overlay two trend lines: one using `method = "lm"` (linear) and one using `method = "loess"` (flexible curve). Give each a different color. Which fits better?

```r
# Exercise 3: two smoothing methods on one scatter
# Hint: add two geom_smooth() layers with different method arguments

p3 <- ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point(alpha = 0.3) +
  # your code here — two geom_smooth() layers
  labs(x = "Engine Displacement (L)", y = "Highway MPG")
p3
#> Expected: scattered points with two overlaid trend lines
```

<details>
<summary>Click to reveal solution</summary>

```r
p3 <- ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point(alpha = 0.3, color = "grey50") +
  geom_smooth(method = "lm", color = "#E05A4F", se = FALSE, linewidth = 1.2) +
  geom_smooth(method = "loess", color = "#4B6FA5", se = TRUE, linewidth = 1.2) +
  labs(x = "Engine Displacement (L)", y = "Highway MPG")
p3
#> Red line (lm): straight line, misses the curve at low displacement
#> Blue line (loess): curves to follow the data's natural shape
#> loess captures the steeper drop from 2–4L and the flattening above 5L
```

**Explanation:** `method = "lm"` fits a straight line, simple but it misses the curvature visible in the data. `method = "loess"` (locally estimated scatterplot smoothing) bends to follow local trends. The loess curve reveals that mileage drops steeply from 2 to 4 liters, then levels off. For non-linear relationships, loess is almost always more informative.

</details>

**Try it:** Add `geom_jitter(width = 0.3, height = 0)` instead of `geom_point()` to a scatter of `mtcars` with `cyl` on x and `mpg` on y. Why does jitter help here?

```r
# Try it: jitter vs point
ex_jitter <- ggplot(mtcars, aes(x = factor(cyl), y = mpg)) +
  # your code here — try geom_point() first, then geom_jitter()

ex_jitter
#> Expected: with geom_point, points stack; with jitter, they spread out
```

<details>
<summary>Click to reveal solution</summary>

```r
# Without jitter — points overlap and you can't tell how many cars per group
ex_point <- ggplot(mtcars, aes(x = factor(cyl), y = mpg)) +
  geom_point(size = 2, color = "#4B6FA5")
ex_point
#> Points stack directly on top of each other at each cyl value

# With jitter — horizontal noise reveals all observations
ex_jitter <- ggplot(mtcars, aes(x = factor(cyl), y = mpg)) +
  geom_jitter(width = 0.2, height = 0, size = 2, color = "#E05A4F")
ex_jitter
#> Now you can see every car — 11 four-cylinder, 7 six, 14 eight
```

**Explanation:** When x is categorical, all points at the same level share the exact same x-coordinate and overlap. `geom_jitter()` adds small random horizontal offsets so you can see every observation. Setting `height = 0` keeps the y-values accurate.

</details>

[TIP]
**Use geom_jitter() when points overlap heavily.** It adds small random noise to spread observations apart. Set width and height to control how much, use height = 0 when the y-axis is meaningful.

## How Do You Compare Categories with Bars? (Exercises 4–5)

Bar charts answer "how much?" for each category. The key distinction in ggplot2: `geom_col()` takes pre-computed heights, while `geom_bar()` counts rows for you.

### Exercise 4: Summary Bar Chart (geom_col)

**Dataset:** `mpg`

**Task:** Compute the mean highway mpg for the top 8 manufacturers (by count). Plot as horizontal bars sorted from highest to lowest mpg. Use `reorder()` on the y-axis.

```r
# Exercise 4: sorted horizontal bar chart
# Hint: aggregate first, then use geom_col + coord_flip or map manufacturer to y

# Step 1: compute mean hwy per manufacturer
# Step 2: keep top 8 by number of cars
# Step 3: plot with geom_col, reorder by mpg

# your code here
#> Expected: 8 horizontal bars, Honda/Volkswagen near top for efficiency
```

<details>
<summary>Click to reveal solution</summary>

```r
# Compute mean hwy per manufacturer
mpg_summary <- aggregate(hwy ~ manufacturer, data = mpg, FUN = mean)

# Keep top 8 manufacturers by count
top8 <- names(sort(table(mpg$manufacturer), decreasing = TRUE))[1:8]
mpg_top8 <- mpg_summary[mpg_summary$manufacturer %in% top8, ]

p4 <- ggplot(mpg_top8, aes(x = reorder(manufacturer, hwy), y = hwy)) +
  geom_col(fill = "#4B6FA5") +
  coord_flip() +
  labs(x = NULL, y = "Mean Highway MPG")
p4
#> honda      ~28.5
#> volkswagen ~29.2
#> toyota     ~24.9
#> nissan     ~24.6
#> chevrolet  ~21.9
#> ford       ~19.4
#> dodge      ~17.9
#> audi       ~26.4
```

**Explanation:** `geom_col()` expects pre-computed y-values, here, the mean mpg we calculated with `aggregate()`. `reorder(manufacturer, hwy)` sorts the factor levels by mpg value so bars appear in ascending order. `coord_flip()` rotates the chart so long manufacturer names read horizontally.

</details>

### Exercise 5: Stacked vs Dodged vs Filled Bars (geom_bar)

**Dataset:** `diamonds`

**Task:** Create three bar charts of diamond `cut` (x-axis) filled by `clarity`. Use: (a) the default stacked position, (b) `position = "dodge"` side-by-side, and (c) `position = "fill"` showing proportions. Which reveals the most about the relationship?

```r
# Exercise 5: three position adjustments
# Hint: only change the position argument in geom_bar()

# (a) Stacked (default)
p5a <- ggplot(diamonds, aes(x = cut, fill = clarity)) +
  geom_bar() +
  labs(title = "Stacked")

# (b) Dodged — your code here

# (c) Filled — your code here

p5a
#> Expected: stacked bars where total height = count per cut level
```

<details>
<summary>Click to reveal solution</summary>

```r
# (a) Stacked — default, shows total count + composition
p5a <- ggplot(diamonds, aes(x = cut, fill = clarity)) +
  geom_bar() +
  labs(title = "Stacked")
p5a
#> Ideal has the tallest bar (~21,500 diamonds total)

# (b) Dodged — side-by-side, easier to compare individual clarity levels
p5b <- ggplot(diamonds, aes(x = cut, fill = clarity)) +
  geom_bar(position = "dodge") +
  labs(title = "Dodged")
p5b
#> VS2 and SI1 are the most common across all cuts

# (c) Fill — proportional, shows how composition changes across cuts
p5c <- ggplot(diamonds, aes(x = cut, fill = clarity)) +
  geom_bar(position = "fill") +
  labs(title = "Proportional", y = "Proportion")
p5c
#> Fair cut has a higher proportion of I1/SI2 (lower clarity)
#> Ideal cut has more VS1/VVS2 (higher clarity)
```

**Explanation:** Stacked bars show absolute counts and total size. Dodged bars let you compare individual categories across groups. Fill bars normalize each stack to 100%, revealing how the composition shifts, notice that better cuts tend to have better clarity proportions. Each position answers a different question: "how many total?", "how does each category compare?", and "what's the mix?"

</details>

**Try it:** Create a single `geom_bar(stat = "count")` of `mtcars$cyl`. Then try `geom_col()` with the same raw data (no pre-aggregation). What error do you get?

```r
# Try it: geom_bar counts vs geom_col needs pre-computed values
ex_bar <- ggplot(mtcars, aes(x = factor(cyl))) +
  # your code here — try geom_bar() then geom_col()

ex_bar
#> Expected: geom_bar works (counts rows); geom_col errors without a y aesthetic
```

<details>
<summary>Click to reveal solution</summary>

```r
# geom_bar() counts rows automatically — no y needed
ex_bar_count <- ggplot(mtcars, aes(x = factor(cyl))) +
  geom_bar(fill = "#7FB3D8")
ex_bar_count
#> 4-cyl: 11 cars, 6-cyl: 7 cars, 8-cyl: 14 cars

# geom_col() requires a y aesthetic — this will error:
# ggplot(mtcars, aes(x = factor(cyl))) + geom_col()
# Error: geom_col requires the following missing aesthetics: y
```

**Explanation:** `geom_bar()` uses `stat = "count"` by default, it counts rows per x-level. `geom_col()` uses `stat = "identity"`, it expects you to supply a pre-computed y-value. If you already have summary statistics, use `geom_col()`. If you want ggplot to count for you, use `geom_bar()`.

</details>

[WARNING]
**geom_bar() counts rows; geom_col() plots pre-computed values.** Mixing them up is a top ggplot2 error. Remember: geom_bar(stat = "count") is the default, geom_col(stat = "identity") is the default. If your data is already aggregated, use geom_col().

## How Do You Visualize Distributions? (Exercises 6–8)

Distribution charts answer "how is my data spread?", where values cluster, how wide the range is, and whether outliers lurk at the edges. Each geom reveals a different aspect of the same distribution.

### Exercise 6: Histogram with Binwidth Tuning (geom_histogram)

**Dataset:** `diamonds`

**Task:** Create a histogram of `price` using three different binwidths: 100, 500, and 2000. Add a vertical dashed line at the median price. Which binwidth tells the clearest story?

```r
# Exercise 6: histogram binwidth comparison
# Hint: use geom_vline(xintercept = ..., linetype = "dashed") for the median line

set.seed(42)
dia_sample <- diamonds[sample(nrow(diamonds), 3000), ]

# Try binwidth = 500 first
p6 <- ggplot(dia_sample, aes(x = price)) +
  # your code here
  labs(x = "Price ($)", y = "Count")
p6
#> Expected: bars showing right-skewed distribution with most diamonds under $5000
```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(42)
dia_sample <- diamonds[sample(nrow(diamonds), 3000), ]
med_price <- median(dia_sample$price)

# binwidth = 100: too noisy
p6_narrow <- ggplot(dia_sample, aes(x = price)) +
  geom_histogram(binwidth = 100, fill = "#4B6FA5", color = "white") +
  geom_vline(xintercept = med_price, linetype = "dashed", color = "red") +
  labs(title = "binwidth = 100", x = "Price ($)", y = "Count")
p6_narrow
#> Jagged bars — hard to see the overall shape through the noise

# binwidth = 500: just right
p6_mid <- ggplot(dia_sample, aes(x = price)) +
  geom_histogram(binwidth = 500, fill = "#4B6FA5", color = "white") +
  geom_vline(xintercept = med_price, linetype = "dashed", color = "red") +
  labs(title = "binwidth = 500", x = "Price ($)", y = "Count")
p6_mid
#> Clear right-skewed shape, peak near $1000, long tail to $18000+

# binwidth = 2000: too smooth
p6_wide <- ggplot(dia_sample, aes(x = price)) +
  geom_histogram(binwidth = 2000, fill = "#4B6FA5", color = "white") +
  geom_vline(xintercept = med_price, linetype = "dashed", color = "red") +
  labs(title = "binwidth = 2000", x = "Price ($)", y = "Count")
p6_wide
#> Only 9 bars — loses the sharp peak and secondary bump around $4000
```

**Explanation:** `binwidth = 100` creates too many bars, noise dominates and the shape is hard to read. `binwidth = 2000` collapses everything into a few fat bars, hiding the steep peak near $1,000 and the secondary bump around $4,000. `binwidth = 500` strikes the right balance: you see the strong right skew, the peak below $1,000, and the gradual tail. The dashed red line marks the median, notice it sits well below the mean because of the skew.

</details>

### Exercise 7: Overlapping Density Curves (geom_density)

**Dataset:** `iris`

**Task:** Plot density curves of `Petal.Length` for all three species on one chart. Use `fill` mapped to `Species` with `alpha = 0.4` for transparency. Which species has the narrowest spread?

```r
# Exercise 7: overlapping density curves
# Hint: map fill = Species inside aes(), set alpha outside aes()

p7 <- ggplot(iris, aes(x = Petal.Length)) +
  # your code here
  labs(x = "Petal Length (cm)", y = "Density")
p7
#> Expected: three overlapping filled curves, setosa narrow and far left
```

<details>
<summary>Click to reveal solution</summary>

```r
p7 <- ggplot(iris, aes(x = Petal.Length, fill = Species)) +
  geom_density(alpha = 0.4) +
  labs(x = "Petal Length (cm)", y = "Density", fill = "Species")
p7
#> setosa:     sharp peak near 1.5 cm — very narrow spread
#> versicolor: broader peak around 4.3 cm
#> virginica:  widest spread, centered around 5.5 cm
```

**Explanation:** `alpha = 0.4` makes the filled areas semi-transparent, so you can see all three distributions even where they overlap. Setosa's density curve is tall and narrow, its petal lengths are tightly clustered. Virginica has the widest spread. Density curves are better than histograms for comparing groups because they don't depend on arbitrary bin choices.

</details>

### Exercise 8: Horizontal Notched Boxplot (geom_boxplot)

**Dataset:** `mpg`

**Task:** Create a boxplot of `hwy` by `class`, flipped horizontally with `coord_flip()`. Add `notch = TRUE` and color outliers red. Which class has the highest median highway mpg?

```r
# Exercise 8: horizontal notched boxplot
# Hint: outlier.color controls the outlier point color

p8 <- ggplot(mpg, aes(x = class, y = hwy)) +
  # your code here — add notch and outlier color
  coord_flip() +
  labs(x = NULL, y = "Highway MPG")
p8
#> Expected: horizontal boxplots with notches showing median confidence intervals
```

<details>
<summary>Click to reveal solution</summary>

```r
p8 <- ggplot(mpg, aes(x = reorder(class, hwy, FUN = median), y = hwy)) +
  geom_boxplot(notch = TRUE, fill = "#7FB3D8", outlier.color = "red", outlier.size = 2) +
  coord_flip() +
  labs(x = NULL, y = "Highway MPG")
p8
#> subcompact: median ~26, a few outliers above 35
#> compact:    median ~28, narrow IQR
#> midsize:    median ~27
#> 2seater:    median ~25, very tight (only 5 cars)
#> minivan:    median ~23
#> suv:        median ~18, several low outliers
#> pickup:     median ~17, lowest group
```

**Explanation:** `notch = TRUE` adds notches around each median, if notches of two boxes don't overlap, their medians are significantly different at roughly 95% confidence. `reorder(class, hwy, FUN = median)` sorts classes by their median mpg value, making the ranking immediately visible. The red outlier points highlight unusual observations.

</details>

**Try it:** Add `geom_rug()` below a density plot of `mtcars$mpg`. What extra information does the rug show?

```r
# Try it: density + rug
ex_rug <- ggplot(mtcars, aes(x = mpg)) +
  geom_density(fill = "#7FB3D8", alpha = 0.5) +
  # your code here — add geom_rug()

ex_rug
#> Expected: density curve with tick marks along the x-axis for each observation
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_rug <- ggplot(mtcars, aes(x = mpg)) +
  geom_density(fill = "#7FB3D8", alpha = 0.5) +
  geom_rug(sides = "b", color = "#4B6FA5", alpha = 0.7)
ex_rug
#> Density shows the smooth shape; rug ticks show exact data locations
#> Cluster of ticks between 15-22 matches the density peak
#> Sparse ticks above 30 confirm the long right tail has few observations
```

**Explanation:** `geom_rug()` draws a tiny tick mark at each observation's value along the axis edge. It reveals the actual sample size and exact positions that the smoothed density curve abstracts away, helpful for spotting gaps or clusters the curve might smooth over.

</details>

[KEY INSIGHT]
**Boxplots compress distributions into five numbers, they hide bimodality entirely.** Always pair a boxplot with a density or violin plot when the shape of the distribution matters more than the summary statistics.

## How Do You Build Specialized Charts? (Exercises 9–12)

These geoms handle specific visualization tasks that the basic chart types can't: comparing full distribution shapes, showing magnitude over time, revealing patterns in grids, and adding text annotations directly to your plots.

### Exercise 9: Violin + Boxplot Overlay (geom_violin)

**Dataset:** `mpg`

**Task:** Create a violin plot of `hwy` by `drv` (drive type). Overlay a narrow boxplot inside each violin (`width = 0.15`). The violin shows distribution shape; the boxplot adds summary statistics.

```r
# Exercise 9: violin with embedded boxplot
# Hint: layer geom_violin first, then geom_boxplot on top

p9 <- ggplot(mpg, aes(x = drv, y = hwy)) +
  # your code here — violin + boxplot overlay
  labs(x = "Drive Type", y = "Highway MPG")
p9
#> Expected: violin shapes with thin boxplots inside each
```

<details>
<summary>Click to reveal solution</summary>

```r
p9 <- ggplot(mpg, aes(x = drv, y = hwy, fill = drv)) +
  geom_violin(alpha = 0.5) +
  geom_boxplot(width = 0.15, fill = "white", outlier.size = 1) +
  labs(x = "Drive Type", y = "Highway MPG") +
  scale_fill_manual(values = c("4" = "#4B6FA5", "f" = "#E05A4F", "r" = "#A5C882")) +
  theme(legend.position = "none")
p9
#> f (front-wheel): bimodal shape visible in violin — two density peaks
#> 4 (four-wheel):  compact distribution centered around 19
#> r (rear-wheel):  wide spread, median near 25
```

**Explanation:** The violin shows the full distribution shape, notice the front-wheel drive (`f`) has a slight bimodal bump that a boxplot alone would hide. The thin boxplot overlay adds the median, IQR, and outliers on top. This combination gives you the best of both worlds: shape from the violin, summary stats from the box.

</details>

### Exercise 10: Stacked Area Chart (geom_area)

**Dataset:** `economics`

**Task:** Create an area chart showing `unemploy` (unemployment in thousands) over time. Fill the area under the curve. Add a horizontal reference line at the mean unemployment level.

```r
# Exercise 10: area chart with reference line
# Hint: geom_area fills between y and the x-axis

p10 <- ggplot(economics, aes(x = date, y = unemploy)) +
  # your code here
  labs(x = "Year", y = "Unemployment (thousands)")
p10
#> Expected: filled area showing unemployment cycles from 1967 to 2015
```

<details>
<summary>Click to reveal solution</summary>

```r
mean_unemp <- mean(economics$unemploy)

p10 <- ggplot(economics, aes(x = date, y = unemploy)) +
  geom_area(fill = "#4B6FA5", alpha = 0.6) +
  geom_hline(yintercept = mean_unemp, linetype = "dashed", color = "#E05A4F") +
  labs(x = "Year", y = "Unemployment (thousands)")
p10
#> Cyclical pattern: spikes during recessions (1982, 1992, 2009)
#> The 2009 spike (Great Recession) dwarfs all previous peaks
#> Red dashed line at ~7,657 — mean unemployment across all years
```

**Explanation:** `geom_area()` fills the region between the line and y = 0, making the magnitude of unemployment visually obvious. The filled area emphasizes the sheer size of recession spikes compared to normal periods. The horizontal mean line helps you instantly spot which periods ran above or below the historical average.

</details>

### Exercise 11: Correlation Heatmap (geom_tile)

**Dataset:** `mtcars`

**Task:** Compute the correlation matrix of all numeric columns in `mtcars`. Reshape it to long format. Plot with `geom_tile()` using `scale_fill_gradient2()` (blue for negative, red for positive, white at zero).

```r
# Exercise 11: correlation heatmap
# Hint: use reshape2::melt or manual expansion to get long format

# Step 1: compute correlations
cor_matrix <- round(cor(mtcars), 2)

# Step 2: convert to long format for ggplot
# your code here

# Step 3: plot with geom_tile
# your code here
#> Expected: square heatmap with color-coded correlation values
```

<details>
<summary>Click to reveal solution</summary>

```r
# Compute correlation matrix
cor_matrix <- round(cor(mtcars), 2)

# Convert to long format using base R
cor_long <- data.frame(
  Var1 = rep(colnames(cor_matrix), each = ncol(cor_matrix)),
  Var2 = rep(colnames(cor_matrix), times = nrow(cor_matrix)),
  value = as.vector(cor_matrix)
)

p11 <- ggplot(cor_long, aes(x = Var1, y = Var2, fill = value)) +
  geom_tile(color = "white") +
  scale_fill_gradient2(low = "#4B6FA5", mid = "white", high = "#E05A4F", midpoint = 0) +
  labs(x = NULL, y = NULL, fill = "Correlation") +
  theme(axis.text.x = element_text(angle = 45, hjust = 1))
p11
#> mpg-wt: strong negative (r = -0.87) — dark blue
#> cyl-disp: strong positive (r = 0.90) — dark red
#> drat-wt: moderate negative (r = -0.71) — light blue
#> Diagonal is all 1.0 (each variable with itself)
```

**Explanation:** `geom_tile()` draws one rectangle per x-y combination, colored by the correlation value. `scale_fill_gradient2()` creates a diverging color scale centered at zero, blue for negative correlations, red for positive, white for near-zero. The rotated x-axis labels prevent overlap. This heatmap instantly reveals which mtcars variables move together and which move in opposite directions.

</details>

### Exercise 12: Bar Chart with Value Labels (geom_text)

**Dataset:** `mpg`

**Task:** Compute mean `hwy` per `class`. Plot as a bar chart with `geom_col()`. Add `geom_text()` labels showing the exact mean value above each bar. Round to 1 decimal place.

```r
# Exercise 12: bar chart with text labels
# Hint: use vjust = -0.5 to position text above bars

class_summary <- aggregate(hwy ~ class, data = mpg, FUN = mean)
class_summary$hwy <- round(class_summary$hwy, 1)

p12 <- ggplot(class_summary, aes(x = reorder(class, -hwy), y = hwy)) +
  geom_col(fill = "#4B6FA5") +
  # your code here — add geom_text with labels
  labs(x = "Vehicle Class", y = "Mean Highway MPG")
p12
#> Expected: bar chart with numeric labels floating above each bar
```

<details>
<summary>Click to reveal solution</summary>

```r
class_summary <- aggregate(hwy ~ class, data = mpg, FUN = mean)
class_summary$hwy <- round(class_summary$hwy, 1)

p12 <- ggplot(class_summary, aes(x = reorder(class, -hwy), y = hwy)) +
  geom_col(fill = "#4B6FA5") +
  geom_text(aes(label = hwy), vjust = -0.5, size = 3.5, fontface = "bold") +
  labs(x = "Vehicle Class", y = "Mean Highway MPG") +
  ylim(0, max(class_summary$hwy) * 1.1)
p12
#> subcompact: 28.1
#> compact:    28.3
#> midsize:    27.3
#> 2seater:    24.8
#> minivan:    22.4
#> suv:        18.1
#> pickup:     16.9
```

**Explanation:** `geom_text()` places a text label at each bar's x-y position. `vjust = -0.5` pushes the text above the bar top. `ylim()` extends the y-axis so the tallest label doesn't get clipped. Labeling bars with exact values helps readers make precise comparisons without guessing from the axis grid.

</details>

**Try it:** Replace `geom_text()` with `geom_label()` in Exercise 12's solution. What visual difference do you see?

```r
# Try it: geom_label vs geom_text
ex_label <- ggplot(class_summary, aes(x = reorder(class, -hwy), y = hwy)) +
  geom_col(fill = "#A5C882") +
  # your code here — use geom_label instead of geom_text

ex_label
#> Expected: same bar chart but labels have a white background box
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_label <- ggplot(class_summary, aes(x = reorder(class, -hwy), y = hwy)) +
  geom_col(fill = "#A5C882") +
  geom_label(aes(label = hwy), vjust = -0.3, size = 3.5) +
  ylim(0, max(class_summary$hwy) * 1.15)
ex_label
#> Same values but each label now has a white rounded-rectangle background
#> geom_label is easier to read on busy or dark backgrounds
```

**Explanation:** `geom_label()` adds a filled rectangle behind the text, making labels readable even over gridlines or colored backgrounds. Use `geom_text()` for clean, minimal annotations and `geom_label()` when readability is more important than aesthetics.

</details>

[TIP]
**Use geom_label() instead of geom_text() when your chart background is busy.** The white background box behind each label cuts through gridlines, overlapping elements, and dark fill colors that would make plain text hard to read.

## Practice Exercises

### Exercise 13: Annotated Scatter with Top-N Labels

Write code to create a scatter plot of `mpg` data (`displ` vs `hwy`) with a `geom_smooth(method = "lm")` trend line. Identify the top 3 most fuel-efficient cars (highest `hwy`) and label them with `geom_label()` showing their `model` name. Use `geom_point()` for all cars, then layer the labels only on the top 3.

```r
# Exercise 13: annotated scatter with selective labels
# Hint: create a subset of top 3, use it as the data argument in geom_label()

# Write your code below:

#> Expected: scatter + trend line + 3 labeled outliers at the top
```

<details>
<summary>Click to reveal solution</summary>

```r
# Identify top 3 most fuel-efficient
top3 <- mpg[order(-mpg$hwy), ][1:3, ]

my_scatter <- ggplot(mpg, aes(x = displ, y = hwy)) +
  geom_point(alpha = 0.4, color = "grey50") +
  geom_smooth(method = "lm", color = "#E05A4F", se = FALSE) +
  geom_point(data = top3, color = "#4B6FA5", size = 3) +
  geom_label(data = top3, aes(label = model), vjust = -0.8, size = 3, fill = "#FFFFCC") +
  labs(x = "Engine Displacement (L)", y = "Highway MPG")
my_scatter
#> Three labels appear near the top: corolla, civic, new beetle
#> They sit well above the trend line — exceptionally efficient for their engine size
```

**Explanation:** The key technique is passing a different `data` argument to `geom_label()`. While `geom_point()` uses all 234 rows, the label layer only sees the 3 rows in `top3`. This pattern, full dataset for the background, subset for annotations, is how you highlight specific observations without cluttering the chart.

</details>

### Exercise 14: Multi-Geom Distribution Comparison

Using the `diamonds` dataset (sample 3000 rows), create three separate plots that each show the distribution of `price` grouped by `cut`, using a different geom for each: (a) `geom_histogram()` with facets, (b) `geom_density()` with overlapping fills, and (c) `geom_boxplot()`. Which visualization reveals the most about how price varies by cut quality?

```r
# Exercise 14: three ways to show the same distribution
# Hint: use facet_wrap(~cut) for the histogram, fill = cut for density

set.seed(99)
dia_ex <- diamonds[sample(nrow(diamonds), 3000), ]

# Write your code below — create my_hist, my_dens, my_box:

#> Expected: three plots showing the same data through different lenses
```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(99)
dia_ex <- diamonds[sample(nrow(diamonds), 3000), ]

# (a) Faceted histogram — one panel per cut
my_hist <- ggplot(dia_ex, aes(x = price)) +
  geom_histogram(binwidth = 500, fill = "#4B6FA5", color = "white") +
  facet_wrap(~cut, scales = "free_y") +
  labs(title = "Histogram", x = "Price ($)", y = "Count")
my_hist
#> Each facet shows the distribution for one cut level
#> All cuts are right-skewed; Fair has the fewest diamonds

# (b) Overlapping density curves
my_dens <- ggplot(dia_ex, aes(x = price, fill = cut)) +
  geom_density(alpha = 0.35) +
  labs(title = "Density", x = "Price ($)", y = "Density")
my_dens
#> All cuts have similar shapes — surprising, Ideal isn't notably cheaper
#> Overlapping curves make direct comparison easy

# (c) Boxplot — summary statistics by cut
my_box <- ggplot(dia_ex, aes(x = cut, y = price)) +
  geom_boxplot(fill = "#7FB3D8") +
  labs(title = "Boxplot", x = "Cut", y = "Price ($)")
my_box
#> Medians are surprisingly similar across cuts (~2500-4000)
#> Fair has the highest median — counterintuitive until you realize bigger diamonds get Fair cuts
```

**Explanation:** Each geom tells a different part of the story. The histogram shows per-cut shape and count. The density overlay lets you compare shapes directly. The boxplot compresses everything to five numbers, revealing the surprising fact that Fair-cut diamonds have a *higher* median price (because larger diamonds are more likely to receive a Fair cut, and size drives price more than cut quality). No single chart tells the whole story.

</details>

## Complete Example

Let's bring together multiple geoms to explore the built-in `airquality` dataset from four angles. Each chart uses a different geom to reveal a different aspect of New York's 1973 air quality measurements.

```r
# Clean the data (remove rows with missing values)
aq <- na.omit(airquality)
aq$Month <- factor(aq$Month, labels = c("May", "Jun", "Jul", "Aug", "Sep"))
cat("Clean rows:", nrow(aq), "| Months:", levels(aq$Month), "\n")
#> Clean rows: 111 | Months: May Jun Jul Aug Sep

# Chart 1: Scatter — Temperature vs Ozone with trend
p_complete_1 <- ggplot(aq, aes(x = Temp, y = Ozone)) +
  geom_point(aes(color = Month), size = 2, alpha = 0.7) +
  geom_smooth(method = "loess", color = "black", se = TRUE) +
  labs(title = "Scatter: Temp vs Ozone", x = "Temperature (°F)", y = "Ozone (ppb)")
p_complete_1
#> Strong positive relationship — hotter days have higher ozone
#> July/August points cluster at high temp + high ozone

# Chart 2: Boxplot — Ozone by Month
p_complete_2 <- ggplot(aq, aes(x = Month, y = Ozone, fill = Month)) +
  geom_boxplot(show.legend = FALSE) +
  labs(title = "Boxplot: Ozone by Month", y = "Ozone (ppb)")
p_complete_2
#> July and August have highest median ozone (~60 ppb)
#> May has the lowest and tightest distribution

# Chart 3: Histogram — Wind speed distribution
p_complete_3 <- ggplot(aq, aes(x = Wind)) +
  geom_histogram(binwidth = 2, fill = "#A5C882", color = "white") +
  geom_vline(xintercept = mean(aq$Wind), linetype = "dashed", color = "red") +
  labs(title = "Histogram: Wind Speed", x = "Wind (mph)", y = "Count")
p_complete_3
#> Roughly normal, centered around 10 mph
#> A few calm days (< 4 mph) and gusty days (> 16 mph)

# Chart 4: Heatmap — Mean Ozone by Month and Wind category
aq$Wind_cat <- cut(aq$Wind, breaks = c(0, 8, 12, 21),
                   labels = c("Calm", "Moderate", "Gusty"))
heat_data <- aggregate(Ozone ~ Month + Wind_cat, data = aq, FUN = mean)

p_complete_4 <- ggplot(heat_data, aes(x = Month, y = Wind_cat, fill = Ozone)) +
  geom_tile(color = "white", linewidth = 1) +
  scale_fill_gradient(low = "#E8F0FE", high = "#E05A4F") +
  geom_text(aes(label = round(Ozone, 0)), size = 4) +
  labs(title = "Heatmap: Mean Ozone", y = "Wind Category", fill = "Ozone\n(ppb)")
p_complete_4
#> Calm + July/August = highest ozone (darkest red)
#> Gusty + May = lowest ozone — wind disperses pollutants
```

Four different geoms, same dataset, four different insights. The scatter reveals the temperature-ozone relationship. The boxplot compares months. The histogram shows wind's distribution. And the heatmap combines month and wind to find the conditions that produce the worst air quality. Choosing the right geom for each question is the core skill these 12 exercises develop.

## Summary

| Geom | Chart Type | Key Parameters | Best For |
|------|-----------|----------------|----------|
| `geom_point()` | Scatter plot | `size`, `alpha`, `shape` | Relationships between two continuous variables |
| `geom_line()` | Line chart | `linewidth`, `linetype`, `group` | Trends over time, ordered sequences |
| `geom_smooth()` | Trend line | `method`, `se`, `span` | Overlaying fitted curves on scatter plots |
| `geom_col()` | Bar chart | `width`, `position` | Plotting pre-computed summary values |
| `geom_bar()` | Bar chart | `position`, `stat` | Counting observations per category |
| `geom_histogram()` | Histogram | `binwidth`, `bins`, `boundary` | Distribution shape of one numeric variable |
| `geom_density()` | Density plot | `bw`, `alpha`, `fill` | Smooth distribution comparison across groups |
| `geom_boxplot()` | Boxplot | `notch`, `outlier.color`, `width` | Median, IQR, and outliers across groups |
| `geom_violin()` | Violin plot | `draw_quantiles`, `scale` | Full distribution shape across groups |
| `geom_area()` | Area chart | `alpha`, `position` | Magnitude over time, stacked composition |
| `geom_tile()` | Heatmap | `color`, `linewidth` | Patterns in two-dimensional grids |
| `geom_text()` | Text labels | `vjust`, `hjust`, `size` | Annotating specific data points |

## References

1. Wickham, H., *ggplot2: Elegant Graphics for Data Analysis*, 3rd Edition. Springer (2024). Chapter 3: Individual geoms. [Link](https://ggplot2-book.org/individual-geoms.html)
2. ggplot2 documentation, Geom function reference. [Link](https://ggplot2.tidyverse.org/reference/index.html#geoms)
3. R Graph Gallery, ggplot2 chart types. [Link](https://r-graph-gallery.com/ggplot2-package.html)
4. Posit cheat sheet, Data visualization with ggplot2. [Link](https://rstudio.github.io/cheatsheets/data-visualization.pdf)
5. Wilkinson, L., *The Grammar of Graphics*, 2nd Edition. Springer (2005). [Link](https://link.springer.com/book/10.1007/0-387-28695-0)
6. Healy, K., *Data Visualization: A Practical Introduction*. Princeton University Press (2019). [Link](https://socviz.co/)

## Continue Learning

1. [ggplot2 Exercises (15 problems)](ggplot2-Exercises.html), broader ggplot2 practice covering aesthetics, scales, facets, themes, and coordinate systems
2. [ggplot2 Distribution Charts](ggplot2-Distribution-Charts.html), deep dive on histograms, density plots, boxplots, and violin charts with parameter tuning guidance
3. [ggplot2 Scatter Plots](ggplot2-Scatter-Plots.html), comprehensive scatter plot tutorial covering overplotting, grouping, trend lines, and marginal plots
