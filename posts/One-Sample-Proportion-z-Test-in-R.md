---
title: "One-Sample Proportion z-Test in R: Large Sample Inference"
slug: One-Sample-Proportion-z-Test-in-R
description: "Compute a one-sample proportion z-test in R with large-sample inference. Manual z, prop.test(), Wilson CI, Cohen's h, and power in ~150 lines of code."
keywords: "one proportion z test in R, prop.test, one sample z test R, large sample proportion test, normal approximation proportion, Wilson confidence interval, Cohen's h, proportion test power"
auto_link_terms: "one-sample proportion z-test|one-proportion z-test|large-sample proportion test|Wilson confidence interval|Cohen's h|z-test for a proportion"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: 2026-04-18
curriculum_id: "FR-infe-14"
post_type: FR
fr_parent: Proportion-Tests-in-R.html
difficulty: Intermediate
---

# One-Sample Proportion z-Test in R: Large Sample Inference

<p class="lead">A one-sample proportion z-test checks whether an observed proportion (like a 35% conversion rate in 400 trials) differs from a hypothesised value under the large-sample normal approximation. It works when <code>n*p0</code> and <code>n*(1-p0)</code> are both at least 10, returns a <code>z</code> statistic compared to Normal(0, 1), and is the large-sample cousin of the exact binomial test.</p>

## What is a one-sample proportion z-test?

You surveyed 400 site visitors and 152 clicked the new pricing page. Your baseline click rate was 35%. Is 38% a real lift or random noise? The z-test answers that by standardising the gap between observed and hypothesised proportions. Let's do it by hand first so the formula never feels like a black box again.

The test statistic is:

$$z = \frac{\hat{p} - p_0}{\sqrt{p_0(1-p_0)/n}}$$

Where $\hat{p}$ is the sample proportion $x/n$, $p_0$ is the null proportion, and $n$ is the sample size. Compare $z$ to a standard Normal distribution.

```r title="Manual one-sample z-test for a proportion"
# Data: 152 clicks out of 400 visitors; baseline p0 = 0.35
x  <- 152
n  <- 400
p0 <- 0.35

p_hat <- x / n
se0   <- sqrt(p0 * (1 - p0) / n)
z     <- (p_hat - p0) / se0

# Two-sided p-value from Normal(0,1)
p_val <- 2 * pnorm(-abs(z))

# 95% Wald confidence interval around p_hat
se_wald <- sqrt(p_hat * (1 - p_hat) / n)
ci_wald <- c(p_hat - 1.96 * se_wald, p_hat + 1.96 * se_wald)

round(c(p_hat = p_hat, z = z, p_value = p_val,
        ci_low = ci_wald[1], ci_high = ci_wald[2]), 4)
#>   p_hat       z p_value  ci_low ci_high
#>  0.3800  1.2579  0.2085  0.3324  0.4276
```

The sample rate is 38%, which is 3 points above the null of 35%. But the z-statistic is only 1.26, well short of the 1.96 threshold for two-sided significance at the 5% level. The p-value of 0.21 says "this much of a gap or bigger happens by chance about one run in five." You don't have evidence the true click rate has moved. The Wald 95% interval stretches from 0.33 to 0.43, comfortably covering 0.35.

![Building the z-statistic for a proportion.](screenshots/One-Sample-Proportion-z-Test-in-R-z-mechanics.webp)
*Figure 1: How the z-statistic is built from the sample and hypothesised proportions.*

[KEY INSIGHT]
**The standard error uses p0, not p_hat.** Under the null the true variance of `p_hat` is `p0*(1-p0)/n`, so plugging in `p0` gives `z` its clean Normal(0, 1) shape. The score form is what makes the test a test.

**Try it:** A small coffee chain claims 30% of customers order oat milk. In a sample of 200, 48 did. Compute `ex_z` for this data, then the two-sided p-value in `ex_p`.

```r title="Your turn: z-test for oat milk preference"
# Test 48/200 against H0: p = 0.30
ex_x  <- 48
ex_n  <- 200
ex_p0 <- 0.30

ex_z <- NULL  # your code here
ex_p <- NULL  # your code here

c(z = ex_z, p_value = ex_p)
#> Expected: z around -1.85, p-value around 0.06
```

<details>
<summary>Click to reveal solution</summary>

