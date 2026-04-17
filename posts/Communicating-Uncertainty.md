---
title: "Communicating Uncertainty in R: Visualise Confidence Without Misleading Anyone"
slug: "Communicating-Uncertainty"
description: "Error bars and confidence bands can mislead as easily as they inform. Learn to choose the right uncertainty visualisation in R and words to match it honestly."
keywords: "communicating uncertainty in R, error bars ggplot2, confidence intervals visualization, geom_ribbon, quantile dotplots, SD vs SE vs CI, misleading charts, uncertainty visualization"
auto_link_terms: "communicating uncertainty|uncertainty visualization|error bars in R|confidence bands|quantile dotplots"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-04-14"
curriculum_id: "1.6.5"
post_type: "C"
sidebar_section: "Learn R"
sidebar_title: "Communicating Uncertainty"
sidebar_order: 54
difficulty: "Beginner"
---

# Communicating Uncertainty in R: Visualise Confidence Without Misleading Anyone

<p class="lead">A chart without uncertainty whispers a confident lie: "this is the exact value." Honest visualisation in R shows the wobble around every estimate so readers can judge how much to trust it.</p>

This guide walks through how to draw error bars, confidence bands, and quantile dotplots in ggplot2, when each one helps, when it misleads, and the words you should pair with them so your audience reads your chart the way you mean it.

## Why does showing uncertainty change what your chart says?

Two studies report the same 12% improvement. One sampled 30 patients; the other sampled 500. Without uncertainty bars, the two results look identical and the smaller study punches above its weight. Add 95% confidence intervals and the picture flips: one estimate is rock solid, the other could swing anywhere from negligible to large. Here is the same data drawn both ways so you can feel the difference.

```r title="Same 12% effect, very different certainty"
library(ggplot2)

study_results <- data.frame(
  study  = c("Study A (n=30)", "Study B (n=500)"),
  effect = c(12, 12),
  lower  = c(2, 9),
  upper  = c(22, 15)
)
study_results
#>             study effect lower upper
#> 1  Study A (n=30)     12     2    22
#> 2 Study B (n=500)     12     9    15

ggplot(study_results, aes(x = study, y = effect)) +
  geom_col(fill = "#4e79a7", width = 0.6) +
  geom_errorbar(aes(ymin = lower, ymax = upper), width = 0.2, linewidth = 0.8) +
  labs(title = "Same effect, different certainty",
       subtitle = "Bars show 95% confidence interval",
       y = "Estimated improvement (%)", x = NULL) +
  theme_minimal(base_size = 12)
```

Both studies report a 12% point estimate, but Study A's interval ranges from 2% to 22%, the true effect could be tiny or huge. Study B's interval is tight at 9% to 15%, so we can act on it with confidence. Strip the bars away and a reader sees two identical columns; add them, and the story is honest.

**Try it:** Add an error bar layer to a one-row data frame. The mean is 50, the lower bound is 45, the upper bound is 55. Plot a single bar with the interval drawn on top.

```r title="Exercise: add geomerrorbar to green bar"
# Try it
ex_means <- data.frame(group = "A", mean = 50, lower = 45, upper = 55)

ex_p1 <- ggplot(ex_means, aes(x = group, y = mean)) +
  geom_col(fill = "#59a14f", width = 0.4)
  # add a geom_errorbar layer here

ex_p1
#> Expected: a single green bar with a vertical interval from 45 to 55 on top.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Green-errorbar solution"
ex_p1 <- ggplot(ex_means, aes(x = group, y = mean)) +
  geom_col(fill = "#59a14f", width = 0.4) +
  geom_errorbar(aes(ymin = lower, ymax = upper), width = 0.15, linewidth = 0.8) +
  theme_minimal()
ex_p1
```

**Explanation:** `geom_errorbar()` needs `ymin` and `ymax` aesthetics. The `width` argument controls the horizontal cap, not the bar width.

</details>

## What do error bars actually mean, SD, SE, or CI?

