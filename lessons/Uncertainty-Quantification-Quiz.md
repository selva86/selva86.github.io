---
title: "Uncertainty Quantification: Quiz"
description: "A graded check on the uncertainty quantification section: prediction versus confidence intervals, split conformal coverage, prediction sets, the pinball loss, calibration and recalibration, the bootstrap and jackknife+, and reporting honestly."
keywords: "R quiz, uncertainty quantification, prediction interval, confidence interval, coverage, split conformal prediction, prediction sets, pinball loss, quantile regression, calibration, ECE, Platt scaling, isotonic regression, bootstrap, jackknife plus, aleatoric, epistemic, ds-uncertainty"
post_type: "LESSON"
curriculum_id: "6.210.8"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-uncertainty"
course_title: "Uncertainty Quantification in R"
course_lesson: "8"
course_total: "8"
course_landing: "R-Uncertainty-Course.html"
lesson_kind: "quiz"
course_prev: "Reporting-Uncertainty-Honestly.html"
course_next: ""
catalog_blurb: "Check what stuck before you move on."
---

=== step === cover
::eyebrow Check your understanding
## Quiz
Across seven lessons you turned a single guess into an honest account of what you do not know. You separated a prediction interval (about one new outcome) from a confidence interval (about the average), then built coverage you could actually certify: split conformal from held-out misses, conformalized quantile bands and prediction sets that grow when the model hesitates. You fit conditional quantiles with the pinball loss, put a model's probabilities on trial with calibration, and got uncertainty from resampling alone with the bootstrap and the jackknife+. Running through all of it is one discipline: a number is only honest if it comes with a range you can defend, matched to the decision it feeds. This quiz checks what stuck. The last two steps are live R you can run.

=== step === quiz
::eyebrow Question 1 of 8
## Which range do you quote?
A client is selling one specific 1,500 square foot flat and asks what it will fetch. You hold a confidence interval of $323k to $335k and a prediction interval of $250k to $408k. Which do you quote, and why?
::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The confidence interval, because it is far tighter, so it is the more precise and more useful answer. ::no It is tighter because it describes the AVERAGE 1,500 foot flat, not this one. Quote it to a single seller and you promise a precision that will be wrong most of the time.
- The prediction interval, because the client is selling one home, and only it carries the home-to-home scatter around the average that a single sale actually lands in. ::ok Right. A confidence interval is about the average line and shrinks toward it with more data; a prediction interval adds the irreducible spread of an individual home, which is the only thing that can keep a coverage promise about this sale.
- Either one; at 160 sales the two intervals have essentially converged. ::no They have not: about $13k wide versus $158k. More data collapses the confidence interval toward the line but barely touches the prediction interval, because a new home's own scatter never goes away.
- Neither; average the two so the range is honest but not too wide. ::no Averaging two intervals that answer different questions answers neither. The client asked about one home, so the prediction interval is the correct object, wide as it is.

=== step === quiz
::eyebrow Question 2 of 8
## What did split conformal guarantee?
You wrapped split conformal around a decision tree grown so deep it nearly memorized its training data, taking the band width from held-out calibration misses, and it covered 90% on fresh homes. A colleague says "that only worked because the errors happen to be normal." Which statement is exactly right?
::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- The colleague is right: the 90% holds only because the residuals are a normal bell curve, just like an `lm` interval. ::no The opposite is true. Split conformal makes no distributional assumption, which is exactly why it hit 90% wrapped around a memorizing tree, where a bell-curve formula would have no reason to work.
- It worked only because the tree was secretly a good model; a worse model would have broken the 90%. ::no A worse model does not change the coverage, only widens the band. Coverage is guaranteed regardless of model quality; a sharper model merely earns a smaller quantile and a narrower band.
- It guarantees at least 90% coverage on the margin, distribution-free and for any model, as long as new homes stay exchangeable with the calibration set. ::ok Exactly. Finite-sample and distribution-free on the margin, indifferent to which model made the predictions, and conditional only on exchangeability. The overfit tree changed the band's width, never its coverage.
- Scoring on the tree's own training misses instead of the held-out ones would give the same band. ::no It would not: training misses are optimistic (here about six times too small), so a band built from them covered only 23%. The held-out calibration set is the load-bearing wall of the whole guarantee.

