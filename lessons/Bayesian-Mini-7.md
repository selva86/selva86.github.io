---
title: "Posterior predictive checks, in 5 minutes"
slug: "Bayesian-Mini-7"
description: "Simulate datasets from your fitted Bayesian model, compare them with the real data, and read the PPC p-value that says what the model cannot reproduce."
keywords: "posterior predictive check, PPC p-value, Bayesian model checking, posterior predictive distribution, model misfit, zero-inflated Poisson, count data in R"
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
catalog_blurb: "How to tell whether a fitted Bayesian model can actually produce your data."
---

=== step === cover
::eyebrow Bayesian Decisions
## Posterior predictive checks, in 5 minutes

Let's understand posterior predictive checks today, clearly and with a real example.

A small online store sells one product, and you have its daily order count for 60 consecutive days. There were 145 orders over that stretch, 2.42 a day on average, 9 on the busiest day, and 22 days with no orders at all.

Counts like these usually get a Poisson model, and fitting one to the 60 days is quick work. What comes back is an estimate of the daily order rate, with an interval around it. That answers the question of how fast orders arrive. It says nothing about whether a Poisson can produce 22 days with no orders out of 60 in the first place.

A posterior predictive check answers that second question, and it settles it by simulation rather than by argument. You take the fitted model, simulate 60-day datasets from it, and count the days with no orders in each one. If the observed 22 is an ordinary number to see among them, the model accounts for that feature of the data. If nothing the model produces comes anywhere near 22, it does not, and the size of the gap is your first clue about what is missing.

There are only three steps, and each of them is a line or two of R.

::widget process-flow {"steps":[{"title":"Draw from the posterior","sub":"one daily rate the 60 days support"},{"title":"Simulate the orders data from each draw","sub":"a fresh 60-day dataset per draw"},{"title":"Compare the real data with the simulated ones","sub":"count the days with no orders in each"}]}

That is the order we will run them in.

=== step === concept
## Sixty days of orders, and the Poisson model fitted to them

Here are the 60 days in full, along with the summaries worth knowing before anything is fitted to them. Press Run.

```r
# Load the 60 days of order counts and summarise what is in them
orders <- c(0, 0, 6, 0, 0, 0, 1, 2, 0, 3, 0, 2, 4, 1, 2, 3, 1, 3, 3, 5,
            2, 0, 1, 4, 0, 3, 0, 0, 9, 0, 5, 2, 0, 6, 6, 0, 7, 4, 0, 0,
            4, 0, 3, 2, 4, 8, 8, 0, 3, 7, 5, 4, 3, 0, 0, 5, 3, 0, 1, 0)

c(days = length(orders), total = sum(orders), zero_days = sum(orders == 0),
  mean = round(mean(orders), 2), variance = round(var(orders), 2),
  busiest = max(orders))
#>      days     total zero_days      mean  variance   busiest
#>     60.00    145.00     22.00      2.42      6.28      9.00

table(orders)
#> orders
#>  0  1  2  3  4  5  6  7  8  9
#> 22  5  6  9  6  4  3  2  2  1
```

Read the bottom row of the table. 22 of the days took no orders at all, 5 days took exactly one, 9 days took three, and the counts trail off to a single day with 9. Hold on to two of those summaries in particular: the mean is 2.42 orders a day and the variance is 6.28.

A Poisson distribution is the usual first model for counts like these. It has one parameter, a rate written lambda, which is the average number of orders in a day. Fitting the model means working out which values of lambda the 60 days support.

In the Bayesian version that answer is a whole distribution rather than a single number, and it is called the posterior. Before seeing the data you state a prior, a distribution over lambda that says what you are willing to assume in advance. Here it is a Gamma(1, 1), which spreads its weight over small positive rates and barely pulls the answer at all.

For Poisson counts with a Gamma prior, the posterior is another Gamma, and its two numbers come out of simple addition: you add the total orders to the prior shape, and the number of days to the prior rate. So 145 orders over 60 days turns Gamma(1, 1) into Gamma(1 + 145, 1 + 60).

