---
title: "Law of Large Numbers vs CLT: the real difference"
slug: "Foundations-Mini-3"
description: "The Law of Large Numbers and the Central Limit Theorem answer different questions about a coin flip. See both play out and prove it with real R simulation."
keywords: "Law of Large Numbers, Central Limit Theorem, LLN vs CLT, sampling distribution, standard error, convergence in probability, z-score, coin flip simulation"
mathjax: true
webr: true
date: "2026-09-09"
post_type: "LESSON"
course_id: "foundations-extras"
course_title: "Probability Foundations"
course_lesson: "3"
course_total: "6"
course_landing: "/dashboard.html"
course_prev: "Foundations-Mini-2"
course_next: ""
curriculum_id: "0.0.23"
lesson_access: "windowed"
catalog_blurb: "See why the two most confused theorems in statistics answer different questions."
---

=== step === cover
## Law of Large Numbers vs CLT: the real difference

Today let's understand the real difference between two of the most confused ideas in statistics: the Law of Large Numbers and the Central Limit Theorem.

Flip a fair coin 50 times, and after every flip, track what proportion of the flips so far came up heads. Press Run.

```r
# Flip a fair coin 50 times and track the running proportion of heads
set.seed(101)
flips_50 <- rbinom(50, 1, 0.5)
running_50 <- cumsum(flips_50) / seq_along(flips_50)

plot(running_50, type = "l",
     xlab = "Flip number", ylab = "Running proportion of heads",
     main = "50 flips of a fair coin")
abline(h = 0.5, col = "red", lty = 2)

round(running_50[c(17, 50)], 4)
#> [1] 0.6471 0.4800
```

Look at the line. By the 17th flip, 65% of the flips so far are heads, well away from the 50% you would expect from a fair coin. By the 50th flip that has drifted back down to 48%, still bouncing, not sitting still.

That single run raises two separate questions, both answered with nothing but this same coin.

::widget process-flow {"steps":[{"title":"Where does it land?","sub":"the destination a long run eventually settles toward"},{"title":"How far off is normal?","sub":"the spread you should expect at any stop along the way"}]}

=== step === concept
## What the Law of Large Numbers says

The pattern you just watched, a coin's running proportion of heads settling down as the flips pile up, has a name: the Law of Large Numbers, LLN for short.

For a fair coin, the true proportion of heads you would get if you could flip forever is 0.5. That true value is called the population mean, written $\mu$. The running proportion after $n$ flips is called the sample mean, written $\bar{X}_n$. The Law of Large Numbers says that as $n$ grows, $\bar{X}_n$ gets closer and closer to $\mu$.

Let's see it over a much longer run, and check the running proportion at four points along the way.

```r
# Extend to 10,000 flips and check the running proportion at four points
set.seed(202)
coin_long <- rbinom(10000, 1, 0.5)
running_long <- cumsum(coin_long) / seq_along(coin_long)

plot(running_long, type = "l", log = "x",
     xlab = "Number of flips (log scale)", ylab = "Running proportion of heads",
     main = "10,000 flips: the running proportion settles near 0.5")
abline(h = 0.5, col = "red", lty = 2)

running_long[c(10, 100, 1000, 10000)]
#> [1] 0.3000 0.5200 0.5010 0.4942
```

At 10 flips the running proportion is 0.30, thirty percent, a full 20 percentage points off 0.5. At 100 flips it is 0.52, much closer. At 1,000 flips it is 0.5010, closer still. At 10,000 flips it is 0.4942, within about half a percentage point of 0.5.

Notice that the gap does not shrink in a straight line. The value at 1,000 flips is actually closer to 0.5 than the value at 10,000 flips. LLN never guarantees a smooth march toward the target, only that the running proportion keeps closing in on it as flips accumulate, with wiggles along the way.

The formal version of LLN, called convergence in probability, states this precisely:

$$\bar{X}_n \xrightarrow{P} \mu$$

which means: for any small tolerance $\epsilon > 0$,

$$P(|\bar{X}_n - \mu| > \epsilon) \to 0 \quad \text{as } n \to \infty$$

In plain words, the chance that the running proportion sits farther than $\epsilon$ away from 0.5 keeps shrinking as $n$ grows, for any tolerance you pick, however small.