The phrase "error bar" hides three very different things. Standard deviation tells you how much the raw data varies around its mean. Standard error tells you how precise that mean estimate is. A 95% confidence interval is the range you would expect the true population mean to live in if you repeated the experiment many times. Same data, three widths.

![What each error bar type measures](screenshots/Communicating-Uncertainty-error-bar-types.webp)
*Figure 1: What each error bar type measures, all from the same sample.*

```r title="Compute SD, SE, and 95% CI widths"
set.seed(1042)
sample_x <- rnorm(50, mean = 100, sd = 15)
n <- length(sample_x)
m <- mean(sample_x)
s <- sd(sample_x)
se <- s / sqrt(n)
ci95 <- 1.96 * se

data.frame(
  type  = c("SD", "SE", "95% CI"),
  width = c(2 * s, 2 * se, 2 * ci95)
)
#>     type    width
#> 1     SD 30.18450
#> 2     SE  4.26877
#> 3 95% CI  8.36679
```

The SD bar is roughly seven times wider than the CI bar. They answer different questions, so the choice changes the chart's meaning. SD bars say "look how spread out the data are." CI bars say "look how confident I am about the mean." Picking the wrong one is not a stylistic choice, it changes the claim.

```r title="Plot three interval widths side by side"
bar_widths <- data.frame(
  type  = factor(c("SD", "SE", "95% CI"), levels = c("SD", "SE", "95% CI")),
  mean  = m,
  lower = c(m - s, m - se, m - ci95),
  upper = c(m + s, m + se, m + ci95)
)

ggplot(bar_widths, aes(x = type, y = mean)) +
  geom_point(size = 3, colour = "#4e79a7") +
  geom_errorbar(aes(ymin = lower, ymax = upper), width = 0.15, linewidth = 0.8) +
  labs(title = "Same sample, three different 'error bars'",
       y = "Value", x = NULL) +
  theme_minimal(base_size = 12)
```

Notice that the dot, the sample mean, is in the same place in all three columns. Only the bar width changes. A reader who does not know which type you are showing has no way to interpret the chart.

[KEY INSIGHT]
**An error bar without a label is unfinished.** Always state in the caption or legend whether the bar is SD, SE, or a CI at a specific confidence level, otherwise you are inviting readers to guess, and most will guess wrong.

**Try it:** Compute a 99% confidence interval (use 2.576 instead of 1.96) for a fresh sample of 100 draws from N(50, 8). Save the half-width to `ex_ci99`.

```r title="Exercise: half-width of a 99% CI"
# Try it
set.seed(7)
ex_x <- rnorm(100, mean = 50, sd = 8)
# compute ex_ci99 (the half-width of the 99% CI for the mean)
ex_ci99 <- NA

ex_ci99
#> Expected: about 2.0 to 2.1
```

<details>
<summary>Click to reveal solution</summary>

```r title="99%-CI solution"
ex_ci99 <- 2.576 * sd(ex_x) / sqrt(length(ex_x))
ex_ci99
#> [1] 2.057
```

**Explanation:** The 99% interval is wider than the 95% interval because you trade certainty for precision. Same standard error, bigger multiplier.

</details>

## How do you add error bars and confidence bands in ggplot2?

ggplot2 gives you two core tools. `geom_errorbar()` draws discrete bars on top of categorical summaries, useful for comparing group means. `geom_smooth()` or `geom_ribbon()` draws a continuous band around a fitted line, useful for regressions or trends. Pick the one that matches the shape of your data.

