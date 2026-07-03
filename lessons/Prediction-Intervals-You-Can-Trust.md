---
title: "Uncertainty Quantification Lesson 1: Prediction Intervals You Can Trust"
catalog_blurb: "Why a point prediction needs an honest range you can actually trust."
description: "Why a single point prediction is not enough, what a prediction interval and its coverage really promise, and why lm's textbook interval quietly under-covers."
keywords: "prediction interval, confidence interval, coverage, prediction interval in R, predict lm interval, heteroskedasticity, uncertainty quantification, conformal prediction, R"
post_type: "LESSON"
curriculum_id: "6.210.1"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-uncertainty"
course_title: "Uncertainty Quantification in R"
course_lesson: "1"
course_total: "7"
course_landing: "R-Uncertainty-Course.html"
course_next: "Split-Conformal-Prediction.html"
course_prev: ""
---

=== step === cover
::eyebrow Lesson 1 of 7
## Prediction Intervals You Can Trust

Rohan is a real-estate agent. A client walks in with a 1,500 square foot flat and asks the only question that matters: "What will it sell for?" Rohan's model gives him one number, $329,000. He could say that out loud. He would also be wrong, because almost no flat sells for exactly its predicted price. What the client actually needs is a *range* Rohan can stand behind.

This whole course is about turning a single guess into an honest range: an interval you can promise will contain the truth a stated fraction of the time. It starts here, with the interval your regression already knows how to build, and the quiet way that interval can betray you.

By the end of this lesson you will be able to:

- Tell a confidence interval (about the average) apart from a prediction interval (about one new outcome), and say which one a client needs
- Read a 90% prediction interval out of an `lm` model in R, and say exactly what "90%" promises
- Test whether an interval keeps that promise, and see why the textbook interval under-covers exactly when it matters most

**Prerequisites:** you can fit a line with `lm()` and you know a residual is actual minus predicted ([OLS regression](OLS-Regression-from-Scratch.html), [regression assumptions](Regression-Assumptions-and-Residuals.html)), plus basic R (vectors, `data.frame`). Every new term is defined as it appears.

::widget regression-intervals {}

=== step === concept
::eyebrow The trouble with one number
## A point prediction is a promise you cannot keep

Let us build Rohan's market and watch the problem appear. Each lesson runs in a fresh R session, so we create the data right here (run this once). Price climbs with size at about $180 a square foot, but look closely at the noise: its spread GROWS with size, because big homes vary far more than small ones (renovations, location, a bidding war).

```r
set.seed(1)
n <- 160
sqft  <- round(runif(n, 600, 2600))
price <- round(60000 + 180 * sqft + rnorm(n, 0, 28 * sqft))   # spread grows with sqft
homes <- data.frame(sqft, price)
head(homes, 4)
#>   sqft  price
#> 1 1131 245571
#> 2 1344 296833
#> 3 1746 431874
#> 4 2416 391814
```

Now fit the line and ask it about the client's 1,500 square foot flat:

```r
fit  <- lm(price ~ sqft, data = homes)
flat <- data.frame(sqft = 1500)
round(predict(fit, flat))     # the single-number point prediction
#>      1 
#> 329113 
```

There it is: $329,113. That is the model's best single guess, and it is the model's *average* home at 1,500 square feet. But the client is not selling the average flat. They are selling *one* flat, and one flat lands somewhere in a wide cloud around that average. Quote the single number and Rohan is wrong almost every time. The honest move is to quote a range.

=== step === concept
::eyebrow The honest answer
## A prediction interval comes with a coverage promise

A **prediction interval** is a range built around the prediction so that a genuinely new outcome falls inside it a stated fraction of the time. Write its lower and upper bounds as \([L, U]\). A 90% prediction interval is built to satisfy

\[ P\big(L \le Y_{\text{new}} \le U\big) = 0.90 \]

read out loud: the probability that a brand-new home's actual sale price \(Y_{\text{new}}\) lands between \(L\) and \(U\) is 90%. That "90%" is the interval's **coverage**, and it is a promise: run this on many new homes and about nine in ten should fall inside. You do not derive it by hand, `lm` builds it for you when you ask:

```r
round(predict(fit, flat, interval = "prediction", level = 0.90))
#>      fit    lwr    upr
#> 1 329113 250360 407866
```

So instead of "$329,000", Rohan can say "very likely between $250,000 and $408,000." That range is honest. It is also uncomfortably wide, and the width is not a bug: it is the real spread of what one flat can fetch. A number that hides that spread is not more accurate, only more confident.

[KEY INSIGHT]
A point prediction answers "what is the average outcome here?" A prediction interval answers "where will THIS single outcome actually land, and how sure are we?" Only the second is a promise you can keep.

