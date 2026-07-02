---
title: "Bayesian Modeling Lesson 8: Bayesian Regression and GLMs End to End"
catalog_blurb: "The full Bayesian workflow on one regression: priors, fit, check, compare, report."
description: "A full Bayesian regression workflow in R: priors on GLM coefficients, a Metropolis fit, posterior predictive checks, WAIC comparison, and credible intervals."
keywords: "bayesian regression, bayesian glm, poisson regression, log link, prior predictive check, metropolis sampler, credible interval, rate ratio, posterior predictive check, waic, brms, R"
post_type: "LESSON"
curriculum_id: "6.160.8"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-bayesian"
course_title: "Bayesian Modeling"
course_lesson: "8"
course_total: "8"
course_landing: "R-Bayesian-Modeling-Course.html"
course_next: ""
course_prev: "Bayesian-Model-Comparison-LOO-and-WAIC.html"
---

=== step === cover
::eyebrow Lesson 8 of 8
## Bayesian Regression and GLMs End to End

Lesson 7 crowned a champion: the Gamma-Poisson beat the rounded Normal by 4.9 elpd points, nearly three standard errors, and the win sat exactly on the blank days that price Asha's moss orders. But look at what that champion actually believes. One demand rate, every day, all season. Asha has never believed that for a second. Some days the craft market is packed and she sells out by two; some days it drizzles and she re-mists unsold moss. What has been missing from this entire course is the thing every real model needs: **a predictor**.

This final lesson adds one, and in doing so runs the whole pipeline you have built, once, end to end: write a model with a slope in it, put a prior on every coefficient, catch silly priors before fitting, fit with the Lesson 3 sampler, diagnose with the Lesson 4 habits, check with a Lesson 6 posterior predictive test, settle the rematch with Lesson 7's scoreboard, and hand over numbers a decision can lean on.

By the end of this lesson you will be able to:

- Write a Bayesian GLM: a linear predictor, a link function, a family, and a prior for every coefficient
- Catch an absurd prior before fitting anything, using a prior predictive check
- Fit a two-parameter model with the Metropolis sampler in base R and verify the chains agree
- Turn posterior draws into decision numbers: credible intervals for rate ratios, expected demand, and what one actual day might sell
- Check the fitted model with a posterior predictive test and prove the predictor earns its keep with a WAIC comparison

**Prerequisites:** Lessons 1 to 7 of this course (the prior-times-likelihood update, conjugate posteriors and posterior draws, the Metropolis sampler, trace-plot and multi-chain diagnostics, posterior predictive checks, and the WAIC scoreboard), plus base R functions, `sapply()` and `quantile()`.

You already know the machine below from ordinary regression: drag a line through a cloud of points and let the sum of squared misses judge it. Least squares crowns ONE best line and stops. Keep that picture as the starting point, because everything in this lesson is one upgrade to it: instead of the single best line, you will leave with every line the data finds plausible, each carrying its own probability.

::widget ols-fit {}

=== step === concept
::eyebrow A second column
## Seventy-five days, two numbers a day

A new season, a fuller notebook. The craft market where Asha rents her stall publishes a daily visitor tally from the gate counter, and this season she copied it down next to each day's kit sales: seventy-five days, two numbers a day. She also has a decision waiting. The market association has offered her a corner pitch by the entrance for next season, at 40 percent more rent, and corner stalls see roughly ten more visitors a day. Whether that rent is worth paying depends on a number nobody has yet: how much does one extra visitor actually move kit sales?

As always in this course, we play the record keeper with an answer key: we generate the season from a known recipe, then pretend we only have the notebook. The recipe stays sealed until the fit is done, when it becomes the test our machinery has to pass. Each lesson runs in a fresh interactive R session, so run this first:

