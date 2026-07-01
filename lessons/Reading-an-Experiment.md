---
title: "Causal Inference Lesson 4: Reading an Experiment"
catalog_blurb: "How big the effect really is, how sure, and what you can claim."
description: "Turn a significant A/B result into an honest conclusion: absolute vs relative effect size, the 95% confidence interval, practical vs statistical significance, and what one experiment lets you claim in R."
keywords: "effect size, absolute vs relative lift, confidence interval, confidence interval interpretation, practical vs statistical significance, reading A/B test results, prop.test, minimum detectable effect, causal inference in R"
post_type: "LESSON"
curriculum_id: "6.10.4"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-causal"
course_title: "Causal Inference in R"
course_lesson: "4"
course_total: "5"
course_landing: "R-Causal-Inference-Course.html"
course_next: "When-You-Cannot-Randomize.html"
course_prev: "AB-Testing-and-Experiment-Design.html"
---

=== step === cover
::eyebrow Lesson 4 of 5
## Reading an Experiment

In Lesson 3 you sized Riverside Books' experiment, ran it, and got a p-value of about \(1.2 \times 10^{-5}\): the "Readers also bought" panel almost certainly does *something*. That is where most people stop. But a p-value is a yes/no answer, and shipping a product change is not a yes/no decision. Before Riverside rolls the panel out to every visitor, four harder questions remain.

- **How big** is the effect? A "significant" lift could be one buyer in a thousand or one in twenty.
- **How sure** are we of that size? A single point estimate hides how much wiggle room the data leaves.
- **Does it matter** in practice, not just on paper?
- **What can we actually claim** from one experiment, and what would be overreaching?

This lesson turns a bare "it's significant" into an honest, defensible conclusion. The curve below is that same significance test from Lesson 3: drag the observed result and the p-value hands back its one and only verdict, reject or don't. That single yes/no is everything a p-value can tell you. By the end you will read far more out of the same experiment.

By the end of this lesson you will be able to:

- Compute the **absolute** effect (in percentage points) and the **relative** lift (in percent), and explain why the relative number alone can mislead
- Read a **95% confidence interval** as a range of plausible true effects, compute it in R, and connect "the interval excludes zero" to "p is below 0.05"
- State correctly what "95% confidence" means, and avoid the reading almost everyone gets wrong
- Separate **statistical** significance from **practical** significance, and scope what a single experiment does and does not let you claim

**Prerequisites:** you finished [Lesson 3](AB-Testing-and-Experiment-Design.html) (randomization, the null hypothesis, p-values, the significance level \(\alpha\), power, and the minimum detectable effect). Every new term here is defined as it appears.

::widget null-distribution {"tails":2,"max":5,"start":2.4,"label":"observed z"}

=== step === concept
::eyebrow How big is it?
## Effect size: absolute versus relative

The first thing to pull out of a result is its **effect size**: not "is there a difference" but "how large is the difference." For Riverside's two conversion rates there are two honest ways to say it, and they sound wildly different.

The **absolute effect** is the plain difference in rates, the extra share of visitors who buy under the new panel:

\[ \Delta = \hat p_B - \hat p_A, \]

where \(\hat p_A\) is the observed control rate and \(\hat p_B\) the observed treatment rate (the hat means "measured from the sample"). Riverside's is about **1.6 percentage points**.

The **relative lift** divides that same gap by the baseline, so it reads as a percent *increase* over where you started:

\[ \text{relative lift} = \frac{\hat p_B - \hat p_A}{\hat p_A}. \]

Riverside's is about **42%**. Same experiment, same 260-versus-368 buyers, described two ways: "1.6 points more" and "42% more buyers." Both are true. Build the counts inline and see them fall out.

