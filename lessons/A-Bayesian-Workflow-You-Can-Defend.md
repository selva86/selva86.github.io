---
title: "Bayesian Data Analysis Lesson 8: A Bayesian workflow you can defend"
catalog_blurb: "The seven-step order that turns one Bayesian analysis into a defensible report."
description: "Run one Bayesian analysis end to end: write the model, check the prior by simulation, fit by sampling, check convergence, check the fit, and report it."
keywords: "Bayesian workflow, prior predictive check, posterior predictive check, Metropolis sampler, Markov chain Monte Carlo, R-hat, Gelman-Rubin statistic, effective sample size, WAIC, credible interval, Poisson regression, log link, R"
post_type: "LESSON"
curriculum_id: "4.110.8"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "res-bayes"
course_title: "Bayesian Data Analysis"
course_lesson: "8"
course_total: "8"
course_landing: "Bayesian-Data-Analysis-Course.html"
course_next: ""
course_prev: "Priors-That-Regularize-Without-Dictating"
---

=== step === cover
## A Bayesian workflow you can defend

Today let's understand how to run one Bayesian analysis so carefully that a skeptical reviewer has nowhere left to push back.

Picture an app's support team. They track how many customers escalate a problem to a human agent each day, for 60 days around the launch of a new self-serve help article: 30 days before it went live and 30 days after.

Across those 60 days, 293 customers escalated in total. The daily average was 6.0 before the article and 3.7 after it. Two of the 60 days had no escalations at all, and the busiest day saw 11.

The team wants one honest answer: did the article actually cut escalations, or could a drop this size just be noise? Getting that answer right, in a way that survives questioning, takes more than fitting one model and reading off a number. It takes an order of operations, followed every time.

::widget process-flow {"steps":[{"title":"Write the model","sub":"likelihood plus prior, named before any data is touched"},{"title":"Check the prior","sub":"simulate from the prior alone, look for impossible values"},{"title":"Fit","sub":"draw from the posterior with a sampler"},{"title":"Check convergence","sub":"trace, R-hat, effective sample size"},{"title":"Check the fit","sub":"posterior predictive check against the real data"},{"title":"Compare","sub":"predictive accuracy against the alternative model"},{"title":"Report","sub":"priors, diagnostics, and a posterior summary"}]}

Every step in this lesson follows one of these seven stages, in this order, on the support team's own 60 days of data.

=== step === concept
## The question and the two models on the table

Let's build the data first, the same way every computation in this lesson will use it.

```r
# Simulate 60 days of daily escalations, 30 days before the article and 30 days after
set.seed(42)
before <- rpois(30, lambda = 5.0)
after  <- rpois(30, lambda = 3.6)
y <- c(before, after)
post_ind <- c(rep(0, 30), rep(1, 30))

mean(before)
#> [1] 6.033333
mean(after)
#> [1] 3.733333
sum(y)
#> [1] 293
sum(y == 0)
#> [1] 2
max(y)
#> [1] 11
```

`mean(before)` and `mean(after)` give the daily averages, 6.03 before the article and 3.73 after it. `sum(y)` confirms the 293 total, `sum(y == 0)` counts the 2 days with no escalations at all, and `max(y)` is the single busiest day, 11. `post_ind` is a 0/1 marker for whether a day comes before or after the launch, 0 for the first 30 days and 1 for the last 30. It is the switch one of the two candidate models will use, and the other will ignore.

Two models are on the table for these 60 days, each written down before either one is fitted.

Model A says the escalation rate never moved: one constant daily rate explains all 60 days, before and after the article alike.

Model B says the rate shifted the moment the article went live: one rate for the 30 days before, a different rate for the 30 days after.

Only one of those two claims can be right, or neither is. Finding out which one actually fits the data better, honestly, is the point.

=== step === concept
## Writing each model down: likelihood and prior

A Bayesian model has two parts, and both get written down before any fitting happens: a **likelihood**, which says how the data was generated given some unknown rate, and a **prior**, which says what values that rate could plausibly take before the data is seen.

