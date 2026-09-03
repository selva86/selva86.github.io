---
title: "Posterior predictive checks, in 5 minutes"
slug: "Bayesian-Mini-7"
description: "Simulate datasets from a fitted Bayesian model, compare them with your real data, and read the posterior predictive p-value that shows where a model fails."
keywords: "posterior predictive check, posterior predictive p-value, Bayesian model checking in R, replicated datasets, test statistic, model misfit, Poisson model in R"
mathjax: true
webr: true
date: "2026-09-03"
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
catalog_blurb: "How to tell whether a fitted model actually describes the data you have."
---

=== step === cover
::eyebrow Bayesian Decisions
## Posterior predictive checks, in 5 minutes

A small online store sells one product. It took 100 orders over 60 consecutive days, which works out at 1.67 orders a day, and on 15 of those days it took no orders at all. Its busiest day took 5.

Fit a Normal model to those 60 numbers and the posterior for the daily average runs from 1.33 to 2.03 orders. That interval is narrow, and it is centred close to the 1.67 orders a day the store actually averaged.

But a fitted Bayesian model has two parts, and an interval like that uses only one of them. The posterior says which parameter values are plausible given the 60 days. The likelihood says what a day of orders looks like once you fix those values. Run the second of those and the model produces data.

So take one set of parameter values from the posterior, generate 60 days of orders at those values, and you have a dataset the same size as the store's. Do that a thousand times and you have a thousand datasets to compare the real 60 days with. Anything in the store's data that none of those thousand can produce is something the model is missing.

That comparison has a name, the posterior predictive check, and it comes down to three actions.

::widget process-flow {"steps":[{"title":"Draw from the posterior","sub":"one plausible pair of parameter values"},{"title":"Simulate 60 days of orders","sub":"one dataset the size of the real one"},{"title":"Compare with the real data","sub":"the observed 60 days against the simulated ones"}]}

Those three are the whole check. What is left is to run them on the store's 60 days and work out how to read what comes back.

=== step === concept
## The 60 days of orders

Every number from here on is computed from one dataset, so start with it. The block below builds the store's 60 daily counts and summarises them.

```r
# Build the store's 60 days of orders and summarise what they look like
set.seed(2)
orders <- rpois(60, 1.5)

c(days = length(orders), total = sum(orders), mean = round(mean(orders), 2),
  sd = round(sd(orders), 2), zero_days = sum(orders == 0), busiest = max(orders))
#>      days     total      mean        sd zero_days   busiest
#>     60.00    100.00      1.67      1.43     15.00      5.00

table(orders)
#> orders
#>  0  1  2  3  4  5
#> 15 17 11  9  6  2
```

The store took 100 orders across the 60 days, which averages 1.67 a day, with a standard deviation of 1.43.

The table underneath is the more useful summary. There were 15 days with no orders at all, exactly a quarter of the period, and 17 days with a single order. Only 2 days reached 5, and nothing went higher.

```r
# Draw the 60 days as one bar per order count
hist(orders, breaks = seq(-0.5, 5.5, 1), col = "grey85", border = "white",
     main = "Orders on each of the store's 60 days",
     xlab = "orders in a day")
```

The two tallest bars sit at 0 and 1, and the bars fall away steadily after that. Orders are counts, so every value is a whole number and none of them can be negative. Both facts are worth holding on to, because a model fitted to these 60 days can still generate values that are fractional or below zero.

=== step === widget
## The Normal model and its posterior

The first model most people reach for treats each day as a draw from a Normal distribution: an average `mu`, a spread `sigma`, and 60 days that are independent of one another.

Fitting it with a flat prior means the two parameters are estimated from the 60 days alone. What comes back is not one value of `mu` and one of `sigma`. It is a posterior, a spread of plausible pairs, and the two lines below draw 1000 of them.

