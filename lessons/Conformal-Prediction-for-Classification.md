---
title: "Uncertainty Quantification Lesson 3: Conformal Prediction for Classification"
catalog_blurb: "When the model is unsure, predict a set of classes instead of one guess."
description: "Conformal prediction for classification in R: adaptive-width CQR bands, class-conditional coverage, and prediction sets that grow when the model is unsure."
keywords: "conformal prediction classification, prediction sets, conformalized quantile regression, CQR, class-conditional coverage, Mondrian conformal, adaptive prediction sets, distribution-free, uncertainty quantification, R"
post_type: "LESSON"
curriculum_id: "6.210.3"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-uncertainty"
course_title: "Uncertainty Quantification in R"
course_lesson: "3"
course_total: "7"
course_landing: "R-Uncertainty-Course.html"
course_next: "Quantile-and-Distributional-Regression.html"
course_prev: "Split-Conformal-Prediction.html"
---

=== step === cover
::eyebrow Lesson 3 of 7
## Conformal Prediction for Classification

Lesson 2 left Rohan the real-estate agent with a band whose coverage was *guaranteed* but whose width was *rigid*. One fixed half-width, applied to every home, covered 90% of listings overall, yet only about 81% of his big, high-scatter homes and a wasteful 98% of the small ones. A guarantee about the average that quietly fails the very clients who matter most.

This lesson makes conformal prediction **adapt**. First we let the band's width follow the data, so it stretches over the uncertain homes and tightens over the easy ones, rescuing that under-covered subgroup. Then we carry the whole idea across a bridge that surprises most people: to **classification**, where "adapt" means the model returns not one label but a *set* of labels, a set that stays small when it is confident and grows only when it genuinely hesitates.

By the end of this lesson you will be able to:

- Build a conformalized quantile regression (CQR) band whose width adapts to the input, and watch it equalize coverage across subgroups
- Turn a classifier's probabilities into a conformal prediction *set*, and explain exactly why the set grows when the model is unsure
- Measure a set predictor's coverage and average set size, and fix a class that the average is quietly starving (class-conditional, or Mondrian, coverage)

**Prerequisites:** [Lesson 2](Split-Conformal-Prediction.html) (calibration set, nonconformity score, the conformal quantile, and why coverage is marginal not conditional) and [Lesson 1](Prediction-Intervals-You-Can-Trust.html) (prediction intervals and coverage). Basic R: vectors, logical indexing, `sort`, and writing a small function. Every new term is defined as it appears.

::widget conformal-bands {}

=== step === concept
::eyebrow Where we left off
## One width cannot fit every home

Recall the shape of Rohan's market: price climbs with size at roughly \$180 a square foot, but the *scatter* grows with size too, so a 2,500 sq ft home is far less predictable than a 700 sq ft one. Let us rebuild it and run Lesson 2's constant-width band on it once more, to see the failure with our own eyes. Each lesson runs in a fresh R session, so we create the data right here (run this once).

```r
set.seed(5)
N     <- 3000
sqft  <- round(runif(N, 600, 2600))
price <- round(60000 + 180 * sqft + rnorm(N, 0, 18 * sqft))   # spread grows with size
homes <- data.frame(sqft, price)
train <- homes[1:1000, ]      # fit the model
calib <- homes[1001:2000, ]   # measure its misses
test  <- homes[2001:3000, ]   # final coverage check
big   <- test$sqft > 1600     # the large, high-scatter homes
sum(big)
#> [1] 516
```

Now the Lesson 2 recipe exactly: fit a model, score the calibration misses by their absolute residual, take the conformal quantile as one half-width \(\hat q\), and wrap \(\hat y \pm \hat q\) around every home. Watch how a single width lands on the big homes versus the small ones.

```r
fit      <- lm(price ~ sqft, data = train)
resid    <- abs(calib$price - predict(fit, calib))          # nonconformity = |residual|
qc       <- sort(resid)[ceiling((nrow(calib) + 1) * 0.90)]  # ONE fixed half-width
guess    <- predict(fit, test)
in_const <- test$price >= guess - qc & test$price <= guess + qc
round(c(overall = mean(in_const),
        big     = mean(in_const[big]),
        small   = mean(in_const[!big])), 3)
#> overall     big   small
#>   0.884   0.795   0.979
```