```r title="Species means with 95% CI bars"
iris_summary <- aggregate(Sepal.Length ~ Species, data = iris,
                          FUN = function(z) c(m = mean(z),
                                              se = sd(z) / sqrt(length(z))))
iris_summary <- data.frame(Species = iris_summary$Species,
                           mean = iris_summary$Sepal.Length[, "m"],
                           se   = iris_summary$Sepal.Length[, "se"])
iris_summary$lower <- iris_summary$mean - 1.96 * iris_summary$se
iris_summary$upper <- iris_summary$mean + 1.96 * iris_summary$se
iris_summary
#>      Species  mean         se    lower    upper
#> 1     setosa 5.006 0.04984957 4.908295 5.103705
#> 2 versicolor 5.936 0.07321149 5.792506 6.079494
#> 3  virginica 6.588 0.08992695 6.411743 6.764257

ggplot(iris_summary, aes(x = Species, y = mean, fill = Species)) +
  geom_col(width = 0.6) +
  geom_errorbar(aes(ymin = lower, ymax = upper), width = 0.15, linewidth = 0.8) +
  labs(title = "Mean sepal length by species (95% CI)",
       y = "Sepal length (cm)", x = NULL) +
  scale_fill_brewer(palette = "Set2") +
  theme_minimal(base_size = 12) +
  theme(legend.position = "none")
```

Each species gets one column (the mean) and one vertical interval (the 95% CI on that mean). Setosa and virginica are clearly different, their intervals do not even come close. Versicolor sits between them. Without the bars you would still see the ordering, but you would have no idea how confident the differences are.

For a continuous predictor, switch to `geom_smooth()`. The grey ribbon is the 95% confidence interval around the fitted regression line, wider where the data are sparse, narrower where the data are dense.

```r title="MPG vs weight with confidence ribbon"
ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point(colour = "#4e79a7", size = 2) +
  geom_smooth(method = "lm", level = 0.95,
              colour = "#e15759", fill = "#e15759", alpha = 0.2) +
  labs(title = "MPG vs weight with 95% confidence band",
       subtitle = "Ribbon shows 95% CI around the fitted line",
       x = "Weight (1000 lbs)", y = "MPG") +
  theme_minimal(base_size = 12)
```

The ribbon balloons at the extremes of weight because we have fewer cars there, the model is less sure about the slope where data are thin. That balloon is information, not decoration. Readers who ignore the band see a single confident line; readers who read it see where the model knows what it is doing and where it is guessing.

[TIP]
**Always say what the ribbon is.** A grey band is meaningless without a caption stating the level (95%, 99%, 50%) and what it represents (CI on the mean, prediction interval, bootstrap interval). The default `geom_smooth` ribbon is a 95% CI on the fitted mean, not a prediction interval for new points.

**Try it:** Repeat the mtcars regression plot with a 99% confidence band instead of 95%.

```r title="Exercise: switch ribbon to 99%"
# Try it: change the smooth's confidence level to 0.99
ex_p_smooth <- ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point(colour = "#4e79a7") +
  geom_smooth(method = "lm")  # change the level here

ex_p_smooth
#> Expected: a wider ribbon than the 95% version
```

<details>
<summary>Click to reveal solution</summary>

```r title="99%-ribbon solution"
ex_p_smooth <- ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point(colour = "#4e79a7") +
  geom_smooth(method = "lm", level = 0.99,
              colour = "#e15759", fill = "#e15759", alpha = 0.2) +
  theme_minimal()
ex_p_smooth
```

**Explanation:** `level = 0.99` widens the ribbon because a 99% interval is more conservative than 95%. Same data, more cautious claim.

</details>

## When do error bars start lying?

Error bars are not magic. The same chart with a 95% CI bar can still mislead if the y-axis is truncated, if the underlying distribution is hidden, or if the reader is invited to compare overlap in ways that do not match the statistics. These are the three traps to watch for.

![Honest vs misleading uncertainty](screenshots/Communicating-Uncertainty-honest-vs-misleading.webp)
*Figure 2: Three habits that flip a chart from honest to misleading.*

