---
title: "Test stationarity: ADF, KPSS, and when to difference"
slug: "ARIMA-Mini-5"
description: "Run the ADF and KPSS tests on a real revenue series in R and learn why their verdicts can disagree, and use ndiffs() to know exactly when to difference."
keywords: "test stationarity in R, ADF test, KPSS test, unit root, differencing, ndiffs, adf.test, kpss.test, stationary time series"
mathjax: true
webr: true
date: "2026-09-09"
post_type: "LESSON"
course_id: "arima-from-zero"
course_title: "ARIMA from Zero"
course_lesson: "5"
course_total: "7"
course_landing: "/dashboard.html"
course_prev: "ARIMA-Mini-4"
course_next: "ARIMA-Mini-6"
curriculum_id: "0.0.24"
lesson_access: "windowed"
catalog_blurb: "Learn which stationarity test to trust and when differencing actually helps."
---

=== step === cover
## Test stationarity: ADF, KPSS, and when to difference

Today let's understand how to tell whether a time series is safe to model as it stands, using two real tests on one real revenue series.

Cobalt Analytics is a three-year-old subscription analytics startup. Its weekly recurring revenue, in thousands of dollars, has been rising since week one: built here as a steady climb of `$1,600` a week starting near `$45,000`, with about `$9,000` of random week-to-week noise on top. We built the series ourselves, so we already know exactly what produced it, which is what makes it a fair series to learn on.

Here is the whole routine, as one picture.

::widget process-flow {"steps": [{"title": "Test for a unit root and for stationarity", "sub": "adf.test() and kpss.test() check the series from opposite directions"}, {"title": "Resolve any disagreement", "sub": "match the trend assumption before acting on either verdict"}, {"title": "Count the differences needed", "sub": "ndiffs() reports d, how many times to difference"}, {"title": "Difference and re-test", "sub": "diff() should make both tests now agree it is stationary"}, {"title": "Stop once ndiffs() says 0", "sub": "differencing a stationary series further only adds noise"}]}

That is the whole flow. Everything from here runs it on Cobalt's real numbers, starting with the series itself: build it and look at the line it draws.

```r
# Build Cobalt Analytics's weekly revenue: a steady rise, plus random noise
set.seed(105)
week <- 1:150
revenue <- 45 + 1.6 * week + rnorm(150, sd = 9)

round(head(revenue, 4), 1)
#> [1] 35.0 44.0 51.0 63.1
round(tail(revenue, 4), 1)
#> [1] 286.8 275.5 278.7 283.8

plot(week, revenue, type = "l",
     main = "Cobalt Analytics: weekly revenue, first 150 weeks",
     xlab = "Week", ylab = "Revenue ($ thousands)")
```

The line runs from about `$35,000` in week 1 up past `$280,000` by week 150. A model fit only on the early weeks, when revenue sat under `$100,000`, would badly underestimate the later weeks, where it now regularly tops `$250,000`. Revenue growing this much changes the very thing a model estimates: its average level is not one fixed number, it is a moving target.

=== step === concept
## What makes a time series stationary

A time series is stationary when its statistical behaviour does not depend on when you look at it. Three conditions make that precise, and each one has its own way of failing.

- **Constant mean.** The average level of the series stays the same over time, instead of drifting up or down.
- **Constant variance.** The spread of values around that average stays about the same, instead of growing or shrinking.
- **Autocovariance depends only on the gap.** How strongly one point relates to a point some fixed number of steps away is the same relationship early in the series as late in it, not something that changes over time.

Cobalt's revenue breaks the first condition outright, and splitting it in half shows exactly how.

```r
# Split the 150 weeks in half and compare the mean and spread of each half
first_half  <- revenue[1:75]
second_half <- revenue[76:150]

round(c(mean_first = mean(first_half), mean_second = mean(second_half)), 1)
#>  mean_first mean_second 
#>       105.7       226.9 

round(c(sd_first = sd(first_half), sd_second = sd(second_half)), 1)
#>  sd_first sd_second 
#>      36.7      37.1 
```

The average revenue over weeks 1 to 75 is `$105,700`. Over weeks 76 to 150 it is `$226,900`, more than double. That is a moving mean, exactly what the first condition rules out: a stationary series would show roughly the same average in both halves, not one that doubles.

The spread stays close in both halves, about `$36,700` versus `$37,100`, so constant variance is not the problem here. It is specifically the rising mean that makes Cobalt's revenue non-stationary, and that is the piece the next two tests check for formally.

