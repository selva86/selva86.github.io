---
title: "Estimation and the Bootstrap Lesson 1: Bias, variance, and the cost of an estimator"
catalog_blurb: "Why a biased estimator can beat an unbiased one on mean squared error."
description: "Score two competing estimators of a process variance by bias, variance and mean squared error, then sweep the divisor to find the one that minimizes error."
keywords: "bias, variance, mean squared error, MSE, estimator, maximum likelihood estimator, divisor, degrees of freedom, R"
post_type: "LESSON"
curriculum_id: "4.20.1"
webr: true
mathjax: false
lesson_access: "free"
course_id: "res-estimation"
course_title: "Estimation and the Bootstrap"
course_lesson: "1"
course_total: "7"
course_landing: "Estimation-and-the-Bootstrap-Course.html"
course_next: "Maximum-Likelihood-from-the-Curve-Up.html"
course_prev: ""
---

=== step === cover
## Bias, variance, and the cost of an estimator

Today let's work out what actually makes one formula for estimating a number better than a rival formula, not by guessing, but by scoring both against a truth we happen to know.

A quality engineer on a bolt-manufacturing line pulls n = 6 bolts off the line every shift and measures their diameters, in millimeters. When the line is correctly calibrated, those diameters come from a process with a true mean of 10 mm and a true variance of 0.04 square millimeters, a standard deviation of 0.2 mm.

She wants a formula she can trust to estimate that variance from just one shift's six bolts. Two formulas compete for the job. One divides the sum of squared deviations from the sample mean by n minus 1, which is 5, exactly what R's `var()` function returns. The other divides that same sum by n, which is 6, the maximum likelihood estimator.

::widget bias-variance-target {}

The widget above shows one way a set of repeated estimates can go wrong: a cluster of shots sitting off to one side of the bullseye, but packed in close together.

=== step === widget
## Picturing bias and variance on a target

Picture an estimator fired at a true value over and over, once per sample it is handed. Bias is how far the average of all those shots sits from the true value. Variance is how spread out the individual shots are around that average, regardless of where the average lands.

::widget bias-variance-target {}

Drag the bias slider down to 0 and push the variance slider up past 0.7. The shots spread out widely now, but their average still centers on the bullseye: zero bias, but a lot of variance.

Now push bias back up past 1, and bring variance back down below 0.7. The shots pull back into a tight little cluster, but that cluster sits off away from the bullseye again: bias is back, and variance has dropped.

Bias and variance are two separate properties of how an estimator behaves across repeats. An estimator can carry either one without the other, or some of both, and nothing about one tells you the value of the other. This dartboard is not using the bolt line's real numbers. It is simply a way to feel what bias and variance mean on their own, independent of any one particular estimator.

=== step === concept
## Bias and variance for two competing formulas

Testing one shift's six bolts only gives one estimate from each formula, and one estimate is not enough to say which formula is better. The real test is to repeat the shift many times, apply both formulas every time, and see how their estimates behave across all those repeats.

Simulate 50000 shifts of six bolts each, all drawn from the true process, mean 10 mm and variance 0.04 square millimeters, and score both formulas against that true variance. A real quality engineer never gets to see the true variance directly, but this simulation does, which is exactly why it can settle the question.

```r
# Simulate 50000 shifts of n = 6 bolt diameters from a process with true variance 0.04
set.seed(42)
n <- 6
nsim <- 50000
true_var <- 0.04
samples <- matrix(rnorm(nsim * n, mean = 10, sd = 0.2), nrow = nsim, ncol = n)

# Each sample's sum of squared deviations from its own mean
sample_means <- rowMeans(samples)
ss <- rowSums((samples - sample_means)^2)

# Two competing estimators of the true variance, built from the same ss
s2_unbiased <- ss / (n - 1)
s2_mle <- ss / n

round(c(mean = mean(s2_unbiased), bias = mean(s2_unbiased) - true_var, variance = var(s2_unbiased)), 6)
#>     mean     bias variance 
#> 0.040111 0.000111 0.000649 
round(c(mean = mean(s2_mle), bias = mean(s2_mle) - true_var, variance = var(s2_mle)), 6)
#>      mean      bias  variance 
#>  0.033426 -0.006574  0.000451 
```

