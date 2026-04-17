---
title: "Correlation in R: Pearson vs Spearman vs Kendall, Compute, Test, and Visualise"
slug: "Correlation-Analysis-in-R"
description: "Choose the right correlation for your data in R. Pearson for linear, Spearman for ranked, Kendall for small samples, with significance tests and corrplot."
keywords: "correlation in R, Pearson correlation R, Spearman correlation R, Kendall tau R, cor.test R, correlation matrix R, corrplot, correlation coefficient, cor function R, correlation significance test"
auto_link_terms: "correlation in R|Pearson correlation|Spearman correlation|Kendall correlation|cor.test()|correlation matrix|corrplot()|correlation coefficient"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-16"
curriculum_id: "1.4.5"
post_type: "C"
sidebar_section: "Visualization"
sidebar_title: "Correlation Analysis"
sidebar_order: 44
difficulty: "Intermediate"
---

# Correlation in R: Pearson vs Spearman vs Kendall, Compute, Test, and Visualise

<p class="lead">Correlation measures the strength and direction of the relationship between two variables, a number between −1 and +1. R gives you three methods: Pearson for linear relationships, Spearman for monotonic (ranked) data, and Kendall's tau for small or tied samples.</p>

## How do you compute a correlation in R?

How strong is the link between a car's weight and its fuel economy? That's the question correlation answers, it gives you a single number that captures both the direction and strength of a relationship. Let's compute one right now with `cor()` and see the result.

```r title="Weight versus fuel economy correlation"
# Correlation between weight and fuel economy
r_value <- cor(mtcars$wt, mtcars$mpg)
r_value
#> [1] -0.8676594
```

The result is −0.87, which tells you two things. The negative sign means heavier cars get *worse* fuel economy (mpg goes down as weight goes up). The magnitude, close to 1, tells you this is a strong relationship. In other words, weight is one of the best predictors of fuel economy in this dataset.

By default, `cor()` computes Pearson correlation. You can switch to the other two methods by passing the `method` argument. Let's see all three on the same data.

```r title="Compare pearson spearman and kendall"
# Compare all three methods
pearson_r  <- cor(mtcars$wt, mtcars$mpg, method = "pearson")
spearman_r <- cor(mtcars$wt, mtcars$mpg, method = "spearman")
kendall_r  <- cor(mtcars$wt, mtcars$mpg, method = "kendall")

cat("Pearson: ", round(pearson_r, 3),
    "\nSpearman:", round(spearman_r, 3),
    "\nKendall: ", round(kendall_r, 3))
#> Pearson:  -0.868
#> Spearman: -0.886
#> Kendall:  -0.734
```

All three agree on the direction (negative) and general strength (strong). Pearson and Spearman are close because the relationship is roughly linear. Kendall's value is smaller, that's expected and normal. We'll explain why in the Kendall section below.

Here's a quick reference for interpreting the magnitude of any correlation coefficient.

![Correlation strength scale](screenshots/Correlation-Analysis-in-R-strength-scale.webp)

*Figure 1: Interpreting correlation strength: from perfect negative to perfect positive.*

These thresholds come from Cohen's (1988) conventions for behavioural sciences. In some fields, physics, finance, genomics, the standards differ. Use them as a starting point, not a rigid rule.

[KEY INSIGHT]
**A correlation of 0 does not mean "no relationship."** It means no *linear* relationship. A perfect U-shaped curve gives a Pearson correlation of zero. Always plot your data before concluding there's nothing going on.

**Try it:** Compute the correlation between `mtcars$hp` (horsepower) and `mtcars$qsec` (quarter-mile time). Before running the code, predict: will it be positive or negative?

```r title="Exercise: correlate horsepower and quarter mile"
# Try it: correlate hp and qsec
ex_r <- cor(mtcars$hp, mtcars$qsec)
ex_r
#> Expected: a negative value (more power = faster = lower qsec)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Horsepower and quarter mile solution"
ex_r <- cor(mtcars$hp, mtcars$qsec)
ex_r
#> [1] -0.7082234
```

**Explanation:** The correlation is −0.71 (strong negative). More horsepower means a *lower* quarter-mile time, the car accelerates faster.

</details>

## What is Pearson correlation and when should you use it?

Pearson correlation measures how closely two variables follow a *straight-line* relationship. Think of it as asking: "If I draw the best-fitting line through these points, how tightly do the points cluster around it?"

