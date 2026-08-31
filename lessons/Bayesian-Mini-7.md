---
title: "Posterior predictive checks, in 5 minutes"
slug: "Bayesian-Mini-7"
description: "Simulate 500 datasets from a fitted Bayesian model, plot them over your own data, and turn the comparison into one number that tells you if the fit holds."
keywords: "posterior predictive check, posterior predictive p-value, Bayesian model checking, pp_check brms, overdispersion, negative binomial in R, replicated datasets, model misfit"
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
catalog_blurb: "How to tell whether a fitted Bayesian model can reproduce your own data."
---

=== step === cover
::eyebrow Bayesian Decisions
## Posterior predictive checks, in 5 minutes

Let's say a small online store wrote down its order count every day for sixty days. Most days sit near twelve. Four of them went quiet at two orders, and on one day the store shipped thirty-one.

You fit a Poisson model to those sixty days. It lands on about 12.5 orders a day, with a 95% interval from 11.6 to 13.4, and every number in it is arithmetically exact.

But notice what that answer is about. It tells you how fast the store sells, and it tells you narrowly. It says nothing about whether a model built on that rate could ever produce a thirty-one-order day.

So let's test that directly. Draw a rate from the posterior, deal out sixty days of orders at that rate, do it five hundred times, and hold the real sixty days against the pile.

::widget process-flow {"steps":[{"title":"Draw a rate","sub":"take one daily order rate from the fitted posterior"},{"title":"Simulate 60 days","sub":"deal out a fresh 60 days of orders at that rate"},{"title":"Compare","sub":"hold the real 60 days against the 500 simulated ones"}]}

We are going to run that comparison twice, once on a model that fails it and once on a model that passes. By the end you will be able to turn the picture into a single number, and say out loud what that number does and does not let you claim.

=== step === concept
## The 60 days of orders, and the Poisson model fitted to them

Let's get the store's sixty days on the page first, because every number from here on comes out of this one vector.

```r
# Load the store's 60 days of order counts and summarise them
orders <- c(12, 17, 12, 15, 21,  5, 12, 14,  5,  7,
            22, 13, 10, 12,  8, 31, 15, 15,  7, 21,
             2, 29,  9,  6,  8, 13,  5, 23, 10,  7,
            19, 18, 10,  2, 10,  5, 11, 18,  9,  9,
             9,  8, 27, 10, 15, 14, 17,  4, 14, 20,
            13, 22,  2,  9, 17, 12,  2, 10, 15, 12)

c(days = length(orders), total_orders = sum(orders),
  mean = round(mean(orders), 2), sd = round(sd(orders), 2),
  lowest = min(orders), busiest = max(orders))
#>         days total_orders         mean           sd       lowest      busiest
#>        60.00       749.00        12.48         6.58         2.00        31.00
```

That is sixty days and 749 orders altogether, an average of 12.48 a day. The quietest day took 2 orders and the busiest took 31.

Now let's come to the model. A Poisson model for counts says the store draws each day's order count from a Poisson distribution with one rate, called lambda, which is just the average number of orders in a day. Poisson is the usual choice when the question is "how many times did this happen in a fixed window". And the thing to notice is that it holds exactly one number.

Fitting it the Bayesian way means this. Before seeing the data you hold a vague opinion about lambda, wide enough that it rules almost nothing out. After the sixty days you hold a much narrower one: the rates that could plausibly have produced 749 orders across 60 days, with more weight on the rates that explain them well and almost none on the rest.

That weighted set of surviving rates is the **posterior**, and the vague opinion you started with is the **prior**. When the prior is a Gamma distribution, the update is one line of arithmetic: a Gamma prior with shape a and rate b becomes a Gamma posterior with shape a plus the total orders and rate b plus the number of days.

We start from a deliberately weak Gamma(2, 0.1). It leaves the door open to almost any daily rate a small store could have, and it is flat enough across that range that the sixty days do all the work.

```r
# Update a weak Gamma(2, 0.1) prior with the 60 days to get the posterior for the daily rate
shape_post <- 2 + sum(orders)       # prior shape plus every order in the 60 days
rate_post  <- 0.1 + length(orders)  # prior rate plus the number of days

c(shape = shape_post, rate = rate_post,
  post_mean = round(shape_post / rate_post, 2),
  lower_95  = round(qgamma(0.025, shape_post, rate_post), 2),
  upper_95  = round(qgamma(0.975, shape_post, rate_post), 2))
#>     shape      rate post_mean  lower_95  upper_95
#>    751.00     60.10     12.50     11.62     13.41
```

