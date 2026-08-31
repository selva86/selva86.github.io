---
title: "Posterior predictive checks, in 5 minutes"
slug: "Bayesian-Mini-7"
description: "Simulate 500 datasets from a fitted Bayesian model in R, plot them against your real data, and score every mismatch with a posterior predictive p-value."
keywords: "posterior predictive check, posterior predictive p-value, Bayesian model checking, pp_check, density overlay, test statistic, Poisson model in R, model misfit"
mathjax: true
webr: true
date: "2026-08-31"
post_type: "LESSON"
course_id: "bayesian-decisions"
course_title: "Bayesian Decisions"
course_lesson: "7"
course_total: "9"
course_landing: "/dashboard.html"
course_prev: "Bayesian-Mini-6"
course_next: ""
curriculum_id: "0.0.52"
lesson_access: "windowed"
catalog_blurb: "How to tell whether a fitted Bayesian model really describes your data."
---

=== step === cover
::eyebrow Bayesian Decisions
## Posterior predictive checks, in 5 minutes

An online shop keeps a day-book of its orders: one row per day, and one number in that row, the count of orders placed that day. It holds 60 consecutive days, starting on a Monday. Those days come to 1035 orders in total, an average of 17.25 a day, and the busiest single day took 43.

Fit a Poisson model with one order rate to those 60 numbers and the posterior comes back at 17.26 orders a day, with a 95% interval of 16.23 to 18.33. That is a tight and sensible answer to the question of how fast orders arrive. It says nothing about whether one steady rate is a fair description of 60 days of trading.

There is a direct way to settle that. A fitted Bayesian model can generate data, not only summarise it, so generate some: draw a rate from the posterior, then simulate 60 daily counts at that rate. Repeat 500 times and you have 500 datasets the model could have produced, ready to compare against the real day-book.

::widget process-flow {"steps":[{"title":"Draw from the posterior","sub":"take one order rate out of the fitted posterior"},{"title":"Simulate a dataset from each draw","sub":"generate 60 daily counts at that rate, one fake dataset"},{"title":"Compare the real data with the fakes","sub":"plot the real day-book over the fakes, then score the gap"}]}

Those three moves are the whole of a posterior predictive check.

=== step === concept
## The 60 days of orders, and the model fitted to them

Here is the day-book in calendar order, seven numbers to a row so each row is one week, with the summaries worth having in front of you.

```r
# Load the 60 days of orders and summarise the day-book
orders <- c(
  17, 11, 10, 11, 13, 33, 31,
   5, 20, 13, 11,  8, 32, 30,
  11, 11, 15, 13, 13, 29, 22,
  10, 13, 12, 13, 19, 24, 33,
   6, 11, 15, 16, 16, 31, 29,
   9, 13, 15, 16, 16, 24, 33,
  13, 20, 10,  7,  9, 32, 43,
  13, 14, 16, 14, 10, 29, 26,
   6, 14,  9, 17)

c(days = length(orders), total = sum(orders), max = max(orders))
#>  days total   max
#>    60  1035    43

c(mean = round(mean(orders), 2), sd = round(sd(orders), 2))
#>  mean    sd
#> 17.25  8.73
```

The quietest day took 5 orders and the busiest took 43, so the shop is not trading at one steady level. Whether that swing is more than ordinary day to day randomness is what the checks below have to settle.

The usual model for daily counts is the Poisson. It says each day's count arrives independently at some average rate, and it carries one parameter to say so: the rate, which is both the average count per day and the thing that fixes the spread, since a Poisson variance equals its rate.

The Bayesian part needs a prior on that rate, meaning a distribution over the values the rate could take before the day-book is read. A Gamma prior is the standard choice for a Poisson rate. Gamma(1, 0.01) is deliberately vague, spread thinly over every positive rate from near zero into the hundreds, so the 60 days do essentially all of the work.

Choose that pair and the posterior needs no sampler at all. The posterior is the distribution over rates left once the prior and the 60 days are combined, and for a Gamma prior on a Poisson rate it is another Gamma: add every order to the shape, add every day to the rate, and there it is.

