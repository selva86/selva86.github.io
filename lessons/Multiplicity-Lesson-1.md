---
title: "Multiplicity Lesson 1: Why more tests mean more false positives"
catalog_blurb: "What running many tests does to your false-positive rate."
description: "Simulate the multiple comparisons problem: watch false positives climb as tests pile up, derive the family-wise error rate, and measure what a correction costs."
keywords: "multiple comparisons, family-wise error rate, multiplicity, Bonferroni correction, Holm correction, false discovery rate, Benjamini-Hochberg, p-value distribution"
mathjax: true
webr: true
curriculum_id: "4.5.1"
post_type: "LESSON"
course_id: "handbook-multiplicity"
course_title: "Multiplicity, from the ground up"
course_lesson: "1"
course_total: "6"
course_landing: "tutorials/publishing.html"
course_next: ""
course_prev: ""
lesson_access: "free"
---

=== step === cover
::eyebrow Lesson 1 of 6
## Why more tests mean more false positives

Drag the slider below. It runs four thousand imaginary studies in which **nothing is real**, counts how many of them found at least one significant result anyway, and plots that share against `k`, the number of tests each study ran.

At `k = 1` it sits at 5%, the risk you signed up for. At `k = 14` it is past half.

By the end of this lesson you will be able to:

- Say what a p-value does when the null hypothesis is true, and why that makes false positives arithmetic rather than bad luck
- Work out the family-wise error rate for any number of tests, and say what every symbol in the formula means
- Decide what belongs in "the family", including analyses you ran and did not report
- Say what Bonferroni and Holm do to a p-value, and why both give the same answer when nothing is real
- Put a number on what a correction costs you, and name the two situations where the standard formula and the standard fix are the wrong tools

**Prerequisites:** you can run R and read a data frame; you know what a p-value is and what "significant at 0.05" means; you have seen a two-sample t-test. Nothing else is assumed.

::widget multiplicity-sim {"kStart":14,"kMax":50,"nStudies":4000,"corrections":["none","bonferroni","holm"],"seed":29,"study":1}

=== step === concept
::eyebrow The study we will follow all lesson
## Priya measured fourteen things

Priya runs a small sleep trial. One hundred and twenty volunteers, sixty assigned a twenty-minute wind-down routine before bed and sixty who keep their usual bedtime. Because she is thorough, she records fourteen outcomes for every person: minutes taken to fall asleep, total sleep time, number of night wakings, sleep efficiency, morning alertness, mood, daytime naps, cups of coffee, evening screen time, daily steps, resting heart rate, stress, appetite, headaches.

She runs a t-test on each one and two come back under 0.05. She writes those two up.

Here is the part that matters. In the simulation below, **the routine does absolutely nothing**. For every one of the fourteen outcomes both arms are drawn from the same distribution, so any difference is pure chance. Run it and watch two "findings" appear anyway.

```r
set.seed(168)
outcomes <- c("minutes_to_sleep", "total_sleep", "night_wakings", "sleep_efficiency",
              "morning_alertness", "mood", "daytime_naps", "caffeine_cups",
              "screen_time", "steps", "resting_hr", "stress", "appetite", "headaches")

# 60 people in each arm, and NO real effect on any outcome.
p <- sapply(outcomes, function(outcome) {
  routine <- rnorm(60)
  usual   <- rnorm(60)
  t.test(routine, usual)$p.value
})

data.frame(outcome = outcomes, p_value = round(p, 3), reported = p < 0.05, row.names = NULL)
#>              outcome p_value reported
#> 1   minutes_to_sleep   0.512    FALSE
#> 2        total_sleep   0.197    FALSE
#> 3      night_wakings   0.041     TRUE
#> 4   sleep_efficiency   0.894    FALSE
#> 5  morning_alertness   0.694    FALSE
#> 6               mood   0.193    FALSE
#> 7       daytime_naps   0.035     TRUE
#> 8      caffeine_cups   0.389    FALSE
#> 9        screen_time   0.361    FALSE
#> 10             steps   0.554    FALSE
#> 11        resting_hr   0.152    FALSE
#> 12            stress   0.900    FALSE
#> 13          appetite   0.452    FALSE
#> 14         headaches   0.325    FALSE
```

Fewer night wakings, `p = 0.041`. Fewer daytime naps, `p = 0.035`. Both are false. Neither test is broken, neither p-value is miscalculated, and Priya did nothing dishonest. The rest of this lesson is about where those two came from and what to do about it.

