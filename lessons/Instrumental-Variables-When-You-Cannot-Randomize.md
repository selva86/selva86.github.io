---
title: "Causal Inference from Data Lesson 6: Instrumental variables when you cannot randomize"
catalog_blurb: "How a wholesale cost shock recovers price's real effect when demand confounds it."
description: "A store's naive regression says higher prices sell more, the wrong sign. A wholesale cost shock, untouched by demand, recovers the real, negative effect."
keywords: "instrumental variables, two-stage least squares, 2SLS, Wald estimator, weak instrument, first-stage F statistic, exclusion restriction, exogeneity, endogeneity, R"
post_type: "LESSON"
curriculum_id: "4.130.6"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "res-causal"
course_title: "Causal Inference from Data"
course_lesson: "6"
course_total: "8"
course_landing: "Causal-Inference-from-Data-Course.html"
course_next: "Regression-Discontinuity-and-Synthetic-Control"
course_prev: "Difference-in-Differences-and-Its-One-Assumption"
---

=== step === cover
## Instrumental variables when you cannot randomize

Today let's look at what to do when you cannot randomize the thing whose effect you want to measure, and the usual regression hands you an answer that is clearly wrong.

Riverside Mart is a convenience chain. Across 300 separate store-weeks, it recorded the shelf price of its signature snack bar and how many units sold that week.

Here is that scatter, price against units sold, across all 300 store-weeks.

::widget chart-plotter {"data":[{"x":5.01,"y":110.9},{"x":2.67,"y":88.7},{"x":5.94,"y":97.0},{"x":2.60,"y":83.0},{"x":5.83,"y":103.6},{"x":4.72,"y":90.3},{"x":4.49,"y":94.9},{"x":5.75,"y":93.7},{"x":6.56,"y":116.6},{"x":4.34,"y":98.1},{"x":2.83,"y":97.8},{"x":3.61,"y":93.1},{"x":5.84,"y":91.6},{"x":3.87,"y":111.7},{"x":7.11,"y":103.1},{"x":7.41,"y":103.2},{"x":6.58,"y":92.2},{"x":7.10,"y":112.2},{"x":4.55,"y":97.9},{"x":6.47,"y":110.6},{"x":7.30,"y":99.6},{"x":6.49,"y":114.3},{"x":4.38,"y":106.3},{"x":5.94,"y":104.0},{"x":1.66,"y":80.4},{"x":1.70,"y":102.3},{"x":5.80,"y":102.4},{"x":4.69,"y":109.5},{"x":3.44,"y":83.7},{"x":6.81,"y":91.5}],"geoms":["point"],"x":"price","y":"units"}

Price and units rise together, which is backwards. Raise a price and ordinary demand says sales should fall, not climb with it. Something else is driving both of them at once.

=== step === concept
## Why raising the price seems to raise sales (it does not)

Fit the obvious regression first: units sold against price, across all 300 store-weeks.

```r
# Build 300 store-weeks of price and units sold, then fit the naive regression
set.seed(21)
n <- 300
demand <- rnorm(n)
cost_shock <- rnorm(n)
price <- 5 + 1.5 * demand + 1.0 * cost_shock + rnorm(n, 0, 0.3)
units <- 120 - 4 * price + 14 * demand + rnorm(n, 0, 5)
store_weeks <- data.frame(demand, cost_shock, price, units)

naive_fit <- lm(units ~ price, data = store_weeks)
coef(naive_fit)
#> (Intercept)       price 
#>   86.878588    2.407932 
```

The coefficient on price is 2.41. Read literally, that says every extra dollar on the snack bar's shelf price brings in about 2.4 more units sold a week. That is not just a weak effect, it is the wrong direction entirely.

store_weeks was built by simulation, so the real effect of price on units is known and fixed in advance: minus 4 units per dollar. Raising the price should cost the store sales, not gain them, yet the regression says the opposite.

