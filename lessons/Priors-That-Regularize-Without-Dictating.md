---
title: "Bayesian Data Analysis Lesson 7: Priors that regularize without dictating"
catalog_blurb: "Why a flat prior is not neutral, and how to pick one that is."
description: "See why a prior that looks neutral on the log-odds scale secretly favors huge effects, and how a weakly informative prior fixes a near-separated logistic fit."
keywords: "flat prior, weakly informative prior, logistic regression, quasi-complete separation, odds ratio, penalized likelihood, maximum a posteriori, ridge regression, L2 penalty, lasso, L1 penalty, Laplace prior, Bayesian prior, R"
post_type: "LESSON"
curriculum_id: "4.110.7"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "res-bayes"
course_title: "Bayesian Data Analysis"
course_lesson: "7"
course_total: "8"
course_landing: "Bayesian-Data-Analysis-Course.html"
course_next: "A-Bayesian-Workflow-You-Can-Defend"
course_prev: "Comparing-Models-by-Predictive-Accuracy"
---

=== step === cover
## Priors that regularize without dictating

Today let's understand how to pick a prior that keeps a fit honest without quietly deciding the answer for it.

A plant is piloting a new valve seal. It tests 20 valves, 10 with the old seal and 10 with the new seal, and checks every valve for a leak after a standard pressure test.

4 of the 10 old-seal valves leak. By chance, 0 of the 10 new-seal valves leak.

Here is that result as a share of valves that leaked, one bar for each seal.

::widget chart-plotter {"data":[{"x":"old seal","y":0.4},{"x":"new seal","y":0}],"geoms":["bar"],"x":"seal type","y":"share of valves that leaked"}

Zero leaks out of 10 looks like a clean win for the new seal. But a pilot this small can get lucky, and a plain logistic fit on these same 20 valves is about to show exactly what that luck can do.

=== step === concept
## Why glm() breaks on this pilot's data

Logistic regression models the probability of a leak as a function of which seal is used. In R, you fit it with `glm()`, and `family = binomial` tells it to fit a logistic curve rather than a straight line.

The data has one row per valve, 20 rows in total: `seal` records "old" or "new", and `y` records 1 for a leak and 0 for no leak.

Fit that model on the pilot data and look at its coefficients.

```r
# Fit a logistic regression of leak on seal type, using the pilot data
d <- data.frame(
  seal = factor(c(rep("old", 10), rep("new", 10)), levels = c("old", "new")),
  y    = c(1, 1, 1, 1, 0, 0, 0, 0, 0, 0,   # 4 of 10 old-seal valves leaked
           0, 0, 0, 0, 0, 0, 0, 0, 0, 0)   # 0 of 10 new-seal valves leaked
)

fit <- glm(y ~ seal, family = binomial, data = d)
summary(fit)
#>
#> Call:
#> glm(formula = y ~ seal, family = binomial, data = d)
#>
#> Coefficients:
#>              Estimate Std. Error z value Pr(>|z|)
#> (Intercept)   -0.4055     0.6455  -0.628    0.530
#> sealnew      -19.1606  3400.7176  -0.006    0.996
#>
#> (Dispersion parameter for binomial family taken to be 1)
#>
#>     Null deviance: 20.016  on 19  degrees of freedom
#> Residual deviance: 13.460  on 18  degrees of freedom
#> AIC: 17.46
#>
#> Number of Fisher Scoring iterations: 18

exp(coef(fit)["sealnew"])   # the same coefficient, converted to an odds ratio
#>      sealnew
#> 4.771508e-09
```

Logistic regression works on the log-odds scale: instead of modeling the leak probability directly, it models the log of the odds of a leak, log(p / (1 - p)), as a straight line in the predictors. `sealnew` is the coefficient of that line for a new-seal valve relative to an old-seal one, on that log-odds scale. Exponentiating a log-odds coefficient converts it back to an odds ratio, the number you would quote to say how many times more or less likely a leak is.

Here that coefficient is -19.16, and its standard error is 3,400.72, roughly 180 times the coefficient itself. A standard error that much bigger than the estimate means the data are compatible with almost any coefficient in that range, not just -19.16. As an odds ratio, exp(-19.16) comes out to about 4.8 in a billion, which says a new-seal valve is practically incapable of ever leaking.

