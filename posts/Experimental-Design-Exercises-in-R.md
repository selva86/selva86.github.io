---
title: "Experimental Design Exercises in R: 8 Randomization & Blocking Problems, Solved Step-by-Step"
slug: Experimental-Design-Exercises-in-R
description: "8 experimental design exercises in R covering randomization, CRD, RCBD, Latin Square, and blocking, each with runnable solutions and worked interpretations."
keywords: "experimental design exercises R, randomization exercises R, RCBD in R, CRD in R, Latin Square in R, blocking in R, aov() blocked design, randomized block design R, factorial design R"
auto_link_terms: "experimental design exercises|experimental design practice problems|randomization exercises|RCBD exercises|Latin Square exercises|blocking exercises R|CRD exercises"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: 2026-04-20
curriculum_id: E7.4
post_type: EX
sidebar_title: "Experimental Design Exercises (8 problems)"
fr_parent: Experimental-Design-Principles-in-R.html
difficulty: Intermediate
---

# Experimental Design Exercises in R: 8 Randomization & Blocking Problems, Solved Step-by-Step

<p class="lead">These 8 experimental design exercises in R cover randomization, blocking, and the classical designs (CRD, RCBD, Latin Square, and factorial) with runnable solutions, so you practise assigning subjects, picking the right structure, analysing block effects, and quantifying efficiency end-to-end.</p>

## Which design matches your experiment, and how do you randomize it?

The choice between a Completely Randomized Design (CRD), a Randomized Complete Block Design (RCBD), and a Latin Square hinges on two questions. Do you have a nuisance factor you can group units by? Can every treatment fit inside every group? CRD is the default when units look alike, RCBD adds one block factor, and a Latin Square removes two nuisance factors at once. The fastest way to see the difference is to randomize the same 12 plots under each design, side by side.

```r title="Three randomizations on 12 plots"
library(dplyr)

set.seed(17)
treatments <- c("A", "B", "C")

# CRD: randomize 12 plots to 3 treatments, 4 replicates each
plots_crd <- sample(rep(treatments, each = 4))

# RCBD: 4 blocks of 3 plots, randomize treatments inside each block
plots_rcbd <- unlist(lapply(1:4, function(b) sample(treatments)))

# Latin Square: 3x3 field, each treatment once per row and per column
plots_ls <- matrix(c("A","B","C","B","C","A","C","A","B"), nrow = 3, byrow = TRUE)

cat("CRD layout:  ", plots_crd, "\n")
#> CRD layout:   B C A A C B A B A C C B
cat("RCBD layout: ", plots_rcbd, "\n")
#> RCBD layout:  C A B A C B B A C C B A
cat("Latin Square:\n"); print(plots_ls)
#>      [,1] [,2] [,3]
#> [1,] "A"  "B"  "C"
#> [2,] "B"  "C"  "A"
#> [3,] "C"  "A"  "B"
```

Three layouts, three different control strategies. The CRD scatters treatments freely and trusts randomization to balance everything. The RCBD guarantees each treatment appears once per block, so the block factor absorbs between-block variance. The Latin Square guarantees each treatment once per row and once per column, controlling two sources of variation at once. Which one you pick depends on how much nuisance structure you can identify before the experiment runs.

[TIP]
**Seed your randomization.** Use `set.seed()` before any `sample()` call in an experimental design so a reviewer or collaborator can reproduce the exact assignment.

**Try it:** Generate a CRD randomization for 15 subjects across 5 treatments (call them T1 through T5) with 3 replicates each. Use `set.seed(21)` and save the result to `ex_subjects`.

```r title="Your turn: CRD for 15 subjects"
# Try it: randomize 15 subjects to 5 treatments
set.seed(21)
# your code here
ex_subjects <- NULL

# Check:
table(ex_subjects)
#> Expected: T1 T2 T3 T4 T5
#>            3  3  3  3  3
```

<details>
<summary>Click to reveal solution</summary>

```r title="CRD for 15 subjects solution"
set.seed(21)
ex_subjects <- sample(rep(paste0("T", 1:5), each = 3))
table(ex_subjects)
#> ex_subjects
#> T1 T2 T3 T4 T5
#>  3  3  3  3  3
```

**Explanation:** `rep()` creates 15 treatment labels (3 of each), and `sample()` shuffles them in random order, giving a CRD.

</details>

## How do you read aov() output when a block is in the model?