The posterior settles on 12.50 orders a day, and 95% of its weight lies between 11.62 and 13.41. That is a tight answer to a narrow question.

Rather than carry that distribution around as a formula, let's take five hundred rates out of it. Each draw is one rate that the sixty days leave standing.

```r
# Draw 500 rates from the posterior, one for each simulated stretch we are about to build
set.seed(1)
lambda_draws <- rgamma(500, shape = shape_post, rate = rate_post)

round(head(lambda_draws, 5), 2)
#> [1] 12.20 13.10 13.07 12.68 11.80
```

Every one of those five hundred numbers is a live candidate for the store's true daily rate. But not one of them checks whether the Poisson part was a sensible idea in the first place.

=== step === concept
## What the fitted model says a fresh 60 days should look like

Here is the move that makes the check possible. A fitted model is not only an estimate, it is a recipe for producing data, and you are allowed to run the recipe forward.

It runs in two stages. First pick one rate out of the posterior, because you do not know the rate exactly and pretending you do would make the simulation tidier than the truth. Then deal out sixty days from a Poisson at that rate. Do both and you have a fresh sixty days that the fitted model could genuinely have produced.

The set of all sixty-day stretches you can get this way has a name: the **posterior predictive distribution**. Let's draw one and set it next to the real thing.

```r
# Take the first rate from the posterior and deal out a fresh 60 days at that rate
one_lambda <- lambda_draws[1]

set.seed(11)
sim_orders <- rpois(60, one_lambda)

round(one_lambda, 2)
#> [1] 12.2

rbind(simulated = sim_orders, real = orders)[, 1:12]
#>           [,1] [,2] [,3] [,4] [,5] [,6] [,7] [,8] [,9] [,10] [,11] [,12]
#> simulated   10    4    7    8   16   14   12    8   13    10    11     8
#> real        12   17   12   15   21    5   12   14    5     7    22    13

c(sim_lowest = min(sim_orders), sim_busiest = max(sim_orders),
  real_lowest = min(orders), real_busiest = max(orders))
#>   sim_lowest  sim_busiest  real_lowest real_busiest
#>            4           21            2           31
```

The first twelve days of each row look like the same kind of thing. Both wander up and down from one day to the next, both have a quiet day and a busy one, and if you saw either row on its own you would call it an ordinary run of trading days.

The two summaries underneath are where they differ. The simulated stretch runs from 4 orders up to 21. The real one runs from 2 up to 31, wider at both ends.

One simulated stretch proves nothing, though. It could easily be a quiet draw. To say anything at all, you need the whole range of stretches the model can produce.

=== step === concept
## Five hundred simulated datasets, plotted over the real orders

So let's make five hundred of them, one per posterior draw, each a full sixty days.

```r
# Simulate 500 replicated 60-day stretches, one per posterior draw
set.seed(2)
yrep_pois <- t(sapply(lambda_draws, function(lam) rpois(60, lam)))

dim(yrep_pois)
#> [1] 500  60
```

That is five hundred rows and sixty columns. Each row is a complete alternative history of the store, and each one has a standard name: a **replicate**, or a replicated dataset.

Now let's put them on one picture. For each row, count how many of its sixty days had 0 orders, how many had 1, how many had 2, and so on up to 35, then join those counts into a line. Do that for fifty of the replicates in grey, and for the store's real orders in red.

```r
# Plot the count profile of 50 replicated stretches against the real 60 days
count_profile <- function(y) sapply(0:35, function(k) sum(y == k))

counts       <- 0:35
rep_profiles <- sapply(1:50, function(i) count_profile(yrep_pois[i, ]))

plot(counts, count_profile(orders), type = "n", ylim = c(0, max(rep_profiles)),
     main = "50 simulated stretches in grey, the real 60 days in red",
     xlab = "Orders in a day", ylab = "Number of days out of 60")

for (i in 1:50) lines(counts, rep_profiles[, i], col = "grey80")
lines(counts, count_profile(orders), col = "firebrick", lwd = 3)
```

Read the grey first. All fifty curves climb into the same hump between about 8 and 17 orders a day, and all fifty are pinned to the floor below 4 and above 26. The tallest of them stacks fourteen of its sixty days onto one count value.

