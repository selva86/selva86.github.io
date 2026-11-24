---
title: "Bayesian Data Analysis Lesson 5: Checking a Bayesian model before and after"
catalog_blurb: "Catch a bad prior before it sees data, and a bad model after."
description: "A store's 60 days of refund counts show how a prior can quietly imply impossible data, and how a fitted model can be checked against what it should reproduce."
keywords: "prior predictive check, posterior predictive check, Bayesian workflow, Gamma-Poisson model, conjugate prior, test statistic, p-value, Bayesian model checking, posterior predictive p-value, R"
post_type: "LESSON"
curriculum_id: "4.110.5"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "res-bayes"
course_title: "Bayesian Data Analysis"
course_lesson: "5"
course_total: "8"
course_landing: "Bayesian-Data-Analysis-Course.html"
course_next: "Comparing-Models-by-Predictive-Accuracy"
course_prev: "Partial-Pooling-and-the-Shrinkage-It-Buys"
---

=== step === cover
## Checking a Bayesian model before and after

Today let's understand how to check a Bayesian model: once before any data arrive, and once after you have fitted it.

A small online store ships about 45 orders a day. Over its most recent 60 trading days, it logged 61 refund requests in total: 22 days with none, 22 days with one, 9 days with two, and 7 days with three, its busiest day.

Here is that same count plotted, one bar for each number of refund requests a day could bring.

::widget chart-plotter {"data":[{"x":0,"y":22},{"x":1,"y":22},{"x":2,"y":9},{"x":3,"y":7}],"geoms":["bar"],"x":"refund_count","y":"days"}

Most days bring zero or one refund request, and the bars thin out fast as the count climbs toward three.

=== step === concept
## A Poisson likelihood, a Gamma prior, and two checks at two different times

Start with the model this lesson uses for the store's daily refund counts.

A day's refund count is modeled as a Poisson random variable with rate lambda: the chance of seeing exactly k refund requests on a day is

\[ P(Y = k \mid \lambda) = \frac{\lambda^k e^{-\lambda}}{k!} \]

Lambda is the Poisson rate, the average number of refund requests the store expects on an ordinary day. It is the one number in this model nobody knows for certain, and it is what both checks in this lesson examine.

Before any data arrive, lambda itself gets a prior distribution, a Gamma distribution with two numbers, a shape and a rate, that sets out where lambda probably sits.

\[ \lambda \sim \text{Gamma}(\text{shape} = a,\ \text{rate} = b), \qquad \text{mean} = \frac{a}{b}, \qquad \text{variance} = \frac{a}{b^2} \]

This lesson runs two checks on that setup, at two different points in time. The prior predictive check runs before any data arrive: it draws a lambda from the prior alone, simulates a day's count from it, and asks whether the result is even plausible. The posterior predictive check runs after the model is fitted: it draws a lambda from the posterior, simulates a full replicate dataset from it, and compares that replicate against the real 60 days.

Both checks share the same move. Simulate data from the model, then compare it to something real or plausible, rather than trusting a formula alone to show the model is fine.

=== step === concept
## A prior called vague: Gamma(0.001, 0.001), and what simulating from it shows

A common instinct when you do not want to bias a Bayesian model is to pick a prior with tiny shape and rate numbers, reasoning that small numbers mean "I hardly know anything." Try shape = 0.001 and rate = 0.001.

Plugging those into the mean and variance formulas from the last step gives \( \text{mean} = 0.001/0.001 = 1 \) and \( \text{variance} = 0.001/0.001^2 = 1000 \). A variance of 1000 means a standard deviation near 31.6, enormous next to a mean of 1. That already sounds wide, but the real test of a prior is not its mean and variance. It is what it implies about the data.

Draw 4000 values of lambda from this prior, and simulate one day's refund count from each one with `rpois()`. This is the prior predictive check: before any real data arrive, what kind of day does this prior make plausible?

Press Run and look at the three numbers that answer that.

```r
# Draw lambda 4000 times from the vague Gamma(0.001, 0.001) prior, then simulate one day's refund count from each draw
set.seed(101)
lambda_vague <- rgamma(4000, 0.001, 0.001)
counts_vague <- rpois(4000, lambda_vague)
max(counts_vague)
sum(counts_vague > 20)
sum(counts_vague > 100)
```
```
#> [1] 981
#> [1] 15
#> [1] 6
```

The highest simulated day reaches 981 refund requests. 15 of the 4000 simulated days exceed 20 requests, and 6 of them, 0.15%, exceed 100 requests in a single day, more refund requests than the store's entire daily order volume of about 45.

That is the prior predictive check doing its job. Before a single real observation arrived, this prior already implied days that cannot happen. A prior is not a neutral starting point waiting to be overridden by data; it is itself a claim about what the data could look like, and "I hardly know anything" turned into a claim this extreme.

