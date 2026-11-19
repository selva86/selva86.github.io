---
title: "Linear Regression, Properly Lesson 3: Diagnosing collinearity without panicking"
catalog_blurb: "Why a correlated predictor can widen your coefficient's interval without breaking the model."
description: "A real estate team's 24 home sales: VIF built from its own definition, and a coefficient's interval widening while the fit and predictions hold steady."
keywords: "variance inflation factor, VIF, multicollinearity, collinearity, correlated predictors, regression coefficient, confidence interval width, auxiliary regression, car::vif, standard error, lm, R"
post_type: "LESSON"
curriculum_id: "4.60.3"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "res-linear-models"
course_title: "Linear Regression, Properly"
course_lesson: "3"
course_total: "8"
course_landing: "Linear-Regression-Properly-Course.html"
course_next: "Robust-Standard-Errors-and-When-They-Are-Not-Enough.html"
course_prev: "The-Five-Assumptions-Ranked-by-What-They-Cost.html"
---

=== step === cover
## Diagnosing collinearity without panicking

Today let's understand collinearity very clearly, using a real regression, so you know exactly what it does to your coefficients and, just as importantly, what it does not do.

A real estate team tracks 24 recent home sales. For each house they have the square footage, the number of bedrooms, and the sale price. They want to predict price from square footage and bedroom count together. The trouble is that bigger houses tend to have more bedrooms, so these two predictors move together almost in lockstep.

Here is exactly how closely they move together: a Pearson correlation of 0.925 between square footage and bedroom count across the 24 houses.

::widget correlation-heatmap {"vars": ["sqft", "bedrooms"], "data": {"sqft": [2417, 1546, 1963, 2085, 1982, 1752, 2480, 1757, 2708, 1772, 2387, 2829, 1175, 1675, 1740, 2086, 1672, 700, 702, 2394, 1662, 998, 1723, 2347], "bedrooms": [7, 4, 5, 5, 5, 4, 6, 5, 7, 4, 6, 6, 3, 4, 4, 5, 5, 2, 3, 6, 4, 3, 4, 7]}}

That 0.925 in the grid above is what collinearity looks like before it ever touches a model: two predictors that are supposed to each carry their own information, carrying mostly the same information instead.

=== step === concept
## Two predictors measuring almost the same thing

Collinearity means two or more predictors in a regression are strongly correlated with each other, not with the outcome. It has nothing to do with whether square footage or bedroom count predicts price well. It is purely about how much those two predictors overlap with each other.

Here is the full table of 24 houses, and the correlation you just saw on the cover, computed directly.

```r
# Build the 24 home sales and measure how closely square footage and bedroom count move together
set.seed(42)
sqft <- round(rnorm(24, 1800, 450))
sqft <- pmax(sqft, 700)
bedrooms <- round(1 + sqft / 480 + rnorm(24, 0, 0.45))
bedrooms <- pmax(bedrooms, 1)
price <- round(60 + 0.085 * sqft + 9 * bedrooms + rnorm(24, 0, 22), 1)
houses <- data.frame(sqft, bedrooms, price)
houses
#>    sqft bedrooms price
#> 1  2417        7 319.0
#> 2  1546        4 241.8
#> 3  1963        5 278.9
#> 4  2085        5 265.0
#> 5  1982        5 308.1
#> 6  1752        4 259.1
#> 7  2480        6 326.8
#> 8  1757        5 260.4
#> 9  2708        7 368.1
#> 10 1772        4 248.6
#> 11 2387        6 251.0
#> 12 2829        6 360.7
#> 13 1175        3 178.8
#> 14 1675        4 242.5
#> 15 1740        4 256.7
#> 16 2086        5 313.1
#> 17 1672        5 231.1
#> 18  700        2 166.2
#> 19  702        3 154.1
#> 20 2394        6 340.3
#> 21 1662        4 257.5
#> 22  998        3 187.7
#> 23 1723        4 219.5
#> 24 2347        7 320.5

cor(houses$sqft, houses$bedrooms)
#> [1] 0.9246438
```

The reason is just how houses work. A bigger house almost always has more bedrooms built into it, so square footage and bedroom count rise together across these 24 sales. That gives a correlation of 0.925 between the two predictors.

