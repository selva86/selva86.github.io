---
title: "Which Distribution When: A Field Guide in R"
slug: "Which-Distribution-When-in-R"
description: "A field guide to choosing the right probability distribution in R. Answer 3 questions, then match your data to the Normal, Poisson, Gamma, Beta and more."
keywords: "which probability distribution to use, choosing a distribution in R, probability distributions in R, dnorm dpois rnorm, fit distribution to data R, discrete vs continuous distribution, distribution decision guide"
auto_link_terms: "which distribution to use|choosing a distribution|probability distribution guide|which probability distribution|distribution field guide|discrete vs continuous distribution|dnorm()|dpois()|rnorm()|choose a distribution in R|distribution decision tree|fitting a distribution"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-07-25"
curriculum_id: "ST2-4.1"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Which Distribution When"
sidebar_order: "12"
difficulty: "Intermediate"
---

<p class="lead">Choosing a probability distribution in R comes down to a few plain questions about your data: do you count it or measure it, does it have a floor or a ceiling, and is it symmetric or lopsided. This field guide answers those questions, then matches each answer to the right distribution and the exact R functions that go with it.</p>

## How do you choose a probability distribution in R?

You open a statistics problem and face a wall of names: normal, binomial, Poisson, gamma, beta, Weibull. Which one models your data? The good news is that you rarely need the whole list. A short chain of questions about the data in front of you narrows it to one or two families. Let us start with the single most useful question and read the answer straight from the data.

The question is this: **do you count your data, or do you measure it?** Counted data lands on whole numbers (0, 1, 2 cars, emails, defects). Measured data can take any value on a scale (7.4 mph, 36.7 degrees, 1.82 metres). To see how different that makes things, let us simulate three everyday quantities and print a small fingerprint of each.

```r title="Fingerprint three everyday quantities"
set.seed(1)
coin_heads <- rbinom(1000, size = 10, prob = 0.5)   # heads in 10 coin flips
complaints <- rpois(1000, lambda = 3)                # complaints logged per day
heights    <- rnorm(1000, mean = 170, sd = 8)        # adult heights in cm

fingerprint <- function(x) data.frame(
  whole_numbers = all(x == floor(x)),
  min = round(min(x), 1),
  max = round(max(x), 1),
  mean = round(mean(x), 1)
)

rbind(
  "coin heads (out of 10)" = fingerprint(coin_heads),
  "daily complaints"       = fingerprint(complaints),
  "adult heights (cm)"     = fingerprint(heights)
)
#>                        whole_numbers min   max  mean
#> coin heads (out of 10)          TRUE   1  10.0   5.0
#> daily complaints                TRUE   0   9.0   2.9
#> adult heights (cm)             FALSE 144 199.1 169.9
```

The `fingerprint()` helper records three things about each quantity: whether every value is a whole number, plus the range and the average. The two count quantities (coin heads and complaints) are all whole numbers, and they live inside natural limits. Heights are not whole numbers at all, and they spread smoothly around their average. That single `whole_numbers` column already splits the world of distributions in two.

[NOTE]
**This whole guide uses base R plus one helper from the MASS package.** Nothing extra to install, and every code block runs in your browser. Base R ships a full family of functions for each distribution, and MASS adds a single fitting function you will meet near the end.

Once you know whether the data is counted or measured, two follow-up questions finish the job:

1. **Is the range bounded?** Some quantities cannot go below zero (waiting times, incomes), and some are trapped between 0 and 1 (proportions, rates). Bounds rule distributions in or out.
2. **Is the shape symmetric or skewed?** A symmetric bell points to the normal. A long right tail points to the skewed families such as the gamma or log-normal.

Those three questions, count-or-measure, bounded-or-not, symmetric-or-skewed, are the whole field guide. The picture below turns them into a map you can follow top to bottom.

![Decision tree for choosing a distribution: count or measure, then the range](screenshots/Which-Distribution-When-in-R-decision-tree.webp)
*Figure 1: The whole guide in one picture: count or measure, then the range.*

[KEY INSIGHT]
**Count-versus-measure is the master fork, and it is almost always obvious.** If you can imagine getting a value of 2.5, the quantity is measured and you are in the continuous families. If only whole numbers make sense, you are in the discrete families. Get this one right and half the wrong distributions disappear before you write any code.

**Try it:** Decide whether each quantity below is discrete (counted) or continuous (measured). Replace each `"?"` with your answer.

```r title="Your turn: classify three quantities"
# For each quantity, is it discrete (counts) or continuous (measured)?
ex_emails_per_day  <- "?"   # number of emails you get in a day
ex_body_temp       <- "?"   # a person's body temperature in Celsius
ex_defective_bulbs <- "?"   # defective bulbs in a box of 50

cat(ex_emails_per_day, ex_body_temp, ex_defective_bulbs)
# Expected: discrete continuous discrete
```