=== step === concept
## A weakly informative prior that stays inside what's possible

A prior that implies impossible data needs to be replaced, not patched. Try shape = 2 and rate = 1 instead, a prior centred on the idea that the store sees around 2 refund requests on an average day, give or take.

Its mean is \( 2/1 = 2 \) and its variance is \( 2/1^2 = 2 \), so its standard deviation is about 1.41. That is much tighter than before, but the real test is still the same: simulate from it and see what comes out.

```r
# Draw lambda 4000 times from the weakly informative Gamma(2, 1) prior, then simulate one day's refund count from each draw
set.seed(102)
lambda_sensible <- rgamma(4000, 2, 1)
counts_sensible <- rpois(4000, lambda_sensible)
max(counts_sensible)
sum(counts_sensible > 10)
quantile(counts_sensible, 0.99)
```
```
#> [1] 14
#> [1] 10
#> 99% 
#>   9 
```

The highest simulated day is 14, nowhere near the 981 the vague prior produced. Only 10 of the 4000 simulated days, 0.25%, exceed 10 requests, and 99% of the simulated days land at 9 requests or fewer. Every one of those numbers is a day the store could plausibly have.

That is what a weakly informative prior buys you. It still leaves room for the data to move lambda around, but it never treats hundreds of refund requests in a day as a reasonable possibility before any data have arrived.

=== step === quiz
## Quick check: what a vague prior actually implies

Before moving on, check what actually went wrong with the first prior.

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- A prior run forward through the likelihood already makes a claim about what a day's data will look like, and this prior's claim, routine days with hundreds of refund requests, was already wrong before any data arrived. ::ok Exactly. A prior is never just a quiet starting point. The moment you pair it with the likelihood and simulate, it is making a claim about data, and that claim can be checked before a single real observation shows up.
- The prior failed because the sample size, 60 days, was too small to trust it. ::no The prior predictive check never uses the sample size at all. It simulates one day at a time straight from the prior, with no n involved.
- A prior cannot be judged until it has been fitted to data. ::no That is the opposite of what a prior predictive check is for. It judges the prior before any fitting happens, which is the entire point of running it first.
- The prior failed because Gamma is the wrong family of distribution for a rate parameter. ::no The Gamma family is fine for a Poisson rate, and the next prior in this lesson is also a Gamma. Only this prior's particular shape and rate numbers, 0.001 and 0.001, were too diffuse.

=== step === concept
## Fitting the model: from Gamma prior to Gamma posterior

Now give the weakly informative prior something to update on: the store's 60 days of refund counts, the same ones summarised in the opening chart.

```r
# Build the 60 days of refund counts, then total them up
set.seed(5)
y <- rpois(60, 1.0)
sum(y)
table(y)
```
```
#> [1] 61
#> y
#>  0  1  2  3 
#> 22 22  9  7 
```

61 total requests over 60 days, split 22, 22, 9 and 7, the same four numbers from the opening chart.

For a Poisson likelihood and a Gamma(shape = a, rate = b) prior, Bayes' rule simplifies to a clean update rule: the posterior is again a Gamma distribution, with its shape raised by the sum of the data and its rate raised by the number of days observed.

\[ \text{posterior} = \text{Gamma}\left(a + \textstyle\sum y,\ \ b + n\right) \]

With the prior Gamma(2, 1) and 60 days summing to 61, the posterior shape is \( 2 + 61 = 63 \) and the posterior rate is \( 1 + 60 = 61 \).

```r
# Compute the posterior's shape and rate, then its mean and sd beside the prior's own
n <- length(y)
a_post <- 2 + sum(y)
b_post <- 1 + n
c(a_post = a_post, b_post = b_post)
round(c(posterior_mean = a_post / b_post, posterior_sd = sqrt(a_post) / b_post), 4)
round(c(prior_mean = 2, prior_sd = sqrt(2)), 4)
```
```
#> a_post b_post 
#>     63     61 
#> posterior_mean   posterior_sd 
#>         1.0328         0.1301 
#>     prior_mean       prior_sd 
#>         2.0000       1.4142 
```

The posterior mean, 1.0328, sits close to the data's own rate, 61 requests over 60 days, and far from the prior's mean of 2. The posterior standard deviation, 0.1301, is about a tenth the width of the prior's 1.4142. Sixty days of data carry far more information about lambda than the prior did, so the posterior narrows sharply and lands near what the data actually showed.

=== step === widget
## Watching the same prior-to-posterior pull with the widget's own numbers

The widget below runs a different update from the one you just computed by hand: a Normal belief updated by a batch of Normal-shaped data, not a Gamma prior updated by Poisson counts. But it is the same pull, mechanically. A prior and a batch of data combine into a posterior that sits somewhere between the two, closer to whichever one carries more weight.

