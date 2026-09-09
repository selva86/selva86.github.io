---
title: "Credible vs confidence intervals: the difference that matters"
slug: "Bayesian-Mini-4"
description: "Build a 95% confidence interval and a Bayesian credible interval on the same delivery data, and learn exactly what each one lets you claim about the mean."
keywords: "credible interval vs confidence interval, Bayesian credible interval, confidence interval meaning, posterior distribution, prior distribution, coverage probability, Bayesian inference in R"
mathjax: false
webr: true
date: "2026-09-09"
post_type: "LESSON"
course_id: "bayesian-decisions"
course_title: "Bayesian Decisions"
course_lesson: "4"
course_total: "9"
course_landing: "/dashboard.html"
course_prev: "Bayesian-Mini-3"
course_next: "Bayesian-Mini-5"
curriculum_id: "0.0.35"
lesson_access: "windowed"
catalog_blurb: "What a 95 percent credible interval lets you claim that a confidence interval cannot."
---

=== step === cover
## Credible vs confidence intervals: the difference that matters

Today let's understand the real difference between a confidence interval and a Bayesian credible interval, and why one of them can say something the other simply cannot.

A delivery chain just opened its newest kitchen. The manager timed the first 25 orders, and they came in anywhere from about 4 minutes to 47 minutes, averaging around 26 minutes. She wants a sensible range for the true average delivery time at this kitchen, one she can hand to the ops team.

There are two different ways to build that range. They can look almost identical on the page and still say very different things.

Only three moves get you there:

::widget process-flow {"steps":[{"title":"Build the confidence interval","sub":"the classic range, computed with t.test()"},{"title":"Build the credible interval","sub":"a posterior for the true mean, built from a prior and the data"},{"title":"Compare them","sub":"where the two ranges agree, and where they pull apart"}]}

That's the plan above. Everything from here on is just working through it, one move at a time.

=== step === concept
## Two 95% intervals for the same delivery data

Let's build the data first, since every number from here on comes from these same 25 orders.

```r
# Build the 25-order delivery sample and its summary stats
set.seed(21)
delivery <- round(rnorm(25, mean = 26, sd = 9.5), 1)

round(mean(delivery), 2)
#> [1] 26.24
round(sd(delivery), 2)
#> [1] 10.26
```

`rnorm(25, mean = 26, sd = 9.5)` simulates 25 delivery times, as if the kitchen's true average were 26 minutes with that much order-to-order spread. `set.seed(21)` just fixes the random draw, so your 25 numbers come out identical to the ones used here.

The 25 orders average 26.24 minutes, with a standard deviation of 10.26 minutes.

Now build two different 95% ranges for the true average delivery time, on this same data.

```r
# Compute a classical confidence interval and a flat-prior credible interval
conf_interval <- as.numeric(t.test(delivery)$conf.int)
se <- sd(delivery) / sqrt(length(delivery))
credible_interval <- qnorm(c(0.025, 0.975), mean = mean(delivery), sd = se)

round(conf_interval, 2)
#> [1] 22.01 30.47
round(credible_interval, 2)
#> [1] 22.22 30.26
```

`t.test()` returns the classical **confidence interval**, using the formula every stats course teaches: the sample mean, plus and minus roughly two standard errors. The second block builds a **credible interval** a different way. It treats the sample mean as the centre of a Normal curve for the true average, with the standard error as that curve's spread, then reads off the middle 95% of that curve with `qnorm()`.

22.01 to 30.47 minutes. 22.22 to 30.26 minutes. Nearly the same range, off by about a fifth of a minute at each end.

So if both intervals land in almost the same place, why bother with two methods? Because the number is not the whole story. What each interval actually lets you claim about that number turns out to be very different, and that difference is the whole point.

=== step === concept
## What does a 95% confidence interval actually promise?

Here's the part almost everybody gets wrong, including people who use confidence intervals all the time.

It's tempting to look at 22.01 to 30.47 minutes and say: there is a 95% probability the true average delivery time falls in that range. That sounds so natural that most people say exactly that. But a confidence interval does not say that.

So what does it actually say? The true average delivery time is a fixed number. It already exists, whatever it happens to be. It is not random, so it either already sits inside 22.01 to 30.47 or it does not. There is no probability left to talk about, once you are looking at one already-computed interval.