For Model A, every one of the 60 days shares the same rate, written as lambda ("the rate"). A daily count generated from a single rate like this is described by the **Poisson distribution**, the standard model for a count of events, here escalations, that happen at some average rate over a fixed span of time, here one day.

\[ y_i \sim \text{Poisson}(\lambda) \]

That rate needs a prior. The one chosen here is **Gamma(2, 1)**, a distribution commonly used for a rate that has to stay positive:

\[ \lambda \sim \text{Gamma}(2, 1) \]

For Model B, the rate is allowed to differ before and after the launch. Call it lambda_i, a separate rate for each day i, tied to `post_ind` (0 before, 1 after) through:

\[ \log(\lambda_i) = \beta_0 + \beta_1 \cdot \text{post}_i \]

beta0 is the log of the before-rate, and beta1 is how much the log-rate shifts after the launch. Working on the log scale like this, called a **log link**, is what keeps lambda_i positive automatically, whatever beta0 and beta1 turn out to be: exponentiating any real number always gives something positive.

Both beta0 and beta1 get a prior too, chosen to be weakly informative:

\[ \beta_0, \beta_1 \sim \text{Normal}(0, 1.5) \]

Whether 1.5 is actually a safe width, or just a different-looking guess, has to be checked rather than assumed. The way to check it is to simulate from the prior alone, before it ever meets the data.

=== step === concept
## Checking a prior before it meets the data

A prior is checked the same way any claim is checked: push it to its logical conclusion and see whether that conclusion still makes sense.

Here, that means drawing many values of beta0 from each candidate prior, turning each one into a daily rate with lambda = exp(beta0), and looking at what range of rates the prior is actually claiming is plausible.

```r
# Check what each prior on beta0 implies for daily escalation rates, before using any data
set.seed(7)
vague_beta0 <- rnorm(5000, mean = 0, sd = 10)
vague_lambda <- exp(vague_beta0)

tight_beta0 <- rnorm(5000, mean = 0, sd = 1.5)
tight_lambda <- exp(tight_beta0)

mean(vague_lambda > 1000)
#> [1] 0.2364
max(vague_lambda)
#> [1] 1.538223e+15
mean(tight_lambda > 1000)
#> [1] 0
mean(tight_lambda >= 0.5 & tight_lambda <= 50)
#> [1] 0.6746
```

Look at the vague prior, Normal(0, 10), first. Out of 5000 draws, 23.64% imply a daily rate above 1000 escalations, and the single largest draw implies a rate of about 1.5 quadrillion escalations in one day. No support team on earth sees numbers like that.

A prior that puts almost a quarter of its weight on impossible values is not a neutral or safe choice. It is a strong, if accidental, claim that extreme rates are common.

Now look at the chosen prior, Normal(0, 1.5). None of its 5000 draws exceed 1000, and 67.46% of them land between 0.5 and 50 escalations a day, a range that actually matches what a support team's daily counts look like. That is why Normal(0, 1.5) is the prior used for beta0 and beta1 in Model B.

[KEY INSIGHT]
A wide prior is often picked because it sounds neutral, as though it lets the data decide everything. What it actually does is spread belief across values nobody would call plausible before ever touching the data. A prior has to be checked by simulation, the same way a model's fit does, and this check runs before any data is involved at all.

=== step === widget
## Fitting by sampling: the chain and its trace

Model A has a shortcut. Because the Gamma prior and the Poisson likelihood pair together exactly, a pairing called **conjugacy**, its posterior comes out in closed form, with no sampling needed. Model B has no such shortcut: its posterior has to be explored with a sampler, a procedure that proposes a new guess for beta0 and beta1, accepts or rejects that guess based on how much it improves the fit, and repeats thousands of times until the accepted guesses settle into a shape that is the posterior.

The simplest version of that procedure is the **Metropolis algorithm**. The widget below runs it on a generic example, not this lesson's escalation counts: a single unknown mean, explored with the same propose-and-accept idea.

Drag its proposal width and watch what happens to the chain. Too small and it crawls, barely moving. Too large and almost every proposal gets rejected. Somewhere in between, it mixes well, covering the whole posterior.

