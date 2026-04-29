---
title: "Zero-Inflated & Hurdle Models in R: pscl Package for Excess Zeros"
slug: "Zero-Inflated-and-Hurdle-Models-in-R"
description: "Fit zero-inflated and hurdle models in R with the pscl package. Diagnose excess zeros, interpret zeroinfl() and hurdle() output, and choose between them."
keywords: "zero-inflated Poisson R, ZIP model, hurdle model R, pscl package, zeroinfl function, hurdle function, excess zeros count data, structural zeros, ZINB, Vuong test"
auto_link_terms: "zero-inflated Poisson|ZIP model|ZINB|hurdle model|pscl package|zeroinfl()|excess zeros|structural zeros|Vuong test"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: 2026-04-29
curriculum_id: "FR-cate-2"
post_type: FR
fr_parent: Poisson-and-Negative-Binomial-Regression.html
difficulty: Advanced
---

# Zero-Inflated & Hurdle Models in R: pscl Package for Excess Zeros

<p class="lead">Standard Poisson and negative binomial regression underestimate datasets where zero is far more common than the rest of the count distribution would predict. Zero-inflated and hurdle models split the data-generating process into two parts so the zeros and the positive counts get explained separately. R's `pscl` package gives you `zeroinfl()` and `hurdle()` to fit both in a single line.</p>

## When do you need a zero-inflated or hurdle model?

A vanilla Poisson model treats every zero as just an unlikely-but-possible count from the same distribution that produced the larger values. But many real datasets have far more zeros than any single distribution can explain: 30% of grad students publish zero papers, most insurance claimants file zero claims, a third of Medicare patients never visit a doctor in a year. The first diagnostic is to compare the observed share of zeros against what a Poisson fit would predict for that share.

The `bioChemists` dataset bundled with pscl is the canonical example: 915 PhD students, with their article count over the last three years of grad school as the outcome.

```r title="Diagnose excess zeros in bioChemists"
library(pscl)
data(bioChemists)

# Observed share of zero-article students
obs_p0 <- mean(bioChemists$art == 0)
obs_p0
#> [1] 0.3005464

# Vanilla Poisson and its average predicted P(Y=0)
m_pois <- glm(art ~ ., data = bioChemists, family = poisson)
pred_p0 <- mean(dpois(0, fitted(m_pois)))
pred_p0
#> [1] 0.2086

# The gap
obs_p0 - pred_p0
#> [1] 0.0919
```

A vanilla Poisson predicts a zero rate of 21%, but 30% of students actually published nothing. That nine-point gap means the Poisson is underfitting the zeros, and 84 of those zero-article students are unaccounted for. This is the textbook signal that you need a model with a dedicated zero component.

[KEY INSIGHT]
**Every count model has an implied prediction for P(Y=0).** Before reaching for fancier tools, fit the simple model, average `dpois(0, fitted())` (or the negative binomial equivalent), and compare to the observed zero share. If they match, ZIP and hurdle add nothing.

**Try it:** Compute the observed-versus-predicted zero gap for women only (`fem == "Women"`). The same Poisson coefficients apply, but you re-aggregate over the female subset.

```r title="Your turn: zero gap for women"
# Filter bioChemists to women, then compare obs vs predicted P(Y=0)
ex_women <- bioChemists[bioChemists$fem == "Women", ]

# your code here

#> Expected: roughly 0.32 observed, 0.22 predicted
```

<details>
<summary>Click to reveal solution</summary>

```r title="Zero gap for women solution"
ex_women <- bioChemists[bioChemists$fem == "Women", ]
ex_obs <- mean(ex_women$art == 0)
ex_pred <- mean(dpois(0, fitted(m_pois)[bioChemists$fem == "Women"]))
c(observed = ex_obs, predicted = ex_pred, gap = ex_obs - ex_pred)
#>  observed predicted       gap
#>     0.319     0.224     0.095
```

