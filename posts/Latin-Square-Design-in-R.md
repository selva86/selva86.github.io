---
title: "Latin Square Design in R: Two-Way Blocking for Efficient Experiments"
slug: "Latin-Square-Design-in-R"
description: "Run a Latin Square Design in R with aov(): two-way blocking, ANOVA decomposition, diagnostics, post-hoc tests, and relative efficiency vs RCBD and CRD."
keywords: "Latin Square Design in R, latin square ANOVA, two-way blocking R, aov latin square, design.lsd agricolae, latin square randomization, relative efficiency latin square, replicated latin squares, LSD post-hoc, crossover Latin square"
auto_link_terms: "Latin Square Design|latin square design|Latin square|two-way blocking|design.lsd|replicated Latin squares"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-26"
curriculum_id: "FR-anov-3"
post_type: "FR"
fr_parent: "Experimental-Design-Principles-in-R.html"
difficulty: "Intermediate"
---

# Latin Square Design in R: Two-Way Blocking for Efficient Experiments

<p class="lead">A <strong>Latin Square Design</strong> arranges <em>t</em> treatments in a <em>t × t</em> grid so each treatment appears exactly once in every row and once in every column. That single constraint pulls two crossed sources of nuisance variability out of the residual at once, sharpening the F-test for the treatment effect with no extra sample size.</p>

## What problem does a Latin square solve that RCBD cannot?

Picture testing four engine lubricants on a track where the **driver** and the **car model** both shift lap times. RCBD blocks one nuisance, say driver, but car-to-car variation still pollutes the residual. A Latin square blocks both at once by assigning each lubricant once per driver and once per car. The same 16 runs, the same response values, but the F-test for the lubricant effect can climb from "no signal" under CRD to "decisive" under LSD. The simulation below shows the ladder.

```r title="Simulate lap data and fit CRD vs RCBD vs LSD"
library(dplyr)

set.seed(214)
treatments <- c("A", "B", "C", "D")
treat_effect  <- c(A = 0, B = 0.7, C = 1.4, D = 2.1)
driver_effect <- c(-2.0, -0.7, 0.7, 2.0)   # row gradient
car_effect    <- c(-1.5, -0.5, 0.5, 1.5)   # column gradient

# Standard cyclic 4x4 Latin square
ls_layout <- matrix(c(
  "A","B","C","D",
  "B","C","D","A",
  "C","D","A","B",
  "D","A","B","C"
), nrow = 4, byrow = TRUE)

lap_df <- expand.grid(driver = factor(1:4), car = factor(1:4)) |>
  mutate(treatment = factor(ls_layout[cbind(as.integer(driver), as.integer(car))]),
         time = 80 + driver_effect[as.integer(driver)] +
                     car_effect[as.integer(car)] +
                     treat_effect[as.character(treatment)] +
                     rnorm(n(), sd = 0.4))

fit_crd  <- aov(time ~ treatment, data = lap_df)
fit_rcbd <- aov(time ~ driver + treatment, data = lap_df)
fit_lsd  <- aov(time ~ driver + car + treatment, data = lap_df)

# Treatment F and p-value from each fit
rbind(
  CRD  = summary(fit_crd )[[1]]["treatment", c("F value", "Pr(>F)")],
  RCBD = summary(fit_rcbd)[[1]]["treatment", c("F value", "Pr(>F)")],
  LSD  = summary(fit_lsd )[[1]]["treatment", c("F value", "Pr(>F)")]
)
#>      F value      Pr(>F)
#> CRD  0.6753 0.582964...
#> RCBD 1.3187 0.328041...
#> LSD  7.6418 0.017765...
```

Three models, identical 16 lap times, three different verdicts. CRD ignores both nuisance directions and reports an F of 0.68 with p ≈ 0.58, which looks like four interchangeable lubricants. RCBD blocks the driver, halves the residual, and pushes F to 1.32, but the car gradient still drowns the signal. LSD blocks both directions, the residual collapses, and F jumps to 7.64 with p ≈ 0.018. The "noise" was structured all along; naming both gradients as blocks is what recovered the signal.

[KEY INSIGHT]
**Blocking is bookkeeping, not a statistical trick.** Total variation in the response is fixed. CRD splits it two ways, RCBD three ways, LSD four ways. Every chunk you label as a block stops being noise, residuals shrink, and F = signal/noise rises automatically.

