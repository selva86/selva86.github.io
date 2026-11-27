---
title: "Product Metric Design Lesson 8: Ratio Metrics and the Delta Method"
catalog_blurb: "Why a per-user click rate needs its own standard-error formula, not the usual one."
description: "A shopping app's click-through rate interval misses the true rate using the usual standard error formula. See why ratio metrics need the delta method instead."
keywords: "ratio metric, delta method, standard error, confidence interval, click-through rate, coverage, variance, covariance, A/B testing, product metrics"
post_type: "LESSON"
curriculum_id: "3.20.8"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "pds-metrics"
course_title: "Product Metric Design"
course_lesson: "8"
course_total: "9"
course_landing: "Product-Metric-Design-Course.html"
course_next: "Metric-Design-Quiz.html"
course_prev: "Metric-Sensitivity.html"
---

=== step === cover
## Ratio Metrics and the Delta Method

Today let's understand why a metric like click-through rate needs its own way of computing a standard error, and what goes wrong when you reach for the usual formula instead.

Picture a shopping app testing a new "Recommended for you" widget. Over one week, 200 users each see the widget some number of times, anywhere from 1 to 12, and some of those views turn into a click. The team pools every click and every view across all 200 users into one number: the click-through rate, total clicks divided by total views.

Here is the puzzle. Compute the standard error of that click-through rate one way, and you get 0.0080. Compute it a different way, on the exact same week of data, and you get 0.0111. The two sit almost 1.4 times apart, from the same exact numbers.

Here are those two standard errors side by side.

::widget chart-plotter {"data":[{"x":"Naive SE","y":0.008},{"x":"Delta-method SE","y":0.0111}],"geoms":["bar"],"x":"method","y":"se_points"}

The shorter bar is the standard formula for a proportion, the one you likely already know. The taller bar is what the delta method gives, on the exact same data.

=== step === concept
## A metric that is a ratio, not a per-user average

Let's build that week of data for real, so every number from here on is something you can check yourself.

200 users each saw the "Recommended for you" widget a different number of times over the week. Each time a user sees it counts as one impression. Each user also has their own personal chance of clicking it whenever they see it, so some users click often and some almost never. Press Run.

```r
# Build 200 users, each seeing the widget a different number of times, and count their clicks
set.seed(2026)
n_users <- 200
impressions <- 1 + rpois(n_users, 5)
click_propensity <- rbeta(n_users, 0.4, 3.6)
clicks <- rbinom(n_users, impressions, click_propensity)

c(mean_impressions = mean(impressions), mean_clicks = mean(clicks))
#> mean_impressions      mean_clicks 
#>             5.62             0.44 

total_impressions <- sum(impressions)
total_clicks <- sum(clicks)
c(total_impressions = total_impressions, total_clicks = total_clicks)
#> total_impressions      total_clicks 
#>              1124                88 

R_hat <- total_clicks / total_impressions
round(100 * R_hat, 2)
#> [1] 7.83
```

`impressions` draws each user's view count from a Poisson distribution with mean 5, plus 1 so nobody sees the widget zero times. `click_propensity` draws every user's own personal click probability from a Beta distribution, a distribution of values between 0 and 1, whose two shape numbers here make it average 10%. That 10% is the true click rate baked into this simulation, even though any one user's own propensity can sit well above or below it. `clicks` then draws, for each user, how many of their views turned into a click, using that user's own propensity.

On this sample, users saw the widget 5.62 times on average and clicked 0.44 times on average. Pooled across everyone, that is 1,124 total impressions and 88 total clicks. Divide one by the other and you get the click-through rate, `R_hat` = 7.83%. That is the number the team would actually report.

Now here is the thing to notice. In an ordinary per-user average metric, like whether a user bought something at all, each user hands you one clean number: 1 if they bought, 0 if they didn't, and you average those numbers directly. Click-through rate is not like that. Each user hands you two numbers, their own impressions and their own clicks, and the metric you report is the ratio of two sums, total clicks over total impressions, not the average of each user's own personal rate. That is what makes click-through rate, and metrics like revenue per order or pages per session, ratio metrics rather than per-user averages.

=== step === concept
## The naive standard error for a ratio metric

You have one number, `R_hat` = 7.83%. But a single week of data is never the whole story: run the same test again next week, with a different 200 users, and you would get a slightly different rate. A standard error measures how much that rate would typically wobble from one repeat of the experiment to the next, and a 95% confidence interval turns that wobble into a range you can report instead of one bare point.

