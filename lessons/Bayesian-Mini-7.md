---
title: "Posterior predictive checks, in 5 minutes"
slug: "Bayesian-Mini-7"
description: "A fitted model can look calm and still be the wrong shape. Ask it to invent a thousand fake datasets, lay them over your real one, and see what it misses."
keywords: "posterior predictive check, pp_check, posterior_predict, Bayesian model checking, posterior predictive p-value, replicated datasets, model misfit, bayesplot, brms"
mathjax: true
webr: true
date: "2026-08-30"
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
catalog_blurb: "How to tell whether your fitted model actually describes your data."
---

=== step === cover
::eyebrow Bayesian Decisions
## Posterior predictive checks, in 5 minutes

Let's say you fit a Bayesian model on your daily sales.

The output comes back looking fine. It says about 43 units a day, with a tidy interval around that, and nothing in the summary would make you look twice.

So, is the model any good?

Nothing in that summary answers it. The summary tells you what the model believes about its own parameters. It says nothing at all about whether those beliefs resemble your shop.

Here is a simple way to find out. If the model really describes your sales, then fake data invented by the model should look like your real sales. So you ask the fitted model to generate a few hundred fake datasets and you plot them over the real one.

If your record sits comfortably among the fakes, the model has earned some trust. If it sticks out, more lopsided than any fake, or spikier, or busier at the top end, then the model is missing something. And the plot usually shows you what it is missing.

That is a posterior predictive check, and it comes down to three moves.

We are going to run it on Ravi's bakery, which is ninety days of loaves written down at the end of each day.

::widget process-flow {"steps":[{"title":"Take the draws","sub":"the fitted model leaves behind 1,000 plausible versions of the bakery"},{"title":"Let each one invent","sub":"every version writes out its own fake notebook of 90 days"},{"title":"Compare","sub":"put the thousand fake notebooks beside the real record and look"}]}

Today you are going to make all three moves by hand, read the plots that come out, and finish with the one line of R that does the whole thing for you.

=== step === concept
## Ravi's ninety days at the bakery

Ravi runs a small bakery, and at the end of every day he writes down how many loaves he sold. We are working with ninety days of that notebook.

Here it is, typed out, with the summary that goes with it. Press Run.

```r
# Ravi's notebook: 90 days of loaves sold, and the summary of that record
loaves <- c(109, 52, 45, 49, 52, 39, 55, 41, 69, 19,
            18, 50, 46, 22, 38, 48, 40, 46, 27, 41,
            38, 45, 22, 14, 112, 75, 48, 55, 50, 44,
            35, 24, 36, 60, 21, 62, 32, 46, 25, 36,
            29, 25, 32, 34, 76, 54, 51, 74, 49, 59,
            48, 51, 39, 26, 63, 33, 68, 40, 53, 36,
            57, 44, 36, 44, 30, 36, 34, 64, 24, 20,
            33, 28, 38, 77, 46, 23, 20, 24, 32, 47,
            25, 30, 36, 53, 33, 67, 30, 39, 44, 35)

length(loaves)
#> [1] 90
summary(loaves)
#>    Min. 1st Qu.  Median    Mean 3rd Qu.    Max.
#>   14.00   32.00   40.00   43.06   51.00  112.00
round(sd(loaves), 1)
#> [1] 17.8
```

An ordinary day at Ravi's is about 40 loaves. Notice that the mean, 43.06, sits above the median: a handful of very big days drag the average up and no small day drags it back, because the smallest day in ninety is still 14 loaves.

The picture says it faster than the numbers do.

```r
# The shape of the record: where the ordinary days sit and how far the big ones run
hist(loaves, breaks = 20, col = "grey85", border = "white",
     main = "Ravi's bakery: loaves sold on 90 days",
     xlab = "Loaves sold in a day")
```

There is a lump around 40 loaves, then a thin tail of market days running out to 112. Nothing sits to the left of 14, and of course nothing goes below zero.

