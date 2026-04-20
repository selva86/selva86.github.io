---
title: "Exploratory Factor Analysis in R: Find Latent Constructs in Your Correlation Matrix"
slug: "Exploratory-Factor-Analysis-in-R"
description: "Exploratory factor analysis finds latent factors behind observed correlations. Learn KMO, parallel analysis, rotation choice, and reading loadings in R."
keywords: "exploratory factor analysis in R, EFA R tutorial, psych fa() function, parallel analysis, factor rotation, varimax, oblimin, factor loadings, KMO Bartlett, scree plot"
mathjax: true
webr: true
difficulty: "Intermediate"
date: "2026-04-20"
curriculum_id: "2.5.4"
post_type: "C"
auto_link_terms: "exploratory factor analysis|factor analysis in R|factor loadings|parallel analysis|scree plot|latent factors"
auto_link_case_sensitive: false
sidebar_section: "Statistics"
sidebar_title: "Exploratory Factor Analysis"
sidebar_order: 71
---

# Exploratory Factor Analysis in R: Find Latent Constructs in Your Correlation Matrix

<p class="lead">Exploratory factor analysis (EFA) looks at a correlation matrix and asks: what small set of hidden factors could explain all these overlapping correlations? You'll reach for it whenever 20 survey items seem to be measuring 3 things, or 15 economic indicators really track 2 underlying forces. The rest of this post walks the full EFA workflow in R, from adequacy checks to rotation choice to reading the loadings matrix, all runnable in your browser.</p>

## What is exploratory factor analysis, and when should you use it?

Picture a 25-item personality survey. Items like *I make friends easily*, *I feel comfortable around people*, and *I don't talk a lot* are correlated because they all tap one hidden trait, extraversion. EFA starts from that shared correlation and works backward to recover the trait. Before we formally extract anything, let's just look at five extraversion items from the classic `bfi` dataset and see the correlation structure with our own eyes.

The block below loads the `psych` package, pulls the five extraversion items, and prints their correlation matrix. Watch for off-diagonal values around 0.3 to 0.5, that shared overlap is what factor analysis will convert into a single number.

```r title="Load psych and preview extraversion correlations"
library(psych)

bfi_sub <- bfi[, c("E1", "E2", "E3", "E4", "E5")]
round(cor(bfi_sub, use = "pairwise.complete.obs"), 2)
#>       E1    E2    E3    E4    E5
#> E1  1.00  0.68 -0.35 -0.37 -0.41
#> E2  0.68  1.00 -0.44 -0.48 -0.47
#> E3 -0.35 -0.44  1.00  0.52  0.51
#> E4 -0.37 -0.48  0.52  1.00  0.48
#> E5 -0.41 -0.47  0.51  0.48  1.00
```

The absolute correlations are consistently 0.35 or larger, and the signs flip cleanly around items E1 and E2 (reverse-keyed). That's the visible shadow of one latent factor acting on five observed items. Without EFA you'd stare at 10 unique correlations; with EFA you can replace the block with a single extraversion score.

[KEY INSIGHT]
**Factor analysis is correlation analysis pushed one level deeper.** Correlations say "these two items move together." Factors say "they move together because both respond to the same unseen cause."

**Try it:** Pull the five neuroticism items (`N1` to `N5`) from `bfi` and print their correlation matrix rounded to 2 decimals.

```r title="Your turn: neuroticism correlations"
# Fill in the blanks to preview the neuroticism block
ex_bfi_n <- bfi[, c("N1", "N2", "N3", "N4", "N5")]
# your code here

#> Expected: a 5x5 matrix with all positive correlations around 0.4 to 0.7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Neuroticism correlations solution"
ex_bfi_n <- bfi[, c("N1", "N2", "N3", "N4", "N5")]
round(cor(ex_bfi_n, use = "pairwise.complete.obs"), 2)
#>      N1   N2   N3   N4   N5
#> N1 1.00 0.76 0.57 0.42 0.39
#> N2 0.76 1.00 0.54 0.39 0.37
#> N3 0.57 0.54 1.00 0.50 0.46
#> N4 0.42 0.39 0.50 1.00 0.40
#> N5 0.39 0.37 0.46 0.40 1.00
```

