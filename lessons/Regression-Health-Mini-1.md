---
title: "Multicollinearity: why your coefficients look wrong, and the fix"
slug: "Regression-Health-Mini-1"
description: "When two predictors overlap, one coefficient can come back negative. Measure that overlap with VIF in R, then choose between reporting, dropping and ridge."
keywords: "multicollinearity in R, variance inflation factor, VIF in R, correlated predictors, collinearity diagnostics, ridge regression in R, lm coefficients"
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
course_next: ""
curriculum_id: "0.0.11"
lesson_access: "windowed"
catalog_blurb: "How to spot correlated predictors and pick the right fix for them."
---

=== step === cover
## Multicollinearity: why your coefficients look wrong, and the fix

Today let's take a regression that looks broken, work out what is actually wrong with it, and fix it.

Say your job is to put a price on a house, and for each one you have three measurements: the floor area in square feet, the number of rooms, and how old the building is. You put all three into a linear model, which is exactly the right thing to do.

You fit the model and the room count comes back at minus 10.6. Every extra room takes 10,600 off the predicted price. Its p value is 0.41, so the number cannot even be told apart from zero. Area and age, sitting in the same output, look perfectly sensible.

Nothing failed, by the way. There is no error and no warning, and the model still explains 70 percent of the variation in price.

The cause is that a room count is very nearly a restatement of a floor area. When two columns carry that much of the same information, almost nothing is left for the room coefficient to be estimated from, and a coefficient estimated from almost nothing can land anywhere, including on the wrong side of zero.

The name for this is multicollinearity. There is a number that measures it, and four sensible things to do once you have that number. The whole path is three moves.

::widget process-flow {"steps":[{"title":"Fit the model, read the coefficients","sub":"one predictor comes back negative"},{"title":"Measure the overlap with VIF","sub":"how much of each predictor the others already explain"},{"title":"Pick a response","sub":"report as it stands, drop, separate, or shrink"}]}

So: fit the model and read what it gives you, measure the overlap between the predictors, then choose a response. Let's build the house data first.

=== step === concept
## A house price model where one coefficient flips sign

Let's set up the data first, because every number from here on comes out of it.

The data covers 180 houses in one city. For each house we have the sale price in thousands of dollars, the floor area in square feet, the number of rooms, and the age of the building in years.

We are simulating the data ourselves, and that is deliberate: it means we know the truth the model is trying to recover. Every square foot adds 0.14 to the price, every room adds 12, and every year of age takes off 0.8. The room count is the floor area divided by 430 and rounded, plus a small amount of noise, which is roughly how room counts and floor areas go together in real housing data.

Press Run.

```r
# Build the 180 homes and look at the first few rows
set.seed(115)
n     <- 180
area  <- round(rnorm(n, 1900, 520))               # floor area in square feet
rooms <- round(area / 430 + rnorm(n, 0, 0.20))    # room count, built to track area
age   <- round(runif(n, 0, 60))                   # age in years
price <- round(55 + 0.14 * area + 12 * rooms - 0.8 * age + rnorm(n, 0, 55), 1)

homes <- data.frame(price, area, rooms, age)
head(homes)
#>   price area rooms age
#> 1 416.3 2229     5  48
#> 2 471.1 2198     5  18
#> 3 352.1 2181     5  22
#> 4 336.2 1804     4  28
#> 5 293.9 1958     5  50
#> 6 380.2 2276     5  55
```

The first house has 2,229 square feet, 5 rooms, 48 years on it, and sold for 416.3 thousand.

Now fit the model the way anyone would, with all three predictors on the right hand side.

```r
# Fit price on all three predictors and read the coefficient table
m_full <- lm(price ~ area + rooms + age, data = homes)
round(summary(m_full)$coefficients, 3)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)   57.283     20.049   2.857    0.005
#> area           0.196      0.033   6.008    0.000
#> rooms        -10.642     12.973  -0.820    0.413
#> age           -0.989      0.269  -3.674    0.000
```