The reason is a variable the regression never sees: demand, the store manager's own weekly read of how strong local appetite for the snack bar is running. In a strong-demand week, the manager raises the price because customers will pay it, and that same strong demand also pushes units sold up on its own. Price and units move together for a reason that has nothing to do with price's real effect, which is why the naive regression reads the relationship backwards.

demand's own true effect on units is fixed at plus 14 units per unit of demand strength, built into the simulation the same way price's effect was. It is that effect the naive regression is mistaking for price's.

=== step === concept
## What a variable needs to do to break the confound

To see price's real effect, you need a variable that moves price without moving with demand. Call it cost_shock: a weekly change in what the supplier charges for the snack bar, driven by the supplier's own logistics costs, not by how much any one store's customers want to buy that week.

Compare how cost_shock relates to price against how it relates to demand.

```r
# Compare cost_shock's correlation with price against its correlation with demand
cor(cost_shock, price)
#> [1] 0.4975494
cor(cost_shock, demand)
#> [1] -0.1075294
```

cost_shock correlates with price at about 0.50, clearly nonzero. It correlates with demand at about minus 0.11, close enough to zero that the two are, for practical purposes, unrelated. So cost_shock moves price for reasons that have nothing to do with demand.

That matters because of what it lets you do. Whatever movement in price traces back to cost_shock cannot also trace back to demand, so looking only at the slice of price that cost_shock explains lets you read off price's effect on units without demand getting mixed into the answer. That is the whole idea behind an instrumental variable, and cost_shock is a candidate for one.

=== step === concept
## The three conditions an instrument must satisfy
::prose-only the three conditions are a list argued in words; no widget needed to state a definition

A variable does not get to call itself an instrument just because it looks useful. It has to satisfy three conditions.

1. Relevance. The instrument has to actually move the treatment. For cost_shock, this means cost_shock must move price, and you can confirm it directly: fit price on cost_shock and check that the slope is clearly nonzero.
2. Exogeneity. The instrument has to be unrelated to the confounder. For cost_shock, this means it must be unrelated to demand. You cannot confirm this from the data; you can only argue for it, and the argument here is that cost_shock arises from the supplier's own logistics costs, not from how any one store's customers are feeling that week.
3. The exclusion restriction. The instrument has to reach the outcome only by moving the treatment, through no other channel. For cost_shock, this means it can change units only by first changing price. If a cost shock also triggered something like a supplier dispute that changed how the snack bar gets marketed, cost_shock would be touching units through a second channel, and the exclusion restriction would fail.

Of the three, exclusion carries the most risk. Relevance you can check in the data. Exogeneity and exclusion you can only argue, and a violation of either one leaves no trace in the data for you to catch. That is what makes an instrument a case you build, not a number you compute.

=== step === widget
## Fitting the first stage by hand

The first of the three conditions, relevance, is the one you can actually fit by hand.

Drag the line below until it minimizes the squared gaps between it and these 10 (cost_shock, price) pairs from Riverside Mart's own 300 store-weeks.

::widget ols-fit {"points":[{"x":-3.475,"y":0.221},{"x":-2.94,"y":5.532},{"x":-1.229,"y":4.801},{"x":-0.69,"y":7.142},{"x":-0.248,"y":8.969},{"x":-0.226,"y":4.726},{"x":0.042,"y":5.382},{"x":0.248,"y":4.592},{"x":0.374,"y":4.834},{"x":0.797,"y":7.359}]}

The slope you land on should come out close to 1, the true slope between cost_shock and price built into the simulation. The fitted value at each point, the height of your line above that point's cost_shock, is the part of that week's price that cost_shock explains: the exogenous slice stage two of the estimate needs.

