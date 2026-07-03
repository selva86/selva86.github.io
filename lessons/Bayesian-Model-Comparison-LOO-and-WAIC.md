---
title: "Bayesian Modeling Lesson 7: Bayesian Model Comparison with LOO and WAIC"
catalog_blurb: "How to score rival models on days they never saw before choosing one."
description: "Bayesian model comparison in R: leave-one-out cross-validation and WAIC from a log-likelihood matrix in base R, plus elpd differences with standard errors."
keywords: "loo, waic, elpd, leave-one-out cross-validation, bayesian model comparison, log predictive density, lppd, effective number of parameters, log-likelihood matrix, psis, loo package, model selection, R"
post_type: "LESSON"
curriculum_id: "6.160.7"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-bayesian"
course_title: "Bayesian Modeling"
course_lesson: "7"
course_total: "8"
course_landing: "R-Bayesian-Modeling-Course.html"
course_next: "Bayesian-Regression-and-GLMs-End-to-End.html"
course_prev: "Posterior-Predictive-Checks.html"
---

=== step === cover
::eyebrow Lesson 7 of 8
## Bayesian Model Comparison with LOO and WAIC

Lesson 6 ended with a confession: the posterior predictive check judged each model against the same sixty days that trained it, and a judge who helped write the answers is lenient. It also left a gap. A check can expose a model (the Normal, caught believing in negative kit sales), but it cannot rank rivals. Asha still has to pick the model that prices next month's moss order.

This lesson removes the conflict of interest. Hide one day, make each model state a probability for what that day actually sold, score the log of that probability, and repeat until all sixty days have taken a turn as the judge. That is leave-one-out cross-validation, LOO for short. Then you will meet WAIC, the shortcut that reads nearly the same answer straight off one matrix, with no refitting at all.

By the end of this lesson you will be able to:

- Score a model's forecast of a held-out day with the log predictive density, and say why the log scale is the honest ruler
- Compute exact leave-one-out scores for two conjugate models in base R, one line of update per left-out day
- Build the log-likelihood matrix, read the flattery in lppd, and charge for it with the WAIC penalty
- Compare two models with an elpd difference and its standard error, and state precisely what the winner did and did not win