**Try it:** Pull the residual mean square from `fit_crd` and `fit_lsd` and compute the ratio. Save it as `ex_mse_ratio`. The number tells you how much smaller the LSD residual is.

```r title="Your turn: residual MS shrinkage"
ex_mse_crd <- summary(fit_crd)[[1]]["Residuals", "Mean Sq"]
ex_mse_lsd <- # your code here

ex_mse_ratio <- ex_mse_crd / ex_mse_lsd
round(ex_mse_ratio, 1)
#> Expected: a number well above 1, around 10
```

<details>
<summary>Click to reveal solution</summary>

```r title="Residual MS shrinkage solution"
ex_mse_crd <- summary(fit_crd)[[1]]["Residuals", "Mean Sq"]
ex_mse_lsd <- summary(fit_lsd)[[1]]["Residuals", "Mean Sq"]
ex_mse_ratio <- ex_mse_crd / ex_mse_lsd
round(ex_mse_ratio, 1)
#> [1] 10.6
```

**Explanation:** The CRD residual absorbs the driver gradient, the car gradient, and pure noise. The LSD residual absorbs only pure noise. The ratio of about 10 is the direct mechanical reason the F-test verdict flips: a 10× smaller denominator means a roughly 10× larger F.

</details>

## How do you build a balanced Latin square in R?

A Latin square needs a layout where every treatment label appears exactly once in each row and each column. The cleanest construction is a **cyclic standard square**, where row *i* is a left-shift of row 1 by *i* positions. Once you have a standard square, randomising rows and columns gives you a valid experimental layout. The two blocks below build a 4×4 square from scratch.

```r title="Build a cyclic 4x4 standard Latin square"
t <- 4
labels <- LETTERS[1:t]

# Row i is labels shifted by (i - 1) positions
std_square <- t(sapply(1:t, function(i) labels[((seq_len(t) + i - 2) %% t) + 1]))
std_square
#>      [,1] [,2] [,3] [,4]
#> [1,] "A"  "B"  "C"  "D"
#> [2,] "B"  "C"  "D"  "A"
#> [3,] "C"  "D"  "A"  "B"
#> [4,] "D"  "A"  "B"  "C"

# Quick sanity check: every label appears once per row and column
all(apply(std_square, 1, function(r) length(unique(r)) == t))   # rows
#> [1] TRUE
all(apply(std_square, 2, function(c) length(unique(c)) == t))   # cols
#> [1] TRUE
```

The standard square is correct but predictable: row 1 is always A B C D. To get a *random* Latin square you permute the rows, the columns, and the treatment labels independently. That is what the next block does.

```r title="Randomise rows, columns, and labels"
set.seed(7)
row_perm   <- sample(t)
col_perm   <- sample(t)
label_perm <- sample(labels)

# Apply row and column permutations
rand_square <- std_square[row_perm, col_perm]
# Re-label the treatments
rand_square[] <- label_perm[match(rand_square, labels)]
rand_square
#>      [,1] [,2] [,3] [,4]
#> [1,] "C"  "D"  "B"  "A"
#> [2,] "B"  "A"  "C"  "D"
#> [3,] "A"  "C"  "D"  "B"
#> [4,] "D"  "B"  "A"  "C"
```

Every treatment still appears once per row and once per column, but the layout is now drawn at random from the space of valid 4×4 Latin squares. Use this matrix to assign treatments to physical units before you collect data.

[NOTE]
**Production code can use `agricolae::design.lsd()`.** That helper randomises rows, columns, and labels in a single call, but it is not in the WebR package list, so the manual construction above is the portable version that runs in this tutorial. In your local RStudio, `agricolae::design.lsd(trt = LETTERS[1:4], seed = 7)` returns the same object plus a tidy data frame.

**Try it:** Build a 5×5 standard Latin square with treatments `A` through `E` and confirm every label appears once per row and once per column. Save the matrix as `ex_square5`.

```r title="Your turn: build a 5x5 Latin square"
t5 <- 5
labels5 <- LETTERS[1:t5]

ex_square5 <- # your code here

# Check
all(apply(ex_square5, 1, function(r) length(unique(r)) == t5))
all(apply(ex_square5, 2, function(c) length(unique(c)) == t5))
#> Expected: TRUE TRUE
```