This same regression is also the full answer to relevance. A slope that is clearly nonzero is the direct confirmation that cost_shock moves price. But fitting it tells you nothing about the other two conditions, since exogeneity and the exclusion restriction are claims about demand and about units, not about this regression at all.

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- Yes, a large enough sample would confirm both. ::no
- Yes, once the residuals look patternless. ::no
- No. Those are claims about where cost_shock comes from and how it reaches units, not something this regression, or any regression run on this data, can test. ::ok Exactly right. Relevance is a claim about this regression, and the regression settles it. Exogeneity and the exclusion restriction are claims about the world cost_shock came from, and no regression run on this data can settle those.
- Yes, once R-squared is high enough. ::no A high R-squared, patternless residuals, or a bigger sample all say more about how precisely this one regression's own slope is estimated. None of them is evidence about where cost_shock comes from or whether it reaches units through some route other than price, which is what exogeneity and the exclusion restriction actually claim.

=== step === concept
## Two-stage least squares, computed by hand

Fit the first stage properly now, the same regression you fit by hand with the slider, but on all 300 store-weeks, and use its fitted values to fit a second regression.

```r
# Two-stage least squares: fit price on cost_shock, then units on that fitted price
stage1 <- lm(price ~ cost_shock, data = store_weeks)
summary(stage1)
#> 
#> Call:
#> lm(formula = price ~ cost_shock, data = store_weeks)
#> 
#> Residuals:
#>     Min      1Q  Median      3Q     Max 
#> -4.3119 -0.9501  0.0647  0.9525  4.1170 
#> 
#> Coefficients:
#>             Estimate Std. Error t value Pr(>|t|)    
#> (Intercept)  5.05869    0.08749  57.822   <2e-16 ***
#> cost_shock   0.83207    0.08403   9.902   <2e-16 ***
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
#> 
#> Residual standard error: 1.505 on 298 degrees of freedom
#> Multiple R-squared:  0.2476,	Adjusted R-squared:  0.245 
#> F-statistic: 98.04 on 1 and 298 DF,  p-value: < 2.2e-16

price_hat <- fitted(stage1)
stage2 <- lm(units ~ price_hat)
summary(stage2)
#> 
#> Call:
#> lm(formula = units ~ price_hat)
#> 
#> Residuals:
#>     Min      1Q  Median      3Q     Max 
#> -24.055  -5.699  -0.036   6.846  24.653 
#> 
#> Coefficients:
#>             Estimate Std. Error t value Pr(>|t|)    
#> (Intercept) 126.7119     3.3624  37.685  < 2e-16 ***
#> price_hat    -5.3105     0.6427  -8.263 4.71e-15 ***
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
#> 
#> Residual standard error: 9.575 on 298 degrees of freedom
#> Multiple R-squared:  0.1864,	Adjusted R-squared:  0.1837 
#> F-statistic: 68.28 on 1 and 298 DF,  p-value: 4.706e-15
```

stage1 is the first stage: price regressed on cost_shock, giving a slope of 0.83 on all 300 store-weeks. That sits in the same neighborhood as the slope you fit by hand with the slider, and both sit close to the first stage's true value of 1. price_hat, its fitted values, is the cost_shock-driven part of each week's price, with the demand-driven part stripped away.

stage2 regresses units on price_hat alone, and its coefficient is minus 5.31. That is firmly negative, and it lands far closer to the true effect of minus 4 than the naive regression's plus 2.41 ever did. No estimate from 300 store-weeks lands exactly on the true number, the same way no regression coefficient ever lands exactly on the truth from a finite sample, but this one is on the right side of zero and in the right neighborhood, which the naive regression from two steps back was not.

Two ordinary regressions, run in sequence, is the entirety of two-stage least squares. Nothing about stage2 knows demand exists, because price_hat only carries the part of price that cost_shock moved, and cost_shock was argued to be unrelated to demand.

=== step === concept
## The Wald ratio and the first-stage F

There is a second way to reach the exact same number stage2 just gave you, one that skips fitting any regression at all.