[KEY INSIGHT]
LLN is a statement about the chance of a large gap, not a promise about any one run. It says the odds of straying far from 0.5 fall as $n$ grows. It never says a specific run will hit 0.5 exactly, or that it will get there fast.

=== step === quiz
## Quick check: what LLN actually promises

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- It guarantees that a single 10,000-flip run lands at exactly 0.5 heads by the last flip. ::no
- It means that once the running proportion touches 0.5, it stays exactly at 0.5 from then on. ::no
- It says the chance of the running proportion sitting far from 0.5 shrinks toward zero as flips pile up, without promising a fast or exact landing for any one run. ::ok Right. At 10 flips in the 10,000-flip run from a moment ago, the running proportion sat at 0.30, a full 20 points off 0.5. LLN only says gaps that size get rarer as the flip count climbs, not that they cannot happen.
- It guarantees the running proportion is already close to 0.5 within the first 10 or 20 flips. ::no LLN makes no promise about any single run, only about the chance of a large gap shrinking as flips pile up. It does not fix the running proportion at 0.5 forever once it touches it, and it does not guarantee an early landing either. It is a statement about probability, not a guarantee about one run.

=== step === concept
## What the Central Limit Theorem says

LLN told you where the running proportion ends up. It said nothing about how far off you should expect to be if you stopped counting at some fixed point, say after 100 flips. That second question belongs to a different theorem: the Central Limit Theorem, CLT for short.

To answer it, run a different kind of experiment on the same coin. Instead of watching one long run, flip the coin 100 times, record the proportion of heads, then do that whole 100-flip experiment again, and again, 5,000 times over. Each of the 5,000 repeats gives its own proportion of heads. Do the same at 10 flips and 50 flips per experiment too, so you can compare.

```r
# Repeat a 100-flip experiment 5000 times, and do the same at n = 10 and n = 50
set.seed(303)
batch_10 <- replicate(5000, mean(rbinom(10, 1, 0.5)))
set.seed(303)
batch_50 <- replicate(5000, mean(rbinom(50, 1, 0.5)))
set.seed(303)
batch_100 <- replicate(5000, mean(rbinom(100, 1, 0.5)))

par(mfrow = c(1, 3))
hist(batch_10, breaks = 20, col = "lightblue", xlab = "Sample proportion of heads", main = "n = 10")
hist(batch_50, breaks = 20, col = "lightblue", xlab = "Sample proportion of heads", main = "n = 50")
hist(batch_100, breaks = 20, col = "lightblue", xlab = "Sample proportion of heads", main = "n = 100")

round(c(sd(batch_10), sd(batch_50), sd(batch_100)), 4)
#> [1] 0.1585 0.0710 0.0498
round(sqrt(0.25 / c(10, 50, 100)), 4)
#> [1] 0.1581 0.0707 0.0500
```

Look at the three histograms. All three are centered near 0.5, but the one for n = 10 is wide and short, the one for n = 50 is narrower, and the one for n = 100 is narrower still, tall and bunched close to the middle.

The standard deviation of the 5,000 proportions shows the same pattern in numbers. At n = 10 it is 0.1585. At n = 50 it is 0.0710. At n = 100 it is 0.0498. Each of those numbers is almost exactly $\sqrt{0.25/n}$, called the standard error, the CLT's predicted spread for a coin's sample proportion at that sample size.

This is what the Central Limit Theorem says. For a coin with true proportion $p$, the sample proportion $\bar{X}_n$ from $n$ flips is approximately normally distributed:

$$\bar{X}_n \approx N\!\left(p, \frac{p(1-p)}{n}\right) \quad \text{for large } n$$

For a fair coin $p = 0.5$, so $p(1-p) = 0.25$, and the spread shrinks as $n$ grows, exactly what the three histograms just showed you.

[TIP]
A sample size of 30 or more is the usual rule of thumb for the normal shape to be a good approximation. Below that, especially for a lopsided coin, the histogram can still look skewed.

You can build that same picture one experiment at a time. Press a button below, and it runs that many 100-flip experiments and adds each one's head count to a live histogram.

::widget luck-simulator {"trials": 100, "p": 0.5, "observed": 60, "unit": "heads out of 100 flips", "seed": 7}

Before you press anything, the histogram is empty. Click "Run 1,000" and watch the bars pile up in the middle, around 50 heads, with the far ends barely used. That 50 is 100 times 0.5, and the spread you measured a moment ago, 0.0498 as a proportion, is the same thing as about 5 heads either way, since 0.0498 times 100 is close to 5.

