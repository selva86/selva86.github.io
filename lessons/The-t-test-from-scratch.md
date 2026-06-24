---
title: "The t-test from scratch: how hypothesis testing works"
description: "Build the t-test from the ground up: why sample means wobble, the standard error, the t-statistic as signal over noise, p-values, effect size, and t.test() in R."
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
## Is the difference real, or just chance?

You measured something and saw a difference: a sample average that misses its target, or two groups whose means do not match. The hard question is never "is there a difference" (there almost always is). It is whether that difference is **big enough to be real**, or small enough that plain sampling luck could have produced it.

The t-test answers exactly that question, and a p-value is its verdict. By the end of this lesson you will be able to:

- Say, in plain words, what question a t-test answers, and compute the t-statistic
- Read a p-value correctly, and spot the misreading almost everyone makes
- Run a one-sample, two-sample and paired t-test in R and interpret every number
- Tell statistical significance apart from a real effect, and name the ways the test is misused

**Prerequisites:** you can run R and make a vector, and you know what a mean and a standard deviation are. Everything else is built here.

::widget null-distribution {"tails":2,"max":4,"start":2.4,"label":"observed t"}

=== step === concept
::eyebrow Why a difference is not enough
## Means wobble from sample to sample

Here is the catch that makes the whole problem interesting. Take a sample, compute its mean. Now take a *different* sample from the very same population and compute its mean again. You will get a slightly different number. And again. The sample mean is a moving target: it jitters around the true value every time you draw new data.

So an observed gap is never proof on its own. Even if two groups were truly identical, two samples from them would still show *some* difference, just from the luck of who landed in each sample. We write the true population mean as \(\mu\) (a fixed number we never see) and the mean of one sample as \(\bar{x}\) (which wobbles). The whole game of the t-test is to measure that wobble, then ask whether your observed gap is large compared with it.

[KEY INSIGHT]
A difference you can see is not yet evidence. The question is always: is this gap large *relative to how much the mean wobbles by chance*? That ratio, not the gap itself, is what a t-test computes.

::prose-only The raw scatter of repeated sample means has no catalog widget; the wobble is drawn rigorously as the null distribution two steps on (the null-distribution widget), so showing a separate dot-mound here would only preview that same picture.

=== step === concept
::eyebrow The ruler for noise
## Standard error: how much the mean wobbles

To compare a gap against the noise, we need to put a number on the noise. That number is the **standard error of the mean**. It is the typical distance between a sample mean and the true mean, and it has a wonderfully simple formula:

\[ SE = \frac{s}{\sqrt{n}} \]

Here \(s\) is the sample standard deviation (how spread out the individual data points are) and \(n\) is the sample size (how many points you collected). Two things fall straight out of it:

- More spread in the data (larger \(s\)) means a noisier mean.
- More data (larger \(n\)) means a tighter mean, but only through \(\sqrt{n}\): you fight noise with the *square root* of effort.

[KEY INSIGHT]
The standard error is the unit we measure differences in. A gap of "2" means nothing until you know whether the SE is 0.1 (a huge gap, twenty standard errors out) or 10 (a rounding error, a fifth of one standard error).

=== step === quiz
::eyebrow Check yourself
## What happens to the standard error?

A study quadruples its sample size, from \(n = 25\) up to \(n = 100\), drawing from the same population. What happens to the standard error of the mean?

::quiz {"correct":2,"gate":true,"difficulty":"beginner"}
- It drops to one quarter of its old value ::no Careful: the SE shrinks with \(\sqrt{n}\), not \(n\). Four times the data divides the SE by \(\sqrt{4} = 2\), not by 4.
- It is cut in half ::ok Right. \(SE = s/\sqrt{n}\). Multiplying \(n\) by 4 multiplies \(\sqrt{n}\) by 2, so the standard error is halved. You quadruple the data to halve the noise.
- It stays about the same

=== step === concept
::eyebrow Signal over noise
## The t-statistic

Now we can compare the signal to the noise in one number. For a single sample tested against a claimed value \(\mu_0\) (the value the **null hypothesis** says is true), the **t-statistic** is:

\[ t = \frac{\bar{x} - \mu_0}{s / \sqrt{n}} \]

Read it piece by piece. The numerator \(\bar{x} - \mu_0\) is the **signal**: how far your sample mean \(\bar{x}\) sits from the value \(\mu_0\) you are testing against. The denominator \(s/\sqrt{n}\) is the **noise**: the standard error from the last step. Dividing one by the other answers a single question: *how many standard errors away from the null value did my sample mean land?*

