---
title: "Missing Data Types in R: MCAR, MAR, MNAR"
slug: Missing-Data-Types-in-R-MCAR-MAR-MNAR
description: "MCAR, MAR or MNAR? The missing data mechanism you assume decides whether complete-case analysis is safe in R, what a reviewer will ask, and how to report it."
keywords: "MCAR MAR MNAR, missing data types in R, missing completely at random, missing at random, missing not at random, missing data mechanism, is complete case analysis valid"
mathjax: false
webr: true
date: 2026-08-07
curriculum_id: null
post_type: FR
fr_parent: Answering-Statistical-Reviewer-Comments.html
handbook: publishing
handbook_part: 2
handbook_chapter: 6
auto_link_terms: missing data types|MCAR MAR MNAR|missing data mechanism|missing completely at random|missing at random|missing not at random
auto_link_case_sensitive: false
difficulty: Intermediate
---

<p class="lead">MCAR, MAR and MNAR name three reasons a value can go missing, and the one you assume decides whether it is safe to drop the incomplete rows. R deletes them for you without asking, which quietly commits you to the strongest of the three assumptions. The choice settles whether your estimates are unbiased, whether imputation can rescue them, or whether the honest move is to soften the claim.</p>

## The decision you are making

You are deciding why the values in your dataset are missing, and you are deciding it because that reason, and nothing else, tells you whether the analysis is allowed to ignore them. There are three answers on offer, usually written as missing completely at random (MCAR), missing at random (MAR), and missing not at random (MNAR) (Rubin, 1976). The names are unhelpful at first glance, so keep the plain version to hand: the question is whether the chance of a value going missing depends on nothing at all, on variables you did record, or on the missing value itself.

This is not a decision you get to postpone. When you fit a model in R, any row with a missing value in a model variable is dropped before estimation, silently, and the fit proceeds on what is left. Doing nothing is therefore not neutral. It is a decision to treat the missingness as MCAR, the most demanding of the three assumptions, whether or not you ever write the word down. The base functions for finding and counting those `NA` values are covered in [Missing Values in R](/Missing-Values-in-R-Detect-Count-Remove-Impute-NA.html); this chapter is about the assumption you make once you have counted them.

What the assumption buys you, or costs you, is the validity of the result. Under MCAR the rows that survive are a fair random sample of the rows you started with, so the estimates are unbiased and you have only lost some precision. Under MAR they are not a fair sample, but the imbalance is fully explained by variables you observed, so it can be corrected. Under MNAR the imbalance is driven by values you never saw, and no amount of modelling on the observed data can fully undo it. The same complete-case regression is thus either fine, fixable, or misleading, and which one holds depends entirely on a reason you have to argue rather than read off the screen.

## What the options are

Three mechanisms cover every reason a value can be missing, and they line up on a single question: what does the chance of being missing depend on?

| Mechanism | Missingness depends on | Everyday example | Complete-case analysis is | What the assumption licenses |
|---|---|---|---|---|
| MCAR (missing completely at random) | Nothing you could measure or imagine | A vial is dropped in the lab and one blood test is lost | Unbiased, only less precise | Complete-case analysis; imputation optional, for precision |
| MAR (missing at random) | Other variables you did record | Older patients skip the cognitive test, and age is in your data | Biased, but recoverably so | Multiple imputation, or a model that conditions on the observed variables |
| MNAR (missing not at random) | The missing value itself | The sickest patients stop attending, and their health is what went unrecorded | Biased, and not recoverable from the observed data | Sensitivity analysis and an honest limitation; sometimes a mechanism model |

The names describe a ladder of how much trouble you are in, and the rung you are on is set by one distinction. MCAR sits apart from the other two: it is the only mechanism under which the recorded rows are a fair sample of all the rows, which is why it is also the only one under which doing nothing is safe. MAR and MNAR both bias a complete-case analysis, and they differ only on whether the thing driving the missingness sits inside your dataset or outside it.

That difference, between missingness explained by variables you observed and missingness explained by the missing values themselves, separates a problem you can fix from one you can only disclose. It is also the one distinction the data cannot draw for you, and the next section shows why.

## How to decide

You cannot test which mechanism you are in, not fully, and pretending otherwise is the commonest mistake in this whole area. What you can do is split the question into a part the data can answer and a part only you can.

The answerable part is whether missingness depends on other variables you observed. If the records with a missing value differ systematically from the complete records on something you did measure, the missingness is not completely at random, and MCAR is off the table. `airquality`, built into R, has 37 days with no ozone reading, so a natural check is whether those days differ in temperature, which was recorded on every day.

```r
aq <- airquality
aq$oz_missing <- is.na(aq$Ozone)
c(missing = sum(aq$oz_missing), observed = sum(!aq$oz_missing))
#>  missing observed
#>       37      116
tt <- t.test(Temp ~ oz_missing, data = aq)
round(c(temp_when_observed = unname(tt$estimate[1]),
        temp_when_missing  = unname(tt$estimate[2]),
        p_value            = tt$p.value), 3)
#> temp_when_observed  temp_when_missing            p_value
#>             77.871             77.919              0.979
```