What "95% confidence" actually describes is the procedure that built the interval, not this one result of it. Imagine you do not run this study once. You run it 2000 times, on 2000 different fresh batches of 25 orders, each drawn from a kitchen whose true average delivery time is genuinely fixed at 26 minutes and whose true spread is 10 minutes. Each time, you build a fresh `t.test()` interval. About 95% of those 2000 intervals should end up containing 26. Let's check that directly, instead of taking it on faith.

```r
# Simulate 2000 fresh samples and check how often the CI captures the true mean
set.seed(2026)
true_mean <- 26
true_sd <- 10
n <- 25
reps <- 2000

hits <- 0
for (i in 1:reps) {
  sample_i <- rnorm(n, mean = true_mean, sd = true_sd)
  ci_i <- t.test(sample_i)$conf.int
  if (ci_i[1] <= true_mean && true_mean <= ci_i[2]) {
    hits <- hits + 1
  }
}

hits
#> [1] 1895
hits / reps
#> [1] 0.9475
```

This loop draws a brand-new 25-order sample 2000 times, from a kitchen whose true average delivery time has been fixed at exactly 26 minutes. Each time it builds a `t.test()` confidence interval and checks whether 26 fell inside it. Out of 2000 tries, 1895 of the intervals captured the true mean. That is a **coverage rate** of 94.75%, close to the nominal 95%.

That coverage rate, not any single interval, is what "95% confidence" means. It is a statement about how often the procedure works, checked over many repeats. It says nothing about whether this one particular interval, 22.01 to 30.47, is one of the roughly 95% that got it right, or one of the roughly 5% that missed.

[KEY INSIGHT]
A confidence interval's 95% is a property of the procedure, verified by running it thousands of times. It is not a probability statement about the one interval sitting in front of you.

So if a confidence interval cannot tell you the probability the true mean sits in a given range, is there a range that can? Yes. Building one is next.

=== step === concept
## How is a credible interval actually built?

A credible interval starts from a completely different place: Bayes' rule.

Bayesian inference treats the true average delivery time itself as something you hold a belief about, and updates that belief once you see data. You start with a **prior**, which is what you believe about the true mean before looking at the 25 orders. You combine that prior with the data through the **likelihood**, how probable the data is for each possible value of the true mean. What comes out the other end is the **posterior**, your updated belief about the true mean after the data is taken into account.

In words: the posterior is proportional to the likelihood times the prior. The data pulls your belief toward what it shows, and the prior is how much that pull gets resisted.

Start with a flat prior, one that barely leans anywhere, so the posterior comes out almost entirely from the data.

::widget bayes-update {"priorMean":26,"priorSD":20,"dataMean":26.24,"dataSD":10.26,"n":25}

Drag the widget and watch what happens. With a prior this wide, a standard deviation of 20 minutes that barely commits to anything, the posterior curve sits almost exactly on top of the data. With a flat, uninformative prior, the data almost entirely determines the posterior.

When the prior is this flat, the posterior for the true mean works out to a Normal distribution centred at the sample mean, with the standard error as its spread, the exact same two numbers already used to build the credible interval.

```r
# Posterior mean and sd under a flat prior, and the resulting credible interval
posterior_mean <- mean(delivery)
posterior_sd <- sd(delivery) / sqrt(length(delivery))
credible_interval <- qnorm(c(0.025, 0.975), mean = posterior_mean, sd = posterior_sd)

round(posterior_mean, 2)
#> [1] 26.24
round(posterior_sd, 2)
#> [1] 2.05
round(credible_interval, 2)
#> [1] 22.22 30.26
```

The same 22.22 to 30.26 minutes as before, now built from first principles instead of a formula you just had to trust.

This is where the credible interval becomes genuinely useful. Because you now have an actual posterior distribution for the true mean, you can work out the answer to any probability question you like, not just "what is the middle 95%?"

```r
# Probability the true average delivery time is above 24 minutes
prob_above_24 <- pnorm(24, mean = posterior_mean, sd = posterior_sd, lower.tail = FALSE)

round(prob_above_24, 3)
#> [1] 0.863
```

`pnorm(24, ..., lower.tail = FALSE)` reads the posterior curve above 24. The answer: there is an 86.3% probability the true average delivery time at this kitchen is above 24 minutes.

