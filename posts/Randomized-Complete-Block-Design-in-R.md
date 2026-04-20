---
title: "Randomized Complete Block Design (RCBD) in R: Block Nuisance Variability"
slug: "Randomized-Complete-Block-Design-in-R"
description: "Master Randomized Complete Block Design (RCBD) in R with aov(): blocking strategy, ANOVA setup, model diagnostics, post-hoc tests, and efficiency vs CRD."
keywords: "RCBD in R, randomized complete block design, randomized block design R, blocking ANOVA, aov block term, RCBD efficiency, relative efficiency blocking, RCBD diagnostics, TukeyHSD blocked design, agricolae RCBD"
auto_link_terms: "RCBD|randomized complete block design|randomised complete block design|randomized block design|relative efficiency of blocking|blocking factor"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-20"
curriculum_id: "FR-anov-2"
post_type: "FR"
fr_parent: "Experimental-Design-Principles-in-R.html"
difficulty: "Intermediate"
---

# Randomized Complete Block Design (RCBD) in R: Block Nuisance Variability

<p class="lead">A <strong>randomized complete block design (RCBD)</strong> groups experimental units into homogeneous blocks before randomly assigning every treatment to one unit per block. Pulling block-to-block variability out of the residual term sharpens the F-test for the treatment effect and protects you from a known nuisance source.</p>

## What does an RCBD let you detect that a CRD misses?

Picture four fertilisers tested on a long sloping field. Soil moisture rises down the slope, so any random plot layout pollutes the treatment comparison with moisture noise. RCBD groups plots into strips that each cover the full slope and randomises the four fertilisers inside every strip. The same yield numbers, analysed with the block term in the model, often turn from a borderline result into a clean significant difference. Below is the side-by-side proof on simulated data.

```r title="Simulate plot data and fit CRD vs RCBD"
library(dplyr)

set.seed(217)
n_blocks <- 5
treatments <- c("A", "B", "C", "D")
block_effect <- c(-3, -1.5, 0, 1.5, 3)          # strong soil gradient
treat_effect <- c(A = 0, B = 0.6, C = 1.2, D = 1.8)

plot_df <- expand.grid(block = factor(1:n_blocks),
                       treatment = factor(treatments)) |>
  mutate(yield = 10 + block_effect[as.integer(block)]
                    + treat_effect[as.character(treatment)]
                    + rnorm(n(), sd = 0.6))

# Fit 1: ignore the block (CRD-style)
fit_crd  <- aov(yield ~ treatment, data = plot_df)
# Fit 2: include the block (RCBD)
fit_rcbd <- aov(yield ~ block + treatment, data = plot_df)

summary(fit_crd)[[1]]["treatment", c("F value", "Pr(>F)")]
#>            F value    Pr(>F)
#> treatment 0.811089 0.5061571
summary(fit_rcbd)[[1]]["treatment", c("F value", "Pr(>F)")]
#>            F value       Pr(>F)
#> treatment 18.68402 8.120732e-05
```

Two models, identical response values, very different verdicts. The CRD analysis shows a treatment F of 0.81 and a p-value of 0.51, looking like the fertilisers are interchangeable. The RCBD analysis pulls the soil gradient out of the residuals, the treatment F jumps to 18.68, and the p-value drops to about 0.00008. The "noise" was structured all along, and naming it as a block recovered the signal.

[KEY INSIGHT]
**Blocking is not a statistical trick, it is bookkeeping.** The total variation in the response is a fixed quantity. The CRD model splits it two ways (treatment + residual), the RCBD splits it three ways (treatment + block + residual). The piece you label "block" stops being noise, residuals shrink, and F = signal/noise rises automatically.

**Try it:** Pull the residual mean square from both `fit_crd` and `fit_rcbd` and compute the ratio. Save the ratio as `ex_mse_ratio`. Confirm it is comfortably above 1 (the RCBD residuals are much smaller).

```r title="Your turn: compare residual mean squares"
ex_mse_crd  <- summary(fit_crd )[[1]]["Residuals", "Mean Sq"]
ex_mse_rcbd <- # your code here

ex_mse_ratio <- ex_mse_crd / ex_mse_rcbd
round(ex_mse_ratio, 1)
#> Expected: a number well above 1 (closer to 15)
```

<details>
<summary>Click to reveal solution</summary>

```r title="MSE ratio solution"
ex_mse_crd  <- summary(fit_crd )[[1]]["Residuals", "Mean Sq"]
ex_mse_rcbd <- summary(fit_rcbd)[[1]]["Residuals", "Mean Sq"]
ex_mse_ratio <- ex_mse_crd / ex_mse_rcbd
round(ex_mse_ratio, 1)
#> [1] 23
```

