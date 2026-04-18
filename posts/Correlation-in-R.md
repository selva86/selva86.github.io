---
title: "Correlation in R: Choose Between Pearson, Spearman, and Kendall — With Tests"
slug: "Correlation-in-R"
description: "Compute Pearson, Spearman, and Kendall correlation in R with cor() and cor.test(). Visualize matrices with corrplot. See why r never implies causation."
keywords: "correlation in R, Pearson correlation R, Spearman correlation R, Kendall tau R, cor function R, cor.test R, correlation matrix R, corrplot R, rank correlation, correlation coefficient"
auto_link_terms: "correlation in R|Pearson correlation|Spearman correlation|Kendall's tau|Kendall correlation|correlation coefficient|correlation matrix"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-18"
curriculum_id: "2.3.1"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Correlation (Pearson, Spearman, Kendall)"
sidebar_order: 46
difficulty: "Beginner"
---

# Correlation in R: Choose Between Pearson, Spearman, and Kendall — With Tests

<p class="lead">Correlation measures how tightly two variables move together on a scale from -1 to +1. In R you reach for <code>cor()</code> and <code>cor.test()</code>, but the right number depends on your data: Pearson captures linear strength on continuous, well-behaved pairs, Spearman handles non-normal or monotonic curves, and Kendall works best on ranked data with many ties.</p>

## What does correlation measure in R?

The quickest way to feel correlation is to compute one. We will ask R whether heavier cars get worse fuel economy using the built-in `mtcars` dataset. The `cor()` function returns a single number between -1 and +1: the sign tells you direction, the magnitude tells you strength. Every code block on this page runs in your browser, so you can execute and tweak each one as you read.

```r title="Compute your first correlation"
mtcars_df <- mtcars
cor(mtcars_df$mpg, mtcars_df$wt)
#> [1] -0.8676594
```

The value is -0.87. Negative means that as weight goes up, mileage goes down. The magnitude, 0.87, is close to 1, so the relationship is strong. A useful rule of thumb: |r| above 0.7 is strong, 0.3 to 0.7 is moderate, and below 0.3 is weak. We just confirmed what every driver knows, in one line of R.

**Try it:** Compute the correlation between `mpg` and `hp` (horsepower). Predict the sign first, then check.

```r title="Your turn: mpg vs hp"
# Fill the blank:
cor(mtcars_df$mpg, ________)
#> Expected: a negative number around -0.78
```

<details>
<summary>Click to reveal solution</summary>

```r title="mpg vs hp solution"
cor(mtcars_df$mpg, mtcars_df$hp)
#> [1] -0.7761684
```

**Explanation:** More horsepower means a heavier, thirstier engine, so mpg drops. The -0.78 is strong but slightly weaker than the -0.87 we saw with weight.

</details>

## When should you use Pearson, Spearman, or Kendall?

The three methods ask different questions. Pearson asks how linear the relationship is. Spearman and Kendall ask whether it is monotonic, meaning one variable consistently goes up (or down) as the other grows, regardless of whether the curve is straight. That difference matters the moment your data bends.

![Choosing a correlation method based on data type, shape, and ties.](screenshots/Correlation-in-R-choosing-method.webp)

*Figure 1: Choosing between Pearson, Spearman, and Kendall from data type, shape, and ties.*

Let's build a data pair that climbs steeply (exponential growth) so we can see the three methods disagree. The shape is clearly monotonic, y only goes up as x grows, but it is not linear.

```r title="Build a monotonic but non-linear pair"
set.seed(11)
nl_x <- 1:20
nl_y <- exp(0.3 * nl_x) + rnorm(20, sd = 5)
head(data.frame(nl_x, nl_y))
#>   nl_x      nl_y
#> 1    1 -6.212988
#> 2    2  7.104376
#> 3    3  2.523836
#> 4    4  5.063188
#> 5    5  3.538720
#> 6    6  6.020639
```

Now compute all three correlation coefficients on the same pair. Pearson should drop because the curve bends, while Spearman and Kendall should stay close to 1 because the ranks still march in lockstep.

```r title="Compare Pearson, Spearman, Kendall"
c(pearson  = cor(nl_x, nl_y, method = "pearson"),
  spearman = cor(nl_x, nl_y, method = "spearman"),
  kendall  = cor(nl_x, nl_y, method = "kendall"))
#>   pearson  spearman   kendall
#> 0.8322661 0.9969925 0.9789474
```

