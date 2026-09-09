---
title: "The Bayesian t-test: measure evidence, not just significance"
description: "Run a Bayesian t-test in R with ttestBF(), read BF10 and BF01, test one-sample and paired designs, add a direction, and read a posterior credible interval."
keywords: "Bayesian t-test, ttestBF, Bayes factor, BF10, BF01, BayesFactor package, one-sample Bayesian t-test, paired Bayesian t-test, posterior credible interval, nullInterval"
mathjax: true
webr: true
date: "2026-09-09"
post_type: "LESSON"
course_id: "bayesian-decisions"
course_title: "Bayesian Decisions"
course_lesson: "3"
course_total: "9"
course_landing: "/dashboard.html"
course_prev: "Bayesian-Mini-2"
course_next: ""
curriculum_id: "0.0.34"
lesson_access: "windowed"
catalog_blurb: "Run a Bayesian t-test and read the evidence for or against no difference."
---

=== step === cover
## The Bayesian t-test: measure evidence, not just significance

Today let's understand how to weigh evidence for and against "no difference" directly, the Bayesian way.

Here is the setup you will use throughout. Sixty guinea pigs got vitamin C, thirty of them through orange juice (OJ) and the other thirty through a plain supplement (VC). Someone then measured how much each guinea pig's teeth grew. The question is simple: does the delivery method change tooth growth, and if it does, how strongly does the data say so, in either direction?

The boxplot below shows the two groups' tooth lengths side by side.

::widget chart-plotter {"data": [{"x":"VC","y":4.2},{"x":"VC","y":11.5},{"x":"VC","y":7.3},{"x":"VC","y":5.8},{"x":"VC","y":6.4},{"x":"VC","y":10},{"x":"VC","y":11.2},{"x":"VC","y":11.2},{"x":"VC","y":5.2},{"x":"VC","y":7},{"x":"VC","y":16.5},{"x":"VC","y":16.5},{"x":"VC","y":15.2},{"x":"VC","y":17.3},{"x":"VC","y":22.5},{"x":"VC","y":17.3},{"x":"VC","y":13.6},{"x":"VC","y":14.5},{"x":"VC","y":18.8},{"x":"VC","y":15.5},{"x":"VC","y":23.6},{"x":"VC","y":18.5},{"x":"VC","y":33.9},{"x":"VC","y":25.5},{"x":"VC","y":26.4},{"x":"VC","y":32.5},{"x":"VC","y":26.7},{"x":"VC","y":21.5},{"x":"VC","y":23.3},{"x":"VC","y":29.5},{"x":"OJ","y":15.2},{"x":"OJ","y":21.5},{"x":"OJ","y":17.6},{"x":"OJ","y":9.7},{"x":"OJ","y":14.5},{"x":"OJ","y":10},{"x":"OJ","y":8.2},{"x":"OJ","y":9.4},{"x":"OJ","y":16.5},{"x":"OJ","y":9.7},{"x":"OJ","y":19.7},{"x":"OJ","y":23.3},{"x":"OJ","y":23.6},{"x":"OJ","y":26.4},{"x":"OJ","y":20},{"x":"OJ","y":25.2},{"x":"OJ","y":25.8},{"x":"OJ","y":21.2},{"x":"OJ","y":14.5},{"x":"OJ","y":27.3},{"x":"OJ","y":25.5},{"x":"OJ","y":26.4},{"x":"OJ","y":22.4},{"x":"OJ","y":24.5},{"x":"OJ","y":24.8},{"x":"OJ","y":30.9},{"x":"OJ","y":26.4},{"x":"OJ","y":27.3},{"x":"OJ","y":29.4},{"x":"OJ","y":23}], "geoms": ["boxplot"], "x": "supp", "y": "len"}

OJ's box sits higher than VC's in the picture above. But by how much, and how sure can we actually be about that? Let's find out.

=== step === concept
## Why a p-value can't say there's no difference

Let's start with the test you already know.

```r
# Compare tooth length between the two delivery methods with a classical t-test.
tooth <- ToothGrowth
t.test(len ~ supp, data = tooth, var.equal = TRUE)
#> 
#> 	Two Sample t-test
#> 
#> data:  len by supp
#> t = 1.9153, df = 58, p-value = 0.06039
#> alternative hypothesis: true difference in means between group OJ and group VC is not equal to 0
#> 95 percent confidence interval:
#>  -0.1670064  7.5670064
#> sample estimates:
#> mean in group OJ mean in group VC 
#>         20.66333         16.96333 
```