```r title="Oat milk z-test solution"
ex_p_hat <- ex_x / ex_n
ex_se0   <- sqrt(ex_p0 * (1 - ex_p0) / ex_n)
ex_z     <- (ex_p_hat - ex_p0) / ex_se0
ex_p     <- 2 * pnorm(-abs(ex_z))

round(c(z = ex_z, p_value = ex_p), 4)
#>       z p_value
#> -1.8516  0.0641
```

**Explanation:** 24% observed vs 30% hypothesised gives `z = -1.85`, two-sided p = 0.064. Close but not significant at the 5% level.

</details>

## How do you check the large-sample assumptions?

The z-test leans on the Central Limit Theorem to approximate a discrete binomial with a continuous Normal. That approximation is only honest when the expected counts are big enough. The working rule is `n*p0 >= 10` and `n*(1-p0) >= 10`. Some textbooks use 5 as the threshold; 10 is the safer and more widely recommended value.

Alongside the count rule, you also need the data to be a simple random sample from independent trials with two outcomes. If trials cluster (repeat visitors, the same patient measured twice) the nominal 5% error rate will be too optimistic.

```r title="Assumption-check helper for the z-test"
# Returns list with pass/fail and the two expected counts
check_assumptions <- function(n, p0, threshold = 10) {
  np0  <- n * p0
  nq0  <- n * (1 - p0)
  pass <- (np0 >= threshold) && (nq0 >= threshold)
  list(pass = pass, n_p0 = np0, n_1_minus_p0 = nq0)
}

# Our example: n = 400, p0 = 0.35
check_assumptions(n = 400, p0 = 0.35)
#> $pass
#> [1] TRUE
#> $n_p0
#> [1] 140
#> $n_1_minus_p0
#> [1] 260

# Small-sample counter-example: n = 12, p0 = 0.3
check_assumptions(n = 12, p0 = 0.3)
#> $pass
#> [1] FALSE
#> $n_p0
#> [1] 3.6
#> $n_1_minus_p0
#> [1] 8.4
```

Our n=400 case sails through with expected counts of 140 and 260. The n=12 case fails the first count. For that second example the normal approximation would underestimate the tails of the true binomial, so the z-test would give a biased p-value and a poorly-covering Wald interval. Treat assumption checks as a guardrail, not a formality.

![Choosing the right proportion test and confidence interval.](screenshots/One-Sample-Proportion-z-Test-in-R-decision-flow.webp)
*Figure 2: Use `prop.test()` with the Wilson CI when the count rule passes, otherwise fall back to `binom.test()` with a Clopper-Pearson interval.*

[WARNING]
**When the count rule fails, do not just shrug and run the z-test.** Switch to `binom.test()` for an exact p-value from the binomial distribution. See the [Exact Binomial Test in R](Exact-Binomial-Test-in-R.html) post for the full treatment.

**Try it:** A recruiter claims 20% of applicants pass the coding round. You see 12 passes out of 40. Does the count rule for the z-test hold?

```r title="Your turn: check the count rule"
# Check assumptions for n = 40, p0 = 0.20
# Use the helper defined above.
ex_check <- NULL  # your code here

ex_check
#> Expected: pass = FALSE, n_p0 = 8, n_1_minus_p0 = 32
```

<details>
<summary>Click to reveal solution</summary>

```r title="Recruiter count-rule solution"
ex_check <- check_assumptions(n = 40, p0 = 0.20)
ex_check
#> $pass
#> [1] FALSE
#> $n_p0
#> [1] 8
#> $n_1_minus_p0
#> [1] 32
```

**Explanation:** `n*p0 = 8`, which is under 10. The z-test is risky here. Prefer `binom.test(x = 12, n = 40, p = 0.20)` for a solid p-value.

</details>

## How do you run the z-test with prop.test()?

R's built-in `prop.test()` does the same arithmetic you just did by hand, with three twists: it reports a chi-square statistic (which is $z^2$), it offers a Yates continuity correction by default, and it returns a Wilson score interval instead of the Wald one. Setting `correct = FALSE` strips the continuity correction and lines the function up exactly with the textbook z-test.

The three key inputs are `x` (successes), `n` (sample size), and `p` (the null proportion). The result is an htest object whose `statistic`, `p.value`, and `conf.int` components carry everything you need.