```r
# Update the Gamma(1, 1) prior with the 60 days to get the posterior for the daily rate
set.seed(1)
lambda_draws <- rgamma(1000, shape = 1 + sum(orders), rate = 1 + length(orders))

round(c(mean = mean(lambda_draws), quantile(lambda_draws, c(0.025, 0.975))), 3)
#>  mean  2.5% 97.5%
#> 2.384 2.030 2.785
```

`rgamma()` takes 1000 draws from that posterior, so `lambda_draws` holds 1000 daily rates the data supports. They average 2.384, and 95% of them sit between 2.030 and 2.785.

That interval is about the rate and nothing else. It tells you how tightly 60 days pin lambda down, which is a fair thing to want. It does not tell you whether a Poisson at any rate inside it could have produced this particular run of 60 days.

=== step === concept
## One fake dataset, simulated from a single posterior draw

So take the check one draw at a time. The first of those 1000 rates is 2.263 orders a day. What would 60 days at exactly that rate look like?

`rpois(60, 2.263)` answers it: 60 counts generated from a Poisson at the rate you hand it.

```r
# Simulate one 60-day dataset from a single posterior draw of the rate
round(lambda_draws[1], 3)
#> [1] 2.263

set.seed(2)
one_fake <- rpois(60, lambda_draws[1])
one_fake
#>  [1] 1 3 2 1 5 5 1 4 2 2 2 1 3 1 2 4 6 1 2 0 3 2 4 1 2 2 1 2 5 1 0 1 4 4 2 3 4 1
#> [39] 3 1 6 1 1 1 5 3 6 2 2 4 0 0 3 5 1 4 3 6 3 3

c(zeros_simulated = sum(one_fake == 0), zeros_observed = sum(orders == 0))
#> zeros_simulated  zeros_observed
#>               4              22
```

Those 60 numbers are a fake dataset: a run of days the store never had, generated by the model instead. The standard name for it is a **replicated dataset**, and it has the same shape as `orders`, so any summary you can compute on the real data you can compute on this one.

Count the days with no orders in each. The replicate has 4 of them. The store had 22.

One replicate on its own settles nothing, since a different seed would give a slightly different count. What it does show is the move the whole check is built from: a draw from the posterior fixes a rate, that rate generates a dataset, and the dataset is compared with the real one on some number you care about. Everything that follows is that same move, run many times.

=== step === concept
## A thousand fake datasets, plotted over the real one

Each posterior draw gives one replicate, so 1000 draws give 1000 replicates. `sapply()` runs the simulation over every rate in `lambda_draws` and stacks the results into a matrix of 60 rows, one per day, and 1000 columns, one per replicate. That matrix is conventionally called `yrep`.

```r
# Simulate 1000 replicated 60-day datasets, one per posterior draw
set.seed(3)
yrep <- sapply(lambda_draws, function(l) rpois(60, l))
dim(yrep)
#> [1]   60 1000
```

Now put the real data and the replicates in one picture. For each count from 0 to 9, the grey bars give the share of the 60 real days that took that many orders. Each blue line does the same for one replicated dataset, and 50 of the 1000 are drawn.

```r
# Plot the observed share of days at each count with 50 replicated datasets over it
counts <- 0:9
obs_share <- sapply(counts, function(k) mean(orders == k))

mids <- barplot(obs_share, names.arg = counts, col = "grey85", border = "white",
                ylim = c(0, 0.45),
                main = "Observed orders per day, with 50 simulated datasets over it",
                xlab = "orders in a day", ylab = "share of the 60 days")

for (j in 1:50) {
  rep_share <- sapply(counts, function(k) mean(yrep[, j] == k))
  lines(mids, rep_share, col = rgb(0.15, 0.4, 0.7, 0.35), lwd = 1.5)
}
```

Look at the bar above 0 first. The real data spends 37% of its days there, and the highest of the 50 blue lines reaches 18%. Not one replicate comes close to the bar.

Now look at 1, 2 and 3 orders. Almost every line runs above the bar there instead. The replicates have to put those days somewhere, and that is where they end up.

Out at 7, 8 and 9 orders the bars are back on top, and not one of the 50 lines rises above them. So the real 60 days are quieter than the model at one end, busier at the other, and thinner than the model through the middle. That is the misfit as a picture. The next job is to turn it into a number.

