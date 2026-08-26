---
title: "Cointegration: test when two series move together"
slug: "TS-Toolkit-Mini-1"
description: "Two trending series can look strongly related and share nothing. Watch a spurious regression happen, then run the Engle-Granger test in R to tell them apart."
keywords: "cointegration in R, Engle-Granger test, spurious regression, unit root test, ADF test in R, cointegration critical values, long-run equilibrium, residual based test"
mathjax: true
webr: true
date: "2026-08-27"
post_type: "LESSON"
course_id: "time-series-toolkit"
course_title: "The Time Series Toolkit"
course_lesson: "1"
course_total: "10"
course_landing: "/dashboard.html"
course_prev: ""
course_next: ""
curriculum_id: "0.0.48"
lesson_access: "windowed"
catalog_blurb: "Tell a real long-run relationship between two trending series from a fake one."
---

=== step === cover
::eyebrow The Time Series Toolkit
## Cointegration: test when two series move together

Consider this. Petrol prices and crude oil prices both wander for years. Neither one comes back to a fixed level, and if you asked either one where it belongs, there is no answer.

Yet the gap between them stays roughly steady. They drift, but they drift together.

That togetherness has a name. It is called cointegration, and it is the honest way to talk about a long-run relationship between two series that never sit still.

Now, why does it matter? Because of what happens when you skip the check. Regress one trending series on another without asking this question first and you get a result that looks wonderful and means nothing. High R-squared, tiny p-values, three stars beside the coefficient, and no real relationship at all.

So we are going to do two things. First, we make a spurious regression happen in front of you, on purpose, so you know what it looks like when it turns up in your own work. Then we run the test that tells a real long-run relationship from a fake one. It is called the Engle-Granger two-step, and it is two lines of R once you know what you are looking at.

There are only three moves involved.

::widget process-flow {"steps":[{"title":"Check that both series wander","sub":"neither price has a level it returns to"},{"title":"Fit the long-run line","sub":"regress petrol on crude and keep the leftover gap"},{"title":"Test the leftover gap","sub":"if it keeps coming home to zero, the link is real"}]}

The coefficients are not what you read here. The leftover gap is. Everything from here is about building that gap and reading it right.

=== step === concept
## Prices that never come home: the random walk

Let's build the crude oil price first, because everything else here hangs off it.

We will make twenty years of monthly prices, which is 240 months. Each month the price is last month's price plus a fresh shock: a small upward pull of about 5 cents, plus random noise of a dollar or so either way. `cumsum()` does the accumulating, adding up all the shocks so far.

Press Run.

```r
# Build twenty years of monthly crude oil prices as a random walk
set.seed(19)
crude <- 70 + cumsum(rnorm(240, mean = 0.05, sd = 1.2))

plot(crude, type = "l", col = "steelblue", lwd = 2,
     xlab = "Month", ylab = "Crude oil, dollars a barrel",
     main = "Twenty years of monthly crude oil prices")

round(c(month_1 = crude[1], month_120 = crude[120], month_240 = crude[240]), 2)
#>   month_1 month_120 month_240
#>     68.62     85.79     90.38
```

The line starts near 68.62, is up around 85.79 halfway through, and finishes at 90.38. But look at the shape rather than the numbers. It climbs, it slumps, it climbs again, and nothing anywhere pulls it back toward where it started.

A series built this way is called a **random walk**, and the thing that defines it is that it has no home. Written out one month at a time, it looks like this:

\[ y_t = y_{t-1} + \varepsilon_t \]

Here \(y_t\) is this month's price, \(y_{t-1}\) is last month's, and \(\varepsilon_t\) is the fresh shock. Notice what is missing. There is no term anywhere in that line pulling \(y_t\) back toward an average. Every shock that lands becomes part of the new starting point, so shocks are permanent and they pile up forever.

The opposite of that is a **stationary** series: one whose average level and spread stay put over time. A stationary series does have a home, and it keeps returning to it. A random walk is **non-stationary**, and the technical name for what makes it so is a **unit root**: the coefficient on \(y_{t-1}\) is exactly 1, so nothing decays away.

Now the shocks themselves are a different story. Subtract each month from the one before and you get them back.

```r
# Take the month-to-month change in crude and see where it sits
crude_change <- diff(crude)

plot(crude_change, type = "l", col = "darkorange",
     xlab = "Month", ylab = "Change in crude, dollars a barrel",
     main = "The month-to-month change in crude")
abline(h = mean(crude_change), col = "grey30", lwd = 2, lty = 2)

round(c(mean = mean(crude_change), sd = sd(crude_change)), 3)
#>  mean    sd
#> 0.091 1.247
```

That is a completely different picture. The changes bounce around a flat line at 0.091 with a spread of about 1.25, and they cross that line constantly. The changes have a home. The price does not.

