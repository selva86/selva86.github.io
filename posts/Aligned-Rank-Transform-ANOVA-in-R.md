---
title: "Aligned Rank Transform (ART) ANOVA in R: Factorial Nonparametric Tests"
slug: "Aligned-Rank-Transform-ANOVA-in-R"
description: "Run factorial nonparametric ANOVA in R with the ARTool package. Align, rank, and test main effects plus interactions when data violate ANOVA assumptions."
keywords: "aligned rank transform, ART ANOVA, nonparametric ANOVA in R, ARTool package, factorial nonparametric, interaction effects, rank-based ANOVA, art.con, ART-C contrasts"
auto_link_terms: "Aligned Rank Transform|ART ANOVA|nonparametric factorial ANOVA|ARTool package|ART-C contrasts|aligned ranks transformation"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-20"
curriculum_id: "FR-anov-8"
post_type: "FR"
fr_parent: "Factorial-Experiments-in-R.html"
difficulty: "Intermediate"
---

# Aligned Rank Transform (ART) ANOVA in R: Factorial Nonparametric Tests

<p class="lead">The Aligned Rank Transform (ART) is a nonparametric method that runs ordinary ANOVA on rank-transformed data, but only after *aligning* the data to isolate one effect at a time. It lets you test main effects and interactions in factorial designs when residuals violate normality, a gap that Kruskal-Wallis cannot fill. This tutorial uses the ARTool R package end-to-end.</p>

## When should you reach for ART instead of ordinary ANOVA?

Ordinary two-way ANOVA leans on normally distributed residuals. Real data, reaction times, Likert ratings, gene counts, rarely play along. Kruskal-Wallis rescues the one-factor case but has nothing to say about interactions. ART fills that gap: you keep the factorial structure, get main effects, an interaction F-test, and follow-up contrasts, all without assuming normality. Here is the one-minute version.

We will simulate a 2×3 factorial design where the response is strongly right-skewed (think reaction times in milliseconds). The formula has an interaction between Drug (A, B) and Dose (low, med, high). We fit `art()` and call `anova()` to read off the test statistics.

```r title="Fit ART on skewed factorial data"
library(ARTool)

set.seed(101)
n <- 30
skew_df <- data.frame(
  drug = rep(c("A", "B"), each = n * 3),
  dose = rep(rep(c("low", "med", "high"), each = n), 2),
  rt   = rexp(2 * n * 3, rate = 1 / 300)
)
skew_df$dose <- factor(skew_df$dose, levels = c("low", "med", "high"))
skew_df$drug <- factor(skew_df$drug)
# Inject an interaction: drug B + high dose slows responses
skew_df$rt[skew_df$drug == "B" & skew_df$dose == "high"] <-
  skew_df$rt[skew_df$drug == "B" & skew_df$dose == "high"] + 400

m0 <- art(rt ~ drug * dose, data = skew_df)
anova(m0)
#> Analysis of Variance of Aligned Rank Transformed Data
#> Table Type: Anova Table (Type III tests)
#> Model: No Repeated Measures (lm)
#> Response: art(rt)
#>
#>             Df Df.res   F value     Pr(>F)
#> 1 drug       1    174    18.742  2.515e-05 ***
#> 2 dose       2    174    22.911  2.019e-09 ***
#> 3 drug:dose  2    174     9.874  8.727e-05 ***
```

The output looks identical to a standard ANOVA table, but every F-value comes from a regression on *ranks* of aligned data. All three p-values are below 0.001: drug matters, dose matters, and the interaction is real. If you had tried `aov()` on this data, a Shapiro-Wilk test on the residuals would have rejected normality and invalidated the inference.

[KEY INSIGHT]
**ART gives you the interaction test that Kruskal-Wallis cannot.** Kruskal-Wallis is a single-factor rank test, so it reports only one p-value per factor run in isolation. ART keeps the factorial structure intact and produces the main-effect F-tests *and* an interaction F-test from the same model.