=== step === concept
::eyebrow The engine of the whole problem
## When nothing is real, a p-value is a random number between 0 and 1

This is the single fact that makes everything else follow, and most people who use p-values daily have never seen it.

A p-value answers: if the null hypothesis were true, how often would I see a difference at least this large? For a test whose statistic is continuous, like a t-test, that definition has an exact and slightly startling consequence. **Under a true null hypothesis the p-value is uniformly distributed on 0 to 1.** Every value is as likely as every other. A p of 0.02 is exactly as likely as a p of 0.72.

That is not an approximation or a rule of thumb, it is a definition unfolding. If \(P\) is the p-value and the null is true, then by construction \(\Pr(P \le x) = x\) for every \(x\) between 0 and 1. Read that with \(x = 0.05\): the chance a single honest test hands you a p-value below 0.05 when nothing is happening is 0.05. That is what "5% significance level" means, stated from the other side.

Run four thousand t-tests on pure noise and look at the shape.

```r
set.seed(1)
null_p <- replicate(4000, t.test(rnorm(60), rnorm(60))$p.value)

hist(null_p, breaks = 20, col = "#cfe3d8", border = "white",
     main = "4000 tests, nothing real in any of them",
     xlab = "p-value")

mean(null_p < 0.05)   # the bottom 5% of the range
#> [1] 0.047
mean(null_p < 0.50)   # half the range holds half the p-values
#> [1] 0.486
mean(null_p > 0.90)   # so does the top tenth
#> [1] 0.104
```

Flat. No pile-up near 1, no pile-up anywhere. Roughly 5% of the bars sit to the left of 0.05, roughly 10% sit above 0.90, and the tail below 0.05 is not special in any way except that we chose to call it significant.

[KEY INSIGHT]
A significance test is a lottery with a 1-in-20 payout, and under a true null the ticket is drawn uniformly. Buy one ticket and you rarely win. Buy fourteen and you probably do.

=== step === quiz
::eyebrow Check yourself
## What does the histogram say?

You test a drug that has no effect whatsoever, on 1,000 independent samples, and collect the 1,000 p-values. Which describes what you would see?

::quiz {"correct":3,"gate":true,"difficulty":"beginner"}
- Most p-values bunched near 1, because the null is true ::no A large p-value means "consistent with the null", so it feels like the null should produce them. It does not favour them. Under a true null every p-value from 0 to 1 is equally likely, so about as many land in 0.0 to 0.1 as in 0.9 to 1.0.
- Most p-values bunched near 0.5, tailing off at both ends ::no That would be true of a mean or a t-statistic, which do pile up near their expected value. The p-value is different: it is a probability that has been deliberately constructed so that every value is equally likely under the null. The histogram is flat, not humped.
- A flat histogram, with about 50 of the 1,000 falling below 0.05 ::ok Exactly. Uniform on 0 to 1, so about 5% of a completely dead set of tests land under 0.05. Those 50 are not mistakes; they are the price of the 0.05 threshold, paid one test at a time.
- A flat histogram, but with none below 0.05, because there is no effect ::no The absence of an effect does not stop a p-value from being small. It only makes small p-values rare, at exactly the rate you set: 5%.

=== step === concept
::eyebrow The arithmetic
## From one test to k tests

Take the uniform fact from two steps ago and stack it. Two symbols and one line of algebra do the rest.

Let \(\alpha\) be the per-test significance level, the cutoff you compare each p-value against, conventionally \(\alpha = 0.05\). Let \(k\) be the number of tests in the family, meaning the number of tests you are prepared to count as one body of work. Assume for now that the \(k\) tests are independent of one another.

Under a true null, one test stays quiet with probability \(1-\alpha\). For all \(k\) to stay quiet, all \(k\) independent events have to happen, so multiply:

\[ \Pr(\text{no test fires}) = (1-\alpha)^k \]

At least one firing is the complement of none firing, so subtract from one. The result is the **family-wise error rate**, the chance that a family of \(k\) tests produces at least one false positive when nothing at all is real:

\[ \mathrm{FWER} = 1 - (1-\alpha)^k \]

Put Priya's numbers in. She had \(\alpha = 0.05\) and \(k = 14\):

\[ 1 - 0.95^{14} = 1 - 0.488 = 0.512 \]

More than half. Priya was more likely than not to write up at least one thing that was not there, before she collected a single measurement. Her two "findings" were not bad luck, they were the expected outcome of the design.