Now read the red. It peaks at 6 days, well under the grey hump, and it reaches out to both ends where the grey will not go. Four of the store's days took only 2 orders, quieter than anything grey produces. Three days took 27, 29 and 31, out where every grey line is flat at zero.

That is a posterior predictive check, and you have already read the verdict off it. Whatever the store's orders are doing, the fitted Poisson model cannot do it. The real sixty days are flatter and wider than any sixty days the model produces.

[NOTE]
Nothing about the fit had to be broken to get this picture. The posterior for lambda is fine, the arithmetic is exact, and the interval of 11.62 to 13.41 is honest. What a check like this tests is the likelihood, the assumption that daily counts are Poisson, and that is a separate question from the estimate.

=== step === quiz
## Quick check: what each simulated dataset represents

Each of the 500 rows in `yrep_pois` holds 60 numbers. What is one of those rows?

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- The model forecast of what the store will sell over the next 60 days. ::no
- A smoothed version of the real orders, with the noise taken out. ::no
- A whole fresh 60 days of orders that the fitted model could have produced, using one rate drawn from the posterior. ::ok Exactly. It is a complete alternative dataset, the same size and shape as the real one, and that is what makes the two comparable.
- The average of the real 60 days, repeated 60 times. ::no A replicate is not a forecast, not a smoothing, and not a summary. It is a full dataset the same size as yours, dealt out by the fitted model itself, and it exists so you can ask whether your real data looks like it belongs in the same pile.

=== step === concept
## The posterior predictive p-value, and how to compute it

The picture is convincing, but somebody is going to ask how far out that red line really was, and a picture cannot answer that. You need a number.

Here is how you get one. Pick a statistic that matters to you, compute it on the real data, compute it on every one of the five hundred replicates, and report the share of replicates that reach or beat the real value. That share is the **posterior predictive p-value**.

$$p = \text{share of replicates whose } T(y_{\text{rep}}) \ge T(y)$$

In that line \( y \) is the store's real sixty days, \( y_{\text{rep}} \) is one of the five hundred simulated ones, and \( T \) is whatever statistic you decided to measure.

Let's run it on two statistics: the mean and the standard deviation.

```r
# Compute posterior predictive p-values for the mean and for the spread
rep_mean <- rowMeans(yrep_pois)
rep_sd   <- apply(yrep_pois, 1, sd)

c(obs_mean = round(mean(orders), 2),
  p_mean   = mean(rep_mean >= mean(orders)),
  obs_sd   = round(sd(orders), 2),
  p_sd     = mean(rep_sd >= sd(orders)))
#> obs_mean   p_mean   obs_sd     p_sd
#>   12.480    0.508    6.580    0.000

round(range(rep_sd), 2)
#> [1] 2.36 4.53
```

Take the mean first. The real average is 12.48 orders a day, and 254 of the 500 replicates averaged that much or more, which is a p-value of 0.508. The model reproduces the store's average traffic about as well as it possibly could.

That one was close to guaranteed, though. The posterior for the rate was built out of this data's average, so the replicates were always going to average about the same. A statistic the model was fitted to will nearly always pass, which makes it a weak thing to check on its own.

Now the spread, and this is the number to stop on. The real standard deviation is 6.58 orders. Not one replicate out of five hundred got there. Their standard deviations run from 2.36 to 4.53, so the closest any of them came was still two whole orders short.

That is what a failed check looks like as a single number: zero out of five hundred.

Both p-values came out of the same fitted model, on the same sixty days, in the same run. They disagree because a posterior predictive p-value is never about the model as a whole. It is about the one feature you chose to measure.

[KEY INSIGHT]
Read it the way you would read a percentile. A p-value in the middle of the range says your real value is the sort of value this model produces all the time, so the model reproduces that feature. A p-value near 0 or near 1 says your real value is one the model hardly ever produces, and sometimes never. There is no threshold to clear here and no null hypothesis to reject. The only question is whether your data would look out of place among the datasets your own model makes.

=== step === concept
## Overdispersion: why a Poisson cannot produce spread this large

A p-value of zero is a strong result, so it is worth knowing exactly why it came out that way. And the reason is the single number inside a Poisson.

A Poisson carries a single parameter, and that parameter fixes the average and the spread together. Write \( Y \) for one day's order count and \( \mu \) for its average, which is the same lambda from before, and the tie is this:

\( \mathrm{Var}(Y) = \mu \)

