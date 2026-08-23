---
title: "Hypothesis testing: the framework, explained"
slug: "Inference-Mini-5"
description: "Every statistical test is one trial: presume nothing is wrong, weigh the evidence, ask how surprising it is, then return a verdict that can fail two ways."
keywords: "hypothesis testing, null hypothesis, alternative hypothesis, p-value, significance level, alpha, type I error, type II error, statistical power, one-sample t-test in R"
mathjax: true
webr: true
date: "2026-08-24"
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
catalog_blurb: "The four stages behind every statistical test, and the two ways it goes wrong."
---

=== step === cover
::eyebrow Inference from Zero
## Hypothesis testing: the framework, explained

Let's say there is a small coffee roaster in town selling beans in bags labelled 250 grams. One regular customer keeps buying them, keeps feeling the bag is light, and one day says it out loud: these bags are short.

So you buy thirty bags and put every one of them on a kitchen scale. They come out at 248.4 grams on average.

That is 1.6 grams under the label. Now, is the roaster cheating, or is 1.6 grams simply what thirty ordinary bags look like when a filling machine is doing its honest best?

Staring at 1.6 will not tell you. What you can do instead is run the accusation as a trial.

The roaster is the defendant, and the court starts out presuming the bags are filled honestly. The thirty weights are the evidence the prosecution brings in. The jury convicts only if that evidence would be too surprising to come from an honest roaster. And the verdict can go wrong in two directions, because an honest roaster can be convicted and a genuine short filler can walk free.

That is hypothesis testing. Every test you will ever run is this same trial with different evidence, and there are four stages to it.

::widget process-flow {"steps":[{"title":"Presume honesty","sub":"the roaster fills to 250 g until shown otherwise"},{"title":"Weigh the evidence","sub":"thirty bags, squeezed down into one number"},{"title":"Ask how surprising","sub":"how often an honest roaster looks this bad"},{"title":"Return a verdict","sub":"convict, or acquit for want of evidence"}]}

So we are going to run all four stages on the thirty bags, one at a time, and by the end you will be able to say exactly what the verdict settles and what it leaves open.

=== step === concept
## How to state H0 and H1 before you look at the data
::prose-only the two hypotheses are sentences, and the table sets those sentences beside their symbols

The trial needs a charge, and the charge has to be written down before a single bag goes on the scale.

First, notice what the dispute is actually about. Nobody cares about these particular thirty bags. The question is what the roaster's filling machine does on average across every bag it will ever pack, and that long-run average has a name and a symbol: \(\mu\), the Greek letter mu, said out loud as "mew".

The presumption of honesty says \(\mu\) is 250 grams. That claim is the **null hypothesis**, written \(H_0\) and said out loud as "H nought". It is the defendant standing there presumed innocent.

The customer's accusation is the **alternative hypothesis**, written \(H_1\): the true average fill is not 250 grams.

| In plain words | In symbols |
|---|---|
| The roaster fills to 250 g on average, and any lightness in these thirty bags came from ordinary variation | \(H_0: \mu = 250\) |
| The roaster's true average fill is something other than 250 g | \(H_1: \mu \neq 250\) |

Only one of the two goes on trial, and it is \(H_0\). That is not politeness toward the roaster, it is arithmetic. "The bags are short" never says by how much, so there is nothing to compute with. "The true average is exactly 250" pins down a whole world of possible batches, and a world that is pinned down is one you can hold your evidence up against.

There is one decision hiding inside \(H_1\), and it is worth making on purpose. Writing \(\mu \neq 250\) charges the roaster with being off the label in either direction, over or under. You could instead charge only \(\mu < 250\), underfilling and nothing else, which is called a **one-sided** test. That is a fair charge only when the question really was one-directional from the start. Reading the thirty weights first, seeing they came out light, and only then writing \(\mu < 250\) is picking the charge to fit the evidence, and it quietly doubles your chance of convicting an honest roaster.

The customer said the bags are wrong, not that the bags are light, so we charge \(\mu \neq 250\) and keep both directions live.

=== step === concept
## The evidence: thirty bags on the scale

With the charge written down, the prosecution can put its evidence on the table. Thirty bags went on one kitchen scale, and every weight was recorded to a tenth of a gram in the order the bags came out of the sack.

Press Run.