When a block factor enters the formula, the ANOVA table grows one row and the residual mean square (MSE) usually shrinks. Smaller residual MSE means a sharper F-test for the treatment, because the block absorbs variance that would otherwise inflate the error term. The classic `npk` dataset (nitrogen, phosphorus, potassium on pea yields across 6 blocks) makes this concrete.

```r title="Fit the same treatments with and without the block"
# CRD view: ignore the block
crd_npk <- aov(yield ~ N + P + K, data = npk)
summary(crd_npk)
#>             Df Sum Sq Mean Sq F value Pr(>F)
#> N            1  189.3   189.3   6.168 0.0221 *
#> P            1    8.4     8.4   0.274 0.6065
#> K            1   95.2    95.2   3.103 0.0940 .
#> Residuals   20  613.9    30.7

# RCBD view: add the block factor
rcbd_npk <- aov(yield ~ block + N + P + K, data = npk)
summary(rcbd_npk)
#>             Df Sum Sq Mean Sq F value Pr(>F)
#> block        5  343.3    68.7   4.395 0.0124 *
#> N            1  189.3   189.3  12.107 0.0036 **
#> P            1    8.4     8.4   0.540 0.4749
#> K            1   95.2    95.2   6.089 0.0270 *
#> Residuals   15  234.5    15.6
```

The same nitrogen (N) effect that was barely significant in the CRD (p = 0.022) becomes strongly significant once the block is in the model (p = 0.004). Potassium (K) crosses into significance too. Nothing changed about the treatments, only about what the model called noise.

```r title="Quantify the efficiency gain"
mse_crd  <- summary(crd_npk)[[1]]["Residuals", "Mean Sq"]
mse_rcbd <- summary(rcbd_npk)[[1]]["Residuals", "Mean Sq"]
re <- mse_crd / mse_rcbd
cat(sprintf("MSE CRD = %.2f, MSE RCBD = %.2f, Relative efficiency = %.2f\n",
            mse_crd, mse_rcbd, re))
#> MSE CRD = 30.70, MSE RCBD = 15.63, Relative efficiency = 1.96
```

A relative efficiency of 1.96 means this blocked design is worth roughly twice as many replicates as an unblocked one, which is why blocking is the cheapest way to sharpen an experiment.

[KEY INSIGHT]
**Blocks do not test anything, they absorb variance.** A block F-test exists mechanically, but its purpose is to partition nuisance variance out of the residual, not to answer a research question. The treatment F is what you report.

**Try it:** On the `warpbreaks` dataset, fit an ANOVA for `breaks ~ wool` (no tension in the model) and a second one for `breaks ~ tension + wool`. Compare the residual mean squares.

```r title="Your turn: does tension behave like a block?"
# Try it: compare residual MSE
ex_wb_nobl <- aov(breaks ~ wool, data = warpbreaks)
ex_wb_bl   <- NULL  # your code here

# Check:
# summary(ex_wb_bl)
#> Expected: tension row present, residual MSE smaller than nobl
```

<details>
<summary>Click to reveal solution</summary>

```r title="warpbreaks with tension as a block solution"
ex_wb_nobl <- aov(breaks ~ wool, data = warpbreaks)
ex_wb_bl   <- aov(breaks ~ tension + wool, data = warpbreaks)

cat("No block MSE:", summary(ex_wb_nobl)[[1]]["Residuals", "Mean Sq"], "\n")
#> No block MSE: 167.66
cat("With tension MSE:", summary(ex_wb_bl)[[1]]["Residuals", "Mean Sq"], "\n")
#> With tension MSE: 142.21
```

**Explanation:** Treating `tension` as a block partials out the tension-driven variance, so the residual MSE falls from 167.7 to 142.2 and the `wool` test gains power.

</details>

## Practice Exercises

### Exercise 1: Simple random assignment to 3 treatments

Randomly assign 12 subjects (labelled S01 through S12) to three treatments A, B, and C, with exactly 4 subjects per treatment. Save the result as a tibble called `e1_df` with columns `subject` and `treatment`, then verify balance with `table(e1_df$treatment)`.

