---
title: "Multicollinearity: why your coefficients look wrong, and the fix"
slug: "Regression-Health-Mini-1"
description: "Correlated predictors can flip a coefficient sign while nothing looks broken. Measure it with VIF, see what it does and does not ruin, then fix it three ways."
keywords: "multicollinearity, VIF in R, variance inflation factor, correlated predictors, car vif, ridge regression, centering predictors, regression diagnostics"
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
catalog_blurb: "How to tell when correlated predictors are distorting your regression coefficients."
---

=== step === cover
## Multicollinearity: why your coefficients look wrong, and the fix

Today let's look at what happens to a regression when two of its predictors carry almost the same information.

Here is the data we will use the whole way through. Sixty houses sold in one market, and for each house we have four measurements: the price in thousands of dollars, the floor area in square feet, the number of rooms, and the age in years.

Nothing in that list looks like trouble. But floor area and rooms are not two independent facts about a house. Add rooms to a house and the floor area goes up with them, because rooms have to sit somewhere. Knowing one of those two numbers tells you most of the other.

Here is how tightly they move together, measured as the correlation between every pair of columns.

::widget correlation-heatmap {"vars": ["price", "sqft", "rooms", "age"], "matrix": [[1, 0.93, 0.87, 0.02], [0.93, 1, 0.95, -0.02], [0.87, 0.95, 1, -0.02], [0.02, -0.02, -0.02, 1]]}

Floor area and rooms sit at 0.95. Age sits near zero against everything else, which is what an unrelated column looks like.

Two predictors correlated at 0.95 is what **multicollinearity** means: the columns are close to duplicates of each other, so each one says most of what the other one says.

=== step === concept
## The regression that gives rooms a negative coefficient

We will build the 60 houses ourselves, because that way we know what is true about them before any model sees them.

Each house gets a floor area drawn around 1,800 square feet. The room count follows from that area, roughly one room per 380 square feet, plus a small wobble. Then the price is set by a rule we choose: a base of 60, plus 0.12 per square foot, plus 8 per room, plus random noise. So one extra room really is worth 8 thousand dollars here, and every estimate from now on can be held up against that 8.

```r
# Build 60 houses whose prices follow a rule we choose, then look at them
set.seed(7)
n <- 60
sqft  <- round(rnorm(n, 1800, 420))
rooms <- round(sqft / 380 + rnorm(n, 0, 0.22))
price <- round(60 + 0.12 * sqft + 8 * rooms + rnorm(n, 0, 25))
age   <- round(runif(n, 1, 40))
homes <- data.frame(price, sqft, rooms, age)

head(homes)
#>   price sqft rooms age
#> 1   408 2761     7  39
#> 2   279 1297     3  37
#> 3   290 1508     4  40
#> 4   283 1627     4  23
#> 5   277 1392     4  35
#> 6   299 1402     4  30
```

Now fit the model anyone would fit: price on floor area and rooms.

```r
# Fit price on floor area and number of rooms
m <- lm(price ~ sqft + rooms, data = homes)
summary(m)
#>
#> Call:
#> lm(formula = price ~ sqft + rooms, data = homes)
#>
#> Residuals:
#>     Min      1Q  Median      3Q     Max
#> -69.299 -15.186   5.999  16.668  37.820
#>
#> Coefficients:
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept) 75.72873   13.62525   5.558 7.52e-07 ***
#> sqft         0.15319    0.02313   6.622 1.35e-08 ***
#> rooms       -7.32979    8.33778  -0.879    0.383
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
#>
#> Residual standard error: 22.36 on 57 degrees of freedom
#> Multiple R-squared:  0.8641,	Adjusted R-squared:  0.8593
#> F-statistic: 181.2 on 2 and 57 DF,  p-value: < 2.2e-16
```

Look at the `rooms` row. The coefficient is **-7.33**, when we set the truth at +8. An extra room, according to this fit, takes 7 thousand dollars off the price of a house.

The `sqft` row looks fine, and the model as a whole fits well. R-squared is 0.8641, the F-statistic is enormous, and floor area comes in at 0.15319 with a p-value of 1.35e-08.

