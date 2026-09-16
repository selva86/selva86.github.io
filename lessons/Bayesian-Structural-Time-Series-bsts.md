---
title: "State Space Models and the Kalman Filter Lesson 5: A posterior forecast band instead of one fitted line"
catalog_blurb: "See how putting priors on a forecast model turns one guess into a range."
description: "Put a prior on a structural time series model, run MCMC to build its posterior, and turn one fitted AirPassengers forecast into a whole band of futures."
keywords: "bayesian structural time series, bsts package, MCMC, Metropolis algorithm, spike-and-slab regression, posterior distribution, prior and posterior, StructTS, AirPassengers, forecast interval"
post_type: "LESSON"
curriculum_id: "5.80.5"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ts-statespace"
course_title: "State Space Models and the Kalman Filter"
course_lesson: "5"
course_total: "7"
course_landing: "State-Space-Models-and-the-Kalman-Filter-Course.html"
course_next: "Dynamic-Linear-Models-with-dlm.html"
course_prev: "Basic-Structural-Time-Series.html"
---

=== step === cover
## A posterior forecast band instead of one fitted line

Today let's understand Bayesian structural time series clearly, using one long real series as the running example throughout.

The series is AirPassengers, R's own built-in dataset: the monthly count of international airline passengers, January 1949 to December 1960, 144 months in all. It starts at 112 thousand passengers and ends at 432 thousand, climbing most years with the same summer peak repeating season after season.

Here is the whole series, plotted in the order the months actually happened.

::widget chart-plotter {"data":[{"x":1949.0000,"y":112},{"x":1949.0833,"y":118},{"x":1949.1667,"y":132},{"x":1949.2500,"y":129},{"x":1949.3333,"y":121},{"x":1949.4167,"y":135},{"x":1949.5000,"y":148},{"x":1949.5833,"y":148},{"x":1949.6667,"y":136},{"x":1949.7500,"y":119},{"x":1949.8333,"y":104},{"x":1949.9167,"y":118},{"x":1950.0000,"y":115},{"x":1950.0833,"y":126},{"x":1950.1667,"y":141},{"x":1950.2500,"y":135},{"x":1950.3333,"y":125},{"x":1950.4167,"y":149},{"x":1950.5000,"y":170},{"x":1950.5833,"y":170},{"x":1950.6667,"y":158},{"x":1950.7500,"y":133},{"x":1950.8333,"y":114},{"x":1950.9167,"y":140},{"x":1951.0000,"y":145},{"x":1951.0833,"y":150},{"x":1951.1667,"y":178},{"x":1951.2500,"y":163},{"x":1951.3333,"y":172},{"x":1951.4167,"y":178},{"x":1951.5000,"y":199},{"x":1951.5833,"y":199},{"x":1951.6667,"y":184},{"x":1951.7500,"y":162},{"x":1951.8333,"y":146},{"x":1951.9167,"y":166},{"x":1952.0000,"y":171},{"x":1952.0833,"y":180},{"x":1952.1667,"y":193},{"x":1952.2500,"y":181},{"x":1952.3333,"y":183},{"x":1952.4167,"y":218},{"x":1952.5000,"y":230},{"x":1952.5833,"y":242},{"x":1952.6667,"y":209},{"x":1952.7500,"y":191},{"x":1952.8333,"y":172},{"x":1952.9167,"y":194},{"x":1953.0000,"y":196},{"x":1953.0833,"y":196},{"x":1953.1667,"y":236},{"x":1953.2500,"y":235},{"x":1953.3333,"y":229},{"x":1953.4167,"y":243},{"x":1953.5000,"y":264},{"x":1953.5833,"y":272},{"x":1953.6667,"y":237},{"x":1953.7500,"y":211},{"x":1953.8333,"y":180},{"x":1953.9167,"y":201},{"x":1954.0000,"y":204},{"x":1954.0833,"y":188},{"x":1954.1667,"y":235},{"x":1954.2500,"y":227},{"x":1954.3333,"y":234},{"x":1954.4167,"y":264},{"x":1954.5000,"y":302},{"x":1954.5833,"y":293},{"x":1954.6667,"y":259},{"x":1954.7500,"y":229},{"x":1954.8333,"y":203},{"x":1954.9167,"y":229},{"x":1955.0000,"y":242},{"x":1955.0833,"y":233},{"x":1955.1667,"y":267},{"x":1955.2500,"y":269},{"x":1955.3333,"y":270},{"x":1955.4167,"y":315},{"x":1955.5000,"y":364},{"x":1955.5833,"y":347},{"x":1955.6667,"y":312},{"x":1955.7500,"y":274},{"x":1955.8333,"y":237},{"x":1955.9167,"y":278},{"x":1956.0000,"y":284},{"x":1956.0833,"y":277},{"x":1956.1667,"y":317},{"x":1956.2500,"y":313},{"x":1956.3333,"y":318},{"x":1956.4167,"y":374},{"x":1956.5000,"y":413},{"x":1956.5833,"y":405},{"x":1956.6667,"y":355},{"x":1956.7500,"y":306},{"x":1956.8333,"y":271},{"x":1956.9167,"y":306},{"x":1957.0000,"y":315},{"x":1957.0833,"y":301},{"x":1957.1667,"y":356},{"x":1957.2500,"y":348},{"x":1957.3333,"y":355},{"x":1957.4167,"y":422},{"x":1957.5000,"y":465},{"x":1957.5833,"y":467},{"x":1957.6667,"y":404},{"x":1957.7500,"y":347},{"x":1957.8333,"y":305},{"x":1957.9167,"y":336},{"x":1958.0000,"y":340},{"x":1958.0833,"y":318},{"x":1958.1667,"y":362},{"x":1958.2500,"y":348},{"x":1958.3333,"y":363},{"x":1958.4167,"y":435},{"x":1958.5000,"y":491},{"x":1958.5833,"y":505},{"x":1958.6667,"y":404},{"x":1958.7500,"y":359},{"x":1958.8333,"y":310},{"x":1958.9167,"y":337},{"x":1959.0000,"y":360},{"x":1959.0833,"y":342},{"x":1959.1667,"y":406},{"x":1959.2500,"y":396},{"x":1959.3333,"y":420},{"x":1959.4167,"y":472},{"x":1959.5000,"y":548},{"x":1959.5833,"y":559},{"x":1959.6667,"y":463},{"x":1959.7500,"y":407},{"x":1959.8333,"y":362},{"x":1959.9167,"y":405},{"x":1960.0000,"y":417},{"x":1960.0833,"y":391},{"x":1960.1667,"y":419},{"x":1960.2500,"y":461},{"x":1960.3333,"y":472},{"x":1960.4167,"y":535},{"x":1960.5000,"y":622},{"x":1960.5833,"y":606},{"x":1960.6667,"y":508},{"x":1960.7500,"y":461},{"x":1960.8333,"y":390},{"x":1960.9167,"y":432}],"geoms":["line"],"x":"year","y":"passengers (thousands)"}