=== step === concept
## How LLN and CLT fit together

LLN named the destination: a long run's proportion of heads settles toward 0.5. CLT names something different: how wide a band around that destination is ordinary at any given stop. Put the two together and you can draw a shrinking band around the running proportion itself.

```r
# Overlay the CLT's predicted 95% band around the running proportion
n_seq <- seq_along(coin_long)
band_half <- 1.96 * sqrt(0.25 / n_seq)

plot(running_long, type = "l", log = "x",
     xlab = "Number of flips (log scale)", ylab = "Running proportion of heads",
     main = "Running proportion inside the CLT 95% band",
     ylim = c(0, 1))
lines(0.5 + band_half, col = "blue", lty = 2)
lines(0.5 - band_half, col = "blue", lty = 2)
abline(h = 0.5, col = "red", lty = 2)

round(band_half[c(100, 10000)], 4)
#> [1] 0.0980 0.0098
```

The blue dashed lines are \(0.5 \pm 1.96 \times \sqrt{0.25/n}\), a 95% band built straight from the CLT's standard error. At 100 flips the band reaches 0.0980 on each side of 0.5. At 10,000 flips it has narrowed to 0.0098, a tenfold shrink for a hundredfold rise in flips, the \(1/\sqrt{n}\) rate the standard error formula predicts.

The running proportion from the earlier 10,000-flip run stays inside that band almost the whole time. There is exactly one moment where it steps outside: at flip 16, the running proportion is 0.25 while the band's lower edge sits at 0.255, a brief dip below the line early on, before the band has had a chance to narrow. After that, the line never leaves the band again.

This is the same construction behind a confidence interval. LLN guarantees the band is centered on the right place. CLT tells you exactly how wide that band needs to be at any sample size.

=== step === concept
## Turning 58% heads into a z-score

The band you just drew showed roughly how far off is ordinary at any given $n$. Now make that exact. Suppose you flip a fair coin 100 times and count 58 heads, 58%. Is that an ordinary fluctuation, or a sign the coin might not be fair?

Call the observed proportion $\hat{p}$. To judge it, measure how many standard errors away from 0.5 it sits. That count is called a z-score.

```r
# Turn 58% heads at n = 100 into a z-score, using the CLT standard error
se_100 <- sqrt(0.25 / 100)
z_58 <- (0.58 - 0.50) / se_100
z_70 <- (0.70 - 0.50) / se_100

se_100
#> [1] 0.05
z_58
#> [1] 1.6
z_70
#> [1] 4
```

The standard error at n = 100 is 0.05, the same value computed earlier for the 100-flip batch. A proportion of 0.58 sits 1.6 standard errors above 0.5. For contrast, a proportion of 0.70 would sit 4 standard errors above 0.5, much farther out.

The assumption that the coin is fair is called the null hypothesis, H0. If H0 is true, the chance of landing this far from 0.5 or farther is called a p-value.

The widget below plots the standard normal curve that z-score lives on, and shades that chance in each direction.

::widget null-distribution {"tails": 2, "max": 4.5, "start": 1.6, "label": "z"}

At z = 1.6, the shaded area reads at about 0.11. That is not small: a gap this size shows up in roughly 1 out of every 9 fair-coin experiments of 100 flips. It is ordinary, not surprising.

Now drag the slider out to 4.0, matching the 70% case. The shaded area all but disappears. A gap that large would almost never happen from a fair coin at n = 100, which is exactly what "surprising" means here.

=== step === quiz
## Closing quiz: telling the two laws apart

Here's a short scenario. A colleague runs the same fair coin 10,000 times and watches the running proportion settle near 0.5, the way `running_long` did earlier. Separately, they repeat a 100-flip experiment 5,000 times and look at how those 5,000 proportions scatter around 0.5, the way `batch_100` did. Which law explains each half?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The running proportion settling near 0.5 is the Central Limit Theorem, and the scatter of the 5,000 proportions is the Law of Large Numbers. ::no
- The running proportion settling near 0.5 is the Law of Large Numbers, and the scatter of the 5,000 proportions is the Central Limit Theorem. ::ok Exactly. LLN describes one running proportion heading toward its destination. CLT describes the spread of many independent proportions around that destination. Same coin, two different questions.
- Both halves are the Central Limit Theorem, since both involve averages of coin flips. ::no
- The Central Limit Theorem guarantees the running proportion eventually lands exactly on 0.5, so both halves are really the same law. ::no The two laws answer different questions and neither one does the other's job. LLN is the one that describes a single running proportion settling toward 0.5. CLT is the one that describes the spread of many independent repeats around that value, and it never guarantees an exact landing for anything.

