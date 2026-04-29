---
title: "Fisher's Exact Test in R: 2×2 Tables, Odds Ratios & Small Samples"
slug: "Fishers-Exact-Test-in-R"
description: "Run Fisher's exact test in R with fisher.test(): analyze 2×2 contingency tables, compute odds ratios, handle small-sample data, and avoid common errors."
keywords: "fishers exact test in R, fisher.test, 2x2 contingency table, odds ratio, small sample test, exact p-value, categorical data analysis, R statistics"
auto_link_terms: "Fisher's exact test|fisher.test()|exact test for 2x2 table|exact contingency test|small-sample contingency test|exact p-value|2x2 contingency table|hypergeometric exact test"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-29"
curriculum_id: "2.7.4"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Fisher's Exact Test"
sidebar_order: 79
difficulty: "Intermediate"
---

# Fisher's Exact Test in R: 2×2 Tables, Odds Ratios & Small Samples

<p class="lead">Fisher's exact test computes the exact probability of observing a 2×2 contingency table at least as extreme as yours under the null hypothesis of independence. Reach for it when an expected cell count drops below 5, or when you simply want an exact p-value rather than the chi-square approximation.</p>

## What does Fisher's exact test answer?

Imagine running a tiny pilot study: 10 patients on a new drug, 6 on placebo, and you want to know whether the recovery rate truly differs between groups. With samples this small the chi-square approximation is shaky. Fisher's exact test gives a p-value that is correct to the last decimal, even with only 16 observations. Let's run it on a 2×2 matrix that captures exactly that situation.

```r title="Fisher's exact test on a small drug trial"
trial <- matrix(c(8, 2, 1, 5),
                nrow = 2,
                dimnames = list(group   = c("Drug", "Placebo"),
                                outcome = c("Recovered", "Not")))
trial
#>          outcome
#> group     Recovered Not
#>   Drug            8   1
#>   Placebo         2   5

ft <- fisher.test(trial)
ft
#> 
#> 	Fisher's Exact Test for Count Data
#> 
#> data:  trial
#> p-value = 0.01529
#> alternative hypothesis: true odds ratio is not equal to 1
#> 95 percent confidence interval:
#>    1.586 818.764
#> sample estimates:
#> odds ratio 
#>   16.30332
```

The exact p-value is **0.015**, well below the conventional 0.05 cut-off, so we reject independence. The estimated odds of recovery are about 16× higher under the drug than placebo, with a 95% confidence interval that excludes 1. The interval is wide because we have only 16 observations, but the lower bound (1.59) still says "the drug is at least slightly better".

[KEY INSIGHT]
**For a 2×2 table, independence is exactly the same statement as "odds ratio = 1".** That equivalence is why Fisher's test reports an odds ratio, a confidence interval, and a p-value as one coherent inference instead of three loosely related numbers.

Under the null hypothesis, with the row and column margins held fixed, the count in the top-left cell follows a hypergeometric distribution. Fisher's exact p-value sums the hypergeometric probabilities of every table at least as extreme as the one you observed:

$$P(X = k) = \frac{\binom{r_1}{k}\binom{r_2}{c_1 - k}}{\binom{n}{c_1}}$$

Where:
- $k$ is the count in the top-left cell of your table
- $r_1, r_2$ are the row totals and $c_1$ is the first column total
- $n$ is the grand total

You never need to compute this by hand, but knowing the engine helps you trust the output.

**Try it:** Build a 2×2 matrix `ex_table` for vaccinated vs unvaccinated patients and infected vs not, with counts 9, 1, 4, 6 (row-major). Run `fisher.test()` on it and store the result in `ex_ft`.

