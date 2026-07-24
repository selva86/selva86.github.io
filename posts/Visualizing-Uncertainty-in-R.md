---
title: "Visualizing Uncertainty in R: Intervals, Bands and ggdist"
slug: "Visualizing-Uncertainty-in-R"
description: "Show uncertainty in R the right way: error bars, point-intervals, confidence bands and ggdist. A clear ggplot2 guide with runnable examples from scratch."
keywords: "visualizing uncertainty in R, ggdist, confidence intervals ggplot2, error bars in R, geom_ribbon, stat_pointinterval, stat_halfeye, confidence bands, uncertainty visualization, stat_lineribbon"
auto_link_terms: "visualizing uncertainty in R|uncertainty visualization|confidence bands|confidence band|point-interval plot|point intervals|half-eye plot|gradient interval|ggdist|stat_halfeye()|stat_pointinterval()|stat_lineribbon()|stat_interval()|eye plot"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-07-24"
curriculum_id: "GG2-10.1"
post_type: "C"
sidebar_section: "Visualization"
sidebar_title: "Visualizing Uncertainty"
sidebar_order: "60"
difficulty: "Intermediate"
---

<p class="lead">Visualizing uncertainty means showing not just a number but how sure you are of it. Instead of a lone average, you draw error bars, intervals, bands or a distribution shape so the reader can see the full range of plausible values at a glance. This guide teaches the whole toolkit from scratch: base ggplot2 error bars and confidence bands first, then the ggdist package for richer point-intervals, half-eye plots and model bands.</p>

We build up slowly, and we use base R and the tidyverse together. The first four sections run right here in your browser, so you can execute every line as you read. Later sections use the ggdist package, which you run in your own R session. No prior knowledge of confidence intervals is assumed; we explain each idea before we use it.

## Why plot uncertainty instead of just the average?

A bar chart of group averages looks clean and confident. That is exactly the problem. It shows one number per group and quietly hides how noisy that number is. Two groups can have the same average while one is rock-solid and the other is barely more than a guess, and a plain bar chart draws them identically.

The fix is to always pair an estimate with a measure of how much it could wobble. Let's start with the `mtcars` dataset, which ships with R, and summarise fuel economy (`mpg`) for cars grouped by their number of cylinders (`cyl`). Alongside the mean we compute the standard deviation, the group size, and the standard error, which we will unpack properly in the next section. The `|>` symbol in the code is R's pipe: it feeds the value on its left into the function on its right, so you read the steps top to bottom as take `mtcars`, group it by `cyl`, then summarise each group.

```r title="Summarise mpg with its uncertainty"
library(ggplot2)
library(dplyr)

mpg_by_cyl <- mtcars |>
  group_by(cyl) |>
  summarise(
    mean_mpg = mean(mpg),
    sd_mpg   = sd(mpg),
    n        = n(),
    se_mpg   = sd_mpg / sqrt(n)
  )

mpg_by_cyl
#> # A tibble: 3 × 5
#>     cyl mean_mpg sd_mpg     n se_mpg
#>   <dbl>    <dbl>  <dbl> <int>  <dbl>
#> 1     4     26.7   4.51    11  1.36
#> 2     6     19.7   1.45     7  0.549
#> 3     8     15.1   2.56    14  0.684
```

Read the last two columns. The 4-cylinder cars average 26.7 mpg with a standard error of 1.36, while the 6-cylinder cars average 19.7 with a much smaller standard error of 0.549. That single extra column is the whole point: we now know not just the averages but how precisely we know each one.

Numbers in a table are hard to compare, so let's turn them into a picture. `geom_pointrange()` draws a dot for the estimate and a vertical line for the range around it. Here we draw the mean plus or minus one standard error.

```r title="Plot group means as point-intervals"
ggplot(mpg_by_cyl, aes(x = factor(cyl), y = mean_mpg)) +
  geom_pointrange(aes(ymin = mean_mpg - se_mpg, ymax = mean_mpg + se_mpg)) +
  labs(x = "Cylinders", y = "Mean MPG (+/- 1 SE)") +
  theme_minimal()
```

Run that block and you get three dots with short vertical whiskers. The dot is the average; the whisker is the uncertainty. The 6-cylinder whisker is tiny, telling you that estimate is precise, while the 4-cylinder whisker is longer, telling you to trust it a little less. That contrast is invisible on a bar chart.

[KEY INSIGHT]
**An estimate without an interval is only half the story.** The interval tells the reader how much the estimate might move if you collected the data again, which is the difference between "about 27" and "27, give or take a lot".

**Try it:** Build a summary of horsepower (`hp`) by cylinder. Start from the scaffold, then add the `sd_hp`, `n` and `se_hp` columns the same way we did for mpg.

```r title="Your turn: summarise horsepower by cylinder"
ex_hp_by_cyl <- mtcars |>
  group_by(cyl) |>
  summarise(
    mean_hp = mean(hp)
    # add sd_hp, n, and se_hp columns here
  )

ex_hp_by_cyl
#> Expected: a tibble with mean_hp, sd_hp, n and se_hp for cyl 4, 6, 8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Horsepower summary solution"
ex_hp_by_cyl <- mtcars |>
  group_by(cyl) |>
  summarise(
    mean_hp = mean(hp),
    sd_hp   = sd(hp),
    n       = n(),
    se_hp   = sd_hp / sqrt(n)
  )
ex_hp_by_cyl
#> # A tibble: 3 × 5
#>     cyl mean_hp sd_hp     n se_hp
#>   <dbl>   <dbl> <dbl> <int> <dbl>
#> 1     4    82.6  20.9    11  6.31
#> 2     6   122.   24.3     7  9.17
#> 3     8   209.   51.0    14 13.6
```

