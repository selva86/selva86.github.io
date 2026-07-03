---
title: "Bayesian Modeling Lesson 1: The Bayesian Update"
catalog_blurb: "How prior knowledge and new data combine into one honest updated estimate."
description: "Learn the Bayesian update from scratch: prior times likelihood gives the posterior. Build it in base R on a real conversion rate and read all three curves."
keywords: "bayes theorem, bayesian update, prior likelihood posterior, posterior distribution, grid approximation, credible interval, beta binomial, bayesian inference in R, conversion rate"
post_type: "LESSON"
curriculum_id: "6.160.1"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-bayesian"
course_title: "Bayesian Modeling"
course_lesson: "1"
course_total: "8"
course_landing: "R-Bayesian-Modeling-Course.html"
course_next: "Conjugacy-and-Choosing-Priors.html"
course_prev: ""
---

=== step === cover
::eyebrow Lesson 1 of 8
## The Bayesian Update

Every model you have fit so far answers with a single best number and a standard error. Bayesian modeling answers differently: every value the unknown could take gets a weight, and one fixed rule reshuffles those weights whenever new data arrives. This course builds that machinery from the ground up, and this lesson builds the rule itself.

Here is the situation the whole lesson lives in. Asha runs an online plant store. Her past checkout pages have converted about 10 percent of visitors into buyers. This morning she launched a redesigned page: 40 visitors so far, 8 purchases. That is 20 percent, double her history, on a sample small enough to be a fluke. What should she believe now?

By the end of this lesson you will be able to:

- Name the three pieces of every Bayesian update (the prior, the likelihood and the posterior) and say in words what each one measures
- Compute a posterior for a conversion rate in base R, no special packages needed
- Read a prior-likelihood-posterior chart and predict how it moves as data grows
- Report a posterior honestly: a point estimate, a 95 percent credible interval, and a direct probability statement

**Prerequisites:** you can work in R (vectors, plots), you know probability as a long-run fraction, and you have met the binomial setting: a count of successes in n independent tries.

The picture below is the whole lesson in one frame: a belief curve meets evidence and moves. Drag the sliders to see it happen, then we will build every piece by hand.

::widget bayes-update {}

=== step === concept
::eyebrow Belief, drawn
## The prior: what you believed before the data

Start with the unknown itself. Call the true conversion rate of the new page \(\theta\) (the Greek letter theta): out of every 100 visitors who reach the page in the long run, \(\theta \times 100\) of them buy. It is one fixed number, and nobody knows it, not even Asha.

The Bayesian move is to describe that uncertainty with a curve. Lay out every value \(\theta\) could take, from 0 to 1, and give each one a height: high where the value is plausible, low where it is not. That curve, written \(p(\theta)\), is called the **prior**, because it captures what you believed *prior to* seeing the new data.

Asha is not starting from ignorance. Her records show a dozen past page designs converting between roughly 5 and 17 percent, typically near 10. So her prior should pile its weight around 0.10 and fade out by 0.20. R has a ready-made family of curves for values between 0 and 1, drawn by `dbeta()`. Its two shape numbers position the peak and set the width; the pair 8 and 72 puts the peak near 8 / (8 + 72) = 0.10 with the spread her records suggest. (Why this exact family is the natural choice is the subject of Lesson 2. For now it is simply a curve that matches her experience.)

Each lesson runs in a fresh interactive R session, so we build everything right here. Run this first:

```r
# theta: every candidate value the conversion rate could take
theta <- seq(0, 1, length.out = 1001)

# Asha's belief before this morning, as a curve over theta
prior <- dbeta(theta, 8, 72)

plot(theta, prior, type = "l", lwd = 2, col = "grey35", xlim = c(0, 0.4),
     xlab = "conversion rate (theta)", ylab = "plausibility",
     main = "What Asha believed before this morning")
abline(v = 0.10, lty = 2)

# where the middle 95 percent of this belief sits
round(qbeta(c(0.025, 0.975), 8, 72), 3)
#> [1] 0.045 0.174
```

Read the curve like a mountain of belief: the summit near 0.10 is the rate Asha finds most plausible, and 95 percent of her belief sits between 0.045 and 0.174. A rate of 0.30 is not impossible under this prior, just nearly weightless.

=== step === concept
::eyebrow Evidence, scored
## The likelihood: how well each rate explains the data

Now the morning's data: 8 purchases out of 40 visitors. The second ingredient asks a precise question of every candidate rate. *If* the true rate were \(\theta\), how probable would this exact result be?

You already know the tool that answers it. If each of 40 visitors buys independently with probability \(\theta\), the number of buyers follows a binomial distribution, so

\[ P(8 \text{ of } 40 \mid \theta) \;=\; \binom{40}{8}\, \theta^{8} \,(1-\theta)^{32}. \]