=== step === concept
## What a unit root is, and why it matters

The three-condition definition is the target, but neither test checks it directly. Both tests are really asking a narrower question, built around a simple model called an AR(1) process, short for "autoregressive of order 1":

\[ y_t = \phi \, y_{t-1} + \varepsilon_t \]

Here \(y_t\) is the series' value at time \(t\), \(y_{t-1}\) is its value one step earlier, \(\varepsilon_t\) is a fresh random shock drawn each period, and \(\phi\) (the Greek letter phi) is a single number that controls how much of the past carries forward.

Everything about whether the series is stationary comes down to \(\phi\).

- If \(|\phi| < 1\), each shock's effect fades over time: a shock today is worth \(\phi\) of itself next period and \(\phi^2\) the period after, shrinking toward zero. The series keeps reverting to a fixed mean, and it is stationary.
- If \(\phi = 1\), the model becomes \(y_t = y_{t-1} + \varepsilon_t\). Every shock adds to the level and never fades, so the series never reverts to a fixed mean. This case is called a **unit root**, and a series built this way is a **random walk**.

A unit root matters in practice because a relationship fit on one stretch of such a series has no reason to hold on another stretch of it: there is no fixed mean or fixed pattern underneath to learn. Cobalt's revenue gets tested against this exact idea next.

=== step === concept, widget
## The ADF test: does the series have a unit root?

The Augmented Dickey-Fuller test, `adf.test()` from the `tseries` package, checks the AR(1) idea directly. Its null hypothesis is that \(\phi = 1\): the series has a unit root. It always fits an intercept and a straight-line trend internally while it checks this, a detail that matters shortly. Reject the null and you have evidence against a unit root; fail to reject it and a unit root cannot be ruled out.

Run it on Cobalt's revenue.

```r
# Run the ADF test on Cobalt's weekly revenue
library(tseries)
adf.test(revenue)
#> 
#> 	Augmented Dickey-Fuller Test
#> 
#> data:  revenue
#> Dickey-Fuller = -5.3038, Lag order = 5, p-value = 0.01
#> alternative hypothesis: stationary
```

The p-value is 0.01, well under the usual 0.05 cutoff, so we reject the unit root null. ADF's verdict is that Cobalt's revenue does not have a unit root, at least not once a straight-line trend is allowed for.

That same evidence, as a shaded tail instead of a bare number:

::widget null-distribution {"tails": 1, "max": 4, "start": 2.33, "label": "how far the Dickey-Fuller statistic sits from zero, standardized to match the real p-value"}

The curve above is a generic standardized distribution, not the actual Dickey-Fuller distribution the real test compares against, which has its own nonstandard shape. But the mechanism is identical: drag the marker further from zero and the shaded tail, the p-value, shrinks; pull it back and the tail grows. It starts at the one point where the shaded tail works out to 0.01, the real p-value `adf.test()` reported.

=== step === concept, widget
## The KPSS test: does the series look stationary?

`kpss.test()`, also from `tseries`, checks the opposite side. Its null hypothesis is that the series is stationary, and by default it tests **level stationarity**: does the series sit around one fixed, flat line? A small p-value here means reject stationarity, the reverse of how ADF's p-value reads.

```r
# Run the KPSS test on the same revenue series
kpss.test(revenue)
#> 
#> 	KPSS Test for Level Stationarity
#> 
#> data:  revenue
#> KPSS Level = 3.0946, Truncation lag parameter = 4, p-value = 0.01
```

The p-value is 0.01 again, but this time that means reject: KPSS says Cobalt's revenue is not stationary around a flat line. Put next to ADF's verdict, that looks like a contradiction. ADF just said no unit root, and now KPSS says non-stationary.

::widget null-distribution {"tails": 1, "max": 4, "start": 2.33, "label": "how far the KPSS statistic sits from zero, standardized to match the real p-value"}

It is not actually a contradiction. The reason sits in how the two tests were built: ADF always fits a straight-line trend before it tests anything, while KPSS, by default, only ever tests against a flat line. Cobalt's revenue is climbing, so of course it fails a flat-line test even though it passes a trend-aware one. Giving KPSS the same trend ADF already assumes settles this next.

=== step === tryit
## Your turn: rerun KPSS with a trend null

`kpss.test()` takes a `null` argument. The default is `"Level"`, a flat line, the same one KPSS used before. Switching it to `"Trend"` regresses on a constant plus a straight-line trend instead, the same trend ADF already assumes.