Read the rooms row first. The estimate is -10.642, so this model says that an extra room takes 10,642 off the price of a house. We generated the data with a true room effect of plus 12, so even the sign is wrong.

The standard error beside it is 12.973, larger than the estimate itself, so the t value in the next column is only -0.820. That is why the p value comes out at 0.413.

Now the other two rows. Area is 0.196 with a standard error of 0.033, and age is -0.989 with a standard error of 0.269. Both have the right sign and both are estimated tightly. Two of the three coefficients came out fine.

The interval around the rooms estimate says the same thing in a more useful way.

```r
# The 95 percent interval for each coefficient, and how much of price the model explains
round(confint(m_full), 2)
#>              2.5 % 97.5 %
#> (Intercept)  17.71  96.85
#> area          0.13   0.26
#> rooms       -36.24  14.96
#> age          -1.52  -0.46

round(summary(m_full)$r.squared, 4)
#> [1] 0.7013
```

The rooms interval runs from -36.24 to 14.96. It does contain the true value of 12, so the model is not wrong. But it also contains -30, and zero, and everything in between. The interval is correct and nearly empty of information at the same time.

R-squared is 0.7013, so the model still explains 70 percent of the variation in price. Whatever went wrong with that one coefficient never showed up in the fit.

=== step === concept
## What the rooms coefficient is asked to measure

So why did that one coefficient come apart while the other two held?

Start with what a regression coefficient actually means. In a multiple regression, the coefficient on rooms is not the price difference between houses with more rooms and houses with fewer. It is the price difference between two houses of the same floor area and the same age that differ by one room. Area held fixed, age held fixed, only the room count moving.

Answering that needs data of exactly that kind: houses of the same size with different room counts. So let's find out how much of that kind of variation the 180 houses actually contain.

```r
# How strongly every pair of columns moves together
round(cor(homes), 2)
#>       price  area rooms   age
#> price  1.00  0.82  0.78 -0.21
#> area   0.82  1.00  0.96 -0.07
#> rooms  0.78  0.96  1.00 -0.06
#> age   -0.21 -0.07 -0.06  1.00
```

The cell to look at is area against rooms: 0.96. Those two columns are very nearly the same column. Age is unrelated to both, at -0.07 and -0.06, and it is worth remembering that age is the odd one out here.

Here is the same matrix as colour, which makes the pattern easier to take in at a glance.

::widget correlation-heatmap {"vars":["price","area","rooms","age"],"matrix":[[1,0.82,0.78,-0.21],[0.82,1,0.96,-0.07],[0.78,0.96,1,-0.06],[-0.21,-0.07,-0.06,1]]}

A correlation is a pairwise number, though, and a regression adjusts for all the other predictors at once. So the question is not how much of rooms area explains. It is how much of rooms area and age explain together. Regress rooms on both of them and read the R-squared.

```r
# Regress rooms on the other two predictors to see how much of it they already explain
aux_rooms <- lm(rooms ~ area + age, data = homes)
round(summary(aux_rooms)$r.squared, 3)
#> [1] 0.93
```

0.93. Area and age together account for 93 percent of the variation in the room count. Only 7 percent of it is left over, and that leftover is the houses that have more or fewer rooms than their size and age would suggest.

That 7 percent is the only part of the data the rooms coefficient can be estimated from. Everything else about the room count is already spoken for by area. So the model is estimating a real quantity from a very thin slice of the data, and 12.973 is what that thinness costs.

=== step === concept
## VIF: how much of a predictor the others already explain

That leftover share is worth turning into a number you can compute for every predictor, because it is the standard diagnostic for exactly this. It is called the Variance Inflation Factor, usually written VIF, and it is built straight out of the regression we just ran, the one with a predictor on the left and the rest of them on the right. A fit like that is called an auxiliary regression: you never report it, you run it to find out how much of one predictor the others already hold.

\[ \text{VIF}_j = \frac{1}{1 - R^2_j} \]

