---
title: "Probability and Estimation Lesson 2: The four distributions inference runs on"
catalog_blurb: "Why your t interval is wider than normal, and when a variance is unusual."
description: "Normal, t, chi-squared and F are not four shapes to memorise. Each is the distribution of one real quantity you compute: a mean, a variance, or a ratio of two."
keywords: "normal distribution, t distribution, chi-squared distribution, F distribution, degrees of freedom, standard error, sample variance, confidence interval, R"
post_type: "LESSON"
curriculum_id: "4.10.2"
webr: true
mathjax: false
lesson_access: "free"
course_id: "res-probability"
course_title: "Probability and Estimation, from the ground up"
course_lesson: "2"
course_total: "7"
course_landing: "Probability-and-Estimation-Course.html"
course_next: "Counting-Outcomes-Binomial-and-Poisson.html"
course_prev: "What-a-Random-Variable-Really-Is.html"
---

=== step === cover
## The four distributions inference runs on

Today let's understand the four distributions that nearly every statistical test leans on: the normal, the t, the chi-squared and the F.

Renu runs a small coffee roastery. One of her machines, Machine A, fills bags labelled 200 grams. It has run long enough that she trusts its long-run bag-to-bag standard deviation: 5 grams. One morning she pulls 16 bags off the line and weighs each one.

Here is what those 16 bags weighed, against the 200 gram label.

::widget chart-plotter {"data":[{"x":1,"y":204},{"x":2,"y":202.6},{"x":3,"y":208.7},{"x":4,"y":193.6},{"x":5,"y":211},{"x":6,"y":202.2},{"x":7,"y":192.1},{"x":8,"y":195.3},{"x":9,"y":200.3},{"x":10,"y":200},{"x":11,"y":188.6},{"x":12,"y":203.8},{"x":13,"y":197.3},{"x":14,"y":200.9},{"x":15,"y":202.8},{"x":16,"y":207.6}],"geoms":["bar"],"x":"bag","y":"weight","code":{"bar":"ggplot(machineA, aes(factor(bag), weight)) +\n  geom_col() +\n  geom_hline(yintercept = 200, linetype = \"dashed\")"}}

Some bags ran over the label, some under. None of them read exactly 200.

That is the shape every one of these four distributions deals with. Each one is not a shape to memorise, but the distribution OF a quantity someone actually computes from data like Renu's: a mean, a mean measured against its own estimated uncertainty, a sum of squared deviations, or a ratio of two of those. This lesson builds all four, in that order, straight out of Renu's own 16 bags.

=== step === concept
## The normal: the distribution of the sample mean

Start with the plainest of the four questions: does the average of these 16 bags look like what a 200 gram, 5 gram standard deviation machine should produce?

Average the 16 readings and you get 200.675 grams. That number alone cannot tell you much, because any 16 bags from a machine centred at 200 would almost never average to exactly 200. The question is whether 200.675 is an ordinary amount to be off by, or a surprising one.

To answer that, you need to know how much a mean of 16 bags normally wobbles. If Machine A's long-run standard deviation really is 5 grams, the mean of 16 bags has its own, smaller spread, called the **standard error**: 5 divided by the square root of 16, which is 1.25 grams. A single bag can easily land 5 grams off target, but a mean of 16 of them bunches up much closer to 200, because the high and low bags tend to cancel out.

With that standard error in hand, you can turn 200.675 into an ordinary distance: how many standard errors away from 200 it sits. That distance is called a **z statistic**, and it is just (the mean minus the target) divided by the standard error.

```r
# Recreate Renu's 16 sampled bags, then see where many simulated 16-bag means land if sigma really is 5
set.seed(21)
bagsA <- round(rnorm(16, 200, 5), 1)

sigma_known <- 5
se_known <- sigma_known / sqrt(16)
z <- (mean(bagsA) - 200) / se_known
round(se_known, 2)
#> [1] 1.25
round(z, 2)
#> [1] 0.54

set.seed(42)
means_sim <- replicate(2000, mean(rnorm(16, 200, 5)))
round(mean(means_sim), 3)
#> [1] 200.008
round(sd(means_sim), 3)
#> [1] 1.266

library(ggplot2)
ggplot(data.frame(mean_weight = means_sim), aes(mean_weight)) +
  geom_histogram(bins = 30) +
  geom_vline(xintercept = mean(bagsA), linetype = "dashed")
```

z works out to 0.54. Renu's mean sits just over half a standard error above 200, which is nowhere near unusual.

The histogram backs that up directly. It is 2,000 simulated 16-bag means, each one drawn the same way Renu's 16 bags were, and they pile up in the familiar bell shape the **normal distribution** describes: centred almost exactly on 200, with a spread close to the 1.25 you just computed by formula. The dashed line marks Renu's own mean, sitting comfortably inside that pile, not out in a thin tail.

So the normal distribution, here, is the distribution of the sample mean, once you already know sigma. The catch is in that "once you already know sigma". Renu does not actually know Machine A's true sigma. She only has one guess at it: the standard deviation of these same 16 bags. What changes when sigma has to come from the sample itself is next.

=== step === widget
## The t distribution: estimating sigma from the sample

