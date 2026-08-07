---
title: "How to Report Confidence Intervals in a Paper"
slug: How-to-Report-Confidence-Intervals-in-a-Paper
description: "A confidence interval reports how precisely you measured an effect. How to choose its level and method, interpret it honestly, and report it as journals expect."
keywords: "how to report confidence intervals, confidence interval in a paper, reporting confidence intervals, which confidence interval method, 95% confidence interval reporting, confidence interval interpretation"
mathjax: false
webr: true
date: 2026-08-07
curriculum_id: null
post_type: FR
fr_parent: Answering-Statistical-Reviewer-Comments.html
handbook: publishing
handbook_part: 4
handbook_chapter: 15
auto_link_terms: how to report confidence intervals|reporting confidence intervals|confidence interval to report|which confidence interval|confidence interval method|report a confidence interval
auto_link_case_sensitive: false
difficulty: Intermediate
---

<p class="lead">A confidence interval reports how precisely you measured an effect: the range of values your data are consistent with, not just the single best estimate. Reporting one well folds three small decisions together, the level, the method, and the words, and each of them changes either the numbers a reader sees or the way they read them.</p>

## The decision you are making

You have an estimate, a mean difference, a proportion, an odds ratio, and now you have to say how uncertain it is rather than report the point alone. A confidence interval is the standard way to do that, and reporting guidance increasingly asks for one in place of, or alongside, a bare p-value, because an interval carries the effect size and its precision in a way a p-value cannot (ICMJE Recommendations, 2024). So far this is uncontroversial. What hides inside "report a confidence interval" is three choices that are usually made without thinking and occasionally made wrong.

The first is the confidence level. Ninety-five percent is the default nearly every journal expects, and CONSORT gives "a 95% confidence interval" as its own worked example (item 17a; Schulz, Altman and Moher, 2010), so moving off it is something you justify rather than a knob you turn freely.

The second is the method, and it is the choice that actually moves the numbers. The same estimate can carry a Wald interval, a score interval, an exact interval or a bootstrap interval, and for a proportion near zero or a ratio from a small sample these disagree by enough to change what you would conclude.

The third is interpretation, which is where a confidence interval is most often reported correctly and described wrongly. The interval is a statement about a procedure's long-run coverage, not the probability that the true value sits inside this particular one, and a reviewer who knows the difference will catch the sentence that gets it backwards.

This chapter is about those three choices. The arithmetic of building an interval, whether from a t-distribution, a score formula or a resample, is covered in [Confidence Intervals in R](/Confidence-Intervals-in-R.html) and, for the resampling route, [Bootstrap Confidence Intervals in R](/Bootstrap-Confidence-Intervals-in-R.html); here you already have the interval and are deciding how to report it. Whether to report one at all, when a reviewer tells you that you did not, is [Missing Confidence Intervals in Peer Review](/Missing-Confidence-Intervals-in-Peer-Review.html).

## What the options are

The method that fits depends on the estimate you are wrapping the interval around. Each row below gives the interval most papers use, then the case where a different one earns its place.

| The estimate you have | Interval most reports use | When to reach for another |
|---|---|---|
| Mean, or difference in means | t-based interval | Bootstrap when the outcome is skewed or the sample is small |
| A single proportion | Wilson score interval | Exact (Clopper-Pearson) when a count is very small; avoid the Wald interval near 0 or 1 |
| A regression slope | Profile-likelihood interval (`confint`) | Wald (`confint.default`) is fine for a linear model; they diverge for a GLM |
| Odds ratio, risk ratio, hazard ratio | Interval built on the log scale, then exponentiated | already the standard |
| A statistic with no closed-form standard error (a median, an R-squared difference, an index) | Bootstrap interval | already the standard |

Two things apply across every row. The level sets the width: a 99% interval is wider than a 95% one and a 90% narrower, because a higher level has to catch the true value on more repetitions, so it pays for that assurance in precision. And the presentation is a convention worth following exactly. Report the interval next to its estimate, in the same units and to the same number of decimals, and write the limits with the word "to" rather than a hyphen, so a negative lower bound is never mistaken for a minus sign (Lang and Altman, 2015).

One move is out of bounds regardless of method. Choosing the level after seeing which one makes the interval exclude the null, or switching methods until an interval clears a threshold, converts a reporting choice into a way of manufacturing a result the data do not support. Fix the level and the method before you look at whether the interval contains the null.

## How to decide

Three cases cover almost everything, and in each the decision shows up in the output rather than in the abstract.

Start with the level. Take the mean fuel economy in `mtcars` and read the same estimate at three conventional levels.

```r
x <- mtcars$mpg
round(mean(x), 2)
lvl <- c(0.90, 0.95, 0.99)
ints <- t(sapply(lvl, function(c) t.test(x, conf.level = c)$conf.int))
rownames(ints) <- c("90%", "95%", "99%")
colnames(ints) <- c("low", "high")
round(ints, 2)
#> [1] 20.09
#>       low  high
#> 90% 18.28 21.90
#> 95% 17.92 22.26
#> 99% 17.17 23.01
```

The point estimate never moves; only the width does. At 95% the interval runs from 17.92 to 22.26, dropping to 90% tightens it to 18.28 to 21.90, and raising it to 99% widens it to 17.17 to 23.01. A wider level buys more assurance that the interval covers the truth at the cost of saying less about where the truth is. Report 95% unless a field convention or a pre-registered plan tells you otherwise, and settle the level before you see which one clears a threshold.

The method matters most for a proportion, where the textbook formula misbehaves near the boundary. Count the eight-cylinder cars among the 13 manual-transmission cars and wrap three intervals around that proportion.

