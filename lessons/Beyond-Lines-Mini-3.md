---
title: "Beyond Straight Lines Lesson 3: Negative binomial regression: when Poisson doesn't fit your counts"
slug: "Beyond-Lines-Mini-3"
description: "Real counts are usually more spread out than a Poisson allows. Diagnose that overdispersion in R, refit with a negative binomial, and get honest p-values."
keywords: "negative binomial regression, overdispersion in count data, glm.nb in R, Poisson vs negative binomial, dispersion ratio, theta parameter, MASS glm.nb, count regression in R"
mathjax: true
webr: true
date: "2026-08-27"
post_type: "LESSON"
course_id: "beyond-straight-lines"
course_title: "Beyond Straight Lines"
course_lesson: "3"
course_total: "9"
course_landing: "/dashboard.html"
course_prev: "Beyond-Lines-Mini-2"
course_next: ""
curriculum_id: "0.0.47"
lesson_access: "windowed"
catalog_blurb: "Diagnose counts too spread out for Poisson, then fit them properly."
---

=== step === cover
::eyebrow Beyond Straight Lines
## Negative binomial regression: when Poisson doesn't fit your counts

Poisson regression makes one strict promise about your counts, and it is easy to miss because nothing in the output ever mentions it. The promise is that the variance of the counts has to equal their mean.

Real data rarely keeps that promise.

Take doctor visits per patient over a year. A handful of people are in the clinic constantly and most of them barely go at all, so the counts pile up at zero and then run a long way out to the right. The spread ends up far above the average. Fit a Poisson model to counts like that and every standard error gets computed as if the counts scattered narrowly, so every p-value comes out smaller than it deserves to be. That is false confidence, and it has a name.

It is called overdispersion, and with real counts it is closer to the rule than the exception.

Negative binomial regression is the fix. It keeps everything you like about Poisson, the log link and the coefficients you read as plain multipliers, and it adds one parameter that absorbs the extra spread.

Here is the shape of the problem before we build any of it. The bars below are a set of real-looking counts and the line is a model trying to describe them. Start on Poisson, and look at the tall bar at zero and at the tail on the right.

::widget count-dist {}

Now switch to Neg. Binomial and watch the line stretch far enough to cover both ends at once.

Today we are going to measure that stretch in R with one number, refit, and watch a result that looked significant fall apart.

=== step === concept
## Twelve hundred patients and the visits they made

We need counts we can argue about, so let's build a year of them where the truth is already known.

One health plan follows 1,200 patients for a calendar year and records one number for each person, which is how many times they saw a doctor. Three things about each patient go into their visit rate. Their age and whether they carry a chronic condition genuinely drive it. The third one, whether they were on a reminder email list, does nothing at all, and we know it does nothing because we are the ones planting it with an effect of exactly zero.

Watch for that in the code. The line that builds the rate uses `age` and `chronic`, and `reminders` is nowhere in it.

```r
# Build one year of doctor visits for 1,200 patients
set.seed(44)
n_patients <- 1200

age       <- round(rnorm(n_patients, mean = 52, sd = 14))
age       <- pmin(pmax(age, 18), 90)
chronic   <- rbinom(n_patients, size = 1, prob = 0.35)
reminders <- rbinom(n_patients, size = 1, prob = 0.5)

true_rate <- exp(0.55 + 0.012 * (age - 52) + 0.85 * chronic)
n_visits  <- rnbinom(n_patients, mu = true_rate, size = 1.5)

visits <- data.frame(age, chronic, reminders, n_visits)
head(visits)
table(visits$n_visits)
#>   age chronic reminders n_visits
#> 1  61       0         1        1
#> 2  52       0         1        1
#> 3  26       0         1        0
#> 4  50       0         0        0
#> 5  35       0         0        0
#> 6  33       1         0       11
#>
#>   0   1   2   3   4   5   6   7   8   9  10  11  12  13  14  15  16  17  19  21
#> 320 253 188 114 108  63  39  23  23  17  10  17   7   1   3   3   4   2   2   1
#>  24  28
#>   1   1
```

Read the second output as a tally of how many patients made each number of visits. 320 of the 1,200 did not see a doctor once all year, 253 went exactly once, and one person went 28 times.

That is what real visit counts look like. There is a big pile at zero, then a fast drop, and then a thin tail that runs a very long way out.

`rnbinom()` is the piece of that block worth pausing on. It is the thing we are here to learn, and all it is doing right now is giving these counts the extra spread that real ones have.

=== step === concept
## The promise Poisson makes: variance equals the mean

A Poisson model has no spread parameter. That is not an oversight, it is the whole design. One number, the mean, sets both where the counts sit and how far they scatter around it. Tell a Poisson the average is 2.61 visits and it has already committed to a variance of 2.61 as well.

