---
title: "Interaction effects: test and interpret them"
slug: "Regression-Reading-Mini-1"
description: "A coupon lifted new customers by 16.54 dollars and returning ones by only 1.02. Fit, test and read the interaction term in R that tells the two groups apart."
keywords: "interaction effects in R, interaction term lm, interpret interaction coefficient, test interaction anova, categorical interaction R, moderation in R, hierarchical principle"
mathjax: false
webr: true
date: "2026-09-06"
post_type: "LESSON"
course_id: "reading-model-output"
course_title: "Reading Regression Models"
course_lesson: "1"
course_total: "2"
course_landing: "/dashboard.html"
course_prev: ""
course_next: "Regression-Reading-Mini-2"
curriculum_id: "0.0.5"
lesson_access: "windowed"
catalog_blurb: "How to tell when a predictor works differently across groups, and report it."
---

=== step === cover
## Interaction effects: test and interpret them

Today let's work through what to do when a predictor does not have the same effect on everyone in your data.

An online store ran a coupon campaign. 800 customers took part, 400 of them new to the store and 400 returning, and inside each of those two groups 200 people were emailed a 10 percent coupon and 200 were emailed nothing. The store then recorded what every one of them spent over the following 30 days.

The customers with a coupon spent 67.18 dollars on average. The ones without spent 58.40. So the coupon looks like it is worth 8.78 dollars a customer, and that is the number a simple model will report.

Now split the same 800 customers by whether they were new or returning. The coupon is worth 16.54 dollars to a new customer and 1.02 to a returning one. 8.78 sits between those two and matches neither of them.

When the effect of one predictor changes with the value of another, that is called an **interaction**. Here is the path from the pooled 8.78 to the two numbers that are true.

::widget process-flow {"steps":[{"title":"Estimate inside each group","sub":"the coupon effect for new customers and for returning ones"},{"title":"Add the interaction term","sub":"one extra column that lets the two effects differ"},{"title":"Test it, then report both","sub":"a t test and an F test, then both effects with intervals"}]}

Each of those three is a short piece of R, run on this one campaign's data.

=== step === concept
## The campaign data and the pooled coupon effect

The campaign data has two columns describing each customer and one measuring them. `customer_type` says whether the person was new to the store or returning, `coupon` says whether they were sent the 10 percent code, and `spend` is what they spent over the 30 days that followed. The first two are factors, which is how R stores a category.

Press Run to build it.

```r
# Build the coupon campaign: 800 customers, 200 in each customer type and coupon group
set.seed(42)
campaign <- data.frame(
  customer_type = factor(rep(c("new", "returning"), each = 400)),
  coupon        = factor(rep(rep(c("no", "yes"), each = 200), 2))
)
campaign$spend <- round(rnorm(800, mean = rep(c(48, 64, 70, 72), each = 200), sd = 14), 2)

table(customer_type = campaign$customer_type, coupon = campaign$coupon)
#>              coupon
#> customer_type  no yes
#>     new       200 200
#>     returning 200 200
```

The four groups are the same size, 200 customers each, so nothing that follows comes from one group simply being bigger than another.

Now let's come to the question the store actually asked. Did the coupon lift spending?

```r
# Average spend with and without a coupon, and the single coupon effect lm() estimates
round(tapply(campaign$spend, campaign$coupon, mean), 2)
#>    no   yes
#> 58.40 67.18

pooled <- lm(spend ~ coupon, data = campaign)
round(coef(summary(pooled))[, c("Estimate", "Std. Error")], 2)
#>             Estimate Std. Error
#> (Intercept)    58.40       0.79
#> couponyes       8.78       1.11
```

The two averages are 58.40 dollars without a coupon and 67.18 with one, a gap of 8.78. `lm(spend ~ coupon)` estimates exactly that gap. The intercept, 58.40, is the average spend of the no-coupon group, and `couponyes`, 8.78, is how much higher the coupon group sits. Next to it, 1.11 is the standard error: roughly how much the 8.78 would move if the store reran the campaign on a fresh 800 customers.

