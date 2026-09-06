---
title: "Regression Health Check Lesson 1: Multicollinearity: why your coefficients look wrong, and the fix"
slug: "Regression-Health-Mini-1-v2"
description: "Two correlated predictors can make a coefficient flip sign or vanish. Learn to detect multicollinearity with VIF and fix it without losing either predictor."
keywords: "multicollinearity, VIF, variance inflation factor, regression coefficients, ridge regression, correlated predictors, car::vif, regression diagnostics"
mathjax: true
webr: true
date: "2026-09-06"
post_type: "LESSON"
course_id: "regression-health-check"
course_title: "Regression Health Check"
course_lesson: "1"
course_total: "5"
course_landing: "/dashboard.html"
course_prev: ""
course_next: "Regression-Health-Mini-2"
curriculum_id: "0.0.11"
lesson_access: "windowed"
catalog_blurb: "Detect multicollinearity with VIF and fix it without dropping a variable."
---

=== step === cover
## Multicollinearity: why your coefficients look wrong, and the fix

Today let's look at what happens when two predictors in a regression carry almost the same information.

Fifty houses sold recently. For each one you know three things: its size in square feet, its number of rooms, and the price it sold for.

Start with just the first two, size and room count, plotted against each other.

::widget chart-plotter {"data":[{"x":2417,"y":9},{"x":1546,"y":5},{"x":1963,"y":8},{"x":2085,"y":8},{"x":1982,"y":7},{"x":1752,"y":6},{"x":2480,"y":9},{"x":1757,"y":6},{"x":2708,"y":9},{"x":1772,"y":6},{"x":2387,"y":8},{"x":2829,"y":10},{"x":1175,"y":4},{"x":1675,"y":6},{"x":1740,"y":6},{"x":2086,"y":8},{"x":1672,"y":6},{"x":605,"y":3},{"x":702,"y":3},{"x":2394,"y":9},{"x":1662,"y":6},{"x":998,"y":4},{"x":1723,"y":6},{"x":2347,"y":8},{"x":2653,"y":9},{"x":1606,"y":6},{"x":1684,"y":6},{"x":1007,"y":4},{"x":2007,"y":7},{"x":1512,"y":5},{"x":2005,"y":8},{"x":2117,"y":8},{"x":2266,"y":8},{"x":1526,"y":5},{"x":2027,"y":7},{"x":1027,"y":4},{"x":1447,"y":5},{"x":1417,"y":5},{"x":714,"y":3},{"x":1816,"y":7},{"x":1893,"y":7},{"x":1638,"y":6},{"x":2141,"y":8},{"x":1473,"y":6},{"x":1184,"y":4},{"x":1995,"y":7},{"x":1435,"y":5},{"x":2450,"y":8},{"x":1606,"y":6},{"x":2095,"y":8}],"geoms":["point"],"x":"sqft","y":"rooms","code":{"point":"ggplot(d, aes(sqft, rooms)) +\n  geom_point()"}}

The points line up almost perfectly. A bigger house in this data almost always brings more rooms with it, so you can barely find a big house with few rooms, or a small house with many.

That is the setup for everything that follows. When two predictors line up this closely, a regression has almost no way to separate their two effects on price. You are going to learn the one number that flags this, and two fixes that solve it without throwing away either predictor.

=== step === concept
## The coefficient that changes depending on what else is in the model

So let's put a number on that closeness in a moment. First, here is the R code that builds the full dataset: the same fifty houses, with size, rooms, and price all together.

```r
# Fifty simulated houses: size, room count, and sale price in thousands of dollars
set.seed(42)
sqft <- round(rnorm(50, 1800, 450))
rooms <- pmax(round(sqft / 280 + rnorm(50, 0, 0.35)), 2)
price <- 60 + 0.09 * sqft + 9 * rooms + rnorm(50, sd = 18)
d <- data.frame(sqft, rooms, price)

round(head(d, 5), 2)
#>   sqft rooms  price
#> 1 2417     9 380.15
#> 2 1546     5 262.95
#> 3 1963     8 290.61
#> 4 2085     8 352.92
#> 5 1982     7 289.38
```

`set.seed(42)` fixes R's random number generator, so you get this exact set of fifty houses every time you run this. `sqft` is simulated around 1800 square feet. `rooms` is built from `sqft`, scaled to roughly one room per 280 square feet, plus a little noise of its own. `price` is a straight combination of both, plus some random variation.

Now fit three separate regressions on these same fifty houses: one using only rooms, one using only sqft, and one using both together.

