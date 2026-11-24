---
title: "Additive and Nonparametric Models Lesson 3: Choosing how wiggly is too wiggly"
catalog_blurb: "How a GCV or REML score picks the right amount of smoothing for you."
description: "See how a GAM's penalty trades fit against roughness, and how GCV and REML scores pick its strength on their own, with worked R examples using mgcv."
keywords: "GAM, smoothing parameter, penalized regression, generalized cross validation, GCV, REML, effective degrees of freedom, edf, basis dimension, mgcv, R"
post_type: "LESSON"
curriculum_id: "4.100.3"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "res-additive"
course_title: "Additive and Nonparametric Models"
course_lesson: "3"
course_total: "6"
course_landing: "Additive-and-Nonparametric-Models-Course.html"
course_next: "Estimating-a-Density-Without-Assuming-One"
course_prev: "Generalized-Additive-Models-One-Smooth-at-a-Time"
---

=== step === cover
## Choosing how wiggly is too wiggly

Today let's understand what actually decides how wiggly a fitted curve should be, when that decision is left to a rule instead of your own eye.

Here is the running example for this lesson. A ride-hailing app recorded the pickup wait time, in minutes, for 400 rides spread across one week, against the hour of day each ride happened, 0 to 24. Underneath the noise, the true wait time has a baseline of about 5 minutes, with two real rush-hour bumps, one near 8am and one near 6pm, each adding about 9 minutes, so wait climbs to around 14 minutes right at the two peaks.

Now suppose two people each draw a curve through that scatter by eye. One of them draws something close to a straight, gently rising line. The other draws something that bends sharply around almost every point. Both could defend their choice. Neither has a number to back it up.

The widget below is not drawn from today's 400 rides. It uses its own small built-in example, a wavy curve with noise on top, but the question it lets you play with is exactly the one this lesson is about: how far should a fitted curve be allowed to bend?

::widget spline-smoother {}

Drag the slider all the way to one end, then the other. At one end the fit barely leaves a straight line. At the other it bends enough to chase every little zigzag in the points, including the noise. You have just made, by eye, the same two choices that opened this lesson, and the rest of it is about replacing that guess with a number.

=== step === concept
## Why wiggliness cannot be chosen by eye

Let's see that same tension on the app's own numbers. Here are all 400 rides, with two very different curves fitted through them: one stiff, one wiggly, both chosen to sit at opposite extremes of how much a curve is allowed to bend.

```r
# Fit two very different curves through the same 400 rides, one stiff and one wiggly
library(mgcv)
set.seed(42)
hour <- runif(400, 0, 24)
true <- 5 + 9 * exp(-((hour - 8)^2) / (2 * 1.3^2)) + 9 * exp(-((hour - 18)^2) / (2 * 1.6^2))
wait <- true + rnorm(400, 0, 1.8)
rides <- data.frame(hour, wait)

fit_stiff  <- gam(wait ~ s(hour, k = 20), sp = 100, data = rides)
fit_wiggly <- gam(wait ~ s(hour, k = 20), sp = 1e-5, data = rides)

grid_hour <- seq(0, 24, length.out = 200)
curves <- rbind(
  data.frame(hour = grid_hour, wait = predict(fit_stiff, newdata = data.frame(hour = grid_hour)), curve = "stiff"),
  data.frame(hour = grid_hour, wait = predict(fit_wiggly, newdata = data.frame(hour = grid_hour)), curve = "wiggly"),
  data.frame(hour = grid_hour,
             wait = 5 + 9 * exp(-((grid_hour - 8)^2) / (2 * 1.3^2)) + 9 * exp(-((grid_hour - 18)^2) / (2 * 1.6^2)),
             curve = "true")
)

library(ggplot2)
ggplot(rides, aes(hour, wait)) +
  geom_point(color = "grey60", alpha = 0.45) +
  geom_line(data = curves, aes(hour, wait, color = curve, linetype = curve), linewidth = 1) +
  scale_color_manual(values = c(stiff = "#2b6cb0", wiggly = "#c05621", true = "black")) +
  scale_linetype_manual(values = c(stiff = "solid", wiggly = "solid", true = "dashed"))
```

Look at the stiff, blue curve first. Across the whole 24 hours it only rises from about 6.2 minutes to about 8.3 minutes. At hour 8 it sits near 7.5, and at hour 18 near 8.2, nowhere close to the real 14-minute peaks. It smooths both rush hours away completely, and in exchange it overshoots the quiet stretches instead, reading closer to 8 minutes where the true wait is only about 5.