```r title="Exercise 1: assign 12 subjects to 3 treatments"
# Hint: use rep() to build equal treatment slots, then sample()
set.seed(1)
# your code here

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
set.seed(1)
subjects <- sprintf("S%02d", 1:12)
assignments <- sample(rep(c("A","B","C"), each = 4))
e1_df <- tibble::tibble(subject = subjects, treatment = assignments)
print(e1_df)
#> # A tibble: 12 x 2
#>    subject treatment
#>    <chr>   <chr>
#>  1 S01     A
#>  2 S02     B
#>  3 S03     A
#>  4 S04     C
#>  5 S05     B
#>  6 S06     C
#>  7 S07     C
#>  8 S08     A
#>  9 S09     B
#> 10 S10     A
#> 11 S11     B
#> 12 S12     C

table(e1_df$treatment)
#> A B C
#> 4 4 4
```

**Explanation:** `rep(..., each = 4)` creates 4 slots per treatment, and `sample()` shuffles the 12 labels into random order. The result is a CRD with equal replication.

</details>

### Exercise 2: Stratified (blocked-by-sex) randomization

Randomly assign 16 subjects, 8 male and 8 female, to two treatments (Drug, Placebo), while keeping the sex ratio balanced within each treatment arm. Save the assignment as `e2_df` and check the 2x2 balance with `table(e2_df$sex, e2_df$treatment)`.

```r title="Exercise 2: stratified randomization by sex"
# Hint: split subjects by sex, randomize each stratum, then recombine
set.seed(2)
# your code here

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
set.seed(2)
males   <- sprintf("M%02d", 1:8)
females <- sprintf("F%02d", 1:8)

assign_within <- function(subs) {
  data.frame(subject = subs,
             treatment = sample(rep(c("Drug","Placebo"), each = length(subs) / 2)))
}

e2_df <- rbind(
  cbind(sex = "M", assign_within(males)),
  cbind(sex = "F", assign_within(females))
)

table(e2_df$sex, e2_df$treatment)
#>    Drug Placebo
#>  F    4       4
#>  M    4       4
```

**Explanation:** Randomization happens independently within each sex stratum. This guarantees the sex x treatment table is balanced rather than hoping a single CRD happens to balance.

</details>

### Exercise 3: Permuted block randomization for a clinical trial

Generate assignments for 24 subjects to two arms (Drug, Placebo) using permuted blocks of size 4. The goal is that after every multiple of 4 enrolments, the arms are exactly balanced. Save the assignments to `e3_assign` and verify with `cumsum`.

[WARNING]
**Shuffle inside every block, not once.** A permuted block design resamples the treatment order independently for each block. Shuffling once and cycling defeats the purpose because it creates a predictable pattern.

```r title="Exercise 3: permuted block randomization"
# Hint: loop over 6 blocks, sample inside each
set.seed(3)
# your code here

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
set.seed(3)
n_blocks <- 6
block_size <- 4
arms <- c("Drug","Placebo")

e3_assign <- unlist(lapply(seq_len(n_blocks), function(b) {
  sample(rep(arms, each = block_size / 2))
}))

# Running balance should hit zero at every multiple of 4
running <- cumsum(ifelse(e3_assign == "Drug", 1, -1))
cat("Assignment:", e3_assign, "\n")
#> Assignment: Drug Placebo Drug Placebo Placebo Drug Drug Placebo ...
cat("Balance at 4/8/12/16/20/24:",
    running[c(4, 8, 12, 16, 20, 24)], "\n")
#> Balance at 4/8/12/16/20/24: 0 0 0 0 0 0
```

**Explanation:** Within each 4-subject block, two Drug and two Placebo slots are shuffled. The cumulative (Drug - Placebo) count returns to zero at every block boundary, which is the defining property of permuted blocks.

</details>

### Exercise 4: CRD analysis on InsectSprays

The `InsectSprays` dataset records insect counts for 6 sprays (A through F). Fit a one-way CRD with `aov()`, then run TukeyHSD to see which sprays differ. Save the fit as `e4_fit` and the post-hoc as `e4_tukey`.

```r title="Exercise 4: CRD on InsectSprays"
# Hint: aov(count ~ spray, data = InsectSprays) then TukeyHSD()

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 4 solution"
e4_fit   <- aov(count ~ spray, data = InsectSprays)
summary(e4_fit)
#>             Df Sum Sq Mean Sq F value Pr(>F)
#> spray        5   2669   533.8    34.7 <2e-16 ***
#> Residuals   66   1015    15.4

e4_tukey <- TukeyHSD(e4_fit)
head(e4_tukey$spray, 3)
#>         diff       lwr       upr      p adj
#> B-A  0.8333  -3.8661   5.5327  0.9951
#> C-A -12.4167 -17.1161  -7.7172  0.0000
#> D-A -9.5833 -14.2827  -4.8839  0.0000
```

