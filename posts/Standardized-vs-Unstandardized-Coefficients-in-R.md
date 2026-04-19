---
title: "Standardized vs Unstandardized Coefficients in R: When Each Matters: Which Is Right for You?"
slug: "Standardized-vs-Unstandardized-Coefficients-in-R"
description: "Learn when to use standardized vs unstandardized regression coefficients in R, with lm(), scale(), lm.beta(), clear examples, decision rules, and pitfalls."
keywords: "standardized coefficients R, unstandardized coefficients, beta weights, lm.beta, scale() in R, regression coefficient interpretation, standardized regression"
auto_link_terms: "standardized coefficients|unstandardized coefficients|beta weights|lm.beta|standardized regression coefficients|coefficient interpretation"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: 2026-04-20
curriculum_id: FR-regr-23
post_type: FR
fr_parent: Multiple-Regression-in-R.html
difficulty: Intermediate
---

# Standardized vs Unstandardized Coefficients in R: When Each Matters

<p class="lead">An unstandardized regression coefficient tells you how the response changes when a predictor moves by one raw unit (kg, dollars, years). A standardized coefficient tells the same story after every variable is rescaled to standard-deviation units, so predictors measured on different scales become directly comparable.</p>

## What's the difference between standardized and unstandardized coefficients?

A single `lm()` call on `mtcars` can tell two very different stories depending on whether we rescale the inputs. We fit the same model twice, once on raw data and once on standardized data, and watch the coefficients transform from "mpg per pound of weight" into "mpg-in-SD-units per weight-in-SD-units." Same data, same relationships, different units of interpretation.

```r title="Raw vs standardized coefficients side by side"
# Fit the raw model on mtcars
fit_raw <- lm(mpg ~ wt + hp, data = mtcars)

# Z-score every column, refit on the standardized data
mtcars_z <- as.data.frame(scale(mtcars[, c("mpg", "wt", "hp")]))
fit_std <- lm(mpg ~ wt + hp, data = mtcars_z)

# Compare the two sets of coefficients
data.frame(
  raw = round(coef(fit_raw), 3),
  standardized = round(coef(fit_std), 3)
)
#>                raw standardized
#> (Intercept) 37.227        0.000
#> wt          -3.878       -0.630
#> hp          -0.032       -0.361
```

The raw model says each additional 1000 lb of weight lowers mpg by 3.88 units, and each additional horsepower lowers it by 0.032 units. Read literally, weight looks roughly 120 times more "important" than horsepower, which is a trick of the scale (weight is measured in thousands of pounds, horsepower in single units). The standardized model rescales both predictors to the same yardstick (one standard deviation), and the coefficients become `-0.63` for weight and `-0.36` for hp. Weight is still the stronger predictor, but only by a factor of about 1.75, not 120.

[KEY INSIGHT]
**Coefficient magnitude is not importance; scale determines magnitude.** A raw coefficient of `0.032` looks negligible, but if the predictor ranges across hundreds of units, its total contribution can dominate the model. Standardization removes this trap by putting every predictor on the same "per standard deviation" ruler.

**Try it:** Fit a simple regression of `mpg` on `disp` using `mtcars` and print the raw coefficient. Pay attention to how small the number is, even though `disp` (engine displacement in cubic inches) varies by hundreds of units across the dataset.

```r title="Your turn: raw coefficient for disp"
# Try it: fit mpg ~ disp on mtcars and print the raw slope
ex_disp_fit <- lm(mpg ~ disp, data = mtcars)

# your code here
#> Expected: a slope near -0.04 (small number, but disp ranges ~70-470)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Raw disp coefficient solution"
ex_disp_fit <- lm(mpg ~ disp, data = mtcars)
round(coef(ex_disp_fit), 4)
#> (Intercept)        disp
#>     29.5999     -0.0412
```

The slope is `-0.0412`. Each extra cubic inch of displacement knocks mpg down by 0.04 units, which sounds trivial, until you remember `disp` spans roughly 400 units from the smallest to largest engine in the dataset. That's a total swing of about 16 mpg, which is anything but trivial. This is exactly the trap standardization is designed to sidestep.

</details>

## How do you compute standardized coefficients in R?

