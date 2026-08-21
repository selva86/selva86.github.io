---
title: "ARIMA diagnostics: the two checks before you trust a forecast"
slug: "ARIMA-Mini-4"
description: "An ARIMA printout never tells you what the model missed, but its leftovers do. Run the eyeball check and the Ljung-Box test on 180 days of coffee sales."
keywords: "ARIMA diagnostics, residual diagnostics in R, Ljung-Box test, Box.test fitdf, ACF of residuals, white noise residuals, checking an ARIMA model, forecast residuals"
mathjax: true
webr: true
date: "2026-08-22"
post_type: "LESSON"
course_id: "arima-from-zero"
course_title: "ARIMA from Zero"
course_lesson: "4"
course_total: "7"
course_landing: "/dashboard.html"
course_prev: "ARIMA-Mini-3"
course_next: ""
curriculum_id: "0.0.18"
lesson_access: "windowed"
catalog_blurb: "The two checks that tell you whether a fitted forecast model missed something."
---

=== step === cover
::eyebrow ARIMA from Zero
## ARIMA diagnostics: the two checks before you trust a forecast

Let's say you run a coffee shop and you have six months of daily cup counts sitting in a spreadsheet. You fit an ARIMA to them, the printout comes back with ordinary looking coefficients, and nothing on the screen suggests a problem.

Nothing on that screen ever will. A model printout tells you what the model found. It never tells you what the model walked straight past.

So here is a habit worth building. Once the model has made its predictions, put the forecasts aside for a minute and look at what is left over. That is, for each day, take what actually happened and subtract what the model had guessed for that same day.

If the model really did capture the pattern, those leftovers should look like pure static. No shape, no drift, no rhythm, nothing you could predict.

And if a pattern is still sitting in them, then the model missed something real, and every forecast it makes from here on is going to pay for it.

There are two checks that find this out. One is an eyeball check on a couple of plots, and the other is a formal test called the Ljung-Box test. Between them they take about a minute, and they regularly catch models that looked perfectly fine. Today we run both.

::widget process-flow {"steps":[{"title":"Take the leftovers","sub":"what happened each day, minus what was predicted"},{"title":"Look at them","sub":"once over time, once against their own past"},{"title":"Test them","sub":"one Ljung-Box p-value that pools it all"}]}

I build the shop's numbers by hand, with something hidden inside them on purpose, so that when the checks speak up we can turn around and confirm they were right.

=== step === concept
## 180 days of coffee sales, and the ARIMA fitted to them

Let's get the series on the table first, because everything after this is computed from it.

The shop has been open for 180 trading days. Sales climb slowly over those six months, from a bit under 300 cups a day to a bit under 400, with the usual daily wobble on top of that climb. And I am putting one more thing in on purpose, which is a weekly rhythm: Friday runs about 4 cups above a plain weekday, Saturday about 9 and Sunday about 5. That is the thing I want the two checks to find later.

Press Run.

```r
# Build the shop's 180 trading days of cups sold and plot them
set.seed(4)
dow  <- rep(c("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"), length.out = 180)
bump <- c(Mon = 0, Tue = 0, Wed = 0, Thu = 0, Fri = 4, Sat = 9, Sun = 5)
cups <- as.numeric(round(280 + cumsum(arima.sim(list(ar = 0.55), n = 180, sd = 3) + 0.7) + bump[dow]))

plot(cups, type = "l", col = "steelblue", lwd = 2,
     main = "Cups sold at the shop, 180 trading days",
     xlab = "Trading day", ylab = "Cups sold")

c(day_1 = cups[1], day_180 = cups[180], days = length(cups))
#>   day_1 day_180    days
#>     284     391     180
```

The shop sold 284 cups on day 1 and 391 on day 180, and you can see that climb in the line easily enough. The weekly rhythm is in there too. However, at this scale it is buried in the daily wobble, which is exactly the situation you are usually in with a real series.

Now let's fit a model to it. An ARIMA(1, 1, 1) takes one difference to flatten the climb, uses one autoregressive term and one moving average term, and knows nothing whatsoever about calendars.

```r
# Fit an ARIMA(1,1,1) to the cup counts and read what it reports
fit_plain <- arima(cups, order = c(1, 1, 1))
fit_plain
#>
#> Call:
#> arima(x = cups, order = c(1, 1, 1))
#>
#> Coefficients:
#>           ar1     ma1
#>       -0.1086  0.5837
#> s.e.   0.1211  0.0908
#>
#> sigma^2 estimated as 19.35:  log likelihood = -519.3,  aic = 1044.6
```

Read that printout for a second and try to spot the problem in it.

You cannot. The two coefficients are ordinary sized numbers with ordinary sized standard errors. `sigma^2` is the variance of the model's own errors, and 19.35 is just a number until you have something to compare it against. The AIC is 1044.6, which also means nothing on its own.

So every line here describes what the model fitted. Not one of them describes what the model ignored.

=== step === concept
## The gap between what happened and what the model guessed

The proper word for a leftover is **residual**, and it has a precise meaning that is worth getting exactly right.

