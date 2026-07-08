---
title: "Uncertainty Quantification Lesson 4: Quantile and Distributional Regression"
catalog_blurb: "Model an outcome's whole spread, not just its average, for intervals that adapt."
description: "Quantile and distributional regression in R: fit conditional quantiles with the pinball loss for adaptive prediction intervals, and model the whole distribution."
keywords: "quantile regression, distributional regression, pinball loss, check loss, conditional quantile, rq quantreg, adaptive prediction interval, heteroskedasticity, conditional distribution, uncertainty quantification, R"
post_type: "LESSON"
curriculum_id: "6.210.4"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-uncertainty"
course_title: "Uncertainty Quantification in R"
course_lesson: "4"
course_total: "7"
course_landing: "R-Uncertainty-Course.html"
course_next: "Calibration-Reliability-and-Recalibration.html"
course_prev: "Conformal-Prediction-for-Classification.html"
---

=== step === cover
::eyebrow Lesson 4 of 7
## Quantile and Distributional Regression

In Lesson 3 you *borrowed* quantile regression to price Rohan the real-estate agent's homes: you fit a low line and a high line, used the gap between them as an adaptive band, and then wrapped conformal around it to make the coverage a guarantee. Quantile regression was a supporting actor. Now it takes the lead.

This lesson studies it in its own right, and then pushes past it. First, how one small change to ordinary regression, the **pinball loss**, aims a line at any percentile you like, so a pair of lines becomes a prediction interval whose width breathes with the data. Then the bigger idea the title promises: instead of two or three lines, fit a whole fan of them and you have estimated the *entire distribution* of the outcome at each input, not just its average. That is **distributional regression**, and it lets you read any interval, the spread, or the chance of clearing a threshold, straight off one model.

By the end of this lesson you will be able to:

- Explain how the pinball (check) loss fits a conditional quantile, and why a pair of quantile lines gives a prediction interval whose width adapts to the input
- Fit conditional quantiles in R with `rq()`, build an adaptive 90% band, and measure its coverage where a fixed-width interval failed
- Estimate the whole conditional distribution with a dense grid of quantiles, and read any interval, the conditional spread, or a tail probability off it, while knowing exactly where the method breaks

**Prerequisites:** [Lesson 1](Prediction-Intervals-You-Can-Trust.html) (prediction intervals, coverage, and why one `lm` width under-covers big homes) and [Lessons 2 to 3](Split-Conformal-Prediction.html) (the conformal guarantee, and quantile regression met there as a tool). Basic R: vectors, logical indexing, `lm()`, `data.frame`, and writing a small function. Every new term is defined as it appears.

::widget quantile-lines {}

=== step === concept
::eyebrow Where we left off
## One width, or the whole shape?

Rohan the real-estate agent has the same market as always: price climbs with size at about \$180 a square foot, but the *scatter* grows with size too, so a 2,500 sq ft home is far harder to price than a 700 sq ft one. Lesson 1 showed the damage this does to an ordinary `lm` prediction interval: one pooled width, too tight for the big homes and too loose for the small ones. Let us rebuild the market and see that crack one more time, because fixing it is the whole point of what follows. Each lesson runs in a fresh R session, so we create the data right here (run this once).

```r
set.seed(5)
N     <- 3000
sqft  <- round(runif(N, 600, 2600))
price <- round(60000 + 180 * sqft + rnorm(N, 0, 18 * sqft))   # spread grows with size
homes <- data.frame(sqft, price)
train <- homes[1:2000, ]      # fit the models
test  <- homes[2001:3000, ]   # honest coverage check
big   <- test$sqft > 1600     # the large, high-scatter homes

fit_lm  <- lm(price ~ sqft, data = train)
band_lm <- predict(fit_lm, test, interval = "prediction", level = 0.90)
in_lm   <- test$price >= band_lm[, "lwr"] & test$price <= band_lm[, "upr"]
round(c(overall = mean(in_lm),
        big     = mean(in_lm[big]),
        small   = mean(in_lm[!big])), 3)
#> overall     big   small
#>   0.892   0.810   0.979
```

