---
title: "Hypothesis testing: the framework, explained"
slug: "Inference-Mini-5"
description: "Run one hypothesis test end to end: state H0 and H1, compute the t statistic, read the p-value, decide at a fixed level, and see both ways it goes wrong."
keywords: "hypothesis testing in R, null hypothesis, alternative hypothesis, test statistic, p-value, significance level, Type I error, Type II error, statistical power"
mathjax: true
webr: true
date: "2026-09-05"
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
catalog_blurb: "The five steps behind every statistical test, and its two error types."
---

=== step === cover
## Hypothesis testing: the framework, explained

Today we will run one hypothesis test from start to finish, and see exactly what each part of it decides.

A coffee plant packs ground coffee on a filling line, and every bag it fills has 250 g printed on the side. The line is set to put 250 g in. On Tuesday morning quality control pulls 30 bags off that line and weighs them one at a time, and those 30 bags average 247.6 g.

That is 2.4 g under the label. So has the line drifted light, or did 30 bags simply come out on the low side this morning?

Staring harder at 247.6 will not tell you. Single bags off this line ran anywhere from 233.6 g to 255.2 g, so the average of any thirty of them was never going to land exactly on 250. What decides the question is a procedure, and the procedure is the same five steps every time.

::widget process-flow {"steps":[{"title":"State the two hypotheses","sub":"the line fills to 250 g, or it does not"},{"title":"Compute the test statistic","sub":"the 2.4 g shortfall in units of sampling variation"},{"title":"Get the p-value","sub":"how often a correct line gives a sample this far out"},{"title":"Compare it with the significance level","sub":"the bar you fixed before weighing anything"},{"title":"Report the decision","sub":"the decision, the average fill and its interval"}]}

That is the whole framework. Everything from here is running those five on the 30 bags, one at a time, and finding out what each one is really deciding.

=== step === concept
## The 30 bags and the 2.4 gram shortfall

Let's start with the morning's weights, because every number from here comes out of these 30 values.

Each value below is one bag's fill weight in grams, straight off the scale.

```r
# Weigh 30 bags off the line and measure the shortfall against the 250 g label
bags <- c(245.2, 252.9, 245.2, 252.4, 249.3, 245.6, 246.0, 247.3,
          254.5, 243.2, 254.0, 246.3, 241.9, 246.0, 255.1, 255.2,
          249.2, 249.1, 244.9, 250.4, 252.7, 251.7, 233.6, 244.2,
          251.2, 241.9, 247.1, 242.9, 240.2, 248.8)

round(c(bags = length(bags), mean = mean(bags), sd = sd(bags),
        lightest = min(bags), heaviest = max(bags),
        shortfall = mean(bags) - 250), 3)
#>      bags      mean        sd  lightest  heaviest shortfall
#>    30.000   247.600     5.001   233.600   255.200    -2.400
```

The mean of the 30 weights is 247.6 g, so the shortfall against the label is 2.4 g. That single number is what the whole question is about.

Now look at the standard deviation, 5.001 g. That is how far one bag's weight typically sits from the average, and it is about twice the size of the shortfall we are trying to judge.

Plotting the 30 weights shows the same thing.

```r
# Plot the 30 fill weights against the 250 g the label promises
hist(bags, breaks = 12, col = "grey85", border = "white",
     main = "30 bags off the packing line",
     xlab = "Fill weight in grams")
abline(v = 250, col = "red", lwd = 3)
```

The red line is 250 g. More bags sit to the left of it than to the right, which is where the 2.4 g shortfall comes from, but plenty of bags sit to the right, one bag reached 255.2 g and another came in at 233.6 g.

So the sample mean on its own settles nothing. A line filling perfectly to 250 g would also hand you a 30-bag average that misses 250 by something. The real question is whether it would miss by this much.

=== step === concept
## The null and alternative hypotheses, written before the test
::prose-only the two claims are one line of notation each, written down before anything is computed

A test begins with two claims, and both are written down before any computation happens.

The first is the **null hypothesis**, written \(H_0\) and said out loud as "H nought". It is the claim that nothing is going on: the line's mean fill is 250 g, exactly what it is set to.

The second is the **alternative hypothesis**, written \(H_1\). It is what you are left with if the data pushes you off \(H_0\), and here it is that the line's mean fill is not 250 g.

