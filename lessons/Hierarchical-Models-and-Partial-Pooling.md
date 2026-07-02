---
title: "Bayesian Modeling Lesson 5: Hierarchical Models and Partial Pooling"
catalog_blurb: "Why small groups should borrow strength from large ones, and how much."
description: "Hierarchical models in R: why raw group averages mislead, how partial pooling shrinks them toward the mean, and the funnel geometry behind divergences."
keywords: "hierarchical models in R, partial pooling, shrinkage, multilevel model, varying intercepts, random effects, empirical Bayes, lme4, hyperprior, non-centered parameterization, funnel, bayesian hierarchical model"
post_type: "LESSON"
curriculum_id: "6.160.5"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-bayesian"
course_title: "Bayesian Modeling"
course_lesson: "5"
course_total: "8"
course_landing: "R-Bayesian-Modeling-Course.html"
course_next: "Posterior-Predictive-Checks.html"
course_prev: "HMC-NUTS-and-MCMC-Diagnostics.html"
---

=== step === cover
::eyebrow Lesson 5 of 8
## Hierarchical Models and Partial Pooling

Lesson 4 left you with a fast engine and a pre-flight dashboard for judging any chain. This lesson points both at the most common situation in applied statistics: many groups, most of them small.

Asha's plant store had a strong second month: 121 orders, each tagged with the plant family it came from. Eight families, and wildly unequal counts: succulents brought 40 orders, carnivorous plants exactly 2. Her question sounds innocent: which family earns the front-page banner next month? The natural answer, rank the families by average order value, is about to crown a family on the strength of two receipts.

By the end of this lesson you will be able to:

- Say why a league table of raw group averages rewards small samples, and why "trust each group alone" and "lump everyone together" are both extreme prior beliefs in disguise
- Write the varying-intercept hierarchical model, name its hyperparameters and hyperpriors, and read the between-group spread as a pooling dial that the data itself turns
- Compute each group's pooling weight from the fitted variances, predict which averages move most, and verify against a known answer key that shrinkage beats the raw averages
- Recognize the funnel shape hierarchical posteriors produce, connect it to the divergences on Lesson 4's dashboard, and name the reparameterization that fixes it

**Prerequisites:** Lessons 1 to 4 of this course (the prior-times-likelihood update, the Normal-Normal posterior, credible intervals from draws, and the trust dashboard: R-hat, effective sample size, divergences), plus base R vectors, factors and `tapply`.

Below is the whole lesson in one picture. Eight groups, some large and steady, some tiny and jumpy, and a dial that blends "trust each group alone" into "one number for everyone". Drag it and watch who moves. (It is drawn as eight clinics measuring patients; swap in eight plant families and the logic is identical.)

::widget shrinkage-pool {}

=== step === concept
::eyebrow The setup
## Eight families, and a league table that lies

Here is Asha's second month, built right here so every line on this page runs in interactive R. One extra ingredient makes this lesson special: because we simulate the month, we also get the **answer key**, the true long-run average order value of each family, which real life never shows you. We write it down (`true_avg`), keep it face down, and use it at the very end to grade every method honestly.

```r
set.seed(88)
fam    <- c("succulent", "fern", "monstera", "orchid", "calathea", "bonsai", "alocasia", "carnivorous")
n_fam  <- c(40, 30, 25, 12, 5, 4, 3, 2)                 # orders per family
true_avg <- c(51, 48, 56, 61, 52, 66, 55, 57)           # the answer key: face down for now
family <- factor(rep(fam, times = n_fam), levels = fam)
value  <- round(rnorm(121, mean = rep(true_avg, times = n_fam), sd = 18))
orders <- data.frame(family, value)
table(orders$family)
#> 
#>   succulent        fern    monstera      orchid    calathea      bonsai 
#>          40          30          25          12           5           4 
#>    alocasia carnivorous 
#>           3           2 
```

