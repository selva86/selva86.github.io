---
title: "Missing Data Reporting in Peer Review"
slug: Missing-Data-Reporting-in-Peer-Review
description: "A reviewer says your missing data handling is not described. How to count what is missing in R, defend or fix complete-case analysis, and word each reply."
keywords: "missing data handling not described, how were missing data addressed, reviewer wants missing data reporting, complete-case analysis reviewer, missing data not reported, multiple imputation reviewer comment, listwise deletion regression"
mathjax: false
webr: true
date: 2026-08-07
curriculum_id: null
post_type: FR
fr_parent: Answering-Statistical-Reviewer-Comments.html
handbook: publishing
handbook_part: 9
handbook_chapter: 53
auto_link_terms: missing data handling not described|missing data not reported|how missing data were addressed|complete-case analysis|missing data reviewer comment|reporting missing data
auto_link_case_sensitive: false
difficulty: Intermediate
---


<p class="lead">When a reviewer says your missing data handling is not described, they are usually not questioning the analysis you ran. They are pointing out that the paper never says how much data was missing, why, or what happened to the incomplete records, so a reader cannot tell whether the result rests on the whole sample or on a self-selected slice of it. Most of the time this is a reporting gap you can close with a few numbers you already have, because the software quietly dropped the incomplete rows and fit the model on what was left. This chapter shows how to count what is missing in R, decide whether dropping it was safe, and word the reply for each situation you might be in.</p>

## What the reviewer wrote

> The authors do not appear to state how missing data were handled. It would help to know the extent of missingness and the method used to address it.

> There is no mention of missing data anywhere in the Methods. Were incomplete records simply dropped?

> The cohort is described as 153 observations, yet the regression in Table 2 reports 111. That discrepancy is not explained, and more generally the manuscript is silent on how missingness was treated, which the reader needs in order to interpret the estimates.

## What they actually mean

The reviewer is asking for three facts the manuscript left out: how much of each variable was missing, why it was missing as far as you can tell, and what your analysis did with the incomplete records. They are not, in most cases, asking you to rerun everything with a heavier method. The request is often misread as an instruction to use multiple imputation, when what usually satisfies it is a plain statement that, say, a quarter of the outcome was missing, the missing cases resembled the observed ones, and the model was fit on complete cases. Where the phrasing does demand a change of method it tends to say so; absent that, treat it as a reporting request first.

## Why they are asking

The default in R is listwise deletion: any row with a missing value in a model variable is dropped before fitting, and it happens without a warning. If the reason a value is missing has nothing to do with the analysis, deleting those rows costs precision but leaves the estimates unbiased, so the loss is tolerable. The trouble starts when missingness is tied to the variables in the model, because then the rows that remain are no longer a fair picture of the whole: if the sickest patients are the ones who dropped out, a complete-case analysis describes the healthier ones who stayed, and the effect you report is the effect in that subgroup rather than in the population. Whether deletion is safe therefore depends on which of these you are in, a distinction usually framed as missing completely at random, missing at random, and missing not at random (Little and Rubin, 2019); the mechanics of that taxonomy and of imputation live in [Multiple Imputation with mice in R](/Multiple-Imputation-mice-in-R.html), so this chapter takes them as read. Reporting how the missingness was handled is also a standard requirement rather than a courtesy, since the STROBE guidance for observational studies makes it item 12(c), "explain how missing data were addressed", and the APA reporting standards ask for the frequency of missing values and the method used to deal with them (Appelbaum et al., 2018). So the reviewer's request reduces to one question you can answer with the data in front of you: is the missingness in your study the harmless kind or the biasing kind?

## How to check it

Start by counting what is missing and where. `airquality`, built into R, has the classic shape of the problem: daily air-quality readings where some measurements did not come back. The base functions for detecting and counting `NA` are covered in [Missing Values in R](/Missing-Values-in-R-Detect-Count-Remove-Impute-NA.html); here we go straight to the count.

```r
colSums(is.na(airquality))
#>   Ozone Solar.R    Wind    Temp   Month     Day 
#>      37       7       0       0       0       0
```

