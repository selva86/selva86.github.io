---
title: "Prediction intervals: put honest uncertainty on your forecasts"
slug: "TS-Toolkit-Mini-2"
description: "Your forecast says 1,193 units. Put an honest range around it, see why the bands widen the further out you look, and test whether your 95 percent means 95."
keywords: "prediction intervals in R, forecast uncertainty, prediction interval, forecast interval width, interval coverage, exponential smoothing forecast, 95 percent prediction interval"
mathjax: true
webr: true
date: "2026-08-27"
post_type: "LESSON"
course_id: "time-series-toolkit"
course_title: "The Time Series Toolkit"
course_lesson: "2"
course_total: "10"
course_landing: "/dashboard.html"
course_prev: "TS-Toolkit-Mini-1"
course_next: ""
curriculum_id: "0.0.49"
lesson_access: "windowed"
catalog_blurb: "Put an honest range on a forecast, then test that the range holds."
---

=== step === cover
::eyebrow The Time Series Toolkit
## Prediction intervals: put honest uncertainty on your forecasts

Let's say your forecast for next month's demand comes back at 1,200 units.

That number then goes to work. The warehouse stocks around it, the plan gets signed off, and everyone moves on. Then the month closes at 950 units, and the forecast is the thing that gets blamed.

The 1,200 was never the problem though. Reporting it on its own was.

Now listen to what changes when you say it this way instead. "Best guess 1,200, and I am 95 percent sure the month lands somewhere between 900 and 1,500." Nobody stocks to a single number after hearing that. They stock for the low end and keep an eye on the high one.

That range has a name. It is called a prediction interval, and we are going to build one on a monthly demand series, read it properly, and then find out what its label is actually worth.

There are only three moves involved.

::widget process-flow {"steps":[{"title":"Attach a range","sub":"ask the same model for bounds, not one number"},{"title":"Read how it opens","sub":"bands widen with the horizon, at a rate you can work out"},{"title":"Test the promise","sub":"count the months that really landed inside"}]}

The first two are the ones everybody does. The third one almost nobody does, and that is where the interesting part is.

=== step === concept
## The demand series and its one-month point forecast

Let's get the numbers on the table first, because everything we compute from here on comes out of them.

We are forecasting one product line, water filter cartridges, for a planner who has to tell the warehouse how many to hold. We have six years of monthly shipments, January 2020 through December 2025.

I am generating those months here rather than loading a file, so you can press Run on every block and get exactly the numbers I get. The first five years are what the model learns from. The final twelve months I am setting aside, and we will not touch them until the end.

```r
# Build six years of monthly cartridge shipments and plot the years the model learns from
set.seed(179052)
demand <- ts(round(700 + cumsum(rnorm(72, mean = 7, sd = 145)) +
                     90 * sin(2 * pi * (1:72) / 12) +
                     c(rep(0, 60), rnorm(12, sd = 230))),
             start = c(2020, 1), frequency = 12)

train_demand <- window(demand, end = c(2024, 12))

plot(train_demand, lwd = 2, col = "grey30",
     main = "Cartridges shipped per month, 2020 to 2024",
     xlab = "Year", ylab = "Units")
```

`ts()` tells R these numbers are monthly and start in January 2020, and `window()` cuts the series by date rather than by row number.

Look at the shape it draws. Shipments climb through 2022 to a peak near 1,800 units, slide back through 2023, and spend 2024 wobbling somewhere around 1,000. There is a yearly rhythm underneath, and on top of it every month jumps around by a hundred units or more.

Now we fit a model. Exponential smoothing reads the current level, the trend and the seasonal shape out of the history, leaning more on recent months than on old ones, and carries all three forward. The `ets()` function does that fitting, and `model = "AAA"` asks for the additive form of all three parts, which keeps everything in plain units.

```r
# Fit an exponential smoothing model and ask it for next January
library(forecast)

fit_demand <- ets(train_demand, model = "AAA")
fc1 <- forecast(fit_demand, h = 1, level = 95)

round(as.numeric(fc1$mean), 1)
#> [1] 1193.2
```

`h = 1` means one month past the end of the training data, so this is January 2025.

There it is: 1,193.2 units. That is the number that goes in the plan, gets rounded to 1,200 in the email, and gets remembered by everyone in the meeting.

=== step === concept
## The same forecast, reported as a range

The same fitted model will give you bounds along with that number. You do not need a different model or a different function. The bounds were computed the moment you asked for the forecast, and printing the forecast object shows them.

```r
# Print the same forecast as a range, then reveal what January actually shipped
round(as.data.frame(fc1), 1)
#>          Point Forecast Lo 95  Hi 95
#> Jan 2025         1193.2 888.5 1497.9

test_demand <- window(demand, start = c(2025, 1))
test_demand[1]
#> [1] 942
```

