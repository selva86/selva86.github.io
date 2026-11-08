---
title: "Probability and Estimation Lesson 4: Why averages go normal"
catalog_blurb: "Why sample averages turn bell shaped as n grows, and when they don't."
description: "The central limit theorem, checked by simulation: why a sample mean turns bell shaped as n grows, and the one population where averaging never helps at all."
keywords: "central limit theorem, sampling distribution of the mean, standard error, replicate, rexp, sample mean, R"
post_type: "LESSON"
curriculum_id: "4.10.4"
webr: true
mathjax: false
lesson_access: "free"
course_id: "res-probability"
course_title: "Probability and Estimation, from the ground up"
course_lesson: "4"
course_total: "7"
course_landing: "Probability-and-Estimation-Course.html"
course_next: "The-Sampling-Distribution-of-a-Statistic.html"
course_prev: "Counting-Outcomes-Binomial-and-Poisson.html"
---

=== step === cover
## Why averages go normal

Today let's understand why a sample average behaves so differently from the individual data points it is built from, and why that difference turns out to be one of the most useful facts in statistics.

Priya runs the front desk at a walk-in clinic. Every time a patient checks in, she notes the time, and when the doctor finally calls them in, she logs how many minutes they waited. Here is what one morning of 20 patients looked like.

::widget chart-plotter {"data":[{"x":1,"y":2.4},{"x":2,"y":7.9},{"x":3,"y":3.4},{"x":4,"y":0.5},{"x":5,"y":5.7},{"x":6,"y":17.6},{"x":7,"y":3.8},{"x":8,"y":4.9},{"x":9,"y":14.3},{"x":10,"y":8.6},{"x":11,"y":16.1},{"x":12,"y":28.9},{"x":13,"y":1.2},{"x":14,"y":0.7},{"x":15,"y":15},{"x":16,"y":3.7},{"x":17,"y":5.7},{"x":18,"y":7.5},{"x":19,"y":14.9},{"x":20,"y":4.4}],"geoms":["bar"],"x":"patient","y":"wait_minutes","code":{"bar":"ggplot(clinic, aes(factor(patient), wait_minutes)) +\n  geom_col()"}}

Most patients wait only a few minutes. A handful wait much longer, one even past 28 minutes. That long right-hand tail is what statisticians call right skewed, and it is the shape you see in wait times, incomes, and the gaps between calls at a support desk.

Here is the claim this lesson is going to test rather than just tell you about. Average the wait times of a group of patients instead of looking at one patient at a time, and that average behaves completely differently from the chart above: it settles into a bell shape, a bump in the middle that falls away evenly on both sides. That result has a name, the central limit theorem, and this lesson tests it directly instead of asking you to take it on faith.

=== step === concept
## The population we start from

Priya's 20 patients are a small sample. To talk about the clinic's wait times overall, you need the full population they came from: every patient who could possibly walk in, not just the 20 she happened to see that morning.

Wait times like these are commonly modelled with the exponential distribution, the standard distribution for how long you wait until something happens at a steady average rate, like a bus arriving or a patient being called in. Its only setting is that rate, and for Priya's clinic it works out to a mean wait of 12 minutes and, for this particular distribution, a standard deviation that also comes out to 12 minutes.

Draw 2,000 wait times from this population in R, plot them, and check the mean and standard deviation against those two numbers.

```r
# Draw a large sample standing in for the clinic's full population of wait times
set.seed(1)
pop_sample <- rexp(2000, rate = 1/12)
hist(pop_sample, breaks = 30, main = "2,000 simulated wait times", xlab = "minutes")
round(mean(pop_sample), 2)
#> [1] 12.09
round(sd(pop_sample), 2)
#> [1] 11.88
```

`rexp(2000, rate = 1/12)` draws 2,000 random values from the exponential distribution, and the rate argument is set to 1 divided by 12 because the mean of this distribution always equals 1 divided by the rate. The histogram shows the same right skew as Priya's 20 patients: a tall bar near 0 minutes and a long, thinning tail stretching out to the right. And `mean()` and `sd()` both land close to 12, the mean and standard deviation the population was built to have.

[NOTE]
From here on, `rexp(n, rate = 1/12)` is how this lesson draws n wait times from the clinic's population, every single time.

=== step === concept
## One sample, one average, and what happens if you repeat it

In practice, Priya never sees the whole population. She only sees however many patients happen to walk in on a given morning. Say she grabs the wait times of 4 patients and averages them.

Draw 4 wait times and take their mean.

```r
# Draw one small sample of 4 patients and compute its mean
set.seed(2)
sample1 <- rexp(4, rate = 1/12)
round(sample1, 1)
#> [1] 22.4  4.9  1.8 20.8
round(mean(sample1), 2)
#> [1] 12.44
```

