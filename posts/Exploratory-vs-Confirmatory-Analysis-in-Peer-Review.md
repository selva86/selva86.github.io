---
title: "Exploratory vs Confirmatory Analysis in Peer Review"
slug: Exploratory-vs-Confirmatory-Analysis-in-Peer-Review
description: "A reviewer says your analysis looks exploratory and asks if it was pre-registered. How to test whether a finding survives your analytic choices in R, and reply."
keywords: "exploratory vs confirmatory analysis, this looks exploratory, was it pre-registered, post hoc analysis reviewer, pre-specified analysis peer review, researcher degrees of freedom, HARKing, specification curve"
mathjax: false
webr: true
date: 2026-08-07
curriculum_id: null
post_type: FR
fr_parent: Answering-Statistical-Reviewer-Comments.html
handbook: publishing
handbook_part: 9
handbook_chapter: 46
auto_link_terms: exploratory vs confirmatory|this looks exploratory|was it pre-registered|pre-specified analysis|post hoc analysis|exploratory finding|analytic flexibility|specification curve
auto_link_case_sensitive: false
difficulty: Intermediate
---


<p class="lead">A confirmatory analysis tests a hypothesis you fixed before seeing the data; an exploratory analysis searches the data for hypotheses worth testing later. Both are legitimate, and the trouble a reviewer is pointing at is a confirmatory claim that was really exploratory: a result found by trying analyses and then reported as though it had been planned. The answer is to be honest about which one you did, and to show whether the finding survives the analytic choices you could just as easily have made instead.</p>

The word that stings in this objection is "exploratory", because in a reviewer's mouth it can mean "you kept looking until something turned up". Sometimes that is fair and sometimes it is not, so the way to answer is to separate two questions that feel like one: did you decide this analysis in advance, and does the result hold when you vary the choices a different analyst would have made?

## What the reviewer wrote

> The analyses are presented as testing a specific hypothesis, but several of the choices, including the covariates and the subset used, could reasonably have gone another way. Were these fixed in advance, or arrived at during the analysis?

> This reads as exploratory dressed up as confirmatory. Without a pre-registration I have no way to know how many analyses you ran before this one, and the p-values mean very little as a result.

> The manuscript is careful and clearly written, and I have only one substantive concern. The central finding depends on a particular model specification, and given the number of variables collected I would like some assurance that this specification was chosen a priori rather than because it produced the clearest result, perhaps by reference to a registered protocol or a statistical analysis plan.

## What they actually mean

The reviewer is drawing a line between two modes of analysis. A confirmatory test is one you committed to before the data arrived, so its p-value carries its usual meaning; an exploratory analysis is shaped by the data, so the same p-value overstates the evidence (Wagenmakers et al., 2012). They are asking which of the two you actually did, and they suspect the second is being reported as the first. They are not asking you to delete the analysis, nor insisting you should have pre-registered it, because an exploratory finding is allowed as long as it is labelled as one. The common misread is to defend the result's correctness when the objection is about its status, not its arithmetic.

## Why they are asking

Every analysis involves choices with no single right answer: which cases to include, which covariates to adjust for, how to code the outcome. Each defensible choice is a fork, a dataset offers dozens of them, and an analyst who drifts toward the significant version can reach p < 0.05 without ever consciously fishing (Gelman and Loken, 2014). The one-in-twenty promise of a p-value holds only when the test was fixed in advance, so once the choice of test depends on the data the true false-positive rate climbs well above 5% (Simmons, Nelson and Simonsohn, 2011). A result assembled that way tends not to reappear when someone runs the single analysis you reported on fresh data, which is what a reviewer who has watched these findings evaporate is worried about. So they want to know whether your finding was one planned test or the best of many. The mechanism, with simulations, is set out in [p-Hacking, Forking Paths and Preregistration](/p-Hacking-and-Preregistration.html); the task here is only to place your own analysis on one side of that line or the other.

## How to check it

You cannot recover what you were thinking when you chose the analysis, but you can measure how much that choice mattered. Refit the same hypothesis under every specification a reasonable analyst might have picked, and watch how the result behaves across them. If it holds everywhere, the particular fork you took did not carry the finding; if it appears in only a few specifications, it did.

Take `mtcars` and the claim that manual cars get better fuel economy than automatics, where `am = 1` is a manual car. Fit it on its own first.

```r
# The reported finding: manual cars (am = 1) beat automatics on mpg.
round(coef(summary(lm(mpg ~ am, data = mtcars)))["am", ], 4)
#>   Estimate Std. Error    t value   Pr(>|t|) 
#>     7.2449     1.7644     4.1061     0.0003 
```

