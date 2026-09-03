---
title: "Posterior predictive checks, in 5 minutes"
slug: "Bayesian-Mini-7"
description: "Simulate datasets from a fitted Bayesian model, compare them with the data you have, and read the posterior predictive p-values that show what it misses."
keywords: "posterior predictive check, posterior predictive p-value, Bayesian model checking, simulate data from the posterior, test statistic, model misfit, Poisson model in R"
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
catalog_blurb: "How to tell whether a fitted model actually describes your data."
---

=== step === cover
::eyebrow Bayesian Decisions
## Posterior predictive checks, in 5 minutes

A small online store kept a log of its orders for 60 days running, one whole number for each day. The average day brought 31.15 orders. The quietest brought 3 and the busiest brought 47.

Someone has fitted a Bayesian model to that column. It says every day's count is a draw from a Poisson distribution with one shared daily rate, and the fit returns a posterior for that rate, meaning the range of rates the 60 days leave standing. Everything the fit prints is about that rate: where it sits, and how wide the range around it is.

None of that answers the question you actually have, which is whether the model describes the 60 days it was fitted on.

A fitted model is a way to generate data: pick a rate, then draw 60 counts at that rate. Run that a thousand times and you have a thousand simulated datasets, each 60 days long, each one a stretch of trading the model says this store could have had. Put the real 60 days beside them, and anything the model cannot produce shows up as a gap.

That comparison is called a posterior predictive check, and it runs in three steps.

::widget process-flow {"steps":[{"title":"Draw a rate from the posterior","sub":"one plausible value for the daily order rate"},{"title":"Simulate 60 days of orders from that draw","sub":"one simulated dataset, the same size as the real one"},{"title":"Compare the observed data with the simulated data","sub":"as a picture first, then as a number"}]}

Those three steps are the whole method. We are going to run each one on the store's 60 days, and then work out what the answer does and does not entitle you to claim.

=== step === concept
## The 60 days of orders, and the Poisson model

Every number from here on comes out of one table, so we build it first. The store logged 60 consecutive days starting 1 June 2026, one row per day, carrying the date and the count of orders placed that day.

```r
# Build the store's 60 days of orders and summarise the counts
orders <- c(36, 41, 34, 30, 36, 36,  3, 28, 39, 47, 34, 24, 35,  5, 31,
            28, 45, 23, 41, 37,  4, 38, 33, 44, 28, 32, 39,  6, 30, 40,
            24, 39, 38, 30,  7, 33, 37, 45, 37, 40, 30,  5, 24, 31, 41,
            41, 36, 24,  6, 41, 29, 33, 44, 38, 30,  6, 37, 31, 39, 46)

store <- data.frame(
  date   = seq(as.Date("2026-06-01"), by = "day", length.out = 60),
  orders = orders
)

head(store, 3)
#>         date orders
#> 1 2026-06-01     36
#> 2 2026-06-02     41
#> 3 2026-06-03     34

round(c(mean = mean(orders), variance = var(orders), sd = sd(orders),
        min = min(orders), max = max(orders)), 2)
#>     mean variance       sd      min      max 
#>    31.15   138.60    11.77     3.00    47.00
```

So that is 60 counts, averaging 31.15 orders a day, with a standard deviation of 11.77 and a range running from 3 up to 47.

The model fitted to this column makes one claim. Each day's count is a draw from a Poisson distribution, and all 60 days share the same rate. A Poisson distribution is the standard model for counts of things that happen independently within a fixed window, and it has a single parameter, its rate, which is the average count it produces. Set the rate to 31 and it gives whole numbers scattered around 31.

That single parameter has to do two jobs, and the consequence is worth noticing before we check anything. In a Poisson distribution the variance equals the rate, so the mean and the variance of the counts it produces are the same number.

The store's counts have a mean of 31.15 and a variance of 138.60. The variance is more than four times the mean, so no single Poisson rate can match both numbers.

[NOTE]
That mismatch is a warning, not a diagnosis. It says the model and the data disagree somewhere. It does not say where the disagreement sits, how large it is, or what to fit instead.

=== step === widget
## Drawing a rate from the posterior, then simulating one dataset