```r
# The Wald ratio: the same IV estimate as a single division
cov(cost_shock, units) / cov(cost_shock, price)
#> [1] -5.310484

# The first-stage F: the diagnostic for that ratio's denominator
summary(lm(price ~ cost_shock, data = store_weeks))$fstatistic
#>     value     numdf     dendf 
#>  98.04246   1.00000 298.00000 
```

cov(cost_shock, units) divided by cov(cost_shock, price) comes out to minus 5.310484, matching stage2's coefficient to six decimal places. This is called the Wald ratio, and it is not an approximation of the two-stage estimate. It is the same number, reached by a single division instead of two regressions.

Look at what sits in that ratio's denominator: cov(cost_shock, price), the same covariance the first stage's slope is built from. If cost_shock barely moved price, that covariance would be tiny, and dividing by something tiny lets ordinary sampling noise in the numerator swing the whole ratio wildly. The first-stage F statistic, printed above, is the diagnostic for exactly that denominator. Here it reads 98.04, comfortably above the common rule of thumb that an instrument needs an F greater than 10 before its estimate can be trusted.

=== step === widget
## Watching a weak instrument break

The widget below runs its own simulation, not Riverside Mart's, so you can toggle between a strong and a weak instrument yourself.

Read its instrument as standing in for cost_shock, its treatment for price, and its outcome for units.

::widget iv-2stage {}

Press Run on the code beneath the plot and it returns naive_ols at 3.16 against a true effect of 2.00, pulled upward by the same confounding bias that threw off Riverside Mart's own naive regression, and iv_2sls at 1.85, much closer to that true 2.00.

Now use the toggle above the plot. Under strong instrument, the IV line settles close to the true effect and the first-stage F reads in the hundreds. Switch to weak instrument and the IV line swings away from the true effect, while the first-stage F drops below 10, the same threshold you just read about.

A weaker instrument does not fail quietly. It keeps handing back a number, just one you can no longer trust.

=== step === concept
## What to do when the first-stage F comes up small
::prose-only the response is a short list of practical options; no widget needed to state them

A first-stage F below 10 is not a problem to explain away. It is the data telling you the instrument you have is too weak to carry the analysis.

When that happens, you have three honest options.

1. Report the estimate as unreliable, rather than publishing it as if the first-stage weakness were not there.
2. Look for a stronger instrument, one with a clearly larger first-stage F.
3. Fall back to an ordinary confounder analysis, accepting its own assumptions in place of an instrument that cannot do the job.

A large first-stage F does not rescue the other two conditions either. It only raises your confidence in relevance. Exogeneity and the exclusion restriction still rest on how convincingly you argued where the instrument came from, no matter how strong the first stage reads.

=== step === quiz
## Closing check: reading a weak instrument

A second candidate instrument, tried on a different dataset, produces a first-stage F of about 2 when its treatment is regressed on it. What does that number say about the resulting IV estimate?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- It needs a bigger sample before the estimate can be trusted. ::no
- The instrument barely moves the treatment, so the estimate's denominator is tiny and the number is unreliable even if it looks plausible. ::ok Right. An F near 2 is far below the rule-of-thumb threshold of 10. This instrument barely shifts the treatment, so the Wald ratio divides by almost nothing, and the resulting estimate can swing wildly even though it still prints a number.
- The estimate carrying a small p-value on its own makes it trustworthy regardless. ::no
- It signals a problem with the exclusion restriction instead. ::no An F near 2 is a relevance problem: this instrument barely moves the treatment. It says nothing about exogeneity or the exclusion restriction, which no F statistic ever tests, and nothing about needing more rows either, since a weak instrument stays weak no matter how large the sample grows.

=== step === tryit
## Your turn: run the two-stage estimate yourself

Riverside Mart ran the same kind of week again at a later date, a second batch of 300 store-weeks from the same chain.

Fill in the two-stage estimate yourself, then check the first-stage F before trusting it.

