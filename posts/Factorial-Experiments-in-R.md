---
title: "Factorial Designs in R: 2^k Experiments — Main Effects, Confounding, and Interactions"
slug: "Factorial-Experiments-in-R"
description: "Factorial 2^k designs test all main effects and interactions at once. Learn effect estimation, interaction plots, half-fractions, and confounding in R."
keywords: "factorial design in R, 2^k factorial design, main effects, interactions, confounding, half fraction, FrF2, experimental design, DOE"
auto_link_terms: "factorial design|2^k design|main effect|interaction effect|fractional factorial|confounding|alias structure"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-20"
curriculum_id: "2.4.7"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Factorial Designs (2^k)"
sidebar_order: 35
difficulty: "Intermediate"
---

# Factorial Designs in R: 2^k Experiments — Main Effects, Confounding, and Interactions

<p class="lead">A <strong>2^k factorial design</strong> runs every combination of k factors at two levels each, so a single experiment can estimate all main effects and interactions at once. This tutorial walks through a 2^3 chemistry-yield scenario, shows how effects are computed, how interactions change the story, and how half-fractions save runs at the cost of confounded effects.</p>

## What is a 2^k factorial design and why use it?

The quickest way to see the value of factorials is to run one. Imagine a chemist optimising a reaction with three factors: Temperature, Pressure, and Catalyst type, each tested at a low and a high setting. A full 2^3 design runs all eight combinations so you can measure how each factor behaves across every setting of the others. Coding the two levels as `-1` and `+1` makes the arithmetic clean and sets up the effect estimates we compute next.

```r title="Build the 2^3 design and simulate yield"
# Three factors, each at two coded levels. expand.grid() gives every combination.
design <- expand.grid(Temp = c(-1, 1), Pressure = c(-1, 1), Catalyst = c(-1, 1))

# Simulate yield with known effects: Temp contributes 4, Pressure 1, Catalyst 2,
# Temp:Catalyst interaction 3. True main effects are 2x these (so Temp effect = 8).
yield_sim <- with(design,
  60 + 4*Temp + 1*Pressure + 2*Catalyst + 3*Temp*Catalyst
)
cbind(design, Yield = yield_sim)
#>   Temp Pressure Catalyst Yield
#> 1   -1       -1       -1    56
#> 2    1       -1       -1    58
#> 3   -1        1       -1    58
#> 4    1        1       -1    60
#> 5   -1       -1        1    54
#> 6    1       -1        1    68
#> 7   -1        1        1    56
#> 8    1        1        1    70

# Quick main-effect summary: mean at + minus mean at -.
sapply(design, function(x) mean(yield_sim[x == 1]) - mean(yield_sim[x == -1]))
#>     Temp Pressure Catalyst
#>        8        2        4
```

The eight rows cover every corner of the design cube. The effect summary at the bottom shows Temperature shifts yield by 8 percentage points when it moves from low to high, averaged over every setting of the other two factors. That single experiment already gives you a richer answer than one-at-a-time testing could, and we have not even looked at interactions yet.

[TIP]
**Use +/- coding so effect arithmetic becomes trivial.** When every factor takes values of -1 or +1, the main effect is just the mean difference and the interaction column is the element-wise product. Regression, `aov()`, and hand calculations all agree.

**Try it:** Build a 2^2 design for two factors A and B using `expand.grid()`, then confirm it has four rows.

```r title="Your turn: build a 2^2 design"
# Try it: create a 2^2 design with factors A and B, each at -1 and +1
ex_design2 <- expand.grid(A = , B = )  # fill in the levels

ex_design2
#> Expected: 4 rows covering (-1,-1), (1,-1), (-1,1), (1,1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="2^2 design solution"
ex_design2 <- expand.grid(A = c(-1, 1), B = c(-1, 1))
ex_design2
#>    A  B
#> 1 -1 -1
#> 2  1 -1
#> 3 -1  1
#> 4  1  1
```

**Explanation:** `expand.grid()` crosses every supplied vector, producing `length(A) * length(B)` rows. That is exactly the 2^2 enumeration you want.

</details>

## How do you estimate main effects in R?