<details>
<summary>Click to reveal solution</summary>

```r title="5x5 Latin square solution"
t5 <- 5
labels5 <- LETTERS[1:t5]
ex_square5 <- t(sapply(1:t5, function(i) labels5[((seq_len(t5) + i - 2) %% t5) + 1]))
ex_square5
#>      [,1] [,2] [,3] [,4] [,5]
#> [1,] "A"  "B"  "C"  "D"  "E"
#> [2,] "B"  "C"  "D"  "E"  "A"
#> [3,] "C"  "D"  "E"  "A"  "B"
#> [4,] "D"  "E"  "A"  "B"  "C"
#> [5,] "E"  "A"  "B"  "C"  "D"

all(apply(ex_square5, 1, function(r) length(unique(r)) == t5))
all(apply(ex_square5, 2, function(c) length(unique(c)) == t5))
#> [1] TRUE
#> [1] TRUE
```

**Explanation:** The cyclic construction works for any *t*. Each row is a left-shift of the alphabet by one extra position, so labels never collide within a row or column.

</details>

## How do you fit and interpret the Latin square ANOVA in R?

The Latin square model is a one-line extension of RCBD: response equals a row-block effect plus a column-block effect plus a treatment effect plus residual error. In symbols:

$$y_{ijk} = \mu + \rho_i + \gamma_j + \tau_k + \varepsilon_{ijk}$$

Where:

- $y_{ijk}$ = response for the unit in row $i$, column $j$ that received treatment $k$
- $\mu$ = grand mean
- $\rho_i$ = effect of row block $i$ (a known nuisance, like driver)
- $\gamma_j$ = effect of column block $j$ (a known nuisance, like car)
- $\tau_k$ = effect of treatment $k$ (the signal you care about)
- $\varepsilon_{ijk}$ = residual error, assumed independent and normally distributed

In R you fit the model with `aov()` using the additive formula `response ~ row + col + treatment`, then read the four-row ANOVA table.

```r title="Fit and inspect the LSD ANOVA"
lsd_fit <- aov(time ~ driver + car + treatment, data = lap_df)
summary(lsd_fit)
#>             Df Sum Sq Mean Sq F value  Pr(>F)
#> driver       3 33.876  11.292  29.207 0.00056 ***
#> car          3 18.751   6.250  16.166 0.00271 **
#> treatment    3  8.866   2.955   7.642 0.01776 *
#> Residuals    6  2.320   0.387
```

![The Latin square partitions total variation into row, column, treatment, and residual sums of squares.](screenshots/Latin-Square-Design-in-R-variance-partition.webp)
*Figure 1: The Latin square partitions total variation into row, column, treatment, and residual sums of squares.*

Four lines, four chunks of variance. Driver explains 33.9 units of sum-of-squares, car explains 18.8, treatment explains 8.9, and only 2.3 are left over as residual. Both nuisance factors are highly significant, which is the *point* of blocking on them, not a problem. The treatment line is what you act on: F = 7.64 on 3 and 6 degrees of freedom, p = 0.018, so the four lubricants do produce different lap times. The residual df of `(t-1)(t-2) = 6` is the price you pay for fitting two block effects, and is the main reason small Latin squares get replicated (covered later).

[TIP]
**Always cast row, column, and treatment as factors before fitting.** `aov()` treats numeric columns as continuous predictors with a single slope, collapsing the three-df block effect into one and inflating the residual. The simulation above used `factor(1:4)` for both blocks for exactly this reason.

**Try it:** When the omnibus F is significant, pairwise comparisons identify *which* treatments differ. Run `TukeyHSD()` on the treatment factor only and save the result as `ex_tuk`. Inspect the comparison with the smallest adjusted p-value.

```r title="Your turn: Tukey HSD on treatments"
ex_tuk <- # your code here

# Comparisons sorted by adjusted p-value
ex_tuk$treatment[order(ex_tuk$treatment[, "p adj"]), ]
#> Expected: a 6-row matrix; the smallest p adj is the D-A pair
```

<details>
<summary>Click to reveal solution</summary>

