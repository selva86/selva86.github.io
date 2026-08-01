---
title: "Empirical Bayes in R: James-Stein and Shrinkage"
slug: "Empirical-Bayes-in-R"
description: "Empirical Bayes and James-Stein shrinkage in R, explained from scratch. See why pulling estimates toward the mean beats raw averages, with runnable code."
keywords: "empirical Bayes in R, James-Stein estimator, shrinkage estimation, beta-binomial, borrowing strength, Stein's paradox, posterior mean, empirical Bayes estimation"
auto_link_terms: "empirical Bayes|James-Stein estimator|James-Stein|shrinkage estimation|shrinkage estimator|Stein's paradox|borrowing strength|beta-binomial model|empirical Bayes estimation|shrinkage toward the mean"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-08-01"
curriculum_id: "FR-baye-3"
post_type: "FR"
fr_parent: "Conjugate-Priors-in-R.html"
difficulty: "Intermediate"
---

<p class="lead">Empirical Bayes is a method that estimates a prior from your own data, then uses it to pull each noisy estimate toward the group average. That pull, called shrinkage and made famous by the James-Stein estimator, lowers your total error when you estimate many quantities at once. This guide builds both ideas from scratch in R, using only base R so every number here runs in your browser.</p>

## Why do raw averages mislead you on small samples?

Imagine you run a sports desk and you want to predict how well 18 baseball players will hit this season. All you have so far is each player's first 45 at-bats. The obvious move is to use each player's early batting average as your prediction. Let's load that exact situation, the real 1970 data that Bradley Efron and Carl Morris studied, and look at it.

```r title="Load the Efron-Morris baseball data"
# 18 players: hits in their first 45 at-bats, and their eventual full-season average.
players <- c("Clemente","F Robinson","F Howard","Johnstone","Berry","Spencer",
             "Kessinger","L Alvarado","Santo","Swoboda","Unser","Williams",
             "Scott","Petrocelli","E Rodriguez","Campaneris","Munson","Alvis")
hits    <- c(18,17,16,15,14,14,13,12,11,11,10,10,10,10,10,9,8,7)
season  <- c(.346,.298,.276,.222,.273,.270,.263,.210,.269,.230,
             .264,.256,.303,.264,.226,.285,.316,.200)

p_hat <- hits / 45   # each player's raw average from 45 at-bats
baseball <- data.frame(player = players, hits = hits,
                       avg45 = round(p_hat, 3), season = season)
head(baseball)
#>       player hits avg45 season
#> 1   Clemente   18 0.400  0.346
#> 2 F Robinson   17 0.378  0.298
#> 3   F Howard   16 0.356  0.276
#> 4  Johnstone   15 0.333  0.222
#> 5      Berry   14 0.311  0.273
#> 6    Spencer   14 0.311  0.270
```

The `avg45` column is the raw estimate, and `season` is the truth we are trying to hit. Right away something looks off. Clemente batted a blistering .400 across 45 at-bats, but his real season average was .346. The raw number overstated his ability.

That is not bad luck for one player, it is a pattern. Let's measure how wide the raw averages spread out, and where their center sits.

```r title="Spread and center of the raw averages"
round(range(p_hat), 3)   # lowest and highest early average
#> [1] 0.156 0.400
round(mean(p_hat), 3)    # the group average
#> [1] 0.265
```

The raw averages run from .156 all the way to .400, centered around .265. Here is the key point: 45 at-bats is a tiny sample, so a player at either extreme got there partly on luck. A cold streak of 7-for-45 does not mean a .156 hitter, and a hot 18-for-45 does not mean a .400 hitter. Both extremes will drift back toward the pack.

[KEY INSIGHT]
**Extreme results from small samples are extreme partly by luck.** When a sample is small, the highest and lowest observed values almost always overstate how special those units really are, so the truth is usually tamer than the raw number.

**Try it:** Summarize how spread out the 18 raw averages are with a single number. Standard deviation is a natural choice.

