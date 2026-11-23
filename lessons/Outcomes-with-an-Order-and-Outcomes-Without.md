---
title: "Generalized Linear Models Lesson 6: Outcomes with an order, and outcomes without"
catalog_blurb: "Tell an ordered outcome from an unordered one, and fit the model each needs."
description: "An ordinal relief scale and a nominal treatment choice need different models. Fit proportional odds and multinomial logistic regression, and compare their cost."
keywords: "ordinal logistic regression, proportional odds model, multinomial logistic regression, polr function in r, multinom function in r, ordinal vs nominal outcome, cumulative logit model, likert scale regression, categorical outcome regression, generalized linear models"
post_type: "LESSON"
curriculum_id: "4.80.6"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "res-glm"
course_title: "Generalized Linear Models"
course_lesson: "6"
course_total: "8"
course_landing: "Generalized-Linear-Models-Course.html"
course_next: "Too-Many-Zeros-and-the-Two-Ways-to-Model-Them"
course_prev: "Rates-Offsets-and-Unequal-Exposure"
---

=== step === cover
## Outcomes with an order, and outcomes without

Today let's understand two kinds of categorical outcome that look alike on the surface but need completely different models underneath.

Four hundred arthritis patients each start with a baseline severity score, from 0, barely any symptoms, to 10, severe. Eight weeks later, two things are recorded for every one of them: how much relief they report, graded none, slight, moderate, good or complete, and which of four treatments the physician picks next, continue the current dose, switch to a different drug class, refer to a specialist, or add physiotherapy.

Here are eight of the 400 patients.

::widget styled-table {"cols": ["patient", "severity", "relief", "treatment"], "rows": [[1, 0, "none", "continue"], [2, 6, "slight", "switch"], [3, 2, "moderate", "specialist"], [4, 0, "good", "continue"], [5, 1, "complete", "specialist"], [6, 6, "none", "specialist"], [7, 1, "slight", "physio"], [8, 3, "moderate", "continue"]], "formats": {}, "title": "Eight of the 400 arthritis patients", "note": "All 400 share one predictor, baseline severity, scored 0 to 10."}

Look at the relief and treatment columns in that table. Relief runs from none up to complete, a real low-to-high order. Treatment does not: continue, switch, specialist and physio are four separate options, with no "more than" between any two of them.

=== step === concept
## Two shapes of a categorical outcome: ordered and unordered

::prose-only the running example already carries both outcome columns, no new visual needed

Statisticians call relief an **ordinal** outcome. Its five categories sit on a real scale from low to high, even though the gaps between them are not measured in any fixed unit. None is worse than slight, slight is worse than moderate, and so on, in one fixed direction.

Treatment is different. Continuing the dose, switching drugs, referring to a specialist and adding physiotherapy are four options with no shared direction. One option is not "more" or "less" than another, it is simply a different choice. Statisticians call this kind of outcome **nominal**.

Whether an outcome's categories carry a true order decides which regression model fits it correctly.

=== step === concept
## The common error: scoring an ordinal outcome as plain numbers

Relief has five categories in a fixed order, so it is tempting to just number them 1 to 5 and fit an ordinary linear regression, the same `lm()` you would use for any numeric outcome.

Let's build the full 400-patient dataset first, since every number in this lesson comes from it.

