---
title: "Multicollinearity: why your coefficients look wrong, and the fix"
slug: "Regression-Health-Mini-1"
description: "Correlated predictors can flip the sign of a regression coefficient. Compute the VIF yourself, see what collinearity does and does not ruin, then fix it."
keywords: "multicollinearity, VIF in R, variance inflation factor, car vif, correlated predictors, collinearity in regression, ridge regression in R, auxiliary regression"
mathjax: true
webr: true
date: "2026-09-05"
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
catalog_blurb: "Why correlated predictors make a coefficient look wrong, and what to do."
---

=== step === cover
## Multicollinearity: why your coefficients look wrong, and the fix

Today let's work out what happens to a regression when two of its predictors carry the same information, and what to do about it.

Here is the setting. We have 60 houses. For each one we know the floor area in square feet, the number of rooms, and how old the building is in years. The question is what each of those three is worth in the sale price.

Those three are not separate facts about a house though. A house with more space has more rooms inside it, so two of the columns are close to being one measurement written down twice.

Here is the correlation between every pair of columns.

::widget correlation-heatmap {"vars":["price","sqft","rooms","age"],"matrix":[[1,0.964,0.921,-0.294],[0.964,1,0.971,-0.116],[0.921,0.971,1,-0.042],[-0.294,-0.116,-0.042,1]]}

Find the `sqft` row and read across to the `rooms` column: 0.97. Almost all of the variation in one of them is variation in the other. Age is nearly unrelated to both, at -0.12 against floor area and -0.04 against room count.

When two predictors carry nearly the same information, the data holds almost nothing that tells their two effects apart. The fit still returns a coefficient for each of them, but either one can land a long way from the truth, including on the wrong side of zero, while nothing else in the output looks unusual. That is multicollinearity, and in this data it comes from the pair sitting at 0.97.

=== step === concept
## The house data, and a negative coefficient for rooms

We will build the 60 houses ourselves instead of loading them, because then we know the true answer and can check the estimates against it.

Prices here are in dollars. Each house gets a floor area drawn around 1,800 square feet, a room count of roughly one room per 350 square feet, and an age somewhere between 0 and 60 years. The price is then 118 per square foot, plus 8,000 per room, minus 900 per year of age, plus normal noise with a standard deviation of 15,000.

```r
# Build 60 houses from price drivers we choose ourselves, then measure the sqft to rooms correlation
set.seed(62)
n <- 60
sqft  <- round(rnorm(n, mean = 1800, sd = 500))
rooms <- round(sqft / 350 + rnorm(n, mean = 0, sd = 0.15))
age   <- round(runif(n, min = 0, max = 60))
price <- 90000 + 118 * sqft + 8000 * rooms - 900 * age + rnorm(n, sd = 15000)
houses <- data.frame(sqft, rooms, age, price)

head(houses, 4)
#>   sqft rooms age    price
#> 1 2201     6  28 407640.2
#> 2 1942     5   9 352917.6
#> 3 1044     3  59 184289.6
#> 4 1837     6  33 327345.7

round(cor(houses$sqft, houses$rooms), 3)
#> [1] 0.971
```

Floor area and room count correlate at 0.971, and the `rooms` line is where that comes from. Room count is built out of floor area, one room for every 350 feet, with a small random amount added on top. That is not a trick to make the problem appear, it is how houses are.

Now fit the model and read what it reports for each predictor.

```r
# Fit price on all three predictors and read the coefficient table
fit <- lm(price ~ sqft + rooms + age, data = houses)

coefs <- summary(fit)$coefficients
data.frame(estimate  = round(coefs[, "Estimate"], 1),
           std_error = round(coefs[, "Std. Error"], 1),
           p_value   = round(coefs[, "Pr(>|t|)"], 3))
#>             estimate std_error p_value
#> (Intercept)  81500.2    8492.3   0.000
#> sqft           146.8      17.2   0.000
#> rooms        -1249.6    5873.3   0.832
#> age           -782.1     116.5   0.000
```

Two of the three are fine. `age` comes in at -782.1 against the -900 we built in, and `sqft` at 146.8 against 118, both in the right direction with small standard errors beside them.