```r
# Fit three regressions: rooms alone, sqft alone, and both predictors together
m_rooms_only <- lm(price ~ rooms, data = d)
m_sqft_only  <- lm(price ~ sqft, data = d)
m_full       <- lm(price ~ sqft + rooms, data = d)

round(coef(m_rooms_only), 3)
#> (Intercept)       rooms 
#>      46.808      35.557 

round(coef(m_sqft_only), 3)
#> (Intercept)        sqft 
#>      55.652       0.123 

round(coef(m_full), 3)
#> (Intercept)        sqft       rooms 
#>      51.309       0.094       8.932 
```

Look at the rooms coefficient across the three models. On its own, one extra room is associated with 35.557 more in price. But once sqft joins the model, that same rooms coefficient drops to 8.932, a bit more than a quarter of what it was. sqft moves too, from 0.123 down to 0.094, but nowhere near as dramatically.

Nothing about the fifty houses changed between these three regressions. Only which predictors were included changed. That alone was enough to move the rooms coefficient by a factor of four.

=== step === concept
## Why it happens: sqft and rooms share almost all their variation

That swing has one cause: sqft and rooms carry almost the same information. Compute the correlation between them directly.

```r
# Correlation between the two predictors
round(cor(d$sqft, d$rooms), 3)
#> [1] 0.974
```

A correlation of 0.974 means sqft and rooms move in near-perfect lockstep here: knowing one tells you almost exactly the other.

Two predictors sharing this much of their variation is called multicollinearity. That is the problem for a regression that includes both. When you fit price on sqft and rooms together, the model has to split the price's estimated effect between two columns that carry almost the same information. There is no clean way to make that split, so the split it lands on is unstable, which is exactly the swing you just saw.

Here is the same relationship shown across all three variables at once: sqft, rooms, and price.

::widget correlation-heatmap {"vars":["sqft","rooms","price"],"data":{"sqft":[2417,1546,1963,2085,1982,1752,2480,1757,2708,1772,2387,2829,1175,1675,1740,2086,1672,605,702,2394,1662,998,1723,2347,2653,1606,1684,1007,2007,1512,2005,2117,2266,1526,2027,1027,1447,1417,714,1816,1893,1638,2141,1473,1184,1995,1435,2450,1606,2095],"rooms":[9,5,8,8,7,6,9,6,9,6,8,10,4,6,6,8,6,3,3,9,6,4,6,8,9,6,6,4,7,5,8,8,8,5,7,4,5,5,3,7,7,6,8,6,4,7,5,8,6,8],"price":[380.15,262.95,290.61,352.92,289.38,273.58,356.6,269.93,388.11,275.62,346.38,406.56,193.01,255.67,240.7,312.86,255.25,190.08,125.66,358.93,236.69,159.35,271.31,325.29,379.74,250.83,254.51,150.19,281.58,244.31,322.67,313.66,335.94,262.55,331.35,168.68,233.12,254.16,142.8,285.5,291.82,245.44,316.69,246.04,195.11,322.59,225.49,344.7,271.08,301.54]}}

Every pair here is strongly correlated, because price is built from both sqft and rooms. But the cell that matters most is sqft against rooms, at 0.97. That is the pair carrying almost the same information inside the regression, and it sits well past the point, somewhere north of about 0.7, where practitioners start to worry about two predictors overlapping too much.

=== step === concept
## What instability looks like: an interval crossing zero, a sign that flips

So the rooms coefficient moved from 35.557 to 8.932. But how do you know that number is genuinely unstable, rather than just smaller once sqft is accounted for? Look at its confidence interval alongside the model's overall fit.

```r
# 95% confidence interval for each coefficient, and the model's overall fit
round(confint(m_full), 3)
#>              2.5 % 97.5 %
#> (Intercept) 32.870 69.747
#> sqft         0.052  0.135
#> rooms       -3.275 21.139

round(summary(m_full)$r.squared, 3)
#> [1] 0.937
```

Look at the rooms row. Its 95% interval runs from -3.275 to 21.139. That range crosses zero, which means the data cannot even confirm the sign of the rooms effect: a coefficient anywhere from slightly negative to strongly positive is consistent with what you observed. Compare that to sqft, whose interval, 0.052 to 0.135, sits entirely above zero and is precisely pinned down.

And this is not because rooms adds nothing to the model. R² for the full model is 0.937, practically the same fit you would get from either single-predictor model. What changed is not how well the model fits, but how confidently it can price one predictor on its own.