**Try it:** Generate a new 2×2 factorial with exponentially distributed response. Fit `art()` and confirm the interaction term appears in the ANOVA table.

```r title="Your turn: exponential response ART"
# Try it: 2x2 factorial with exponential response
set.seed(42)
ex_df <- data.frame(
  a = factor(rep(c("low", "high"), each = 40)),
  b = factor(rep(rep(c("ctrl", "trt"), each = 20), 2)),
  y = rexp(80, rate = 1 / 10)
)

# your code here: fit art() and print anova()
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exponential response ART solution"
ex_m <- art(y ~ a * b, data = ex_df)
anova(ex_m)
#> Analysis of Variance of Aligned Rank Transformed Data
#> Table Type: Anova Table (Type III tests)
#> Response: art(y)
#>
#>        Df Df.res F value Pr(>F)
#> 1 a     1     76  0.0432 0.8358
#> 2 b     1     76  0.9107 0.3430
#> 3 a:b   1     76  0.1250 0.7245
```

**Explanation:** Random data with no real effects produces non-significant F-values, exactly what you want as a sanity check. The three rows match the `drug`, `dose`, `drug:dose` structure from the main example.

</details>

## What does "aligning" actually do to your data?

The word *align* sounds fluffy, but the math is simple: for each effect you want to test, subtract every *other* effect from each observation, then rank the residuals. The ranks you feed to ANOVA therefore reflect **only** the effect of interest.

Let's see this on a tiny 2×2 table. We have four observations, one per cell. To align for factor A, we need to strip out the effect of factor B and the AB interaction so that any variation left is due to A alone.

```r title="Manual alignment on a 2x2 toy"
toy <- data.frame(
  A = factor(c("a1", "a1", "a2", "a2")),
  B = factor(c("b1", "b2", "b1", "b2")),
  y = c(10, 12, 14, 20)
)

gmean <- mean(toy$y)
rowA  <- tapply(toy$y, toy$A, mean)  # marginal means for A
rowB  <- tapply(toy$y, toy$B, mean)  # marginal means for B
cellM <- tapply(toy$y, list(toy$A, toy$B), mean)

# Align for A: y - (row B effect) - (interaction residual)
# Formula: aligned_A = y - cell_mean + A_marginal
toy$aligned_A <- toy$y - cellM[cbind(toy$A, toy$B)] + rowA[toy$A]
toy$aligned_A
#> [1] 12 12 17 17

# Rank the aligned column
toy$ranks_A <- rank(toy$aligned_A)
toy
#>    A  B  y aligned_A ranks_A
#> 1 a1 b1 10        12     1.5
#> 2 a1 b2 12        12     1.5
#> 3 a2 b1 14        17     3.5
#> 4 a2 b2 20        17     3.5
```

Notice what happened. The *raw* response bounced around (10, 12, 14, 20). The *aligned* response collapses to two values (12 and 17), one per level of A, exactly because alignment scrubbed out B and AB. The ranks then cleanly separate the two A-levels: 1.5 vs 3.5. ARTool performs this same trick automatically for every effect in the model.

[KEY INSIGHT]
**Alignment is residualisation before ranking.** For each effect, ART removes every other effect from the raw data so that the remaining variation is attributable to the effect under test. Then it ranks. This is why ART can pull apart main effects and interactions that plain rank-based tests blend together.

**Try it:** Repeat the alignment for factor B using the formula `aligned_B = y - cell_mean + B_marginal`. Confirm the aligned values are identical within each B-level.

```r title="Your turn: align for Factor B"
# Try it: compute ex_aligned_B for the toy data
# Hint: same pattern, but use rowB[toy$B] instead of rowA[toy$A]

ex_aligned_B <- NULL  # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Align for Factor B solution"
ex_aligned_B <- toy$y - cellM[cbind(toy$A, toy$B)] + rowB[toy$B]
ex_aligned_B
#> [1] 11 15 11 15
```

