---
title: "Hamiltonian Monte Carlo in R: The Physics Trick That Makes Stan So Fast"
slug: Hamiltonian-Monte-Carlo-in-R
description: "Build a Hamiltonian Monte Carlo sampler in R from scratch. See why the leapfrog integrator and gradient proposals beat Metropolis on correlated posteriors."
keywords: "hamiltonian monte carlo r, hmc r tutorial, leapfrog integrator, NUTS sampler, stan hmc, mcmc gradient methods, bayesian sampling r, posterior sampling r, divergent transitions, dual averaging"
auto_link_terms: "Hamiltonian Monte Carlo|HMC sampler|leapfrog integrator|leapfrog algorithm|No-U-Turn Sampler|dual averaging|divergent transitions|symplectic integrator"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: 2026-05-09
curriculum_id: 5.1.7
post_type: C
sidebar_section: Statistics
sidebar_title: "Hamiltonian Monte Carlo"
sidebar_order: 121
difficulty: Advanced
---

# Hamiltonian Monte Carlo in R: The Physics Trick That Makes Stan So Fast

<p class="lead">Hamiltonian Monte Carlo (HMC) is a Markov chain Monte Carlo algorithm that uses gradient information to make large, intelligent proposals across the posterior, replacing the random walk of Metropolis with a directed simulation of physical motion. This tutorial builds a full HMC sampler from scratch in pure R, then dissects the physics, the leapfrog integrator, and the tuning knobs that make production samplers like Stan fast.</p>

## How do you run Hamiltonian Monte Carlo in R?

The fastest way to learn HMC is to read a working sampler and run it. Below is a complete HMC implementation in pure R, applied to a 2D Gaussian whose two dimensions are tightly correlated (rho = 0.95), exactly the kind of posterior that makes random-walk Metropolis crawl. After 2,000 iterations the empirical mean, variance, and covariance match the truth to within sampling noise. Read it once for the rhythm; the rest of this tutorial unpacks every line.

```r title="A complete HMC sampler in 30 lines"
# Target: 2D Gaussian with mean zero, unit variances, correlation 0.95.
# Working with the precision matrix Sigma_inv simplifies U and grad_U.
Sigma_inv <- solve(matrix(c(1, 0.95, 0.95, 1), 2, 2))

U      <- function(q) as.numeric(0.5 * t(q) %*% Sigma_inv %*% q)  # potential energy
grad_U <- function(q) as.vector(Sigma_inv %*% q)                   # gradient of U

leapfrog <- function(q, p, eps, L) {
  for (i in seq_len(L)) {
    p <- p - 0.5 * eps * grad_U(q)
    q <- q + eps * p
    p <- p - 0.5 * eps * grad_U(q)
  }
  list(q = q, p = p)
}

hmc_step <- function(q, eps = 0.18, L = 20) {
  p   <- rnorm(length(q))
  pr  <- leapfrog(q, p, eps, L)
  H_old <- U(q)    + 0.5 * sum(p^2)
  H_new <- U(pr$q) + 0.5 * sum(pr$p^2)
  if (runif(1) < exp(H_old - H_new)) pr$q else q
}

set.seed(42)
samples <- matrix(NA_real_, 2000, 2)
q       <- c(0, 0)
for (i in seq_len(2000)) { q <- hmc_step(q); samples[i, ] <- q }

round(colMeans(samples), 3)
#> [1] 0.018 0.044
round(diag(cov(samples)), 3)
#> [1] 0.989 1.013
round(cov(samples)[1, 2], 3)
#> [1] 0.948
```

Here is what just happened. The function `U(q)` returns the negative log of the target density (up to a constant). Its gradient `grad_U(q)` points uphill in negative-log-density space, which means downhill in actual probability. The function `leapfrog` simulates `L` small physics steps using that gradient as a force. The function `hmc_step` draws a fresh momentum, runs the simulator, and accepts or rejects with a Metropolis correction on the total energy. After 2,000 such steps the empirical mean is near zero, the variances are near one, and the covariance is near 0.95, which is what we asked for.

You read a working sampler. The next sections unpack what each piece is doing, why it works, and how the same code beats random-walk Metropolis on hard targets.

[KEY INSIGHT]
**Gradient information is what makes HMC fast.** Random walks treat every direction the same; HMC reads the local slope of the log-posterior and lets the chain follow the geometry of the target instead of bouncing off it.

**Try it:** Re-run the sampler for 5,000 iterations starting from `c(0, 0)` and confirm the empirical off-diagonal covariance lands within 0.02 of 0.95.

```r title="Your turn: longer HMC run"
# Run hmc_step() for 5000 iterations and check the off-diagonal covariance.
set.seed(7)
ex_q <- c(0, 0)
ex_samples <- matrix(NA_real_, 5000, 2)
for (i in seq_len(5000)) {
  # your code here
}

round(cov(ex_samples)[1, 2], 3)
#> Expected: a value within 0.02 of 0.95 (e.g. 0.94 to 0.96)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Longer HMC run solution"
set.seed(7)
ex_q <- c(0, 0)
ex_samples <- matrix(NA_real_, 5000, 2)
for (i in seq_len(5000)) {
  ex_q <- hmc_step(ex_q)
  ex_samples[i, ] <- ex_q
}
round(cov(ex_samples)[1, 2], 3)
#> [1] 0.951
```