A structural model fits that climbing, seasonal shape with one best number per moving part. This lesson turns each of those numbers into a whole range of plausible ones instead.

=== step === concept
## One fitted number per state: the maximum-likelihood version

A structural model breaks a series like this one into separate moving parts: a level that drifts, a slope, a seasonal pattern, and left-over noise. Fit it once by maximum likelihood, the ordinary way, and R hands back exactly one number for how much each part is allowed to move.

Fit the structural model on the log of AirPassengers, the same fit base R's `StructTS()` gives you, and read off those four numbers.

```r
# Fit a structural time series model by maximum likelihood and see its one best guess per state
ap <- AirPassengers
log_ap <- log(ap)
fit <- StructTS(log_ap, type = "BSM")
fit$coef
```
```
#>        level        slope         seas      epsilon 
#> 0.0007718511 0.0000000000 0.0013969062 0.0000000000
```

`level`, `slope`, `seas` and `epsilon` are the variances of the level, the slope, the seasonal pattern and the leftover noise. Maximum likelihood searches over every possible value of those four variances and keeps the one combination that makes the observed 144 months most likely to have happened. It hands back 0.00077 for the level and 0.0014 for the seasonal swing, and nothing else: no sense of whether 0.0005 or 0.001 would have explained the data almost as well.

That is the gap this lesson closes. Instead of one best guess per variance, put a range of plausible values on each one, update that range with the data, and read the forecast's uncertainty straight out of the result.

=== step === concept
## Prior, likelihood, posterior: updating a belief with data

Set the structural model aside for a moment and ask a simpler question first: how fast does AirPassengers grow from one January to the next, and how sure can you be about that growth rate before and after you have actually seen the data?

Before you look at a single year of data, you can still make a reasonable guess. Call that guess the **prior**: a spread of plausible values for the growth rate, centred wherever you think is reasonable, wide enough to admit you could be wrong. A modest prior here is a mean of 0.05 (5% growth a year) with a spread, a standard deviation, of 0.08, which comfortably covers anywhere from about -3% to +13% growth.