The most common way to compute a standard error for a rate is to treat every single impression as its own independent coin flip, each one landing a click with probability `R_hat` and no click otherwise, the same way you would compute a standard error for any ordinary proportion. Run it on this sample's numbers.

```r
# Pretend every impression is an independent flip at the overall rate, and build the usual 95% interval
SE_naive <- sqrt(R_hat * (1 - R_hat) / total_impressions)
ci_naive <- R_hat + c(-1, 1) * 1.96 * SE_naive

SE_naive
#> [1] 0.008012568
round(100 * ci_naive, 1)
#> [1] 6.3 9.4
```

`SE_naive` comes out to 0.0080. Multiplying it by 1.96 and adding and subtracting that from `R_hat` gives the usual 95% interval: 6.3% to 9.4%. That 1.96 is the standard multiplier for a 95% interval: under the usual bell-shaped approximation, the true rate falls within 1.96 standard errors of your estimate about 95% of the time.

This formula looks completely reasonable. It is the same formula you would use for any simple proportion. But it carries a hidden assumption: that every one of the 1,124 impressions behaves like its own independent, identical trial, regardless of which of the 200 users it came from.

=== step === widget
## A coverage failure in a simpler case, before the ratio metric

Before coming back to the ratio metric, it helps to see what "the formula's assumption breaks" actually looks like, in a simpler setting: an ordinary sample mean, not a ratio.

Picture drawing a small sample, just 5 values, from a population that is strongly skewed, like waiting times or incomes, where most values are small but a few are huge. Build the usual 95% confidence interval for the mean from that sample. Do that over and over, sixty times, with sixty fresh samples, and count how many of the sixty intervals actually contain the population's true mean. That hit rate is called the interval's coverage. If the formula is honest, coverage should land close to the 95% it claims.

::widget ci-coverage {"method":"z","parent":"skew","n":5}

On a skewed population at n = 5 with the z recipe, only 50 of the 60 intervals, 83%, actually reach the true mean, well short of the 95% the method claims. The z recipe assumes the sample mean is already close to a bell shape, and at n = 5 on a strongly skewed population, it just isn't yet.

This is the shape of failure you are about to see again: a standard-error formula built on an assumption the data does not meet gives you a confidence interval that covers the truth less often than it promises. Try the sliders above. A larger n or a less skewed population brings coverage back up toward 95%, because that is exactly what fixes the broken assumption.

=== step === quiz
## Quick check: what the naive formula assumes

The naive formula treated every one of the 1,124 impressions as its own independent trial at the pooled rate. Which assumption does that actually require?

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- Every impression behaves as an independent, identically distributed trial, no matter which user it came from. ::ok That is exactly the assumption pooling breaks. Users differ in how click-prone they personally are, so one user's impressions are not independent of another user's the way the formula needs.
- The sample, 1,124 impressions, is too small to trust. ::no
- The point estimate itself, `R_hat` = 7.83%, must be wrong. ::no `R_hat` is just total clicks over total impressions, and that ratio does not depend on this assumption at all. What breaks is only its standard error. Collecting more impressions would not fix it either, since the problem is which impressions get pooled together as if they were interchangeable, not how many of them there are.

=== step === concept
## Why pooling impressions overstates the estimate's precision

So what does breaking that assumption actually look like, on this sample? Look at how impressions and clicks vary together across the 200 users.

```r
# See how much users differ from each other in impressions and in clicks
sd_impressions <- sd(impressions)
sd_clicks <- sd(clicks)
cov_impressions_clicks <- cov(impressions, clicks)
cor_impressions_clicks <- cor(impressions, clicks)

c(sd_impressions = sd_impressions, sd_clicks = sd_clicks,
  cov = cov_impressions_clicks, cor = cor_impressions_clicks)
#> sd_impressions      sd_clicks            cov            cor 
#>      2.2090722      0.8946519      0.3338693      0.1689322 
```

Impressions vary a fair amount from user to user, standard deviation 2.21 around a mean of 5.62. Clicks vary too, standard deviation 0.89. And the two move together: covariance 0.33, a correlation of 0.17. Covariance measures the same thing correlation does, how two variables move together, just without rescaling it to sit between -1 and 1.