**Explanation:** The pattern is identical to the mpg summary. `se_hp = sd_hp / sqrt(n)` shrinks the spread of the raw values into a measure of how precisely we know the mean.

</details>

## What do SD, standard error, and confidence intervals actually measure?

Those three terms trip up almost everyone, because they sound similar but answer different questions. Getting them straight is the foundation for every plot in this guide, so let's slow down and define each one in plain language before touching the formulas.

- **Standard deviation (SD)** measures the spread of the raw data. If individual cars vary a lot in mpg, the SD is large. It describes the data points themselves.
- **Standard error (SE)** measures the precision of the average. It answers "if I recomputed this mean from a fresh sample, how much would it jump around?" More data means a more stable mean, so SE shrinks as the sample grows.
- **Confidence interval (CI)** turns the SE into a plain-language range, such as "we are 95% confident the true average lies between 24 and 29".

The three are linked by a short chain. You start with the spread of the data, divide by the square root of the sample size to get the precision of the mean, then widen that by a critical value to get an interval.

![How a spread of data points becomes a standard error and then a 95% confidence interval.](screenshots/Visualizing-Uncertainty-in-R-sd-se-ci-flow.webp)
*Figure 1: From raw spread to a confidence interval in two steps.*

Here is the same chain in R, computed by hand for the 4-cylinder cars so you can see every step. We pull out the raw mpg values, then walk from SD to SE to a 95% interval.

```r title="Standard deviation, standard error, and a 95% CI"
mpg_4cyl <- mtcars$mpg[mtcars$cyl == 4]

n_obs    <- length(mpg_4cyl)
mean_val <- mean(mpg_4cyl)
sd_val   <- sd(mpg_4cyl)
se_val   <- sd_val / sqrt(n_obs)

ci_lower <- mean_val - 1.96 * se_val
ci_upper <- mean_val + 1.96 * se_val

round(c(n = n_obs, mean = mean_val, sd = sd_val, se = se_val,
        ci_lower = ci_lower, ci_upper = ci_upper), 2)
#>        n     mean       sd       se ci_lower ci_upper
#>    11.00    26.66     4.51     1.36    24.00    29.33
```

Walk through the numbers. The raw mpg values have an SD of 4.51, a fairly wide spread. Dividing by the square root of 11 shrinks that to an SE of 1.36. Multiplying the SE by 1.96 and stepping out on both sides of the mean gives an interval from 24.0 to 29.3. That interval is our best guess for where the true 4-cylinder average lives.

Two formulas capture that chain. The standard error rescales the spread by sample size:

$$SE = \frac{SD}{\sqrt{n}}$$

And the 95% confidence interval steps out from the mean by about two standard errors:

$$CI_{95\%} = \bar{x} \pm 1.96 \times SE$$

Where:
- $\bar{x}$ = the sample mean (our estimate)
- $SD$ = the standard deviation of the raw values
- $n$ = the number of observations
- $1.96$ = the critical value that captures the middle 95% of a normal distribution

The value 1.96 is the large-sample shortcut. With only 11 cars, the honest critical value is a little larger, and R's built-in `t.test()` uses the exact one for you. Let's compare.

```r title="The exact interval from t.test()"
t.test(mpg_4cyl)$conf.int
#> [1] 23.63389 29.69338
#> attr(,"conf.level")
#> [1] 0.95
```

The exact interval runs from 23.6 to 29.7, slightly wider than our hand-rolled 24.0 to 29.3, because the t-distribution accounts for the small sample. For quick plots the difference is small, but for a real report you should let `t.test()` or a model compute the interval.

[NOTE]
**A 95% CI is about the procedure, not a single interval.** It means that if you repeated the whole study many times, about 95% of the intervals you build this way would contain the true value. Any one interval either contains it or does not; the 95% describes the long-run hit rate.

**Try it:** Compute the exact 95% confidence interval for the mean mpg of the 6-cylinder cars using `t.test()`.

```r title="Your turn: 95% CI for 6-cylinder mpg"
mpg_6cyl <- mtcars$mpg[mtcars$cyl == 6]

# use t.test() to pull out the confidence interval

#> Expected: an interval of roughly 18.4 to 21.1
```

<details>
<summary>Click to reveal solution</summary>

```r title="6-cylinder CI solution"
mpg_6cyl <- mtcars$mpg[mtcars$cyl == 6]
t.test(mpg_6cyl)$conf.int
#> [1] 18.39853 21.08718
#> attr(,"conf.level")
#> [1] 0.95
```

**Explanation:** `t.test()` returns a list, and `$conf.int` grabs the interval directly. The 6-cylinder average is known more precisely than the 4-cylinder one, so this interval is narrower.

</details>

## How do you draw error bars and point-intervals in ggplot2?

Now that you know what an interval means, let's draw it properly for several groups at once. The recipe is always the same: compute a lower and upper bound per group, then hand those bounds to a ggplot2 geom. We'll build the bounds with `qt()`, which gives the exact t critical value for each group's sample size.

