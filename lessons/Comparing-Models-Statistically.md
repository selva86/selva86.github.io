---
title: "Model Evaluation Lesson 6: Comparing Models Statistically"
catalog_blurb: "How to tell a real model improvement from the luck of one split."
description: "Two models, one test split, one metric gap: real or luck? Compare models the honest way, with resampled paired differences and a significance test in R."
keywords: "compare models, model comparison, paired t-test, cross-validation, resampling, statistical significance, p-value, RMSE, tidymodels, R"
post_type: "LESSON"
curriculum_id: "6.70.6"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-evaluation-tuning"
course_title: "Model Evaluation and Tuning in R"
course_lesson: "6"
course_total: "7"
course_landing: "R-Model-Evaluation-Course.html"
course_next: "From-Metrics-to-Money.html"
course_prev: "Scoring-Rules-and-Regression-Metrics.html"
---

=== step === cover
::eyebrow Lesson 6 of 7
## Comparing Models Statistically

You have a fair yardstick now. In Lesson 5 you learned to score a forecast with a metric that matches the decision. So you train two models to forecast Priya's daily cake sales, you measure them, and one comes out ahead. Ship it, right?

Not yet. That single number came from one test split, one particular draw of which rows you happened to hold out. Change the draw and the winner can change. This lesson teaches you to separate a real difference between two models from the ordinary luck of the split, so that when you say "Model B is better" you can mean it.

By the end you will be able to:

- Explain why a single test-split gap is partly luck, not a verdict
- Turn cross-validation into paired per-fold differences for two models
- Test whether the average difference is real, and read the p-value honestly

**Prerequisites:** you can run R and index a data frame, you know RMSE from [Lesson 5](Scoring-Rules-and-Regression-Metrics.html), and what a cross-validation fold is from [Lesson 1](Cross-Validation-Strategies.html).

::widget null-distribution {}

=== step === concept
::eyebrow The trap
## One test split is just one draw

Back at Priya's bakery. She wants to automate her daily sales forecast, and she is choosing between two models. **Model A** predicts the day's cake sales from the temperature alone. **Model B** adds two columns Priya knows matter: whether it is a weekend, and whether a promotion is running. Both are honest models; the only question is which one to deploy.

Each lesson runs in a fresh R session, so let us build four months of bakery days right here, then measure both models the usual way: train on most of the days, test on a held-out slice, and compare their RMSE (the average size of a forecast miss, from Lesson 5).

```r
set.seed(42)
n <- 96
bakery <- data.frame(
  temperature = round(runif(n, 5, 30), 1),   # daily high, in Celsius
  weekend     = rbinom(n, 1, 2/7),            # 1 on a weekend day
  promo       = rbinom(n, 1, 0.25),           # 1 if a promotion ran
  humidity    = round(runif(n, 40, 90))       # unrelated to sales (used later)
)
bakery$sales <- round(pmax(
  40 + 1.8 * bakery$temperature + 24 * bakery$weekend + 17 * bakery$promo +
    rnorm(n, 0, 18), 0))                       # sales = temp + weekend + promo + noise

rmse <- function(actual, pred) sqrt(mean((actual - pred)^2))

# score both models on ONE random train/test split
split_gap <- function(seed) {
  set.seed(seed)
  test <- sample(n, 24)                         # hold out 24 days as the test set
  tr <- bakery[-test, ]; te <- bakery[test, ]
  a <- rmse(te$sales, predict(lm(sales ~ temperature, data = tr), te))
  b <- rmse(te$sales, predict(lm(sales ~ temperature + weekend + promo, data = tr), te))
  round(c(rmse_A = a, rmse_B = b, gap = a - b), 2)
}
split_gap(4)   # one particular split
#> rmse_A rmse_B    gap
#>  19.90  16.06   3.84
```

On that split Model B wins by 3.84 cakes of RMSE. Convincing. But "that split" was one arbitrary choice of which 24 days to hold out. Watch what happens when we hold out a different 24 days:

```r
split_gap(3)   # a different split, same two models, same data
#> rmse_A rmse_B    gap
#>  19.40  19.28   0.12
```