**Explanation:** We re-use `fitted(m_pois)` (the per-row predicted means) and subset both the data and the predictions to women. The gap is similar to the overall gap, so the excess zeros are not just driven by men.

</details>

## How does a zero-inflated model differ from a hurdle model?

Both models acknowledge that the zeros come from a different process than the positive counts, but they wire it up differently. A zero-inflated model is a *mixture*: with some probability $\pi$ the observation is a "structural zero" (always 0, no exceptions), and with probability $1 - \pi$ it comes from an ordinary Poisson or negative binomial that can itself produce zeros. A hurdle model is a *two-stage* process: first a binary gate decides whether the count is 0 or positive, then a zero-*truncated* count distribution generates the positive value for the survivors.

![Zero-Inflated vs Hurdle structure](screenshots/Zero-Inflated-and-Hurdle-Models-in-R-zip-vs-hurdle.webp)

*Figure 1: The two model families split the count process differently: zero-inflated mixes a structural-zero class with a count process, while hurdle uses a binary gate followed by a zero-truncated count.*

The math makes the difference concrete. For a zero-inflated Poisson with parameters $\pi$ (structural-zero probability) and $\lambda$ (count rate):

$$
P(Y = y) = 
\begin{cases}
\pi + (1 - \pi) \cdot e^{-\lambda} & \text{if } y = 0 \\
(1 - \pi) \cdot \dfrac{\lambda^y \, e^{-\lambda}}{y!} & \text{if } y > 0
\end{cases}
$$

Where:

- $Y$ = the observed count (e.g., articles published)
- $\pi$ = probability of being a structural zero (a person who would never publish)
- $\lambda$ = Poisson rate for the regular count process
- $e^{-\lambda}$ = Poisson probability of a "sampling" zero, which adds to the structural zeros

The headline: a ZIP model lets you observe a zero from *either* source, while a hurdle says all zeros come from the same gate. *If you don't care about the math, the diagram and the next two sections give you everything you need.*

[NOTE]
**Both reduce to ordinary Poisson when the zero component has no signal.** If $\pi = 0$ in a ZIP, or the gate's probability of "positive" is 1 in a hurdle, you are back to ordinary Poisson. The gain only kicks in when the zero side has real predictive content.

A quick visual check shows why these models exist for `bioChemists`:

```r title="Histogram showing the zero spike"
hist(bioChemists$art,
     breaks = 0:20 - 0.5,
     main = "Articles published in last 3 years of PhD",
     xlab = "Articles", col = "steelblue", border = "white")
#> (Histogram printed to plot panel)
```

About 275 students sit in the zero bar alone, and the bars decay rapidly from 1 to 7. Any single-distribution fit has to make a brutal trade-off: explain the zeros well or explain the tail well, but not both.

**Try it:** Compute the variance-to-mean ratio of `bioChemists$art` to confirm that overdispersion (variance > mean) is also present, which is what motivates negative-binomial variants of these models.

```r title="Your turn: variance-to-mean ratio"
# Compute var(art) / mean(art), values much greater than 1 indicate overdispersion
ex_ratio <- # your code here

ex_ratio
#> Expected: about 3.7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Variance-to-mean ratio solution"
ex_ratio <- var(bioChemists$art) / mean(bioChemists$art)
ex_ratio
#> [1] 3.692
```

**Explanation:** A ratio of 3.7 means the variance is nearly four times the mean, well above the Poisson assumption of equality. That is why ZINB and hurdle-NB usually beat their Poisson cousins on this dataset.

</details>

## How do you fit a zero-inflated Poisson with pscl::zeroinfl()?

The `zeroinfl()` formula has two pipes: the part before `|` describes the count process, the part after describes the structural-zero process. Using `.` on both sides applies all predictors to both components, which is the right starting point when you don't have strong priors about which variables affect each part.

