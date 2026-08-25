---
title: "ARIMA from Zero Lesson 6: ARIMAX: add outside variables to your ARIMA forecast"
slug: "ARIMA-Mini-6"
description: "Your ARIMA model only knows the sales column. Hand it the temperature and the discount calendar through xreg, and cut the error on unseen days by two thirds."
keywords: "ARIMAX in R, xreg, external regressors, ARIMA with regressors, regression with ARIMA errors, forecasting with predictors, auto.arima xreg, dynamic regression"
mathjax: true
webr: true
date: "2026-08-26"
post_type: "LESSON"
course_id: "arima-from-zero"
course_title: "ARIMA from Zero"
course_lesson: "6"
course_total: "7"
course_landing: "/dashboard.html"
course_prev: "ARIMA-Mini-5"
course_next: ""
curriculum_id: "0.0.25"
lesson_access: "windowed"
catalog_blurb: "How to give a sales forecast the outside drivers it was missing."
---

=== step === cover
::eyebrow ARIMA from Zero
## ARIMAX: add outside variables to your ARIMA forecast

Let's say an ice cream counter has been open for 120 days, and somebody has written down the cups sold on every one of them. You fit a forecast to that sales column and it does what a forecast does. It looks at yesterday, and the day before that, and it tells you tomorrow.

Here is the trouble. The owner of that counter knows two things the model was never given.

The first is the weather. Cups go up when the day is hot, and anyone who has stood behind that counter for a week will tell you so. The second is the discount calendar. Sixteen of those 120 days ran a two for one offer, and the owner chose those dates personally, months ago.

None of that is in the sales column. All of it is sitting in a spreadsheet on the same laptop.

ARIMAX is the model that takes it. The X stands for eXternal, and in R the whole thing arrives through one argument called `xreg`. You hand the model a column of temperatures and a column of ones and zeros for the discount, and it uses them the way it already uses the past of the series.

There are only three moves to it.

::widget process-flow {"steps":[{"title":"Forecast from the sales column alone","sub":"the model sees nothing but the cups it has already sold"},{"title":"Hand it what the owner already knows","sub":"the temperature and the discount calendar, through one argument"},{"title":"Score both on the same 21 unseen days","sub":"the typical daily miss, measured in cups"}]}

By the end you will have two forecasts of the same 21 days, one from a model that knew only the sales and one from a model that knew what the owner knew, and a number in cups that says what the difference was worth.

=== step === concept
## The counter's 120 days: cups, temperature, and a discount flag

We are going to build those 120 days ourselves instead of loading them from somewhere, and there is a good reason for that. If we write the effects in by hand, we know the true answers before we start, so every number the model gives back can be checked against something.

Here is the recipe. Every day starts from a baseline of 45 cups, then adds 3.2 cups for every degree of temperature, 22 extra cups on a discount day, and day to day noise that carries over from yesterday the way real sales do.

Press Run.

```r
# Build 120 days at the counter: cups sold, the day's high, and the discount flag
library(forecast)

set.seed(42)
temperature <- round(26 + as.numeric(arima.sim(list(ar = 0.7), n = 120, sd = 2)), 1)
promo <- rep(0, 120)
promo[c(49:54, 71:76, 116:119)] <- 1
noise <- as.numeric(arima.sim(list(ar = 0.7), n = 120, sd = 6))
sales <- round(45 + 3.2 * temperature + 22 * promo + noise)

shop <- data.frame(day = 1:120, temperature = temperature, promo = promo, sales = sales)
head(shop, 6)
#>   day temperature promo sales
#> 1   1        17.8     0    94
#> 2   2        22.9     0   108
#> 3   3        23.2     0   109
#> 4   4        20.5     0   111
#> 5   5        21.8     0   114
#> 6   6        25.5     0   120

c(discount_days = sum(shop$promo),
  coolest = min(shop$temperature), hottest = max(shop$temperature),
  quietest = min(shop$sales),      busiest = max(shop$sales))
#> discount_days       coolest       hottest      quietest       busiest
#>          16.0          17.8          30.8          94.0         172.0
```

Every row is one day. `temperature` is that day's high in degrees Celsius, `promo` is 1 on the 16 days the two for one ran and 0 otherwise, and `sales` is the cups that went over the counter.

The `arima.sim()` call is what makes the noise behave like real daily sales instead of a fresh coin toss each morning. A quiet day tends to be followed by a quiet day. That carryover matters later, so it is worth building in from the start.

Now let's look at the two series together, and at what an average discount day did.

