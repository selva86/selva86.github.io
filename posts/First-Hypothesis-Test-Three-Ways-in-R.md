---
title: "Your First Hypothesis Test in R: Three Ways"
slug: "First-Hypothesis-Test-Three-Ways-in-R"
description: "Learn hypothesis testing in R by running your first t-test three ways: by simulation, by hand, and with t.test(), each built up from scratch for beginners."
keywords: "hypothesis testing in R, t-test in R, t.test function, p-value, null hypothesis, two-sample t-test, permutation test in R, statistical significance"
mathjax: true
webr: true
date: "2026-07-26"
curriculum_id: "ST2-6.2"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "First Hypothesis Test"
sidebar_order: 160
auto_link_terms: "hypothesis test|hypothesis testing|hypothesis testing in R|t-test|t-test in R|two-sample t-test|p-value|null hypothesis|alternative hypothesis|permutation test|statistical significance|t.test()"
auto_link_case_sensitive: false
difficulty: "Beginner"
---

<p class="lead">A hypothesis test is a simple tool for deciding whether a pattern in your data is real or just luck. In this guide you will run your very first test in R three ways, by simulation, by hand, and with a single call to t.test(), and watch all three land on the same answer.</p>

Most tutorials hand you `t.test()` and move on. That teaches you the button, not the idea. Here you will build the idea first, so the button finally makes sense. We use only base R (no extra packages needed for the core work), and the built-in `mtcars` dataset that ships with every R install.

## What question can a hypothesis test answer?

Every hypothesis test starts with a plain question about two numbers that look different. Ours: do cars with a manual gearbox get better gas mileage than cars with an automatic one? The `mtcars` dataset records the miles-per-gallon (`mpg`) and transmission type (`am`, where 0 means automatic and 1 means manual) for 32 cars, so let us just look at the two group averages.

```r title="Group averages by transmission type"
# mtcars is built in. am = 0 is automatic, am = 1 is manual.
auto <- mtcars$mpg[mtcars$am == 0]     # mpg for the 19 automatic cars
manual <- mtcars$mpg[mtcars$am == 1]   # mpg for the 13 manual cars

c(automatic_mean = mean(auto), manual_mean = mean(manual),
  difference = mean(manual) - mean(auto))
#> automatic_mean    manual_mean     difference
#>      17.147368      24.392308       7.244939
```

The walk-through: the first two lines split the 32 cars into two piles by transmission and grab their mileage. The last line prints both averages and their gap. Manual cars average about 24.4 mpg, automatics about 17.1 mpg, a difference of roughly 7.2 mpg.

So the interpretation looks obvious: manual wins by a mile. But hold on. We only measured 19 automatics and 13 manuals. If you split any 32 cars into two random piles, the pile averages would differ a bit just by chance. A picture makes that wobble easier to feel.

```r title="Boxplot of mileage by transmission"
boxplot(mpg ~ am, data = mtcars,
        names = c("Automatic", "Manual"),
        ylab = "Miles per gallon (mpg)",
        col = c("#e5ddf5", "#b9a7e8"))
```

Each box shows the middle half of the cars in that group, and the boxes clearly sit at different heights. But the boxes also overlap, and both groups are small. That overlap is the whole problem: is a 7.2 mpg gap big enough to trust, or is it the kind of gap random splitting could cook up on its own?

[KEY INSIGHT]
**A hypothesis test measures luck.** It answers one question: if there were truly no difference, how often would plain chance still hand you a gap as big as the one you see? A rare gap is believable evidence; a common one is not.

**Try it:** Before we go further, get comfortable pulling a group difference out of `mtcars`. Compute how much more (or less) horsepower (`hp`) manual cars have on average compared with automatics.

```r title="Your turn: the horsepower gap"
# Target answer: -33.417  (manual cars average about 33 hp LESS)
ex_auto_hp <- mtcars$hp[mtcars$am == 0]
ex_manual_hp <- mtcars$hp[mtcars$am == 1]

# Replace the 0 with: mean(ex_manual_hp) - mean(ex_auto_hp)
ex_hp_gap <- 0
ex_hp_gap
```

<details>
<summary>Click to reveal solution</summary>

```r title="Horsepower gap solution"
ex_auto_hp <- mtcars$hp[mtcars$am == 0]
ex_manual_hp <- mtcars$hp[mtcars$am == 1]
mean(ex_manual_hp) - mean(ex_auto_hp)
#> [1] -33.417
```

