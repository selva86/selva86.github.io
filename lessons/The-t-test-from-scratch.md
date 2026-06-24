---
title: "The t-test from scratch: how hypothesis testing works"
description: "Learn the t-test through one real story: a dal-packing machine that may be underfilling. Sample means wobble, the standard error, the t-statistic as signal over noise, p-values, effect size, and t.test() in R."
keywords: "t-test, t test in R, t.test, hypothesis testing, p-value, t-statistic, standard error, null hypothesis, effect size, statistical power, Welch t-test, paired t-test"
mathjax: true
webr: true
curriculum_id: "4.2.1"
post_type: "LESSON"
course_id: "t-test"
course_title: "The t-test, from scratch"
course_lesson: "1"
course_total: "1"
course_landing: "T-Test-Course.html"
course_next: ""
course_prev: ""
lesson_access: "free"
---

=== step === cover
::eyebrow The t-test, from scratch
## Is the machine really underfilling, or is it just chance?

Meet Meena. She runs a small business that packs dal (lentils) into 1 kg packets, and her machine is set to drop **1000 grams** into each one. Lately a few customers have grumbled that the packets feel light. So Meena does the sensible thing: she pulls **20 packets** off the line and weighs them on a kitchen scale. Their average comes to **978 grams** - 22 grams short of the target.

Now here is her real problem. She did not weigh all ten thousand packets she makes in a week; she weighed only 20. So which is it?

- The machine is genuinely underfilling, and 978 g is the truth, **or**
- The machine is fine at 1000 g on average, and Meena just happened to scoop up 20 slightly-light packets by luck.

That single question - *is a difference big enough to be real, or small enough that plain sampling luck could have produced it?* - is what a **t-test** answers, and a **p-value** is its verdict. By the end of this lesson you will be able to:

- Say in plain words what question a t-test answers, and compute the t-statistic for Meena's packets
- Read a p-value correctly, and spot the misreading almost everyone makes
- Run a one-sample, two-sample and paired t-test in R and interpret every number
- Tell statistical significance apart from a real-world effect, and name the ways the test is misused

**Prerequisites:** you can run R and make a vector, and you know what a mean (the average) and a standard deviation (how spread out the numbers are) are. Everything else we build here, slowly.

::widget null-distribution {"tails":2,"max":4,"start":3.3,"label":"how far off the packets landed"}

=== step === concept
::eyebrow Why "22 grams short" is not yet proof
## The average wobbles every time you weigh a new batch

Here is the catch that makes Meena's whole problem interesting. Suppose she puts those 20 packets back and grabs a *fresh* 20 from the same line. Will the new average be exactly 978 g again? Almost certainly not. Maybe 985 g this time. Grab another 20: maybe 974 g. The average of a handful of packets is a **moving target** - it jumps around a little every time, purely because a different handful of packets landed on the scale.

So a gap you can see (978 vs 1000) is never proof on its own. Even if the machine were *perfectly* set to 1000 g, any 20 packets would still come out a little above or below 1000, just from the luck of which packets you grabbed. We have two different things to keep straight:

- the **true average fill** of the machine - a fixed number Meena can never see exactly without weighing every packet. Statisticians call it \(\mu\) (the Greek letter "mu").
- the **average of one batch she weighed** - which wobbles from batch to batch. We write it \(\bar{x}\) ("x-bar"). For Meena's batch, \(\bar{x} = 978\).

The whole game of the t-test is to measure *how much* \(\bar{x}\) wobbles by chance, and then ask: is Meena's 22-gram gap big compared with that wobble, or is it the kind of gap the wobble produces all the time?

[KEY INSIGHT]
A difference you can see is not yet evidence. The real question is always: is this gap large *compared with how much the average jumps around by chance*? That ratio - the gap measured against the wobble - is what a t-test computes, not the gap by itself.

::prose-only The raw scatter of repeated batch averages has no catalog widget; that wobble is drawn rigorously two steps on as the null distribution (the null-distribution widget), so a separate dot-cloud here would only preview the same picture.