```r
set.seed(12)
visitors <- round(runif(75, 5, 40))                 # the gate tally, day by day
kits     <- rpois(75, exp(-1.2 + 0.09 * visitors))  # her sales, tied to traffic
c(days = length(kits), total = sum(kits), zero_days = sum(kits == 0),
  biggest = max(kits), quietest = min(visitors), busiest = max(visitors))
#>      days     total zero_days   biggest  quietest   busiest 
#>        75       234        12        14         5        39 
round(cor(visitors, kits), 2)
#> [1] 0.78
```

A busier season than the last one: 234 kits, still twelve blank days, and one fourteen-kit day she remembers fondly. Traffic ranged from five visitors on a rained-out Tuesday to thirty-nine at the autumn fair, and the correlation of 0.78 says the two columns clearly move together. Plot it and the story is visible before any model touches it:

```r
plot(visitors, kits, pch = 16, col = "navy",
     xlab = "visitors that day", ylab = "kits sold",
     main = "Seventy-five days: market traffic against kit sales")
```

Quiet days hug zero. Busy days spread high and wide. Note that second part, because it matters later: the busy days do not just sell more, they VARY more, exactly what count data does. A straight line through this cloud is a start, but this lesson needs the line to respect what counts are.

=== step === concept
::eyebrow The model
## A line, a link, a family

Start with the regression you know and break it deliberately. The familiar line says expected kits \(= a + b \cdot \text{visitors}\). Feed it a rained-out five-visitor day with any plausible slope and intercept and it happily predicts negative kits, the exact disease that sank the rounded Normal in Lessons 6 and 7. It also claims each visitor ADDS a fixed number of kits, the same amount whether the stall is dead or slammed. Real demand does not add; it scales.

Both defects have one cure: model the **logarithm** of expected demand as the line, not demand itself. Two bookkeeping moves first. Write \(\lambda_i\) (lambda) for the expected number of kits on day \(i\), the demand level that day. And center the predictor, \(x_i = \text{visitors}_i - \overline{\text{visitors}}\), so that \(x_i = 0\) means an average-traffic day rather than an impossible zero-visitor day:

```r
x <- visitors - mean(visitors)     # center traffic: x = 0 is an average day
round(mean(visitors), 1)
#> [1] 21.8
round(exp(0.8 + 0.09 * c(-10, 0, 10)), 2)   # one trial line: kits at 12, 22, 32 visitors
#> [1] 0.90 2.23 5.47
```

The model, in full:

\[ \text{kits}_i \sim \text{Poisson}(\lambda_i), \qquad \log \lambda_i = a + b\, x_i \]

Every symbol in words. \(a\) is the intercept: the log of expected demand on an average day (about 22 visitors). \(b\) is the slope: how much the log of demand rises per extra visitor. The \(\log\) is called the **link function**, the bridge between the line (which roams the whole number line) and demand (which must stay positive: \(\lambda = e^{a+bx}\) cannot go negative, no matter what the line does). And Poisson is the **family**, the shape of days around each demand level, the same champion that won Lesson 7. This trio, line plus link plus family, is a **generalized linear model**, a GLM: the recipe behind Poisson, logistic, and most of applied regression.

The link changes what the slope MEANS, and the trial line above shows it. At 12 visitors it expects 0.90 kits, at 22 it expects 2.23, at 32 it expects 5.47: each step of ten visitors MULTIPLIES demand by the same factor of about 2.45, because \(e^{a+b(x+10)} = e^{a+bx} \cdot e^{10b}\). One extra visitor multiplies demand by \(e^{b}\); ten extra visitors compound to \(e^{10b}\). Multiplicative, never additive. Hold onto that: it is the single most misread number in applied GLMs, and the corner-stall decision hangs on it.

One decision is still open in that trio: why Poisson for the family? It is the count family with one honest knob (its variance equals its mean), and it is the shape that survived Lessons 6 and 7. Below are the day-shapes the main count families imply. Toggle them: if kit sales later turned out to spread wider than Poisson allows, the negative binomial is the standard fallback, and the workflow you are about to run would simply go around its loop once more with that family.

::widget count-dist {}

=== step === concept
::eyebrow The priors
## Priors that know the scale

