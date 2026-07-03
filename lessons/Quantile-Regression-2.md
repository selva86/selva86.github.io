---
title: "Advanced Regression Lesson 3: Quantile Regression"
catalog_blurb: "Predict the median and the tails, not just the average, when spread changes."
description: "A gentle, from-scratch guide to quantile regression in R: why the mean line hides the spread, what a percentile line means, the check loss that fits it, and rq()."
keywords: "quantile regression, rq, quantreg, check loss, pinball loss, conditional quantile, heteroskedasticity, prediction interval, median regression, R"
post_type: "LESSON"
curriculum_id: "6.130.3"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-reg-glm-expert"
course_title: "Advanced Regression and GLMs"
course_lesson: "3"
course_total: "13"
course_landing: "R-Advanced-Regression-Course.html"
course_next: "Ridge-Regression-and-Shrinkage.html"
course_prev: "Robust-Regression-MM-and-Breakdown.html"
---

=== step === cover
::eyebrow Lesson 3 of 13
## Quantile Regression

Every regression you have fit so far draws one line through the **middle** of the data. `lm()` finds the average outcome at each x, and even the robust methods from the last two lessons still aim at a single typical value. Often the middle is exactly what you want. Sometimes it hides the thing you actually need to know.

Picture a compensation analyst with a 300-person salary survey: annual income against years of experience. Among people two years in, salaries sit tightly around **$57k**. Among 18-year veterans, they scatter from about **$70k to over $150k**. She has three real questions, and one average line cannot answer any of them: what is a *fair floor* for a senior hire, what is a *competitive top* offer, and *how much does the pay range widen* as people gain experience?

Quantile regression answers all three, by fitting a line to the low end, the middle, and the high end separately. Drag the percentile control below and watch the lines **fan apart** as experience grows, the exact shape a single average line can never show.

By the end of this lesson you will be able to:

- Say why one average line hides the story when the spread grows with x
- Read a percentile off your data, and picture what a "line fit to the 90th percentile" even means
- Understand the one small twist (the check loss) that turns a mean-fitter into a percentile-fitter
- Fit every percentile at once in R with `rq()`, read the fanning slopes, and turn them into an offer band

**Prerequisites:** you can fit a line with `lm()` and you know a residual is the gap between the actual value and the line's prediction. That is all. Every new idea is built up from there.

::widget quantile-lines {}

=== step === concept
::eyebrow The problem
## One line cannot show a widening spread

Let us build the analyst's survey so the problem is in front of us. Income rises with experience, but here is the key twist we build in on purpose: the **spread** of income rises too. Junior salaries are packed close together; senior salaries are all over the map.

```r
set.seed(1)
n <- 300
experience <- round(runif(n, 1, 20), 1)                                # years on the job
income     <- round(45 + 3.5 * experience + rnorm(n) * (4 + 1.6 * experience), 1)  # $000s
work <- data.frame(experience, income)
head(work, 4)
#>   experience income
#> 1        6.0   72.1
#> 2        8.1   73.0
#> 3       11.9   79.3
#> 4       18.3   78.1
```

Now fit the ordinary average line with `lm()`, and separately measure how far apart salaries are for juniors versus seniors, using the standard deviation (a plain measure of spread: bigger means the numbers are more scattered).

```r
round(coef(lm(income ~ experience, data = work)), 2)   # the single average line
#> (Intercept)  experience
#>       46.66        3.32
sd(work$income[work$experience < 3])    # spread among juniors (under 3 years)
#> [1] 9.64292
sd(work$income[work$experience > 17])   # spread among seniors (over 17 years)
#> [1] 35.98574
```

The average line tells one tidy story: pay starts near **$47k** and climbs about **$3.3k** per year of experience. Useful. But look at the two spreads. Junior salaries sit within about **$9.6k** of each other; senior salaries scatter by nearly **$36k**, almost four times as wide. The average line has a single slope and a single position, so it simply cannot express "the range gets wider on the right." That widening is exactly what the analyst needs, and it is invisible to `lm()`.

[KEY INSIGHT]
When the spread of the outcome changes across the range of x (statisticians call this **heteroskedasticity**, literally "different scatter"), one average line is not wrong, it is just incomplete. It reports the middle and stays silent about the edges, which is where the floor and the top offer live.

=== step === concept
::eyebrow A refresher
## What a percentile is, in plain terms

To describe the edges, we need one idea: the **percentile**. Line up all the values from smallest to largest. The 90th percentile is the value with 90% of the data below it and 10% above. The 50th percentile is the **median**, the middle value, with half below and half above. The 10th percentile has just 10% below it, down near the bottom.