In the real world, Renu does not get handed a trustworthy, long-run sigma for free. All she has is this one batch of 16 bags, so the only standard deviation available is the one those 16 bags happen to show.

```r
# Estimate sigma from the sample's own standard deviation, and compute Renu's t statistic
s <- sd(bagsA)
se_est <- s / sqrt(16)
t_stat <- (mean(bagsA) - 200) / se_est
df_A <- length(bagsA) - 1

round(s, 3)
#> [1] 6.114
round(se_est, 3)
#> [1] 1.528
round(t_stat, 3)
#> [1] 0.442
df_A
#> [1] 15
```

The sample's own standard deviation, s, comes out to 6.114, a little higher than Machine A's assumed long-run 5. Divide that by the square root of 16 and the estimated standard error is 1.528, wider than the known 1.25 from the last step. Run the same distance calculation as before, mean minus target over standard error, and you get 0.442 instead of 0.54.

That ratio, a mean measured against its own estimated standard error, is called a **t statistic**, and it follows the **t distribution**. A t distribution always carries a number attached to it called its **degrees of freedom**, written df, which here is 16 minus 1, or 15. The minus one is the cost of having used the sample itself to estimate s; one of the 16 numbers' worth of information went into pinning down the mean you are now measuring against.

Why build a whole separate distribution for this, instead of just reusing the normal? Because s itself is only an estimate, and estimates vary from sample to sample. A different 16 bags from the very same machine would hand back a slightly different s, so the ratio built from an estimated standard error is noisier, and has fatter tails, than one built from a standard error you actually know.

::widget dist-shapes {"dist": "t", "df": 15}

The widget shows exactly that. With df set to 15, Renu's own degrees of freedom, the solid t curve sits a little lower in the middle and a little fatter in the tails than the dashed standard normal drawn behind it. Read the cutoff it reports for a 95% interval: wider than the normal's 1.960. That gap is not a correction someone invented. It is what honesty costs when sigma is estimated from the same small sample that produced the mean.

Drag the df slider up. As df climbs toward 30 and beyond, the solid t curve settles down onto the dashed normal, and the cutoff it reports drifts back toward 1.960. A bigger sample makes an estimated sigma behave more and more like a known one, which is exactly why the gap between t and normal only matters when your sample is small.

[KEY INSIGHT]
The normal distribution describes a mean measured against a sigma you already know. The t distribution describes the exact same kind of mean, measured against a sigma you had to estimate from the same data. That is the entire difference between the two, and it is also the entire reason a t interval is wider than a normal one.

=== step === quiz
## Quick check: why is the t cutoff wider than the normal's

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Because any sample of only 16 bags is too small for inference, no matter what you compute from it. ::no
- Because sigma itself had to be estimated from the same small sample that produced the mean, and that estimate varies from sample to sample. ::ok Right. Sigma came from the same 16 bags that gave you the mean, and that estimate of sigma moves around every time you draw a new sample. The wider cutoff reflects exactly that extra uncertainty.
- Because the t distribution is always wider than the normal distribution, at every number of degrees of freedom. ::no Not quite. Drag the widget's df slider up past 30 and the t cutoff settles right onto the normal's 1.960, so "always wider" is not right. The widening only shows up because sigma was estimated from a small sample; sample size alone, without ever having to estimate sigma, would not force it.

=== step === concept
## The chi-squared distribution: a sum of squared normals

Now ask a different question about those same 16 bags: is their spread, their variance, itself an ordinary amount, or an unusually large or small one for a machine with sigma = 5?

To answer that you need to know how a sample variance behaves, and the cleanest way to see that is to build it from scratch. Take 15 independent standard normal values, square each one, and add the squares up. Do that over and over, and the distribution those sums settle into is called the **chi-squared distribution**, with 15 degrees of freedom here because 15 squared values went into each sum.

```r
# Build chi-squared(15) directly as a sum of squared standard normals, then place Renu's own variance statistic inside it
set.seed(1)
chisq_proof <- replicate(20000, sum(rnorm(15)^2))
round(quantile(chisq_proof, c(0.05, 0.5, 0.95)), 2)
#>    5%   50%   95%
#>  7.29 14.36 24.97
round(qchisq(c(0.05, 0.5, 0.95), df = 15), 2)
#> [1]  7.26 14.34 25.00

renu_chisq <- (length(bagsA) - 1) * var(bagsA) / sigma_known^2
round(renu_chisq, 3)
#> [1] 22.426
round(qchisq(c(0.025, 0.975), df = 15), 3)
#> [1]  6.262 27.488
```

The 5th, 50th and 95th percentiles of 20,000 simulated sums, 7.29, 14.36 and 24.97, land almost exactly on `qchisq()`'s theoretical answer: 7.26, 14.34 and 25.00. That confirms it. `qchisq()` is not a separate formula someone handed down. It is the exact same distribution you just built by hand, computed without having to simulate it.