Now look at the orange, wiggly curve. Between the two rush hours it does not sit still. It rises and dips in small zigzags from ride to ride, tracking individual noisy points rather than the one smooth shape those points actually came from. It still finds both peaks, but it is paying for that by also chasing noise it should be ignoring.

So which one is right? By eye, you could defend either: the stiff one looks calmer, the wiggly one looks like it tries harder to fit the data. That is exactly the problem. Eyeballing a curve gives different people different answers, and neither answer comes with a number attached to say how good it actually is. The next step writes down the number that both curves are secretly being judged against.

=== step === concept
## The penalized objective a GAM actually minimizes

A GAM does not pick its curve by eye. It picks the curve, out of everything the data could support, that makes one specific quantity as small as possible.

\[ \text{RSS}(f) + \lambda \int f''(x)^2\, dx \]

Read it in two pieces. **RSS(f)**, the residual sum of squares, is the fit's distance from the data: take every one of the 400 rides, subtract the curve's own predicted wait time from the ride's actual wait time, square that gap, and add up all 400 squares. The smaller RSS is, the closer the curve passes to the actual points.

The second piece, \( \int f''(x)^2\, dx \), is the curve's **roughness**. \( f''(x) \) is the curve's second derivative, how sharply it is bending at each point along the hour axis. Squaring it and adding it up across the whole range gives one number for how much total curvature the whole fit contains: a straight line scores exactly 0, and a curve that zigzags through every point scores something large.

\( \lambda \) is the **penalty weight** that decides how much that roughness is allowed to cost. Push \( \lambda \) toward infinity and the roughness term dominates, so the fit is forced toward a straight line no matter what RSS says. Set \( \lambda \) to 0 and the roughness term vanishes, so the fit is free to curve as much as it likes to drive RSS down, even if that means interpolating the noise.

Here is that formula on the two fits from the last step: RSS stands in for how well each one tracks the 400 wait times, and a numeric roughness measure, the summed squared second differences of the fitted curve, stands in for the integral.

```r
# Compute RSS and a roughness measure for the stiff and wiggly fits
rss <- function(fit) sum(residuals(fit)^2)
roughness <- function(fit) {
  ord <- order(rides$hour)
  fitted_ordered <- fitted(fit)[ord]
  sum(diff(fitted_ordered, differences = 2)^2)
}

round(c(rss_stiff = rss(fit_stiff), rss_wiggly = rss(fit_wiggly)), 1)
#> rss_stiff rss_wiggly 
#>    5172.8     1218.0 
round(c(roughness_stiff = roughness(fit_stiff), roughness_wiggly = roughness(fit_wiggly)), 4)
#>  roughness_stiff roughness_wiggly 
#>           0.0293          10.7907 
```

Now the trade-off has numbers on it. The stiff fit's roughness, 0.0293, is almost nothing, basically a straight line, but its RSS, 5172.8, is the worst of the two by a wide margin. The wiggly fit flips that completely: its roughness, 10.7907, is about 368 times larger, but its RSS, 1218.0, is the smallest.

Neither fit wins on both counts, and that is exactly the point. Picking the curve with the lowest RSS alone would always hand you the wiggliest fit available, since nothing stops it from chasing every point. Picking the lowest roughness alone would always hand you a straight line. The formula above adds the two together, weighted by \( \lambda \), so the right amount of wiggle is whichever value of \( \lambda \) makes that sum smallest, not whichever extreme wins a single term.

=== step === widget
## Turning the smoothness dial by hand

The widget below is the same one from the cover, back for a hands-on pass at \( \lambda \) itself. Its own slider is labelled basis size k, but here it is standing in for the penalty: sliding it one way does the same job as raising \( \lambda \), stiffening the fit toward a line, and sliding it the other way does the same job as lowering \( \lambda \) toward 0, loosening the fit until it is free to interpolate.

It is still running on its own small built-in example, not today's 400 rides. Its x-axis plays the role hour of day plays here, and its y-axis plays the role wait time does.

::widget spline-smoother {}

Push the slider to its stiffest end and you get something close to last step's stiff fit: low roughness, high RSS. Push it to its most flexible end and you get something close to the wiggly fit: low RSS, high roughness. Somewhere in between sits a fit that neither extreme reached on its own, tracking the curve's real shape without chasing its noise.

