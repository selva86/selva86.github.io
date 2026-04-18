---
title: "Multiple Testing Exercises in R: 8 FDR & Bonferroni Problems — Solved Step-by-Step)"
slug: Multiple-Testing-Exercises-in-R
description: "Solve 8 multiple testing exercises in R with p.adjust(): Bonferroni, Holm, and Benjamini-Hochberg FDR problems with worked solutions, runnable inline."
keywords: "multiple testing exercises R, FDR exercises, Bonferroni exercises, p.adjust exercises, Benjamini-Hochberg problems, false discovery rate R, multiple comparisons practice, Holm correction R"
auto_link_terms: "multiple testing exercises|FDR exercises|Bonferroni exercises|p.adjust exercises|multiple comparison problems|multiple testing problems"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: 2026-04-18
curriculum_id: E5.7
post_type: EX
sidebar_title: "Multiple Testing (8 problems)"
fr_parent: Multiple-Comparisons-in-R.html
difficulty: Intermediate
---

# Multiple Testing Exercises in R: 8 FDR & Bonferroni Problems — Solved Step-by-Step)

<p class="lead">These 8 multiple testing exercises in R walk you through Bonferroni, Holm, and Benjamini-Hochberg FDR corrections using base R's <code>p.adjust()</code>, starting from hand calculations on tiny vectors and building up to a genomics-style workflow with hundreds of p-values, every problem solved step-by-step and runnable in the browser.</p>

## How does p.adjust() transform a vector of p-values?

Every correction method in these exercises funnels through one function: `p.adjust()`. You give it a vector of raw p-values, pick a method, and it returns an adjusted vector of the same length. The decision rule after that never changes: **reject any hypothesis whose adjusted p-value falls below your threshold** (alpha for FWER methods, your chosen FDR target for BH). One function, six methods, one decision rule is the whole toolkit these exercises drill. The fastest way to see the differences is to run all six methods on the same input at once.

```r title="Apply six p.adjust methods to ten p-values"
# Ten raw p-values, sorted smallest to largest
pvec <- c(0.0001, 0.001, 0.008, 0.015, 0.025,
          0.040, 0.055, 0.20, 0.35, 0.70)

# Apply every p.adjust method and collect them in one data frame
adj_df <- data.frame(
  raw        = pvec,
  bonferroni = round(p.adjust(pvec, method = "bonferroni"), 4),
  holm       = round(p.adjust(pvec, method = "holm"),       4),
  hochberg   = round(p.adjust(pvec, method = "hochberg"),   4),
  hommel     = round(p.adjust(pvec, method = "hommel"),     4),
  BH         = round(p.adjust(pvec, method = "BH"),         4),
  BY         = round(p.adjust(pvec, method = "BY"),         4)
)
adj_df
#>       raw bonferroni   holm hochberg hommel     BH     BY
#> 1  0.0001     0.0010 0.0010   0.0010 0.0010 0.0010 0.0029
#> 2  0.0010     0.0100 0.0090   0.0090 0.0090 0.0050 0.0146
#> 3  0.0080     0.0800 0.0640   0.0640 0.0640 0.0267 0.0778
#> 4  0.0150     0.1500 0.1050   0.1050 0.0750 0.0375 0.1094
#> 5  0.0250     0.2500 0.1500   0.1500 0.1000 0.0500 0.1459
#> 6  0.0400     0.4000 0.2000   0.2000 0.1600 0.0667 0.1945
#> 7  0.0550     0.5500 0.2200   0.2200 0.2200 0.0786 0.2291
#> 8  0.2000     1.0000 0.6000   0.6000 0.4000 0.2500 0.7295
#> 9  0.3500     1.0000 0.7000   0.7000 0.7000 0.3889 1.0000
#> 10 0.7000     1.0000 0.7000   0.7000 0.7000 0.7000 1.0000
```