Now connect that to Renu's 16 bags. Her sample variance, scaled by (16 minus 1) and divided by sigma squared (5 squared, or 25), turns out to be exactly this kind of sum of 15 squared standard normals, as long as Machine A's sigma really is 5. Run that scaling and you get 22.426. Check that against the 95% band for a chi-squared with 15 degrees of freedom, 6.262 to 27.488 by `qchisq()`, and 22.426 sits comfortably inside it. Nothing about Machine A's spread today looks unusual.

=== step === widget
## The chi-squared shape, and where Renu's variance falls

::widget chart-plotter {"data":[{"x":"chisq(15)","y":9.22},{"x":"chisq(15)","y":11.46},{"x":"chisq(15)","y":10.87},{"x":"chisq(15)","y":18.31},{"x":"chisq(15)","y":7.15},{"x":"chisq(15)","y":10.74},{"x":"chisq(15)","y":7.87},{"x":"chisq(15)","y":8.61},{"x":"chisq(15)","y":14.22},{"x":"chisq(15)","y":24.25},{"x":"chisq(15)","y":27.74},{"x":"chisq(15)","y":18.57},{"x":"chisq(15)","y":19.13},{"x":"chisq(15)","y":20.89},{"x":"chisq(15)","y":13.08},{"x":"chisq(15)","y":14.66},{"x":"chisq(15)","y":18.26},{"x":"chisq(15)","y":15.57},{"x":"chisq(15)","y":12.43},{"x":"chisq(15)","y":12.7},{"x":"chisq(15)","y":26.4},{"x":"chisq(15)","y":9.19},{"x":"chisq(15)","y":18.72},{"x":"chisq(15)","y":15.43},{"x":"chisq(15)","y":18.95},{"x":"chisq(15)","y":16.09},{"x":"chisq(15)","y":9.84},{"x":"chisq(15)","y":15.55},{"x":"chisq(15)","y":13.73},{"x":"chisq(15)","y":20.9},{"x":"chisq(15)","y":22.67},{"x":"chisq(15)","y":20.2},{"x":"chisq(15)","y":23.74},{"x":"chisq(15)","y":13.57},{"x":"chisq(15)","y":12.67},{"x":"chisq(15)","y":5.28},{"x":"chisq(15)","y":10.19},{"x":"chisq(15)","y":17.77},{"x":"chisq(15)","y":10.27},{"x":"chisq(15)","y":12.01},{"x":"chisq(15)","y":18.52},{"x":"chisq(15)","y":9.38},{"x":"chisq(15)","y":15.52},{"x":"chisq(15)","y":11.71},{"x":"chisq(15)","y":18.47},{"x":"chisq(15)","y":6.97},{"x":"chisq(15)","y":7.78},{"x":"chisq(15)","y":14.29},{"x":"chisq(15)","y":20.23},{"x":"chisq(15)","y":21.31},{"x":"chisq(15)","y":9.19},{"x":"chisq(15)","y":7.68},{"x":"chisq(15)","y":13.24},{"x":"chisq(15)","y":19.47},{"x":"chisq(15)","y":10.74},{"x":"chisq(15)","y":21.52},{"x":"chisq(15)","y":16.41},{"x":"chisq(15)","y":18.01},{"x":"chisq(15)","y":10.94},{"x":"chisq(15)","y":9.12},{"x":"chisq(15)","y":11.44},{"x":"chisq(15)","y":14.22},{"x":"chisq(15)","y":12.41},{"x":"chisq(15)","y":16.66},{"x":"chisq(15)","y":9.77},{"x":"chisq(15)","y":20.5},{"x":"chisq(15)","y":28.53},{"x":"chisq(15)","y":17.02},{"x":"chisq(15)","y":15.75},{"x":"chisq(15)","y":17.81},{"x":"chisq(15)","y":17.2},{"x":"chisq(15)","y":23.71},{"x":"chisq(15)","y":29.18},{"x":"chisq(15)","y":17.24},{"x":"chisq(15)","y":6.54},{"x":"chisq(15)","y":12.46},{"x":"chisq(15)","y":12.18},{"x":"chisq(15)","y":8.99},{"x":"chisq(15)","y":17.98},{"x":"chisq(15)","y":12.34},{"x":"chisq(15)","y":6.66},{"x":"chisq(15)","y":7.96},{"x":"chisq(15)","y":9.14},{"x":"chisq(15)","y":14.36},{"x":"chisq(15)","y":5.47},{"x":"chisq(15)","y":21.08},{"x":"chisq(15)","y":11.21},{"x":"chisq(15)","y":10.44},{"x":"chisq(15)","y":12.14},{"x":"chisq(15)","y":13.12},{"x":"chisq(15)","y":12.44},{"x":"chisq(15)","y":18.65},{"x":"chisq(15)","y":20.42},{"x":"chisq(15)","y":8.64},{"x":"chisq(15)","y":18.53},{"x":"chisq(15)","y":16.61},{"x":"chisq(15)","y":8.22},{"x":"chisq(15)","y":17.89},{"x":"chisq(15)","y":20.84},{"x":"chisq(15)","y":22.97},{"x":"chisq(15)","y":10.93},{"x":"chisq(15)","y":16.9},{"x":"chisq(15)","y":13.24},{"x":"chisq(15)","y":19.12},{"x":"chisq(15)","y":10.3},{"x":"chisq(15)","y":14},{"x":"chisq(15)","y":16.99},{"x":"chisq(15)","y":11.64},{"x":"chisq(15)","y":13.3},{"x":"chisq(15)","y":19.91},{"x":"chisq(15)","y":18.18},{"x":"chisq(15)","y":9.67},{"x":"chisq(15)","y":14.04},{"x":"chisq(15)","y":8.73},{"x":"chisq(15)","y":25.7},{"x":"chisq(15)","y":12.9},{"x":"chisq(15)","y":8.22},{"x":"chisq(15)","y":13.41},{"x":"chisq(15)","y":20.54},{"x":"chisq(15)","y":31.12},{"x":"chisq(15)","y":12.6},{"x":"chisq(15)","y":14.54},{"x":"chisq(15)","y":21.36},{"x":"chisq(15)","y":12.38},{"x":"chisq(15)","y":13.18},{"x":"chisq(15)","y":12.14},{"x":"chisq(15)","y":17.98},{"x":"chisq(15)","y":11.83},{"x":"chisq(15)","y":8.52},{"x":"chisq(15)","y":18.81},{"x":"chisq(15)","y":21.65},{"x":"chisq(15)","y":5.02},{"x":"chisq(15)","y":10.3},{"x":"chisq(15)","y":16.45},{"x":"chisq(15)","y":21.2},{"x":"chisq(15)","y":22.3},{"x":"chisq(15)","y":11.17},{"x":"chisq(15)","y":27.66},{"x":"chisq(15)","y":16.09},{"x":"chisq(15)","y":6.94},{"x":"chisq(15)","y":12.35},{"x":"chisq(15)","y":18.3},{"x":"chisq(15)","y":14.88},{"x":"chisq(15)","y":8.51},{"x":"chisq(15)","y":9.68},{"x":"chisq(15)","y":13.91},{"x":"chisq(15)","y":17.03},{"x":"chisq(15)","y":4.2},{"x":"chisq(15)","y":9.62},{"x":"chisq(15)","y":25.02},{"x":"chisq(15)","y":16.7},{"x":"chisq(15)","y":6.92},{"x":"chisq(15)","y":13.16},{"x":"chisq(15)","y":19.16},{"x":"chisq(15)","y":25.05},{"x":"chisq(15)","y":9.4},{"x":"chisq(15)","y":17.56},{"x":"chisq(15)","y":9.29},{"x":"chisq(15)","y":20.43},{"x":"chisq(15)","y":17.41},{"x":"chisq(15)","y":13.74},{"x":"chisq(15)","y":21.27},{"x":"chisq(15)","y":9.96},{"x":"chisq(15)","y":16.76},{"x":"chisq(15)","y":18.96},{"x":"chisq(15)","y":14.31},{"x":"chisq(15)","y":14.99},{"x":"chisq(15)","y":19.55},{"x":"chisq(15)","y":14.35},{"x":"chisq(15)","y":24.31},{"x":"chisq(15)","y":11.71},{"x":"chisq(15)","y":12.91},{"x":"chisq(15)","y":13.53},{"x":"chisq(15)","y":15.25},{"x":"chisq(15)","y":13.28},{"x":"chisq(15)","y":13.84},{"x":"chisq(15)","y":20.41},{"x":"chisq(15)","y":11.94},{"x":"chisq(15)","y":15.48},{"x":"chisq(15)","y":13.46},{"x":"chisq(15)","y":7.23},{"x":"chisq(15)","y":19.14},{"x":"chisq(15)","y":14.55},{"x":"chisq(15)","y":12.26},{"x":"chisq(15)","y":15.43},{"x":"chisq(15)","y":14.77},{"x":"chisq(15)","y":10.46},{"x":"chisq(15)","y":21.77},{"x":"chisq(15)","y":17.16},{"x":"chisq(15)","y":18.35},{"x":"chisq(15)","y":18.08},{"x":"chisq(15)","y":6.88},{"x":"chisq(15)","y":12.8},{"x":"chisq(15)","y":11.37},{"x":"chisq(15)","y":13.99},{"x":"chisq(15)","y":26.05},{"x":"chisq(15)","y":15.97},{"x":"chisq(15)","y":19.7},{"x":"chisq(15)","y":15.94},{"x":"chisq(15)","y":15.52},{"x":"chisq(15)","y":11.87},{"x":"chisq(15)","y":9.61},{"x":"chisq(15)","y":19.13},{"x":"chisq(15)","y":18.54},{"x":"chisq(15)","y":16.66},{"x":"chisq(15)","y":11.46},{"x":"chisq(15)","y":7.68},{"x":"chisq(15)","y":12.74},{"x":"chisq(15)","y":20.3},{"x":"chisq(15)","y":16.72},{"x":"chisq(15)","y":19.93},{"x":"chisq(15)","y":10.44},{"x":"chisq(15)","y":12.83},{"x":"chisq(15)","y":24.08},{"x":"chisq(15)","y":14.09},{"x":"chisq(15)","y":15.41},{"x":"chisq(15)","y":11.03},{"x":"chisq(15)","y":21.06},{"x":"chisq(15)","y":18.81},{"x":"chisq(15)","y":16.33},{"x":"chisq(15)","y":22.8},{"x":"chisq(15)","y":19.36},{"x":"chisq(15)","y":20.23},{"x":"chisq(15)","y":13.93},{"x":"chisq(15)","y":10.04},{"x":"chisq(15)","y":22.34},{"x":"chisq(15)","y":15.65},{"x":"chisq(15)","y":17.24},{"x":"chisq(15)","y":6.56},{"x":"chisq(15)","y":17.76},{"x":"chisq(15)","y":16.36},{"x":"chisq(15)","y":14.23},{"x":"chisq(15)","y":23.82},{"x":"chisq(15)","y":20.72},{"x":"chisq(15)","y":15.33},{"x":"chisq(15)","y":14.92},{"x":"chisq(15)","y":9.88},{"x":"chisq(15)","y":15.38},{"x":"chisq(15)","y":14.02},{"x":"chisq(15)","y":11.48},{"x":"chisq(15)","y":15.67},{"x":"chisq(15)","y":17.32},{"x":"chisq(15)","y":10.39},{"x":"chisq(15)","y":11.31},{"x":"chisq(15)","y":26.11},{"x":"chisq(15)","y":21.53},{"x":"chisq(15)","y":7.85},{"x":"chisq(15)","y":17.63},{"x":"chisq(15)","y":7.01},{"x":"chisq(15)","y":14.78},{"x":"chisq(15)","y":10.7},{"x":"chisq(15)","y":16.22},{"x":"chisq(15)","y":7.1},{"x":"chisq(15)","y":16.92},{"x":"chisq(15)","y":8.76},{"x":"chisq(15)","y":15.86},{"x":"chisq(15)","y":23.53},{"x":"chisq(15)","y":14.89},{"x":"chisq(15)","y":17.18},{"x":"chisq(15)","y":12.67},{"x":"chisq(15)","y":14.09},{"x":"chisq(15)","y":14.57},{"x":"chisq(15)","y":6.58},{"x":"chisq(15)","y":9.78},{"x":"chisq(15)","y":14.73},{"x":"chisq(15)","y":26.44},{"x":"chisq(15)","y":23.97},{"x":"chisq(15)","y":16.38},{"x":"chisq(15)","y":15.63},{"x":"chisq(15)","y":20.79},{"x":"chisq(15)","y":25.5},{"x":"chisq(15)","y":12.86},{"x":"chisq(15)","y":11.9},{"x":"chisq(15)","y":6.28},{"x":"chisq(15)","y":7.04},{"x":"chisq(15)","y":20.63},{"x":"chisq(15)","y":20.48},{"x":"chisq(15)","y":27.13},{"x":"chisq(15)","y":7.89},{"x":"chisq(15)","y":13.7},{"x":"chisq(15)","y":15.35},{"x":"chisq(15)","y":16.54},{"x":"chisq(15)","y":9.81},{"x":"chisq(15)","y":18.6},{"x":"chisq(15)","y":14.64},{"x":"chisq(15)","y":19.8},{"x":"chisq(15)","y":12.53},{"x":"chisq(15)","y":18.25},{"x":"chisq(15)","y":13.15},{"x":"chisq(15)","y":9.41},{"x":"chisq(15)","y":14.48},{"x":"chisq(15)","y":20.61},{"x":"chisq(15)","y":7.78},{"x":"chisq(15)","y":14.26},{"x":"chisq(15)","y":10.81},{"x":"chisq(15)","y":8.01},{"x":"chisq(15)","y":14.23},{"x":"chisq(15)","y":8.2},{"x":"chisq(15)","y":22.62},{"x":"chisq(15)","y":20.07},{"x":"chisq(15)","y":11.87},{"x":"chisq(15)","y":16.41},{"x":"chisq(15)","y":14.36},{"x":"chisq(15)","y":21.53},{"x":"chisq(15)","y":18.54},{"x":"chisq(15)","y":9.88},{"x":"chisq(15)","y":21.04},{"x":"chisq(15)","y":6.07},{"x":"chisq(15)","y":22.62},{"x":"chisq(15)","y":27.37},{"x":"chisq(15)","y":18.78},{"x":"chisq(15)","y":11.8},{"x":"chisq(15)","y":12.74},{"x":"chisq(15)","y":13.88},{"x":"chisq(15)","y":9.41},{"x":"chisq(15)","y":27.21},{"x":"chisq(15)","y":13.75},{"x":"chisq(15)","y":9.55},{"x":"chisq(15)","y":19.71},{"x":"chisq(15)","y":4.92},{"x":"chisq(15)","y":15.22},{"x":"chisq(15)","y":12.49},{"x":"chisq(15)","y":17.63},{"x":"chisq(15)","y":12.75},{"x":"chisq(15)","y":8.83},{"x":"chisq(15)","y":15.11},{"x":"chisq(15)","y":13.44},{"x":"chisq(15)","y":26.48},{"x":"chisq(15)","y":14.18},{"x":"chisq(15)","y":21.48},{"x":"chisq(15)","y":15.43},{"x":"chisq(15)","y":17.02},{"x":"chisq(15)","y":21.74},{"x":"chisq(15)","y":25.09},{"x":"chisq(15)","y":10.94},{"x":"chisq(15)","y":7.97},{"x":"chisq(15)","y":19},{"x":"chisq(15)","y":5.09},{"x":"chisq(15)","y":11.15},{"x":"chisq(15)","y":15.72},{"x":"chisq(15)","y":18.34},{"x":"chisq(15)","y":12.62},{"x":"chisq(15)","y":8.03},{"x":"chisq(15)","y":15.2},{"x":"chisq(15)","y":14.21},{"x":"chisq(15)","y":8.35},{"x":"chisq(15)","y":11.18},{"x":"chisq(15)","y":9.65},{"x":"chisq(15)","y":13.72},{"x":"chisq(15)","y":16.94},{"x":"chisq(15)","y":22.88},{"x":"chisq(15)","y":20.75},{"x":"chisq(15)","y":11.51},{"x":"chisq(15)","y":14.19},{"x":"chisq(15)","y":15.73},{"x":"chisq(15)","y":18.95},{"x":"chisq(15)","y":12.83},{"x":"chisq(15)","y":14.34},{"x":"chisq(15)","y":18.06},{"x":"chisq(15)","y":16.95},{"x":"chisq(15)","y":13.85},{"x":"chisq(15)","y":27.06},{"x":"chisq(15)","y":19.26},{"x":"chisq(15)","y":17.03},{"x":"chisq(15)","y":12.43},{"x":"chisq(15)","y":8.29},{"x":"chisq(15)","y":14.55},{"x":"chisq(15)","y":14.75},{"x":"chisq(15)","y":10.97},{"x":"chisq(15)","y":34.75},{"x":"chisq(15)","y":10.05},{"x":"chisq(15)","y":22.07},{"x":"chisq(15)","y":8.77},{"x":"chisq(15)","y":15.87},{"x":"chisq(15)","y":18.63},{"x":"chisq(15)","y":18.21},{"x":"chisq(15)","y":6.32},{"x":"chisq(15)","y":13.13},{"x":"chisq(15)","y":13.21},{"x":"chisq(15)","y":16.39},{"x":"chisq(15)","y":25.99},{"x":"chisq(15)","y":17.62},{"x":"chisq(15)","y":18.17},{"x":"chisq(15)","y":11.95},{"x":"chisq(15)","y":15.42},{"x":"chisq(15)","y":17.47},{"x":"chisq(15)","y":4.92},{"x":"chisq(15)","y":11.51},{"x":"chisq(15)","y":14.35},{"x":"chisq(15)","y":12.22},{"x":"chisq(15)","y":17.84},{"x":"chisq(15)","y":16.19},{"x":"chisq(15)","y":6.56},{"x":"chisq(15)","y":13.53},{"x":"chisq(15)","y":8.46},{"x":"chisq(15)","y":19.55},{"x":"chisq(15)","y":8.59},{"x":"chisq(15)","y":12.43},{"x":"chisq(15)","y":17.12},{"x":"chisq(15)","y":13.74},{"x":"chisq(15)","y":16.8},{"x":"chisq(15)","y":9.21},{"x":"chisq(15)","y":12.82},{"x":"chisq(15)","y":19.71},{"x":"chisq(15)","y":12.56},{"x":"chisq(15)","y":20.33},{"x":"chisq(15)","y":7.68},{"x":"chisq(15)","y":15.24},{"x":"chisq(15)","y":32.57},{"x":"chisq(15)","y":5.1},{"x":"chisq(15)","y":9.41},{"x":"chisq(15)","y":15.36},{"x":"chisq(15)","y":22.37},{"x":"chisq(15)","y":11.99},{"x":"chisq(15)","y":20.38},{"x":"chisq(15)","y":15.48},{"x":"chisq(15)","y":6.95},{"x":"chisq(15)","y":15.7},{"x":"chisq(15)","y":14.75},{"x":"chisq(15)","y":15.49},{"x":"chisq(15)","y":16.49},{"x":"chisq(15)","y":27.88},{"x":"chisq(15)","y":11.74},{"x":"chisq(15)","y":9.99},{"x":"chisq(15)","y":20.13},{"x":"chisq(15)","y":10.71},{"x":"chisq(15)","y":15.63},{"x":"chisq(15)","y":14.55},{"x":"chisq(15)","y":18.03},{"x":"chisq(15)","y":10.25},{"x":"chisq(15)","y":15.71},{"x":"chisq(15)","y":20.98},{"x":"chisq(15)","y":12.92},{"x":"chisq(15)","y":23.22},{"x":"chisq(15)","y":14.11},{"x":"chisq(15)","y":19.84},{"x":"chisq(15)","y":8.48},{"x":"chisq(15)","y":11},{"x":"chisq(15)","y":24.12},{"x":"chisq(15)","y":23.63},{"x":"chisq(15)","y":16.25},{"x":"chisq(15)","y":10.18},{"x":"chisq(15)","y":11.59},{"x":"chisq(15)","y":12.15},{"x":"chisq(15)","y":13.94},{"x":"chisq(15)","y":14.28},{"x":"chisq(15)","y":13.67},{"x":"chisq(15)","y":18.74},{"x":"chisq(15)","y":13.49},{"x":"chisq(15)","y":13.46},{"x":"chisq(15)","y":13.34},{"x":"chisq(15)","y":19.91},{"x":"chisq(15)","y":18},{"x":"chisq(15)","y":26.67},{"x":"chisq(15)","y":15.3},{"x":"chisq(15)","y":19.9},{"x":"chisq(15)","y":23.66},{"x":"chisq(15)","y":24.86},{"x":"chisq(15)","y":9.48},{"x":"chisq(15)","y":3.09},{"x":"chisq(15)","y":9.78},{"x":"chisq(15)","y":13.04},{"x":"chisq(15)","y":11.84},{"x":"chisq(15)","y":17.05},{"x":"chisq(15)","y":18.96},{"x":"chisq(15)","y":19.9},{"x":"chisq(15)","y":17.66},{"x":"chisq(15)","y":12.4},{"x":"chisq(15)","y":20.14},{"x":"chisq(15)","y":13.66},{"x":"chisq(15)","y":23.55},{"x":"chisq(15)","y":10.23},{"x":"chisq(15)","y":25.45},{"x":"chisq(15)","y":23.64},{"x":"chisq(15)","y":10.85},{"x":"chisq(15)","y":7.49},{"x":"chisq(15)","y":13.23},{"x":"chisq(15)","y":13.08},{"x":"chisq(15)","y":11.8},{"x":"chisq(15)","y":15.81},{"x":"chisq(15)","y":7.48},{"x":"chisq(15)","y":23.07},{"x":"chisq(15)","y":17.93},{"x":"chisq(15)","y":20.69},{"x":"chisq(15)","y":10.69},{"x":"chisq(15)","y":15.23},{"x":"chisq(15)","y":9.24},{"x":"chisq(15)","y":21.05},{"x":"chisq(15)","y":14.37},{"x":"chisq(15)","y":16.04},{"x":"chisq(15)","y":12.58},{"x":"chisq(15)","y":10.04},{"x":"chisq(15)","y":8.96},{"x":"chisq(15)","y":8.87},{"x":"chisq(15)","y":11.55},{"x":"chisq(15)","y":7.59},{"x":"chisq(15)","y":31.33},{"x":"chisq(15)","y":5.53},{"x":"chisq(15)","y":18.27},{"x":"chisq(15)","y":6.46}],"geoms":["histogram","boxplot"],"x":"distribution","y":"chisq_15","code":{"histogram":"ggplot(df, aes(chisq_15)) +\n  geom_histogram(bins = 30)"}}

