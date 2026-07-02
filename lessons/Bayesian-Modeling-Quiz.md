---
title: "Bayesian Modeling: Quiz"
description: "A graded check on the Bayesian modeling section: the prior-times-likelihood update, conjugacy and priors, MCMC and the Metropolis sampler, HMC diagnostics, hierarchical partial pooling, posterior predictive checks, LOO and WAIC, and Bayesian GLMs."
keywords: "R quiz, bayesian modeling, posterior, conjugate prior, credible interval, metropolis, mcmc, r-hat, divergences, partial pooling, shrinkage, posterior predictive check, loo, waic, elpd, bayesian glm, ds-bayesian"
post_type: "LESSON"
curriculum_id: "6.160.9"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-bayesian"
course_title: "Bayesian Modeling"
course_lesson: "9"
course_total: "9"
course_landing: "R-Bayesian-Modeling-Course.html"
lesson_kind: "quiz"
course_prev: "Bayesian-Regression-and-GLMs-End-to-End.html"
course_next: ""
catalog_blurb: "Check what stuck before you move on."
---

=== step === cover
::eyebrow Check your understanding
## Quiz
You have built the Bayesian workflow from one line of Bayes rule up to a full regression: the prior-times-likelihood update, conjugate posteriors and the priors that earn them, sampling a posterior with the Metropolis algorithm, reading the trust dashboard (R-hat, effective sample size, divergences), pooling small groups toward a learned prior, checking a fitted model by making it invent data, ranking rivals on days they never saw with LOO and WAIC, and finally a GLM with priors, a fit, checks, and honest intervals. This quiz checks what stuck. The last two steps are live R you can run.

=== step === quiz
::eyebrow Question 1 of 10
## What the posterior is
Asha starts with a prior for her sign-up rate and collects a day of data. Which statement describes the posterior she should report?
::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The posterior is whichever of the prior or the likelihood is sharper; the other is discarded. ::no Bayes rule keeps both. The posterior is proportional to prior times likelihood, so a sharp prior and a sharp likelihood both pull on the answer; neither is thrown away.
- The posterior is proportional to the prior times the likelihood: the prior belief reweighted by how well each rate explains the data. ::ok Correct: posterior is proportional to prior times likelihood. The data does not replace the prior, it reweights it, and with enough data the likelihood dominates.
- The posterior is the likelihood alone; the prior only matters before any data arrives. ::no That is maximum likelihood, not Bayes. The prior stays in the product; it simply matters less as data accumulates.
- The posterior is the average of the prior mean and the sample mean. ::no Only in special cases does it look like a simple average, and even then it is a precision-weighted one. In general the posterior is the normalized product of the two curves.

=== step === quiz
::eyebrow Question 2 of 10
## What conjugacy buys you
A Beta prior on a proportion, updated with binomial data, gives a Beta posterior. Why does that matter in practice?
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- The posterior has the same family as the prior, so the update is closed-form arithmetic (add successes and failures to the two parameters), with no sampling needed. ::ok Correct: conjugacy means prior and posterior share a family, so updating is exact and instant. Beta(a, b) with s successes in n trials becomes Beta(a + s, b + n - s).
- Conjugacy guarantees the prior is uninformative, so the result is objective. ::no A conjugate prior can be as strong or weak as you like; conjugacy is about mathematical convenience, not neutrality.
- Conjugacy makes the posterior identical to the prior, so the data has no effect. ::no The data moves the parameters (adds successes and failures). Conjugacy preserves the family, not the values.
- Only conjugate models can be fit in R; non-conjugate ones cannot be estimated. ::no Non-conjugate models are fit constantly, by MCMC. Conjugacy just spares you the sampler when it applies.

