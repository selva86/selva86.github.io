---
title: "Missing Effect Sizes in Peer Review"
slug: Missing-Effect-Sizes-in-Peer-Review
description: "A reviewer says to report effect sizes, not just p-values. How to compute an effect size in R, read whether your result is meaningful, and word your reply."
keywords: "report effect sizes reviewer comment, p-values without effect sizes, effect size peer review, reviewer says report effect sizes, Cohen's d response to reviewer, effect size and confidence interval"
mathjax: false
webr: true
date: 2026-08-06
curriculum_id: null
post_type: FR
fr_parent: Answering-Statistical-Reviewer-Comments.html
handbook: publishing
handbook_part: 9
handbook_chapter: 49
auto_link_terms: report effect sizes reviewer|effect size objection|effect sizes not reported|p-values without effect sizes|reporting effect sizes in a paper|reviewer wants effect sizes|effect size with a confidence interval
auto_link_case_sensitive: false
difficulty: Intermediate
---


<p class="lead">A p-value tells you whether an effect can be told apart from zero, not how large it is. When a reviewer asks for effect sizes, they want the magnitude of your result in interpretable units, with a confidence interval, so a reader can judge whether it matters. Most of the time this is a quick, additive fix that makes the paper stronger, and occasionally it reveals that a significant result is smaller than it looked.</p>

## What the reviewer wrote

> The manuscript reports statistical significance throughout but gives no effect sizes. I would ask the authors to include these so the magnitude of the findings can be judged.

> P-values on their own tell us very little. What is the actual size of the difference?

> The analysis in section 3 is generally sound, though I note the results are given as p-values only. The reader has no way to gauge whether the reported associations are large enough to matter in practice, and effect sizes with confidence intervals should be added throughout.

## What they actually mean

The reviewer accepts that you ran a test and got a p-value. What they are missing is how big the effect is. Statistical significance answers only whether an effect can be distinguished from zero; it says nothing about whether that effect is large or trivial. The reviewer wants a number for the size of the result, in units a reader can interpret, together with a confidence interval that shows how precisely you have pinned it down.

It is easy to read this as a demand for one particular statistic, usually Cohen's d, and to reach for a package that prints it. Often that is not what serves the paper best. A difference of 7 mpg, or 4 mmHg, or 12 percentage points, stated in the outcome's own units, is an effect size too, and it is usually more informative than its standardized cousin.

## Why they are asking

A p-value mixes two things a reader wants to keep apart: how large the effect is, and how much data you collected. A large sample can make a difference of no practical consequence highly significant, and a small sample can leave a genuinely large effect non-significant (Sullivan and Feinn, 2012). Someone who sees only `p < 0.001` therefore cannot tell whether you found something that matters or something that merely reached the threshold. The effect size restores that information, and the confidence interval around it shows the range of values your data are consistent with. Effect sizes are also what let a later reviewer, a meta-analyst, or a researcher planning a replication use your result at all, none of which is possible from a p-value alone. Reporting them is now an explicit requirement in several reporting guidelines: CONSORT (item 17) asks for the estimated effect size and its precision for every outcome, and the APA Publication Manual has directed authors to report effect sizes and confidence intervals for years (Wilkinson and the Task Force on Statistical Inference, 1999).

The mechanics of computing and interpreting effect sizes are covered in [Effect Size in R](/Effect-Size-in-R.html). This chapter is about deciding what your effect size tells you and how to report it.

## How to check it

The check is to compute the size of your main result, not just its p-value. Take the difference in fuel economy between automatic and manual cars in `mtcars`. A [t-test](/t-Tests-in-R.html) gives you the p-value, and the same output already carries the raw effect size and its confidence interval.

```r
res <- t.test(mpg ~ am, data = mtcars)
res
#> 
#> 	Welch Two Sample t-test
#> 
#> data:  mpg by am
#> t = -3.7671, df = 18.332, p-value = 0.001374
#> alternative hypothesis: true difference in means between group 0 and group 1 is not equal to 0
#> 95 percent confidence interval:
#>  -11.280194  -3.209684
#> sample estimates:
#> mean in group 0 mean in group 1 
#>        17.14737        24.39231 
```

Automatic cars average 17.15 mpg and manual cars 24.39, a difference of 7.24 mpg, and the 95% interval for that difference runs from 3.21 to 11.28. That is a raw effect size, already sitting in your standard output. To add the standardized version, Cohen's d, divide the difference by the pooled standard deviation, which is a few lines of base R.

```r
auto <- mtcars$mpg[mtcars$am == 0]
man  <- mtcars$mpg[mtcars$am == 1]
sp <- sqrt(((length(auto) - 1) * var(auto) + (length(man) - 1) * var(man)) /
             (length(auto) + length(man) - 2))
d <- (mean(man) - mean(auto)) / sp
round(c(mean_diff = mean(man) - mean(auto), pooled_sd = sp, cohens_d = d), 3)
#> mean_diff pooled_sd  cohens_d 
#>     7.245     4.902     1.478 
```

A d of 1.48 means the two groups differ by nearly one and a half standard deviations. The benchmarks you will see quoted, 0.2 for small, 0.5 for medium and 0.8 for large, come from Cohen (1988), who intended them as a rough guide for fields with no better yardstick and warned against treating them as fixed. What counts as a large effect in your discipline may be quite different, so report the number and interpret it in context rather than reading a label off a table.

## What to do about it

### You are fine

If you fitted a regression, the coefficient you already reported is an effect size. Reviewers who are trained to look for a standardized statistic sometimes miss this, so it is worth stating plainly.

