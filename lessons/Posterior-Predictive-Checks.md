---
title: "Bayesian Modeling Lesson 6: Posterior Predictive Checks"
catalog_blurb: "How to test a fitted model by asking it to recreate your data."
description: "Posterior predictive checks in R: simulate replicated data from a fitted Bayesian model, pick test statistics with teeth, read PPC p-values, and catch misfit."
keywords: "posterior predictive check, ppc p-value, bayesian model checking, test statistic, replicated data, posterior predictive distribution, gamma poisson, bayesian workflow, model criticism, pp_check, bayesplot, R"
post_type: "LESSON"
curriculum_id: "6.160.6"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-bayesian"
course_title: "Bayesian Modeling"
course_lesson: "6"
course_total: "8"
course_landing: "R-Bayesian-Modeling-Course.html"
course_next: "Bayesian-Model-Comparison-LOO-and-WAIC.html"
course_prev: "Hierarchical-Models-and-Partial-Pooling.html"
---

=== step === cover
::eyebrow Lesson 6 of 8
## Posterior Predictive Checks

Lesson 5 ended with partial pooling cutting the league table's error in half, and with one loose thread deliberately left hanging: every diagnostic you own so far checks the *sampling*, not the *model*. R-hat, effective sample size, divergences, the whole Lesson 4 dashboard can glow green while the model itself is quietly wrong about the world. A dashboard tells you the engine ran; it never tells you the map is right.

This lesson builds the tool that checks the map: make the fitted model simulate the data it claims to explain, then compare its fakes to the real thing. A model that cannot re-create its own data has no business forecasting anyone's future.

By the end of this lesson you will be able to:

- Simulate replicated datasets from a fitted model in base R, carrying both the posterior's doubt about the parameter and the day-to-day noise of the data
- Choose test statistics with teeth: features the model was not tuned to reproduce, picked from the decision at stake
- Compute and read a posterior predictive p-value, including why values near 0 and near 1 are both alarms
- Place the check inside the Bayesian workflow loop and state its limits: the data is used twice, so a pass is never proof

**Prerequisites:** Lessons 1 to 5 of this course (the prior-times-likelihood update, the Beta-Binomial and Normal-Normal conjugate pairs, credible intervals from draws, the Lesson 4 trust dashboard, and the hierarchical model), plus base R functions, `replicate()` and `apply()`.

Below is the whole lesson in one picture. A model was fitted to sixty days of sales at Asha's store (you will meet the data on the next step), then asked to invent sixty-day runs of its own, two thousand times. The bars show how many zero-sale days each invented run contained; the red line marks the 15 zero-sale days that actually happened. Toggle which model does the inventing, and watch the red line walk out of the crowd, or into it.

::widget ppc-overlay {}

=== step === concept
::eyebrow The setup
## Sixty days of terrarium kits

Asha added a terrarium kit to the store at the start of spring: a glass bowl, live moss, three tiny ferns, $39. For sixty days she has logged how many kits sold each day. Here is the log, built right here so every line on this page runs in interactive R. And, exactly as in Lesson 5, simulating the data hands us an **answer key** real life never shows: the counts truly come from a Poisson process selling 1.5 kits a day on average. Put that face down. The analyst fitting the model never sees it.

```r
set.seed(2)
y <- rpois(60, 1.5)     # sixty days of kit orders (y, the letter the math uses for data)
y
#>  [1] 0 2 2 0 4 4 0 3 1 1 1 1 2 0 1 3 4 1 1 0 2 1 3 0 1 1 0 1 4 0 0 0 3 3 1 2 3 1
#> [39] 2 0 5 1 0 0 4 2 4 1 1 3 0 0 2 3 1 3 2 5 2 2

round(c(days = length(y), total = sum(y), mean = mean(y),
        sd = sd(y), zero_days = sum(y == 0)), 2)
#>      days     total      mean        sd zero_days 
#>     60.00    100.00      1.67      1.43     15.00 

plot(table(y), lwd = 8, col = "steelblue",
     xlab = "kits ordered in a day", ylab = "number of days")
```

One hundred kits in sixty days, about 1.7 a day, and one striking feature: on **15 of the 60 days, not a single kit sold**. Those blank days are not trivia. Every kit is assembled with live moss, and a kit that sits unsold needs re-misting every few days, so the pace of zero-sale days decides real work. Asha's planning question is literally a question about zeros: how often does a whole day pass with nothing sold?

