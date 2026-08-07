---
title: "Outlier Removal in Peer Review"
slug: Outlier-Removal-in-Peer-Review
description: "A reviewer said outliers were removed without justification. How to check whether your conclusion depends on the excluded points in R, and how to reply."
keywords: "outliers were removed without justification, removing outliers reviewer comment, outlier removal peer review, justify outlier exclusion, sensitivity analysis outliers reviewer response"
mathjax: false
webr: true
date: 2026-08-07
curriculum_id: null
post_type: FR
fr_parent: Answering-Statistical-Reviewer-Comments.html
handbook: publishing
handbook_part: 9
handbook_chapter: 48
auto_link_terms: outliers were removed without justification|removing outliers in peer review|justify outlier exclusion|outlier removal objection|excluding outliers reviewer comment|sensitivity analysis for outliers
auto_link_case_sensitive: false
difficulty: Intermediate
---

<p class="lead">Removing an outlier is an analysis decision, and like any analysis decision it can be defensible or it can be the thing that produced your result. A rule fixed before you saw the outcome, applied to points that are genuine errors, is defensible, whereas points dropped because they weakened the finding are not, even when each one looks extreme on a plot. The reviewer cannot tell which of those you did from the manuscript, so the objection is really a request for two things: the rule you used, and evidence that the conclusion holds whether or not the points are in. Both take only a few lines of R, and more often than not the evidence is on your side.</p>

## What the reviewer wrote

> The authors note that some observations were excluded from the analysis. Could you clarify the criterion used, and confirm that the main results are not sensitive to this decision?

> Several data points appear to have been dropped. Removing outliers without a pre-specified rule is not acceptable, and the analysis should be repeated on the full sample.

> The manuscript is generally clear and the methods are appropriate. I would, however, like to see the model refitted with all cases included. The Methods mention that three values were removed as outliers, but the threshold is not stated, and it is not obvious to me that the reported association would survive if they were retained.

## What they actually mean

The reviewer is asking two questions that often get answered as one. The first is procedural: what rule decided that a point was an outlier, and was that rule fixed before you looked at the results? The second is empirical: does your conclusion still hold when the excluded points are put back in?

It is easy to read this as a demand that you prove the points really were outliers, and to reply with a paragraph arguing that they were unusual. That is not what most reviewers want. They care less about whether a point is extreme than about whether its removal is what produced the finding, because a rule applied blind to the outcome cannot manufacture a result, whereas a point dropped after it spoiled the p-value can. So the reply that works states the rule and shows the sensitivity analysis. A reply that only argues the points looked weird leaves both of the reviewer's actual questions unanswered.

## Why they are asking

Outlier exclusion is one of the most flexible decisions in an analysis. Because the analyst chooses the rule, the threshold, and which points it lands on, the same freedom that removes a genuine recording error can remove an inconvenient but valid observation. Simmons, Nelson and Simonsohn (2011) list deciding whether to drop outliers among the researcher degrees of freedom that let a determined analyst pull significance out of noise, and they show the false-positive rate climbs sharply once a few such choices are made after seeing the data. The mechanism is not subtle: extreme points usually carry the most leverage over a slope, so dropping the two or three that pull hardest against your hypothesis can push a p-value across 0.05 while nothing real has changed.

That is why the reviewer wants the rule and the sensitivity check rather than a defence of the individual points. Spotting influential observations, with Cook's distance and the other standard measures, is covered in [Regression Diagnostics in R](/Regression-Diagnostics-in-R.html) and [Outlier Detection in R](/Outlier-Detection-in-R.html); this chapter takes the flagged points as given and asks what their removal did to the conclusion.

## How to check it

The check for this objection is a sensitivity analysis: fit the model on the full data, fit it again with the flagged points removed, and see whether the answer to your research question changes. Here it is on `airquality`, regressing ozone on wind speed, using Cook's distance to flag the influential points.

```r
aq <- airquality[!is.na(airquality$Ozone), ]
fit_all <- lm(Ozone ~ Wind, data = aq)
influential <- which(cooks.distance(fit_all) > 4 / nrow(aq))
length(influential)
#> [1] 8
fit_trim <- lm(Ozone ~ Wind, data = aq[-influential, ])
round(coef(summary(fit_all))["Wind", ], 4)
#>   Estimate Std. Error    t value   Pr(>|t|) 
#>    -5.5509     0.6904    -8.0401     0.0000 
round(coef(summary(fit_trim))["Wind", ], 4)
#>   Estimate Std. Error    t value   Pr(>|t|) 
#>    -4.9182     0.6979    -7.0477     0.0000 
round(c(all = summary(fit_all)$r.squared, trimmed = summary(fit_trim)$r.squared), 4)
#>     all trimmed 
#>  0.3619  0.3191 
```

