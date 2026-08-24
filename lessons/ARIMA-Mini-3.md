---
title: "How to choose ARIMA order (p, d, q): a practical guide"
slug: "ARIMA-Mini-3"
description: "Choosing p, d and q is not guesswork. Flatten the trend to find d, read the PACF for p and the ACF for q, then let AICc pick the winner from your shortlist."
keywords: "choose ARIMA order, ARIMA p d q, ACF and PACF, PACF cutoff, ACF tails off, AICc model selection, ndiffs, auto.arima, ARIMA order in R"
mathjax: true
webr: true
date: "2026-08-24"
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
catalog_blurb: "How to settle on the three ARIMA numbers instead of guessing at them."
---

=== step === cover
::eyebrow ARIMA from Zero
## How to choose ARIMA order (p, d, q): a practical guide

Maya runs a coffee shop and business has been getting better every month. She has written down how many cups she sold on each of the last 180 mornings, and now she wants a forecast, because milk gets ordered on a Monday and thrown away on a Friday.

The model for that job is an ARIMA. And here is the good news about fitting one: R works out every coefficient by itself. The only thing left for a human to decide is three small whole numbers, written ARIMA(p, d, q).

Most people pick those three by guessing, or by letting an automatic function guess for them.

You do not have to. There is a way to find them that runs in the same order every time, and we are going to run all of it ourselves on Maya's mornings.

::widget process-flow {"steps":[{"title":"Take the growth out","sub":"flatten the climb, and count how many goes it took"},{"title":"Read the two plots","sub":"the PACF gives you p, the ACF gives you q"},{"title":"Score the shortlist","sub":"fit the candidates and let one fair score pick"}]}

That is the whole idea, and none of the three steps is hard. It only feels hard because most people meet p, d and q without ever being shown where they come from.

=== step === concept
## 180 mornings at Maya's coffee shop

Before we choose anything we need the series in front of us, so let's build it.

We are going to make Maya's numbers ourselves rather than load them from somewhere, and let me say why. When you build the series you already know the true answer, so at the end you can check whether we got it back. On somebody's real sales data you never get that luxury.

Here is the recipe we are baking in. The shop grows by about one cup a morning. On top of that, each morning's change carries a bit over half of yesterday's change, because a busy morning tends to be followed by another busy morning. Then a fresh random nudge lands on top of that.

Press Run.

```r
# Build 180 mornings of cup sales at Maya's shop and plot them
set.seed(42)
shock  <- rnorm(180, sd = 4)
change <- numeric(180)
change[1] <- 1 + shock[1]
for (i in 2:180) {
  change[i] <- 1 + 0.55 * (change[i - 1] - 1) + shock[i]
}
cups <- ts(round(180 + cumsum(change)))

cups[1:8]
#> [1] 186 188 191 196 200 203 211 215
cups[180]
#> [1] 316

plot(cups, main = "Cups sold at Maya's shop, 180 mornings",
     xlab = "Morning", ylab = "Cups sold")
```

Read the line inside the loop as the recipe itself. The `1 +` is the cup a morning the shop gains. The `0.55 * (change[i - 1] - 1)` is yesterday's change leaking into today, and `shock[i]` is the fresh nudge, drawn with a standard deviation of 4 cups. Then `cumsum()` stacks all 180 changes on top of a starting level of 180 cups.

She opens at 186 cups and finishes at 316, and the plot shows the climb behind those two numbers.

That climb is the first thing we have to deal with.

=== step === concept
## What p, d and q each stand for

Now that a real series is on the screen, the three letters have something to attach to.

Each one counts a different thing, and each one is a small whole number. Here they are beside the recipe that made Maya's mornings.

| Letter | What it counts | Where it sits in Maya's recipe |
|---|---|---|
| p | how many past values feed into today directly | today's change carries 0.55 of yesterday's change, and nothing older, so one |
| d | how many times you difference before modelling | the climb of about a cup a morning has to come out, and that takes one pass |
| q | how many past random nudges feed into today | each morning gets its own fresh nudge and carries no older one, so none |

So Maya's series is an ARIMA(1, 1, 0) by construction. We know that because we wrote the recipe.

Now the job is to reach those same three numbers from the 180 sales figures alone, the way you would have to on data somebody handed you. If we get back to (1, 1, 0), the method works.

[NOTE]
An ARIMA has more inside it than these three numbers: there is a coefficient on each past value, a coefficient on each past nudge, and the size of the nudges themselves. You never choose any of those. Fix p, d and q and R estimates the rest for you, by searching for the values that make the sales you actually recorded as likely as possible.

=== step === concept
## What stationary means, and why the plots need it