Her analyst reaches for the default that has served this course since Lesson 2: a Normal model. Daily counts scatter around some unknown mean; put a prior on the mean and update. The prior is Asha's honest guess from similar launches, about 2 kits a day, give or take 1. For the day-to-day spread, hand the model the sample value, 1.43, as if known, the same simplification Lesson 2 made. The Lesson 2 update then gives the posterior in closed form:

```r
m0 <- 2; s0 <- 1        # prior on mean daily demand: about 2, give or take 1
sig <- sd(y)            # day-to-day spread, handed over as known
post_var  <- 1 / (1 / s0^2 + 60 / sig^2)
post_mean <- post_var * (m0 / s0^2 + sum(y) / sig^2)
post_sd   <- sqrt(post_var)
round(c(post_mean = post_mean, post_sd = post_sd), 2)
#> post_mean   post_sd 
#>      1.68      0.18 

round(post_mean + c(-2, 2) * post_sd, 2)     # a rough 95 percent credible interval
#> [1] 1.31 2.04
```

Mean demand 1.68 kits a day, give or take 0.18. The posterior is tight, the interval is sensible, and nothing anywhere will complain. There are no chains to diagnose, the update was closed-form, so Lesson 4's dashboard has nothing to inspect and nothing to flag. Yet this model is about to tell Asha something absurd about her blank days, and no number printed so far can reveal it.

[KEY INSIGHT]
Every diagnostic you have met so far answers "did the fitting work?" None of them answers "is the model a decent description of the world?" R-hat never looks at the model, only at the sampler. The second question needs a new tool, and the tool is disarmingly direct: make the model produce data, and look at it.

=== step === concept
::eyebrow The idea
## Ask the model to invent sixty days

Here is the test, in one sentence: if the Normal model truly understands Asha's kit sales, it should be able to invent sixty days of its own that look like the sixty she lived. Not reproduce them exactly, no model should, but produce the same *kind* of days: small whole numbers, a scatter of threes and fours, a healthy crop of blanks.

The collection of datasets a fitted model can invent has a name, the **posterior predictive distribution**:

\[ p(y^{\text{rep}} \mid y) \;=\; \int p(y^{\text{rep}} \mid \theta)\; p(\theta \mid y)\; d\theta \]

Every symbol in words: \(y\) is the data Asha actually observed, her sixty counts. \(y^{\text{rep}}\) (y-rep, for *replicated*) is one invented dataset of the same size, sixty fresh counts. \(\theta\) (theta) is the model's unknown parameter, here the mean daily demand. \(p(\theta \mid y)\) is the posterior you just computed, and \(p(y^{\text{rep}} \mid \theta)\) is the model's recipe for generating data once the parameter is fixed. The integral says: average over every plausible parameter value, weighted by how plausible the posterior says it is.

The integral looks forbidding; the simulation is three lines of instructions:

1. Draw one plausible parameter value from the posterior.
2. Using it, simulate a complete dataset the same size as the real one: sixty days.
3. Repeat, thousands of times.

Kits sell in whole numbers, so we round the Normal's draws to whole kits, the kindest thing we can do for it:

```r
sim_run_norm <- function() {
  mu <- rnorm(1, post_mean, post_sd)   # step 1: one plausible mean from the posterior
  round(rnorm(60, mu, sig))            # step 2: sixty whole-kit days under that mean
}
yrep_norm <- t(replicate(3000, sim_run_norm()))   # step 3: one fake run per row
dim(yrep_norm)
#> [1] 3000   60

rbind(real = y[1:12], fake_1 = yrep_norm[1, 1:12], fake_2 = yrep_norm[2, 1:12])
#>        [,1] [,2] [,3] [,4] [,5] [,6] [,7] [,8] [,9] [,10] [,11] [,12]
#> real      0    2    2    0    4    4    0    3    1     1     1     1
#> fake_1    2    3    1    1    1   -1    1    1    1     1    -1     1
#> fake_2    0    0    0    0    5    2    1    1    4     2     2     1

sum(yrep_norm < 0)             # days of negative sales, across all 3000 fakes
#> [1] 11703
round(mean(yrep_norm < 0), 3)  # about one fake day in fifteen
#> [1] 0.065
```