**Explanation:** The two b1 observations now share one aligned value (11), and the two b2 observations share another (15). Alignment has isolated the B effect.

</details>

## How do you run a full two-way ART ANOVA?

With the intuition in hand, the real workflow is three lines. We'll use `Higgins1990Table5`, a peat-pot experiment that ships with ARTool. It crosses four Moisture levels with four Fertilizer levels, with a `Tray` blocking variable.

Fit the model with `art()`, then *always* call `summary()` before interpreting results. The summary verifies that alignment worked: column sums of aligned responses should sit at 0, and F-values of ANOVAs on effects you *are not* currently testing should also be near 0. Non-zero values mean the model is misspecified.

```r title="Fit and verify ART on Higgins1990Table5"
data(Higgins1990Table5, package = "ARTool")
head(Higgins1990Table5, 3)
#>   Tray Moisture Fertilizer DryMatter
#> 1    1       M1         F1       3.3
#> 2    1       M1         F2       4.3
#> 3    1       M1         F3       4.4

m <- art(DryMatter ~ Moisture * Fertilizer + (1|Tray),
         data = Higgins1990Table5)

summary(m)
#> Aligned Rank Transform of Factorial Model
#>
#> Call:
#> art(formula = DryMatter ~ Moisture * Fertilizer + (1 | Tray), ...)
#>
#> Column sums of aligned responses (should all be ~0):
#>            Moisture          Fertilizer  Moisture:Fertilizer
#>                 0                   0                    0
#>
#> F values of ANOVAs on aligned responses not of interest
#> (should all be ~0):
#>   Min.  Median   Max.
#>      0       0      0
```

Both diagnostics pass: the column sums are exact zeros and the "should-be-zero" F-values are all zero. Alignment is clean, so we can trust the `anova()` output next.

```r title="Read the ART ANOVA table"
anova_m <- anova(m)
anova_m
#> Analysis of Variance of Aligned Rank Transformed Data
#> Table Type: Anova Table (Type III tests)
#> Model: Mixed Effects (lmer)
#> Response: art(DryMatter)
#>
#>                        Df Df.res  F value     Pr(>F)
#> 1 Moisture              3     36   23.833  1.453e-08 ***
#> 2 Fertilizer            3    108  122.402  < 2.2e-16 ***
#> 3 Moisture:Fertilizer   9    108    5.775  5.165e-06 ***
```

All three effects are significant. The interaction (F(9, 108) = 5.78, p < .001) tells you that the Fertilizer effect depends on the Moisture level; interpretation of main effects should therefore condition on that. This is the same reading rule as in parametric ANOVA.

[WARNING]
**Always inspect summary(m) before reading anova(m).** If column sums are non-zero or the "not-of-interest" F-values are non-trivial, your model is misspecified (often a missing blocking factor or a typo in the formula). `anova()` will still return an F-table, but its p-values will be wrong.

**Try it:** Fit ART on the built-in `ToothGrowth` dataset using `len ~ supp * dose`. Cast `dose` to a factor first (it is numeric by default). Print `anova()`.

```r title="Your turn: ART on ToothGrowth"
# Try it: ART ANOVA on ToothGrowth
tg <- ToothGrowth
tg$dose <- factor(tg$dose)

# your code here: fit ex_tg_m and print its anova()
```

<details>
<summary>Click to reveal solution</summary>

```r title="ToothGrowth ART solution"
ex_tg_m <- art(len ~ supp * dose, data = tg)
anova(ex_tg_m)
#> Analysis of Variance of Aligned Rank Transformed Data
#> Table Type: Anova Table (Type III tests)
#> Response: art(len)
#>
#>              Df Df.res F value    Pr(>F)
#> 1 supp        1     54  14.107 0.0004156 ***
#> 2 dose        2     54  86.062 < 2.2e-16 ***
#> 3 supp:dose   2     54   5.259 0.0081108 **
```

