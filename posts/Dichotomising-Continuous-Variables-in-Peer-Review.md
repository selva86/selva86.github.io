---
title: "Dichotomising Continuous Variables in Peer Review"
slug: Dichotomising-Continuous-Variables-in-Peer-Review
description: "A reviewer asked why you dichotomised a continuous variable or used a median split. How to check what it cost in R, decide if it matters, and word your reply."
keywords: "why did you dichotomise a variable, median split reviewer comment, dichotomising continuous variables peer review, categorising continuous variable reviewer, optimal cutpoint response to reviewer"
mathjax: false
webr: true
date: 2026-08-07
curriculum_id: null
post_type: FR
fr_parent: Answering-Statistical-Reviewer-Comments.html
handbook: publishing
handbook_part: 9
handbook_chapter: 47
auto_link_terms: dichotomising a continuous variable|median split objection|categorising continuous predictors|optimal cutpoint problem|dichotomisation in peer review|why was the variable dichotomised
auto_link_case_sensitive: false
difficulty: Intermediate
---

<p class="lead">Dichotomising a continuous variable never adds information and usually costs power, yet it does not automatically invalidate a finding. What the split does to your result depends on the effect underneath it: a strong relationship survives being cut in two, whereas a modest one can vanish because the split discards the very variation that made it visible, and a cutpoint chosen to maximise significance can produce an effect that was never there. So the reviewer has raised a real concern, but the right answer is not always to undo the split.</p>

## What the reviewer wrote

> The authors dichotomised age at the median before entering it into the model. Could the analysis be repeated with age modelled as a continuous variable?

> Categorising a continuous exposure into two groups discards information and reduces statistical power. No rationale for this choice is given.

> The results in Table 3 are of some interest. I note, however, that several predictors were converted into high and low groups, and the cutpoints do not correspond to any established clinical definition that I am aware of. The authors may wish to reconsider this, particularly for the biomarker, where the choice of threshold seems likely to affect the reported association.

## What they actually mean

The reviewer has noticed that you took a variable measured on a scale and collapsed it into two categories, and wants to know why. Two very different concerns hide behind that one sentence, and they call for different replies.

The first is efficiency. A split throws away the ordering and spacing within each group, so you may have given up power for nothing. The second, and more serious, is fishing: if you decided where to cut after looking at the data, the split may be exactly where a non-result was turned into a result. Work out which one you are facing before you write anything, because the two answers barely overlap.

The reviewer is usually not saying your model is the wrong shape, because a two-group comparison is a legitimate analysis in its own right. The objection is to the decision to reduce the variable, and in the third phrasing above it is sharper than that: when a reviewer points out that your cutpoints match no external definition, they are questioning the cutpoint itself, which is the version you most need to take seriously.

## Why they are asking

A median split treats everyone above the cut as identical and everyone below it as identical, while treating two people who sit just either side of the line, and are almost the same, as different. That is a strong claim about the shape of the relationship, and it is usually false.

The cost is measurable. Cohen (1983) showed that splitting a variable at its median attenuates its correlation with an outcome by a factor of about 0.8, which is roughly equivalent to throwing away a third of your sample. Royston, Altman and Sauerbrei (2006) reviewed the practice for regression models and called dichotomising a continuous predictor a bad idea in the title, because the information loss buys you nothing a continuous term does not give more cheaply.

The fishing version is worse than inefficient. If the cutpoint is chosen to give the smallest p-value, the p-value you then report no longer means what it claims, because it does not account for the search. Altman, Lausen, Sauerbrei and Schumacher (1994) showed that hunting for an "optimal" cutpoint inflates the false-positive rate well beyond the nominal level.

How you model a predictor on its original scale, including with a spline when the relationship bends, is covered in [Polynomial and Spline Regression in R](/Polynomial-and-Spline-Regression-in-R.html). If the real reason you split was a suspected non-linear relationship, the reviewer's other likely objection is handled in [Nonlinear Relationships in Peer Review](/Nonlinear-Relationships-in-Peer-Review.html). This chapter is about deciding whether the split hurt you and what to say.

## How to check it

There is no diagnostic number to look up here. The check is to fit the model both ways, on the original scale and with your split, and compare what each one recovers. This uses `mtcars`, regressing fuel economy on quarter-mile time.

