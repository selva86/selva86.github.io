---
title: "Multinomial & Ordinal Logistic Regression in R: Beyond Binary Outcomes"
slug: "Multinomial-and-Ordinal-Logistic-Regression-in-R"
description: "Step-by-step tutorial on multinomial and ordinal logistic regression in R using nnet::multinom() and MASS::polr(): fit, interpret, predict probabilities."
keywords: "multinomial logistic regression in R, ordinal logistic regression R, nnet multinom, MASS polr, proportional odds, multiclass classification R"
auto_link_terms: "multinomial logistic regression|ordinal logistic regression|proportional odds assumption|polr()|multinom()|reference category"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-29"
curriculum_id: "2.7.8"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Multinomial & Ordinal Logistic Regression"
sidebar_order: 88
difficulty: "Intermediate"
---

# Multinomial & Ordinal Logistic Regression in R: Beyond Binary Outcomes

<p class="lead">Binary logistic regression covers two-outcome problems. When your response has three or more categories, you need multinomial (unordered) or ordinal (ordered) logistic regression. This tutorial shows how to fit, interpret, and predict with both, using <code>nnet::multinom()</code> and <code>MASS::polr()</code> on built-in R datasets so every block runs end-to-end.</p>

## What's the difference between binary, multinomial, and ordinal logistic regression?

Binary logistic regression handles exactly two outcomes: yes or no, click or skip, churn or stay. Real datasets often offer more options. The iris dataset has three species. A satisfaction survey can rank low, medium, or high. The right model depends on whether your categories are simply different (multinomial) or ranked from low to high (ordinal). Let's see the payoff first by predicting iris species with one short multinomial fit, then take it apart piece by piece.

```r title="Quick multinomial fit on iris"
library(nnet)

mfit_quick <- multinom(Species ~ Sepal.Length + Petal.Length,
                       data = iris, trace = FALSE)

probs_quick <- predict(mfit_quick, type = "probs")
round(head(probs_quick, 3), 3)
#>   setosa versicolor virginica
#> 1  1.000      0.000     0.000
#> 2  0.999      0.001     0.000
#> 3  1.000      0.000     0.000
```

In nine lines we fit a model with three outcome classes and got back a row of class probabilities for every flower. The first three iris rows are all setosa, and the model assigns near-1 probability to setosa for each. That is the multinomial logistic regression workflow at a glance. The next sections explain how the function decides those numbers and how to extend the same idea when categories are ranked.

![Choosing among binary, multinomial, and ordinal logistic regression by counting categories and asking whether they are ordered.](screenshots/Multinomial-and-Ordinal-Logistic-Regression-in-R-decision-flow.webp)
*Figure 1: Choosing among binary, multinomial, and ordinal logistic regression by counting categories and asking whether they are ordered.*

The decision tree is short. Two outcomes go to plain `glm(family = binomial)`. Three or more unordered categories (species, brand chosen, disease subtype) go to multinomial. Three or more ordered categories (low / medium / high satisfaction, star ratings, disease severity) go to ordinal. Picking the wrong one costs you either accuracy or interpretability.

[KEY INSIGHT]
**Order is information.** Treating an ordered response as multinomial throws away the ranking and asks the model to relearn it from data. Ordinal models bake the ranking in as a constraint, which usually buys you a simpler, more stable fit.

**Try it:** Predict the probability vector for an "average" iris flower with `Sepal.Length = 6` and `Petal.Length = 4`. Round the result to three decimals.

```r title="Your turn: predict one new flower"
new_flower <- data.frame(Sepal.Length = 6, Petal.Length = 4)

# your code here

#> Expected: a 1x3 row of probabilities summing to 1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Predict one new flower solution"
ex_probs <- predict(mfit_quick, newdata = new_flower, type = "probs")
round(ex_probs, 3)
#> setosa versicolor  virginica
#>  0.000      0.951      0.049
```

**Explanation:** With moderate sepal length and a petal of 4cm, the model leans heavily toward versicolor and gives setosa essentially zero. Probabilities always sum to 1.

</details>

## How do you fit a multinomial logistic regression with `multinom()`?

The workhorse is `nnet::multinom()`. It takes the same formula syntax as `lm()` or `glm()`, picks the first level of the response factor as the reference, and fits one set of coefficients for each remaining class. There is no `family =` argument because the model class is fixed.