```r
# Draw 1000 plausible parameter pairs from the fitted Normal model's posterior
ybar <- mean(orders)
s    <- sd(orders)

set.seed(11)
sigma <- sqrt(59 * s^2 / rchisq(1000, 59))
mu    <- rnorm(1000, ybar, sigma / sqrt(60))

round(quantile(mu, c(0.025, 0.975)), 2)
#>  2.5% 97.5%
#>  1.33  2.03

round(c(mu_1 = mu[1], sigma_1 = sigma[1]), 2)
#>    mu_1 sigma_1
#>    1.46    1.53
```

Those two lines are the closed form for a Normal model under a flat prior, so no fitting software is needed. `sigma` comes from the sample standard deviation scaled by a chi-squared draw on 59 degrees of freedom, and `mu` is then drawn around the sample mean 1.67 with a spread of `sigma` over the square root of 60.

The middle 95% of the 1000 `mu` values runs from 1.33 to 2.03 orders a day. Draw number 1 is the pair 1.46 and 1.53, and each of the other 999 is a different pair.

The widget below runs the same kind of update, on its own built-in numbers rather than the store's, with the spread of the data fixed at 2 where the store's is 1.43.

::widget bayes-update {}

Drag data average to 1.5, the closest its slider gets to the store's 1.67 since it moves in half steps, and drag data points n to 60. The posterior it reports is a mean of 1.41 with an sd of 0.25, and its curve sits almost on top of the likelihood: with 60 days of evidence the prior barely matters. That narrow curve is the same kind of object as `mu` above, a range of plausible values rather than a single answer.

=== step === concept
## Simulating one dataset from one posterior draw

Take draw number 1 on its own, `mu` = 1.46 and `sigma` = 1.53. Those two numbers specify a Normal distribution completely, so you can generate 60 days of orders from it. That gives one dataset the same size as the store's, built by the model rather than by the store.

Repeat it for all 1000 draws and you have 1000 datasets. `rep_norm` holds them with one dataset per row: row 1 is simulated at draw 1, row 2 at draw 2, and so on. The standard name for one of these is a replicated dataset, which is where the object gets its name.

```r
# Simulate 1000 datasets of 60 days each, one from every posterior draw
set.seed(4)
rep_norm <- t(sapply(1:1000, function(i) rnorm(60, mu[i], sigma[i])))

dim(rep_norm)
#> [1] 1000   60

round(rep_norm[1, ], 1)
#>  [1]  1.8  0.6  2.8  2.4  4.0  2.5 -0.5  1.1  4.4  4.2  2.3  1.5  2.1  1.4  1.5
#> [16]  1.7  3.2  1.4  1.3  1.0  3.8  1.7  3.5  3.4  2.4  1.0  3.4  2.9  0.0  3.4
#> [31]  1.7  3.1  0.3 -0.8  2.8  0.8  1.1  2.9  0.8  0.5  3.5  1.7  3.4 -1.1  0.2
#> [46]  0.1  1.6  0.9  2.6 -1.3  0.4  0.5  1.3  2.1  4.5  0.6  0.6  2.5  1.2  3.5
```

Now compare that first simulated dataset with the days it is meant to look like.

```r
# The store's own 60 days, and the days the first simulated dataset puts below zero
orders
#>  [1] 0 2 2 0 4 4 0 3 1 1 1 1 2 0 1 3 4 1 1 0 2 1 3 0 1 1 0 1 4 0 0 0 3 3 1 2 3 1
#> [39] 2 0 5 1 0 0 4 2 4 1 1 3 0 0 2 3 1 3 2 5 2 2

sum(rep_norm[1, ] < 0)
#> [1] 4
```

The store's days are 0, 2, 2, 0, 4 and so on, whole numbers, none of them below zero. The first simulated dataset opens 1.8, 0.6, 2.8, and four of its 60 days come out negative.

No store can take 1.8 orders in a day, and none can take minus half an order. That is not a flaw in the simulation, though. It is the Normal likelihood doing exactly what it is defined to do, which is to put probability on every number on the line, fractions and negatives included. A fitted model can only generate the kind of data its likelihood generates, and this is that kind.

