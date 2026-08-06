---
title: "Trending Toward Significance in Peer Review"
slug: Trending-Toward-Significance-in-Peer-Review
description: "A reviewer says your result is not a trend, just a non-significant p-value. How to tell a real trend from a trend toward significance in R and word your reply."
keywords: "reviewer says it is not a trend, trend toward significance, approaching significance, marginally significant, is p = 0.06 a trend, trend toward significance reviewer comment, test for trend"
mathjax: false
webr: true
date: 2026-08-06
curriculum_id: null
post_type: FR
fr_parent: Answering-Statistical-Reviewer-Comments.html
handbook: publishing
handbook_part: 9
handbook_chapter: 51
auto_link_terms: trend toward significance|approaching significance|marginally significant result|trend toward significance objection|reviewer says it is not a trend|not a real trend|test for trend
auto_link_case_sensitive: false
difficulty: Intermediate
---


<p class="lead">There are two very different things a reviewer can mean by "this is not a trend", and the right reply depends on which. Usually they mean you described a non-significant result as a "trend toward significance"; sometimes they mean you claimed a trend across ordered groups but never tested for one. This chapter shows how to tell the two apart, check each in R, and word the response.</p>

## What the reviewer wrote

> The difference in the treatment arm did not reach significance (p = 0.07). I would avoid describing this as a trend toward significance; the effect is either supported or it is not.

> A p-value of 0.08 is not a trend. Please remove this word throughout.

> The paper is clearly written and the analysis is mostly appropriate. One small point: the third paragraph of the Results refers to a trend toward higher scores in the intervention group, but that comparison was not significant and no test for trend is reported, so it is unclear what "trend" is meant to convey here.

## What they actually mean

A reviewer who objects to the word "trend" is almost always objecting to one of two things. The common one is that you took a p-value above your threshold, most often between 0.05 and 0.10, and called it a "trend toward significance", which implies the effect is real and merely undersampled. They are not asking you to rerun anything; they are asking you to stop implying a result the test did not deliver. The less common one is that you claimed a genuine trend, a steady rise or fall across ordered groups or doses, but reported no formal test for it, in which case they want the test rather than a change of wording. The two readings call for opposite responses, so the first thing to settle is which one the comment is making.

## Why they are asking

"Trend toward significance" fails because a p-value does not measure how close you came to a real effect, and a result just above the line is not on its way to crossing it. When Wood and colleagues added more data to near-significant comparisons, the p-value was about as likely to grow as to shrink (Wood et al., 2014). A p of 0.07 borrows the credibility of a significant result without having earned it, and a reader who takes the word at face value will believe something the data do not support. The second case is a different problem but also real: if you assert that an outcome rises steadily across ordered groups and never test that claim, three or four means can look monotonic by chance, and the reviewer has no way to weigh the pattern. Either way the reader is being asked to accept a direction the reported analysis does not establish. What a p-value does and does not tell you is set out in [What p-values mean](/What-p-Values-Mean.html).

## How to check it

The check is to read what the test actually returned, not the adjective you attached to it. Take the two-group comparison in R's `sleep` data, the extra hours of sleep under two treatments. A [Welch t-test](/t-Tests-in-R.html) gives the p-value and, in the same output, the confidence interval you should be reading beside it.

```r
res <- t.test(extra ~ group, data = sleep)
res
#> 
#> 	Welch Two Sample t-test
#> 
#> data:  extra by group
#> t = -1.8608, df = 17.776, p-value = 0.07939
#> alternative hypothesis: true difference in means between group 1 and group 2 is not equal to 0
#> 95 percent confidence interval:
#>  -3.3654832  0.2054832
#> sample estimates:
#> mean in group 1 mean in group 2 
#>            0.75            2.33 
```

The p-value is 0.079, above the conventional 0.05, so by that convention the result is not significant. The 95% confidence interval for the difference runs from -3.37 to 0.21 hours and includes zero, so the data are consistent with no difference at all. There is no reliable direction here to call a trend. The 0.05 boundary is itself a convention rather than a law ([the p-value controversy](/The-p-Value-Controversy.html)), and if the boundary is arbitrary, sitting just outside it is not in itself a reason to claim a direction.

## What to do about it

### You are fine

Sometimes "trend" was the right word and you can back it. If your claim is a genuine monotonic change across an ordered variable, and you tested it rather than reading it off a table of means, point to the test. In R's `ChickWeight` data the chicks' weights climb with time, and a [correlation test](/How-to-do-Pearson-Correlation-Test-in-R.html) puts a coefficient and a p-value on that climb.

```r
cor.test(ChickWeight$Time, ChickWeight$weight)
#> 
#> 	Pearson's product-moment correlation
#> 
#> data:  ChickWeight$Time and ChickWeight$weight
#> t = 36.725, df = 576, p-value < 2.2e-16
#> alternative hypothesis: true correlation is not equal to 0
#> 95 percent confidence interval:
#>  0.8109073 0.8599481
#> sample estimates:
#>       cor 
#> 0.8371017 
```