<details>
<summary>Click to reveal solution</summary>

```r title="Classify three quantities solution"
ex_emails_per_day  <- "discrete"    # you count whole emails: 0, 1, 2, ...
ex_body_temp       <- "continuous"  # temperature can be 36.7, 37.15, ...
ex_defective_bulbs <- "discrete"    # a count out of 50 trials

cat(ex_emails_per_day, ex_body_temp, ex_defective_bulbs)
#> discrete continuous discrete
```

**Explanation:** Emails and defective bulbs are things you tally in whole units, so they are discrete. Body temperature sits on a continuous scale where any in-between value is possible.

</details>

## What do R's d, p, q, and r functions do?

Before we tour the distributions, you need one piece of shared vocabulary, because every distribution in R follows the same naming pattern. Each family has a short root name (`norm` for normal, `pois` for Poisson, `binom` for binomial) and four prefixes you attach to it. Learn the four prefixes once and you can work with any distribution.

Here is what each prefix means, shown on the normal with our height model (mean 170 cm, standard deviation 8 cm).

```r title="The d, p and q functions on the normal"
dnorm(180, mean = 170, sd = 8)    # density: relative likelihood right at 180 cm
pnorm(180, mean = 170, sd = 8)    # probability of being below 180 cm
qnorm(0.975, mean = 170, sd = 8)  # the height with 97.5% of people below it
#> [1] 0.02283114
#> [1] 0.8943502
#> [1] 185.6797
```

Read those three numbers as a sentence about heights. The density at 180 cm is 0.023, a relative height of the curve at that point. The probability of being below 180 cm is 0.894, so about 89% of adults are shorter than 180 cm. And 97.5% of adults are shorter than 185.7 cm, which is what `qnorm(0.975, ...)` returns: the quantile that leaves 97.5% below it. The `p` and `q` prefixes are inverses of each other.

The fourth prefix, `r`, draws random values from the distribution. This is how you simulate data.

```r title="Draw random values with rnorm"
set.seed(7)
rnorm(5, mean = 170, sd = 8)      # five random heights drawn from this model
#> [1] 188.2980 160.4258 164.4457 166.7017 162.2346
```

Every one of those five heights is a plausible draw from a population averaging 170 cm. Setting the seed with `set.seed()` first makes the draw reproducible, so you and I get the same five numbers.

There is one wrinkle worth stating clearly. For a **continuous** distribution, `d` gives a density, not a probability, because the chance of landing on any exact value is zero. For a **discrete** distribution, `d` gives an honest probability of an exact outcome. Watch the difference on the Poisson, where counts are whole numbers.

```r title="The d and p functions on the Poisson"
dpois(2, lambda = 4)      # probability of EXACTLY 2 calls in an hour
ppois(2, lambda = 4)      # probability of 2 or fewer calls
#> [1] 0.1465251
#> [1] 0.2381033
```

Here `dpois(2, lambda = 4)` is a real probability: there is a 14.7% chance of exactly 2 calls when the average is 4 per hour. And `ppois(2, ...)` adds up the chances of 0, 1, and 2 calls to give 23.8%.

[NOTE]
**The root names are short and consistent.** Common ones are `norm`, `pois`, `binom`, `unif`, `exp`, `gamma`, `beta`, and `lnorm` for the log-normal. Attach `d`, `p`, `q`, or `r` to any of them and the function exists. Type `?Distributions` in the console for the full list.

**Try it:** Using the same height model (mean 170, sd 8), what fraction of adults are shorter than 160 cm? The `pnorm()` function gives the probability below a value.

```r title="Your turn: probability below 160 cm"
# Fill in a pnorm() call for the height below 160 cm.
ex_below_160 <- NA   # replace NA with a pnorm(...) call
ex_below_160
# Expected: about 0.106
```

<details>
<summary>Click to reveal solution</summary>

```r title="Probability below 160 cm solution"
ex_below_160 <- pnorm(160, mean = 170, sd = 8)
round(ex_below_160, 3)
#> [1] 0.106
```

**Explanation:** `pnorm(160, ...)` accumulates all the probability below 160 cm. About 10.6% of adults in this model are shorter than 160 cm.

</details>

## Which distributions fit count data?

Count data is the discrete branch: whole numbers with a natural floor of zero. Two distributions cover the vast majority of count problems, and telling them apart comes down to one question: **is there a fixed number of trials?**

The **binomial** models a fixed number of independent yes/no trials, each with the same success probability. Think 20 quiz questions, 50 manufactured parts, 100 email sends. You count how many succeed. Suppose a student guesses on a 20-question quiz with 4 options each, so the chance of a correct guess is 0.25.

