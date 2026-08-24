---
title: "Autocorrelation in residuals: how to test and fix it"
slug: "Regression-Health-Mini-2"
description: "Autocorrelated residuals leave your coefficients alone and quietly eat your standard errors. Test for them with Durbin-Watson, then repair the inference."
keywords: "autocorrelation in residuals, durbin watson test in r, breusch-godfrey test, serial correlation, newey-west standard errors, hac standard errors, regression diagnostics in r"
mathjax: true
webr: true
date: "2026-08-24"
post_type: "LESSON"
course_id: "regression-health-check"
course_title: "Regression Health Check"
course_lesson: "2"
course_total: "5"
course_landing: "/dashboard.html"
course_prev: "Regression-Health-Mini-1"
course_next: ""
curriculum_id: "0.0.19"
lesson_access: "windowed"
catalog_blurb: "How to spot correlated errors in time-ordered data and repair the inference."
---

=== step === cover
::eyebrow Regression Health Check
## Autocorrelation in residuals: how to test and fix it

Let's say you have ten years of monthly sales from one store, and the owner keeps asking you the same question. Does the advertising actually do anything?

So you fit a regression: sales this month against the ad budget this month, with the number of promotion days in as a control. The output comes back looking healthy. Every extra thousand of ad budget buys about half a unit of sales, the p-value on that coefficient is 0.0019, and the model accounts for 76% of the month-to-month movement in sales.

You would take that into a meeting without thinking twice.

Then you plot the model's errors in the order the months actually happened, and something is off. The errors do not scatter around zero the way errors are supposed to. They travel. There is a stretch of thirty-one months in a row where the model sits on the same side of the truth the whole way, never once crossing back.

That happens because months lean on each other. If demand ran soft in November it is probably still soft in December, so a model that overshoots in one month overshoots again in the next.

That pattern has a name, autocorrelation, and it does its damage in an odd place. The coefficient does not move. The fit does not move. What it eats is the standard error, the one number nobody was watching, and a standard error that is too small gives you a t-value that is too big and a p-value that flatters you.

So we are going to catch it, measure it and repair it, and there are only three moves involved.

::widget process-flow {"steps":[{"title":"See the runs","sub":"plot the errors in month order, watch them travel"},{"title":"Measure them","sub":"Durbin-Watson for lag 1, Breusch-Godfrey for the rest"},{"title":"Repair the standard errors","sub":"Newey-West keeps the coefficients, fixes the errors"}]}

By the end, that p-value of 0.0019 will read 0.11, the coefficient will not have moved by a hair, and you will know exactly which of the two to believe.

=== step === concept
## Ten years of monthly sales, built so ad spend does nothing

Let's get the data on the table first, because everything we do from here reads off it.

We are going to build the store ourselves instead of downloading one, and that is the whole point. When you build the data you know the truth, and here the truth is blunt: ad spend has exactly zero effect on sales. It never enters the sales calculation at all. So any evidence the regression finds for it is a false alarm, and we get to watch that false alarm being manufactured.

We record three things each month, for 120 months:

- `sales`, the units the store sold that month.
- `ad_spend`, the ad budget for that month, in thousands.
- `promo_days`, the number of days that month that ran a promotion.

Two of those really do move sales. Each promotion day adds 8 units, and November and December add another 20 on top, because people buy at Christmas. Ad spend adds nothing.

Under all of it sits demand, which is the part of a month's sales that no column explains. Demand does not start fresh every month. It keeps 93% of where it was last month and adds a small new shock, which is how a real market behaves: a slow season stays slow for a while, then turns.

Press Run.