=== step === quiz
::eyebrow Question 3 of 10
## Credible interval versus confidence interval
Asha reports a 90% credible interval of 0.09 to 0.23 for her sign-up rate. What is she entitled to say?
::quiz {"correct": 3, "gate": true, "difficulty": "advanced"}
- Over many repeated studies, 90% of intervals built this way would contain the true rate. ::no That is the frequentist confidence-interval reading, a statement about the procedure across hypothetical repetitions, not about this one interval.
- The rate is definitely between 0.09 and 0.23. ::no Nothing is certain: 10% of the posterior mass lies outside the interval. It is a 90% statement, not a guarantee.
- Given her prior and this data, there is a 90% posterior probability the true rate lies in that interval. ::ok Correct: a credible interval is a direct probability statement about the parameter given the model and data, which is exactly the plain-English reading people wrongly attach to confidence intervals.
- The interval is the range of rates the data could have produced. ::no It summarizes belief about the parameter, not the range of possible data. That would be a prediction interval.

=== step === quiz
::eyebrow Question 4 of 10
## Why sample at all
For a two-parameter Poisson GLM there is no conjugate shortcut, so you ran a Metropolis sampler. What is the sampler actually giving you?
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- A large set of draws whose histogram approximates the posterior, so any summary (mean, interval, tail probability) becomes counting over the draws. ::ok Correct: MCMC replaces an intractable integral with draws you can summarize by simple arithmetic. Once you hold the draws, every question is answered the same way, by summarizing them.
- The single most probable parameter value, and nothing else. ::no That is a point estimate (the mode). The sampler's value is the whole cloud of draws, which carries the uncertainty a single point throws away.
- An exact algebraic formula for the posterior. ::no If an exact formula were available you would not need the sampler. MCMC gives draws, not a closed form.
- A guarantee that the model is correct. ::no Sampling only explores the posterior of the model you wrote; whether that model is any good is what the checks in later lessons decide.

=== step === quiz
::eyebrow Question 5 of 10
## A green dashboard
A fitted model reports R-hat 1.00 on every parameter and effective sample sizes in the thousands. A colleague says: "diagnostics are clean, so the model is validated." What is the sharpest correction?
::quiz {"correct": 3, "gate": true, "difficulty": "advanced"}
- He is right: R-hat near 1 and high effective sample size together certify the model. ::no Those two gauges certify the SAMPLING, not the model. They say the chains agree and mixed well, nothing about whether the model describes the world.
- R-hat near 1 proves the chains found the true posterior mode. ::no R-hat compares within-chain and between-chain variance; it detects disagreement between chains, and can pass even when all chains are stuck in the same wrong place.
- The dashboard checks that the sampler explored the posterior well (chains agree, draws are plentiful); whether the model itself is any good is a separate question, answered by a posterior predictive check. ::ok Correct: sampling diagnostics and model checking are different jobs. A closed-form model has nothing for R-hat to inspect yet can still be badly wrong, which is exactly why posterior predictive checks exist.
- High effective sample size means the priors were chosen correctly. ::no Effective sample size measures how much independent information the draws carry; it says nothing about the priors.

=== step === quiz
::eyebrow Question 6 of 10
## Divergences are geometry
Fitting a hierarchical model on a few small groups, the sampler reports R-hat 1.00 and 40 divergent transitions. What is the right move?
::quiz {"correct": 2, "gate": true, "difficulty": "advanced"}
- Ignore them: R-hat passed, so divergences are cosmetic. ::no Divergences mean the sampler could not follow the posterior's geometry near the funnel's neck, so the draws where the group spread is small are undersampled and biased. A dashboard passes only when every gauge passes.
- Reparameterize to the non-centered form (sample a standardized effect and reconstruct), which reshapes the funnel so one step size works everywhere; raise the sampler's caution setting only if needed. ::ok Correct, and in that order. Non-centering cures the geometry that causes the divergences; tightening the step size only tiptoes; more iterations never help, because divergence is geometry and does not average out.
- Quadruple the iterations until the divergences wash out. ::no The step size that fails in the neck at 2,000 iterations fails there at 200,000. More draws just restate the biased region with more confidence.
- Drop the hierarchy and fit each group separately. ::no That throws away the partial pooling that halves the error, to spare the sampler an inconvenience. Fix the coordinates, not the model.