```r title="Run prop.test without continuity correction"
res_score <- prop.test(x = x, n = n, p = p0,
                       correct = FALSE)
res_score
#> 
#> 	1-sample proportions test without continuity correction
#> 
#> data:  x out of n, null probability p0
#> X-squared = 1.5824, df = 1, p-value = 0.2085
#> alternative hypothesis: true p is not equal to 0.35
#> 95 percent confidence interval:
#>  0.3336012 0.4285025
#> sample estimates:
#>    p 
#> 0.38

# Confirm chi-square equals z^2 from the manual calc
c(sqrt_chi = sqrt(res_score$statistic), abs_z = abs(z))
#> sqrt_chi.X-squared         abs_z 
#>          1.2579365     1.2579365
```

The chi-square statistic 1.58 is exactly $z^2 = 1.258^2$, and the p-value 0.2085 matches the one we computed by hand. That is the core identity behind the "proportion test": R wraps the z-test in a chi-square hull, but the arithmetic under the hood is the same. The confidence interval here is Wilson's, not Wald's, which is why it differs slightly from the manual Wald interval we printed earlier.

One-sided alternatives are one flag away. Use `alternative = "greater"` if your research question is "the true rate is above $p_0$", and `alternative = "less"` for the other direction. The p-value is halved in the direction you hypothesised and set to near 1 in the other.

```r title="One-sided proportion z-tests"
res_greater <- prop.test(x = x, n = n, p = p0,
                         alternative = "greater",
                         correct = FALSE)
res_less    <- prop.test(x = x, n = n, p = p0,
                         alternative = "less",
                         correct = FALSE)

c(two_sided = res_score$p.value,
  greater   = res_greater$p.value,
  less      = res_less$p.value)
#> two_sided   greater      less 
#> 0.2084559 0.1042280 0.8957720
```

The one-sided "greater" p-value is exactly half the two-sided p-value, because all the evidence sits on that side. The "less" alternative lines up with the opposite tail and gets a p-value near 1. Pick the one-sided flavour only when a directional hypothesis was pre-specified, not because the two-sided result disappointed you.

[TIP]
**Run prop.test() with `correct = FALSE` when you want the textbook z-test.** The default Yates correction shrinks the chi-square toward zero to account for the continuous approximation of a discrete distribution. For sample sizes in the hundreds it changes the p-value only a whisker, but it breaks the clean "chi-square equals z squared" identity.

**Try it:** Use `prop.test()` to run the one-sided "greater" version of the main example. Store it in `ex_res_greater` and pull out the p-value.

```r title="Your turn: one-sided prop.test"
# Two-sided was p = 0.21; greater should be p = 0.10
ex_res_greater <- NULL  # your code here

ex_res_greater$p.value
#> Expected: ~0.1042
```

<details>
<summary>Click to reveal solution</summary>

```r title="One-sided prop.test solution"
ex_res_greater <- prop.test(x = 152, n = 400, p = 0.35,
                            alternative = "greater",
                            correct = FALSE)
ex_res_greater$p.value
#> [1] 0.104228
```

**Explanation:** Halving the two-sided p puts all the probability mass in the right tail, giving 0.104. Still not significant at 5%, so directional evidence is also weak.

</details>

## Which confidence interval should you report: Wald or Wilson?

The Wald interval $\hat{p} \pm z^{*} \sqrt{\hat{p}(1-\hat{p})/n}$ is the formula everyone learns first. It is easy to compute and works fine in the middle of the range. It breaks down as the true proportion approaches 0 or 1 because the SE shrinks but the distribution becomes skewed, and the Wald interval can spill outside [0, 1] or cover too little of the time.

The Wilson score interval solves this by inverting the score test instead of the Wald test. Its centre shifts slightly toward 0.5 and its width uses `p0`-style variance terms. For any proportion near the boundaries, Wilson delivers noticeably better coverage and never escapes [0, 1]. It is `prop.test()`'s default interval.

```r title="Compare Wald and Wilson intervals for a near-boundary case"
# Scenario: 2 positives out of 50 samples; a 4% observed rate
p_small <- 2 / 50
n_small <- 50

# Wald CI (by hand): z* = 1.96
se_small <- sqrt(p_small * (1 - p_small) / n_small)
ci_wald2 <- c(p_small - 1.96 * se_small, p_small + 1.96 * se_small)

# Wilson CI via prop.test (we only want conf.int, ignore the test output)
ci_wilson2 <- prop.test(x = 2, n = 50, correct = FALSE)$conf.int

round(rbind(Wald = ci_wald2, Wilson = as.numeric(ci_wilson2)), 4)
#>          [,1]   [,2]
#> Wald   -0.0143 0.0943
#> Wilson  0.0110 0.1353
```