That average, 12.44 minutes, is the sample mean of those particular 4 patients.

Now draw a second group of 4 patients the same way and average them too.

```r
# Draw a second, independent sample of 4 patients and compute its mean
set.seed(3)
sample2 <- rexp(4, rate = 1/12)
round(sample2, 1)
#> [1] 20.8  7.4 14.8 12.0
round(mean(sample2), 2)
#> [1] 13.75
```

The second group averages 13.75 minutes, not 12.44. Same clinic, same sample size, completely different patients, and a different answer. A sample mean, in other words, is itself a quantity that moves around from one sample to the next, exactly the way any other number you compute from data does.

=== step === concept
## Building the sampling distribution of the mean with replicate()

Two samples already gave two different means. To see the full range of values a mean of 4 patients can take, two tries is nowhere near enough. `replicate()` runs the same piece of code over and over and collects every result into one vector.

Repeat the 4-patient draw 2,000 times and keep the 2,000 means it produces.

```r
# Repeat the 4-patient sample 2000 times, and keep the mean from each one
set.seed(4)
means4 <- replicate(2000, mean(rexp(4, rate = 1/12)))
hist(means4, breaks = 30, main = "2,000 means, each from 4 patients", xlab = "minutes")
```

`means4` now holds 2,000 numbers, one sample mean per simulated morning of 4 patients. This collection has its own name: the sampling distribution of the mean, the distribution you would get if you could draw a sample mean over and over and plot every result.

Compare this histogram with pop_sample's own histogram. It is already less lopsided, and it is packed into a narrower range of minutes, even though both histograms come from exactly the same underlying clinic.

=== step === concept
## Raising n tightens and smooths it further

If averaging 4 patients narrows the spread, averaging more should narrow it further. Repeat the same experiment, this time averaging 16 patients at a time, and again averaging 64 at a time, 2,000 times each.

Build `means16` and `means64` the same way as `means4`, and plot all three side by side on the same scale.

```r
# Repeat the averaging at n = 16 and n = 64, each one 2000 times
set.seed(5)
means16 <- replicate(2000, mean(rexp(16, rate = 1/12)))

set.seed(6)
means64 <- replicate(2000, mean(rexp(64, rate = 1/12)))

par(mfrow = c(1, 3))
hist(means4,  breaks = 30, main = "n = 4",  xlab = "minutes")
hist(means16, breaks = 30, main = "n = 16", xlab = "minutes")
hist(means64, breaks = 30, main = "n = 64", xlab = "minutes")
par(mfrow = c(1, 1))
```

Each panel is tighter and more symmetric than the one before it. By n = 64 the shape is close to a clean bell, a long way from pop_sample's own right-skewed shape, even though every value in all three panels was drawn from exactly the same clinic.

Now put a number on exactly how much tighter each panel got.

```r
# Compare the observed spread of each set of means to sigma divided by the square root of n
c(n4 = round(sd(means4), 2), n16 = round(sd(means16), 2), n64 = round(sd(means64), 2))
#>   n4  n16  n64
#> 5.97 2.99 1.54
c(n4 = round(12 / sqrt(4), 2), n16 = round(12 / sqrt(16), 2), n64 = round(12 / sqrt(64), 2))
#>  n4 n16 n64
#> 6.0 3.0 1.5
```

The observed spread of the 2,000 means, 5.97 at n = 4, 2.99 at n = 16, 1.54 at n = 64, lines up almost exactly with the second row: 12 divided by the square root of n. This fixed amount by which averaging shrinks the spread has its own name, the standard error, and the formula is simply the population's standard deviation divided by the square root of the sample size.

Look closely at how n had to grow to get each halving. Going from n = 4 to n = 16 is a 4 times increase in n, and the spread fell from about 6 to 3, exactly half. Going from n = 16 to n = 64 is another 4 times increase, and the spread fell from 3 to 1.5, half again.

Halving the spread always costs a 4 times bigger sample, never a 2 times bigger one, because the square root in the formula grows slower than n itself. Push further, to n = 256, and the formula predicts a spread of exactly 0.75 minutes, half of 1.5 again, for a sample 4 times bigger than 64.

=== step === widget
## Narrowing the sampling distribution with a slider

From here, the simulating moves to a widget built to run far more repeats than this page can print. It draws its own skewed population every time it loads, shaped just like pop_sample's wait times though not using Priya's exact numbers.

Here is that population on the left, and the sampling distribution of its mean on the right, starting at a sample size of 5.

::widget clt-sampler {"parent": "skew", "n": 5}

That population has a standard deviation of 1, so the formula predicts a spread of 1 divided by the square root of 5, about 0.447. The readout below the chart reports an observed spread of 0.450, close enough that the small difference is just the usual noise of one particular run of 1,200 repeats.