```r
# A second batch of 300 store-weeks from the same chain, same variables.
# demand, cost_shock, price and units are ready below.
set.seed(22)
demand <- rnorm(n)
cost_shock <- rnorm(n)
price <- 5 + 1.5 * demand + 1.0 * cost_shock + rnorm(n, 0, 0.3)
units <- 120 - 4 * price + 14 * demand + rnorm(n, 0, 5)

# Stage one: regress price on cost_shock and call it stage1.
# Stage two: take fitted(stage1) as price_hat, then regress units on
# price_hat and call it stage2. Print coef(stage2).
# Then print summary(lm(price ~ cost_shock))$fstatistic and check it
# against the F greater than 10 rule.
# Five lines. Press Check when you have them.
```

::check {"regex": "lm[(]\\s*price\\s*~\\s*cost_shock[\\s\\S]*fitted[(][\\s\\S]*lm[(]\\s*units\\s*~[\\s\\S]*fstatistic", "gate": true, "difficulty": "intermediate", "ok": "Right: an estimate near -3.25, firmly negative and much closer to the true -4 than a naive regression would give, backed by a first-stage F of about 136, comfortably clear of the rule-of-thumb 10.", "no": "Regress price on cost_shock first and call the result stage1, then fitted(stage1) as price_hat, then regress units on price_hat and call it stage2. Finish with summary(lm(price ~ cost_shock))$fstatistic."}
::solution
```r
# Stage one: regress price on cost_shock, then keep the fitted values
stage1 <- lm(price ~ cost_shock)
price_hat <- fitted(stage1)

# Stage two: regress units on the stage-one fitted values
stage2 <- lm(units ~ price_hat)
coef(stage2)
#> (Intercept)   price_hat 
#>  115.273253   -3.249489 

# The first-stage F: comfortably above the rule-of-thumb threshold of 10
summary(lm(price ~ cost_shock))$fstatistic
#>   value   numdf   dendf 
#> 136.349   1.000 298.000 
```

The two-stage estimate here is minus 3.25, even closer to the true minus 4 than the first batch's minus 5.31, and the first-stage F of 136 says this instrument is comfortably strong enough in this batch to trust that number.

=== step === concept
## References
::prose-only the sources are text, not a visual

- [Mostly Harmless Econometrics: An Empiricist's Companion](https://press.princeton.edu/books/paperback/9780691120355/mostly-harmless-econometrics) - Angrist, J.D. and Pischke, J-S. (2009), Princeton University Press. The standard applied reference for instrumental variables and two-stage least squares.
- [Identification of Causal Effects Using Instrumental Variables](https://doi.org/10.3386/t0136) - Angrist, J.D., Imbens, G.W., and Rubin, D.B. (1996), Journal of the American Statistical Association, 91(434), 444-455. The paper that formalizes the three conditions an instrument must satisfy.
- [Testing for Weak Instruments in Linear IV Regression](https://doi.org/10.3386/t0284) - Stock, J.H. and Yogo, M. (2005), in Identification and Inference for Econometric Models, Cambridge University Press, pp. 80-108. The source of the first-stage F greater than 10 rule of thumb.
- [Econometric Analysis of Cross Section and Panel Data](https://econpapers.repec.org/RePEc:mtp:titles:0262232588) - Wooldridge, J.M. (2010), MIT Press. Covers two-stage least squares and the weak-instrument problem in full.

=== step === complete
## What you can do now
::prose-only the lesson closes by restating the three skills; no new visual

You can now spot when a regression's coefficient is carrying someone else's effect instead of the one you asked for, the way Riverside Mart's naive regression carried demand's effect on price.

You can build a two-stage least squares estimate out of two ordinary regressions: fit the treatment on an instrument, then fit the outcome on the first regression's fitted values.

And you can read a first-stage F and judge whether the resulting estimate is one to trust, or one a weak instrument has left unstable.

Two other designs build a comparison from structure instead of from an instrument. Regression discontinuity uses a threshold rule, and synthetic control builds a weighted stand-in for the unit that never received the treatment.