Read every piece: the vertical bar means "given", so the left side is the probability of the morning's result given a candidate rate. \(\binom{40}{8}\) counts the ways to choose which 8 of the 40 visitors were the buyers, \(\theta^{8}\) covers the 8 who bought (each with probability \(\theta\)), and \((1-\theta)^{32}\) covers the 32 who did not.

Held at fixed data and viewed as a function of \(\theta\), this is called the **likelihood**. Score a few candidates and the plot makes the idea concrete:

```r
# for each candidate rate: how probable is exactly 8 of 40?
lik <- dbinom(8, size = 40, prob = theta)

setNames(round(dbinom(8, 40, c(0.05, 0.10, 0.20, 0.30)), 4),
         c("5%", "10%", "20%", "30%"))
#>     5%    10%    20%    30%
#> 0.0006 0.0264 0.1560 0.0557

plot(theta, lik, type = "l", lwd = 2, col = "firebrick", xlim = c(0, 0.4),
     xlab = "conversion rate (theta)", ylab = "P(8 of 40 | theta)",
     main = "How well each rate explains the morning")
abline(v = 0.20, lty = 2)
```

A true rate of 5 percent would produce this morning about 6 times in 10,000; a rate of 20 percent produces it about 156 times in 1,000. The curve peaks exactly at 8/40 = 0.20, the rate that explains the data best.

[WARNING]
The likelihood is evidence about \(\theta\), not belief about \(\theta\). It is not a probability distribution over \(\theta\): its area is not 1, and its height at 0.20 is not the probability that \(\theta\) equals 0.20. It answers only one question, how well each candidate rate explains what happened.

=== step === quiz
::eyebrow Check yourself
## What does the likelihood peak mean?

The likelihood curve for Asha's morning peaks at \(\theta = 0.20\). Taken on its own, what does that tell you?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- It proves that 20 percent of all future visitors will buy ::no One morning of 40 visitors is a noisy draw. The likelihood ranks candidate rates by how well they explain that draw; it does not pin the true rate to the sample value.
- Among all candidate rates, 0.20 gives the observed 8-of-40 the highest probability. It says nothing yet about how plausible each rate was to begin with ::ok Exactly. The likelihood scores explanations: rate by rate, how probable would this morning be. Belief about the rate needs the other half, the prior, and combining the two is the next step.
- The probability that theta equals 0.20 is highest, so Asha should just report 20 percent ::no The likelihood is not a probability distribution over theta. Its area is not 1, so its height is not P(theta). It reads: IF the rate were 0.20, THEN this morning would be this probable. Turning that into belief about theta requires the prior, which is exactly what the update does next.

=== step === concept
::eyebrow The rule
## Bayes' theorem: multiply, then rescale

You now hold two curves over the same axis. The prior says what was plausible before the morning. The likelihood says how well each rate explains the morning. Bayes' theorem is the one legitimate way to merge them, and you have seen its skeleton before with events: \(P(A \mid B) = P(B \mid A)\,P(A) / P(B)\). Swap the events for our objects, a parameter and data, and it reads

\[ p(\theta \mid \text{data}) \;=\; \frac{p(\text{data} \mid \theta)\; p(\theta)}{p(\text{data})}. \]

Name every piece once, in words:

- \(p(\theta)\) is the **prior**: plausibility of each rate before the data (our grey curve).
- \(p(\text{data} \mid \theta)\) is the **likelihood**: how well each rate explains the data (our red curve).
- \(p(\theta \mid \text{data})\) is the **posterior**: plausibility of each rate *after* the data. This is the answer.
- \(p(\text{data})\) is a single number, not a curve: the overall probability of the morning averaged across all rates. Its only job is to rescale the result so the total plausibility is 1.

Because the denominator is the same for every \(\theta\), it cannot change which rates are favored. The entire shape of the answer comes from the numerator, which gives the working form used everywhere in practice:

\[ \text{posterior} \;\propto\; \text{likelihood} \times \text{prior}, \]

where \(\propto\) means "proportional to": equal up to that one rescaling constant.

[KEY INSIGHT]
The Bayesian update is multiply, then rescale. At each candidate rate, multiply what you believed by how well that rate explains the data. Where both are substantial the posterior is high. Where either is near zero, the product dies: no belief without plausibility, no belief without evidence.

And on our grid of 1,001 candidate rates, "rescale" could not be simpler: divide by the sum, so the weights add to 1. You are about to do it.

=== step === tryit
::eyebrow In R
## Compute the update on a grid

Everything you need, rebuilt in one place so this step stands alone (run it):

