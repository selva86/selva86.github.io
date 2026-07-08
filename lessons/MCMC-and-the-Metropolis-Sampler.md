---
title: "Bayesian Modeling Lesson 3: MCMC and the Metropolis Sampler"
description: "Learn MCMC from scratch: why real posteriors have no formula, how samples replace the curve, and how to build and tune the Metropolis sampler in base R."
keywords: "mcmc, markov chain monte carlo, metropolis algorithm, metropolis sampler in R, posterior sampling, acceptance rate, trace plot, burn in, proposal width, monte carlo error, bayesian inference in R"
mathjax: true
webr: true
curriculum_id: "6.160.3"
post_type: "LESSON"
course_id: "ds-bayesian"
course_title: "Bayesian Modeling"
course_lesson: "3"
course_total: "8"
course_landing: "R-Bayesian-Modeling-Course.html"
course_next: "HMC-NUTS-and-MCMC-Diagnostics.html"
course_prev: "Conjugacy-and-Choosing-Priors.html"
lesson_access: "pro"
catalog_blurb: "How to estimate any posterior by sampling when no formula exists."
---

=== step === cover
::eyebrow Lesson 3 of 8
## MCMC and the Metropolis Sampler

Lesson 2 ended on a confession: conjugate updating is beautiful, and most real models do not qualify. One predictor, one unknown spread, one hierarchy, and there is no family to add your way into and no formula for the posterior at all. This lesson builds the escape route: an algorithm from 1953 that draws samples from a posterior it can never write down, and that still powers every serious Bayesian tool today. You will build it yourself, in fifteen lines of base R.

By the end of this lesson you will be able to:

- Say precisely which part of Bayes' theorem becomes impossible in real models, and why drawing samples gets around it
- Turn a bag of posterior draws into every deliverable Lesson 2 produced: a mean, a credible interval, any probability
- Build the Metropolis sampler from scratch and validate it against an answer you know exactly
- Read a trace plot, discard burn-in, and tune the proposal width by watching the acceptance rate
- Point the same fifteen lines at a model with no closed form, by changing one function