=== step === quiz
## Quick check: what one simulated dataset is

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- The store's own 60 days, resampled with replacement into a dataset of the same size. ::no
- 60 days generated at the posterior mean, the same parameter values behind every dataset. ::no
- 60 days generated from the likelihood at one posterior draw's parameter values, so each of the 1000 datasets comes from a different pair. ::ok That is it. Row 1 came from 1.46 and 1.53, row 2 from another pair entirely, and the variation across rows carries the posterior uncertainty into the simulated data.
- The model's single best prediction of what each of the 60 days would hold. ::no A simulated dataset is generated, not resampled from the store's days and not averaged down to one prediction. Each row is a fresh 60 days drawn from the likelihood at one posterior draw, which is why row 1 held fractions and negatives instead of the store's whole numbers, and why the 1000 rows all differ from each other.

=== step === concept
## 1000 simulated datasets against the real one

One simulated dataset proves nothing on its own. The comparison worth making shows the shape of the real data and the shapes of many simulated ones at once, which is what the plot below does with 50 of them.

```r
# Overlay 50 simulated datasets on the store's own 60 days
plot(density(orders, bw = 0.5), lwd = 3, col = "black",
     ylim = c(0, 0.38), xlim = c(-5, 9),
     main = "The store's 60 days against 50 simulated datasets",
     xlab = "orders in a day")
for (i in 1:50) lines(density(rep_norm[i, ], bw = 0.5), col = rgb(0.20, 0.40, 0.75, 0.35))
lines(density(orders, bw = 0.5), lwd = 3)
```

The black curve is the store's 60 days and the blue ones are the 50 simulated datasets. Both are smoothed with the same bandwidth, so they can be read against each other directly.

Two things separate them. Every blue curve runs further to the left than the black one, out past minus 4 in places, while the black curve has faded to nothing by minus 1.5. And at zero itself the black curve stands higher than 49 of the 50 blue curves, because a quarter of the store's days were zeros and the simulated datasets spread that weight around instead.

The left tail is easy to put a number on.

```r
# Measure how much of the simulated data falls below zero
round(mean(rep_norm < 0), 3)            # share of all 60,000 simulated day values
#> [1] 0.124

round(mean(rowSums(rep_norm < 0)), 1)   # days below zero in a typical dataset
#> [1] 7.4
```

12.4% of everything the model generated is negative. In a typical simulated dataset that is 7.4 days out of 60 on which the store took a negative number of orders. The store itself recorded none in 60 days, and could not have.

=== step === concept
## The posterior predictive p-value

Reading curves catches the gross failures. To get a comparison you can put in a report, pick one number that summarises a dataset, then compute it on the real data and on every simulated one. That number is called a test statistic.

There is an obvious candidate in the store's data: the days with no orders. There were 15 of them. A Normal draw is never exactly zero, so a simulated day counts as a zero-order day when it rounds to zero.

```r
# Count the zero-order days in every simulated dataset and compare with the real 15
zero_days <- function(x) sum(round(x) == 0)

t_obs <- sum(orders == 0)
t_rep <- apply(rep_norm, 1, zero_days)

hist(t_rep, breaks = 20, col = "grey85", border = "white",
     main = "Zero-order days in 1000 simulated datasets",
     xlab = "days with no orders")
abline(v = t_obs, col = "red", lwd = 3)

c(observed = t_obs, replicate_mean = round(mean(t_rep), 1), ppc_p = mean(t_rep >= t_obs))
#>      observed replicate_mean          ppc_p
#>        15.000          8.400          0.028
```

The grey pile is the 1000 simulated counts, centred on 8.4 zero-order days. The red line marks the store's 15, out in the right tail with only a thin scatter of simulated datasets beyond it.

28 of the 1000 reached 15 or more, a share of 0.028. That share is the posterior predictive p-value, and in symbols it is this:

\[ p = P\big(T(y^{\mathrm{rep}}) \ge T(y) \mid y\big) \]

Read it from the inside out. \(T\) is the test statistic, \(y\) is the observed data, and \(y^{\mathrm{rep}}\) is a simulated dataset. The whole expression is the share of simulated datasets whose statistic matches or beats the observed one.

A value near 0.5 says the observed statistic is an ordinary result for this model. A value close to 0 or close to 1 says it is not, and 0.028 is close to 0.

[NOTE]
This is not the p-value of a hypothesis test. There is no null hypothesis anywhere in it and no 0.05 line to clear. It reports a position: where the observed statistic falls among the statistics the fitted model produces.

=== step === concept
## Which test statistics can catch a misfit

The statistic you pick decides whether the check can find anything at all. Run four of them through the same calculation.

```r
# Compare four test statistics: observed value, replicate average and PPC p-value
stats <- data.frame(
  statistic = c("mean", "sd", "busiest day", "zero-order days"),
  observed  = round(c(mean(orders), sd(orders), max(orders), t_obs), 2),
  replicate_average = round(c(mean(rowMeans(rep_norm)),
                              mean(apply(rep_norm, 1, sd)),
                              mean(apply(rep_norm, 1, max)),
                              mean(t_rep)), 2),
  ppc_p = round(c(mean(rowMeans(rep_norm) >= mean(orders)),
                  mean(apply(rep_norm, 1, sd) >= sd(orders)),
                  mean(apply(rep_norm, 1, max) >= max(orders)),
                  mean(t_rep >= t_obs)), 3)
)
stats
#>         statistic observed replicate_average ppc_p
#> 1            mean     1.67              1.68 0.521
#> 2              sd     1.43              1.44 0.506
#> 3     busiest day     5.00              5.01 0.474
#> 4 zero-order days    15.00              8.41 0.028
```

The mean, the standard deviation and the busiest day all come back near the middle, at 0.521, 0.506 and 0.474. On those three the model looks perfect.

The first two are perfect by construction. `mu` was drawn around the sample mean of 1.67 and `sigma` around the sample standard deviation of 1.43, so the simulated datasets were built to average 1.68 and spread 1.44. A statistic the fitting already matched cannot detect a misfit, however wrong the model is.

The zero-order days count is the one statistic here that the fitting never constrained, and it is the one that fails, at 0.028.

One more comparison needs no p-value at all, and that is the days below zero. The observed count is 0, and 0 is the lowest a count of anything can be, so the observed value can never sit in the upper tail. The plain number is the finding: 7.4 days per simulated dataset that could not have happened.

[KEY INSIGHT]
A posterior predictive check is worth exactly as much as the statistic behind it. Choose one the fitting already matched, such as the mean, and the check passes no matter what the model is. Choose one the fitting never constrained, and it has a chance of finding something.

=== step === concept
## Refitting with a Poisson model, and checking again

The failed check points straight at what to change. The Normal likelihood puts orders on a continuous scale that runs below zero, and orders are counts. The Poisson distribution is the standard model for counts: one parameter, `lambda`, the average count per day, and probability only on 0, 1, 2 and upwards.

With a Gamma(1, 1) prior on `lambda`, 100 orders and 60 days, the posterior is Gamma(101, 61). Each of those two numbers is the prior's 1 plus what the data adds: 1 plus the 100 orders, and 1 plus the 60 days.

```r
# Refit as a Poisson model and simulate 1000 datasets from its posterior
set.seed(12)
lambda   <- rgamma(1000, 101, 61)
rep_pois <- t(sapply(1:1000, function(i) rpois(60, lambda[i])))

round(quantile(lambda, c(0.025, 0.975)), 2)
#>  2.5% 97.5%
#>  1.38  2.00

min(rep_pois)
#> [1] 0
```

The middle 95% of `lambda` runs from 1.38 to 2.00, against 1.33 to 2.03 from the Normal fit. The two intervals barely differ, which is why a posterior summary on its own would never have separated the two models.