Then you look at the data. The **likelihood** is how well each candidate growth rate explains what you actually saw. And the **posterior** is what you get once you combine the two: the prior's starting spread, narrowed and shifted by whatever the data says.

Pull one January value from AirPassengers for each of the 12 years, 1949 to 1960, and turn each year-over-year change into a growth rate.

```r
# Turn 12 January passenger counts into 11 year-over-year growth rates
jan_vals <- ap[seq(1, 144, by = 12)]        # one January passenger count per year, 1949 to 1960
yoy <- diff(log(jan_vals))                   # 11 year-over-year log-growth rates
round(yoy, 4)
```
```
#>  [1] 0.0264 0.2318 0.1649 0.1365 0.0400 0.1708 0.1600 0.1036 0.0764 0.0572
#> [11] 0.1470
```

`log(jan_vals)` turns each January count into its natural log, and `diff()` subtracts each year's log value from the year before, giving 11 growth rates instead of 12 raw counts. They bounce around: as low as 2.6% in 1950, as high as 23.2% in 1951.

Average those 11 rates and measure how much they scatter.

```r
# Average the 11 growth rates and measure their spread
data_mean <- mean(yoy)
data_sd <- sd(yoy)
c(data_mean = round(data_mean, 4), data_sd = round(data_sd, 4))
```
```
#> data_mean   data_sd 
#>    0.1195    0.0640
```

The 11 years average 11.95% growth, with a standard deviation of 6.40%. That `data_sd` is the data's own natural scatter, not something you are choosing; it comes straight out of the 11 numbers above.

Watch that average settle as each year is added, one year at a time.

```r
# Track the running average as each year of growth arrives
running_mean <- sapply(seq_along(yoy), function(k) mean(yoy[1:k]))
round(running_mean, 4)
```
```
#>  [1] 0.0264 0.1291 0.1411 0.1399 0.1199 0.1284 0.1329 0.1293 0.1234 0.1168
#> [11] 0.1195
```

After just one year it sits at 2.64%, pulled entirely by that single 1950 value. By the eleventh it has settled at 11.95%, barely moving from where it was after year nine or ten. That settling, not any single year's number, is what a posterior does as data arrives.

Combine that same 11-year average with the 0.05/0.08 prior using the one formula that updates a normal prior with normal data.

\[ \sigma_{post}^2 = \left(\frac{1}{\sigma_{prior}^2} + \frac{n}{\sigma_{data}^2}\right)^{-1} \]

\[ \mu_{post} = \sigma_{post}^2 \left(\frac{\mu_{prior}}{\sigma_{prior}^2} + \frac{n \bar{x}}{\sigma_{data}^2}\right) \]

Every piece of that formula is already on the page: `prior_mean` and `prior_sd` are the 0.05 and 0.08 you started with, `data_mean` and `data_sd` are the 0.1195 and 0.0640 you just computed, and `n` is 11.

```r
# Combine the 0.05/0.08 prior with the 11-year data into a posterior
prior_mean <- 0.05
prior_sd <- 0.08
n <- length(yoy)

prior_var <- prior_sd^2
data_var <- data_sd^2 / n
post_var <- 1 / (1 / prior_var + 1 / data_var)
post_mean <- post_var * (prior_mean / prior_var + data_mean / data_var)
c(post_mean = round(post_mean, 4), post_sd = round(sqrt(post_var), 4))
```
```
#> post_mean   post_sd 
#>    0.1157    0.0188
```

The posterior mean, 0.1157, sits close to the data's own 0.1195, barely pulled by the wide prior. Its spread, 0.0188, is less than a third of the prior's 0.08: eleven years of real data narrowed a wide guess into a tight one.

The widget below runs that exact same update, prior times data equals posterior, with friendlier round numbers so you can drag it yourself.

::widget bayes-update {}

It starts with a prior centred at 0 with a spread of 1, and 10 data points averaging 3. Move the data-points slider up past 50 and watch the posterior pinch in toward the data, the same pinching the growth-rate posterior just went through as the years arrived.

=== step === quiz
## Quick check

You just watched the growth-rate posterior tighten from a spread of 0.08 down to 0.0188 as eleven years of real Januaries arrived. Here is a quick check on what that widget, and the numbers before it, were both showing.

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- It gets wider, since more data means more individual values it now has to explain. ::no
- It stays centred near the data's own average and gets narrower as more years arrive. ::ok Right. That is exactly what you watched: the running mean settled near 0.1195 and the posterior sd fell from 0.08 all the way to 0.0188 by year eleven.
- It drifts further away from the data, back toward the original prior guess. ::no
- It stays fixed at the prior guess no matter how many years of data arrive. ::no More data always pulls a posterior toward what the data itself says, and shrinks its spread as it goes. It never widens, drifts back toward the prior, or freezes at the prior's starting guess: the running mean above moved from 0.0264 to 0.1195, and the posterior sd fell from 0.08 to 0.0188, both settling toward the data, not away from it.