Look at fake_1, day 6: **minus one kit**. Across all 3,000 invented runs, the Normal model manufactured 11,703 days on which Asha sells a negative number of terrarium kits, roughly one fake day in fifteen. No parameter value can repair this: a Normal curve always spills below zero. The model that just produced a perfectly tight credible interval sincerely believes in negative customers.

[NOTE]
Step 1 of the recipe matters as much as step 2. Each fake run lives in its own plausible world (its own mean, drawn from the posterior), and then experiences sixty days of ordinary noise inside that world. So the fakes carry *both* kinds of doubt: what the mean really is, and what a day does around it.

=== step === quiz
::eyebrow Check yourself
## The tempting shortcut

To invent one sixty-day run, the recipe first draws a fresh plausible mean from the posterior, then simulates sixty days with it. A colleague proposes a shortcut: fix the mean at its posterior best guess, 1.68, for all 3,000 fakes, and skip the drawing. What would the shortcut change?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Nothing: across 3,000 fakes the day-to-day randomness averages out to the same overall spread either way
- The fakes would be slightly too alike: they would carry the day-to-day noise but none of the remaining doubt about the mean, making the check overconfident, and more so the smaller the dataset ::ok Right. Sixty days pin the mean down well (give or take 0.18), so here the damage is small. But with six days of data the posterior would be wide, and plug-in fakes would be far too well-behaved, flagging healthy models as misfits and excusing sick ones.
- Every fake run would come out identical, since the only random step was removed
- The shortcut has it backwards: each individual day, not each run, should get its own mean drawn from the posterior ::no One invented run plays out under ONE state of the world: a single mean governs all sixty of its days, just as one true demand level governed Asha's real two months. Redrawing the mean every day would inject parameter doubt where day-to-day noise belongs.

=== step === concept
::eyebrow The measuring stick
## One number per fake run

Two invented rows already exposed the negative-kit absurdity, but eyeballing 3,000 fakes is not a method. The move that turns "looks wrong" into a number is to compress every dataset, real or fake, into one value chosen for the decision at stake. That rule is called a **test statistic**, written \(T\): feed it a dataset, get back one number that captures the feature you care about.

Asha's planning question hangs on blank days, so take \(T(y)\) = the number of zero days in a dataset. The real sixty days scored \(T(y) = 15\). Now compute the same number for every invented run and ask: where does 15 land among the fakes? The answer is summarized by the **posterior predictive p-value**:

\[ p_{\text{PPC}} \;=\; \Pr\!\left(\, T(y^{\text{rep}}) \ge T(y) \;\middle|\; y \,\right) \]

In words: the share of invented datasets whose statistic is at least as large as the real one. If the model reproduces the feature, the real value sits inside the crowd of fakes and the share lands mid-range. If the model cannot produce the feature, the real value strands in a tail: the share crashes toward 0 when the fakes fall short of reality, or climbs toward 1 when they systematically overshoot it. Both tails are alarms; only the comfortable middle is a pass.

Feel it below. The histogram is \(T\), the number of zeros, across two thousand invented datasets; the red line is Asha's observed 15. Toggle which fitted model does the inventing and watch where the line stands.

[NOTE]
The code beneath the widget runs the check in a quick plug-in form, fixing the parameter at its single best estimate, which is why its p-values differ from ours in the second decimal. You will run the full version, posterior draws and all, two steps from now; with sixty days of data the difference is cosmetic.

::widget ppc-overlay {}

=== step === concept
::eyebrow The fix
## The right shape for a count

List what the Normal got wrong about a day of kit sales. A day's sales are a whole number; the Normal draws 1.7304 and hopes rounding forgives it. Sales are often exactly zero; the rounded Normal makes blank days rarer than Asha's reality. Sales can never be negative; the Normal insisted otherwise 11,703 times. There is a distribution built for precisely this kind of variable, counts of events in a fixed window: the **Poisson**, with one parameter \(\lambda\) (lambda), the true average number of kits per day.

To be Bayesian about \(\lambda\) you need a prior on it, and there is a natural conjugate choice, the third pair in your collection after Lesson 2's Beta-Binomial and Normal-Normal: the **Gamma**.