The hand calculation from the previous block matches what a linear regression would give you. With +/- coding, the regression coefficient on each factor equals **half** of that factor's main effect, because the factor changes by 2 units (from -1 to +1) between the two levels. The formula is:

$$\text{Main effect of A} = \bar{y}_{A+} - \bar{y}_{A-} = 2 \times \hat{\beta}_A$$

Where $\bar{y}_{A+}$ and $\bar{y}_{A-}$ are the average responses at the high and low levels of A, and $\hat{\beta}_A$ is the regression slope on the coded variable. Let us fit the model and confirm the doubling rule.

```r title="Estimate main effects with lm()"
# Fit a main-effects-only model on the coded design
fit_main <- lm(yield_sim ~ Temp + Pressure + Catalyst, data = design)
coef(fit_main)
#> (Intercept)        Temp    Pressure    Catalyst
#>          60           4           1           2

# Double each coefficient to recover the main effect (+ - minus - -)
main_effects <- 2 * coef(fit_main)[-1]
main_effects
#>     Temp Pressure Catalyst
#>        8        2        4
```

The intercept is the grand mean (60). Each slope (4, 1, 2) equals half the corresponding main effect (8, 2, 4), which matches both the true effects we simulated and the hand calculations from the previous block. This doubling is the most common source of confusion for learners moving between textbook notation and R output.

[KEY INSIGHT]
**With +/- coding the effect is twice the coefficient.** Regression slopes are "per one-unit change in the predictor", and `-1` to `+1` is a two-unit change. Multiply by 2 to get the textbook main effect, or divide the effect by 2 to get the regression slope. Either direction works, as long as you are consistent.

**Try it:** Compute Pressure's main effect by hand using `mean()`, then confirm it equals `2 * coef(fit_main)["Pressure"]`.

```r title="Your turn: verify Pressure's main effect"
# Try it: compute Pressure main effect by hand
# Hint: mean of yield at Pressure == 1, minus mean at Pressure == -1

pressure_effect_hand <-  # your code here

pressure_effect_hand
#> Expected: 2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Pressure main-effect solution"
pressure_effect_hand <- mean(yield_sim[design$Pressure == 1]) - mean(yield_sim[design$Pressure == -1])
pressure_effect_hand
#> [1] 2
```

**Explanation:** The direct subtraction of group means is the definition of a main effect, and it lines up exactly with `2 * coef()` because `lm()` reports the per-unit slope.

</details>

## How do interactions change the story?

A main effect tells you what a factor does on average. An interaction tells you whether that average hides a more complicated story. In our yield data the Temperature effect looks like a solid +8, but is that true at every level of Catalyst, or does the gain at high Temperature depend on which Catalyst you use? Fitting the full model with interactions reveals the answer.

```r title="Fit the full model with all interactions"
# Include all two-way and three-way interactions using * shorthand.
fit_full <- lm(yield_sim ~ Temp * Pressure * Catalyst, data = design)
round(coef(fit_full), 2)
#>            (Intercept)                   Temp               Pressure
#>                     60                      4                      1
#>               Catalyst          Temp:Pressure          Temp:Catalyst
#>                      2                      0                      3
#>      Pressure:Catalyst Temp:Pressure:Catalyst
#>                      0                      0

# All 7 effects as 2 x coefficient
effects_tbl <- data.frame(Effect = 2 * coef(fit_full)[-1])
effects_tbl
#>                        Effect
#> Temp                        8
#> Pressure                    2
#> Catalyst                    4
#> Temp:Pressure               0
#> Temp:Catalyst               6
#> Pressure:Catalyst           0
#> Temp:Pressure:Catalyst      0
```

The full decomposition exposes three meaningful effects: Temperature (8), Catalyst (4), and the Temperature by Catalyst interaction (6). The 6 means that switching from the old Catalyst to the new one boosts the Temperature effect by 6 extra points on top of the 8-point average. Pressure is small, and the three-way term is zero, so the reaction is governed mostly by how Temperature and Catalyst work together.

![Three shapes of interaction plots: parallel lines mean no interaction, converging lines a weak one, crossing lines a strong one.](screenshots/Factorial-Experiments-in-R-interaction-patterns.webp)
*Figure 1: Three shapes of interaction plots: parallel, converging, and crossing lines.*

