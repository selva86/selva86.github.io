---
post_type: "LESSON"
course_id: "regression-health-check"
course_title: "Regression Health Check"
course_lesson: "4"
course_total: "5"
course_landing: "/dashboard.html"
course_prev: "Regression-Health-Mini-3"
course_next: ""
curriculum_id: "0.0.27"
lesson_access: "windowed"
title: "Cook's distance: find the points that change your model"
catalog_blurb: "Find the one row steering your regression, and what to do about it."
description: "Learn to compute Cook's distance and leverage in R, test whether a regression result survives removing one influential point, and decide what to do next."
keywords: "Cook's distance, leverage, hat values, influential observations, regression diagnostics, robust regression, rlm, R"
mathjax: false
webr: true
date: "2026-09-09"
---

=== step === cover
## Cook's distance: find the points that change your model

Today let's understand Cook's distance clearly, using a simple example.

Say you track 20 business customers. For each one you know two things: how many years they have been a customer, their tenure, and how big their average order is in dollars. Nineteen of them look like ordinary customers. Then there is Meridian Corp.

The scatter below plots all 20. Look for the one point that does not sit with the rest.

::widget chart-plotter {"data":[{"x":5.6,"y":285,"fill":"Regular customers"},{"x":5.7,"y":247,"fill":"Regular customers"},{"x":2.4,"y":328,"fill":"Regular customers"},{"x":5.2,"y":281,"fill":"Regular customers"},{"x":4.2,"y":319,"fill":"Regular customers"},{"x":3.6,"y":309,"fill":"Regular customers"},{"x":4.7,"y":306,"fill":"Regular customers"},{"x":1.7,"y":294,"fill":"Regular customers"},{"x":4.3,"y":309,"fill":"Regular customers"},{"x":4.5,"y":256,"fill":"Regular customers"},{"x":3.3,"y":289,"fill":"Regular customers"},{"x":4.6,"y":275,"fill":"Regular customers"},{"x":5.7,"y":338,"fill":"Regular customers"},{"x":2.3,"y":332,"fill":"Regular customers"},{"x":3.3,"y":291,"fill":"Regular customers"},{"x":5.7,"y":289,"fill":"Regular customers"},{"x":5.9,"y":268,"fill":"Regular customers"},{"x":1.6,"y":304,"fill":"Regular customers"},{"x":3.4,"y":300,"fill":"Regular customers"},{"x":9,"y":14800,"fill":"Meridian Corp"}],"geoms":["point"],"x":"tenure","y":"order_value","code":{"point":"ggplot(df, aes(tenure, order_value, color = group)) +\n  geom_point(size = 3)"}}

That point in the top right, off on its own on both axes, is Meridian Corp: nine years of tenure and an average order of $14,800, while the other nineteen sit between $247 and $338. That gap between Meridian Corp and the rest is exactly what you are about to measure.

=== step === concept
## Fit the trend, and one row seems to be driving it

Let's build the dataset behind that scatter and fit a line through it: average order value explained by tenure.

```r
# Build the 20-customer dataset and fit average order value on tenure
set.seed(42)
tenure <- round(runif(19, 1, 6), 1)
order_value <- round(280 + rnorm(19, 0, 30), 0)
customers <- data.frame(
  customer = c(paste0("Customer", 1:19), "Meridian Corp"),
  tenure = c(tenure, 9.0),
  order_value = c(order_value, 14800)
)
rownames(customers) <- customers$customer

full <- lm(order_value ~ tenure, data = customers)
round(coef(summary(full)), 4)
#>              Estimate Std. Error t value Pr(>|t|)
#> (Intercept) -3994.105  1588.2309 -2.5148   0.0216
#> tenure       1156.887   340.9014  3.3936   0.0032
```

This data frame isn't built from the nineteen regular customers alone. `runif(19, 1, 6)` draws each one's tenure between 1 and 6 years, and `280 + rnorm(19, 0, 30)` draws an order value scattered around $280. Meridian Corp is added on afterward, by hand, with its own tenure and order value.

Read the coefficient table. The tenure coefficient is 1156.89, and its p-value is 0.0032, comfortably below the usual 0.05 cutoff. On the face of it, that says every extra year of tenure goes with $1,156.89 more in average order value, and the effect is statistically significant. The model also reports an R-squared of 0.39, meaning tenure explains about 39% of the spread in order value.

That is a real-looking result. But one row in this data frame is nothing like the other nineteen, and a coefficient built from 20 points can lean heavily on just one of them. Before trusting 1156.89, it's worth asking how much of it Meridian Corp is responsible for.

=== step === widget
## Leverage: how unusual a point's tenure is

