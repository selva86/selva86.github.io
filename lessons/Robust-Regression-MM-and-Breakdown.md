---
title: "Advanced Regression Lesson 2: MM-Estimation and the Breakdown Point"
catalog_blurb: "How to fit a regression you can trust when many rows are bad."
description: "A batch of bad high-leverage rows can fool Huber and break an M-estimator. Learn what the breakdown point means, then fit MM-estimators in R with rlm and lmrob."
keywords: "robust regression, MM-estimation, breakdown point, S-estimator, high leverage, lmrob, robustbase, rlm, MASS, Huber, masking, outliers, R"
post_type: "LESSON"
curriculum_id: "6.130.2"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-reg-glm-expert"
course_title: "Advanced Regression and GLMs"
course_lesson: "2"
course_total: "13"
course_landing: "R-Advanced-Regression-Course.html"
course_next: "Quantile-Regression.html"
course_prev: "Robust-Regression-M-Estimators.html"
---

=== step === cover
::eyebrow Lesson 2 of 13
## MM-Estimation and the Breakdown Point

In Lesson 1, the rental agency had one mistyped rent, and a robust fit shrugged it off. Toggle the buttons below from OLS to Huber and watch the least-squares line snap back off the single bad point. That is the win we are building on.

But it has a blind spot. Lesson 1's outlier sat in the **middle** of the size range, a plain vertical mistake. What happens when the bad rows sit far out along the x-axis, and there are many of them? In this lesson a batch of fraudulent listings will fool not just OLS but Huber and Tukey too, and we will build the estimator that still holds.

By the end of this lesson you will be able to:

- Explain how a bad high-leverage row keeps a small residual and so hides from a residual-based robust fit (masking)
- Define an estimator's breakdown point and say why 50% is the hard ceiling
- Explain how S-estimation reaches that ceiling, and how MM-estimation keeps the robustness while regaining precision
- Fit an MM regression in R with `lmrob()`, read its weights, and know when to reach for it over `rlm()`

**Prerequisites:** Lesson 1, [Robust Regression with M-Estimators](Robust-Regression-M-Estimators.html). You should know what an M-estimator, the Huber and Tukey weights, and `rlm()` are, and be comfortable telling leverage apart from influence.

::widget robust-weights {}

=== step === concept
::eyebrow The new villain
## A bad row that hides in plain sight

Lesson 1's typo was a **vertical** outlier: an ordinary floor area with a wrong rent, sitting well above or below the line in the thick of the data. Its large residual made it easy for Huber to spot.

This lesson's danger is different. A **bad high-leverage point** is unusual in **two** ways at once: its floor area is far from every other listing (high leverage, so it sits at the end of a long see-saw), **and** its rent is off the true trend. Drag the far-right point in the plot below down and away from the line. Notice what the solid "with the point" line does: instead of ignoring the stray point, it **swings to chase it**. And once the line has chased it, look at the point's residual, the vertical gap from the point to the line. It is **small**, because the line came to meet it.

::widget leverage-point {}

That small residual is the whole problem. A robust method that judges a row by its residual will look at this chased-after point and see nothing wrong at all.

=== step === concept
::eyebrow Build the mess
## One fraudulent batch, and OLS flips

Let us make it concrete. The agency's honest data is 24 listings where rent climbs about 11.8 euros per square metre. Then a scammer injects 10 fake "luxury" listings: enormous flats of 150 to 175 square metres (far beyond the honest 30 to 95 range, so high leverage) all priced at a suspicious 700 to 900 euros. Each lesson runs in a fresh R session, so we build the data right here.

```r
set.seed(1)
size <- round(runif(24, 30, 95))                    # 24 honest listings, floor area
rent <- round(250 + 11.8 * size + rnorm(24, 0, 40)) # rent rises ~11.8 euros per sq m
clean <- data.frame(size, rent)

# 10 fraudulent luxury listings: huge flats, all cheaply mispriced
fraud <- data.frame(size = round(runif(10, 150, 175)),
                    rent = round(runif(10, 700, 900)))
listings <- rbind(clean, fraud)                     # 34 rows; 10 of them (29%) are fake

round(coef(lm(rent ~ size, data = clean)), 2)       # the honest trend, for reference
#> (Intercept)        size
#>      209.97       12.39
round(coef(lm(rent ~ size, data = listings)), 2)    # OLS on the contaminated data
#> (Intercept)        size
#>     1031.72       -0.93
```