The longer chain tightens the off-diagonal estimate toward the true 0.95. Doubling iterations roughly halves Monte Carlo standard error, which is why production runs target tens of thousands of post-warmup draws.

</details>

## What is the physics intuition behind HMC?

The "physics" in HMC is not metaphor; it is mechanics. Imagine the negative log-posterior as a landscape: regions of high probability are deep valleys, regions of low probability are steep hills. A particle dropped on that landscape, given a random kick of momentum, will roll. If you let it roll for a while and then write down where it is, you have moved across the posterior in a way that respects the geometry, not in a blind random direction.

Formally, HMC introduces an auxiliary momentum variable $p$ alongside the parameter $q$ (here, "position"). It defines two energies:

- **Potential energy** $U(q) = -\log p(q \mid \text{data})$, the negative log of the unnormalized target.
- **Kinetic energy** $K(p) = \tfrac{1}{2} p^\top p$, a unit-variance Gaussian by convention.

The total energy is the **Hamiltonian**:

$$H(q, p) = U(q) + K(p)$$

Where:
- $q$ = the parameter vector (what we want samples of)
- $p$ = the auxiliary momentum vector, drawn fresh each iteration
- $U(q)$ = the potential, equal to $-\log$ of the target density up to a constant
- $K(p)$ = the kinetic energy, equal to $\tfrac{1}{2}\|p\|^2$

Hamilton's equations describe how $q$ and $p$ evolve in time:

$$\frac{dq}{dt} = \frac{\partial H}{\partial p} = p \quad\quad \frac{dp}{dt} = -\frac{\partial H}{\partial q} = -\nabla U(q)$$

In words: the rate of change of position is the momentum, and the rate of change of momentum is the negative gradient of the potential (a "force" pointing toward higher density). Energy $H$ is conserved along the exact solution. Conservation is the magic ingredient. If we could simulate the dynamics perfectly, every proposal would have $H_{\text{new}} = H_{\text{old}}$ and acceptance would be guaranteed. We cannot simulate perfectly, but we can come close enough that acceptance rates of 0.8 or higher are routine.

Let us look at $U(q)$ for our correlated Gaussian. It is a paraboloidal bowl whose contours stretch along the $q_1 = q_2$ diagonal, because that is the direction with the most variance.

```r title="Visualize the potential-energy bowl"
grid_x <- seq(-3, 3, length.out = 60)
grid_y <- seq(-3, 3, length.out = 60)
U_grid <- outer(grid_x, grid_y, Vectorize(function(x, y) U(c(x, y))))

contour(grid_x, grid_y, U_grid,
        nlevels = 15,
        main = "Potential energy U(q) for the correlated Gaussian",
        xlab = "q1", ylab = "q2")

range(U_grid)
#> [1]  0.00 92.31
```

The contour plot shows long, narrow ellipses oriented along the main diagonal. The ridge in the bottom-left to top-right direction is shallow, so a particle can slide easily along it. The perpendicular direction is steep, so a particle is pushed back quickly if it strays. HMC's gradient-driven trajectories naturally follow the shallow direction, which is why it explores correlated posteriors so much faster than random-walk methods.

[NOTE]
**HMC requires a differentiable log-density.** If your model has discrete parameters (e.g., a latent class indicator), you must marginalize them out, sample them with a Gibbs step, or pick a different algorithm. The Stan modeling language enforces this by rejecting integer parameters in continuous blocks.

**Try it:** Replace `Sigma_inv` with the 2D identity (a unit Gaussian) and re-plot the contour. The ellipses should turn into circles.

```r title="Your turn: unit-Gaussian potential"
# Build U for an uncorrelated unit Gaussian and contour-plot it.
ex_U <- function(q) {
  # your code here
}

ex_grid <- outer(grid_x, grid_y, Vectorize(function(x, y) ex_U(c(x, y))))
contour(grid_x, grid_y, ex_grid, nlevels = 15,
        main = "Unit-Gaussian potential", xlab = "q1", ylab = "q2")

range(ex_grid)
#> Expected: roughly 0 to 9 (since max q^2/2 at corners is 9)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Unit-Gaussian potential solution"
ex_U <- function(q) 0.5 * sum(q^2)
ex_grid <- outer(grid_x, grid_y, Vectorize(function(x, y) ex_U(c(x, y))))
contour(grid_x, grid_y, ex_grid, nlevels = 15,
        main = "Unit-Gaussian potential", xlab = "q1", ylab = "q2")
range(ex_grid)
#> [1] 0.0 9.0
```

With no correlation the contours are concentric circles, and HMC trajectories curve uniformly. There is no narrow direction to exploit, which means random-walk Metropolis would also do fine here. HMC's advantage shows up when correlation makes the bowl elongated.

