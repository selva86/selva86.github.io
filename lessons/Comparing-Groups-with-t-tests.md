---
title: "The t-test: comparing groups, and reading it honestly"
catalog_blurb: "Decide whether two groups truly differ, or just look like they do."
description: "The two-sample and paired t-test through one story - comparing two dal-packing machines - plus why a tiny p-value is not a big effect, statistical power, and the ways the t-test gets misused."
keywords: "two-sample t-test, paired t-test, Welch t-test, effect size, Cohen's d, statistical power, p-hacking, multiple comparisons, t.test in R"
mathjax: true
webr: true
curriculum_id: "4.2.2"
post_type: "LESSON"
course_id: "t-test"
course_title: "The t-test, from scratch"
course_lesson: "2"
course_total: "2"
course_landing: "T-Test-Course.html"
course_next: ""
course_prev: "The-t-test-from-scratch.html"
lesson_access: "free"
---

=== step === cover
::eyebrow Lesson 2 of 2 - comparing groups
## Comparing groups with t-tests
In Lesson 1, Meena tested **one** machine against a fixed target of 1000 g, and you built the whole four-step loop: assume nothing is wrong, compute signal over noise, find the tail area, decide. Here is that loop again - your map for everything below.

::widget process-flow {"steps":[{"title":"Assume nothing is wrong","sub":"the null: the two groups really have the same average"},{"title":"Signal over noise","sub":"compute t = the gap between the averages, divided by its standard error"},{"title":"Find the tail area","sub":"the p-value: how often chance alone gives a gap this big"},{"title":"Decide","sub":"p below alpha rejects the null; otherwise fail to reject"}]}

But Meena's next question is different. Her old machine is wearing out, and a salesman is offering a new one. She does not have a fixed target to test against any more - she wants to compare **two machines against each other**: do they fill to *different* average weights? That is the **two-sample t-test**, and it carries a twist that can flip the verdict. By the end you will be able to:

- Run a two-sample and a paired t-test in R, and know which one a situation needs
- Tell a *statistically significant* result apart from a *large, important* one
- Name the three ways the t-test is most often misused, and how to guard against each

**Prerequisites:** Lesson 1 (the one-sample t-test: the standard error, the t-statistic, the null distribution, and the p-value).

=== step === concept
::eyebrow Comparing two wobbling averages
## The two-sample test, and why pairing can flip it

The logic does not change one bit - it is still signal over noise. The only difference is that the signal is now the **gap between two averages**, and the noise is the standard error *of that gap*, which has to combine the wobble of *both* groups:

\[ t = \frac{\bar{x}_1 - \bar{x}_2}{SE_{\text{diff}}}, \qquad SE_{\text{diff}} = \sqrt{\frac{s_1^2}{n_1} + \frac{s_2^2}{n_2}} \]

Read the noise term slowly. Each machine has its own wobble - \(s_1/\sqrt{n_1}\) for the new one, \(s_2/\sqrt{n_2}\) for the old, where \(s_1, s_2\) are the two groups' standard deviations and \(n_1, n_2\) their sizes. Why *add* the two squared wobbles under the root? Because either average can drift on its own, so the gap between them is shakier than either average alone - the noise of the difference has to carry both machines' wobble at once. After that it is the same move as Lesson 1: the signal (the gap) over the noise (that combined wobble).

To run it on real data, R ships with `sleep` - results from a genuine 1908 experiment where **10 patients each tried two different sleep medicines**, and someone recorded `extra`, the extra hours of sleep each patient got on each drug. You write `outcome ~ group`, and by default R runs the **Welch** version, which does not assume the two groups are equally spread - a safe default.

```r
# extra hours of sleep, drug 1 vs drug 2
t.test(extra ~ group, data = sleep)
#>  Welch Two Sample t-test
#> t = -1.8608, df = 17.776, p-value = 0.07939
#> mean in group 1   mean in group 2
#>            0.75              2.33
```