To answer that, you need two ideas, and leverage is the first one.

Leverage measures how far a point's x-value, tenure in this case, sits from the average tenure in the data. A point close to the average tenure barely affects the slope of the line, because the line has to pass close to it no matter how it's tilted. A point whose tenure is far from the average has more room to swing the line toward itself.

The chart below isn't built from Meridian Corp's numbers. It uses its own simple example: seven ordinary points and one point far out on the x-axis, whose y-value you can drag. But it shows exactly the mechanism that gives Meridian Corp's 9-year tenure, far beyond the other nineteen's 1.6 to 5.9 years, so much influence over the fitted line.

::widget leverage-point {}

Drag that far-out point up and down and watch the solid line chase it while the dashed line, the fit without it, barely moves. That gap between the two lines is leverage doing its work.

Now measure it for real, on the customers you already fit.

```r
# Compare each customer's hat value (leverage) with the average and the 2p/n threshold
hat_values <- hatvalues(full)
round(c(
  meridian = unname(hat_values["Meridian Corp"]),
  mean_hat = mean(hat_values),
  threshold = 2 * 2 / nrow(customers)
), 3)
#>  meridian  mean_hat threshold 
#>     0.424     0.100     0.200
```

`hatvalues()` returns each row's leverage, often called its hat value. Across all 20 customers the average hat value is 0.100, and a common rule of thumb flags anything above 2p/n, where p is the number of parameters in the model (2, for the intercept and the tenure slope) and n is the number of rows (20). That threshold works out to 0.200. Meridian Corp's hat value is 0.424, more than twice that cutoff and over four times the average.

[NOTE]
A high hat value only says a point's tenure is unusual. It doesn't say the point is distorting anything by itself. A high-leverage point that happens to sit close to the fitted line has a small residual and pulls the line very little. To know how much a point actually influences the fit, you need its leverage and the size of its residual combined into one number.

=== step === concept
## Cook's distance: leverage and residual combined into one number

Cook's distance is the number that combines a point's leverage with the size of its residual, its distance from the fitted line, into a single influence score for that row.

```r
# Find the row with the largest Cook's distance and compare it with the 4/n threshold
cooks_d <- cooks.distance(full)
names(which.max(cooks_d))
#> [1] "Meridian Corp"
round(c(
  meridian = unname(cooks_d["Meridian Corp"]),
  threshold = 4 / nrow(customers)
), 3)
#>  meridian threshold 
#>     6.611     0.200
```

`cooks.distance()` computes one value per row, and `which.max()` names the row with the biggest one: Meridian Corp, no surprise given what the scatter already showed. A common cutoff for Cook's distance is 4/n, which for 20 rows is 0.200. Meridian Corp's value is 6.611, over 33 times that cutoff.

Its residual, the gap between its actual order value and what the line predicts for it, is $8,382.10. High leverage and a large residual together are what push Cook's distance this far past the threshold. Either one alone would have produced a far smaller Cook's distance, which is exactly why the two get combined into one score instead of read separately.

=== step === quiz
## Quick check: what a high Cook's distance does and does not mean

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- Delete the row immediately. A Cook's distance this high means the entry must be wrong. ::no
- It flags the row for a closer look. On its own it doesn't diagnose an error or demand deletion. ::ok Right. Cook's distance tells you where to look, not what you'll find when you get there. Whether the result actually depends on this one row is worth checking directly.
- Ignore the flag unless the tenure coefficient's p-value is also below 0.05. ::no The tenure coefficient's p-value was already below 0.05 before you ever looked at Cook's distance, and that is exactly the number in question. A large Cook's distance is a reason to test whether that p-value can be trusted, not a signal you can wave away with it.

=== step === concept
## Refit without the flagged row: does the trend survive?

Cook's distance told you Meridian Corp has an outsized pull on the fit. The only way to find out what that pull is doing to your conclusion is to remove the row and refit.

```r
# Refit without Meridian Corp and compare the tenure coefficient
fit_drop <- lm(order_value ~ tenure, data = customers[customers$customer != "Meridian Corp", ])
round(rbind(
  full    = coef(summary(full))["tenure", c("Estimate", "Std. Error", "Pr(>|t|)")],
  dropped = coef(summary(fit_drop))["tenure", c("Estimate", "Std. Error", "Pr(>|t|)")]
), 4)
#>          Estimate Std. Error Pr(>|t|)
#> full    1156.8870   340.9014   0.0032
#> dropped   -7.2273     3.8657   0.0789
```

Look at what one row did. With Meridian Corp in the data, the tenure coefficient is 1156.89 and significant at p = 0.0032. Take that single row out, refit on the remaining 19 customers, and the coefficient becomes -7.23, with a p-value of 0.0789, above the usual 0.05 line.

