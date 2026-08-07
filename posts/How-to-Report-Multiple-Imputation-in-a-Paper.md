---
title: "How to Report Multiple Imputation in a Paper"
slug: How-to-Report-Multiple-Imputation-in-a-Paper
description: "You ran multiple imputation and a reviewer wants it described. Report the amount missing, the imputation model, the number of imputations, and Rubin's rules."
keywords: "how to report multiple imputation, reporting multiple imputation in a paper, multiple imputation methods section, number of imputations to report, Rubin's rules reporting, mice reporting, fraction of missing information"
mathjax: false
webr: true
date: 2026-08-07
curriculum_id: null
post_type: FR
fr_parent: Answering-Statistical-Reviewer-Comments.html
handbook: publishing
handbook_part: 2
handbook_chapter: 7
auto_link_terms: reporting multiple imputation|how to report multiple imputation|multiple imputation methods section|number of imputations|fraction of missing information
auto_link_case_sensitive: false
difficulty: Intermediate
---

<p class="lead">A reviewer never sees your imputed datasets. They see a few sentences in your Methods, and those sentences decide whether multiple imputation reads as a rigorous fix or an unaccountable black box. What belongs in them is well settled: how much data were missing, the model that did the imputing, how many imputations you ran, and that the results were pooled by Rubin's rules. Running the imputation is a separate job; the report is where it is accepted or doubted.</p>

## The decision you are making

By the time multiple imputation is on the table, an earlier decision has already been made: that the missing values are not ignorable, so dropping the incomplete rows would bias the result. Working out which missing-data mechanism you are in, and why that rules out complete-case analysis, is its own decision, covered in [Missing Data Types in R: MCAR, MAR, MNAR](/Missing-Data-Types-in-R-MCAR-MAR-MNAR.html). The decision here is narrower and comes later: given that you imputed, what do you put in the paper so a reviewer can judge whether the imputation was done well?

It carries more weight than for most methods because of how the answer is produced. The reader is not looking at your data, they are looking at a result pooled across several imputed copies of it, and none of those copies appears in the paper. So the description does the work that a raw table would otherwise do. A regression on the observed rows can be scrutinised on its own, whereas a pooled estimate means nothing until you say how many imputations it pools, what the imputation model contained, and how the results were combined. Leave those out and an experienced reviewer does not assume the best. They assume the choices were omitted because they would not survive being stated.

The reportable set is small and fixed. You need the amount of data missing and where, the imputation method and the software that ran it, the variables that went into the imputation model, the number of imputations, and the rule used to pool the estimates (Sterne et al., 2009). For observational studies this is a requirement rather than a courtesy, because STROBE item 12(c) asks authors to explain how missing data were addressed, and a one-line "values were imputed" does not meet it (von Elm et al., 2007). Running the imputation itself, with the mice package, is a separate job covered step by step in [Multiple Imputation with mice in R](/Multiple-Imputation-mice-in-R.html). What remains is turning the finished imputation into a paragraph a reviewer will accept.

## What the options are

Reporting multiple imputation is a handful of small decisions, and each has an answer that holds up and one or two that a reviewer will catch. They are the same whichever package produced the imputation.

| The reporting decision | The answer that gets caught | The defensible answer | Source |
|---|---|---|---|
| How many imputations to run | Three to five, from a rule of thumb that predates fast computers | At least the percentage of incomplete cases, so tens of imputations rather than a handful | White, Royston & Wood (2011) |
| Which variables enter the imputation model | Only the predictors, with the outcome left out to avoid "circularity" | Every variable in the analysis, the outcome included, plus any auxiliary predictors of missingness | White et al. (2011); Sterne et al. (2009) |
| How the results were pooled | Averaging the point estimates, or reporting a single imputed dataset | Rubin's rules, which combine the estimates and widen the standard error for the imputation uncertainty | Rubin (1987) |
| What to say about the amount missing | "Some data were missing" | The number or percentage missing for each variable | STROBE 12(c) (von Elm et al., 2007) |
| Whether to show it changed the answer | The imputed result alone | The imputed estimate next to the complete-case estimate, as a consistency check | Sterne et al. (2009) |

Two of these are where papers actually lose credit. The first is the number of imputations, because the old advice of three to five dates from a time when each imputation was expensive, and current guidance ties the count to how much is missing, so a study with a quarter of its cases incomplete should run something in the tens (White et al., 2011). The second is the outcome variable. It feels wrong to impute predictors using the very thing you are about to predict, so people leave the outcome out, but excluding it biases the imputed associations toward zero, which is why the guidance is emphatic that the outcome belongs in the imputation model (White et al., 2011). A reviewer who knows the area checks for both.

## How to decide

The numbers you report come straight out of the imputation, and the task is knowing which ones to pull. Take `airquality`, built into R, and suppose the analysis is a regression of ozone on solar radiation, wind and temperature. Two of those variables carry missing values, so start by measuring how much.

```r
aq <- airquality
colSums(is.na(aq))
#>   Ozone Solar.R    Wind    Temp   Month     Day
#>      37       7       0       0       0       0
n_incomplete <- sum(!complete.cases(aq))
c(rows = nrow(aq),
  complete = sum(complete.cases(aq)),
  incomplete = n_incomplete,
  pct_incomplete = round(100 * n_incomplete / nrow(aq), 1))
#>           rows       complete     incomplete pct_incomplete
#>          153.0          111.0           42.0           27.5
```