The Wald interval extends to -0.014, a nonsense lower bound for a proportion. The Wilson interval starts at 0.011, stays inside [0, 1], and shifts the centre upward a touch to reflect the pull toward 0.5. When your observed count is small or your proportion is near the boundary, that matters. For proportions near 0.5 in large samples, the two intervals agree to three decimal places.

[NOTE]
**prop.test() returns a Wilson score interval; binom.test() returns a Clopper-Pearson exact interval.** Neither gives you Wald by default. Compute Wald by hand if you need it for a textbook calculation, and know that Wilson is the more defensible choice in practice.

**Try it:** A survey shows 30 out of 50 respondents prefer option A. Compute the Wald 95% interval for `p_hat = 0.6` and compare it to the Wilson interval from `prop.test()`.

```r title="Your turn: Wald vs Wilson at n = 50"
ex_p  <- 30 / 50
ex_n  <- 50

ex_wald   <- NULL  # your code here (two numbers)
ex_wilson <- NULL  # your code here (two numbers)

round(rbind(Wald = ex_wald, Wilson = ex_wilson), 4)
#> Expected: Wald around (0.46, 0.74), Wilson around (0.46, 0.72)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Wald vs Wilson solution"
ex_se     <- sqrt(ex_p * (1 - ex_p) / ex_n)
ex_wald   <- c(ex_p - 1.96 * ex_se, ex_p + 1.96 * ex_se)
ex_wilson <- as.numeric(prop.test(x = 30, n = 50, correct = FALSE)$conf.int)

round(rbind(Wald = ex_wald, Wilson = ex_wilson), 4)
#>          [,1]   [,2]
#> Wald   0.4642 0.7358
#> Wilson 0.4629 0.7226
```

**Explanation:** At `p_hat = 0.6` and `n = 50` the intervals nearly agree. Wilson's upper bound sits slightly lower because the score formulation leans in toward 0.5. For most real reporting, Wilson is the safer pick.

</details>

## How big is the effect? Cohen's h

A p-value answers "could this gap be chance?" but says nothing about "is the gap big enough to care about?" Cohen's `h` fills that second slot. It is an effect-size measure for proportions based on the arcsine-square-root transform, which stabilises the variance across the 0-to-1 range.

The formula is:

$$h = 2 \arcsin(\sqrt{\hat{p}}) - 2 \arcsin(\sqrt{p_0})$$

Cohen's benchmark thresholds are 0.2 (small), 0.5 (medium), and 0.8 (large). Because the transform stretches near the boundaries, `h` does a much better job than the raw difference `p_hat - p0` when either proportion is close to 0 or 1.

```r title="Cohen's h helper and interpretation"
cohens_h <- function(p_hat, p0) {
  2 * asin(sqrt(p_hat)) - 2 * asin(sqrt(p0))
}

h_val <- cohens_h(p_hat = p_hat, p0 = p0)
round(h_val, 3)
#> [1] 0.063

# Quick label
size_label <- cut(abs(h_val),
                  breaks = c(-Inf, 0.2, 0.5, 0.8, Inf),
                  labels = c("negligible", "small", "medium", "large"))
size_label
#> [1] negligible
#> Levels: negligible small medium large
```

The effect is 0.063, well below the 0.2 "small" threshold. Read this as: even if the true click rate really did move from 35% to 38%, that shift is tiny by the standards of this scale. The non-significant p-value from earlier now has a companion story: there is very little signal to find, and the sample of 400 did not find it.

[KEY INSIGHT]
**Report both significance and effect size.** A tiny effect can clear p < 0.05 in a huge sample, and a meaningful effect can miss p < 0.05 in a tiny sample. Cohen's `h` decouples "is there a signal?" from "is the signal worth acting on?"

**Try it:** Compute Cohen's `h` for two scenarios against a null of 0.50: `70/100` and `55/100`. Compare the sizes.

```r title="Your turn: Cohen's h at two effect magnitudes"
# Scenario A: p_hat = 0.70 vs p0 = 0.50
# Scenario B: p_hat = 0.55 vs p0 = 0.50

ex_h1 <- NULL  # your code here
ex_h2 <- NULL  # your code here

round(c(big = ex_h1, small = ex_h2), 3)
#> Expected: big around 0.41, small around 0.10
```