\[H_0: \mu = 250 \qquad H_1: \mu \neq 250\]

The symbol \(\mu\) is the mean fill of the line itself, across every bag it would ever fill. It is not the average of the 30 bags we weighed. Those 30 bags are the evidence, their average of 247.6 g is the **sample mean**, and the sample mean is our estimate of \(\mu\).

Notice that \(H_1\) points both ways. The claim is that \(\mu\) is not 250, which covers a line running light and a line running heavy, because the plant wants to know either way. A test written like this is called **two-sided**.

Now, why is \(H_0\) the one we assume rather than the one we set out to prove? Because it is the only one of the two that is fully specified. "The mean fill is exactly 250 g" tells you enough to work out what samples of 30 bags off such a line look like.

"The mean fill is not 250 g" tells you almost nothing. It could be 249.9 g or it could be 210 g, and you cannot compute anything from a claim that loose. So everything from here is computed inside the world where \(H_0\) is true, and that is the only reason there is anything to compute at all.

Both claims go on paper before the test runs. A hypothesis picked after looking at the numbers is no longer being tested by those numbers.

=== step === concept
## The test statistic: the shortfall measured in standard errors

The shortfall is 2.4 g. Whether that is a lot depends on how much a 30-bag average moves around in the first place, so the next job is to measure the shortfall in units of that movement.

That unit has a name. The **standard error** is the standard deviation of the sample mean, that is, how far a 30-bag average typically lands from the line's true mean. You get it by dividing the sample standard deviation by the square root of the sample size.

The **test statistic** is then the shortfall divided by the standard error, and for this kind of question it is called t.

\[t = \frac{\bar{x} - \mu_0}{s / \sqrt{n}}\]

Here \(\bar{x}\) is the sample mean of 247.6, \(\mu_0\) is the 250 that \(H_0\) claims, \(s\) is the sample standard deviation of 5.001, and \(n\) is 30.

```r
# Work out the standard error and the test statistic by hand
n  <- length(bags)
se <- sd(bags) / sqrt(n)
se
#> [1] 0.9129842

t_hand <- (mean(bags) - 250) / se
t_hand
#> [1] -2.628742
```

One standard error is 0.913 g. So a 30-bag average off a correctly set line usually lands within about a gram of 250, which is far tighter than the 5.001 g spread of single bags. Averaging thirty of them is what shrinks the spread that far.

And our sample mean sits 2.6287 standard errors below 250. That is what t says, and it is all it says: the distance from \(H_0\), counted in units of ordinary sampling variation.

R does the same arithmetic in one call.

```r
# Check the hand computation against the one-sample t-test
bag_test <- t.test(bags, mu = 250)
bag_test$statistic
#>         t
#> -2.628742
```

Read `t.test(bags, mu = 250)` as "test these 30 weights against a claimed mean of 250". The statistic it reports is the same -2.628742 we worked out by hand, digit for digit.

=== step === concept
## The null distribution, and where the p-value comes from

A distance of 2.63 standard errors means nothing until you know what distances a correctly set line produces on its own. So let's produce them.

\(H_0\) is specified enough to simulate: a line whose mean fill is 250 g, with the same 5 g spread between bags. Draw 10,000 samples of 30 bags each from that line, and compute t for every one of them exactly as we just did by hand.

```r
# Simulate 10,000 samples of 30 bags from a line that really does fill to 250 g
set.seed(11)
null_t <- replicate(10000, {
  one_sample <- rnorm(30, mean = 250, sd = 5)
  (mean(one_sample) - 250) / (sd(one_sample) / sqrt(30))
})

hist(null_t, breaks = 40, col = "grey85", border = "white",
     main = "10,000 samples from a line set to 250 g",
     xlab = "t: standard errors between the sample mean and 250")
abline(v = t_hand, col = "red", lwd = 3)
```

`rnorm(30, mean = 250, sd = 5)` draws one morning's 30 bags off that line, `replicate()` repeats that whole draw 10,000 times and keeps the t it produced each time, and `set.seed(11)` fixes the draws so your numbers match mine.

The grey pile is the **null distribution**: every value of t a correctly set line produces, and how often it produces each one. It centres on 0, because a correct line usually gives an average near 250, and it thins out past 3 in both directions, because sometimes thirty bags land oddly.

The red line is our sample's t, at -2.63. It is inside the pile rather than off the chart, but it sits out where the bars are short.