=== step === concept
## MCMC: drawing samples when there is no tidy formula

That growth-rate posterior had a tidy formula because the prior and the data were both normal, a special case called conjugacy. A structural model's four variances are not that simple: they interact with each other inside the same fit, and no clean formula gives their joint posterior.

For a case like that, Markov Chain Monte Carlo, MCMC, is the general tool. Its name breaks into two ordinary ideas. A **Markov chain** is a sequence of guesses where each next guess depends only on the current one, never on how it got there. **Monte Carlo** just means using random draws to approximate an answer you cannot write down as a formula. Put together, MCMC draws thousands of guesses, one after another, in a way that spends more time near the values the data actually supports.

The specific recipe used here is called the **Metropolis algorithm**, and it is only four steps, repeated thousands of times.

1. Propose a new guess near the current one.
2. Compute how well that guess fits the prior and the 11 growth rates, compared to the current guess.
3. Accept the new guess if it fits better; if it fits worse, still accept it sometimes, more often the closer the two guesses are.
4. Whatever you end up with becomes the current guess for the next round.

Comparing how well a guess fits is done on a log scale, so accepting a proposal comes down to one comparison.

\[ \log p(\mu_{propose}) - \log p(\mu_{current}) > \log u \]

`p(mu)` here is the prior density at `mu` times the likelihood of all 11 growth rates at `mu`, and the log turns a product of many small numbers into a sum that is easier to compute exactly. `u` is a fresh random draw between 0 and 1 at every step; a better-fitting proposal always clears that bar, and a worse one still clears it once in a while, often enough to keep the chain from getting stuck in one spot.

Run that loop 5000 times on the exact same prior and the same 11 growth rates already on this page, and check whether it lands anywhere near the formula's own answer.

```r
# Draw thousands of guesses for the growth rate when no clean formula gives the posterior
log_post <- function(mu) {
  sum(dnorm(yoy, mean = mu, sd = data_sd, log = TRUE)) + dnorm(mu, mean = prior_mean, sd = prior_sd, log = TRUE)
}

set.seed(123)
niter <- 5000
chain <- numeric(niter)
current <- prior_mean
current_lp <- log_post(current)
accepted <- 0
for (i in 1:niter) {
  proposal <- current + rnorm(1, 0, 0.03)
  proposal_lp <- log_post(proposal)
  if (log(runif(1)) < proposal_lp - current_lp) {
    current <- proposal
    current_lp <- proposal_lp
    accepted <- accepted + 1
  }
  chain[i] <- current
}

kept <- chain[1001:niter]
c(acceptance_rate = round(accepted / niter, 3), mcmc_mean = round(mean(kept), 4), mcmc_sd = round(sd(kept), 4))
```
```
#> acceptance_rate       mcmc_mean         mcmc_sd 
#>          0.5780          0.1155          0.0190
```

`log_post(mu)` is `log p(mu)`: the log-likelihood of all 11 growth rates at that `mu`, plus the log-prior at `mu`. The loop proposes a nearby `mu` with `rnorm(1, 0, 0.03)`, accepts it under the rule above, and stores whatever the current guess is after each of the 5000 rounds, accepted or not. The first 1000 rounds are discarded as burn-in, the time the chain takes to wander from the starting guess, 0.05, over to the region the data actually supports.

58% of the proposals got accepted, and the remaining 4000 draws average 0.1155 with a spread of 0.0190. The conjugate-update formula gave 0.1157 and 0.0188. MCMC found, by proposing and accepting thousands of guesses, almost exactly what the formula had already given, on a problem simple enough to check. A structural model's variances are not that simple, which is exactly why a genuinely Bayesian fit of one always leans on MCMC instead of a formula.

=== step === concept
## Spike-and-slab regression, and what the bsts package puts together

Structural models get more useful once you let them lean on outside predictors: search-term trends, prices, competitor activity, anything you suspect might help explain the series. But with a dozen or more candidates, you rarely know in advance which of them genuinely matter.

**Spike-and-slab regression** answers that by putting an unusual prior on each candidate's coefficient: a spike of probability sitting exactly at zero, for "this predictor does not belong", next to a slab spread wide around zero, for "this predictor has a real effect". MCMC then draws thousands of times from that prior combined with the data. How often a coefficient gets drawn away from zero, across all those draws, is its posterior inclusion probability: high for a predictor the data keep supporting, low for one they do not.