Across the 50000 simulated shifts, the first formula, divide by 5, averages 0.040111. That average sits just 0.000111 above the true variance, 0.04, a bias close enough to zero to call this formula unbiased. Its variance across those 50000 estimates is 0.000649, a measure of how much any one shift's estimate wanders from that average.

The second formula, divide by 6, averages 0.033426, pulled down to 0.006574 below the true variance. That is a real, measurable bias, not noise from the simulation. But its variance is only 0.000451, tighter than the first formula's 0.000649.

If you ever compute `var()` on a single sample in R, that is exactly the first formula at work, the sum of squared deviations divided by n minus 1. R's default variance estimator is unbiased for exactly this reason.

=== step === quiz
## Quick check: reading bias and variance apart

Of the bolt line's two formulas just computed, divide by 5 averaged 0.040111 (bias 0.000111, variance 0.000649) and divide by 6 averaged 0.033426 (bias -0.006574, variance 0.000451). Which one is the estimator sitting almost exactly on the true variance, and which one is the estimator whose estimates cluster more tightly around their own, slightly wrong, average?

::quiz {"correct": 1, "gate": true, "difficulty": "beginner"}
- Divide by 5 sits almost exactly on the true variance, since its bias is only 0.000111. Divide by 6 clusters more tightly around its own average, since its variance, 0.000451, is the smaller of the two, even though that average sits below the truth. ::ok Right. Being close to the truth on average, a small bias, and being tightly clustered, a small variance, are two different properties, and this pair of formulas splits them: divide by 5 wins on bias, divide by 6 wins on variance.
- Divide by 6 sits almost exactly on the true variance, and divide by 5 clusters more tightly around its own average. ::no
- Divide by 6, since its variance, 0.000451, is smaller than divide by 5's, 0.000649, meaning divide by 6 must also be the one with less bias. ::no A smaller variance does not mean a smaller bias. Divide by 6's variance is indeed the smaller of the two, 0.000451 against 0.000649, but its bias, -0.006574, is far larger in size than divide by 5's 0.000111. Variance measures spread around an estimator's own average; bias measures how far that average sits from the truth, and the two can move in opposite directions, exactly as they do here.

=== step === concept
## Mean squared error: combining bias and variance into one number

Bias and variance score an estimator on two separate scales, and neither formula is a clean winner so far: divide by 5 wins on bias, divide by 6 wins on variance. To actually compare them, both scores need to combine into one number. That number is mean squared error, MSE, and it is just bias squared plus variance.

MSE also has a second, more direct definition: the average, across all 50000 simulated estimates, of the squared gap between that estimate and the true variance. The two definitions should agree, since they measure the exact same thing two different ways, and the code below checks that they do.

```r
# Two routes to mean squared error for both estimators: the decomposition and the direct average
bias_unbiased <- mean(s2_unbiased) - true_var
variance_unbiased <- var(s2_unbiased)
mse_unbiased_decomposition <- bias_unbiased^2 + variance_unbiased
mse_unbiased_direct <- mean((s2_unbiased - true_var)^2)

bias_mle <- mean(s2_mle) - true_var
variance_mle <- var(s2_mle)
mse_mle_decomposition <- bias_mle^2 + variance_mle
mse_mle_direct <- mean((s2_mle - true_var)^2)

round(c(decomposition = mse_unbiased_decomposition, direct = mse_unbiased_direct), 7)
#> decomposition        direct 
#>     0.0006489     0.0006489 
round(c(decomposition = mse_mle_decomposition, direct = mse_mle_direct), 7)
#> decomposition        direct 
#>     0.0004938     0.0004938 
```

Both routes land on the same two numbers. Divide by 5's MSE comes to 0.0006489, whether you add its bias squared to its variance or average the squared gap directly. Divide by 6's MSE comes to 0.0004938, by either route.

Despite carrying a real bias, divide by 6 has the lower MSE, about 24% below divide by 5's. The formula most statistics courses teach you to prefer is not the one that scores best here.

=== step === concept
::prose-only a small table built from this step's own numbers, no new computation
## Why a biased estimator can have lower MSE: the arithmetic

