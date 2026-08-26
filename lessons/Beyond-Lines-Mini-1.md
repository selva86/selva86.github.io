---
title: "Segmented regression: find the breakpoints"
slug: "Beyond-Lines-Mini-1"
description: "Ad spend barely moves sales until some level, then it works hard. Find that threshold in R, put a confidence interval on it, and test that it is real."
keywords: "segmented regression, breakpoint regression, piecewise regression in R, threshold regression, change point, broken line regression, hinge model in R, confidence interval for a breakpoint"
mathjax: true
webr: true
date: "2026-08-26"
post_type: "LESSON"
course_id: "beyond-straight-lines"
course_title: "Beyond Straight Lines"
course_lesson: "1"
course_total: "9"
course_landing: "/dashboard.html"
course_prev: ""
course_next: ""
curriculum_id: "0.0.36"
lesson_access: "windowed"
catalog_blurb: "Find where a relationship changes slope, and how sure you can be."
---

=== step === cover
::eyebrow Beyond Straight Lines
## Segmented regression: find the breakpoints

Let's say you buy the ads for a small online store.

Every month you pick a budget, the ads run, and the sales come in. Spend more and you sell more. Nobody in the building needs a model to tell them that.

Then somebody in a budget meeting asks the question that actually matters. Below some level the money barely moves anything, and above it the money starts working properly. So where is that level? Is it \$600 a month? Is it \$1,500?

"Somewhere around a thousand, we think" is not something a finance team can plan a budget against.

Segmented regression turns that guess into a number. It fits two straight lines instead of one, joined at a threshold it works out from the data itself, and it puts a confidence interval around that threshold so you can say how sure you are.

Today you are going to find one of those thresholds yourself, out of 48 months of trading, and you will do it in three moves.

::widget process-flow {"steps":[{"title":"Assume one bend","sub":"two straight lines joined at a threshold, instead of one line"},{"title":"Score every threshold","sub":"refit at each candidate and keep the error it leaves behind"},{"title":"Take the best, then question it","sub":"resample for an interval, then test that the bend exists at all"}]}

Everything after this is those three moves, done on numbers you run yourself.

=== step === concept
## Four years of ad spend, and the line that looks fine

Here is the store. It has forty eight months of trading behind it, which is four years, and every month carries two numbers: what went out on ads, and what came back in sales.

I built these numbers myself instead of borrowing somebody's spreadsheet, and I put a bend into them on purpose. Below \$1,000 of ad spend in a month, each extra advertising dollar brings back \$1.50 of sales. Above \$1,000, each extra dollar brings back \$8.00. On top of that sits the ordinary month to month wobble that any trading series has.

Knowing the true answer is the whole point of working this way. Every estimate we produce today can be held against \$1,000 and graded.

Press Run.

```r
# Build 48 months of ad spend and sales for one online store
set.seed(11)
ads <- data.frame(spend = round(runif(48, 200, 2600), -1))
ads$sales <- round(18000 + 1.5 * ads$spend +
                     6.5 * pmax(ads$spend - 1000, 0) +
                     rnorm(48, 0, 700), -1)

head(ads, 5)
#>   spend sales
#> 1   870 19360
#> 2   200 18310
#> 3  1430 22810
#> 4   230 17810
#> 5   360 18390
```

The first month put \$870 into ads and sold \$19,360. The third put in \$1,430 and sold \$22,810. There are forty eight rows like that, with the spending running from \$200 in the quietest month up to \$2,490 in the busiest one.

Now do the obvious thing with them and fit one straight line through all 48 months, which is what `lm()` gives you when you hand it a predictor and an outcome.

```r
# Fit one straight line through all 48 months, draw it, and read what it reports
fit_line <- lm(sales ~ spend, data = ads)

plot(sales ~ spend, data = ads, pch = 19, col = "grey35",
     xlab = "Ad spend in the month (dollars)",
     ylab = "Sales in the month (dollars)",
     main = "One straight line through four years")
abline(fit_line, col = "firebrick", lwd = 2)

summary(fit_line)
#> 
#> Call:
#> lm(formula = sales ~ spend, data = ads)
#> 
#> Residuals:
#>     Min      1Q  Median      3Q     Max 
#> -2905.5  -823.0  -121.8   995.7  2533.3 
#> 
#> Coefficients:
#>              Estimate Std. Error t value Pr(>|t|)    
#> (Intercept) 1.512e+04  3.764e+02   40.17   <2e-16 ***
#> spend       5.901e+00  2.909e-01   20.29   <2e-16 ***
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
#> 
#> Residual standard error: 1294 on 46 degrees of freedom
#> Multiple R-squared:  0.8995,	Adjusted R-squared:  0.8973 
#> F-statistic: 411.6 on 1 and 46 DF,  p-value: < 2.2e-16
```

Read the `spend` row first. The estimate is 5.901, so this line believes every extra advertising dollar returns \$5.90 of sales. And it believes that at every level of spending, in the \$200 months and the \$2,490 months alike. The R-squared of 0.8995 says the line accounts for about 90 percent of the variation in sales, and the p-value on `spend` is smaller than 2e-16.