The formula captures this intuition. For two variables $x$ and $y$ with $n$ observations:

$$r = \frac{\sum_{i=1}^{n}(x_i - \bar{x})(y_i - \bar{y})}{\sqrt{\sum_{i=1}^{n}(x_i - \bar{x})^2 \cdot \sum_{i=1}^{n}(y_i - \bar{y})^2}}$$

Where:
- $r$ = Pearson correlation coefficient (ranges from −1 to +1)
- $x_i, y_i$ = individual observations
- $\bar{x}, \bar{y}$ = means of each variable
- The numerator measures how much $x$ and $y$ move together
- The denominator standardises the result to the −1 to +1 scale

*If you're not interested in the math, skip ahead, the practical code above is all you need.*

Pearson works well when three assumptions hold: (1) both variables are continuous, (2) the relationship is linear, and (3) both variables are approximately normally distributed. Let's check these visually and statistically.

```r title="Scatter plot with linear fit"
# Scatter plot: is the relationship linear?
plot(mtcars$wt, mtcars$mpg,
     xlab = "Weight (1000 lbs)", ylab = "Miles per Gallon",
     main = "Weight vs Fuel Economy",
     pch = 19, col = "steelblue")
abline(lm(mpg ~ wt, data = mtcars), col = "red", lwd = 2)
```

The scatter plot shows points clustering around a straight line, good evidence that Pearson is appropriate here. The red line is the linear fit, and the points stick close to it.

Now let's check normality with the Shapiro-Wilk test. A p-value above 0.05 means we can't reject normality.

```r title="Shapiro wilk normality check"
# Normality check
shapiro.test(mtcars$wt)
#> 	Shapiro-Wilk normality test
#> data:  mtcars$wt
#> W = 0.94326, p-value = 0.09265

shapiro.test(mtcars$mpg)
#> 	Shapiro-Wilk normality test
#> data:  mtcars$mpg
#> W = 0.94756, p-value = 0.1229
```

Both p-values are above 0.05, so we can't reject normality for either variable. Combined with the linear scatter plot, Pearson is a solid choice here.

[WARNING]
**Pearson is sensitive to outliers.** A single extreme point can inflate or deflate the coefficient dramatically. Always visualise your data with a scatter plot before trusting a Pearson value.

**Try it:** Check whether `airquality$Ozone` and `airquality$Temp` pass the normality assumption. Use `shapiro.test()` on each. Remember to handle missing values with `na.rm = TRUE` when subsetting.

```r title="Exercise: normality check for airquality"
# Try it: normality check for airquality
# Hint: airquality has NAs — filter them out first
ex_ozone <- na.omit(airquality$Ozone)
shapiro.test(ex_ozone)
#> Expected: p-value < 0.05 (Ozone is right-skewed, fails normality)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Airquality normality solution"
ex_ozone <- na.omit(airquality$Ozone)
ex_temp <- na.omit(airquality$Temp)

shapiro.test(ex_ozone)
#> 	Shapiro-Wilk normality test
#> data:  ex_ozone
#> W = 0.87868, p-value = 2.793e-08

shapiro.test(ex_temp)
#> 	Shapiro-Wilk normality test
#> data:  ex_temp
#> W = 0.98537, p-value = 0.2329
```

**Explanation:** Ozone fails normality (p < 0.001) because it's right-skewed. Temperature passes (p = 0.23). Since one variable violates the normality assumption, Spearman would be more appropriate for this pair.

</details>

## When should you use Spearman's rank correlation?

Spearman's rank correlation works by converting your raw data to ranks, then computing Pearson correlation on those ranks. This simple trick makes it robust to outliers, skewed distributions, and non-linear monotonic relationships.

A monotonic relationship means "as one variable goes up, the other consistently goes up (or consistently goes down)", but the change doesn't have to follow a straight line. An exponential curve is monotonic but not linear. Spearman catches these; Pearson doesn't.

Let's see the difference with a concrete example. We'll create data that follows an exponential curve, clearly monotonic, but not linear.

```r title="Exponential growth pearson versus spearman"
# Monotonic but non-linear: exponential growth
set.seed(21)
x_exp <- 1:30
y_exp <- exp(x_exp / 10) + rnorm(30, sd = 0.3)

cat("Pearson: ", round(cor(x_exp, y_exp, method = "pearson"), 3),
    "\nSpearman:", round(cor(x_exp, y_exp, method = "spearman"), 3))
#> Pearson:  0.889
#> Spearman: 0.993
```

