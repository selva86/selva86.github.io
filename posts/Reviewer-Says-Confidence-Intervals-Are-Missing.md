---
title: "Reviewer says my confidence intervals are missing"
slug: Reviewer-Says-Confidence-Intervals-Are-Missing
description: "A reviewer says your confidence intervals are missing. How to add a 95% CI in R for a mean, a proportion or a regression coefficient, and word your reply."
keywords: "confidence intervals are missing reviewer, reviewer says report confidence intervals, missing confidence intervals peer review, how to add confidence intervals in R, confint in R, 95% confidence interval reporting, reviewer wants confidence intervals"
mathjax: false
webr: true
date: 2026-08-06
curriculum_id: null
post_type: FR
fr_parent: Answering-Statistical-Reviewer-Comments.html
handbook: publishing
handbook_part: 9
handbook_chapter: 50
auto_link_terms: confidence intervals are missing|reviewer wants confidence intervals|reporting confidence intervals in a paper|confidence interval objection|missing confidence intervals reviewer|report a 95% confidence interval|precision of the estimate
auto_link_case_sensitive: false
difficulty: Intermediate
---


<p class="lead">A confidence interval shows the range of values your data are consistent with, placed around an estimate you have already reported. When a reviewer says your intervals are missing, they want that range set next to every result you attached a p-value to, so a reader can see not just whether an effect is there but how precisely you measured it. Most of the time this is a quick, additive fix, and occasionally the interval reveals that an estimate is too imprecise to carry the claim built on it.</p>

## What the reviewer wrote

> Throughout the results the authors report p-values but no confidence intervals. It would help the reader to see the precision of each estimate.

> Please give 95% confidence intervals for the main effects. A p-value on its own is not enough.

> The study addresses an important question and the analysis is broadly appropriate. I would note, however, that the estimates in Table 3 are presented without any measure of uncertainty, and a confidence interval should accompany each reported effect so its precision can be judged.

## What they actually mean

The reviewer accepts your estimates and your p-values. What is missing is a stated range of plausible values around each number you reported. A p-value answers only whether an effect can be told apart from zero; a confidence interval shows how precisely you located the effect and which values the data are inconsistent with.

It is easy to read this as a request to run more tests, or as a hint that something in the analysis is wrong. It is neither. The reviewer is asking you to place, next to results you already have, an interval you can compute from the same fitted model.

## Why they are asking

A p-value compresses two things a reader wants to keep separate: how large the effect is, and how well your data pinned it down. It then reports only whether the combination cleared a threshold. Two findings with the same `p < 0.001` can sit on very different intervals, one narrow and one wide enough to be consistent with a trivial effect and a large one at the same time. A reader who sees only the p-value cannot tell those apart, cannot judge whether the estimate is precise enough to act on, and cannot reuse it in a later meta-analysis. Reporting the interval is a stated expectation, not a stylistic one: the ICMJE Recommendations ask authors to present findings with confidence intervals rather than relying on hypothesis testing alone, CONSORT item 17 asks for each effect and its precision as a 95% interval, and STROBE item 16 asks the same for observational estimates.

The mechanics of building an interval for any estimate are covered in [Confidence Intervals in R](/Confidence-Intervals-in-R.html). This chapter is about reading what your interval says and reporting it.

## How to check it

The check is simple: for every estimate you attached a p-value to, is there an interval beside it? Fit your model and look at the coefficients and their p-values first.

```r
model <- lm(mpg ~ wt + hp, data = mtcars)
round(summary(model)$coefficients, 4)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)  37.2273     1.5988 23.2847   0.0000
#> wt           -3.8778     0.6327 -6.1287   0.0000
#> hp           -0.0318     0.0090 -3.5187   0.0015
```

That table has estimates and p-values but no interval. In base R the interval for every coefficient comes from one call to `confint()`.

```r
round(confint(model), 4)
#>               2.5 %  97.5 %
#> (Intercept) 33.9574 40.4972
#> wt          -5.1719 -2.5837
#> hp          -0.0502 -0.0133
```

Each row is the 95% range of plausible values for that coefficient. The weight slope is -3.88 with an interval from -5.17 to -2.58, and the horsepower slope is -0.032 with an interval from -0.050 to -0.013. Neither interval includes zero, which is why both p-values were small, and a reader can now see the spread of slopes the data support rather than only that they cleared the line. There is no universal width that counts as too wide; whether an interval is precise enough depends on how small a difference would still matter in your field.

## What to do about it

### You are fine

If you fitted a regression, the interval already exists and you only have to report it beside the estimate. Pairing the coefficient with its interval in one table gives the reviewer everything the objection asked for.