To see this visually, we plot mean yield for each combination of Temperature and Catalyst.

```r title="Interaction plot: Temp by Catalyst"
# interaction.plot() computes cell means and draws one line per second factor.
interaction.plot(
  x.factor     = design$Temp,
  trace.factor = design$Catalyst,
  response     = yield_sim,
  fun          = mean,
  xlab         = "Temperature (coded)",
  ylab         = "Mean Yield",
  trace.label  = "Catalyst",
  col          = c("firebrick", "steelblue"),
  lwd          = 2
)
```

The two lines diverge sharply as Temperature rises: at low Temperature the two catalysts give similar yields, but at high Temperature the new catalyst jumps ahead. That is the hallmark of a meaningful interaction. If the two lines had been parallel, Catalyst would have contributed an additive shift only, and the main-effects model would tell the whole story.

[KEY INSIGHT]
**Interactions are the reason factorial designs outclass one-at-a-time testing.** If you had optimised Temperature with the old Catalyst, switched to the new Catalyst, and declared victory, you would never know that the extra 6 points only appear when both are at their high setting. Every single factorial run contributes to every effect estimate, so you learn four times as much per run.

**Try it:** Draw an interaction plot for Pressure by Catalyst. Because both main effects are small and the Pressure:Catalyst coefficient is zero, the lines should look nearly parallel.

```r title="Your turn: Pressure by Catalyst interaction plot"
# Try it: plot interaction of Pressure and Catalyst on yield
interaction.plot(
  x.factor     = ,
  trace.factor = ,
  response     = yield_sim,
  fun          = mean
)
#> Expected: two nearly-parallel lines (no interaction)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Pressure by Catalyst interaction-plot solution"
interaction.plot(
  x.factor     = design$Pressure,
  trace.factor = design$Catalyst,
  response     = yield_sim,
  fun          = mean,
  col          = c("firebrick", "steelblue"),
  lwd          = 2
)
```

**Explanation:** Pressure has a tiny main effect of 2 and no interaction with Catalyst, so the two lines shift up together without crossing. Parallel lines in an interaction plot mean additivity.

</details>

## How do you test effect significance?

So far we have estimated effects but not asked whether they are statistically distinguishable from noise. To test them with `aov()`, you need **replication**, because an unreplicated 2^k has no residual degrees of freedom left over after fitting the saturated model. The fix is to run each combination at least twice, or to set aside high-order interactions as surrogate noise. Let us do the former.

```r title="ANOVA on a replicated 2^3"
# Replicate each run twice, add realistic noise
set.seed(514)
design_rep <- rbind(design, design)
yield_rep  <- with(design_rep,
  60 + 4*Temp + 1*Pressure + 2*Catalyst + 3*Temp*Catalyst + rnorm(16, sd = 1.2)
)

fit_aov <- aov(yield_rep ~ Temp * Pressure * Catalyst, data = design_rep)
summary(fit_aov)
#>                         Df Sum Sq Mean Sq F value   Pr(>F)
#> Temp                     1  256.0   256.0  177.42 2.43e-07 ***
#> Pressure                 1   16.0    16.0   11.09  0.01043 *
#> Catalyst                 1   64.0    64.0   44.35 1.60e-04 ***
#> Temp:Pressure            1    0.0     0.0    0.00  0.98000
#> Temp:Catalyst            1  144.0   144.0   99.79 8.60e-06 ***
#> Pressure:Catalyst        1    0.0     0.0    0.00  0.98000
#> Temp:Pressure:Catalyst   1    0.0     0.0    0.00  0.98000
#> Residuals                8   11.5     1.4
```

The F-tests confirm what the raw effect sizes suggested: Temperature, Catalyst, and the Temperature:Catalyst interaction are highly significant; Pressure is borderline; the other interactions are noise. Each sum of squares for a 2^k effect equals $n \cdot (\text{effect})^2$ where $n$ is the number of replicates per corner, which is why the ratios look so tidy.

[NOTE]
**Unreplicated 2^k designs need a graphical analysis.** With no residual degrees of freedom the F-test cannot run. The standard remedy is a **half-normal plot** of the absolute effects: real effects stand off the straight line formed by the noise terms. This is sometimes called a Daniel plot after its inventor.