Hold on to those two facts about the record, because they are what the model is about to get wrong. Sales are always positive, and the tail runs one way only.

=== step === concept
## The fitted model, and the draws it leaves behind

The obvious thing to fit here is the ordinary normal model. It says every day is a draw from a single normal distribution: one mean, one spread, the same story for all ninety days.

Fitting that the Bayesian way gives you back a posterior, which is the set of parameter values still plausible once the data has had its say. For a normal model with a flat prior, meaning you start out with no opinion about which mean or spread is more likely, the posterior has a closed form, so you can draw from it directly and skip the sampler.

Three short lines do it. The variance draws come out of a scaled inverse chi-squared, which is what that flat prior gives you, and in R that is one division by `rchisq()`. The mean is then drawn around the sample mean, with its own uncertainty shrinking as the sample grows.

```r
# Draw 1,000 plausible (mu, sigma) pairs from the posterior of the normal model
set.seed(11)
n <- length(loaves)

sigma2 <- (n - 1) * var(loaves) / rchisq(1000, df = n - 1)
sigma  <- sqrt(sigma2)
mu     <- rnorm(1000, mean = mean(loaves), sd = sqrt(sigma2 / n))

round(c(mean = mean(mu), quantile(mu, c(0.025, 0.975))), 1)
#>  mean  2.5% 97.5%
#>  43.1  39.4  46.7
round(c(mean = mean(sigma), quantile(sigma, c(0.025, 0.975))), 1)
#>  mean  2.5% 97.5%
#>  17.9  15.4  21.0
```

Read that and you would sign it off. Ravi sells about 43 loaves a day, and the model puts the long-run average somewhere between 39.4 and 46.7. It is tidy and sensible, and there is nothing to argue with.

And that is exactly the trouble. That summary is about the parameters, and the parameters are not the thing in doubt. What is in doubt is whether ninety days out of this model would look anything like Ravi's ninety days, and no interval on `mu` can tell you.

The useful part is not the summary anyway. It is the thousand pairs sitting in `mu` and `sigma`. Each pair is one complete version of the bakery that the model still finds plausible, and a complete version of the bakery can be asked to invent a record of its own.

=== step === concept
## A thousand fake notebooks, drawn over the real one

Take pair number one out of the posterior: a mean and a spread. That pair describes a whole bakery, so hand it ninety days and let it write out its own notebook.

That is all `rnorm(90, mu[s], sigma[s])` does. Do it once for every one of the thousand pairs and you get a thousand fake notebooks, ninety days each, every one of them a record this model considers a perfectly reasonable thing to have seen.

```r
# Let every posterior draw write out its own fake notebook of 90 days
set.seed(21)
yrep <- matrix(NA_real_, nrow = 1000, ncol = 90)

for (s in 1:1000) {
  yrep[s, ] <- rnorm(90, mean = mu[s], sd = sigma[s])
}

dim(yrep)
#> [1] 1000   90
round(yrep[1, 1:12])
#>  [1] 56 51 73 17 82 49 11 23 42 41 -2 55
```

Every row is one fake notebook and every column is a day in it. These simulated datasets have a proper name: they are the **replicates**, usually written `yrep`, and they are the raw material for everything that follows.

Now read the first twelve days of the very first fake notebook. It opens with fifty six loaves, then fifty one, then seventy three, and then on the eleventh day the shop sold minus two loaves.

Minus two loaves, on the very first fake notebook we looked at.

One strange day could be bad luck, so count how many of the thousand contain a day like it.

```r
# How many of the 1,000 fake notebooks contain a day of negative sales
worst_day <- apply(yrep, 1, min)

sum(worst_day < 0)
#> [1] 501
round(min(yrep), 1)
#> [1] -37.3
```

That is half of them. And the worst fake day anywhere in the thousand notebooks is minus 37 loaves.

That is the model telling you plainly what it does not know. Nobody ever told it that sales cannot go below zero, and nothing inside a normal distribution says so on its own.