So take day 100. The model looks at every day up to day 99, makes its best guess for day 100, and then you find out what actually happened that day. The residual for day 100 is the second number minus the first. It is a one day ahead miss, measured after the fact, on data the model has already seen.

That is a different thing from a forecast error for next week, which you cannot know yet. And it is a different thing again from an error in a coefficient. It is a miss, in cups, on one particular day.

The `residuals()` function hands you all 180 of them at once. And the easiest way to see what they are is to put them beside the numbers they came from.

```r
# Line up the first six days as what happened, what the model guessed, and the gap
res_plain    <- residuals(fit_plain)
fitted_plain <- cups - res_plain

head(data.frame(day       = 1:180,
                actual    = cups,
                predicted = round(as.numeric(fitted_plain), 1),
                leftover  = round(as.numeric(res_plain), 1)))
#>   day actual predicted leftover
#> 1   1    284     283.7      0.3
#> 2   2    286     284.2      1.8
#> 3   3    288     286.8      1.2
#> 4   4    289     288.5      0.5
#> 5   5    298     289.2      8.8
#> 6   6    306     302.1      3.9
```

Read across row 5. The shop sold 298 cups that day and the model had guessed 289.2, so the model came up 8.8 cups short. That 8.8 is the leftover for day 5.

Now notice the second line of the code. The model's prediction for a day is just that day's actual value minus its residual, which is the same equation rearranged. There is nothing else in a residual.

[KEY INSIGHT]
A residual is a one day ahead forecast error that you already know the answer to. So any pattern still living in the residuals is pattern you could have forecast and did not. That one sentence is the reason everything that follows works.

=== step === quiz
## Quick check: what a leftover actually is

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- The gap between a coefficient the model estimated and its true value. ::no
- What actually happened on a given day, minus what the model predicted for that same day. ::ok Exactly. It is measured one day at a time, after the fact, on days the model has already seen. Row 5 of the table was 298 minus 289.2, which is 8.8 cups.
- The gap between the forecast for tomorrow and whatever tomorrow turns out to be. ::no
- Whatever is left of the series after the differencing step has flattened the climb. ::no A residual is not about coefficients, not about tomorrow, and not about differencing. It is one day's miss: the actual value minus the value the model predicted for that same day, which is why you can compute all 180 of them the moment the model is fitted.

=== step === concept
## What pure static looks like, and what trouble looks like

Before we look at the shop's leftovers, it helps to know what we are looking for. There are three shapes worth being able to recognise on sight, so let's draw made up leftovers of each kind and put them one above the other.

```r
# Draw three sets of made-up leftovers: flat static, a widening funnel, a weekly rhythm
set.seed(21)
demo_funnel <- rnorm(180) * seq(1, 6, length.out = 180)
demo_flat   <- rnorm(180)
demo_rhythm <- rnorm(180) + 3 * sin(2 * pi * (1:180) / 7)

par(mfrow = c(3, 1), mar = c(4, 4, 3, 1))
plot(demo_flat, type = "h", col = "grey45",
     main = "Pure static: flat, even, centred on zero",
     xlab = "Day", ylab = "Leftover")
abline(h = 0, col = "steelblue", lwd = 2)
plot(demo_funnel, type = "h", col = "grey45",
     main = "A widening funnel: the misses grow as time passes",
     xlab = "Day", ylab = "Leftover")
abline(h = 0, col = "steelblue", lwd = 2)
plot(demo_rhythm[1:60], type = "o", pch = 16, col = "grey45",
     main = "A repeating rhythm: the same shape every seven days",
     xlab = "Day", ylab = "Leftover")
abline(h = 0, col = "steelblue", lwd = 2)
par(mfrow = c(1, 1))
```

The top panel is what you want to see. The bars sit on either side of zero, they are about as tall on the left as they are on the right, and knowing one of them tells you nothing at all about the next one.

The middle panel is a funnel. The misses start small and end large, so the model is far more reliable early on than it is later, and any single number you quote for its accuracy is going to be wrong at both ends.

The bottom panel is a rhythm, and it is drawn over the first six weeks only, because across all 180 days the wave packs too tightly to see. Count the peaks and there is one every seven days. If you knew today's leftover you could make a decent guess at the one seven days from now, which means the model left something behind that it could have used.

So those are the three verdicts your eye can hand you: fine, spread growing, or pattern repeating.

=== step === concept
## The leftovers, plotted day by day

Now let's look at the real ones. It is the same plot, this time with the shop's own 180 misses in it.

```r
# Plot the shop leftovers day by day and summarise their centre and spread
plot(as.numeric(res_plain), type = "h", col = "grey45",
     main = "The 180 leftovers, day by day",
     xlab = "Trading day", ylab = "Cups (actual minus predicted)")
abline(h = 0, col = "steelblue", lwd = 2)

round(c(mean = mean(res_plain), sd = sd(res_plain)), 2)
#> mean   sd
#> 0.42 4.38
```