How short? Count them.

```r
# Count the simulated samples at least as far from zero as the real one
sum(abs(null_t) >= abs(t_hand))
#> [1] 147
mean(abs(null_t) >= abs(t_hand))
#> [1] 0.0147
```

147 of the 10,000 samples came out at least as far from 250 as ours did, which is a share of 0.0147. `abs()` counts both directions, because \(H_1\) said "not 250", so a 2.63 overfill would have been just as surprising as a 2.63 shortfall.

That share is the **p-value**.

[KEY INSIGHT]
A p-value is the share of samples, drawn from a world where the null hypothesis is true, that sit at least as far from it as the one you got. It says nothing about how likely the null hypothesis is. It says how ordinary or unusual your data would be if the null hypothesis held.

You do not have to simulate to get it. The t distribution describes that same pile exactly, given the **degrees of freedom**, which is the sample size minus 1, or 29 here.

```r
# Read the exact p-value off the t distribution instead of the simulation
bag_test$p.value
#> [1] 0.01356353
```

The exact p-value is 0.01356, against our simulated 0.0147. Both are answering the identical question, and neither is more correct than the other. Simulating ten thousand samples makes the answer visible, and the t distribution makes it exact.

=== step === widget
## How small does the p-value have to be?

Below is the same pile, smoothed into a curve. The total area under it is 1, and the shaded area in the tails is the p-value: the share of samples at least that far from 0, counted on both sides.

::widget null-distribution {"tails": 2, "start": 2.63, "label": "standard errors between the sample mean and 250"}

The marker opens at 2.65, the nearest notch to our 2.63, and the readout under the curve gives a p-value of 0.008.

That curve is the standard normal, which is the large-sample version of the null distribution. The exact reference for 30 bags is the t distribution on 29 degrees of freedom, whose tails are a little heavier, and that is why our exact p-value came out at 0.014 rather than 0.008. What the shaded area does as you move the marker is the same on both.

So move it. Push the marker out and the shaded slice shrinks, because a sample that far from 250 is one a correct line produces less often. Pull it back in to 1.95 and the p-value climbs to 0.051, and the line under the curve flips to "fail to reject H0".

Something changed there, and it was not the data. It was a threshold.

That threshold is the **significance level**, written \(\alpha\). It is the p-value below which you agree, in advance, to reject \(H_0\). The convention is 0.05, and it is only a convention, but the part that matters is that you fix it before you run the test. A threshold picked after seeing the p-value is not a threshold at all.

Every level has a matching cutoff on the t statistic, so you can also make the decision without looking at the p-value. The test is two-sided, so 0.05 leaves 0.025 in each tail and its cutoff sits at the 0.975 point of the t distribution, while 0.01 leaves 0.005 and sits at 0.995. `qt()` looks both points up.

```r
# Compare the test statistic with the cutoffs for the 0.05 and 0.01 levels
qt(c(0.975, 0.995), df = n - 1)
#> [1] 2.045230 2.756386
```

Our t is -2.6287, so its distance from 0 is 2.6287. That clears 2.045, so at \(\alpha\) = 0.05 we reject \(H_0\) and stop the line. It does not clear 2.756, so at \(\alpha\) = 0.01 we fail to reject \(H_0\) and leave the line running.

The same 30 bags and the same 247.6 g gave two opposite decisions. The evidence did not move, the bar did.

[NOTE]
"Fail to reject \(H_0\)" is not the same as "\(H_0\) is true". It means this sample did not carry enough evidence to rule out 250 g at the level you set. The line can still be light.

=== step === quiz
## Quick check: what p = 0.014 says about the packing line

The 30 bags came back 2.4 g light with p = 0.014. Which sentence reads that number correctly?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- There is a 1.4% probability that the line is set correctly. ::no
- There is a 98.6% probability that the line is running light. ::no
- If the line really did fill to 250 g on average, a 30-bag sample would land at least 2.4 g away about 1.4% of the time. ::ok Exactly. The p-value is computed inside the world where H0 holds, so it reports how ordinary our data would be if the line were correct, never how likely the line is to be correct.
- The line is running about 1.4% light. ::no Three of these four put the probability on the line itself, or turn the p-value into the size of the shortfall. A p-value only ever runs the other way: assume H0, then report how often data like ours turns up. The shortfall here is 2.4 g, and 0.014 is how rare a shortfall that big would be on a line that was set correctly.