Read the row as one sentence. The best guess for January is 1,193.2 units, and the model puts the month somewhere between 888.5 and 1,497.9 at the 95 percent level. `Lo 95` and `Hi 95` are the lower and upper bound of that range.

Then the month happened, and 942 cartridges shipped.

That is 251 units below the point forecast, about a fifth of the number that went into the plan. If 1,193 is what the warehouse stocked for, this is the month somebody has to explain.

But look where 942 sits in the range. It is inside, comfortably, nearer the bottom than the middle. The model was not wrong about January. The report was.

[KEY INSIGHT]
A point forecast is the middle of the interval, never the answer on its own. Quoting 1,193 hides the fact that 950 and 1,450 were both entirely consistent with the same model, and 950 is the one that empties your shelves.

=== step === concept
## Building the interval by hand from the residual spread

So where did 888.5 and 1,497.9 come from? They are not a black box. Build them once by hand and the width stops feeling like something the software just knows.

Start with what the model already knows about its own accuracy. While `ets()` fits, it walks through the training months one at a time. At each month it makes a one-month-ahead forecast from everything it has seen so far, then compares that forecast with what actually shipped. The gap is a residual, and there are sixty of them, one per training month.

Those sixty residuals are the model's track record, and one number summarises them. Square them, add them up, and divide by the months left over once the fit has spent some of them pinning down its own settings. This model estimated sixteen quantities. Three of them are the smoothing weights, one each for the level, the trend and the season. The other thirteen are the starting values it had to pin down before it could begin: a starting level, a starting trend, and eleven monthly offsets, eleven rather than twelve because the twelfth is fixed once you know the other eleven. So the divisor is 60 minus 16, which is 44. The square root of that is the model's typical one-month miss, and the fitted object stores the same number as `sigma2`.

Written out, the bounds are:

\[ \text{lower, upper} \;=\; \hat{y} \;\pm\; z \times \hat{\sigma} \]

Here \(\hat{y}\) is the point forecast, \(\hat{\sigma}\) is that typical miss, and \(z\) is the multiplier that sets how much of the spread you want to cover. For a bell-shaped spread, 95 percent of the values sit within 1.96 standard deviations of the middle. `qnorm(0.975)` is how you ask R for that multiplier: 97.5 percent of the spread below the upper bound leaves 2.5 percent in each tail, which is 95 percent in between.

```r
# Rebuild those bounds by hand from the model's one-month residual spread
resid_demand <- residuals(fit_demand)       # one miss per training month
n_par        <- length(coef(fit_demand))    # quantities the fit had to estimate
sigma_hat    <- sqrt(sum(resid_demand^2) / (length(resid_demand) - n_par))

round(c(months = length(resid_demand), estimated = n_par,
        sigma = sigma_hat, stored_by_the_fit = sqrt(fit_demand$sigma2)), 2)
#>            months         estimated             sigma stored_by_the_fit
#>             60.00             16.00            155.45            155.45

point <- as.numeric(fc1$mean)
z     <- qnorm(0.975)

round(c(multiplier = z,
        lower = point - z * sigma_hat,
        upper = point + z * sigma_hat), 2)
#> multiplier      lower      upper
#>       1.96     888.51    1497.88
```

That is sixty months, sixteen estimated quantities, and a typical one-month miss of 155.45 units. Working it out by hand and reading it off the fit give the same number, which is the whole point of doing it once.

The second block then gives 888.51 and 1,497.88, and those are the two bounds the forecast printed, to the decimal. Multiply 155.45 by 1.96 and you get 304.7, which is how far the interval reaches on each side of 1,193.2.

[NOTE]
Every ingredient in that width came from months that had already happened. Nothing about January entered the calculation. The interval is the model's own track record, scaled up to the confidence level you asked for.

=== step === concept
## What does the 95 percent actually promise?

Let's be exact about what that 95 percent claims, because it is easy to hear it as something friendlier than it is.

The claim is about one month, January 2025, imagined many times over. Picture January being run again and again, each run landing wherever the model's spread says a month can land. In about 95 of every 100 of those Januaries, shipments would fall between 888.5 and 1,497.9.

It is not a claim about the average of the coming year. It is also not a claim that the model is 95 percent likely to be right.

We can count it rather than take it on trust. If we take the model at its word and draw 20,000 Januaries from the spread it fitted, about 95 percent of them should land inside the bounds it printed.

```r
# Draw 20,000 possible Januaries from the fitted spread and count how many land inside
set.seed(5)
draws  <- rnorm(20000, mean = point, sd = sigma_hat)
inside <- draws >= point - z * sigma_hat & draws <= point + z * sigma_hat

sum(inside)
#> [1] 18929
mean(inside)
#> [1] 0.94645
```

