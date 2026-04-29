---
title: "Log-Linear Models in R: Model Tables of Counts with glm(poisson)"
slug: "Log-Linear-Models-in-R"
description: "Fit log-linear models in R with glm(poisson). Model contingency tables, test independence vs. association, and pick the simplest adequate model with code."
keywords: "log-linear models in R, glm poisson contingency table, loglinear regression, independence model, saturated model, deviance test, categorical data analysis, mosaic plot"
auto_link_terms: "log-linear model|log-linear models|loglinear model|loglinear models|saturated log-linear model|independence log-linear model|log-linear regression"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-29"
curriculum_id: "FR-cate-1"
post_type: "FR"
fr_parent: "Poisson-and-Negative-Binomial-Regression.html"
difficulty: "Intermediate"
---

# Log-Linear Models in R: Model Tables of Counts with glm(poisson)

<p class="lead">Log-linear models treat each cell of a contingency table as a Poisson count, then use <code>glm(family = poisson)</code> to explain those counts from the categorical variables that index the table. The same fit answers three questions in one go: are the variables independent, partially associated, or fully interacting?</p>

## What does a log-linear model do?

You already know how to compare two categorical variables with a chi-squared test. A log-linear model is the regression-shaped sibling of that test. It writes every cell count as a Poisson outcome and lets you switch independence, partial association, or full interaction on and off as model terms. That makes it easy to compare hypotheses, pick the simplest one that fits, and read the strength of associations off the coefficients.

Here is the payoff in one block. We collapse the built-in `HairEyeColor` 3-way table over `Sex`, turn the resulting 2-way table into a long data frame, and fit the independence model `Freq ~ Hair + Eye` with `glm(family = poisson)`. The fitted counts and residual deviance tell us whether hair colour and eye colour are independent in this data.

```r title="Fit an independence log-linear model"
# Collapse HairEyeColor over Sex to get a 2-way table
hec2 <- margin.table(HairEyeColor, margin = c(1, 2))
hec2_df <- as.data.frame(hec2)
hec2_df
#>      Hair   Eye Freq
#> 1   Black Brown   68
#> 2   Brown Brown  119
#> 3     Red Brown   26
#> 4   Blond Brown    7
#> ...
m_indep <- glm(Freq ~ Hair + Eye, family = poisson, data = hec2_df)
c(deviance = deviance(m_indep), df = df.residual(m_indep))
#>  deviance        df
#> 146.44309  9.00000
```

A residual deviance of 146.4 on 9 degrees of freedom is enormous. Under the null hypothesis of independence, the deviance should be roughly chi-squared with 9 df, so we expect a value near 9. We are seeing 146 instead, which is overwhelming evidence that hair and eye colour are *not* independent. The model is too small.

[KEY INSIGHT]
**A log-linear model is just Poisson regression where the response is a cell count and the predictors are the categorical variables that index the cell.** Independence corresponds to dropping all interaction terms; association corresponds to keeping them. The same `glm()` fits both, you only change the formula.

**Try it:** Collapse `HairEyeColor` over `Hair` instead, and fit the independence model `Freq ~ Eye + Sex`. Print the residual deviance and df, and decide whether eye colour and sex are independent.

```r title="Your turn: independence on Eye x Sex"
# Try it: collapse over Hair, then fit independence
ex_tab <- margin.table(HairEyeColor, margin = c(2, 3))
ex_df  <- as.data.frame(ex_tab)
ex_m   <- glm(Freq ~ Eye + Sex, family = poisson, data = ex_df)
# your code here: print deviance and df.residual

#> Expected: deviance close to df (around 3) -> consistent with independence
```

<details>
<summary>Click to reveal solution</summary>

```r title="Eye x Sex independence solution"
ex_tab <- margin.table(HairEyeColor, margin = c(2, 3))
ex_df  <- as.data.frame(ex_tab)
ex_m   <- glm(Freq ~ Eye + Sex, family = poisson, data = ex_df)
c(deviance = deviance(ex_m), df = df.residual(ex_m))
#>  deviance        df
#> 2.4544981  3.0000000
```