Fitting this model means working out which daily rates are consistent with the 60 counts. You start from a prior, which is what you are willing to say about the rate before seeing any data, and you finish at a posterior, which is what is left of that once the 60 counts have been taken into account.

For a Poisson rate the standard prior is a Gamma distribution, described by a shape and a rate of its own. We use Gamma(2, 0.1), which is deliberately vague: its mean sits at 20 orders a day with a standard deviation of 14, so it rules out almost nothing and 60 days of real counts will swamp it.

The convenient part is that a Gamma prior and Poisson counts give a Gamma posterior, with no simulation needed to find it. Add the total number of orders to the prior's shape, add the number of days to the prior's rate, and you have the posterior.

The widget below carries its own small example rather than the store's orders: the unknown it estimates is the mean of a normal measurement, not a Poisson rate. The moving parts are the same three, a prior, the data, and the posterior that comes out of them.

::widget bayes-update {}

Drag the data points slider and watch the posterior curve narrow. At n = 10 the readout gives a posterior mean of 2.14 with a standard deviation of 0.53. Push it to n = 60 and the same readout gives 2.81 with a standard deviation of 0.25, and the curve has become a thin spike. Sixty observations leave an unknown very little room, which is exactly the position the store's rate is in.

Here is the store's posterior, worked out with those two additions.

```r
# Build the Gamma posterior for the store's daily order rate
post_shape <- 2 + sum(orders)        # prior shape 2, plus all 1869 orders
post_rate  <- 0.1 + length(orders)   # prior rate 0.1, plus the 60 days

round(c(shape = post_shape, rate = post_rate,
        posterior_mean = post_shape / post_rate,
        lower = qgamma(0.025, post_shape, post_rate),
        upper = qgamma(0.975, post_shape, post_rate)), 2)
#>          shape           rate posterior_mean          lower          upper 
#>        1871.00          60.10          31.13          29.74          32.56
```

The posterior is Gamma(1871, 60.1). Its mean is 31.13 orders a day, and 95% of it lies between 29.74 and 32.56, so the rate is known to within about one and a half orders either side.

Simulating one dataset from this fit takes two draws, in this order.

1. Draw one rate from the posterior. That gives one plausible value for the store's daily rate.
2. Draw 60 counts from a Poisson distribution at that rate. That gives one simulated dataset, the same size as the real log.

```r
# Draw one rate from the posterior and simulate 60 days of orders at that rate
set.seed(11)
rate1 <- rgamma(1, post_shape, post_rate)
fake1 <- rpois(60, rate1)

round(rate1, 1)
#> [1] 30.7

round(rbind(observed  = c(mean = mean(orders), sd = sd(orders),
                          min = min(orders), max = max(orders)),
            simulated = c(mean(fake1), sd(fake1), min(fake1), max(fake1))), 2)
#>            mean    sd min max
#> observed  31.15 11.77   3  47
#> simulated 28.88  5.10  18  44
```

`set.seed(11)` fixes the random number generator so your draw matches mine. The rate that came out was 30.7 orders a day, and the 60 counts drawn at that rate averaged 28.88, close enough to the observed 31.15.

Now read across the other three columns. The simulated standard deviation is 5.10 against the observed 11.77, and the simulated quietest day is 18 against the observed 3. This simulated stretch of trading is much steadier than the store's real one, and it contains no quiet days at all.

One draw settles nothing, though. A different seed gives a different rate and 60 different counts, and some of that gap could be luck. To say anything you need the whole spread of what the model produces, not a single instance of it.

=== step === concept
## 1000 simulated datasets against the observed data

Repeat those two draws a thousand times and you get a thousand simulated datasets, which stack into a matrix of 1000 rows by 60 days. A simulated dataset is also called a replicate, which is where the name `y_rep` below comes from. The whole collection has a name, the posterior predictive distribution, and it means everything the fitted model can produce at the size of your data.

The fastest way to read it is to draw the simulated datasets and the real data on one set of axes.

