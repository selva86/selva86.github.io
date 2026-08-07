---
title: "Autocorrelated Residuals in Peer Review"
slug: Autocorrelated-Residuals-in-Peer-Review
description: "A reviewer says your residuals are autocorrelated. Check it in R with the Durbin-Watson test, decide whether it changes your result, and word the reply."
keywords: "residuals are autocorrelated reviewer comment, autocorrelation reviewer response, serial correlation peer review, durbin-watson reviewer, reviewer says residuals autocorrelated, HAC standard errors reviewer"
mathjax: false
webr: true
date: 2026-08-06
curriculum_id: null
post_type: FR
fr_parent: Answering-Statistical-Reviewer-Comments.html
handbook: publishing
handbook_part: 9
handbook_chapter: 34
auto_link_terms: autocorrelated residuals reviewer|serial correlation objection|Durbin-Watson response|residual autocorrelation reviewer comment|HAC standard errors response|autocorrelation in peer review
auto_link_case_sensitive: false
difficulty: Intermediate
---


<p class="lead">Autocorrelated residuals mean the leftover errors from your model are correlated from one observation to the next, almost always because the data are ordered in time. This does not bend the coefficients, but it makes an ordinary model report standard errors that are too small, so the p-values come out smaller than the evidence supports and an effect can look more certain than it is.</p>

## What the reviewer wrote

> The data are a monthly time series, yet the regression treats the observations as independent. The authors should test the residuals for serial correlation and report a Durbin-Watson statistic.

> Given the yearly structure of these data the errors are almost certainly autocorrelated, so the standard errors in Table 3 cannot be trusted and the significance tests are not meaningful as they stand.

> On a separate note, I was struck by how smoothly the residuals in Figure 2 drift above and then below zero rather than scattering, which made me wonder whether adjacent time points are really independent and whether that has any bearing on the confidence intervals.

## What they actually mean

Your observations come in a sequence, usually a time order, and each residual carries over into the next instead of being a fresh draw. When the errors move together like this, a run of points above the line tends to be followed by more points above the line, so the sample holds less independent information than its length suggests. The reviewer is not claiming your coefficient is wrong, and is not asking for another predictor. What is in doubt is the precision the model reported: the standard errors, the confidence intervals and the p-values, every one of them computed as though each time point were independent. This is a different objection from clustering or repeated measures, where the dependence comes from the grouping of the data rather than from its time order; that one is covered in [Non-Independent Observations in Peer Review](/Non-Independent-Observations-in-Peer-Review.html).

## Why they are asking

Ordinary least squares assumes the errors are independent, and it uses the full number of rows when it works out how precise the estimates are. When the errors are positively autocorrelated, which is the usual case in time-ordered data, that row count overstates how much independent evidence you have, and the standard errors come out too small. The coefficients themselves stay unbiased, so the point estimates are fine; what breaks is everything built on the standard error, so the t statistics come out too large and the p-values too small. A relationship that looks significant can rest on far less independent information than the degrees of freedom imply. Econometric practice treats serial correlation as a routine diagnostic on any regression carrying a time index (Wooldridge, Introductory Econometrics, 2019), and reporting guidelines expect the design of the data to be handled on its face, as in STROBE item 12, which asks authors to describe all statistical methods including those used to account for the structure of the data (von Elm et al., 2007). The mechanics of the tests and the fixes are covered in [Autocorrelation in Residuals: Durbin-Watson and Breusch-Godfrey](/Autocorrelation-in-Residuals.html); this chapter is about deciding whether you have a problem and what to say about it.

## How to check it

One number covers the common case: the Durbin-Watson statistic, which compares each residual with the one before it. It runs from 0 to 4. A value near 2 means the residuals are independent, a value below 2 means positive autocorrelation, and a value near 0 means each residual is almost a copy of the one before. The Lake Huron series, one water-level reading per year from 1875 to 1972, is a plain example of a regression on time-ordered data.

```r
library(lmtest)
year  <- as.numeric(time(LakeHuron))
level <- as.numeric(LakeHuron)
fit   <- lm(level ~ year)
dwtest(fit)
#>
#> 	Durbin-Watson test
#>
#> data:  fit
#> DW = 0.43949, p-value < 2.2e-16
#> alternative hypothesis: true autocorrelation is greater than 0

res <- residuals(fit)
round(cor(res[-1], res[-length(res)]), 3)
#> [1] 0.776
```