That is not a reasonable claim from 10 valves. It happens because every one of the 10 new-seal valves came back leak-free. With no new-seal leak to pull it back, the fit can keep pushing the new-seal coefficient further toward negative infinity and the likelihood keeps climbing, because the model's fit to the old-seal rows, which do contain both leaks and non-leaks, is all that eventually stops it. Statisticians call this quasi-complete separation: one level of a predictor is perfectly separated from the outcome, even though the whole dataset is not.

No warning message appears here, but 18 Fisher Scoring iterations is itself the tell. An ordinary, well-behaved logistic fit converges in a handful of iterations, not eighteen. Eighteen means the optimization kept pushing the coefficient toward a boundary it never reached.

=== step === concept
## What a flat prior on the log-odds scale actually believes

`glm()` finds the coefficients that maximize the likelihood, the probability the model assigns to the data actually observed, over every possible coefficient value. That maximum-likelihood fit is mathematically identical to a Bayesian posterior computed under one particular prior: a flat prior, one that treats every possible coefficient value as equally likely before any data arrive.

A perfectly flat prior over an infinite line is not a valid probability distribution, so it is usually approximated with a normal prior that has a very large standard deviation, such as Normal(0, 100) on the log-odds scale. The question worth asking is what that approximation actually implies once you look at it on the odds-ratio scale instead of the log-odds scale.

```r
# How extreme is a flat prior on the log-odds scale, really?
flat_sd <- 100                                       # Normal(0, 100), the usual stand-in for "flat"

lo80 <- qnorm(0.10, mean = 0, sd = flat_sd)          # 10th percentile, log-odds scale
hi80 <- qnorm(0.90, mean = 0, sd = flat_sd)          # 90th percentile, log-odds scale
c(lo80 = lo80, hi80 = hi80)
#>       lo80       hi80
#> -128.1552  128.1552

c(or_lo80 = exp(lo80), or_hi80 = exp(hi80))          # the same interval, odds-ratio scale
#>      or_lo80      or_hi80
#> 2.202534e-56 4.540224e+55

beyond_100fold <- 2 * pnorm(log(100), mean = 0, sd = flat_sd, lower.tail = FALSE)
round(100 * beyond_100fold, 1)                        # percent of the prior beyond a 100-fold odds ratio
#> [1] 96.3
```

On the log-odds scale, 80 percent of this prior's probability sits between -128 and 128, which looks harmless until you exponentiate it. On the odds-ratio scale, that same 80 percent interval runs from about 2 times ten to the minus 56 up to 5 times ten to the 55, a range so wide it includes nearly every number you could write down. And 96.3 percent of this prior's probability sits beyond a 100-fold odds ratio in one direction or the other, meaning it treats a new seal being 100 times more or less likely to leak as the overwhelmingly probable outcome.

[KEY INSIGHT]
A prior that puts 96 percent of its probability on 100-fold effects is not expressing an absence of opinion. It is expressing a strong, specific belief that enormous effects are almost certain, which is exactly the belief that let the pilot's zero new-seal leaks push the coefficient to -19.16 with nothing to stop it.

=== step === quiz
## Quick check: why flat priors are not neutral

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- It ignores the data, so it cannot be trusted no matter how much evidence comes in. ::no
- It spreads equal probability across every log-odds value, which, once converted to the odds-ratio scale, puts almost all of that probability on effects bigger than 100-fold. ::ok Exactly. Flat on one scale is not flat on another: spreading equal mass over the whole log-odds line forces nearly all of it past any odds ratio you could name as extreme, which is a strong claim about enormous effects, not the absence of one.
- It is centered at zero, so it has no opinion about whether the new seal helps or hurts. ::no
- It treats every effect size as equally plausible, which makes it the fairest, most neutral choice available. ::no
- A flat prior does use the data, and it is centered at zero, but neither of those makes it neutral. Equal probability on every log-odds value is not equal probability on every odds ratio: stretched onto that scale, almost all of a flat prior's probability sits past a 100-fold effect, which is itself a strong, specific belief.

=== step === concept
## Choosing a weakly informative prior

A flat prior places no limit on how far the data can move the estimate, including all the way to -19.16 on 10 valves with no new-seal leak. A strongly informative prior would fix the answer almost entirely on its own, leaving the data very little room to move it. A weakly informative prior sits between the two: it rules out effect sizes nobody studying valve seals would believe, while still leaving the data free to move the estimate within a sensible range.