That is not a small adjustment. The coefficient did not just shrink, it changed sign, and the result went from significant to not significant. Everything that made this look like a real, positive relationship between tenure and order value was coming from one customer out of twenty. Without Meridian Corp, there is no relationship here worth reporting as a finding.

=== step === widget
## Robust regression: an independent check that confirms the refit

Refitting without Meridian Corp is one way to test the trend. Robust regression is a second, independent way to ask the same question, and it never removes a single row.

An ordinary least-squares fit, the `lm()` you have been using, gives every row equal weight in fitting the line. A robust regression such as `rlm()` starts the same way, then looks at how far each point sits from the fit and turns down the weight of the ones that sit furthest away, automatically, without you naming a row.

The chart below doesn't use Meridian Corp's numbers either. It has its own 14 ordinary points and one outlier, and a toggle for the fitting method. But watch what happens to that outlier's weight as you move the toggle: the same down-weighting rlm() will do to Meridian Corp.

::widget robust-weights {}

OLS gives every point the same weight, so the one outlier drags the fitted line toward itself. Switch to Huber, then Tukey, and the outlier's weight falls and the line snaps back toward the true trend running through the other 14 points.

Now run the same fit on the customers data.

```r
# Fit a robust regression and read the weight it assigns Meridian Corp
library(MASS)
rob <- rlm(order_value ~ tenure, data = customers)
round(rbind(OLS = coef(full), robust = coef(rob)), 3)
#>        (Intercept)   tenure
#> OLS      -3994.105 1156.887
#> robust     311.836   -3.455
round(c(meridian_weight = unname(setNames(rob$w, customers$customer)["Meridian Corp"])), 3)
#> meridian_weight 
#>           0.002
```

`rlm()` assigned Meridian Corp a weight of 0.002, close enough to zero that the row barely counts toward the fit anymore. With that weight near zero, the robust tenure coefficient comes out at -3.455, negative, the same direction as the leave-one-out refit's coefficient.

Two completely different methods, one that removes a row and one that never does, both agree: once Meridian Corp stops driving the fit, there is no positive trend between tenure and order value. That agreement is what makes the finding robust.

=== step === concept
## Decide, and say so: four honest responses and how to report it

You have now confirmed that Meridian Corp is carrying the entire result. The question left is what to actually do about it, and there are exactly four honest answers.

- **Keep it.** Use this when the conclusion holds whether the point is in or out. You show the reader both fits, and the estimate barely moves between them.
- **Investigate and correct.** Use this when the value looks like a recording or entry error you can verify and fix. You show the corrected value and where it came from, never a silent deletion.
- **Down-weight it.** Use this for a genuine extreme value you don't want to delete but also don't want dominating the fit. You show the robust and ordinary estimates side by side.
- **Drop it, with a stated reason.** Use this only when the case falls outside what your study was ever meant to cover, on a criterion you fixed before you looked at what dropping it would do to your result.

One move that is never on the table: dropping a point because the result you wanted shows up once it's gone. That is not a data decision, it is a results decision, and a reviewer who suspects it happened will trust nothing else you report.

Meridian Corp is a real, correctly recorded account. There's no entry error to correct and no criterion that places it outside the population of customers you set out to study, so correcting and dropping are both off the table here. It is a genuine extreme case, which is what down-weighting is for, and the robust fit already did exactly that. So the honest response is to report both fits rather than repeat 1156.89 (p = 0.0032) as a settled result.

[KEY INSIGHT]
A one-line template covers most of these write-ups: name the point, state what leaving it out changed, state the decision. For Meridian Corp: "Meridian Corp had a Cook's distance of 6.611, above the 4/n threshold of 0.200. Removing it changed the tenure coefficient from 1156.89 (p = 0.0032) to -7.23 (p = 0.0789), confirmed by a robust fit (coefficient -3.455). The relationship does not hold once this account is removed, so it is reported as unsupported rather than as a finding."

=== step === quiz
## Practice: putting the check together

Suppose a different regression, on a different dataset, flags a different row with a high Cook's distance. You dig into that row and find it's a duplicated data entry, the same order was accidentally logged twice.

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Keep it. It's just one influential row, and the fit is barely affected either way. ::no
- Investigate and correct it, since a duplicated entry is a genuine recording error you can fix. ::ok Right. You found a specific, verifiable mistake, not just an unusual value. Correcting it (or removing the duplicate row) is the honest fix. Down-weighting or dropping-with-a-reason are both for cases where the value itself is genuine.
- Down-weight it with a robust fit, the same way you handled Meridian Corp. ::no
- Drop it, since it's clearly not representative of the rest of the data. ::no A duplicated entry is a specific, fixable mistake, not a genuine extreme value and not a case that falls outside your study's population. Down-weighting and dropping are both responses for a value that turns out to be real. Here the honest fix is to find the error and correct it, which usually means removing the duplicate row entirely.

