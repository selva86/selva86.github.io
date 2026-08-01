---
title: "Prior Sensitivity Analysis in R: Does the Prior Matter?"
slug: "Prior-Sensitivity-Analysis-in-R"
description: "Prior sensitivity analysis in R: refit a Bayesian model under several priors and check if the conclusion holds. Learn exactly when the prior matters."
keywords: "prior sensitivity analysis R, does the prior matter, Bayesian robustness check, prior sensitivity sweep, weakly informative prior, conjugate Beta-Binomial, power-scaling priorsense, prior data conflict"
auto_link_terms: "prior sensitivity analysis|prior sensitivity|does the prior matter|sensitivity to the prior|prior robustness|prior sensitivity sweep|robustness to priors|prior-data conflict|power-scaling sensitivity|prior sensitivity check|how much does the prior matter|prior sweep"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-08-01"
curriculum_id: "FR-baye-6"
post_type: "FR"
fr_parent: "Choosing-Priors-in-R.html"
difficulty: "Intermediate"
---

<p class="lead">Prior sensitivity analysis means refitting a Bayesian model under a range of reasonable priors and checking whether your conclusion changes. If the answer stays the same, the result is robust. If it flips, the prior, not the data, is driving your answer. This post shows you how to run that check from scratch, work out exactly when the prior matters, and connect it to the tools you use for real models.</p>

## What is prior sensitivity analysis, and why should you care?

Imagine you run a small test of a new checkout button and see 8 conversions out of 20 visitors. You hand that result to three colleagues and ask each for their best estimate of the true conversion rate. One is cautious and expected a low rate. One is hopeful and expected a high rate. One has no opinion at all. In a Bayesian analysis, each of those starting opinions is a *prior*, and each colleague will hand you back a slightly different answer from the same 8-out-of-20 data.

Prior sensitivity analysis is the discipline of measuring that disagreement on purpose. A Bayesian posterior is a blend of two ingredients: the prior (what you believed before the data) and the likelihood (what the data says). When the data is plentiful, the blend is almost pure data and everyone lands in the same place. When the data is thin, the prior gets a real vote, and reasonable people with different priors can reach different conclusions.

Let us make the three colleagues concrete. We will describe each prior as a Beta distribution, which is the natural way to express a belief about a rate between 0 and 1. A `Beta(a, b)` prior has mean `a / (a + b)`, so `Beta(2, 8)` leans low (mean 0.2) and `Beta(8, 2)` leans high (mean 0.8). The convenient part is that for count data like "8 successes out of 20," the posterior is also a Beta, with parameters `Beta(a + successes, b + failures)`. This tidy pairing, where the posterior lands in the same Beta family as the prior, is called *conjugacy*. No simulation is needed; the answer is a formula you can evaluate directly.

```r title="Same data, three priors, three answers"
# A/B test result: 8 conversions out of 20 visitors
k <- 8      # conversions (successes)
n <- 20     # visitors (trials)

priors <- list(
  vague    = c(a = 1, b = 1),   # "no idea"        prior mean 0.50
  skeptic  = c(a = 2, b = 8),   # "probably low"   prior mean 0.20
  optimist = c(a = 8, b = 2)    # "probably high"  prior mean 0.80
)

# Beta-Binomial conjugacy: posterior is Beta(a + k, b + n - k)
post_mean <- sapply(priors, function(p) unname((p["a"] + k) / (p["a"] + p["b"] + n)))
round(post_mean, 3)
#>    vague  skeptic optimist
#>    0.409    0.333    0.533
```

Here is what that code did. We stored each colleague's prior as a pair of numbers `(a, b)`, then applied the posterior formula `Beta(a + k, b + n - k)` and read off its mean `(a + k) / (a + b + n)`. The `unname()` call just strips a stray label so the output stays tidy.

Now read the three numbers. From identical data, the cautious skeptic's best estimate is 0.333, the no-opinion analyst lands at 0.409, and the optimist reaches 0.533. That is a spread of two-tenths in the estimated conversion rate, produced entirely by the choice of prior. Whether that spread is a problem or a footnote is exactly the question prior sensitivity analysis answers.

[KEY INSIGHT]
**A prior only moves your answer when the data cannot outvote it.** The disagreement you see above is not a bug in Bayesian statistics; it is an honest signal that 20 visitors is too little data to settle the question on its own. The cure is either more data or a prior you can defend.

**Try it:** Add a fourth, much stronger skeptic to the picture. A `Beta(20, 80)` prior also has mean 0.2, but it is far more confident. Compute its posterior mean and see how much harder it pulls.

