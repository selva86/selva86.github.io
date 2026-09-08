---
title: "Effect size: Cohen's d and friends, explained"
slug: "Inference-Mini-6"
description: "Two diet trials both pass p < 0.05, yet one barely moves the scale, the other moves it a lot. Learn Cohen's d and Hedges' g to size up how big an effect is."
keywords: "Cohen's d, effect size, Hedges' g, p-value vs effect size, eta-squared, Cramer's V, Pearson r, statistical significance in R"
mathjax: true
webr: true
date: "2026-09-09"
post_type: "LESSON"
course_id: "inference-from-zero"
course_title: "Inference from Zero"
course_lesson: "6"
course_total: "7"
course_landing: "/dashboard.html"
course_prev: "Inference-Mini-5"
course_next: ""
curriculum_id: "0.0.15"
lesson_access: "windowed"
catalog_blurb: "Two diets both clear p < 0.05. Learn to tell which one actually matters."
---

=== step === cover
## Effect size: Cohen's d and friends, explained

Take two weight-loss diets, each tested against a plain no-diet control group in its own randomized trial. Diet A ran with about 1,000 people per arm. Diet B ran with only about 60 people per arm. Both trials come back with p < 0.05, the usual bar for "statistically significant."

Here is how their average results compare.

::widget chart-plotter {"data":[{"x":"Diet A","y":0.63},{"x":"Diet B","y":4.01}],"geoms":["bar"],"x":"diet","y":"extra_kg_lost"}

Diet A's dieters lost 0.63 kg more than control, on average. Diet B's dieters lost 4.01 kg more than control. Both trials are labeled "statistically significant," and the two bars still look very different. Real versus big is the distinction that decides whether a diet is actually worth switching to.

=== step === concept
## What "p < 0.05" actually tells you

A p-value answers one narrow question. It is the probability of seeing a gap this large or larger, if the true gap between the diet and control groups were actually zero. Nothing more.

Let's check both trials against that bar. Press Run.

```r
# Build the two diet trials and test each one for statistical significance
set.seed(6)
diet_a_control <- rnorm(1000, mean = 0, sd = 5)
diet_a_treat   <- rnorm(1000, mean = 0.5, sd = 5)

set.seed(6)
diet_b_control <- rnorm(60, mean = 0, sd = 6)
diet_b_treat   <- rnorm(60, mean = 5, sd = 6)

t_a <- t.test(diet_a_treat, diet_a_control)
t_b <- t.test(diet_b_treat, diet_b_control)

round(c(t_a = unname(t_a$statistic), t_b = unname(t_b$statistic)), 3)
#>   t_a   t_b 
#> 2.830 3.701 
signif(c(p_a = t_a$p.value, p_b = t_b$p.value), 2)
#>     p_a     p_b 
#> 0.00470 0.00033 
```

Both p-values sit comfortably under 0.05. So both trials pass the usual bar for "the gap is probably not just noise." But notice what that bar does not do. It does not distinguish between the two results. Diet A's dieters lost 0.63 kg more than control. Diet B's dieters lost 4.01 kg more than control. The p-value alone gives no hint of that difference.

Here is what makes both of those p-values possible. With enough people in a trial, even a tiny, unimportant gap can clear p < 0.05. Diet A ran with 1,000 people per arm, well over 15 times Diet B's 60. That size alone can turn a small gap into a "significant" one.

::widget null-distribution {"tails":2,"max":4,"start":2.83,"label":"Diet A observed t-statistic"}

The curve above is what Diet A's t-statistic would look like if the diet truly changed nothing. Drag the slider down toward zero and the shaded area, the p-value, swells, since a gap that small would then show up often by pure chance. Leave it out at 2.83, where it starts, and the shaded area sits down near 0.005, matching the p-value the code above just computed. The slider's position tells you how surprising the gap is under "no real effect." It says nothing about how big the gap is in kilograms.

=== step === concept
## Cohen's d: a mean gap measured in pooled standard deviations

So a p-value cannot separate a 0.63 kg gap from a 4.01 kg gap. What can? You need a number that reports the size of the gap on a scale that does not depend on how many people were in the trial. That number is Cohen's d.

Cohen's d takes the gap between two group means and divides it by the pooled standard deviation, the typical spread of both groups combined. Dividing by that spread is what makes d comparable across trials measured in different units or with different amounts of noise.

$$d = \frac{\bar{x}_1 - \bar{x}_2}{s_{pooled}}, \qquad s_{pooled} = \sqrt{\frac{(n_1-1)s_1^2 + (n_2-1)s_2^2}{n_1+n_2-2}}$$

Let's compute it by hand for Diet A first.