Ozone is missing on 37 of the 153 days and Solar.R on 7, while wind and temperature are complete. Now fit the model you would report, a regression of ozone on the other three measurements, and ask how many rows it actually used.

```r
model <- lm(Ozone ~ Solar.R + Wind + Temp, data = airquality)
c(rows_in_data = nrow(airquality), rows_used = nobs(model))
#> rows_in_data    rows_used 
#>          153          111
```

The data has 153 rows and the model fit on 111. R dropped the 42 rows missing any of the four variables before it estimated a single coefficient, and it gave no warning. That 42-row gap is what the reviewer spotted between the sample size and the analysis, and it is the first thing to put in the paper. The coefficients below come from those 111 complete cases.

```r
round(summary(model)$coefficients, 4)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept) -64.3421    23.0547 -2.7908   0.0062
#> Solar.R       0.0598     0.0232  2.5800   0.0112
#> Wind         -3.3336     0.6544 -5.0941   0.0000
#> Temp          1.6521     0.2535  6.5164   0.0000
```

In the complete-case fit, solar radiation, wind and temperature each predict ozone significantly. But would they still hold if the 42 missing days came back? That is a question about days you cannot see, and the next section builds a case about them anyway.

## What to do about it

### You are fine

Complete-case analysis is not a second-class method. When the rows you dropped look like the rows you kept, deleting them throws away some precision and nothing else, and reporting that honestly is all the situation needs. You can show the dropped rows are unremarkable by comparing them against the kept rows on the variables you do observe.

```r
aq <- airquality
aq$dropped <- !complete.cases(aq)
aggregate(cbind(Wind, Temp) ~ dropped, data = aq, FUN = mean)
#>   dropped     Wind     Temp
#> 1   FALSE  9.93964 77.79279
#> 2    TRUE 10.00476 78.11905
```

The 42 dropped days and the 111 kept days have almost identical average wind (9.94 on the kept days against 10.00 on the dropped) and temperature (77.79 against 78.12). Nothing about the days that lost an ozone reading marks them out as unusual weather, which is what you would expect if the monitor failed for reasons that have nothing to do with pollution. This does not prove the missingness is harmless, because you can never compare the ozone values you did not observe, but it is real evidence and in my experience it is the kind reviewers accept. That evidence lets you keep the complete-case model as your primary result, provided you report the missing counts and this comparison beside it.

### It is fixable

When more is missing, or when the reviewer wants more than a bare complete-case result, the fix is to show that the conclusion does not hinge on how the incomplete rows were handled. One quick check refits the model while conditioning on fewer of the incomplete variables, which changes the analysis sample. Solar.R accounts for only 7 of the missing values, so a model of ozone on wind and temperature alone keeps 116 days instead of 111.

```r
reduced <- lm(Ozone ~ Wind + Temp, data = airquality)
c(full_rows = nobs(model), reduced_rows = nobs(reduced))
#>    full_rows reduced_rows 
#>          111          116 
round(rbind(full = coef(model)[c("Wind", "Temp")],
            reduced = coef(reduced)[c("Wind", "Temp")]), 3)
#>           Wind  Temp
#> full    -3.334 1.652
#> reduced -3.055 1.840
```

Adding those five days and dropping solar radiation moves the wind coefficient from -3.334 to -3.055 and the temperature coefficient from 1.652 to 1.840, and both stay significant far beyond the usual threshold. The estimates shift a little because the sample and the specification changed together, yet the substance does not: calmer, warmer days carry more ozone either way. If the reviewer wants the stronger check, multiple imputation refits the model across several completed datasets and pools the results, and the workflow is in [Multiple Imputation with mice in R](/Multiple-Imputation-mice-in-R.html); report the pooled estimate next to the complete-case one so the reader can see the two agree. Either way, the reader now sees the deletion and sees that the result does not depend on it.

### It is a real problem