```r title="Misleading vs honest y-axis"
days_df <- data.frame(
  day   = factor(c("Mon", "Tue", "Wed", "Thu", "Fri"),
                 levels = c("Mon", "Tue", "Wed", "Thu", "Fri")),
  value = c(98, 100, 99, 101, 100)
)

p_truncated <- ggplot(days_df, aes(x = day, y = value)) +
  geom_col(fill = "#e15759") +
  coord_cartesian(ylim = c(96, 102)) +
  labs(title = "Misleading: truncated y-axis",
       subtitle = "Differences look huge", y = "Value", x = NULL) +
  theme_minimal(base_size = 11)

p_full <- ggplot(days_df, aes(x = day, y = value)) +
  geom_col(fill = "#4e79a7") +
  coord_cartesian(ylim = c(0, 120)) +
  labs(title = "Honest: full y-axis",
       subtitle = "Differences are tiny", y = "Value", x = NULL) +
  theme_minimal(base_size = 11)

p_truncated
p_full
```

The numbers 98 to 101 are nearly identical. On the truncated chart the Friday bar looks twice the height of Monday. On the honest chart you can barely tell them apart. Both charts are technically accurate; only one is honest. Run the second `print(p_full)` to compare.

The second trap is hidden distribution shape. A bar with a CI tells you where the mean is, but a mean of 50 can come from data clustered at 50 or from data split between 0 and 100. Showing the raw points alongside makes this visible.

```r title="Bimodal distribution hidden by error bar"
set.seed(2026)
unimodal_x <- rnorm(60, mean = 50, sd = 5)
bimodal_x  <- c(rnorm(30, mean = 30, sd = 3),
                rnorm(30, mean = 70, sd = 3))

dist_df <- data.frame(
  value   = c(unimodal_x, bimodal_x),
  pattern = rep(c("Unimodal", "Bimodal"), each = 60)
)

ggplot(dist_df, aes(x = pattern, y = value)) +
  geom_jitter(width = 0.15, alpha = 0.6, colour = "#4e79a7") +
  stat_summary(fun = mean, geom = "point", size = 3, colour = "#e15759") +
  stat_summary(fun.data = mean_cl_normal, geom = "errorbar",
               width = 0.15, colour = "#e15759") +
  labs(title = "Same mean, very different stories",
       subtitle = "Bar charts hide what dot plots reveal",
       y = "Value", x = NULL) +
  theme_minimal(base_size = 12)
```

Both groups share roughly the same mean, but one cluster is tightly packed and the other is split into two camps. A bar chart with error bars would have shown you a single column with a moderate CI for each, and you would never have known the bimodal group was hiding two populations. Always sanity-check by plotting raw points when sample size allows it.

[WARNING]
**Overlapping CIs do not mean "no significant difference".** Two 95% intervals can overlap and still be significantly different at p < 0.05, and non-overlap is not the same as significance. If you need a hypothesis test, run one, do not eyeball overlap.

**Try it:** A colleague shows you a bar chart of monthly revenue where the y-axis starts at $98,000 and ends at $102,000. The bars look dramatically different. Should you trust the visual impression? Print "honest" or "misleading" with one sentence of reasoning.

```r title="Exercise: label the misleading chart"
# Try it
ex_check <- ""  # set to "honest" or "misleading"
ex_check
#> Expected: "misleading" with a sentence about the truncated y-axis
```

<details>
<summary>Click to reveal solution</summary>

```r title="Misleading-label solution"
ex_check <- "misleading: the y-axis spans only $4k of a $100k base, so a 1% wobble looks like a giant swing"
ex_check
```

**Explanation:** Truncated axes exaggerate small differences. The fix is to start at zero or label an axis break and show the percent change instead of raw dollars.

</details>

## What are quantile dotplots, gradient intervals, and honest captions?

Even a perfectly drawn 95% CI is hard for non-statisticians to interpret. Research on how people read uncertainty shows that a row of discrete dots, each representing a chunk of probability, is more accurate for laypeople than a continuous ribbon. This is called frequency framing: humans count better than they integrate. Below is a hand-built quantile dotplot in ggplot2 with no extra packages.

