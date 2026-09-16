---
title: "ARIMA and Seasonal ARIMA Lesson 7: Automatic and manual ARIMA selection"
catalog_blurb: "When to trust an automatic model search, and when a manual order beats it."
description: "Compare ARIMA()'s automatic search against a fuller stepwise = FALSE search and a manual order, using AICc, coefficient p-values and a Ljung-Box test."
keywords: "ARIMA automatic selection, stepwise ARIMA search, AICc model comparison, Ljung-Box test, ARIMA override, fable ARIMA, unitroot_ndiffs, aus_production Beer forecast"
post_type: "LESSON"
curriculum_id: "5.60.7"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "ts-arima"
course_title: "ARIMA and Seasonal ARIMA"
course_lesson: "7"
course_total: "7"
course_landing: "ARIMA-and-Seasonal-ARIMA-Course.html"
course_next: ""
course_prev: "ARIMA-vs-ETS-When-to-Use-Each.html"
---

=== step === cover
## Automatic and manual ARIMA selection

Today's lesson is about a question every forecaster runs into the moment `ARIMA()` hands back an order: is this the model to trust, or is there a better one sitting one search away?

The running example is Beer, Australian quarterly beer production in megalitres, 218 quarters from 1956 Q1 through 2010 Q2, part of the `aus_production` data built into the tsibbledata package. Two ARIMA models get fitted to that exact same series in this lesson, and each one comes back with a different order and a different AICc, the score fable uses to compare them.

Here they are, side by side.

::widget styled-table {"cols":["ARIMA model","AICc"],"rows":[["ARIMA(1,1,2)(0,1,1)[4]",1783.11],["ARIMA(0,1,2)(0,1,1)[4]",1781.08]],"title":"Two ARIMA orders fit to the same 218 quarters of Beer","note":"Both come out of the same fable ARIMA() function, on the exact same series."}

Same series, but the two searches came back with different answers, an AICc gap of almost two points between them. That gap is the first thread to pull on.

=== step === concept
## What ARIMA() decides on its own

Call `ARIMA()` on a series with no formula at all, no `pdq()`, no `PDQ()`, and it still hands back a complete order. It decides how many times to difference the series, and which of the four AR and MA integers, p, q, P and Q, actually go into the equation. Both of those decisions happen automatically, and it is worth knowing exactly how before you decide whether to trust what comes out.

Build the Beer series first.

```r
# Build the Beer series: quarterly production in megalitres
library(fable)
library(tsibble)
library(tsibbledata)
library(feasts)
library(dplyr)

beer <- tsibbledata::aus_production |> select(Quarter, Beer)
beer
#> # A tsibble: 218 x 2 [1Q]
#>   Quarter  Beer
#>     <qtr> <dbl>
#> 1 1956 Q1   284
#> 2 1956 Q2   213
#> 3 1956 Q3   227
#> 4 1956 Q4   308
#> 5 1957 Q1   262
#> # ℹ 213 more rows
```

Before it ever picks p, q, P or Q, `ARIMA()` runs two unit-root tests to decide d, the number of ordinary differences, and D, the number of seasonal differences. Both answer the same question: how many times does this series need to be differenced before its mean, variance and autocorrelation settle down instead of drifting or repeating a season? Run those same two tests directly with `unitroot_ndiffs()` and `unitroot_nsdiffs()`, the functions `ARIMA()` calls internally.

```r
# Check how many ordinary and seasonal differences the series needs
beer |> features(Beer, unitroot_ndiffs)
#> # A tibble: 1 × 1
#>   ndiffs
#>    <int>
#> 1      1
beer |> features(Beer, unitroot_nsdiffs)
#> # A tibble: 1 × 1
#>   nsdiffs
#>     <int>
#> 1       1
```

Both come back 1. One ordinary difference, d = 1, removes the upward drift in Beer production. One seasonal difference at lag 4, D = 1, removes the yearly pattern that repeats every four quarters.

With d and D already fixed, `ARIMA()` still has four more integers to choose: p and q, the non-seasonal AR and MA terms, and P and Q, their seasonal counterparts. It searches over combinations of those four, scores each candidate by AICc, a number that rewards a close fit and penalizes every extra parameter, and keeps whichever candidate scores lowest. Fit it and read the winner.