```r
cont  <- lm(mpg ~ qsec, data = mtcars)
mtcars$qsec_group <- ifelse(mtcars$qsec > median(mtcars$qsec), "slow", "quick")
split <- lm(mpg ~ qsec_group, data = mtcars)
round(coef(summary(cont))["qsec", ], 4)
#>   Estimate Std. Error    t value   Pr(>|t|) 
#>     1.4121     0.5592     2.5252     0.0171 
round(coef(summary(split))["qsec_groupslow", ], 4)
#>   Estimate Std. Error    t value   Pr(>|t|) 
#>     3.4938     2.0700     1.6878     0.1018 
round(c(r2_continuous   = summary(cont)$r.squared,
        r2_dichotomised = summary(split)$r.squared), 3)
#>   r2_continuous r2_dichotomised 
#>           0.175           0.087 
```

Modelled continuously, quarter-mile time predicts fuel economy at p = 0.017. Split at its median, the same relationship comes back as p = 0.10 and would be reported as null. Nothing about the cars changed between the two lines. The split simply discarded enough of the variation that the effect fell below the detection threshold, and the drop in R-squared from 0.175 to 0.087 says the same thing from the other side, with about half the explained variation gone. When the two models disagree this far, as they do here, the split was expensive; when they barely differ, as in the horsepower model below, it cost almost nothing.

## What to do about it

### You are fine

You are fine in two situations. The clean one is a cutpoint that comes from outside your data, such as a clinical guideline or a regulatory definition, fixed before you ran anything; that grouping is a stated scientific choice rather than a data-driven one, and it is what STROBE item 11 asks you to describe when it requires authors to "explain how quantitative variables were handled" and, if grouped, "which groupings were chosen and why".

The other is when the continuous analysis agrees with the split. Run both and look:

```r
hp_cont  <- lm(mpg ~ hp, data = mtcars)
mtcars$hp_group <- ifelse(mtcars$hp > median(mtcars$hp), "high", "low")
hp_split <- lm(mpg ~ hp_group, data = mtcars)
round(c(continuous_p   = coef(summary(hp_cont))["hp", "Pr(>|t|)"],
        dichotomised_p = coef(summary(hp_split))["hp_grouplow", "Pr(>|t|)"]), 6)
#>   continuous_p dichotomised_p 
#>          0e+00          1e-06 
round(c(r2_continuous   = summary(hp_cont)$r.squared,
        r2_dichotomised = summary(hp_split)$r.squared), 3)
#>   r2_continuous r2_dichotomised 
#>           0.602           0.550 
```

Here horsepower predicts fuel economy far below the 0.05 line whether it is continuous or split in two, and R-squared falls only from 0.602 to 0.550. You gave up a little precision and no conclusion at all. When two specifications point the same way this emphatically, the cut did not distort the result, so report the continuous model as a sensitivity analysis and keep your primary analysis if the cutpoint was defensible.

### It is fixable

This is the `mtcars` quarter-mile case from the check above: you split for convenience and it quietly cost you the finding. The remedy is to put the variable back on its original scale.

```r
round(confint(cont)["qsec", ], 4)
#>  2.5 % 97.5 % 
#> 0.2701 2.5542 
```

The continuous slope is 1.41 with a 95% confidence interval of 0.27 to 2.55, which excludes zero, and the p-value has moved from 0.10 under the split back to 0.017. R-squared has doubled from 0.087 to 0.175 over the same change. The effect was real the whole time and the split was simply too blunt to see it, so the honest correction strengthens your paper rather than weakening it. Present the continuous model as primary; if some readers think naturally in groups, a grouped version can stay in a supplementary table as long as the continuous one carries the inference.

### It is a real problem

The hard case is when the effect appears only after the split and disappears when the variable is continuous, especially if you chose the cutpoint by trying several and keeping the best. This simulation makes the cost of that search visible. It draws an outcome with no real relationship to a predictor, then compares searching a grid of cutpoints for the smallest p-value against the honest continuous test.

```r
set.seed(1)
sim <- replicate(2000, {
  x <- rnorm(80); y <- rnorm(80)
  cuts <- quantile(x, probs = seq(0.25, 0.75, by = 0.05))
  best_cut <- min(sapply(cuts, function(k) coef(summary(lm(y ~ I(x > k))))[2, "Pr(>|t|)"]))
  continuous <- coef(summary(lm(y ~ x)))[2, "Pr(>|t|)"]
  c(best_cut = best_cut, continuous = continuous)
})
round(c(searched_for_best_cut = mean(sim["best_cut", ]   < 0.05),
        honest_continuous     = mean(sim["continuous", ] < 0.05)), 3)
#> searched_for_best_cut     honest_continuous 
#>                 0.202                 0.050 
```