```r
# Simulate 1000 datasets from the posterior and plot them against the observed data
set.seed(7)
y_rep <- t(replicate(1000, {
  rate <- rgamma(1, post_shape, post_rate)
  rpois(60, rate)
}))

dim(y_rep)
#> [1] 1000   60

plot(density(orders), col = "red", lwd = 3, ylim = c(0, 0.10),
     main = "40 simulated datasets against the observed 60 days",
     xlab = "orders in a day")
for (i in 1:40) lines(density(y_rep[i, ]), col = "grey70")
lines(density(orders), col = "red", lwd = 3)
legend("topleft", legend = c("observed 60 days", "simulated datasets"),
       col = c("red", "grey70"), lwd = c(3, 1), bty = "n")
```

Each grey curve is the density of one simulated dataset, which is a smoothed version of its histogram, so a bump in the curve means that dataset had a run of days with counts near that value. Forty of the 1000 are drawn so the picture stays readable, and the red curve is the density of the store's actual 60 days.

Read the grey bundle first. Every one of the 40 rises to a single hump somewhere between 25 and 35, then falls away on both sides. That is the only shape one Poisson rate can make: a single lump, centred on the rate.

Now read the red curve. Its main hump sits near 37, and the grey bundle covers that part well enough. It also has a second, lower hump near 5, and there is no grey anywhere underneath it. Across all 40 simulated datasets the lowest count of all is 14.

So the store has a group of days with almost no orders, and the model has no way of producing them. That is the misfit, and one plot was enough to see it.

[KEY INSIGHT]
A posterior predictive check compares the data you have against the data your fitted model produces. Where the two shapes agree, the model captures that feature of the data. Where the observed data has something the simulated datasets never reach, the model is missing it.

=== step === quiz
## Quick check: why no two simulated datasets are alike
::prose-only the check on the widget and the plot the reader has just worked through, so it points back at those instead of adding another picture

The 40 grey curves all have the same broad shape, and no two of them land on top of each other. Where does that variation come from?

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- The 60 observed counts are resampled with replacement, so every simulated dataset is a reshuffled copy of the real one. ::no
- Each simulated dataset is refitted, so every one of them ends up carrying its own estimated rate. ::no
- Two draws vary: a fresh rate out of the posterior, then 60 fresh counts out of a Poisson at that rate. ::ok Exactly right, and the second draw does most of the moving. The posterior is narrow after 60 days, so the rate barely shifts from one simulated dataset to the next, staying inside roughly 29.74 to 32.56, and nearly all of the visible width is Poisson variation around it.
- Nothing varies on purpose. The differences are rounding error in the random number generator. ::no The observed counts are never touched and nothing is refitted. Each simulated dataset comes from two fresh draws, one rate out of the posterior and then 60 counts out of a Poisson at that rate. With the rate confined to roughly 29.74 to 32.56, it is the counts that give the curves their width.

=== step === concept
## The posterior predictive p-value, one test statistic at a time

A picture is a good first read, but it is not a number, and you need a number when the misfit is subtle or when you have to report something. The way to get one is to pick a test statistic.

A test statistic is any single number you can compute from a dataset: its mean, its standard deviation, its smallest value, the count of days above 40. Compute it once on the observed data and once on every simulated dataset, then count how many of the simulated values are at least as extreme as the observed one.

\[ p = \frac{1}{S} \sum_{s=1}^{S} \mathbf{1}\left( T(y^{\text{rep}}_s) \ge T(y) \right) \]

Here \(T\) is the statistic, \(y\) is the observed data, \(y^{\text{rep}}_s\) is the sth simulated dataset, and \(S\) is how many of them you made, 1000 in our case. The indicator counts 1 whenever the simulated statistic reaches the observed one and 0 when it does not, so the sum is a count and dividing by \(S\) turns it into a share. That share is the posterior predictive p-value. When small values are the extreme ones, as with the quietest day, the comparison flips to at most.

Three statistics are worth asking about here: the mean, the standard deviation and the smallest day.

```r
# Posterior predictive p-values for the mean, the spread and the quietest day
p_mean <- mean(rowMeans(y_rep)      >= mean(orders))
p_sd   <- mean(apply(y_rep, 1, sd)  >= sd(orders))
p_min  <- mean(apply(y_rep, 1, min) <= min(orders))

round(c(mean = p_mean, sd = p_sd, min = p_min), 3)
#>  mean    sd   min 
#> 0.485 0.000 0.000
```