So the wrong sign is not sitting next to a broken model. It is sitting next to a very good one.

Now read across the `rooms` row instead of just down the estimate column. The standard error is 8.33778, which is larger than the estimate itself. That is the part worth noticing.

```r
# Get the 95% confidence interval for each coefficient
round(confint(m), 2)
#>              2.5 % 97.5 %
#> (Intercept)  48.44 103.01
#> sqft          0.11   0.20
#> rooms       -24.03   9.37
```

The interval for `rooms` runs from -24.03 to 9.37. It spans more than 33 units, it straddles zero, and it contains the true value of 8.

So nothing here says a room is worth -7.33. That is one estimate, and it arrives with an interval wide enough to hold almost any answer you like, including the right one.

[KEY INSIGHT]
A sign flip under multicollinearity comes from a huge standard error, not from a broken model. The point estimate landed on the wrong side of zero because the interval around it is far too wide to say which side of zero it belongs on.

=== step === concept
## Why the model cannot separate floor area from rooms

Fit each predictor on its own and both of them look excellent.

```r
# Fit price on each predictor separately and compare the two coefficient tables
m_area_only  <- lm(price ~ sqft, data = homes)
m_rooms_only <- lm(price ~ rooms, data = homes)

round(summary(m_area_only)$coefficients[, 1:2], 4)
#>             Estimate Std. Error
#> (Intercept)  76.1951    13.5882
#> sqft          0.1338     0.0070
round(summary(m_rooms_only)$coefficients[, 1:2], 4)
#>             Estimate Std. Error
#> (Intercept) 105.8799    16.9342
#> rooms        45.2676     3.3447
```

On its own, `rooms` comes in at 45.27 with a standard error of 3.34. That is a tight, strongly positive estimate. Put it beside `sqft` and it collapses to -7.33 with a standard error of 8.34, two and a half times larger.

Why does one extra column do that?

Because a coefficient in a multiple regression answers a narrow question. It is not "how does price move with rooms". It is "how does price move with rooms among houses of the same floor area". To answer that, the fit can only use the part of `rooms` that floor area does not already account for.

So let's measure how big that part is. Regress `rooms` on `sqft` and look at the R-squared.

```r
# Find out how much of the variation in rooms floor area already accounts for
aux <- lm(rooms ~ sqft, data = homes)
round(summary(aux)$r.squared, 4)
#> [1] 0.9075
```

Floor area accounts for 90.75% of the variation in the room count. Only 9.25% is left over, and the entire `rooms` coefficient is estimated from that 9.25%.

That is not much data to work with. And when there is not much data, the answer moves around a lot from sample to sample. We can watch it move: draw three fresh sets of 60 houses from exactly the same rule, with the same true value of 8 per room, and refit each one.

```r
# Refit the same model on three fresh samples drawn from the same rule
for (s in c(11, 12, 13)) {
  set.seed(s)
  sqft_new  <- round(rnorm(n, 1800, 420))
  rooms_new <- round(sqft_new / 380 + rnorm(n, 0, 0.22))
  price_new <- round(60 + 0.12 * sqft_new + 8 * rooms_new + rnorm(n, 0, 25))
  fit_new   <- lm(price_new ~ sqft_new + rooms_new)
  cat(sprintf("seed %d: rooms coefficient %.2f\n", s, coef(fit_new)[3]))
}
#> seed 11: rooms coefficient 8.14
#> seed 12: rooms coefficient 10.65
#> seed 13: rooms coefficient -11.16
```

8.14, then 10.65, then -11.16. Every one came from the same rule, the same truth of 8, and the same sample size. Only the 60 houses changed.

Nothing here is biased. The estimates are scattered around 8, and one of them landed almost exactly on it. They are just scattered very widely, which is the whole story of multicollinearity in one line: the estimate is **imprecise, not wrong**.

=== step === concept
## VIF: how much collinearity inflates a standard error

The 90.75% we just measured is the raw material for the standard diagnostic. Take a predictor, regress it on all the other predictors in the model, and call that R-squared \(R^2_j\). The variance inflation factor for that predictor is

\[ \text{VIF}_j = \frac{1}{1 - R^2_j} \]

