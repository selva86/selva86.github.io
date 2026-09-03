---
title: "Posterior predictive checks, in 5 minutes"
slug: "Bayesian-Mini-7"
description: "Simulate datasets from a fitted Bayesian model, compare them with your real data, and find out exactly which feature of the data the model cannot produce."
keywords: "posterior predictive check, posterior predictive p-value, Bayesian model checking, test statistic, simulate from the posterior, model misfit, Bayesian workflow in R"
mathjax: true
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
catalog_blurb: "How to tell whether a fitted Bayesian model actually describes your data."
---

=== step === cover
::eyebrow Bayesian Decisions
## Posterior predictive checks, in 5 minutes

Today let's work out whether a Bayesian model you have already fitted is a good description of the data you fitted it to.

A neighbourhood bookshop keeps one hardback on the front table and writes down how many copies it sells each day. Over 60 days it sold 96 copies, which is about 1.6 copies a day. On 15 of those days it sold none at all, and on the busiest it sold 5.

Someone fits a Bayesian model to those counts. The posterior for the daily average, the range of daily averages the data leave plausible, comes back centred on 1.6 with a 95% interval of 1.27 to 1.96. Nothing in that output tells you whether the model describes a shop that sells nothing on a quarter of its days.

Here is the check that does. A fitted Bayesian model holds two pieces: a posterior over the parameters, and a likelihood that turns any parameter value into data. Put them together and the model can generate datasets. Take one value from the posterior, pass it to the likelihood, and out comes 60 days of sales the model could have produced.

Do that 2,000 times and you have 2,000 simulated datasets to hold against the real one. Then you have something to compare: do the bookshop's own 60 days sit inside that pile like one more dataset out of it, or is there a feature of them, the quiet days for instance, that this model almost never produces?

That is the whole idea, in three moves.

::widget process-flow {"steps":[{"title":"Draw from the posterior","sub":"one value of the daily average the data support"},{"title":"Simulate 60 days of sales","sub":"pass that value to the likelihood, one dataset out"},{"title":"Compare with the real data","sub":"the simulated datasets against the 60 real days"}]}

Everything from here is doing those three moves on the bookshop's 60 days, and then reading what comes out of them.

=== step === concept
## Sixty days of sales, and the model fitted to them

Start with the data, because every number from here on is computed from it.

The bookshop's record is 60 whole numbers: copies sold on day 1, day 2, and so on to day 60. Press Run.

```r
# Load the bookshop sales and summarise the 60 daily counts
sales <- c(0, 0, 3, 0, 1, 1, 0, 0, 2, 2, 3, 5, 2, 1, 3,
           3, 1, 2, 2, 0, 1, 2, 0, 1, 4, 1, 3, 1, 3, 1,
           0, 1, 3, 2, 4, 0, 3, 0, 1, 1, 0, 3, 3, 1, 1,
           1, 1, 1, 3, 0, 4, 2, 1, 0, 3, 2, 0, 0, 3, 4)

table(sales)
#> sales
#>  0  1  2  3  4  5
#> 15 18  9 13  4  1

round(c(total = sum(sales), mean = mean(sales), sd = sd(sales),
        zero_days = sum(sales == 0), busiest = max(sales)), 2)
#>     total      mean        sd zero_days   busiest
#>     96.00      1.60      1.34     15.00      5.00
```

`table()` counts how many days sold each amount. There were 15 days with no sale at all, 18 days that sold a single copy, and one day at the top that sold 5. Across all 60 days the shop moved 96 copies, an average of 1.6 a day, with a standard deviation of 1.34.

Two things about these numbers matter later. They are whole copies, and they never go below zero.

Now let's look at the model that was fitted to them. It treats each day's sales as a draw from a Normal distribution with two settings: an unknown daily average, which is the quantity being estimated, and a spread held fixed at the observed 1.34. That is the ordinary first thing to reach for when you have a column of numbers and want an average with uncertainty attached to it.