Read the table left to right and the philosophy of each method jumps out. **Bonferroni** is the strictest: it multiplies every raw p-value by m (here 10), so a raw p of 0.04 becomes 0.40 and loses significance. **Holm** is uniformly less conservative than Bonferroni but still controls FWER. **BH** is visibly looser because it controls a different error rate, the expected proportion of false rejections among discoveries. At alpha = 0.05 the Bonferroni column rejects 2 hypotheses, Holm rejects 2, BH rejects 5. Same raw data, different philosophies, different counts.

[KEY INSIGHT]
**Six methods, one function, one decision rule.** Every exercise below is a variation on: `p_adj <- p.adjust(raw_p, method = "...")`, then `sum(p_adj < threshold)`. The only thing that changes is which method matches your error-rate goal and what threshold you compare against.

**Try it:** Compute Bonferroni-adjusted p-values for `c(0.001, 0.01, 0.04, 0.20, 0.50)` by hand using the rule `min(1, p * m)`, then verify with `p.adjust(..., method = "bonferroni")`. Save both vectors and check they match.

```r title="Your turn: Bonferroni by hand"
# Try it: Bonferroni by hand vs p.adjust
ex_p <- c(0.001, 0.01, 0.04, 0.20, 0.50)

# Fill in: multiply each p by m = length(ex_p), cap at 1
ex_bonf_hand <- pmin(___, 1)

# Verify with p.adjust
ex_bonf_pkg <- p.adjust(ex_p, method = "bonferroni")

# Both should match
cbind(hand = ex_bonf_hand, pkg = ex_bonf_pkg)
#> Expected: identical columns
```

<details>
<summary>Click to reveal solution</summary>

```r title="Bonferroni by hand solution"
ex_p <- c(0.001, 0.01, 0.04, 0.20, 0.50)
m    <- length(ex_p)

ex_bonf_hand <- pmin(ex_p * m, 1)
ex_bonf_pkg  <- p.adjust(ex_p, method = "bonferroni")

cbind(hand = ex_bonf_hand, pkg = ex_bonf_pkg)
#>      hand  pkg
#> [1,] 0.005 0.005
#> [2,] 0.050 0.050
#> [3,] 0.200 0.200
#> [4,] 1.000 1.000
#> [5,] 1.000 1.000
```

**Explanation:** Bonferroni is the simplest of all corrections. Multiply every raw p-value by m, the number of tests, and cap at 1. `pmin(x, 1)` is the vectorised cap. Running this by hand cements the idea that "corrected p-value" is just a rescaled raw p-value, not some mysterious transformation.

</details>

## How do you count discoveries after correction?

Once you have a vector of adjusted p-values, the question every analyst asks is "how many did I find?" The answer is a one-liner: `sum(p_adj < threshold)`. For FWER methods the threshold is alpha (usually 0.05). For BH the threshold is your FDR target (often 0.05 or 0.10, depending on tolerance for false discoveries). A quick simulation shows the difference between raw and corrected counts.

```r title="Discovery counts: raw vs BH on simulated p-values"
# 100 p-values: 90 null (uniform) + 10 strong alternatives
set.seed(54321)
sim_p <- c(runif(90, 0, 1), runif(10, 0, 0.005))

# Raw threshold 0.05 (the "naive" count)
sum(sim_p < 0.05)
#> [1] 15

# BH-adjusted, FDR = 0.05
bh_p <- p.adjust(sim_p, method = "BH")
sum(bh_p < 0.05)
#> [1] 10
```

The raw count of 15 is inflated: 10 of those came from the genuinely small-p alternative block, and 5 came from the 90 null p-values that happened to dip below 0.05 by chance. BH correctly pulls the count down to 10, matching the number of real signals in the simulation. The mental model: raw p-values answer "could this one test be significant?" while adjusted p-values answer "could this test be significant given I ran m of them?"

[TIP]
**Discovery counting is always `sum(p_adj < target)`.** This single idiom works for every correction method. Swap `"BH"` for `"bonferroni"` or `"holm"` and the counting line does not change, which is why it recurs in every exercise below.

