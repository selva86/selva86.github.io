---
title: "Selection Bias in Peer Review"
slug: Selection-Bias-in-Peer-Review
description: "A reviewer says you did not discuss selection bias or non-response. How to check whether your sample represents the population in R, and word the reply."
keywords: "selection bias reviewer comment, non-response not discussed, sample not representative, reviewer says selection bias, selection bias peer review, response rate too low"
mathjax: false
webr: true
date: 2026-08-06
curriculum_id: null
post_type: FR
fr_parent: Answering-Statistical-Reviewer-Comments.html
handbook: publishing
handbook_part: 9
handbook_chapter: 41
auto_link_terms: selection bias|non-response|non-response bias|response rate|not representative|selection into the sample|selection mechanism
auto_link_case_sensitive: false
difficulty: Intermediate
---

<p class="lead">Selection bias is when the units in your sample are not a fair stand-in for the population you set out to describe, because whatever decided who got into the sample, or who stayed in it, was itself tied to the outcome you are measuring. It distorts a simple average as readily as a group comparison, and unlike confounding you often cannot remove it by adding a variable to the model, since the units that would move the estimate are the ones missing from your data.</p>

## What the reviewer wrote

> The authors do not report the response rate, nor whether the participants who responded differ from those who did not. A comment on the potential for selection bias would strengthen the paper.

> Only about 40% of those approached took part. At that level of non-response the sample cannot be assumed representative, and the estimates may be biased.

> The analysis is careful and the manuscript reads well. My one substantive concern is recruitment: participants came through a single specialist clinic, and patients referred there are unlikely to resemble the wider population the abstract generalises to. I would want to know who was eligible but never entered the sample before I accept the headline figure.

## What they actually mean

The reviewer is asking whether your sample represents the population you want your numbers to speak for. A study observes a slice of the world and then reports as though the slice were the whole, which only holds when the slice was carved out for reasons unrelated to what you are measuring. When the reason someone entered your data, or stayed in it, is connected to their outcome, the slice is tilted and every estimate drawn from it inherits the tilt.

This is not the same objection as confounding, and reading it as one sends you down the wrong road. [Confounding](/Unadjusted-Confounding-in-Peer-Review.html) is a difference between the groups you compare on a variable you measured and can adjust for. Selection bias is about who is in the dataset at all, so the people who would move the estimate are absent and there is nothing in the model to adjust. The other common misreading treats the response rate as the verdict: a high rate does not prove the sample is representative, and a low one does not prove it is biased, because the question is whether entering or leaving the sample is related to the outcome rather than how many people took part.

## Why they are asking

If being in the sample is tied to the outcome, the sample no longer centres on the population value, and reporting the sample number as the population number is off by however strongly selection and outcome are linked. The direction is not fixed. When the people more likely to respond tend to have higher outcomes, the estimate runs high; when the sicker patients are the ones who drop out before the final visit, it runs low. How large the distortion is depends on two things at once, so the check has two parts: is entry into the sample related to some characteristic, and does that characteristic relate to the outcome.

One distinction saves a lot of needless worry. Selecting on the exposure, or on a cause of the exposure, does not bias the exposure-outcome association inside a cohort; selecting on the outcome, or on a variable that both the exposure and the outcome influence, does (Hernán, Hernández-Díaz and Robins, 2004, *Epidemiology*). So a study that enrolled people because of their treatment can still estimate the treatment effect cleanly, whereas one that enrolled them because of how they fared cannot. What a sample is and how bias enters it is covered in [Populations, Samples and Bias in R](/Populations-Samples-and-Bias-in-R.html); here the job is to work out whether the tilt is real and what to report.

## How to check it

Suppose you want to report the average fuel economy of a class of cars, and the population you care about is all 32 cars in `mtcars`, whose true mean is 20.09 mpg. You do not observe all of them. A response mechanism decided which cars came back for testing, and heavier cars were less likely to return. Start by comparing the sample you ended up with against the population it is meant to describe.

```r
set.seed(1)
p_resp <- plogis(2.5 - 0.9 * mtcars$wt)   # response probability falls as weight rises
resp   <- rbinom(nrow(mtcars), 1, p_resp)

round(c(response_rate  = mean(resp),
        population     = mean(mtcars$mpg),
        respondents    = mean(mtcars$mpg[resp == 1]),
        nonrespondents = mean(mtcars$mpg[resp == 0])), 2)
#>  response_rate     population    respondents nonrespondents
#>           0.47          20.09          22.07          18.35
```