=== step === concept
::eyebrow Putting a number on the wobble
## Standard error: how much the batch average jumps around

To compare Meena's gap against the wobble, we first need to measure the wobble itself. That measurement has a name - the **standard error of the mean** - and a beautifully simple formula. The standard error is the typical distance between a single batch's average and the machine's true average:

\[ SE = \frac{s}{\sqrt{n}} \]

Two plain-English ingredients:

- \(s\) is the **sample standard deviation**: how much the individual packets differ from one another. If every packet is nearly identical, \(s\) is small; if some are 940 g and some are 1020 g, \(s\) is large. Say Meena's 20 packets have \(s = 30\) grams.
- \(n\) is the **sample size**: how many packets she weighed. Here \(n = 20\).

So Meena's wobble is \(SE = 30 / \sqrt{20} \approx 6.7\) grams. In words: if the machine's true fill never changed, the average of 20 packets would still drift up and down by about 7 grams from one batch to the next, just by chance. Two things fall straight out of the formula:

- More spread between packets (bigger \(s\)) means a noisier, less trustworthy average.
- More packets weighed (bigger \(n\)) means a steadier average - but only through \(\sqrt{n}\). You fight the wobble with the **square root** of effort, not the effort itself.

[KEY INSIGHT]
The standard error is the *ruler* we measure the gap in. A 22-gram gap means nothing until you know the wobble: if \(SE\) is 7 grams, 22 grams is a big gap (three rulers out); if \(SE\) were 50 grams, the same 22 would be well within the normal jiggle.

=== step === quiz
::eyebrow Check yourself
## What happens if Meena weighs more packets?

Meena decides to weigh **80** packets next time instead of 20 - four times as many, from the same machine. What happens to the standard error (the wobble of her average)?

::quiz {"correct":2,"gate":true,"difficulty":"beginner"}
- It drops to one quarter of its old value ::no Careful: the wobble shrinks with \(\sqrt{n}\), not \(n\). Four times the packets divides the standard error by \(\sqrt{4} = 2\), not by 4.
- It is cut in half ::ok Right. \(SE = s/\sqrt{n}\). Multiplying \(n\) by 4 multiplies \(\sqrt{n}\) by 2, so the wobble is halved. Meena weighs four times as many packets to make her average only twice as steady - that is the square-root law.
- It stays about the same

=== step === concept
::eyebrow Signal divided by noise
## The t-statistic: the gap measured in wobbles

Now we can put Meena's question into a single number. We compare the **signal** (her 22-gram gap) against the **noise** (her 7-gram wobble). For one batch tested against a claimed value \(\mu_0\) - the value we are checking, here the machine's setting \(\mu_0 = 1000\) - the **t-statistic** is:

\[ t = \frac{\bar{x} - \mu_0}{s / \sqrt{n}} \]

Read it slowly, piece by piece:

- The top, \(\bar{x} - \mu_0\), is the **signal**: how far the batch average sits from the value we are testing. For Meena: \(978 - 1000 = -22\) grams.
- The bottom, \(s/\sqrt{n}\), is the **noise**: the standard error from the last step, \(6.7\) grams.

Divide one by the other and you get a single number that answers one question: *how many wobbles away from 1000 did Meena's average land?* For her packets, \(t = -22 / 6.7 \approx -3.3\). The minus sign just means she landed *below* 1000; the size, 3.3, is what matters - her average is about three-and-a-third standard errors below the target.

Is 3.3 a lot? A \(t\) near 0 means the average sat right on the target, comfortably inside the normal wobble - nothing to see. A \(t\) of 3.3 means the average landed far out, in territory the wobble rarely reaches. That is starting to look like a real problem, not luck. The next steps make "rarely" exact.

=== step === tryit
::eyebrow Your turn
## Compute Meena's t by hand

Meena's 20 packets average \(\bar{x} = 978\) g, with a standard deviation of \(s = 30\) g, tested against the target \(\mu_0 = 1000\) g. The signal (978 - 1000) is already filled in. Complete the **noise** - the standard error, \(s\) divided by the square root of \(n\) - to finish her t.