```r title="Quantile dotplot of 20 probability slices"
set.seed(99)
qd_sample <- rnorm(5000, mean = 100, sd = 12)

n_dots <- 20
probs  <- (seq_len(n_dots) - 0.5) / n_dots
qd_df  <- data.frame(
  estimate = quantile(qd_sample, probs = probs),
  row      = 1
)
head(qd_df, 4)
#>      estimate row
#> 2.5%  76.5921   1
#> 7.5%  82.6038   1
#> 12.5% 86.5447   1
#> 17.5% 89.4810   1

ggplot(qd_df, aes(x = estimate)) +
  geom_dotplot(binwidth = 1.7, fill = "#4e79a7", colour = "white",
               stackratio = 1.05, dotsize = 1) +
  scale_y_continuous(NULL, breaks = NULL) +
  labs(title = "Quantile dotplot: 20 equally-likely outcomes",
       subtitle = "Each dot represents a 5% slice of probability",
       x = "Estimated value") +
  theme_minimal(base_size = 12)
```

The plot answers questions a CI bar struggles with. "How likely is the value to be below 85?" Count the dots, about three out of twenty, so roughly 15%. "What is the most likely region?" The fattest stack. Readers who would freeze at the words "95% confidence interval" can read this chart immediately because it is just counting.

[NOTE]
**For richer uncertainty geoms, install ggdist locally.** Packages like `ggdist` add `stat_dotsinterval()`, `stat_lineribbon()`, and gradient intervals that go far beyond what base ggplot2 ships with. They run in your local R session, this tutorial sticks to base ggplot2 so every block is reproducible inline.

The chart is only half of the message. Whatever words you wrap around it shape how readers interpret it. A neutral phrasing like "the data are consistent with an effect between 2% and 22%" is honest. A confident phrasing like "the treatment improves outcomes by 12%" is not, even if the chart is correct.

| Avoid | Use instead |
|---|---|
| "shows", "proves", "demonstrates" | "estimates", "is consistent with", "suggests" |
| "the effect is 12%" | "the estimated effect is 12% (95% CI: 2% to 22%)" |
| "significant difference" | "the 95% CIs do not overlap; a t-test gives p = 0.02" |
| "no effect" | "the data are consistent with effects between -3% and +5%" |

[TIP]
**Treat the caption as part of the chart.** Always state the sample size, the type of interval (SD, SE, CI), and the confidence level. A reader who skips the body should still know what they are looking at from the caption alone.

**Try it:** Rewrite this misleading caption to be honest: *"Treatment X works, patients improved by 8 points."*

```r title="Exercise: rewrite as an honest caption"
# Try it
ex_caption <- ""  # rewrite as an honest one-sentence caption
ex_caption
#> Expected: a sentence with sample size, point estimate, and a CI
```

<details>
<summary>Click to reveal solution</summary>

```r title="Honest-caption solution"
ex_caption <- "Patients on Treatment X improved by an estimated 8 points (n = 60, 95% CI: 2 to 14)."
ex_caption
```

**Explanation:** The honest version names the sample size, replaces "works" with "improved by an estimated", and surfaces the interval so the reader knows how loose or tight the estimate is.

</details>

## Practice Exercises

### Exercise 1: Four groups with honest captions

You have four group means and standard errors: A=25/2.1, B=30/3.5, C=28/1.8, D=33/2.7 (all n=40). Build a ggplot bar chart with 95% CI error bars and add a subtitle stating sample size and interval type.

```r title="Exercise: four-group 95% CI bar chart"
# Exercise 1
# Hint: build a data frame with group, mean, se, then compute lower/upper

# your code here

```

<details>
<summary>Click to reveal solution</summary>

```r title="Four-group-CI solution"
my_groups <- data.frame(
  group = c("A", "B", "C", "D"),
  mean  = c(25, 30, 28, 33),
  se    = c(2.1, 3.5, 1.8, 2.7)
)
my_groups$lower <- my_groups$mean - 1.96 * my_groups$se
my_groups$upper <- my_groups$mean + 1.96 * my_groups$se

my_plot1 <- ggplot(my_groups, aes(x = group, y = mean, fill = group)) +
  geom_col(width = 0.6) +
  geom_errorbar(aes(ymin = lower, ymax = upper), width = 0.15, linewidth = 0.8) +
  labs(title = "Score by group",
       subtitle = "n = 40 per group; bars show 95% CI",
       y = "Score", x = NULL) +
  scale_fill_brewer(palette = "Set2") +
  theme_minimal(base_size = 12) +
  theme(legend.position = "none")
my_plot1
```

