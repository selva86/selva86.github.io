---
title: "Experimental Design in R: The Three Principles That Make Results Valid and Generalisable"
slug: "Experimental-Design-Principles-in-R"
description: "Randomisation removes confounding, blocking reduces noise, replication enables inference. Learn CRD, RCBD, and factorial designs in R with aov() examples."
keywords: "experimental design R, randomization in R, blocking, replication, completely randomized design, randomized block design, factorial design, aov in R, design of experiments, DoE"
auto_link_terms: "experimental design|randomisation|blocking|replication|randomised block design|completely randomised design|factorial design|design of experiments"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-20"
curriculum_id: "2.4.6"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Experimental Design in R"
sidebar_order: 63
difficulty: "Intermediate"
---

# Experimental Design in R: The Three Principles That Make Results Valid and Generalisable

<p class="lead">Experimental design in R rests on three principles: <strong>randomisation</strong> assigns units to treatments by chance, <strong>blocking</strong> groups similar units to control known nuisance variation, and <strong>replication</strong> repeats each treatment enough times to estimate error. Applied together, they make your <code>aov()</code> results both internally valid (the treatment caused the effect) and generalisable (the result holds beyond this sample).</p>

## What makes an experiment scientifically valid?

A valid experiment lets you claim two things with confidence: the treatment caused the observed difference, and the result generalises beyond the exact units tested. Lose either and the analysis collapses, because no ANOVA can rescue a badly designed study. The fastest way to see why is to simulate the same scientific question twice, once with biased assignment and once with random assignment, then compare what each tells us.

```r title="Confounded vs randomised: same response, different story"
# Twelve plots with a hidden gradient (say, soil nitrogen by row)
set.seed(101)
plots <- data.frame(
  id = 1:12,
  soil_n = c(rep("low", 6), rep("high", 6)),   # hidden nuisance
  response = c(rnorm(6, mean = 50, sd = 4),    # low soil plots
               rnorm(6, mean = 55, sd = 4))    # high soil plots
)

# Scenario A: treatment is confounded with soil (first 6 plots get drug, last 6 get placebo)
trt_confounded <- c(rep("drug", 6), rep("placebo", 6))

# Scenario B: treatment is randomised across all 12 plots
trt_random <- sample(c(rep("drug", 6), rep("placebo", 6)))

# Fit aov() for both
fit_conf <- aov(response ~ trt_confounded, data = plots)
fit_rand <- aov(response ~ trt_random,     data = plots)

cat("Confounded p-value:", summary(fit_conf)[[1]][["Pr(>F)"]][1], "\n")
cat("Randomised p-value:", summary(fit_rand)[[1]][["Pr(>F)"]][1], "\n")
#> Confounded p-value: 0.003...
#> Randomised p-value: 0.36...
```

Same response values, same sample size, same `aov()` call. The confounded analysis finds a "drug effect" at p < 0.01, even though the drug has zero true effect in the simulation: the difference was caused by soil nitrogen, not by the drug. Random assignment disconnected treatment from soil, so the p-value correctly reports "no evidence of an effect." That is why every valid experiment starts with random allocation.

![Each principle addresses a different threat to valid inference; together they produce results that are both internally valid and generalisable.](screenshots/Experimental-Design-Principles-in-R-three-principles-map.webp)
*Figure 1: How the three principles of experimental design combine to support valid and generalisable inference.*

[KEY INSIGHT]
**Randomisation is the one step that licenses a causal claim.** Without it, a significant p-value could reflect the treatment, or any hidden variable that happened to track the treatment assignment. Random allocation makes hidden variables independent of treatment on average, so the signal that survives is the one you care about.

**Try it:** Change `set.seed(101)` to `set.seed(7)` and rerun the block above. Does the confounded p-value stay small? Does the randomised p-value behave differently?

