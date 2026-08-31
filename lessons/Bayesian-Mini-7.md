---
title: "Posterior predictive checks, in 5 minutes"
slug: "Bayesian-Mini-7"
description: "Make a fitted Bayesian model prove itself: simulate thousands of fake datasets from its posterior, lay them over your real data, read the misfit in one number."
keywords: "posterior predictive check, posterior predictive p-value, Bayesian model checking, replicated datasets, model misfit, pp_check brms, Bayesian workflow in R"
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
catalog_blurb: "Catch a misfitting Bayesian model by simulating data from it."
---

=== step === cover
::eyebrow Bayesian Decisions
## Posterior predictive checks, in 5 minutes

You run a one product online shop selling refurbished espresso machines, and you have the last 60 days of order counts written down. They add up to 100 orders. On 15 of those days nobody bought anything, a typical day brings 1 or 2, and the best day of the run brought 5.

So you fit the standard Bayesian model to those counts, a Normal one, and ask it what an average day looks like. It says 1.67 orders, with a 95% interval running from 1.30 to 2.02. That looks perfectly believable. It matches the arithmetic mean, the interval is neither absurdly wide nor suspiciously tight, and no warning came with it.

But that only tells you about the model's own parameter. It never says whether this is the right model for a shop, and no posterior summary ever can. It reports what the model believes after seeing the data, and it would hand you an answer just as tidy if it were badly wrong about how a day of orders comes about.

So how do we ask the other question? We turn the model around. A fitted model is not just a set of estimates, it is a recipe for producing data, so let's make it produce some. We will simulate 60 days of orders from it, a couple of thousand times over, and hold those invented runs against the 60 days the shop actually had.

::widget process-flow {"steps":[{"title":"Draw","sub":"take one parameter set from the posterior"},{"title":"Simulate","sub":"make 60 fake days of orders from it"},{"title":"Compare","sub":"lay the fake days over the real 60"}]}

That is the whole flow. At the end of those three moves you have a picture and a single number, and both of them say whether this model could have produced these 60 days.

=== step === concept
## 60 days of orders, and the model fitted to them

Here are the 60 days, typed in as a plain vector so everything from here on runs on real numbers. Press Run.

```r
# Type in the 60 daily order counts and describe what the shop actually sold
sales <- c(0, 2, 1, 0, 3, 1, 1, 3, 2, 4,
           1, 0, 0, 2, 1, 3, 5, 1, 0, 2,
           3, 1, 0, 1, 2, 0, 4, 1, 4, 0,
           2, 3, 1, 0, 0, 1, 2, 4, 3, 1,
           0, 1, 5, 2, 1, 0, 3, 1, 4, 2,
           1, 0, 2, 3, 0, 4, 1, 2, 3, 0)

table(orders_in_a_day = sales)
#> orders_in_a_day
#>  0  1  2  3  4  5
#> 15 17 11  9  6  2

c(days = length(sales), total_orders = sum(sales),
  no_sale_days = sum(sales == 0), best_day = max(sales))
#>         days total_orders no_sale_days     best_day
#>           60          100           15            5

round(c(mean = mean(sales), sd = sd(sales)), 2)
#> mean   sd
#> 1.67 1.43
```

That table is the shape of the trading, day by day. 15 days took no order at all, 17 took exactly one, and it falls away steadily to the 2 days that took five. So a quarter of the shop's days were blank.

A model of that has to say two things: what shape a single day of orders takes, and which values of that shape's parameters are still plausible now that the 60 days have been seen. The usual first choice is a Normal:

\[ y_t \sim \text{Normal}(\mu, \sigma) \]

Read \( y_t \) as the number of orders on day \( t \), \( \mu \) as the average day, and \( \sigma \) as how far days scatter around that average.

The second half of the job is the posterior, which is the set of parameter values the data leaves standing, with more weight on the ones that explain the 60 days better. Getting one needs a prior, the weight you were putting on those parameter values before any of the 60 days came in. Here that prior is flat, so no value starts out favoured and the 60 days do all the work. With a flat prior the Normal model's posterior has a formula, so we can draw from it directly instead of running a sampler to approximate it.

```r
# Draw 2,000 plausible parameter pairs from the Normal model's posterior
set.seed(7)
n_days       <- length(sales)
sigma2_draws <- (n_days - 1) * var(sales) / rchisq(2000, n_days - 1)
mu_draws     <- rnorm(2000, mean(sales), sqrt(sigma2_draws / n_days))

round(mean(mu_draws), 3)
#> [1] 1.671

round(quantile(mu_draws, c(0.025, 0.975)), 3)
#>  2.5% 97.5%
#> 1.299 2.020
```