```r
# Plot cups and temperature over the 120 days, and compare discount days with the rest
par(mfrow = c(2, 1), mar = c(4, 4, 2, 1))
plot(shop$day, shop$sales, type = "l", col = "grey35", lwd = 1.5,
     main = "Cups sold", xlab = "Day", ylab = "Cups")
points(shop$day[shop$promo == 1], shop$sales[shop$promo == 1], col = "darkorange", pch = 19)
plot(shop$day, shop$temperature, type = "l", col = "steelblue", lwd = 1.5,
     main = "High temperature", xlab = "Day", ylab = "Degrees C")
par(mfrow = c(1, 1))

round(c(discount_day = mean(shop$sales[shop$promo == 1]),
        ordinary_day = mean(shop$sales[shop$promo == 0])), 1)
#> discount_day ordinary_day
#>        156.3        124.8
```

The orange dots on the top panel are the discount days. Look at where they sit, then look down at the temperature underneath them: the owner ran those offers during the warm stretches, which is what a real shop does when it wants to push volume.

That is going to matter. A discount day averaged 156.3 cups against 124.8 on an ordinary day, a difference of 31.5. The offer was only ever worth 22 of those cups. The rest is the weather, and right now the two are tangled together.

=== step === concept
## What a forecast that only knows the sales column does

Let's hold back the last 21 days so we have something honest to score against. The model is fitted on days 1 to 99 and never sees days 100 to 120 until we ask it to forecast them.

```r
# Split the 120 days and fit a model that sees nothing but the sales column
train <- shop[1:99, ]
test  <- shop[100:120, ]
y_tr <- train$sales
y_te <- test$sales

fit_plain <- auto.arima(y_tr)
fit_plain
#> Series: y_tr
#> ARIMA(0,1,0)
#>
#> sigma^2 = 102.8:  log likelihood = -366.06
#> AIC=734.12   AICc=734.16   BIC=736.71
```

`auto.arima()` searched the orders and settled on ARIMA(0,1,0). Read that as no AR term, one difference, no MA term, which is the model people call a random walk. It says today's cups are yesterday's cups plus something unpredictable.

A random walk has a very simple opinion about the future. Whatever it saw last is its best guess for every day after that.

```r
# Forecast the 21 held-out days and lay the forecast over what really happened
fc_plain <- forecast(fit_plain, h = 21)
round(as.numeric(fc_plain$mean), 1)
#>  [1] 120 120 120 120 120 120 120 120 120 120 120 120 120 120 120 120 120 120 120
#> [20] 120 120

y_te
#>  [1] 134 119 123 109 103 116 120 125 112 112 110 113 117 108 111 120 152 161 154
#> [20] 149 143

plot(fc_plain, main = "Forecast from the sales column alone", xlab = "Day", ylab = "Cups")
lines(100:120, y_te, col = "darkorange", lwd = 2)
```

The forecast is a flat line at 120 cups for three straight weeks. The orange line is what the counter actually did: down to 103 in the cool stretch, up to 161 near the end when the weather turned and the two for one came back.

The model is not broken. It is doing the only thing it can do with what it was handed. Every one of those swings has a cause, and not one of those causes is in the sales column.

=== step === concept
## xreg: handing the temperature to auto.arima

Now the good part. We give the same function the same 99 days of sales, and one extra thing: a column holding that day's temperature.

The argument is `xreg`, and the rule for it is simple: one row per day of the series, in the same order, with a name on the column so R can label the coefficient when it prints.

```r
# Fit the same model again, this time with the day's temperature handed in
fit_temp <- auto.arima(y_tr, xreg = cbind(temperature = train$temperature))
fit_temp
#> Series: y_tr
#> Regression with ARIMA(1,0,0) errors
#>
#> Coefficients:
#>          ar1  intercept  temperature
#>       0.6032    39.8341       3.4924
#> s.e.  0.0845     9.8287       0.3781
#>
#> sigma^2 = 50.65:  log likelihood = -333.46
#> AIC=674.92   AICc=675.34   BIC=685.3
```

Go straight to the coefficient block, and to the column labelled `temperature`. It reads 3.4924, with a standard error of 0.3781 underneath it. That second number is the model's own estimate of how far the first one would move if the counter ran another four months and you fitted it again.

That number has units, and the units are the whole point. It is cups per degree. One degree hotter, and the model expects about 3.5 more cups over the counter that day. We built the data with 3.2 cups per degree, so the model has landed within one standard error of the truth, using nothing but 99 days of sales and 99 temperatures.

The other two entries are worth a quick word each. `intercept` of 39.83 is where the line starts, the cups you would expect at zero degrees, which is a place this counter never goes. `ar1` of 0.6032 is the time series half of the model, still doing its job on whatever the temperature could not explain.

=== step === quiz
## Quick check: what a temperature coefficient of 3.49 says