The p-value is 0.06039. That's just above the usual 0.05 cutoff, so by the common rule this counts as "not significant." A beginner might read that as "the two delivery methods don't differ." But that is not what the p-value said.

A p-value only measures how surprising this data would be if the two groups truly had the exact same average tooth length. It says nothing about how likely that "no difference" idea actually is. A p-value of 0.06 just means the data isn't quite surprising enough, at the usual bar, to rule that idea out.

The picture below shows that same idea another way: the curve is what you would see if the two groups really were identical, and the observed t of 1.9153 sits inside it.

::widget null-distribution {"tails": 2, "start": 1.9153, "label": "t statistic (df = 58)"}

Drag the marker and watch the shaded area on both tails shrink or grow. That area is the same kind of quantity as the p-value: the share of the curve at least as extreme as the marker, counted on both sides. One note on the number the widget shows: it uses a plain normal curve as a stand-in for the exact t-distribution with 58 degrees of freedom, so treat its readout as a close approximation. The exact figure is the 0.06039 you already got from t.test() above.

So exactly how does that 0.06039 come out of the t-distribution? Let's compute it directly.

=== step === tryit
## Your turn: get the p-value from the t-distribution

The number t.test() printed, 0.06039, is not looked up from a table. It comes straight from the t-distribution's cumulative probability function, pt(). For a two-sided test you want the area in both tails beyond the observed t, so compute one tail and double it.

```r
# 2 * pt(-1.9153, df = 58) gives the area in one tail; double it for both.
# One line. Press Check when you have it.
```
::check {"regex": "pt[(][^)]*58", "gate": true, "difficulty": "beginner", "ok": "Right: 2 * pt(-1.9153, df = 58) returns 0.06038924, matching the 0.06039 t.test() reported. A p-value is a computed tail area under H0, nothing more.", "no": "pt(q, df) gives the area to the left of q under the t-distribution with that df. Use pt(-1.9153, df = 58) for one tail, then multiply by 2 for both tails."}
::solution
```r
# Compute the p-value directly and compare it to t.test()'s 0.06039.
2 * pt(-1.9153, df = 58)
#> [1] 0.06038924
```

=== step === concept
## What a Bayes factor actually compares
::prose-only the formula and the ToothGrowth numbers already on screen from steps 2-3 carry the idea; no new visual is needed

So a p-value can rule "no difference" out, when the data is surprising enough. But it can never rule "no difference" in. Is there a number that can do both?

There is. It's called a Bayes factor, and it compares two ideas directly, instead of testing only one of them on its own. Call the idea that a real difference exists H1, and the idea that there is no difference H0. Read them out loud as "H one" and "H nought."

A Bayes factor, written BF10, is a ratio: how much better H1 predicts the data you actually saw compared to how well H0 predicts that same data.

\[
BF_{10} = \frac{P(\text{data} \mid H_1)}{P(\text{data} \mid H_0)}
\]

\(P(\text{data} \mid H_1)\) is how likely your data is if a real difference exists. \(P(\text{data} \mid H_0)\) is how likely that same data is if there is no difference. BF10 is just the first divided by the second.

The reading rule is short. BF10 above 1 favors H1, a real difference. BF10 below 1 favors H0, no difference. BF10 near 1 means the data can't tell the two apart. Unlike a p-value, that last case, favoring H0, is one a Bayes factor can actually report.

Let's compute BF10 for the tooth growth data and see where it lands.

=== step === concept
## Running a Bayesian t-test with ttestBF()

R computes a Bayesian t-test with one function, ttestBF(), from the BayesFactor package. Install it once with install.packages("BayesFactor"). That package is not available in this browser runtime, so run this block in your own R console; the numbers below are exactly what it returns there.

ttestBF() mirrors t.test(): the same formula interface, the same data frame.

```r-static
# Run this locally: BayesFactor is not available in the browser runtime.
suppressMessages(library(BayesFactor))
bf_tooth <- ttestBF(formula = len ~ supp, data = ToothGrowth)
bf_tooth
#> Bayes factor analysis
#> --------------
#> [1] Alt., r=0.707 : 1.198757 ±0.01%
#> 
#> Against denominator:
#>   Null, mu1-mu2 = 0 
#> ---
#> Bayes factor type: BFindepSample, JZS

extractBF(bf_tooth)$bf
#> [1] 1.198757
```