```r
# Build the 400-patient dataset: severity, the ordinal relief outcome,
# and the nominal treatment choice
set.seed(1)
severity <- sample(0:10, 400, replace = TRUE)

# Relief (none < slight < moderate < good < complete), simulated from
# a true proportional-odds model: one slope, four cutpoints
eta <- -0.3 * severity
cutpoints <- c(-1.5, 0, 1.5, 3.2)
p1 <- plogis(cutpoints[1] - eta)
p2 <- plogis(cutpoints[2] - eta)
p3 <- plogis(cutpoints[3] - eta)
p4 <- plogis(cutpoints[4] - eta)
u <- runif(400)
relief <- factor(
  ifelse(u < p1, "none",
  ifelse(u < p2, "slight",
  ifelse(u < p3, "moderate",
  ifelse(u < p4, "good", "complete")))),
  levels = c("none", "slight", "moderate", "good", "complete"),
  ordered = TRUE
)

# Treatment choice (continue, switch, specialist, physio), simulated
# from a true multinomial model, reference category "continue"
lo_switch <- -1.0 + 0.15 * severity
lo_specialist <- -2.0 + 0.45 * severity
lo_physio <- -0.5 + 0.05 * severity
total <- 1 + exp(lo_switch) + exp(lo_specialist) + exp(lo_physio)
p_continue <- 1 / total
p_switch <- exp(lo_switch) / total
p_specialist <- exp(lo_specialist) / total
p_physio <- exp(lo_physio) / total

treatment <- character(400)
for (i in 1:400) {
  treatment[i] <- sample(
    c("continue", "switch", "specialist", "physio"),
    size = 1,
    prob = c(p_continue[i], p_switch[i], p_specialist[i], p_physio[i])
  )
}
treatment <- factor(treatment, levels = c("continue", "switch", "specialist", "physio"))

patients <- data.frame(severity = severity, relief = relief, treatment = treatment)
head(patients)
#>   severity   relief treatment
#> 1        8     none    physio
#> 2        3 moderate  continue
#> 3        6     none specialist
#> 4        0 moderate  continue
#> 5        1   slight    physio
#> 6        6   slight    switch
```

`sample()` draws the baseline severity for each patient. The `ifelse()` chain draws relief from four threshold probabilities that shift with severity, and the loop draws treatment from four probabilities that also shift with severity, so both outcomes genuinely depend on how severe a patient's arthritis is.

Now code relief as plain numbers and fit two linear regressions. The first codes the categories 1 to 5 in order. The second keeps 1 to 4 for none through good, but recodes complete as 10 instead of 5, the same order, just a bigger final step.

```r
# Fit ordinary linear regression to relief scored two different ways
relief_num5 <- as.integer(relief)             # none=1 ... complete=5
relief_num10 <- relief_num5
relief_num10[relief_num10 == 5] <- 10          # complete recoded 10, not 5

fit5 <- lm(relief_num5 ~ severity)
fit10 <- lm(relief_num10 ~ severity)

round(coef(fit5), 3)
#> (Intercept)    severity 
#>       2.554      -0.145 
round(summary(fit5)$r.squared, 3)
#> [1] 0.209

round(coef(fit10), 3)
#> (Intercept)    severity 
#>       2.622      -0.149 
round(summary(fit10)$r.squared, 3)
#> [1] 0.138
```

Nothing about the patients changed between these two fits. The order of the five categories is identical, none is still the worst and complete is still the best. The only thing that changed is the distance `lm()` assumes sits between good and complete: 1 unit in the first fit, 5 units in the second.

That one choice moved the severity slope from -0.145 to -0.149, a small shift, but it dropped R-squared from 0.209 to 0.138, a big one. `lm()` cannot tell the difference between an order and a scale. It takes whatever numbers you hand it as real distances, and a different arbitrary spacing gives a different answer, even on the exact same patients in the exact same order.

[KEY INSIGHT]
Recoding a category changes nothing about what happened to the patients. If recoding alone can move your result this much, the numbers you chose were never real distances to begin with.

=== step === concept
## From one yes-or-no split to a staircase of them

If scoring relief as numbers is unsafe, what can you compute directly from the categories themselves, in their own order, without inventing a distance?

Pick one threshold, say none, and ask what share of patients land at or below it. That is one yes-or-no split: did a patient end up at none, or anywhere above it? A five-category outcome gives you four such splits, one for each boundary between neighbouring categories: none against everything above it, slight-or-below against everything above that, moderate-or-below against everything above that, and good-or-below against complete alone.

Patients who started at severity 1 show this clearly.

```r
# Four cumulative splits of relief, computed directly for patients
# who started at severity 1
relief_at_1 <- relief[severity == 1]
counts <- table(relief_at_1)
counts
#> relief_at_1
#>     none   slight moderate     good complete 
#>        4       11       10        4        1 

shares <- round(100 * counts / length(relief_at_1), 1)
shares
#> relief_at_1
#>     none   slight moderate     good complete 
#>     13.3     36.7     33.3     13.3      3.3 

cumsum(shares)
#>     none   slight moderate     good complete 
#>     13.3     50.0     83.3     96.6     99.9 
```