```r
# Update the Gamma prior with the day-book and read off the posterior
post_shape <- 1 + sum(orders)          # prior shape 1, plus every order in the book
post_rate  <- 0.01 + length(orders)    # prior rate 0.01, plus every day in the book

cat("posterior shape:", post_shape, " rate:", post_rate, "\n")
#> posterior shape: 1036  rate: 60.01

c(post_mean = round(post_shape / post_rate, 2),
  lower     = round(qgamma(0.025, post_shape, post_rate), 2),
  upper     = round(qgamma(0.975, post_shape, post_rate), 2))
#> post_mean     lower     upper
#>     17.26     16.23     18.33
```

Gamma(1036, 60.01) is the posterior, its mean is 17.26 orders a day, and 95% of it lies between 16.23 and 18.33. The interval is narrow because 1035 orders is a great deal of evidence about a single number.

Read what that interval is about, though. It says where the rate sits, on the assumption that one rate generated all 60 days. Nothing computed so far has put the model back beside the counts and asked whether that assumption survives.

=== step === concept
## Drawing one rate from the posterior and simulating one dataset

The posterior is not the number 17.26. It is a whole distribution over rates, and every rate it gives weight to is a rate the shop could plausibly be running at, so an honest simulation starts by picking one of them rather than the average.

Draw one rate with `rgamma()`, then hand that rate to `rpois()` and ask it for 60 days.

```r
# Draw a single rate from the posterior and simulate 60 days at it
set.seed(7)
one_rate <- rgamma(1, shape = post_shape, rate = post_rate)
one_fake <- rpois(60, one_rate)

round(one_rate, 3)
#> [1] 18.504

one_fake
#>  [1] 13 22 26 18 15 18 19 27 20 30 28 19 26 20 14 22 21 18 17 17 16 23 19 21 21
#> [26] 14 15 21 18 18 16 19 19 19 17 24 23 21 12 16 28 18 22 17 18 20 25 21 20 11
#> [51] 19 21 22 18 15 21 19 23 21 23
```

`set.seed(7)` fixes the random draws so your numbers match the ones printed here. The rate that came out, 18.504, sits a little above the posterior mean, which is what drawing from a distribution looks like.

Those 60 numbers are a fake dataset. They are not a forecast of the shop's next 60 days and they are not the real counts rearranged. They are 60 days the fitted model could have produced, which is the only property that makes them worth comparing against.

So compare them. Put the same three summaries side by side.

```r
# Line the one fake dataset up against the real day-book
rbind(
  real = c(mean = round(mean(orders), 2),   sd = round(sd(orders), 2),   max = max(orders)),
  fake = c(mean = round(mean(one_fake), 2), sd = round(sd(one_fake), 2), max = max(one_fake)))
#>       mean   sd max
#> real 17.25 8.73  43
#> fake 19.73 3.93  30
```

The means are close, 17.25 against 19.73. The standard deviations are not: the fake dataset's 3.93 is under half the real 8.73, and its busiest day stopped at 30 while the shop once took 43.

One fake dataset settles nothing on its own, because a single draw varies. To know whether a gap that size is ordinary, you need the whole range of datasets the model produces.

=== step === concept
## 500 fake datasets drawn over the real data

Run the draw and the simulation 500 times over and keep every result. Each pass draws its own rate, so the 500 datasets carry both kinds of variation the model admits: uncertainty about the rate, and day to day randomness at that rate.

```r
# Draw 500 rates and simulate a 60-day dataset from each one
set.seed(7)
lambda_draws <- rgamma(500, shape = post_shape, rate = post_rate)
fakes <- t(sapply(lambda_draws, function(rate) rpois(60, rate)))

dim(fakes)
#> [1] 500  60

fakes[1:3, 1:7]
#>      [,1] [,2] [,3] [,4] [,5] [,6] [,7]
#> [1,]   20   20   21   18   12   15   22
#> [2,]   10   12   19   11   15   27   16
#> [3,]   16   21   14   22   15   18   22
```

`fakes` is 500 rows by 60 columns. One row is one fake dataset and one column is a day, so the corner printed above is the first week of the first three fake datasets.

Now draw all 500 as density curves, the smoothed version of a histogram, and put the real day-book on top of them in red.