Manual cars average 7.24 mpg more than automatics, and at p = 0.0003 the gap looks decisive. Reported on its own, that reads as a confirmatory result. But `mtcars` also carries several variables correlated with both transmission and economy, and whether to adjust for weight, horsepower, displacement or cylinders is a genuine choice that different analysts would settle differently. Refit the same transmission effect under every combination of those four controls.

```r
# Re-fit the same am effect under every combination of four defensible controls.
controls <- c("wt", "hp", "disp", "cyl")
specs <- unlist(lapply(0:4, function(k) combn(controls, k, simplify = FALSE)),
                recursive = FALSE)
am_p <- sapply(specs, function(v)
  coef(summary(lm(reformulate(c("am", v), "mpg"), data = mtcars)))["am", "Pr(>|t|)"])
c(specifications = length(am_p), significant = sum(am_p < 0.05),
  min_p = round(min(am_p), 4), max_p = round(max(am_p), 4))
#> specifications    significant          min_p          max_p 
#>        16.0000         5.0000         0.0000         0.9879 
```

Across the sixteen specifications the transmission effect is significant in five and absent in the other eleven, and its p-value runs from essentially zero up to 0.99. The finding is real in a handful of analyses and gone in most, so which result you report depends on a modelling choice the reader never sees. Counting how many defensible specifications support a result is a specification-curve analysis (Simonsohn, Simmons and Nelson, 2020), and a spread this wide means the finding leans on the particular fork you took rather than on the data as a whole. There is no threshold that turns the curve into a verdict: 16 of 16 is robust and 1 of 16 is fragile, but the space between is a matter of judgement, and the reason to run the curve is to show the reader the spread instead of hiding it behind one chosen model.

## What to do about it

### You are fine

You are fine when the analysis was genuinely planned, or when the finding does not depend on the fork. If you wrote the specification down before seeing the data, in a registered protocol or a statistical analysis plan, then it is confirmatory by construction and you can say so and point to the record. Robustness is the other kind of reassurance, and it is one you can demonstrate. The weight-economy relationship in the same data survives the identical multiverse.

```r
# By contrast, the weight effect on mpg across the same set of specifications.
others <- c("am", "hp", "disp", "cyl")
specs2 <- unlist(lapply(0:4, function(k) combn(others, k, simplify = FALSE)),
                 recursive = FALSE)
wt_est <- sapply(specs2, function(v)
  coef(summary(lm(reformulate(c("wt", v), "mpg"), data = mtcars)))["wt", "Estimate"])
wt_p <- sapply(specs2, function(v)
  coef(summary(lm(reformulate(c("wt", v), "mpg"), data = mtcars)))["wt", "Pr(>|t|)"])
c(specifications = length(wt_p), significant = sum(wt_p < 0.05),
  est_low = round(min(wt_est), 2), est_high = round(max(wt_est), 2))
#> specifications    significant        est_low       est_high 
#>          16.00          16.00          -5.35          -2.61 
```

Weight predicts economy in all sixteen specifications, with the estimate staying between -5.35 and -2.61 mpg per 1000 lb and every p-value under 0.05. A result that holds across every defensible analysis does not owe its significance to a hidden choice, so reporting the whole curve rather than a single model is what shows that. If your finding behaves like the weight effect rather than the transmission effect, the reviewer's suspicion does not apply, and you can show why with the curve instead of asserting it in a sentence.

### It is fixable

The most common real situation is that the analysis was exploratory and the write-up quietly presented it as confirmatory. When the finding itself is sound but you arrived at it by looking, the repair costs no data and moves no number: relabel it. Say in the text that the analysis was exploratory or post hoc, report the specifications you considered so the reader can see the robustness for themselves, and soften any wording that implied the hypothesis came first. Reporting guidelines expect exactly this separation, asking authors to distinguish pre-specified analyses from exploratory ones (CONSORT 2010, item 18). An exploratory finding, labelled honestly and shown to be robust, is a legitimate contribution and a sound basis for a future confirmatory study, whereas the same finding dressed as a planned test is what the reviewer will keep pushing on.

### It is a real problem

The finding is in trouble when it is both exploratory and fragile, which is the transmission claim exactly. Presented on its own it looks like a strong confirmatory result, yet it survives in only five of the sixteen analyses, and the single most obvious control removes it.