R-squared with a subscript j is what we computed for rooms: 0.93. So 1 minus it, the 0.07, is the share of predictor j that the other predictors cannot explain, and the VIF is one divided by that.

Read the two ends of the scale. A predictor that the others cannot explain at all has an auxiliary R-squared of 0 and a VIF of 1. A predictor the others can predict perfectly has an R-squared approaching 1 and a VIF that runs off to infinity.

Let's compute it for all three predictors, each from its own auxiliary regression.

```r
# Compute the VIF of every predictor from its own auxiliary regression
predictors <- c("area", "rooms", "age")

vif_manual <- sapply(predictors, function(p) {
  others <- setdiff(predictors, p)
  f  <- as.formula(paste(p, "~", paste(others, collapse = " + ")))
  r2 <- summary(lm(f, data = homes))$r.squared
  1 / (1 - r2)
})

round(vif_manual, 2)
#>  area rooms   age
#> 14.30 14.29  1.00
```

Area is 14.30, rooms 14.29, age 1.00.

Age comes in at 1.00, the floor of the scale, because nothing else in the model explains how old a building is. Area and rooms both come in at 14.3, and they have to be close, since each one is mostly explaining the other.

You would not write that loop in practice. The car package does the same job in one line.

```r
# The same three numbers in one line
suppressMessages(library(car))
round(vif(m_full), 2)
#>  area rooms   age
#> 14.30 14.29  1.00
```

The same three numbers. `vif()` runs those auxiliary regressions internally, so there is nothing hidden in it.

But what does 14.30 mean for the coefficient? The name says it: the VIF is the factor by which the overlap inflates the variance of that coefficient. A standard error is the square root of a variance, so take the square root of the VIF.

```r
# Turn each VIF into the multiplier it puts on that coefficient standard error
round(sqrt(vif_manual), 2)
#>  area rooms   age
#>  3.78  3.78  1.00
```

3.78. The standard error on rooms is 3.78 times what it would be if area and age explained none of it. That is the damage, stated as a multiplier.

We can check that against the model's own arithmetic. The standard error of a coefficient is the residual standard deviation divided by the square root of two things multiplied together: the total squared spread of that predictor, and the fraction of it the other predictors leave unexplained. Drop that second factor and you get the standard error you would have had with no overlap at all.

```r
# The area standard error as the model computes it, and what it would be with no overlap
sigma    <- summary(m_full)$sigma
sst_area <- sum((homes$area - mean(homes$area))^2)
r2_area  <- summary(lm(area ~ rooms + age, data = homes))$r.squared

round(c(with_overlap = sigma / sqrt(sst_area * (1 - r2_area)),
        no_overlap   = sigma / sqrt(sst_area)), 5)
#> with_overlap   no_overlap
#>      0.03255      0.00861
```

0.03255 with the overlap and 0.00861 without it. The ratio is 3.78, the square root of the VIF, and nothing else about the model changed.

So here is collinearity stated precisely. It does not move the estimate and it does not touch the fit. It multiplies the standard error by the square root of the VIF.

[NOTE]
1, 5 and 10 are the VIF thresholds you will see quoted. They are conventions, not tests. A VIF of 5 means the standard error is 2.24 times what it would be and a VIF of 10 means 3.16 times, which is useful to know. Whether that is a problem depends on whether you needed that coefficient and how wide its interval ended up. There is no value at which a model stops being valid.

=== step === widget
## What collinearity damages, and what it leaves alone

We can measure the overlap now. The next question is what it damages, and that is worth being exact about, because collinearity gets blamed for a lot of things it does not do.

The dial below runs the experiment properly. It builds a regression with two predictors, raises the correlation between them from 0 up to 0.995, and at every setting it runs 2,000 complete studies: generate the data, fit the model, take the 95 percent interval for the first coefficient, and check whether that interval contains the true value.

It uses its own two predictors rather than the house data, so read the first one as area and the second as rooms, and read the dial as how close the room count is to being a restatement of the floor area. Start at the far left and drag it right.