That positive correlation is the fingerprint of exactly what the naive formula ignores. A user who happens to see the widget more often also tends to generate more clicks, not just because of more chances, but because users genuinely differ in how click-prone they personally are, on top of ordinary click-or-no-click luck. The naive formula pools every impression as if it came from one single shared rate, 7.83% for everybody, and that erases this person-to-person difference entirely. Treat 1,124 impressions as 1,124 independent trials, and you are quietly pretending away the fact that they really came from only 200 independent people.

=== step === concept
## The delta method's standard error for a ratio

If the independent unit is really the user, not the impression, then the standard error has to be built from how users vary, not how impressions vary. That is exactly what the delta method does here: it treats each user's own pair of numbers, their impressions and their clicks, as the one independent draw, and works out how much the ratio of their sums would wobble from one 200-user sample to the next.

Call X a user's own impression count and Y their own click count. For the whole sample, `R_hat` is just the sum of everyone's Y divided by the sum of everyone's X. What you want is the variance of that ratio across repeats of the whole sample, and the delta method gives this formula for it, where n is the number of users and `Xbar` is the average impressions per user.

\[ \text{Var}(\hat{R}) \approx \frac{\text{Var}(Y) - 2\hat{R}\,\text{Cov}(X,Y) + \hat{R}^{2}\,\text{Var}(X)}{n\,\bar{X}^{2}} \]

Three things go into that numerator. `Var(Y)`, how much clicks vary user to user, on their own. `Var(X)`, how much impressions vary user to user, scaled down by `R_hat` squared since impressions matter less once you have already divided by them. And the middle term, minus twice `R_hat` times `Cov(X, Y)`, which subtracts out the part of the wobble that comes from clicks and impressions moving together, the exact thing the last step measured.

```r
# Compute the delta-method variance term by term, then take its square root
Xbar <- mean(impressions)
var_clicks <- var(clicks)
var_impressions <- var(impressions)

term1 <- var_clicks
term2 <- -2 * R_hat * cov_impressions_clicks
term3 <- R_hat^2 * var_impressions
numerator <- term1 + term2 + term3
c(term1 = term1, term2 = term2, term3 = term3, numerator = numerator)
#>       term1       term2       term3   numerator 
#>  0.80040201 -0.05227847  0.02991249  0.77803602 

denominator <- n_users * Xbar^2
denominator
#> [1] 6316.88

Var_delta <- numerator / denominator
SE_delta <- sqrt(Var_delta)
c(Var_delta = Var_delta, SE_delta = SE_delta)
#>    Var_delta     SE_delta 
#> 0.0001231678 0.0110980976 
```

`term1`, `Var(Y)`, is 0.8004. `term2`, the covariance correction, is -0.0523, pulling the variance down because clicks and impressions move together. `term3`, the scaled `Var(X)`, adds back 0.0299. Add the three and divide by n times `Xbar` squared, 200 times 5.62 squared, which is 6,316.88, and you get `Var_delta` = 0.0001232. Take its square root and `SE_delta` = 0.0111.

Compare that to `SE_naive` = 0.0080 from two steps back. The delta-method standard error is close to 1.4 times larger, on the exact same 1,124 impressions and 88 clicks. That is the gap from the cover, now with a formula behind it.

=== step === concept
## The delta-method interval against the naive one

Both standard errors turn into a 95% interval the same way: `R_hat` plus or minus 1.96 times the standard error. The only thing that differs between them is which standard error you plug in.

```r
# Build the delta-method interval and set both intervals next to the true rate
ci_delta <- R_hat + c(-1, 1) * 1.96 * SE_delta

data.frame(
  method = c("naive", "delta"),
  se = round(c(SE_naive, SE_delta), 4),
  lower_pct = round(100 * c(ci_naive[1], ci_delta[1]), 1),
  upper_pct = round(100 * c(ci_naive[2], ci_delta[2]), 1)
)
#>   method     se lower_pct upper_pct
#> 1  naive 0.0080       6.3       9.4
#> 2  delta 0.0111       5.7      10.0
```

Recall the click propensities were drawn from a distribution averaging 10%, so 10.0% is the true rate this whole simulation is built around. The naive interval, 6.3% to 9.4%, misses it completely, sitting entirely below 10%. The delta-method interval, 5.7% to 10.0%, just barely reaches it. Same 1,124 impressions, same 88 clicks, same point estimate 7.83%. Only the standard error changed, and that changed which interval could even reach the truth.