```r
# The same claim with and without the single most obvious control, weight.
round(coef(summary(lm(mpg ~ am, data = mtcars)))["am", ], 4)
#>   Estimate Std. Error    t value   Pr(>|t|) 
#>     7.2449     1.7644     4.1061     0.0003 
round(coef(summary(lm(mpg ~ am + wt, data = mtcars)))["am", ], 4)
#>   Estimate Std. Error    t value   Pr(>|t|) 
#>    -0.0236     1.5456    -0.0153     0.9879 
```

Adjusting for weight alone, the 7.24 mpg advantage collapses to -0.02 mpg and the p-value moves from 0.0003 to 0.99. Because weight is so obvious a variable to account for, a specification that ignores it is hard to defend as the one test you planned, and no relabelling rescues a result that most reasonable analyses do not find. The honest path is to report the finding as exploratory, show the specification curve with its eleven null results, and stop short of the causal claim, because transmission is entangled with weight (the confounding itself is covered in [Unadjusted Confounding in Peer Review](/Unadjusted-Confounding-in-Peer-Review.html)). The responsible conclusion is that the question needs a pre-registered test on new data, not a firmer sentence in this one.

## How to word your response

Each reply restates the concern, says what you checked, says what it means for the conclusion, and points to where the change now appears. Fill in the page placeholders.

### If you are fine

> We thank the reviewer for asking about the status of this analysis. The specification was fixed in our analysis plan before the data were examined, and we now cite the registered protocol at the point where the model is introduced (Methods, page X). To show that the result does not hinge on that choice, we have added a specification-curve analysis: the weight-economy effect is significant across all sixteen defensible covariate combinations, with the estimate ranging only from -5.35 to -2.61 (Results, page X). The finding is therefore both pre-specified and robust to reasonable analytic variation.

### If it is fixable

> The reviewer is right that this analysis was not pre-specified. It was exploratory, and we have relabelled it as such throughout (Results and Discussion, pages X). So that readers can judge its robustness directly, we now report the full set of specifications we considered, and the effect holds across all sixteen of them, which is why we retain it as a finding rather than removing it. We have also reworded the discussion so the result reads as a hypothesis to be confirmed in a future study, rather than as a planned test.

### If it is a real problem

> The reviewer is correct that this result was not planned and does not hold up. Refitting the model across the covariate choices a reader might reasonably expect, the effect is significant in five of sixteen specifications and disappears once weight is included, moving from 7.24 mpg (p < 0.001) to -0.02 mpg (p = 0.99). We have accordingly removed the confirmatory claim: the analysis is now reported as exploratory (Results, page X), the specification curve is shown in full, and the Discussion notes that testing this properly would require a pre-registered study on new data (Discussion, page X). We would rather report the result honestly than defend a specification the fuller analysis does not support.

## Practice

A reviewer writes:

> The relationship you highlight between wind and ozone is one of several you could have drawn from these weather variables, and the manuscript does not say it was planned. This looks like an exploratory result presented as a main finding.

The instinct under a comment like that is to concede: relabel the finding as exploratory and soften it. Run the specification curve first, refitting the wind-ozone effect across the weather covariates in the `airquality` data, and decide which of the three outcomes applies. The block prints the four specifications and nothing else; read them yourself.

```r
ex_ctrl  <- c("Solar.R", "Temp")
ex_specs <- unlist(lapply(0:2, function(k) combn(ex_ctrl, k, simplify = FALSE)),
                   recursive = FALSE)
ex_est <- sapply(ex_specs, function(v)
  coef(summary(lm(reformulate(c("Wind", v), "Ozone"), data = airquality)))["Wind", "Estimate"])
ex_p <- sapply(ex_specs, function(v)
  coef(summary(lm(reformulate(c("Wind", v), "Ozone"), data = airquality)))["Wind", "Pr(>|t|)"])
data.frame(specification = sapply(ex_specs, function(v) paste(c("Wind", v), collapse = " + ")),
           estimate = round(ex_est, 3), p_value = signif(ex_p, 3))
```

<details>
<summary>Show solution</summary>

Across all four specifications the wind effect is negative and significant, and not marginally so: the estimate runs from -5.551 with wind alone to -3.055 once temperature is added, and the four p-values are 9.27e-13, 1.34e-12, 1.08e-05 and 1.52e-06. Adjusting for temperature roughly halves the slope, because warm and still days tend to carry more ozone, but it does not come close to removing it.

So the reflex is wrong here. A finding that survives every defensible specification is not the fragile, fork-dependent kind the reviewer fears, and conceding it as exploratory would understate evidence the data actually support. This is the first outcome: report the specification curve to show the effect holds throughout, state plainly whether the analysis was pre-specified, and if it was, hold the line rather than soften a robust result to sound accommodating. The exploratory label is for findings that need it, and this one does not.

</details>