So that is one model with one predictor and one answer. The coupon is worth 8.78 dollars a customer.

=== step === concept
## The same coupon, split by customer type

Nothing in that fit knows half these customers were new to the store. So let's use both columns at once and take the average spend inside each of the four groups.

```r
# Average spend in each of the four groups: coupon by customer type
cell_means <- tapply(campaign$spend, list(campaign$coupon, campaign$customer_type), mean)
round(cell_means, 2)
#>       new returning
#> no  47.62     69.19
#> yes 64.16     70.21
```

Read it as a 2 by 2 grid. The rows are the coupon and the columns are the customer type, so a new customer with no coupon spent 47.62 dollars on average and a new customer with a coupon spent 64.16. Returning customers spent 69.19 and 70.21.

Subtracting down each column gives the coupon effect estimated inside each group on its own.

```r
# The coupon effect estimated inside each customer group
round(cell_means["yes", ] - cell_means["no", ], 2)
#>       new returning
#>     16.54      1.02
```

16.54 dollars for a new customer and 1.02 for a returning one. Those two are not near each other, and the pooled 8.78 is simply their average.

The same four numbers are plotted below, with the coupon on the x axis (0 is no coupon, 1 is a coupon) and average spend on the y. Press `facet_wrap(~customer type)` to give each customer group a panel of its own.

::widget facet-grid {"data":[{"x":0,"y":47.62,"facet":"new","fill":"new"},{"x":1,"y":64.16,"facet":"new","fill":"new"},{"x":0,"y":69.19,"facet":"returning","fill":"returning"},{"x":1,"y":70.21,"facet":"returning","fill":"returning"}],"geom":"point","x":"coupon","y":"mean spend","facetVar":"customer type"}

One chart puts all four averages on the same axes. Split them and the difference is plain: the new-customer panel climbs from 47.62 to 64.16, while the returning-customer panel is nearly flat at 69.19 and 70.21. The coupon moved one group a long way and the other hardly at all.

=== step === concept
## What a model without an interaction term can and cannot say

The obvious fix is to put both predictors into the model. Let's do that and read the coupon effect back out.

```r
# Fit the model without an interaction term and read its coupon effect
add <- lm(spend ~ coupon + customer_type, data = campaign)
round(coef(summary(add))[, c("Estimate", "Std. Error")], 2)
#>                        Estimate Std. Error
#> (Intercept)               51.50       0.87
#> couponyes                  8.78       1.00
#> customer_typereturning    13.81       1.00
```

`couponyes` is 8.78 again. Adding `customer_type` moved the intercept and brought in a `customer_typereturning` row worth 13.81, but the coupon effect did not move. It is still one number for everybody.

That is not the fit going wrong. It is what the formula asked for. `spend ~ coupon + customer_type` says: start from a baseline, add a fixed amount if the customer got a coupon, add another fixed amount if the customer is returning. There is no slot in that sentence for "and the coupon amount is different for returning customers", so the model has no way to say it.

Here is what that costs. Take the fitted model's predictions for each of the four groups and put them beside the averages we observed.

```r
# Compare what the additive model predicts for each group with the observed averages
grid <- expand.grid(coupon = c("no", "yes"), customer_type = c("new", "returning"))
grid$observed <- round(as.vector(cell_means), 2)
grid$additive <- round(predict(add, grid), 2)
grid$gap      <- round(grid$additive - grid$observed, 2)
grid
#>   coupon customer_type observed additive   gap
#> 1     no           new    47.62    51.50  3.88
#> 2    yes           new    64.16    60.28 -3.88
#> 3     no     returning    69.19    65.31 -3.88
#> 4    yes     returning    70.21    74.09  3.88
```

Look at the `gap` column. Every one of the four predictions is off by 3.88 dollars, and the sign alternates: too high, too low, too low, too high. The model is not slightly wrong in one corner. It is wrong in all four corners, by the same amount, in a pattern.