For a logistic-regression coefficient on the log-odds scale, a commonly used weakly informative default is Normal(0, 2.5). Run the same two numbers from the last step, but this time for that prior instead of the flat one.

```r
# The same question, now for a weakly informative prior instead of a flat one
weak_sd <- 2.5                                       # Normal(0, 2.5), a weakly informative default

lo80w <- qnorm(0.10, mean = 0, sd = weak_sd)
hi80w <- qnorm(0.90, mean = 0, sd = weak_sd)
c(lo80 = lo80w, hi80 = hi80w)
#>      lo80      hi80
#> -3.203879  3.203879

c(or_lo80 = exp(lo80w), or_hi80 = exp(hi80w))        # the same interval, odds-ratio scale
#>    or_lo80    or_hi80
#>  0.0406044 24.6278746

beyond_100fold_weak <- 2 * pnorm(log(100), mean = 0, sd = weak_sd, lower.tail = FALSE)
round(100 * beyond_100fold_weak, 1)
#> [1] 6.5
```

On the odds-ratio scale, this prior's 80 percent interval runs from about 0.04 to 24.6. It still allows a real effect, an odds ratio as small as 0.04, the odds of leaking cut to about a twenty-fifth, sits well inside that range, but only 6.5 percent of its probability sits beyond a 100-fold odds ratio, against 96.3 percent for the flat prior. A weakly informative prior is not a timid prior. It just refuses to treat an absurd effect as the expected one.

=== step === concept
## Refitting the pilot data under a weakly informative prior

A Bayesian posterior is proportional to the prior times the likelihood. Finding the single most probable point on that posterior, instead of its full shape, is called maximum a posteriori estimation, and for a normal prior it has a simple form: maximize the ordinary log-likelihood minus a penalty equal to the coefficient squared, divided by twice the prior's variance. That penalty is exactly `-log()` of the normal prior's density, with the constant part dropped since it does not depend on the coefficient.

Write that penalized log-likelihood for the pilot data and maximize it with `optim()`, using the weakly informative prior's standard deviation of 2.5 from the last step.

```r
# Fit the same coefficient under a weakly informative prior instead of a flat one
X   <- model.matrix(~ seal, data = d)   # intercept + sealnew indicator, from the pilot data d
y   <- d$y
tau <- 2.5                               # the weakly informative prior's sd, from the last step

negloglik_pen <- function(par, X, y, tau) {
  eta     <- X %*% par                              # linear predictor, on the log-odds scale
  p       <- 1 / (1 + exp(-eta))                     # predicted probability of a leak
  loglik  <- sum(y * log(p) + (1 - y) * log(1 - p))  # the ordinary logistic log-likelihood
  penalty <- sum(par[-1]^2) / (2 * tau^2)            # -log(prior density); intercept left unpenalized
  -(loglik - penalty)                                # optim() minimizes, so negate
}

fit_pen       <- optim(c(0, 0), negloglik_pen, X = X, y = y, tau = tau, method = "BFGS")
coef_new_seal <- fit_pen$par[2]
c(coefficient = round(coef_new_seal, 2), odds_ratio = round(exp(coef_new_seal), 3))
#> coefficient  odds_ratio
#>       -2.57       0.077
```

The new-seal coefficient comes back as -2.57, next to -19.16 from the unpenalized fit two steps back. As an odds ratio, 0.077 says the odds of a new-seal valve leaking are only about 7.7 percent of the odds for an old-seal valve, roughly 92 percent lower odds of leaking, which is a big effect but a finite, believable one. Nothing about the pilot's data changed between the two fits. What changed is that the prior now rules out the absurd end of the range before the data gets a vote, so the optimization has no path left to an extreme value.

[NOTE]
The flat-prior fit's standard error, 3,400.72, said -19.16 carried no real precision. The weakly informative fit does not report a standard error here because it is one point estimate, not a full posterior, but its coefficient staying put at -2.57 rather than diverging is itself the sign of a fit the data can actually support.

=== step === concept
## Ridge is a normal prior, lasso is a Laplace prior

The penalty just added, the coefficient squared divided by twice the prior variance, is not specific to this pilot. It is the general form that any normal prior contributes to a maximum a posteriori fit, and it has a name outside Bayesian statistics: an L2 penalty, which is exactly what ridge regression adds to an ordinary regression fit.