```r
# Fit ARIMA() with no formula and let it choose p, q, P and Q on its own
fit <- beer |> model(auto = ARIMA(Beer))

report(fit)
#> Series: Beer 
#> Model: ARIMA(1,1,2)(0,1,1)[4] 
#> 
#> Coefficients:
#>          ar1      ma1     ma2     sma1
#>       0.0495  -1.0091  0.3746  -0.7434
#> s.e.  0.1959   0.1826  0.1530   0.0502
#> 
#> sigma^2 estimated as 241.3:  log likelihood=-886.41
#> AIC=1782.82   AICc=1783.11   BIC=1799.63
```

`ARIMA(1,1,2)(0,1,1)[4]` reads as: one non-seasonal AR term, one ordinary difference, two non-seasonal MA terms, then no seasonal AR term, one seasonal difference and one seasonal MA term, all at a period of 4 quarters. Its AICc, 1783.11, is the number that just got beaten in the table on the cover.

=== step === concept
## Why the stepwise search does not check every order

`ARIMA()`'s default search is called stepwise for a reason: it does not try every combination of p, q, P and Q. It starts from a handful of simple orders, then nudges one integer at a time, refitting whichever neighboring order that move produces, and moves toward whatever improves AICc the most. It stops the moment no neighboring order improves it any further.

That is a fast way to search, since checking about two dozen neighboring orders is far cheaper than checking every combination the search space allows. But it is a local search: it only ever explores the neighborhood of wherever it started, so it can settle on an order that is merely the best one nearby, not the best one out there. To move quickly between neighbors it also scores most candidates with an approximate likelihood instead of the exact one, saving the exact calculation for the final winner alone.

Check whether that approximation cost the auto search anything by looking at each of its coefficients on its own terms.

```r
# Check each coefficient's own estimate, standard error and p-value
tidy(fit)
#> # A tibble: 4 × 6
#>   .model term  estimate std.error statistic  p.value
#>   <chr>  <chr>    <dbl>     <dbl>     <dbl>    <dbl>
#> 1 auto   ar1     0.0495    0.196      0.253 8.01e- 1
#> 2 auto   ma1    -1.01      0.183     -5.53  9.49e- 8
#> 3 auto   ma2     0.375     0.153      2.45  1.52e- 2
#> 4 auto   sma1   -0.743     0.0502   -14.8   1.29e-34
```

A coefficient's p-value answers a specific question: if this term's true effect were actually zero, how often would you see an estimate this far from zero just by chance? sma1's p-value, 1.29e-34, is close enough to zero that there is no real doubt it belongs. ar1's p-value, 0.801, says the opposite: an estimate of 0.0495 is entirely ordinary even if ar1 does nothing at all. The stepwise search's fast, approximate scoring kept a term that, on a closer look, is not earning its place.

=== step === concept
## A fuller search: stepwise = FALSE and approximation = FALSE

Two arguments turn off both shortcuts at once. `stepwise = FALSE` makes `ARIMA()` check every candidate order in its search space instead of nudging from a starting point. `approximation = FALSE` makes it score every one of those candidates by the same exact maximum likelihood it previously saved for the final winner alone. Together, they check all 139 candidate combinations of p, q, P and Q that fit within `ARIMA()`'s defaults, each one scored exactly. Refit Beer with both switched on.

```r
# Force ARIMA() to check every candidate order by exact maximum likelihood
fit <- beer |> model(
  auto = ARIMA(Beer),
  full = ARIMA(Beer, stepwise = FALSE, approximation = FALSE)
)

report(fit |> select(full))
#> Series: Beer 
#> Model: ARIMA(0,1,2)(0,1,1)[4] 
#> 
#> Coefficients:
#>           ma1     ma2     sma1
#>       -0.9652  0.3396  -0.7393
#> s.e.   0.0664  0.0737   0.0480
#> 
#> sigma^2 estimated as 240.2:  log likelihood=-886.44
#> AIC=1780.88   AICc=1781.08   BIC=1794.33
```

The fuller search drops ar1 entirely, landing on `ARIMA(0,1,2)(0,1,1)[4]` instead. Check whether the three terms that remain earn their place any better than ar1 did.

```r
# Check whether every coefficient in the fuller search's order earns its place
tidy(fit |> select(full))
#> # A tibble: 3 × 6
#>   .model term  estimate std.error statistic  p.value
#>   <chr>  <chr>    <dbl>     <dbl>     <dbl>    <dbl>
#> 1 full   ma1     -0.965    0.0664    -14.5  9.90e-34
#> 2 full   ma2      0.340    0.0737      4.61 6.97e- 6
#> 3 full   sma1    -0.739    0.0480    -15.4  1.74e-36
```