Pearson is 0.83, still strong, but the curve drags it away from 1. Spearman is 1.00 and Kendall 0.98, because the rank ordering is almost perfect. If you stopped at Pearson you would underestimate how tight the relationship really is.

A picture helps. Plot the pair and you will see why the rank-based methods are happier.

```r title="Scatter of the curved pair"
plot(nl_x, nl_y, pch = 19, col = "steelblue",
     main = "Monotonic but non-linear",
     xlab = "nl_x", ylab = "nl_y")
```

The points clearly bend upward, so any straight line misses the top-right cluster. Spearman and Kendall don't mind the bend because they only compare orderings.

[KEY INSIGHT]
**Pearson measures straight-line strength; Spearman and Kendall measure order.** When a scatter plot bends but never doubles back, rank-based methods will always report a higher coefficient than Pearson, and they are the more honest number.

**Try it:** Generate `ex_x <- 1:15` and `ex_y <- ex_x^2`. Compute all three correlations. Which one hits exactly 1?

```r title="Your turn: x squared"
ex_x <- 1:15
ex_y <- ex_x^2

# Fill in three values:
c(pearson  = ________,
  spearman = ________,
  kendall  = ________)
#> Expected: spearman = 1 and kendall = 1; pearson slightly below 1
```

<details>
<summary>Click to reveal solution</summary>

```r title="x squared solution"
ex_x <- 1:15
ex_y <- ex_x^2
c(pearson  = cor(ex_x, ex_y),
  spearman = cor(ex_x, ex_y, method = "spearman"),
  kendall  = cor(ex_x, ex_y, method = "kendall"))
#>   pearson  spearman   kendall
#> 0.9695157 1.0000000 1.0000000
```

**Explanation:** `ex_y` grows strictly as `ex_x` grows, so ranks match perfectly and both rank-based methods return 1. Pearson is 0.97 because the quadratic shape is still a curve, not a straight line.

</details>

## How do you test if a correlation is statistically significant?

`cor()` returns a point estimate. `cor.test()` adds a hypothesis test on top: a t-statistic, a p-value, and (for Pearson) a 95% confidence interval built from Fisher's Z transform. The null hypothesis is that the true correlation is zero. A small p-value says the pattern you see is unlikely to be coincidence.

```r title="Pearson cor.test on mpg and wt"
test_result <- cor.test(mtcars_df$mpg, mtcars_df$wt)
test_result
#>
#>     Pearson's product-moment correlation
#>
#> data:  mtcars_df$mpg and mtcars_df$wt
#> t = -9.559, df = 30, p-value = 1.294e-10
#> alternative hypothesis: true correlation is not equal to 0
#> sample estimates:
#>        cor
#> -0.8676594
```

The p-value is 1.3e-10, vanishingly small. The t-statistic of -9.56 on 30 degrees of freedom tells you the effect is about nine and a half standard errors from zero. Now pull out the parts you'll actually quote in a report.

```r title="Extract estimate, CI, and p-value"
c(r  = test_result$estimate,
  lo = test_result$conf.int[1],
  hi = test_result$conf.int[2],
  p  = test_result$p.value)
#>          r.cor            lo            hi             p
#> -8.676594e-01 -9.337840e-01 -7.384847e-01  1.293958e-10
```

The 95% CI is roughly [-0.93, -0.74], so we can be confident the true correlation is strong and negative. Now switch the method to Spearman on the same pair and watch the output change.

```r title="Spearman cor.test on the same pair"
cor.test(mtcars_df$mpg, mtcars_df$wt, method = "spearman", exact = FALSE)
#>
#>     Spearman's rank correlation rho
#>
#> data:  mtcars_df$mpg and mtcars_df$wt
#> S = 10292, p-value = 1.488e-11
#> alternative hypothesis: true rho is not equal to 0
#> sample estimates:
#>        rho
#> -0.886422
```

Spearman's rho is -0.89, even a shade stronger than Pearson, and the p-value is still tiny. Notice the output lacks a confidence interval, that's normal, because the rank-based methods don't have a one-line formula for it. For CIs around Spearman or Kendall, bootstrap with the `boot` package.

