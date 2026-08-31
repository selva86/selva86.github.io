---
title: "Posterior predictive checks, in 5 minutes"
slug: "Bayesian-Mini-7"
description: "Simulate replicated data from a fitted Bayesian model, hold your real data against it, and turn the comparison into a number that names what the model missed."
keywords: "posterior predictive check, posterior predictive p-value, Bayesian model checking, replicated dataset, test quantity, overdispersion, negative binomial in R"
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
catalog_blurb: "How to tell whether a fitted model can produce data like yours."
---

=== step === cover
::eyebrow Bayesian Decisions
## Posterior predictive checks, in 5 minutes

Let's say a small bakery sells its bread through a website. Every evening the shop writes one line in a day-book, the number of orders that came in that day. We have sixty days of it in front of us. On its quietest days only two orders arrived, the busiest single day brought thirty one, and across the whole stretch the shop averaged about twelve and a half orders a day.

Now you fit a Bayesian model to those sixty numbers and it hands you back a posterior for the average daily rate. Ours comes out at 12.48 orders a day, and it is narrow, because sixty days is a good amount of evidence about an average. Nothing about that answer looks wrong.

But look at what that answer is about. The posterior tells you which average rates the data leaves standing. It says nothing at all about whether a model built this way could have produced a day-book like the bakery's, with two orders on the quiet days and thirty one on the busy ones.

You can ask that second question directly, and it is simpler than it sounds. A fitted model runs forwards as well as backwards. Draw an average rate from the posterior, simulate sixty days of orders at that rate, and you are holding a day-book that is perfectly ordinary under this model. Do that four hundred times and you have four hundred of them to hold the real one against.

::widget process-flow {"steps":[{"title":"Draw a rate from the posterior","sub":"one plausible value of the average daily rate"},{"title":"Simulate sixty days at that rate","sub":"sixty daily counts, ordinary under this model"},{"title":"Compare the real day-book with the fakes","sub":"does the real one sit inside the pile or outside it"}]}

That is the whole move, and it has a name. Holding your real data against data simulated from the fitted model is a posterior predictive check. Everything from here is doing it: running the simulation yourself, putting one number on the comparison so it is not a matter of squinting at a chart, and reading that number for which part of the model to change.

=== step === concept
## Sixty days of orders, and the Poisson model fitted to them

Here is the day-book, typed straight in, with three summaries printed underneath so we have something to measure against later. Press Run.

```r
# Load the bakery's sixty days of online orders and summarise them
orders <- c(7, 10, 13, 16, 14, 10, 16, 7, 23, 16, 18, 7, 7, 7, 14, 2, 4, 9,
            7, 12, 11, 31, 16, 14, 13, 13, 15, 5, 12, 8, 4, 3, 2, 21, 21, 18,
            20, 13, 20, 20, 4, 22, 8, 12, 22, 8, 8, 16, 10, 5, 17, 16, 17, 4,
            16, 15, 18, 2, 26, 4)

round(c(days = length(orders), total = sum(orders), mean = mean(orders),
        sd = sd(orders), variance = var(orders)), 2)
#>     days    total     mean       sd variance
#>    60.00   749.00    12.48     6.58    43.34
```

So the shop took 749 orders over the sixty days, which works out at 12.48 a day. A typical day sits about 6.58 orders away from that average, and the variance, which is just that number squared, is 43.34. Hold on to those last two. They do most of the work from here on.

Now the model. When things arrive one at a time at a steady average rate, the natural distribution to reach for is the Poisson. It has exactly one parameter, written lambda, and lambda is the average number of events per period. Hand it a lambda and it hands you back whole numbers scattered around lambda.

We do not know lambda, so we put a distribution over it. Before seeing any of the bakery's numbers, all we want to say is that lambda is some positive number, probably somewhere in the low tens. A Gamma(2, 0.2) says that loosely, spreading itself thin over everything from near zero up to about fifty. A starting distribution like that is the **prior**, and the updated version you get once the data has been taken into account is the **posterior**.

For a Poisson likelihood with a Gamma prior, the update is plain arithmetic. Add every order to the prior's shape, add every day to the prior's rate, and you have the posterior.