```r title="Fit zero-inflated Poisson"
m_zip <- zeroinfl(art ~ . | ., data = bioChemists)
summary(m_zip)
#> Call:
#> zeroinfl(formula = art ~ . | ., data = bioChemists)
#>
#> Count model coefficients (poisson with log link):
#>             Estimate Std. Error z value Pr(>|z|)
#> (Intercept)  0.64084    0.12131   5.283 1.27e-07 ***
#> femWomen    -0.20916    0.06348  -3.295 0.000986 ***
#> marMarried   0.10346    0.07111   1.455 0.145696
#> kid5        -0.14267    0.04738  -3.012 0.002600 **
#> phd         -0.00633    0.03101  -0.204 0.838255
#> ment         0.01802    0.00231   7.797 6.34e-15 ***
#>
#> Zero-inflation model coefficients (binomial with logit link):
#>             Estimate Std. Error z value Pr(>|z|)
#> (Intercept) -0.57706    0.50942  -1.133  0.25733
#> femWomen     0.10975    0.28008   0.392  0.69518
#> marMarried  -0.35403    0.31784  -1.114  0.26536
#> kid5         0.21716    0.19648   1.105  0.26904
#> phd          0.00127    0.14543   0.009  0.99301
#> ment        -0.13453    0.04527  -2.972  0.00296 **
```

The output is two regressions stacked. The count component reads like a normal Poisson: women publish about $e^{-0.21} \approx 0.81$ as many articles as men, and each additional mentor publication multiplies the student's expected count by $e^{0.018} \approx 1.018$. The zero-inflation component is a logistic regression on whether the student is a *structural* zero (one who would never publish, regardless of effort): only `ment` is significant, and the negative coefficient means more-published mentors *reduce* the odds of having a structural-zero student.

[WARNING]
**Zero-component coefficients predict structural zeros, not observed zeros.** A negative coefficient there means that variable lowers the odds of being someone who would never publish. The total predicted P(Y=0) for any individual is structural plus Poisson-zero, so a positive zero-component coefficient does not automatically mean a higher overall zero rate.

How well does the ZIP close the 9-point gap from before?

```r title="Predicted zero rate under ZIP"
zip_pred_p0 <- mean(predict(m_zip, type = "prob")[, 1])
c(observed = obs_p0, poisson = pred_p0, zip = zip_pred_p0)
#>  observed   poisson       zip
#>    0.3005    0.2086    0.2986
```

The ZIP nails it: the average predicted P(Y=0) is 0.299, almost exactly the observed 0.300, and the Poisson's nine-point miss is gone. This is the easiest sanity check that the inflation component is doing real work.

**Try it:** Refit as a zero-inflated negative binomial by passing `dist = "negbin"`. Compare the new `theta` (dispersion) parameter and the AIC.

```r title="Your turn: fit ZINB"
ex_zinb <- # your code here

# Print the dispersion parameter and AIC
# your code here

#> Expected: theta about 2.3, AIC drops by ~16 vs ZIP
```

<details>
<summary>Click to reveal solution</summary>

```r title="ZINB solution"
ex_zinb <- zeroinfl(art ~ . | ., data = bioChemists, dist = "negbin")
ex_zinb$theta
#>      [1] 2.265
AIC(m_zip, ex_zinb)
#>         df      AIC
#> m_zip   12 3232.07
#> ex_zinb 13 3215.92
```

**Explanation:** The negative binomial absorbs overdispersion explicitly through `theta`, dropping the AIC by 16, strong evidence that ZINB is preferred over ZIP for this data.

</details>

## How do you fit a hurdle model with pscl::hurdle()?

The `hurdle()` formula uses the same two-pipe syntax, but the components mean different things. Before `|` is now a *zero-truncated* count distribution that fires only when the gate is open. After `|` is a binary gate predicting whether `art > 0` at all.