[WARNING]
**Statistical significance is not practical importance.** With n = 10,000 a correlation of r = 0.02 can post a p-value under 0.001, but it explains under 0.05% of the variance. Always report the effect size alongside the p, and look at the confidence interval to see how tight the estimate is.

**Try it:** Run `cor.test()` between `mpg` and `hp` using the Spearman method, then pull out the rho estimate.

```r title="Your turn: Spearman test on mpg and hp"
# Fill in the call:
ex_test <- ________
ex_test$estimate
#> Expected: a rho around -0.89
```

<details>
<summary>Click to reveal solution</summary>

```r title="Spearman on mpg and hp solution"
ex_test <- cor.test(mtcars_df$mpg, mtcars_df$hp, method = "spearman", exact = FALSE)
ex_test$estimate
#>        rho
#> -0.8946646
```

**Explanation:** `cor.test()` returns a list whose `estimate` element holds rho for Spearman (and r for Pearson, tau for Kendall). The `exact = FALSE` is there to silence ties.

</details>

## How do you handle missing values and ties?

Real data has holes. By default, `cor()` returns `NA` the moment a single input is missing, a strict-but-safe default. You override it with the `use=` argument. `"complete.obs"` drops any row with an `NA` anywhere. `"pairwise.complete.obs"` does the drop per pair, so you keep as much data as possible across a big matrix.

```r title="Handle NAs with use="
mpg_na <- mtcars_df$mpg
mpg_na[c(3, 7, 11)] <- NA

c(default     = cor(mpg_na, mtcars_df$wt),
  complete    = cor(mpg_na, mtcars_df$wt, use = "complete.obs"),
  pairwise    = cor(mpg_na, mtcars_df$wt, use = "pairwise.complete.obs"))
#>   default  complete  pairwise
#>        NA -0.868029 -0.868029
```

Default returns `NA`. Both `complete.obs` and `pairwise.complete.obs` agree here because we only have one variable pair, the distinction matters only for 3+ variables. Next, handle tied ranks for Spearman and Kendall.

```r title="Ties and exact p-values"
score_a <- c(1, 2, 2, 3, 4, 4, 5, 6, 7, 7)
score_b <- c(2, 3, 3, 4, 5, 5, 6, 7, 8, 8)

# This throws a warning because of ties:
suppressWarnings(cor.test(score_a, score_b, method = "spearman"))$p.value
#> [1] 6.168892e-06

# exact = FALSE uses a normal approximation and is quiet:
cor.test(score_a, score_b, method = "spearman", exact = FALSE)$p.value
#> [1] 6.168892e-06
```

The p-value barely shifts, the warning is about the algorithm, not the answer. Use `exact = FALSE` whenever your ranked data has ties, which is almost always.

[TIP]
**For correlation matrices on real-world data, pairwise.complete.obs usually wins.** It computes each cell on the rows that are complete for that specific pair, so you don't throw away all of row 57 just because column 12 was missing. The tradeoff: cells can be based on different sample sizes.

**Try it:** Inject three `NA` values into a copy of `mtcars_df$hp` called `na_hp` and compute `cor(mtcars_df$mpg, na_hp, use = "complete.obs")`.

```r title="Your turn: NAs in hp"
na_hp <- mtcars_df$hp
na_hp[c(5, 15, 25)] <- NA
# Fill in the call:
cor(________, ________, use = "complete.obs")
#> Expected: a value close to -0.78
```

<details>
<summary>Click to reveal solution</summary>

```r title="NAs in hp solution"
na_hp <- mtcars_df$hp
na_hp[c(5, 15, 25)] <- NA
cor(mtcars_df$mpg, na_hp, use = "complete.obs")
#> [1] -0.7700167
```

**Explanation:** `use = "complete.obs"` drops any row where either input has an `NA`, then runs the usual Pearson formula on what remains.

</details>

## How do you build a correlation matrix for many variables?

Pass a data frame or matrix to `cor()` and it returns a square matrix of pairwise correlations. This is the workhorse of exploratory data analysis, one call, a full overview of linear relationships across every numeric column.