A \(t\) of 0 means the mean sat exactly on \(\mu_0\). A \(t\) of 0.1 is sitting right on top of the null, well inside the noise. A \(t\) of 3 means the mean landed three standard errors out, far enough to raise an eyebrow. As a concrete case, the average fuel economy in R's `mtcars` data is \(\bar{x} = 20.09\) mpg, with \(s = 6.03\) and \(n = 32\); tested against \(\mu_0 = 20\) that gives \(t = 0.085\), essentially no signal.

=== step === tryit
::eyebrow In R
## Compute a t by hand

Test whether the average fuel economy in `mtcars` differs from 20 mpg. The sample gives \(\bar{x} = 20.09\), \(s = 6.03\), \(n = 32\). Fill in the denominator (the standard error) to finish the t-statistic.

```r
xbar <- 20.09; mu0 <- 20
s <- 6.03; n <- 32
t_stat <- (xbar - mu0) / (s / ____)
t_stat
```
::check {"regex":"sqrt\\s*\\(\\s*n\\s*\\)","gate":true,"difficulty":"beginner","ok":"That returns t = 0.085. The mean sits less than a tenth of a standard error from 20: essentially no signal.","no":"The denominator is the standard error, s divided by sqrt(n). Fill in sqrt(n)."}
::solution
```r
xbar <- 20.09; mu0 <- 20
s <- 6.03; n <- 32
t_stat <- (xbar - mu0) / (s / sqrt(n))
t_stat
#> [1] 0.0851
```

=== step === widget
::eyebrow What is "big enough"?
## The null distribution

To judge a \(t\), you need to know what \(t\) values look like when nothing is going on. So imagine the null hypothesis is true: there is genuinely no difference, and \(\bar{x}\) misses \(\mu_0\) only because of sampling noise. Even then \(t\) will not be exactly 0 each time, it will scatter. Collect all those "no effect" \(t\) values and they trace out a known curve: **Student's t-distribution**, shown below. This is the yardstick your observed \(t\) is measured against.

It looks almost like the familiar normal bell, with one twist: its tails are slightly **heavier**. That is because we had to *estimate* the noise \(s\) from the same small sample, and that extra uncertainty makes large \(t\) values a touch more common. The shape is set by the **degrees of freedom**, \(df = n - 1\): the smaller the sample, the heavier the tails, and as \(n\) grows the t-distribution slides back into the normal.

::widget null-distribution {"tails":2,"max":4,"start":0,"label":"t under H0"}

[NOTE]
The curve drawn here is the large-sample (normal) reference. A real small-sample t-distribution sits a hair lower in the middle with heavier tails, so an exact p-value is slightly larger, but the logic on the next step, tail area equals p-value, is identical.

=== step === widget
::eyebrow The verdict number
## The p-value is a tail area

Mark your observed \(t\) on the null distribution. The **p-value** is the probability, *if the null were true*, of getting a \(t\) at least as extreme as the one you saw. Geometrically it is simply the **shaded area in the tails** beyond \(+t\) and \(-t\) (both sides, because a difference in either direction would count). Drag the slider and watch the area, and the p-value, change.

::widget null-distribution {"tails":2,"max":4,"start":2,"label":"observed t"}

A small shaded area means your \(t\) landed where the null curve rarely reaches: the data are surprising under "no effect," so you doubt the null. A large shaded area means your \(t\) is the kind of value the null produces all the time: nothing surprising, no case to answer.

=== step === quiz
::eyebrow Check yourself
## Read the p-value correctly

A two-sample t-test returns \(p = 0.03\). Which statement is the correct reading?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- There is a 3% chance the null hypothesis is true ::no That reverses the conditional. The p-value is the probability of data this extreme *given* H0, never the probability of H0 *given* the data. It says nothing about how probable the hypothesis itself is.
- If there were truly no difference, a result at least this extreme would occur about 3% of the time ::ok Exactly. The p-value is a tail probability computed assuming the null is true: a statement about the data given the hypothesis, never the hypothesis given the data.
- The result is 97% likely to replicate in a new study

=== step === concept
::eyebrow Drawing a line
## The decision rule

You compare the p-value to a threshold \(\alpha\) you pick *in advance* (0.05 is the common, if arbitrary, convention):

- If \(p < \alpha\), you **reject the null** and call the result statistically significant.
- If \(p \ge \alpha\), you **fail to reject** the null. You do not "accept" or "prove" it.

That last distinction is the one people drop. Failing to reject H0 means the data were not surprising enough to rule out "no effect," which is very different from showing there is no effect. Absence of evidence is not evidence of absence, often it just means your sample was too small to see the effect.

[WARNING]
The threshold \(\alpha\) is a decision rule, not a law of nature, and it must be chosen before you see the data. A result with \(p = 0.049\) is not meaningfully different from one with \(p = 0.051\); treating 0.05 as a magic cliff is how good questions turn into bad science.