A Durbin-Watson of 0.44 sits far below 2 and the p-value is essentially zero, so the residuals are strongly and positively autocorrelated. The lag-1 correlation of 0.78 says it directly: this year's residual predicts most of next year's. There is no fixed cutoff: a statistic near 1.8 with a large p-value is comfortable, values pulling toward 1 are worth a second look, and anything near 1 or below is a clear signal. With no packages at all, base R gives you the same picture through `acf(res)`, where autocorrelation shows up as bars that stay outside the dashed band.

## What to do about it

The check places you in one of three situations, and each calls for a different reply.

### You are fine

The check comes back clean, or the objection does not apply to your design. Time order is not automatic trouble: a well-specified model can leave residuals that are already independent. Daily air-quality readings are ordered in time, yet regressing ozone on temperature and wind soaks up enough of the day-to-day movement that little correlation is left over.

```r
aq    <- na.omit(airquality[order(airquality$Month, airquality$Day), ])
clean <- lm(Ozone ~ Temp + Wind, data = aq)
dwtest(clean)
#>
#> 	Durbin-Watson test
#>
#> data:  clean
#> DW = 1.9214, p-value = 0.3106
#> alternative hypothesis: true autocorrelation is greater than 0
```

A Durbin-Watson of 1.92 with a p-value of 0.31 gives no reason to reject independence, so the ordinary standard errors stand. The other version of fine is data with no sequence at all. If your rows are a cross-sectional sample with no time or spatial order, a Durbin-Watson statistic reflects only however the rows happen to be sorted, and the objection does not apply; say so, and if the reviewer actually meant clustered or repeated-measures sampling, treat it as the separate question it is. Either way, report the statistic so the reassurance rests on a number.

### It is fixable

The residuals are genuinely autocorrelated, but the repair is to the standard errors rather than to the model, and the result survives it. Heteroskedasticity-and-autocorrelation-consistent (HAC) standard errors, the Newey-West kind, keep your coefficients and recompute their uncertainty allowing for the serial correlation. Go back to the Lake Huron trend and compare the ordinary errors with the corrected ones.

```r
library(sandwich)
round(summary(fit)$coefficients["year", ], 5)                                # ordinary OLS
#>   Estimate Std. Error    t value   Pr(>|t|)
#>   -0.02420    0.00404   -5.99615    0.00000
round(coeftest(fit, vcov = NeweyWest(fit, prewhite = FALSE))["year", ], 5)   # Newey-West HAC
#>   Estimate Std. Error    t value   Pr(>|t|)
#>   -0.02420    0.00748   -3.23577    0.00166
```

The estimated trend does not move: the level falls by 0.0242 feet a year in both fits, because autocorrelation does not bias the coefficient. What changes is the standard error on that slope, which nearly doubles from 0.00404 to 0.00748, and the t value, which falls from -6.00 to -3.24. The decline is strong enough to survive the correction and stays significant at p = 0.0017. The remedy is to report the HAC standard errors as the primary inference and note that the conclusion holds. Where the autocorrelation reflects missing dynamics rather than merely mis-stated errors, adding a lagged term or a seasonal component can remove it at the source, and both routes are laid out in [Autocorrelation in Residuals](/Autocorrelation-in-Residuals.html).

### It is a real problem

Sometimes the correction takes the finding with it, when the apparent significance came entirely from treating correlated observations as independent and honest standard errors leave nothing behind. The `discoveries` series counts the great inventions and scientific discoveries logged each year from 1860 to 1959, and a straight regression on time suggests they are becoming rarer.

```r
disc <- lm(counts ~ year,
           data = data.frame(counts = as.numeric(discoveries),
                             year   = seq_along(discoveries)))
dwtest(disc)
#>
#> 	Durbin-Watson test
#>
#> data:  disc
#> DW = 1.4928, p-value = 0.003843
#> alternative hypothesis: true autocorrelation is greater than 0

round(summary(disc)$coefficients["year", ], 4)                                # ordinary OLS
#>   Estimate Std. Error    t value   Pr(>|t|)
#>    -0.0165     0.0077    -2.1565     0.0335
round(coeftest(disc, vcov = NeweyWest(disc, prewhite = FALSE))["year", ], 4)  # Newey-West HAC
#>   Estimate Std. Error    t value   Pr(>|t|)
#>    -0.0165     0.0110    -1.5064     0.1352
```