Now put the fakes and the real record on the same picture. Each grey curve is one fake notebook's ninety days, smoothed. The black curve is Ravi's ninety days, smoothed the same way, and the dashed red line is zero.

```r
# Draw 100 fake notebooks in grey, with the real record over them in black
plot(density(loaves), col = "black", lwd = 3,
     xlim = c(-20, 130), ylim = c(0, 0.045),
     main = "100 fake notebooks (grey) against the real record (black)",
     xlab = "Loaves sold in a day")

for (s in 1:100) lines(density(yrep[s, ]), col = "grey75", lwd = 1)
lines(density(loaves), col = "black", lwd = 3)
abline(v = 0, col = "red", lty = 2, lwd = 2)
```

Two differences show up at once. The grey curves spill across the red line into negative sales, which the black curve never does. And the grey curves are symmetric, the same shape either side of about 43, while the black curve climbs steeply on the left, sits fat through the thirties and forties, then trails away to the right with a small bump near 110 where Ravi's market days sit.

So the model has the wrong shape, and you can see it. What you cannot see yet is how badly, and turning that picture into a number is the next thing to do.

=== step === quiz
## Quick check: what is one grey curve?

The overlay drew a hundred grey curves and one black one. What exactly is a single grey curve made of?

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- One draw from the posterior, which is to say one plausible pair of a mean and a spread. ::no
- Ravi's real ninety days, resampled with replacement. ::no
- A whole fake notebook: ninety days invented by one posterior draw, smoothed into a curve. ::ok That is it. One draw fixes a mean and a spread, then ninety fresh days get simulated from that pair, and the curve is drawn from those ninety numbers.
- The 95% interval around the model's fitted average. ::no A replicate is not a parameter, not a resample of the real data, and not an interval. It is a complete dataset the same size as yours, invented by the model, and the overlay holds a hundred of them.

=== step === concept
## Why the statistic you pick decides whether the check can fail

A picture is good for spotting trouble. To report it, or to compare two models, you want one number.

Here is how you get one. Pick any summary of a dataset and call it a test statistic: the mean, the spread, the busiest day, the number of zeros, whatever feature of the data you care about. Compute it on the real record. Compute it on every one of the thousand fake notebooks. Then ask how often the fakes match or beat the real one.

That share is the posterior predictive p-value.

\[ p_B \;=\; P\bigl(\,T(y^{\mathrm{rep}}) \ge T(y) \;\big|\; y \,\bigr) \]

Read it left to right. \(T\) is the statistic you picked, \(y\) is Ravi's record, \(y^{\mathrm{rep}}\) is one fake notebook, and the whole expression is the share of fake notebooks whose statistic reaches the real value or goes past it. Near 0.5 means the real value sits in the middle of what the model invents. Near 0 or near 1 means it sits out at an edge, where the model almost never goes. There is no line to clear here. The number tells you where your record sits among the model's inventions, and you read it the way you read the plot.

Let's run three of them at once on the same replicates.

```r
# Three checks on the same replicates: the mean, the spread, and the busiest day
rep_mean <- rowMeans(yrep)
rep_sd   <- apply(yrep, 1, sd)
rep_max  <- apply(yrep, 1, max)

round(c(mean_check = mean(rep_mean >= mean(loaves)),
        sd_check   = mean(rep_sd   >= sd(loaves)),
        max_check  = mean(rep_max  >= max(loaves))), 3)
#> mean_check   sd_check  max_check
#>      0.517      0.500      0.006
sum(rep_max >= max(loaves))
#> [1] 6
```

The mean check comes back at 0.517 and the spread at 0.500. Both of them are dead centre. A model you just watched fail by eye has passed two checks about as cleanly as a model can.

And it was always going to. This model was fitted by matching the mean and the spread of Ravi's data, so its fake notebooks are built to have that mean and that spread. Asking it to reproduce them is asking it to repeat what it was told. A check that cannot fail tells you nothing when it passes.

