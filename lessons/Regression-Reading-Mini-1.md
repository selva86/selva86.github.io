---
title: "Interaction effects: test and interpret them"
slug: "Regression-Reading-Mini-1"
description: "An interaction means one predictor's effect depends on another. Learn to test it in R with anova() and AIC, and report each group's own real effect clearly."
keywords: "interaction effects in R, interaction terms lm, test interaction anova, AIC model comparison, categorical interaction R, interpreting regression coefficients"
mathjax: false
webr: true
date: "2026-09-07"
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
catalog_blurb: "Spot a real interaction, test it properly, and report it so it helps."
---

=== step === cover
## Interaction effects: test and interpret them

Today's topic is the interaction effect: the case where one variable's effect on an outcome depends on a second variable, rather than staying one fixed number.

An online sports-gear store ran a one-day sale with a $10 site-wide coupon. Some shoppers got it, some did not, and the store also knows which shoppers were returning customers and which were new. That makes four groups, one order value per shopper.

Here is what those four groups spent, on average.

::widget chart-plotter {"data":[{"x":"returning","y":82.05,"fill":"no"},{"x":"returning","y":87.63,"fill":"yes"},{"x":"new","y":50.96,"fill":"no"},{"x":"new","y":73.20,"fill":"yes"}],"geoms":["bar"],"x":"customer_type","y":"order_value","code":{"bar":"ggplot(cell_means, aes(x = customer_type, y = order_value, fill = coupon)) +\n  geom_col(position = \"dodge\")"}}

Look at the two returning-customer bars first, then the two new-customer bars. The coupon barely moves the returning bars. It moves the new-customer bars a lot more. That gap between the bars is the interaction the coupon creates.

=== step === concept
::eyebrow The idea
## What makes an effect interactive?

Most of the time, you expect a predictor to do roughly the same thing regardless of what else is going on. A $10 coupon should lift order value by about the same amount for everybody. That is called an additive effect, and it is the assumption behind an ordinary regression with no interaction term.

An interaction is what you have when that assumption breaks. The coupon's lift is not one fixed number; it depends on who receives it. In this kind of study, statisticians call the coupon the treatment, the thing whose effect you are studying, and customer type the moderator, the variable that changes how big the treatment's effect turns out to be.

Here are the real numbers behind those four bars. This code builds the store's data and averages `order_value` inside each of the four groups.

```r
# Simulate 240 orders across a 2x2 coupon by customer_type design
set.seed(42)
n <- 60
coupon        <- rep(c("yes", "no"), each = 2 * n)
customer_type <- rep(rep(c("returning", "new"), each = n), times = 2)

pop_mean <- ifelse(customer_type == "returning" & coupon == "no", 84,
             ifelse(customer_type == "returning" & coupon == "yes", 88,
             ifelse(customer_type == "new" & coupon == "no", 52, 72)))

orders <- data.frame(
  coupon = factor(coupon, levels = c("no", "yes")),
  customer_type = factor(customer_type, levels = c("returning", "new")),
  order_value = round(rnorm(240, mean = pop_mean, sd = 14), 2)
)

aggregate(order_value ~ coupon + customer_type, data = orders, FUN = function(x) round(mean(x), 2))
#>   coupon customer_type order_value
#> 1     no     returning       82.05
#> 2    yes     returning       87.63
#> 3     no           new       50.96
#> 4    yes           new       73.20
```

Sixty shoppers sit in each of the four groups, 240 in total. Now do the subtraction in your head. Among returning customers, the coupon moves the average from 82.05 up to 87.63, a lift of about 5.58. Among new customers, it moves 50.96 up to 73.20, a lift of about 22.24.

The coupon was the same and the discount was the same, yet the two lifts came out very different. That is an interaction: the coupon's effect changes depending on the level of a second variable, customer type. If the lift had been about 5 or 6 for both groups, there would be no interaction to talk about, just one additive coupon effect. The gap between 5.58 and 22.24 is the interaction itself.

=== step === concept
::eyebrow The formula
## Writing an interaction into the model formula

To let R estimate this properly, you cannot just fit `coupon` and `customer_type` on their own. That would only ever give you one coupon effect, averaged over both groups, hiding the real difference between the 5.58 and 22.24 lifts.

Instead you write the two predictors with a `*` between them.

