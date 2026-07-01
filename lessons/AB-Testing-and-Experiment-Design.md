---
title: "Causal Inference Lesson 3: A/B Testing and Experiment Design"
catalog_blurb: "Design a fair online test and size it to detect a real effect."
description: "Design an A/B test that earns a clean causal answer: randomize, state the hypotheses, understand power, and compute the sample size you actually need in R."
keywords: "A/B testing, experiment design, randomized controlled experiment, statistical power, sample size, power.prop.test, significance level, type I error, type II error, peeking, minimum detectable effect, causal inference in R"
post_type: "LESSON"
curriculum_id: "6.10.3"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-causal"
course_title: "Causal Inference in R"
course_lesson: "3"
course_total: "5"
course_landing: "R-Causal-Inference-Course.html"
course_next: "Reading-an-Experiment.html"
course_prev: "Causal-Diagrams-with-DAGs.html"
---

=== step === cover
::eyebrow Lesson 3 of 5
## A/B Testing and Experiment Design

In Lesson 2 you learned to draw a causal diagram and adjust for confounders because you could not randomize. This lesson is about the happier case: when you *can* run the experiment. Randomizing is the single move that erases every backdoor at once, collapsing a tangled DAG back to the one clean arrow you care about.

Riverside Books wants to add a "Readers also bought" panel to each book page, hoping it nudges more visitors to buy. Instead of guessing, they will run an A/B test: show the old page to a random half of visitors and the new panel to the other half, then compare buy rates. But a real experiment raises hard, practical questions. How large a difference counts as real, and not just a lucky week? How many visitors do we need before we can trust the answer? The picture below is the tool that settles the first question, and by the end you will size the experiment to earn a trustworthy one.

By the end of this lesson you will be able to:

- Explain why randomly assigning visitors lets a plain comparison of two groups estimate a true causal effect
- State the hypotheses of an A/B test and read a p-value and significance level correctly, without the usual traps
- Define statistical power, and compute the sample size an experiment actually needs in R
- Spot the design mistakes (peeking, chasing many metrics, broken randomization) that quietly break a test

**Prerequisites:** you finished [Lesson 1](Correlation-Causation-and-Potential-Outcomes.html) (randomization removes selection bias) and [Lesson 2](Causal-Diagrams-with-DAGs.html) (backdoor paths), and you can run R and compute a proportion. Every new term is defined as it appears.

::widget null-distribution {"tails":2,"max":5,"start":2,"label":"observed z"}

=== step === concept
::eyebrow The idea
## An A/B test is just a randomized experiment

An **A/B test** is a randomized controlled experiment wearing a product hat. You take one change you are unsure about, split your users into two groups by chance, expose each group to one version, and compare an outcome. Group **A** is the **control**: Riverside's current book page. Group **B** is the **treatment**: the same page plus the "Readers also bought" panel. Everything else is held identical.

The outcome Riverside will measure is the **conversion rate**: the fraction of visitors who buy at least one book. Write \(p_A\) for the true conversion rate a visitor would have under the old page and \(p_B\) for the rate under the new panel. The quantity the whole experiment exists to estimate is the **lift**,

\[ \Delta = p_B - p_A, \]

the extra share of visitors who buy *because of* the panel. We never see \(p_A\) or \(p_B\) directly; we estimate them from counts. If \(x_A\) of \(n_A\) control visitors buy, the observed rate is \(\hat p_A = x_A / n_A\), and likewise \(\hat p_B = x_B / n_B\) for the treatment. The hat means "estimated from the sample."

Why go to the trouble of a coin flip? Because of exactly the lesson from before. If Riverside instead showed the panel to whoever happened to visit on Tuesdays, or to logged-in members only, the two groups would differ in ways beyond the panel, and the gap in buy rates would blend the panel's effect with those differences: selection bias, all over again. Randomizing severs the link between *which version you see* and *everything else about you*, so the two groups are comparable and the difference in their rates is the panel's doing. Here is the whole procedure.

::widget process-flow {"steps":[{"title":"Pick one metric and the effect worth it","sub":"the conversion rate, and the smallest lift that would change the decision"},{"title":"Size the experiment","sub":"compute how many visitors each group needs for enough power"},{"title":"Randomize each visitor","sub":"assign A (old page) or B (new panel) by a coin flip"},{"title":"Run to the planned size","sub":"collect the full sample before you judge the result"},{"title":"Test and decide","sub":"compare the two rates and ship only if the lift is real"}]}