**Explanation:** Computing `lower` and `upper` from the SE keeps the plotting code readable. The subtitle is doing real work, it says how big the groups are and what the bars mean.

</details>

### Exercise 2: Build a quantile dotplot from scratch

Draw 1000 samples from N(20, 4). Build a 20-dot quantile dotplot and add a vertical line at the sample mean.

```r title="Exercise: quantile dotplot from 1000 draws"
# Exercise 2
# Hint: probs <- (seq_len(20) - 0.5) / 20; use quantile() then geom_dotplot()

# your code here

```

<details>
<summary>Click to reveal solution</summary>

```r title="Quantile-dotplot solution"
set.seed(31)
my_sample <- rnorm(1000, mean = 20, sd = 4)
my_qdf <- data.frame(
  estimate = quantile(my_sample, probs = (seq_len(20) - 0.5) / 20)
)

my_plot2 <- ggplot(my_qdf, aes(x = estimate)) +
  geom_dotplot(binwidth = 0.55, fill = "#4e79a7", colour = "white",
               stackratio = 1.05, dotsize = 1) +
  geom_vline(xintercept = mean(my_sample), colour = "#e15759",
             linewidth = 0.8, linetype = "dashed") +
  scale_y_continuous(NULL, breaks = NULL) +
  labs(title = "Quantile dotplot of N(20, 4)",
       subtitle = "Each dot is a 5% slice of the distribution",
       x = "Value") +
  theme_minimal(base_size = 12)
my_plot2
```

**Explanation:** The trick is computing 20 quantiles at the midpoints of equal probability slices. `geom_dotplot()` then stacks them with `stackratio` controlling vertical spacing.

</details>

### Exercise 3: Two-study side-by-side comparison

Study A has n=30, mean=12, sd=10. Study B has n=500, mean=12, sd=10. Compute the 95% CI for each mean and draw a ggplot showing both as dot + interval.

```r title="Exercise: compare two-study confidence"
# Exercise 3
# Hint: SE = sd / sqrt(n); CI = mean +/- 1.96 * SE

# your code here

```

<details>
<summary>Click to reveal solution</summary>

```r title="Two-study solution"
my_studies <- data.frame(
  study = c("Study A (n=30)", "Study B (n=500)"),
  mean  = c(12, 12),
  sd    = c(10, 10),
  n     = c(30, 500)
)
my_studies$se    <- my_studies$sd / sqrt(my_studies$n)
my_studies$lower <- my_studies$mean - 1.96 * my_studies$se
my_studies$upper <- my_studies$mean + 1.96 * my_studies$se

my_plot3 <- ggplot(my_studies, aes(x = study, y = mean)) +
  geom_point(size = 4, colour = "#4e79a7") +
  geom_errorbar(aes(ymin = lower, ymax = upper),
                width = 0.15, linewidth = 0.9, colour = "#4e79a7") +
  labs(title = "Same point estimate, very different precision",
       subtitle = "Bars show 95% CI on the mean",
       y = "Estimated effect (%)", x = NULL) +
  theme_minimal(base_size = 12)
my_plot3
```

**Explanation:** Larger samples shrink the standard error by the square root of n, so Study B's interval is roughly four times tighter than Study A's even though the point estimate is identical.

</details>

## Complete Example

Here is the whole pipeline end to end on the iris dataset: compute the mean and 95% CI of sepal length per species, draw a dot + interval plot, and write an honest caption.