Two unknowns now, so two priors. Nothing here is new in kind: each coefficient gets exactly the treatment Asha's conversion rate got in Lesson 1, a prior belief, soon to be multiplied by a likelihood. What IS new is a trap. On the log scale, "vague and harmless" priors are neither, because everything you say about \(b\) gets exponentiated. Watch. Give the slope a standard vague prior, Normal with mean 0 and standard deviation 1, and ask what it implies about the busiest day of the season:

```r
set.seed(4)
b_wild <- rnorm(4, 0, 1)             # four slopes drawn from a "harmless" vague prior
round(b_wild, 2)
#> [1]  0.22 -0.54  0.89  0.60
signif(exp(0.8 + b_wild * (max(visitors) - mean(visitors))), 2)  # implied kits, busiest day
#> [1] 9.3e+01 2.0e-04 1.0e+07 6.3e+04
```

Read those four worlds. Ninety-three kits on a fair day: conceivable. A sale every five thousand days: a dead stall. Ten MILLION kits: the prior believes Asha might personally supply every terrarium on Earth that afternoon. Sixty-three thousand: still absurd. This is a **prior predictive check**: push draws from the prior through the model and look at the data they imply, BEFORE any fitting. It is the cheapest mistake-catcher in the whole workflow, and link scales are where you need it most, because a slope prior you would call timid in ordinary regression turns into science fiction after \(e^{x}\).

So choose priors that know the scale, weakly informative rather than vague:

\[ a \sim \text{Normal}(0,\, 1), \qquad b \sim \text{Normal}(0,\, 0.05) \]

(both written as mean and standard deviation). Translate each into kits before accepting it:

```r
round(exp(qnorm(c(0.025, 0.975)) * 1), 2)          # a ~ N(0, 1): kits on an average day
#> [1] 0.14 7.10
round(exp(qnorm(c(0.025, 0.975)) * 0.05 * 10), 2)  # b ~ N(0, 0.05): multiplier per 10 visitors
#> [1] 0.38 2.66
```

The intercept prior spans one sale a week up to seven a day on an average day: generous but earthly. The slope prior says ten extra visitors could cut demand to a third or multiply it by 2.7, and anything stronger needs real evidence. Neither prior smuggles in the answer; both rule out the ten-million-kit universe. Every piece of this is the machinery you already own: prior times likelihood, coefficient by coefficient, the same update you watched compress in Lesson 1, below.

::widget bayes-update {}

=== step === quiz
::eyebrow Check yourself
## Reading a slope through a link

Suppose the fit lands the slope near \(b = 0.08\). Asha's colleague reads the model \(\log \lambda = a + b x\) and announces: "so each extra visitor adds 0.08 kits to expected sales." What is the correct reading?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- He is right: b is the number of extra kits per visitor ::no That reading belongs to the straight-line model this lesson deliberately broke. The line lives on the LOG of demand, so a step in x adds on the log scale, which multiplies on the kit scale: each visitor multiplies expected demand by exp(0.08), about 1.083.
- Each extra visitor multiplies expected demand by exp(0.08), about 1.08, so ten extra visitors compound to exp(0.8), about 2.2 times the sales, not 0.8 extra kits ::ok Right. Effects through a log link are multiplicative, and they compound: ten visitors do not add ten small slices, they stack ten multiplications. This is exactly why the corner-stall question will be answered with a rate ratio, not a kit count.
- The slope cannot be interpreted until you also know the noise parameter sigma ::no A habit imported from Normal regression. The Poisson family has no separate noise knob: its variance IS its mean. Once a and b pin down lambda, the whole distribution of a day is pinned down too.
- exp(0.08) is about 1.08, so each visitor adds 1.08 kits ::no exp(0.08) is a MULTIPLIER, not a count. On a two-kit day one more visitor adds about 0.17 kits in expectation; on a seven-kit day, about 0.58. Same ratio, different kit counts: that is what multiplicative means.

=== step === concept
::eyebrow The fit
## Metropolis, now with two knobs

Time to fit. Bayes rule has not changed shape: the posterior over BOTH coefficients is prior times likelihood,