So the first thing worth doing to any count outcome is putting those two numbers next to each other. The last two lines draw 1,200 counts from a genuine Poisson at our own average, so you can see what keeping the promise looks like.

```r
# Compare the spread of the real counts against the spread a Poisson allows
round(c(mean = mean(visits$n_visits), variance = var(visits$n_visits)), 2)

set.seed(7)
poisson_draw <- rpois(1200, lambda = mean(visits$n_visits))
round(c(mean = mean(poisson_draw), variance = var(poisson_draw)), 2)
#>     mean variance
#>     2.61    10.15
#>     mean variance
#>     2.62     2.60
```

The Poisson draw does exactly what it said it would. The mean is 2.62 and the variance is 2.60, which is the same number twice apart from the wobble you get from 1,200 draws.

Our patients come back at 2.61 and 10.15.

That is almost four times wider than a Poisson allows. And nothing in `glm()` is going to stop us fitting one anyway.

[NOTE]
Nothing is wrong with the counts. They are not dirty and they do not need transforming. The mismatch is between the data and one particular model's assumption about it.

=== step === quiz
## Quick check: what does a Poisson model assume about spread?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- That the counts are whole numbers and never go below zero. ::no
- That the variance of the counts equals their mean, so the average fixes the spread as well. ::ok Exactly. One number does both jobs, which is why a Poisson has nothing left to say when the spread turns out to be 10.15 against a mean of 2.61.
- That the counts are roughly symmetric around their average. ::no
- That the average count is small, somewhere close to zero. ::no The Poisson assumption is about spread, and nothing else. Counts being whole numbers, or lopsided, or small, is all perfectly fine and none of it is the assumption. What Poisson insists on is that the variance equals the mean, and ours were 10.15 against 2.61.

=== step === concept
## What the Poisson fit says about the reminder list

Now fit the model anybody would fit here. There are three predictors and `family = poisson`, and R runs it without a word of complaint.

Poisson regression works on the log scale, so the coefficients come back as log rate ratios. Exponentiate one and it turns into a multiplier on the expected count, which is the form worth reporting.

```r
# Fit the Poisson model and read each effect as a rate multiplier
pois_fit <- glm(n_visits ~ age + chronic + reminders,
                data = visits, family = poisson)

round(coef(summary(pois_fit)), 4)
round(exp(cbind(multiplier = coef(pois_fit), confint.default(pois_fit))), 3)
#>             Estimate Std. Error z value Pr(>|z|)
#> (Intercept)  -0.1712     0.0757 -2.2601   0.0238
#> age           0.0127     0.0013  9.9277   0.0000
#> chronic       0.8909     0.0361 24.6741   0.0000
#> reminders     0.1054     0.0358  2.9466   0.0032
#>             multiplier 2.5 % 97.5 %
#> (Intercept)      0.843 0.726  0.978
#> age              1.013 1.010  1.015
#> chronic          2.437 2.271  2.616
#> reminders        1.111 1.036  1.192
```

The `age` and `chronic` rows print a p-value of 0.0000, which only means the real value is smaller than the fourth decimal place could show.

Go to the `reminders` row. The multiplier is 1.111, so patients on the reminder list made 11% more visits. The p-value is 0.0032. The interval runs from 1.036 to 1.192 and sits entirely above 1, so it never comes near no effect at all.

Every part of that output says the reminder emails worked.

We planted that effect at exactly zero.

=== step === concept
## The dispersion ratio, worked out from the residuals

Eyeballing 10.15 against 2.61 was enough to make us suspicious. There is one number that grades the Poisson promise directly, and it is worth working out by hand, because you will compute it on every count model you ever fit.

Start with a single patient. The model gives them a fitted mean of, say, 2.4 visits, and they actually made 5. The gap is 2.6 visits. But a gap is only big or small next to how much scatter the model expected there, and Poisson says the scatter around a mean of 2.4 has a standard deviation of the square root of 2.4. So divide the gap by that square root. What comes out is a **Pearson residual**: the gap, measured in units of the spread the model claimed for it.

Now do that for all 1,200 patients and square each one so the plus and minus signs stop cancelling. If the model's claim about spread is right, each squared residual averages about 1, so the whole sum should land near the number of patients, less the four numbers the model had to estimate from the data. That leftover count is the residual degrees of freedom, 1,196 here.

Divide the sum by the degrees of freedom and an honest Poisson fit gives you a number near 1.

```r
# Grade the Poisson promise with the dispersion ratio
pearson_resid <- residuals(pois_fit, type = "pearson")
disp_ratio    <- sum(pearson_resid^2) / df.residual(pois_fit)

df.residual(pois_fit)
round(disp_ratio, 3)
round(deviance(pois_fit) / df.residual(pois_fit), 3)
#> [1] 1196
#> [1] 2.797
#> [1] 2.672
```