Each order value scatters around its family's true average with the spread you have known since Lesson 2: about $18 from one order to the next. Now do what any spreadsheet would: average each family and sort. The league table, and underneath it, the wobble each entry carries (one standard error, $18 divided by the square root of that family's order count):

```r
raw <- tapply(orders$value, orders$family, mean)
round(sort(raw, decreasing = TRUE), 1)                  # the league table
#> carnivorous      bonsai      orchid    alocasia    monstera        fern 
#>        75.0        72.8        58.7        57.3        56.2        50.5 
#>   succulent    calathea 
#>        48.0        46.0 

round(18 / sqrt(table(orders$family)), 1)               # the wobble on each average
#> 
#>   succulent        fern    monstera      orchid    calathea      bonsai 
#>         2.8         3.3         3.6         5.2         8.0         9.0 
#>    alocasia carnivorous 
#>        10.4        12.7 
```

Carnivorous plants top the table at $75.00. That number is the average of exactly two orders, and its standard error is $12.7: the raw average of a two-order family routinely misses its own truth by $25 in either direction. Succulents, at the bottom with $48.0, carry a wobble of just $2.8, because 40 orders pin an average down hard. The table is sorted by a mixture of two things: how good each family really is, and how lucky its handful of orders happened to be. The smaller the family, the more the luck dominates, which is why the extremes of any league table of small groups are usually the tiny entries, not the great ones.

=== step === concept
::eyebrow Two wrong answers
## Trust each family alone, or lump them all together

Faced with eight noisy averages, there are two obvious moves, and each fails in its own way.

**Complete pooling** ignores family entirely: one average order value for the whole store, exactly the model you fit in Lesson 4.

```r
round(mean(orders$value), 1)     # one number for everyone
#> [1] 52.8
```

Clean, stable, and useless for the banner decision: it answers "how is the store doing?" while erasing the very differences Asha asked about. If bonsai buyers really do spend $15 more per order than fern buyers, this model will never know.

**No pooling** swings the other way: analyze each family alone, as if the other seven did not exist. That is the Lesson 2 update run eight separate times with a vague prior, and for the big families it works fine. For carnivorous plants it means staking a real inventory decision on two receipts:

```r
carn <- orders$value[orders$family == "carnivorous"]
carn                                                    # the entire evidence base
#> [1] 81 69

round(mean(carn) + c(-2, 2) * 18 / sqrt(2), 1)          # roughly a 95 percent range
#> [1]  49.5 100.5
```

The honest range for the carnivorous average runs from $49.5 to $100.5: somewhere between an ordinary fern order and a small wedding. No pooling does not remove the noise from the league table; it enshrines it.

[KEY INSIGHT]
Both shortcuts are prior beliefs wearing a disguise. No pooling asserts "the families share nothing: knowing seven of them tells me nothing about the eighth." Complete pooling asserts "the families differ by nothing." Neither is what Asha actually believes: her families surely differ, but they are all plant orders in the same store, so they surely also resemble one another. The model she needs says exactly that, in between the two extremes.

=== step === quiz
::eyebrow Check yourself
## Who gets the banner?

Asha's league table puts carnivorous plants first at $75.00 (2 orders), bonsai second at $72.75 (4 orders), and succulents near the bottom at $47.98 (40 orders). A colleague says: "The data has spoken. Banner the carnivorous plants." What is the sharpest reading?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- The colleague is right: $75.00 is the highest observed average, and the ranking should follow the data ::no The $75.00 IS the data, but it is the average of two receipts with a standard error of $12.7. A table of raw averages ranks luck as much as quality, and two orders is almost pure luck.
- Succulents should win instead, because with 40 orders their average is by far the most trustworthy ::no Trustworthy is not the same as high. The succulent average of $47.98 is indeed the most precisely measured number in the table, and what it precisely measures is a below-average family.
- The table cannot be read at face value: averages built on 2 to 5 orders swing by tens of dollars on luck alone, so the extreme entries are suspect until each family's evidence is weighed against what the other families say ::ok Right. Small-sample entries dominate the extremes of any league table, so the top slot is more likely a lucky tiny family than a truly great one. The fix, letting families share evidence, is exactly where this lesson goes next.