```r
# Weigh the thirty bags and measure how far the batch sits from the 250 g label
bag_weights <- c(245.3, 246.8, 248.5, 248.4, 245.8, 239.0, 246.3, 253.7,
                 257.6, 247.9, 248.9, 253.0, 249.0, 245.2, 248.6, 245.5,
                 250.6, 245.9, 247.1, 249.1, 246.6, 254.7, 248.0, 248.1,
                 246.3, 245.0, 247.8, 250.9, 247.8, 254.7)

n_bags    <- length(bag_weights)
mean_bag  <- mean(bag_weights)
sd_bag    <- sd(bag_weights)
shortfall <- 250 - mean_bag

round(c(bags = n_bags, mean_g = mean_bag, sd_g = sd_bag, short_by_g = shortfall), 4)
#>       bags     mean_g       sd_g short_by_g 
#>    30.0000   248.4033     3.6400     1.5967 
```

So the batch averages 248.4033 grams, which is 1.5967 grams under the label. That 1.6 gram gap is the entire dispute.

The other number in that output matters just as much. The standard deviation is 3.64 grams, so individual bags scatter three or four grams either side of their own average. One bag came in at 239.0 and another at 257.6. A filling machine is not a surgeon.

And that is exactly why 1.6 grams cannot be judged on its own. These thirty bags are a **sample**, so their average is not the roaster's true average \(\mu\), it is one noisy reading of it. Grab a different thirty bags tomorrow and you would get a different number.

[NOTE]
The scale is not on trial here and neither is any single bag. The charge is about \(\mu\), the average of every bag the machine will ever fill, and the thirty bags are only our window onto it.

=== step === concept
## The test statistic: thirty bags as one number

Here is the move that makes the whole framework work.

A gap of 1.6 grams means nothing until you know how much a batch of thirty bags wobbles by itself. If bags came off the line within a tenth of a gram of each other, then 1.6 grams is a scandal. If bags scattered by thirty grams, then 1.6 is nothing at all. So the gap has to be measured against the wobble, and dividing one by the other does exactly that.

The wobble has a name: the **standard error** of the mean. Individual bags scatter with a standard deviation of 3.64 grams, but we are not judging one bag, we are judging the average of thirty. Averages are steadier than the things they average, and they get steadier the more you average, which is why the standard error is the standard deviation divided by the square root of the sample size.

Put the gap on top and the standard error underneath and you get the **t statistic**:

\[ t = \frac{\bar{x} - \mu_0}{s / \sqrt{n}} \]

Reading it piece by piece: \(\bar{x}\) is the average of the bags we weighed, \(\mu_0\) is the value \(H_0\) claims, \(s\) is the standard deviation of the bags, and \(n\) is how many we weighed. Let's compute it by hand.

```r
# Turn the whole batch into one number: the gap measured in standard errors
se_bag <- sd_bag / sqrt(n_bags)
t_hand <- (mean_bag - 250) / se_bag

round(c(standard_error = se_bag, t = t_hand), 4)
#> standard_error              t 
#>         0.6646        -2.4026 
```

The standard error is 0.6646 grams. That is the typical distance between the average of thirty bags and the machine's true average, purely from which thirty bags you happened to grab. Our batch missed the label by 1.5967 grams, which is 2.4026 of those typical distances, and it missed on the low side, which is what the minus sign says.

Every one-sample test in R runs this same arithmetic, so the number should come back identical from `t.test()`.

```r
# Check the hand computation against the one R does internally
bag_test <- t.test(bag_weights, mu = 250)
bag_test$statistic
#>         t 
#> -2.402583 
```

It is the same value, to every digit shown.

Thirty weights have now become one number. Whatever evidence you bring to court, it collapses into a single statistic like this one, and how that statistic behaves in an honest world is something we can actually work out.

[KEY INSIGHT]
A test statistic is your evidence measured in units of its own noise. A t of -2.4026 says the batch sits 2.4026 typical wobbles below the claim, and that is a sentence you can compare against a world where nothing is wrong.

=== step === concept
## What the world looks like if the roaster is honest

The jury now needs to know what an honest roaster looks like. Specifically: if the machine really does fill to 250 grams on average, how far off does a batch of thirty land on an ordinary day?

We cannot ask this roaster for ten thousand more batches. What we can do is build the honest world out of the batch we already have. Take the thirty weights and slide all of them up by 1.5967 grams, so their average lands exactly on 250. The spread between bags stays exactly as it was, because sliding every value by the same amount moves the middle without touching the scatter.

```r
# Slide the same thirty weights so their average is exactly 250 g, spread untouched
honest_weights <- bag_weights - mean_bag + 250
c(mean = mean(honest_weights), sd = sd(honest_weights))
#>       mean         sd 
#> 250.000000   3.639959 
```