The fitted model gave `temperature` a coefficient of 3.4924. Which sentence reads it correctly?

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- The counter sells about 3.49 cups on a hot day. ::no
- Temperature accounts for about 3.49% of the swing in daily sales. ::no
- Take two days that are alike except that one is a degree warmer, and the model expects about 3.49 more cups on the warmer one. ::ok That is it. A regression coefficient is always a rate: cups per degree here, and it is what one more degree buys you with the other columns held where they are.
- Sales are about 3.49 times higher when the weather is hot. ::no A coefficient is not a total, not a percentage and not a multiplier. It is what one extra unit of that column buys you, in the units of the thing you are forecasting. One degree, about 3.49 cups.

=== step === concept
## A 0/1 column is a regressor too: the discount calendar

The temperature is a number that moves every day. The discount is not. It either ran or it did not, so the column is 16 ones and 104 zeros.

That is fine. A regressor does not have to be continuous, and R does not treat a 0/1 column any differently. Its coefficient just reads more simply, as the effect of switching that column from 0 to 1.

We stack the two columns into one matrix with `cbind()` and hand the whole matrix over.

```r
# Add the discount calendar as a second column and refit
X_tr <- cbind(temperature = train$temperature, promo = train$promo)
X_te <- cbind(temperature = test$temperature,  promo = test$promo)

fit_full <- auto.arima(y_tr, xreg = X_tr)
fit_full
#> Series: y_tr
#> Regression with ARIMA(1,0,0) errors
#>
#> Coefficients:
#>          ar1  intercept  temperature    promo
#>       0.5648    50.3018       2.9838  21.8665
#> s.e.  0.0854     7.3538       0.2861   2.8055
#>
#> sigma^2 = 31.21:  log likelihood = -308.94
#> AIC=627.88   AICc=628.52   BIC=640.85
```

`promo` reads 21.8665. Running the two for one is worth about 21.9 extra cups on the day, whatever the weather is doing. We built it in at 22.

Now look at what happened to the temperature. It was 3.4924 a moment ago and it is 2.9838 now, and nothing about the weather changed between the two fits. What changed is that the discount days finally have a column of their own.

Remember where those discount days sat, on the warm stretches. With no discount column in the model, the only thing available to explain those big days was the temperature, so part of what the offer did got charged to the weather instead. Give the discount its own column and that credit goes where it belongs. The temperature slope drops by half a cup a degree, to 2.9838, and the discount picks up 21.8665 of its own.

[KEY INSIGHT]
Leave a real driver out of the model and its effect does not vanish. It gets absorbed by whatever column it happens to move with, and that column's coefficient comes back wrong.

=== step === tryit
## Your turn: what the discount sold across the whole 120 days

The owner does not want a coefficient. The owner wants to know what the two for one actually sold.

`fit_full` is the fitted model and `shop$promo` is the 0/1 discount column for all 120 days. Pull the discount coefficient out of the model by name, then turn it into a total.

```r
# fit_full holds the fitted model, and shop$promo is the 0/1 discount
# column for all 120 days.
# Pull the discount coefficient out of fit_full by name, then multiply it
# by the number of discount days to get the cups it sold in total.
# Two lines. Press Check when you have them.
```
::check {"regex": "coef[(]fit_full[)]\\s*\\[+\\s*[\"']promo", "gate": true, "difficulty": "beginner", "ok": "About 21.87 cups a day across 16 discount days, which comes to 349.9 cups. That is the sentence to say out loud when somebody asks what the offer was worth.", "no": "Two moves. Pull the coefficient out by name with `coef(fit_full)[\"promo\"]`, then multiply it by `sum(shop$promo)`, which counts the discount days."}
::solution
```r
# Turn the discount coefficient into the cups it sold across every discount day
promo_cups <- coef(fit_full)["promo"]
round(promo_cups, 2)
#> promo
#> 21.87

round(promo_cups * sum(shop$promo), 1)
#> promo
#> 349.9
```

R keeps the name `promo` on the answer because we pulled the coefficient out by name. The number underneath it is what matters: about 350 cups sold by the offer over the four months.

=== step === concept
## Why R prints "Regression with ARIMA errors"

You have probably noticed that R has not once used the word ARIMAX. Both fits came back headed "Regression with ARIMA(1,0,0) errors", and that heading is not R being fussy. It is R telling you precisely what it built.

Here is the model, written out.

\[ y_t = \beta_0 + \beta_1 \, \text{temperature}_t + \beta_2 \, \text{discount}_t + n_t \]

The first three terms are an ordinary regression, the kind you would fit with `lm()`. Cups on day \( t \) equal a baseline, plus so much per degree, plus so much on a discount day.

Then there is \( n_t \), which is everything the regression could not explain on day \( t \). In an ordinary regression you assume those leftovers are independent, one fresh unrelated wobble per day. Here they are allowed to be something better behaved than that.