Same two models, same 96 days, and now the gap has collapsed to 0.12, essentially a tie. Nothing changed except which rows landed in the test set. The 3.84 was never a fixed property of the models; a large chunk of it was luck. From one split you genuinely cannot tell whether B's true edge is worth deploying or close to nothing.

=== step === quiz
::eyebrow Check yourself
## What should Priya conclude?

Priya ran the comparison once and saw Model B beat Model A by 3.84 cakes of RMSE. Her colleague reran it on a different random split and B won by only 0.12. Same models, same data. What is the right conclusion?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Model B is better by 3.84 cakes; that is the number to report ::no That 3.84 came from one arbitrary split, and the very next split gave 0.12. A single split cannot pin down B's true edge, so reporting 3.84 as "the" gap claims more than you actually know.
- The single-split gap is partly luck; she cannot trust either number until she resamples ::ok Exactly. The gap swings with which rows land in the test set. To separate B's real edge from the luck of the draw, she needs many splits, not one.
- The two runs disagree, so the models must be broken ::no Nothing is broken. Honest models still score differently on different test sets, because a small test set is itself a noisy sample. That variation is the thing we are about to measure, not a bug.

=== step === concept
::eyebrow The fix
## Resample, and pair the scores

If one split is one noisy draw, the cure is to take many draws and stop leaning on any single one. That is exactly what **k-fold cross-validation** does: divide the 96 days into k equal folds, and let each fold take a turn as the test set while the other folds train the model. With k = 10 you get ten honest test scores per model instead of one.

Here is the move that makes the comparison sharp. Score **both** models on the **same** ten folds. Because fold 3 (say) is the same held-out days for Model A and Model B, whatever made fold 3 unusually hard or easy hits both models equally. Subtract their scores on that fold and the shared difficulty cancels, leaving only what you care about: how much better B did than A there. That per-fold gap is the **paired difference**:

\[ d_i = \mathrm{RMSE}_A^{(i)} - \mathrm{RMSE}_B^{(i)} \]

where \(i\) runs over the ten folds, \(\mathrm{RMSE}_A^{(i)}\) is Model A's error on fold \(i\), and a **positive** \(d_i\) means Model B did better on that fold. Let us compute all ten.

```r
set.seed(7)
k <- 10
fold <- sample(rep(1:k, length.out = n))   # give each day a fold label from 1 to 10

rmse_A <- rmse_B <- numeric(k)
for (f in 1:k) {
  tr <- bakery[fold != f, ]                 # train on the other 9 folds
  te <- bakery[fold == f, ]                 # test on this fold
  rmse_A[f] <- rmse(te$sales, predict(lm(sales ~ temperature, data = tr), te))
  rmse_B[f] <- rmse(te$sales, predict(lm(sales ~ temperature + weekend + promo, data = tr), te))
}
d <- rmse_A - rmse_B                         # the ten paired differences
round(d, 2)
#>  [1] -0.57  6.53  7.23  3.56 -1.79 -1.06  1.46  6.23  4.95  3.91
```

Ten numbers, one per fold. Seven are positive (Model B won that fold) and three are negative (Model A actually won). This is the honest picture that a single split hid from us.

=== step === widget
::eyebrow See the spread
## The ten differences

Here are those ten paired differences as bars: each bar is one fold, and its height is how much better Model B did than Model A on that fold. Bars above zero are folds B won; the three dipping below zero are folds where the simpler Model A came out ahead.

::widget chart-plotter {"data":[{"x":1,"y":-0.57},{"x":2,"y":6.53},{"x":3,"y":7.23},{"x":4,"y":3.56},{"x":5,"y":-1.79},{"x":6,"y":-1.06},{"x":7,"y":1.46},{"x":8,"y":6.23},{"x":9,"y":4.95},{"x":10,"y":3.91}],"geoms":["bar"],"x":"fold","y":"diff"}

Look at the shape of it. The bars lean positive on average, but they scatter, and a few flip sign. So the real question sharpens: is that average lean, sitting around three cakes, far enough above zero to be a genuine edge? Or could a pile of scattered differences like this bounce that high by pure chance even if the two models were truly equal? That is a question about signal versus noise, and it has a precise answer.

=== step === concept
::eyebrow Signal vs noise
## Signal divided by noise