::widget mcmc-walk {}

Below that, the same Metropolis idea runs for real, on beta0 and beta1, using the escalation counts from earlier in this lesson.

```r
# Fit Model B with a from-scratch Metropolis sampler: two chains, 8000 draws each
log_post_B <- function(beta0, beta1) {
  lambda <- exp(beta0 + beta1 * post_ind)
  sum(dpois(y, lambda, log = TRUE)) +
    dnorm(beta0, 0, 1.5, log = TRUE) +
    dnorm(beta1, 0, 1.5, log = TRUE)
}

run_chain <- function(seed, n_iter, step0, step1) {
  set.seed(seed)
  beta0 <- numeric(n_iter)
  beta1 <- numeric(n_iter)
  log_post_now <- log_post_B(beta0[1], beta1[1])
  accepted <- 0
  for (i in 2:n_iter) {
    proposal0 <- beta0[i - 1] + rnorm(1, 0, step0)
    proposal1 <- beta1[i - 1] + rnorm(1, 0, step1)
    log_post_proposal <- log_post_B(proposal0, proposal1)
    if (log(runif(1)) < log_post_proposal - log_post_now) {
      beta0[i] <- proposal0
      beta1[i] <- proposal1
      log_post_now <- log_post_proposal
      accepted <- accepted + 1
    } else {
      beta0[i] <- beta0[i - 1]
      beta1[i] <- beta1[i - 1]
    }
  }
  list(beta0 = beta0, beta1 = beta1, acceptance_rate = accepted / (n_iter - 1))
}

ch1 <- run_chain(seed = 101, n_iter = 8000, step0 = 0.075, step1 = 0.105)
ch2 <- run_chain(seed = 202, n_iter = 8000, step0 = 0.075, step1 = 0.105)

round(ch1$acceptance_rate, 2)
#> [1] 0.5
round(ch2$acceptance_rate, 2)
#> [1] 0.51

warmup <- 2000
beta0_draws <- c(ch1$beta0[(warmup + 1):8000], ch2$beta0[(warmup + 1):8000])
beta1_draws <- c(ch1$beta1[(warmup + 1):8000], ch2$beta1[(warmup + 1):8000])

round(mean(beta1_draws), 3)
#> [1] -0.478
round(quantile(beta1_draws, c(0.025, 0.975)), 3)
#>   2.5%  97.5% 
#> -0.719 -0.239 
```

Each chain runs for 8000 draws, with the proposal step sizes tuned so that about half the proposals are accepted, 0.5 and 0.51 here, a healthy range for this kind of sampler. The first 2000 draws of each chain are discarded as **warm-up**: the chain needs time to wander away from its arbitrary starting point of beta0 = beta1 = 0 and find the region the posterior actually lives in. Keeping the remaining 6000 draws from each chain gives 12,000 post-warm-up draws total, pooled into `beta0_draws` and `beta1_draws`.

The posterior mean of beta1 comes out at -0.478, with a 95% interval from -0.719 to -0.239. Since beta1 is the shift in the log-rate after the launch, a negative value means the rate fell, and the fact that the whole interval sits below zero means the data is fairly confident about that direction.

But a number from one chain is not yet a result worth reporting. Whether that chain can be trusted at all is a separate question, and it has its own check.

=== step === concept
## Did it converge? Trace, R-hat and effective sample size

A single number from a single chain proves nothing on its own. That chain might have gotten stuck in one corner of the posterior and never found the rest of it. The way to catch that is to run a second, independent chain from a different starting seed and check whether the two agree.

That comparison is called **R-hat**, or the Gelman-Rubin statistic. It compares the variance of beta1 within each chain to the variance between the two chains' overall positions. If both chains are exploring the same posterior, those two variances should be close, and R-hat should sit near 1.00. A number clearly above 1.01 is the sign that the chains disagree, which means at least one of them has not yet converged.

The second number worth checking is **effective sample size (ESS)**: how many genuinely independent draws a chain's thousands of correlated draws are actually worth. A sampler that moves in small, correlated steps can hand back thousands of draws that only carry the information of a few hundred independent ones.