=== step === quiz
::eyebrow Question 7 of 10
## Partial pooling
A league table of eight plant families crowns a two-order family at $75 a kit. A hierarchical model shrinks that estimate to $58 and cuts the table's typical error in half. Why does shrinkage help here?
::quiz {"correct": 2, "gate": true, "difficulty": "advanced"}
- Shrinkage always pulls estimates toward zero, which happens to be closer here. ::no It pulls toward the shared center (the store-wide average around $55), not toward zero, and it pulls small, noisy groups much harder than large ones.
- A two-order average is mostly luck, so the model borrows strength from the other families, keeping little of the raw average for tiny groups and most of it for large ones. ::ok Correct: the pooling weight tracks each group's evidence. A tiny group keeps little of its own noisy average and leans on the learned prior; a large group barely moves. That asymmetry is what beats the raw table.
- The model simply averages all eight families into one number. ::no That is complete pooling, which erases the differences Asha asked about. Partial pooling keeps per-family estimates, just regularized toward the center.
- Shrinkage lowers every estimate, so the ranking is unchanged. ::no It does not lower every estimate uniformly, and it can and did change the ranking (the two-order family lost the top slot to a better-evidenced one).

=== step === quiz
::eyebrow Question 8 of 10
## Reading a posterior predictive p-value
You score a fitted model on a test statistic and get a posterior predictive p-value of 0.03. What does it tell you?
::quiz {"correct": 1, "gate": true, "difficulty": "advanced"}
- The observed statistic sits far in the tail of what the model invents: only 3% of replicated datasets are as extreme, so the model struggles to reproduce that feature. ::ok Correct: a PPC p-value is the share of replicated datasets whose statistic is at least as extreme as the real one. Values near 0 (or near 1) are both alarms; only the comfortable middle is a pass.
- There is a 3% probability the model is correct. ::no A PPC p-value is not the probability the model is true. It measures how well the model can reproduce one chosen feature of the data.
- The result is significant at the 0.05 level, so the model is rejected. ::no PPC p-values carry no 0.05 ritual: the data was used to fit and to judge, so the check is lenient and read as a diagnostic, not a hypothesis test.
- A p-value near 0 is ideal, since it means the model fits tightly. ::no Near 0 is an alarm, not a triumph: the real feature lands in a tail the model rarely produces. The healthy reading is mid-range.

=== step === quiz
::eyebrow Question 9 of 10
## Reading the scoreboard
Two models score elpd -102.4 and -107.3 by LOO, a difference of 4.9 with standard error 1.6. A colleague says: "minus 102 is a terrible score, both are junk." What is the sharpest correction?
::quiz {"correct": 3, "gate": true, "difficulty": "advanced"}
- He is right: a good model should score near zero. ::no A total log score is a sum of many logs of probabilities, each negative. Its absolute level is meaningless on its own; only differences between models on the same data carry information.
- The difference of 4.9 is too small to matter, since per day it is under 0.1. ::no The log ruler adds: a small per-day edge over 60 days stacks to 4.9, nearly three standard errors, a decisive gap in plausibility.
- Absolute elpd levels mean nothing; only the difference between rivals on the same data does, and 4.9 at standard error 1.6 (about three standard errors) is a decisive win for the better model. ::ok Correct: levels are uninterpretable alone, differences with their standard error are the whole point, and a gap of roughly three standard errors clearly separates the two models.
- The standard error of 1.6 shows the comparison is unreliable. ::no A standard error of 1.6 against a gap of 4.9 is what makes the win convincing (about three standard errors), not what undermines it.

=== step === quiz
::eyebrow Question 10 of 10
## A slope through a log link
A Bayesian Poisson GLM with a log link lands a slope of b = 0.08 for visitors, 90% credible interval clear of zero, and a strong WAIC win over a flat model. A colleague concludes: "each visitor adds 0.08 kits, and moving the stall to get more visitors will lift sales by that rate." What is the sharpest correction?
::quiz {"correct": 3, "gate": true, "difficulty": "advanced"}
- He is right on both the effect size and the plan; the numbers are decisive. ::no Both readings are wrong: the slope is multiplicative through the log link, not additive, and predictive strength does not license an intervention claim.
- The slope reading is fine, but the interval is too wide to act on. ::no The interval is tight and clear of zero; the flaw is not width. The slope reading itself is wrong (multiplicative, not additive), and the causal leap is separate.
- Through a log link the slope is multiplicative (each visitor multiplies expected demand by exp(0.08), about 1.08), and the model measures association across days, so relocating the stall is a causal claim the data alone cannot settle. ::ok Correct on both counts: effects through a log link scale rather than add, and a predictive win establishes that busy days sell more, not that traffic obtained by moving the stall would behave the same way.
- WAIC proves the causal effect of visitors on sales. ::no WAIC ranks predictive accuracy on observed days. It licenses using traffic to predict sales, never the intervention reading that changing traffic delivers the same lift.