Then there is `rooms`. We built the price with 8,000 per room and the fit reports -1249.6. It is not just too small, it has the wrong sign. Its standard error is 5,873.3, more than four times the size of the estimate itself, so the p-value comes out at 0.832. Read that row on its own and you would say room count has nothing to do with price.

And here is what makes this hard to catch.

```r
# How much of the variation in price the model explains
round(summary(fit)$r.squared, 4)
#> [1] 0.9626
```

R-squared is 0.9626. There is no warning, no error, nothing in the output that looks broken. A model that explains 96% of the variation in price still reports that an extra room is worth minus 1,250.

=== step === concept
## Why the fit cannot tell sqft and rooms apart

We can check whether -1,249.6 really fits the data any better than 8,000 does. Force the rooms coefficient to a value we pick, let least squares choose the other two around it, and see what that costs.

`offset()` inside a formula does exactly that. A term wrapped in `offset()` is held fixed at the value you supply instead of being estimated.

```r
# Force the rooms coefficient to five values and refit the rest each time
forced <- c(-1250, 0, 4000, 8000, 12000)
fit_forced <- function(b) lm(price ~ sqft + age + offset(b * rooms), data = houses)

data.frame(
  rooms_effect = forced,
  sqft_effect  = round(sapply(forced, function(b) coef(fit_forced(b))[["sqft"]]), 1),
  resid_se     = round(sapply(forced, function(b) summary(fit_forced(b))$sigma))
)
#>   rooms_effect sqft_effect resid_se
#> 1        -1250       146.8    14835
#> 2            0       143.3    14841
#> 3         4000       131.9    14940
#> 4         8000       120.5    15160
#> 5        12000       109.1    15494
```

`resid_se` is the residual standard error, the typical gap between a house's real price and the model's prediction for it. Smaller means the model matches the 60 houses better.

Now read that last column downwards. The value least squares chose, -1,250, gives 14,835. The true value, 8,000, gives 15,160. Moving the rooms coefficient by 9,250 dollars costs 325 dollars of typical error, on prices that average 323,854.

So the fit did not land on -1,249.6 because that answer is much better. It landed there because a whole range of answers are almost equally good, and it has to return one of them.

The middle column shows what the fit does in return. For every 1,000 dollars added to the rooms coefficient, `sqft` gives up about 2.85 dollars per square foot. That is the ratio we built into the data: an extra room arrives with about 350 extra square feet, so 1,000 spread over 350 feet is 2.86 a foot. The two columns can pass the same effect back and forth almost for free.

[KEY INSIGHT]
Many different pairs of coefficients fit this data about equally well. Least squares still has to return exactly one pair, and which pair it returns is settled by small amounts of noise. That is what "the data cannot separate two predictors" means in practice.

=== step === concept
## VIF: what it computes, and how to read it

What we need now is a number for how much of one predictor is already carried by the others. That number is the variance inflation factor, or VIF.

The calculation is short. Take one predictor, and regress it on all the other predictors, leaving the outcome out of it completely. That is called the auxiliary regression, and its R-squared is the share of the predictor that the rest of the model already explains. The VIF is

\[ \text{VIF}_j = \frac{1}{1 - R_j^2} \]

where \(R_j^2\) is the auxiliary R-squared for predictor j. Let's compute it by hand for rooms.

```r
# Regress rooms on the other two predictors and turn that R-squared into a VIF
aux <- lm(rooms ~ sqft + age, data = houses)
r2_aux <- summary(aux)$r.squared

round(c(r_squared = r2_aux, vif = 1 / (1 - r2_aux), se_factor = sqrt(1 / (1 - r2_aux))), 4)
#> r_squared       vif se_factor
#>    0.9471   18.9003    4.3474
```

94.71% of the variation in room count is already accounted for by floor area and age together. Only 5.29% of it is information the other columns do not have, and 1 divided by 0.0529 is 18.90.

The interpretation is the part people most often get wrong. A VIF multiplies the variance of the coefficient, not the coefficient. A standard error is the square root of a variance, so what happens to the standard error is the square root of the VIF: sqrt(18.90) = 4.35. If the rooms column had exactly the same spread but no relationship to floor area, its standard error would be about 4.35 times smaller than the 5,873.3 we got.