```r title="Correlation matrix on numeric columns"
mtcars_num <- mtcars_df[, c("mpg", "wt", "hp", "qsec", "disp")]
cor_mat <- cor(mtcars_num)
round(cor_mat, 2)
#>        mpg    wt    hp  qsec  disp
#> mpg   1.00 -0.87 -0.78  0.42 -0.85
#> wt   -0.87  1.00  0.66 -0.17  0.89
#> hp   -0.78  0.66  1.00 -0.71  0.79
#> qsec  0.42 -0.17 -0.71  1.00 -0.43
#> disp -0.85  0.89  0.79 -0.43  1.00
```

The diagonal is all 1s (every variable is perfectly correlated with itself). The matrix is symmetric, so you only need to read one triangle. `wt` and `disp` at 0.89 is the tightest pair here, heavy cars tend to have big engines. But this matrix has no p-values. For a tidy table of r, p, and sample size per pair, use `rstatix::cor_test`.

```r title="Tidy correlation table with rstatix"
library(rstatix)
tidy_cors <- cor_test(mtcars_num)
head(tidy_cors, 6)
#> # A tibble: 6 × 8
#>   var1  var2      cor statistic         p conf.low conf.high method 
#>   <chr> <chr>   <dbl>     <dbl>     <dbl>    <dbl>     <dbl> <chr>  
#> 1 mpg   wt   -0.87       -9.56  1.29e-10   -0.934    -0.738  Pearson
#> 2 mpg   hp   -0.78       -6.74  1.79e- 7   -0.885    -0.586  Pearson
#> 3 mpg   qsec  0.42        2.53  1.71e- 2    0.082     0.670  Pearson
#> 4 mpg   disp -0.85       -8.75  9.38e-10   -0.923    -0.708  Pearson
#> 5 wt    hp    0.66        4.80  4.15e- 5    0.402     0.824  Pearson
#> 6 wt    qsec -0.17       -0.97  3.39e- 1   -0.486     0.186  Pearson
```

Now you have one row per pair, with the estimate, the p-value, the 95% CI, and the method name, perfect for filtering and plotting with `dplyr` and `ggplot2`.

[NOTE]
**`cor()` only accepts numeric columns.** Pass a full data frame with factors or characters and R throws an error. Subset first with `mtcars_df[, sapply(mtcars_df, is.numeric)]` in base R or `dplyr::select(where(is.numeric))` in the tidyverse.

**Try it:** Build `cor(iris[, 1:4])` on the four numeric `iris` columns and find the strongest pair.

```r title="Your turn: iris correlation matrix"
# Fill in and inspect:
ex_iris_cor <- ________
round(ex_iris_cor, 2)
#> Expected: Petal.Length and Petal.Width at around 0.96
```

<details>
<summary>Click to reveal solution</summary>

```r title="iris correlation matrix solution"
ex_iris_cor <- cor(iris[, 1:4])
round(ex_iris_cor, 2)
#>              Sepal.Length Sepal.Width Petal.Length Petal.Width
#> Sepal.Length         1.00       -0.12         0.87        0.82
#> Sepal.Width         -0.12        1.00        -0.43       -0.37
#> Petal.Length         0.87       -0.43         1.00        0.96
#> Petal.Width          0.82       -0.37         0.96        1.00
```

**Explanation:** `Petal.Length` and `Petal.Width` correlate at 0.96, the tightest pair. Petal dimensions scale together across species. `Sepal.Width` is the oddball, slightly negative with the petals.

</details>

## How do you visualize a correlation matrix?

A 5x5 matrix of numbers is already hard to scan; a 20x20 matrix is impossible. Plot it. Two packages dominate: `corrplot` is base-graphics, fast, and print-friendly. `ggcorrplot` is built on ggplot2, so you can theme and extend it like any other ggplot.

```r title="corrplot with upper triangle and labels"
library(corrplot)
corrplot(cor_mat,
         method = "color",
         type = "upper",
         tl.col = "black",
         addCoef.col = "black",
         number.cex = 0.8)
```

The plot shows each cell tinted by the coefficient, with the number printed on top. `type = "upper"` drops the redundant lower triangle. Strong negatives flash red, strong positives flash blue. Now the same data in ggplot2 style.

```r title="ggcorrplot with clustering"
library(ggcorrplot)
ggcorrplot(cor_mat,
           type = "lower",
           hc.order = TRUE,
           lab = TRUE,
           lab_size = 3,
           colors = c("#d7191c", "white", "#2c7bb6"))
```