`sigma2_draws` holds 2,000 plausible values for the day to day variance, and `mu_draws` holds one plausible average day beside each of them. Together they give 1.671 orders on the average day and a 95% interval of 1.299 to 2.020. Nothing about that looks wrong, and that is exactly the problem.

Now notice what that code left sitting in memory. The fitted model is not one pair of numbers. It is 2,000 pairs, and every single pair is a complete description of how a day of orders gets produced.

=== step === concept
## Simulating 60 fake days from one posterior draw

Let's take the first of those 2,000 pairs and read it as instructions rather than as an estimate. It says the average day is 1.94 orders and days scatter around that with a standard deviation of 1.19. A day of orders is then one draw from a Normal with that mean and that spread, which makes 60 days 60 draws.

```r
# Simulate one fake run of 60 days from a single posterior draw
set.seed(20)
mu_one    <- mu_draws[1]
sigma_one <- sqrt(sigma2_draws[1])

round(c(mu = mu_one, sigma = sigma_one), 2)
#>    mu sigma
#>  1.94  1.19

raw_days  <- rnorm(60, mu_one, sigma_one)
fake_days <- round(raw_days)

round(head(raw_days, 10), 2)
#>  [1]  3.33  1.24  4.07  0.35  1.41  2.62 -1.50  0.91  1.39  1.28

head(fake_days, 10)
#>  [1]  3  1  4  0  1  3 -2  1  1  1

head(sales, 10)
#>  [1] 0 2 1 0 3 1 1 3 2 4
```

`raw_days` is what the Normal actually produces: 3.33 orders on one day, 1.24 on the next. A shop cannot take 3.33 orders, so every simulated day gets rounded to the nearest whole number before we compare it with anything.

That rounding is not cosmetic. It is what makes a day with no sales mean the same thing in a fake dataset as it means in the real one, and it is what lets the same counting code run on both without a single change.

Now look at the seventh day. The Normal produced -1.50 orders, which rounds to -2.

```r
# Count the impossible days and the blank days in this one fake run
c(days_below_zero   = sum(fake_days < 0),
  no_sale_days_fake = sum(fake_days == 0),
  no_sale_days_real = sum(sales == 0))
#>   days_below_zero no_sale_days_fake no_sale_days_real
#>                 2                 5                15
```

Two of the 60 invented days came out below zero. A day of -2 orders did not happen and could not happen, and yet nothing has gone wrong with the arithmetic. A Normal puts probability on every number on the line, so a Normal model of daily orders has to take negative days as part of the bargain. That is a fact about the model, not about the shop.

The other gap in that output is the blank days, 5 in the fake run against 15 in the real one. One fake dataset is a single throw, though, so both of those numbers could be luck. To say anything about the model we need a lot more of them.

=== step === concept
## 2,000 fake datasets, drawn over the real one

Run the same simulation once for every posterior draw and keep the results in a matrix.

```r
# Simulate 2,000 fake 60 day runs, one per posterior draw, as rows of a matrix
set.seed(11)
yrep_normal <- matrix(0, nrow = 2000, ncol = 60)
for (i in 1:2000) {
  yrep_normal[i, ] <- round(rnorm(60, mu_draws[i], sqrt(sigma2_draws[i])))
}

dim(yrep_normal)
#> [1] 2000   60

yrep_normal[1, 1:12]
#>  [1] 1 2 0 0 3 1 4 3 2 1 1 2
```

Row 1 came from the first parameter pair, row 2 from the second, and so on down 2,000 rows. Row 1 uses a fresh set of draws, so it does not match the run we simulated by hand a moment ago, it is just another run that same pair could produce. Nothing in this matrix forecasts any particular day. Each row is one complete alternative version of the same 60 days.

These simulated datasets have a standard name. They are called **replicated datasets**, usually written \( y^{rep} \). A column of the matrix means nothing on its own, the row is the unit.

To compare 2,000 of them against the 1 real dataset, we put them all on the same axes. For each dataset, count how many of its 60 days took 0 orders, how many took 1 and so on, then join those counts into a line.

```r
# Draw the order profile of 200 fake datasets with the real 60 days on top
order_levels <- -4:8
profile <- function(day_counts) as.numeric(table(factor(day_counts, levels = order_levels)))

real_profile <- profile(sales)
rep_profiles <- t(apply(yrep_normal[1:200, ], 1, profile))

plot(order_levels, real_profile, type = "n",
     ylim = c(0, max(rep_profiles, real_profile)),
     xlab = "Orders in a day", ylab = "Days out of 60",
     main = "200 datasets from the Normal model, and the real one in red")
for (i in 1:200) {
  lines(order_levels, rep_profiles[i, ], col = "grey80")
}
lines(order_levels, real_profile, col = "red", lwd = 3)
```