```r title="Add 95% CI columns to the summary"
mpg_ci <- mtcars |>
  group_by(cyl) |>
  summarise(
    mean_mpg = mean(mpg),
    se_mpg   = sd(mpg) / sqrt(n()),
    n        = n()
  ) |>
  mutate(
    tcrit = qt(0.975, df = n - 1),
    lower = mean_mpg - tcrit * se_mpg,
    upper = mean_mpg + tcrit * se_mpg
  )

mpg_ci
#> # A tibble: 3 × 7
#>     cyl mean_mpg se_mpg     n tcrit lower upper
#>   <dbl>    <dbl>  <dbl> <int> <dbl> <dbl> <dbl>
#> 1     4     26.7  1.36     11  2.23  23.6  29.7
#> 2     6     19.7  0.549     7  2.45  18.4  21.1
#> 3     8     15.1  0.684    14  2.16  13.6  16.6
```

The `tcrit` column shows the critical value shrinking as the group grows, from 2.45 for the 7-car group down to 2.16 for the 14-car group. The `lower` and `upper` columns are the 95% bounds, and notice they match the `t.test()` interval we computed earlier for the 4-cylinder group. Now we can plot them.

`geom_errorbar()` draws the classic capped bar. We pair it with `geom_point()` for the estimate.

```r title="Draw error bars with geom_errorbar()"
ggplot(mpg_ci, aes(x = factor(cyl), y = mean_mpg)) +
  geom_errorbar(aes(ymin = lower, ymax = upper), width = 0.15) +
  geom_point(size = 3, colour = "steelblue") +
  labs(x = "Cylinders", y = "Mean MPG (95% CI)") +
  theme_minimal()
```

The `width` argument controls the little horizontal caps; smaller values give narrower caps. If you prefer a cleaner look with no caps, swap `geom_errorbar()` for `geom_linerange()`, or use `geom_pointrange()` from the first section to draw the point and the line in one geom.

Computing the summary yourself is the transparent way, but ggplot2 can also do it on the fly. `stat_summary()` takes the raw data and computes a summary function per group. Passing `fun.data = mean_se` gives the mean plus or minus one standard error, drawn as a point-interval, all without a separate summary table.

```r title="Let stat_summary() do the work"
ggplot(mtcars, aes(x = factor(cyl), y = mpg)) +
  geom_jitter(width = 0.08, colour = "grey70") +
  stat_summary(fun.data = mean_se, geom = "pointrange", colour = "firebrick") +
  labs(x = "Cylinders", y = "MPG") +
  theme_minimal()
```

This plot layers the raw data (grey jittered dots) under the summary (red point-intervals), which is a genuinely honest chart: the reader sees both the individual cars and the summarised uncertainty. The jitter spreads points sideways so they do not overlap.

[TIP]
**Show the raw data whenever you can.** Layering jittered points under a summary lets readers judge the spread and spot outliers, instead of trusting a floating interval with no context.

**Try it:** Recreate the raw-plus-summary plot, but for car weight (`wt`) instead of mpg, and colour the point-intervals dark green.

```r title="Your turn: point-intervals for weight by cylinder"
ggplot(mtcars, aes(x = factor(cyl), y = wt)) +
  geom_jitter(width = 0.08, colour = "grey70") +
  # add a stat_summary() point-interval layer in dark green

  labs(x = "Cylinders", y = "Weight (1000 lbs)") +
  theme_minimal()
#> Expected: green point-intervals over jittered weight points, per cylinder
```

<details>
<summary>Click to reveal solution</summary>

```r title="Weight point-interval solution"
ggplot(mtcars, aes(x = factor(cyl), y = wt)) +
  geom_jitter(width = 0.08, colour = "grey70") +
  stat_summary(fun.data = mean_se, geom = "pointrange", colour = "darkgreen") +
  labs(x = "Cylinders", y = "Weight (1000 lbs)") +
  theme_minimal()
```

**Explanation:** Only the `y` aesthetic and the colour change. `stat_summary()` recomputes `mean_se` for the new variable automatically, which is why it is so convenient.

</details>

## How do you add a confidence band around a trend line?

Error bars work when the x-axis is a handful of categories. When x is continuous, like car weight, you want a smooth **confidence band**: a shaded ribbon that hugs a trend line and shows how uncertain the line is at every x value. The band is narrow where you have lots of data and flares out where data is sparse.

The quickest way is `geom_smooth()`. Ask it for a linear model with `method = "lm"` and it fits the line and draws the 95% band in one step.

```r title="A confidence band with geom_smooth()"
ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point(colour = "grey40") +
  geom_smooth(method = "lm", formula = y ~ x) +
  labs(x = "Weight (1000 lbs)", y = "MPG") +
  theme_minimal()
```

Run it and you get the downward trend line with a grey band around it. The band is the confidence interval for the fitted line at each weight. It is thinnest near the middle of the data and widens toward the edges, exactly where predictions get shakier.

`geom_smooth()` is convenient but a bit of a black box, so let's open it up. The band comes from fitting a model and asking `predict()` for a confidence interval at a grid of x values. We build that grid, get predictions with bounds, and glue them together.

```r title="Build the band yourself with predict()"
model <- lm(mpg ~ wt, data = mtcars)

grid  <- data.frame(wt = seq(min(mtcars$wt), max(mtcars$wt), length.out = 50))
preds <- predict(model, newdata = grid, interval = "confidence", level = 0.95)

band <- cbind(grid, as.data.frame(preds))
head(band, 3)
#>         wt      fit      lwr      upr
#> 1 1.513000 29.19894 26.96376 31.43412
#> 2 1.592816 28.77236 26.61606 30.92867
#> 3 1.672633 28.34579 26.26736 30.42421
```

The `fit` column is the predicted mpg, and `lwr` and `upr` are the confidence bounds at each weight. Now `geom_ribbon()` draws the shaded area between `lwr` and `upr`, and `geom_line()` draws the fit on top.

