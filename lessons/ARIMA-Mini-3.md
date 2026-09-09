---
title: "How to choose ARIMA order (p, d, q): a practical guide"
slug: "ARIMA-Mini-3"
description: "Choose an ARIMA order in R: test for stationarity with ADF and KPSS, read real ACF and PACF plots, then compare candidates with AICc and a residual check."
keywords: "ARIMA order, choose ARIMA p d q, ACF and PACF, ADF test, KPSS test, ndiffs, AICc, Ljung-Box test, ARIMA in R"
mathjax: true
webr: true
date: "2026-09-09"
post_type: "LESSON"
course_id: "arima-from-zero"
course_title: "ARIMA from Zero"
course_lesson: "3"
course_total: "7"
course_landing: "/dashboard.html"
course_prev: "ARIMA-Mini-2"
course_next: ""
curriculum_id: "0.0.17"
lesson_access: "windowed"
catalog_blurb: "Turn a real, imperfect ACF and PACF into an ARIMA order you can defend."
---

=== step === cover
## How to choose ARIMA order (p, d, q): a practical guide

Today you are going to take one real series of daily counts and turn it into an ARIMA order you can defend, not guess at.

Bellwood Coffee, an independent coffee shop, logs how many drink orders its point-of-sale system rings up every day. The owner pulled the first 100 days of that log: orders open near 47, dip as low as 26 by day 39, then climb to 113 by day 100 as the shop built up its regulars.

An ARIMA model for a series like this needs exactly three integers, written ARIMA(p, d, q). Get those three right and R estimates everything else on its own, the coefficients and the forecasts included. Get them wrong and the model either misses a pattern that is really there or invents one that is not.

Picking p, d, and q is not a matter of taste. It is a short, repeatable routine, always the same four stages in the same order, and you will run every one of them on Bellwood's own numbers.

::widget process-flow {"steps":[{"title":"Remove the trend","sub":"difference the series until its level stops drifting"},{"title":"Read the ACF and PACF","sub":"shortlist how many AR and MA terms the pattern calls for"},{"title":"Fit a few candidates","sub":"fit each shortlisted order and score it with a penalized measure of fit"},{"title":"Compare and confirm","sub":"pick the lowest score, then check its residuals for anything left over"}]}

That is the whole routine laid out above. Four stages, always in that order, and Bellwood's order counts will carry you through every one of them.

=== step === concept
## The three numbers behind ARIMA(p, d, q), and why order matters

An ARIMA(p, d, q) model is built from three separate components, and each one answers a different question about the series.

d is the order of differencing: how many times you subtract each value from the one before it until the series settles at a level that stays roughly constant over time. p is the number of autoregressive terms: how many of the series' own past values it takes to predict the next one. q is the number of moving-average terms: how many past forecast errors it takes to predict the next one.

Once those three integers are fixed, R estimates every coefficient in the model on its own. So choosing an order really is the whole job, and nothing else is left to guess.

Build Bellwood's order counts once and plot them, since every calculation from here on uses this same series.

```r
# Build Bellwood Coffee's 100-day order series and plot it
library(forecast)
library(ggplot2)
set.seed(42)
n <- 100
drift <- 0.6
arma_diff <- arima.sim(model = list(ar = 0.35, ma = 0.5), n = n) * 2.6
diffs <- drift + arma_diff
orders <- round(40 + cumsum(diffs))
orders <- pmax(orders, 5)
orders_ts <- ts(orders)
autoplot(orders_ts) + ggtitle("Bellwood Coffee: daily drink orders, days 1-100")
```

The climb in that plot is easiest to see as a plain comparison of averages.

```r
# Compare the average order count in the first and last 20 days
mean(orders_ts[1:20])
#> [1] 57.2
mean(orders_ts[81:100])
#> [1] 103.1
```

The first 20 days average 57.2 orders a day. The last 20 average 103.1, nearly double. That is exactly the kind of trend an AR or MA term cannot handle on its own: both assume the series varies around one fixed average, and Bellwood's plainly does not. Fixing that is what d is for.

=== step === concept
## Two tests that disagree on purpose: ADF and KPSS

The reason d exists is that AR and MA terms both assume the series is stationary: its average level and its variance stay roughly the same all the way through. Bellwood's rising order count breaks that assumption outright, so you need a formal way to confirm what the plot already suggests.

