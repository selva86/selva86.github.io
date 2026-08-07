---
title: "Influential Observations in R: Cook's Distance"
slug: Influential-Observations-in-R
description: "A reviewer flags an influential observation with a high Cook's distance. How to decide in R whether to keep, down-weight, or drop the point, and report it."
keywords: "influential observations in R, Cook's distance, influential observation, high Cook's distance, influential data points, leave-one-out sensitivity, robust regression, drop influential point"
mathjax: false
webr: true
date: 2026-08-07
curriculum_id: null
post_type: FR
fr_parent: Answering-Statistical-Reviewer-Comments.html
handbook: publishing
handbook_part: 3
handbook_chapter: 12
auto_link_terms: influential observations|influential observation|Cook's distance|influential data points|leave-one-out sensitivity|high-influence observation
auto_link_case_sensitive: false
difficulty: Intermediate
---

<p class="lead">An influential observation is a single row that pulls your regression noticeably toward itself, and Cook's distance is the number that measures how far. When a diagnostic or a reviewer flags one, the decision is not whether to delete it but whether it changes anything: you keep it, correct it, down-weight it, or drop it with a stated reason, and either way you show the reader the model with and without it.</p>

## The decision you are making

By the time this is useful the check has already run. Either you fitted the model and looked at the diagnostics yourself, or a reviewer did, and one or more rows came back with a Cook's distance large enough to notice. The mechanics of getting there, the five diagnostic plots and how leverage and residual size combine into a single influence number, are laid out in [Regression Diagnostics in R](/Regression-Diagnostics-in-R.html), so this chapter starts one step later, when the number is in front of you and the question is what to do with it.

A large Cook's distance is a reason to look, not a reason to delete, and the difference is the whole chapter. An influential point can be a data-entry error, a case drawn from a different population than the one you meant to study, or a completely valid observation that happens to sit in a sparse corner of the predictor space where any single point has room to swing the line. Those three call for three different actions, and the diagnostic cannot tell them apart (Belsley, Kuh & Welsch, 1980). Which of the three you are looking at is something you work out from the data and the record behind it, not from the size of the number.

One move is off the table whatever the point turns out to be. Dropping an influential observation because the result you wanted appears once it is gone is not a data decision, it is a results decision, and it inflates false positives the same way choosing an analysis after seeing the data does (Simmons, Nelson & Simonsohn, 2011). A reviewer who suspects a point was removed to rescue significance will trust nothing else in the paper, so any deletion has to stand on a reason that has nothing to do with what it does to your p-value.

## What the options are

You have four honest responses to an influential point, and which one is defensible depends entirely on why the point is unusual.

| Option | When it is the right call | What you show a reviewer |
|---|---|---|
| Keep it | The conclusion holds with the point in and with it out | The with-and-without comparison, so they see the estimate barely moves |
| Investigate and correct | The value is a recording or entry error you can verify | The corrected value and its source, never a silent deletion |
| Down-weight it | Genuine extreme values you will not delete but do not want dominating the fit | Robust and least-squares estimates side by side (Venables & Ripley, 2002) |
| Drop it with a reason | The case falls outside your study's target population on a criterion fixed in advance | The criterion, decided before you looked at its effect on the estimate |

The first row settles most cases, because keeping the point is the easiest position to defend once the numbers back it. If the model says the same thing with the point in and with it out, the influence is real but immaterial, and a reviewer who can see both fits has nothing left to object to. The hard cases are the ones where the conclusion does depend on the point, and those are not settled by argument but by running the comparison, which is what the next section does.

## How to decide

The deciding question is not how large Cook's distance is but whether the substantive answer survives leaving the point out. That is one refit and one comparison, and it works the same way whatever flagged the point in the first place. Take a model for fuel economy in `mtcars`, regressing miles per gallon on weight and horsepower, and find the most influential row.

```r
full <- lm(mpg ~ wt + hp, data = mtcars)
cd   <- cooks.distance(full)
top1 <- names(which.max(cd))
top1
round(c(cooks_D = max(cd), threshold = 4 / nrow(mtcars)), 3)
#> [1] "Chrysler Imperial"
#>   cooks_D threshold 
#>     0.424     0.125 
```

Chrysler Imperial has a Cook's distance of 0.424, more than three times the common 4/n rule-of-thumb cutoff of 0.125, so on every threshold a textbook offers this is a point you are told to worry about. Whether the worry is warranted is a question the cutoff cannot answer on its own. Refit without the row and compare the coefficient that carries the story.

```r
drop1 <- lm(mpg ~ wt + hp, data = mtcars[rownames(mtcars) != top1, ])
round(rbind(
  full    = coef(summary(full))["wt", c("Estimate", "Std. Error", "Pr(>|t|)")],
  dropped = coef(summary(drop1))["wt", c("Estimate", "Std. Error", "Pr(>|t|)")]
), 4)
#>         Estimate Std. Error Pr(>|t|)
#> full     -3.8778     0.6327        0
#> dropped  -4.4197     0.6162        0
```

Dropping the most influential car moves the weight coefficient from -3.88 to -4.42 and leaves its standard error almost untouched, and both fits stay significant far below the 0.001 level, which is why the p-value column rounds to zero at four decimals. The point is nudging the estimate, but the finding that heavier cars burn more fuel is identical with it in or out. A conclusion this stable is one you keep the point in and report that you checked.