Turn the rate up and the variance rises with it, always to the same value. There is no second dial. Once the model commits to an average of 12.5 orders a day, it has also committed to a variance of 12.5, whether that suits the store or not.

Compare that with the store's own numbers.

```r
# Compare the spread of the real orders with the mean a Poisson ties it to
c(mean = round(mean(orders), 2),
  variance = round(var(orders), 2),
  ratio = round(var(orders) / mean(orders), 2))
#>     mean variance    ratio
#>    12.48    43.27     3.47

c(avg_replicate_sd = round(mean(rep_sd), 2),
  sqrt_of_the_rate = round(sqrt(12.5), 2))
#> avg_replicate_sd sqrt_of_the_rate
#>             3.53             3.54
```

The store's variance is 43.27 against a mean of 12.48. That is three and a half times the variance a Poisson with that mean is allowed to have.

The second pair of numbers says the same thing from the replicates' side. Their standard deviations averaged 3.53, and the square root of 12.5 is 3.54. They were doing exactly what the formula demands, which is why none of them could reach 6.58.

Counts with more spread than their mean allows are called **overdispersed**, and overdispersion is one of the most common ways a count model goes wrong. Real days cluster. A promotion lands, a supplier is late, a weekend runs hot, and the busy days arrive in bunches instead of at a steady rate.

So the check did more than tell you the model failed. It told you which way it failed, and now the fix follows from the diagnosis instead of from guesswork.

=== step === concept
## How to refit with a negative binomial and rerun the same check

The data is not the problem, so leave the sixty days alone. What has to change is the likelihood, the assumption about how a single day's count gets generated.

A negative binomial is the natural replacement, because it carries a second parameter for exactly the thing a Poisson cannot express:

\( \mathrm{Var}(Y) = \mu + \mu^2 / k \)

That second parameter, `k`, is called the size. A small `k` piles a lot of extra spread on top of the mean, a large `k` adds almost none, and as `k` grows the whole thing settles back into a Poisson. So the negative binomial contains the Poisson as a special case, and can also go wider when the data demands it.

Fitting it needs no sampler at all when there are only two parameters. Lay down a grid of `mu` and `k` values, score every pair by how well it explains the sixty days, turn those scores into weights under a flat prior, and draw five hundred pairs in proportion to their weight. What comes out is a posterior, computed by brute force.

```r
# Score a grid of mean-and-size pairs by how well each one explains the 60 days
mu_grid   <- seq(8, 20, by = 0.1)
size_grid <- seq(0.5, 12, by = 0.1)
grid      <- expand.grid(mu = mu_grid, size = size_grid)

loglik <- mapply(function(m, k) sum(dnbinom(orders, mu = m, size = k, log = TRUE)),
                 grid$mu, grid$size)

weight <- exp(loglik - max(loglik))   # turn the log scores into positive weights
weight <- weight / sum(weight)        # and make them sum to 1

set.seed(3)
picked  <- sample(nrow(grid), 500, replace = TRUE, prob = weight)
nb_post <- grid[picked, ]

c(pairs_scored = nrow(grid),
  mu_mean      = round(mean(nb_post$mu), 2),
  size_mean    = round(mean(nb_post$size), 2))
#> pairs_scored      mu_mean    size_mean
#>     14036.00        12.62         5.26

c(implied_var  = round(mean(nb_post$mu) + mean(nb_post$mu)^2 / mean(nb_post$size), 2),
  observed_var = round(var(orders), 2))
#>  implied_var observed_var
#>        42.92        43.27
```

That is fourteen thousand pairs scored, and the five hundred that survived average a mean of 12.62 orders with a size of 5.26. The mean barely moved, which is the point. The store still sells about 12.5 a day, and what the second parameter adds is room to be more variable about it.

Put those two numbers through the variance formula above and you get 42.92, against the 43.27 the store actually had. The extra parameter landed exactly where the surplus spread was.

Now let's rerun the identical check on the new model, with the old numbers printed beside the new ones so nothing has to be taken on trust.

```r
# Simulate 500 negative binomial replicates and rerun both checks on both models
set.seed(4)
yrep_nb <- t(mapply(function(m, k) rnbinom(60, mu = m, size = k),
                    nb_post$mu, nb_post$size))

c(pois_p_sd  = mean(apply(yrep_pois, 1, sd)  >= sd(orders)),
  nb_p_sd    = mean(apply(yrep_nb,   1, sd)  >= sd(orders)),
  pois_p_max = mean(apply(yrep_pois, 1, max) >= max(orders)),
  nb_p_max   = mean(apply(yrep_nb,   1, max) >= max(orders)))
#>  pois_p_sd    nb_p_sd pois_p_max   nb_p_max
#>      0.000      0.494      0.000      0.574
```