Read the denominator first. It is the share of predictor \(j\) that the other predictors leave unexplained, which is exactly the information the fit has left to work with. The less that is left, the bigger the whole fraction gets.

The name is literal. VIF is the factor by which the variance of that coefficient is multiplied, compared with what it would have been if the predictor were uncorrelated with everything else. Variance is the square of the standard error, so the standard error itself is multiplied by the square root of the VIF.

```r
# Turn the auxiliary R-squared into a VIF and into a standard error multiplier
r2_rooms    <- summary(aux)$r.squared
vif_by_hand <- 1 / (1 - r2_rooms)

round(c(r_squared = r2_rooms, vif = vif_by_hand, multiplier = sqrt(vif_by_hand)), 4)
#> r_squared        vif multiplier
#>    0.9075    10.8054     3.2872
```

A VIF of 10.8054, so the standard error is 3.2872 times bigger than it would be if the two predictors were unrelated. Both predictors get the same number here, because with only two of them each one explains the other equally well.

Now let's prove that multiplier is real. The standard error of a slope splits into two pieces, and only the second one has anything to do with collinearity.

\[ \text{SE}(\hat{\beta}_j) = \frac{\sigma}{s_j \sqrt{n - 1}} \times \sqrt{\text{VIF}_j} \]

Here \(\hat{\beta}_j\) is the estimated slope for predictor \(j\), \(\sigma\) is the residual standard error of the fit, and \(s_j\) is the standard deviation of the predictor. Compute that first piece on its own, then multiply it by the square root of the VIF, and compare against what `summary()` printed.

```r
# Rebuild the reported standard error from the clean one and the VIF
se_uninflated <- summary(m)$sigma / (sd(homes$sqft) * sqrt(n - 1))

round(c(uninflated = se_uninflated,
        inflated   = se_uninflated * sqrt(vif_by_hand),
        reported   = summary(m)$coefficients["sqft", "Std. Error"]), 4)
#> uninflated   inflated   reported
#>     0.0070     0.0231     0.0231
```

0.0070 is the standard error floor area would have carried if rooms had been unrelated to it. Multiply by 3.2872 and you land on 0.0231, which is the number in the summary output, to the last digit.

In practice you do not compute any of this by hand. `vif()` from the **car** package takes a fitted model and returns one number per coefficient.

```r
# Read the same variance inflation factors straight off car::vif
suppressMessages(library(car))
vif(m)
#>     sqft    rooms
#> 10.80539 10.80539
```

Same 10.80539, one line.

[NOTE]
You will see VIF above 5 called concerning and VIF above 10 called serious. Those are conventions people settled on, not tests with a null hypothesis behind them. A VIF of 10.8 on a coefficient nobody needs to interpret is harmless, and a VIF of 4 on the one coefficient your report depends on may not be.

=== step === widget
## What multicollinearity breaks, and what it leaves alone

A wide interval is one thing. A wrong answer is another. It is worth being precise about which of the two we are dealing with, so drag the dial below and watch.

The dial runs its own simulation: two predictors, 60 observations per study, the same sample size as the houses, and a correlation between the two predictors that you control from 0 up to 0.995. At every setting it fits a couple of thousand complete studies and measures three things about them. Width is how wide their 95% intervals come out on average. Coverage is the share of those studies whose 95% interval contained the true coefficient. Fit is R-squared. Our floor area and rooms sit at 0.95 on that scale, near the right-hand end.

::widget assumption-dial {"assumption": "multicollinearity"}

Start at the left. The dial reads r = 0.000, VIF 1.0, and the intervals in the lower panel are narrow.

Now drag it all the way right, to r = 0.995 and VIF 100.3, and read the three numbers in order.

- The interval width climbs steeply. That is the standard error being multiplied by the square root of that VIF, exactly as it was for our houses.
- Coverage stays near 95%. It does not sag at high correlation, because nothing about the estimate is biased.
- R-squared sits still. The model predicts just as well at 0.995 as it did at 0.

So the dial gives a clean answer. Correlated predictors do not corrupt the estimate and they do not damage the fit. They widen the interval, and the interval widens honestly: it is reporting how little this data can say about two variables that carry the same information.