```r
# Lesson 3's experiment has finished: 6800 visitors per group. Here are the buyers.
n_A <- 6800; n_B <- 6800           # control (old page) and treatment (new panel)
x_A <- 260;  x_B <- 368            # visitors who bought in each group
p_A <- x_A / n_A                   # observed control conversion
p_B <- x_B / n_B                   # observed treatment conversion

abs_lift <- p_B - p_A              # ABSOLUTE effect: difference in the two rates
rel_lift <- (p_B - p_A) / p_A      # RELATIVE effect: as a share of the control rate
round(c(control_pct      = p_A * 100,
        treatment_pct    = p_B * 100,
        absolute_points  = abs_lift * 100,   # percentage POINTS
        relative_percent = rel_lift * 100),  # PERCENT increase over control
      1)
#> control_pct     treatment_pct  absolute_points relative_percent 
#>         3.8               5.4              1.6             41.5
```

[NOTE]
Neither number is wrong, but each can be spun. A tiny absolute change looks impressive in relative terms when the baseline is small: going from 0.1% to 0.2% is "100% more" and almost nothing in practice. Report both, and be suspicious of anyone who quotes only the flattering one.

=== step === quiz
::eyebrow Check yourself
## Which number is the spin?

A marketing deck claims a new checkout button drove a **"50% increase in conversions."** Digging in, you find the rate went from **0.4% to 0.6%**. Which statement reads the effect most honestly?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- The button is a big win: a 50% lift is huge and should ship immediately ::no 50% is the relative lift, and off a 0.4% baseline it is easy to produce. The absolute change is only 0.2 percentage points. Relative numbers look largest exactly when the baseline is smallest, which is when they matter least.
- The claim is false; you cannot get a 50% increase from such small rates ::no The claim is arithmetically correct: (0.6 - 0.4) / 0.4 = 0.5, a 50% relative lift. It is not false, just incomplete. The honest problem is quoting the relative number without the absolute one.
- Both are the same effect: a 0.2-point absolute rise, which is a 50% relative lift; whether it is "big" depends on what 0.2 points is worth ::ok Exactly. 0.4% to 0.6% is +0.2 percentage points and +50% relative, two views of one change. The relative figure is real but flattering; the decision depends on the absolute value of 0.2 points in revenue, not on the headline percentage.

=== step === concept
::eyebrow How sure are we?
## The confidence interval: a range, not a dot

An effect size like "1.6 points" is a single best guess from one random sample. Run the experiment again next week and you would get a slightly different number. So a responsible answer is not a dot but a **net**: a range of true effects that are consistent with what you saw. That net is the **confidence interval (CI)**.

Formally, the 95% confidence interval for the difference in two proportions is the estimate plus or minus a margin:

\[ (\hat p_B - \hat p_A)\ \pm\ z_{1-\alpha/2}\,\sqrt{\frac{\hat p_A(1-\hat p_A)}{n_A} + \frac{\hat p_B(1-\hat p_B)}{n_B}}, \]

where \(\hat p_A, \hat p_B\) are the two observed rates, \(n_A, n_B\) the two group sizes, the square-root term is the **standard error** (how much the difference bounces around from sample to sample), and \(z_{1-\alpha/2}\) is the normal cutoff for your confidence level: **1.96** for 95%. You do not build it by hand; `prop.test` returns it. Put the treatment group first so the difference reads as a positive lift.

```r
# The confidence interval for the lift comes straight out of prop.test.
test <- prop.test(c(x_B, x_A), c(n_B, n_A))   # treatment first -> positive difference
round(test$conf.int * 100, 2)                 # 95% CI for the lift, in percentage points
#> [1] 0.87 2.31
```

```r
# The same interval, rebuilt from the formula: estimate +/- 1.96 * standard error.
se   <- sqrt(p_A * (1 - p_A) / n_A + p_B * (1 - p_B) / n_B)   # standard error of the difference
wald <- (p_B - p_A) + c(-1, 1) * qnorm(0.975) * se
round(wald * 100, 2)          # a hair narrower; prop.test nudges the ends out slightly to correct for using a smooth curve on whole counts
#> [1] 0.88 2.29
```

So Riverside's honest answer is not "1.6 points" but **"somewhere between about 0.9 and 2.3 points, most likely near 1.6."** A picture makes the shape of that answer obvious: the estimate as a dot, the interval as a bar, and a dashed line at zero (no effect) for reference.