=== step === quiz
::eyebrow Check yourself
## What makes it a fair test?

Riverside's engineer proposes three ways to judge the new panel. Only one of them is a valid A/B test. Which?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Ship the panel to everyone, then compare this week's total sales with last week's ::no That is a before/after comparison, not a randomized one. Last week and this week differ in weather, promotions, paydays and more, so any change confounds the panel with the calendar. This is exactly the non-randomized trap from Lesson 1.
- Randomly assign each visitor to the old page or the new panel, then compare the two groups' buy rates ::ok Right. A coin flip per visitor makes the two groups comparable in every other respect, so the difference in their conversion rates estimates the panel's causal effect and nothing else.
- Compare visitors who clicked the panel against visitors who did not ::no Clicking is a choice, not a coin flip. The visitors who click are the keener shoppers, who would buy more even without a panel, so this compares self-selected groups. It measures who-clicks, not what-the-panel-does.

=== step === concept
::eyebrow The decision rule
## The hypotheses, and your false-positive budget

Randomizing makes the comparison fair. But even a panel that does nothing will rarely produce two *exactly* equal buy rates, because each group is a random draw. So before trusting a gap, you ask: could a difference this big happen by luck alone, if the panel truly had no effect? That is a hypothesis test, and it has two named claims.

- The **null hypothesis** \(H_0: p_A = p_B\): the panel makes no difference, and any observed gap is chance.
- The **alternative** \(H_1: p_A \ne p_B\): the panel changes the buy rate, in some direction.

You start out giving the null the benefit of the doubt, and you ask how surprising your data would be if it were true. The evidence is summarized by a **test statistic**. For two proportions it is the z-statistic,

\[ z = \frac{\hat p_B - \hat p_A}{\sqrt{\hat p\,(1-\hat p)\left(\dfrac{1}{n_A} + \dfrac{1}{n_B}\right)}}, \qquad \hat p = \frac{x_A + x_B}{n_A + n_B}, \]

where \(\hat p_A, \hat p_B\) are the two observed rates, \(n_A, n_B\) the two group sizes, and \(\hat p\) is the **pooled rate**: the buy rate you get by ignoring the split and lumping both groups together, which is your best guess of the common rate *if* \(H_0\) were true. The numerator is the gap you saw; the denominator is how much gap random noise alone would typically produce. So \(z\) is a signal-to-noise ratio: how many "noise units" your observed lift sits above zero.

If \(H_0\) is true, \(z\) follows a standard normal distribution, the curve on the cover. The **p-value** is the tail area past your observed \(z\): the probability of a gap at least this extreme when the panel does nothing. Drag the marker in that widget and watch the shaded tail shrink as \(z\) moves out. Before you run anything, you fix a threshold called the **significance level** \(\alpha\), usually \(0.05\). You will "reject \(H_0\)" and call the result significant only when \(p < \alpha\).

[KEY INSIGHT]
\(\alpha\) is a budget you set in advance, not a discovery. It is the share of experiments in which you will wrongly cry "effect!" when there is none. At \(\alpha = 0.05\), if the panel truly did nothing and you ran the test 100 times, about 5 of those runs would cross the line by pure chance. That is the price of admission for being able to detect real effects at all.

=== step === quiz
::eyebrow Check yourself
## Read the p-value

Riverside runs the test and gets \(p = 0.03\). Three teammates each interpret it. Which statement is the correct reading of that p-value?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- There is a 3% chance the panel has no real effect ::no The p-value is not the probability that the null is true. It assumes the null and asks about the data, not the reverse. It cannot tell you the probability of a hypothesis.
- The panel has a 97% chance of being effective ::no Same trap from the other side. A p-value says nothing about the probability the effect is real; that would require prior beliefs and Bayes' rule, not the p-value alone.
- If the panel truly did nothing, a difference at least this large would arise about 3% of the time by chance ::ok Exactly. A p-value is a statement about the data under the null: "how surprising is what I saw, in a world where the panel has no effect?" Small p means the data are hard to explain by luck alone.

=== step === concept
::eyebrow The other way to be wrong
## Power: the chance of catching a real effect

Rejecting a true null is one mistake, called a **Type I error**, and its rate is exactly the \(\alpha\) you chose. But there is a second, sneakier mistake: the panel really *does* help, yet your experiment fails to notice, so you keep the worse page. That is a **Type II error**, and its rate is written \(\beta\). The two errors live in a simple table.