The smallest value anywhere in the 60,000 simulated days is 0, and no Poisson draw could have made it otherwise. Redraw the overlay and the left tail is gone.

```r
# Redraw the overlay with the Poisson simulated datasets
plot(density(orders, bw = 0.5), lwd = 3, col = "black",
     ylim = c(0, 0.45), xlim = c(-5, 9),
     main = "The store's 60 days against 50 Poisson simulated datasets",
     xlab = "orders in a day")
for (i in 1:50) lines(density(rep_pois[i, ], bw = 0.5), col = rgb(0.20, 0.40, 0.75, 0.35))
lines(density(orders, bw = 0.5), lwd = 3)
```

Every curve now stops at the same place on the left, and what little sits below zero is the smoothing rather than the data. Run the statistics again for the numbers.

```r
# The same three test statistics under the Poisson fit
stats_pois <- data.frame(
  statistic = c("mean", "sd", "zero-order days"),
  observed  = round(c(mean(orders), sd(orders), t_obs), 2),
  replicate_average = round(c(mean(rowMeans(rep_pois)),
                              mean(apply(rep_pois, 1, sd)),
                              mean(rowSums(rep_pois == 0))), 2),
  ppc_p = round(c(mean(rowMeans(rep_pois) >= mean(orders)),
                  mean(apply(rep_pois, 1, sd) >= sd(orders)),
                  mean(rowSums(rep_pois == 0) >= t_obs)), 3)
)
stats_pois
#>         statistic observed replicate_average ppc_p
#> 1            mean     1.67              1.66 0.491
#> 2              sd     1.43              1.28 0.146
#> 3 zero-order days    15.00             11.61 0.200
```

Zero-order days now reads 0.200, with the simulated datasets averaging 11.6 against the observed 15. A count of 15 is well inside what this model produces.

The mean passes at 0.491. The standard deviation passes at 0.146, but it is the weakest of the three: a Poisson has its spread fixed by its average, so the simulated datasets come out at 1.28 where the store's is 1.43. That is worth remembering rather than acting on, since 0.146 is nowhere near either end.

=== step === widget
## Where the observed count falls under each fit

The two fits differ in one thing that matters, and it is visible in a single picture: where the observed count of zero-order days falls among the counts the model produces.

::widget ppc-overlay {}

It uses its own 60 days of counts with 15 of them at zero, which are the store's numbers. It simulates at one fitted pair of parameter values rather than across 1000 posterior draws, so its p-values land near the ones computed above rather than exactly on them.

Toggle between the two fits and watch the red line. Under the Normal fit the simulated counts pile up around 9 and the observed 15 stands clear of the pile on the right, giving 0.02. Under the Poisson fit they centre near 12 and the same 15 lands inside the bulk of them, giving 0.22. Nothing about the observed data changed between the two views. Only the model generating the grey bars did.

=== step === tryit
## Your turn: check the busiest day

The busiest day is the one statistic from the Normal table that has not yet been put through the Poisson fit. The store's busiest day took 5 orders, and `rep_pois` holds the 1000 Poisson simulated datasets, one per row.

```r
# rep_pois holds 1000 simulated datasets, one per row, 60 days each.
# The store's busiest day took 5 orders.
# Work out the busiest day in each simulated dataset, then the share of
# datasets whose busiest day reaches 5 or more.
# Two lines. Press Check when you have them.
```
::check {"regex": "apply[(]rep_pois,\\s*1,\\s*max[)]", "gate": true, "difficulty": "intermediate", "ok": "Right: 0.786. Nearly four in five Poisson simulated datasets have a busiest day of 5 or more, so a day of 5 orders is an ordinary outcome under this model.", "no": "Work along the rows. `apply(rep_pois, 1, max)` gives the busiest day of each simulated dataset, and `mean()` of that vector compared against `max(orders)` gives the share reaching 5 or more."}
::solution
```r
# Posterior predictive p-value for the busiest day under the Poisson fit
max_rep <- apply(rep_pois, 1, max)
mean(max_rep >= max(orders))
#> [1] 0.786
```