That is a real, direct probability statement about the true mean itself. Nothing in a confidence interval can say that. A confidence interval only ever describes how a repeated procedure behaves, so no probability exists for any particular value of the true mean, not 24, not any other number. Once you have the posterior, you can answer as many of these questions as you want.

=== step === concept
## When a strong prior pulls the answer

A flat prior barely commits to anything. But real priors usually do, and that changes the answer.

Say the delivery chain has run dozens of other kitchens for years, and across thousands of orders those kitchens settle in around 25 minutes on average. That is real, useful information about this new kitchen, before it ever fried an onion. Encode it as a prior: Normal, with a mean of 25 and a standard deviation of 3 minutes, meaning you are fairly confident the true average sits close to 25, but not certain.

::widget bayes-update {"priorMean":25,"priorSD":3,"dataMean":26.24,"dataSD":10.26,"n":25}

Drag the prior's confidence higher this time, and watch the posterior slide toward the prior and pull in tighter around it. A prior this confident does not just sit there. It pulls the answer, and it narrows it.

The posterior mean becomes a weighted average of the prior mean and the sample mean, weighted by how confident each one is. Compute it on the same 25 orders.

```r
# Combine the informative prior with the 25-order sample
prior_mean <- 25
prior_sd <- 3
sample_mean <- mean(delivery)
sample_sd <- sd(delivery)
n <- length(delivery)

posterior_var <- 1 / (1 / prior_sd^2 + n / sample_sd^2)
posterior_mean <- posterior_var * (prior_mean / prior_sd^2 + n * sample_mean / sample_sd^2)
posterior_sd <- sqrt(posterior_var)
credible_interval <- qnorm(c(0.025, 0.975), mean = posterior_mean, sd = posterior_sd)

round(posterior_mean, 2)
#> [1] 25.84
round(posterior_sd, 2)
#> [1] 1.69
round(credible_interval, 2)
#> [1] 22.53 29.16
```

The posterior mean lands at 25.84 minutes, pulled down from the data's own 26.24 toward the prior's 25. The credible interval narrows to 22.53 to 29.16 minutes, tighter than the flat-prior interval's 22.22 to 30.26. Combining two sources of information, the chain's long history and this kitchen's own 25 orders, leaves you more certain than either source alone.

A confidence interval has no room for this. There is no slot in `t.test()` for what you already believed about other kitchens. A credible interval can hold that information, and a confidence interval cannot.

=== step === quiz
## Quick check: reading the credible interval

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- There is a 95% probability the true average delivery time falls between 22.01 and 30.47 minutes, the range from t.test(). ::no A confidence interval cannot support that sentence. That range came from the classical procedure, and its 95% describes how often the procedure works over repeated samples, not a probability about this one interval.
- There is a 95% probability the true average delivery time falls between 22.53 and 29.16 minutes, the narrower range pulled toward 25 by the informative prior. ::ok Exactly right. That is the posterior's middle 95%, and once you have a posterior, a direct probability statement about the true mean is exactly what it is for.
- There is a 95% probability the true average delivery time falls between 22.22 and 30.26 minutes, since that is the credible interval for this kitchen. ::no That was the flat-prior credible interval, from before the chain's history was folded in. Once an informative prior enters the picture, the posterior and its interval move, to 25.84 and 22.53 to 29.16, not the flat-prior numbers.
- There is a 95% probability that a single order at this kitchen takes between 22.53 and 29.16 minutes. ::no Both intervals in this lesson are about the true average delivery time, not any one order. A single order can easily land outside that range. The 25 individual orders ranged from about 4 to 47 minutes.

=== step === concept
## Why small samples need extra care

Everything so far used 25 orders. What happens with far fewer?

Say a second, brand-new zone just opened, and it only has 5 timed orders on record: 35, 18, 47, 22, and 29 minutes.

```r
# Build the small 5-order sample and its summary stats
new_zone <- c(35, 18, 47, 22, 29)

mean(new_zone)
#> [1] 30.2
round(sd(new_zone), 2)
#> [1] 11.43
```

Build both intervals the same way as before: a `t.test()` confidence interval, and a flat-prior credible interval using `qnorm()` on the sample mean and standard error.

```r
# Build a confidence interval and a flat-prior credible interval on 5 orders
conf_interval_small <- as.numeric(t.test(new_zone)$conf.int)
se_small <- sd(new_zone) / sqrt(length(new_zone))
credible_interval_small <- qnorm(c(0.025, 0.975), mean = mean(new_zone), sd = se_small)

round(conf_interval_small, 1)
#> [1] 16.0 44.4
round(credible_interval_small, 2)
#> [1] 20.18 40.22
```