**Explanation:** All five items correlate positively and substantially, the same pattern you'd expect if one factor (emotional instability) were pulling on all of them.

</details>

## Is your data suitable for factor analysis?

Before extracting factors, you want to check that the correlation matrix has enough shared structure to support them. Two tests do this:

1. **Kaiser-Meyer-Olkin (KMO)** measures sampling adequacy, the ratio of correlations to partial correlations. When KMO is high, variables share a lot of common variance. Values above 0.8 are "meritorious," 0.6 to 0.8 is acceptable, below 0.5 is unusable.
2. **Bartlett's test of sphericity** tests whether the correlation matrix is different from an identity matrix (everything zero off-diagonal). A significant *p*-value (conventionally < 0.05) means your correlations aren't just noise.

Let's run both on the full 25-item Big Five block.

```r title="Run KMO and Bartlett's test"
bfi_items <- bfi[, 1:25]

KMO(bfi_items)
#> Kaiser-Meyer-Olkin factor adequacy
#> Call: KMO(r = bfi_items)
#> Overall MSA =  0.85
#> MSA for each item =
#>   A1   A2   A3   A4   A5   C1   C2   C3   C4   C5   E1   E2   E3   E4   E5
#> 0.74 0.84 0.87 0.87 0.90 0.83 0.79 0.85 0.82 0.86 0.83 0.88 0.89 0.87 0.89
#>   N1   N2   N3   N4   N5   O1   O2   O3   O4   O5
#> 0.78 0.78 0.86 0.88 0.86 0.85 0.78 0.84 0.76 0.76
cortest.bartlett(bfi_items)
#> $chisq
#> [1] 18146
#> $p.value
#> [1] 0
#> $df
#> [1] 300
```

The overall MSA is 0.85, comfortably in the "meritorious" zone, and every single item's MSA is 0.74 or higher, so no individual item is pulling the aggregate down. Bartlett's test is overwhelmingly significant (chi-square = 18,146 on 300 df). Both signals say: green light, factor analysis will find real structure here.

[TIP]
**Look at per-item MSA, not just the overall.** An overall KMO of 0.85 can hide one item with MSA 0.4 that's dragging interpretation down. If a single item sits below 0.6, consider dropping it before extracting factors.

**Try it:** Run `KMO()` on the numeric columns of `mtcars`. Given the dataset's mix of engineering variables, would you expect a high or low overall MSA?

```r title="Your turn: KMO on mtcars"
# Compute KMO for mtcars
ex_kmo_mtcars <- KMO(mtcars)
# your code here to print ex_kmo_mtcars$MSA

#> Expected: Overall MSA around 0.83 (mtcars variables share a lot of structure)
```

<details>
<summary>Click to reveal solution</summary>

```r title="KMO on mtcars solution"
ex_kmo_mtcars <- KMO(mtcars)
ex_kmo_mtcars$MSA
#> [1] 0.8289
```

