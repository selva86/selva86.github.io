---
title: "Advanced Regression Lesson 5: Lasso and Elastic Net"
catalog_blurb: "Shrink weak coefficients to zero so the model selects the predictors that matter."
description: "Lasso adds an L1 penalty that drives weak coefficients to exactly zero, selecting features for free. Elastic net blends it with ridge to handle correlated predictors, in R with glmnet."
keywords: "lasso regression, elastic net, L1 penalty, feature selection, glmnet, regularization, alpha, correlated predictors, grouping effect, sparse model, cross-validation, R"
post_type: "LESSON"
curriculum_id: "6.130.5"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-reg-glm-expert"
course_title: "Advanced Regression and GLMs"
course_lesson: "5"
course_total: "13"
course_landing: "R-Advanced-Regression-Course.html"
course_next: "GAMs-Splines-and-Smooths.html"
course_prev: "Ridge-Regression-and-Shrinkage.html"
---

=== step === cover
::eyebrow Lesson 5 of 13
## Lasso and Elastic Net

Last lesson, ridge regression rescued Maya's marketing model. Her six ad channels moved almost in lockstep, and ordinary least squares had responded with nonsense: coefficients that swapped, went negative, and lurched every refit. Ridge steadied all of it by shrinking the coefficients toward zero. But it left one question hanging: ridge keeps *every* predictor. It never tells Maya WHICH channels actually matter.

That question has grown teeth. Maya's weekly export now carries twenty columns, not six: the six ad channels plus fourteen "vanity metrics" her dashboard spits out (newsletter opens, app pings, and a dozen more) that she suspects are pure noise. She does not want twenty tamed coefficients. She wants a short list: the handful of columns worth acting on.

Lasso regression gives her exactly that. With one change to the penalty, it drives useless coefficients to *exactly zero*, so it does feature selection for free. Elastic net then blends lasso with ridge to handle the correlated channels gracefully. Drag the penalty slider below to watch coefficients shrink and, on the Lasso setting, drop out one by one.

By the end of this lesson you will be able to:

- Explain why ridge can never hand you a shortlist of predictors, and why lasso can
- Define the lasso (L1) penalty and say, through soft-thresholding, why it produces *exactly* zero where ridge only shrinks
- Fit lasso in R, choose the penalty by cross-validation, and read which predictors survived
- Explain elastic net, the `alpha` mixing dial, and the grouping effect that keeps correlated predictors together
- Choose between ridge, lasso, and elastic net for the problem in front of you

**Prerequisites:** [Ridge Regression and Shrinkage](Ridge-Regression-and-Shrinkage.html) (Lesson 4) is the direct prequel, so you know the L2 penalty, `glmnet`'s `alpha` argument, and choosing the penalty with `cv.glmnet`. You can read a [linear regression](Linear-Regression.html) (a coefficient is a predictor's effect; a residual is actual minus predicted), and you have met the [bias-variance tradeoff](The-Bias-Variance-Tradeoff.html).

::widget coef-path {}

=== step === concept
::eyebrow The setup
## Twenty columns, and most move together

Let us rebuild Maya's data, now wider. Sixty weeks; the same six ad channels that all scale from one weekly budget (so they rise and fall together); plus fourteen dashboard "vanity metrics" that are pure random noise, unrelated to signups. As before, signups truly depend on just two channels, search and social. (We build the data right here, since each lesson runs in a fresh R session.)

```r
set.seed(1)
n <- 60
budget  <- rnorm(n)                                    # the one weekly budget dial
spend   <- sapply(1:6, function(j) budget + rnorm(n, sd = 0.15))
colnames(spend) <- c("search", "social", "display", "video", "email", "affiliate")
metrics <- matrix(rnorm(n * 14), n, 14)                # 14 dashboard vanity metrics: pure noise
colnames(metrics) <- paste0("metric", 1:14)
signups <- 40 + 5 * spend[, "search"] + 3 * spend[, "social"] + rnorm(n, sd = 2)
ads <- data.frame(signups, spend, metrics)
dim(ads)                                               # 60 weeks; signups + 20 predictors
#> [1] 60 21
```