Read the printout top to bottom. The line marked [1] is H1, a real difference, with r=0.707 naming the width ttestBF() puts on its default prior for the effect size. The "Against denominator" line is H0: mu1-mu2 = 0, no difference. The number 1.198757 is BF10, the ratio comparing them. extractBF(bf_tooth)$bf pulls that same number out on its own, ready to use in code.

BF10 here is about 1.2, only a little above 1. So the data is barely more consistent with a real difference than with no difference at all, basically the same inconclusive message as the p = 0.06039 you already saw, just stated as a ratio instead of a tail area.

=== step === concept
## BF01: the same evidence, read the other way

BF10 reports the evidence for H1. The evidence for H0, written BF01, is just its reciprocal, plain arithmetic that runs right here.

```r
# Flip BF10 to get the evidence for "no difference" instead.
bf10 <- 1.198757
bf01 <- 1 / bf10
round(bf01, 3)
#> [1] 0.834
```

BF01 comes out to 0.834. So the data is 0.834 times as likely under H0 as under H1, almost exactly even. Whichever direction you read this Bayes factor, near 1 means the data can't tell OJ and VC apart, matching what the p-value already showed.

=== step === concept
## Reading a Bayes factor on the evidence scale

1.2 or 0.834, neither number means much on its own. Statisticians turn a raw BF10 into words with a labelled scale (the Jeffreys and JASP convention). cut() builds that scale in base R.

```r
# Turn any BF10 into a plain evidence label using the standard scale.
interpret_bf <- function(bf10) {
  cut(bf10,
      breaks = c(0, 1/30, 1/10, 1/3, 1, 3, 10, 30, Inf),
      labels = c("Very strong for H0", "Strong for H0", "Moderate for H0",
                 "Anecdotal for H0", "Anecdotal for H1", "Moderate for H1",
                 "Strong for H1", "Very strong for H1"))
}

data.frame(BF10 = c(0.05, 0.33, 1.2, 8, 40),
           evidence = interpret_bf(c(0.05, 0.33, 1.2, 8, 40)))
#>    BF10           evidence
#> 1  0.05      Strong for H0
#> 2  0.33    Moderate for H0
#> 3  1.20   Anecdotal for H1
#> 4  8.00    Moderate for H1
#> 5 40.00 Very strong for H1
```

The breaks split the number line into eight bands, from "Very strong for H0" on the far left to "Very strong for H1" on the far right. Our tooth-growth value of 1.2 lands in "Anecdotal for H1," the band right next to dead even. That's the honest label for evidence this weak: worth a mention, not worth a decision.

The table below lets you flip between the raw numbers and a report-ready version of the same scale.

::widget styled-table {"cols": ["BF10", "Evidence"], "rows": [[0.05, "Strong for H0"], [0.33, "Moderate for H0"], [1.2, "Anecdotal for H1"], [8, "Moderate for H1"], [40, "Very strong for H1"]], "formats": {}, "title": "Reading a Bayes factor", "note": "Breaks at 1/30, 1/10, 1/3, 1, 3, 10, and 30 (the Jeffreys and JASP scale)."}

Notice the two ends of the scale mirror each other: 1/30 against 30, 1/10 against 10, and so on. That symmetry is exactly why BF01 = 1/BF10 turns "Anecdotal for H1" into "Anecdotal for H0" and nothing more dramatic than that.

=== step === concept
## One-sample and paired Bayesian t-tests

ttestBF() covers two more study designs by swapping its arguments. The built-in sleep data gives a fresh running example: 10 patients, each given two different sleep drugs, with their extra hours of sleep recorded for both. Use it to see how a one-sample test and a paired test relate.

A one-sample test checks whether one group's mean differs from a fixed value, set with mu. Testing just one drug's hours against mu = 0 asks whether that drug changed sleep at all.

A paired test is for the same subjects measured twice, which is exactly what the two drugs give us here. Pass both vectors with paired = TRUE.

The two vectors these tests need are just ordinary numbers pulled out of sleep, so build them and look at their difference here.

```r
# Pull each drug's sleep hours and look at how they differ, patient by patient.
g1 <- sleep$extra[sleep$group == 1]
g2 <- sleep$extra[sleep$group == 2]
mean(g1 - g2)
#> [1] -1.58
length(g1 - g2)
#> [1] 10
```