```r
# Fit the interaction model and look at its four coefficients
m1 <- lm(order_value ~ coupon * customer_type, data = orders)
round(coef(summary(m1)), 4)
#>                            Estimate Std. Error  t value Pr(>|t|)
#> (Intercept)                 82.0458     1.7521  46.8269   0.0000
#> couponyes                    5.5810     2.4779   2.2523   0.0252
#> customer_typenew           -31.0850     2.4779 -12.5451   0.0000
#> couponyes:customer_typenew  16.6618     3.5042   4.7548   0.0000
```

`coupon * customer_type` is shorthand. R expands it into three terms: `coupon`, `customer_type`, and `coupon:customer_type`, the last one being the interaction. Writing `coupon + customer_type + coupon:customer_type` by hand would fit the exact same model; `*` just saves the typing.

Four rows come out because both `coupon` and `customer_type` have two levels each, and the interaction of two two-level factors adds exactly one new row. What each of those four rows actually means is worth reading carefully.

=== step === concept
::eyebrow The coefficient table
## Reading the four rows of the coefficient table

Every row in that table answers a specific question, and the four questions build on each other.

::widget table-transform {"code":"lm(order_value ~ coupon * customer_type, data = orders)","caption":"Adding the interaction term turns the three-row additive table into a four-row table. The new row is the interaction.","before":{"cols":["term","estimate"],"rows":[["(Intercept)",77.88],["couponyes",13.91],["customer_typenew",-22.75]]},"after":{"cols":["term","estimate"],"rows":[["(Intercept)",82.05],["couponyes",5.58],["customer_typenew",-31.09],["couponyes:customer_typenew",16.66]]}}

Here is what each row of the interaction model (the "after" table) means:

- **(Intercept), 82.05.** This is the baseline cell: a returning customer who did not get the coupon. It matches the aggregate() number exactly.
- **couponyes, 5.58.** This is the coupon's effect, but only for the reference group, returning customers. On its own this row already has a real p-value of 0.025, so it is not nothing, but read on before you call it "the" coupon effect.
- **customer_typenew, -31.09.** This is the gap between new and returning customers when neither got a coupon: 50.96 minus 82.05.
- **couponyes:customer_typenew, 16.66.** This is the extra lift new customers get on top of the 5.58 that returning customers get. It is the interaction row, the one number that tells you the coupon behaves differently for the two groups.

Notice that the additive, no-interaction table only has three rows, and none of them captures "the coupon works differently for new customers." That is exactly the gap the interaction row fills.

=== step === concept
::eyebrow The key move
## The interaction coefficient is a difference of differences

The interaction row does not give you a group's real coupon effect by itself. You get a group's real effect by adding rows together.

For returning customers, the reference group, the coupon's effect is just the `couponyes` row on its own: 5.58. For new customers, you add the interaction on top of that: 5.58 + 16.66 = 22.24.

Check that against the raw cell means from the very first table, no coefficients involved: 87.63 minus 82.05 is 5.58, and 73.20 minus 50.96 is 22.24. Same two numbers, computed two different ways. The interaction coefficient, 16.66, is exactly the gap between them: 22.24 minus 5.58.

That is why it is called a difference of differences. The coupon creates a difference within each group (with coupon minus without). The interaction is the difference between those two differences.

Here is that fan-out drawn as two lines, one per customer type.

::widget chart-plotter {"data":[{"x":"no","y":82.05,"fill":"returning"},{"x":"yes","y":87.63,"fill":"returning"},{"x":"no","y":50.96,"fill":"new"},{"x":"yes","y":73.20,"fill":"new"}],"geoms":["line"],"x":"coupon","y":"order_value","code":{"line":"ggplot(cell_means, aes(x = coupon, y = order_value, colour = customer_type, group = customer_type)) +\n  geom_line(linewidth = 1) +\n  geom_point(size = 2)"}}

Both lines start together at "no". The returning-customer line stays almost flat from "no" to "yes". The new-customer line climbs steeply. Parallel lines would have meant no interaction: whatever the coupon did, it would do the same amount to both groups. These lines fan apart instead, and how far they fan apart, in dollars, is exactly the interaction coefficient.

=== step === quiz
::eyebrow Quick check
## Quick check: reading a group's real effect