\[ n_t = \phi \, n_{t-1} + \varepsilon_t \]

That is the ARIMA(1,0,0) part. Today's leftover is \( \phi \) times yesterday's leftover, plus fresh noise. A quiet day leaves a quiet day behind it.

Every coefficient in the printout now has a home. `intercept` 50.3018 is \( \beta_0 \), `temperature` 2.9838 is \( \beta_1 \), `promo` 21.8665 is \( \beta_2 \), and `ar1` 0.5648 is \( \phi \). That is one regression, with a memory bolted onto its errors.

[NOTE]
The word ARIMAX gets used for two different models in the literature. The other one puts lagged values of the series itself on the right hand side alongside the regressors, which changes what every coefficient means. R sidesteps the argument by printing what it actually fitted, so the heading on your own output always tells you which model you have.

=== step === concept
## What lm gets wrong on the same two columns

A fair question at this point: if the model is a regression with a memory bolted onto its errors, how much is that memory really buying? Let's fit the plain regression on the same two columns and find out.

One word first, because it is about to do a lot of work. A residual is that leftover \( n_t \) made concrete: take a day's real cups, subtract what the fitted line said that day should have been, and what is left over is that day's residual. `residuals()` hands you all 99 of them.

```r
# Fit the same two columns with ordinary least squares and look at its residuals
lm_fit <- lm(sales ~ temperature + promo, data = train)
round(summary(lm_fit)$coefficients[, 1:2], 4)
#>             Estimate Std. Error
#> (Intercept)  45.0746     7.0036
#> temperature   3.2035     0.2750
#> promo        18.9476     2.2951

res_acf <- Acf(residuals(lm_fit), main = "Day to day carryover in the lm residuals")
round(res_acf$acf[2], 3)
#> [1] 0.539
```

The slopes are close to what the model with ARIMA errors gave. Temperature reads 3.2035 against 2.9838, and the discount 18.9476 against 21.8665. If a coefficient were all you wanted, you could almost stop here.

Now look at the plot, and at the number underneath it. Each spike is the correlation between a residual and the residual so many days earlier, and the first one stands at 0.539. Knowing that yesterday came in above the line tells you a great deal about today.

That matters, because the standard error `lm()` prints is calculated on the flat assumption that this number is zero. It is 0.539. So the question is not whether `lm()` is wrong in principle. The question is by how much, and we can measure it, because we built this data and can rerun the same 99 days as many times as we like.

```r
# Run the counter's 99 days 150 more times and see how far each slope really moves
temp_tr  <- train$temperature
promo_tr <- train$promo

set.seed(7)
runs <- 150
slope_lm     <- numeric(runs)
slope_arimax <- numeric(runs)

for (i in 1:runs) {
  fresh_noise <- as.numeric(arima.sim(list(ar = 0.7), n = 99, sd = 6))
  fresh_sales <- round(45 + 3.2 * temp_tr + 22 * promo_tr + fresh_noise)
  slope_lm[i]     <- coef(lm(fresh_sales ~ temp_tr + promo_tr))[2]
  slope_arimax[i] <- coef(Arima(fresh_sales, order = c(1, 0, 0), xreg = X_tr))["temperature"]
}

round(c(lm_says       = summary(lm_fit)$coefficients["temperature", "Std. Error"],
        lm_really     = sd(slope_lm),
        arimax_says   = unname(sqrt(diag(fit_full$var.coef))["temperature"]),
        arimax_really = sd(slope_arimax)), 3)
#>       lm_says     lm_really   arimax_says arimax_really
#>         0.275         0.490         0.286         0.297
```

The temperatures and the discount days stay exactly where they were, and only the noise is fresh in each of the 150 runs. Each run gets its own temperature slope, and the spread of those 150 slopes is how much the estimate really moves from one four month stretch to the next.

`lm()` quotes 0.275. The slope actually moves 0.490. The error bar you would take into a meeting is a little over half as wide as it should be, so a temperature effect you call solid may be nothing of the sort.

The model with ARIMA errors quotes 0.286 against a real movement of 0.297. Near enough. It is not a better slope, it is an honest one, and the difference is entirely the memory in the errors.

The loop uses `Arima()` with the order fixed at (1,0,0) rather than `auto.arima()`, only because searching for the order 150 times over would take a while and we already know the order.

=== step === widget
## What correlated errors do to the interval you would quote

That 0.539 is not a special number, it is a dial, and it is worth seeing the whole range of it rather than the one setting this counter happens to sit at.

Drag the severity dial below. At every setting it runs a couple of thousand complete studies, fits the plain regression to each one, and measures two things: how well the model fits, and how often the 95% interval it quotes actually contains the true value.

::widget assumption-dial {"assumption":"autocorrelation","levels":11,"start":0}