**Explanation:** The same split-and-average recipe works for any column. The negative sign just means manual cars have less horsepower on average, not more.

</details>

## What is a hypothesis test, really?

Think of a courtroom. The defendant is presumed innocent, and the prosecution has to show evidence strong enough to overturn that presumption. A hypothesis test works exactly the same way, with two competing claims.

The starting assumption is called the **null hypothesis**: there is no real difference, and any gap you see is just luck. The rival claim is the **alternative hypothesis**: the difference is real. You assume the null is true until the data makes it look ridiculous, then you reject it.

| Claim | Name | What it says here |
|---|---|---|
| Presumed true | Null hypothesis | Transmission does not affect mpg; the 7.2 gap is chance. |
| What you suspect | Alternative hypothesis | Transmission does affect mpg; the gap is real. |

To weigh the evidence you need a single number that captures "how far apart are these groups". That number is called a **test statistic**. And to judge whether that number is surprising, you need one more number, the most important one in the whole test: the **p-value**.

The p-value answers the courtroom question directly. Assuming the null hypothesis is true (no real difference), how often would pure chance produce a gap at least as big as the one you actually saw? A small p-value means "chance almost never does this", which is strong evidence against the null. A large p-value means "chance does this all the time", which is no evidence at all.

![The five steps of a hypothesis test, from asking a question to reaching a decision.](screenshots/First-Hypothesis-Test-Three-Ways-in-R-workflow.webp)
*Figure 1: Every hypothesis test follows the same five steps, from question to decision.*

Researchers draw the line at a threshold called the **significance level**, written as the Greek letter alpha, and set by convention to 0.05. If the p-value falls below 0.05, the result is called "statistically significant" and you reject the null. That 0.05 is a tradition, not a law of nature, but it is the default almost everyone starts with.

Here is the fun part. The p-value is one number, but there are several honest ways to compute it, and they agree. We will find it three ways: by shuffling the data, by plugging into a formula, and by calling one R function.

![The same question feeds three methods that all arrive at one p-value.](screenshots/First-Hypothesis-Test-Three-Ways-in-R-three-ways.webp)
*Figure 2: The same question runs through three methods and lands on one p-value.*

**Try it:** The p-value is really just a proportion: the share of "chance" results at least as extreme as yours. Practice that idea on a tiny made-up set of gaps. If ten random gaps came out as below, what share of them are at least 3 units away from zero (in either direction)?

```r title="Your turn: count the extreme values"
# ex_gaps holds 10 pretend gaps you might see purely by chance.
# Target answer: 0.3
ex_gaps <- c(2, -1, 0, 3, -2, 1, 4, -3, 0, 2)

# Replace the 0 with: mean(abs(ex_gaps) >= 3)
ex_share <- 0
ex_share
```

<details>
<summary>Click to reveal solution</summary>

```r title="Counting extreme values solution"
ex_gaps <- c(2, -1, 0, 3, -2, 1, 4, -3, 0, 2)
mean(abs(ex_gaps) >= 3)
#> [1] 0.3
```

**Explanation:** `abs(ex_gaps) >= 3` gives TRUE/FALSE for each value, and `mean()` of TRUE/FALSE returns the proportion of TRUEs. Three of the ten values (3, 4, and -3) are at least 3 away from zero, so the share is 0.3. That proportion is exactly what a p-value is.

</details>

## Way 1: Can you test it by shuffling the data?

Here is the most honest way to compute a p-value, and it needs no formulas at all. If transmission truly did not matter, then the "automatic" and "manual" labels would be meaningless stickers. We could peel them off, shuffle them, stick them back on at random, and the group gap should not change much. Let us make that idea concrete.

First, pin down the gap we are trying to explain.

```r title="The gap we actually observed"
observed_diff <- mean(manual) - mean(auto)
observed_diff
#> [1] 7.244939
```

Now shuffle the labels once. We take everyone's mileage, deal out the transmission labels at random, and recompute the gap. If the labels carry no real information, this shuffled gap should be small.

```r title="Shuffle the labels once"
set.seed(1)
all_mpg <- mtcars$mpg                   # every car's mileage, labels aside
shuffled_labels <- sample(mtcars$am)    # deal the am labels out at random

# The gap when the labels are meaningless:
mean(all_mpg[shuffled_labels == 1]) - mean(all_mpg[shuffled_labels == 0])
#> [1] -2.808502
```