=== step === widget
## The PPC p-value: one number for the whole comparison

A picture with 50 lines in it is hard to argue about, and harder still to put in a report. So pick one number that captures the feature you care about, compute it on the real data and on every replicate, and compare the one against the many. That number is called a **test statistic**, and here the obvious choice is the count of days with no orders.

Write \(T\) for the statistic, \(y\) for the observed data and \(y_{\text{rep}}\) for a replicated dataset. The **posterior predictive p-value** is the share of replicates whose statistic reaches the observed one:

\[ p_{\text{PPC}} = \Pr\left( T(y_{\text{rep}}) \ge T(y) \right) \]

`colSums(yrep == 0)` computes that statistic on all 1000 replicates at once, one per column.

```r
# Count the days with no orders in every replicate and compare with the observed 22
zeros_rep <- colSums(yrep == 0)
zeros_obs <- sum(orders == 0)

hist(zeros_rep, breaks = 20, xlim = c(0, 25), col = "grey85", border = "white",
     main = "Days with no orders in 1000 simulated datasets",
     xlab = "days with no orders, out of 60")
abline(v = zeros_obs, col = "red", lwd = 3)

round(c(simulated_mean = mean(zeros_rep), simulated_max = max(zeros_rep),
        observed = zeros_obs, ppc_p = mean(zeros_rep >= zeros_obs)), 3)
#> simulated_mean  simulated_max       observed          ppc_p
#>          5.788         19.000         22.000          0.000
```

The grey pile is the 1000 replicated counts and the red line is the observed 22. The replicates average 5.788 days with no orders, the most extreme of the 1000 got to 19, and the red line stands clear of the pile with a visible gap before it.

So the PPC p-value is 0.000. That is not a small number rounded down, it is 0 replicates out of 1000.

[KEY INSIGHT]
The PPC p-value is a share of simulated datasets, not a probability about the model. It counts how many of the model's own datasets match or beat the real data on one chosen statistic, and divides by how many you simulated.

A check does not have to fail, and it helps to have seen one pass. The panel below runs the same comparison on the same statistic, with a toggle between two model families. It carries its own 60 days of counts rather than the store's, and its observed statistic is 15 days with no orders, so read the numbers in it as a second worked example.

::widget ppc-overlay {}

Start on the Normal fit. Its replicates average about 9 days with no orders, the observed 15 sits out past almost all of them, and the PPC p-value reads 0.02. Now switch to the Poisson fit. The replicates move up to an average of 12, the observed 15 lands inside the crowd, and the p-value reads 0.22.

What carries over to our 60 days is only where the observed line falls: out in the tail, as ours is, or in among the replicates.

=== step === quiz
## Quick check: what a PPC p-value of 0 says

On the Poisson fit, the check on the days with no orders came back at 0.000, against replicates averaging 5.788. Which reading of that is right?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- The model is correct with probability 0.000, so it can be ruled out on those grounds. ::no
- None of the 1000 replicated datasets reached 22 days with no orders, so this model cannot reproduce that feature of the data. ::ok Exactly. It is a count written as a share: replicates at or beyond the observed statistic, divided by 1000. Here the count was 0, because the most extreme replicate stopped at 19.
- The posterior for the daily rate is wrong, so the interval from 2.030 to 2.785 should be thrown out. ::no
- A PPC p-value near 0.5 would have proved this is the correct model for the data. ::no A PPC p-value is a share of replicates, never a probability that a model is right, and it is not a verdict on the fitted rate either: 2.030 to 2.785 is still the correct answer for the daily rate. A value near 0.5 says only that the replicates surround the observed statistic, which is agreement on that one statistic and nothing broader.

=== step === concept
## Why a Poisson cannot produce 22 days with no orders

The check says the model fails on the days with no orders. It does not say why, and for that you need nothing more than the definition of the distribution.

A Poisson has a single parameter. That one number sets the mean of the counts and their variance at the same time, because in a Poisson the two are equal by construction. It also sets how often a day takes no orders at all:

\[ \Pr(\text{a day with no orders}) = e^{-\lambda} \]