Those are respectable numbers. If you had not seen the code that made the data, you would report them without hesitating.

But \$5.90 is a rate that holds in no month at all. The truth underneath is \$1.50 in the cheap months and \$8.00 in the expensive ones, and the line has averaged straight through the join between them.

[NOTE]
A high R-squared says the fitted line sits close to the points on average. It says nothing about whether the shape is right. A line can sit close to a bend on average and still have the wrong shape at both ends and in the middle.

So the first skill worth having is spotting that from the data alone, without anybody telling you.

=== step === concept
## What the straight line's residuals give away

A residual is the part of a month the line missed. It is the sales that actually came in, minus the sales the line predicted. Plot the residuals against ad spend and you get a picture of where the model is wrong, which is the one thing R-squared never shows you.

Three shapes are worth knowing by sight. Switch between them here.

::widget residual-plot {"start": "curved"}

The one on screen is the curve. Its residuals are not scattered evenly around zero. They sit high at the two ends and low through the middle, which is what a missed bend looks like every single time. Press Healthy fit and the same points spread into a flat, even band, which is what a correctly shaped model leaves behind. The third button holds a funnel, where the spread widens as the fitted value grows. That is a real fault too, but a different one, and not the one in front of us.

Now let's look at the store's own residuals, in dollars.

```r
# Plot the straight line's residuals against ad spend, then average them by band
plot(resid(fit_line) ~ spend, data = ads, pch = 19, col = "grey35",
     xlab = "Ad spend in the month (dollars)",
     ylab = "Residual (actual sales minus fitted sales)",
     main = "What the straight line leaves behind")
abline(h = 0, col = "firebrick", lwd = 2)

band <- cut(ads$spend, breaks = c(0, 800, 1600, 2600),
            labels = c("up to 800", "800 to 1600", "above 1600"))
round(tapply(resid(fit_line), band, mean))
#>   up to 800 800 to 1600  above 1600 
#>         828       -1175         856 
```

The plot bends. To put a number on the bend, the code cuts the months into three bands of ad spend and averages the residual inside each band.

In the cheap band, the months sit \$828 above the line on average. In the middle band, they sit \$1,175 below it. In the expensive band, they are \$856 above it again.

That pattern of high, low, high is not noise. Noise would average out to something near zero in every band, because least squares already forces the residuals to sum to zero overall. A pattern that survives the averaging is structure the model could not catch.

[KEY INSIGHT]
Residuals that run above the line at both ends and below it through the middle are the signature of one slope fitted where the data holds two. A relationship that starts shallow and turns steep sits above any straight line at both ends and below it in the middle. So the pattern is not a quirk of these 48 months. It is the shape underneath, showing through.

=== step === quiz
## Quick check: what is the straight line getting wrong?

The straight line reported an R-squared of 0.8995 and a slope of \$5.90 per advertising dollar, and its residuals came out high, low, high across the three spend bands. What is the problem with the model?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- The slope it found, \$5.90 per advertising dollar, is too high. A smaller slope would sit closer to the months. ::no
- It is fitting one slope where the months hold two, a shallow one at low spend and a steep one at high spend, so it runs under the data at both ends and over it in the middle. ::ok That is it. The trouble is the shape, not the size of the number. No single slope can be right for both halves, so least squares picks one that is wrong for both and spreads the damage evenly.
- The noise in the months is too large for any straight line to fit them well. ::no
- A predictor is missing. Sales depend on something besides ad spend, and the model cannot see it. ::no Look at where the misses fall, not at how big they are. A missing predictor or extra noise would scatter the residuals without a pattern. Here the sign of the miss depends on where you are along the x axis, high then low then high, and that means the shape of the fitted relationship is wrong.

=== step === concept
## Two lines that meet: the hinge column

So the model needs a bend in it. The blunt way to get one is to cut the months in two, fit a line to the cheap months, fit a separate line to the expensive ones, and stop there. That leaves you with two lines that do not meet. There is a vertical jump at the cut, so the model has sales teleporting the moment a budget crosses the threshold.

There is a better way, and it costs one extra column.

Call the threshold c. Next to `spend`, add a column that is zero for every month at or below c, and that counts the dollars above c for every month past it. That column is called the hinge term, and the model reads like this.

\[ \text{sales} = b_0 + b_1 \times \text{spend} + b_2 \times (\text{spend} - c)_{+} \]

The plus subscript in \( (\text{spend} - c)_{+} \) means "this, or zero, whichever is larger". In R it is `pmax(spend - c, 0)`, and nothing more than that.

Now watch what the equation does on each side of the threshold.

- Below c, the hinge column is zero, so the fitted line is \( b_0 + b_1 \times \text{spend} \) and its slope is \( b_1 \).
- Above c, the hinge column equals spend minus c, so the two spend terms combine and the slope becomes \( b_1 + b_2 \).
- At exactly c, the hinge column is zero from both directions, so the two pieces meet with no jump.

That is one equation carrying two slopes, and the hinge column joins them by construction. Here is the column itself, built at a threshold of \$1,000.