```r
# Check whether the two chains agree (R-hat) and how many independent draws they really give (ESS)
rhat <- function(chain_a, chain_b) {
  n <- length(chain_a)
  chain_means <- c(mean(chain_a), mean(chain_b))
  within_var  <- mean(c(var(chain_a), var(chain_b)))
  between_var <- n * var(chain_means)
  pooled_var  <- ((n - 1) / n) * within_var + between_var / n
  sqrt(pooled_var / within_var)
}

effective_sample_size <- function(chain) {
  n <- length(chain)
  autocorr <- acf(chain, plot = FALSE, lag.max = min(1000, n - 1))$acf[-1]
  first_small <- which(autocorr < 0.05)[1]
  n / (1 + 2 * sum(autocorr[1:first_small]))
}

beta1_chain1 <- ch1$beta1[(warmup + 1):8000]
beta1_chain2 <- ch2$beta1[(warmup + 1):8000]

round(rhat(beta1_chain1, beta1_chain2), 3)
#> [1] 1.001
round(effective_sample_size(beta1_chain1))
#> [1] 415
round(effective_sample_size(beta1_chain2))
#> [1] 458
```

R-hat for beta1 comes out at 1.001, close enough to 1.00 that the two chains agree: both are describing the same posterior, not two different ones. The effective sample size is 415 for the first chain and 458 for the second, 873 independent-equivalent draws out of the 12,000 kept. That is plenty to trust the interval reported a moment ago.

Had R-hat come back at, say, 1.08, the fix would never be to shorten the run. It would be to run both chains much longer, or redesign the sampler, since a short run cannot resolve a disagreement a long one has not yet resolved either.

=== step === widget
## Did the model reproduce the data? The posterior predictive check

Convergence only says the sampler explored the posterior it was given reliably. It says nothing about whether that posterior actually describes the real data well. That second question needs a different check: the **posterior predictive check (PPC)**.

The idea: pick some feature of the data that matters, simulate many brand-new datasets from the fitted model's posterior, compute that same feature on each simulated dataset, and see where the real data's value falls among them. A real value sitting comfortably in the bulk of the simulated ones says the model reproduces that feature well. A real value sitting out in the tail says the model is missing something.

Here, the feature chosen is the number of zero-escalation days, since 2 out of 60 is a specific, checkable fact a model could easily get wrong, for instance by predicting too few zero days if its fitted rate runs too high.

The widget below runs this same check on a generic example, not this lesson's escalation counts: a zero-heavy count variable, fit once with a Normal distribution and once with a Poisson, so you can see a check that catches a real problem, the Normal fit, as well as one that passes, the Poisson fit.

::widget ppc-overlay {}

Below that, the same check runs on Model B and the real escalation data.

```r
# Simulate 2000 replicate 60-day datasets from the posterior, and count zero-escalation days in each
set.seed(21)
draw_index <- sample(seq_along(beta1_draws), size = 2000, replace = TRUE)

zero_days_replicated <- numeric(2000)
for (k in 1:2000) {
  lambda_rep <- exp(beta0_draws[draw_index[k]] + beta1_draws[draw_index[k]] * post_ind)
  zero_days_replicated[k] <- sum(rpois(60, lambda_rep) == 0)
}

zero_days_observed <- sum(y == 0)

round(mean(zero_days_replicated), 2)
#> [1] 0.81
zero_days_observed
#> [1] 2
mean(zero_days_replicated >= zero_days_observed)
#> [1] 0.2035
```

Each of the 2000 replicate datasets draws its own beta0 and beta1 from the posterior, turns those into 60 daily rates, and simulates a fresh set of 60 counts from them. On average, those replicate datasets have 0.81 zero-escalation days. The real data had 2.

That gap might look like a mismatch, but the last line puts it in context: 20.35% of the 2000 replicates matched or exceeded the observed 2 zero-days. That share is the **PPC p-value**.

It is not a hypothesis-test p-value against some null claim. It is simply how common a result at least this extreme is among the model's own simulated data, and 0.2035 sits comfortably in the middle of the plausible range, nowhere near the extremes that would flag a problem. Model B reproduces this feature of the real data well.