::quiz {"correct":3,"gate":true,"difficulty":"beginner"}
- $5.58 ::no
- $16.66 ::no Neither of those is the new customers' own effect. The couponyes row, 5.58, belongs to returning customers. Add the interaction on top of it, 5.58 + 16.66, and you get the new customers' real effect: 22.24.
- $22.24 ::ok Right. A group's real effect is the main effect plus whatever interaction applies to that group: 5.58 + 16.66 = 22.24 for new customers.

=== step === concept
::eyebrow The test
## Is the interaction real, or could it be noise?

A gap that looks big in a chart is not automatically real. With only 60 shoppers per group, some of that 16.66 could be sampling noise. Before you trust it, test it.

The standard way is to compare two models: one without the interaction, one with it. Because every term in the smaller model also shows up in the bigger one, the smaller model is called nested inside the bigger one, and the comparison a nested F-test. If letting the coupon's effect vary by customer type barely improves the fit, the interaction term is not worth keeping.

```r
# Fit the additive model and test the interaction with a nested F-test
m0 <- lm(order_value ~ coupon + customer_type, data = orders)
anova(m0, m1)
#> Analysis of Variance Table
#>
#> Model 1: order_value ~ coupon + customer_type
#> Model 2: order_value ~ coupon * customer_type
#>   Res.Df   RSS Df Sum of Sq      F    Pr(>F)    
#> 1    237 47634                                  
#> 2    236 43470  1    4164.3 22.608 3.457e-06 ***
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
```

`m0` is the additive model, coupon and customer type each get one fixed effect, no interaction. `anova(m0, m1)` asks whether adding the interaction term to `m0` explains more of the variation in `order_value` than you would expect from adding one more term by chance alone. The answer is an F-statistic of 22.61 on 1 and 236 degrees of freedom, with p = 3.46e-06.

Here is where that F comes from. The interaction row's own t-statistic in the coefficient table was 4.75. Square it: 4.75 squared is about 22.6, the same F you just saw. That is not a coincidence. For a single interaction row like this one, the nested F-test and the coefficient's own t-test are asking the same question.

Here is that t-statistic against the range of t-values pure chance alone would produce.

::widget null-distribution {"tails":1,"max":6,"start":4.75,"label":"how far the interaction t-statistic sits from zero, square it for your F"}

Drag the marker down toward zero and the shaded tail swells, meaning a t that small would be unremarkable under pure chance. Our interaction's t sits way out at 4.75, in the thin part of the curve. p = 3.46e-06 means that if the coupon truly worked the same for both groups, results this extreme would turn up only a few times in a million tests. That is not noise.

=== step === concept
::eyebrow Reporting it
## Reporting an interaction in plain English

You now know the interaction is real. The last skill is turning it into a sentence a colleague making the pricing decision can act on.

A line like "couponyes:customer_typenew = 16.66, p < .001" tells a reader nothing they can use. It names a difference of differences without saying what either difference actually is. Nobody making a pricing decision wants to do that subtraction themselves.

The useful version states both groups' real effects, the numbers built from the coefficient rows.

```r
# Turn the interaction into a plain-English line naming both groups' effects
ret_effect <- round(coef(m1)["couponyes"], 2)
new_effect <- round(coef(m1)["couponyes"] + coef(m1)["couponyes:customer_typenew"], 2)
sprintf("Returning customers gain about $%.2f from the coupon. New customers gain about $%.2f, roughly %.1f times as much.",
        ret_effect, new_effect, new_effect / ret_effect)
#> [1] "Returning customers gain about $5.58 from the coupon. New customers gain about $22.24, roughly 4.0 times as much."
```

That sentence says exactly what a reader needs: how much each group actually gains, and how different those gains are from each other. It never quotes the bare 16.66. If you only had one sentence to spend on this result, this is the one to spend it on.

[KEY INSIGHT]
Never report only the interaction coefficient. It measures a gap between two groups' effects, not either group's own effect. Report both group effects, the way the sentence above does, and let the interaction stay in the background as the reason those two numbers differ.