The `car` package gives all three predictors in one line.

```r
# The same calculation for every predictor, in one line
suppressMessages(library(car))
round(vif(fit), 2)
#>  sqft rooms   age
#> 19.13 18.90  1.11
```

Rooms comes in at 18.90, exactly what we worked out by hand. `sqft` is 19.13, the same redundancy read from the other side of the pair. `age` is 1.11, which is roughly what you get when a predictor is unrelated to the rest: a VIF of 1 means no inflation at all.

You will see 5 and 10 quoted as thresholds. Those are conventions, not results, and nothing changes at 4.9 or at 5.1. The useful interpretation is always the same one: take the square root, and you have the factor your standard error was multiplied by.

=== step === concept
## Is the rooms coefficient biased, or just imprecise?

So we have one fit and one coefficient with the wrong sign. There are two very different explanations for that, and it matters a great deal which one is true. Either collinearity systematically pulls the estimate away from 8,000, or the estimate is centred in the right place and simply very noisy.

The way to tell them apart is to run the study more than once. We built this data, so we can build it a thousand times.

```r
# Rebuild the whole study 1,000 times and keep the rooms coefficient from each
one_study <- function(correlated) {
  sqft  <- round(rnorm(60, mean = 1800, sd = 500))
  rooms <- if (correlated) round(sqft / 350 + rnorm(60, mean = 0, sd = 0.15))
           else round(rnorm(60, mean = 5.23, sd = 1.44))
  age   <- round(runif(60, min = 0, max = 60))
  price <- 90000 + 118 * sqft + 8000 * rooms - 900 * age + rnorm(60, sd = 15000)
  coef(lm(price ~ sqft + rooms + age))[["rooms"]]
}

set.seed(7)
b_corr <- replicate(1000, one_study(TRUE))
set.seed(7)
b_ind  <- replicate(1000, one_study(FALSE))

round(c(mean_corr = mean(b_corr), sd_corr = sd(b_corr),
        mean_ind  = mean(b_ind),  sd_ind  = sd(b_ind)))
#> mean_corr   sd_corr  mean_ind    sd_ind
#>      7982      6002      7971      1361
```

`correlated = TRUE` rebuilds the houses exactly as before. `correlated = FALSE` changes one line only: room count is drawn from a normal distribution with the same mean, 5.23, and the same standard deviation, 1.44, that the correlated version has, but with no link to floor area at all. The true 8,000, the noise, the 60 rows, all stay as they were.

Both means land on 8,000. That is 7,982 in the correlated design against 7,971 in the independent one. So the estimator is unbiased either way. Repeat a collinear study often enough and the average estimate is the true value.

What differs is the spread: 6,002 against 1,361.

```r
# Count the negative estimates, then compare the two spreads
round(c(share_negative = mean(b_corr < 0), sd_ratio = sd(b_corr) / sd(b_ind)), 3)
#> share_negative       sd_ratio
#>          0.099          4.409
```

9.9% of the correlated studies returned a negative coefficient for room count, in a world where the true value was +8,000 in every one of them. Our -1,249.6 is one of those, and there was nothing unusual about the sample that produced it.

The ratio of the two spreads is 4.41, which is what the VIF said it would be: sqrt(18.90) = 4.35, to within simulation error.

Here are both sets of 1,000 estimates drawn on one axis.

```r
# Draw both sets of 1,000 estimates on one scale, with the true 8,000 marked
edges <- seq(-16000, 34000, by = 1250)
par(mfrow = c(2, 1), mar = c(4, 4, 3, 1))

hist(b_corr, breaks = edges, col = "grey85", border = "white",
     main = "rooms correlated with floor area at 0.971",
     xlab = "estimated price of one extra room")
abline(v = 8000, col = "red", lwd = 3)

hist(b_ind, breaks = edges, col = "grey85", border = "white",
     main = "rooms drawn independently of floor area",
     xlab = "estimated price of one extra room")
abline(v = 8000, col = "red", lwd = 3)
```

Both piles sit over the red line at 8,000. The top one is wide enough to spill past zero on the left, which is where our sign flip came from. The bottom one is the same estimator on the same true value, with the redundancy taken out.