```r title="Draw the band with geom_ribbon()"
ggplot(band, aes(x = wt, y = fit)) +
  geom_ribbon(aes(ymin = lwr, ymax = upr), fill = "steelblue", alpha = 0.25) +
  geom_line(colour = "steelblue", linewidth = 1) +
  geom_point(data = mtcars, aes(x = wt, y = mpg), colour = "grey40") +
  labs(x = "Weight (1000 lbs)", y = "MPG") +
  theme_minimal()
```

This reproduces what `geom_smooth()` did, but now you control every piece: the model, the confidence level, the fill colour, and the transparency set by `alpha`. Building it by hand also makes the next distinction concrete.

[WARNING]
**A confidence band is not a prediction band.** The confidence band shows uncertainty about the average line, so it is narrow. A prediction band shows where a single new car might fall, which is much wider because individual cars scatter around the line. Use `interval = "confidence"` for the mean and `interval = "prediction"` for one new observation.

**Try it:** Rebuild the `band` data frame using a prediction interval instead of a confidence interval, and print the first few rows. Notice how much wider the bounds get.

```r title="Your turn: build a prediction band"
# Reuse `model` and `grid` from above.
# Your task: change "confidence" to "prediction" in the predict() call.
ex_preds <- predict(model, newdata = grid, interval = "confidence", level = 0.95)
ex_band  <- cbind(grid, as.data.frame(ex_preds))
head(ex_band, 3)
#> Expected: after the switch, lwr/upr are far wider (about 22.6 and 35.8 at wt = 1.51)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Prediction band solution"
ex_band <- cbind(
  grid,
  as.data.frame(predict(model, newdata = grid, interval = "prediction", level = 0.95))
)
head(ex_band, 3)
#>         wt      fit      lwr      upr
#> 1 1.513000 29.19894 22.58903 35.80885
#> 2 1.592816 28.77236 22.18871 35.35602
#> 3 1.672633 28.34579 21.78723 34.90435
```

**Explanation:** The `fit` column is unchanged, but the bounds widen sharply. At a weight of 1.51 the confidence band spanned 27.0 to 31.4, while the prediction band spans 22.6 to 35.8, because it must account for a single car's scatter, not just the uncertainty of the average.

</details>

## What is ggdist and how do its point-intervals work?

Base ggplot2 gets you error bars and bands. The ggdist package goes further: it treats uncertainty visualization as **distribution visualization**, and gives you a family of stats that draw point estimates, one or more nested intervals, and the shape of the distribution, all from a single line of code. It is the tool the title of this guide promises.

[NOTE]
**The ggdist examples run in your local R session.** ggdist is not part of the in-page runner, so copy the blocks below into RStudio or an R console to run them. Everything up to this point runs directly in your browser. Each block below shows the real output it produces, so you can check your own results against it after running it locally.

ggdist's core idea is the **point-interval**: a dot for a central estimate, plus one or more bars of increasing thinness for wider intervals. Adding a density curve on top turns it into a half-eye plot. The diagram below shows the anatomy.

![The parts of a ggdist point-interval, and how adding a density slab turns it into a half-eye.](screenshots/Visualizing-Uncertainty-in-R-pointinterval-anatomy.webp)
*Figure 2: A point-interval is a point plus nested interval bars; a slab of density makes it a half-eye.*

Before plotting, it helps to see the numbers ggdist works with. The `point_interval()` function summarises a column into a point estimate and its intervals. The `.width` argument asks for several interval widths at once, here the 50%, 80% and 95% intervals.

```r-static title="Compute nested intervals with point_interval()"
library(ggdist)

mtcars |>
  group_by(cyl) |>
  point_interval(mpg, .width = c(0.5, 0.8, 0.95))
#> # A tibble: 9 × 7
#>     cyl   mpg .lower .upper .width .point .interval
#>   <dbl> <dbl>  <dbl>  <dbl>  <dbl> <chr>  <chr>
#> 1     4  26     22.8   30.4   0.5  median qi
#> 2     6  19.7   18.6   21     0.5  median qi
#> 3     8  15.2   14.4   16.2   0.5  median qi
#> 4     4  26     21.5   32.4   0.8  median qi
#> 5     6  19.7   18.0   21.2   0.8  median qi
#> 6     8  15.2   11.3   18.3   0.8  median qi
#> 7     4  26     21.4   33.5   0.95 median qi
#> 8     6  19.7   17.8   21.3   0.95 median qi
#> 9     8  15.2   10.4   19.0   0.95 median qi
```

Each cylinder group gets three rows, one per width. The `.point` column tells you the estimate is the median, and `.interval` says the bounds are quantile intervals (`qi`). Notice the intervals nest: the 95% interval for the 4-cylinder group (21.4 to 33.5) contains the 80% interval (21.5 to 32.4), which contains the 50% interval (22.8 to 30.4). This is the data behind a ggdist plot.

Now the plot. `stat_pointinterval()` takes the raw data and draws exactly those nested intervals, thick bars for narrow intervals and thin bars for wide ones.

```r-static title="Plot point-intervals with stat_pointinterval()"
ggplot(mtcars, aes(x = mpg, y = factor(cyl))) +
  stat_pointinterval(.width = c(0.5, 0.95)) +
  labs(x = "MPG", y = "Cylinders") +
  theme_ggdist()
```

![Point-intervals for mpg by cylinder, with a thick 50% bar and a thin 95% bar.](screenshots/Visualizing-Uncertainty-in-R-pointinterval.png)
*Figure 3: stat_pointinterval() draws a point plus nested interval bars per group, no summary table needed.*