There is nothing more to it than "what value sits at this position in the sorted list." R computes them with `quantile()`. Statisticians write a percentile as a fraction between 0 and 1 and call it \(\tau\) (the Greek letter "tau"): \(\tau = 0.9\) is the 90th percentile, \(\tau = 0.5\) is the median. We will use that shorthand from here, but it never means anything more than "this position in the sorted data."

=== step === concept
::eyebrow The idea
## Percentiles at a given experience level

Here is the move that turns percentiles into something regression can chase. Instead of the percentiles of *all* salaries, look at the percentiles of salary *among people at one experience level*. That is a **conditional quantile**: the percentile of the outcome, given a value of the predictor.

Watch the 10th, 50th and 90th percentile of income, first for juniors, then for seniors.

```r
round(quantile(work$income[work$experience < 3],  c(0.1, 0.5, 0.9)), 1)  # juniors
#>  10%  50%  90%
#> 43.3 57.3 66.5
round(quantile(work$income[work$experience > 17], c(0.1, 0.5, 0.9)), 1)  # seniors
#>   10%   50%   90%
#>  70.9 105.5 158.4
```

Read the two rows side by side. For juniors, the middle 80% of salaries run from **$43k to $67k**, a range of about **$23k**. For seniors, they run from **$71k to $158k**, about **$88k**, nearly four times wider. Those six numbers already answer the analyst's questions, but only at two hand-picked experience levels. **Quantile regression's whole job is to draw a smooth line through each percentile across the entire range of experience at once**, so instead of six numbers we get three lines: a 10th-percentile line, a median line, and a 90th-percentile line.

=== step === concept
::eyebrow The goal, before the how
## What does "a line fit to the 90th percentile" even mean?

Before any formula, get the picture clear. `lm()` draws a line so that the points sit roughly *balanced* above and below it, half on each side. That is the average line.

A 90th-percentile line has a different target: draw it so that about **90% of the points fall below it** and only 10% poke above. Picture sliding the average line upward until only one point in ten is left above it. That raised line is the 90th percentile. The 10th-percentile line is the same idea in reverse: slide down until only one point in ten is below it.

So all we need is a way to *tell the fitting procedure where to aim*: "put 90% below," or "put half below," or "put 10% below." The next step is the one small trick that does exactly that.

=== step === widget
::eyebrow The mechanism
## The trick: penalize too-low and too-high differently

`lm()` fits its line by making the residuals (actual minus predicted) as small as possible, treating a miss above and a miss below as equally bad. Quantile regression keeps almost everything the same but changes that one rule: it penalizes the two kinds of miss **by different amounts**, and that asymmetry is what parks the line at a chosen percentile.

Make it concrete. Suppose we are aiming for the 90th percentile (\(\tau = 0.9\)) and our line predicts $80k for someone who actually earns $95k. The line is **$15k too low** (a residual of +15). We deliberately make that expensive: charge **0.9 for each dollar the line falls short**. Now suppose instead the line predicts $95k for someone who earns $80k, so it is **$15k too high** (a residual of -15). We make that cheap: charge only **0.1 for each dollar it overshoots**.

That 9-to-1 penalty is the whole idea. Because being too low is nine times as costly as being too high, the fitting procedure keeps nudging the line **up** until pushing it further would start costing more than it saves, and that balance point lands where about 10% of points remain above, i.e. the 90th percentile. This asymmetric penalty has a name, the **check loss** (or pinball loss). In R it is one readable line, for a residual `r` and a target percentile `tau`:

```r
check_loss <- function(r, tau) {
  ifelse(r > 0,        # r > 0 means the line is too LOW (actual is above the line)
         tau * r,      #   too low: charge tau per dollar   (0.9 when tau = 0.9)
         (tau - 1) * r) #   too high: charge (1 - tau) per dollar (0.1 when tau = 0.9)
}
check_loss(15, 0.9)    # the line is $15 too low
#> [1] 13.5
check_loss(-15, 0.9)   # the line is $15 too high
#> [1] 1.5
```

Being $15 too low costs **13.5** (that is 0.9 x 15); being $15 too high costs only **1.5** (0.1 x 15). Same size miss, nine times the penalty for landing below. (The `(tau - 1) * r` branch looks odd but works out positive: when `r` is negative, multiplying by the negative `tau - 1` gives a positive cost of `(1 - tau)` times the size of the overshoot.)

For the median (\(\tau = 0.5\)) the two penalties are equal, 0.5 each, so there is no push up or down and the line settles with half the points on each side, exactly the median. Drag the percentile control below and watch the fitted line move as the penalty tilts.

::widget quantile-lines {}

=== step === quiz
::eyebrow Check yourself
## Where does the 90th-percentile line sit?