```r
# Build ten years of monthly sales for one store, with ad spend that does nothing
set.seed(1880)
n_months      <- 120
month         <- 1:n_months
month_in_year <- ((month - 1) %% 12) + 1

# The ad budget drifts slowly around 60: each month is mostly last month
ad_noise <- rnorm(n_months, sd = 3)
ad_spend <- numeric(n_months)
ad_spend[1] <- ad_noise[1] / sqrt(1 - 0.96^2)
for (t in 2:n_months) ad_spend[t] <- 0.96 * ad_spend[t - 1] + ad_noise[t]
ad_spend <- 60 + ad_spend

# Promotion days are drawn fresh each month, so they carry no memory
promo_days <- sample(0:12, n_months, replace = TRUE)

# Demand keeps 93% of last month and adds a fresh shock
shock  <- rnorm(n_months, sd = 5.5)
demand <- numeric(n_months)
demand[1] <- shock[1] / sqrt(1 - 0.93^2)
for (t in 2:n_months) demand[t] <- 0.93 * demand[t - 1] + shock[t]

# Sales: a base, 8 units per promotion day, a Christmas lift, and demand
holiday <- ifelse(month_in_year %in% c(11, 12), 20, 0)
sales   <- 380 + 8 * promo_days + holiday + demand

store <- data.frame(month, sales = round(sales, 1),
                    ad_spend = round(ad_spend, 1), promo_days)
head(store)
#>   month sales ad_spend promo_days
#> 1     1 363.9     64.2          0
#> 2     2 432.0     63.5          9
#> 3     3 430.0     63.0          8
#> 4     4 438.5     67.2          9
#> 5     5 364.7     64.2          0
#> 6     6 416.8     66.2          6
```

Look at the ad budget column for a second. 64.2, then 63.5, then 63.0, then 67.2. It hardly moves, because budgets get set once and then nudged, not redrawn from scratch every month. Hold on to that, because a column that drifts slowly turns out to be dangerous company for errors that also drift slowly.

[NOTE]
The Christmas lift is real, and it is deliberately left out of the model we are about to fit. That is not cheating, it is normal. You almost never have a column for every driver, and the drivers you do not have go into the errors.

=== step === concept
## What the regression says about ad spend

Now let's fit the obvious model, which is sales explained by ad spend, controlling for promotion days.

```r
# Fit the obvious regression and read what it says about ad spend
model <- lm(sales ~ ad_spend + promo_days, data = store)
summary(model)
#>
#> Call:
#> lm(formula = sales ~ ad_spend + promo_days, data = store)
#>
#> Residuals:
#>     Min      1Q  Median      3Q     Max
#> -37.209 -11.454  -1.066  10.352  50.143
#>
#> Coefficients:
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept) 349.4807     9.9770  35.029  < 2e-16 ***
#> ad_spend      0.5039     0.1585   3.179  0.00189 **
#> promo_days    8.1265     0.4254  19.104  < 2e-16 ***
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
#>
#> Residual standard error: 17.13 on 117 degrees of freedom
#> Multiple R-squared:  0.7577,	Adjusted R-squared:  0.7536
#> F-statistic:   183 on 2 and 117 DF,  p-value: < 2.2e-16
```

Read the `ad_spend` row across. The estimate is 0.5039, so every extra thousand of budget is worth about half a unit of sales. The standard error is 0.1585, which makes the t-value 3.18, which makes the p-value 0.00189, and R prints two stars beside it. The model explains 76% of the variation in sales.

`promo_days` comes in at 8.13, almost exactly the 8 we built in, so the model got that one right.

Nothing in this output looks broken. There is no warning, no complaint, no flag. If you stopped here you would tell the owner that advertising works and that the evidence is strong.

We built this store ourselves, so we know that sentence is false. The question worth asking is how this output managed to hide it.

=== step === concept
## The residuals plotted in month order

A residual is what the model got wrong for one month: the sales that actually happened, minus the sales the model predicted. One number per month, 120 of them, and `resid()` hands them over.

The usual diagnostic plots put residuals against fitted values. That is the wrong axis for time-ordered data. Sort them by month instead and look at the shape.

```r
# Plot the residuals in month order and count how long they stay on one side of zero
res <- resid(model)

plot(month, res, type = "b", pch = 16, cex = 0.6, col = "grey30",
     xlab = "Month", ylab = "Residual (units)",
     main = "Residuals in the order the months happened")
abline(h = 0, col = "red", lwd = 2)

max(rle(sign(res))$lengths)     # longest stretch on one side of zero
#> [1] 31

sum(diff(sign(res)) != 0)       # how often the sign flips, out of 119 chances
#> [1] 25
```

That is not a cloud. That is a wave.

The first thirty-one months sit below the line without a single crossing, which means the model over-predicted sales every month for two and a half years straight. Later there is a run of twenty-four months on the other side.

The two counts underneath make it concrete. Across 119 neighbouring pairs the residual changed sign 25 times. If the errors were independent, each sign would be a fresh coin toss and you would expect about sixty changes. We got fewer than half that.