The 4/n cutoff flags eight points. With all the data, wind has a slope of -5.55 at p below 0.0001; with those eight removed, the slope is -4.92 and the p-value is still below 0.0001. The estimate moved by about eleven percent and R-squared slipped from 0.36 to 0.32, but the thing you would actually report, that ozone falls as wind rises, is the same in both models. The 4/n rule is a convention and not a law, and other cutoffs flag different counts, so treat the flagged set as a starting point for the comparison rather than a verdict on any single observation.

## What to do about it

### You are fine

You are fine in two situations. The first is the one the check already shows: the conclusion is the same with and without the excluded points. When that holds, the removal cannot have produced your result, and the honest way to prove it is to report both fits side by side and let the reader watch them agree. The `airquality` comparison above is a paragraph you could paste into a supplement almost unchanged, because the slope, its sign, and its significance all survive the removal.

The second is a point that is a genuine error rather than a surprising but real value: an impossible age, a blood pressure of zero, a weight entered in the wrong units. A pre-specified rule that removes those is a data-cleaning step, not an analysis choice, and you are fine as long as you state the rule and how many points it caught. What matters to the reviewer is whether the rule was fixed before you saw its effect on the result, so if the threshold was recorded in your analysis plan or [pre-registration](/Pre-Registration-for-R-Analysis.html), say so, because that is what tells the reviewer the rule came before the finding.

### It is fixable

The common fixable case is that your rule was reasonable but you never wrote it down, or you removed a point that is influential without being an error. Take the single most influential observation in `mtcars`, the heaviest car in the regression of fuel economy on weight.

```r
fit_wt <- lm(mpg ~ wt, data = mtcars)
worst  <- names(which.max(cooks.distance(fit_wt)))
worst
#> [1] "Chrysler Imperial"
fit_drop <- lm(mpg ~ wt, data = mtcars[rownames(mtcars) != worst, ])
round(coef(summary(fit_wt))["wt", ], 4)
#>   Estimate Std. Error    t value   Pr(>|t|) 
#>    -5.3445     0.5591    -9.5590     0.0000 
round(coef(summary(fit_drop))["wt", ], 4)
#>   Estimate Std. Error    t value   Pr(>|t|) 
#>    -5.8698     0.5687   -10.3223     0.0000 
```

Chrysler Imperial has the largest Cook's distance in the model, and dropping it steepens the weight slope from -5.34 to -5.87, a change of about ten percent in the estimate you would report. The car is not a mistake, it is a real, heavy sedan, so deleting it to tidy the plot would be discarding valid data. The fix has two parts. First, report the exclusion honestly: state the rule, say how many points it removed, and show the with-and-without comparison so the reviewer can see that the slope shifted by about half a unit and no conclusion turned on it. Second, where a legitimate point is genuinely influential, prefer a method that is less sensitive to it over deletion, so that you keep the observation and still limit its pull. Robust regression does this by down-weighting extreme points instead of discarding them, and it is covered in [Robust Regression in R](/Robust-Regression-in-R.html). Reporting the full-data model as primary and the robust fit as a sensitivity check answers the objection without deleting anything.

### It is a real problem

The serious case is the one the reviewer is really probing: the finding is there only after the points come out, and the points came out because they were in the way. If you chose which observations to drop by watching what each did to the p-value, the p-value no longer means what it claims. This simulation makes the cost visible. It draws a predictor and an outcome with no relationship at all, then compares an honest test on the full sample against a test run after removing the two most extreme points, where "most extreme" is judged by which removal most lowers the p-value.

```r
set.seed(1)
sims <- replicate(2000, {
  x <- rnorm(40); y <- rnorm(40)
  honest <- coef(summary(lm(y ~ x)))[2, "Pr(>|t|)"]
  d <- data.frame(x, y)
  for (step in 1:2) {
    fit  <- lm(y ~ x, data = d)
    cand <- order(abs(rstudent(fit)), decreasing = TRUE)[1:5]
    ps   <- sapply(cand, function(i)
      coef(summary(lm(y ~ x, data = d[-i, ])))[2, "Pr(>|t|)"])
    d <- d[-cand[which.min(ps)], ]
  }
  pruned <- coef(summary(lm(y ~ x, data = d)))[2, "Pr(>|t|)"]
  c(honest = honest, pruned = pruned)
})
round(c(honest_test   = mean(sims["honest", ] < 0.05),
        after_pruning = mean(sims["pruned", ] < 0.05)), 3)
#>   honest_test after_pruning 
#>         0.050         0.239 
```