Thirty patients started at severity 1. Reading the running total left to right: 13.3% landed at none, the lowest category. By slight or below, the total reaches 50.0%. By moderate or below, 83.3%, and by good or below, 96.6%, leaving the remaining share at complete alone.

Each of those running totals is a single number read straight off the data, using only the order of the categories, no invented distance involved. A model that predicts every one of those running totals from severity, with just one shared slope instead of four separate counts, is exactly what the proportional-odds model gives you.

=== step === concept
## The proportional-odds model: one slope, several cutpoints

The proportional-odds model fits exactly those four running totals, but as one smooth function of severity instead of four separate counts.

For a threshold k, it models the cumulative probability as $$P(Y \le k) = \text{logit}^{-1}(\text{cutpoint}_k - \text{slope} \times \text{severity})$$ one cutpoint for each threshold, but the same slope used in every one of the four equations. That sharing is the "proportional odds" the model's name refers to: moving severity has the same effect on every cumulative split, just measured from a different cutpoint each time.

Fit it with `polr()`, from the `MASS` package.

```r
# Fit the proportional-odds model: one slope, four cutpoints
library(MASS)
fit_polr <- polr(relief ~ severity, data = patients, Hess = TRUE)
round(coef(fit_polr), 3)
#> severity 
#>    -0.34 
round(fit_polr$zeta, 3)
#>     none|slight slight|moderate   moderate|good   good|complete 
#>          -1.745          -0.250           1.404           3.427 
```

One slope, -0.34, and four cutpoints, one for each boundary between neighbouring relief categories.

Read off what the model actually predicts at two severity scores, 3 and 8.

```r
# Predicted category probabilities at severity 3 and severity 8
new_patients <- data.frame(severity = c(3, 8))
round(100 * predict(fit_polr, newdata = new_patients, type = "probs"), 1)
#>   none slight moderate good complete
#> 1 32.6   35.7     23.5  7.0      1.2
#> 2 72.6   19.6      6.2  1.4      0.2
```

At severity 3, the model splits patients fairly evenly across none, slight and moderate, with good and complete rare. At severity 8, 72.6% are predicted to land at none alone, and complete drops to 0.2%. The shared slope is what moves all five numbers together as severity rises: it shifts probability mass from the high end of relief toward the low end, the same amount of shift behind every one of the four thresholds.

The widget below carries the same mechanism on a smaller, 3-category scale, low, medium and high, instead of relief's five.

::widget ordinal-cumlogit {}

Slide the predictor and watch the three stacked bands move. The bands never cross, because one shared slope drives all of them at once, exactly the assumption `polr()` made for the five relief categories.

[KEY INSIGHT]
Proportional odds is not a free assumption. It says the effect of severity on landing at or below none is the same, on the log-odds scale, as its effect on landing at or below good. Nothing in the data forces that to be true; it has to be checked, not assumed, in real work.

=== step === quiz
## Quick check: order, numbers and the shared slope

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Because `lm()` is always the wrong tool for any outcome with more than two categories, ordinal or nominal. ::no
- Because `lm()` treats the numeric codes as real distances between categories. Stretching the gap between good and complete from 1 unit to 5 units changes how much of a move in relief each point of severity is assumed to produce, even though no patient's actual order changed. ::ok Exactly. The order of the five categories never moved. Only the made-up distance between good and complete did, and `lm()` has no way to tell a real distance from an arbitrary one.
- Because recoding complete as 10 also reordered the five categories, putting complete above a numeric value it did not reach before. ::no
- Because the second fit used fewer patients than the first. ::no Three of these four blame something that did not happen here: the categories kept their order, every patient stayed in the fit, and no category besides complete changed its number. What changed is the made-up distance `lm()` assumed between good and complete, from 1 unit to 5. `lm()` reads that distance as real, so a different distance gives a different slope and a different R-squared, on the exact same patients.

=== step === concept
## Multinomial logistic regression for an outcome with no order

Treatment has no order, so there is no staircase of cumulative splits to build here. Instead, multinomial logistic regression picks one category as the reference and writes a separate equation for every other category, each giving the log-odds of that category against the reference.

Continue the dose is the natural reference here, since it is what a physician defaults to when nothing changes. That leaves three equations to fit: switch versus continue, specialist versus continue, and physio versus continue, each with its own intercept and its own slope on severity.