The same story as Lesson 1, in fresh numbers: 89% overall looks fine, but that average blends **81.0%** on the big homes with **97.9%** on the small ones. The reason is that `lm` builds its interval from a single pooled error size, so it has exactly one width to give, and that width is nearly identical whether the home is small or large:

```r
blm <- predict(fit_lm, data.frame(sqft = c(800, 2400)),
               interval = "prediction", level = 0.90)
round(cbind(blm, width = blm[, "upr"] - blm[, "lwr"]))
#>      fit    lwr    upr  width
#> 1 204684 152953 256416 103463
#> 2 492642 440912 544373 103462
```

About \$103,000 wide for the small home and \$103,000 wide for the big one. That rigidity is the enemy. What Rohan needs is a band that is *narrow* where the market is calm and *wide* where it is wild. To get one, we stop predicting the middle and padding it, and instead predict the **edges** directly.

=== step === concept
::eyebrow The one idea
## Aim a line at a percentile: the pinball loss

Predicting an edge means fitting a line to a **conditional quantile**: the percentile of the outcome *at a given input*. The 95th conditional quantile of price at 2,400 sq ft is the price that only about 5% of 2,400 sq ft homes exceed; the 5th is the price only about 5% dip below. Fit those two and their gap is a 90% band, already wide where homes scatter and narrow where they do not, because each line has its own slope.

How do you fit a line to a percentile rather than the mean? `lm()` treats a miss above the line and a miss below it as equally bad, and the balance point of that even penalty is the mean. Quantile regression changes one rule: it penalizes the two kinds of miss by *different* amounts. Write a row's residual as \(r = y - \hat y\) (actual minus the line's prediction) and pick a target quantile \(\tau\) between 0 and 1. The **pinball loss** (also called the check loss) is

\[ \rho_\tau(r) \;=\; \begin{cases} \tau\, r & \text{if } r \ge 0 \ \text{(line too low)}\\[2pt] (\tau - 1)\, r & \text{if } r < 0 \ \text{(line too high)} \end{cases} \]

and the fitted quantile line is the intercept and slope that make the total penalty as small as possible:

\[ \hat{\beta}_\tau \;=\; \arg\min_{\beta}\; \sum_{i=1}^{n} \rho_\tau\!\left(y_i - x_i^\top \beta\right). \]

Here \(\tau\) is the quantile you are aiming at, \(r\) is one row's residual, \(x_i^\top\beta\) is the line's prediction for row \(i\), and \(\hat{\beta}_\tau\) are the fitted intercept and slope. The idea is easier to trust once you *watch* the asymmetry rather than read it. Let us write the loss and run it on two concrete misses, aiming for the 90th percentile (\(\tau = 0.9\)).

```r
check_loss <- function(r, tau) {
  ifelse(r > 0,          # r > 0: the line sits BELOW the actual price (too low)
         tau * r,        #   too low  -> charge tau per dollar        (0.9 at tau = 0.9)
         (tau - 1) * r)  #   too high -> charge (1 - tau) per dollar  (0.1 at tau = 0.9)
}
check_loss(15,  0.9)     # the line is $15 too LOW
#> [1] 13.5
check_loss(-15, 0.9)     # the line is $15 too HIGH
#> [1] 1.5
```

Same size miss, nine times the penalty for landing below (13.5 versus 1.5). Because being too low is so much more expensive, the fitting procedure keeps pushing the line **up** until only about 10% of points remain above it, which is exactly the 90th percentile. For the median (\(\tau = 0.5\)) the two penalties are equal, so the line settles with half the points on each side. That single asymmetric penalty is the entire engine of quantile regression.

=== step === widget
::eyebrow Feel it
## Watch the percentile lines fan apart