```r title="Your turn: measure the spread"
# The raw averages range from .156 to .400.
# Replace NULL with a single number that summarizes how spread out they are.
ex_spread <- NULL
# Hint: standard deviation with sd() is one good one-number summary.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Spread of the raw averages solution"
round(sd(p_hat), 3)
#> [1] 0.07
```

**Explanation:** The raw averages have a standard deviation of about 0.07. A good chunk of that spread is just sampling noise from 45 at-bats, not real talent differences.

</details>

## What exactly is shrinkage?

If the extremes are inflated by luck, the fix is intuitive: pull every estimate a little toward the group average. A cautious prediction sits between what one player did and what players do on average. That pulling is called shrinkage, and in its simplest form it is just a weighted average.

Let's do it by hand. We will keep a fraction of each player's distance from the group mean and throw the rest away. A factor of 0.5 keeps half the gap.

```r title="Shrink every average halfway to the mean"
grand_mean  <- mean(p_hat)                 # the shared center, about 0.265
c_fixed     <- 0.5                         # keep half of each player's gap
shrunk_half <- grand_mean + c_fixed * (p_hat - grand_mean)
round(shrunk_half, 3)
#>  [1] 0.333 0.322 0.310 0.299 0.288 0.288 0.277 0.266 0.255 0.255 0.244 0.244
#> [13] 0.244 0.244 0.244 0.233 0.222 0.210
```

Clemente's .400 became .333, and Alvis's .156 became .210. Every value moved toward .265, the extremes most of all. The diagram below shows the recipe: take one unit's noisy estimate, take the shared group average, and blend them.

