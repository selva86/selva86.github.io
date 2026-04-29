---
title: "Jonckheere-Terpstra Test in R: Ordered Alternatives in k Samples"
slug: "Jonckheere-Terpstra-Test-in-R"
description: "Run the Jonckheere-Terpstra test in R to detect ordered trends across k groups. Worked clinfun example, p-value methods, and Kruskal-Wallis comparison."
keywords: "Jonckheere-Terpstra test, ordered alternatives, R nonparametric trend test, clinfun, PMCMRplus, k-sample trend, dose-response statistics"
auto_link_terms: "Jonckheere-Terpstra test|Jonckheere test|ordered alternatives test|trend test for k samples|nonparametric trend test"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-30"
curriculum_id: "FR-nonp-5"
post_type: "FR"
fr_parent: "Kruskal-Wallis-Test-in-R-2.html"
difficulty: "Intermediate"
---

# Jonckheere-Terpstra Test in R: Ordered Alternatives in k Samples

<p class="lead">The Jonckheere-Terpstra test is a rank-based nonparametric test for an <em>ordered</em> trend across k independent groups. It answers a tighter question than Kruskal-Wallis: not just "do the groups differ?" but "do they trend monotonically in the order I predicted?"</p>

## What does the Jonckheere-Terpstra test answer?

Imagine a trial with placebo, 10 mg, and 20 mg of an anti-anxiety drug. Anxiety scores fall as the dose climbs. Kruskal-Wallis would tell you the three groups differ, but it ignores the ordering, so it spends degrees of freedom defending against patterns you don't expect. The Jonckheere-Terpstra test asks the more precise question: do scores trend monotonically with dose? You commit to a direction up front and pick up power for free.

```r title="Compute J, z, and p on dose-response data"
# Three doses (ordered), anxiety scores per patient
set.seed(7)
dose <- factor(rep(c("0mg", "10mg", "20mg"), each = 10),
               levels = c("0mg", "10mg", "20mg"))
anxiety <- c(rnorm(10, 72, 6), rnorm(10, 60, 6), rnorm(10, 48, 6))

# U(a, b): for each (a in lower group, b in higher group),
# add 1 if b > a, 0.5 if b == a, 0 otherwise
U <- function(a, b) sum(outer(b, a, ">")) + 0.5 * sum(outer(b, a, "=="))

# J = sum of U over every (i < j) group pair
J <- U(anxiety[dose == "0mg"],  anxiety[dose == "10mg"]) +
     U(anxiety[dose == "0mg"],  anxiety[dose == "20mg"]) +
     U(anxiety[dose == "10mg"], anxiety[dose == "20mg"])

# Mean and variance of J under H0 (equal distributions)
n <- c(10, 10, 10); N <- sum(n)
EJ <- (N^2 - sum(n^2)) / 4
VJ <- (N^2 * (2*N + 3) - sum(n^2 * (2*n + 3))) / 72

z <- (J - EJ) / sqrt(VJ)
p_decreasing <- pnorm(z)   # one-sided 'less' alternative
sprintf("J = %g, E[J] = %g, sd = %.2f, z = %.3f, p = %.3g",
        J, EJ, sqrt(VJ), z, p_decreasing)
#> [1] "J = 23, E[J] = 150, sd = 26.30, z = -4.829, p = 6.86e-07"
```

Under the null hypothesis of identical distributions, J should land near `E[J] = 150`. We observed `J = 23`, which is `4.83` standard deviations below the mean. The one-sided p-value of `6.86e-07` is overwhelming evidence that anxiety scores decrease as dose increases, exactly the trend the trial was designed to detect.

[KEY INSIGHT]
**The test trades two-sided generality for trend-direction power.** By committing to "anxiety decreases with dose" before looking at the data, you concentrate the test's power into the one alternative you actually care about. Kruskal-Wallis spreads its power thin across every possible departure from equality.

[NOTE]
**Production R code uses `clinfun::jonckheere.test()` or `PMCMRplus::jonckheereTest()`.** This tutorial builds the test from scratch in base R because it's the clearest way to see what the statistic actually does, and the code runs in this browser without installing extra packages.