Two things about this table matter for everything below. First, most of the twenty predictors are junk: the fourteen metrics have no effect on signups at all, and even among the ad channels only search and social carry real weight. A good method should hand Maya a *short list*. Second, the six ad channels are almost the same column, each pair correlated around 0.97, the near-solid green block in the heatmap. That tangle, called **multicollinearity**, is what wrecked ordinary least squares in Lesson 4, and it will trip up lasso too, in a subtler way we will fix at the end.

::widget correlation-heatmap {"vars":["search","social","display","video","email","affiliate"],"matrix":[[1,0.97,0.97,0.98,0.98,0.97],[0.97,1,0.97,0.97,0.97,0.97],[0.97,0.97,1,0.96,0.97,0.97],[0.98,0.97,0.96,1,0.98,0.97],[0.98,0.97,0.97,0.98,1,0.97],[0.97,0.97,0.97,0.97,0.97,1]]}

=== step === concept
::eyebrow The gap
## Ridge shrinks everything but drops nothing

Start with the tool you already have. Fit ridge on all twenty predictors, let cross-validation pick the penalty, and count how many coefficients it leaves standing.

```r
library(glmnet)
X <- as.matrix(ads[, -1])   # the 20 predictors: 6 ad channels + 14 vanity metrics
y <- ads$signups
set.seed(1)
ridge <- cv.glmnet(X, y, alpha = 0)                    # ridge; penalty chosen by cross-validation
sum(coef(ridge, s = "lambda.min")[-1] != 0)            # how many predictors survive?
#> [1] 20
```

Twenty out of twenty. Ridge did its job, it shrank every coefficient toward zero and steadied the correlated channels, but it kept all fourteen noise metrics in the model too, each with a small non-zero coefficient. That is baked into how ridge works: its L2 penalty squeezes coefficients but never sets one exactly to zero. If Maya wants a shortlist, ridge structurally cannot give her one. We need a penalty that can reach zero and stay there.

=== step === concept
::eyebrow The idea
## Lasso: price the size, not the square

The word **lasso** stands for "least absolute shrinkage and selection operator," and the whole trick lives in one swapped word: *absolute*. Recall the two objectives from last lesson. Ordinary least squares minimizes only the squared error, and ridge adds a penalty on the *squared* size of the coefficients:

\[ \hat{\beta}^{\text{ridge}} = \arg\min_{\beta} \; \sum_{i=1}^{n} \bigl(y_i - x_i^\top \beta\bigr)^2 \;+\; \lambda \sum_{j=1}^{p} \beta_j^2. \]

Lasso keeps the fit term identical but changes the penalty to the *absolute* size of the coefficients:

\[ \hat{\beta}^{\text{lasso}} = \arg\min_{\beta} \; \underbrace{\sum_{i=1}^{n} \bigl(y_i - x_i^\top \beta\bigr)^2}_{\text{fit the data}} \;+\; \underbrace{\lambda \sum_{j=1}^{p} \lvert \beta_j \rvert}_{\text{keep coefficients small}}. \]