```r
# Build the hinge column at a threshold of 1,000 and set it beside the spend
hinge_1000 <- pmax(ads$spend - 1000, 0)

head(data.frame(spend = ads$spend, hinge = hinge_1000), 6)
#>   spend hinge
#> 1   870     0
#> 2   200     0
#> 3  1430   430
#> 4   230     0
#> 5   360     0
#> 6  2490  1490
```

The \$870 month gets a zero, because it never crossed the line. The \$1,430 month gets 430, which is how far past \$1,000 it went. The \$2,490 month gets 1,490.

[KEY INSIGHT]
The hinge column turns a bend into an ordinary linear model. \( b_1 \) is the slope before the threshold, \( b_2 \) is the change in slope at the threshold, and \( b_1 + b_2 \) is the slope after it. Nothing exotic gets fitted, only one more column.

=== step === concept
## Reading the fit at \$1,000: coefficients and residual sum of squares

Let's fit it. Pretend for a moment that somebody walked in and told you the threshold is \$1,000, so all you have to do is put the hinge column into `lm()`.

```r
# Fit the bent model at a threshold of 1,000 and read its three coefficients
fit_1000 <- lm(sales ~ spend + pmax(spend - 1000, 0), data = ads)

round(coef(fit_1000), 2)
#>           (Intercept)                 spend pmax(spend - 1000, 0) 
#>              17875.00                  1.53                  6.63 
```

Say those three numbers out loud, in the store's own units.

- The intercept, 17,875, is the sales the model expects in a month with no ad spend at all.
- The `spend` coefficient, 1.53, is the slope below the threshold. Every advertising dollar under \$1,000 returns about \$1.53 of sales.
- The hinge coefficient, 6.63, is not a slope. It is the change in slope at the join. Add it to 1.53 and you get 8.16, which is what each advertising dollar returns above \$1,000.

Hold those against the \$1.50 and \$8.00 that went into the data, and the fit has recovered both of them.

Now the second number, and everything that follows is built on it. Any fit leaves some sales unexplained. Square each residual, add them all up, and that total is the residual sum of squares.

```r
# Score this threshold by the squared error the fit leaves behind
deviance(fit_1000)
#> [1] 20341475
```

That is twenty million and change. On its own it means nothing, because it is measured in squared dollars and it grows with the number of months you have. It becomes useful the moment you fit a second threshold and put the two scores next to each other.

[NOTE]
`deviance()` on a model from `lm()` returns exactly this sum of squared residuals. It is the quantity least squares minimises, and it is the score we are about to use to judge one candidate threshold against another.

=== step === tryit
## Your turn: which threshold fits better, \$1,000 or \$1,600?

`ads` is still here and so is `fit_1000`. Fit the same bent model with the threshold moved up to \$1,600, then put the two residual sums of squares side by side and see which join the data prefers.

```r
# ads holds the 48 months, and fit_1000 is the bend already fitted at 1,000.
# Fit the same model with the threshold moved to 1,600,
# then print the two residual sums of squares side by side.
# Two lines. Press Check when you have them.
```
::check {"regex": "pmax[(]\\s*spend\\s*-\\s*1600", "gate": true, "difficulty": "beginner", "ok": "Right: 20,341,475 at a threshold of 1,000 against 35,311,053 at 1,600. The join at 1,000 leaves far less of the sales unexplained, so on this data it is the better of the two by a wide margin.", "no": "Copy the fit from a moment ago and change one number: lm(sales ~ spend + pmax(spend - 1600, 0), data = ads). Then compare the two with c(at_1000 = deviance(fit_1000), at_1600 = deviance(fit_1600))."}
::solution
```r
# Fit the same bent model at a threshold of 1,600 and compare the two scores
fit_1600 <- lm(sales ~ spend + pmax(spend - 1600, 0), data = ads)

c(at_1000 = deviance(fit_1000), at_1600 = deviance(fit_1600))
#>  at_1000  at_1600 
#> 20341475 35311053 
```

Putting the join in the wrong place costs you fifteen million squared dollars of unexplained sales. That gap is not a nuisance. It is the signal we are about to use.

=== step === concept
## Trying every threshold there is

Nobody hands you c. In a real store, where the threshold sits is the whole question, and if you already knew it you would not need the model.

What you just ran points the way out. A threshold in the wrong place leaves more sales unexplained than a threshold in the right place. So take every candidate you consider plausible, fit the bent model at each one, keep its residual sum of squares, and look at where the score bottoms out.

Here that is every \$50 from \$500 up to \$2,100, which is 33 candidates and 33 fits.

Both ends of that range are a choice, and so is the spacing. The scan stops short of the cheapest and the most expensive months on purpose, because a candidate parked out at the edge leaves almost no months on one side of the join, and a slope fitted to a handful of months is not one you would report. The \$50 step matters in a different way. It is the resolution of the answer, so this scan can only ever hand back a multiple of fifty.