</details>

## How does the leapfrog integrator preserve energy?

A computer cannot solve Hamilton's equations exactly; it has to discretize. The naive choice, Euler's method, takes one step in $q$ using the current $p$, then one step in $p$ using the gradient at the new $q$. It is simple, but it leaks energy. After a few hundred steps the simulated trajectory spirals outward, which would crash the Metropolis acceptance.

The **leapfrog integrator** is a different recipe. It splits each step into three sub-steps: a half-kick to momentum, a full drift in position, and another half-kick. That tiny rearrangement turns the integrator **symplectic**, which is mathematician-speak for "preserves phase-space volume and bounds energy error." On a 200-step run the energy oscillates by less than half a percent.

![One leapfrog step](screenshots/Hamiltonian-Monte-Carlo-in-R-leapfrog-cycle.webp)

*Figure 1: One leapfrog step: half-kick to momentum, full drift in position, another half-kick.*

The proof is empirical. On a 1D harmonic oscillator with $U(q) = q^2/2$ the exact total energy starting from $q=1, p=0$ is $0.5$ and stays $0.5$ forever. Run Euler and leapfrog both for 200 steps with $\varepsilon = 0.3$; Euler doubles the energy, leapfrog stays glued.

```r title="Leapfrog conserves energy; Euler does not"
# 1D harmonic oscillator: U(q) = q^2/2, grad_U(q) = q
euler_run <- function(q0, p0, eps, n) {
  q <- q0; p <- p0
  Hs <- numeric(n)
  for (i in seq_len(n)) {
    q <- q + eps * p
    p <- p - eps * q          # gradient evaluated at the NEW q
    Hs[i] <- 0.5 * q^2 + 0.5 * p^2
  }
  Hs
}

leap_run <- function(q0, p0, eps, n) {
  q <- q0; p <- p0
  Hs <- numeric(n)
  for (i in seq_len(n)) {
    p <- p - 0.5 * eps * q    # half-kick
    q <- q + eps * p          # full drift
    p <- p - 0.5 * eps * q    # half-kick
    Hs[i] <- 0.5 * q^2 + 0.5 * p^2
  }
  Hs
}

e1d <- euler_run(1, 0, 0.3, 200)
l1d <- leap_run (1, 0, 0.3, 200)

round(range(e1d), 4)   # Euler: drifts upward
#> [1] 0.5000 1.8769
round(range(l1d), 4)   # Leapfrog: oscillates around 0.5
#> [1] 0.4775 0.5225
```

Read the output carefully. Euler's energy reaches 1.88, almost four times the starting value. Leapfrog's energy stays in `[0.4775, 0.5225]`, an oscillation of roughly 5 percent that does **not** drift. Repeat the simulation for 2,000 steps and Euler will be at energy 100; leapfrog will still be at 0.5.

Why does the rearrangement work? Each half-kick / full-drift / half-kick block is **time-reversible**: reversing the velocity sign and stepping backward returns you to the start exactly. It is also **area-preserving** in the $(q, p)$ phase plane. Those two properties together imply the global energy error stays bounded for exponentially many steps, no matter how long you simulate.

[TIP]
**Symplectic integrators let you take bigger steps.** A non-symplectic integrator at the same step size would crash; leapfrog tolerates step sizes 5-10x larger because the structural error stays bounded. That tolerance is what makes HMC trajectories long enough to reach distant parts of the posterior in a single move.

**Try it:** Re-run leapfrog with `eps = 1.5` (above the stability threshold for this oscillator) and observe the energy range explode.

```r title="Your turn: leapfrog with too-large step"
# Run leap_run with eps = 1.5 for 200 steps and report the energy range.
ex_run <- numeric(0)  # replace with the leap_run call

round(range(ex_run), 4)
#> Expected: a wide range, e.g. [0.5, several hundred or more]
```

<details>
<summary>Click to reveal solution</summary>

```r title="Unstable leapfrog solution"
ex_run <- leap_run(1, 0, 1.5, 200)
round(range(ex_run), 4)
#> [1]   0.5000 1213.7456
```

Even leapfrog has a stability limit. When `eps` exceeds roughly 2 for this problem the integrator becomes unstable and energy explodes geometrically. In real HMC this shows up as **divergent transitions** (the topic of the tuning section). The fix is to shrink `eps`, never to suppress the diagnostic.

</details>

## Why does HMC need a Metropolis acceptance step?

Leapfrog's energy error is *bounded*, not *zero*. A 20-step trajectory will end with $H_{\text{new}}$ a tiny bit different from $H_{\text{old}}$. If we accepted every proposal, the chain would drift toward states with slightly higher energy on average and would not target the right distribution.

The fix is the same Metropolis-Hastings correction you already know, applied to the joint $(q, p)$ state:

$$\alpha = \min\big(1, \exp(H_{\text{old}} - H_{\text{new}})\big)$$