Plotting it shows why.

```r
# Plot the four observed group averages with the additive model fitted values on top
plot(c(1, 2), cell_means[, "new"], type = "b", pch = 19, col = "grey25", lwd = 2,
     xlim = c(0.9, 2.6), ylim = c(42, 80), xaxt = "n",
     xlab = "coupon", ylab = "average spend in dollars",
     main = "Observed group averages and what the additive model fits")
axis(1, at = c(1, 2), labels = c("no", "yes"))
lines(c(1, 2), cell_means[, "returning"], type = "b", pch = 19, col = "grey25", lwd = 2)
lines(c(1, 2), grid$additive[grid$customer_type == "new"],
      type = "b", pch = 1, lty = 2, col = "red", lwd = 2)
lines(c(1, 2), grid$additive[grid$customer_type == "returning"],
      type = "b", pch = 1, lty = 2, col = "red", lwd = 2)
text(2.05, cell_means["yes", "new"], "new", pos = 4, cex = 0.9)
text(2.05, cell_means["yes", "returning"], "returning", pos = 4, cex = 0.9)
legend("topleft", legend = c("observed average", "additive model"),
       col = c("grey25", "red"), lty = c(1, 2), pch = c(19, 1), lwd = 2, bty = "n")
```

The two solid grey lines are the observed averages, one per customer group, and their slopes are visibly different. The two dashed red lines are the additive model, and they are parallel. They have to be. Both rise from the no-coupon point to the coupon point by exactly `couponyes`, and `couponyes` is a single number, so the same rise gets applied twice. Parallel is the only shape this model can draw.

[KEY INSIGHT]
An additive model does not test whether two groups respond alike. It assumes they do. Its coupon coefficient is an average across both groups, and it comes out looking the same whether the groups agree or not.

=== step === quiz
## Quick check: what the additive model claims about the two groups

In `lm(spend ~ coupon + customer_type)` the `couponyes` coefficient came out at 8.78. Which sentence reads it correctly?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- Both customer groups spent about 8.78 dollars more when they were sent a coupon. ::no
- The model gives 8.78 to both groups, because it holds no term that could give them different coupon effects. ::ok Exactly. 8.78 is one number applied to every customer, and the formula `coupon + customer_type` has no second slot for a group-specific coupon effect.
- The `customer_typereturning` coefficient, 13.81, is the coupon effect for returning customers. ::no
- 8.78 is not a real estimate, because the new customers on their own show 16.54. ::no 8.78 is a real estimate, and it is the best single number this model can produce: with equal group sizes it is the average of 16.54 and 1.02. What it is not is a description of either group. And `customer_typereturning` is a different quantity altogether, the gap between returning and new customers, not a coupon effect.

=== step === concept
## What coupon * customer_type adds to the model

What is missing is a term whose value depends on both predictors at once. In an R formula you write it with `*`.

`coupon * customer_type` is shorthand. It expands to `coupon + customer_type + coupon:customer_type`: the two original predictors on their own, which are called the main effects, plus a cross term written with a colon. The cross term is the new one, and it is the interaction.

To see what it adds, look at the columns `lm()` builds from the formula. Every model turns a formula into a matrix of numbers, one column per coefficient, and there are only four distinct rows here because there are only four groups.

```r
# The columns coupon * customer_type actually adds to the model
int <- lm(spend ~ coupon * customer_type, data = campaign)
mm  <- unique(model.matrix(int))
rownames(mm) <- c("new, no coupon", "new, coupon", "returning, no coupon", "returning, coupon")
mm
#>                      (Intercept) couponyes customer_typereturning
#> new, no coupon                 1         0                      0
#> new, coupon                    1         1                      0
#> returning, no coupon           1         0                      1
#> returning, coupon              1         1                      1
#>                      couponyes:customer_typereturning
#> new, no coupon                                      0
#> new, coupon                                         0
#> returning, no coupon                                0
#> returning, coupon                                   1
```