It comes back at 2.797. The residuals are nearly three times as variable as the model expected them to be.

The third line is the same check built from the residual deviance instead of the Pearson residuals, and it comes back at 2.672. The two are computed differently and rarely agree to the decimal, so what matters is that both are sitting a long way above 1.

Here is how to read the number in practice:

- Near 1: the Poisson promise holds, carry on.
- Past 1.5: a red flag, your standard errors are already too small.
- Past 2: do not report the Poisson fit.

[KEY INSIGHT]
The dispersion ratio is two lines of code and it is the most useful thing you can do to a Poisson fit. Take the squared Pearson residuals and divide them by the residual degrees of freedom. Every count model you publish should have that number computed behind it.

=== step === concept
## How often a Poisson this stretched finds an effect that is not there

"The standard errors are too small" is easy to say. Let's watch it do damage.

We know the reminder list does nothing, so let's build the same year again, 300 times over, with fresh patients each time and the reminder flag still wired to nothing at all. Fit a Poisson to each of those 300 years and keep the single p-value we care about, the one for the reminder list. All 300 of them come out of a world where the honest answer is no effect.

If the p-values were being computed correctly, about 5 in every 100 would slip under 0.05 anyway. That is what the 0.05 threshold is for, and about 15 false alarms out of 300 is the price we agreed to pay.

Press Run. It takes a few seconds, because it is fitting 300 models.

```r
# Refit 300 fresh years in which the reminder list truly does nothing
one_year_p <- function() {
  a   <- pmin(pmax(round(rnorm(1200, mean = 52, sd = 14)), 18), 90)
  ch  <- rbinom(1200, size = 1, prob = 0.35)
  rem <- rbinom(1200, size = 1, prob = 0.5)
  y   <- rnbinom(1200, mu = exp(0.55 + 0.012 * (a - 52) + 0.85 * ch), size = 1.5)
  fit <- glm(y ~ a + ch + rem, family = poisson)
  coef(summary(fit))["rem", "Pr(>|z|)"]
}

set.seed(21)
many_p <- replicate(300, one_year_p())

hist(many_p, breaks = 20, col = "grey85", border = "white",
     main = "300 years in which the reminder list did nothing",
     xlab = "p-value for the reminder list")
abline(v = 0.05, col = "red", lwd = 3)

sum(many_p < 0.05)
#> [1] 68
```

68 out of 300 came in under 0.05. That is roughly one year in four, where the deal was one in twenty.

The plot shows where they all landed, with the red line drawn at 0.05. A correctly computed set of p-values under no effect spreads out evenly across the whole range from 0 to 1. This pile leans hard to the left and jams up against zero, because every standard error in every one of those 300 fits was too small, so every z statistic was too big, and every p-value came out smaller than the truth deserved.

Notice which way the damage runs. Overdispersion never makes you too cautious. It only ever makes you too confident, and that is why the reminder list looked like a finding.

=== step === quiz
## Quick check: what does overdispersion do to a p-value?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- It inflates the p-value, so real effects get missed. ::no
- It makes p-values unreliable in both directions, sometimes too big and sometimes too small. ::no
- It shrinks the p-value, because the standard error underneath it was computed too small. ::ok Right, and the direction is the whole problem. It never errs on the side of caution, only on the side of false confidence.
- It leaves p-values alone and biases the coefficient estimates instead. ::no Overdispersion has one effect and it points one way. The coefficients come out roughly right. What breaks is the standard error sitting underneath them: the model computes it as if the counts scattered as narrowly as their own mean, so it comes out too small, the z statistic comes out too big, and the p-value comes out too small. That is why 68 of those 300 nothing-happened years cleared 0.05 instead of about 15.

=== step === concept
## Where the extra spread comes from

None of this is mysterious. The extra spread comes from the columns you did not collect.

Two patients can be the same age, both without a chronic condition, both off the reminder list, and the model then hands them an identical fitted rate. Out in the world, one of them books an appointment for every cough and the other has not called a doctor since 2019. Diet, income, anxiety, distance to the clinic, how much they trust doctors: none of that is in our three columns, and all of it moves the rate.

So the honest picture is not one rate for everybody at a given age. It is a rate per patient, scattered around that average. Draw a rate for each of 1,200 people, then draw a genuine Poisson count on top of each person's own rate, and see what the pile looks like. Watch the `shape` argument in particular, because it is the dial that matters. It sets how tightly those 1,200 rates cluster around their average, and turning it down spreads them further apart.