There it is again, in cold numbers. The overall coverage is a healthy 88%, but that average is a blend of **79.5%** on the big homes and **97.9%** on the small ones. The one width Rohan can offer is too tight where the market is wild and far too loose where it is calm. The band needs to breathe.

=== step === concept
::eyebrow The fix, part 1
## Let the band read the data: conditional quantiles

The constant width was doomed because it summarized the whole market with a single number. The cure is to let the band's edges *depend on the home*. Instead of predicting the middle price and padding it by a fixed amount, we predict the edges directly with **quantile regression**.

A quantile is just a cut point of a distribution. The \(\tau\)-th conditional quantile, written \(q_\tau(x)\), is the price below which a fraction \(\tau\) of homes of size \(x\) fall. So \(q_{0.05}(x)\) is a low line that only about 5% of homes of that size dip beneath, and \(q_{0.95}(x)\) is a high line that only about 5% rise above. Fit both and you have a raw band, \([\,q_{0.05}(x),\, q_{0.95}(x)\,]\), that is *already* wide where homes scatter and narrow where they do not, because each line is free to have its own slope.

The interactive below shows the idea on a different dataset (income versus experience, where the spread also grows). Toggle the quantiles and watch the 10th, 50th and 90th percentile lines **fan apart**: a single averaged line could never describe that spread, but three quantile lines can.

::widget quantile-lines {}

The lines fanning apart is exactly the adaptivity Rohan needs. But quantile regression alone comes with no coverage guarantee, its 90% is a hope, not a promise. The next step fixes that.

=== step === concept
::eyebrow The fix, part 2
## CQR: conformalize the quantile band

**Conformalized quantile regression** (CQR) keeps the adaptive shape of the quantile band and bolts the Lesson 2 guarantee back on. The trick is to measure, on held-out data, how far each home falls *outside* the raw band, and then pad the band by a single conformal amount so that the promise holds.

The nonconformity score for CQR is how far outside the raw band a home lands, on whichever side it misses:

\[ E_i = \max\bigl\{\, q_{\text{lo}}(x_i) - y_i,\;\; y_i - q_{\text{hi}}(x_i) \,\bigr\} \]

Read it slowly. If the true price \(y_i\) sits *inside* the raw band, both differences are negative and \(E_i\) is negative (a home to spare). If it pokes out the bottom, \(q_{\text{lo}}(x_i) - y_i\) is positive and measures how far below; out the top, \(y_i - q_{\text{hi}}(x_i)\) does the same. Then, exactly as in Lesson 2, we take the conformal quantile of these scores,

\[ \hat q = E_{(k)}, \qquad k = \bigl\lceil (n+1)(1-\alpha) \bigr\rceil, \]

where \(E_{(k)}\) is the \(k\)-th smallest score, \(n\) is the number of calibration homes and \(\alpha = 0.10\) for 90% coverage. Finally we pad *both* quantile lines by \(\hat q\), giving the CQR band \(\bigl[\,q_{\text{lo}}(x) - \hat q,\; q_{\text{hi}}(x) + \hat q\,\bigr]\). Let us fit it. The `quantreg` package fits a quantile line with `rq`.

```r
library(quantreg)
fit_lo <- rq(price ~ sqft, tau = 0.05, data = train)   # the low (5th-percentile) line
fit_hi <- rq(price ~ sqft, tau = 0.95, data = train)   # the high (95th-percentile) line

lo_cal <- predict(fit_lo, calib)
hi_cal <- predict(fit_hi, calib)
E      <- pmax(lo_cal - calib$price, calib$price - hi_cal)   # how far OUTSIDE the raw band
qhat   <- sort(E)[ceiling((nrow(calib) + 1) * 0.90)]         # the conformal pad
round(unname(qhat))
#> [1] 65
```