The first three columns are what the additive model already had: an intercept column of 1s, a `couponyes` column that is 1 whenever the customer got a coupon, and a `customer_typereturning` column that is 1 for returning customers.

The fourth column is the interaction, and it is 1 in exactly one row, returning customers who got a coupon. It is the product of the two columns before it, which is why it is 1 only where both of those are. That single 1 is what lets the model give the returning-with-coupon group a value of its own instead of forcing it to be the sum of the two separate effects.

You can also write the cross term on its own with a colon, and `spend ~ coupon + customer_type + coupon:customer_type` fits exactly the same model as `spend ~ coupon * customer_type`.

[WARNING]
Keep both main effects in the model whenever the interaction is in it. This is called the hierarchical principle. Drop one of them and the fit starts to depend on which level R happened to treat as the reference, so the interaction coefficient stops measuring the difference between two coupon effects.

=== step === concept
## Reading the four coefficients

Fitting `spend ~ coupon * customer_type` gives four coefficients. Each one is a step away from a single baseline group, and reading them one at a time is the whole skill.

```r
# The four coefficients of the interaction model
round(coef(int), 2)
#>                      (Intercept)                        couponyes
#>                            47.62                            16.54
#>           customer_typereturning couponyes:customer_typereturning
#>                            21.58                           -15.53
```

Take them in order.

`(Intercept)` is 47.62. Both factors sit at their reference level here, which R picks alphabetically: `new` for customer type and `no` for coupon. So this is the average spend of a new customer with no coupon, and every other number is measured from it.

`couponyes` is 16.54. In the additive model this was the coupon effect for everybody. Here it is the coupon effect for new customers only, because it is the step you take when `coupon` moves to `yes` and `customer_type` stays at its reference level.

`customer_typereturning` is 21.58. Same idea in the other direction. It is how much more a returning customer spends than a new one, among customers who got no coupon.

`couponyes:customer_typereturning` is -15.53. This is the interaction, and it is the one that needs a second look, because it is not the coupon effect for returning customers. It is how much smaller their coupon effect is than the new customers' one. So the returning customers' coupon effect is 16.54 minus 15.53, which is 1.02, the same number we got by subtracting their two group averages.

[KEY INSIGHT]
Once an interaction is in the model, every coefficient is conditional on where the other predictor sits. `couponyes` is no longer "the coupon effect". It is the coupon effect at the reference level of `customer_type`.

Now check the arithmetic the whole way through. Adding the right coefficients together should reproduce each of the four group averages exactly.

```r
# Rebuild each group's average spend from the four coefficients
grid$interaction <- round(predict(int, grid), 2)
grid[, c("coupon", "customer_type", "observed", "additive", "interaction")]
#>   coupon customer_type observed additive interaction
#> 1     no           new    47.62    51.50       47.62
#> 2    yes           new    64.16    60.28       64.16
#> 3     no     returning    69.19    65.31       69.19
#> 4    yes     returning    70.21    74.09       70.21
```

The `interaction` column matches `observed` in all four rows, to the last decimal, while `additive` is still 3.88 out everywhere. Four groups, four coefficients: the interaction model has exactly enough freedom to land on every group average. Returning customers with a coupon, for instance, are 47.62 + 16.54 + 21.58 - 15.53 = 70.21.

=== step === concept
## Testing the interaction term: the t test and the F test

We have a model that reproduces all four groups. But a 15.53 dollar gap between two estimated effects could still come from noise, so it has to be tested. An interaction term is tested the same way any other coefficient is, in the coefficient table.