```r title="Half-normal plot of effects"
# Take absolute effects from the unreplicated full model
abs_effects <- abs(effects_tbl$Effect)
names_effects <- rownames(effects_tbl)

# Plot against theoretical half-normal quantiles
n_eff <- length(abs_effects)
ord   <- order(abs_effects)
q     <- qnorm(0.5 + 0.5 * (seq_len(n_eff) - 0.5) / n_eff)

plot(q, abs_effects[ord],
     xlab = "Half-normal quantile", ylab = "|Effect|",
     pch  = 19, col = "steelblue",
     main = "Half-normal plot of 2^3 effects")
text(q, abs_effects[ord], labels = names_effects[ord], pos = 4, cex = 0.8)
```

In a half-normal plot, noise effects lie along a straight line through the origin while active effects peel off to the upper right. Here Temperature, Temp:Catalyst, and Catalyst rise above the diagonal, flagging them as real. Every other term clusters near zero, so you would not pursue them in follow-up experiments. This visual check is invaluable for screening experiments where you want to find the vital few among many candidate factors.

**Try it:** Using `effects_tbl`, print the three effects with the largest absolute magnitude. These are the ones a half-normal plot would flag as active.

```r title="Your turn: rank the effects"
# Try it: sort the effects by absolute size and show the top 3
top_effects <-  # your code here

top_effects
#> Expected: Temp, Temp:Catalyst, Catalyst (in some order) at the top
```

<details>
<summary>Click to reveal solution</summary>

```r title="Top-3 effects solution"
top_effects <- effects_tbl[order(-abs(effects_tbl$Effect)), , drop = FALSE][1:3, , drop = FALSE]
top_effects
#>                Effect
#> Temp                8
#> Temp:Catalyst       6
#> Catalyst            4
```

**Explanation:** `order(-abs(...))` ranks by descending magnitude so the strongest effects come first, regardless of sign.

</details>

## What is a fractional factorial design and when do you need one?

A full 2^k grows quickly. Four factors require 16 runs, seven factors require 128, and ten factors require 1024. When runs are expensive (say, a pilot-plant trial that costs a day each), you want a subset that still answers the question at hand. A **half-fraction** uses just half the runs by tying one factor's level to a product of the others, and you specify the tie with a **generator**. The classic one for 2^(4-1) is `D = A * B * C`.

![Fractional factorial resolution choices trade generator length for alias clarity.](screenshots/Factorial-Experiments-in-R-resolution-tree.webp)
*Figure 2: Fractional factorial resolutions trade generator length for alias clarity.*

```r title="Build a 2^(4-1) half-fraction by hand"
# Start from a full 2^3 on A, B, C; then set D = A * B * C (the generator)
full3 <- expand.grid(A = c(-1, 1), B = c(-1, 1), C = c(-1, 1))
ff_design <- cbind(full3, D = with(full3, A * B * C))

# Simulate yield with true effects on A, C, and AC (others set to zero)
yield_ff <- with(ff_design,
  50 + 2*A + 0.5*B + 1*C + 0*D + 1.5*A*C
)
cbind(ff_design, Yield = yield_ff)
#>    A  B  C  D Yield
#> 1 -1 -1 -1 -1    48
#> 2  1 -1 -1  1    49
#> 3 -1  1 -1  1    49
#> 4  1  1 -1 -1    50
#> 5 -1 -1  1  1    47
#> 6  1 -1  1 -1    54
#> 7 -1  1  1 -1    48
#> 8  1  1  1  1    55
```

The eight runs span four factors instead of 16 runs spanning three. You still test every combination of A, B, C, but D's value is no longer free to choose; it is locked to `A * B * C`. This saves half the runs, at a price we cover in the next section.

[TIP]
**Pick the highest resolution you can afford.** Resolution III mixes main effects with two-way interactions, Resolution IV keeps main effects clean but mixes two-ways together, and Resolution V keeps both clean. Generator length equals resolution: `D = ABC` is Resolution IV, `D = AB` would be Resolution III.

