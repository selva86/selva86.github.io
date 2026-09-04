---
title: "Posterior predictive checks, in 5 minutes"
slug: "Bayesian-Mini-7"
description: "Simulate data from your fitted model and hold it against the real thing. A posterior predictive check in base R finds the misfit a clean summary hides."
keywords: "posterior predictive check, posterior predictive check in R, PPC p-value, Bayesian model checking, simulate from the posterior, test statistic, model misfit, Bayesian workflow"
mathjax: false
webr: true
date: "2026-09-04"
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
catalog_blurb: "How to check whether your fitted model can reproduce your data."
---

=== step === cover
::eyebrow Bayesian Decisions
## Posterior predictive checks, in 5 minutes

Today let's build a posterior predictive check from scratch, in base R.

A small online store recorded its orders for 60 days in a row. Over that stretch it took 100 orders, which works out at 1.67 a day. On 15 of those days nobody ordered anything at all, and the busiest day brought in 5 orders.

Now you fit a model to those 60 numbers. The fit runs, the summaries come back, and nothing in them looks wrong. That is exactly the problem. A summary of the parameters cannot tell you whether the model produces data that looks like the store's.

A fitted model can generate data, so generate some: simulate a few thousand 60-day datasets from it and see whether the real 60 days would pass for one of them. If they would not, the mismatch itself points at the part of the data the model gets wrong.

That comparison is called a posterior predictive check, and it comes down to three moves.

::widget process-flow {"steps":[{"title":"Draw from the posterior","sub":"take 4000 pairs of the average and the spread"},{"title":"Simulate the orders data from each draw","sub":"each pair produces one 60-day dataset"},{"title":"Compare the real data with the simulated ones","sub":"count a feature you care about in each"}]}

Everything from here is those three moves, done in base R on the store's 60 days.

=== step === concept
## The 60 days of orders, and the model fitted to them

Here are the 60 days, typed in so that everything below runs on the same numbers.

```r
# Look at the store's 60 days of orders
orders <- c(0, 2, 2, 0, 4, 4, 0, 3, 1, 1, 1, 1, 2, 0, 1, 3, 4, 1, 1, 0,
            2, 1, 3, 0, 1, 1, 0, 1, 4, 0, 0, 0, 3, 3, 1, 2, 3, 1, 2, 0,
            5, 1, 0, 0, 4, 2, 4, 1, 1, 3, 0, 0, 2, 3, 1, 3, 2, 5, 2, 2)

table(orders)
#> orders
#>  0  1  2  3  4  5
#> 15 17 11  9  6  2

round(c(mean = mean(orders), sd = sd(orders),
        zero_days = sum(orders == 0), busiest = max(orders)), 2)
#>      mean        sd zero_days   busiest
#>      1.67      1.43     15.00      5.00
```

`table()` counts how often each value turns up. 15 of the days had no orders, 17 had exactly one, and the store never took more than 5 orders in a day. The average is 1.67 orders a day and the standard deviation is 1.43.

The model we are going to check is the one most people reach for first. It treats each day's count as a draw from a Normal distribution with an unknown average, called mu, and an unknown spread, called sigma. The prior on both is flat, which means we bring no opinion of our own and the data alone set where both parameters land.

Now read those two summaries again and notice what they leave out. A mean of 1.67 and a standard deviation of 1.43 are ordinary numbers for a Normal, and nothing in them records that these are counts, that they can never drop below 0, or that a quarter of the days sit exactly at 0.

=== step === concept
## The posterior is a spread of parameter values, not one number

A fit does not hand back a single mu and a single sigma. It gives a posterior: a distribution over both parameters, saying which pairs of values the data support and which they rule out.

The widget below shows that for the average alone. It runs on its own built-in numbers rather than the store's, so slide the data average to 1.5 and the data points to 60, which puts it close to the store's 60 days at an average of 1.67. The legend names the three curves: the prior, the likelihood, which is what the data alone say, and the filled one, which is the posterior that comes out of combining them.

::widget bayes-update {}

Now drag the data points slider. At 60 the posterior is narrow and sits close to the likelihood, and moving the prior mean around barely shifts it. Pull the slider down to 3 and the posterior widens and slides back toward the prior.