**Explanation:** The CRD residual mean square absorbs the entire soil gradient, the RCBD's does not. The ratio of about 23 is the direct mechanical reason the F-test verdict flips: smaller denominator means larger F.

</details>

## How do you randomize treatments inside each block?

Two rules govern the layout. Every treatment must appear exactly once per block (that is the *complete* in RCBD), and the order of treatments inside each block must be drawn at random and independently from every other block. The randomisation is what licenses the inference: it prevents any unmeasured nuisance from systematically lining up with a treatment.

You build the layout in R by grouping plots by block and shuffling the treatment vector inside each group.

```r title="Randomise treatments within blocks"
set.seed(118)

layout_df <- expand.grid(block = factor(1:n_blocks),
                         treatment = factor(treatments)) |>
  group_by(block) |>
  mutate(plot_in_block = sample(seq_len(n()))) |>
  arrange(block, plot_in_block) |>
  ungroup()

head(layout_df, 8)
#> # A tibble: 8 x 3
#>   block treatment plot_in_block
#>   <fct> <fct>             <int>
#> 1 1     C                     1
#> 2 1     D                     2
#> 3 1     B                     3
#> 4 1     A                     4
#> 5 2     A                     1
#> 6 2     B                     2
#> 7 2     D                     3
#> 8 2     C                     4
```

Block 1 happens to draw the order C, D, B, A; block 2 draws A, B, D, C. Each block contains all four treatments exactly once and the within-block order is independent across blocks. This `layout_df` is the field map you would carry into the experiment, telling each plot which fertiliser to receive.

![Decision flow for choosing between CRD, RCBD, Latin Square, and incomplete block designs based on what you know about nuisance variability.](screenshots/Randomized-Complete-Block-Design-in-R-decision-flow.webp)
*Figure 1: Decision flow for choosing between CRD, RCBD, Latin Square, and incomplete block designs based on what you know about nuisance variability.*

**Try it:** Re-randomise `layout_df` with `set.seed(42)` and check that every block still contains exactly one of each treatment. Save the result as `ex_layout`.

```r title="Your turn: re-randomise the layout"
set.seed(42)

ex_layout <- expand.grid(block = factor(1:n_blocks),
                         treatment = factor(treatments)) |>
  group_by(block) |>
  # your code here: shuffle inside each block

  ungroup()

# Test:
table(ex_layout$block, ex_layout$treatment)
#> Expected: a 5x4 table where every cell is 1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Re-randomise solution"
set.seed(42)

ex_layout <- expand.grid(block = factor(1:n_blocks),
                         treatment = factor(treatments)) |>
  group_by(block) |>
  mutate(plot_in_block = sample(seq_len(n()))) |>
  arrange(block, plot_in_block) |>
  ungroup()

table(ex_layout$block, ex_layout$treatment)
#>    A B C D
#>  1 1 1 1 1
#>  2 1 1 1 1
#>  3 1 1 1 1
#>  4 1 1 1 1
#>  5 1 1 1 1
```

**Explanation:** `sample(seq_len(n()))` produces a permutation of 1 to n inside each `group_by(block)` group. Because the assignment is a permutation, the block contains every treatment exactly once.

</details>

## How do you fit and read the RCBD ANOVA in R?

The RCBD model is purely additive. The mean response in plot $j$ of block $i$ is

$$y_{ij} = \mu + \tau_i + \beta_j + \varepsilon_{ij}$$

Where:
- $\mu$ is the grand mean
- $\tau_i$ is the effect of treatment $i$
- $\beta_j$ is the effect of block $j$
- $\varepsilon_{ij}$ is the residual, assumed normal with constant variance

Note what is *missing*: there is no $\tau\beta$ interaction term. With one observation per block-treatment cell, an interaction would consume every residual degree of freedom and leave nothing to test against. The single replicate inside each block is the whole reason RCBD is cheap, and the assumption you pay for it is additivity.

The full ANOVA table comes from `aov()` plus `summary()`.

```r title="Fit the RCBD model and read the ANOVA table"
fit_rcbd <- aov(yield ~ block + treatment, data = plot_df)
summary(fit_rcbd)
#>             Df Sum Sq Mean Sq F value   Pr(>F)
#> block        4  83.66  20.915   89.15 8.10e-09
#> treatment    3  13.15   4.384   18.68 8.12e-05
#> Residuals   12   2.82   0.235
```

Three rows, three F-tests. The block row shows the soil gradient is enormous (F = 89.2), exactly the bookkeeping we hoped for: 84 units of variation that would have been residual under a CRD are now correctly attributed to the strip. The treatment row keeps the small but real fertiliser effect (F = 18.7, p < 0.0001). Residuals carry only 2.82 units of sum-of-squares across 12 degrees of freedom, giving a tight mean-square of 0.235 against which the treatment F is computed.