At n = 5 the right panel is still a little lopsided, but already far narrower than the population on the left. Drag the slider up toward 100 and watch it pull in tight around the green bell curve the formula predicts, however skewed the left panel still looks. Then drag it back down to n = 1: a mean of one patient is just that one patient's wait time, so the right panel collapses back into a copy of the skewed population on the left.

=== step === quiz
## Quick check: how the standard error changes with n

Before moving to a completely different population, check what you can already predict about the standard error itself. The standard error was 3.0 minutes at n = 16 and 1.5 minutes at n = 64. n rose from 16 to 64, a factor of 4. What happened to the standard error?

::quiz {"correct": 1, "gate": true, "difficulty": "beginner"}
- It is cut in half, because the standard error is the population's standard deviation divided by the square root of n, and the square root of 4 is 2. ::ok Right. n rose by a factor of 4, from 16 to 64, and the standard error only moves by the square root of that factor. The square root of 4 is 2, so the standard error fell from 3.0 to 1.5 minutes, exactly half.
- It is cut to a quarter, matching the factor of 4 that n itself rose by. ::no
- It stays the same, because the central limit theorem is about the sampling distribution becoming bell shaped, not about how spread out it is. ::no The standard error moves with n even though turning bell shaped is a separate part of the same result. n rose by a factor of 4 going from 16 to 64, and the standard error falls by the square root of that factor, from 3.0 to 1.5, not by the factor itself and not by nothing at all.

=== step === widget
## Shape does not matter: a two-humped population folds into a bell too

Switch the same widget to a population that looks nothing like the clinic's: two separate humps, the shape you would see if two different groups, say children and adults, were measured together with nothing in the data saying which group was which.

Here is that two-humped population on the left, averaged 10 at a time on the right.

::widget clt-sampler {"parent": "bimodal", "n": 10}

The left panel shows those two humps clearly separated. The right panel, averaging 10 values at a time, has already folded into a single bell rather than keeping the two humps: the count of values that happen to land in each hump varies a little from sample to sample, and averaging over 10 of them smooths that variation out faster than you might expect.

This population's standard deviation is the square root of 2.5, about 1.58, so the formula predicts a spread of the square root of 2.5 divided by the square root of 10, which simplifies to exactly 0.5. The readout below reports an observed spread of 0.496, matching the formula closely.

Drag the slider down to n = 1 and the two humps reappear immediately, because a mean of one value is that value, drawn from whichever hump it happened to come from. Drag it back up and the two humps merge into one bell well before n reaches 30. The population on the left never changes shape. Only how fast its sample mean settles into a bell does, and here it settles faster than the clinic's skewed population did.

=== step === widget
## When averaging does not help: a population with no finite variance

This last switch of the same widget mounts a population with a heavy tail, the shape of some real financial returns, again nothing to do with the clinic.

Here is that heavy-tailed population on the left, averaged 100 at a time on the right.

::widget clt-sampler {"parent": "heavy", "n": 100}

A heavy tail means extreme values show up often enough that there is no fixed number you could call the population's variance or standard deviation. No matter how far out you look, more of the probability keeps sitting further out still, so the usual formula for spread never settles on one value.

Because there is no standard deviation to report, the readout below gives the interquartile range instead, the width of the middle half of the 1,200 simulated means, which comes out to 2.075 at n = 100. 117 of those 1,200 means landed completely outside the plotted window. Drag the slider down to n = 1 and a similar 121 out of 1,200 fall outside that same window. Averaging 100 values at a time instead of 1 has not narrowed anything.

This is the condition the central limit theorem actually needs: a finite variance in the population being averaged. Wait times and most quantities you would measure in practice have one. Some heavy-tailed returns do not, and no amount of averaging fixes that.

=== step === concept
## What the central limit theorem actually says, and why it matters

You have now seen the same result three times: on a skewed population, on a two-humped population, and its failure on a population with no finite variance. Put a single sentence around all of it.

[KEY INSIGHT]
For any population with a finite variance, call its mean mu and its standard deviation sigma. As the sample size n grows, the distribution of the sample mean approaches a normal distribution, the familiar symmetric bell curve, centred at mu, with a standard deviation of sigma divided by the square root of n. This holds regardless of the shape of the original population. That is the central limit theorem.

Tie that back to Priya's clinic. One patient's wait time is heavily right skewed, nowhere near a bell curve. But the average wait across enough patients is close to normally distributed, centred at 12 minutes, with a spread that keeps shrinking as more patients are counted into it.

This is why so many statistical methods are allowed to assume a normal sampling distribution of the mean even when the raw data behind it is nowhere close to normal. A method built on that assumption does not need normal data. It needs a large enough sample of it, and a population whose variance is finite in the first place.