```r
# Overlay the density of all 500 fake datasets with the real day-book
plot(density(fakes[1, ]), col = "grey80",
     xlim = c(0, 50), ylim = c(0, 0.16),
     main = "500 fake datasets against the real day-book",
     xlab = "Orders in a day")

for (i in 2:500) lines(density(fakes[i, ]), col = "grey80")
lines(density(orders), col = "red", lwd = 3)

legend("topright", legend = c("fake datasets", "the real day-book"),
       col = c("grey80", "red"), lwd = c(2, 3), bty = "n")
```

Take the grey band first. Every one of those 500 curves is a single tall narrow hump, each peak sitting between 13 and 22 orders a day, and together they cover every 60-day day-book this model can produce. That coverage is narrow: the band carries almost no weight below 8 orders or above 30.

Now look at the red curve, the day-book that was actually recorded. It is lower and far wider than any grey curve, and instead of one hump it has two, one peaking at 12.6 orders and a second at 30.6.

One rate can only ever make one hump, because a single number decides where the counts pile up. The real shop piles them up in two places, so no single rate, high or low, could have matched this day-book.

A mismatch that plain is enough to reject a model on the spot. Most are not that plain, and a plot is harder to report than a number, so the same comparison is worth doing in arithmetic.

=== step === quiz
## Quick check: what a fake dataset is

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- The model's forecast of the shop's next 60 days of orders. ::no
- 60 daily counts the fitted model could have produced, made by drawing one rate from the posterior and simulating a day at that rate 60 times. ::ok Exactly. It is the fitted model running forwards to make data, which is what puts it on the same footing as the data the model was fitted to.
- The 60 real counts, resampled with replacement. ::no
- The model's single best guess at each of the 60 real days, one predicted number per day. ::no A fake dataset is not a forecast, not a best guess and not the real counts shuffled. None of the real numbers goes into one: a rate is drawn from the posterior and 60 fresh counts are simulated at that rate, which is why the result says what the model can produce rather than what the shop did.

=== step === concept
## The posterior predictive p-value, and what each statistic catches

Reading the overlay is a judgement by eye, and the eye only catches an obvious mismatch. To make it a number, pick one summary of a dataset, compute it on the real day-book and on every fake dataset, and see where the real value falls among the 500 fake ones.

That summary is called a test statistic. It can be anything computable from a dataset: the mean, the standard deviation, the largest value, the count of days under some threshold, the gap between the busiest day and the quietest.

Written out, the score is one probability statement.

\[ p = \Pr\left(T(y^{\mathrm{rep}}) \ge T(y) \mid y\right) \]

Read it piece by piece. \(T\) is the statistic you picked, \(y\) is the real day-book, and \(y^{\mathrm{rep}}\) is one fake dataset simulated from the fitted model. The bar means everything to its left is computed inside the posterior the real day-book produced, and the probability runs over fake datasets, never over the truth of the model.

In code that probability is just a share: count the fake datasets whose statistic matches or beats the real value, then divide by 500. That share is the posterior predictive p-value. Here are four statistics at once.

```r
# Score four statistics: the real value, the fake range, and the p-value
stat_fns <- list(mean          = mean,
                 sd            = sd,
                 max           = max,
                 days_under_12 = function(day) sum(day < 12))

ppc <- sapply(stat_fns, function(stat) {
  real <- stat(orders)
  fake <- apply(fakes, 1, stat)
  c(observed  = round(real, 2),
    fake_low  = round(min(fake), 2),
    fake_high = round(max(fake), 2),
    p_value   = round(mean(fake >= real), 3))
})

t(ppc)
#>               observed fake_low fake_high p_value
#> mean             17.25    15.05     19.52   0.542
#> sd                8.73     3.09      5.37   0.000
#> max              43.00    21.00     39.00   0.000
#> days_under_12    18.00     0.00     13.00   0.000
```

Row one is a pass. The real mean of 17.25 sits inside the fake range of 15.05 to 19.52, and 54.2% of the fake datasets had a mean at least that big, which puts the real value near the middle of the pile where a well-fitting model would leave it.

The other three rows are not near misses, they are misses. The real standard deviation of 8.73 is larger than all 500 fake standard deviations, the largest of which reached 5.37. The real busiest day of 43 beats every fake busiest day. And 18 of the real days came in under 12 orders, while the most any fake dataset managed was 13.