The busiest day is a different kind of number. Nobody fitted the busiest day. The model has to produce it on its own, out of the shape it assumes, and only 6 of the thousand fake notebooks ever reach 112 loaves. That is a posterior predictive p-value of 0.006.

Both of those facts sit on one picture.

```r
# Put the observed value on each replicated distribution
par(mfrow = c(1, 2))

hist(rep_mean, breaks = 30, col = "grey85", border = "white",
     main = "Mean loaves per day", xlab = "Mean of a fake notebook")
abline(v = mean(loaves), col = "red", lwd = 3)

hist(rep_max, breaks = 30, col = "grey85", border = "white",
     main = "Busiest day", xlab = "Busiest day in a fake notebook")
abline(v = max(loaves), col = "red", lwd = 3)

par(mfrow = c(1, 1))
```

In the left panel the red line stands in the middle of the pile. In the right panel the same red line stands past nearly all of it: a typical fake bakery has a best day around 87 loaves, and Ravi's best day was 112.

[KEY INSIGHT]
A posterior predictive check can only fail on a feature the model was not fitted to reproduce. Check the mean of a model fitted on the mean and it will pass every time. Choosing the statistic is the skill.

So pick statistics that press on whatever you actually doubt. Check the extremes if extremes matter to the decision, the number of zeros if zeros matter, and the gap between the quartiles if you doubt the shape.

=== step === concept
## What the plot says the model is missing, and how to fix it

Look again at what the failure was made of, because it is unusually specific. The fakes went negative, and real sales cannot. The fakes were symmetric, and Ravi's record leans hard to the right. Both complaints are the same complaint: a normal distribution is symmetric and unbounded, and these sales are neither.

So you want a shape that is positive and lopsided to the right. The quickest way there is to model the logarithm of the sales instead of the sales. Take logs, fit the identical normal model on that scale, then exponentiate the replicates back into loaves. No fake day can come out negative, because `exp()` of anything is positive, and the right tail stretches out on its own.

```r
# Fit the same model on the log scale, then bring the replicates back to loaves
log_loaves <- log(loaves)

set.seed(12)
sigma2_log <- (n - 1) * var(log_loaves) / rchisq(1000, df = n - 1)
sigma_log  <- sqrt(sigma2_log)
mu_log     <- rnorm(1000, mean = mean(log_loaves), sd = sqrt(sigma2_log / n))

set.seed(22)
yrep_log <- matrix(NA_real_, nrow = 1000, ncol = 90)

for (s in 1:1000) {
  yrep_log[s, ] <- exp(rnorm(90, mean = mu_log[s], sd = sigma_log[s]))
}

round(mean(apply(yrep_log, 1, max) >= max(loaves)), 3)
#> [1] 0.39
sum(yrep_log < 0)
#> [1] 0
```

It is the same data, the same statistic and the same check. 0.006 has become 0.39. Ravi's busiest day is now an ordinary thing for this model to invent, which is what passing looks like. And across all 90,000 simulated days there is not one negative.

The overlay tells the same story.

```r
# Redraw the overlay with the replicates from the log-scale model
plot(density(loaves), col = "black", lwd = 3,
     xlim = c(-20, 130), ylim = c(0, 0.045),
     main = "100 fake notebooks from the log-scale model",
     xlab = "Loaves sold in a day")

for (s in 1:100) lines(density(yrep_log[s, ]), col = "grey75", lwd = 1)
lines(density(loaves), col = "black", lwd = 3)
abline(v = 0, col = "red", lty = 2, lwd = 2)
```

Nothing crosses zero now, and the grey curves lean to the right the way the black one does. Through the shoulders and the whole of the right tail, the black curve sits inside the grey band.

It is not a perfect fit, and it is worth saying so. Most of the fakes still peak a little higher than Ravi's record does, which means they pile more of their days right at the most common value, while his are spread a little more evenly through the middle. A check that comes back clean says the model reproduces the feature you tested. It never says the model is true.