A confidence interval is already a warning sign, but you can see the instability more directly by refitting the model on resampled versions of the same fifty houses. Draw fifty houses at random from the original fifty, allowing the same house to be drawn more than once (this is called sampling with replacement, and the whole technique is the bootstrap). Refit, record the rooms coefficient, and repeat two hundred times.

```r
# 200 bootstrap resamples: refit the model on a new random resample each time
set.seed(11)
n <- nrow(d)
rooms_coefs <- numeric(200)
for (i in 1:200) {
  idx <- sample(1:n, n, replace = TRUE)
  d_boot <- d[idx, ]
  m_boot <- lm(price ~ sqft + rooms, data = d_boot)
  rooms_coefs[i] <- coef(m_boot)["rooms"]
}

round(range(rooms_coefs), 3)
#> [1] -8.834 26.971

sum(rooms_coefs < 0)
#> [1] 17
```

Across those 200 refits, the rooms coefficient ranges all the way from -8.834 to 26.971. And 17 of the 200 resamples, getting on for one in ten, give rooms a negative coefficient: more rooms associated with a lower price, which makes no practical sense for these houses. Nothing about the true relationship between rooms and price changed between resamples. Only which fifty houses, with repeats, happened to get drawn changed, and that alone flipped the sign seventeen times out of two hundred.

Here is one specific resample, so you can see a concrete example rather than just a range.

```r
# One specific resample: refit and look at the rooms coefficient directly
set.seed(6)
idx <- sample(1:n, n, replace = TRUE)
d_boot <- d[idx, ]
m_boot <- lm(price ~ sqft + rooms, data = d_boot)
round(coef(m_boot), 3)
#> (Intercept)        sqft       rooms 
#>      58.127       0.135      -3.517 
```

In this resample, rooms comes back at -3.517, negative, while sqft stays comfortably positive at 0.135. If you had only run the regression once, on this one resample, you might have concluded rooms actually hurts price. That conclusion would be wrong, and it would only be there because of which fifty houses you happened to draw.

=== step === widget
## What happens to the interval as collinearity rises?

The widget below runs its own simulated pair of correlated predictors, not sqft and rooms directly, so it can refit thousands of times at every dial position. Read the pattern it shows, then carry it back to the house data.

::widget assumption-dial {"assumption":"multicollinearity","start":0}

Drag the severity dial from none, two uncorrelated predictors, up toward severe, a correlation close to what sqft and rooms actually have. Watch two things: the individual study intervals at the bottom of the widget, and the fit line near the top.

At low severity, the intervals at the bottom are all a similar, modest width. Drag toward severe, and those same intervals stretch out, several times wider than where you started. Meanwhile the fit line barely moves across the whole range. Rising collinearity between two predictors inflates how uncertain their coefficients are, without necessarily touching how well the model explains the data overall.

=== step === quiz
## Quick check: what the interval widening means

::quiz {"correct": 1, "gate": true, "difficulty": "beginner"}
- The interval got wider while R² stayed about the same. ::ok Right. Rising collinearity inflates how uncertain a coefficient estimate is. It does not by itself make the model fit the data any worse.
- R² dropped because the model fits worse now. ::no
- The coefficient's sign is now guaranteed wrong. ::no
- The predictor stopped mattering to price. ::no A wide interval means the data cannot pin the coefficient down precisely. It does not mean the predictor is irrelevant, it does not mean the sign is definitely wrong, and it does not mean the model fits worse. R² barely moved on the dial; only the width of the interval did.

=== step === concept
## How to compute VIF: the auxiliary regression

So far you have seen the symptom: an unstable coefficient, a wide interval, a sign that can flip under resampling. Now here is the one number that catches it directly, without a bootstrap: the Variance Inflation Factor, or VIF.

VIF for a given predictor comes down to one question: if you tried to predict that predictor from every other predictor in the model, how well could you do it? The better you can predict it, the more its information already sits inside the others, and the more unstable its own coefficient becomes.

\[
\text{VIF}_j = \frac{1}{1 - R^2_j}
\]

Here \(R^2_j\) is the R² from a regression of predictor \(j\) on all the other predictors in the model. That regression is called an auxiliary regression, because it is not the regression you actually care about. It exists only to measure how much predictor \(j\) overlaps with the rest.

With only two predictors, the auxiliary regression is simple: regress sqft on rooms, and separately regress rooms on sqft.