[KEY INSIGHT]
Collinearity does not bias a coefficient, it widens it. One coefficient from one collinear fit is a single draw from a wide distribution, and when that distribution is wide enough to cross zero, a draw with the wrong sign is an ordinary event rather than a sign that something broke.

=== step === widget
## What a rising correlation does to the confidence interval

A 95% confidence interval can be checked by simulation. Build the interval in many repeated studies and about 95 in every 100 should contain the true value. That share is called coverage, and it is the thing to watch when you want to know whether a wide interval is still valid.

The dial below runs 2,000 complete studies at every setting of the correlation between two predictors, and reports two numbers: the coverage of the 95% interval for the first coefficient, and R-squared. It carries its own two-predictor data rather than the houses, so read its `x1` as floor area and its `x2` as room count.

::widget assumption-dial {"assumption": "multicollinearity", "levels": 41, "start": 0}

Start on the left, where the two predictors are uncorrelated. Coverage sits at about 95% and R-squared at about 0.68. That is the baseline.

Now drag the dial to the right. At r = 0.970 the label reads VIF 17.0, and coverage is still about 95%. R-squared has not moved either. The one number that changed is the width of the interval, now about 5.8 times what it was on the left.

That 5.8 has two parts to it. The collinearity accounts for sqrt(17.0) = 4.12 of it. The rest comes from the widget holding R-squared fixed as the correlation climbs, which it does by raising the error standard deviation by a factor of 1.40, and 4.12 times 1.40 is 5.8.

So a collinear interval is not a broken interval. It contains the true value as often as a 95% interval should. It is simply reporting, correctly, that this data cannot pin the coefficient down.

=== step === quiz
## Quick check: what does a VIF of 18.90 mean?

The rooms column came back with a VIF of 18.90. Which sentence reads that number correctly?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- 18.9% of the variation in room count is explained by the other predictors. ::no
- The variance of the rooms coefficient is 18.9 times what it would be if room count had the same spread but no relationship to the other predictors, so its standard error is about 4.35 times wider. ::ok Exactly. A VIF multiplies the variance, and a standard error is the square root of a variance, so the widening factor is sqrt(18.90) = 4.35.
- The rooms coefficient is about 18.9 times too large, so dividing it by 18.9 corrects it. ::no
- The 95% interval for rooms now misses the true value far more often than 5 times in 100. ::no A VIF is a variance multiplier and nothing else. It comes from regressing room count on the other predictors, where the R-squared is 0.9471, not 0.189. It does not scale the estimate up or down, and it does not break the interval: coverage stays at about 95% however high the correlation climbs. What it changes is the width, by a factor of sqrt(18.90) = 4.35.

=== step === concept
## What multicollinearity does not ruin

A VIF of 19 sounds alarming, so it is worth being precise about what it actually damages. Start with the fit.

```r
# Compare the fit with and without the redundant predictor
fit_drop <- lm(price ~ sqft + age, data = houses)

round(c(with_rooms = summary(fit)$r.squared, without_rooms = summary(fit_drop)$r.squared), 4)
#>    with_rooms without_rooms
#>        0.9626        0.9625
```

R-squared is 0.9626 with room count in the model and 0.9625 without it. The two differ in the fourth decimal place.

R-squared on the data you fitted is a soft test, though. The harder one is prediction on houses the model has never seen, so let's build 40 more from the same process and score both models on them.

```r
# Score both models on 40 houses neither of them was fitted on
set.seed(500)
new_sqft  <- round(rnorm(40, mean = 1800, sd = 500))
new_rooms <- round(new_sqft / 350 + rnorm(40, mean = 0, sd = 0.15))
new_age   <- round(runif(40, min = 0, max = 60))
new_price <- 90000 + 118 * new_sqft + 8000 * new_rooms - 900 * new_age + rnorm(40, sd = 15000)
new_houses <- data.frame(sqft = new_sqft, rooms = new_rooms, age = new_age, price = new_price)

rmse <- function(pred, actual) sqrt(mean((pred - actual)^2))
pred_full <- predict(fit, new_houses)
pred_drop <- predict(fit_drop, new_houses)

round(c(rmse_with_rooms    = rmse(pred_full, new_houses$price),
        rmse_without_rooms = rmse(pred_drop, new_houses$price),
        largest_gap        = max(abs(pred_full - pred_drop))))
#>    rmse_with_rooms rmse_without_rooms        largest_gap
#>              14289              14107               1031
```