```r
# Update the Gamma(2, 0.2) prior with the sixty days to get the posterior rate
post_a <- 2 + sum(orders)        # prior shape, plus every order the shop took
post_b <- 0.2 + length(orders)   # prior rate, plus every day it was open

round(c(shape = post_a, rate = post_b, posterior_mean = post_a / post_b), 2)
#>          shape           rate posterior_mean
#>         751.00          60.20          12.48
```

The posterior for the daily rate is a Gamma(751, 60.2), and its mean, 751 divided by 60.2, is 12.48 orders a day. That lands right on the shop's own average, which is what you get when sixty days of data overwhelms a deliberately vague prior.

[KEY INSIGHT]
A fitted Bayesian model is two pieces, not one. The posterior says which values of lambda survived the data. The Poisson says how any one lambda turns into a column of daily counts. Put the two together and the model can do something a posterior on its own cannot. It can generate data.

=== step === concept
## What one simulated day-book looks like

Let's use both pieces once and see what falls out.

`rgamma()` takes one draw from the posterior. That draw is a candidate for the true average rate, picked in proportion to how plausible the sixty days made it. Feed it to `rpois()` sixty times and you get sixty daily counts, made the way the model says days get made. A column of sixty numbers built like that has a name. It is a **replicated dataset**, and it is the raw material for everything that follows.

```r
# Draw one rate from the posterior and let the model write its own sixty days
set.seed(11)
rate_draw <- rgamma(1, shape = post_a, rate = post_b)
one_rep   <- rpois(60, rate_draw)

round(rate_draw, 2)
#> [1] 12.2

one_rep
#>  [1]  4  7  8 16 14 12  8 13 10 11  8 10 15 10 21  4 12 11  9 15 13 14 12  9  9
#> [26] 11  9 10  9 12 15  9  9  4  9 12 14 11  9 14  8 11 13 17 12  9  8  5 13 13
#> [51] 12 12 14 20 12 13 12 10 12  9

orders
#>  [1]  7 10 13 16 14 10 16  7 23 16 18  7  7  7 14  2  4  9  7 12 11 31 16 14 13
#> [26] 13 15  5 12  8  4  3  2 21 21 18 20 13 20 20  4 22  8 12 22  8  8 16 10  5
#> [51] 17 16 17  4 16 15 18  2 26  4
```

`set.seed(11)` fixes the random number generator so your numbers match mine.

The rate that came out of the posterior was 12.2, close to the 12.48 the posterior is centred on, which is just the sort of draw you would expect. The sixty simulated days that followed run from 4 up to 21, and fifty one of them land between 8 and 15. Now compare that with the real row underneath. The bakery's own days go down to 2 and up to 31.

You can see the difference by eye. Two summaries make it exact.

```r
# Compare the real day-book with the simulated one on spread and on the busiest day
round(c(real_sd = sd(orders),       fake_sd = sd(one_rep),
        real_busiest = max(orders), fake_busiest = max(one_rep)), 2)
#>      real_sd      fake_sd real_busiest fake_busiest
#>         6.58         3.35        31.00        21.00
```

The real day-book swings 6.58 orders around its average and the simulated one only 3.35, a little over half as much. Where the real shop had a thirty one order day, the simulated shop never got past 21.

That is one draw though, and one draw settles nothing. Change the seed and both numbers move. To say anything at all we need a lot of them.

=== step === concept
## Four hundred simulated day-books, drawn over the real one

One thing to settle before we scale up. The rate gets redrawn every single time.

You could freeze lambda at 12.48 and simulate four hundred day-books from that one value. But then the fakes would carry only the randomness a Poisson makes at a known rate, and none of the doubt we still have about the rate itself. Drawing a fresh lambda from the posterior every time carries both, and that is what makes the pile an honest picture of what the fitted model expects to see.

```r
# Simulate 400 day-books, each one from its own draw of the posterior rate
set.seed(11)
yrep <- t(replicate(400, rpois(60, rgamma(1, shape = post_a, rate = post_b))))

dim(yrep)
#> [1] 400  60
```

`replicate()` runs that pair of operations four hundred times, and `t()` turns the result the right way round, so each of the 400 rows is one simulated day-book of 60 days.