Contrast that with square footage's own relationship to price. Square footage correlates strongly with price too, but that correlation is not a problem, because price is the outcome you are trying to predict. Collinearity is specifically about predictors correlating with each other. A predictor correlating strongly with the outcome is just a predictor doing its job.

=== step === widget
## A single predictor's coefficient, precisely estimated

Before bedroom count enters the picture at all, look at what square footage alone can do. Fitting a straight line through square footage and price, with no other predictor involved, gives a coefficient you can pin down tightly.

Drag the sliders below to shrink the sum of squared errors yourself, then press Snap to least squares to check your answer.

::widget ols-fit {"points": [{"x": 2417, "y": 319.0}, {"x": 1546, "y": 241.8}, {"x": 1963, "y": 278.9}, {"x": 2085, "y": 265.0}, {"x": 1982, "y": 308.1}, {"x": 1752, "y": 259.1}, {"x": 2480, "y": 326.8}, {"x": 1757, "y": 260.4}, {"x": 2708, "y": 368.1}, {"x": 1772, "y": 248.6}, {"x": 2387, "y": 251.0}, {"x": 2829, "y": 360.7}, {"x": 1175, "y": 178.8}, {"x": 1675, "y": 242.5}, {"x": 1740, "y": 256.7}, {"x": 2086, "y": 313.1}, {"x": 1672, "y": 231.1}, {"x": 700, "y": 166.2}, {"x": 702, "y": 154.1}, {"x": 2394, "y": 340.3}, {"x": 1662, "y": 257.5}, {"x": 998, "y": 187.7}, {"x": 1723, "y": 219.5}, {"x": 2347, "y": 320.5}]}

The smallest possible sum of squared errors for these 24 houses comes out to about 9,691.6, at a slope of 0.097 and an intercept of 84.45, the same answer `lm()` gives. Since price is recorded in $1,000s, that slope means an extra square foot predicts about $97 more in sale price, with a standard error of only about $7.70. The fit around square footage alone explains 87.9% of how price varies across these 24 houses (R-squared 0.879). That slope, that standard error, and that R-squared describe square footage acting completely alone, with no other predictor to share credit or blame.

=== step === concept
## The variance inflation factor, built from its own definition

Now add bedroom count to the model, and watch what collinearity actually does. The tool for measuring it is the variance inflation factor, VIF. Rather than quote it as a number from a function, build it from what it actually is.

VIF for a predictor is computed by regressing that predictor on every other predictor in the model, taking the R-squared of that regression, and plugging it into one formula: VIF = 1 / (1 - R-squared).

For square footage in this two-predictor model, the other predictor is just bedroom count. So the auxiliary regression is square footage on bedroom count.

```r
# Regress square footage on bedroom count, then build VIF from its own definition
aux <- lm(sqft ~ bedrooms, data = houses)
summary(aux)$r.squared
#> [1] 0.8549661

vif_by_hand <- 1 / (1 - summary(aux)$r.squared)
vif_by_hand
#> [1] 6.894941

m_full <- lm(price ~ sqft + bedrooms, data = houses)
suppressMessages(library(car))
vif(m_full)
#>     sqft bedrooms 
#> 6.894941 6.894941 
```

Bedroom count explains 85.5% of square footage's variation across these 24 houses (R-squared 0.855). Plugging that into the formula gives VIF = 1 / (1 - 0.855) = 6.89. Calling `car::vif()` on the full two-predictor model returns exactly that, 6.89, for both square footage and bedrooms. With only two predictors in the model, they always share one VIF, because each one's auxiliary regression is against the same single other predictor.

Read 6.89 as a quantity, not as a pass or fail mark against some cutoff. It says square footage's own variation is about 6.89 times larger in this model than it would be if square footage and bedrooms were uncorrelated. That multiplier on variation is exactly what turns into a wider confidence interval on the coefficient itself.

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- 1.25 ::no
- 0.20 ::no
- 5 ::ok Right. VIF = 1 / (1 - R-squared) = 1 / (1 - 0.80) = 1 / 0.20 = 5, the same arithmetic you just ran for square footage.
- 0.80 ::no VIF is 1 divided by 1 minus the auxiliary R-squared, not the R-squared itself (0.80), its reciprocal (1.25), or 1 minus it (0.20). 1 / (1 - 0.80) = 1 / 0.20 = 5.

=== step === widget
## Watching VIF climb as two predictors move together