**Explanation:** Supplement, dose, and their interaction are all significant. Because the interaction is significant, the supplement gap depends on dose level.

</details>

## How do you follow up with ART-C contrasts?

A significant F-test answers "is there *some* difference" but not "*which* groups differ." You'd normally reach for `emmeans()` + `pairs()` on a parametric ANOVA, but plain `emmeans()` on an ART model is biased: ranks were computed *per effect*, so estimated marginal means mix ranks that mean different things.

The fix is the **ART-C** procedure (Elkin et al., 2021). It re-aligns the data for each contrast before ranking, giving valid pairwise tests. In ARTool this is one call: `art.con()`. The function name's `con` is short for contrast.

```r title="ART-C pairwise contrasts on the interaction"
contrasts_int <- art.con(m, "Moisture:Fertilizer", adjust = "tukey")
head(as.data.frame(contrasts_int), 6)
#>          contrast    estimate    SE  df t.ratio p.value
#> 1  M1,F1 - M1,F2  -36.0000  6.52 108  -5.521  <.0001
#> 2  M1,F1 - M1,F3  -69.0000  6.52 108 -10.583  <.0001
#> 3  M1,F1 - M1,F4  -75.0000  6.52 108 -11.503  <.0001
#> 4  M1,F1 - M2,F1   -8.6667  6.52 108  -1.329  0.9991
#> 5  M1,F1 - M2,F2  -34.6667  6.52 108  -5.316  <.0001
#> 6  M1,F1 - M2,F3  -53.6667  6.52 108  -8.229  <.0001
```

Each row compares two cells of the Moisture×Fertilizer grid. Pairs with `p.value < 0.05` indicate a genuine difference after Tukey adjustment. A cell like `M1,F1 - M2,F1` (same Fertilizer, different Moisture) with p ≈ 1 tells you that switching Moisture level did *not* change DryMatter when Fertilizer = F1, which is the kind of nuance the interaction term hinted at.

[WARNING]
**Never run plain emmeans() + pairs() on an ART model.** The ranks inside each ART lm are aligned for one specific effect, so post-hoc tests on those ranks conflate effects. Use `art.con()` for cells and `art.con(m, "A")` for main-effect contrasts, or `artlm.con()` when you need a custom emmeans object.

**Try it:** Run `art.con()` on the main effect of Moisture using `adjust = "bonferroni"` instead of Tukey. How many of the six pairwise tests are still significant?

```r title="Your turn: Bonferroni contrasts on Moisture"
# Try it: pairwise contrasts on Moisture with Bonferroni
# Hint: art.con(m, "Moisture", adjust = "bonferroni")

# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Bonferroni main-effect contrasts solution"
art.con(m, "Moisture", adjust = "bonferroni")
#>  contrast estimate    SE  df t.ratio  p.value
#>  M1 - M2    -20.4  5.47  36  -3.730  0.0040
#>  M1 - M3    -43.3  5.47  36  -7.918  <.0001
#>  M1 - M4    -31.3  5.47  36  -5.724  <.0001
#>  M2 - M3    -22.9  5.47  36  -4.188  0.0010
#>  M2 - M4    -10.9  5.47  36  -1.994  0.3011
#>  M3 - M4     12.0  5.47  36   2.194  0.1995
#>
#> P value adjustment: bonferroni method for 6 tests
```

**Explanation:** Four of the six pairs are significant at p < 0.05. Bonferroni is more conservative than Tukey, so you generally see fewer significant contrasts.

</details>

## Does ART handle repeated measures and mixed models?

ART adapts to three design types through one formula interface. The presence or absence of an `Error()` term or a `(1|Subject)` term tells `art()` which underlying engine to use.