**Prerequisites:** Lessons 1 to 6 of this course (the conjugate updates of Lesson 2, posterior draws, and Lesson 6's kit data, both fitted models, and the double-use-of-data warning), plus base R functions, `sapply()` and `apply()`.

Below is the engine of the whole lesson. The strip is a dataset cut into folds; step through and watch each fold take one turn as the held-out judge while the rest do the training. Leave-one-out simply turns that dial to its limit: as many folds as days, so every one of Asha's sixty days gets scored by a model that never met it.

::widget cv-folds {}

=== step === concept
::eyebrow The rematch
## Two rivals, one moss order

Asha's question has not moved: sixty logged days of terrarium-kit sales, $39 a kit, live moss that needs re-misting on every day nothing sells, and a moss order to price for next month. What moved is the cast. Lesson 6 caught the rounded Normal red-handed: only 3 of its invented runs in 100 could match her fifteen blank days. The Gamma-Poisson survived. But a colleague looks at the same table and pushes back: the Normal passed on the mean, the spread, and the biggest day, three features out of four. Is one bad feature disqualifying? The debate needs a different kind of answer: not another feature, but **one total score per model**, earned on days the model never saw.

First, rebuild both rivals exactly as Lesson 6 left them. Each lesson runs in a fresh interactive R session, so run this block once:

```r
set.seed(2)
y <- rpois(60, 1.5)      # Asha's sixty days of kit orders, same seed as Lesson 6
c(days = length(y), total = sum(y), zero_days = sum(y == 0), biggest = max(y))
#>      days     total zero_days   biggest 
#>        60       100        15         5 

sig <- sd(y)                                  # the Normal treats this spread as known
post_var  <- 1 / (1 / 1^2 + 60 / sig^2)       # Lesson 2 update, prior mu ~ N(2, 1)
post_mean <- post_var * (2 / 1^2 + sum(y) / sig^2)
post_sd   <- sqrt(post_var)

a <- 4; b <- 2                                # Gamma prior: 4 pretend orders, 2 pretend days
a_post <- a + sum(y); b_post <- b + 60        # Lesson 6 update: add 100 kits, 60 days

round(c(normal = post_mean, normal_sd = post_sd,
        poisson = a_post / b_post, poisson_sd = sqrt(a_post) / b_post), 2)
#>     normal  normal_sd    poisson poisson_sd 
#>       1.68       0.18       1.68       0.16 
```

Both posteriors agree about the center: demand near 1.68 kits a day. Whatever separates these two models, it is not the average. It is the shape of the days each one expects around that average, and to grade a shape we need a scoring rule.

=== step === concept
::eyebrow The ruler
## One day, one probability, one log

Start with the smallest possible question. Tomorrow, day 61, has not happened yet, and each fitted model is willing to state a probability for every count tomorrow could bring: a probability for a blank day, for one kit, for two. Lesson 6 built this object and named it the posterior predictive distribution. The only new move is to read off its numeric value at each count instead of sampling from it, and the recipe is the same Monte Carlo average you have used since Lesson 2: a model's probability of \(k\) kits is the average, across its posterior draws, of the probability of \(k\) under each draw.

\[ p(k \mid y) \;=\; \int p(k \mid \theta)\, p(\theta \mid y)\, d\theta \;\approx\; \frac{1}{S} \sum_{s=1}^{S} p(k \mid \theta_s) \]

Every symbol in words: \(y\) is the sixty observed counts. \(k\) is a possible count for a new day (0 kits, 1 kit, and so on). \(\theta\) (theta) is the model's unknown parameter, the demand level. \(\theta_s\) is one of \(S\) draws from the posterior, and \(p(k \mid \theta_s)\) is the model's recipe for a day once the parameter is pinned at that draw. For the Poisson that recipe is `dpois`. For the rounded Normal, one honest subtlety: it produces whole kits by rounding a bell-curve draw, so its probability of \(k\) kits is all the bell-curve mass that rounds to \(k\), which is `pnorm(k + 0.5) - pnorm(k - 0.5)`.

```r
S <- 4000
set.seed(7)
lam <- rgamma(S, a_post, b_post)         # plausible demand rates, Poisson model
mu  <- rnorm(S, post_mean, post_sd)      # plausible means, rounded-Normal model

p_pois <- function(k) mean(dpois(k, lam))
p_norm <- function(k) mean(pnorm(k + 0.5, mu, sig) - pnorm(k - 0.5, mu, sig))

probs <- rbind(poisson = sapply(0:5, p_pois), normal = sapply(0:5, p_norm))
colnames(probs) <- paste(0:5, "kits")
round(probs, 3)
#>         0 kits 1 kits 2 kits 3 kits 4 kits 5 kits
#> poisson  0.190  0.313  0.260  0.146  0.062  0.021
#> normal   0.141  0.243  0.264  0.181  0.078  0.021

round(mean(pnorm(-0.5, mu, sig)), 3)     # belief the Normal parks on impossible days
#> [1] 0.066
```

Same center, two different shapes. The Normal quietly parks 6.6% of its belief on negative days (Lesson 6's 11,703 impossible fakes, wearing their true name: wasted probability), and pays for that by shaving the blank day down to 0.141 and inflating the threes and fours. Now the score. When a day arrives, a forecast is graded by **the log of the probability it gave to what actually happened**, called the log score. Three reasons the log is the right ruler:

- **It adds across days.** Independent days multiply probabilities; logs turn that product into a sum, so sixty days of forecasting become sixty per-day scores you can add, compare, and inspect one at a time.
- **It is brutal on overconfidence.** Watch the ruler in action below: half is a gentle penalty, a longshot that actually happens is a crater. A model cannot safely dismiss outcomes that reality keeps producing.
- **It is a proper scoring rule.** Under this ruler, the strategy with the best long-run score is to state your true beliefs. Hedging loses points; exaggerating loses points. The name for that property is *proper*.

```r
round(log(c(half = 0.5, pois_blank = p_pois(0), norm_blank = p_norm(0), longshot = 0.001)), 2)
#>       half pois_blank norm_blank   longshot 
#>      -0.69      -1.66      -1.96      -6.91 
```

Honesty is the whole game, and you can see it in its simplest home below: probability forecasts of a yes-or-no event. A calibrated model's stated probabilities match observed frequencies; slide the model toward over-confident and the curve bows away from the diagonal. The log score is the ruler that bills exactly that gap. Asha's Normal makes the same kind of overstatement: it calls a blank day a 0.141 event while she lived a 15-in-60 reality.

::widget calibration-curve {}

=== step === quiz
::eyebrow Check yourself
## A nickel of probability

On a blank day the Poisson model states probability 0.19 and the rounded Normal 0.14. A colleague shrugs: the gap is five cents of probability, so the models are practically interchangeable. Over Asha's fifteen blank days, what does the log score say?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Not much: 0.05 of probability is within noise, and the log score treats near-ties as ties ::no The ruler is logarithmic and additive. Each blank day adds log(0.19) minus log(0.14), about 0.29, and fifteen blank days stack that up to about 4.4, a factor of roughly eighty in plausibility. Small per-day gaps are exactly what the log score refuses to ignore.
- The gap compounds: about 0.29 per blank day on the log scale, times fifteen blank days, is about 4.4, so the Poisson found the blank-day record alone roughly eighty times more plausible ::ok Right. Log scores add across days, which means probabilities multiply. A modest per-day edge, repeated where the data actually lives, becomes a decisive verdict, and you are about to watch the totals separate for exactly this reason.
- The Normal's lower number is the safer statement, and the log score rewards caution ::no The log score rewards honesty, not timidity: it pays the model that gave the truth the probability it deserved. Understating something that turns out to be common loses points just as surely as overclaiming something rare, that is what makes the rule proper.
- Both models put less than 0.5 on a blank day, so both call it wrongly and the fifteen days tie ::no A forecast spread over seven or more possible counts rarely puts half its belief on any single one; 0.19 can be the largest single-count belief on offer. A probability forecast is not a yes-or-no call, and the score reads the probability, not a verdict.

=== step === concept
::eyebrow Every day takes a turn
## Score only what the model never saw

The table two steps back has a familiar flaw: those probabilities came from posteriors that had already seen all sixty days. Scoring them against the same sixty days is Lesson 6's conflict of interest all over again. The fix is the one the cover promised. Hide day 1, fit each model on the other 59 days, ask it for the hidden day's probability, take the log, and repeat until every day has had its turn:

\[ \text{elpd}_{\text{loo}} \;=\; \sum_{i=1}^{60} \log p(y_i \mid y_{-i}) \]

In words: \(y_i\) is day \(i\)'s actual count, \(y_{-i}\) ("y minus i") is the other 59 days, and \(p(y_i \mid y_{-i})\) is the probability that a model fit only on those 59 gives to what day \(i\) really sold. The total is called the **elpd**, the expected log pointwise predictive density. Unpack it word by word: *pointwise*, one day at a time; *predictive*, judged on data left out of the fit; *log density*, the log-probability ruler; *expected*, because this sum stands in for how the model would score on average on days it has never seen.

Sixty refits sounds expensive. For conjugate models it is arithmetic: dropping day \(i\) just subtracts its evidence, so the Poisson's posterior without day \(i\) is \(\text{Gamma}(a + \sum y_{-i},\, b + 59)\), one line, and the Normal's Lesson 2 update rebuilds on 59 days the same way (its spread `sig` stays fixed: that model treats the spread as handed over, not learned).

```r
loo_day <- function(i) {
  lam_i <- rgamma(S, a + sum(y[-i]), b + 59)      # Poisson posterior without day i
  v_i   <- 1 / (1 / 1^2 + 59 / sig^2)             # Normal update on the other 59 days
  mu_i  <- rnorm(S, v_i * (2 / 1^2 + sum(y[-i]) / sig^2), sqrt(v_i))
  c(pois = log(mean(dpois(y[i], lam_i))),
    norm = log(mean(pnorm(y[i] + 0.5, mu_i, sig) - pnorm(y[i] - 0.5, mu_i, sig))))
}
set.seed(11)
lpd <- sapply(1:60, loo_day)    # 2 x 60: one honest score per model per day
round(lpd[, 1:5], 2)            # the first five days sold 0, 2, 2, 0, 4 kits
#>       [,1]  [,2]  [,3]  [,4]  [,5]
#> pois -1.69 -1.35 -1.35 -1.70 -2.84
#> norm -1.98 -1.33 -1.33 -1.98 -2.59

round(rowSums(lpd), 1)          # elpd_loo: each model's total honest score
#>   pois   norm 
#> -102.4 -107.3 
```

Read a few columns before you trust the totals. Days 1 and 4 were blank: the Poisson wins them (-1.69 against -1.98). Days 2 and 3 sold two kits each: a near tie, the Normal ahead by a hair. Day 5 sold four kits, and the **Normal wins it** (-2.59 against -2.84), because its shape spreads more belief over threes and fours. These models genuinely disagree in different places; no single day settles it, and the totals do: -102.4 beats -107.3.

[NOTE]
Look at the order of operations inside `loo_day`: `log(mean(...))`, never `mean(log(...))`. The model's belief about day \(i\) is the average of the probabilities across plausible parameter values, taken in probability space, and only then logged. The reversed order computes something systematically lower. Hold onto that gap between the two orders: WAIC is about to put it to work.

=== step === tryit
::eyebrow Your turn
## Score the five-kit day

Day 41 was Asha's biggest: 5 kits sold, the day her stock ceiling leaned on in Lesson 6. The refit that never met day 41 is already written. State the Poisson's honest score for that day: the log of the average probability of day 41's count across the refit draws.

```r
set.seed(41)
lam_41 <- rgamma(S, a + sum(y[-41]), b + 59)   # the posterior that never met day 41
score_41 <- ____
round(score_41, 2)
```
::check {"regex":"log\\s*\\(\\s*mean\\s*\\(\\s*dpois\\s*\\(\\s*(y\\[\\s*41\\s*\\]|5)\\s*,\\s*lam_41\\s*\\)\\s*\\)\\s*\\)","gate":true,"difficulty":"intermediate","ok":"score_41 = -3.96: the refit model gave the five-kit day probability exp(-3.96), about 0.019, one day in fifty. And notice the honesty at work: with its biggest day hidden, the refit posterior settles on a slightly lower demand rate (1.62 instead of 1.68), so it finds 5 kits a little less plausible than the full-data table did.","no":"Average in probability space first, then log the single number: log(mean(dpois(y[41], lam_41))). The reversed order, mean(log(...)), comes out systematically lower and is not the model belief about day 41."}
::solution
```r
set.seed(41)
lam_41 <- rgamma(S, a + sum(y[-41]), b + 59)
score_41 <- log(mean(dpois(y[41], lam_41)))
round(score_41, 2)
#> [1] -3.96
```

=== step === concept
::eyebrow The shortcut
## Fit once, score everything

The sixty refits cost nothing here because conjugate updates are arithmetic. Real Bayesian models rarely grant that mercy: Lessons 3 and 4 fit by MCMC, where one fit can take minutes and sixty refits of a serious model can take a night. The field's workhorse shortcut starts from what a single full-data fit already owns, its \(S\) posterior draws, and arranges one number per draw per day into the **log-likelihood matrix**: one row per draw, one column per day, each entry the log-probability of that day's count under that draw.

\[ \text{llik}[s,\, i] \;=\; \log p(y_i \mid \theta_s) \]

```r
llik_pois <- sapply(1:60, function(i) dpois(y[i], lam, log = TRUE))
llik_norm <- sapply(1:60, function(i)
  log(pnorm(y[i] + 0.5, mu, sig) - pnorm(y[i] - 0.5, mu, sig)))
dim(llik_pois)                   # one row per posterior draw, one column per day
#> [1] 4000   60

round(llik_pois[1:3, 1:4], 2)    # corner: 3 draws scoring days 1 to 4 (0, 2, 2, 0 kits)
#>       [,1]  [,2]  [,3]  [,4]
#> [1,] -2.07 -1.31 -1.31 -2.07
#> [2,] -1.48 -1.39 -1.39 -1.48
#> [3,] -1.81 -1.32 -1.32 -1.81
```

Read the corner. Each row is one plausible demand rate scoring every day; columns 1 and 4 are both blank days, so within a row they repeat, while down a column the value wobbles because each draw is a different rate. This matrix is the standard interchange format of Bayesian model comparison: Stan-based tools hand exactly this object to the packages that score models. Averaging each column in probability space and logging (the same order of operations as always) gives the matrix's version of a total score, the **lppd**, the log pointwise predictive density:

\[ \text{lppd} \;=\; \sum_{i=1}^{60} \log\!\left( \frac{1}{S} \sum_{s=1}^{S} e^{\,\text{llik}[s,\,i]} \right) \]

```r
lppd <- function(llik) sum(log(colMeans(exp(llik))))
round(c(lppd_pois = lppd(llik_pois), elpd_loo_pois = sum(lpd["pois", ]),
        lppd_norm = lppd(llik_norm), elpd_loo_norm = sum(lpd["norm", ])), 1)
#>     lppd_pois elpd_loo_pois     lppd_norm elpd_loo_norm 
#>        -101.2        -102.4        -106.3        -107.3 
```

For both models the lppd lands about one point above the honest LOO total. That is no accident and no rounding wobble: the lppd scores each day using a posterior that already met that day. It is Lesson 6's double use of data, finally wearing a number, and a shortcut is only useful if it can pay that flattery back.

=== step === concept
::eyebrow The penalty
## WAIC charges the model for its flexibility

How do you measure flattery without running the sixty refits you were trying to avoid? Watanabe's 2010 answer, the **widely applicable information criterion (WAIC)**: the matrix already shows it. Look down one column: 4,000 log-probabilities for the same day, wobbling as the parameter moves from draw to draw. That wobble is the day's leverage over the model. A day whose probability swings with the parameter is a day the fit could bend toward, and did bend toward, a little, when that day sat in the training data. So charge every day its wobble:

\[ p_{\text{WAIC}} \;=\; \sum_{i=1}^{60} \operatorname{Var}_{s}\!\big[\, \text{llik}[s,\, i] \,\big] \qquad\quad \widehat{\text{elpd}}_{\text{WAIC}} \;=\; \text{lppd} \;-\; p_{\text{WAIC}} \]

In words: \(\operatorname{Var}_s\) is the variance down column \(i\), across the \(S\) draws; \(p_{\text{WAIC}}\), the sum of those variances, is called the **effective number of parameters**; and the WAIC estimate of the honest score is the flattered lppd minus that charge.

```r
waic <- function(llik) {
  lppd   <- sum(log(colMeans(exp(llik))))
  p_waic <- sum(apply(llik, 2, var))
  c(elpd_waic = lppd - p_waic, p_waic = p_waic)
}
round(rbind(poisson = waic(llik_pois), normal = waic(llik_norm)), 2)
#>         elpd_waic p_waic
#> poisson    -102.4   1.19
#> normal     -107.2   0.86

round(c(loo_pois = sum(lpd["pois", ]), loo_norm = sum(lpd["norm", ])), 2)
#>  loo_pois loo_norm 
#>   -102.41  -107.27 
```

Two things deserve a long stare. First, `elpd_waic` matches the brute-force LOO totals to about a tenth of a point: sixty refits replaced by one variance per column. Second, look at \(p_{\text{WAIC}}\): about 1 for both models, and each model has exactly **one** free parameter (the Poisson's rate; the Normal's mean, its spread handed over as known). WAIC measured each model's complexity off the matrix without being told what the model was.

[KEY INSIGHT]
The penalty is measured, never assumed. Classical criteria charge one point per raw parameter by decree; WAIC reads off how much flexibility the model actually spent on this dataset. That is why a Lesson 5 hierarchical model with eight partially pooled family means would be charged well under eight: pooling shares flexibility, and the wobble in the matrix knows it.

=== step === concept
::eyebrow The verdict
## A difference, its standard error, and where it lives

So the scoreboard reads Poisson -102.4, Normal -107.3. Is a five-point gap decisive, or the luck of these particular sixty days? The gap is a sum of sixty per-day differences, and those per-day differences vary, so the total carries an uncertainty you can estimate from their spread:

\[ d_i \;=\; \text{lpd}^{\text{pois}}_i - \text{lpd}^{\text{norm}}_i \qquad\quad \text{se} \;=\; \sqrt{\,60 \cdot \operatorname{Var}_i(d_i)\,} \]

Here \(d_i\) is the Poisson's edge on day \(i\), \(\operatorname{Var}_i\) is the variance of those sixty edges, and the factor 60 scales that per-day variance up to the variance of a sixty-day sum.

```r
d <- lpd["pois", ] - lpd["norm", ]     # the Poisson edge, day by day
round(c(elpd_diff = sum(d), se_diff = sqrt(60 * var(d))), 2)
#> elpd_diff   se_diff 
#>      4.86      1.64 

round(tapply(d, y, sum), 2)            # the edge, grouped by what the day sold
#>     0     1     2     3     4     5 
#>  4.26  4.23 -0.16 -1.96 -1.47 -0.04 
```

The gap is 4.9, nearly three of its own standard errors: on these sixty days, the Poisson's edge is very unlikely to be split luck. (Working rule of thumb: a difference under about 2 standard errors means the data cannot separate the models, and you choose on other grounds, such as simplicity.) The second line answers a better question, *where* the edge lives: the entire win sits at zero and one kits (+8.5), while the Normal actually scores better on the threes and fours (-3.4 combined). The Poisson is not better everywhere. It is better exactly where Asha's decision lives, the blank days that set the re-misting work, which is the strongest possible form of the verdict. The pointwise view is worth keeping even when the total is one-sided: it tells you what the runner-up still understands that the winner does not.

This slots a new permanent stage into Lesson 6's workflow loop:

::widget process-flow {"steps":[{"title":"Model","sub":"write the story: a likelihood for the data plus priors"},{"title":"Fit","sub":"conjugate math or MCMC turns prior plus data into a posterior"},{"title":"Check","sub":"diagnostics, then posterior predictive checks (Lesson 6)"},{"title":"Compare","sub":"LOO or WAIC ranks every model that survived the check"},{"title":"Expand","sub":"keep the best predictor, then go around again"}]}

With Stan tooling the whole lesson is a few calls. Read it now, run it when you have a local R with Stan installed:

```r-static
# The same comparison with Stan tooling (local R; Stan cannot run in a browser session)
library(brms)
fit_p <- brm(kits ~ 1, data = data.frame(kits = y), family = poisson())
fit_n <- brm(kits ~ 1, data = data.frame(kits = y), family = gaussian())
loo_compare(loo(fit_p), loo(fit_n))   # elpd_diff and se_diff, the same reading as ours
```

The `loo` package does not brute-force the refits either. It reweights the full-data draws to mimic each day's absence (Pareto-smoothed importance sampling, PSIS), and prints a *Pareto k* diagnostic that flags any day the mimicry could not handle, then refits only those days for real. Same target as this lesson, industrial plumbing.

[WARNING]
Four honest limits before you lean on the scoreboard. First, LOO and WAIC rank the models you brought: the best of a bad lot is still bad, which is why the Lesson 6 check ("is this model decent at all?") comes before the comparison ("which is better?"). Second, only compare scores computed on the same data and the same outcome; an elpd from a different month, or from log-sales instead of sales, lives on a different ruler. Third, you will meet these numbers multiplied by -2 (the deviance scale, where smaller is better); check a table's convention before reading it. Fourth, a predictive win is not truth: the Poisson predicts Asha's days best among the two, but whether kit demand truly is Poisson stays open, and if orders arrive in weekend bursts, Lesson 6's variance-to-mean statistic would catch what today's scoreboard cannot.

=== step === quiz
::eyebrow Check yourself
## Reading the scoreboard

A colleague reads the results: Poisson elpd -102.4, Normal -107.3, difference 4.9 with standard error 1.6, and p_waic near 1 for both. He announces: "Minus 102 is a terrible score, so both models are junk. And anyway, per day the gap is only 0.08, which makes no practical difference." What is the sharpest correction?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- He is right about the level: a well-fitting model should score near zero, and both are far from it ::no A total log score is a sum of sixty logs of probabilities, and every one of those is negative (the log of a number below 1). Minus 102.4 over sixty days means a typical-day probability near 0.18, entirely respectable when a day has seven or more plausible counts. The level grades nothing on its own.
- He is right that 0.08 per day is too small to matter: the models are a practical tie ::no The log ruler adds: 0.08 a day over sixty days is 4.9, which is nearly three standard errors, and it multiplies out to a factor of about 130 in plausibility over the whole record. Worse for his claim, the edge is concentrated on the blank days that drive the actual decision.
- Both claims misread the ruler: log scores of real data are always negative, so only gaps between rivals on the same data mean anything, and this gap is decisive, nearly three standard errors and concentrated exactly on the blank days the moss decision cares about ::ok Right on both counts. Levels carry no meaning alone; differences with their standard error do, and the pointwise view showed this one living precisely where Asha's question lives.
- The p_waic near 1 is the real problem: a penalty that small shows both models are underfitting and neither should ship ::no p_waic is a flexibility meter, not a quality grade. It says each model spent about one parameter's worth of flexibility, which is exactly what each has (one free parameter apiece). It cannot tell a good model from a bad one on its own.

=== step === concept
::eyebrow Go deeper
## References

Five authoritative places to take this further:

- [Vehtari, Gelman and Gabry (2017), Practical Bayesian Model Evaluation Using Leave-One-Out Cross-Validation and WAIC (Statistics and Computing)](https://arxiv.org/abs/1507.04544) - the modern playbook: PSIS-LOO, WAIC, elpd differences with standard errors, and when each fails.
- [Watanabe (2010), Asymptotic Equivalence of Bayes Cross Validation and Widely Applicable Information Criterion (JMLR)](https://jmlr.org/papers/v11/watanabe10a.html) - where WAIC was born, with the theory that makes the variance penalty work.
- [Gelman, Hwang and Vehtari (2014), Understanding Predictive Information Criteria for Bayesian Models](http://www.stat.columbia.edu/~gelman/research/published/waic_understand3.pdf) - AIC, DIC, WAIC and LOO in one guided tour, with worked examples at this lesson's scale.
- [Vehtari, Cross-Validation FAQ](https://users.aalto.fi/~ave/CV-FAQ.html) - direct answers to the questions this lesson raises next: how many folds, when LOO breaks, what Pareto k means.
- [The loo package: worked example (mc-stan.org)](https://mc-stan.org/loo/articles/loo2-example.html) - the tooling in practice: loo(), waic(), loo_compare() on a real Stan fit.

=== step === complete
## Lesson 7 complete

You removed the conflict of interest that Lesson 6 confessed to. Each of Asha's sixty days took one turn as the hidden judge, scored by the log of the probability the refit model gave to what that day actually sold, and the totals came back Poisson -102.4, Normal -107.3. Then you rebuilt the whole computation from a single full-data fit: the log-likelihood matrix, whose column averages gave the flattered lppd (about one point too generous for each model, the double use of data as a number), and whose column variances gave the WAIC charge that paid the flattery back, landing within a tenth of a point of the sixty honest refits and measuring each model's complexity (about one parameter each) without being told. The verdict: an edge of 4.9, nearly three standard errors, parked precisely on the blank days that price the moss order, while the Normal quietly kept the threes and fours. And the workflow loop gained its permanent fourth stage: model, fit, check, compare, expand.

One piece of the course remains. You can update a prior, sample a posterior, diagnose the sampler, check the model, and now choose between rivals, but every model so far had a single unknown. Next, Lesson 8: Bayesian Regression and GLMs End to End, where predictors enter, and the entire pipeline you now own runs start to finish: set priors on slopes, fit, check, compare, and report a posterior with credible intervals that a real decision can lean on.