So the errors are not independent. Knowing this month's error tells you something real about next month's, and independence is the assumption OLS relies on and never checks for you.

[KEY INSIGHT]
Autocorrelated errors are not big errors. They are predictable errors. The model is not wrong by more than it should be, it is wrong in the same direction for months at a time.

=== step === concept
## Each residual against the one before it

The wave is convincing to the eye. Let's turn it into a number.

Take the residual series and pair each month with the month before it. Month 2 pairs with month 1, month 3 pairs with month 2, all the way along. That gives 119 pairs, and if the errors really were independent those pairs would form a shapeless blob.

```r
# Pair every residual with the residual from the month before
n        <- length(res)
previous <- res[-n]     # months 1 to 119
current  <- res[-1]     # months 2 to 120

plot(previous, current, pch = 16, col = "grey30",
     xlab = "Residual last month", ylab = "Residual this month",
     main = "Each residual against the one before it")
abline(lm(current ~ previous), col = "red", lwd = 2)

round(cor(previous, current), 3)
#> [1] 0.828
```

The cloud climbs. A big positive error last month goes with a big positive error this month, and the correlation between the two columns is 0.828.

That number has a name. It is the **lag-1 autocorrelation** of the residuals, which is the plain correlation between the series and itself shifted along by one step. The gap you shift by is the **lag**, so lag 1 means one month apart and lag 12 means a year apart. You will also hear the whole phenomenon called **serial correlation**, which means the same thing.

0.828 is not a hint. Correlation runs from -1 to 1, and an error series that correlates at 0.83 with itself one month later is about as dependent as data gets.

=== step === concept
## How to read every lag at once with an ACF plot

Lag 1 is one question out of many. There is no reason the memory should stop after a single month, and with monthly data there is an obvious second suspect: the same month a year ago.

Rather than compute a correlation at each lag by hand, `acf()` does the whole set at once and draws them as a row of bars. The name is short for autocorrelation function, which is the phrase for exactly that row: the correlation of a series with itself, read at every lag. Bar height is the correlation at that lag. The dashed lines mark the band inside which a bar is small enough to be luck.

```r
# Compute the residual correlation at every lag, with the independence band
a <- acf(res, main = "ACF of the residuals")

round(a$acf[c(2, 11, 12, 13)], 3)     # lags 1, 10, 11 and 12
#> [1] 0.814 0.360 0.482 0.568

round(1.96 / sqrt(length(res)), 3)    # half-width of the dashed band
#> [1] 0.179
```

There are two things going on in that picture.

First is the decay. The bar at lag 1 stands at 0.814, and instead of dropping to nothing it fades slowly across the next several lags. That is the demand cycle we built: memory that leaks away over months rather than ending at the next one.

If 0.814 looks a shade off the 0.828 `cor()` gave a moment ago, it is the same quantity measured two ways. `acf()` centres every lag on the mean and the spread of the whole series, where `cor()` treated the two shifted columns as separate variables with means of their own. The gap is small and it stays small. Read them as one number.

Second, and more interesting, is the bounce. The bars sink to 0.360 by lag 10, then climb back to 0.482 at lag 11 and 0.568 at lag 12. Twelve months apart, the errors resemble each other again. That is the Christmas lift, the driver we left out of the model, showing up in the errors on exactly the schedule you would expect.

Every one of those bars sits far outside the 0.179 band, so none of it is luck.

[NOTE]
An ACF is where you find out what kind of memory you have. Slow decay means each month leans on the last one. A spike at a seasonal lag means an annual pattern the model has not been told about. Here you have both.

=== step === quiz
## Quick check: what do the runs and the ACF bars tell you?

The residuals ran thirty-one months on one side of zero, and the ACF bars sit well outside the band at every lag from 1 to 12. What have you learned about the errors?

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- The model is biased, so its coefficients are pointing at the wrong values. ::no
- The residuals are simply too large, which is what a weak model looks like. ::no
- Part of each error is predictable from the errors before it, so the errors carry structure the model has not used. ::ok Exactly. That is the whole content of the runs and the bars. The errors are not larger than they should be, they are more knowable than they should be.
- One unusual month is dragging the residuals off centre. ::no A single odd month makes one big residual, not thirty-one in a row and not a wall of ACF bars outside the band. Nothing here says the errors are too big or the coefficients are off target either. What the pattern says is narrower and stranger: each error is partly forecastable from the ones before it.