=== step === quiz
::eyebrow Question 3 of 8
## What does a prediction set say?
Your conformal classifier returned `{detached}` for one listing and `{condo, townhouse}` for another, and covered 90% overall. What does the two-label set mean?
::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- It is an error: a single-label prediction would have been correct, and the set-valued output made a needless mistake. ::no A larger set is not a mistake, it is honesty. The guarantee is that the true class is inside the set about 90% of the time, and a two-label set is more likely to contain the truth, not less.
- Set size is the model's uncertainty made visible: it stays a singleton when the model is confident and grows to two only when two classes both clear the conformal threshold, while the true class stays inside about 90% of the time. ::ok Exactly. Confident listings get a clean single label; genuinely ambiguous ones grow to two rather than fake a decision. The set size is the report, and coverage still holds.
- A bigger set means weaker coverage, because spreading the guarantee over more labels dilutes it. ::no Coverage is about whether the truth is inside the set, and a bigger set is more likely to contain it, not less. Set size trades against usefulness (smaller is sharper), never against the coverage guarantee.
- The two-label set means the calibration failed and should be re-run until every listing gets one label. ::no Forcing one label everywhere would hide real ambiguity, not remove it. A mix of singletons and two-label sets is the method working exactly as designed.

=== step === quiz
::eyebrow Question 4 of 8
## Why the line moves up
To aim a regression line at the 90th percentile you minimize the pinball (check) loss with a target of tau = 0.9. Why does that push the line up until only about 10% of points sit above it?
::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- Because it squares each residual and multiplies by tau, so the largest misses dominate and drag the line toward the top. ::no The pinball loss is linear in the residual, not squared; squaring the residual is what gives the mean (ordinary least squares). The pull comes from an asymmetric penalty, not from squaring.
- Because at tau = 0.9 the two miss directions are penalized equally, so the line settles with half the points on each side. ::no Equal penalties give the median (tau = 0.5). At tau = 0.9 the penalties are deliberately unequal, which is what moves the line off the middle.
- Because a point left above the line costs only 0.1 per unit while one below costs 0.9, so being below is nine times as expensive, and the fit lifts the line until only about 10% of points can afford to stay above it. ::ok Exactly. The asymmetric penalty is the whole engine: at tau = 0.9 the line keeps rising until only about a tenth of the points remain above it, which is the 90th percentile.
- Because the loss ignores points below the line entirely and only penalizes those above it. ::no It penalizes both sides, just by different amounts (0.9 below, 0.1 above at tau = 0.9). Ignoring one side entirely would send the line to an extreme, not to a percentile.

=== step === quiz
::eyebrow Question 5 of 8
## A high AUC and a bowed curve
A churn model has AUC 0.91, but its reliability curve bows well below the diagonal on the high end, and you have about 200 held-out points to calibrate on. What is true?
::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- An AUC of 0.91 is high enough that the predicted probabilities must already be close to correct, so you can act on their values directly. ::no AUC reads only the ranking, never whether a stated 0.8 means 0.8. A model can rank almost perfectly and still be badly over-confident, which is exactly what a curve bowing below the diagonal shows.
- AUC certifies only the ranking, so the bowed curve shows the probabilities are miscalibrated; recalibrate on the held-out set with a monotone map (Platt here, since 200 points is small and the bow is smooth), which cuts the ECE while leaving the AUC essentially unchanged. ::ok Exactly. Discrimination and calibration are different goals: a monotone relabel fixes the values without touching the order, so the AUC holds while the reliability curve snaps back toward the diagonal.
- Isotonic regression is the safe choice here, and being more flexible it will also raise the AUC by fitting the data better. ::no Two errors: on only 200 points isotonic's step function chases noise and overfits, and no calibration map can raise AUC, because a monotone relabel never changes the ranking.
- The fix is to retrain the model with more features, since a miscalibrated curve means the model is underfit. ::no Miscalibration is not underfitting. The ranking is already good (AUC 0.91); you need to relabel the scores, not add features. Recalibration repairs the probabilities without a new model.