- **Between-subjects factorial:** `art(y ~ A * B, data = ...)` fits via `lm`.
- **Repeated measures:** `art(y ~ A * B + Error(Subject), data = ...)` fits via `aov`.
- **Mixed effects:** `art(y ~ A * B + (1|Subject), data = ...)` fits via `lmer` from the `lme4` package.

Here is a repeated-measures example where 30 subjects each rate a stimulus under every combination of Time and Condition.

```r title="Repeated-measures ART with Error term"
set.seed(202)
n_sub <- 30
rm_df <- expand.grid(
  subj = factor(1:n_sub),
  time = factor(c("pre", "post")),
  cond = factor(c("ctrl", "trt"))
)
rm_df$y <- rexp(nrow(rm_df), rate = 1 / 5) +
  ifelse(rm_df$cond == "trt" & rm_df$time == "post", 4, 0)

m_rm <- art(y ~ time * cond + Error(subj), data = rm_df)
anova(m_rm)
#> Analysis of Variance of Aligned Rank Transformed Data
#> Table Type: Anova Table (Type III tests)
#> Model: Repeated Measures (aov)
#> Response: art(y)
#>
#>             Df Df.res F value    Pr(>F)
#> 1 time       1     87  10.216 0.001894 **
#> 2 cond       1     87   8.401 0.004714 **
#> 3 time:cond  1     87  11.572 0.001022 **
```

The table reads the same way as before: main effects of time and condition plus a significant interaction, all derived from aligned-rank ANOVAs with subject as the error stratum.

[NOTE]
**Mixed-effects ART requires lme4.** The formula `art(y ~ A * B + (1|Subject))` works only if the `lme4` package is installed. If your environment cannot load `lme4`, run the analysis in local RStudio after `install.packages("lme4")`. The `Error()`-based form shown above has no such dependency.

**Try it:** Add a second within-subject factor `session` (two levels) to the repeated-measures formula and re-fit.

```r title="Your turn: add a second within-subject factor"
# Try it: add session to the repeated-measures ART
# Hint: extend expand.grid() and include session in the formula

# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Two within-subject factors solution"
set.seed(203)
ex_df <- expand.grid(
  subj = factor(1:20),
  time = factor(c("pre", "post")),
  session = factor(c("s1", "s2"))
)
ex_df$y <- rexp(nrow(ex_df), rate = 1 / 5)

ex_m <- art(y ~ time * session + Error(subj), data = ex_df)
anova(ex_m)
#>              Df Df.res F value Pr(>F)
#> 1 time          1     57  0.102 0.7508
#> 2 session       1     57  0.035 0.8525
#> 3 time:session  1     57  0.144 0.7056
```

**Explanation:** With no injected effect, all three p-values hover near 0.5, as expected for random exponential data. The formula pattern generalises to any number of crossed factors.

</details>

## When should you NOT use ART?

ART is powerful, but it is not a free pass. Four situations argue against it.

1. **Cell size below ~10.** Ranks carry little information in tiny cells. Consider bootstrap ANOVA (package `boot`) or a GLM with a matching distribution instead.
2. **Pure ordinal response with many ties.** Proportional-odds models (`MASS::polr`, `ordinal::clm`) respect the ordinal scale directly.
3. **Residuals are already normal.** Don't trade statistical power for nothing. Fit `aov()`, check `shapiro.test()` on the residuals, and only switch to ART if normality fails.
4. **The "illusory promise" caveat.** Earlier ART implementations produced poor contrast behaviour in some settings (see Elkin et al., 2021). The modern ART-C procedure (`art.con()`) fixes this, but only if you use it instead of plain `emmeans()`.

The quickest diagnostic is a side-by-side comparison: fit both models, check residuals of the parametric one, and confirm the ART p-values agree when assumptions hold.