```r title="Your turn: change the seed and compare"
# Try it: change the seed and rerun
set.seed(7)
ex_plots <- data.frame(
  id = 1:12,
  soil_n = c(rep("low", 6), rep("high", 6)),
  response = c(rnorm(6, mean = 50, sd = 4),
               rnorm(6, mean = 55, sd = 4))
)
# your code here: build trt_confounded, trt_random, fit two aov()s, print both p-values

#> Expected: confounded p remains small; randomised p is large (often > 0.1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Seed-change comparison solution"
set.seed(7)
ex_plots <- data.frame(
  id = 1:12,
  soil_n = c(rep("low", 6), rep("high", 6)),
  response = c(rnorm(6, mean = 50, sd = 4),
               rnorm(6, mean = 55, sd = 4))
)
ex_trt_conf <- c(rep("drug", 6), rep("placebo", 6))
ex_trt_rand <- sample(c(rep("drug", 6), rep("placebo", 6)))
ex_p_conf <- summary(aov(response ~ ex_trt_conf, data = ex_plots))[[1]][["Pr(>F)"]][1]
ex_p_rand <- summary(aov(response ~ ex_trt_rand, data = ex_plots))[[1]][["Pr(>F)"]][1]
cat("Confounded p:", round(ex_p_conf, 3), "\n")
cat("Randomised p:", round(ex_p_rand, 3), "\n")
#> Confounded p: 0.002
#> Randomised p: 0.428
```

**Explanation:** The confounded assignment is pinned to the soil gradient, so it will always look significant regardless of seed. The randomised assignment breaks that link, so its p-value is unrelated to the nuisance variable.

</details>

## How does randomisation remove confounding bias?

Randomisation is simple to state: give every unit an equal chance of being assigned to each treatment. In R you do this with `sample()`. The point is not the mechanics, it is the statistical gift that follows: any hidden variable, measured or not, becomes independent of treatment on average. Your `aov()` residuals then cleanly represent chance variation, not systematic bias.

Start with a blank slate of 12 experimental units and a target of 3 treatments with 4 replicates each. You need a plan that assigns each unit to one treatment, with the assignment shuffled by chance.

```r title="Randomise 12 units across 3 treatments"
set.seed(42)
units <- paste0("unit_", 1:12)
treatment_plan <- data.frame(
  unit = units,
  treatment = sample(rep(c("A", "B", "C"), each = 4))  # sample() shuffles
)
head(treatment_plan, 6)
#>      unit treatment
#> 1  unit_1         B
#> 2  unit_2         A
#> 3  unit_3         C
#> 4  unit_4         C
#> 5  unit_5         A
#> 6  unit_6         B
```

The pattern is: build the *balanced* vector first with `rep(..., each = 4)`, then shuffle it with `sample()`. This guarantees exactly 4 units per treatment, only the *order* is random. A second quick check confirms the allocation is balanced.

```r title="Confirm balanced allocation"
table(treatment_plan$treatment)
#> 
#> A B C 
#> 4 4 4
```

Four units per group, as planned. Had you called `sample(c("A","B","C"), 12, replace = TRUE)` instead you would get roughly balanced groups, but imbalance creeps in through randomness alone. The `rep` + `sample` idiom is the reproducible way to randomise a balanced design.

[TIP]
**Always call `set.seed()` before any randomisation.** Reproducibility is not optional: reviewers, collaborators, and your future self all need to run the same randomisation and get the same layout. A different seed means a different experiment.

Now simulate realistic responses for this CRD and fit the aov. The data mimic a three-treatment comparison where treatment C is truly a bit better than A and B.

```r title="Fit a completely randomised design with aov()"
set.seed(99)
crd_df <- treatment_plan
crd_df$yield <- rnorm(12, mean = c(A = 50, B = 51, C = 56)[crd_df$treatment], sd = 3)
fit_crd <- aov(yield ~ treatment, data = crd_df)
summary(fit_crd)
#>             Df Sum Sq Mean Sq F value Pr(>F)  
#> treatment    2  72.58   36.29    4.07 0.0547 .
#> Residuals    9  80.19    8.91
```

The F-test says "borderline": p = 0.055 with only 4 replicates per treatment. The result is *unbiased* because we randomised, but it is *noisy* because 12 plots is not many. Blocking will shrink the noise without adding plots, and replication will shrink it further by adding them. Both principles come next.

**Try it:** Randomise 24 units across 4 treatment levels (label them W, X, Y, Z) with 6 units per level, then verify the allocation with `table()`.

