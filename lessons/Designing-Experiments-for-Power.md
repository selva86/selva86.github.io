---
title: "Experimentation Lesson 1: Designing Experiments for Power"
catalog_blurb: "Work out how many users your A/B test needs before you launch it."
description: "Statistical power from scratch: the two errors an A/B test can make, the effect size, alpha and n tradeoff, and computing sample size in R before you launch."
keywords: "statistical power, sample size calculation, power analysis in R, power.prop.test, type II error, effect size, minimum detectable effect, A/B testing, Cohen's d, underpowered experiment"
post_type: "LESSON"
curriculum_id: "6.170.1"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-experimentation"
course_title: "Experimentation"
course_lesson: "1"
course_total: "7"
course_landing: "R-Experimentation-Course.html"
course_next: "Variance-Reduction-with-CUPED.html"
course_prev: ""
---

=== step === cover
::eyebrow Lesson 1 of 7
## Designing Experiments for Power

Meera runs growth at an online shoe store. The checkout page gets about 6,000 visitors a week, and 4.0% of them complete a purchase. Her team has built a one-page checkout they believe will lift that to 4.6%. A 0.6 percentage-point lift sounds tiny, but across 312,000 visitors a year at an $85 average order, it is worth about $160,000 a year.

Before Meera splits any traffic, one question decides whether the test is worth running at all: **how many visitors does it need?** Too few, and the test will fail to notice a redesign that genuinely works. This lesson is about answering that question before a single visitor is randomized.

By the end you will be able to:

- Name the two ways an A/B test can be wrong, and say what statistical power means
- Estimate a design's power by simulating the experiment before running it
- Compute the sample size a test needs, and the smallest lift your traffic can detect
- Re-plan a test when the expected effect shrinks, using the effect/alpha/n tradeoff

**Prerequisites:** you have met the A/B test and the p-value ([A/B Testing and Experiment Design](AB-Testing-and-Experiment-Design.html), [Reading an Experiment](Reading-an-Experiment.html)), and you can write a short function in base R ([Comparing groups with t-tests](Comparing-Groups-with-t-tests.html) covers the two-sample test we will be sizing).

::widget power-curve {}

=== step === concept
::eyebrow The two errors
## A test can be wrong in two directions

Here is the experiment Meera plans to run. Half of checkout visitors see the old page, half see the new one-page design. After some number of weeks she compares the two conversion rates with a significance test and reads the p-value: below 0.05, declare the redesign a winner; above, do not ship it.

That verdict can go wrong in exactly two ways, because there are two possible worlds and two possible verdicts:

|  | Test says significant | Test says not significant |
|---|---|---|
| **The redesign truly lifts conversion** | Correct detection, probability \(1-\beta\) (the power) | **Miss** (Type II error), probability \(\beta\) |
| **The redesign does nothing** | **False winner** (Type I error), probability \(\alpha\) | Correct |

The first error you already know. \(\alpha\) (alpha) is the false-alarm rate you chose when you set the significance level: if the redesign does nothing, a 0.05 test hands Meera a false winner 5% of the time. The interactive below is that familiar machinery: the bell curve is what the test statistic does when nothing is going on, and the shaded tail is the p-value. Drag the observed statistic and watch when the verdict flips.

The second error is the one this lesson exists for. Suppose the one-page checkout genuinely lifts conversion from 4.0% to 4.6%, and the test still comes back not significant, just because too few visitors passed through. Meera scraps a $160,000-a-year improvement and never learns she was holding it. That is a **Type II error**, a miss, and its probability is written \(\beta\) (beta).

**Statistical power** is the flip side of the miss: \(\text{power} = 1 - \beta\), the probability the test detects the lift, assuming the lift is real and of a specific size. The working convention is to design for at least 80% power, the same way 0.05 is the convention for \(\alpha\). In short: alpha protects you from shipping junk; power protects you from throwing away gold.

::widget null-distribution {"tails":2,"start":2.0,"label":"observed z"}

=== step === quiz
::eyebrow Check yourself
## What does 80% power mean?

Meera reports that her checkout test, as designed, has 80% power. Which reading of that sentence is correct?