<details>
<summary>Click to reveal solution</summary>

```r title="Cohen's h two-scenario solution"
ex_h1 <- cohens_h(p_hat = 0.70, p0 = 0.50)
ex_h2 <- cohens_h(p_hat = 0.55, p0 = 0.50)

round(c(big = ex_h1, small = ex_h2), 3)
#>   big small 
#> 0.411 0.100
```

**Explanation:** A shift from 0.50 to 0.70 gives `h = 0.41` (small-to-medium). A shift from 0.50 to 0.55 gives `h = 0.10`, half the small threshold. Same sample size, very different real-world importance.

</details>

## How many observations do you need? Power and sample size

Planning a proportion study without thinking about power is how underpowered research gets published. Given a target effect size you care about, a significance level (usually 0.05), and a desired power (usually 0.80), you can solve for the sample size needed. The `pwr` package makes this one function call.

The question comes in two flavours. Prospective: "how many observations do I need to have an 80% chance of detecting `h = 0.2` at alpha = 0.05?" Retrospective: "given my `n` and observed `h`, what power did I actually have?" Both use `pwr::pwr.p.test`.

```r title="Sample size for a small effect at 80% power"
library(pwr)

n_needed <- pwr.p.test(h = 0.20, power = 0.80,
                       sig.level = 0.05,
                       alternative = "two.sided")
n_needed
#> 
#>      proportion power calculation for binomial distribution (arcsine transformation) 
#> 
#>               h = 0.2
#>               n = 196.2215
#>       sig.level = 0.05
#>           power = 0.8
#>     alternative = two.sided
```

You need about 197 observations to have 80% power to detect a "small" effect at the 5% level. That is the minimum sample size for a well-powered test, not a suggestion. If your true effect is smaller than `h = 0.2`, you will need far more. If it is larger, you can get away with fewer.

```r title="Achieved power for the click-through example"
power_achieved <- pwr.p.test(h = h_val, n = n,
                             sig.level = 0.05,
                             alternative = "two.sided")
round(power_achieved$power, 3)
#> [1] 0.242
```

Our study had roughly 24% power. That is painfully low: even if a true 3-point lift existed, we had only a one-in-four chance of catching it. This is why the non-significant p-value in the first section is not evidence of no effect. The sample was too small to rule one out.

[WARNING]
**An underpowered non-significant result is not evidence for the null.** A study with 24% power fails to reject H0 three-quarters of the time even when the alternative is true. Report power whenever you publish a null result so readers can tell "no effect" apart from "couldn't see one."

**Try it:** Find the sample size you would need to detect a very small effect of `h = 0.10` at 80% power and alpha = 0.05.

```r title="Your turn: sample size for a tiny effect"
ex_n_needed <- NULL  # your code here

ex_n_needed$n
#> Expected: roughly 785
```

<details>
<summary>Click to reveal solution</summary>

```r title="Sample size for h = 0.10 solution"
ex_n_needed <- pwr.p.test(h = 0.10, power = 0.80,
                          sig.level = 0.05,
                          alternative = "two.sided")
round(ex_n_needed$n)
#> [1] 785
```

**Explanation:** Halving the effect size quadruples the required sample. `h = 0.10` needs about 785 observations for 80% power, versus 197 for `h = 0.20`. Small effects are expensive to detect.

</details>

## Practice Exercises

Three capstone problems that pull together everything above. Work through them in order.

### Exercise 1: Website redesign bounce rate

Before a redesign, your site's bounce rate was 55%. After the redesign, 255 out of 500 new visitors bounced. Run a two-sided z-test against `p0 = 0.55`, report the Wilson CI, and compute Cohen's `h`. Did the redesign change bounce behaviour?

```r title="Exercise 1 starter"
# Hint: p_hat = 255/500 = 0.51
# Run prop.test(correct = FALSE), extract statistic and conf.int,
# then use cohens_h() from earlier.

my_ab_x  <- 255
my_ab_n  <- 500
my_ab_p0 <- 0.55

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
my_ab_res <- prop.test(x = my_ab_x, n = my_ab_n,
                       p = my_ab_p0, correct = FALSE)
my_ab_h   <- cohens_h(p_hat = my_ab_x / my_ab_n, p0 = my_ab_p0)

list(z_squared = as.numeric(my_ab_res$statistic),
     p_value   = my_ab_res$p.value,
     wilson_ci = as.numeric(my_ab_res$conf.int),
     cohens_h  = my_ab_h)
#> $z_squared
#> [1] 3.232
#> $p_value
#> [1] 0.0722
#> $wilson_ci
#> [1] 0.4668 0.5530
#> $cohens_h
#> [1] -0.0803
```