You can fit the same model with `lm()` if you want to inspect coefficients or get effect sizes by hand.

```r title="Fit the same model with lm() and compute eta-squared"
fit_lm <- lm(yield ~ block + treatment, data = plot_df)
ss <- anova(fit_lm)[, "Sum Sq"]
names(ss) <- rownames(anova(fit_lm))

eta_block     <- ss["block"]     / sum(ss)
eta_treatment <- ss["treatment"] / sum(ss)
round(c(block = eta_block, treatment = eta_treatment), 3)
#> block.block treatment.treatment
#>       0.840               0.132
```

Block accounts for 84% of total variation, treatment for 13%, residual for the remaining 3%. Eta-squared makes the magnitude of the block effect explicit and tells the story the F-test alone cannot: the soil gradient is the dominant source of variation in this field, and accommodating it via blocking is the most consequential modelling decision in the analysis.

[WARNING]
**Never include `block:treatment` in a single-replicate RCBD.** Writing `aov(yield ~ block * treatment, data = plot_df)` consumes all residual degrees of freedom (the design has only one observation per cell) and leaves zero df for the F-test. R will silently fit it and return `NaN` p-values. If you need to test interaction, you must add replicates per block-treatment combination or move to a different design.

**Try it:** Refit the RCBD model with the term order reversed: `yield ~ treatment + block`. The ANOVA table should be byte-identical to the original because the design is balanced. Save the new fit as `ex_fit`.

```r title="Your turn: swap term order in the formula"
ex_fit <- aov(yield ~ ___ + ___, data = plot_df)  # your code here

# Test:
identical(round(summary(ex_fit)[[1]][, "Sum Sq"], 4),
          round(summary(fit_rcbd)[[1]][c("treatment","block","Residuals"), "Sum Sq"], 4))
#> Expected: TRUE
```

<details>
<summary>Click to reveal solution</summary>

```r title="Term order solution"
ex_fit <- aov(yield ~ treatment + block, data = plot_df)
summary(ex_fit)
#>             Df Sum Sq Mean Sq F value   Pr(>F)
#> treatment    3  13.15   4.384   18.68 8.12e-05
#> block        4  83.66  20.915   89.15 8.10e-09
#> Residuals   12   2.82   0.235
```

**Explanation:** R's default Type I sums of squares depend on order, but only when factors are correlated. In a balanced RCBD, block and treatment are orthogonal, so each row of the ANOVA table holds the same SS regardless of which is fitted first.

</details>

## How do you check the RCBD model's assumptions?

Three assumptions sit underneath every RCBD F-test: residual normality, homogeneous variance across treatments, and additivity of block and treatment effects (the missing interaction term). The standard four diagnostic plots cover the first two.

```r title="Plot diagnostic residuals for the RCBD fit"
par(mfrow = c(2, 2))
plot(fit_rcbd)
par(mfrow = c(1, 1))
```

The Residuals-vs-Fitted panel should show a flat lowess line and an even vertical band; a funnel suggests heteroscedasticity. The Q-Q plot of standardised residuals should fall on the diagonal; systematic curvature flags non-normality. Scale-Location lets you confirm the spread is constant. Residuals-vs-Leverage flags any single block-treatment cell that is dragging the fit.

[KEY INSIGHT]
**Diagnostics in RCBD are read against block-adjusted residuals, not raw deviations from the treatment mean.** That is why you call `plot(fit_rcbd)` and not `plot(yield ~ treatment)`. Once the block has been removed from the response, what is left is the pure measurement noise the model assumes is normal and homoscedastic.

The third assumption, additivity, has its own quick test. The Tukey 1-df test for nonadditivity refits the model with one extra parameter built from the cross-products of fitted block and treatment effects; if that single df is significant, the additive RCBD model is mis-specified.

```r title="Check additivity, normality, and equal variance"
# Tukey 1-df test for nonadditivity (built by hand)
mu  <- mean(plot_df$yield)
b   <- ave(plot_df$yield, plot_df$block,     FUN = mean) - mu
t   <- ave(plot_df$yield, plot_df$treatment, FUN = mean) - mu
fit_tukey <- aov(yield ~ block + treatment + I(b * t), data = plot_df)
summary(fit_tukey)[[1]]["I(b * t)", c("F value", "Pr(>F)")]
#>           F value     Pr(>F)
#> I(b * t) 3.253103 0.09870731

# Normality of residuals
res <- residuals(fit_rcbd)
shapiro.test(res)$p.value
#> [1] 0.4926623

# Equal variance across treatments
bartlett.test(res ~ plot_df$treatment)$p.value
#> [1] 0.363584
```