```r title="Binomial probabilities for a guessed quiz"
n <- 20; p <- 0.25
dbinom(8, size = n, prob = p)         # P(exactly 8 correct)
sum(dbinom(8:20, size = n, prob = p)) # P(8 or more correct)
c(mean = n * p, variance = n * p * (1 - p))
#> [1] 0.06088669
#> [1] 0.1018119
#>     mean variance
#>     5.00     3.75
```

Guessing gives a 6.1% chance of exactly 8 correct and a 10.2% chance of 8 or more. The expected score is `n * p = 5` correct, and the variance is `n * p * (1 - p) = 3.75`. For the binomial, the mean and variance follow a fixed rule.

$$\mu = np, \qquad \sigma^2 = np(1-p)$$

Where $\mu$ is the mean number of successes, $\sigma^2$ is the variance, $n$ is the number of trials, and $p$ is the success probability. If formulas are not your thing, skip them, the numbers in the output already tell the story.

The **Poisson** models counts of events over an interval of time or space when there is no fixed number of trials: sign-ups per hour, typos per page, potholes per mile. Its one parameter, lambda, is the average count per interval.

```r title="Poisson probabilities for hourly sign-ups"
lambda <- 4
dpois(6, lambda)                     # P(exactly 6 sign-ups this hour)
ppois(2, lambda)                     # P(2 or fewer sign-ups)
c(mean = lambda, variance = lambda)  # Poisson's signature: mean equals variance
#> [1] 0.1041956
#> [1] 0.2381033
#>     mean variance
#>        4        4
```

With an average of 4 sign-ups per hour, there is a 10.4% chance of exactly 6 and a 23.8% chance of 2 or fewer. The Poisson has a famous signature: **its mean equals its variance.** That property is also its weak spot, and the diagram below shows where it fails.

![Decision guide for count distributions](screenshots/Which-Distribution-When-in-R-discrete-guide.webp)
*Figure 2: Choosing among the count distributions.*

Real count data is often more spread out than a Poisson allows, a situation called overdispersion. When the variance runs well above the mean, reach for the **negative binomial** instead. Let us simulate overdispersed counts and check.

```r title="Detect overdispersion in counts"
set.seed(21)
overdispersed <- rnbinom(500, size = 2, mu = 4)   # negative binomial counts
c(mean = round(mean(overdispersed), 2),
  variance = round(var(overdispersed), 2))
#>     mean variance
#>     4.21    11.81
```

The mean is about 4.2 but the variance is 11.8, nearly three times larger. A Poisson would insist the variance equals the mean, so it would badly understate the spread. The negative binomial adds a second parameter precisely to let the variance grow.

[WARNING]
**If the variance is far bigger than the mean, do not force a Poisson.** The Poisson locks the variance to equal the mean, so it will report false confidence on overdispersed counts. Check the ratio of variance to mean first; a value well above 1 is your signal to switch to the negative binomial.

**Try it:** A factory line makes items with a 3% defect rate. In a box of 50, what is the probability of exactly 2 defects? This is a binomial with 50 trials and a success probability of 0.03.

```r title="Your turn: probability of exactly 2 defects"
# Fill in a dbinom() call: 2 defects, size = 50, prob = 0.03.
ex_defects <- NA   # replace NA with a dbinom(...) call
ex_defects
# Expected: about 0.256
```

<details>
<summary>Click to reveal solution</summary>

```r title="Probability of 2 defects solution"
ex_defects <- dbinom(2, size = 50, prob = 0.03)
round(ex_defects, 3)
#> [1] 0.256
```

**Explanation:** A fixed batch of 50 parts with the same defect probability is a textbook binomial. There is a 25.6% chance of finding exactly 2 defects.

</details>

## Which distribution fits symmetric, bell-shaped data?

Now cross into measured data. The first continuous family to check is the one you already know: the **normal**, the symmetric bell curve. It shows up whenever many small effects add together, which is why measurements like heights, along with the averages of large samples, tend to look normal. A quick tell for normal-shaped data is that its mean and median sit close together, because a symmetric shape has no long tail to drag the mean away.

Let us check daily temperatures from the built-in `airquality` dataset.

```r title="Check symmetry of temperature data"
temp <- airquality$Temp     # daily max temperature, no missing values
c(mean = round(mean(temp), 1),
  median = round(median(temp), 1),
  sd = round(sd(temp), 1))
#>   mean median     sd
#>   77.9   79.0    9.5
```

The mean (77.9) and median (79.0) are almost on top of each other, exactly what you expect from a roughly symmetric shape. A histogram with a matching normal curve makes the fit visible.

```r title="Histogram of temperature with a normal curve"
hist(temp, breaks = 12, freq = FALSE, col = "grey85", border = "white",
     main = "Daily temperature", xlab = "Temperature (F)")
curve(dnorm(x, mean = mean(temp), sd = sd(temp)),
      add = TRUE, col = "steelblue", lwd = 2)
```

The bars follow the blue normal curve reasonably well, with a slight lean but no dramatic tail. This is the continuous map you will be working through in the next few sections.