```r title="Your turn: a stronger skeptic"
# A Beta(20, 80) prior also has mean 0.2, but it carries far more weight.
ex_strong <- c(a = 20, b = 80)
# Fill in the posterior mean: (a + k) / (a + b + n)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Stronger skeptic solution"
ex_strong <- c(a = 20, b = 80)
ex_mean <- unname((ex_strong["a"] + k) / (ex_strong["a"] + ex_strong["b"] + n))
round(ex_mean, 3)
#> [1] 0.233
```

**Explanation:** The stronger `Beta(20, 80)` prior pulls the posterior mean all the way down to 0.233, much lower than the milder skeptic's 0.333. A more confident prior gets a bigger vote, so it bends the answer harder. The next section turns that "vote" into an exact number.

</details>

## Why does changing the prior change your answer?

The reason the prior moves the answer is not mysterious, and you do not have to take it on faith. For this Beta-Binomial setup, the posterior mean is exactly a weighted average of the prior's mean and the data's own rate. You can write down the weights.

Let \(a + b\) be the prior's *strength*: it behaves like a number of imaginary trials the prior is "worth." A `Beta(2, 8)` prior is worth 10 imaginary trials; a `Beta(20, 80)` prior is worth 100. The data brings \(n\) real trials. The posterior mean splits its vote between the two in proportion to those counts.

$$\text{posterior mean} = w \times (\text{prior mean}) + (1 - w) \times (\text{data mean})$$

$$w = \frac{a + b}{a + b + n}$$

Where \(w\) is the share of the answer that comes from the prior, \(a + b\) is the prior's strength in imaginary trials, and \(n\) is the number of real trials in your data. The rest of the vote, \(1 - w\), goes to the data. This one fraction is the whole story of "does the prior matter." Let us compute it for our three colleagues.

```r title="The posterior mean is a weighted average"
strength  <- sapply(priors, function(p) unname(p["a"] + p["b"]))   # a + b
w         <- strength / (strength + n)                             # prior weight
data_mean <- k / n

decomp <- data.frame(
  prior_strength = strength,
  prior_weight   = round(w, 3),
  prior_mean     = round(sapply(priors, function(p) unname(p["a"] / (p["a"] + p["b"]))), 2),
  data_mean      = data_mean,
  post_mean      = round(post_mean, 3)
)
decomp
#>          prior_strength prior_weight prior_mean data_mean post_mean
#> vague                 2        0.091        0.5       0.4     0.409
#> skeptic              10        0.333        0.2       0.4     0.333
#> optimist             10        0.333        0.8       0.4     0.533
```

Walk across one row. The skeptic's prior is worth 10 imaginary trials against 20 real ones, so its weight is `10 / (10 + 20) = 0.333`. The posterior mean is then `0.333 * 0.2 + 0.667 * 0.4 = 0.333`, exactly the number in the table. The vague prior is worth only 2 trials, so it gets a 9% vote and barely nudges the answer off the raw data rate of 0.4.

That is why the optimist and the skeptic disagreed in section 1: each held a prior worth 10 trials, so each grabbed a third of a 20-trial answer and pulled it toward their own belief. The vague analyst held almost no weight and landed on the data.

![The posterior estimate as a weighted blend of the prior and the data](screenshots/Prior-Sensitivity-Analysis-in-R-weighted-blend.webp)
*Figure 1: The posterior estimate is a weighted blend of the prior and the data; more data shrinks the prior's weight w toward zero.*

The same logic holds for continuous quantities like a mean, where the weights are *precisions* (one divided by the variance) instead of trial counts. A tight prior has high precision and a big weight; a diffuse prior has low precision and a small one. The vocabulary changes, but the tug-of-war is identical.

[KEY INSIGHT]
**Does the prior matter? The honest answer is a single fraction, w equals strength over strength plus n.** A prior worth 10 trials facing 20 real ones holds a third of the vote. Facing 2,000 real trials it holds half a percent. Collect more data and the prior's weight melts away on its own.

**Try it:** The skeptic prior is worth 10 trials. How many real visitors \(n\) would you need before its weight drops below 10%? Solve `10 / (10 + n) < 0.10`.

```r title="Your turn: shrink the prior to a whisper"
# The skeptic prior is worth strength = 2 + 8 = 10 trials.
# Solve 10 / (10 + n) < 0.10 for n.
ex_skeptic_strength <- 10
# Fill in: rearrange strength / (strength + n) = 0.10 to get n
```

<details>
<summary>Click to reveal solution</summary>