**Explanation:** `z^2 = 3.23` gives `|z| = 1.80`, two-sided p = 0.07. Not quite significant at 5%. The Wilson CI (0.47, 0.55) covers the null of 0.55 at its upper edge. Cohen's `h` is -0.08, well below "small". The redesign produced a tiny, non-significant downshift.

</details>

### Exercise 2: Conversion-rate benchmark and sample-size planning

Your new landing page converted 200 of 500 visitors. Management expects conversion to be 45%. Run both the two-sided test and the one-sided "less than" test against `p0 = 0.45`. Then compute the sample size needed to reliably detect a small effect of `h = 0.10` at 80% power.

```r title="Exercise 2 starter"
# Hint: prop.test() with alternative = "less" for the one-sided test,
# and pwr.p.test() for the sample size.

my_conv_x  <- 200
my_conv_n  <- 500
my_conv_p0 <- 0.45

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
res_two <- prop.test(x = my_conv_x, n = my_conv_n,
                     p = my_conv_p0, correct = FALSE)
res_one <- prop.test(x = my_conv_x, n = my_conv_n,
                     p = my_conv_p0,
                     alternative = "less", correct = FALSE)

n_for_small <- pwr.p.test(h = 0.10, power = 0.80,
                          sig.level = 0.05,
                          alternative = "two.sided")

list(p_two_sided = res_two$p.value,
     p_one_less  = res_one$p.value,
     h_observed  = cohens_h(my_conv_x / my_conv_n, my_conv_p0),
     n_for_h_0.10 = round(n_for_small$n))
#> $p_two_sided
#> [1] 0.0253
#> $p_one_less
#> [1] 0.0126
#> $h_observed
#> [1] -0.1012
#> $n_for_h_0.10
#> [1] 785
```

**Explanation:** Two-sided p = 0.025 rejects the 45% claim at 5%. The one-sided "less" test has half that p-value at 0.013. The observed effect `h = -0.10` is small. To plan a future study to catch effects this small with 80% power, you would need roughly 785 observations.

</details>

### Exercise 3: When the z-test does not apply

A call-centre audit finds 3 problem calls in a sample of 30 against a target rate of `p0 = 0.10`. Check the count-rule assumption. If it fails, explain which test you should run instead and why.

```r title="Exercise 3 starter"
my_border_x  <- 3
my_border_n  <- 30
my_border_p0 <- 0.10

# Use check_assumptions() from earlier.
# Then write a one-line comment recommending the right test.

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
my_border_check <- check_assumptions(n = my_border_n, p0 = my_border_p0)
my_border_check
#> $pass
#> [1] FALSE
#> $n_p0
#> [1] 3
#> $n_1_minus_p0
#> [1] 27

# n*p0 = 3, well below the 10 threshold. Use binom.test():
binom.test(x = my_border_x, n = my_border_n, p = my_border_p0)$p.value
#> [1] 0.6474
```

**Explanation:** Only 3 expected successes under the null means the binomial distribution is far from Normal. The z-test p-value would be biased. `binom.test()` evaluates the exact binomial p-value (0.65 here), so no information is thrown away and the Type-I error rate is what it promises.

</details>

## Complete Example: Candy factory quality control

A candy factory claims that 95% of bars pass the weight-tolerance check. In a random sample of 240 bars, 216 pass (90%). Does the observed pass rate differ from the 95% claim? Walk through all six steps end-to-end.

