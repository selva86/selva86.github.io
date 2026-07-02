---
title: "Bayesian Modeling Lesson 4: HMC, NUTS and MCMC Diagnostics"
catalog_blurb: "The physics behind modern samplers, and the checks that catch an untrustworthy chain."
description: "How Hamiltonian Monte Carlo and NUTS explore posteriors fast, hand-built in base R, plus the checks that judge any chain: traces, R-hat, effective sample size."
keywords: "hamiltonian monte carlo, HMC, NUTS, no-u-turn sampler, mcmc diagnostics in R, r-hat, effective sample size, trace plot, divergent transitions, stan, convergence diagnostics, bayesian inference in R"
post_type: "LESSON"
curriculum_id: "6.160.4"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-bayesian"
course_title: "Bayesian Modeling"
course_lesson: "4"
course_total: "8"
course_landing: "R-Bayesian-Modeling-Course.html"
course_next: "Hierarchical-Models-and-Partial-Pooling.html"
course_prev: "MCMC-and-the-Metropolis-Sampler.html"
---

=== step === cover
::eyebrow Lesson 4 of 8
## HMC, NUTS and MCMC Diagnostics

Lesson 3 ended on a warning: a trace can look settled while exploring only half the posterior, and 20,000 steps of a crawling walk can be worth a few hundred honest draws. This lesson delivers the two things that warning demands. First, a faster engine: the physics-flavored sampler inside Stan and every serious Bayesian tool, which you will build in base R and run on Asha's order data. Second, a trust dashboard: the checks a professional runs before believing any chain.

By the end of this lesson you will be able to:

- Measure how much information a correlated chain really holds, by computing effective sample size from the chain itself
- Explain how Hamiltonian Monte Carlo turns sampling into physics, and why its far-away proposals still get accepted
- Say exactly what NUTS and warmup automate, and read a divergence warning as evidence rather than noise
- Catch a chain that looks healthy but is lying, by running several chains from dispersed starts and computing R-hat
- Run the full pre-flight dashboard (R-hat, effective sample size, divergences, overlaid traces) before trusting any fit

**Prerequisites:** Lessons 1 to 3 of this course (prior, likelihood, posterior, credible intervals, and the fifteen-line Metropolis sampler you built and tuned), plus base R functions, loops and matrices.

Below is the machine from Lesson 3. Every idea in this lesson is already visible inside it: toggle the step size and watch what the trace and the histogram do. Today you learn to read those two pictures the way a professional does, and to build the engine that makes them look right by design.

::widget mcmc-walk {}

=== step === concept
::eyebrow Scale it up
## Two unknowns, and a walk that seems fine

Lessons 2 and 3 fixed the spread of Asha's order values at $18 by decree, so that her average order value \(\mu\) was the only unknown. Nobody hands you the spread in real life. The honest model for her store treats both as unknown: \(\mu\), the true long-run average order value, and \(\sigma\) (sigma), the true dollar spread of individual orders around that average. The redesigned checkout's first full week gives her 60 orders to learn both from. Each lesson runs in a fresh interactive R session, so build the week right here (a stand-in ledger with the same shape as hers: whole-dollar orders, most between $30 and $90):

```r
set.seed(6)
orders <- round(rnorm(60, mean = 54, sd = 18))   # her first full week: 60 orders
head(orders, 12)
#>  [1] 59 43 70 85 54 61 30 67 55 35 85 33

round(c(n = length(orders), mean = mean(orders), sd = sd(orders)), 1)
#>    n mean   sd 
#> 60.0 54.6 18.7 
```

The Metropolis rule needs nothing new. The log-numerator now takes two arguments, with a prior for each unknown: the average near $55 but loosely (a normal prior with standard deviation 10), and for the spread, which must be positive, an exponential prior that keeps it in the tens of dollars (mean $20). The sampler is the one you built in Lesson 3, except each proposal nudges BOTH unknowns at once:

```r
logpost <- function(mu, sigma) {
  if (sigma <= 0) return(-Inf)                   # a dollar spread cannot be negative
  sum(dnorm(orders, mu, sigma, log = TRUE)) +    # likelihood of the 60 orders
    dnorm(mu, 55, 10, log = TRUE) +              # prior: average near $55, loosely
    dexp(sigma, rate = 1/20, log = TRUE)         # prior: spread around $20
}

metropolis2 <- function(start, prop_sd, n) {
  chain <- matrix(0, n, 2, dimnames = list(NULL, c("mu", "sigma")))
  chain[1, ] <- start
  acc <- 0
  for (i in 2:n) {
    cand <- chain[i - 1, ] + rnorm(2, 0, prop_sd)     # nudge both unknowns at once
    if (log(runif(1)) < logpost(cand[1], cand[2]) - logpost(chain[i - 1, 1], chain[i - 1, 2])) {
      chain[i, ] <- cand
      acc <- acc + 1
    } else chain[i, ] <- chain[i - 1, ]
  }
  list(chain = chain, accept = acc / (n - 1))
}

set.seed(7)
fit_rw <- metropolis2(start = c(70, 30), prop_sd = c(5, 3.5), n = 20000)
keep <- fit_rw$chain[-(1:2000), ]                # drop 2,000 steps of warm-up
round(c(accept = fit_rw$accept,
        mu = mean(keep[, "mu"]), sigma = mean(keep[, "sigma"])), 2)
#> accept     mu  sigma 
#>   0.28  54.66  18.96 

round(quantile(keep[, "mu"], c(0.025, 0.975)), 1)
#>  2.5% 97.5% 
#>  49.9  59.5 
```

By every Lesson 3 standard this run is a success. Acceptance is 0.28, right in the zone Lesson 3 promised for models with several unknowns. The average order lands at $54.66 with a credible interval of ($49.9, $59.5), and the spread lands near $19, both hugging the data. Look at the trace, and at something new: with two unknowns, each draw is a PAIR, so the posterior is a cloud of plausible (average, spread) combinations:

```r
par(mfrow = c(1, 2))
plot(keep[1:3000, "mu"], type = "l", col = "navy",
     xlab = "iteration", ylab = "average order (mu)",
     main = "The mu trace: looks settled")
plot(keep[, "mu"], keep[, "sigma"], pch = 16, cex = 0.3,
     col = adjustcolor("navy", 0.25),
     xlab = "average order (mu)", ylab = "order spread (sigma)",
     main = "The joint posterior cloud")
par(mfrow = c(1, 1))
```

A settled trace, sensible numbers, a tidy cloud. Lesson 3 would stamp this and go home. Now look closer, because this chain is quietly wasting almost 90 percent of its work.

=== step === concept
::eyebrow The crawl, measured
## Effective sample size: how many draws do you really own?

Here is the uncomfortable fact hiding in that healthy-looking run. Acceptance was 0.28, which means 72 percent of the 18,000 kept rows are literal photocopies of the row above them: the walk stayed put and wrote the same (average, spread) pair down again. And even when it moved, it moved by a small nudge. Consecutive draws are not fresh opinions about Asha's average order; they are near-copies, like a diary where each entry mostly restates yesterday.

The statistical name for near-copying is **autocorrelation**: the correlation between draws \(k\) steps apart in the chain, written \(\rho_k\) (rho). R measures it directly. For the \(\mu\) chain:

```r
rho <- acf(keep[, "mu"], lag.max = 500, plot = FALSE)$acf[-1]   # drop lag 0 (always 1)
round(rho[c(1, 2, 5, 10, 20)], 2)
#> [1]  0.77  0.60  0.26  0.04 -0.01
```

Read it as a memory span: a draw agrees 0.77 with its neighbor, 0.60 with the draw two back, and only after roughly ten steps has the chain genuinely forgotten where it was. So the honest question is not "how many draws do I have?" but "how many INDEPENDENT draws is this correlated diary worth?" That number is the **effective sample size**:

\[ N_{\text{eff}} \;=\; \frac{N}{1 + 2\sum_{k=1}^{\infty} \rho_k} \]

where \(N\) is the number of kept draws and the sum adds up the autocorrelations at every lag \(k\). If the draws were independent, every \(\rho_k\) would be 0 and \(N_{\text{eff}} = N\): you own every draw. The more slowly the memory fades, the bigger the sum, and the fewer draws you truly own. In practice the sum is cut off where the estimated correlations dip below zero, because past that point they are mostly noise (real engines use a fancier cutoff, same idea):

```r
ess <- function(x) {
  rho <- acf(x, lag.max = 500, plot = FALSE)$acf[-1]
  below <- which(rho < 0)[1]                 # sum lags until the memory fades out
  if (is.na(below)) below <- length(rho) + 1
  length(x) / (1 + 2 * sum(rho[seq_len(below - 1)]))
}

round(c(draws = nrow(keep), ess_mu = ess(keep[, "mu"]), ess_sigma = ess(keep[, "sigma"])))
#>     draws    ess_mu ess_sigma 
#>     18000      2551      1913 
```

There it is. The screen says 18,000 draws; the chain is worth about 2,551 independent ones for the average and 1,913 for the spread, roughly 14 cents of information per dollar of computation. And this is not bookkeeping pedantry, because the Monte Carlo error from Lesson 3, the wobble in any answer you read off the draws, scales with the draws you OWN, not the draws you SEE:

```r
round(c(error_honest = sd(keep[, "mu"]) / sqrt(ess(keep[, "mu"])),
        error_if_independent = sd(keep[, "mu"]) / sqrt(nrow(keep))), 3)
#>         error_honest error_if_independent 
#>                0.048                0.018 
```

[KEY INSIGHT]
Monte Carlo error is posterior spread divided by \(\sqrt{N_{\text{eff}}}\), never \(\sqrt{N}\). Treating 18,000 correlated draws as 18,000 independent ones would claim an error nearly three times smaller than the truth. A common working bar: aim for an effective sample size above 400 in total (roughly 100 per chain once you run four), and more if you care about extreme tail quantiles.

=== step === quiz
::eyebrow Check yourself
## Whose answer do you trust more?

Two analysts fit the same order-value model. Priya runs one long chain: 40,000 draws with an effective sample size of 350. Marco runs a shorter, better-mixing chain: 2,000 draws with an effective sample size of 1,500. Whose estimate of the posterior mean carries less Monte Carlo error?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Priya, because 40,000 draws is twenty times more raw information than 2,000 ::no Raw draws are not information. Her 40,000 draws are near-copies worth only 350 independent ones; Monte Carlo error follows the effective count, not the odometer.
- Marco: error scales with the square root of the EFFECTIVE sample size, and 1,500 effective draws beat 350 ::ok Right, and by a factor of about two, since the errors go as one over the square root of 350 versus 1,500. A short chain that forgets its past quickly beats a long one that photocopies itself.
- Neither, because both chains sample the same posterior and therefore give equally precise answers ::no They target the same posterior, but precision in READING it off is Monte Carlo error, and that depends on how many independent draws each chain effectively holds: 350 versus 1,500 is a real difference.

=== step === concept
::eyebrow The physics fix
## Hamiltonian Monte Carlo: flick a puck across the posterior

The crawl has one root cause: the Metropolis walker is blind. It probes one nearby spot at a time, so its steps must stay small or be rejected, and small steps mean long memory. The fix, and it is one of the loveliest ideas in computational statistics, is to give the walker physics.

Take Asha's posterior for (average, spread) and turn it upside down. Define the **potential energy** at any candidate pair \(\theta\) (theta, here the pair of \(\mu\) and \(\sigma\)) as

\[ U(\theta) \;=\; -\log\!\big(\, p(\text{data} \mid \theta)\; p(\theta) \,\big), \]

the negative of the log-numerator your sampler already computes. Where the posterior is high, \(U\) is low. The posterior hill becomes a smooth bowl, like a skate bowl, whose deepest point sits at the most plausible (average, spread) pair. Now the sampler stops being a blind walker and becomes a puck on that surface:

1. **Flick.** Give the puck a random push: a **momentum** \(p\), one number per unknown, drawn fresh each time. How hard it is flicked, and in which direction, is pure chance.
2. **Glide.** Let physics take over. The puck slides across the bowl, trading height for speed and speed for height, exactly like a skateboarder rolling through a half-pipe. Simulating the glide needs the local slope of the bowl, the **gradient** of \(U\): the pair of derivatives saying how steeply the energy rises in each direction.
3. **Land and decide.** After a fixed glide time, wherever the puck stands is the proposal, and it can be FAR from where it started.

::widget process-flow {"steps":[{"title":"Flick","sub":"give the puck a random momentum, direction and strength drawn fresh"},{"title":"Glide","sub":"L small leapfrog steps follow the slope of the energy bowl"},{"title":"Land and decide","sub":"accept with probability exp(energy before minus energy after)"},{"title":"Repeat","sub":"each landing is a posterior draw, far from the last one"}]}

Why would a far-away proposal ever be accepted? Because of energy. Write the total energy of the puck as

\[ H(\theta, p) \;=\; U(\theta) + \tfrac{1}{2}\textstyle\sum_j p_j^2, \]

potential plus kinetic (the \(p_j\) are the momentum numbers, one per unknown). Frictionless physics CONSERVES \(H\): a perfectly simulated glide ends with exactly the energy it began with. The acceptance rule for this scheme turns out to be: accept with probability \(\min(1,\, e^{H_{\text{before}} - H_{\text{after}}})\). Under perfect simulation the exponent is zero and EVERY proposal is accepted, no matter how far it traveled. In practice the glide is simulated in \(L\) small time steps of size \(\epsilon\) (epsilon) with a scheme called the **leapfrog** (it hops the momentum and position updates over each other in half steps, which keeps the simulation remarkably stable), so \(H\) drifts a little and acceptance sits just under 1. This is **Hamiltonian Monte Carlo**, HMC: named for William Rowan Hamilton, whose equations describe the glide.

[NOTE]
The price of the magic: you need the gradient of the log posterior, so every unknown must be continuous (no gradients through discrete jumps), and someone must do the calculus. Stan does it automatically for any model you write; in the next step you will do it by hand once, so you know exactly what the machine is doing.

=== step === concept
::eyebrow Build it
## HMC in base R, on Asha's real model

Two ingredients, then the engine. First the log posterior, with one adjustment: the glide happens on an open plain, and \(\sigma\) lives behind a wall at zero, so a long glide could crash straight through it. The standard fix is to let the puck roam an unconstrained coordinate \(\tau = \log \sigma\) (tau, the log of the spread), which may be any real number, and add \(\tau\) itself to the log posterior as the change-of-variables correction for measuring plausibility on the log scale (one line for us; Stan applies the same correction to every constrained parameter automatically). Second, the gradient: the two derivatives, written out once by hand.

```r
logp <- function(q) {                       # q = c(mu, tau), with tau = log(sigma)
  mu <- q[1]; sigma <- exp(q[2])
  sum(dnorm(orders, mu, sigma, log = TRUE)) +
    dnorm(mu, 55, 10, log = TRUE) +
    dexp(sigma, rate = 1/20, log = TRUE) + q[2]    # + tau: the log-scale correction
}

gradU <- function(q) {                      # slope of the ENERGY U = -logp
  mu <- q[1]; sigma <- exp(q[2]); resid <- orders - mu
  d_mu  <- sum(resid) / sigma^2 - (mu - 55) / 100            # data pull + prior pull on mu
  d_tau <- -length(orders) + sum(resid^2) / sigma^2 - sigma / 20 + 1   # same, for tau
  -c(d_mu, d_tau)                           # flip sign: energy is MINUS log posterior
}

round(gradU(c(70, log(30))), 1)             # slope at a bad start: both push toward the data
#> [1]  1.2 21.8
```