**Prerequisites:** Lessons 1 and 2 of this course (prior, likelihood, posterior, Asha's Beta(16, 104) conversion posterior, the Normal-Normal update for her average order value), plus base R functions and for loops.

Below is where we are headed: a random walk exploring a posterior it cannot see, leaving behind a histogram of everywhere it stood. Toggle the step size and watch the walk crawl, roam or stall. By the end of this lesson you will have built this machine from nothing.

::widget mcmc-walk {}

=== step === concept
::eyebrow The wall
## Where the formulas run out

The day after the redesign launch, Asha's checkout page takes 10 orders. Nine are ordinary baskets, between $39 and $71. One is a $237 corporate bulk buy, a gift shipment for someone's whole office. Her order-value model from Lesson 2 assumed every order is a draw from one normal curve with an $18 spread. On that assumption a $237 order is a ten-standard-deviations miracle, so the model will wrench its estimate of the average toward it. What Asha wants instead is a likelihood that treats big orders as rare but unremarkable: a bell curve with heavier tails. Statisticians keep exactly that curve on the shelf. It is called the Student t.

And right there, the machinery of Lessons 1 and 2 dies. Write the update anyway, for \(\mu\), the true long-run average order value:

\[ p(\mu \mid \text{data}) \;=\; \frac{p(\text{data} \mid \mu)\; p(\mu)}{\displaystyle\int p(\text{data} \mid \mu')\, p(\mu')\, d\mu'} \]

The numerator is the old friend: likelihood times prior, a number you can compute at any single candidate \(\mu\) in a microsecond. The denominator is that same numerator ADDED UP across every value the average could possibly be (\(\mu'\) just means "each candidate in turn", and the integral sign means "sum over all of them"). For a matched prior-likelihood pair, algebra does that infinite sum for you: that was conjugacy. A normal prior with a t likelihood is not a matched pair. Nobody has a formula for its total. Not "the formula is hard": it does not exist in closed form.

Could the grid from Lesson 1 save us? For one unknown, honestly, yes. But real models stack unknowns, and a grid grows exponentially:

| Unknowns in the model | Points a 1,001-per-axis grid must evaluate |
|---|---|
| 1 (this lesson) | 1,001 |
| 2 (a mean and a spread) | just over 1 million |
| 4 (a small regression) | about a trillion |
| 10 (a modest hierarchy) | a 1 followed by 30 zeros |

[KEY INSIGHT]
Look at the asymmetry the wall leaves standing. The numerator, prior times likelihood at any ONE point, never stops being cheap. Only the total over all points is out of reach. Everything in the rest of this course is a way of exploiting that asymmetry.

=== step === concept
::eyebrow The workaround
## Samples are as good as the curve

Before attacking the hard problem, be precise about what the posterior curve was ever FOR. Asha never stared at the curve itself. In Lesson 2 she reported three things: a best estimate, a 95 percent credible interval, and the probability her redesign beats the old rate. Here is the claim this whole lesson stands on: a large bag of DRAWS from the posterior delivers all of those, without the curve.

Test that claim on known ground. Her conversion posterior from Lesson 2 is exactly Beta(16, 104): mean 0.133, interval (0.079, 0.199). R can already draw from any named Beta with `rbeta()`, so pretend for a moment we only had draws. Each lesson runs in a fresh interactive R session, so run this first:

```r
set.seed(42)
draws <- rbeta(50000, 16, 104)   # 50,000 draws from the Beta(16, 104) posterior

round(c(post_mean = mean(draws),
        lo95 = as.numeric(quantile(draws, 0.025)),
        hi95 = as.numeric(quantile(draws, 0.975)),
        p_beats_10pct = mean(draws > 0.10)), 3)
#>     post_mean          lo95          hi95 p_beats_10pct 
#>         0.133         0.079         0.200         0.863 

round(c(post_mean = 16 / 120,
        lo95 = qbeta(0.025, 16, 104), hi95 = qbeta(0.975, 16, 104),
        p_beats_10pct = pbeta(0.10, 16, 104, lower.tail = FALSE)), 3)
#>     post_mean          lo95          hi95 p_beats_10pct 
#>         0.133         0.079         0.199         0.863 
```

Read the two rows against each other. Every deliverable became one line of arithmetic on the draws: the mean of the draws is the posterior mean, the middle 95 percent of the draws is the credible interval, and the share of draws above 0.10 is the probability the redesign beats the old rate. No `qbeta`, no calculus, no curve. Answering questions with random draws like this is called the **Monte Carlo** method, named after the casino. And the draws do not just match the summaries, they carry the entire shape:

```r
hist(draws, breaks = 60, freq = FALSE, col = "grey85", border = "white",
     xlim = c(0, 0.4), xlab = "conversion rate (theta)", ylab = "plausibility",
     main = "50,000 draws rebuild the whole curve")
curve(dbeta(x, 16, 104), add = TRUE, lwd = 3, col = "navy")
```

[WARNING]
Draws are computation, not data. The upper interval endpoint came out 0.200 against the exact 0.199: that third-decimal wobble is **Monte Carlo error**, and drawing more samples shrinks it. It shrinks the WOBBLE only. The posterior itself, and its width, are fixed by the prior and the 40 visitors; no amount of simulation adds evidence.

So the entire problem of Bayesian computation reduces to one question: how do you draw from a posterior that has no name and no `rbeta()`, when all you hold is the numerator? That question found its answer in a 1953 Los Alamos paper, and the answer is the rest of this lesson.

=== step === quiz
::eyebrow Check yourself
## 50,000 draws from 40 visitors?

Asha's teammate looks at the summary table and objects: "The morning only had 40 visitors. You cannot conjure 50,000 observations out of 40. An interval built on 50,000 of anything must be far too narrow." What is right?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The teammate is right: more draws mean more evidence, so the credible interval narrows as you draw more ::no More draws are more READS of the same fixed posterior, not more observations; the interval reflects the 40 visitors and cannot shrink below what they support.
- The draws are computation, not evidence: they describe the same 40-visitor posterior, and drawing more only reduces the Monte Carlo wobble in reading it ::ok Exactly. The posterior is fixed by the prior and the 40 visitors. Drawing from it is like reading the curve off at random points: more reads give a sharper copy of the same curve, never a tighter curve.
- The teammate is wrong because 50,000 draws contain 50,000 independent pieces of information about the conversion rate ::no All the information came from the prior and the 40 visitors, and simulation cannot add to it. The draws only make that fixed information easy to summarize.

=== step === concept
::eyebrow The algorithm
## The Metropolis rule: a walk guided by ratios

Picture Asha's posterior as a hill: the horizontal axis is the candidate value, the height is plausibility. Now put a walker on that hill in thick fog. The fog is exactly our predicament: standing anywhere, the walker can measure the height under their feet and at one spot nearby (the numerator, cheap at any single point) but can never survey the whole landscape (the impossible total). The goal is a walking rule that makes the time spent at each spot proportional to its height. Achieve that, and the walker's diary of positions IS a bag of posterior draws.

The Metropolis rule is that walking rule. From the chain's current value \(\theta_t\) (the value after \(t\) steps):

1. **Propose.** Draw a candidate a small random step away: \(\theta^{\ast} \sim \text{Normal}(\theta_t, s)\), where \(s\) is the **proposal width**, the one knob you control.
2. **Compare.** Compute the ratio of posterior heights,

\[ r \;=\; \frac{p(\theta^{\ast} \mid \text{data})}{p(\theta_t \mid \text{data})} \;=\; \frac{p(\text{data} \mid \theta^{\ast})\; p(\theta^{\ast})}{p(\text{data} \mid \theta_t)\; p(\theta_t)}. \] The impossible total \(p(\text{data})\) sits under both heights, so it cancels. The ratio needs only the numerator.

3. **Accept or stay.** Uphill (\(r \ge 1\)): always move. Downhill: move anyway with probability \(r\), otherwise stay put and record the current value again.
4. **Repeat**, thousands of times, recording where you stand after each step.

Why does time end up proportional to height? Feel the mechanism: climbing is always free, but every descent is throttled in exact proportion to the drop, so the walk lingers on high ground and only briefly visits the flats, in precisely the ratio of their heights. The formal property is called detailed balance and its proof is three lines in the references. This lesson will do something more convincing instead: run the rule on a posterior we know exactly, and check the answer.

Two practical notes before the code. First, "move with probability \(r\)" is implemented by drawing \(u\) uniformly between 0 and 1 and moving when \(u < r\); taking logs of both sides gives the numerically safe version, move when \(\log u < \ell(\theta^{\ast}) - \ell(\theta_t)\), where \(\ell\) is the log of prior times likelihood (multiplying forty tiny densities underflows a computer; adding forty logs never does). Second, the names: a walk whose next move depends only on where it stands now is a **Markov chain**, and answering with draws is Monte Carlo, so this family of algorithms is **Markov chain Monte Carlo**, MCMC. The Metropolis rule of 1953 is its founding member.

[NOTE]
Allow the proposal step to be lopsided and correct for it in the ratio, and you get the Metropolis-Hastings algorithm of 1970. Every modern engine, including the ones inside Stan that you will meet in Lesson 4, is a descendant of the rule above.

::widget process-flow {"steps":[{"title":"Propose","sub":"draw a candidate a small random step from where you stand"},{"title":"Compare","sub":"r = posterior height at the candidate over height here"},{"title":"Accept or stay","sub":"uphill: always move. downhill: move with probability r"},{"title":"Record, repeat","sub":"the visited values become your posterior draws"}]}

=== step === concept
::eyebrow Build it
## Fifteen lines of base R

Build it first on known ground, Asha's conversion rate, where Lesson 2 gives us the exact answer to check against. Two ingredients. Ingredient one is \(\ell(\theta)\), the log-numerator: her Beta(8, 72) prior plus the 8-buys-in-40-visits binomial likelihood, both on the log scale. Outside the unit interval a rate has zero plausibility, so we return `-Inf`, log of zero, which the rule reads as "never step there". Ingredient two is the walk itself. Fifteen lines, as Lesson 2 promised:

```r
# log( prior x likelihood ), the only thing Metropolis ever needs
logpost <- function(th) {
  if (th <= 0 || th >= 1) return(-Inf)   # a conversion rate lives inside (0, 1)
  dbeta(th, 8, 72, log = TRUE) + dbinom(8, size = 40, prob = th, log = TRUE)
}

# the Metropolis sampler, in full
metropolis <- function(logpost, start, prop_sd, n) {
  chain <- numeric(n)
  chain[1] <- start
  accepted <- 0
  for (i in 2:n) {
    cand <- rnorm(1, mean = chain[i - 1], sd = prop_sd)      # 1. propose
    if (log(runif(1)) < logpost(cand) - logpost(chain[i - 1])) {
      chain[i] <- cand                                       # 2. accept, or
      accepted <- accepted + 1
    } else {
      chain[i] <- chain[i - 1]                               # 3. stay put
    }
  }
  list(chain = chain, accept = accepted / (n - 1))
}

set.seed(7)
fit <- metropolis(logpost, start = 0.50, prop_sd = 0.07, n = 20000)
round(fit$accept, 2)
#> [1] 0.45
```

Notice the sampler takes `logpost` as an argument: the model lives entirely inside that one function, a fact that pays off at the end of this lesson. We deliberately started the walk at 0.50, miles from the truth (the posterior lives near 0.13). Watch what it does about that:

```r
plot(fit$chain[1:2000], type = "l", col = "navy",
     xlab = "iteration", ylab = "conversion rate (theta)",
     main = "The first 2,000 steps of the walk")
abline(h = 0.133, lty = 2)

keep <- fit$chain[-(1:1000)]     # discard the first 1,000 steps as warm-up

round(c(mcmc_mean = mean(keep),
        mcmc_lo95 = as.numeric(quantile(keep, 0.025)),
        mcmc_hi95 = as.numeric(quantile(keep, 0.975))), 3)
#> mcmc_mean mcmc_lo95 mcmc_hi95 
#>     0.133     0.079     0.200 
```

Read the trace like a story. The chain plunges from 0.50 into the plausible zone in about a dozen steps, then spends the other 19,988 wandering around the dashed line at 0.133, exactly the loitering-in-proportion-to-height behavior the rule was designed for. That opening plunge is called **burn-in** (or warm-up): the early stretch where the chain still remembers where YOU started it rather than where the posterior lives. It is not evidence about anything, so we discard it; dropping 1,000 steps when a dozen would do costs nothing and is the standard generous habit.

Now the verdict. Lesson 2's exact answer: mean 0.133, interval (0.079, 0.199). The walk's answer: 0.133 and (0.079, 0.200). The same third-decimal Monte Carlo wobble you saw with `rbeta()`, from a sampler that never heard of the Beta family.

[KEY INSIGHT]
Nothing in that code computed, or could ever compute, the normalizing total \(p(\text{data})\). The ratio canceled it before it was needed. You just drew from a posterior using only the two things every model, however gnarly, always provides: a prior density and a likelihood.

=== step === tryit
::eyebrow In R
## Any question is a share of draws

The finance team will only raise the ad budget if the new page plausibly converts above 15 percent, and they want the probability. In Lesson 2 that was a `pbeta()` lookup, available only because the posterior had a name. Answer it from the walk instead. `keep` is your post-warm-up chain from the previous step, and a posterior probability is the share of draws where the event holds. Fill in the blank:

```r
# P(theta above 0.15), straight from the chain
p_15 <- ____
round(p_15, 2)
```
::check {"regex":"mean\\s*\\(\\s*keep\\s*>\\s*0?\\.15\\s*\\)","gate":true,"difficulty":"intermediate","ok":"0.28: about a one-in-four chance, probably not enough for the budget call yet. Every posterior question, however exotic, is now one line: the share of draws where the thing is true.","no":"A probability is the SHARE of posterior draws satisfying the event. Take the mean of the logical vector keep > 0.15."}
::solution
```r
p_15 <- mean(keep > 0.15)
round(p_15, 2)
#> [1] 0.28

# the exact answer, available here only because this posterior has a name:
round(pbeta(0.15, 16, 104, lower.tail = FALSE), 2)
#> [1] 0.28
```

=== step === widget
::eyebrow The one knob
## Tuning the walk: proposal width

Your sampler has exactly one setting: `prop_sd`, how far a typical proposed step reaches. It looks like a harmless detail. It decides everything about whether the walk works.

The widget below is the same algorithm you just built, pointed at a different one-unknown posterior (an average estimated from 20 measurements, a cousin of Asha's order-value model). Try all three settings and watch the trace on top and the histogram the walk leaves behind underneath:

What to look for at each setting:

- **Too small.** Nearly every proposal is a tiny move to almost-equal height, so almost everything is accepted. But the chain crawls: hundreds of steps in, it still has not crossed the hill once, and its histogram is a lopsided fragment of the true curve. High acceptance bought by no movement.
- **Too large.** Most proposals leap clean off the hill into near-zero plausibility, the ratio \(r\) is minuscule, and the walk freezes in place for long runs, rewriting the same value. The trace shows flat shelves; the histogram grows in lumps.
- **In between.** The trace roams the whole hill freely and forgets its past quickly. Samplers that do this are said to **mix well**, and the histogram hugs the true posterior.

The acceptance rate is your gauge for this, a diagnostic, not a score to maximize. For a one-unknown model, tune `prop_sd` until acceptance sits roughly between 30 and 50 percent (theory puts the ideal near 44 percent for one dimension, drifting toward about a quarter for many-unknown models). Our conversion run's 0.45 was not luck; it was tuned to land there.

::widget mcmc-walk {}

=== step === quiz
::eyebrow Check yourself
## Which run would you keep?

You rerun Asha's conversion sampler with three proposal widths: `prop_sd = 0.005` returns acceptance 95 percent, `prop_sd = 0.07` returns 45 percent, and `prop_sd = 1` returns 4 percent. A colleague says: "Keep the first run. Acceptance is the sampler's success rate, and 95 percent is the most successful." What is right?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The colleague is right: the more proposals a sampler accepts, the more efficiently it explores the posterior ::no High acceptance here means the steps are so tiny the chain barely moves; its draws are near-copies, so it explores LESS, not more.
- The middle run: 95 percent means steps so small the chain crawls and its draws are nearly copies of each other, 4 percent means it is frozen rewriting one value, and near-half acceptance is the healthy middle ::ok Right. Both extremes fail the same goal, covering the whole posterior in a limited number of steps: one by moving too little per step, the other by moving too rarely. You tune the width and read acceptance as the gauge.
- The third run: rejections mean the sampler is boldly proposing far-away regions, which yields the most independent draws ::no Those bold proposals are being REJECTED, so the chain spends its time frozen in place, producing long flat runs of one repeated value: the least independent draws of the three.

=== step === tryit
::eyebrow The payoff
## One new function, any model

Back to the wall this lesson opened with: the afternoon's 10 orders, one of them a $237 corporate bulk buy. The only change from Lesson 2 is the likelihood: each order is now a draw from a Student t with 3 degrees of freedom, whose heavy tails read a $237 basket as rare rather than a ten-standard-deviations miracle, still centered on the unknown average with the same $18 spread (the `- log(18)` in the solution just rescales the t density to that $18 spread). Her prior for the average is untouched. First the raw numbers (each lesson is a fresh session page, but this step continues from your sampler above, so make sure you ran that block):

```r
# the afternoon's orders: nine ordinary baskets and one corporate bulk buy
y <- c(52, 61, 39, 58, 44, 71, 48, 66, 55, 237)
mean(y)
#> [1] 73.1

round(mean(y[y < 200]), 1)   # what the ordinary nine average
#> [1] 54.9
```
::check {"regex":"dnorm\\s*\\(\\s*mu\\s*,\\s*(mean\\s*=\\s*)?54\\.6\\s*,\\s*(sd\\s*=\\s*)?3\\.4\\s*,\\s*log\\s*=\\s*TRUE\\s*\\)","gate":true,"difficulty":"advanced","ok":"That one line was the entire model change. No conjugate pair exists for this prior-likelihood combination, and the sampler will not care.","no":"The prior is where Lesson 2 left her belief about the average order: a normal curve with mean 54.6 and sd 3.4, on the log scale: dnorm(mu, 54.6, 3.4, log = TRUE)."}
::solution
```r
lp <- function(mu) {
  sum(dt((y - mu) / 18, df = 3, log = TRUE) - log(18)) +
  dnorm(mu, mean = 54.6, sd = 3.4, log = TRUE)
}
lp(55) > lp(90)
#> [1] TRUE
```

=== step === concept
::eyebrow Go deeper
## References

Four authoritative places to take this further:

- [Metropolis, Rosenbluth, Rosenbluth, Teller and Teller (1953), Equation of State Calculations by Fast Computing Machines](https://doi.org/10.1063/1.1699114) - the Los Alamos paper where the algorithm you just built first appeared.
- [Statistical Rethinking (McElreath), chapter 9](https://xcelab.net/rm/) - the island-hopping king Markov story, the friendliest alternative telling of the Metropolis rule and its road to HMC.
- [Bayes Rules! (Johnson, Ott and Dogucu), chapters 6 and 7, free online](https://www.bayesrulesbook.com/) - grid to MCMC on the same Beta-Binomial machinery this course uses, with the tuning trade-off worked in detail.
- [Bayesian Data Analysis, 3rd edition (Gelman, Carlin, Stern, Dunson, Vehtari and Rubin), chapters 10 and 11, free PDF](https://sites.stat.columbia.edu/gelman/book/) - the formal treatment: detailed balance, convergence, and the acceptance-rate theory behind the targets quoted here.

=== step === complete
## Lesson 3 complete

You found the wall precisely: the numerator of Bayes' theorem never stops being cheap, only the normalizing total is impossible, and grids die exponentially with dimensions. You replaced the curve with draws and priced the swap (Monte Carlo wobble in the third decimal, never new evidence). Then you built the 1953 Metropolis rule in fifteen lines of base R, watched it plunge from a bad start, discarded burn-in, validated it against the exact Beta(16, 104) answer, tuned its one knob by acceptance rate, and finally pointed it at a model with no closed form: the heavy-tailed order-value posterior, where swapping a single function keeps the estimate anchored near the ordinary orders' $54.9 average instead of letting the lone $237 basket drag it up toward the raw $73.1 mean.

One thing you cannot yet do is tell when a chain is lying. A trace can look settled while exploring only half the posterior, and 20,000 steps of a crawling walk can be worth 50 honest draws. Next, Lesson 4: HMC, NUTS and MCMC Diagnostics, the physics-flavored engines inside modern tools like Stan, and the dashboard that tells you when to trust a chain: trace plots, R-hat, and effective sample size.