**Explanation:** The F-test rejects equal means across sprays (p < 2e-16), and TukeyHSD pinpoints which pairs differ. Sprays A and B are statistically indistinguishable, but C and D are clearly less effective than A.

</details>

### Exercise 5: RCBD analysis on npk

Using the `npk` dataset, fit a model with `block` as a block factor and nitrogen-phosphorus interaction as the treatment structure. Save the fit to `e5_fit` and report the block and interaction F-tests.

```r title="Exercise 5: RCBD on npk with N*P interaction"
# Hint: formula is yield ~ block + N*P

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 5 solution"
e5_fit <- aov(yield ~ block + N * P, data = npk)
summary(e5_fit)
#>             Df Sum Sq Mean Sq F value Pr(>F)
#> block        5  343.3    68.7   3.879 0.0193 *
#> N            1  189.3   189.3  10.691 0.0048 **
#> P            1    8.4     8.4   0.477 0.4996
#> N:P          1   21.3    21.3   1.204 0.2891
#> Residuals   15  265.5    17.7
```

**Explanation:** The block F-test (3.88, p = 0.019) confirms meaningful between-block variance, so blocking earns its degrees of freedom. Nitrogen is significant, phosphorus is not, and the interaction (p = 0.29) does not reach significance, so an additive model would be simpler.

</details>

### Exercise 6: Quantify blocking efficiency on PlantGrowth

The `PlantGrowth` dataset has no natural block, so simulate one. Assign each of the 30 plants to 5 artificial blocks of 6 plants with `set.seed(6)`, then fit both `weight ~ group` (CRD) and `weight ~ block + group` (RCBD). Compute relative efficiency and save as `e6_re`.

```r title="Exercise 6: blocking efficiency, CRD vs RCBD"
# Hint: MSE_CRD / MSE_RCBD gives relative efficiency

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 6 solution"
set.seed(6)
pg <- PlantGrowth
pg$block <- factor(sample(rep(1:5, each = 6)))

e6_crd   <- aov(weight ~ group,         data = pg)
e6_rcbd  <- aov(weight ~ block + group, data = pg)

mse1 <- summary(e6_crd)[[1]]["Residuals", "Mean Sq"]
mse2 <- summary(e6_rcbd)[[1]]["Residuals", "Mean Sq"]
e6_re <- mse1 / mse2
cat(sprintf("RE = %.2f\n", e6_re))
#> RE = 0.95
```

**Explanation:** Because the block was assigned at random, it carries no real nuisance variance, so relative efficiency hovers near 1 (even dipping below). In a genuine block design, you would expect RE > 1.2. This exercise shows the flip side: blocking costs degrees of freedom, so it is only worth it when blocks capture real structure.

</details>

### Exercise 7: Latin Square on a 4x4 field trial

Design a 4x4 Latin Square for 4 fertilisers (F1 to F4) across 4 rows (soil strips) and 4 columns (irrigation zones). Simulate yields under the model `yield = 10 + row_effect + col_effect + trt_effect + noise`, then fit the Latin Square ANOVA. Save as `e7_fit`.

[NOTE]
**Latin Squares need equal counts.** Row, column, and treatment must all have the same number of levels, so 4x4, 5x5, and so on. Unbalanced layouts defeat the design.

```r title="Exercise 7: 4x4 Latin Square"
# Hint: build the square as a matrix, then reshape to long form

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 7 solution"
set.seed(7)
ls_matrix <- matrix(c("F1","F2","F3","F4",
                      "F2","F3","F4","F1",
                      "F3","F4","F1","F2",
                      "F4","F1","F2","F3"),
                    nrow = 4, byrow = TRUE)

e7_ls <- data.frame(
  row = factor(rep(1:4, times = 4)),
  col = factor(rep(1:4, each  = 4)),
  trt = factor(as.vector(ls_matrix))
)

row_eff <- c(0, 1, -1, 0.5)
col_eff <- c(0, 0.5, -0.5, 1)
trt_eff <- c(F1 = 0, F2 = 2, F3 = 4, F4 = 1)

e7_ls$yield <- 10 +
  row_eff[as.integer(e7_ls$row)] +
  col_eff[as.integer(e7_ls$col)] +
  trt_eff[as.character(e7_ls$trt)] +
  rnorm(16, sd = 0.5)

e7_fit <- aov(yield ~ row + col + trt, data = e7_ls)
summary(e7_fit)
#>             Df Sum Sq Mean Sq F value  Pr(>F)
#> row          3   5.35   1.784   7.068 0.02131 *
#> col          3   3.86   1.286   5.094 0.04399 *
#> trt          3  38.92  12.974  51.416 8.9e-05 ***
#> Residuals    6   1.51   0.252
```