\[ \lambda \sim \text{Gamma}(a,\, b) \qquad \Longrightarrow \qquad \lambda \mid y \;\sim\; \text{Gamma}\!\left(a + \textstyle\sum_i y_i,\;\; b + n\right) \]

Read the prior as pretend experience: \(a\) is the number of orders you pretend to have already seen, over \(b\) pretend days of watching. The update is the same add-up-the-evidence move as every conjugate pair you know: the data adds its real total \(\sum_i y_i\) (all kits actually sold, 100) to \(a\), and its real days \(n = 60\) to \(b\). Asha's step 2 belief, about 2 a day give or take 1, wears the Gamma shape as \(a = 4, b = 2\): four pretend orders over two pretend days, so the prior mean is \(4/2 = 2\) and the prior spread is \(\sqrt{4}/2 = 1\).

```r
a <- 4; b <- 2                          # prior: 4 pretend orders over 2 pretend days
a_post <- a + sum(y); b_post <- b + 60  # add the real evidence: 100 kits, 60 days
c(a_post = a_post, b_post = b_post)
#> a_post b_post 
#>    104     62 

round(c(post_mean = a_post / b_post, post_sd = sqrt(a_post) / b_post), 2)
#> post_mean   post_sd 
#>      1.68      0.16 

sim_run_pois <- function() rpois(60, rgamma(1, a_post, b_post))
yrep_pois <- t(replicate(3000, sim_run_pois()))   # 3000 fake runs, Poisson edition
```

The posterior says 104 orders' worth of evidence over 62 days: rate 1.68, give or take 0.16, the same center the Normal found. And by construction a Poisson fake can produce a blank day but never a negative one: `rpois` deals only in whole, non-negative counts. Whether it produces blanks at the right *rate* is not settled by good intentions. That is what the check is for.

=== step === concept
::eyebrow The verdict
## Four statistics, two models, one verdict

One statistic is a spotlight; a small suite is floodlights. Alongside the zeros, score every fake on its mean, its spread, and its biggest day (the number Asha would use to set a stock ceiling). Four statistics, computed for the real data and for all 6,000 fakes:

```r
T_suite <- function(d) c(mean = mean(d), sd = sd(d), zeros = sum(d == 0), max = max(d))
T_obs  <- T_suite(y)
T_norm <- apply(yrep_norm, 1, T_suite)   # 4 statistics for each Normal fake
T_pois <- apply(yrep_pois, 1, T_suite)   # and for each Poisson fake
ppc_p  <- function(T_rep) rowMeans(T_rep >= T_obs)
round(rbind(observed = T_obs, p_normal = ppc_p(T_norm), p_poisson = ppc_p(T_pois)), 2)
#>           mean   sd zeros  max
#> observed  1.67 1.43 15.00 5.00
#> p_normal  0.55 0.55  0.03 0.76
#> p_poisson 0.51 0.17  0.19 0.79
```

Read it column by column; the table repays care.

- **mean**: both models pass, 0.55 and 0.51, and the pass is worthless. Each model was fit precisely to match the average, so scoring it on the average is letting a student grade the one question they copied.
- **sd**: both pass. Rounding happened to give the Normal roughly the right spread, and a Poisson's spread tracks its mean. No separation here either.
- **max**: both pass, 0.76 and 0.79. Either model can produce a five-kit day.
- **zeros**: the models finally part. Under the Normal, only 3 fake runs in 100 manage 15 or more blank days: p = 0.03, Asha's real two months are a tail event the model can barely imagine. Under the Poisson, 19 in 100: her blank days are an ordinary thing for this model to do.