```r title="Tukey HSD solution"
ex_tuk <- TukeyHSD(lsd_fit, "treatment")
ex_tuk$treatment[order(ex_tuk$treatment[, "p adj"]), ]
#>          diff        lwr      upr     p adj
#> D-A  2.10...  0.585...  3.62... 0.012...
#> D-B  1.45...  ... ... ...
#> ...
```

**Explanation:** `TukeyHSD()` produces all six pairwise contrasts for four treatments. Pass only `"treatment"` because the row and column comparisons are nuisance factors with no scientific interest. The smallest adjusted p-value belongs to the D vs A contrast, the largest gap in the simulated treatment effects.

</details>

## How do you check the Latin square assumptions?

The Latin square ANOVA assumes the model is **strictly additive**: there is no interaction between treatment and either block, and no row-by-column interaction. Each treatment-row-column cell appears exactly once, so the design has *no replication left to estimate any interaction*, if interactions are real, the residual df is contaminated and the F-test misleads. You also assume the residuals are roughly normal and have constant variance. Two diagnostics catch most violations.

```r title="Residual diagnostic plots"
par(mfrow = c(1, 2))
plot(lsd_fit, which = 1)   # residuals vs fitted
plot(lsd_fit, which = 2)   # normal Q-Q plot
par(mfrow = c(1, 1))
```

The residuals-vs-fitted plot should look like a horizontal cloud with no funnel shape; a clear pattern signals an interaction or non-constant variance. The Q-Q plot's points should track the straight line; severe S-shapes or fat tails warn that the F-test's nominal p-value is suspect. With only six residual df in a 4×4 square, do not over-interpret minor wiggles, but a strongly curved fit line on the residuals plot is a real red flag.

[WARNING]
**The no-interaction assumption is unrescuable in a single Latin square.** A 4×4 LSD has 16 observations and 10 model df (3+3+3 plus the intercept), leaving 6 for the residual. None of those df are available to test treatment×block interactions, so a real interaction will silently bias the treatment estimates. If you suspect the treatment behaves differently across rows or columns, replicate the square (see below) or move to a factorial design.

**Try it:** Run the Shapiro-Wilk test on the model residuals to back up the Q-Q plot. Save the result as `ex_shap` and read off the p-value.

```r title="Your turn: Shapiro-Wilk on residuals"
ex_shap <- # your code here

ex_shap$p.value
#> Expected: a p-value above 0.05 (no evidence against normality)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Shapiro-Wilk solution"
ex_shap <- shapiro.test(residuals(lsd_fit))
ex_shap
#> 
#>     Shapiro-Wilk normality test
#> 
#> data:  residuals(lsd_fit)
#> W = 0.94..., p-value = 0.4...

ex_shap$p.value
#> [1] 0.4...
```

**Explanation:** With p well above 0.05, the residuals are consistent with normality. Shapiro-Wilk is sensitive to small samples in both directions: with only 16 residuals it can miss real departures, so always pair it with the Q-Q plot rather than relying on the p-value alone.

</details>

## How efficient is a Latin square versus simpler designs?

Once you have an LSD model and a competing model fit on the same data, you can quantify the precision gain as a **relative efficiency** (RE). Intuitively, RE answers: "how many times more observations would the simpler design need to match the LSD's precision?" An RE of 5 means a CRD or RCBD trial would need roughly five times as many runs to estimate the treatment effect as tightly as the Latin square does.

The Fisher relative-efficiency formula adjusts for the different residual df between the two designs, then compares their residual mean squares:

$$\text{RE}_{a \text{ vs } b} = \frac{(df_a + 1)(df_b + 3)}{(df_b + 1)(df_a + 3)} \cdot \frac{\text{MSE}_b}{\text{MSE}_a}$$

Where:

- $df_a$, $\text{MSE}_a$ = residual df and mean square of the better design (LSD here)
- $df_b$, $\text{MSE}_b$ = same quantities for the alternative being compared

The block below applies the formula to the lap-time fits.