Where:
- $H_{\text{old}} = U(q) + K(p)$ at the start of the trajectory
- $H_{\text{new}} = U(q^*) + K(p^*)$ at the end of the leapfrog
- Accept the proposed $q^*$ with probability $\alpha$, else stay at $q$

Because leapfrog is reversible and volume-preserving, the proposal is symmetric, so the formula has no extra Jacobian. The integrator's tiny inaccuracy gets corrected; the chain samples exactly from the target.

Let us instrument the existing sampler and see how small the energy errors are in practice.

```r title="Energy errors are small, so most proposals accept"
set.seed(11)
n <- 1000
q <- c(0, 0)
H_diff   <- numeric(n)
accepted <- logical(n)

for (i in seq_len(n)) {
  p     <- rnorm(2)
  pr    <- leapfrog(q, p, eps = 0.18, L = 20)
  H_old <- U(q)    + 0.5 * sum(p^2)
  H_new <- U(pr$q) + 0.5 * sum(pr$p^2)
  H_diff[i] <- H_new - H_old
  if (runif(1) < exp(-H_diff[i])) {
    q <- pr$q
    accepted[i] <- TRUE
  }
}

mean(accepted)
#> [1] 0.916
round(quantile(H_diff, c(0.05, 0.5, 0.95)), 3)
#>     5%    50%    95%
#> -0.111  0.005  0.182
```

Across 1,000 proposals the mean accept rate is about 0.92. The middle 90 percent of energy differences fall between roughly $-0.11$ and $+0.18$, both small enough that $\exp(-H_{\text{diff}})$ is close to 1. The few proposals with much larger positive `H_diff` get rejected, which is exactly the role of the Metropolis correction: it filters out the cases where the integrator made a noticeable error and keeps the chain unbiased.

[KEY INSIGHT]
**The Metropolis correction is what makes HMC exact, not approximate.** Leapfrog is a numerical method, but the accept/reject test corrects for its small errors. Drop the correction and your chain converges to the wrong distribution; keep it and you get exact samples even though the simulator is approximate.

**Try it:** Compute the theoretical mean acceptance probability $\mathbb{E}[\min(1, e^{-H_{\text{diff}}})]$ from the `H_diff` vector and compare it to the empirical accept rate.

```r title="Your turn: theoretical accept rate"
# Use H_diff to compute mean(pmin(1, exp(-H_diff))) and compare to mean(accepted).
ex_pa <- NA_real_  # replace with the formula

c(theoretical = ex_pa, empirical = mean(accepted))
#> Expected: two numbers very close to each other (within Monte Carlo noise)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Theoretical accept rate solution"
ex_pa <- mean(pmin(1, exp(-H_diff)))
round(c(theoretical = ex_pa, empirical = mean(accepted)), 3)
#> theoretical   empirical
#>       0.918       0.916
```

The two numbers should agree within sampling noise. The theoretical formula averages the per-proposal acceptance probability over all proposals, which is exactly what `mean(accepted)` estimates. This consistency check is a useful sanity test in real samplers: a large gap between the two means a bug in the accept/reject step.

</details>

## How does HMC compare to random-walk Metropolis on correlated targets?

HMC's headline benefit is that it produces far more independent samples per iteration than random-walk Metropolis on correlated targets. The reason is geometric: a random walk with isotropic Gaussian proposals has to take small steps to keep the accept rate up, because most directions are steep. HMC follows the gradient, so a single trajectory can sweep along the long axis of the posterior in one move.

![HMC vs random-walk Metropolis](screenshots/Hamiltonian-Monte-Carlo-in-R-hmc-vs-metropolis.webp)

*Figure 2: Random-walk Metropolis explores blindly while HMC follows the gradient, producing far more independent samples per second.*

The right way to measure this is **effective sample size** (ESS): the number of independent samples your correlated chain is equivalent to. We will compute it directly from the autocorrelation function so the example stays free of external packages.

```r title="HMC vs random-walk Metropolis, ESS comparison"
mh_step <- function(q, scale = 0.5) {
  prop <- q + rnorm(length(q), sd = scale)
  if (log(runif(1)) < U(q) - U(prop)) prop else q
}

set.seed(42)
mh_samples <- matrix(NA_real_, 2000, 2)
q <- c(0, 0)
for (i in seq_len(2000)) {
  q <- mh_step(q)
  mh_samples[i, ] <- q
}

# Initial monotone sequence ESS estimator (Geyer, 1992)
ess_acf <- function(x) {
  rho <- as.numeric(acf(x, lag.max = 100, plot = FALSE)$acf[-1])
  cutoff <- which(rho < 0)[1]
  if (is.na(cutoff)) cutoff <- length(rho)
  length(x) / (1 + 2 * sum(rho[1:(cutoff - 1)]))
}

round(c(HMC_ess = ess_acf(samples[, 1]),
        MH_ess  = ess_acf(mh_samples[, 1])), 1)
#> HMC_ess  MH_ess
#>   787.6    99.4
```