Spearman (0.993) is much closer to 1 than Pearson (0.889) because the relationship is perfectly monotonic, every increase in `x` produces an increase in `y`, even though the curve bends upward. Pearson underestimates the strength because it's looking for a straight line that isn't there.

Spearman also works naturally with ordinal data (ranks, survey ratings, Likert scales) where the raw numbers are just labels for order.

```r title="Ordinal ratings and satisfaction"
# Ordinal data: customer satisfaction vs product rating
set.seed(33)
ratings <- sample(1:5, 20, replace = TRUE)
satisfaction <- ratings + sample(c(-1, 0, 0, 1), 20, replace = TRUE)
satisfaction <- pmin(pmax(satisfaction, 1), 5)  # clamp to 1-5

cor(ratings, satisfaction, method = "spearman")
#> [1] 0.7013561
```

A Spearman correlation of 0.70 on ordinal data tells us that higher product ratings are strongly associated with higher customer satisfaction scores. Pearson would give a similar number here, but Spearman is the theoretically correct choice because the data is ordinal, not truly continuous.

[TIP]
**When in doubt between Pearson and Spearman, compute both.** If they agree, the relationship is likely linear. If Spearman is notably higher, the relationship is monotonic but not linear, Spearman is the better summary.

**Try it:** The `iris` dataset has numeric measurements. Compute both Pearson and Spearman correlation between `Sepal.Length` and `Petal.Length`. Which one is stronger?

```r title="Exercise: pearson versus spearman on iris"
# Try it: Pearson vs Spearman on iris
ex_pearson <- cor(iris$Sepal.Length, iris$Petal.Length, method = "pearson")
ex_spearman <- cor(iris$Sepal.Length, iris$Petal.Length, method = "spearman")
cat("Pearson:", ex_pearson, "\nSpearman:", ex_spearman)
#> Expected: both strong positive, Spearman slightly higher
```

<details>
<summary>Click to reveal solution</summary>

```r title="Iris pearson spearman solution"
ex_pearson <- cor(iris$Sepal.Length, iris$Petal.Length, method = "pearson")
ex_spearman <- cor(iris$Sepal.Length, iris$Petal.Length, method = "spearman")
cat("Pearson: ", round(ex_pearson, 4),
    "\nSpearman:", round(ex_spearman, 4))
#> Pearson:  0.8718
#> Spearman: 0.8819
```

**Explanation:** Both are strong (~0.87-0.88). Spearman is slightly higher, suggesting a mild non-linearity driven by the three species forming clusters along the relationship.

</details>

## When is Kendall's tau the better choice?

Kendall's tau takes a fundamentally different approach. Instead of working with the actual values or even their ranks, it looks at every possible *pair* of observations and asks: "Do these two points agree on the direction?"

For a pair of points $(x_1, y_1)$ and $(x_2, y_2)$:
- **Concordant:** both variables move in the same direction ($x_1 < x_2$ and $y_1 < y_2$, or both greater)
- **Discordant:** the variables move in opposite directions

$$\tau = \frac{\text{concordant pairs} - \text{discordant pairs}}{\text{total pairs}}$$

Where:
- $\tau$ = Kendall's tau
- Total pairs = $\frac{n(n-1)}{2}$

This pair-counting approach gives Kendall two practical advantages. First, it's more reliable than Spearman with **small samples** (n < 30), because each pair provides an independent piece of evidence. Second, it handles **tied values** more gracefully, important with ordinal or discrete data.

```r title="Small sample all three methods"
# Small sample: compare all three
set.seed(55)
small_x <- c(2, 5, 3, 8, 7, 1, 9, 4, 6, 10)
small_y <- c(3, 6, 2, 9, 8, 1, 10, 5, 4, 7)

cat("Pearson: ", round(cor(small_x, small_y, method = "pearson"), 3),
    "\nSpearman:", round(cor(small_x, small_y, method = "spearman"), 3),
    "\nKendall: ", round(cor(small_x, small_y, method = "kendall"), 3))
#> Pearson:  0.939
#> Spearman: 0.927
#> Kendall:  0.822
```