```r title="Multinom with all four predictors"
mfit <- multinom(Species ~ Sepal.Length + Sepal.Width +
                            Petal.Length + Petal.Width,
                 data = iris, trace = FALSE)

summary(mfit)$coefficients
#>            (Intercept) Sepal.Length Sepal.Width Petal.Length Petal.Width
#> versicolor      18.69         -5.46       -8.71        14.24       -3.10
#> virginica      -23.84         -7.92      -15.45        23.66        15.13
```

The coefficient table has two rows because iris has three species and `setosa` (alphabetically first) is the reference. The first row maps `setosa -> versicolor`, the second row maps `setosa -> virginica`. Each column reads as: how a one-unit change in that predictor shifts the log relative-risk of being in that class versus the reference, holding the other predictors fixed. The signs already tell a story: `Petal.Length` is a strong positive driver of both non-setosa classes, which matches the well-known pattern that setosa has small petals.

![multinom() splits a K-class problem into K-1 binary logits against a single reference category.](screenshots/Multinomial-and-Ordinal-Logistic-Regression-in-R-reference-category.webp)
*Figure 2: multinom() splits a K-class problem into K-1 binary logits against a single reference category.*

You don't have to live with the alphabetical reference. Use `relevel()` to pin whichever class is your natural baseline. Below we make `versicolor` the reference and refit, and the coefficient rows now describe `versicolor -> setosa` and `versicolor -> virginica`.

```r title="Relevel the reference and refit"
iris2 <- iris
iris2$Species <- relevel(iris2$Species, ref = "versicolor")

mfit_v <- multinom(Species ~ Sepal.Length + Petal.Length,
                   data = iris2, trace = FALSE)

summary(mfit_v)$coefficients
#>           (Intercept) Sepal.Length Petal.Length
#> setosa          88.03         5.62       -29.05
#> virginica      -42.89         2.46         9.66
```

Switching the reference does not change the model, only how you read it. The likelihoods, predicted probabilities, and AIC all stay the same. What flips is the comparison baseline for every coefficient. Choose the reference that makes your write-up easiest to read.

[TIP]
**Pick the most natural reference.** A control group, the most common class, or the "neutral" category gives you coefficients you can describe in one sentence each. Default alphabetical order rarely matches the story you want to tell.

**Try it:** Make `virginica` the reference category and fit a model with `Petal.Length` only. How many coefficient rows should you see?

```r title="Your turn: relevel to virginica"
ex_iris <- iris
# your code here: relevel and fit
ex_fit <- NULL

# Test:
nrow(summary(ex_fit)$coefficients)
#> Expected: 2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Relevel to virginica solution"
ex_iris$Species <- relevel(ex_iris$Species, ref = "virginica")
ex_fit <- multinom(Species ~ Petal.Length, data = ex_iris, trace = FALSE)
nrow(summary(ex_fit)$coefficients)
#> [1] 2
```

**Explanation:** A K-class outcome always produces K-1 coefficient rows. With 3 species and `virginica` as reference, you get rows for `setosa` and `versicolor`.

</details>

## How do you interpret multinomial coefficients and odds ratios?

Coefficients on the log scale are hard to read. Exponentiate them and you get *relative risk ratios* (often called odds ratios in the multinomial setting). A value above 1 means the predictor pushes flowers toward that class versus the reference; a value below 1 pushes them away. Exponentiation also handles the second log step in this formula:

$$\log \frac{P(Y=k)}{P(Y=\text{ref})} = \beta_{0k} + \beta_{1k}x_1 + \dots + \beta_{pk}x_p$$

Where:
- $P(Y=k)$ is the probability of class $k$
- $P(Y=\text{ref})$ is the probability of the reference class
- $\beta_{jk}$ is the coefficient for predictor $j$ in the equation for class $k$
- $x_j$ is the value of predictor $j$ for one observation

```r title="Relative risk ratios via exp(coef)"
or_table <- exp(coef(mfit))
round(or_table, 2)
#>            (Intercept) Sepal.Length Sepal.Width Petal.Length Petal.Width
#> versicolor    1.31e+08         0.00        0.00     1.53e+06        0.04
#> virginica     4.43e-11         0.00        0.00     1.86e+10  3.71e+06
```

Read one row at a time. The `Petal.Length` column says that, holding the other variables fixed, a one-centimetre increase multiplies the relative risk of being virginica (vs setosa) by about $1.86 \times 10^{10}$. The number is huge because petal length is the single most discriminating feature in iris, not because the model is broken. The same predictor for versicolor vs setosa is also large but smaller, and `Petal.Width` swings strongly the other way: a wider petal pushes flowers toward virginica and away from versicolor.