```r
theta <- seq(0, 1, length.out = 1001)          # a fine grid of candidate rates
prior <- dbeta(theta, 8, 72)                   # belief before the morning
lik   <- dbinom(8, size = 40, prob = theta)    # evidence: 8 sales in 40 visits
```

Now apply the working form, posterior proportional to likelihood times prior. Fill in the blank:

```r
# Bayes theorem, working form: multiply, then rescale
unnorm    <- ____ * ____
posterior <- unnorm / sum(unnorm)   # rescale so the weights sum to 1

plot(theta, posterior, type = "l", lwd = 2, col = "navy", xlim = c(0, 0.4),
     xlab = "conversion rate (theta)", ylab = "share of plausibility",
     main = "What Asha should believe now")
```
::check {"regex":"(lik\\s*\\*\\s*prior|prior\\s*\\*\\s*lik)","gate":true,"difficulty":"intermediate","ok":"That is the whole engine: belief times evidence at every candidate rate, then one rescale. Everything else in Bayesian statistics is bookkeeping around this line.","no":"Multiply the two curves you built: the belief curve and the evidence curve. The blank is prior * lik (either order works, multiplication commutes)."}
::solution
```r
unnorm    <- prior * lik
posterior <- unnorm / sum(unnorm)
```

That plotted curve is the posterior: Asha's belief about the conversion rate, updated by 40 visitors. Notice it has moved off the prior toward the data, but has not jumped all the way to 0.20.

=== step === widget
::eyebrow Read it
## Reading the three curves

Put all three on one canvas. Each curve is rescaled to sum to 1 so they share a scale honestly:

```r
unnorm    <- prior * lik
posterior <- unnorm / sum(unnorm)

prior_w <- prior / sum(prior)     # the same three curves,
lik_w   <- lik / sum(lik)         # each rescaled to total 1

plot(theta, prior_w, type = "l", lwd = 2, col = "grey35", xlim = c(0, 0.4),
     ylim = range(prior_w, lik_w, posterior),
     xlab = "conversion rate (theta)", ylab = "share of plausibility",
     main = "Prior, likelihood, posterior")
lines(theta, lik_w, lwd = 2, col = "firebrick")
lines(theta, posterior, lwd = 3, col = "navy")
legend("topright", c("prior (peak near 0.10)", "likelihood (peak 0.20)", "posterior"),
       col = c("grey35", "firebrick", "navy"), lwd = c(2, 2, 3), bty = "n")

round(theta[which.max(posterior)], 3)   # where the updated belief peaks
#> [1] 0.127
```

The posterior peaks near 0.13, between the prior's 0.10 and the data's 0.20, and it is narrower than the prior. Both facts have the same explanation: the posterior is a compromise weighted by information. Here is the arithmetic behind it. A `dbeta(theta, 8, 72)` prior carries exactly as much information as having already watched 80 visitors and seen 8 buy. The morning adds 40 real visitors with 8 buyers. Pool them:

\[ \frac{8 + 8}{80 + 40} \;=\; \frac{16}{120} \;\approx\; 0.133, \]

which is precisely the posterior mean. The prior outweighs the data two to one (80 imaginary visitors against 40 real ones), so the update travels only a third of the distance from 0.10 toward 0.20. Collect another 200 visitors tomorrow and the real data will dominate.

Now feel that trade-off directly. The widget below runs the same update on a generic measurement (its belief curves are normal, living on an open scale instead of 0 to 1, but the geometry is identical). Set the prior mean and the data average apart, then drag the number of data points from 1 up to 200 and watch the posterior slide toward the evidence and tighten. Then drop n to 3 and widen or narrow the prior confidence: with little data, the prior is most of the answer.

::widget bayes-update {}

=== step === quiz
::eyebrow Check yourself
## Who wins the tug of war?

Suppose Asha instead leaves the new page up for a week and collects 4,000 visitors with 800 purchases (still 20 percent), then runs the same update with the same prior. Where does the posterior end up?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- Still about a third of the way to 0.20, because the prior always keeps its two-to-one weight ::no The weights are not fixed. The prior is worth a constant 80 imaginary visitors, but the data side grows with every real visitor: 4,000 against 80 leaves the prior with about 2 percent of the vote.
- Exactly at the average of 0.10 and 0.20, since the update always splits the difference ::no The update never just splits the difference. It weighs each side by how much information it carries, and 4,000 real visitors carry vastly more than a prior worth 80.
- Essentially at 0.20, with a much narrower curve: the data now carry 50 times the information of the prior ::ok Right: (8 + 800) / (80 + 4000) is about 0.198, and the curve tightens as evidence piles up. With enough data the prior barely matters, which is exactly how honest updating should behave.

=== step === concept
::eyebrow Report it
## Say it like an analyst: a mean, an interval, a probability