This one passes. The bars sit on both sides of the zero line rather than drifting above it or below it, and the band they fill is about as wide at day 170 as it was at day 10. There is no funnel here.

The two numbers agree with the picture. The average miss is 0.42 cups, and next to a typical miss of 4.38 cups that is close enough to zero to say the model is not running consistently high or low.

On this plot, the eye finds nothing at all.

And that is exactly why the second check exists. A weekly rhythm of four or five cups, sitting inside a wobble of four and a half cups, is not something a human eye can pick out of 180 grey bars. So we have to ask the leftovers a sharper question.

=== step === concept
## Does today's leftover know anything about last week's?

Here is that sharper question, and it is the one that does the real work.

Take the 180 leftovers, shift the whole series along by one day, and see how strongly the shifted copy moves with the original. That number is the **autocorrelation at lag 1**. Then do it again shifted by two days, which gives you lag 2, and so on. Each one is an ordinary correlation, running from minus 1 to plus 1, between the leftovers and their own past.

If the leftovers really are static, every one of those correlations should sit near zero. Notice that I said near zero and not exactly zero, because with only 180 numbers you pick up a bit of correlation by luck alone. And the width of that luck is known:

\[ \text{noise band} = \frac{1.96}{\sqrt{n}} \]

With \(n = 180\) that comes to 0.146. So any bar sitting inside 0.146 is indistinguishable from nothing at all. The `acf()` function computes every lag at once and draws that band for you as a pair of dashed lines.

```r
# Plot the leftovers against their own past and print the width of the noise band
band <- 1.96 / sqrt(length(res_plain))
round(band, 3)
#> [1] 0.146

acf(res_plain, lag.max = 20,
    main = "How much each leftover knows about an earlier one")

acf_vals <- acf(res_plain, lag.max = 20, plot = FALSE)$acf[-1]
round(acf_vals[c(7, 14)], 3)
#> [1] 0.499 0.454
```

Ignore the bar at lag 0. That one is every series correlated with itself, so it is always exactly 1 and it carries no information.

Now look at lag 7. It stands at 0.499, which is more than three times the height of the band. Lag 14 is nearly as tall at 0.454. Between them the bars mostly stay small, and a few dip below the band on the low side.

Read that out loud and it turns into a sentence about the shop. A leftover today moves with the leftover from seven days ago, strongly and week after week. The eye told us these misses were static. They are not static at all. They run on a weekly clock.

[NOTE]
`$acf[-1]` drops the lag 0 entry so the numbers you handle line up with the lags you care about, which makes `acf_vals[7]` the value at lag 7. Forgetting that `[-1]` is the single most common way to read the wrong bar.

=== step === concept
## The model is wrong the same way every Friday and every Sunday

A bar at lag 7 tells you there is a seven day clock running. It does not tell you which days it is getting wrong. So to find that out, let's average the leftovers by weekday.

```r
# Average the leftover for each day of the week
weekday <- factor(dow, levels = c("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"))
round(tapply(as.numeric(res_plain), weekday, mean), 1)
#>  Mon  Tue  Wed  Thu  Fri  Sat  Sun
#> -1.3  1.6 -0.4  0.6  4.5  3.8 -5.9
```

There it is, in cups. On an average Friday the model guesses 4.5 cups too low. On an average Saturday it is 3.8 cups too low. And on an average Sunday it swings the other way and guesses 5.9 cups too high.

That is not bad luck, and it is not a run of odd weekends. It is the same mistake, in the same direction, every single week for six months, because the model was never told that the week exists. It only ever saw a column of numbers in order.

Now, there is something here worth pausing on. I put 4, 9 and 5 extra cups into Friday, Saturday and Sunday when I built the series, and yet the leftovers report 4.5, 3.8 and minus 5.9. Those do not match, and they should not. An ARIMA(1, 1, 1) works on day to day differences, so it partly chases Saturday's jump one day late and then overshoots into Sunday. So the leftovers are not the pattern you hid. They are whatever the model failed to absorb of it.

[KEY INSIGHT]
Anything you can describe in a sentence like "it is wrong by about 5 cups every Sunday" is forecastable. You could add 5 cups to every Sunday by hand and beat the model. So when a check tells you the leftovers have a rhythm, it is telling you how much money the model is leaving on the table.

=== step === quiz
## Quick check: reading a bar that breaks the band

The shop's leftovers gave an autocorrelation of 0.499 at lag 7, against a band of 0.146. What does that bar tell you?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- Not much on its own. Draw twenty bars and one or two will always poke out by chance. ::no
- Leftovers seven days apart still move together, so the model repeats the same miss on the same weekday and could have predicted it. ::ok That is it. A bar this far outside the band is not luck, it is structure, and structure in the leftovers is structure the model could have used.
- That the sales series has a weekly pattern in it, which is normal for a shop and not a problem. ::no
- That the forecasts run too high, because the bar is on the positive side. ::no The band at 0.146 is drawn exactly where pure luck lives for 180 observations, and 0.499 is more than three times that, so chance is not a serious explanation. The sign of the bar says nothing about running high or low either. What the bar reports is that the leftovers can still be predicted from their own past, and a weekly pattern in the sales is only a problem when the model failed to absorb it, which is precisely what these leftovers are telling you.