Four hundred columns of numbers are unreadable. So instead we draw each simulated day-book as a density curve, which is just a smoothed version of its histogram, stack all four hundred of them in grey, and lay the real day-book on top in red.

```r
# Draw the 400 simulated day-books in grey with the real one on top in red
plot(density(orders), lwd = 3, col = "firebrick",
     xlim = c(0, 40), ylim = c(0, 0.19),
     main = "400 simulated day-books, and the real one",
     xlab = "Orders in a day")

for (i in 1:400) lines(density(yrep[i, ]), col = rgb(0, 0, 0, 0.06))
lines(density(orders), lwd = 3, col = "firebrick")
```

Look first at where the weight sits. The grey band and the red curve are both piled up over the low teens, so on the general level of trade the model is doing fine.

Now look at how wide they are. Every grey curve is tall and narrow, with nearly all of its weight between 6 and 20 orders. The red curve is low and broad. It carries real weight down at two and three orders a day, and it is still going past 25, where the grey has already run out.

Put numbers on those two edges and the gap is not a small one. Four of the bakery's sixty days came in at three orders or fewer, and two days reached 25 or more. Across all 24,000 simulated days, about one in seven hundred fell to three or fewer, and about one in nine hundred reached 25 or more.

The bakery has quiet days and rush days that this model almost never produces. That is the finding. Now let's stop describing it and put a number on it.

=== step === quiz
## Quick check: what do the four hundred fake day-books stand for?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- They are a forecast of the bakery's next sixty days of trading. ::no
- They are sixty days of orders simulated from the fitted model, one day-book for every rate drawn from the posterior. ::ok That is it. Each row was generated by the model from one of the rates its posterior supports, so the pile shows you the whole range of day-books this model can produce.
- They are the bakery's real sixty days, resampled with replacement the way a bootstrap resamples. ::no
- They are what the prior expected, before any of the bakery's data was taken into account. ::no A replicate is not a forecast, not a reshuffle of the numbers you already have, and not the prior talking. It is fresh data simulated from the fitted model, and that is exactly what makes it fair to hold against the data the model was fitted to.

=== step === concept
## Turning the picture into a number: the posterior predictive p-value

Let's name the moving parts first, because from here they come up constantly. Your observed data is y, the bakery's sixty numbers. A simulated day-book is a replicate, written y-rep. And a **test quantity**, written T, is any summary you can compute on either of them: the mean, the standard deviation, the largest value, the number of zero days, whatever your decision actually turns on.

With those three named, the whole check fits in one sentence. Compute T on the real data, compute T on all four hundred replicates, then report the share of replicates that reach or beat the real value.

$$ p_{\text{ppc}} \;=\; P\left(\, T(y^{\text{rep}}) \ge T(y) \mid y \,\right) $$

Read it as the probability, given the data you already have, that a replicate's summary reaches or beats the summary of your real data. That share is the **posterior predictive p-value**. Here are three of them for our model, one for each summary.

```r
# For one summary at a time, the share of fakes that reach or beat the real value
ppc_share <- function(reps, stat) mean(apply(reps, 1, stat) >= stat(orders))

round(c(mean = ppc_share(yrep, mean),
        sd   = ppc_share(yrep, sd),
        busiest_day = ppc_share(yrep, max)), 3)
#>        mean          sd busiest_day
#>       0.488       0.000       0.000
```

Read them one at a time.

The mean comes in at 0.488. Just under half of the simulated day-books averaged more orders a day than the real one did, so the bakery's own average sits right in the middle of the pile. On that summary the model passes.

The standard deviation comes in at 0.000. Not one of the four hundred simulated day-books swung as wide as the real one. The busiest day gives 0.000 as well. Not one simulated day got anywhere near thirty one orders.

A pair of zeros is worth seeing rather than taking on trust, so let's draw the spread comparison out.

```r
# Where the real spread sits among the 400 simulated spreads
hist(apply(yrep, 1, sd), breaks = 30, col = "grey85", border = "white",
     xlim = c(2, 7),
     main = "Spread of each simulated day-book, and the real one",
     xlab = "Standard deviation of the daily orders")
abline(v = sd(orders), col = "firebrick", lwd = 3)
```