The correlation is 0.84 with a p-value below 2.2e-16, so the rise over time is measured and tested, not eyeballed. If that is your situation you have not committed the error the reviewer suspects, and the reply is simply to show the test. Report the statistic and its p-value, and where your groups are ordinal rather than continuous, the [Jonckheere-Terpstra test](/Jonckheere-Terpstra-Test-in-R.html) is the version built for ordered categories. A pointer to where the test appears in the manuscript usually settles it.

### It is fixable

If you did attach "trend" to a non-significant result, the fix is in the wording. Report the result as what it is, a non-significant difference with its [effect size and confidence interval](/Missing-Effect-Sizes-in-Peer-Review.html), and drop the language that implied momentum. You already have the numbers from the test above.

```r
d_mean <- mean(sleep$extra[sleep$group == 2]) - mean(sleep$extra[sleep$group == 1])
round(c(mean_diff = d_mean,
        ci_low   = -res$conf.int[2],
        ci_high  = -res$conf.int[1],
        p_value  = res$p.value), 3)
#> mean_diff    ci_low   ci_high   p_value 
#>     1.580    -0.205     3.365     0.079 
```

The second treatment raised sleep by 1.58 hours on average, but the interval runs from -0.21 to 3.37 hours and the p-value is 0.079. Compare the two sentences you might write. "A trend toward longer sleep (p = 0.079)" implies a real effect caught mid-emergence. "The second treatment increased sleep by 1.58 hours (95% CI -0.21 to 3.37, p = 0.079), a difference that did not reach significance" reports the estimate and its uncertainty and claims nothing the interval rules out. You are not reanalysing anything; you are describing the same numbers more accurately.

### It is a real problem

Sometimes the "trend" was holding the paper up. If the abstract concludes that the intervention works, and the only support is a non-significant comparison relabelled as a trend, then deleting the word deletes the finding, and no phrasing repairs that. Suppose your primary outcome came back at p = 0.11 with a confidence interval from -2 to 18 points on your scale, so the estimate is compatible with a small harm and a large benefit at once. The study has not answered the question, and presenting it as a positive result misreports what you found. The honest response is to report the estimate and its interval, describe the primary comparison as non-significant, and revise the abstract and discussion to say the study was inconclusive on this point rather than that it demonstrated an effect. This is a weaker claim than the one you set out to make. It is also the only one your data support, and making that correction yourself reads far better to a reviewer than defending the original word would.

## How to word your response

### If you are fine

> The reviewer questions our use of the word "trend". The increase we describe is a monotonic rise across the ordered time points, and we tested it formally rather than reading it from the means: the association is strong and significant (r = 0.84, p < 0.001). We have added the test statistic and its p-value to the Results (page X) and a sentence to the Methods (page X) naming the test, so the basis for the word is now explicit.

### If it was fixable

> The reviewer is right that "trend toward significance" is not an accurate description of a non-significant result. We have reworded the passage. The comparison is now reported as a difference of 1.58 hours (95% CI -0.21 to 3.37, p = 0.079) that did not reach significance (Results, page X), and the word "trend" has been removed here and in the two other places it appeared. The analysis is unchanged; the description now matches what the test returned.

### If it is a real problem

> We thank the reviewer for pressing on this. On revisiting the primary comparison we agree that describing it as a trend overstated the evidence: the difference was not significant (p = 0.11) and its confidence interval spans both a negligible and a substantial effect. We have removed the trend language, now report the estimate with its interval (Results, page X), and revised the Abstract and Discussion to describe the study as inconclusive on this outcome rather than as supportive of an effect (page X).

## Practice

A reviewer writes: *"The authors claim tooth growth increases with the vitamin C dose, but with only three dose levels this looks like noise rather than a trend. I would drop the claim."* Your study stands in as the `ToothGrowth` data, tooth length at three ascending doses. You run a test for trend before deciding whether to concede:

```r
ex_fit <- lm(len ~ dose, data = ToothGrowth)
summary(ex_fit)
```

Which of the three outcomes applies, and what do you write back?

<details><summary>Click to reveal solution</summary>

The obvious move, under pressure from a reviewer, is to delete the sentence. Here that would be the wrong call. The slope on dose is 9.76 units of length per mg (standard error 0.95), which is 10.25 standard errors from zero, giving a p-value of 1.23e-14, and dose alone accounts for 64% of the variance in length (R-squared 0.6443).

This is the first outcome, "you are fine". The increase is monotonic, large and significant, and "trend" is the correct word for it. You do not concede. Reply that the claim is supported by a formal test for trend, report the slope with its p-value, and add the test to the Methods. Three ordered levels are enough to fit and test a linear trend, so the number of levels is not the objection it appears to be. Where the groups are ordinal rather than numeric, the [Jonckheere-Terpstra test](/Jonckheere-Terpstra-Test-in-R.html) makes the same point without assuming a straight line.

</details>