On average, drug 1 gave 1.58 fewer hours of extra sleep than drug 2, across all 10 patients. That's the gap the paired test measures. BayesFactor isn't available here either, so run the three tests below locally.

```r-static
# Run this locally: BayesFactor is not available in the browser runtime.
suppressMessages(library(BayesFactor))

drug2 <- sleep$extra[sleep$group == 2]
ttestBF(x = drug2, mu = 0)
#> Bayes factor analysis
#> --------------
#> [1] Alt., r=0.707 : 10.71554 ±0%
#> 
#> Against denominator:
#>   Null, mu = 0 
#> ---
#> Bayes factor type: BFoneSample, JZS

bf_paired <- ttestBF(x = g1, y = g2, paired = TRUE)
bf_paired
#> Bayes factor analysis
#> --------------
#> [1] Alt., r=0.707 : 17.25888 ±0%
#> 
#> Against denominator:
#>   Null, mu = 0 
#> ---
#> Bayes factor type: BFoneSample, JZS

extractBF(ttestBF(x = g1 - g2))$bf
#> [1] 17.25888
```

The one-sample test on drug 2 alone gives BF10 = 10.72, strong evidence that drug moved sleep away from zero. The paired test on both drugs together gives BF10 = 17.26, even stronger evidence that the two drugs differ.

Look closely at the printout for the paired test: it says BFoneSample, not some separate "paired" type. That's because a paired test is a one-sample test on the differences between each pair. Run ttestBF() directly on g1 - g2 and you get 17.25888 back, exactly the same number.

So anything you learn about one-sample tests carries straight over to paired tests. They are the same computation on a different vector.

=== step === concept
## Testing a one-sided prediction with nullInterval

So far H1 has meant "some difference, in either direction." Often you predict a direction too. Suppose theory says drug 1 should give less sleep than drug 2, so g1 - g2 should be negative. The nullInterval argument restricts H1 to just that range.

Before running the directional test, check how often the data actually points that way.

```r
# Tally how many of the 10 sleep pair differences point in each direction.
diff_sign <- sign(g1 - g2)
table(diff_sign)
#> diff_sign
#> -1  0 
#>  9  1 
```

Nine of the ten patients had a negative difference; one was a tie. The data points almost entirely in the direction the theory predicted.

```r-static
# Run this locally: BayesFactor is not available in the browser runtime.
suppressMessages(library(BayesFactor))
bf_dir <- ttestBF(x = g1, y = g2, paired = TRUE, nullInterval = c(-Inf, 0))
bf_dir
#> Bayes factor analysis
#> --------------
#> [1] Alt., r=0.707 -Inf<d<0    : 34.41694  ±0%
#> [2] Alt., r=0.707 !(-Inf<d<0) : 0.1008246 ±0%
#> 
#> Against denominator:
#>   Null, mu = 0 
#> ---
#> Bayes factor type: BFoneSample, JZS
```

The printout now shows two rows. Row [1] restricts H1 to a negative effect and gets BF10 = 34.42, roughly double the two-sided 17.26 from before. Row [2] is the opposite direction, and it comes back at 0.1, strongly against.

Why does concentrating on the predicted direction roughly double the evidence? Because the two-sided prior spreads its probability mass across both directions equally, half on positive effects nobody expected and half on negative ones. Once nine of the ten patients confirm the negative direction, dropping the half of the prior that was never going to fit lets the same data count for more.

=== step === concept
## Estimating the effect size from the posterior

A Bayes factor tells you whether an effect exists and how strongly. It doesn't say how big that effect is. For that, posterior() draws samples from the effect-size posterior, the distribution of plausible standardized effects (called delta) given the data and the model.

Sampling uses random draws, so set a seed first and run this locally too.

```r-static
# Run this locally: BayesFactor is not available in the browser runtime.
set.seed(1234)
post <- posterior(bf_paired, iterations = 10000, progress = FALSE)
round(quantile(post[, "delta"], c(0.025, 0.5, 0.975)), 3)
#>   2.5%    50%  97.5% 
#> -1.976 -1.086 -0.298 
```

The median of delta is about -1.09, a large effect. The 95% credible interval runs from -1.976 to -0.298. Because that whole range sits below zero, you can say the effect is credibly negative: a direct probability statement about the true effect, given this data and this model. A frequentist confidence interval can't make that statement; it only tells you which values of the effect the data is compatible with, not how probable any one of them is.