![Shrinkage blends one unit's noisy estimate with the shared group average.](screenshots/Empirical-Bayes-in-R-shrinkage-idea.webp)
*Figure 1: Shrinkage blends one unit's noisy estimate with the shared group average.*

Does this cautious blending actually predict the season better? We can check, because we know the true season averages. The standard scorecard is total squared error: add up the squared gap between each prediction and the truth. Smaller is better.

```r title="Compare total error: raw vs shrunk"
sse_raw  <- sum((p_hat - season)^2)        # error of the raw averages
sse_half <- sum((shrunk_half - season)^2)  # error of the shrunk averages
round(c(raw = sse_raw, shrunk_half = sse_half), 4)
#>         raw shrunk_half 
#>      0.0753      0.0292 
```

Shrinking cut the total error from 0.0753 to 0.0292, more than halving it. We deliberately biased every prediction toward the middle, and the predictions got better. That trade is the whole game.

[KEY INSIGHT]
**Shrinkage trades a little bias for a big cut in variance.** Each estimate is nudged away from the truth on purpose, but the wild swings caused by small samples shrink far more, so the total error drops.

**Try it:** A factor of 0.5 helped. Try shrinking harder with 0.3 (keep only 30 percent of each gap) and see whether the total error falls further.

```r title="Your turn: shrink harder"
# shrunk_half used a factor of 0.5. Try a smaller factor so estimates
# move even closer to the group mean, then check the total squared error.
ex_c <- 0.5   # change 0.5 to 0.3
ex_shrunk_try <- grand_mean + ex_c * (p_hat - grand_mean)
# Compare sum((ex_shrunk_try - season)^2) against 0.0292 from before.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Shrink harder solution"
ex_shrunk <- grand_mean + 0.3 * (p_hat - grand_mean)
round(sum((ex_shrunk - season)^2), 4)
#> [1] 0.0223
```

**Explanation:** Keeping only 30 percent of each gap drops the error to 0.0223, better still. For this data the true talent differences are small, so heavy shrinkage pays off. The obvious next question is how to pick the factor without peeking at the answer.

</details>

## How does the James-Stein estimator pick the shrinkage factor?

We chose 0.5 and then 0.3 by hand, but that only worked because we could see the season truth. In real life you cannot. The James-Stein estimator solves this: it reads the right shrinkage factor straight from your data, no peeking required.

Here is the intuition. If your estimates are bunched tightly together, they are mostly noise, so shrink hard. If they are spread far apart, real differences are driving them, so shrink gently. The estimator turns that idea into one formula. For $p$ quantities each measured with noise of variance 1, shrinking toward zero:

$$\hat{\theta}^{JS} = \left(1 - \frac{p-2}{\sum_{i=1}^{p} y_i^2}\right) y$$

Where:

- $y_i$ = the raw measurement for quantity $i$
- $p$ = how many quantities you are estimating at once
- $\sum y_i^2$ = the total squared size of the measurements, which grows when they spread out

The term in parentheses is the shrinkage factor. When the measurements spread out, the denominator grows, the fraction shrinks, and the factor moves toward 1 (gentle shrinkage). *If you are not interested in the formula, skip ahead, the code below is all you need.*

The famous part is Stein's paradox: as soon as you estimate three or more quantities at once ($p \ge 3$), this shrunken estimator beats the raw measurements on total error, always. Let's watch it happen. We invent 10 true values, observe each with noise, and score both estimators against the truth we secretly know.

```r title="James-Stein on one simulated dataset"
set.seed(101)
p     <- 10
theta <- rnorm(p, mean = 0, sd = 2)   # the true values (we get to peek)
y     <- rnorm(p, mean = theta, sd = 1)  # noisy measurements, variance 1

js_factor <- 1 - (p - 2) / sum(y^2)   # the data-driven shrinkage factor
theta_js  <- js_factor * y            # shrink every measurement toward 0
round(c(shrink_factor = js_factor,
        sse_raw = sum((y - theta)^2),
        sse_js  = sum((theta_js - theta)^2)), 3)
#> shrink_factor       sse_raw        sse_js 
#>         0.404        10.790         9.882 
```

The estimator picked a shrinkage factor of 0.404 on its own, and its total error (9.882) came in below the raw error (10.790). One run could be luck, though. Let's repeat the whole experiment 2,000 times and see who wins on average.

```r title="Repeat the experiment 2000 times"
set.seed(2024)
sim_once <- function(p = 10) {
  theta <- rnorm(p, 0, 2)
  y     <- rnorm(p, theta, 1)
  js    <- (1 - (p - 2) / sum(y^2)) * y
  c(raw = sum((y - theta)^2), js = sum((js - theta)^2))
}
res <- replicate(2000, sim_once())
round(rowMeans(res), 3)              # average error of each estimator
#>   raw    js 
#> 9.969 8.354 
round(mean(res["js", ] < res["raw", ]), 3)   # share of runs where JS wins
#> [1] 0.773
```

Across 2,000 fresh datasets the James-Stein estimator averaged 8.354 total error versus 9.969 for the raw measurements, and it beat the raw estimator in 77 percent of individual runs. Shrinking toward an arbitrary point, zero, with a factor read off the data, reliably beats the obvious estimator.

[WARNING]
**James-Stein guarantees a lower total error, not a better estimate for every unit.** Some individual coordinates get worse. The win is on the sum across all of them, so use it when you care about the whole batch, not one single unit.

**Try it:** The paradox needs at least three quantities. Rerun the single-dataset idea with just 3 means and confirm James-Stein still comes out ahead.

```r title="Your turn: try just three means"
# The paradox needs p >= 3. Set the number of means to 3 and rerun the idea.
ex_p <- 10   # change 10 to 3
# Then draw ex_p true means, observe them with noise, and compare raw vs JS.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Three means solution"
set.seed(7)
ex_theta <- rnorm(3, 0, 2)
ex_y     <- rnorm(3, ex_theta, 1)
ex_js    <- (1 - (3 - 2) / sum(ex_y^2)) * ex_y
round(c(sse_raw = sum((ex_y - ex_theta)^2), sse_js = sum((ex_js - ex_theta)^2)), 3)
#> sse_raw  sse_js 
#>   2.010   1.818 
```

**Explanation:** Even with only three means, James-Stein (1.818) edges out the raw estimate (2.010). Notice we use $p - 2 = 1$ in the factor. Below three quantities the correction turns off and there is nothing to gain.

</details>

## Does James-Stein actually help on the real baseball data?

Simulations are convincing, but you came for real data. Let's point James-Stein at the 18 batting averages. We treat each average as a noisy measurement of a player's true skill, shrink toward the group mean instead of zero, and use the version of the formula built for a shared target:

$$\hat{\theta}_i^{JS} = \bar{y} + \left(1 - \frac{(p-3)\,\sigma^2}{\sum_i (y_i - \bar{y})^2}\right)(y_i - \bar{y})$$

Here $\bar{y}$ is the group mean and $\sigma^2$ is the noise variance of a single average. A batting average from 45 at-bats has a known noise variance, roughly $\bar{p}(1-\bar{p}) / 45$, so we can plug everything in.

```r title="James-Stein on the batting averages"
pbar      <- mean(p_hat)
sigma2    <- pbar * (1 - pbar) / 45          # noise variance of one 45-at-bat average
S         <- sum((p_hat - pbar)^2)           # how spread out the averages are
shrink_js <- 1 - (length(p_hat) - 3) * sigma2 / S
js_est    <- pbar + shrink_js * (p_hat - pbar)

round(shrink_js, 3)                          # the data-chosen shrinkage factor
#> [1] 0.212
round(c(sse_raw = sum((p_hat - season)^2),
        sse_js  = sum((js_est - season)^2),
        improvement = sum((p_hat - season)^2) / sum((js_est - season)^2)), 4)
#>     sse_raw      sse_js improvement 
#>      0.0753      0.0213      3.5349 
```

The estimator chose to keep only 21 percent of each player's gap from the mean, and the payoff is dramatic: total error dropped from 0.0753 to 0.0213, about 3.5 times more accurate than trusting the raw averages. This is the original 1975 Efron-Morris result, and you just reproduced it from scratch.

[NOTE]
**We treated each proportion as an approximately normal measurement.** That works because 45 at-bats is enough for a Normal approximation. When you have counts and proportions, though, there is a more natural route that models them directly. That route is empirical Bayes, and it is next.

**Try it:** `js_est` holds the James-Stein estimate for every player. Find the worst early hitter and read off his raw, James-Stein, and true averages to see which way he moved.

```r title="Your turn: shrink the worst hitter"
# js_est holds the James-Stein estimate for every player.
# Find the worst early hitter and read off his raw, JS, and true averages.
ex_worst <- which.min(p_hat)   # index of the lowest early average
# Print p_hat[ex_worst], js_est[ex_worst], and season[ex_worst].
```

<details>
<summary>Click to reveal solution</summary>

```r title="Worst hitter solution"
round(c(alvis_raw = p_hat[18], alvis_js = js_est[18], alvis_true = season[18]), 3)
#>  alvis_raw   alvis_js alvis_true 
#>      0.156      0.242      0.200 
```

**Explanation:** Alvis looked like a .156 hitter after 45 at-bats. James-Stein lifted him to .242, and his real season average was .200. The shrunken guess landed much closer to the truth than the low raw number.

</details>

## How do you estimate the prior from the data itself?

So far we have shrunk toward the group mean, but we never asked how strong that pull should be in a principled way. Empirical Bayes answers that by treating the whole group as evidence about a prior distribution, then letting Bayes' rule do the shrinking. The word "empirical" means we do not assume a prior, we estimate it from the data.

The workflow has two steps, shown below. First, look at all 18 players together and fit a prior distribution for batting skill. Second, combine that prior with each player's own record to get a posterior estimate.

![Empirical Bayes estimates the prior from all units, then updates each one.](screenshots/Empirical-Bayes-in-R-eb-workflow.webp)
*Figure 2: Empirical Bayes estimates the prior from all units, then updates each one.*

For batting averages the natural prior is a Beta distribution, because a Beta paired with hit-or-miss counts gives a clean posterior. That pairing is the beta-binomial model, and it is the engine behind conjugate priors. We fit the prior's two shape parameters, $\alpha$ and $\beta$, by maximum likelihood: we find the pair that makes the observed hit counts most probable.

```r title="Fit the Beta prior by maximum likelihood"
# Negative log-likelihood of a Beta(a, b) prior given the 18 hit counts.
loglik <- function(par) {
  a <- par[1]; b <- par[2]
  if (a <= 0 || b <= 0) return(1e10)   # keep the search in valid territory
  -sum(lchoose(45, hits) + lbeta(hits + a, 45 - hits + b) - lbeta(a, b))
}
fit    <- optim(c(1, 1), loglik)       # search for the best a and b
alpha0 <- fit$par[1]
beta0  <- fit$par[2]
round(c(alpha0 = alpha0, beta0 = beta0,
        prior_mean = alpha0 / (alpha0 + beta0),
        prior_strength = alpha0 + beta0), 3)
#>         alpha0          beta0     prior_mean prior_strength 
#>        211.076        584.100          0.265        795.176 
```

The fitted prior is centered at 0.265, exactly the group average, and its strength is about 795. You can read $\alpha + \beta$ as a number of "pseudo at-bats" the prior is worth. With each player owning only 45 real at-bats, that heavy prior will pull everyone strongly toward the center.

Now the second step. The posterior mean for a Beta prior updated with hits out of at-bats has a simple closed form:

$$\hat{p}_i^{EB} = \frac{x_i + \alpha}{n_i + \alpha + \beta}$$

Where $x_i$ is the player's hits, $n_i$ is the at-bats, and $\alpha, \beta$ come from the fitted prior. You add the prior's pseudo-counts to the real counts and divide. Let's apply it and score it against the season truth.

```r title="Empirical-Bayes estimates for every player"
eb_est <- (hits + alpha0) / (45 + alpha0 + beta0)   # posterior mean per player
round(c(sse_raw = sum((p_hat - season)^2),
        sse_eb  = sum((eb_est - season)^2),
        improvement = sum((p_hat - season)^2) / sum((eb_est - season)^2)), 4)
#>     sse_raw      sse_eb improvement 
#>      0.0753      0.0228      3.3017 
compare <- data.frame(player = players, avg45 = round(p_hat, 3),
                      eb = round(eb_est, 3), season = season)
head(compare)
#>       player avg45    eb season
#> 1   Clemente 0.400 0.273  0.346
#> 2 F Robinson 0.378 0.271  0.298
#> 3   F Howard 0.356 0.270  0.276
#> 4  Johnstone 0.333 0.269  0.222
#> 5      Berry 0.311 0.268  0.273
#> 6    Spencer 0.311 0.268  0.270
```

Empirical Bayes cut the total error to 0.0228, about 3.3 times better than the raw averages, right in line with the James-Stein result. Notice how tight the `eb` column is: every prediction sits near 0.27. With only 45 at-bats apiece, the data barely distinguishes these players, so leaning on the crowd is the sensible choice.

[KEY INSIGHT]
**Empirical Bayes borrows the prior from the crowd, so you never have to assume one.** The group tells you how much talent varies, and that estimated spread sets exactly how hard each individual estimate is pulled toward the center.

**Try it:** Use the fitted prior to score a brand-new player who went 30 hits in 100 at-bats.

```r title="Your turn: score a new player"
# Use the fitted prior (alpha0, beta0) to shrink a new player's average.
ex_h <- 30; ex_ab <- 100   # 30 hits in 100 at-bats, a raw average of .300
# Compute (ex_h + alpha0) / (ex_ab + alpha0 + beta0).
```

<details>
<summary>Click to reveal solution</summary>

```r title="New player solution"
round((30 + alpha0) / (100 + alpha0 + beta0), 3)
#> [1] 0.269
```

**Explanation:** A raw .300 hitter with 100 at-bats gets shrunk all the way to .269. With 795 pseudo at-bats in the prior, 100 real at-bats simply cannot shift the estimate far.

</details>

## How much should each estimate shrink, and when does it backfire?

The last example hints at the rule that governs everything: the more data a unit has, the less it gets shrunk. The weight the prior carries is $(\alpha + \beta) / (n + \alpha + \beta)$. When $n$ is tiny the prior dominates, and when $n$ is huge the data wins. Let's watch that weight fall as at-bats climb.

```r title="Shrinkage weight versus sample size"
n_grid          <- c(10, 45, 100, 500)
weight_on_prior <- (alpha0 + beta0) / (n_grid + alpha0 + beta0)
round(setNames(weight_on_prior, paste0("n=", n_grid)), 3)
#>  n=10  n=45 n=100 n=500 
#> 0.988 0.946 0.888 0.614 
```

With 10 at-bats the prior gets almost 99 percent of the vote, so the estimate is basically the group mean. By 500 at-bats the prior's weight has dropped to 61 percent, and the player's own record starts to speak for itself. Shrinkage is not a fixed amount, it scales with how much you actually know about each unit.

**Try it:** A hot hitter is batting .400. Give him 300 at-bats instead of 45 and see how far the prior still pulls him in.

```r title="Your turn: give the hot hitter more at-bats"
# A hot hitter is batting .400. Give him 300 at-bats instead of 45 and
# see how much the prior still pulls him toward .265.
ex_ab2 <- 45   # change 45 to 300
# Compute (0.400 * ex_ab2 + alpha0) / (ex_ab2 + alpha0 + beta0).
```

<details>
<summary>Click to reveal solution</summary>

```r title="Hot hitter solution"
round((0.400 * 300 + alpha0) / (300 + alpha0 + beta0), 3)
#> [1] 0.302
```

**Explanation:** Even with 300 at-bats at a .400 clip, empirical Bayes predicts .302. That is a lot of shrinkage, and it points to the method's blind spot.

</details>

Shrinkage assumes the units are interchangeable, drawn from one shared prior. When one unit is genuinely special, the crowd-based prior pulls it too far toward the average. Clemente is the cautionary tale: he really was an all-time great, yet the method treated his hot start as mostly luck.

```r title="When shrinkage over-corrects a real star"
round(c(clemente_raw = p_hat[1], clemente_eb = eb_est[1], clemente_true = season[1]), 3)
#>  clemente_raw   clemente_eb clemente_true 
#>         0.400         0.273         0.346 
```

Clemente's true .346 sits far above the shrunken .273. Empirical Bayes pulled him too hard because it assumed he was an ordinary player having a lucky month. On this batch the aggressive shrinkage still lowered total error, but it under-credited the one player who deserved the benefit of the doubt.

[WARNING]
**Shrinkage assumes your units are exchangeable, so a truly exceptional unit pays a price.** If you have outside reason to believe one unit is special, feed that in through a richer model rather than letting a flat prior flatten it.

## Complete Example

Baseball is the classic story, but the real payoff of empirical Bayes is any setting with many units and little data each. Think of 200 products on a store, each with a handful of visits and a few purchases, where you need a trustworthy conversion rate for every one. Raw rates from a dozen visits are hopeless. Here is the full workflow end to end.

```r title="End-to-end empirical Bayes on conversion rates"
set.seed(303)
n_items   <- 200
true_rate <- rbeta(n_items, 8, 40)       # each product's real conversion rate
trials    <- rpois(n_items, 30) + 5      # visits per product, most quite small
conv      <- rbinom(n_items, trials, true_rate)   # observed purchases
raw_rate  <- conv / trials               # the noisy raw rates

# Step 1: fit the Beta prior from all 200 products by maximum likelihood.
ll <- function(par) {
  a <- par[1]; b <- par[2]
  if (a <= 0 || b <= 0) return(1e10)
  -sum(lchoose(trials, conv) + lbeta(conv + a, trials - conv + b) - lbeta(a, b))
}
f     <- optim(c(1, 1), ll)
a_hat <- f$par[1]; b_hat <- f$par[2]

# Step 2: shrink every product's rate toward the fitted prior.
eb_rate <- (conv + a_hat) / (trials + a_hat + b_hat)

round(c(a_hat = a_hat, b_hat = b_hat), 3)
#>  a_hat  b_hat 
#>  7.283 35.892 
round(c(sse_raw = sum((raw_rate - true_rate)^2),
        sse_eb  = sum((eb_rate  - true_rate)^2),
        improvement = sum((raw_rate - true_rate)^2) / sum((eb_rate - true_rate)^2)), 4)
#>     sse_raw      sse_eb improvement 
#>      0.8075      0.3093      2.6104 
```

The fitted prior recovered shape parameters near the true 8 and 40 we simulated from, and the empirical-Bayes rates were 2.6 times more accurate than the raw rates. Because the trial counts vary here, each product shrinks by a different amount: the ones with only a handful of visits lean almost entirely on the prior, while the well-observed ones keep most of their own signal. That per-unit adaptivity is exactly what you want in production.

[TIP]
**In production, fit the prior on as much history as you can spare.** The prior is only as sharp as the pool it is estimated from, so more units and more trials per unit give a better-calibrated pull for every individual estimate.

## Practice Exercises

These combine several ideas from the tutorial. Try each before opening the solution. The variables from earlier code blocks (`p_hat`, `eb_est`, `season`, `grand_mean`, `alpha0`, `beta0`, `sigma2`) are still available.

### Exercise 1: Does the leader change under shrinkage?

Shrinkage moves every estimate, so it could reshuffle the rankings. Find the player with the highest raw average and the player with the highest empirical-Bayes estimate. Are they the same person?

```r title="Exercise 1 starter: compare the two leaders"
# Who tops the raw list, and who tops the empirical-Bayes list?
# Hint: which.max() returns the index of the largest value.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
data.frame(top_raw = players[which.max(p_hat)],
           top_eb  = players[which.max(eb_est)])
#>    top_raw   top_eb
#> 1 Clemente Clemente
```

**Explanation:** Clemente tops both lists. Shrinkage pulls everyone toward the center but preserves the order here, because it shrinks all players by nearly the same amount when their at-bats are equal.

</details>

### Exercise 2: Which predictor wins overall?

Compare three strategies for predicting the season averages: the raw 45-at-bat averages, predicting the grand mean for everyone, and the empirical-Bayes estimates. Compute each one's total squared error against `season`.

```r title="Exercise 2 starter: three predictors"
# Compare three ways to predict the season averages:
#   1. raw 45-at-bat averages (p_hat)
#   2. predicting the grand mean for everyone
#   3. the empirical-Bayes estimates (eb_est)
# Compute the total squared error of each against season.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
sse_grandmean <- sum((rep(grand_mean, 18) - season)^2)
round(c(raw = sum((p_hat - season)^2),
        grand_mean_only = sse_grandmean,
        empirical_bayes = sum((eb_est - season)^2)), 4)
#>             raw grand_mean_only empirical_bayes 
#>          0.0753          0.0243          0.0228 
```

**Explanation:** The raw averages (0.0753) are by far the worst. Predicting the grand mean for everyone (0.0243) is already a big improvement, and empirical Bayes (0.0228) edges it out by adapting to each player. When per-unit data is this thin, most of the gain comes from simply pulling toward the center.

</details>

### Exercise 3: When does the shrinkage weight go negative?

The James-Stein weight from the baseball section was `1 - (p - 3) * sigma2 / S`, where `S` is the spread of the estimates. Write that weight as a function of `S` for `p = 18`, then evaluate it at `S = 0.02`, `0.05`, and `0.10`. What does a negative weight tell you?

```r title="Exercise 3 starter: weight as a function of spread"
# The James-Stein weight depends on S, the spread of the estimates.
# Write a function of S that returns 1 - (p - 3) * sigma2 / S for p = 18,
# then evaluate it at S = 0.02, 0.05, and 0.10.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
js_weight <- function(spread, p = 18, s2 = sigma2) 1 - (p - 3) * s2 / spread
round(sapply(c(0.02, 0.05, 0.10), js_weight), 3)
#> [1] -2.25 -0.30  0.35
```

**Explanation:** When the spread `S` is small (0.02), the weight goes negative, a signal that the estimates are so bunched they are almost pure noise. In practice you clamp a negative weight to 0, which means shrink all the way to the mean. As `S` grows, the weight climbs toward keeping more of each estimate.

</details>

## Frequently Asked Questions

### Is estimating the prior from the same data a form of double-counting?

Yes, empirical Bayes uses the data twice: once to fit the shared prior and once to update each unit. That is why it is an approximation to a full Bayesian analysis, not the same thing. It holds up well when you have many units, because any single unit contributes only a little to the prior, so the prior is nearly independent of the estimate it then adjusts. With only a handful of units the approximation gets shaky and the fitted prior can look more certain than it should.

### How is empirical Bayes different from full Bayesian inference?

Full Bayes fixes the prior before seeing the data, from theory or belief, and carries the uncertainty about the prior through to the final answer. Empirical Bayes instead estimates the prior's parameters from the data and then treats them as known, which ignores the uncertainty in that estimate. What you get in return is that you never have to invent a prior, and with many units the two approaches land in almost the same place.

### Does this only work for batting averages and proportions?

No. The beta-binomial model here fits proportions, but the same recipe (fit one shared prior across all units, then pull each unit toward it) works for other data types. Counts pair with a Gamma-Poisson model, and normal measurements are exactly the James-Stein case from earlier. You pick the prior family that matches your data; the shrinkage logic does not change.

### How many units do I need before shrinkage helps?

James-Stein needs at least three quantities before it can beat the raw estimates, which is where Stein's paradox begins. Empirical Bayes needs enough units to pin down the prior: a handful gives a noisy prior, while dozens or hundreds (the 18 players or 200 products here) give a stable one. More units mean a sharper borrowed prior and a better-calibrated pull for every estimate.

## Summary

Empirical Bayes and James-Stein are two paths to the same destination: shrink noisy estimates toward a shared center to lower your total error.

| Idea | What it does | Key formula or output |
|---|---|---|
| Raw average | Trusts each small sample fully | Total error 0.0753 on the baseball data |
| Fixed shrinkage | Blends estimate with the group mean by hand | Error fell to 0.0292 at factor 0.5 |
| James-Stein | Reads the shrinkage factor from the data | 3.5 times more accurate on the batting averages |
| Empirical Bayes | Fits a prior from all units, then updates each | 3.3 times more accurate, and handles counts directly |
| Shrinkage weight | Scales with sample size | More data means less shrinkage |

The mental model to keep: an estimate from little data is mostly noise, so lean on the crowd; an estimate from lots of data has earned trust, so let it speak. James-Stein and empirical Bayes just turn that instinct into arithmetic, and they come with a guarantee that the total error goes down. The one caution is exchangeability: shrinkage assumes your units come from one shared population, so a genuinely exceptional unit will be under-credited.

## References

1. Efron, B. & Morris, C. (1975). *Data Analysis Using Stein's Estimator and Its Generalizations.* Journal of the American Statistical Association. [Link](https://www.tandfonline.com/doi/abs/10.1080/01621459.1975.10479864)
2. James, W. & Stein, C. (1961). *Estimation with Quadratic Loss.* Proceedings of the Fourth Berkeley Symposium. [Link](https://projecteuclid.org/ebooks/berkeley-symposium-on-mathematical-statistics-and-probability/Estimation-with-Quadratic-Loss/chapter/Estimation-with-Quadratic-Loss/bsmsp/1200512173)
3. Efron, B. & Hastie, T. (2016). *Computer Age Statistical Inference*, Chapter 7: James-Stein Estimation and Ridge Regression. Cambridge University Press. [Link](https://hastie.su.domains/CASI/)
4. Robinson, D. *Understanding Empirical Bayes Estimation (Using Baseball Statistics).* Variance Explained. [Link](http://varianceexplained.org/r/empirical_bayes_baseball/)
5. Morris, C. (1983). *Parametric Empirical Bayes Inference: Theory and Applications.* Journal of the American Statistical Association. [Link](https://www.tandfonline.com/doi/abs/10.1080/01621459.1983.10477920)
6. R Core Team. *optim: General-purpose Optimization.* R Documentation. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/optim.html)

## Continue Learning

- [Conjugate Priors in R](Conjugate-Priors-in-R.html) - The Beta-Binomial machinery behind the empirical-Bayes update step, explained with closed-form posteriors.
- [Ridge Regression in R](Ridge-Regression-With-R.html) - James-Stein's close cousin, applying the same shrinkage idea to regression coefficients.
- [Approximate Bayesian Computation in R](Approximate-Bayesian-Computation-in-R.html) - Bayesian inference when you cannot even write down the likelihood.