Line the four numbers up for each formula and the trade becomes arithmetic, not a trick.

| Formula | Bias | Bias squared | Variance | MSE |
|---|---|---|---|---|
| Divide by 5 | 0.000111 | effectively zero | 0.000649 | 0.000649 |
| Divide by 6 | -0.006574 | 0.0000432 | 0.000451 | 0.000494 |

Dividing by 6 instead of 5 cuts variance from 0.000649 to 0.000451, a drop of 0.000198, about 31% less. That same change in divisor pulls the average estimate further from the truth, so bias grows in size from 0.000111 to 0.006574. But squaring that bias before it enters MSE shrinks it enormously: 0.006574 squared is only 0.0000432, a little over a fifth of the 0.000198 of variance it bought.

MSE is just bias squared plus variance, added up the same way whether an estimator is biased or not. When a small bias buys a much bigger cut in variance, as it does here, the biased estimator's MSE ends up lower. Nothing protects an unbiased estimator from losing this trade. MSE counts exactly what each estimator actually costs, and here the unbiased one costs more.

=== step === widget
## Sliding the divisor: the full bias-variance curve

Divide by 5 and divide by 6 are not the only two choices. Nothing stops you from dividing that same sum of squared deviations by any other number, so sweep the divisor from 4 to 10 and score bias, variance and MSE at every one, using the same 50000 simulated shifts already in hand.

```r
# Sweep the divisor from 4 to 10 and score bias, variance and MSE at each one
divisors <- 4:10
sweep_results <- data.frame(
  divisor = divisors,
  bias = sapply(divisors, function(d) mean(ss / d) - true_var),
  variance = sapply(divisors, function(d) var(ss / d)),
  mse = sapply(divisors, function(d) (mean(ss / d) - true_var)^2 + var(ss / d))
)
sweep_results$bias <- round(sweep_results$bias, 6)
sweep_results$variance <- round(sweep_results$variance, 6)
sweep_results$mse <- round(sweep_results$mse, 6)
print(sweep_results, row.names = FALSE)
#>  divisor      bias variance      mse
#>        4  0.010139 0.001014 0.001117
#>        5  0.000111 0.000649 0.000649
#>        6 -0.006574 0.000451 0.000494
#>        7 -0.011349 0.000331 0.000460
#>        8 -0.014931 0.000253 0.000476
#>        9 -0.017716 0.000200 0.000514
#>       10 -0.019944 0.000162 0.000560
```

Read down the bias column and it only gets more negative: a bigger divisor always pulls the estimate down further below the truth. Read down the variance column and it only gets smaller: a bigger divisor always shrinks the spread. Those two columns move in opposite directions the whole way down.

MSE, the last column, does neither. It falls from 0.001117 at divisor 4, down to a low of 0.000460 at divisor 7, then climbs back up to 0.000560 at divisor 10. Divisor 7 is n plus 1, one more than even the maximum likelihood estimator's divisor of 6, and its MSE beats both of the named formulas from earlier, even though its bias, -0.011349, is larger in size than either named formula's own bias.

The same U shape shows up whenever an error trades off two pieces that move in opposite directions. The widget below is not using the bolt line's own numbers. It plots a different, more familiar version of the same trade: a model's error on data it has not seen, as the model is allowed to get more flexible.

::widget bias-variance {}

Step its slider across and watch the same shape: one error falling as the model fits the data it has already seen better and better, the other error falling for a while and then climbing back up, the same way the MSE column above fell and then climbed. The slider's exact numbers belong to that different example, not to the bolt line, but the shape it draws is the one divisor 4 through 10 just traced for the bolt line's own variance.

=== step === tryit
## Your turn: score the divisor with the lowest MSE

`ss` still holds every simulated shift's sum of squared deviations. Divide it by 7 instead of 5 or 6, the way the sweep above did, then score that estimator's bias, variance and MSE exactly the way divide by 5 and divide by 6 were scored earlier.