Drag "prior confidence" up to its highest setting, and drag "data points n" up toward 60.

Once the data points slider reaches 60, the line beneath the chart changes to: "With this much data, the evidence dominates and the prior barely matters." That is the same thing you just watched happen by hand: a prior mean of 2 pulled by 60 days of data, whose own rate was 1.02, to a posterior mean of 1.03, far closer to the data than to the prior.

::widget bayes-update {}

=== step === concept
## The posterior predictive check: simulate after fitting, and compare to the real data

Now run the second check this lesson uses, the one that happens after fitting.

A posterior predictive check picks a test statistic, something computable from any dataset, then asks whether the real data's value for that statistic looks ordinary among replicate datasets simulated from the fitted model. Use the number of zero-request days in 60 as the test statistic. The real data had 22 of them.

```r
# Draw lambda from the posterior, simulate a replicate 60-day dataset from each draw, and count each replicate's zero-request days
set.seed(202)
lambda_post <- rgamma(3000, a_post, b_post)
zero_days <- sapply(lambda_post, function(l) sum(rpois(60, l) == 0))
round(mean(zero_days), 2)
range(zero_days)
round(mean(zero_days >= 22), 3)
```
```
#> [1] 21.66
#> [1]  6 37
#> [1] 0.502
```

Over 3000 replicate 60-day datasets, the number of zero-request days averages 21.66, ranging from 6 to 37. The real data's own count, 22, sits almost exactly at that average: 0.502 of the replicates have 22 or more zero-request days.

A posterior predictive p-value this far from either extreme says the fitted model reproduces this feature of the real data without strain. 22 zero-request days out of 60 is an ordinary outcome under this model, not a surprising one.

=== step === concept
## Repeating the check on a model you know is wrong, and watching it fail

A posterior predictive p-value near the middle feels reassuring, but on its own it only shows the check did not flag anything. To know whether the check can flag anything at all, run the identical check on a model already known to be wrong.

Fit a Normal distribution to the same 60 days instead of a Poisson, at the data's own mean and standard deviation, round each simulated value to the nearest whole number since the real counts are whole numbers, and run the exact same zero-day check.

```r
# Fit a Normal instead of a Poisson at the data's own mean and sd, then run the identical check
set.seed(303)
normal_stats <- replicate(3000, {
  day_counts <- round(rnorm(60, mean(y), sd(y)))
  c(zero_days = sum(day_counts == 0), negative_days = sum(day_counts < 0))
})
zero_days_normal <- normal_stats["zero_days", ]
round(mean(zero_days_normal), 2)
range(zero_days_normal)
round(mean(zero_days_normal >= 22), 3)
round(mean(normal_stats["negative_days", ]), 2)
```
```
#> [1] 14.24
#> [1]  4 27
#> [1] 0.016
#> [1] 3.86
```

The Normal-based replicates average only 14.24 zero-request days, ranging from 4 to 27. The real value, 22, now sits near the top of that range, so only 0.016 of the replicates reach 22 or more.

[NOTE]
The replicates also average 3.86 days with a negative refund count each. A count can never be negative, so the Normal model is simulating something that cannot happen even before the zero-day check runs.

The identical check that passed comfortably on the Poisson model, p = 0.502, fails clearly on the Normal model, p = 0.016. That contrast is the reason the earlier result is worth trusting. A check that always comes back reassuring regardless of the model would tell you nothing; this one just caught a model that does not belong here.

=== step === widget
## Seeing the same catch happen in the widget's own data

The widget below runs the identical kind of posterior predictive check, but on its own 60-observation dataset, with its own observed zero-count of 15, not the refund data above.

Switch the toggle from "Normal fit (wrong)" to "Poisson fit (right)" and watch the red observed line move.

Under the Normal fit, the widget reads: "The Normal replicates almost never reach 15 zeros (they average ~8), so the observed 15 lands far out in the tail." Switch to the Poisson fit, and it reads: "The Poisson replicates cluster around 11-12 zeros, and the observed 15 sits comfortably inside the crowd." That is the exact shift you just computed by hand with the refund data, the p-value moving from 0.016 under the wrong model to 0.502 under the right one.

::widget ppc-overlay {}

=== step === quiz
## Closing check: what a posterior predictive check does and doesn't prove