The spread check moves from 0.000 to 0.494. Under the negative binomial, roughly half the replicates are more variable than the store and half are less, which is as central as a value can sit.

The busiest-day check moves from 0.000 to 0.574 in the same run. Not one Poisson replicate ever reached a 31-order day, and about 57% of the negative binomial replicates do.

And that closes the loop. A check failed, the failure pointed at the missing piece, a wider likelihood supplied it, and the same check came back clean.

=== step === widget
## How to read a check that passes and one that fails

Reading these plots gets much easier once you have watched one flip. So here is a second scene, away from the store, with different data and a different statistic.

We have sixty days of a low-volume product, mostly zeros, ones and twos, and 15 of those days sold nothing at all. The statistic is the number of zero days, and the question is whether a fitted model can produce a stretch that has 15 of them.

Move the toggle and watch where the red line sits against the bars.

::widget ppc-overlay {}

Under the Normal fit the replicates almost never manage 15 zero days, so the observed line lands far out in the tail and the p-value collapses towards zero. Switch to the Poisson fit and the same observed line moves in among the bars, with the p-value climbing back into the mid-range.

Nothing about the data changed between those two views. Only the likelihood did, and that is the part worth carrying away.

A likelihood is never right or wrong on its own. A Poisson is the wrong model for the store's spread and the right model for these zeros, and the only way to know which case you are in is to check it against the data in front of you.

=== step === concept
## The same check in one line, once you fit with brms

Building the replicates by hand is how you see what the check is actually doing. It is not how you would do it on a real project. There you would fit with `brms`, which calls Stan underneath and gives you both checks as one-liners.

`brms` needs a compiler and a Stan backend, so run this one in your own R session rather than here.

```r-static
# Run this locally: the same two checks in one line each, using brms
library(brms)

store <- data.frame(orders = orders)

fit <- brm(orders ~ 1, data = store, family = poisson(),
           chains = 4, iter = 2000, seed = 1, silent = 2)

pp_check(fit, type = "dens_overlay", ndraws = 50)   # the overlay, drawn for you
pp_check(fit, type = "stat", stat = "sd")           # the spread check, as a histogram
pp_check(fit, type = "bars", ndraws = 500)          # the count version of the overlay
pp_check(fit, type = "rootogram")                   # counts again, on a square-root scale
```

The first line draws the overlay you plotted by hand, with a smooth density in place of the count profile. The second draws the spread check: a histogram of the replicate standard deviations with the observed one marked, and the p-value is the share of that histogram lying at or beyond the mark.

The last two are the versions built for counts. `bars` compares observed and predicted counts value by value, and `rootogram` puts them on a square-root scale so small discrepancies at the high counts stay visible.

[TIP]
Always check at least one statistic about the centre and one about the edges. A model can land the mean perfectly while missing every busy day, which is exactly what happened to the store: 0.508 on the mean and 0.000 on the spread, out of a single fit.

=== step === quiz
## Quick check: what a pass and a fail each let you claim

The store's Poisson model failed the spread check at 0.000, and after the refit the negative binomial passed it at 0.494. So what does that let you say?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The failure means the Gamma(2, 0.1) prior was too weak, and a firmer prior would have fixed it. ::no
- The failure is decisive about the spread and points at what was missing, while the pass is evidence the negative binomial reproduces the spread, not proof that it is the right model. ::ok Yes. A fail is a positive finding about one feature. A pass is only an absence of evidence against that feature, and plenty of wrong models pass a check on a statistic they happen to get right.
- The pass means the negative binomial is the correct model for the store. ::no
- The failure means the four quiet days and the 31-order day should be dropped before refitting. ::no A check only ever speaks about the statistic you fed it. A failure is strong, and it usually tells you which part of the model to change, which here was the likelihood rather than the prior or the data. A pass is much weaker: it says your data would not look out of place among the datasets this model makes, and that is the whole claim.

=== step === tryit
## Your turn: check the statistic your decision depends on

The store hires a second packer for any day with 20 or more orders, so what it actually needs from a model is the number of busy days, not the average. That happened 9 times in the real 60 days.