=== step === concept
## Type I error: how often a correctly set line is rejected

At \(\alpha\) = 0.05 we rejected \(H_0\) and stopped the line. That decision can be wrong, and it can be wrong in two different directions. Here is the first.

Suppose the line is set perfectly and does fill to 250 g on average. Run the same test on 2,000 mornings of 30 bags each, and count how often it tells the plant to stop a line that was fine all along.

```r
# Run 2,000 tests on samples from a line that genuinely fills to 250 g
set.seed(5)
false_alarms <- replicate(2000, {
  correct_line <- rnorm(30, mean = 250, sd = 5)
  t.test(correct_line, mu = 250)$p.value
})

sum(false_alarms < 0.05)
#> [1] 94
mean(false_alarms < 0.05)
#> [1] 0.047
```

94 of the 2,000 tests came in under 0.05 and rejected \(H_0\). But \(H_0\) was true in all 2,000 runs, by construction, so all 94 of those rejections are wrong. Each one is a **Type I error**: rejecting \(H_0\) when \(H_0\) is true.

The rate is 0.047. That is 0.05 handed back to us, and it is no coincidence.

[KEY INSIGHT]
The significance level is the Type I error rate. Setting \(\alpha\) = 0.05 is agreeing, in advance, to stop a correctly set line about 5 times in every 100 tests. Move it to 0.01 and false alarms drop to about 1 in 100, which is what the stricter cutoff of 2.756 was doing.

There are four ways the decision and the truth can line up, and two of them are mistakes.

| | The line really fills to 250 g | The line really is off 250 g |
|---|---|---|
| Test rejects H0 | Type I error, a false alarm | Correct decision |
| Test does not reject H0 | Correct decision | Type II error, a miss |

Those 94 rejections sit in the top left cell. The bottom right cell is the other mistake, and it is the one nobody stumbles into by accident, because nothing in the output flags it.

=== step === widget
## Type II error and power: how often a light line passes the test

Now the other direction. This time the line really is light, filling to 247.6 g on average, off by exactly the 2.4 g we measured. Run 2,000 tests on that line and count how often the test catches it.

```r
# Run 2,000 tests on a line that really is 2.4 g light
set.seed(6)
light_line <- replicate(2000, {
  one_sample <- rnorm(30, mean = 247.6, sd = 5)
  t.test(one_sample, mu = 250)$p.value
})

sum(light_line < 0.05)
#> [1] 1432
mean(light_line < 0.05)
#> [1] 0.716
```

1,432 of the 2,000 tests rejected \(H_0\) and caught the light line. The other 568 did not, and every one of those is a **Type II error**: failing to reject \(H_0\) when \(H_0\) is false.

The catch rate, 0.716, has a name of its own. It is the **power** of the test: the probability of rejecting \(H_0\) when \(H_0\) really is false. Power and the Type II error rate add to 1, so a power of 0.716 means a genuine 2.4 g shortfall slips past this test about 28% of the time.

Both figures are available without simulating anything.

```r
# Ask for the power of 30 bags, and for the sample size 80 percent power needs
power.t.test(n = 30, delta = 2.4, sd = 5, sig.level = 0.05, type = "one.sample")$power
#> [1] 0.7194598
power.t.test(delta = 2.4, sd = 5, sig.level = 0.05, power = 0.80, type = "one.sample")$n
#> [1] 36.03426
```

`delta` is the shortfall you want to be able to catch and `sd` is the spread between bags. With 30 bags the power is 0.719, which matches the 0.716 we simulated. To reach the usual target of 0.80, the calculation puts the sample at 36.03 bags, which in practice means 37.

Power depends on three things: the size of the effect you are trying to catch, the number of observations, and the significance level. The curve below fixes the level, steps the effect, and moves the sample size.

::widget power-curve

That curve carries its own numbers rather than the bag weights. It plots power against sample size for a comparison of two groups, at three effect sizes measured in standard deviations. Our case in those units is 2.4 / 5 = 0.48, which is its medium setting, and the readout there gives 63 per group. That is more than our 37 because comparing two groups costs more observations than comparing one group against a fixed number.

What carries over is the shape of the curve. Power climbs steeply while the sample is small and then flattens near the top, so the first extra bags add far more power than the last ones, and halving the effect you want to catch roughly quadruples the sample you need.