`rowMeans(y_rep)` gives 1000 means, one per simulated dataset, and `apply(y_rep, 1, sd)` does the same for the standard deviation. Comparing each of those to the observed value produces 1000 TRUE and FALSE values, and `mean()` of TRUE and FALSE is the share that are TRUE.

The mean comes back at 0.485. Just under half of the simulated datasets have a mean of 31.15 or more, so the observed mean sits right in the middle of them.

The standard deviation and the smallest day both come back at 0. Not one simulated dataset in 1000 was as spread out as the real 60 days, and not one contained a day as quiet as 3.

Zero is a blunt answer, so it is worth seeing how far outside the observed values actually fall.

```r
# How far the observed spread and quietest day sit from the simulated ones
round(c(sd_observed    = sd(orders),
        sd_replicated  = mean(apply(y_rep, 1, sd)),
        min_observed   = min(orders),
        min_replicated = mean(apply(y_rep, 1, min))), 2)
#>    sd_observed  sd_replicated   min_observed min_replicated 
#>          11.77           5.53           3.00          19.03
```

The simulated datasets have a standard deviation of 5.53 on average against the observed 11.77, and their quietest day averages 19.03 against the observed 3. Neither of those is a near miss.

[NOTE]
A posterior predictive p-value near 0.5 says the observed statistic sits in the middle of the simulated ones. Near 0 or near 1 says it sits outside them. There is no 0.05 threshold here and no significance test attached, because the number reports a position rather than a decision.

=== step === concept
## Which statistics failed, and refitting with a Sunday rate

Two of the three statistics failed, and both of them are about low days: the spread was too small, and the quietest simulated day was never quiet enough. The plot said the same thing in a different form, a second hump of low days near 5 with no grey underneath it. So the model is missing a group of days that trade far below the rest.

The check has now taken us as far as it can. It says a group of quiet days exists and that the model cannot produce them. Which days those are is a question about the store, and the answer is sitting in the date column.

```r
# Compare the Sundays with every other day in the log
sun <- as.POSIXlt(store$date)$wday == 0

c(sundays        = sum(sun),
  sunday_lowest  = min(orders[sun]),
  sunday_highest = max(orders[sun]),
  other_lowest   = min(orders[!sun]))
#>        sundays  sunday_lowest sunday_highest   other_lowest 
#>              8              3              7             23
```

`as.POSIXlt()` breaks a date into its parts, and `$wday` numbers the weekday from 0 for Sunday up to 6 for Saturday. Unlike `weekdays()`, it returns the same answer on every machine, because it never touches the locale's day names.

There are 8 Sundays in the 60 days. They run from 3 to 7 orders, and the quietest day that is not a Sunday is 23. The two groups do not come close to overlapping. The store barely trades on a Sunday.

So give Sundays their own rate. That is one model with two Poisson rates instead of one: the 8 Sundays share a rate, the other 52 days share a different one, and each rate gets its own Gamma posterior, built exactly the way the first one was.

```r
# Give Sundays their own rate, refit both, and recheck the two failed statistics
sun_shape <- 2 + sum(orders[sun])
sun_rate  <- 0.1 + sum(sun)
oth_shape <- 2 + sum(orders[!sun])
oth_rate  <- 0.1 + sum(!sun)

c(sunday_shape = sun_shape, sunday_rate = sun_rate,
  other_shape = oth_shape, other_rate = oth_rate)
#> sunday_shape  sunday_rate  other_shape   other_rate 
#>         44.0          8.1       1829.0         52.1

set.seed(7)
y_rep2 <- t(replicate(1000, {
  rate_sun <- rgamma(1, sun_shape, sun_rate)
  rate_oth <- rgamma(1, oth_shape, oth_rate)
  rpois(60, ifelse(sun, rate_sun, rate_oth))
}))

round(c(sd  = mean(apply(y_rep2, 1, sd)  >= sd(orders)),
        min = mean(apply(y_rep2, 1, min) <= min(orders))), 3)
#>    sd   min 
#> 0.389 0.812
```