```r
# Refit the bent model at every candidate threshold and keep the error it leaves
grid <- seq(500, 2100, by = 50)

rss <- sapply(grid, function(c) {
  deviance(lm(sales ~ spend + pmax(spend - c, 0), data = ads))
})

plot(grid, rss / 1e6, type = "b", pch = 19, col = "grey35",
     xlab = "Candidate threshold (dollars of ad spend)",
     ylab = "Residual sum of squares (millions)",
     main = "Every threshold from 500 to 2,100, scored")
abline(v = grid[which.min(rss)], col = "firebrick", lwd = 2)

grid[which.min(rss)]
#> [1] 1050
```

The curve drops steeply, flattens into a trough, and climbs again. Its minimum sits at \$1,050.

Read the shape, not only the winner. Out on the left the model joins its two lines too early, so a stretch of steep months gets forced onto the shallow slope and the error piles up. Out on the right it joins too late, and shallow months get dragged onto the steep one. Somewhere in between, one candidate separates them better than any other, and that candidate is the estimate.

This search is what makes the method segmented regression rather than an `lm()` with a guess buried inside it. The data was built with a bend at \$1,000, and the scan, which was never told that, came back with \$1,050.

=== step === concept
## The bend at \$1,050, and the two slopes it gives

Refit at the winning candidate and read the two slopes off it, because those are what the meeting is actually asking for.

```r
# Refit at the winning threshold and read the slope on each side of it
best_c <- grid[which.min(rss)]
fit_bend <- lm(sales ~ spend + pmax(spend - best_c, 0), data = ads)

slopes <- c(below = coef(fit_bend)[[2]],
            above = coef(fit_bend)[[2]] + coef(fit_bend)[[3]])
round(slopes, 2)
#> below above 
#>  1.82  8.33 
```

That is \$1.82 of sales per advertising dollar below the threshold and \$8.33 above it, which puts the hinge coefficient behind them, the change at the join, at 6.51. The truth underneath was \$1.50 and \$8.00, so both slopes are close. And the shape of the answer is right. Money spent under the threshold barely does anything, while money spent over it works several times harder.

Drawn over the months, the fit looks like this.

```r
# Draw the two fitted segments over the months, with the threshold marked
plot(sales ~ spend, data = ads, pch = 19, col = "grey35",
     xlab = "Ad spend in the month (dollars)",
     ylab = "Sales in the month (dollars)",
     main = "One bend, estimated at 1,050")

spend_seq <- seq(min(ads$spend), max(ads$spend), length.out = 200)
lines(spend_seq, predict(fit_bend, data.frame(spend = spend_seq)),
      col = "firebrick", lwd = 2)
abline(v = best_c, lty = 2, col = "steelblue", lwd = 2)
```

The fitted line bends once, at the dashed marker. Set it against the straight line we started with and you can see what changed. It no longer runs under the cheap months, over the middle ones and under the expensive ones. It follows them.

=== step === quiz
## Quick check: what does the low point of that curve mean?

The scan fitted 33 models, one per candidate threshold, and the curve of residual sums of squares reached its lowest point at \$1,050. What does that low point actually say?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- It is the threshold where the slope changes most sharply, so the bend there is larger than the bend at any other candidate. ::no
- It is the join that leaves the least sales unexplained. Every candidate was fitted and scored the same way, and this one came out with the smallest squared error. ::ok Exactly. The winner is chosen on error left over, not on how dramatic the bend looks. That is why the same rule works whether the two slopes differ by a lot or by a little.
- It is the threshold closest to the average ad spend, which is where a bend is most likely to sit. ::no
- It is the threshold whose segment below the join has the highest R-squared. ::no Only one quantity was compared across the 33 fits, and that is the residual sum of squares of the whole model. Not the size of the slope change, not the position of the candidate in the data, and not the fit of one segment on its own.

=== step === concept
## Would other months have given the same answer?

\$1,050 came out of one particular set of 48 months. Trading is noisy, and had the store lived through a slightly different four years, the scan would have landed somewhere else. The useful question is how far off it could have landed.

You cannot rerun four years. What you can do is build fresh four-year stretches out of the months you already have, by drawing 48 of them at random with replacement, so some months turn up twice and others sit out. Each draw is a plausible alternative history, built entirely out of months the store already lived through. Rerun the whole scan inside each one and you get a breakpoint per history instead of a single number.

Four hundred of those scans means 13,200 model fits, so we need a quicker way to score one threshold.

```r
# A fast version of the same score: residual sum of squares at one threshold
rss_at <- function(c, spend, sales) {
  X <- cbind(1, spend, pmax(spend - c, 0))
  sum(.lm.fit(X, sales)$residuals^2)
}

c(fast = rss_at(1000, ads$spend, ads$sales), slow = deviance(fit_1000))
#>     fast     slow 
#> 20341475 20341475 
```

The three columns of `X` are the intercept, the spend and the hinge, which is exactly the design matrix the formula was building all along. `.lm.fit()` is the bare least squares solver that `lm()` calls underneath, with none of the formula parsing. It gives the same answer to the last dollar, as the comparison shows, and it is fast enough to run thousands of times.

Now for the resampling itself.