=== step === widget
## What autocorrelation costs, and where the damage lands

So the errors have memory. Why should that cost you anything?

Because a standard error is built on a headcount. When OLS works out the uncertainty in a coefficient it assumes each of your 120 rows is a fresh, independent piece of evidence. If each month's error correlates at 0.83 with the error before it, then most of what a row tells you was already told to you by its neighbour, and 120 rows are not worth 120 rows. OLS never notices. It divides by too big a number and hands back an interval that is far too narrow.

The dial below sets our store aside for a moment and runs a smaller experiment instead: sixty time-ordered observations with a straight trend running through them, fitted two thousand times over at every setting of the dial, with the true slope known every time.

Two numbers come back. **Coverage** is the share of those studies whose 95% interval for the slope actually contained that true value, so an interval that works should score 95. **Fit** is R-squared, the number you actually look at in a summary.

Start at the left, where the errors are independent, then drag the dial to the right.

::widget assumption-dial {"assumption": "autocorrelation", "start": 0}

Watch which number moves.

Coverage falls off a cliff. It leaves 95 and keeps going, down to roughly a third by the time the dial reaches the far end, which means that under severe autocorrelation about two out of every three 95% intervals you publish do not contain the truth.

Now watch the fit statistic. It does not fall. It climbs a little, because a smooth error series hugs the fitted line more tidily than a jumpy one does.

That is the trap in one picture. The number you check gets better while the number you rely on collapses.

=== step === quiz
## Quick check: what does autocorrelation break?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The coefficient estimates, which drift away from the true values. ::no
- The standard errors, and with them the t-values, p-values and confidence intervals. ::ok Right. OLS stays unbiased under autocorrelation, so the estimates are still aimed at the truth. It is the uncertainty around them that gets computed as though you had far more independent information than you really do.
- The fitted values, which stop tracking the actual sales. ::no
- Nothing worth acting on, as long as R-squared is respectable. ::no Estimates, fitted values and R-squared all survive autocorrelation, and R-squared can even improve, which is exactly why it makes such a poor alarm. The casualty is the uncertainty: standard errors, and everything computed from them.

=== step === concept
## The Durbin-Watson statistic, worked out by hand

Time to measure this properly, and the classic measurement is the Durbin-Watson statistic. It compresses lag-1 dependence into a single number, and it is small enough to build yourself, so let's build it.

The idea is to compare each residual with its neighbour. Take the gap between neighbouring residuals, square it, add up all 119 of them, and divide by the sum of the squared residuals themselves.

\[ d = \frac{\sum_{t=2}^{n} (e_t - e_{t-1})^2}{\sum_{t=1}^{n} e_t^2} \]

where \(e_t\) is the residual for month \(t\) and \(n\) is the number of months.

Read the top line as a measure of how far the errors move from month to month, and the bottom line as a measure of how large they are overall. So \(d\) asks one question: relative to their size, how far do these residuals travel between neighbours?

In R that is two sums.

```r
# Build the Durbin-Watson statistic from its own two parts
numerator   <- sum(diff(res)^2)     # squared gaps between neighbouring residuals
denominator <- sum(res^2)           # squared residuals

c(numerator = numerator, denominator = denominator)
#>   numerator denominator
#>    11678.84    34348.19

numerator / denominator
#> [1] 0.3400131
```

So \(d\) is 0.34. Now let's look at the scale it lives on.

If the residuals were independent, every gap would be a full fresh jump, and the arithmetic works out so that \(d\) lands near 2. If neighbours are nearly identical the gaps are tiny, the top line shrinks toward nothing, and \(d\) falls toward 0. If they alternate, flipping sign every month, the gaps are enormous and \(d\) rises toward 4.

- **near 0**: strong positive autocorrelation, the errors travel in runs.
- **near 2**: no autocorrelation, which is what you want.
- **near 4**: strong negative autocorrelation, the errors zigzag.

There is a shortcut that ties this straight back to the correlation you already computed. For any decent-sized sample, \(d \approx 2(1 - \rho)\), where \(\rho\) is the lag-1 correlation of the residuals.

```r
# Check the statistic against the rule of thumb, two times one minus the correlation
2 * (1 - cor(res[-n], res[-1]))
#> [1] 0.3449499
```