Each pale line is one invented 60 day run, and the red line is the shop. Two differences show up straight away.

The first one is on the left. The pale lines carry weight at -1 and -2, and a few stretch out to -3, because the model keeps producing days a shop cannot have. The red line is flat there and always will be.

The second is at zero, and that is the one that matters commercially. The red line sits at 15 there, well above where the pale crowd bunches, and only a handful of the 200 fake runs climb that high. So the shop went quiet a good deal more often than the model's own datasets ever do. The model cannot make enough empty days, and now we have to put a size on how short it falls.

=== step === quiz
## Quick check: what is in one row of the replicate matrix?

`yrep_normal` has 2,000 rows and 60 columns. What is one row of it?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- The model's prediction for one particular day, with the 60 columns holding 60 separate guesses at that day. ::no
- One complete alternative run of the 60 days: 60 simulated order counts, all made from a single parameter pair drawn out of the posterior. ::ok Yes. A row is a dataset, not a prediction and not a parameter. We ask the model what 60 days of trading would look like at one plausible parameter pair, and 60 numbers come back.
- One parameter pair from the posterior, written out across 60 columns. ::no
- The real 60 days resampled, drawn again with replacement to make a new run. ::no A row is a whole dataset. The parameter pair comes out of the posterior first, then the model uses that pair to simulate 60 fresh days, and those 60 numbers become the row. No observed value is reused anywhere, and nothing here predicts a single day.

=== step === concept
## From the overlay to one number: the posterior predictive p-value

A picture is hard to report and hard to act on. So let's turn it into a number: pick the one feature of the data you care about, and measure that feature on both sides of the comparison.

For this shop that feature is the blank days. 15 of the 60 trading days took no order, and any model that is going to drive stock levels or staffing has to be able to produce a quarter of its days empty. A number computed from a dataset like that is called a **test statistic**, written \( T \). Here \( T \) is the count of days with 0 orders, and we compute it the same way on the real data and on every replicated dataset.

```r
# Count the blank days in the real data and in all 2,000 replicated datasets
T_obs <- sum(sales == 0)
T_rep <- apply(yrep_normal, 1, function(day_counts) sum(day_counts == 0))

hist(T_rep, breaks = seq(-0.5, 23.5, by = 1), col = "grey85", border = "white",
     main = "Blank days in 2,000 datasets from the Normal model",
     xlab = "Days out of 60 with no order")
abline(v = T_obs, col = "red", lwd = 3)
```

Each grey bar counts how many of the 2,000 replicated datasets came out with that many blank days. The pile sits over 8 and 9, and it thins out fast as you move right. The red line is the shop's 15, out where the model rarely reaches.

Now measure that distance instead of eyeballing it.

```r
# How many blank days does the model typically make, and how often does it reach 15?
round(mean(T_rep), 2)
#> [1] 8.52

mean(T_rep >= T_obs)
#> [1] 0.0305
```

That second line is the whole check squeezed into one number, and it has a name: the **posterior predictive p-value**.

\[ p = \Pr\left( T(y^{rep}) \ge T(y) \mid y \right) \]

Read the bar as "given the 60 days you actually have". In words, it is the share of replicated datasets whose test statistic matches or beats the observed one. Here 61 of the 2,000 invented shops managed 15 or more blank days and 1,939 did not, which is the 0.0305 R printed.

Read that number as a position, never as a verdict.

- A value in the middle of the range means the observed statistic sits inside the crowd of replicates, and the model reproduces that feature of the data.
- A value near 0 means almost no replicate got as high as the real data, so the model cannot reach the feature.
- A value near 1 means almost every replicate went higher, which is the same failure viewed from the other side.

[WARNING]
A posterior predictive p-value is not a hypothesis test, and there is no 0.05 line to clear. Nothing is rejected at a level and no null hypothesis is in play. The number says how far into the tail of its own predictions the model had to reach to match your data, and 0.03 says it had to reach a long way.

=== step === concept
## Why the Normal model could not produce a day with no sales

A failed check is worth more than a passed one, because the statistic that failed points straight at what the model is missing. So let's ask where the two sets of numbers actually live.

```r
# Compare the range the shop can produce with the range the model produces
range(sales)
#> [1] 0 5

range(yrep_normal)
#> [1] -5  8

below_zero_days <- apply(yrep_normal, 1, function(day_counts) sum(day_counts < 0))
round(mean(below_zero_days), 2)
#> [1] 4.06
```