The pad is only \$65, because the raw 5th/95th band was already close to 90%; conformal just nudges it and, crucially, *certifies* it. Now build the padded band on the fresh test homes and check coverage on the big and small groups separately, the exact split that broke the constant width.

```r
lo_test <- predict(fit_lo, test) - qhat   # widen the low line down by the pad
hi_test <- predict(fit_hi, test) + qhat   # widen the high line up by the pad
in_cqr  <- test$price >= lo_test & test$price <= hi_test
round(c(overall = mean(in_cqr),
        big     = mean(in_cqr[big]),
        small   = mean(in_cqr[!big])), 3)
#> overall     big   small
#>   0.899   0.901   0.897
```

Look at the big and small columns: **90.1%** and **89.7%**, both right on target, where the constant width gave 79.5% and 97.9%. The reason is that the band's width now genuinely differs by home:

```r
round(c(big   = mean((hi_test - lo_test)[big]),
        small = mean((hi_test - lo_test)[!big])))
#>    big  small
#> 128179  64350
```

The big homes get a band nearly twice as wide (\$128k versus \$64k). The band widened itself exactly where the market is uncertain, which is what "adaptive" means.

=== step === tryit
::eyebrow Your turn
## Coverage where it counts

In Lesson 2 the constant-width band covered only **81%** of the big homes, and here the constant width scored 79.5%. CQR was built to rescue exactly that subgroup. `in_cqr` is `TRUE` for every test home whose price landed inside its adaptive CQR band, and `big` flags the large homes. Compute the CQR band's coverage among the big homes alone, then run it.

```r
big_coverage <- ____   # fraction of the BIG homes inside the CQR band
round(big_coverage, 3)
```
::check {"regex":"mean\\(\\s*in_cqr\\s*\\[\\s*big\\s*\\]\\s*\\)","gate":true,"difficulty":"intermediate","ok":"0.901. The subgroup that a single fixed width covered at only 79.5% is now right on the 90% target, because the band widened itself for exactly these homes. Coverage is the mean of a TRUE/FALSE vector, restricted to the big homes: mean(in_cqr[big]).","no":"Coverage is the mean of a TRUE/FALSE vector; restrict it to the big homes by subsetting in_cqr with the big flag: mean(in_cqr[big])."}
::solution
```r
big_coverage <- mean(in_cqr[big])
round(big_coverage, 3)
#> [1] 0.901
```

=== step === quiz
::eyebrow Check yourself
## What did CQR change?

Constant-width split conformal and CQR both delivered about 90% coverage *overall* on Rohan's homes. What did switching to CQR actually buy?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- A higher overall coverage guarantee; CQR promises more than 90% where split conformal promised 90% ::no Both methods target the same 90%, and both hit it overall. CQR does not raise the overall guarantee; it changes *how the coverage is distributed* across different homes.
- A width that adapts to each home, so coverage is near 90% *within* subgroups instead of only on average ::ok Exactly. The constant width gave 79.5% on big homes and 97.9% on small; CQR's per-home width brought both to about 90%. Same marginal promise, far better conditional behaviour.
- A guarantee that no longer needs a held-out calibration set ::no CQR still calibrates on held-out scores exactly as split conformal did; that held-out set is what makes the coverage a guarantee. CQR only changes the *score* (distance outside a quantile band) and therefore the *shape* of the band.

=== step === concept
::eyebrow The bridge
## The same idea, aimed at classification

Step back and notice what CQR really did. The constant width failed because it promised coverage *on average* while starving a subgroup. CQR fixed it by making the band adapt to how uncertain the model was about each home.

[KEY INSIGHT]
The deep principle is: **calibrate where you are unsure.** Give more room exactly where the model hesitates, and coverage stops being a lucky average and starts holding everywhere. Holding it *within groups* rather than only on average has a name, Mondrian (class-conditional) conformal, and we will use it by the end of this lesson.

