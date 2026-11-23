---
title: "Generalized Linear Models Lesson 8: Checking a GLM with simulated residuals"
catalog_blurb: "Build simulated residuals by hand, and use them to catch three real GLM faults."
description: "A Poisson GLM's residual plot fans out even when the model is right. Build the simulated quantile residual by hand, and use it to catch three real faults."
keywords: "simulated residuals in r, randomized quantile residuals, dharma package r, poisson glm diagnostics, overdispersion test, missing offset glm, zero inflated count model, posterior predictive check, glm residual plot, goodness of fit test"
post_type: "LESSON"
curriculum_id: "4.80.8"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "res-glm"
course_title: "Generalized Linear Models"
course_lesson: "8"
course_total: "8"
course_landing: "Generalized-Linear-Models-Course.html"
course_next: ""
course_prev: "Too-Many-Zeros-and-the-Two-Ways-to-Model-Them"
---

=== step === cover
## Checking a GLM with simulated residuals

Today let's understand why a Poisson GLM's residual plot can look alarming even when the model is exactly right, and how to build a residual that means the same thing no matter which family fit the data.

A city runs 30 bike-share stations. Each station gets its own typical number of daily rentals, anywhere from under 100 to over 300, and each one filed some number of maintenance tickets over the last 30 days.

Here are 8 of the 30 stations.

::widget styled-table {"cols": ["daily rentals", "tickets filed"], "rows": [[74, 0], [95, 0], [188, 1], [214, 3], [271, 3], [280, 4], [306, 8], [343, 17]], "formats": {}, "title": "8 of the 30 bike-share stations", "note": "All 30 stations are fit with one Poisson GLM of tickets filed in the last 30 days, modeled on how many rentals the station sees in a typical day."}

Across all 30 stations, tickets filed range from 0 to 17, average 2.97, and 6 stations report none at all. A straight line has no business fitting counts shaped like that, so a Poisson GLM fits these counts instead.

But once that model is fit, can you read its residual plot the same way you would read one from an ordinary linear regression? The answer turns out to be no, and knowing exactly why changes what you should actually watch for in that plot.

=== step === widget
## Why an ordinary residual plot looks alarming for a GLM

In linear regression, a healthy residual plot is a flat, even band around zero. A funnel, where the spread grows as the fitted value rises, means trouble: the model's errors are not constant, and its standard errors are wrong.

Flip through the three shapes below to recall that habit.

::widget residual-plot {"start": "healthy"}

Now fit the Poisson GLM to the 30 stations and look at its own residuals the same way.

```r
# Build the 30 stations and fit a Poisson GLM of tickets on rentals
set.seed(814)
rentals <- round(runif(30, 60, 350))
mu <- exp(-2.3 + 0.014 * rentals)
tickets <- rpois(30, mu)

fit <- glm(tickets ~ rentals, family = poisson)
round(coef(fit), 5)
#> (Intercept)     rentals 
#>    -3.00217     0.01631 
round(unname(exp(coef(fit)["rentals"] * 50)), 2)
#> [1] 2.26
```

The rentals coefficient, exponentiated and scaled to 50 rentals, says each extra 50 daily rentals multiplies the expected ticket rate by 2.26. That is the ordinary way to read a Poisson GLM's coefficient: as a rate ratio.

Now look at its response residuals, observed tickets minus fitted tickets, split by how low or high the fitted value is.

```r
# Compare the spread of residuals at the 15 lowest- and 15 highest-fitted stations
response_resid <- residuals(fit, type = "response")
ord <- order(fitted(fit))
round(c(sd_low15 = sd(response_resid[ord][1:15]), sd_high15 = sd(response_resid[ord][16:30])), 2)
#> sd_low15 sd_high15 
#>     0.50      1.82 

plot(fitted(fit), response_resid, xlab = "fitted value", ylab = "response residual",
     pch = 16, main = "")
abline(h = 0, lty = 2)
```

The spread among the 15 lowest-fitted stations is 0.50. Among the 15 highest-fitted stations it is 1.82, more than three times as wide. That is a real funnel, and the model that produced it is exactly correct.

[KEY INSIGHT]
A Poisson distribution's variance always equals its mean. A station with a high fitted rate is expected to have a wider spread of possible counts than a station with a low fitted rate, by construction, not by mistake. The funnel you just drew is that fact showing up on a plot, not a sign the model needs fixing.

=== step === quiz
## Quick check: is a funnel always trouble?