Before we fit Rohan's homes, get the picture in your hands on a second heteroskedastic example: income versus years of experience, where the spread also grows with x (juniors cluster tight, senior salaries range widely). Toggle between the 10th, 50th, and 90th percentile and watch the fitted lines **fan apart** as experience grows. A single averaged line runs through the middle and hides that widening; three quantile lines put it on display. The runnable panel beside the chart fits a quantile line by minimizing the very pinball loss you just met.

::widget quantile-lines {}

The gap between the top line and the bottom line *is* the conditional spread, and here it grows from left to right. That growing gap is precisely the adaptive interval Rohan has been missing. Now let us build it on his homes.

=== step === concept
::eyebrow In R
## Build the adaptive interval with rq()

The `quantreg` package fits a quantile line with `rq()`, which works just like `lm()` except you also pass the percentile you want in `tau`. Fit the low edge (\(\tau = 0.05\)) and the high edge (\(\tau = 0.95\)) on the training homes, then ask both lines to price two very different clients: a small 800 sq ft home and a big 2,400 sq ft one.

```r
library(quantreg)
fit_lo <- rq(price ~ sqft, tau = 0.05, data = train)   # the low edge  (5th percentile)
fit_hi <- rq(price ~ sqft, tau = 0.95, data = train)   # the high edge (95th percentile)

clients <- data.frame(sqft = c(800, 2400))
lo <- predict(fit_lo, clients)
hi <- predict(fit_hi, clients)
data.frame(sqft = clients$sqft, lo = round(lo), hi = round(hi),
           width = round(hi - lo))
#>   sqft     lo     hi  width
#> 1  800 179758 226305  46547
#> 2 2400 423628 567204 143576
```

Look at the last column. The band is about **\$47k** wide for the small home and **\$144k** wide for the big one, roughly three times wider, where `lm` gave nearly the same \$103k to both. Nobody told the model to do this; each edge line simply has its own slope, so the 95th-percentile line climbs faster than the 5th, and the gap between them opens up exactly where the market gets uncertain. That is what "adaptive" means, made concrete.

=== step === quiz
::eyebrow Check yourself
## Why can the band change width?

For Rohan's homes the `lm` 90% band was about \$103k wide for BOTH an 800 and a 2,400 sq ft home, but the quantile band was \$47k for the small home and \$144k for the big one. What lets the quantile band change width when `lm`'s cannot?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The quantile band used more training data, so it estimated the width more precisely ::no Both bands were fit on the exact same 2,000 training homes. The difference is not how much data each saw; it is that one method is allowed a different width per home and the other is not.
- Each percentile line is fit separately with its own slope, so the gap between the 5th and 95th lines can widen with size, while `lm` builds one interval from a single pooled error size ::ok Exactly. `lm` summarizes all the scatter in one number and pads the mean by a fixed amount, forcing one width. The two quantile lines are free to diverge, so the band opens up where the 95th line outruns the 5th.
- `lm` predicted a lower price for the small home, so its band was naturally narrower ::no The point predictions differ, but the WIDTH is what matters here, and `lm`'s width was about \$103k at both ends. A different center does not give `lm` a different width.

=== step === tryit
::eyebrow Your turn
## Coverage where the fixed width failed

Now the real test. In Lesson 1 the `lm` band covered only about 81% of the big homes; the whole reason to fit an adaptive band is to rescue that subgroup. Let us score the quantile band on the held-out test homes. First build it (run this), which flags every test home that landed inside its own 90% band and reports overall coverage.

```r
lo_test <- predict(fit_lo, test)
hi_test <- predict(fit_hi, test)
in_q    <- test$price >= lo_test & test$price <= hi_test   # inside its own band?
round(mean(in_q), 3)                                       # overall coverage
#> [1] 0.898
```

90% overall, on target. But an average can still hide a starved subgroup, so check the big homes alone, the exact group that a fixed width left at 81%. `in_q` is `TRUE` for every covered test home and `big` flags the large ones. Fill in the blank with the coverage among the big homes.