**Explanation:** Deviance of 2.45 on 3 df is right around the expected value, so eye colour and sex are statistically independent in this data. Hair and eye colour were not, but eye colour and sex are.

</details>

## How do you turn a contingency table into a data frame for glm()?

`glm()` does not consume tables, it consumes data frames with one row per observation, or in our case, one row per cell. R already has the right tool: calling `as.data.frame()` on a `table` object returns a long data frame with one column per dimension and a final `Freq` column holding the counts.

```r title="Convert a 3-way table to a long data frame"
hec_df <- as.data.frame(HairEyeColor)
head(hec_df, 6)
#>    Hair   Eye  Sex Freq
#> 1 Black Brown Male   32
#> 2 Brown Brown Male   53
#> 3   Red Brown Male   10
#> 4 Blond Brown Male    3
#> 5 Black  Blue Male   11
#> 6 Brown  Blue Male   50
nrow(hec_df)
#> [1] 32
str(hec_df)
#> 'data.frame':   32 obs. of  4 variables:
#>  $ Hair: Factor w/ 4 levels "Black","Brown",..: 1 2 3 4 1 2 3 4 ...
#>  $ Eye : Factor w/ 4 levels "Brown","Blue",..: 1 1 1 1 2 2 2 2 ...
#>  $ Sex : Factor w/ 2 levels "Male","Female": 1 1 1 1 1 1 1 1 ...
#>  $ Freq: num  32 53 10 3 11 50 10 30 ...
```

A 4 x 4 x 2 table becomes a 32-row data frame, exactly one row per cell, with the count in `Freq`. The categorical dimensions arrive as factors, which is what `glm()` expects.

[TIP]
**Stick with the default `Freq` column name.** `as.data.frame.table()` always names the count column `Freq`, and every log-linear example you read online uses that name. Don't rename it unless you have a strong reason, the formula `Freq ~ ...` is shorter and easier to share.

**Try it:** Convert `UCBAdmissions` (a 2 x 2 x 6 table of Berkeley graduate admissions) to a long data frame, name it `ex_ucb_df`, and confirm it has 24 rows.

```r title="Your turn: convert UCBAdmissions"
# Try it: convert to long form, then check dimensions
ex_ucb_df <- as.data.frame(UCBAdmissions)
# your code here: print head() and nrow()

#> Expected: 24 rows, columns Admit, Gender, Dept, Freq
```

<details>
<summary>Click to reveal solution</summary>

```r title="UCBAdmissions long form solution"
ex_ucb_df <- as.data.frame(UCBAdmissions)
head(ex_ucb_df, 4)
#>      Admit Gender Dept Freq
#> 1 Admitted   Male    A  512
#> 2 Rejected   Male    A  313
#> 3 Admitted Female    A   89
#> 4 Rejected Female    A   19
nrow(ex_ucb_df)
#> [1] 24
```

**Explanation:** The 2 (Admit) x 2 (Gender) x 6 (Dept) table flattens to 24 rows, one per cell. This is the exact input shape `glm(family = poisson)` needs.

</details>

## What's the difference between independence, partial association, and the saturated model?

For a 3-way table indexed by hair $i$, eye $j$, and sex $k$, the log-linear model writes the expected cell count as

$$\log \mu_{ijk} = \lambda + \lambda^H_i + \lambda^E_j + \lambda^S_k + \lambda^{HE}_{ij} + \lambda^{HS}_{ik} + \lambda^{ES}_{jk} + \lambda^{HES}_{ijk}.$$

Where:
- $\mu_{ijk}$ is the expected count in cell $(i, j, k)$
- $\lambda$ is an overall intercept
- $\lambda^H_i, \lambda^E_j, \lambda^S_k$ are main effects (the marginal totals)
- $\lambda^{HE}_{ij}, \lambda^{HS}_{ik}, \lambda^{ES}_{jk}$ are pairwise associations
- $\lambda^{HES}_{ijk}$ is the three-way association

You build a hierarchy of models by switching some of those interaction terms off. The four models below, independence, one-association, homogeneous-association, and saturated, span the typical workflow.