=== step === widget
::eyebrow Two intervals people mix up
## The mean is not the home

There are TWO intervals you can put around a regression prediction, and confusing them is the most common mistake in this whole topic.

A **confidence interval** captures the uncertainty in the *line itself*, the average price of ALL 1,500 square foot flats. Ask R for it and it is narrow:

```r
round(predict(fit, flat, interval = "confidence", level = 0.90))
#>      fit    lwr    upr
#> 1 329113 322785 335441
```

Only about $6,000 either side. With 160 sales we have pinned the average flat down tightly. A **prediction interval** captures where ONE new home lands, so on top of that it must carry the home-to-home scatter around the average. That is why it was ten times wider ($250k to $408k).

Slide the sample size below. Watch the green **confidence** band collapse onto the line as data piles up (we learn the average ever more precisely), while the orange **prediction** band barely narrows: a single new home always carries its own irreducible noise, no matter how much data you gather.

::widget regression-intervals {}

The formula makes the split explicit. The normal-theory prediction interval for a new home at size \(x_0\) is

\[ \hat y_0 \;\pm\; t_{1-\alpha/2,\,n-2}\; s\sqrt{\,1 + \tfrac{1}{n} + \tfrac{(x_0-\bar x)^2}{S_{xx}}\,} \]

where \(\hat y_0\) is the point prediction, \(s\) is the residual standard deviation (the typical miss), \(t\) is a multiplier from the t-distribution that sets the level, \(n\) is the sample size, \(\bar x\) the mean size, and \(S_{xx}=\sum_i(x_i-\bar x)^2\) the spread of the sizes. The confidence interval is the SAME formula but *without* the \(1\) under the root. That lone \(1\) is the scatter of an individual home, the piece that never shrinks with more data, and the whole reason a prediction interval stays wide.

=== step === quiz
::eyebrow Check yourself
## Which range do you quote the client?

Rohan's client wants to know what THEIR specific 1,500 square foot flat will sell for. Rohan has both intervals in front of him: a confidence interval of $322,785 to $335,441, and a prediction interval of $250,360 to $407,866. Which should he quote, and why?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The confidence interval, $323k to $335k, because it is tighter and more precise ::no That tight band is the uncertainty in the AVERAGE price of all such flats, not where one flat lands. Quote it and Rohan is promising a $13k window when single homes routinely swing by $150k, so it will be wrong most of the time.
- The prediction interval, $250k to $408k, because it is about a single new home and includes the home-to-home scatter ::ok Right. The client is selling one flat, not the average of all flats. Only the prediction interval accounts for the irreducible spread of individual homes, so only it can keep a coverage promise about this sale.
- Either one; at n = 160 they are essentially the same ::no They are not close: $13k wide versus $158k wide. More data shrinks the confidence interval toward the line but barely touches the prediction interval, because a new home's own scatter never goes away.

=== step === concept
::eyebrow The catch
## That formula trusts a bell curve

Look back at the prediction-interval formula. It leans on a single number \(s\), one typical miss for the whole dataset. That is only fair if every home scatters around the line by roughly the same amount, the **equal-variance** (homoskedasticity) assumption behind every regression. Rohan's market breaks it on purpose: we built the noise to grow with size. Let us catch it red-handed by comparing the average miss for small versus large homes.

```r
homes$fitted <- predict(fit)
homes$resid  <- homes$price - homes$fitted
aggregate(abs(resid) ~ I(sqft > 1600), data = homes,
          FUN = function(z) round(mean(z)))
#>   I(sqft > 1600) abs(resid)
#> 1          FALSE      27960
#> 2           TRUE      43765
```

A typical small home misses the line by about $28,000; a typical big home misses by about $44,000, over half again as much. The single pooled \(s\) that `lm` plugs into the interval is just an average of the two. So the interval it builds is too WIDE for small homes and too NARROW for big ones. You can see the fan in the residuals themselves:

```r
plot(homes$sqft, homes$resid, pch = 19, col = "gray50",
     xlab = "sqft", ylab = "residual ($)")
abline(h = 0, lty = 2)      # the scatter widens to the right: a funnel
```

The band that looked so reasonable is quietly the wrong width almost everywhere. The only way to know how badly is to test it.

=== step === widget
::eyebrow The honest test
## Does a 90% interval really cover 90%?

There is exactly one honest way to check an interval: take a pile of fresh homes whose true prices you know, and count how many land inside their own intervals. That fraction is the **empirical coverage**. If the interval is honest, it should come out near 0.90.

::widget process-flow {"steps":[{"title":"Fit","sub":"fit the model on your training homes"},{"title":"Predict","sub":"build the 90% interval for many fresh homes"},{"title":"Check","sub":"mark each fresh home inside or outside its interval"},{"title":"Average","sub":"the fraction inside is the empirical coverage"}]}