To run a check we need actual pairs of values out of that posterior, not a picture of it. Under a flat prior there is an exact way to draw them, and it takes two lines: draw the variance first, then draw the average given that variance.

```r
# Draw 4000 pairs of the average and the spread from the posterior
set.seed(11)
sigma2 <- 59 * var(orders) / rchisq(4000, 59)           # the variance, 4000 draws
mu     <- rnorm(4000, mean(orders), sqrt(sigma2 / 60))  # the average, given each variance
sigma  <- sqrt(sigma2)                                  # the spread, on the orders scale

round(rbind(mu    = c(average = mean(mu),    spread = sd(mu)),
            sigma = c(average = mean(sigma), spread = sd(sigma))), 3)
#>       average spread
#> mu      1.666  0.187
#> sigma   1.451  0.138
```

The 59 is the 60 days minus one, and the 60 in the second line is the number of days. `rchisq(4000, 59)` draws 4000 numbers from a chi-squared distribution with 59 degrees of freedom, and dividing the data's summed squared deviations by them is the standard way to sample a variance when the prior is flat.

So we now hold 4000 plausible averages, centred at 1.666 with a spread of 0.187, and 4000 plausible values of sigma, centred at 1.451. Taking the same position from each vector gives one pair: `mu[1]` with `sigma[1]`, `mu[2]` with `sigma[2]`, and so on down to 4000.

=== step === concept
## One posterior draw gives one simulated dataset

Start with a single pair, the first of the 4000.

```r
# Look at the first of the 4000 posterior draws
round(c(mu = mu[1], sigma = sigma[1]), 3)
#>    mu sigma
#> 1.761 1.530
```

That draw gives an average of 1.761 orders a day and a spread of 1.530. That pair is a complete description of one store, in one world the data support. So run that store for 60 days: draw 60 numbers from a Normal with that average and that spread, and round each one to a whole count of orders. What comes out is a simulated dataset, the same shape as the real data and produced entirely by the model.

Do that once for every pair and you have 4000 of them.

```r
# Simulate one 60-day dataset from every posterior draw
yrep_normal <- matrix(0, nrow = 4000, ncol = 60)
for (i in 1:4000) {
  yrep_normal[i, ] <- round(rnorm(60, mu[i], sigma[i]))
}

dim(yrep_normal)
#> [1] 4000   60
```

Row 1 of `yrep_normal` is the 60 days the first pair produced, row 2 belongs to the second pair, and so on down to row 4000. Put that first row beside the real data and count what is in it.

```r
# Compare the first simulated dataset with the real one
rbind(real      = orders,
      simulated = yrep_normal[1, ])[, 1:20]
#>           [,1] [,2] [,3] [,4] [,5] [,6] [,7] [,8] [,9] [,10] [,11] [,12] [,13]
#> real         0    2    2    0    4    4    0    3    1     1     1     1     2
#> simulated    1    3    3    1    0    4    4    4    1     2     4     3     0
#>           [,14] [,15] [,16] [,17] [,18] [,19] [,20]
#> real          0     1     3     4     1     1     0
#> simulated     2     1    -1     3     1     2    -1

table(yrep_normal[1, ])
#>
#> -1  0  1  2  3  4  5
#>  4  8 16 12  9  9  2
```

Day by day the two rows are in the same territory, mostly 0s, 1s, 2s and 3s. The counts underneath show what the day-by-day view does not. The simulated dataset has 4 days at -1 orders, which no real store can have, and only 8 days at 0 against the real store's 15.

One row could be a fluke, so put 40 of them on the same axes as the real data.

```r
# Plot the real day counts against 40 of the simulated datasets
lev <- -5:9
counts_of <- function(x) as.vector(table(factor(x, levels = lev)))

plot(lev, counts_of(orders), type = "n", ylim = c(0, 26),
     xlab = "Orders in a day", ylab = "Number of days",
     main = "The real 60 days against 40 simulated ones")
for (i in 1:40) lines(lev, counts_of(yrep_normal[i, ]), col = "grey75")
lines(lev, counts_of(orders), col = "red", lwd = 3)
legend("topright", c("simulated", "real"), col = c("grey75", "red"),
       lwd = c(1, 3), bty = "n")
```

Each grey line is one simulated dataset: how many of its 60 days had 0 orders, how many had 1, and so on. The red line is the real store's 60 days, drawn the same way.