=== step === concept
## Comparing the two models by predictive accuracy

Model A and Model B have each been fit on their own. Comparing them by which one fits the 293 observed escalations more closely would be unfair to Model A: a model with more free parameters, like Model B's two, can almost always match the data it was fit on a little better, whether or not it would predict new data any better.

The honest comparison is by **out-of-sample predictive accuracy**: how well each model would predict a new day it has not yet seen. **WAIC** (Widely Applicable Information Criterion) estimates that directly from the posterior draws already on hand, with no new data required.

WAIC is built from a **log-likelihood matrix**: for every day and every posterior draw, how likely was that day's actual count under that draw's rate. Two numbers come out of this matrix for each model.

The **lppd** (log pointwise predictive density) measures how well the model's full posterior, not just one point estimate, predicts each day: average each day's likelihood across all draws with `rowMeans`, after undoing the earlier log scale with `exp`, then take `log` of that average. The **p_waic** measures how many effective parameters the model is really using, found from the `var`iance of each day's log-likelihood across draws. WAIC combines them as -2 times lppd minus p_waic, on the same scale as a deviance, where lower is better.

```r
# Fit Model A in closed form, and compute each model's log-likelihood for every posterior draw
a_post <- 2 + sum(y)
b_post <- 1 + 60
set.seed(11)
lambda_A_draws <- rgamma(4000, shape = a_post, rate = b_post)

log_lik_A <- matrix(NA, nrow = 60, ncol = length(lambda_A_draws))
for (i in seq_along(y)) {
  log_lik_A[i, ] <- dpois(y[i], lambda_A_draws, log = TRUE)
}

log_lik_B <- matrix(NA, nrow = 60, ncol = length(beta0_draws))
for (i in seq_along(y)) {
  lambda_i <- exp(beta0_draws + beta1_draws * post_ind[i])
  log_lik_B[i, ] <- dpois(y[i], lambda_i, log = TRUE)
}

lppd_A <- sum(log(rowMeans(exp(log_lik_A))))
lppd_B <- sum(log(rowMeans(exp(log_lik_B))))

p_waic_A <- sum(apply(log_lik_A, 1, var))
p_waic_B <- sum(apply(log_lik_B, 1, var))

waic_A <- -2 * (lppd_A - p_waic_A)
waic_B <- -2 * (lppd_B - p_waic_B)

round(c(lppd_A = lppd_A, p_waic_A = p_waic_A, waic_A = waic_A), 2)
#>   lppd_A p_waic_A   waic_A 
#>  -139.58     1.28   281.72 
round(c(lppd_B = lppd_B, p_waic_B = p_waic_B, waic_B = waic_B), 2)
#>   lppd_B p_waic_B   waic_B 
#>  -131.51     2.08   267.18 
round(waic_A - waic_B, 2)
#> [1] 14.54
```

Model A's WAIC is 281.72. Model B's is 267.18, lower by 14.54, which under WAIC's lower-is-better convention makes Model B the more accurate predictor of a new day. Model B also uses more effective parameters, 2.08 against Model A's 1.28, which makes sense: it has an extra coefficient to let the rate shift after the launch, and the p_waic term already prices that extra flexibility in rather than rewarding it for free.

A gap of 14.54 sounds decisive, but a gap only means something once its own uncertainty is known.

```r
# Compute the standard error of the WAIC difference, day by day
pointwise_waic_A <- -2 * (log(rowMeans(exp(log_lik_A))) - apply(log_lik_A, 1, var))
pointwise_waic_B <- -2 * (log(rowMeans(exp(log_lik_B))) - apply(log_lik_B, 1, var))
pointwise_diff <- pointwise_waic_A - pointwise_waic_B

se_diff <- sqrt(60 * var(pointwise_diff))
round(se_diff, 2)
#> [1] 8.23
round((waic_A - waic_B) / se_diff, 2)
#> [1] 1.77
```