\[ p(a, b \mid \text{kits}) \;\propto\; p(a)\; p(b) \prod_{i=1}^{75} \text{Poisson}\!\big(\text{kits}_i \mid e^{a + b x_i}\big) \]

but conjugate mercy is gone: no textbook family hands you this posterior in closed form. This is precisely the situation Lesson 3 built the Metropolis sampler for, and the sampler barely notices the upgrade. The walker now stands at a PAIR \((a, b)\) and proposes a nudge to both coordinates at once; the accept-or-stay rule is word for word the same. The entire model, prior beliefs and all, lives in one function:

```r
logpost <- function(th) {
  a <- th[1]; b <- th[2]
  dnorm(a, 0, 1, log = TRUE) + dnorm(b, 0, 0.05, log = TRUE) +
    sum(dpois(kits, exp(a + b * x), log = TRUE))
}
metropolis2 <- function(logpost, start, prop_sd, n) {
  chain <- matrix(0, n, 2, dimnames = list(NULL, c("a", "b")))
  chain[1, ] <- start
  acc <- 0
  for (i in 2:n) {
    cand <- rnorm(2, chain[i - 1, ], prop_sd)     # nudge BOTH coordinates
    if (log(runif(1)) < logpost(cand) - logpost(chain[i - 1, ])) {
      chain[i, ] <- cand
      acc <- acc + 1
    } else chain[i, ] <- chain[i - 1, ]
  }
  list(chain = chain, accept = acc / (n - 1))
}
set.seed(7)
fit <- metropolis2(logpost, start = c(0, 0), prop_sd = c(0.11, 0.011), n = 20000)
round(fit$accept, 2)
#> [1] 0.36
```

Acceptance 0.36, comfortably in the healthy zone from Lesson 3 (roughly 0.2 to 0.5 for a walk like this; the widget below lets you re-feel why too-timid and too-bold proposals both waste the walk). Now the Lesson 4 discipline, in its smallest useful form: look at the trace, and run a SECOND chain from a deliberately silly start, twice the plausible intercept and a negative slope. If both walks describe the same posterior, the start did not matter and the chains have found the real thing:

```r
plot(fit$chain[1:2000, "b"], type = "l", col = "navy",
     xlab = "iteration", ylab = "slope b",
     main = "The slope chain: a short climb, then home")

set.seed(8)
fit2 <- metropolis2(logpost, start = c(2, -0.2), prop_sd = c(0.11, 0.011), n = 20000)
draws  <- fit$chain[seq(2001, 20000, by = 4), ]   # drop warm-up, keep every 4th step
draws2 <- fit2$chain[seq(2001, 20000, by = 4), ]
round(rbind(chain_1 = colMeans(draws), chain_2 = colMeans(draws2)), 3)
#>             a     b
#> chain_1 0.813 0.084
#> chain_2 0.812 0.084

a_draws <- draws[, "a"]; b_draws <- draws[, "b"]
round(c(b_mean = mean(b_draws), b_lo90 = as.numeric(quantile(b_draws, 0.05)),
        b_hi90 = as.numeric(quantile(b_draws, 0.95))), 3)
#> b_mean b_lo90 b_hi90 
#>  0.084  0.071  0.097 
round(c(a_truth = -1.2 + 0.09 * mean(visitors), b_truth = 0.09), 2)
#> a_truth b_truth 
#>    0.76    0.09 
```

Two chains, two starts, the same answer to the third decimal: agreement is the whole idea behind Lesson 4's R-hat, seen with the naked eye. And now unseal the recipe. The notebook was generated with a centered intercept of 0.76 and a slope of 0.09. The posterior put its 90% interval for \(a\) at 0.668 to 0.953 and for \(b\) at 0.071 to 0.097. Both truths sit inside. The machine, assembled over seven lessons, works.

::widget mcmc-walk {}

=== step === tryit
::eyebrow Your turn
## Price the corner stall