The 6.89 you just computed by hand is one point on a curve. As two predictors grow more correlated, their shared VIF climbs, and so does the width of the confidence interval around each one's coefficient. Drag the correlation between two predictors from 0 up toward 0.995 and watch both move together.

::widget assumption-dial {"assumption": "multicollinearity", "levels": 15}

At the low end, with the two predictors barely correlated, VIF sits close to 1 and the interval stays tight. Push the dial up, and VIF climbs while the interval widens right alongside it. Watch the coverage number as you drag, the share of the dial's repeated simulated studies whose interval actually contains the true coefficient: even at the highest correlation settings, it stays close to 95%. The interval keeps doing its job. It just has to stretch wider to do it.

Near the setting where the dial's own correlation reads about 0.924, close to the 0.925 between square footage and bedroom count, its own VIF reads close to 6.9, matching the 6.89 from regressing square footage on bedroom count directly. Collinearity and VIF are the same story told two ways: one correlation number, one resulting multiplier on how imprecise a coefficient's estimate becomes.

=== step === concept
## What adding bedrooms actually does to the fit

You have now seen the mechanism. Here is what it does to real numbers, refitting both models side by side.

```r
# Compare the square-footage-only fit against the fit that also includes bedrooms
m_sqft <- lm(price ~ sqft, data = houses)
summary(m_sqft)
#> 
#> Call:
#> lm(formula = price ~ sqft, data = houses)
#> 
#> Residuals:
#>     Min      1Q  Median      3Q     Max 
#> -65.373  -5.525   3.457   8.902  31.078 
#> 
#> Coefficients:
#>             Estimate Std. Error t value Pr(>|t|)    
#> (Intercept) 84.44809   14.90455   5.666 1.07e-05 ***
#> sqft         0.09716    0.00769  12.635 1.47e-11 ***
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
#> 
#> Residual standard error: 20.99 on 22 degrees of freedom
#> Multiple R-squared:  0.8789,	Adjusted R-squared:  0.8734 
#> F-statistic: 159.6 on 1 and 22 DF,  p-value: 1.469e-11

summary(m_full)
#> 
#> Call:
#> lm(formula = price ~ sqft + bedrooms, data = houses)
#> 
#> Residuals:
#>     Min      1Q  Median      3Q     Max 
#> -65.612  -4.291   3.967   8.641  31.162 
#> 
#> Coefficients:
#>             Estimate Std. Error t value Pr(>|t|)    
#> (Intercept) 82.45780   16.21078   5.087 4.89e-05 ***
#> sqft         0.09040    0.02061   4.387 0.000258 ***
#> bedrooms     3.06160    8.62700   0.355 0.726215    
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
#> 
#> Residual standard error: 21.42 on 21 degrees of freedom
#> Multiple R-squared:  0.8796,	Adjusted R-squared:  0.8681 
#> F-statistic: 76.71 on 2 and 21 DF,  p-value: 2.222e-10
```

Look at the sqft row in both tables. The coefficient barely moves, from 0.097 to 0.090. But the standard error next to it nearly triples, from 0.0077 to 0.0206. That is collinearity's real cost: not a wrong number, a less certain one.

The 95% confidence interval shows the same thing even more plainly.

```r
# Compare the 95% interval for square footage's coefficient before and after bedrooms enter the model
confint(m_sqft)["sqft", ]
#>      2.5 %     97.5 % 
#> 0.08121322 0.11311009 

confint(m_full)["sqft", ]
#>      2.5 %     97.5 % 
#> 0.04754619 0.13325336 
```

The square-footage-only interval runs from 0.081 to 0.113, a width of 0.032. Once bedrooms enter the model, it runs from 0.048 to 0.133, a width of 0.086, about 2.7 times as wide. Yet look at what did not move. R-squared went from 0.879 to 0.880, essentially unchanged. That leaves one more thing worth checking directly: whether the fitted model's actual predicted prices moved at all.