=== step === concept
## What the posterior holds, and how to draw from it

Fitting the model did not return one number for the daily average. It returned a whole distribution over it, called the **posterior**: every value the daily average could take, weighted by how well the data support it.

That shape comes from two things multiplied together. The **prior** is what you were willing to believe about the daily average before seeing any sales. The **likelihood** is what the 60 days of sales say on their own: for any value of the daily average, it gives the chance of seeing counts like the ones the shop recorded. Read the other way round, it is also the rule that turns a value of the daily average into a fresh 60 days. Multiply the prior and the likelihood and you get the posterior.

The widget below carries its own data rather than the bookshop's, so read it for the mechanism and not for the answer. Set the data average slider to 1.5 and the data points slider to 60.

::widget bayes-update {}

At that setting it reads a posterior mean of 1.41 with a standard deviation of 0.25, near the bookshop's posterior without landing on it. There are two reasons for the gap: the widget holds the spread of its data at 2 where the sales counts have 1.34, and its prior sits at 0 rather than being left flat.

The part worth taking from it is the shape. Drag the data points slider from 1 up to 200 and the posterior narrows the whole way, because more observations pin the daily average down more tightly. Drag it back down and the posterior widens again.

For the bookshop the prior is flat, meaning it favours no value of the daily average over any other, and the spread of the counts is held at the observed 1.34. Under those two choices the posterior has a closed form. It is Normal, centred on the sample mean of 1.60, with a standard deviation of 1.34 divided by the square root of 60.

```r
# Draw 2,000 values of the daily average from the posterior
mu_centre <- mean(sales)
mu_spread <- sd(sales) / sqrt(60)

set.seed(7)
mu <- rnorm(2000, mu_centre, mu_spread)

round(c(centre = mu_centre, spread = mu_spread), 3)
#> centre spread
#>  1.600  0.173

round(quantile(mu, c(0.025, 0.975)), 2)
#>  2.5% 97.5%
#>  1.27  1.96
```

`mu` now holds 2,000 values of the daily average, drawn in proportion to the weight the posterior puts on them. 95% of them sit between 1.27 and 1.96 copies a day.

Those 2,000 numbers are the raw material for everything that follows. Each one is a daily average consistent with the 60 days the shop recorded.

=== step === concept
## One draw simulates one 60-day dataset

Take the first of those 2,000 values and hold everything else fixed. That single number, plus the Normal likelihood, is enough to generate a whole dataset.

The first draw is 1.997 copies a day. Pass it to the likelihood, draw 60 days at that average, and you get 60 numbers the model could have produced if the daily average really were 1.997.

```r
# Simulate one 60-day dataset from a single posterior draw
round(mu[1], 3)
#> [1] 1.997

set.seed(11)
one_rep <- rnorm(60, mu[1], sd(sales))

sum(one_rep < 0)
#> [1] 5

table(round(one_rep))
#>
#> -1  0  1  2  3  4
#>  1  6 16 21 12  4

table(sales)
#> sales
#>  0  1  2  3  4  5
#> 15 18  9 13  4  1
```

`one_rep` is one 60-day dataset the fitted model could have produced. Look at what is in it.

Five of the 60 values are negative. The shop cannot sell minus one copy of a book, but a Normal distribution puts weight on every number on the line, so some simulated days come out below zero.

Rounding to whole copies makes the two tables comparable, and they still do not line up. The simulated dataset piles 37 of its 60 days on 1 and 2 copies, where the real data put 27 there and stack 15 at zero. The shop had 15 days without a sale and this simulated dataset has 6.

[NOTE]
One simulated dataset settles nothing on its own. It is a single draw, and draws vary, which is exactly why the comparison is worth doing thousands of times. What matters here is the mechanism: one value out of the posterior, one pass through the likelihood, one dataset. Everything that follows repeats exactly that, 2,000 times.

=== step === quiz
## Quick check: what one simulated dataset represents