The dot is the median mpg, the thick bar is the 50% interval, and the thin bar is the 95% interval. The whole plot came from one stat, with no manual summarising. To make the widths pop with colour instead of thickness, `stat_interval()` draws each interval as a coloured band.

```r-static title="Nested intervals with stat_interval()"
ggplot(mtcars, aes(x = mpg, y = factor(cyl))) +
  stat_interval(.width = c(0.5, 0.8, 0.95), linewidth = 6) +
  scale_color_brewer(palette = "Blues") +
  labs(x = "MPG", y = "Cylinders", color = "Interval") +
  theme_ggdist()
```

![Nested coloured intervals for mpg by cylinder using stat_interval().](screenshots/Visualizing-Uncertainty-in-R-stat-interval.png)
*Figure 4: stat_interval() encodes interval width with colour, darkest for the narrowest interval.*

Now the 50%, 80% and 95% intervals stack as darker-to-lighter bands. This is a compact way to show that most of the plausible values sit in the dark core, with the light edges being less likely.

[KEY INSIGHT]
**Nested intervals show confidence as a gradient, not a cliff.** A single 95% bar implies everything inside is equally likely and everything outside is impossible. Stacking 50%, 80% and 95% intervals reminds the reader that plausibility fades smoothly from the center outward.

**Try it:** Use `point_interval()` to summarise horsepower (`hp`) by cylinder at a single 90% interval width.

```r-static title="Your turn: 90% interval for horsepower"
mtcars |>
  group_by(cyl) |>
  # call point_interval() on hp with .width = 0.9

#> Expected: a median hp per cylinder with 90% lower and upper bounds
```

<details>
<summary>Click to reveal solution</summary>

```r-static title="Horsepower 90% interval solution"
mtcars |>
  group_by(cyl) |>
  point_interval(hp, .width = 0.9)
#> # A tibble: 3 × 7
#>     cyl    hp .lower .upper .width .point .interval
#>   <dbl> <dbl>  <dbl>  <dbl>  <dbl> <chr>  <chr>
#> 1     4   91     57    111     0.9 median qi
#> 2     6  110    106.   159.    0.9 median qi
#> 3     8  192.   150    289.    0.9 median qi
```

**Explanation:** Swapping `mpg` for `hp` and using a single `.width` gives one row per group. The 8-cylinder cars have both the highest median horsepower and the widest interval, meaning their power varies the most.

</details>

## How do you show a whole distribution with half-eye and gradient plots?

A point-interval summarises a distribution into a point and some bars. Sometimes you want to show the full shape: is it symmetric, skewed, or bimodal? ggdist's slabinterval family answers this by drawing a **slab** (the distribution's shape) attached to an interval. The most popular is the half-eye plot.

`stat_halfeye()` draws a density curve (the "eye") above a point-interval. You see the estimate, the intervals, and the entire distribution in one compact glyph.

```r-static title="Show the whole distribution with stat_halfeye()"
ggplot(mtcars, aes(x = mpg, y = factor(cyl))) +
  stat_halfeye(.width = c(0.5, 0.95)) +
  labs(x = "MPG", y = "Cylinders") +
  theme_ggdist()
```

![Half-eye plots of mpg by cylinder: a density slab above a point-interval for each group.](screenshots/Visualizing-Uncertainty-in-R-halfeye.png)
*Figure 5: stat_halfeye() stacks a density slab on top of a point-interval, showing shape and summary together.*

Look at the 8-cylinder group at the bottom. Its density slab has a clear peak, telling you most 8-cylinder cars cluster tightly, while the 4-cylinder slab at the top is wider and flatter, meaning those cars vary more in mpg. The point-interval underneath each slab gives the same summary you saw before. This is the plot that made ggdist famous.

A gradient plot carries the same information but fades the fill by density instead of drawing a curve. Denser regions are darker, so the eye is drawn to the most probable values.

```r-static title="Fade uncertainty with stat_gradientinterval()"
ggplot(mtcars, aes(x = mpg, y = factor(cyl))) +
  stat_gradientinterval(.width = c(0.5, 0.95)) +
  labs(x = "MPG", y = "Cylinders") +
  theme_ggdist()
```

![Gradient-interval plots of mpg by cylinder, where colour fades with density.](screenshots/Visualizing-Uncertainty-in-R-gradient.png)
*Figure 6: stat_gradientinterval() encodes probability as opacity, darkest where values are most likely.*

Gradient plots are handy when you have many groups and stacked density curves would overlap. The fading fill communicates "most likely here, less likely there" without adding vertical height.

[TIP]
**Match the glyph to your audience.** Point-intervals are safest for reports because everyone reads error bars. Half-eye and gradient plots reward a more technical audience with the full distribution shape. Pick the simplest glyph that still tells the story.

**Try it:** Swap `stat_halfeye()` for `stat_eye()` to draw a full eye, which mirrors the density above and below the interval.

```r-static title="Your turn: draw a full eye plot"
ggplot(mtcars, aes(x = mpg, y = factor(cyl))) +
  # replace this comment with a stat_eye() layer using .width = c(0.5, 0.95)
  labs(x = "MPG", y = "Cylinders") +
  theme_ggdist()
#> Expected: a symmetric (mirrored) density with an interval, one per cylinder
```

<details>
<summary>Click to reveal solution</summary>

```r-static title="Full eye plot solution"
ggplot(mtcars, aes(x = mpg, y = factor(cyl))) +
  stat_eye(.width = c(0.5, 0.95)) +
  labs(x = "MPG", y = "Cylinders") +
  theme_ggdist()
```