`rnorm()` draws random numbers from a bell-shaped spread centred on the point forecast, using the model's own 155.45 as the spread. The comparison marks each draw as inside the bounds or outside, and `mean()` of those TRUE and FALSE values is the share that landed inside.

18,929 out of 20,000, which is 0.946. That is the 95 percent, counted.

Now notice what that did not prove. We drew those 20,000 Januaries out of the very spread the interval was built from, so all it confirms is that the arithmetic does what it says. Whether 155.45 is the right spread for a real January is a completely different question, and no simulation drawn from the model can answer it. Only months the model has never seen can.

=== step === quiz
## Quick check: what does that interval claim?

January's 95 percent interval came back as 888.5 to 1,497.9 units. Which sentence states what it claims?

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- About 95 percent of the months in the training history fell between 888.5 and 1,497.9 units. ::no
- The average of the next twelve months will land between 888.5 and 1,497.9 units. ::no
- If January could be replayed many times, about 95 in 100 of those Januaries would land between 888.5 and 1,497.9 units. ::ok Exactly. It is a statement about one future month, repeated, and about nothing else.
- There is a 95 percent chance the model is right about January. ::no The interval speaks about one future month, replayed: about 95 out of every 100 Januaries would land between those two numbers. It says nothing about how the training months behaved, nothing about the average of the year ahead, and nothing about the model being right.

=== step === widget
## Two sources of uncertainty, and the one that never shrinks

That width came out of a single number, so it is natural to think of it as one thing. It is really two, and they behave very differently.

The first is that the model itself is a guess. We estimated a level, a trend and a seasonal shape from sixty months, and a different sixty months would have given us slightly different ones. So the line the forecast sits on has some wobble in it.

The second is that even if somebody handed us the perfect model, January would still not land exactly on it. Orders arrive when they arrive. That scatter is in the world, not in the model, and no amount of history removes it.

The quickest way to feel the difference is to slide the amount of data and watch which band moves. The picture below is drawn for a straight-line fit rather than for our monthly series, because a sample size is easier to drag than a length of history. The two bands still mean what they mean in a forecast. The inner one is doubt about the fitted line, and the outer one is doubt about a single new outcome.

::widget regression-intervals {}

Push the sample size up and watch. The inner band closes onto the line, because more data pins the line down. The outer band barely moves, because the scatter of one new point was never about how much data you had.

A forecast interval is the outer band. It is a statement about where one month lands, not about where the fitted line sits, and the scatter in that one month has a floor under it that no amount of history can lower.

The picture above folds both doubts into that outer band. The interval we printed for January is tidier than that, and we already have the proof: 1,193.2 plus or minus 1.96 times 155.45 reproduced the printed bounds to the decimal, with nothing added on top for the wobble in the fitted level, trend and season. `forecast()` takes those as settled and prices the scatter of the single month around them.

[KEY INSIGHT]
More data makes the model better. It does not make next month less random. An interval that keeps shrinking as you feed it history is describing your model, not the month you have to plan for.

=== step === concept
## What the default interval leaves out

There is a crack in the calculation we just did, and it is the reason published intervals so often come out too narrow.

The entire width came from `sigma_hat`, 155.45 units. That number is not a fact about cartridges. It is an estimate, measured off the sixty months this model happened to train on. Ask a different stretch of the same history and it answers differently.

Let's do exactly that. It is the same product, the same model and the same January, only fitted on three shorter windows of the history, with the full five years kept at the bottom for comparison.

```r
# Refit the same model on shorter stretches of history and compare the spread each one gives
histories <- list(
  first_36_months = window(train_demand, end   = c(2022, 12)),
  last_36_months  = window(train_demand, start = c(2022,  1)),
  last_48_months  = window(train_demand, start = c(2021,  1)),
  all_60_months   = train_demand
)

sigmas <- sapply(histories, function(y) sqrt(ets(y, model = "AAA")$sigma2))

bands <- data.frame(
  history = names(sigmas),
  sigma   = round(as.numeric(sigmas), 1),
  lower   = round(point - z * as.numeric(sigmas)),
  upper   = round(point + z * as.numeric(sigmas))
)
print(bands, row.names = FALSE)
#>          history sigma lower upper
#>  first_36_months 177.5   845  1541
#>   last_36_months 237.3   728  1658
#>   last_48_months 166.8   866  1520
#>    all_60_months 155.5   889  1498
```

`sapply()` runs the same fit over each window in the list and collects the four spreads, then we rebuild the January bounds around each one using the multiplier from before.

The last three years of history put the typical monthly miss at 237.3 units, half again as large as the 155.45 we used. The band that comes out of it runs from 728 to 1,658, which is 930 units wide against 609.