The average is exactly 250 and the scatter is the same 3.64 grams. That is a roaster who is honest by construction, still filling with a real machine's sloppiness.

Now we run that honest roaster ten thousand times. Each run draws thirty bags from the honest world, with replacement so the same bag can be picked twice, and computes the t statistic for that batch against the 250 gram claim. The red line marks our real batch at -2.4026.

```r
# Collect the t statistics from 10,000 batches produced by an honest roaster
set.seed(4)
null_t <- replicate(10000, {
  redraw <- sample(honest_weights, size = 30, replace = TRUE)
  (mean(redraw) - 250) / (sd(redraw) / sqrt(30))
})

hist(null_t, breaks = 40, col = "grey85", border = "white",
     main = "10,000 batches of thirty from a roaster who fills honestly",
     xlab = "t statistic")
abline(v = t_hand, col = "red", lwd = 3)
```

Let's read that output. The grey pile is centred on zero, which is what honesty is supposed to look like, because most batches from a 250 gram machine do land near the label. However, it is not a spike at zero. It spreads out past two and three standard errors on both sides, because thirty bags is a small window and small windows are noisy.

`set.seed(4)` just fixes which ten thousand batches you get, so your histogram matches mine.

Our red line is not off the edge of the picture. It sits out in the thin part of the left tail, where honest batches do land, only rarely. So how rare is rare? A jury needs a number for that, and counting the bars gives us one.

=== step === concept
## The p-value: how surprising this evidence would be

The count is simple. Out of the ten thousand honest batches, how many produced evidence at least as bad as ours?

At least as bad means at least 2.4026 standard errors away from the claim, in either direction, because the charge we wrote covers both directions.

```r
# Count the honest batches whose evidence was as bad as ours, or worse
sum(abs(null_t) >= abs(t_hand))
#> [1] 246
mean(abs(null_t) >= abs(t_hand))
#> [1] 0.0246
```

So 246 of the 10,000 honest batches matched our evidence or beat it, which is a share of 0.0246.

That is the **p-value**. Nothing was memorised here and nothing was looked up. It is a count of honest worlds whose evidence looked as bad as the evidence in front of the jury, divided by how many honest worlds you built.

There is also a formula version. The pile of honest t statistics has a known shape, called the t distribution, and how wide that shape sits is set by a single number: the **degrees of freedom**, which for one sample is \(n - 1\), so 29 here. Hand `pt()` that shape and it reads the tail area straight off it, and doubling the answer counts both tails.

```r
# Read the same tail area off the t distribution instead of counting simulations
2 * pt(-abs(t_hand), df = n_bags - 1)
#> [1] 0.02290463
bag_test$p.value
#> [1] 0.02290463
```

0.0229 from the formula and 0.0246 from ten thousand simulated batches. Two ways of asking the same question, and they land in the same place. The formula gets there in one line of code, while the simulation gets there by showing you every world it counted.

So the evidence against this roaster would turn up in roughly two of every hundred batches pulled from an honest machine.

Now read that sentence again and notice where the probability sits. It sits on the evidence, inside a world where the roaster is honest. It says nothing whatsoever about how likely the roaster is to be honest.

[KEY INSIGHT]
A p-value is the share of honest worlds whose evidence matches or beats yours. Here: if the machine truly fills to 250 g on average, a batch of thirty landing 1.6 g off or worse would still show up about 2 times in every 100.

=== step === widget
## What happens to the p-value when the evidence gets stronger?

Let's take the grey pile of honest batches and smooth it into a curve. It keeps the same shape, still centred at zero and still thinning out as you move away in either direction.

The slider moves your evidence. It is not measured in grams, it is measured in standard errors, the same units the t statistic uses, so our batch starts it at 2.40.

::widget null-distribution {"tails": 2, "start": 2.4, "label": "how far the evidence sits from the claim"}

The shaded orange area is the p-value: the share of honest batches whose evidence reaches at least as far out as yours, counted on both sides. At 2.40 the readout says 0.016, which sits in the same neighbourhood as the 0.023 we just counted. The curve drawn here is the plain bell shape, while thirty bags produce one with slightly heavier tails, and heavier tails leave a little more area out past 2.40. The third decimal is not what this slider is for. What it shows is which way the area moves.

Now drag it. Push the evidence further out, as if the bags had come back even lighter, and the shaded slice keeps shrinking. Pull it back toward zero, as if the batch had landed almost on the label, and the slice swells until it is most of the curve.