One shuffle gave a gap of about -2.8 mpg, much smaller than our real 7.2 and even pointing the other way. That is one draw from a world where transmission does not matter. To see the full range of what chance can do, we repeat the shuffle thousands of times and collect every gap.

```r title="Repeat the shuffle 10,000 times"
set.seed(42)
n_reps <- 10000
null_diffs <- replicate(n_reps, {
  lab <- sample(mtcars$am)
  mean(all_mpg[lab == 1]) - mean(all_mpg[lab == 0])
})

head(null_diffs, 5)   # the first five "chance" gaps
#> [1] -1.12429150 -0.02307692 -1.74615385  1.44089069 -6.09919028
```

`replicate()` just runs that shuffle-and-measure step 10,000 times and stores each result. The vector `null_diffs` now holds 10,000 gaps from a world where transmission is irrelevant. This collection has a name: the **null distribution**, the picture of what luck alone produces. Let us plot it and mark where our real gap falls.

```r title="Draw the null distribution"
hist(null_diffs, breaks = 40, col = "#e5ddf5", border = "white",
     main = "Gaps we would see if transmission did not matter",
     xlab = "Manual mean minus automatic mean (shuffled)")
abline(v = observed_diff, col = "#6b46c1", lwd = 3)
abline(v = -observed_diff, col = "#6b46c1", lwd = 3, lty = 2)
```

The histogram piles up around zero, because most random label shuffles produce a small gap. The solid line marks our real gap of 7.2, and it sits way out in the empty tail where almost no shuffle reached. That visual distance is your evidence. Now turn it into the p-value by counting how many shuffles were at least as extreme as reality.

```r title="The permutation p-value"
# How often did pure chance produce a gap as big as ours (either direction)?
p_perm <- (sum(abs(null_diffs) >= abs(observed_diff)) + 1) / (n_reps + 1)
p_perm
#> [1] 0.00039996
```

We count the shuffles whose gap was at least as far from zero as 7.2 (in either direction), then divide by the number of shuffles. The extra `+ 1` on top and bottom counts our real result as one more possible arrangement, which keeps the p-value from ever hitting an impossible zero. The answer is about 0.0004: out of 10,000 label shuffles, only a handful matched our gap. This test, built by shuffling, is called a **permutation test**.

[KEY INSIGHT]
**The p-value is literally how often chance beats your data.** You just computed one by counting, with no bell curves or formulas. Every other method in this article is a shortcut that estimates this same proportion.

**Try it:** Our count looked at gaps as big as ours in either direction, which is a two-sided test. Make it one-sided instead: count only the shuffles where manual beat automatic by at least as much as we observed.

```r title="Your turn: a one-sided p-value"
# Count only gaps where manual pulls ahead by at least the real amount.
# Target answer: 0.00029997
# Replace the 0 with: (sum(null_diffs >= observed_diff) + 1) / (n_reps + 1)
ex_p_one_sided <- 0
ex_p_one_sided
```

<details>
<summary>Click to reveal solution</summary>

```r title="One-sided p-value solution"
(sum(null_diffs >= observed_diff) + 1) / (n_reps + 1)
#> [1] 0.00029997
```

**Explanation:** Dropping `abs()` counts only shuffles where manual came out ahead, not shuffles that swung the other way. A one-sided p-value is smaller because it looks at just one tail of the null distribution.

</details>

## Way 2: Can you test it with a formula?

Shuffling 10,000 times is intuitive, but a century ago there were no computers to do it. Statisticians found a formula that estimates the same p-value in one shot. The formula produces a test statistic called **t**, and the idea behind it is short: t is signal divided by noise.

The signal is the gap between the group means. The noise is a "typical" gap size you would expect from chance, called the **standard error**. Divide one by the other and you get a number that says how many noise-widths apart the groups are. A big t means the signal is much larger than the noise.

If you want the exact formula, here it is. If formulas are not your thing, skip to the code below, it does the same arithmetic.

$$t = \frac{\bar{x}_1 - \bar{x}_2}{s_p \sqrt{\dfrac{1}{n_1} + \dfrac{1}{n_2}}}$$

Where:

- \\( \bar{x}_1 - \bar{x}_2 \\) is the gap between the two group means (the signal)
- \\( n_1 \\) and \\( n_2 \\) are the two group sizes
- \\( s_p \\) is the pooled standard deviation, a blended measure of spread across both groups (the noise)

Let us compute t by hand so nothing is hidden. Each line matches a piece of the formula.