```r title="Shrink the prior solution"
ex_skeptic_strength <- 10
ex_n <- ex_skeptic_strength / 0.10 - ex_skeptic_strength   # from strength/(strength+n)=0.10
ex_n
#> [1] 90
```

**Explanation:** Past about 90 visitors, the skeptic prior holds less than a tenth of the vote, so its influence on the answer is minor. Below that, it is a genuine player. Knowing this number for your own prior tells you at a glance whether your dataset is large enough to ignore the argument.

</details>

## How do you actually run a prior sensitivity analysis?

You now understand why priors matter. Running a sensitivity analysis turns that understanding into a short, repeatable procedure you can bolt onto the end of any Bayesian analysis. There are four steps.

1. **State the decision your analysis feeds.** Not "estimate the rate," but the actual call you will make, such as "ship the button only if we are at least 90% sure the true rate beats the 0.35 break-even point."
2. **Pick a panel of priors** that spans what reasonable people believe: a vague prior, a mild default, a skeptic, an enthusiast, and any prior drawn from earlier studies.
3. **Refit under each prior** and record both the posterior summary and the decision quantity.
4. **Read the table.** If the decision is the same under every prior, it is robust. If it flips, it is prior-sensitive, and you have a story to tell about how much your assumptions contributed.

First we need a small helper that reports what we care about for one prior: the posterior mean, a 95% credible interval (the range that holds 95% of the posterior), and the probability the rate clears our threshold.

```r title="A reusable posterior summary function"
threshold <- 0.35   # break-even conversion rate: ship only if we clear this

summarise_posterior <- function(a, b, k, n, thresh) {
  a_post <- a + k
  b_post <- b + (n - k)
  c(post_mean = a_post / (a_post + b_post),
    ci_lo     = qbeta(0.025, a_post, b_post),
    ci_hi     = qbeta(0.975, a_post, b_post),
    p_above   = pbeta(thresh, a_post, b_post, lower.tail = FALSE))
}
round(summarise_posterior(a = 1, b = 1, k = k, n = n, thresh = threshold), 3)
#> post_mean     ci_lo     ci_hi   p_above
#>     0.409     0.218     0.616     0.706
```

The helper uses `qbeta()` to read percentiles off the posterior Beta and `pbeta(..., lower.tail = FALSE)` to get the probability the rate exceeds the threshold. For the vague prior, there is a 70.6% chance the true rate beats 0.35: promising, but short of a confident "ship it." Now run the whole panel through it.

```r title="Sweep the whole panel of priors"
panel <- list(
  vague              = c(1,  1),
  weakly_informative = c(2,  2),
  skeptic            = c(2,  8),
  strong_skeptic     = c(20, 80),
  optimist           = c(8,  2)
)

sweep <- t(sapply(panel, function(p)
  summarise_posterior(a = p[1], b = p[2], k = k, n = n, thresh = threshold)))
round(sweep, 3)
#>                    post_mean ci_lo ci_hi p_above
#> vague                  0.409 0.218 0.616   0.706
#> weakly_informative     0.417 0.232 0.615   0.741
#> skeptic                0.333 0.179 0.508   0.408
#> strong_skeptic         0.233 0.162 0.313   0.003
#> optimist               0.533 0.357 0.706   0.979
```

Read the `p_above` column against our decision rule, "ship only if the probability of clearing 0.35 is at least 0.90." Only the optimist clears the bar, at 0.979. Everyone else lands between 0.003 and 0.741. The recommendation is not "ship" or "wait"; it depends entirely on whose prior you trust. With 20 visitors, this decision is prior-sensitive, and reporting only the optimist's answer would be misleading.

![The four-step prior sensitivity analysis workflow](screenshots/Prior-Sensitivity-Analysis-in-R-workflow.webp)
*Figure 2: The prior sensitivity analysis loop. Refit the same model under a panel of priors, then read whether the decision holds or flips.*

Now collect ten times as much data, keeping the same 40% observed rate, and rerun the identical panel.

```r title="Now with ten times more data"
k2 <- 80; n2 <- 200      # same 40 percent rate, ten times the data
sweep_big <- t(sapply(panel, function(p)
  summarise_posterior(a = p[1], b = p[2], k = k2, n = n2, thresh = threshold)))
round(sweep_big, 3)
#>                    post_mean ci_lo ci_hi p_above
#> vague                  0.401 0.335 0.469   0.932
#> weakly_informative     0.402 0.336 0.470   0.937
#> skeptic                0.390 0.326 0.457   0.886
#> optimist               0.419 0.353 0.486   0.980
#> strong_skeptic         0.333 0.281 0.388   0.267
```