A p-value of exactly 0 is worth seeing for yourself, so plot the 500 fake standard deviations with the real one marked on the same axis.

```r
# Show where the real spread falls among the 500 fake spreads
fake_sd <- apply(fakes, 1, sd)

hist(fake_sd, breaks = 30, col = "grey85", border = "white",
     xlim = c(3, 9),
     main = "Spread of the 500 fake datasets",
     xlab = "Standard deviation of the 60 daily counts")

abline(v = sd(orders), col = "red", lwd = 3)
```

The whole grey pile sits between 3 and 5.5, and the red line stands alone out at 8.73 with empty space between it and the nearest fake dataset. There is no tail to argue over, which is what 0 out of 500 looks like.

Both ends of the scale are failures, incidentally. A p-value near 0 says almost no fake dataset reaches the real value, a p-value near 1 says almost every fake dataset beats it, and near 0.5 is the healthy reading. Anything from roughly 0.05 to 0.95 is unremarkable.

[KEY INSIGHT]
The statistic you pick decides what you can catch. The mean passed at 0.542, but it could hardly have done otherwise: the posterior was built by adding up all 1035 orders, so matching the average is the one thing the fit guarantees. A statistic the fitting never targeted, such as the spread or the extremes, is where a check does real work.

=== step === concept
## Reading a failed check to find what the model is missing

Look at which statistics failed, because that is the diagnosis. All three are about how far the counts spread out: how wide the standard deviation is, how high the busiest day reaches, how many days fall under 12 orders. The model has the level of trading right and the variation around it badly wrong.

So the day-book must hold a source of variation that one rate cannot copy. The counts were recorded in calendar order starting on a Monday, which means the day of the week costs nothing to work out.

```r
# Average the orders by day of the week
day_of_week <- factor(rep(c("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"),
                          length.out = 60),
                      levels = c("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"))

round(tapply(orders, day_of_week, mean), 1)
#>  Mon  Tue  Wed  Thu  Fri  Sat  Sun
#> 10.0 14.1 12.8 13.1 13.0 29.2 30.9
```

Monday through Friday sit between 10.0 and 14.1 orders a day. Saturday averages 29.2 and Sunday 30.9, more than double any weekday. This is a shop with two trading modes, not one.

A single rate has to land somewhere between the two, and 17.26 does exactly that: too high for every weekday and far too low for both weekend days. That split is also what the second peak at 30.6 in the red curve was showing, and it is why the fitted model could never stretch far enough to match the real spread.

=== step === concept
## Refitting with a weekend rate and rerunning every check

The repair follows the diagnosis. Give weekdays one rate and weekend days another, and fit each with the same Gamma arithmetic on its own slice of the day-book.

```r
# Fit a separate Poisson rate to weekdays and to weekend days
weekend <- day_of_week %in% c("Sat", "Sun")

wd_shape <- 1 + sum(orders[!weekend]); wd_rate <- 0.01 + sum(!weekend)
we_shape <- 1 + sum(orders[weekend]);  we_rate <- 0.01 + sum(weekend)

cat("weekdays:", sum(!weekend), " weekend days:", sum(weekend), "\n")
#> weekdays: 44  weekend days: 16

c(weekday_rate = round(wd_shape / wd_rate, 2),
  weekend_rate = round(we_shape / we_rate, 2))
#> weekday_rate weekend_rate
#>        12.61        30.11
```

The 44 weekdays carried 554 orders between them, giving a Gamma(555, 44.01) posterior with a mean of 12.61. The 16 weekend days carried 481, giving Gamma(482, 16.01) and a mean of 30.11. That is two numbers instead of one, each fitted only to the days it belongs to.

Simulating from a two-rate model changes the inside of the loop, not its shape. Each fake dataset now needs 44 weekday counts drawn at its weekday rate and 16 weekend counts drawn at its weekend rate, and the four statistics are then scored exactly as before.