So once the rate is pinned near 2.42 to match the average, the number of days with no orders is settled along with it.

```r
# Compare the observed spread with what a Poisson allows, and the zero days it expects
round(c(mean = mean(orders), variance = var(orders)), 2)
#>     mean variance
#>     2.42     6.28

round(c(expected_zero_days = dpois(0, mean(orders)) * 60,
        observed_zero_days = sum(orders == 0)), 2)
#> expected_zero_days observed_zero_days
#>               5.35              22.00
```

`dpois(0, mean(orders))` is that \(e^{-\lambda}\) evaluated at 2.42, the chance of a day with no orders. Over 60 days a Poisson expects about 5.35 of them, and the store had 22. No rate repairs this: raise lambda and days with no orders get rarer still, lower it and the busy days disappear.

The variance line says the same thing from the other direction. A Poisson at rate 2.42 has variance 2.42, while the orders have variance 6.28, more than twice as wide. Counts more spread out than their own mean are called **overdispersed**, and a pile of extra zeros is one of the usual causes.

=== step === concept
## Refitting with a zero-inflated Poisson

A failed check points at what to change. The Poisson has no way to make extra days with no orders, so the fix is to give the model one.

A **zero-inflated Poisson** has two parameters. Some share \(p\) of days are closed days, on which nothing can happen and the count is 0. The rest behave like an ordinary Poisson at rate lambda, which can still land on 0 by itself. Mixing the two puts extra weight on 0 without pulling the rest of the distribution down with it.

The panel below shows what that does to the fitted shape. Its bars are its own count data rather than the store's, chosen because they carry the same excess of zeros and the same long tail.

::widget count-dist {}

On Poisson the line falls well short of the zero bar and drops off before the tail, which is our problem exactly. Negative binomial adds a dispersion parameter, and its line covers the last few bars while still sitting well under the zero bar. Zero-inflated puts weight on 0 directly, so its line climbs nearest the zero bar, and the zeros are the part our 60 days need accounted for.

Fitting it takes more work than the Poisson did, because two parameters have no conjugate shortcut. A grid does the job. Lay out the candidate pairs, score each pair by the zero-inflated Poisson log likelihood of the 60 days, then sample pairs from the grid in proportion to those scores. The sample is the posterior.

```r
# Score a grid of zero-inflated Poisson parameters and sample the posterior from it
grid <- expand.grid(p = seq(0.01, 0.70, length.out = 70),
                    lambda = seq(0.5, 8, length.out = 70))

zip_loglik <- function(p, lambda, y) {
  n_zero <- sum(y == 0)
  y_pos  <- y[y > 0]
  n_zero * log(p + (1 - p) * dpois(0, lambda)) +
    sum(log(1 - p) + dpois(y_pos, lambda, log = TRUE))
}

grid$loglik <- mapply(zip_loglik, grid$p, grid$lambda, MoreArgs = list(y = orders))
weight <- exp(grid$loglik - max(grid$loglik))

set.seed(6)
zip_draws <- grid[sample(nrow(grid), 1000, replace = TRUE, prob = weight),
                  c("p", "lambda")]

data.frame(
  parameter = c("p (closed days)", "lambda (rate on open days)"),
  mean  = round(c(mean(zip_draws$p), mean(zip_draws$lambda)), 3),
  lower = round(unname(c(quantile(zip_draws$p, 0.025),
                         quantile(zip_draws$lambda, 0.025))), 3),
  upper = round(unname(c(quantile(zip_draws$p, 0.975),
                         quantile(zip_draws$lambda, 0.975))), 3)
)
#>                    parameter  mean lower upper
#> 1            p (closed days) 0.355 0.240 0.470
#> 2 lambda (rate on open days) 3.745 3.109 4.413
```

About 36% of days come out as closed days, and the rate on the rest is 3.745, well above the 2.384 from the Poisson fit. That is what the second parameter buys: the days with no orders are accounted for on their own, so the rate is no longer dragged down to explain them.

Now run the same three steps on the new fit. Draw a pair from `zip_draws`, simulate 60 days from it, and compare on the same statistic.