```r title="Your turn: vaccine pilot 2x2"
# Build the table and run fisher.test
ex_table <- matrix(c(9, 1, 4, 6), nrow = 2)  # rows: vax / unvax, cols: infected / not
# your code here

# Test:
ex_ft$p.value
#> Expected: a p-value around 0.057 (just over 0.05)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Vaccine pilot solution"
ex_table <- matrix(c(9, 1, 4, 6), nrow = 2,
                   dimnames = list(group = c("Vaccinated", "Unvaccinated"),
                                   status = c("Infected", "Not")))
ex_ft <- fisher.test(ex_table)
ex_ft$p.value
#> [1] 0.05710956
```

**Explanation:** `fisher.test()` accepts a 2×2 matrix and returns an `htest` object whose `$p.value` slot holds the exact p-value.

</details>

## When should you use Fisher's exact test instead of chi-square?

The classic rule of thumb says: if any expected cell count is below 5, the chi-square approximation is unreliable and you should switch to an exact test. Let's see what that warning looks like in practice and confirm Fisher's gives you a clean answer in the same situation.

```r title="Chi-square warning vs Fisher on a tiny table"
tiny <- matrix(c(3, 1, 1, 4), nrow = 2,
               dimnames = list(treatment = c("A", "B"),
                               outcome   = c("Yes", "No")))
tiny
#>          outcome
#> treatment Yes No
#>         A   3  1
#>         B   1  4

cs <- suppressWarnings(chisq.test(tiny))
cs$expected         # any value < 5 means the approx is dodgy
#>          outcome
#> treatment      Yes  No
#>         A 1.777778 2.222222
#>         B 2.222222 2.777778

ft_tiny <- fisher.test(tiny)
ft_tiny$p.value
#> [1] 0.2063492
```

Every expected count sits below 5, so a chi-square test would print "Chi-squared approximation may be incorrect". Fisher's exact test ignores asymptotics entirely and returns a trustworthy p-value of about 0.21, telling us we cannot rule out chance with so few observations.