That is the whole relationship. Evidence further from the claim leaves a smaller slice of honest worlds able to match it, and a smaller slice is a smaller p-value.

=== step === quiz
## Quick check: what does p = 0.023 claim?

The thirty bags came in 1.6 g under the label and the trial returned p = 0.023. Which sentence reads that correctly?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- There is a 2.3% chance the roaster fills honestly. ::no
- If the roaster fills to 250 g on average, a batch of thirty landing this far off or worse would turn up about 2 times in every 100. ::ok Exactly right. It assumes honesty first, then reports how ordinary our evidence would be inside that assumption. That is the only direction a p-value ever runs.
- There is a 97.7% chance the roaster is short. ::no
- The bags are running about 2.3% under the label. ::no Three of these four put the probability on the roaster, or on the size of the shortfall. A p-value only ever says how often evidence like yours appears when the defendant is honest. The shortfall here is 1.6 g, and 0.023 is how rarely an honest machine produces a batch that far off.

=== step === concept
## Alpha, and the Type I error rate it sets

We have a p-value. We still do not have a verdict, because nobody has said how surprising is surprising enough.

That threshold is called **alpha**, written \(\alpha\), and the jury has to pick it before reading the evidence. Convict when the p-value falls below \(\alpha\), acquit otherwise. A conviction is what everyone calls a **statistically significant** result, and the phrase means that much and no more: the p-value came in under a bar somebody picked. Almost everybody picks 0.05, and it is worth saying plainly that 0.05 is a convention, not a fact about the world. Nobody ever derived it.

What alpha really buys you shows up when you put honest roasters on trial and watch what happens. In the code below, two thousand roasters each fill thirty bags with a machine that averages exactly 250 grams and scatters by 3.64, the same sloppiness we measured. Every one of them is innocent, and every one of them goes through the same trial.

```r
# Put 2,000 genuinely honest roasters on trial and count how many get convicted
set.seed(21)
honest_verdicts <- replicate(2000, {
  batch <- rnorm(30, mean = 250, sd = 3.64)
  t.test(batch, mu = 250)$p.value
})

sum(honest_verdicts < 0.05)
#> [1] 108
mean(honest_verdicts < 0.05)
#> [1] 0.054
```

So 108 of those 2,000 honest roasters were convicted, a rate of 0.054.

Those are not bugs and they are not bad luck. That is the bar doing precisely the job it was set to do. A bar of 0.05 says "convict whenever the evidence lands in the most extreme 5% of what honesty produces", and honesty produces that evidence 5% of the time. So when you set the bar, you have already set your rate of convicting the innocent.

Convicting an innocent defendant has a standard name: a **Type I error**, also called a false positive. Its long-run rate is \(\alpha\), by construction.

[WARNING]
Nothing in the framework promises that a conviction is correct. It promises that if you keep the bar at 0.05, roughly 5 in every 100 honest defendants you test will be convicted anyway. When a wrong conviction is expensive, drop the bar to 0.01 and demand stronger evidence.

=== step === tryit
## Your turn: what does a stricter bar buy you?

Suppose the trading standards office refuses to act on anything weaker than 0.01. `honest_verdicts` still holds the 2,000 p-values from the roasters who fill honestly, and 108 of them cleared the 0.05 bar.

Count how many clear the stricter 0.01 bar, then write that count as a share of all 2,000.

```r
# honest_verdicts holds 2,000 p-values from roasters who fill honestly.
# 108 of them fell below 0.05.
# Count how many fall below a stricter bar of 0.01, then write that
# count as a share of all 2,000.
# Two lines. Press Check when you have them.
```
::check {"regex": "honest_verdicts\\s*<\\s*0?\\.01", "gate": true, "difficulty": "beginner", "ok": "Right: 23 out of 2,000, a share of 0.0115. Move the bar from 0.05 to 0.01 and wrongful convictions drop from about 5 in 100 to about 1 in 100, because the bar you pick IS the rate you accept.", "no": "Same counting move as the one above, with a stricter bar: `sum(honest_verdicts < 0.01)`, then the same line with `mean()` in place of `sum()`."}
::solution
```r
# Count the honest roasters a 0.01 bar would still convict
sum(honest_verdicts < 0.01)
#> [1] 23
mean(honest_verdicts < 0.01)
#> [1] 0.0115
```

Whatever bar you choose becomes your wrongful conviction rate. Now that looks like a free win for strictness, and it is not, because a court that almost never convicts the innocent is also a court that lets more of the guilty walk.

=== step === concept
## Type II error: when a short filler walks free