```r
# Fit multinomial logistic regression: three equations, one per
# non-reference treatment, each against continuing the dose
library(nnet)
fit_multinom <- multinom(treatment ~ severity, data = patients, trace = FALSE)
round(coef(fit_multinom), 3)
#>            (Intercept) severity
#> switch          -1.158    0.186
#> specialist      -2.687    0.581
#> physio          -0.698    0.130
```

Three rows, one per non-reference treatment, each with its own intercept and its own slope. Compare that to the single shared slope the proportional-odds model gave relief: nothing here is shared, because there is no order to share it along.

Turn those coefficients into shares a physician can read, at severity 3 and severity 8.

```r
# Predicted treatment shares at severity 3 and severity 8
new_patients <- data.frame(severity = c(3, 8))
round(100 * predict(fit_multinom, newdata = new_patients, type = "probs"), 1)
#>   continue switch specialist physio
#> 1     37.4   20.5       14.5   27.5
#> 2      9.2   12.7       65.1   13.0
```

At severity 3, continuing the dose is still the most likely choice, 37.4%, with the other three options fairly close behind. At severity 8, that flips hard: specialist referral jumps to 65.1%, and continuing the dose drops to 9.2%.

Each treatment's own slope moves its own share independently of the others. That independence is exactly what assuming nothing about order buys you, and it has a price, measured in parameters.

=== step === concept
## What assuming nothing about order costs in parameters

Count what the two models you just fitted actually estimated for the one predictor, severity.

```r
# Count the parameters each fitted model estimated
length(coef(fit_polr)) + length(fit_polr$zeta)      # 1 slope + 4 cutpoints
#> [1] 5
length(coef(fit_multinom))                           # 3 slopes + 3 intercepts
#> [1] 6
```

Five parameters for the proportional-odds model: one slope shared across all four thresholds, plus the four cutpoints themselves. Six for the multinomial model: an intercept and a slope for each of the three non-reference treatments.

The gap grows with the number of categories. A proportional-odds model always adds exactly one more cutpoint per extra category, no matter how many predictors it carries. A multinomial model adds a whole new intercept and slope, for every predictor, for every extra category.

Relief, with five categories against treatment's four, cost the proportional-odds model exactly one more cutpoint. Had relief instead needed a multinomial fit, that one extra category would have cost an entire new equation, not one extra number.

That is the real price of assuming nothing about order: not a worse fit, but a model that grows far faster as the number of categories grows.

=== step === concept
## Why two categories need neither model

Relief has five categories, treatment has four, so both models so far had multiple thresholds or multiple non-reference categories to estimate. What happens when an outcome has only two?

With two categories, a proportional-odds model has exactly one threshold, not four: category 1 or below, versus category 2. One threshold means one cutpoint, and the formula collapses to a single equation, not a staircase of them.

A multinomial model collapses the same way. With two categories there is exactly one non-reference category left, so there is only one equation to fit: one intercept and one slope, the log-odds of category 2 against category 1.

One cutpoint, one equation: both are now the exact same thing as the ordinary logistic regression you would reach for directly on a plain yes-or-no outcome. There is no order left to assume anything about, and no second category left to give its own equation to.

The widget below fits exactly that ordinary logistic regression, on a plain two-category outcome.

::widget logistic-curve {}

Drag the threshold and watch the predicted class flip for each point. That is the whole model two categories ever need, the same `glm(family = binomial)` you may already know, not a special case of anything new.

[NOTE]
If an outcome ever reduces to two categories, you do not even get a choice between proportional odds and multinomial. R's own `polr()` refuses the job outright: pass it a two-level outcome and it stops with "response must have 3 or more levels". Reach for ordinary logistic regression instead.

=== step === quiz
## Quick check: which model for which outcome