The decision number. The corner pitch sees about ten more visitors a day, and step 3 showed that ten extra visitors multiply expected demand by \(e^{10b}\). You hold 4,500 posterior draws of \(b\) in `b_draws`, so you hold 4,500 plausible values of that multiplier. State the 90% credible interval for it: transform the draws, then read off the 0.05 and 0.95 quantiles.

```r
rr_ci <- ____          # 90% credible interval for the ten-visitor multiplier
round(rr_ci, 2)
```
::check {"regex":"quantile\\s*\\(\\s*exp\\s*\\(\\s*(10\\s*\\*\\s*b_draws|b_draws\\s*\\*\\s*10)\\s*\\)\\s*,\\s*(probs\\s*=\\s*)?c\\s*\\(\\s*0?\\.05\\s*,\\s*0?\\.95\\s*\\)\\s*\\)","gate":true,"difficulty":"intermediate","ok":"rr_ci = 2.04 to 2.63: with 90% credibility, ten extra visitors a day multiply expected kit sales by a factor between about 2.0 and 2.6. Note the move you just made: transform EVERY draw first, then take quantiles. That one habit answers any derived question the posterior can be asked.","no":"Transform the draws first, then summarize: quantile(exp(10 * b_draws), c(0.05, 0.95)). Applying exp to a summary of b instead of to the draws works only for quantiles and fails for means; transforming the whole vector of draws is the habit that always works."}
::solution
```r
rr_ci <- quantile(exp(10 * b_draws), c(0.05, 0.95))
round(rr_ci, 2)
#>   5%  95% 
#> 2.04 2.63 
```

=== step === concept
::eyebrow The report
## The band and the day

So the corner stall roughly doubles expected sales, and even the pessimistic end of the interval doubles them. Against 40 percent more rent, the answer writes itself, with one caution we will meet in the final quiz. But a report that only quotes coefficients is not finished. Stakeholders ask concrete questions: "the autumn fair brings 35 visitors; what do we sell?" That question hides TWO different uncertainties, and confusing them is the most common error in applied reporting.

The first is uncertainty about the demand LEVEL: what is \(\lambda\) on a 35-visitor day? The posterior draws answer by transformation, the same move as the try-it:

```r
S <- length(b_draws)                                        # 4500 plausible worlds
demand35 <- exp(a_draws + b_draws * (35 - mean(visitors)))  # each draw states a demand
set.seed(9)
day35 <- rpois(S, demand35)                # then each world runs one ACTUAL such day
round(c(demand_mean = mean(demand35),
        demand_lo90 = as.numeric(quantile(demand35, 0.05)),
        demand_hi90 = as.numeric(quantile(demand35, 0.95))), 2)
#> demand_mean demand_lo90 demand_hi90 
#>        6.85        5.96        7.76 
quantile(day35, c(0.05, 0.95))             # what the day itself might sell
#>  5% 95% 
#>   3  11 
```

Read the two intervals side by side. Expected demand on a 35-visitor day: 6.85 kits, 90% credible interval 5.96 to 7.76. Tight, because seventy-five days of data pin the line down well. But the day ITSELF might sell anywhere from 3 to 11 kits, an interval three times wider, because a single day adds Poisson luck on top of the uncertain level. The first interval is a **credible interval** for the average; the second is a **prediction interval** for one realization. Stock for the fair using the first and Asha runs out one day in four; the moss order needs the second. More data shrinks the first toward a point; the second never shrinks past the Poisson noise floor. Feel exactly that below: grow the sample size and watch the inner band pinch while the outer band refuses.

::widget regression-intervals {}

So the report reads: on a typical fair day of 35 visitors, expect about 6.9 kit sales (90% credible interval 6.0 to 7.8); plan stock for as many as 11, as few as 3; ten extra visitors of daily traffic multiply expected sales by 2.0 to 2.6.

=== step === concept
::eyebrow Check and compare
## Earn the right to be believed