Drag `k` from 1 upward in the simulation below and watch the measured share climb along the curve the formula predicts. The lower strip shows one of those four thousand studies test by test, so you can see the individual p-values that produce the dot above.

::widget multiplicity-sim {"kStart":1,"kMax":50,"nStudies":4000,"corrections":["none"],"seed":29,"study":1}

Notice that the climb is steep early and then flattens. Going from 1 test to 5 moves the rate from about 5% to about 22%. Going from 30 tests to 50 only moves it from about 77% to about 92%, because by then a false positive is close to guaranteed and there is little room left to climb.

=== step === tryit
::eyebrow Your turn
## Count the family, then work out the rate

Arun, in the lab next door, ran a different study. He compared two groups on **four** outcomes, and he measured each of those four outcomes at **three** timepoints: week 1, week 4, week 12. He ran a separate test for each outcome at each timepoint, and he reports the one that came back significant.

Work out how many tests are in Arun's family, put that number in `k`, and run it. The trap here is that three different numbers in that paragraph look like plausible answers, and only one of them is the count of tests actually run.

```r
alpha <- 0.05
k     <- 2           # replace 2 with the number of tests in Arun's family
1 - (1 - alpha)^k
```
::check {"regex":"k\\s*<-\\s*12","gate":true,"difficulty":"beginner","ok":"Right: 4 outcomes at 3 timepoints is 4 times 3 = 12 separate tests, and 1 - 0.95^12 = 0.4596. Arun had a 46% chance of finding at least one significant result with nothing real in the data.","no":"Not the number of tests yet. It is not 4 (outcomes), not 3 (timepoints), and not 1 (the result he reported). Every outcome-timepoint pair is its own test, so multiply."}
::solution
```r
alpha <- 0.05
k     <- 12          # 4 outcomes x 3 timepoints
1 - (1 - alpha)^k
#> [1] 0.4596
```

=== step === concept
::eyebrow The part that is easy to get wrong
## The family is bigger than the tests you report

So far `k` has been "how many tests you ran". That is too narrow, and the gap is where most real inflation hides.

Go back to Priya. Suppose she measures **one** outcome, night wakings, and reports **one** t-test. Clean study, `k = 1`, nothing to correct. Except that a night-wakings count is the kind of measurement where a handful of people can sit far above everyone else, so she has to decide in advance how she will handle that. She could test the counts as recorded. She could pull the most extreme values in to the 5th and 95th percentiles, which is a standard and defensible thing to do. Or she could count how many people beat the median, which is also standard and also defensible.

Three defensible analyses, one dataset, three different p-values. If Priya looks at all three and reports the one that came out best, how often does a dead outcome look significant? Not 5%. Measure it.

```r
set.seed(7)

one_analyst <- function() {
  routine <- rnorm(60)      # again: the routine does nothing
  usual   <- rnorm(60)

  p_raw <- t.test(routine, usual)$p.value          # 1. the scores as recorded

  both <- c(routine, usual)                        # 2. pull the extremes in
  lo <- quantile(both, 0.05)
  hi <- quantile(both, 0.95)
  pull_in <- function(v) { v[v < lo] <- lo; v[v > hi] <- hi; v }
  p_trim <- t.test(pull_in(routine), pull_in(usual))$p.value

  cut <- median(both)                              # 3. count who beat the median
  p_split <- prop.test(c(sum(routine > cut), sum(usual > cut)), c(60, 60))$p.value

  c(first_analysis = p_raw, best_of_three = min(p_raw, p_trim, p_split))
}

forks <- t(replicate(2000, one_analyst()))
round(colMeans(forks < 0.05), 3)
#> first_analysis  best_of_three
#>          0.054          0.086
```

Committing to the first analysis gives 5.4%, which is 5% plus simulation noise, exactly as promised. Picking the best of three gives 8.6%. The paper still reports one test. The family still has three members.

This is what Gelman and Loken called the garden of forking paths, and the sharp version of it is worse than it first looks: **you do not have to try all three for the count to be three.** If you would have reached for the median split had the raw analysis come back at 0.09, then the median split was in your family whether or not you ran it. The family is the set of analyses your data could have led you to, not the set you happened to execute.

One more thing worth noticing in that output. Three forks gave 8.6%, but the formula from the last step predicts \(1 - 0.95^3 = 0.143\) for three tests. It came in well under. That is not an error, and step twelve comes back to why.