![Decision guide for continuous distributions by shape](screenshots/Which-Distribution-When-in-R-continuous-guide.webp)
*Figure 3: Choosing among the continuous distributions by shape.*

Sometimes data is bell-shaped but produces more extreme values than a normal expects. That is the job of **Student's t**, which looks like the normal but with heavier tails. Its one parameter, the degrees of freedom, controls how heavy those tails are: fewer degrees of freedom means heavier tails and more frequent extreme values. It is the safer choice for small samples and for data prone to occasional outliers. Compare how often each distribution produces a value more than 3 standard deviations from centre.

```r title="Compare the tails of the normal and t"
tail_normal <- 2 * pnorm(-3)          # both tails, standard normal
tail_t3     <- 2 * pt(-3, df = 3)     # both tails, t with 3 degrees of freedom
c(normal = round(tail_normal, 4),
  t_df3  = round(tail_t3, 4))
#> normal  t_df3
#> 0.0027 0.0577
```

The normal puts only 0.27% of its probability beyond 3 standard deviations, while a t with 3 degrees of freedom puts 5.77% out there, more than 20 times as much. That is why the t is the more realistic model when your data produces the occasional extreme value.

[TIP]
**A mean and median that nearly match is your fast symmetry check.** When they agree, a symmetric family like the normal is a good starting bet. When the mean sits clearly above the median, the data is right-skewed and you should move to the skewed families in the next section.

**Try it:** Is the fuel economy in `mtcars$mpg` roughly symmetric? Compare its mean and median.

```r title="Your turn: is mpg symmetric"
# Compute the mean and median of mtcars$mpg and compare them.
ex_mean_mpg   <- NA   # replace with mean(mtcars$mpg)
ex_median_mpg <- NA   # replace with median(mtcars$mpg)
c(ex_mean_mpg, ex_median_mpg)
# Expected: mean about 20.1, median about 19.2 (close, mildly right-skewed)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Is mpg symmetric solution"
ex_mean_mpg   <- mean(mtcars$mpg)
ex_median_mpg <- median(mtcars$mpg)
round(c(mean = ex_mean_mpg, median = ex_median_mpg), 1)
#>   mean median
#>   20.1   19.2
```

**Explanation:** The mean (20.1) sits a little above the median (19.2), a mild right skew. It is close enough that a normal is a reasonable first approximation, though a skewed family might fit slightly better.

</details>

## Which distributions fit positive, skewed data?

A huge amount of real-world data is positive and right-skewed: waiting times, incomes, rainfall, insurance claims, file sizes. These values cannot go below zero, and they trail off in a long right tail. Several distributions live here, and the right one depends on how the data is generated.

Start with the **exponential**, which models the waiting time between random events that happen at a steady rate. Its defining trait is memorylessness: how long you have already waited tells you nothing about how much longer you will wait. If buses arrive on average every 10 minutes, the rate is 1/10 per minute.

```r title="Exponential waiting times for a bus"
rate <- 1 / 10
pexp(5, rate)         # P(next bus within 5 minutes)
qexp(0.5, rate)       # median wait: half the time you wait less than this
c(mean = 1 / rate)    # average wait in minutes
#> [1] 0.3934693
#> [1] 6.931472
#> mean
#>   10
```

There is a 39.3% chance the next bus arrives within 5 minutes, the median wait is 6.9 minutes, and the average wait is 10 minutes. Notice the median is smaller than the mean, the fingerprint of a right skew.

$$E[X] = \frac{1}{\lambda}$$

Where $E[X]$ is the mean waiting time and $\lambda$ is the event rate. A faster rate means a shorter average wait.

Next is the **log-normal**, the distribution for quantities built by multiplying many small effects rather than adding them. Incomes and city populations often look log-normal, as do stock prices. Its definition is simple: a quantity is log-normal when its logarithm is normal. Let us simulate incomes and confirm.

```r title="Log-normal incomes and the log transform"
set.seed(33)
income <- rlnorm(1000, meanlog = 10, sdlog = 0.5)   # simulated annual incomes
c(mean = round(mean(income)), median = round(median(income)))
c(raw_mean_over_median = round(mean(income) / median(income), 2),
  log_mean_over_median = round(mean(log(income)) / median(log(income)), 2))
#>   mean median
#>  25220  22587
#> raw_mean_over_median log_mean_over_median
#>                 1.12                 1.00
```

On the raw scale the mean sits 12% above the median, a clear right skew. Take logarithms and the ratio drops to 1.00, meaning the logged data is symmetric. That collapse of the skew after a log transform is the signature of log-normal data, and it is also why analysts model incomes on a log scale.

The **gamma** is the flexible workhorse for positive, right-skewed quantities such as rainfall totals and insurance claim sizes. Its two parameters (shape and rate) let it stretch from a steep exponential-like curve to a gentle bell, and its mean is shape divided by rate.