The **signal** is how big the average edge is: the mean of the ten differences. The **noise** is how much those differences wobble from fold to fold: their standard deviation. A difference is convincing when the signal is large compared to the noise, so we take their ratio.

First, the raw numbers:

```r
mean(d)   # the signal: B's average edge, in cakes of RMSE
#> [1] 3.043979
sd(d)     # the noise: how much that edge swings across folds
#> [1] 3.336279
```

An average edge of about 3 cakes, but the fold-to-fold swing is just as large, so we cannot eyeball a verdict. The right yardstick for the noise is not the raw spread but the **standard error** of the mean: how much the *average* of ten differences would itself wobble if we redrew the folds. It shrinks the spread by the square root of the number of folds:

\[ \mathrm{SE} = \frac{s_d}{\sqrt{k}}, \qquad t = \frac{\bar{d}}{\mathrm{SE}} = \frac{\bar{d}}{s_d / \sqrt{k}} \]

Here \(\bar{d}\) is the mean of the differences (the signal), \(s_d\) is their standard deviation (the noise), \(k = 10\) is the number of folds, and \(t\) is the signal measured in units of its own standard error. R computes all of it, including a 95% confidence interval for the true mean difference, in one call:

```r
t.test(d)
#>
#>  One Sample t-test
#>
#> data:  d
#> t = 2.8852, df = 9, p-value = 0.01802
#> alternative hypothesis: true mean is not equal to 0
#> 95 percent confidence interval:
#>  0.6573484 5.4306088
#> sample estimates:
#> mean of x
#>  3.043979
```

A \(t\) of 2.89: B's average edge is nearly three standard errors above zero. The 95% confidence interval, roughly 0.7 to 5.4 cakes, stays entirely on the positive side and never touches zero. Both are saying the same thing. Now for the number everyone asks for: the p-value.

=== step === widget
::eyebrow The verdict
## Is it luck? Read the tail

The p-value answers one precise question: **if the two models were truly equal** (their average difference is really zero, an assumption we call the null hypothesis \(H_0\)), how often would pure fold-to-fold luck alone hand you a \(t\) as far from zero as the one you got? The curve below is the sampling distribution of \(t\) under that "the models are equal" assumption: differences pile up near zero, and rare large values sit out in the thin tails. The shaded area past your statistic is the p-value. Drag the marker out toward 2.9, where our test landed, and watch that tail area shrink toward nothing.

::widget null-distribution {"tails":2,"start":2,"label":"standardized difference t"}

Our \(t\) of 2.89 sits far out in that tail. The curve drawn here is the idealized (normal) reference; with only ten folds the exact reference is a slightly wider t-distribution with 9 degrees of freedom (one fewer than the ten folds), so the true tail is a touch larger than the picture suggests. The paired test pins it at **p = 0.018**: if the models were really equal, a gap this consistent would arise by luck under 2% of the time. That is below the usual 0.05 line, so we reject "the models are equal" and conclude Model B's edge is real. Priya can deploy it.

[WARNING]
One honest caveat. This p-value assumes the ten differences are independent draws, but cross-validation folds share training data (fold 1 and fold 2 are trained on almost the same days), so the differences are gently correlated. That makes the naive p-value a little optimistic, too quick to call a difference real. For a decision that matters, repeat the whole k-fold split several times and use a correlation-corrected test (the Nadeau and Bengio correction, built into tidymodels). The logic is identical; only the width of the tail changes.

=== step === tryit
::eyebrow Your turn
## Build the statistic yourself

The whole test is one ratio: the signal (the mean difference) divided by its standard error. And the standard error is the fold-to-fold spread shrunk by the square root of **how many folds you averaged**, not how many rows you have. You have ten differences in `d`. Fill in the blank so the standard error uses the number of folds, then check that the ratio reproduces the t of 2.89.

```r
se <- sd(d) / sqrt(____)   # shrink the spread by the number of differences
t_stat <- mean(d) / se
round(t_stat, 2)
```
::check {"regex":"sqrt\\(\\s*(?:length\\(d\\)|10|k)","gate":true,"difficulty":"intermediate","ok":"That is the t-statistic, 2.89: the exact value t.test(d) reported. Signal over standard error, nothing more.","no":"The standard error divides the spread by the square root of the number of folds you averaged: length(d), which is 10 (not n, the number of rows)."}
::solution
```r
se <- sd(d) / sqrt(length(d))   # ten differences, so divide by sqrt(10)
t_stat <- mean(d) / se
round(t_stat, 2)
#> [1] 2.89
```