Watch the two panels move at different speeds. Fit barely notices. R squared at severe autocorrelation looks much like R squared at none, which is why nothing in a summary output ever warns you.

Coverage is the one that goes. An interval sold to you as containing the truth 95 times in 100 slides well below that as the carryover grows, and the model goes on looking perfectly fine while it happens.

The gap between those two panels is the entire reason the ARIMA half of the model exists. It is not there to improve the fit. It is there to keep the uncertainty honest.

=== step === quiz
## Quick check: what the ARIMA part of the model is for

Fitting the two columns with `lm()` gave a temperature slope of 3.2035, and fitting them with ARIMA errors gave 2.9838. What is the ARIMA half of the model really doing for you?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- It changes what the temperature coefficient means, so 2.9838 is no longer cups per degree. ::no
- It accounts for the carryover left in the errors, which leaves the slope roughly where it was and makes the uncertainty around it trustworthy. ::ok Exactly. The slopes barely moved, 3.2035 against 2.9838, while the quoted standard error went from badly too small to about right. The estimate was never the problem.
- It strips the autocorrelation out of the sales column so that a regression is allowed to be fitted to it. ::no
- It makes the model fit the training days better, and a better fit is what tightened the estimate. ::no The slope means the same thing in both models, and both fit the training days perfectly respectably. What the ARIMA part changes is the error bar: `lm()` quoted 0.275 for a slope that really moves 0.490, and the version with ARIMA errors quoted 0.286 for one that moves 0.297.

=== step === concept
## Forecasting needs the regressors' future values

There is a catch to all this, and you meet it the moment you try to forecast.

A plain ARIMA can be asked for 21 days and will produce them out of thin air, because everything it needs is already in the series. An ARIMAX cannot. It needs the temperature on each of those 21 days, and the temperature is not something it can invent.

So you hand those over too, the same columns in the same order, for the days you want forecast.

```r
# Forecast the 21 held-out days, handing over their temperature and discount flag
head(X_te, 3)
#>      temperature promo
#> [1,]        28.8     0
#> [2,]        25.2     0
#> [3,]        25.7     0

fc_full <- forecast(fit_full, xreg = X_te)
round(head(as.data.frame(fc_full), 3), 1)
#>     Point Forecast Lo 80 Hi 80 Lo 95 Hi 95
#> 100          138.0 130.9 145.2 127.1 149.0
#> 101          126.5 118.3 134.7 113.9 139.1
#> 102          127.6 119.0 136.1 114.5 140.6
```

Notice there is no `h` in that call. There does not need to be one. `X_te` has 21 rows, so the forecast is 21 days long, and the horizon is decided by the matrix you pass rather than by a number you type.

And look at the point forecasts. Day 100 comes back at 138.0 and day 101 at 126.5, because day 100 was 28.8 degrees and day 101 was 3.6 degrees cooler. This forecast has a shape. The flat line is gone.

=== step === concept
## Did the outside information sharpen the forecast?

Here is the test that decides everything, and the only one the owner would care about. Three models go up against the same 21 days that none of them has seen, and there is one question to answer: how far off was each one on a typical day?

The measure is RMSE, the root mean squared error. Take each day's miss in cups, square them so the signs stop cancelling, average, and take the square root. What comes back is roughly the size of a typical day's miss, in cups, with the worst days weighing heaviest.

You could work that out by hand, but `accuracy()` from the forecast package already does it. Hand it a forecast and the real values it should be scored against, and it returns a small table with a row called `Training set` and a row called `Test set`. The training row is the fit on days the model learned from, so the row worth reading is `Test set`, and the column we want out of it is `RMSE`.

```r
# Score all three forecasts on the same 21 days none of the models ever saw
fc_temp <- forecast(fit_temp, xreg = cbind(temperature = test$temperature))

holdout_rmse <- function(fc) round(accuracy(fc, y_te)["Test set", "RMSE"], 2)

data.frame(knows = c("sales only", "sales and temperature", "sales, temperature and discount"),
           rmse  = c(holdout_rmse(fc_plain), holdout_rmse(fc_temp), holdout_rmse(fc_full)))
#>                             knows  rmse
#> 1                      sales only 17.46
#> 2           sales and temperature 10.91
#> 3 sales, temperature and discount  6.32
```

That is the promise paid, on days the models never saw.

A forecast that knew only its own past missed by about 17.5 cups a day. Hand it the temperature and the miss falls to 10.9. Hand it the discount calendar as well and it falls to 6.3, which is roughly a third of where it started.

Nothing about the algorithm changed between the first row and the last. It is the same `auto.arima()`, the same 99 training days and the same 21 days scored. The only thing that improved is what the model was allowed to know, and it was information the owner had the whole time.