[WARNING]
A test that does not reject \(H_0\) is not evidence that \(H_0\) is true. With 30 bags this test misses a real 2.4 g shortfall 28% of the time, so "we found nothing" and "there is nothing" are different statements. Report the power next to the decision and the difference is visible to whoever reads it.

=== step === concept
## One framework, three tests: t.test, binom.test, prop.test

The five steps have not changed once so far, and they do not change when the question does. Two more questions from the same plant make that concrete.

The filler jams sometimes, and the plant's target is a jam rate of 2%. Over 500 bags there were 18 jams. That is a count out of a total rather than a set of measurements, and the test that matches that shape is `binom.test()`.

The plant also runs a day shift and a night shift. Of 200 bags checked on days, 12 were underweight, against 25 of the 200 checked on nights. Two counts out of two totals, which is `prop.test()`.

```r
# Run the same five steps on two more questions from the same plant
jam_test   <- binom.test(18, 500, p = 0.02)
shift_test <- prop.test(c(12, 25), c(200, 200))

c(fill = bag_test$p.value, jam = jam_test$p.value, shift = shift_test$p.value)
#>       fill        jam      shift
#> 0.01356353 0.01598222 0.03836906
```

Read `binom.test(18, 500, p = 0.02)` as "18 jams in 500 bags, against a claimed rate of 0.02", and `prop.test(c(12, 25), c(200, 200))` as "12 out of 200 against 25 out of 200". Each one carries its own \(H_0\): the jam rate is 0.02, and the two shifts produce underweight bags at the same rate.

All three p-values sit under 0.05. At that level the plant stops the filling line, accepts that the jam rate is above target, and accepts that the two shifts differ.

Here are the shapes of data you meet most often, and the function each one calls for.

| What you measured | The question | R function |
|---|---|---|
| One numeric sample | Is the mean a fixed value? | `t.test(x, mu = ...)` |
| Two numeric samples | Do the two means differ? | `t.test(x ~ group)` |
| One count out of a total | Is the rate a fixed value? | `binom.test(x, n, p = ...)` |
| Two counts out of two totals | Do the two rates differ? | `prop.test(c(x1, x2), c(n1, n2))` |
| Two categorical variables | Are the two related? | `chisq.test(table(a, b))` |

The shape of the data changes and the name of the function changes with it. What sits underneath is identical every time.

The results line up the same way too. Each object carries the same named pieces: the test statistic, the p-value, the estimate and a confidence interval, whichever test produced it.

```r
# Pull the interval out of two different result objects
round(as.numeric(bag_test$conf.int), 2)
#> [1] 245.73 249.47
round(as.numeric(jam_test$conf.int), 4)
#> [1] 0.0215 0.0563
```

The **confidence interval** is the range of values for the quantity under test that this sample does not rule out at the 0.05 level. For the line's mean fill it runs from 245.73 g to 249.47 g, and 250 sits outside it, which is the same rejection read from the other side. For the jam rate it runs from 0.0215 to 0.0563, entirely above the 2% target.

[TIP]
Report the estimate and the interval first, and the p-value last. The p-value says whether \(H_0\) is ruled out. The interval says what the number might actually be, and that is what the plant needs before it can decide how far to adjust the filler.

=== step === quiz
## Quick check: reading a test that comes back at p = 0.21

The plant weighs 30 bags off a second filling line and runs the same test against 250 g. This one comes back at p = 0.21. What has it established?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- The second line is set correctly. ::no
- There is a 21% probability that the second line fills to 250 g on average. ::no
- No evidence at this sample size that the second line is off 250 g, which is not the same as evidence that it is fine: a real 2.4 g shortfall would slip past about 28% of the time. ::ok Yes. A large p-value is a failure to rule out H0, not a confirmation of it, and 30 bags miss a genuine 2.4 g shortfall more than a quarter of the time.
- The second line is off 250 g, but by too little to matter. ::no A p-value never puts a probability on the line, and it never measures the size of anything. p = 0.21 means a correctly set line would produce a sample this far out about 21% of the time, which is ordinary, so nothing has been ruled out. With power of 0.716 against a 2.4 g shortfall, this result is also perfectly consistent with a line that really is light.

=== step === tryit
## Your turn: decide all three tests at the 0.01 level