Which window is right? All four are honest answers to the question "how badly did this model miss on months I showed it". Not one of them knows how badly it will miss on a month it has not seen.

And here is the part that matters once the forecast leaves your hands. When the model printed 888.5 and 1,497.9, it printed them as though 155.45 were exact. The uncertainty in the spread itself is nowhere in that arithmetic, and neither is the risk that additive exponential smoothing is the wrong shape for next year.

[WARNING]
A published interval prices the noise around a model it treats as correct. It does not price the doubt about the spread it used, and it cannot price the risk that the model is wrong. That is the main reason measured coverage tends to come in under the label on the box.

=== step === quiz
## Quick check: which source of uncertainty is missing?

One number, 155.45, set the width of January's band, and refitting on a different window of the same history moved it to 237.3. So what does the printed 95 percent band actually account for?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The month-to-month randomness in demand, plus the risk that 155.45 is the wrong spread to be using. ::no
- The month-to-month randomness in demand, priced with one estimate of the spread that is then treated as though it were exact. ::ok That is the whole of it. Everything past that, including the chance that this model has the wrong shape for next year, sits outside the arithmetic.
- Nothing useful, since any window of history gives a different answer. ::no
- The risk that additive exponential smoothing is the wrong model for the year ahead. ::no The band prices one thing: the month-to-month noise, measured once as sigma and then used as if it were known exactly. The doubt about sigma itself and the risk that the model has the wrong shape are both real, and both sit outside what the interval computes. That does not make the band useless. It makes it a floor under your uncertainty rather than the whole of it.

=== step === concept
## Reading a twelve-month forecast: the 80 and 95 percent bands

One month ahead is the easy case. The planner needs a year, so let's ask for twelve months and both of the levels a forecast usually carries.

```r
# Forecast the next twelve months with both an 80 and a 95 percent band
fc12 <- forecast(fit_demand, h = 12, level = c(80, 95))
round(head(as.data.frame(fc12), 4))
#>          Point Forecast Lo 80 Hi 80 Lo 95 Hi 95
#> Jan 2025           1193   994  1392   889  1498
#> Feb 2025           1152   871  1433   722  1581
#> Mar 2025           1131   788  1475   606  1656
#> Apr 2025           1212   816  1609   606  1819
```

`level = c(80, 95)` asks for two ranges at once, and `head(..., 4)` keeps the printout to the first four months.

Two levels come back because they answer different appetites for risk. The 80 percent range is the likely case, the one you plan around. The 95 percent range is the case you make sure you can survive.

Read the January row across. The 95 percent pair, 889 to 1,498, sits outside the 80 percent pair, 994 to 1,392, on both sides. It has to. Asking to be right more often can only ever mean accepting a wider range.

Now read down the columns instead. January's 80 percent range spans 398 units. By April it spans 793. The forecast is not getting less confident because the model is tiring. It is getting less confident because April is further away.

```r
# Draw the same twelve months as a fan chart
plot(fc12, main = "Cartridge demand: twelve months ahead",
     xlab = "Year", ylab = "Units")
```

That picture is the whole story of forecast uncertainty in one shape. History is a single line, because it already happened. The forecast is a cone, because it has not. The dark inner wedge is the 80 percent band and the pale outer one is the 95 percent band.

=== step === concept
## Why the bands widen, and how fast

The cone is not the model losing its nerve. It follows from one mechanical fact about forecasting more than one period ahead.

To forecast February, the model has to stand on its own January forecast, because there is no actual January to stand on. If January came in 200 units below the forecast, February inherits that error and adds its own on top. By month twelve, the error is a pile of twelve monthly shocks stacked on each other.

So is a year out twelve times as uncertain as a month out? No, and the reason is worth watching rather than being told. Some months come in above the forecast and some below, so the shocks partly cancel as they pile up.

Let's measure that. We add up `h` monthly shocks, each drawn with the model's own spread of 155.45 units, do it 4,000 times for each horizon, and look at how wide the totals get.

```r
# Add up h monthly shocks and measure how fast their combined spread grows
set.seed(2025)
sim_sd <- sapply(1:12, function(h) sd(replicate(4000, sum(rnorm(h, sd = sigma_hat)))))

data.frame(horizon            = 1:12,
           simulated_sd       = round(sim_sd, 1),
           sigma_times_root_h = round(sigma_hat * sqrt(1:12), 1))
#>    horizon simulated_sd sigma_times_root_h
#> 1        1        155.9              155.5
#> 2        2        222.0              219.8
#> 3        3        272.4              269.3
#> 4        4        315.4              310.9
#> 5        5        348.6              347.6
#> 6        6        382.9              380.8
#> 7        7        413.8              411.3
#> 8        8        443.7              439.7
#> 9        9        467.2              466.4
#> 10      10        486.5              491.6
#> 11      11        529.2              515.6
#> 12      12        541.4              538.5
```