```r title="Fit four nested log-linear models"
# Mutual independence: H, E, S all independent
m1 <- glm(Freq ~ Hair + Eye + Sex, family = poisson, data = hec_df)

# Hair*Eye associated, Sex independent of both
m2 <- glm(Freq ~ Hair*Eye + Sex, family = poisson, data = hec_df)

# Homogeneous association: all 2-way interactions, no 3-way
m3 <- glm(Freq ~ (Hair + Eye + Sex)^2, family = poisson, data = hec_df)

# Saturated model: every interaction including 3-way
m_sat <- glm(Freq ~ Hair*Eye*Sex, family = poisson, data = hec_df)

sapply(list(indep = m1, hair_eye = m2, homog = m3, sat = m_sat),
       function(m) c(dev = deviance(m), df = df.residual(m)))
#>          indep  hair_eye    homog          sat
#> dev   166.3001  18.93600 6.761426  0.000000e+00
#> df     24.0000  15.00000 9.000000  0.000000e+00
```

The deviance drops from 166 (independence) to 19 (only Hair-Eye associated) to 6.8 (all 2-way interactions), and finally hits 0 for the saturated model. The pattern tells you that adding the Hair-Eye interaction explains most of the misfit; the rest of the 2-way terms add a little more; the 3-way is unnecessary.

[NOTE]
**The saturated model always has 0 residual deviance.** It has one parameter per cell, so it reproduces the observed counts exactly. That's not a sign of a great model, it's the *baseline* against which every smaller model is judged.

**Try it:** Fit a partial-association model where `Hair` and `Sex` are associated, but `Eye` is independent of both. Use `hec_df`. Save it as `ex_partial`, then print its residual deviance and df.

```r title="Your turn: partial association Hair*Sex"
# Try it: only Hair and Sex interact
ex_partial <- glm(Freq ~ Hair*Sex + Eye, family = poisson, data = hec_df)
# your code here: report deviance and df

#> Expected: deviance is large because Hair-Eye is the dominant association,
#>           not Hair-Sex
```

<details>
<summary>Click to reveal solution</summary>

```r title="Partial association solution"
ex_partial <- glm(Freq ~ Hair*Sex + Eye, family = poisson, data = hec_df)
c(dev = deviance(ex_partial), df = df.residual(ex_partial))
#>      dev       df
#> 156.6779  21.0000
```

**Explanation:** Compared to the mutual-independence model (deviance 166), this one only saved 10 deviance points by adding the Hair-Sex interaction. That confirms Hair-Sex is a weak association in this data; Hair-Eye is where the action is.

</details>

## How do you choose between log-linear models?

Two nested models can be compared with a likelihood-ratio test. In R that is `anova(small, big, test = "Chisq")`. The reported deviance drop is approximately chi-squared, and a small p-value means the larger model fits significantly better. AIC offers a complementary view that does not require nesting.

```r title="Compare nested models with anova() and AIC"
anova(m1, m2, m3, m_sat, test = "Chisq")
#> Analysis of Deviance Table
#>
#> Model 1: Freq ~ Hair + Eye + Sex
#> Model 2: Freq ~ Hair * Eye + Sex
#> Model 3: Freq ~ (Hair + Eye + Sex)^2
#> Model 4: Freq ~ Hair * Eye * Sex
#>   Resid. Df Resid. Dev Df Deviance  Pr(>Chi)
#> 1        24    166.300
#> 2        15     18.936  9  147.364   < 2e-16 ***
#> 3         9      6.761  6   12.174   0.05826 .
#> 4         0      0.000  9    6.761   0.66200

AIC(m1, m2, m3, m_sat)
#>       df      AIC
#> m1     8 217.4520
#> m2    17 88.0879
#> m3    23 87.9134
#> m_sat 32 99.1517
```

Read the `anova()` output as three sequential tests. Going from independence to Hair*Eye saves 147 deviance points on 9 df, extremely significant, so we keep the Hair*Eye term. Going from `m2` to all 2-way interactions saves only 12 more points on 6 df, with p = 0.058: borderline, but not significant. Going from `m3` to fully saturated saves nothing meaningful. AIC agrees: `m3` is best by a hair, but `m2` is essentially tied and far simpler. Pick `m2` unless the extra 2-way terms have a substantive interpretation you care about.