```r
xbar <- 978; mu0 <- 1000
s <- 30; n <- 20
t_stat <- (xbar - mu0) / (s / ____)
t_stat
```
::check {"regex":"sqrt\\s*\\(\\s*n\\s*\\)","gate":true,"difficulty":"beginner","ok":"That gives t = -3.28. Meena's average landed about 3.3 standard errors below 1000 - a long way out.","no":"The noise is the standard error: s divided by the square root of n. Fill in sqrt(n)."}
::solution
```r
xbar <- 978; mu0 <- 1000
s <- 30; n <- 20
t_stat <- (xbar - mu0) / (s / sqrt(n))
t_stat
#> [1] -3.28
```

=== step === widget
::eyebrow What does "rarely" look like?
## The null distribution: what chance alone produces

To decide whether \(t = -3.3\) is surprising, we need to know what \(t\) values look like **when nothing is wrong**. So let us pretend, just for a moment, that Meena is worried over nothing: the machine really does fill to 1000 g on average, and her 978 came purely from the luck of the draw. Statisticians call this pretend-everything-is-fine assumption the **null hypothesis**.

If the null hypothesis were true and Meena repeated her 20-packet weigh-in again and again, her \(t\) would not be 0 every time - it would scatter around 0. Collect all those "machine is fine" \(t\) values and they trace out a known, fixed curve: **Student's t-distribution**, drawn below. This curve is the yardstick we hold Meena's \(t\) against.

::widget null-distribution {"tails":2,"max":4,"start":0,"label":"t when the machine is truly fine"}

It looks almost like the familiar bell curve, with one twist: its tails are a little **heavier** (fatter at the edges). That is because Meena had to *estimate* the wobble \(s\) from the same 20 packets, and that extra uncertainty makes big \(t\) values slightly more common. The exact shape is set by the **degrees of freedom**, \(df = n - 1 = 19\) for Meena: the fewer packets, the heavier the tails; with lots of packets the curve settles into the ordinary bell.

[NOTE]
The curve drawn here is the large-sample (normal) version, which is easiest to read. A true 20-packet t-distribution sits a touch lower in the middle with slightly heavier tails, so the exact p-value is a hair larger - but the idea on the next step, that the tail area *is* the p-value, is exactly the same.

=== step === widget
::eyebrow The verdict number
## The p-value is the area in the tails

Now mark Meena's \(t\) on that "machine is fine" curve and ask: how often would pure luck push the average this far from 1000? That probability is the **p-value** - the chance, *if the machine were truly fine*, of getting a \(t\) at least as extreme as the one Meena saw. On the picture it is simply the **shaded area out in the tails**, beyond \(+t\) and \(-t\) (both sides, because a machine that *overfilled* by the same amount would be just as surprising). Drag the slider and watch the shaded area, and the p-value, change.

::widget null-distribution {"tails":2,"max":4,"start":3.3,"label":"how far off the packets landed"}

Slide out to Meena's \(t \approx 3.3\) and the shaded area is tiny: a "fine" machine almost never produces a 20-packet average that far from 1000. So either something very unlucky happened, or the machine is not actually fine. A *small* tail area means the data are surprising under "machine is fine," and Meena starts to doubt it. A *large* tail area would mean her result is the kind of thing chance throws up all the time - no case to answer.

=== step === quiz
::eyebrow Check yourself
## Read the p-value correctly

Meena's test returns \(p = 0.004\). Which statement is the correct reading?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- There is a 0.4% chance the machine is actually fine ::no That flips the logic around. The p-value is the chance of data this extreme *assuming* the machine is fine - never the chance that "the machine is fine" is true given the data. It does not tell you how likely the hypothesis itself is.
- If the machine were truly fine, a 20-packet average this far off would happen only about 0.4% of the time ::ok Exactly. The p-value is computed by *assuming* the machine is fine and asking how often chance alone would be this extreme. It is a statement about the data given the assumption, never about the assumption given the data.
- The result is 99.6% likely to repeat if Meena weighs another batch

=== step === concept
::eyebrow Drawing the line
## The decision rule, and the trap in it