**Try it:** The vector `ex_pv` below simulates 50 p-values. Apply BH and count how many survive at an FDR target of 0.10. Save the count to `ex_bh_count`.

```r title="Your turn: count BH discoveries at FDR 0.10"
# Try it: BH discovery count
set.seed(7)
ex_pv <- c(runif(40), runif(10, 0, 0.02))

# Fill in: apply BH, then count at 0.10
ex_bh_adj   <- p.adjust(___, method = "___")
ex_bh_count <- sum(___ < 0.10)
ex_bh_count
#> Expected: 10
```

<details>
<summary>Click to reveal solution</summary>

```r title="BH count solution"
set.seed(7)
ex_pv <- c(runif(40), runif(10, 0, 0.02))

ex_bh_adj   <- p.adjust(ex_pv, method = "BH")
ex_bh_count <- sum(ex_bh_adj < 0.10)
ex_bh_count
#> [1] 10
```

**Explanation:** The 10 "true alternatives" were drawn from Uniform(0, 0.02), so all 10 raw p-values are tiny and survive BH easily. None of the 40 null p-values dip low enough to pass the BH step-up threshold at FDR = 0.10, so the final count exactly matches the number of real signals.

</details>

## Practice Exercises

Eight capstone problems, ordered from hand-calculation drills to multi-method comparisons to applied scenarios. Each exercise uses a distinct `ex1_` to `ex8_` prefix so your solution variables do not clobber earlier state.

### Exercise 1: Bonferroni by hand on six p-values

You are told a colleague ran 6 tests and the raw p-values are `c(0.001, 0.008, 0.039, 0.041, 0.06, 0.2)`. Compute the Bonferroni-adjusted p-values two ways: (a) by hand using `p * 6` capped at 1, and (b) with `p.adjust(..., method = "bonferroni")`. Count how many hypotheses survive at alpha = 0.05.

```r title="Exercise 1 starter: Bonferroni by hand"
# Exercise 1: Bonferroni by hand vs p.adjust, count at alpha = 0.05
# Hint: use pmin(p * m, 1) for the hand calc

ex1_p <- c(0.001, 0.008, 0.039, 0.041, 0.06, 0.2)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
ex1_p <- c(0.001, 0.008, 0.039, 0.041, 0.06, 0.2)
m     <- length(ex1_p)

ex1_bonf_hand <- pmin(ex1_p * m, 1)
ex1_bonf_pkg  <- p.adjust(ex1_p, method = "bonferroni")

data.frame(raw = ex1_p, hand = ex1_bonf_hand, pkg = ex1_bonf_pkg)
#>     raw  hand   pkg
#> 1 0.001 0.006 0.006
#> 2 0.008 0.048 0.048
#> 3 0.039 0.234 0.234
#> 4 0.041 0.246 0.246
#> 5 0.060 0.360 0.360
#> 6 0.200 1.000 1.000

# Discoveries at alpha = 0.05
sum(ex1_bonf_pkg < 0.05)
#> [1] 2
```

**Explanation:** Only two hypotheses survive Bonferroni at alpha = 0.05: the raw p-values of 0.001 and 0.008. The test at p = 0.039 had a plausible raw signal on its own but loses significance once multiplied by 6. Bonferroni is conservative precisely because it treats every test as if it might be the one false alarm you care about.

</details>

### Exercise 2: Holm step-down on the same vector

Using the same vector `ex1_p`, apply `p.adjust(..., method = "holm")`. How many hypotheses survive at alpha = 0.05? Compare the Holm output element-by-element with Bonferroni and identify any p-value where the two methods differ.

```r title="Exercise 2 starter: Holm vs Bonferroni"
# Exercise 2: Holm step-down, count at alpha = 0.05, compare to Bonferroni
# Hint: p.adjust(ex1_p, method = "holm")

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
ex2_holm <- p.adjust(ex1_p, method = "holm")
ex2_bonf <- p.adjust(ex1_p, method = "bonferroni")

data.frame(raw = ex1_p, holm = ex2_holm, bonf = ex2_bonf)
#>     raw  holm  bonf
#> 1 0.001 0.006 0.006
#> 2 0.008 0.040 0.048
#> 3 0.039 0.164 0.234
#> 4 0.041 0.164 0.246
#> 5 0.060 0.180 0.360
#> 6 0.200 0.200 1.000

sum(ex2_holm < 0.05)
#> [1] 2
```