[NOTE]
That difference has a shorthand you will meet everywhere in time series work. A series that needs one round of differencing to become stationary is called **integrated of order one**, written I(1). A series that is already stationary is I(0). The crude price is I(1), and its month-to-month change is I(0).

=== step === concept
## Building a petrol price that tracks crude

Now let's build the pump price. In real life it follows crude with a lag and a markup, while refinery margins and taxes push the two apart for months at a time before they come back together.

We are going to build exactly that, because then we know the true answer and can check what the test recovers. The rule is petrol equals 55 plus 0.8 times crude, plus a gap.

The gap is the interesting part. It is not fresh noise each month. It carries over. `arima.sim(list(ar = 0.75), ...)` makes a series where each month's value is 0.75 of last month's plus a new shock, so a wide gap this month is probably still wide next month. And 0.75 is less than 1, so the gap decays. Left alone it shrinks back toward zero.

```r
# Build a petrol price that tracks crude, with a gap that decays back to zero
set.seed(42)
true_gap <- as.numeric(arima.sim(list(ar = 0.75), n = 240, sd = 1.5))
petrol <- 55 + 0.8 * crude + true_gap

plot(petrol, type = "l", col = "firebrick", lwd = 2,
     ylim = range(c(crude, petrol)), xlab = "Month", ylab = "Price",
     main = "Petrol in cents a litre and crude in dollars a barrel")
lines(crude, col = "steelblue", lwd = 2)
legend("topleft", legend = c("petrol, cents a litre", "crude, dollars a barrel"),
       col = c("firebrick", "steelblue"), lwd = 2, bty = "n")

round(c(petrol_month_1 = petrol[1], petrol_month_240 = petrol[240],
        gap_spread = sd(true_gap)), 2)
#>   petrol_month_1 petrol_month_240       gap_spread
#>           106.28           128.38             1.94
```

You get two lines, both wandering, and they wander in step. Petrol goes from 106.28 to 128.38 cents a litre over the twenty years while crude climbs underneath it.

Hold on to those two numbers at the end. The gap has a spread of 1.94 cents. Crude moved through a range many times that size over the same period. So the two prices roamed a long way, and the distance between them barely moved at all.

That is the whole phenomenon, and now we have it in two objects we can test.

=== step === quiz
## Quick check: which of these has a home level?

Three series are now on the table: the crude price, the petrol price, and the month-to-month change in crude. Which one keeps returning to a fixed average?

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- The crude price, because oil prices always come back to fair value eventually. ::no
- The petrol price, because it is built from a fixed rule with a known intercept and slope. ::no
- The month-to-month change in crude, which bounced around a flat line at 0.091 and crossed it constantly. ::ok That is the one. The change is stationary, and the two price levels are not. A fixed rule links petrol to crude, but crude itself wanders, so petrol inherits the wandering.
- All three, because every series has an average you can compute. ::no You can compute an average for any set of numbers, and that is not what stationary means. Stationary means the series keeps coming back to that average. Both price levels climbed away from where they started and never returned. Only the month-to-month change kept crossing its own flat line.

=== step === concept
## Regressing the petrol price on the coffee price

Now, here is where it gets uncomfortable.

Let's bring in a third series that has nothing to do with fuel: the price of coffee, in cents a pound, built from its own separate random draw. No refinery connects them. No market links them. It wanders, and that is its only qualification.

Then we regress the petrol price on it, exactly the way you would regress anything on anything.

```r
# Regress the petrol price on an unrelated coffee price and read the summary
set.seed(1402)
coffee <- 150 + cumsum(rnorm(240, sd = 1.5))

fake_fit <- lm(petrol ~ coffee)
summary(fake_fit)
#>
#> Call:
#> lm(formula = petrol ~ coffee)
#>
#> Residuals:
#>      Min       1Q   Median       3Q      Max
#> -12.7120  -2.8980  -0.1005   3.4454   9.5861
#>
#> Coefficients:
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept) 61.27185    2.50556   24.45   <2e-16 ***
#> coffee       0.34343    0.01351   25.42   <2e-16 ***
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
#>
#> Residual standard error: 4.463 on 238 degrees of freedom
#> Multiple R-squared:  0.7308,	Adjusted R-squared:  0.7297
#> F-statistic: 646.1 on 1 and 238 DF,  p-value: < 2.2e-16
```

Now read that output line by line, the way you would in real work with a deadline on you.

The slope on `coffee` is 0.34343, so every extra cent a pound of coffee comes with a third of a cent a litre on petrol. Its standard error is small, 0.01351. The t-statistic is 25.42, which is enormous. The p-value is below 2e-16, printed as low as R prints anything, and it carries three stars. The R-squared is 0.7308, meaning coffee apparently accounts for 73 percent of the variation in the pump price. The F-statistic is 646.

Every single number in that table says yes.