Notice that Kendall's tau (0.822) is noticeably lower than Spearman's rho (0.927). This is *not* a weakness, Kendall and Spearman use different scales. Kendall's values are naturally more conservative because it counts individual pair agreements rather than measuring rank deviation. Think of it like comparing Celsius and Fahrenheit, different scales, same underlying temperature.

![Decision flowchart: which correlation method?](screenshots/Correlation-Analysis-in-R-method-decision.webp)

*Figure 2: Decision flowchart: which correlation method fits your data?*

[NOTE]
**Kendall's tau values are typically lower than Spearman's rho for the same data.** Don't compare them directly, they measure slightly different things. A tau of 0.7 and a rho of 0.85 can represent the same underlying relationship strength.

**Try it:** Create a small dataset of 8 paired observations where some values are tied. Compute both Kendall's tau and Spearman's rho. Do the ties change the relative gap between them?

```r title="Exercise: kendall and spearman with ties"
# Try it: ties in small data
ex_x <- c(1, 2, 2, 3, 4, 4, 5, 6)
ex_y <- c(2, 3, 4, 3, 5, 5, 6, 7)
# your code here: compute Kendall and Spearman
#> Expected: both positive, Kendall lower than Spearman
```

<details>
<summary>Click to reveal solution</summary>

```r title="Kendall spearman with ties solution"
ex_x <- c(1, 2, 2, 3, 4, 4, 5, 6)
ex_y <- c(2, 3, 4, 3, 5, 5, 6, 7)

cat("Spearman:", round(cor(ex_x, ex_y, method = "spearman"), 4),
    "\nKendall: ", round(cor(ex_x, ex_y, method = "kendall"), 4))
#> Spearman: 0.9272
#> Kendall:  0.8528
```

**Explanation:** Both show strong positive correlation. Kendall handles the tied values (the repeated 2s and 4s in x, repeated 5s in y) using the tau-b correction, which adjusts the denominator for ties.

</details>

## How do you test if a correlation is statistically significant?

A correlation coefficient by itself doesn't tell you whether the relationship is real or just sampling noise. Is r = −0.87 genuinely strong, or could random data produce a number that large? That's where `cor.test()` comes in, it gives you a p-value and confidence interval alongside the correlation.

```r title="Significance test with cor dot test"
# Full significance test
test_result <- cor.test(mtcars$wt, mtcars$mpg, method = "pearson")
test_result
#> 	Pearson's product-moment correlation
#>
#> data:  mtcars$wt and mtcars$mpg
#> t = -9.559, df = 30, p-value = 1.294e-10
#> alternative hypothesis: true correlation is not equal to 0
#> 95 percent confidence interval:
#>  -0.9338264 -0.7440872
#> sample estimates:
#>        cor
#> -0.8676594
```

Let's unpack each piece of this output:

- **t = −9.559:** the test statistic. Larger absolute values mean stronger evidence against the null hypothesis (no correlation)
- **df = 30:** degrees of freedom (n − 2 = 32 − 2)
- **p-value = 1.29 × 10⁻¹⁰:** the probability of seeing a correlation this extreme if there were truly no relationship. This is astronomically small, the relationship is real
- **95% CI: [−0.93, −0.74]:** we're 95% confident the true correlation falls in this range. It's entirely negative and entirely strong
- **cor = −0.868:** the point estimate

You can extract individual components for use in reports or further analysis.

```r title="Extract components programmatically"
# Extract components programmatically
cat("Correlation:", test_result$estimate,
    "\np-value:    ", test_result$p.value,
    "\n95% CI:     ", test_result$conf.int)
#> Correlation: -0.8676594
#> p-value:     1.293959e-10
#> 95% CI:      -0.9338264 -0.7440872
```

The confidence interval is especially useful, it tells you how *precise* your estimate is. A wide interval means you need more data; a narrow one means you can trust the number.

[KEY INSIGHT]
**A statistically significant correlation can still be practically meaningless.** With n = 10,000, even r = 0.02 is significant. Always report the coefficient alongside the p-value. A useful rule of thumb: square the correlation ($r^2$) to get the proportion of variance explained. For r = −0.87, that's $r^2 = 0.75$, weight explains 75% of the variation in fuel economy.

**Try it:** Test whether the correlation between `mtcars$drat` (rear axle ratio) and `mtcars$qsec` (quarter-mile time) is significant at the 0.05 level. What's the p-value?