You fit the \(\tau = 0.9\) line and it lands well **above** the median line. A colleague says: "so it is the line drawn through the highest-paid person at each experience level." Is that the right way to describe it?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Yes, it connects the top earner at each experience level ::no It is not fit to only the top points. Every single row goes into the check loss. The asymmetric penalty simply raises the whole line until the right fraction of points sits below it.
- No, it is the line positioned so that about 90% of ALL the points fall below it, using every row ::ok Right. The check loss looks at all the data. Its 9-to-1 penalty on being-too-low pushes the line up until roughly 90% of points lie below it, not through the top 10% alone.
- No, it is just the median line shifted up by a fixed amount ::no It is not a parallel shift. The 90th-percentile line gets its own slope, and on data whose spread grows it comes out steeper than the median line, so the gap between them widens with x.

=== step === tryit
::eyebrow In R
## Fit a percentile line, first by hand, then with rq()

Let us prove the mechanism is nothing but the check loss. We add up the check loss over every row and ask R to find the intercept and slope that make that total as small as possible, using `optim` (a general-purpose "find the values that minimize this" tool). Aim for the 90th percentile.

```r
total_check_loss <- function(b, tau) {
  prediction <- b[1] + b[2] * work$experience   # b[1] is the intercept, b[2] the slope
  r <- work$income - prediction                 # residual = actual minus predicted
  sum(check_loss(r, tau))                        # add up the asymmetric penalty over all rows
}
round(optim(c(45, 3), total_check_loss, tau = 0.9)$par, 2)   # best intercept, slope
#> [1] 55.48  4.91
```

Minimizing the check loss by hand gives a 90th-percentile line with intercept **55.48** and slope **4.91**. You will almost never write that loop yourself, though. The `quantreg` package does it for you, and its `rq()` function works just like `lm()`, except you also pass the percentile(s) you want in the `tau` argument. Ask for all three at once. Fill in the blank with the three quantiles.

```r
library(quantreg)
fit <- rq(income ~ experience, tau = ____, data = work)
round(coef(fit), 2)
```
::check {"regex":"c\\(\\s*0\\.1\\s*,\\s*0\\.5\\s*,\\s*0\\.9","gate":true,"difficulty":"intermediate","ok":"That fits the 10th, 50th and 90th percentile lines in one call. The tau=0.9 column reads 55.48 / 4.91, the same line your by-hand optim found.","no":"Pass all three percentiles as a vector: tau = c(0.1, 0.5, 0.9)."}
::solution
```r
library(quantreg)
fit <- rq(income ~ experience, tau = c(0.1, 0.5, 0.9), data = work)
round(coef(fit), 2)
#>             tau= 0.1 tau= 0.5 tau= 0.9
#> (Intercept)    35.26     48.6    55.48
#> experience      1.91      3.0     4.91
```

The `tau= 0.9` column is intercept **55.48**, slope **4.91**, exactly the line your `optim` call found by hand. `rq()` is solving that same check-loss problem, just more precisely and for all three percentiles in one call.

=== step === concept
::eyebrow The payoff
## Reading the fan, and answering the question

Look at the three slopes in that output: **1.91** for the 10th percentile, **3.0** for the median, **4.91** for the 90th. The slope is "dollars of income per extra year of experience," so each year adds only about **$1.9k** for the lowest earners but nearly **$4.9k** for the highest. Different slopes mean the three lines are **not parallel**: they spread apart as experience grows. That is the widening spread from the first step, now drawn as three diverging lines.

::widget process-flow {"steps":[{"title":"Pick the percentiles your decision needs","sub":"a floor, the middle, a top: often 0.1, 0.5, 0.9"},{"title":"Fit them together with one rq() call","sub":"pass a vector of tau values; get a line for each"},{"title":"Read how the slopes fan","sub":"non-parallel lines mean the spread changes with x"},{"title":"Turn the lines into a band","sub":"predict a low, middle and high estimate for a new person"}]}

Now the analyst's real question: what income band should she expect for a 15-year hire? Ask the three fitted lines to predict at `experience = 15`.

```r
round(predict(fit, newdata = data.frame(experience = 15)), 1)
#>   tau= 0.1 tau= 0.5 tau= 0.9
#> 1     63.8     93.6    129.2
```

A fair floor is about **$64k** (the 10th percentile), a typical offer is **$94k** (the median), and a competitive top-of-band offer is about **$129k** (the 90th percentile). Three numbers a decision can actually use, none of which the single average line could give her.

=== step === quiz
::eyebrow Check yourself
## What the fanning slopes tell you