**Explanation:** `stat_eye()` is the two-sided cousin of `stat_halfeye()`. It mirrors the density into a violin-like shape with the point-interval running through the middle.

</details>

## How do you visualize model uncertainty with stat_lineribbon()?

The final piece ties intervals and bands together. When you fit a model and want a trend line with nested uncertainty bands, ggdist's `stat_lineribbon()` is purpose-built. It draws the fit plus several bands at once, giving the continuous cousin of the nested point-intervals from earlier.

First we need fitted values with their standard errors along a grid of weights. The broom package does this cleanly: `augment()` with `se_fit = TRUE` returns the fitted value and its standard error for each new x. This step uses only broom, so it runs in your browser.

```r title="Fitted values with standard errors"
library(broom)

lm_fit  <- lm(mpg ~ wt, data = mtcars)
wt_grid <- data.frame(wt = seq(min(mtcars$wt), max(mtcars$wt), length.out = 50))

aug <- augment(lm_fit, newdata = wt_grid, se_fit = TRUE)
head(aug, 3)
#> # A tibble: 3 × 3
#>      wt .fitted .se.fit
#>   <dbl>   <dbl>   <dbl>
#> 1  1.51    29.2    1.09
#> 2  1.59    28.8    1.06
#> 3  1.67    28.3    1.02
```

The `.fitted` column is the predicted mpg and `.se.fit` is its standard error at each weight. To turn a fitted value and its standard error into a full distribution, ggdist uses the distributional package: `dist_student_t()` builds a t-distribution for every row from the degrees of freedom, the fitted mean, and the standard error. `stat_lineribbon()` then draws nested bands from those distributions.

```r-static title="Model uncertainty bands with stat_lineribbon()"
library(ggdist)
library(distributional)

ggplot(aug, aes(x = wt)) +
  stat_lineribbon(
    aes(ydist = dist_student_t(df = df.residual(lm_fit), mu = .fitted, sigma = .se.fit)),
    .width = c(0.5, 0.8, 0.95)
  ) +
  geom_point(data = mtcars, aes(y = mpg), colour = "grey40") +
  scale_fill_brewer(palette = "Blues") +
  labs(x = "Weight (1000 lbs)", y = "MPG", fill = "Interval") +
  theme_ggdist()
```

![A fit line with nested 50%, 80% and 95% uncertainty bands from stat_lineribbon().](screenshots/Visualizing-Uncertainty-in-R-lineribbon.png)
*Figure 7: stat_lineribbon() draws the fit with nested confidence bands, darkest at the center.*

The result is the plot the whole guide has been building toward: a fit line wrapped in three nested bands, dark in the middle where the model is most confident and fading outward. It is the band from section four, upgraded to show several confidence levels at once, with the same nested logic as the point-intervals from section five.

[KEY INSIGHT]
**Uncertainty visualization is one idea in many outfits.** A point-interval, a half-eye, and a lineribbon all answer the same question, "how sure are we?", for categories, for a single distribution, and for a trend. Once you see the shared logic, choosing a geom becomes a matter of data shape, not new theory.

**Try it:** Redraw the lineribbon with a single 95% band in a solid fill colour instead of three nested bands.

```r-static title="Your turn: a single 95% model band"
ggplot(aug, aes(x = wt)) +
  stat_lineribbon(
    aes(ydist = dist_student_t(df = df.residual(lm_fit), mu = .fitted, sigma = .se.fit))
    # then add: , .width = 0.95, fill = "steelblue", alpha = 0.4
  ) +
  geom_point(data = mtcars, aes(y = mpg), colour = "grey40") +
  theme_ggdist()
#> Expected: one shaded 95% band around the fit line
```

<details>
<summary>Click to reveal solution</summary>

```r-static title="Single 95% band solution"
ggplot(aug, aes(x = wt)) +
  stat_lineribbon(
    aes(ydist = dist_student_t(df = df.residual(lm_fit), mu = .fitted, sigma = .se.fit)),
    .width = 0.95, fill = "steelblue", alpha = 0.4
  ) +
  geom_point(data = mtcars, aes(y = mpg), colour = "grey40") +
  theme_ggdist()
```

**Explanation:** Setting a single `.width` gives one band, and moving `fill` and `alpha` outside `aes()` makes them fixed styling rather than data-driven. This is the ggdist equivalent of the `geom_ribbon()` band from section four.

</details>

## Complete Example

Let's tie the whole workflow together with a chart you could drop into a report. We compare fuel economy across cylinder counts, split by transmission type, and show a 95% confidence interval for every group. This uses only browser-runnable code, so you can run the entire thing here.

First, summarise mpg by cylinder and transmission, building the confidence bounds with `qt()` exactly as before.

```r title="Summarise mpg by cylinder and transmission"
mpg_am <- mtcars |>
  mutate(transmission = if_else(am == 1, "Manual", "Automatic")) |>
  group_by(cyl, transmission) |>
  summarise(
    mean_mpg = mean(mpg),
    se_mpg   = sd(mpg) / sqrt(n()),
    n        = n(),
    .groups  = "drop"
  ) |>
  mutate(
    tcrit = qt(0.975, df = pmax(n - 1, 1)),
    lower = mean_mpg - tcrit * se_mpg,
    upper = mean_mpg + tcrit * se_mpg
  )

mpg_am
#> # A tibble: 6 × 8
#>     cyl transmission mean_mpg se_mpg     n tcrit lower upper
#>   <dbl> <chr>           <dbl>  <dbl> <int> <dbl> <dbl> <dbl>
#> 1     4 Automatic        22.9  0.839     3  4.30  19.3  26.5
#> 2     4 Manual           28.1  1.59      8  2.36  24.3  31.8
#> 3     6 Automatic        19.1  0.816     4  3.18  16.5  21.7
#> 4     6 Manual           20.6  0.433     3  4.30  18.7  22.4
#> 5     8 Automatic        15.0  0.801    12  2.20  13.3  16.8
#> 6     8 Manual           15.4  0.400     2 12.7   10.3  20.5
```