::widget assumption-dial {"assumption":"multicollinearity","levels":11,"start":0}

Watch which numbers move and which ones do not.

At the far left the label reads r = 0.000, VIF 1.0. One notch from the right it reads r = 0.895, VIF 5.0, and at the right end it reads r = 0.995, VIF 100.3, which is a pair of predictors that are almost the same variable.

Across that whole range three things hold still. The estimate stays centred on the true value, so the coefficient is unbiased at every setting. Coverage stays at about 95 percent, so the intervals cover the true value as often as they should. R-squared holds still.

One thing changes: the width. By the right end the interval is more than ten times wider than it was with uncorrelated predictors.

That makes the first of the four responses easy to overlook. Report the interval you have. Minus 36.24 to 14.96 is not a broken result, it is a correct statement that 180 houses cannot separate area from rooms. If what you owe someone is an honest account of how much you do not know, that interval already gives it.

[KEY INSIGHT]
Collinearity makes a coefficient imprecise, not wrong. The estimate is still unbiased, the 95 percent interval still covers the true value 95 percent of the time, and the fit and the predictions are untouched. All that happens is that the interval gets wide, and a wide interval is a true statement about how little the data can separate two predictors carrying the same information.

=== step === quiz
## Quick check: reading a VIF of 14.3

The house price model has a VIF of 14.3 on rooms. Which sentence reads that correctly?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- The model now predicts badly, so the fitted prices and the R-squared cannot be trusted either. ::no
- The rooms estimate is pulled toward zero, so the real room effect must be larger than the model reports. ::no
- The standard error on rooms is 3.78 times what it would be if the other predictors explained none of it, so the estimate is imprecise rather than wrong. ::ok Exactly. 3.78 is the square root of 14.30, and it multiplies the standard error and nothing else. The estimate stays unbiased and the interval keeps covering at 95 percent.
- The other predictors explain 14.3 percent of the variation in rooms. ::no A VIF is not a percentage and it does not say whether the model is any good. It is one divided by the leftover share of a predictor after the others have explained what they can, and its square root is the factor it puts on that coefficient standard error. Here that factor is 3.78. The fitted values, the predictions and the R-squared are unaffected, and the estimate is not pulled in either direction. It is only imprecise.

=== step === concept
## Fix 1: drop the redundant predictor

This is the second of the four responses, and the one everybody reaches for first. If two predictors carry the same information, keep one and drop the other.

Rooms is the one with almost nothing of its own left, so drop rooms and refit on exactly the same 180 houses.

```r
# Drop rooms, refit on the same data, and read the VIFs again
m_drop <- lm(price ~ area + age, data = homes)
round(summary(m_drop)$coefficients, 3)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)   59.214     19.892   2.977    0.003
#> area           0.170      0.009  19.701    0.000
#> age           -0.991      0.269  -3.687    0.000

round(vif(m_drop), 2)
#> area  age
#>    1    1

round(summary(m_drop)$r.squared, 4)
#> [1] 0.7002
```

Both VIFs are 1. The area coefficient moved from 0.196 with a standard error of 0.033 to 0.170 with a standard error of 0.009. That is the 3.78 multiplier coming off, and area is now estimated nearly four times more precisely.

R-squared went from 0.7013 to 0.7002. Removing a predictor whose coefficient could not be pinned down cost about a thousandth of R-squared.

Look at where the area coefficient landed, though. The true per square foot effect is 0.14, and each square foot brings about 1/430 of a room with it, worth another 12/430, or 0.028. Add them and you get 0.168, which is what the fit gives as 0.170. Area is now carrying its own effect plus the room effect that travels with it.

```r
# Predict one house from both models: 2000 square feet, 5 rooms, 20 years old
new_house <- data.frame(area = 2000, rooms = 5, age = 20)

round(predict(m_full, new_house, interval = "prediction"), 1)
#>     fit   lwr   upr
#> 1 375.5 256.2 494.7

round(predict(m_drop, new_house, interval = "prediction"), 1)
#>   fit   lwr   upr
#> 1 379 260.2 497.9
```