Every single p-value here is astronomically small: ma1, ma2 and sma1 all earn their place. And this happened while AICc actually went down, 1781.08 against 1783.11, with one fewer parameter to estimate. That is not a size-for-accuracy trade. It is a genuinely better model that the stepwise search's shortcuts happened to miss.

=== step === widget
## Three candidate orders, side by side

There is a third way to reach an order: specify p, d, q, P, D and Q by hand with `pdq()` and `PDQ()`, instead of letting `ARIMA()` search for them. Try an even simpler guess than the fuller search found, dropping ma2 too and keeping just one non-seasonal MA term.

```r
# Add a third, simpler order chosen by hand
fit <- beer |> model(
  auto   = ARIMA(Beer),
  full   = ARIMA(Beer, stepwise = FALSE, approximation = FALSE),
  manual = ARIMA(Beer ~ pdq(0, 1, 1) + PDQ(0, 1, 1))
)

report(fit |> select(manual))
#> Series: Beer 
#> Model: ARIMA(0,1,1)(0,1,1)[4] 
#> 
#> Coefficients:
#>           ma1     sma1
#>       -0.7414  -0.6947
#> s.e.   0.0411   0.0569
#> 
#> sigma^2 estimated as 262.2:  log likelihood=-896.28
#> AIC=1798.56   AICc=1798.67   BIC=1808.64
```

Both of manual's own coefficients look fine on their own terms, each one many standard errors from zero. So judging an order by its own coefficients is not enough by itself either. Put all three orders in one table and compare them properly.

::widget styled-table {"cols":["model","order","AICc","note"],"rows":[["auto","ARIMA(1,1,2)(0,1,1)[4]",1783.11,"ar1 not significant, p = 0.801"],["full","ARIMA(0,1,2)(0,1,1)[4]",1781.08,"every coefficient significant"],["manual","ARIMA(0,1,1)(0,1,1)[4]",1798.67,"both coefficients significant, but AICc far higher"]],"title":"Three orders fit to the same Beer series","note":"Significant here means the p-value from tidy() is small enough to trust the term is really nonzero."}

full wins on AICc, and every one of its coefficients is significant too, the best result on both counts. manual has the fewest parameters of the three, and both of them are significant, but its AICc is nearly 17.6 points higher than full's. Fewer terms did not mean a better model here. It meant a worse one that happens to look tidy.

=== step === quiz
## Quick check: reading the comparison table

A colleague looks at auto's `tidy()` output and asks: "ar1's p-value is 0.801, does that actually matter?" What is the right answer?

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- Yes: it says ar1 is indistinguishable from zero, and dropping it is exactly what the fuller search's lower-AICc order did. ::ok Right. A p-value of 0.801 means the data give no evidence that ar1 differs from zero. The fuller, exact search dropped it and reached a lower AICc, 1781.08 against 1783.11, confirming the term was not earning its place.
- No, once a model's residuals look like plain noise, its coefficients' own p-values stop mattering. ::no
- No, more parameters always fit the data at least as well, so keeping ar1 can only help. ::no
- No, one p-value near 1 says nothing about the model as a whole, since AICc already accounts for it. ::no A single coefficient's p-value and the whole model's AICc answer two different questions. AICc compares whole models against each other, while a coefficient's own p-value says whether that one term is doing real work. Here they agree: the term with the high p-value is exactly the one the lower-AICc model drops.

=== step === concept
## When a manual override is worth it, and when it is not

There are real reasons to specify an order by hand instead of letting `ARIMA()` search. Maybe an earlier study on a similar series already settled on a particular order, or maybe you need a simpler equation to explain to a non-technical audience, two fewer terms to describe out loud. Either reason is legitimate.

What is not legitimate is assuming the override is cheap. The table above already gives the honest cost of this one: manual's AICc, 1798.67, sits nearly 17.6 points above full's 1781.08. That gap only shows up once you fit the override and compare it against the fuller search's own result, rather than trusting that fewer terms must mean a simpler, nearly-as-good answer.

So the rule is not "never override." It is: fit the override, fit the fuller search too, and let the AICc gap between them tell you what the simplicity actually costs.