=== step === tryit
## Your turn: count the bars that break the band

Two of those bars were obviously tall. Now let's put a number on the whole picture instead of trusting an impression.

Work over the first 14 lags, which is two full weeks. Compute the band yourself, pull the autocorrelations out of `acf()` with `plot = FALSE`, drop the lag 0 entry, and count how many of them sit further from zero than the band in either direction.

```r
# res_plain holds the 180 leftovers of the model that was never told about the week
ex_band <- 1.96 / sqrt(length(res_plain))
# Now get the first 14 autocorrelations with acf(res_plain, lag.max = 14, plot = FALSE)$acf[-1]
# and count how many are further from zero than ex_band.
# Two lines. Press Check when you have them.
```
::check {"regex": "sum\\s*[(]\\s*abs\\s*[(].+[)]\\s*>\\s*(ex_)?band", "gate": true, "difficulty": "beginner", "ok": "Five of the first fourteen, at lags 5, 7, 9, 12 and 14. The two tall ones are 7 and 14, one week apart and two weeks apart, which is the signature of a rhythm the model never learned.", "no": "Store the autocorrelations first, then count them: `ex_acf <- acf(res_plain, lag.max = 14, plot = FALSE)$acf[-1]`, then `sum(abs(ex_acf) > ex_band)`."}
::solution
```r
# Count how many of the first 14 autocorrelations sit outside the noise band
ex_band <- 1.96 / sqrt(length(res_plain))
ex_acf  <- acf(res_plain, lag.max = 14, plot = FALSE)$acf[-1]

sum(abs(ex_acf) > ex_band)
#> [1] 5
which(abs(ex_acf) > ex_band)
#> [1]  5  7  9 12 14
```

Five out of the fourteen break the band. If these leftovers were pure static you would expect about one of them to, because the band is drawn to let 5% through by design.

=== step === concept
## The Ljung-Box test turns fourteen bars into one number

Counting bars by hand is fine when you have one model. It stops being fine the moment you are comparing four candidate models, or fitting one model per store per week. And it always leaves you arguing about whether a bar that just grazes the line should count.

So there is a test that asks the whole question at once: taken together, are these autocorrelations all close enough to zero to be luck? It squares each one, weights it, and adds them up into a single number written \(Q^*\).

\[ Q^* = n(n+2) \sum_{k=1}^{h} \frac{\hat{\rho}_k^{2}}{n-k} \]

Every symbol in there is something you already have. \(n\) is the number of leftovers, which is 180 here. \(h\) is how many lags you pool, and \(\hat{\rho}_k\) is the autocorrelation at lag \(k\), which is the exact set of numbers you just counted. The squaring is what makes the sign stop mattering, so a bar at minus 0.28 pushes the total up just as hard as one at plus 0.28.

There are two decisions to make before you run it.

1. **How many lags to pool.** A common convention is 10 lags for a series with no season in it, and twice the length of the season when there is one. We are hunting a seven day rhythm, so 14 covers two full turns of it.
2. **How many coefficients you fitted.** That is the `fitdf` argument, and it matters far more than a small argument like that looks. Our model fitted two, one AR term and one MA term.

```r
# Pool the first 14 autocorrelations into one Ljung-Box verdict
lb_plain <- Box.test(res_plain, lag = 14, type = "Ljung-Box", fitdf = 2)
lb_plain
#>
#> 	Box-Ljung test
#>
#> data:  res_plain
#> X-squared = 139, df = 12, p-value < 2.2e-16
```

`Box.test()` prints the statistic under the label `X-squared`. That is the same \(Q^*\) the formula defines, just labelled the way R labels every statistic it compares against a chi-squared distribution.

So the fourteen bars have collapsed into one number, 139, and a p-value so small that R gives up reporting it precisely and prints it as below 2.2e-16.

That p-value is the verdict, and reading it the right way round is the part that trips almost everybody up.

=== step === concept
## Why the test has to know how many coefficients you fitted

The `fitdf = 2` in that call is small and easy to forget, and forgetting it changes the answer.

Here is why it exists. You did not know the right model in advance. You estimated `ar1` and `ma1` from this very data, and the fitting process picked the values that make the leftovers look as uncorrelated as it could manage. So the leftovers were already tuned, a little, in the direction of passing this very test. And if the test judged them as though nothing had been estimated, it would be marking its own homework.

The fix is to spend some degrees of freedom on it. The test judges \(Q^*\) against a chi-squared distribution, and the shape of that distribution is set by its degrees of freedom, which is the number of lags minus the number of terms you fitted.

For `fitdf` you count the AR and MA terms, which are the first and the last number in `ARIMA(1, 1, 1)`, and the seasonal ones too when there are any. You never count a mean, a drift or an intercept, because those are not autoregressive or moving average terms.

Our model has one AR term and one MA term, so `fitdf = 2`, and the degrees of freedom become 14 minus 2, which is 12. Let's run it both ways and put the two 5% cutoffs beside them.