Two differences stand out. The grey lines carry on to the left of 0 and the red line stops dead there. And at 0 itself the red line sits at 15 while nearly every grey line sits below it. Both come from one cause: the weight this fit puts below 0 is weight that the real data puts at 0.

=== step === quiz
## Quick check: what changes from one simulated dataset to the next?

Each of the 4000 rows was built the same way, and no two rows are alike. Which sentence says what varies between them?

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- The real 60 days are reshuffled, so every simulated dataset is a rearrangement of the orders the store actually took. ::no
- The average and the spread are held at their posterior means, and only the 60 simulated values change. ::no
- Two things change: the pair of parameter values drawn from the posterior, and the 60 values simulated from that pair. ::ok Yes. Row 1 came from mu = 1.761 and sigma = 1.530, and every other row came from its own pair, so uncertainty about the parameters and randomness in the data are both in there.
- The model is refitted from scratch each time, giving a fresh posterior for every simulated dataset. ::no Nothing is reshuffled, nothing is held fixed, and nothing is refitted. Each row starts with one pair drawn from the posterior and then simulates 60 fresh values from that pair, so the parameters vary down the rows and the values vary within them.

=== step === concept
## Turning the comparison into one number: days with no orders

Forty grey lines is a picture, not an answer. To get a number, pick one feature of the data, measure it on the real 60 days, and measure the same thing on every simulated dataset. That measurement is called a test statistic, and choosing it is your job: take whatever feature you would want the model to get right.

For a store that sits idle a quarter of the time, the obvious choice is the count of days with no orders.

```r
# Count the days with no orders, in the real data and in every simulated dataset
T_obs    <- sum(orders == 0)
T_normal <- rowSums(yrep_normal == 0)

c(observed = T_obs, simulated_average = round(mean(T_normal), 1))
#>          observed simulated_average
#>              15.0               8.5
```

The real store had 15 days with no orders. Across the 4000 simulated datasets that count averages 8.5. Plot all 4000 and mark the real value on them.

```r
# Plot the simulated zero-day counts with the real one marked
hist(T_normal, breaks = 20, col = "grey85", border = "white",
     main = "Days with no orders in 4000 simulated datasets",
     xlab = "Days with no orders")
abline(v = T_obs, col = "red", lwd = 3)
```

The grey pile is the range of counts this fit produces. It centres near 8 and thins out quickly past 12. The red line at 15 is the store's own count, sitting out in the right tail rather than in the body of the pile.

How far out, exactly? Count the simulated datasets that reached 15 or more and divide by 4000.

```r
# The share of simulated datasets with at least as many zero-order days as the real one
mean(T_normal >= T_obs)
#> [1] 0.02875
```

That share is the posterior predictive p-value, or PPC p-value, and it comes to 0.029 here. Under this fit, fewer than 3 in 100 simulated datasets have as many days with no orders as the store did.

[KEY INSIGHT]
A PPC p-value is the share of simulated datasets whose test statistic matches or beats the real one. It measures how ordinary your data would look coming out of your own fitted model, on the single feature you chose to measure.

=== step === concept
## Reading a failed check: what the Normal cannot produce

A PPC p-value of 0.029 says this fit does not reproduce the store's days with no orders. It does not say why, and the why is the useful part. So look at what the fit is able to produce at all.

```r
# Look at the smallest counts the Normal fit produces
range(yrep_normal)
#> [1] -5  8
mean(apply(yrep_normal, 1, min) < 0)
#> [1] 0.96325
```

`apply(yrep_normal, 1, min)` runs `min()` along each row in turn, which reduces every simulated dataset to its smallest day, and the `mean()` around it is the share of datasets whose smallest day falls below 0. So 96% of the simulated datasets contain at least one day with a negative number of orders, and the lowest count anywhere in the 4000 is -5.

That one number explains the failure. A Normal distribution is continuous and symmetric, so it has no floor at 0. Rounding lands some of its draws on exactly 0, but the rest of the weight that ought to pile up there is spread out over -1, -2 and below instead. The fit runs short of days with no orders by construction, which is precisely what the check reported.