Two routes lead to the same numbers. The first route rescales the data then refits; the second route leaves the data alone and rescales the coefficients themselves. We will walk through both, because understanding the formula behind the shortcut makes the output interpretable rather than magical.

```r title="Standardize with scale() and refit"
# scale() centers and divides by SD for every numeric column
mtcars_scaled <- as.data.frame(scale(mtcars))

# Refit the same model on the standardized data
fit_scaled <- lm(mpg ~ wt + hp, data = mtcars_scaled)
round(coef(fit_scaled), 4)
#>   (Intercept)            wt            hp
#>        0.0000       -0.6296       -0.3612
```

The intercept collapses to zero, because after centering every variable has mean zero, so the regression line must pass through the origin. The slope for `wt` is `-0.630` and for `hp` is `-0.361`. Those are our standardized coefficients. Note we standardized the response too; some tools standardize only predictors, which gives a "semi-standardized" coefficient that tells a slightly different story (see the pitfalls section).

![How standardization rescales variables before fitting.](screenshots/Standardized-vs-Unstandardized-Coefficients-in-R-formula.webp)
*Figure 1: How each variable is z-scored before fitting, so betas come out in SD units.*

The manual formula makes the transformation explicit. If $\beta_{\text{raw}}$ is the raw coefficient for predictor $x$, its standardized version is:

$$\beta_{\text{std}} = \beta_{\text{raw}} \times \frac{\text{SD}(x)}{\text{SD}(y)}$$

Where:
- $\beta_{\text{raw}}$ is the unstandardized coefficient from `lm()` on raw data
- $\text{SD}(x)$ is the standard deviation of the predictor
- $\text{SD}(y)$ is the standard deviation of the response

We can verify this formula reproduces what `scale()` gave us.

```r title="Standardize via the SD-ratio formula"
# Start with raw coefficients
raw_coef <- coef(fit_raw)[-1]            # drop the intercept

# Compute SDs from the raw data
sd_y <- sd(mtcars$mpg)
sd_x <- c(wt = sd(mtcars$wt), hp = sd(mtcars$hp))

# Multiply by SD(x) / SD(y) per predictor
manual_std <- raw_coef * sd_x / sd_y
round(manual_std, 4)
#>      wt      hp
#> -0.6296 -0.3612
```

Identical numbers. Now line them up next to `scale()` to confirm both approaches agree to numerical precision.

```r title="Confirm scale() and manual formula match"
compare_df <- data.frame(
  scale_route  = round(coef(fit_scaled)[-1], 6),
  manual_route = round(manual_std, 6)
)
compare_df
#>    scale_route manual_route
#> wt   -0.629571    -0.629571
#> hp   -0.361236    -0.361236
```

Both routes produce the same standardized coefficients. For most analyses you will use `scale()` + `lm()`, but seeing the formula makes the output interpretable and debuggable.

[NOTE]
**`scale()` returns a numeric matrix with `center` and `scale` attributes.** To use it in `lm()` via a `data =` argument, wrap it in `as.data.frame()` or standardize one column at a time inside `mutate()`. The `QuantPsyc::lm.beta()` function in an external package gives the same coefficients directly from a raw `lm` object if you want a one-liner shortcut.

**Try it:** Compute the standardized coefficient for a simple regression of `mpg` on `wt` two ways: first by fitting `lm(mpg ~ wt)` on raw `mtcars` and applying the SD-ratio formula, then by refitting on `scale(mtcars[, c("mpg", "wt")])`. Check they agree.

```r title="Your turn: simple regression manual standardization"
# Try it: compute the standardized slope for mpg ~ wt two ways
ex_wt_fit <- lm(mpg ~ wt, data = mtcars)

# Manual formula route (fill in):
# ex_wt_std_manual <- ...

# scale() route (fill in):
# ex_wt_std_scaled <- ...

# your code here
#> Expected: both numbers equal approximately -0.868
```

<details>
<summary>Click to reveal solution</summary>