=== step === concept
::eyebrow Run it: the conjugate update
## Prior times likelihood, in closed form
A Beta prior meets binomial data and the posterior is another Beta: no sampling required. Take a weak prior of about 10 percent (Beta(2, 18)), observe 9 sign-ups in 50 visitors, and read the posterior mean, a 90% credible interval, and the probability the true rate beats 15 percent.

```r
a_post <- 2 + 9              # prior successes + observed sign-ups
b_post <- 18 + (50 - 9)      # prior failures + observed non-sign-ups
round(c(post_mean = a_post / (a_post + b_post),
        lo90 = qbeta(0.05, a_post, b_post),
        hi90 = qbeta(0.95, a_post, b_post)), 3)
#> post_mean      lo90      hi90 
#>     0.157     0.092     0.233 

round(pbeta(0.15, a_post, b_post, lower.tail = FALSE), 3)   # P(rate > 0.15)
#> [1] 0.536
```

The posterior is Beta(11, 59): mean 0.157, with a 90% credible interval of 0.092 to 0.233. And there is a 54% posterior probability the true sign-up rate clears 15 percent, a direct probability statement conjugacy hands you in two lines.

=== step === concept
::eyebrow Run it: the sampler agrees
## Metropolis recovers the same posterior
When conjugacy runs out you sample, and a correct sampler must reproduce the closed-form answer when one exists. Run the Metropolis sampler on the exact same prior and data, and set its draws beside the Beta(11, 59) truth from the previous step.

```r
set.seed(3)
loglik <- function(p) {
  if (p <= 0 || p >= 1) return(-Inf)
  dbeta(p, 2, 18, log = TRUE) + dbinom(9, 50, p, log = TRUE)
}
chain <- numeric(20000); chain[1] <- 0.2; acc <- 0
for (i in 2:20000) {
  cand <- rnorm(1, chain[i - 1], 0.12)                       # propose a nudge
  if (log(runif(1)) < loglik(cand) - loglik(chain[i - 1])) { # accept or stay
    chain[i] <- cand; acc <- acc + 1
  } else chain[i] <- chain[i - 1]
}
keep <- chain[-(1:2000)]                                     # drop warm-up
round(c(accept = acc / 19999, mcmc_mean = mean(keep), exact_mean = 11 / 70), 3)
#>     accept  mcmc_mean exact_mean 
#>      0.393      0.157      0.157 

round(quantile(keep, c(0.05, 0.95)), 3)                      # 90% interval from draws
#>    5%   95% 
#> 0.090 0.233
```

Acceptance 0.393 sits in the healthy 0.2-to-0.5 band, and the sampler's mean (0.157) matches the exact posterior mean to the third decimal, with a 90% interval of 0.090 to 0.233 against the conjugate 0.092 to 0.233. The histogram of draws IS the posterior: when a closed form exists the sampler reproduces it, and when one does not, this same loop is all you need.

=== step === complete
## Section complete
Strong work. You can now run the whole Bayesian workflow: update a prior into a posterior and read it off, exploit conjugacy when it applies and sample with Metropolis when it does not, judge a sampler with R-hat, effective sample size and divergences, pool small groups toward a learned prior with shrinkage, cure the funnel with a non-centered parameterization, check a fitted model by making it invent its own data, rank rivals honestly with LOO and WAIC, and fit a Bayesian GLM whose slopes, intervals, and caveats a real decision can lean on. Every number you report from here, you know exactly what it earned the right to say.