```r title="Build the t-statistic by hand"
n1 <- length(auto)      # 19 automatic cars
n2 <- length(manual)    # 13 manual cars

# Pooled variance blends the spread of both groups
pooled_var <- ((n1 - 1) * var(auto) + (n2 - 1) * var(manual)) / (n1 + n2 - 2)

# Standard error: the size of a "typical" chance gap (the noise)
se <- sqrt(pooled_var * (1 / n1 + 1 / n2))

t_stat <- (mean(manual) - mean(auto)) / se
t_stat
#> [1] 4.106127
```

Reading it back: `pooled_var` combines how spread out each group is, `se` turns that spread into the size of a typical chance gap, and the final line divides our real 7.2 gap by that noise. The result, t is about 4.1, means our signal is roughly four noise-widths wide. That is large. Now we convert t into a p-value.

```r title="Turn the t-statistic into a p-value"
df <- n1 + n2 - 2                       # degrees of freedom = 30
p_hand <- 2 * pt(-abs(t_stat), df = df) # two-sided p-value

c(t = t_stat, df = df, p_value = p_hand)
#>            t           df      p_value
#> 4.106127e+00 3.000000e+01 2.850207e-04
```

The function `pt()` reads off, from the theoretical t-distribution, how much of the tail sits beyond our t value. We multiply by 2 because the test is two-sided (a surprise in either direction counts). The `df` piece, short for **degrees of freedom**, is just a size knob for that curve, equal to the total number of cars minus 2. The p-value comes out around 0.000285, remarkably close to the 0.0004 our shuffling produced.

[NOTE]
**The formula assumes the data is roughly bell-shaped; the shuffle version does not.** That is why the two p-values are close but not identical. When your data is messy or your groups are tiny, the shuffle-based permutation test is the more trustworthy of the two.

**Try it:** Reuse the exact same recipe on a different column. Compute the by-hand t-statistic comparing horsepower (`hp`) between automatic and manual cars.

```r title="Your turn: a t-statistic for horsepower"
# Target answer: about -1.373318
ex_ha <- mtcars$hp[mtcars$am == 0]
ex_hm <- mtcars$hp[mtcars$am == 1]
ex_n1 <- length(ex_ha); ex_n2 <- length(ex_hm)
ex_pool <- ((ex_n1 - 1) * var(ex_ha) + (ex_n2 - 1) * var(ex_hm)) / (ex_n1 + ex_n2 - 2)

# Replace the 0 with:
# (mean(ex_hm) - mean(ex_ha)) / sqrt(ex_pool * (1/ex_n1 + 1/ex_n2))
ex_t_hp <- 0
ex_t_hp
```

<details>
<summary>Click to reveal solution</summary>

```r title="Horsepower t-statistic solution"
ex_ha <- mtcars$hp[mtcars$am == 0]
ex_hm <- mtcars$hp[mtcars$am == 1]
ex_n1 <- length(ex_ha); ex_n2 <- length(ex_hm)
ex_pool <- ((ex_n1 - 1) * var(ex_ha) + (ex_n2 - 1) * var(ex_hm)) / (ex_n1 + ex_n2 - 2)
(mean(ex_hm) - mean(ex_ha)) / sqrt(ex_pool * (1 / ex_n1 + 1 / ex_n2))
#> [1] -1.373318
```

**Explanation:** A t of about -1.4 is small, so the horsepower gap is well within what chance could produce. Not every difference survives a hypothesis test, and that is exactly the point of running one.

</details>

## Way 3: Can one line of R do it all?

You now understand the machinery, so you have earned the shortcut. R's built-in `t.test()` does every step from the last two sections in a single call. Feed it a formula, `mpg ~ am`, which reads as "mpg broken down by am".

```r title="Run the two-sample t-test"
t.test(mpg ~ am, data = mtcars, var.equal = TRUE)
#> 	Two Sample t-test
#>
#> data:  mpg by am
#> t = -4.1061, df = 30, p-value = 0.000285
#> alternative hypothesis: true difference in means between group 0 and group 1 is not equal to 0
#> 95 percent confidence interval:
#>  -10.84837  -3.64151
#> sample estimates:
#> mean in group 0 mean in group 1
#>        17.14737        24.39231
```

Read the output top to bottom. The `t = -4.1061` and `df = 30` match our by-hand work exactly, and the `p-value = 0.000285` matches too. The two group means at the bottom are our familiar 17.1 and 24.4. The `95 percent confidence interval` line gives the plausible range for the true gap in mileage; we set it aside here and pick it up in a companion tutorial linked at the end. One line reproduced everything.