```r
round(cbind(Estimate = coef(model), confint(model)), 4)
#>             Estimate   2.5 %  97.5 %
#> (Intercept)  37.2273 33.9574 40.4972
#> wt           -3.8778 -5.1719 -2.5837
#> hp           -0.0318 -0.0502 -0.0133
```

Add that interval column to the table the reviewer flagged, quote the two or three intervals that matter in the text, and point to where they now appear. Nothing about the analysis moves; you are surfacing numbers the model already produced.

### It is fixable

If you reported a mean, a proportion, or a difference with a p-value but no interval, the interval is one function call away. Take the proportion of automatic cars in `mtcars`, 19 of 32, reported bare as 59%.

```r
autos <- sum(mtcars$am == 0)
pt <- prop.test(autos, nrow(mtcars))
round(c(proportion = autos / nrow(mtcars),
        ci_low = pt$conf.int[1], ci_high = pt$conf.int[2]), 3)
#> proportion     ci_low    ci_high 
#>      0.594      0.408      0.758 
```

Before, a reader had a single figure of 59%. Now they have the range the data support, 41% to 76%, which is what tells them how firmly that 59% is established. The point estimate is unchanged; you have added the interval beside it and, if the number appears in a table, a column for the whole set.

### It is a real problem

Sometimes computing the interval is the moment you find the estimate is too imprecise to carry the claim you built on it. Take the same weight-and-mileage relationship estimated from only six cars, standing in for a small study.

```r
few <- mtcars[1:6, ]
fit_few <- lm(mpg ~ wt, data = few)
round(summary(fit_few)$coefficients["wt", ], 4)
#>   Estimate Std. Error    t value   Pr(>|t|) 
#>    -3.2795     0.9725    -3.3722     0.0280 
round(confint(fit_few)["wt", ], 4)
#>   2.5 %  97.5 % 
#> -5.9796 -0.5793 
```

The slope is -3.28 and significant at p = 0.028, yet its 95% interval runs from -0.58 to -5.98. The data are consistent with a slope near zero and with a steep one, so the significance test told you only that the interval missed zero, not how wide it was. You cannot fix this in the wording, because the imprecision is in the data. The honest response is to report the interval, say the estimate is directionally clear but imprecise, and stop short of any claim that needs a tight number, usually naming the sample size as the reason.

## How to word your response

### If you are fine

> The reviewer is right that the intervals were not shown. We had estimated them but reported only the coefficients. We have added a 95% confidence interval column to Table 3 (Results, page X) and now give the intervals for the two effects central to our argument in the text: the weight coefficient is -3.88 (95% CI -5.17 to -2.58) and the horsepower coefficient is -0.032 (95% CI -0.050 to -0.013). Both the direction and the precision are now visible for every reported effect.

### If it is fixable

> We thank the reviewer for this point. The response proportion was reported without a measure of uncertainty. We have added exact 95% confidence intervals to each proportion in the Results (page X); the overall figure is 59% (95% CI 41% to 76%). The point estimates are unchanged, and the intervals now make the precision of each figure explicit.

### If it is a real problem

> Adding the confidence intervals the reviewer requested has made the imprecision of this estimate clear. The slope is statistically significant (p = 0.03), but its 95% interval runs from -0.58 to -5.98, so our data are consistent with a small effect and with a large one. We have added the interval to the Results (page X) and revised the Discussion to describe the estimate as directionally clear but imprecise; we no longer report a single point value in the abstract, and we now note the sample size as a limitation (Discussion, page X).

## Practice

A reviewer writes: *"The authors report that 8 of 12 patients responded to the treatment and describe it as effective, but give no confidence interval for the response rate."* You run the check against the reported counts:

```r
ex_fit <- binom.test(8, 12)
round(c(estimate = unname(ex_fit$estimate),
        ci_low = ex_fit$conf.int[1],
        ci_high = ex_fit$conf.int[2],
        p_vs_half = ex_fit$p.value), 4)
```

Which of the three outcomes applies, and what do you write?

<details><summary>Click to reveal solution</summary>

The response rate is 0.667, its 95% confidence interval runs from 0.349 to 0.901, and a test of that rate against a coin-flip benchmark of 0.5 returns p = 0.388.

The obvious move is to treat this as the fixable case: 8 of 12 is a clear majority, so the treatment works and all that is missing is the interval. That reading is wrong. The interval runs from 35% to 90% and includes 50%, so twelve patients cannot distinguish the response rate from chance, and the test against 0.5 is not significant. This is the third outcome. Reporting the interval shows the word "effective" is not supported by this sample. Give the point estimate with its interval, describe the response rate as imprecisely estimated, and drop or heavily qualify the claim of effectiveness until a larger sample can pin the rate down.

</details>