16.0 to 44.4 minutes for the confidence interval. 20.18 to 40.22 minutes for the credible interval. This time the two ranges are not close at all. The confidence interval is 28.39 minutes wide. The credible interval is only 20.04 minutes wide, close to a third narrower.

So why the gap this time, when 25 orders barely showed one? `t.test()` does not use a Normal curve to build its interval. It uses the **t-distribution**, which has fatter tails than the Normal, and gets fatter still the fewer data points you have. With only 5 orders, `t.test()` uses a t-distribution with 4 **degrees of freedom**, one less than the sample size, and that curve's tails are noticeably heavier than a Normal's.

Why does that matter here? Because with only 5 points, you are not just uncertain about the true mean, you are also quite uncertain about the true standard deviation itself, since you estimated it from just 5 numbers. The t-distribution's fatter tails are the honest price of that extra uncertainty.

The flat-prior credible interval built the earlier way does not pay that price. It plugs the sample standard deviation straight into a Normal curve, as if that standard deviation were the one true, known value. With 25 orders that shortcut barely matters. With 5 orders it understates how uncertain you really are, and the interval comes out too narrow.

[NOTE]
This is not a flaw unique to Bayesian methods. A more careful credible interval, one built with a proper prior on the unknown standard deviation too, would widen out and land close to the t-based interval. The simple flat-prior version skips that step, and on a small sample, that shortcut shows.

So on a small sample, reach for the interval that accounts for the extra uncertainty honestly, and treat a naive credible interval's narrowness with some suspicion.

=== step === concept
## Which interval should you reach for?

By now you have seen both intervals built, and where they agree and where they do not. So which one should you actually use?

Reach for the confidence interval when you do not have a defensible prior to bring in, or when your audience expects the standard frequentist result. It is the one most people already know how to read, even if they usually misread it.

Reach for the credible interval when you do have real prior information worth using, like the delivery chain's history from other kitchens, or when you need to answer a direct probability question, like "what's the probability the mean is above 24?" A confidence interval has no probability to give for that, no matter how you phrase it.

Often, though, the choice does not even change the decision you make. Here's a shortcut worth knowing: if both intervals agree on the answer to the actual business question, you do not need to referee which philosophy is more correct. Check both of the earlier intervals against two candidate targets for the delivery chain.

```r
# Check whether both intervals clear two candidate delivery-time targets
conf_interval <- as.numeric(t.test(delivery)$conf.int)
se <- sd(delivery) / sqrt(length(delivery))
credible_interval <- qnorm(c(0.025, 0.975), mean = mean(delivery), sd = se)

conf_interval[1] > 20
#> [1] TRUE
credible_interval[1] > 20
#> [1] TRUE

conf_interval[1] > 23
#> [1] FALSE
credible_interval[1] > 23
#> [1] FALSE
```

Against a 20-minute target, both lower bounds clear it, both intervals say TRUE, the kitchen is reliably averaging more than 20 minutes. Against a tighter 23-minute target, both lower bounds fall short, both say FALSE. Either way, the two philosophies produce the exact same business decision.

That is the **same-decision shortcut**. When a confidence interval and a credible interval agree on whether a target is cleared, you can report either one and the decision does not change. Save the philosophical debate for the cases where they actually disagree, like the small-sample zone with only 5 orders.

=== step === quiz
## Quick check: reading both intervals together

In the 5-order sample, the confidence interval, 16.0 to 44.4 minutes, came out noticeably wider than the flat-prior credible interval, 20.18 to 40.22 minutes. Why?

::quiz {"correct": 3, "gate": true, "difficulty": "advanced"}
- Credible intervals are always narrower than confidence intervals, so this is exactly what you would expect. ::no The very first pair of intervals showed the opposite pattern: on 25 orders, the two intervals were nearly identical, with the confidence interval barely wider. Which one is wider depends on the situation, not on a fixed rule.
- The confidence interval must be wrong here, since with real data you should always trust the credible interval more. ::no Neither interval is wrong. The confidence interval is doing exactly what t.test() is built to do on 5 points. The credible interval is the one taking a shortcut here, by treating the sample standard deviation as known.
- The confidence interval is wider because it uses the t-distribution, which accounts for the extra uncertainty of estimating the standard deviation from only 5 points. ::ok Exactly. With so few points, you are unsure about the spread as well as the mean, and the t-distribution's fatter tails are the honest cost of that. The simple credible interval used here skips that step.
- The intervals differ because the confidence interval was built from a different sample than the credible interval. ::no Both intervals in this comparison were built from the exact same 5 orders. The gap comes from how each method handles the uncertainty in that one small sample, not from different data.