0.3449 against the 0.3400 we computed the long way. The rule of thumb is not the definition, but it is close enough to carry in your head: halve \(d\), subtract from 1, and you have the correlation. A \(d\) of 0.34 is telling you that neighbouring residuals correlate at about 0.83, which is exactly what we saw.

=== step === concept
## Running the test with dwtest()

A statistic on its own does not tell you whether 0.34 is surprising. For that you need its distribution under the null hypothesis of independent errors, and `dwtest()` from the `lmtest` package has it.

Hand it the fitted model, not the residuals.

One thing to settle before you run it. The test reads the residuals in the order the rows sit in the data frame, and it never looks at your date column to check. If the rows are not already in time order, put them in time order before you fit, or every test on this page is reading a shuffled series.

```r
# Run the Durbin-Watson test on the fitted model
suppressMessages(library(lmtest))

dwtest(model)
#>
#> 	Durbin-Watson test
#>
#> data:  model
#> DW = 0.34001, p-value < 2.2e-16
#> alternative hypothesis: true autocorrelation is greater than 0
```

`DW = 0.34001`, the same number we built by hand, so nothing mysterious happened inside the function.

The p-value is the new part. Read it the way you read any p-value: if the errors really were independent, a statistic this far from 2 would turn up essentially never. `2.2e-16` is R's way of saying the number is smaller than it can usefully print.

The last line matters too. By default `dwtest()` tests only for positive autocorrelation, which is the direction that shows up in almost all business and economic data, because runs are far more common than zigzags. If you have reason to suspect alternating errors, ask for both directions with `alternative = "two.sided"`.

[TIP]
A rejected Durbin-Watson test is not a verdict on your model's usefulness. The coefficients may still be exactly the ones you want. What has been rejected is the arithmetic behind the standard errors sitting next to them.

=== step === tryit
## Your turn: what does d become when the months are shuffled?

Here is a way to prove to yourself what \(d\) is actually measuring.

Keep the residuals exactly as they are, every value identical, and scramble only the order they sit in. Nothing about their size changes. Their sum of squares is untouched. The only thing you take away is the month order, which is the thing that carried the memory.

Shuffle `res` and rebuild \(d\) from the same two sums.

```r
# Shuffle the residuals out of month order, then rebuild the statistic
# res holds the 120 residuals.
# Use set.seed(4) first so your number matches mine.
# Two lines after the seed. Press Check when you have them.
```
::check {"regex": "sample[(]res[)][\\s\\S]*diff[(]", "gate": true, "difficulty": "beginner", "ok": "There it is: 1.92, right up against the 2 that means no correlation at all. Same numbers, same spread, same sum of squares. The only thing you removed was the order, and the order was the whole of what d was measuring.", "no": "Two lines after set.seed(4). First shuffled <- sample(res), then sum(diff(shuffled)^2) divided by sum(shuffled^2)."}
::solution
```r
# Rebuild the Durbin-Watson statistic after destroying the month order
set.seed(4)
shuffled <- sample(res)

sum(diff(shuffled)^2) / sum(shuffled^2)
#> [1] 1.918227
```

This is worth saying out loud, because it is easy to file Durbin-Watson under general residual health and move on. It is not a measure of how big your errors are, or how skewed, or how variable. It reads the sequence and nothing else. Give it the same errors in a different order and you get a different answer.

=== step === concept
## Where Durbin-Watson fails, and what Breusch-Godfrey adds

Durbin-Watson has two real limits, and both of them bite in practice.

The first is that it only ever looks one step back. Our ACF had a bounce at lag 12 that Durbin-Watson cannot see at all, because it is built entirely out of neighbouring pairs. Yearly structure is invisible to it.

The second is worse. If your model has the outcome's own past on the right-hand side, say last month's sales used as a predictor of this month's, then \(d\) is biased toward 2. It reports independence whether or not the errors are independent, so what you get is a false clean bill of health rather than a missing one.

The Breusch-Godfrey test fixes both. Its logic is direct: if the residuals still hold predictable structure, you should be able to predict them from their own past. So it regresses the residuals on their own lags plus the original predictors, and tests whether those lag coefficients are jointly zero. That joint test is a Lagrange multiplier test, which is where the `LM` in the output comes from.

Ask for one lag and you get the same question Durbin-Watson asked.

```r
# Test the same lag-1 idea with Breusch-Godfrey
bgtest(model, order = 1)
#>
#> 	Breusch-Godfrey test for serial correlation of order up to 1
#>
#> data:  model
#> LM test = 81.912, df = 1, p-value < 2.2e-16
```