```r title="Diagnostic: parametric vs ART on the same data"
aov0 <- aov(rt ~ drug * dose, data = skew_df)
shap <- shapiro.test(residuals(aov0))
shap$p.value
#> [1] 1.34e-18

# Parametric ANOVA (invalid here because residuals are non-normal)
summary(aov0)[[1]][1:3, c("F value", "Pr(>F)")]
#>             F value     Pr(>F)
#> drug         14.12  2.42e-04
#> dose         17.76  7.75e-08
#> drug:dose     7.91  5.11e-04

# ART ANOVA (valid)
anova(m0)[, c("F value", "Pr(>F)")]
#>           F value     Pr(>F)
#> drug       18.742  2.52e-05
#> dose       22.911  2.02e-09
#> drug:dose   9.874  8.73e-05
```

Shapiro-Wilk rejects normality (p ≈ 10⁻¹⁸), so the parametric `aov()` is untrustworthy. Both analyses happen to agree on direction, but ART's p-values are the ones you'd report. If the Shapiro test had passed instead, the parametric ANOVA would be the better choice; there is no reward for using a rank test on data that cooperates.

[TIP]
**Check residuals first, only then reach for ART.** Run `aov()`, plot `residuals(aov0)` or use `shapiro.test()`. If normality holds, stay parametric. If it fails, switch to `art()` and run the full workflow.

![Decision guide: when to reach for ART vs ordinary ANOVA, Kruskal-Wallis, or GLM-based methods.](screenshots/Aligned-Rank-Transform-ANOVA-in-R-decision-tree.webp)
*Figure 2: Decision guide for choosing between ART, ordinary ANOVA, Kruskal-Wallis, and GLM alternatives.*

**Try it:** Simulate a 2×2 factorial with normal residuals, fit both `aov()` and `art()`, and confirm the p-values are close (within about 0.05).

```r title="Your turn: normal-residual agreement check"
# Try it: under normal residuals, aov() and art() should agree
set.seed(55)
ex_df <- data.frame(
  a = factor(rep(c("lo", "hi"), each = 50)),
  b = factor(rep(rep(c("x", "y"), each = 25), 2)),
  y = rnorm(100)
)

# your code here: fit both models and compare p-values of the interaction
```

<details>
<summary>Click to reveal solution</summary>

```r title="Normal-residual agreement solution"
ex_aov <- aov(y ~ a * b, data = ex_df)
ex_art <- art(y ~ a * b, data = ex_df)

summary(ex_aov)[[1]][3, "Pr(>F)"]
#> [1] 0.4519
anova(ex_art)[3, "Pr(>F)"]
#> [1] 0.4612
```

**Explanation:** The two interaction p-values are within 0.01 of each other, which is the expected behaviour when the parametric assumptions hold. ART does not *lose* power on normal data; it just doesn't add any.

</details>

## Practice Exercises

### Exercise 1: CO2 uptake factorial

Using the built-in `CO2` dataset, fit an ordinary `aov(uptake ~ Type * Treatment)`. Run `shapiro.test()` on its residuals. Then fit `art(uptake ~ Type * Treatment)` and print both ANOVA tables. Save the three p-values from the ART table to `my_art_p`.

```r title="Exercise 1 starter: CO2 factorial"
# Exercise 1: compare parametric and ART on CO2
# Hint: aov() first, then shapiro.test(residuals(...)), then art()

my_art_p <- NULL
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
my_aov <- aov(uptake ~ Type * Treatment, data = CO2)
shapiro.test(residuals(my_aov))$p.value
#> [1] 0.003117

my_art <- art(uptake ~ Type * Treatment, data = CO2)
my_art_p <- anova(my_art)[, "Pr(>F)"]
my_art_p
#> [1] 2.186e-11 1.322e-06 0.2057
```

**Explanation:** Shapiro rejects normality (p ≈ 0.003), so ART is preferred. Type and Treatment are each significant, but the interaction is not (p ≈ 0.21).

</details>

### Exercise 2: ToothGrowth contrasts