The plant's engineering manager will not stop anything on evidence weaker than 0.01. All three results are still in memory as `bag_test`, `jam_test` and `shift_test`, so decide each of them again at that stricter level, then find how many bags 80 percent power would need there.

```r
# bag_test, jam_test and shift_test hold the three results already computed.
# Compare the p-value in each one against 0.01.
# Then ask power.t.test how many bags 80 percent power needs at that level,
# for the same 2.4 g shortfall and the same 5 g spread between bags.
# Two lines. Press Check when you have them.
```
::check {"regex": "sig\\.level\\s*=\\s*0?\\.01", "gate": true, "difficulty": "intermediate", "ok": "Right: 0.0136, 0.0160 and 0.0384, and not one of them clears 0.01, though all three cleared 0.05. And 80 percent power at 0.01 needs 54.04 bags, so 55 of them, against the 37 that 0.05 needed. A stricter level costs you sample size.", "no": "Compare the three stored p-values against the stricter bar first, then rerun the same power calculation with sig.level = 0.01 in place of 0.05."}
::solution
```r
# Decide all three tests at the 0.01 level, then size the sample it would need
c(fill = bag_test$p.value, jam = jam_test$p.value, shift = shift_test$p.value) < 0.01
#>  fill   jam shift
#> FALSE FALSE FALSE

power.t.test(delta = 2.4, sd = 5, sig.level = 0.01, power = 0.80, type = "one.sample")$n
#> [1] 54.03664
```

Every one of the three decisions flipped, and no data was collected in between. The level you fix beforehand is as much a part of the result as the measurements are.

=== step === concept
## References

- [On the Problem of the Most Efficient Tests of Statistical Hypotheses](https://doi.org/10.1098/rsta.1933.0009) - Neyman and Pearson (1933), Philosophical Transactions of the Royal Society A 231, 289-337. Where the two error types come from, and the argument for fixing them in advance.
- [The ASA Statement on p-Values: Context, Process, and Purpose](https://doi.org/10.1080/00031305.2016.1154108) - Wasserstein and Lazar (2016), The American Statistician 70(2), 129-133. Six principles, including the flat statement that a p-value does not measure the probability that the hypothesis is true.
- [Statistical tests, P values, confidence intervals, and power: a guide to misinterpretations](https://doi.org/10.1007/s10654-016-0149-3) - Greenland and colleagues (2016), European Journal of Epidemiology 31, 337-350. Twenty-five misreadings, corrected one at a time.
- [The Earth Is Round (p less than .05)](https://doi.org/10.1037/0003-066X.49.12.997) - Cohen (1994), American Psychologist 49(12), 997-1003. On what a p-value cannot tell you, and on why power keeps getting left out of the report.
- [Student's t-Test](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/t.test.html) - R Core Team, the reference page for `t.test()`, including what each field of the result object holds.

=== step === complete
## Quick recap

You ran a hypothesis test end to end on 30 bags of coffee, and then watched both ways it can go wrong. Here is the framework again, with the numbers it produced:

1. **State the two hypotheses.** H0: the line's mean fill is 250 g. H1: it is not.
2. **Compute the test statistic.** The 2.4 g shortfall over a standard error of 0.913 g gives t = -2.6287.
3. **Get the p-value.** 147 of 10,000 samples from a correct line landed at least that far out, and the exact figure on 29 degrees of freedom is 0.01356.
4. **Compare it with the significance level.** Fixed at 0.05 beforehand, 0.01356 clears it and H0 is rejected. Fixed at 0.01, the same number does not.
5. **Report the decision.** Mean fill 247.6 g, 95% interval 245.73 g to 249.47 g, p = 0.01356, rejected at 0.05.

And the two ways the decision goes wrong:

- A **Type I error** rejects a true H0. On a line that was set correctly, 94 of 2,000 tests did exactly that, a rate of 0.047, which is the significance level we chose.
- A **Type II error** misses a false H0. Against a line that really was 2.4 g light, 1,432 of 2,000 tests caught it, so the power was 0.716 and more than a quarter of real shortfalls went through undetected.

Change the shape of the data and the function changes with it, and nothing else does. The same framework ran `binom.test()` on a jam rate and `prop.test()` on two shifts, and it will run whatever test your next question turns out to need.

Congratulations, you made it through. Have a great day!