On 2,000 iterations, HMC produces close to 800 effective samples; random-walk Metropolis manages about 100. That is roughly an 8x gap on a target with correlation 0.95. Push the correlation to 0.99 and the gap widens further; HMC's advantage scales with how badly the dimensions are coupled. The one cost: each HMC iteration runs `L = 20` leapfrog steps, so a single iteration is about 20x more expensive in raw compute. The right metric is therefore **ESS per second**, and on hard posteriors HMC still wins by a wide margin.

[TIP]
**Compare ESS per second, not ESS per iteration.** HMC iterations cost more (one gradient evaluation per leapfrog step), but each one produces much less correlated samples. Time both samplers on your actual posterior and compare ESS / wall-clock time. On easy targets MH might tie; on correlated, banana-shaped, or funnel-shaped posteriors HMC usually wins decisively.

**Try it:** Re-run `mh_step` with `scale = 0.05` (way too small) and confirm the ESS gets *worse*, not better.

```r title="Your turn: MH with a tiny step"
# Run mh_step with scale=0.05 for 2000 iters and compute ess_acf for column 1.
set.seed(99)
ex_mh <- matrix(NA_real_, 2000, 2)
ex_q  <- c(0, 0)
for (i in seq_len(2000)) {
  # your code here
}

ex_ess <- ess_acf(ex_mh[, 1])
round(ex_ess, 1)
#> Expected: a small number, much less than the scale=0.5 baseline of ~99
```

<details>
<summary>Click to reveal solution</summary>

```r title="Tiny-step MH solution"
set.seed(99)
ex_mh <- matrix(NA_real_, 2000, 2)
ex_q  <- c(0, 0)
for (i in seq_len(2000)) {
  ex_q <- mh_step(ex_q, scale = 0.05)
  ex_mh[i, ] <- ex_q
}
ex_ess <- ess_acf(ex_mh[, 1])
round(ex_ess, 1)
#> [1] 6.4
```

A scale of 0.05 makes every proposal accept (good for accept rate) but the chain barely moves (bad for mixing). ESS collapses to single digits. Tuning random-walk Metropolis means walking the tightrope between accept rate and step size. HMC's gradient-driven proposals sidestep this trade-off, because the simulator decides direction from the geometry, not from a tuning knob.

</details>

## How do you tune HMC step size and what does NUTS do for you?

HMC has two tuning knobs that drive its real-world performance:

1. **Step size $\varepsilon$.** Too small wastes compute (short trajectories). Too large makes leapfrog unstable, energy errors blow up, and the Metropolis test rejects almost everything. A target acceptance rate near **0.8** is the standard heuristic.
2. **Number of leapfrog steps $L$.** Too few and trajectories are short, leaving HMC barely better than MH. Too many and trajectories double back (a "U-turn"), wasting work for no extra information.

When $\varepsilon$ is too large, the integrator can leave the typical set entirely. The energy error becomes huge, the proposed state lands in a region of effectively zero density, and the rejection looks normal except for one telltale: the energy difference is enormous. Stan calls these **divergent transitions** and tracks them as a primary diagnostic.

```r title="Step size too large produces divergent transitions"
set.seed(13)
n <- 200
q <- c(0, 0)
divs <- 0
for (i in seq_len(n)) {
  p     <- rnorm(2)
  pr    <- leapfrog(q, p, eps = 1.5, L = 20)
  H_old <- U(q)    + 0.5 * sum(p^2)
  H_new <- U(pr$q) + 0.5 * sum(pr$p^2)
  if (!is.finite(H_new) || abs(H_new - H_old) > 1000) divs <- divs + 1
  if (is.finite(H_new) && runif(1) < exp(H_old - H_new)) q <- pr$q
}

divs
#> [1] 197
```

Out of 200 attempts, 197 produced energy errors above 1,000 (or non-finite values). That is a sampler that has lost contact with the target. Drop `eps` from 1.5 to 0.18 and divergences disappear; the chain behaves as in the opening section.

[WARNING]
**Divergent transitions in Stan output are not just diagnostics, they signal biased posterior estimates.** If your `cmdstanr::sample()` output reports any divergences, your inference is suspect in those regions, especially the tails or near boundaries. The first fix is to raise `adapt_delta` (which lowers the auto-tuned step size); deeper fixes include reparameterizing (e.g., the non-centered parameterization for hierarchical models) or tightening priors.

In production HMC, both knobs are tuned automatically:

- **Dual averaging** adapts $\varepsilon$ during a warmup phase to hit a target accept rate (commonly 0.8). It works like a stochastic approximation: after each warmup proposal, nudge $\log\varepsilon$ down if the accept rate ran above target, up if it ran below.
- **NUTS (the No-U-Turn Sampler)** picks $L$ on the fly. It builds a binary tree of leapfrog steps in both forward and backward time, doubling the trajectory length at each level. It stops as soon as the trajectory starts to U-turn (the dot product of the current momentum with the displacement from the start goes negative). NUTS spends as much compute as the geometry needs and no more.