You fit the Poisson GLM above and look at its residuals against the fitted values. The spread clearly grows as the fitted value rises, the same funnel shape that would mean trouble for an ordinary linear regression. What does this pattern mean here?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- The model is wrong. A funnel always means the variance needs fixing before the fit can be trusted. ::no
- Nothing by itself. A Poisson distribution's variance equals its mean, so the spread of the counts has to grow as the fitted value grows, even when the model is exactly right. ::ok Exactly. The funnel you are looking at is not a symptom, it is Var(Y) = mean doing exactly what a Poisson distribution always does. A GLM residual plot needs a different reading habit than an OLS one.
- The GLM has a coding error, since a correctly specified model should give residuals with constant spread. ::no
- The sample of 30 stations is too small to say anything about the fit. ::no A Poisson GLM is not read the way an OLS fit is. Variance equal to the mean means the spread of the residuals has to widen as the fitted value rises, on a model that is exactly right. The shape to actually watch for is not a widening band, it is a pattern the variance-equals-mean rule cannot explain on its own.

=== step === concept
## A residual that means the same thing in every family

An ordinary residual, observed minus fitted, means something different depending on the family. A residual of 2 is enormous for a Poisson GLM fitting counts of 1 or 2, but it is nothing on one fitting counts near 500. The simulated quantile residual fixes this by asking a question that means the same thing no matter the family: where does the observed value sit, as a percentile, inside the distribution the model actually predicted for it?

For a continuous outcome this percentile is one clean number. If a model predicts a Normal distribution for an observation and the observed value lands exactly at the predicted mean, its percentile is 0.5, right in the middle. Across every observation, a correctly specified model should produce percentiles spread evenly between 0 and 1, which is exactly what a Uniform(0,1) distribution looks like.

A count cannot give you that one clean percentile, because a Poisson distribution only puts probability on whole numbers. Suppose a model predicts a Poisson with mean 2 for an observation, and the real count is 2. \(P(Y < 2)\) works out to 0.406, and \(P(Y \le 2)\) works out to 0.677. Those two numbers bracket everything the count 2 could have been strictly below, and everything it could have been at or below. No single percentile sits at one exact point between 0.406 and 0.677 for a Poisson(2), so a plain percentile does not exist here the way it does for a continuous outcome.

The fix is to draw a uniform random number between those two cumulative probabilities, here, anywhere between 0.406 and 0.677. This randomized draw is the simulated quantile residual. It spreads the tie evenly across the gap a discrete count leaves behind instead of always rounding it the same way, which is exactly what keeps a correctly specified model's residuals looking uniform.

=== step === concept
## Simulating one station's residual by hand

Go back to the 30 stations and pick the one with 271 daily rentals, which filed 3 tickets over the last 30 days.

```r
# Pick the station with 271 daily rentals and read its own fitted rate
station <- 9
y_obs <- tickets[station]
mu_station <- fitted(fit)[station]
round(c(rentals = rentals[station], tickets = y_obs, fitted_mu = unname(mu_station)), 3)
#>   rentals   tickets fitted_mu 
#>   271.000     3.000     4.127 
```

The model's fitted rate for this station is 4.127 tickets. The station actually filed 3. To find out whether 3 is ordinary or surprising under a Poisson(4.127), draw 1000 counts from that distribution and see where 3 sits among them.

```r
# Draw 1000 Poisson(4.127) counts and read off the two cumulative probabilities
set.seed(99)
sim_draws <- rpois(1000, mu_station)
p_lower <- mean(sim_draws < y_obs)
p_upper <- mean(sim_draws <= y_obs)
round(c(p_lower = p_lower, p_upper = p_upper), 3)
#> p_lower p_upper 
#>   0.242   0.426 
```

Of the 1000 simulated counts, 24.2% landed strictly below 3 (\(p_{lower}\)), and 42.6% landed at or below 3 (\(p_{upper}\)). The observed count of 3 is bracketed between those two numbers, exactly the discrete tie a count variable creates and a continuous one never does. Draw the simulated quantile residual by picking a uniform value between them.

```r
# Draw the simulated quantile residual uniformly between the two probabilities
set.seed(2787)
u <- runif(1, p_lower, p_upper)
round(u, 3)
#> [1] 0.279
```

That single number, 0.279, is the station's simulated quantile residual. It sits closer to 0 than to 1, meaning this station's observed 3 tickets sat on the lower side of what the model expected for it, but nowhere near an extreme. Repeat this exact recipe once for every station, and you have a complete set of residuals that behaves the same way regardless of which family generated the counts.