```r
# Compare the two fits' predicted prices for all 24 houses
fitted_compare <- data.frame(
  price = houses$price,
  fitted_sqft_only = round(fitted(m_sqft), 2),
  fitted_full = round(fitted(m_full), 2)
)
fitted_compare
#>    price fitted_sqft_only fitted_full
#> 1  319.0           319.29      322.39
#> 2  241.8           234.66      234.46
#> 3  278.9           275.18      275.22
#> 4  265.0           287.03      286.25
#> 5  308.1           277.02      276.94
#> 6  259.1           254.68      253.08
#> 7  326.8           325.41      325.02
#> 8  260.4           255.16      256.60
#> 9  368.1           347.56      348.69
#> 10 248.6           256.62      254.89
#> 11 251.0           316.37      316.61
#> 12 360.7           359.32      356.57
#> 13 178.8           198.61      197.86
#> 14 242.5           247.19      246.12
#> 15 256.7           253.51      252.00
#> 16 313.1           287.13      286.34
#> 17 231.1           246.90      248.91
#> 18 166.2           152.46      151.86
#> 19 154.1           152.66      155.10
#> 20 340.3           317.05      317.24
#> 21 257.5           245.93      244.95
#> 22 187.7           181.42      181.86
#> 23 219.5           251.86      250.46
#> 24 320.5           312.49      316.06

max(abs(fitted_compare$fitted_full - fitted_compare$fitted_sqft_only))
#> [1] 3.57
```

Across all 24 houses, the two fits never disagree by more than 3.57, or $3,570, on prices that run from about $154,000 to $368,000. So the full picture is this: adding a correlated predictor left the coefficient almost where it was, tripled its standard error, widened its interval 2.7 times over, and barely touched the fit or a single predicted price. Collinearity attacks precision. It leaves everything else alone.

=== step === concept
## Does a weak p-value mean a weak effect?

Look at the bedrooms row in the full model's summary: a coefficient of 3.06, a standard error of 8.63, and a p-value of 0.73. On its own test, that coefficient looks completely unconvincing. It would be easy to read that and conclude bedroom count does not belong in the model.

That reading would be wrong, and the widened interval you just measured is exactly why. Bedrooms' coefficient is not weak because bedrooms stopped mattering. It is weak because once square footage is already in the model, there is very little independent information left in bedroom count to pin that coefficient down precisely. The standard error of 8.63 is honest. It is reporting real uncertainty, not a defect in the model.

A wide, honest interval is a result you report, not a problem you go fix. The interval already told you square footage's own coefficient was uncertain for the same reason. Bedrooms' p-value is just the same story, carried to its extreme.

=== step === concept
## When a high VIF needs action, and when it does not

So what should you actually do when you see a VIF like 6.89? The honest answer is that it depends entirely on what you need from the model.

::widget process-flow {"steps": [{"title": "You need the prediction", "sub": "VIF does not matter here. The fitted model and its predicted prices already stand as they are."}, {"title": "You need this coefficient, precisely", "sub": "Collect more data, widen the spread of the predictors, or combine the two redundant ones into a single measure."}, {"title": "Tempted to drop one predictor instead", "sub": "That changes which question the remaining coefficient answers. It does not fix anything broken."}]}

If all you need is a predicted price for a new house, VIF is close to irrelevant. You just saw that the fit and the predictions barely changed between the two models. A high VIF does not break prediction.

If you need the coefficient itself, precisely, because someone wants to know exactly how much an extra square foot adds to price, then the imprecision is the real problem, and it needs a real fix: collect more houses, find houses with a wider spread of square footage relative to bedroom count, or combine the two redundant predictors into one measure, such as square feet per bedroom.

What you should not do by reflex is drop one of the two correlated predictors to make VIF go away. Numbers like 5 or 10 that get quoted as VIF cutoffs are rules of thumb, not laws of statistics, and dropping a predictor to satisfy one does not fix a broken model, because nothing was broken. It changes the question the remaining coefficient answers. Square footage's coefficient in a model that also controls for bedrooms answers a different question than square footage's coefficient in a model that does not, and neither answer is wrong. They are just answers to two different questions.

=== step === quiz
## Quick check: reading the before and after fit

