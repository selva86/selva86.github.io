---
title: "Bayesian Modeling Lesson 2: Conjugacy and Choosing Priors"
catalog_blurb: "Update beliefs in closed form and choose a prior you can defend."
description: "Learn conjugate priors from scratch: the Beta-Binomial and Normal-Normal updates in closed form, priors priced in pseudo-data, and prior sensitivity in R."
keywords: "conjugate prior, beta binomial, normal normal model, choosing priors, weakly informative prior, flat prior, prior sensitivity analysis, bayesian updating in R, pseudo observations, credible interval"
post_type: "LESSON"
curriculum_id: "6.160.2"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-bayesian"
course_title: "Bayesian Modeling"
course_lesson: "2"
course_total: "8"
course_landing: "R-Bayesian-Modeling-Course.html"
course_next: "MCMC-and-the-Metropolis-Sampler.html"
course_prev: "The-Bayesian-Update.html"
---

=== step === cover
::eyebrow Lesson 2 of 8
## Conjugacy and Choosing Priors

In Lesson 1, Asha updated her belief about her redesigned checkout page the brute-force way: 1,001 candidate conversion rates on a grid, multiply prior by likelihood at every single one, rescale. It worked, and it ended on a loose thread. Her prior was `dbeta(theta, 8, 72)`, and the posterior came out as another curve of the exact same family. That is not luck. It is a property called **conjugacy**, and it collapses the whole grid ritual into two additions you can do in your head.

This lesson is about that shortcut, and about the responsibility it exposes: the prior is the one ingredient of a Bayesian answer that you choose. By the end you will be able to:

- Update a Beta prior with new counts in closed form, two additions, no grid
- Read any prior as pseudo-data and predict, before computing anything, how hard it will pull the answer
- Run the matching closed-form update for an average (the Normal-Normal pair) in base R
- Choose between flat, weakly informative and informative priors, and measure with a sensitivity analysis how much the choice mattered