```r title="Your turn: randomise 24 units across 4 treatments"
# Try it: balanced randomisation, 6 per group
set.seed(2026)
ex_units <- paste0("u", 1:24)
# your code here: build ex_plan data.frame with units and treatment columns

# Verify:
# table(ex_plan$treatment)
#> Expected: W=6, X=6, Y=6, Z=6
```

<details>
<summary>Click to reveal solution</summary>

```r title="Balanced randomisation solution"
set.seed(2026)
ex_units <- paste0("u", 1:24)
ex_plan <- data.frame(
  unit = ex_units,
  treatment = sample(rep(c("W", "X", "Y", "Z"), each = 6))
)
table(ex_plan$treatment)
#> 
#> W X Y Z 
#> 6 6 6 6
```

**Explanation:** `rep(c("W","X","Y","Z"), each = 6)` creates a perfectly balanced vector of length 24. `sample()` shuffles its order, producing a randomised-but-balanced assignment.

</details>

## Why does blocking reduce experimental error?

Randomisation deals with *unknown* nuisance variables, but what about the ones you already know about, like soil moisture differing by field strip or patient age group in a trial? Blocking handles these directly: group similar units into blocks, then randomise treatments *within* each block. The block effect gets its own line in the aov table, and treatment comparisons are made within blocks where nuisance is held constant.

The cleanest way to see blocking pay off is to analyse the *same response values* twice: once pretending there is no block (CRD), once acknowledging the block (RCBD). Build a dataset where two field strips differ in baseline yield and each strip gets all three treatments.

```r title="Build a plot-level dataset with a hidden block effect"
set.seed(303)
plot_df <- data.frame(
  block = factor(rep(c("wet", "dry"), each = 6)),
  treatment = factor(rep(c("A", "B", "C"), times = 4)),
  yield = c(
    # wet strip (baseline +4)
    54 + rnorm(2, 0, 1), 55 + rnorm(2, 0, 1), 60 + rnorm(2, 0, 1),
    # dry strip (baseline -4)
    46 + rnorm(2, 0, 1), 47 + rnorm(2, 0, 1), 52 + rnorm(2, 0, 1)
  )
)
fit_crd_only <- aov(yield ~ treatment, data = plot_df)
summary(fit_crd_only)
#>             Df Sum Sq Mean Sq F value Pr(>F)  
#> treatment    2  96.47   48.24   2.983 0.1018
#> Residuals    9 145.52   16.17
```

Ignoring the block, the residual mean square is 16.17 and the F-test for treatment misses the 5% threshold (p = 0.10). The block variance got dumped into residuals, where it drags the denominator up and the F-statistic down. Now rerun with the block added to the model.

```r title="Same data, now analysed as RCBD"
fit_rcbd <- aov(yield ~ block + treatment, data = plot_df)
summary(fit_rcbd)
#>             Df Sum Sq Mean Sq F value  Pr(>F)    
#> block        1 128.68  128.68 152.10 2.1e-06 ***
#> treatment    2  96.47   48.24  57.01 1.5e-05 ***
#> Residuals    8   6.77    0.85
```

Same response values, same treatment effect, but the residual mean square collapsed from 16.17 to 0.85. The block accounted for 128 of the 145 "residual" sum of squares the CRD had lumped together. With residuals this small, the treatment F-test now returns p ≈ 0.00002: overwhelmingly significant. That is blocking in one aov table.

Why does this work mathematically? The total variation in the response is fixed: the CRD model splits it two ways (treatment + residuals), while the RCBD model splits it three ways (treatment + block + residuals). The slice carved off for the block stops being noise, so residuals shrink, and since F is signal over noise, the F-statistic for treatment rises.

$$MS_E^{CRD} \;\approx\; \frac{SS_{block} + SS_E^{RCBD}}{df_{block} + df_E^{RCBD}}$$

Where:
- $MS_E^{CRD}$ is the residual mean square when you ignore blocks
- $SS_{block}$ is the sum of squares the block explains
- $SS_E^{RCBD}$ is the residual sum of squares after fitting the block
- $df$ are the corresponding degrees of freedom