`replicate()` repeats the same experiment 4,000 times and keeps every answer, and `sd()` measures how spread out those 4,000 totals are.

The measured spread in the middle column tracks the last column all the way down, with small gaps that are just the randomness of using 4,000 draws instead of infinitely many. Nothing was assumed there. We added up random monthly misses and this pattern fell out:

\[ \text{spread at horizon } h \;\approx\; \hat{\sigma}\sqrt{h} \]

Twelve months of shocks do not give twelve times the spread. They give the square root of twelve, about 3.46 times.

Now let's hold the model's own published widths against that line.

```r
# Measure the published 95 percent width at every horizon against the square root of h
width_95 <- as.numeric(fc12$upper[, "95%"] - fc12$lower[, "95%"])

data.frame(horizon  = 1:12,
           width    = round(width_95),
           times_h1 = round(width_95 / width_95[1], 2),
           root_h   = round(sqrt(1:12), 2))
#>    horizon width times_h1 root_h
#> 1        1   609     1.00   1.00
#> 2        2   859     1.41   1.41
#> 3        3  1051     1.72   1.73
#> 4        4  1213     1.99   2.00
#> 5        5  1356     2.23   2.24
#> 6        6  1486     2.44   2.45
#> 7        7  1605     2.63   2.65
#> 8        8  1716     2.82   2.83
#> 9        9  1821     2.99   3.00
#> 10      10  1920     3.15   3.16
#> 11      11  2014     3.31   3.32
#> 12      12  2105     3.45   3.46
```

The bounds live in `fc12$upper` and `fc12$lower`, one column per level, so subtracting one from the other gives the width at each horizon.

Column three is the published width as a multiple of the one-month width, and column four is the square root of the horizon. At four months, 1.99 against 2.00. At twelve months, 3.45 against 3.46.

Not every model opens its bands at exactly this rate. These two columns landing on top of each other tells you something about this series itself. It wanders like a random walk carrying a seasonal shape, so almost the whole of each month's error is still there next month. A stationary series, one that pulls back toward a long-run average, stops widening at a ceiling instead of climbing for ever. Only the rate changes though. Underneath it is the same thing every time: forecast errors accumulate, and accumulated errors partly cancel.

=== step === tryit
## Your turn: how much wider is the forecast a year out?

We just did that for the 95 percent band. Do it for the 80 percent one.

`fc12` still holds both bands. Pull the 80 percent bounds out of it, work out the width at month one and at month twelve, and report the second as a multiple of the first. Then see whether it beats the square root of twelve, which is 3.46.

```r
# fc12 holds the twelve-month forecast with both an 80 and a 95 percent band.
# The bounds live in fc12$lower and fc12$upper, one column per level,
# and the columns are named "80%" and "95%".
# Work out the 80 percent width at h = 1 and at h = 12,
# then report the second as a multiple of the first.
# Two or three lines. Press Check when you have them.
```
::check {"regex": "upper[^\\n]*80%", "gate": true, "difficulty": "beginner", "ok": "That is it: 398.4 units wide at one month and 1,376.1 at twelve, so 3.45 times wider against a square root of twelve of 3.46. The 80 percent band opens at exactly the rate the 95 percent band did. The level you pick changes the multiplier, never the way the width grows.", "no": "Copy the width line we used for the 95 percent band and swap the column name: `width_80 <- as.numeric(fc12$upper[, \"80%\"] - fc12$lower[, \"80%\"])`. Then divide `width_80[12]` by `width_80[1]`."}
::solution
```r
# How much wider the 80 percent band gets a year out
width_80 <- as.numeric(fc12$upper[, "80%"] - fc12$lower[, "80%"])

round(c(h1 = width_80[1], h12 = width_80[12],
        times_wider = width_80[12] / width_80[1],
        root_12 = sqrt(12)), 2)
#>          h1         h12 times_wider     root_12
#>      398.45     1376.15        3.45        3.46
```

=== step === quiz
## Quick check: four times the horizon, how much more width?

January's 95 percent band is 609 units wide. Going by the growth we just measured, roughly how wide should the April band be, four months out?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- About 2,436 units, four times as wide, because four months carry four months of accumulated error. ::no
- About 1,213 units, twice as wide, because the spread grows with the square root of the horizon and the square root of four is two. ::ok Right, and the width table printed 1,213 for April. Four times the horizon buys only twice the uncertainty, which is quietly good news for anyone forecasting a year out.
- About 609 units, the same width, because the model's typical monthly miss has not changed. ::no
- About 9,744 units, sixteen times as wide, because the errors multiply as they compound. ::no Four months of shocks do not give four times the spread, because some months come in high and some come in low and they partly cancel. The spread grows with the square root of the horizon, so four months out is about twice as wide: 609 times 2 is roughly 1,213, which is what the width table printed for April.