Sometimes the deletion is not safe, and reporting it will show as much. Suppose a trial follows 200 patients but the outcome is missing for 60, and those 60 are disproportionately the ones who deteriorated and stopped attending. (No built-in dataset carries a failure this clean, so read these numbers as an illustration.) The 140 complete cases are then the patients who did well, and any effect estimated on them describes a healthier group than the one the trial enrolled. Imputation cannot fully rescue this, because the information needed to model the missingness left with the patients who withdrew. The honest response is to report the missing fraction and its likely cause, present the complete-case result as applying to those who completed follow-up, and add a limitation stating that the estimate may not carry over to patients who dropped out. If the paper's headline claim rested on the full enrolled sample, that claim has to be softened until it matches what the retained sample can actually support.

## How to word your response

### If you are fine

> The reviewer notes that missing data handling was not described. Missing values were confined to the outcome (37 of 153 observations) and one predictor (7 of 153), with the remaining variables complete. The dropped cases did not differ meaningfully from the retained cases on the observed predictors (mean wind 10.0 versus 9.9, mean temperature 78.1 versus 77.8), consistent with missingness unrelated to the analysis. The model was fit on complete cases, and we now state this, together with the counts and the comparison, in the Methods (page X).

### If it was fixable

> The reviewer asks how missing data were handled and whether the result is robust to that choice. We now report that the analysis used complete cases (111 of 153) and have added a sensitivity analysis: refitting on the larger sample available when the least-observed predictor is excluded leaves the direction and significance of every coefficient unchanged, and, where the journal expects it, a multiple-imputation analysis pooled over the imputed datasets gives estimates in close agreement with the complete-case model. The description of the missingness and both robustness checks now appear in the Methods and the supplementary material (page X).

### If it is a real problem

> We thank the reviewer for raising the handling of missing data. The outcome was missing for 60 of 200 patients, and on inspection these were disproportionately patients who withdrew after deteriorating, so the complete-case sample over-represents those who did well. We have added the missing counts and this pattern to the Methods, now describe the estimate as applying to patients who completed follow-up rather than to the enrolled population, and have revised the Abstract and Discussion so that the conclusion no longer claims more than the retained sample supports (page X).

## Practice

A reviewer writes: *"Nearly a quarter of your outcome values are missing. Complete-case analysis on that much missingness is not valid, and the paper needs multiple imputation before its conclusions can stand."* Your study stands in as a regression of ozone on temperature and wind in `airquality`, where 24% of the ozone readings are missing. Run the block, decide which of the three outcomes applies, and work out what you would write back.

```r
ex_aq <- airquality
ex_aq$oz_missing <- is.na(ex_aq$Ozone)
round(mean(ex_aq$oz_missing), 3)
aggregate(cbind(Temp, Wind) ~ oz_missing, data = ex_aq, FUN = mean)
ex_model <- lm(Ozone ~ Temp + Wind, data = ex_aq)
round(summary(ex_model)$coefficients, 4)
nobs(ex_model)
```

<details><summary>Click to reveal solution</summary>

The obvious move is to take "not valid" at face value and treat 24% missingness as a real problem that only imputation can fix. That over-reads the situation. The outcome is missing on 24.2% of days, which is substantial and does deserve more than a silent deletion, so this is not the "you are fine" case either. But the days with a missing ozone reading are almost indistinguishable from the observed days on the predictors that drive ozone: mean temperature 77.9 against 77.9, and mean wind 10.3 against 9.9. The complete-case model fits on 116 days and returns a temperature slope of 1.8402 (SE 0.2500, p < 0.001) and a wind slope of -3.0555 (SE 0.6633, p < 0.001), both a long way from the margin.

This is the second outcome, "it is fixable". You report the missing fraction and the likely mechanism, present the complete-case model as the primary analysis, and add multiple imputation as a sensitivity check to answer the reviewer directly; the near-identical predictor profiles make it very likely the pooled estimates will land where the complete-case ones already are. What you should not do is concede that the result is invalid, because the evidence you can see points the other way. The reviewer's "not valid" is a rule of thumb about the size of the missing fraction, and in this study the evidence about the missing days is more informative than the rule.

</details>