=== step === quiz
::eyebrow Question 6 of 8
## Bootstrapping the median
You need a 95% interval for the MEDIAN sale price, which has no textbook standard-error formula, so you bootstrap it. Which description of the method is correct?
::quiz {"correct":4,"gate":true,"difficulty":"intermediate"}
- Draw a smaller subset of the rows without replacement, take its median, and repeat; report the range of those medians. ::no That is subsampling, not the bootstrap. Without replacement you never get duplicates, and a smaller sample understates the true uncertainty. The bootstrap keeps the size at n and samples with replacement.
- Generate fresh rows from a fitted model of the market, take the median of each simulated dataset, and read off two percentiles. ::no That is a parametric simulation, which leans on the model being right, the very assumption the bootstrap avoids. The bootstrap resamples the actual rows and assumes nothing about their distribution.
- It only works for the mean, because the median has no known sampling distribution to read a percentile interval from. ::no The bootstrap needs no formula: it estimates the sampling distribution of the median by resampling, which is precisely why it shines where no formula exists. It breaks for extremes like the max, not for a central statistic like the median.
- Resample n rows with replacement (same size, some rows repeated and about a third left out), recompute the median on each resample, and take the 2.5th and 97.5th percentiles of those medians. ::ok Exactly. The spread of the resampled medians estimates the median's sampling distribution, and reading two percentiles straight off it gives a 95% interval, with no bell curve or formula assumed.

=== step === quiz
::eyebrow Question 7 of 8
## Jackknife+ versus split conformal
Both the jackknife+ and split conformal hand you a distribution-free prediction interval with a coverage guarantee. On a small 50-home dataset, what is the real trade-off?
::quiz {"correct":2,"gate":true,"difficulty":"advanced"}
- Split conformal is strictly better, because the jackknife+ carries no coverage guarantee at all. ::no The jackknife+ guarantees at least 1 - 2*alpha coverage; split conformal is a hair stronger at 1 - alpha. It is not that the jackknife+ lacks a guarantee, only that its floor is slightly lower.
- The jackknife+ reuses every row through leave-one-out instead of spending a slice on a calibration split, so on small data it usually gives a tighter interval, paid for with n model fits and a slightly weaker floor of at least 1 - 2*alpha. ::ok Exactly. Split conformal throws half of the 50 rows to calibration, giving a weaker model and a noisier band; the jackknife+ trains on 49 rows every time and wastes nothing, so its interval is tighter here, at the cost of fitting the model n times.
- They are the same method: both set aside one calibration set and read a quantile of its held-out residuals. ::no Only split conformal uses a fixed calibration split. The jackknife+ has no fixed split; it rotates leave-one-out over every row, which is exactly why it uses small data more efficiently.
- The jackknife+ needs the errors to be normal, while split conformal does not. ::no Both are distribution-free; neither assumes normal errors. The jackknife+'s leave-one-out residuals carry no bell-curve assumption, just as split conformal's held-out misses do not.

=== step === quiz
::eyebrow Question 8 of 8
## More data, which piece shrinks?
Rohan gathers ten times more sales and refits. What happens to the 90% prediction interval for one specific new flat, and why?
::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- Both the epistemic and the aleatoric pieces shrink, so the interval narrows sharply. ::no More data shrinks only the epistemic piece, the wobble in the fitted line. The aleatoric scatter of a single home is set by the world, not the sample size, so it does not shrink.
- The prediction interval keeps shrinking until it equals the confidence interval. ::no They never meet. The confidence interval is the epistemic piece alone; the prediction interval always adds the aleatoric scatter on top, which stays even as the line pins down.
- Only the epistemic piece shrinks (the line pins down, roughly like 1 over root n), while the aleatoric scatter of a single home stays, so the interval narrows a little and then settles on a floor. ::ok Right. Epistemic uncertainty is reducible with data; aleatoric is the world's own irreducible noise. The interval hits a floor set by that noise, which is also why you round the point to the precision the interval allows, not to the cent.
- Nothing changes, because coverage is fixed at 90% regardless of sample size. ::no The coverage level stays 90% by construction, but the interval's WIDTH still narrows as the epistemic piece shrinks, then stops at the aleatoric floor. The level and the width are different things.