The LM statistic comes in at 81.9 on one degree of freedom, with a p-value below anything R will print. Same verdict, reached by a different route.

The difference is what happens next. Durbin-Watson has now said everything it can say. Breusch-Godfrey takes an `order` argument, so you can ask it about a quarter, or a year, or anything else you suspect, and it stays honest when a lagged outcome is sitting in the model.

=== step === concept
## How to choose the lag order for Breusch-Godfrey

The `order` argument is the one decision the test asks you to make, and it is a genuine trade-off. Too few lags and you miss structure that is really there. Too many and you spend degrees of freedom on lags that hold nothing, which costs you power.

Three rules cover nearly every case:

1. **Match the season.** Monthly data goes to 12, quarterly to 4, weekly to 52. If there is an annual rhythm, this is the order that finds it.
2. **Follow the ACF.** Bars that poke outside the band tell you where the memory lives. Ours pointed at the early lags and again at 12.
3. **Fall back on a rule of thumb.** With no domain knowledge, `min(10, n / 4)` is the standard default. With 120 months that gives 10.

Let's run the three interesting orders on our model and set them side by side: one month, one quarter, one year.

```r
# Compare the Breusch-Godfrey verdict at one month, one quarter and one year of lags
orders <- c(1, 4, 12)
tests  <- lapply(orders, function(k) bgtest(model, order = k))

data.frame(
  order   = orders,
  LM      = round(sapply(tests, function(x) unname(x$statistic)), 2),
  p_value = signif(sapply(tests, function(x) x$p.value), 3)
)
#>   order    LM  p_value
#> 1     1 81.91 1.42e-19
#> 2     4 87.51 4.46e-18
#> 3    12 96.87 2.28e-15
```

The statistic climbs as you add lags, 81.91 to 87.51 to 96.87, because there really is more structure out there for the extra lags to find. The p-values rise a little at the same time, which is the price of the extra degrees of freedom, and here it changes nothing. Every order rejects, comfortably.

That is the usual outcome and it is worth expecting. Order selection tends to decide how much detail you learn about the shape of the memory, not whether you conclude there is memory.

=== step === quiz
## Quick check: which test does this model need?

You are modelling monthly signups for a subscription product. Last month's signups are one of your predictors, and you also suspect the business has a yearly rhythm.

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- Durbin-Watson, since it is the standard test for serial correlation. ::no
- Durbin-Watson, but read against a lag of 12 because the data is monthly. ::no
- Breusch-Godfrey with order 12. ::ok Both reasons point the same way. A lagged outcome on the right-hand side biases Durbin-Watson toward 2, and an annual rhythm lives at lag 12, which Durbin-Watson never looks at.
- Neither, because a lagged outcome absorbs the autocorrelation already. ::no Two separate things rule Durbin-Watson out here. It cannot be trusted at all when the outcome's own past is a predictor, and it only ever inspects lag 1, so a yearly pattern is invisible to it. A lagged predictor is a reason to test more carefully, never a reason to skip testing.

=== step === concept
## The repair: Newey-West standard errors

You have a diagnosis. Now for the fix, and the first one to reach for is almost always Newey-West.

The name for this family is HAC, short for heteroskedasticity and autocorrelation consistent. The idea is small and precise. It does not touch your model, your coefficients or your predictions. It replaces the formula OLS uses for the uncertainty around those coefficients with one that allows nearby observations to carry the same information, instead of insisting they are independent.

`NeweyWest()` from `sandwich` builds the corrected covariance matrix, and `coeftest()` prints a fresh coefficient table using it. Setting `prewhite = FALSE` switches off an extra filtering step so you see the plain estimator.

Here are the two tables together, the naive one and the repaired one.

```r
# Rebuild the standard errors so they allow for the memory in the residuals
suppressMessages(library(sandwich))

round(summary(model)$coefficients, 4)      # the naive OLS table
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept) 349.4807     9.9770 35.0287   0.0000
#> ad_spend      0.5039     0.1585  3.1793   0.0019
#> promo_days    8.1265     0.4254 19.1038   0.0000

coeftest(model, vcov = NeweyWest(model, prewhite = FALSE))
#>
#> t test of coefficients:
#>
#>              Estimate Std. Error t value Pr(>|t|)
#> (Intercept) 349.48069   21.15500  16.520   <2e-16 ***
#> ad_spend      0.50387    0.31007   1.625   0.1069
#> promo_days    8.12648    0.31778  25.573   <2e-16 ***
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
```