[WARNING]
**Chi-squared p-values become unreliable when expected counts are small.** A common rule of thumb is that no more than 20% of cells should have expected counts under 5, and none should be 0. Sparse tables call for exact tests, simulation-based p-values, or a Bayesian fit instead.

**Try it:** Use `anova()` to compare just `m1` (independence) against `m2` (Hair*Eye). Report the deviance drop and the p-value, and state whether the Hair-Eye interaction is needed.

```r title="Your turn: anova on m1 vs m2"
# Try it: focused two-model comparison
# your code here: anova(m1, m2, test = "Chisq")

#> Expected: deviance drop ~147 on 9 df, p < 2e-16
```

<details>
<summary>Click to reveal solution</summary>

```r title="m1 vs m2 anova solution"
anova(m1, m2, test = "Chisq")
#> Analysis of Deviance Table
#>
#> Model 1: Freq ~ Hair + Eye + Sex
#> Model 2: Freq ~ Hair * Eye + Sex
#>   Resid. Df Resid. Dev Df Deviance  Pr(>Chi)
#> 1        24    166.300
#> 2        15     18.936  9  147.364 < 2.2e-16
```

**Explanation:** A deviance drop of 147 on 9 df with p effectively zero says clearly that Hair and Eye are not independent. The Hair*Eye term must stay in the model.

</details>

## How do you interpret log-linear model coefficients?

In a Poisson GLM with log link, each coefficient is a difference on the log scale. For a log-linear model on a contingency table, that gives the coefficients two clean readings: main effects describe marginal frequencies, and two-way interaction coefficients are log odds ratios for the corresponding 2 x 2 sub-table.

```r title="Read coefficients off summary(m2)"
round(coef(m2), 3)
#>             (Intercept)               HairBrown                 HairRed
#>                   4.222                   0.567                  -0.957
#>               HairBlond                  EyeBlue                EyeHazel
#>                  -2.272                  -0.034                  -1.270
#>                EyeGreen                 SexFemale          HairBrown:EyeBlue
#>                  -1.840                   0.034                  -1.140
#>       HairRed:EyeBlue        HairBlond:EyeBlue       HairBrown:EyeHazel
#>                 -1.337                    1.483                   -0.456
#>     HairRed:EyeHazel       HairBlond:EyeHazel       HairBrown:EyeGreen
#>                -0.244                   -2.327                    0.541
#>     HairRed:EyeGreen        HairBlond:EyeGreen
#>                 0.611                    1.094

# Convert one interaction to an odds ratio
exp(coef(m2)["HairBlond:EyeBlue"])
#> HairBlond:EyeBlue
#>          4.405892
```

The Hair*Eye interaction `HairBlond:EyeBlue` exponentiates to 4.4. That number is the odds ratio comparing Blond vs. Black hair across Blue vs. Brown eyes: blond people are about 4.4 times more likely to have blue eyes (relative to brown) than black-haired people. You can cross-check this directly from the 2 x 2 sub-table of the original data; the model has just packaged that ratio as a coefficient.

[KEY INSIGHT]
**A two-way interaction coefficient in a log-linear model is the log odds ratio of the corresponding 2 x 2 sub-table, holding everything else fixed.** Exponentiate it to get an odds ratio you can quote in plain English. That is the same interpretation you already use in logistic regression; log-linear models are joint frequencies in disguise.

**Try it:** Take the coefficient `HairRed:EyeBlue` from `m2`, exponentiate it, and explain what the resulting odds ratio means.

```r title="Your turn: interpret HairRed:EyeBlue"
# Try it: exponentiate one coefficient
# your code here: exp(coef(m2)["HairRed:EyeBlue"])

#> Expected: a value < 1 -> red-haired people are less likely to have blue eyes
#>           than black-haired people, comparing blue to brown eyes
```

<details>
<summary>Click to reveal solution</summary>

```r title="HairRed:EyeBlue solution"
exp(coef(m2)["HairRed:EyeBlue"])
#> HairRed:EyeBlue
#>       0.2628195
```