```r
# Auxiliary regressions: predict each predictor from the other one
r2_sqft_on_rooms <- summary(lm(sqft ~ rooms, data = d))$r.squared
r2_rooms_on_sqft <- summary(lm(rooms ~ sqft, data = d))$r.squared

round(c(sqft = r2_sqft_on_rooms, rooms = r2_rooms_on_sqft), 4)
#>   sqft  rooms 
#> 0.9494 0.9494 

vif_by_hand <- 1 / (1 - c(sqft = r2_sqft_on_rooms, rooms = r2_rooms_on_sqft))
round(vif_by_hand, 2)
#>  sqft rooms 
#> 19.77 19.77 
```

Both auxiliary R²s come out at 0.9494. With only two predictors, regressing sqft on rooms and regressing rooms on sqft measure the same shared correlation from opposite sides, so they always match here. Plugging 0.9494 into the formula gives a VIF of 19.77 for both sqft and rooms, the same number the bootstrap and the confidence interval were both pointing at, without needing to refit anything two hundred times.

=== step === concept
## Reading VIF in R: car::vif() and the thresholds

You will not usually compute VIF by hand like that. In practice you reach for the car package's `vif()` function, which runs the auxiliary regressions for you.

```r
# car::vif() computes the same VIF automatically
suppressMessages(library(car))
round(vif(m_full), 2)
#>  sqft rooms 
#> 19.77 19.77 
```

Both come out at 19.77, matching the by-hand computation exactly.

How do you read a VIF value once you have it? Three rough bands are the standard convention:

- VIF near 1 means essentially no redundancy: the predictor carries information the others do not have.
- VIF between about 1 and 5 is generally fine and worth a quick look.
- VIF above 10 is treated as urgent: the coefficient estimate depends on a sliver of information the predictor does not share with the rest of the model.

At 19.77, sqft and rooms are almost double the urgent threshold. This is not a borderline case.

=== step === concept
## Fix one: drop the predictor that repeats another

The fastest fix is also the simplest: if two predictors carry almost the same information, keep one and drop the other. You already fit this exact model earlier, price on sqft alone. Look at it again, now as the fix rather than as one of three comparisons.

```r
# Drop rooms and look at the sqft-only model again, this time as the fix
round(summary(m_sqft_only)$r.squared, 3)
#> [1] 0.934

round(summary(m_full)$r.squared, 3)
#> [1] 0.937

round(coef(m_sqft_only), 3)
#> (Intercept)        sqft 
#>      55.652       0.123 
```

R² drops only from 0.937 to 0.934, a difference of three thousandths. sqft's coefficient, 0.123, is now a single stable number instead of one end of a wide, sign-flipping range.

Notice what did not decide which predictor to drop: it was not "whichever one has the higher VIF," because both VIFs are exactly tied at 19.77. When two predictors are this correlated, the choice of which one to keep is a business decision, not a statistical one. Square footage is usually easier to record consistently than a room count, since what counts as a room varies by listing, so sqft is often the one worth keeping. But that judgment comes from knowing the data, not from the VIF number itself.

=== step === widget
## Fix two: shrink coefficients instead of dropping them

Dropping a predictor works, but it throws that predictor's information away completely. If both sqft and rooms genuinely matter to a business decision, you may not want to delete either one. Ridge regression shrinks every coefficient toward a shared, more stable value instead of dropping any of them.

Ridge adds a penalty, called lambda, that punishes large coefficients. As lambda rises from zero, unstable coefficients move away from their original values and pull toward each other. The widget below demonstrates this on six generic standardized predictors, not sqft and rooms specifically, so you can watch every coefficient's path as the penalty rises and see lasso, a related penalized regression method, drive some paths all the way to zero.

::widget coef-path {}

Now here is that same shrinkage computed directly on sqft and rooms, standardized so they sit on the same scale.

```r
# Ridge regression by hand: standardize sqft and rooms, then shrink toward a shared value
X <- scale(as.matrix(d[, c("sqft", "rooms")]))
y <- d$price - mean(d$price)

ridge_coef <- function(lambda) {
  I <- diag(ncol(X))
  solve(t(X) %*% X + lambda * I) %*% t(X) %*% y
}

for (lambda in c(0, 1, 5, 20, 50)) {
  cat("lambda =", lambda, ": sqft =", round(ridge_coef(lambda)[1], 3),
      " rooms =", round(ridge_coef(lambda)[2], 3), "\n")
}
#> lambda = 0 : sqft = 48.492  rooms = 15.851 
#> lambda = 1 : sqft = 40.928  rooms = 22.758 
#> lambda = 5 : sqft = 33.867  rooms = 27.315 
#> lambda = 20 : sqft = 27.624  rooms = 25.696 
#> lambda = 50 : sqft = 21.61  rooms = 20.81 
```