The pile of simulated standard deviations runs from about 2.6 to 4.5. The red line is the bakery's own 6.58, and it is not sitting out in the thin tail of that pile. It is off the end of it altogether.

[NOTE]
This number is a position, not a verdict, and it has nothing to do with the 0.05 you would reach for in a hypothesis test. Near 0.5 means the model reproduces that summary comfortably. Near 0 means the real value is bigger than almost every replicate. Near 1 means it is smaller than almost every replicate. Both ends are the same failure seen from opposite sides.

=== step === concept
## What the failed check pointed at, and the model that fixes it

A failed check is more useful than it looks, because the summary that failed tells you which part of the model to go after.

Ours failed on spread. And spread is the one thing a Poisson does not get to choose. It has a single parameter doing two jobs at once: lambda is the mean, and lambda is the variance too. Pin the mean at 12.48 and you have pinned the variance at 12.48 as well, which puts the standard deviation at the square root of that, near 3.5. There is no second dial to turn.

```r
# Check the spread a Poisson at this rate is even able to produce
round(c(rate = mean(orders),
        poisson_spread = sqrt(mean(orders)),
        simulated_spread = mean(apply(yrep, 1, sd)),
        real_spread = sd(orders)), 2)
#>             rate   poisson_spread simulated_spread      real_spread
#>            12.48             3.53             3.51             6.58
```

The middle two numbers agree, which is a good sign that we understand our own simulation. The arithmetic says a Poisson at this rate makes day-books with a spread near 3.53, and the four hundred we simulated averaged 3.51. The real day-book sits at 6.58, nearly double that. Put the other way round, the observed variance of 43.34 is three and a half times the mean of 12.48. Counts more spread out than a Poisson allows are called **overdispersed**, and that is our diagnosis.

The fix follows from the diagnosis. Our model assumed one rate for all sixty days, and that is the assumption doing the damage. A bakery has slow Tuesdays and busy Saturdays, weather, school holidays, a mention in the local newsletter. Let the daily rate itself move around from day to day and the counts pick up extra spread on top of the Poisson's own.

A Poisson whose rate is drawn from a Gamma each time has a name and a closed form. It is the **negative binomial**. In R that is `rnbinom()`, and it takes the average as `mu` plus a second parameter, `size`, which controls how far the rate is allowed to wander. A small `size` means a lot of extra spread. As `size` grows the wandering shrinks, and in the limit you are back to a plain Poisson.

We can read `size` straight out of the mean and the variance. For a negative binomial the variance is mu plus mu squared over size, so rearranged, size is mu squared divided by however much the variance exceeds the mean.

```r
# Estimate the extra spread, rebuild the 400 day-books, and rerun the same checks
size_hat <- mean(orders)^2 / (var(orders) - mean(orders))
round(size_hat, 2)
#> [1] 5.05

set.seed(12)
yrep_nb <- t(replicate(400, rnbinom(60, size = size_hat,
                                    mu = rgamma(1, shape = post_a, rate = post_b))))

round(rbind(
  fixed_rate    = c(mean = ppc_share(yrep, mean),
                    sd = ppc_share(yrep, sd),
                    busiest_day = ppc_share(yrep, max)),
  wobbling_rate = c(mean = ppc_share(yrep_nb, mean),
                    sd = ppc_share(yrep_nb, sd),
                    busiest_day = ppc_share(yrep_nb, max))), 3)
#>                mean    sd busiest_day
#> fixed_rate    0.488 0.000       0.000
#> wobbling_rate 0.445 0.448       0.552
```

All three summaries now land somewhere in the middle. The mean was never the problem and still is not, at 0.445. The standard deviation went from 0.000 to 0.448, and the busiest day from 0.000 to 0.552. Same four hundred simulations, same three questions, and this time the bakery's real day-book looks ordinary among the fakes.

[NOTE]
There is a shortcut hiding in that second parameter. We computed `size` from the observed mean and variance and then held it fixed, instead of giving it a prior and a posterior of its own. A full Bayesian fit would carry the doubt about `size` into the replicates too, which would widen the grey pile a little. The check itself works the same either way.