=== step === quiz
::eyebrow Closing quiz
## Closing quiz: what anova() adds beyond a single p-value

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- You shouldn't bother with anova(). The coefficient's own p-value already tells you everything anova() would. ::no
- anova() tests whether the interaction, as a whole, improves the model. A single coefficient's p-value only covers its own row, which happens to be the entire interaction here because each factor has just two levels. ::ok Exactly. With two levels per factor, the interaction is one row, so the two tests happen to land on the same number. Add a third customer type and the interaction becomes several rows: only anova() checks all of them at once.
- Running anova() is really just a formality, since adding any term to a model always improves the fit a little. ::no Adding any term does lower the residual sum of squares a little, even pure noise would do that, which is exactly why a coefficient's own p-value is not always enough. anova() is what confirms the improvement is bigger than that, and with more than two levels per factor it is also the only test that covers every interaction row at once, not just one.

=== step === tryit
::eyebrow Your turn
## Closing exercise: confirm it with AIC and report it

You have tested the interaction with a nested F-test. AIC gives you a second, independent check, one that rewards a better fit but penalizes the extra parameter the interaction costs. A drop of more than about 4 points is usually taken as a real improvement.

Compare `m0` and `m1` with `AIC()`, then reuse the reporting line from before to name both groups' real effects.

```r
# Compare m0 and m1 with AIC, then report both groups' real effects
AIC(____, ____)

ret_effect <- round(coef(m1)["couponyes"], 2)
new_effect <- round(coef(m1)["couponyes"] + coef(m1)["couponyes:customer_typenew"], 2)
cat("Returning customers gain about $", ____, ". New customers gain about $", ____, ".\n", sep = "")
```
::check {"regex":"(?=[\\s\\S]*AIC[(]\\s*m0\\s*,\\s*m1\\s*[)])(?=[\\s\\S]*ret_effect)(?=[\\s\\S]*new_effect)","gate":true,"difficulty":"intermediate","ok":"That's it. AIC drops from 1958.85 to 1938.89, a difference well past the rule-of-thumb of 4 points, and the printed line spells out what that means for each group in dollars.","no":"Two things are missing. Call AIC on both models together, AIC(m0, m1). Then drop ret_effect and new_effect into the two blanks in the cat() line, so the sentence names both groups' real effects."}
::solution
```r
# Compare m0 and m1 with AIC, then report both groups' real effects
AIC(m0, m1)
#>    df      AIC
#> m0  4 1958.849
#> m1  5 1938.894

ret_effect <- round(coef(m1)["couponyes"], 2)
new_effect <- round(coef(m1)["couponyes"] + coef(m1)["couponyes:customer_typenew"], 2)
cat("Returning customers gain about $", ret_effect, ". New customers gain about $", new_effect, ".\n", sep = "")
#> Returning customers gain about $5.58. New customers gain about $22.24.
```

AIC moves from 1958.85 down to 1938.89, a drop of about 19.96, far past the 4-point rule of thumb. The nested F-test, the AIC comparison, and the plain-English line all show the same conclusion: this interaction is real, and it is worth about four times as much to a new customer as it is to a returning one.

=== step === concept
## References

- [faraway: the CRAN package supporting Linear Models with R](https://cran.r-project.org/package=faraway) - Faraway, J. (2014), 2nd Edition, Chapman & Hall, Chapter 6, Interactions in Regression.
- [car: the CRAN package supporting An R Companion to Applied Regression](https://cran.r-project.org/package=car) - Fox, J., & Weisberg, S. (2018), 3rd Edition, Sage. Models with categorical and continuous predictors.
- [Statistical difficulties of detecting interactions and moderator effects](https://doi.org/10.1037/0033-2909.114.2.376) - McClelland, G. H., & Judd, C. M. (1993), Psychological Bulletin 114(2), 376-390.
- [Formulas for Statistical Models](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/formula.html) - R Core Team, the documentation for `formula` and `lm`.

=== step === complete
## What you can now do with an interaction

You can now take a predictor whose effect might depend on a second variable, and handle it end to end.

- Write it with `*`: `lm(y ~ x * z)` expands to both main effects plus the cross term.
- Read the four-row table: the intercept and main effects describe the reference group, the interaction row is the extra lift on top of that.
- Compute a group's own effect by adding rows, never by reading one row alone.
- Test whether the interaction is real with a nested F-test, `anova(m0, m1)`, and confirm it with AIC.
- Report both groups' effects in plain numbers. The interaction coefficient explains why those two numbers differ; it is not something to quote by itself.

Interaction effects are one way a regression's output gets misread.