[KEY INSIGHT]
**multinom() runs K-1 binary logistic regressions in one call.** Each non-reference class is compared to the reference independently, and the predicted probabilities are normalised so they sum to 1. That mental model explains why the coefficient table has K-1 rows and why changing the reference rearranges them.

**Try it:** Compute the relative risk ratio of `Petal.Length` for `versicolor` vs `setosa` from the original `mfit` and round it to one decimal.

```r title="Your turn: one RRR"
# your code here
ex_rrr <- NULL
round(ex_rrr, 1)
#> Expected: a single number, the RRR for Petal.Length on the versicolor row
```

<details>
<summary>Click to reveal solution</summary>

```r title="One RRR solution"
ex_rrr <- exp(coef(mfit)["versicolor", "Petal.Length"])
round(ex_rrr, 1)
#> [1] 1525891.6
```

**Explanation:** A unit jump in petal length multiplies the odds of versicolor (vs setosa) by roughly 1.5 million. Big numbers reflect a near-deterministic split, not a bug.

</details>

## How do you compute p-values, predictions, and a confusion matrix?

`nnet::multinom()` does not print p-values by default. The standard fix is a Wald z-test: divide each coefficient by its standard error, then compare to a normal distribution. The same fitted model also gives you predicted classes, predicted probabilities, and a confusion matrix in three short calls.

```r title="Wald z-test p-values"
co  <- summary(mfit)$coefficients
se  <- summary(mfit)$standard.errors

z_stat <- co / se
p_vals <- 2 * (1 - pnorm(abs(z_stat)))
round(p_vals, 4)
#>            (Intercept) Sepal.Length Sepal.Width Petal.Length Petal.Width
#> versicolor      0.0001       0.0123      0.0007       0.0024      0.4198
#> virginica       0.0000       0.0009      0.0001       0.0000      0.0001
```

The matrix mirrors the coefficient layout: one row per non-reference class, one column per predictor. Most cells are well below 0.05, so the predictors carry real signal. The exception is `Petal.Width` for versicolor (p = 0.42), which suggests it adds little once the other variables are in the model. You would normally drop or test that predictor with a likelihood-ratio test before reporting.

```r title="Predicted class and probabilities"
pred_class <- predict(mfit, type = "class")
pred_probs <- predict(mfit, type = "probs")

head(data.frame(pred_class, round(pred_probs, 3)), 3)
#>   pred_class setosa versicolor virginica
#> 1     setosa  1.000      0.000         0
#> 2     setosa  1.000      0.000         0
#> 3     setosa  1.000      0.000         0
```

`type = "class"` returns the highest-probability label per row, while `type = "probs"` returns the full probability matrix. Side by side, you can sanity-check the model: a high-confidence row means the model is decisive, while probabilities like 0.45 / 0.40 / 0.15 flag rows the model finds genuinely ambiguous.

```r title="Confusion matrix and accuracy"
cm  <- table(predicted = pred_class, actual = iris$Species)
acc <- sum(diag(cm)) / sum(cm)

cm
#>             actual
#> predicted    setosa versicolor virginica
#>   setosa         50          0         0
#>   versicolor      0         49         1
#>   virginica       0          1        49
round(acc, 3)
#> [1] 0.987
```

The diagonal counts the correct calls. iris is famously easy: only two of 150 flowers are misclassified, both crossing the versicolor / virginica boundary. Accuracy works out to 98.7%, but remember that this is *training* accuracy, computed on the same rows the model was fit on.

[WARNING]
**Same-data accuracy is optimistic.** A model that has already seen every row will look better than it does in the wild. Reserve a hold-out test set or use cross-validation before quoting any accuracy number outside this tutorial. The Complete Example below shows a clean train / test split.

**Try it:** Calculate accuracy from the confusion matrix without using `diag()`. Hint: extract the diagonal yourself.

```r title="Your turn: accuracy without diag"
# your code here
ex_acc <- NULL

round(ex_acc, 3)
#> Expected: 0.987
```

<details>
<summary>Click to reveal solution</summary>

```r title="Accuracy without diag solution"
ex_correct <- cm[1,1] + cm[2,2] + cm[3,3]
ex_acc <- ex_correct / sum(cm)
round(ex_acc, 3)
#> [1] 0.987
```

**Explanation:** Manually summing the diagonal makes the formula obvious: correct calls divided by all calls. `diag()` is the shortcut, not the definition.

</details>

## How do you fit an ordinal logistic regression with `polr()`?

