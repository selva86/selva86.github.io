---
title: "Reviewer says you did not adjust for confounding"
slug: Reviewer-Says-You-Did-Not-Adjust-for-Confounding
description: "A reviewer says you did not adjust for confounding. How to check whether a confounder actually moved your estimate in R, fix it if it did, and word the reply."
keywords: "did not adjust for confounding, reviewer says confounding not addressed, unmeasured confounding, confounder adjustment in R, change in estimate criterion, confounding reviewer comment"
mathjax: false
webr: true
date: 2026-08-06
curriculum_id: null
post_type: FR
fr_parent: Answering-Statistical-Reviewer-Comments.html
handbook: publishing
handbook_part: 9
handbook_chapter: 39
auto_link_terms: adjust for confounding|confounding not addressed|unmeasured confounding|confounder adjustment|change-in-estimate|residual confounding
auto_link_case_sensitive: false
difficulty: Intermediate
---

<p class="lead">Confounding is when a third variable drives both the groups you are comparing and the outcome you measured, so part of the association you report is borrowed from it. The honest answer to this objection is to check whether adjusting for the confounder moves your estimate, then report what you find.</p>

## What the reviewer wrote

> The observed association may be confounded. The authors should adjust for potential confounding variables.

> This is an observational study, yet the analysis treats the exposure as if it had been randomly assigned. Confounding has not been addressed.

> The finding is interesting and the writing is clear, but I am not convinced the two groups are comparable, and without adjustment for age and disease severity it is hard to know whether the effect is real or driven by who ended up in each group.

## What they actually mean

The reviewer is saying that the difference you attribute to your exposure might instead be caused by something the two groups already differ on. In an observational study the groups were not randomised, so any variable that both predicts group membership and affects the outcome can carry part of the association you measured. The reviewer wants you to name the plausible confounders, adjust for the ones you have, and show the estimate with and without adjustment. STROBE item 7 asks observational studies to define their potential confounders in the first place, so naming them is part of the reporting standard, not an extra.

What the reviewer is not asking for is adjustment for every variable you happened to record. A variable that sits on the causal path from exposure to outcome is a mediator, and a variable caused by both is a collider. Adjusting for either of those introduces bias rather than removing it, so "control for everything" is as wrong as controlling for nothing. Which variables are confounders is a question about causal structure, not correlation, and [causal diagrams](/Causal-Diagrams-with-DAGs.html) are the tool for deciding.

## Why they are asking

If a confounder is real and you leave it out, your estimate is biased. It can be too large, too small, or the wrong sign entirely. The transmission-and-weight example below shows a clear seven-unit advantage shrinking to nothing once weight is accounted for, which is the kind of reversal the reviewer is guarding against.

The concern depends on the design. In a randomised trial, randomisation balances both measured and unmeasured confounders in expectation, so the design itself answers most of the objection. In an observational study nothing guarantees that balance, and the reviewer is right to ask before any causal reading is allowed. Causal wording such as "the exposure lowers the outcome" is only earned once confounding has been handled, which is why this objection so often arrives attached to a sentence about causation. The mechanics of fitting an adjusted model are covered in [Multiple Regression in R](/Multiple-Regression-in-R.html); this chapter is about deciding whether you have a problem and how to report it.

## How to check it

Take a finding from the `mtcars` data: manual cars look far more fuel-efficient than automatics. A reviewer objects that you never adjusted for vehicle weight. Start with the unadjusted comparison.

```r
m_naive <- lm(mpg ~ am, data = mtcars)
round(coef(summary(m_naive)), 4)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)  17.1474     1.1246 15.2475    0e+00
#> am            7.2449     1.7644  4.1061    3e-04
```

Manual cars average 7.24 mpg more, and the difference is significant. Before adjusting, confirm that weight actually qualifies as a confounder: it has to be associated with both the exposure and the outcome.

```r
tapply(mtcars$wt, mtcars$am, mean)
cor(mtcars$wt, mtcars$mpg)
#>        0        1 
#> 3.768895 2.411000 
#> [1] -0.8676594
```

Automatics average 3.77 thousand pounds against 2.41 for manuals, and weight correlates with fuel economy at -0.87. Weight predicts which transmission a car has and how far it goes on a gallon, and mechanically it causes both rather than being caused by them, which is what makes it a confounder rather than a mediator. Now add it to the model.

```r
m_adj <- lm(mpg ~ am + wt, data = mtcars)
round(coef(summary(m_adj)), 4)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)  37.3216     3.0546 12.2180   0.0000
#> am           -0.0236     1.5456 -0.0153   0.9879
#> wt           -5.3528     0.7882 -6.7908   0.0000
```

The transmission coefficient falls from 7.24 to -0.02 and its p-value goes from below 0.001 to 0.99, while weight takes over the whole effect. The quantity to read is the change in the exposure estimate: it moved by almost its entire size. Some fields treat a change of more than about 10 percent as a working sign of confounding, though the threshold is arbitrary and choosing confounders by it alone has been criticised (Maldonado and Greenland, 1993, *American Journal of Epidemiology*). What settles the matter is not the percentage but whether the adjusted estimate changes your conclusion, and here it does.