Breaking the difference down day by day and taking the variance of those 60 per-day gaps gives a standard error of 8.23. The gap of 14.54 is only 1.77 times that standard error: a real signal in Model B's favor, but not an overwhelming, one-sided one. Reporting that standard error next to the gap, instead of just the gap on its own, is part of what makes this comparison defensible.

=== step === concept
## Reporting a result that survives review
::prose-only the step assembles numbers already shown on earlier pages into a written report; nothing new is being visualized

Every number needed for an honest report already exists on this page. Writing it up is just assembling them in the order a skeptical reviewer would ask for them: why these priors, whether the sampler can be trusted, whether the fitted model actually reproduces the data, and what the comparison between models shows once its own uncertainty is accounted for.

> **Priors.** beta0 and beta1 each got a Normal(0, 1.5) prior. A simulation check beforehand showed why: a vaguer Normal(0, 10) prior put 23.64% of its implied daily rates above 1000 escalations, a range no support team would call plausible, while Normal(0, 1.5) put 0% above 1000 and 67.46% between 0.5 and 50, matching the data's actual range.

> **Convergence.** Two independent Metropolis chains of 8000 draws each, 2000 discarded as warm-up, gave an R-hat of 1.001 for beta1, and an effective sample size of 873 out of the 12,000 post-warm-up draws kept. Both numbers say the two chains settled on the same posterior.

> **Model check.** A posterior predictive check on the number of zero-escalation days gave a PPC p-value of 0.2035: the observed 2 zero-days sits comfortably among the 2000 simulated replicates, not out in either tail.

> **Result.** The posterior mean for beta1, the shift in the log-rate after the article launched, is -0.478, with a 95% interval from -0.719 to -0.239, entirely below zero. By WAIC, Model B predicts new days better than Model A by 14.54, against a standard error of 8.23: a real but not overwhelming margin.

If that last interval had straddled zero instead, say -0.30 to 0.15, the honest sentence to write is not "no effect was found." It is: "the data cannot rule out either a drop or a rise of this size, and more days of data would be needed to say more." A wide interval is itself a result, the result that the current data only pins the answer down loosely.

This sequence, not just its final number, is the answer to the standard objection that a Bayesian result is just whichever prior you picked.

- The prior was checked by simulation before it saw any data, not chosen to flatter an outcome.
- The sampler was checked for agreement across two independent chains.
- The fit was checked against the real data it was supposed to explain.
- The comparison against the alternative came with its own uncertainty attached.

A reviewer can push on any one of those four checks, and each one already has a recorded answer waiting.

=== step === quiz
## Quick check: a chain that disagrees with itself

Suppose Model B's two chains had come back with an R-hat of 1.08 instead of 1.001 for beta1. What should happen next?

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- Run both chains for many more draws, and consider redesigning the sampler, since 1.08 means the two chains have not yet settled on the same posterior. ::ok Exactly. R-hat compares the variance within each chain to the variance between them. A value clearly above 1.01 says the two chains still disagree about where the posterior actually is, and a short run cannot resolve a disagreement a longer one has not yet resolved either.
- Stop the chains early to save compute, since the disagreement will not get any worse. ::no Stopping earlier only locks the disagreement in before either chain has had a chance to find the region the other one is missing. An R-hat above 1.01 means more draws are needed, not fewer.
- Average the two chains' beta1 values together and report that as the posterior mean. ::no Averaging two chains that have not converged to the same posterior just blends two different, unreliable answers into one number that looks more precise than it is. R-hat has to come down first.
- Keep only the chain with the narrower interval, since the narrower one is more precise. ::no A narrower interval from an unconverged chain is not more trustworthy; it may just mean that chain got stuck in one corner of the posterior. R-hat exists precisely because a single chain cannot tell you that on its own.

=== step === quiz
## Quick check: is a wide prior ever the safe default?