=== step === widget
## Counting misses across 5,000 repeated experiments

One sample is just one sample, though. Maybe this particular week of data was unlucky for the naive formula and lucky for the delta method. The only way to know for sure is to repeat the whole thing many times and count.

Build a fresh 200-user sample with the exact same recipe as before, compute both intervals exactly as in the last few steps, and check whether each one contains the true 10.0% rate. Do that 5,000 times.

Out of 5,000 repeats, the naive interval contains the true rate 4,089 times. That is 81.8% coverage, against its claimed 95%. The delta-method interval contains it 4,708 times, 94.2% coverage, far closer to what it promises.

::widget chart-plotter {"data":[{"x":"Naive","y":0.818},{"x":"Delta method","y":0.942}],"geoms":["bar"],"x":"recipe","y":"coverage"}

That is the same shape of shortfall the ci-coverage widget showed a few steps back, a skewed population breaking the z recipe's assumption at n = 5. Here, it is 200 users differing in their own click propensity breaking the naive formula's assumption, and the delta method, built to account for exactly that difference, comes out close to its target.

=== step === quiz
## Quick check: when the naive shortcut is good enough

The naive formula is not doomed in every situation, though. What if users barely differed from each other in their own click propensity, so most of the gap between naive and delta came from that difference alone?

Run the same 200-user recipe, but this time draw every user's click propensity from a distribution that still averages 10%, just spread out much less, standard deviation 0.022 instead of the original 0.134. Repeat it 3,000 times and compare coverage.

```r
# See whether the naive formula catches up once users stop differing in their own click rate
simulate_once_lowhet <- function(n_users = 200) {
  impressions <- 1 + rpois(n_users, 5)
  p_u <- rbeta(n_users, 18, 162)
  clicks <- rbinom(n_users, impressions, p_u)
  total_impressions <- sum(impressions)
  total_clicks <- sum(clicks)
  R_hat <- total_clicks / total_impressions

  SE_naive <- sqrt(R_hat * (1 - R_hat) / total_impressions)
  ci_naive <- R_hat + c(-1, 1) * 1.96 * SE_naive

  varX <- var(impressions)
  varY <- var(clicks)
  covXY <- cov(impressions, clicks)
  Xbar <- mean(impressions)
  Var_delta <- (varY - 2 * R_hat * covXY + R_hat^2 * varX) / (n_users * Xbar^2)
  SE_delta <- sqrt(Var_delta)
  ci_delta <- R_hat + c(-1, 1) * 1.96 * SE_delta

  c(naive_hit = (0.10 >= ci_naive[1] && 0.10 <= ci_naive[2]),
    delta_hit = (0.10 >= ci_delta[1] && 0.10 <= ci_delta[2]))
}

set.seed(2026)
reps <- 3000
results <- t(sapply(seq_len(reps), function(i) simulate_once_lowhet()))

round(c(naive_coverage = mean(results[, "naive_hit"]),
        delta_coverage = mean(results[, "delta_hit"])), 3)
#> naive_coverage delta_coverage 
#>          0.938          0.943 
```

`rbeta(n_users, 18, 162)` still averages 10%, the same true rate as before, just with much less spread across users. Under this low-heterogeneity recipe, the naive formula covers 93.8% of the time and the delta method covers 94.3%, half a point apart, both close to the claimed 95%. Compare that to the 81.8% against 94.2% from the previous step, under the original, more heterogeneous recipe.

So when is the naive shortcut actually safe?

::quiz {"correct": 1, "gate": true, "difficulty": "advanced"}
- When users barely differ from each other in their own click propensity. It is the person-to-person spread in that personal rate, not the sample size, that decides whether pooling impressions is safe. ::ok Exactly. Low heterogeneity is what closed the gap just now, from 81.8% against 94.2% down to 93.8% against 94.3%, with the sample size held fixed at 200 users in both cases.
- Never. Always reach for the delta method, no matter what the data looks like. ::no
- Whenever you have enough users or enough impressions, regardless of how much they differ from each other. ::no Sample size alone does not fix the independence problem; the ci-coverage widget already showed a formula missing its target even with real data behind it, and the 5,000-repeat check a step back still found an 81.8% miss rate at 200 users. What narrows the gap is low heterogeneity: when every user clicks at close to the same personal rate, there is little person-to-person variance left for the delta method to correct for, so the naive formula's missing covariance term barely matters.