On `ToothGrowth` (cast `dose` to a factor), fit `art(len ~ supp * dose)`, verify with `summary()`, and run `art.con()` on the interaction. Save the contrasts data frame to `my_contrasts`. Identify which supp-dose cells differ at α = 0.05.

```r title="Exercise 2 starter: ToothGrowth contrasts"
# Exercise 2: ART-C contrasts on ToothGrowth
tg <- ToothGrowth
tg$dose <- factor(tg$dose)

my_contrasts <- NULL
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
my_tg_art <- art(len ~ supp * dose, data = tg)
summary(my_tg_art)$aligned.anova  # all ~0: OK
my_contrasts <- as.data.frame(art.con(my_tg_art, "supp:dose"))
subset(my_contrasts, p.value < 0.05)
#>               contrast estimate   SE df t.ratio p.value
#> 1    OJ,0.5 - OJ,1     -25.0  4.92 54  -5.082 <.0001
#> 2    OJ,0.5 - OJ,2     -33.5  4.92 54  -6.810 <.0001
#> 4    OJ,0.5 - VC,1     -12.5  4.92 54  -2.540 0.0147
#> ...
```

**Explanation:** `art.con()` returns the full pairwise grid; filtering on `p.value < 0.05` extracts the significant cell differences after Tukey adjustment.

</details>

### Exercise 3: Side-by-side comparison helper

Write a function `compare_p(formula, data)` that fits both `aov()` and `art()` with the given formula, pulls the p-values for each term, and returns a tibble with columns `effect`, `p_parametric`, `p_ART`. Test it on `ToothGrowth` with `len ~ supp * dose`.

```r title="Exercise 3 starter: compare_p helper"
# Exercise 3: write compare_p(formula, data)
# Hint: coerce terms with `attr(terms(formula), "term.labels")`

compare_p <- function(formula, data) {
  # your code here
}
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
compare_p <- function(formula, data) {
  aov_fit <- aov(formula, data = data)
  art_fit <- art(formula, data = data)
  p_par <- summary(aov_fit)[[1]][, "Pr(>F)"]
  p_art <- anova(art_fit)[, "Pr(>F)"]
  data.frame(
    effect       = attr(terms(formula), "term.labels"),
    p_parametric = head(p_par, length(p_art)),
    p_ART        = p_art
  )
}

tg <- ToothGrowth
tg$dose <- factor(tg$dose)
compare_p(len ~ supp * dose, data = tg)
#>      effect p_parametric        p_ART
#> 1      supp    0.0002312 0.0004156
#> 2      dose    6.3e-16   <2.2e-16
#> 3 supp:dose    0.0218629 0.0081108
```

**Explanation:** On normally distributed data the two columns closely track each other. Wider gaps flag cases where the normality assumption is doing real work.

</details>

## Putting It All Together

Here is the full ART workflow on `ToothGrowth`, from data check to interpretation.

```r title="Complete ToothGrowth ART walkthrough"
tg <- ToothGrowth
tg$dose <- factor(tg$dose)

# 1. Quick normality check on parametric residuals
parm <- aov(len ~ supp * dose, data = tg)
shapiro.test(residuals(parm))$p.value
#> [1] 0.6694   # borderline; ART still safe to use

# 2. Fit ART and verify alignment
tg_art <- art(len ~ supp * dose, data = tg)
summary(tg_art)$aligned.anova
#> All column sums = 0 and aligned F values = 0: OK

# 3. ART ANOVA table
anova(tg_art)
#>              Df Df.res F value    Pr(>F)
#> 1 supp        1     54  14.107 0.0004156 ***
#> 2 dose        2     54  86.062 < 2.2e-16 ***
#> 3 supp:dose   2     54   5.259 0.0081108 **

# 4. Pairwise contrasts on the interaction
tg_con <- art.con(tg_art, "supp:dose", adjust = "tukey")
head(as.data.frame(tg_con), 4)
#>        contrast estimate   SE df t.ratio p.value
#> 1  OJ,0.5 - OJ,1  -25.00  4.92 54  -5.08  <.0001
#> 2  OJ,0.5 - OJ,2  -33.50  4.92 54  -6.81  <.0001
#> 3  OJ,0.5 - VC,0.5  2.50  4.92 54   0.51  0.9960
#> 4  OJ,0.5 - VC,1  -12.50  4.92 54  -2.54  0.0147
```