```r
# Resample the 48 months 400 times and rerun the whole scan inside each resample
set.seed(21)
psi_boot <- replicate(400, {
  rows <- sample(nrow(ads), replace = TRUE)
  grid[which.min(sapply(grid, rss_at,
                        spend = ads$spend[rows],
                        sales = ads$sales[rows]))]
})

hist(psi_boot,
     breaks = seq(min(psi_boot) - 25, max(psi_boot) + 25, by = 50),
     col = "grey85", border = "white",
     main = "400 resampled four-year histories, 400 breakpoints",
     xlab = "Estimated breakpoint (dollars of ad spend)")
abline(v = best_c, col = "firebrick", lwd = 3)
```

Every bar is the breakpoint that one resampled history produced. The pile sits over the estimate and it is not wide. 373 of the 400 histories landed between \$950 and \$1,100, with a thin tail running out to \$1,350. Some histories say \$950 and a few say \$1,300. None of them say \$600, and none say \$1,900.

That spread is the uncertainty in the threshold, measured rather than guessed at.

=== step === concept
## The interval, and what to say in the meeting

Those 400 numbers answer the question the boss asked. Trim off the lowest 2.5 percent of them and the highest 2.5 percent, and what is left in the middle is a 95 percent confidence interval for the threshold.

```r
# Read the middle 95 percent of the 400 resampled breakpoints
quantile(psi_boot, c(0.025, 0.975))
#>  2.5% 97.5% 
#>   950  1250 
```

The interval runs from \$950 to \$1,250.

So the sentence to take into the meeting is this one: the point where each advertising dollar starts working harder sits at about \$1,050, and the data puts it somewhere between \$950 and \$1,250.

Notice what the interval bought. It covers the true \$1,000, which the point estimate on its own missed by \$50. And it hands the finance team something they can act on: under \$950 there is no argument, over \$1,250 there is no argument, and the zone worth debating is a \$300 band in between.

[TIP]
Report the threshold and its interval together, every time. A bare breakpoint invites the room to treat \$1,050 as exact and start arguing about \$1,040 against \$1,060, when the data cannot tell those two apart.

=== step === tryit
## Your turn: a 90% interval for the threshold

`psi_boot` still holds all 400 resampled breakpoints. Read a 90 percent interval out of them instead of a 95 percent one, and watch which way it moves.

```r
# psi_boot holds 400 breakpoints, one from each resampled four-year history.
# Read the middle 90 percent of them instead of the middle 95 percent.
# One line. Press Check when you have it.
```
::check {"regex": "quantile[(]\\s*psi_boot\\s*,\\s*c[(]\\s*0?\\.05", "gate": true, "difficulty": "beginner", "ok": "Yes: 950 to 1,200, which is 50 dollars tighter at the top than the 95 percent interval. Narrower is not better, though. It is a weaker promise, because a 90 percent interval is allowed to miss the truth twice as often.", "no": "Same function, different cut points: quantile(psi_boot, c(0.05, 0.95)). The middle 90 percent means trimming 5 percent off each end instead of 2.5 percent."}
::solution
```r
# Read the middle 90 percent of the 400 resampled breakpoints
quantile(psi_boot, c(0.05, 0.95))
#>   5%  95% 
#>  950 1200 
```

Both intervals start at \$950, because the resampled breakpoints simply stop there. The top end is what moves, from \$1,250 down to \$1,200. That is the trade every confidence level makes: promise to be right less often, and you get to quote a tighter range.

=== step === concept
## The scan returns a number even when there is no bend

There is a trap sitting under everything so far, and the best way to see it is to walk straight into it.

The scan is a minimiser. Hand it any 48 months and it will fit 33 models, compare 33 scores, and report whichever candidate came out best. It has no way of declining. Even when the sales really are one straight line, one of those 33 will still edge ahead of the others, and the scan will name it and hand it to you.

Here is a second store that proves the point. It has the same spending, but its sales rise \$4.20 per advertising dollar and keep rising at \$4.20 the whole way up. There is no threshold in it, no bend, and nothing to find.

```r
# Build a second store whose sales really are one straight line, then scan it
set.seed(12)
flat <- data.frame(spend = ads$spend)
flat$sales <- round(18000 + 4.2 * flat$spend + rnorm(48, 0, 700), -1)

plot(sales ~ spend, data = flat, pch = 19, col = "grey35",
     xlab = "Ad spend in the month (dollars)",
     ylab = "Sales in the month (dollars)",
     main = "A second store, built with no bend at all")

rss_flat  <- sapply(grid, rss_at, spend = flat$spend, sales = flat$sales)
best_flat <- grid[which.min(rss_flat)]
best_flat
#> [1] 1000
```

It says \$1,000, which is round, clean, meeting-ready and completely meaningless.

Look at what the fit at that threshold actually claims.

```r
# Fit the bend the scan just named and read the slope on each side of it
fit_flat_bend <- lm(sales ~ spend + pmax(spend - best_flat, 0), data = flat)

round(c(below = coef(fit_flat_bend)[[2]],
        above = coef(fit_flat_bend)[[2]] + coef(fit_flat_bend)[[3]]), 2)
#> below above 
#>  4.55  4.07 
```