(These differ from the widget's 0.02 and 0.15 in the second decimal because the widget pins the rate at one estimate, while each of our fakes drew its own from the posterior. With sixty days the gap is cosmetic; with six it would not be.)

Numbers convict; a picture shows the crime. Overlay the shape of eighty invented runs (grey) on the shape of the real days (red):

```r
ks <- -3:8
freq <- function(d) sapply(ks, function(k) mean(d == k))
par(mfrow = c(1, 2))
matplot(ks, apply(yrep_norm[1:80, ], 1, freq), type = "l", lty = 1,
        col = adjustcolor("grey40", 0.25), xlab = "kits in a day",
        ylab = "share of days", main = "Normal fakes vs real")
lines(ks, freq(y), lwd = 3, col = "firebrick")
matplot(ks, apply(yrep_pois[1:80, ], 1, freq), type = "l", lty = 1,
        col = adjustcolor("grey40", 0.25), xlab = "kits in a day",
        ylab = "share of days", main = "Poisson fakes vs real")
lines(ks, freq(y), lwd = 3, col = "firebrick")
par(mfrow = c(1, 1))
```

On the left, the grey crowd piles real probability over minus one and minus two, where the red line lies flat at zero, and at zero kits the red peak pokes above the whole crowd: genuine blank days outnumber anything Normal fakes produce. On the right, the red line threads through the grey band along its whole length. This overlay, replicate curves behind the observed curve, is the most used picture in Bayesian model checking, and you just drew it from scratch in base R.

[KEY INSIGHT]
A posterior predictive check has power only on features the model was NOT tuned to reproduce. A pass on the mean, from a model fit to the mean, is a certainty, not evidence. Choose statistics the way Asha did: from the decision (blank days, stock ceilings), never from the fitting.

=== step === tryit
::eyebrow Your turn
## Score the stock ceiling

Asha sizes her moss orders against the biggest day the model should expect, so the max statistic is the one her stock ceiling leans on. The replicated biggest-days under the Poisson model take one line of `apply`; the p-value is yours. Fill in the blank using the suite's pattern: the share of fake runs whose biggest day is at least the real one, `max(y)`, which was 5.

```r
max_rep <- apply(yrep_pois, 1, max)   # each fake run's biggest day
p_max <- ____
round(p_max, 2)
```
::check {"regex":"mean\\s*\\(\\s*max_rep\\s*>=\\s*(max\\s*\\(\\s*y\\s*\\)|5)\\s*\\)","gate":true,"difficulty":"intermediate","ok":"p_max = 0.79, comfortably mid-range: the Poisson invents biggest-days like the real one, so a stock ceiling planned from its fakes is trustworthy on this feature. (It sits at 0.79 rather than 0.5 because ties count: many fakes top out at exactly 5.)","no":"The p-value is the share of fake runs whose statistic is at least the observed one. Same pattern as the suite: mean(max_rep >= max(y))."}
::solution
```r
max_rep <- apply(yrep_pois, 1, max)   # each fake run's biggest day
p_max <- mean(max_rep >= max(y))
round(p_max, 2)
#> [1] 0.79
```

=== step === concept
::eyebrow Zoom out
## One turn of the Bayesian workflow

Step back and look at what you just did, because it was not a one-off trick. It was one full turn of the loop that organizes all serious Bayesian practice:

You wrote a Normal model and fit it with Lesson 2 machinery. You checked it two ways: the sampling diagnostics had nothing to catch (the update was closed-form), and the posterior predictive check caught everything (negative kits, missing blanks, p = 0.03). You expanded: swapped the likelihood for a Poisson, refit, rechecked, and the new model survived. In real work the loop keeps turning, because surviving today's suite closes nothing: the Poisson makes its own strong promise, that the variance of daily counts equals their mean, and if kit orders arrive in weekend bursts that promise breaks. The same machinery with \(T\) = the variance-to-mean ratio would catch it on the next turn.

The loop also scales. Lesson 5 ended by promising that the hierarchical model would be made to simulate months of its own, and that is exactly this machinery pointed at a bigger model: draw \(\mu_0\), \(\tau\) and the eight family means from their joint posterior, simulate a full 121-order month, compute per-family statistics, and compare against the month Asha actually had. Checking is the same idea at every scale, which is why it earned a permanent stage in the loop.

With Stan-based tools the whole lesson collapses into one call. Read it now, run it when you have a local R with Stan installed:

```r-static
# The same check with Stan tooling (local R; Stan cannot run in a browser session).
# Locally you would attach the brms package first, then:
fit <- brms::brm(kits ~ 1, data = data.frame(kits = y), family = poisson())
brms::pp_check(fit, type = "hist")                                  # replicate overlays
brms::pp_check(fit, type = "stat", stat = function(d) sum(d == 0))  # the zeros statistic
```

[WARNING]
Three honest limits before you lean on this tool. First, the same sixty days were used twice, once to fit and once to judge, so the check is lenient: a model molded to a dataset finds that dataset easier to reproduce. Second, because of that leniency, a PPC p-value is not a classical p-value: there is no 0.05 ritual and no rejection ceremony, only a reading (mid-range: feature reproduced; either tail: investigate). Third, a pass is the absence of one specific failure, never a certificate: a feature you did not test can still be badly wrong. The cure for the double use of data is to stop reusing it, and that is exactly where this course goes next.

::widget process-flow {"steps":[{"title":"Model","sub":"write the story: a likelihood for the data plus priors for its parameters"},{"title":"Fit","sub":"conjugate math or MCMC turns prior plus data into a posterior"},{"title":"Check","sub":"sampling diagnostics first, then posterior predictive checks"},{"title":"Expand","sub":"fix what the check exposed, then go around again"}]}

=== step === quiz
::eyebrow Check yourself
## "The model is validated"

A colleague re-runs the suite under the Normal model, looks only at the mean statistic, reads p = 0.55, and announces: "The model has passed a posterior predictive check, so it is validated." What is the sharpest correction?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- He should require p above 0.95 before declaring a pass, and 0.55 falls short
- He is right: 0.55 is close to 0.5, the ideal value, and one clear pass is enough to certify a model
- The mean is a toothless statistic here: the model was tuned to reproduce it, so the pass was near-automatic and says nothing about the zeros, where the same model already failed at p = 0.03. A pass is the absence of one failure, never proof ::ok Right, on both counts. Power comes from statistics the model was not fit to match, and no collection of passes ever adds up to a certificate; the zeros verdict against the Normal still stands.
- The check is meaningless either way, because the same sixty days were used to fit and to judge, so every statistic will always pass ::no The double use makes checks lenient, not blind. The zeros statistic convicted this very model at p = 0.03 on those same sixty days. Reused data softens the judge; it does not put the judge to sleep.

=== step === concept
::eyebrow Go deeper
## References

Five authoritative places to take this further:

- [Rubin (1984), Bayesianly Justifiable and Relevant Frequency Calculations for the Applied Statistician (Annals of Statistics)](https://doi.org/10.1214/aos/1176346785) - where replicated datasets were born: the paper that first asked what a Bayesian should expect data to look like.
- [Gelman, Meng and Stern (1996), Posterior Predictive Assessment of Model Fitness via Realized Discrepancies (Statistica Sinica)](http://www.stat.columbia.edu/~gelman/research/published/A6n41.pdf) - the canonical PPC paper: test quantities, posterior predictive p-values, and worked examples.
- [Gelman et al., Bayesian Data Analysis, 3rd edition, chapter 6 (free PDF)](http://www.stat.columbia.edu/~gelman/book/) - the textbook treatment of model checking, including the double-use-of-data caveat in full.
- [Gabry, Simpson, Vehtari, Betancourt and Gelman (2019), Visualization in Bayesian Workflow](https://arxiv.org/abs/1709.01449) - the playbook for graphical checks, including the grey-overlay picture you drew by hand.
- [Gelman et al. (2020), Bayesian Workflow](https://arxiv.org/abs/2011.01808) - the whole loop this lesson slots into: model, fit, check, expand, and when to stop.

=== step === complete
## Lesson 6 complete

You started with a model that passed everything it had ever been asked: a tight posterior (1.68 give or take 0.18), a sensible interval, and not one diagnostic with grounds to object. Then you made it produce data, and it confessed: 11,703 days of negative kit sales, and blank days so rare that Asha's real 15 were a three-in-a-hundred event (p = 0.03). The machinery that extracted the confession was the posterior predictive distribution: draw a plausible parameter from the posterior, simulate a full sixty-day run, repeat 3,000 times, then compress every run into test statistics chosen from the decision, not from the fitting. Swapping the likelihood for a Poisson, with a Gamma prior worn as pretend experience (104 orders over 62 days), produced a model whose fakes contain blank days at an honest rate (p = 0.19) and whose biggest days match Asha's own (p = 0.79). And you placed the whole exercise where it belongs, as the check stage of the workflow loop: model, fit, check, expand.

One confession from this lesson still stands, though: the same sixty days fit the model and judged it, and a judge who helped write the answers is lenient. Next, Lesson 7: Bayesian Model Comparison with LOO and WAIC, where the conflict of interest is removed. Leave one day out, ask the model to predict it, repeat for every day, and score models on data they never saw, all from a log-likelihood matrix in plain base R.