Thirty-seven ozone readings and seven solar-radiation readings are missing, and 42 of the 153 days, or 27.5%, are incomplete on at least one variable. That percentage is the first thing to report, and it also sets the number of imputations: with about a quarter of cases incomplete, the incomplete-cases rule of thumb wants a count in the high twenties, so 50 is a safe, defensible choice (White et al., 2011). Now run the imputation and pool the fitted models. The mechanics of that call, and how to check the imputations are sensible, are the subject of [Multiple Imputation with mice in R](/Multiple-Imputation-mice-in-R.html); here it is only the road to the reportable numbers.

```r
library(mice)
set.seed(2026)
imp <- mice(airquality, m = 50, printFlag = FALSE)
fit <- with(imp, lm(Ozone ~ Solar.R + Wind + Temp))
pooled <- pool(fit)
res <- summary(pooled)
report <- data.frame(term      = as.character(res$term),
                     estimate  = round(res$estimate, 3),
                     std.error = round(res$std.error, 3),
                     p.value   = round(res$p.value, 4),
                     fmi       = round(pooled$pooled$fmi, 3))
report
#>          term estimate std.error p.value   fmi
#> 1 (Intercept)  -61.597    23.478  0.0103 0.334
#> 2     Solar.R    0.057     0.022  0.0111 0.191
#> 3        Wind   -3.119     0.681  0.0000 0.348
#> 4        Temp    1.591     0.248  0.0000 0.266
```

Each row is a pooled coefficient: the estimate averaged over the 50 imputations, the standard error that Rubin's rules widen to account for the imputation, and the fraction of missing information (`fmi`), which is the share of the uncertainty in that coefficient that traces to the missing data rather than the observed data. Wind loses about 35% of its information to missingness and temperature about 27%. The fmi is worth reporting because it justifies the count after the fact: the largest value here is 0.35, and a common rule puts the number of imputations near a hundred times that, about 35, so 50 clears both it and the incomplete-cases rule and a reviewer can see the choice was not arbitrary (White et al., 2011). The last thing to compute is whether the imputation changed the conclusion at all, by fitting the same model on the complete rows alone.

```r
cc <- lm(Ozone ~ Solar.R + Wind + Temp, data = airquality)
cc_wind <- coef(summary(cc))["Wind", c("Estimate", "Std. Error")]
mi_wind <- as.numeric(report[report$term == "Wind", c("estimate", "std.error")])
compare <- rbind(complete_case       = c(cc_wind[1], cc_wind[2]),
                 multiple_imputation = mi_wind)
colnames(compare) <- c("estimate", "std.error")
round(compare, 3)
#>                     estimate std.error
#> complete_case         -3.334     0.654
#> multiple_imputation   -3.119     0.681
```

The wind coefficient barely moves, from -3.334 on the complete rows to -3.119 after imputation, and its standard error rises slightly, from 0.654 to 0.681. That rise is not a defect: multiple imputation is not there to tighten your estimates, it is there to stop the standard error pretending the imputed values were known, so a small increase is what a sound imputation produces when the missingness is mild. Because the two estimates agree, you can write that the conclusion does not depend on the imputation, and a reviewer worried about the missing data will read that comparison before anything else.

## What reviewers will ask about this later

The way you report the imputation now decides which objections you have already answered. The most direct one is that your missing-data handling is not described, which asks for the extent of the missingness and the method used to address it; a full report closes it before it is raised, and wording the reply when it is raised anyway is its own chapter, [Missing Data Reporting in Peer Review](/Missing-Data-Reporting-in-Peer-Review.html). A reviewer who accepts that you imputed will still want the missing-at-random assumption justified rather than asserted, since multiple imputation is only valid under it, and that justification is the decision covered in [Missing Data Types in R: MCAR, MAR, MNAR](/Missing-Data-Types-in-R-MCAR-MAR-MNAR.html).

Two harder questions arrive when the missingness came from people dropping out. If patients left the study for reasons tied to their own outcomes, a reviewer may frame it as [Selection Bias in Peer Review](/Selection-Bias-in-Peer-Review.html), because a sample thinned by who stayed is a selected sample whether or not you imputed the gaps. And any residual doubt that the data are missing not at random invites a demand to show how far the result moves under a different assumption, which is a [Sensitivity Analysis in R](/Sensitivity-Analysis-in-R.html). Reporting the imputation in full, including the complete-case comparison, is what lets you meet all of these without going back to collect more data.

## How to report it

Name the amount missing, the method, the model, the count and the pooling rule, and do it in the order a reviewer reads for. Sterne and colleagues set out exactly this list as the reporting standard for multiple imputation, and the point of following it is that a reader can reconstruct what you did from the paragraph alone (Sterne et al., 2009). Two Methods paragraphs show the register, one for the clean case and one where the missingness is more troubling.

> Missing values affected the primary outcome (14% of participants) and two covariates (6% and 3%). Assuming the data were missing at random conditional on the observed variables, we used multiple imputation by chained equations to create 50 imputed datasets in R with the mice package, including all analysis variables and the outcome in the imputation model. The regression was fitted within each dataset and the estimates pooled by Rubin's rules; the largest fraction of missing information was 0.31. Complete-case and imputed estimates agreed closely, so the conclusions did not depend on the imputation.

> Follow-up was missing for 21% of participants. Because non-attendance was plausibly related to the participants' own health, we could not rule out a missing-not-at-random mechanism. We report the multiple-imputation estimate as the primary analysis, present the complete-case estimate alongside it as a sensitivity check, and note in the Discussion that the true effect could lie further from the null than the reported figure suggests.

Neither paragraph argues that the missingness was harmless, and the second one openly concedes that the imputation may not have solved the problem. That is the register to aim for, because a reviewer trusts a report that states its own limits sooner than one that insists everything is fine. A bare "missing data were imputed" gives them nothing to check, and increasingly it is that omission, not the imputation itself, that draws the request to describe the method properly (Sterne et al., 2009).