One thing to notice: our t was `+4.1061` but R shows `-4.1061`. The sign only reflects which group R subtracts first. It puts group 0 (automatic) before group 1 (manual), so its gap is negative. The size of t and the p-value are identical, and those are what matter. We passed `var.equal = TRUE` so this matches our pooled by-hand formula exactly; more on R's default in a moment.

Often you do not want the whole printout, just one number to use later. Every piece is available by name.

```r title="Pull out single numbers from the result"
result <- t.test(mpg ~ am, data = mtcars, var.equal = TRUE)

result$p.value    # just the p-value
#> [1] 0.0002850207

result$statistic  # just the t-statistic
#>         t
#> -4.106127
```

[TIP]
**The formula interface is your friend.** Writing t.test(mpg ~ am, data = mtcars) is cleaner than pulling out two vectors yourself, and the same `outcome ~ group` pattern powers many other R modeling functions you will meet later.

If you would rather have the results as a tidy little table (handy for stacking many tests into one data frame), the `broom` package reshapes the output for you.

```r title="Tidy the result into a data frame"
library(broom)
tidy(result)[, c("estimate", "statistic", "p.value", "conf.low", "conf.high")]
#> # A tibble: 1 × 5
#>   estimate statistic  p.value conf.low conf.high
#>      <dbl>     <dbl>    <dbl>    <dbl>     <dbl>
#> 1    -7.24     -4.11 0.000285    -10.8     -3.64
```

Now the promised payoff. Let us line up all three p-values side by side and confirm they tell the same story.

```r title="Do all three ways agree?"
c(simulation = p_perm, by_hand = p_hand, t_test = result$p.value)
#>   simulation      by_hand       t_test
#> 0.0003999600 0.0002850207 0.0002850207
```

All three sit around 0.0003, far below the 0.05 threshold. The shuffling and the formula and the one-liner are not three different tests, they are three routes to one conclusion. That is why you can trust `t.test()`: you have now seen what it is doing under the hood.

**Try it:** Put the one-liner to work on a fresh question. Do automatic and manual cars differ in weight (`wt`)? Run the test and read off just the p-value.

```r title="Your turn: test the weight difference"
# Target answer: 1.12544e-05  (a very small p-value)
# Replace NA with:
# t.test(wt ~ am, data = mtcars, var.equal = TRUE)$p.value
ex_wt_p <- NA
ex_wt_p
```

<details>
<summary>Click to reveal solution</summary>

```r title="Weight difference solution"
t.test(wt ~ am, data = mtcars, var.equal = TRUE)$p.value
#> [1] 1.12544e-05
```

**Explanation:** The p-value is about 0.00001, far below 0.05, so automatic and manual cars clearly differ in weight too. Chaining `$p.value` onto the call grabs the single number without printing the full report.

</details>

## How do you read and report the result?

You have a p-value of about 0.0003. The decision rule is mechanical: compare it to your significance level of 0.05. Since 0.0003 is smaller, you **reject the null hypothesis** and call the difference statistically significant. There is strong evidence that transmission type really is linked to mileage.

![A decision tree comparing the p-value to 0.05 to reject or keep the null.](screenshots/First-Hypothesis-Test-Three-Ways-in-R-decision.webp)
*Figure 3: Compare the p-value to 0.05 to reach a decision.*

Now the single most important warning in all of statistics, because almost everyone gets this wrong at first.

[WARNING]
**The p-value is not the probability that the null is true.** A p-value of 0.0003 does not mean "there is a 0.03% chance transmission does not matter". It means "IF transmission did not matter, a gap this big would show up only 0.03% of the time". It is a statement about the data assuming the null, never a probability about the null itself.

A p-value also says nothing about how big or important the effect is, only how surprising it is. With enough data, a tiny, meaningless difference can earn a tiny p-value. So always report the actual size of the gap alongside the p-value. A common size measure is **Cohen's d**, which expresses the gap in units of the data's own spread.

```r title="Measure the effect size with Cohen's d"
cohens_d <- (mean(manual) - mean(auto)) / sqrt(pooled_var)
cohens_d
#> [1] 1.477947
```

A rough reading guide: d near 0.2 is small, 0.5 is medium, and 0.8 is large. Our d of about 1.48 is very large, so the mileage gap is not just statistically significant, it is big enough to matter to a real car buyer. That is the difference between statistical significance and practical significance, and you should always check both.