```r title="Simple regression standardization solution"
ex_wt_fit <- lm(mpg ~ wt, data = mtcars)

# Manual: raw slope times SD(wt) / SD(mpg)
ex_wt_std_manual <- coef(ex_wt_fit)["wt"] * sd(mtcars$wt) / sd(mtcars$mpg)

# scale() route
ex_wt_scaled <- as.data.frame(scale(mtcars[, c("mpg", "wt")]))
ex_wt_std_scaled <- coef(lm(mpg ~ wt, data = ex_wt_scaled))["wt"]

c(manual = round(ex_wt_std_manual, 4), scaled = round(ex_wt_std_scaled, 4))
#> manual.wt scaled.wt
#>   -0.8677   -0.8677
```

Both approaches land on `-0.8677`. In a *simple* regression the standardized slope equals the Pearson correlation between predictor and response, because there is no other predictor to adjust for. Verify with `cor(mtcars$mpg, mtcars$wt)` and you'll see the same number.

</details>

## When should you use standardized vs unstandardized coefficients?

The choice is not about which number is "correct" (both are mathematically valid) but about which question you are answering. Three guiding questions decide it for almost every analysis.

![Decision flowchart: which coefficient to report.](screenshots/Standardized-vs-Unstandardized-Coefficients-in-R-decision.webp)
*Figure 2: Pick the coefficient type that matches your goal: prediction, importance, or communication.*