To turn the p-value into a yes/no, Meena compares it to a threshold called \(\alpha\) ("alpha"), chosen *before* she looks at the data (0.05 is the common, if arbitrary, convention):

- If \(p < \alpha\), she **rejects the null** ("machine is fine") and calls the result statistically significant. Meena's \(p = 0.004\) is well under 0.05, so she concludes the machine really is underfilling and gets it serviced.
- If \(p \ge \alpha\), she **fails to reject** the null. Notice the careful wording: she does *not* "accept" or "prove" the machine is fine.

That last distinction is the one almost everyone drops. Failing to reject only means the data were not surprising enough to rule out "machine is fine" - which is very different from showing the machine *is* fine. Maybe it is off by a tiny amount that 20 packets simply could not detect. Absence of evidence is not evidence of absence.

[WARNING]
The threshold \(\alpha\) is a decision Meena makes, not a law of nature, and she must pick it *before* seeing the data. A result with \(p = 0.049\) is not meaningfully different from \(p = 0.051\); treating 0.05 as a magic cliff is how good questions turn into bad statistics.

=== step === widget
::eyebrow One direction, or both?
## One-sided or two-sided?

Meena only ever worried about *under*filling - light packets that upset customers. If she truly does not care about overfilling, she could run a **one-sided** test, which puts the whole rejection area in a single tail (shown below). That makes a given \(t\) look more significant, because all the "surprise" is concentrated on one side. But it is only honest if she commits to that single direction *before* she weighs anything.

::widget null-distribution {"tails":1,"max":4,"start":2,"label":"observed t (one-sided)"}

[WARNING]
Switching to a one-sided test *after* seeing which way the data fell, just to slip under 0.05, is a classic form of p-hacking. Decide one-sided versus two-sided up front, and when in doubt use two-sided - the safe default, which is what R gives you unless you ask otherwise.

=== step === widget
::eyebrow The whole test on one card
## Every t-test is the same four moves

Strip away Meena and the dal, and every t-test - one group, two groups, paired - runs the same four-step loop. Once you see it once, you see it everywhere.

::widget process-flow {"steps":[{"title":"Assume nothing is wrong","sub":"the null: the true mean really equals mu0 (the machine fills to 1000)"},{"title":"Signal over noise","sub":"compute t = (x-bar minus mu0) divided by the standard error"},{"title":"Find the tail area","sub":"the p-value: how often chance alone gives a t this extreme"},{"title":"Decide","sub":"p below alpha rejects the null; otherwise fail to reject"}]}

You already did step 2 by hand for Meena. Now let R do all four at once.

=== step === concept
::eyebrow Run it for real
## The one-sample t-test in R

In practice you never grind through this by hand - R's `t.test()` does every step in one line: the t-statistic, the degrees of freedom, the p-value, and a confidence interval. To run it on data you have right now, we will switch from Meena's dal to a dataset that ships inside R, `mtcars` - the specs of 32 classic car models. Its `mpg` column is each car's fuel economy. Let us ask the same *shape* of question Meena asked: is the average fuel economy different from 20 mpg?

```r
t.test(mtcars$mpg, mu = 20)
#>
#>  One Sample t-test
#>
#> data:  mtcars$mpg
#> t = 0.0851, df = 31, p-value = 0.9328
#> alternative hypothesis: true mean is not equal to 20
#> 95 percent confidence interval:
#>  17.92 22.26
#> sample estimates:
#> mean of x
#>  20.0906
```

Every number is something you now understand:

- `t = 0.0851` is the signal-over-noise ratio - here the average (20.09) sits almost exactly on 20, so the signal is tiny.
- `df = 31` is \(n - 1 = 32 - 1\), the shape of the "nothing is wrong" curve.
- `p-value = 0.9328` is the tail area: a \(t\) this small is utterly ordinary under the null, so there is **no evidence** the average differs from 20. (Contrast Meena, whose \(t = -3.3\) gave a tiny p - a real effect. This is the other verdict: fail to reject.)
- The `95 percent confidence interval` [17.92, 22.26] is the flip side of the test: every target value inside it is one we could not reject. It contains 20, which is exactly why we fail to reject 20.