And it is nonsense. We built coffee from a separate random draw a moment ago. There is nothing there to find. This is a **spurious regression**, and Granger and Newbold gave it that name in 1974 after running into it in simulations.

[WARNING]
Nothing in that output flagged a problem. No warning printed, no diagnostic complained, no assumption was formally declared broken. The regression did its arithmetic correctly and reported the answer to a question you should not have asked.

=== step === concept
## How often does the fake result turn up?

One dramatic result could just be bad luck. We picked a seed, we got a striking pair, and maybe that is all it was.

So let's find out how ordinary this is. The block below builds 500 brand new pairs of wandering series, each pair drawn independently of the other, regresses one on the other, and keeps the p-value on the slope every time.

If the t-test were behaving, roughly 5 percent of those 500 should come out significant at the 5 percent level, because that is what the 5 percent level means.

```r
# Repeat the whole experiment on 500 fresh pairs of unrelated series
set.seed(2)
many_p <- replicate(500, {
  a <- cumsum(rnorm(240))
  b <- cumsum(rnorm(240))
  summary(lm(b ~ a))$coefficients[2, 4]
})

hist(many_p, breaks = 40, col = "grey85", border = "white",
     main = "500 regressions between pairs of unrelated series",
     xlab = "p-value on the slope")
abline(v = 0.05, col = "red", lwd = 3)

sum(many_p < 0.05)
#> [1] 424
mean(many_p < 0.05)
#> [1] 0.848
```

Look at the histogram first. If nothing were wrong, those 500 p-values would spread evenly from 0 to 1, and 0.72 would turn up about as often as 0.02. Instead the whole pile is jammed against the left edge, at the small p-values, and almost all of it sits to the left of the red line at 0.05.

424 out of 500. That is 84.8 percent of pairs with nothing connecting them coming back significant.

So the number to carry out of this is not 5 percent. When you regress one wandering series on another, a significant result is the **default outcome**. It is what usually happens. Finding one tells you almost nothing about whether a relationship exists, because you would have found one anyway.

[KEY INSIGHT]
Between two series that wander, a significant slope is the normal result, not the interesting one. Roughly five times in six you will find a relationship that is not there. This is why the check has to come first, before you read a single coefficient.

=== step === concept
## Why the t-statistic is inflated here

Knowing that it happens is one thing. Knowing why is what makes the rest of the procedure something you understand rather than something you memorise.

Start from what a t-statistic is: the coefficient divided by its standard error. The coefficient is fine. It is the divisor that goes wrong.

The formula for that standard error is built on an assumption about what the regression leaves behind. It assumes the residuals settle down around zero and stay there, so that each new observation brings genuinely new information about the line. That assumption is carrying a lot of weight here, and it is false.

Here is why. Take one wandering series and subtract a multiple of another wandering series from it. What is left still wanders, because nothing in that subtraction created a pull back toward zero. So let's look at what the coffee fit actually left behind.

```r
# Look at what the petrol-on-coffee regression left behind
fake_res <- residuals(fake_fit)

plot(fake_res, type = "l", col = "tomato", lwd = 2,
     xlab = "Month", ylab = "Residual, cents a litre",
     main = "What the petrol-on-coffee regression left behind")
abline(h = 0, col = "grey30", lwd = 2, lty = 2)

round(c(longest_run = max(rle(sign(fake_res))$lengths),
        crossings = sum(diff(sign(fake_res)) != 0),
        spread = sd(fake_res)), 2)
#> longest_run   crossings      spread
#>       38.00       28.00        4.45
```

That is not a series settling around zero. It is a series taking long excursions away from it. The longest stretch on one side of the line ran 38 months without a single crossing, which is more than three years of the model being wrong in the same direction. Across the full twenty years it crossed zero only 28 times, and it reached 12.71 cents away at its worst.

Now put that back into the standard error. That formula counts all 240 months as 240 independent pieces of evidence about the slope. They are not. When the residual spends three years on one side of the line, consecutive months are telling you the same thing over and over, so the real amount of information is a small fraction of 240. Compute the standard error from 240 independent observations you do not have and it comes out far too small.

A t-statistic is a ratio. Shrink the bottom and the top does not have to be interesting for the ratio to be huge.

[KEY INSIGHT]
A big t-statistic between two wandering series is measuring shared drift over one stretch of history, divided by a standard error that assumed information it never had. It is not measuring evidence of a relationship.

=== step === widget
## What correlated errors do to a confidence interval

That claim is worth watching happen rather than taking on trust, because one half of it is genuinely counterintuitive.

The dial below controls one thing: how strongly each month's error is correlated with the month before it. At zero, the errors are independent and every assumption holds. Turn it up and neighbouring errors start moving together, which is what a residual that spends years on one side of zero looks like from the inside.

Behind the dial, thousands of complete studies run at every setting. Two things get measured. **Coverage** is the share of those studies whose 95 percent confidence interval actually contained the true value, which is the one promise a confidence interval makes. **Fit** is R-squared, which is what most people look at.