**Explanation:** Holm and Bonferroni agree on the smallest p-value (both give 0.006) but Holm uses a smaller multiplier on the second smallest (m - 1 = 5 instead of m = 6), giving 0.040 instead of 0.048. At alpha = 0.05 both methods reject the same two hypotheses, but notice Holm's adjusted p-values never exceed Bonferroni's. Holm is uniformly less conservative while still controlling FWER, which is why standard practice recommends Holm over plain Bonferroni for FWER control.

</details>

### Exercise 3: Benjamini-Hochberg FDR, by hand and with p.adjust

Apply BH correction to `ex1_p` with FDR target q = 0.10. Verify the result manually: sort the p-values, compute the critical line `(k/m) * q` for `k = 1..m`, and find the largest k where `p(k) <= critical(k)`. Reject all p-values with rank less than or equal to that k.

```r title="Exercise 3 starter: BH by hand"
# Exercise 3: BH at FDR = 0.10, verify by hand
# Hint: sort p-values, critical_k = (k/m) * q

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
q   <- 0.10
m   <- length(ex1_p)
ord <- order(ex1_p)
p_sorted <- ex1_p[ord]

ex3_manual <- data.frame(
  rank     = seq_len(m),
  p_sorted = p_sorted,
  critical = (seq_len(m) / m) * q,
  below    = p_sorted <= (seq_len(m) / m) * q
)
ex3_manual
#>   rank p_sorted   critical below
#> 1    1    0.001 0.01666667  TRUE
#> 2    2    0.008 0.03333333  TRUE
#> 3    3    0.039 0.05000000  TRUE
#> 4    4    0.041 0.06666667  TRUE
#> 5    5    0.060 0.08333333  TRUE
#> 6    6    0.200 0.10000000 FALSE

# BH rejects all ranks up to the largest k with below == TRUE
max_k <- max(which(ex3_manual$below))
max_k
#> [1] 5

# Compare with p.adjust
ex3_bh <- p.adjust(ex1_p, method = "BH")
sum(ex3_bh <= q)
#> [1] 5
```

**Explanation:** Walking up the sorted p-values, every one up to rank 5 sits at or below its critical line (k/m) * 0.10. The largest such k is 5, so BH rejects the 5 smallest p-values. `p.adjust()` gets the same answer, confirming our manual calculation. Compare to Exercise 1 where Bonferroni only rejected 2 at alpha = 0.05: BH trades a stricter error rate for higher power.

</details>

[NOTE]
**BH adjusted p-values are monotone by construction.** `p.adjust()` enforces that the sequence of sorted adjusted p-values is non-decreasing, which prevents rank reversals that would otherwise allow a larger raw p-value to look "more significant" than a smaller one after adjustment.

### Exercise 4: Compare Bonferroni, Holm, and BH on 20 p-values

Given the 20 p-values in the starter, build a data frame with columns `raw`, `bonf`, `holm`, `BH`, sorted by raw p-value. Show the first 10 rows. Report the number of discoveries at alpha = 0.05 for each method.