Change the call below so KPSS tests against a trend instead of a flat line, then press Check.

```r
# Cobalt's revenue is still in this session. Switch this call to test against a trend instead of a flat line.
kpss.test(revenue, null = "Level")
```
::check {"regex": "null\\s*=\\s*[\"']Trend[\"']", "gate": true, "difficulty": "beginner", "ok": "Right. With null = \"Trend\", KPSS's p-value rises to 0.1, no longer rejecting. Once both tests share the same trend assumption, they agree.", "no": "Change null = \"Level\" to null = \"Trend\" inside kpss.test(revenue, ...). That gives KPSS the same straight-line trend ADF already fits."}
::solution
```r
# Give KPSS a straight-line trend instead of a flat one
kpss.test(revenue, null = "Trend")
#> 
#> 	KPSS Test for Trend Stationarity
#> 
#> data:  revenue
#> KPSS Trend = 0.034269, Truncation lag parameter = 4, p-value = 0.1
```

The statistic collapses from 3.0946 down to 0.034269, and the p-value rises from 0.01 to 0.1: no longer a rejection. Once KPSS is allowed the same sloped line ADF already assumes, the two tests agree completely. Cobalt's revenue is not a random walk; it is a series with a real trend, and that trend, not some unpredictable wandering, is what both tests were disagreeing about.

=== step === concept
## The four ADF/KPSS verdict combinations

What just played out with Cobalt's revenue was one specific combination of results. There are four possible combinations in total, and each one points to a different next step.

| ADF | KPSS (Level) | What it means | What to do |
|---|---|---|---|
| Rejects (p < 0.05): no unit root | Rejects (p < 0.05): non-stationary | Likely a mismatch between ADF's trend and KPSS's flat line | Re-run KPSS with null = "Trend" |
| Fails to reject (p > 0.05): unit root possible | Rejects (p < 0.05): non-stationary | Both agree: non-stationary | Difference the series |
| Rejects (p < 0.05): no unit root | Fails to reject (p > 0.05): stationary | Both agree: stationary | Model it as is |
| Fails to reject (p > 0.05): unit root possible | Fails to reject (p > 0.05): stationary | Neither test can decide | Not enough data; difference and re-test |

Cobalt's revenue started in that first row: ADF rejected the unit root while KPSS's flat-line test rejected stationarity too, a mismatch rather than a real disagreement. Re-running KPSS with a trend null resolved it, and once both tests shared the same trend assumption, they agreed the series has no unit root and is not wandering like a random walk. What comes next turns that agreement into a plan: exactly how many times to difference the series before modeling it.

=== step === concept
## How many times to difference: ndiffs() and diff()

Knowing a series is non-stationary is not the same as knowing what to do about it. `forecast::ndiffs()` answers that directly: it runs a stationarity test, and if the verdict is non-stationary, it differences the series, tests again, and repeats until the verdict comes back stationary, then reports how many rounds that took. That count is called \(d\).

Differencing itself is what `diff()` computes: replacing each value with the change from the value before it, \(y_t - y_{t-1}\).

```r
# How many times does Cobalt's revenue need to be differenced?
library(forecast)
ndiffs(revenue)
#> [1] 1

round(head(revenue, 4), 1)
#> [1] 35.0 44.0 51.0 63.1

round(head(diff(revenue), 3), 1)
#> [1]  9  7 12
```

`ndiffs()` says 1: one round of differencing should be enough. Look at the arithmetic behind it. Week 2's revenue is 44.0 and week 1's is 35.0, so the first differenced value is `44.0 - 35.0 = 9`. Week 3 is 51.0, so the next differenced value is `51.0 - 44.0 = 7`, and so on. The differenced series no longer describes revenue itself; it describes the change in revenue from one week to the next.

=== step === concept
## When differencing fixes it: re-testing the differenced revenue

Never assume differencing worked. Test it, the same way ADF and KPSS tested the original series.

```r
# Re-test the differenced revenue
adf.test(diff(revenue))
#> 
#> 	Augmented Dickey-Fuller Test
#> 
#> data:  diff(revenue)
#> Dickey-Fuller = -8.171, Lag order = 5, p-value = 0.01
#> alternative hypothesis: stationary

kpss.test(diff(revenue))
#> 
#> 	KPSS Test for Level Stationarity
#> 
#> data:  diff(revenue)
#> KPSS Level = 0.028484, Truncation lag parameter = 4, p-value = 0.1
```