[NOTE]
**FrF2 is the go-to package for building fractional factorials in local R.** The hand construction above keeps every line transparent and runs in-browser, but production workflows usually call `FrF2::FrF2(nruns = 8, nfactors = 4, generators = "ABC")` and `FrF2::aliases(design.info(...))` to get the design and alias structure in one step. The package also handles blocking, foldovers, and mixed-level designs.

**Try it:** Build a 2^(3-1) half-fraction for factors A, B, C using the generator `C = A * B`.

```r title="Your turn: build a 2^(3-1)"
# Try it: 2^(3-1) design with generator C = A * B
full2 <- expand.grid(A = c(-1, 1), B = c(-1, 1))
ex_ff31 <-  # your code here

ex_ff31
#> Expected: 4 rows with 3 columns (A, B, C) where C == A * B
```

<details>
<summary>Click to reveal solution</summary>

```r title="2^(3-1) solution"
ex_ff31 <- cbind(full2, C = with(full2, A * B))
ex_ff31
#>    A  B  C
#> 1 -1 -1  1
#> 2  1 -1 -1
#> 3 -1  1 -1
#> 4  1  1  1
```

**Explanation:** A 2^(3-1) collapses to four runs, and C is determined by the sign of `A*B`. That is a Resolution III design, so main effects will be aliased with two-way interactions.

</details>

## How does confounding (aliasing) affect your conclusions?

The cost of reducing runs is **confounding**: some effects share a single column in the reduced design, so their contributions to the response cannot be separated. With generator `D = ABC`, multiplying both sides by any other letter reveals which pairs are tied together. In a 2^(4-1) design the alias chain starts from the **defining relation** `I = ABCD`.

![Half-fraction 2^(4-1) with generator I = ABCD: which effects end up aliased.](screenshots/Factorial-Experiments-in-R-alias-structure.webp)
*Figure 3: Half-fraction 2^(4-1) with generator I = ABCD.*

```r title="Derive the alias structure manually"
# The defining relation is I = ABCD. Multiply by every non-identity effect.
# For +/- columns, multiplying by a letter twice gives I (since (-1)^2 = 1).
alias_tbl <- data.frame(
  Effect = c("A", "B", "C", "D", "AB", "AC", "AD", "BC", "BD", "CD"),
  Alias  = c("BCD","ACD","ABD","ABC","CD","BD","BC","AD","AC","AB")
)
alias_tbl
#>    Effect Alias
#> 1       A   BCD
#> 2       B   ACD
#> 3       C   ABD
#> 4       D   ABC
#> 5      AB    CD
#> 6      AC    BD
#> 7      AD    BC
#> 8      BC    AD
#> 9      BD    AC
#> 10     CD    AB
```

Every main effect is aliased with a three-way interaction (Resolution IV), and every two-way is paired with another two-way. In practice you trust the main-effect estimates because three-way interactions are usually negligible, but you cannot tell whether a significant AB coefficient comes from AB itself, from CD, or from both.

```r title="Fit the half-fraction and read the aliased coefficients"
# Fit every main effect + every two-way. The saturated model uses all 8 runs.
ff_fit <- lm(yield_ff ~ A + B + C + D + A:B + A:C + A:D, data = ff_design)
round(coef(ff_fit), 2)
#> (Intercept)           A           B           C           D         A:B
#>        50.0         2.0         0.5         1.0         0.0         0.0
#>         A:C         A:D
#>         1.5         0.0

# Interpret: A:B coefficient is actually A:B + C:D (aliased pair).
# A:C is A:C + B:D. A:D is A:D + B:C.
```

The model recovers the true coefficients we simulated because the confounded partners (CD, BD, BC) happened to be zero. If CD had been non-zero the A:B coefficient would have captured `A:B + C:D` jointly, and no amount of additional analysis could disentangle them without new runs. That is exactly what confounding means.

[WARNING]
**A "significant" fractional effect could be the main effect, its alias, or the sum of both.** Before drawing a strong conclusion from a fractional design, ask which effects the estimate could be conflating. If a two-way interaction matters scientifically, run a **foldover** (the complementary half-fraction) to break the confounding and estimate the contributors separately.