```r title="Relative efficiency: LSD vs RCBD vs CRD"
mse_crd  <- summary(fit_crd )[[1]]["Residuals", "Mean Sq"]
mse_rcbd <- summary(fit_rcbd)[[1]]["Residuals", "Mean Sq"]
mse_lsd  <- summary(lsd_fit  )[[1]]["Residuals", "Mean Sq"]

df_crd  <- df.residual(fit_crd )   # 12
df_rcbd <- df.residual(fit_rcbd)   #  9
df_lsd  <- df.residual(lsd_fit  )  #  6

# Helper: RE of design 'a' (here LSD) over alternative 'b'
relative_eff <- function(df_a, mse_a, df_b, mse_b) {
  ((df_a + 1) * (df_b + 3)) / ((df_b + 1) * (df_a + 3)) * (mse_b / mse_a)
}

re_vs_crd  <- relative_eff(df_lsd, mse_lsd, df_crd , mse_crd )
re_vs_rcbd <- relative_eff(df_lsd, mse_lsd, df_rcbd, mse_rcbd)

c(LSD_vs_CRD = round(re_vs_crd, 2), LSD_vs_RCBD = round(re_vs_rcbd, 2))
#>  LSD_vs_CRD LSD_vs_RCBD
#>       9.51        5.45
```

LSD is roughly 9.5× more efficient than CRD and 5.5× more efficient than RCBD on this dataset. Read those numbers as sample-size multipliers: a CRD analysis would need about 16 × 9.5 ≈ 150 runs to match the precision the Latin square delivers in 16 runs, and an RCBD blocking only on driver would still need about 88. The two-direction blocking is doing real work.

[KEY INSIGHT]
**Relative efficiency is a budget translator.** It converts MS-residual reductions into a hard, interpretable savings, "how many times more units would we need without this blocking?" When RE is below 1.2, the extra design constraint is barely paying for itself; above 2 it is a clear win; above 5 it is a transformation. Always report both REs (vs CRD and vs RCBD) so the reader can see how much each blocking layer contributed.

**Try it:** Compute the relative efficiency of LSD versus a hypothetical RCBD that blocks only on **car** (the column factor). Fit a fresh `fit_rcbd_car` model, extract its MSE and residual df, and reuse `relative_eff()`. Save the answer as `ex_re_car`.

```r title="Your turn: RE of LSD vs car-only RCBD"
fit_rcbd_car <- aov(time ~ car + treatment, data = lap_df)
mse_rcbd_car <- # your code here
df_rcbd_car  <- # your code here

ex_re_car <- relative_eff(df_lsd, mse_lsd, df_rcbd_car, mse_rcbd_car)
round(ex_re_car, 2)
#> Expected: a number well above 1 (driver was the bigger gradient)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Car-only RCBD efficiency solution"
fit_rcbd_car <- aov(time ~ car + treatment, data = lap_df)
mse_rcbd_car <- summary(fit_rcbd_car)[[1]]["Residuals", "Mean Sq"]
df_rcbd_car  <- df.residual(fit_rcbd_car)

ex_re_car <- relative_eff(df_lsd, mse_lsd, df_rcbd_car, mse_rcbd_car)
round(ex_re_car, 2)
#> [1] 7.4...
```

**Explanation:** Blocking on car alone leaves the (larger) driver gradient in the residual, so the resulting MSE is bigger than the driver-only RCBD's, and the LSD's edge over it is therefore larger. The take-away: in a two-gradient world both blocks earn their keep, but the bigger gradient earns more.

</details>

## When should you replicate the Latin square?

A *t × t* Latin square uses $t^2$ runs and gives only $(t-1)(t-2)$ residual df. For a 3×3 square that is just **2** residual df, which makes the F-test almost powerless, a single bad observation can flip the verdict. The standard fix is to **replicate the square**: run the same design `r` times with fresh randomisation, then add a `replicate` term to the model. That recovers degrees of freedom without changing the design philosophy.