```r title="Gamma distribution for positive skewed data"
g_shape <- 2; g_rate <- 0.5
c(mean = g_shape / g_rate, variance = g_shape / g_rate^2)
pgamma(6, shape = g_shape, rate = g_rate)   # P(value at most 6)
#>     mean variance
#>        4        8
#> [1] 0.8008517
```

This gamma has a mean of 4 and a variance of 8, and 80% of its values fall at or below 6. When the exponential is too rigid but the data is still positive and skewed, the gamma is usually the answer.

[KEY INSIGHT]
**Positive and right-skewed narrows you to the gamma family, then the mechanism picks the member.** Waiting time between events points to the exponential, a multiplicative process points to the log-normal, and a general positive skew points to the gamma. You are choosing based on how the data was generated, not just its shape.

**Try it:** Calls arrive on average every 4 minutes, so the rate is 1/4 per minute. What is the probability the next call comes within 2 minutes? Use `pexp()`.

```r title="Your turn: probability of a call within 2 minutes"
# Fill in a pexp() call with rate = 1/4 for a wait of 2 minutes.
ex_call_2min <- NA   # replace NA with a pexp(...) call
ex_call_2min
# Expected: about 0.393
```

<details>
<summary>Click to reveal solution</summary>

```r title="Probability of a call within 2 minutes solution"
ex_call_2min <- pexp(2, rate = 1/4)
round(ex_call_2min, 3)
#> [1] 0.393
```

**Explanation:** With a rate of 1/4 per minute, the chance of waiting less than 2 minutes is 39.3%. Because the exponential is memoryless, this holds no matter how long you have already been waiting.

</details>

## Which distributions fit proportions and bounded ranges?

Some data lives inside hard walls. Proportions and rates are trapped between 0 and 1, and some quantities are equally likely across a fixed range. Two distributions handle these bounded cases.

The **beta** is the distribution for anything constrained to the interval from 0 to 1: conversion rates, click-through rates, the probability of an event, the fraction of a task completed. Its two shape parameters, a and b, bend it toward 0 or toward 1, or shape it into a hump in the middle. The mean is a divided by (a + b).

```r title="Beta distribution for a conversion rate"
a <- 8; b <- 2
c(mean = a / (a + b))                 # average proportion
pbeta(0.9, a, b)                      # P(proportion below 0.9)
set.seed(9)
round(rbeta(5, a, b), 3)              # five simulated rates
#> mean
#>  0.8
#> [1] 0.774841
#> [1] 0.895 0.900 0.821 0.839 0.931
```

This beta has a mean proportion of 0.8, there is a 77.5% chance the rate falls below 0.9, and the five simulated rates all land between 0.82 and 0.93. Every draw respects the 0-to-1 boundary automatically, which a normal never would.

The **uniform** is the flat distribution: every value in a range is equally likely, with no peak. It models a genuinely random pick within known limits, and it is the default when you have no reason to prefer one value over another. Say a bus is equally likely to arrive at any minute within a 10-minute window.

```r title="Uniform distribution over a fixed range"
punif(3, min = 0, max = 10)           # P(arrival in the first 3 minutes)
c(mean = (0 + 10) / 2)                # the midpoint is the mean
#> [1] 0.3
#> mean
#>    5
```

Because every minute is equally likely, the chance of arrival in the first 3 of 10 minutes is exactly 0.3, and the average arrival time is the midpoint, 5 minutes. The uniform has no skew and no peak, just a flat slab of equal probability.

[NOTE]
**The beta is the natural model for a probability itself.** When the quantity you are studying is a rate or a proportion, the beta keeps every value between 0 and 1 by construction, which is why it is the standard prior for a success probability in Bayesian analysis.

**Try it:** A beta with a = 2 and b = 5 models a low conversion rate. What is its mean proportion? The mean is a divided by (a + b).

```r title="Your turn: mean of a beta"
# Compute the mean of a Beta(a = 2, b = 5): mean = a / (a + b).
ex_beta_mean <- NA   # replace NA with the formula using a = 2, b = 5
ex_beta_mean
# Expected: about 0.286
```

<details>
<summary>Click to reveal solution</summary>

```r title="Mean of a beta solution"
ex_a <- 2; ex_b <- 5
ex_beta_mean <- ex_a / (ex_a + ex_b)
round(ex_beta_mean, 3)
#> [1] 0.286
```

**Explanation:** With more weight on b than a, the beta leans toward 0, giving a mean proportion of 0.286, a plausible low conversion rate.

</details>

## How do you fit a distribution to your own data?

So far you have matched distributions to data by eye and by rule of thumb. To go further, you estimate the distribution's parameters from the data and then check how well it fits. The workflow has four steps: describe the data, guess a family from its shape, estimate the parameters by maximum likelihood, then confirm the fit. R's `fitdistr()` from the MASS package handles the estimation using maximum likelihood, which is a principled way of finding the parameter values that make your observed data most probable.