The respondents average 22.07 mpg against a population value of 20.09, and the cars that never responded sit down at 18.35. A 47% response rate produced a sample that reads almost two miles per gallon too optimistic. There is no response-rate cutoff that certifies a sample as safe, and the guidelines that once demanded 60% or 70% have largely been dropped, because a rate is only a proxy for the thing that matters, which is whether responders and non-responders differ on the outcome (Groves, 2006, *Public Opinion Quarterly*). So look at how the two groups differ on the characteristics you hold for both.

```r
covs <- c("wt", "hp", "disp")
round(t(sapply(covs, function(v)
  c(respondents    = mean(mtcars[[v]][resp == 1]),
    nonrespondents = mean(mtcars[[v]][resp == 0])))), 2)
#>      respondents nonrespondents
#> wt          2.73           3.65
#> hp        122.67         167.88
#> disp      179.31         276.09
```

The respondents are lighter by nearly a ton on average, with less power and smaller engines. Weight is the strongest single predictor of fuel economy here, correlating with `mpg` at -0.87, so a sample skewed toward light cars is skewed toward high mileage. Non-response bends an estimate only when the sample is tilted on something the outcome depends on, and this one is. The check has a hard boundary worth naming: you can only compare respondents and non-respondents on variables you hold for both, so a characteristic recorded only on the people who stayed in says nothing about the ones who left.

## What to do about it

### You are fine

The selection is unrelated to the outcome, or related only through a variable the outcome does not depend on. Non-response can be substantial and still leave the estimate alone, as long as who responded was not tied to what you are measuring. Take the same cars, but let response be a coin flip that ignores every characteristic of the car.

```r
set.seed(10)
mcar <- rbinom(nrow(mtcars), 1, 0.5)      # response unrelated to the car
round(c(response_rate = mean(mcar),
        respondents   = mean(mtcars$mpg[mcar == 1]),
        population    = mean(mtcars$mpg)), 2)
#> response_rate   respondents    population
#>          0.44         20.34         20.09
```

At a 44% response rate, barely higher than the biased case, the respondent mean lands at 20.34 against a population 20.09. That quarter-mpg gap is chance rather than tilt, because nothing about a car changed its odds of responding. This is the missing-completely-at-random case from the missing-data literature, where the complete-case estimate is unbiased however many values are absent (Little and Rubin, 2019, *Statistical Analysis with Missing Data*). To show a reviewer you are in this position, report the response rate, then present the respondent-versus-non-respondent comparison from the check and let the near-identical covariate means carry the argument.

### It is fixable

You have the variable that drove selection, and you have it for the whole frame, not just the responders. When selection depends on measured characteristics, you can weight each respondent by the inverse of their probability of responding, so the under-represented kinds of unit count for more and the sample is pulled back toward the population it came from. Fit a model for who responded, turn it into weights, and re-estimate.

```r
p_model <- glm(resp ~ wt, data = mtcars, family = binomial)
w       <- 1 / predict(p_model, type = "response")
round(c(naive      = mean(mtcars$mpg[resp == 1]),
        weighted   = weighted.mean(mtcars$mpg[resp == 1], w[resp == 1]),
        population = mean(mtcars$mpg)), 2)
#>      naive   weighted population
#>      22.07      20.77      20.09
```

The naive respondent mean of 22.07 falls to 20.77 once each car is weighted by the inverse of its estimated probability of responding, against a population value of 20.09. Weighting up-counts the heavy cars that were unlikely to come back, which undoes most of the skew on the one variable that drove selection. It does not land exactly on 20.09, because weighting removes only the part of the selection the measured variable explains, and an honest analysis reports the weighted estimate with a wider interval that reflects the uncertainty the weighting adds. The method and its standard errors are covered in [Inverse Probability Weighting](/Inverse-Probability-Weighting-and-Doubly-Robust.html); when selection is thought to depend on the unobserved outcome rather than on measured covariates, a [Heckman selection model](/Heckman-Selection-Model-in-R.html) is the tool reviewers in economics will expect. Report the corrected estimate alongside the naive one so the reader can see the direction and size of the correction.