On the clean data the slope is a healthy **12.39**: bigger flats cost more, as they should. Add the fraud and OLS reports a slope of **-0.93**. Not just wrong in size, wrong in **sign**: least squares now claims that bigger flats are **cheaper**. The 10 high-leverage fakes formed their own little downward trend and OLS, trusting every row equally, followed them off a cliff.

=== step === concept
::eyebrow The hero fails
## Huber cannot save this one

In Lesson 1, Huber's `rlm()` was the fix. Let us point it at exactly the same contaminated data and see.

```r
library(MASS)
round(coef(rlm(rent ~ size, data = listings, psi = psi.huber)), 2)
#> (Intercept)        size
#>     1024.06       -0.93
```

Slope **-0.93**. The robust estimator that rescued us last lesson lands in the same wrong place as plain OLS, sign flip and all. The hero of Lesson 1 walked right past a fraud that makes up nearly a third of the data. To see why, we have to look at what weight it gave those fake rows.

=== step === concept
::eyebrow The mechanism
## Masking: the fraud looks perfectly normal

Recall the M-estimator's rule from Lesson 1: a row's weight depends only on its standardized residual, big residual gets a small weight. So let us read the weights Huber assigned to the 10 fraudulent rows (they are rows 25 through 34).

```r
fit_h <- rlm(rent ~ size, data = listings, psi = psi.huber)
round(fit_h$w[25:34], 2)     # weight given to each of the 10 fake rows
#> [1] 1 1 1 1 1 1 1 1 1 1
```

Every fake row got a weight of **1.00**, full trust. Huber never flagged a single one. This is exactly the trap the far-right point showed you two steps ago, now multiplied by a cluster.

[KEY INSIGHT]
This is **masking**. Because the fraud cluster has high leverage, it dragged the fitted line down onto itself. Sitting on the line, each fake row has a **tiny** residual, and a residual-based estimator judges tiny residuals as excellent fits. The outliers hide behind the very damage they caused. Huber's breakdown point against leverage is essentially 0%, which is precisely the warning Lesson 1 ended on.

=== step === quiz
::eyebrow Check yourself
## Why did Huber miss it?

Huber handed all 10 fraudulent rows a weight of 1.00, the same full trust it gave the honest listings. Why did a robust M-estimator fail to down-weight them?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Because the tuning constant k = 1.345 was set too high; a smaller k would have caught them ::no No value of k helps here. The fraud rows have small residuals, so any residual-based weight, at any k, treats them as good fits. The problem is what the weight looks at, not how it is tuned.
- Because the line was pulled onto the fraud cluster, so each fake row had a small residual, and Huber weights a row only by its residual size ::ok Exactly. This is masking. High leverage lets the cluster tilt the line toward itself, shrinking its own residuals, and a residual-based estimator is then blind to it.
- Because the fraud rows were added after the honest ones, so rlm ran out of iterations before reaching them ::no Row order and iteration count are not the issue. Even fit to convergence, rlm keeps the fraud at full weight because their residuals are small.

=== step === concept
::eyebrow A tempting fix that fails
## Even Tukey cannot escape

You might reach for Tukey's bisquare, which in Lesson 1 **redescended** to a weight of exactly 0 and rejected a gross outlier outright. Surely that rejects the cluster? Try it.

```r
round(coef(rlm(rent ~ size, data = listings, psi = psi.bisquare)), 2)
#> (Intercept)        size
#>     1031.08       -1.01
```

Slope **-1.01**. Just as broken. And the reason is the subtle heart of this whole lesson.

`rlm()` **starts** from the ordinary least-squares fit and then reweights from there. But OLS is already sitting on the fraud. From that starting line the fake rows have small residuals, so Tukey sees nothing to reject, and the iteration settles into the same bad answer. A redescending loss can throw a point out only if it starts far enough away to recognize it as an outlier in the first place.

[WARNING]
The shape of the loss function is not enough. To survive a high-leverage cluster you also need a **starting line that is not already captured by the bad rows**. Fixing that starting point is the entire idea behind the estimators in the rest of this lesson.