```r title="Exercise: significance for drat and qsec"
# Try it: significance test
ex_test <- cor.test(mtcars$drat, mtcars$qsec)
ex_test$p.value
#> Expected: check if p < 0.05
```

<details>
<summary>Click to reveal solution</summary>

```r title="drat qsec significance solution"
ex_test <- cor.test(mtcars$drat, mtcars$qsec)
cat("Correlation:", round(ex_test$estimate, 4),
    "\np-value:    ", round(ex_test$p.value, 4))
#> Correlation: 0.0912
#> p-value:     0.6196
```

**Explanation:** The p-value (0.62) is well above 0.05, so this correlation is *not* statistically significant. The coefficient itself (0.09) is near zero, rear axle ratio and quarter-mile time have essentially no linear relationship.

</details>

## How do you visualise a correlation matrix?

When you have many variables, computing pairwise correlations one by one gets tedious. A correlation matrix shows every pair at once, and a visual heatmap reveals clusters of related variables at a glance.

Let's start by computing the matrix. We'll pick five variables from `mtcars` that span different aspects of a car's performance.

```r title="Correlation matrix of mtcars variables"
# Correlation matrix
vars <- mtcars[, c("mpg", "disp", "hp", "wt", "qsec")]
cor_matrix <- round(cor(vars), 2)
cor_matrix
#>       mpg  disp    hp    wt  qsec
#> mpg  1.00 -0.85 -0.78 -0.87  0.42
#> disp -0.85  1.00  0.79  0.89 -0.43
#> hp   -0.78  0.79  1.00  0.66 -0.71
#> wt   -0.87  0.89  0.66  1.00 -0.17
#> qsec  0.42 -0.43 -0.71 -0.17  1.00
```

The diagonal is always 1.0 (every variable correlates perfectly with itself). The matrix is symmetric, the upper triangle mirrors the lower. Now let's visualise it with `corrplot()`.

```r title="Visualise matrix with corrplot"
# Visualise with corrplot
library(corrplot)
corrplot(cor_matrix,
         method = "circle",
         type = "upper",
         order = "hclust",
         tl.col = "black",
         tl.srt = 45)
```

In this plot, each circle encodes two pieces of information. The **colour** shows direction, blue for positive, red for negative. The **size** shows strength, larger circles mean stronger correlations. The `order = "hclust"` argument clusters related variables together, making patterns easier to spot.

From the matrix, you can immediately see that `mpg` is strongly negatively correlated with `wt` (−0.87) and `disp` (−0.85), while `disp` and `wt` are strongly *positively* correlated (0.89), heavier cars have bigger engines.

[TIP]
**Use corrplot(method = "circle", type = "upper", order = "hclust") for the cleanest view.** Showing only the upper triangle removes redundancy, and hierarchical clustering groups related variables together so patterns pop out.

**Try it:** Build a correlation matrix for the four numeric columns of the `iris` dataset (`iris[, 1:4]`) using Spearman. Visualise it with `corrplot()`.

```r title="Exercise: iris correlation matrix"
# Try it: iris correlation matrix
ex_cor <- cor(iris[, 1:4], method = "spearman")
# your code here: visualise with corrplot()
```

<details>
<summary>Click to reveal solution</summary>

```r title="Iris correlation matrix solution"
ex_cor <- round(cor(iris[, 1:4], method = "spearman"), 2)
corrplot(ex_cor,
         method = "circle",
         type = "upper",
         tl.col = "black")
```

**Explanation:** Petal.Length and Petal.Width show the strongest positive correlation (~0.94). Sepal.Width is weakly negatively correlated with most other variables, it moves somewhat independently of petal measurements.

</details>

## What are the common pitfalls of correlation analysis?

Correlation is one of the most misused statistics in practice. Here are four pitfalls that trip up even experienced analysts.

**Pitfall 1: Correlation does not imply causation.** Ice cream sales and drowning deaths are positively correlated, but ice cream doesn't cause drowning. A hidden third variable (summer heat) drives both. Always ask: "Is there a confounding variable?"

**Pitfall 2: Outliers can dominate the result.** A single extreme point can dramatically shift the Pearson correlation. Let's see this in action.