One more honest detail. We used `var.equal = TRUE`, but R's default is a slightly safer version called Welch's test, which does not assume the two groups have equal spread. Here is what the default gives.

```r title="R's safer default: Welch's t-test"
t.test(mpg ~ am, data = mtcars)   # var.equal = FALSE is the default
#> 	Welch Two Sample t-test
#>
#> data:  mpg by am
#> t = -3.7671, df = 18.332, p-value = 0.001374
#> alternative hypothesis: true difference in means between group 0 and group 1 is not equal to 0
#> 95 percent confidence interval:
#>  -11.280194  -3.209684
#> sample estimates:
#> mean in group 0 mean in group 1
#>        17.14737        24.39231
```

[NOTE]
**Prefer the Welch test in real work.** Its p-value here (0.0014) is a touch larger, and the decision is unchanged, but Welch stays trustworthy even when the groups have different spread. Leave off `var.equal = TRUE` and you get it automatically. We only forced the pooled version so it would line up with the hand formula.

Two quick housekeeping notes before you go. First, choose **one-sided or two-sided** before you look at the data: use two-sided (the default) when a difference in either direction is interesting, and one-sided (`alternative = "less"` or `"greater"`) only when you genuinely care about one direction. Second, the t-test assumes the observations are independent and roughly bell-shaped; if your data is heavily skewed or full of outliers, reach for a rank-based test like the [Wilcoxon test](Wilcoxon-Mann-Whitney-and-Kruskal-Wallis-in-R.html) or lean on the permutation approach from Way 1.

**Try it:** You already know weight differs between groups (tiny p-value). But how big is that effect? Compute Cohen's d for weight (`wt`) by transmission.

```r title="Your turn: how big is the weight effect?"
# Target answer: about -1.892406  (a very large effect)
ex_wa <- mtcars$wt[mtcars$am == 0]
ex_wm <- mtcars$wt[mtcars$am == 1]
ex_pool_w <- ((length(ex_wa) - 1) * var(ex_wa) + (length(ex_wm) - 1) * var(ex_wm)) /
  (length(ex_wa) + length(ex_wm) - 2)

# Replace the 0 with: (mean(ex_wm) - mean(ex_wa)) / sqrt(ex_pool_w)
ex_d_wt <- 0
ex_d_wt
```

<details>
<summary>Click to reveal solution</summary>

```r title="Weight effect size solution"
ex_wa <- mtcars$wt[mtcars$am == 0]
ex_wm <- mtcars$wt[mtcars$am == 1]
ex_pool_w <- ((length(ex_wa) - 1) * var(ex_wa) + (length(ex_wm) - 1) * var(ex_wm)) /
  (length(ex_wa) + length(ex_wm) - 2)
(mean(ex_wm) - mean(ex_wa)) / sqrt(ex_pool_w)
#> [1] -1.892406
```

**Explanation:** A d of about -1.9 is enormous (manual cars are far lighter), which fits the near-zero p-value you found earlier. The negative sign just reflects the direction; the magnitude is what tells you the effect is huge.

</details>

## The whole test in one script

In practice you will not shuffle or hand-crank the formula every time. Once you trust `t.test()`, a complete, reportable hypothesis test is just a handful of lines: run the test, measure the effect size, and state the conclusion in plain words.

```r title="The whole test in one script"
auto_mpg <- mtcars$mpg[mtcars$am == 0]
manual_mpg <- mtcars$mpg[mtcars$am == 1]

# 1. Run the test
test <- t.test(mpg ~ am, data = mtcars, var.equal = TRUE)

# 2. Measure the effect size (Cohen's d)
pooled_sd <- sqrt(((length(auto_mpg) - 1) * var(auto_mpg) +
                   (length(manual_mpg) - 1) * var(manual_mpg)) /
                  (length(auto_mpg) + length(manual_mpg) - 2))
d <- (mean(manual_mpg) - mean(auto_mpg)) / pooled_sd

# 3. Report the answer in plain words
cat("Difference in mean mpg:", round(mean(manual_mpg) - mean(auto_mpg), 2), "\n")
cat("p-value:", signif(test$p.value, 3), "\n")
cat("Cohen's d:", round(d, 2), "\n")
if (test$p.value < 0.05) {
  cat("Decision: reject the null. The difference looks real.\n")
} else {
  cat("Decision: keep the null. Not enough evidence.\n")
}
#> Difference in mean mpg: 7.24
#> p-value: 0.000285
#> Cohen's d: 1.48
#> Decision: reject the null. The difference looks real.
```