The slope is unchanged at -0.0165 discoveries a year, but its standard error widens from 0.0077 to 0.0110 once the autocorrelation is admitted, and the t value drops from -2.16 to -1.51. The ordinary p-value of 0.033 crossed the line; the corrected p-value of 0.135 does not. The declining trend was resting on the assumption that each year was independent evidence, and once that assumption goes the data no longer support the claim at conventional levels. There is no clever repair here, because the fault is not in the errors but in how much independent information a hundred consecutive years actually carry. The honest path is to report the HAC result, state that the trend is not significant once serial correlation is accounted for, and revise the sentence that claimed it. Modeling the dynamics directly, for example by adding the previous year's count as a predictor, points the same way: with that lag in the model the time trend is no longer significant either.

## How to word your response

### If you are fine

> We thank the reviewer for raising this. Because the observations are ordered in time, we tested the residuals for serial correlation using the Durbin-Watson statistic, which was 1.92 (p = 0.31), so there is no evidence of autocorrelation once temperature and wind are in the model. The ordinary standard errors are therefore appropriate and our conclusions are unchanged. The test is now reported in the Methods (page X).

### If it was fixable

> The reviewer is right that our series is measured over time and that we did not originally check for serial correlation. The Durbin-Watson statistic confirms strong positive autocorrelation, so we have recomputed the inference using heteroskedasticity-and-autocorrelation-consistent (Newey-West) standard errors. The estimated trend is identical, and although its standard error roughly doubles, the effect remains significant (p = 0.002). We now report the corrected standard errors throughout, as described in the Methods (page X) and Table 3.

### If it is a real problem

> The reviewer is correct to question this. On testing, the residuals are strongly autocorrelated, and once the standard errors are recomputed to allow for it, the downward trend we reported is no longer significant at conventional levels (p = 0.14, against 0.03 as first analysed). We have revised the Results to report the corrected estimate and its confidence interval, and we no longer describe the trend as statistically significant. The change is described in the Results and Methods (page X).

## Practice

A reviewer writes: *"The manuscript fits a regression but never shows that the residuals are independent. Please provide a Durbin-Watson test to rule out autocorrelation."* Your data are the 32 cars in `mtcars`, and you run the check:

```r
ex_fit <- lm(mpg ~ wt + hp, data = mtcars)
dwtest(ex_fit)
```

Which of the three outcomes applies, and what do you write back?

<details><summary>Click to reveal solution</summary>

The test looks alarming at first read. The Durbin-Watson statistic is 1.3624 with a p-value of 0.02061, which is below 0.05, and a reader who stops at the p-value would concede that the residuals are autocorrelated and the model is in trouble.

The point should not be conceded, because `mtcars` is a cross-sectional snapshot of 32 car models with no time or sequence dimension. The row order is arbitrary. A Durbin-Watson test measures correlation between residuals that sit next to each other in the data, so on unordered rows it detects nothing but the accident of how the table happens to be sorted. You can see that the statistic is an artifact of ordering by re-sorting the same rows and running it again:

```r
sorted <- mtcars[order(mtcars$mpg), ]
dwtest(lm(mpg ~ wt + hp, data = sorted))
#>
#> 	Durbin-Watson test
#>
#> data:  lm(mpg ~ wt + hp, data = sorted)
#> DW = 0.87682, p-value = 9.643e-05
#> alternative hypothesis: true autocorrelation is greater than 0
```

Sorting the cars by fuel economy drives the statistic down to 0.88 and the p-value to 0.0001, because sorting forces neighbouring residuals to resemble each other. Nothing about the data changed, only the order, so the autocorrelation was never a property of the sample, which puts this in the first outcome: you are fine. The reply is to point out that the observations are not ordered in time, so serial correlation does not apply, and to report the statistic only to show it. If the reviewer's real worry is that some cars share a manufacturer and are therefore not independent, that is the separate grouping objection, handled in [Non-Independent Observations in Peer Review](/Non-Independent-Observations-in-Peer-Review.html).

</details>