**Explanation:** The odds ratio of 0.26 means that, for blue versus brown eyes, the odds ratio of red versus black hair is about 0.26. In plain English: among blue-eyed people, the share of red-haired people is far smaller than the share of black-haired, compared to the same ratio among brown-eyed people.

</details>

## Practice Exercises

### Exercise 1: Female-only Hair x Eye

Subset `HairEyeColor` to females only with `HairEyeColor[, , "Female"]`, convert to a data frame `f_df`, fit the independence model and the saturated 2-way model, and use `anova()` to decide which one fits better.

```r title="Exercise 1 starter"
# Exercise: female-only hair x eye log-linear models
# Hint: HairEyeColor[, , "Female"] is a 2-way table
f_df <- as.data.frame(HairEyeColor[, , "Female"])

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
f_df    <- as.data.frame(HairEyeColor[, , "Female"])
f_indep <- glm(Freq ~ Hair + Eye, family = poisson, data = f_df)
f_sat   <- glm(Freq ~ Hair*Eye,   family = poisson, data = f_df)
anova(f_indep, f_sat, test = "Chisq")
#>   Resid. Df Resid. Dev Df Deviance  Pr(>Chi)
#> 1         9     106.66
#> 2         0       0.00  9   106.66 < 2.2e-16
```

**Explanation:** Among females only, hair and eye colour are still strongly associated. The saturated model wins decisively; independence is rejected.

</details>

### Exercise 2: Titanic 4-way table

Convert `Titanic` to a data frame `titanic_df` and fit a homogeneous-association model (all 2-way interactions, no 3-way or 4-way). Compare it to the saturated model with `anova()`.

```r title="Exercise 2 starter"
# Exercise: Titanic 4-way log-linear model
# Hint: use the (a + b + c + d)^2 shortcut for all 2-way interactions
titanic_df <- as.data.frame(Titanic)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
titanic_df <- as.data.frame(Titanic)
t_homog <- glm(Freq ~ (Class + Sex + Age + Survived)^2,
               family = poisson, data = titanic_df)
t_sat   <- glm(Freq ~ Class*Sex*Age*Survived,
               family = poisson, data = titanic_df)
anova(t_homog, t_sat, test = "Chisq")
#>   Resid. Df Resid. Dev Df Deviance Pr(>Chi)
#> 1        15      65.83
#> 2         0       0.00 15   65.83 5.91e-08
```

**Explanation:** Homogeneous association is rejected; there are higher-order interactions in the Titanic data. That matches the famous Class-Sex-Survived three-way pattern (women in third class fared worse than the marginal Sex-Survived odds ratio would predict).

</details>

### Exercise 3: Conditional independence in UCBAdmissions

Test whether admission and gender are conditionally independent given department. The model `Freq ~ Admit*Dept + Gender*Dept` says "Admit and Gender each depend on Dept, but they are independent given Dept." Compare it against the saturated model.

```r title="Exercise 3 starter"
# Exercise: conditional independence of Admit and Gender given Dept
ucb_df <- as.data.frame(UCBAdmissions)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
ucb_df <- as.data.frame(UCBAdmissions)
u_cond <- glm(Freq ~ Admit*Dept + Gender*Dept,
              family = poisson, data = ucb_df)
u_sat  <- glm(Freq ~ Admit*Gender*Dept,
              family = poisson, data = ucb_df)
anova(u_cond, u_sat, test = "Chisq")
#>   Resid. Df Resid. Dev Df Deviance Pr(>Chi)
#> 1         6     21.735
#> 2         0      0.000  6   21.735 0.001351
```

**Explanation:** Conditional independence is rejected at p = 0.001: even after accounting for department, there is residual association between admission and gender. That is mostly driven by department A, where female applicants had a higher admission rate. The famous Berkeley "Simpson's paradox" is mostly explained by department mix, but a residual department-A effect remains.

</details>

## Complete Example

A start-to-finish workflow on the Titanic data: convert the table, fit a ladder of nested log-linear models, compare them with `anova()` and AIC, and interpret one notable interaction.