Look at the `post_mean` column now. The four reasonable priors cluster between 0.390 and 0.419, a spread of three-hundredths, down from the two-tenths gulf at 20 visitors. The data has bought most of the robustness. The one holdout is `strong_skeptic`, still at 0.333, because a prior worth 100 imaginary trials still holds a third of the vote even against 200 real ones.

[TIP]
**Make the sweep a standing habit, not an emergency response.** Add a short loop over three or four priors to the end of every Bayesian analysis. If the conclusion holds, you have earned the right to report it plainly. If it moves, you found out before a reviewer or a stakeholder did.

[WARNING]
**An extreme prior is a strong claim that needs its own defense.** More data tames reasonable priors but not arbitrarily confident ones. If a `Beta(20, 80)` prior still bends your 200-trial result, the fix is not more data; it is justifying, or dropping, a prior that asserts the equivalent of 100 prior observations you may not actually have.

**Try it:** Rerun the 20-visitor sweep with an easier threshold of 0.30 instead of 0.35, and compare the `p_above` column to the table above. Which way does every prior move, and by how much does that depend on the prior?

```r title="Your turn: change the decision threshold"
# Rerun the n = 20 sweep, but lower the decision threshold to 0.30.
ex_threshold <- 0.30
# Loop the panel through summarise_posterior() with thresh = ex_threshold,
# then look at the p_above column.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Lower threshold solution"
ex_threshold <- 0.30
ex_sweep <- t(sapply(panel, function(p)
  summarise_posterior(a = p[1], b = p[2], k = k, n = n, thresh = ex_threshold)))
round(ex_sweep[, "p_above"], 3)
#>              vague weakly_informative            skeptic     strong_skeptic           optimist
#>              0.852              0.880              0.636              0.048              0.996
```

**Explanation:** Every prior grows more confident when the bar drops from 0.35 to 0.30, because clearing an easier target is more probable. But the size of the jump depends on the prior: the optimist barely changes (already near 1), while the milder skeptic climbs from 0.408 to 0.636. The `strong_skeptic` stays far below the bar at 0.048. Moving the threshold and moving the prior are two different levers, and a good analysis reports sensitivity to both.

</details>

## What if your model has no conjugate shortcut?

The Beta-Binomial trick worked because the posterior had a clean formula. Most real priors and models do not. The moment you want a prior that is not a Beta, or a model without a tidy conjugate partner, you need a method that works for *any* prior. The simplest such method is a grid: chop the parameter range into many points, and compute the posterior weight at each one by hand.

The recipe is three lines. At every candidate rate on the grid, multiply the prior density by the likelihood of your data, then divide by the total so the weights sum to one. Swap in a different prior and you get a different posterior from the same data, with no formula required.

```r title="Posterior by brute force on a grid"
grid <- seq(0.001, 0.999, length.out = 999)
likelihood <- dbinom(k, size = n, prob = grid)   # the data speaks the same way to every prior

posterior_on_grid <- function(prior_density) {
  unnorm <- prior_density * likelihood
  unnorm / sum(unnorm)                            # normalise so the weights sum to 1
}

post_skeptic_grid <- posterior_on_grid(dbeta(grid, 2, 8))
grid_mean <- sum(grid * post_skeptic_grid)        # posterior mean = sum(theta * weight)
c(grid = round(grid_mean, 3), conjugate = round(10 / 30, 3))
#>      grid conjugate
#>     0.333     0.333
```

The grid posterior mean for the skeptic prior is 0.333, matching the exact conjugate answer to three decimals. That agreement is your proof that the grid method is trustworthy: when a formula exists, the grid reproduces it. Now use it for a prior that has no conjugate form at all, such as a "two camps" mixture that puts half its belief on the skeptic's bump and half on the optimist's.

```r title="A prior with no conjugate form"
prior_mix <- 0.5 * dbeta(grid, 2, 8) + 0.5 * dbeta(grid, 8, 2)   # skeptics and optimists in one room
post_mix  <- posterior_on_grid(prior_mix)
round(sum(grid * post_mix), 3)                                   # posterior mean under the two-camps prior
#> [1] 0.364
```

The mixed prior lands at 0.364, between the skeptic's 0.333 and the raw data's 0.4, which is exactly where a blend of a low bump and a high bump should sit once the data leans low. There is no closed form for this posterior, yet the grid handled it without complaint. Plotting the full posteriors side by side makes the effect of the prior visible at a glance.