::quiz {"correct":2,"gate":true,"difficulty":"beginner"}
- There is an 80% chance the one-page checkout really is better
- If the redesign truly lifts conversion from 4.0% to 4.6%, the test has an 80% chance of coming back significant ::ok Exactly. Power is conditional: assume a specific true lift, then ask how often this design detects it. Assume a different lift and the power changes too.
- The test will only declare a false winner 20% of the time ::no Neither A nor C is what power means. Power is conditional: assume the lift is real and a specific size (4.0% to 4.6% here), then power is the chance the test detects it. It is not the probability the redesign is truly better (A), and its complement is the miss rate beta = 20%, not the false-winner rate alpha, which stays fixed at 5% (C).

=== step === concept
::eyebrow Feel it
## Run the experiment 2,000 times before running it once

Power sounds abstract until you simulate it, and nothing stops us from simulating: `rbinom()` can generate fake visitors with any true conversion rate we like. So let us build a world where the redesign **definitely works**, exactly the 4.0% to 4.6% lift Meera hopes for, and run the whole experiment 2,000 times at 500 visitors per arm. `prop.test()` is the standard two-proportion significance test; we record its p-value each time and count how often the test notices the lift that we know is there.

```r
set.seed(42)
p_control <- 0.040   # the old checkout's true conversion rate
p_new     <- 0.046   # the new one truly lifts it, by construction
n         <- 500     # visitors per arm

one_test <- function() {
  buys_a <- rbinom(1, n, p_control)   # control arm: how many of the n buy
  buys_b <- rbinom(1, n, p_new)       # variant arm
  prop.test(c(buys_b, buys_a), c(n, n))$p.value
}

pvals <- replicate(2000, one_test())
mean(pvals < 0.05)    # how often did the test detect the real lift?
#> [1] 0.0655
```

Read that number slowly. In a world where the redesign genuinely earns $160,000 a year, a 500-per-arm test catches it about 7 times in 100. The other 93 experiments end not significant, and in most companies that means the winning checkout gets quietly scrapped. The test was doomed before it started, and nobody would ever know.

[KEY INSIGHT]
Power is a property of the design, not of the data. You can, and should, compute it before collecting anything: simulate the experiment you plan to run, under the effect you hope is there, and count how often it succeeds. That fraction is the power.

=== step === concept
::eyebrow The levers
## Effect size, alpha, and n: the three levers

Why did 500 visitors per arm fail so badly? Because the signal was small relative to the noise. Let us name the pieces properly.

The **effect size** is how big the true difference is. In raw form it is just the lift, 0.046 minus 0.040. The standardized form divides by the spread of the data: \(d = \dfrac{\mu_B - \mu_A}{\sigma}\), where \(\mu_A\) and \(\mu_B\) (mu) are the two group means and \(\sigma\) (sigma) is the standard deviation of the metric, the typical visitor-to-visitor wobble. Measuring the gap in units of wobble is what makes \(d\) comparable across metrics; Cohen's much-quoted benchmarks call 0.2 small, 0.5 medium and 0.8 large.

For a two-arm test with \(n\) subjects in each arm, the normal approximation gives power in one line:

\[ \text{power} \;\approx\; \Phi\!\left( d\sqrt{\tfrac{n}{2}} \;-\; z_{\alpha/2} \right) \]

Every symbol in words: \(\Phi\) (Phi) is the standard normal's cumulative curve, the bell-curve lookup table that converts a z-score into a probability. \(z_{\alpha/2}\) is the bar a two-sided test must clear, about 1.96 when \(\alpha = 0.05\). And \(d\sqrt{n/2}\) is the expected daylight between the arms, measured in standard errors. Power rises when the daylight beats the bar more often.

The formula is the tradeoff. Three levers move power up: a bigger true effect \(d\), more visitors \(n\), or a laxer \(\alpha\) (rarely acceptable, it buys detection by inflating false winners). Notice that \(d\) is multiplied by \(\sqrt{n}\): the square root is why small effects get expensive so fast, and it is coming back in two steps.

Drag through the effect sizes below and read the curve: power versus sample size, with the marker on the \(n\) that buys 80% power. The interactive computes real numbers and hands you the matching base R call, `power.t.test()`, which speaks standardized \(d\) for a means test. Meera's conversion test uses raw proportions instead; the next step sizes it with the sister function.

::widget power-curve {}

=== step === tryit
::eyebrow In R
## Size Meera's test in one line

Base R answers the planning question directly for conversion rates. `power.prop.test()` links five quantities, the two rates, the significance level, the power, and \(n\) per arm, and solves for whichever one you leave out. Give it Meera's baseline, the hoped-for rate, and 80% power; leave `n` out and leave the significance level at its default, `sig.level = 0.05`. Fill in the three blanks.