## What to do about it

### You are fine

Adding the confounder the reviewer named barely moves your estimate, or your study was randomised. The same two variables show this case if you switch which one is the exposure. Suppose your actual claim is that heavier cars use more fuel, and the reviewer worries that transmission confounds it.

```r
coef(lm(mpg ~ wt, data = mtcars))["wt"]
coef(lm(mpg ~ wt + am, data = mtcars))["wt"]
#>        wt 
#> -5.344472 
#>        wt 
#> -5.352811 
```

The weight coefficient goes from -5.344 to -5.353 when transmission enters, a shift of under two hundredths of one percent, so transmission is not confounding the weight effect and the finding stands. Report both models side by side so the reviewer can see the stability, which is what STROBE item 16(a) asks for. In a randomised trial the argument is even shorter: randomisation balances confounders in expectation, so you point to the balance table and the design rather than to an adjustment.

### It is fixable

You measured the confounder and left it out. Add it and report the adjusted result. The transmission comparison is this case: the 7.24 mpg advantage collapsed to -0.02 once weight entered, and weight, not transmission, carries the difference. The fix is to report the adjusted estimate and revise the claim so it no longer credits transmission with the effect. Regression adjustment is the usual remedy and its mechanics are in [Multiple Regression in R](/Multiple-Regression-in-R.html); when the groups barely overlap on the confounder, [matching or a propensity score](/Matching-and-the-Propensity-Score.html) handles it better than a single regression term. Whichever method you use, report the unadjusted and adjusted estimates together, per STROBE item 16(a), so the reader can see exactly what the adjustment did.

### It is a real problem

The confounder you need was never measured. No model can adjust for a column you do not have, and adding the confounders you do have cannot rule out that the residual difference is carried by the one you are missing. This is the genuinely hard case, and no reanalysis rescues it. The honest path has three parts. Run a sensitivity analysis that asks how strong an unmeasured confounder would have to be to explain your result away; the E-value is one such measure (VanderWeele and Ding, 2017, *Annals of Internal Medicine*). State in the Limitations that residual confounding cannot be excluded. Replace causal wording with "associated with". As an illustration, an E-value of 1.3 means a fairly modest unmeasured confounder could overturn the finding, whereas an E-value of 3.5 means only a very strong one could, and reporting that number tells the reviewer how fragile or robust the result actually is instead of leaving the question open.

## How to word your response

### If you are fine

> The reviewer asks whether transmission type confounds the association between weight and fuel economy. We refit the model with and without transmission: the weight coefficient changed from -5.34 to -5.35 mpg per 1,000 lb, a shift of well under one percent, so transmission is not confounding this estimate. We now report both the unadjusted and adjusted models (Results, page X) so the stability is visible to the reader.

### If it is fixable

> We thank the reviewer for this point. The unadjusted comparison did not account for vehicle weight, which differs markedly between the transmission groups. After adjusting for weight, the transmission effect falls from 7.24 mpg to -0.02 mpg and is no longer distinguishable from zero (p = 0.99), with weight accounting for the difference. We have revised the Results (page X) to report the unadjusted and adjusted estimates together, and have reworded the conclusion so that it no longer attributes fuel economy to transmission type.

### If it is a real problem

> We agree that residual confounding cannot be ruled out. The variable most likely to bias this comparison, engine technology, was not recorded, so we cannot adjust for it directly. We have added a sensitivity analysis reporting the E-value (Methods, page X), which shows how strong an unmeasured confounder would need to be, on both the exposure and the outcome, to account for the observed effect. We have softened the causal language throughout to describe an association, and we now state this limitation explicitly in the Discussion (page X).

## Practice

A reviewer writes: *"In these Swiss provinces, Catholic areas were both less educated and had markedly higher fertility. The reported effect of education on fertility is very likely confounded by religious denomination and should be adjusted for it."* You run the check:

```r
ex_naive <- lm(Fertility ~ Education, data = swiss)
ex_adj   <- lm(Fertility ~ Education + Catholic, data = swiss)
round(summary(ex_naive)$coefficients["Education", ], 4)
round(summary(ex_adj)$coefficients["Education", ], 4)
```

Which of the three outcomes applies, and what do you write back?

<details><summary>Click to reveal solution</summary>

Unadjusted, each extra percentage point of education is associated with a drop in the fertility index of 0.8624 (SE 0.1448, t = -5.95, p < 0.001). Adjusting for the percentage Catholic, the education coefficient moves to -0.7883 (SE 0.1293, t = -6.10, p < 0.001), a change of 8.6 percent. The estimate keeps its size, its sign, and a p-value well below 0.001.

This is the "you are fine" outcome, and the reviewer's confident framing is where the trap sits. Denomination is genuinely correlated with both education and fertility in these data, which is exactly the condition the reviewer names, yet adjusting for it barely touches the estimate and the change falls under the informal 10 percent mark. Correlation of a covariate with both the exposure and the outcome is necessary for confounding but does not guarantee the estimate will move, so the obvious reading, that a famous and clearly correlated variable must be biasing the result, is wrong here. The right reply is not to concede a problem but to report both models and note that the education effect is essentially unchanged after adjusting for denomination.

</details>