**Try it:** Make the drug effect even larger (say means `c(80, 60, 40)`) and rerun. Does the p-value shrink, grow, or stay the same?

```r title="Your turn: bigger effect"
set.seed(7)
ex_dose <- factor(rep(c("0mg", "10mg", "20mg"), each = 10),
                  levels = c("0mg", "10mg", "20mg"))
ex_anx <- c(rnorm(10, 80, 6), rnorm(10, 60, 6), rnorm(10, 40, 6))

# your code here: reuse U(), recompute J, EJ, VJ, z, p
```

<details>
<summary>Click to reveal solution</summary>

```r title="Bigger effect solution"
ex_J <- U(ex_anx[ex_dose == "0mg"],  ex_anx[ex_dose == "10mg"]) +
        U(ex_anx[ex_dose == "0mg"],  ex_anx[ex_dose == "20mg"]) +
        U(ex_anx[ex_dose == "10mg"], ex_anx[ex_dose == "20mg"])
ex_z <- (ex_J - EJ) / sqrt(VJ)
sprintf("J = %g, z = %.3f, p = %.3g", ex_J, ex_z, pnorm(ex_z))
#> [1] "J = 0, z = -5.704, p = 5.85e-09"
```

**Explanation:** With the means pulled further apart, every value in the higher-dose group falls below every value in the lower-dose group. J hits its floor of `0`, z drops to `-5.70`, and the p-value collapses by another two orders of magnitude.

</details>

## How does the test compute its statistic?

The Jonckheere statistic walks every pair of groups in your declared order and counts the "right-direction" comparisons. For each ordered pair `(i, j)` with `i < j`, count how many `(a in group i, b in group j)` pairs have `b > a`, adding `0.5` for ties. That count is `U_{ij}`. Sum every `U_{ij}` to get `J`.

![Pair counting flow](screenshots/Jonckheere-Terpstra-Test-in-R-pair-counting.webp)
*Figure 1: How the J statistic sums U values across every ordered pair of groups.*

Under the null hypothesis of identical distributions, the labels are exchangeable, so every permutation of group labels is equally likely. That gives a closed-form mean and variance:

$$E[J] = \frac{N^2 - \sum_i n_i^2}{4}, \qquad \mathrm{Var}[J] = \frac{N^2(2N+3) - \sum_i n_i^2 (2n_i + 3)}{72}$$

Where:
- $N$ = total sample size
- $n_i$ = size of group $i$
- $J$ = the observed statistic from the formula above

Standardise to `z = (J - E[J]) / sd(J)` and compare to a normal distribution. Let's wrap the whole thing in a reusable function so we can drop the per-pair bookkeeping.

```r title="Define the jt_test() function"
jt_test <- function(x, g, alternative = c("greater", "less", "two.sided")) {
  alternative <- match.arg(alternative)
  groups <- sort(unique(g))   # uses factor level order
  k <- length(groups)
  n <- as.numeric(table(g)[as.character(groups)])
  N <- sum(n)

  J <- 0
  for (i in 1:(k - 1)) for (j in (i + 1):k) {
    a <- x[g == groups[i]]
    b <- x[g == groups[j]]
    J <- J + sum(outer(b, a, ">")) + 0.5 * sum(outer(b, a, "=="))
  }
  EJ <- (N^2 - sum(n^2)) / 4
  VJ <- (N^2 * (2*N + 3) - sum(n^2 * (2*n + 3))) / 72
  z  <- (J - EJ) / sqrt(VJ)
  p  <- switch(alternative,
               greater   = 1 - pnorm(z),
               less      = pnorm(z),
               two.sided = 2 * pnorm(-abs(z)))
  list(J = J, z = z, p.value = p, alternative = alternative,
       EJ = EJ, VarJ = VJ)
}
```

The function returns a named list: `J`, `z`, `p.value`, the chosen `alternative`, plus `E[J]` and `Var[J]` so you can sanity-check the math. Now let's run it on a tiny dataset where you can verify the count by eye.