| | Panel truly does nothing (H0 true) | Panel truly helps (H1 true) |
|---|---|---|
| **Test says "significant"** | Type I error (rate \(\alpha\)) | Correct detection (rate \(1-\beta\)) |
| **Test says "not significant"** | Correct (rate \(1-\alpha\)) | Type II error (rate \(\beta\)) |

The top-right cell, correct detection, is the one you want to maximize. **Statistical power** is \(1 - \beta\): the probability that, *if* the panel truly lifts the rate by some amount, your test will detect it and report significance. A convention is to aim for power of at least \(0.80\), an 80% chance of catching a real effect.

Power is not a fixed property of the test; it depends on four things pulling against each other: the size of the true effect (bigger lifts are easier to catch), the significance level \(\alpha\), the natural variability of the metric, and the sample size \(n\). Small \(n\) means low power, which means real effects slip through. Do not take that on faith, measure it. The code below simulates Riverside's experiment thousands of times, assuming the panel truly lifts conversion from 4% to 5%, and counts how often a test with only 2000 visitors per group actually notices.

```r
# Riverside's test: does a "Readers also bought" panel lift the buy rate?
# Suppose the truth is a lift from 4% to 5%. How often would a small test catch it?
set.seed(1)
sim_power <- function(n, pA, pB, reps = 1000, alpha = 0.05) {
  hits <- replicate(reps, {
    a <- rbinom(1, n, pA)                 # buyers among n control visitors
    b <- rbinom(1, n, pB)                 # buyers among n treatment visitors
    prop.test(c(a, b), c(n, n))$p.value < alpha
  })
  mean(hits)                              # fraction of experiments that detect the lift
}
sim_power(n = 2000, pA = 0.04, pB = 0.05)
#> [1] 0.321
```

With 2000 visitors per group, a real 1-point lift is caught only about **32%** of the time. Two out of three runs would call a genuinely better page "not significant" and throw it away. The experiment is **underpowered**, and no amount of careful analysis fixes too little data. The cure is to work out the right \(n\) before you start.

[WARNING]
This is why a non-significant result from a small test is not proof of "no effect." Failing to reject the null is not the same as accepting it: with low power, even a real lift routinely produces a large p-value. Absence of evidence is not evidence of absence.

=== step === concept
::eyebrow The number that matters most
## How many visitors do you actually need?

To size an experiment you first commit to the smallest lift worth detecting, the **minimum detectable effect** (MDE). Riverside decides that anything below a 1-point rise (from a 4% baseline to 5%) is too small to bother rolling out, so 1 point is the effect they want 80% power to catch. Now the four quantities are locked together: fix \(\alpha\), the power, and the MDE, and the required sample size \(n\) is determined. Approximately,

\[ n \approx \frac{\left(z_{1-\alpha/2} + z_{1-\beta}\right)^2\,\big[p_A(1-p_A) + p_B(1-p_B)\big]}{(p_B - p_A)^2}, \]

where \(z_{1-\alpha/2}\) is the cutoff leaving \(\alpha/2\) in each tail (1.96 at \(\alpha = 0.05\)) and \(z_{1-\beta}\) is the cutoff for the power you want (0.84 for 80%). You do not compute this by hand; R's `power.prop.test` solves for whichever quantity you leave out. Give it the two rates, the power, and \(\alpha\), and leave `n` blank.

```r
# How many visitors PER GROUP to detect 0.04 -> 0.05 with 80% power at alpha = 0.05?
power.prop.test(p1 = 0.04, p2 = 0.05, power = 0.80, sig.level = 0.05)
#>
#>      Two-sample comparison of proportions power calculation
#>
#>               n = 6744.933
#>              p1 = 0.04
#>              p2 = 0.05
#>       sig.level = 0.05
#>           power = 0.8
#>     alternative = two.sided
#>
#> NOTE: n is number in *each* group
```

So Riverside needs about **6745 visitors per group**, roughly 13,500 in total. Notice the denominator \((p_B - p_A)^2\): halving the lift you insist on catching roughly *quadruples* the sample you need. Smaller effects hide in the noise and take far more data to see.

