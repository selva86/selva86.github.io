---
title: "Spearman & Kendall Correlation in R: Rank-Based Association Measures"
slug: "Spearman-and-Kendall-Correlation-in-R"
description: "Spearman rho and Kendall tau in R with cor.test(): rank mechanics, concordant pair counting, ties handling, p-values, bootstrap CIs, and how to choose."
keywords: "Spearman correlation in R, Kendall tau in R, rank correlation R, cor.test method spearman, cor.test method kendall, concordant discordant pairs, tau-b ties, rank-based association, nonparametric correlation"
auto_link_terms: "Spearman correlation|Kendall tau|Kendall's tau|rank correlation|Spearman rho|concordant pairs|discordant pairs|tau-b|rank-based association"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-29"
curriculum_id: "2.8.6"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Spearman & Kendall Correlation"
sidebar_order: 93
difficulty: "Intermediate"
---

# Spearman & Kendall Correlation in R: Rank-Based Association Measures

<p class="lead">Spearman's rho and Kendall's tau measure how strongly two variables move together using ranks instead of raw values, which keeps them honest on non-normal data, ordinal scores, and outlier-prone columns that would corrupt Pearson's r. Both methods run in one line with <code>cor.test()</code>, but they answer slightly different questions, and they disagree in informative ways.</p>

## How does cor.test() compute Spearman and Kendall in R?

When `cor()` returns the wrong answer, it's almost always because the relationship is monotonic but curved, the data is ordinal, or one outlier is dominating the result. Spearman and Kendall fix that by ranking the numbers first, then measuring agreement on those ranks. Let's compute all three flavours of correlation on a small synthetic dataset where the relationship is strictly monotonic but nonlinear, so the difference becomes visible immediately.

```r title="Compare Pearson, Spearman, Kendall on curved data"
set.seed(101)
x <- 1:8
y <- exp(x) + rnorm(8, sd = 5)

c(
  pearson  = cor(x, y, method = "pearson"),
  spearman = cor(x, y, method = "spearman"),
  kendall  = cor(x, y, method = "kendall")
)
#>   pearson  spearman   kendall
#> 0.7855... 1.0000000 1.0000000
```

Pearson sees a strong but imperfect link because the cloud isn't a straight line. Spearman and Kendall both return exactly 1.0 because the ranks of `y` are in perfect lockstep with the ranks of `x`. That difference is the entire reason rank-based correlation exists: when only the ordering matters, raw values mislead you and ranks tell the truth.

The single-number `cor()` call is convenient, but `cor.test()` is what you should actually run on real data. It returns the coefficient plus a p-value and a hypothesis-test framework around it.

```r title="Spearman test object from cor.test()"
st_spear <- cor.test(x, y, method = "spearman")
st_spear
#>   Spearman's rank correlation rho
#>
#> data:  x and y
#> S = 0, p-value = 5.511e-06
#> alternative hypothesis: true rho is not equal to 0
#> sample estimates:
#> rho
#>   1
```