::prose-only refers back to the three-way comparison table built in the previous step

=== step === widget
## The Ljung-Box test: necessary, but not sufficient

AICc and a coefficient's p-value both judge the model from the outside, its fit and its terms. The Ljung-Box test looks at what the model left behind: the residuals, the gaps between what it predicted and what actually happened. If a real pattern is still sitting in those residuals, autocorrelation the model should have caught, the order is not finished, no matter how good its AICc looks.

The test's lag argument sets how many of the residuals' own autocorrelations to check at once, 8 here. Its dof argument subtracts the number of AR and MA parameters the model already estimated, since those parameters already used up some of the data's own freedom to explain away autocorrelation. auto estimated 4 (ar1, ma1, ma2, sma1), full estimated 3 (ma1, ma2, sma1), and manual estimated 2 (ma1, sma1). Run the test on all three.

```r
# Test each fitted model's residuals for leftover autocorrelation
fit |> select(auto) |> augment() |> features(.innov, ljung_box, lag = 8, dof = 4)
#> # A tibble: 1 × 3
#>   .model lb_stat lb_pvalue
#>   <chr>    <dbl>     <dbl>
#> 1 auto      4.06     0.397

fit |> select(full) |> augment() |> features(.innov, ljung_box, lag = 8, dof = 3)
#> # A tibble: 1 × 3
#>   .model lb_stat lb_pvalue
#>   <chr>    <dbl>     <dbl>
#> 1 full      4.18     0.524

fit |> select(manual) |> augment() |> features(.innov, ljung_box, lag = 8, dof = 2)
#> # A tibble: 1 × 3
#>   .model lb_stat lb_pvalue
#>   <chr>    <dbl>     <dbl>
#> 1 manual   19.4   0.00350
```

auto and full both pass comfortably, p = 0.397 and p = 0.524, well above the usual 0.05 cutoff: neither one's residuals show leftover autocorrelation. manual fails outright, p = 0.0035, its residuals still carrying a pattern the simpler order missed.

Notice what this test could and could not tell you. It caught manual's real problem, the one AICc alone already flagged. But it passed both auto and full, the exact two orders whose AICc and coefficients told them apart. A Ljung-Box pass rules an order out when it fails; it does not crown a winner among the orders that pass.

This widget's own healthy panel is the shape full's residuals actually take: scattered noise with no leftover pattern, the same conclusion its p-value of 0.524 already gave you as a number.

::widget residual-plot {"start":"healthy"}

=== step === concept
## A checklist for choosing an ARIMA order

Put the last few steps together and you get a short, repeatable workflow. Run it in this order every time.

1. Fit `ARIMA()` plain, no arguments, for a fast baseline order.
2. Refit with `stepwise = FALSE, approximation = FALSE`, and compare its AICc against the baseline.
3. Check each coefficient's p-value with `tidy()`, and question any term that is not significant.
4. If you override the order by hand for a real reason, fit that order too, and compare its AICc honestly rather than assuming the simpler order is close enough.
5. Run a Ljung-Box test on the order you are about to trust; remember it can rule an order out, but a pass alone cannot crown a winner among several that pass.
6. Forecast forward from whichever order survives all of the above.

On Beer, full is the order that survived every one of those checks: the lowest AICc, every coefficient significant, and a clean Ljung-Box result. Forecast 8 quarters ahead from it.

```r
# Forecast 8 quarters ahead from the fuller-search model
fc <- fit |> select(full) |> forecast(h = 8)

fc |> as_tibble() |> select(Quarter, .mean) |> mutate(.mean = round(.mean))
#> # A tibble: 8 × 2
#>   Quarter .mean
#>     <qtr> <dbl>
#> 1 2010 Q3   409
#> 2 2010 Q4   478
#> 3 2011 Q1   413
#> 4 2011 Q2   379
#> 5 2011 Q3   401
#> 6 2011 Q4   475
#> 7 2012 Q1   411
#> 8 2012 Q2   376
```

That gives 409, 478, 413, 379, 401, 475, 411 and 376 megalitres for 2010 Q3 through 2012 Q2, a forecast built on the order that earned its place at every step of the checklist, not just the first one that came out of `ARIMA()`.

=== step === quiz
## Quick check: judging a simpler model