=== step === concept
## Every station, and a correct model's residuals come out flat

Scale the station-by-station recipe up to all 30 stations at once. The code below does, for every station, exactly what you just did by hand for one: draw 1000 counts from its own fitted Poisson, find the two cumulative probabilities, and draw a uniform value between them.

```r
# Repeat the hand computation for every station: 1000 draws each, then a uniform draw
sim_quantile_resid <- function(y_obs_vec, mu_vec, nsim = 1000, seed_base) {
  out <- numeric(length(y_obs_vec))
  for (i in seq_along(y_obs_vec)) {
    set.seed(seed_base + i)
    draws <- rpois(nsim, mu_vec[i])
    p_lo <- mean(draws < y_obs_vec[i])
    p_hi <- mean(draws <= y_obs_vec[i])
    out[i] <- runif(1, p_lo, p_hi)
  }
  out
}

sqr <- sim_quantile_resid(tickets, fitted(fit), seed_base = 1000)
round(sqr, 3)
#>  [1] 0.727 0.180 0.704 0.688 0.770 0.530 0.846 0.591 0.283 0.429 0.641 0.635
#> [13] 0.065 0.518 0.748 0.869 0.674 0.664 0.107 0.393 0.357 0.087 0.888 0.310
#> [25] 0.882 0.547 0.162 0.516 0.008 0.326
```

Thirty numbers, scattered across the whole 0 to 1 range rather than clumped near the middle or piled at either end. A histogram and a formal test against Uniform(0,1) confirm it.

```r
# A histogram of the 30 simulated residuals, and a formal test against Uniform(0,1)
hist(sqr, breaks = 10, col = "grey85", border = "white",
     main = "", xlab = "simulated quantile residual")

ks.test(sqr, "punif")
#> 
#> 	Exact one-sample Kolmogorov-Smirnov test
#> 
#> data:  sqr
#> D = 0.1155, p-value = 0.7762
#> alternative hypothesis: two-sided
```

The Kolmogorov-Smirnov test compares the 30 simulated residuals against a Uniform(0,1) distribution and returns p = 0.776. There is no evidence here that the residuals depart from uniform, which is exactly what a correctly specified model is supposed to give you. This is your baseline: a healthy set of simulated residuals is a flat histogram and a large KS p-value. Everything from here on is what happens to that flat picture once something is actually wrong with the model.

=== step === concept
## Fault 1: overdispersion piles residuals into the tails

Suppose the real ticket counts are more erratic than a Poisson distribution allows, some stations running unusually quiet months, others unusually busy ones, beyond what the rentals-driven rate alone would produce. Regenerate the 30 stations' ticket counts from a negative binomial distribution, which has the same fitted means as before but extra variance, then fit a Poisson GLM to the result anyway, the same mistake an analyst who never checked would make.

```r
# Regenerate tickets with extra variance, and wrongly fit a Poisson GLM to them
set.seed(271)
tickets_od <- rnbinom(30, mu = mu, size = 0.7)
fit_od <- glm(tickets_od ~ rentals, family = poisson)

dispersion_ratio <- sum(residuals(fit_od, type = "pearson")^2) / fit_od$df.residual
round(dispersion_ratio, 2)
#> [1] 6.39
```

The dispersion ratio, the sum of squared Pearson residuals divided by residual degrees of freedom, should sit near 1 for a well-specified Poisson model. Here it comes out at 6.39, more than six times too much variance for a Poisson to explain. Now check what that does to the simulated quantile residuals.

```r
# Simulated residuals for the overdispersed data, and how many land in the extreme tails
sqr_od <- sim_quantile_resid(tickets_od, fitted(fit_od), seed_base = 1)
sum(sqr_od < 0.05 | sqr_od > 0.95)
#> [1] 13

round(sqr_od, 3)
#>  [1] 0.080 0.000 0.940 0.163 0.159 0.996 0.005 0.081 0.402 0.962 0.086 0.252
#> [13] 0.974 1.000 0.012 0.353 0.281 0.025 0.343 0.054 0.023 0.059 0.366 1.000
#> [25] 0.003 0.163 0.664 0.973 0.491 0.036

hist(sqr_od, breaks = 10, col = "grey85", border = "white",
     main = "", xlab = "simulated quantile residual")
```

Under a correctly specified model, only about 10% of 30 stations, 3 of them, should land in the extreme 5% tails on either side. Here 13 do, more than four times the expected count. The model assumed too little variance for the data it was given, and the simulated residuals pile up exactly where that mistake would show: hard against 0 and hard against 1, instead of spread evenly across the middle.