=== step === quiz
::eyebrow Check yourself
## How big is this family?

A researcher plans to compare two groups on a single outcome. Before looking at any p-value she decides she will fit the model with age and sex as covariates, and if the residuals look skewed she will log-transform the outcome and refit. In the end the residuals look fine, so she runs one model and reports one test.

How many tests are in her family?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- One, because she ran one model and reported one test ::no This is the answer that feels obviously right and is the reason the problem is so persistent. The count is not what you executed, it is what the data could have led you to execute. Her decision rule had a branch in it, and the branch she did not take still had a chance of producing a significant result.
- Two, because the log-transformed model was a live option that the data could have selected ::ok Right. She pre-committed to a rule with two possible endpoints, so there were two chances for a false positive even though only one model was ever fitted. The family is the set of analyses reachable from her data, not the set she ran.
- Three: the untransformed model, the transformed model, and the residual check ::no Close on the instinct but wrong on the count. Looking at the residuals is a diagnostic, not a test of her hypothesis, and it produces no p-value that could be reported as a finding. Only the two candidate models could.
- Zero, because she pre-specified her decision rule in advance ::no Pre-specifying helps enormously with honesty and it is the right thing to do, but it does not shrink the family. A pre-specified rule with two branches is still two chances. What pre-specification buys you is that the count is knowable rather than invented after the fact.

=== step === widget
::eyebrow The fix, and what it actually is
## A correction moves the threshold, it does not fix the p-value

Every multiplicity correction does one thing: it makes each individual test harder to pass, by exactly enough that the whole family still fails at rate \(\alpha\).

**Bonferroni** is the blunt version. Multiply every p-value by the number of tests, capping at 1:

\[ p_i^{\mathrm{adj}} = \min(1,\; k\,p_i) \]

Comparing \(k p_i\) against \(\alpha\) is the same as comparing \(p_i\) against \(\alpha/k\), so the honest description is that Bonferroni moves the bar from 0.05 to 0.05 divided by the number of tests. With Priya's fourteen outcomes, a p-value now has to beat 0.0036 rather than 0.05.

**Holm** is the same idea applied in order rather than all at once. Sort the p-values from smallest to largest, writing \(p_{(1)} \le p_{(2)} \le \cdots \le p_{(k)}\). The \(i\)-th smallest is multiplied by \(k-i+1\) instead of by \(k\), and the adjusted values are then forced not to decrease as you walk up the list:

\[ p_{(i)}^{\mathrm{adj}} = \max_{j \le i} \; \min\!\left(1,\; (k-j+1)\, p_{(j)}\right) \]

So the smallest p-value is multiplied by \(k\), exactly as Bonferroni does, the second smallest by \(k-1\), the third by \(k-2\), and the largest by 1. Every test after the first faces a gentler penalty, which is where Holm's extra power comes from.

Switch the correction on below and watch the red curve drop onto the alpha line and stay there for every value of `k`.

::widget multiplicity-sim {"kStart":14,"kMax":50,"nStudies":4000,"corrections":["none","bonferroni","holm"],"seed":29,"study":1}

Two things to look for. First, the corrected curve is flat: the whole point is that the family-wise error rate no longer depends on how many tests you ran. Second, Bonferroni and Holm produce **identical** curves. That is not a bug in the simulation.

[NOTE]
When nothing is real, the only way either procedure calls anything significant is if the smallest p-value in the family clears the bar. Bonferroni asks whether \(k\,p_{(1)} < \alpha\). Holm's very first step asks the same question, because the smallest p-value is multiplied by \(k\) under both. So the two procedures fail together and succeed together, and their family-wise error rates are exactly equal.

=== step === quiz
::eyebrow Check yourself
## So why prefer Holm?

You saw that Holm and Bonferroni give the same family-wise error rate when nothing is real. Given that, what does choosing Holm actually buy you?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- A lower false-positive rate, since Holm is the more modern procedure ::no The simulation you just ran says otherwise: the two curves sit on top of each other. Both control the family-wise error rate at alpha, and neither does better than the other on that measure. If Holm bought a lower error rate it would have to be buying it with something, and it is not.
- Nothing, they are the same procedure written two ways ::no They agree on whether ANY test is significant, but they disagree beyond that. Bonferroni multiplies every p-value by k; Holm multiplies the second smallest by k-1, the third by k-2, and so on. Those are different numbers for every test except the smallest.
- More real effects detected when several effects are genuinely present, at no cost to the error rate ::ok Exactly. Once the smallest p-value has cleared its bar, Holm gives the next one an easier bar than Bonferroni does, and so on up the list. When only one effect is real the two agree; when several are real Holm finds more of them. Same protection, more power, which is why it is the default recommendation.
- Protection against tests that are correlated with one another ::no Neither procedure needs the tests to be independent, and neither exploits correlation either. Both hold the family-wise error rate at or below alpha whatever the correlation structure, which makes them safe but, when tests are strongly correlated, conservative.