```r
library(ggplot2)
est <- data.frame(label = "Lift: treatment minus control",
                  point = (p_B - p_A) * 100,
                  lo    = test$conf.int[1] * 100,
                  hi    = test$conf.int[2] * 100)
ggplot(est, aes(x = point, y = label)) +
  geom_vline(xintercept = 0, linetype = "dashed", colour = "grey50") +
  geom_errorbarh(aes(xmin = lo, xmax = hi), height = 0.12, linewidth = 0.9) +
  geom_point(size = 3.5, colour = "#1f7a55") +
  labs(x = "Lift in conversion (percentage points)", y = NULL,
       title = "The effect estimate and its 95% confidence interval") +
  theme_minimal(base_size = 13)
```

The whole bar sits to the right of the dashed zero line. That is the visual form of "statistically significant": zero is not a plausible value.

[KEY INSIGHT]
The confidence interval and the hypothesis test are two views of the same thing. A 95% confidence interval **excludes zero exactly when the p-value is below 0.05.** Riverside's interval (0.87 to 2.31) clears zero, which is why Lesson 3's test rejected "no effect." The interval says everything the p-value did, and also tells you how big and how precise, which the p-value never could.

=== step === concept
::eyebrow What "95%" really means
## The coverage game

Here is the trap almost everyone falls into. It is tempting to say "there is a 95% chance the true lift is between 0.87 and 2.31 points." That reading is **wrong**. The true lift is a fixed (if unknown) number; it is either in this particular interval or it is not. The 95% is not about *this* interval at all. It is a property of the **procedure**: if you ran the whole experiment over and over, each time building an interval this way, about 95% of those intervals would contain the true effect. Any single interval is one draw from that long-run game.

We can literally play the game. Pretend, just for the simulation, that we *know* the truth: the panel really lifts conversion from 4.0% to 5.2%, a true 1.2-point effect. Now run the experiment 20 times and draw all 20 intervals against that truth.

```r
# Pretend we KNOW the truth (only possible in a simulation): a real 1.2-point lift.
set.seed(1)
true_pA <- 0.040; true_pB <- 0.052
truth   <- (true_pB - true_pA) * 100          # the real lift, in points, the CIs should catch
runs <- lapply(1:20, function(i) {
  a  <- rbinom(1, 6800, true_pA); b <- rbinom(1, 6800, true_pB)
  ci <- prop.test(c(b, a), c(6800, 6800))$conf.int * 100
  data.frame(run = i, lo = ci[1], hi = ci[2],
             covers = ci[1] <= truth & truth <= ci[2])
})
runs <- do.call(rbind, runs)

library(ggplot2)
ggplot(runs, aes(y = run)) +
  geom_vline(xintercept = truth, linetype = "dashed", colour = "grey40") +
  geom_errorbarh(aes(xmin = lo, xmax = hi, colour = covers), height = 0) +
  scale_colour_manual(values = c("TRUE" = "#1f7a55", "FALSE" = "#b5631a")) +
  labs(x = "95% CI for the lift (percentage points)", y = "Experiment #",
       colour = "Covers truth?",
       title = "Run it 20 times: almost every interval catches the true lift")
```

Almost all 20 bars cross the dashed truth line; roughly one misses (in orange). That is coverage. Push it to a thousand runs and the fraction that cover the truth lands right around 0.95.

```r
# Over many runs, the fraction of 95% intervals that cover the truth is about 0.95.
covered <- replicate(1000, {
  a  <- rbinom(1, 6800, true_pA); b <- rbinom(1, 6800, true_pB)
  ci <- prop.test(c(b, a), c(6800, 6800))$conf.int
  ci[1] <= (true_pB - true_pA) && (true_pB - true_pA) <= ci[2]
})
mean(covered)
#> [1] 0.948
```

=== step === quiz
::eyebrow Check yourself
## Read the interval

