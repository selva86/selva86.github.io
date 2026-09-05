---
title: "Effect size: Cohen's d and friends, explained"
slug: "Inference-Mini-6"
description: "Cohen's d turns a group difference into a size you can judge. Compute d, Hedges g, eta-squared, Cramer's V and r in R, and report size beside the p-value."
keywords: "effect size, Cohen's d, Cohen's d in R, Hedges g, eta squared, omega squared, Cramer's V, Pearson r effect size, practical significance, effect size interpretation"
mathjax: true
webr: true
date: "2026-09-06"
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
catalog_blurb: "How to say how large a difference is, not just that it exists."
---

=== step === cover
## Effect size: Cohen's d and friends, explained

Today let's learn how to measure how large a difference is, and how to report that size next to the test that found it.

A clinic ran a 12 week weight-loss trial with 3,000 people. A thousand of them stayed on standard care, a thousand went on diet A, and a thousand went on diet B. Everyone was weighed at week 12 and the clinic recorded the kilos each person had lost.

Standard care averaged 3.0 kg lost. Diet A averaged 3.5 kg and diet B averaged 8.0 kg. So diet A sits 0.5 kg ahead of standard care, and diet B sits 5.0 kg ahead.

The clinic then ran a t-test on each diet against standard care. Diet A came back at p = 0.0052 and diet B at p = 2.2e-145. Both sit under 0.05, so both comparisons are statistically significant.

And that is where the trouble starts. A patient sitting in that clinic next week has to pick one of the two diets. Losing 0.5 kg more than standard care and losing 5.0 kg more are not the same recommendation, and neither p-value separates them: both only say the gap is bigger than noise.

An effect size does separate them. It is a second number, computed from the same data as the test, that says how large the difference is on a scale you can judge.

Turning a gap in kilos into a size takes three steps.

::widget process-flow {"steps":[{"title":"Subtract the two group means","sub":"the gap in the units you measured, here kilos"},{"title":"Divide by the pooled standard deviation","sub":"how much people inside one arm differ from each other"},{"title":"Read it against the bands","sub":"small at 0.2, medium at 0.5, large at 0.8"}]}

We will put both comparisons through those three steps, and then work out what comes out the other end.

=== step === concept
## The diet trial: three arms, two comparisons

Let's build the trial data first, because every number from here on comes out of it.

One row is one participant. The `diet` column says which arm they were in, `kg_lost` is the kilos they lost by week 12, `sessions` counts the coaching sessions they attended out of 12, and `hungry` records whether they reported strong hunger during the trial.

The helper `arm()` draws 1,000 values from a normal distribution and then rescales them so that arm's mean and standard deviation come out at exactly the values we asked for. Real trial data is never that tidy, but the rescaling keeps every number here round and the arithmetic easy to follow.

Press Run.

```r
# Build the 12 week diet trial: 1,000 participants in each of the three arms
set.seed(206)

arm <- function(mu, n = 1000) as.numeric(mu + 4 * scale(rnorm(n)))

trial <- data.frame(
  diet    = factor(rep(c("standard", "dietA", "dietB"), each = 1000),
                   levels = c("standard", "dietA", "dietB")),
  kg_lost = c(arm(3.0), arm(3.5), arm(8.0))
)
trial$sessions <- pmin(12, pmax(0, round(rnorm(3000, 5 + 0.35 * trial$kg_lost, 2.2))))
trial$hungry   <- ifelse(rbinom(3000, 1, c(0.30, 0.36, 0.62)[trial$diet]) == 1, "yes", "no")

kg_standard <- trial$kg_lost[trial$diet == "standard"]
kg_a        <- trial$kg_lost[trial$diet == "dietA"]
kg_b        <- trial$kg_lost[trial$diet == "dietB"]

round(rbind(mean = tapply(trial$kg_lost, trial$diet, mean),
            sd   = tapply(trial$kg_lost, trial$diet, sd)), 2)
#>      standard dietA dietB
#> mean        3   3.5     8
#> sd          4   4.0     4
```

The three arms came out at 3.0, 3.5 and 8.0 kg lost on average. Below each mean sits a standard deviation of 4.0 kg, which says how much the people inside one arm differ from one another. Some of them lost 12 kg and some of them put weight on, and 4.0 kg is the typical distance from their own arm's mean.