[KEY INSIGHT]
A wide interval under multicollinearity is not a violated assumption. It is a correct answer to a question the data cannot answer sharply. What breaks is your ability to read one coefficient on its own, and nothing else.

=== step === quiz
## Quick check: what gets worse as two predictors become more correlated

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The estimate becomes biased, so it drifts steadily away from the true coefficient. ::no
- The standard error and the interval get wider, while the interval still contains the true value about 95% of the time. ::ok Exactly. The width grows and the coverage does not. That is why an estimate can land on the wrong side of zero and still come from a model that is behaving correctly.
- R-squared collapses, so the model stops predicting well. ::no
- The p-values stop being valid and cannot be used at all. ::no Only the width moves. The estimate stays unbiased, R-squared holds, and the p-value is still a correct test of that coefficient. It just becomes a test with very little power, because the standard error underneath it has been multiplied by the square root of the VIF.

=== step === concept
## Fix 1: recast the pair as floor area and extra rooms

The trouble is that `sqft` and `rooms` overlap. So build a version of the room count that has the overlap taken out of it.

Regress `rooms` on `sqft` and keep the residuals. A house with a positive residual has more rooms than a house of its size usually has, and a negative one has fewer. Call it `rooms_extra`. It is measured in rooms, and it is uncorrelated with floor area by construction, because that is what a residual is.

```r
# Replace rooms with rooms beyond what a house of that size usually has
homes$rooms_extra <- residuals(lm(rooms ~ sqft, data = homes))
m_recast <- lm(price ~ sqft + rooms_extra, data = homes)

round(summary(m_recast)$coefficients, 4)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)  76.1951    13.6149  5.5964    0.000
#> sqft          0.1338     0.0070 19.0154    0.000
#> rooms_extra  -7.3298     8.3378 -0.8791    0.383
round(vif(m_recast), 2)
#>        sqft rooms_extra
#>           1           1
```

Both VIFs are 1, the floor of the scale. The inflation is gone.

Look at what came back and what did not. The `sqft` standard error is 0.0070, which is precisely the uninflated value we worked out by hand. Floor area got its precision back in full.

`rooms_extra` did not. Its estimate is -7.3298 and its standard error is still 8.3378, identical to the one the original fit reported.

That is the honest part of this fix. Recasting rearranges the information, it does not create any. There were only 60 houses and only 9.25% of the room count was ever free of floor area, and that is still true after the residuals are taken. What was scarce stays scarce.

What did change is the question each coefficient answers.

- `sqft` at 0.1338 is now the **total** effect of floor area: what a square foot is worth including the rooms that usually come with it.
- `rooms_extra` at -7.3298 is what an unusually roomy house is worth, at a fixed floor area.

And the model itself is untouched. Every prediction is identical.

```r
# Confirm the recast model makes exactly the same predictions
max(abs(fitted(m) - fitted(m_recast)))
#> [1] 5.684342e-14
round(cor(homes$sqft, homes$rooms_extra), 10)
#> [1] 0
```

5.684342e-14 is zero as far as any house price is concerned. The two fits are the same surface, described with two predictors that no longer overlap.

=== step === concept
## Fix 2: centering, when the collinearity is structural

Sometimes you create the collinearity yourself, by putting a variable and a function of that variable in the same model. A squared term is the common case.

```r
# Fit price with a squared floor-area term and check the collinearity it creates
m_quad <- lm(price ~ sqft + I(sqft^2), data = homes)

round(cor(homes$sqft, homes$sqft^2), 4)
#> [1] 0.9916
round(vif(m_quad), 2)
#>      sqft I(sqft^2)
#>      59.6      59.6
round(summary(m_quad)$coefficients, 6)
#>               Estimate Std. Error  t value Pr(>|t|)
#> (Intercept) 165.640448  51.733961 3.201774 0.002235
#> sqft          0.039382   0.053222 0.739956 0.462364
#> I(sqft^2)     0.000024   0.000013 1.789437 0.078857
```

A correlation of 0.9916 and a VIF of 59.6. On a range of floor areas that all sit well above zero, squaring is nearly a straight-line operation, so `sqft` and `sqft^2` are close to the same column twice. The linear term lands at 0.039382 with a p-value of 0.462364, which would tempt anyone into dropping floor area from a model about floor area.