[KEY INSIGHT]
A failed check is a lead, not a verdict. This one said the model invents negative days and cannot reach the big ones, which names the fault as shape, and shape was fixable in one line. Read what the failure is made of before reaching for a fancier model.

=== step === widget
## What a passing check looks like beside a failing one

Ravi's model failed on one statistic and then passed on it, and that move is worth seeing once more on a different shop, because the two outcomes look so unlike each other side by side.

This shop sells a specialist item, and on plenty of days it sells none at all. There are sixty days of counts, and fifteen of them are zeros. The statistic under check is that count: how many zero days does a fake dataset contain?

Toggle between the two model families and watch where the observed line lands.

::widget ppc-overlay {}

Under the Normal fit the replicates average about eight zero days and hardly ever reach fifteen, so the observed line stands out in the tail and the p-value falls close to zero. Switch to the Poisson, which is a distribution built for counts, and the replicates cluster around eleven or twelve. Fifteen is now inside the crowd, and the p-value climbs into the ordinary middle of the range.

It is the same data and the same statistic, with two model families. The check is not scoring the data. It is scoring the model's ability to invent data like it.

=== step === concept
## The one line you would actually run: pp_check()

Everything so far was done by hand so you could watch what the check is made of. At work you would not write that loop. You would fit the model with `brms` and call one function.

`posterior_predict()` builds exactly the `yrep` matrix you built yourself: one row per posterior draw, one column per observation. `pp_check()` draws exactly the overlay you drew, and with `type = "stat"` it draws exactly the statistic histogram.

`brms` compiles a Stan program, which needs a real toolchain, so this block does not run on the page. Copy it into your own R session.

```r-static
# The same two checks on Ravi's loaves, done the way you would do them at work
library(brms)

bakery <- data.frame(loaves = loaves)

fit <- brm(loaves ~ 1, data = bakery, family = gaussian(),
           chains = 4, iter = 2000, seed = 11)

yrep_brms <- posterior_predict(fit)          # 4000 by 90, the same object as before
dim(yrep_brms)

pp_check(fit, ndraws = 100)                  # the grey over black overlay
pp_check(fit, type = "stat", stat = "max")   # the busiest day check
```

The log scale version is `family = lognormal()` on the raw loaves, which takes the logs and brings the replicates back for you.

`pp_check()` takes a `type` argument with a long list of options behind it. Two of them carry most of the work: `dens_overlay`, which is the default and gives you the overall shape, and `stat`, which gives you one statistic you nominate. Nominate a statistic the model was not fitted on, and you get a check that can actually fail.

=== step === quiz
## Quick check: reading a check that came back at 0.006

The busiest day check on the first, symmetric model came back at 0.006. What does that number tell you?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- There is a 0.6% chance that the model is the wrong model. ::no
- Only about 6 in 1,000 datasets the model invents hold a day as busy as Ravi's best, so what the model is missing is his long right tail. ::ok Exactly. It is a statement about what the model can produce, and the thing it cannot produce is the top end of the record.
- Ravi's 112 loaf day is an outlier and should be dropped before refitting. ::no
- The model fits badly overall, which the mean check would have shown just as well. ::no A posterior predictive p-value is not the probability that the model is wrong, and it is not a reason to delete a real day of sales. It says how often the model invents a value as extreme as the one you measured. And the mean check would never have caught this: it came back at 0.517, because the model was fitted on the mean.

=== step === tryit
## Your turn: how quiet is the quietest day in a fake bakery?

You have checked the busiest day. Now check the other end of the record.

`yrep` still holds the thousand fake notebooks from the first, symmetric model, ninety days to a row. Ravi's quietest day in ninety was 14 loaves. Count how many of the thousand fake notebooks contain a day at or below that.

Watch the direction as you write it. For the busiest day, as extreme or worse meant at or above. For the quietest day it means at or below, so the comparison flips.