Now let's run the two comparisons the clinic cares about. `t.test()` takes two groups of numbers and returns a p-value, which says how easily pure chance alone could produce a gap this big if the two diets were identical.

```r
# Test each diet against standard care: the gap in kilos and its p-value
test_a <- t.test(kg_a, kg_standard)
test_b <- t.test(kg_b, kg_standard)

data.frame(
  comparison = c("diet A vs standard", "diet B vs standard"),
  gap_kg     = c(mean(kg_a) - mean(kg_standard), mean(kg_b) - mean(kg_standard)),
  p_value    = signif(c(test_a$p.value, test_b$p.value), 2)
)
#>           comparison gap_kg  p_value
#> 1 diet A vs standard    0.5  5.2e-03
#> 2 diet B vs standard    5.0 2.2e-145
```

Diet A's 0.5 kg gap gives p = 0.0052. Diet B's 5.0 kg gap gives 2.2e-145, which is R's way of writing a decimal point followed by 144 zeros before the first digit. Both clear the usual 0.05 threshold, and the second one clears it by a huge margin.

It is tempting to rank the two diets by that second column. Diet B really is the better diet here, but the p-value is not what tells you so. Look at what the p-value is made of: a gap, a spread and a count of people, and nothing in it is reported in kilos.

Here are the three arms drawn on one axis, with a dashed line at each arm's mean.

```r
# Draw all three arms on the same axis to see the gaps against the spread
bins <- seq(-12, 24, by = 1)

hist(kg_standard, breaks = bins, col = rgb(0.45, 0.45, 0.45, 0.55), border = "white",
     ylim = c(0, 120), main = "Weight lost after 12 weeks, all three arms",
     xlab = "Kilos lost by week 12")
hist(kg_a, breaks = bins, col = rgb(0.15, 0.40, 0.70, 0.45), border = "white", add = TRUE)
hist(kg_b, breaks = bins, col = rgb(0.85, 0.45, 0.10, 0.45), border = "white", add = TRUE)
abline(v = c(3.0, 3.5, 8.0), lwd = 2, lty = 2)
legend("topright", bty = "n",
       fill = c(rgb(0.45, 0.45, 0.45, 0.55), rgb(0.15, 0.40, 0.70, 0.45),
                rgb(0.85, 0.45, 0.10, 0.45)),
       legend = c("standard care, mean 3.0", "diet A, mean 3.5", "diet B, mean 8.0"))
```

Standard care in grey and diet A in blue sit almost exactly on top of each other. Their two dashed lines are 0.5 kg apart, while each pile spreads several kilos either side of its own line. Diet B in orange has clearly moved to the right.

That comparison, the gap between the arms held against the spread inside them, is the whole idea behind Cohen's d.

=== step === concept
## Cohen's d: the gap in pooled standard deviations

A gap of 0.5 kg means nothing on its own, because you do not yet know what to hold it against. Half a kilo would be enormous in a trial where nobody's weight moved by more than a few hundred grams, and invisible in a trial where people swing by 10 kg on their own.

So the thing you hold it against has to come out of the data itself. Cohen's d uses the spread inside the groups: divide the gap between the two means by the standard deviation the two groups share.

\[ d = \frac{\bar{x}_1 - \bar{x}_2}{s_{pooled}} \]

That denominator is the pooled standard deviation. It is the two groups' standard deviations combined into one, each weighted by how many people it came from.

\[ s_{pooled} = \sqrt{\frac{(n_1 - 1)s_1^2 + (n_2 - 1)s_2^2}{n_1 + n_2 - 2}} \]

Here n1 and n2 are the two group sizes, and s1 squared and s2 squared are their variances, which is the standard deviation squared. Let's work diet A against standard care by hand.

```r
# Work out the pooled standard deviation and Cohen's d for diet A by hand
n_a <- length(kg_a)
n_s <- length(kg_standard)

s_pooled <- sqrt(((n_a - 1) * var(kg_a) + (n_s - 1) * var(kg_standard)) / (n_a + n_s - 2))
gap_a    <- mean(kg_a) - mean(kg_standard)

round(c(gap = gap_a, s_pooled = s_pooled, d = gap_a / s_pooled), 3)
#>      gap s_pooled        d
#>    0.500    4.000    0.125
```