Two audits before that report leaves the stall, both with tools you already own. First, Lesson 6's question: can this model even IMITATE the season it was fit to? Pick the statistic the whole lesson is about, the traffic-sales correlation, and let each fitted model invent two thousand seasons: the GLM, and Lesson 7's champion, the flat Gamma-Poisson (one rate for every day), updated on this new season as the challenger.

```r
T_obs <- cor(visitors, kits)              # the statistic a flat model cannot fake
a0 <- 4 + sum(kits); b0 <- 2 + 75         # the old champion, updated on the new season
set.seed(10)
lam0 <- rgamma(S, a0, b0)
cor_flat <- sapply(1:2000, function(s) cor(visitors, rpois(75, lam0[s])))
cor_glm  <- sapply(1:2000, function(s) cor(visitors, rpois(75, exp(a_draws[s] + b_draws[s] * x))))
round(c(observed = T_obs,
        flat_can_match = mean(cor_flat >= T_obs),
        glm_can_match  = mean(cor_glm  >= T_obs)), 3)
#>       observed flat_can_match  glm_can_match 
#>          0.784          0.000          0.350 
round(range(cor_flat), 2)                 # the flat repertoire, 2000 tries
#> [1] -0.39  0.38
```

The observed correlation is 0.784. In two thousand invented seasons the flat model never once reached it; its entire repertoire tops out at 0.38, exactly the picture the widget below draws (an observed value stranded outside everything the model can produce). The GLM reproduces it comfortably (a healthy 0.35 of its seasons score higher). Last season the flat model was the champion; one new column of data and the same check that crowned it now retires it. Second audit, Lesson 7's scoreboard, rebuilt in three lines:

```r
llik_glm  <- sapply(1:75, function(i) dpois(kits[i], exp(a_draws + b_draws * x[i]), log = TRUE))
llik_flat <- sapply(1:75, function(i) dpois(kits[i], lam0, log = TRUE))
elpd <- function(llik) log(colMeans(exp(llik))) - apply(llik, 2, var)  # Lesson 7, per day
e_glm <- elpd(llik_glm); e_flat <- elpd(llik_flat)
d <- e_glm - e_flat
round(c(elpd_glm = sum(e_glm), elpd_flat = sum(e_flat),
        diff = sum(d), se = sqrt(75 * var(d))), 1)
#>  elpd_glm elpd_flat      diff        se 
#>    -129.5    -200.1      70.6      14.4 
```

An elpd gap of 70.6 at standard error 14.4, about five standard errors: not last lesson's photo finish but a rout. The predictor earns its keep on both audits. In practice you will run this pipeline through Stan tooling rather than hand-built samplers; here is this entire lesson in five lines, to run in a local R where Stan is installed (Stan cannot run in a browser session):

```r-static
# The same pipeline with brms (local R)
library(brms)
d <- data.frame(kits, visitors)
fit <- brm(kits ~ visitors, data = d, family = poisson(),
           prior = c(prior(normal(0, 1), class = Intercept),
                     prior(normal(0, 0.05), class = b)))
summary(fit)      # coefficients, credible intervals, R-hat, effective sample size
pp_check(fit)     # the posterior predictive check, one call
loo(fit)          # the elpd machinery of Lesson 7, industrial grade
```

::widget ppc-overlay {}

[WARNING]
Four limits belong in the report. First, the model measured ASSOCIATION across days, not the effect of moving the stall; hold that thought two more steps. Second, traffic ranged from 5 to 39 visitors, so the model has earned no opinion about a 60-visitor festival; through an exponential link, extrapolation fails expensively. Third, the Poisson family fixes variance equal to mean; if sales run wider (weekend bursts, bulk buyers), the negative binomial is the standard next lap of the workflow loop. Fourth, with 75 days the data overrules any reasonable prior, but in thin-data corners (a new product, a short season) the priors carry real weight, which is why step 4 made them defensible out loud.

=== step === quiz
::eyebrow Check yourself
## The corner-stall verdict