Now the engine. Flick, glide by leapfrog, land, decide. Note the step size: one \(\epsilon\) per unknown, matched to each unknown's scale, dollars for \(\mu\) and log-units for \(\tau\):

```r
hmc <- function(logp, gradU, start, eps, L, n) {
  chain <- matrix(0, n, length(start))
  chain[1, ] <- start
  acc <- 0
  for (i in 2:n) {
    q <- chain[i - 1, ]
    p <- rnorm(length(q))                   # 1. flick: fresh random momentum
    H0 <- -logp(q) + sum(p^2) / 2           #    total energy before the glide
    p <- p - eps / 2 * gradU(q)             # 2. glide: leapfrog, half step for momentum
    for (l in 1:L) {
      q <- q + eps * p                      #    full step for position
      if (l < L) p <- p - eps * gradU(q)    #    full step for momentum
    }
    p <- p - eps / 2 * gradU(q)             #    closing half step
    H1 <- -logp(q) + sum(p^2) / 2           #    total energy after the glide
    if (log(runif(1)) < H0 - H1) { chain[i, ] <- q; acc <- acc + 1 }   # 3. decide
    else chain[i, ] <- chain[i - 1, ]
  }
  list(chain = chain, accept = acc / (n - 1))
}

set.seed(11)
fit_hmc <- hmc(logp, gradU, start = c(70, log(30)), eps = c(1.1, 0.045), L = 4, n = 2000)
keep_hmc  <- fit_hmc$chain[-(1:200), ]
mu_hmc    <- keep_hmc[, 1]
sigma_hmc <- exp(keep_hmc[, 2])             # walk back from tau to dollars
round(c(accept = fit_hmc$accept, mu = mean(mu_hmc), sigma = mean(sigma_hmc)), 2)
#> accept     mu  sigma 
#>   0.98  54.66  19.00 
```

Same posterior, same answers ($54.66 and $19.00, matching the random walk), which is the point: HMC is not a different model, it is a different vehicle. Now the part that matters. This run kept one-tenth as many draws. How much information do they hold?

```r
round(acf(mu_hmc, plot = FALSE)$acf[2], 2)  # lag-1 autocorrelation of the mu chain
#> [1] -0.25

round(c(draws = length(mu_hmc), ess_mu = ess(mu_hmc), ess_sigma = ess(sigma_hmc)))
#>     draws    ess_mu ess_sigma 
#>      1800      1800      1800 
```

The lag-1 autocorrelation is not just small, it is slightly NEGATIVE: each glide carries the puck so far that the next draw does not remember the last one at all, and our estimator reads the chain as fully independent draws. Side by side:

| Engine | Kept draws | Acceptance | Effective draws for mu | Effective per 1,000 kept |
|---|---|---|---|---|
| Random-walk Metropolis | 18,000 | 28 percent | 2,551 | 142 |
| Hand-built HMC | 1,800 | 98 percent | 1,800 | 1,000 |

[KEY INSIGHT]
The random walk faced a forced trade: long steps get rejected, short steps get correlated. HMC breaks the trade, because energy conservation makes even LONG glides land at nearly equal energy: distance AND acceptance at the same time. Each draw did cost five gradient evaluations here, but the exchange rate improves as models grow: random walks degrade rapidly as unknowns multiply, while gliding holds up, which is why every modern engine glides.

=== step === concept
::eyebrow The self-driving version
## NUTS, warmup and the check-engine light

Honesty about what we just hand-tuned: the step sizes (1.1 and 0.045) and the glide length (4 leapfrog steps). Both knobs bite. Steps too coarse and the simulation destabilizes: the energy error blows up and acceptance collapses. Glide too short and the puck barely moves, back to a random walk. Glide too long and the puck loops around the bowl and comes back toward where it started, wasting compute to go nowhere: a U-turn.