The days that lost an ozone reading averaged 77.9 degrees, and so did the days that kept one, with a p-value of 0.979. There is no sign that a missing ozone value has anything to do with the temperature that day, which is what you would expect if the monitor failed for reasons unconnected to the weather. That is evidence for MCAR, not proof of it, because the test can only rule MCAR out: a real dependence on some variable you left out of the check would sit here undetected. Run the comparison against every observed predictor before you rely on it, and read a low p-value as a firm "not MCAR" and a high one as "no evidence against, so far".

The unanswerable part is whether missingness depends on the missing value itself. This is the line between MAR and MNAR, and it is untestable in principle, because the values you would need in order to test it are the ones you do not have. A short construction shows how invisible the problem is. Take 400 blood-pressure readings, and suppose the quarter of patients with the highest pressure are exactly the ones who miss the follow-up visit, so their readings never get recorded.

```r
set.seed(42)
n <- 400
bp <- rnorm(n, mean = 140, sd = 15)
recorded <- bp < quantile(bp, 0.75)
bp_obs <- ifelse(recorded, bp, NA)
round(c(true_mean         = mean(bp),
        completecase_mean = mean(bp_obs, na.rm = TRUE),
        bias              = mean(bp_obs, na.rm = TRUE) - mean(bp)), 2)
#>         true_mean completecase_mean              bias
#>            139.88            133.72             -6.16
```

The complete-case mean is 133.72 against a true mean of 139.88, low by more than 6 mmHg, because the highest readings are the ones that went missing. What makes this dangerous is that nothing in the recorded data can reveal it. Every check from the block above would come back clean, since the only variable that predicts missingness here is blood pressure, and blood pressure is precisely what you failed to record for those patients. Deciding between MAR and MNAR therefore comes down to knowing how the numbers were generated: did people fail to report for reasons captured by your other columns, or for reasons tied to the answer they would have given? That is a judgement about how the study was run, and it belongs in your head and your Methods section rather than in a test statistic.

## What reviewers will ask about this later

The mechanism you assume now is the thing a reviewer works backward from later, so this decision sets up its own defence. The most direct descendant is the comment that your missing data handling is not described, which asks for the extent of the missingness and the method used to address it; wording that reply is its own chapter, [Missing Data Reporting in Peer Review](/Missing-Data-Reporting-in-Peer-Review.html). A reviewer who accepts an MCAR or MAR assumption will still want it justified rather than asserted, and if you claimed MAR they will look for the imputation or adjustment the assumption is supposed to license.

Where the missingness came from dropout, expect the question to arrive as [Selection Bias in Peer Review](/Selection-Bias-in-Peer-Review.html) instead, because a sample thinned by who stayed is a selected sample by another name. Any MNAR situation invites a demand for a sensitivity analysis, since a result that rests on an untestable assumption should be probed by asking how far it moves under a different one, which is the subject of [Sensitivity Analysis in R](/Sensitivity-Analysis-in-R.html). Choosing the assumption deliberately, and recording why, is what lets you answer all three without going back to collect more data.

## How to report it

Name the mechanism you assumed, and say why. STROBE asks observational studies to "explain how missing data were addressed", which is item 12(c), and the way to meet it is to report the amount missing per variable, the assumption you made about the reason, and the method that assumption justifies (von Elm et al., 2007). One sentence usually carries all three, and a reader can tell at once whether you thought about the problem or stepped around it.

Report the method the assumption licenses, and nothing stronger. Under MCAR a complete-case analysis stands on its own, as long as you state that is what you did. Under MAR, complete-case analysis is not enough, and multiple imputation is the standard remedy, with the workflow covered in [Multiple Imputation with mice in R](/Multiple-Imputation-mice-in-R.html). Under MNAR no method is a clean fix, so the honest report presents a complete-case or imputed estimate as conditional, adds a sensitivity analysis, and states in the limitations that the true value could be off in a known direction (Little and Rubin, 2019). Two Methods sentences show the register:

> Missing values were limited to the outcome (12% of records) and one covariate (3%). Because the incomplete records did not differ from the complete records on the measured baseline variables, we treated the data as missing at random and used multiple imputation by chained equations, pooling estimates across the imputed datasets.

> Follow-up blood pressure was missing for 18% of patients, and because non-attendance was plausibly related to the patients' own health, we could not rule out a missing-not-at-random mechanism. We report the complete-case estimate as applying to patients who attended, present an imputed analysis as a sensitivity check, and note in the Discussion that the true mean could be higher than reported.

Neither sentence argues that the missingness was harmless. Each states how much was missing, what was assumed about why, and what was done as a result, which are the three facts a reviewer checks for before deciding whether to trust the sample the numbers came from.