```r
# Run the same test with and without the two fitted coefficients declared
Box.test(res_plain, lag = 14, type = "Ljung-Box", fitdf = 2)
#>
#> 	Box-Ljung test
#>
#> data:  res_plain
#> X-squared = 139, df = 12, p-value < 2.2e-16
Box.test(res_plain, lag = 14, type = "Ljung-Box", fitdf = 0)
#>
#> 	Box-Ljung test
#>
#> data:  res_plain
#> X-squared = 139, df = 14, p-value < 2.2e-16

round(c(cutoff_at_df_12 = qchisq(0.95, df = 12),
        cutoff_at_df_14 = qchisq(0.95, df = 14)), 2)
#> cutoff_at_df_12 cutoff_at_df_14
#>           21.03           23.68
```

The statistic itself does not budge. It is 139 in both calls, because `fitdf` plays no part in computing it.

What moves is the bar it has to clear. At 12 degrees of freedom a statistic has to reach 21.03 before the test calls it surprising at the 5% level. At 14 that bar sits higher, at 23.68. So declaring your two coefficients lowers the bar, and a lower bar makes the test harder to pass.

[WARNING]
Leave `fitdf` at its default of 0 and the test always flatters your model. It can never make a good model look bad, only make a bad model look acceptable, which is the worse direction for a mistake to run in. Here it changes nothing, because 139 clears both bars easily, but on a borderline model it decides the verdict.

=== step === concept
## Why a small p-value is the bad news here

Every hypothesis test starts by assuming something boring, and then asks how strange your data would look inside that assumption. The boring assumption here is called the **null hypothesis**, and for Ljung-Box it says this:

> The leftovers have no autocorrelation at all, out to the lag you tested.

That is white noise. And that is the thing you are hoping is true.

So the direction you read this in is flipped, compared with most tests you meet. A large p-value means the data sits comfortably inside the boring story, so nothing was found and the model survives. A small p-value means the data would be strange inside the boring story, so the boring story gets rejected, and here that means pattern remains.

A small p-value is bad news. Say that one twice, because it is the opposite of the habit most people bring to a p-value.

A picture makes it concrete. The curve below is what \(Q^*\) does when the leftovers really are static and 12 degrees of freedom are in play. It usually lands somewhere near 12, which is just its degrees of freedom over again, and only 5% of the time does it get past 21.03, which is the shaded slice on the right.

```r
# Draw the curve the pooled statistic is compared against, with the 5 percent tail shaded
cutoff <- qchisq(0.95, df = 12)

curve(dchisq(x, df = 12), from = 0, to = 40, lwd = 2, col = "steelblue",
      main = "What the statistic does when nothing is left over (12 degrees of freedom)",
      xlab = "Value of the pooled statistic", ylab = "How often that value turns up")
tail_x <- seq(cutoff, 40, length.out = 200)
polygon(c(cutoff, tail_x, 40), c(0, dchisq(tail_x, df = 12), 0),
        col = "#e8a33d", border = NA)
abline(v = cutoff, lwd = 2, lty = 2)
text(cutoff, 0.035, paste0(" 5 percent cutoff = ", round(cutoff, 2)), pos = 4)
arrows(x0 = 30, y0 = 0.065, x1 = 39.5, y1 = 0.065, length = 0.12, lwd = 2)
text(30, 0.065, "our statistic lands out here ", pos = 2)

round(c(cutoff = cutoff, our_statistic = as.numeric(lb_plain$statistic)), 2)
#>        cutoff our_statistic
#>         21.03        139.00
```

The chart runs to 40 and our statistic is 139, which is why it needed an arrow instead of a line. It sits three and a half times past the right hand edge of the picture. And how often a number that far out turns up by chance is exactly what the p-value below 2.2e-16 is reporting.

So this verdict is not a close one. The model has failed, and it failed on the one thing an ARIMA exists to do, which is to leave nothing forecastable behind.

=== step === concept
## Giving the model the week it was missing

A failed check is a lot more useful than a passed one, because it names its own repair. The bar was at lag 7 and the weekday table pointed straight at Friday and Sunday, so the missing piece is a seven day season.

You add one with the `seasonal` argument. Writing `order = c(0, 1, 1)` with `period = 7` means two things in plain words: compare each day with the same weekday a week earlier, which is the 1 in the middle, and let the model carry one seasonal moving average term, which is the 1 on the right.

That is one extra fitted term, so `fitdf` goes from 2 to 3.

```r
# Refit with a weekly term, then run both checks on the new leftovers
fit_week <- arima(cups, order = c(1, 1, 1),
                  seasonal = list(order = c(0, 1, 1), period = 7))
res_week <- residuals(fit_week)

acf(res_week, lag.max = 20,
    main = "The same picture once the model is told about the week")

Box.test(res_week, lag = 14, type = "Ljung-Box", fitdf = 3)
#>
#> 	Box-Ljung test
#>
#> data:  res_week
#> X-squared = 9.8569, df = 11, p-value = 0.5433
```

