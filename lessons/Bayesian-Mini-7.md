---
title: "Posterior predictive checks, in 5 minutes"
slug: "Bayesian-Mini-7"
description: "Simulate datasets from a fitted Bayesian model, lay them over your real data, and read the posterior predictive p-value that says what the model missed."
keywords: "posterior predictive check, posterior predictive p-value, Bayesian model checking, model misfit, test statistic, Poisson model in R, Gamma Poisson conjugate, Bayesian workflow"
mathjax: true
webr: true
date: "2026-09-01"
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

A neighbourhood bakery wrote down how many orders it took on each of 60 consecutive days. The quietest day brought 6 orders, the busiest brought 33, and the 60 days averaged 14.48.

Counts like that get modelled with a Poisson: one underlying daily order rate, and each day's count generated from it. Fit that model the Bayesian way and what comes back is a posterior over the rate, a whole distribution of rates the data supports rather than a single fitted number. For these 60 days it is a tight one, with 95% of it between 13.53 and 15.48 orders a day.

That output looks perfectly healthy. It gives no sign at all of whether the model is a good description of the bakery.

There is a direct way to find out, and it uses the fact that a fitted model is a recipe for generating data. Draw a rate from the posterior, simulate 60 days of orders at that rate, and you have one fake dataset the model could have produced. Do that 4000 times, then compare the real 60 days with the 4000 fake datasets. If the real data looks like an ordinary member of that crowd, the model reproduces it. If the real data sits outside the crowd, it does not, and how it sits outside points at what the model left out.

That comparison is called a posterior predictive check. There are three steps to it.

::widget process-flow {"steps":[{"title":"Draw a rate from the posterior","sub":"one plausible value of the daily order rate"},{"title":"Simulate 60 days at that rate","sub":"one fake dataset the fitted model could produce"},{"title":"Compare the fake datasets with the real one","sub":"4000 simulated datasets against the 60 real days"}]}

Everything from here is those three steps, run in R on the bakery's own numbers.

=== step === concept
## The 60 days of orders, and the model fitted to them

Here is the whole dataset. Each entry is one day's order count, in the order they happened, starting on a Monday, with the day of the week recorded alongside.

```r
# The bakery's 60 daily order counts, with the day of the week for each one
orders <- c(13,  8,  9,  7, 10, 22, 20,
            14, 10,  6, 12,  6, 18, 27,
            14,  9, 13, 15, 16, 20, 28,
             9, 16, 12, 12, 10, 25, 33,
            11, 13, 14, 14, 13, 22, 19,
             9, 13,  7, 14,  8, 23, 22,
            17, 14, 11, 13,  9, 22, 21,
            13,  8, 13, 12, 13, 23, 28,
             7,  9, 12,  8)

day <- rep(c("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"), length.out = 60)

round(c(days = length(orders), mean = mean(orders),
        sd = sd(orders), max = max(orders)), 2)
#>  days  mean    sd   max
#> 60.00 14.48  6.23 33.00

hist(orders, breaks = 12, col = "grey85", border = "white",
     main = "60 days of bakery orders",
     xlab = "Orders in a day")
```

Two numbers are worth holding on to. The average is 14.48 orders a day and the standard deviation is 6.23. The histogram shows where that spread comes from: 43 of the 60 days fall between 6 and 16 orders, and the remaining 17 stretch out to the right as far as 33.

Now let's look at the model. Counts of things that happen in a fixed window get modelled with a Poisson distribution, which has a single parameter, the rate at which the events arrive. Write \(\lambda\) for the bakery's daily order rate and the model is one line.

\[ \text{orders on a day} \;\sim\; \text{Poisson}(\lambda) \]

Read that as a recipe for generating one day: pick \(\lambda\), and the day's count comes out of a Poisson with that rate. The 60 days are generated independently of each other, and every one of them uses the same \(\lambda\). Monday, Saturday and the day before a public holiday all run on the same rate.