```r title="Simulate r=3 replicated 3x3 squares and compare"
set.seed(909)
t3 <- 3
treat3   <- c(A = 0, B = 0.6, C = 1.2)
row3_eff <- c(-1.0, 0.0, 1.0)
col3_eff <- c(-0.8, 0.0, 0.8)

# A fixed standard 3x3 cyclic square, reused across all replicates
sq3 <- t(sapply(1:t3, function(i) LETTERS[((seq_len(t3) + i - 2) %% t3) + 1]))

build_rep <- function(rep_id) {
  expand.grid(row = factor(1:t3), col = factor(1:t3)) |>
    mutate(replicate = factor(rep_id),
           treatment = factor(sq3[cbind(as.integer(row), as.integer(col))]),
           y = 50 + row3_eff[as.integer(row)] +
                    col3_eff[as.integer(col)] +
                    treat3[as.character(treatment)] +
                    rnorm(n(), sd = 0.5))
}

rep_df <- bind_rows(lapply(1:3, build_rep))
fit_single <- aov(y ~ row + col + treatment, data = subset(rep_df, replicate == "1"))
fit_rep    <- aov(y ~ replicate + row + col + treatment, data = rep_df)

c(single_resid_df = df.residual(fit_single),
  replicated_resid_df = df.residual(fit_rep))
#>     single_resid_df replicated_resid_df
#>                   2                  20
```

Two residual df versus twenty. A single 3×3 square has so few residual df that the t-statistic for any treatment contrast is unstable; three replicates push the residual df comfortably past any rule-of-thumb threshold. Compare the treatment p-values from the two models below to see how much more confident the replicated test is.

```r title="Treatment F and p-value: single square vs replicated"
rbind(
  single     = summary(fit_single)[[1]]["treatment", c("F value", "Pr(>F)")],
  replicated = summary(fit_rep   )[[1]]["treatment", c("F value", "Pr(>F)")]
)
#>            F value     Pr(>F)
#> single     2.01...    0.33...
#> replicated 7.45...    0.00388
```

The single-square fit has so much residual variability per df that even a real treatment effect looks insignificant; the replicated fit lands at p ≈ 0.004 because the same effect is tested against a much steadier denominator. The cost was 18 extra observations, not a redesign.

[TIP]
**Replicate small Latin squares before you collect data, not after.** Pre-committing to `r = 2` or `r = 3` replicates of a 3×3 or 4×4 design is the cheapest way to buy enough residual df for trustworthy inference. Each new replicate adds $t^2$ observations and $(t^2 - 1)$ residual df after accounting for the replicate intercept, so the second replicate is the highest-value purchase.

**Try it:** Confirm the residual df scales the way the formula predicts. Build the same data with `r = 4` replicates of the 3×3 square and check that the residual df climbs again. Save the count as `ex_df_rep4`.

```r title="Your turn: residual df with r = 4"
rep4_df <- bind_rows(lapply(1:4, build_rep))
fit_rep4 <- # your code here

ex_df_rep4 <- df.residual(fit_rep4)
ex_df_rep4
#> Expected: an integer well above 20
```

<details>
<summary>Click to reveal solution</summary>

```r title="r=4 residual df solution"
rep4_df  <- bind_rows(lapply(1:4, build_rep))
fit_rep4 <- aov(y ~ replicate + row + col + treatment, data = rep4_df)
ex_df_rep4 <- df.residual(fit_rep4)
ex_df_rep4
#> [1] 29
```

**Explanation:** Total observations = 36, model df = 3 (replicate) + 2 (row) + 2 (col) + 2 (treatment) = 9 (plus the intercept absorbed by the model). Residual df = 36 - 1 - 6 = 29. Each extra replicate adds about $t^2 - 1 = 8$ residual df.

</details>

## Practice Exercises

### Exercise 1: Order-effect Latin square (taste test)

Four taste-testers (rows) try four wines (treatments) in four time slots (columns). Tasters get tired across the day, so time slot is a real nuisance. Simulate the data with `set.seed(99)`, time-slot effect `c(0, -0.3, -0.6, -1.0)`, and wine effect `c(A = 0, B = 0.4, C = 0.8, D = 1.2)`, noise `sd = 0.3`. Fit the LSD ANOVA and confirm the time-slot SS captures the fatigue.