```r
# Cohen's d for Diet A, computed by hand from the formula above
n1 <- length(diet_a_control)
n2 <- length(diet_a_treat)
s_pooled_a <- sqrt(((n1 - 1) * var(diet_a_control) + (n2 - 1) * var(diet_a_treat)) / (n1 + n2 - 2))
d_a <- (mean(diet_a_treat) - mean(diet_a_control)) / s_pooled_a
round(c(s_pooled = s_pooled_a, d = d_a), 3)
#> s_pooled        d 
#>    5.002    0.127 
```

Diet A's pooled standard deviation is about 5 kg. Its 0.63 kg gap is only 0.127 of that spread. The gap is small next to how much people's weight naturally varies from person to person.

Now turn the formula into a function, so you never have to retype it, and apply it to Diet B.

```r
# Reusable Cohen's d function, applied to Diet B
cohens_d <- function(x, y) {
  n1 <- length(x); n2 <- length(y)
  s_pooled <- sqrt(((n1 - 1) * var(x) + (n2 - 1) * var(y)) / (n1 + n2 - 2))
  (mean(x) - mean(y)) / s_pooled
}

d_b <- cohens_d(diet_b_treat, diet_b_control)
round(d_b, 3)
#> [1] 0.676
```

Diet B's d comes out to 0.676, over five times Diet A's 0.127, even though Diet B's own trial had a much smaller sample. The p-value only told you both gaps were probably real. d shows something completely different: how far apart the two diets actually are, measured on the same standardized scale.

=== step === concept
## Reading d: negligible, small, medium, large

A raw d value like 0.127 or 0.676 does not mean much until you have something to compare it to. Cohen gave that comparison a set of benchmarks, based on how gaps like these typically look across many fields of research.

- d below 0.2: negligible
- d from 0.2 up to 0.5: small
- d from 0.5 up to 0.8: medium
- d of 0.8 or above: large

These are not laws of nature. They are conventions, but they are the ones almost every paper and package uses, so they are worth knowing by heart.

Wrap that scale into a function and apply it to both diets.

```r
# Classify a Cohen's d value using Cohen's benchmarks
interpret_d <- function(d) {
  absd <- abs(d)
  if (absd < 0.2) "negligible"
  else if (absd < 0.5) "small"
  else if (absd < 0.8) "medium"
  else "large"
}

c(diet_a = interpret_d(d_a), diet_b = interpret_d(d_b))
#>       diet_a       diet_b 
#> "negligible"     "medium" 
```

Diet A's d of 0.127 lands in "negligible." Diet B's d of 0.676 lands in "medium," well on its way to "large." Both trials cleared the exact same p < 0.05 bar. Only one of them found a gap worth telling anyone about.

Quick check before moving on. Two more diet trials come back from the lab. Trial 1 reports p = 0.002 and d = 0.15. Trial 2 reports p = 0.03 and d = 0.85. Which trial found the bigger real-world effect?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Trial 1, because its p-value is smaller ::no
- Trial 2, because its d is larger ::ok Right. d measures the size of the gap directly. Trial 2's 0.85 crosses into "large" while Trial 1's 0.15 stays negligible. Trial 1's smaller p-value only means its result is less likely to be noise, not that its gap is bigger.
- They found equally big effects, since both are statistically significant ::no
- There is no way to tell without knowing the sample sizes ::no d already puts both trials on the same standardized scale, so you can compare them directly without knowing N. A smaller p-value only means a result is less likely to be noise. It says nothing about how big the effect actually is. Read d for size, p for realness.

=== step === concept
## Hedges' g: correcting d for small samples

Diet B's trial had only 60 people per arm. Small samples like that make d run a little high, since the pooled standard deviation itself is estimated from fewer numbers and tends to run a little low. Hedges' g corrects for that by multiplying d by a factor that depends only on the total sample size, N.

$$g = d \times \left(1 - \frac{3}{4N-9}\right)$$

Apply it to the full Diet B trial first, N = 120 in total.

```r
# Hedges' g: Cohen's d times a small-sample correction factor
hedges_g <- function(x, y) {
  n <- length(x) + length(y)
  correction <- 1 - 3 / (4 * n - 9)
  cohens_d(x, y) * correction
}

g_b <- hedges_g(diet_b_treat, diet_b_control)
round(c(d = d_b, g = g_b), 3)
#>     d     g 
#> 0.676 0.671 
```

At N = 120, the correction barely moves anything: d drops from 0.676 to 0.671. Now watch the same trial's first 6 people per arm, 12 in total.