Let us make this concrete by simulating 300 waiting times and pretending we do not know where they came from. Step one is to describe them.

```r title="Describe an unknown positive sample"
library(MASS)
set.seed(50)
mystery <- rgamma(300, shape = 2, rate = 0.4)   # 300 waiting times, treated as real data
c(min = round(min(mystery), 2),
  mean = round(mean(mystery), 2),
  median = round(median(mystery), 2))
#>    min   mean median
#>   0.12   4.89   4.10
```

The values are positive (the minimum is 0.12) and right-skewed (the mean of 4.89 sits above the median of 4.10). Step two is to guess a family: that positive skew points to the gamma. Step three is to estimate the gamma's parameters with `fitdistr()`.

```r title="Fit a gamma with maximum likelihood"
fit_gamma <- fitdistr(mystery, "gamma")
fit_gamma
#>      shape         rate
#>   2.08158696   0.42579746
#>  (0.15823422) (0.03657826)
```

The fit recovers a shape of about 2.08 and a rate of about 0.43, close to the true values of 2 and 0.4 that generated the data. The numbers in parentheses are standard errors, a measure of how precise each estimate is. But how do we know gamma beats a simpler guess like the normal? Step four compares the candidates using log-likelihood, where a higher value means a better fit.

```r title="Compare gamma and normal fits"
fit_norm <- fitdistr(mystery, "normal")
c(gamma_logLik  = round(as.numeric(logLik(fit_gamma)), 1),
  normal_logLik = round(as.numeric(logLik(fit_norm)), 1))
#>  gamma_logLik normal_logLik
#>        -737.8        -780.2
```

The gamma scores -737.8 against the normal's -780.2. Higher is better, so the gamma is the clear winner, which makes sense because the normal cannot capture the positive skew or the hard floor at zero.

[WARNING]
**Do not estimate parameters and then test them with the same data using a plain ks.test.** Feeding fitted parameters into a Kolmogorov-Smirnov test makes its p-value too optimistic, because the parameters were tuned to that data. Compare candidate models with log-likelihood or AIC instead, or use a test designed for estimated parameters. A Q-Q plot is a reliable visual check.

**Try it:** Fit a normal distribution to `mtcars$mpg` with `fitdistr()`. It returns the estimated mean and standard deviation.

```r title="Your turn: fit a normal to mpg"
# Replace NULL with fitdistr(mtcars$mpg, "normal").
ex_fit <- NULL
ex_fit
# Expected: mean about 20.09, sd about 5.93
```

<details>
<summary>Click to reveal solution</summary>

```r title="Fit a normal to mpg solution"
ex_fit <- fitdistr(mtcars$mpg, "normal")
ex_fit
#>       mean          sd
#>   20.0906250    5.9320296
#>  ( 1.0486446) ( 0.7415037)
```

**Explanation:** `fitdistr()` estimates a mean of 20.09 and a standard deviation of 5.93 for the fuel economy, matching the summary statistics you computed earlier.

</details>

## Putting It All Together

Let us run the full field guide on a real dataset from start to finish. The `airquality$Wind` column holds daily wind speeds at a New York monitoring station, and we want the distribution that best describes them.

Step one, walk the three questions. Wind speed is measured, not counted, so it is continuous. It cannot go below zero, so it is positive. And we need to see its shape. Let us describe it.

```r title="Describe the wind speed data"
wind <- airquality$Wind
cat("missing values:", sum(is.na(wind)), "\n")
c(min = min(wind), mean = round(mean(wind), 1), median = round(median(wind), 1))
#> missing values: 0
#>    min   mean median
#>    1.7   10.0    9.7
```

There are no missing values, the minimum is 1.7 mph, and the mean (10.0) and median (9.7) are close, so the data is roughly symmetric. That gives us two reasonable candidates: the normal, because the shape is near-symmetric, and the Weibull, a flexible positive distribution often used for wind speeds. Let us fit both and compare them with AIC, where a lower value means a better fit after accounting for model complexity.

```r title="Fit and compare normal and Weibull"
fit_n <- fitdistr(wind, "normal")
fit_w <- fitdistr(wind, "weibull")
c(normal_AIC  = round(AIC(fit_n), 1),
  weibull_AIC = round(AIC(fit_w), 1))
#>  normal_AIC weibull_AIC
#>       822.5       821.0
```

The two AIC values are 822.5 and 821.0, a difference of just 1.5. A gap that small counts as a tie: the models fit about equally well. When two candidates are this close, the sensible move is to pick the simpler, more interpretable model and report its parameters.

```r title="Report the chosen fit"
# The AIC gap is under 2, which is a statistical tie. Prefer the simpler normal.
fit_n
#>      mean         sd
#>   9.9575163   3.5114694
#>  (0.2838855) (0.2007373)
```