=== step === tryit
## Your turn: compute the delta-method standard error

Time to compute one yourself, on a fresh sample, without being handed the formula's code.

Here is a second, independent batch of 150 users, built with the same recipe as the original 200, just a different random seed. It already prints `Xbar`, `Ybar`, and the variances and covariance you need.

```r
# Build a second, independent 150-user sample with the same recipe, a different seed
set.seed(55)
n_users2 <- 150
impressions2 <- 1 + rpois(n_users2, 5)
click_propensity2 <- rbeta(n_users2, 0.4, 3.6)
clicks2 <- rbinom(n_users2, impressions2, click_propensity2)

Xbar2 <- mean(impressions2)
Ybar2 <- mean(clicks2)
varX2 <- var(impressions2)
varY2 <- var(clicks2)
covXY2 <- cov(impressions2, clicks2)
R_hat2 <- sum(clicks2) / sum(impressions2)

c(Xbar = Xbar2, Ybar = Ybar2, varX = varX2, varY = varY2, covXY = covXY2, R_hat = R_hat2)
#>       Xbar       Ybar       varX       varY      covXY      R_hat 
#> 6.20000000 0.60000000 5.15436242 1.19463087 0.53691275 0.09677419 

# Now compute the delta-method standard error from these five numbers,
# the same way the formula a few steps back built SE_delta. One line.
```
::check {"regex": "(?=.*sqrt)(?=.*varY2)(?=.*varX2)(?=.*covXY2)", "gate": true, "difficulty": "intermediate", "ok": "Right. SE_delta on this fresh sample comes out to about 0.0141, close in spirit to the 0.0111 you saw on the original 200 users. Same three ingredients, a different batch of users.", "no": "Reuse the same formula from a few steps back: the numerator is varY2 minus 2 times R_hat2 times covXY2, plus R_hat2 squared times varX2, all divided by n_users2 times Xbar2 squared, then take the square root with sqrt()."}
::solution
```r
# Plug the five printed numbers into the same three-term delta-method formula
SE_delta2 <- sqrt((varY2 - 2 * R_hat2 * covXY2 + R_hat2^2 * varX2) / (n_users2 * Xbar2^2))
SE_delta2
#> [1] 0.0140547
```

R rounds that to about 0.0141. A different sample, a different `SE_delta`, but the exact same three-term formula produced it.

=== step === concept
## References
::prose-only the references are text, not a visual

- Deng, A., Knoblich, U., and Lu, J. (2018). [Applying the Delta Method in Metric Analytics: A Practical Guide with Novel Ideas](https://doi.org/10.1145/3219819.3219919). KDD '18: 24th ACM SIGKDD International Conference on Knowledge Discovery and Data Mining. The paper this lesson's ratio-metric variance formula comes from.
- Deng, A. and Shi, X. (2016). [Data-Driven Metric Development for Online Controlled Experiments: Seven Lessons Learned](https://doi.org/10.1145/2939672.2939700). KDD '16. On treating click-through rate and similar metrics as ratios rather than per-user averages.
- Kohavi, R., Tang, D., and Xu, Y. (2020). [Trustworthy Online Controlled Experiments: A Practical Guide to A/B Testing](https://doi.org/10.1017/9781108653985). Cambridge University Press. Standard industry reference on ratio metrics and their standard errors in A/B testing practice.

=== step === complete
## One formula for every per-user rate you report

Any time you report a rate built by dividing one per-user total by another, clicks over impressions, revenue over orders, pages over sessions, check whether it needs this formula before you report its standard error.

- Click-through rate is a ratio metric: it divides one per-user sum, clicks, by another, impressions, not a clean 0 or 1 per user that you could just average directly.
- Its standard error needs the variance of the numerator, the variance of the denominator, and the covariance between them, not just the usual proportion formula built for independent trials.
- The delta method supplies exactly that, treating each user, not each impression, as the independent unit: on this lesson's data it mattered a lot, 81.8% coverage against the delta method's 94.2%, over 5,000 repeats.
- But check how much users actually differ in their own rate first. Under low heterogeneity the gap nearly closed, 93.8% against 94.3%.

Before you trust a reported standard error on a per-user rate, ask what the independent unit actually is. If it is the user, and users differ from each other, however you pool the clicks and impressions, you still need the delta method underneath.