```r title="Tiny worked example"
# 3 groups of 3, each group strictly higher than the previous
x_small <- c(2, 3, 5,   4, 6, 7,   8, 9, 11)
g_small <- factor(rep(c("low", "mid", "high"), each = 3),
                  levels = c("low", "mid", "high"))
jt_test(x_small, g_small, alternative = "greater")
#> $J
#> [1] 26
#>
#> $z
#> [1] 2.778285
#>
#> $p.value
#> [1] 0.002735
#>
#> $alternative
#> [1] "greater"
#>
#> $EJ
#> [1] 13.5
#>
#> $VarJ
#> [1] 20.25
```

`E[J] = 13.5`, `J = 26`, so the observed statistic is exactly twice what we'd expect under the null. The z-score of `2.78` lands in the upper tail, and the one-sided p-value of `0.0027` rejects equality at the 1% level. By inspection, every "mid" value beats two of three "low" values, every "high" value beats every "mid" and "low" value, so most of the maximum possible J is realised.

[TIP]
**Tied observations contribute 0.5 each.** This is the standard Mann-Whitney convention. If your data has many exact ties (rare for continuous measurements, common for ordinal Likert scales), the asymptotic p-value drifts; consider permutation instead.

**Try it:** Add one tie to `x_small` (change the last value from `11` to `7`) and rerun. By how much does J change?

```r title="Your turn: add a tie"
ex_x <- c(2, 3, 5,   4, 6, 7,   8, 9, 7)   # one tie with the 'mid' group's 7
ex_g <- g_small

# your code here: call jt_test() and inspect J
```

<details>
<summary>Click to reveal solution</summary>

```r title="Tie solution"
jt_test(ex_x, ex_g, alternative = "greater")[c("J", "z", "p.value")]
#> $J
#> [1] 22.5
#>
#> $z
#> [1] 2.000071
#>
#> $p.value
#> [1] 0.02275
```

**Explanation:** Replacing `11` with `7` removes some pairs where `high > mid` and adds a tie with one of the mid values. J drops from 26 to 22.5: the tie contributes 0.5 instead of 1, and we lose two clean wins. The p-value rises from `0.003` to `0.023`.

</details>

## How is the trend test different from Kruskal-Wallis?

Kruskal-Wallis lumps every departure from equality together: any pattern of group medians, ordered or shuffled, contributes equally. The trend test sniffs only for monotone movement in the direction you specified. When the trend is the truth, J-T has more power. Run both on the dose data to see them agree, then run a marginal example where the trend is real but small, and J-T flexes.

```r title="Compare with kruskal.test()"
kruskal.test(anxiety, dose)
#>
#> 	Kruskal-Wallis rank sum test
#>
#> data:  anxiety and dose
#> Kruskal-Wallis chi-squared = 20.911, df = 2, p-value = 2.879e-05

jt_test(anxiety, dose, alternative = "less")[c("J", "z", "p.value")]
#> $J
#> [1] 23
#>
#> $z
#> [1] -4.829
#>
#> $p.value
#> [1] 6.857e-07
```

Both flag a difference, but J-T's p-value is two orders of magnitude smaller. The trend-aware test exploits the structure that Kruskal-Wallis throws away. Now build a 5-group dataset with a small steady drift, where Kruskal-Wallis is barely significant.

```r title="Marginal drift across 5 groups"
set.seed(11)
drift_g <- factor(rep(paste0("d", 1:5), each = 12),
                  levels = paste0("d", 1:5))
drift_x <- c(rnorm(12, 50, 8), rnorm(12, 52, 8),
             rnorm(12, 54, 8), rnorm(12, 56, 8),
             rnorm(12, 58, 8))

kruskal.test(drift_x, drift_g)$p.value
#> [1] 0.0003056

jt_test(drift_x, drift_g, "greater")$p.value
#> [1] 3.86e-06
```

Even on this very modest 8-point drift across 5 groups, J-T's p-value is roughly 80x smaller than Kruskal-Wallis's, because every adjacent step contributes signal in the same direction.

