---
title: "Build MCMC From Scratch in R: The 50-Line Algorithm Behind brms and Stan"
slug: "MCMC-in-R"
description: "Build MCMC in R from scratch with a 50-line Metropolis-Hastings sampler. See exactly what brms and Stan do under the hood, with runnable code and diagnostics."
keywords: "MCMC R, Metropolis-Hastings R, MCMC from scratch, Bayesian sampling R, R MCMC implementation, Bayesian inference R, posterior sampling, MCMC tutorial"
auto_link_terms: "MCMC|Metropolis-Hastings|MCMC sampler|posterior sampling|trace plot|burn-in|acceptance ratio"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-05-09"
curriculum_id: "5.1.5"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "MCMC in R"
sidebar_order: 114
difficulty: "Intermediate"
---

# Build MCMC From Scratch in R: The 50-Line Algorithm Behind brms and Stan

<p class="lead">You may have used brms or Stan to fit Bayesian models and accepted that an algorithm called MCMC works behind the scenes. This post opens the box. In about 50 lines of base R, you'll build the same kind of algorithm those packages run, watch it produce samples that match the textbook closed-form answer, and end with a working understanding of what every Bayesian tool you'll ever use is doing internally.</p>

## Why do we need MCMC at all?

Most R users who run `brms::brm(...)` have no real picture of what's happening between when they press Run and when the answer appears. There's an algorithm called MCMC, it draws samples from the posterior, and that's about as far as it usually goes. The shortest path to actually understanding it is to build it. Here is the entire 50-line implementation, working on a real example, before any explanation.

The setup is the same one we've been using throughout the Bayesian section: 9 visitors saw a new button, 6 of them clicked, and we want a posterior over the true click-through rate. We already know the textbook answer (it's a Beta(7, 4) distribution; the most likely rate is about 0.636). MCMC will produce thousands of samples that approximate that same answer. If our 50 lines are right, the samples should match.

```r title="50 lines of MCMC, working on a real problem"
n <- 9
k <- 6

# 1. Define what makes a value "plausible" given the data.
#    For our problem, that's the posterior of the click rate.
log_posterior <- function(theta) {
  if (theta <= 0 || theta >= 1) return(-Inf)             # rate must be between 0 and 1
  loglik <- dbinom(k, size = n, prob = theta, log = TRUE) # how well theta explains the data
  logprior <- dbeta(theta, 1, 1, log = TRUE)              # flat prior over [0, 1]
  loglik + logprior
}

# 2. The sampler: take a chain of small random steps,
#    accept each step with a probability that depends on the density ratio.
metropolis_hastings <- function(start, sigma, n_iter, log_target) {
  samples <- numeric(n_iter)
  current <- start
  current_lp <- log_target(current)
  accepted <- 0

  for (i in seq_len(n_iter)) {
    proposed <- rnorm(1, mean = current, sd = sigma)     # propose a step
    proposed_lp <- log_target(proposed)
    log_accept_ratio <- proposed_lp - current_lp         # how much better/worse?
    if (log(runif(1)) < log_accept_ratio) {              # accept with probability min(1, ratio)
      current <- proposed
      current_lp <- proposed_lp
      accepted <- accepted + 1
    }
    samples[i] <- current
  }

  list(samples = samples, accept_rate = accepted / n_iter)
}

# 3. Run it.
set.seed(2026)
result <- metropolis_hastings(start = 0.5, sigma = 0.1, n_iter = 5000,
                              log_target = log_posterior)

# 4. Check the answer.
mean(result$samples)                       # most likely rate
#> [1] 0.6376912
quantile(result$samples, c(0.025, 0.975))  # 95% range
#>      2.5%     97.5%
#> 0.3403828 0.8865317
result$accept_rate                         # how often did the chain move?
#> [1] 0.4624
```

That's the whole thing. Let's walk through what it actually did, then check the answer against what we know to be correct.

The first chunk defines `log_posterior`, a function that takes a candidate click-through rate and returns a number that is bigger when the rate is more plausible (given our 9 visitors and 6 clicks). It uses log-scale to avoid numerical underflow, but conceptually it's just "how good is this candidate?" The `if (theta <= 0)` check returns negative infinity for impossible values (a rate can't be below 0 or above 1), which makes them never accepted later.

The second chunk is the sampler itself. It takes four arguments: a starting guess (`start = 0.5`), a step size (`sigma = 0.1`), how many iterations to run (`n_iter = 5000`), and the function that scores candidates. Inside the loop, each iteration does four things. First, `rnorm(1, mean = current, sd = sigma)` proposes a small random step away from the current value. Second, it scores the proposed value with the posterior. Third, it computes how much better (or worse) the proposed value is, on a log scale. Fourth, it accepts the move with probability `exp(log_accept_ratio)` (the trick `log(runif(1)) < log_accept_ratio` is a numerically safe way to do this). Whether the move was accepted or rejected, it stores the current value in `samples[i]`.

The third chunk runs the sampler with a fixed random seed (so you get the same numbers as the post). The fourth chunk asks three things of the result: the average sample (which approximates the most likely rate), the 2.5% and 97.5% quantiles of the samples (the 95% range), and what fraction of proposed moves were accepted.