=== step === tryit
## Your turn: build both intervals on a new dataset

A third zone has been open longer, with 15 timed orders on record.

```r
# zone3 holds 15 timed orders from the third delivery zone
zone3 <- c(17.3, 35.1, 14.0, 24.6, 37.7, 19.2, 20.2, 18.9, 21.7, 25.1,
           33.8, 17.6, 15.4, 22.7, 15.4)

# Build the t.test() confidence interval on zone3
# Build the flat-prior credible interval on zone3 with qnorm(),
# using mean(zone3) and sd(zone3) / sqrt(length(zone3))
# Check whether each interval's lower bound clears a 20-minute target
```
::check {"regex": "(?=[\\s\\S]*t[.]test)(?=[\\s\\S]*qnorm)(?=[\\s\\S]*[><]=?\\s*20)", "gate": true, "difficulty": "intermediate", "ok": "Right: the confidence interval runs 18.44 to 26.72 minutes and the credible interval runs 18.80 to 26.36 minutes. Both lower bounds sit below 20, so neither interval clears the target, and the choice between them does not change that answer.", "no": "Build the interval with t.test(zone3)$conf.int, then the credible interval with qnorm(c(0.025, 0.975), mean = mean(zone3), sd = sd(zone3) / sqrt(length(zone3))), and compare each interval's lower bound to 20 with >."}
::solution
```r
# Build both intervals on zone3 and check them against the 20-minute target
conf_interval3 <- as.numeric(t.test(zone3)$conf.int)
se3 <- sd(zone3) / sqrt(length(zone3))
credible_interval3 <- qnorm(c(0.025, 0.975), mean = mean(zone3), sd = se3)

round(conf_interval3, 2)
#> [1] 18.44 26.72
round(credible_interval3, 2)
#> [1] 18.80 26.36

conf_interval3[1] > 20
#> [1] FALSE
credible_interval3[1] > 20
#> [1] FALSE
```

Neither interval clears the 20-minute target, and both philosophies agree on that. The same-decision shortcut, right where you would want it.

=== step === concept
## References
::prose-only a reference list needs no visual

- [Credible interval](https://en.wikipedia.org/wiki/Credible_interval) - Wikipedia.
- [Confidence interval](https://en.wikipedia.org/wiki/Confidence_interval) - Wikipedia.
- [The Fallacy of Placing Confidence in Confidence Intervals](https://doi.org/10.3758/s13423-015-0947-8) - Morey, Hoekstra, Rouder, Lee, Wagenmakers (2016), Psychonomic Bulletin & Review, 23(1), 103-123.
- [t.test: Student's t-Test](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/t.test.html) - R Core Team, the stats package reference documentation.
- [Frequentism and Bayesianism III: Confidence, Credibility, and why Frequentism and Science do not Mix](http://jakevdp.github.io/blog/2014/06/12/frequentism-and-bayesianism-3-confidence-credibility/) - VanderPlas, J.

=== step === complete
## Quick recap

Two 95% intervals, built on the same delivery data, that very nearly agreed at first:

- The confidence interval's 95% is a property of the procedure, not of any one interval. Run it thousands of times on fresh samples and about 95% of the intervals capture the true mean, the 2,000-repeat simulation landed at 94.75%.
- The credible interval's 95% is a direct probability statement, read straight off a posterior built from a prior and the data.
- A strong, informative prior pulls the posterior toward it and narrows the credible interval, something a confidence interval has no way to do.
- A small sample needs extra care. The t-distribution's fatter tails account for the added uncertainty of estimating the standard deviation from few points, and a simple flat-prior credible interval can understate that.
- When both intervals agree on a real decision, like clearing a delivery-time target, there is no need to referee which one is right. Report either, and move on.

Every time you see a range with "95%" attached to it from now on, you will know exactly what it is saying, and what it is not.