The fix is one subtraction. Center the predictor on its own mean before squaring it.

```r
# Center floor area on its mean, then refit the same quadratic model
homes$sqft_c <- homes$sqft - mean(homes$sqft)
m_quad_c <- lm(price ~ sqft_c + I(sqft_c^2), data = homes)

round(cor(homes$sqft_c, homes$sqft_c^2), 4)
#> [1] 0.3373
round(vif(m_quad_c), 2)
#>      sqft_c I(sqft_c^2)
#>        1.13        1.13
round(summary(m_quad_c)$coefficients, 6)
#>               Estimate Std. Error   t value Pr(>|t|)
#> (Intercept) 325.193462   3.607210 90.150964 0.000000
#> sqft_c        0.129396   0.007323 17.669729 0.000000
#> I(sqft_c^2)   0.000024   0.000013  1.789437 0.078857
```

The correlation drops from 0.9916 to 0.3373 and the VIF from 59.6 to 1.13. The linear term goes from 0.039382 to 0.129396, and its standard error shrinks from 0.053222 to 0.007323.

Subtracting 1890.68 from a column did all of that. Here is why it works: after centering, small houses get negative values of `sqft_c` and large ones positive values, but squaring sends both sides back up. So `sqft_c` and its square now move together only weakly, and the near-duplication is gone.

What did not change matters just as much.

```r
# Check that centering left the curvature and every fitted value alone
signif(c(quadratic_uncentered = unname(coef(m_quad)[3]),
         quadratic_centered   = unname(coef(m_quad_c)[3])), 6)
#> quadratic_uncentered   quadratic_centered
#>          2.38048e-05          2.38048e-05
max(abs(fitted(m_quad) - fitted(m_quad_c)))
#> [1] 2.842171e-13
```

The quadratic coefficient is identical, its standard error is identical at 0.000013, and every fitted value is the same. Centering is not a different model. It is the same curve, written down from a different origin.

That change of origin is where the new meaning comes from. In the uncentered fit, the linear term is the slope of the price curve at a floor area of zero, which is a house that does not exist and about which the data says nothing. After centering, it is the slope at the average floor area of 1890.68 square feet, which is a house we have plenty of. That is why the number went from meaningless to well determined.

[TIP]
Center any predictor before you square it or before you put it into an interaction. It costs one line, it never changes the fit, and it turns a coefficient about an impossible house into a coefficient about a typical one.

=== step === widget
## Fix 3: ridge regression keeps both predictors

The first two fixes work by rewriting the predictors. Ridge regression takes a different route: it keeps both columns exactly as they are and changes what the fit is allowed to do with them.

Ordinary least squares picks the coefficients that make the squared errors as small as possible, and nothing else. Ridge adds a second term to that objective, a penalty on the sum of the squared coefficients, controlled by a number called lambda. Large coefficients now cost something, so the fit will not hand a huge positive value to one collinear predictor and a huge negative one to the other. It splits the effect between them instead.

The chart below shows what the penalty does across its whole range. It runs on its own example, six predictors called x1 to x6 rather than our two, because the pattern is easier to see with a handful of coefficients on screen at once. Switch it to **Ridge (L2)** and drag lambda from left to right.

::widget coef-path {}

Every line bends toward zero as lambda grows, and none of them ever reaches it. That is the signature of ridge. Now flip to Lasso (L1) and drag again: those lines hit zero exactly, one after another, and stay there. Lasso removes predictors; ridge keeps all of them and shrinks them.

For collinear predictors that both belong in the model, keeping them is the point. Here is ridge on the houses. `cv.glmnet()` fits the model at many values of lambda and picks one by cross-validation: it holds back a slice of the houses, fits on the rest, checks which lambda predicts the held-back slice best, and repeats that over every slice. `alpha = 0` is what selects the ridge penalty rather than the lasso one.