Drag it from left to right and watch which of the two moves.

::widget assumption-dial {"assumption": "autocorrelation", "start": 0}

Coverage falls apart. A 95 percent interval that covers the truth far less than 95 percent of the time is not a 95 percent interval, whatever it says on the label.

And R-squared goes up. That is the part to sit with for a moment. The very thing wrecking the interval makes the fit statistic look better, so the number on your screen improves while the inference underneath it fails.

One more thing about the scale. That dial tops out at a correlation of 0.92, and even there it is describing errors that eventually decay back to zero. A random walk sits at 1.00, just past the end of the dial, and at exactly 1.00 the decay stops altogether. So the damage you can see on screen is the mild version of what our petrol and coffee regression was doing.

=== step === quiz
## Quick check: what is that t-statistic measuring?

The petrol-on-coffee regression came back with a t-statistic of 25.42 on a pair of series with no connection at all. Which sentence describes what that number was actually measuring?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Strong evidence that coffee prices drive petrol prices, since a t-statistic that large is hard to get by chance. ::no
- Two series that happened to drift the same way over one stretch of history, divided by a standard error whose assumption about the residuals is false here. ::ok Exactly. Both parts matter: shared drift on top, and a divisor that came out far too small on the bottom, because a residual that spends three years on one side of zero is not 240 independent pieces of information.
- The size of the effect of coffee on petrol, in cents a litre per cent a pound. ::no
- Nothing at all, because t-statistics have no meaning when the data is a time series. ::no A t-statistic is a real quantity and it means something whenever its standard error is computed on assumptions that hold. Here one of those assumptions failed: the residuals wander instead of settling, so the divisor is too small and the ratio balloons. How big an effect is, is always a separate question from whether there is one, and in this case there is none to size.

=== step === concept
## What cointegration means: two wandering series, one steady combination

We now have the trap in full view. So let's get to the thing that is not a trap.

Go back to the pair we built from a known rule. Petrol was 55 plus 0.8 times crude plus a gap, so if we take the petrol price and subtract 55 and subtract 0.8 times crude, what should be left is that gap on its own.

\[ z_t = y_t - \alpha - \beta x_t \]

Read it in plain words: \(z_t\) is what is left of the petrol price \(y_t\) once you take out the fixed markup \(\alpha\) and the part that moves with crude, \(\beta x_t\). It is the distance between where petrol is and where the long-run rule says it should be.

Let's look at the levels and that leftover distance together.

```r
# Put the two wandering prices above the gap the true rule leaves behind
equilibrium_gap <- petrol - 55 - 0.8 * crude

par(mfrow = c(2, 1), mar = c(4, 4, 2, 1))
plot(petrol, type = "l", col = "firebrick", lwd = 2,
     ylim = range(c(crude, petrol)), xlab = "", ylab = "Price",
     main = "Both prices wander")
lines(crude, col = "steelblue", lwd = 2)
plot(equilibrium_gap, type = "l", col = "darkgreen", lwd = 2,
     xlab = "Month", ylab = "Gap, cents a litre",
     main = "The gap between them does not")
abline(h = 0, col = "grey30", lwd = 2, lty = 2)
par(mfrow = c(1, 1))

round(c(longest_run = max(rle(sign(equilibrium_gap))$lengths),
        crossings = sum(diff(sign(equilibrium_gap)) != 0),
        spread = sd(equilibrium_gap)), 2)
#> longest_run   crossings      spread
#>       16.00       57.00        1.94
```

Two panels, and the contrast between them is the whole idea.

The top panel is two prices climbing from one end of the chart to the other, neither with a level to return to. The bottom panel is flat. It wobbles between about minus 6 and plus 4 cents and keeps coming back to the dashed line. It crossed zero 57 times over the twenty years and its longest stay on one side was 16 months.

Set that beside the coffee residual, which crossed 28 times and once stayed put for 38 months. Same length of history, same kind of chart, completely different behaviour.

That is **cointegration**. Both series are I(1), which means each one needs differencing before it settles. But one particular combination of them, petrol minus 55 minus 0.8 times crude, is I(0): it is stationary, it has a home, and it keeps returning to it. Two integrated series with a stationary combination between them are said to be cointegrated, and the pair of weights that makes the combination settle, a 1 on petrol and a minus 0.8 on crude, is called the **cointegrating vector**.

[KEY INSIGHT]
Cointegration is not about the two series being correlated or looking alike. It is a statement about what is left over: individual parts that wander forever, and one combination of them that does not.

=== step === tryit
## Your turn: does the gap have a home?

The gap is something you can build yourself, and its size is the point.

The block below rebuilds it, then sets its spread against how far crude itself travelled over the same twenty years. There is one problem. The slope in it is wrong, because the true rule used 0.8. Fix it, then press Check.