```r
# The required n per group explodes as the lift we insist on detecting shrinks:
mde <- c(0.010, 0.007, 0.005)                          # absolute lift over the 4% baseline
n_per_group <- sapply(mde, function(d)
  ceiling(power.prop.test(p1 = 0.04, p2 = 0.04 + d, power = 0.80, sig.level = 0.05)$n))
data.frame(lift_pp = mde * 100, target = 0.04 + mde, n_per_group)
#>   lift_pp target n_per_group
#> 1     1.0  0.050        6745
#> 2     0.7  0.047       13329
#> 3     0.5  0.045       25551
```

=== step === tryit
::eyebrow Your turn
## Size a more ambitious test

Riverside's data scientist argues that even a half-point lift, from 4% to **4.5%**, would be worth shipping. Size that experiment: keep 80% power and \(\alpha = 0.05\), and fill in the target rate `p2`. (The table above already hints at the answer.)

```r
power.prop.test(p1 = 0.04, p2 = ____, power = 0.80, sig.level = 0.05)
```
::check {"regex":"0?\\.045","gate":true,"difficulty":"intermediate","ok":"Right: detecting a 0.5-point lift needs about 25,551 visitors per group, nearly four times the 6745 for a 1-point lift. Halving the MDE roughly quadruples the sample, because n scales as one over the squared effect.","no":"Set the treatment rate to the 4.5% target: p2 = 0.045. That is the smallest lift the data scientist wants to be able to catch."}
::solution
```r
power.prop.test(p1 = 0.04, p2 = 0.045, power = 0.80, sig.level = 0.05)
#>
#>      Two-sample comparison of proportions power calculation
#>
#>               n = 25550.85
#>              p1 = 0.04
#>              p2 = 0.045
#>       sig.level = 0.05
#>           power = 0.8
#>     alternative = two.sided
#>
#> NOTE: n is number in *each* group
```

=== step === concept
::eyebrow The payoff
## Run the test and decide

Riverside picks the 1-point MDE, rounds up to a clean 6800 visitors per group, and runs the experiment to completion before looking. When the data are in, the test is a single line. We build the collected counts inline here (in reality they come from your logs); the panel truly helped a little, so the control converts near 4% and the treatment a touch higher.

```r
# The experiment ran to its planned size. Here is what came back.
set.seed(42)
n <- 6800
control   <- rbinom(1, n, 0.04)          # buyers among 6800 control visitors
treatment <- rbinom(1, n, 0.052)         # the panel lifted the rate a bit
c(control_buys = control, treat_buys = treatment)
#> control_buys   treat_buys
#>          260          368
prop.test(c(control, treatment), c(n, n))
#>
#> 	2-sample test for equality of proportions with continuity correction
#>
#> data:  c(control, treatment) out of c(n, n)
#> X-squared = 19.113, df = 1, p-value = 1.232e-05
#> alternative hypothesis: two.sided
#> 95 percent confidence interval:
#>  -0.023078645 -0.008686061
#> sample estimates:
#>     prop 1     prop 2
#> 0.03823529 0.05411765
```

The control converted at **3.82%** and the treatment at **5.41%**, and the p-value is about \(1.2 \times 10^{-5}\), far below 0.05. (`prop.test` reports `X-squared`, which for a two-group test is just the square of the z-statistic from earlier, \(19.113 \approx 4.37^2\), so it carries the same signal: a gap this far out in the tail.) Riverside rejects "the panel does nothing" and ships it. (The interval is on `prop 1` minus `prop 2`, control minus treatment, so it reads negative; the panel *raised* conversion by roughly 1.6 points, and the interval stays clear of zero.) Exactly how far to trust that interval, and how to report the effect size honestly, is the subject of Lesson 4.

=== step === concept
::eyebrow The traps
## How A/B tests quietly break

The sample-size math assumes you run the experiment as designed. Break the design and the guarantees evaporate, usually without any error message. Four traps account for most bad experiments.

- **Peeking (early stopping).** Checking the result repeatedly and stopping the instant \(p < 0.05\) is the most common killer. Every look is a fresh roll of the dice; with enough looks, noise crosses the line eventually even when nothing is happening. The code below runs Riverside's test with a panel that does *nothing*, but peeks ten times and stops at the first "win."