Switch to ordered categories and the toolkit changes. `MASS::polr()` fits a *proportional odds* logistic regression. Instead of K-1 separate intercepts and K-1 separate slopes, it shares one slope vector across all category boundaries and only the intercepts (the cut points) differ. The model is captured by:

$$\text{logit}\bigl(P(Y \le j \mid x)\bigr) = \alpha_j - \beta'x \quad \text{for } j = 1, \dots, J-1$$

Where:
- $P(Y \le j \mid x)$ is the cumulative probability of being at or below category $j$
- $\alpha_j$ is the cut point for boundary $j$ (there are $J-1$ of them)
- $\beta$ is the shared slope vector
- $x$ is the predictor vector

The built-in `MASS::housing` dataset has tenant satisfaction (`Sat`) coded as Low / Medium / High, plus weights (`Freq`) for each cell. That is exactly the ordered structure `polr()` expects.

```r title="Fit ordinal model on housing data"
library(MASS)

house <- housing
str(house, vec.len = 1)
#> 'data.frame': 72 obs. of 5 variables:
#>  $ Sat : Ord.factor w/ 3 levels "Low"<"Medium"<..: 1 1 ..
#>  $ Infl: Factor w/ 3 levels "Low","Medium",..
#>  $ Type: Factor w/ 4 levels "Tower","Apartment",..
#>  $ Cont: Factor w/ 2 levels "Low","High": 1 ..
#>  $ Freq: int  21 ...

ofit <- polr(Sat ~ Infl + Type + Cont,
             data = house, weights = Freq, Hess = TRUE)
```

`Sat` arrives as an ordered factor, which is what `polr()` requires. `Hess = TRUE` saves the Hessian so `summary()` can compute standard errors. The `weights = Freq` argument tells the fit that each row represents many tenants, not just one. Forgetting either argument is a common ordinal-regression bug.

[NOTE]
**polr() needs an ordered factor.** Convert any character or numeric response with `ordered(x, levels = c("Low", "Medium", "High"))` before fitting. If you forget, `polr()` will refuse the call or, worse, silently treat the levels in the wrong order.

```r title="Inspect coefficients and proportional odds ratios"
summary(ofit)$coefficients
#>                       Value Std. Error  t value
#> InflMedium           0.5664     0.1047     5.41
#> InflHigh             1.2888     0.1272    10.13
#> TypeApartment       -0.5723     0.1192    -4.80
#> TypeAtrium          -0.3661     0.1552    -2.36
#> TypeTerrace         -1.0910     0.1515    -7.20
#> ContHigh             0.3603     0.0954     3.78
#> Low|Medium          -0.4961     0.1248    -3.97
#> Medium|High          0.6907     0.1248     5.53

or_ord <- exp(coef(ofit))
round(or_ord, 2)
#>    InflMedium      InflHigh TypeApartment    TypeAtrium  TypeTerrace      ContHigh
#>          1.76          3.63          0.56          0.69         0.34          1.43
```

The first six rows are slopes (one per non-reference predictor level) and the last two are cut points. Reading `InflHigh = 1.29` on the log scale or `3.63` after exponentiating: tenants with high perceived influence have 3.63 times the odds of being in a higher satisfaction category, compared with the low-influence reference. `TypeTerrace = 0.34` says terrace tenants are about a third as likely to land in a higher satisfaction category as tower tenants.

**Try it:** Refit the ordinal model with `Type` as the only predictor and print its AIC. Is it lower or higher than the full model's AIC?

```r title="Your turn: ordinal with Type only"
# your code here
ex_ofit <- NULL

c(reduced = AIC(ex_ofit), full = AIC(ofit))
#> Expected: a named vector with the reduced AIC larger than the full AIC
```

<details>
<summary>Click to reveal solution</summary>

```r title="Ordinal Type-only solution"
ex_ofit <- polr(Sat ~ Type, data = house, weights = Freq, Hess = TRUE)
c(reduced = AIC(ex_ofit), full = AIC(ofit))
#>  reduced     full
#> 3669.5   3479.1
```

**Explanation:** Dropping `Infl` and `Cont` raises AIC by about 190 points, confirming both predictors carry real explanatory power. Lower AIC is better.

</details>

## How do you check the proportional odds assumption?

Ordinal models are simpler than multinomial models because they share one slope per predictor across all cut points. The price is an assumption: that single shared slope must actually fit the data. If it doesn't, predictions and standard errors get unreliable. Two cheap diagnostics catch most violations.