So far every roaster on the stand has been honest. Turn the truth around and put two thousand genuine short fillers on trial instead.

Each one below runs a machine averaging 248.4 grams, exactly the 1.6 gram shortfall we suspect, with the same 3.64 grams of scatter. Every one of them is guilty. Each fills thirty bags and faces the same trial at the same 0.05 bar.

```r
# Put 2,000 roasters who really are 1.6 g short on trial and count the ones caught
set.seed(7)
short_verdicts <- replicate(2000, {
  batch <- rnorm(30, mean = 248.4, sd = 3.64)
  t.test(batch, mu = 250)$p.value
})

sum(short_verdicts < 0.05)    # caught
#> [1] 1270
sum(short_verdicts >= 0.05)   # walked free
#> [1] 730
mean(short_verdicts < 0.05)   # the share caught
#> [1] 0.635
```

So 1,270 of them were caught, and 730 walked out of the building.

Read that second number slowly, because this is the half of the framework most people never meet. These roasters were all short, every single one of them, by exactly the amount we care about. More than a third of them produced thirty bags whose evidence was too weak to convict, and the court let them go.

Failing to convict a guilty defendant is a **Type II error**, a false negative, and its rate is written \(\beta\). Here \(\beta\) is 730 in 2,000, or 0.365.

The flip side of that rate has a name you will meet constantly: **power**, which is \(1 - \beta\), the share of guilty defendants a trial does catch. This trial has power 0.635. Thirty bags catches a 1.6 gram shortfall about two times in three.

[KEY INSIGHT]
Every trial has two failure modes pulling against each other. Tighten the bar and you convict fewer innocents and catch fewer of the guilty. Loosen it and you catch more of the guilty and convict more innocents. There is no setting that removes both.

=== step === widget
## How many bags would it take to settle it?

Catching a real shortfall two times in three is not a court anyone would trust. The way out is not a different bar, it is more evidence.

Power climbs with the size of the wrong you are hunting and with how much evidence you collect. The curve below shows both. It is drawn for a two-group comparison, with the size of the wrong measured in standard deviations, and the marker sits where power reaches 0.80, the level most people treat as adequate. Switch the effect size and watch the whole curve slide.

::widget power-curve

A big wrong is cheap to catch and a small one is expensive. That is the whole shape of it.

Our roaster's suspected shortfall is small next to the machine's own sloppiness: 1.5967 grams of wrongdoing against 3.64 grams of scatter. `power.t.test()` works out how many bags that combination needs.

```r
# How many bags would catch a 1.6 g shortfall four times out of five?
power.t.test(delta = 1.5967, sd = 3.64, sig.level = 0.05,
             power = 0.80, type = "one.sample")
#> 
#>      One-sample t test power calculation 
#> 
#>               n = 42.75145
#>           delta = 1.5967
#>              sd = 3.64
#>       sig.level = 0.05
#>           power = 0.8
#>     alternative = two.sided
```

You cannot weigh three quarters of a bag, so round it up to 43. Thirty was not quite enough evidence to bring this charge properly, and knowing that before you start weighing is worth a great deal more than learning it afterwards.

=== step === concept
## The four outcomes of any test
::prose-only the four outcomes are a two by two grid of truth against verdict, and the table below is that grid

Two things can be true about the roaster, and the jury can return two verdicts, so any trial ends up in one of four places.

| | The roaster is honest | The roaster really is short |
|---|---|---|
| **Convict** (reject \(H_0\)) | Type I error, rate \(\alpha\) | Correct catch, rate \(1 - \beta\), the power |
| **Acquit** (fail to reject \(H_0\)) | Correct acquittal, rate \(1 - \alpha\) | Type II error, rate \(\beta\) |

Two cells are right and two are wrong, and we have already counted both of the wrong ones: 108 honest roasters convicted in the top left, and 730 short fillers acquitted in the bottom right.

The two error rates are set by different things, which is the part worth remembering. You choose \(\alpha\) directly when you pick the bar. You never choose \(\beta\), because it falls out of how big the real wrongdoing is, how much evidence you gathered, and where you set the bar.

Notice also what the bottom row is called. It is not "accept \(H_0\)", it is **fail to reject** \(H_0\). That wording is deliberate, and it matters more than it looks.

=== step === quiz
## Quick check: which mistake did this jury make?