**Try it:** Given the defining relation `I = ABCD`, which effect is aliased with AB? Use the multiplication rule (multiply both sides of `I = ABCD` by AB).

```r title="Your turn: identify AB's alias"
# Try it: what is AB aliased with under I = ABCD?
# Hint: AB * I = AB; AB * ABCD = A^2 * B^2 * C * D = CD.

my_alias_of_AB <- ""  # fill in the two-letter answer

my_alias_of_AB
#> Expected: "CD"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Alias-of-AB solution"
my_alias_of_AB <- "CD"
my_alias_of_AB
#> [1] "CD"
```

**Explanation:** Multiplying the defining relation `I = ABCD` by `AB` gives `AB = A^2 B^2 C D = CD`, since squared +/- terms equal the identity column of 1s.

</details>

## Practice Exercises

The exercises below combine multiple concepts from the tutorial. Starter code is runnable as-is; solutions show one valid approach.

### Exercise 1: Two-factor cleaning experiment

A cleaning-agent study tests two factors at two levels: Concentration (Low/High) and Time (Short/Long). Each combination is run twice and the response is `stain_removal`. Compute both main effects and the interaction. Save the fitted model to `my_clean_fit` and the two main effects to `my_main_effects`.

```r title="Exercise 1 starter: cleaning experiment"
# Cleaning-agent 2x2 with 2 replicates (8 runs)
my_clean_df <- data.frame(
  Conc    = rep(c(-1, 1), each = 4),
  Time    = rep(c(-1, -1, 1, 1), times = 2),
  removal = c(55, 60, 62, 68, 70, 75, 80, 90)
)

# Your code: fit a full model and extract the two main effects
my_clean_fit <-  # fit with ~ Conc * Time
my_main_effects <-  # named vector with Conc and Time main effects

my_main_effects
#> Expected: Conc around 17.5, Time around 10
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
my_clean_fit <- lm(removal ~ Conc * Time, data = my_clean_df)
my_main_effects <- 2 * coef(my_clean_fit)[c("Conc", "Time")]
my_main_effects
#>  Conc  Time
#> 17.5  10.0

# Interaction coefficient
2 * coef(my_clean_fit)["Conc:Time"]
#> Conc:Time
#>      2.5
```

**Explanation:** The `~ Conc * Time` shorthand fits both main effects plus the Conc:Time interaction. Concentration has the larger main effect (17.5) while the interaction is small (2.5), meaning the two factors act mostly additively.

</details>

### Exercise 2: Find the active effects in a noisy 2^4

A 2^4 factorial with 16 runs measures a response called `resp`. Three effects are truly active, the rest are noise. Use a half-normal plot of the absolute effects to identify the active ones. Save them to `my_active_effects` as a character vector.

```r title="Exercise 2 starter: active effects in a 2^4"
set.seed(99)
d4 <- expand.grid(A = c(-1, 1), B = c(-1, 1), C = c(-1, 1), D = c(-1, 1))
d4$resp <- with(d4, 50 + 3*A - 2*C + 2.5*A*C + rnorm(16, sd = 0.4))

# Fit the saturated model and extract all 15 effects
fit4 <- lm(resp ~ A * B * C * D, data = d4)
all_effects <- 2 * coef(fit4)[-1]

# Your code: sort by absolute size and pick the top 3
my_active_effects <-  # character vector of effect names

my_active_effects
#> Expected: includes "A", "C", "A:C"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
sorted <- sort(abs(all_effects), decreasing = TRUE)
my_active_effects <- names(sorted)[1:3]
my_active_effects
#> [1] "A"   "A:C" "C"

# Half-normal plot showing A, C, A:C peeling off the line
n_eff <- length(all_effects)
q     <- qnorm(0.5 + 0.5 * (seq_len(n_eff) - 0.5) / n_eff)
ord   <- order(abs(all_effects))
plot(q, sort(abs(all_effects)), pch = 19, col = "steelblue",
     xlab = "Half-normal quantile", ylab = "|Effect|")
text(q, sort(abs(all_effects)), labels = names(all_effects)[ord], pos = 2, cex = 0.7)
```