The output object holds the estimate (`st_spear$estimate`), the test statistic (`st_spear$statistic`, here Spearman's `S`), and the p-value. Notice the test object has no `conf.int` field for rank methods, only Pearson gets one out of the box. We will fix that with a bootstrap in a later section.

[TIP]
**Pass `method` as a string, not a symbol.** Both `cor()` and `cor.test()` need `method = "spearman"` or `method = "kendall"` in quotes. Forget the quotes and R will look for an object named `spearman` and throw an error.

**Try it:** Generate a perfectly monotonic but cubic relationship and confirm that Spearman returns exactly 1 while Pearson does not.

```r title="Your turn: monotonic but nonlinear"
ex_a <- 1:10
ex_b <- ex_a^3

# your code here: compute Pearson and Spearman correlations of ex_a and ex_b


#> Expected: pearson < 1, spearman == 1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Pearson vs Spearman on cubic data"
c(
  pearson  = cor(ex_a, ex_b, method = "pearson"),
  spearman = cor(ex_a, ex_b, method = "spearman")
)
#>   pearson  spearman
#> 0.9173925 1.0000000
```

**Explanation:** The cubic transform preserves rank order perfectly, so Spearman is 1. Pearson scores the linear fit and falls short because a cubic curve isn't a straight line.

</details>

## What do ranks do to your data?

Both methods start with the same step: replace each value with its position in the sorted order. R's `rank()` function does this, ties get the average position. Once you have ranks, distribution shape and outlier magnitude no longer matter, only the ordering does.

```r title="Ranks of iris columns"
iris_sl <- iris$Sepal.Length
iris_pl <- iris$Petal.Length

head(iris_sl)
#> [1] 5.1 4.9 4.7 4.6 5.0 5.4

head(rank(iris_sl))
#> [1] 39.0 21.5 11.0  6.5 31.0 56.5
```

The first row had `Sepal.Length = 5.1`, which is the 39th smallest value in the column (with ties broken by averaging). The numbers 5.1 and 39.0 carry the same information about ordering, but 39.0 is bounded between 1 and `length(iris_sl)` and is invariant to any monotonic transformation of the original data.

![Spearman ranks the data and runs Pearson on the ranks; Kendall ranks the data and counts concordant vs discordant pairs.](screenshots/Spearman-and-Kendall-Correlation-in-R-rank-transform.webp)

*Figure 1: From a raw `(x, y)` pair, both methods compute ranks; Spearman then runs a Pearson correlation on those ranks while Kendall counts pairwise agreement.*

That's not a metaphor, it's the literal definition. `cor(x, y, method = "spearman")` is `cor(rank(x), rank(y))`. If you've ever wondered why Spearman feels like "Pearson but robust", that's why.

```r title="Spearman equals Pearson on ranks"
identical_check <- c(
  spearman_direct = cor(iris_sl, iris_pl, method = "spearman"),
  pearson_on_ranks = cor(rank(iris_sl), rank(iris_pl))
)
identical_check
#>   spearman_direct pearson_on_ranks
#>         0.8717538        0.8717538
```

Both routes give exactly 0.8718. Inside `cor()`, R computes Pearson against the rank vectors when you pass `method = "spearman"`, and that's the entire algorithm. The robustness people talk about is just the rank step, the rest is plain Pearson arithmetic.

[KEY INSIGHT]
**Spearman is Pearson on ranks.** Replace each variable by its `rank()` and you have a Spearman correlation. This single sentence explains every property of rho: outlier resistance, scale invariance, monotonic-only sensitivity. Once raw values become ranks, any further outliers or scale tricks are invisible to the calculation.

**Try it:** Verify the same identity on `mtcars$mpg` and `mtcars$wt`.

```r title="Your turn: confirm identity on mtcars"
# your code here: show cor(mpg, wt, method="spearman") equals cor(rank(mpg), rank(wt))


#> Expected: both numbers equal, around -0.886
```

<details>
<summary>Click to reveal solution</summary>

```r title="mtcars Spearman identity"
c(
  direct   = cor(mtcars$mpg, mtcars$wt, method = "spearman"),
  on_ranks = cor(rank(mtcars$mpg), rank(mtcars$wt))
)
#>     direct   on_ranks
#> -0.8864220 -0.8864220
```

**Explanation:** Heavier cars rank lower in mpg with very few exceptions, so the rank correlation is strongly negative. The two routes agree because they are the same calculation.

</details>

## How is Kendall's tau actually counted?

Kendall takes a different path. Instead of running Pearson on ranks, it walks every possible pair of observations and asks one yes-or-no question: do they move in the same direction?

A pair of observations $(i, j)$ is **concordant** if both $x_i < x_j$ and $y_i < y_j$ (or both reversed). It is **discordant** if one variable goes up while the other goes down. Pairs tied on either variable are excluded from the count.

![Each pair is either concordant, discordant, or tied; tau is the net agreement across all pairs.](screenshots/Spearman-and-Kendall-Correlation-in-R-concordant-pairs.webp)

*Figure 2: Each pair of observations is concordant, discordant, or tied. Kendall's tau is the net agreement scaled by total pairs.*

The basic formula (Kendall's tau-a) collects those counts:

$$\tau_a = \frac{C - D}{\binom{n}{2}}$$

Where:
- $C$ = number of concordant pairs
- $D$ = number of discordant pairs
- $\binom{n}{2} = n(n-1)/2$ = total number of pairs

Let's count pairs by hand on a tiny dataset and confirm `cor()` gives the same answer.

```r title="Count concordant and discordant pairs"
toy_x <- c(1, 2, 3, 4, 5, 6)
toy_y <- c(2, 1, 4, 3, 6, 5)

pairs_mat <- combn(length(toy_x), 2)
signs <- sign(toy_x[pairs_mat[2, ]] - toy_x[pairs_mat[1, ]]) *
         sign(toy_y[pairs_mat[2, ]] - toy_y[pairs_mat[1, ]])

conc <- sum(signs ==  1)
disc <- sum(signs == -1)
n    <- length(toy_x)

c(concordant = conc,
  discordant = disc,
  tau_manual = (conc - disc) / (n * (n - 1) / 2),
  tau_cor    = cor(toy_x, toy_y, method = "kendall"))
#> concordant discordant  tau_manual    tau_cor
#> 12.0000000  3.0000000  0.6000000  0.6000000
```

The 6-point dataset has $\binom{6}{2} = 15$ pairs total. Twelve agree on direction, three disagree, none are tied. The hand-rolled tau and `cor()`'s answer agree at 0.60. Read tau as a probability statement: of every 100 random pairs, 80 agree and 20 disagree, the net surplus is 60% of pairs, hence tau = 0.60.

[KEY INSIGHT]
**Kendall measures pair agreement, Spearman measures rank distance.** Both summarise monotonic association, but tau answers "what fraction of pairs agree on direction?" while rho answers "how close are the rank vectors as a Pearson correlation?". That's why tau has a clean probabilistic reading while rho lives on the more familiar Pearson scale.

**Try it:** Flip one of the `toy_y` values so an extra pair becomes discordant, then recompute tau.

```r title="Your turn: flip a value and re-tally"
ex_x <- c(1, 2, 3, 4, 5, 6)
ex_y <- c(2, 1, 4, 3, 6, 5)
ex_y[6] <- 1

# your code here: recompute Kendall's tau and explain the change


#> Expected: tau drops below 0.6
```

<details>
<summary>Click to reveal solution</summary>

```r title="tau after flipping y[6]"
cor(ex_x, ex_y, method = "kendall")
#> [1] -0.06666667
```

**Explanation:** Setting `ex_y[6] <- 1` flips the last point from the highest rank to a tied lowest rank. Most of the pairs involving that point become discordant or tied, and tau collapses from 0.6 to roughly zero.

</details>

## How do ties change rho and tau?

Real data has ties. Survey scores repeat, body counts come in whole numbers, sensors hit floor and ceiling values. Ties matter because the basic tau formula assumed no ties existed, and the basic rank formula assumed every observation got a unique rank.

`cor.test(method = "kendall")` fixes the tie problem with **tau-b**, which divides by an adjusted denominator so the maximum value is still ±1 even when many ties exist. R does this for you. The cost is that the exact p-value formula no longer applies, so you'll see a warning.

```r title="Kendall test on data with ties"
tx <- c(1, 2, 3, 4, 5, 6, 7, 8)
ty <- c(1, 2, 2, 3, 4, 4, 5, 6)

cor.test(tx, ty, method = "kendall")
#> Warning message:
#> In cor.test.default(tx, ty, method = "kendall") :
#>   Cannot compute exact p-value with ties
#>
#>   Kendall's rank correlation tau
#>
#> data:  tx and ty
#> z = 3.2, p-value = 0.001374
#> alternative hypothesis: true tau is not equal to 0
#> sample estimates:
#>     tau
#> 0.9636
```

The reported `tau = 0.9636` is tau-b, ties-corrected. The warning is not an error, R has fallen back to the asymptotic (large-sample) z approximation because the exact permutation distribution can't handle ties. For comparison, here's the uncorrected tau-a, which uses the unadjusted denominator $n(n-1)/2$ and is dragged below tau-b by the ties.

```r title="Manual tau-a vs tau-b on tied data"
n <- length(tx)
pairs_mat <- combn(n, 2)
dx <- sign(tx[pairs_mat[2, ]] - tx[pairs_mat[1, ]])
dy <- sign(ty[pairs_mat[2, ]] - ty[pairs_mat[1, ]])

conc <- sum(dx * dy ==  1)
disc <- sum(dx * dy == -1)

# Ties-on-y count needed for tau-b denominator
ties_x <- sum(dx == 0)
ties_y <- sum(dy == 0)

tau_a <- (conc - disc) / (n * (n - 1) / 2)
tau_b <- (conc - disc) / sqrt((n*(n-1)/2 - ties_x) * (n*(n-1)/2 - ties_y))

c(tau_a = tau_a, tau_b = tau_b,
  cor_kendall = cor(tx, ty, method = "kendall"))
#>      tau_a      tau_b cor_kendall
#> 0.9285714  0.9636241  0.9636241
```

Tau-a is 0.929, tau-b is 0.964, and `cor()` returns 0.964. R uses tau-b. Tau-a understates the strength because the three tied pairs sit in the denominator but contribute zero to the numerator. Tau-b removes them from the denominator too, which is why it can still hit ±1 on tied data.

[WARNING]
**The "exact p-value with ties" warning is informational, not a bug.** R is telling you it switched to the large-sample z approximation because the exact Mann-Kendall permutation calculation needs unique values. For n > 30 the asymptotic p-value is fine. For small samples with ties, treat the p-value as approximate.

[NOTE]
**Three flavours of tau exist.** `cor.test()` returns tau-b. Tau-a uses the basic n(n-1)/2 denominator. Tau-c is for rectangular tables where the two variables have very different numbers of unique values (rare in practice). For pairs of numeric or ordinal variables of the same length, tau-b is the right default.

**Try it:** Compare Kendall on `mtcars$cyl` vs `mtcars$mpg` (heavy ties in `cyl`, only three unique values) against `mtcars$wt` vs `mtcars$mpg` (almost no ties). You should see one warning and one quiet call.

```r title="Your turn: ties vs no-ties"
# your code here: run two cor.test calls with method="kendall" and observe the warnings


#> Expected: cyl vs mpg triggers the ties warning, wt vs mpg does not
```

<details>
<summary>Click to reveal solution</summary>

```r title="Kendall on cyl vs wt"
cor.test(mtcars$cyl, mtcars$mpg, method = "kendall")$estimate
#>        tau
#> -0.7953544

cor.test(mtcars$wt, mtcars$mpg, method = "kendall")$estimate
#>        tau
#> -0.7278321
```

**Explanation:** The first call triggers the ties warning because `cyl` only takes three values. The second call runs without a warning because `wt` is continuous. Both estimates are valid, just computed via different p-value paths.

</details>

## How do you test significance and get a confidence interval?

For Pearson correlation, `cor.test()` returns a Fisher's-z confidence interval for free. For Spearman and Kendall it does not, and that is a real gap many tutorials skip. The fix is a bootstrap.

First the part `cor.test()` does give you, the p-value:

```r title="Spearman significance on mtcars"
mt_test <- cor.test(mtcars$mpg, mtcars$hp, method = "spearman")
mt_test
#>   Spearman's rank correlation rho
#>
#> data:  mtcars$mpg and mtcars$hp
#> S = 10337, p-value = 5.086e-12
#> alternative hypothesis: true rho is not equal to 0
#> sample estimates:
#>        rho
#> -0.8946646
```

Reading the test: `rho = -0.895`, so as horsepower goes up, mpg ranks fall sharply. The p-value is 5e-12, so there's no realistic chance this association is noise. But there's no confidence-interval line, only the point estimate.

A percentile bootstrap fixes that. Resample row indices with replacement, recompute rho on each sample, then take the 2.5% and 97.5% quantiles.

```r title="Bootstrap 95% CI for Spearman's rho"
set.seed(202)
n <- nrow(mtcars)
B <- 2000

boot_rho <- replicate(B, {
  idx <- sample.int(n, replace = TRUE)
  cor(mtcars$mpg[idx], mtcars$hp[idx], method = "spearman")
})

ci_rho <- quantile(boot_rho, c(0.025, 0.975))
c(estimate = mt_test$estimate,
  lower_95 = ci_rho[[1]],
  upper_95 = ci_rho[[2]])
#> estimate.rho     lower_95     upper_95
#>   -0.8946646   -0.9457...   -0.8081...
```

Two thousand resamples is enough for a stable 95% percentile CI. The interval is `(-0.95, -0.81)`, which excludes zero by a wide margin and matches the picosmall p-value's verdict. Now you can publish a sentence like "rho = -0.89 (95% bootstrap CI [-0.95, -0.81])" instead of just an estimate.

[TIP]
**2000 resamples is plenty for a percentile CI; 10,000 if it's going in a paper.** The bootstrap variance shrinks like `1/sqrt(B)`, so doubling B only narrows the simulation noise by 30%. Save the heavy budget for the final figure, prototype with 1000.

**Try it:** Repeat the bootstrap for Kendall's tau on the same pair. One word changes.

```r title="Your turn: bootstrap CI for Kendall's tau"
set.seed(303)

# your code here: build a 95% bootstrap CI for cor(mpg, hp, method = "kendall")


#> Expected: tau around -0.74, CI roughly (-0.85, -0.60)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Kendall bootstrap CI"
set.seed(303)
boot_tau <- replicate(2000, {
  idx <- sample.int(nrow(mtcars), replace = TRUE)
  cor(mtcars$mpg[idx], mtcars$hp[idx], method = "kendall")
})
quantile(boot_tau, c(0.025, 0.5, 0.975))
#>       2.5%        50%      97.5%
#> -0.8460... -0.7415... -0.6090...
```

**Explanation:** Only `method = "spearman"` changed to `"kendall"`. Notice the tau estimate (-0.74) is smaller in magnitude than rho (-0.89) on the same data, that's expected and we'll explain why next.

</details>

## When should you choose Spearman over Kendall?

Most tutorials show you both methods and stop there. Here is the rubric I actually use, plus the magnitude trap that catches everyone the first time.

![A short decision tree for picking between Kendall's tau-b and Spearman's rho.](screenshots/Spearman-and-Kendall-Correlation-in-R-decision-tree.webp)

*Figure 3: A short decision tree for choosing between Kendall's tau and Spearman's rho.*

The decision usually comes down to four factors:

| Factor | Prefer Kendall (tau-b) | Prefer Spearman (rho) |
|---|---|---|
| Sample size | Small (n < 30) | Larger samples |
| Ties | Heavy ties, ordinal scales | Mostly continuous |
| Interpretation | Probability of agreement on a pair | Familiar 0–1 strength scale |
| Robustness | Less sensitive to a single observation flip | Slightly more sensitive |

Kendall's tau is the more "robust" of the two in a precise sense: a single flipped observation moves tau by less than it moves rho, because tau aggregates over many pairwise comparisons rather than one big rank vector. That makes it the safer default for small samples. Spearman wins on familiarity, most readers know that 0.7 is a strong correlation, fewer have a feel for tau = 0.5.

The trap is comparing magnitudes. Tau and rho are not on the same scale.

```r title="Side-by-side rho and tau on mtcars"
mt_rho <- cor(mtcars$mpg, mtcars$wt, method = "spearman")
mt_tau <- cor(mtcars$mpg, mtcars$wt, method = "kendall")

c(spearman_rho = mt_rho,
  kendall_tau  = mt_tau,
  ratio_tau_over_rho = mt_tau / mt_rho)
#>     spearman_rho      kendall_tau ratio_tau_over_rho
#>       -0.8864220       -0.7278321         0.8211591
```

On the same dataset, Kendall's tau is always smaller in magnitude than Spearman's rho, with a ratio that hovers around 0.7 to 0.85 for typical bivariate-normal-ish data. The reason is structural: tau is a probability difference (concordant minus discordant fraction), while rho is a Pearson coefficient on ranks, and those scales just aren't equivalent. For bivariate normal data the relationship is approximately $\tau \approx (2/\pi) \arcsin(\rho)$.

[KEY INSIGHT]
**A tau of 0.5 is roughly as strong as a rho of 0.7.** Don't panic when Kendall returns a smaller number than Spearman, that's by construction. Compare each method only against itself across studies, and pick one for your report so the reader doesn't have to translate.

**Try it:** Compute both on `airquality$Temp` and `airquality$Ozone`. Confirm `|tau| < |rho|` and watch out for the missing values.

```r title="Your turn: rho vs tau on airquality"
aq <- na.omit(airquality[, c("Temp", "Ozone")])

# your code here: compute Spearman and Kendall correlations of Temp and Ozone


#> Expected: rho around 0.77, tau around 0.58
```

<details>
<summary>Click to reveal solution</summary>

```r title="airquality rho vs tau"
c(
  rho = cor(aq$Temp, aq$Ozone, method = "spearman"),
  tau = cor(aq$Temp, aq$Ozone, method = "kendall")
)
#>       rho       tau
#> 0.7740430 0.5891734
```

**Explanation:** `na.omit` is essential because both columns have missing values; otherwise `cor()` returns NA. The ratio tau/rho is about 0.76, in the expected band.

</details>

## Practice Exercises

The exercises below run in the same WebR session as the tutorial code, so use distinct variable names (`my_*`) to keep your work isolated.

### Exercise 1: Rank a correlation matrix

From the four numeric columns of `iris`, compute every pairwise Spearman correlation, drop the self-correlations, and sort the unique pairs by descending absolute strength. Save the result to `my_pairs`.

```r title="Exercise 1: ranked Spearman pairs"
# Hint: use cor(iris[, 1:4], method = "spearman"), then as.data.frame.table()
# and filter for upper-triangle pairs only.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution: ranked Spearman pairs"
my_mat <- cor(iris[, 1:4], method = "spearman")
my_pairs <- as.data.frame.table(my_mat, responseName = "rho")
my_pairs <- my_pairs[as.character(my_pairs$Var1) < as.character(my_pairs$Var2), ]
my_pairs <- my_pairs[order(-abs(my_pairs$rho)), ]
my_pairs
#>            Var1         Var2        rho
#> 12 Petal.Length  Petal.Width  0.9376668
#>  9 Sepal.Length  Petal.Length 0.8818981
#> 13 Sepal.Length  Petal.Width  0.8344207
#>  5  Sepal.Width  Petal.Length -0.3096351
#>  6  Sepal.Width  Petal.Width  -0.2890317
#>  2 Sepal.Length  Sepal.Width  -0.1667777
```

**Explanation:** `cor()` returns a square matrix; `as.data.frame.table` flattens it. The string-comparison filter keeps only the upper triangle so each pair appears once. `order(-abs(rho))` sorts by strength regardless of sign.

</details>

### Exercise 2: Bootstrap CI for Kendall's tau

Build a 95% percentile bootstrap CI for Kendall's tau between `mpg` and `hp` in `mtcars` with 2000 resamples. Use `set.seed(404)` and store the lower and upper bounds in `my_ci`.

```r title="Exercise 2: bootstrap tau CI"
# Hint: replicate() over sample.int(nrow(mtcars), replace = TRUE), then quantile().

set.seed(404)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution: bootstrap tau CI"
set.seed(404)
my_boot <- replicate(2000, {
  idx <- sample.int(nrow(mtcars), replace = TRUE)
  cor(mtcars$mpg[idx], mtcars$hp[idx], method = "kendall")
})
my_ci <- quantile(my_boot, c(0.025, 0.975))
my_ci
#>       2.5%      97.5%
#> -0.8454... -0.6021...
```

**Explanation:** The bootstrap mirrors the in-text example, only `"spearman"` becomes `"kendall"` and the seed changes. The CI excludes zero, confirming the negative association is real.

</details>

### Exercise 3: Pick a method on tied data

You want to correlate `mtcars$cyl` (only 4, 6, 8) with `mtcars$gear` (only 3, 4, 5). Compute both Spearman's rho and Kendall's tau-b with their `cor.test()` p-values, then justify which estimate you would report. Save the chosen value to `my_choice`.

```r title="Exercise 3: tied-data method choice"
# Hint: run two cor.test() calls and decide based on the warnings and the
# tie-handling explanation from earlier in this tutorial.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution: prefer Kendall under heavy ties"
my_spear <- suppressWarnings(cor.test(mtcars$cyl, mtcars$gear, method = "spearman"))
my_kend  <- suppressWarnings(cor.test(mtcars$cyl, mtcars$gear, method = "kendall"))

c(spearman_rho = my_spear$estimate,
  kendall_tau  = my_kend$estimate)
#> spearman_rho.rho   kendall_tau.tau
#>       -0.5283655        -0.4870572

my_choice <- my_kend$estimate
```

**Explanation:** Both methods warn about ties because each variable has only three unique values, but tau-b's denominator is built to absorb ties cleanly. Kendall is the safer report on data this lumpy. Spearman's rank-averaging trick still works, but its denominator was derived for unique ranks, so the magnitude is harder to defend in a small-N tied-data context.

</details>

## Complete Example

Here is the full rank-based correlation workflow on a real dataset, end to end. We'll quantify the link between daily temperature and ozone in `airquality`, handle missing values, run both methods, and produce a publication-style sentence with a bootstrap CI.

```r title="End-to-end rank correlation on airquality"
set.seed(505)

aq <- na.omit(airquality[, c("Temp", "Ozone")])

three_methods <- c(
  pearson  = cor(aq$Temp, aq$Ozone, method = "pearson"),
  spearman = cor(aq$Temp, aq$Ozone, method = "spearman"),
  kendall  = cor(aq$Temp, aq$Ozone, method = "kendall")
)
three_methods
#>   pearson  spearman   kendall
#> 0.6985414 0.7740430 0.5891734

spear_test <- cor.test(aq$Temp, aq$Ozone, method = "spearman")

n <- nrow(aq)
boot_rho <- replicate(2000, {
  idx <- sample.int(n, replace = TRUE)
  cor(aq$Temp[idx], aq$Ozone[idx], method = "spearman")
})
ci <- quantile(boot_rho, c(0.025, 0.975))

sprintf(
  "rho = %.2f (95%% bootstrap CI [%.2f, %.2f]), p < 0.001",
  spear_test$estimate, ci[[1]], ci[[2]]
)
#> [1] "rho = 0.77 (95% bootstrap CI [0.67, 0.85]), p < 0.001"
```

The Pearson coefficient (0.70) understates the relationship because Ozone is right-skewed with several extreme values. Spearman's rho lifts to 0.77 once ranks neutralise the skew, and the bootstrap CI of (0.67, 0.85) confirms a strong, well-determined positive association. Kendall's tau is 0.59, smaller in magnitude as expected, with the same directional verdict.

## Summary

| Concept | What to remember |
|---|---|
| When to use rank correlation | Monotonic but nonlinear, ordinal data, or outlier-prone variables |
| Spearman's rho | Pearson correlation computed on `rank(x)` and `rank(y)` |
| Kendall's tau | (concordant − discordant) / total pairs, ties-corrected as tau-b |
| `cor.test()` returns | Coefficient, test statistic, p-value, but no CI for rank methods |
| Confidence interval | Use a percentile bootstrap (2000 reps is enough) |
| Magnitude trap | Tau is typically ~0.7 × rho on the same data, by construction |
| The tie warning | Asymptotic p-value is used; fine for n > 30 |

## References

1. R Core Team. `cor.test`, *R Documentation*. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/cor.test.html)
2. Kendall, M.G. (1938). A new measure of rank correlation. *Biometrika*, 30(1/2), 81–93. [Link](https://www.jstor.org/stable/2332226)
3. Spearman, C. (1904). The proof and measurement of association between two things. *American Journal of Psychology*, 15(1), 72–101. [Link](https://www.jstor.org/stable/1412159)
4. Hollander, M., Wolfe, D.A., Chicken, E. (2014). *Nonparametric Statistical Methods*, 3rd ed., Wiley. Chapter 8.
5. Newson, R. (2002). Parameters behind 'nonparametric' statistics: Kendall's tau, Somers' D and median differences. *Stata Journal*, 2(1), 45–64. [Link](https://www.stata-journal.com/article.html?article=st0007)
6. Croux, C., Dehon, C. (2010). Influence functions of the Spearman and Kendall correlation measures. *Statistical Methods & Applications*, 19, 497–515. [Link](https://link.springer.com/article/10.1007/s10260-010-0142-z)
7. UVA Library StatLab. Correlation: Pearson, Spearman, and Kendall's tau. [Link](https://library.virginia.edu/data/articles/correlation-pearson-spearman-and-kendalls-tau)

## Continue Learning

1. [Correlation in R: Choose Between Pearson, Spearman, and Kendall](Correlation-in-R.html), the parent overview that covers all three methods and visualisation with `corrplot`.
2. [Wilcoxon, Mann-Whitney & Kruskal-Wallis in R](Wilcoxon-Mann-Whitney-and-Kruskal-Wallis-in-R.html), other rank-based tests for group comparisons rather than association.
3. [When to Use Nonparametric Tests in R](When-to-Use-Nonparametric-Tests-in-R.html), the broader decision framework for choosing rank-based methods over parametric ones.