```r
# Rebuild the equilibrium gap and set its spread against how far crude travelled.
# The slope below is wrong. The true rule used 0.8.
my_gap <- petrol - 55 - 0.5 * crude

round(c(gap_spread = sd(my_gap), crude_travelled = diff(range(crude))), 2)
```
::check {"regex": "0[.]8\\s*[*]\\s*crude", "gate": true, "difficulty": "beginner", "ok": "That is it. The gap has a spread of 1.94 cents while crude itself covered 36.47 dollars a barrel. The parts roamed nearly twenty times as far as the distance between them, and that ratio is what cointegration looks like in numbers.", "no": "Only one number needs changing. Replace the 0.5 in front of crude with the slope the rule was actually built from, 0.8."}
::solution
```r
# The gap rebuilt with the true slope, next to how far crude travelled
my_gap <- petrol - 55 - 0.8 * crude

round(c(gap_spread = sd(my_gap), crude_travelled = diff(range(crude))), 2)
#>      gap_spread crude_travelled
#>            1.94           36.47
```

With the wrong slope of 0.5 the spread comes out at 3.73, nearly double. Get \(\beta\) wrong and some of crude's own wandering leaks back into the gap. That is why finding the right \(\beta\) is half of the job ahead.

=== step === concept
## Step zero: check that each series really does wander

Everything so far assumed each series was I(1), because we built them that way. With real prices you have to establish it, and there is a standard test for that.

The **Augmented Dickey-Fuller test**, `adf.test()` in the `tseries` package, asks whether a series has a unit root. The augmented part refers to lags. Alongside the pull from last month's level, the test carries a few recent month-to-month changes in the regression too, so that ordinary short-term momentum does not get read as a pull back toward a home level. `adf.test()` picks how many to carry and reports the count as `Lag order` in the output.

Its null hypothesis is that the series does have a unit root, which is to say the null is that the series wanders. That direction catches people out all the time, so let's say it plainly. A large p-value means you could not rule out a unit root, and that is the answer you want here.

```r
# Check whether each price wanders and cannot be ruled non-stationary
suppressMessages(library(tseries))

adf.test(crude)
#>
#> 	Augmented Dickey-Fuller Test
#>
#> data:  crude
#> Dickey-Fuller = -1.142, Lag order = 6, p-value = 0.914
#> alternative hypothesis: stationary

adf.test(petrol)
#>
#> 	Augmented Dickey-Fuller Test
#>
#> data:  petrol
#> Dickey-Fuller = -1.3263, Lag order = 6, p-value = 0.8592
#> alternative hypothesis: stationary
```

Crude comes back at 0.914 and petrol at 0.8592. Both are large, so in neither case can we rule out a unit root, which is exactly what we wanted to confirm.

Now for the other half. If these really are I(1), then differencing them once should produce something stationary, and the same test should say so loudly.

```r
# Run the same check on the month-to-month changes
adf.test(diff(crude))
#>
#> 	Augmented Dickey-Fuller Test
#>
#> data:  diff(crude)
#> Dickey-Fuller = -5.0552, Lag order = 6, p-value = 0.01
#> alternative hypothesis: stationary

adf.test(diff(petrol))
#>
#> 	Augmented Dickey-Fuller Test
#>
#> data:  diff(petrol)
#> Dickey-Fuller = -6.9365, Lag order = 6, p-value = 0.01
#> alternative hypothesis: stationary
```

Both differences come back at 0.01, and R prints a warning that the true p-value is smaller than the smallest one in its lookup table. So the levels wander and the changes do not. Both series are I(1), confirmed rather than assumed, and that is the entry requirement for everything that follows.

[NOTE]
`adf.test()` always fits both a constant and a linear time trend, so what it is really testing against is a series that is stationary around a trend line. That is a sensible default for a raw price. It will matter shortly that it is the wrong default for something else.

=== step === quiz
## Quick check: what does a big p-value from adf.test say?

The petrol price came back from `adf.test()` with a p-value of 0.8592. What does that number tell you?

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- The petrol price is stationary, so it can go straight into an ordinary regression. ::no
- There is an 86 percent probability that the petrol price has a unit root. ::no
- The test could not rule out a unit root, which is the expected answer for a price that wanders. ::ok Right. The null here is that the series has a unit root, so a large p-value is a failure to reject it. That is confirmation the series behaves the way the rest of the procedure needs it to.
- The test failed and should be rerun with more months of data. ::no Two things get tangled here. First, direction: this null says the series wanders, so a large p-value means it could not be ruled out, not that stationarity was proven. Second, a p-value is never the probability that a hypothesis is true. Nothing failed and nothing needs rerunning. The answer came back the way a wandering price should make it come back.

=== step === concept
## Step one: the long-run line, and why to ignore its stars

Both series wander, so now we can start. The first of the two steps is a plain regression of petrol on crude.