```r
# Fit ridge regression on the houses and read the two coefficients
suppressMessages(library(glmnet))
X <- as.matrix(homes[, c("sqft", "rooms")])

set.seed(1)
ridge_cv <- cv.glmnet(X, homes$price, alpha = 0)

round(ridge_cv$lambda.min, 2)
#> [1] 5.49
round(coef(ridge_cv, s = "lambda.min"), 4)
#> 3 x 1 sparse Matrix of class "dgCMatrix"
#>             lambda.min
#> (Intercept)    93.2871
#> sqft            0.0926
#> rooms          12.3152
```

The rooms coefficient is 12.3152. It is positive, sensible, and comes from the very same 60 houses that produced -7.33 under least squares.

Before you reach for this every time, know what you paid for it. Ridge coefficients are biased toward zero on purpose. `sqft` came down from 0.1532 to 0.0926, and the 12.3152 for rooms is not an unbiased estimate of 8 either. You traded a little bias for a large drop in variance, which is usually a good trade when you want stable predictions.

[WARNING]
A ridge coefficient is not a drop-in replacement for a least-squares one. It has no honest standard error or confidence interval of the usual kind, and it is shrunk by an amount that depends on lambda. Use it to stabilise a model, not to report "an extra room is worth 12.3".

=== step === concept
## Which fix to use, and when to leave it alone

Start with the case nobody mentions: often you should do nothing at all.

If you only want predictions, multicollinearity costs you almost nothing. The individual coefficients are unstable, but the surface they trace out is not. Predict one 2,000 square foot house with 5 rooms from the collinear model and from a model that has dropped rooms entirely.

```r
# Predict the same house from the two-predictor model and the area-only model
new_home <- data.frame(sqft = 2000, rooms = 5)

round(predict(m, new_home, interval = "prediction"), 2)
#>      fit    lwr    upr
#> 1 345.46 300.13 390.79
round(predict(m_area_only, new_home, interval = "prediction"), 2)
#>      fit    lwr   upr
#> 1 343.83 298.75 388.9
round(c(both = summary(m)$r.squared, area_only = summary(m_area_only)$r.squared), 4)
#>      both area_only
#>    0.8641    0.8622
```

The two fits predict 345.46 against 343.83, a difference of about 1.6 thousand dollars on a house worth 345, and the two prediction intervals, each the range one new house price is expected to land in, sit almost on top of each other. R-squared is 0.8641 against 0.8622. A wrong-signed coefficient did not damage a single prediction.

So the fix depends entirely on what you need the model for.

1. **Nothing.** You are predicting, and no coefficient goes into the report. The wide interval is a fact about the data you can leave alone.
2. **Drop one predictor.** You do not need both. Dropping `rooms` gives the area-only model above, at a cost of less than 0.002 in R-squared. But notice its coefficient changed meaning: 0.1338 is now the total effect of a square foot, rooms included, not the effect at a fixed room count.
3. **Recast the pair.** You need both, and you need to interpret both. Rebuild them as two uncorrelated quantities with separate meanings, and accept that the scarce one keeps its wide interval.
4. **Center.** The collinearity comes from a squared term or an interaction you built yourself. One subtraction, no cost.
5. **Ridge.** Every predictor must stay in and you care about stable prediction more than about reading any single coefficient.

And one option that is not on the list: nothing you can compute will create information that is not in the data. Only two things genuinely fix a scarce comparison, and both of them happen before you open R. Collect more houses, or find houses whose room counts do not track their floor areas, such as a few big lofts and a few small subdivided flats.

=== step === quiz
## Quick check: which fix answers the question asked

Your report has to state what one extra room is worth to a buyer, holding floor area fixed, and you have the 60 houses and nothing more. Which response actually answers that?

::quiz {"correct": 3, "gate": true, "difficulty": "advanced"}
- Drop rooms, refit on floor area alone, and report its 0.1338 as the value of a room. ::no
- Fit ridge and report its 12.3152 as the estimate, since it has the sign you expect. ::no
- Recast the pair so one predictor carries rooms beyond the area norm, report its coefficient, and report the wide interval with it. ::ok Right, and the wide interval is part of the answer rather than a flaw in it. Only 9.25% of the room count is free of floor area, so that is genuinely all the data on these 60 houses can tell you.
- Do nothing, since R-squared is already 0.8641 and the model clearly fits. ::no Three of these four answer a different question from the one asked. The area-only coefficient is per square foot and includes the rooms that come with the space; the ridge coefficient is deliberately shrunk and carries no usable interval; and R-squared says nothing about how precisely a single coefficient is pinned down.