Now the surprising part. Everything so far has been a numeric interval. But the same machinery, a held-out nonconformity score and a single conformal quantile, works when the answer is not a number at all but a **category**. There, the interval becomes a **set of labels**: instead of forcing one guess, the model returns every label that is plausible, and the set grows precisely when the model is unsure. That is conformal prediction for classification, and it is where the rest of the lesson lives.

=== step === concept
::eyebrow A classification problem
## Rohan's new job: tag each listing by type

Rohan wants to auto-tag every incoming listing as a **condo**, a **townhouse**, or a **detached** house, from just its size and a neighbourhood desirability score (`loc`, from 0 to 10). The three types cluster: condos are small, townhouses mid-sized, detached homes large, but they *overlap*, so a 1,500 sq ft home could honestly be either a big condo or a small townhouse. That overlap is where a single-label guess becomes a lie, and where a prediction set earns its keep.

We build the three overlapping types inline, then split into the same three roles as before: train, calibrate, test.

```r
set.seed(3)
condo <- data.frame(sqft = round(rnorm(700,  950, 312)), loc = round(rnorm(700, 4.5, 2.34), 1), type = "condo")
town  <- data.frame(sqft = round(rnorm(700, 1750, 390)), loc = round(rnorm(700, 5.5, 2.34), 1), type = "townhouse")
det   <- data.frame(sqft = round(rnorm(700, 2650, 442)), loc = round(rnorm(700, 6.8, 2.34), 1), type = "detached")
listings <- rbind(condo, town, det)
listings$sqft <- pmax(400, listings$sqft)
listings$loc  <- pmin(10, pmax(0, listings$loc))
listings$type <- factor(listings$type, levels = c("condo", "townhouse", "detached"))
listings <- listings[sample(nrow(listings)), ]   # shuffle so the three slices stay exchangeable
tr  <- listings[1:700, ]      # train the classifier
cal <- listings[701:1400, ]   # calibrate
tst <- listings[1401:2100, ]  # test
table(tr$type)
#>
#>     condo townhouse  detached
#>       232       232       236
```

Now fit a classifier that outputs a probability for each type. Multinomial logistic regression (the `multinom` function in `nnet`) is the three-class cousin of ordinary logistic regression: for each listing it returns three numbers that sum to 1, its confidence in condo, townhouse and detached.

```r
library(nnet)
clf    <- multinom(type ~ sqft + loc, data = tr, trace = FALSE)   # 3-class logistic
P_cal  <- predict(clf, cal, type = "probs")    # one probability per class, per listing
P_test <- predict(clf, tst, type = "probs")
round(head(P_test, 3), 2)
#>      condo townhouse detached
#> 495   0.96      0.04     0.00
#> 1545  0.00      0.01     0.99
#> 331   0.99      0.01     0.00
```

Each row is a listing; each number is the model's confidence in that type. These first three are easy calls (one class near 1). The interesting listings are the ones split between two types, and those are what a prediction set is for.

=== step === concept
::eyebrow Scoring a classifier
## How little did the model give the truth?

To turn these probabilities into a guaranteed set, we need a nonconformity score, a number that is small when the model was right and confident, and large when it was wrong or unsure. The simplest such score, and the one we will use, is direct: **one minus the probability the model gave the *true* class.**

\[ s_i = 1 - \hat p\bigl(y_i \mid x_i\bigr) \]

Here \(y_i\) is listing \(i\)'s actual type, \(x_i\) is its features, and \(\hat p(y_i \mid x_i)\) is the probability the model assigned to that correct type. If the model gave the true type 0.98, the score is a tiny 0.02: it nailed it. If it gave the true type only 0.30, the score is 0.70: it was badly unsure. Watch it on a single calibration listing before we do all of them.

```r
classes <- c("condo", "townhouse", "detached")
row1    <- P_cal[1, ]                    # the first calibration listing's class probabilities
true1   <- as.character(cal$type[1])     # its actual type
cat("true type:", true1,
    "\nprob the model gave that type:", round(row1[[true1]], 2),
    "\nnonconformity score (1 - that prob):", round(1 - row1[[true1]], 2), "\n")
#> true type: detached
#> prob the model gave that type: 0.62
#> nonconformity score (1 - that prob): 0.38
```