Now compare that plot with the one we had before. The towers at 7 and 14 are gone, and every single bar sits inside the dashed band. The eye is satisfied.

And the test agrees with it. The pooled statistic dropped from 139 to 9.86, which is an unremarkable value to see on 11 degrees of freedom, and the p-value came back at 0.5433. Nothing was found. Both checks pass.

[NOTE]
Passing means only that these leftovers carry no rhythm the test could find out to 14 lags. It is not a certificate that the model is right, and the sentence it earns you is "there is nothing more this check can tell me", not "ship it and stop looking".

=== step === tryit
## Your turn: run the test without the adjustment

Now let's find out what a forgotten `fitdf` would have cost on a model whose verdict is not obvious.

`res_week` holds the repaired leftovers, and they just passed at p = 0.5433 with `fitdf = 3`. Run the very same test on them at `lag = 14`, but set `fitdf = 0`, which is what you get if you leave the argument out entirely. Then compare the two df values and the two p-values.

```r
# res_week holds the leftovers of the model that was given the week
# Run the same Ljung-Box test on res_week at lag = 14, this time with fitdf = 0.
# One line. Press Check when you have it.
```
::check {"regex": "fitdf\\s*=\\s*0", "gate": true, "difficulty": "intermediate", "ok": "There it is. The statistic does not move at all, 9.86 either way. Only the yardstick moves: 11 degrees of freedom becomes 14, and the p-value climbs from 0.5433 to 0.7726. Forgetting fitdf never makes a model look worse than it is, only better.", "no": "One line, the same `Box.test()` call on `res_week` with `lag = 14` and the Ljung-Box type, adding `fitdf = 0` to it."}
::solution
```r
# Run the same test on the repaired leftovers without declaring the fitted coefficients
Box.test(res_week, lag = 14, type = "Ljung-Box", fitdf = 0)
#>
#> 	Box-Ljung test
#>
#> data:  res_week
#> X-squared = 9.8569, df = 14, p-value = 0.7726
```

It is the same 9.86, and the p-value goes from 0.5433 to 0.7726. On this model the verdict survives either way. But on a model sitting at 0.04 with the adjustment in place, that same slip lifts it over 0.05, and you ship something you should have fixed.

=== step === concept
## What the missing week was costing every day-ahead forecast

A failed diagnostic can feel like a formality until somebody puts a price on it. So let's put a price on this one, in cups, for the shop.

There are two numbers worth comparing between the model that knew about the week and the model that did not. The first is the typical size of a one day ahead miss. The second is the width of the 95% interval the model quotes around tomorrow's forecast.

```r
# Compare the two models on a typical day-ahead miss and on the width of a forecast interval
miss_plain <- mean(abs(res_plain))
miss_week  <- mean(abs(res_week))
se_plain   <- as.numeric(predict(fit_plain, n.ahead = 1)$se)
se_week    <- as.numeric(predict(fit_week,  n.ahead = 1)$se)

round(c(typical_miss_without_week = miss_plain,
        typical_miss_with_week    = miss_week,
        interval_width_without    = 2 * 1.96 * se_plain,
        interval_width_with       = 2 * 1.96 * se_week), 1)
#> typical_miss_without_week    typical_miss_with_week    interval_width_without
#>                       3.6                       2.2                      17.2
#>       interval_width_with
#>                      11.3
```

The average day ahead miss falls from 3.6 cups to 2.2, so roughly four in every ten cups of error were the missing week and nothing else. The interval narrows from 17.2 cups wide to 11.3. It is the same data, the same six months and the same shop. The only thing that changed was telling the model that Saturday exists.

And that is the general shape of it. Leftover rhythm is forecastable signal, so it shows up twice: once as bigger misses, and once as intervals that have to be wider to cover a model that keeps being wrong in a way it could have avoided.

The dial below runs the same disease in a setting where the damage is easy to measure exactly. It fits a straight trend line thousands of times over, and each time it checks whether the 95% interval it quoted actually contained the truth. Drag the severity up and each error becomes more tied to the one before it. That is autocorrelation, the same thing the bar at lag 7 was reporting.

::widget assumption-dial {"assumption": "autocorrelation", "start": 0}

Watch the two readouts move in opposite directions. Coverage falls away from the 95% it promised, while the fit statistic holds still or even improves. That is the whole trap in one picture: correlated errors make a model look better on the summary line and leave its uncertainty statement badly wrong.

=== step === concept
## A funnel sails straight through the Ljung-Box test

There is one more thing you need before you can lean on any of this, and it is the reason the eyeball check keeps its place.

Ljung-Box only ever looks for one fault. It pools autocorrelations, so it answers the question "is there a rhythm here?" and no other question at all. Hand it leftovers whose spread grows steadily and it has nothing to say about them, because a growing spread does not produce autocorrelation.

Let's take the funnel from earlier and put it through the test.