Both models predict essentially the same price for the same house, 375.5 against 379, with prediction intervals of near identical width. Dropping rooms cost the predictions nothing, because rooms was not adding information the model did not already have.

What it cost is the answer to a question. There is no per room number in the model without rooms, and its area coefficient can no longer be read as the effect of floor area alone.

[TIP]
Choose the predictor to drop by which coefficient your question needs, not by which VIF is highest. Here area and rooms come in at 14.30 and 14.29, which is no guidance at all. And if the question is what a room is worth, dropping rooms answers nothing, however clean the diagnostics look afterwards.

=== step === concept
## Fix 2: keep both predictors and separate the shared part

Dropping a predictor is a real loss when both variables mean something. So here is a response that keeps both of them.

The problem was never the room count itself. It was the 93 percent of the room count that area already accounts for. So split the column in two: the part area explains, and the part it does not. That second part is exactly the residuals from regressing rooms on area.

```r
# Split rooms into the part area explains and the part it does not
homes$extra_rooms <- residuals(lm(rooms ~ area, data = homes))
round(cor(homes$area, homes$extra_rooms), 10)
#> [1] 0
```

`extra_rooms` is the room count of a house minus the room count a house of that floor area usually has. A value of plus 0.4 is four tenths of a room more than its size would suggest, and minus 0.2 is slightly fewer.

Its correlation with area is 0, and not approximately 0: residuals from a regression on area are orthogonal to area by construction. The overlap is gone. Now refit with `extra_rooms` in place of `rooms`.

```r
# Refit with extra_rooms in place of rooms
m_res <- lm(price ~ area + extra_rooms + age, data = homes)
round(summary(m_res)$coefficients, 3)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)   59.130     19.911   2.970    0.003
#> area           0.170      0.009  19.684    0.000
#> extra_rooms  -10.642     12.973  -0.820    0.413
#> age           -0.989      0.269  -3.674    0.000

round(vif(m_res), 2)
#>        area extra_rooms         age
#>           1           1           1

round(summary(m_res)$r.squared, 4)
#> [1] 0.7013
```

Look at what changed and what did not.

Every VIF is 1 now. The area coefficient is 0.170 with a standard error of 0.009, the same well determined number the model without rooms gave, and here it means area together with the rooms that come with it.

The `extra_rooms` coefficient is -10.642 with a standard error of 12.973. Those are the numbers the original model reported for rooms, down to the last digit. R-squared is 0.7013, unchanged from the original fit.

So we gained no precision at all. We rearranged three predictors into three uncorrelated ones, and every quantity that was imprecise before is exactly as imprecise now.

[KEY INSIGHT]
Rearranging predictors cannot add information the data never held. Residualising, and principal components regression which is the general form of the same move, buys you uncorrelated predictors, well posed questions and a diagnostic that reads clean. It does not buy a more precise answer to the original question, because the 7 percent of the room count that area leaves behind is still all there is.

=== step === widget
## Fix 3: shrink the coefficients with ridge regression

If rearranging cannot help, the only way left to make the estimates less variable is to accept some bias in exchange. That trade is what ridge regression makes.

Least squares finds the coefficients by inverting one small matrix, X transpose X, where X is the predictor columns set side by side. When two of those columns are nearly the same, that matrix comes very close to one that cannot be inverted at all, and it is that near miss which throws up the huge offsetting pairs: a large positive coefficient on one predictor paid for by a large negative one on the other.

Ridge adds a small constant, lambda, to every entry down the diagonal of that matrix before inverting it, which is enough to steady the arithmetic. That is the same thing as penalising the sum of the squared coefficients, which makes a large offsetting pair expensive to hold. Let's run it by hand on standardized predictors, so the three coefficients sit on a comparable scale, at five values of lambda.