=== step === tryit
## Your turn: the average daily miss, in cups

RMSE is the right measure for comparing models, but it is a strange thing to say out loud to a shop owner, because the squaring makes it bigger than the miss anybody would actually notice.

The plain average of the misses is easier to explain and tells the same story. Work it out for both forecasts.

```r
# fc_plain holds the forecast from the sales-only model, fc_full the forecast
# from the model that also saw temperature and the discount, and y_te holds
# the 21 real days.
# Work out the plain average miss, in cups, for each of the two forecasts.
# Two lines. Press Check when you have them.
```
::check {"regex": "mean\\s*[(]\\s*abs\\s*[(]", "gate": true, "difficulty": "intermediate", "ok": "12.9 cups a day for the sales-only forecast, against 5.26 for the one that knew the temperature and the discount. RMSE said 17.46 against 6.32, larger both times because it leans on the worst days, and pointing the same way.", "no": "Take the difference between the real days and the forecast, drop the sign, and average: `mean(abs(y_te - as.numeric(fc_plain$mean)))`. Then the same line with `fc_full`."}
::solution
```r
# Average miss in cups for each forecast, on the 21 held-out days
round(mean(abs(y_te - as.numeric(fc_plain$mean))), 2)
#> [1] 12.9

round(mean(abs(y_te - as.numeric(fc_full$mean))), 2)
#> [1] 5.26
```

This is the MAE, the mean absolute error, and it is the number to quote when somebody asks how far out the forecast usually is.

=== step === concept
## Telling a regressor that earns its place from one that does not

Everything so far has gone well, and that should make you a little suspicious. Both columns we added were real drivers, because we put them there ourselves. Out in the world, most candidate regressors are somebody's hunch.

So let's behave like a real analyst and test a hunch. Somebody suggests that the number of cars in the car park next door drives footfall. It sounds plausible. It is in fact pure noise, and we know that because we are about to generate it.

```r
# Add a plausible-sounding third column, cars in the car park, and see what it buys
set.seed(60)
parking <- round(rnorm(120, mean = 180, sd = 25))

X_tr_park <- cbind(X_tr, parking = parking[1:99])
X_te_park <- cbind(X_te, parking = parking[100:120])

fit_park <- auto.arima(y_tr, xreg = X_tr_park)
fit_park
#> Series: y_tr
#> Regression with ARIMA(1,0,0) errors
#>
#> Coefficients:
#>          ar1  intercept  temperature    promo  parking
#>       0.5652    49.8369       2.9820  21.8322   0.0028
#> s.e.  0.0855     8.2487       0.2865   2.8206   0.0225
#>
#> sigma^2 = 31.53:  log likelihood = -308.93
#> AIC=629.86   AICc=630.77   BIC=645.43
```

Start with the coefficient itself. `parking` reads 0.0028, and its standard error is 0.0225, eight times larger than the estimate it belongs to. When a coefficient is that much smaller than its own standard error, the honest reading is that the model has no idea whether the effect is positive, negative or nothing at all.

Now the two numbers that decide it. AICc is a fit score that charges a price for every extra term, so it only improves when a column pays for itself. And the holdout error is the one we have been using all along.

```r
# Put the two-column and three-column models side by side on both scores
fc_park <- forecast(fit_park, xreg = X_te_park)

data.frame(columns = c("temperature and discount", "plus car park"),
           aicc = round(c(fit_full$aicc, fit_park$aicc), 2),
           holdout_rmse = c(holdout_rmse(fc_full), holdout_rmse(fc_park)))
#>                    columns   aicc holdout_rmse
#> 1 temperature and discount 628.52         6.32
#> 2            plus car park 630.77         6.30
```

AICc went up, from 628.52 to 630.77, which means the tiny gain in fit did not cover the cost of the parameter. The holdout error went from 6.32 to 6.30, which is two hundredths of a cup, and that is not a result, that is a coin landing.

That last part is the one to hold on to. A useless column rarely announces itself by making the forecast worse. It sits there doing nothing while the fit on the training days creeps up, because adding a column always improves the fit on the training days. The coefficient against its standard error, and AICc, are what tell you the truth.

[WARNING]
Never judge a new regressor by whether the model fits the training days better. It always will. Judge it by AICc, by the size of the coefficient against its own standard error, and by what it does on days the model has not seen.

=== step === quiz
## Quick check: the candidate regressor whose AICc went up