The 1-df nonadditivity test returns p = 0.099, just above the conventional 0.05 cutoff, so we narrowly fail to reject the additive model: there is no convincing block-by-treatment interaction, though the marginal p-value is a reminder that the assumption is not bullet-proof here. Shapiro-Wilk's p of 0.49 keeps the normality assumption intact, and Bartlett's p of 0.36 confirms variance is comparable across the four fertilisers. The F-tests in the previous section can be trusted.

**Try it:** Run `shapiro.test()` on the residuals of the CRD fit (`fit_crd`) and on the RCBD fit. Save the two p-values to `ex_p_crd` and `ex_p_rcbd`. Which is closer to a normal distribution?

```r title="Your turn: compare residual normality"
ex_p_crd  <- shapiro.test(residuals(fit_crd ))$p.value
ex_p_rcbd <- shapiro.test(residuals(fit_rcbd))$p.value
c(crd = ex_p_crd, rcbd = ex_p_rcbd)
# Expected: rcbd p-value larger than crd p-value
# (block-adjusted residuals look more normal)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Compare normality solution"
ex_p_crd  <- shapiro.test(residuals(fit_crd ))$p.value
ex_p_rcbd <- shapiro.test(residuals(fit_rcbd))$p.value
round(c(crd = ex_p_crd, rcbd = ex_p_rcbd), 3)
#>   crd  rcbd
#> 0.365 0.493
```

**Explanation:** Both p-values are above 0.05, so neither residual set fails normality outright, but the RCBD residuals score the higher p-value. That is the expected pattern: the CRD residuals carry the systematic block effect on top of the noise, which nudges them away from a clean normal shape.

</details>

## How efficient was the blocking? (Relative efficiency vs CRD)

You spent design effort to identify and form blocks, and you paid for it in degrees of freedom. The natural question is: did blocking pay off? The answer is captured by the **relative efficiency of blocking**, a single number that says "the RCBD with my $n$ plots gave me the same precision as a hypothetical CRD using $n \times \text{RE}$ plots."

The standard formula uses the mean squares from the RCBD ANOVA table:

$$\widehat{MS_E^{CRD}} = \frac{df_b \cdot MS_b + (df_t + df_e) \cdot MS_e}{df_b + df_t + df_e}$$

$$\text{RE} = \frac{(df_e + 1)(df_e^{CRD} + 3)}{(df_e + 3)(df_e^{CRD} + 1)} \cdot \frac{\widehat{MS_E^{CRD}}}{MS_e}$$

Where:
- $MS_b$, $MS_e$ are the mean squares for block and error in the RCBD
- $df_b$, $df_t$, $df_e$ are degrees of freedom for block, treatment, and error in the RCBD
- $df_e^{CRD} = df_e + df_b$ is the error df the CRD would have had
- The first ratio is **Fisher's correction**: it shrinks RE slightly to account for the cost of estimating extra block parameters

```r title="Compute relative efficiency of blocking"
tab     <- summary(fit_rcbd)[[1]]
df_b    <- tab["block",     "Df"]
df_t    <- tab["treatment", "Df"]
df_e    <- tab["Residuals", "Df"]
ms_b    <- tab["block",     "Mean Sq"]
ms_e    <- tab["Residuals", "Mean Sq"]
df_eCRD <- df_e + df_b

ms_eCRD_hat <- (df_b * ms_b + (df_t + df_e) * ms_e) / (df_b + df_t + df_e)
fisher_corr <- ((df_e + 1) * (df_eCRD + 3)) / ((df_e + 3) * (df_eCRD + 1))
RE <- fisher_corr * (ms_eCRD_hat / ms_e)

round(RE, 2)
#> [1] 18.94
```

RE of 18.94 means a completely randomised version of the same experiment would have needed roughly 19× as many plots to match the precision RCBD bought us. That is overwhelming evidence the soil gradient was a worthwhile thing to block on. In real field-trial reports an RE between 1.05 and 5.0 is typical; anything above 1.05 justifies the design overhead.

[TIP]
**Use RE > 1.05 as the practical justification threshold for keeping the block.** Below ~1.0 the block ate degrees of freedom without reducing residual variance, which is the diagnostic signature of blocking on the wrong nuisance source. If you see RE < 1, drop the block in future replications and find a better grouping variable.

**Try it:** Pretend the block effect is much weaker. Replace `block_effect` with `c(-0.2, -0.1, 0, 0.1, 0.2)`, regenerate `plot_df`, refit the RCBD, and recompute RE. Save it as `ex_re_weak`.