The normal fit gives a mean wind speed of about 9.96 mph and a standard deviation of about 3.51 mph. A final Q-Q plot confirms the choice: if the points hug the diagonal, the normal model fits.

```r title="Q-Q plot for the wind fit"
qqnorm(wind, main = "Wind speed vs a normal model")
qqline(wind, col = "red", lwd = 2)
```

The points fall close to the red line through the middle of the data, with only mild deviation at the extremes, so the normal is a defensible, and simple, model for daily wind speed.

## Practice Exercises

These exercises combine several ideas from the guide. Try each one before opening the solution, and note that they use their own variable names so they will not disturb the earlier examples.

### Exercise 1: Model a defect count and confirm by simulation

A machine produces parts with a 5% defect rate. In batches of 40, model the number of defects. Identify the distribution, compute the probability of a batch with no defects, and then confirm that probability by simulating 100000 batches.

```r title="Exercise 1: defect count"
# (a) Which distribution fits "defects in a fixed batch of 40"?
# (b) Compute P(no defects in a batch of 40, defect rate 5%).
# (c) Confirm (b) by simulating 100000 batches and counting the zero-defect ones.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Defect count solution"
# (a) Binomial: a fixed 40 trials, each defective with probability 0.05.
p_none <- dbinom(0, size = 40, prob = 0.05)
round(p_none, 3)
#> [1] 0.129

# (c) Confirm by simulation
set.seed(2024)
sim <- rbinom(100000, size = 40, prob = 0.05)
round(mean(sim == 0), 3)
#> [1] 0.128
```

**Explanation:** A fixed batch of 40 with a constant defect rate is a binomial. The exact probability of zero defects is 0.129, and simulating 100000 batches gives 0.128, confirming the formula.

</details>

### Exercise 2: Spot and fit a skewed distribution

The vector below holds 500 house prices (in thousands of dollars). Show that the data is right-skewed by comparing its mean and median, then fit both a log-normal and a normal distribution and compare them by AIC. The lower AIC wins.

```r title="Exercise 2: house prices"
set.seed(88)
my_prices <- rlnorm(500, meanlog = 5.8, sdlog = 0.4)
# (a) Show the right skew: compare mean and median.
# (b) Fit a log-normal and a normal with fitdistr(), then compare AIC.
# Hint: fitdistr(x, "lognormal") and fitdistr(x, "normal").

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="House prices solution"
set.seed(88)
my_prices <- rlnorm(500, meanlog = 5.8, sdlog = 0.4)

# (a) Right skew: the mean sits above the median.
c(mean = round(mean(my_prices)), median = round(median(my_prices)))
#>   mean median
#>    364    344

# (b) Compare the two fits by AIC (lower is better).
fit_ln <- fitdistr(my_prices, "lognormal")
fit_no <- fitdistr(my_prices, "normal")
c(lognormal_AIC = round(AIC(fit_ln), 1),
  normal_AIC    = round(AIC(fit_no), 1))
#> lognormal_AIC    normal_AIC
#>        6317.1        6424.6
```

**Explanation:** The mean (364) sits above the median (344), the hallmark of a right skew. The log-normal AIC (6317.1) is more than 100 points below the normal AIC (6424.6), so the log-normal is the far better model, as expected for a multiplicative quantity like prices.

</details>

### Exercise 3: Diagnose overdispersion in counts

A support desk logs the daily ticket counts below. Compute the mean and variance, then decide whether a Poisson (which requires the mean to equal the variance) or a negative binomial is the better model.

```r title="Exercise 3: ticket counts"
tickets <- c(2, 0, 5, 1, 9, 0, 3, 14, 1, 2, 7, 0, 11, 4, 1, 6, 0, 8, 3, 20)
# (a) Compute the mean and variance of tickets.
# (b) The Poisson assumes mean == variance. Does that hold here?
# (c) Compute the dispersion ratio (variance / mean) and state your choice.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Ticket counts solution"
tickets <- c(2, 0, 5, 1, 9, 0, 3, 14, 1, 2, 7, 0, 11, 4, 1, 6, 0, 8, 3, 20)

# (a) mean and variance
c(mean = round(mean(tickets), 2), variance = round(var(tickets), 2))
#>     mean variance
#>     4.85    28.77

# (c) dispersion ratio: 1 means Poisson-like, much higher means overdispersed
round(var(tickets) / mean(tickets), 1)
#> [1] 5.9
```

**Explanation:** The variance (28.77) is nearly six times the mean (4.85), so the dispersion ratio is 5.9. A Poisson would demand a ratio of 1, so it badly understates the spread here. The negative binomial, which allows extra variance, is the correct model.

</details>

## Frequently Asked Questions

**What is the difference between a PMF and a PDF?**