Two tests do that job, and the trap is that they ask the question from opposite directions.

The Augmented Dickey-Fuller test, ADF, starts from the assumption that the series is non-stationary. That assumption is its null hypothesis. A large p-value gives you no reason to abandon it, so the series stays flagged as non-stationary, and only a small p-value, below 0.05, lets you call it stationary instead.

The KPSS test starts from the opposite assumption: its null hypothesis is that the series already IS stationary. Here a small p-value works against you, since it rejects stationarity, while a large p-value fails to reject it.

Run both on Bellwood's raw order counts.

```r
# Test Bellwood's raw order counts for stationarity, ADF first
suppressMessages(library(tseries))
adf.test(orders_ts)
#> 
#> 	Augmented Dickey-Fuller Test
#> 
#> data:  orders_ts
#> Dickey-Fuller = -2.1922, Lag order = 4, p-value = 0.497
#> alternative hypothesis: stationary
```

```r
# Now run the KPSS test on the same raw series
kpss.test(orders_ts)
#> 
#> 	KPSS Test for Level Stationarity
#> 
#> data:  orders_ts
#> KPSS Level = 1.4103, Truncation lag parameter = 4, p-value = 0.01
```

ADF's p-value is 0.497, far above 0.05. That is a large p-value under ADF's null of non-stationary, so ADF gives you no reason to reject it. KPSS's p-value is 0.01, well below 0.05, and that is a small p-value under KPSS's null of stationary, so KPSS rejects it outright.

Read together, that is not a contradiction. It is the same verdict read from two opposite directions: ADF fails to call the raw order counts stationary, and KPSS actively rejects stationarity. Both point the same way, toward differencing.

[WARNING]
The single most common mistake in choosing d is reading ADF and KPSS the same way. Because "reject the null" sounds like one instruction, it is tempting to treat a small p-value as good news on both tests. On ADF a small p-value is what you want, since it lets you call the series stationary. On KPSS a small p-value means the opposite: it is what tells you the series is NOT stationary. Keep the two null hypotheses straight and the two p-values stop being confusing.

It helps to remember what a p-value is actually doing underneath both of these tests. Every hypothesis test compares your statistic against the spread of values you would see if its null hypothesis were exactly true, then shades the share of that spread at least as extreme as what you observed. That shaded share is the p-value.

The widget below illustrates that general idea with a plain bell-shaped curve. ADF and KPSS actually use their own, differently shaped reference distributions, so their real p-values do not come from a curve like this one, though the logic behind the shading is identical.

::widget null-distribution {"tails": 2, "max": 4, "start": 1.8, "label": "distance from the center of the null distribution"}

Drag the marker further from the centre and the shaded tail, the p-value, keeps shrinking. Pull it back toward the centre and the shaded tail grows instead, the same reason a middling ADF or KPSS statistic leaves you without a clear verdict either way.

=== step === concept
## Confirming d with ndiffs(), and the over-differencing trap

Running ADF and KPSS by hand is worth doing once, so you know what you are trusting. But you do not have to run them yourself every time. The forecast package's `ndiffs()` function runs a stationarity test repeatedly on its own and returns the number of differences the series needs.

```r
# Ask ndiffs how many differences the raw series needs
ndiffs(orders_ts)
#> [1] 1
```

One difference, the same conclusion ADF and KPSS reached for the raw order counts. `diff()` turns the daily order counts into day-to-day changes:

\[ y'_t = y_t - y_{t-1} \]

Here \(y_t\) is today's order count, \(y_{t-1}\) is yesterday's, and \(y'_t\) is the change between them. Difference the series once and re-run both tests to confirm it worked.

```r
# Difference once and re-run the ADF test
orders_diff <- diff(orders_ts)
adf.test(orders_diff)
#> 
#> 	Augmented Dickey-Fuller Test
#> 
#> data:  orders_diff
#> Dickey-Fuller = -4.9427, Lag order = 4, p-value = 0.01
#> alternative hypothesis: stationary
```

```r
# Re-run the KPSS test on the same differenced series
kpss.test(orders_diff)
#> 
#> 	KPSS Test for Level Stationarity
#> 
#> data:  orders_diff
#> KPSS Level = 0.16244, Truncation lag parameter = 3, p-value = 0.1
```

ADF's p-value drops to 0.01, comfortably below 0.05, so ADF now calls the differenced series stationary. KPSS's p-value rises to 0.1, comfortably above 0.05, so KPSS no longer rejects it either. Both tests now agree, from opposite directions, that one difference is enough: d = 1.

[KEY INSIGHT]
Difference the series the smallest number of times that makes it stationary, and stop there. Differencing again once it is already stationary injects fake negative correlation into it and inflates its variance, which then misleads the ACF and PACF plots you are about to read. When `ndiffs()` says 1, resist the pull to difference a second time.

=== step === quiz
## Quick check: reading ADF and KPSS together

A raw series comes back with ADF p-value 0.40 and KPSS p-value 0.02. What should you do next?

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- Both tests point to stationary, so leave the series exactly as it is. ::no
- Read the KPSS p-value the same way as ADF's: 0.02 is small, so it must mean stationary here too, which would make the two tests inconclusive together. ::no
- Difference the series. ADF's p-value of 0.40 gives no reason to call it stationary, and KPSS's p-value of 0.02 actively rejects stationarity, so both point toward differencing. ::ok Exactly. A large ADF p-value and a small KPSS p-value are not a disagreement. They are the same verdict read from two opposite null hypotheses.
- Trust ADF alone and ignore KPSS, since only one test can be right about the same series. ::no ADF's null is non-stationary, so its large p-value here means no evidence against non-stationary. KPSS's null is stationary, so its small p-value means evidence against stationary. Both readings point the same way, toward differencing, not away from it.

=== step === concept
## What the ACF and PACF actually measure

With d settled, the next two numbers, p and q, come from two plots read together: the autocorrelation function, ACF, and the partial autocorrelation function, PACF.

The ACF at lag k measures how correlated the series is with a copy of itself shifted k days back. The PACF at lag k measures that same correlation, but with the influence of every shorter lag stripped out first, so it captures only the direct link between a value and the one k days earlier.

Both plots come with a significance band. A bar that pokes outside the band is a spike worth reading, and a bar inside it is treated as noise. Its width is \(\pm 1.96/\sqrt{n}\), where n is how many observations you are reading, and Bellwood's differenced series has 99 of them, one fewer than the original 100 because differencing costs you the first day.

```r
# Compute the significance band width for the differenced series
round(1.96 / sqrt(99), 3)
#> [1] 0.197
```

So any ACF or PACF bar bigger than about 0.2 in size counts as a real spike here. Two words describe how a plot behaves around that band, and getting both right is what lets you tell an AR pattern from an MA one:

- Cuts off: the bars are significant up to some lag, then drop inside the band and stay there.
- Tails off: the bars shrink gradually toward zero over several lags, often flipping sign along the way, with no clean break.

A quick peek at Bellwood's own numbers shows what these look like in practice.

```r
# Peek at the first few PACF and ACF values of the differenced orders
round(Pacf(orders_diff, plot = FALSE)$acf[1:4], 3)
#> [1]  0.606 -0.259  0.008 -0.055
round(Acf(orders_diff, plot = FALSE)$acf[2:5], 3)
#> [1]  0.606  0.204  0.003 -0.079
```

Neither array drops to zero after one clean spike, which is worth noticing now.

=== step === concept
## Reading the PACF: how many AR terms does Bellwood need?

The rule for the autoregressive order is this: for a pure autoregressive process of order p, written AR(p), the PACF cuts off sharply right after lag p, while the ACF tails off gradually instead. So you read p by counting how many PACF spikes clear the band before it settles inside for good.

```r
# Read the PACF of Bellwood's differenced orders
round(Pacf(orders_diff, plot = FALSE)$acf[1:4], 3)
#> [1]  0.606 -0.259  0.008 -0.055
```

Lag 1 sits at 0.606, well outside the ±0.197 band, a clear spike. Lag 2 is -0.259, still outside the band but only narrowly. Lags 3 and 4, at 0.008 and -0.055, both sit comfortably inside it.

That is not the textbook picture of one clean cutoff. Two spikes clear the band, then the PACF settles. Real data rarely reads as cleanly as a simulated series would, and this is a normal case of that: it is reasonable to carry forward p = 1, treating lag 2 as a marginal spike, or p = 2, treating it as real. Rather than agonize over that one bar, shortlist both and let AICc decide.

=== step === concept
## Reading the ACF: how many MA terms, and what does the whole picture suggest?

The rule for the moving-average order mirrors the PACF rule, with the two plots swapped: for a pure moving-average process of order q, written MA(q), the ACF cuts off sharply after lag q, while the PACF tails off instead. Count how many ACF spikes clear the band before it settles.

```r
# Read the ACF of Bellwood's differenced orders
round(Acf(orders_diff, plot = FALSE)$acf[2:5], 3)
#> [1]  0.606  0.204  0.003 -0.079
```

Lag 1 is 0.606, comfortably outside the band. Lag 2 is 0.204, just past the ±0.197 line, only barely. Lags 3 and 4, at 0.003 and -0.079, sit inside it.

That is the same story the PACF just told: one clean spike, a second one right at the edge, then nothing. Read strictly, q = 1. Read generously, q = 2 is still on the table.

Put the two readings side by side, and neither plot gives you the crisp, one-clean-cutoff picture a textbook example would. That is itself useful information, because it tells you which row of the reading rule applies.

| ACF behavior | PACF behavior | Suggested model |
|---|---|---|
| Tails off gradually | Cuts off after lag p | AR(p) |
| Cuts off after lag q | Tails off gradually | MA(q) |
| Tails off gradually | Tails off gradually | Mixed ARMA, compare by AICc |

Bellwood's differenced series shows a spike then a fade in BOTH plots, not a crisp cutoff in either one on its own. That puts it in the mixed row, where an ARMA model is a live possibility alongside a pure AR or pure MA one. Between the marginal lag-2 spikes and that mixed reading, three candidates are worth fitting: AR(1), the strict PACF read, MA(1), the strict ACF read, and ARMA(1,1), treating both lag-2 spikes as real. Fitting all three lets the data decide which one actually earns its keep.

=== step === concept
## Fitting three candidates and comparing by AICc

Before fitting anything, it helps to see why you cannot just pick whichever candidate fits the data best. Giving a model more AR or MA terms can only improve its fit to the data you already have, or leave it exactly the same. It can never make the fit worse. So comparing candidates by raw fit alone would always end up favoring the most complicated one, whether or not it actually captures anything real.

This is the same trap that shows up anywhere a more flexible model is compared against a simpler one. The widget below is a generic illustration of it: a model complexity slider, and two error curves, one measured on the data a model was trained on, one on data it has never seen. Bellwood's own candidates sit on a much smaller version of that same complexity axis: AR(1) and MA(1) each add one extra term over the plainest model, and ARIMA(1,1,1) adds two.

::widget bias-variance {"start": 2, "maxDegree": 6}

Notice the training-error curve there: it keeps falling as complexity rises and never turns back up. That is exactly the trap. A raw in-sample fit score behaves the same way, and would always favor Bellwood's most complicated candidate regardless of whether the extra terms are earning their place. What you actually want is a score that adds a penalty for every extra term, so a genuinely better model has to earn its complexity rather than simply spend it.

AIC, AICc, and BIC are that kind of score. AICc is the one to reach for on a series this short: it is AIC with an extra correction for a small sample size, so it stays accurate with only 100 days of data. Fit all three candidates and compare.

```r
# Fit the three candidate ARIMA orders and compare AICc and BIC
m_ar1    <- Arima(orders_ts, order = c(1, 1, 0))
m_ma1    <- Arima(orders_ts, order = c(0, 1, 1))
m_arma11 <- Arima(orders_ts, order = c(1, 1, 1))

comp <- data.frame(
  model = c("ARIMA(1,1,0)", "ARIMA(0,1,1)", "ARIMA(1,1,1)"),
  AICc  = round(c(m_ar1$aicc, m_ma1$aicc, m_arma11$aicc), 2),
  BIC   = round(c(m_ar1$bic, m_ma1$bic, m_arma11$bic), 2)
)
print(comp, row.names = FALSE)
#>         model   AICc    BIC
#>  ARIMA(1,1,0) 503.40 508.46
#>  ARIMA(0,1,1) 504.21 509.27
#>  ARIMA(1,1,1) 499.42 506.95
```

ARIMA(1,1,1) scores lowest on both AICc and BIC, and not by a hair: it beats the next-best candidate by roughly 4 to 5 points on AICc and by roughly 1.5 to 2.3 points on BIC. Complexity earned its keep here. Two extra parameters bought a real drop in the penalized score, not just a better fit to noise.

It is worth checking that against R's own automatic search, which scores candidates the same way under the hood.

```r
# Compare against R's own automatic search
auto.arima(orders_ts)
#> Series: orders_ts 
#> ARIMA(1,1,1) 
#> 
#> Coefficients:
#>          ar1     ma1
#>       0.4061  0.3753
#> s.e.  0.1360  0.1401
#> 
#> sigma^2 = 8.652:  log likelihood = -246.58
#> AIC=499.17   AICc=499.42   BIC=506.95
```

`auto.arima()` lands on ARIMA(1,1,1) independently, with the same AICc of 499.42. Reading the ACF and PACF by hand got you to the same shortlist, and the penalized score picked the same winner a black-box search would.

=== step === concept
## Confirming the winner with a residual white-noise check

AICc picked a winner, but it is still worth checking what the winner leaves behind: the residuals, whatever is left over after the model has explained everything it can. If ARIMA(1,1,1) has genuinely captured the pattern in Bellwood's order counts, its residuals should look like white noise, plain unstructured randomness with nothing left to explain.

The Ljung-Box test checks exactly that. Its null hypothesis is that the residuals are white noise, so here you want a LARGE p-value: it means the test found no reason to reject that the leftovers are just noise.

```r
# Test all three candidates' residuals for leftover autocorrelation
Box.test(residuals(m_ar1), type = "Ljung-Box", lag = 10, fitdf = 1)
#> 
#> 	Box-Ljung test
#> 
#> data:  residuals(m_ar1)
#> X-squared = 16.434, df = 9, p-value = 0.05835
Box.test(residuals(m_ma1), type = "Ljung-Box", lag = 10, fitdf = 1)
#> 
#> 	Box-Ljung test
#> 
#> data:  residuals(m_ma1)
#> X-squared = 15.585, df = 9, p-value = 0.07606
Box.test(residuals(m_arma11), type = "Ljung-Box", lag = 10, fitdf = 2)
#> 
#> 	Box-Ljung test
#> 
#> data:  residuals(m_arma11)
#> X-squared = 9.3713, df = 8, p-value = 0.3119
```

ARIMA(1,1,1)'s residuals give p = 0.312, comfortably above 0.05: nothing left to explain. ARIMA(1,1,0) and ARIMA(0,1,1) give p = 0.058 and p = 0.076, both just above the line but close enough to call borderline: a small amount of pattern the simpler candidates left behind. That lines up exactly with the AICc ranking: the two candidates that scored worse also have the shakier residuals.

A quick look at the winning model's own residual ACF confirms it.

```r
# Look at the winning model's residual ACF
round(Acf(residuals(m_arma11), plot = FALSE)$acf[2:6], 3)
#> [1] -0.006 -0.002 -0.057 -0.039  0.038
```

Every one of those five lags sits well inside the ±0.196 band for a series this length. Nothing sticks out.

[KEY INSIGHT]
The residual check is not a formality you run after you have already decided. Had it come back with a small p-value, that would be a signal to go back and try a larger candidate. AICc says which model fits best among the ones you tried. The Ljung-Box test says whether the winner is actually good enough to stop at.

=== step === quiz
## Quick check: reading a real ACF and PACF together

A differenced series shows an ACF that tails off gradually and a PACF that cuts off sharply after lag 2. What order does that suggest?

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- AR(2) is the right read: a PACF that cuts off sharply after lag 2 is the AR fingerprint, and an ACF that tails off gradually is exactly what a pure AR process should do. ::ok Exactly right. A cutoff in the PACF paired with a tailing ACF is the AR(p) row of the reading rule, with p read straight off the lag where the PACF cuts off.
- The order is MA(2), because the ACF is the plot that decides moving-average terms, and it still shows some activity past lag 2. ::no
- The order is inconclusive from these plots alone, so skip them and run auto.arima() instead. ::no
- The order is ARMA(2,2), since both plots appear to be showing some activity. ::no A cutoff in the PACF, not the ACF, after lag 2, paired with an ACF that tails off, is the textbook AR(2) fingerprint. The mixed ARMA row is reserved for when BOTH plots tail off, which is not the case in this scenario, and the plots exist precisely so you do not have to skip straight to auto.arima().

=== step === tryit
## Your turn: score a fourth candidate against the winner

ARIMA(1,1,1) is the winner so far, but the PACF's marginal lag-2 spike left p = 2 on the table too. Fit ARIMA(2,1,0), the pure AR(2) candidate, and see how close it actually comes to the winner.

```r
# Goal: fit ARIMA(2,1,0) on orders_ts, read off its AICc,
# then run a Ljung-Box test on its residuals.
# Three lines. Press Check when you have them.
```
::check {"regex": "order\\s*=\\s*c[(]\\s*2\\s*,\\s*1\\s*,\\s*0\\s*[)]", "gate": true, "difficulty": "intermediate", "ok": "Right: AICc comes out at 499.4222 against ARIMA(1,1,1)'s 499.4186, a gap under a hundredth of a point. That is close enough that AICc alone cannot separate them, so the residual check is what actually decides.", "no": "Fit it with Arima(orders_ts, order = c(2, 1, 0)), then read $aicc off the fitted object, then run Box.test() on residuals(...) with lag = 10 and fitdf = 2, just like the other three candidates."}
::solution
```r
# Fit ARIMA(2,1,0) and score it the same way as the other candidates
m_ar2 <- Arima(orders_ts, order = c(2, 1, 0))
round(m_ar2$aicc, 4)
#> [1] 499.4222
Box.test(residuals(m_ar2), type = "Ljung-Box", lag = 10, fitdf = 2)
#> 
#> 	Box-Ljung test
#> 
#> data:  residuals(m_ar2)
#> X-squared = 9.4045, df = 8, p-value = 0.3093
```

ARIMA(2,1,0) scores 499.4222, ARIMA(1,1,1) scores 499.4186. That gap is under four thousandths of a point, nothing an AICc comparison alone can call decisively. This is exactly the case the Ljung-Box test is for: ARIMA(2,1,0)'s residuals give p = 0.309, just as comfortably white noise as ARIMA(1,1,1)'s 0.312.

When two candidates are this close on AICc, and both pass the residual check clean, either one is a defensible choice. ARIMA(1,1,1) remains the better choice here because auto.arima() independently landed on it too, and because it is one parameter simpler for the same practical result. When the numbers are this close, prefer the simpler model.

=== step === concept
## References

- Box, G. E. P., Jenkins, G. M., Reinsel, G. C., & Ljung, G. M. (2015). [Time Series Analysis: Forecasting and Control](https://doi.org/10.1002/9781118619193) (5th ed.). Wiley.
- Hyndman, R. J., & Athanasopoulos, G. (2021). [Forecasting: Principles and Practice](https://otexts.com/fpp3/) (3rd ed.), Chapter 9: ARIMA models. OTexts.
- Dickey, D. A., & Fuller, W. A. (1979). [Distribution of the Estimators for Autoregressive Time Series with a Unit Root](https://doi.org/10.1080/01621459.1979.10482531). Journal of the American Statistical Association, 74(366), 427-431.
- Kwiatkowski, D., Phillips, P. C. B., Schmidt, P., & Shin, Y. (1992). [Testing the Null Hypothesis of Stationarity against the Alternative of a Unit Root](https://doi.org/10.1016/0304-4076(92)90104-Y). Journal of Econometrics, 54(1-3), 159-178.
- Hyndman, R. J., & Khandakar, Y. (2008). [Automatic Time Series Forecasting: The forecast Package for R](https://doi.org/10.18637/jss.v027.i03). Journal of Statistical Software, 27(3), 1-22.

=== step === complete
## You can now choose an ARIMA order end to end

::prose-only the recap restates numbers already shown in earlier steps; no new computation

Run back through what just happened, this time all the way through in order.

Bellwood's raw order counts failed both ADF and KPSS in the direction that means non-stationary, so you differenced once: d = 1. The PACF and ACF of that differenced series each showed one clean spike and one marginal one, with no crisp single cutoff in either plot, so you shortlisted three candidates: AR(1), MA(1), and ARMA(1,1). Fitting all three and comparing by AICc picked ARIMA(1,1,1) as the winner, at 499.42 against 503.40 and 504.21, a call auto.arima() reached independently. A Ljung-Box test on its residuals came back at p = 0.312, confirming nothing useful was left over.

That is the whole routine: difference until the series is stationary, read the ACF and PACF for a shortlist, fit the candidates and score them with a penalized measure of fit, then confirm the winner's residuals are clean. Run it on any new series and you are choosing an order, not guessing one.