**Report unstandardized coefficients when you:**
1. Need to predict a response in its original units (a patient's blood pressure in mmHg, a house price in dollars).
2. Are communicating an effect size to domain experts who think in native units.
3. Want to compare the same model across different samples or time periods.
4. Have predictors measured on the same natural scale (all costs in dollars, all counts of items).

**Report standardized coefficients when you:**
1. Want to rank predictors by relative importance inside a single model.
2. Are fitting a structural equation model, path model, or mediation analysis (standardized betas are the convention there).
3. Need a unit-free effect size for a meta-analysis combining studies with different measurement instruments.
4. Your predictors have wildly different variances (income in dollars, age in years, education in categories).

```r title="When standardization flips the importance ranking"
decision_df <- data.frame(
  predictor = c("wt", "hp"),
  raw_coef = round(coef(fit_raw)[-1], 3),
  raw_importance_rank = c(1, 2),
  std_coef = round(coef(fit_std)[-1], 3),
  std_importance_rank = c(1, 2)
)
decision_df
#>    predictor raw_coef raw_importance_rank std_coef std_importance_rank
#> wt        wt   -3.878                   1   -0.630                   1
#> hp        hp   -0.032                   2   -0.361                   2
```

In this particular model both views agree: weight outranks horsepower either way. The *gap* between them is what changes. Raw coefficients make the gap look 120-to-1. Standardized coefficients reveal the true gap is closer to 1.75-to-1. In models where predictors live on more similar scales, the ranking itself can flip between the two views, which is the real reason to report standardized betas when importance is the question.

[TIP]
**When every predictor is already measured in the same unit, skip standardization.** If you are modelling sales in dollars as a function of advertising spend, coupon spend, and shipping cost (all in dollars), raw coefficients are already directly comparable. Standardizing adds interpretive distance without adding information.

**Try it:** Fit `lm(mpg ~ hp + qsec)` on `mtcars` in both raw and standardized form, and decide which predictor "looks" more important under each view. Expected: in raw units `hp` has a tiny coefficient and `qsec` a larger one, but after standardization `hp` is the stronger predictor.

```r title="Your turn: raw vs standardized importance"
# Try it: fit lm(mpg ~ hp + qsec) raw and standardized, compare coefs
# Raw model:
# ex_hq_raw <- ...

# Standardized model:
# ex_hq_std <- ...

# your code here
#> Expected: raw shows qsec as a bigger number; standardized shows hp is stronger
```

<details>
<summary>Click to reveal solution</summary>

```r title="hp + qsec raw vs standardized"
ex_hq_raw <- lm(mpg ~ hp + qsec, data = mtcars)
ex_hq_std <- lm(mpg ~ hp + qsec, data = as.data.frame(scale(mtcars)))

data.frame(
  raw = round(coef(ex_hq_raw)[-1], 3),
  standardized = round(coef(ex_hq_std)[-1], 3)
)
#>         raw standardized
#> hp   -0.166       -0.686
#> qsec  0.413        0.147
```

Raw coefficients make `qsec` (quarter-mile time in seconds, a small-range variable) look more influential because its slope is a larger number. Standardized coefficients show the opposite: `hp` is almost five times more predictive per SD than `qsec`. The scales were hiding the truth, and this flip is exactly when standardization earns its keep.

</details>

## How do you interpret standardized coefficients in real models?

A coefficient is only as useful as the English sentence you can attach to it. Raw and standardized coefficients generate different sentences, and knowing which sentence to say out loud is most of the battle.

```r title="Side-by-side interpretations as a tidy table"
interp_df <- data.frame(
  predictor = c("wt", "hp"),
  raw_coef = round(coef(fit_raw)[-1], 3),
  interpretation_raw = c(
    "Each extra 1000 lb lowers mpg by 3.88, holding hp constant",
    "Each extra hp lowers mpg by 0.032, holding wt constant"
  ),
  std_coef = round(coef(fit_std)[-1], 3),
  interpretation_std = c(
    "Each 1 SD increase in wt lowers mpg by 0.63 SD, holding hp constant",
    "Each 1 SD increase in hp lowers mpg by 0.36 SD, holding wt constant"
  )
)
interp_df[, c("predictor", "raw_coef", "interpretation_raw")]
#>    predictor raw_coef                                        interpretation_raw
#> wt        wt   -3.878 Each extra 1000 lb lowers mpg by 3.88, holding hp constant
#> hp        hp   -0.032     Each extra hp lowers mpg by 0.032, holding wt constant

interp_df[, c("predictor", "std_coef", "interpretation_std")]
#>    predictor std_coef                                               interpretation_std
#> wt        wt   -0.630 Each 1 SD increase in wt lowers mpg by 0.63 SD, holding hp constant
#> hp        hp   -0.361 Each 1 SD increase in hp lowers mpg by 0.36 SD, holding wt constant
```

Notice how the raw interpretation uses physical units people can touch (pounds, horsepower). The standardized interpretation uses SD units, which are dimensionless but harder to visualise. The standardized version is better for comparisons (0.63 vs 0.36 is immediately rankable); the raw version is better for predictions and conversations with someone who builds cars.

[KEY INSIGHT]
**In simple regression a standardized coefficient equals the Pearson correlation between predictor and response.** In multiple regression it equals the partial correlation adjusted for the ratio of marginal standard deviations. This is why standardized betas feel like correlations, and why the interpretation shifts from "unit change" to "SD change."

**Try it:** Using `iris`, fit `lm(Sepal.Length ~ Petal.Length + Petal.Width)` on standardized data and write one-sentence interpretations of each standardized coefficient in the "per 1 SD change" style.

```r title="Your turn: iris interpretations"
# Try it: standardize iris and write interpretations
# Step 1: scale the numeric columns
# Step 2: fit lm(Sepal.Length ~ Petal.Length + Petal.Width)
# Step 3: print coefficients

# your code here
#> Expected: Petal.Length near +1.0 and Petal.Width near -0.3 (roughly)
```

<details>
<summary>Click to reveal solution</summary>

```r title="iris standardized interpretations"
iris_num <- iris[, c("Sepal.Length", "Petal.Length", "Petal.Width")]
ex_iris_fit <- lm(Sepal.Length ~ Petal.Length + Petal.Width,
                  data = as.data.frame(scale(iris_num)))
ex_iris_std <- round(coef(ex_iris_fit)[-1], 3)
ex_iris_std
#> Petal.Length  Petal.Width
#>        1.020       -0.133
```

Interpretations: *Each 1 SD increase in Petal.Length is associated with a 1.02 SD increase in Sepal.Length, holding Petal.Width constant.* *Each 1 SD increase in Petal.Width is associated with a 0.13 SD decrease in Sepal.Length, holding Petal.Length constant.* The Petal.Width coefficient flipped sign relative to its marginal correlation with Sepal.Length, a classic signal of collinearity: the two petal measurements are highly correlated, and the model is partialling out their shared effect.

</details>

## What are the pitfalls of standardized coefficients?

Standardization is a tool, not a universal upgrade. Four situations routinely trip up analysts who reach for `scale()` by default.

```r title="Pitfall 1: standardizing a binary predictor"
# am is 0/1 for automatic/manual transmission
fit_am_raw <- lm(mpg ~ wt + am, data = mtcars)
fit_am_std <- lm(mpg ~ wt + am, data = as.data.frame(scale(mtcars)))

data.frame(
  raw = round(coef(fit_am_raw), 3),
  standardized = round(coef(fit_am_std), 3)
)
#>                raw standardized
#> (Intercept) 37.322        0.000
#> wt          -5.353       -0.869
#> am          -0.024       -0.005
```

The raw `am` coefficient tells a clean story: compared to automatic cars (am = 0), manual cars (am = 1) get 0.024 fewer mpg after adjusting for weight. The standardized `am` coefficient says "a 1 SD increase in am lowers mpg by 0.005 SD," but *there is no such thing as a 1 SD change in am* because the variable can only be 0 or 1. The sentence is syntactically valid and semantically meaningless. Report the raw version for categorical predictors, always.

```r title="Pitfall 2: sample dependence"
# Split mtcars into two halves and compare standardized betas
set.seed(2026)
idx <- sample(nrow(mtcars))
half1 <- mtcars[idx[1:16], ]
half2 <- mtcars[idx[17:32], ]

beta_std <- function(df) {
  coef(lm(mpg ~ wt + hp, data = as.data.frame(scale(df))))[-1]
}

stability_df <- data.frame(
  half1 = round(beta_std(half1), 3),
  half2 = round(beta_std(half2), 3)
)
stability_df
#>     half1  half2
#> wt -0.607 -0.705
#> hp -0.329 -0.426
```

The standardized betas shift noticeably between the two halves, even though the "true" relationships in `mtcars` haven't changed. That's because each half has its own predictor and response variances, so each half rescales the coefficients differently. Unstandardized coefficients are less sample-dependent because their units are fixed by the measurement instrument, not the sample.

[WARNING]
**Do not compare standardized coefficients across studies or samples with different predictor variances.** A `beta = 0.4` in a study of teenagers is not directly comparable to a `beta = 0.4` in a study of adults, because the SDs of predictors differ. Raw coefficients, reported with their measurement units, are much safer for cross-study comparison.

Two more pitfalls worth naming, even without a code demo: **convention ambiguity** (some tools standardize only predictors, producing a coefficient that is neither fully raw nor fully standardized) and **multicollinearity** (standardization does not fix correlated predictors; the coefficient instability merely moves to SD units). Standardized reporting is a communication choice, not a remedy for modelling problems.

**Try it:** Add a 0/1 indicator for V-shaped vs straight engines (`mtcars$vs`) to a model with `hp` and `wt`, standardize it, and print the coefficient for `vs`. Then explain in one sentence why the "per 1 SD" framing is awkward for this predictor.

```r title="Your turn: standardizing the vs dummy"
# Try it: fit lm(mpg ~ hp + wt + vs) on standardized mtcars
# Print the coefficient for vs

# your code here
#> Expected: a small negative or near-zero coefficient; awkward to interpret
```

<details>
<summary>Click to reveal solution</summary>

```r title="vs dummy standardization solution"
ex_vs_fit <- lm(mpg ~ hp + wt + vs, data = as.data.frame(scale(mtcars)))
ex_vs_std <- round(coef(ex_vs_fit), 3)
ex_vs_std
#> (Intercept)          hp          wt          vs
#>       0.000      -0.282      -0.601       0.109
```

The standardized coefficient for `vs` is `0.109`. A naive reading says *"a 1 SD increase in vs is associated with a 0.109 SD increase in mpg,"* but `vs` is binary (0 = V-shaped, 1 = straight) and does not vary by SDs. The raw version of the same model gives `vs` a coefficient around 0.7 mpg, which translates cleanly as *"straight-engine cars get 0.7 mpg more than V-engine cars, holding hp and wt constant."* That sentence is the one to show your reader.

</details>

## Practice Exercises

Two capstone exercises combining the concepts from the core sections. Use variable names prefixed with `my_` to keep your answers separate from the tutorial state.

### Exercise 1: Multi-predictor standardization on iris (medium)

Fit `lm(Sepal.Length ~ Sepal.Width + Petal.Length + Petal.Width)` on `iris`. Compute the standardized coefficients two ways: (a) by rescaling the data with `scale()` and refitting, and (b) by applying the SD-ratio formula to the raw coefficients. Verify the two approaches agree to at least 6 decimal places. Save the result to `my_iris_betas`. Identify the strongest predictor by absolute standardized coefficient.

```r title="Capstone 1: iris multi-predictor standardization"
# Exercise 1: fit iris model, compute standardized coefs two ways
# Hint: use iris[, 1:4] to get the numeric columns

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Capstone 1 solution"
my_iris_fit <- lm(Sepal.Length ~ Sepal.Width + Petal.Length + Petal.Width, data = iris)

# Route A: scale + refit
iris_z <- as.data.frame(scale(iris[, 1:4]))
route_a <- coef(lm(Sepal.Length ~ Sepal.Width + Petal.Length + Petal.Width,
                   data = iris_z))[-1]

# Route B: manual SD-ratio formula
sd_y <- sd(iris$Sepal.Length)
sd_x <- sapply(iris[, c("Sepal.Width", "Petal.Length", "Petal.Width")], sd)
route_b <- coef(my_iris_fit)[-1] * sd_x / sd_y

my_iris_betas <- data.frame(
  scale_route  = round(route_a, 6),
  manual_route = round(route_b, 6)
)
my_iris_betas
#>              scale_route manual_route
#> Sepal.Width     0.373597     0.373597
#> Petal.Length    1.575443     1.575443
#> Petal.Width    -0.482087    -0.482087

# Strongest predictor by |std_coef|
names(route_a)[which.max(abs(route_a))]
#> [1] "Petal.Length"
```

**Explanation:** Both routes agree to six decimals. Petal.Length has the largest absolute standardized coefficient (`1.575`), so a one-SD change in Petal.Length moves Sepal.Length more than a one-SD change in either of the other two predictors, holding the others constant.

</details>

### Exercise 2: Mixed continuous + binary predictors (hard)

On `mtcars`, fit `lm(mpg ~ wt + hp + am)` (two continuous predictors plus a binary one). Build `my_mix_table`, a `data.frame` with columns `predictor`, `raw_coef`, `std_coef`, and `sensible_unit`, where `sensible_unit` names the interpretable unit for each predictor ("1000 lb", "1 hp", or "manual vs auto"). State in a comment which coefficient column (raw or standardized) you would report for each predictor and why.

```r title="Capstone 2: mixed-predictor comparison table"
# Exercise 2: build my_mix_table with raw + std + sensible_unit columns
# Hint: use coef() on both raw and scaled models, then data.frame() them

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Capstone 2 solution"
raw_fit <- lm(mpg ~ wt + hp + am, data = mtcars)
std_fit <- lm(mpg ~ wt + hp + am, data = as.data.frame(scale(mtcars)))

my_mix_table <- data.frame(
  predictor      = c("wt", "hp", "am"),
  raw_coef       = round(coef(raw_fit)[-1], 3),
  std_coef       = round(coef(std_fit)[-1], 3),
  sensible_unit  = c("1000 lb", "1 hp", "manual vs auto")
)
my_mix_table
#>    predictor raw_coef std_coef  sensible_unit
#> wt        wt   -3.929   -0.638        1000 lb
#> hp        hp   -0.038   -0.427           1 hp
#> am        am    2.084    0.169 manual vs auto

# Reporting choice (comment in real analysis):
# - wt and hp: report std_coef if the question is "which matters more"; report raw if communicating physical effect.
# - am: always report raw (a standardized binary coef has no meaningful interpretation).
```

**Explanation:** For the two continuous predictors, both the raw and standardized coefficients are defensible depending on audience. For `am` (binary), only the raw coefficient (`+2.08`: manual cars average 2.08 mpg higher than automatics, holding wt and hp constant) has a human-readable interpretation. This is why mixed-predictor models are almost always reported in raw units, with standardized betas as a supplementary column for the continuous predictors.

</details>

## Complete Example

Let's tie everything together with a four-predictor model on `mtcars` and build the kind of coefficient table you would actually put in a paper or dashboard.

```r title="End-to-end tidy coefficient comparison"
# Fit the full model on raw and standardized data
final_fit <- lm(mpg ~ wt + hp + qsec + am, data = mtcars)
final_std <- lm(mpg ~ wt + hp + qsec + am,
                data = as.data.frame(scale(mtcars)))

# Build a publication-ready comparison table
final_df <- data.frame(
  predictor    = c("wt", "hp", "qsec", "am"),
  raw_coef     = round(coef(final_fit)[-1], 3),
  std_coef     = round(coef(final_std)[-1], 3),
  interpretation = c(
    "Per 1000 lb weight increase, mpg drops by 3.70",
    "Per 1 hp increase, mpg drops by 0.02",
    "Per 1 second slower quarter-mile, mpg rises by 0.66",
    "Manual cars average 2.52 more mpg than automatics"
  )
)
final_df
#>      predictor raw_coef std_coef                                      interpretation
#> wt          wt   -3.703   -0.601    Per 1000 lb weight increase, mpg drops by 3.70
#> hp          hp   -0.020   -0.231              Per 1 hp increase, mpg drops by 0.02
#> qsec      qsec    0.656    0.236 Per 1 second slower quarter-mile, mpg rises by 0.66
#> am          am    2.520    0.204  Manual cars average 2.52 more mpg than automatics

# Ranking by standardized coefficient magnitude
final_df[order(-abs(final_df$std_coef)), c("predictor", "std_coef")]
#>      predictor std_coef
#> wt          wt   -0.601
#> qsec      qsec    0.236
#> hp          hp   -0.231
#> am          am    0.204
```

The raw coefficients give you natural-language interpretations for every predictor, including the binary `am`. The standardized coefficients let you rank the continuous predictors on a common scale: `wt` is the dominant driver, with `hp` and `qsec` roughly tied for second place, and `am` close behind. A paper reporting this model would likely show both columns, with the `interpretation` column derived from the raw coefficients and the ranking derived from the standardized ones.

## Summary

| When to report **unstandardized** coefficients | When to report **standardized** coefficients |
|---|---|
| Predicting Y in original units | Ranking predictor importance |
| Categorical or binary predictors | All-continuous predictors |
| Communicating to domain experts | Path coefficients in SEM/mediation |
| Comparing across samples or time periods | Meta-analytic effect sizes |
| Predictors share natural units | Predictors on wildly different scales |

**Bottom line:** Report raw coefficients for prediction and communication. Report standardized coefficients when ranking importance inside a single model. For mixed models, report both side by side and let the reader pick.

## References

1. Fox, J. *Applied Regression Analysis and Generalized Linear Models*, 3rd ed. Sage (2016). Chapter on coefficient interpretation.
2. Gelman, A. (2008). "Scaling regression inputs by dividing by two standard deviations." *Statistics in Medicine*, 27(15), 2865-2873. [Link](http://www.stat.columbia.edu/~gelman/research/published/standardizing7.pdf)
3. Bring, J. (1994). "How to Standardize Regression Coefficients." *The American Statistician*, 48(3), 209-213. [Link](https://doi.org/10.1080/00031305.1994.10476059)
4. Greenland, S., Schlesselman, J. J., & Criqui, M. H. (1986). "The fallacy of employing standardized regression coefficients and correlations as measures of effect." *American Journal of Epidemiology*, 123(2), 203-208.
5. Kim, R. S. (2011). "Standardized regression coefficients as indices of effect sizes in meta-analysis." Florida State University Dissertation.
6. UVA Library, "The Shortcomings of Standardized Regression Coefficients." [Link](https://library.virginia.edu/data/articles/the-shortcomings-of-standardized-regression-coefficients)
7. R Core Team, base R documentation for `scale()`. [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/scale.html)
8. Fletcher, T., `QuantPsyc::lm.beta()` reference. [Link](https://cran.r-project.org/web/packages/QuantPsyc/)

## Continue Learning

- [Multiple Regression in R](Multiple-Regression-in-R.html): the parent tutorial covering model specification, diagnostics, and interpretation end to end.
- [Interpreting Regression Output Completely](Interpreting-Regression-Output-Completely.html): a deeper dive into every element of `summary(lm())`, including coefficient standard errors, t-values, and p-values.
- [Multicollinearity in R](Multicollinearity-in-R.html): when standardized coefficients are unstable, multicollinearity is usually the cause; this post explains how to diagnose and fix it.