This is not a new idea invented for time series. George and McCulloch described the same spike-and-slab prior for ordinary regression variable selection back in 1993. Scott and Varian later applied it to a structural time series model itself, sifting through dozens of Google search-term trends to find the handful that actually helped forecast a real economic series.

The **bsts** package, short for Bayesian Structural Time Series, puts three pieces together: a structural specification built with functions like `AddLocalLevel()` and `AddSeasonal()`, an optional spike-and-slab regression term for exactly this predictor search, and an MCMC sampler that draws a complete set of every parameter, states, variances and coefficients together, on each of its `niter` iterations instead of fitting one best value.

Here is roughly what calling it looks like, shown but not run on this page, since bsts is not part of this page's R session.

```r-static
# Specify a structural model with candidate predictors and a spike-and-slab prior
library(bsts)

ss <- AddLocalLevel(list(), y = log_ap)
ss <- AddSeasonal(ss, y = log_ap, nseasons = 12)

model <- bsts(
  log_ap ~ .,                       # the series plus every candidate predictor
  state.specification = ss,
  data = candidate_predictors,       # a data frame of predictors you suspect might help
  niter = 5000,
  expected.model.size = 3            # spike-and-slab prior: expect about 3 of them to matter
)

summary(model)$coefficients          # each predictor's posterior inclusion probability
```

`AddLocalLevel()` and `AddSeasonal()` build the same kind of level-plus-seasonal structure `StructTS()` already fit by maximum likelihood, just specified piece by piece. `expected.model.size = 3` tells the spike-and-slab prior roughly how many of the candidate predictors you expect to matter, out of however many `candidate_predictors` holds; the MCMC sampler then works out which ones, not you.

The runnable stand-in on the rest of this page skips the predictors and the spike-and-slab search, and forecasts from the structural model alone. What it can still show you is the other half of what bsts does: turning one fitted model into a whole distribution of forecasts.

=== step === concept
## Simulating a posterior forecast band from the fitted model

Go back to the maximum-likelihood structural fit on the full series, the one that gave a single number for each variance, and forecast 24 months past December 1960.

```r
# Refit the structural model and forecast 24 months ahead, on the log scale
fit <- StructTS(log_ap, type = "BSM")
fc <- predict(fit, n.ahead = 24)

round(c(month1_pred = fc$pred[1], month1_se = fc$se[1],
        month24_pred = fc$pred[24], month24_se = fc$se[24]), 4)
```
```
#> month1_pred    month1_se month24_pred   month24_se 
#>      6.1414       0.0741       6.3116       0.1620
```

`predict()` on a `StructTS` fit gives back `pred`, the forecast's centre on the log scale, and `se`, its standard error, one pair per month ahead. One month out, the centre is 6.1414 with a standard error of 0.0741; 24 months out, the centre has risen to 6.3116 and the standard error has grown to 0.1620, wider the further out you forecast, exactly like any other forecast interval widens with the horizon.

Instead of trusting one formula-based interval built from `pred` and `se`, draw a whole cloud of possible futures directly and read the band off the cloud itself.

```r
# Draw 2000 simulated future paths from the forecast's own normal distribution
set.seed(42)
n_draws <- 2000
n_ahead <- 24
sim <- matrix(NA_real_, nrow = n_draws, ncol = n_ahead)
for (t in 1:n_ahead) {
  sim[, t] <- rnorm(n_draws, mean = fc$pred[t], sd = fc$se[t])
}
sim_exp <- exp(sim)   # back to the passenger-count scale

month1 <- round(quantile(sim_exp[, 1], c(0.025, 0.5, 0.975)), 1)
month24 <- round(quantile(sim_exp[, 24], c(0.025, 0.5, 0.975)), 1)
month1
month24
```
```
#>  2.5%   50% 97.5% 
#> 401.2 464.3 534.5 
#>  2.5%   50% 97.5% 
#> 408.9 550.0 744.8
```

Each of the 2000 rows is one complete possible future: at every one of the 24 months, `rnorm()` draws a value from the exact normal distribution `predict()` described, centred at `fc$pred[t]` with spread `fc$se[t]`. `exp()` turns each simulated log-value back into a passenger count. Taking the 2.5th, 50th and 97.5th percentile down each column turns those 2000 draws into a band: one month out, the middle 95% of simulated futures lands between about 401 and 534 thousand passengers, centred near 464. 24 months out, that band has widened to about 409 up to 745, centred near 550.