Count the busy days in the real orders, count them in every row of `yrep_pois` and `yrep_nb`, and report the share of replicates that reach the real count under each model.

```r
# yrep_pois and yrep_nb each hold 500 replicated 60-day stretches, one per row.
# A busy day is any day with 20 or more orders, and there were 9 of them in orders.
# Count the busy days in each row of both matrices, then report the share of rows
# that reach 9 or more.
# Press Check when you have it.
```
::check {"regex": "yrep_pois\\s*>=\\s*20", "gate": true, "difficulty": "intermediate", "ok": "That is it. The Poisson gives 0.000, with an average of about 2 busy days per stretch, and the negative binomial gives 0.498 with an average of 8.74. The model that failed the check would have staffed the store for two busy days when nine were coming.", "no": "Compare each matrix against the threshold and count along the rows with rowSums(yrep_pois >= 20). Then take mean() of that vector against the real count of 9, and repeat both lines for yrep_nb."}
::solution
```r
# Count the days with 20 or more orders in the real data and in every replicate
busy_obs  <- sum(orders >= 20)
busy_pois <- rowSums(yrep_pois >= 20)
busy_nb   <- rowSums(yrep_nb   >= 20)

c(busy_obs     = busy_obs,
  pois_average = round(mean(busy_pois), 2),
  p_pois       = mean(busy_pois >= busy_obs),
  nb_average   = round(mean(busy_nb), 2),
  p_nb         = mean(busy_nb >= busy_obs))
#>     busy_obs pois_average       p_pois   nb_average         p_nb
#>        9.000        1.970        0.000        8.740        0.498
```

The Poisson model expects about 2 busy days in a sixty-day stretch and never once produces 9 of them. The negative binomial expects 8.74 and lands the real count dead centre at 0.498.

Notice this is the statistic the store's staffing decision actually rides on, and it was never the mean. Pick the statistic your decision depends on, and check that one.

=== step === concept
## References

- [Posterior predictive assessment of model fitness via realized discrepancies](https://www3.stat.sinica.edu.tw/statistica/j6n4/j6n41/j6n41.htm) - Gelman, Meng and Stern (1996), Statistica Sinica 6, 733-807. The paper that defines the posterior predictive p-value and works through what it does and does not measure.
- [Bayesian Data Analysis, third edition](http://www.stat.columbia.edu/~gelman/book/) - Gelman, Carlin, Stern, Dunson, Vehtari and Rubin (2013). Chapter 6, Model checking, is the standard textbook treatment of replicated data and test quantities.
- [Visualization in Bayesian workflow](https://doi.org/10.1111/rssa.12378) - Gabry, Simpson, Vehtari, Betancourt and Gelman (2019), Journal of the Royal Statistical Society A 182(2), 389-402. The reasoning behind each of the standard check plots.
- [Bayesian workflow](https://arxiv.org/abs/2011.01808) - Gelman and colleagues (2020). Where a predictive check sits among the other things you do to a model, and what to do when one fails.
- [Graphical posterior predictive checks](https://mc-stan.org/bayesplot/articles/graphical-ppcs.html) - the bayesplot vignette, with every plot type `pp_check()` can produce and a note on when to reach for each.

=== step === complete
## Quick recap

You took a fitted model that looked perfectly healthy, simulated five hundred datasets from it, and found out in one plot that it could not produce the data it had just been fitted to.

The loop, in five lines:

1. Draw a rate from the posterior, then simulate a full dataset of the same size at that rate.
2. Repeat until you have a few hundred replicates.
3. Plot them under your real data, and pick a statistic that matters to your decision.
4. Compute that statistic on every replicate, then report the share that reach or beat the real value.
5. If that share sits near 0 or near 1, the model cannot produce that feature. Somewhere in the middle, and it can.

For the store, the mean came back at 0.508 and the spread at 0.000, from the same Poisson fit. The variance was 43.27 against a mean of 12.48, and a Poisson ties those two together, so no rate could ever have reached it. Swapping in a negative binomial moved the spread check to 0.494 and the busiest-day check to 0.574.

So when somebody asks whether your model fits:

"I simulated 500 datasets from it and compared them to mine on the statistic we care about. Nine of my days were busy days, and the model produces nine or more about half the time. It reproduces that feature."

You now have a check you can run on any fitted Bayesian model, in any field, and a way to say what came back. Congratulations, and have a great day!