```r
# The same trial, but only the first 6 people per arm
diet_b_pilot_control <- diet_b_control[1:6]
diet_b_pilot_treat   <- diet_b_treat[1:6]

d_pilot <- cohens_d(diet_b_pilot_treat, diet_b_pilot_control)
g_pilot <- hedges_g(diet_b_pilot_treat, diet_b_pilot_control)
round(c(d = d_pilot, g = g_pilot), 3)
#>     d     g 
#> 0.069 0.063 
```

Notice first that this pilot's own d, 0.069, sits nowhere near the full trial's 0.676. That is not the correction at work. Six people per arm is simply too few to pin down a reliable gap, so its own estimate can land almost anywhere.

The correction itself is the separate, more precise part of this comparison.

```r
# How much each correction shrinks d, as a percentage
shrink_full  <- 100 * (1 - g_b / d_b)
shrink_pilot <- 100 * (1 - g_pilot / d_pilot)
round(c(full_N120 = shrink_full, pilot_N12 = shrink_pilot), 3)
#> full_N120 pilot_N12 
#>     0.637     7.692 
```

At N = 120, the correction shrinks d by well under 1 percent. At N = 12, it shrinks d by close to 8 percent, over 10 times as much. That is the actual rule: the correction barely matters above roughly 50 total observations, and grows quickly once you go below it. Use g instead of d whenever your total sample sits at 50 or under.

=== step === widget
## Same threshold, very different sample sizes needed

Diet A used about 1,000 people per arm. Diet B used only about 60 people per arm. Both still cleared p < 0.05. Why would anyone need so many more people for Diet A?

For a fixed significance threshold, the number of people a trial needs to reliably detect a gap, its statistical power, depends heavily on how big that gap actually is, measured in d.

::widget power-curve {}

Toggle between the three presets above. At d = 0.2, small, close to Diet A's own 0.127, reaching 80% power takes about 393 people per arm. At d = 0.5, medium, it drops to about 63. At d = 0.8, large, close to Diet B's own 0.676, it drops again to about 25.

```r
# How many people per arm would 80% power actually need, at each diet's own d?
ceiling(power.t.test(delta = d_a, sd = 1, sig.level = 0.05, power = 0.80)$n)
#> [1] 982
ceiling(power.t.test(delta = d_b, sd = 1, sig.level = 0.05, power = 0.80)$n)
#> [1] 36
```

There it is. Diet A's own gap is so small that reliably detecting it needs about 982 people per arm, and the trial ran almost exactly that many, 1,000. Diet B's own gap is big enough that just 36 per arm would have been enough for 80% power, yet the trial ran 60, comfortably more than it needed. The sample size was never a clue about the size of the effect. It was a clue about how hard that effect was to pin down.

=== step === concept
## Effect size beyond two means
::prose-only a compact table carries this concept clearly; no formula walk-through is needed at this depth

Everything so far compared two group means. But not every test does. The good news is that every common test has its own matching effect size, and they all answer the same underlying question: real versus big.

Suppose the study added a third diet arm, Diet C, run alongside A and B. Comparing three or more group means calls for a one-way ANOVA instead of a t-test, and its matching effect size is eta-squared. It reports the share of the total spread in weight lost that traces back to which diet a person followed, the same "percent of variance explained" idea that r-squared already gives you for two continuous variables.

Or suppose you had only recorded whether each person lost any weight at all, yes or no, instead of exactly how many kilograms. That turns the outcome categorical, and the usual test becomes a chi-square test of association between diet arm and that yes/no outcome. Its effect size is Cramer's V, which rescales the chi-square statistic down to a 0 to 1 range so it stops growing just because the trial recruited more people.

And if your two variables are both continuous, say hours of exercise a person reported and kilograms lost, Pearson's r is already its own effect size. Square it, and r-squared lands on the same variance-explained scale as eta-squared.

| Test structure | Effect size | What it measures | Small | Medium | Large |
|---|---|---|---|---|---|
| Two group means | Cohen's d / Hedges' g | Mean gap in pooled SD units | 0.2 | 0.5 | 0.8 |
| One-way ANOVA, 3+ groups | eta-squared | Share of total variance explained by the grouping factor | 0.01 | 0.06 | 0.14 |
| Two categorical variables | Cramer's V | Strength of association, rescaled to 0 to 1 | 0.10 | 0.30 | 0.50 |
| Two continuous variables | Pearson's r | Strength and direction of a linear relationship | 0.10 | 0.30 | 0.50 |

Different test, different name, same two questions underneath: is the result real, and separately, how big is it.

=== step === quiz
## Quick check: is it real, or is it big?