```r
# Ridge regression from its closed form, on standardized predictors
X   <- scale(homes[, c("area", "rooms", "age")])
y   <- homes$price - mean(homes$price)
XtX <- t(X) %*% X

lambdas     <- c(0, 1, 5, 20, 50)
ridge_coefs <- sapply(lambdas, function(l) solve(XtX + l * diag(3)) %*% t(X) %*% y)
dimnames(ridge_coefs) <- list(c("area", "rooms", "age"), paste0("lambda=", lambdas))

round(rbind(ridge_coefs, "area+rooms" = colSums(ridge_coefs[1:2, ])), 2)
#>            lambda=0 lambda=1 lambda=5 lambda=20 lambda=50
#> area         101.95    93.97    75.89     55.71     45.20
#> rooms        -13.91    -6.19    10.93     27.66     32.04
#> age          -16.53   -16.49   -16.29    -15.35    -13.68
#> area+rooms    88.03    87.79    86.81     83.37     77.24
```

The lambda = 0 column is plain least squares: area 101.95 and rooms -13.91, the sign flip we started with, now in standardized units.

Follow those two rows to the right. Area falls from 101.95 to 55.71 at lambda 20. Rooms climbs from -13.91 through 10.93 at lambda 5 and on to 27.66. The two converge toward each other, which is exactly what the penalty is for, since an offsetting pair costs more than a shared moderate pair.

And look at the bottom row. Their sum barely moves, from 88.03 down to 83.37. The pair was always well determined. It was only the split between the two that the data could not pin down, and the penalty is what settles the split.

Every coefficient here is biased. At lambda 20 neither number is an unbiased estimate of anything. In exchange they are stable: refit on a different sample of houses and they would not swing the way the least squares pair does.

The shape of that shrinkage is worth seeing on its own, so here it is on a six predictor example, with a switch between the two common penalties.

::widget coef-path {}

It opens on Lasso. Drag lambda to the right and the coefficients hit exactly zero one after another, weakest first, which turns the penalty into variable selection. Switch to Ridge and every coefficient slides toward zero without any of them arriving.

That is the practical difference between the two. Ridge keeps every predictor and shrinks an overlapping pair toward each other, which is what you want when both variables are real and you want a model that holds still. Lasso picks one of a correlated pair and deletes the other, which is what you want when you actually want a shorter model.

In practice you would not write the closed form. `glmnet()` fits both penalties, and `cv.glmnet()` chooses lambda by cross validation instead of by eye.

[WARNING]
Ridge coefficients are not estimates of the true effects and should not be reported as though they were. There is no honest p value for them and no interval with a coverage guarantee. Use ridge when you want a model that predicts stably under collinearity, and use least squares with a wide interval when you want to report what one predictor is worth.

=== step === quiz
## Quick check: which response fits the question?

You have a house price model with a VIF of 14.3 on two of its predictors. It is going into a price estimator on a property website, so it will only ever produce a predicted price and a range around it, and nobody will read a coefficient off it. What should you do?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Drop rooms, because a VIF above 10 always has to be brought back down. ::no
- Leave the model as it is, because nothing it is ever asked to produce is affected. ::ok Right. The overlap widens the coefficient intervals and leaves the fitted values, the R-squared and the prediction intervals alone, so a model that only ever produces predictions is not damaged by it.
- Refit with lasso, so that one of the two overlapping predictors is set to exactly zero. ::no
- Collect more predictors, so that the shared information is spread over a wider set of columns. ::no The other three answers all treat a high VIF as a fault to be repaired. It is not a fault, it is a measurement of how precisely the individual coefficients can be estimated. The question is never how high the VIF is, it is which coefficient the model has to deliver. This one delivers none, and its predictions are unaffected, so dropping a predictor, switching to lasso, or collecting more columns would each cost work and gain nothing.

=== step === tryit
## Your turn: the VIFs after a derived predictor is added

There is one more source of collinearity, and it is the easiest one to create by accident: a predictor computed out of other predictors.

Add a column `sqft_per_room`, the floor area divided by the room count, and fit price on all four predictors. Then run `vif()` on that model and see what the numbers do.