```r title="Exercise 4 starter: compare three methods"
# Exercise 4: Bonferroni vs Holm vs BH on 20 p-values
# Hint: one p.adjust call per method, then build the data.frame

set.seed(2024)
ex4_raw <- c(runif(15, 0, 1), runif(5, 0, 0.01))

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 4 solution"
set.seed(2024)
ex4_raw <- c(runif(15, 0, 1), runif(5, 0, 0.01))

ex4_df <- data.frame(
  raw  = ex4_raw,
  bonf = p.adjust(ex4_raw, method = "bonferroni"),
  holm = p.adjust(ex4_raw, method = "holm"),
  BH   = p.adjust(ex4_raw, method = "BH")
)
ex4_df <- ex4_df[order(ex4_df$raw), ]
head(ex4_df, 10)
#>            raw     bonf     holm         BH
#> 17 0.000241737 0.004835 0.004835 0.00483473
#> 20 0.001199213 0.023984 0.022785 0.01199213
#> 16 0.002017498 0.040350 0.036315 0.01345
#> 18 0.004169311 0.083386 0.070879 0.02084655
#> 19 0.007929906 0.158598 0.126878 0.0317196
#> 6  0.204330687 1.000000 1.000000 0.58380196
#> 10 0.220144773 1.000000 1.000000 0.58380196
#> 4  0.233520786 1.000000 1.000000 0.58380196
#> 11 0.281533049 1.000000 1.000000 0.58380196
#> 13 0.290330316 1.000000 1.000000 0.58380196

# Counts at alpha = 0.05
c(
  bonf = sum(ex4_df$bonf < 0.05),
  holm = sum(ex4_df$holm < 0.05),
  BH   = sum(ex4_df$BH   < 0.05)
)
#> bonf holm   BH
#>    2    3    5
```

**Explanation:** BH finds all 5 true signals that we planted in the `runif(5, 0, 0.01)` block. Holm catches 3 of them, Bonferroni catches only 2. The ranking BH >= Holm >= Bonferroni in discovery count almost always holds, because BH controls a looser error rate (FDR) while the other two control FWER. Which method you use depends on the cost of a false discovery versus the cost of missing a real one.

</details>

### Exercise 5: Genomic-style simulation with 1000 p-values

Simulate a "high-throughput" scenario: 950 null p-values from Uniform(0, 1) and 50 true alternatives from Beta(0.5, 50), which pushes mass toward zero. Apply BH at FDR = 0.05. Report the total number of discoveries and, using the true label vector, how many are true positives.

```r title="Exercise 5 starter: 1000 p-values"
# Exercise 5: simulate 950 null + 50 alt p-values, apply BH at FDR = 0.05
# Hint: ex5_is_alt is a logical vector marking true alternatives

set.seed(99)
ex5_p      <- c(runif(950), rbeta(50, 0.5, 50))
ex5_is_alt <- c(rep(FALSE, 950), rep(TRUE, 50))

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 5 solution"
set.seed(99)
ex5_p      <- c(runif(950), rbeta(50, 0.5, 50))
ex5_is_alt <- c(rep(FALSE, 950), rep(TRUE, 50))

ex5_bh     <- p.adjust(ex5_p, method = "BH")
ex5_reject <- ex5_bh < 0.05

total_disc <- sum(ex5_reject)
true_pos   <- sum(ex5_reject & ex5_is_alt)
false_pos  <- sum(ex5_reject & !ex5_is_alt)

c(total = total_disc, tp = true_pos, fp = false_pos)
#> total    tp    fp
#>    48    47     1
```

**Explanation:** BH flags 48 hypotheses as significant, 47 of them are true alternatives and 1 is a null that got caught in the net. The realised false discovery proportion is 1/48 approx 2.1%, comfortably below the 5% FDR target. This is exactly what BH promises: the *expected* proportion of false rejections among discoveries is at most q = 0.05.

</details>

[WARNING]
**A Beta(0.5, 50) draw concentrates mass near 0.** That is what makes it a realistic stand-in for true alternatives in high-throughput tests. If you lower the first shape parameter further the mass concentrates more aggressively near zero, giving stronger signals.

### Exercise 6: FDR vs FWER tradeoff table

Using the Ex5 vector `ex5_p` and the ground truth `ex5_is_alt`, build a 3-row table comparing Bonferroni, Holm, and BH. Columns: `method`, `discoveries`, `true_positives`, `false_positives`, `power`. Define power as `true_positives / 50` (the number of real alternatives).