```r
big_coverage <- ____      # coverage among the BIG homes only
round(big_coverage, 3)
```
::check {"regex":"mean\\(\\s*in_q\\s*\\[\\s*big\\s*\\]\\s*\\)","gate":true,"difficulty":"intermediate","ok":"0.89. The subgroup a fixed width covered at only 81% now sits right on target, because the band widened itself for exactly these homes. Coverage is the mean of a TRUE/FALSE vector, restricted to the big homes: mean(in_q[big]).","no":"Coverage is the mean of a TRUE/FALSE vector; restrict it to the big homes by subsetting in_q with the big flag: mean(in_q[big])."}
::solution
```r
big_coverage <- mean(in_q[big])
round(big_coverage, 3)
#> [1] 0.89
```

=== step === concept
::eyebrow The bigger idea
## From a few quantiles to the whole distribution

Two lines gave Rohan a 90% band. But nothing stops him at two. If \(\tau = 0.05\) and \(\tau = 0.95\) are fair game, so are \(\tau = 0.10, 0.15, 0.20, \ldots, 0.90\). Fit a *dense grid* of quantiles and something remarkable happens: the collection of predicted quantiles at a given size *is* an estimate of the entire distribution of price for a home that size, not just its average. This is **distributional regression**: instead of predicting a single number (the mean) or two edges (an interval), you predict a whole conditional distribution.

Why bother? Because once you hold the whole distribution, every question about that home is a lookup, not a new model:

- Want a 90% interval? Read off the 5th and 95th quantiles. An 80% one? The 10th and 90th. Any level, from one fit.
- Want the *spread* at each size? Take the gap between two quantiles as a function of the input.
- Want the chance the home clears \$525k? Count how much of the distribution sits above it.

[KEY INSIGHT]
The mean answers "what is the typical outcome here?" A prediction interval answers "where will this one outcome land?" The whole conditional distribution answers *both of those and every other distributional question at once*, because it describes the full range of what can happen, and how likely each part of that range is.

::widget process-flow {"steps":[{"title":"Pick a grid of quantiles","sub":"the 5th, 10th, 15th, ... up to the 95th percentile"},{"title":"Fit them together in one rq() call","sub":"pass the whole vector of tau values at once"},{"title":"You now hold the conditional distribution","sub":"a predicted quantile at every level, for any home"},{"title":"Read anything off it","sub":"any interval, the spread, or a tail probability"}]}

=== step === concept
::eyebrow Show it
## Read the conditional distribution off the grid

Let us actually estimate the distribution. Fit 19 quantile lines at once, from the 5th to the 95th percentile, by passing the whole vector of levels to `rq()`. Then predict them all for a single 2,400 sq ft home: those 19 numbers are that home's conditional distribution, sorted from its low tail to its high tail.

```r
taus <- seq(0.05, 0.95, by = 0.05)                       # 19 quantile levels
fit_grid  <- rq(price ~ sqft, tau = taus, data = train)
qhat_2400 <- predict(fit_grid, data.frame(sqft = 2400))[1, ]
names(qhat_2400) <- taus
round(qhat_2400)
#>   0.05    0.1   0.15    0.2   0.25    0.3   0.35    0.4   0.45    0.5   0.55
#> 423628 436310 448648 456992 461876 467538 473667 478748 485484 491497 496678
#>    0.6   0.65    0.7   0.75    0.8   0.85    0.9   0.95
#> 503054 509898 516139 522866 529735 538765 550176 567204
```

Read that as a distribution. A 2,400 sq ft home has a median price near \$491k (the \(\tau = 0.5\) entry), most of its mass between \$424k and \$567k (the 5th and 95th), and a right tail that stretches further than its left. Do the same fit for every size and you get a *fan* of 19 lines, tight on the left of the market and splayed wide on the right. That fan is the whole conditional distribution, drawn:

```r
plot(train$sqft, train$price, pch = 19, col = "#c7ccd1", cex = 0.35,
     xlab = "sqft", ylab = "price ($)",
     main = "The conditional distribution: 19 quantile lines")
grid_x <- data.frame(sqft = seq(600, 2600, length.out = 60))
preds  <- predict(fit_grid, grid_x)                      # one column per tau
for (j in seq_along(taus)) lines(grid_x$sqft, preds[, j], col = "#1a73e8", lwd = 0.9)
```

Run it: the quantile lines sit almost on top of each other over the small homes and fan wide open over the big ones. You are seeing, in one picture, that the outcome is not just larger for big homes but genuinely *more uncertain*.

=== step === concept
::eyebrow Read the spread
## The spread itself, as a function of size

Because we hold the whole distribution, the *spread* is no longer a single number for the dataset; it is a curve. Take the gap between the 90th and 10th percentile (a central 80% width) at a small and a large home, and compare.

```r
edges  <- rq(price ~ sqft, tau = c(0.1, 0.9), data = train)
w      <- predict(edges, data.frame(sqft = c(800, 2400)))
spread <- w[, 2] - w[, 1]                                # 90th minus 10th, at each size
round(setNames(spread, c("small_800", "big_2400")))
#> small_800  big_2400
#>     35259    113865
```

The middle 80% of prices spans about \$35k for an 800 sq ft home and about \$114k for a 2,400 sq ft one, more than three times as wide. This is **heteroskedasticity** (literally "different scatter") measured directly, the exact structure that broke `lm`'s one-size interval back in Lesson 1. Ordinary regression models only how the *mean* moves with size; distributional regression models how the *whole spread* moves with it too.

=== step === tryit
::eyebrow Your turn
## A tail probability, straight from the distribution

Here is a question no mean and no single interval can answer, but the conditional distribution can. Rohan's client with the 2,400 sq ft home asks: "what is the chance it sells for more than \$525,000?" You already hold that home's distribution in `qhat_2400`, the 19 predicted quantiles. Since those levels are evenly spaced, the *fraction of them sitting above \$525,000* estimates the probability the price lands above \$525,000. Fill in the blank.

```r
# qhat_2400 holds the 19 predicted quantiles for a 2,400 sq ft home
p_above <- ____           # approx P(price > 525000 | sqft = 2400)
round(p_above, 3)
```
::check {"regex":"mean\\(\\s*qhat_2400\\s*>\\s*525000\\s*\\)","gate":true,"difficulty":"intermediate","ok":"0.211, about a 1-in-5 chance. Each evenly spaced quantile carries roughly equal probability, so the fraction of the 19 quantiles above $525k estimates P(price > 525k). That is mean(qhat_2400 > 525000): the mean of a TRUE/FALSE vector.","no":"qhat_2400 > 525000 gives a TRUE/FALSE vector (is this quantile above the threshold). Its mean is the fraction that are TRUE, which estimates the probability: mean(qhat_2400 > 525000)."}
::solution
```r
p_above <- mean(qhat_2400 > 525000)
round(p_above, 3)
#> [1] 0.211
```

=== step === concept
::eyebrow Stay honest
## Where quantile and distributional regression break

This is powerful, not magic. Three honest limits, and the one that matters most for this course.

[WARNING]
Because each quantile is fit on its own, the lines can **cross** out where the data thin, giving the nonsense of a 10th-percentile prediction above the 90th. If you see crossing, you have run out of data in that region, or you need methods that fit the quantiles jointly (non-crossing quantile regression).

- **The tails are data-hungry.** Pinning down the 1st or 99th percentile takes many rows, because only a sliver of the data lives out there to define it. A median fit is stable on a modest sample; an extreme-tail fit is not, and a dense grid is only as trustworthy as the data behind its outermost lines.
- **Coverage is NOMINAL, not guaranteed.** This is the crucial one. Your 90% band covered 89% of big homes and 91% of small ones, close to target, but that "90%" is a *hope* that holds when the fitted quantile lines are about right and there is enough data. It carries no distribution-free promise. Contrast Lessons 2 and 3, where split conformal *guaranteed* coverage from held-out data whatever the model did.