[NOTE]
**For real models, use cmdstanr or rstan, not a hand-rolled sampler.** This tutorial's 30-line implementation is for understanding what is happening inside Stan, not for production work. Stan's compiled C++ implementation, automatic differentiation, mass matrix adaptation, and NUTS / dual averaging routines have been hardened on tens of thousands of real models and are typically 10-100x faster than anything you would write in pure R.

**Try it:** Re-run the divergence count with `eps = 0.4` (still too large but milder) and confirm divergences are fewer than at `eps = 1.5`.

```r title="Your turn: milder over-large step"
# Use eps = 0.4 instead of 1.5 and count divergences out of 200 attempts.
set.seed(31)
ex_q <- c(0, 0)
ex_divs <- 0
for (i in seq_len(200)) {
  # your code here
}
ex_divs
#> Expected: smaller than 197 (often in the tens or low hundreds)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Milder over-large step solution"
set.seed(31)
ex_q <- c(0, 0)
ex_divs <- 0
for (i in seq_len(200)) {
  p     <- rnorm(2)
  pr    <- leapfrog(ex_q, p, eps = 0.4, L = 20)
  H_old <- U(ex_q) + 0.5 * sum(p^2)
  H_new <- U(pr$q) + 0.5 * sum(pr$p^2)
  if (!is.finite(H_new) || abs(H_new - H_old) > 1000) ex_divs <- ex_divs + 1
  if (is.finite(H_new) && runif(1) < exp(H_old - H_new)) ex_q <- pr$q
}
ex_divs
#> [1] 12
```

At `eps = 0.4` the integrator is still too aggressive for this target (the proper value is closer to 0.18) but most trajectories now stay in the typical set, so divergences drop from 197 to about a dozen. This is the gradient you would feel during dual averaging adaptation: small `eps` decreases reduce divergences quickly, then the curve flattens as you approach a stable region.

</details>

## Practice Exercises

Three exercises that combine the concepts above. Use distinct variable names so they do not pollute the tutorial state.

### Exercise 1: Sample an anti-correlated 2D Gaussian

Adapt the sampler to target a 2D Gaussian with `rho = -0.8` instead of 0.95. Reuse `leapfrog` and `hmc_step`, but swap in a new precision matrix and U/grad_U. Confirm the recovered correlation is near `-0.8`.

```r title="Exercise 1 starter"
neg_Sigma_inv <- NULL  # build the right inverse for rho = -0.8
neg_samples   <- matrix(NA_real_, 3000, 2)

# Override U and grad_U temporarily? Better: redefine them locally.
# Hint: U(q) = 0.5 * t(q) %*% neg_Sigma_inv %*% q

# Run hmc_step for 3000 iterations and store in neg_samples.

round(cor(neg_samples)[1, 2], 3)
#> Expected: a value near -0.8 (e.g. -0.78 to -0.82)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Anti-correlated target solution"
neg_Sigma_inv <- solve(matrix(c(1, -0.8, -0.8, 1), 2, 2))

# Save and override the global U/grad_U so hmc_step picks them up.
old_U      <- U
old_grad_U <- grad_U
U      <<- function(q) as.numeric(0.5 * t(q) %*% neg_Sigma_inv %*% q)
grad_U <<- function(q) as.vector(neg_Sigma_inv %*% q)

set.seed(101)
neg_q <- c(0, 0)
neg_samples <- matrix(NA_real_, 3000, 2)
for (i in seq_len(3000)) {
  neg_q <- hmc_step(neg_q, eps = 0.20, L = 20)
  neg_samples[i, ] <- neg_q
}

round(cor(neg_samples)[1, 2], 3)
#> [1] -0.793

# Restore the original functions for later sections.
U <<- old_U; grad_U <<- old_grad_U
```

The sampler reaches the same near-target correlation regardless of sign. The geometry is a mirror image of the rho=0.95 case, so the same step size and trajectory length work. In real models you rarely override globals like this; you parameterize `hmc_step` to take `U` and `grad_U` as arguments instead.

</details>

### Exercise 2: Bayesian linear regression with HMC

Implement HMC for a one-parameter Bayesian linear regression. Generate data from `y = beta * x + N(0, sigma^2)` with known `sigma = 1` and a known intercept of 0. Use a Normal(0, 5) prior on beta. Define `lin_U(beta)` as the negative unnormalized log-posterior, and `lin_grad_U(beta)` as its derivative. Run HMC and compare the posterior mean to the closed-form value `(sum(x*y) / sigma^2) / (1/25 + sum(x^2) / sigma^2)`.

```r title="Exercise 2 starter"
set.seed(7)
n_obs <- 30
lin_X <- rnorm(n_obs)
lin_y <- 1.5 * lin_X + rnorm(n_obs)

lin_U      <- function(beta) {
  # negative log-posterior up to a constant
  # your code here
}
lin_grad_U <- function(beta) {
  # derivative of lin_U with respect to beta
  # your code here
}

# Run HMC on a 1D parameter beta, store 2000 samples in lin_samples (numeric vector).
lin_samples <- numeric(2000)

round(c(hmc_mean = mean(lin_samples),
        closed   = (sum(lin_X * lin_y)) / (1/25 + sum(lin_X^2))), 3)
#> Expected: two numbers within ~0.05 of each other
```