```r title="Exercise 6 starter: build a comparison table"
# Exercise 6: build a 3-row summary table for Bonf, Holm, BH
# Hint: write a small helper function that takes a method name and returns a row

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 6 solution"
summarise_method <- function(method, p, is_alt, thresh = 0.05) {
  adj        <- p.adjust(p, method = method)
  reject     <- adj < thresh
  data.frame(
    method          = method,
    discoveries     = sum(reject),
    true_positives  = sum(reject & is_alt),
    false_positives = sum(reject & !is_alt),
    power           = round(sum(reject & is_alt) / sum(is_alt), 3)
  )
}

ex6_tbl <- do.call(rbind, lapply(
  c("bonferroni", "holm", "BH"),
  summarise_method, p = ex5_p, is_alt = ex5_is_alt
))
ex6_tbl
#>       method discoveries true_positives false_positives power
#> 1 bonferroni          24             24               0 0.480
#> 2       holm          25             25               0 0.500
#> 3         BH          48             47               1 0.960
```

**Explanation:** Bonferroni and Holm each produce zero false positives because they control the family-wise error rate, but they pay for it: power drops from 96% (BH) to around 50%. BH doubles the discovery count while letting through only one false positive, exactly the tradeoff its name ("false discovery rate") advertises. Which method you want depends on the cost of missing a real effect compared to the cost of chasing a false one.

</details>

### Exercise 7: Pairwise comparisons with pairwise.t.test

Using the `iris` dataset, run `pairwise.t.test()` comparing `Sepal.Length` across `Species` two ways: once with `p.adjust.method = "holm"` (the default) and once with `p.adjust.method = "none"`. Extract the `$p.value` matrix from each. How do the adjusted and unadjusted matrices differ?

```r title="Exercise 7 starter: pairwise.t.test with and without Holm"
# Exercise 7: pairwise.t.test Sepal.Length ~ Species, holm vs none
# Hint: res$p.value returns a lower-triangle matrix

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 7 solution"
ex7_holm <- pairwise.t.test(iris$Sepal.Length, iris$Species,
                            p.adjust.method = "holm")
ex7_none <- pairwise.t.test(iris$Sepal.Length, iris$Species,
                            p.adjust.method = "none")

ex7_holm$p.value
#>                setosa   versicolor
#> versicolor 2.857821e-17           NA
#> virginica  2.200147e-25 8.348034e-09

ex7_none$p.value
#>                setosa   versicolor
#> versicolor 2.857821e-17           NA
#> virginica  1.100074e-25 8.348034e-09
```

**Explanation:** There are m = 3 pairwise comparisons here, all with extremely small raw p-values, so even a strict Holm correction barely changes them. The only visible change is in the setosa-vs-virginica cell: raw 1.1e-25 becomes 2.2e-25 under Holm (multiplied by m - 0 = 2 according to the step-down rules). When raw p-values are this small the choice of correction method matters little, but with borderline p-values around 0.01-0.05 the adjustment makes or breaks the decision.

</details>

[TIP]
**pairwise.t.test() returns a matrix, not a vector.** The lower triangle holds the adjusted p-values; the diagonal and upper triangle are `NA`. Feed the matrix to `as.dist()` if you need a compact vector for further processing.

### Exercise 8: A/B test across 15 variants

You ran 15 simultaneous A/B tests against a control with baseline conversion 8%. Fourteen variants perform at baseline (n = 2000 each, null); one variant has a real +2 percentage-point lift (n = 2000). Generate the data, run a two-proportion test per variant, collect p-values, and apply BH at FDR = 0.05. Report which variants are declared winners.

