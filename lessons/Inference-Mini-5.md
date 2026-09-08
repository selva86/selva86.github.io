---
title: "Hypothesis testing: the framework, explained"
slug: "Inference-Mini-5"
description: "Learn hypothesis testing as one framework: state H0 and H1, compute a test statistic, read a p-value under the null, and tell Type I from Type II error."
keywords: "hypothesis testing, null hypothesis, alternative hypothesis, p-value, test statistic, significance level, Type I error, Type II error, t-test in R"
mathjax: true
webr: true
date: "2026-09-09"
post_type: "LESSON"
course_id: "inference-from-zero"
course_title: "Inference from Zero"
course_lesson: "5"
course_total: "7"
course_landing: "/dashboard.html"
course_prev: "Inference-Mini-4"
course_next: ""
curriculum_id: "0.0.12"
lesson_access: "windowed"
catalog_blurb: "How to test whether a gap in your data is real or just noise."
---

=== step === cover
## Hypothesis testing: the framework, explained

Today, let's understand hypothesis testing as one complete framework, the same five decisions repeated underneath every statistical test you run in R.

Take R's built in `mtcars` dataset, 32 cars road tested for a 1974 Motor Trend article. Split them by engine size: 11 four-cylinder cars and 7 six-cylinder cars. The four-cylinder cars average 26.66 miles per gallon. The six-cylinder cars average 19.74. That's a 6.92 mpg gap.

Is that gap a real difference between the two engine types, or could it just be the ordinary wobble you'd expect from looking at 18 particular cars rather than every car ever built? Hypothesis testing is the procedure that turns a question like that into a yes or no answer, with a known chance of getting it wrong.

The chart below plots mpg for both groups as a boxplot, so you can see the gap for yourself before any test runs.

::widget chart-plotter {"data": [{"x": "4-cyl", "y": 22.8}, {"x": "4-cyl", "y": 24.4}, {"x": "4-cyl", "y": 22.8}, {"x": "4-cyl", "y": 32.4}, {"x": "4-cyl", "y": 30.4}, {"x": "4-cyl", "y": 33.9}, {"x": "4-cyl", "y": 21.5}, {"x": "4-cyl", "y": 27.3}, {"x": "4-cyl", "y": 26.0}, {"x": "4-cyl", "y": 30.4}, {"x": "4-cyl", "y": 21.4}, {"x": "6-cyl", "y": 21.0}, {"x": "6-cyl", "y": 21.0}, {"x": "6-cyl", "y": 21.4}, {"x": "6-cyl", "y": 18.1}, {"x": "6-cyl", "y": 19.2}, {"x": "6-cyl", "y": 17.8}, {"x": "6-cyl", "y": 19.7}], "geoms": ["boxplot"], "x": "cylinders", "y": "mpg"}

Look at how little the two boxes overlap. A test statistic and a p-value are about to put an exact number on how surprising a gap that size really is.

=== step === concept
## The null hypothesis: the claim that needs evidence to overturn

Before computing anything, hypothesis testing asks you to write down two competing claims, and to write them down before you look at how the test turns out.

The first is the **null hypothesis**, written H0. It is the boring, default claim: nothing is going on. For our two groups, H0 says the four-cylinder and six-cylinder cars share one mean mpg in the population these 18 cars came from: mu(4-cyl) = mu(6-cyl).

The second is the **alternative hypothesis**, written H1. It is the claim the data would have to convince you of instead: mu(4-cyl) does not equal mu(6-cyl), the two engine types genuinely differ in mean mpg.

::prose-only the courtroom analogy is verbal here; the next step supplies the numeric visual for the null distribution

Why does H0 get to be the default? Picture a courtroom. Nobody has to argue that the defendant is innocent, that's simply where the trial starts. The prosecution is the one with work to do, building a case out of evidence solid enough to flip that starting assumption to guilty.

H0 works the same way. It stands by default, and only the data can overturn it. That is why H0 needs no justification to start with, while H1 does, it is what the data has to show.

=== step === concept
## Compressing a gap into one number: the test statistic

You now have two claims and one gap to judge between them, 6.92 mpg. But a raw gap in mpg can't be compared straight against a cutoff, because it doesn't say whether 6.92 is a lot or a little, relative to how much numbers like this naturally wobble from sample to sample.