Read the new term carefully. \(\beta_j\) is the coefficient on predictor \(j\), \(p\) is the number of predictors, and \(\lambda\) (lambda) is the penalty strength you choose, exactly as in ridge. The only change is \(\lvert \beta_j \rvert\), the **absolute value**, in place of \(\beta_j^2\). The sum \(\sum_j \lvert \beta_j \rvert\) is called the **L1 penalty** (ridge's \(\sum_j \beta_j^2\) is the L2 penalty). That one substitution, squared to absolute, is the entire difference between the two methods, and it is enough to turn shrinkage into selection. The next step shows why.

=== step === concept
::eyebrow Why it works
## Why lasso lands on exactly zero

Here is the mechanism, made concrete. When predictors are on a common scale, both penalties can be understood one coefficient at a time. Ridge divides each least-squares coefficient by a factor bigger than one, a smooth scale-down. Lasso does something different: it subtracts \(\lambda\) from the *magnitude* of each coefficient and, crucially, refuses to let it cross zero. That operation is called **soft-thresholding**. Let us write it and run it on real numbers rather than take it on faith.

```r
soft <- function(b, lambda) sign(b) * max(0, abs(b) - lambda)
soft(2.4, 1.0)     # a strong coefficient of 2.4, penalty 1.0: shrunk to 1.4, survives
#> [1] 1.4
soft(0.15, 1.0)    # a weak coefficient of 0.15: smaller than the penalty, so it is clamped to 0
#> [1] 0
```

Read what happened. The strong coefficient, 2.4, lost exactly \(\lambda = 1.0\) and lived on at 1.4. The weak one, 0.15, was smaller than the penalty, so subtracting 1.0 would send it negative; the `max(0, ...)` clamps it, and it lands on **exactly zero**. Any coefficient whose pull on the data is weaker than \(\lambda\) is knocked clean out. Now watch ridge on that same weak coefficient:

```r
ridge_shrink <- function(b, lambda) b / (1 + lambda)
ridge_shrink(0.15, 1.0)   # ridge only scales down; it never subtracts past zero
#> [1] 0.075
```

Ridge halves it to 0.075, still non-zero, still in the model. Dividing can shrink a number forever without ever reaching zero; *subtracting-and-clamping* reaches zero the moment the coefficient is small enough. (Geometrically this is the famous "diamond" of the L1 constraint: its sharp corners sit exactly on the axes, where a coefficient is zero, so the fit tends to land on a corner. Soft-thresholding is that same fact in algebra.) This is the whole reason lasso selects and ridge does not.

=== step === widget
::eyebrow Feel it
## Watch the coefficients drop out one by one

This is the payoff, made draggable. Six coefficients start at their least-squares values on the left, where the penalty is weak, and get squeezed as \(\lambda\) grows to the right. Keep the toggle on **Lasso (L1)** and drag the penalty up: watch the weakest coefficients hit zero and drop out one at a time, the selection happening in front of you. Then flip to **Ridge (L2)** and drag again: every line slides toward zero but not one of them ever arrives.

::widget coef-path {}

=== step === concept
::eyebrow In R
## Fit it and read the shortlist

Now the real thing, on Maya's twenty columns. Fit lasso by setting `alpha = 1` (the argument you met for ridge, where `alpha = 0`), let `cv.glmnet` choose the penalty, and count survivors.

```r
set.seed(1)
lasso <- cv.glmnet(X, y, alpha = 1)                    # alpha = 1 is lasso
sum(coef(lasso, s = "lambda.min")[-1] != 0)            # predictors lasso keeps
#> [1] 3
```

Three, down from twenty. Lasso threw out seventeen predictors by setting their coefficients to exactly zero, no manual pruning, no p-value hunting. Which three survived?

```r
co <- coef(lasso, s = "lambda.min")
round(co[co[, 1] != 0, , drop = FALSE], 2)             # the survivors and their coefficients
#> 4 x 1 sparse Matrix of class "dgCMatrix"
#>             lambda.min
#> (Intercept)      40.71
#> search            4.99
#> social            1.08
#> video            0.69
```

Look at what lasso got right and what it fumbled. It zeroed all fourteen vanity metrics, every single one, exactly as it should: they were noise and lasso dropped them. It found both true drivers, search and social. But it also kept `video`, a channel with *no* real effect on signups, while zeroing display, email, and affiliate. Video is nothing special; it is just one of six near-identical columns, and lasso, forced to pick among them, happened to grab it. That is not a bug in your code; it is lasso meeting six near-identical columns and having to choose. Hold that thought, it is the reason elastic net exists.

[KEY INSIGHT]
Lasso does regression and feature selection in a single fit. The L1 penalty shrinks coefficients like ridge AND drives the weak ones to exactly zero, so the model that comes out already lists only the predictors worth keeping. Ridge stabilizes; lasso stabilizes *and* selects.

=== step === quiz
::eyebrow Check yourself
## What does turning lambda up do?

You keep pushing the penalty \(\lambda\) higher and higher in a **lasso** fit. What happens to the coefficients?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- They all shrink smoothly toward zero, but every predictor stays in the model ::no That is ridge (the L2 penalty), which never reaches exactly zero. Lasso's L1 penalty subtracts and clamps, so coefficients hit zero and drop out.
- One by one they snap to exactly zero and drop out, until only the strongest predictors survive ::ok Right. Soft-thresholding knocks out any coefficient weaker than lambda, so raising lambda produces an ever-shorter list. Push it high enough and even the strong ones go.
- Nothing changes until lambda crosses a single threshold, then all the coefficients vanish at once ::no They do not all leave together. Each coefficient drops out at its own value of lambda (weak ones first), which is exactly why the coefficient path is a staircase, not a cliff.

=== step === concept
::eyebrow The catch
## Lasso's blind spot: correlated predictors

Lasso's shortlist was a little arbitrary, and we can prove it. The problem is those six near-identical ad channels: they carry almost the same information, so lasso has little reason to prefer one over another and tends to keep just a few and zero the rest, roughly at random. To see the instability, refit lasso on sixty bootstrap resamples of the weeks and record, for each channel, the fraction of resamples in which it survived.

```r
lam <- lasso$lambda.min
channel_freq <- function(a) {
  set.seed(7)
  hits <- replicate(60, {
    i  <- sample(nrow(ads), replace = TRUE)                          # a bootstrap resample of the 60 weeks
    cf <- coef(glmnet(X[i, ], y[i], alpha = a, lambda = lam))[2:7]   # coefficients of the 6 ad channels
    as.integer(cf != 0)                                              # 1 if the channel survived, else 0
  })
  round(rowMeans(hits), 2)                                           # survival rate across resamples
}
setNames(channel_freq(1), colnames(spend))                          # lasso: alpha = 1
#>    search    social   display     video     email affiliate
#>      1.00      0.73      0.12      0.60      0.22      0.20
```

Read the row. Search survives every time (1.00), but the other five channels flicker: display shows up 12% of the time, video 60%, email 22%, affiliate 20%. Refit on a slightly different stretch of weeks and lasso keeps a *different* subset of the correlated group. For prediction that is often fine, but if Maya reports "the model selected video," that finding would not survive a re-run. Lasso selects, but among correlated predictors it selects *unstably*.

=== step === concept
::eyebrow The fix
## Elastic net: shrink AND select

Elastic net resolves the standoff by refusing to choose between the two penalties: it uses **both at once**. It adds the L1 penalty (which selects) and the L2 penalty (which shares credit smoothly across correlated predictors), mixed by a dial \(\alpha\) between 0 and 1:

\[ \hat{\beta}^{\text{enet}} = \arg\min_{\beta} \; \sum_{i=1}^{n}\bigl(y_i - x_i^\top\beta\bigr)^2 \;+\; \lambda \Bigl[\, \underbrace{\alpha \sum_{j=1}^{p} \lvert\beta_j\rvert}_{\text{L1: selects}} \;+\; \underbrace{(1-\alpha)\sum_{j=1}^{p}\beta_j^2}_{\text{L2: groups}} \,\Bigr]. \]

Here \(\alpha\) (alpha) is the mixing weight: \(\alpha = 1\) is pure lasso, \(\alpha = 0\) is pure ridge, and anything in between blends them, the exact `alpha` argument you have been passing to `glmnet` all along. The L2 half adds the **grouping effect**: correlated predictors are pulled toward *one shared coefficient*, so they tend to enter or leave the model together rather than one arbitrarily beating out the rest. The L1 half still zeroes the genuinely useless predictors. Fit it at a balanced `alpha = 0.5`:

```r
set.seed(1)
enet <- cv.glmnet(X, y, alpha = 0.5)                   # alpha = 0.5: half lasso, half ridge
sum(coef(enet, s = "lambda.min")[-1] != 0)             # predictors elastic net keeps
#> [1] 6
```

Six, not three and not twenty. Elastic net still zeroed all fourteen vanity metrics (the L1 part doing its selection job), but it kept the whole correlated block of ad channels together (the L2 part doing its grouping job).

=== step === concept
::eyebrow The proof
## The grouping effect, measured

Two comparisons make the difference concrete. First, run the same resampling stability test on elastic net that exposed lasso's flicker:

```r
setNames(channel_freq(0.5), colnames(spend))           # elastic net, on the same 60 resamples
#>    search    social   display     video     email affiliate
#>      1.00      0.98      0.62      1.00      0.75      0.87
```

Every channel now survives far more consistently: social climbed from 0.73 to 0.98, affiliate from 0.20 to 0.87. The selected set barely changes from one resample to the next, because the grouping effect keeps the correlated channels moving as a bloc. Second, look at how each method spread the coefficients across the six channels:

```r
data.frame(
  channel     = colnames(spend),
  lasso       = round(coef(lasso, s = "lambda.min")[2:7], 2),
  elastic_net = round(coef(enet,  s = "lambda.min")[2:7], 2)
)
#>     channel lasso elastic_net
#> 1    search  4.99        2.45
#> 2    social  1.08        1.26
#> 3   display  0.00        0.45
#> 4     video  0.69        1.34
#> 5     email  0.00        0.49
#> 6 affiliate  0.00        0.66
```

Lasso concentrated everything on two channels and zeroed three (a spiky, all-or-nothing split). Elastic net spread the weight more evenly across all six, no zeros inside the correlated group. That is the trade in a nutshell: elastic net is a little less sparse than lasso, but its selections are far steadier when predictors travel together.

[NOTE]
Elastic net has two knobs, not one: \(\lambda\) (how much to penalize) and \(\alpha\) (the lasso-ridge mix). In practice you cross-validate \(\lambda\) with `cv.glmnet` at each of a few \(\alpha\) values (say 0.25, 0.5, 0.75) and keep the pair with the lowest error. `glmnet` standardizes the predictors first by default, which the penalty requires, and reports coefficients back on the original scale.

=== step === tryit
::eyebrow Your turn
## Dial in an elastic net

Fit an elastic net on Maya's data. The `alpha` argument sets the mix: `1` is lasso, `0` is ridge. Fill in any value *strictly between* 0 and 1 to get a genuine blend, then check it.

```r
enet2 <- glmnet(X, y, alpha = ____)   # a blend of lasso and ridge: pick a value between 0 and 1
coef(enet2, s = 1)[2:7]               # the six channel coefficients at penalty lambda = 1
```
::check {"regex":"alpha\\s*=\\s*0?\\.[0-9]*[1-9]","gate":true,"difficulty":"intermediate","ok":"That is an elastic net. Notice all six channels keep a non-zero coefficient: the L2 part held the correlated group together.","no":"For a blend, alpha must be strictly between 0 and 1 (for example 0.5). alpha = 1 is pure lasso and alpha = 0 is pure ridge."}
::solution
```r
enet2 <- glmnet(X, y, alpha = 0.5)                          # any 0 < alpha < 1 blends the two; 0.5 is balanced
setNames(round(coef(enet2, s = 1)[2:7], 2), colnames(spend))
#>    search    social   display     video     email affiliate
#>      2.28      1.22      0.51      1.30      0.55      0.68
```

=== step === quiz
::eyebrow Check yourself
## Pick the right tool

Maya's six ad channels move almost in lockstep. She wants a model that keeps the useful channels *together* rather than arbitrarily crowning one and dropping its partners. Which setting does that best?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- `alpha = 1` (pure lasso), because lasso selects, so it must keep the whole correlated group ::no The opposite: lasso tends to keep just one of a correlated group and zero the rest, and which one it keeps is unstable. That instability is the exact problem here.
- `alpha = 0` (pure ridge), because ridge is the most stable choice ::no Ridge is stable, but it keeps ALL twenty predictors, including the fourteen noise metrics. It never gives Maya the shortlist she asked for.
- `alpha = 0.5` (elastic net), because the L2 part keeps correlated predictors together while the L1 part still drops the noise ::ok Right. The grouping effect from the L2 penalty holds the correlated channels together, and the L1 penalty still zeroes the fourteen useless metrics: shrink AND select.

=== step === concept
::eyebrow Know your tools
## Which one, and when

You now have three regularized regressions. They differ in one thing: what they do with a coefficient. Choose by your goal, not by habit.

- **Ridge (`alpha = 0`).** Shrinks every coefficient but keeps them all. Reach for it when your predictors are correlated, you believe most carry a little signal, and you want the steadiest possible *prediction*, not a shortlist.
- **Lasso (`alpha = 1`).** Shrinks and drives weak coefficients to exactly zero, so it hands you a sparse, interpretable shortlist. Reach for it when you have many predictors, suspect most are irrelevant, and want the model to name the few that matter. It can select at most \(n\) predictors when you have more predictors than rows (\(p > n\)), and it picks unstably among correlated ones.
- **Elastic net (`0 < alpha < 1`).** Blends both: sparse selection from L1, stable grouping from L2. Reach for it when you want a shortlist AND your predictors are correlated, the common case in real data. The cost is a second knob (\(\alpha\)) to tune.

[WARNING]
None of these three is an unbiased effect estimator. Every coefficient here is shrunk on purpose, so a lasso or elastic-net coefficient is a *prediction* ingredient, not a causal effect size. And "lasso selected it" means "lasso found it useful for splitting the variance," not "this variable causes signups", especially fragile among correlated predictors, as Maya's flickering channels showed.

=== step === concept
::eyebrow Go deeper
## References

Four authoritative places to take this further:

- [Tibshirani (1996), Regression Shrinkage and Selection via the Lasso, JRSS-B](https://doi.org/10.1111/j.2517-6161.1996.tb02080.x) - the paper that introduced the lasso and the L1-penalty idea you used here.
- [Zou and Hastie (2005), Regularization and Variable Selection via the Elastic Net, JRSS-B](https://doi.org/10.1111/j.1467-9868.2005.00503.x) - the paper that introduced elastic net and named the grouping effect.
- [An Introduction to Statistical Learning, ch. 6.2 (free PDF)](https://www.statlearning.com/) - the gentle, visual treatment of lasso, ridge, and the shrinkage geometry (the diamond and the circle).
- [glmnet vignette (CRAN)](https://cran.r-project.org/web/packages/glmnet/vignettes/glmnet.pdf) - the documentation for the package you used, covering `alpha`, `cv.glmnet`, and reading the coefficient path.

=== step === complete
## Lesson 5 complete

You took Maya from a stable-but-bloated ridge model to a genuine shortlist. Lasso swaps ridge's squared penalty for the absolute-value (L1) penalty, and through soft-thresholding that one change drives weak coefficients to *exactly* zero, doing regression and feature selection in a single fit (three survivors out of twenty, all fourteen noise metrics gone). You then saw lasso's weakness, that it selects unstably among correlated predictors, and fixed it with elastic net: `alpha` blends L1 selection with L2 grouping, so the correlated ad channels stayed together while the noise still dropped out.

Ridge, lasso, and elastic net all share one quiet assumption, though: that the relationship between each predictor and the outcome is a straight LINE. Next, Lesson 6: GAMs, Splines and Smooths. What if signups do not rise in a straight line with spend, but bend, rising fast then leveling off? You will let the data choose a smooth curve of its own, without overfitting.