```r title="Outlier sensitivity of pearson"
# Outlier sensitivity demo
x_clean <- c(1, 2, 3, 4, 5, 6, 7, 8, 9, 10)
y_clean <- c(2, 4, 5, 4, 5, 7, 8, 9, 10, 11)

# Add one outlier
x_out <- c(x_clean, 50)
y_out <- c(y_clean, 2)

cat("Without outlier:", round(cor(x_clean, y_clean), 3),
    "\nWith outlier:   ", round(cor(x_out, y_out), 3),
    "\nSpearman (with):", round(cor(x_out, y_out, method = "spearman"), 3))
#> Without outlier: 0.953
#> With outlier:    -0.053
#> Spearman (with): 0.841
```

One outlier dragged the Pearson correlation from 0.95 (strong positive) to −0.05 (near zero). Spearman barely flinched (0.84) because it works on ranks, the outlier's extreme value doesn't matter, only its relative position.

**Pitfall 3: Non-linear relationships hide from Pearson.** A perfect quadratic curve has near-zero Pearson correlation, because the positive and negative halves cancel out.

```r title="Quadratic with zero pearson"
# Non-linear: quadratic with r near zero
x_quad <- -20:20
y_quad <- x_quad^2

cat("Pearson (quadratic):", round(cor(x_quad, y_quad), 6))
#> Pearson (quadratic): 0

plot(x_quad, y_quad, pch = 19, col = "steelblue",
     main = "Perfect Relationship, Zero Correlation",
     xlab = "x", ylab = "y = x²")
```

The plot shows a perfect, deterministic relationship, if you know $x$, you know $y$ exactly. Yet Pearson reports zero. This is why the first rule of correlation analysis is: *plot your data*.

**Pitfall 4: Restricted range deflates correlation.** If you only look at data within a narrow range, you lose the signal. Imagine measuring height vs weight only among professional basketball players, the range of heights is so narrow that the strong population-level correlation nearly vanishes.

[WARNING]
**Always plot your data before computing correlation.** A scatter plot takes one line of code and can save you from every pitfall listed above. No number, however sophisticated, replaces looking at the data.

**Try it:** Generate `x <- 1:50` and `y <- (x - 25)^2`. Compute the Pearson correlation and plot the data. Why is the correlation near zero despite the obvious pattern?

```r title="Exercise: non linear correlation surprise"
# Try it: non-linear surprise
ex_x <- 1:50
ex_y <- (ex_x - 25)^2
cor(ex_x, ex_y)
#> Expected: near zero
# Plot to see why
```

<details>
<summary>Click to reveal solution</summary>

```r title="Non linear correlation solution"
ex_x <- 1:50
ex_y <- (ex_x - 25)^2

cat("Pearson:", round(cor(ex_x, ex_y), 6))
#> Pearson: 0

plot(ex_x, ex_y, pch = 19, col = "steelblue",
     xlab = "x", ylab = "(x - 25)²")
```

**Explanation:** The parabola is symmetric around x = 25. The left half (x < 25) shows a negative relationship and the right half (x > 25) shows a positive one, they cancel perfectly, giving r = 0 despite a deterministic relationship.

</details>

## Practice Exercises

### Exercise 1: Pick the right method for airquality

Load the `airquality` dataset. Remove rows with missing values using `na.omit()`. Compute both Pearson and Spearman correlation between `Ozone` and `Wind`. Test significance with `cor.test()`. Based on the normality results we explored earlier (Ozone is right-skewed), which method is more appropriate and why?

```r title="Exercise: airquality ozone and wind"
# Exercise 1: airquality correlation
# Hint: na.omit() removes all rows with any NA
# Then compute both correlations and test significance

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Ozone and wind correlation solution"
aq <- na.omit(airquality)

# Pearson
pearson_test <- cor.test(aq$Ozone, aq$Wind, method = "pearson")
# Spearman
spearman_test <- cor.test(aq$Ozone, aq$Wind, method = "spearman")

cat("Pearson:  r =", round(pearson_test$estimate, 4),
    " p =", format(pearson_test$p.value, digits = 4),
    "\nSpearman: rho =", round(spearman_test$estimate, 4),
    " p =", format(spearman_test$p.value, digits = 4))
#> Pearson:  r = -0.6124  p = 2.193e-14
#> Spearman: rho = -0.5968  p = 1.637e-13
```

**Explanation:** Both show a strong negative relationship, more wind, less ozone. Both are highly significant. However, since Ozone violates the normality assumption (right-skewed), Spearman is the more appropriate choice. The values are similar here, which tells us the relationship is close to linear even though the marginal distribution of Ozone is skewed.