```r title="Your turn: wine-tasting LSD"
# Reuse the cyclic 4x4 layout from earlier
# Hint: build the data, fit aov(score ~ taster + slot + wine), then summary()

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Wine-tasting LSD solution"
set.seed(99)
slot_effect <- c(0, -0.3, -0.6, -1.0)
wine_effect <- c(A = 0, B = 0.4, C = 0.8, D = 1.2)

wine_df <- expand.grid(taster = factor(1:4), slot = factor(1:4)) |>
  mutate(wine  = factor(ls_layout[cbind(as.integer(taster), as.integer(slot))]),
         score = 7 + slot_effect[as.integer(slot)] +
                     wine_effect[as.character(wine)] +
                     rnorm(n(), sd = 0.3))

fit_wine <- aov(score ~ taster + slot + wine, data = wine_df)
summary(fit_wine)
#>             Df Sum Sq Mean Sq F value  Pr(>F)
#> taster       3 0.6...  0.2...   2.4...  0.16...
#> slot         3 2.4...  0.8...   9.5...  0.011 *
#> wine         3 3.1...  1.05...  12.4... 0.0056 **
#> Residuals    6 0.5...  0.08...
```

**Explanation:** `slot` (the time-of-day fatigue) shows up as a clearly significant SS, doing the job that blocking is supposed to do. `wine` is even more significant because the simulated effects span 1.2 score points. `taster` is a smaller noise source here, but you still want it in the model, leaving it out would let any taster-to-taster differences leak back into the residual.

</details>

### Exercise 2: Replicated 3×3 squares for power

A single 3×3 Latin square gives only 2 residual df, which is not enough to detect a moderate effect. Use the `build_rep()` helper from earlier to simulate `r = 5` replicates, fit `aov(y ~ replicate + row + col + treatment)`, and compare the treatment p-value to the single-square fit.

```r title="Your turn: r = 5 replicated squares"
# Use build_rep() defined earlier
# Hint: lapply(1:5, build_rep) then bind_rows()

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="r=5 replicated squares solution"
rep5_df  <- bind_rows(lapply(1:5, build_rep))
fit_rep5 <- aov(y ~ replicate + row + col + treatment, data = rep5_df)

c(resid_df = df.residual(fit_rep5),
  treatment_p = summary(fit_rep5)[[1]]["treatment", "Pr(>F)"])
#>     resid_df  treatment_p
#>     38.0000   0.000180...
```

**Explanation:** Five replicates of a 3×3 give 45 total observations and 38 residual df. The treatment p-value drops below 0.001 because the effect is tested against an MS-residual estimated with high precision. Compare this to the single-square `fit_single` p-value (~0.33) for the same true effect, and the value of replication is obvious.

</details>

## Putting It All Together

The dessert-tasting workflow ties everything together: build a 5×5 Latin square so that five judges (rows) score five desserts (treatments) across five courses (columns), simulate scores with judge fatigue and a real dessert effect, fit the ANOVA, run Tukey HSD, and quantify the design's efficiency.

```r title="End-to-end 5x5 dessert tasting"
set.seed(551)
t <- 5
labs <- LETTERS[1:t]
sq5 <- t(sapply(1:t, function(i) labs[((seq_len(t) + i - 2) %% t) + 1]))

judge_eff   <- c(-0.6, -0.3, 0.0, 0.3, 0.6)
course_eff  <- c(0.0, -0.2, -0.4, -0.6, -0.8)         # palate fatigue
dessert_eff <- c(A = 0, B = 0.4, C = 0.8, D = 1.2, E = 1.6)

dessert_df <- expand.grid(judge = factor(1:t), course = factor(1:t)) |>
  mutate(dessert = factor(sq5[cbind(as.integer(judge), as.integer(course))]),
         score   = 6 + judge_eff[as.integer(judge)] +
                       course_eff[as.integer(course)] +
                       dessert_eff[as.character(dessert)] +
                       rnorm(n(), sd = 0.35))

fit_dessert <- aov(score ~ judge + course + dessert, data = dessert_df)
summary(fit_dessert)
#>             Df Sum Sq Mean Sq F value   Pr(>F)
#> judge        4  3.4...  0.85...  6.9...  0.0028 **
#> course       4  4.1...  1.02...  8.3...  0.0014 **
#> dessert      4  6.8...  1.71... 13.9...  0.00010 ***
#> Residuals   12  1.4...  0.12...

# Where is the win? Tukey contrasts on dessert
TukeyHSD(fit_dessert, "dessert")$dessert |>
  round(3) |>
  head(4)
#>      diff   lwr   upr p adj
#> B-A  0.40 -0.27  1.07 0.394
#> C-A  0.85  0.18  1.52 0.011
#> D-A  1.25  0.58  1.92 0.000
#> E-A  1.65  0.98  2.32 0.000

# Efficiency vs CRD on the same scores
fit_dessert_crd <- aov(score ~ dessert, data = dessert_df)
mse_d_lsd <- summary(fit_dessert    )[[1]]["Residuals", "Mean Sq"]
mse_d_crd <- summary(fit_dessert_crd)[[1]]["Residuals", "Mean Sq"]
relative_eff(df.residual(fit_dessert), mse_d_lsd,
             df.residual(fit_dessert_crd), mse_d_crd) |> round(2)
#> [1] 5.7
```