=== step === concept
## Fault 2: a missing offset shows up as a trend, not a shape

A different kind of mistake. Suppose some stations were monitored for the full 30 days while others, maybe installed partway through the month, were only watched for a handful of days. Give each station a days_observed value, and regenerate its ticket count so the rate scales with how long it was actually watched.

```r
# Give each station a days-observed exposure, and scale its ticket rate to match
set.seed(332)
days_observed <- round(runif(30, 3, 30))
tickets_off <- rpois(30, mu * days_observed / 30)
range(days_observed)
#> [1]  6 30
```

Days observed ranges from 6 to 30 across the 30 stations. Now fit a Poisson GLM on rentals alone, the way an analyst who never thought to check exposure would, and simulate its residuals.

```r
# Fit without the offset, and correlate the simulated residuals against days observed
fit_nooffset <- glm(tickets_off ~ rentals, family = poisson)
sqr_nooffset <- sim_quantile_resid(tickets_off, fitted(fit_nooffset), seed_base = 257)
round(cor(sqr_nooffset, days_observed), 2)
#> [1] 0.19
```

The simulated residuals correlate 0.19 with days_observed, a variable the model never saw. Stations watched for fewer days are systematically landing on one side of the residual scale, and stations watched longer land on the other. That is not a shape like the tails you saw with overdispersion, it is a trend against the exact variable the model left out.

The fix is to tell the model how long each station was actually watched. Adding `offset(log(days_observed/30))` with its coefficient fixed at one turns the count model into a rate model.

```r
# Add the offset, and recheck the correlation against days observed
fit_offset <- glm(tickets_off ~ rentals + offset(log(days_observed / 30)), family = poisson)
sqr_offset <- sim_quantile_resid(tickets_off, fitted(fit_offset), seed_base = 257)
round(cor(sqr_offset, days_observed), 2)
#> [1] -0.05

par(mfrow = c(1, 2))
plot(days_observed, sqr_nooffset, xlab = "days observed", ylab = "simulated residual",
     pch = 16, main = "without offset")
plot(days_observed, sqr_offset, xlab = "days observed", ylab = "simulated residual",
     pch = 16, main = "with offset")
par(mfrow = c(1, 1))
```

Once the offset is in place, the correlation drops from 0.19 to -0.05, close enough to zero to call the trend gone. A missing offset leaves its mark as a relationship between the simulated residuals and the exposure variable the model never saw, not as a pile-up in the tails.

=== step === concept
## Fault 3: too many real zeros pile residuals at the floor

A third kind of mistake. Suppose 40% of the 30 stations are brand new and sit in a grace period where no tickets are filed at all, regardless of how many rentals they see, while the rest run as ordinary Poisson stations.

```r
# Put 40% of stations through a zero-ticket grace period, then regenerate tickets
set.seed(447)
grace_period <- rbinom(30, 1, 0.4)
tickets_zi <- ifelse(grace_period == 1, 0, rpois(30, mu))

sum(tickets_zi == 0)
#> [1] 13
sum(grace_period == 1 & tickets_zi == 0)
#> [1] 11
sum(grace_period == 0 & tickets_zi == 0)
#> [1] 2
```

Of 30 stations, 13 report zero tickets. 11 of those are structural, stations in the grace period that could never have filed a ticket no matter their rentals. The other 2 are ordinary stations that simply happened to draw zero from their own Poisson rate. A Poisson GLM has no way to tell these two kinds of zero apart. Fit one anyway, ignorant of the grace period, and look at its simulated residuals.

```r
# Fit a Poisson GLM ignorant of the grace period, and count residuals near the floor
fit_zi <- glm(tickets_zi ~ rentals, family = poisson)
sqr_zi <- sim_quantile_resid(tickets_zi, fitted(fit_zi), seed_base = 3)
sum(sqr_zi < 0.05)
#> [1] 4

round(sqr_zi, 3)
#>  [1] 0.709 0.002 0.327 0.182 0.106 0.861 0.924 0.482 0.421 0.039 0.091 0.253
#> [13] 0.600 0.978 0.070 0.545 0.010 0.734 1.000 0.013 0.852 0.867 0.359 0.963
#> [25] 0.411 0.396 0.908 0.431 0.770 0.225

hist(sqr_zi, breaks = 10, col = "grey85", border = "white",
     main = "", xlab = "simulated quantile residual")
```