`one_rep` holds 60 numbers and the shop's own record holds 60 numbers. They are not the same kind of thing. Which sentence describes `one_rep` correctly?

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- It is the model's forecast of what the bookshop will sell over the next 60 days. ::no
- It is the model's single best guess at the 60 days that were actually recorded. ::no
- It is one 60-day dataset the fitted model could have produced, built from one posterior draw passed through the likelihood. ::ok Yes. One value of the daily average out of the posterior, passed to the likelihood, gives 60 numbers the model could have produced. Take a different draw and you get a different dataset.
- It is a second sample of real sales, taken from the same 60 days. ::no A simulated dataset is not a forecast, not a best guess, and not more real data. It is 60 numbers the fitted model could have produced: one value of the daily average taken from the posterior, passed through the likelihood. Change the draw and the dataset changes with it, which is why 2,000 of them say far more than one.

=== step === concept
## Two thousand simulated datasets over the real sales

One dataset is one draw. Two thousand of them is a distribution, and a distribution is something you can compare against.

`sapply()` walks through all 2,000 posterior draws and simulates 60 days from each, so `yrep` comes back as a 2,000 by 60 matrix with one simulated dataset per row.

```r
# Simulate 2,000 datasets and draw 100 of them behind the real sales
set.seed(21)
yrep <- t(sapply(mu, function(m) rnorm(60, m, sd(sales))))

dim(yrep)
#> [1] 2000   60

round(mean(yrep < 0), 3)
#> [1] 0.117

plot(density(sales), lwd = 3, col = "black", xlim = c(-4, 8), ylim = c(0, 0.45),
     main = "The real 60 days against 100 simulated datasets",
     xlab = "copies sold in a day")
for (i in 1:100) lines(density(yrep[i, ]), col = "grey75")
lines(density(sales), lwd = 3)
abline(v = 0, lty = 2)
```

The grey band is where the model puts 60 days of sales, one curve per simulated dataset. It is centred near 1.6 copies a day and it runs left across the dashed line at zero, out past minus 2.

The thick black curve is the real 60 days, and it has a different shape. Its high point sits below 1 copy a day, which is the 15 quiet days pulling it down there, and it rises into a second bump near 3.

Both curves cross the dashed line, and that part is the drawing rather than the data. `density()` spreads every value into a small bump around itself, so a stack of days at zero shows up as weight on either side of zero.

The values settle it. `mean(yrep < 0)` prints 0.117, so 11.7% of the 120,000 simulated numbers are below zero, and not one of the 60 real counts is. About an eighth of what this model generates is days that cannot happen.

=== step === concept
## The zero-sale days, counted: the posterior predictive p-value

Comparing curves by eye is a fair first pass, but it does not give you a number. Pick one feature of the data, compute it on the real data and on every simulated dataset, and the whole comparison collapses to a single number you can report.

That feature is called a **test statistic**. It is any function that takes a dataset and returns one number: the mean, the standard deviation, the largest value, the count of days with no sale. Here the last one is the interesting choice, because the zero days are what the density plot showed the model was missing.

Write T for the test statistic, y for the real data and y-rep for one simulated dataset. The vertical bar means given, so everything to the right of it is held at the 60 days the shop actually recorded. The posterior predictive p-value is the share of simulated datasets whose statistic reaches the observed one:

$$p = \Pr\left(T(y^{rep}) \ge T(y) \mid y\right)$$

```r
# Count the zero-sale days in the real data and in all 2,000 simulated datasets
zero_days <- function(x) sum(round(x) == 0)

t_obs <- zero_days(sales)
t_rep <- apply(yrep, 1, zero_days)

round(c(observed = t_obs, simulated_average = mean(t_rep),
        ppc_p = mean(t_rep >= t_obs)), 3)
#>          observed simulated_average             ppc_p
#>            15.000             8.833             0.044

hist(t_rep, breaks = 20, col = "grey85", border = "white",
     main = "Zero-sale days in 2,000 simulated datasets",
     xlab = "days with no sale in a simulated dataset")
abline(v = t_obs, col = "red", lwd = 3)
```