A **test statistic** fixes that. It rescales the gap into standard-error units, so a value of 2 means "this gap is twice the size of the typical noise for a sample this size," no matter what units the raw data are in. For two independent groups:

$$t = \frac{\bar{x}_1 - \bar{x}_2}{SE}$$

Here \(\bar{x}_1\) and \(\bar{x}_2\) are the two group means, and SE is the standard error of that difference, how much the gap between two sample means would typically wobble if you drew the samples again.

Let's compute it by hand for our two mpg groups, then confirm it against R's own `t.test()`.

```r
# Compute the Welch t-statistic by hand from the two mpg groups
cars_4_6 <- subset(mtcars, cyl %in% c(4, 6))
mpg_4 <- cars_4_6$mpg[cars_4_6$cyl == 4]
mpg_6 <- cars_4_6$mpg[cars_4_6$cyl == 6]

se_gap <- sqrt(sd(mpg_4)^2 / length(mpg_4) + sd(mpg_6)^2 / length(mpg_6))
t_manual <- (mean(mpg_4) - mean(mpg_6)) / se_gap
t_manual
#> [1] 4.719059

# Confirm the manual t against R's own two-sample t-test
t_obj <- t.test(mpg ~ cyl, data = cars_4_6)
t_obj
#> 
#> 	Welch Two Sample t-test
#> 
#> data:  mpg by cyl
#> t = 4.7191, df = 12.956, p-value = 0.0004048
#> alternative hypothesis: true difference in means between group 4 and group 6 is not equal to 0
#> 95 percent confidence interval:
#>   3.751376 10.090182
#> sample estimates:
#> mean in group 4 mean in group 6 
#>        26.66364        19.74286 
```

The two numbers agree to six decimal places: 4.719059. Our 6.92 mpg gap is worth about 4.72 standard errors, once you account for how much these two group means would naturally wobble from sample to sample.

R's `t.test()` also reports 12.956 degrees of freedom, a Welch-specific adjustment used because it doesn't assume the two groups spread out equally. That number, and the p-value beside it, say exactly how surprising this gap would be if H0 were true.

=== step === widget
## How surprising is that number, if there really is no difference?

H0 says the two groups share one mean mpg. If that's true, the test statistic you compute from 18 particular cars won't always land on exactly 4.72. It follows a known curve, the **null distribution**, the spread of t values that sampling noise alone would produce if H0 held.

The **p-value** is the area under that curve at least as far from zero as your own statistic, added from both tails since the gap could have gone either direction. It answers one exact question: if H0 were true, how often would sampling noise alone produce a statistic this extreme or more?

The chart below draws that null curve and shades the tail beyond wherever the slider is set.

::widget null-distribution {"tails": 2, "max": 5, "start": 4.72, "label": "t statistic"}

Push the slider out toward 4.72, close to where our own statistic sits, and the shaded sliver nearly disappears. Pull it back toward zero and the sliver swells into a much bigger share of the curve, because an ordinary, unremarkable gap should be common under H0, not rare.

R already gave us this exact area for our real t, on the same 12.956 degrees of freedom that `t.test()` reported: p = 0.0004048. If four-cylinder and six-cylinder cars truly shared one mean mpg, a gap this large or larger would appear in only about 4 of every 10,000 samples of 18 cars like ours.

[KEY INSIGHT]
A p-value is computed entirely inside the H0 world. It never measures the probability that H0 is true, only how ordinary your data would look if H0 were.

=== step === quiz
## Quick check: reading a p-value correctly

Our test came back p = 0.0004048. Which sentence reads that number correctly?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- There is only a 0.04% chance that H0, equal mean mpg, is actually true. ::no
- The gap itself, 6.92 mpg, is what 0.0004048 measures. ::no A p-value is not the size of the effect and it is not the probability that H0 is true. It is the chance, computed inside the H0 world, of seeing a gap this large or larger by sampling noise alone. The gap's size is 6.92 mpg; how ordinary that size would be under H0 is 0.0004048.
- If H0 were true, a gap this large or larger would show up in roughly 4 of every 10,000 comparisons like this one. ::ok Exactly. It assumes the boring claim first, then reports how ordinary our data would look inside that assumption.

=== step === concept
## The decision rule: alpha and the reject/fail-to-reject choice

A p-value alone doesn't make a decision. You need one more thing: a cutoff, fixed before you look at the data, that says how rare is rare enough. That cutoff is the **significance level**, written alpha (α), and the common default is 0.05.