```r
# homes holds price, area, rooms and age for 180 houses.
# Add a column sqft_per_room, the floor area divided by the room count.
# Fit price on area, rooms, age and sqft_per_room, then run vif() on that model.
# Three lines. Press Check when you have them.
```
::check {"regex": "sqft_per_room[\\s\\S]*vif[(]", "gate": true, "difficulty": "intermediate", "ok": "115.50 for area, 135.84 for rooms, 1.00 for age and 9.83 for sqft_per_room. A predictor built out of two predictors already in the model is a duplicate by construction, so sqft_per_room is the one to remove.", "no": "Three lines. Set `homes$sqft_per_room` to `homes$area / homes$rooms`, fit `lm(price ~ area + rooms + age + sqft_per_room, data = homes)` into `m_extra`, then call `round(vif(m_extra), 2)`."}
::solution
```r
# Add a predictor derived from two others, then check every VIF
homes$sqft_per_room <- homes$area / homes$rooms
m_extra <- lm(price ~ area + rooms + age + sqft_per_room, data = homes)
round(vif(m_extra), 2)
#>          area         rooms           age sqft_per_room
#>        115.50        135.84          1.00          9.83
```

Area went from 14.30 to 115.50 and rooms from 14.29 to 135.84, purely from adding a column that contains no new measurement at all. Age is untouched at 1.00, because a derived column does not spread collinearity everywhere. It adds it among the columns it was derived from.

=== step === concept
## References

- [Generalized Collinearity Diagnostics](https://doi.org/10.1080/01621459.1992.10475190) - Fox and Monette (1992), Journal of the American Statistical Association 87(417), 178-183. The generalised form, and what `vif()` reports for a model containing a factor: read the third column, not the first.
- [A Caution Regarding Rules of Thumb for Variance Inflation Factors](https://doi.org/10.1007/s11135-006-9018-6) - O'Brien (2007), Quality and Quantity 41, 673-690. Why 5 and 10 are conventions rather than tests, and why a high VIF on its own does not justify removing a variable.
- [Regression Diagnostics: Identifying Influential Data and Sources of Collinearity](https://doi.org/10.1002/0471725153) - Belsley, Kuh and Welsch (1980), Wiley. Condition numbers and variance decomposition, which catch a three way near dependency that pairwise VIFs can miss.
- [Ridge Regression: Biased Estimation for Nonorthogonal Problems](https://doi.org/10.1080/00401706.1970.10488634) - Hoerl and Kennard (1970), Technometrics 12(1), 55-67. The original bias for variance trade, and where the lambda added down the diagonal comes from.
- [An R Companion to Applied Regression](https://cran.r-project.org/package=car) - Fox and Weisberg (2019), 3rd edition, Sage. The book behind the car package, including how `vif()` is computed and what it returns.

=== step === complete
## Quick recap

You started with a model whose room coefficient came back at -10.642 when the true effect was plus 12, and you now know exactly why and what to do about it. To summarize:

- The diagnosis is the VIF: one divided by the leftover share of a predictor after the others explain what they can. Area and rooms came in at 14.30 and 14.29, out of an auxiliary R-squared of 0.93.
- The damage is the square root of the VIF, applied to the standard error and to nothing else. Here that is 3.78, which took the area standard error from 0.00861 up to 0.03255.
- What is not damaged: the estimate stays unbiased, the 95 percent intervals keep covering at 95 percent, and the fitted values, the prediction intervals and the R-squared are untouched.
- The four responses: report the wide interval as it stands, drop the redundant predictor, split one predictor into the shared part and the leftover, or shrink both with ridge. Choose by which coefficient your question needs, never by which VIF is highest.

The thing to carry away is that a high VIF is a measurement, not a fault. It tells you how much these data can say about one predictor while the others are held fixed, and sometimes the honest answer is that they cannot say much, with an interval to prove it.

Next time a coefficient comes back with the wrong sign, you will know what to measure, what it costs, and which of the four responses your question calls for. Have a great day!