You just found that middle ground by hand, by dragging a slider and judging the result with your own eye again. A GAM does not get a slider or an eye. What it has instead is a criterion that searches for that same middle ground on its own, which is exactly what the next step computes.

=== step === concept
## GCV and REML, plotted against the penalty

Before searching for the right \( \lambda \), a GAM needs a ceiling on how wiggly the curve is even allowed to become. That ceiling is called the **basis dimension**, k: it sets how many basis functions the curve is built from, and however small \( \lambda \) gets, the fit can never bend more than k - 1 of those functions allow. Setting k = 20 here gives the curve up to 19 effective bends to spend, plenty of room above the two real rush-hour bumps.

With that ceiling fixed, mgcv can search for the \( \lambda \) that minimizes the penalized objective from two steps back. It does that search by scoring a grid of fixed \( \lambda \) values two different ways: **generalized cross-validation (GCV)**, which estimates how well a fit would predict a wait time it had not seen, built entirely from the training residuals and a correction for how many effective parameters the fit spent; and **REML**, restricted maximum likelihood, which treats \( \lambda \) itself as something to estimate, the same way you would estimate a variance, and scores how well a given \( \lambda \) explains the data once the curve's own coefficients are accounted for. Both scores are computed from the training fit alone.

```r
# Score a grid of fixed penalty values two ways: GCV and REML
library(mgcv)
sp_grid <- 10^seq(-4, 2, length.out = 30)

gcv_scores <- sapply(sp_grid, function(sp) {
  fit <- gam(wait ~ s(hour, k = 20), sp = sp, method = "GCV.Cp", data = rides)
  fit$gcv.ubre
})
reml_scores <- sapply(sp_grid, function(sp) {
  fit <- gam(wait ~ s(hour, k = 20), sp = sp, method = "REML", data = rides)
  fit$gcv.ubre
})

scores <- rbind(
  data.frame(sp = sp_grid, score = gcv_scores, criterion = "GCV"),
  data.frame(sp = sp_grid, score = reml_scores, criterion = "REML")
)
mins <- rbind(
  data.frame(sp = sp_grid[which.min(gcv_scores)], score = min(gcv_scores), criterion = "GCV"),
  data.frame(sp = sp_grid[which.min(reml_scores)], score = min(reml_scores), criterion = "REML")
)

library(ggplot2)
ggplot(scores, aes(sp, score)) +
  geom_line(color = "#2b6cb0") +
  geom_point(data = mins, color = "#c05621", size = 3) +
  scale_x_log10() +
  facet_wrap(~criterion, scales = "free_y")
```

Each panel traces a shallow U: the score is high when \( \lambda \) is tiny (an almost unpenalized, overfit curve), high again when \( \lambda \) is huge (an almost straight line), and lowest somewhere in between. The orange point marks each one's own minimum.

Now fit the same curve without fixing \( \lambda \) at all, and let mgcv search for it under each criterion on its own.

```r
# Let mgcv search for its own penalty under each criterion
fit_gcv  <- gam(wait ~ s(hour, k = 20), data = rides)                     # default method is GCV.Cp
fit_reml <- gam(wait ~ s(hour, k = 20), method = "REML", data = rides)

data.frame(
  criterion = c("GCV", "REML"),
  chosen_sp = round(c(fit_gcv$sp, fit_reml$sp), 4),
  score     = round(c(fit_gcv$gcv.ubre, fit_reml$gcv.ubre), 3),
  edf       = round(c(summary(fit_gcv)$s.table[1, 1], summary(fit_reml)$s.table[1, 1]), 3)
)
#>   criterion chosen_sp   score    edf
#> 1       GCV    0.0032   3.317 14.007
#> 2      REML    0.0018 828.621 15.325
```

Compare those chosen penalties against the grid's own minima: 0.0028 for GCV, 0.0017 for REML. Both land within rounding of where mgcv's own automatic search stopped. The grid was only drawn to show you the shape of the search; mgcv's own fit found the same floor without ever being handed a grid.

Read the **edf** column, short for **effective degrees of freedom**: it is the count of parameters the penalty actually let the curve spend, out of the k = 20 ceiling. GCV settled on 14.007, REML on 15.325, both comfortably under the 19 the ceiling would allow, and both far above a straight line's 1. Nobody set that penalty by hand. The search over \( \lambda \) landed there on its own, close to the hands-on middle ground you found with the slider a step ago.