Look at the Estimate column in both tables. 0.5039 against 0.50387, and 8.1265 against 8.12648. Not one coefficient moved.

Now look at the `ad_spend` row. The standard error went from 0.1585 to 0.31007, which is roughly double. The t-value fell from 3.18 to 1.63. And the p-value went from 0.0019 to 0.1069, which is on the wrong side of every threshold anybody uses. The stars are gone.

That is the honest reading of the evidence for advertising in this store, and we know it is honest, because we built the store with ad spend having no effect whatsoever.

Doubling a standard error means quadrupling a variance, which is the headcount problem finally showing its arithmetic. Those 120 months were carrying about thirty months' worth of independent information about ad spend, and OLS charged full price for all 120.

Then look at `promo_days`, which went the other way. Its standard error came down, from 0.4254 to 0.31778, and its t-value rose to 25.6. Promotion days are drawn fresh every month with no memory in them, so there is nothing there for the correction to inflate. A HAC standard error is an estimate, not a penalty, and it moves in whichever direction the data actually calls for.

[KEY INSIGHT]
Newey-West keeps every coefficient exactly where OLS left it and rebuilds only the uncertainty around it. A real effect stays significant. What disappears is the significance you never earned.

=== step === concept
## What Newey-West fixes, and the three deeper repairs

It is worth being exact about what you have and have not repaired.

You have a correct standard error. You do not have a better model. The fitted values are unchanged, the predictions are unchanged, and the residuals still carry every bit of the pattern they carried before. HAC does not remove the autocorrelation, it stops you being misled by it.

Often that is all you need, because the question was inference: is this coefficient real, and how wide is the range around it? But if the question is forecasting, or if the autocorrelation is pointing at something you could model directly, then you want one of the deeper repairs.

| What you do | What it changes | When to reach for it |
|---|---|---|
| Newey-West (HAC) standard errors | standard errors, t-values, p-values, intervals | you want honest inference from the model you already have |
| Add lagged or seasonal terms to the model | coefficients, fitted values and residuals | the pattern is pointing at a driver you left out |
| Generalised least squares with an AR(1) correlation structure | coefficients and standard errors together | you want one estimator that builds the memory in |
| Regression with ARIMA errors | coefficients, and gives you forecasts | you need to predict the series, not just describe it |

Our store makes the second row concrete. The residuals bounced at lag 12 because November and December were left out of the model. Put a month indicator in and that bounce has somewhere to live other than the errors.

[TIP]
Reach for HAC when you want to report. Model the dynamics when you want to predict. Doing both is normal, and neither one makes the other redundant.

=== step === tryit
## Your turn: which of the two intervals contains zero?

P-values are one way to say this. Confidence intervals are the clearer way, because they show you the whole range of true values the data is compatible with.

Build both 95% intervals for the `ad_spend` coefficient. `confint()` gives you the naive OLS one. `coefci()` from `lmtest` takes the same `vcov =` argument that `coeftest()` took, so it gives you the HAC one. Ask each for the `ad_spend` row only.

Then answer the question that decides the meeting: which interval contains zero?

```r
# Compare the naive and the HAC interval for ad_spend
# model is fitted, and sandwich and lmtest are both loaded.
# Two lines. Press Check when you have them.
```
::check {"regex": "coefci[(]\\s*model", "gate": true, "difficulty": "intermediate", "ok": "That is the whole thing in two lines. The naive interval runs 0.190 to 0.818, so zero is nowhere near it. The HAC interval runs -0.110 to 1.118, and zero sits comfortably inside. Same data, same coefficient, opposite conclusion, and we know the second one is right because we built this store so that ad spend does nothing.", "no": "Two lines. Take the ad_spend row of confint(model) for the naive interval, then the ad_spend row of coefci(model, vcov = NeweyWest(model, prewhite = FALSE)) for the HAC one."}
::solution
```r
# Put the naive and the HAC 95% interval for ad spend side by side
round(confint(model)["ad_spend", ], 3)
#>  2.5 % 97.5 %
#>  0.190  0.818

round(coefci(model, vcov = NeweyWest(model, prewhite = FALSE))["ad_spend", ], 3)
#>  2.5 % 97.5 %
#> -0.110  1.118
```