The two plots that do the real work of finding p and q have nothing useful to say about a series that is still climbing. It is worth knowing why, because this is where most people go wrong.

A series is called **stationary** when its level and its spread stay put over time. That does not mean the values stop moving. It means the series wanders around the same average and wobbles by about the same amount in the last stretch as it did in the first.

Maya's cups fail that badly. Watch what happens when we split her 180 mornings down the middle and take the average of each half.

```r
# Compare the average cup count in the first 90 mornings with the last 90
round(mean(cups[1:90]), 1)
#> [1] 242.6
round(mean(cups[91:180]), 1)
#> [1] 304.6
```

The first half averages 242.6 cups and the second half averages 304.6. That is a gap of 62 cups, and it is not the shop having a good week. It is the trend.

Here is why that matters. Both plots we are about to read measure correlation between the series and a shifted copy of itself. On a climbing series, every value early in the record is below average and every value late in the record is above average, so any shifted copy lines up with the original almost perfectly.

The correlation comes back near 1 at every lag, and it is telling you one thing only: the series goes up. You already knew that from the plot, and it says nothing at all about p or q.

=== step === concept
## How to find d, the number of differences

The fix is to stop modelling the cup counts and start modelling the change in cup counts.

That single move is what d counts. **Differencing** means replacing each value with the amount it moved since the day before, which in symbols is this:

\[ y'_t = y_t - y_{t-1} \]

If Maya sold 191 cups on the third morning and 196 on the fourth, the differenced series holds 5 for that fourth morning. A trend of a cup a morning becomes a series of changes hovering around one cup, and the climb is gone. In R that is `diff()`, and `ndiffs()` from the forecast package will tell you how many passes a series needs.

```r
# Turn the daily totals into day-to-day changes, then ask how many differences are needed
library(forecast)
cups_diff <- diff(cups)

plot(cups_diff, main = "Change in cups sold from one morning to the next",
     xlab = "Morning", ylab = "Change in cups")
abline(h = mean(cups_diff), col = "red", lwd = 2)

round(mean(cups_diff), 2)
#> [1] 0.73
ndiffs(cups)
#> [1] 1
```

Put that plot beside the one we started with. The climb is gone. What is left is a band of changes running from about minus 15 to plus 15 cups, and the red line marks their average, 0.73 of a cup. The band sits in the same place on the left of the plot as it does on the right, which is what stationary looks like.

And `ndiffs()` returns 1. One pass was enough, so **d = 1**. That is the first of our three numbers, and it was not a judgement call.

[KEY INSIGHT]
Difference the smallest number of times that flattens the series, and then stop. Everything downstream is read off the differenced series, so if d is wrong, p and q are read off the wrong data and the whole order is wrong with it.

=== step === quiz
## Quick check: what did differencing fix?

Maya's cup counts climbed from about 186 to about 316. One pass of `diff()` left a series of changes bouncing between roughly minus 15 and plus 15 cups, averaging 0.73. What did that pass actually remove?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- The daily ups and downs, so the series is now flat and there is nothing left to model. ::no
- The moving level. The average change now sits near one cup and stays there, while the morning-to-morning wobble is still there to be modelled. ::ok That is it. Differencing takes out the drift in the level and leaves the pattern in the wiggle, which is exactly the part we still want, because that pattern is what p and q describe.
- The random noise, leaving only the underlying trend behind. ::no
- The variation between mornings, which is what stationary means. ::no Differencing only takes the moving level out. The changes still run from about minus 15 to plus 15 cups and they still lean on yesterday. Stationary means the average and the spread stay put over time, not that the numbers stop varying.

=== step === concept
## The ACF, the PACF, and the band that says a bar counts

With a flat series in hand we can go looking for p and q, and two plots do that job.

The first is the **autocorrelation function**, the ACF. At lag k it is the plain correlation between the series and a copy of itself shifted k days back. The ACF at lag 1 asks how well today's change lines up with yesterday's, and the ACF at lag 3 asks the same about three mornings ago.

```r
# Draw the ACF of the daily change, and work out the band that decides which bars count
acf(cups_diff, main = "ACF of the daily change in cups")

round(1.96 / sqrt(179), 3)
#> [1] 0.146
```

The second is the **partial autocorrelation function**, the PACF, and it answers a sharper question. The PACF at lag 3 is the correlation between today and three mornings ago after the days in between have been accounted for and stripped out. So it measures the direct link only, with the relayed effect removed.

That difference between the two is the whole reason you need both plots.

```r
# Draw the PACF of the same daily change
pacf(cups_diff, main = "PACF of the daily change in cups")
```

Both plots come with a pair of dashed lines. That is the noise band, and it sits at plus and minus \(1.96/\sqrt{n}\) for a series of n values. Maya's differenced series has 179 values, so her band sits at 0.146, which is the number the code printed above.

A bar poking outside the band counts. A bar inside it is treated as zero, because a series of pure noise would throw up bars that size often enough that you cannot read anything into them.

Two words describe how a plot behaves once you have the band, and you need both of them:

- **Cuts off:** the bars stick out to some lag, then drop inside the band and stay there. That is a clean stop.
- **Tails off:** the bars shrink gradually over many lags, often flipping sign as they go, with no clean stop anywhere.

=== step === concept
## What one difference too many does to the plots

Before we read anything, one warning about d, because getting it wrong quietly ruins the reading.

It is tempting to difference twice on the theory that flatter is better. It is not. A second pass writes a pattern into the series that the shop never produced. Here is the lag-1 correlation of Maya's changes, then the same number after a second difference.

```r
# Compare the lag-1 correlation before and after a second difference
cups_diff2 <- diff(cups, differences = 2)

round(acf(cups_diff,  plot = FALSE)$acf[2], 3)
#> [1] 0.542
round(acf(cups_diff2, plot = FALSE)$acf[2], 3)
#> [1] -0.239
```

The real series has a lag-1 correlation of 0.542, a solid positive number: a big jump yesterday goes with a big jump today. Difference once more and it becomes minus 0.239, a bar outside the 0.146 band pointing the other way.

Nothing in Maya's shop swings from up to down like that. The second pass invented it, and if you read the plots after over-differencing you would go looking for a moving-average term that is not there.

[WARNING]
A lag-1 correlation that turns sharply negative after differencing is the classic signature of one difference too many. When `ndiffs()` says 1, take 1.

=== step === concept
## How to read p off the PACF

Now we read the plots, starting with p, and here is the rule that turns the picture into a number.

For a series where today leans directly on its own recent values, the PACF cuts off. It sticks out for as many lags as there are direct links, then drops inside the band and stays there. **The lag where it stops is p.**

Maya's PACF is in front of you already. Here are the same bars as numbers, for the first eight lags.

```r
# Print the PACF of the daily change for lags 1 to 8
round(pacf(cups_diff, plot = FALSE)$acf[1:8], 3)
#> [1]  0.542  0.012 -0.015  0.037 -0.050 -0.098  0.012  0.108
```

Compare each one against the band of 0.146.

Lag 1 is 0.542, far outside. Lag 2 is 0.012, which is nothing. Lag 3 is minus 0.015, lag 4 is 0.037, and on down the line: not one of lags 2 through 8 gets anywhere near the band.

That is a cut-off after lag 1, about as clean as real data ever gives you. So **p = 1**.

Think about what the number is saying. Once you know how much Maya's sales changed yesterday, knowing what happened two mornings ago adds nothing. The information from two mornings ago already reached today through yesterday, and the PACF is the plot that strips that relay out and shows you only what arrives direct.

[NOTE]
R prints the PACF starting at lag 1, because there is no lag-0 partial correlation. The ACF does start at lag 0, and that first value is always exactly 1, since any series correlates perfectly with itself. That is why the ACF code above reaches for `$acf[2]` to get lag 1.

=== step === concept
## How to read q off the ACF

The other letter, q, comes off the ACF, and the rule is the mirror image: for a series driven by past random nudges, the ACF cuts off, and the lag where it stops is q.

So look at Maya's ACF and ask where it stops.

```r
# Put the ACF of the daily change beside the powers of its own lag-1 value
acf_vals <- round(acf(cups_diff, plot = FALSE)$acf[2:5], 3)
powers   <- round(0.542 ^ (1:4), 3)

data.frame(lag = 1:4, acf = acf_vals, power_of_lag1 = powers)
#>   lag   acf power_of_lag1
#> 1   1 0.542         0.542
#> 2   2 0.302         0.294
#> 3   3 0.158         0.159
#> 4   4 0.109         0.086
```

Read the middle column on its own first. It goes 0.542, then 0.302, then 0.158, then 0.109, sliding down toward the band and slipping inside it by lag 4. It fades. It never stops.

Now read the third column, and this is the part worth slowing down for. Those are the powers of 0.542: the number itself, then squared, then cubed, then to the fourth. Line them up against the ACF and lags 1, 2 and 3 land almost on top of each other, 0.302 against 0.294 and 0.158 against 0.159.

That closeness is not a coincidence. Today carries 0.542 of yesterday. Yesterday carried 0.542 of the day before. So today carries 0.542 of 0.542 of two mornings ago, which is 0.294, and the correlation two lags out is an echo of an echo. Three lags out it is an echo of an echo of an echo, shrinking each time and never quite landing on zero.

A tailing ACF gives you no clean stopping lag to read, so there is no moving-average term to find. **q = 0.**

[KEY INSIGHT]
A cut-off is a number you can read. A tail is a shape that tells you the term is not there. When one plot cuts and the other tails, the plot that cuts is the one holding your answer.

=== step === concept
## What a series with an MA term looks like

Maya's ACF tailed, so q came out 0. That is a fine answer, but we have only watched the rule work in one direction, and one direction is not enough to use it on your own data.

So let's look at the mirror case. The bakery next door has a different kind of business. Its mornings do not lean on yesterday's takings at all. What they carry instead is yesterday's surprise: when an unexpected rush turns up, some of those customers come back the following morning, and after that the effect is spent.

That is a moving-average series, and it should print the opposite pair of shapes. Let's find out.

```r
# Build the bakery series, where each morning carries part of yesterday's surprise
set.seed(7)
shocks    <- rnorm(181, sd = 4)
ma_change <- shocks[2:181] + 0.7 * shocks[1:180]

acf(ma_change, main = "ACF, bakery daily change")

round(acf(ma_change, plot = FALSE)$acf[2:5], 3)
#> [1]  0.524  0.114  0.075 -0.028
```

The ACF gives 0.524 at lag 1, then 0.114 at lag 2, which is already inside the 0.146 band, and it stays inside from there. It does not fade. It stops dead after one lag.

That is a cut-off at lag 1, so q = 1 for the bakery. And it makes sense: today holds part of yesterday's surprise and none of the one before, so the correlation has exactly one lag to live in and then runs out of anything to carry.

Now let's look at the PACF of the same series.

```r
# Draw the PACF of the bakery series and print its first four lags
pacf(ma_change, main = "PACF, bakery daily change")

round(pacf(ma_change, plot = FALSE)$acf[1:4], 3)
#> [1]  0.524 -0.221  0.171 -0.196
```

The numbers run 0.524, then minus 0.221, then 0.171, then minus 0.196. They flip sign every lag and fade slowly, with no stop anywhere. That is a tail, and it is exactly the partner a cutting ACF is supposed to have.

So the two shops carry opposite fingerprints. Maya's PACF cuts and her ACF tails. The bakery's ACF cuts and its PACF tails.

=== step === concept
## The reading rule, and the shortlist it gives you

Both directions are now in front of you, so here is the rule in full. Three rows cover every stationary series you will ever pick up.

| ACF behaviour | PACF behaviour | What it points to |
|---|---|---|
| Tails off gradually | Cuts off after lag p | AR(p): use that p, and q = 0 |
| Cuts off after lag q | Tails off gradually | MA(q): use that q, and p = 0 |
| Both tail off gradually | Both tail off gradually | A mix of the two, so try small p and q and let a score decide |

Maya's differenced series is the first row. Her PACF cut off after lag 1 and her ACF tailed, which reads as one autoregressive term and no moving-average term, and we already have d = 1. Written out in full, that is **ARIMA(1, 1, 0)**.

Now, a word of caution before you take that as final.

Real plots are not as tidy as the two you have just read. Maya's series was built to be legible, and a genuine sales record gives you a borderline bar at lag 2, a suspicious bump at lag 7, and no obvious answer. That is normal, and it is not a failure of the method.

One of those is worth naming, because a real coffee shop would show it. If your series repeats on a cycle, a rush every Saturday or a peak every December, that cycle plants a bar out at lag 7 or lag 12 which no amount of differencing will remove. Three integers cannot describe a pattern like that. It needs the seasonal version of the model, and the sign to watch for is a lone bar standing well outside the band at the length of the cycle.

So do not treat the plots as a verdict. Treat them as the thing that narrows hundreds of possible orders down to two or three worth fitting. For Maya, the reading nominates ARIMA(1, 1, 0), and we keep its two nearest neighbours beside it: ARIMA(2, 1, 0), which adds a second autoregressive term, and ARIMA(1, 1, 1), which adds a moving-average term instead. Her plots do not ask for either one. Fitting them anyway is what lets something other than my own eyesight confirm the reading.

[TIP]
Never agonise over one marginal bar. Put both readings on the shortlist and let the score settle it, which is a two-line job and far more reliable than squinting.

=== step === tryit
## Your turn: name the order of this series

Now you read a set of plots with nobody pointing at anything.

The block below builds `mystery`, 400 mornings from a shop you know nothing about, and checks how many differences it needs. Run it first.

```r
# Build a mystery series of 400 mornings and check how many differences it needs
set.seed(5)
jolts   <- rnorm(402, sd = 5)
mystery <- jolts[3:402] + 0.7 * jolts[2:401] + 0.5 * jolts[1:400]

ndiffs(mystery)
#> [1] 0
round(1.96 / sqrt(400), 3)
#> [1] 0.098
```

So no differencing is needed here, which fixes d at 0, and any bar bigger than 0.098 counts.

Your job is the other two letters. Print the ACF values and the PACF values, hold each one against the band, decide which plot cuts and which one tails, and name the full order.

```r
# mystery holds 400 daily values and needs no differencing, so d = 0.
# Bars larger than 0.098 count; anything smaller is treated as zero.
# Print the first several ACF values and the first several PACF values,
# then say which plot cuts off and at which lag.
# Two lines. Press Check when you have them.
```
::check {"regex": "[pP]acf[(]\\s*mystery", "gate": true, "difficulty": "intermediate", "ok": "Yes. The ACF gives 0.634 and 0.336, then 0.077, and everything after that sits inside the 0.098 band, so it cuts off after lag 2. The PACF flips sign and fades with no clean stop. A cutting ACF with a tailing PACF is the moving-average row of the rule, so q = 2 and p = 0, and with d = 0 the order is ARIMA(0, 0, 2).", "no": "Print the two sets of numbers and hold each one against the 0.098 band. Try round(acf(mystery, plot = FALSE)$acf[2:7], 3) on one line, and round(pacf(mystery, plot = FALSE)$acf[1:6], 3) on the next."}
::solution
```r
# Read the ACF and the PACF of the mystery series and name its order
round(acf(mystery,  plot = FALSE)$acf[2:7], 3)
#> [1] 0.634 0.336 0.077 0.072 0.017 0.009
round(pacf(mystery, plot = FALSE)$acf[1:6], 3)
#> [1]  0.634 -0.110 -0.153  0.202 -0.116  0.000
```

The ACF holds two bars above 0.098 and then drops to 0.077 and smaller, which is a cut-off after lag 2. The PACF runs positive, negative, negative, positive, negative, fading without ever stopping, which is a tail. A cutting ACF, a tailing PACF and no differencing gives you ARIMA(0, 0, 2).

=== step === concept
## Why the best-fitting model is not the one to pick

The plots have handed us a shortlist. Something now has to choose among ARIMA(1, 1, 0), ARIMA(2, 1, 0) and ARIMA(1, 1, 1), and the obvious idea is to fit all three and keep whichever fits best.

That idea does not work, and it is worth seeing why before we reach for the thing that does.

The usual measure of fit is the **log-likelihood**: how probable the data you actually observed is under the fitted model, with bigger meaning a better fit. Let's fit Maya's series with one, two and three autoregressive terms and read it off each fit.

```r
# Fit three AR orders and print how well each one fits the data
fit_1 <- Arima(cups, order = c(1, 1, 0))
fit_2 <- Arima(cups, order = c(2, 1, 0))
fit_3 <- Arima(cups, order = c(3, 1, 0))

round(c("ARIMA(1,1,0)" = fit_1$loglik,
        "ARIMA(2,1,0)" = fit_2$loglik,
        "ARIMA(3,1,0)" = fit_3$loglik), 3)
#> ARIMA(1,1,0) ARIMA(2,1,0) ARIMA(3,1,0)
#>     -501.440     -501.408     -501.402
```

Three terms fits better than two, and two fits better than one. Every single time you add a term, the number goes up.

It has to. A model with an extra coefficient can always set that coefficient to zero and copy the smaller model exactly, so it can never come out worse. In Maya's case the second AR term bought 0.032 of log-likelihood and the third bought another 0.006, which is nothing at all, and fit alone would still hand you the biggest model on the list.

Follow that logic far enough and you end up with a model that has memorised 180 mornings of noise and forecasts next Tuesday badly. What we need is a score that pays attention to fit but charges rent for every term.

=== step === concept
## AICc: the score that charges for every term

That score exists. It is the **Akaike information criterion**, AIC, and it does exactly that.

\[ \text{AIC} = -2 \log L + 2k \]

Read it in two pieces. The first, \(-2 \log L\), is the fit turned upside down, so a better fit makes it smaller. The second, \(2k\), is the rent: k is the number of quantities the model had to estimate, and each one costs 2 points. Lower AIC is better.

For a short series that penalty is a little too soft, so in practice we use the corrected version, **AICc**, which adds a term that bites harder when the number of observations is not much larger than the number of parameters.

\[ \text{AICc} = \text{AIC} + \frac{2k(k+1)}{n-k-1} \]

Rather than take that on faith, let's work out the AICc of ARIMA(1, 1, 0) by hand and hold it against what the fit reports.

Maya's ARIMA(1, 1, 0) estimates two things: the coefficient on yesterday's change, and the size of the random nudges. So k = 2. And n is 179, not 180, because differencing consumed one morning and the model is fitted to the 179 changes.

```r
# Work out the AICc of ARIMA(1,1,0) by hand and check it against the fitted value
k <- 2
n <- length(cups_diff)

aic  <- -2 * fit_1$loglik + 2 * k
aicc <- aic + (2 * k * (k + 1)) / (n - k - 1)

round(aic, 3)
#> [1] 1006.88
round(aicc, 3)
#> [1] 1006.949
round(fit_1$aicc, 3)
#> [1] 1006.949
```

1006.949 by hand, 1006.949 from the fit. There is no black box in here.

Notice the size of the correction: 1006.949 against a plain AIC of 1006.88, so about seven hundredths of a point on 179 observations. On a series of 30 it would be doing real work.

[KEY INSIGHT]
AICc is a fair comparison, not a measure of quality. The number on its own means nothing at all. It only earns its keep when you put two models fitted to the same data side by side, and then the lower one wins.

=== step === concept
## How to score the shortlist and pick the winner

We have a shortlist and we have a score, so let's finish the job.

Along with the three orders the plots nominated, I have added ARIMA(0, 1, 1), the pure moving-average model. The plots ruled that one out when the ACF tailed instead of cutting, and it is here to show whether the score agrees with the reading.

```r
# Score the shortlist, and the order the plots ruled out, on the same footing
round(c("ARIMA(1,1,0)" = Arima(cups, order = c(1, 1, 0))$aicc,
        "ARIMA(2,1,0)" = Arima(cups, order = c(2, 1, 0))$aicc,
        "ARIMA(1,1,1)" = Arima(cups, order = c(1, 1, 1))$aicc,
        "ARIMA(0,1,1)" = Arima(cups, order = c(0, 1, 1))$aicc), 2)
#> ARIMA(1,1,0) ARIMA(2,1,0) ARIMA(1,1,1) ARIMA(0,1,1)
#>      1006.95      1008.95      1008.96      1023.35
```

ARIMA(1, 1, 0) wins at 1006.95.

Look at what the second AR term did. It bought 0.03 of log-likelihood and paid 2 points of rent, so ARIMA(2, 1, 0) lands 2 points worse at 1008.95. Swapping in a moving-average term instead does the same thing, 1008.96. Neither extra term earned its place.

And ARIMA(0, 1, 1), the one the plots threw out, scores 1023.35, more than 16 points adrift. The reading and the score agree here, and that is the outcome you want. They will not always agree, and that is not a disaster.

Now let's see the winner in full.

```r
# Print the winning fit and read its coefficient
fit_1
#> Series: cups
#> ARIMA(1,1,0)
#>
#> Coefficients:
#>         ar1
#>       0.550
#> s.e.  0.062
#>
#> sigma^2 = 15.93:  log likelihood = -501.44
#> AIC=1006.88   AICc=1006.95   BIC=1013.26
```

There is the payoff for building the series ourselves. The `ar1` coefficient comes back at 0.550, and the recipe we wrote used 0.55. We recovered both the order and the coefficient from 180 numbers, with nothing but two plots and one score.

The rest of that printout is worth a glance, since you will see it on every fit you run. The `s.e.` underneath the coefficient is its standard error, how much the 0.550 would be expected to shift if Maya handed you another 180 mornings. At 0.062 it is small enough that the coefficient is nowhere near zero, so that autoregressive term is doing real work. The `sigma^2` of 15.93 is the estimated size of the daily nudges. And BIC is a second scoring rule built like AIC but charging steeper rent per term, so it leans toward smaller models. It agrees here, and when it disagrees with AICc the two are answering slightly different questions rather than one of them being broken.

One last thing about that score, and it is the mistake I see most often.

```r
# Score the same series at three different values of d, the comparison to avoid
round(c("ARIMA(1,0,0)" = Arima(cups, order = c(1, 0, 0))$aicc,
        "ARIMA(1,1,0)" = Arima(cups, order = c(1, 1, 0))$aicc,
        "ARIMA(1,2,0)" = Arima(cups, order = c(1, 2, 0))$aicc), 2)
#> ARIMA(1,0,0) ARIMA(1,1,0) ARIMA(1,2,0)
#>      1084.63      1006.95      1036.46
```

Those three numbers look like a ranking. They are not one.

[WARNING]
Only compare AICc across models that share the same d. Differencing changes the data being modelled: 1084.63 was earned on 180 cup counts, 1006.95 on 179 changes, and 1036.46 on 178 changes of changes. Three different datasets means three scores on three different scales, so the smallest of them wins nothing. Settle d first, then compare orders inside it.

=== step === quiz
## Quick check: two orders, two points apart

You have fitted two candidates to the same differenced series. ARIMA(1, 1, 0) scores 1006.95 and ARIMA(2, 1, 0) scores 1008.95. Which one do you take, and why?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- ARIMA(2, 1, 0), because a model with more terms describes the data more fully. ::no
- ARIMA(1, 1, 0). A gap of about two points means the score cannot really separate them, and when two models are that close the simpler one wins. ::ok Exactly. The second AR term earned 0.03 of fit and was charged 2 points for it, which is the penalty doing its job. Fewer terms means fewer things estimated from the same 179 changes, and fewer things to go wrong on next week's mornings.
- ARIMA(2, 1, 0), because 1008.95 is the larger number and larger is better for AICc. ::no
- Neither yet. Refit both on a different stretch of the data until one of them clearly pulls ahead. ::no Lower AICc is better, and a gap of about two points or less is the range where two models count as practically tied. A tie is not broken by refitting until you like the answer, and it is not broken on the third decimal. It is broken on simplicity.

=== step === concept
## What auto.arima() picks, and how to judge it

There is a function that searches over orders and returns the best one it finds. It exists, it is good, and you should use it.

```r
# Let the automatic search choose an order for Maya's series
auto.arima(cups)
#> Series: cups
#> ARIMA(1,1,0)
#>
#> Coefficients:
#>         ar1
#>       0.550
#> s.e.  0.062
#>
#> sigma^2 = 15.93:  log likelihood = -501.44
#> AIC=1006.88   AICc=1006.95   BIC=1013.26
```

ARIMA(1, 1, 0), the same order we reached by hand, with the same coefficient.

So why bother with the long way round?

Because the function does not always land where you did, and when it disagrees with your reading somebody has to decide who is right. It runs a stepwise search that does not try every order, and it chooses on a score, so everything we just said about scores applies to it too. It will also cheerfully hand back a fitted model on a series where this whole approach was the wrong tool.

Somebody who only knows the function call has no way to referee any of that. You now do. You can read the two plots yourself, score the shortlist yourself, and see whether the search stopped somewhere sensible.

Use the automatic pick as a fast first answer and as a second opinion on your own. Trusting it is fine once you can check it.

=== step === quiz
## Quick check: which order would you shortlist?

A colleague hands you a new series. `ndiffs()` returns 1. On the differenced series the ACF has one bar outside the band at lag 1 and every bar after that sits inside it, while the PACF fades over five or six lags with no clean stop. Which order opens your shortlist?

::quiz {"correct": 2, "gate": true, "difficulty": "advanced"}
- ARIMA(1, 1, 0) ::no
- ARIMA(0, 1, 1) ::ok Right. The ACF cuts off after lag 1 and the PACF tails, which is the moving-average row of the rule, so q = 1 and p = 0. One difference was needed, so d = 1, and the shortlist opens with ARIMA(0, 1, 1).
- ARIMA(1, 1, 1) ::no
- ARIMA(0, 0, 1) ::no Take the letters one at a time. The plot that cuts off is the one holding a number, and here that is the ACF, stopping after lag 1, so q = 1 and there is no autoregressive term to find. Then d comes straight from `ndiffs()`, which said 1, so the middle slot cannot be 0.

=== step === tryit
## Your turn: score two candidates on Maya's series

Let's do the scoring once more, this time on your own.

Suppose a colleague looks at Maya's plots, decides that a single autoregressive term cannot be the whole story, and proposes ARIMA(2, 1, 1) instead of the ARIMA(1, 1, 0) we settled on. Both fits use d = 1, so they are scored on the same 179 changes and the comparison is fair.

Fit both, read the AICc off each, then say which one you would keep.

```r
# cups holds Maya's 180 mornings and the forecast package is already loaded.
# Fit ARIMA(1,1,0) and ARIMA(2,1,1) and read the aicc off each fit.
# Then decide which one you would keep, and why.
# Two lines. Press Check when you have them.
```
::check {"regex": "c[(]\\s*2\\s*,\\s*1\\s*,\\s*1\\s*[)][\\s\\S]*aicc", "gate": true, "difficulty": "intermediate", "ok": "Right. ARIMA(1,1,0) scores 1006.95 and ARIMA(2,1,1) scores 1011.02. The extra AR term and the extra MA term added almost nothing to the fit and were charged about 4 points for the privilege, so keep ARIMA(1,1,0). Wanting a bigger model is not the same as needing one, and the score is what tells the two apart.", "no": "Fit each order and pull the aicc straight off the fitted object. The first line is Arima(cups, order = c(1, 1, 0))$aicc, and the second is that same line with c(2, 1, 1) in it."}
::solution
```r
# Score the two candidates and keep the lower one
round(Arima(cups, order = c(1, 1, 0))$aicc, 2)
#> [1] 1006.95
round(Arima(cups, order = c(2, 1, 1))$aicc, 2)
#> [1] 1011.02
```

1006.95 against 1011.02, a gap of about 4 points, which is well outside the range where two models count as tied. The bigger model loses, and it loses because it paid rent on two extra coefficients that had nothing to add.

=== step === quiz
## Quick check: which AICc comparison means nothing?

Here are four fits of Maya's series and their AICc scores: ARIMA(1, 1, 0) at 1006.95, ARIMA(2, 1, 0) at 1008.95, ARIMA(0, 1, 1) at 1023.35, and ARIMA(1, 0, 0) at 1084.63. Three of the comparisons below are fair. Which one tells you nothing?

::quiz {"correct": 3, "gate": true, "difficulty": "advanced"}
- ARIMA(1, 1, 0) at 1006.95 against ARIMA(2, 1, 0) at 1008.95 ::no
- ARIMA(1, 1, 0) at 1006.95 against ARIMA(0, 1, 1) at 1023.35 ::no
- ARIMA(1, 1, 0) at 1006.95 against ARIMA(1, 0, 0) at 1084.63 ::ok That is the one. The 1006.95 was earned on 179 daily changes and the 1084.63 on 180 raw cup counts, so the two scores were computed on different data and sit on different scales. A number 78 points lower on a different dataset has won nothing.
- ARIMA(2, 1, 0) at 1008.95 against ARIMA(0, 1, 1) at 1023.35 ::no Check the middle number of each pair before you compare anything. Three of these four hold d fixed at 1, so both fits in the pair are scored on the same 179 changes and the lower number genuinely wins. The odd pair mixes d = 0 with d = 1, and those two fits never saw the same data.

=== step === concept
## References

- [Time Series Analysis: Forecasting and Control](https://doi.org/10.1002/9781118619193) - Box, Jenkins, Reinsel and Ljung (2015), 5th edition, Wiley. Chapters 6 and 7 are the identification stage this procedure comes from.
- [Forecasting: Principles and Practice, chapter 9](https://otexts.com/fpp3/arima.html) - Hyndman and Athanasopoulos (2021), 3rd edition, OTexts. The ACF and PACF reading rules, with worked examples.
- [Automatic Time Series Forecasting: The forecast Package for R](https://doi.org/10.18637/jss.v027.i03) - Hyndman and Khandakar (2008), Journal of Statistical Software 27(3). What the automatic search actually does.
- [Model Selection and Multimodel Inference](https://doi.org/10.1007/b97636) - Burnham and Anderson (2002), 2nd edition, Springer. The source of AICc, and of the rule of thumb about differences of about two points.
- [ARIMA Modelling of Time Series](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/arima.html) - R Core Team, the documentation behind `Arima()`.

=== step === complete
## Quick recap

You just chose an ARIMA order for a real series without guessing once, and the same three steps work on any series you meet.

- **Take the growth out.** Maya's cups climbed from an average of 242.6 to 304.6, so nothing could be read off them. One pass of `diff()` flattened that into changes hovering around 0.73, and `ndiffs()` confirmed one pass was enough. That fixed d = 1.
- **Read the two plots.** Her PACF was 0.542 at lag 1 with nothing outside the 0.146 band after it, a clean cut-off, so p = 1. Her ACF went 0.542, 0.302, 0.158, tracking the powers of 0.542 and fading rather than stopping, so there was no moving-average term and q = 0.
- **Score the shortlist.** ARIMA(1, 1, 0) came in at 1006.95 against 1008.95 and 1008.96 for its two neighbours. A second term bought 0.03 of fit and cost 2 points, so the simplest model on the shortlist won.
- And the recipe that built the series used 0.55. The fit came back with 0.550.

Two rules are worth carrying out of here. The plot that cuts off is the one holding a number, and the plot that tails is telling you that term is not there. And an AICc only means something against another AICc fitted to the same data, which means the same d.

So the next time somebody asks how you picked ARIMA(1, 1, 0), you have a real answer with three parts to it.

The order is only half the job, though. A chosen model still has to prove it left nothing behind, and that comes down to looking hard at what the model could not explain. Congratulations on getting through this one, and enjoy your coffee.