Riverside's 95% CI for the lift is **0.87 to 2.31 percentage points**. Which is the correct thing to say about it?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- There is a 95% probability the true lift is between 0.87 and 2.31 points ::no This is the common misreading. The true lift is a fixed number; it is in this interval or it is not, with no probability attached to this one interval. The 95% describes the long-run hit rate of the procedure, not this single result.
- If we reran the experiment many times, about 95% of the intervals built this way would contain the true lift ::ok Exactly. "95% confidence" is a property of the method across repeated experiments, not a probability about this one interval. This interval either caught the truth or did not; we just know the recipe succeeds about 95% of the time.
- 95% of Riverside's visitors have a conversion lift between 0.87 and 2.31 points ::no The interval is about the single population lift, not about individual visitors, and it is not a range that "95% of people" fall into. It bounds one number, the true difference in rates, not a spread across customers.

=== step === concept
::eyebrow Does it matter?
## Significant is not the same as big enough

A result can be rock-solid statistically and still be too small to care about. **Statistical** significance asks "is the effect distinguishable from zero?" **Practical** significance asks "is it large enough to act on?" They are different questions, and only you can answer the second, because it depends on what the change is worth.

The lever is sample size. The confidence interval shrinks as \(n\) grows, so with enough visitors *any* nonzero effect, however tiny, eventually clears zero and becomes significant. Watch the same trivial **0.1-point** lift (4.0% to 4.1%) go from unremarkable to "significant" purely by adding data.

```r
# The SAME trivial 0.1-point lift (4.0% -> 4.1%), tested at growing sample sizes:
p_at_n <- function(n) {
  xA <- round(n * 0.040); xB <- round(n * 0.041)   # exactly a 0.1-point lift, always
  prop.test(c(xB, xA), c(n, n))$p.value
}
round(sapply(c(20000, 100000, 500000), p_at_n), 3)
#> [1] 0.606 0.257 0.011
```

At half a million visitors per group the 0.1-point lift is "significant" (p = 0.011), yet it is almost certainly not worth an engineering roll-out. Now flip it back to Riverside. In Lesson 3 the team decided a **1-point** lift was the minimum worth shipping (the minimum detectable effect). Their interval runs from 0.87 to 2.31 points:

| Question | Riverside's answer |
|---|---|
| Statistically significant? | Yes: the interval (0.87 to 2.31) excludes zero |
| Clears the 1-point "worth it" bar? | Probably: most of the interval is above 1, but the low end (0.87) dips just under it |
| Honest verdict | A real, likely-worthwhile lift, though we cannot fully rule out that it sits just below the bar |

[WARNING]
"p is below 0.05" never means "big enough to ship." With large samples, effects far too small to matter turn up as significant all the time. Always compare the confidence interval to the smallest effect you actually care about, not just to zero.

=== step === concept
::eyebrow What can you claim?
## What one experiment lets you say

You now have an effect size, an interval, and a practical read. The last discipline is not overclaiming. A clean randomized experiment earns a specific, bounded statement, and no more. A useful way to report it is a short recipe.

::widget process-flow {"steps":[{"title":"State the effect size","sub":"both the absolute points and the relative percent, never one alone"},{"title":"Give the confidence interval","sub":"the plausible range, not just the single point estimate"},{"title":"Judge practical significance","sub":"is the range past the smallest effect worth acting on"},{"title":"Scope the claim","sub":"this population, this period, this one metric, evidence not proof"}]}

That last box carries the weight. Randomization buys you a strong causal claim, but only within the bounds you actually tested. Four limits worth naming every time:

- **This population.** Riverside measured *its* visitors during the test window. The panel may behave differently for a different audience, region, or catalogue.
- **This period.** A shiny new panel can spike from novelty and fade, or a launch week can be unusually busy. One run captures one slice of time.
- **This metric.** The panel lifted the *buy rate*. It says nothing on its own about revenue per order, returns, or long-term retention unless you measured those too.
- **Evidence, not proof.** A significant result is strong evidence the effect is real; it is never mathematical proof, and it says nothing about any single visitor, only the group.

=== step === quiz
::eyebrow Check yourself
## Don't overclaim