The decision rule is short: reject H0 if the p-value is below alpha, otherwise fail to reject it. In the courtroom analogy, alpha is the strength of evidence the jury requires before it convicts, set in advance, not adjusted once the trial is under way.

For our two engine groups, p = 0.0004048 and alpha = 0.05. Since 0.0004048 is well below 0.05, the decision is to reject H0.

Let's turn that comparison into a plain sentence in R, straight from the t-test object.

```r
# Turn the p-value into a plain-English decision at alpha = 0.05
alpha <- 0.05
if (t_obj$p.value < alpha) {
  "Reject H0: the mean mpg gap between 4-cylinder and 6-cylinder cars is unlikely to be due to chance alone."
} else {
  "Fail to reject H0: no evidence the mean mpg differs."
}
#> [1] "Reject H0: the mean mpg gap between 4-cylinder and 6-cylinder cars is unlikely to be due to chance alone."
```

That matches what you worked out by hand above. Notice the wording: "reject H0," not "H1 is proven." A hypothesis test never proves anything. It only says the p-value fell below, or didn't fall below, the cutoff you set in advance.

=== step === widget
## How often a true null gets rejected by chance alone

Here's an uncomfortable fact about that alpha = 0.05 cutoff: even when H0 is completely true, this exact decision rule will still reject it sometimes, purely by chance. Let's see how often.

Simulate 1,000 t-tests where H0 truly holds, both samples really do come from a population with mean 0, and count how many still get rejected at alpha = 0.05.

```r
# Simulate 1000 t-tests where H0 truly holds and count false rejections
set.seed(42)
type1_rejects <- replicate(1000, {
  sample_data <- rnorm(30, mean = 0, sd = 1)
  t.test(sample_data, mu = 0)$p.value < 0.05
})

mean(type1_rejects)
#> [1] 0.056
```

Out of 1,000 tests run on data where nothing was actually different, 56 of them still came back with p below 0.05, a false rejection. That's 5.6%, close to the 5% you fixed as alpha. This isn't a flaw in the test. It's exactly what alpha means: the long-run rate at which a correct decision rule, applied to a true H0, still rejects it by chance.

The widget below runs a related pure-chance game: a guesser with no skill at all, calling 10 coin flips, counting how often pure luck alone reaches 9 or more correct out of 10.

::widget luck-simulator {}

Press "Run 1,000" a couple of times and watch the win rate settle in. With a coin that's right half the time, reaching 9 or more out of 10 by pure luck happens only about 1% of the long run, rare, but not impossible. That's the same shape of fact as alpha: even when nothing special is going on, an unusually extreme result still turns up its own small, knowable share of the time. Alpha is that share, fixed by you in advance, for the test you're actually running.

=== step === concept
## The two ways a decision can be wrong: Type I and Type II error

Rejecting H0 by chance, like the 56 false alarms from those 1,000 simulated tests, has a name: a **Type I error**, rejecting a true H0. Its long-run rate is exactly alpha, by construction, which is why it landed near 5.6% and not some other number.

There's a second, opposite way to be wrong. A **Type II error** is failing to reject H0 when H1 is actually true, missing a real effect. Its rate is called **beta** (β).

In the courtroom analogy, a Type I error convicts an innocent defendant. A Type II error lets a guilty one go free. No single alpha makes both mistakes disappear at once.

Let's measure beta directly. Simulate 1,000 t-tests where H1 is actually true this time, the real population mean is 0.5, not 0, and count how many still fail to reject H0.

```r
# Simulate 1000 t-tests where H0 is false (true mean 0.5) and count rejections
set.seed(42)
power_rejects <- replicate(1000, {
  sample_data <- rnorm(30, mean = 0.5, sd = 1)
  t.test(sample_data, mu = 0)$p.value < 0.05
})

mean(power_rejects)
#> [1] 0.738

# Type II error rate: the share that still failed to reject a false H0
1 - mean(power_rejects)
#> [1] 0.262
```

738 of the 1,000 tests correctly rejected H0 here, catching a real effect. That fraction, 73.8%, is called the test's **power**, the chance of catching a real effect when one exists. The other 262 tests, 26.2%, missed it. Those are the Type II errors: beta = 0.262, for this particular effect size and sample size of 30.