=== step === concept
## When the residuals are lopsided, resample them

Every interval so far rested on an assumption we have not examined. Writing the bounds as plus or minus one number says the misses are symmetric, that coming in 300 units high and 300 units low are equally ordinary. Often they are not.

The same planner has a second line, a spare-part kit. It ships steadily most months, and every so often a maintenance contract puts in a bulk order that lands well above the usual level. Let's fit the same kind of model to it and look at the errors it makes.

```r
# Build the spare-part kit series and check the shape of its residuals
set.seed(404)
parts <- ts(round(110 + rexp(60, rate = 1 / 70)), start = c(2020, 1), frequency = 12)

fit_parts   <- ets(parts, model = "ANN")
resid_parts <- as.numeric(residuals(fit_parts))

hist(resid_parts, breaks = 20, col = "grey85", border = "white",
     main = "Spare-part kit: one-month forecast errors",
     xlab = "Units (actual minus forecast)")

round(c(mean     = mean(resid_parts),
        median   = median(resid_parts),
        skewness = mean((resid_parts - mean(resid_parts))^3) / sd(resid_parts)^3), 2)
#>     mean   median skewness
#>     0.03   -21.56     1.66
```

`model = "ANN"` fits a level with no trend and no season, which is the right shape for a line that ships flat with occasional spikes. `residuals()` pulls out the one-month misses, the same quantity whose spread gave us the width earlier.

The histogram tells you before the numbers do. Most months cluster a little below zero and a few reach far out to the right.

The mean sits at 0.03 and the median at minus 21.56. For a symmetric spread those two would be close together, so the gap alone is a warning. Skewness puts a number on it: zero means symmetric, and 1.66 means a solid lean to the right, a pile of small negative misses with a thin tail of large positive ones.

A plus-or-minus interval cannot describe that shape. It leaves as much room below the forecast as above it, in a series whose surprises are almost all on the upside.

The fix is to stop assuming a shape and use the shape the errors actually have. That is what `bootstrap = TRUE` does. Instead of multiplying a standard deviation by 1.96, it draws at random from the residuals the model really made, thousands of times over, and reads the bounds straight off the spread of simulated futures.

```r
# Compare the symmetric interval with one built by resampling the errors themselves
set.seed(31)
fc_normal <- forecast(fit_parts, h = 1, level = 95)
fc_boot   <- forecast(fit_parts, h = 1, level = 95, bootstrap = TRUE, npaths = 5000)

shapes <- data.frame(
  method = c("normal", "resampled"),
  point  = round(rep(as.numeric(fc_normal$mean), 2)),
  lower  = round(c(as.numeric(fc_normal$lower), as.numeric(fc_boot$lower))),
  upper  = round(c(as.numeric(fc_normal$upper), as.numeric(fc_boot$upper)))
)
shapes$below <- shapes$point - shapes$lower
shapes$above <- shapes$upper - shapes$point
print(shapes, row.names = FALSE)
#>     method point lower upper below above
#>     normal   182    42   323   140   141
#>  resampled   182   111   407    71   225
```

`npaths = 5000` is how many simulated futures it builds, and `set.seed(31)` fixes which ones you get so your numbers match mine.

The symmetric interval runs 42 to 323 kits, reaching 140 below the forecast and 141 above, which is the same distance either way once you look past the rounding. The resampled one runs 111 to 407, reaching 71 below and 225 above, more than three times as far up as down.

That is a different shape, not just a different width. It refuses to leave much room below 182 because the errors almost never went far below, and it leaves a long reach above because that is where the bulk orders live.

[NOTE]
Resampling drops the assumption that errors are bell-shaped. It keeps a different one: that each month's error is unrelated to the one before it. If today's miss predicts tomorrow's, no interval built this way is trustworthy, and the model itself is what needs fixing first.

=== step === concept
## Testing the intervals on months the model never saw

Now let's run the test that label has been asking for all along.

The model was fitted on 2020 through 2024 and has never seen a single day of 2025. The twelve months of 2025 have been sitting in `test_demand` untouched since we split them off. So we can hold the bands it published against what actually shipped and simply count.

An 80 percent band should catch about 10 of the 12 months. A 95 percent band should catch about 11.

```r
# Score the twelve held-back months against the bands the model published
inside_80 <- test_demand >= fc12$lower[, "80%"] & test_demand <= fc12$upper[, "80%"]
inside_95 <- test_demand >= fc12$lower[, "95%"] & test_demand <= fc12$upper[, "95%"]

round(c(nominal_80 = 0.80, actual_80 = mean(inside_80),
        nominal_95 = 0.95, actual_95 = mean(inside_95)), 3)
#> nominal_80  actual_80 nominal_95  actual_95
#>      0.800      0.583      0.950      0.833
```