=== step === concept
::eyebrow The measuring stick
## The breakdown point

We keep saying an estimator "breaks." Let us make that precise, because it is the number that separates the methods that survive this lesson from the ones that do not.

**Intuition first.** Imagine an adversary who is allowed to replace some fraction of your rows with any values they like. How large a fraction can they control before they can make your estimate say **anything**, including nonsense off at infinity? That tipping fraction is the estimator's limit.

**The definition.** The **breakdown point** \(\varepsilon^*\) of an estimator is the largest fraction of the \(n\) rows that can be replaced by arbitrary values while the estimate still stays bounded (cannot be forced off to \(\pm\infty\)). Below \(\varepsilon^*\) the estimator is safe; at or above it, a determined adversary wins.

For **OLS**, a single bad high-leverage row can send the slope toward infinity, so \(\varepsilon^*_{\text{OLS}} = 1/n\), which shrinks to \(0\) as the data grows. A **monotone M-estimator like Huber** is no better against leverage: masking lets one leverage cluster dominate, so its breakdown against bad leverage points is also essentially \(0\).

**The ceiling.** No estimator can do better than

\[ \varepsilon^* \le \tfrac{1}{2} = 50\%. \]

Why? Once **more than half** the rows are bad, the fraud **is** the majority. The contamination can be arranged to look like a perfectly clean dataset with its own tidy trend, and no procedure on earth can tell which half is the real signal. Fifty percent is a hard wall for everyone.

| Estimator | Breakdown point |
|---|---|
| OLS (least squares) | 0% |
| Huber / Tukey M-estimator, started from OLS, with leverage | ~0% |
| S-estimator and MM-estimator (`lmrob`) | up to 50% |

=== step === quiz
::eyebrow Check yourself
## What does 50% buy you?

An estimator has a breakdown point of 50%. What does that actually guarantee about the fit it returns?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- It stays bounded and can recover the honest trend as long as fewer than half the rows are bad; once half or more are bad, no method can tell the real trend from the fraud ::ok Right. 50% is the best any estimator can achieve, because past a bad majority the contamination can perfectly imitate clean data. Below half, a 50%-breakdown method holds.
- It will return the correct line even if 50% or more of the rows are contaminated ::no 50% is a ceiling, not a promise past it. At or above half contamination the fraud can be the indistinguishable majority, and every estimator can be fooled.
- It always discards exactly half of the rows as outliers before fitting ::no Breakdown is not a fixed rejection quota. On clean data a good high-breakdown estimator down-weights almost nothing; 50% is the worst-case contamination it can tolerate, not how much it throws away.

=== step === concept
::eyebrow The robust start
## S-estimation: make the spread small, robustly

Here is the fix for the starting-point problem. OLS chooses the line that makes the residuals' **standard deviation** as small as possible, but the standard deviation is itself wrecked by a single outlier (its own breakdown point is 0). An **S-estimator** (the "S" is for *scale*, another word for spread) keeps the idea, "make the residual spread small," but measures the spread with a **robust** ruler.

Formally, an S-estimator picks the coefficients \(\beta\) that minimize a robust scale \(\hat{s}\) of the residuals:

\[ \hat{\beta}^{S} = \arg\min_{\beta}\; \hat{s}\big(r_1(\beta), \dots, r_n(\beta)\big), \]

where \(r_i(\beta)\) is row \(i\)'s residual for a candidate line \(\beta\), and the robust scale \(\hat{s}\) is defined implicitly by

\[ \frac{1}{n}\sum_{i=1}^{n} \rho\!\left(\frac{r_i}{\hat{s}}\right) = \tfrac{1}{2}, \]

with \(\rho\) (rho) a **bounded** function, scaled so its largest value is 1. Because \(\rho\) is bounded, no single residual, however enormous, can inflate the scale, and the constant \(\tfrac{1}{2}\) on the right is exactly what pins the breakdown point at 50%.

The other half of the trick is **how** it searches. It cannot start from OLS, which is already captured. Instead it draws **many small random subsets** of rows, fits a quick line to each, and keeps the candidate whose robust scale is smallest. Enough random subsets will eventually land on one that is entirely honest, and that subset reveals the true trend. This global search is why an S-estimator escapes the bad local minimum that trapped Tukey.