=== step === concept
::eyebrow The other side of the ledger
## What a correction costs you

Every discussion of multiplicity that stops at "apply a correction" has left out half the story. Moving the bar from 0.05 to 0.05 divided by 14 does not only block false positives. It blocks true ones too.

Give Priya a real effect this time. Say the routine genuinely helps one of the fourteen outcomes, shifting it by 0.55 standard deviations, which for sixty people per arm is a moderately well-powered comparison. The other thirteen outcomes are dead, and since we know a null p-value is uniform we can generate those thirteen with `runif(13)` instead of simulating thirteen more t-tests.

How often does the real effect get detected, before and after correcting across all fourteen?

```r
set.seed(21)

one_trial <- function() {
  routine <- rnorm(60, mean = 0.55)   # the ONE outcome the routine really moves
  usual   <- rnorm(60, mean = 0)
  p_real  <- t.test(routine, usual)$p.value

  p_dead  <- runif(13)                # 13 outcomes with nothing in them
  p_all   <- c(p_real, p_dead)

  c(uncorrected = p_real < 0.05,
    after_holm  = p.adjust(p_all, method = "holm")[1] < 0.05)
}

round(colMeans(t(replicate(3000, one_trial()))), 3)
#> uncorrected  after_holm
#>       0.845       0.518
```

A real effect that would have been found 84.5% of the time is now found 51.8% of the time. A third of the detections are gone, and they are gone because of thirteen measurements that had nothing to do with this one.

[WARNING]
This is the reason multiplicity is a design problem before it is an analysis problem. You cannot measure fourteen things, correct across all fourteen, and expect the study to retain the power it was planned with. The cheap fix is not a better correction; it is naming one primary outcome before the data arrive, so the family that carries your main claim has one member in it.

=== step === concept
::eyebrow Where this stops working
## Two limits worth knowing

**The formula assumes independence, and real tests rarely are.** \(1-(1-\alpha)^k\) came from multiplying \(k\) independent probabilities together. If your tests are correlated, and they usually are because they share a dataset, the inflation is real but smaller. You saw this already: the three forking analyses in step seven gave 8.6%, well under the 14.3% the formula predicts for three tests, because all three were computed on the same sixty people. Treat \(1-(1-\alpha)^k\) as the worst case, an upper bound that tells you how bad it could get.

**Family-wise error is the wrong target for a large screen.** Controlling the chance of *even one* false positive is the right goal when a single wrong claim damages the paper. It is the wrong goal when you are producing a shortlist for follow-up, where a few false leads are cheap and missing real ones is expensive. There the right quantity is the **false discovery rate**: not the chance of any error, but the expected proportion of your called results that are wrong. Benjamini and Hochberg's procedure controls it, and R spells it `method = "BH"`.

Watch all three side by side. Two hundred tests, twenty of which are real effects of 0.55 standard deviations, and we know which is which because we planted them.

```r
set.seed(3)
truth <- c(rep(TRUE, 20), rep(FALSE, 180))   # the first 20 are real
p200  <- numeric(200)

for (j in 1:200) {
  shift   <- if (truth[j]) 0.55 else 0
  p200[j] <- t.test(rnorm(60, mean = shift), rnorm(60))$p.value
}

holm <- p.adjust(p200, method = "holm")
bh   <- p.adjust(p200, method = "BH")

data.frame(
  method     = c("none", "Holm", "BH"),
  called     = c(sum(p200 < 0.05), sum(holm < 0.05), sum(bh < 0.05)),
  really_are = c(sum(p200 < 0.05 & truth), sum(holm < 0.05 & truth), sum(bh < 0.05 & truth)),
  are_noise  = c(sum(p200 < 0.05 & !truth), sum(holm < 0.05 & !truth), sum(bh < 0.05 & !truth))
)
#>   method called really_are are_noise
#> 1   none     25         19         6
#> 2   Holm      4          4         0
#> 3     BH     11         10         1
```