RMSE is the typical size of a prediction error. That is 14,289 for the model carrying the sign-flipped rooms coefficient and 14,107 for the one without it, on houses that sell for 323,854 on average. And on no single house do the two models disagree by more than 1,031.

So the damage is contained. Collinearity hurts the individual coefficient and its standard error, and leaves the fitted values, the R-squared and the predictions where they were. The reason is the trade we watched earlier: the fit can move the two coefficients against each other, and every one of those trades lands on nearly the same prediction.

[TIP]
Before you fix a high VIF, ask what the coefficient is for. If room count is in the model as a control that nobody will ever quote, a VIF of 19 needs no action at all. It becomes a problem the moment someone reads the number.

=== step === concept
## Fix 1: collapse the pair into one column

If somebody does have to read the coefficient, the most common response is to stop estimating two coefficients the data cannot separate, and estimate one instead.

The blunt version is to drop one of the pair.

```r
# Read the coefficients after dropping rooms, and check the VIFs
dcoefs <- summary(fit_drop)$coefficients
data.frame(estimate  = round(dcoefs[, "Estimate"], 1),
           std_error = round(dcoefs[, "Std. Error"], 1))
#>             estimate std_error
#> (Intercept)  81711.8    8363.0
#> sqft           143.3       3.9
#> age           -789.5     110.3

round(vif(fit_drop), 2)
#> sqft  age
#> 1.01 1.01
```

The standard error on `sqft` falls from 17.2 to 3.9 and both VIFs drop to 1.01. That looks like a clean result, and this is exactly where it gets misread.

143.3 is not the price of a square foot any more. With room count out of the model, the floor area coefficient carries two effects at once: its own 118 per foot, plus the 8,000 that arrives with the extra room that comes with roughly every 350 extra feet. 118 + 8000/350 is 140.9, and 143.3 is that number estimated from 60 houses.

Dropping a collinear predictor does not recover the kept column's own effect. It merges both effects into that column.

The tidier version of the same idea is to say so openly and build one column out of the two.

```r
# Average the two standardised columns into a single size score and fit on that
houses$size <- (as.numeric(scale(houses$sqft)) + as.numeric(scale(houses$rooms))) / 2
fit_size <- lm(price ~ size + age, data = houses)

scoefs <- summary(fit_size)$coefficients
data.frame(estimate  = round(scoefs[, "Estimate"], 1),
           std_error = round(scoefs[, "Std. Error"], 1))
#>             estimate std_error
#> (Intercept) 349504.1    4130.0
#> size         70757.4    2266.9
#> age           -940.7     127.6

round(vif(fit_size), 2)
#> size  age
#> 1.01 1.01
```

`scale()` puts a column on a mean of 0 and a standard deviation of 1, which is what makes two columns measured in feet and in rooms averageable at all. The result, `size`, is a single measure of how big a house is. One standard deviation of it is worth 70,757 with a standard error of 2,267, and the VIF is 1.01.

[NOTE]
Taking the first principal component of the two columns instead of averaging them gives an identical fit here, R-squared 0.9495 either way. It is the same one-dimensional summary of the pair, on a different scale.

The cost of collapsing is the obvious one. You now have a defensible answer about house size and no answer at all about rooms holding floor area fixed. If that second question is the one you were asked, this fix does not answer it.

=== step === widget
## Fix 2: ridge keeps every predictor

Ridge regression takes a different route. Instead of removing a column it adds a penalty on the size of the coefficients to the least squares criterion, so a fit is now scored on two things: how well it matches the data, and how large its coefficients are. Under collinearity that stops the pair from moving far in opposite directions, which is where the instability was coming from.

The widget below shows what a rising penalty does to a set of coefficients. It carries its own six-predictor example rather than the houses.

::widget coef-path {}