=== step === tryit
::eyebrow Your turn
## Run a one-sample test in R

Test whether the average `mpg` in `mtcars` differs from 20 by filling in the value to test against (the `mu` argument is the \(\mu_0\) from our formula).

```r
t.test(mtcars$mpg, mu = ____)
```
::check {"regex":"mu\\s*=\\s*20\\b","gate":true,"difficulty":"beginner","ok":"p = 0.93. With the average at 20.09, there is no evidence the true mean differs from 20.","no":"Set mu to the value you are testing against - here, mu = 20."}
::solution
```r
t.test(mtcars$mpg, mu = 20)
```

=== step === concept
::eyebrow Comparing two groups
## The two-sample test, and why pairing matters

Far more often you compare **two** group averages rather than one average against a fixed target - imagine Meena comparing her old machine against a new one she is thinking of buying. The logic does not change one bit: it is still signal over noise. The signal is now the gap between the two averages, and the noise is the standard error *of that gap*, which combines the wobble of both groups:

\[ t = \frac{\bar{x}_1 - \bar{x}_2}{SE_{\text{diff}}}, \qquad SE_{\text{diff}} = \sqrt{\frac{s_1^2}{n_1} + \frac{s_2^2}{n_2}} \]

To run it on real data, R ships with `sleep` - results from a genuine 1908 experiment where **10 patients each tried two different sleep medicines**, and someone recorded `extra`, the extra hours of sleep each patient got on each drug. In R you write `outcome ~ group`, and by default R runs the **Welch** version, which does not assume the two groups are equally spread - a safe, sensible default.

```r
# extra hours of sleep, drug 1 vs drug 2
t.test(extra ~ group, data = sleep)
#>  Welch Two Sample t-test
#> t = -1.8608, df = 17.776, p-value = 0.07939
#> mean in group 1   mean in group 2
#>            0.75              2.33
```

Drug 2 gave 1.58 more hours of sleep on average, but with \(p = 0.08\) that gap is not quite distinguishable from noise. Now the twist: these were the **same 10 patients** measured on both drugs, so the two columns are not independent groups - they are *paired*, patient by patient. Telling R that lets each patient act as their own comparison, cancelling the big differences between people:

```r
t.test(extra ~ group, data = sleep, paired = TRUE)
#>  Paired t-test
#> t = -4.0621, df = 9, p-value = 0.002833
```

Same data, same averages - but \(p\) drops from 0.08 to 0.003. The effect was real all along; the unpaired test just could not see it through the large differences between one patient and the next. Choosing the right variant is not a formality - it changed the answer.

=== step === quiz
::eyebrow Check yourself
## Which test fits?

You measure the same 20 patients' blood pressure **before** a new drug and **after** it, and you want to know whether the average changed. Which test fits?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- An independent two-sample t-test ::no These are not independent groups: the same patient appears before and after. An independent test throws away the pairing - the within-patient before-minus-after change that makes a real shift easiest to see.
- A paired t-test ::ok Right. Each patient is their own comparison. The paired test works on each patient's before-minus-after difference, removing the big variation between different people.
- A one-sample t-test on all 40 readings at once

=== step === concept
::eyebrow "Significant" is not the same as "big"
## Effect size and power

Here is the mistake that does the most damage in real work: a p-value tells you whether an effect is **detectable**, never whether it is **large**. Those are completely different questions. Meena's machine being 22 g off a 1000 g target is a 2% error - whether that *matters* is a business judgement, not something the p-value answers.

The *size* of an effect gets its own number: the **effect size**, often Cohen's \(d\), which measures the gap in standard-deviation units (so it does not depend on sample size):

\[ d = \frac{\bar{x} - \mu_0}{s} \]

Now watch what a big sample does to a genuinely tiny effect, \(d = 0.2\). Because \(t = d\sqrt{n}\), simply collecting more data shrinks the p-value of the very same small effect:

| sample size \(n\) | \(t = d\sqrt{n}\) | p-value (two-sided, approx) |
|---|---|---|
| 25 | 1.0 | 0.32 (not significant) |
| 100 | 2.0 | 0.05 (borderline) |
| 400 | 4.0 | 0.0001 (highly significant) |

The effect never changed - only \(n\) grew. A big enough study makes a trivial difference "significant," and a too-small study can miss a real, important one. That second failure is low **power**: power is the probability a test detects an effect that is genuinely there, and it rises with both sample size and effect size.

[WARNING]
Always report the effect size and a confidence interval next to the p-value. "Significant" with a huge \(n\) can be a difference too small to care about; "not significant" with a tiny \(n\) can hide a real effect you simply lacked the power to see.

=== step === quiz
::eyebrow Check yourself
## Does a tiny p mean a big effect?

A study with 50,000 people per group finds the two group averages differ by 0.1 points, with \(p < 0.0001\). What can you conclude?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The effect is large and important ::no Not from the p-value. With 50,000 per group, even a trivial 0.1-point gap clears every threshold. A small p means "distinguishable from zero," not "big." Read the effect size and the confidence interval before deciding it matters.
- The difference is very unlikely to be pure chance, but it may still be far too small to matter ::ok Right. A small p means the effect is detectable, not large. Significance and importance are separate questions, so always read the effect size beside the p-value.
- The result must be a mistake because the difference is so small

=== step === concept
::eyebrow Handle with care
## How the t-test gets misused

The maths is honest; the trouble is almost always in how people *use* the test. Three failures to guard against:

- **p-hacking.** Trying many analyses (one-sided vs two-sided, dropping a few "odd" packets, slicing into subgroups) and reporting only the one that crossed 0.05. Defence: decide the analysis before seeing the data, and report everything you tried.
- **Multiple comparisons.** Run 20 separate tests at \(\alpha = 0.05\) and, even if nothing real is going on, about one will "turn up significant" by chance alone. Defence: correct for the number of tests (for example Bonferroni: divide \(\alpha\) by the number of comparisons).
- **Assuming a bell shape.** The t-test assumes the measurements are independent and roughly bell-shaped (or that \(n\) is large enough that the *average* is, by the Central Limit Theorem). For heavily lopsided data with a small \(n\), switch to a nonparametric test such as the Wilcoxon test instead of trusting the p-value.

[WARNING]
A p-value is only as trustworthy as the process that produced it. The same 0.04 means very different things coming from a single pre-planned test versus the best of fifty quietly-discarded ones.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further, each worth the click:

- [Student (1908), The Probable Error of a Mean, Biometrika](https://doi.org/10.2307/2331554) - the original paper that introduced the t-distribution, using the very `sleep` data you just saw.
- [OpenIntro Statistics (free textbook)](https://www.openintro.org/book/os/) - a clear, rigorous treatment of inference, the t-distribution and effect size.
- [R reference: t.test()](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/t.test.html) - the official documentation for every argument of the function you used.
- [Seeing Theory: Frequentist Inference (Brown University)](https://seeing-theory.brown.edu/frequentist-inference/index.html) - a beautiful interactive view of sampling, the null distribution and p-values.
- [t-Tests in R (r-statistics.co)](https://r-statistics.co/t-Tests-in-R.html) - the companion reference tutorial with more worked cases and code.

=== step === complete
## You built the t-test, from Meena's packets up

You did not just learn to call a function - you built the whole idea from one real question. A batch average wobbles from batch to batch; the standard error measures that wobble; the t-statistic is the gap measured in wobbles (signal over noise); the null distribution shows what chance alone produces; and the p-value is the tail area that turns it all into a verdict. Then you ran the one-sample, two-sample and paired versions in R, read every line, and learned to keep "significant" and "big" apart.

From here the same logic generalizes. Comparing three or more group averages at once leads to **ANOVA**; when the bell-shape assumption breaks for good, the **nonparametric** tests (Wilcoxon, Kruskal-Wallis) carry the same signal-over-noise spirit without the bell curve. Every one of them is built on what you just learned.