Each comparison gives twelve TRUE and FALSE values, one per month, and the mean of those is the share that landed inside. The nominal numbers are what we asked for and the actual numbers are what we got.

7 of the 12 months landed inside the 80 percent band, which is 58 percent against a promised 80. 10 of the 12 landed inside the 95 percent band, 83 percent against a promised 95. Both labels overstated what they delivered.

The picture shows where it went wrong.

```r
# Draw the published bands with the twelve months that actually happened on top
plot(fc12, main = "Published bands against what actually shipped",
     xlab = "Year", ylab = "Units")
lines(test_demand, col = "firebrick", lwd = 2)
```

Every miss is in the first half of the year. The red line drops away from the cone almost immediately: 942 in January, then 815, then 590 in March and 555 in April, while the model was still carrying the level it had learned from 2024. The first five months fell below the 80 percent band, and March and April fell below the 95 percent band as well.

By the second half the bands have opened so wide that they catch nearly anything, which is a kind of failure of its own.

So the interval was not wrong about noise. It was wrong about the world. It priced the month-to-month wobble it had measured across 2020 to 2024, and what happened in 2025 was not wobble, it was the level stepping down and staying down. No arithmetic on past residuals can price that.

[KEY INSIGHT]
Coverage is a property of one model paired with one series, never a guarantee that ships with the function. The only way to know what your 95 percent is worth is to hold months back, forecast them, and count how many landed inside.

=== step === quiz
## Quick check: which fix addresses which failure?

Two things went wrong here. The spare-part kit had lopsided errors, so a symmetric band was the wrong shape for it. The cartridge band caught 7 months out of 12 when it promised about 10. Somebody suggests switching the cartridge forecast to resampled residuals to fix the coverage. What will that do?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- It fixes the coverage, because resampled intervals always come out wider than symmetric ones. ::no
- It makes the coverage worse, because resampled intervals are always narrower than symmetric ones. ::no
- Very little for the coverage. Resampling reshapes the band to match the errors the model already made, and the months fell outside because the level moved in a way none of those errors describe. ::ok Yes. Resampling is the fix for the wrong shape, and the cartridge failure was the wrong level, which is a different problem needing a different fix.
- It fixes the coverage, because resampling removes the normal-shape assumption, and that assumption was why the months fell outside. ::no Resampling swaps one description of the past errors for a truer one, so it fixes the shape of the band and changes the width only as far as those errors justify. The cartridge months fell outside for a different reason: demand stepped down to a level nothing in the training years had shown. Wrong shape and wrong level are two failures with two different fixes.

=== step === tryit
## Your turn: build a 90 percent interval by hand

You already have everything for this one. `point` holds the January forecast of 1,193.2 and `sigma_hat` holds the model's typical one-month miss of 155.45.

Build the 90 percent interval yourself, then check it against what the model gives you. The only thing that changes is the multiplier: 90 percent in the middle leaves 5 percent in each tail, so you want the value with 95 percent of the spread below it.

```r
# point holds the January forecast and sigma_hat the one-month residual spread.
# Ask qnorm() for the 90 percent multiplier, then build the two bounds
# the same way we built the 95 percent ones.
# Check your answer against forecast(fit_demand, h = 1, level = 90).
# Press Check when you have it.
```
::check {"regex": "qnorm[(]0?\\.95", "gate": true, "difficulty": "beginner", "ok": "Right: 1.64 times 155.45 is 255.7 either side, giving 937.5 to 1,448.9, and `forecast(fit_demand, h = 1, level = 90)` prints the same two numbers. Dropping from 95 to 90 percent bought you a band about 98 units narrower, and the price of that is being outside it twice as often.", "no": "The multiplier is `qnorm(0.95)`, not `qnorm(0.90)`: 90 percent in the middle leaves 5 percent in each tail, so you want the value with 95 percent below it. Then the bounds are `point - z90 * sigma_hat` and `point + z90 * sigma_hat`."}
::solution
```r
# Build the 90 percent interval by hand and check it against the model
z90 <- qnorm(0.95)

round(c(multiplier = z90,
        lower = point - z90 * sigma_hat,
        upper = point + z90 * sigma_hat), 2)
#> multiplier      lower      upper
#>       1.64     937.49    1448.89

round(as.data.frame(forecast(fit_demand, h = 1, level = 90)), 2)
#>          Point Forecast  Lo 90   Hi 90
#> Jan 2025        1193.19 937.49 1448.89
```

=== step === tryit
## Your turn: coverage and width over the held-back year

One more, and this is the pair of numbers every forecast report should carry.