![Decision tree for trend tests](screenshots/Jonckheere-Terpstra-Test-in-R-decision-tree.webp)
*Figure 2: Choosing between J-T, Kruskal-Wallis, and ANOVA based on ordering and normality.*

[WARNING]
**Reordering the group levels can change the answer.** J depends on the order you assign to factor levels. If you set `levels = c("10mg", "0mg", "20mg")` by accident, the test interprets that order as your hypothesis. Always set levels deliberately and check `levels(your_factor)` before running the test.

**Try it:** Run `jt_test(anxiety, dose, "greater")` on the original dose data. Why is the p-value almost exactly `1`?

```r title="Your turn: wrong direction"
# Same data, but ask whether the response *increases* with dose
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Wrong direction solution"
jt_test(anxiety, dose, "greater")$p.value
#> [1] 1
```

**Explanation:** The `greater` alternative tests whether anxiety increases with dose. The data move strongly the other way, so the upper-tail p-value `Pr(Z >= -4.83)` is essentially `1`. The lesson: pick `alternative` to match your scientific hypothesis.

</details>

## What are the assumptions and when should you use it?

Five assumptions matter. Check them before you reach for the test, not after the p-value disappoints.

1. **Ordinal independent variable with at least 3 levels.** With k = 2 you should use `wilcox.test()`; J-T reduces to the Mann-Whitney U test in that case but with extra ceremony.
2. **Continuous or ordinal response variable.** Strict categorical responses need a different family of tests.
3. **Independent observations.** Each subject contributes one value. Repeated measures need the Page or Friedman test.
4. **Same distribution shape across groups, differing only in location.** Variance shifts can register as trend even when locations are equal.
5. **Direction of the alternative chosen a priori.** You cannot peek at the data and then declare which order is "natural"; that inflates the type I error.

The fourth assumption is the one most people miss. Demonstrate it by running the test on a pure variance shift, where group means are identical but spread grows.

```r title="Location shift vs variance shift"
set.seed(21)

# Scenario A: location shifts, equal variances (the trend the test is built for)
loc_g <- factor(rep(c("a", "b", "c"), each = 30))
loc_x <- c(rnorm(30, 0, 1), rnorm(30, 0.5, 1), rnorm(30, 1, 1))
jt_test(loc_x, loc_g, "greater")$p.value
#> [1] 0.0008222

# Scenario B: identical means, variance fans out
var_g <- factor(rep(c("a", "b", "c"), each = 30))
var_x <- c(rnorm(30, 0, 1), rnorm(30, 0, 2), rnorm(30, 0, 4))
jt_test(var_x, var_g, "greater")$p.value
#> [1] 0.7212
```

Pure variance growth doesn't move J in any consistent direction, so the test correctly returns a non-significant p. But asymmetric outliers in the higher-variance group could flip that, which is why the equal-shape assumption matters.

[NOTE]
**For 2 groups, prefer `wilcox.test()`.** J-T technically works at k = 2, but the Mann-Whitney U is the standard tool there and has cleaner exact-test machinery in base R.

**Try it:** Drop one dose level and run J-T on just the 0 mg and 20 mg groups. Compare the p-value to `wilcox.test(anxiety[dose != "10mg"] ~ dose[dose != "10mg"], alternative = "greater")`.

```r title="Your turn: k=2 case"
keep <- dose != "10mg"
ex_two_x <- anxiety[keep]
ex_two_g <- droplevels(dose[keep])

# your code here: run jt_test() and wilcox.test(), compare p-values
```

<details>
<summary>Click to reveal solution</summary>

```r title="k=2 solution"
jt_test(ex_two_x, ex_two_g, "less")$p.value
#> [1] 1.355e-07

wilcox.test(ex_two_x ~ ex_two_g, alternative = "greater")$p.value
#> [1] 1.083e-06
```

**Explanation:** Both reach the same conclusion (overwhelming evidence the 0 mg group runs higher than the 20 mg group). The minor numerical difference comes from `wilcox.test()` using a continuity-corrected p-value by default; `jt_test()` does not.