A clinic now records which of five pain-relief creams, A, B, C, D or E, a patient is given next, chosen by whichever is in stock that day, with no ranking among them. Which is the right tool?

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- `multinom()`: reference one cream and fit a separate intercept and slope, against that reference, for each of the other four. ::ok Right. Five categories with no order between any of them is exactly what multinomial logistic regression is for: one reference, one equation per remaining category.
- `polr()`, since any outcome with more than two categories calls for the proportional-odds model regardless of whether the categories are ordered. ::no
- `lm()` on the cream recoded 1 to 5, since it fits faster than either categorical model. ::no
- Either `polr()` or `multinom()` works equally well here, since both handle outcomes with more than two categories. ::no Three of these reach for the wrong tool. `polr()` assumes a shared order across cutpoints, which five creams chosen only by stock levels do not have. Recoding the creams as 1 to 5 repeats the same mistake as scoring relief's categories as 1 to 5: an invented distance that `lm()` reads as real. And the two categorical models encode different assumptions, so they do not give interchangeable answers. Only `multinom()` fits an outcome with no order among its categories.

=== step === tryit
## Your turn: fit the right model and read its coefficient

A different team groups the 400 patients' relief into three wider recovery bands instead of five: low (none or slight), medium (moderate), and high (good or complete). That grouping keeps the same order relief already had.

```r
# Group relief into three recovery bands, low < medium < high
recovery_band <- factor(
  ifelse(relief %in% c("none", "slight"), "low",
  ifelse(relief == "moderate", "medium", "high")),
  levels = c("low", "medium", "high"), ordered = TRUE
)
table(recovery_band)
#> recovery_band
#>    low medium   high 
#>    303     70     27 
```

That is still an ordinal outcome, so it needs the same kind of model you already fitted for the five-category version. Complete the call that fits it against severity, and check the coefficient it hands back.

```r
# recovery_band is ordinal (low < medium < high). Fit the model that
# assumes one shared slope across its cutpoints, against severity.
# One line. Press Check when you have it.
```
::check {"regex": "polr[(]\\s*recovery_band\\s*~\\s*severity", "gate": true, "difficulty": "intermediate", "ok": "Right: polr(recovery_band ~ severity, data = patients, Hess = TRUE) fits the shared-slope model, the same tool you used on the five-category relief.", "no": "Reuse the call from the five-category version with the new outcome in place: polr(recovery_band ~ severity, data = patients, Hess = TRUE)."}
::solution
```r
# Fit the proportional-odds model on the three-band recovery outcome
recovery_fit <- polr(recovery_band ~ severity, data = patients, Hess = TRUE)
round(coef(recovery_fit), 3)
#> severity 
#>   -0.301 
```

The fitted slope, -0.301, is close to the -0.34 you saw for the five-category version, which makes sense: grouping none with slight, and good with complete, barely changes how severity moves patients up and down this scale. It only changes how many bands that movement is split across.

=== step === concept
## References

::prose-only a list of citations carries no visualizable concept

- [Categorical Data Analysis, 3rd edition](https://doi.org/10.1002/0471249688) - Agresti, A. (2012), Wiley. The standard reference for both the proportional-odds and multinomial logit models.
- [Generalized Linear Models, 2nd edition](https://doi.org/10.1201/9780203753736) - McCullagh, P. and Nelder, J.A. (1989), Chapman and Hall/CRC. The cumulative-link model for ordinal outcomes, inside the GLM framework.
- [Modern Applied Statistics with S, 4th edition](https://doi.org/10.1007/978-0-387-21706-2) - Venables, W.N. and Ripley, B.D. (2002), Springer. The source text for the MASS and nnet packages used to fit both models.
- [`polr()` documentation](https://stat.ethz.ch/R-manual/R-devel/library/MASS/html/polr.html) - MASS package, the function used to fit the proportional-odds model.
- [`multinom()` documentation](https://stat.ethz.ch/R-manual/R-devel/library/nnet/html/multinom.html) - nnet package, the function used to fit the multinomial logistic model.

=== step === complete
## Order, no order, and the model that fits each

Relief and treatment looked alike at first, two categorical outcomes on the same 400 patients. But relief carries a real order from none to complete, and treatment does not, and that single difference decided everything that followed.

An ordinal outcome gets the proportional-odds model: one slope shared across every cutpoint, five parameters here, and a prediction that moves smoothly as severity rises. A nominal outcome gets multinomial logistic regression: its own intercept and slope for every category against a reference, six parameters here, more expensive, but assuming nothing about an order that is not there. And when an outcome only has two categories, there is no order left to assume anything about, so both collapse to the ordinary logistic regression you already know.

Next time a categorical outcome has more than two levels, ask one question first: does it have a real order or not. That answer alone tells you which model to reach for.