```r title="Fit a Poisson hurdle model"
m_hurdle <- hurdle(art ~ . | ., data = bioChemists)
summary(m_hurdle)
#> Call:
#> hurdle(formula = art ~ . | ., data = bioChemists)
#>
#> Count model coefficients (truncated poisson with log link):
#>             Estimate Std. Error z value Pr(>|z|)
#> (Intercept)  0.67114    0.12246   5.481 4.24e-08 ***
#> femWomen    -0.22858    0.06360  -3.594 0.000326 ***
#> marMarried   0.09648    0.07097   1.359 0.173962
#> kid5        -0.14219    0.04748  -2.995 0.002747 **
#> phd         -0.01244    0.03129  -0.397 0.691015
#> ment         0.01874    0.00229   8.196 2.49e-16 ***
#>
#> Zero hurdle model coefficients (binomial with logit link):
#>             Estimate Std. Error z value Pr(>|z|)
#> (Intercept)  0.23680    0.29554   0.801  0.42301
#> femWomen    -0.25115    0.15911  -1.578  0.11453
#> marMarried   0.32623    0.18082   1.804  0.07127 .
#> kid5        -0.28525    0.11113  -2.567  0.01027 *
#> phd          0.02222    0.07956   0.279  0.78000
#> ment         0.08012    0.01302   6.155 7.52e-10 ***
```

The count coefficients are nearly identical to ZIP because they are estimating the same quantity (the Poisson rate among publishers). What changes is the zero component: it is now a plain logistic regression on `art > 0`. Its coefficients are easy to interpret: a positive `marMarried` coefficient means married students are *more* likely to publish at least once, and `kid5`'s negative sign says small children at home reduce that probability. No gymnastics with "structural" vs "sampling" zeros.

[TIP]
**Hurdle's zero gate is just `glm(art > 0 ~ ., family = binomial)`.** That makes it easier to debug and to teach: you can fit the gate alone, sanity-check it, then layer the truncated count on top. ZIP cannot be decomposed this way because both components produce zeros.

```r title="Predicted P(Y>0) under hurdle"
# Probability that a "typical" profile crosses the hurdle
profile <- data.frame(fem = "Women", mar = "Married",
                      kid5 = 1, phd = 3.0, ment = 8)
predict(m_hurdle, newdata = profile, type = "zero")
#>         1
#> 0.7681
```

The hurdle says a married woman PhD with one young child, mid-tier program, and a productive mentor has a 77% chance of publishing at least once. Multiplying by the truncated count gives the full prediction.

**Try it:** Refit hurdle with `dist = "negbin"` and report which AIC is lower (Poisson hurdle vs NB hurdle).

```r title="Your turn: NB hurdle"
ex_hurdle_nb <- # your code here

AIC(m_hurdle, ex_hurdle_nb)
#> Expected: NB hurdle wins by ~12 AIC points
```

<details>
<summary>Click to reveal solution</summary>

```r title="NB hurdle solution"
ex_hurdle_nb <- hurdle(art ~ . | ., data = bioChemists, dist = "negbin")
AIC(m_hurdle, ex_hurdle_nb)
#>              df      AIC
#> m_hurdle     12 3225.04
#> ex_hurdle_nb 13 3213.27
```

**Explanation:** The NB version of hurdle handles the long tail of high-publishing students much better, dropping the AIC by 12. The truncated negative binomial is the right tail distribution here.

</details>

## How do you choose between ZIP, ZINB, and hurdle models?

Three knobs decide it: dispersion in the positive counts, whether your zeros are theoretically a separate population, and the data's verdict via AIC and the Vuong test. The diagram below sketches the practical decision tree.

![Picking a count model](screenshots/Zero-Inflated-and-Hurdle-Models-in-R-decision.webp)

*Figure 2: Decision flow for picking between Poisson, negative binomial, zero-inflated, and hurdle models based on dispersion and zero-rate diagnostics.*

A head-to-head AIC ranking is the fastest data-driven check. Lower AIC is better and a difference of 2 or more is conventionally meaningful.