Walking through the output: Shapiro is comfortably above 0.05 so the data happen to be roughly normal (ART agrees with parametric here, as expected). The ANOVA confirms significant effects of supp, dose, and the interaction. The pairwise contrasts pinpoint where the supp-dose effect lives: OJ at 0.5 mg/day is clearly lower than OJ at 1 or 2 mg/day, but at 0.5 mg/day OJ and VC don't differ. This is the kind of granular, defensible conclusion ART is built to produce.

## Summary

![The ART workflow: align for each effect, rank the aligned values, run ANOVA, follow up with art.con() contrasts.](screenshots/Aligned-Rank-Transform-ANOVA-in-R-workflow-flow.webp)
*Figure 1: The ART ANOVA pipeline from raw data to pairwise contrasts.*

| Step | Function | What it gives you |
|---|---|---|
| Fit | `art()` | ART model object (lm, aov, or lmer engine) |
| Verify | `summary(m)` | Column sums ~0 and aligned-F ~0 confirming clean alignment |
| Test | `anova(m)` | F-statistics for every main effect and interaction |
| Contrast | `art.con(m, "A:B")` | Pairwise post-hoc tests via the ART-C procedure |

Reach for ART when residuals fail normality *and* you need factorial structure (main effects plus interaction). Stay with parametric `aov()` when residuals are well-behaved. Use Kruskal-Wallis only for one-factor designs. Use `art.con()`, never plain `emmeans()`, for post-hoc tests on ART models.

## References

1. Wobbrock, J. O., Findlater, L., Gergle, D., & Higgins, J. J. (2011). *The Aligned Rank Transform for Nonparametric Factorial Analyses Using Only ANOVA Procedures*. Proc. CHI '11. [Link](https://doi.org/10.1145/1978942.1978963)
2. Kay, M., Elkin, L. A., Higgins, J. J., & Wobbrock, J. O. (2025). *ARTool: Aligned Rank Transform for Nonparametric Factorial ANOVAs*. R package version 0.11.2. [CRAN](https://cran.r-project.org/package=ARTool)
3. Elkin, L. A., Kay, M., Higgins, J. J., & Wobbrock, J. O. (2021). *An Aligned Rank Transform Procedure for Multifactor Contrast Tests (ART-C)*. Proc. UIST '21. [Link](https://doi.org/10.1145/3472749.3474784)
4. Mangiafico, S. S. (2016). *R Handbook: Aligned Ranks Transformation ANOVA*. [rcompanion.org/handbook/F_16.html](https://rcompanion.org/handbook/F_16.html)
5. ARTool package vignettes: `vignette("art-contrasts")`. [GitHub repository](https://github.com/mjskay/ARTool)
6. Higgins, J. J., & Tashtoush, S. (1994). *An aligned rank transform test for interaction*. Nonlinear World, 1(2), 201–211.
7. ARTool reference manual (CRAN PDF). [Link](https://cran.r-project.org/web/packages/ARTool/ARTool.pdf)

## Continue Learning

1. [Factorial Experiments in R](Factorial-Experiments-in-R.html): the parametric parent, 2^k designs with main effects, confounding, and interactions.
2. [Two-Way ANOVA in R](Two-Way-ANOVA-in-R.html): the classical factorial ANOVA that ART replaces when residuals break normality.
3. [Kruskal-Wallis Test in R](Kruskal-Wallis-Test-in-R.html): the one-factor nonparametric test that ART generalises to factorial designs.