That block is a template you can reuse for any two-group comparison: swap in your own outcome and grouping column, and it reports the gap and its p-value, then the effect size and a plain verdict.

## Practice Exercises

Work through these to lock in the ideas. Each builds on the tools above. Try to write the code before opening the solution.

### Exercise 1: A one-sample test

So far we compared two groups. `t.test()` can also compare one group against a fixed number. Test whether the average mileage of all 32 cars is different from 20 mpg.

```r title="Exercise 1: one-sample t-test"
# Is the average mpg of all 32 cars different from 20 mpg?
# Hint: t.test() takes a single vector and a mu = ... argument.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="One-sample t-test solution"
t.test(mtcars$mpg, mu = 20)
#> 	One Sample t-test
#>
#> data:  mtcars$mpg
#> t = 0.08506, df = 31, p-value = 0.9328
#> alternative hypothesis: true mean is not equal to 20
#> 95 percent confidence interval:
#>  17.91768 22.26357
#> sample estimates:
#> mean of x
#> 20.09062
```

**Explanation:** The p-value is 0.93, far above 0.05, so you keep the null. The average mpg (about 20.1) is not meaningfully different from 20. This is a result that fails to reject, which is just as valid an outcome as rejecting.

</details>

### Exercise 2: The same question, two ways

Do 4-cylinder cars get different mileage than 6-cylinder cars? Answer it twice, once with a permutation test and once with `t.test()`, and confirm the two p-values agree.

```r title="Exercise 2: compare 4 and 6 cylinders"
# Test 4-cylinder vs 6-cylinder mpg TWO ways and check they agree:
#   1. a permutation test (shuffle the cyl labels, set.seed(7), 10000 reps)
#   2. t.test(mpg ~ cyl, ...) on just the 4- and 6-cylinder cars
# Hint: subset first with mtcars[mtcars$cyl %in% c(4, 6), ]

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Four versus six cylinders solution"
four <- mtcars$mpg[mtcars$cyl == 4]
six <- mtcars$mpg[mtcars$cyl == 6]
obs2 <- mean(four) - mean(six)

# Way 1: permutation test on the 4- and 6-cylinder cars
cars46 <- mtcars[mtcars$cyl %in% c(4, 6), ]
set.seed(7)
nd2 <- replicate(10000, {
  lab <- sample(cars46$cyl)
  mean(cars46$mpg[lab == 4]) - mean(cars46$mpg[lab == 6])
})
(sum(abs(nd2) >= abs(obs2)) + 1) / (10000 + 1)
#> [1] 0.00139986

# Way 3: the one-liner
t.test(mpg ~ cyl, data = cars46, var.equal = TRUE)
#> 	Two Sample t-test
#>
#> data:  mpg by cyl
#> t = 3.8952, df = 16, p-value = 0.001287
#> alternative hypothesis: true difference in means between group 4 and group 6 is not equal to 0
#> 95 percent confidence interval:
#>   3.154286 10.687272
#> sample estimates:
#> mean in group 4 mean in group 6
#>        26.66364        19.74286
```

**Explanation:** Both routes land near 0.0013, comfortably below 0.05, so 4-cylinder cars really do get better mileage than 6-cylinder cars. Once again the shuffle and the formula agree.

</details>

### Exercise 3: One-sided test plus effect size

Combine three ideas. Run a one-sided test asking specifically whether manual cars beat automatics, compute Cohen's d for the same comparison, and write a one-sentence conclusion.

```r title="Exercise 3: one-sided test plus effect size"
# 1. Run a ONE-SIDED t.test: do manual cars beat automatic cars on mpg?
#    (add alternative = "less"; remember am 0 = automatic is subtracted first)
# 2. Compute Cohen's d for the same comparison.
# 3. Write a one-sentence plain-English conclusion.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="One-sided test and effect size solution"
# One-sided: level 0 (automatic) is first, so "less" tests automatic < manual
t.test(mpg ~ am, data = mtcars, var.equal = TRUE, alternative = "less")
#> 	Two Sample t-test
#>
#> data:  mpg by am
#> t = -4.1061, df = 30, p-value = 0.0001425
#> alternative hypothesis: true difference in means between group 0 and group 1 is less than 0
#> 95 percent confidence interval:
#>       -Inf -4.250255
#> sample estimates:
#> mean in group 0 mean in group 1
#>        17.14737        24.39231

# Effect size for the same comparison
(mean(manual) - mean(auto)) / sqrt(pooled_var)
#> [1] 1.477947
```