A robust fit gives a second, independent read on the same question. `rlm` down-weights unusual rows automatically instead of removing them, so if it disagrees with ordinary least squares you know the extreme cases were steering the line.

```r
library(MASS)
rob <- rlm(mpg ~ wt + hp, data = mtcars)
round(rbind(OLS = coef(full), robust = coef(rob)), 3)
w <- setNames(rob$w, rownames(mtcars))
round(w[top1], 3)
#>        (Intercept)     wt     hp
#> OLS         37.227 -3.878 -0.032
#> robust      36.584 -3.880 -0.029
#> Chrysler Imperial 
#>             0.483 
```

The robust fit cut Chrysler Imperial's weight to 0.483, roughly half that of an ordinary car, yet the robust coefficients land on top of the least-squares ones, with weight at -3.880 against -3.878. When the estimator that trusts the point least still agrees with the one that trusts it fully, the point is not distorting anything, so keeping it costs you nothing.

Now the same procedure pointing the other way. The Swiss fertility data holds one province, Geneva, that is far more urban and less agricultural than any other, and regressing fertility on the percentage of men in agriculture puts a lot of weight on it.

```r
sw      <- lm(Fertility ~ Agriculture, data = swiss)
sw_top  <- names(which.max(cooks.distance(sw)))
sw_drop <- lm(Fertility ~ Agriculture, data = swiss[rownames(swiss) != sw_top, ])
sw_top
round(rbind(
  full    = coef(summary(sw))["Agriculture", c("Estimate", "Pr(>|t|)")],
  dropped = coef(summary(sw_drop))["Agriculture", c("Estimate", "Pr(>|t|)")]
), 4)
#> [1] "V. De Geneve"
#>         Estimate Pr(>|t|)
#> full      0.1942   0.0149
#> dropped   0.1334   0.0902
```

With Geneva in, the association between agriculture and fertility is positive and significant at p = 0.015; drop it and the coefficient falls by about a third while the p-value climbs to 0.090, past the conventional line. Geneva is a real canton, not a typo, so there is nothing to correct and no honest reason to delete it. The correct reading is that the association is not robust: it rests on one influential point, and a paper reporting the full-sample p = 0.015 as a settled result would be claiming more than the data support. When the leave-one-out refit changes your answer, the answer was never as firm as the first fit made it look, and the honest response is to report both and say which one the reader should lean on.

## What reviewers will ask about this later

Deciding what to do with an influential point sets up the next round of questions, and each path leads to a specific one. If you kept the point, a reviewer may still ask whether the model shape is right, because a point looks influential partly when the line is bent in a way the model cannot follow, which is the ground covered by [Non-Normal Residuals in Peer Review](/Non-Normal-Residuals-in-Peer-Review.html) and [Nonlinear Relationships in Peer Review](/Nonlinear-Relationships-in-Peer-Review.html). If you dropped the point, expect the objection set out in [Outlier Removal in Peer Review](/Outlier-Removal-in-Peer-Review.html), which is this same decision seen from the reviewer's chair and turns on whether your removal criterion was fixed before you saw the effect. If you down-weighted it, the follow-up is why that estimator and what it assumes, answered in [Robust Regression in R](/Robust-Regression-in-R.html).

The request that arrives whichever path you took is for the comparison itself. A reviewer wants the model with and without the point, and presenting it as a planned [sensitivity analysis](/Sensitivity-Analysis-in-R.html) rather than as a concession answers the question before it is asked. Where the influence traces to a handful of extreme outcome values rather than one row, the discussion widens into [model fit](/Model-Fit-Statistics-in-Peer-Review.html) and whether a different specification would describe the data better than the one you are patching one point at a time.

## How to report it

An influential observation belongs in the statistical methods paragraph whenever it touched a decision, and reporting guidelines treat the with-and-without check as a sensitivity analysis you are expected to describe rather than an optional extra (STROBE item 12e; von Elm et al., 2007; Lang & Altman, 2015). Three situations cover almost everything, and each has a form that closes the question. First, the point you kept because the model was stable without it.

> Diagnostic checks flagged one influential observation (Cook's distance 0.42, above the 4/n threshold). Refitting without it changed the weight coefficient from -3.88 to -4.42, with both estimates significant at p < 0.001, so the observation was retained and the model is reported on the full sample. A robust regression down-weighting extreme cases returned materially identical estimates (Methods, page X).

Second, the extreme values you chose to down-weight instead of remove, where robust and ordinary estimates agree closely enough that the choice between them does not change the conclusion.

> Two observations exerted disproportionate influence on the fit. Rather than remove them, we re-estimated the model with robust (M-) regression, which down-weights extreme cases automatically. The robust and least-squares coefficients agreed to within a few percent, so we report the least-squares model and provide the robust fit as a sensitivity check (Methods, page X).

Third, the honest case, where a valid point carries the result and there are no grounds to remove it.

> The association was significant in the full sample (p = 0.015) but not after excluding a single high-influence observation (p = 0.090). Because that observation is a valid case with no basis for removal, we report both analyses and describe the association as sensitive to its inclusion rather than as an established effect (Methods, page X).

All three name the point, say what leaving it out did to the estimate, and state the decision that followed from that. Report the comparison even in the first case, where the point was kept, because a reviewer cannot tell a checked-and-stable model from one that was never checked unless the numbers are on the page. Showing both fits, whichever way they came out, is ordinary practice for this kind of check, and it leaves a reviewer holding the same evidence you used to decide.