At lambda 0, no penalty at all, sqft sits at 48.492 and rooms at 15.851 on this standardized scale, an unstable, far-apart pair matching the instability you already saw. As lambda rises to 50, they converge to 21.61 and 20.81, close together and far more stable than either extreme.

Ridge never sets a coefficient to exactly zero, which is what the widget's ridge line showed you: every path bends but none of them touch zero. Push a lasso penalty high enough instead, and it can drive a coefficient to exactly zero, which is really just an automatic, data-driven version of the drop-the-predictor fix you saw earlier.

=== step === quiz
## Quick check: choosing a fix

Two correlated predictors are both meaningful to the business decision you are making. Which fix keeps both of them in the model while stabilizing their coefficients?

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- Ridge regression, since it shrinks both coefficients toward a shared, stable value instead of deleting either predictor. ::ok Right. Ridge is exactly the fix for when both predictors need to stay in the model. It trades a little bias for a large drop in how unstable each coefficient is.
- Drop whichever predictor has the higher VIF, since that one is more collinear. ::no
- Add more data until the correlation between the predictors goes away on its own. ::no
- Center both predictors, since that removes multicollinearity between them. ::no Two correlated predictors have identical VIFs when there are only two of them, as sqft and rooms do here, so "the higher VIF" is not even a meaningful tiebreaker. More data does not fix multicollinearity either: with a fixed correlation between two predictors, VIF stays the same no matter how many rows you add. And centering changes the intercept's interpretation, not the correlation between the predictors themselves. Ridge is the fix that actually keeps both predictors while stabilizing them.

=== step === tryit
## Your turn: confirm the fix keeps the fit

Confirm for yourself that dropping rooms barely changes how well the model fits. `ex_model` below has already been fit for you, using just sqft. Add one line that reports its R².

```r
# Refit with just sqft, then report how much of the price variance it explains
ex_model <- lm(price ~ sqft, data = d)
# your code here: report the R-squared of ex_model
# Expected: a value at or above 0.93, matching the sqft-only model from a few steps back.
```
::check {"regex": "summary\\s*[(]\\s*ex_model\\s*[)]\\s*\\$r\\.squared", "gate": true, "difficulty": "intermediate", "ok": "Right: R-squared here is 0.934, just three thousandths below the full model's 0.937. Dropping rooms cost almost nothing.", "no": "Pull the R-squared out of the model summary: summary(ex_model)$r.squared."}
::solution
```r
# Refit with just sqft, then report how much of the price variance it explains
ex_model <- lm(price ~ sqft, data = d)
round(summary(ex_model)$r.squared, 3)
#> [1] 0.934
```

=== step === concept
## References

- [An Introduction to Statistical Learning](https://www.statlearning.com/) - James, Witten, Hastie, and Tibshirani. The standard textbook treatment of collinearity and VIF.
- [Applied Linear Statistical Models](https://search.worldcat.org/title/Applied-linear-statistical-models/oclc/55502728) - Kutner, Nachtsheim, Neter, and Li. The variance inflation factor, derived in full.
- [car: Companion to Applied Regression](https://cran.r-project.org/package=car) - CRAN documentation for the `vif()` function used in this lesson.
- [A Caution Regarding Rules of Thumb for Variance Inflation Factors](https://doi.org/10.1007/s11135-006-9018-6) - O'Brien, R.M. (2007), Quality & Quantity 41(5), 673-690. A critical look at the common VIF thresholds, including the rule of 10, and where they break down.
- [Ridge Regression: Biased Estimation for Nonorthogonal Problems](https://doi.org/10.1080/00401706.1970.10488634) - Hoerl, A.E. and Kennard, R.W. (1970), Technometrics 12(1), 55-67. The original ridge regression paper.

=== step === complete
## What you can do now

You now have a complete way to catch and fix multicollinearity in your own regressions.

- Watch for the pattern: a confidence interval that crosses zero, or a coefficient whose sign flips when you refit on a resample. Either one signals that the model cannot separate two predictors reliably.
- Compute VIF, by hand or with `car::vif()`, and read it against the standard bands: near 1 is clean, above 5 is worth investigating, above 10 is urgent.
- Fix it one of two ways: drop whichever redundant predictor makes more sense for the business, or shrink both with ridge if you need to keep every predictor in the model.

The next lesson in Regression Health Check moves to a different way a regression can go wrong: whether its residuals are correlated with each other over time, rather than independent the way ordinary least squares assumes.