=== step === tryit
## Your turn: check the VIF for a third predictor

`homes` also carries `age`, the age of each house in years, which we have not used yet. Fit `price` on all three predictors, floor area, rooms and age, then get the VIF for each coefficient and see which ones are inflated.

```r
# Fit price on floor area, rooms and age, then check the VIF for each one
suppressMessages(library(car))
# your code here: fit the model into m_age, then check its VIF
```
::check {"regex": "age[\\s\\S]*vif\\s*[(]", "gate": true, "difficulty": "advanced", "ok": "That is it: 10.81 for floor area, 10.81 for rooms, 1.00 for age. Adding a third predictor did not change the inflation on the first two, and age is untouched.", "no": "Two lines. Fit the three-predictor model first, `m_age <- lm(price ~ sqft + rooms + age, data = homes)`, then pass that model to `vif()`."}
::solution
```r
# Fit price on floor area, rooms and age, then read the VIF for each coefficient
m_age <- lm(price ~ sqft + rooms + age, data = homes)
round(vif(m_age), 2)
#>  sqft rooms   age
#> 10.81 10.81  1.00
round(cor(homes$sqft, homes$age), 3)
#> [1] -0.015
```

Age comes back at 1.00, the minimum the scale allows, while floor area and rooms stay at 10.81. It correlates -0.015 with floor area, so nothing in the model explains it and nothing inflates it.

That is the useful habit here. There is no such thing as a collinear model, only collinear coefficients. VIF gives you one number per coefficient, and in a model with ten predictors it is perfectly normal for two of them to be badly inflated and the other eight to be clean.

=== step === concept
## References

- [A caution regarding rules of thumb for variance inflation factors](https://doi.org/10.1007/s11135-006-9018-6) - O'Brien (2007), Quality and Quantity 41(5), 673-690. Where the 5 and 10 cutoffs came from, and why they are weaker rules than they look.
- [Generalized collinearity diagnostics](https://doi.org/10.1080/01621459.1992.10475190) - Fox and Monette (1992), Journal of the American Statistical Association 87(417), 178-183. The GVIF, which is what `vif()` reports when a predictor is a factor with several levels.
- [Regression Diagnostics: Identifying Influential Data and Sources of Collinearity](https://doi.org/10.1002/0471725153) - Belsley, Kuh and Welsch (1980), Wiley. The book-length treatment, including condition indices.
- [Ridge regression: biased estimation for nonorthogonal problems](https://doi.org/10.1080/00401706.1970.10488634) - Hoerl and Kennard (1970), Technometrics 12(1), 55-67. The paper that introduced the penalty, and the original bias-for-variance argument.
- [An R Companion to Applied Regression, 3rd edition](https://www.john-fox.ca/Companion/) - Fox and Weisberg (2019), Sage. The practical companion to the car package, by the people who wrote it.

=== step === complete
## What you can do now

You can spot multicollinearity, measure it, say precisely what it costs, and pick a response that fits the question you are answering.

- **Diagnose it.** \(\text{VIF}_j = 1/(1 - R^2_j)\), where \(R^2_j\) comes from regressing predictor \(j\) on the others. For our houses that was 1/(1 - 0.9075) = 10.8054, and `vif()` from **car** returns it in one line.
- **Read it.** The VIF multiplies the coefficient's variance, so its square root multiplies the standard error. 3.2872 times turned a clean 0.0070 into the reported 0.0231.
- **Know its limits.** It widens standard errors and intervals. It does not bias the estimate, dent R-squared, or move a single prediction. A flipped sign is a wide interval, not a broken model.
- **Fix it to suit the question.** Nothing at all when you are predicting. Drop a predictor when you do not need both. Recast the pair when you need to interpret both. Center when you built the collinearity yourself with a square or an interaction. Ridge when everything must stay in and stability matters more than reading one number.

Next time a coefficient turns up with a sign nobody expected, you will know to look at its standard error and its VIF before you change anything about the model.