Drug 2 gave 1.58 more hours on average, but with \(p = 0.08\) that gap is not quite distinguishable from noise. Now the twist: these were the **same 10 patients** measured on both drugs - so the two columns are not independent groups, they are *paired*, patient by patient. (It is like measuring the **same** patients before and after a treatment - or Meena comparing her machine's output before a service and again after it - so each subject is matched against itself, and the big differences between one subject and the next cancel out.) Telling R to pair them lets each patient cancel out their own personal sleep habits:

```r
t.test(extra ~ group, data = sleep, paired = TRUE)
#>  Paired t-test
#> t = -4.0621, df = 9, p-value = 0.002833
```

Same data, same averages - but \(p\) drops from 0.08 to 0.003. The effect was real all along; the unpaired test just could not see it through the large differences between one patient and the next. Choosing the right variant is not a formality - it changed the answer.

=== step === tryit
::eyebrow Your turn
## Tell R the data is paired

The two columns are the same 10 patients measured twice, so the test should be **paired**. Fill in the argument that tells R so.

```r
t.test(extra ~ group, data = sleep, ____ = TRUE)
```
::check {"regex":"paired\\s*=\\s*TRUE","gate":true,"difficulty":"beginner","ok":"Pairing drops p from 0.08 to 0.003 - each patient becomes their own control, and the real effect shows through.","no":"The argument is paired = TRUE: fill in paired."}
::solution
```r
t.test(extra ~ group, data = sleep, paired = TRUE)
```

=== step === quiz
::eyebrow Check yourself
## Which test fits?

You measure the same 20 patients' blood pressure **before** a new drug and **after** it, and want to know whether the average changed. Which test fits?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- An independent two-sample t-test ::no These are not independent groups: the same patient appears before and after. An independent test throws away the pairing - the within-patient before-minus-after change that makes a real shift easiest to see.
- A paired t-test ::ok Right. Each patient is their own comparison. The paired test works on each patient's before-minus-after difference, removing the big variation between different people.
- A one-sample t-test on all 40 readings at once

=== step === widget
::eyebrow One direction, or both?
## One-sided or two-sided?

Back to Meena for a moment. With her single machine she only ever worried about *under*filling - light packets upset customers. If she truly does not care about overfilling, she could run a **one-sided** test, which puts the whole rejection area in a single tail (shown below). That makes a given \(t\) look more significant, because all the "surprise" is on one side. But it is only honest if she commits to that one direction *before* she weighs anything.

::widget null-distribution {"tails":1,"max":4,"start":2,"label":"observed t (one-sided)"}

[WARNING]
Switching to a one-sided test *after* seeing which way the data fell, just to slip under 0.05, is a classic form of p-hacking. Decide one-sided versus two-sided up front, and when in doubt use two-sided - the safe default R gives you unless you ask otherwise.

=== step === quiz
::eyebrow Check yourself
## Is that switch allowed?

You ran a two-sided test, got \(p = 0.06\), and then noticed the effect points the way you were hoping. Switching to a one-sided test would report \(p = 0.03\). Is that legitimate?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Yes, one-sided tests are more powerful, so it is the better choice ::no The extra power is real, but you only earn it by fixing the direction BEFORE seeing the data. Choosing it afterwards means picking the rule that happens to flatter the result you already got.
- No, deciding the direction after seeing the data is p-hacking ::ok Right. A one-sided test is honest only when the direction is committed in advance. Switching to it once you have seen which way the data fell is exactly the move that manufactures significance.
- It depends on whether the new p-value ends up below 0.05

=== step === concept
::eyebrow "Significant" is not the same as "big"
## Effect size and power

Here is the mistake that does the most damage in real work: a p-value tells you whether an effect is **detectable**, never whether it is **large**. Those are different questions. Meena's machine being 22 g off a 1000 g target is a 2% error - whether that *matters* to her business is a judgement, not something the p-value answers.

The *size* of an effect gets its own number: the **effect size**, often Cohen's \(d\), which measures the gap in standard-deviation units, so it does not grow just because you collected more data:

\[ d = \frac{\bar{x} - \mu_0}{s} \]

For Meena that is \(d = (978 - 1000)/30 \approx -0.73\): her machine is off by about three-quarters of a standard deviation. By the usual rule of thumb (0.2 is a small effect, 0.5 medium, 0.8 large), that is a **large** effect - so her 2% shortfall is not just real, it is sizeable, and worth the service call. A p-value alone would never have told her that.

Now watch the opposite case - what a big sample does to a genuinely tiny effect, \(d = 0.2\). Because \(t = d\sqrt{n}\), simply collecting more data shrinks the p-value of the *same* small effect:

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

- [OpenIntro Statistics (free textbook)](https://www.openintro.org/book/os/) - inference, the two-sample and paired tests, and effect size, clearly and rigorously.
- [Sullivan & Feinn (2012), Using Effect Size, J. Graduate Medical Education](https://doi.org/10.4300/JGME-D-12-00156.1) - a short, readable case for reporting effect size alongside the p-value.
- [R reference: t.test()](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/t.test.html) - every argument of the function, including `paired` and `alternative`.
- [t-Tests in R (r-statistics.co)](https://r-statistics.co/t-Tests-in-R.html) - the companion reference tutorial with more worked cases and code.

=== step === complete
## You can run, choose, and read a t-test

Across the two lessons you built the t-test from the ground up - from Meena's single packing machine to comparing two of them. A mean wobbles; the standard error measures the wobble; the t-statistic is signal over noise; the null distribution says what chance alone produces; the p-value is the tail area that turns it into a verdict. Then you ran the one-sample, two-sample and paired versions in R, learned to pick the right one, and learned to keep "significant" and "big" apart.

From here the same logic generalizes. Comparing three or more group averages at once leads to **ANOVA**; when the bell-shape assumption breaks for good, the **nonparametric** tests (Wilcoxon, Kruskal-Wallis) carry the same signal-over-noise spirit without the bell curve. Every one of them is built on what you just learned.