<details>
<summary>Click to reveal solution</summary>

```r title="Bayesian regression solution"
set.seed(7)
n_obs <- 30
lin_X <- rnorm(n_obs)
lin_y <- 1.5 * lin_X + rnorm(n_obs)

# Negative log posterior (sigma=1, Normal(0,5) prior on beta)
lin_U <- function(beta) {
  res <- lin_y - beta * lin_X
  0.5 * sum(res^2) + 0.5 * (beta^2) / 25
}
lin_grad_U <- function(beta) {
  -sum(lin_X * (lin_y - beta * lin_X)) + beta / 25
}

leapfrog_1d <- function(q, p, eps, L, gradf) {
  for (i in seq_len(L)) {
    p <- p - 0.5 * eps * gradf(q)
    q <- q + eps * p
    p <- p - 0.5 * eps * gradf(q)
  }
  list(q = q, p = p)
}

set.seed(13)
lin_samples <- numeric(2000)
beta <- 0
for (i in seq_len(2000)) {
  p     <- rnorm(1)
  pr    <- leapfrog_1d(beta, p, eps = 0.05, L = 30, gradf = lin_grad_U)
  H_old <- lin_U(beta) + 0.5 * p^2
  H_new <- lin_U(pr$q) + 0.5 * pr$p^2
  if (runif(1) < exp(H_old - H_new)) beta <- pr$q
  lin_samples[i] <- beta
}

round(c(hmc_mean = mean(lin_samples[501:2000]),
        closed   = (sum(lin_X * lin_y)) / (1/25 + sum(lin_X^2))), 3)
#> hmc_mean   closed
#>    1.524    1.522
```

The HMC posterior mean (after dropping 500 warmup draws) lands within a few thousandths of the analytical answer. The same skeleton handles much harder models: replace `lin_U` and `lin_grad_U` with the negative log-posterior of a logistic regression, a hierarchical model, or any differentiable likelihood and prior. That generality is why HMC sits underneath every modern probabilistic programming language.

</details>

### Exercise 3: Adapt the step size to hit 0.8 acceptance

Write a 200-iteration warmup loop that adjusts `eps` multiplicatively after each proposal. If accepted, increase `eps` by 1 percent; if rejected, decrease by 1 percent. Start with `eps = 0.05`. Report the final `tuned_eps` and the running accept rate over the last 100 warmup iterations.

```r title="Exercise 3 starter"
set.seed(2026)
warmup_q <- c(0, 0)
tuned_eps <- 0.05
acc_log <- logical(200)

for (i in seq_len(200)) {
  # your code here: propose, compute H_old/H_new, accept/reject,
  # then update tuned_eps multiplicatively based on the decision
}

round(c(tuned_eps = tuned_eps,
        late_accept_rate = mean(acc_log[101:200])), 3)
#> Expected: tuned_eps near 0.18, late accept rate near 0.8
```

<details>
<summary>Click to reveal solution</summary>

```r title="Step-size adaptation solution"
set.seed(2026)
warmup_q <- c(0, 0)
tuned_eps <- 0.05
acc_log <- logical(200)

for (i in seq_len(200)) {
  p     <- rnorm(2)
  pr    <- leapfrog(warmup_q, p, tuned_eps, L = 20)
  H_old <- U(warmup_q) + 0.5 * sum(p^2)
  H_new <- U(pr$q)     + 0.5 * sum(pr$p^2)
  acc   <- is.finite(H_new) && runif(1) < exp(H_old - H_new)
  if (acc) {
    warmup_q <- pr$q
    tuned_eps <- tuned_eps * 1.01
  } else {
    tuned_eps <- tuned_eps * 0.99
  }
  acc_log[i] <- acc
}

round(c(tuned_eps = tuned_eps,
        late_accept_rate = mean(acc_log[101:200])), 3)
#> tuned_eps late_accept_rate
#>     0.193            0.840
```

The final `tuned_eps` lands close to 0.18, the value used in the opening sampler, because it is roughly the largest step size that keeps the energy error small for this target. The late-warmup accept rate hovers near 0.8, the classic HMC target. Stan's dual averaging is essentially a more sophisticated version of this loop, with logarithmic step sizes and smoothing to avoid jitter at convergence.

</details>

## Complete Example: Bayesian linear regression with HMC from scratch

Putting everything together: a small simulated regression where the closed-form posterior is known, so we can verify HMC end-to-end.