A stakeholder asks you to use `ARIMA(Beer ~ pdq(0, 1, 0) + PDQ(0, 1, 1))`, the simplest order possible: no non-seasonal AR or MA terms at all, just the one seasonal MA term. What should you do?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Agree immediately, since fewer terms always generalize better to new data. ::no
- Fit it, then show them its AICc against 1781.08 and a Ljung-Box check on its residuals before agreeing or refusing. ::ok Right. This order's real AICc comes out at 1924.05, more than 140 points above full's 1781.08, a cost the checklist's second step would have caught. Fitting it and running the same checks used throughout this lesson beats agreeing or refusing on instinct.
- Refuse outright, since a manually specified order is never valid to use. ::no
- Compare BIC instead of AICc, since BIC solves the problem of comparing models with different numbers of parameters. ::no BIC and AICc both penalize extra parameters, just by different amounts, and neither one replaces actually fitting the candidate and checking its residuals. The size of the gap here settles it either way: 1924.05 against 1781.08 is decisive on any reasonable criterion.

=== step === tryit
## Your turn: check whether a simpler order really is safe

manual, the order from a few steps back, `ARIMA(0,1,1)(0,1,1)[4]`, estimated exactly two coefficients: ma1 and sma1. Run its own Ljung-Box test and see whether it actually passes.

```r
# Test the manual order's residuals for leftover autocorrelation
library(fable)

# Complete this line: manual estimated two coefficients (ma1, sma1).
# Set dof to that count inside ljung_box(), then press Check.

```
::check {"regex": "dof\\s*=\\s*2", "gate": true, "difficulty": "beginner", "ok": "Right: dof = 2 matches manual's two estimated coefficients. lb_stat comes out at 19.4, p = 0.0035, clearly below 0.05, so manual fails the Ljung-Box test, exactly the problem AICc alone did not show you.", "no": "manual, ARIMA(0,1,1)(0,1,1)[4], estimated exactly two coefficients: ma1 and sma1. Set dof to 2 inside ljung_box(lag = 8, dof = 2)."}
::solution
```r
# Test the manual order's residuals for leftover autocorrelation
fit |> select(manual) |> augment() |> features(.innov, ljung_box, lag = 8, dof = 2)
#> # A tibble: 1 × 3
#>   .model lb_stat lb_pvalue
#>   <chr>    <dbl>     <dbl>
#> 1 manual   19.4   0.00350
```

manual's Ljung-Box test fails clearly, p = 0.0035. Its AICc looked only mildly worse next to full's, but its residuals settle the question outright: this order left real autocorrelation behind, and no amount of coefficient tidiness makes up for that.

=== step === concept
## References

- [Hyndman, R.J. and Khandakar, Y. (2008), "Automatic Time Series Forecasting: The forecast Package for R", Journal of Statistical Software 27(3)](https://doi.org/10.18637/jss.v027.i03) - describes the stepwise search over AICc that `ARIMA()`'s default still runs today.
- [Forecasting: Principles and Practice (3rd ed.)](https://otexts.com/fpp3), the ARIMA and residual-diagnostics chapters - Hyndman and Athanasopoulos, the source for the differencing, coefficient and residual checks used throughout this lesson.
- [fable package documentation](https://pkg.robjhyndman.com/fable) - reference for `ARIMA()`'s `stepwise` and `approximation` arguments, `pdq()`, `PDQ()`, `report()` and `tidy()`.
- [Ljung, G.M. and Box, G.E.P. (1978), "On a Measure of Lack of Fit in Time Series Models", Biometrika 65(2)](https://doi.org/10.1093/biomet/65.2.297) - the residual test run in this lesson.
- Box, G.E.P., Jenkins, G.M., Reinsel, G.C. and Ljung, G.M., "Time Series Analysis: Forecasting and Control", Wiley - the classical reference behind the ARIMA notation used throughout.

=== step === complete
## From automatic search to a trusted order

Three orders came out of the same series: auto at AICc 1783.11 with a coefficient that did not earn its place, full at 1781.08 with every coefficient significant, and manual at 1798.67, tidy on paper but failing its own Ljung-Box test outright.

You now have a workflow that would have caught every one of those problems: fit the plain automatic order as a baseline, force a fuller search and compare AICc, check every coefficient's p-value, price any manual override honestly against the fuller search, and run a Ljung-Box test before trusting any of them. None of those checks alone was enough. Together, they pointed to full as the order actually worth forecasting from.