It claims \$4.55 below the threshold and \$4.07 above it. That is not a shallow slope followed by a steep one. That is the same slope written down twice, with a small gap between the two that came out of the noise.

[WARNING]
A breakpoint estimate is never evidence that a breakpoint exists. The search always returns its best candidate, so before you report a threshold to anybody, you have to settle a separate question first: is there a bend here at all?

=== step === concept
## Is the bend real?

Here is how to settle it, and it is the same move that produces any p-value.

Start by measuring what the bend bought you. Fit one straight line and note its residual sum of squares, then run the scan and note the best bent model's residual sum of squares. The difference between them is the drop, which is the squared error the bend removed.

```r
# Measure how much the scan improves on one straight line, in squared error
drop_of <- function(spend, sales) {
  rss_line <- sum(resid(lm(sales ~ spend))^2)
  rss_line - min(sapply(grid, rss_at, spend = spend, sales = sales))
}

obs_drop <- drop_of(ads$spend, ads$sales)
obs_drop
#> [1] 57122707
```

The drop is 57.1 million squared dollars. That sounds like a lot, but so what? The scan gets 33 attempts and keeps the best one, so it would find some drop in any data at all, the flat store included.

So build the world where there is no bend, and find out what a drop looks like in there. Take the fitted straight line, add fresh noise the same size as that line's own residuals, and you have a series of months that genuinely came from one straight relationship. Run the identical scan on it. Do that 400 times and you have 400 drops that luck alone produced.

```r
# Simulate 400 worlds with no bend at all, and rerun the scan in each one
sigma_line <- summary(fit_line)$sigma

set.seed(31)
drops <- replicate(400, {
  fake_sales <- fitted(fit_line) + rnorm(48, 0, sigma_line)
  drop_of(ads$spend, fake_sales)
})

hist(drops / 1e6, breaks = 30, xlim = c(0, 60),
     col = "grey85", border = "white",
     main = "400 worlds where the relationship never bends",
     xlab = "Drop in residual sum of squares (millions)")
abline(v = obs_drop / 1e6, col = "firebrick", lwd = 3)

c(luck_best = max(drops), store = obs_drop)
#> luck_best     store 
#>  19036040  57122707 
```

The grey pile is what a scan finds when there is nothing to find. It runs from near zero up to 19.0 million, and 19.0 million was the best that luck managed in 400 attempts. The red line is the store, at 57.1 million, three times past the far edge of the pile.

Count how many of the luck-only worlds reached it.

```r
# Count the no-bend worlds that matched or beat the store, as a share of 400
mean(drops >= obs_drop)
#> [1] 0
```

Not one of them did. Zero out of 400 puts the p-value below 1 in 400, so this bend is real.

Now run the identical test on the second store, the one built with no bend in it.

```r
# Run the same test on the second store and read its p-value
fit_flat_line <- lm(sales ~ spend, data = flat)
sigma_flat    <- summary(fit_flat_line)$sigma
obs_drop_flat <- drop_of(flat$spend, flat$sales)

set.seed(41)
drops_flat <- replicate(400, {
  fake_sales <- fitted(fit_flat_line) + rnorm(48, 0, sigma_flat)
  drop_of(flat$spend, fake_sales)
})

mean(drops_flat >= obs_drop_flat)
#> [1] 0.7725
```

The p-value comes back at about 0.77. In roughly 77 percent of the no-bend worlds, luck found a drop as large as the one the flat store's scan reported. The test refuses to call \$1,000 a threshold, and it is right to. A straight line with ordinary noise explains that store perfectly well.

[KEY INSIGHT]
Two different questions, and they need two different answers. Does a bend exist? That is the test above, and it goes first. Where is the bend? That is the scan and its resampled interval, and the answer only means something once the first question has come back yes.

=== step === quiz
## Quick check: what the test settles, and what it does not

The store's drop of 57.1 million beat all 400 no-bend worlds, the best of which reached 19.0 million. What has that established?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- That the threshold sits at \$1,050, since no world without a bend produced anything close to our drop. ::no
- That the slope changes somewhere inside the range of spending we looked at. Where it changes is a separate question, and the resampled interval of \$950 to \$1,250 is what answers that one. ::ok Right. The drop was computed from the best candidate the scan could find anywhere on the grid, so a large drop says a bend exists somewhere. It carries no information about which candidate won.
- That extra ad spend causes sales to climb faster once the budget passes the threshold. ::no
- Nothing, because a comparison against simulated worlds is not a real statistical test. ::no The test asks one question and answers it well: could luck alone, with no bend anywhere, have produced a drop this large? It cannot pin down the location, it cannot establish cause, and simulating the no-bend world is a perfectly ordinary way to get a p-value.

=== step === concept
## The same three answers from the segmented package

Everything so far has been base R on purpose, because a segmented model is worth building by hand once. Day to day you would reach for the `segmented` package, which does all three jobs starting from an ordinary `lm()` you have already fitted.

It is not in the browser's R library, so these blocks are for your own R session. Install it once with `install.packages("segmented")`.