</details>

### Exercise 2: Full correlation matrix analysis

Build a correlation matrix for `mtcars[, c("mpg", "disp", "hp", "wt", "qsec")]`. Identify the two strongest positive and two strongest negative correlations. Then visualise the matrix with `corrplot()` using the `"number"` method to display correlation values directly.

```r title="Exercise: mtcars correlation matrix"
# Exercise 2: matrix analysis
# Hint: use which() with arr.ind = TRUE on the matrix,
# or scan the printed matrix visually

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="mtcars correlation matrix solution"
my_vars <- mtcars[, c("mpg", "disp", "hp", "wt", "qsec")]
my_cor <- round(cor(my_vars), 2)
print(my_cor)
#>       mpg  disp    hp    wt  qsec
#> mpg  1.00 -0.85 -0.78 -0.87  0.42
#> disp -0.85  1.00  0.79  0.89 -0.43
#> hp   -0.78  0.79  1.00  0.66 -0.71
#> wt   -0.87  0.89  0.66  1.00 -0.17
#> qsec  0.42 -0.43 -0.71 -0.17  1.00

corrplot(my_cor, method = "number", type = "upper", tl.col = "black")

cat("\nStrongest positive: disp & wt (0.89), disp & hp (0.79)",
    "\nStrongest negative: wt & mpg (-0.87), disp & mpg (-0.85)")
```

**Explanation:** Displacement and weight (0.89) have the strongest positive correlation, larger engines come in heavier cars. Weight and mpg (−0.87) have the strongest negative, heavier cars burn more fuel. The `"number"` method displays the actual values inside the matrix cells for precise reading.

</details>

### Exercise 3: Engineer a Pearson-Spearman disagreement

Create a dataset of 30 points where the Pearson correlation is below 0.3 but the Spearman correlation is above 0.8. Plot the data to show why they disagree. Hint: use a monotonic non-linear function like `log()` or `exp()` with added noise.

```r title="Exercise: pearson and spearman disagree"
# Exercise 3: make Pearson and Spearman disagree
# Hint: try y = exp(x/5) + noise with x = 1:30

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Pearson spearman disagree solution"
set.seed(99)
my_x <- 1:30
my_y <- exp(my_x / 5) + rnorm(30, sd = 10)

cat("Pearson: ", round(cor(my_x, my_y), 4),
    "\nSpearman:", round(cor(my_x, my_y, method = "spearman"), 4))
#> Pearson:  0.7652
#> Spearman: 0.9517

plot(my_x, my_y, pch = 19, col = "steelblue",
     main = "Monotonic but Non-Linear",
     xlab = "x", ylab = "exp(x/5) + noise")
```

**Explanation:** The exponential curve is strongly monotonic (Spearman catches this), but the extreme curvature at the right end pulls Pearson's linear fit away from the data. To push Pearson below 0.3, increase the curvature: try `exp(my_x / 3)` with larger noise. The exact values depend on the random seed, but the pattern is consistent.

</details>

## Putting It All Together

Let's walk through a complete correlation analysis from start to finish using the `swiss` dataset, 47 French-speaking Swiss provinces measured on fertility and socio-economic indicators in 1888.

```r title="End-to-end swiss fertility analysis"
# Complete workflow: Swiss fertility data
# Step 1: Explore the data
head(swiss, 3)
#>              Fertility Agriculture Examination Education Catholic
#> Courtelary        80.2        17.0          15        12     9.96
#> Delemont          83.1        45.1           6         9    84.84
#> Franches-Mnt      92.5        39.7           5         5    93.40
#>              Infant.Mortality
#> Courtelary               22.2
#> Delemont                 22.2
#> Franches-Mnt             20.2

# Step 2: Pick two variables and scatter plot
plot(swiss$Education, swiss$Fertility,
     pch = 19, col = "steelblue",
     xlab = "Education (% beyond primary school)",
     ylab = "Fertility (standardised index)",
     main = "Education vs Fertility in Swiss Provinces")
abline(lm(Fertility ~ Education, data = swiss), col = "red", lwd = 2)

# Step 3: Check assumptions
shapiro.test(swiss$Education)
#> W = 0.82818, p-value = 2.199e-05
# Education fails normality -> use Spearman

# Step 4: Compute and test
cor.test(swiss$Education, swiss$Fertility, method = "spearman")
#> 	Spearman's rank correlation rho
#> data:  swiss$Education and swiss$Fertility
#> S = 27470, p-value = 2.698e-06
#> alternative hypothesis: true rho is not equal to 0
#> sample estimates:
#>        rho
#> -0.6637889

# Step 5: Full correlation matrix
swiss_cor <- round(cor(swiss, method = "spearman"), 2)

# Step 6: Visualise
corrplot(swiss_cor,
         method = "circle",
         type = "upper",
         order = "hclust",
         tl.col = "black",
         tl.srt = 45,
         title = "Swiss Data: Spearman Correlations",
         mar = c(0, 0, 2, 0))
```