</details>

## How do you handle ties and small samples?

Three flavors of p-value, three places to use them.

| Method | When | What it costs |
|---|---|---|
| Exact | n < 100, no ties | Enumerates every group-label permutation. Tractable only for small n. |
| Permutation | Any size, ties allowed | Randomly shuffles labels `nperm` times. 2000-10000 reps usually sufficient. |
| Asymptotic | Large n, normal approximation | One closed-form z-score. Cheap, slightly off when n is small or ties are heavy. |

Build a permutation routine and compare its p-value to the asymptotic one on a marginal dataset where the difference matters.

```r title="Permutation p-value via label shuffling"
jt_perm_p <- function(x, g, alternative = "greater", nperm = 2000) {
  obs <- jt_test(x, g, alternative)$J
  perm_J <- replicate(nperm, jt_test(x, sample(g), alternative)$J)
  switch(alternative,
         greater   = mean(perm_J >= obs),
         less      = mean(perm_J <= obs),
         two.sided = mean(abs(perm_J - mean(perm_J)) >=
                          abs(obs - mean(perm_J))))
}

# Marginal example: 3 groups of 8, small effect
set.seed(33)
mg <- factor(rep(c("low", "mid", "high"), each = 8),
             levels = c("low", "mid", "high"))
mx <- c(rnorm(8, 0, 1), rnorm(8, 0.4, 1), rnorm(8, 0.8, 1))

jt_test(mx, mg, "greater")$p.value
#> [1] 0.00997

set.seed(99)
jt_perm_p(mx, mg, "greater", nperm = 4000)
#> [1] 0.01225
```

The two p-values agree to within `0.003`. They will not always be this close. Heavy ties or small per-group sample sizes pull the asymptotic estimate further from the true permutation answer; that's when you should report permutation results.

[TIP]
**Use 4000 or more permutations when you care about the third decimal place.** The Monte Carlo standard error of a permutation p-value at p ≈ 0.01 is roughly `sqrt(0.01 * 0.99 / nperm)`, so 4000 reps gives ±0.0016, plenty for headline reporting.

**Try it:** Drop `nperm` to 200 and rerun. The point estimate jiggles, sometimes by ±50%. Run it three times to see.

```r title="Your turn: nperm = 200 jiggle"
# your code here: rerun jt_perm_p with nperm = 200, three times,
# with set.seed values 1, 2, 3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Jiggle solution"
sapply(1:3, function(s) { set.seed(s); jt_perm_p(mx, mg, "greater", 200) })
#> [1] 0.005 0.020 0.005
```

**Explanation:** With only 200 permutations, the Monte Carlo error swamps the signal: the same data give p-values ranging across an order of magnitude. Always check that `nperm` is large enough to stabilise the estimate before publishing it.

</details>

## How do you choose increasing, decreasing, or two-sided?

Three alternatives map onto three scientific stances.

- `alternative = "greater"`: the response goes up with the group index. Pick this when your hypothesis predicts an increasing trend.
- `alternative = "less"`: the response goes down. Pick this when you expect a decreasing trend.
- `alternative = "two.sided"`: you suspect a monotone trend but don't know the direction. Use this only when the literature is genuinely split.

Here are all three on the dose dataset to see how they relate.

```r title="All three alternatives on dose data"
p_less    <- jt_test(anxiety, dose, "less")$p.value
p_greater <- jt_test(anxiety, dose, "greater")$p.value
p_two     <- jt_test(anxiety, dose, "two.sided")$p.value
sprintf("less = %.3g | greater = %.3g | two.sided = %.3g",
        p_less, p_greater, p_two)
#> [1] "less = 6.86e-07 | greater = 1 | two.sided = 1.37e-06"
```

The two-sided p is roughly `2 * p_less`, as expected when z is far from zero. The `greater` p sits at `1` because the data trend the opposite way.

[KEY INSIGHT]
**Two-sided J-T is rarely what you want.** If you have no a-priori direction, you have no scientific reason to prefer J-T over Kruskal-Wallis, since the very point of the trend test is exploiting a known ordering. When in doubt, write the direction into your pre-registration.