One property of the Poisson matters more than the rest here. Its variance equals its mean, so choosing the rate also fixes the spread, with nothing left to tune. The bakery's own standard deviation is 6.23.

=== step === concept
## The posterior over the daily order rate

Fitting this model the Bayesian way means starting from a prior over \(\lambda\), a statement of which rates were plausible before anyone opened the order book, and updating it with the 60 counts. What the update returns is the posterior: a distribution over \(\lambda\), not a single fitted value.

The picture below runs that update on a different quantity, the mean of a normal measurement rather than a Poisson order rate, but the shape of the update is the same one. Drag the sliders and watch the posterior curve settle between the prior and the data.

::widget bayes-update {}

It opens with a prior centred on 0 and 10 data points averaging 3, and the posterior lands at 2.14, about 71% of the way from the prior across to the data. Push the data points slider up to 200 and the posterior mean moves to 2.94 with a standard deviation of 0.14. More data pulls the posterior onto the data and tightens it, and the prior stops mattering.

For a Poisson rate the convenient prior is a Gamma, because a Gamma prior with Poisson counts gives a Gamma posterior and an update rule you can do by hand. A prior that pairs with a model this way is called conjugate. Add the total observed count to the prior's shape, and the number of days to the prior's rate.

\[ \lambda \mid y \;\sim\; \text{Gamma}\left(\alpha + \sum_{i=1}^{n} y_i, \;\; \beta + n\right) \]

A Gamma(2, 0.1) prior has a mean of 20 orders a day and a 95% interval running from 2.4 to 55.7, which is vague enough to let 60 days of data do the talking.

```r
# Update a vague Gamma(2, 0.1) prior with the 60 days to get the posterior over lambda
prior_shape <- 2
prior_rate  <- 0.1

post_shape <- prior_shape + sum(orders)      # 2 + 869
post_rate  <- prior_rate + length(orders)    # 0.1 + 60

set.seed(1)
lambda_draws <- rgamma(4000, post_shape, post_rate)

round(c(shape = post_shape, rate = post_rate,
        mean  = mean(lambda_draws),
        lower = unname(quantile(lambda_draws, 0.025)),
        upper = unname(quantile(lambda_draws, 0.975))), 2)
#>  shape   rate   mean  lower  upper
#> 871.00  60.10  14.49  13.53  15.48
```

`lambda_draws` now holds 4000 values of \(\lambda\) drawn from that posterior. They average 14.49 orders a day and 95% of them fall between 13.53 and 15.48. The prior's mean of 20 has been left well behind.

=== step === concept
## Simulating 4000 fake datasets and laying them over the real one

A single value of \(\lambda\) is a complete recipe for 60 days. Take the first posterior draw, 14.18 orders a day, pass it to `rpois(60, 14.18)`, and out come 60 counts the fitted model could have generated. Do that once per posterior draw and you have 4000 of them.

```r
# Simulate one 60-day dataset per posterior draw: 4000 fake datasets in all
set.seed(2)
rep_pooled <- sapply(lambda_draws, function(l) rpois(60, l))

dim(rep_pooled)
#> [1]   60 4000

rbind(real = orders[1:12], fake = rep_pooled[1:12, 1])
#>      [,1] [,2] [,3] [,4] [,5] [,6] [,7] [,8] [,9] [,10] [,11] [,12]
#> real   13    8    9    7   10   22   20   14   10     6    12     6
#> fake   10   10    9   14   11   13   21   13   15    17    12    12
```

Each column of `rep_pooled` is a whole 60-day dataset, simulated at its own rate from the posterior. The standard name for one of these is a replicated dataset. The plainer name, and the one used from here on, is a fake dataset.

Look at the first 12 days of each. The real row runs through a stretch of quiet days in single figures and then jumps to 22 and 20 on days 6 and 7. The fake row never leaves the range 9 to 21. It has the right average and none of the spread.

One pair of rows is an anecdote, so plot them all.