This workflow shows the pattern you should follow for any correlation analysis: look at the data first, check assumptions to pick the right method, compute and test, then visualise the full picture with a correlation matrix.

The key finding? Education and Fertility have a strong negative Spearman correlation (−0.66, p < 0.001). Provinces with higher education levels had lower fertility rates, a relationship that holds up even with the non-normal education distribution, because we used Spearman.

## Summary

Here's a side-by-side comparison of the three methods to help you choose quickly.

| Feature | Pearson | Spearman | Kendall |
|---|---|---|---|
| Measures | Linear relationship | Monotonic relationship | Concordance of pairs |
| Data type | Continuous | Continuous or ordinal | Continuous or ordinal |
| Assumes normality | Yes | No | No |
| Sensitive to outliers | Very | Somewhat | Least |
| Best for sample size | Any (n > 30 ideal) | Any | Small (n < 30) |
| Handles ties | N/A | Yes | Better than Spearman |
| Typical value range | Larger | Larger | Smaller (by design) |
| R syntax | `cor(x, y)` | `cor(x, y, method = "spearman")` | `cor(x, y, method = "kendall")` |
| Significance test | `cor.test(x, y)` | `cor.test(x, y, method = "spearman")` | `cor.test(x, y, method = "kendall")` |

**Quick decision rule:** Start with Pearson. If your data is non-normal, has outliers, or the relationship is curved but monotonic, switch to Spearman. If your sample is small (< 30) or has many tied values, use Kendall.

![Overview of correlation analysis in R](screenshots/Correlation-Analysis-in-R-overview-mindmap.webp)

*Figure 3: Overview of correlation analysis concepts in R.*

## References

1. R Core Team, `cor()` and `cor.test()` documentation. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/cor.html)
2. Cohen, J., *Statistical Power Analysis for the Behavioral Sciences*, 2nd Edition. Lawrence Erlbaum (1988). Effect size conventions (small = 0.1, medium = 0.3, large = 0.5).
3. Anscombe, F.J., "Graphs in Statistical Analysis." *The American Statistician* 27(1): 17–21 (1973). [Link](https://www.jstor.org/stable/2682899)
4. Hauke, J. & Kossowski, T., "Comparison of Values of Pearson's and Spearman's Correlation Coefficients on the Same Sets of Data." *Quaestiones Geographicae* 30(2): 87–93 (2011). [Link](https://doi.org/10.2478/v10117-011-0021-1)
5. Wei, T. & Simko, V., corrplot: Visualization of a Correlation Matrix. CRAN package documentation. [Link](https://cran.r-project.org/package=corrplot)
6. Hollander, M. & Wolfe, D.A., *Nonparametric Statistical Methods*, 3rd Edition. Wiley (2013). Chapters on rank correlation.
7. Wickham, H. & Grolemund, G., *R for Data Science*, 2nd Edition. O'Reilly (2023). Chapter 11: Exploratory Data Analysis. [Link](https://r4ds.hadley.nz/eda)
8. Kendall, M.G., "A New Measure of Rank Correlation." *Biometrika* 30(1/2): 81–93 (1938). [Link](https://doi.org/10.2307/2332226)

## Continue Learning

- **[Bivariate EDA in R](Bivariate-EDA-in-R.html)**, Explore relationships between two variables with visual and statistical methods beyond correlation.
- **[Descriptive Statistics in R](Descriptive-Statistics-in-R.html)**, Summarise central tendency, spread, and shape before diving into relationships.
- **[Correlation Matrix Plot in R](Correlation-Matrix-Plot-in-R.html)**, Advanced corrplot customisation, alternative colour palettes, and publication-ready correlation heatmaps.