That is 500 draws from the exact chi-squared(15) you built by hand two steps back, the same sum of 15 squared standard normals, just run 500 times instead of 20,000. The histogram leans right: it floors out at zero, since you cannot sum squares to a negative number, and it thins out slowly on the right instead of mirroring that thinness on the left. Its mean sits near 15, its own degrees of freedom, and its spread (the square root of 2 times 15) is close to 5.48.

Switch to the boxplot and you see the same shape from a different angle: the box itself sits left of centre in the range the whisker covers, with the longer whisker reaching up, not down. That asymmetry is the right skew again, just drawn as a box instead of bars.

Renu's own statistic, 22.426, would land a little past the middle of this pile, maybe a third of the way toward the right edge, nowhere near the thin stretch past 30 where a genuinely unusual variance would show up. That matches exactly what the 95% band already told you: an ordinary result, not a surprising one.

=== step === concept
## The F distribution: a ratio of two variance estimates

Renu has a second, newer machine, Machine B, and she wants to know if it is more variable than Machine A. Not whether its mean is off, its spread.

She samples 10 bags off Machine B. That gives her a second sample variance to set against Machine A's.

```r
# Sample Machine B and form an F ratio from the two machines' variance estimates
set.seed(22)
bagsB <- round(rnorm(10, 200, 8), 1)

F_stat <- var(bagsB) / var(bagsA)
round(var(bagsA), 3)
#> [1] 37.377
round(var(bagsB), 3)
#> [1] 63.492
round(F_stat, 3)
#> [1] 1.699
round(qf(0.95, df1 = length(bagsB) - 1, df2 = length(bagsA) - 1), 3)
#> [1] 2.588
```