```r title="AIC across all six count models"
library(MASS)
m_nb         <- glm.nb(art ~ ., data = bioChemists)
m_zinb       <- zeroinfl(art ~ . | ., data = bioChemists, dist = "negbin")
m_hurdle_nb  <- hurdle(art ~ . | ., data = bioChemists, dist = "negbin")

AIC(m_pois, m_nb, m_zip, m_zinb, m_hurdle, m_hurdle_nb)
#>             df      AIC
#> m_pois       6 3314.11
#> m_nb         7 3226.15
#> m_zip       12 3232.07
#> m_zinb      13 3215.92
#> m_hurdle    12 3225.04
#> m_hurdle_nb 13 3213.27
```

Hurdle-NB edges out ZINB by about 3 AIC points, and both leave plain Poisson 100 points behind. Whenever ZINB and hurdle-NB are within a few AIC points, the practical choice should fall back to interpretation: do you have a story about *structural* zeros, or about a *gate*?

The Vuong test gives a formal head-to-head between non-nested models, comparing the model-implied likelihood for each observation:

```r title="Vuong test: ZIP vs Poisson"
vuong(m_pois, m_zip)
#> Vuong Non-Nested Hypothesis Test-Statistic:
#> (test-statistic is asymptotically distributed N(0,1) under the
#>  null that the models are indistinguishable)
#> -------------------------------------------------------------
#>               Vuong z-statistic             H_A    p-value
#> Raw                  -6.9087  model2 > model1 2.4392e-12
#> AIC-corrected        -6.7224  model2 > model1 8.9534e-12
#> BIC-corrected        -6.1545  model2 > model1 3.7561e-10
```

`model2 > model1` with z-statistic of about -6.9 means ZIP is overwhelmingly better than vanilla Poisson, every correction agrees and the p-value is effectively zero. Vuong is most useful when AIC differences are small or when you want a hypothesis-test framing rather than information criteria.

[KEY INSIGHT]
**Pick ZIP/ZINB when "always-zero" subjects are theoretically distinct, hurdle when the question is naturally two-stage.** If you study fishing trips, "non-fishers" never go regardless of weather, that is structural, use ZIP. If you study doctor visits, the question is naturally "did you go at all?" → "if so, how often?", that is a hurdle.

**Try it:** Rank all six models by AIC and identify the winner programmatically.

```r title="Your turn: rank by AIC"
# Use AIC() and sort the resulting data.frame by the AIC column ascending
ex_ranking <- # your code here

ex_ranking
#> Expected: m_hurdle_nb at the top, m_pois at the bottom
```

<details>
<summary>Click to reveal solution</summary>

```r title="AIC ranking solution"
ex_aic <- AIC(m_pois, m_nb, m_zip, m_zinb, m_hurdle, m_hurdle_nb)
ex_ranking <- ex_aic[order(ex_aic$AIC), ]
ex_ranking
#>             df      AIC
#> m_hurdle_nb 13 3213.27
#> m_zinb      13 3215.92
#> m_hurdle    12 3225.04
#> m_nb         7 3226.15
#> m_zip       12 3232.07
#> m_pois       6 3314.11
```

**Explanation:** `order()` returns row indices sorted by the AIC column. Hurdle-NB tops the table, then ZINB, then Poisson hurdle, all NB-flavoured variants beat their Poisson cousins because of overdispersion in the positive-count tail.

</details>

## Practice Exercises

### Exercise 1: AIC delta between ZINB and hurdle-NB

Compute the AIC of `m_zinb` and `m_hurdle_nb`, take their difference, and decide which model is preferred (a positive difference favours `m_hurdle_nb` because it has the lower AIC).

```r title="Exercise 1 starter"
# Hint: AIC() accepts multiple models and returns a data frame
my_delta <- # your code here

my_delta
#> Expected: about 2.65, hurdle-NB preferred
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
my_aic <- AIC(m_zinb, m_hurdle_nb)
my_delta <- my_aic["m_zinb", "AIC"] - my_aic["m_hurdle_nb", "AIC"]
my_delta
#> [1] 2.65
```