```r
# Test the interaction term: its estimate, standard error, t value and p-value
summary(int)
#>
#> Call:
#> lm(formula = spend ~ coupon * customer_type, data = campaign)
#>
#> Residuals:
#>     Min      1Q  Median      3Q     Max
#> -41.515  -8.956  -0.125   9.385  46.018
#>
#> Coefficients:
#>                                  Estimate Std. Error t value Pr(>|t|)
#> (Intercept)                       47.6152     0.9641  49.390  < 2e-16 ***
#> couponyes                         16.5427     1.3634  12.133  < 2e-16 ***
#> customer_typereturning            21.5768     1.3634  15.826  < 2e-16 ***
#> couponyes:customer_typereturning -15.5269     1.9281  -8.053 2.95e-15 ***
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
#>
#> Residual standard error: 13.63 on 796 degrees of freedom
#> Multiple R-squared:  0.3073,	Adjusted R-squared:  0.3047
#> F-statistic: 117.7 on 3 and 796 DF,  p-value: < 2.2e-16
```

The bottom row is the one to read. The estimate is -15.5269 with a standard error of 1.9281, so the t value is -15.5269 divided by 1.9281, which is -8.053, and the p-value is 2.95e-15. In a world where both groups share one coupon effect, a difference between them this large would essentially never turn up.

The confidence intervals say it in dollars.

```r
# The 95 percent confidence interval for every coefficient
round(confint(int), 2)
#>                                   2.5 % 97.5 %
#> (Intercept)                       45.72  49.51
#> couponyes                         13.87  19.22
#> customer_typereturning            18.90  24.25
#> couponyes:customer_typereturning -19.31 -11.74
```

The interaction runs from -19.31 to -11.74, nowhere near 0. And the `couponyes` row, 13.87 to 19.22, is the interval for the new customers' coupon effect, which is one of the two numbers the store wants reported.

There is a second way to ask the same question, and it is the one to reach for when a factor has more than two levels. Rather than test a single coefficient, compare the model that has the interaction against the model that does not.

```r
# Test the same term by comparing the additive model with the interaction model
anova(add, int)
#> Analysis of Variance Table
#>
#> Model 1: spend ~ coupon + customer_type
#> Model 2: spend ~ coupon * customer_type
#>   Res.Df    RSS Df Sum of Sq      F    Pr(>F)
#> 1    797 160019
#> 2    796 147965  1     12054 64.848 2.945e-15 ***
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
```

The two models differ by one term, which is the `Df` of 1. Adding that term cuts the residual sum of squares from 160019 to 147965, and the F statistic for the improvement is 64.848 on 1 and 796 degrees of freedom, with the same p-value as before, 2.945e-15.

That match is not luck. On one degree of freedom, the F statistic is the t statistic squared.

```r
# The F statistic is the t value squared
t_int <- coef(summary(int))["couponyes:customer_typereturning", "t value"]
round(t_int^2, 2)
#> [1] 64.85
```

64.85 either way. With a two-level factor like this one the two tests are one test written twice, so read whichever output you prefer. The difference appears when the factor has more levels. A customer type with four levels would add three interaction coefficients and three separate t tests, leaving you with three p-values and no single verdict, while `anova()` still returns one F test for the interaction as a whole.

=== step === concept
## Why an interaction needs more data than a main effect

Interactions have a reputation for being hard to find, and the reason sits in the standard errors. Put the two side by side.

```r
# Compare the standard error of the pooled coupon effect with that of the interaction term
round(c(coupon      = coef(summary(add))["couponyes", "Std. Error"],
        interaction = coef(summary(int))["couponyes:customer_typereturning", "Std. Error"]), 2)
#>      coupon interaction
#>        1.00        1.93
```

1.00 for the coupon effect in the additive model, 1.93 for the interaction. Out of the same 800 customers, the interaction is estimated about twice as loosely.

That follows from what an interaction is. `couponyes` in the additive model is one difference, coupon minus no coupon, taken over everybody. The interaction is a difference between two differences, one per customer group.

```r
# The interaction estimate is a difference between two differences
round((cell_means["yes", "returning"] - cell_means["no", "returning"]) -
      (cell_means["yes", "new"] - cell_means["no", "new"]), 2)
#> [1] -15.53
```