=== step === concept
::eyebrow The other verdict
## When the honest answer is "no difference"

A significance test has two possible endings, and the second is just as useful as the first. Suppose Priya wonders whether adding **humidity** to Model B would help. Call that richer model **Model C**. Humidity, in our data, has nothing to do with sales, so this is the acid test: what does the comparison say when there is genuinely nothing to find?

```r
rmse_C <- numeric(k)
for (f in 1:k) {
  tr <- bakery[fold != f, ]; te <- bakery[fold == f, ]
  rmse_C[f] <- rmse(te$sales,
    predict(lm(sales ~ temperature + weekend + promo + humidity, data = tr), te))
}
d_BC <- rmse_B - rmse_C     # does adding humidity improve Model B?
t.test(d_BC)
#>
#>  One Sample t-test
#>
#> data:  d_BC
#> t = 0.63087, df = 9, p-value = 0.5438
#> alternative hypothesis: true mean is not equal to 0
#> 95 percent confidence interval:
#>  -0.1459259  0.2587942
#> sample estimates:
#>  mean of x
#> 0.05643415
```

The differences barely stray from zero, and a p-value of 0.54 is nowhere near 0.05. But read that result carefully. It does **not** prove humidity has zero effect; it says we **could not distinguish** its effect from luck with this data. Absence of evidence is not evidence of absence. The practical move, though, is clear: when you cannot tell two models apart, keep the **simpler** one. Model C buys you a fatter model and no measurable gain, so Priya sticks with Model B.

=== step === quiz
::eyebrow Check yourself
## Reading a non-significant result

Comparing Model B against Model C (B plus humidity) gave a mean difference of about 0.06 cakes and a p-value of 0.54. Which reading is correct?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- Humidity makes the model measurably worse, so it should be banned ::no The mean difference is tiny and the interval straddles zero (about -0.15 to +0.26). The test found no reliable difference in either direction, not a penalty.
- The test proves humidity has exactly zero effect on sales ::no A high p-value never proves the null. It means this data could not tell humidity's effect apart from chance. With far more days, a real but tiny effect might yet surface.
- There is no detectable difference, so prefer the simpler Model B ::ok Right. You could not distinguish the two, so the extra feature earns nothing you can measure. When a test comes back non-significant, the tie-breaker is simplicity: keep the leaner model.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [An Introduction to Statistical Learning, ch. 5: Resampling Methods (free PDF)](https://www.statlearning.com/) - cross-validation and the bootstrap, the resampling foundation this test is built on.
- [Dietterich (1998), Approximate Statistical Tests for Comparing Supervised Classification Learning Algorithms, Neural Computation](https://doi.org/10.1162/089976698300017197) - the classic study of what goes wrong when you test model differences, and why naive tests mislead.
- [Nadeau & Bengio (2003), Inference for the Generalization Error, Machine Learning](https://doi.org/10.1023/A:1024068626366) - the corrected resampled t-test that fixes the correlated-folds problem flagged in this lesson.
- [tidyposterior: compare models with resampling (tidymodels)](https://tidyposterior.tidymodels.org/) - the R package that runs these comparisons, including correlation-corrected and Bayesian versions.

=== step === complete
## Lesson 6 complete

You can now compare two models and mean it. A single test split is one lucky draw; resampling turns it into ten paired differences that cancel the shared difficulty of each fold. The signal (their average) divided by the noise (their standard error) is a t-statistic, and its p-value tells you how easily pure luck could fake a gap that big. You watched a real edge survive the test (p = 0.018, deploy Model B) and a fake one fail it (p = 0.54, keep it simple), and you know the one caveat: overlapping folds make the naive p-value a touch optimistic.

Next, Lesson 7: From Metrics to Money. A statistically real improvement is still just a number on a metric. You will turn that verified gain into the business decision it should drive, and see when a "significant" difference is too small to be worth acting on.