=== step === quiz
## Quick check: what the minimum means

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- The penalty value that best trades the fit's accuracy against the curve's roughness, using only the training data's own residuals. ::ok Right. GCV and REML each search the same training fit for the penalty that keeps that trade-off smallest, with no outside data involved.
- A validation set that GCV held back from training and scored the fit against. ::no
- Whichever penalty value lets the curve wiggle as much as the basis size allows. ::no
- Whichever value makes the GCV or REML score lowest, which always means a better fit on data you have not seen yet. ::no GCV and REML are both computed from the training fit alone, no held-out data involved. Their minimum is not the wiggliest setting the basis allows, it is the one balancing fit against roughness. And a lower score only describes this dataset's own trade-off, not a guarantee about data you have not seen yet.

=== step === concept
## The check that matters: a smooth fitted to pure noise

A criterion that finds a good penalty on real data is only half convincing. The real test is handing it a predictor with nothing in it, and checking that it reports back nothing too.

```r
# Fit a smooth to a predictor built to carry no real relationship to wait
library(mgcv)
noise_x <- rnorm(400)
fit_noise <- gam(wait ~ s(noise_x, k = 20), data = rides)
summary(fit_noise)$s.table
#>            edf Ref.df        F   p-value
#> s(noise_x)   1      1 2.713431 0.1002959
round(range(fitted(fit_noise)), 3)
#> [1] 6.592 8.636
```

noise_x here is 400 draws from a standard normal, paired with the same 400 wait times, carrying no real relationship to any of them by construction. The fitted edf comes back at 1, the lowest a smooth term in mgcv can ever report. It is not quite the 0 you might expect, because one unpenalized straight line is always left over inside the term. But an edf of 1 still means the penalty crushed every bit of extra bend out of the curve, leaving only that line.

And that line barely moves. Across all 400 rides it only runs from 6.592 to 8.636, a span of about 2 minutes, nothing like the real curve's 9-minute bumps. Its own p-value, 0.1, cannot even tell that line apart from perfectly flat. If GCV had mistaken this noise for a real pattern, edf would have climbed well past 1 the way it did for the real hour effect last step, at 14.007. It did not. Handed nothing, the criterion correctly found nothing.

=== step === widget
## The other failure: a basis dimension too small to reach the truth

There is a second way smoothness selection can fail, and it has nothing to do with the penalty. The widget below is back one more time, at its stiffest setting, where its own basis size k is pinned down near 2.

::widget spline-smoother {}

This time its own label is being used exactly as written, not as a stand-in for something else: at k = 2 the curve is built from so few basis functions that no penalty, however small, could make it bend twice. It is still the widget's own small built-in example, not today's 400 rides, but the limit it shows is the same limit about to show up on the real data.

```r
# Cap the basis at k = 3: too few functions to bend twice
library(mgcv)
fit_k3 <- gam(wait ~ s(hour, k = 3), data = rides)
summary(fit_k3)$s.table
#>           edf   Ref.df        F p-value
#> s(hour) 1.968656 1.999018 21.00915       0
round(predict(fit_k3, newdata = data.frame(hour = c(0, 2, 8, 13, 18, 24))), 2)
#> [1] 4.70 5.63 8.03 8.88 8.40 6.82
```

With k = 3, this smooth has only 2 effective slots to spend, and edf comes back at 1.97, pinned right against that ceiling. Compare its predictions at the two rush hours against the truth: 8.03 at hour 8 and 8.40 at hour 18, nowhere near the real 14-minute peaks, while hours 13 and 24, which should sit near the 5-minute baseline, come back at 8.88 and 6.82 instead. Two separate bends, one for each rush hour, is more than 2 effective slots can represent, so the fit compromises on one broad, washed-out hump that gets no part of the curve right.

This is a different failure from the last step's. Pure noise gave you an edf of 1 because there was truly nothing to find. This gives you an edf of nearly 2 because there was plenty to find, but the ceiling was set too low to reach it, and no amount of searching for the right penalty can fix a ceiling.

=== step === quiz
## Practice: reading a smoothness diagnosis