### It is a real problem

Selection is tied to the outcome itself, or to something you never measured on the people who left, and you have no data on them to weight or model your way back. Picture a prevalence study recruited through a specialist clinic, where patients arrive precisely because their condition is severe. The people with mild, undiagnosed disease are missing from the frame entirely, so the sample cannot be reweighted to include them: there is no record of them to weight, and severity, the thing that governed entry, is the outcome you are trying to estimate. A reported prevalence of, say, 38% might correspond to anything from 12% to 20% in the general population, and no reanalysis of the clinic data narrows that down, because the information needed sits in the people who never came. The honest path is to stop presenting the clinic figure as a population figure. Report it as what it is, a clinic-based estimate, state in the Limitations that the recruitment route selects on severity and biases the prevalence upward, and where you can, put numbers on the plausible range with a sensitivity analysis rather than leaving the direction of the bias for the reader to guess.

## How to word your response

### If you are fine

> The reviewer asks about non-response and the potential for selection bias. Our response rate was 44%, and we have added a comparison of respondents and non-respondents on the characteristics recorded for the full eligible sample (Methods, page X); the two groups are closely matched on all of them, including the strongest predictors of the outcome. Because entry into the sample was not related to the outcome, the reported mean is unbiased despite the response rate, and we now state this explicitly alongside the comparison table.

### If it is fixable

> We thank the reviewer for raising this. Respondents did differ systematically from non-respondents, being lighter on average, and because that characteristic strongly predicts the outcome the unadjusted mean was optimistic. We have re-estimated the mean using inverse-probability-of-response weights built from the characteristics available for the whole sampling frame; the estimate falls from 22.07 to 20.77 once the under-represented units are up-weighted (Results, page X). We now report the weighted estimate as the primary result, with the unweighted value and the response model given alongside it.

### If it is a real problem

> We agree that recruitment through a specialist clinic selects patients on severity, and that severity is bound up with the prevalence we set out to estimate. Because we have no data on the eligible people who were never referred, no weighting or adjustment can recover the population figure from these data, and we do not present one as though it could. We have relabelled the estimate as a clinic-based prevalence throughout (Abstract and Results, page X), added a Limitations paragraph stating that the sampling route biases it upward, and included a sensitivity analysis giving the plausible range under stated assumptions about the unreferred population.

## Practice

A reviewer writes: *"Nearly a quarter of the ozone readings in your series are missing. A missingness rate this high makes the reported mean unreliable, and the authors should address the resulting selection bias."* The daily air-quality series has ozone missing on many days, and you hold temperature, wind and solar radiation for every day, whether or not ozone was recorded. You run the check:

```r
ex_missing <- is.na(airquality$Ozone)
ex_rate    <- mean(ex_missing)
ex_compare <- t(sapply(c("Temp", "Wind", "Solar.R"), function(v)
  c(observed = mean(airquality[[v]][!ex_missing], na.rm = TRUE),
    missing  = mean(airquality[[v]][ ex_missing], na.rm = TRUE))))
ex_rate
round(ex_compare, 2)
```

Which of the three outcomes applies, and what do you write back?

<details><summary>Click to reveal solution</summary>

Ozone is missing on 37 of the 153 days, a rate of 24.2%, high enough to make the objection reasonable to raise. But the days with a missing ozone reading look almost exactly like the days with a recorded one: mean temperature 77.92 against 77.87, wind 10.26 against 9.86, solar radiation 189.51 against 184.80. Those three variables are the ones that predict ozone, with temperature correlating at 0.70 and wind at -0.60, so the near-match on all three is real reassurance rather than a coincidence about irrelevant columns.

This is the "you are fine" outcome, and it is a case where the obvious reading is wrong: the alarming number is the 24% missingness rate, yet the missing days are not a selected subset on anything the outcome depends on. The complete-case mean of 42.13 is defensible, and the right reply reports the missingness rate, shows the observed-versus-missing comparison, and notes that the two are indistinguishable on the measured predictors of ozone. One honest limit stays on the record: this check clears selection on the variables you measured, but it cannot rule out that readings went missing because the ozone value itself was extreme, which no observed-day comparison can test. That residual possibility belongs in a limitation sentence, not in a correction to the mean.

</details>