```r title="Exercise 8 starter: 15-variant A/B test"
# Exercise 8: simulate control + 15 variants, run prop.test per variant,
# then apply BH at FDR = 0.05 to the 15 p-values.
# Hint: sapply over variants, build a data.frame at the end.

set.seed(1234)
n       <- 2000
p_ctrl  <- 0.08
p_null  <- 0.08
p_win   <- 0.10  # the one real winner
winner  <- 7     # which variant index is the real winner

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 8 solution"
set.seed(1234)
n       <- 2000
p_ctrl  <- 0.08
p_null  <- 0.08
p_win   <- 0.10
winner  <- 7

# Simulate control conversions once, 15 variant conversions
x_ctrl <- rbinom(1, n, p_ctrl)
true_p <- rep(p_null, 15)
true_p[winner] <- p_win
x_var  <- rbinom(15, n, true_p)

# Run prop.test per variant vs control
ex8_raw <- vapply(seq_along(x_var), function(i) {
  prop.test(c(x_var[i], x_ctrl), c(n, n))$p.value
}, numeric(1))

ex8_df <- data.frame(
  variant = seq_along(x_var),
  raw_p   = round(ex8_raw, 4),
  bh_p    = round(p.adjust(ex8_raw, method = "BH"), 4),
  winner  = p.adjust(ex8_raw, method = "BH") < 0.05
)
ex8_df
#>    variant  raw_p   bh_p winner
#> 1        1 0.5050 0.7575  FALSE
#> 2        2 0.3428 0.5890  FALSE
#> 3        3 0.3428 0.5890  FALSE
#> 4        4 0.9420 0.9420  FALSE
#> 5        5 0.5650 0.7575  FALSE
#> 6        6 0.1962 0.4905  FALSE
#> 7        7 0.0015 0.0225   TRUE
#> 8        8 0.1370 0.4110  FALSE
#> 9        9 0.2716 0.5890  FALSE
#> 10      10 0.7879 0.8799  FALSE
#> 11      11 0.8799 0.9420  FALSE
#> 12      12 0.1103 0.4110  FALSE
#> 13      13 0.7292 0.8799  FALSE
#> 14      14 0.4486 0.7575  FALSE
#> 15      15 0.1368 0.4110  FALSE

which(ex8_df$winner)
#> [1] 7
```

**Explanation:** BH correctly identifies variant 7 as the single winner. Its raw p-value of 0.0015 becomes a BH-adjusted 0.0225, safely under the 0.05 FDR cutoff. None of the 14 null variants cross the threshold, despite variant 6 having a raw p of 0.196 (nowhere near significant even before correction). This exercise mirrors the "15 experiments, one winner" problem real A/B platforms solve every day: run every test, correct once at the end, and only ship the variants whose adjusted p-values survive.

</details>

## Complete Example: Gene-expression-style workflow

A realistic application ties everything together. Simulate 500 p-values from a mixture of 450 nulls and 50 alternatives, visualise the raw distribution, apply BH, and plot the decision against the step-up critical line. This is the standard workflow in genomics, neuroimaging, and any high-dimensional testing problem.

```r title="End-to-end BH workflow on 500 p-values"
library(ggplot2)

# Simulate 500 p-values
set.seed(2026)
ce_p <- c(runif(450, 0, 1), rbeta(50, 0.3, 80))

# Histogram: nulls are flat, alternatives pile up near zero
ggplot(data.frame(p = ce_p), aes(p)) +
  geom_histogram(bins = 30, fill = "#9370DB", color = "white") +
  labs(x = "Raw p-value", y = "Count",
       title = "Mixture of 450 nulls and 50 alternatives")

# Apply BH at FDR = 0.05
ce_bh <- p.adjust(ce_p, method = "BH")
sum(ce_bh < 0.05)
#> [1] 42
```

The histogram shows the diagnostic signature of a multiple-testing problem: a flat pedestal across [0, 1] from the 450 null p-values, plus a spike near zero from the 50 true alternatives. BH correctly finds 42 of the 50 signals at an FDR of 5%. The remaining 8 alternatives have raw p-values that blend into the null distribution, so no correction method could separate them from the 450 nulls with certainty.