A colleague argues: "I will just use a very wide prior, like Normal(0, 10), so I am not adding any assumptions of my own." Based on the prior check run earlier in this lesson, is that reasoning sound?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- Yes, a wider prior always lets the data decide the answer with no assumptions added by the person fitting the model. ::no A prior always adds some assumption, since it is a claim about what values are plausible before the data arrives. The only question is whether that assumption is a reasonable one, and the check earlier showed Normal(0, 10) was not.
- Yes, since both Normal(0, 10) and Normal(0, 1.5) are proper, well-defined distributions, so either one is an equally fine choice. ::no Being a valid, proper distribution is not the same as being a reasonable one. The check earlier showed Normal(0, 10) puts 23.64% of its weight on daily rates above 1000 escalations, a range nobody would call plausible, regardless of how well-defined the distribution is mathematically.
- No. The prior check showed Normal(0, 10) puts 23.64% of its implied daily rates above 1000 escalations, an outcome nobody considers plausible. A wide prior is not neutral; it is a strong claim that extreme values are common. ::ok Exactly. "Wide" sounds cautious, but it concentrates very little probability on the range that actually matters, 0.5 to 50 escalations a day here, and spreads the rest across values a support team would never see.
- No, because a wide prior always makes the sampler converge more slowly, which is unrelated to what values it implies. ::no Convergence speed and prior plausibility are two separate issues. The reason Normal(0, 10) is a poor choice in this lesson is specifically the implausible daily rates it implies, which is what the simulation check caught.

=== step === quiz
## Quick check: reading a PPC p-value near the extremes

This lesson's posterior predictive check gave a p-value of 0.2035 for the number of zero-escalation days, comfortably in the middle of the plausible range. What would a PPC p-value of 0.99 have meant instead?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- That the model is an even better fit than it already is. ::no A PPC p-value near either extreme, 0 or 1, is the sign of a problem, not a bonus. 0.99 would mean almost every simulated replicate had fewer zero-days than the real data, not that the model is doing great.
- That the observed data sits in the extreme tail of what the fitted model predicts for this feature, a sign the model does not reproduce it well. ::ok Exactly. A PPC p-value near 0 or 1 both say the same thing: the real data is an outlier among the model's own simulated replicates, for the specific feature being checked, here the count of zero-escalation days.
- That the sampler's two chains had not converged. ::no Convergence and model fit are two different checks. The posterior predictive check assumes the posterior draws are already trustworthy, and asks a separate question: does the fitted model reproduce the real data well.
- That the priors need to be made wider to fix the mismatch. ::no A posterior predictive check flags a problem with how the model describes the data, which could mean the wrong likelihood family or a missing predictor. Widening the priors is not a general fix for that, and the prior check earlier in this lesson already showed a wider prior creates its own problems.

=== step === tryit
## Your turn: score a third model by WAIC

A third candidate is worth checking: instead of a before/after split, what if the escalation rate simply depends on the day of the week? That model is already fit for you below, the same conjugate way Model A was fit, just with seven rates instead of one.

```r
# Already fit for you: each weekday gets its own Gamma(2,1) posterior rate, exactly like Model A
day_of_week <- rep(1:7, length.out = 60)
draws_per_day <- 6000
lambda_by_day <- matrix(NA, nrow = draws_per_day, ncol = 7)
for (day in 1:7) {
  days_idx <- which(day_of_week == day)
  set.seed(300 + day)
  lambda_by_day[, day] <- rgamma(draws_per_day, shape = 2 + sum(y[days_idx]), rate = 1 + length(days_idx))
}

log_lik_C <- matrix(NA, nrow = 60, ncol = draws_per_day)
for (i in seq_along(y)) {
  log_lik_C[i, ] <- dpois(y[i], lambda_by_day[, day_of_week[i]], log = TRUE)
}

dim(log_lik_C)
#> [1]   60 6000
```

`log_lik_C` holds 6000 posterior draws of log-likelihood for every one of the 60 days, under this day-of-week model. Score it by WAIC the same way as the model comparison earlier: average exp(log-likelihood) across draws for each day with `rowMeans`, log that for the lppd, and take the `var`iance of each day's log-likelihood across draws for p_waic.