A new pair of trials reports two numbers each. Trial X ran with 500 people per arm and came back with p = 0.01 and d = 0.15. Trial Y ran with only 30 people per arm and came back with p = 0.04 and d = 0.70.

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Trial X found the bigger real effect, since it is the bigger trial ::no
- Trial Y found the bigger real effect, even though it is the smaller trial, since its d is larger ::ok Right. Both p-values clear 0.05, so both gaps are probably real. But d is what tells you how big each one is, and Trial Y's 0.70 comfortably beats Trial X's 0.15. A bigger trial does not mean a bigger effect. It just makes a smaller one easier to detect reliably.
- Neither found a real effect, since both p-values could just be noise ::no
- Both found equally big effects, since both cleared p < 0.05 ::no p < 0.05 only tells you a gap is probably not pure noise. It says nothing about the gap's size. Trial X's own d, 0.15, is negligible. Trial Y's own d, 0.70, is medium, closer to large. A bigger trial does not automatically mean a bigger effect, and clearing the same p-value bar does not mean two results are equally big.

=== step === tryit
## Your turn: compute and classify a new d

Diet C is a third trial, run the same way as A and B. Here are its two groups.

```r
# Diet C's control and treatment groups, kg lost relative to baseline
diet_c_control <- c(-3, 2, -5, 1, 4, -2, 3, -4)
diet_c_treat   <- c(0, 4, -3, 3, 5, 0, 4, -1)

# Compute Cohen's d for diet_c_treat vs diet_c_control using cohens_d(),
# then classify it with interpret_d(). Print both.
```
::check {"regex": "(?=[\\s\\S]*cohens_d[(]\\s*diet_c_treat\\s*,\\s*diet_c_control)(?=[\\s\\S]*interpret_d[(])", "gate": true, "difficulty": "intermediate", "ok": "Right: d comes out to about 0.63, a medium effect, well over halfway from negligible to large. A small sample does not stop you from computing an honest effect size. It just leaves more room for that number to move if you ran Diet C again.", "no": "Call cohens_d(diet_c_treat, diet_c_control) to get d, then pass that value into interpret_d() to get its label."}
::solution
```r
# Compute Cohen's d for Diet C, then classify it
d_c <- cohens_d(diet_c_treat, diet_c_control)
label_c <- interpret_d(d_c)
round(d_c, 2)
label_c
#> [1] 0.63
#> [1] "medium"
```

=== step === concept
## References

- [Statistical Power Analysis for the Behavioral Sciences](https://www.routledge.com/Statistical-Power-Analysis-for-the-Behavioral-Sciences/Cohen/p/book/9780805802832) - Cohen (1988), 2nd ed., Routledge. The book that fixed the 0.2 / 0.5 / 0.8 small, medium, large benchmarks used for Diet A and Diet B above.
- [Using Effect Size, or Why the P Value Is Not Enough](https://doi.org/10.4300/JGME-D-12-00156.1) - Sullivan and Feinn (2012), Journal of Graduate Medical Education, 4(3), 279-282. A short, direct case for reporting effect size alongside every p-value.
- [Calculating and reporting effect sizes to facilitate cumulative science](https://doi.org/10.3389/fpsyg.2013.00863) - Lakens (2013), Frontiers in Psychology, 4, 863. A practical primer for computing d and related effect sizes for t-tests and ANOVAs.
- [Understanding The New Statistics: Effect Sizes, Confidence Intervals, and Meta-Analysis](https://www.routledge.com/Understanding-The-New-Statistics-Effect-Sizes-Confidence-Intervals-and-Meta-Analysis/Cumming/p/book/9780415879682) - Cumming (2012), Routledge. Makes the case for leading with effect sizes and intervals instead of a bare p-value.
- [Publication Manual of the American Psychological Association, Seventh Edition](https://apastyle.apa.org/products/publication-manual-7th-edition) - American Psychological Association (2020). The style guide that requires effect size reporting in published research.

=== step === complete
## What you can do now

You now split every result into two separate answers instead of one. Is it real: what the p-value tells you, and nothing more. Is it big: what d, or g for a small sample, actually shows.

Three numbers from today's trials capture the whole real-versus-big gap. Diet A's d came in at about 0.13, negligible, despite p < 0.05 and 1,000 people per arm. Diet B's d came in at about 0.68, medium, on a trial with only 60 people per arm. And the pilot slice's g of 0.06 was a reminder that 6 people per arm is too few to trust either number very far.

Outside of two-group comparisons, you know where to look. eta-squared covers an ANOVA, Cramer's V covers two categorical variables, and Pearson's r covers two continuous ones. The test may differ, but the two questions stay the same.

A diet that "works" statistically can still be too small to bother with. A diet with a smaller, noisier trial can still be the one that actually moves the number on the scale. From here on, whenever you see p < 0.05, ask what comes right after it.