Two roasters went through the same trial at the same 0.05 bar. Roaster A fills to exactly 250 g on average, and the trial convicted it. Roaster B is genuinely 1.6 g short, and the trial let it go.

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Roaster A is a Type II error and roaster B is a Type I error. ::no
- Roaster A is a Type I error and roaster B is a Type II error. ::ok Yes. Type I is convicting the honest, and its rate is the bar you picked. Type II is letting a genuine short filler walk, and its rate is whatever your evidence and your bar leave behind.
- Both are Type I errors, because both verdicts came out wrong. ::no
- Neither is an error, because the trial followed its own rules in both cases. ::no Both verdicts are wrong, and they are wrong in opposite directions. Convicting honest roaster A is a Type I error, which happens at rate alpha no matter how carefully the trial is run. Letting short filler B walk is a Type II error, at rate beta. A trial that follows every rule still produces both, which is exactly why they have names.

=== step === concept
## Why fail to reject is not the same as honest

An acquittal reports one thing only: the evidence brought to court was not strong enough to convict. It never reports that the defendant is innocent.

The cleanest way to see that is to weigh a roaster you already know is guilty. The ten bags below come from a machine averaging 248.4 grams, short by the same 1.6 grams as before. Guilt is not in question here, because we built the machine ourselves.

```r
# Weigh only ten bags from a roaster who really is 1.6 g short
set.seed(26)
thin_case <- round(rnorm(10, mean = 248.4, sd = 3.64), 1)
thin_case
#>  [1] 240.6 252.6 246.6 251.4 246.9 248.9 248.9 251.7 248.3 249.9
mean(thin_case)
#> [1] 248.58
t.test(thin_case, mu = 250)$p.value
#> [1] 0.2237402
```

The p-value comes back at 0.224, nowhere near the bar. So this roaster walks free, and this roaster is short.

Nothing went wrong in that trial. Ten bags against 3.64 grams of scatter is thin evidence, and thin evidence acquits nearly everybody, guilty or not. If you wrote "the bags are fine" in your report you would be stating something the trial never established.

The honest sentence is duller and much more useful: with ten bags we could not tell a 1.6 gram shortfall apart from ordinary machine variation.

[WARNING]
A large p-value is not evidence of honesty. It is the absence of evidence of wrongdoing, and those two are only the same thing when you gathered enough evidence to have caught the wrongdoing had it been there.

=== step === concept
## Report the shortfall and its range, not just the verdict

Let's come back to the real batch. A verdict on its own is a poor thing to hand anyone, because it hides the number they actually need, which is how short the bags are.

`t.test()` has been carrying that number all along. Here is its full output for the thirty bags.

```r
# Read the complete verdict on the thirty bags
bag_test
#> 
#> 	One Sample t-test
#> 
#> data:  bag_weights
#> t = -2.4026, df = 29, p-value = 0.0229
#> alternative hypothesis: true mean is not equal to 250
#> 95 percent confidence interval:
#>  247.0442 249.7625
#> sample estimates:
#> mean of x 
#>  248.4033 
```

Every line of that output is now readable. `t = -2.4026` is the evidence in standard errors. `df = 29` is the thirty bags minus one, the shape of the honest pile we simulated. `p-value = 0.0229` is the share of honest batches that would look this bad. `mean of x` is the batch average.

The line worth the most is the confidence interval, 247.0442 to 249.7625 grams. That is the range of true average fills that sit comfortably with the evidence we collected. Subtract each end from the label and it becomes a range for the shortfall itself.

```r
# Turn the interval on the true average fill into a range for the shortfall
short_low  <- 250 - bag_test$conf.int[2]
short_high <- 250 - bag_test$conf.int[1]

cat("short by  :", sprintf("%.2f", shortfall), "g\n")
cat("95% range :", round(short_low, 2), "to", round(short_high, 2), "g short\n")
cat("p-value   :", round(bag_test$p.value, 4), "\n")
#> short by  : 1.60 g
#> 95% range : 0.24 to 2.96 g short
#> p-value   : 0.0229 
```

The bags are 1.60 grams light in this batch, and the true shortfall is somewhere between 0.24 and 2.96 grams. Both ends of that range matter to a decision. A quarter of a gram is a rounding error nobody would act on. Nearly three grams is more than 1% of the product and worth a letter from a lawyer. Thirty bags cannot tell those two apart, which is the same message the power calculation gave.

[TIP]
Report the size of the wrong and its range first, and the p-value last. A bare verdict hides the two things a decision actually needs, which are how big the problem looks and how much that answer could still move.

=== step === concept
## The same trial with different evidence: choosing the test

The four stages never change. Presume nothing is wrong, squeeze the evidence into one statistic, work out how often honesty produces evidence that bad, and return a verdict against a bar you set beforehand.