Square footage's coefficient moved from 0.097 to 0.090 once bedrooms entered the model, and its 95% interval widened from (0.081, 0.113) to (0.048, 0.133), while R-squared barely moved, 0.879 to 0.880, and the 24 predicted prices stayed almost identical. Which statement reads that pattern correctly?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- The square-footage coefficient is now unreliable, since the two models gave two different values for it. ::no
- Bedrooms is not worth including, since R-squared barely moved when it was added. ::no
- Collinearity has made the square-footage coefficient's estimate less precise, not wrong. The wider interval, the near-unchanged fit, and the near-identical predictions are exactly what collinearity does. ::ok Exactly. Collinearity costs you precision on the coefficient, nothing else. The fit, the predictions, and the interval's own coverage all held steady.
- The widened interval means its 95% coverage has dropped below 95%. ::no A wider interval is not a broken one. Coverage held near 95% at every correlation setting on the multicollinearity dial. The coefficient did not become unreliable, bedrooms did not become useless just because R-squared held still, and a wider interval is the honest report of less precision, not a drop in coverage.

=== step === tryit
## Your turn: bedrooms without square footage

`houses` is still sitting in your session, with its 24 rows of square footage, bedroom count, and price. Fit price on bedroom count alone, the same way you already fit it on square footage, then look at its R-squared and its p-value.

```r
# Fit price on bedrooms alone and look at its R-squared and p-value

```
::check {"regex": "lm\\s*[(]\\s*price\\s*~\\s*bedrooms\\s*,\\s*data\\s*=\\s*houses\\s*[)]", "gate": true, "difficulty": "intermediate", "ok": "Right. On its own, bedroom count explains 76.9% of how price varies across these 24 houses, with a p-value far below 0.0001. In the full model its coefficient only looked weak because square footage was already carrying most of that same information.", "no": "Fit price on bedrooms alone: lm(price ~ bedrooms, data = houses). Then run summary() on the result."}
::solution
```r
# Fit price on bedrooms alone and read its R-squared and p-value
m_bed <- lm(price ~ bedrooms, data = houses)
summary(m_bed)
#> 
#> Call:
#> lm(formula = price ~ bedrooms, data = houses)
#> 
#> Residuals:
#>     Min      1Q  Median      3Q     Max 
#> -61.382 -17.432   5.785  20.629  48.318 
#> 
#> Coefficients:
#>             Estimate Std. Error t value Pr(>|t|)    
#> (Intercept)   84.047     21.920   3.834 0.000903 ***
#> bedrooms      38.056      4.444   8.564 1.87e-08 ***
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
#> 
#> Residual standard error: 28.97 on 22 degrees of freedom
#> Multiple R-squared:  0.7693,	Adjusted R-squared:  0.7588 
#> F-statistic: 73.34 on 1 and 22 DF,  p-value: 1.87e-08
```

Bedroom count alone explains 76.9% of price's variation (R-squared 0.769), with a p-value of 1.87e-08, nowhere close to zero. That is a real, strong relationship. It only looked unconvincing buried inside the full model's p = 0.73, because square footage was already explaining almost the same thing. Weak inside a collinear model and weak on its own are two different findings, and this is the difference between them.

=== step === concept
## References

- Belsley, D., Kuh, E. and Welsch, R., "Regression Diagnostics: Identifying Influential Data and Sources of Collinearity". The source for VIF and the auxiliary-regression definition used in this lesson.
- [A Caution Regarding Rules of Thumb for Variance Inflation Factors](https://doi.org/10.1007/s11135-006-9018-6) - O'Brien, R. M. (2007), Quality and Quantity 41(5), 673-690. Behind this lesson's point that no VIF cutoff is universal.
- Fox, J. and Weisberg, S., "An R Companion to Applied Regression". Documents car::vif(), checked against the hand-built VIF in this lesson.
- [vif() documentation](https://rdrr.io/cran/car/man/vif.html) - car package, J. Fox. Computes the variance inflation factors this lesson builds by hand first.
- [confint() documentation](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/confint.html) - R Core Team. Builds the widening interval this lesson reads at each step.

=== step === complete
## What to do once collinearity is diagnosed

Two correlated predictors inflate each other's VIF and widen each other's coefficient intervals. That is the entire mechanism. Through all of it, the interval's own coverage held near 95%, the fit barely changed, and the predicted prices for all 24 houses stayed almost identical.

So the right response depends on one question: do you need the coefficient itself, precisely, or do you only need the prediction? If it is the prediction, a high VIF is close to irrelevant. If it is the coefficient, the honest fixes are more data, more spread in the predictors, or combining the redundant ones, never dropping a predictor by reflex to make a number look smaller. Dropping one does not repair anything. It just changes which question the remaining coefficient is answering.