The same five variables, but `hc.order = TRUE` reshuffles rows and columns by hierarchical clustering. Variables that move together sit next to each other, which makes visual patterns jump out. On bigger matrices this reorder is what turns a grid of numbers into a story.

[TIP]
**Cluster first, then eyeball.** On real data with 15 or more variables, always set `hc.order = TRUE`. Without it you get alphabetical order, which hides block structure. With it, you see groups of related variables as obvious blocks.

**Try it:** Replot `cor_mat` with `type = "full"` and `method = "circle"` to see every cell as a scaled circle.

```r title="Your turn: full circle corrplot"
# Fill in the call:
corrplot(________, method = ________, type = ________)
#> Expected: a 5x5 grid with circle sizes that grow with |r|
```

<details>
<summary>Click to reveal solution</summary>

```r title="full circle corrplot solution"
corrplot(cor_mat, method = "circle", type = "full")
```

**Explanation:** `method = "circle"` uses area to encode magnitude, so a weak 0.17 looks much smaller than a strong 0.89. `type = "full"` shows both triangles, redundant, but sometimes easier to scan along a row.

</details>

## Why is high correlation not causation?

Correlation measures co-movement. It does not say which variable pushes which, and it happily lights up when a hidden third variable drives both. To really internalise this, simulate a confounder and watch a strong correlation evaporate under a proper model.

The setup: a latent variable `conf_z` drives both `conf_x` and `conf_y`. Neither `conf_x` nor `conf_y` has any direct effect on the other. Yet `cor(conf_x, conf_y)` will report a big number, because both are tracking `conf_z`.

```r title="Simulate a confounder"
set.seed(7)
n <- 300
conf_z <- rnorm(n)
conf_x <- 0.9 * conf_z + rnorm(n, sd = 0.3)
conf_y <- 0.9 * conf_z + rnorm(n, sd = 0.3)

cor(conf_x, conf_y)
#> [1] 0.8563205
```

We asked R to find a correlation between two variables that share nothing but a common cause, and it returned 0.86, a number you would happily publish. Now fit two regressions: one with `conf_x` alone and one that also controls for the confounder `conf_z`.

```r title="Effect collapses when we control for Z"
round(coef(summary(lm(conf_y ~ conf_x))), 3)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)    0.017      0.025   0.668    0.504
#> conf_x         0.895      0.031  28.797    0.000

round(coef(summary(lm(conf_y ~ conf_x + conf_z))), 3)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)    0.019      0.018   1.054    0.293
#> conf_x        -0.020      0.077  -0.264    0.792
#> conf_z         0.918      0.079  11.614    0.000
```

In the naive model the `conf_x` coefficient is 0.90 with a t of 28. It looks like `conf_x` drives `conf_y`. Add `conf_z` and the `conf_x` coefficient collapses to -0.02 with a p-value of 0.79, basically zero. All the explanatory power sits in `conf_z`, the real common cause.

[KEY INSIGHT]
**A strong correlation is a starting point for investigation, not evidence of cause.** Ask, every time: could a third variable explain both sides? Only a design that controls or randomises the candidate confounders, regression with controls, an experiment, an instrument, lets you talk about causation.

**Try it:** Rebuild the simulation with `conf_z <- rpois(300, lambda = 3)` (Poisson instead of Normal). Confirm that `cor(conf_x, conf_y)` is still high.

```r title="Your turn: Poisson confounder"
set.seed(3)
ex_conf_z <- rpois(300, lambda = 3)
# Fill in:
ex_conf_x <- ________
ex_conf_y <- ________
cor(ex_conf_x, ex_conf_y)
#> Expected: a large positive correlation, typically 0.8+
```

<details>
<summary>Click to reveal solution</summary>

```r title="Poisson confounder solution"
set.seed(3)
ex_conf_z <- rpois(300, lambda = 3)
ex_conf_x <- 0.9 * ex_conf_z + rnorm(300, sd = 0.3)
ex_conf_y <- 0.9 * ex_conf_z + rnorm(300, sd = 0.3)
cor(ex_conf_x, ex_conf_y)
#> [1] 0.9584041
```

**Explanation:** The confounder machinery is distribution-free. Whatever you use for `ex_conf_z`, Normal, Poisson, uniform, as long as it drives both `ex_conf_x` and `ex_conf_y`, the pair will correlate strongly even though neither causes the other.