Machine A's sample variance is 37.377, and Machine B's is 63.492, nearly double. Divide one by the other and you get a ratio: 1.699. That ratio, one variance estimate over another, is called an **F statistic**, and it follows the **F distribution**.

You already have the machinery for this, from the chi-squared step. A chi-squared sum divided by its own degrees of freedom is called a mean square, and the F distribution is the ratio of two independent mean squares. Here it carries two degrees-of-freedom numbers instead of one, because two separate samples went into it: 9 from Machine B's 10 bags, and 15 from Machine A's 16.

If the two machines are truly equally variable, this ratio should hover near 1, drifting up or down only by sampling noise. The 95% cutoff for an F with 9 and 15 degrees of freedom is 2.588, by `qf()`. Renu's ratio, 1.699, stays under that cutoff.

So even though Machine B's raw variance looks almost double Machine A's, the gap between them is not yet big enough to call it distinguishable from chance, with only 10 bags sampled from Machine B. More bags from Machine B would pin that ratio down with less noise, and could still tip it either way.

=== step === quiz
## Closing quiz: which distribution answers which question

A third machine, Machine C, comes along, and Renu wants to know whether it is more variable than Machine A. Which distribution answers that question directly?

::quiz {"correct": 1, "gate": true, "difficulty": "advanced"}
- The F distribution, because it is built as a ratio of two independent variance estimates, one from each machine. ::ok Right. The F distribution is exactly a ratio of two variance estimates, so it is the one built to compare one machine's spread against another's.
- The chi-squared distribution, because it already described how one machine's own sample variance behaves. ::no
- The t distribution, because it is the one built for comparing a number against a target. ::no Not this one. The t distribution compares a mean against its own estimated standard error, which is a different question from comparing two variances. Chi-squared comes closer, since it does describe how a single variance estimate behaves, but that is still one estimate on its own, not two of them set against each other. A ratio of two variance estimates is exactly what the F distribution is built from.