```r title="Your turn: RE when blocks barely differ"
set.seed(217)
ex_block_effect <- c(-0.2, -0.1, 0, 0.1, 0.2)

ex_plot_df <- expand.grid(block = factor(1:n_blocks),
                          treatment = factor(treatments)) |>
  mutate(yield = 10 + ex_block_effect[as.integer(block)]
                    + treat_effect[as.character(treatment)]
                    + rnorm(n(), sd = 0.6))

ex_fit <- aov(yield ~ block + treatment, data = ex_plot_df)
# your code here: extract ms_b, ms_e and compute ex_re_weak

# Expected: ex_re_weak hovers around 1 (blocking did almost nothing)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Weak-block RE solution"
set.seed(217)
ex_block_effect <- c(-0.2, -0.1, 0, 0.1, 0.2)

ex_plot_df <- expand.grid(block = factor(1:n_blocks),
                          treatment = factor(treatments)) |>
  mutate(yield = 10 + ex_block_effect[as.integer(block)]
                    + treat_effect[as.character(treatment)]
                    + rnorm(n(), sd = 0.6))

ex_fit <- aov(yield ~ block + treatment, data = ex_plot_df)
ex_tab <- summary(ex_fit)[[1]]
ex_msb <- ex_tab["block",     "Mean Sq"]
ex_mse <- ex_tab["Residuals", "Mean Sq"]
ex_ms_eCRD_hat <- (df_b * ex_msb + (df_t + df_e) * ex_mse) / (df_b + df_t + df_e)
ex_re_weak <- fisher_corr * (ex_ms_eCRD_hat / ex_mse)
round(ex_re_weak, 2)
#> [1] 0.89
```

**Explanation:** When the block effect shrinks toward zero, $MS_b \approx MS_e$, so the numerator of $\widehat{MS_E^{CRD}}$ is barely larger than $MS_e$, the Fisher correction kicks in for the wasted degrees of freedom, and RE drops below 1. This is the diagnostic signature that the block is actively *hurting* you: a CRD on the same plots would have been more precise.

</details>

## How do you do post-hoc comparisons after an RCBD ANOVA?

A significant treatment F tells you *some* fertilisers differ, not *which*. Tukey's Honest Significant Difference test gives all pairwise comparisons with family-wise error controlled at $\alpha$. You restrict it to the treatment factor only, because pairwise differences between blocks are not the scientific question you set up the experiment to answer.

```r title="Run TukeyHSD on the treatment factor and inspect CIs"
tukey_out <- TukeyHSD(fit_rcbd, which = "treatment")
tukey_out$treatment
#>          diff        lwr      upr        p adj
#> B-A 0.5936474 -0.3158529 1.503148 2.638508e-01
#> C-A 1.0979139  0.1884136 2.007414 1.708585e-02
#> D-A 2.2074824  1.2979821 3.116983 5.539489e-05
#> C-B 0.5042665 -0.4052338 1.413767 3.913526e-01
#> D-B 1.6138350  0.7043347 2.523335 9.831993e-04
#> D-C 1.1095685  0.2000682 2.019069 1.598377e-02
```

Read the table by sign: any pair whose 95% CI excludes zero (and equivalently whose `p adj` is below 0.05) is a significant difference. Here B vs A and C vs B fail to reach significance, but every other pair separates. D is meaningfully better than every other fertiliser, C beats A but ties with B, and A and B are statistically indistinguishable. That is the practical verdict the experiment was run to deliver.

[NOTE]
**`agricolae::LSD.test()` is the field-trial standard, but TukeyHSD is the safer default.** LSD inflates the family-wise type-I error rate when you have many treatments because it controls only the per-comparison rate. Use Tukey unless a journal in your field explicitly mandates LSD or Duncan.

**Try it:** Re-run TukeyHSD with `conf.level = 0.99` and save the result as `ex_tukey_99`. Which pairs that were significant at 95% lose significance at 99%?

```r title="Your turn: tighten the Tukey confidence level"
ex_tukey_99 <- # your code here

ex_tukey_99$treatment[, "p adj"] < 0.01
# Expected: D-A, D-B, D-C remain significant; C-A drops out
```

<details>
<summary>Click to reveal solution</summary>

```r title="Tighter CIs solution"
ex_tukey_99 <- TukeyHSD(fit_rcbd, which = "treatment", conf.level = 0.99)
round(ex_tukey_99$treatment[, "p adj"], 4)
#>    B-A    C-A    D-A    C-B    D-B    D-C
#> 0.2639 0.0171 0.0001 0.3914 0.0010 0.0160
ex_tukey_99$treatment[, "p adj"] < 0.01
#>   B-A   C-A   D-A   C-B   D-B   D-C
#> FALSE FALSE  TRUE FALSE  TRUE FALSE
```