```r
# yrep holds 1,000 fake notebooks, 90 days to a row, from the first model.
# Ravi's quietest day is min(loaves), which is 14 loaves.
# Take the quietest day of every fake notebook, then count how many of those
# come in at or below 14. Write that count as a share as well.
# Press Check when you have it.
```
::check {"regex": "apply[(]\\s*yrep\\s*,\\s*1\\s*,\\s*min[\\s\\S]*<=\\s*(min[(]loaves[)]|14)", "gate": true, "difficulty": "intermediate", "ok": "That is it: 985 of the 1,000, a share of 0.985. The quietest day in a typical fake bakery is 0 loaves, so being unable to stay busy enough and being unable to stay quiet enough turn out to be the same fault seen from opposite ends.", "no": "Build the row minima first, then compare them: apply(yrep, 1, min) gives the quietest day of every fake notebook, and you want the ones at or below min(loaves)."}
::solution
```r
# Count the fake notebooks whose quietest day is at or below Ravi's quietest day
rep_min <- apply(yrep, 1, min)

sum(rep_min <= min(loaves))
#> [1] 985
mean(rep_min <= min(loaves))
#> [1] 0.985
round(median(rep_min), 1)
#> [1] 0
```

985 of the thousand invent a day quieter than Ravi ever had, and the median fake bakery has a quietest day of zero loaves. Written in the same direction as the earlier checks, as the share of fakes whose quietest day reaches 14 or higher, that is 1 minus 0.985, or 0.015.

So the two ends agree: 0.006 at the top, 0.015 at the bottom. One symmetric distribution was stretched over sales that are neither symmetric nor free to go below zero, and it fails at both edges for the same reason.

=== step === concept
## References

- [Posterior predictive assessment of model fitness via realized discrepancies](http://www.stat.columbia.edu/~gelman/research/published/A6n41.pdf) - Gelman, Meng and Stern (1996), Statistica Sinica 6(4), 733-807. The paper that defines the posterior predictive p-value you just computed.
- [Bayesian Data Analysis, third edition](https://www.stat.columbia.edu/~gelman/book/) - Gelman, Carlin, Stern, Dunson, Vehtari and Rubin (2013). Chapter 6, Model checking, and the source of the closed form normal posterior used here.
- [Visualization in Bayesian workflow](https://doi.org/10.1111/rssa.12378) - Gabry, Simpson, Vehtari, Betancourt and Gelman (2019), Journal of the Royal Statistical Society A 182(2), 389-402. What the overlay and the statistic plots show, and how to read them.
- [Graphical posterior predictive checks using the bayesplot package](https://mc-stan.org/bayesplot/articles/graphical-ppcs.html) - Gabry and Mahr. The full catalogue of plot types sitting behind `pp_check()`.
- [pp_check.brmsfit](https://paul-buerkner.github.io/brms/reference/pp_check.brmsfit.html) - Buerkner. The `type` argument and every option it accepts.

=== step === complete
## Quick recap

You started with a model whose summary looked perfectly healthy, and inside five minutes you knew it was the wrong shape for the data. The whole procedure was this:

- Take the posterior draws. Each one is a complete version of the bakery the model still finds plausible.
- Let every draw invent a full dataset the same size as yours. A thousand draws gave a thousand fake notebooks of ninety days each.
- Lay the fakes over the real record. Half of them held a day of negative sales. Ravi's record never did.
- Pick a statistic nobody fitted. The mean passed at 0.517 and the spread at 0.500 because the model was fitted on exactly those. The busiest day failed at 0.006.
- Read what the failure names. Negative days and a symmetric shape, set against sales that are positive and lopsided.
- Change the model and check again. On the log scale the same check came back at 0.39, with not one negative day in 90,000.

At work that is `pp_check(fit)` for the overlay and `pp_check(fit, type = "stat", stat = "max")` for the statistic, on a model fitted with `brm()`.

The habit worth keeping costs you almost nothing. After every fit, ask the model to invent some data, and look hard at what it invents. A model that cannot produce data like yours has not described your data, whatever its summary says.