```r
# Draw a rate for each patient, then a Poisson count on top of that rate
set.seed(5)
patient_rate <- rgamma(1200, shape = 1.5, rate = 1.5 / 2.61)
mixed_counts <- rpois(1200, lambda = patient_rate)

round(c(mean = mean(mixed_counts), variance = var(mixed_counts)), 2)
#>     mean variance
#>     2.66     7.27
```

The mean lands at 2.66, about where we aimed it. The variance comes out at 7.27, well over twice the mean, and every single count in that block came from an honest Poisson.

One Poisson can never do that. A mixture of Poissons at different rates does it without trying.

That is the whole mechanism, and it tells us what the fix has to supply: some number saying how tightly those per-patient rates cluster around their average. Cluster them tightly and you are almost back to a plain Poisson. Spread them out and the counts get much wider than their mean.

=== step === concept
## How fast does the variance grow with the mean?

There is one more thing to pin down before we fix anything. Does the extra spread sit at a constant multiple above the mean, or does it grow as the mean grows?

Sort the 1,200 patients by the mean the Poisson fit gave them, cut them into five equal groups, and inside each group compute both the average number of visits and the variance of those visits.

```r
# Compare the mean and the variance inside five bins of fitted mean
visits$fitted_mean <- fitted(pois_fit)
visits$bin <- cut(visits$fitted_mean,
                  breaks = quantile(visits$fitted_mean, probs = seq(0, 1, 0.2)),
                  include.lowest = TRUE)

binned <- aggregate(n_visits ~ bin, data = visits,
                    FUN = function(v) c(bin_mean = mean(v), bin_var = var(v)))
binned <- do.call(data.frame, binned)
names(binned) <- c("fitted_bin", "bin_mean", "bin_variance")
print(binned, digits = 3)
#>    fitted_bin bin_mean bin_variance
#> 1 [1.06,1.57]     1.28         2.89
#> 2  (1.57,1.8]     1.90         5.10
#> 3  (1.8,2.17]     2.00         3.95
#> 4 (2.17,3.92]     3.10         9.27
#> 5 (3.92,6.88]     4.78        22.22
```

Read the last two columns against each other. In the lowest group the mean is 1.28 and the variance is 2.89, about 2.3 times bigger. In the highest group the mean is 4.78 and the variance is 22.22, closer to 4.6 times bigger.

If the variance were simply a fixed multiple of the mean, that multiple would hold roughly steady down the whole table. It does not. The gap widens as the mean rises, which is exactly what happens when each patient carries a rate of their own: the higher the average rate, the more room those rates have to differ.

Hold on to that shape. The fix we are about to fit has it built in.

=== step === concept
## The negative binomial variance function and theta

Now the fix itself.

The negative binomial keeps the whole Poisson setup. It keeps the same log link, the same coefficients, and the same reading of an exponentiated coefficient as a rate multiplier. It changes one thing. It stops forcing the variance to equal the mean, and buys itself a second variance term with one new parameter, called **theta**.

$$\mathrm{Var}(Y) = \mu + \frac{\mu^2}{\theta}$$

Read it left to right. The Greek letter mu is the fitted mean for one patient, the same mean a Poisson would have given them. The first term is the Poisson variance, untouched. The second term is the extra spread, and it is the mean squared, divided by theta.

Two things follow from that shape and both of them matter.

The extra term carries mu squared, so it grows faster than the mean does. That is the widening gap we just measured across the five bins, written down as a formula.

And theta sits underneath it. A small theta makes the second term big, which is heavy extra spread. A large theta squeezes it towards nothing, and when theta runs off to infinity the second term vanishes and the formula collapses back to variance equals mean. Poisson is not a rival model here. It is the negative binomial with theta turned all the way up.

Theta is also a number you have already met. It is the same 1.5 we handed to `shape` when we drew a rate for every patient, the dial for how tightly those rates cluster around their average. The negative binomial is not inventing a new quantity here. It is estimating that one from the data.

Put a few numbers through it to get the feel. Here is the variance the formula allows at five different means, using the theta of 1.5 we planted when we built the counts.

```r
# Variance the negative binomial allows at several means when theta is 1.5
theta      <- 1.5
mean_count <- c(1, 2, 3, 5, 10)

data.frame(mean_count,
           poisson_variance = mean_count,
           nb_variance      = round(mean_count + mean_count^2 / theta, 2))
#>   mean_count poisson_variance nb_variance
#> 1          1                1        1.67
#> 2          2                2        4.67
#> 3          3                3        9.00
#> 4          5                5       21.67
#> 5         10               10       76.67
```

At a mean of 1 the negative binomial allows a variance of 1.67, barely more than Poisson. At a mean of 10 it allows 76.67 against Poisson's flat 10. The bigger the count, the more slack the extra term gives, which is exactly the behaviour our five bins asked for.