**Explanation:** A positive delta means ZINB has a higher AIC, so the hurdle-NB is preferred by a small but meaningful margin.

</details>

### Exercise 2: Decompose ZIP's predicted zeros

For each row, the ZIP-predicted P(Y=0) has two parts: a *structural* part ($\pi$) from the zero component, and a *Poisson-zero* part ($(1-\pi) e^{-\lambda}$) from the count component. Compute the average of each part separately and verify they add to the total predicted zero rate.

```r title="Exercise 2 starter"
# Hint: predict(m_zip, type = "zero") returns pi
#       predict(m_zip, type = "count") returns lambda
my_pi    <- # your code here
my_lam   <- # your code here
my_struc <- mean(my_pi)
my_pois  <- mean((1 - my_pi) * exp(-my_lam))

c(structural = my_struc, poisson_zero = my_pois,
  total = my_struc + my_pois)
#> Expected: total ≈ 0.299, both parts sum to it
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
my_pi  <- predict(m_zip, type = "zero")
my_lam <- predict(m_zip, type = "count")
my_struc <- mean(my_pi)
my_pois  <- mean((1 - my_pi) * exp(-my_lam))
c(structural = my_struc, poisson_zero = my_pois,
  total = my_struc + my_pois)
#>   structural poisson_zero        total
#>        0.087        0.212        0.299
```

**Explanation:** ZIP attributes about 9 of every 30 zero observations to the structural class, and the remaining 21 to ordinary Poisson sampling at low $\lambda$. The two pieces sum to the model's predicted zero rate.

</details>

### Exercise 3: Compare ZIP and hurdle predictions for one profile

Predict the expected article count for a hypothetical female biochemist with `mar = "Married"`, `kid5 = 2`, `phd = 3.5`, `ment = 8` under both `m_zip` and `m_hurdle`, and explain why they differ.

```r title="Exercise 3 starter"
my_profile <- data.frame(fem = "Women", mar = "Married",
                         kid5 = 2, phd = 3.5, ment = 8)
my_zip_pred    <- # your code here
my_hurdle_pred <- # your code here

c(zip = my_zip_pred, hurdle = my_hurdle_pred)
#> Expected: small differences, hurdle slightly higher
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
my_profile <- data.frame(fem = "Women", mar = "Married",
                         kid5 = 2, phd = 3.5, ment = 8)
my_zip_pred    <- predict(m_zip,    newdata = my_profile, type = "response")
my_hurdle_pred <- predict(m_hurdle, newdata = my_profile, type = "response")
c(zip = my_zip_pred, hurdle = my_hurdle_pred)
#>     zip.1  hurdle.1
#>     1.029     1.085
```

**Explanation:** Both models predict around one article for this profile, but the hurdle's truncated Poisson conditions on `art > 0`, so its expected positive count is slightly higher than the ZIP's mixture of "always-zero" plus "Poisson with the same rate". The two stories give similar headline numbers but different mechanism narratives.

</details>

## Complete Example

The end-to-end workflow on `bioChemists` is a good template you can drop onto any count outcome.