That is a simulated posterior forecast: many complete possible futures standing in for one, read off as a band instead of trusted from one formula.

=== step === concept
## How the simulated band compares with the formula, and what a real Bayesian fit adds

`predict()` already had its own formula-based 95% interval on offer, exp(pred plus or minus 1.96 times se), so check it against the band you just built by simulating.

```r
# Compare the formula-based interval against the simulated band, at month 1 and month 24
formula_lo <- exp(fc$pred - 1.96 * fc$se)
formula_hi <- exp(fc$pred + 1.96 * fc$se)

round(c(month1_lo = formula_lo[1], month1_hi = formula_hi[1],
        month24_lo = formula_lo[24], month24_hi = formula_hi[24]), 1)
```
```
#>  month1_lo  month1_hi month24_lo month24_hi 
#>      401.9      537.4      401.1      756.8
```

One month out, the formula's own interval runs from about 401.9 to 537.4. The simulated band landed at about 401 to 534, the same span to within a couple of tenths of a percent. 24 months out, the formula gives 401.1 to 756.8, against the simulation's 409 to 745, still close. They agree because the simulated draws came from the exact normal distribution the formula already describes; simulating it just lets you read percentiles off a cloud of draws instead of trusting one algebraic shortcut.

Plot that same point forecast, `exp(fc$pred)`, stretching the 144 months of real history 24 months further into 1961 and 1962.