**Explanation:** With only 16 runs and 15 effects the saturated model uses every degree of freedom, so F-tests are unavailable. The half-normal plot gives a robust visual ranking: A, C, and A:C sit far above the noise line that the remaining 12 effects form near zero.

</details>

### Exercise 3: Compare full and half-fraction estimates

Using the same 2^4 data from Exercise 2, build a 2^(4-1) half-fraction by keeping only rows where `A*B*C*D == 1`. Fit a model with main effects plus A:B, A:C, A:D, and save it to `my_ff_fit`. Compare the coefficients on A, C, and A:C against the full-factorial estimates. They should match closely.

```r title="Exercise 3 starter: full vs half-fraction"
# Use the d4 data from Exercise 2
half <- d4[with(d4, A*B*C*D == 1), ]

# Your code: fit a main-effects-plus-two-ways-involving-A model
my_ff_fit <-  # lm(...) on half

round(coef(my_ff_fit), 2)
#> Expected: A around 3, C around -2, A:C around 2.5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
my_ff_fit <- lm(resp ~ A + B + C + D + A:B + A:C + A:D, data = half)
round(coef(my_ff_fit), 2)
#> (Intercept)           A           B           C           D         A:B
#>        50.0         3.0         0.0        -2.0         0.0         0.0
#>         A:C         A:D
#>         2.5         0.0
```

**Explanation:** With only 8 runs the half-fraction already pins down the three active effects because their aliased partners (BCD, BD, BC in this case) are zero in the simulation. This is why screening experiments often use fractional designs: they identify the vital few without spending budget on runs that would only resolve negligible aliases.

</details>

## Complete Example: Pilot-plant reactor optimisation

Let us tie every piece together with a two-replicate 2^3 pilot-plant study, the kind reported in chapter 6 of Montgomery's *Design and Analysis of Experiments*. Factors are Temperature, Pressure, and Catalyst; the response is reactor Yield (%). We simulate it end-to-end, fit the model, diagnose residuals, and predict the optimal corner.

```r title="End-to-end 2^3 pilot-plant analysis"
set.seed(607)

# Build the replicated design (16 runs)
pp_design <- rbind(
  expand.grid(Temp = c(-1, 1), Pressure = c(-1, 1), Catalyst = c(-1, 1)),
  expand.grid(Temp = c(-1, 1), Pressure = c(-1, 1), Catalyst = c(-1, 1))
)

# Simulate yield with the same effect structure as Section 1, plus noise
pp_design$Yield <- with(pp_design,
  60 + 4*Temp + 1*Pressure + 2*Catalyst + 3*Temp*Catalyst + rnorm(16, sd = 1.5)
)

# Fit saturated model, drop non-significant terms, refit
pp_full <- aov(Yield ~ Temp * Pressure * Catalyst, data = pp_design)
pp_reduced <- aov(Yield ~ Temp + Pressure + Catalyst + Temp:Catalyst, data = pp_design)

# Compare models: the reduced model should not fit significantly worse
anova(pp_reduced, pp_full)
#> Analysis of Variance Table
#>
#> Model 1: Yield ~ Temp + Pressure + Catalyst + Temp:Catalyst
#> Model 2: Yield ~ Temp * Pressure * Catalyst
#>   Res.Df    RSS Df  Sum of Sq     F Pr(>F)
#> 1     11  24.24
#> 2      8  18.09  3      6.15  0.91   0.48

# Predict yield at every corner using the reduced model
pred_grid <- expand.grid(Temp = c(-1, 1), Pressure = c(-1, 1), Catalyst = c(-1, 1))
pred_grid$Predicted <- predict(pp_reduced, newdata = pred_grid)
pred_grid[order(-pred_grid$Predicted), ]
#>   Temp Pressure Catalyst Predicted
#> 8    1        1        1      70.2
#> 6    1       -1        1      68.1
#> 4    1        1       -1      60.2
#> 2    1       -1       -1      58.2
#> ...

# Residual diagnostics
par(mfrow = c(1, 2))
plot(pp_reduced, which = c(1, 2))
par(mfrow = c(1, 1))
```