=== step === widget
## The same check on a different misfit: too many zero days

The three moves do not care what the data is. So here is a different shop with a different problem, and you can watch the same check pick up a different kind of misfit.

This shop logs sixty days of a count that is very often nothing at all. On fifteen of the sixty days the number recorded was zero. The summary worth checking here is not the spread, it is that count of zero days, because a model that cannot produce empty days has no business describing this shop.

The toggle fits two models to the same sixty numbers, and it opens on the Normal.

::widget ppc-overlay {}

The axis along the bottom is the number of zero days in a simulated dataset, the height of each bar is how many simulations landed there, and the vertical line marked observed = 15 is what the shop actually recorded. Under the Normal fit the replicates pile up around eight zero days and hardly ever reach fifteen, so the observed line sits far out in the right tail and the readout underneath gives a posterior predictive p-value close to zero. A Normal spreads its weight smoothly around the average, including over the negative and fractional values a count can never take, so it has no way to put enough probability on exactly nothing.

Now switch to the Poisson fit. Same data, same summary, same simulation. The whole pile shifts right, the observed line lands inside the crowd, and the readout climbs to an ordinary value. A Poisson puts real probability on zero, which is what this data needed all along.

Notice the shape of what you just did. Pick the summary your decision depends on, simulate it from the fitted model, and see where the real value falls. None of that changes when the data changes or the model changes.

=== step === concept
## Which summaries to check, and what a passing check cannot tell you
::prose-only the rule is a matter of practice, and the three failed summaries are already on the page as numbers

Two things to carry into your own work.

The first is which summaries to pick. Always take at least one from the middle of the distribution and at least one from an edge. You have seen why. Our first model passed the mean at 0.488 while failing the standard deviation and the busiest day at 0.000. Check only the mean and you would have shipped a model that cannot make the shop's quiet days or its rush days. Beyond that pair, pick whatever your decision runs on. If the bakery staffs its kitchen for the busiest day, then the busiest day is the summary that matters, and a healthy mean is no comfort at all.

The second is what a pass actually buys you, which is less than most people assume. A passing check says the fitted model can produce data that looks like yours, on the summaries you happened to check. It does not say the model is right. Another model, built on different assumptions and meaning something quite different, could pass every one of the same summaries. Our wobbling-rate model passes, and that is no proof that the bakery's daily rate wobbles in exactly the way a Gamma says it does.

A failure is the stronger result by far. When not one of four hundred simulations from your own fitted model can produce a feature that is plainly there in your data, the model has left something real out, and a tidy posterior does not make up for it.

=== step === quiz
## Quick check: how to read a posterior predictive p-value?

Say a colleague fits their own model to the bakery's day-book, checks the busiest day, and gets a posterior predictive p-value of 0.99. What does that tell them?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- It is a pass. 0.99 is nowhere near zero, so the model reproduces the busiest day. ::no
- It is a failure pointing the other way. Almost every simulated day-book peaked higher than the real one, so this model invents rush days the bakery never has. ::ok Right. The share runs from 0 to 1 and both ends are misses. Near 0 the real value is bigger than almost every replicate, near 1 it is smaller than almost every replicate, and 0.99 says this model overshoots the top end badly.
- It says there is a 99% chance the model is correct. ::no
- It clears the usual 0.05 threshold with room to spare, so nothing is wrong. ::no A posterior predictive p-value is a position inside the pile of replicates, not a probability that the model is true, and not a number to compare against 0.05. It also belongs to the one summary it was computed on. The same model can sit comfortably on the busiest day and fail badly on the number of quiet days.

=== step === tryit
## Your turn: do the models get the quiet days right?

The bakery cares about its quiet end as well. On any day with five orders or fewer, one baker gets sent home early, so the shop wants to know how often that happens. Over the real sixty days it happened eleven times.

Both sets of replicates are still in the session. `yrep` holds the four hundred day-books from the fixed-rate model and `yrep_nb` the four hundred from the wobbling-rate one, one day-book per row. Count the quiet days in every simulated day-book, then work out the share of the four hundred that reach eleven or more, once for each model.