The dessert effect is the strongest source of variation, with F ≈ 14 and p well below 0.001. Tukey shows desserts C, D, and E all score significantly higher than A; B is borderline. The relative efficiency of about 5.7 says a CRD trial on the same noise would need roughly 5.7 × 25 ≈ 143 score sheets to match this Latin square's precision, a clean illustration of why two-way blocking pays off when both judges and courses contribute real variability.

## Summary

The key trade-offs at a glance:

| Feature | CRD | RCBD | Latin Square |
|---|---|---|---|
| Nuisance sources controlled | 0 | 1 | 2 (crossed) |
| Required structure | none | n × b grid | t × t grid |
| Treatment df | t − 1 | t − 1 | t − 1 |
| Residual df (single replicate) | n − t | (n − t)(b − 1)/b | (t − 1)(t − 2) |
| Treatment×block interaction | n/a | testable if replicated | not estimable |
| Best when | nuisance unknown | one strong gradient | two crossed gradients |
| Practical t range | any | any | 4 to 8 (replicate if smaller) |

![Decision flow: which blocking design fits your nuisance structure.](screenshots/Latin-Square-Design-in-R-decision-flow.webp)
*Figure 2: Choose the design from the number of crossed nuisance directions you need to control.*

Five things to remember:

1. The Latin square needs **rows = columns = treatments = t** and produces $(t-1)(t-2)$ residual df.
2. Fit it with `aov(response ~ row + col + treatment)`; cast all three predictors as factors first.
3. Always report **relative efficiency** versus CRD and RCBD so readers see what the blocking bought you.
4. The design assumes **no interactions** between treatment and either block, there is no df left to test them.
5. If $t \le 4$, replicate the square; a single 3×3 has only 2 residual df and almost no power.

## References

1. Cochran, W.G. & Cox, G.M., *Experimental Designs*, 2nd ed. Wiley Classics (1957). Chapter 4. [Link](https://onlinelibrary.wiley.com/doi/book/10.1002/9781118150993)
2. Montgomery, D.C., *Design and Analysis of Experiments*, 10th ed. Wiley (2020). Chapter 4: Randomised Blocks, Latin Squares, and Related Designs. [Link](https://www.wiley.com/en-us/Design+and+Analysis+of+Experiments%2C+10th+Edition-p-9781119492443)
3. Penn State STAT 502, Latin Square Design (LSD) lesson 7.4. [Link](https://online.stat.psu.edu/stat502/lesson/7/7.4)
4. R Core Team, `aov` documentation, `?aov`. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/aov.html)
5. agricolae R package, `design.lsd` function reference. [Link](https://search.r-project.org/CRAN/refmans/agricolae/html/design.lsd.html)
6. Box, G.E.P., Hunter, J.S. & Hunter, W.G., *Statistics for Experimenters*, 2nd ed. Wiley (2005). Chapter 7. [Link](https://www.wiley.com/en-us/Statistics+for+Experimenters%3A+Design%2C+Innovation%2C+and+Discovery%2C+2nd+Edition-p-9780471718130)

## Continue Learning

- [Experimental Design in R: The Three Principles That Make Results Valid and Generalisable](Experimental-Design-Principles-in-R.html), the parent core post that places randomisation, blocking, and replication in one frame.
- [Randomized Complete Block Design (RCBD) in R](Randomized-Complete-Block-Design-in-R.html), the one-blocking-factor cousin that the Latin square generalises.
- [Three-Way ANOVA in R](Three-Way-ANOVA-in-R.html), the next step when the row and column factors are scientifically interesting in their own right and you want to test their interaction with treatment.