=== step === tryit
## Your turn: test whether the trend survives on your own

The starter below rebuilds the customers data and the full model, then drops one named customer and compares its tenure coefficient with the full-data value of 1156.89. Right now it drops Meridian Corp, which you already know collapses the trend. Change `drop_name` to Customer18, the regular customer with the largest Cook's distance among the other nineteen, and press Run to see what dropping an ordinary row does instead.

```r
# Starter: refit without one customer and compare the tenure coefficient to the full-data value
set.seed(42)
tenure <- round(runif(19, 1, 6), 1)
order_value <- round(280 + rnorm(19, 0, 30), 0)
customers <- data.frame(
  customer = c(paste0("Customer", 1:19), "Meridian Corp"),
  tenure = c(tenure, 9.0),
  order_value = c(order_value, 14800)
)
full <- lm(order_value ~ tenure, data = customers)

# Change the name below, then press Run
drop_name <- "Meridian Corp"
fit_drop <- lm(order_value ~ tenure, data = customers[customers$customer != drop_name, ])
round(c(full_coef = coef(full)["tenure"], dropped_coef = coef(fit_drop)["tenure"]), 2)
```
::check {"regex": "1296\\.69", "gate": true, "difficulty": "intermediate", "ok": "Right. Dropping Customer18 barely moves the coefficient, from 1156.89 to 1296.69, both clearly positive. Meridian Corp is the only row whose removal changes the story.", "no": "Change drop_name to Customer18 (the regular customer with the largest Cook's distance among the other nineteen) and press Run again."}
::solution
```r
# Drop Customer18 instead of Meridian Corp, and compare the tenure coefficient again
drop_name <- "Customer18"
fit_drop <- lm(order_value ~ tenure, data = customers[customers$customer != drop_name, ])
round(c(full_coef = coef(full)["tenure"], dropped_coef = coef(fit_drop)["tenure"]), 2)
#>    full_coef dropped_coef 
#>      1156.89      1296.69
```

Dropping Customer18, an ordinary row, barely moves the coefficient: 1156.89 becomes 1296.69, still clearly positive. Dropping Meridian Corp sent it to -7.23. Only one row in this data can change the conclusion, and Cook's distance is exactly what pointed you to it.

=== step === concept
## References

- [Detection of Influential Observation in Linear Regression](https://doi.org/10.1080/00401706.1977.10489493) - Cook, R.D. (1977), Technometrics, 19(1), 15-18. The original paper defining Cook's distance.
- [Regression Diagnostics: Identifying Influential Data and Sources of Collinearity](https://onlinelibrary.wiley.com/doi/book/10.1002/0471725153) - Belsley, D.A., Kuh, E., & Welsch, R.E. (1980), Wiley. The standard reference for leverage, influence, and collinearity diagnostics together.
- [Modern Applied Statistics with S](https://link.springer.com/book/10.1007/978-0-387-21706-2) - Venables, W.N., & Ripley, B.D. (2002), 4th edition, Springer. The book behind the `MASS` package and its `rlm()` function.
- [Applied Regression Analysis and Generalized Linear Models](https://collegepublishing.sagepub.com/products/applied-regression-analysis-and-generalized-linear-models-3-237254) - Fox, J. (2016), 3rd edition, Sage. A thorough treatment of regression diagnostics and robust regression.
- [Influence measures for linear models](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/influence.measures.html) - R Core Team, the documentation behind `cooks.distance()`, `hatvalues()`, and `influence.measures()`.

=== step === complete
## You can now flag, test, and defend an influential point

Here's what the Meridian Corp example walked you through. Its Cook's distance was 6.611 against a 0.200 cutoff, more than 33 times over. Refitting without it took the tenure coefficient from 1156.89 (p = 0.0032) to -7.23 (p = 0.0789), and a robust fit that never removed the row agreed, putting the coefficient at -3.455. Two different methods, one answer: the trend was never really there.

You now have the full check. Compute Cook's distance and leverage, and read them against their usual cutoffs. Refit without the flagged row to see whether your finding survives. Confirm it with a robust fit, which reaches its own answer without deleting anything. Then choose the honest response, keep it, correct it, down-weight it, or drop it with a stated reason, and report what you found instead of the number you started with.

The next time one row makes a regression look better than it should, you'll know exactly how to find it, and exactly what to do once you have.