So the repair is not a tighter prior or more draws. It is a likelihood that produces whole numbers from 0 upward. The Poisson does that, and it is the standard choice for counting how many times something happened in a fixed window, which is what a day of orders is.

Give the Poisson's rate, lambda, a Gamma(2, 1) prior and the posterior is a Gamma as well, updated by plain addition: add the 100 orders to the first number and the 60 days to the second, which gives Gamma(102, 61).

```r
# Refit with a Poisson likelihood and a Gamma(2, 1) prior, then simulate again
set.seed(12)
lambda <- rgamma(4000, 2 + sum(orders), 1 + length(orders))   # a Gamma(102, 61) posterior

yrep_pois <- matrix(0, nrow = 4000, ncol = 60)
for (i in 1:4000) {
  yrep_pois[i, ] <- rpois(60, lambda[i])
}
T_pois <- rowSums(yrep_pois == 0)

round(c(lambda_average    = mean(lambda),
        simulated_average = mean(T_pois),
        ppc_p_value       = mean(T_pois >= T_obs)), 3)
#>    lambda_average simulated_average       ppc_p_value
#>             1.679            11.322             0.178
```

The rate centres at 1.679 orders a day, near the 1.67 the store averaged. The simulated count of days with no orders now centres at 11.3 instead of 8.5, and 17.8% of the simulated datasets reach the store's 15. The observed value has moved out of the tail and into the crowd.

=== step === widget
## Where the observed count falls under each fit

Both checks are worth seeing side by side. The widget carries its own copy of the numbers: 60 days of which 15 had no orders, and a Normal fit at an average of 1.6 and a spread of 1.4, close to the store's own 1.67 and 1.43.

::widget ppc-overlay {}

On the Normal fit the bars sit around 8 and the observed 15 stands well to the right of them. Switch to the Poisson and the bars slide right to 11 or 12, and the observed line ends up inside them. The PPC p-value under the plot moves with the bars.

Notice what did not move. The observed count is 15 under either fit, because it is a property of the store's data and nothing else. What the toggle changes is the set of datasets the fitted model produces, and therefore whether 15 is an ordinary member of that set.

=== step === concept
## What a passing check does and does not settle

The count of days with no orders passes under the Poisson fit. That is one feature of the data, so put two more through the same check: the standard deviation, which says how spread out the daily counts are, and the busiest day.

```r
# Check three test statistics against the Poisson fit
ppc <- function(stat) mean(apply(yrep_pois, 1, stat) >= stat(orders))

round(c(zero_days = ppc(function(x) sum(x == 0)),
        spread    = ppc(sd),
        busiest   = ppc(max)), 3)
#> zero_days    spread   busiest
#>     0.178     0.159     0.798
```

`ppc()` is the counting from a few steps back with the statistic left open. `apply(yrep_pois, 1, stat)` reduces each simulated dataset to one number, `stat(orders)` does the same to the real 60 days, and the share of simulated datasets that match or beat the real value is the p-value.

All three land well away from 0 and 1, so on all three features the simulated datasets look like the real one.

That is what a passing check buys you, and it is less than it sounds. It says the model can produce data like the store's. It does not say the model is the right one, or even the only one that would pass here, because other likelihoods could reproduce these same three features just as well.

A PPC p-value is also not a hypothesis test, and there is no 0.05 to clear. The signal is a value close to 0 or close to 1, which means the real data sits at one end of what the model produces. 0.029 was that signal. 0.178, 0.159 and 0.798 are not.

[NOTE]
A PPC p-value of 0.5 is not a better result than one of 0.2. Both say the real value sits comfortably among the simulated ones, and neither ranks one model above another.

=== step === quiz
## Quick check: how to read a PPC p-value of 0.178

The Poisson fit returned 0.178 on the count of days with no orders. Which sentence reads that number correctly?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- There is a 17.8% chance that the Poisson model is the true model behind the store's orders. ::no
- In 17.8% of the simulated datasets there were at least as many days with no orders as the store actually had, so the fit reproduces that feature. ::ok Exactly. It is a share of simulated datasets, counted on one statistic you picked, and it says nothing at all about the probability of the model.
- Since 1 minus 0.178 is 0.822, there is an 82.2% chance the Poisson fit is wrong. ::no
- 0.178 is above 0.05, so the check fails to reject the Poisson model at the usual significance level. ::no A PPC p-value is a share of simulated datasets, not a probability about the model and not a test with a bar to clear. 0.178 means 17.8% of them had at least as many days with no orders as the store did, and that is the whole of it. There is no 0.05 line here, and 1 minus the value is not the chance of anything.