Read the three rows as three different bargains. No correction finds 19 of the 20 real effects and hands you 6 pieces of noise alongside them. Holm hands you 4 results and guarantees, near enough, that none of them is noise, but 16 real effects are lost. Benjamini-Hochberg finds 10 real ones with 1 false among them, which is roughly the 5% false discovery rate it promised, since 1 out of 11 is 9% and that is one unlucky test away from 5% in a run this small.

None of the three is correct in the abstract. Which bargain you want depends on what a wrong claim costs you.

=== step === tryit
::eyebrow Put it together
## A case where Holm is the wrong answer

A genomics lab screens 4,000 genes for association with a disease. The shortlist does not go into a paper; it goes to the bench, where each candidate is followed up experimentally at moderate cost. A hundred of the 4,000 really are associated, though of course the lab does not know that.

Under Bonferroni or Holm, 7 genes make the shortlist. All 7 are real, and 93 real ones are missed. That is the right trade for a headline claim and the wrong trade for a screen: the lab has capacity for dozens of follow-ups, and a few dead ends are cheaper than the discoveries it is throwing away.

Pick the correction that controls the false discovery rate rather than the family-wise error rate, and run it.

```r
set.seed(99)
real   <- c(rep(TRUE, 100), rep(FALSE, 3900))       # 100 genes really are associated
z      <- rnorm(4000, mean = ifelse(real, 3.2, 0))
p_gene <- 2 * pnorm(-abs(z))                        # a two-sided p-value per gene

adj <- p.adjust(p_gene, method = "holm")            # replace holm with the right method

data.frame(shortlisted = sum(adj < 0.05),
           really_are  = sum(adj < 0.05 & real),
           are_noise   = sum(adj < 0.05 & !real))
```
::check {"regex":"method\\s*=\\s*.{0,1}(BH|fdr)","gate":true,"difficulty":"intermediate","ok":"Right. Benjamini-Hochberg shortlists 31 genes, 30 of them real and 1 noise. Against Holm's 7, that is 23 extra real discoveries bought with a single dead end, which is the trade a screen wants.","no":"Not that one. Holm and Bonferroni both control the family-wise error rate, the chance of even one mistake, which is what is costing you 93 real genes. You want the method that controls the expected PROPORTION of your shortlist that is wrong. In p.adjust it is spelled BH."}
::solution
```r
adj <- p.adjust(p_gene, method = "BH")

data.frame(shortlisted = sum(adj < 0.05),
           really_are  = sum(adj < 0.05 & real),
           are_noise   = sum(adj < 0.05 & !real))
#>   shortlisted really_are are_noise
#> 1          31         30         1
```

=== step === concept
::eyebrow Go deeper
## References

- [Holm (1979), A simple sequentially rejective multiple test procedure](https://www.jstor.org/stable/4615733) - the six-page paper that introduced the step-down procedure you used, including the proof that it controls family-wise error without assuming independence.
- [Benjamini and Hochberg (1995), Controlling the false discovery rate](https://rss.onlinelibrary.wiley.com/doi/10.1111/j.2517-6161.1995.tb02031.x) - where the false discovery rate was defined and the BH procedure derived. Worth reading for the argument about why family-wise error is the wrong target for a large screen.
- [Gelman and Loken, The garden of forking paths](https://www.stat.columbia.edu/~gelman/research/unpublished/forking.pdf) - the clearest statement of why a family can be larger than the set of tests actually run, and why that does not require anyone to behave dishonestly.
- [Simmons, Nelson and Simonsohn (2011), False-positive psychology](https://journals.sagepub.com/doi/10.1177/0956797611417632) - simulates how ordinary analytic flexibility pushes the false-positive rate above 60%, and proposes disclosure rules that would prevent it.
- [R documentation for p.adjust](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/p.adjust.html) - the reference for all eight methods, with the exact formula each one applies.

=== step === complete
## Lesson 1 complete

You can now say where a family-wise error rate comes from, count a family properly including the paths you did not take, and put a number on both sides of the ledger: what a correction protects you from, and what it costs.

Next, Lesson 2: subgroups. A trial reports no overall effect but a striking one in patients over 65, and the reviewer asks whether that subgroup was pre-specified. You will see why subgroup analyses are the highest-multiplicity thing most papers do, and why the usual defence makes it worse.