4 of the 30 simulated residuals sit below 0.05, a pile-up hard against the floor of the 0 to 1 range. The structural zeros the model cannot explain each get the lowest possible percentile under their own fitted rate, because a real zero is far more extreme to a Poisson model than it should be once some stations are never going to report anything else.

=== step === widget
## Checking the whole dataset at once, not just one station

Every fault so far was read off a station-by-station residual. A posterior predictive check asks the same kind of question at the level of the whole dataset: pick a summary statistic, simulate it many times under the fitted model, and see where the real dataset's own value for that statistic falls among the replicates.

This widget runs that check on its own built-in example, counting how many zeros turn up out of 60 observations under a wrong model and a right one.

::widget ppc-overlay {}

Switch between the two fits. Under the wrong model, the observed zero count sits far out in the tail of the replicated counts. Under the right model, it sits comfortably in the crowd. That is the same question the structural zero-inflation example raised, now asked about the dataset as a whole rather than about any one station's residual.

Run that exact check on the 30 stations' zero-inflated data: how many zeros does the fitted Poisson GLM expect across the whole dataset, compared to the 13 actually observed?

```r
# Posterior predictive check: does the fitted Poisson reproduce 13 observed zeros?
observed_zeros <- sum(tickets_zi == 0)
set.seed(24)
replicated_zeros <- replicate(3000, sum(rpois(30, fitted(fit_zi)) == 0))
round(c(observed = observed_zeros, mean_simulated = mean(replicated_zeros)), 2)
#>        observed mean_simulated 
#>           13.00            7.63 
mean(replicated_zeros >= observed_zeros)
#> [1] 0.012
```

Across 3000 replicated datasets simulated from the fitted model, the average number of zeros is 7.63. The real dataset has 13, and only 1.2% of the replicates reached that many or more. The fitted Poisson GLM, taken as a whole, cannot reproduce how often these stations actually report zero tickets, which is the same miss the station-level residuals already showed you, confirmed from a second angle.

=== step === quiz
## Your turn: name the fault from its signature

A dataset's simulated quantile residuals are not pushed into the extreme tails, and they do not pile up near zero. But plotted against a variable that was left out of the model, they show a clear upward trend. Which fault produced this pattern?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Overdispersion. ::no
- A missing offset. ::ok Right. Overdispersion piles residuals into the tails and zero-inflation piles them at the floor. Neither leaves a trend against an outside variable. A trend against something the model never saw, with no pile-up at either end, is the missing offset's signature, exactly what the simulated residuals showed against days observed.
- Structural zero-inflation. ::no Each fault leaves its own mark. Overdispersion pushes residuals into the extreme tails because the model assumed too little spread. Structural zero-inflation piles them near zero because the model cannot explain every real zero. A trend against a left-out variable, with no pile-up at either end, is what a missing offset looks like, because the model is scaling its rate wrong for every station in the same direction as that variable.

=== step === tryit
## Your turn: compute a dataset's simulated residuals

Here is a fresh set of 10 stations, built the same correct way as the very first 30, a new seed and no injected fault.

```r
# A fresh 10-station sample, built the same correct way, no injected fault
set.seed(900)
rentals_try <- round(runif(10, 60, 350))
mu_try <- exp(-2.3 + 0.014 * rentals_try)
tickets_try <- rpois(10, mu_try)
fit_try <- glm(tickets_try ~ rentals_try, family = poisson)
round(coef(fit_try), 4)
#> (Intercept) rentals_try 
#>     -2.6014      0.0133 
```

Complete the loop below so it builds each station's simulated quantile residual, one draw of p_lo already written for you.

```r
# Complete the loop: build each station's simulated quantile residual
sqr_try <- numeric(10)
for (i in 1:10) {
  set.seed(6000 + i)
  draws <- rpois(1000, fitted(fit_try)[i])
  p_lo <- mean(draws < tickets_try[i])
  p_hi <- ______________________________   # share of draws AT OR BELOW tickets_try[i]
  sqr_try[i] <- runif(1, p_lo, p_hi)
}
round(sqr_try, 3)
ks.test(sqr_try, "punif")
# Two lines to fill in one blank. Press Check when you have it.
```
::check {"regex": "mean[(]draws\\s*<=\\s*tickets_try\\[i\\][)]", "gate": true, "difficulty": "intermediate", "ok": "Yes. p_hi is the share of the 1000 simulated draws at or below the station observed ticket count, mean(draws <= tickets_try[i]). The two probabilities box in where the observed count falls, and the uniform draw between them is the simulated quantile residual.", "no": "p_hi is the same idea as p_lo, with the boundary included this time: the share of draws at or below the observed count. Write it as mean(draws <= tickets_try[i])."}
::solution
```r
# Fill in p_hi, then run the completed loop over all 10 stations
sqr_try <- numeric(10)
for (i in 1:10) {
  set.seed(6000 + i)
  draws <- rpois(1000, fitted(fit_try)[i])
  p_lo <- mean(draws < tickets_try[i])
  p_hi <- mean(draws <= tickets_try[i])
  sqr_try[i] <- runif(1, p_lo, p_hi)
}
round(sqr_try, 3)
#>  [1] 0.038 0.928 0.283 0.682 0.419 0.946 0.643 0.732 0.137 0.790
ks.test(sqr_try, "punif")
#> 
#> 	Exact one-sample Kolmogorov-Smirnov test
#> 
#> data:  sqr_try
#> D = 0.24314, p-value = 0.5191
#> alternative hypothesis: two-sided
```