```r
# The panel truly does NOTHING (same rate in both). We peek 10 times and stop early.
set.seed(7)
peek_once <- function() {
  a_buys <- b_buys <- a_n <- b_n <- 0
  for (look in 1:10) {                                 # ten interim checks
    a_buys <- a_buys + rbinom(1, 500, 0.04); a_n <- a_n + 500
    b_buys <- b_buys + rbinom(1, 500, 0.04); b_n <- b_n + 500
    if (prop.test(c(a_buys, b_buys), c(a_n, b_n))$p.value < 0.05) return(TRUE)
  }
  FALSE
}
mean(replicate(1000, peek_once()))                     # false-positive rate, should be 0.05
#> [1] 0.181
```

  The false-positive rate is **18%**, not the 5% you budgeted. Peeking more than tripled it. The fix: pick \(n\) in advance and test once, or use a method built for sequential looks.

- **Chasing many metrics.** Test 20 metrics at \(\alpha = 0.05\) and, on average, one will look "significant" by chance even if the panel changed nothing. Pick one primary metric before you start; treat the rest as exploratory and correct for the number of comparisons.
- **Broken randomization (sample-ratio mismatch).** If a coin flip should send 50% to each group but you see 52/48, a bug is leaking users non-randomly, and the groups are no longer comparable. Check the split before you trust the result.
- **Significance is not importance.** With millions of visitors, a lift of 0.01 points can be highly significant and completely worthless. Always ask whether the effect is big enough to matter, not just whether \(p < 0.05\).

[WARNING]
The p-value's guarantee holds for one test, at a pre-planned sample size, on one metric. Peek, slice by many metrics, or stop when the number looks good, and you are no longer running the experiment you sized; you are fishing.

=== step === quiz
::eyebrow Check yourself
## Why peeking lies

An analyst watches the experiment dashboard every morning and stops the test the first day it shows \(p < 0.05\), declaring a win after four days. Why is that win untrustworthy?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Checking often gathers more data, which always makes the result more reliable ::no It is the opposite. Each check is another chance for random noise to dip below 0.05, so more looks make a false positive more likely, not less. The simulation showed the rate climbing to about 18%.
- Each peek is another chance for noise to cross \(p < 0.05\), so stopping at the first crossing pushes the false-positive rate far above \(\alpha\) ::ok Exactly. The 5% guarantee is for a single test at a planned size. Ten peeks turned it into 18%. Decide the sample size up front and test once, or use a proper sequential method.
- Stopping early only makes the sample smaller, which biases the effect estimate downward ::no A smaller sample is a side effect, but it is not the core problem, and the bias from early stopping actually runs the other way (winners are overstated). The real damage is the inflated false-positive rate.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [Kohavi, Tang and Xu, Trustworthy Online Controlled Experiments (book site)](https://experimentguide.com/) - the definitive practitioner guide to A/B testing at scale, from the teams that ran millions of them.
- [Kohavi et al. (2014), Seven Rules of Thumb for Web Site Experimenters (PDF)](https://www.exp-platform.com/Documents/2014%20experimentersRulesOfThumb.pdf) - a short, concrete list of the pitfalls covered here, with real examples.
- [An Introduction to Statistical Learning, ch. 13 (free PDF)](https://www.statlearning.com/) - hypothesis testing, p-values, power and multiple testing, worked gently.
- [Evan Miller, How Not to Run an A/B Test](https://www.evanmiller.org/how-not-to-run-an-ab-test.html) - the clearest short explanation of why peeking inflates false positives.
- [R documentation: power.prop.test (stats)](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/power.prop.test.html) - the function you used to size the experiment.

=== step === complete
## Lesson 3 complete

You can now design an experiment that earns a clean causal answer. An A/B test is a randomized experiment on a product change: the coin flip makes the two groups comparable, so a plain difference in conversion rates estimates the panel's true effect. You state a null of "no difference," fix a false-positive budget \(\alpha\), and read the p-value as surprise under that null, never as the probability the effect is real. You balance \(\alpha\) against **power** (\(1 - \beta\)), the chance of catching a real effect, and you saw an underpowered test miss a genuine lift two times out of three. Then you sized Riverside's experiment properly with `power.prop.test`, ran it, and watched a 1-point lift come back overwhelmingly significant, while learning why peeking, many metrics, and broken randomization quietly wreck the guarantees.

Next, Lesson 4: Reading an Experiment. A significant p-value tells you an effect is probably real, but not how big, how precise, or what it lets you claim. You will turn that result into an effect size and a confidence interval, and learn exactly what a number like "1.6 points, 95% CI" does and does not permit you to say.