```r
# ss already holds each simulated shift's sum of squared deviations.
# Divide it by 7 to build a third estimator, s2_d7, then compute:
#   bias_d7 <- mean(s2_d7) - true_var
#   variance_d7 <- var(s2_d7)
#   mse_d7 <- bias_d7^2 + variance_d7
# Four lines. Press Check when you have them.
```
::check {"regex": "ss\\s*/\\s*7\\b", "gate": true, "difficulty": "intermediate", "ok": "Right: bias -0.011349, variance 0.000331, MSE 0.000460, matching the low point the divisor sweep traced above. Divisor 7 beats both divide by 5 and divide by 6 on MSE, even though its own bias is the largest of the three.", "no": "Build a third estimator the same way divide by 5 and divide by 6 were built two steps back, dividing ss by 7 this time: s2_d7 <- ss / 7. Then score it with the same three lines used for the other two estimators."}
::solution
```r
# Divide each sample's sum of squared deviations by 7 and score the result the same way
s2_d7 <- ss / 7
bias_d7 <- mean(s2_d7) - true_var
variance_d7 <- var(s2_d7)
mse_d7 <- bias_d7^2 + variance_d7
round(c(bias = bias_d7, variance = variance_d7, mse = mse_d7), 6)
#>      bias  variance       mse 
#> -0.011349  0.000331  0.000460 
```

=== step === quiz
## Quick check: what MSE actually measures

Here is a different, unrelated estimation problem. Estimator P is unbiased: bias 0, variance 0.12. Estimator Q is biased: bias 0.25, variance 0.05. Which one has the lower mean squared error?

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- Estimator Q. Its bias squared, 0.0625, plus its variance, 0.05, comes to 0.1125, below estimator P's MSE of 0.12, even though Q carries a real bias and P does not. ::ok Right. 0.25 squared is 0.0625, and 0.0625 plus 0.05 is 0.1125, below P's 0.12. Zero bias does not make P the automatic winner. MSE adds up both costs, and here Q's small bias cost less than the variance it saved.
- Estimator P, because an unbiased estimator is always the safer choice, whatever its variance turns out to be. ::no
- Estimator Q, because an estimator with the smaller variance always has the lower MSE, no matter what its bias is. ::no Q does have the lower MSE here, 0.1125 against 0.12, but not because smaller variance always wins. MSE is bias squared plus variance, and a large enough bias can still beat a small variance. Here it happens not to, since 0.25 squared is only 0.0625, but check both numbers every time rather than assuming either one decides it alone.

=== step === concept
::prose-only the sources are text, not a visual
## References

- [Casella, G. and Berger, R. L., *Statistical Inference* (2nd ed., Duxbury/Chapman and Hall), bias, variance and mean squared error for competing estimators of a normal variance](https://www.routledge.com/Statistical-Inference/Berger-Casella/p/book/9781032593036)
- Rice, J. A. (2007). *Mathematical Statistics and Data Analysis* (3rd ed.). Duxbury. The worked comparison of variance estimators by mean squared error.
- [Wasserman, L., *All of Statistics* (Springer, 2004), the chapter on point estimation and the bias-variance-MSE framework used throughout this lesson](https://doi.org/10.1007/978-0-387-21736-9)
- [Wikipedia, "Bias of an estimator"](https://en.wikipedia.org/wiki/Bias_of_an_estimator), the minimum-MSE divisor result for estimating a normal variance.
- [Wikipedia, "Mean squared error"](https://en.wikipedia.org/wiki/Mean_squared_error), the bias-variance decomposition of MSE.

=== step === complete
## What this trade-off means for every estimator you build next

The formula most people are taught to reach for by default, divide by n minus 1, was not the one with the lowest MSE on the bolt line's own variance. Divide by 6 beat it, and divide by 7 beat them both, trading a bigger bias for an even bigger cut in variance.

Picture the dartboard once more. A cluster of shots sitting off the bullseye but packed in tight is bias without much variance, and a cluster centered on the bullseye but scattered wide is variance without much bias. Divide by 5's error on the bolt line was almost entirely variance, 0.000649 of it against a bias squared too small to matter. Divide by 6's error was 0.0000432 of bias squared sitting alongside 0.000451 of variance, a worse-looking dart but a better-scoring one.

Being unbiased is not the same as being good. Mean squared error is the number that actually settles which estimator wins, and it counts bias and variance on exactly equal terms.