`inside_80` holds one TRUE or FALSE per held-back month. Report the 80 percent coverage over the first six months and then over all twelve. After that, average the 95 percent width across the year and write it as a percentage of the average month that actually shipped.

```r
# inside_80 holds one TRUE or FALSE per held-back month for the 80 percent band.
# Report the coverage over the first six months, then over all twelve.
# Then average the 95 percent width with
# mean(fc12$upper[, "95%"] - fc12$lower[, "95%"])
# and write it as a percentage of mean(test_demand).
# Press Check when you have both.
```
::check {"regex": "inside_80\\[1:6\\]", "gate": true, "difficulty": "intermediate", "ok": "There it is. Only 1 of the first 6 months landed inside the 80 percent band, a coverage of 0.167, against 0.583 across the whole year. And the average 95 percent band is 1,479.7 units wide against an average month of 815.8 units, which is 181 percent of the thing being forecast. Coverage improved later in the year only because the band had grown wider than demand itself.", "no": "Coverage is the mean of a TRUE and FALSE vector, so it is `mean(inside_80[1:6])` and then `mean(inside_80)`. For the width, average the 95 percent upper minus lower across the twelve months, divide by `mean(test_demand)` and multiply by 100."}
::solution
```r
# Coverage over the held-back year, and the width you paid for it
round(c(first_six = mean(inside_80[1:6]), all_twelve = mean(inside_80)), 3)
#>  first_six all_twelve
#>      0.167      0.583

mean_width <- mean(fc12$upper[, "95%"] - fc12$lower[, "95%"])
round(c(mean_95_width = mean_width,
        mean_level    = mean(test_demand),
        width_pct     = 100 * mean_width / mean(test_demand)), 1)
#> mean_95_width    mean_level     width_pct
#>        1479.7         815.8         181.4
```

Report coverage and width together, always. Coverage on its own can be bought by widening the band until it swallows everything, which is what this forecast ended up doing by the autumn. A band 181 percent as wide as the quantity you are planning is not a plan. It is a warning that a year ahead is further than this model can usefully see.

=== step === concept
## References

- [Prediction intervals, Forecasting: Principles and Practice, 3rd edition](https://otexts.com/fpp3/prediction-intervals.html) - Hyndman and Athanasopoulos, section 5.5. The standard free reference for how forecast intervals are built and why they widen with the horizon.
- [Calculating Interval Forecasts](https://doi.org/10.1080/07350015.1993.10509938) - Chatfield (1993), Journal of Business and Economic Statistics 11(2), 121-135. The paper on why published forecast intervals come out too narrow, including the estimation uncertainty the printed width ignores.
- [Forecasting with Exponential Smoothing: The State Space Approach](https://doi.org/10.1007/978-3-540-71918-2) - Hyndman, Koehler, Ord and Snyder (2008), Springer, chapter 6. The exact h-step forecast variance for every exponential smoothing model, including the ones whose bands settle at a ceiling.
- [Automatic Time Series Forecasting: The forecast Package for R](https://doi.org/10.18637/jss.v027.i03) - Hyndman and Khandakar (2008), Journal of Statistical Software 27(3). The reference for `ets()` and `forecast()`, including how the bootstrap option builds its paths.
- [The M4 Competition: 100,000 time series and 61 forecasting methods](https://doi.org/10.1016/j.ijforecast.2019.04.014) - Makridakis, Spiliotis and Assimakopoulos (2020), International Journal of Forecasting 36(1), 54-74. Interval coverage measured across 100,000 real series, where falling short of the label is the rule rather than the exception.

=== step === complete
## Quick recap

You took a forecast that would have been reported as one number, put an honest range around it, took the range apart to see what it was made of, and then held it to its own promise. To pull it together:

- Report the range, not the number. 1,193.2 on its own is what broke the plan, and 888.5 to 1,497.9 would have carried January's 942 without surprising anybody.
- The width is the model's own track record, scaled. A typical monthly miss of 155.45 units times 1.96 rebuilt the printed bounds to the decimal.
- That 155.45 is an estimate, not a fact. Other windows of the same history said 166.8, 177.5 and 237.3, and the printed band never mentions which history taught it its spread.
- Bands widen as the horizon grows, because errors accumulate and accumulated errors partly cancel. Here that came out as the square root of the horizon: four months out about twice as wide, twelve months about 3.45 times.
- When the errors are lopsided, resampling them gives a band with the right shape. The spare-part kit reached 71 units below its forecast and 225 above.
- And the test that settles it: 7 of 12 inside an 80 percent band, 10 of 12 inside a 95 percent one. The label is a claim, and only months the model never saw can tell you what it is worth.

So the next time somebody asks you for next month's number, give them two: the forecast, and the range you would actually bet on. Then hold a year back and find out what your own 95 percent is really worth.

Nice work getting through this one.