```r
# Simulate 1000 replicates from the zero-inflated fit and redo the zero-day check
set.seed(7)
yrep2 <- mapply(function(p, l) ifelse(runif(60) < p, 0, rpois(60, l)),
                zip_draws$p, zip_draws$lambda)

zeros_rep2 <- colSums(yrep2 == 0)
round(c(simulated_mean = mean(zeros_rep2), observed = zeros_obs,
        ppc_p = mean(zeros_rep2 >= zeros_obs)), 3)
#> simulated_mean       observed          ppc_p
#>         22.416         22.000          0.546
```

The replicates now average 22.416 days with no orders against the observed 22, and 54.6% of them reach 22 or more. On this statistic the PPC p-value has moved from 0.000 to 0.546, which is what a check looks like when the model can produce the thing you pointed it at.

=== step === concept
## Which statistics to check, and what a passing check does not establish

A test statistic only ever looks where you point it. Point both fits at the mean instead of the days with no orders and they both pass.

```r
# Compare both fits on two test statistics: the mean and the days with no orders
ppc_p <- function(replicated, observed) round(mean(replicated >= observed), 3)

data.frame(
  statistic = c("mean orders per day", "days with no orders"),
  poisson = format(c(ppc_p(colMeans(yrep), mean(orders)),
                     ppc_p(colSums(yrep == 0), zeros_obs)), nsmall = 3),
  zero_inflated = format(c(ppc_p(colMeans(yrep2), mean(orders)),
                           ppc_p(colSums(yrep2 == 0), zeros_obs)), nsmall = 3)
)
#>             statistic poisson zero_inflated
#> 1 mean orders per day   0.450         0.475
#> 2 days with no orders   0.000         0.546
```

Read the first row. On the mean, the broken Poisson scores 0.450 and the refit scores 0.475, and both of those are about as unremarkable as a number can be. The Poisson's 0.450 is no accident: its rate was fitted to reproduce the average, so the average is the one thing it could hardly miss. A statistic the fit already targets tells you very little about whether the model is right.

That gives you the working rule for choosing statistics. Take one that describes location, the mean or the median, and pair it with at least one that describes shape or the tails: the count of zeros, the standard deviation, the maximum, a high quantile. The second row of the table is where the two models finally differ.

It also sets the limit on what a pass is worth. A PPC p-value of 0.546 says the zero-inflated fit produces datasets whose counts of days with no orders look like the store's. It does not say the model is true, and it does not rule out some other model that would do as well.

A pass is agreement with the data on the statistic you chose. A fail is the stronger result of the two, because it names something the model cannot do. Read a value close to 1 as a fail too, since it means nearly every replicate has more days with no orders than the store had.

Once the model is fitted with a package rather than by hand, the whole check collapses to one line. The line below needs the brms package, so run it in your own R session rather than here.

```r-static
# The same check in one line, on a model fitted with the brms package
fit <- brm(orders ~ 1, family = poisson(), data = data.frame(orders = orders))
pp_check(fit, type = "stat", stat = function(y) sum(y == 0))
```

`type = "stat"` is the variant that computes one statistic per replicate and draws the histogram with the observed value marked on it, which is the plot we built by hand.

=== step === tryit
## Your turn: check the busiest day under both models

The busiest of the 60 days took 9 orders, and that is a tail statistic worth checking. `yrep` holds the 1000 Poisson replicates and `yrep2` holds the 1000 zero-inflated ones, both 60 days by 1000 columns.

Reduce each replicate to its largest count, then compute the share of replicates that reach 9 or more, once for each model.

```r
# yrep holds 1000 Poisson replicates and yrep2 holds 1000 zero-inflated ones,
# both 60 rows by 1000 columns; orders holds the real 60 days.
# Reduce each replicate to its busiest day, then take the share of replicates
# reaching the observed maximum of 9.
# Two lines per model. Press Check when you have them.
```
::check {"regex": "apply[(]yrep,\\s*2,\\s*max[)]", "gate": true, "difficulty": "intermediate", "ok": "That gives 0.051 under the Poisson and 0.424 under the zero-inflated fit. A day of 9 orders is roughly a 1 in 20 event for the Poisson replicates and an ordinary one for the refit, whose rate of 3.745 on open days makes a busy day unremarkable.", "no": "`apply(yrep, 2, max)` takes the largest count in each column, giving one busiest day per replicate. Compare that vector with `max(orders)` and wrap it in `mean()` to get the share, then do the same with `yrep2`."}
::solution
```r
# Count the replicates whose busiest day reaches the observed 9
busiest_rep  <- apply(yrep, 2, max)
busiest_rep2 <- apply(yrep2, 2, max)

round(c(poisson = mean(busiest_rep >= max(orders)),
        zero_inflated = mean(busiest_rep2 >= max(orders))), 3)
#>       poisson zero_inflated
#>         0.051         0.424
```