[NOTE]
MASS calls this parameter theta. Stata and SAS report its reciprocal and call it alpha, so alpha is 1 divided by theta, and a small theta is a large alpha. It is the same quantity either way, just flipped.

=== step === concept
## How to fit it with glm.nb()

It takes one library and one function.

`glm.nb()` lives in MASS, which ships with R, so there is nothing to install. The formula is identical to the Poisson call and so is the data. The log link is already the default. The only thing that goes away is `family = poisson`, because the family is now baked into the function name.

```r
# Fit the same model with one extra parameter for the spread
library(MASS)

nb_fit <- glm.nb(n_visits ~ age + chronic + reminders, data = visits)
summary(nb_fit)
#> Call:
#> glm.nb(formula = n_visits ~ age + chronic + reminders, data = visits,
#>     init.theta = 1.426450921, link = log)
#>
#> Coefficients:
#>              Estimate Std. Error z value Pr(>|z|)
#> (Intercept) -0.148149   0.127937  -1.158    0.247
#> age          0.012611   0.002234   5.644 1.66e-08 ***
#> chronic      0.886807   0.062476  14.194  < 2e-16 ***
#> reminders    0.069426   0.061776   1.124    0.261
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
#>
#> (Dispersion parameter for Negative Binomial(1.4265) family taken to be 1)
#>
#>     Null deviance: 1579.5  on 1199  degrees of freedom
#> Residual deviance: 1330.0  on 1196  degrees of freedom
#> AIC: 4900.4
#>
#> Number of Fisher Scoring iterations: 1
#>
#>               Theta:  1.426
#>           Std. Err.:  0.104
#>
#>  2 x log-likelihood:  -4890.429
```

Go to the bottom of that output first, because that is the only genuinely new line. It reads `Theta: 1.426`, with a standard error of 0.104. We built these counts with a theta of 1.5, and the model found its way back to it from the data alone.

The coefficient block above reads exactly like a Poisson summary. There is an estimate, a standard error, a z value and a p-value, one row per predictor, and nothing new to learn.

What changed is what those numbers now say.

=== step === concept
## The standard errors widen and the significance drains away

Put the two fits in one table and read across the rows.

```r
# Put the two fits side by side: estimate, standard error, p-value
compare <- data.frame(
  term      = rownames(coef(summary(pois_fit))),
  pois_est  = round(coef(summary(pois_fit))[, 1], 3),
  pois_se   = round(coef(summary(pois_fit))[, 2], 3),
  pois_p    = signif(coef(summary(pois_fit))[, 4], 2),
  nb_est    = round(coef(summary(nb_fit))[, 1], 3),
  nb_se     = round(coef(summary(nb_fit))[, 2], 3),
  nb_p      = signif(coef(summary(nb_fit))[, 4], 2),
  row.names = NULL
)
compare

round(coef(summary(nb_fit))[, 2] / coef(summary(pois_fit))[, 2], 2)
#>          term pois_est pois_se   pois_p nb_est nb_se    nb_p
#> 1 (Intercept)   -0.171   0.076  2.4e-02 -0.148 0.128 2.5e-01
#> 2         age    0.013   0.001  3.2e-23  0.013 0.002 1.7e-08
#> 3     chronic    0.891   0.036 2.0e-134  0.887 0.062 9.9e-46
#> 4   reminders    0.105   0.036  3.2e-03  0.069 0.062 2.6e-01
#> (Intercept)         age     chronic   reminders
#>        1.69        1.75        1.73        1.73
```

The p-value columns are in scientific notation, so read `3.2e-03` as 0.0032 and `2.6e-01` as 0.26.

Start with `age` and `chronic`, the two predictors that really do drive visits. Their estimates barely move. 0.013 stays 0.013, and 0.891 becomes 0.887. The negative binomial did not discover that they were wrong, and it never claimed they were.

Now read the two standard error columns. Every one of them grows, and the last line puts a number on it: about 1.7 times larger across the board. Those are the honest standard errors, the ones the Poisson fit should have been reporting all along.

Two rows come through that correction without any trouble. `age` moves from 3.2e-23 to 1.7e-08, which is still 0.000000017, and `chronic` stays just as far below any threshold you might pick. A real effect survives a wider error bar, because it was never leaning on the error bar in the first place.

Then there is `reminders`. Its estimate slides from 0.105 down to 0.069 and its standard error grows from 0.036 to 0.062. Put those two together and the p-value goes from 0.0032 to 0.26.

The result did not get weaker. It was never there. What changed is that the model finally has an honest measure of how noisy these counts are, and against that measure an estimate of 0.069 is nothing at all.

[KEY INSIGHT]
Switching from Poisson to negative binomial usually leaves the coefficients close to where they were and widens every standard error. That is the whole reason to switch, and it is also why a genuine effect walks through the switch untouched while a false one falls over.