0.786 sits high, but a posterior predictive p-value only becomes a finding when it is close to 0 or close to 1. Four statistics have now gone through the Poisson fit and not one of them has landed there.

=== step === quiz
## Quick check: what a passing check does and does not say

The Normal fit passed on the mean, the standard deviation and the busiest day, and failed on the zero-order days. The Poisson fit passed on all four.

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The Normal model fits the store's orders after all, since three of its four statistics came back mid-range. ::no
- Passing says the model reproduces the statistics that were checked, and says nothing at all about the ones that were not. ::ok Exactly. The Normal fit passed three checks while putting 7.4 impossible days into every simulated dataset, and the single failure on a statistic the fitting never constrained was enough to reject it.
- The Poisson model is the right model for this store, since its checks all passed. ::no
- A posterior predictive p-value near 0.5 is the probability that the model is correct. ::no A posterior predictive check compares the observed data with the data one model generates, one statistic at a time. Three passes do not cancel one failure, and no number of passes rates how probable a model is or rules out a different model that would pass the very same checks.

=== step === concept
## References

- [Bayesianly Justifiable and Relevant Frequency Calculations for the Applied Statistician](https://doi.org/10.1214/aos/1176346785) - Rubin (1984), The Annals of Statistics 12(4), 1151-1172. Where posterior predictive checking and its p-value were first set out.
- [Posterior Predictive Assessment of Model Fitness via Realized Discrepancies](https://www3.stat.sinica.edu.tw/statistica/j6n4/j6n41/j6n41.htm) - Gelman, Meng and Stern (1996), Statistica Sinica 6(4), 733-807. The paper on choosing test statistics, including ones that depend on the parameters.
- [Bayesian Data Analysis, third edition](http://www.stat.columbia.edu/~gelman/book/) - Gelman, Carlin, Stern, Dunson, Vehtari and Rubin (2013). Chapter 6, Model checking, is the standard textbook treatment.
- [Visualization in Bayesian Workflow](https://doi.org/10.1111/rssa.12378) - Gabry, Simpson, Vehtari, Betancourt and Gelman (2019), Journal of the Royal Statistical Society A 182(2), 389-402. Where each graphical check belongs in a real analysis.
- [Graphical Posterior Predictive Checks](https://mc-stan.org/bayesplot/articles/graphical-ppcs.html) - Stan development team. Every plot type in the bayesplot package, with what each one is good at spotting.

=== step === complete
## Quick recap

You ran a posterior predictive check from end to end on 60 days of orders, used it to reject one model, and used it again to clear a second. The parts worth keeping:

- A fitted model generates data. Draw a pair of parameter values from the posterior, simulate a dataset the size of yours at those values, and repeat: 1000 draws gave 1000 simulated datasets of 60 days each.
- Compare those datasets with the real one. The Normal fit put 12.4% of its simulated values below zero, 7.4 days in a typical dataset, where the store recorded none in 60 days.
- A test statistic turns that comparison into a number. The share of simulated datasets matching or beating the observed value is the posterior predictive p-value, and for zero-order days under the Normal fit it was 0.028.
- The choice of statistic decides what the check can find. The mean at 0.521 and the standard deviation at 0.506 were reproduced because the fitting matched them by construction, so neither could have caught anything.
- Refitting as a Poisson model corrected the misfit. Zero-order days moved to 0.200, the busiest day came in at 0.786, and not one simulated day fell below zero.

The Normal fit was never wrong about the daily average. It put it at 1.33 to 2.03, and the Poisson fit put it at 1.38 to 2.00. What no posterior summary could have told you is that one of those two models puts an eighth of everything it generates on days that cannot happen.

That is what a posterior predictive check adds, and it costs you one simulation and one well chosen statistic.