```r title="See how the prior reshapes the posterior"
library(ggplot2)
plot_df <- data.frame(
  theta   = rep(grid, 4),
  weight  = c(posterior_on_grid(dbeta(grid, 1, 1)),
              posterior_on_grid(dbeta(grid, 2, 8)),
              posterior_on_grid(dbeta(grid, 8, 2)),
              post_mix),
  prior   = rep(c("vague", "skeptic", "optimist", "two-camps mix"), each = length(grid))
)
ggplot(plot_df, aes(theta, weight, colour = prior)) +
  geom_line(linewidth = 1) +
  geom_vline(xintercept = k / n, linetype = "dashed") +
  labs(title = "Posterior for the conversion rate under four priors",
       subtitle = "Dashed line marks the raw data rate, 8/20 = 0.40",
       x = "conversion rate", y = "posterior weight", colour = "prior") +
  theme_minimal(base_size = 13)
```

The plot shows four posteriors built from the same 8-out-of-20 data. The skeptic's curve sits to the left of the dashed data line, the optimist's to the right, and the vague and mixture curves straddle it. Seeing the curves shift is the most persuasive way to communicate prior sensitivity to a non-technical audience, because the disagreement is right there in the picture.

[NOTE]
**A grid is only practical for one or two parameters.** With three or more unknowns the number of grid points explodes, and you switch to sampling methods instead. For the single-parameter checks in this post, though, a grid is exact enough and needs no special package.

**Try it:** Build a symmetric, moderately informative prior with `Beta(5, 5)` (mean 0.5, worth 10 trials) and find its posterior mean on the grid.

```r title="Your turn: a symmetric prior on the grid"
# Beta(5, 5) has mean 0.5 and is worth 10 trials.
ex_prior_density <- dbeta(grid, 5, 5)
# Run it through posterior_on_grid() and take sum(grid * posterior)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Symmetric prior solution"
ex_prior_density <- dbeta(grid, 5, 5)
ex_post <- posterior_on_grid(ex_prior_density)
round(sum(grid * ex_post), 3)
#> [1] 0.433
```

**Explanation:** The symmetric `Beta(5, 5)` prior pulls the posterior toward its own mean of 0.5, landing at 0.433, above the data rate of 0.4. Even a prior that looks "neutral" is informative: a mean of 0.5 is a genuine claim, and worth 10 trials it takes a real bite out of a 20-trial dataset.

</details>

## How do you check prior sensitivity in a real regression?

Conjugate math and grids are perfect for teaching, but your real models will be regressions, hierarchical models, and generalized linear models fit with a sampler. You cannot write their posteriors by hand. The good news is that the workflow does not change: pick a panel of priors, refit the model under each, and compare. Packages like rstanarm and brms make the refit a one-line change, because you can fit once and then update only the prior.

The block below fits a simple linear regression twice on the same simulated data. The first fit uses a sensible weakly informative prior on the slope; the second changes only that prior to a tight, skeptical `normal(0, 0.2)` and refits. This code uses a sampler that runs outside the browser, so run it in your own R session with rstanarm installed.

```r-static title="Refit a regression under two priors with rstanarm"
suppressPackageStartupMessages(library(rstanarm))

set.seed(2026)
n_obs <- 30
sim <- data.frame(x = rnorm(n_obs))
sim$y <- 1 + 0.6 * sim$x + rnorm(n_obs)   # true slope = 0.6

# Weakly informative prior on the slope
fit_weak <- stan_glm(y ~ x, data = sim,
                     prior = normal(0, 5),
                     chains = 2, iter = 1000, seed = 123, refresh = 0)

# Refit with ONLY the slope prior changed to a tight, skeptical normal(0, 0.2)
fit_tight <- update(fit_weak, prior = normal(0, 0.2))

comparison <- rbind(
  weak_prior  = posterior_interval(fit_weak,  prob = 0.9, pars = "x")["x", ],
  tight_prior = posterior_interval(fit_tight, prob = 0.9, pars = "x")["x", ]
)
round(comparison, 2)
#>               5%  95%
#> weak_prior  0.36 0.79
#> tight_prior 0.19 0.58
```

The true slope was 0.6. Under the weakly informative prior, the 90% credible interval is `[0.36, 0.79]`, comfortably around the truth. Swap in the tight skeptical prior and the same 30 observations produce `[0.19, 0.58]`, shifted noticeably toward zero. The `update()` call is the whole trick: it reuses the fitted model and changes only the prior, so a full sweep over five priors is five short lines. The verdict reads exactly like the conjugate sweeps earlier, because it is the same idea applied to a model you cannot solve by hand.