The catch: an S-estimator is very robust but statistically **inefficient**. On clean data it is noisier than OLS, throwing away precision it did not need to. That is the one thing MM-estimation fixes next.

=== step === widget
::eyebrow Best of both
## MM-estimation: robust start, sharp finish

**MM-estimation** (Yohai, 1987) stitches the two ideas together in a sequence: use an S-estimator to get a starting line and a scale that no leverage cluster can corrupt, then polish it with an efficient M-step that starts from that safe place. Follow the stages below.

::widget process-flow {"steps":[{"title":"Stage 1: a high-breakdown S-estimate","sub":"randomly search many candidate lines and keep the one whose residuals have the smallest robust spread; this ignores up to half the rows, so the fraud cluster cannot capture it"},{"title":"Lock in the robust scale s","sub":"the S-fit also measures how spread out the honest residuals are, giving the yardstick s that later judges every row"},{"title":"Stage 2: an efficient M-refinement","sub":"start from the safe S-line and run Tukey reweighting, tuned to recover about 95% of OLS precision when the data are clean"},{"title":"Result: 50% breakdown AND high efficiency","sub":"robustness comes from stage 1, sharpness from stage 2; you do not have to choose"}]}

The M-step alone (Lesson 1) had the efficiency but no robust start; the S-step alone has the robustness but poor efficiency. MM inherits the 50% breakdown from stage 1 and climbs back to roughly 95% efficiency in stage 2. This two-stage estimator is what R's `lmrob()` computes by default.

=== step === tryit
::eyebrow In R
## Fit an MM-estimator with lmrob

The `lmrob()` function lives in the `robustbase` package and, like `rlm()`, works just like `lm()`, but it runs the full MM procedure for you. We seed first because stage 1's random subset search uses the random number generator, and a seed makes the fit reproducible. Fill in the blank with the MM-estimator's function name.

```r
library(robustbase)
set.seed(1)
fit_mm <- ____(rent ~ size, data = listings)
round(coef(fit_mm), 2)
```
::check {"regex":"lmrob","gate":true,"difficulty":"intermediate","ok":"That is the MM-estimator. It recovers a slope near the honest 12.4 and gives every fraud row a weight of 0.","no":"Use lmrob(), robustbase's MM-estimator: fit_mm <- lmrob(rent ~ size, data = listings)."}
::solution
```r
library(robustbase)
set.seed(1)
fit_mm <- lmrob(rent ~ size, data = listings)
round(coef(fit_mm), 2)
#> (Intercept)        size
#>      211.49       12.38
round(fit_mm$rweights[25:34], 2)   # weight given to each of the 10 fake rows
#> 25 26 27 28 29 30 31 32 33 34
#>  0  0  0  0  0  0  0  0  0  0
```

The MM fit reports a slope of **12.38**, all but identical to the honest **12.39** from the clean data, and it handed every fraudulent row a weight of exactly **0**. Where Huber was masked into giving the fraud full trust, the S-start let MM find the honest majority first and then reject the fakes outright. Notice the weights are also a free **diagnostic**: rows 25 to 34 lighting up at 0 point you straight at the fraudulent listings to investigate.

=== step === concept
::eyebrow Feel the ceiling
## How much bad data can it really take?

The breakdown point is a promise about the worst case. Let us watch it hold, and then watch it give out. This function rebuilds the data with a chosen number of fraudulent rows, then compares OLS against `lmrob`.

```r
contaminate <- function(k) {
  set.seed(1)
  size <- round(runif(30, 30, 95))
  rent <- round(250 + 11.8 * size + rnorm(30, 0, 40))
  if (k > 0) {                                   # overwrite k rows with fraud
    hit <- (30 - k + 1):30
    size[hit] <- round(runif(k, 150, 175))
    rent[hit] <- round(runif(k, 700, 900))
  }
  data.frame(size, rent)
}

for (k in c(0, 6, 12)) {                         # 0%, 20%, 40% contamination
  d <- contaminate(k)
  set.seed(7)
  ols <- round(coef(lm(rent ~ size, data = d))[2], 2)
  mm  <- round(coef(lmrob(rent ~ size, data = d))[2], 2)
  cat(sprintf("%2.0f%% bad:  OLS %6.2f   lmrob %6.2f\n", 100 * k / 30, ols, mm))
}
#>  0% bad:  OLS  11.76   lmrob  11.89
#> 20% bad:  OLS  -0.01   lmrob  11.72
#> 40% bad:  OLS  -1.08   lmrob  11.97
```