```r-static
# Fit the segmented model: the package searches for the breakpoint itself
library(segmented)

set.seed(1)
fit_seg <- segmented(fit_line, seg.Z = ~ spend, psi = 1500)
summary(fit_seg)
#> 	***Regression Model with Segmented Relationship(s)***
#> 
#> Call: 
#> segmented.lm(obj = fit_line, seg.Z = ~spend, psi = 1500)
#> 
#> Estimated Break-Point(s):
#>                 Est. St.Err
#> psi1.spend 1069.998 54.902
#> 
#> Coefficients of the linear terms:
#>              Estimate Std. Error t value Pr(>|t|)    
#> (Intercept) 1.771e+04  3.331e+02  53.151  < 2e-16 ***
#> spend       1.926e+00  4.968e-01   3.876 0.000349 ***
#> U1.spend    6.470e+00  5.901e-01  10.964       NA    
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
#> 
#> Residual standard error: 669.6 on 44 degrees of freedom
#> Multiple R-Squared: 0.9742,  Adjusted R-squared: 0.9725 
#> 
#> Boot restarting based on 6 samples. Last fit:
#> Convergence attained in 4 iterations (rel. change 4.2701e-06)
```

There are three numbers to read in that output, and you already know all three of them under different names.

- `psi1.spend` is the breakpoint, 1,069.998. That is the same quantity the scan estimated at \$1,050, arrived at by a different route. Rather than scoring a grid, the package starts from the guess in `psi` and moves the breakpoint by iteration until it stops improving. The 1,500 is only where the search begins, not an answer handed to it.
- `spend`, at 1.926, is the slope below the breakpoint, which the hinge fit put at 1.82.
- `U1.spend`, at 6.470, is the change in slope at the breakpoint, which the hinge fit put at 6.51. Add it to 1.926 and the slope above the breakpoint is 8.40.

The p-value column for `U1.spend` prints `NA`, and that is deliberate on the package's part. The usual t-test is not valid for a slope change when the breakpoint underneath it was estimated from the same data, so the package declines to print one.

Next come the interval and the two segment slopes.

```r-static
# Read the confidence interval for the breakpoint and the two segment slopes
confint(fit_seg)
#>            Est. CI(95%).low CI(95%).up
#> psi1.spend 1070     959.349    1180.65

slope(fit_seg)
#> $spend
#>          Est. St.Err. t value CI(95%).l CI(95%).u
#> slope1 1.9256 0.49675  3.8764    0.9245    2.9268
#> slope2 8.3952 0.31852 26.3570    7.7533    9.0371
```

The package puts the breakpoint between \$959 and \$1,181, against the \$950 to \$1,250 the resampling gave. Two different methods tell the same story, and both of them cover the true \$1,000. `slope()` puts the segments at 1.93 below and 8.40 above, next to the 1.82 and 8.33 the hinge fit gave.

Last comes the existence test.

```r-static
# Test whether a breakpoint exists at all, before believing where it is
davies.test(fit_line, seg.Z = ~ spend)
#> 
#> 	Davies' test for a change in the slope
#> 
#> data:  formula = sales ~ spend ,   method = lm 
#> model = gaussian , link = identity  
#> segmented variable = spend
#> 'best' at = 946.67, n.points = 10, p-value = 2.721e-12
#> alternative hypothesis: two.sided
```

`davies.test()` is the packaged form of the simulation you ran by hand. Its null hypothesis is that the slope is constant, and a small p-value rejects that. Here it comes back at 2.7e-12, which agrees with our own zero out of 400 worlds. The value it labels `'best' at` is the candidate its own coarse grid liked most, and it does not have to match `psi`, because this test is about existence and not location.

[TIP]
Run `davies.test()` on the plain `lm()` before you run `segmented()` on it. Doing the two in that order stops you from ever presenting a threshold the data does not support.

=== step === quiz
## Practice: reporting the threshold

The analysis is done and the budget meeting is tomorrow. Which of these write-ups is both true and useful to the person deciding the ad budget?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- The threshold is \$1,050. ::no
- Ad spend works about 4.6 times harder above \$1,050, and the result is statistically significant. ::no
- Each advertising dollar starts working harder at about \$1,050, and the data puts that point somewhere between \$950 and \$1,250. Below it a dollar returns about \$1.80 of sales, above it about \$8.30. A bend this large never came up in 400 simulated runs with no bend in them. ::ok That is the one. It gives the location, the uncertainty in the location, the two slopes in the units the business spends in, and the evidence that a bend exists at all. Somebody can set a budget from that sentence.
- The relationship has a bend in it. We tested it, the p-value came in under 0.05, so the threshold is real. ::no Each of the other three leaves out something the decision needs. A bare threshold hides how uncertain it is. A ratio and a significance verdict hide where the threshold sits and what the two slopes are worth. And a p-value on its own establishes that a bend exists somewhere, never where it is or what it pays.

=== step === tryit
## Practice: how much harder does a dollar work above the threshold?

`fit_bend` is the model fitted at the winning threshold. Its second coefficient is the slope below the join, and its third is the change in slope at the join, not the slope above it. Work out how many times harder an advertising dollar works above the threshold than below it.