A normal prior with standard deviation \(\tau\) has density \(\phi(\beta)\) proportional to \(\exp\!\left(-\dfrac{\beta^2}{2\tau^2}\right)\). Taking \(-\log\) of that density, and dropping the part that does not depend on \(\beta\), leaves exactly the penalty used two steps back.

\[
-\log \phi(\beta) \;=\; \frac{\beta^2}{2\tau^2} \;+\; \text{a constant that does not depend on } \beta
\]

A Laplace prior, also called a double-exponential prior, has density \(f(\beta)\) proportional to \(\exp\!\left(-\dfrac{|\beta|}{b}\right)\) instead. Taking \(-\log\) of that density the same way gives a penalty proportional to the absolute value of the coefficient rather than its square.

\[
-\log f(\beta) \;=\; \frac{|\beta|}{b} \;+\; \text{a constant that does not depend on } \beta
\]

A penalty proportional to \(\beta^2\) is an L2 penalty, which is what ridge regression does. A penalty proportional to \(|\beta|\) is an L1 penalty, which is what lasso does. So the shape of the prior you choose, normal or Laplace, is not a separate decision from the kind of penalty your fit ends up with. It is the same decision, seen from two different directions: pick a prior and you have picked a penalty, and pick a penalty and you have implicitly picked a prior.

=== step === widget
## Watching a prior and the data trade off

The widget below runs a generic version of the same update: a prior with its own mean and confidence, updated by a data average computed from some number of data points, n. It is not the valve-seal pilot, but every slider on it maps onto something you already met. "Prior confidence" is the same knob that separated the flat Normal(0, 100) in an earlier step from the weakly informative Normal(0, 2.5) in another, and n plays the role the pilot's 10 valves per arm played.

::widget bayes-update {}

Drag n down toward the low end and prior confidence up toward the high end. Watch the posterior sit close to the prior rather than close to the data average. That is exactly what the pilot showed: with only 10 valves per arm, whichever prior you bring to the fit carries real weight in the answer, because there is not enough data on its own to drown it out.

=== step === widget
## The same regularizing pull, seen as shrinkage

The widget below holds eight clinics, each with its own raw average and its own sample size, some with only 2 or 3 patients, some with 40. It is a different dataset from the valve-seal pilot, but the pooling dial does the same job the prior did two steps back: pulling a small, noisy estimate toward a more plausible central value.

::widget shrinkage-pool {}

Move the pooling dial away from "no pooling" and watch the smallest clinics move the most while the largest barely move at all. "Pooling strength" here plays the same role "prior confidence" played in the last widget, and it is the same pull that moved the pilot's new-seal coefficient from -19.16 toward -2.57: a small, noisy estimate borrows strength from a wider, more plausible range instead of running off to whatever extreme the limited data alone would allow.

=== step === tryit
## Your turn: change how strongly the prior regularizes

`X`, `y`, and `negloglik_pen` are still the ones defined a few steps back, when the pilot's coefficient was refit under a weakly informative prior. Before running anything, predict: based on the prior-confidence-versus-n tradeoff the first widget showed, what should happen to the fitted coefficient if you loosen the prior, raising `tau` from 2.5 toward something far less confident?

Edit the line below so `tau` is some value other than 2.5, such as 10, then press Run and Check.

```r
# Change tau below, away from 2.5, then press Run to refit, then Check.
tau <- 2.5

fit_pen       <- optim(c(0, 0), negloglik_pen, X = X, y = y, tau = tau, method = "BFGS")
coef_new_seal <- fit_pen$par[2]
c(coefficient = round(coef_new_seal, 2), odds_ratio = round(exp(coef_new_seal), 4))
```
::check {"regex": "tau\\s*<-\\s*(?!2\\.5\\b)[0-9]+(?:\\.[0-9]+)?[\\s\\S]*optim[(][\\s\\S]*par\\[2\\]", "gate": true, "difficulty": "intermediate", "ok": "Good: as tau grows the prior's penalty weakens, and the coefficient slides away from -2.57 back toward the flat prior's -19.16, exactly what the prior-confidence-versus-n tradeoff predicted.", "no": "Edit the tau <- 2.5 line to a different number, such as 10, and keep the optim() call and the par[2] extraction below it unchanged, then press Run and Check."}
::solution
```r
# Loosen tau away from 2.5 and refit with the same penalized log-likelihood
tau <- 10

fit_pen       <- optim(c(0, 0), negloglik_pen, X = X, y = y, tau = tau, method = "BFGS")
coef_new_seal <- fit_pen$par[2]
c(coefficient = round(coef_new_seal, 2), odds_ratio = round(exp(coef_new_seal), 4))
#> coefficient  odds_ratio
#>     -4.8900      0.0075
```