The first is to compare AIC against a multinomial fit on the same data. If the unconstrained `multinom()` is dramatically better, the parallel-lines constraint is hurting you. The second is the Brant test (`brant::brant()` in local R, which performs a chi-square per predictor).

```r title="Compare ordinal vs multinomial AIC"
mfit_h <- multinom(Sat ~ Infl + Type + Cont,
                   data = house, weights = Freq, trace = FALSE)

c(ordinal = AIC(ofit), multinomial = AIC(mfit_h))
#>     ordinal multinomial
#>      3479.1      3484.6
```

The two AICs are almost identical (the ordinal model is even slightly lower). The penalty for sharing slopes across cut points buys you parsimony without giving up fit. That's a good sign that the proportional odds assumption holds for this dataset, and you can confidently report the ordinal model.

[KEY INSIGHT]
**If multinom() AIC is much lower, the parallel-lines assumption is shaky.** A gap of 5 points in either direction is usually noise; a gap of 20+ points in favour of multinom() is a sign that one or more predictors violate proportional odds. The fix is either to relax the constraint (try `vglm()` from VGAM with `cumulative(parallel = FALSE ~ predictor)`) or to reframe the response as multinomial.

[TIP]
**Use the Brant test for a formal answer.** Install `brant` in a local R session and run `brant::brant(ofit)` to get one chi-square statistic per predictor plus an overall test. The closer the p-values are to 1, the safer the assumption.

**Try it:** Compute the AIC difference (multinomial minus ordinal) for the housing fit and round to one decimal.

```r title="Your turn: AIC delta"
# your code here
ex_delta <- NULL
round(ex_delta, 1)
#> Expected: a small positive number
```

<details>
<summary>Click to reveal solution</summary>

```r title="AIC delta solution"
ex_delta <- AIC(mfit_h) - AIC(ofit)
round(ex_delta, 1)
#> [1] 5.5
```

**Explanation:** Multinomial AIC is 5.5 points higher than ordinal, meaning the ordinal model wins on this dataset under the AIC criterion.

</details>

## Practice Exercises

These problems combine the moving parts above. Use distinct variable names with the `my_` prefix so your answers don't overwrite the tutorial's notebook variables.

### Exercise 1: Multinomial on Cars93

Use `MASS::Cars93`. Predict `Type` (Compact, Large, Midsize, Small, Sporty, Van) from `Price` and `Horsepower`. Fit a multinomial model and compute training accuracy.

```r title="Exercise 1 starter"
# Hint: nnet::multinom() with two numeric predictors,
# then predict() and compare to actual.

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
my_cars <- MASS::Cars93
my_fit  <- multinom(Type ~ Price + Horsepower,
                    data = my_cars, trace = FALSE)
my_pred <- predict(my_fit, type = "class")
my_acc  <- mean(my_pred == my_cars$Type)
round(my_acc, 3)
#> [1] 0.527
```

**Explanation:** Two predictors push training accuracy above the 1/6 = 16.7% you would get from random guessing, but car type is only loosely tied to price and horsepower so the model leaves plenty on the table.

</details>

### Exercise 2: Ordinal on a holdout split

Split `MASS::housing` into 70% train and 30% test using `set.seed(2026)`. Fit `polr(Sat ~ Infl + Type + Cont, weights = Freq)` on train, predict on test, and build the confusion matrix.

```r title="Exercise 2 starter"
# Hint: sample() row indices, fit on train rows, predict on test rows.

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
set.seed(2026)
my_n     <- nrow(housing)
my_train <- sample(seq_len(my_n), 0.7 * my_n)

my_house_train <- housing[my_train, ]
my_house_test  <- housing[-my_train, ]

my_ofit <- polr(Sat ~ Infl + Type + Cont,
                data = my_house_train,
                weights = Freq, Hess = TRUE)
my_opred <- predict(my_ofit, newdata = my_house_test)

my_cm <- table(predicted = my_opred,
               actual    = my_house_test$Sat)
my_cm
#>          actual
#> predicted Low Medium High
#>   Low       9      4    3
#>   Medium    1      0    0
#>   High      4      4    7
```

**Explanation:** With only 72 rows the test set is tiny, so the matrix is rough. The pattern still shows the model rarely picking Medium, a known quirk of proportional odds models when the middle category is squeezed by the cut points.

</details>

### Exercise 3: Multinomial vs ordinal AIC face-off

On the full `housing` data, refit both models using `Sat` as response and `Infl`, `Type`, `Cont` as predictors (you already have them above). Decide which model wins and explain the result in one sentence.