```r
# Baseline 4.0%; the team expects 4.6%. How many visitors per arm
# does an 80%-power test at the usual 5% significance level need?
power.prop.test(p1 = ____, p2 = ____, power = ____)
```
::check {"regex":"p1\\s*=\\s*0\\.040?\\b[\\s\\S]*p2\\s*=\\s*0\\.046[\\s\\S]*power\\s*=\\s*0?\\.80?\\b","gate":true,"difficulty":"intermediate","ok":"n = 17942.67 per arm. Nearly 18,000 visitors per ARM, about 36,000 in total, to reliably see a lift worth 160,000 dollars a year. Undersized tests are how real improvements die.","no":"Three blanks: the baseline p1 = 0.040, the hoped-for p2 = 0.046, and power = 0.80. The significance level can stay at its default, sig.level = 0.05."}
::solution
```r
power.prop.test(p1 = 0.040, p2 = 0.046, power = 0.80)
#>      Two-sample comparison of proportions power calculation
#>
#>               n = 17942.67
#>              p1 = 0.04
#>              p2 = 0.046
#>       sig.level = 0.05
#>           power = 0.8
#>     alternative = two.sided
#>
#> NOTE: n is number in *each* group
```

=== step === concept
::eyebrow Flip the question
## The smallest lift your traffic can detect

So the answer is 17,943 visitors per arm. Meera's checkout sees about 6,000 visitors a week, split evenly that is 3,000 per arm per week, so 80% power arrives in week six. But most teams plan the other way around: the calendar is fixed first. Suppose Meera is only given four weeks, which buys 12,000 visitors per arm. Now flip the question: what is the smallest lift a four-week test can reliably see? Leave `p2` out and give `n` instead:

```r
# Four weeks of traffic: 12,000 visitors per arm. What lift is detectable?
power.prop.test(n = 12000, p1 = 0.040, power = 0.80)
#>      Two-sample comparison of proportions power calculation
#>
#>               n = 12000
#>              p1 = 0.04
#>              p2 = 0.04741861
#>       sig.level = 0.05
#>           power = 0.8
#>     alternative = two.sided
#>
#> NOTE: n is number in *each* group
```

That `p2` is the **minimum detectable effect**, the MDE: with 12,000 per arm, only lifts to about 4.74% or beyond (0.74 percentage points) get detected 80% of the time. The 0.6pp lift Meera actually expects sits below that line, so the four-week test is underpowered before it starts. Her honest options: run six weeks, or accept lower power and say so out loud.

```r
n_needed <- ceiling(power.prop.test(p1 = 0.040, p2 = 0.046, power = 0.80)$n)
c(per_arm = n_needed, weeks = ceiling(n_needed / 3000))
#> per_arm   weeks
#>   17943       6
```

The same algebra, rearranged for \(n\), explains why the MDE is so unforgiving:

\[ n \;\approx\; \frac{2\,\left(z_{\alpha/2} + z_{\beta}\right)^2}{d^2} \]

where \(z_{\beta}\) is the normal score matching your target power, about 0.84 for 80%. Everything on top is a constant once you fix \(\alpha\) and the power, so \(n\) moves with \(1/d^2\): **halve the effect and you need four times the visitors**. That inverse square is the single most useful planning fact in experimentation.

=== step === quiz
::eyebrow Check yourself
## The test came back not significant

Impatient, the team runs the checkout test for only two weeks: 6,000 visitors per arm, which gives about 37% power against the expected 0.6pp lift. The result: p = 0.21. What is the right conclusion?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The redesign does not work; kill it and move on
- The result is inconclusive: at 37% power the test would miss a real 0.6pp lift most of the time, so p = 0.21 neither confirms nor rules out the lift ::ok Right. A non-significant result from an underpowered test is an absence of evidence, not evidence of absence. The honest move is to keep the test running toward the planned sample size, not to conclude.
- Relax the significance level to 0.10 so the same data can clear the bar ::no Two traps here. Killing the redesign (A) reads a non-significant result from a 37%-power test as proof it fails, but that is absence of evidence, not evidence of absence. Relaxing the bar to 0.10 after seeing the data (C) inflates exactly the false-winner rate alpha was fixed in advance to control. The honest move is to keep running toward the planned sample size.

=== step === concept
::eyebrow When formulas break
## Skewed metrics: size the test by simulation