`apply(yrep, 1, zero_days)` runs the counter along the rows, one row per simulated dataset, so `t_rep` holds 2,000 zero counts. `round()` sits inside `zero_days` because the simulated values are continuous. A simulated day of 0.2 copies is a day on which nothing was sold, so it counts as a zero.

The real record has 15 zero-sale days. Across the 2,000 simulated datasets the count averages 8.83, and 4.4% of them reach 15 or more. That 0.044 is the posterior predictive p-value for this statistic.

The histogram shows the same thing. The grey pile is where the model puts the zero count, centred around 9. The red line is the real 15, out in the right tail with only 88 of the 2,000 datasets at or beyond it.

[KEY INSIGHT]
A posterior predictive p-value is the share of simulated datasets whose test statistic matches or beats the real one. A value near 0 or near 1 means the real data sit in a tail the model rarely reaches, so the model does not reproduce that statistic. A value in the middle means it does.

=== step === concept
## Which statistics pass and which ones fail

A posterior predictive p-value applies to the statistic you handed it, not to the model as a whole. Score the same 2,000 datasets on four statistics and you can see what that costs you.

```r
# Score the same 2,000 simulated datasets on four test statistics
test_stats <- list(zero_days = zero_days, mean = mean, sd = sd, max = max)

ppc_table <- function(reps) {
  data.frame(
    statistic = names(test_stats),
    observed  = round(sapply(test_stats, function(f) f(sales)), 2),
    simulated = round(sapply(test_stats, function(f) mean(apply(reps, 1, f))), 2),
    ppc_p     = round(sapply(test_stats, function(f) mean(apply(reps, 1, f) >= f(sales))), 3),
    row.names = NULL
  )
}

ppc_table(yrep)
#>   statistic observed simulated ppc_p
#> 1 zero_days    15.00      8.83 0.044
#> 2      mean     1.60      1.61 0.507
#> 3        sd     1.34      1.34 0.497
#> 4       max     5.00      4.74 0.308
```

`ppc_table()` does the same three things for every statistic in the list: compute it on the real sales, compute it on each of the 2,000 simulated datasets, and take the share of those 2,000 that reach the real value.

Three of the four pass, and they pass comfortably. The simulated datasets average 1.61 copies a day against the real 1.60, at 0.507. Their standard deviation averages 1.34 against the real 1.34, at 0.497. Their busiest day averages 4.74 against the real 5, at 0.308.

That is less impressive than it looks. The posterior was centred on the sample mean and the likelihood was handed the observed standard deviation, so a check on the mean or the spread tests the model against a number it was built from. It was always going to pass.

The zero count is the one statistic the fitting never touched, and it is the one that fails at 0.044. So the simulated datasets match the average, match the spread and come close on the busiest day, and only 88 of the 2,000 hold as many quiet days as the shop actually had.

[WARNING]
A passing check covers the statistic you gave it and nothing wider. Hand a model only statistics its fitting already targeted and every model you ever build will pass.

=== step === concept
## Refitting with a likelihood that produces whole copies

The check said this model rarely produces as many zero days as the shop recorded. The fix for that is not a tighter prior or longer sampling, because neither one changes what the model is able to generate. The likelihood has to change.

Daily sales are counts: whole copies, never negative, often zero. The Poisson distribution is built for exactly that shape. It has one parameter, the rate, and its mean and its variance are both equal to that rate.

Swapping the likelihood means swapping the prior with it. A Gamma prior on the rate is the standard choice for a Poisson likelihood, because it makes the posterior a Gamma too, which you can draw from in one line. Gamma(2, 1) is a mild starting point that puts the rate around 2 copies a day and rules nothing out. Adding the data, 96 copies over 60 days, gives a Gamma posterior with shape 2 + 96 = 98 and rate 1 + 60 = 61.