Each simulated dataset now takes two rate draws instead of one, and `ifelse(sun, rate_sun, rate_oth)` gives each of the 60 days the rate that belongs to it before any counts are drawn.

The spread statistic has moved from 0 to 0.389 and the quietest day from 0 to 0.812. Both observed values now sit inside what the model produces rather than outside it. The two checks that failed for the one-rate model pass for the two-rate one.

=== step === widget
## Where the observed statistic falls among the replicates

You have now seen both outcomes as numbers: a statistic outside everything the model produced, and the same statistic inside it after a refit. Here they are as one picture you can switch between.

The widget carries its own data rather than the store's. It holds 60 days of low counts, the test statistic is the number of days that recorded zero, and 15 of them were observed. The toggle swaps between two fitted models. The Poisson fit stands in for the store's two-rate model, the one that reproduces the quiet days, and the Normal fit stands in for the single-rate model, the one that cannot.

::widget ppc-overlay {}

The bars are the statistic computed on 2000 simulated datasets, and the red line marks the observed 15. Start on the Normal fit. The bars pile up well to the left of the red line, and only about 2 in every 100 simulated datasets reach 15 zero days, which is the p-value the widget reports, 0.02. That is what a failing statistic looks like, and it is where the store's standard deviation sat when its p-value came back at 0.

Now switch to the Poisson fit. The bars shift right and widen until the red line is inside the crowd instead of beyond it, and the reported p-value reads 0.22. Nothing about the observed data changed between the two toggles. The only thing that changed is the model that produced the bars.

=== step === concept
## Why a p-value near 0.5 is weak evidence
::prose-only a limit on what the p-values already computed license, carried by the plot and the widget the reader has already worked through

Look again at what the single-rate model scored on the mean: 0.485, about as central as a number can be. That same model could not produce a quiet day and could not produce the observed spread. A p-value near 0.5 did not save it.

There is a reason the mean was never going to fail. The posterior for the rate was built from the total of the 60 counts, so a simulated dataset's mean is tied to the observed mean by the way the fit works. Asking whether the model reproduces the mean is close to asking whether the arithmetic came out right.

That is the general problem with these p-values. The same data are used twice, once to fit the model and once to compute the statistic, and using them twice pulls the p-value toward 0.5. The pull is strongest for the statistics the fit targeted most directly.

So read them asymmetrically. A p-value near 0 or near 1 is a real signal, because the model cannot produce a feature your data has. A p-value near 0.5 says only that the model can produce data like yours on that one statistic, which is a far weaker claim than being the right model.

The practical consequence is in which statistics you choose. Pick ones the fit was not aimed at, and pick ones tied to the decision the model is for.

- Spread and extremes: the standard deviation, the smallest and largest values, a high or low quantile.
- Counts of the thing that matters: days below a threshold, days at zero, runs of consecutive quiet days.
- Group structure: the same statistic computed inside each group you care about, rather than pooled over everything.

[KEY INSIGHT]
A failing posterior predictive check is decisive and a passing one is not. Failing says the model cannot produce something your data contains. Passing says only that it can produce data like yours on the statistics you happened to try.

=== step === quiz
## Quick check: reading two p-values from the same model
::prose-only the closing check on the numbers and pictures the reader has already produced

The single-rate model returned 0.485 on the mean and 0 on the standard deviation. A colleague reads those two numbers and asks you what to conclude. Which answer is right?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The mean is the statistic that counts, so 0.485 settles it and the model is fine. ::no
- The model failed. One statistic the model cannot reproduce is enough on its own, and the 0.485 does not offset it, because a central p-value only says the model can produce data like ours on that one statistic. ::ok Yes. Checks do not average out. The 0 on the standard deviation says the model cannot make data as spread out as the store's, and no number of passing statistics makes that go away.
- The two numbers average to roughly 0.24, which puts the fit on the borderline. ::no
- A p-value of 0 means the observed standard deviation is wrong, so the data need cleaning before the model can be judged. ::no Posterior predictive p-values are never averaged and they never grade the data. Each one asks whether the fitted model can produce a particular feature of what you observed. A 0 says it cannot, and one 0 fails the model whatever the other statistics did.