[NOTE]
Push alpha down to catch fewer false alarms, and beta goes up, because the cutoff for rejecting H0 sits further out, even for a real effect. Push alpha up, and beta comes down, but more true nulls get rejected by accident. Picking alpha is a real decision about which mistake costs more, not a formality.

=== step === concept
## The five-step structure behind every hypothesis test in R

Every test, whether it's a t-test, a proportion test, or a chi-square test, follows the same five steps in the same order.

The diagram below lays out that sequence.

::widget process-flow {"steps": [{"title": "State H0 and H1", "sub": "write the default claim and its challenger before looking at outcomes"}, {"title": "Collect the data", "sub": "gather the sample the test will run on"}, {"title": "Compute a test statistic", "sub": "express the gap in standard-error units"}, {"title": "Compute a p-value", "sub": "read the tail area under the null distribution"}, {"title": "Compare p to alpha and decide", "sub": "reject H0 if p is below alpha, otherwise fail to reject"}]}

State H0 and H1 before looking at outcomes. Collect the data. Compute a test statistic that expresses the gap in standard-error units. Compute a p-value from that statistic's position on the null distribution. Compare the p-value to alpha and decide.

That's why every test object R returns, from `t.test()` to `prop.test()` to `chisq.test()` to `wilcox.test()`, carries the same two fields, `$statistic` and `$p.value`. Only the formula for the statistic and the shape of its null distribution change from test to test. The five-step structure around it stays exactly the same.

=== step === quiz
## Quick check: which error is this?

A t-test rejects H0. But unknown to the analyst running it, the two population means really are equal. What kind of mistake is this?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- A Type II error, since a false H0 was wrongly kept. ::no
- Not an error. The test behaved exactly as it should. ::no Even a correctly applied decision rule can still reject a true H0. The rule guarantees a false-positive rate of alpha, not zero false positives. Here H0 was true and got rejected anyway, that is a Type I error by definition, not a sign anything went wrong with the test.
- A Type I error, since a true H0 was wrongly rejected. ::ok Right. H0 was actually true here, and the test rejected it anyway, exactly the mistake alpha measures the rate of.

=== step === tryit
## Your turn: run the framework on a new comparison

`mtcars` also records transmission type, `am`, 0 for automatic and 1 for manual. Run the same five-step framework on a new question: does mean mpg differ between automatic and manual cars?

```r
# Your turn: run the framework on automatic vs manual transmissions
# H0: ____________________
# H1: ____________________
# Write two lines: run the t-test, then compare its p-value to alpha = 0.05
```
::check {"regex": "t[.]test[(]mpg\\s*~\\s*am[\\s\\S]*0[.]05", "gate": true, "difficulty": "intermediate", "ok": "p is well under 0.05, so H0 is rejected: automatic and manual cars have different mean mpg in this data. That is a decision at your chosen alpha, not proof of exactly how big the true gap is.", "no": "Two lines: t.test(mpg ~ am, data = mtcars) to get the test object, then compare its $p.value to 0.05."}
::solution
```r
# H0: mean mpg is the same for automatic and manual transmissions
# H1: mean mpg differs between automatic and manual transmissions
my_am_test <- t.test(mpg ~ am, data = mtcars)
my_am_test$p.value
#> [1] 0.001373638

my_am_test$p.value < 0.05
#> [1] TRUE
```

=== step === concept
## References

- [stats::t.test, R documentation](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/t.test.html)
- Casella, G. & Berger, R. L. (2002). *Statistical Inference* (2nd ed.), Duxbury. Chapter 8, hypothesis testing.
- [NIST/SEMATECH e-Handbook of Statistical Methods, 7.1, "What are the basic types of hypothesis tests?"](https://www.itl.nist.gov/div898/handbook/)
- [stats::prop.test and stats::chisq.test, R documentation](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/prop.test.html)

=== step === complete
## The 6.9 mpg gap, answered with a decision rule

You started with an 11-car group and a 7-car group, a 6.92 mpg gap between them, and one open question: is that gap real, or just noise? You now have the full answer. The test statistic was 4.72. The p-value, the chance of seeing a gap this large under H0, was 0.0004048. Against alpha = 0.05, that rejects H0: four-cylinder and six-cylinder cars differ in mean mpg in this data.

More than that, you now have the five-step structure behind every hypothesis test you'll run in R: state the hypotheses, collect the data, compute a statistic, compute a p-value, compare it to alpha. Whatever test function you reach for next, that same sequence is what it's doing underneath.