=== step === tryit
## Your turn: check the busiest day under the Normal fit

The Normal fit failed badly on the count of days with no orders. That does not mean it fails on every feature of the data, and it is worth finding out what a poorly chosen statistic looks like.

`yrep_normal` still holds the 4000 simulated datasets from that fit, and the store's busiest day took 5 orders. Reduce each simulated dataset to its largest value, then work out the share of those that reach 5 or more.

```r
# yrep_normal holds 4000 simulated 60-day datasets from the Normal fit.
# The store's busiest day is max(orders), which is 5.
# Take the largest value in each simulated dataset, then the share of
# those that reach the observed busiest day or beat it.
# Two lines. Press Check when you have them.
```
::check {"regex": "apply[(]\\s*yrep_normal\\s*,\\s*1\\s*,\\s*max", "gate": true, "difficulty": "intermediate", "ok": "0.753, a comfortable pass. The fit that could not produce the store's days with no orders handles its busiest day without any trouble, because the busiest day is not where the flaw lives.", "no": "Reduce each row to its largest value with apply(yrep_normal, 1, max) and store that, then take the mean() of it being at least max(orders)."}
::solution
```r
# Check the busiest day under the Normal fit
max_normal <- apply(yrep_normal, 1, max)
mean(max_normal >= max(orders))
#> [1] 0.753
```

That is 0.753 against 0.029, from the same 4000 simulated datasets. A check is only as sharp as the statistic you feed it, and a statistic aimed away from the model's weakness will let a broken model through.

=== step === concept
## References

- [Posterior predictive assessment of model fitness via realized discrepancies](https://www3.stat.sinica.edu.tw/statistica/j6n4/j6n41/j6n41.htm) - Gelman, Meng and Stern (1996), Statistica Sinica 6(4), 733-760. The paper that set out the method and the posterior predictive p-value.
- [Bayesian Data Analysis, third edition](http://www.stat.columbia.edu/~gelman/book/) - Gelman, Carlin, Stern, Dunson, Vehtari and Rubin (2013). Chapter 6, Model checking, is the reference treatment, and chapter 3 sets out the flat-prior draws used here.
- [Visualization in Bayesian workflow](https://doi.org/10.1111/rssa.12378) - Gabry, Simpson, Vehtari, Betancourt and Gelman (2019), JRSS A 182(2), 389-402. Which plot to reach for, and what each one exposes.
- [Bayesian Workflow](https://arxiv.org/abs/2011.01808) - Gelman, Vehtari, Simpson and colleagues (2020), arXiv:2011.01808. Where checking sits among the other steps of building a model.
- [Graphical posterior predictive checks](https://mc-stan.org/bayesplot/articles/graphical-ppcs.html) - Gabry and Mahr, the bayesplot vignette. The ready-made versions of the plots built by hand here.

=== step === complete
## Quick recap

You took a fitted model, made it produce 4000 datasets, and held the store's real 60 days against them. To summarize:

- A posterior predictive check is three moves: draw a parameter pair from the posterior, simulate a dataset from that pair, compare the simulated datasets with the real one.
- Choose a test statistic and the comparison turns into a number. The store had 15 days with no orders, the Normal fit's simulated datasets averaged 8.5, and only 2.9% of them reached 15.
- A PPC p-value near 0 or near 1 marks a feature the model cannot reproduce. Reading that feature is what points to the repair: 96% of the Normal fit's simulated datasets contained a negative count, so the likelihood had to change.
- Refitting with a Poisson likelihood brought the simulated count of days with no orders to 11.3 and the PPC p-value to 0.178.
- A passing check says the model can produce data like yours on the statistic you chose. It does not say the model is right. That same failing Normal fit passed on the busiest day at 0.753.
- So check more than one statistic, and aim them at different parts of the data: how often the smallest value turns up, how spread out the values are, how big the largest one gets.

Next time a fit comes back looking clean, you have a way to settle the harder question: could this model have produced the data you fitted it to? Nicely done, and enjoy the rest of your day.