Here is a summary from a fit you have not seen run on this page: edf = 3.99, GCV score = 9.34, and the fitted curve is one broad hump that never quite reaches either rush-hour peak. For comparison, this lesson's own best fit scored edf = 14.007 and GCV = 3.317, and the pure-noise check scored edf = 1.

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- A correct procedure fitted pure noise; the penalty found nothing in this predictor worth keeping. ::no
- The basis dimension was set too low to reach the truth, the same failure as the k = 3 fit earlier: edf of 3.99 is nowhere near the noise check's edf of 1, so this was not nothing, but the GCV score of 9.34 still sits far above the lesson's best score of 3.317, and one broad hump missing both peaks is exactly that failure's signature. ::ok Right. An edf of 3.99 rules out the pure-noise case, and a GCV of 9.34 rules out calling it reasonable. What is left is a basis dimension too small to bend twice, the same signature the k = 3 fit showed.
- This is a reasonable fit; a GCV score of 9.34 is close enough to the lesson's best score of 3.317. ::no
- A correct procedure fitted pure noise, since an edf under 4 is still close enough to a flat line. ::no An edf of 3.99 is nowhere near the noise check's edf of 1, so this was not nothing. Nor is a GCV of 9.34 reasonable next to the lesson's own best score of 3.317. What is left is the other failure: a basis dimension too small to bend twice, the same signature the k = 3 fit showed earlier.

=== step === tryit
## Your turn: tell underfit from overfit

The starter code below fits the same k = 3 smooth from two steps back and prints its edf and GCV score.

```r
# Starter: a basis dimension too small, capped at k = 3
library(mgcv)
g_try <- gam(wait ~ s(hour, k = 3), data = rides)
round(c(edf = summary(g_try)$s.table[1, 1], gcv = g_try$gcv.ubre), 3)
#>    edf gcv.GCV.Cp 
#>  1.969     12.572 
```

Raise the 3 in `k = 3` to something comfortably bigger, press Run again, and read what happens to both numbers.

::check {"regex": "s[(]hour,\\s*k\\s*=\\s*([4-9]|[12][0-9]|30)[)]", "gate": true, "difficulty": "beginner", "ok": "Right: raising the cap lets edf keep climbing well past the 1.97 that k = 3 pinned it at, and the GCV score drops back down toward 3.317, the same score this lesson's uncapped fit reached.", "no": "Edit the 3 inside s(hour, k = 3) to something bigger, like 10 or 20, so the smooth has enough basis functions to bend twice."}
::solution
```r
# Raise the basis size and watch edf and the GCV score recover
library(mgcv)
g_try <- gam(wait ~ s(hour, k = 20), data = rides)
round(c(edf = summary(g_try)$s.table[1, 1], gcv = g_try$gcv.ubre), 3)
#>    edf gcv.GCV.Cp 
#> 14.007      3.317 
```

At k = 20, edf climbs all the way to 14.007, the same value the uncapped fit found several steps back, and the GCV score drops from 12.572 down to 3.317 right alongside it. Nothing about the penalty changed between the two runs. Only the ceiling did, and that alone was enough to recover the real curve.

=== step === concept
## References

- Wood, S.N. (2017), [Generalized Additive Models: An Introduction with R](https://www.routledge.com/products/9781498728331), 2nd ed., CRC Press. The textbook behind the penalty, GCV and REML used throughout this lesson, written by the author of mgcv.
- Wood, S.N. (2011), Fast stable restricted maximum likelihood and marginal likelihood estimation for semiparametric generalized linear models, JRSS-B 73(1), 3-36. The paper behind the REML criterion fitted and plotted in this lesson.
- Craven, P. and Wahba, G. (1978), Smoothing noisy data with spline functions, Numerische Mathematik 31(4), 377-403. The paper that introduced generalized cross-validation, GCV, for choosing a smoothing parameter.
- Wood, S.N. (2003), [Thin Plate Regression Splines](https://doi.org/10.1111/1467-9868.00374), JRSS-B 65(1), 95-114. The paper behind the default spline basis mgcv builds for a term like s(hour).
- [mgcv package documentation](https://cran.r-project.org/package=mgcv) - CRAN. The reference for gam(), s(), and the sp and method arguments used throughout.

=== step === complete
## Choosing smoothness well

A GAM's smoothness is not a setting you eyeball. It is the \( \lambda \) that minimizes RSS plus a roughness penalty, found by a criterion, GCV or REML, searching the training fit alone. Two checks confirm it is working: pure noise comes back flat, and a basis dimension set too low stays flat no matter what the penalty does, which is the one failure the penalty itself can never fix.

Choosing a smooth's wiggliness was about a conditional mean: the average wait time at each hour. Estimating a density without assuming one, next, turns that question around and asks about the unconditional shape of the data itself.