The **No-U-Turn Sampler**, NUTS, removes the glide-length knob with a rule of disarming simplicity: keep extending the path, forwards and backwards in time, until any further extension would start bringing the ends closer together, then stop and pick a landing point along the path traced so far. No U-turns, no wasted glide, no L to tune. The step sizes come from **warmup**: modern engines spend their first phase (Stan's default: the first half of each chain) adapting the step size to hit a target acceptance around 0.8 and learning one scale per parameter, exactly the two numbers we set by hand, then freeze the settings and discard everything from that phase. Warmup is Lesson 3's burn-in, grown up: it is not just forgetting a bad start, it is the engine tuning itself.

One more gift from the physics: a built-in alarm. In a region of sharp curvature the leapfrog simulation can shatter, with the energy error exploding mid-glide. The engine flags that iteration as a **divergent transition** (a divergence). This is a check-engine light, not a cosmetic warning: divergences mean the sampler could not follow the geometry in exactly the region where the posterior is hardest, so the draws there are suspect and the fix is never "just draw more". Raise the engine's caution setting (in Stan, `adapt_delta`, which shrinks the step size) or rewrite the model in a friendlier shape.

In practice, you will almost never hand-roll the engine. You write the model; the engine differentiates it, transforms the constrained parameters, adapts itself, runs NUTS, and reports the diagnostics. Asha's week, production-grade (this one needs a local R with Stan installed, so read it rather than run it):

```r-static
# The honest week model in brms, which writes and compiles Stan for you.
library(brms)

week <- data.frame(order = orders)
fit  <- brm(order ~ 1, data = week, family = gaussian(),
            chains = 4, iter = 2000, seed = 6)

summary(fit)
# For every parameter the summary prints the dashboard this lesson builds:
# the estimate and interval, plus Rhat, Bulk_ESS and Tail_ESS. Four chains,
# dispersed starts, warmup adaptation and NUTS itself: all automatic.
```

=== step === quiz
::eyebrow Check yourself
## The 97 percent panic

Your first NUTS run reports 97 percent acceptance. A colleague who remembers Lesson 3 is alarmed: "We tuned Metropolis to accept around 40 percent. At 97 percent your steps must be far too timid, and the chain must be crawling." What is right?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- The colleague is right: retune until acceptance falls near 40 percent, the healthy target for any sampler ::no That target belongs to BLIND random walks, where high acceptance can only mean tiny steps. An HMC glide is guided by the gradient and conserves energy, so it achieves high acceptance at long range by design.
- Acceptance is meaningless for HMC, so the number can simply be ignored ::no It still carries signal, just with a different dial: warmup deliberately targets around 0.8, and an acceptance COLLAPSE warns that the step size is too coarse for the geometry. It is read differently, not ignored.
- The colleague is transplanting the random-walk rule: a well-simulated glide lands at nearly the same energy it started with, so far-away proposals are accepted almost every time, and high acceptance with long moves is exactly the design ::ok Right. The Metropolis trade (distance versus acceptance) is the thing HMC abolished. Near-100 percent acceptance on top of long glides is the signature of the physics working, not of timid steps.

=== step === concept
::eyebrow The lie detector
## R-hat: make chains vouch for each other

Now for the failure Lesson 3 warned about, the one no single trace can reveal. In week two Asha launches gift wrapping, and her analyst models order values as a mixture of two customer segments, regulars and gift buyers. Posteriors from models like that routinely grow TWO islands of plausibility: two rival explanations of the segments, each locally coherent. Here is such a posterior, distilled to one unknown so you can watch the failure happen: the gift-segment center sits either near $45 or near $76, and nowhere in between. Run four chains from four different starting guesses:

```r
lp_gift <- function(m) log(0.5 * dnorm(m, 45, 4) + 0.5 * dnorm(m, 76, 4))

metro1 <- function(lp, start, prop_sd, n) {      # the Lesson 3 sampler, compact form
  x <- numeric(n)
  x[1] <- start
  for (i in 2:n) {
    cand <- rnorm(1, x[i - 1], prop_sd)
    x[i] <- if (log(runif(1)) < lp(cand) - lp(x[i - 1])) cand else x[i - 1]
  }
  x
}

set.seed(4)
starts <- c(40, 50, 72, 80)                      # four deliberately scattered starts
chains <- sapply(starts, function(s) metro1(lp_gift, s, prop_sd = 2, n = 5000))
chains <- chains[-(1:500), ]                     # drop warm-up from each chain

matplot(chains, type = "l", lty = 1,
        col = c("navy", "steelblue", "firebrick", "darkorange"),
        xlab = "iteration", ylab = "gift-segment center",
        main = "Four chains, two stories")

round(colMeans(chains), 1)
#> [1] 44.9 45.2 76.0 75.7
```

Study that picture, because it is the most important failure in MCMC. Each chain, inspected ALONE, is a textbook success: steady band, quick mixing, healthy acceptance, and each would report its island's center to within about $4. But the four of them tell two different stories, $45 versus $76, depending on nothing but where each happened to start. Run one chain, and you ship whichever answer your starting point fed you, with total confidence.

The remedy is to make the chains vouch for each other, and to compress the comparison into one number. If all chains truly sample the same posterior, then the spread BETWEEN their averages should be tiny compared to the spread WITHIN each chain. **R-hat** (written \(\hat{R}\)) is exactly that comparison:

\[ \hat{R} \;=\; \sqrt{\; \frac{\tfrac{n-1}{n}\, W \;+\; \tfrac{1}{n}\, B}{W} \;} \]

where \(n\) is the length of each chain, \(W\) is the within-chain variance (the average of the four chains' individual variances) and \(B\) is the between-chain variance (how far the four chain means sit apart, scaled by \(n\)). When the chains agree, \(B\) is near zero and \(\hat{R}\) is near 1. When they disagree, \(B\) inflates the numerator and \(\hat{R}\) rises above 1. In base R:

```r
rhat <- function(ch) {                     # ch: one column per chain
  n <- nrow(ch)
  W <- mean(apply(ch, 2, var))             # spread WITHIN a typical chain
  B <- n * var(colMeans(ch))               # spread BETWEEN the chain averages
  sqrt(((n - 1) / n * W + B / n) / W)
}

round(rhat(chains), 2)
#> [1] 4.59
```

An \(\hat{R}\) of 4.59 is a fire alarm. The modern working rule is strict: trust nothing until \(\hat{R} < 1.01\) for every parameter. And on a healthy problem the alarm stays quiet. Four dispersed chains on Asha's honest week model from earlier in this lesson:

```r
set.seed(21)
starts2 <- list(c(40, 8), c(50, 45), c(70, 8), c(80, 45))   # scattered on purpose
runs <- lapply(starts2, function(s)
  metropolis2(start = s, prop_sd = c(5, 3.5), n = 10000)$chain[-(1:2000), ])
mu_chains  <- sapply(runs, function(ch) ch[, "mu"])
sig_chains <- sapply(runs, function(ch) ch[, "sigma"])

round(colMeans(mu_chains), 1)              # four chains, one story
#> [1] 54.6 54.7 54.6 54.7

round(rhat(mu_chains), 4)
#> [1] 1.0001
```

[WARNING]
R-hat can only prove failure, never success. If all four chains had been started near $45, all four would have settled on the same island and \(\hat{R}\) would purr at 1.00 while half the posterior stayed undiscovered. That is why the starts must be genuinely dispersed, and why passing diagnostics means "no lie detected", never "truth certified".

=== step === tryit
::eyebrow The dashboard
## Pre-flight checks, then take off

Everything in this lesson compresses into a routine you now run on every Bayesian fit, before believing a single number. This is the same dashboard Stan prints for every model, and you have now built each gauge yourself:

| Check | Passing bar | What failure means |
|---|---|---|
| \(\hat{R}\), on EVERY parameter | below 1.01 | the chains disagree about where the posterior is |
| Effective sample size | above 400 total, roughly 100 per chain | summaries wobble; a rerun would give different numbers |
| Divergent transitions | exactly zero | the engine could not follow the geometry; nearby draws are suspect |
| Overlaid traces | indistinguishable, like four hairy caterpillars | a chain drifts, freezes, or lives on its own island |

Run the first gauge on the honest week model. You just saw \(\mu\) pass with 1.0001. But a fit passes only when EVERY parameter passes, so engines report the WORST case. Both `mu_chains` and `sig_chains` are sitting in your session from the previous step. Compute the worst R-hat across both parameters. Fill in the blank:

```r
# the worst R-hat across every parameter of the week model
worst <- ____
round(worst, 4)
```
::check {"regex":"max\\s*\\(\\s*rhat\\s*\\(\\s*mu_chains\\s*\\)\\s*,\\s*rhat\\s*\\(\\s*sig_chains\\s*\\)\\s*\\)|max\\s*\\(\\s*rhat\\s*\\(\\s*sig_chains\\s*\\)\\s*,\\s*rhat\\s*\\(\\s*mu_chains\\s*\\)\\s*\\)","gate":true,"difficulty":"advanced","ok":"1.0002: the worst parameter still passes the 1.01 bar with room to spare. This fit earns trust: chains agree on both unknowns, effective sample sizes run to the thousands, and the traces overlap. Cleared for take-off.","no":"The dashboard judges the WORST case across all parameters: take the max of the two R-hats, max(rhat(mu_chains), rhat(sig_chains))."}
::solution
```r
worst <- max(rhat(mu_chains), rhat(sig_chains))
round(worst, 4)
#> [1] 1.0002
```

=== step === concept
::eyebrow Go deeper
## References

Five authoritative places to take this further:

- [Neal (2011), MCMC using Hamiltonian dynamics](https://arxiv.org/abs/1206.1901) - the canonical HMC chapter from the Handbook of Markov Chain Monte Carlo, by the man who brought the physics to statistics; the leapfrog you coded is his exposition.
- [Hoffman and Gelman (2014), The No-U-Turn Sampler](https://jmlr.org/papers/v15/hoffman14a.html) - the NUTS paper: the U-turn criterion, warmup adaptation, and the benchmarks that made it the default engine.
- [Betancourt (2017), A conceptual introduction to Hamiltonian Monte Carlo](https://arxiv.org/abs/1701.02434) - the deep dive on WHY gliding works and what divergences reveal about posterior geometry.
- [Vehtari, Gelman, Simpson, Carpenter and Buerkner (2021), Rank-normalization, folding, and localization: an improved R-hat](https://arxiv.org/abs/1903.08008) - the modern versions of R-hat and effective sample size that Stan actually computes, and the source of the 1.01 rule.
- [Stan Development Team, Runtime warnings and convergence problems](https://mc-stan.org/misc/warnings.html) - the practical what-to-do page for every warning on the dashboard: divergences, R-hat, low effective sample size, tree depth.

=== step === complete
## Lesson 4 complete

You measured the hidden cost of Lesson 3's random walk: 18,000 draws of Asha's honest two-unknown model worth only about 2,500 independent ones, because Monte Carlo error follows the effective sample size, not the raw count. You then rebuilt the sampler as physics: the posterior upside down as an energy bowl, a puck flicked with random momentum, a leapfrog glide guided by the gradient, and far-away proposals accepted 98 percent of the time because energy is conserved. You met NUTS, which retires the last hand-tuned knobs by refusing to U-turn, and warmup, which learns the step sizes you set by hand. And you built the trust dashboard: effective sample size, divergences as a check-engine light, and R-hat from four dispersed chains, which caught a two-island posterior lying at 4.59 and cleared the honest model at 1.0002.

Carry the habit, not just the tools: no Bayesian fit is an answer until the dashboard passes, and even then the diagnostics have only failed to catch a lie. Next, Lesson 5: Hierarchical Models and Partial Pooling, where one model learns about many groups at once, small groups borrow strength from large ones, and the funnel-shaped posteriors that result produce exactly the divergences you now know how to read.