=== step === widget
::eyebrow One direction or two?
## One-sided or two-sided?

Sometimes you only care about a difference in one direction (is the new drug *better*, not merely *different*). A **one-sided** test puts the whole rejection area in a single tail, as shown below, which makes a given \(t\) look more significant than the two-sided test does. That is legitimate only when you commit to the direction *before* collecting data.

::widget null-distribution {"tails":1,"max":4,"start":2,"label":"observed t"}

[WARNING]
Switching to a one-sided test after seeing which way the data went, just to slip under 0.05, is a classic form of p-hacking. Decide one-sided versus two-sided up front, and when in doubt use two-sided (the safe default).

=== step === widget
::eyebrow The recipe
## The whole test in four steps

Strip away the story and every t-test is the same four moves. Whatever the variant, this is the loop you are running.

::widget process-flow {"steps":[{"title":"State H0","sub":"assume no real effect: the true mean equals mu0"},{"title":"Signal over noise","sub":"compute t = (x-bar minus mu0) over the standard error"},{"title":"Tail area","sub":"the p-value: how often t this extreme arises under H0"},{"title":"Decide","sub":"p below alpha rejects H0, otherwise fail to reject"}]}

You computed the t-statistic by hand earlier; now let R run all four steps at once.

=== step === concept
::eyebrow Run it
## The one-sample t-test in R

You never compute this by hand in practice. R's `t.test()` does every step at once: the t-statistic, the degrees of freedom, the p-value, and a confidence interval. Here is the `mtcars` mileage question, asked properly.

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

Every number maps to something you now understand:

- `t = 0.0851` is exactly the signal-over-noise ratio you computed by hand.
- `df = 31` is \(n - 1 = 32 - 1\), the shape of the null curve.
- `p-value = 0.9328` is the tail area: a \(t\) this small is utterly ordinary under the null, so there is no evidence the mean differs from 20.
- The `95 percent confidence interval` [17.92, 22.26] is the flip side of the test: every \(\mu_0\) inside it is a value we could not reject. It contains 20, which is exactly why we fail to reject 20.

=== step === tryit
::eyebrow Your turn
## Run a one-sample test

Test whether the average `mpg` in `mtcars` differs from 20 by filling in the value to test against.

```r
t.test(mtcars$mpg, mu = ____)
```
::check {"regex":"mu\\s*=\\s*20\\b","gate":true,"difficulty":"beginner","ok":"p = 0.93. With the sample mean at 20.09, there is no evidence the true mean differs from 20.","no":"Set mu to the value you are testing against here, that is mu = 20."}
::solution
```r
t.test(mtcars$mpg, mu = 20)
```

=== step === concept
::eyebrow Two groups
## The two-sample test, and why pairing matters

Far more often you compare **two** group means, not one mean against a fixed number. The logic does not change: it is still signal over noise. The signal is now the gap between the two sample means, and the noise is the standard error *of that gap*:

\[ t = \frac{\bar{x}_1 - \bar{x}_2}{SE_{\text{diff}}}, \qquad SE_{\text{diff}} = \sqrt{\frac{s_1^2}{n_1} + \frac{s_2^2}{n_2}} \]

Each group contributes its own wobble, so the noise of the difference combines both. In R you write `outcome ~ group`, and by default R runs the **Welch** version, which does not assume the two groups share the same variance: a safe, sensible default.

```r
# the sleep data: extra hours of sleep on two drugs
t.test(extra ~ group, data = sleep)
#>  Welch Two Sample t-test
#> t = -1.8608, df = 17.776, p-value = 0.07939
#> mean in group 1 mean in group 2
#>            0.75            2.33
```

Group 2 averaged 1.58 more hours, but with \(p = 0.08\) that gap is not quite distinguishable from noise. Here is the twist: these were the **same 10 patients** measured on both drugs, so the columns are not independent groups, they are paired. Telling R that lets each patient act as their own control, cancelling the large differences between people.

```r
t.test(extra ~ group, data = sleep, paired = TRUE)
#>  Paired t-test
#> t = -4.0621, df = 9, p-value = 0.002833
```

Same data, same means, but \(p\) drops from 0.08 to 0.003. The effect was real all along; the unpaired test just could not see it through the between-patient noise. Choosing the right variant is not a formality, it changes the answer.

=== step === quiz
::eyebrow Check yourself
## Which test?

You measure the same 20 patients' blood pressure before a drug and after it, and want to know whether the average changed. Which test fits?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- An independent two-sample t-test ::no These are not independent groups: the same patient appears before and after. An independent test discards the pairing and the within-patient differences that make a real change easiest to see.
- A paired t-test ::ok Right. Each patient is their own control. The paired test works on the within-patient before-minus-after differences, removing the variation between people.
- A one-sample t-test on all 40 readings at once