```r title="Candy QA: assumption check, z-test, CI, effect size, power"
qa_x  <- 216
qa_n  <- 240
qa_p0 <- 0.95

# 1. Assumption check
qa_assume <- check_assumptions(n = qa_n, p0 = qa_p0)

# 2. Manual z-test
qa_p_hat <- qa_x / qa_n
qa_se0   <- sqrt(qa_p0 * (1 - qa_p0) / qa_n)
qa_z     <- (qa_p_hat - qa_p0) / qa_se0
qa_pval  <- 2 * pnorm(-abs(qa_z))

# 3. prop.test for Wilson CI
qa_res <- prop.test(x = qa_x, n = qa_n, p = qa_p0, correct = FALSE)

# 4. Cohen's h and 5. achieved power
qa_h     <- cohens_h(qa_p_hat, qa_p0)
qa_power <- pwr.p.test(h = qa_h, n = qa_n,
                       sig.level = 0.05,
                       alternative = "two.sided")

list(
  assumptions_pass = qa_assume$pass,
  p_hat            = qa_p_hat,
  z                = round(qa_z, 3),
  p_value          = signif(qa_pval, 3),
  wilson_ci        = round(as.numeric(qa_res$conf.int), 4),
  cohens_h         = round(qa_h, 3),
  achieved_power   = round(qa_power$power, 3)
)
#> $assumptions_pass
#> [1] TRUE
#> $p_hat
#> [1] 0.9
#> $z
#> [1] -3.553
#> $p_value
#> [1] 0.00038
#> $wilson_ci
#> [1] 0.8547 0.9325
#> $cohens_h
#> [1] -0.192
#> $achieved_power
#> [1] 0.967
```

The assumptions pass (`n*p0 = 228`, `n*(1-p0) = 12`). The z-statistic of -3.55 yields p = 0.00038, a decisive rejection of the 95% claim. The Wilson 95% interval runs from 85.5% to 93.3%, entirely below the claimed 95%. Cohen's `h` is -0.19, just under the "small" threshold, so the effect is small but real. Achieved power was 97%, which means this study had more than enough juice to spot a gap of this size. Bottom line for the factory floor: the true pass rate is statistically and practically below 95%, and the process should be investigated.

## Summary

| Step | Code / formula | What it gives you | Typical pitfall |
|---|---|---|---|
| 1. Check assumptions | `check_assumptions(n, p0)` | Can you trust the Normal approximation? | Forgetting independence beyond the count rule |
| 2. Compute z | `(p_hat - p0) / sqrt(p0*(1-p0)/n)` | Standardised distance from the null | Using `p_hat` in the SE instead of `p0` |
| 3. Two-sided p-value | `2 * pnorm(-abs(z))` | Evidence against H0 | Running one-sided only because two-sided was not significant |
| 4. Confidence interval | `prop.test(..., correct=FALSE)$conf.int` | Wilson score interval | Defaulting to Wald near 0 or 1 |
| 5. Effect size | `cohens_h(p_hat, p0)` | Practical importance of the gap | Reporting p without `h` |
| 6. Power / sample size | `pwr.p.test(h, n, sig.level, power)` | Study sensitivity | Interpreting a non-significant underpowered result as "no effect" |

## References

1. Agresti, A. (2013). *Categorical Data Analysis*, 3rd Edition. Wiley. Chapter 1: Distributions and Inference for Categorical Data. [Publisher link](https://www.wiley.com/en-us/Categorical+Data+Analysis%2C+3rd+Edition-p-9780470463635)
2. Wilson, E. B. (1927). Probable inference, the law of succession, and statistical inference. *Journal of the American Statistical Association*, 22(158), 209-212. [JSTOR](https://www.jstor.org/stable/2276774)
3. Cohen, J. (1988). *Statistical Power Analysis for the Behavioral Sciences*, 2nd Edition. Routledge. Chapter 6: Differences Between Proportions.
4. R Core Team. `prop.test()` reference. [CRAN documentation](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/prop.test.html)
5. Champely, S. `pwr` package: Basic Functions for Power Analysis. [CRAN](https://cran.r-project.org/package=pwr)
6. distributions3 package vignette, "One sample Z-tests for a proportion". [CRAN](https://cran.r-project.org/web/packages/distributions3/vignettes/one-sample-z-test-for-proportion.html)
7. STHDA. "One-Proportion Z-Test in R". [Link](https://www.sthda.com/english/wiki/one-proportion-z-test-in-r)
8. Carter, D. J. *R for Statistics in EPH*, Section 4.2: Z-test for proportions. [Bookdown](https://bookdown.org/danieljcarter/r4steph/z-test-for-proportions.html)

## Continue Learning

- [Proportion Tests in R: prop.test() and binom.test()](Proportion-Tests-in-R.html). The parent overview of one- and two-sample proportion tests and when to use each tool.
- [Exact Binomial Test in R](Exact-Binomial-Test-in-R.html). What to reach for when the large-sample count rule fails.
- [Effect Size in R](Effect-Size-in-R.html). Cohen's `h` in context with `d`, `r`, and other effect-size measures across tests.