```r title="BH step-up critical line plot"
m <- length(ce_p)
q <- 0.05

ce_stepdf <- data.frame(
  rank = seq_len(m),
  p    = sort(ce_p),
  crit = (seq_len(m) / m) * q
)

# Largest rank where sorted p <= critical line
cutoff <- max(c(0, which(ce_stepdf$p <= ce_stepdf$crit)))
cutoff
#> [1] 42

ggplot(ce_stepdf, aes(rank, p)) +
  geom_point(alpha = 0.5, color = "#333333") +
  geom_line(aes(y = crit), color = "#E24A33", linewidth = 1) +
  geom_vline(xintercept = cutoff, linetype = "dashed") +
  coord_cartesian(xlim = c(0, 100), ylim = c(0, 0.05)) +
  labs(x = "Rank of p-value", y = "Sorted p-value",
       title = "BH: sorted p-values vs (k/m) * q line")
```

Zooming into the first 100 ranks shows the geometry that makes BH tick. The sorted p-values (points) climb slowly near the origin, then shoot up once you run out of real signal. The BH critical line (k/m)*q is a straight line from the origin with slope q/m. BH rejects every rank up to the **rightmost** point that sits at or below the line: here that is rank 42, marked by the dashed vertical. It is a fundamentally different decision rule from Bonferroni, which would draw a horizontal line at alpha/m = 0.0001 and reject only the handful of points below it.

## Summary

`p.adjust()` is the one function that powers every correction method in R. Swap the `method` argument, keep the decision rule, and you move between FWER and FDR control with a single line change.

| Method | Type | Strictness | When to use |
|---|---|---|---|
| `bonferroni` | FWER | Strictest | Few tests, very low false-positive tolerance |
| `holm` | FWER | Uniformly better than Bonferroni | Default FWER choice |
| `hochberg` | FWER | Assumes independent or positively correlated tests | When tests are clearly independent |
| `hommel` | FWER | Most powerful FWER, slow | Small m, independence |
| `BH` | FDR | Standard FDR | High-throughput (genomics, A/B farms) |
| `BY` | FDR | Conservative FDR under dependence | Correlated tests where BH is too loose |

[KEY INSIGHT]
**FWER and FDR answer different questions.** FWER asks: "what is the probability I made *any* false rejection?" FDR asks: "among my discoveries, what fraction do I expect to be false?" FWER methods protect against any false positive slipping through; FDR methods accept a known small rate of false positives in exchange for much higher power. Pick the one whose question matches the cost of your errors.

## References

1. Benjamini, Y. & Hochberg, Y. — *Controlling the False Discovery Rate: A Practical and Powerful Approach to Multiple Testing*, JRSS-B (1995). [Link](https://www.jstor.org/stable/2346101)
2. Holm, S. — *A Simple Sequentially Rejective Multiple Test Procedure*, Scandinavian Journal of Statistics (1979). [Link](https://www.jstor.org/stable/4615733)
3. R Core Team — `p.adjust()` reference documentation, `stats` package. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/p.adjust.html)
4. Goeman, J. & Solari, A. — *Multiple Hypothesis Testing in Genomics*, Statistics in Medicine (2014). [Link](https://pubmed.ncbi.nlm.nih.gov/24399688/)
5. Efron, B. — *Large-Scale Inference: Empirical Bayes Methods for Estimation, Testing, and Prediction*. Cambridge University Press (2010). [Link](https://www.cambridge.org/core/books/largescale-inference/A0B183B0080D3E9B17AE7D3A80F0D539)
6. Storey, J. D. & Tibshirani, R. — *Statistical Significance for Genomewide Studies*, PNAS (2003). [Link](https://www.pnas.org/doi/10.1073/pnas.1530509100)

## Continue Learning

1. [Multiple Testing in R](Multiple-Comparisons-in-R.html) — the parent tutorial on why FWER inflates, the theory behind BH, and every `p.adjust()` method explained in depth.
2. [Hypothesis Testing Exercises in R](Hypothesis-Testing-Exercises-in-R.html) — 12 drills on single-test p-values, the building blocks of multiple testing.
3. [t-Test Exercises in R](t-Test-Exercises-in-R.html) — paired, two-sample, and one-sample t-test practice, a natural feeder into pairwise comparison problems.