The KS test against Uniform(0,1) comes back with p = 0.519, nowhere near small enough to flag a problem. Ten stations is a small sample, so one draw can look a little rough, but there is no overdispersion tail-piling, no trend against a left-out variable, and no floor pile-up here, because none of those faults were ever injected into this sample.

=== step === concept
## References

::prose-only a list of citations carries no visualizable concept

- [Randomized Quantile Residuals](https://doi.org/10.1080/10618600.1996.10474708) - Dunn, P.K. and Smyth, G.K. (1996), Journal of Computational and Graphical Statistics, 5(3), 236-244. The paper that defined the residual built by hand in this lesson.
- [DHARMa: Residual Diagnostics for Hierarchical (Multi-Level/Mixed) Regression Models](https://cran.r-project.org/package=DHARMa) - Hartig, F., CRAN. The production shortcut named in the closing step.
- McCullagh, P. and Nelder, J.A. (1989). Generalized Linear Models, 2nd edition. Chapman and Hall. The source of the variance-equals-mean fact behind the funnel you drew near the start of this lesson.
- [Bayesian Data Analysis, 3rd edition](https://sites.stat.columbia.edu/gelman/book/) - Gelman, A., Carlin, J.B., Stern, H.S., Dunson, D.B., Vehtari, A., and Rubin, D.B. (2013), Chapter 6. The posterior predictive check behind the dataset-level zero count test.
- [Extending the Linear Model with R, 2nd edition](https://www.routledge.com/Extending-the-Linear-Model-with-R-Generalized-Linear-Mixed-Effects-and-Nonparametric-Regression-Models-Second-Edition/Faraway/p/book/9781498720960) - Faraway, J.J. (2016), CRC Press. A practical treatment of GLM diagnostics and the three faults covered in this lesson.

=== step === complete
## Checking a GLM with simulated residuals

A Poisson GLM's residual plot fans out even when the model is exactly right, because Poisson variance equals the mean by construction. The simulated quantile residual fixes the reading problem that creates: simulate many counts from the fitted model for each observation, find where the observed count sits between the two cumulative probabilities it straddles, and draw uniformly between them. A correctly specified model gives you residuals that land close to Uniform(0,1), checked here with a Kolmogorov-Smirnov test.

Each fault you injected left its own signature on that set of residuals. Overdispersion piled 13 of 30 into the extreme tails, against an expected 3. A missing offset showed up as a correlation with the exposure variable the model never saw, 0.19 before the fix and -0.05 after. Structural zero-inflation piled residuals at the floor, and the same miss reappeared at the dataset level, 13 zeros observed against 7.63 expected under the fitted model.

In practice nobody writes this loop by hand every time. The DHARMa package wraps the exact steps you just built: `simulateResiduals()` runs the per-observation simulation, `plotQQunif()` draws the uniform check, and `testDispersion()` and `testZeroInflation()` run the tail and floor checks as formal tests.

```r-static
# Run this locally: DHARMa wraps the hand-built steps above into four calls
library(DHARMa)

sim <- simulateResiduals(fit, n = 1000)   # the same 1000-draws-per-observation idea, for every station at once
plotQQunif(sim)                            # the uniform check from the all-stations step
testDispersion(sim)                        # the tail-count check from the overdispersion fault
testZeroInflation(sim)                     # the floor-pileup check from the zero-inflation fault
```

Next time a GLM's residual plot looks like it is fanning out or curving, check whether that shape is something the family's own variance rule already predicts before you call it a problem. If it genuinely is a problem, a simulated quantile residual will show you which one.