**Prerequisites:** Lesson 1 of this course (prior, likelihood, posterior, the grid update, the 95 percent credible interval, and Asha's numbers: a Beta(8, 72) prior, then 8 purchases in 40 visits), plus base R vectors and plots.

The machine you drove in Lesson 1 sits below. Every posterior it draws, this lesson teaches you to compute with one line of arithmetic.

::widget bayes-update {}

=== step === concept
::eyebrow The shortcut
## Conjugacy: why Beta in gives Beta out

To see why the grid was never necessary, write down what it actually multiplied. Lesson 1 introduced the Beta family through `dbeta()`: a curve over rates between 0 and 1 with two shape numbers, which we will now call \(a\) and \(b\) (Asha used \(a = 8\), \(b = 72\)). Its recipe, up to the usual rescaling constant, is

\[ p(\theta) \;\propto\; \theta^{\,a-1}\,(1-\theta)^{\,b-1}, \]

where \(\theta\) is the candidate conversion rate and \(\propto\) means "proportional to", equal up to a constant. The likelihood of \(k\) purchases in \(n\) visits is the binomial from Lesson 1, and its \(\theta\)-dependent part is \(\theta^{k}(1-\theta)^{\,n-k}\) (the counting term \(\binom{n}{k}\) is a constant, and constants wash out in the rescale). Now multiply prior by likelihood, the whole Bayesian update, and just add exponents:

\[ \underbrace{\theta^{\,a-1}(1-\theta)^{\,b-1}}_{\text{prior}} \;\times\; \underbrace{\theta^{k}(1-\theta)^{\,n-k}}_{\text{likelihood}} \;=\; \theta^{\,(a+k)-1}\,(1-\theta)^{\,(b+n-k)-1}. \]

Look at the right-hand side: it is the Beta recipe again, with new shape numbers. That gives the entire update in one line:

\[ \text{Beta}(a,\; b) \;+\; \{k \text{ successes in } n \text{ trials}\} \;\longrightarrow\; \text{Beta}(a+k,\; b+n-k). \]

Successes land on \(a\), failures land on \(b\). For Asha: Beta(8, 72) plus 8 buys in 40 visits is Beta(8 + 8, 72 + 32) = Beta(16, 104). No grid, no loop, two additions. Check it against the grid you built last lesson:

```r
theta <- seq(0, 1, length.out = 1001)

# Lesson 1's route: multiply on the grid, then rescale
prior     <- dbeta(theta, 8, 72)
lik       <- dbinom(8, size = 40, prob = theta)
grid_post <- prior * lik / sum(prior * lik)

# This lesson's route: two additions inside one dbeta() call
conj_post <- dbeta(theta, 8 + 8, 72 + 32)     # Beta(16, 104)

plot(theta, conj_post, type = "l", lwd = 5, col = "grey80", xlim = c(0, 0.4),
     xlab = "conversion rate (theta)", ylab = "plausibility",
     main = "Closed form (thick grey) vs the grid (navy)")
lines(theta, grid_post * 1000, lwd = 1.5, col = "navy")  # weights / 0.001 spacing = density

c(grid_peak = theta[which.max(grid_post)], closed_peak = theta[which.max(conj_post)])
#>   grid_peak closed_peak
#>       0.127       0.127

# the 95 percent credible interval, exact this time
round(qbeta(c(0.025, 0.975), 16, 104), 3)
#> [1] 0.079 0.199
```

The navy grid answer disappears inside the thick grey closed form: same peak, and the exact interval (0.079, 0.199) matches the one you read off the grid last lesson. A prior family that the update cannot kick you out of is called **conjugate** to the likelihood; the Beta family is conjugate to the binomial.

[KEY INSIGHT]
Conjugacy means the answer comes back in the same currency as the question. Today's posterior, Beta(16, 104), is a perfectly legal Beta prior for tomorrow's data. Updating stops being a computation and becomes a running tally.

=== step === tryit
::eyebrow In R
## Keep the tally running

That running tally is not a metaphor. The morning left Asha at Beta(16, 104). During the afternoon, 60 more visitors arrive and 9 of them buy. Update again, starting from where the morning ended: successes onto the first shape number, failures onto the second. Fill in the four blanks:

```r
# Morning posterior: Beta(16, 104).  Afternoon: 9 buys in 60 visits.
a_new <- ____ + ____    # morning successes  + afternoon successes
b_new <- ____ + ____    # morning failures   + afternoon failures

c(a_new, b_new)
round(a_new / (a_new + b_new), 3)   # the updated posterior mean
```
::check {"regex":"(16\\s*\\+\\s*9|9\\s*\\+\\s*16)[\\s\\S]*(104\\s*\\+\\s*51|51\\s*\\+\\s*104)","gate":true,"difficulty":"intermediate","ok":"Beta(25, 155), posterior mean 0.139. You just did a full Bayesian update without touching a grid. This is why a conjugate model can re-update after every single visitor at zero cost.","no":"Start from the MORNING POSTERIOR, not the original prior: its shapes are 16 and 104. The afternoon adds 9 successes and 60 - 9 = 51 failures, so the blanks are 16 + 9 and 104 + 51."}
::solution
```r
a_new <- 16 + 9      # 25
b_new <- 104 + 51    # 155

c(a_new, b_new)
#> [1]  25 155
round(a_new / (a_new + b_new), 3)
#> [1] 0.139
```

Notice what you did NOT do: you did not go back to Beta(8, 72) and re-count the whole day. The morning's 40 visitors are already inside Beta(16, 104). Bayesian updating is order-free bookkeeping: batch the day or stream it visitor by visitor, the final posterior is identical.

=== step === concept
::eyebrow Price it in data
## What a prior is worth

The update rule hands you a second gift: a way to read any Beta prior in plain units. If data adds real successes to \(a\) and real failures to \(b\), then a Beta(\(a\), \(b\)) prior behaves exactly as if you had already watched \(a + b\) visitors and seen \(a\) of them buy. Asha's Beta(8, 72) is 80 visitors of imaginary history: 8 buyers, 72 non-buyers. The sum \(a + b\) is the prior's **concentration**, its sample-size equivalent, and it is what sets the prior's bargaining power.

The posterior mean makes that bargain explicit. With \(k\) successes in \(n\) trials it is \(\frac{a+k}{a+b+n}\), and a little algebra rewrites it as a weighted average:

\[ \text{posterior mean} \;=\; \frac{a+b}{a+b+n}\cdot\underbrace{\frac{a}{a+b}}_{\text{prior mean}} \;+\; \frac{n}{a+b+n}\cdot\underbrace{\frac{k}{n}}_{\text{data mean}}. \]

Each side gets a vote proportional to how many observations it brings, imaginary or real. Two priors can share the same peak and still behave completely differently, because the peak and the concentration are separate dials:

```r
theta <- seq(0, 1, length.out = 1001)

# two priors with the same mean 0.10, worth very different amounts
plot(theta, dbeta(theta, 8, 72), type = "l", lwd = 2, col = "grey35", xlim = c(0, 0.4),
     xlab = "conversion rate (theta)", ylab = "plausibility",
     main = "Same peak, different conviction")
lines(theta, dbeta(theta, 2, 18), lwd = 2, col = "orange3", lty = 2)
legend("topright", c("Beta(8, 72): worth 80 visitors", "Beta(2, 18): worth 20 visitors"),
       col = c("grey35", "orange3"), lwd = 2, lty = c(1, 2), bty = "n")

# the tug of war behind Asha's morning: prior worth 80, data worth 40
a <- 8; b <- 72; k <- 8; n <- 40
w_prior <- (a + b) / (a + b + n)
round(c(prior_weight = w_prior, data_weight = 1 - w_prior), 3)
#> prior_weight  data_weight
#>        0.667        0.333

round(w_prior * a/(a + b) + (1 - w_prior) * k/n, 3)   # the weighted average
#> [1] 0.133
```

There is Lesson 1's mystery number, 0.133, now with no mystery left: the prior held two thirds of the vote (80 imaginary visitors against 40 real ones), so the answer traveled exactly one third of the way from 0.10 toward 0.20.

[KEY INSIGHT]
A prior has two dials, not one. The mean says WHAT you believe; the concentration says HOW MANY observations it will take to change your mind. Always read a Beta prior as pseudo-data: a successes and b failures you are claiming to have already seen.

=== step === quiz
::eyebrow Check yourself
## Same peak, same posterior?

A colleague reviews Asha's analysis and proposes replacing her Beta(8, 72) prior with Beta(80, 720): "It has the same mean of 0.10, and I really trust our history." Same morning of data, 8 buys in 40 visits. What happens to the posterior?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- Nothing changes: both priors have mean 0.10, so both give the same posterior ::no The mean is only one of the two dials. Beta(80, 720) has the same peak but ten times the concentration, so it bargains with ten times the imaginary sample size. The posterior depends on both.
- The posterior mean lands halfway between 0.10 and 0.20, because the update always splits the difference between prior and data ::no The update never just splits the difference. It weighs each side by the observations it brings: here 800 imaginary visitors against 40 real ones, which is nowhere near an even split.
- The posterior barely moves: its mean is (80 + 8) / (800 + 40), about 0.105, because a prior worth 800 visitors outvotes 40 real ones 20 to 1 ::ok Right. Same peak, ten times the conviction, so one morning of real data shifts the answer by only half a point. Whether a prior that stubborn is defensible is exactly where this lesson goes next.

=== step === concept
::eyebrow A second pair
## The Normal-Normal update for an average

Conversion is not the only thing Asha tracks; there is also money. Her question this time: what is the new page's long-run **average order value**, the mean amount a purchase brings in? Call it \(\mu\) (the Greek letter mu). It lives on an open dollar scale, not between 0 and 1, so the Beta family does not fit. The conjugate family for an average is the normal curve, and the logic is a perfect twin of what you just did.

Her ingredients, in the same three roles as always:

- **Prior:** across a dozen past page designs the average order ran near $52, rarely outside $44 to $60. As a curve: normal with prior mean \(\mu_0 = 52\) and prior standard deviation \(\tau_0 = 4\).
- **Data:** this morning's 8 purchases averaged \(\bar{y} = 61\) dollars (\(\bar{y}\) is just "the observed data average").
- **Spread:** individual orders swing a lot, one basket is $15 and the next is $80. From years of history that order-to-order standard deviation is \(\sigma = 18\), which we treat as known.

For normal curves the clean bookkeeping unit is **precision**, defined as 1 over the variance (the variance is just the standard deviation squared): the tighter the curve, the higher its precision, the more say it gets. The conjugate update is then two lines: precisions add, and the posterior mean is the precision-weighted average of prior mean and data mean,

\[ \frac{1}{\tau_{\text{post}}^{2}} \;=\; \frac{1}{\tau_{0}^{2}} + \frac{n}{\sigma^{2}}, \qquad\quad \mu_{\text{post}} \;=\; \tau_{\text{post}}^{2}\left(\frac{\mu_{0}}{\tau_{0}^{2}} + \frac{n\,\bar{y}}{\sigma^{2}}\right), \]

where \(n\) is the number of orders and \(\tau_{\text{post}}\) is the posterior standard deviation. The term \(\sigma^{2}/n\) should look familiar from classical statistics: it is the variance of a mean of \(n\) observations, so \(n/\sigma^{2}\) is exactly how much precision the data bring. Run Asha's numbers:

```r
prior_mean <- 52; prior_sd <- 4             # a dozen past pages: average order near $52
data_mean  <- 61; data_sd  <- 18; n <- 8    # this morning: 8 orders averaging $61

prior_var <- prior_sd^2
data_var  <- data_sd^2 / n         # the mean of 8 swingy orders is only this precise
post_var  <- 1 / (1/prior_var + 1/data_var)
post_mean <- post_var * (prior_mean/prior_var + data_mean/data_var)

round(c(post_mean = post_mean, post_sd = sqrt(post_var)), 2)
#> post_mean   post_sd
#>     54.55      3.39
```

Read the surprise carefully. The morning screamed $61, yet the posterior sits at $54.55, only 28 percent of the way there. Why: 8 orders with an $18 order-to-order swing pin the average down to a standard deviation of \(18/\sqrt{8} \approx 6.4\) dollars, which is blunter than the prior's 4. The prior is literally the more precise instrument this morning, so it keeps most of the vote. Same geometry as the Beta update, different family.

This is exactly the machine in the widget below, now with every gear visible. Set the prior mean and the data average apart, then raise the data points \(n\) and watch the data side's precision \(n/\sigma^2\) grow until it owns the posterior. Then drop \(n\) to 2 or 3 and widen the prior: with vague belief and thin data, nobody wins convincingly and the posterior stays honest and wide.

::widget bayes-update {}

[NOTE]
We treated the order-to-order spread sigma as a known number. That is a real assumption: with sigma unknown too, the conjugate story needs a heavier joint family and the algebra thickens fast. Keep that thread; it becomes the cliffhanger of this lesson.

=== step === concept
::eyebrow The menu
## Flat, weak, informative: choosing the prior

Now the craft. The update is settled arithmetic; the prior is a choice, and pseudo-data is the honest way to price the options. Here are four candidate priors for the same morning, each stated as what it claims to have already seen:

- **Flat, Beta(1, 1):** every rate from 0 to 1 equally plausible. Worth 2 pseudo-visitors.
- **Weakly informative, Beta(2, 18):** conversion rates live near 0.10, held gently. Worth 20.
- **Informative, Beta(8, 72):** a dozen past designs, distilled. Worth 80. Asha's actual prior.
- **Dogmatic, Beta(80, 720):** the colleague's proposal. Worth 800; the data are outvoted before they arrive.

Same data through all four, using nothing but the two-additions rule:

```r
k <- 8; n <- 40    # the morning, one more time

pri <- rbind(flat        = c(a = 1,  b = 1),
             weak        = c(a = 2,  b = 18),
             informative = c(a = 8,  b = 72),
             dogmatic    = c(a = 80, b = 720))

post_a <- pri[, "a"] + k
post_b <- pri[, "b"] + n - k

data.frame(prior_worth = pri[, "a"] + pri[, "b"],
           post_mean   = round(post_a / (post_a + post_b), 3),
           lo95        = round(qbeta(0.025, post_a, post_b), 3),
           hi95        = round(qbeta(0.975, post_a, post_b), 3))
#>             prior_worth post_mean  lo95  hi95
#> flat                  2     0.214 0.106 0.349
#> weak                 20     0.167 0.084 0.270
#> informative          80     0.133 0.079 0.199
#> dogmatic            800     0.105 0.085 0.126
```

One morning, four defensible-sounding priors, and the estimate ranges from 0.105 to 0.214, a factor of two. Seeing the four posteriors makes each prior's character plain:

```r
theta <- seq(0, 1, length.out = 1001)
plot(theta, dbeta(theta, 88, 752), type = "l", lwd = 2, col = "grey40", xlim = c(0, 0.45),
     xlab = "conversion rate (theta)", ylab = "plausibility",
     main = "One morning of data under four priors")
lines(theta, dbeta(theta, 16, 104), lwd = 2, col = "navy")
lines(theta, dbeta(theta, 10, 50),  lwd = 2, col = "firebrick")
lines(theta, dbeta(theta, 9, 33),   lwd = 2, col = "orange3")
legend("topright", c("dogmatic -> Beta(88, 752)", "informative -> Beta(16, 104)",
                     "weak -> Beta(10, 50)", "flat -> Beta(9, 33)"),
       col = c("grey40", "navy", "firebrick", "orange3"), lwd = 2, bty = "n")
```

How to choose, in practice: put real history on the table when you have it (informative, and be ready to show the receipts); when history is thin, use a weakly informative prior that fixes the SCALE of the problem without picking the answer; and reserve dogmatic priors for things you would bet the company on. The flat prior deserves its own warning:

[WARNING]
Flat is not neutral. Beta(1, 1) asserts that a 90 percent checkout conversion rate is exactly as plausible as a 10 percent one, a claim no shop owner alive would sign. "No prior" is not on the menu; refusing to choose simply chooses that claim for you. A weak prior centered on the plausible scale is usually the easier one to defend out loud.

=== step === quiz
::eyebrow Check yourself
## Is flat the objective choice?

A teammate says: "To keep the analysis objective, I will use the flat prior Beta(1, 1). It makes no assumptions." Which response is right?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Agree: the flat prior adds no information, so it is the only assumption-free choice ::no Flat IS an assumption, and a strong one: it rates absurd values (a 90 percent conversion rate) exactly as plausible as realistic ones. There is no assumption-free seat at this table.
- Disagree: every prior is a claim, and flat is a specific, often absurd one. A weakly informative prior that matches the plausible scale is usually easier to defend ::ok Right. The choice is never assumptions versus no assumptions; it is stated assumptions versus unexamined ones. Weak priors say only "rates like this live near this scale", which is a claim you can say out loud in a meeting.
- Disagree: a flat prior breaks conjugacy, so the closed-form update stops working and you are forced back onto the grid ::no The math is fine: Beta(1, 1) is a legitimate Beta, and two additions give Beta(9, 33) as always. The problem with flat is what it CLAIMS, not what it computes.

=== step === concept
::eyebrow Stress-test it
## Prior sensitivity: measure how much it mattered

You cannot always win the argument about which prior is right. You can do something better: show how much the answer depends on it. A **prior sensitivity analysis** refits the model under every prior anyone at the table would defend and reports the spread. Here is Asha's decision number, the probability the new page beats the old 10 percent rate, under all four priors, at this morning's sample size and at a week's worth of traffic (800 buys in 4,000 visits, the same 20 percent):

```r
# P(theta > 0.10), computed exactly from the closed-form posterior
p_beats <- function(a, b, k, n) round(pbeta(0.10, a + k, b + n - k, lower.tail = FALSE), 2)

data.frame(prior        = c("flat", "weak", "informative", "dogmatic"),
           p_beats_40   = c(p_beats(1, 1,   8, 40),   p_beats(2, 18,   8, 40),
                            p_beats(8, 72,  8, 40),   p_beats(80, 720, 8, 40)),
           p_beats_4000 = c(p_beats(1, 1, 800, 4000), p_beats(2, 18, 800, 4000),
                            p_beats(8, 72, 800, 4000), p_beats(80, 720, 800, 4000)))
#>         prior p_beats_40 p_beats_4000
#> 1        flat       0.98            1
#> 2        weak       0.93            1
#> 3 informative       0.86            1
#> 4    dogmatic       0.67            1
```

Read the two columns as two different situations. At 40 visitors the answer runs from 0.67 to 0.98 depending on the prior: the data have not settled the question, the prior is doing real work, and an honest report must say so. At 4,000 visitors every prior, including the dogmatic one, is pushed to essentially certainty. Sensitivity is not a fixed property of a prior; it decays as evidence accumulates. (The dogmatic prior still shades the effect size, posterior mean 0.183 against 0.200 for the others, so even at scale it is not free.)

[KEY INSIGHT]
The sensitivity table converts an unwinnable philosophical argument into a factual sentence: "under every prior we consider defensible, the conclusion is X" or "the conclusion still depends on the prior, so we need more data." Both sentences are useful. Pretending the choice did not exist is the only wrong move.

One honest limit before you move on. Everything in this lesson worked because prior and likelihood were a matched pair: Beta with binomial counts, normal with a normal average (a third classic pair, Gamma with Poisson, handles event counts). Add one predictor variable, an unknown \(\sigma\), or a hierarchy of related rates, and the multiplication no longer lands in any named family: there is no closed form to add your way into. That is not a corner case, it is most real models, and it is why the next lesson stops computing posteriors and starts drawing samples from them.

=== step === quiz
::eyebrow Check yourself
## When defensible priors disagree

Asha brings the sensitivity table to the ship-or-wait meeting: with 40 visitors, P(new page beats 10 percent) is 0.98 flat, 0.93 weak, 0.86 informative, 0.67 dogmatic. What should she report?

::quiz {"correct":3,"gate":true,"difficulty":"advanced"}
- Report 0.86, from the informative prior she actually holds; mentioning the others would just confuse the decision ::no Reporting one number hides the fact that the number is fragile. The informative prior may be her best single choice, but the meeting deserves to know the answer moves by 0.31 across defensible priors.
- Average the four into roughly 0.86 and report that as the consensus probability ::no An average manufactures a number that no stated prior actually produced, and it buries the disagreement, which is the actual finding here. Sensitivity is reported as a spread, not compressed into a point.
- Report the range, 0.67 to 0.98 with the priors that produced it, and say what it means: 40 visitors have not settled the question, so ship cheap now or wait for more traffic ::ok Right. The spread IS the result: it tells the room exactly how much of the conclusion is evidence and how much is belief, and it points to the cure, which is more data. That is Bayesian reporting done like an adult.

=== step === concept
::eyebrow Go deeper
## References

Four authoritative places to take this further:

- [Bayes Rules! (Johnson, Ott and Dogucu), free online book](https://www.bayesrulesbook.com/) - chapters 3 to 5 are this lesson at book length: the Beta-Binomial in full, then the Normal-Normal, with the same pseudo-data reading.
- [Bayesian Data Analysis, 3rd edition (Gelman, Carlin, Stern, Dunson, Vehtari, Rubin), free PDF](https://sites.stat.columbia.edu/gelman/book/) - chapter 2 develops conjugate families formally, including the pseudo-observation interpretation used here.
- [Prior Choice Recommendations (Stan development team wiki)](https://github.com/stan-dev/stan/wiki/Prior-Choice-Recommendations) - the living, practitioner-written guide to flat vs weakly informative vs informative priors, with concrete defaults.
- [The prior can generally only be understood in the context of the likelihood (Gelman, Simpson and Betancourt, 2017)](https://arxiv.org/abs/1708.07487) - a short, readable argument for why prior sensitivity depends on the data you have, exactly the n = 40 vs n = 4,000 effect in this lesson.

=== step === complete
## Lesson 2 complete

You replaced Lesson 1's thousand-point grid with two additions: Beta(8, 72) plus 8 buys in 40 visits is Beta(16, 104), and the afternoon's 9-in-60 rolled that forward to Beta(25, 155) without recounting anything. You learned to price any prior in pseudo-data (Asha's history is worth 80 visitors, her colleague's dogmatic version 800), to run the same precision-weighted logic for a dollar average with the Normal-Normal pair (the $61 morning that honestly settled at $54.55), and to replace the argument about the "right" prior with a sensitivity table: 0.67 to 0.98 at 40 visitors, unanimity at 4,000.

All of it leaned on one lucky fact: prior and likelihood were a matched, conjugate pair. Real models rarely are. One predictor, one unknown spread, one hierarchy, and there is no family to add your way into and no formula for the posterior at all. What then? You stop computing the posterior and start sampling from it. Next, Lesson 3: MCMC and the Metropolis Sampler, where you build the algorithm that cracked this problem from scratch, in about fifteen lines of R.