The shop's 60 days run from 0 to 5. The model's 120,000 simulated days run from -5 to 8, and on average 4.06 days in every invented run come out below zero.

Orders have two properties the Normal simply does not have. They are whole numbers, and they have a hard floor at zero. The Normal is continuous and unbounded, so it spends probability on fractional days and on impossible negative days, and whatever it spends out there is not available at zero. That is the arithmetic behind the 8.52. The model gave away the weight it needed for blank days.

So the check did two jobs at once. It said the model does not fit, and it named the feature the model cannot reach. That is enough to tell us what the replacement should look like.

=== step === concept
## Fitting a Poisson model and running the identical check

The fix follows straight from the diagnosis. We want a distribution that only ever produces whole numbers and never goes below zero, and that is exactly what the Poisson does:

\[ y_t \sim \text{Poisson}(\lambda) \]

Here \( \lambda \) is the average number of orders in a day. The Poisson has no second parameter at all, because its variance is equal to its mean.

Give \( \lambda \) a Gamma(1, 1) prior, which is a mild way of saying the daily rate sits somewhere in the low single digits. The Gamma is conjugate to the Poisson, so the posterior is another Gamma and getting it is just arithmetic: add the total orders to the shape and the number of days to the rate. So 100 orders across 60 days turns Gamma(1, 1) into Gamma(101, 61).

```r
# Draw 2,000 rates from the Poisson model's Gamma posterior
set.seed(13)
lambda_draws <- rgamma(2000, shape = 1 + sum(sales), rate = 1 + length(sales))

round(mean(lambda_draws), 3)
#> [1] 1.657

round(quantile(lambda_draws, c(0.025, 0.975)), 3)
#>  2.5% 97.5%
#> 1.352 1.996
```

That is 1.657 orders on the average day, with a 95% interval of 1.352 to 1.996. It is near enough the answer the Normal model gave, and nothing in this summary would have told you which of the two models to keep. That is the whole reason for doing the check.

Now run the same check, with nothing changed except the matrix it reads.

```r
# Simulate 2,000 datasets from the Poisson fit and rerun the same blank day check
yrep_pois <- matrix(0, nrow = 2000, ncol = 60)
for (i in 1:2000) {
  yrep_pois[i, ] <- rpois(60, lambda_draws[i])
}
T_rep_pois <- apply(yrep_pois, 1, function(day_counts) sum(day_counts == 0))

round(mean(T_rep_pois), 2)
#> [1] 11.58

mean(T_rep_pois >= T_obs)
#> [1] 0.2025
```

The Poisson's datasets average 11.58 blank days against the shop's 15, and 0.20 of them reach 15 or more. So the observed value has moved from outside the crowd of replicates to inside it, and the code that measured the move is the same two lines pointed at a different matrix.

On a real fitted model you would not write the simulation loop yourself. A brms fit already carries its posterior draws, so one call does the draw, the simulate and the compare on whatever statistic you name.

```r-static
# The same check in one line on a brms fit, to run in a local R session
library(brms)

shop <- data.frame(orders = sales)
fit  <- brm(orders ~ 1, data = shop, family = poisson())
pp_check(fit, type = "stat", stat = function(y) sum(y == 0))
```

There is one thing to be precise about here, because the two results are not symmetric. A failed check is decisive: the model could not produce a feature your data plainly has, so the model is wrong about something. A passed check is much weaker. It says the model agrees with your data on the statistic you chose, and it says nothing at all about the statistics you did not choose.

=== step === widget
## Reading the same check under both models

Here is the same blank day check with both fits behind a toggle, so you can watch the observed value change places instead of taking the two numbers on trust.

::widget ppc-overlay {}

Start on the Normal fit. Each blue bar counts how many of its replicated datasets came out with that many blank days, and the vertical line marked observed = 15 stands outside them. Now switch to the Poisson fit. The bars slide right until that line is standing in the thick of the crowd, and the reading underneath moves with it.

What you are reading in both cases is the position of one line against a pile of bars. That position is the check, and the p-value is only a way of writing it down. The widget runs its own fixed version of the simulation, so its digits land near the ones you computed rather than on top of them.

=== step === quiz
## Quick check: what do 0.03, 0.20 and 0.99 tell you?