=== step === quiz
## Practice: a new population, same reasoning

Try the same reasoning on a population you have not simulated yet. Suppose you are looking at the daily percentage return of one especially volatile stock, a population known to have a heavy tail much like the one shown by the heavy-tailed widget. You average 1,000 daily returns at once. What happens to the spread of that average?

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- Averaging still does not help, because a heavy-tailed population like this one has no finite variance for the standard error formula to shrink. ::ok Right. The bell shape and the shrinking spread both depend on the population having a finite variance in the first place. A heavy-tailed return series does not have one, so no amount of averaging narrows the spread, the same result the heavy-tailed widget showed at n = 100.
- Any sample size eventually gives a bell curve, since the central limit theorem applies to every population given enough n. ::no
- n = 1,000 is simply too small, and a larger n would finally narrow the spread. ::no The central limit theorem's guarantee is conditional on a finite variance first; growing n only helps once that condition is met. A heavy-tailed return series fails it, so no n, however large, narrows the spread. Shape never mattered in this lesson, the two-humped population proved that, but a missing variance always does.

=== step === tryit
## Your turn: check the formula on a new clinic

A second clinic across town also sees right-skewed wait times, but it runs slower: both its mean and its standard deviation are 20 minutes, from `rexp(1, rate = 1/20)`.

Build the sampling distribution of its mean at n = 25 patients, repeated 2,000 times, and check the spread against the formula.

```r
# A second clinic's wait times: mean and sd both 20 minutes, from rexp(1, rate = 1/20)
# Build the sampling distribution of the mean at n = 25 patients, repeated 2000 times,
# then compare its spread to 20 divided by the square root of 25.
# Two lines. Press Check when you have them.
```
::check {"regex": "(?=[\\s\\S]*replicate[(])(?=[\\s\\S]*rexp[(]25)(?=[\\s\\S]*rate\\s*=\\s*1\\s*/\\s*20)", "gate": true, "difficulty": "intermediate", "ok": "Right: a spread of 4.05, against 20 divided by the square root of 25, which is exactly 4. The formula holds on a slower clinic with completely different numbers.", "no": "Build the sampling distribution the same way means4, means16 and means64 were built: replicate(2000, mean(rexp(25, rate = 1/20))), then take its sd() and compare to 20 / sqrt(25)."}
::solution
```r
# Build the second clinic's sampling distribution of the mean and check its spread
set.seed(7)
clinic2_means <- replicate(2000, mean(rexp(25, rate = 1/20)))
round(sd(clinic2_means), 2)
#> [1] 4.05
round(20 / sqrt(25), 2)
#> [1] 4
```

=== step === concept
## References
::prose-only the sources are text, not a visual

- [Casella, G. and Berger, R., *Statistical Inference* (2nd ed., Chapman and Hall/CRC), Chapter 5, the Central Limit Theorem](https://www.routledge.com/Statistical-Inference/Berger-Casella/p/book/9781032593036)
- [Wasserman, L., *All of Statistics* (Springer), Chapter 5, Convergence of Random Variables, covering the CLT](https://doi.org/10.1007/978-0-387-21736-9)
- [Ross, S., *A First Course in Probability* (10th ed., Pearson), the chapter deriving the normal approximation to a sum of independent variables](https://www.pearson.com/en-us/subject-catalog/p/first-course-in-probability-a/P200000006334)
- [Nolan, J.P., *Stable Distributions: Models for Heavy Tailed Data*, Chapter 1, on populations with no finite variance, free to read](https://edspace.american.edu/jpnolan/wp-content/uploads/sites/1720/2020/09/Chap1.pdf)
- [R documentation for replicate() and rexp()](https://search.r-project.org/R/refmans/base/html/replicate.html)

=== step === complete
## What today's simulation showed

You built the central limit theorem yourself, piece by piece, instead of taking it on faith. To sum it up:

- Averaging 4, then 16, then 64 patients at a time narrowed the spread of the sampling distribution of the mean from about 6 to 3 to 1.5 minutes, tracking 12 divided by the square root of n exactly.
- That narrowing, and the move toward a bell shape, happened whether the starting population was right skewed like the clinic's wait times or split into two separate humps.
- The one thing that breaks it is a population with no finite variance. There, averaging 100 values narrowed nothing that averaging 1 value did not already show.
- The formula held again on a second clinic with completely different numbers: a predicted spread of exactly 4 minutes against an observed 4.05.

So whenever a method assumes its sample mean is approximately normal, what it is actually assuming is smaller and more checkable than it sounds: a large enough sample, drawn from a population whose variance is finite. The next lesson in this course turns the same simulation habit on other statistics altogether, including a median and a proportion.