Look at the last row: only two 8-cylinder manual cars exist, so its critical value rises to 12.7 and its interval is very wide. That very wide interval is exactly the point: with only two cars we barely know that group's average, and a plain bar chart would have hidden how little data it rests on.

Now plot it. We colour by transmission and use `position_dodge()` so the two transmissions sit side by side within each cylinder group instead of overlapping.

```r title="Plot dodged confidence intervals by transmission"
ggplot(mpg_am, aes(x = factor(cyl), y = mean_mpg, colour = transmission)) +
  geom_pointrange(aes(ymin = lower, ymax = upper),
                  position = position_dodge(width = 0.4)) +
  labs(x = "Cylinders", y = "Mean MPG (95% CI)", colour = "Transmission") +
  theme_minimal()
```

The finished chart reads cleanly: manual cars average better mpg among 4-cylinder models, the gap shrinks for 6 cylinders, and the huge whisker on the 8-cylinder manual group warns you not to over-read its two-car average. Every claim a reader might make is now tempered by a visible interval.

## Practice Exercises

These combine several ideas from the guide. Try each before opening the solution.

### Exercise 1: Confidence intervals for gear groups

Summarise the rear axle ratio (`drat`) by the number of forward gears (`gear`), compute a 95% confidence interval per group with `qt()`, and print the result. Save it to `drat_ci`.

```r title="Exercise 1 starter"
# Hint: group_by(gear), summarise mean + se + n, then mutate lower/upper with qt(0.975, n - 1)

drat_ci <- mtcars |>
  group_by(gear)
  # complete the pipeline

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
drat_ci <- mtcars |>
  group_by(gear) |>
  summarise(mean_drat = mean(drat), se = sd(drat) / sqrt(n()), n = n(), .groups = "drop") |>
  mutate(lower = mean_drat - qt(0.975, n - 1) * se,
         upper = mean_drat + qt(0.975, n - 1) * se)
drat_ci
#> # A tibble: 3 × 6
#>    gear mean_drat     se     n lower upper
#>   <dbl>     <dbl>  <dbl> <int> <dbl> <dbl>
#> 1     3      3.13 0.0707    15  2.98  3.28
#> 2     4      4.04 0.0902    12  3.84  4.24
#> 3     5      3.92 0.174      5  3.43  4.40
```

**Explanation:** This is the section-three recipe applied to a new grouping variable. The 5-gear group has the fewest cars and the widest interval, a pattern you should now expect.

</details>

### Exercise 2: A confidence band for mpg versus horsepower

Fit a linear model of `mpg` on `hp`, build a 95% confidence band over a grid of horsepower values with `predict()`, and store the first few rows in `cap_band`. You do not have to plot it, just produce the banded data frame.

```r title="Exercise 2 starter"
# Hint: lm(mpg ~ hp), make a data.frame grid of hp, predict(interval = "confidence")

cap_model <- lm(mpg ~ hp, data = mtcars)
# build cap_grid and cap_band, then print head(cap_band, 3)

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
cap_model <- lm(mpg ~ hp, data = mtcars)
cap_grid  <- data.frame(hp = seq(min(mtcars$hp), max(mtcars$hp), length.out = 50))
cap_band  <- cbind(cap_grid,
  as.data.frame(predict(cap_model, newdata = cap_grid, interval = "confidence")))
head(cap_band, 3)
#>         hp      fit      lwr      upr
#> 1 52.00000 26.55099 24.14802 28.95396
#> 2 57.77551 26.15694 23.85013 28.46374
#> 3 63.55102 25.76288 23.54998 27.97579
```

**Explanation:** The workflow matches section four exactly, only the predictor changed from `wt` to `hp`. Feed `cap_band` into `geom_ribbon()` plus `geom_line()` and you have the finished band.

</details>

### Exercise 3: Compare distributions with a half-eye plot

Using ggdist, draw a half-eye plot of `mpg` split by transmission (`am`, where 0 is automatic and 1 is manual), showing 66% and 95% intervals. This one runs in your local R session.

```r-static title="Exercise 3 starter"
# Hint: aes(x = mpg, y = factor(am)) then stat_halfeye(.width = c(0.66, 0.95))

ggplot(mtcars, aes(x = mpg, y = factor(am))) +
  # add the stat_halfeye() layer here
  labs(x = "MPG", y = "Transmission (0 = auto, 1 = manual)") +
  theme_ggdist()

```

<details>
<summary>Click to reveal solution</summary>

```r-static title="Exercise 3 solution"
library(ggdist)

ggplot(mtcars, aes(x = mpg, y = factor(am))) +
  stat_halfeye(.width = c(0.66, 0.95)) +
  labs(x = "MPG", y = "Transmission (0 = auto, 1 = manual)") +
  theme_ggdist()
```

**Explanation:** Mapping `factor(am)` to `y` gives one half-eye per transmission. The manual group's density sits clearly to the right, showing manual cars tend to get better mileage, and the slab shape reveals how spread out each group is.