That should feel wrong after what we just watched. We spent a while establishing that a regression between two wandering series produces nonsense, and here we are running one on purpose. The difference is what we are going to read from it. Not the t-statistic, not the p-value, not the stars. Just the coefficients, and only so we can build the gap out of them.

```r
# Fit the long-run line between petrol and crude
coint_fit <- lm(petrol ~ crude)
summary(coint_fit)
#>
#> Call:
#> lm(formula = petrol ~ crude)
#>
#> Residuals:
#>     Min      1Q  Median      3Q     Max
#> -5.5394 -1.2830  0.0148  1.2894  4.4820
#>
#> Coefficients:
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept) 54.05260    1.06546   50.73   <2e-16 ***
#> crude        0.80751    0.01212   66.62   <2e-16 ***
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
#>
#> Residual standard error: 1.94 on 238 degrees of freedom
#> Multiple R-squared:  0.9491,	Adjusted R-squared:  0.9489
#> F-statistic:  4438 on 1 and 238 DF,  p-value: < 2.2e-16
```

Look at the two estimates against the rule we built from. The true intercept was 55 and the estimate is 54.05260. The true slope was 0.8 and the estimate is 0.80751. From 240 months of two series that never sat still, ordinary least squares recovered the slope to within one percent of the truth and the intercept to within two.

That is a genuinely useful property, and it has a name. The estimate of \(\beta\) from a cointegrating regression is **superconsistent**: it converges on the truth faster than an ordinary regression estimate does, precisely because the two series wander together over a wide range.

Now cover the right-hand side of that table with your hand. The t-statistic of 66.62 and the three stars are computed by the same formula that gave coffee a t of 25.42, on the same broken assumption, and they carry no more meaning here than they did there. A real relationship and a fake one produce the same kind of impressive output. That is why the stars cannot be the evidence.

The evidence is in `Residuals` at the top, and that is what we go after next.

=== step === concept
## Step two: testing whether the residual comes home

Here is the move the whole procedure turns on.

We defined the gap as petrol minus the intercept minus the slope times crude. A regression residual is the observed value minus the fitted value, which is petrol minus the estimated intercept minus the estimated slope times crude. Those are the same expression. The residual from the long-run line **is** the estimated gap.

So the question about the gap becomes a question about a residual, and we already have a test for whether a series comes home to a level. Run that test on the residual and we are done.

Only not with `adf.test()`. It always fits a constant and a linear trend, and both are wrong for a residual. Least squares already put a constant in the first step, which is why the residual has a mean of exactly zero, and fitting a trend to it would be testing something we have no reason to believe. What we want is the plain version with no deterministic terms at all, and `ur.df()` in the `urca` package gives it with `type = "none"`.

The `lags = 1` beside it is the same augmentation as before, one recent change of the residual carried along, except that here you choose the number yourself instead of letting the function choose for you. When you are unsure, run it at a couple of settings and check the verdict does not hinge on which one you picked.

```r
# Test whether the leftover gap from the long-run line comes home to zero
suppressMessages(library(urca))

ect <- residuals(coint_fit)
round(mean(ect), 12)
#> [1] 0

eg_test <- ur.df(ect, type = "none", lags = 1)
eg_test@teststat
#>                tau1
#> statistic -6.237744
eg_test@cval
#>       1pct  5pct 10pct
#> tau1 -2.58 -1.95 -1.62
```

Two things about the output before we get to the number itself.

The `@` is not a typo for a dollar sign. `ur.df()` returns an S4 object, a different flavour of R object whose parts are reached with `@` rather than `$`. So `eg_test@teststat` pulls out the statistic and `eg_test@cval` pulls out the table of critical values.

And the mean of the residual printed as 0, exactly, which is the intercept from the first step doing its job. That is the reason `type = "none"` is right.

The statistic is -6.237744. It is negative because the test measures how strongly the series is pulled back toward zero, so more negative means a stronger pull, and a value near zero means no pull at all. Against every threshold in that printed table, -6.24 is comfortably past. Keep an eye on how far past, because the size of that margin is about to matter more than the table does.

The gap comes home. Petrol and crude are cointegrated. That is the Engle-Granger two-step in full: fit the long-run line, then test the residual it leaves.

Except for one thing about that printed table, and it is the most common way this test gets used wrongly.

=== step === concept
## Why R's printed critical values are wrong for this test

The table `ur.df()` printed says -1.95 at the 5 percent level. Those numbers are correct for what `ur.df()` is, and wrong for what we just used it for.

Here is the problem. Those critical values were worked out for testing a series you brought to the test, one that exists independently of any fitting you did. Our residual is not that. It came out of a regression whose entire purpose was to choose the slope that makes those residuals as small as possible.

Least squares searched for the most stationary-looking leftover it could find, out of every slope available. Of course it looks more settled than an arbitrary series would. Judge that hand-picked residual against a threshold designed for series nobody picked, and the test rejects far too often. The critical value has to move to compensate.