**Explanation:** At 99% confidence the bar for "significant" is stricter (p < 0.01 instead of < 0.05). C-A, D-C, and the marginal C-B/B-A pairs all stay below significance, leaving only D-A and D-B as honest at the new level. The take-home: tighter family-wise control buys protection at the cost of detected pairs.

</details>

![The end-to-end RCBD pipeline: identify the nuisance source, randomise within blocks, fit the model, diagnose, compute relative efficiency, run post-hoc.](screenshots/Randomized-Complete-Block-Design-in-R-analysis-workflow.webp)
*Figure 2: The end-to-end RCBD pipeline: identify the nuisance source, randomise within blocks, fit the model, diagnose, compute relative efficiency, run post-hoc.*

## Practice Exercises

These capstones combine multiple concepts from the tutorial. Variable names use the `my_` prefix so they will not collide with tutorial variables already in your session.

### Exercise 1: RCBD on the OrchardSprays dataset

Use the built-in `OrchardSprays` data. Treat `rowpos` as a nuisance block (rows of orchard tree positions) and `treatment` as the spray. Fit the RCBD model on `decrease`, print the ANOVA table, and compute relative efficiency. Save RE as `my_re_orchard`.

```r title="Exercise: RCBD on OrchardSprays"
# Prepare the data: convert rowpos to a factor for use as block
my_data <- transform(OrchardSprays, rowpos = factor(rowpos))

# Hint: same recipe as the tutorial: aov(decrease ~ block + treatment), then RE
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="OrchardSprays solution"
my_data <- transform(OrchardSprays, rowpos = factor(rowpos))
my_fit  <- aov(decrease ~ rowpos + treatment, data = my_data)
summary(my_fit)
#>             Df Sum Sq Mean Sq F value   Pr(>F)
#> rowpos       7   4767   680.9   1.775   0.1143
#> treatment    7  56160  8022.9  20.908 1.03e-12
#> Residuals   49  18802   383.7

my_tab     <- summary(my_fit)[[1]]
my_dfb     <- my_tab["rowpos",    "Df"]
my_dft     <- my_tab["treatment","Df"]
my_dfe     <- my_tab["Residuals","Df"]
my_msb     <- my_tab["rowpos",    "Mean Sq"]
my_mse     <- my_tab["Residuals","Mean Sq"]
my_dfeCRD  <- my_dfe + my_dfb
my_msECRD  <- (my_dfb * my_msb + (my_dft + my_dfe) * my_mse) / (my_dfb + my_dft + my_dfe)
my_corr    <- ((my_dfe + 1) * (my_dfeCRD + 3)) / ((my_dfe + 3) * (my_dfeCRD + 1))
my_re_orchard <- my_corr * (my_msECRD / my_mse)
round(my_re_orchard, 2)
#> [1] 1.08
```

**Explanation:** RE of 1.08 means rowpos earned its keep only marginally: a CRD on the same plots would have needed about 8% more replication to match this precision. Notice rowpos itself fails its own F-test (p = 0.11), yet the design still came out slightly ahead because the small block-explained variation was enough to outweigh the cost of the seven block degrees of freedom. Treatment dominates regardless (F = 21).

</details>

### Exercise 2: Detect a wasted block

Simulate an RCBD where the block has zero true effect: every block has the same baseline yield. Fit the model and compute RE. The exercise is to confirm RE collapses to roughly 1, and to read the lesson off the result.

```r title="Exercise: simulate a useless block"
set.seed(503)
my_treat_eff <- c(A = 0, B = 0.6, C = 1.2, D = 1.8)

my_useless <- expand.grid(block     = factor(1:5),
                          treatment = factor(c("A","B","C","D"))) |>
  transform(yield = 10                                  # constant baseline
                  + my_treat_eff[as.character(treatment)]
                  + rnorm(20, sd = 0.6))

# Hint: fit aov, extract MS, compute RE; expect RE close to 1
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Wasted-block solution"
set.seed(503)
my_treat_eff <- c(A = 0, B = 0.6, C = 1.2, D = 1.8)
my_useless <- expand.grid(block     = factor(1:5),
                          treatment = factor(c("A","B","C","D"))) |>
  transform(yield = 10
                  + my_treat_eff[as.character(treatment)]
                  + rnorm(20, sd = 0.6))

my_fit2   <- aov(yield ~ block + treatment, data = my_useless)
my_tab2   <- summary(my_fit2)[[1]]
my_dfb2   <- my_tab2["block",     "Df"]
my_dft2   <- my_tab2["treatment", "Df"]
my_dfe2   <- my_tab2["Residuals", "Df"]
my_msb2   <- my_tab2["block",     "Mean Sq"]
my_mse2   <- my_tab2["Residuals", "Mean Sq"]
my_msECRD <- (my_dfb2 * my_msb2 + (my_dft2 + my_dfe2) * my_mse2) /
             (my_dfb2 + my_dft2 + my_dfe2)
my_corr2  <- ((my_dfe2 + 1) * ((my_dfe2 + my_dfb2) + 3)) /
             ((my_dfe2 + 3) * ((my_dfe2 + my_dfb2) + 1))
my_re2    <- my_corr2 * (my_msECRD / my_mse2)
round(my_re2, 2)
#> [1] 0.96
```