Read the two columns. OLS is already dead at **20%** contamination (slope near 0) and stays wrong. `lmrob` holds the honest slope near **11.8** all the way through **40%** bad data, just as its 50% breakdown point promises. Push past half, though, and even `lmrob` must follow the majority, because at that point the fraud is no longer distinguishable from a real trend. High breakdown is a large safety margin, not a magic wand.

=== step === quiz
::eyebrow Check yourself
## rlm or lmrob?

On clean data with a single vertical outlier, both `rlm()` with Huber and `lmrob()` recover the honest slope. Given that, when is `lmrob()` the clearly safer choice?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- When bad rows may also be extreme in x (high leverage), or when a large share of rows could be bad, the cases where a residual-based M-estimator gets masked ::ok Right. Those are exactly the situations that broke Huber and Tukey in this lesson. lmrob's high-breakdown S-start survives them; a plain M-estimator does not.
- Whenever the dataset is large, because lmrob is faster than rlm on many rows ::no Speed is not the reason, and it does not favour lmrob: the S-step's random subset search makes lmrob the more expensive fit, not the cheaper one.
- Never, since rlm and lmrob always return the same coefficients ::no They do not. On this lesson's data rlm gave a slope of -0.93 and lmrob gave 12.38. When leverage and masking are in play they can disagree completely.

=== step === widget
::eyebrow Trust, but verify
## A robust fit still owes you a residual check

MM-estimation defends the coefficients against bad rows. It does **not** relieve you of the ordinary duty of checking the model on the rows it kept. After fitting robustly, still plot the residuals of the honest majority: are they a flat, even band, or do they fan out or bend? Toggle the shapes below to recall what healthy versus troubled residuals look like.

::widget residual-plot {"start":"healthy"}

[WARNING]
Three habits keep an MM fit honest. **Investigate, do not just delete:** a weight-0 row is a flag to go look, and sometimes the "outlier" is the most important real signal. **Report robust standard errors:** `summary(lmrob(...))` gives inference that is not distorted by the rows you down-weighted, so trust its uncertainty, not OLS's. **Mind the small efficiency cost:** on genuinely clean data MM is marginally noisier than OLS, a cheap insurance premium against contamination you cannot rule out.

=== step === concept
::eyebrow Go deeper
## References

Four authoritative places to take this further:

- [Yohai (1987), High Breakdown-Point and High Efficiency Robust Estimates for Regression](https://doi.org/10.1214/aos/1176350366) - the paper that introduced MM-estimation, the method `lmrob` runs.
- [Rousseeuw and Yohai (1984), Robust Regression by Means of S-Estimators](https://doi.org/10.1007/978-1-4615-7821-5_15) - where the high-breakdown S-estimator that seeds MM comes from.
- [robustbase on CRAN](https://cran.r-project.org/package=robustbase) - the package providing `lmrob()`; the reference manual documents the S-step, tuning, and diagnostics.
- [Hampel (1971), A General Qualitative Definition of Robustness](https://doi.org/10.1214/aoms/1177693054) - the paper that introduced the breakdown point, the measuring stick at the heart of this lesson.

=== step === complete
## Lesson 2 complete

You saw a high-leverage fraud cluster fool not only OLS but Huber and even redescending Tukey, because masking shrinks a bad row's residual and a residual-based estimator is then blind to it. You learned to measure that fragility with the breakdown point, why 50% is the hard ceiling, and how S-estimation reaches it by minimizing a robust scale from a global random search. Then you fit an MM-estimator with `lmrob()`, which pairs that robust start with an efficient finish to recover the honest slope and reject the fraud outright.

Next, Lesson 3: Quantile Regression. Robust regression protects the **mean** trend from bad rows. But sometimes the spread itself is the story, and you want to model the median and the tails directly, especially when the variability grows with x.