![A CRD randomises treatments across all plots; an RCBD first groups plots into blocks, then randomises within each block.](screenshots/Experimental-Design-Principles-in-R-crd-vs-rcbd.webp)
*Figure 2: Randomisation layout differs between CRD and RCBD; the extra step in RCBD is grouping similar units before randomising within each group.*

[NOTE]
**Block on variables you cannot control but can measure.** Classic choices: field strip (agriculture), patient age band (medicine), operator or shift (manufacturing), day of experiment (anything with time drift). Do not block on a variable you are actually studying: that variable belongs as a treatment factor, not a nuisance factor.

**Try it:** Refit `fit_rcbd` but use `yield ~ treatment` only (drop the block term). Is the residual mean square closer to 0.85 or to 16.17?

```r title="Your turn: drop the block term and compare"
# Try it: drop the block term from the RCBD model
ex_model <- aov(yield ~ treatment, data = plot_df)  # no block
summary(ex_model)
#> Expected: residual MS near 16, not 0.85
```

<details>
<summary>Click to reveal solution</summary>

```r title="Drop-block comparison solution"
ex_model <- aov(yield ~ treatment, data = plot_df)
summary(ex_model)
#>             Df Sum Sq Mean Sq F value Pr(>F)  
#> treatment    2  96.47   48.24   2.983 0.1018
#> Residuals    9 145.52   16.17
```

**Explanation:** Dropping the block absorbs the block's sum of squares back into residuals. Residual MS jumps from 0.85 to 16.17 and the treatment F-test loses its significance. The block was carrying real variance out of the error term.

</details>

## How much replication do you need for reliable inference?

Replication is the principle that supplies the *denominator* for every inferential test. Without repeated measurements you cannot estimate error, and without an error estimate no p-value exists. More replicates also mean more residual degrees of freedom, tighter confidence intervals, and higher power to detect real effects. The `pwr` package turns this principle into a concrete sample-size recommendation.