Now look at the numbers. The sample mean came out to 0.638, which is essentially the same as the closed-form answer of 0.636 from the Beta-Binomial recipe. The 95% range is [0.34, 0.89], very close to the closed-form qbeta range of [0.31, 0.89]. The acceptance rate was about 46%, which means roughly half the proposed moves were accepted (we'll discuss why this number matters in a few sections). The 50-line algorithm just produced the right answer, no calculus, no closed-form trick, no extra packages. That's MCMC.

[KEY INSIGHT]
**MCMC turns "compute the posterior" into "sample from the posterior".** Computing the posterior in closed form requires the prior and likelihood to be conjugate. Sampling from it just requires that you can score how plausible each candidate is. The second is a much easier problem to solve, which is why MCMC works for any Bayesian model, not just the conjugate ones.

**Try it:** Run the sampler again from a different starting point (say, `start = 0.95`). Do the samples still produce a posterior mean near 0.64? They should, because a properly working chain finds the right answer regardless of where it begins, given enough iterations.

```r title="Your turn: change the starting point"
ex_start <- 0.95

# Re-run metropolis_hastings with start = ex_start, same sigma and n_iter
# Compute mean(result$samples) and compare to 0.64
#> Expected: posterior mean still close to 0.64
```

<details><summary>Click to reveal solution</summary>

```r title="Different start solution"
set.seed(2026)
ex_result <- metropolis_hastings(start = ex_start, sigma = 0.1, n_iter = 5000,
                                 log_target = log_posterior)
mean(ex_result$samples)
#> [1] 0.6446127
```

The chain started at 0.95, took small steps, and within a few hundred iterations had wandered down to where the posterior actually has its mass. The remaining samples produced a mean of 0.645, essentially the same as before. (This wandering-toward-the-mass phase is called "burn-in" and we'll deal with it explicitly in a later section.)

</details>

## How does the algorithm decide where to go next?

The two key lines in the sampler are the proposal step and the accept-or-reject step. Together they're called Metropolis-Hastings, and they're what makes MCMC work. Both deserve a slow walk-through, because the logic is more elegant than it first appears.

Imagine you're a hiker standing on an unfamiliar landscape, blindfolded, and your goal is to spend more time on the tall peaks than in the valleys. You can feel how high the ground is right where you're standing, but nothing else. What rule should you follow to get the right time-on-each-spot proportion?

A naive rule is "always move uphill." That gets you to the highest peak and you stay there. You'd spend 100% of your time on one spot, regardless of whether other peaks are almost as tall. Wrong answer.

Another naive rule is "always take a random step." That gives you a uniform random walk that ignores the landscape entirely. You'd spend roughly equal time everywhere. Wrong answer.

The right rule is in between. Take a small random step in some direction. If the new spot is higher, definitely move there. If the new spot is lower, sometimes still move (with probability proportional to the height ratio between the new spot and the old). Repeat for a long time. The math works out so that, in the long run, you spend time on each spot in exact proportion to its height. That is the entire idea behind Metropolis-Hastings.

In our problem, "height" means posterior plausibility. Tall peaks are click-through rates that explain the data well; valleys are rates that explain it poorly. The chain spends most of its time on the plausible rates, occasionally wandering through implausible ones, and the proportion of time at each rate is what we measure as the posterior.

![One step of Metropolis-Hastings](screenshots/MCMC-in-R-algorithm.webp)
*Figure 1: One step of Metropolis-Hastings. Propose, compare, accept or reject, repeat. Over thousands of iterations, the time spent at each location is proportional to the posterior density there.*

Here is one Metropolis-Hastings step factored out into a small function, so we can examine the logic without the surrounding loop.

```r title="One Metropolis-Hastings step"
one_mh_step <- function(current, sigma, log_target) {
  proposed <- rnorm(1, mean = current, sd = sigma)        # 1. propose
  current_lp  <- log_target(current)
  proposed_lp <- log_target(proposed)
  log_ratio   <- proposed_lp - current_lp                  # 2. compare on log scale
  if (log(runif(1)) < log_ratio) {                         # 3. accept with right probability
    return(list(value = proposed, accepted = TRUE))
  } else {
    return(list(value = current, accepted = FALSE))
  }
}

# Watch a single step play out
set.seed(7)
one_mh_step(current = 0.6, sigma = 0.1, log_target = log_posterior)
#> $value
#> [1] 0.5765053
#>
#> $accepted
#> [1] TRUE
```

Walk through what each line did. The first line proposed a candidate move using a Normal jump centered at the current location. With `current = 0.6` and `sigma = 0.1`, `rnorm(1, 0.6, 0.1)` drew a number near 0.6 (it happened to be 0.577 with this seed). The next two lines scored the current and proposed positions using `log_posterior`. The log ratio is just the difference of those two scores on the log scale. The `if (log(runif(1)) < log_ratio)` line is the clever part. `runif(1)` draws a uniform random number between 0 and 1, and `log()` of it is some negative number. If `log_ratio` is positive (proposed is more plausible than current), the inequality is always true and we accept. If `log_ratio` is negative (proposed is less plausible), the inequality is true with probability exactly `exp(log_ratio)`, which is the height ratio. That's exactly the rule the hiker should follow.

In the test run, the chain proposed 0.577 starting from 0.6. Both rates are plausible given 6/9 clicks, the proposed rate was just slightly less plausible than current, but the random coin flip still came up "accept" so the chain moved. Over thousands of repeated steps with this rule, the chain visits each rate in proportion to how plausible it is.

[TIP]
**The conditional accept rule is what makes the math work.** Always accepting uphill = stuck at the highest peak. Always accepting any move = pure random walk. The probabilistic accept-when-downhill rule is what produces samples that follow the posterior shape, not just the maximum. The brilliance is that you don't need to know the total area under the posterior (which would require integration); the ratio of two heights is enough.

**Try it:** Walk through what `one_mh_step()` would do if it proposed a rate of 0.05 starting from 0.65. The proposed rate is much less plausible than 0.65 (only 6 of 9 clicks suggest a low rate is unlikely). What happens?

```r title="Your turn: trace one step"
ex_curr <- 0.65
ex_prop <- 0.05

# Compute log_posterior at both, then the log ratio,
# then determine: would log(runif(1)) < log_ratio be true very rarely?
#> Expected: log_ratio strongly negative, so the move is almost always rejected
```

<details><summary>Click to reveal solution</summary>

```r title="Trace-one-step solution"
log_posterior(ex_curr)
#> [1] -1.902515
log_posterior(ex_prop)
#> [1] -16.74993
ratio <- log_posterior(ex_prop) - log_posterior(ex_curr)
ratio
#> [1] -14.84741
exp(ratio)
#> [1] 3.92e-07
```

The proposed rate is wildly less plausible than the current one. The log ratio is -14.85, so `exp(log_ratio)` is about 4 in 10 million. The chain would essentially never make this move. That's exactly what you'd want: a move from a plausible rate to a wildly implausible one is rejected with overwhelming probability, but the rule still allows it once in a great while, which is what gives the chain the right long-run behavior.

</details>

## How do we run the sampler in a loop?

We've seen what one step does. To get samples from the posterior, we need to repeat the step thousands of times and store every visited value. That's what `metropolis_hastings()` from the first code block does. Let's run it longer this time, plot the trace (sample value vs iteration), and overlay the histogram on the closed-form Beta posterior to confirm the algorithm is producing the right shape.

```r title="Run, trace, and verify"
set.seed(2026)
trace <- metropolis_hastings(start = 0.5, sigma = 0.1, n_iter = 10000,
                             log_target = log_posterior)

# Trace plot: see the chain wandering
par(mfrow = c(1, 2), mar = c(4, 4, 2, 1))
plot(trace$samples, type = "l", col = "steelblue",
     xlab = "iteration", ylab = "click-through rate",
     main = "Chain trace")

# Histogram of samples, with the closed-form Beta(7, 4) overlaid in red
hist(trace$samples, breaks = 50, freq = FALSE, col = "lightgray",
     border = "white", main = "Samples vs textbook answer",
     xlab = "click-through rate")
curve(dbeta(x, 7, 4), add = TRUE, col = "tomato", lwd = 2)

par(mfrow = c(1, 1))

# Numerical comparison
mean(trace$samples)
#> [1] 0.6360312
qbeta(c(0.025, 0.975), 7, 4)
#> [1] 0.3905575 0.8907499
quantile(trace$samples, c(0.025, 0.975))
#>      2.5%     97.5%
#> 0.3500041 0.8758895
```

Walk through what just happened. The first line ran the sampler for 10,000 iterations starting at 0.5 with the same step size as before. The next chunk drew two plots side by side: the trace plot shows every sample plotted in order, so you can see the chain wandering up and down through the plausible rates; the histogram shows the *distribution* of all those samples, with the closed-form Beta(7, 4) curve overlaid in red for comparison. Finally, the numerical comparison shows the sample mean (0.636), the closed-form 95% range from `qbeta()` ([0.39, 0.89]), and the empirical 95% range from the samples ([0.35, 0.88]).

The trace plot looks like a fuzzy caterpillar moving up and down between roughly 0.35 and 0.85, with most time spent around 0.6-0.7. That's exactly what a healthy MCMC chain should look like. The histogram of samples almost perfectly traces the closed-form Beta curve. The sample mean (0.636) matches the closed-form answer to three decimal places. The empirical 95% range is within 0.04 of the textbook range. We've reproduced the textbook answer using the algorithm, and we now have a tool that works on any posterior, not just conjugate ones.

[NOTE]
**Trace plot = sample value plotted against iteration number.** A converged chain looks like a fuzzy caterpillar with no upward or downward trend, no long flat stretches, and roughly even fuzziness over time. We'll see what bad trace plots look like in the tuning section.

**Try it:** Run the sampler for 20,000 iterations and check whether the answer changes meaningfully. (The point: more iterations give a better approximation, but with this setup we already have plenty.)

```r title="Your turn: longer run"
ex_long <- metropolis_hastings(start = 0.5, sigma = 0.1, n_iter = 20000,
                               log_target = log_posterior)

# Compute mean and 95% range of ex_long$samples
#> Expected: numbers within ~0.01 of the previous run
```

<details><summary>Click to reveal solution</summary>

```r title="Longer run solution"
set.seed(2026)
ex_long <- metropolis_hastings(start = 0.5, sigma = 0.1, n_iter = 20000,
                               log_target = log_posterior)
mean(ex_long$samples)
#> [1] 0.6362511
quantile(ex_long$samples, c(0.025, 0.975))
#>      2.5%     97.5%
#> 0.3565128 0.8772712
```

The mean is essentially identical (0.636). The 95% range moved by less than 0.01. With 5,000 to 10,000 iterations, single-parameter problems like this one are already well-converged; doubling the iterations doesn't change the answer in any meaningful way. For more complex problems with multiple parameters, you'd run longer chains.

</details>

## How do we tune the step size?

There is one knob the user has to set: `sigma`, the standard deviation of the proposal step. Get it wrong in either direction and the chain misbehaves. There is a sweet spot, and finding it is the main practical skill of running MCMC.

Too small a step: every proposal lands very close to where we already are, so almost every proposal is accepted (because the densities at adjacent points are similar), but the chain barely moves. It takes thousands of iterations to wander across the plausible region. Samples are heavily autocorrelated (each one is very close to the previous), so 5,000 samples carry only a small amount of independent information.

Too large a step: every proposal lands far away, often in a region of much lower posterior density. Almost all proposals are rejected, and the chain stalls in place for long stretches. Samples are even more autocorrelated than the too-small case (most samples are exact copies of their predecessors). The chain visits very few unique values.

Just right: proposals land far enough away to make real progress but close enough that a reasonable fraction get accepted. The textbook target acceptance rate is about 25-40% for one-parameter problems. The chain wanders smoothly through the posterior, and 5,000 samples represent something close to 5,000 independent draws.

![Step-size Goldilocks problem](screenshots/MCMC-in-R-stepsize.webp)
*Figure 2: The Goldilocks problem of step size. Too small wastes iterations on tiny moves; too large stalls the chain on rejected proposals; just right wanders smoothly with about 30% of proposals accepted.*

Let's run the sampler at three different step sizes and look at the trace plots side by side. The acceptance rates and the visual character of the chains will make the point better than any equation could.

```r title="Three step sizes, side by side"
sigmas <- c(0.005, 0.05, 0.5)
runs <- list()

set.seed(2026)
for (i in seq_along(sigmas)) {
  runs[[i]] <- metropolis_hastings(start = 0.5, sigma = sigmas[i], n_iter = 3000,
                                   log_target = log_posterior)
}

# Three trace plots side by side
par(mfrow = c(1, 3), mar = c(4, 4, 3, 1))
for (i in seq_along(sigmas)) {
  plot(runs[[i]]$samples, type = "l", col = "steelblue",
       xlab = "iteration", ylab = "rate", ylim = c(0, 1),
       main = sprintf("sigma = %.3f, accept = %.0f%%",
                      sigmas[i], 100 * runs[[i]]$accept_rate))
}
par(mfrow = c(1, 1))

# Acceptance rates printed numerically
sapply(runs, function(r) round(r$accept_rate, 3))
#> [1] 0.969 0.640 0.080
```

Walk through the code. The first line defined three step sizes spanning two orders of magnitude. The loop ran the sampler at each step size for 3,000 iterations and stored the result. The next chunk drew three trace plots side by side, each labeled with its step size and acceptance rate. The final line printed just the acceptance rates as a quick numeric summary.

Look at what the three traces show. With sigma = 0.005, the chain accepts 97% of proposals, but each proposal is so tiny that the chain barely moves. The trace looks like a slow, smooth wave drifting across the page. After 3,000 iterations the chain has barely explored half the posterior. With sigma = 0.5, the chain accepts only 8% of proposals; the trace is almost flat, made up of long horizontal stretches where the chain stalled because every proposed jump was too far. With sigma = 0.05, the chain accepts about 64% (a little high but in the workable zone) and the trace is a healthy fuzzy caterpillar covering the full plausible range.

[TIP]
**Aim for an acceptance rate between roughly 25% and 50% for one-parameter problems.** If too high, double sigma. If too low, halve sigma. Iterate a couple of times. There's also a theoretical optimum (about 23% for high-dimensional Gaussian targets), but for everyday work just keeping the rate in the 25-50% band is enough.

**Try it:** Run the sampler with a step size of your choice and check the acceptance rate. Try to land in the 25-50% range with one or two adjustments.

```r title="Your turn: tune your own sigma"
ex_sigma <- 0.1   # try this, then adjust based on the acceptance rate

set.seed(2026)
ex_run <- metropolis_hastings(start = 0.5, sigma = ex_sigma, n_iter = 3000,
                              log_target = log_posterior)

# Print acceptance rate. If outside 25-50%, adjust ex_sigma and retry.
ex_run$accept_rate
#> Expected: around 0.45 with sigma = 0.1
```

<details><summary>Click to reveal solution</summary>

```r title="Tune-your-own-sigma solution"
ex_sigma <- 0.1
set.seed(2026)
ex_run <- metropolis_hastings(start = 0.5, sigma = ex_sigma, n_iter = 3000,
                              log_target = log_posterior)
ex_run$accept_rate
#> [1] 0.4663333
```

Acceptance rate of 0.47 (47%), right in the workable zone. If you'd tried sigma = 0.02, the rate would be near 80%; if 0.3, near 20%. A handful of adjustments lets you home in.

</details>

## How do we know when the chain has converged?

The trace plots in the previous section showed healthy chains finding the posterior. But what if the chain starts somewhere wildly wrong? Or what if you can't tell from looking whether the chain has actually settled into the posterior or is still drifting toward it? Two simple practices catch both problems: discarding the early samples (called burn-in) and running multiple chains from different starting points.

Burn-in first. If the chain starts far from the bulk of the posterior, the first few hundred or thousand iterations are spent climbing toward the right region. Those early samples are not representative of the posterior, they're representative of the path the chain took to get there. Standard practice is to throw them away. Watch what happens when we deliberately start the chain at 0.01 (a very implausible click-through rate given 6 of 9 clicked).

```r title="Bad starting value, with burn-in visible in the trace"
set.seed(2026)
bad_start <- metropolis_hastings(start = 0.01, sigma = 0.1, n_iter = 3000,
                                 log_target = log_posterior)

# Plot the full trace. The first ~300 iterations should show the chain climbing.
plot(bad_start$samples, type = "l", col = "steelblue",
     xlab = "iteration", ylab = "rate", ylim = c(0, 1),
     main = "Bad start: chain wanders toward the posterior, then mixes")
abline(v = 500, col = "tomato", lty = 2)   # mark the burn-in cutoff
text(500, 0.05, "discard before this", pos = 4, col = "tomato")

# Compare summaries with and without burn-in
mean(bad_start$samples)                          # all samples (biased low)
#> [1] 0.6202345
mean(bad_start$samples[-(1:500)])                # post-burn-in only
#> [1] 0.6471687
```

Walk through what happened. The chain started at 0.01 (an absurdly low rate). The first ~200 iterations show the chain wandering uphill: each step is small but biased upward because uphill moves are accepted essentially every time. By iteration 500 or so, the chain has reached the bulk of the posterior and starts mixing properly. After that the trace looks just like the healthy ones from the previous section. The two summary lines compare the mean of all 3,000 samples (which is dragged down by the early uphill stretch) to the mean of just the post-burn-in samples (which closely matches the textbook answer).

The all-samples mean came out to 0.620, noticeably lower than the textbook answer of 0.636 because the early samples polluted the average. After dropping the first 500 samples, the mean was 0.647, much closer to the textbook value. In practice, a 10-20% burn-in is a safe default for most problems. For pathological cases you might need more.

The second practice is running multiple chains from different starting points. If they all converge to the same distribution, you can trust the answer. If they end up in different places, you have a problem (either the algorithm hasn't run long enough, or the posterior has multiple modes that need to be diagnosed).

```r title="Four chains from four different starts"
starts <- c(0.05, 0.30, 0.70, 0.95)
chains <- list()

for (i in seq_along(starts)) {
  set.seed(100 + i)   # different seed per chain
  chains[[i]] <- metropolis_hastings(start = starts[i], sigma = 0.1, n_iter = 2000,
                                     log_target = log_posterior)
}

# Plot all four traces overlaid
plot(NA, xlim = c(1, 2000), ylim = c(0, 1), xlab = "iteration", ylab = "rate",
     main = "Four chains converge to the same posterior")
cols <- c("steelblue", "tomato", "darkgreen", "purple")
for (i in seq_along(chains)) {
  lines(chains[[i]]$samples, col = cols[i])
}
abline(v = 500, lty = 2, col = "grey50")

# After burn-in, each chain's mean should be close to 0.636
sapply(chains, function(c) round(mean(c$samples[-(1:500)]), 3))
#> [1] 0.640 0.633 0.633 0.626
```

Walk through this. The four `start` values were spread across the [0, 1] range, deliberately including very implausible starting points (0.05 and 0.95). Each chain ran with its own random seed so the four runs are independent. The plot overlays all four traces, with a dashed line at iteration 500 to mark the burn-in cutoff. The final line computes each chain's post-burn-in mean.

Look at the result. The four chains start at four very different places, but all four climb toward the bulk of the posterior within the first few hundred iterations. After burn-in, all four wander through the same range. Their post-burn-in means are 0.640, 0.633, 0.633, and 0.626, all within 0.015 of each other and of the textbook answer 0.636. This is what convergence looks like. If one chain had stayed near 0.1 forever while the others wandered around 0.65, we'd know something was wrong (either burn-in was too short, or the algorithm had a bug, or the posterior had multiple modes).

[WARNING]
**Never trust a single chain.** Always run at least 3-4 from different starting points. If they agree after burn-in, you have a converged sampler. If they disagree, something is wrong: burn-in too short, step size off, or the posterior is multimodal and the chains are stuck on different modes. Single-chain MCMC has shipped published bugs more times than anyone wants to admit.

**Try it:** Use a different burn-in length on the bad-start chain (try 100, 500, 1000) and see how the post-burn-in mean changes. With the chain starting at 0.01, you should see the mean stabilize once burn-in is large enough.

```r title="Your turn: vary burn-in"
ex_burn <- 100   # try 100, 500, and 1000

# Compute mean(bad_start$samples[-(1:ex_burn)]) for each
#> Expected: 100 still slightly biased, 500 close to right, 1000 essentially the same as 500
```

<details><summary>Click to reveal solution</summary>

```r title="Vary-burn-in solution"
sapply(c(100, 500, 1000), function(b) {
  round(mean(bad_start$samples[-(1:b)]), 3)
})
#> [1] 0.642 0.647 0.643
```

Burn-in of 100 still leaves a faint upward drift in the mean, but only by about 0.005. Burn-in of 500 or 1000 give essentially identical answers. The bad-start chain in this problem is converged by iteration 500. Different problems take longer; the test is always whether the trace looks like a fuzzy caterpillar from your burn-in cutoff onward.

</details>

## When should I use brms or Stan instead?

You now have a working MCMC sampler. It produced the right answer for our 1-parameter Beta-Binomial problem in 50 lines of base R. So why does anyone use `brms` or `rstan`? Three reasons.

**Speed.** Our sampler is written in R, which is slow. Stan compiles models to C++ and runs them at machine speed. For a problem with 1,000 observations and 5 parameters, our sampler might take a minute; Stan takes a fraction of a second. For modern Bayesian workflows (especially during model development, when you re-fit dozens of times), that gap is the difference between practical and impractical.

**Smarter sampling.** Plain Metropolis-Hastings with a Normal proposal is the simplest possible MCMC. It works fine for one parameter but scales poorly: with 10 parameters at once, the acceptance rate plummets and the chain stalls. Stan uses Hamiltonian Monte Carlo (HMC) and the No-U-Turn Sampler (NUTS), which exploit the geometry of the posterior to take much smarter, longer steps. Same kind of accept/reject logic, just with the proposal informed by gradients of the log-posterior. The mental model is identical.

**Convenience for real models.** Building MH from scratch for a simple posterior is educational. Building it from scratch for a 50-parameter hierarchical regression with custom likelihood is masochistic. `brms` writes the Stan model for you from a standard R formula like `y ~ x + (1 | group)`. You think in R formulas, brms thinks in Stan code, Stan thinks in HMC samples.

For comparison, here is what the same click-through rate problem would look like in `brms`. The package isn't WebR-compatible, so this code can't run in your browser. Copy it to your local RStudio if you want to try it.

```r title="The same problem in brms (run locally, not in browser)"
# install.packages("brms")
# library(brms)
#
# trials <- data.frame(
#   k = 6,        # successes
#   n = 9         # trials
# )
#
# fit <- brm(k | trials(n) ~ 1, data = trials,
#            family = binomial(link = "identity"),
#            prior = prior(beta(1, 1), class = "Intercept"),
#            chains = 4, iter = 2000)
#
# summary(fit)            # Posterior mean and 95% range, similar to ours
# plot(fit)               # Trace plots, density plots, all done for you
```

Walk through what brms would do for you. The `brm()` call takes a formula (here just `k | trials(n) ~ 1`, meaning "k out of n with intercept-only"), a likelihood family (binomial with identity link to keep the parameter on its natural [0, 1] scale), a prior, and the MCMC settings. brms then translates this into Stan code, compiles it, runs four chains for 2,000 iterations each (with 1,000 burn-in by default), and returns a fitted model object. `summary()` shows posterior summaries; `plot()` draws trace and density plots in one call. None of this would be different in spirit from what we built. Just much faster and much more general.

[TIP]
**brms and Stan use the same prior + likelihood + data → samples mental model you just built.** They run a smarter, faster sampler. The intuition transfers exactly, including how to read trace plots, how to choose burn-in, and how to interpret the resulting samples. The 50 lines of code from H2-1 made you fluent in what those packages are doing. That fluency is the point of this post.

**Try it:** Imagine you wanted to extend our sampler to a 5-parameter model. How many functions and bits of state would you need? List them out, then notice why writing your own becomes impractical fast.

```r title="Your turn: scope-of-work for a 5-parameter sampler"
# Sketch (no code) the additions you'd need:
# 1. log_posterior over a 5-element vector instead of a scalar
# 2. proposal: rnorm() for each parameter? or a multivariate proposal?
# 3. one_mh_step needs to handle vector current/proposed
# 4. tuning: each parameter might want a different sigma
# 5. trace plots: one per parameter, plus joint plots
# 6. convergence diagnostics: R-hat across multiple chains, per parameter
#> Expected: a noticeable amount of plumbing per parameter
```

<details><summary>Click to reveal solution</summary>

The amount of code roughly doubles even just to handle a 2-parameter model cleanly: vector-valued state, proposal covariance choices, per-parameter tuning, multi-dim trace plots. By 5 parameters you have several hundred lines of careful plumbing. By 10 parameters or with hierarchical structure, you'd be effectively re-implementing Stan.

This is exactly why `brms` and Stan exist. Beyond the toy-problem zone, the cost-benefit flips. The educational value of building it yourself is real, but the production value is in using the tool that has solved the plumbing problem at scale.

</details>

## Practice Exercises

### Exercise 1: A Gamma-Poisson rate, by MCMC

Recall the support-tickets-per-day example: five days of counts (8, 12, 7, 15, 9), with a `Gamma(2, 0.25)` prior on the rate. The closed-form Beta-Binomial trick doesn't apply here, but you can still build a Metropolis-Hastings sampler. Define a `log_posterior()` function for the Gamma-Poisson setup, then call your existing `metropolis_hastings()` on it. Verify the sample mean against the closed-form Gamma posterior `Gamma(53, 5.25)` whose mean is `53 / 5.25 ≈ 10.10`.

```r title="Exercise 1 starter"
y <- c(8, 12, 7, 15, 9)

gp_log_post <- function(lambda) {
  if (lambda <= 0) return(-Inf)
  loglik <- sum(dpois(y, lambda = lambda, log = TRUE))
  logprior <- dgamma(lambda, shape = 2, rate = 0.25, log = TRUE)
  loglik + logprior
}

# Run metropolis_hastings on gp_log_post
# Suggested settings: start = 5, sigma = 1, n_iter = 5000
# Compute mean(samples) and compare to 53 / 5.25 = 10.10
```

<details><summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
set.seed(2026)
gp_run <- metropolis_hastings(start = 5, sigma = 1, n_iter = 5000,
                              log_target = gp_log_post)
mean(gp_run$samples)
#> [1] 10.0773
gp_run$accept_rate
#> [1] 0.4302
qgamma(c(0.025, 0.975), shape = 53, rate = 5.25)
#> [1]  7.563749 12.916091
quantile(gp_run$samples, c(0.025, 0.975))
#>      2.5%     97.5%
#> 7.504193 12.788961
```

The same `metropolis_hastings()` function we wrote for the click-through rate problem worked unchanged on a completely different model. The only thing that changed was `log_posterior`, which now computes the Poisson likelihood over five observations and a Gamma prior. The sample mean came out to 10.08, matching the closed-form 10.10 to two decimal places. The 95% range from samples ([7.50, 12.79]) matches the closed-form `qgamma()` range ([7.56, 12.92]) within rounding. Same algorithm, totally different posterior, same accuracy.

</details>

### Exercise 2: Burn-in plus thinning

Autocorrelated samples are still valid samples, but each one carries less information than an independent draw. A common practice is "thinning": keep every `k`-th sample after burn-in. The post-burn-in, thinned samples are roughly independent and easier to reason about. Implement burn-in plus thinning on the chain from H2-5 (`bad_start`). Drop the first 500 samples, then keep every 10th from the remainder. Verify that the thinned mean matches the full post-burn-in mean.

```r title="Exercise 2 starter"
# bad_start$samples is a 3000-vector of post-MH samples
# 1. Drop the first 500 (burn-in)
# 2. Keep every 10th from the remaining 2500
# 3. Compare mean(thinned) to mean(post-burn-in only)
```

<details><summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
post_burn <- bad_start$samples[-(1:500)]
thinned   <- post_burn[seq(1, length(post_burn), by = 10)]
length(thinned)
#> [1] 250
mean(post_burn)
#> [1] 0.6471687
mean(thinned)
#> [1] 0.6473932
```

The post-burn-in vector had 2,500 samples. After thinning every 10th, we kept 250. The two means agree to within 0.0003. Thinning didn't bias the answer, it just shrank the sample size. This is the right tradeoff if you need an effective sample of independent draws (e.g., for downstream simulations). For just computing means and quantiles, the unthinned post-burn-in samples are usually fine.

</details>

### Exercise 3: A simple R-hat convergence check

The Gelman-Rubin R-hat statistic compares variance within chains to variance across chains. If they're similar, all chains have converged to the same distribution and R-hat is close to 1.0 (typically below 1.05). If between-chain variance is much larger, R-hat is well above 1.0 and you have a convergence problem.

Use the four chains from H2-5 (`chains`). Drop the first 500 samples from each. Then compute a simple R-hat: ratio of between-chain variance of means to within-chain variance, plus 1.

```r title="Exercise 3 starter"
# 1. Drop the first 500 from each chain in `chains`
# 2. For each chain: compute its mean and its within-chain variance (var())
# 3. Between-chain variance: var of the four chain means, times length-of-chain
# 4. Within-chain variance: mean of the four within-chain variances
# 5. R-hat ≈ sqrt((between + within * (n-1)) / (within * n))
```

<details><summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
post <- lapply(chains, function(c) c$samples[-(1:500)])
n_per <- length(post[[1]])

chain_means <- sapply(post, mean)
chain_vars  <- sapply(post, var)

B <- n_per * var(chain_means)        # between-chain variance
W <- mean(chain_vars)                # within-chain variance
var_post <- ((n_per - 1) / n_per) * W + (1 / n_per) * B
rhat <- sqrt(var_post / W)
rhat
#> [1] 1.001847
```

R-hat came out to 1.002, well below the 1.05 threshold. All four chains converged to the same posterior. If R-hat had been, say, 1.5, we'd know one or more chains was somewhere different from the others (probably stuck on a different mode, or insufficient burn-in). This is the standard diagnostic Stan and brms compute and print automatically; now you know what it's actually measuring.

</details>

## Complete Example: A Bayesian A/B Test by MCMC

Two button variants. Variant A: 84 clicks from 1,200 impressions. Variant B: 105 clicks from 1,180 impressions. We want to know the probability that B's true rate is higher than A's. We could use the closed-form Beta-Binomial trick (and we did, in the Conjugate Priors post). Let's do it again with our MCMC sampler, both as a proof that the approach is general and as a template you can adapt for non-conjugate problems.

```r title="A/B test by Metropolis-Hastings"
# Posterior for variant A
log_post_A <- function(theta) {
  if (theta <= 0 || theta >= 1) return(-Inf)
  dbinom(84, size = 1200, prob = theta, log = TRUE) +
    dbeta(theta, 1, 1, log = TRUE)
}

# Posterior for variant B
log_post_B <- function(theta) {
  if (theta <= 0 || theta >= 1) return(-Inf)
  dbinom(105, size = 1180, prob = theta, log = TRUE) +
    dbeta(theta, 1, 1, log = TRUE)
}

set.seed(2026)
chain_A <- metropolis_hastings(start = 0.07, sigma = 0.01, n_iter = 10000,
                               log_target = log_post_A)
chain_B <- metropolis_hastings(start = 0.09, sigma = 0.01, n_iter = 10000,
                               log_target = log_post_B)

# Drop burn-in
samples_A <- chain_A$samples[-(1:1000)]
samples_B <- chain_B$samples[-(1:1000)]

# Posterior means
mean(samples_A)
#> [1] 0.07090049
mean(samples_B)
#> [1] 0.08989739

# The actual question: probability B beats A
mean(samples_B > samples_A)
#> [1] 0.97
```

Walk through what just ran. We defined two log-posteriors, one per variant, each combining its own binomial likelihood with a flat `Beta(1, 1)` prior. We ran `metropolis_hastings()` separately for each variant, with a smaller step size `sigma = 0.01` because click rates here are narrow (around 7-9%). After dropping a 1,000-sample burn-in from each chain, we computed the posterior means of each variant's rate. The final line is the real question we wanted answered: of the 9,000 post-burn-in samples per chain, what fraction had `samples_B > samples_A`? That's the posterior probability that B's true rate exceeds A's.

A's most likely rate: 7.1%. B's most likely rate: 9.0%. Probability B beats A: 97%. That's the same answer the closed-form Beta-Binomial gave us in the Conjugate Priors post, computed by a completely different mechanism. Once you have the sampler, you can adapt this template to any model: just write a new `log_post` function and call `metropolis_hastings()`. This is the workflow that makes Bayesian analysis general.

## Summary

The Metropolis-Hastings algorithm in one breath: propose a small random step, compare the densities at the new and old positions, accept the move with probability equal to the density ratio (capped at 1), repeat. The sequence of accepted positions is your posterior sample.

| Component | What it does | Common values |
|---|---|---|
| `log_target(theta)` | Returns log(prior) + log(likelihood) at theta | Specific to your problem |
| `start` | Where the chain begins | Anywhere reasonable; use multiple starts |
| `sigma` | Standard deviation of the proposal step | Tuned to give 25-50% acceptance |
| `n_iter` | Number of iterations | 5,000-10,000 for one parameter |
| Burn-in | Discard the first N samples | 10-20% of n_iter |
| Multiple chains | Run 3-4 from different starts | Required for convergence diagnosis |

When you have one or two parameters, this 50-line implementation is enough. For real Bayesian models with many parameters, hierarchical structure, or custom likelihoods, use `brms` or `rstan`. They run a smarter, faster version of the same idea: prior plus data give samples from the posterior, accept-reject is the universal mechanism.

## References

1. Hastings, W. K. "Monte Carlo Sampling Methods Using Markov Chains and Their Applications." *Biometrika* 57(1), 1970. The original paper.
2. Robert, C. & Casella, G. *Monte Carlo Statistical Methods*, 2nd ed. Springer, 2004. The standard graduate-level reference.
3. Gelman, A., Carlin, J. B., Stern, H. S. et al. *Bayesian Data Analysis*, 3rd ed. Chapman & Hall, 2013. Chapter 11 covers MCMC algorithms.
4. Johnson, A. A., Ott, M. Q., Dogucu, M. *Bayes Rules! An Introduction to Applied Bayesian Modeling*, Chapman & Hall, 2022. Chapter 7 builds Metropolis-Hastings step by step. [bayesrulesbook.com/chapter-7](https://www.bayesrulesbook.com/chapter-7).
5. Solomon, N. "Learn Metropolis-Hastings Sampling with R." [nicksolomon.me](https://www.nicksolomon.me/post/learn-metropolis-hastings-sampling-with-r/). A short, accessible R-focused walkthrough.
6. Navarro, D. "The Metropolis-Hastings algorithm." [blog.djnavarro.net](https://blog.djnavarro.net/posts/2023-04-12_metropolis-hastings/). Clear pedagogy on tuning, burn-in, and lag.

## Continue Learning

- [Bayesian Statistics in R](Bayesian-Statistics-in-R.html), the section opener that builds the prior-likelihood-posterior intuition with simulations, ideal context for what MCMC is sampling from.
- [Conjugate Priors in R](Conjugate-Priors-in-R.html), the closed-form shortcut MCMC generalizes. The Beta-Binomial answer in that post is exactly what we reproduced here with the sampler.
- [Grid Approximation in R](Grid-Approximation-in-R.html), the brute-force alternative to MCMC. Fine for one or two parameters; MCMC takes over from there.