`power.prop.test()` fits Meera's primary metric because a conversion is a clean yes or no. Her secondary metric is not so tidy: **revenue per visitor**. Roughly 96 visitors in 100 spend exactly zero, and the rest spread out into a long tail of $40 orders, $90 orders, an occasional $400 one. A closed-form recipe like `power.t.test()` wants a bell-ish metric whose standard deviation you can name in advance. For a spike at zero plus a tail, any \(\sigma\) you plug in is a guess.

The honest tool is the one you already own from three steps ago: simulate the metric, run the fake experiment many times, count detections. Here is realistic fake revenue (a coin flip for who buys, a long-tailed lognormal for what they spend), a true 15% revenue lift, and one week of traffic at 3,000 per arm:

```r
set.seed(7)
sim_revenue <- function(n, lift = 1) {
  buys  <- rbinom(n, 1, 0.04)                            # who completes checkout
  buys * rlnorm(n, meanlog = 4.3, sdlog = 0.5) * lift    # what they spend
}

week <- sim_revenue(10000)
c(share_zero = mean(week == 0), mean_spend = round(mean(week), 2))
#> share_zero mean_spend
#>     0.9576     3.5800

one_ab <- function(n) {
  t.test(sim_revenue(n, lift = 1.15), sim_revenue(n))$p.value
}
pvals <- replicate(500, one_ab(3000))
mean(pvals < 0.05)   # power for a true 15% revenue lift, 3,000 per arm
#> [1] 0.188
```

About 19 detections in 100. One week of traffic is nowhere near enough to see even a 15% revenue lift, and no formula had to be trusted to learn that. The same recipe sizes any design you can simulate: unequal splits, capped or log-transformed metrics, medians instead of means.

[WARNING]
Everything in this lesson assumes one metric, two arms, and ONE look at the data when the planned sample size is reached. Checking the p-value every morning and stopping the moment it dips under 0.05 quietly multiplies your false winners. That failure, called peeking, and its cousins are exactly where Lesson 3 goes.

=== step === quiz
::eyebrow Check yourself
## Re-plan when the effect shrinks

Meera sized the test at roughly 18,000 per arm for the expected 0.6pp lift. A week before launch, the product team walks it back: a 0.3pp lift is more realistic. Roughly how many visitors per arm does 80% power need now?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- About 36,000: half the effect needs twice the visitors
- About 70,000: half the effect needs four times the visitors ::ok Right, n scales with 1 over d squared. The exact call, power.prop.test with p2 = 0.043, asks for 69,379 per arm, about 23 weeks of Meera's traffic. Numbers like that are why the next lesson is about shrinking the variance instead.
- Still about 18,000: alpha and power have not changed, so n stays put ::no The required n depends on the effect size too, and it is the strongest lever of the three. Halving the true lift does not double the sample, it quadruples it: n scales with 1 over d squared, so 0.3pp needs about 70,000 per arm, not 36,000 (A) and certainly not the same 18,000 (C).

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [Cohen (1988), Statistical Power Analysis for the Behavioral Sciences](https://doi.org/10.4324/9780203771587) - the book that defined effect size \(d\) and the 0.2 / 0.5 / 0.8 benchmarks quoted everywhere.
- [Kohavi, Tang and Xu (2020), Trustworthy Online Controlled Experiments](https://experimentguide.com/) - the industry A/B-testing playbook; its statistics chapters cover power, MDE and traffic planning in production settings.
- [R manual: power.prop.test](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/power.prop.test.html) - the exact function you used here, with `power.t.test` documented one page over.
- [Button et al. (2013), Power failure, Nature Reviews Neuroscience](https://doi.org/10.1038/nrn3475) - what chronic underpowering did to an entire research field, and why significant results from small studies overstate effects.

=== step === complete
## Lesson 1 complete

You now plan an experiment the way it should be planned: decide the effect worth detecting, fix alpha and the target power, and let the arithmetic tell you the sample size, before any traffic is split. You also know the two failure modes cold: a 500-per-arm test that misses a $160,000 lift 93 times in 100, and a non-significant result that means nothing because the test never had the power to speak.

The sting in the numbers was that inverse square: at Meera's traffic, six weeks for 0.6pp and about 23 weeks for 0.3pp. Next, Lesson 2: Variance Reduction with CUPED. The fourth lever is \(\sigma\) itself, and pre-experiment data you already have can shrink it, cutting those weeks down with zero extra visitors and zero bias.