=== step === tryit
## Your turn: judge a new sample size

Now run the same analysis yourself, at n = 40 instead of 100.

Simulate 5,000 sample proportions of heads from 40 flips each, the same way `batch_100` was built. Compare their standard deviation to the theoretical standard error $\sqrt{0.25/40}$. Then decide: if you saw a proportion of 0.65 at n = 40, is that ordinary or suspicious?

```r
# Your turn: n = 40. Simulate, compare the spread, then judge 0.65
# 1. Draw 5000 sample proportions of heads from 40 flips each
# 2. Compare their standard deviation to sqrt(0.25 / 40)
# 3. Compute z for an observed proportion of 0.65 and decide: ordinary or suspicious?

```
::check {"regex": "(?=.*replicate)(?=.*rbinom[(][^)]*40)", "gate": true, "difficulty": "intermediate", "ok": "Right, the standard deviation comes out close to 0.079 either way you compute it. And the z-score for 0.65 works out to about 1.90, farther out than the 1.6 you saw for 0.58 at n = 100, but nowhere near the 4.0 you saw for 0.70. Notably off, not wildly surprising.", "no": "Simulate 5000 sample proportions from 40 flips each with replicate(5000, mean(rbinom(40, 1, 0.5))), then compare sd() of that to sqrt(0.25 / 40), and finally compute (0.65 - 0.50) divided by that standard error."}
::solution
```r
# Simulate 5000 sample proportions at n = 40, then compare spread and compute z for 0.65
set.seed(404)
batch_40 <- replicate(5000, mean(rbinom(40, 1, 0.5)))
round(sd(batch_40), 4)
#> [1] 0.079

se_40 <- sqrt(0.25 / 40)
round(se_40, 4)
#> [1] 0.0791

z_65 <- (0.65 - 0.50) / se_40
round(z_65, 4)
#> [1] 1.8974
```

The simulated standard deviation, 0.079, and the theoretical standard error, 0.0791, agree to three decimals, exactly what the CLT predicts. The z-score for 0.65 is 1.8974, close to 1.90. That sits farther out than the 1.6 you got for 0.58 at n = 100, but well short of the 4.0 you got for 0.70. A proportion of 0.65 at n = 40 is notably off, worth a second look, but not the kind of result that rules out a fair coin on its own.

=== step === concept
## References

- Casella, G. & Berger, R. L. (2002). *Statistical Inference* (2nd ed.). Cengage Learning. The formal statements of the Law of Large Numbers and the Central Limit Theorem.
- Wasserman, L. (2004). *All of Statistics*. Springer. The chapter on convergence covers both laws side by side.
- Wackerly, D., Mendenhall, W. & Scheaffer, R. (2008). *Mathematical Statistics with Applications* (7th ed.). Cengage Learning. Sampling distributions worked out in full.
- [Seeing Theory: Probability Distributions](https://seeing-theory.brown.edu/probability-distributions/index.html) - Brown University. An interactive visualization of sampling distributions and the Central Limit Theorem.
- [R documentation: stats::rbinom](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/Binomial.html) and [base::replicate](https://stat.ethz.ch/R-manual/R-devel/library/base/html/replicate.html), the two functions behind every simulation above.

=== step === complete
## Recap: LLN and CLT in the coin's numbers

Here it is again, back in the coin's own numbers.

- The Law of Large Numbers: one long run's proportion of heads landed at 0.4942 after 10,000 flips, within half a point of 0.5. That is convergence in probability, the chance of a large gap shrinking as flips pile up.
- The Central Limit Theorem: 5,000 repeats of a 100-flip experiment scattered around 0.5 with a standard deviation of 0.0498, matching the predicted standard error of 0.05. That is convergence in distribution, toward a normal curve whose width you can compute in advance.
- One law names the destination. The other names how far off you should expect to be, at any sample size, before you ever collect the data.

Both laws hold for any repeated random measurement with a finite mean, and for CLT, a finite variance too, not just a coin. The coin only made the numbers easy to check by hand.