Each of those inner differences carries its own noise, and each is computed on half the customers. Subtract one from the other and the noise accumulates.

That extra noise has a cost. Precision improves with the square root of the sample size, so a standard error twice as large takes four times as many customers to bring back down. Refitting the same model on 60 customers per group instead of 200 shows what that feels like.

```r
# Refit the interaction model on 60 customers per group instead of 200
small     <- campaign[c(1:60, 201:260, 401:460, 601:660), ]
int_small <- lm(spend ~ coupon * customer_type, data = small)
round(coef(summary(int_small))["couponyes:customer_typereturning",
                               c("Estimate", "Std. Error")], 2)
#>   Estimate Std. Error
#>     -12.99       3.79
```

The estimate is still large and negative, -12.99, but the standard error has gone from 1.93 to 3.79. An estimate has to clear roughly two standard errors to come in under 0.05, and at this size that bar sits here:

```r
# The smallest gap that would clear 0.05 at 60 customers per group
se_small <- coef(summary(int_small))["couponyes:customer_typereturning", "Std. Error"]
round(1.96 * se_small, 2)
#> [1] 7.43
```

At 60 customers a group, an estimated gap smaller than about 7.43 dollars does not clear 0.05, however real the difference behind it is.

The general shape of that trade is worth seeing on its own. The power curve below carries its own data rather than the campaign's: two groups compared with a t test, with the effect measured in standard deviations instead of dollars, which stands for the single comparison of coupon against no coupon inside one customer group. Switch the effect size and read off the sample size that reaches 80 percent power, meaning a campaign that size would come back under 0.05 four times out of five when the effect is really there.

::widget power-curve {}

A large effect, 0.8 standard deviations, needs about 25 customers per group. A medium one, 0.5, needs about 63. A small one, 0.2, needs close to 400. Halving the effect roughly quadruples the sample, which is the four-times rule again from the other side.

And an interaction is usually the smallest effect in the model, because it is a difference between two effects that were already hard to pin down.

=== step === quiz
## Quick check: what a non-significant interaction proves

Suppose the store had run the campaign on 60 customers per group, and the interaction had come back at p = 0.09. What follows from that?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- The coupon works about equally well for new and for returning customers. ::no
- The 15.53 gap seen on the full campaign was a fluke, since the smaller campaign did not reproduce it. ::no
- Very little. At that size the standard error is 3.79, so an estimated gap under about 7.43 dollars fails the test, real or not. Report the estimate with its interval. ::ok Right. A test that could not reliably have caught a gap that size says nothing about whether one exists. The estimate and its confidence interval show what the campaign data could and could not rule out.
- The interaction term should be dropped and the additive model reported instead. ::no A p-value above 0.05 is not evidence that the two groups respond alike. It says the campaign was not big enough to separate them. At 60 customers a group the interaction's standard error is 3.79, so an estimated gap under about 7.43 dollars comes back non-significant, and a true gap smaller than that is missed more often than not. What gets reported is the estimate with its interval, not a decision to pool the groups.

=== step === tryit
## Your turn: read the coupon effect for returning customers

The model gives you the coupon effect for new customers directly, as `couponyes` = 16.54. Returning customers take arithmetic: 16.54 minus 15.53. There is a way to make R do that arithmetic, and to give you the standard error and confidence interval with it.

`relevel()` moves a factor's reference level. Move `customer_type` so that `returning` is the reference, refit the same interaction model on that data, and print its coefficient table. Nothing about the data changes, only the group that the `couponyes` row answers for.