=== step === tryit
## Your turn: build and read a chi-squared and an F statistic

Machine C turns out to have been sampled at n = 12 bags, with a sample variance of 50. Fill in both numbers below, then run the block to build its chi-squared statistic against Machine A's known sigma, and its F ratio against Machine A's own sample variance.

```r
# Machine C: fill in its sample size and sample variance, then run both checks
n_C <- ____
var_C <- ____

chisq_C <- (n_C - 1) * var_C / sigma_known^2
round(chisq_C, 3)
round(qchisq(c(0.025, 0.975), df = n_C - 1), 3)

F_C <- var_C / var(bagsA)
round(F_C, 3)
round(qf(0.95, df1 = n_C - 1, df2 = length(bagsA) - 1), 3)
```
::check {"regex": "n_C\\s*<-\\s*12[\\s\\S]*var_C\\s*<-\\s*50", "gate": true, "difficulty": "advanced", "ok": "Right: Machine C's chi-squared statistic, 22, clears the upper cutoff of 21.920, so under a true sigma of 5 a sample variance this large would be unusual. Its F ratio against Machine A, 1.338, stays well under 2.507, so that second comparison alone would not have caught it.", "no": "Set n_C to 12 and var_C to 50, Machine C's own numbers, then run it again."}
::solution
```r
# Machine C's chi-squared statistic and F ratio, with its real numbers filled in
n_C <- 12
var_C <- 50

chisq_C <- (n_C - 1) * var_C / sigma_known^2
round(chisq_C, 3)
#> [1] 22
round(qchisq(c(0.025, 0.975), df = n_C - 1), 3)
#> [1]  3.816 21.920

F_C <- var_C / var(bagsA)
round(F_C, 3)
#> [1] 1.338
round(qf(0.95, df1 = n_C - 1, df2 = length(bagsA) - 1), 3)
#> [1] 2.507
```