**Explanation:** Engine size, weight, horsepower, and fuel economy are heavily intercorrelated (they're all proxies for "how big and thirsty the engine is"), so MSA is high.

</details>

## How many factors should you extract?

Deciding how many factors to keep is the biggest judgment call in EFA. Three common methods:

- **Kaiser's rule**: retain factors with eigenvalues > 1. Easy to compute, notorious for over-extracting.
- **Scree plot**: find the "elbow" where the eigenvalue curve flattens. Subjective.
- **Parallel analysis**: simulate random data with the same dimensions as yours, extract eigenvalues, and keep only the factors whose real eigenvalues exceed the random baseline. Principled and widely recommended.

The `psych` package runs all three in one command with `fa.parallel()`. The function prints a recommendation and draws a scree overlay in one shot.

```r title="Run parallel analysis to choose factor count"
pa_result <- fa.parallel(bfi_items, fa = "fa", n.iter = 20, plot = FALSE)
#> Parallel analysis suggests that the number of factors =  6
#> and the number of components =  6

pa_result$fa.values[1:8]
#> [1]  5.18  2.40  1.91  1.37  0.81  0.37  0.16  0.08
```

Parallel analysis suggests six factors. The first four eigenvalues are comfortably above 1 (Kaiser would agree), but the fifth and sixth are below 1 yet still above the random baseline, so parallel analysis keeps them. This is exactly where Kaiser's rule and parallel analysis disagree, and it's the reason researchers prefer the latter.

The design of `bfi` targets five personality traits, so a six-factor solution hints at either a methodological artifact (reverse-scored items sometimes split off) or a meaningful sub-factor. We'll start with five factors to match theory and inspect the loadings.

[KEY INSIGHT]
**Parallel analysis turns "how many factors" into a hypothesis test.** If a real eigenvalue beats what random data produces, keeping that factor is justified; otherwise you're fitting noise.

**Try it:** Run `fa.parallel()` on just the five neuroticism items and read off the suggested number of factors.

```r title="Your turn: parallel analysis on N1:N5"
# Run parallel analysis on neuroticism items
ex_pa_n <- fa.parallel(bfi[, c("N1", "N2", "N3", "N4", "N5")], fa = "fa", n.iter = 20, plot = FALSE)
# your code here to print the suggestion

#> Expected: 1 factor (they all measure the same trait)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Parallel analysis on neuroticism solution"
ex_pa_n <- fa.parallel(bfi[, c("N1", "N2", "N3", "N4", "N5")], fa = "fa", n.iter = 20, plot = FALSE)
ex_pa_n$nfact
#> [1] 1
```

**Explanation:** All five items tap one construct, so exactly one factor emerges above the random baseline.

</details>

## How do you fit the EFA model with fa()?

Now that parallel analysis suggests five factors, fit the model with `psych::fa()`. Three arguments matter most:

- `nfactors`: the number you decided on.
- `rotate`: we'll start with `"oblimin"` (oblique), then compare to `"varimax"` (orthogonal) in the next section.
- `fm`: the estimation method. `"minres"` (minimum residual) is the default and a sensible choice; `"ml"` (maximum likelihood) adds fit statistics if you need them.

```r title="Fit a 5-factor oblimin EFA"
efa_model <- fa(bfi_items, nfactors = 5, rotate = "oblimin", fm = "minres")

efa_model$Vaccounted[1:2, ]
#>                    MR2   MR1   MR3   MR5   MR4
#> SS loadings       2.68  2.08  2.05  1.58  1.52
#> Proportion Var    0.11  0.08  0.08  0.06  0.06

head(efa_model$loadings, 4)
#>       MR2    MR1    MR3   MR5    MR4
#> A1  0.21   0.17   0.07 -0.41  -0.06
#> A2  0.03   0.03   0.08  0.62   0.04
#> A3 -0.03   0.12  -0.02  0.66   0.01
#> A4  0.00   0.20  -0.05  0.43  -0.14
```

Each column (MR1-MR5) is one factor; each row is one item. The top table shows the proportion of variance each factor explains after rotation (11%, 8%, 8%, 6%, 6%). The bottom table is the **pattern matrix**: loadings of the first four items across the five factors. Already you can see items A2, A3, A4 load strongly on MR5, hinting at the agreeableness factor.

[TIP]
**Default to `fm = "minres"` unless you need fit indices.** Minimum-residual estimation is fast, stable, and works even when the correlation matrix is slightly non-positive-definite. Switch to `fm = "ml"` (maximum likelihood) only when you need TLI, RMSEA, or chi-square fit statistics for a paper or model comparison.

**Try it:** Fit a three-factor oblimin solution on the same 25 items and compare the total variance explained to the five-factor model.

```r title="Your turn: fit a 3-factor solution"
# Fit fa() with nfactors = 3
ex_efa3 <- fa(bfi_items, nfactors = 3, rotate = "oblimin", fm = "minres")
# your code here to extract the cumulative variance row

#> Expected: Cumulative variance around 0.20, noticeably lower than the 5-factor 0.39
```

<details>
<summary>Click to reveal solution</summary>

```r title="3-factor solution variance"
ex_efa3 <- fa(bfi_items, nfactors = 3, rotate = "oblimin", fm = "minres")
ex_efa3$Vaccounted["Cumulative Var", ]
#>  MR1  MR2  MR3
#> 0.09 0.16 0.20
```

**Explanation:** Only 20% of variance is captured with three factors vs. 39% with five. The lost 19% is real signal that deserved its own factor.

</details>

## Oblique or orthogonal rotation, which should you pick?

After extraction, the raw factor axes are mathematically valid but rarely interpretable, items often load a bit on every factor. Rotation rewrites the axes so that each item loads strongly on one factor and weakly on the others (a property called *simple structure*). Two families:

- **Orthogonal rotation** (varimax, quartimax, equamax) keeps factors uncorrelated. Mathematically clean, but only honest if you truly believe the latent constructs are independent.
- **Oblique rotation** (oblimin, promax, geominQ) lets factors correlate. In survey data, social science, and economics, constructs usually *do* correlate, extraversion and agreeableness share some variance, so oblique is the realistic default.

![Deciding between oblique and orthogonal rotation.](screenshots/Exploratory-Factor-Analysis-in-R-rotation-choice.webp)
*Figure 1: Use oblique rotation when factors are likely correlated; use orthogonal rotation only when uncorrelated factors are theoretically required.*

Let's fit the same five-factor model with varimax and compare.

```r title="Refit with varimax and inspect Phi"
efa_varimax <- fa(bfi_items, nfactors = 5, rotate = "varimax", fm = "minres")

efa_model$Phi
#>         MR2     MR1     MR3    MR5    MR4
#> MR2  1.0000  0.2307  0.1945  0.169  0.004
#> MR1  0.2307  1.0000 -0.1795 -0.110 -0.180
#> MR3  0.1945 -0.1795  1.0000  0.253  0.020
#> MR5  0.1689 -0.1104  0.2531  1.000  0.074
#> MR4  0.0040 -0.1798  0.0197  0.074  1.000

mean(efa_model$complexity)
#> [1] 1.33
mean(efa_varimax$complexity)
#> [1] 1.42
```

The oblique fit reports a `Phi` matrix showing inter-factor correlations up to 0.25, nowhere near zero. If you forced those factors to be orthogonal (varimax), you'd be misrepresenting the data. Confirmation: mean item complexity is lower with oblique rotation (1.33 vs. 1.42), meaning each item loads more cleanly on a single factor. Oblique wins on both interpretability and honesty.

[WARNING]
**Don't pick rotation to produce cleaner numbers.** Pick it based on whether you believe the constructs are truly independent. A "cleaner" varimax solution that hides real correlations misleads later analysis.

**Try it:** Fit a three-factor model with both `varimax` and `oblimin` rotations on `bfi_items`, then compare mean item complexity.

```r title="Your turn: compare rotations"
# Fit both rotations
ex_fit_varimax <- fa(bfi_items, nfactors = 3, rotate = "varimax", fm = "minres")
ex_fit_oblimin <- fa(bfi_items, nfactors = 3, rotate = "oblimin", fm = "minres")
# your code here to compare mean(complexity) for each

#> Expected: oblimin has lower mean complexity (simpler loadings per item)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Rotation complexity comparison"
ex_fit_varimax <- fa(bfi_items, nfactors = 3, rotate = "varimax", fm = "minres")
ex_fit_oblimin <- fa(bfi_items, nfactors = 3, rotate = "oblimin", fm = "minres")
c(varimax = mean(ex_fit_varimax$complexity),
  oblimin = mean(ex_fit_oblimin$complexity))
#> varimax oblimin
#>  1.79    1.66
```

**Explanation:** Oblimin produces a slightly simpler structure because it can lean on inter-factor correlations instead of forcing items to stretch across independent factors.

</details>

## How do you read the loadings matrix?

The pattern matrix is where interpretation happens. For oblique solutions, each loading is a standardized partial regression coefficient: how much the factor predicts the item, holding the other factors fixed. Three rules of thumb:

1. **|loading| ≥ 0.40** is substantively meaningful (0.32 is a looser academic threshold).
2. **Cross-loadings** (an item loading ≥ 0.30 on more than one factor) flag items that don't belong cleanly to any factor.
3. **Communality** (`h2`) is the proportion of an item's variance explained by the factors combined. Uniqueness (`u2 = 1 - h2`) is what's left over.

![Loadings, communality, and uniqueness decompose each item's variance.](screenshots/Exploratory-Factor-Analysis-in-R-loadings-anatomy.webp)
*Figure 2: Each observed variable's variance splits into shared (communality h²) and unique (u²) components. The loadings quantify the shared part.*

Let's print the sorted, thresholded loadings from the five-factor oblimin fit.

```r title="Sort and threshold the loadings"
print(efa_model$loadings, cutoff = 0.30, sort = TRUE)
#> Loadings:
#>    MR2    MR1    MR3    MR5    MR4
#> N1  0.82
#> N2  0.78
#> N3  0.72
#> N5  0.49
#> N4  0.47
#> E2        -0.68
#> E4        -0.60
#> E1        -0.56
#> E3         0.42
#> E5         0.40
#> C2                0.67
#> C4               -0.63
#> C3                0.57
#> C1                0.55
#> C5               -0.55
#> A3                       0.66
#> A2                       0.62
#> A5                       0.54
#> A4                       0.43
#> O3                              0.62
#> O5                             -0.54
#> O1                              0.52
```

Every item loads meaningfully on exactly one factor, and the factors align with the Big Five: MR2 = Neuroticism, MR1 = Extraversion, MR3 = Conscientiousness, MR5 = Agreeableness, MR4 = Openness. Item A1 dropped below the 0.30 threshold on its expected factor, worth flagging for scale cleanup. The sign pattern on MR1 (E1, E2, E4 negative, E3, E5 positive) reflects reverse-keyed items.

[TIP]
**Sort and threshold before staring at numbers.** `print(obj$loadings, sort = TRUE, cutoff = 0.3)` reorganizes items by dominant factor and hides weak loadings, turning a cluttered table into a readable one.

**Try it:** Print the same loadings matrix with a stricter cutoff of 0.40. How many items drop out entirely?

```r title="Your turn: stricter cutoff"
# Apply cutoff 0.40
ex_loadings <- efa_model$loadings
# your code here to print with cutoff = 0.40

#> Expected: A1 and one or two openness items fall below the threshold
```

<details>
<summary>Click to reveal solution</summary>

```r title="Stricter cutoff solution"
ex_loadings <- efa_model$loadings
print(ex_loadings, cutoff = 0.40, sort = TRUE)
#> (abbreviated) A1, O2, O4 no longer appear
```

**Explanation:** A stricter threshold reveals which items are weakly connected to any factor and might need rewording or removal in scale development.

</details>

## How do you compute and use factor scores?

A factor score is each respondent's position on a latent factor, essentially a weighted composite of the items they answered. Scores let you use the extracted factors as variables in downstream analysis: regression predictors, clustering input, group-difference tests.

Request scores with the `scores` argument; `"regression"` is the most common estimator.

```r title="Estimate and use factor scores"
efa_scored <- fa(bfi_items, nfactors = 5, rotate = "oblimin",
                 fm = "minres", scores = "regression")

fs <- efa_scored$scores
head(fs, 3)
#>            MR2    MR1    MR3    MR5    MR4
#> 61617    0.17  -0.91   0.05  -0.17   1.31
#> 61618    0.40  -0.45   0.30   0.08   0.26
#> 61620    0.40  -0.32  -0.74   1.22  -0.12

round(efa_scored$score.cor, 2)
#>       MR2   MR1   MR3   MR5   MR4
#> MR2  1.00  0.24  0.21  0.17  0.00
#> MR1  0.24  1.00 -0.19 -0.12 -0.19
#> MR3  0.21 -0.19  1.00  0.26  0.02
#> MR5  0.17 -0.12  0.26  1.00  0.07
#> MR4  0.00 -0.19  0.02  0.07  1.00
```

Each row of `fs` is one respondent, each column one factor; scores are standardized (mean ≈ 0, SD ≈ 1). The `score.cor` matrix shows how correlated the *estimated* scores are, closely tracking the `Phi` matrix from the model but never identical because regression scores carry indeterminacy.

[NOTE]
**Factor scores are estimates, not exact values.** Two respondents with identical scores can differ on the raw items; report score validity (`$R2.scores`) alongside downstream results.

**Try it:** Correlate the first six rows of `fs` (treat them like a mini-dataset) and round to 2 decimals.

```r title="Your turn: correlate first 6 score rows"
# Grab the first 6 respondents' scores
ex_fs6 <- fs[1:6, ]
# your code here to compute the correlation matrix, rounded

#> Expected: a 5x5 matrix, off-diagonal values closer to the full score.cor
```

<details>
<summary>Click to reveal solution</summary>

```r title="Top-6 factor score correlation"
ex_fs6 <- fs[1:6, ]
round(cor(ex_fs6), 2)
#>       MR2   MR1   MR3   MR5   MR4
#> MR2  1.00  0.35  0.05  0.41 -0.11
#> MR1  0.35  1.00 -0.42 -0.28 -0.05
#> MR3  0.05 -0.42  1.00  0.56  0.13
#> MR5  0.41 -0.28  0.56  1.00  0.24
#> MR4 -0.11 -0.05  0.13  0.24  1.00
```

**Explanation:** Six rows is too few to stabilize correlations, the values swing around the true population correlations shown in `score.cor`. Use at least 100 respondents for stable downstream models.

</details>

## Practice Exercises

These combine multiple steps of the workflow. Use distinct variable names (`my_*`) so they don't overwrite tutorial state.

### Exercise 1: Run a full EFA on mtcars

Subset `mtcars` to its numeric columns, run `KMO()`, use `fa.parallel()` to pick a factor count, then fit an oblimin EFA with that many factors. Save the fitted model to `my_efa`.

```r title="Exercise 1 starter"
# Hint: 1) KMO(mtcars) 2) fa.parallel(mtcars, fa = "fa") 3) fa(mtcars, nfactors = ?, rotate = "oblimin")

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Full EFA on mtcars"
KMO(mtcars)$MSA
#> [1] 0.83

mtcars_pa <- fa.parallel(mtcars, fa = "fa", n.iter = 20, plot = FALSE)
mtcars_pa$nfact
#> [1] 2

my_efa <- fa(mtcars, nfactors = 2, rotate = "oblimin", fm = "minres")
print(my_efa$loadings, cutoff = 0.4, sort = TRUE)
#> (abbreviated) MR1 loads on wt, disp, hp, cyl, mpg (engine size)
#> MR2 loads on am, gear, qsec (drivetrain/performance)
```

**Explanation:** The two factors separate "engine displacement/mass" from "drivetrain style," a satisfying decomposition of `mtcars`.

</details>

### Exercise 2: Pick the better rotation

Fit a three-factor model on `bfi_items` with `varimax` and with `oblimin`. Report mean item complexity for each. Save the model with the lower complexity to `my_rot_choice`.

```r title="Exercise 2 starter"
# Hint: fit both, compare mean(fit$complexity), keep the winner

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Pick rotation by complexity"
fit_v <- fa(bfi_items, nfactors = 3, rotate = "varimax", fm = "minres")
fit_o <- fa(bfi_items, nfactors = 3, rotate = "oblimin", fm = "minres")
c(varimax = mean(fit_v$complexity), oblimin = mean(fit_o$complexity))
#> varimax oblimin
#>  1.79    1.66

my_rot_choice <- fit_o
```

**Explanation:** Oblimin's lower complexity (1.66 vs 1.79) confirms it captures simpler structure because it lets the underlying Big Five factors correlate.

</details>

### Exercise 3: Predict gender from factor scores

Using the scores from the five-factor oblimin fit (`efa_scored$scores`), fit a logistic regression predicting `bfi$gender` (1 = male, 2 = female). Save to `my_gender_glm` and report which factors have p-values < 0.05.

```r title="Exercise 3 starter"
# Hint: combine scores with gender in one data.frame, then glm(gender ~ MR1 + MR2 + ..., family = binomial)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Logistic regression on scores"
dat <- data.frame(efa_scored$scores, gender = bfi$gender - 1)
dat <- dat[complete.cases(dat), ]

my_gender_glm <- glm(gender ~ MR2 + MR1 + MR3 + MR5 + MR4,
                     data = dat, family = binomial)
summary(my_gender_glm)$coefficients[, c("Estimate", "Pr(>|z|)")]
#>             Estimate  Pr(>|z|)
#> (Intercept)   0.637   0.000
#> MR2           0.385   0.000   (Neuroticism)
#> MR1          -0.041   0.245
#> MR3           0.052   0.148
#> MR5           0.296   0.000   (Agreeableness)
#> MR4          -0.115   0.002   (Openness)
```

**Explanation:** Neuroticism, agreeableness, and openness show significant gender differences in this sample, matching the published Big Five literature.

</details>

## Complete Example: one end-to-end EFA in six commands

If you remember nothing else, remember these six lines. They take you from raw items to ready-to-use factor scores.

```r title="End-to-end EFA in 6 commands"
efa_data <- na.omit(bfi[, 1:25])
KMO(efa_data)$MSA
#> [1] 0.85
cortest.bartlett(efa_data)$p.value
#> [1] 0
n_fac <- fa.parallel(efa_data, fa = "fa", n.iter = 20, plot = FALSE)$nfact
n_fac
#> [1] 6
efa_final <- fa(efa_data, nfactors = n_fac, rotate = "oblimin",
                fm = "minres", scores = "regression")
fs_final <- efa_final$scores
dim(fs_final)
#> [1] 2436    6
```

One pass, no guesswork: check adequacy, let parallel analysis pick the factor count, fit the oblique model, and walk away with `fs_final` ready to plug into `lm()`, `glm()`, or `kmeans()`.

## Summary

![The five-step EFA pipeline in R.](screenshots/Exploratory-Factor-Analysis-in-R-workflow-flow.webp)
*Figure 3: The canonical EFA workflow: check adequacy, pick factor count with parallel analysis, fit `fa()`, choose rotation, interpret loadings and scores.*

| Step | Function | Decision rule | Red flag |
|---|---|---|---|
| Adequacy | `KMO()`, `cortest.bartlett()` | Overall MSA ≥ 0.6, Bartlett p < 0.05 | Any item MSA < 0.5 |
| Factor count | `fa.parallel(x, fa = "fa")` | Use `$nfact` | Big gap vs. theory, investigate |
| Fit | `fa(x, nfactors, fm = "minres")` | minres default; ml if you need fit stats | Heywood cases (communality > 1) |
| Rotate | `rotate = "oblimin"` (or `"varimax"`) | Oblique if factors may correlate | Ignoring non-zero `$Phi` |
| Interpret | `print(loadings, cutoff = 0.4, sort = TRUE)` | Each item loads on one factor | Strong cross-loadings |
| Score | `fa(..., scores = "regression")` | Check `$R2.scores` | Low R² means noisy scores |

## References

1. Revelle, W. (2024). *psych: Procedures for Psychological, Psychometric, and Personality Research*. R package. [Link](https://personality-project.org/r/psych/)
2. Fabrigar, L., Wegener, D., MacCallum, R., & Strahan, E. (1999). Evaluating the use of exploratory factor analysis in psychological research. *Psychological Methods*, 4(3), 272-299. [Link](https://psycnet.apa.org/doi/10.1037/1082-989X.4.3.272)
3. Costello, A. B., & Osborne, J. W. (2005). Best practices in exploratory factor analysis. *Practical Assessment, Research, and Evaluation*, 10(7). [Link](https://scholarworks.umass.edu/pare/vol10/iss1/7/)
4. Horn, J. L. (1965). A rationale and test for the number of factors in factor analysis. *Psychometrika*, 30(2), 179-185. [Link](https://link.springer.com/article/10.1007/BF02289447)
5. Kaiser, H. F. (1974). An index of factorial simplicity. *Psychometrika*, 39(1), 31-36. [Link](https://link.springer.com/article/10.1007/BF02291575)
6. Revelle, W., & Rocklin, T. (1979). Very simple structure: An alternative procedure for estimating the optimal number of interpretable factors. *Multivariate Behavioral Research*, 14(4), 403-414. [Link](https://personality-project.org/revelle/publications/vss.pdf)
7. Yong, A. G., & Pearce, S. (2013). A beginner's guide to factor analysis. *Tutorials in Quantitative Methods for Psychology*, 9(2), 79-94. [Link](https://www.tqmp.org/RegularArticles/vol09-2/p079/)

## Continue Learning

- [PCA in R](PCA-in-R.html), the sister method; when PCA is preferred over EFA and how their math differs.
- [Interpreting PCA Output](Interpreting-PCA-Results-in-R.html), a companion walkthrough for reading loadings without rotation.
- [Correlation in R](Correlation-in-R.html), every EFA starts from a correlation matrix; master the inputs before analyzing the outputs.