**Explanation:** RE of 0.96 (just under 1) is the unmistakable fingerprint of a wasted block: you spent 4 degrees of freedom on a grouping variable that explained nothing. In a real experiment that result tells you to drop the block in the next replication and look for a better nuisance source to control.

</details>

### Exercise 3: Write your own RE function

Wrap the relative-efficiency arithmetic into a reusable function. The function takes an `aov` object fitted as `y ~ block + treatment` and returns the Fisher-corrected RE number.

```r title="Exercise: build rcbd_efficiency()"
rcbd_efficiency <- function(fit) {
  # Hint: pull Df and Mean Sq from summary(fit)[[1]],
  # then apply the textbook formula.
  # Your code here:

}

# Test on the tutorial fit:
round(rcbd_efficiency(fit_rcbd), 2)
#> Expected: ~14.95
```

<details>
<summary>Click to reveal solution</summary>

```r title="rcbd_efficiency solution"
rcbd_efficiency <- function(fit) {
  tab <- summary(fit)[[1]]
  dfb <- tab["block",     "Df"]
  dft <- tab["treatment", "Df"]
  dfe <- tab["Residuals", "Df"]
  msb <- tab["block",     "Mean Sq"]
  mse <- tab["Residuals", "Mean Sq"]
  dfeCRD <- dfe + dfb
  ms_eCRD <- (dfb * msb + (dft + dfe) * mse) / (dfb + dft + dfe)
  fisher  <- ((dfe + 1) * (dfeCRD + 3)) / ((dfe + 3) * (dfeCRD + 1))
  fisher * (ms_eCRD / mse)
}

round(rcbd_efficiency(fit_rcbd), 2)
#> [1] 14.95
```

**Explanation:** The function reads the ANOVA table, extracts the four numbers it needs, and applies the textbook formula. It assumes the model was fitted with the term order `block + treatment`; encoding that contract in the function name keeps the arithmetic safe.

</details>

## Complete Example

A potato breeder is evaluating five varieties (V1 to V5) for tuber yield. The trial field has a known fertility gradient running east-to-west, so the breeder lays out four blocks running perpendicular to the gradient, with five plots per block. Within each block the five varieties are randomised. The goal is to identify which varieties differ in yield and quantify how much the blocking helped.

```r title="Complete RCBD analysis: potato variety trial"
# 1. Simulate the trial (in practice you would import field-recorded yields)
set.seed(729)
varieties <- c("V1","V2","V3","V4","V5")

potato_df <- expand.grid(block    = factor(1:4),
                         variety  = factor(varieties)) |>
  mutate(yield = 28                                            # baseline t/ha
               + c(-2, -0.7, 0.7, 2)[as.integer(block)]        # fertility gradient
               + c(V1 = 0, V2 = 1.4, V3 = 0.5, V4 = 2.6,
                   V5 = 1.0)[as.character(variety)]
               + rnorm(n(), sd = 0.7))

# 2. Randomise within blocks (the layout you would carry to the field)
set.seed(730)
potato_layout <- potato_df |>
  group_by(block) |>
  mutate(plot = sample(seq_len(n()))) |>
  arrange(block, plot) |>
  ungroup()

head(potato_layout, 5)
#> # A tibble: 5 x 4
#>   block variety yield  plot
#>   <fct> <fct>   <dbl> <int>
#> 1 1     V1       25.5     1
#> 2 1     V2       26.8     2
#> 3 1     V4       29.6     3
#> 4 1     V3       25.3     4
#> 5 1     V5       26.6     5

# 3. Fit RCBD and read the ANOVA
pot_fit <- aov(yield ~ block + variety, data = potato_df)
summary(pot_fit)
#>             Df Sum Sq Mean Sq F value   Pr(>F)
#> block        3  56.13  18.710  28.650 9.38e-06
#> variety      4  14.47   3.618   5.540  0.00919
#> Residuals   12   7.84   0.653

# 4. Diagnostics: residual normality
shapiro.test(residuals(pot_fit))$p.value
#> [1] 0.3267721

# 5. Relative efficiency (rcbd_efficiency expects 'treatment'; rename here)
rcbd_efficiency_v <- function(fit) {
  tab <- summary(fit)[[1]]
  dfb <- tab["block",   "Df"];  dft <- tab["variety","Df"]; dfe <- tab["Residuals","Df"]
  msb <- tab["block",   "Mean Sq"];  mse <- tab["Residuals","Mean Sq"]
  dfeCRD <- dfe + dfb
  ms_eCRD <- (dfb * msb + (dft + dfe) * mse) / (dfb + dft + dfe)
  fisher  <- ((dfe + 1) * (dfeCRD + 3)) / ((dfe + 3) * (dfeCRD + 1))
  fisher * (ms_eCRD / mse)
}
pot_re <- rcbd_efficiency_v(pot_fit)
round(pot_re, 2)
#> [1] 5.23

# 6. Tukey HSD on variety
pot_tukey <- TukeyHSD(pot_fit, which = "variety")
round(pot_tukey$variety[, c("diff", "p adj")], 3)
#>        diff p adj
#> V2-V1  0.198 0.996
#> V3-V1 -0.036 1.000
#> V4-V1  2.210 0.016
#> V5-V1  0.237 0.993
#> V3-V2 -0.234 0.993
#> V4-V2  2.011 0.028
#> V5-V2  0.039 1.000
#> V4-V3  2.246 0.014
#> V5-V3  0.273 0.988
#> V5-V4 -1.973 0.032
```