There is also an automated shortcut worth knowing. Instead of refitting under a handful of hand-picked priors, *power-scaling* gently strengthens or weakens your existing prior and measures how much the posterior reacts, all from a single fit. The `priorsense` package by Kallioinen and colleagues implements this with an efficient importance-sampling trick and flags both prior sensitivity and prior-data conflict automatically. It works with rstanarm, brms, and Stan fits, and it is the modern default for teams that run this check on every model.

[TIP]
**Reach for power-scaling once you fit many models.** Hand-picking a prior panel is clearest for learning and for a headline result you must defend. For routine screening across dozens of parameters, an automated diagnostic like priorsense catches sensitivity you would never think to test by hand.

**Try it:** Before running any code, predict which prior will move the slope estimate more: a `normal(0, 5)` prior or a `normal(0, 0.2)` prior. Explain your reasoning in one sentence.

<details>
<summary>Click to reveal solution</summary>

**Answer:** The `normal(0, 0.2)` prior moves the estimate more. It is far narrower, so it acts like a high-precision, high-weight prior that insists the slope is near zero, and with only 30 observations the data cannot fully outvote it. The wide `normal(0, 5)` prior is nearly flat over any plausible slope, so it contributes almost no weight and lets the data speak, which is exactly what the `[0.36, 0.79]` versus `[0.19, 0.58]` intervals show.

</details>

## Complete Example: a clinical pilot from data to decision

Let us run the full workflow once, end to end, on a fresh problem. A clinic pilots a new recovery protocol and sees 12 recoveries in 15 patients, a raw rate of 0.80. The decision on the table: adopt the protocol only if you are at least 90% sure the true recovery rate beats 0.60. Three priors are in play, including a legitimate skeptic who points out the old protocol recovered about 30% of patients.

```r title="Full sensitivity analysis for the clinical pilot"
# Clinical pilot: 12 recoveries out of 15 patients on a new protocol
k_ct <- 12; n_ct <- 15; thresh_ct <- 0.60; decision_bar <- 0.90

panel_ct <- list(
  vague     = c(1,  1),    # no prior opinion
  skeptic   = c(6, 14),    # "old protocol recovered about 0.30", worth 20 patients
  informed  = c(6,  4)     # "similar drugs recover about 0.60", worth 10 patients
)

report_ct <- t(sapply(panel_ct, function(p) {
  s <- summarise_posterior(a = p[1], b = p[2], k = k_ct, n = n_ct, thresh = thresh_ct)
  c(round(s, 3), adopt = unname(s["p_above"] >= decision_bar))
}))
report_ct
#>          post_mean ci_lo ci_hi p_above adopt
#> vague        0.765 0.544 0.927   0.935     1
#> skeptic      0.514 0.351 0.676   0.155     0
#> informed     0.720 0.533 0.874   0.904     1
```

Follow the decision column. The vague and informed priors both clear the 90% bar and vote to adopt. The skeptic does not come close: at 0.155, it thinks the protocol probably does not beat 0.60, because a prior worth 20 patients (recovering just 30%) outweighs the 15 pilot patients and pulls the estimate down to 0.514.

The honest reading is that the adoption decision is prior-sensitive and the pilot is underpowered. A 12-out-of-15 result looks spectacular, but 15 patients is too few to overrule a well-grounded skeptic. The correct next step is not to pick the prior you like best; it is to enroll more patients until the skeptic's 20-patient prior stops mattering, which by the `w = strength / (strength + n)` rule happens once your sample dwarfs 20.

## Practice Exercises

### Exercise 1: A rare-event rate

A quality survey finds 3 defects in 40 inspected units. Sweep three priors over this data, `Beta(1, 1)`, `Beta(1, 9)` (defects are rare), and `Beta(5, 5)`, and report the posterior mean and 95% credible interval for each. Which prior distorts the estimate most, and why?

```r title="Exercise 1 starter"
# 3 defects in 40 units. Sweep three priors and compare.
my_k <- 3; my_n <- 40
my_panel <- list(vague = c(1, 1), rare = c(1, 9), symmetric = c(5, 5))
# Loop my_panel through summarise_posterior() and round the result.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
my_k <- 3; my_n <- 40
my_panel <- list(vague = c(1, 1), rare = c(1, 9), symmetric = c(5, 5))
my_out <- t(sapply(my_panel, function(p)
  summarise_posterior(a = p[1], b = p[2], k = my_k, n = my_n, thresh = 0.10)))
round(my_out, 3)
#>           post_mean ci_lo ci_hi p_above
#> vague         0.095 0.027 0.199   0.403
#> rare          0.080 0.023 0.169   0.265
#> symmetric     0.160 0.073 0.272   0.888
```