Let us run exactly that recipe on 5,000 brand-new homes drawn from the same market:

```r
set.seed(2)
m <- 5000
new_sqft  <- round(runif(m, 600, 2600))
new_price <- round(60000 + 180 * new_sqft + rnorm(m, 0, 28 * new_sqft))

band   <- predict(fit, data.frame(sqft = new_sqft),
                  interval = "prediction", level = 0.90)
inside <- new_price >= band[, "lwr"] & new_price <= band[, "upr"]
mean(inside)                       # overall coverage: we wanted 0.90
#> [1] 0.897
```

0.897. The interval looks like it kept its promise. But an average across all homes can hide a lot. Rohan's clients with the priciest listings are exactly the big homes, so let us mark those out and look at them separately in a moment.

```r
big <- new_sqft > 1600     # TRUE for the larger, pricier homes
sum(big)                   # how many big homes we are about to scrutinise
#> [1] 2530
```

=== step === tryit
::eyebrow Your turn
## Uncover the failure

`inside` is TRUE for every fresh home whose real price fell within its 90% interval, and `big` is TRUE for the larger homes. Rohan sold every client the same "90% confident" range. Compute the coverage among the BIG homes alone, the expensive listings where a miss costs the most. Fill in the blank.

```r
# coverage = fraction inside, but computed only over the big homes
big_coverage <- ____
big_coverage
```
::check {"regex":"mean\\(\\s*inside\\s*\\[\\s*big\\s*\\]\\s*\\)","gate":true,"difficulty":"intermediate","ok":"About 0.82. Only 82% of the pricey homes landed in the interval Rohan sold as 90% confident. For small homes it runs 97% (too wide). One pooled width cannot be right for both.","no":"Coverage is mean() of a TRUE/FALSE vector. You want it only over the big homes: subset inside with the big flag, mean(inside[big])."}
::solution
```r
big_coverage <- mean(inside[big])
big_coverage
#> [1] 0.8213439
```

=== step === quiz
::eyebrow Check yourself
## What went wrong, and what fixes it?

Rohan's 90% interval covered 97% of small homes but only 82% of the big ones, even though it averaged out near 90% overall. What is the cause, and the right fix?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The regression is underfit; adding more predictors would fix the coverage ::no The mean line is fine and the slope is right. The problem is not the prediction, it is the single interval WIDTH. More predictors do not change that one pooled spread is wrong for a market whose scatter varies.
- The equal-variance assumption is broken, so one pooled width is too narrow for high-scatter homes; the fix is a method that does not assume a constant, bell-shaped error ::ok Exactly. Heteroskedastic errors mean no single width fits everyone. You need an interval whose width can adapt, or a distribution-free guarantee that holds whatever the errors look like. That is where the rest of this course goes.
- Just raise the level to 95%; a wider interval will cover everyone ::no That widens BOTH groups, pushing small homes past 99% (even more wasteful) while big homes may still fall short. The issue is one-width-fits-all, not the level you picked.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take prediction intervals further:

- [An Introduction to Statistical Learning, ch. 3 (free PDF)](https://www.statlearning.com/) - its "prediction intervals versus confidence intervals" discussion is the exact distinction this lesson turns on.
- [Penn State STAT 501: Regression Methods](https://online.stat.psu.edu/stat501/) - free lessons that derive the interval you asked `lm` for, with the formula and its assumptions spelled out.
- [R documentation: predict.lm](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/predict.lm.html) - the `interval = "confidence"` versus `"prediction"` argument you used, straight from the source.
- [Angelopoulos and Bates (2023), A Gentle Introduction to Conformal Prediction](https://arxiv.org/abs/2107.07511) - where this course heads next: distribution-free intervals whose coverage holds even when the bell curve does not.

=== step === complete
## Lesson 1 complete

You can now turn a point prediction into an honest range. A **confidence interval** is about the average outcome, narrow and shrinking with data; a **prediction interval** is about one new outcome, wide because it carries the irreducible scatter that never shrinks. You know what its "90%" promises, how to ask `lm` for it, and how to test whether it delivers by measuring empirical coverage on fresh data.

And you saw the crack: when the errors are not the tidy, equal-variance bell the formula assumes, that single interval is the wrong width, under-covering exactly the high-stakes cases. The comfortable overall 90% was an average hiding an 82%.

Next, Lesson 2: Split Conformal Prediction. Instead of trusting a formula's assumptions, you will build an interval whose coverage is guaranteed by the data itself, holding at or above your target no matter what the errors look like, using only a held-out calibration set and a single quantile.