```r
# Lay the first 100 fake datasets over the real one
plot(density(rep_pooled[, 1]), col = "grey80", lwd = 1,
     xlim = c(0, 40), ylim = c(0, 0.18),
     main = "100 fake datasets in grey, the real 60 days in red",
     xlab = "Orders in a day")

for (j in 2:100) lines(density(rep_pooled[, j]), col = "grey80", lwd = 1)

lines(density(orders), col = "red", lwd = 3)
```

Every grey curve is the distribution of one fake dataset's 60 counts. They land on top of one another as a single tall hump near 14, because they were all generated the same way and only the rate differs between them.

The red curve is the real data and it is a different shape altogether. It is lower and much wider, with its main hump near 12 and a second rise near 21 that the grey band does not have. The busy end says the same thing in a number: 8.3% of the real days had 25 orders or more, against 0.9% of the days in those 100 fake datasets.

So the picture says the model is wrong. It would be more useful as a number.

=== step === quiz
## Quick check: what is one of those fake datasets?

Each column of `rep_pooled` is one fake dataset. What exactly is in a column?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- The 60 observed days resampled with replacement, so the column is a bootstrap sample of the bakery's own counts. ::no
- 60 counts simulated from a Poisson at one rate drawn from the posterior, which is a complete 60-day dataset the fitted model could have produced. ::ok That is it. One draw from the posterior fixes the rate, and 60 draws from a Poisson at that rate fill the column. The observed counts are nowhere in it.
- The model's single best guess at the next 60 days, one predicted count per day. ::no
- 60 values of the rate itself, showing how uncertain the posterior over lambda still is. ::no Each of those confuses a fake dataset with something else. It is not built out of the observed counts, so it is not a resample of them. It is not one prediction per day either, because there are 4000 whole datasets here and each one is a thing the model could produce, not a best guess. And a column holds simulated order counts, not values of lambda: the rate is drawn first and then passed to `rpois()` to make the counts.

=== step === concept
## From the picture to one number: the posterior predictive p-value

Turning the overlay into a number takes one decision, which feature of the data you want the model to reproduce. That feature is written as a test statistic, a single number computed from a dataset. Anything you can compute qualifies: the mean, the largest value, the number of zeros, the gap between the busiest and quietest day.

The failure in the overlay was about spread, so the standard deviation is the statistic to use here. Compute it on the real data, compute it on each of the 4000 fake datasets, and count how many fake datasets reach the real value.

Write \(T\) for the statistic, \(y\) for the real data, \(y^{\text{rep}}_s\) for the \(s\)th fake dataset and \(S\) for how many fake datasets there are. The count, expressed as a share, is

\[ p \;=\; \frac{1}{S}\sum_{s=1}^{S} \mathbf{1}\left[\, T(y^{\text{rep}}_s) \ge T(y) \,\right] \]

where \(\mathbf{1}\) is 1 when the condition inside it holds and 0 when it does not. That share is the posterior predictive p-value.

```r
# The spread of the real data against the spread of every fake dataset
sd_obs    <- sd(orders)
sd_pooled <- apply(rep_pooled, 2, sd)

hist(sd_pooled, breaks = 40, xlim = c(2.5, 6.5), col = "grey85", border = "white",
     main = "Spread of 4000 fake datasets, one rate for every day",
     xlab = "Standard deviation of a fake dataset")
abline(v = sd_obs, col = "red", lwd = 3)

round(c(observed = sd_obs, fake_mean = mean(sd_pooled), fake_max = max(sd_pooled)), 2)
#>  observed fake_mean  fake_max
#>      6.23      3.79      5.50

mean(sd_pooled >= sd_obs)
#> [1] 0
```

The grey pile is the spread the fitted model produces, and it averages 3.79. That number was settled the moment the model was written down. A Poisson's variance equals its mean, so at a rate near 14.49 the spread has to come out near \(\sqrt{14.49} = 3.81\), and there is no setting of \(\lambda\) that raises the spread without also raising the average.