Drag the penalty from left to right with **Ridge (L2)** selected, and all six shrink toward zero smoothly, with none of them ever reaching it. Switch to **Lasso (L1)** and they hit exactly zero one at a time, which is variable selection. Ridge is the one that keeps a collinear pair together.

Now fit it on the houses. In `glmnet()`, `alpha = 0` selects ridge and `lambda` is the penalty. Here it is 7,203, the value `cv.glmnet()` picks on this data by cross-validation.

```r
# Fit ridge on the houses at the penalty that cross-validation selects
suppressMessages(library(glmnet))
X <- as.matrix(houses[, c("sqft", "rooms", "age")])
ridge_fit <- glmnet(X, houses$price, alpha = 0, lambda = 7203)

round(coef(ridge_fit)[, 1], 1)
#> (Intercept)        sqft       rooms         age
#>     97853.8        85.3     17548.2      -838.2
```

Every predictor stays in the model and the sign flip is gone. Room count now reads 17,548.2. Here is how it does on the 40 unseen houses.

```r
# Compare least squares and ridge on the houses neither was fitted on
new_X <- as.matrix(new_houses[, c("sqft", "rooms", "age")])

round(c(rmse_ols   = rmse(predict(fit, new_houses), new_houses$price),
        rmse_ridge = rmse(predict(ridge_fit, new_X), new_houses$price)))
#>   rmse_ols rmse_ridge
#>      14289      14081
```

That is a small improvement in prediction. The part that matters more is what ridge did to the coefficient itself. Run 200 fresh studies and estimate the rooms effect both ways in each one.

```r
# Compare the least squares and ridge rooms coefficient across 200 fresh studies
set.seed(21)
both <- replicate(200, {
  sqft  <- round(rnorm(60, mean = 1800, sd = 500))
  rooms <- round(sqft / 350 + rnorm(60, mean = 0, sd = 0.15))
  age   <- round(runif(60, min = 0, max = 60))
  price <- 90000 + 118 * sqft + 8000 * rooms - 900 * age + rnorm(60, sd = 15000)
  c(ols   = coef(lm(price ~ sqft + rooms + age))[["rooms"]],
    ridge = coef(glmnet(cbind(sqft, rooms, age), price, alpha = 0, lambda = 7203))["rooms", 1])
})

round(rbind(mean = apply(both, 1, mean), sd = apply(both, 1, sd)))
#>       ols ridge
#> mean 8218 19855
#> sd   6225  1452
```

Read the two columns against the true value of 8,000. Least squares averages 8,218, close to the truth, with a standard deviation of 6,225. Ridge averages 19,855, more than twice the truth, with a standard deviation of 1,452.

That is the whole trade in one table. Ridge buys a steadier coefficient by accepting one that is not centred on the true value, and on this data the miss is large: 19,855 against 8,000. So use ridge when you want predictions out of a collinear design. Do not read a ridge coefficient as the effect of one more room.

=== step === quiz
## Quick check: which reading of the rooms coefficient is right?

The model on the 60 houses reported -1,249.6 for room count, with a VIF of 18.90. Which sentence gets it right?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- Collinearity pulls the estimate toward zero, so -1,249.6 is a shrunken version of the real per-room effect. ::no
- Ridge corrected it, so 17,548.2 is the per-room effect to report. ::no
- The estimate is unbiased but imprecise. It is one draw from a distribution about 4.4 times wider than an unrelated rooms column would give, and the model's predictions are untouched by any of it. ::ok Yes. Across 1,000 rebuilt studies the correlated design averaged 7,982 against a true 8,000, and 9.9% of those studies came back negative. Ours was one of them.
- Dropping rooms and refitting recovers the true per-room effect from what is left. ::no Nothing here is biased toward zero: 1,000 rebuilt studies of the correlated design averaged 7,982 against a true 8,000, and only the spread changed, 6,002 against 1,361. Ridge's 17,548.2 is deliberately biased and is not an effect to quote. And dropping rooms leaves the floor area coefficient at 143.3, which is the per-foot effect plus the room that arrives with every 350 feet, not the per-room effect.

=== step === tryit
## Your turn: is the collinearity in the model, or in the pair?