What changes is only the shape of the evidence, and the shape of the evidence picks the function.

The same thirty bags can be brought to court in more than one form. As thirty weights, they are a column of numbers. As a count of how many came in under 250, they are 23 out of 30. Split by which of the roaster's two filling lines packed them, they are two groups to compare.

```r
# Four kinds of evidence from the same bags, four functions, one framework
under_label <- sum(bag_weights < 250)          # bags that came in below the label
bag_line    <- rep(c("A", "B"), each = 15)     # which filling line packed each bag

t.test(bag_weights, mu = 250)$p.value             # an average against a claimed value
#> [1] 0.02290463
binom.test(under_label, n_bags, p = 0.5)$p.value  # a count against a claimed share
#> [1] 0.005222879
t.test(bag_weights ~ bag_line)$p.value            # two groups, averages compared
#> [1] 0.8413721
wilcox.test(bag_weights ~ bag_line)$p.value       # two groups, no bell-curve assumption
#> [1] 0.975559
```

Take them one at a time.

The first is the trial we have been running all along. The second brings a different charge from the same bags: if the machine is centred on 250 and misses in both directions equally, then about half the bags should land under the label, and 23 out of 30 is a long way from half. That evidence convicts more firmly than the averages did, at p = 0.005.

The last two compare the roaster's filling lines against each other rather than against the label, and both acquit. Line A and line B are as alike as two halves of one batch ought to be. `wilcox.test()` asks the same question as `t.test()` without leaning on the bell-curve shape, which is what you reach for when the numbers are skewed or the sample is small.

| The evidence you have | The question | The function |
|---|---|---|
| One column of numbers | Is the average different from a claimed value? | `t.test(x, mu = ...)` |
| A count out of a total | Is the share different from a claimed share? | `binom.test(k, n, p = ...)` |
| Two groups of numbers | Do the two averages differ? | `t.test(x ~ group)` |
| Two groups, skewed or small | Do the two groups differ at all? | `wilcox.test(x ~ group)` |
| Two categorical columns | Are the two variables related? | `chisq.test(table(a, b))` |

Learn one of these properly and you have learned all of them, because every row returns a statistic, a p-value and, where it makes sense, an interval. The function changes with the evidence. The trial does not.

=== step === quiz
## Quick check: which claim goes on trial?

A bus company advertises an average wait of 8 minutes at a stop. Riders say the real wait is longer, so you time 25 waits and run a test.

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- H0 is that the average wait is longer than 8 minutes, because the riders' claim is the one being tested. ::no
- H0 is that the true average wait is 8 minutes, and failing to reject it proves the 8 minute claim is correct. ::no
- H0 is that the true average wait is 8 minutes, and failing to reject it means 25 waits were not surprising enough to convict, not that the claim is true. ::ok Exactly. The specific claim is the one you can compute with, so it is the one that stands trial, and an acquittal reports thin evidence rather than innocence.
- H0 should be whichever of the two claims the timings end up supporting, so you decide it after timing the waits. ::no H0 is always the specific, computable claim, here the 8 minute average, and it is written before any data arrives. Choosing it afterwards, or reading a non-rejection as proof, are the two ways this goes wrong most often.

=== step === tryit
## Your turn: run the whole trial on a second batch

A second delivery arrives and you weigh twelve bags from it. Run the same trial on them against the 250 gram label: the average, how far under the label it sits, and the verdict from `t.test()`.

Before you run it, make a prediction. This batch is further under the label than the first one was. Does the case against the roaster get stronger?

```r
# batch_two holds twelve bags from a second delivery, weighed the same way.
# Run the same trial on these twelve: their average, how far under 250 g
# that average sits, and the full t.test against the 250 g label.
# Press Check when you have it.
batch_two <- c(248.3, 245.7, 241.4, 250.2, 247.4, 253.2,
               245.8, 249.2, 247.1, 254.6, 245.3, 248.7)
```
::check {"regex": "t\\.test[(]\\s*batch_two", "gate": true, "difficulty": "intermediate", "ok": "That is it: 248.075 g, so 1.93 g under the label, a wider gap than the first batch. And yet p = 0.088, which acquits. Twelve bags is thin evidence, and thin evidence acquits even when the shortfall is real.", "no": "Three lines. `mean(batch_two)`, then `250 - mean(batch_two)`, then `t.test(batch_two, mu = 250)` for the verdict."}
::solution
```r
# Run the whole trial on the second delivery
mean(batch_two)
#> [1] 248.075
250 - mean(batch_two)
#> [1] 1.925
t.test(batch_two, mu = 250)
#> 
#> 	One Sample t-test
#> 
#> data:  batch_two
#> t = -1.8723, df = 11, p-value = 0.08798
#> alternative hypothesis: true mean is not equal to 250
#> 95 percent confidence interval:
#>  245.812 250.338
#> sample estimates:
#> mean of x 
#>   248.075 
```