The car park column came back with a coefficient of 0.0028 and a standard error of 0.0225. AICc went from 628.52 to 630.77, and the holdout error went from 6.32 to 6.30. What do you do with the column?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Keep it. The holdout error fell from 6.32 to 6.30, so it did help a little. ::no
- Drop it. The coefficient is a fraction of its own standard error, AICc got worse, and two hundredths of a cup on the holdout is noise rather than evidence. ::ok Right on all three counts. A column that cannot beat its own standard error has told you nothing, and AICc charging you 2.25 points for it is the model saying the same thing.
- Keep it. The fit on the training days improved, and that is what a model is scored on. ::no
- Collect more days before deciding, because 99 is too few to judge any regressor on. ::no Three signals point the same way here: a coefficient eight times smaller than its own standard error, an AICc that went up rather than down, and a holdout difference of 0.02 cups. More data is a fine instinct in general, but this column has already answered the question.

=== step === concept
## What it costs when the regressor has to be forecast too

There is one more thing to be straight about, and it is the one that quietly ruins real forecasts.

Every score so far handed the model the real temperatures for the 21 test days. That is fine for measuring what temperature is worth, but it is not a position you are ever in. On the day you forecast, next week's temperature does not exist yet. You have to forecast it first, then forecast sales on top of that.

So let's do exactly that and see what it costs.

```r
# Forecast the temperature first, then feed those guesses into the sales model
temp_fit <- auto.arima(train$temperature)
temp_hat <- as.numeric(forecast(temp_fit, h = 21)$mean)

round(mean(abs(test$temperature - temp_hat)), 2)
#> [1] 2.76

fc_hat <- forecast(fit_full, xreg = cbind(temperature = temp_hat, promo = test$promo))

data.frame(temperature_used = c("the real readings", "a forecast of them"),
           rmse = c(holdout_rmse(fc_full), holdout_rmse(fc_hat)),
           width_95 = round(c(mean(fc_full$upper[, 2] - fc_full$lower[, 2]),
                              mean(fc_hat$upper[, 2] - fc_hat$lower[, 2])), 2))
#>     temperature_used  rmse width_95
#> 1  the real readings  6.32    26.22
#> 2 a forecast of them 11.90    26.22
```

The temperature forecast is off by 2.76 degrees on an average day, which for three weeks ahead is not bad at all. Push those guesses through a model that charges about 3 cups a degree, though, and the sales error nearly doubles, from 6.32 cups to 11.90.

Now look at the last column, because this is the part that costs people money. A forecast carries an 80% band and a 95% band, the four columns you saw printed earlier, and `upper[, 2]` and `lower[, 2]` pick out the wider 95% pair. Subtract one from the other and you have the width of the interval in cups. It is 26.22 cups, exactly the same both times. The model has no way of knowing that the temperatures it was handed the second time were guesses, so it treats them as facts and quotes you the confidence it quoted before.

The forecast got nearly twice as bad and the error bars did not move by a single cup.

[WARNING]
An ARIMAX interval only covers the uncertainty in the sales model. Any error in a forecast regressor is invisible to it. Whenever the future values of a driver are themselves estimates, the interval you are shown is narrower than the truth, and nothing in the output says so.

=== step === quiz
## Quick check: which regressors are safe three weeks out

You need a 21 day forecast, and your model uses two columns: the day's temperature and the discount flag. Which one can you hand over with confidence?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- Both, because the model needs every column filled in and will use whatever you give it. ::no
- The temperature, because a weather forecast is a real model while a promotion is only somebody's plan. ::no
- The discount flag, because the owner sets those dates and already knows them. The temperature has to be forecast, and its error is passed straight into the sales forecast without ever showing up in the interval. ::ok Yes. That is the useful split: a regressor you control or already know is safe at any horizon, and a regressor you have to predict quietly adds error the interval never reports.
- Neither, because a forecast three weeks out cannot use outside columns at all. ::no Outside columns are perfectly usable three weeks out, and one of these two is known exactly. The discount calendar is a decision the owner has already made. The temperature is a prediction, and pushing predictions through a model that charges about 3 cups a degree is what took the error from 6.32 to 11.90.

=== step === tryit
## Your turn: fit, forecast and score a model of your own

Time to run the whole loop yourself, on a model nobody has built yet.

Suppose the counter had no thermometer and the only thing the owner could give you was the discount calendar. Fit that model on the 99 training days, forecast the 21 test days, and score it. Then see where it lands beside the others.

```r
# train and test hold days 1 to 99 and 100 to 120, and y_te holds the real
# cups for the 21 test days.
# Fit a model whose only outside column is the discount flag, forecast the
# 21 test days with it, and read its test-set RMSE.
# Three lines. Press Check when you have them.
```
::check {"regex": "accuracy\\s*[(][^)]*,\\s*y_te", "gate": true, "difficulty": "advanced", "ok": "It scores 11.56. Better than knowing nothing at all, which was 17.46, and a little worse than knowing only the temperature, which was 10.91. Both columns together got 6.32, so neither one is doing this on its own.", "no": "Three lines, each mirroring one you have already run: `fit_promo <- auto.arima(y_tr, xreg = cbind(promo = train$promo))`, then `fc_promo <- forecast(fit_promo, xreg = cbind(promo = test$promo))`, then `accuracy(fc_promo, y_te)`."}
::solution
```r
# Fit, forecast and score a model whose only outside column is the discount flag
fit_promo <- auto.arima(y_tr, xreg = cbind(promo = train$promo))
fc_promo  <- forecast(fit_promo, xreg = cbind(promo = test$promo))

round(accuracy(fc_promo, y_te)["Test set", "RMSE"], 2)
#> [1] 11.56
```