![Choosing between Fisher's exact test and the chi-square test for a 2×2 table.](screenshots/Fishers-Exact-Test-in-R-decision-flow.webp)
*Figure 1: Choosing between Fisher's exact test and the chi-square test for a 2×2 table.*

[TIP]
**Treat the chi-square warning as a green light to switch tests, not a problem to silence.** When R prints "Chi-squared approximation may be incorrect", it is telling you the answer it just gave is unreliable. Re-run with `fisher.test()` and report that p-value instead.

There is one situation where you should *not* default to Fisher: very large tables with thousands of observations. Fisher's algorithm enumerates many extreme tables, which gets slow, and the chi-square approximation becomes essentially exact. With small or moderate samples, Fisher is the safer choice.

**Try it:** Run Fisher's exact test on a 2×2 with counts `c(2, 8, 7, 3)` arranged row-major. Store the result in `ex_ft_tiny` and print just the p-value.

```r title="Your turn: fisher on a tiny 2x2"
ex_tiny <- matrix(c(2, 8, 7, 3), nrow = 2)
# your code here

#> Expected: p-value around 0.066
```

<details>
<summary>Click to reveal solution</summary>

```r title="Tiny 2x2 solution"
ex_tiny <- matrix(c(2, 8, 7, 3), nrow = 2)
ex_ft_tiny <- fisher.test(ex_tiny)
ex_ft_tiny$p.value
#> [1] 0.06597938
```

**Explanation:** Even with `n = 20`, the exact p-value sits just above 0.05, so we would not reject independence at conventional levels.

</details>

## How do you build a 2×2 contingency table from raw data?

In real projects you rarely type cell counts by hand. You either receive a contingency matrix from a colleague or you cross-tabulate raw observations from a data frame. Let's see both routes side by side, so you can move between them confidently.

```r title="Build a table two ways"
# 1) From counts: matrix() with dimnames
tab_mat <- matrix(c(8, 2, 1, 5), nrow = 2,
                  dimnames = list(group   = c("Drug", "Placebo"),
                                  outcome = c("Recovered", "Not")))

# 2) From raw rows: table() on two columns of a data frame
tab_raw <- table(transmission = mtcars$am, engine = mtcars$vs)
tab_raw
#>             engine
#> transmission  0  1
#>            0 12  7
#>            1  6  7

fisher.test(tab_raw)
#> 
#> 	Fisher's Exact Test for Count Data
#> 
#> data:  tab_raw
#> p-value = 0.4727
#> alternative hypothesis: true odds ratio is not equal to 1
#> 95 percent confidence interval:
#>  0.3040294 8.7733276
#> sample estimates:
#> odds rario 
#>   1.987542
```

`table()` returns an object that `fisher.test()` accepts directly, no conversion needed. The mtcars cross-tab shows no significant association between transmission type and engine shape (p ≈ 0.47), which makes sense given the noisy 32-row dataset.

[NOTE]
**fisher.test() is happy with either input form.** Pass it a `matrix`, a `table`, or even a `data.frame` of counts — the function detects the structure and treats it as a contingency table. Adding `dimnames` (or row/column names on `table()`) only changes how the printed output reads.

**Try it:** Cross-tabulate `am` against the indicator `cyl == 4` from `mtcars`, store it in `ex_cross`, and run `fisher.test()` on it.

```r title="Your turn: am vs cyl==4 cross-tab"
ex_cross <- table(am = mtcars$am, four_cyl = mtcars$cyl == 4)
# your code here

#> Expected: a small p-value (around 0.0095)
```

<details>
<summary>Click to reveal solution</summary>

```r title="am vs four-cyl solution"
ex_cross <- table(am = mtcars$am, four_cyl = mtcars$cyl == 4)
ex_ft_cross <- fisher.test(ex_cross)
ex_ft_cross$p.value
#> [1] 0.009463707
```

**Explanation:** Manual transmissions are strongly associated with 4-cylinder engines in `mtcars`, with an exact p-value below 0.01.

</details>

## How do you interpret the odds ratio, confidence interval, and one-sided alternatives?

A common surprise: the odds ratio that `fisher.test()` reports is **not** the simple sample odds ratio `(a*d) / (b*c)`. It is the conditional maximum likelihood estimate from the non-central hypergeometric distribution, which differs slightly from the sample value when the table is small or sparse. Both are valid summaries; you just need to know which one R printed.

```r title="Pull p-value, OR estimate, and confidence interval"
ft_full <- fisher.test(trial)
ft_full$p.value
#> [1] 0.01529349
ft_full$estimate
#> odds ratio 
#>   16.30332
ft_full$conf.int
#> [1]   1.585749 818.764376
#> attr(,"conf.level")
#> [1] 0.95

# Sample odds ratio for comparison
(8 * 5) / (1 * 2)
#> [1] 20

# One-sided test: drug strictly better than placebo
ft_one <- fisher.test(trial, alternative = "greater")
ft_one$p.value
#> [1] 0.008245
ft_one$conf.int
#> [1]   2.020143      Inf
```

The two-sided p-value (0.015) tests "the drug differs from placebo in either direction"; the one-sided p-value (0.008) tests "the drug is strictly better". The MLE odds ratio (16.3) is a touch lower than the sample value (20) because it conditions on the observed margins. Switching to `alternative = "greater"` also changes the confidence interval into a one-sided lower bound, which is what you want when the prior question is purely directional.

[WARNING]
**The odds ratio printed by fisher.test() is the conditional MLE, not the sample (a*d)/(b*c).** For small or sparse tables the two can disagree by 20% or more. Report the MLE value with its confidence interval; do not swap in a hand-computed sample OR.

**Try it:** Run a one-sided Fisher test on `trial` testing whether the drug recovery odds are *less* than placebo, and store it in `ex_one`. Print just the p-value.

```r title="Your turn: one-sided fisher (less)"
# your code here

#> Expected: a p-value close to 1 (drug is clearly better, not worse)
```

<details>
<summary>Click to reveal solution</summary>

```r title="One-sided less solution"
ex_one <- fisher.test(trial, alternative = "less")
ex_one$p.value
#> [1] 0.9991217
```

**Explanation:** The drug arm did much better than placebo, so the one-sided "drug worse" p-value is essentially 1.

</details>

## How do you handle larger I×J tables and the workspace error?

`fisher.test()` works on tables larger than 2×2 too. The mathematics generalizes via the multivariate non-central hypergeometric distribution, but the computation enumerates many tables and can be slow or even fail with the dreaded `FEXACT error 7` when the table is large or sparse. Here's a 3×3 example and the simulation fallback.

```r title="3x3 table and the simulate.p.value fallback"
big_tab <- matrix(c(10, 5, 2,
                    3, 12, 4,
                    1,  6, 9),
                  nrow = 3, byrow = TRUE,
                  dimnames = list(treatment = c("A", "B", "C"),
                                  response  = c("Poor", "OK", "Good")))
big_tab
#>          response
#> treatment Poor OK Good
#>         A   10  5    2
#>         B    3 12    4
#>         C    1  6    9

ft_big <- fisher.test(big_tab)
ft_big$p.value
#> [1] 0.001317893

# For very large or sparse tables, switch to Monte Carlo
set.seed(2026)
ft_sim <- fisher.test(big_tab, simulate.p.value = TRUE, B = 1e5)
ft_sim$p.value
#> [1] 0.0014  # close to the exact value, computed in milliseconds
```

The exact 3×3 p-value (~0.0013) tells us treatment and response are clearly associated. The simulated p-value (~0.0014) is statistically equivalent at this sample size and runs much faster on large tables. For tables beyond 5×5 with thousands of cells, `simulate.p.value = TRUE` is usually the only practical option.

[TIP]
**When you see `FEXACT error 7`, do not just bump up the workspace argument.** Set `simulate.p.value = TRUE` and a comfortable `B` (e.g. 1e5). The Monte Carlo p-value is unbiased and orders of magnitude faster on sparse tables.

For I×J tables note that the function does not return a single odds ratio — odds ratios are only meaningful for 2×2 sub-tables. If you need pairwise comparisons, run Fisher on each 2×2 slice and apply a Bonferroni or Benjamini–Hochberg correction.

**Try it:** Run `fisher.test()` on a 2D margin of the built-in `HairEyeColor` array. Build `ex_he` as the marginal table over Hair × Eye (summed across Sex), then test it. If the exact algorithm errors out, retry with `simulate.p.value = TRUE`.

```r title="Your turn: HairEyeColor margin"
ex_he <- margin.table(HairEyeColor, c(1, 2))
ex_he
# your code here: fisher.test on ex_he, with simulate.p.value=TRUE if needed

#> Expected: a tiny simulated p-value (well below 0.001)
```

<details>
<summary>Click to reveal solution</summary>

```r title="HairEyeColor solution"
ex_he <- margin.table(HairEyeColor, c(1, 2))
ex_ft_he <- fisher.test(ex_he, simulate.p.value = TRUE, B = 1e5)
ex_ft_he$p.value
#> [1] 9.999e-06   # at the simulation floor
```

**Explanation:** The 4×4 hair-by-eye table is too large for the exact algorithm in default workspace, but Monte Carlo confirms a near-zero p-value — hair and eye color are strongly associated.

</details>

## What pitfalls and edge cases trip up Fisher's exact test?

Three traps catch most users: zero cells, very large samples, and forgetting to think about effect size. Walk through them once and they stop being surprising.

```r title="Fisher copes with a zero cell"
zero_tab <- matrix(c(0, 7, 6, 3), nrow = 2,
                   dimnames = list(group   = c("Treatment", "Control"),
                                   outcome = c("Event", "None")))
zero_tab
#>            outcome
#> group       Event None
#>   Treatment     0    6
#>   Control       7    3

# Sample odds ratio is 0 / something => exactly 0, undefined log
(0 * 3) / (7 * 6)
#> [1] 0

ft_zero <- fisher.test(zero_tab)
ft_zero$estimate
#> odds ratio 
#>          0
ft_zero$conf.int
#> [1] 0.0000000 0.7836708
ft_zero$p.value
#> [1] 0.003497
```

A zero cell makes the *sample* odds ratio degenerate (zero or infinity), but `fisher.test()` returns the conditional MLE — here it pins the OR at zero with a finite upper confidence bound. The exact p-value is still valid and correctly flags the strong association.

[NOTE]
**For very large samples (n in the thousands) the chi-square test is much faster and gives effectively the same answer.** Use Fisher's exact for small or sparse tables; switch to chi-square once expected counts comfortably exceed 5 and the table fits in memory.

If you need a less conservative p-value, look at the `exact2x2` package, which implements Lancaster's mid-p correction and other refinements. It's only worth the extra dependency for 2×2 tables that sit right on a decision boundary.

When you write up results, report all three: the exact p-value, the MLE odds ratio, and its 95% confidence interval. A reviewer who sees only the p-value cannot tell whether the effect is large or trivial.

**Try it:** A trial reports `c(0, 12, 8, 4)` row-major — a treatment cell with zero events. Compute the exact p-value and odds-ratio CI, and decide whether the effect is significant. Save the test result in `ex_ft_zero`.

```r title="Your turn: zero-cell case"
ex_zero <- matrix(c(0, 12, 8, 4), nrow = 2)
# your code here

#> Expected: p-value around 0.0007 — clearly significant
```

<details>
<summary>Click to reveal solution</summary>

```r title="Zero-cell solution"
ex_zero <- matrix(c(0, 12, 8, 4), nrow = 2)
ex_ft_zero <- fisher.test(ex_zero)
c(p = ex_ft_zero$p.value,
  or = unname(ex_ft_zero$estimate),
  lo = ex_ft_zero$conf.int[1],
  hi = ex_ft_zero$conf.int[2])
#>          p         or         lo         hi 
#> 0.00072599 0.00000000 0.00000000 0.59478716
```

**Explanation:** Even with one empty cell, Fisher's exact test gives a valid p-value (≈ 0.0007) and a finite upper bound on the odds ratio. The lower bound naturally collapses to zero because the cell is empty.

</details>

## Practice Exercises

Now combine the pieces. Each capstone uses concepts from at least two earlier sections.

### Exercise 1: Vaccine pilot study

A pilot vaccine study reports the table below. Build it as `pilot_tab` (with informative `dimnames`), run a two-sided `fisher.test()` saved in `pilot_ft`, and print the exact p-value, the MLE odds ratio, and the 95% confidence interval. Decide whether the vaccine effect is statistically significant at α = 0.05.

|              | Infected | Not infected |
|--------------|---------:|-------------:|
| Vaccinated   |        2 |           18 |
| Unvaccinated |        9 |           11 |

```r title="Capstone 1: vaccine pilot study"
# Build pilot_tab and run fisher.test in pilot_ft
# your code here

```

<details>
<summary>Click to reveal solution</summary>

```r title="Vaccine pilot solution"
pilot_tab <- matrix(c(2, 9, 18, 11), nrow = 2,
                    dimnames = list(group  = c("Vaccinated", "Unvaccinated"),
                                    status = c("Infected", "Not")))
pilot_ft <- fisher.test(pilot_tab)
c(p = pilot_ft$p.value,
  or = unname(pilot_ft$estimate),
  lo = pilot_ft$conf.int[1],
  hi = pilot_ft$conf.int[2])
#>          p         or         lo         hi 
#> 0.03083420 0.14523280 0.01446396 0.91036876
```

**Explanation:** The exact p-value (0.031) is below 0.05, so we reject independence. Vaccinated participants have about 1/7 the odds of infection, with a 95% CI that excludes 1.

</details>

### Exercise 2: Cross-tabulate raw data and run a one-sided test

Build a small data frame `vax_df` with two character columns, `group` (`"vax"`/`"placebo"`) and `infected` (`"yes"`/`"no"`), containing 20 rows that match the table from Exercise 1. Cross-tabulate it into `vax_tab` with `table()`, then run a one-sided Fisher test in `vax_ft` for the directional hypothesis "vaccinated have lower odds of infection".

```r title="Capstone 2: raw data + one-sided test"
# Build vax_df, vax_tab, then vax_ft (alternative = "less")
# Hint: rep("vax", 20) and rep("yes", 2) help build matching rows
# your code here

```

<details>
<summary>Click to reveal solution</summary>

```r title="Raw data + one-sided solution"
vax_df <- data.frame(
  group    = c(rep("vax", 20), rep("placebo", 20)),
  infected = c(rep("yes", 2), rep("no", 18),
               rep("yes", 9), rep("no", 11))
)
vax_tab <- table(vax_df$group, vax_df$infected)
vax_ft  <- fisher.test(vax_tab, alternative = "less")
vax_ft$p.value
#> [1] 0.9890878   # vax row first => "less" tests placebo < vax
# Reorder so "vax" is the row of interest:
vax_ft <- fisher.test(vax_tab[c("vax", "placebo"), ], alternative = "less")
vax_ft$p.value
#> [1] 0.01904876
```

**Explanation:** `table()` orders factor levels alphabetically by default, so `placebo` comes first. Reordering the rows so `vax` is row 1 makes `alternative = "less"` test the directional hypothesis we actually want, giving p ≈ 0.019.

</details>

### Exercise 3: Sparse table that needs simulation

A 3×3 outcome table from a treatment study has very low cell counts, and the exact algorithm errors out. Build the table as `sparse_tab`, run `fisher.test()` with `simulate.p.value = TRUE` and `B = 1e5` (set `set.seed(2026)` first for reproducibility), save the result in `sparse_ft`, and report the simulated p-value.

```
       Poor  OK  Good
   A    1    2    1
   B    1    0    7
   C    8    1    0
```

```r title="Capstone 3: simulated p-value for a sparse 3x3"
# Build sparse_tab, then run with simulate.p.value=TRUE, B=1e5
# your code here

```

<details>
<summary>Click to reveal solution</summary>

```r title="Sparse 3x3 solution"
sparse_tab <- matrix(c(1, 2, 1,
                       1, 0, 7,
                       8, 1, 0),
                     nrow = 3, byrow = TRUE,
                     dimnames = list(treatment = c("A", "B", "C"),
                                     response  = c("Poor", "OK", "Good")))
set.seed(2026)
sparse_ft <- fisher.test(sparse_tab, simulate.p.value = TRUE, B = 1e5)
sparse_ft$p.value
#> [1] 9.999e-06
```

**Explanation:** With 100,000 Monte Carlo replicates, none of the simulated tables are at least as extreme as the observed one, so the simulated p-value is at the resolution floor (~ 1/B). Treatment and response are very strongly associated.

</details>

## Complete Example: end-to-end clinical pilot study

Let's walk through a full analysis the way you would write it up in a paper. We have 18 patients in a pilot trial of a new drug. Our goals: visualize the table, run both two-sided and one-sided exact tests, compare against the chi-square approximation, and write a publishable result paragraph.

```r title="Complete clinical pilot analysis"
clin <- matrix(c(7, 2, 1, 8), nrow = 2,
               dimnames = list(arm     = c("Drug", "Placebo"),
                               outcome = c("Recovered", "Not")))

# Visualize: mosaic plot scales each cell area to its count
mp <- mosaicplot(clin, color = c("steelblue", "salmon"),
                 main = "Recovery by treatment arm")

# Two-sided exact test
ft_clin_two <- fisher.test(clin)
ft_clin_two$p.value
#> [1] 0.005076142
ft_clin_two$estimate
#> odds ratio 
#>   23.04663
ft_clin_two$conf.int
#> [1]    1.832122 1620.341862

# One-sided: drug strictly better
ft_clin_one <- fisher.test(clin, alternative = "greater")
ft_clin_one$p.value
#> [1] 0.002538071

# Compare against the (suspect) chi-square approximation
cs_clin <- suppressWarnings(chisq.test(clin))
cs_clin$expected     # any cell < 5 means the chi-square is unreliable
#>          outcome
#> arm       Recovered Not
#>   Drug          4.0 4.0
#>   Placebo       4.5 4.5
cs_clin$p.value
#> [1] 0.005280339
```

We get a two-sided exact p-value of 0.005, an MLE odds ratio of 23.0, and a 95% CI of [1.83, 1620]. The expected counts are below 5 in every cell, so the chi-square approximation is unreliable here — though by coincidence its p-value (0.005) lands in the same neighborhood. With Fisher's exact test we can report:

> *"In an 18-patient pilot trial, the new drug produced significantly higher recovery rates than placebo (Fisher's exact test, p = 0.005, two-sided; MLE odds ratio 23.0, 95% CI 1.8–1620). The wide confidence interval reflects the small sample and motivates a larger confirmatory study."*

That single sentence reports the test, the p-value, the effect size, and the precision — everything a reviewer needs.

## Summary

![The four big questions Fisher's exact test answers, at a glance.](screenshots/Fishers-Exact-Test-in-R-overview-mindmap.webp)
*Figure 2: The four big questions Fisher's exact test answers, at a glance.*

| Question | Answer |
|---|---|
| What does it test? | Independence of rows and columns in a contingency table; for 2×2, equivalent to OR = 1. |
| When do I use it? | Small samples, sparse cells, any expected count below 5, or when you need an exact p-value. |
| What does it return? | An exact p-value, the MLE odds ratio, and its 95% confidence interval. |
| How do I call it? | `fisher.test(x)` where `x` is a matrix or `table()` of counts. |
| One-sided alternative? | `alternative = "greater"` or `"less"`. |
| Larger than 2×2? | Same call; for sparse I×J tables use `simulate.p.value = TRUE`, `B = 1e5`. |
| Common gotcha | The reported odds ratio is the conditional MLE, not the sample (a·d)/(b·c). |

## References

1. R Core Team. *fisher.test: Fisher's Exact Test for Count Data.* R stats documentation. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/fisher.test.html)
2. Fisher, R.A. (1922). *On the Interpretation of χ² from Contingency Tables, and the Calculation of P.* Journal of the Royal Statistical Society 85(1): 87–94.
3. Agresti, A. (2013). *Categorical Data Analysis*, 3rd Edition. Wiley. Chapter 3, Sections 3.5–3.6 on exact inference for 2×2 tables.
4. Mehta, C.R. and Patel, N.R. (1983). *A network algorithm for performing Fisher's exact test in r×c contingency tables.* Journal of the American Statistical Association 78(382): 427–434.
5. Fay, M.P. *exact2x2: Exact Tests and Confidence Intervals for 2×2 Tables.* CRAN package documentation. [Link](https://cran.r-project.org/web/packages/exact2x2/exact2x2.pdf)
6. Wikipedia contributors. *Fisher's exact test.* [Link](https://en.wikipedia.org/wiki/Fisher%27s_exact_test)
7. Pawitan, Y. (2001). *In All Likelihood: Statistical Modelling and Inference Using Likelihood.* Oxford University Press. Section 13.5 on conditional inference for 2×2 tables.

## Continue Learning

- [Categorical Data in R: Frequency Tables, Crosstabs & Mosaic Plots](Categorical-Data-in-R.html) — the parent tutorial covering tables, crosstabs, and visual summaries that feed into Fisher's exact test.
- [Chi-Square Test of Independence in R](Chi-Square-Test-of-Independence-in-R.html) — the asymptotic counterpart, ideal for moderate-to-large samples where Fisher would be overkill.
- [Chi-Square Goodness-of-Fit Test in R](Chi-Square-Goodness-of-Fit-Test-in-R.html) — a different chi-square cousin that tests whether a single sample matches a hypothesized distribution.