This listing was truly detached, but the model was only 62% sure of that, so its nonconformity score is 0.38, a middling miss. A confident, correct listing would score near 0; a badly confused one near 1.

=== step === concept
::eyebrow The threshold
## From the conformal quantile to a probability cut-off

Now the Lesson 2 move, unchanged. Score every calibration listing, then take the conformal quantile of those scores. That quantile \(\hat q\) answers: "on held-out listings, 90% of the time the model gave the true class at least *how much* probability short of certainty?"

```r
truth  <- as.character(cal$type)
p_true <- P_cal[cbind(1:nrow(cal), match(truth, classes))]   # prob each listing gave ITS OWN class
scores <- 1 - p_true
alpha  <- 0.10
k      <- ceiling((nrow(cal) + 1) * (1 - alpha))
qhat_c <- sort(scores)[k]
threshold <- 1 - qhat_c
round(c(k = k, qhat = qhat_c, threshold = threshold), 3)
#>         k      qhat threshold
#>   631.000     0.690     0.310
```

The conformal quantile of the scores is \(\hat q = 0.69\). Subtract it from 1 and you get a **probability threshold** of 0.31. This flips the score into a simple, beautiful rule for building the set:

\[ C(x) = \bigl\{\, c : \hat p(c \mid x) \ge 1 - \hat q \,\bigr\} \]

In words: **the prediction set is every class the model gave at least 0.31 probability.** A class clears the bar, it is in the set; it does not, it is out. That single threshold, learned from held-out data, is what makes the set's coverage a guarantee.

=== step === concept
::eyebrow Show it
## Watch the set grow

A rule is abstract; let us see it act on two real test listings, a confident one and a torn one. The set is just the classes whose probability clears our 0.31 threshold.

```r
pred_set <- function(prob_row, thr) classes[prob_row >= thr]   # keep every class above the line

round(P_test[which.max(apply(P_test, 1, max)), ], 2)   # the most confident listing
#>     condo townhouse  detached
#>         0         0         1
pred_set(P_test[which.max(apply(P_test, 1, max)), ], threshold)
#> [1] "detached"

round(P_test[which.min(apply(P_test, 1, max)), ], 2)   # the least confident listing
#>     condo townhouse  detached
#>      0.49      0.50      0.01
pred_set(P_test[which.min(apply(P_test, 1, max)), ], threshold)
#> [1] "condo"     "townhouse"
```

There is the whole point of the lesson in six lines. The confident listing (all its mass on detached) gets a **set of one**: `{detached}`, a clean single answer. The torn listing, split 49/50 between condo and townhouse, gets a **set of two**: `{condo, townhouse}`, honestly reporting that it could be either and refusing to fake a decision. The set size *is* the model's uncertainty, made visible.

=== step === concept
::eyebrow Measure it
## Coverage and set size

Two numbers judge a set predictor. **Coverage** is how often the true class is inside the set (it should be at least our 90%). **Average set size** is how big the sets are (smaller is more useful, as long as coverage holds). Compute both on the test listings.

```r
sets    <- lapply(1:nrow(tst), function(i) pred_set(P_test[i, ], threshold))
covered <- mapply(function(i) as.character(tst$type[i]) %in% sets[[i]], 1:nrow(tst))
round(c(coverage = mean(covered), avg_set_size = mean(lengths(sets))), 3)
#>     coverage avg_set_size
#>        0.900        1.217
```

Exactly the 90% we asked for, delivered on fresh listings, with an average set size of just 1.22, so most answers are a single confident label and only a minority hedge. The split makes that concrete:

```r
table(lengths(sets))
#>
#>   1   2
#> 548 152
```

Of 700 test listings, **548 got a single-label answer** and **152 got a two-label set**. No listing needed all three. The method spends its uncertainty budget precisely where the types overlap, and nowhere else.

=== step === tryit
::eyebrow Your turn
## How often did the model hedge?