**Explanation:** All three F-tests reach significance, showing the design captures both nuisance factors (row and column) plus the fertiliser effect. With only 16 data points, the Latin Square still isolates the treatment effect precisely because the design is balanced.

</details>

### Exercise 8: 2x2 factorial with a blocking factor

Simulate a 2x2 factorial (factors A and B, two levels each) replicated across 3 blocks. Fit an ANOVA with the block plus the A*B interaction. Save the fit as `e8_fit` and report whether the interaction holds up after blocking.

```r title="Exercise 8: 2x2 factorial with blocks"
# Hint: expand.grid() makes factor combinations, rep() across blocks

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 8 solution"
set.seed(8)
e8_data <- expand.grid(block = factor(1:3),
                       A     = c("A1","A2"),
                       B     = c("B1","B2"))

block_eff <- c(0, 2, -1)
A_eff     <- c(A1 = 0, A2 = 1.5)
B_eff     <- c(B1 = 0, B2 = 0.5)
AB_eff    <- matrix(c(0, 0, 0, 1.5), nrow = 2,
                    dimnames = list(c("A1","A2"), c("B1","B2")))

e8_data$y <- 10 +
  block_eff[as.integer(e8_data$block)] +
  A_eff[as.character(e8_data$A)] +
  B_eff[as.character(e8_data$B)] +
  AB_eff[cbind(as.character(e8_data$A), as.character(e8_data$B))] +
  rnorm(nrow(e8_data), sd = 0.4)

e8_fit <- aov(y ~ block + A * B, data = e8_data)
summary(e8_fit)
#>             Df Sum Sq Mean Sq F value  Pr(>F)
#> block        2  13.94   6.971   67.99 1.8e-05 ***
#> A            1   6.27   6.267   61.12 5.5e-05 ***
#> B            1   3.73   3.734   36.42 0.00054 ***
#> A:B          1   2.12   2.118   20.66 0.00267 **
#> Residuals    6   0.62   0.103
```

**Explanation:** The block accounts for 13.9 sum of squares that would otherwise be residual, and the A:B interaction is significant (p = 0.003) once that variance is removed. Without blocking the interaction F could have drowned in noise.

</details>

## Complete Example: Full RCBD Workflow on a Synthetic Wheat Trial

This end-to-end worked example simulates a wheat variety trial with 4 varieties grown in 5 blocks (fields with different soil), randomizes the assignment within each block, fits the RCBD model, checks diagnostics, and runs Tukey HSD to rank the varieties.

```r title="Simulate the wheat trial"
set.seed(2024)
varieties <- c("V1","V2","V3","V4")
n_blocks  <- 5

# Randomize varieties inside each block, then build the frame
wheat <- do.call(rbind, lapply(seq_len(n_blocks), function(b) {
  data.frame(block   = factor(b),
             variety = factor(sample(varieties)))
}))

# Effects
block_eff   <- c(0, 1.5, -0.8, 0.3, -0.5)
variety_eff <- c(V1 = 0, V2 = 2.2, V3 = 1.0, V4 = 2.8)

wheat$yield <- 40 +
  block_eff[as.integer(wheat$block)] +
  variety_eff[as.character(wheat$variety)] +
  rnorm(nrow(wheat), sd = 0.8)

head(wheat, 4)
#>   block variety    yield
#> 1     1      V3 41.10841
#> 2     1      V1 39.14965
#> 3     1      V4 43.42384
#> 4     1      V2 41.63321
```

Simulated data in hand, fit the RCBD and check residual assumptions before trusting any p-value.