When there is genuinely nothing to find, the honest continuous test is fooled 5% of the time, exactly as advertised. Searching for the best cutpoint is fooled 20% of the time, four times as often, because the search gets to pick whichever split happened to look best in this particular sample. So a result that shows up only after a data-chosen split, and evaporates when you model the variable continuously, is most likely a product of the search rather than a finding.

The honest response is to lead with the continuous analysis and let it stand as the primary result. If the effect is not there on the original scale, the grouped version cannot be presented as confirmatory, and the right move is to say so and drop the claim, not to argue the split back in. An observation labelled honestly as exploratory is a normal part of a paper, and the [Exploratory vs Confirmatory Analysis in Peer Review](/Exploratory-vs-Confirmatory-Analysis-in-Peer-Review.html) chapter covers how to frame one, whereas a spurious result dressed as confirmatory is exactly what the reviewer was trying to catch.

## How to word your response

### If you are fine

> We thank the reviewer for this point. We repeated the analysis with the exposure modelled continuously as a sensitivity check, and the association was materially unchanged (continuous p < 0.001; grouped p < 0.001). The grouping was defined using the published clinical threshold rather than a data-derived cutpoint, and we have retained it as the primary specification for comparability with earlier work while reporting the continuous result alongside it (Methods, page X; Table SX).

### If it was fixable

> The reviewer is correct that dichotomising this variable was unnecessary. We have re-estimated the model with the predictor on its original scale. The association, which was not significant after the median split (p = 0.10), is clearly significant when the variable is modelled continuously (b = 1.41, 95% CI 0.27 to 2.55, p = 0.017), which confirms that the split had cost power rather than concealed a null result. The continuous model is now the primary analysis (Results, page X), with the grouped version moved to the supplement.

### If it is a real problem

> We agree with the reviewer. On re-examination, the reported effect is present only under the original grouping and does not hold when the variable is analysed continuously (p = 0.42). Because the cutpoint was chosen after inspecting the data, we accept that the grouped result cannot be interpreted as a confirmatory finding. We have removed the claim from the Abstract and Discussion, now report the continuous analysis in full, and describe the original observation as exploratory and hypothesis-generating (Discussion, page X).

## Practice

A reviewer writes: *"The authors split maximum daily temperature at its median into 'hot' and 'mild' days. This is an arbitrary cutpoint, and I am concerned that the reported association with ozone is an artefact of the grouping."* You run the check:

```r
ex_cont  <- lm(Ozone ~ Temp, data = airquality)
airquality$temp_group <- ifelse(airquality$Temp > median(airquality$Temp), "hot", "mild")
ex_split <- lm(Ozone ~ temp_group, data = airquality)
round(coef(summary(ex_cont))["Temp", ], 4)
round(coef(summary(ex_split))["temp_groupmild", ], 4)
round(c(r2_continuous   = summary(ex_cont)$r.squared,
        r2_dichotomised = summary(ex_split)$r.squared), 3)
```

Which of the three outcomes applies, and what do you write?

<details><summary>Click to reveal solution</summary>

The tempting answer is that a median split is a convenience cut, so the reviewer must be right and the association is suspect, yet the output points firmly the other way. Modelled continuously, temperature is an overwhelming predictor of ozone: the slope is 2.43 units per degree with a t value of 10.42 and p < 0.001, and it explains 48.8% of the variance (R-squared 0.488). The grouped version is also strongly significant, with the mild-day mean 39.83 lower than the hot-day mean (t = -8.14, p < 0.001) and an R-squared of 0.367.

This is the first outcome, not the third. The split cost precision, pulling R-squared down from 0.488 to 0.367, but it changed no conclusion, and the two analyses agree so emphatically that the finding plainly does not depend on where the line was drawn. The correct response is to report the continuous analysis as a sensitivity check, note that the association holds on the original scale, and leave the substantive claim standing. Undoing a genuine finding to satisfy a reflex about median splits would be the real error here.

Running the continuous model is exactly the check the reviewer asked for, and in this case it supports the original result rather than undermining it, which is the answer to put in the letter.

</details>