```r
# Simulate 500 fake datasets from the two-rate model and rescore every statistic
set.seed(7)
wd_draws <- rgamma(500, shape = wd_shape, rate = wd_rate)
we_draws <- rgamma(500, shape = we_shape, rate = we_rate)

fakes2 <- t(sapply(1:500, function(i) {
  day <- numeric(60)
  day[!weekend] <- rpois(sum(!weekend), wd_draws[i])
  day[weekend]  <- rpois(sum(weekend),  we_draws[i])
  day
}))

round(sapply(stat_fns, function(stat) mean(apply(fakes2, 1, stat) >= stat(orders))), 3)
#>          mean            sd           max days_under_12
#>         0.532         0.498         0.254         0.464
```

All four are back in the middle. The standard deviation moved from 0 to 0.498, the busiest day from 0 to 0.254, and the count of days under 12 orders from 0 to 0.464. None of them needed a new statistic or a softer threshold: the same four questions simply come out differently once the model can produce weekends.

The overlay tells the same story faster.

```r
# Overlay the two-rate model against the same real day-book
plot(density(fakes2[1, ]), col = "grey80",
     xlim = c(0, 50), ylim = c(0, 0.10),
     main = "500 fake datasets from the two-rate model",
     xlab = "Orders in a day")

for (i in 2:500) lines(density(fakes2[i, ]), col = "grey80")
lines(density(orders), col = "red", lwd = 3)
```

Most of the grey curves now carry two humps of their own, a tall one near 12 and a low one near 30, and the red curve stays inside the grey band along its whole length instead of escaping it at both ends.

[NOTE]
Four statistics in range means the model can produce data resembling yours on those four summaries. It does not mean the model is true, or that the weekend split is the only structure in the shop's trading. Bank holidays, promotions and a growth trend would all be invisible to these four checks, and each one would need a statistic of its own before it showed up.

=== step === concept
## How to run the same check on a brms model in one line

Every move so far was done by hand on purpose, because a check you assembled yourself is a check you can reason about. Day to day you would fit with brms, where the draw, simulate and compare loop arrives as a single function called `pp_check()`.

The block below fits the same weekday and weekend split through brms. It compiles the model through Stan, which takes a minute or two, so run it in your own R session rather than here.

```r-static
# Fit the two-rate model with brms and run the same checks on it
library(brms)

shop <- data.frame(orders   = orders,
                   day_type = ifelse(weekend, "weekend", "weekday"))

fit <- brm(orders ~ 0 + day_type, data = shop, family = poisson(),
           chains = 4, iter = 2000, seed = 7, refresh = 0)

pp_check(fit, type = "dens_overlay", ndraws = 500)
pp_check(fit, type = "stat", stat = "sd")
pp_check(fit, type = "stat", stat = "max")
```

The default type, `dens_overlay`, is the plot you built by hand: `ndraws = 500` simulated datasets in light blue with the observed data drawn over them in dark blue. The `stat` type is the histogram version, one summary computed on every simulated dataset with the observed value marked as a vertical line, and `stat` accepts the name of any function that turns a vector into a single number.

Two differences are worth knowing before you compare numbers. A brms Poisson fit uses a log link, so the two rates arrive as coefficients you exponentiate rather than as 12.61 and 30.11 directly, and brms applies its own default priors in place of the Gamma(1, 0.01) used above. The rates land close to the ones you computed, not on top of them.

=== step === quiz
## Quick check: reading a posterior predictive p-value

The standard deviation of the real day-book, 8.73, scored a posterior predictive p-value of 0 against the one-rate model. What does that tell you?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- There is a 0% probability that the one-rate model is the true model of the shop. ::no
- Almost none of the 500 fake datasets was as spread out as the real day-book, so the fitted model cannot produce data with the variation actually recorded. ::ok Right, and notice where the probability sits: on the fake datasets, inside the fitted model, never on whether the model is true.
- The one-rate model is worthless, so its posterior mean of 17.26 orders a day should be thrown out along with it. ::no
- The mean passed at 0.542, so that result and this one cancel out and the model is roughly fine overall. ::no A posterior predictive p-value is a statement about simulated data, not about the truth of a model, so 0 is not a 0% chance of anything being true. It also does not condemn the whole fit, since 17.26 orders a day is still a fair estimate of the average rate. One failed statistic is enough to say the model is missing something, and no number of passed ones proves it is right.

=== step === tryit
## Your turn: check the number of busy days