**Explanation:** The symmetric `Beta(5, 5)` prior distorts the estimate most, nearly doubling the defect rate from 0.08 to 0.16. Its mean of 0.5 is wildly wrong for a rare-defect problem, yet because it is worth 10 trials against only 40, it still takes a fifth of the answer. For rare events, a "neutral" symmetric prior is anything but neutral, and the `rare` prior that actually encodes low expectations is the honest choice.

</details>

### Exercise 2: How much data buys agreement?

With the observed rate fixed at 0.40 (so `k = 0.4 * n`), find the smallest sample size `n` at which the skeptic `Beta(2, 8)` and optimist `Beta(8, 2)` posterior means agree to within 0.02. Loop `n` over `seq(20, 400, by = 20)`.

```r title="Exercise 2 starter"
# Fix the data rate at 0.40, so k = 0.4 * n. For each n, compare the two
# posterior means and find where the gap first drops below 0.02.
my_ns <- seq(20, 400, by = 20)
# Compute the skeptic and optimist posterior means at each n.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
my_ns <- seq(20, 400, by = 20)
gap <- sapply(my_ns, function(nn) {
  kk <- 0.4 * nn
  m_skeptic  <- (2 + kk) / (2 + 8 + nn)
  m_optimist <- (8 + kk) / (8 + 2 + nn)
  m_optimist - m_skeptic
})
min(my_ns[gap < 0.02])
#> [1] 300
```

**Explanation:** The two priors agree to within 0.02 once you gather 300 observations. Below that, the same data still supports visibly different conclusions depending on which prior you brought. This is the quantitative version of "collect more data until the prior stops mattering."

</details>

### Exercise 3: A hard-boundary expert prior

Using the grid method, compare the posterior mean for `k = 8, n = 20` under a vague `Beta(1, 1)` prior and a hard "expert" prior that is flat on the interval `[0.30, 0.50]` and exactly zero everywhere else. How far apart are the two posterior means?

```r title="Exercise 3 starter"
# Build a "box" prior that is 1 on [0.30, 0.50] and 0 elsewhere, then compare
# its grid posterior mean to the vague prior's.
my_grid <- seq(0.001, 0.999, length.out = 999)
my_lik  <- dbinom(8, size = 20, prob = my_grid)
# Hint: as.numeric(my_grid >= 0.30 & my_grid <= 0.50) builds the box.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
my_grid <- seq(0.001, 0.999, length.out = 999)
my_lik  <- dbinom(8, size = 20, prob = my_grid)
post_from <- function(prior_d) {
  u <- prior_d * my_lik
  u / sum(u)
}
prior_vague  <- dbeta(my_grid, 1, 1)
prior_expert <- as.numeric(my_grid >= 0.30 & my_grid <= 0.50)   # flat box, zero outside
mean_vague  <- sum(my_grid * post_from(prior_vague))
mean_expert <- sum(my_grid * post_from(prior_expert))
round(c(vague = mean_vague, expert = mean_expert,
        gap = mean_vague - mean_expert), 3)
#>  vague expert    gap
#>  0.409  0.400  0.009
```

**Explanation:** The two posterior means differ by less than 0.01. Even though the expert prior forbids any rate outside `[0.30, 0.50]`, the data already concentrates almost all of its weight inside that band, so the hard boundary barely changes the answer. A restrictive prior only matters when it disagrees with where the data wants to go; here it does not, so the result is robust to it.

</details>

## Frequently Asked Questions

### Is prior sensitivity analysis the same as a robustness check?

Yes, it is the Bayesian form of one. A robustness check asks whether a conclusion survives a reasonable change in your assumptions. In Bayesian modeling the key assumption is the prior, so a prior sensitivity analysis refits under alternative priors and reports whether the conclusion holds. You can run a parallel check on the likelihood, but the prior is the assumption people question most.

### How many priors should I put in the sweep?

Three to five is usually enough: a vague prior, a mild default, a skeptic, an enthusiast, and any prior grounded in earlier studies. The goal is to span the range of beliefs a reasonable colleague might hold, not to enumerate every possibility. If the conclusion is stable across that spread, adding more priors rarely changes the verdict.

### What do I do if my conclusion flips across priors?