=== step === concept
::eyebrow Run it: a guaranteed band
## Coverage from held-out misses
Split conformal reads its band width straight off the model's misses on a held-out calibration slice, then guarantees coverage at or above the level you asked for, whatever shape the errors take and whatever model made the predictions. Here the noise deliberately grows with `x`, exactly the case a bell-curve formula gets wrong, and the conformal band still covers.

```r
set.seed(1)
n <- 1500
x <- runif(n, 0, 10)
y <- 2 + 1.5 * x + rnorm(n, 0, 1 + 0.4 * x)   # noise grows with x (heteroskedastic)
d  <- data.frame(x, y)
tr <- d[1:500, ]; ca <- d[501:1000, ]; te <- d[1001:1500, ]
fit    <- lm(y ~ x, data = tr)                          # any model will do
scores <- abs(ca$y - predict(fit, ca))                  # misses on a HELD-OUT slice
qhat   <- sort(scores)[ceiling((nrow(ca) + 1) * 0.90)]  # the conformal half-width
guess  <- predict(fit, te)
inside <- te$y >= guess - qhat & te$y <= guess + qhat   # in the band on fresh data?
round(c(qhat = unname(qhat), coverage = mean(inside)), 3)
#>     qhat coverage
#>    5.684    0.918
```

The half-width comes out to **5.684**, and coverage on fresh data is **0.918**, at or above the 90% you asked for. No assumption about the errors, no requirement that the model be good: the held-out misses did all the work.

=== step === concept
::eyebrow Run it: a band that breathes
## Quantile lines fan apart
A fixed-width band under-covers exactly where the outcome scatters most. Quantile regression fixes that by fitting the edges directly with the pinball loss, so the low and high lines each get their own slope and the gap between them widens where the data are noisy. `quantreg`'s `rq()` works like `lm()` but takes the percentile you want in `tau`.

```r
library(quantreg)
set.seed(1)
n <- 1500
x <- runif(n, 0, 10)
y <- 2 + 1.5 * x + rnorm(n, 0, 1 + 0.4 * x)   # spread grows with x
d  <- data.frame(x, y)
lo <- rq(y ~ x, tau = 0.05, data = d)          # low edge  (5th percentile)
hi <- rq(y ~ x, tau = 0.95, data = d)          # high edge (95th percentile)
at    <- data.frame(x = c(2, 9))               # a calm x and a wild one
width <- predict(hi, at) - predict(lo, at)     # the 90% band width at each
round(setNames(width, c("x=2", "x=9")), 2)
#>   x=2   x=9
#>  6.12 16.51
```

The band is **6.12** wide at the calm `x = 2` and **16.51** at the wild `x = 9`, nearly three times wider. Nobody set that width by hand: each edge line has its own slope, so the band opens up exactly where the outcome gets less predictable. Wrap conformal around it (Lesson 3) and that adaptive shape gains a coverage guarantee too.

=== step === complete
## Section complete
Strong work. You can now reach for the right uncertainty tool by the question it answers: a confidence interval for the average and a prediction interval for one new outcome; split conformal for a distribution-free coverage guarantee from held-out misses, conformalized quantile regression and prediction sets when the width or the answer must adapt; the pinball loss to fit conditional quantiles and a whole distributional picture; calibration, ECE and the Brier score to test a probability, with Platt scaling or isotonic regression to repair it; the bootstrap for the uncertainty of any statistic, and the jackknife+ for a prediction interval that wastes no data. Through every one runs the same discipline: separate the world's irreducible noise from what more data could still teach you, match the interval to the decision, and report a number without false precision.