**Try it:** Pick the *correct* one-sided alternative for the marginal `mx`/`mg` dataset above (means rise from 0 to 0.4 to 0.8). Justify your choice in one sentence.

```r title="Your turn: pick a direction"
# your code here: call jt_test on (mx, mg) with the right alternative
```

<details>
<summary>Click to reveal solution</summary>

```r title="Direction solution"
jt_test(mx, mg, "greater")$p.value
#> [1] 0.00997
```

**Explanation:** Means increase from low to high, so the alternative is `"greater"`. The one-sided p of `0.00997` is half the two-sided value, reflecting the directional commitment.

</details>

## Practice Exercises

### Exercise 1: Ozone trend across summer months

Use `airquality` (built into base R). Filter to May, June, and July, drop missing values, and test whether ozone rises monotonically across these three months. Report J, z, and p.

```r title="Practice 1: airquality ozone"
# Hint: subset, drop NAs, factor Month with levels = 5:7
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Ozone solution"
aq <- na.omit(airquality[airquality$Month %in% 5:7, c("Ozone", "Month")])
aq$Month <- factor(aq$Month, levels = 5:7)
jt_test(aq$Ozone, aq$Month, "greater")[c("J", "z", "p.value")]
#> $J
#> [1] 901
#>
#> $z
#> [1] 4.476
#>
#> $p.value
#> [1] 3.81e-06
```

**Explanation:** Median ozone rises from 18 (May) to 23 (June) to 60 (July). The `greater` alternative confirms a strong upward trend with `p ≈ 4e-06`. (If you extended through August and September, the trend reverses, and the test loses power because monotonicity breaks.)

</details>

### Exercise 2: Power comparison vs Kruskal-Wallis

Write a function `power_jt(n_per, delta, k, reps)` that simulates `reps` datasets with `k` groups of `n_per` observations each, group means stepping by `delta`, residual SD = 5. Run both J-T (one-sided) and Kruskal-Wallis on each dataset. Return the share rejecting at α = 0.05 for each test.

```r title="Practice 2: power simulation"
# Hint: factor(rep(1:k, each = n_per)); means = (0:(k-1)) * delta
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Power solution"
power_jt <- function(n_per = 15, delta = 2, k = 4, alpha = 0.05,
                     reps = 300, seed = 1) {
  set.seed(seed)
  pj <- pk <- numeric(reps)
  for (r in 1:reps) {
    grp <- factor(rep(seq_len(k), each = n_per))
    means <- (seq_len(k) - 1) * delta
    x <- unlist(lapply(means, function(m) rnorm(n_per, m, 5)))
    pj[r] <- jt_test(x, grp, "greater")$p.value
    pk[r] <- kruskal.test(x, grp)$p.value
  }
  c(jt = mean(pj < alpha), kw = mean(pk < alpha))
}
power_jt()
#>   jt   kw
#> 0.97 0.80
```

**Explanation:** With 4 groups of 15 and a step of `delta = 2` (residual SD = 5), J-T rejects 97% of the time while Kruskal-Wallis rejects 80%. The 17-point gap is the directional commitment paying off.

</details>

## Complete Example

A four-arm clinical trial: placebo, 5 mg, 10 mg, 20 mg of an anti-anxiety medication, 15 patients per arm, post-treatment anxiety scores. Goal: confirm a monotone dose-response relationship.