Notice how much wider the second interval is. That width is not the correction being pessimistic. It is what 120 months of correlated data was always worth, finally written down.

=== step === quiz
## Quick check: a Durbin-Watson of 1.98 on a model with a lagged sales term

A colleague fits `sales ~ ad_spend + lag_sales`, where `lag_sales` is last month's sales. The Durbin-Watson test returns d = 1.98 and they tell you the residuals are clean. What should you say?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Agree with them. 1.98 is as close to 2 as anyone could ask for. ::no
- Very little follows from it. A lagged outcome in the model pulls d toward 2 whether or not the errors are correlated, so run Breusch-Godfrey before believing anything. ::ok Yes, and this is the failure mode that matters most, because it is silent. A biased statistic does not warn you. It just reports the answer you were hoping for.
- The residuals show mild negative autocorrelation, since d sits a shade under 2. ::no
- The model is misspecified, because d should land exactly on 2 when the errors are independent. ::no A d near 2 is what independence looks like, and no statistic lands exactly on its expected value. The real problem is that this particular d cannot be read at all here: with the outcome's own past as a predictor, Durbin-Watson is biased toward 2 and will report clean residuals whether or not they are.

=== step === quiz
## Quick check: what did the Newey-West column change?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Both the estimates and the standard errors moved. ::no
- Only the standard errors, and the t-values, p-values and intervals that come from them. The estimates were identical to four decimal places. ::ok Right, and one of the standard errors went down rather than up. Promotion days had no memory to correct for, so its error shrank and its t-value rose to 25.6.
- Only the p-values. The standard errors were untouched. ::no
- Everything, including the fitted values and R-squared. ::no The correction never touches the model. Coefficients, fitted values and R-squared come out identical, which is the point of it: you keep the model you fitted, and only the uncertainty statement is rebuilt. And the change is not always upward.

=== step === concept
## References

- [Testing for Serial Correlation in Least Squares Regression I](https://doi.org/10.1093/biomet/37.3-4.409) - Durbin and Watson (1950), Biometrika 37(3-4), 409-428. The paper the statistic comes from.
- [Testing for Autocorrelation in Dynamic Linear Models](https://doi.org/10.1111/j.1467-8454.1978.tb00635.x) - Breusch (1978), Australian Economic Papers 17(31), 334-355.
- [Testing Against General Autoregressive and Moving Average Error Models When the Regressors Include Lagged Dependent Variables](https://doi.org/10.2307/1913829) - Godfrey (1978), Econometrica 46(6), 1293-1301. The lagged-outcome case, in full.
- [A Simple, Positive Semi-Definite, Heteroskedasticity and Autocorrelation Consistent Covariance Matrix](https://doi.org/10.2307/1913610) - Newey and West (1987), Econometrica 55(3), 703-708.
- [Econometric Computing with HC and HAC Covariance Matrix Estimators](https://doi.org/10.18637/jss.v011.i10) - Zeileis (2004), Journal of Statistical Software 11(10). The implementation behind `sandwich`.

=== step === complete
## Quick recap

You took a regression that looked healthy and found the one thing wrong with it that no line of `summary()` output would ever have told you.

- **The pattern.** Residuals plotted in month order travelled instead of scattering: thirty-one months on one side of zero, and only 25 sign changes where independence would give about sixty. Paired with their own neighbours they correlated at 0.828.
- **The damage.** Autocorrelation leaves coefficients, fitted values and R-squared alone. It eats the standard error, because OLS counts 120 correlated months as 120 independent facts.
- **The two tests.** Durbin-Watson compresses lag-1 dependence into one number on a 0 to 4 scale, and you built it by hand: 0.34. Breusch-Godfrey tests any set of lags jointly and survives a lagged outcome on the right-hand side, which Durbin-Watson does not.
- **The repair.** Newey-West standard errors keep every coefficient and rebuild the uncertainty. Ad spend went from a standard error of 0.16 to 0.31, and from p = 0.0019 to p = 0.11.

And the sentence you would say about advertising in that meeting now:

"Ad spend comes out at half a unit per thousand, but once the standard errors allow for the fact that months are not independent, the 95% interval runs from -0.11 to 1.12. Zero is well inside it. We cannot say from this data that the advertising is doing anything."

Which is exactly right, because it never was.