MacKinnon computed how far it has to move. For two series with a constant in the long-run regression, the honest 5 percent threshold is -3.34, not -1.95.

| Series in the long-run regression | 1 percent | 5 percent | 10 percent |
|---|---|---|---|
| Two, as here | -3.90 | -3.34 | -3.04 |
| Three | -4.29 | -3.74 | -3.45 |
| Four | -4.64 | -4.10 | -3.81 |

The threshold gets harsher as you add series, for the same reason: more series means more freedom to find a combination that looks settled, so more correction is needed.

Now watch what that changes. Run exactly the same residual test on the petrol and coffee pair, the one we know has nothing in it.

```r
# Run the same residual test on the pair we know is unrelated
fake_test <- ur.df(fake_res, type = "none", lags = 1)
fake_test@teststat
#>                tau1
#> statistic -2.664749

round(c(petrol_and_crude = eg_test@teststat[1],
        petrol_and_coffee = fake_test@teststat[1]), 3)
#>  petrol_and_crude petrol_and_coffee
#>            -6.238            -2.665
```

The coffee pair scores -2.665.

Read that against the table R printed and it is past -1.95, so you would call it cointegrated and go and tell someone that coffee and petrol share a long-run relationship. Read it against -3.34 and it is nowhere near, so you correctly call it not cointegrated and throw it away.

Same statistic. Same output. Opposite conclusions, decided entirely by which threshold you compare against.

Meanwhile the real pair scores -6.238, which is past both thresholds by a wide margin. A genuine long-run relationship does not need the lenient table to survive.

[WARNING]
`ur.df()` prints the wrong critical values for this use, and it prints them right beside the statistic where they are hard not to read. It is not a bug: those numbers are correct for a standalone series. They are simply not the ones that apply to a residual least squares chose. Compare against MacKinnon's table, and remember which row you are on.

=== step === quiz
## Quick check: what does a residual statistic of -2.66 tell you?

The petrol and coffee residual came back at -2.665. Two thresholds are available: the -1.95 that `ur.df()` printed, and the -3.34 from MacKinnon's table for two series. What is the verdict?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Cointegrated, since -2.665 is past the 5 percent line of -1.95 that the test itself reported. ::no
- Not cointegrated. It clears the printed line but falls well short of -3.34, and -3.34 is the threshold that applies to a residual a regression chose the slope for. ::ok That is the whole point of the correction. The lenient table would have handed a long-run relationship to a pair we built from unrelated draws, and the right one throws it out.
- Inconclusive, because the statistic falls between the two thresholds and more months of data are needed. ::no
- Cointegrated, because the underlying regression had an R-squared of 0.7308 and a t-statistic of 25.42. ::no Those last two numbers are the ones that started all this trouble. A spurious regression produces exactly that kind of fit, which is why the verdict never comes from R-squared or the stars. It comes from the residual statistic, and only against the threshold that belongs to it. Falling between two thresholds is not an inconclusive result either, because only one of the two applies.

=== step === tryit
## Your turn: write the verdict helper

Both statistics are computed and sitting in the session. What is missing is the piece that turns a number into an answer, so you do not have to remember the threshold every time.

The function below does that, and it has the wrong threshold in it. Put in the one that belongs to a residual from a two-series regression, then press Check.

```r
# Turn a residual statistic into a verdict.
# The threshold below is the one the test printed. Replace it with the correct one.
verdict <- function(stat) {
  if (stat < -1.95) "cointegrated" else "not cointegrated"
}

c(petrol_and_crude  = verdict(eg_test@teststat[1]),
  petrol_and_coffee = verdict(fake_test@teststat[1]))
```
::check {"regex": "-3[.]34", "gate": true, "difficulty": "beginner", "ok": "Yes. With -1.95 in there both pairs come back cointegrated, coffee included. Swap in -3.34 and the fake pair flips to a correct no while the real one is untouched. One number, one wrong conclusion avoided.", "no": "The threshold you want is the 5 percent value from MacKinnon's table for two series in the long-run regression. It is -3.34."}
::solution
```r
# The same helper with the threshold that belongs to a residual test
verdict <- function(stat) {
  if (stat < -3.34) "cointegrated" else "not cointegrated"
}

c(petrol_and_crude  = verdict(eg_test@teststat[1]),
  petrol_and_coffee = verdict(fake_test@teststat[1]))
#>   petrol_and_crude  petrol_and_coffee
#>     "cointegrated" "not cointegrated"
```

Notice that only one of the two answers moved. The real pair was never in doubt at either threshold, and the fake one was only ever surviving on the lenient table.

=== step === tryit
## Your turn: run the two-step on a fresh pair

Last one, and it is the whole procedure end to end.