```r
# Refit with a Poisson likelihood and score the same four statistics
set.seed(31)
lambda <- rgamma(2000, shape = 2 + sum(sales), rate = 1 + 60)

set.seed(41)
yrep_p <- t(sapply(lambda, function(l) rpois(60, l)))

round(quantile(lambda, c(0.025, 0.975)), 2)
#>  2.5% 97.5%
#>  1.32  1.94

ppc_table(yrep_p)
#>   statistic observed simulated ppc_p
#> 1 zero_days    15.00     12.07 0.241
#> 2      mean     1.60      1.61 0.511
#> 3        sd     1.34      1.25 0.270
#> 4       max     5.00      5.16 0.756
```

These are the same three moves as before. Draw 2,000 rates from the posterior, simulate 60 days from each with `rpois()`, score the four statistics. Every value in `yrep_p` is a whole number and none of them is negative, because `rpois()` cannot produce anything else.

The zero count now averages 12.07 against the real 15, and its p-value is 0.241. That sits in the middle, so this model reproduces the quiet days.

Look at the interval for the rate while you are here: 1.32 to 1.94, against 1.27 to 1.96 from the model that failed. The two models agree almost exactly about the daily average and disagree completely about the data they can produce. That contrast is the reason posterior predictive checks exist. An interval tells you what the model estimated, not what it is capable of generating.

=== step === widget
## The same zero count under both models

Put the two zero-day checks side by side and the difference is easy to see.

The toggle below switches the fitted likelihood. The widget runs its own 2,000 replicates on 60 days with an observed count of 15 zero-sale days, the same setup as the bookshop. It holds the daily average fixed at 1.6 instead of drawing it from the posterior, which narrows the spread of its replicated counts, so its p-values come out smaller than the ones you computed. The conclusion is the same either way.

::widget ppc-overlay {}

Start on the Normal fit. The replicated zero counts pile up below 10, and the observed 15 sits out on the right where the bars barely reach. The posterior predictive p-value reads 0.02.

Now switch to the Poisson fit. The whole pile slides right to around 12 and the observed 15 is inside it, with a p-value of 0.22.

Nothing about the bookshop's sales changed between those two views. The observed 15 is fixed and the red line never moves. Only the pile it is being compared against moved, and it moved because the likelihood did. That comparison, between a fixed observed statistic and the distribution the fitted model generates for it, is all a posterior predictive check ever is.

=== step === tryit
## Your turn: days that sold 4 or more copies

A test statistic can be anything you can compute from a dataset, so pick one the fitting never targeted and see what it says. The bookshop had a handful of busy days: 4 days at 4 copies and 1 day at 5, so 5 days in all sold 4 or more.

Work out the posterior predictive p-value for that statistic under the Poisson model.

```r
# sales holds the 60 real daily counts.
# yrep_p holds 2,000 simulated datasets from the Poisson model, one per row.
# Count the days that sold 4 or more copies in the real data, count them in
# every simulated dataset, then take the share of simulated counts that
# reach the real one.
# Three lines. Press Check when you have them.
```
::check {"regex": "(?=[\\s\\S]*>=\\s*4)(?=[\\s\\S]*mean\\s*[(])", "gate": true, "difficulty": "beginner", "ok": "That is 0.513, comfortably in the middle. The simulated datasets average 4.84 busy days against the real 5, so the Poisson model reproduces this statistic too.", "no": "Count first, then compare. `sum(sales >= 4)` for the real data, `apply(yrep_p, 1, function(x) sum(x >= 4))` for the 2,000 simulated ones, then `mean()` of the second reaching the first."}
::solution
```r
# Compute the posterior predictive p-value for days selling 4 or more copies
big_obs <- sum(sales >= 4)
big_rep <- apply(yrep_p, 1, function(x) sum(x >= 4))

round(c(observed = big_obs, simulated_average = mean(big_rep),
        ppc_p = mean(big_rep >= big_obs)), 3)
#>          observed simulated_average             ppc_p
#>             5.000             4.836             0.513
```

Now run the same statistic through the datasets from the Normal model, rounded to whole copies so the counts are comparable.