::widget chart-plotter {"data":[{"x":1949.0000,"y":112},{"x":1949.0833,"y":118},{"x":1949.1667,"y":132},{"x":1949.2500,"y":129},{"x":1949.3333,"y":121},{"x":1949.4167,"y":135},{"x":1949.5000,"y":148},{"x":1949.5833,"y":148},{"x":1949.6667,"y":136},{"x":1949.7500,"y":119},{"x":1949.8333,"y":104},{"x":1949.9167,"y":118},{"x":1950.0000,"y":115},{"x":1950.0833,"y":126},{"x":1950.1667,"y":141},{"x":1950.2500,"y":135},{"x":1950.3333,"y":125},{"x":1950.4167,"y":149},{"x":1950.5000,"y":170},{"x":1950.5833,"y":170},{"x":1950.6667,"y":158},{"x":1950.7500,"y":133},{"x":1950.8333,"y":114},{"x":1950.9167,"y":140},{"x":1951.0000,"y":145},{"x":1951.0833,"y":150},{"x":1951.1667,"y":178},{"x":1951.2500,"y":163},{"x":1951.3333,"y":172},{"x":1951.4167,"y":178},{"x":1951.5000,"y":199},{"x":1951.5833,"y":199},{"x":1951.6667,"y":184},{"x":1951.7500,"y":162},{"x":1951.8333,"y":146},{"x":1951.9167,"y":166},{"x":1952.0000,"y":171},{"x":1952.0833,"y":180},{"x":1952.1667,"y":193},{"x":1952.2500,"y":181},{"x":1952.3333,"y":183},{"x":1952.4167,"y":218},{"x":1952.5000,"y":230},{"x":1952.5833,"y":242},{"x":1952.6667,"y":209},{"x":1952.7500,"y":191},{"x":1952.8333,"y":172},{"x":1952.9167,"y":194},{"x":1953.0000,"y":196},{"x":1953.0833,"y":196},{"x":1953.1667,"y":236},{"x":1953.2500,"y":235},{"x":1953.3333,"y":229},{"x":1953.4167,"y":243},{"x":1953.5000,"y":264},{"x":1953.5833,"y":272},{"x":1953.6667,"y":237},{"x":1953.7500,"y":211},{"x":1953.8333,"y":180},{"x":1953.9167,"y":201},{"x":1954.0000,"y":204},{"x":1954.0833,"y":188},{"x":1954.1667,"y":235},{"x":1954.2500,"y":227},{"x":1954.3333,"y":234},{"x":1954.4167,"y":264},{"x":1954.5000,"y":302},{"x":1954.5833,"y":293},{"x":1954.6667,"y":259},{"x":1954.7500,"y":229},{"x":1954.8333,"y":203},{"x":1954.9167,"y":229},{"x":1955.0000,"y":242},{"x":1955.0833,"y":233},{"x":1955.1667,"y":267},{"x":1955.2500,"y":269},{"x":1955.3333,"y":270},{"x":1955.4167,"y":315},{"x":1955.5000,"y":364},{"x":1955.5833,"y":347},{"x":1955.6667,"y":312},{"x":1955.7500,"y":274},{"x":1955.8333,"y":237},{"x":1955.9167,"y":278},{"x":1956.0000,"y":284},{"x":1956.0833,"y":277},{"x":1956.1667,"y":317},{"x":1956.2500,"y":313},{"x":1956.3333,"y":318},{"x":1956.4167,"y":374},{"x":1956.5000,"y":413},{"x":1956.5833,"y":405},{"x":1956.6667,"y":355},{"x":1956.7500,"y":306},{"x":1956.8333,"y":271},{"x":1956.9167,"y":306},{"x":1957.0000,"y":315},{"x":1957.0833,"y":301},{"x":1957.1667,"y":356},{"x":1957.2500,"y":348},{"x":1957.3333,"y":355},{"x":1957.4167,"y":422},{"x":1957.5000,"y":465},{"x":1957.5833,"y":467},{"x":1957.6667,"y":404},{"x":1957.7500,"y":347},{"x":1957.8333,"y":305},{"x":1957.9167,"y":336},{"x":1958.0000,"y":340},{"x":1958.0833,"y":318},{"x":1958.1667,"y":362},{"x":1958.2500,"y":348},{"x":1958.3333,"y":363},{"x":1958.4167,"y":435},{"x":1958.5000,"y":491},{"x":1958.5833,"y":505},{"x":1958.6667,"y":404},{"x":1958.7500,"y":359},{"x":1958.8333,"y":310},{"x":1958.9167,"y":337},{"x":1959.0000,"y":360},{"x":1959.0833,"y":342},{"x":1959.1667,"y":406},{"x":1959.2500,"y":396},{"x":1959.3333,"y":420},{"x":1959.4167,"y":472},{"x":1959.5000,"y":548},{"x":1959.5833,"y":559},{"x":1959.6667,"y":463},{"x":1959.7500,"y":407},{"x":1959.8333,"y":362},{"x":1959.9167,"y":405},{"x":1960.0000,"y":417},{"x":1960.0833,"y":391},{"x":1960.1667,"y":419},{"x":1960.2500,"y":461},{"x":1960.3333,"y":472},{"x":1960.4167,"y":535},{"x":1960.5000,"y":622},{"x":1960.5833,"y":606},{"x":1960.6667,"y":508},{"x":1960.7500,"y":461},{"x":1960.8333,"y":390},{"x":1960.9167,"y":432},{"x":1961.0000,"y":464.7},{"x":1961.0833,"y":436.3},{"x":1961.1667,"y":470.5},{"x":1961.2500,"y":510.8},{"x":1961.3333,"y":518.1},{"x":1961.4167,"y":584.7},{"x":1961.5000,"y":681.1},{"x":1961.5833,"y":668.0},{"x":1961.6667,"y":562.1},{"x":1961.7500,"y":512.1},{"x":1961.8333,"y":437.6},{"x":1961.9167,"y":487.9},{"x":1962.0000,"y":524.8},{"x":1962.0833,"y":492.7},{"x":1962.1667,"y":531.4},{"x":1962.2500,"y":576.8},{"x":1962.3333,"y":585.1},{"x":1962.4167,"y":660.3},{"x":1962.5000,"y":769.1},{"x":1962.5833,"y":754.4},{"x":1962.6667,"y":634.8},{"x":1962.7500,"y":578.3},{"x":1962.8333,"y":494.1},{"x":1962.9167,"y":550.9}],"geoms":["line","point"],"x":"year","y":"passengers (thousands)"}

Switch to points and every one of those 168 months still shows as a single dot, a reminder that this line is still just the single best guess at each month, the same kind of one-number answer `StructTS()` gives for each variance.

A genuinely Bayesian fit such as `bsts()` does one thing this simulation does not. At every one of its MCMC iterations, it draws the level, slope and seasonal variances themselves from their own posterior, instead of holding them fixed at the one values `StructTS()` estimated. This simulation only ever used those four fixed numbers; a real Bayesian fit lets them wobble too, on top of next month's ordinary shock.

That is the one gap left standing between this page's simulation and a genuine Bayesian fit: a `bsts()` band on the same series would come out a little wider than either the formula or this simulation, because it is honest about one more thing you do not actually know for certain, the variances themselves.

=== step === quiz
## Practice: what the Bayesian version buys you

The Metropolis chain matched the formula's own answer almost exactly, mean 0.1155 against 0.1157. Yet a genuine `bsts()` fit on this same series would still come back with a band wider than either the formula or the simulation you built by hand. Here is why.