A probability mass function (PMF) applies to discrete distributions and gives the exact probability of each whole-number outcome, so `dpois(2, 4)` is a genuine probability. A probability density function (PDF) applies to continuous distributions and gives a density, not a probability, because the chance of any single exact value is zero. For continuous data you get probabilities by integrating the density over a range, which is what `pnorm()` and `pexp()` do for you.

**Can I always just use the normal distribution?**

Not safely. The normal assumes symmetric, unbounded data, so it misbehaves on counts (which are discrete), on waiting times and incomes (which are positive and skewed), and on proportions (which are bounded between 0 and 1). It is a fine default for symmetric measurements and for averages of large samples, thanks to the Central Limit Theorem, but forcing it onto skewed or bounded data produces impossible predictions like negative wait times.

**How much data do I need to choose a distribution?**

Enough to see the shape, which usually means at least 30 to 50 points, and more for the tails. With very few observations, several distributions will fit about equally well and the choice should lean on how the data is generated (for example, waiting times are exponential by mechanism) rather than on the sample shape alone.

**What if two distributions fit equally well?**

That is common and fine. When candidates are within about 2 AIC points, as the wind speed example showed, treat it as a tie and pick the simpler, more interpretable model. You lose almost nothing in fit and gain a lot in clarity.

**Do I need to know the distribution before running a t-test?**

For a t-test you mainly care whether the data (or the average of it) is roughly normal, which the Central Limit Theorem often delivers for larger samples even when individual values are not normal. Choosing a full distribution matters more when you are modelling the data itself or computing probabilities from its tails.

## Summary

The whole field guide reduces to three questions and a lookup table. Ask whether the data is counted or measured, whether its range is bounded, and whether its shape is symmetric or skewed. Then read off the family.

| Data situation | Distribution | R root | Mean / spread signal | Everyday example |
|---|---|---|---|---|
| Counts, fixed number of trials | Binomial | `binom` | mean `n*p` | correct answers on a quiz |
| Counts, events per interval | Poisson | `pois` | mean equals variance | sign-ups per hour |
| Counts, variance far above mean | Negative binomial | `nbinom` | variance greater than mean | daily support tickets |
| Measured, symmetric bell | Normal | `norm` | mean near median | heights, temperatures |
| Measured, symmetric, heavy tails | Student's t | `t` | more outliers than normal | small-sample estimates |
| Measured, positive, waiting time | Exponential | `exp` | mean `1/rate` | time between arrivals |
| Measured, positive, multiplicative | Log-normal | `lnorm` | log is symmetric | incomes, prices |
| Measured, positive, general skew | Gamma | `gamma` | mean `shape/rate` | rainfall, claim sizes |
| Measured, bounded 0 to 1 | Beta | `beta` | mean `a/(a+b)` | conversion rates |
| Measured, flat over a range | Uniform | `unif` | midpoint is the mean | a random pick in a window |

To go from a guess to a fitted model: describe the data, pick a family from its shape and mechanism, estimate parameters with `fitdistr()` from MASS, then confirm the choice with AIC and a Q-Q plot. When two families tie, prefer the simpler one.

## References

1. R Core Team, Distributions in the stats package. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/Distributions.html)
2. Venables, W. N. & Ripley, B. D., fitdistr() in the MASS package. [Link](https://stat.ethz.ch/R-manual/R-devel/library/MASS/html/fitdistr.html)
3. Delignette-Muller, M. L. & Dutang, C., Overview of the fitdistrplus package. [Link](https://cran.r-project.org/web/packages/fitdistrplus/vignettes/fitdistrplus_vignette.html)
4. NIST/SEMATECH, e-Handbook of Statistical Methods: Gallery of Distributions. [Link](https://www.itl.nist.gov/div898/handbook/eda/section3/eda366.htm)
5. Penn State Eberly College of Science, STAT 414: Introduction to Probability Theory. [Link](https://online.stat.psu.edu/stat414/)
6. Wikipedia, List of probability distributions. [Link](https://en.wikipedia.org/wiki/List_of_probability_distributions)
7. Prabhakaran, S., Fitting Distributions to Data in R. [Link](https://r-statistics.co/Fitting-Distributions-to-Data-in-R.html)

## Continue Learning

- **[Fitting Distributions to Data in R](Fitting-Distributions-to-Data-in-R.html)**, once you know which family to try, this tutorial goes deep on estimating parameters and running formal goodness-of-fit checks with fitdistrplus.
- **[Normal, t, F and Chi-Squared Distributions in R](Normal-t-F-and-Chi-Squared-Distributions-in-R.html)**, a focused look at the four distributions that power most hypothesis tests, including how they relate to each other.
- **[Binomial and Poisson Distributions in R](Binomial-and-Poisson-Distributions-in-R.html)**, the two count distributions from this guide, worked through in full with more examples and the link between them.