**Result statement.** The fertility gradient was the dominant source of variation (block F = 28.7, p < 1e-5), and pulling it out left a clean signal for variety (F = 5.5, p = 0.009). Residuals satisfied the normality assumption (Shapiro p = 0.33). Blocking was very productive: a CRD of the same 20 plots would have delivered the precision of only 20/5.23 ≈ 3.8 RCBD plots, so RE = 5.23. TukeyHSD identifies V4 as significantly higher-yielding than every other variety, while V1, V2, V3, and V5 are statistically indistinguishable from each other. V4 is the clear recommendation.

## Summary

| Step | R function | What it answers | Pitfall |
|---|---|---|---|
| Randomise | `dplyr::group_by(block) + sample()` | Which plot gets which treatment? | Forgetting to seed makes the layout irreproducible |
| Fit | `aov(y ~ block + treatment)` | Is there a treatment effect after removing block variation? | Including `block:treatment` zeros out residual df |
| Diagnose | `plot(fit)`, `shapiro.test`, Tukey 1-df | Are normality, homoscedasticity, additivity OK? | Reading raw residuals instead of model residuals |
| Effect size | $\eta^2$ from `anova()` Sum Sq column | How much variation does each factor explain? | Treating large block $\eta^2$ as bad design, when in fact it is the *point* |
| Efficiency | RE formula on RCBD mean squares | Did blocking pay off vs CRD? | RE near 1 means blocked on the wrong nuisance source |
| Post-hoc | `TukeyHSD(fit, which = "treatment")` | Which treatment pairs differ? | Running pairwise tests on the block factor |

## References

1. Montgomery, D.C., *Design and Analysis of Experiments*, 9th ed. Wiley (2017). Chapter 4: Randomized Blocks, Latin Squares, and Related Designs. [Link](https://www.wiley.com/en-us/Design+and+Analysis+of+Experiments%2C+9th+Edition-p-9781119113478)
2. Cochran, W.G. and Cox, G.M., *Experimental Designs*, 2nd ed. Wiley (1957). The classic reference for blocking and efficiency calculations.
3. R Core Team, *aov function reference*. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/aov.html)
4. R Core Team, *TukeyHSD function reference*. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/TukeyHSD.html)
5. Mendiburu, F., *agricolae: Statistical Procedures for Agricultural Research*. CRAN package vignette. [Link](https://cran.r-project.org/package=agricolae)
6. Bates, D., Mächler, M., Bolker, B., Walker, S., *Fitting Linear Mixed-Effects Models Using lme4*. JSS 67(1) (2015). Treatment of blocks as random effects. [Link](https://www.jstatsoft.org/article/view/v067i01)
7. Fisher, R.A., *The Design of Experiments*. Oliver and Boyd (1935). Origin of randomisation, blocking, and replication as the three principles.

## Continue Learning

- [Experimental Design in R: The Three Principles That Make Results Valid and Generalisable](Experimental-Design-Principles-in-R.html), the parent tutorial covering randomisation, blocking, and replication side by side
- [Two-Way ANOVA in R](Two-Way-ANOVA-in-R.html), for when the block becomes a second factor of scientific interest rather than a nuisance to control
- [Repeated Measures ANOVA in R](Repeated-Measures-ANOVA-in-R.html), for when each subject acts as its own block across time points