Pick a statistic of your own and score the one-rate model on it. Call a day busy when it takes 25 orders or more, count the busy days in the real day-book, count them in every fake dataset, and report the share of fake datasets that match or beat the real count.

```r
# orders holds the 60 real daily counts.
# fakes holds 500 fake datasets from the one-rate model, one per row.
# Count the days with 25 or more orders in the real book, do the same for
# every row of fakes, then report the share of fakes that match or beat it.
# Press Check when you have it.
```
::check {"regex": "fakes[\\s\\S]*>=\\s*25", "gate": true, "difficulty": "intermediate", "ok": "That is it: 13 busy days in the real day-book against 2.98 on average across the fakes, with the best fake reaching 10. Not one of the 500 got to 13, so p is 0 and this is a fourth statistic the one-rate model fails.", "no": "Two counts, then a share. Use `sum(orders >= 25)` for the real book and `apply(fakes, 1, function(day) sum(day >= 25))` for the same count in every fake dataset, then take `mean()` of the fake counts that reach the real one."}
::solution
```r
# Score the one-rate model on the number of busy days
busy_obs  <- sum(orders >= 25)
busy_fake <- apply(fakes, 1, function(day) sum(day >= 25))

cat("real day-book:", busy_obs, "busy days\n")
cat("fake datasets:", round(mean(busy_fake), 2), "on average, from",
    min(busy_fake), "to", max(busy_fake), "\n")
cat("p-value:", mean(busy_fake >= busy_obs), "\n")
#> real day-book: 13 busy days
#> fake datasets: 2.98 on average, from 0 to 10
#> p-value: 0
```

The 13 busy days are the 13 Saturdays and Sundays that cleared 25 orders, so this is the weekend split showing up again under a different summary. That is the habit worth keeping: a statistic you choose because it matters to the business, scored the same way as the standard ones.

=== step === concept
## References

- [Visualization in Bayesian workflow](https://doi.org/10.1111/rssa.12378) - Gabry, Simpson, Vehtari, Betancourt and Gelman (2019), Journal of the Royal Statistical Society Series A 182(2), 389-402. The paper behind the bayesplot predictive check plots, the density overlay included.
- [Bayesian Workflow](https://arxiv.org/abs/2011.01808) - Gelman, Vehtari, Simpson and colleagues (2020), arXiv:2011.01808. Where checking sits in the fit, check and revise loop you just ran.
- [Posterior predictive assessment of model fitness via realized discrepancies](https://www3.stat.sinica.edu.tw/statistica/j6n4/j6n41/j6n41.htm) - Gelman, Meng and Stern (1996), Statistica Sinica 6(4), 733-807. The source of the posterior predictive p-value.
- [Bayesian Data Analysis, third edition](http://www.stat.columbia.edu/~gelman/book/) - Gelman, Carlin, Stern, Dunson, Vehtari and Rubin. Chapter 6, Model checking, is the long form of everything above.
- [PPC overview](https://mc-stan.org/bayesplot/reference/PPC-overview.html) - the bayesplot reference page listing every `pp_check()` type and what each one shows.

=== step === complete
## Quick recap

You took a fitted Bayesian model, simulated data from it, and compared that data with the day-book the model was fitted to.

- A posterior predictive check is three moves: draw a rate from the posterior, simulate a dataset at that rate, compare the fakes with the real data. You ran 500 of them.
- The overlay plot is the check with no arithmetic in it. 500 single-humped grey curves against one red curve peaking at 12.6 and 30.6 is a mismatch you can read at a glance.
- A posterior predictive p-value turns one summary into one number: the share of fake datasets whose statistic matches or beats the real value. The mean passed at 0.542. The standard deviation, the busiest day and the count of days under 12 orders all came back 0.
- What passes tells you little when the fit was built to match it. The mean was guaranteed; the spread and the extremes were not, which is why they were the ones that caught the problem.
- A failure names its own repair. All three failures were about spread, the day-of-week averages ran 10.0 to 14.1 on weekdays against 29.2 and 30.9 at the weekend, and a model with a weekday rate of 12.61 and a weekend rate of 30.11 put all four statistics back in range.

So the next time a model of yours converges without a single warning, simulate 500 datasets from it before you report anything. Then score it on a statistic the fitting was never asked to match, because that is the one that can still tell you something you did not already know.