Both arms have a standard deviation of 4.0 kg, so pooling them gives 4.0 as well. The division is then 0.5 / 4.0 = 0.125, and that is Cohen's d for diet A.

So diet A sits 0.125 standard deviations ahead of standard care.

Notice what happened to the units on the way. The gap was in kilos and the pooled standard deviation is in kilos, so the kilos cancel and d comes out as a plain number. A d of 0.125 means the same thing in a weight trial, a blood pressure study and a reading test, and that is what makes effect sizes comparable across fields that measure completely different things.

We need d a few more times, so wrap the arithmetic in a function.

```r
# Turn the formula into a reusable function and run it on both diets
cohens_d <- function(x, y) {
  n_x <- length(x)
  n_y <- length(y)
  s_p <- sqrt(((n_x - 1) * var(x) + (n_y - 1) * var(y)) / (n_x + n_y - 2))
  (mean(x) - mean(y)) / s_p
}

round(c(dietA = cohens_d(kg_a, kg_standard),
        dietB = cohens_d(kg_b, kg_standard)), 3)
#> dietA dietB
#> 0.125 1.250
```

Diet A is 0.125 and diet B is 1.25. That is ten times the size, out of the same trial where both comparisons came in under 0.05.

=== step === concept
## How to read d: Cohen's bands and group overlap

A d of 0.125 is a number, not yet an answer. Jacob Cohen, who put d into general use in the 1960s, also published rough bands for reading one, and they are still what most fields quote.

| Cohen's d | Label |
|---|---|
| 0.2 | small |
| 0.5 | medium |
| 0.8 | large |

Bands alone can feel like someone's opinion, so here is the concrete thing they stand for. If the two groups are roughly normal with the same spread, then d fixes exactly how much of the two distributions sit on top of each other. That overlapping share is `2 * pnorm(-d / 2)`, where `pnorm()` gives the share of a normal distribution lying below a point.

```r
# What share of the two groups overlaps at each value of d
overlap_percent <- function(d) round(100 * 2 * pnorm(-abs(d) / 2), 1)

data.frame(
  d       = c(0.2, 0.5, 0.8, 0.125, 1.25),
  meaning = c("small band", "medium band", "large band", "diet A", "diet B"),
  overlap = overlap_percent(c(0.2, 0.5, 0.8, 0.125, 1.25))
)
#>       d     meaning overlap
#> 1 0.200  small band    92.0
#> 2 0.500 medium band    80.3
#> 3 0.800  large band    68.9
#> 4 0.125      diet A    95.0
#> 5 1.250      diet B    53.2
```

Read the last two rows. At diet A's d of 0.125, 95% of the two arms overlap. Hand someone one person from standard care and one person from diet A, without the labels, and they would have almost nothing to go on. At diet B's 1.25 the overlap drops to 53%, which leaves 47% of each arm sitting outside the other.

Here are the same two comparisons drawn as density curves.

```r
# Draw both comparisons as density curves, the small effect beside the large one
par(mfrow = c(1, 2))

plot(density(kg_standard), xlim = c(-10, 22), ylim = c(0, 0.11), lwd = 2,
     main = "Diet A vs standard, d = 0.125", xlab = "Kilos lost")
lines(density(kg_a), lwd = 2, col = "steelblue")

plot(density(kg_standard), xlim = c(-10, 22), ylim = c(0, 0.11), lwd = 2,
     main = "Diet B vs standard, d = 1.25", xlab = "Kilos lost")
lines(density(kg_b), lwd = 2, col = "darkorange")

par(mfrow = c(1, 1))
```

On the left are two curves you have to squint at to tell apart. On the right are two curves anybody would call different. Same trial and the same 4.0 kg spread, and the only thing that changed is the gap between the means.

[NOTE]
Cohen's bands are conventions, not laws of nature. A d of 0.1 for a cheap painkiller taken by millions of people is worth having, and a d of 1.0 on a measure nobody acts on is worth nothing. The bands give everyone a common language, and your field decides what is worth acting on.

=== step === concept
## The p-value moves with the sample size, d does not

Here is the property that makes effect size a number worth reporting separately.

Take the diet A comparison and rebuild it at five different sizes, from 10 participants per arm up to 5,000. The gap stays at 0.5 kg and the spread stays at 4.0 kg in every one of them. The only thing that changes is how many people took part.