=== step === concept
::eyebrow The hierarchical move
## A prior you learn from the data

Think back to Lesson 2. To estimate the store-wide average order value, Asha wrote a prior by hand: normal, centered at $55, standard deviation $10, her honest belief before the data arrived. Now she needs a prior for the *carnivorous* average. What should it be?

Look at the seven other families. Their averages cluster somewhere around the store's center, a few dollars apart. That IS a prior, and nobody had to invent it: **the other families tell you what a plausible family looks like.** Writing that sentence in math gives the hierarchical model, three levels stacked on top of each other:

\[ \text{value}_i \sim N(\mu_{f[i]},\ \sigma) \]

\[ \mu_f \sim N(\mu_0,\ \tau) \]

\[ \mu_0 \sim N(55,\ 10), \qquad \tau \sim \text{Exponential}(0.1) \]

Read it from the bottom of the store to the top. Level one: order \(i\)'s dollar value scatters around its own family's true average \(\mu_{f[i]}\) (the notation \(f[i]\) just means "the family order \(i\) belongs to") with the within-family spread \(\sigma\) (sigma), the familiar $18-ish. Level two is the new move: the eight family averages \(\mu_f\) are themselves treated as draws from a population, centered at \(\mu_0\) (mu-zero, the store-wide center of the family averages) with spread \(\tau\) (tau), how much families genuinely differ from one another. Level three: \(\mu_0\) and \(\tau\) are unknown too, so they get priors of their own, Asha's $55-give-or-take-$10 belief for the center, and for \(\tau\) an exponential prior with rate 0.1 (mean $10: families likely differ by dollars, not by hundreds).

Because \(\mu_0\) and \(\tau\) are parameters of a prior, they are called **hyperparameters**, and their priors are **hyperpriors**. The names sound grand; the picture is just three floors:

::widget process-flow {"steps":[{"title":"Orders","sub":"each order value scatters around its family average with spread sigma (about 18 dollars)"},{"title":"Family averages","sub":"the eight family averages scatter around the store center mu0 with spread tau"},{"title":"The store","sub":"mu0 and tau are unknown hyperparameters, learned from all 121 orders at once"}]}

Here is why this one change settles the whole no-pooling-versus-complete-pooling argument. Look at what \(\tau\) does. If \(\tau = 0\), level two forces every family average to equal \(\mu_0\) exactly: complete pooling. If \(\tau\) is enormous, level two says families can be anything, each on its own: no pooling. The two "obvious" answers from the last step are just the two ends of one dial, and \(\tau\) is the dial. The hierarchical model does not make you choose a setting. It puts a posterior on \(\tau\) and lets the 121 orders turn the dial themselves.

[KEY INSIGHT]
A hierarchical model is the Lesson 2 update run once per family, with one twist: the prior each family faces is no longer hand-written, it is estimated from the other families. Small families, whose own data says little, lean on that learned prior heavily. Large families barely need it. That asymmetry is partial pooling, and you will now see exactly how much each family leans.

=== step === widget
::eyebrow Feel it
## Shrinkage: pulled toward the middle, but not equally

Fix \(\mu_0\), \(\tau\) and \(\sigma\) at known values for a moment. Then each family's update is exactly the Normal-Normal formula from Lesson 2, and its posterior mean lands at a weighted blend of the family's own raw average and the store center:

\[ \hat{\mu}_f = \lambda_f\, \bar{y}_f + (1 - \lambda_f)\, \mu_0, \qquad \lambda_f = \frac{\tau^2}{\tau^2 + \sigma^2 / n_f} \]