```r
round(summary(lm(mpg ~ am, data = mtcars))$coefficients, 3)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)   17.147      1.125  15.247        0
#> am             7.245      1.764   4.106        0
```

The `am` coefficient of 7.245 says manual cars average about 7.2 mpg more than automatics, and its standard error of 1.764 gives the precision. A size and its uncertainty is what the reviewer wants, and you have already supplied it. Point to where the coefficient appears, add its confidence interval if it is not already there, and if your field expects a standardized measure too, give Cohen's d alongside the raw coefficient rather than in place of it.

### It is fixable

If your results section gives p-values and test statistics but no magnitude anywhere, the fix is to compute the effect size and add it. This is the common case and it is fast. For the fuel-economy comparison you already have everything you need from the objects computed above.

```r
round(c(mean_diff = mean(man) - mean(auto),
        ci_low   = -res$conf.int[2],
        ci_high  = -res$conf.int[1],
        cohens_d = d), 2)
#> mean_diff    ci_low   ci_high  cohens_d 
#>      7.24      3.21     11.28      1.48 
```

That line is publication ready: manual cars average 7.24 mpg more, 95% CI 3.21 to 11.28, a standardized difference of 1.48. Lead with the raw difference and its interval, since 7.24 mpg is interpretable in a way that d = 1.48 is not, and add the standardized value for readers comparing across studies. Your analysis does not change; you are surfacing numbers you already computed.

### It is a real problem

Sometimes computing the effect size is the moment you find out the result is smaller than the p-value made it look. A large enough sample makes a difference of no practical importance statistically significant. The block below is an illustration, not real study data: a 0.3 point gap on a 100 point scale, with 20,000 observations per group.

```r
n <- 20000; gap <- 0.3; s <- 12
se <- s * sqrt(2 / n)
round(c(cohens_d = gap / s, p_value = 2 * pnorm(-abs(gap / se))), 4)
#> cohens_d  p_value 
#>   0.0250   0.0124 
```

The difference is significant at p = 0.012, and the standardized effect is 0.025, close to nothing. If your headline finding looks like this, no wording will turn it into a large effect, because there is not one. The honest response is to report the effect size and its confidence interval, say that the difference is statistically detectable but too small to be of practical importance, and soften any claim in the abstract or discussion that implied otherwise. A reviewer who asked for effect sizes and receives an honest small one, clearly labelled, will usually accept it.

## How to word your response

### If you are fine

> The coefficients in Table 2 are themselves effect sizes: each is the change in the outcome per unit of the predictor, in the outcome's own units. We take the reviewer's point that this should be made explicit. We have added 95% confidence intervals to that table and now report the two coefficients central to our argument in the text with their intervals (Results, page X), so the magnitude and precision of each association are visible without recomputation.

### If it was fixable

> The reviewer is right that we reported significance without magnitude. We have added effect sizes throughout the Results (page X). For the primary comparison the difference is 7.24 units (95% CI 3.21 to 11.28), a standardized mean difference of 1.48. These figures do not alter the analysis; they make the size of the effect explicit alongside the p-values reported previously.

### If it is a real problem

> Computing the effect sizes the reviewer requested has clarified our own reading of the result. The difference, though statistically significant (p = 0.012), corresponds to a standardized effect of 0.03, which we now recognise as small. We have added the effect size and its confidence interval to the Results (page X) and revised the Abstract and Discussion to describe the difference as statistically detectable but of limited practical magnitude, rather than as a substantial effect. We thank the reviewer for prompting a more accurate account.

Across all three, the size is stated in the outcome's own units first, because that is what a reader can act on, with the standardized value kept as a supplement for cross-study comparison rather than the headline.

## Practice

A reviewer writes: *"The authors report p = 0.06 for the comparison of the two delivery methods and conclude there was no effect. Please report effect sizes rather than relying on the significance threshold."* You run the check against your data, with the vitamin C study in `ToothGrowth` standing in for it:

```r
ex_res <- t.test(len ~ supp, data = ToothGrowth)
ex_oj <- ToothGrowth$len[ToothGrowth$supp == "OJ"]
ex_vc <- ToothGrowth$len[ToothGrowth$supp == "VC"]
ex_sp <- sqrt(((length(ex_oj) - 1) * var(ex_oj) + (length(ex_vc) - 1) * var(ex_vc)) /
                (length(ex_oj) + length(ex_vc) - 2))
ex_d <- (mean(ex_oj) - mean(ex_vc)) / ex_sp
round(c(mean_diff = mean(ex_oj) - mean(ex_vc),
        ci_low = ex_res$conf.int[1], ci_high = ex_res$conf.int[2],
        p_value = ex_res$p.value, cohens_d = ex_d), 3)
```

Which of the three outcomes applies, and what do you write?

<details><summary>Click to reveal solution</summary>

The difference between OJ and VC is 3.70 units, the standardized effect is 0.495, and the 95% confidence interval runs from -0.171 to 7.571. By the usual benchmarks (Cohen, 1988) that d is a medium effect, and the p-value of 0.061 sits just above the 0.05 line.

The obvious move is to call this a null result, write that the delivery method had no effect, and add the d for completeness. That reading is wrong. The confidence interval runs from a difference of essentially zero up to 7.571 units, which against a VC mean near 17 is a difference of more than 40%. Your data are consistent with no effect and with a large effect at the same time, so the honest conclusion is that the study is inconclusive, not that the effect is absent.

This is the third outcome. Reporting the effect size has shown that the original claim of no effect is not supported by the data. Report the point estimate and its interval, and describe the result as an imprecise estimate of a possibly meaningful difference rather than as evidence of no difference. Calling p = 0.06 a trend is a separate objection with its own answer, so resist that route as well.

</details>