```r
# Score the same busy-day statistic against the discarded Normal model
big_rep_normal <- apply(round(yrep), 1, function(x) sum(x >= 4))
round(mean(big_rep_normal >= sum(sales >= 4)), 3)
#> [1] 0.525
```

That is 0.525 from the likelihood we threw out. A statistic both models reproduce cannot tell them apart, which is why the statistic you choose decides what a check is able to catch.

=== step === quiz
## Quick check: what a passing check does and does not say

The Normal model reproduced the mean, the standard deviation, the busiest day and the busy-day count, and it was still generating negative sales. Which sentence reads a posterior predictive check correctly?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- A statistic that passes shows the model is correct, so nothing further needs checking. ::no
- A statistic that passes shows the model reproduces that one statistic, and says nothing about any feature you did not test. ::ok Exactly. The Normal fit passed on the mean, the spread, the maximum and the busy days, and failed on the zeros. A check is only ever as good as the statistic you hand it.
- The posterior predictive p-value is the probability that the model is correct, so 0.507 means about a 51% chance. ::no
- A statistic that fails tells you which likelihood to switch to. ::no A posterior predictive check answers one narrow question: does the fitted model reproduce this particular statistic of this data? It is not a probability that the model is correct, it never validates a model, and a failure points at the feature that is missing rather than at the replacement. The Normal fit here passed four statistics out of five and was still the wrong model.

=== step === concept
## References

- [Posterior predictive assessment of model fitness via realized discrepancies](https://www3.stat.sinica.edu.tw/statistica/j6n4/j6n41/j6n41.htm) - Gelman, Meng and Stern (1996), Statistica Sinica 6(4), 733-807. The paper that set out the posterior predictive p-value and what it does and does not measure.
- [Bayesian Data Analysis, third edition](http://www.stat.columbia.edu/~gelman/book/) - Gelman, Carlin, Stern, Dunson, Vehtari and Rubin (2013). Chapter 6, Model checking, is the textbook treatment of replicated data and test statistics.
- [Visualization in Bayesian workflow](https://doi.org/10.1111/rssa.12378) - Gabry, Simpson, Vehtari, Betancourt and Gelman (2019), JRSS-A 182(2), 389-402. Which predictive-check plot to draw, and what each one can and cannot show.
- [Bayesian Workflow](https://arxiv.org/abs/2011.01808) - Gelman, Vehtari, Simpson and colleagues (2020). Where model checking sits in the wider loop of fitting, criticising and refitting.
- [Graphical posterior predictive checks](https://mc-stan.org/bayesplot/articles/graphical-ppcs.html) - Gabry and Mahr, the bayesplot vignette. Every plot type the package draws, with the code that draws it.

=== step === complete
## Quick recap

You took a fitted Bayesian model, generated data from it, and held that data against the 60 days the bookshop actually recorded. To summarize:

- A posterior predictive check is three moves: draw a parameter value from the posterior, pass it to the likelihood to simulate a dataset, compare the simulated datasets with the real one. You ran 2,000 of them.
- A test statistic turns each dataset into one number, and the posterior predictive p-value is the share of simulated datasets that match or beat the real value. Counting zero-sale days gave 0.044 under the Normal likelihood.
- A p-value near 0 or near 1 means the model does not reproduce that statistic. A value in the middle means it does.
- A check covers the statistic you choose and nothing wider. The Normal model passed on the mean at 0.507, the standard deviation at 0.497, the busiest day at 0.308 and the busy days at 0.525, while simulating negative sales the whole time.
- Fixing a failed check means changing the model, not the sampling. A Poisson likelihood with a Gamma prior brought the zero-day check to 0.241 and left the daily average almost exactly where it was.

So the next time a fit hands you an estimate and a narrow interval, do not stop there. Ask what the model would produce: if it is right, what would 60 days of sales look like? Simulate them, count something the fitting never targeted, and go and look.

Congratulations, you made it through. Have a great day!