A size-2 set is the model hedging between two plausible types instead of committing to one. Using `sets` (the list of prediction sets you just built), compute the **fraction of listings that got a size-2 set**, then run it. `lengths(sets)` gives each set's size.

```r
hedge_rate <- ____   # fraction of listings whose set has exactly 2 labels
round(hedge_rate, 3)
```
::check {"regex":"mean\\(\\s*lengths\\(\\s*sets\\s*\\)\\s*==\\s*2\\s*\\)","gate":true,"difficulty":"intermediate","ok":"0.217. About one listing in five sits close enough to a type boundary that the model honestly hedges between two. lengths(sets) == 2 is a TRUE/FALSE vector, and its mean is the fraction that are TRUE: mean(lengths(sets) == 2).","no":"lengths(sets) == 2 gives a TRUE/FALSE vector (was this set size 2 or not); the fraction that are TRUE is its mean: mean(lengths(sets) == 2)."}
::solution
```r
hedge_rate <- mean(lengths(sets) == 2)
round(hedge_rate, 3)
#> [1] 0.217
```

=== step === concept
::eyebrow The familiar trap
## Does 90% hold for every type?

That 90% coverage is an average over all listings, and Lesson 2 taught us the hard way never to trust an average without breaking it apart. The big homes were the subgroup that a marginal guarantee starved before. Here the natural subgroups are the **three types**. Check coverage within each.

```r
round(tapply(covered, tst$type, mean), 3)
#>     condo townhouse  detached
#>     0.926     0.864     0.908
```

The same crack, in a new shape. Condos and detached homes are covered above 90%, but **townhouses, the overlapping middle type, come in at only 86.4%.** The threshold was tuned on the *pooled* scores, and because townhouses are the hardest type to call (they blur into both neighbours), a single global threshold under-serves them. The overall 90% is again an average hiding a subgroup left behind.

=== step === concept
::eyebrow The fix, generalized
## Mondrian: calibrate within each class

This is the promise from the bridge, cashed in. Instead of one threshold from the pooled scores, compute a **separate conformal quantile for each class**, using only that class's calibration listings. This is **class-conditional**, or **Mondrian**, conformal prediction: it guarantees coverage *within* each class, not just on average.

```r
qhat_by_class <- sapply(classes, function(cl) {
  s <- scores[truth == cl]                       # calibration scores for THIS class only
  sort(s)[ceiling((length(s) + 1) * (1 - alpha))]
})
round(qhat_by_class, 3)
#>     condo townhouse  detached
#>     0.581     0.757     0.678
```

Read those numbers: townhouse gets the largest quantile, 0.757, so its threshold (\(1 - \hat q\)) is the *lowest*, meaning classes are admitted into a townhouse-containing set more readily, widening exactly the sets that were starving that class. Now include class \(c\) whenever its probability clears *its own* threshold, and re-check per-class coverage.

```r
thr_by_class <- 1 - qhat_by_class
pred_set_cc  <- function(prob_row) classes[prob_row >= thr_by_class]
sets_cc    <- lapply(1:nrow(tst), function(i) pred_set_cc(P_test[i, ]))
covered_cc <- mapply(function(i) as.character(tst$type[i]) %in% sets_cc[[i]], 1:nrow(tst))
round(tapply(covered_cc, tst$type, mean), 3)
#>     condo townhouse  detached
#>     0.905     0.895     0.896
```

All three types now sit right around 90%, townhouses lifted from 86.4% to **89.5%**. This is the exact same move that CQR made for the big homes, expressed for classes: stop promising an average, and guarantee coverage inside every group. The cost, as always, is slightly larger sets for the hard class, which is simply honesty about where the model struggles.

=== step === quiz
::eyebrow Check yourself
## Sets, sizes, and subgroups