```r
# Plot the widening leftovers and ask Ljung-Box for a verdict on them
plot(demo_funnel, type = "h", col = "grey45",
     main = "Leftovers whose spread keeps growing",
     xlab = "Day", ylab = "Leftover")
abline(h = 0, col = "steelblue", lwd = 2)

round(c(sd_first_30 = sd(demo_funnel[1:30]), sd_last_30 = sd(demo_funnel[151:180])), 2)
#> sd_first_30  sd_last_30
#>        1.37        5.52

Box.test(demo_funnel, lag = 14, type = "Ljung-Box")
#>
#> 	Box-Ljung test
#>
#> data:  demo_funnel
#> X-squared = 15.285, df = 14, p-value = 0.359
```

The misses in the last month are four times as wide as the misses in the first month, 5.52 against 1.37, and you can see that in the plot without measuring anything. The test hands back p = 0.359 and finds nothing wrong.

Both of those readings are correct. There genuinely is no rhythm in that series, and a rhythm is all the test was ever asked about. It is simply blind to the fault that is actually there.

A funnel is worth catching because it breaks your intervals rather than your forecasts. Quote one interval width for a model like this and it is too wide early on and far too narrow later, exactly when the stakes are highest. The usual repairs are modelling the logarithm of the series instead of the series itself, or fitting a model that lets the variance change over time.

[WARNING]
A large Ljung-Box p-value licenses one sentence and one only: no leftover rhythm was found out to the lag tested. It says nothing about growing spread, nothing about a wrong shape, and nothing about whether the model is right. Run your eyes over the plot every time.

=== step === quiz
## Quick check: the ACF is clean but the spread keeps growing

Let's say you fit a model to two years of daily orders. Every bar of the leftovers' ACF sits inside the band, and Ljung-Box comes back at p = 0.36. The plot of those leftovers over time, though, is clearly wider on the right than it is on the left.

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- The leftovers are white noise, so the model has passed and the forecasts can be trusted. ::no
- The test and the plot contradict each other, so one of the two must have been computed wrongly. ::no
- Only that no rhythm was found. The widening spread is invisible to this test, so the intervals are still wrong even though the p-value is large. ::ok Exactly right. The two checks answer different questions, and here only one of them has been answered.
- The model should be rejected, because p = 0.36 fails at the 0.05 level. ::no A large p-value is a pass for this test, not a fail, so nothing was rejected. And the plot is not contradicting anything: Ljung-Box pools autocorrelations, so a growing spread gives it no signal to find. The model has cleared the rhythm check and failed the eye, which means the point forecasts may be fine while every interval it quotes is the wrong width.

=== step === quiz
## Quick check: what the p-value did and did not say

The repaired shop model came back with a pooled statistic of 9.86 on 11 degrees of freedom and p = 0.5433. Which reading of that is right?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- There is a 54% chance that the leftovers are white noise. ::no
- The pooled autocorrelation is no bigger than you would routinely get from leftovers with no rhythm in them, so this check found nothing to fix. ::ok Yes. It starts by assuming there is no rhythm and reports how ordinary our leftovers would be inside that assumption. It never puts a probability on the model being right.
- A small p-value would have been the good news, since small p-values mean strong evidence for a model. ::no
- Dropping fitdf back to 0 would change nothing, since the statistic comes out at 9.86 either way. ::no A p-value never gives the probability that something is true; it says how ordinary your data would look if the boring story held. Here the boring story is the one you want, which is why small is bad news and large is a pass. And fitdf does change the answer even though the statistic sits still: the same 9.86 read against 11 degrees of freedom gives 0.5433, and against 14 it gives 0.7726.

=== step === tryit
## Your turn: run both checks on a second shop

This is the last one, and it is the whole routine end to end, on numbers you have not seen.

The block below builds a second and smaller shop, with 126 trading days and one day of the week that runs busier than the rest. Your job is the full sequence. Fit `arima(cups2, order = c(1, 1, 1))`, plot the ACF of its leftovers, run `Box.test()` at `lag = 14` with the right `fitdf`, then name the repair those two checks point at, apply it, and run both checks again on the new leftovers.