Notice the two answers do not agree. Against Machine A's known sigma of 5, Machine C's chi-squared statistic of 22 just clears the upper cutoff of 21.920, so that comparison flags it as unusual. But the F ratio, Machine C's variance of 50 over Machine A's observed 37.377, comes to only 1.338, well under its own cutoff of 2.507.

That is not a contradiction. The two statistics are answering two different questions: one asks whether 50 is unusual against a known sigma of 5, the other asks whether 50 is unusual next to Machine A's own observed variance, which has sampling noise of its own. Picking the right distribution means being clear about which of those two questions you are actually asking.

=== step === concept
::prose-only the sources are text, not a visual
## References

A few places to go deeper on where these four distributions come from and how they connect:

- [Casella, G. and Berger, R., *Statistical Inference* (2nd ed., Chapman and Hall/CRC), Chapter 5, Properties of a Random Sample, including the derivations of the t, chi-squared and F distributions from the normal](https://www.routledge.com/Statistical-Inference/Berger-Casella/p/book/9781032593036)
- [Wasserman, L., *All of Statistics* (Springer), Chapter 5, The Normal and Related Distributions](https://doi.org/10.1007/978-0-387-21736-9)
- [NIST/SEMATECH e-Handbook of Statistical Methods, section 1.3.6, Gallery of Distributions](https://www.itl.nist.gov/div898/handbook/eda/section3/eda36.htm) - the Gaussian, t, chi-square and F entries, free to read.

=== step === complete
## Four distributions, one shared machinery

Look back at everything Renu's 16 bags produced today. A z of 0.54 measured her mean against a known sigma. A t of 0.442 measured the same mean against an estimated one, on 15 degrees of freedom. A chi-squared of 22.426 measured whether her sample variance itself was ordinary. An F of 1.699 measured her variance against Machine B's.

None of the last three needed a new assumption on top of the first. Every one of them is standard normal values, assembled differently: squared and summed for chi-squared, two of those sums ratioed for F, a mean divided by an estimated spread for t. Once you see that, the four distributions stop being four separate things to memorise, and become four honest answers to four different questions about the same kind of data.

The next lesson in this course turns to counting outcomes instead of measuring them: the binomial and Poisson distributions.