The red line is the real 6.23, sitting clear of the whole pile. The most spread out of the 4000 fake datasets reached 5.50 and stopped, so the count of fake datasets reaching 6.23 is zero and the p-value is 0.

[KEY INSIGHT]
A posterior predictive p-value is the share of fake datasets whose test statistic matches or beats the real one. Here: out of 4000 datasets the fitted model generated, not a single one was as spread out as the bakery's own 60 days.

Zero out of 4000 does not mean impossible. It means the model puts a probability of less than about 1 in 4000 on a spread this large, which is enough to say it cannot make data that looks like this.

=== step === concept
## What the failed check points at in the data

A failed spread check says something specific: the real data varies more than one rate is able to make it vary. The usual reason is that the days are not all the same kind of day, and the bakery's book already carries the label that would say so.

```r
# Split the 60 days into weekdays and weekend days
day_type <- ifelse(day %in% c("Sat", "Sun"), "weekend", "weekday")

round(tapply(orders, day_type, mean), 2)
#> weekday weekend
#>   11.27   23.31

table(day_type)
#> day_type
#> weekday weekend
#>      44      16

boxplot(orders ~ day_type, col = "grey85",
        main = "Daily orders by day type",
        xlab = "", ylab = "Orders in a day")
```

There are two rates here, not one. The 44 weekdays average 11.27 orders and the 16 weekend days average 23.31, and the boxplot shows the two groups not overlapping at all: weekdays run from 6 to 17 orders, weekend days from 18 to 33.

A single \(\lambda\) has to sit somewhere between them, and the fit put it at 14.49. Every weekday is then generated too high and every weekend day too low, which is how a model ends up with the right average and a spread it can never reach. The 6.23 it could not produce is mostly the distance between 11.27 and 23.31.

=== step === concept
## Refit with one rate per day type, and run the same check

The repair is the same conjugate update done twice, once on the 44 weekdays and once on the 16 weekend days. Each group gets the same Gamma(2, 0.1) prior, its own total, and its own number of days.

```r
# Refit: one Gamma posterior for weekdays and one for weekend days
weekend <- day %in% c("Sat", "Sun")

wd_shape <- prior_shape + sum(orders[!weekend])
wd_rate  <- prior_rate + sum(!weekend)
we_shape <- prior_shape + sum(orders[weekend])
we_rate  <- prior_rate + sum(weekend)

set.seed(3)
lam_wd <- rgamma(4000, wd_shape, wd_rate)
lam_we <- rgamma(4000, we_shape, we_rate)

round(rbind(
  weekday = c(shape = wd_shape, rate = wd_rate,
              lower = unname(quantile(lam_wd, 0.025)),
              upper = unname(quantile(lam_wd, 0.975))),
  weekend = c(shape = we_shape, rate = we_rate,
              lower = unname(quantile(lam_we, 0.025)),
              upper = unname(quantile(lam_we, 0.975)))), 2)
#>         shape rate lower upper
#> weekday   498 44.1 10.34 12.33
#> weekend   375 16.1 20.98 25.69
```

There are two posteriors now. The weekday rate lies between 10.34 and 12.33 orders a day, the weekend rate between 20.98 and 25.69, and the two intervals are nowhere near each other.

Simulating a fake dataset changes in one respect only. Each of the 60 days now draws from the rate that matches its own day type, so the weekend positions in the column come from `lam_we` and the rest from `lam_wd`.

```r
# Simulate 4000 fake datasets from the two-rate model and check the spread again
set.seed(4)
rep_fixed <- sapply(seq_len(4000),
                    function(i) rpois(60, ifelse(weekend, lam_we[i], lam_wd[i])))

sd_fixed <- apply(rep_fixed, 2, sd)

hist(sd_fixed, breaks = 40, col = "grey85", border = "white",
     main = "Spread of 4000 fake datasets, one rate per day type",
     xlab = "Standard deviation of a fake dataset")
abline(v = sd_obs, col = "red", lwd = 3)

round(c(observed = sd_obs, fake_mean = mean(sd_fixed)), 2)
#>  observed fake_mean
#>      6.23      6.57

mean(sd_fixed >= sd_obs)
#> [1] 0.6705
```