=== step === tryit
## Your turn: check the dispersion of the new fit

The dispersion ratio graded the Poisson fit at 2.797 and told us to stop trusting it. Run that same check on `nb_fit` and see what the extra parameter bought.

```r
# Check the dispersion of the negative binomial fit
# The same two moves on the Poisson fit looked like this:
#   sum(residuals(pois_fit, type = "pearson")^2) / df.residual(pois_fit)
# Aim them at nb_fit instead, and round the answer to three places.
# One line. Press Check when you have it.
```
::check {"regex": "residuals[(]\\s*nb_fit[^)]*pearson", "gate": true, "difficulty": "beginner", "ok": "1.004, which is about as close to 1 as this check ever lands. Theta pulled the extra spread inside the model, so what is left over now scatters exactly as much as the model says it should.", "no": "Take the two moves you ran on the Poisson fit and aim them at nb_fit: square the Pearson residuals of nb_fit, add them up, and divide by df.residual(nb_fit)."}
::solution
```r
# Dispersion ratio for the negative binomial fit
round(sum(residuals(nb_fit, type = "pearson")^2) / df.residual(nb_fit), 3)
#> [1] 1.004
```

The Poisson fit was carrying spread it had no way to account for, so it dumped the excess into the residuals. Theta gives that spread somewhere to live inside the model, and the residuals come back to the size they were always supposed to be.

=== step === concept
## Reading a coefficient as a rate multiplier

Coefficients arrive on the log scale, which nobody thinks in. Exponentiate them and they become multipliers on the expected count, which everybody thinks in.

```r
# Read the negative binomial coefficients as rate multipliers
round(exp(cbind(multiplier = coef(nb_fit), confint.default(nb_fit))), 3)
#>             multiplier 2.5 % 97.5 %
#> (Intercept)      0.862 0.671  1.108
#> age              1.013 1.008  1.017
#> chronic          2.427 2.148  2.744
#> reminders        1.072 0.950  1.210
```

Take the `chronic` row. The 2.427 says a patient with a chronic condition is expected to make 2.43 times as many visits as an otherwise identical patient without one. Not 2.43 more visits, 2.43 times as many. A log link makes every predictor multiplicative.

`age` reads 1.013, so each extra year multiplies the expected count by 1.013, a little over 1% more visits per year of age. Across the thirty years from 40 to 70 that compounds to 1.013 to the power of 30, which is about 1.47 times as many visits.

The interval on `chronic` runs from 2.148 to 2.744, wider than the interval the Poisson fit gave. That width is what theta cost, and it is the price of an interval you can defend. A narrower one would have been more comfortable and less true.

And `reminders` now reads 1.072, with an interval from 0.950 to 1.210. It contains 1. A multiplier of exactly 1 means nothing changes, so an interval that contains 1 is an interval that cannot rule out nothing happening.

=== step === concept
## Proving the switch was needed: the likelihood ratio test and AIC

We can do better than saying the dispersion ratio was 2.797 so we switched. Because Poisson is the negative binomial with theta at infinity, the two models nest one inside the other, and nested models can be tested against each other directly.

That test is the likelihood ratio test, and it is three lines. Take the log-likelihood of each fit, double the difference between them, and compare the result to a chi-square distribution with 1 degree of freedom, which is the one extra parameter theta cost us.

```r
# Test the Poisson fit against the negative binomial fit, then compare AIC
lrt_stat <- 2 * (as.numeric(logLik(nb_fit)) - as.numeric(logLik(pois_fit)))

round(lrt_stat, 1)
pchisq(lrt_stat, df = 1, lower.tail = FALSE)
AIC(pois_fit, nb_fit)
#> [1] 833.9
#> [1] 2.269756e-183
#>          df      AIC
#> pois_fit  4 5732.355
#> nb_fit    5 4900.429
```

The statistic comes back at 833.9 on 1 degree of freedom, against a p-value so small that R has to write it as 2.27e-183. The negative binomial describes these counts enormously better, and this is the evidence you put in the write-up.

AIC says the same thing in a different currency. It reads 5732 for the Poisson fit against 4900 for the negative binomial, a gap of 832, where a gap of 10 is already called decisive.

[NOTE]
One technical caveat is worth carrying. Theta has to stay positive, so the Poisson case sits on the boundary of the parameter space rather than somewhere inside it, and the usual chi-square reference is conservative there. The stricter version halves the p-value. At a statistic of 833.9 that changes nothing, but on a borderline case it is worth remembering.

=== step === concept
## When the negative binomial is not the fix

Overdispersion is a symptom, not a diagnosis, and the negative binomial is not the only cure. Two other situations look similar from a distance.