The block below builds a brand new twenty-year pair from a fresh seed, so nothing you have already computed applies to it. Your job is the four lines underneath: fit the long-run line, pull out what it left behind, test that leftover, and give the verdict against the right threshold.

```r
# A fresh twenty-year pair. Fit the long-run line, test what it leaves, decide.
set.seed(2026)
new_crude <- 70 + cumsum(rnorm(240, mean = 0.05, sd = 1.2))
new_petrol <- 55 + 0.8 * new_crude +
  as.numeric(arima.sim(list(ar = 0.75), n = 240, sd = 1.5))

# Your four lines go here:
# 1. fit new_petrol on new_crude with a linear model
# 2. take what that fit left behind
# 3. run the unit root test on it, with no constant and no trend, one lag
# 4. compare the statistic against the threshold for two series
```
::check {"regex": "(?=[\\s\\S]*ur[.]df)[\\s\\S]*residuals", "gate": true, "difficulty": "intermediate", "ok": "That is the procedure. The statistic comes back at -6.034, past -3.34 by a distance, so the fresh pair is cointegrated. It should be: it was built from the same rule, with a gap that decays. You have now run the test on a pair you had never seen.", "no": "Two pieces have to be in there. Pull the leftover out of the fit with residuals(), then hand that to ur.df() with type = none and lags = 1."}
::solution
```r
# The two-step run end to end on the fresh pair, from the long-run line to the verdict
new_fit <- lm(new_petrol ~ new_crude)
new_res <- residuals(new_fit)
new_test <- ur.df(new_res, type = "none", lags = 1)

round(coef(new_fit), 3)
#> (Intercept)   new_crude
#>      51.238       0.857

round(new_test@teststat[1], 3)
#> [1] -6.034

ifelse(new_test@teststat[1] < -3.34, "cointegrated", "not cointegrated")
#> [1] "cointegrated"
```

The recovered slope is 0.857 against a true 0.8, and the intercept is 51.238 against a true 55. Both are a little off, which is what one sample of 240 months gives you, and the verdict is nowhere near the line. That is the usual pattern with a real long-run relationship. The coefficients wobble and the answer does not.

=== step === concept
## References

- [Co-integration and Error Correction: Representation, Estimation, and Testing](https://ideas.repec.org/a/ecm/emetrp/v55y1987i2p251-76.html) - Engle and Granger (1987), Econometrica 55(2), 251-276. The paper that defines the two-step procedure and proves the theorem behind it.
- [Spurious Regressions in Econometrics](https://ideas.repec.org/a/eee/econom/v2y1974i2p111-120.html) - Granger and Newbold (1974), Journal of Econometrics 2(2), 111-120. The original simulation study of the trap, short and very readable.
- [Critical Values for Cointegration Tests](https://ideas.repec.org/p/qed/wpaper/1227.html) - MacKinnon (1991, revised 2010), Queen's Economics Department Working Paper 1227. Where -3.34 comes from, with tables for more series and more specifications.
- [A Drunk and Her Dog: An Illustration of Cointegration and Error Correction](https://www.semanticscholar.org/paper/10.1080/00031305.1994.10476017) - Murray (1994), The American Statistician 48(1), 37-39. Two pages, and still the clearest intuition available for a stationary gap between two wandering paths.
- [urca: Unit Root and Cointegration Tests for Time Series Data](https://cran.r-project.org/web/packages/urca/urca.pdf) - Pfaff and Stigler, the CRAN reference manual. The argument by argument reference for `ur.df()`, including what each `type` fits and where its printed critical values come from. The companion manual for `tseries` documents exactly what `adf.test()` fits and how it interpolates its p-values.

=== step === complete
## Quick recap

You watched a spurious regression happen, then took it apart and built the test that catches it. To pull it together:

- Two wandering series regressed on each other produce a significant slope about five times in six. You measured it: 424 of 500 unrelated pairs came back significant at the 5 percent level.
- The reason is the standard error. A residual that spends 38 months on one side of zero is not 240 independent observations, so the divisor comes out far too small and the t-statistic balloons.
- Cointegration is a statement about the leftover, not about the two series. Both parts wander forever, and one combination of them, petrol minus 55 minus 0.8 times crude, is flat and keeps crossing zero.
- The Engle-Granger two-step is: fit the long-run line with `lm()`, then test its residual with `ur.df(ect, type = "none", lags = 1)`. The residual is the estimated gap, which is why the test runs on it.
- Compare against -3.34, not the -1.95 printed beside the statistic. Least squares chose the slope that made that residual look as settled as possible, and the threshold has to account for the search.

So when someone shows you a great-looking regression between two trending series, you now have one question that settles it. What does the residual do? If it comes home, the relationship is real. If it wanders off, the R-squared was measuring shared drift and nothing more.

Nice work getting through this one. There is an obvious question sitting on the other side of the verdict, and it is worth carrying with you: once you know two series are cointegrated, how fast does the gap actually close?