The red line now sits in the middle of the pile. The real spread is still 6.23; what moved is the model generating the grey. The fake datasets average 6.57 and 67% of them are at least as spread out as the real 60 days.

Nothing about the check itself changed. It is the same statistic, the same 4000 simulations and the same count. That is what makes the earlier 0 worth having: it was a failure that a specific repair could clear, and rerunning the identical check is how you confirm the repair worked.

=== step === widget
## How a passing check differs from a failing one

That is one failing check and one passing check on the bakery's data, at 0 and 0.67. Below is the same pair on a different dataset, with a toggle between them.

That dataset is 60 counts with a lot of zeros in it, and the statistic is the number of zeros rather than the standard deviation. The real data has 15 zeros. The toggle switches the fitted model between a Normal, which is the wrong family for counts because it puts mass on negative and fractional values, and a Poisson, which is the right one.

::widget ppc-overlay {}

Under the Normal fit almost none of the fake datasets reach 15 zeros, so the observed value sits far out in the thin right tail and the p-value is 0.02. Switch to the Poisson and the fake datasets centre on about 12 zeros with the observed 15 sitting comfortably among them, for a p-value of 0.22.

Reading the number is the same job in both cases, and it works the same way on the bakery's 0 and 0.67.

- Near 0 means the real statistic is larger than the model can produce. The bakery's spread under one rate was this case.
- Near 1 means the model routinely produces more than the real data has, which is a misfit in the other direction.
- In the middle means the fake datasets and the real one agree on that statistic, which is a pass.

There is no 0.05 line anywhere in that list, and there should not be. A posterior predictive p-value is not a hypothesis test and 0.02 is not a rejection at some level; it is a report on how far into the tail the real data landed.

[WARNING]
A pass covers the statistic you checked and nothing else. The Poisson fit reproduces the zeros at 0.22, and that says nothing about whether it reproduces the largest value, the gap between the two busiest days, or anything else nobody computed. The two-rate bakery model is in the same position with its 0.67.

=== step === quiz
## Quick check: what a passing check does and does not settle

The two-rate model returned a posterior predictive p-value of 0.67 on the standard deviation. Which sentence reports that correctly?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- There is a 67% probability that the two-rate model is the correct model for the bakery. ::no
- There is a 33% probability that the two-rate model is wrong, because 1 minus 0.67 is 0.33. ::no
- 67% of the datasets the fitted model generated were at least as spread out as the real 60 days, so the model reproduces the spread of this data. ::ok Exactly right. The number counts fake datasets, and the only feature it counted was the standard deviation. A different statistic is a different check, and it can still fail.
- The check passed, so the two-rate model has no remaining misfit worth looking for. ::no A posterior predictive p-value counts fake datasets. It is never a probability about the model itself, so 0.67 is not the chance the model is right and 0.33 is not the chance it is wrong. It is not a clean bill of health either: it says the model reproduces the one statistic that was checked, and says nothing at all about the statistics nobody computed.

=== step === tryit
## Your turn: check the busiest day under both models

The standard deviation was one statistic. The busiest day is another, and for a bakery it is the one the morning bake gets sized on. The real busiest day is `max(orders)`, which is 33 orders.

`rep_pooled` still holds the 4000 fake datasets from the one-rate model, and `rep_fixed` holds the 4000 from the two-rate model. Compute the largest day in every fake dataset, then the share of fake datasets whose largest day reaches 33, under each model.