With nothing real to find, the honest test rejects the null 5 percent of the time, exactly as it should. Removing just two points to chase significance rejects it 24 percent of the time, roughly one run in four, because the search keeps whichever pair happened to flatter this particular sample. A result that behaves this way, present only after an outcome-driven exclusion and gone once the points return, is far more likely to be an artefact of the removal than a finding.

When that is your situation, the honest path is to report the full-sample result and describe the pattern you saw after exclusion as exploratory. If the effect is not there with the points in, it cannot be presented as confirmatory, and no wording repairs that; the [Exploratory vs Confirmatory Analysis in Peer Review](/Exploratory-vs-Confirmatory-Analysis-in-Peer-Review.html) chapter covers how to frame an exploratory observation so it still contributes something. The move to avoid is arguing the exclusion back in, since that is the behaviour the objection was written to catch.

## How to word your response

### If you are fine

> The reviewer asked us to confirm that the results are not sensitive to the exclusion of outliers. We applied a pre-specified rule (values beyond the threshold fixed in our analysis plan), which removed [n] observations, and we repeated the primary analysis on the full sample as a sensitivity check. The association is essentially unchanged (full sample b = X, after exclusion b = X; both p < 0.001), so the conclusion does not depend on the exclusion. The rule and the sensitivity analysis are now stated in the Methods (page X) and reported in full in the supplement (Table SX).

### If it was fixable

> We thank the reviewer for asking about the excluded observations, and we agree the criterion should have been stated. We removed [n] points identified by [rule], and one of them, an influential but valid case, shifts the slope from -5.34 to -5.87 when dropped. Because the point is genuine, we have retained it and now report the full-data model as our primary analysis, with a robust regression that down-weights extreme observations as a sensitivity check (Methods, page X). Both give the same conclusion, and the reported estimate no longer depends on the exclusion.

### If it is a real problem

> The reviewer is right to question the excluded points. On re-examination, the reported association is present only after those observations are removed and does not hold in the full sample (full-sample p = 0.28). Because the exclusion was decided after we had seen its effect on the result, we cannot treat the finding as confirmatory. We have re-run the analysis on all observations, removed the claim from the Abstract and Discussion, and now describe the original pattern as an exploratory observation that would need testing in a new sample (Discussion, page X).

## Practice

A reviewer writes: *"The authors removed three cars flagged as outliers before fitting the horsepower model. A boxplot confirms these are extreme, but no justification is given, and I am not convinced the reported relationship survives on the complete data."* You run the check on the full `mtcars` data:

```r
ex_fit  <- lm(mpg ~ hp, data = mtcars)
ex_out  <- which(cooks.distance(ex_fit) > 4 / nrow(mtcars))
rownames(mtcars)[ex_out]
ex_trim <- lm(mpg ~ hp, data = mtcars[-ex_out, ])
round(coef(summary(ex_fit))["hp", ], 5)
round(coef(summary(ex_trim))["hp", ], 5)
round(c(all = summary(ex_fit)$r.squared, trimmed = summary(ex_trim)$r.squared), 4)
```

Cook's distance flags the same three cars the authors removed. Which of the three outcomes applies, and what do you write back?

<details><summary>Click to reveal solution</summary>

The tempting reading is that three cars are flagged by every rule you try, a boxplot agrees they are extreme, and the authors already removed them, so the safe answer must be that the removal was reasonable or that the result is fragile. The output says the opposite. With all 32 cars in, horsepower predicts fuel economy at a slope of -0.06823 (t = -6.74, p < 0.0001) and explains 60.2 percent of the variance. Remove Fiat 128, Toyota Corolla and Maserati Bora and the slope barely moves, to -0.07090 (t = -7.19, p < 0.0001), while R-squared rises slightly to 0.657. The conclusion is identical either way.

This is the first outcome, not a problem. The three points are extreme, but their removal changes no estimate you would report and no inference you would draw, so there was never a reason to drop them. The answer to the reviewer is to put all three cars back, present the full-data model as primary, and show the with-and-without comparison to demonstrate that the relationship holds on the complete sample. Removing valid data to satisfy a boxplot, and then having to defend the removal, creates the exact suspicion the reviewer is voicing, whereas keeping the data avoids it.

</details>