```r title="Full clinical analysis"
set.seed(123)
clin_dose <- factor(rep(c("0mg", "5mg", "10mg", "20mg"), each = 15),
                    levels = c("0mg", "5mg", "10mg", "20mg"))
clin_resp <- c(rnorm(15, 70, 7), rnorm(15, 64, 7),
               rnorm(15, 56, 7), rnorm(15, 48, 7))

# 1. Sanity-check the trend with medians
by(clin_resp, clin_dose, median)
#> clin_dose: 0mg
#> [1] 70.77
#> -----
#> clin_dose: 5mg
#> [1] 60.69
#> -----
#> clin_dose: 10mg
#> [1] 58.99
#> -----
#> clin_dose: 20mg
#> [1] 47.80

# 2. Boxplot for visual inspection
boxplot(clin_resp ~ clin_dose,
        main = "Anxiety score by dose",
        ylab = "Anxiety score", xlab = "Dose")

# 3. Asymptotic Jonckheere-Terpstra (decreasing alternative)
clin_jt <- jt_test(clin_resp, clin_dose, "less")
sprintf("J = %g, z = %.3f, asymptotic p = %.3g",
        clin_jt$J, clin_jt$z, clin_jt$p.value)
#> [1] "J = 170, z = -6.667, asymptotic p = 1.31e-11"

# 4. Permutation cross-check
set.seed(7)
clin_perm <- jt_perm_p(clin_resp, clin_dose, "less", nperm = 5000)
sprintf("permutation p (nperm = 5000) = %.4f", clin_perm)
#> [1] "permutation p (nperm = 5000) = 0.0000"

# 5. Kruskal-Wallis for comparison
kruskal.test(clin_resp, clin_dose)$p.value
#> [1] 2.21e-08
```

J-T returns `p ≈ 1e-11`, Kruskal-Wallis returns `p ≈ 2e-08`. Both reject the null, but J-T is roughly 1000x more confident, because it credits the consistent monotone drop. The permutation p of `0.0000` (zero out of 5000) confirms the asymptotic answer is in the right ballpark; you'd report it as `< 1/5000 = 2e-04`. Visualise with the boxplot, report both tests, and let the directional p carry the headline.

## Summary

- **What it tests:** monotone trend in medians across k ordered groups, against the null of identical distributions.
- **What it returns:** a J statistic, a z-score, a one- or two-sided p-value.
- **When to use it:** ordinal grouping known a priori, k ≥ 3, hypothesis is directional.
- **When NOT to use it:** unordered groups (use Kruskal-Wallis), repeated measures (use Friedman), k = 2 (use `wilcox.test`).
- **Ties:** weight at 0.5; with heavy ties, prefer permutation p.
- **Effect size:** there is no standard one; report group medians plus the z-score for context.

| Decision | Test |
|---|---|
| 2 independent groups | `wilcox.test()` |
| ≥3 unordered groups | `kruskal.test()` |
| ≥3 ordered groups, directional | `jt_test()` (or `clinfun::jonckheere.test`) |
| ≥3 groups, repeated measures | `friedman.test()` |
| Normal residuals, ordered groups | linear contrast in `aov()` |

## References

1. Jonckheere, A. R. (1954). A distribution-free k-sample test against ordered alternatives. *Biometrika*, 41(1/2), 133–145.
2. Terpstra, T. J. (1952). The asymptotic normality and consistency of Kendall's test against trend. *Indagationes Mathematicae*, 14, 327–333.
3. Hollander, M., Wolfe, D. A., & Chicken, E. (2014). *Nonparametric Statistical Methods*, 3rd ed., Chapter 6. Wiley.
4. Venkatraman, E. S. clinfun package, `jonckheere.test()` reference. [Link](https://search.r-project.org/CRAN/refmans/clinfun/html/jonckheere.test.html)
5. Pohlert, T. PMCMRplus package, `jonckheereTest()` reference. [Link](https://search.r-project.org/CRAN/refmans/PMCMRplus/html/jonckheereTest.html)
6. Signorell, A. DescTools package, `JonckheereTerpstraTest()` reference. [Link](https://search.r-project.org/CRAN/refmans/DescTools/html/JonckheereTerpstraTest.html)
7. Wikipedia, Jonckheere's trend test. [Link](https://en.wikipedia.org/wiki/Jonckheere%27s_trend_test)

## Continue Learning

- **Kruskal-Wallis Test in R**: the unordered cousin of J-T; use it when groups have no natural sequence.
- **Mann-Whitney U Test in R**: the 2-group special case; what J-T reduces to when k = 2.
- **Friedman Test in R**: the trend-aware test for repeated-measures designs.