=== step === tryit
## Your turn: the largest day under the single-rate model

`y_rep` still holds the 1000 simulated datasets from the single-rate model, one dataset per row and 60 days across each row. The busiest day the store actually had was 47 orders.

Work out the largest day in each of the 1000 simulated datasets, then the share of them that reach 47 or more. That share is the posterior predictive p-value for the largest day.

```r
# y_rep holds 1000 simulated datasets from the single-rate model, one per row.
# The busiest observed day was 47 orders.
# Work out the largest day in each simulated dataset, then the share of the
# 1000 that reach 47 or more.
# Two lines. Press Check when you have them.
```
::check {"regex": "apply[(]y_rep,\\s*1,\\s*max[)]", "gate": true, "difficulty": "intermediate", "ok": "That is 0.233, so 233 of the 1000 simulated datasets contain a day at least as busy as 47. The model that could not produce a single quiet day handles the busiest day comfortably.", "no": "Build the statistic first, then compare it. `apply(y_rep, 1, max)` gives the 1000 largest days, and `mean()` of that vector compared with `max(orders)` gives the share."}
::solution
```r
# The largest-day statistic and its posterior predictive p-value
max_rep <- apply(y_rep, 1, max)
mean(max_rep >= max(orders))
#> [1] 0.233
```

A model can pass on one statistic and fail badly on another, which is why the honest answer to whether a model fits is a short list of statistics rather than a single number.

=== step === concept
## References

- [Posterior predictive assessment of model fitness via realized discrepancies](https://www3.stat.sinica.edu.tw/statistica/j6n4/j6n41/j6n41.htm) - Gelman, Meng and Stern (1996), Statistica Sinica 6(4), 733-807. The paper that set out posterior predictive checks with test statistics and discrepancy measures, including the p-value computed here.
- [Bayesianly justifiable and relevant frequency calculations for the applied statistician](https://doi.org/10.1214/aos/1176346785) - Rubin (1984), Annals of Statistics 12(4), 1151-1172. The original argument for simulating replicate datasets from the posterior and comparing them with what you observed.
- [Visualization in Bayesian workflow](https://arxiv.org/abs/1709.01449) - Gabry, Simpson, Vehtari, Betancourt and Gelman (2019), Journal of the Royal Statistical Society Series A 182(2), 389-402. Where the density overlay and the test-statistic histogram belong in a full workflow, with worked examples.
- [Bayesian Data Analysis, third edition](http://www.stat.columbia.edu/~gelman/book/) - Gelman, Carlin, Stern, Dunson, Vehtari and Rubin. Chapter 6, Model checking, covers the method in depth, including why these p-values are pulled toward 0.5.
- [Graphical posterior predictive checks using the bayesplot package](https://mc-stan.org/bayesplot/articles/graphical-ppcs.html) - the vignette for the R package that draws these checks for an already fitted model in one line.

=== step === complete
## Quick recap

You took a fitted model, used it to produce data, and held that data against the store's 60 days. Everything the check told you came out of that one comparison.

- Simulating a dataset takes two draws: one rate out of the posterior, then 60 counts out of a Poisson at that rate. A thousand repeats of that pair is the posterior predictive distribution.
- The density plot is the fast read. A thousand simulated datasets sat in a single hump near 31, while the observed data carried a second hump of 8 quiet days near 5 that none of them reached.
- A posterior predictive p-value makes the comparison a number: the share of simulated datasets whose statistic is at least as extreme as the observed one. Here that was 0.485 for the mean, 0 for the standard deviation and 0 for the quietest day.
- Near 0.5 is weak evidence and near 0 or 1 is the signal. The mean could not fail, because the fit was built from the total of the counts.
- The check says the model is wrong, never what to fit instead. The date column said Sundays, and giving the 8 Sundays their own rate moved the two failed statistics to 0.389 and 0.812.

So when someone shows you a Bayesian model and asks whether it fits, you have something specific to do about it. Simulate a few hundred datasets from the fit, plot them against the real data, then pick two or three statistics the model has to get right and count how often the simulated datasets reach the observed value.

Nice work getting through it. Have a good day.