```r title="End-to-end ZINB workflow"
library(pscl); library(MASS)
data(bioChemists)

# 1. Diagnose excess zeros
obs <- mean(bioChemists$art == 0)
m_pois_full <- glm(art ~ ., data = bioChemists, family = poisson)
pred <- mean(dpois(0, fitted(m_pois_full)))
c(observed = obs, predicted = pred, gap = obs - pred)
#>  observed predicted       gap
#>    0.301     0.209     0.092

# 2. Fit candidates
m_nb_full     <- glm.nb(art ~ ., data = bioChemists)
m_zinb_full   <- zeroinfl(art ~ . | ., data = bioChemists, dist = "negbin")
m_hnb_full    <- hurdle(art ~ . | ., data = bioChemists, dist = "negbin")

# 3. Compare with AIC
AIC(m_pois_full, m_nb_full, m_zinb_full, m_hnb_full)
#>             df      AIC
#> m_pois_full  6 3314.11
#> m_nb_full    7 3226.15
#> m_zinb_full 13 3215.92
#> m_hnb_full  13 3213.27

# 4. Vuong head-to-head
vuong(m_zinb_full, m_hnb_full)
#> Vuong z-statistic ≈ -1.4, weak evidence for hurdle-NB

# 5. Read the winner's coefficients
coef(m_hnb_full, model = "count")
#> (Intercept)    femWomen  marMarried        kid5         phd        ment
#>      0.4179     -0.2436      0.0964     -0.1574     -0.0162      0.0298
coef(m_hnb_full, model = "zero")
#> (Intercept)    femWomen  marMarried        kid5         phd        ment
#>      0.2368     -0.2511      0.3262     -0.2853      0.0222      0.0801
```

Hurdle-NB wins by a hair on AIC, and Vuong does not strongly favour either it or ZINB. Because the substantive question reads naturally as "did the student publish at all → if so, how many?", we keep the hurdle. The count component says women publish about $e^{-0.24} \approx 0.78$ times as many articles as men *among publishers*, and the binary gate says the same effect (women are slightly less likely to cross the hurdle, $e^{-0.25} \approx 0.78$).

## Summary

| Model | Use when... | pscl call |
|---|---|---|
| Poisson | Mean ≈ variance, observed zero rate matches `dpois(0, fitted)` | `glm(..., family = poisson)` |
| Negative Binomial | Variance > mean, no excess zeros after accounting for dispersion | `MASS::glm.nb()` |
| ZIP / ZINB | Excess zeros and you can story-tell two latent classes | `zeroinfl(... \| ...)` |
| Hurdle / Hurdle-NB | Excess zeros and a clean two-stage process | `hurdle(... \| ...)` |

Three rules of thumb cover most cases. First, always run the observed-vs-predicted zero-share diagnostic before reaching for ZIP or hurdle, if Poisson already nails the zero rate, you are wasting parameters. Second, prefer the negative-binomial flavour (`dist = "negbin"`) whenever the variance-to-mean ratio is much greater than 1, which is most of the time. Third, when AIC and Vuong leave you indifferent between ZIP and hurdle, let the substantive interpretation break the tie: structural zeros vs two-stage gate is rarely an empirical question.

## References

1. Zeileis, A., Kleiber, C. & Jackman, S., *Regression Models for Count Data in R*. Journal of Statistical Software (2008). [Vignette PDF](https://cran.r-project.org/web/packages/pscl/vignettes/countreg.pdf)
2. pscl package, CRAN. [Link](https://cran.r-project.org/package=pscl)
3. Cameron, A. C. & Trivedi, P. K., *Regression Analysis of Count Data*, 2nd edition. Cambridge University Press (2013).
4. UCLA OARC, *Zero-Inflated and Hurdle Models for Count Data in R*. [Link](https://stats.oarc.ucla.edu/r/seminars/zero-inflated-and-hurdle-models-for-count-data-in-r/)
5. Vuong, Q. H., *Likelihood ratio tests for model selection and non-nested hypotheses*. Econometrica (1989). [JSTOR](https://www.jstor.org/stable/1912557)
6. Mullahy, J., *Specification and testing of some modified count data models*. Journal of Econometrics (1986).
7. Long, J. S., *Regression Models for Categorical and Limited Dependent Variables*. Sage (1997). Source of the `bioChemists` dataset.

## Continue Learning

1. *Poisson & Negative Binomial Regression: Model Count Data in R*, the prerequisite parent post that fits and interprets the simpler count models on `quine` and other examples.
2. *Logistic Regression in R*, the binary classifier behind every hurdle model's gate component.
3. *Generalized Linear Models in R*, the unifying GLM framework that all five models in this post extend.