```r
# Rebuild the same 0.5 kg gap at five sample sizes and watch p, d and g
hedges_g <- function(x, y) {
  n_total <- length(x) + length(y)
  cohens_d(x, y) * (1 - 3 / (4 * n_total - 9))
}

set.seed(11)
sizes <- c(10, 50, 200, 1000, 5000)

size_table <- data.frame(t(sapply(sizes, function(n) {
  s <- arm(3.0, n)
  a <- arm(3.5, n)
  c(n_per_arm = n,
    p_value   = t.test(a, s)$p.value,
    d         = cohens_d(a, s),
    g         = hedges_g(a, s))
})))
size_table$p_value <- signif(size_table$p_value, 2)
size_table$d       <- round(size_table$d, 3)
size_table$g       <- round(size_table$g, 3)
size_table
#>   n_per_arm p_value     d     g
#> 1        10 7.8e-01 0.125 0.120
#> 2        50 5.3e-01 0.125 0.124
#> 3       200 2.1e-01 0.125 0.125
#> 4      1000 5.2e-03 0.125 0.125
#> 5      5000 4.3e-10 0.125 0.125
```

Read the `p_value` column top to bottom. It falls from 0.78 to 4.3e-10. At 10 people per arm the 0.5 kg gap is nowhere near significant, and at 5,000 per arm the very same gap is significant with room to spare. Whether a result comes out significant is partly a statement about how many people you recruited.

Now read the `d` column. It is 0.125 in every single row, below Cohen's small band whether that row cleared 0.05 or not. The difference between the two diets is a property of the diets. It is not a property of how many people the clinic could afford to recruit.

The one part of d that does move with the sample size is a small upward bias. In tiny samples d tends to come out a little larger than the effect it is estimating. Larry Hedges published the correction for it in 1981, and d with that correction applied is called Hedges' g.

\[ g = d \times \left(1 - \frac{3}{4N - 9}\right) \]

N there is the total number of participants across both groups. The `g` column shows the correction working: at 10 per arm it pulls 0.125 down to 0.120, about 4%, and by 1,000 per arm it changes nothing anybody would report.

[TIP]
Use Hedges' g when the two groups together come to about 50 people or fewer, which is where the correction is worth the extra word in your sentence. Above that, d and g agree to the decimal places people read.

[KEY INSIGHT]
Recruiting more people buys you a smaller p-value, not a bigger effect. The p-value answers whether the gap is more than noise. Cohen's d answers how large the gap is. Report only the first and you leave your reader to guess the second.

=== step === widget
## How many people it takes to detect an effect this size

Effect size is not only something you report at the end. It is also the number that decides how large a study has to be before it is worth running at all.

The word for that is power. Power is the probability that a study of a given size comes back with p under 0.05 when an effect of a given size really is there. The usual target is 80%, which means accepting a 1 in 5 chance of missing a real effect.

The widget below plots power against the number of people per group, for a two-sample t-test at the 0.05 level. Switch between Cohen's three bands and watch where the marked sample size lands.

::widget power-curve {}

A small effect, d = 0.2, needs about 393 people per group to reach 80% power. A medium one needs 63 and a large one needs 25. Halve the effect you are chasing and the study you need is roughly four times the size, which is why small effects are expensive to confirm.

The R block under the widget works the same three numbers out with `power.t.test()` and prints 394, 64 and 26. The curve uses a normal approximation and `power.t.test()` uses the t distribution, so the two land within one participant of each other.

Diet A's d of 0.125 is smaller than the smallest setting the widget offers. So let's compute its sample size directly, since `power.t.test()` takes the gap and the spread in their real units.

```r
# How many people per arm each diet needs for 80% power, and what 1,000 buys
round(c(
  dietA_per_arm = power.t.test(delta = 0.5, sd = 4, sig.level = 0.05, power = 0.80)$n,
  dietB_per_arm = power.t.test(delta = 5.0, sd = 4, sig.level = 0.05, power = 0.80)$n,
  power_at_1000 = power.t.test(n = 1000, delta = 0.5, sd = 4, sig.level = 0.05)$power
), 3)
#> dietA_per_arm dietB_per_arm power_at_1000
#>      1005.618        11.094         0.798
```

To catch diet A's 0.5 kg gap with 80% power you would need 1,006 people per arm. The clinic ran 1,000, which gives 0.798. So this trial was sized for an effect exactly this small, and 1,000 per arm came a hair short of the 80% target.