The report lands on the desk of the marketing lead: ten-visitor rate ratio 2.3, 90% credible interval 2.0 to 2.6; elpd gap 70.6 at standard error 14.4. He concludes: "The interval excludes 1 and the model comparison is a five-sigma rout. Renting the corner stall will roughly double kit sales; the data has proven it." What is the sharpest correction?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Nothing to correct: the interval is tight, the elpd gap is decisive, so the doubling is established ::no Both numbers grade PREDICTION on observed days. They establish that busy days sell about twice what quieter days do, not what happens when Asha changes the traffic herself. Statistical strength cannot upgrade an association into an intervention effect.
- Both numbers measure association across days as they happened: busy days differ from quiet days in ways that travel with traffic (weather, season, events), so moving the stall changes the visitor count but not necessarily the rest. The doubling is a forecast that leans on a causal assumption the data alone cannot check ::ok Right. The model is excellent at predicting sales FROM traffic; whether traffic obtained by relocation behaves like traffic that came with sunny fair days is a causal question, answerable by moving the stall for a trial month, not by tightening the interval.
- The claim fails because the credible interval is too wide to support a business decision ::no The interval is actually tight: even its pessimistic end doubles sales. Width is not the flaw here. The flaw is what the number measures: an association across days, not the effect of an intervention on one stall.
- WAIC only shows the flat model is worse, so no statement about visitors is allowed at all ::no Too strong in the other direction. The comparison, together with the predictive check, fully licenses USING traffic to predict sales, for stocking and moss orders. What it cannot license by itself is the intervention reading: change the traffic, collect the doubling.

=== step === concept
::eyebrow Go deeper
## References

Five authoritative places to take the whole course further:

- [Gelman, Hill and Vehtari, Regression and Other Stories (official site)](https://avehtari.github.io/ROS-Examples/) - the book-length version of this lesson: regression as workflow, priors, checking, and honest reporting, with all code public.
- [McElreath, Statistical Rethinking (book site)](https://xcelab.net/rm/) - the course whose teaching philosophy this one shares: models built from scratch, samplers demystified, causal caution throughout.
- [Buerkner (2017), brms: An R Package for Bayesian Multilevel Models Using Stan (JSS)](https://www.jstatsoft.org/article/view/v080i01) - the tool you will actually fit GLMs with; this paper is its guided tour.
- [Stan wiki: Prior Choice Recommendations](https://github.com/stan-dev/stan/wiki/Prior-Choice-Recommendations) - the field notes behind step 4: which priors are defensible where, and why vague is not neutral.
- [Gelman et al. (2020), Bayesian Workflow (arXiv)](https://arxiv.org/abs/2011.01808) - the full loop this course walked (model, fit, check, compare, expand), written by the people who named it.

=== step === complete
## Course complete

Eight lessons ago, Bayes rule was one line about a conversion rate. Look at what ran today, end to end, in plain base R. You wrote a GLM (a line, a log link, a Poisson family), gave every coefficient a prior and made each defend itself in kits before fitting (one vague slope quietly implied ten million kit sales at the autumn fair). You fit the two-parameter posterior with the Lesson 3 Metropolis sampler (acceptance 0.36), ran Lesson 4's smallest diagnostic (two chains, silly starts, identical answers), and unsealed the recipe: both true coefficients inside their 90% intervals. Then the draws answered every question by transformation: the corner stall multiplies expected sales by 2.0 to 2.6; a 35-visitor fair day averages 6.0 to 7.8 kits but might sell 3 to 11, the band versus the day. And the model earned belief the hard way: Lesson 6's check retired last season's champion (a flat model whose two thousand invented seasons never once matched the observed correlation), and Lesson 7's scoreboard scored the win at five standard errors.

That loop (model, fit, check, compare, expand) is the whole discipline. The tools scale up but do not change shape: where you wrote fifteen lines of Metropolis, brms writes Stan; where you built a log-likelihood matrix, loo builds it with safety rails. Take the references with you, and the next time a model needs a prior, a check, or an honest interval, you will not be borrowing anyone's black box. You built each piece yourself, and you know exactly what every number in the report earned the right to say.