Your average (OLS) slope is **3.32**, the 90th-percentile slope is **4.91**, and the 10th-percentile slope is **1.91**. What is the most complete thing you can conclude?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- The top earners simply make more than the bottom earners ::no True, but shallow, and you knew that already. The slopes tell you about how the GAP changes with experience, not just that a gap exists.
- One of the fits must be wrong, since a variable can only have one slope ::no Nothing is wrong. A predictor genuinely can have a different effect at the top of the outcome than at the bottom, and capturing that is the entire reason quantile regression exists.
- The pay range widens with experience: each year adds far more at the top than at the bottom, so the salaries fan out ::ok Exactly. Non-parallel percentile slopes mean the spread of income grows with experience, the structure that the single average slope of 3.32 completely hides.

=== step === concept
::eyebrow A fair comparison
## Isn't an lm() prediction interval enough?

"But `lm()` gives a prediction interval too," you might say, and it does. So let us put them side by side. Ask each method for a central 80% band (from the 10th to the 90th percentile) for a junior (2 years) and a senior (18 years).

```r
ols <- lm(income ~ experience, data = work)
newhire <- data.frame(experience = c(2, 18))
round(predict(ols, newhire, interval = "prediction", level = 0.80), 1)   # lm band
#>     fit  lwr   upr
#> 1  53.3 24.5  82.1
#> 2 106.4 77.6 135.2
round(predict(fit, newdata = newhire), 1)                                # quantile band
#>   tau= 0.1 tau= 0.5 tau= 0.9
#> 1     39.1     54.6     65.3
#> 2     69.6    102.6    143.9
```

The `lm()` interval is **57.6k wide at both experience levels**, because it is built to be one fixed width everywhere. It even puts a junior's floor at **$24.5k**, a salary no one in the survey earns. The quantile band adapts to the data: about **$39k to $65k** for the junior (a realistic 26k range) and **$70k to $144k** for the senior (74k, much wider). One is a straitjacket; the other reads the actual spread.

[KEY INSIGHT]
An `lm()` prediction interval assumes the scatter is the same size everywhere and shaped like a symmetric bell, so it is forced to one width, centered on the mean. Quantile regression assumes none of that: each percentile is fit on its own, so the band can be narrow where the data are tight and wide where they fan out. And because the median fit minimizes absolute error rather than squared error, it barely flinches at one outrageous salary, the same robustness idea from the last two lessons.

=== step === concept
::eyebrow Stay honest
## Where quantile regression breaks

Quantile regression is powerful, not magic. Three honest cautions.

[WARNING]
Because each percentile is fit on its own, the lines can **cross** out where the data thin out, giving the nonsense of a 10th-percentile prediction sitting above the 90th. If you see crossing, you have run out of data in that region, or you need methods that fit the percentiles jointly (non-crossing quantile regression).

- **The tails are data-hungry.** Pinning down the 5th or 95th percentile takes a lot of rows, because only a sliver of the data sits out there to define it. A median fit is stable on a modest sample; a 99th-percentile fit is not.
- **Each percentile is its own model.** There is no single \(R^2\) or one slope to quote; you report a small family of lines. That richness is the point, but it asks a little more of your reader.
- **A percentile is an estimate, not a promise.** The 90th-percentile line means "about 10% came out above this, in the data we fit." Treat it as a well-calibrated guess, not a hard ceiling, especially for people unlike anyone in the survey.

=== step === concept
::eyebrow Go deeper
## References

Four solid places to take this further:

- [Koenker and Hallock (2001), Quantile Regression, Journal of Economic Perspectives](https://doi.org/10.1257/jep.15.4.143) - the friendly, canonical introduction, by the method's originators.
- [Koenker (2017), Quantile Regression 40 Years On, Annual Review of Economics](https://doi.org/10.1146/annurev-economics-063016-103651) - a modern survey of where the method has gone.
- [quantreg vignette (CRAN)](https://cran.r-project.org/web/packages/quantreg/vignettes/rq.pdf) - the documentation for `rq()`, the function you used, with worked examples.
- [Koenker (2005), Quantile Regression, Cambridge University Press](https://doi.org/10.1017/CBO9780511754098) - the definitive text for the full theory behind the check loss.

=== step === complete
## Lesson 3 complete

You started with a single average line that hid a widening fan of salaries. You saw what a percentile is, then a conditional quantile (the percentile of the outcome at a given x), and pictured what it means to fit a line to one. The whole mechanism turned out to be a single change to `lm()`'s rule: the **check loss**, which penalizes being too low and being too high by different amounts so the line lands where you aim it. You minimized it by hand, then let `rq()` fit the 10th, 50th and 90th percentiles at once, read the fanning slopes as a growing spread, and turned them into a floor, a typical, and a top-of-band offer, a band that adapts where a fixed-width `lm()` interval cannot.

Next, Lesson 4: Ridge Regression and Shrinkage. So far every fit has trusted its coefficients exactly as the data reported them. When predictors are many and correlated, that trust makes the estimates wildly unstable, and you will see how deliberately shrinking the coefficients trades a little bias for a large drop in variance.