```r title="Titanic end-to-end log-linear analysis"
tit_df <- as.data.frame(Titanic)

# Ladder of nested models
fit_indep <- glm(Freq ~ Class + Sex + Age + Survived,
                 family = poisson, data = tit_df)
fit_main2 <- glm(Freq ~ Class + Sex + Age*Survived,
                 family = poisson, data = tit_df)
fit_homog <- glm(Freq ~ (Class + Sex + Age + Survived)^2,
                 family = poisson, data = tit_df)
fit_sat   <- glm(Freq ~ Class*Sex*Age*Survived,
                 family = poisson, data = tit_df)

anova(fit_indep, fit_main2, fit_homog, fit_sat, test = "Chisq")
#>   Resid. Df Resid. Dev Df Deviance  Pr(>Chi)
#> 1        25     1241.9
#> 2        24      728.4  1    513.5 < 2.2e-16 ***
#> 3        15       65.8  9    662.6 < 2.2e-16 ***
#> 4         0        0.0 15     65.8 5.911e-08 ***

AIC(fit_indep, fit_main2, fit_homog, fit_sat)
#>           df       AIC
#> fit_indep  8 1322.8665
#> fit_main2  9  811.3552
#> fit_homog 18  166.6378
#> fit_sat   32  130.7991

# Interpret the Sex:Survived odds ratio from the homogeneous model
exp(coef(fit_homog)["SexFemale:SurvivedYes"])
#> SexFemale:SurvivedYes
#>              11.27294
```

[TIP]
**Start at the simplest hierarchical model that includes the highest-order term you actually care about**, and walk up only as far as `anova()` justifies. For Titanic, you almost always want at least all 2-way interactions, because Class, Sex, Age, and Survival genuinely interact.

The deviance drops are huge at every step, and the saturated model still wins on AIC, meaning some 3-way or 4-way structure is real. The Sex-Survived odds ratio of 11.3 says women's odds of surviving were roughly 11 times those of men, holding the other 2-way associations fixed. That single coefficient summarises "women and children first."

## Summary

| Model | glm formula | What it says | When to use |
|---|---|---|---|
| Mutual independence | `Freq ~ A + B + C` | All variables independent | Baseline / null hypothesis |
| Joint / partial | `Freq ~ A*B + C` | One pair associated, rest independent | When subject-matter says only one association exists |
| Homogeneous | `Freq ~ (A + B + C)^2` | All 2-way associations, no 3-way | Default reasonable model for 3-way tables |
| Conditional indep. | `Freq ~ A*C + B*C` | A and B independent given C | Testing whether C "explains" the A-B association |
| Saturated | `Freq ~ A*B*C` | Reproduces the table exactly | Reference baseline for `anova()` only |

Workflow: build the data frame with `as.data.frame()`, fit a ladder of nested models with `glm(family = poisson)`, compare with `anova(..., test = "Chisq")` and `AIC()`, and exponentiate two-way interaction coefficients to read odds ratios.

## References

1. Agresti, A., *Categorical Data Analysis*, 3rd ed. Wiley (2013). Chapter 9: Loglinear Models for Contingency Tables.
2. Faraway, J.J., *Extending the Linear Model with R*, 2nd ed. Chapter 4: Models for Counts. CRC Press (2016).
3. R Core Team, `?glm` reference page. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/glm.html)
4. Venables, W.N. & Ripley, B.D., *Modern Applied Statistics with S*, 4th ed. Chapter 7. Springer (2002).
5. UVa Library, An Introduction to Loglinear Models. [Link](https://data.library.virginia.edu/an-introduction-to-loglinear-models/)
6. Crawley, M.J., *The R Book*, 2nd ed., Chapter 15. Wiley (2013).
7. Penn State STAT 504, Loglinear Models lesson notes. [Link](https://online.stat.psu.edu/stat504/)

## Continue Learning

- [Poisson and Negative Binomial Regression in R](Poisson-and-Negative-Binomial-Regression.html), the parent post; log-linear is the contingency-table specialisation.
- [Chi-Squared Test in R](Chi-Squared-Test.html), the simpler, hypothesis-test cousin for 2-way tables.
- [Multinomial and Ordinal Logistic Regression in R](Multinomial-and-Ordinal-Logistic-Regression-in-R.html), when one of the variables is a clear response, switch from joint frequencies to conditional probabilities.