Every symbol in words: \(\bar{y}_f\) (y-bar) is family \(f\)'s raw average from the league table; \(n_f\) is its number of orders; \(\hat{\mu}_f\) (mu-hat) is the model's estimate for that family; and \(\lambda_f\) (lambda) is the **pooling weight**, a number between 0 and 1 saying how much of its own raw average the family keeps. The formula is a contest of precisions. The family's own evidence has variance \(\sigma^2 / n_f\) (the standard-error wobble from the league table, squared), and the learned prior has variance \(\tau^2\). Whichever is sharper wins the weight: many orders make \(\sigma^2/n_f\) tiny and push \(\lambda_f\) toward 1 (keep your own average), while a two-order family has a huge \(\sigma^2/n_f\) and gets pushed toward 0 (borrow from the store).

Drag the dial and watch the geometry of that formula: every group slides toward the grand mean, but the tiny, jumpy groups travel furthest while the big ones barely move. The slider is yours to set here; in the model, the posterior for \(\tau\) sets it, one weight per group, automatically. The code under the widget fits this exact behavior with one line of R.

::widget shrinkage-pool {}

[NOTE]
"Shrinkage" is the standard name for this pull toward the center, and it can sound like something being lost. Watch what it does to accuracy in the next step before deciding how to feel about it.

=== step === concept
::eyebrow Grade it
## Fit the model, then flip the answer key

Fitting the full three-level Bayesian model needs an MCMC engine, and Stan does not run in a browser session; you will meet that fit (read-only) in the next step. But there is a faithful runnable stand-in that statisticians reach for daily: `lmer` from the lme4 package. It finds the single best values of \(\mu_0\), \(\tau\) and \(\sigma\), then computes exactly the blend formula you just learned. One line, where `(1 | family)` reads "give each family its own intercept, drawn from a shared distribution":

```r
library(lme4)
fit <- lmer(value ~ 1 + (1 | family), data = orders)
vc   <- as.data.frame(VarCorr(fit))
tau2 <- vc$vcov[vc$grp == "family"]      # tau squared: between-family variance
sig2 <- vc$vcov[vc$grp == "Residual"]    # sigma squared: within-family variance
mu0  <- fixef(fit)[[1]]                  # the estimated store center
round(c(mu0 = mu0, tau = sqrt(tau2), sigma = sqrt(sig2)), 1)
#>   mu0   tau sigma 
#>  54.8   5.1  17.6 
```

Read the dial setting the data chose. The store center sits at $54.8 (a hair above the raw all-orders mean of $52.8, because it averages *families*, not orders, so the 40 succulent receipts no longer dominate). Orders scatter $17.6 within a family, right on the $18 you have carried since Lesson 2. And \(\tau\) = 5.1: the families genuinely differ, but only by about five dollars, far less than the league table's $29 spread pretended. Now compute the blend by hand, one weight per family, and set it beside what `lmer` reports:

```r
lam    <- tau2 / (tau2 + sig2 / n_fam)              # one pooling weight per family
blend  <- lam * raw + (1 - lam) * mu0               # the hand-built estimates
shrunk <- setNames(coef(fit)$family[, 1], rownames(coef(fit)$family))
round(rbind(raw = raw, weight = lam, blend = blend, lmer = shrunk), 2)
#>        succulent  fern monstera orchid calathea bonsai alocasia carnivorous
#> raw        47.98 50.47    56.24  58.67    46.00  72.75    57.33       75.00
#> weight      0.77  0.72     0.68   0.50     0.30   0.25     0.20        0.14
#> blend      49.53 51.69    55.76  56.72    52.18  59.28    55.28       57.67
#> lmer       49.53 51.69    55.76  56.72    52.18  59.28    55.28       57.67
```

The last two rows match to the cent: the software's "mixed model" is the blend formula, applied with the fitted variances. And the weight row is the story of this lesson in eight numbers. Succulents keep 77 percent of their own average, because 40 orders speak clearly. Carnivorous plants keep 14 percent: six-sevenths of their estimate now comes from the other families. Sort the new estimates and the league table is transformed:

```r
round(sort(shrunk, decreasing = TRUE), 1)           # the pooled league table
#>      bonsai carnivorous      orchid    monstera    alocasia    calathea 
#>        59.3        57.7        56.7        55.8        55.3        52.2 
#>        fern   succulent 
#>        51.7        49.5 
```

Carnivorous plants fall from $75.0 to $57.7, demoted from champion to runner-up, and bonsai takes the top slot: four orders is still thin, but it is twice the evidence. So which table should Asha trust? This is the moment the simulation pays off: flip the answer key and grade both tables against the truth, using the root-mean-square error (the typical distance between an estimate and its family's true average):

```r
rmse <- function(est) sqrt(mean((est - true_avg)^2))
round(c(raw = rmse(raw), shrunk = rmse(shrunk)), 1)
#>    raw shrunk 
#>    7.3    3.2 
```

The raw league table misses the truth by $7.3 per family on average; the pooled table misses by $3.2, **less than half the error, from the same 121 orders**. Check the answer key family by family and the demotion was justice: the true carnivorous average is $57, and shrinkage carried its estimate from $75.0 to within 70 cents of it. The true best family really is bonsai ($66). No new data arrived. The only thing that changed was letting the families see one another.

[KEY INSIGHT]
Shrinkage is not a cautious compromise that blurs the answer; on average it moves every estimate closer to its truth. This is one of the most celebrated results in statistics (Stein's paradox: the raw group averages are provably beatable whenever there are three or more groups), and partial pooling is how you collect the winnings in practice.

=== step === tryit
::eyebrow Your turn
## Compute a pooling weight

Asha's cousin runs the garden-tools side of the site and wants the same analysis. Before fitting anything, she asks the question this lesson taught you to answer: "with the variances you already have, how much of its own average would a two-order group keep?"

Use `tau2` and `sig2`, still in your session from the fit, and the weight formula \(\lambda = \tau^2 / (\tau^2 + \sigma^2 / n)\) with \(n = 2\). Fill in the blank:

```r
# the pooling weight for a family with just 2 orders
lam_carn <- ____
round(lam_carn, 2)
```
::check {"regex":"tau2\\s*/\\s*\\(\\s*(tau2\\s*\\+\\s*sig2\\s*/\\s*2|sig2\\s*/\\s*2\\s*\\+\\s*tau2)\\s*\\)","gate":true,"difficulty":"intermediate","ok":"0.14: a two-order family keeps 14 percent of its own average and borrows the remaining 86 percent from everyone else. Compare the fitted weights: bonsai (4 orders) keeps 25 percent, succulents (40 orders) keep 77 percent. The weight tracks the evidence, order by order.","no":"Build it straight from the formula: tau squared over (tau squared plus sigma squared divided by n), with n = 2. In code: lam_carn <- tau2 / (tau2 + sig2 / 2)."}
::solution
```r
lam_carn <- tau2 / (tau2 + sig2 / 2)
round(lam_carn, 2)
#> [1] 0.14
```

=== step === concept
::eyebrow The Bayesian version
## Hyperprior uncertainty, and the funnel

`lmer` gave the right blend, but it made one quiet simplification: it committed to single best values, \(\tau\) = 5.1 and \(\mu_0\) = 54.8, and then acted as if they were known facts. But \(\tau\) was learned from just eight families. Eight observations of anything leave real uncertainty, and every family's interval should feel it. The full Bayesian model, the three floors from earlier with their hyperpriors, propagates that honestly. In brms notation (this needs a local R with Stan installed, so read it rather than run it):

```r-static
# The full Bayesian hierarchy: priors on mu0 and tau, fit with NUTS.
library(brms)

fit_bayes <- brm(
  value ~ 1 + (1 | family), data = orders,
  prior = c(prior(normal(55, 10), class = Intercept),   # the hyperprior on mu0
            prior(exponential(0.1), class = sd)),       # the hyperprior on tau
  chains = 4, iter = 2000, seed = 88
)
summary(fit_bayes)
# Same blend logic, but now tau gets a full posterior instead of one number,
# every family interval widens to carry that uncertainty, and the Lesson 4
# dashboard (Rhat, ESS, divergences) is printed for every quantity.
```

Run a model like this on few, small groups and something new appears on that dashboard: **divergent transitions**, the check-engine light from Lesson 4. They are not random bad luck. They come from the specific shape of a hierarchical posterior, and you can draw that shape right now. Consider the joint plausibility of \(\tau\) (on the log scale, since it must be positive) and one family's effect, its distance \(\mu_f - \mu_0\) from the center. The model says that effect is \(N(0, \tau)\), so when \(\tau\) is large the effect roams freely, and when \(\tau\) is small the effect is pinned within a whisker of zero:

```r
set.seed(3)
log_tau <- rnorm(4000, 0, 1.5)        # plausible values of log(tau)
z       <- rnorm(4000)                # a standardized effect: N(0, 1), no tau in it
effect  <- exp(log_tau) * z           # the actual family effect, N(0, tau)

round(c(spread_bottom = sd(effect[log_tau < -1]),
        spread_top    = sd(effect[log_tau > 1])), 1)
#> spread_bottom    spread_top 
#>           0.2          17.5 

par(mfrow = c(1, 2))
plot(effect, log_tau, pch = 16, cex = 0.3, col = adjustcolor("navy", 0.3),
     xlim = c(-25, 25), xlab = "family effect", ylab = "log(tau)",
     main = "Centered: the funnel")
plot(z, log_tau, pch = 16, cex = 0.3, col = adjustcolor("navy", 0.3),
     xlab = "z (standardized effect)", ylab = "log(tau)",
     main = "Non-centered: a round cloud")
par(mfrow = c(1, 1))
```

The left picture is the famous **funnel**. At the top (large \(\tau\)) the effects spread across $17.5; at the bottom (small \(\tau\)) they are squeezed into a neck about 90 times narrower. Now remember how Lesson 4's engine moves: a glide with a step size tuned during warmup. One step size cannot serve both regions. Tune it for the wide mouth and the glide overshoots the neck's walls, the leapfrog's energy error explodes, and the engine reports divergences, clustered exactly where \(\tau\) is small. Tune it for the neck and the chain crawls everywhere else. This is why hierarchical models are where most analysts meet their first divergence warning, and the promise Lesson 4 made: now you know what the light is pointing at.

The right picture is the same 4,000 draws in smarter coordinates, and it is the standard fix. Instead of sampling each family effect directly (the **centered** form), sample a standardized effect \(z_f \sim N(0, 1)\) and reconstruct what you need:

\[ \mu_f = \mu_0 + \tau\, z_f \]

This is the **non-centered parameterization**. Nothing about the model changed, only its coordinates: the sampler explores the round, friendly \((z, \log\tau)\) cloud on the right, where one step size works everywhere, and \(\mu_f\) is computed afterwards by multiplication.

[WARNING]
The divergence playbook for hierarchical models, in order: reparameterize non-centered first (brms and rstanarm already do this for you; in hand-written Stan it is one line); raise the engine's caution setting second (adapt_delta, smaller steps, slower). "Just run more iterations" is never on the list: Lesson 4 taught you that divergence is geometry, and geometry does not average out.

=== step === quiz
::eyebrow Check yourself
## 38 divergent transitions

Asha's analyst fits the full Bayesian hierarchy on the eight families. The Lesson 4 dashboard reads: R-hat 1.00 on every parameter, effective sample sizes in the thousands, 38 divergent transitions. What is the right move?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- Nothing: R-hat and effective sample size both pass, so the divergences are cosmetic ::no The passing checks say the chains agree globally. Divergences say the engine could not follow the geometry near the funnel's neck, so the draws where tau is small are undersampled and suspect. A dashboard passes only when every gauge passes, and divergences must be exactly zero.
- Quadruple the iterations: with enough draws the problem washes out ::no Divergence is geometry, not sample size. The step size that fails in the neck at 2,000 iterations fails there at 200,000; the biased region stays biased. More draws just restate the wrong answer with more confidence.
- Switch the family effects to the non-centered parameterization (or raise adapt_delta so the steps shrink), then refit and require zero divergences ::ok Right, and in that order: non-centering reshapes the funnel into the round cloud where one step size works everywhere, which cures the cause. Raising adapt_delta merely tiptoes, and more iterations never help at all.
- Drop the hierarchy: model each family separately so tau and its funnel disappear ::no That abandons partial pooling, the very thing that halved the error on the league table, to spare the sampler an inconvenience. Fix the coordinates, not the model.

=== step === concept
::eyebrow Go deeper
## References

Five authoritative places to take this further:

- [Efron and Morris (1977), Stein's Paradox in Statistics (Scientific American)](https://www.jstor.org/stable/24954030) - the classic, gloriously readable account of why shrunk estimates beat raw group averages, told through baseball batting averages.
- [Gelman (2006), Prior distributions for variance parameters in hierarchical models (Bayesian Analysis)](https://projecteuclid.org/journals/bayesian-analysis/volume-1/issue-3/Prior-distributions-for-variance-parameters-in-hierarchical-models-comment-on/10.1214/06-BA117A.full) - how to choose the hyperprior on tau, and why the choice matters most exactly when groups are few.
- [Bates, Machler, Bolker and Walker (2015), Fitting Linear Mixed-Effects Models Using lme4 (JSS 67:1)](https://doi.org/10.18637/jss.v067.i01) - the paper behind lmer, the runnable stand-in you fit and then reproduced by hand.
- [Betancourt and Girolami (2015), Hamiltonian Monte Carlo for Hierarchical Models](https://arxiv.org/abs/1312.0906) - the definitive treatment of the funnel geometry and why divergences concentrate in the neck.
- [Stan User's Guide: Reparameterization](https://mc-stan.org/docs/stan-users-guide/reparameterization.html) - the working recipe for the non-centered fix, with the exact code transformation.

=== step === complete
## Lesson 5 complete

You caught a league table lying. Eight raw family averages ranked luck as much as quality, crowning a two-order family at $75 while the honest range on that number ran from $49.5 to $100.5. You saw that the two obvious fixes are extreme priors in disguise: no pooling ("families share nothing") and complete pooling ("families differ by nothing"). The hierarchical model replaced both with three stacked levels, orders around family averages, family averages around a store center, and hyperparameters \(\mu_0\) and \(\tau\) learned from all 121 orders, turning \(\tau\) into a pooling dial the data sets itself. The posterior blended each family by its own weight, \(\lambda_f = \tau^2/(\tau^2 + \sigma^2/n_f)\): succulents kept 77 percent of their average, carnivorous plants 14 percent. And when you flipped the answer key, shrinkage had cut the typical error from $7.3 to $3.2 while promoting the genuinely best family, bonsai, to the top. Then you looked at the shape that makes these models hard to sample: the funnel, a mouth $17.5 wide over a neck 90 times narrower, the true source of Lesson 4's divergence warnings, and you learned the fix, sampling standardized effects and reconstructing \(\mu_f = \mu_0 + \tau z_f\).

One thread is still loose. Every model in this course has now produced a posterior, and you can trust the *sampling*. But should you trust the *model*? Next, Lesson 6: Posterior Predictive Checks, where the fitted model is made to simulate months of its own, and you compare them against the month Asha actually had. A model that cannot re-create its own data has no business forecasting anyone's future.