```r
# rep_pooled: 4000 fake datasets from the one-rate model.
# rep_fixed:  4000 fake datasets from the two-rate model.
# The real busiest day is max(orders), which is 33 orders.
# Get the largest day in each fake dataset, then the share of them
# that reach 33. Two lines per model. Press Check when you have them.
```
::check {"regex": "apply[(]\\s*rep_fixed\\s*,\\s*2\\s*,\\s*max", "gate": true, "difficulty": "intermediate", "ok": "Right: 0.00075 under one rate and 0.432 under two. Only 3 of the 4000 one-rate datasets ever reached 33 orders, so under that model the busiest day the bakery actually had was close to impossible.", "no": "Same move as the spread check with `max` in place of `sd`. `apply(rep_pooled, 2, max)` gives the largest day in each fake dataset, and `mean(max_pooled >= max(orders))` turns that into a share. Then the same two lines with `rep_fixed`."}
::solution
```r
# The largest day in every fake dataset, under each of the two models
max_pooled <- apply(rep_pooled, 2, max)
max_fixed  <- apply(rep_fixed, 2, max)

c(one_rate = mean(max_pooled >= max(orders)),
  two_rate = mean(max_fixed  >= max(orders)))
#> one_rate two_rate
#>  0.00075  0.43200
```

The one-rate model fails on the busiest day as badly as it failed on the spread, and for the same reason: a rate of 14.49 almost never produces a 33. The two-rate model puts 0.43 on it, which is an ordinary value.

Both statistics agree here, but they did not have to. A model can reproduce the spread of a dataset and still get the extremes wrong, which is why the statistic worth checking is the one your decision depends on.

=== step === concept
## References

- [Posterior Predictive Assessment of Model Fitness via Realized Discrepancies](https://www3.stat.sinica.edu.tw/statistica/oldpdf/A6n41.pdf) - Gelman, Meng and Stern (1996), Statistica Sinica 6(4), 733-807. The paper that defines the posterior predictive p-value computed here.
- [Visualization in Bayesian Workflow](https://arxiv.org/abs/1709.01449) - Gabry, Simpson, Vehtari, Betancourt and Gelman (2019), Journal of the Royal Statistical Society Series A 182(2), 389-402. Where the density overlay and the test statistic histogram come from.
- [Bayesian Workflow](https://arxiv.org/abs/2011.01808) - Gelman and colleagues (2020). Where model checking sits in the loop of fitting, checking and revising a model.
- [Graphical posterior predictive checks](https://mc-stan.org/bayesplot/reference/PPC-overview.html) - the bayesplot reference for the standard check types, density overlay and test statistic among them.
- [pp_check() for brmsfit objects](https://paul-buerkner.github.io/brms/reference/pp_check.brmsfit.html) - brms documentation for the one-line version of the loop built here.

=== step === complete
## Quick recap

You fitted a Poisson model to 60 days of bakery orders, checked it against the data it was meant to describe, found that it did not fit, repaired it, and checked it again.

- A fitted Bayesian model generates data. Draw a rate from the posterior, simulate 60 days from that rate, repeat: 4000 fake datasets the model could have produced.
- Laying the fake datasets over the real one is the check. The grey curves were a single narrow hump near 14; the real data was wider, with a second rise near 21 the grey band never had.
- A test statistic turns the picture into a number. The share of fake datasets that match or beat the real value is the posterior predictive p-value. For the standard deviation under one rate it was 0, with the widest of 4000 fake datasets reaching 5.50 against the real 6.23.
- A failure points at what the model left out. Splitting the days gave 11.27 orders on the 44 weekdays and 23.31 on the 16 weekend days, a difference one rate had no choice but to average away.
- Refitting with a rate per day type and rerunning the identical check gave 0.67. A pass covers the statistic you checked and nothing else, which is why the busiest day was a separate check with its own answer, 0.00075 and 0.43.

So pick the statistic that would change your decision. For the bakery that is the busiest day, because the morning bake is sized on it, and the one-rate model put 0.00075 on the day that actually happened.