Notice that 0.051 is much weaker evidence against the Poisson than the 0.000 it scored on the days with no orders. One statistic can be borderline while another is decisive, which is the whole reason to check more than one.

=== step === quiz
## Quick check: reading a PPC p-value of 0.45

The Poisson fit scored 0.450 on the mean orders per day, and 0.000 on the days with no orders. What does the 0.450 establish?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- That the Poisson describes the 60 days well, since a value near the middle is what a good model gives. ::no
- That the mean is being missed too, because a model reproducing it would score nearer 1. ::no
- Only that the replicated means surround the observed mean, on a statistic the rate was fitted to match. ::ok Right. That is a genuine agreement, but not an informative one, because the fitted rate was chosen to reproduce the average. The count of days with no orders, on that very same fit, came back 0.000, which is why one statistic is never enough.
- Nothing at all, since a value that close to 0.5 carries no information. ::no A PPC p-value of 0.450 does carry information: the replicated means do surround the observed mean, and a value near 0 or 1 there would have been a real problem. What it cannot do is show the model fits, both because the rate was fitted to the mean and because the same fit scored 0.000 on the days with no orders. Nor is a high value evidence that the mean is wrong.

=== step === concept
## References

- [Posterior predictive assessment of model fitness via realized discrepancies](https://www3.stat.sinica.edu.tw/statistica/oldpdf/A6n41.pdf) - Gelman, Meng and Stern (1996), Statistica Sinica 6, 733-807. The paper that defines the posterior predictive p-value and the test statistics it is computed on.
- [Bayesian Data Analysis, third edition](http://www.stat.columbia.edu/~gelman/book/) - Gelman, Carlin, Stern, Dunson, Vehtari and Rubin (2013), CRC Press. Chapter 6 is the standard treatment of model checking.
- [Visualization in Bayesian workflow](https://doi.org/10.1111/rssa.12378) - Gabry, Simpson, Vehtari, Betancourt and Gelman (2019), Journal of the Royal Statistical Society Series A 182(2), 389-402. The graphical checks behind the bayesplot package.
- [Bayesian Workflow](https://arxiv.org/abs/2011.01808) - Gelman and colleagues (2020), arXiv:2011.01808. Where the check sits in the loop of fitting, checking and revising a model.
- [Graphical posterior predictive checks](https://mc-stan.org/bayesplot/articles/graphical-ppcs.html) - the bayesplot vignette, with the full catalogue of check types and how to read each one.

=== step === complete
## Quick recap

You ran a posterior predictive check by hand on 60 days of orders, watched it fail, changed the model, and watched it pass.

- The check is three steps: draw a parameter from the posterior, simulate a dataset from that draw, compare the simulated datasets with the real one.
- A test statistic reduces the comparison to one number, and the PPC p-value is the share of replicates that reach the observed value. On the days with no orders the Poisson scored 0.000, with replicates averaging 5.788 against the observed 22.
- A failing check names what is missing. A Poisson ties its variance to its mean, so at rate 2.42 it expects 5.35 days with no orders out of 60, not 22.
- The zero-inflated refit added a second parameter, a 0.355 share of closed days, and the same statistic moved to 0.546.
- Pair a location statistic with a shape or tail statistic. The mean scored 0.450 under the broken Poisson, because the rate had been fitted to the mean in the first place.

So when someone hands you a PPC p-value, read it as a share of the model's own simulated datasets: the ones that matched or beat the real data on the statistic you chose, over the number you simulated. Ours read 0 out of 1000 before the refit, and 546 out of 1000 after it.