[KEY INSIGHT]
This is exactly why Lesson 3's CQR wrapped conformal *around* a quantile band: quantile regression supplies the adaptive *shape*, and conformal supplies the finite-sample *guarantee*. Use quantile and distributional regression when you want a rich, adaptive picture of the outcome; add conformal on top when you need coverage you can certify.

=== step === quiz
::eyebrow Check yourself
## Nominal or guaranteed?

Your `rq` 90% band covered 89% of the big homes and 91% of the small ones on the test set, both close to target. A colleague concludes: "great, so quantile regression *guarantees* 90% coverage." Are they right?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- No. That 90% is nominal: it holds when the fitted quantile lines are about right and the data are plentiful, and it can drift off in the tails or under a misspecified model. For a finite-sample guarantee, wrap it in conformal, the CQR of Lesson 3 ::ok Exactly. The pinball loss aims each line at a percentile *within the fitted model*; coverage on genuinely new data is only as good as that fit, with no distribution-free promise. Conformal is what upgrades a good adaptive shape into a certified guarantee.
- Yes. The pinball loss makes the coverage exact by construction ::no The loss parks each line at a percentile of the FITTED model, not of future data. If the linear quantile fit is off, or the tails are thin, real coverage can miss. Hitting 89 to 91% here is the model behaving well, not a guarantee.
- No, because quantile regression can never actually reach 90% coverage; only `lm` can ::no It plainly did reach about 90% here, better balanced than `lm` across subgroups. The issue is not capability; it is the difference between happening to hit the target and being able to guarantee it.

=== step === concept
::eyebrow Go deeper
## References

- [Koenker and Hallock (2001), Quantile Regression, Journal of Economic Perspectives](https://doi.org/10.1257/jep.15.4.143) - the friendly, canonical introduction to the check loss and conditional quantiles, by the method's originator.
- [quantreg vignette (CRAN)](https://cran.r-project.org/web/packages/quantreg/vignettes/rq.pdf) - the documentation for `rq()`, the function you used, with worked examples and the fitting details.
- [Rigby and Stasinopoulos (2005), Generalized Additive Models for Location, Scale and Shape (GAMLSS), JRSS-C](https://doi.org/10.1111/j.1467-9876.2005.00510.x) - the parametric cousin of the dense-grid idea: model the whole distribution by letting its location, scale, and shape each depend on the predictors.
- [Angelopoulos and Bates (2023), A Gentle Introduction to Conformal Prediction](https://arxiv.org/abs/2107.07511) - where the *guarantee* comes from, and how conformal (CQR) upgrades a quantile band's nominal coverage into a finite-sample promise.

=== step === complete
## Lesson 4 complete

You made two moves. First you turned quantile regression into an **adaptive prediction interval**: the pinball loss aims a line at any percentile by penalizing too-low and too-high misses unequally, so a pair of lines becomes a band that is narrow where the market is calm and wide where it is wild, lifting the big-home coverage from 81% back to 90% where a fixed `lm` width could not. Then you went further, to **distributional regression**: a dense grid of quantile lines estimates the whole conditional distribution of the outcome, from which you read any interval, the spread as a function of the input, and a tail probability like the chance a home clears \$525k, all from one fit. And you stayed honest: the coverage is nominal, not guaranteed, which is precisely why Lesson 3 wrapped conformal around it.

Next, Lesson 5: Calibration, Reliability and Recalibration. You have been trusting the probabilities and quantiles a model reports; now you will test whether a predicted "90%" really means 90%, read a reliability diagram, and fix a miscalibrated model with Platt scaling and isotonic regression.