Four models now, scored on the same 21 days: 17.46 with nothing, 11.56 with the discount alone, 10.91 with the temperature alone, and 6.32 with both. The pair beats either column on its own by a wide margin, because they explain different days.

=== step === quiz
## Quick check: reading a fitted model end to end

One last one, and it puts the whole model in a single printout. A model comes back headed "Regression with ARIMA(1,0,0) errors", with `ar1` 0.5648, `intercept` 50.3018, `temperature` 2.9838 and `promo` 21.8665, and standard errors of 0.0854, 7.3538, 0.2861 and 2.8055 underneath them.

Which reading of it is right?

::quiz {"correct": 1, "gate": true, "difficulty": "advanced"}
- About 2.98 more cups for every extra degree, about 21.87 extra cups on a discount day, and about 0.56 of yesterday's leftover error carried into today. ::ok That is the whole model read correctly: two regression effects in cups, and one number describing what the errors do from one day to the next. The heading told you that last part was in there.
- About 2.98 more cups for every extra degree, about 21.87 extra cups on a discount day, and 0.5648 is the share of the variation in sales that the model explains. ::no
- 0.5648 is the correlation between yesterday's cups and today's, and 50.3018 is what the counter sells on an average day. ::no
- The discount matters and the temperature does not, because 21.8665 is far larger than 2.9838. ::no Two traps in those. The `ar1` term describes the leftover errors, not the sales themselves and not a share of anything explained. And coefficients in different units cannot be ranked against each other: 2.98 is per degree and 21.87 is per discount day, and across the 16 discount days the offer sold about 350 cups while a 10 degree spread in the weather moves roughly 30 cups a day.

=== step === concept
## References

- [Forecasting: Principles and Practice, chapter 10, Dynamic regression models](https://otexts.com/fpp3/dynamic.html) - Hyndman and Athanasopoulos. The standard treatment of regression with ARIMA errors, including why the errors have to be stationary and what happens when you difference both sides.
- [Automatic Time Series Forecasting: The forecast Package for R](https://doi.org/10.18637/jss.v027.i03) - Hyndman and Khandakar (2008), Journal of Statistical Software 27(3). The paper behind `auto.arima()`, including how the order search and the information criteria work.
- [Arima() reference, forecast package](https://pkg.robjhyndman.com/forecast/reference/Arima.html) - the documentation for `xreg`, and for how `Arima()` differs from the base `arima()`.
- [auto.arima() reference, forecast package](https://pkg.robjhyndman.com/forecast/reference/auto.arima.html) - what the order search does, what it charges for, and which arguments change it.
- Box, Jenkins, Reinsel and Ljung, Time Series Analysis: Forecasting and Control (5th edition), chapters 12 and 13. The transfer function models, which are the other thing the name ARIMAX is used for.

=== step === complete
## Quick recap

You took a forecast that knew only its own sales column, handed it what the shop owner already knew, and measured what that was worth on days the model had never seen.

- Outside columns go in through one argument, `xreg`, one row per day. A continuous column like temperature and a 0/1 column like a discount flag are treated exactly the same way.
- A coefficient is a rate in the units of the thing you are forecasting: 2.9838 cups per degree, 21.8665 cups on a discount day, about 350 cups from the offer across the whole 120 days.
- Leave a real driver out and its effect does not disappear. Temperature read 3.4924 while it was carrying the discount days on its back, and settled to 2.9838 once the discount had a column of its own.
- The ARIMA half is not there to improve the slope, it is there to make the error bar honest. Plain least squares quoted 0.275 for a slope that really moves 0.490.
- The typical daily miss on the 21 unseen days fell from 17.46 cups to 10.91 to 6.32 as the model was given more to work with.
- A regressor you have to forecast costs you. Guessing the temperature to within 2.76 degrees took the error from 6.32 to 11.90, and the interval never widened by a single cup.

So when somebody asks whether to add a driver to a forecast, here is the answer:

"Add it if you will know its value for the days you are forecasting, and keep it only if AICc and the held-out error say it earned its place."

Go and look at whatever series you are forecasting at work, and ask what the people around it already know that the model does not. There is usually a column.