At tau = 10 the coefficient moves from -2.57 to -4.89, away from the weakly informative fit and toward the flat-prior fit's -19.16. Loosen tau further, say to 100, and it keeps drifting the same direction without ever quite reaching -19.16 on a sample this small: the flat prior is the limit a weakly informative one approaches as its own confidence disappears.

=== step === quiz
## Quick check: reading the whole workflow

::quiz {"correct": 1, "gate": true, "difficulty": "advanced"}
- The weakly informative prior is an L2 penalty that pulls the coefficient back from the boundary the near-separated pilot creates, from -19.16 toward a credible -2.57: the same pull the clinics widget showed for noisy small-group means. ::ok Exactly. The near-separated pilot sends the unpenalized fit toward negative infinity; a normal prior adds exactly an L2 penalty, which is what pulls the coefficient back to a finite, usable value, the same shrinkage the clinics widget showed for noisy group means.
- The weakly informative prior disagrees with the data, so its -2.57 coefficient is less correct than the flat prior's -19.16. ::no
- A bigger pilot would fix the flat prior's answer on its own, so which prior you pick does not really matter here. ::no
- The flat prior uses no outside information, so its -19.16 coefficient is the more objective answer and should be trusted over -2.57. ::no The flat prior is not more objective: it is an implicit assumption too, just a silently extreme one. -19.16 is not a trustworthy answer, because its standard error is about 3,400, roughly 180 times the estimate itself. A bigger pilot of the same kind would not rescue it either, since it would still need a new-seal leak to break the separation, not just more valves without one.

=== step === concept
## References

- [A weakly informative default prior distribution for logistic and other regression models](https://doi.org/10.1214/08-AOAS191) - Gelman, A., Jakulin, A., Pittau, M.G., Su, Y.S. (2008), Annals of Applied Statistics, 2(4), 1360 to 1383. Proposes a Cauchy(0, 2.5) default for logistic-regression coefficients; this lesson's Normal(0, 2.5) default follows the same weakly informative reasoning with a different tail shape.
- Albert, A., Anderson, J.A. (1984). On the existence of maximum likelihood estimates in logistic regression models. Biometrika, 71(1), 1 to 10. The classic paper on when a logistic regression's maximum likelihood estimate fails to exist, including separation.
- Heinze, G., Schemper, M. (2002). A solution to the problem of separation in logistic regression. Statistics in Medicine, 21(16), 2409 to 2419. A practical penalized-likelihood fix for separation in logistic regression.
- [The Bayesian Lasso](https://doi.org/10.1198/016214508000000337) - Park, T., Casella, G. (2008), Journal of the American Statistical Association, 103(482), 681 to 686. Connects the Laplace prior to L1 (lasso) penalization.
- [The Elements of Statistical Learning](https://hastie.su.domains/ElemStatLearn/) - Hastie, T., Tibshirani, R., Friedman, J. The standard reference for ridge and lasso as penalized likelihood fits.

=== step === complete
## You can choose a prior that regularizes without dictating

A 20-valve pilot with zero new-seal leaks sent an ordinary logistic fit to a coefficient of -19.16, with a standard error of 3,400.72 that showed the number carried no real precision. That happened because an ordinary fit is a Bayesian posterior under an implicit flat prior, and a flat prior on the log-odds scale is not a neutral choice: converted to the odds-ratio scale, it puts 96.3 percent of its probability on effects bigger than 100-fold.

A weakly informative prior, Normal(0, 2.5) on the log-odds scale, put only 6.5 percent of its probability out that far instead, while still allowing a real effect. Refitting the same 20 valves under that prior, by maximizing a penalized log-likelihood instead of the plain one, brought the coefficient back to -2.57, an odds ratio of about 0.077: a big, credible effect instead of an absurd one.

That penalty had a name all along. A normal prior contributes exactly an L2 penalty, which is ridge regression. A Laplace prior contributes exactly an L1 penalty, which is lasso. Choosing a prior and choosing a penalty are the same decision seen from two directions, and a weakly informative one keeps a small, noisy sample free to move the estimate without letting it run away to an answer nobody would believe.