Diet B's 5.0 kg gap needs 12 people per arm. Twelve. An effect that large shows up in a study you could run with the people in one waiting room, which is the same fact the d of 1.25 already gave us, measured in standard deviations.

=== step === quiz
## Quick check: reading a d of 0.125

Diet A lost 0.5 kg more than standard care, with p = 0.0052 and d = 0.125. Which sentence reads that pair of numbers correctly?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The p-value is well under 0.05, so diet A produced a large effect. ::no
- The difference is real but small: an eighth of a standard deviation, measured precisely because 1,000 people per arm is a lot of people. ::ok Exactly. The two numbers answer two questions. The p-value says the gap is more than noise, d says the gap is an eighth of a standard deviation, and the 1,000 people per arm are what let the trial pin down something that small.
- Recruiting another 4,000 people per arm would push d up past 0.2. ::no
- A medium effect needs 63 people per arm, so a trial of 1,000 per arm proves this effect is at least medium. ::no None of the other three reads it right. A p-value under 0.05 says the gap is more than noise, never that the gap is large. Cohen's d is fixed by the two means and the spread, so recruiting more people leaves it at 0.125 and only shrinks the p-value further. And 63 per arm is the size a study needs to detect a medium effect, not evidence that the effect it found was one.

=== step === concept
## Three or more groups: eta-squared and omega-squared

So far we have taken the arms two at a time. Ask a different question, how much of the weight people lost is explained by which diet they were put on, and Cohen's d no longer fits. There are three means now, and d is built out of one gap between two.

The test for three or more means is one-way ANOVA. It splits the total variation in `kg_lost` into two parts: the variation between the three arm means, and the variation left over inside the arms.

```r
# Fit a one-way ANOVA over all three arms and read its sums of squares
fit <- aov(kg_lost ~ diet, data = trial)
summary(fit)
#>               Df Sum Sq Mean Sq F value Pr(>F)
#> diet           2  15167    7583     474 <2e-16 ***
#> Residuals   2997  47952      16
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1

atbl       <- summary(fit)[[1]]
ss_between <- atbl$"Sum Sq"[1]
ss_total   <- sum(atbl$"Sum Sq")

round(c(ss_between = ss_between, ss_total = ss_total,
        eta_squared = ss_between / ss_total), 3)
#>  ss_between    ss_total eta_squared
#>    15166.67    63118.67        0.24
```

The `Sum Sq` column is where the variation went. 15,167 of it sits between the three arm means, 47,952 is left inside the arms, and together they make 63,119 in total.

Eta-squared is simply the between share of that total.

\[ \eta^2 = \frac{SS_{between}}{SS_{total}} \]

Ours is 0.240, so which diet a person was put on explains 24% of the variation in kilos lost. Read it the way you read an R-squared: 0 means the grouping explains none of the variation, 1 means it explains all of it. Cohen's bands here are 0.01 small, 0.06 medium and 0.14 large, so 24% is a large effect.

Eta-squared carries the same small-sample bias d does, and for the same reason. Some of the variation between the arm means is noise rather than diet, and eta-squared counts all of it as explained. Omega-squared takes that noise back out, by subtracting an estimate of it from the numerator and adding it to the denominator.

\[ \omega^2 = \frac{SS_{between} - df_{between} \times MS_{error}}{SS_{total} + MS_{error}} \]

MS error is the variation left inside the arms divided by its degrees of freedom, the number of participants minus the number of groups, so 2,997 here. It is the 16 printed in the ANOVA table. df between is the number of groups minus 1, which is 2 here. Let's compute both measures on the full trial, and then on a small slice of it.

```r
# Compare eta-squared with omega-squared on the full trial and on 15 per arm
eta_squared <- function(model) {
  a <- summary(model)[[1]]
  a$"Sum Sq"[1] / sum(a$"Sum Sq")
}

omega_squared <- function(model) {
  a <- summary(model)[[1]]
  ms_error <- a$"Mean Sq"[2]
  (a$"Sum Sq"[1] - a$Df[1] * ms_error) / (sum(a$"Sum Sq") + ms_error)
}

set.seed(3)
small15 <- trial[unlist(lapply(split(seq_len(3000), trial$diet), sample, 15)), ]
fit15   <- aov(kg_lost ~ diet, data = small15)

round(c(eta_full = eta_squared(fit),   omega_full = omega_squared(fit),
        eta_15   = eta_squared(fit15), omega_15   = omega_squared(fit15)), 3)
#>   eta_full omega_full     eta_15   omega_15
#>      0.240      0.240      0.239      0.199
```