You built a conformal classifier that returned `{condo, townhouse}` for one listing and `{detached}` for another, covered 90% overall, but only 86% of townhouses until you switched to class-conditional thresholds. Which statement is exactly right?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- A two-label set like {condo, townhouse} means the model made an error that a single-label prediction would have avoided ::no A larger set is not an error; it is honesty. The guarantee is that the true class is *inside* the set 90% of the time, and a two-label set is more likely to contain the truth, not less. Forcing one label would hide the genuine ambiguity, not remove it.
- The townhouse shortfall means conformal prediction failed and its guarantee cannot be trusted ::no The marginal guarantee held perfectly: overall coverage was 90%. Per-class shortfall is the *marginal-versus-conditional* gap from Lesson 2, not a broken method, and class-conditional (Mondrian) calibration fixes it on purpose.
- Set size tracks the model's uncertainty, and calibrating a separate threshold per class restores ~90% coverage within each class at the cost of slightly larger sets for the hard class ::ok Exactly. Confident listings get singletons, torn ones grow to two, and Mondrian calibration lifts the starved townhouse class back to target by giving it its own (lower) threshold, paid for in slightly wider sets there.

=== step === concept
::eyebrow Know your tool
## Honest limits, and where to go next

Conformal classification is powerful, but it is not magic, and knowing its edges is what makes you trustworthy with it.

- **Exchangeability is still the load-bearing assumption.** As in Lesson 2, the guarantee holds only if new listings are drawn like the calibration listings. A shift in the market (a new neighbourhood, a new year) can break coverage silently.
- **A set can be empty or full.** If no class clears the threshold, the set is empty (the model is uniformly unsure and refusing to guess); if the classes are near-tied, it can hold all of them. Both are information, not bugs.
- **Adaptivity trades size for fairness.** Class-conditional coverage lifts the weak class by enlarging its sets. There is no free lunch: honesty about a hard class costs a little decisiveness there.
- **The score is a choice.** We used \(1 - \hat p(\text{true class})\) (the LAC, or least-ambiguous-set, method). A popular alternative, **APS (Adaptive Prediction Sets)**, accumulates sorted probabilities instead, trading slightly larger sets for even coverage across easy and hard inputs. The framework is identical; only the score changes.

=== step === concept
::eyebrow Go deeper
## References

- [Romano, Patterson and Candes (2019), Conformalized Quantile Regression, NeurIPS](https://arxiv.org/abs/1905.03222) - the CQR method from the first half of this lesson, with its coverage proof.
- [Sadinle, Lei and Wasserman (2019), Least Ambiguous Set-Valued Classifiers with Bounded Error Levels, JASA](https://arxiv.org/abs/1609.00451) - the exact classification score (\(1 - \hat p\)) and set rule you built here.
- [Romano, Sesia and Candes (2020), Classification with Valid and Adaptive Coverage, NeurIPS](https://arxiv.org/abs/2006.02544) - the APS refinement mentioned above, for adaptive-size prediction sets.
- [Angelopoulos and Bates (2023), A Gentle Introduction to Conformal Prediction](https://arxiv.org/abs/2107.07511) - the modern primer; classification sets and Mondrian coverage worked slowly and in plain language.

=== step === complete
## Lesson 3 complete

You made conformal prediction *adapt*, twice. In regression, conformalized quantile regression replaced one rigid half-width with a band whose edges follow the data, lifting the starved big homes from 79.5% to 90% coverage while keeping the distribution-free guarantee. Then you carried the same held-out-score-and-quantile machinery across to classification, where the interval becomes a **prediction set**: score each listing by \(1 - \hat p(\text{true class})\), take the conformal quantile, and keep every class above the resulting threshold. Confident listings got clean singletons, genuinely ambiguous ones grew to two-label sets, and coverage held at 90% overall. Finally you met the marginal-versus-conditional gap once more, and closed it with **class-conditional (Mondrian)** calibration, a private threshold per class that rescued the under-covered townhouses.

Next, Lesson 4: Quantile and Distributional Regression. You leaned on quantile regression here as a tool; now you will study it in its own right, fitting conditional quantiles directly by minimizing the pinball loss, to model not just the average outcome but its whole spread, the natural next step in describing uncertainty honestly.