```r
x <- sum(mtcars$am == 1 & mtcars$cyl == 8); n <- sum(mtcars$am == 1)
phat <- x / n
wald   <- phat + c(-1, 1) * 1.96 * sqrt(phat * (1 - phat) / n)
wilson <- as.numeric(prop.test(x, n)$conf.int)
exact  <- as.numeric(binom.test(x, n)$conf.int)
m <- rbind(wald = wald, wilson = wilson, exact = exact)
colnames(m) <- c("low", "high")
c(successes = x, n = n)
round(m, 3)
#> successes         n 
#>         2        13 
#>           low  high
#> wald   -0.042 0.350
#> wilson  0.027 0.463
#> exact   0.019 0.454
```

Two cars in 13 is a proportion of 0.154, and the Wald interval runs from -0.042 to 0.350. A lower bound of -0.042 is impossible, because a proportion cannot be negative, and that is the standard failure of the Wald interval whenever a count is small or the proportion is near 0 or 1 (Brown, Cai and DasGupta, 2001). The Wilson score interval (0.027 to 0.463) and the exact Clopper-Pearson interval (0.019 to 0.454) both stay inside the range a proportion is allowed to take. Report the Wilson interval by default, and prefer the exact interval when a count is very small and you want coverage that is guaranteed rather than approximate.

The third case is a ratio, where the method choice is quieter but still real. Fit a logistic model of engine shape on weight and read the odds ratio for weight with two interval methods built from the same fit.

```r
fit <- glm(vs ~ wt, data = mtcars, family = binomial)
or   <- exp(coef(fit)[["wt"]])
wald <- exp(confint.default(fit)["wt", ])
prof <- exp(suppressMessages(confint(fit))["wt", ])
round(c(OR = or, wald_low = wald[[1]], wald_high = wald[[2]],
        prof_low = prof[[1]], prof_high = prof[[2]]), 3)
#>        OR  wald_low wald_high  prof_low prof_high 
#>     0.148     0.036     0.616     0.026     0.488
```

The odds ratio is 0.148, and the two intervals come from the same model yet disagree, 0.036 to 0.616 for the Wald interval against 0.026 to 0.488 for the profile-likelihood one. They differ because the logistic likelihood is asymmetric on this scale and the sample is only 32 cars: the Wald interval assumes the likelihood is symmetric around the estimate, while the profile interval follows its actual shape (Venables and Ripley, 2002). For a linear model the two coincide and either is fine, but for a GLM report the profile interval. Both were computed on the log-odds scale and then exponentiated, which keeps the interval multiplicatively sensible and stops the lower bound from crossing zero, which is why the interval for a ratio is always built on the log scale rather than computed directly.

## What reviewers will ask about this later

Reporting the interval well answers one question and sharpens the ones that follow it. The most common is not that the interval is missing but that the sentence around it claims too much. Writing "there is a 95% probability the true effect lies between these limits" is the misreading a careful reviewer will correct, because the probability attaches to the procedure across many hypothetical samples, not to this one interval (Greenland et al., 2016). If your Discussion leans on that phrasing, expect it back in the margins.

Two more follow from what the interval contains. If it crosses the null and you still described the result as "trending" or leaned on the point estimate as though the range did not matter, that is [Trending Toward Significance in Peer Review](/Trending-Toward-Significance-in-Peer-Review.html), and where a p-value sat just the wrong side of the line the companion objection is [Borderline p-Values in Peer Review](/Borderline-p-Values-in-Peer-Review.html). And if you computed many intervals and drew the reader's eye to the few that exclude the null, that reads as selection, which is [Multiple Comparisons in Peer Review](/Multiple-Comparisons-in-Peer-Review.html). How the interval sits in the running text, including decimals and the order of the numbers, is [Reporting Statistics in R](/Reporting-Statistics-in-R.html).

## How to report it

Confidence intervals belong in the Results, next to the estimate they qualify, and the guidelines are specific. CONSORT asks for the estimated effect size and its precision, "such as a 95% confidence interval", for each primary and secondary outcome (item 17a; Schulz, Altman and Moher, 2010), and SAMPL asks the same of observational work and recommends the "to" separator so a negative bound cannot be misread (Lang and Altman, 2015). For the mean, name the level and give the interval in the outcome's units.

> Fuel economy averaged 20.09 mpg (95% CI 17.92 to 22.26). We report a 95% interval, the level fixed in our analysis plan, and read it as the range of mean values the data are consistent with rather than as a probability statement about the true mean.

For a proportion from a small sample, name the method, because the reader cannot otherwise tell why your interval differs from the one they would have computed.

> Two of the 13 manual cars had eight cylinders (15.4%, 95% Wilson CI 2.7% to 46.3%). We report the score interval rather than the normal-approximation interval, whose lower bound of -4.2% falls below zero and is not a value a proportion can take.

For a ratio, report it on the ratio scale with the method named where it is not the obvious default.

> Heavier cars were markedly less likely to have a straight engine (odds ratio 0.15 per 1,000 lb, 95% profile-likelihood CI 0.03 to 0.49). We report the profile interval in preference to the Wald interval (0.04 to 0.62) because the two disagree at this sample size and the profile interval follows the shape of the likelihood.

Across all three, the estimate and its interval sit together, the level is stated, the method is named whenever it is not the default a reader would assume, and the interval is described as a range the data support rather than as the probability the parameter lies inside it. The wording that trips this last point is "there is a 95% chance the true value lies in this range"; the honest version drops the probability and calls the interval the set of values the data do not rule out.