The three-predictor fit gave VIFs of 19.13 for floor area, 18.90 for room count and 1.11 for age. Suppose you leave age out and fit price on floor area and room count alone.

Decide first, before you run anything: does the VIF for the pair go up, go down, or stay roughly where it was? Then write the two lines and find out.

```r
# houses holds the 60 houses, with the columns sqft, rooms, age and price.
# Fit price on sqft and rooms only, leaving age out.
# Then compute the VIF for that model.
# Two lines. Press Check when you have them.
```
::check {"regex": "(?=[\\s\\S]*vif[(])(?=[\\s\\S]*sqft\\s*[+]\\s*rooms)", "gate": true, "difficulty": "beginner", "ok": "Right: 17.23 for both, slightly below the 18.90 the three-predictor model gave. age was never part of the redundancy, so taking it out changes almost nothing.", "no": "Two lines. Fit the model with lm(price ~ sqft + rooms, data = houses) and store it in fit_pair, then pass fit_pair to vif()."}
::solution
```r
# Fit the pair on its own and read the VIF
fit_pair <- lm(price ~ sqft + rooms, data = houses)
round(vif(fit_pair), 2)
#>  sqft rooms
#> 17.23 17.23
```

With only two predictors, both VIFs have to be equal. Rooms regressed on floor area, and floor area regressed on rooms, share a single R-squared, 0.942, which is their correlation squared. And 1 / (1 - 0.942) is 17.23.

So taking a whole predictor out of the model moved the number from 18.90 to 17.23. A VIF measures how much one column duplicates the others, not how many columns there are.

=== step === concept
## References

- [Regression Diagnostics: Identifying Influential Data and Sources of Collinearity](https://doi.org/10.1002/0471725153) - Belsley, Kuh and Welsch (1980), Wiley. The book that put collinearity diagnostics on a formal footing, including the condition numbers that sit alongside the VIF.
- [Generalized Collinearity Diagnostics](https://doi.org/10.1080/01621459.1992.10475190) - Fox and Monette (1992), Journal of the American Statistical Association 87(417), 178-183. Defines the GVIF, which is what `vif()` reports when a predictor is a factor carrying more than one degree of freedom.
- [A Caution Regarding Rules of Thumb for Variance Inflation Factors](https://doi.org/10.1007/s11135-006-9018-6) - O'Brien (2007), Quality and Quantity 41, 673-690. Why 5 and 10 are conventions rather than results, and why acting on them can cost more than the collinearity does.
- [Ridge Regression: Biased Estimation for Nonorthogonal Problems](https://doi.org/10.1080/00401706.1970.10488634) - Hoerl and Kennard (1970), Technometrics 12(1), 55-67. The original ridge paper, written for exactly this problem.
- [car: Companion to Applied Regression](https://cran.r-project.org/package=car) - Fox and Weisberg. The documentation for `vif()`, from the people who wrote it.

=== step === complete
## Quick recap

You started with a model that said an extra room takes 1,250 off the price of a house, and you now know what that number was and what to do about it.

- Floor area and room count correlate at 0.971, so 94.71% of room count is already carried by the other predictors. That is a VIF of 18.90, and a standard error sqrt(18.90) = 4.35 times wider than an unrelated rooms column would give.
- The estimate is not biased, only imprecise. Across 1,000 rebuilt studies it averaged 7,982 against a true 8,000, and 9.9% of them came back negative. The -1,249.6 was one ordinary draw from that spread.
- The interval is not broken either. Its coverage stays at about 95% however high the correlation climbs, and all that grows is its width.
- Prediction is untouched. R-squared went from 0.9626 to 0.9625 when room count was dropped, and on 40 fresh houses no prediction moved by more than 1,031.
- There are three responses, each with a price. Leave it alone when nobody reads the coefficient. Collapse the pair, and accept that the column you keep carries the combined effect, 143.3 rather than 118. Or fit ridge, which keeps both columns and returns a steadier coefficient that is deliberately off centre.

And one thing none of those three does: recover information the data never held. Separating floor area from room count needs houses where the two vary independently, which is a question about how the data was collected rather than about which function you call.

Next up are residuals that are correlated with their own past, why that quietly breaks every standard error in the output, and the test that catches it.