On all 3,000 participants the two agree at 0.240, because 3,000 rows leave very little noise to remove. On 45 participants, 15 per arm, eta-squared still reports 0.239 while omega-squared reports 0.199. Same three diets, same real difference between them, and the small sample has inflated eta-squared by four percentage points.

So report omega-squared when your groups are small, and expect the two to converge once they are not.

=== step === concept
## Effect sizes for categorical and continuous pairs

The trial holds two more shapes of comparison, and each one has its own effect size.

The first shape is two categorical columns. Did the arm a person was in relate to whether they reported strong hunger? The `diet` column has three values and `hungry` has two, so crossing them gives a 3 by 2 contingency table, which is a table of counts. The test that goes with it is the chi-squared test of independence. Its statistic adds up how far the counts in the table sit from the counts you would get if hunger and diet had nothing to do with each other.

The trouble with the chi-squared statistic is that it grows with the number of people. Double the trial and you roughly double the statistic, with the association between hunger and diet completely unchanged. Cramer's V rescales it onto a fixed 0 to 1 range.

\[ V = \sqrt{\frac{\chi^2}{N (k - 1)}}, \quad k = \min(\text{rows}, \text{cols}) \]

N is the total count in the table, and k is the smaller of the table's two dimensions.

```r
# Cross diet against reported hunger, then rescale chi-squared into Cramer's V
tab <- table(diet = trial$diet, hungry = trial$hungry)
tab
#>           hungry
#> diet        no yes
#>   standard 697 303
#>   dietA    641 359
#>   dietB    376 624

chi <- chisq.test(tab)
k   <- min(dim(tab))
cramers_v <- sqrt(as.numeric(chi$statistic) / (sum(tab) * (k - 1)))

round(c(chi_squared = as.numeric(chi$statistic),
        df          = as.numeric(chi$parameter),
        cramers_v   = cramers_v), 3)
#> chi_squared          df   cramers_v
#>     240.089       2.000       0.283
```

Look at the table before the numbers. 303 people on standard care reported strong hunger, against 359 on diet A and 624 on diet B. The chi-squared statistic for that pattern is 240.09 on 2 degrees of freedom, which for a table is the rows minus 1 times the columns minus 1. On its own that statistic has no ceiling and no natural reading.

Cramer's V puts it at 0.283. Here k is 2, the smaller side of the 3 by 2 table, so the denominator is N times 1. When k is 2 like this, Cohen's bands for V are 0.10, 0.30 and 0.50, which makes 0.283 a moderate association: diet B does leave more people hungry, and plenty of people on it still reported no strong hunger.

The second shape is two continuous columns. Pearson's r, the ordinary correlation between two numeric columns, needs no rescaling at all. It is fixed between -1 and 1 whatever the sample size, so it is already an effect size.

```r
# Correlate sessions attended with weight lost, and read r as an effect size
r_sessions <- cor(trial$sessions, trial$kg_lost)
round(c(r = r_sessions, r_squared = r_sessions^2), 3)
#>         r r_squared
#>     0.591     0.350

plot(jitter(trial$sessions), trial$kg_lost, pch = 16, cex = 0.5,
     col = rgb(0.15, 0.40, 0.70, 0.25),
     main = "Coaching sessions attended against weight lost",
     xlab = "Sessions attended", ylab = "Kilos lost by week 12")
abline(lm(kg_lost ~ sessions, data = trial), lwd = 2, col = "darkorange")
```

An r of 0.591 clears Cohen's large band for r, which sits at 0.50, with small at 0.10 and medium at 0.30. Square it and you get 0.35, so sessions attended account for 35% of the variation in kilos lost. That squared version sits on the same variance-explained scale as eta-squared, which lets you put a correlation and an ANOVA result side by side.

Be careful what you claim from that scatter, though. It says people who attended more sessions lost more weight. It does not say the sessions caused the loss, because people who were already losing weight had every reason to keep turning up.

[NOTE]
Cramer's V and Pearson's r behave the way Cohen's d does when a study grows. Recruit ten times as many people and the chi-squared statistic and the t statistic both climb, while V and r sit where they were. That is what makes all three of them effect sizes.