```r
# campaign holds the 800 customers, and customer_type has the levels new and returning.
# Copy campaign, relevel customer_type on the copy so returning is the reference,
# refit spend ~ coupon * customer_type on it, and print the coefficient table.
# Press Check when you have it.
```
::check {"regex": "relevel[(]", "gate": true, "difficulty": "intermediate", "ok": "That is it. `couponyes` is now 1.02, the coupon effect for returning customers, with p = 0.456 and an interval of -1.66 to 3.69 that sits across 0. The interaction row is the same size as before with its sign flipped, 15.53, because now it is the new customers who differ from the reference.", "no": "Copy the data frame first, then call `relevel()` on its `customer_type` column with `ref` set to returning, and refit `lm(spend ~ coupon * customer_type)` on the copy."}
::solution
```r
# Refit the same interaction model with returning customers as the reference level
campaign_ret <- campaign
campaign_ret$customer_type <- relevel(campaign_ret$customer_type, ref = "returning")
int_ret <- lm(spend ~ coupon * customer_type, data = campaign_ret)
round(coef(summary(int_ret))[, c("Estimate", "Std. Error", "Pr(>|t|)")], 3)
#>                            Estimate Std. Error Pr(>|t|)
#> (Intercept)                  69.192      0.964    0.000
#> couponyes                     1.016      1.363    0.456
#> customer_typenew            -21.577      1.363    0.000
#> couponyes:customer_typenew   15.527      1.928    0.000

round(confint(int_ret)["couponyes", ], 2)
#>  2.5 % 97.5 %
#>  -1.66   3.69
```

The 800 rows of spending are untouched, and so is the fit. The intercept is now 69.192, which is the average spend of a returning customer with no coupon, and taking 21.577 off it gives back 47.615, the new customers with no coupon. Only the reference level moved, and with it the question that `couponyes` answers. That is the cheapest way to report both coupon effects with proper intervals instead of doing the subtraction by hand.

=== step === concept
## References

- [Regression and Other Stories](https://avehtari.github.io/ROS-Examples/) - Gelman, Hill and Vehtari (2020), Cambridge University Press. Chapter 10 covers interactions and why every coefficient in an interaction model is conditional.
- [Understanding Interaction Models: Improving Empirical Analyses](https://doi.org/10.1093/pan/mpi014) - Brambor, Clark and Golder (2006), Political Analysis 14(1), 63-82. The argument for keeping both main effects in the model.
- [You need 16 times the sample size to estimate an interaction than to estimate a main effect](https://statmodeling.stat.columbia.edu/2018/03/15/need-16-times-sample-size-estimate-interaction-estimate-main-effect/) - Gelman (2018). Why an interaction is so much more expensive to estimate than a main effect.
- [Multiple Regression: Testing and Interpreting Interactions](https://psycnet.apa.org/record/1991-97932-000) - Aiken and West (1991), Sage. The standard reference on simple slopes and on centering predictors.
- [Model Formulae](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/formula.html) - R Core Team. How the `*` and `:` operators expand inside an R formula.

=== step === complete
## Quick recap

You started with one coupon effect and finished with two, each with an interval you can put in a report. To summarize:

- One pooled number, 8.78 dollars, described neither group. The coupon was worth 16.54 to a new customer and 1.02 to a returning one.
- Adding `customer_type` to the formula does not fix that. `spend ~ coupon + customer_type` holds no term for two different coupon effects, so it fits parallel lines and misses all four group averages by 3.88.
- `coupon * customer_type` adds one product column, which is 1 only for returning customers with a coupon. That column is the interaction.
- Every coefficient is then conditional. `couponyes` is the coupon effect at the reference level of the other predictor, and the interaction term is the difference between the two groups' effects, not one group's effect.
- Test it with the t test in `summary()` or with `anova()` on the two models. For a two-level factor they are the same test, and F is t squared: 64.85 either way.
- The interaction is a difference between two differences, so it is the noisiest number in the model. Its standard error was 1.93 against 1.00 for the main effect, and closing that gap takes four times the customers.

So when someone asks whether the coupon worked:

"It is worth 16.54 dollars to a new customer (13.87 to 19.22) and 1.02 to a returning one (-1.66 to 3.69). The 15.53 gap between the two is real, F(1, 796) = 64.85, p below 0.001."

Coming up next is what a linear model assumes about your data without ever saying so, and the five checks that tell you when one of those assumptions has broken.