The widget below shows the same kind of update on a simpler generic example, so you can watch a posterior narrow as more data arrives.

::widget bayes-update {}

Move the "data points n" slider up and the posterior curve tightens and pulls toward the data. That's the same mechanism behind the -1.976 to -0.298 interval above: more consistent data narrows how uncertain you are about the true effect.

=== step === quiz
## Quick check: reading Bayes factors and credible intervals

There are two numbers here, each one easy to misread. Which sentence below gets both right?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- A BF10 of 1.2 is close to 1, so it proves there is no real difference between OJ and VC. ::no
- A 95% credible interval means that if you repeated the study many times, 95% of the intervals you calculated would contain the true effect. ::no
- A BF10 near 1 means the data can't distinguish H1 from H0 well, and a 95% credible interval is the range that holds the true effect with 95% probability, given the data and the model. ::ok Right. BF10 near 1 is inconclusive, not proof of H0. And a credible interval is a direct probability statement about the effect itself, which is exactly what makes it different from a confidence interval.
- A Bayes factor and a credible interval always agree, so once you compute one you don't need the other. ::no A Bayes factor answers whether an effect exists and how strongly. A credible interval answers how big it is, a separate question. Watch two specific misreadings: a BF10 near 1 is not proof of H0, it just means the data is inconclusive, and a 95% credible interval is not "95% of repeats would contain the truth"; it is the range holding the true effect with 95% probability given the data you actually collected.

=== step === tryit
## Your turn: build a Bayes-factor reporting helper

Put BF10, BF01, and the evidence label together into one function you can reuse on any Bayes factor. interpret_bf() is already defined and ready to use.

```r
# Build a helper returning BF10, BF01, and the evidence label together.
# bf_to_evidence <- function(bf10) { ... }
# One function definition. Press Check when you have it.
```
::check {"regex": "function[\\s\\S]*1\\s*/\\s*bf10[\\s\\S]*interpret_bf", "gate": true, "difficulty": "intermediate", "ok": "Right. bf_to_evidence(1.198757) bundles BF10 = 1.199, BF01 = 0.834, and the label 'Anecdotal for H1' from interpret_bf(), exactly what you would put in a results write-up.", "no": "Define a function that takes bf10, computes bf01 <- 1 / bf10, and calls interpret_bf(bf10) for the label. Return all three from a list."}
::solution
```r
# Bundle BF10, BF01, and the evidence label into one reusable function.
bf_to_evidence <- function(bf10) {
  bf01 <- 1 / bf10
  evidence <- interpret_bf(bf10)
  list(BF10 = round(bf10, 3), BF01 = round(bf01, 3), evidence = as.character(evidence))
}
bf_to_evidence(1.198757)
#> $BF10
#> [1] 1.199
#> 
#> $BF01
#> [1] 0.834
#> 
#> $evidence
#> [1] "Anecdotal for H1"
```

=== step === concept
## References

- Morey, R. D., & Rouder, J. N. [BayesFactor package documentation](https://cran.r-project.org/package=BayesFactor) (CRAN).
- Rouder, J. N., Speckman, P. L., Sun, D., Morey, R. D., & Iverson, G. (2009). [Bayesian t tests for accepting and rejecting the null hypothesis](https://doi.org/10.3758/PBR.16.2.225). Psychonomic Bulletin & Review.
- Morey, R. D. [Using the BayesFactor package: t-test examples](https://richarddmorey.github.io/BayesFactor/) (official manual).
- [ttestBF function reference](https://rdrr.io/cran/BayesFactor/man/ttestBF.html): arguments mu, paired, rscale, nullInterval (CRAN documentation).
- R Documentation, [the sleep dataset](https://stat.ethz.ch/R-manual/R-devel/library/datasets/html/sleep.html) (base R datasets package).

=== step === complete
## Reporting evidence like a Bayesian, from now on

You now have one decision rule you can reuse on your own data.

- Match ttestBF()'s interface to the design: formula for two groups, mu for one sample, x and y with paired = TRUE for repeated measures.
- Read BF10's direction and magnitude on the evidence scale: above 1 favors H1, below 1 favors H0, near 1 is inconclusive.
- Remember a Bayes factor can support H0. A p-value never can.
- Bring in posterior() once you need the size of the effect, not just whether it exists.

Next time someone hands you a p-value of 0.06 and calls it proof of "no effect," you will know exactly what number to compute instead, and exactly what it will and will not say.