```r
# log_lik_C holds 6000 posterior draws of log-likelihood for each of the 60 days
pointwise_lppd_C  <- log(rowMeans(exp(log_lik_C)))
pointwise_pwaic_C <- ____________        # the variance of log_lik_C across draws, one value per day

waic_C <- -2 * (sum(pointwise_lppd_C) - sum(pointwise_pwaic_C))
round(waic_C, 2)
# One line. Press Check when you have it.
```
::check {"regex": "(?=[\\s\\S]*rowMeans)(?=[\\s\\S]*exp)(?=[\\s\\S]*apply[(]log_lik_C,\\s*1,\\s*var[)])", "gate": true, "difficulty": "intermediate", "ok": "Right: a WAIC of 291.6, worse than Model A's 281.72 and worse than Model B's 267.18. The day-of-week split loses to both; the pre/post split earlier in this lesson still wins.", "no": "Reuse the earlier formula: the per-day parameter penalty is apply(log_lik_C, 1, var), the same way p_waic_A and p_waic_B were computed."}
::solution
```r
# Score the day-of-week model by WAIC, the same way as Model A and Model B earlier
pointwise_lppd_C  <- log(rowMeans(exp(log_lik_C)))
pointwise_pwaic_C <- apply(log_lik_C, 1, var)

waic_C <- -2 * (sum(pointwise_lppd_C) - sum(pointwise_pwaic_C))
round(waic_C, 2)
#> [1] 291.6
```

A WAIC of 291.6 is worse than both Model A's 281.72 and Model B's 267.18. The day-of-week split loses to both: it spends more effective parameters, seven rates instead of one or two, without buying back enough predictive accuracy to justify them. The pre/post split from earlier in this lesson still wins.

=== step === concept
## References

- [Bayesian Workflow](https://arxiv.org/abs/2011.01808) - Gelman, A., Vehtari, A., Simpson, D., Margossian, C. C., Carpenter, B., Yao, Y., Kennedy, L., Gabry, J., Burkner, P-C., Modrak, M. (2020), arXiv:2011.01808. The paper this lesson's order of operations follows: write the model, check the prior, fit, check convergence, check the fit, compare, report.
- [Inference from Iterative Simulation Using Multiple Sequences](https://doi.org/10.1214/ss/1177011136) - Gelman, A., Rubin, D. B. (1992), Statistical Science, 7(4), 457 to 472. The original R-hat (Gelman-Rubin) statistic, used here to check whether two chains agree.
- [Practical Bayesian model evaluation using leave-one-out cross-validation and WAIC](https://doi.org/10.1007/s11222-016-9696-4) - Vehtari, A., Gelman, A., Gabry, J. (2017), Statistics and Computing, 27(5), 1413 to 1432. The WAIC formula, and its standard error, used in this lesson's model comparison.
- [Visualization in Bayesian workflow](https://doi.org/10.1111/rssa.12378) - Gabry, J., Simpson, D., Vehtari, A., Betancourt, M., Gelman, A. (2019), Journal of the Royal Statistical Society: Series A, 182(2), 389 to 402. On using simulated replicates, the same idea behind this lesson's posterior predictive check, to catch a model's problems.
- [Statistical Rethinking: A Bayesian Course with Examples in R and Stan](https://www.routledge.com/product/isbn/9780367139919) - McElreath, R. (2020), 2nd edition, CRC Press. A fuller treatment of every stage in this lesson's workflow, from prior simulation through model comparison.

=== step === complete
## What this workflow buys you

Seven stages, in order: write the model, check the prior, fit, check convergence, check the fit, compare, report. Every step in this lesson was one of those seven, run once, honestly, on one dataset.

None of those stages is there for show.

- Drop the prior check and a vague prior's implausible values go unnoticed.
- Drop the convergence check and a disagreeing pair of chains hands back a confident-looking number anyway.
- Drop the posterior predictive check and a model that misses an obvious feature of the data still gets compared and reported as if it fit.
- Drop the standard error on the model comparison and a 14.54-point gap gets read as decisive when it is really 1.77 times its own uncertainty.

Run all seven, and the result that comes out the other end, Model B's rate falling after the article launched, with a 95% interval sitting entirely below zero, is not just a number from a model. It is a number with a recorded answer to every question a reviewer would think to ask about it.