The first is quasi-Poisson. It keeps the Poisson fit exactly as it is and multiplies every standard error by the square root of the dispersion ratio. That is one constant inflation applied to everything. It is the right tool when the variance sits at a fixed multiple of the mean all the way up the range. Ours did not do that. The gap between variance and mean widened as the mean rose, and a widening gap is the negative binomial's quadratic shape rather than a constant one.

The second is zero inflation. Some counts have two different kinds of zero in them. A patient who moved abroad in January cannot visit a doctor at all, while a patient who simply had a healthy year could have visited and did not. Those are two separate processes, and a zero-inflated model fits them separately.

The way to check is to ask each fitted model how many zeros it expects and hold that up against how many you actually have.

```r
# Compare the zeros we observed against the zeros each fit expects
c(observed        = sum(visits$n_visits == 0),
  poisson_expects = round(sum(dpois(0, fitted(pois_fit)))),
  nb_expects      = round(sum(dnbinom(0, mu = fitted(nb_fit), size = nb_fit$theta))))
#>        observed poisson_expects      nb_expects
#>             320             153             316
```

We observed 320 zeros. The Poisson fit expects 153, less than half of them, which is another face of the same overdispersion. The negative binomial expects 316, which is four zeros away from the truth out of 1,200 patients.

So there is no zero problem left here. The pile at zero and the long tail came from one single cause, patients differing in their underlying rate, and one parameter absorbed both at once.

A short field guide for the next set of counts you meet:

- Variance tracks the mean: a plain Poisson is fine.
- Variance runs above the mean by one constant multiple: quasi-Poisson.
- Variance runs above the mean and the gap widens as the mean grows: negative binomial.
- Zeros still badly under-predicted after the refit: zero-inflated or hurdle model.

=== step === quiz
## Quick check: which sentence reports the two fits correctly?

You have both fits in front of you and a results paragraph to write. Which of these four is the one you would sign your name to?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The reminder list raised visits by 11% (p = 0.0032). After correcting for overdispersion the p-value got worse, so the effect is weaker than it first appeared. ::no
- The counts were overdispersed (dispersion ratio 2.8), so we fitted a negative binomial model. The reminder list gave a rate ratio of 1.07 (95% CI 0.95 to 1.21, p = 0.26), which is consistent with no effect. A chronic condition gave 2.43 (95% CI 2.15 to 2.74). ::ok That is the one. It names the problem, names what was done about it, leads with the multipliers and their intervals, and lets the p-value come last.
- The negative binomial model found no significant effects, so these data are too noisy to draw any conclusion from. ::no
- We fitted both models and report the Poisson result, since a p-value of 0.0032 is stronger evidence than 0.26. ::no The write-up that works leads with the multiplier and its interval, names the dispersion problem and what was done about it, and stops there. It never says the p-value got worse, because 0.26 is not a worse version of 0.0032, it is the honest version. It never calls the data too noisy either, since age and the chronic flag came through the very same correction with their effects intact. And it never picks between two models by which p-value it prefers.

=== step === tryit
## Your turn: diagnose and refit a fresh set of counts

The block below builds 400 patients from the following year. The only thing recorded about each of them this time is a severity score from 1 to 6, and the outcome is the same, doctor visits over the year.

Run the whole diagnosis yourself. Fit the Poisson model, compute its dispersion ratio, refit with `glm.nb()`, and print the severity estimate and its standard error from each fit.

```r
# Build 400 patients from the following year, with a severity score
set.seed(202)
severity  <- pmin(pmax(round(rnorm(400, mean = 3, sd = 1.2)), 1), 6)
next_year <- data.frame(
  severity = severity,
  n_visits = rnbinom(400, mu = exp(0.2 + 0.35 * severity), size = 1.2)
)

# Your turn, three moves:
#   1. fit the Poisson model of n_visits on severity
#   2. compute its dispersion ratio
#   3. refit with glm.nb() and compare the severity row of each fit
# Press Check when you have them.
```
::check {"regex": "glm[.]nb[(].*next_year", "gate": true, "difficulty": "intermediate", "ok": "The dispersion ratio comes back at 4.123, worse than the year you just worked through. The severity estimate hardly moves, 0.372 to 0.383, while its standard error doubles from 0.021 to 0.043. As a multiplier that is 1.47 times as many visits for every extra point of severity, and this effect is big enough that it survives the honest error bar without blinking.", "no": "Three moves you have already run once each: glm(n_visits ~ severity, data = next_year, family = poisson), then the squared Pearson residuals over df.residual(), then glm.nb(n_visits ~ severity, data = next_year)."}
::solution
```r
# Diagnose the new counts, refit, and compare the severity row
ny_pois <- glm(n_visits ~ severity, data = next_year, family = poisson)
round(sum(residuals(ny_pois, type = "pearson")^2) / df.residual(ny_pois), 3)

ny_nb <- glm.nb(n_visits ~ severity, data = next_year)
round(coef(summary(ny_pois))["severity", 1:2], 3)
round(coef(summary(ny_nb))["severity", 1:2], 3)
round(exp(coef(ny_nb)["severity"]), 3)
#> [1] 4.123
#>   Estimate Std. Error
#>      0.372      0.021
#>   Estimate Std. Error
#>      0.383      0.043
#> severity
#>    1.466
```