**Explanation:** The one-sided p-value (0.00014) is half the two-sided one because it only looks at one tail. With a p-value far below 0.05 and a very large effect size (d of about 1.5), you can conclude that manual cars get substantially better mileage than automatics in this dataset.

</details>

## Frequently Asked Questions

### What is the difference between a t-test and a hypothesis test?

A hypothesis test is the general procedure: state a null hypothesis, compute a p-value, then decide. A t-test is one specific hypothesis test, the one you use to compare means. There are many other tests (chi-square for counts, ANOVA for three or more groups) that follow the same procedure with a different test statistic.

### What does the p-value actually tell me?

It tells you how compatible your data is with the null hypothesis. A small p-value means your data would be very unusual if the null were true, which is evidence against the null. It does not tell you the probability that the null is true, nor how large the effect is.

### Should I use var.equal = TRUE or the default Welch test?

Use the default (Welch). It does not assume the two groups have equal spread, so it is safe in more situations, and the cost when spreads happen to be equal is negligible. We only set `var.equal = TRUE` in this tutorial so the one-liner would match the hand-computed formula exactly.

### What if my data is not normally distributed?

The t-test tolerates mild departures from normality, especially with larger samples. For heavily skewed data or small samples with outliers, use a permutation test (Way 1 in this article) or a rank-based test such as the Wilcoxon test, both of which avoid the bell-curve assumption.

### Is a small p-value the same as a big, important effect?

No. A p-value measures surprise, not size. With a large enough sample, a trivial difference can produce a tiny p-value. Always report an effect size, such as Cohen's d, next to the p-value so readers can judge whether the difference actually matters in practice.

## Summary

You learned what a hypothesis test really is and ran your first one three different ways, watching all three agree.

| Way | What it teaches | The R tool | When to reach for it |
|---|---|---|---|
| Simulation | What a p-value truly means | `sample()` and `replicate()` | Small or messy data; building intuition |
| By hand | The signal-over-noise formula | `var()`, `pt()` | Understanding what the function computes |
| One line | The fast, standard workflow | `t.test()` | Everyday analysis |

Key takeaways to carry forward:

- The **null hypothesis** assumes no real difference; a **p-value** measures how often chance alone would beat your data if the null were true.
- Reject the null when the p-value falls below your **significance level** (0.05 by convention).
- A p-value is not the probability the null is true, and it does not measure effect size, so always report a size measure like **Cohen's d** too.
- Prefer the Welch `t.test()` default in real work, and switch to a permutation or rank-based test when your data is far from bell-shaped.

## References

1. R Core Team. *An Introduction to R*, section on statistical models and tests. [Link](https://cran.r-project.org/doc/manuals/r-release/R-intro.html)
2. R Documentation. `t.test` function reference (the stats package). [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/t.test.html)
3. Wickham, H. and Grolemund, G. *R for Data Science*, 2nd Edition. O'Reilly (2023). [Link](https://r4ds.hadley.nz/)
4. Diez, D., Barr, C. and Cetinkaya-Rundel, M. *OpenIntro Statistics*, 4th Edition, chapter on inference and randomization tests. [Link](https://www.openintro.org/book/os/)
5. Ismay, C. and Kim, A. *Statistical Inference via Data Science (ModernDive)*, simulation-based inference. [Link](https://moderndive.com/)
6. Cohen, J. *Statistical Power Analysis for the Behavioral Sciences*, 2nd Edition. Routledge (1988).
7. broom package documentation, tidying model outputs. [Link](https://broom.tidymodels.org/)

## Continue Learning

- [Hypothesis Testing in R](Hypothesis-Testing-in-R.html): a wider tour of tests beyond the t-test, including chi-square and ANOVA, once you are comfortable with the basics here.
- [Confidence Intervals in R](Confidence-Intervals-in-R.html): the natural companion to the p-value, showing the plausible range for the true difference rather than a single yes-or-no verdict.
- [Wilcoxon, Mann-Whitney and Kruskal-Wallis in R](Wilcoxon-Mann-Whitney-and-Kruskal-Wallis-in-R.html): the tests to reach for when your data is skewed and the t-test's assumptions do not hold.