=== step === concept
::eyebrow Significant is not the same as big
## Effect size and power

A p-value tells you whether an effect is *detectable*, never whether it is *large*. Those are different questions, and conflating them is the most consequential mistake in applied statistics. The size of an effect gets its own number, the standardized **effect size** (Cohen's d), the difference measured in standard deviations:

\[ d = \frac{\bar{x} - \mu_0}{s} \]

Now watch what happens to a genuinely tiny effect, \(d = 0.2\), as the sample grows. Because \(t = d\sqrt{n}\), more data inflates the very same effect into a smaller and smaller p-value:

| sample size \(n\) | \(t = d\sqrt{n}\) | p-value (two-sided, approx) |
|---|---|---|
| 25 | 1.0 | 0.32 (not significant) |
| 100 | 2.0 | 0.05 (borderline) |
| 400 | 4.0 | 0.0001 (highly significant) |

The effect never changed. Only \(n\) grew. A big enough study makes a trivial difference "significant," and a small study can miss a real, important one (that second failure is low **power**: power is the probability a test detects an effect that is truly there, and it rises with sample size and effect size).

[WARNING]
Always report the effect size and a confidence interval next to the p-value. "Significant" with a huge \(n\) can mean a difference too small to care about; "not significant" with a tiny \(n\) can hide a large effect you simply lacked the power to detect.

=== step === quiz
::eyebrow Check yourself
## Does a tiny p mean a big effect?

A study with 50,000 people per group finds the two group means differ by 0.1 points, with \(p < 0.0001\). What can you conclude?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The effect is large and important ::no Not from the p-value. With \(n = 50{,}000\) even a trivial 0.1-point gap clears every threshold. A small p means "distinguishable from zero," not "big." Read the effect size and the confidence interval before deciding it matters.
- The difference is very unlikely to be pure chance, but it may still be too small to matter ::ok Right. A small p means the effect is detectable, not large. Significance and importance are separate questions, so always read the effect size beside the p-value.
- The result must be a mistake because the difference is so small

=== step === concept
::eyebrow Handle with care
## How the t-test is misused

The math is honest; the trouble is almost always in how the test is used. The three failures to guard against:

- **p-hacking.** Trying many analyses (one-sided vs two-sided, dropping outliers, slicing subgroups) and reporting only the one that crossed 0.05. Defense: decide the analysis before seeing the data, and report everything you tried.
- **Multiple comparisons.** Run 20 independent tests at \(\alpha = 0.05\) and, even if nothing is real, about one will "turn up significant" by chance alone. Defense: correct for the number of tests (for example Bonferroni: divide \(\alpha\) by the number of comparisons).
- **Assuming normality.** The t-test assumes the observations are independent and roughly normal (or that \(n\) is large enough that the mean is, by the Central Limit Theorem). For heavily skewed data with small \(n\), switch to a nonparametric test such as the Wilcoxon test rather than trusting the p-value.

[WARNING]
A p-value is only as trustworthy as the process that produced it. The same 0.04 means very different things from a single pre-registered test and from the best of fifty quietly-discarded ones.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further, each worth the click:

- [Student (1908), The Probable Error of a Mean, Biometrika](https://doi.org/10.2307/2331554) - the original paper that introduced the t-distribution, written using this very sleep data.
- [OpenIntro Statistics (free textbook)](https://www.openintro.org/book/os/) - a clear, rigorous treatment of inference, the t-distribution and effect size.
- [R reference: t.test()](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/t.test.html) - the official documentation for every argument of the function you just used.
- [Seeing Theory: Frequentist Inference (Brown University)](https://seeing-theory.brown.edu/frequentist-inference/index.html) - a beautiful interactive view of sampling, the null distribution and p-values.
- [t-Tests in R (r-statistics.co)](https://r-statistics.co/t-Tests-in-R.html) - the companion reference tutorial with more worked cases and code.

=== step === complete
## You built the t-test

You did not just learn to call a function, you built the idea from the ground up: a mean wobbles, the standard error measures that wobble, the t-statistic is signal over noise, the null distribution says what noise alone produces, and the p-value is the tail area that turns it all into a verdict. Then you ran the one-sample, two-sample and paired versions in R, read every line, and learned to keep significance and effect size apart.

From here the same logic generalizes. Comparing three or more group means at once leads to **ANOVA**; when the normality assumption breaks for good, the **nonparametric** tests (Wilcoxon, Kruskal-Wallis) carry the same signal-over-noise spirit without the normal curve. You now have the foundation every one of them is built on.