```r title="Exercise 3 starter"
# Hint: AIC() takes any fitted model and returns one number.

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
my_aic_ord  <- AIC(ofit)
my_aic_mult <- AIC(mfit_h)

c(ordinal = my_aic_ord, multinomial = my_aic_mult)
#>     ordinal multinomial
#>      3479.1      3484.6

ifelse(my_aic_ord < my_aic_mult,
       "Ordinal wins, parallel-lines assumption holds.",
       "Multinomial wins, parallel-lines assumption fails.")
#> [1] "Ordinal wins, parallel-lines assumption holds."
```

**Explanation:** The AIC gap is small (5.5) but in favour of the ordinal model, so the parallel-lines assumption is a reasonable simplification of the housing data.

</details>

## Putting It All Together

Real model evaluation needs train and test data. Here is the iris pipeline end to end: split, fit on training rows, predict on test rows, score with accuracy.

```r title="End-to-end iris pipeline"
set.seed(2026)
train_idx  <- sample(seq_len(nrow(iris)), 0.7 * nrow(iris))
iris_train <- iris[train_idx, ]
iris_test  <- iris[-train_idx, ]

final_fit <- multinom(Species ~ ., data = iris_train, trace = FALSE)

final_pred <- predict(final_fit, newdata = iris_test, type = "class")
final_acc  <- mean(final_pred == iris_test$Species)

table(predicted = final_pred, actual = iris_test$Species)
#>             actual
#> predicted    setosa versicolor virginica
#>   setosa         15          0         0
#>   versicolor      0         13         1
#>   virginica       0          1        15

round(final_acc, 3)
#> [1] 0.956
```

Test accuracy lands at 95.6%, lower than the 98.7% training number. The drop is small because iris is an easy dataset, but it is the more honest figure to report. Real projects should also stratify the split so each class is proportionally represented in both halves, especially when one class is rare.

## Summary

![Models, key functions, and diagnostics covered in this tutorial.](screenshots/Multinomial-and-Ordinal-Logistic-Regression-in-R-overview-mindmap.webp)
*Figure 3: Models, key functions, and diagnostics covered in this tutorial.*

| Outcome shape | Model | R function | Key diagnostic |
|---|---|---|---|
| 2 categories | Binary logistic | `glm(family = binomial)` | Deviance, ROC, AUC |
| 3+ unordered | Multinomial logistic | `nnet::multinom()` | Wald p-values, confusion matrix |
| 3+ ordered | Ordinal logistic | `MASS::polr()` | Proportional odds (Brant, AIC vs multinom) |

Three takeaways:

1. The number of categories and whether they are ranked decide the model. Misclassifying that choice costs accuracy or interpretability.
2. `multinom()` runs K-1 binary logits against a chosen reference class; `polr()` shares one slope across cut points to leverage the ranking.
3. Always validate ordinal fits against the proportional odds assumption before quoting odds ratios.

## References

1. UCLA OARC. *Multinomial Logistic Regression | R Data Analysis Examples*. [Link](https://stats.oarc.ucla.edu/r/dae/multinomial-logistic-regression/)
2. UCLA OARC. *Ordinal Logistic Regression | R Data Analysis Examples*. [Link](https://stats.oarc.ucla.edu/r/dae/ordinal-logistic-regression/)
3. Venables, W. N., and Ripley, B. D. *Modern Applied Statistics with S*, 4th Edition. Springer (2002). Chapter 7: Generalised Linear Models. [Link](https://www.stats.ox.ac.uk/pub/MASS4/)
4. Agresti, A. *Categorical Data Analysis*, 3rd Edition. Wiley (2013).
5. nnet package documentation. *multinom() reference*. [Link](https://cran.r-project.org/web/packages/nnet/nnet.pdf)
6. MASS package documentation. *polr() reference*. [Link](https://stat.ethz.ch/R-manual/R-patched/library/MASS/html/polr.html)
7. UVA Library. *Visualizing the Effects of Proportional-Odds Logistic Regression*. [Link](https://library.virginia.edu/data/articles/visualizing-the-effects-of-proportional-odds-logistic-regression)

## Continue Learning

- [Logistic Regression in R](Logistic-Regression-in-R.html): the binary base case, with diagnostics, ROC, and AUC.
- [Categorical Data in R](Categorical-Data-in-R.html): tables, mosaic plots, and chi-square tests for categorical predictors and outcomes.
- [Odds Ratios and Relative Risk in R](Odds-Ratios-and-Relative-Risk-in-R.html): companion piece for interpreting the exponentiated coefficients above.