So we get a bigger gap and a weaker case. The shortfall grew from 1.60 to 1.93 grams, and the p-value went the wrong way, from 0.023 to 0.088.

Twelve bags is what did it. Fewer bags means a larger standard error, a smaller t statistic and a wider interval, which here runs from 4.19 grams short all the way to 0.34 grams over. Evidence that loose cannot convict anybody, whatever the average happens to say.

=== step === quiz
## Quick check: reading a verdict correctly

The thirty bag trial returned a batch average of 248.4033 g, a 95% interval on the true average fill of 247.0442 to 249.7625 g, and p = 0.0229. Which sentence reports that without overclaiming?

::quiz {"correct": 2, "gate": true, "difficulty": "advanced"}
- The test proves the roaster underfills by 1.6 g. ::no
- The bags run 1.6 g under label, with a 95% range from 0.24 g to 2.96 g short, and evidence this far off would appear in about 2 of every 100 honest batches of thirty. ::ok That is the whole verdict: the size of the wrong, how precisely it is pinned down, and how ordinary the evidence would be if nothing were wrong. Nothing in it claims a probability about the roaster.
- Since p = 0.0229 is below 0.05, there is a 97.7% chance the bags are short. ::no
- The result is significant, so the shortfall is big enough to act on. ::no Each of the other three overclaims in a different way. A test never proves a value, one minus the p-value is not the chance you are right, and significance says nothing about whether a shortfall is worth acting on. That last judgement comes from the size of the gap and its range, which here runs from a trivial 0.24 g to a serious 2.96 g.

=== step === concept
## References

- [On the Problem of the Most Efficient Tests of Statistical Hypotheses](https://doi.org/10.1098/rsta.1933.0009) - Neyman and Pearson (1933), Philosophical Transactions of the Royal Society A 231, 289-337. The paper that set up the two kinds of error and the trade-off between them.
- [The ASA Statement on p-Values: Context, Process, and Purpose](https://doi.org/10.1080/00031305.2016.1154108) - Wasserstein and Lazar (2016), The American Statistician 70(2), 129-133. Six principles, including the flat statement that a p-value is not the probability that the hypothesis is true.
- [Statistical tests, P values, confidence intervals, and power: a guide to misinterpretations](https://doi.org/10.1007/s10654-016-0149-3) - Greenland and colleagues (2016), European Journal of Epidemiology 31, 337-350. Twenty-five common misreadings, corrected one at a time.
- [Statistical Power Analysis for the Behavioral Sciences](https://doi.org/10.4324/9780203771587) - Cohen (1988), 2nd edition, Routledge. The standard treatment of the miss rate and how sample size drives it.
- [Student's t-Test](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/t.test.html) - R Core Team, the documentation for `t.test()`.

=== step === complete
## Quick recap

You ran an accusation as a trial, from the charge sheet to the verdict, and every number came off the page in front of you.

- The charge is written before the evidence arrives. \(H_0\) is the specific, computable claim, here that the machine fills to 250 g on average, and it is the one that stands trial.
- The evidence gets squeezed into one statistic measured in its own noise. Thirty bags became t = -2.4026.
- The p-value counts honest worlds whose evidence was as bad as yours. You counted 246 out of 10,000, and the formula agreed at 0.0229.
- Alpha is a price, not a law. A 0.05 bar convicted 108 of 2,000 honest roasters, which is what a 5 in 100 wrongful conviction rate looks like.
- The other error is the quiet one. At that same bar, 730 of 2,000 genuine short fillers walked free, so failing to reject is never proof that nothing is going on.
- The four stages never change. Swap the evidence and you swap the function, from `t.test()` to `binom.test()` to `wilcox.test()`, and the trial runs exactly the same way.

So when someone asks what the coffee test showed:

"The bags run 1.6 g under label, somewhere between 0.24 and 2.96 g short, and a batch this far off would turn up in about 2 of every 100 batches from an honest machine."

How big a wrong has to be before it is worth acting on turns out to be a completely separate question from whether it is real, and that one deserves a day of its own. Congratulations, you made it through. Have a great day!