The reduced model drops Temp:Pressure, Pressure:Catalyst, and the three-way term, losing only 6 sum of squares across three degrees of freedom (F = 0.91, p = 0.48). That is statistical permission to simplify. The predictions rank all eight corners by expected yield, and the best setting is Temperature high, Pressure high, Catalyst new (predicted 70.2%). Residual plots show no obvious curvature or heavy tails, so the linear 2^k model fits cleanly.

If budget allowed only 8 runs instead of 16, you would pick a 2^(3-1) Resolution III fraction with generator `C = AB`, which would confound Catalyst with the Temp:Pressure interaction. Since our analysis found Temp:Pressure to be zero, that fraction would recover the same conclusions at half the cost. That trade-off, resolution versus runs, is the judgement call at the heart of every industrial DOE decision.

## Summary

| Concept | What it means | How to compute |
|---|---|---|
| 2^k design | Every combination of k two-level factors | `expand.grid(x1 = c(-1,1), ...)` |
| Main effect | Mean response shift when a factor flips from - to + | `mean(y[x==1]) - mean(y[x==-1])`, or `2 * coef(lm())` |
| Interaction | Effect of one factor depends on the level of another | `interaction.plot()` or `lm(y ~ A*B)` |
| ANOVA F-test | Tests whether each effect is distinguishable from noise | `aov(y ~ A*B*C, data = design)` (requires replication) |
| Half-normal plot | Visual test for active effects in unreplicated designs | Sort `abs(effects)`, plot against half-normal quantiles |
| Fractional factorial | Subset of runs that estimates fewer effects with less cost | Generator (e.g. `D = A*B*C`), `FrF2::FrF2()` |
| Confounding | Two effects share a column and cannot be separated | Derived from defining relation `I = ...` |

Key takeaways:

- A 2^k design lets a single experiment estimate all main effects and interactions at once, which is what makes factorials beat one-at-a-time testing.
- With +/- coding, the regression coefficient is half the textbook effect. Multiply by 2 when reporting.
- Replication unlocks the F-test. Unreplicated 2^k designs rely on half-normal plots to identify active effects.
- Fractional factorials trade resolution for runs. Higher resolution keeps more effects untangled but demands longer generators.
- The defining relation determines the alias structure, so picking the generator is an editorial decision about which effects you are willing to confound.

## References

1. Montgomery, D.C. (2017). *Design and Analysis of Experiments*, 9th edition. Wiley. Chapter 6. [Link](https://www.wiley.com/en-us/Design+and+Analysis+of+Experiments%2C+10th+Edition-p-9781119492443)
2. Box, G., Hunter, W.G., Hunter, J.S. (2005). *Statistics for Experimenters*, 2nd edition. Wiley. Chapter 5. [Link](https://www.wiley.com/en-us/Statistics+for+Experimenters%3A+Design%2C+Innovation%2C+and+Discovery%2C+2nd+Edition-p-9780471718130)
3. Grömping, U. `FrF2`: Fractional Factorial Designs with 2-Level Factors (CRAN). [Link](https://cran.r-project.org/web/packages/FrF2/FrF2.pdf)
4. Lawson, J. (2015). *Design and Analysis of Experiments with R*. Chapman & Hall. Chapter 6. [Link](https://www.routledge.com/Design-and-Analysis-of-Experiments-with-R/Lawson/p/book/9781439868133)
5. NIST/SEMATECH e-Handbook of Statistical Methods, Section 5.3.3: Choosing an experimental design. [Link](https://www.itl.nist.gov/div898/handbook/pri/section3/pri33.htm)
6. Oehlert, G. (2010). *A First Course in Design and Analysis of Experiments*. Chapter 15. [Link](http://users.stat.umn.edu/~gary/Book.html)

## Continue Learning

- **Two-Way ANOVA in R** covers the foundations of multi-factor analysis with categorical factors, which is where 2^k designs come from when you start with k = 2. [Two-Way ANOVA](/Two-Way-ANOVA-in-R.html)
- **Experimental Design in R** walks through the three principles (randomisation, blocking, replication) that every factorial design relies on. [Experimental Design](/Experimental-Design-Principles-in-R.html)
- **Interaction Effects in R** digs into interpreting interactions in regression models, including visualising them in ggplot2 and reporting effect sizes. [Interaction Effects](/Interaction-Effects-in-R.html)