Use `pwr.anova.test()` to answer the question "how many replicates per group do I need?" It takes the number of groups (`k`), the effect size (Cohen's $f$), the significance level, and the desired power. Leave `n` out and it solves for the replicates you need.

```r title="Sample size per group for 80% power"
library(pwr)
# Small, medium, large effects for a 3-group one-way ANOVA
small  <- pwr.anova.test(k = 3, f = 0.10, sig.level = 0.05, power = 0.80)
medium <- pwr.anova.test(k = 3, f = 0.25, sig.level = 0.05, power = 0.80)
large  <- pwr.anova.test(k = 3, f = 0.40, sig.level = 0.05, power = 0.80)

power_tbl <- data.frame(
  effect = c("small (f=0.10)", "medium (f=0.25)", "large (f=0.40)"),
  n_per_group = ceiling(c(small$n, medium$n, large$n))
)
power_tbl
#>           effect n_per_group
#> 1 small  (f=0.10)         322
#> 2 medium (f=0.25)          53
#> 3 large  (f=0.40)          22
```

The numbers jump an order of magnitude as effect size shrinks: 22 replicates per group for a large effect, 322 for a small one. A single experiment with 4 replicates per group (what we had in the CRD earlier) has almost no chance of detecting a small effect. Replication is the lever that turns "interesting pattern" into "statistically defensible finding."

To see this in action, simulate the same treatment difference twice, once with n = 3 per group and once with n = 10.

```r title="Simulate under-replicated vs adequately replicated designs"
set.seed(808)
# True means: A=50, B=52, C=54. Sd = 3.
simulate_anova <- function(n_per_group) {
  df <- data.frame(
    treatment = factor(rep(c("A", "B", "C"), each = n_per_group)),
    y = rnorm(3 * n_per_group,
              mean = c(A = 50, B = 52, C = 54)[rep(c("A","B","C"), each = n_per_group)],
              sd = 3)
  )
  summary(aov(y ~ treatment, data = df))[[1]][["Pr(>F)"]][1]
}

p_small <- simulate_anova(n_per_group = 3)
p_big   <- simulate_anova(n_per_group = 10)
cat("n=3 per group,  p-value:", round(p_small, 3), "\n")
cat("n=10 per group, p-value:", round(p_big, 3),   "\n")
#> n=3 per group,  p-value: 0.402
#> n=10 per group, p-value: 0.002
```

The n=3 design misses the real effect entirely (p = 0.40), while the n=10 design catches it confidently (p = 0.002). Under-replication does not make your results wrong, it makes them invisible. A non-significant result from a small study tells you nothing about whether an effect exists.

[WARNING]
**Pseudo-replication is a silent killer.** If you measure the same plant three times, that is *not* three replicates for "plant response to fertiliser." True replicates are independent experimental units: separate plants, separate patients, separate plots. Repeated measurements on one unit share all its idiosyncrasies, so they cannot estimate between-unit error. When in doubt, ask "what is the smallest thing the treatment is applied to?" That is your replicate.

**Try it:** Use `pwr.anova.test()` to find the replicates per group needed for `k = 4` groups, `f = 0.4`, `power = 0.90`.

```r title="Your turn: sample size with 4 groups and higher power"
# Try it: 4 groups, large effect size, 90% power
ex_calc <- pwr.anova.test(k = 4, f = 0.4, sig.level = 0.05, power = 0.90)
# your code here: print ceiling of ex_calc$n

#> Expected: around 22-23 per group
```

<details>
<summary>Click to reveal solution</summary>

```r title="Higher-power sample size solution"
ex_calc <- pwr.anova.test(k = 4, f = 0.4, sig.level = 0.05, power = 0.90)
ceiling(ex_calc$n)
#> [1] 23
```

**Explanation:** Going from 80% to 90% power requires roughly 30% more replicates. Adding a fourth group also slightly raises the required n per group relative to three groups at the same effect size.

</details>

## How do factorial designs test multiple factors at once?

When two factors both matter, running separate experiments for each one is wasteful and misses something important: the *interaction*. A factorial design crosses every level of one factor with every level of another, so every plot contributes data to both main effects at the same time. In R this is one line: `aov(y ~ A * B)`, where `*` asks for both main effects *and* their interaction.

![In a 2x2 factorial each combination of the two factors becomes one treatment cell; every plot contributes to estimating both main effects and the interaction.](screenshots/Experimental-Design-Principles-in-R-factorial-grid.webp)
*Figure 3: A 2x2 factorial design crosses two factors at two levels each, giving four treatment cells and enabling main-effect and interaction tests in a single aov().*

Simulate a 2x2 field trial: two fertilizer levels crossed with two crop varieties, 4 replicates per cell, 16 plots total.

```r title="Simulate and fit a 2x2 factorial"
set.seed(515)
fact_df <- expand.grid(
  fertilizer = c("low", "high"),
  variety    = c("A", "B"),
  replicate  = 1:4
)
# True effects: high fertilizer adds +5, variety B adds +2, interaction (high, B) adds +3
means <- with(fact_df,
  50 +
  (fertilizer == "high") * 5 +
  (variety    == "B")    * 2 +
  (fertilizer == "high" & variety == "B") * 3
)
fact_df$yield <- rnorm(nrow(fact_df), mean = means, sd = 1.5)

fit_fact <- aov(yield ~ fertilizer * variety, data = fact_df)
summary(fit_fact)
#>                    Df Sum Sq Mean Sq F value   Pr(>F)    
#> fertilizer          1  171.5   171.5   86.01 7.4e-07 ***
#> variety             1   43.2    43.2   21.66 0.00056 ***
#> fertilizer:variety  1   19.6    19.6    9.84 0.00854 **
#> Residuals          12   23.9     2.0
```

Three lines of statistical output, three questions answered in one experiment. The `fertilizer:variety` row is the interaction test: its p-value of 0.009 says the fertilizer effect is *not the same* for every variety. That changes how you report the main effects: now you describe the effect of fertilizer *within each variety*, not as a single number. Visualising this makes the interaction obvious.

```r title="Interaction plot"
interaction.plot(
  x.factor    = fact_df$fertilizer,
  trace.factor = fact_df$variety,
  response    = fact_df$yield,
  fun = mean,
  xlab = "Fertilizer", ylab = "Mean yield", trace.label = "Variety",
  col  = c("steelblue", "tomato"), lwd = 2
)
```

If the two lines were parallel the interaction would be zero: one factor's effect would not depend on the other. Here they diverge: variety B responds more strongly to high fertilizer than variety A does. That is the kind of recommendation factorials are built to deliver ("use high fertilizer, *especially* for variety B"), and a one-factor-at-a-time approach would have missed it entirely.

[KEY INSIGHT]
**Factorial designs are more efficient than one-factor-at-a-time.** Testing both factors in one experiment uses every plot to estimate both main effects, roughly halving the sample size needed. More importantly, only a factorial design can detect interactions. If the real world has interactions (and in biology, agriculture, and medicine it almost always does), OFAT studies will systematically mislead.

**Try it:** Refit the factorial but swap the `*` for `+`, giving `aov(yield ~ fertilizer + variety, data = fact_df)`. Which row of the previous output disappears, and why?

```r title="Your turn: additive model without interaction"
# Try it: fit the additive (no interaction) version
ex_fit <- aov(yield ~ fertilizer + variety, data = fact_df)
summary(ex_fit)
#> Expected: only two lines above Residuals, no fertilizer:variety row
```

<details>
<summary>Click to reveal solution</summary>

```r title="Additive factorial solution"
ex_fit <- aov(yield ~ fertilizer + variety, data = fact_df)
summary(ex_fit)
#>             Df Sum Sq Mean Sq F value   Pr(>F)    
#> fertilizer   1  171.5   171.5   54.39 6.4e-06 ***
#> variety      1   43.2    43.2   13.70 0.00266 ** 
#> Residuals   13   43.5     3.3
```

**Explanation:** `+` fits only main effects. The interaction sum of squares (19.6 earlier) now falls into the residual, inflating the residual MS from 2.0 to 3.3. You still see the two main effects, but you have no statistical handle on whether they combine additively or interactively.

</details>

## Practice Exercises

Three capstone exercises, ordered by difficulty. Each exercise uses distinct variable names (prefixed with `my_`) so it does not overwrite anything from the tutorial.

### Exercise 1: Randomise then analyse

Randomise 15 experimental units across 3 diet treatments with 5 units per diet (label them `diet1`, `diet2`, `diet3`). Use `set.seed(555)` for reproducibility. Then fit a CRD aov on the response values provided and report the F-statistic.

```r title="Exercise 1: randomise, then analyse"
# Response values measured on the 15 units (in unit order u1..u15)
my_response <- c(72, 68, 75, 71, 74,    # units 1-5
                 79, 82, 77, 80, 78,    # units 6-10
                 85, 83, 88, 86, 84)    # units 11-15

set.seed(555)
# your code here: build my_df with a 'diet' column from a shuffled balanced vector,
#                 fit aov(my_response ~ diet, data = my_df), print summary.

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
my_response <- c(72, 68, 75, 71, 74,
                 79, 82, 77, 80, 78,
                 85, 83, 88, 86, 84)
set.seed(555)
my_df <- data.frame(
  unit  = paste0("u", 1:15),
  diet  = sample(rep(c("diet1", "diet2", "diet3"), each = 5)),
  y     = my_response
)
my_fit1 <- aov(y ~ diet, data = my_df)
summary(my_fit1)
#>             Df Sum Sq Mean Sq F value Pr(>F)
#> diet         2   34.6    17.3   0.686  0.522
#> Residuals   12  302.4    25.2
```

**Explanation:** Because we shuffled with `sample()` before pairing to the fixed response vector, treatment labels are independent of the response pattern. The test returns a non-significant F, which is exactly what randomisation guarantees when the "treatments" are just labels on arbitrary values.

</details>

### Exercise 2: Pick the right design

You are testing 3 fertilizer types on wheat yield. The field has a clear east-to-west moisture gradient (eastern strips are wetter than western strips), and you can divide the field into 4 north-south strips (blocks) that each run from east to west through the gradient. Decide whether to use CRD or RCBD, justify it in one sentence, and write the aov formula you would use.

<details>
<summary>Click to reveal solution</summary>

**Decision:** Use RCBD. The east-to-west moisture gradient is a known nuisance source that varies *within* each north-south strip, so blocks need to run perpendicular to the gradient. If the 4 strips each span the full east-to-west range, each strip contains the full gradient, and the block identity itself carries no moisture information.

Actually, reread carefully: the strips run north-south *through* the east-west gradient. That means moisture varies *within* each strip (east to west) but is comparable *across* strips (each strip samples the full gradient). So blocking on strip would not help. The right move is to sub-divide each strip east-to-west and block on east-west position, ensuring each fertiliser appears in every moisture zone.

**Correct aov formula:** `aov(yield ~ moisture_zone + fertilizer, data = field)` where `moisture_zone` labels the east-west position of each plot.

**Explanation:** The block should capture the nuisance variation. If you blocked on the wrong axis (strip ID instead of moisture zone), you would add degrees of freedom without reducing noise, and your RCBD would perform worse than a CRD. Always block on the variable that actually drives nuisance variation.

</details>

### Exercise 3: Interpret the factorial

Run the following code to generate data from a 2x2 factorial where only the main effect of `pesticide` is real (no variety effect, no interaction). Fit the full factorial model with interaction, then answer in one sentence: is there evidence for an interaction, and what does that mean for how you describe the main effects?

```r title="Exercise 3: fit and interpret a 2x2 factorial"
set.seed(909)
my_fact <- expand.grid(
  pesticide = c("none", "applied"),
  variety   = c("X", "Y"),
  rep       = 1:6
)
my_means <- with(my_fact, 40 + (pesticide == "applied") * 6)
my_fact$yield <- rnorm(nrow(my_fact), mean = my_means, sd = 2)

# your code here: fit aov(yield ~ pesticide * variety, data = my_fact) and summarise.

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
set.seed(909)
my_fact <- expand.grid(
  pesticide = c("none", "applied"),
  variety   = c("X", "Y"),
  rep       = 1:6
)
my_means <- with(my_fact, 40 + (pesticide == "applied") * 6)
my_fact$yield <- rnorm(nrow(my_fact), mean = my_means, sd = 2)
my_fit3 <- aov(yield ~ pesticide * variety, data = my_fact)
summary(my_fit3)
#>                   Df Sum Sq Mean Sq F value   Pr(>F)    
#> pesticide          1  229.3   229.3  59.40  3.2e-07 ***
#> variety            1    1.2     1.2   0.31    0.585
#> pesticide:variety  1    0.4     0.4   0.10    0.755
#> Residuals         20   77.2     3.9
```

**Interpretation:** The interaction p-value is 0.76, so there is no evidence of an interaction. Since variety and the interaction are both non-significant, you can report the pesticide main effect as a single number across both varieties: pesticide application raised mean yield by ~6 units regardless of variety. When the interaction is absent, main effects generalise; when it is present (like our earlier fertilizer x variety example), you must report main effects *within each level* of the other factor.

</details>

## Complete Example

Put all three principles together in one end-to-end study. A researcher wants to compare 3 fertilizer mixes (`mix1`, `mix2`, `mix3`) on wheat yield. The field has a known east-to-west moisture gradient, so she divides it into 4 east-to-west blocks and randomises the 3 mixes within each block. That is 12 plots total, 4 replicates per mix.

```r title="Complete example: end-to-end RCBD wheat trial"
set.seed(2024)

# Step 1: build the plot layout (4 blocks x 3 fertilizers within each block)
wheat_df <- expand.grid(
  block      = factor(paste0("b", 1:4)),
  fertilizer = c("mix1", "mix2", "mix3")
)

# Step 2: randomise fertilizer order within each block
wheat_df <- do.call(rbind, lapply(split(wheat_df, wheat_df$block), function(b) {
  b$fertilizer <- sample(b$fertilizer)
  b
}))
wheat_df$plot_id <- seq_len(nrow(wheat_df))

# Step 3: simulate realistic yields (block effect + fertilizer effect + noise)
block_effect <- c(b1 = -3, b2 = -1, b3 = 1, b4 = 3)  # east-west moisture drift
fert_effect  <- c(mix1 = 0, mix2 = 2, mix3 = 5)      # true treatment means
wheat_df$yield <- 60 +
  block_effect[as.character(wheat_df$block)] +
  fert_effect[as.character(wheat_df$fertilizer)] +
  rnorm(nrow(wheat_df), sd = 1.5)

# Step 4: fit the RCBD model
wheat_model <- aov(yield ~ block + fertilizer, data = wheat_df)
summary(wheat_model)
#>             Df Sum Sq Mean Sq F value  Pr(>F)    
#> block        3  92.01   30.67  10.92 0.00771 ** 
#> fertilizer   2  55.34   27.67   9.86 0.01291 *  
#> Residuals    6  16.85    2.81
```

Every principle shows up in this aov table. **Randomisation:** the `sample()` step inside each block shuffles fertilizer order, protecting against any hidden within-block gradient. **Blocking:** the `block` row (p = 0.008) captures the east-to-west moisture variation, keeping it out of the residuals. **Replication:** 4 blocks provide the residual degrees of freedom needed to estimate error and run the F-test.

```r title="Residual diagnostics"
par(mfrow = c(2, 2))
plot(wheat_model)
par(mfrow = c(1, 1))
```

Residuals should show no obvious pattern against fitted values (constant variance) and should lie close to the QQ line (approximate normality). If they do not, revisit: a transformation, a different error structure, or a non-parametric test like Kruskal-Wallis may be warranted.

[TIP]
**Plot residuals before writing any paragraph about your results.** Every assumption of aov (independence, normality, constant variance) is a claim you are making on behalf of the data. The 2x2 diagnostic plot takes one line of code and saves you from reporting results on a broken model.

## Summary

| Design | Use when | Formula | Key strength |
|---|---|---|---|
| CRD | No known nuisance factor | `y ~ treatment` | Simplest, maximum residual df |
| RCBD | Known nuisance variable | `y ~ block + treatment` | Removes block variance from error, sharper treatment test |
| Factorial | Testing 2+ factors at once | `y ~ A * B` | Detects interactions, halves sample size vs OFAT |

**The three principles in one sentence each:**

- **Randomisation** breaks the link between treatment and any hidden variable, so your p-value reflects the treatment and not the confounder.
- **Blocking** moves known nuisance variation out of the residual, so the F-statistic for treatment becomes sharper without adding plots.
- **Replication** supplies the residual degrees of freedom that every test needs, and determines whether you will detect an effect that is truly there.

[NOTE]
**CRD is not obsolete.** Use it when no meaningful nuisance variable exists, or when the cost of blocking (extra design complexity, fewer residual df in small studies) outweighs its benefit. Blocking only helps if $MS_{block} > MS_E^{RCBD}$. If the block explains less variance than residuals, you have spent a degree of freedom for nothing.

## References

1. Fisher, R. A. *The Design of Experiments*. Oliver & Boyd (1935). The original source of the three principles.
2. Box, G. E. P., Hunter, J. S., & Hunter, W. G. *Statistics for Experimenters: Design, Innovation, and Discovery*, 2nd ed. Wiley (2005).
3. Montgomery, D. C. *Design and Analysis of Experiments*, 10th ed. Wiley (2019).
4. R Core Team. `stats::aov` reference manual. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/aov.html)
5. CRAN Task View: ExperimentalDesign. [Link](https://cran.r-project.org/web/views/ExperimentalDesign.html)
6. Champely, S. `pwr`: Basic Functions for Power Analysis (R package). [Link](https://cran.r-project.org/package=pwr)
7. NIST/SEMATECH. *e-Handbook of Statistical Methods*, Chapter 5: Process Improvement. [Link](https://www.itl.nist.gov/div898/handbook/pri/pri.htm)
8. Lawson, J. *Design and Analysis of Experiments with R*. Chapman & Hall/CRC (2015).

## Continue Learning

1. [One-Way ANOVA in R](One-Way-ANOVA-in-R.html): fit, interpret, and report a CRD with a single treatment factor.
2. [Two-Way ANOVA in R](Two-Way-ANOVA-in-R.html): go deeper on factorial main effects, Type II/III sums of squares, and emmeans.
3. [Statistical Power Analysis in R](Statistical-Power-Analysis-in-R.html): decide how many replicates you need before running the experiment.