```r
# fit_bend is the model fitted at the winning threshold of 1,050.
# coef(fit_bend)[[2]] is the slope below the join.
# coef(fit_bend)[[3]] is the CHANGE in slope at the join.
# Work out the slope above the join, then divide it by the slope below.
# Press Check when you have it.
```
::check {"regex": "(coef[(]\\s*fit_bend|slopes)[\\s\\S]*/", "gate": true, "difficulty": "intermediate", "ok": "Yes, about 4.58. A dollar spent above the threshold returns roughly four and a half times what a dollar below it returns, and that is the number that decides where the next thousand of budget goes.", "no": "The slope above the join is coef(fit_bend)[[2]] + coef(fit_bend)[[3]], because the third coefficient is a change and not a slope. Divide that by coef(fit_bend)[[2]] and round the answer."}
::solution
```r
# Recover both slopes from the fitted bend and divide the upper by the lower
slope_below <- coef(fit_bend)[[2]]
slope_above <- coef(fit_bend)[[2]] + coef(fit_bend)[[3]]

round(slope_above / slope_below, 2)
#> [1] 4.58
```

Forgetting that the hinge coefficient is a change and not a slope is the most common way to misread one of these models. Read 6.51 as the upper slope and you would report a ratio of 3.6 instead of 4.6.

=== step === quiz
## Practice: the second store

A colleague runs the same scan on the second store, the one whose sales rise at a steady \$4.20 per advertising dollar. The scan returns \$1,000, and the existence test comes back at 0.77. What should the report say?

::quiz {"correct": 2, "gate": true, "difficulty": "advanced"}
- Report a threshold of \$1,000, with a note that the evidence behind it is on the weak side. ::no
- Report that there is no evidence of a threshold in this store. The \$1,000 is what the search returns whether or not a bend exists, and the two slopes behind it, 4.55 and 4.07, are one slope written twice. ::ok Exactly right. A p-value of 0.77 says luck produces a drop this size three times in four, so there is nothing here to locate. Reporting the number with a caveat attached still puts a threshold into somebody's budget plan.
- Widen the grid and rerun the scan, since 33 candidates were not enough to find the real threshold. ::no
- Report the \$1,000 and lean on the confidence interval to show how uncertain it is. ::no Once the existence test comes back at 0.77, everything downstream of it is describing a bend that is not there. A confidence interval around a breakpoint assumes a breakpoint exists, a wider grid only gives the search more places to find noise, and a caveat attached to a number still leaves the number in the room.

=== step === concept
## References

- [Estimating regression models with unknown break-points](https://doi.org/10.1002/sim.1545) - Muggeo (2003), Statistics in Medicine 22(19), 3055-3071. The estimator the `segmented` package runs, which reaches the breakpoint by iteration instead of by scoring a grid.
- [segmented: an R package to fit regression models with broken-line relationships](https://cran.r-project.org/doc/Rnews/Rnews_2008-1.pdf) - Muggeo (2008), R News 8(1), 20-25. The package author's own walkthrough, including the existence test and the interval for the breakpoint.
- [Hypothesis testing when a nuisance parameter is present only under the alternative](https://doi.org/10.1093/biomet/74.1.33) - Davies (1987), Biometrika 74(1), 33-43. Why the ordinary t-test on the slope change is not valid when the breakpoint was estimated from the same data.
- [Inference in two-phase regression](https://doi.org/10.1080/01621459.1971.10482337) - Hinkley (1971), Journal of the American Statistical Association 66(336), 736-743. The confidence interval for a breakpoint, derived rather than resampled.
- [Piecewise regression: a tool for identifying ecological thresholds](https://doi.org/10.1890/02-0472) - Toms and Lesperance (2003), Ecology 84(8), 2034-2041. The applied reading, with the grid search and the bootstrap laid out end to end on field data.

=== step === complete
## Quick recap

You started with 48 months and a question from a budget meeting, and you finished with a threshold, an interval around it, and a reason to believe it. Here is the whole method in five lines.

- One straight line hid a bend behind an R-squared of 0.8995. The residuals gave it away: high at both ends of the spending, low through the middle.
- One hinge column, `pmax(spend - c, 0)`, bends an ordinary `lm()` at c and keeps the two segments joined. Its coefficient is the change in slope, not the slope.
- When nobody hands you c, refit at every candidate and keep the one with the smallest residual sum of squares. Here that was \$1,050, against a true \$1,000.
- Resample the months, rerun the whole scan inside each resample, and the spread of the answers is your confidence interval. Here, \$950 to \$1,250.
- The scan returns a threshold even when there is none, so test that a bend exists before you locate it. Our store beat all 400 no-bend worlds. The flat store came back at 0.77 and had nothing worth reporting.

So when the question comes round again, the answer is a sentence rather than a shrug: each advertising dollar starts working harder at about \$1,050, somewhere between \$950 and \$1,250, and below that line a dollar returns \$1.80 while above it a dollar returns \$8.30.

What changes next is the outcome itself. Sales in dollars can take any value a line cares to predict. Things you count cannot, and that is where a straight line goes wrong for a reason that has nothing to do with bends. Well done for getting through this one.