=== step === widget
## The same result, written four ways

Before the full trial, the clinic ran a small pilot of diet B: 12 people on standard care and 12 on the diet. Let's build that pilot and line it up against the diet A comparison from the full trial.

```r
# Run the small diet B pilot, then line it up against the full diet A result
set.seed(42)
pilot_s <- arm(3.0, 12)
pilot_b <- arm(8.0, 12)

compare_arms <- function(x, y) {
  tt <- t.test(x, y)
  c(gap     = mean(x) - mean(y),
    ci_low  = tt$conf.int[1],
    ci_high = tt$conf.int[2],
    p_value = tt$p.value,
    d       = cohens_d(x, y))
}

round(rbind(dietA_full  = compare_arms(kg_a, kg_standard),
            dietB_pilot = compare_arms(pilot_b, pilot_s)), 4)
#>             gap ci_low ci_high p_value     d
#> dietA_full  0.5 0.1492  0.8508  0.0052 0.125
#> dietB_pilot 5.0 1.6134  8.3866  0.0057 1.250
```

The `ci_low` and `ci_high` columns are the 95% confidence interval, the range of true gaps the data is consistent with. Now compare the two rows on the p-value alone: 0.0052 and 0.0057. Round those to two decimal places, the way papers and dashboards usually print them, and both read p = 0.01.

So a reader handed only the rounded p-value cannot tell a 0.5 kg difference measured on 2,000 people from a 5.0 kg difference measured on 24.

The widget below holds both results. Four sentences report the same analysis, each one showing a little more of it than the last. Pick the sentence that reads as the strongest evidence, and the panel that follows shows what each write-up left out. Then switch between the two studies.

::widget report-four-ways {"studies":[{"label":"Diet A, full trial","outcome":"weight lost","unit":"kg","n1":1000,"n2":1000,"m1":3.0,"m2":3.5,"sd":4,"mcid":2},{"label":"Diet B, pilot","outcome":"weight lost","unit":"kg","n1":12,"n2":12,"m1":3.0,"m2":8.0,"sd":4,"mcid":2}],"start":0,"alpha":0.05}

Both studies carry the same threshold, 2 kg, which is the smallest difference that would matter to a patient choosing between these diets. A gap under it is not worth switching for.

Read the comparison table at the bottom. The two bare p-values are identical and everything else about the two studies is opposite. Diet A's whole interval, 0.15 to 0.85 kg, sits under the 2 kg threshold, so that trial has a real answer and the answer is no. The pilot's interval runs from 1.61 to 8.39 kg, straddling the threshold. So 24 people were not enough to answer the question the clinic asked: the true gap could be a shade over the 2 kg that matters, or more than four times it.

[WARNING]
Two results that print the same p-value can be a precise finding of nothing and a wildly uncertain finding of something. The p-value cannot separate those two. The gap, the interval around it, and d can.

=== step === quiz
## Quick check: which effect size fits which comparison

The clinic wants one number for how much of the variation in kilos lost is explained by which of the three arms a person was in. Which one gives them that?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Cohen's d between the best arm and the worst arm. ::no
- Eta-squared from a one-way ANOVA over all three arms, or omega-squared if the arms were small. ::ok Right. The question is about the whole grouping rather than one pair of arms, so the answer is the share of the variation that the grouping explains, which came to 0.240 in this trial.
- The chi-squared statistic from a table of arm against reported hunger. ::no
- The difference in mean kilos between the best arm and the worst arm. ::no Each of these answers a different question, or none. Cohen's d and a raw difference in kilos both compare two arms and throw the third away, and a raw difference in kilos is not an effect size at all, because it has no scale to be read against. Chi-squared works on two categorical columns rather than on a numeric outcome, and its value climbs with the number of people, which is exactly why Cramer's V exists.

=== step === tryit
## Your turn: is diet B worth the switch from diet A?

Both diets are on the clinic's shelf now, and the next question is whether to move people from diet A onto diet B. That pair has not been compared directly yet, because both t-tests so far ran a diet against standard care.

Run it. `kg_a` and `kg_b` hold the kilos lost by the 1,000 people in each diet arm, and `cohens_d()` is the function from earlier. Report both answers: whether the gap is more than noise, and how large it is.