A whole curve is the honest answer, but Asha needs numbers for a decision. All of them read directly off the posterior:

```r
# one number: the balance point of the posterior
post_mean <- sum(theta * posterior)
round(post_mean, 3)
#> [1] 0.133

# a range: the middle 95 percent of the posterior weight
cdf <- cumsum(posterior)
ci  <- c(theta[which(cdf >= 0.025)[1]], theta[which(cdf >= 0.975)[1]])
round(ci, 3)
#> [1] 0.079 0.199

# a direct answer: how probable is it the new page beats the old 10 percent?
round(sum(posterior[theta > 0.10]), 3)
#> [1] 0.859
```

Three deliverables, each in plain language:

- **Posterior mean 0.133**: the single best estimate, already blending history with the morning.
- **95 percent credible interval (0.079, 0.199)**: given the model and the data, there is a 95 percent probability the true rate lies in this range. You can say that sentence with a straight face, because \(\theta\) has a distribution here.
- **P(new page beats 10 percent) = 0.859**: an 86 percent chance the redesign is an improvement. Real support, not proof. If shipping the page is cheap, that may be plenty; if it is costly, collect more visitors and update again.

[NOTE]
That first sentence is exactly the one a classical 95 percent confidence interval does not permit. A confidence interval makes a promise about the procedure: across many repetitions, 95 percent of intervals built this way trap the truth. The credible interval speaks about \(\theta\) itself, directly. The price of that directness is printed in its preamble: *given the model and the data*.

And that price is real, so read the fine print once. This posterior assumed independent visitors with one constant rate (no weekend effects, no traffic-source mix), and it assumed a prior worth 80 visitors of history. A different defensible prior would move these numbers somewhat at n = 40, and much less at n = 4,000. The prior is not cheating; it is an assumption stated in the open, where a critic can attack it. Choosing one well, and measuring how much it matters, is Lesson 2.

=== step === quiz
::eyebrow Check yourself
## What the interval actually says

Asha reports: "95 percent credible interval for the conversion rate: 0.079 to 0.199." Which reading is correct?

::quiz {"correct":1,"gate":true,"difficulty":"advanced"}
- Given the model and the morning's data, there is a 95 percent probability that the true conversion rate of the new page lies between 0.079 and 0.199 ::ok Right, and note the preamble doing the work: given the model and the data. The statement is direct because theta carries a distribution, and it is conditional because the posterior inherits every assumption the model and prior made.
- About 95 percent of Asha's visitors have a conversion rate inside this interval ::no Individual visitors do not each carry a conversion rate. The interval describes the one unknown page-level rate theta, not variation from visitor to visitor.
- If Asha repeated mornings like this many times and built an interval each time, about 95 percent of those intervals would contain the true rate ::no That is the guarantee a classical CONFIDENCE interval makes: a promise about the procedure across repetitions. The credible interval says something stronger and simpler about this one interval, a direct probability statement about theta, which is only possible because theta has a distribution.

=== step === concept
::eyebrow Go deeper
## References

Four authoritative places to take this further:

- [Bayes Rules! (Johnson, Ott and Dogucu), free online book](https://www.bayesrulesbook.com/) - the friendliest full course on exactly this path; chapters 1 to 3 are this lesson at book length, with the same Beta prior machinery.
- [Statistical Rethinking (McElreath)](https://xcelab.net/rm/) - the book that made grid approximation the standard way into Bayesian thinking; its chapter 2 globe-tossing example is the twin of Asha's page.
- [Bayesian Data Analysis, 3rd edition (Gelman, Carlin, Stern, Dunson, Vehtari, Rubin), free PDF](https://sites.stat.columbia.edu/gelman/book/) - the canonical graduate reference this whole course builds toward.
- [Think Bayes, 2nd edition (Downey), free online](https://allendowney.github.io/ThinkBayes2/) - the same update built as code-first tables and grids, an excellent second pass from a programming angle.

=== step === complete
## Lesson 1 complete

You built the entire engine of Bayesian inference on a 1,001-point grid: a prior worth 80 visitors of history, a binomial likelihood scoring every candidate rate against 8-of-40, and one line, multiply then rescale, that turned them into a posterior with mean 0.133, a 95 percent credible interval of (0.079, 0.199), and an 86 percent probability that the redesign beats the old rate. You also read the geometry: the posterior is an information-weighted compromise that slides toward the data and tightens as evidence grows.

One loose thread: we picked `dbeta(8, 72)` off the shelf, and our posterior turned out to be exactly the same kind of curve. That is no coincidence. Next, Lesson 2: Conjugacy and Choosing Priors, where the update becomes two additions you can do in your head, and where you learn to pick a prior you can defend, and to measure how much it mattered.