</details>

## Summary

Visualizing uncertainty is a single skill with a few interchangeable tools. Choose the tool by the shape of your data, then let the geom show the reader how much to trust each number.

![The uncertainty visualization toolkit: base ggplot2 geoms and ggdist stats.](screenshots/Visualizing-Uncertainty-in-R-toolkit-mindmap.webp)
*Figure 8: The full toolkit, from base ggplot2 error bars to ggdist slabintervals.*

| Your data | Best tool | What it shows |
|---|---|---|
| A few group means | `geom_pointrange()` or `geom_errorbar()` | Estimate plus one interval |
| Groups, computed on the fly | `stat_summary(fun.data = mean_se)` | Mean and SE without a summary table |
| A trend over continuous x | `geom_smooth()` or `geom_ribbon()` | A confidence band around the line |
| Groups, nested intervals | ggdist `stat_pointinterval()` / `stat_interval()` | Point plus 50/80/95 intervals |
| The full distribution shape | ggdist `stat_halfeye()` / `stat_gradientinterval()` | Density slab plus interval |
| Model trend, nested bands | ggdist `stat_lineribbon()` | Fit line with 50/80/95 bands |

Key takeaways to carry forward:

- **Always pair an estimate with an interval.** A number alone hides how precise it is.
- **Know your three quantities.** SD is the spread of data, SE is the precision of the mean, and a CI turns SE into a plain-language range.
- **A confidence band tracks the average; a prediction band tracks a single new point.** They differ a lot in width.
- **ggdist unifies it all** as distribution visualization, from point-intervals to half-eyes to lineribbons.

## FAQ

**Do I need the ggdist package, or can I do everything in base ggplot2?**

Base ggplot2 already covers a lot: `geom_errorbar()` and `geom_pointrange()` for group intervals, and `geom_smooth()` or `geom_ribbon()` for a single confidence band, all of which run anywhere. Reach for ggdist when you want nested intervals, the full distribution shape (half-eye or gradient plots), or model bands at several confidence levels from one line. The two are complementary, not an either-or choice.

**My error bars are much longer than someone else's on the same data. Why?**

Almost always because you are drawing different quantities. A standard deviation bar shows the spread of the raw values, while a standard error bar shows the precision of the mean and is therefore smaller. A confidence interval takes that standard error and widens it by a critical value. Label which one you plotted so readers can compare like with like.

**How do I put error bars on a bar chart instead of on points?**

Draw the bars with `geom_col()` and add `geom_errorbar()` on top, mapping `ymin` and `ymax` to your bounds. If the bars are grouped, give `geom_col()` and `geom_errorbar()` the same `position_dodge()` width so each error bar sits on its own bar. Many people prefer `geom_pointrange()` instead, because solid bars can hide the data behind them.

**Can I draw these uncertainty bands for a model other than lm(), such as a logistic regression?**

Yes. `predict()` and broom's `augment()` work for `glm()` and many other model types, so the recipes from sections four and seven carry over. For a `glm()` you usually predict on the link scale with standard errors, then transform the fitted value and its bounds back to the response scale before plotting.

**My ggdist plot code returns nothing or an error. What went wrong?**

The ggdist blocks run in your own R session, not in the page. Install the package once with `install.packages("ggdist")` (plus `"distributional"` for the lineribbon example), then load it with `library(ggdist)` before the plotting code. If a plot still does not appear, make sure the `ggplot()` call is the value printed at the console rather than assigned to a variable.

## References

1. Kay, M. - *ggdist: Visualizations of Distributions and Uncertainty*. Package documentation and reference. [Link](https://mjskay.github.io/ggdist/)
2. Kay, M. - *Frequentist uncertainty visualization* (ggdist vignette). [Link](https://mjskay.github.io/ggdist/articles/freq-uncertainty-vis.html)
3. Kay, M. - *Slab + interval stats and geoms* (ggdist vignette). [Link](https://mjskay.github.io/ggdist/articles/slabinterval.html)
4. Kay, M. - *Lineribbon stats and geoms* (ggdist vignette). [Link](https://mjskay.github.io/ggdist/articles/lineribbon.html)
5. ggplot2 documentation - `geom_ribbon()` and `geom_smooth()` reference. [Link](https://ggplot2.tidyverse.org/reference/geom_ribbon.html)
6. Robinson, D., Hayes, A., & Couch, S. - *broom: Convert Statistical Objects into Tidy Tibbles*. [Link](https://broom.tidymodels.org/)
7. O'Hara-Wild, M., et al. - *distributional: Vectorised Probability Distributions*. [Link](https://pkg.mitchelloharawild.com/distributional/)
8. Wilke, C. O. - *Fundamentals of Data Visualization*, Chapter 16: Visualizing uncertainty. O'Reilly (2019). [Link](https://clauswilke.com/dataviz/visualizing-uncertainty.html)
9. Wickham, H., & Grolemund, G. - *R for Data Science*, 2nd Edition. [Link](https://r4ds.hadley.nz/)

## Continue Learning

- [Error Bars in ggplot2: SD, SE or CI, Done Right](Error-Bars-in-R.html) - a closer look at which error bar to draw and how to compute each one correctly.
- [ggdist Package in R: Visualize Distributions and Uncertainty](ggdist-Package-in-R.html) - a focused tour of ggdist's slabinterval and dotsinterval families, including raincloud plots.
- [Communicating Uncertainty in R](Communicating-Uncertainty.html) - how to present intervals honestly so your charts inform rather than mislead.