This is the case the negative binomial was built for, and it is worth seeing next to the reminder list. Both fits agree that severity matters. All the refit did was double the error bar around it, and the effect was strong enough that doubling it changed nothing about the conclusion.

=== step === quiz
## Quick check: which model does each situation need?

Three sets of counts land on your desk.

**A.** Support tickets per customer, with a mean of 3.1, a variance of 3.2 and a dispersion ratio of 1.05.

**B.** Insurance claims per policy, with a dispersion ratio of 3.4, and the gap between variance and mean gets wider as the fitted mean rises.

**C.** Cigarettes smoked per day in a health survey. After a negative binomial fit the model still expects 90 zeros where the data holds 310, because most people in the survey have never smoked at all.

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- A negative binomial, B negative binomial, C negative binomial. ::no
- A Poisson, B quasi-Poisson, C negative binomial. ::no
- A Poisson, B negative binomial, C zero-inflated. ::ok All three read correctly. A keeps the promise, B breaks it in the widening way, and C has a source of zeros that no rate can account for.
- A quasi-Poisson, B zero-inflated, C Poisson. ::no A keeps the Poisson promise, with a variance of 3.2 against a mean of 3.1 and a ratio of 1.05, so there is nothing to fix there. B is overdispersed and its gap widens with the mean, which is the negative binomial's own shape rather than the constant multiple quasi-Poisson assumes. C is the one case a negative binomial cannot reach: those extra zeros come from people who were never going to smoke at all, a separate process from the counting, and splitting the two apart is exactly what a zero-inflated model does.

=== step === concept
## References

- [Negative Binomial Regression, 2nd edition](https://doi.org/10.1017/CBO9780511973420) - Hilbe (2011), Cambridge University Press. The book-length treatment of the NB2 form used by `glm.nb()` and of theta itself.
- [Regression Analysis of Count Data, 2nd edition](https://doi.org/10.1017/CBO9781139013567) - Cameron and Trivedi (2013), Cambridge University Press. Overdispersion tests and where each count model belongs.
- [Quasi-Poisson vs. Negative Binomial Regression: How Should We Model Overdispersed Count Data?](https://doi.org/10.1890/07-0043.1) - Ver Hoef and Boveng (2007), Ecology 88(11), 2766-2772. How the two corrections differ and how to choose between them.
- [Modern Applied Statistics with S, 4th edition](https://doi.org/10.1007/978-0-387-21706-2) - Venables and Ripley (2002), Springer. The source of MASS and of `glm.nb()`.
- [Fit a Negative Binomial Generalized Linear Model](https://stat.ethz.ch/R-manual/R-devel/library/MASS/html/glm.nb.html) - the R documentation for `glm.nb()`. Its arguments, how theta gets estimated, and what the summary reports.

=== step === complete
## Quick recap

You took a set of counts that no Poisson model could honestly describe, proved it, and fixed it with one extra parameter. What to carry away:

- Poisson makes one promise, that the variance equals the mean. Ours came in at 10.15 against a mean of 2.61, so the promise was broken before we fitted anything.
- The dispersion ratio grades that promise in two lines: squared Pearson residuals over the residual degrees of freedom. Near 1 is fine, past 1.5 is a red flag, and ours was 2.797.
- An overdispersed Poisson fit does not make random mistakes. It makes one mistake in one direction, standard errors too small and therefore p-values too small. Across 300 years in which nothing at all was happening, it cried wolf 68 times.
- The negative binomial adds one parameter, theta, and one variance term, the mean squared over theta. Push theta to infinity and you have the Poisson back.
- `glm.nb()` from MASS is the same call with the family dropped. The coefficients hold, every standard error grows about 1.7 times, and the estimates that were leaning on a too-small error bar fall over.

And here is the sentence to say in the meeting about the reminder list:

"The visit counts were overdispersed, so we fitted a negative binomial model. The reminder list came out at 1.07 times the visit rate, with an interval running from 0.95 to 1.21. We cannot tell it apart from no effect."

That is the same data that looked like an 11% lift with a p-value of 0.0032. Nothing about the reminder list changed. Only the honesty of the error bar did.