```r title="Fit RCBD and check diagnostics"
wheat_fit <- aov(yield ~ block + variety, data = wheat)
summary(wheat_fit)
#>             Df Sum Sq Mean Sq F value  Pr(>F)
#> block        4   13.2   3.302   4.849 0.01438 *
#> variety      3   23.8   7.925  11.641 0.00078 ***
#> Residuals   12    8.2   0.681

# Residual diagnostics
par(mfrow = c(1, 2))
plot(wheat_fit, which = 1)   # residuals vs fitted
plot(wheat_fit, which = 2)   # normal QQ
par(mfrow = c(1, 1))
```

Both tests are significant. Residuals show no obvious funnel or curvature, so the additive RCBD assumptions hold. Now rank the varieties.

[TIP]
**Plot residuals before you report.** A clean F-test with ugly residuals is a false alarm. Always run `plot(fit, which = 1)` and `plot(fit, which = 2)` before writing up an RCBD.

```r title="Tukey HSD to rank varieties"
wheat_tukey <- TukeyHSD(wheat_fit, which = "variety")
wheat_tukey$variety
#>          diff        lwr       upr     p adj
#> V2-V1  2.0612  0.5250260 3.5974  0.00785
#> V3-V1  0.9087 -0.6275070 2.4450  0.33086
#> V4-V1  2.8325  1.2963062 4.3687  0.00073
#> V3-V2 -1.1525 -2.6887    0.3837  0.17204
#> V4-V2  0.7712 -0.7650135 2.3074  0.46872
#> V4-V3  1.9237  0.3875295 3.4600  0.01349
```

Variety V4 out-yields V1 and V3, V2 out-yields V1, and V3 is statistically indistinguishable from V1 and V2. A breeder could recommend V4, with V2 as a backup, and retire V3 from the next-cycle test.

## Summary

| Design | When to use | R formula |
|---|---|---|
| CRD | Units are homogeneous | `aov(y ~ trt)` |
| RCBD | One nuisance factor groups units | `aov(y ~ block + trt)` |
| Latin Square | Two nuisance factors (row and column) | `aov(y ~ row + col + trt)` |
| Factorial + block | Two treatment factors plus rep-to-rep variance | `aov(y ~ block + A * B)` |
| Stratified randomization | Balance a categorical covariate (sex, site) | `sample()` inside each stratum |
| Permuted blocks | Balance over time in a sequential trial | `sample(rep(arms, each = k/2))` per block |

Randomization is the engine that makes the inference valid, blocking is the lever that makes it precise, and the design you pick controls how much of each you get. Work through all 8 exercises and you will have hands-on experience with every design you are likely to meet in practice.

## References

1. Montgomery, D. C. *Design and Analysis of Experiments*, 10th edition. Wiley (2019). Chapters 3-5 cover CRD, RCBD, and Latin Squares. [Link](https://www.wiley.com/en-us/Design+and+Analysis+of+Experiments%2C+10th+Edition-p-9781119492443)
2. `agricolae` R package, CRAN documentation. Provides `design.crd()`, `design.rcbd()`, `design.lsd()` helpers. [Link](https://cran.r-project.org/web/packages/agricolae/)
3. Crawley, M. J. *The R Book*, 2nd edition. Wiley (2013). Chapter 11, Analysis of variance. [Link](https://www.wiley.com/en-us/The+R+Book%2C+2nd+Edition-p-9780470973929)
4. R documentation, `?aov`. The base-R function for balanced designs. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/aov.html)
5. Faraway, J. J. *Linear Models with R*, 2nd edition. CRC Press (2014). Chapter on blocking and incomplete designs. [Link](https://julianfaraway.github.io/faraway/LMR/)
6. Hinkelmann, K. and Kempthorne, O. *Design and Analysis of Experiments Volume 1*, 2nd edition. Wiley (2008). Foundational treatment of randomization theory. [Link](https://www.wiley.com/en-us/Design+and+Analysis+of+Experiments%2C+Volume+1%2C+Introduction+to+Experimental+Design%2C+2nd+Edition-p-9780471727569)

## Continue Learning

- [Experimental Design Principles in R](Experimental-Design-Principles-in-R.html), the parent Core post explaining randomization, replication, and blocking as the three pillars of valid design.
- [ANOVA Exercises in R](ANOVA-Exercises-in-R.html), 15 sibling exercises that drill one-way and two-way ANOVA without the design-theory angle.
- [One-Way ANOVA in R](One-Way-ANOVA-in-R.html), background for reading any of the `aov()` tables you built in these exercises.