```r title="End-to-end iris CI plot"
iris_ci <- aggregate(Sepal.Length ~ Species, data = iris,
                     FUN = function(z) {
                       n  <- length(z)
                       m  <- mean(z)
                       se <- sd(z) / sqrt(n)
                       c(mean = m, lower = m - 1.96 * se, upper = m + 1.96 * se,
                         n = n)
                     })
iris_ci <- data.frame(Species = iris_ci$Species,
                      mean  = iris_ci$Sepal.Length[, "mean"],
                      lower = iris_ci$Sepal.Length[, "lower"],
                      upper = iris_ci$Sepal.Length[, "upper"],
                      n     = iris_ci$Sepal.Length[, "n"])
iris_ci
#>      Species  mean    lower    upper  n
#> 1     setosa 5.006 4.908295 5.103705 50
#> 2 versicolor 5.936 5.792506 6.079494 50
#> 3  virginica 6.588 6.411743 6.764257 50

p_iris_ci <- ggplot(iris_ci, aes(x = Species, y = mean, colour = Species)) +
  geom_point(size = 4) +
  geom_errorbar(aes(ymin = lower, ymax = upper),
                width = 0.12, linewidth = 0.9) +
  labs(title = "Sepal length differs across iris species",
       subtitle = "Estimates with 95% CI; n = 50 per species",
       caption = "Source: Fisher's iris data. Bars show 95% CI on the mean.",
       y = "Sepal length (cm)", x = NULL) +
  scale_colour_brewer(palette = "Set2") +
  theme_minimal(base_size = 12) +
  theme(legend.position = "none")
p_iris_ci
```

The plot earns its honesty in three places: the subtitle states the sample size and interval type, the caption restates them for anyone who skipped the subtitle, and the dot + interval format keeps the focus on precision instead of bar volume. A reader sees the order of species, the gap between them, and how confident each estimate is, all in one glance.

## Summary

![Choosing an uncertainty visualisation](screenshots/Communicating-Uncertainty-decision-flow.webp)
*Figure 3: A short decision tree for picking an uncertainty visualisation.*

- **Show the wobble, not just the point.** Every chart that claims an estimate should also show how much that estimate could move.
- **SD, SE, and CI are different.** Pick deliberately and label what you picked.
- **Truncated axes exaggerate.** Either start at zero or mark the break clearly.
- **Bars hide distributions.** Plot raw points or use a quantile dotplot when the shape might matter.
- **Captions are part of the chart.** State the sample size, the interval type, and the level. Replace "shows" and "proves" with "estimates" and "is consistent with".
- **Overlap is not significance.** If you need a test, run one, do not eyeball intervals.

## References

1. Wilke, C., *Fundamentals of Data Visualization*, Chapter 16: Visualizing uncertainty. [Link](https://clauswilke.com/dataviz/visualizing-uncertainty.html)
2. Cookbook-R, Plotting means and error bars (ggplot2). [Link](http://www.cookbook-r.com/Graphs/Plotting_means_and_error_bars_(ggplot2)/)
3. Cumming, G. & Finch, S., Inference by eye: confidence intervals and how to read pictures of data. *American Psychologist*, 2005. [Link](https://www.apa.org/pubs/journals/releases/amp-60-2-170.pdf)
4. ggplot2 reference, `geom_errorbar`, `geom_ribbon`, `geom_smooth`. [Link](https://ggplot2.tidyverse.org/reference/geom_linerange.html)
5. Kay, M., ggdist: Visualizations of Distributions and Uncertainty. [Link](https://mjskay.github.io/ggdist/)
6. Hofman, J., Goldstein, D. & Hullman, J., How visualizing inferential uncertainty can mislead readers about treatment effects. *CHI 2020*. [Link](https://dl.acm.org/doi/10.1145/3313831.3376454)
7. R Core Team, `t.test()` reference. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/t.test.html)

## Continue Learning

- [Bias in Data and Models](Bias-in-Data-and-Models.html), Sources of error your error bars do not show.
- [R and the Reproducibility Crisis](Reproducibility-Crisis.html), Why honest reporting matters at the publication level.
- [Data Ethics for R Programmers](Data-Ethics-for-R-Programmers.html), Questions to ask before you analyse.