```r
# kg_b and kg_a hold the kilos lost in the diet B and diet A arms.
# Run t.test on the two vectors for the p-value,
# then cohens_d on the same two vectors for the size of the gap.
# Two lines. Press Check when you have them.
```
::check {"regex": "cohens_d\\s*[(]\\s*kg_b\\s*,\\s*kg_a\\s*[)]", "gate": true, "difficulty": "intermediate", "ok": "That is it: a gap of 4.5 kg, p = 1.5e-121 and d = 1.125. The d sits above Cohen's 0.8 band, so diet B beats diet A by a large margin as well as a certain one.", "no": "Use the two arms as they are: `t.test(kg_b, kg_a)$p.value` for the p-value, then `cohens_d(kg_b, kg_a)` for the size."}
::solution
```r
# Compare diet B against diet A: the size of the gap, then the p-value
round(c(gap_kg = mean(kg_b) - mean(kg_a), d = cohens_d(kg_b, kg_a)), 3)
#> gap_kg      d
#>  4.500  1.125

signif(t.test(kg_b, kg_a)$p.value, 2)
#> [1] 1.5e-121
```

The gap is 4.5 kg, d is 1.125, and the p-value has 120 zeros before its first digit. Both numbers point the same way here, which is the comfortable case. The reason for computing them separately is the case where they do not.

=== step === concept
## References

- [Statistical Power Analysis for the Behavioral Sciences](https://doi.org/10.4324/9780203771587) - Cohen, J. (1988), 2nd edition, Lawrence Erlbaum. The source of the 0.2, 0.5 and 0.8 bands, and of the ANOVA and correlation bands used here.
- [Distribution Theory for Glass's Estimator of Effect Size and Related Estimators](https://doi.org/10.3102/10769986006002107) - Hedges, L. V. (1981), Journal of Educational Statistics 6(2), 107-128. Where the small-sample correction behind Hedges' g comes from.
- [Generalized Eta and Omega Squared Statistics](https://doi.org/10.1037/1082-989X.8.4.434) - Olejnik, S. and Algina, J. (2003), Psychological Methods 8(4), 434-447. Which variance-explained measure to report, and when eta-squared misleads.
- [Calculating and Reporting Effect Sizes to Facilitate Cumulative Science](https://doi.org/10.3389/fpsyg.2013.00863) - Lakens, D. (2013), Frontiers in Psychology 4, 863. A practical primer on d, g and eta-squared for t-tests and ANOVAs.
- [Power calculations for two-sample t tests](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/power.t.test.html) - R Core Team, the documentation for `power.t.test()`.

=== step === complete
## Quick recap

You took one trial and answered two separate questions about it: whether each diet beat standard care, and by how much. To summarize:

- Cohen's d is the gap between two means divided by their pooled standard deviation. Diet A came out at 0.125 and diet B at 1.25, out of a trial where both comparisons cleared 0.05.
- The bands 0.2, 0.5 and 0.8 give you the reading, and group overlap gives you the picture: 95% of the two arms overlap at 0.125, and 53% at 1.25.
- More participants shrink the p-value and leave d where it is. The same 0.5 kg gap ran from p = 0.78 to p = 4.3e-10 while d stayed at 0.125 in every row.
- The effect size you expect is what sets the sample size you need. A d of 0.2 takes about 393 people per group for 80% power, a d of 0.8 takes 25.
- Two results with the same p-value can be opposites. A precise 0.5 kg finding and an unsettled pilot both round to p = 0.01.

Which effect size to reach for depends on the shape of the comparison:

| What you are comparing | Effect size | Small / medium / large |
|---|---|---|
| Two group means | Cohen's d, Hedges' g | 0.2 / 0.5 / 0.8 |
| Three or more group means | eta-squared, omega-squared | 0.01 / 0.06 / 0.14 |
| Two categorical columns | Cramer's V | 0.10 / 0.30 / 0.50 |
| Two continuous columns | Pearson's r | 0.10 / 0.30 / 0.50 |

So the next time you write up a test, put the size right next to the p-value:

"Diet A lost 0.5 kg more than standard care, 95% CI 0.15 to 0.85, p = 0.005, d = 0.125. The effect is real and it is small."

Two numbers, two questions, and nobody reading you has to guess which one you meant. Congratulations, you made it through. Have a great day!