</details>

## Practice Exercises

Three capstone problems that combine multiple ideas from the tutorial. Every variable here is prefixed with `my_` so it does not clobber anything we defined earlier.

### Exercise 1: Correlation matrix with missing data

The `airquality` dataset has `NA` values in `Ozone` and `Solar.R`. Compute the Pearson correlation matrix across `Ozone`, `Solar.R`, `Wind`, and `Temp` using `pairwise.complete.obs` so you don't throw away every row that has any `NA`. Save the result as `my_airq_cor` and round it to two decimals.

```r title="Exercise 1 starter"
# Hint: subset airquality first, then use cor() with use="pairwise.complete.obs"


```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
my_airq_cols <- airquality[, c("Ozone", "Solar.R", "Wind", "Temp")]
my_airq_cor  <- cor(my_airq_cols, use = "pairwise.complete.obs")
round(my_airq_cor, 2)
#>         Ozone Solar.R  Wind  Temp
#> Ozone    1.00    0.35 -0.60  0.70
#> Solar.R  0.35    1.00 -0.06  0.28
#> Wind    -0.60   -0.06  1.00 -0.46
#> Temp     0.70    0.28 -0.46  1.00
```

**Explanation:** `Ozone` and `Temp` at 0.70 is the strongest pair, hot days produce more ozone. `Wind` is negatively correlated with both because wind disperses pollutants.

</details>

### Exercise 2: Test a correlation within one species

Restrict `iris` to the `setosa` species, then run `cor.test()` between `Sepal.Length` and `Petal.Length`. Save the whole test object as `my_iris_test` and pull out the estimate, p-value, and 95% CI.

```r title="Exercise 2 starter"
# Hint: subset with iris[iris$Species == "setosa", ] first


```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
my_iris_setosa <- iris[iris$Species == "setosa", ]
my_iris_test   <- cor.test(my_iris_setosa$Sepal.Length, my_iris_setosa$Petal.Length)

c(r  = my_iris_test$estimate,
  p  = my_iris_test$p.value,
  lo = my_iris_test$conf.int[1],
  hi = my_iris_test$conf.int[2])
#>         r.cor             p            lo            hi
#>  0.2671758   0.0607126  -0.0120036   0.5075757
```

**Explanation:** Within setosa alone the correlation is only 0.27 and the p-value is 0.06, just above the 0.05 line. The familiar iris-wide 0.87 correlation is mostly driven by between-species differences, not within-species variation. This is a classic example of Simpson's paradox for correlation.

</details>

### Exercise 3: Build and then break a spurious correlation

Simulate a dinner-service dataset with n = 200 observations. The bill amount `my_tip_bill` is the confounder that drives both service time `my_tip_time` and tip amount `my_tip_amount`. Fit two linear models: first `lm(my_tip_amount ~ my_tip_time)`, then `lm(my_tip_amount ~ my_tip_time + my_tip_bill)`. Compare the `my_tip_time` coefficient in the two models.

```r title="Exercise 3 starter"
set.seed(42)
# Hint: bigger bills take longer to serve and earn bigger tips
my_tip_bill   <- ________
my_tip_time   <- ________
my_tip_amount <- ________

# Fit the two models:
m_naive <- lm(________)
m_full  <- lm(________)


```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
set.seed(42)
n <- 200
my_tip_bill   <- rgamma(n, shape = 3, rate = 0.08)       # bill in dollars
my_tip_time   <- 3 + 0.1 * my_tip_bill + rnorm(n, sd = 2)
my_tip_amount <- 0.2 * my_tip_bill + rnorm(n, sd = 1)

m_naive <- lm(my_tip_amount ~ my_tip_time)
m_full  <- lm(my_tip_amount ~ my_tip_time + my_tip_bill)

round(coef(m_naive), 3)
#> (Intercept) my_tip_time
#>      -0.989       0.715
round(coef(m_full), 3)
#> (Intercept) my_tip_time my_tip_bill
#>       0.056      -0.013       0.200
```

**Explanation:** The naive model says each extra minute of service earns 71 cents in tip. The full model, which controls for bill size, drops the service-time effect to essentially zero (-0.013) and puts all the action on bill size (0.20 per dollar). Service time never caused the tip; bigger bills just took longer.

</details>

## Complete Example

A realistic end-to-end workflow. We'll use `airquality`, clean missing values, build a correlation matrix, test the strongest pair, and visualise the whole thing.

```r title="End-to-end correlation workflow"
# 1. Clean data: drop rows with any NA for a simple example
aq_clean <- na.omit(airquality[, c("Ozone", "Solar.R", "Wind", "Temp")])