Riverside's test is significant, with a 95% CI of 0.87 to 2.31 points on the conversion rate for its visitors during the two-week run. Which conclusion stays inside what the experiment supports?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- For visitors like those in the test, the panel raised the buy rate by roughly 0.9 to 2.3 points; whether to ship depends on whether that clears our bar ::ok Right. It states the effect and its range, ties the claim to the tested population and metric, and leaves the ship/no-ship call to the practical bar. That is exactly what one randomized experiment licenses.
- The experiment proves the panel will lift sales for all Riverside customers, permanently ::no Two overreaches at once. "Proves" overstates evidence, and "all customers, permanently" generalizes past the population and period actually tested. Novelty can fade and other segments may differ.
- Because the result is significant, the effect is large enough that Riverside should roll it out right away ::no Significance is not size. The result clears zero, but the low end of the interval (0.87) dips below the 1-point bar the team set. Shipping is a practical decision about the interval, not an automatic consequence of p below 0.05.

=== step === tryit
::eyebrow Your turn
## Read a fresh result

Riverside's sister store ran its own smaller test of the panel: **90 of 3000** visitors bought on the old page, **126 of 3000** with the panel. Pull the 95% confidence interval for the lift out of the `prop.test` result (fill in the element that holds it), so you can see whether the whole range clears zero.

```r
# Sister store: 90/3000 bought on the old page, 126/3000 with the panel.
# Get the 95% CI for the lift (treatment minus control), in percentage points.
ci <- prop.test(c(126, 90), c(3000, 3000))$____
round(ci * 100, 2)
```
::check {"regex":"conf\\.int","gate":true,"difficulty":"intermediate","ok":"Right: the interval lives in $conf.int. It runs from about 0.2 to 2.2 points, entirely above zero, so the lift is real (p below 0.05). But notice how wide it is on only 3000 visitors per group; the honest report is that range, not a single number, and whether 0.2 to 2.2 points is worth shipping is a separate, practical call.","no":"The interval is stored in the $conf.int element of the prop.test result. Fill in conf.int, run it, then read whether the whole range sits above zero."}
::solution
```r
ci <- prop.test(c(126, 90), c(3000, 3000))$conf.int
round(ci * 100, 2)
#> [1] 0.22 2.18
```

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [Greenland et al. (2016), Statistical tests, P values, confidence intervals, and power: a guide to misinterpretations](https://link.springer.com/article/10.1007/s10654-016-0149-3) - a plain-language catalogue of exactly the misreadings this lesson warns against.
- [Wasserstein and Lazar (2016), The ASA Statement on p-Values](https://www.tandfonline.com/doi/full/10.1080/00031305.2016.1154108) - the profession's official six principles on what a p-value is and is not.
- [Kohavi, Tang and Xu, Trustworthy Online Controlled Experiments (book site)](https://experimentguide.com/) - how effect sizes and intervals are read when the experiments run at scale.
- [An Introduction to Statistical Learning, ch. 13 (free PDF)](https://www.statlearning.com/) - hypothesis testing, p-values and confidence intervals, worked gently.
- [R documentation: prop.test (stats)](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/prop.test.html) - the function that gave you the estimate and the interval.

=== step === complete
## Lesson 4 complete

You can now read an experiment, not just test one. A p-value answered a single narrow question in Lesson 3; here you answered the four that a decision actually needs. You measured the effect two honest ways, the **absolute** 1.6-point lift and the **relative** 42% increase, and saw how a small baseline lets the relative number oversell. You wrapped the estimate in a **95% confidence interval** (about 0.87 to 2.31 points), rebuilt it from the formula, drew it against zero, and learned that a CI excludes zero exactly when p is below 0.05. You nailed what "95% confidence" really means by playing the coverage game, separated **statistical** from **practical** significance by watching a trivial lift turn significant on sheer sample size, and scoped what one randomized result lets you claim: this population, this period, this metric, evidence rather than proof.

Next, Lesson 5: When You Cannot Randomize. Riverside got to run a clean coin-flip experiment, but often you cannot: the change already happened, or randomizing would be unethical or impossible. You will learn how matching and difference-in-differences try to recover a causal answer from observational data, and exactly which assumptions they ask you to buy in return.