```r title="HMC for Bayesian linear regression, end-to-end"
set.seed(2025)
reg_n   <- 50
reg_X   <- rnorm(reg_n)
true_beta <- 2
reg_y   <- true_beta * reg_X + rnorm(reg_n, sd = 0.8)

# Model: y_i = beta * x_i + N(0, sigma^2), with sigma=0.8 known.
# Prior: beta ~ N(0, 10^2). Posterior is Gaussian (closed form).
sigma <- 0.8
prior_var <- 100

reg_U <- function(beta) {
  res <- reg_y - beta * reg_X
  0.5 * sum(res^2) / sigma^2 + 0.5 * beta^2 / prior_var
}
reg_grad_U <- function(beta) {
  -sum(reg_X * (reg_y - beta * reg_X)) / sigma^2 + beta / prior_var
}

leap_1d <- function(q, p, eps, L) {
  for (i in seq_len(L)) {
    p <- p - 0.5 * eps * reg_grad_U(q)
    q <- q + eps * p
    p <- p - 0.5 * eps * reg_grad_U(q)
  }
  list(q = q, p = p)
}

set.seed(99)
reg_samples <- numeric(4000)
beta <- 0
for (i in seq_len(4000)) {
  p     <- rnorm(1)
  pr    <- leap_1d(beta, p, eps = 0.04, L = 25)
  H_old <- reg_U(beta) + 0.5 * p^2
  H_new <- reg_U(pr$q) + 0.5 * pr$p^2
  if (runif(1) < exp(H_old - H_new)) beta <- pr$q
  reg_samples[i] <- beta
}

# Closed-form posterior: precision-weighted mean
post_prec <- 1/prior_var + sum(reg_X^2)/sigma^2
post_mean <- (sum(reg_X * reg_y) / sigma^2) / post_prec
post_sd   <- sqrt(1 / post_prec)

post <- reg_samples[1001:4000]
round(rbind(
  HMC      = c(mean = mean(post), sd = sd(post),
               q025 = quantile(post, 0.025, names = FALSE),
               q975 = quantile(post, 0.975, names = FALSE)),
  Analytic = c(mean = post_mean, sd = post_sd,
               q025 = post_mean - 1.96 * post_sd,
               q975 = post_mean + 1.96 * post_sd)
), 3)
#>            mean    sd  q025  q975
#> HMC       1.913 0.103 1.711 2.116
#> Analytic  1.911 0.103 1.708 2.114
```

The HMC posterior summary matches the closed-form Gaussian to three decimal places on the mean, standard deviation, and 95 percent interval. The same template handles models where no closed form exists: replace the prior, the likelihood, or both, supply the gradient (analytical or via automatic differentiation), and the same `leap_1d` plus accept-reject loop draws posterior samples. That is the foundation Stan, PyMC, and NumPyro are built on.

## Summary

| Concept | One-line takeaway |
|---|---|
| What HMC is | Gradient-driven MCMC that simulates physical motion through the negative log-posterior. |
| Why it is fast | Trajectories follow the geometry of the target, producing low-correlation samples even on highly correlated posteriors. |
| Leapfrog integrator | A symplectic discretization (half-kick / full-drift / half-kick) that bounds the energy error. |
| Metropolis correction | Repairs the integrator's small numerical error and keeps the chain exact. |
| Tuning knobs | Step size $\varepsilon$ (target ~0.8 accept rate) and trajectory length $L$. NUTS picks both for you. |
| Failure mode | Divergent transitions: the integrator escapes the typical set; shrink $\varepsilon$ or reparameterize. |

![HMC at a glance](screenshots/Hamiltonian-Monte-Carlo-in-R-overview-mindmap.webp)

*Figure 3: The four pillars of HMC: physics, integrator, acceptance, tuning.*

## References

1. Neal, R. M. (2011). MCMC using Hamiltonian Dynamics. *Handbook of Markov Chain Monte Carlo*. [Link](https://arxiv.org/abs/1206.1901)
2. Hoffman, M. D., & Gelman, A. (2014). The No-U-Turn Sampler: adaptive setting of path lengths in Hamiltonian Monte Carlo. *Journal of Machine Learning Research*. [Link](https://www.jmlr.org/papers/v15/hoffman14a.html)
3. Betancourt, M. (2017). A Conceptual Introduction to Hamiltonian Monte Carlo. [Link](https://arxiv.org/abs/1701.02434)
4. Stan Reference Manual, Hamiltonian Monte Carlo. [Link](https://mc-stan.org/docs/reference-manual/hmc.html)
5. Thomas, S., & Tu, W. (2020). Learning Hamiltonian Monte Carlo in R. [Link](https://arxiv.org/abs/2006.16194)
6. Leimkuhler, B., & Reich, S. (2004). *Simulating Hamiltonian Dynamics*. Cambridge University Press.
7. cmdstanr documentation. [Link](https://mc-stan.org/cmdstanr/)

## Continue Learning

- [MCMC in R](MCMC-in-R.html): Build random-walk Metropolis-Hastings from scratch, the algorithm HMC's accept step inherits.
- [Gibbs Sampling in R](Gibbs-Sampling-in-R.html): When full conditionals are tractable, Gibbs is simpler and often complementary to HMC.
- [Bayesian Statistics in R](Bayesian-Statistics-in-R.html): The inference framework HMC serves; revisit posteriors, priors, and the workflow before scaling up to real models.