# 2. Correlation matrix
aq_cor <- cor(aq_clean)
round(aq_cor, 2)
#>         Ozone Solar.R  Wind  Temp
#> Ozone    1.00    0.35 -0.61  0.70
#> Solar.R  0.35    1.00 -0.13  0.27
#> Wind    -0.61   -0.13  1.00 -0.50
#> Temp     0.70    0.27 -0.50  1.00

# 3. Test the strongest pair
aq_test <- cor.test(aq_clean$Ozone, aq_clean$Temp)
c(r  = aq_test$estimate,
  p  = aq_test$p.value,
  lo = aq_test$conf.int[1],
  hi = aq_test$conf.int[2])
#>        r.cor           p          lo          hi
#> 6.983603e-01 2.197599e-17 5.907205e-01 7.817321e-01

# 4. Visualise
corrplot(aq_cor, method = "color", type = "upper",
         tl.col = "black", addCoef.col = "black", number.cex = 0.9)
```

In four code blocks we went from raw data to a publishable summary: Ozone correlates 0.70 with Temp (95% CI 0.59 to 0.78, p < 10^-16). The corrplot gives the reviewer the whole matrix at a glance. This is the template you can reuse on any numeric dataset.

## Summary

The table below is the one-page cheat sheet for this entire tutorial.

| Method | Best data | Handles outliers | Assumes linearity | R call |
|---|---|---|---|---|
| Pearson r | Continuous, roughly normal | No | Yes | `cor(x, y)` or `method = "pearson"` |
| Spearman rho | Monotonic, ranked, skewed | Yes (uses ranks) | No | `cor(x, y, method = "spearman")` |
| Kendall tau | Small n, many ties, ordinal | Yes | No | `cor(x, y, method = "kendall")` |

For quick computation, reach for `cor()`. For a hypothesis test with CI, use `cor.test()`. For a tidy table across many pairs, use `rstatix::cor_test`. For a matrix picture, use `corrplot` or `ggcorrplot`. And whatever the coefficient, never forget: correlation is not causation.

![Methods, functions, visual tools, and cautions for correlation in R.](screenshots/Correlation-in-R-summary-mindmap.webp)

*Figure 2: Methods, functions, visual tools, and cautions for correlation in R.*

## References

1. R Core Team. *R: stats::cor, Correlation, Variance and Covariance (Matrices).* [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/cor.html)
2. R Core Team. *R: stats::cor.test, Test for Association/Correlation Between Paired Samples.* [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/cor.test.html)
3. Wei, T. & Simko, V. *R package corrplot: Visualization of a Correlation Matrix* (v0.92). [Link](https://cran.r-project.org/package=corrplot)
4. Kassambara, A. *ggcorrplot: Visualization of a Correlation Matrix using ggplot2.* [Link](https://cran.r-project.org/package=ggcorrplot)
5. Kassambara, A. *rstatix: Pipe-Friendly Framework for Basic Statistical Tests.* [Link](https://cran.r-project.org/package=rstatix)
6. Kendall, M. G. (1938). A New Measure of Rank Correlation. *Biometrika*, 30(1-2), 81-93.
7. Spearman, C. (1904). The Proof and Measurement of Association between Two Things. *American Journal of Psychology*, 15, 72-101.
8. Fisher, R. A. (1915). Frequency Distribution of the Values of the Correlation Coefficient in Samples from an Indefinitely Large Population. *Biometrika*, 10(4), 507-521.

## Continue Learning

- **Linear Regression**, once you have a promising correlated pair, `lm()` lets you quantify the slope and predict with it. [Linear-Regression.html](Linear-Regression.html)
- **Measures of Association in R**, the broader toolkit for categorical, ordinal, and mixed variable types. [Measures-of-Association-in-R.html](Measures-of-Association-in-R.html)
- **Chi-Square Tests in R**, the equivalent of correlation for two categorical variables. [Chi-Square-Tests-in-R.html](Chi-Square-Tests-in-R.html)