```r
# yrep and yrep_nb each hold 400 simulated day-books, one per row.
# A quiet day is a day with five orders or fewer, and the real
# day-book has eleven of them.
# Count the quiet days in every simulated day-book, then report the
# share of the 400 that reach eleven or more, for each model.
# Press Check when you have it.
```
::check {"regex": "[<]=\\s*5", "gate": true, "difficulty": "intermediate", "ok": "Yes: 0.00 for the fixed-rate model and 0.15 for the wobbling-rate one. Not one of the 400 Poisson day-books managed eleven quiet days, and the best of them only reached six.", "no": "Write a small function that counts the quiet days in one day-book, `function(x) sum(x <= 5)`, run it down the rows with `apply(yrep, 1, quiet_days)`, then take the mean of `apply(yrep, 1, quiet_days) >= 11`."}
::solution
```r
# Count the quiet days in every simulated day-book, then the share reaching eleven
quiet_days <- function(x) sum(x <= 5)

round(c(fixed_rate    = mean(apply(yrep,    1, quiet_days) >= quiet_days(orders)),
        wobbling_rate = mean(apply(yrep_nb, 1, quiet_days) >= quiet_days(orders))), 3)
#>    fixed_rate wobbling_rate
#>          0.00          0.15
```

The fixed-rate model misses the quiet end just as badly as it missed the busy end, which is the same fault seen from below. One lambda for all sixty days cannot make a shop that is dead on a Tuesday and swamped on a Saturday. The wobbling-rate model reaches eleven quiet days about fifteen times in a hundred, so the bakery's real count is on the rarer side of ordinary, but well inside what that model can produce.

=== step === concept
## References

- [Posterior predictive assessment of model fitness via realized discrepancies](https://www3.stat.sinica.edu.tw/statistica/oldpdf/A6n41.pdf) - Gelman, Meng and Stern (1996), Statistica Sinica 6, 733-807. The paper that set out the check and its p-value, including test quantities that depend on the parameters as well as the data.
- [Bayesian Data Analysis, third edition](http://www.stat.columbia.edu/~gelman/book/) - Gelman and colleagues. Chapter 6 is the textbook treatment of model checking and the best place to read more on choosing a test quantity.
- [Visualization in Bayesian workflow](https://doi.org/10.1111/rssa.12378) - Gabry, Simpson, Vehtari, Betancourt and Gelman (2019), Journal of the Royal Statistical Society A 182(2), 389-402. How the overlay plots are meant to be read, and what each kind can hide.
- [brms: An R Package for Bayesian Multilevel Models Using Stan](https://doi.org/10.18637/jss.v080.i01) - Burkner (2017), Journal of Statistical Software 80(1), 1-28. Documents `pp_check()`, which runs these comparisons in one line for a model fitted with brms.
- [The Negative Binomial Distribution](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/NegBinomial.html) - R Core Team, the documentation for `rnbinom()` and the mean and size parameterisation used above.

=== step === complete
## Quick recap

You took a fitted Bayesian model, made it generate its own data, and used that data to judge the model.

- A fitted model is a posterior plus a rule for turning parameters into data. Run it forwards and you get replicated datasets, day-books that are perfectly ordinary under the fitted model.
- Redraw the rate from the posterior for every replicate, so the pile carries the doubt about the rate as well as the randomness in the counts.
- Pick a test quantity, compute it on the real data and on every replicate, and report the share of replicates that match or beat the real value. That share is the posterior predictive p-value.
- Near 0.5 is a pass. Near 0 or near 1 is a miss, and the summary that missed names the fault. Ours missed on spread, which is the one thing a Poisson has no freedom to vary.
- Always take one summary from the middle and one from an edge. The bakery's mean passed at 0.488 while its spread and its busiest day both came back 0.000.
- A passing check says the model could have produced your data. It never says the model is right. A failure is the decisive one.

So the next time someone shows you a tidy posterior for a model nobody has checked, there is one short question worth asking:

"If we let that model write out sixty days of its own, would they look anything like ours?"

Then go and find out. It takes about five lines of code. Nicely done, and enjoy the rest of your day.