That is useful information, not a failure. A flip tells you the data alone cannot settle the question, so you have three honest options: collect more data until the prior's weight shrinks, justify one prior as the defensible choice and report the sweep alongside it, or report the range of conclusions transparently. What you must not do is quietly pick the prior that gives the answer you wanted.

### Does a flat or uniform prior mean my result has no prior sensitivity?

No. A flat prior is still a prior, and it makes real claims. On a rate it says every value in `[0, 1]` is equally likely; on a regression slope, a very wide prior implies the coefficient could plausibly be enormous. Flat priors can even worsen sensitivity in small samples, so they deserve the same sweep as any other choice.

### Do I need MCMC or a sampler to do a prior sensitivity analysis?

Not for simple models. As this post shows, conjugate formulas and grid approximation let you run a full sensitivity analysis in base R with no sampler at all. You only need a sampler like the one behind rstanarm or brms when the model is too complex for a grid, typically three or more parameters, and even then the workflow is identical.

### What is power-scaling, and how is it different from a manual sweep?

Power-scaling raises your existing prior to a power slightly above and below 1, which smoothly strengthens or weakens it, then measures how much the posterior shifts, all from a single fit. A manual sweep refits the model under a few discrete priors you choose by hand. Power-scaling is faster and more automatic, so it scales to many parameters; the manual sweep is clearer for a single headline decision you need to explain.

## Summary

Prior sensitivity analysis answers one question: is your conclusion coming from the data or from your assumptions? You answer it by refitting under a panel of reasonable priors and checking whether the decision holds.

| What you see | What it means | What to do |
|---|---|---|
| Conclusion stable across priors | The data is doing the work | Report the result plainly, with the sweep as evidence |
| Conclusion flips across priors | The prior is driving the answer | Collect more data, or defend one prior and show the sweep |
| A strong prior bends even large samples | The prior asserts a lot of imaginary data | Justify that prior explicitly, or replace it |
| A "neutral" prior distorts a rare-event rate | Symmetric is not the same as uninformative | Use a prior that matches the scale of the problem |

The mechanism behind all of it is one fraction. The prior gets weight `w = strength / (strength + n)`, where strength is the prior's worth in imaginary trials and `n` is your real sample size. Big data shrinks `w` toward zero and the prior fades; small data hands the prior a real vote. Run the sweep at the end of every Bayesian analysis, and you will always know which side of that line your result sits on.

## References

1. Stan Development Team. "Prior Choice Recommendations." The canonical, regularly updated guidance on choosing and stress-testing priors. [Link](https://github.com/stan-dev/stan/wiki/Prior-Choice-Recommendations)
2. Kallioinen, N., Paananen, T., Burkner, P.-C., Vehtari, A. "Detecting and diagnosing prior and likelihood sensitivity with power-scaling." *Statistics and Computing* 34, 57 (2024). The paper behind power-scaling sensitivity and the priorsense diagnostics; read it for the method this post automates. [Link](https://arxiv.org/abs/2107.14054)
3. priorsense: Prior Diagnostics and Sensitivity Analysis (CRAN package page). Install this to run the automated power-scaling check on your own rstanarm, brms, or Stan fits. [Link](https://cran.r-project.org/package=priorsense)
4. Depaoli, S., Winter, S. D., Visser, M. "The Importance of Prior Sensitivity Analysis in Bayesian Statistics." *Frontiers in Psychology* (2020). A worked, applied argument for why skipping the prior sweep can quietly bias a published result. [Link](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2020.608045/full)
5. Gelman, A. et al. *Bayesian Data Analysis*, 3rd edition. Chapter 5 covers priors and sensitivity. [Link](https://sites.stat.columbia.edu/gelman/book/)
6. McElreath, R. *Statistical Rethinking*, 2nd edition. Builds prior checks into the default workflow. [Link](https://xcelab.net/rm/)
7. rstanarm: "Prior Distributions for rstanarm Models" vignette. Shows the default priors rstanarm uses and how to change them, the knob every sweep in this post turns. [Link](https://mc-stan.org/rstanarm/articles/priors.html)

## Continue Learning

- [Choosing Priors in R](Choosing-Priors-in-R.html), the parent tutorial. Covers weakly informative, reference, and informative priors, the choices this sweep stress-tests.
- [Prior Predictive Checks in R](Prior-Predictive-Checks-in-R.html). Simulate outcomes from your prior alone to catch an absurd prior before you ever fit to data.
- [Bayesian Statistics in R](Bayesian-Statistics-in-R.html). The prior-likelihood-posterior intuition that this whole analysis rests on.