A posterior predictive check on the refund data returned p = 0.502. Which reading of that number is right?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- A posterior predictive p-value of 0.502 proves the fitted model is correct. ::no A mid-range p-value only means one chosen statistic looked ordinary under the model. The same check, run earlier in this lesson on a model already known to be wrong, returned p = 0.016, so an ordinary-looking result is never the same as a proven-correct model.
- That p-value, on its own, means only that the number of zero-days, the one statistic checked, is unremarkable under the fitted model. It says nothing about any statistic that was not checked, and the same kind of check, run earlier in this lesson on a Normal model, returned p = 0.016, which shows this method can also expose a real misfit when a model deserves it. ::ok Exactly. A posterior predictive check only ever speaks to the statistic it was handed. Watching the identical check fail on a model known to be wrong is what earns the mid-range result here its credibility.
- A posterior predictive check can never detect a wrong model, since the replicates are drawn from the posterior of that same model. ::no Earlier in this lesson is the direct counterexample. The identical machinery, run on a Normal model instead of a Poisson one, returned p = 0.016 and caught the misfit cleanly.
- The check only means something if you compare against a model you know is wrong every single time you run it. ::no That comparison was only needed here to demonstrate the check has power at all. Once you trust that a check of this kind can fail, you do not need to manufacture a wrong model every time you check a new one.

=== step === tryit
## Your turn: check the model against the busiest day, not the zero days

The posterior draws from earlier in this lesson are still in scope: `a_post` is 63 and `b_post` is 61. Run the same kind of posterior predictive check, but with a different test statistic: the highest single-day count in 60 days. The real data's busiest day had 3 refund requests.

Draw lambda from the posterior 3000 times, simulate a replicate 60-day dataset from each draw, and record the maximum of each replicate. That part is filled in below. Finish it by computing the share of the 3000 replicates whose maximum is 3 or less.

```r
# Draw lambda from the posterior again, simulate a replicate dataset from each draw, and record each replicate's busiest day
set.seed(404)
lambda_post2 <- rgamma(3000, a_post, b_post)
busiest_day <- sapply(lambda_post2, function(l) max(rpois(60, l)))
table(busiest_day)
mean(busiest_day)

# Your code: what share of the 3000 replicates have a busiest day of 3 or less?
```
::check {"regex": "mean[(]busiest_day\\s*<=\\s*3[)]", "gate": true, "difficulty": "intermediate", "ok": "Right: about 0.292. Close to 3 in 10 of the 3000 replicate datasets have a busiest day of 3 or less, so the busiest day in the real data, also 3, is an ordinary outcome under this model too.", "no": "Count the same way the zero-day check earlier in this lesson did, just with busiest_day and the opposite direction: mean(busiest_day <= 3)."}
::solution
```r
# Compute the share of the 3000 replicates with a busiest day of 3 or less
mean(busiest_day <= 3)
```
```
#> [1] 0.292
```

=== step === concept
## References
::prose-only the sources are text, not a visual

- [Sampling and Bayes' Inference in Scientific Modelling and Robustness](https://www.jstor.org/stable/2982063) - Box, G.E.P. (1980), Journal of the Royal Statistical Society, Series A, 143(4), 383 to 430. The paper that introduced checking a model against data it has not yet seen.
- Gelman, A., Meng, X.L., Stern, H. (1996). Posterior Predictive Assessment of Model Fitness via Realized Discrepancies. Statistica Sinica, 6(4), 733 to 760. The paper behind the posterior predictive check this lesson runs by hand.
- [Bayesian Data Analysis, 3rd edition](http://www.stat.columbia.edu/~gelman/book/) - Gelman, A., Carlin, J.B., Stern, H.S., Dunson, D.B., Vehtari, A., Rubin, D.B. (2013), CRC Press, Chapter 6. The standard reference for both checks in this lesson.
- [Visualization in Bayesian Workflow](https://doi.org/10.1111/rssa.12378) - Gabry, J., Simpson, D., Vehtari, A., Betancourt, M., Gelman, A. (2019), Journal of the Royal Statistical Society, Series A, 182(2), 389 to 402.
- [The Bayesian Choice, 2nd edition](https://link.springer.com/book/10.1007/0-387-71599-1) - Robert, C.P. (2007), Springer. Background on the Gamma-Poisson conjugate update used in this lesson.

=== step === complete
## Checking a Bayesian model before and after

A prior predictive check simulates from the prior alone, before any data arrive, and catches a prior that quietly implies impossible data. The vague Gamma(0.001, 0.001) prior failed that check by implying days with hundreds of refund requests; the weakly informative Gamma(2, 1) prior passed it by staying under 14.

A posterior predictive check simulates from the fitted posterior, after the model has seen the real data, and catches a model that does not reproduce a real feature of that data. The Poisson model passed it on the number of zero-request days, p = 0.502; the Normal model, run through the identical check, failed it, p = 0.016.

Both checks share one habit: simulate data from the model, then compare it to something real or plausible, rather than trusting a formula alone to show the model is fine. And a passing check only means something once you have also watched the identical check fail on a model known to be wrong, the way the Normal model failed it here.