```r
# Build a second coffee shop: 126 trading days of cups sold, one busy day midweek
set.seed(11)
dow2  <- rep(c("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"), length.out = 126)
bump2 <- c(Mon = 0, Tue = 0, Wed = 8, Thu = 0, Fri = 0, Sat = 0, Sun = 0)
cups2 <- as.numeric(round(150 + cumsum(arima.sim(list(ar = 0.5), n = 126, sd = 2.5) + 0.5) + bump2[dow2]))

# Your turn, four moves: fit, read the ACF, test with the right fitdf,
# then repair and run both checks again.
# Press Check when the repaired model has passed.
```
::check {"regex": "period\\s*=\\s*7[\\s\\S]*fitdf\\s*=\\s*3", "gate": true, "difficulty": "advanced", "ok": "That is the routine. The plain model leaves 5 bars outside the band with lag 7 at 0.596, and Ljung-Box returns 121.15 on 12 degrees of freedom with a p-value below 2.2e-16. Add the weekly term and the statistic falls to 6.66 with p = 0.8256, and not one bar breaks the band.", "no": "The repair is the same one the first shop needed: add seasonal = list(order = c(0, 1, 1), period = 7) to the arima call. That makes three fitted terms, so the confirming test needs fitdf = 3."}
::solution
```r
# Run both checks on the second shop, then repair the model and run them again
fit2 <- arima(cups2, order = c(1, 1, 1))
res2 <- residuals(fit2)

acf(res2, lag.max = 20, main = "Second shop: leftovers of the model without a week")

band2 <- 1.96 / sqrt(length(res2))
acf2  <- acf(res2, lag.max = 14, plot = FALSE)$acf[-1]
round(c(band = band2, lag_7 = acf2[7], lag_14 = acf2[14]), 3)
#>   band  lag_7 lag_14
#>  0.175  0.596  0.598
sum(abs(acf2) > band2)
#> [1] 5

Box.test(res2, lag = 14, type = "Ljung-Box", fitdf = 2)
#>
#> 	Box-Ljung test
#>
#> data:  res2
#> X-squared = 121.15, df = 12, p-value < 2.2e-16

fit2_week <- arima(cups2, order = c(1, 1, 1),
                   seasonal = list(order = c(0, 1, 1), period = 7))
res2_week <- residuals(fit2_week)

acf(res2_week, lag.max = 20, main = "Second shop: leftovers once the week is in the model")
Box.test(res2_week, lag = 14, type = "Ljung-Box", fitdf = 3)
#>
#> 	Box-Ljung test
#>
#> data:  res2_week
#> X-squared = 6.6634, df = 11, p-value = 0.8256

weekday2 <- factor(dow2, levels = c("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"))
round(tapply(as.numeric(res2), weekday2, mean), 1)
#>  Mon  Tue  Wed  Thu  Fri  Sat  Sun
#>  0.7  0.4  8.0 -6.1 -1.5  0.7  0.8
```

The first ACF has a tower at lag 7 of 0.596 and another at lag 14 of 0.598, with 5 of the first 14 bars outside a band of 0.175. And the weekday table names the day. The plain model guesses 8.0 cups too low on Wednesday and 6.1 cups too high on Thursday, which is the same one day overshoot the first shop showed.

After the repair, no bar breaks the band and the pooled statistic is 6.66 with p = 0.8256. It is a different shop with a different busy day, and it took the same two checks and the same repair.

=== step === concept
## References

- [On a measure of lack of fit in time series models](https://doi.org/10.1093/biomet/65.2.297) - Ljung and Box (1978), Biometrika 65(2), 297-303. The paper the test is named after, and the source of the weighting the formula uses.
- [Distribution of residual autocorrelations in autoregressive integrated moving average time series models](https://doi.org/10.1080/01621459.1970.10481180) - Box and Pierce (1970), Journal of the American Statistical Association 65(332), 1509-1526. The earlier statistic, and where the degrees of freedom adjustment for fitted terms comes from.
- [Forecasting: Principles and Practice, section 5.4, Residual diagnostics](https://otexts.com/fpp3/diagnostics.html) - Hyndman and Athanasopoulos. The standard free reference for what leftovers should look like and how to check them.
- [Box-Pierce and Ljung-Box tests](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/box.test.html) - R Core Team, the documentation for `Box.test()`, including the exact meaning of `fitdf`.
- [ARIMA modelling of time series](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/arima.html) - R Core Team, the documentation for `arima()`, including the `seasonal` argument used for the repair.

=== step === complete
## The two checks, in the order you run them

You took a fitted model that looked perfectly healthy on its printout, pulled out its leftovers, and found six months of Fridays and Sundays that it had been getting wrong the same way every single week. Then you fixed it and watched the typical miss drop from 3.6 cups to 2.2.

The routine is short enough to run every time:

1. **Plot the leftovers over time.** You want a flat, even band centred on zero. A drift means bias, a funnel means the spread is changing, and neither of those shows up in the test that follows.
2. **Plot them against their own past with `acf()`.** Any bar outside \(1.96/\sqrt{n}\) is structure the model left behind, and the lag it sits at names the rhythm: 7 for a week, 12 for monthly data, 4 for quarters.
3. **Run `Box.test()` with the Ljung-Box type.** Pool enough lags to cover the rhythm you are hunting, and set `fitdf` to the number of AR and MA terms you fitted, seasonal ones included.
4. **Read the p-value the right way round.** Large means nothing was found and you carry on. Small means pattern remains and the model needs work.
5. **Let a failure name its own repair.** A bar at lag 7 asks for a weekly term. Then run both checks again on the new leftovers and confirm.

And here is the sentence to say out loud when someone asks whether the model is any good, filled in with the shop's numbers:

"Its leftovers show no rhythm out to two weeks, at a Ljung-Box p-value of 0.54, and the plot over time is flat and even, so there is nothing more these checks can find."

Now notice what that sentence does not claim. It does not say the model is correct, and it does not say the forecasts will be accurate. It says only that two specific faults were looked for and not found. That is the most an honest diagnostic ever gives you, and it is still worth a great deal more than a printout with no complaints on it.