ADF rejects the unit root (p = 0.01) and KPSS, this time with its default flat-line null, does not reject stationarity (p = 0.1). That is the clean top-right row from the four-combination table, and this time no trend null was needed to get there: differencing removed the trend that was confusing the flat-line test in the first place. One round of differencing turned Cobalt's revenue into a series both tests agree is stationary.

=== step === concept
## When differencing hurts: over-differencing a series that is already stationary

The ADF and KPSS re-test already confirmed one round of differencing was enough. Check that formally, then see what happens if you difference again anyway.

```r
# Check whether the differenced series still needs more differencing
ndiffs(diff(revenue))
#> [1] 0

round(c(sd_once = sd(diff(revenue)), sd_twice = sd(diff(diff(revenue)))), 2)
#>  sd_once sd_twice 
#>    11.60    20.02 
```

`ndiffs(diff(revenue))` comes back 0: no further differencing is needed. Difference it again anyway, `diff(diff(revenue))`, and the standard deviation does not shrink toward something cleaner. It rises from `11.60` to `20.02`, close to tripling the variance behind it.

The once-differenced series is already close to pure noise, with no trend left to remove. Differencing noise again does not cancel it out: it combines each point with two neighbouring points' worth of noise instead, so the leftover randomness compounds rather than shrinks. Once `ndiffs()` reports 0, that is the signal to stop.

=== step === quiz
## Quick check: choosing the right fix

A colleague runs both tests on a different series and gets p = 0.20 from ADF and p = 0.01 from KPSS's default level test. Based on the four ADF/KPSS combinations, what should they do next?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Trust whichever test gives the smaller p-value, and go with its verdict. ::no
- Treat the series as non-stationary and difference it: ADF failed to reject its unit root and KPSS rejected stationarity, so both point the same way. ::ok Exactly. ADF's p above 0.05 means it cannot rule out a unit root, and KPSS's p below 0.05 means it rejects stationarity too. Both verdicts agree the series is non-stationary, so the next move is to difference it and re-test.
- Keep differencing, round after round, until the standard deviation of the series stops changing. ::no
- Re-run KPSS with null = "Trend", the fix used earlier for a different combination of results. ::no That fix is for when ADF and KPSS both reject: a mismatch between the trend ADF assumes and the flat line KPSS assumes. Here ADF fails to reject a unit root and KPSS rejects stationarity, a different combination where both tests already agree the series is non-stationary, so the next move is to difference it and re-test. And ndiffs() tells you exactly when to stop differencing, a value of 0, not a rule based on watching the standard deviation.

=== step === tryit
## Your turn: confirm the differencing is done

`revenue` and `diff(revenue)` both still exist in this session. Write the one line that checks whether the once-differenced revenue needs any further differencing.

```r
# revenue still exists in this session. Check whether the DIFFERENCED revenue needs more differencing.
ndiffs(revenue)
```
::check {"regex": "ndiffs[(]\\s*diff[(]\\s*revenue\\s*[)]\\s*[)]", "gate": true, "difficulty": "intermediate", "ok": "Right: ndiffs(diff(revenue)) comes back 0, confirming one round of differencing was enough.", "no": "Wrap revenue in diff() before passing it to ndiffs(): ndiffs(diff(revenue)) checks the already-differenced series, not the original one."}
::solution
```r
# Check whether the once-differenced revenue needs any further differencing
ndiffs(diff(revenue))
#> [1] 0
```

`ndiffs(diff(revenue))` comes back 0, the same answer found before: one round of differencing was enough, and a second round would only add noise, not remove it.

=== step === complete
## References

That is the whole routine: check for a unit root with `adf.test()`, check for stationarity with `kpss.test()`, resolve a disagreement by matching their assumptions, then let `ndiffs()` decide exactly how many times to difference, and stop the moment it says 0.

- [Forecasting: Principles and Practice (3rd ed), the stationarity and differencing section](https://otexts.com/fpp3/stationarity.html) - Hyndman, R.J. and Athanasopoulos, G.
- [Unit root tests](https://robjhyndman.com/hyndsight/unit-root-tests/) - Rob Hyndman.
- [tseries package reference manual: adf.test and kpss.test](https://cran.r-project.org/web/packages/tseries/tseries.pdf) - R Core Team / tseries authors.
- [Testing the null hypothesis of stationarity against the alternative of a unit root](https://doi.org/10.1016/0304-4076%2892%2990104-Y) - Kwiatkowski, Phillips, Schmidt and Shin (1992), Journal of Econometrics 54(1-3), 159-178, the original KPSS paper.