Three models are checked on the same test statistic and come back with posterior predictive p-values of 0.03, 0.20 and 0.99. Which reading is right?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- 0.03 is a misfit, 0.20 is a fit, and 0.99 is the best fit of the three, since nearly every replicate reproduced the feature. ::no
- 0.03 is a misfit and 0.20 is a fit. 0.99 is a misfit too, because nearly every replicate went past the observed value, so that model overshoots the feature. ::ok Exactly. The number is a position, and both ends of the range are bad news. Near 0 the model cannot reach your data, near 1 it goes straight past it, and only the middle says the replicates and the data agree.
- 0.03 clears the 0.05 threshold and 0.20 and 0.99 do not, so only the first model should be rejected. ::no
- Only 0.03 can be read at all. The other two need a significance threshold before they mean anything. ::no Both ends of the range are failures. Near 0, hardly any replicate matched the observed statistic. Near 1, nearly every replicate exceeded it, which is the same misfit seen from the other side. Only a mid-range value says the observed statistic sits inside the crowd of replicates, and none of this is a significance test, so there is no threshold anywhere to clear.

=== step === tryit
## Your turn: does either model get the busiest day right?

The blank day count rejected the Normal fit and cleared the Poisson one. Blank days are not the only thing the shop cares about, though. The busiest day of the run decides how much stock has to sit on the shelf.

So run the same check on that statistic instead. Both replicate matrices are still in memory, so this is the counting line you already have, with `max` in place of the zero count.

```r
# yrep_normal and yrep_pois each hold 2,000 fake datasets of 60 days.
# The busiest day the shop actually had is max(sales).
# Work out the share of each model's datasets that reach that busiest
# day or beat it. One line per model. Press Check when you have them.
```
::check {"regex": "apply[(]\\s*yrep_normal\\s*,\\s*1\\s*,\\s*max", "gate": true, "difficulty": "beginner", "ok": "Right: 0.757 under the Normal fit and 0.78 under the Poisson. Both models produce a busiest day of 5 or more about three times in four, so this statistic passes for both of them.", "no": "Take the counting move you already used and swap the statistic: mean(apply(yrep_normal, 1, max) >= max(sales)), then the same line again with yrep_pois."}
::solution
```r
# Run the same posterior predictive check on the busiest day of the run
max_obs <- max(sales)
max_obs
#> [1] 5

mean(apply(yrep_normal, 1, max) >= max_obs)
#> [1] 0.757

mean(apply(yrep_pois, 1, max) >= max_obs)
#> [1] 0.78
```

Both pass, and comfortably. The Normal model was rejected on the blank days a moment ago, and it clears the busiest day without any trouble at all.

That is not a contradiction, that is the rule. A statistic only ever tests the feature it measures, so a model can reproduce the top of your data perfectly and still fail at the bottom of it. Choosing the statistic is the part of the check that carries your judgement, so pick the features your decision actually rests on and check those.

=== step === concept
## References

- [Bayesian Data Analysis, 3rd edition](http://www.stat.columbia.edu/~gelman/book/) - Gelman, Carlin, Stern, Dunson, Vehtari and Rubin (2013). Chapter 6 is the standard treatment of model checking and the posterior predictive p-value.
- [Posterior predictive assessment of model fitness via realized discrepancies](https://www3.stat.sinica.edu.tw/statistica/j6n4/j6n41/j6n41.htm) - Gelman, Meng and Stern (1996), Statistica Sinica 6, 733 to 807. The paper that set out the test quantity framework used here.
- [Visualization in Bayesian workflow](https://doi.org/10.1111/rssa.12378) - Gabry, Simpson, Vehtari, Betancourt and Gelman (2019), JRSS A 182(2), 389 to 402. The graphical case for prior and posterior predictive checks.
- [bayesplot: Plotting for Bayesian Models](https://mc-stan.org/bayesplot/) - Gabry and Mahr. The documentation for the family of posterior predictive plots.
- [pp_check for brms fits](https://paulbuerkner.com/brms/reference/pp_check.brmsfit.html) - Buerkner. The one line version of the loop built here.

=== step === complete
## Quick recap

You took a fitted Bayesian model, made it generate its own data, and read the answer off the comparison.

- A fitted model is a data generator. One posterior draw plus the model's distribution produces a whole dataset, and you made 2,000 of them at 60 days each.
- The overlay is the check in picture form. The Normal model's datasets put orders below zero and never piled up at zero the way the shop did.
- The posterior predictive p-value is the check in one number: the share of replicated datasets whose statistic matches or beats the real one. Yours read 0.0305 on the blank day count.
- Read it as a position. Near 0 and near 1 are both failures, the middle is agreement, and there is no threshold to clear.
- Swapping to a Poisson, whole numbers with a floor at zero, moved that same statistic to 0.2025 without one change to the checking code.
- A statistic only tests what it measures. The busiest day passed under both fits, including the one the blank days had already rejected.

So the next time a fit comes back with nothing obviously wrong in it, you have a way to press further. Pick the feature your decision rests on, ask the model for a few thousand datasets of its own, and see whether yours could have been one of them.
