---
title: "Reviewer says you did not do a power analysis"
slug: Reviewer-Says-No-Power-Analysis-Was-Done
description: "A reviewer says no power analysis was done or your sample size is not justified. How to answer honestly in R, without an invalid post-hoc power calculation."
keywords: "no power analysis reviewer comment, sample size not justified, reviewer says underpowered, post-hoc power fallacy, minimum detectable effect in R, retrospective power analysis"
mathjax: false
webr: true
date: 2026-08-06
curriculum_id: null
post_type: FR
fr_parent: Answering-Statistical-Reviewer-Comments.html
handbook: publishing
handbook_part: 9
handbook_chapter: 38
auto_link_terms: power analysis objection|no power analysis reviewer|sample size justification|minimum detectable effect|post-hoc power|underpowered study
auto_link_case_sensitive: false
difficulty: Intermediate
---

<p class="lead">A power analysis is a calculation you run before collecting data, to choose a sample size. Once the data are in, the honest way to answer this objection is a confidence interval or a minimum detectable effect, not a power figure worked backwards from the result you already have.</p>

## What the reviewer wrote

> No power analysis or sample size justification is provided.

> It would strengthen the manuscript if the authors could comment on whether the study was adequately powered to detect the effects of interest.

> The comparison in the high-dose group was not significant. Before concluding that the two treatments are equivalent, the authors need to establish that the study had enough power to detect a meaningful difference, since otherwise the negative result may simply reflect a small sample.

## What they actually mean

The reviewer wants to know whether your sample was large enough for the study to have worked. There are two versions of that question and they call for different answers.

For a designed study such as a trial, part of it is a reporting requirement. CONSORT item 7a asks every randomised trial to state how the sample size was determined, and STROBE item 10 asks the same of observational studies. If you planned the size in advance, the reviewer wants that calculation on the page.

The sharper version is the third comment above, and it is aimed at a non-significant result. Here the reviewer is not asking for a box to be ticked. They are asking whether your null finding means there is no effect, or only that you were unlikely to find one. Those are different claims, and a non-significant p-value on its own does not tell them apart.

What the reviewer is almost never asking for, though many authors supply it, is a power figure computed from your observed effect. That calculation feels like a direct answer, but it only re-expresses the p-value you already have and tells the reviewer nothing new.

## Why they are asking

If a real effect exists and your study was too small, the test will often come back non-significant anyway. A reader who takes that result at face value concludes there is no effect, when the truth is that the study could not have seen one. Absence of evidence gets reported as evidence of absence, and the literature fills up with false negatives that later work has to undo.

That is the failure the reviewer is trying to prevent, and it only applies to null results. If your key result is significant, the study was evidently large enough to detect the effect that is there, and most of the concern falls away.

The mechanics of a prospective power calculation are covered in [Power Analysis in R](/Statistical-Power-Analysis-in-R.html). This chapter is about what to do when the data are already collected and a reviewer is asking.

## How to check it

Take a two-group comparison from a study of vitamin C and tooth growth in guinea pigs, at the high dose. First look at the result itself.

```r
tg2 <- subset(ToothGrowth, dose == 2)
t.test(len ~ supp, data = tg2)
#> 	Welch Two Sample t-test
#> 
#> data:  len by supp
#> t = -0.046136, df = 14.04, p-value = 0.9639
#> alternative hypothesis: true difference in means between group OJ and group VC is not equal to 0
#> 95 percent confidence interval:
#>  -3.79807  3.63807
#> sample estimates:
#> mean in group OJ mean in group VC 
#>            26.06            26.14 
```

The difference is 0.08 units with a p-value of 0.96, and the confidence interval runs from -3.80 to 3.64. If this comparison had been significant you could stop here and say so. It is not, so the useful question is what size of difference this design could have detected. Fix the power at the conventional 80% and solve for the difference.

```r
sd_within <- sqrt(mean(tapply(tg2$len, tg2$supp, var)))
power.t.test(n = 10, sd = sd_within, sig.level = 0.05, power = 0.80)
#>      Two-sample t test power calculation 
#> 
#>               n = 10
#>           delta = 5.137267
#>              sd = 3.877342
#>       sig.level = 0.05
#>           power = 0.8
#>     alternative = two.sided
#> 
#> NOTE: n is number in *each* group
```

With ten animals per group, the study could reliably detect a difference of about 5.14 units and no smaller. The difference it actually found was 0.08, and the confidence interval already rules out anything beyond about 3.8 units in either direction, so this is not a case of a large effect slipping through a small sample. The data place the difference near zero with reasonable precision.

The 80% and the 0.05 are conventions, not laws, and you can vary them. What you should not do is compute power from the 0.08 difference you observed. Observed power is a one-to-one function of the p-value, so it carries no information the p-value did not, and a non-significant result always yields observed power below one half by construction (Hoenig and Heisey, 2001, *The American Statistician* 55:19-24). The confidence interval and the minimum detectable effect are the tools that answer the reviewer.

## What to do about it

### You are fine

Your central result is significant, or you planned the sample size in advance and can show the calculation.

If the result is significant, the objection mostly dissolves. Take the low-dose comparison from the same study:

```r
tg05 <- subset(ToothGrowth, dose == 0.5)
t.test(len ~ supp, data = tg05)
#> 	Welch Two Sample t-test
#> 
#> data:  len by supp
#> t = 3.1697, df = 14.969, p-value = 0.006359
#> alternative hypothesis: true difference in means between group OJ and group VC is not equal to 0
#> 95 percent confidence interval:
#>  1.719057 8.780943
#> sample estimates:
#> mean in group OJ mean in group VC 
#>            13.23             7.98 
```

The difference of 5.25 units is significant at p = 0.006. A study that detects an effect has shown it had enough power for the effect that exists, and no separate power figure adds to that. Report the result, and if you did run a prospective power analysis, report that alongside it.

### It is fixable

Your result is non-significant, but the smallest difference the study could detect is smaller than the smallest difference that would matter. Then a null result is informative, because it rules out effects large enough to care about.

The high-dose comparison is this case. The minimum detectable effect was 5.14 units, and the same design found a significant 5.25-unit difference at the low dose, so an effect of that size would not have been missed. The fix is not to the analysis but to how you present it. Report the confidence interval and the minimum detectable effect, and state the null as a bound: no difference larger than about 3.8 units is consistent with the data. Stated as a bound, the null constrains the effect, and a reviewer can accept a constrained effect where a bare non-significant p-value would have left them uneasy.

### It is a real problem

Your result is non-significant and the study could not have detected a difference small enough to matter. Suppose a difference as small as 2 units would be scientifically important. Ask what power the study had against that.

```r
power.t.test(n = 10, delta = 2, sd = sd_within, sig.level = 0.05)$power
#> [1] 0.1928699
```

That is nineteen percent power. Against an effect of that size the study would miss it four times in five, so the non-significant result says almost nothing about whether such an effect exists. No reanalysis rescues this, because the information was never collected.

The honest path is to stop calling the result negative and start calling it inconclusive. Say in the Limitations that the study was underpowered for differences below roughly 5 units, report the interval so readers can see how wide it is, and if the work was always preliminary, frame it as hypothesis-generating. A larger study is the only real remedy, and the response should say that plainly rather than offer a post-hoc power figure, which would present an open question as though it were settled.

## How to word your response

### If you are fine

> We thank the reviewer for raising this. Our primary comparison was statistically significant (mean difference 5.25, 95% CI 1.72 to 8.78, p = 0.006), so the study was clearly powered to detect the effect of interest; a significant result is itself evidence of adequate power. We have added the effect size and its confidence interval to the Results (page X).

### If it was fixable

> The reviewer is right to ask whether the non-significant high-dose comparison reflects a true null or an underpowered one. We addressed this with a sensitivity analysis: at n = 10 per group the design had 80% power to detect a difference of 5.1 units, and the observed 95% confidence interval (-3.80 to 3.64) excludes differences beyond that range. The result therefore constrains the effect rather than being uninformative about it. We now report the confidence interval and the minimum detectable effect in the Results (page X), and have reworded the conclusion to state a bound rather than an absence.

### If it is a real problem

> We accept the reviewer's concern. A sensitivity analysis shows the study had only 19% power to detect a difference of 2 units, which we take to be the smallest meaningful effect, so the non-significant result cannot be read as evidence of no difference. We have revised the manuscript to describe this comparison as inconclusive rather than negative, added the confidence interval, and stated the limited power explicitly in the Limitations (page X). An adequately powered replication would be needed to settle the question.

## Practice

A reviewer writes: *"The authors report no difference in dried weight between the control group and the first treatment, but I see no power analysis. How do we know this is a real null and not a sample-size problem?"* You run the check:

```r
ex_pg <- droplevels(subset(PlantGrowth, group %in% c("ctrl", "trt1")))
t.test(weight ~ group, data = ex_pg)
ex_sd <- sqrt(mean(tapply(ex_pg$weight, ex_pg$group, var)))
power.t.test(n = 10, sd = ex_sd, sig.level = 0.05, power = 0.80)
```

Which of the three outcomes applies, what should you not report, and what do you write?

<details><summary>Click to reveal solution</summary>

The comparison is non-significant: the control and treatment means are 5.032 and 4.661, a difference of 0.371 g, with t = 1.19 and p = 0.25, and a 95% confidence interval of -0.29 to 1.03. The power calculation returns a minimum detectable effect of 0.92 g, so at ten plants per group the study could reliably detect a difference of about that size.

The tempting move is to compute observed power from the 0.371 g difference, which comes out at 0.20. That number looks like proof the study was hopeless, and it is worthless: it is the p-value of 0.25 re-expressed, and a non-significant result gives observed power below one half every time. Keep it out of the response.

The real answer depends on the smallest difference in dried weight that would matter, which the reviewer has not stated. The study rules out any increase beyond about 1 g and any decrease beyond about 0.3 g. If differences below roughly 0.9 g are not scientifically meaningful, this is the "you are fine" outcome: report the confidence interval and the minimum detectable effect and state that the design would have caught a difference of the size that matters. If a change as small as half a gram would be important, the study was underpowered for it, and the honest response says so and calls the result inconclusive. Either way the report is the interval and the minimum detectable effect, never the observed power.

</details>