::quiz {"correct": 2, "gate": true, "difficulty": "advanced"}
- MCMC is simply less accurate than a formula-based fit. ::no
- bsts also draws the fitted level, slope and seasonal variances themselves from their own posterior at every iteration, instead of holding them fixed at one estimate. ::ok Right. That is the one piece this page's simulation left out: it held the level, slope and seasonal variances fixed at StructTS's one estimate of each, while bsts lets them vary too, on top of next month's ordinary shock.
- bsts simply forecasts further ahead, and a longer horizon always means a wider band. ::no
- The spike-and-slab prior forces more predictors into the model, and that extra noise widens the band. ::no None of these explain it. The Metropolis chain already matched the formula almost exactly, so MCMC itself is not less accurate. The horizon here is the same 24 months either way. And spike-and-slab does the opposite of forcing predictors in: it excludes the weak ones and only keeps the ones the data support. The real reason is that bsts treats the fitted variances themselves as uncertain, drawing a fresh set from their posterior at every iteration, instead of fixing them at one estimate the way this page's simulation does.

=== step === tryit
## Your turn: how close is the simulation to the formula?

The simulated month-24 band ran about 409 to 745 thousand passengers. The formula-based interval for the same month ran about 401 to 757. Work out how many thousand passengers wider the formula's interval is than the simulated one, using the four bounds already on this page.

```r
# The 95% interval width at month 24: simulated versus the formula
sim_month24_lo <- 409
sim_month24_hi <- 745
formula_month24_lo <- 401
formula_month24_hi <- 757

sim_width <- sim_month24_hi - sim_month24_lo

# Your turn: compute formula_width, then print how many thousand
# passengers wider the formula interval is than the simulated one
```
::check {"regex": "\\b(1[5-9]|2[0-5])\\b", "gate": true, "difficulty": "intermediate", "ok": "Right: 20 thousand passengers. The formula's interval runs 356 wide against the simulation's 336, a gap small enough to confirm the two are describing nearly the same band.", "no": "Subtract the same way sim_width was built: formula_width <- formula_month24_hi - formula_month24_lo, then print formula_width - sim_width."}
::solution
```r
# Finish the width comparison and print how much wider the formula interval is
formula_width <- formula_month24_hi - formula_month24_lo
formula_width - sim_width
```
```
#> [1] 20
```

=== step === concept
## References

- Harvey, A. C. (1989), *Forecasting, Structural Time Series Models and the Kalman Filter*, Cambridge University Press. The structural model this lesson simulates a forecast from.
- [George, E. I., and McCulloch, R. E. (1993), "Variable Selection via Gibbs Sampling,"](https://doi.org/10.1080/01621459.1993.10476353) *Journal of the American Statistical Association*. The spike-and-slab prior behind bsts's predictor search.
- [Metropolis, N., Rosenbluth, A. W., Rosenbluth, M. N., Teller, A. H., and Teller, E. (1953), "Equation of State Calculations by Fast Computing Machines,"](https://doi.org/10.1063/1.1699114) *Journal of Chemical Physics*. The algorithm behind the Metropolis chain this lesson runs by hand.
- Scott, S. L., and Varian, H. R. (2014), "Predicting the Present with Bayesian Structural Time Series," *International Journal of Mathematical Modelling and Numerical Optimisation*. Spike-and-slab predictor selection applied to a structural model.
- [Scott, S. L., bsts: Bayesian Structural Time Series](https://cran.r-project.org/package=bsts), R package documentation, CRAN. What the bsts package puts together.

=== step === complete
## When the Bayesian version is worth the extra machinery

You have now watched one structural fit turn into a whole distribution of them, piece by piece.

- A maximum-likelihood fit gives one number per variance, with no sense of how sure that number is.
- A prior turns a single guess into a spread of plausible ones, and it narrows toward the data as more of it arrives; you watched it narrow from a spread of 0.08 down to 0.0188 across eleven years of real growth rates.
- MCMC is the general way to draw from a posterior when no clean formula gives you one; the Metropolis chain recovered the formula's own answer almost exactly, on a problem simple enough to check both ways.
- Spike-and-slab regression is the same machinery, aimed at a different question: not what value a coefficient takes, but whether it belongs in the model at all.
- A genuinely Bayesian fit's forecast band comes out a little wider than either a plain formula or this page's simulation, because it treats the fitted variances as uncertain too, not only next month's ordinary shock.

Put a prior and MCMC on a structural model, in short, when you have several candidate predictors to sift through with spike-and-slab, or when the honest width of your uncertainty, not a fixed-variance approximation of it, is what your forecast actually needs to report.

Next, this same structural model gets written in the more general dynamic linear model notation, general enough to let a regression coefficient itself drift over time.
