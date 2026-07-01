---
title: "Advanced Regression Lesson 4: Ridge Regression and Shrinkage"
catalog_blurb: "Why shrinking coefficients steadies a model when predictors are correlated."
description: "When predictors are correlated, OLS coefficients turn wild. Ridge regression shrinks them for a stable, more accurate model, fit and tuned in R with glmnet."
keywords: "ridge regression, shrinkage, L2 penalty, multicollinearity, glmnet, regularization, lambda, bias-variance tradeoff, cross-validation, R"
post_type: "LESSON"
curriculum_id: "6.130.4"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-reg-glm-expert"
course_title: "Advanced Regression and GLMs"
course_lesson: "4"
course_total: "13"
course_landing: "R-Advanced-Regression-Course.html"
course_next: "Lasso-and-Elastic-Net.html"
course_prev: "Quantile-Regression.html"
---

=== step === cover
::eyebrow Lesson 4 of 13
## Ridge Regression and Shrinkage

Lesson 3 fit lines to the median and the tails. But notice what every method so far, ordinary and robust and quantile alike, has quietly assumed: that the data can pin down each coefficient in the first place. When your predictors are strongly correlated, it cannot, and least squares starts reporting nonsense with total confidence.

Meet Maya, a marketing analyst at a coffee-subscription company. Every week she predicts new signups from what she spent on six ad channels: search, social, display, video, email and affiliate. The catch is that she scales all six from one weekly budget, so in a busy week every channel is up and in a quiet week every channel is down. The six spend columns are almost the same column. When Maya fits ordinary least squares, it hands her a model claiming that display and email ads REDUCE signups, and the numbers lurch every time she refits on a slightly different stretch of weeks.

Ridge regression is the fix. By gently shrinking the coefficients toward zero, it trades a tiny, deliberate bias for a large drop in that wobble, and gives Maya a model she can trust. Drag the penalty slider below to watch coefficients shrink (switch to the Ridge (L2) toggle, the subject of this lesson).

By the end of this lesson you will be able to:

- Explain why strongly correlated predictors make ordinary least squares coefficients unstable, and spot the symptom
- Define ridge regression as penalized least squares, and say exactly what the penalty controls
- See how shrinkage trades a little bias for a large drop in variance, and why that can predict better
- Fit ridge in R, choose the penalty by cross-validation, and know when to reach for it

**Prerequisites:** you can fit and read a linear regression with `lm()` (a coefficient is a predictor's effect; a residual is actual minus predicted), and you have met the [bias-variance tradeoff](The-Bias-Variance-Tradeoff.html). If `lm()` is rusty, see [linear regression](Linear-Regression.html). Lessons 1 to 3 of this course are useful context but not required.

::widget coef-path {}

=== step === concept
::eyebrow The setup
## The predictors move together

Let us build Maya's data so the problem is concrete. Each of 60 weeks has a spend figure for the six channels; because they all scale from one budget, they rise and fall together. Signups truly depend on just two of them, search and social, plus a little noise. (We build the data right here, since each lesson runs in a fresh R session.)

```r
set.seed(1)
n <- 60
budget <- rnorm(n)                                    # the one weekly budget dial
spend  <- sapply(1:6, function(j) budget + rnorm(n, sd = 0.15))
colnames(spend) <- c("search", "social", "display", "video", "email", "affiliate")
signups <- 40 + 5 * spend[, "search"] + 3 * spend[, "social"] + rnorm(n, sd = 2)
ads <- data.frame(signups, spend)
round(cor(spend), 2)
#>           search social display video email affiliate
#> search      1.00   0.97    0.97  0.98  0.98      0.97
#> social      0.97   1.00    0.97  0.97  0.97      0.97
#> display     0.97   0.97    1.00  0.96  0.97      0.97
#> video       0.98   0.97    0.96  1.00  0.98      0.97
#> email       0.98   0.97    0.97  0.98  1.00      0.97
#> affiliate   0.97   0.97    0.97  0.97  0.97      1.00
```

Read that correlation matrix: every pair of channels sits around 0.97, almost perfectly in step. Statisticians call predictors this tangled **multicollinear**, and the heatmap below makes it plain, a near-solid block of dark green. To ordinary least squares, these six columns carry nearly the same information six times over.

::widget correlation-heatmap {"vars":["search","social","display","video","email","affiliate"],"matrix":[[1,0.97,0.97,0.98,0.98,0.97],[0.97,1,0.97,0.97,0.97,0.97],[0.97,0.97,1,0.96,0.97,0.97],[0.98,0.97,0.96,1,0.98,0.97],[0.98,0.97,0.97,0.98,1,0.97],[0.97,0.97,0.97,0.97,0.97,1]]}

=== step === concept
::eyebrow The symptom
## How that wrecks ordinary least squares

Now fit ordinary least squares and read what it claims.

```r
ols <- lm(signups ~ ., data = ads)
round(coef(ols), 2)
#> (Intercept)    search    social   display     video     email affiliate
#>       39.78      3.41      5.07     -0.40     -0.21     -0.39      0.36
```

Look closely, because two things are wrong. The true model puts weight 5 on search and 3 on social, yet OLS hands the bigger coefficient to social (5.07) and the smaller to search (3.41): it has swapped them. Worse, it stamps display, video and email with NEGATIVE coefficients, as if buying display ads pushed signups DOWN. That is not a finding about advertising. It is OLS unable to tell six near-identical columns apart, so it splits the credit almost at random, even into negatives.

And "at random" is precise. Refit the same model on 200 bootstrap resamples of the weeks and track the search coefficient alone:

```r
set.seed(7)
boot_ols <- replicate(200, {
  i <- sample(nrow(ads), replace = TRUE)
  coef(lm(signups ~ ., data = ads[i, ]))["search"]
})
round(c(mean = mean(boot_ols), sd = sd(boot_ols),
        lo = quantile(boot_ols, 0.05), hi = quantile(boot_ols, 0.95)), 2)
#>   mean     sd  lo.5% hi.95%
#>   3.16   2.00  -0.16   6.44
```

The search coefficient swings from about 0 to 6.4 depending on which weeks happen to land in the sample, a standard deviation of 2.0 around a mean of 3.16. Same underlying truth, a completely different story each refit. That is high variance in the estimates themselves.

[KEY INSIGHT]
OLS solves \( \hat{\beta}^{\text{OLS}} = (X^\top X)^{-1} X^\top y \), where \(X\) is the matrix of predictor values, \(y\) is the vector of signups, and \(\hat{\beta}\) are the fitted coefficients. When columns of \(X\) are nearly identical, \(X^\top X\) is nearly **singular** (close to non-invertible), so its inverse blows up, and with it the variance of every coefficient. Collinearity does not bias OLS; it makes it wildly unstable.

=== step === concept
::eyebrow The fix
## Penalize big coefficients

The instability comes from coefficients that are free to grow huge and cancel each other (a +40 here offset by a -37 there). Ridge regression takes that freedom away. It asks least squares to do its usual job, make the predictions fit, but attaches a price tag to the size of the coefficients, so the fit can no longer buy a giant coefficient cheaply.

Ordinary least squares minimizes only the squared error:

\[ \hat{\beta}^{\text{OLS}} = \arg\min_{\beta} \sum_{i=1}^{n} \bigl(y_i - x_i^\top \beta\bigr)^2. \]

Ridge adds a penalty on the squared size of the coefficients:

\[ \hat{\beta}^{\text{ridge}} = \arg\min_{\beta} \underbrace{\sum_{i=1}^{n} \bigl(y_i - x_i^\top \beta\bigr)^2}_{\text{fit the data}} \;+\; \underbrace{\lambda \sum_{j=1}^{p} \beta_j^2}_{\text{keep coefficients small}}. \]

Read the new term. \(\beta_j\) is the coefficient on predictor \(j\), \(p\) is the number of predictors, and \(\lambda\) (lambda) is a knob you choose that sets how expensive big coefficients are. The sum \(\sum_j \beta_j^2\) is the **L2 penalty** (the squared length of the coefficient vector). At \(\lambda = 0\) the penalty vanishes and ridge is exactly OLS. As \(\lambda\) grows, every coefficient is squeezed toward zero, but, crucially, never all the way to exactly zero.

Why does squeezing cure the instability? Ridge has its own closed form, \( \hat{\beta}^{\text{ridge}} = (X^\top X + \lambda I)^{-1} X^\top y \), where \(I\) is the identity matrix. Adding \(\lambda I\) lifts the near-singular \(X^\top X\) away from non-invertibility, so the inverse no longer blows up. The very term that shrinks the coefficients also stabilizes them.

Switch the widget below to **Ridge (L2)** and drag the penalty. Watch all six coefficients slide smoothly toward zero as lambda grows, and notice that none of them ever actually reaches it.

::widget coef-path {}

=== step === concept
::eyebrow The trade
## A little bias for a lot less variance

Shrinking the coefficients is not free. Pulling them toward zero makes them **biased**: the ridge estimates come out deliberately too small (a true effect of 5 gets reported as something nearer 1.5). So why do it? Because what we ultimately care about is prediction error, and a model's expected squared error splits into two competing parts:

\[ \text{expected error} \;=\; \underbrace{\text{bias}^2}_{\text{systematically off}} \;+\; \underbrace{\text{variance}}_{\text{jumps from sample to sample}} \;+\; \text{irreducible noise}. \]

OLS here has almost no bias but enormous variance (those wildly swinging coefficients). Ridge accepts a small, controlled dose of bias in exchange for a large cut in variance. When the variance it removes outweighs the bias it adds, total error drops, and there is always some \(\lambda > 0\) that comes out ahead of plain OLS. That is the whole bargain.

The widget below shows this tradeoff with a different knob (polynomial complexity), but the U-shape is universal. For ridge, read it right to left: the far right is plain OLS (\(\lambda = 0\), most flexible, highest variance), and moving left is turning \(\lambda\) up (more shrinkage, more bias, less variance). The lowest test error, the sweet spot, sits in the middle, never at either extreme.

::widget bias-variance {}

=== step === quiz
::eyebrow Check yourself
## What does ridge do to a weak coefficient?

Maya has a channel, affiliate, that barely matters. She turns the ridge penalty up high. What happens to its coefficient?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- It is set to exactly zero, dropping the channel from the model ::no That is what lasso (L1) does, and it is the subject of the next lesson. Ridge uses the squared (L2) penalty, which shrinks smoothly but never reaches exactly zero.
- It is shrunk close to zero but stays non-zero, so the channel remains in the model ::ok Right. The L2 penalty squeezes every coefficient toward zero and keeps squeezing, but never sets one exactly to zero. Ridge stabilizes; it does not select.
- It is left unchanged, since ridge only touches the large coefficients ::no Ridge shrinks every coefficient, small ones included; in fact it tends to pull a group of correlated predictors toward one shared value. None are left untouched.

=== step === tryit
::eyebrow Your turn
## Fit ridge in R

Time to fix Maya's model. In R, the `glmnet` package fits ridge (and its cousin lasso) through a single argument, `alpha`: `alpha = 1` is lasso, and `alpha = 0` is pure ridge. Fill in the value that gives you ridge.

```r
library(glmnet)
X <- as.matrix(ads[, -1])   # the six spend columns, as a matrix
y <- ads$signups
ridge <- glmnet(X, y, alpha = ____)   # which alpha makes it ridge?
round(coef(ridge, s = 1)[, 1], 2)     # coefficients at penalty lambda = 1
```
::check {"regex":"alpha\\s*=\\s*0(?!\\.)","gate":true,"difficulty":"intermediate","ok":"That is ridge. Look at the coefficients: all positive, all pulled into a tight band, no more negatives.","no":"Ridge is the squared (L2) penalty: set alpha = 0. (alpha = 1 would be lasso.)"}
::solution
```r
library(glmnet)
X <- as.matrix(ads[, -1])
y <- ads$signups
ridge <- glmnet(X, y, alpha = 0)          # alpha = 0 = ridge; alpha = 1 = lasso
round(coef(ridge, s = 1)[, 1], 2)
#> (Intercept)    search    social   display     video     email affiliate
#>       39.80      1.55      1.94      1.04      1.01      0.94      1.10
```

Compare that to the OLS coefficients from earlier. The negatives are gone; instead of splitting the credit into wild positives and negatives, ridge spreads it sensibly across the correlated group, every channel landing in a calm 0.9 to 1.9 band. The coefficients are biased low (search reads 1.55, not its true 5), but they are stable and believable, which for prediction is the better trade.

=== step === concept
::eyebrow The payoff
## Does it actually help? Tune lambda and measure

A stable model is worthless if it predicts badly, so let us settle the question the honest way: pick the penalty properly, then test the model on weeks it never saw.

Which lambda? You do not guess it; you let **cross-validation** choose. `cv.glmnet` fits the ridge path many times, each time holding out a slice of the data to score, and reports the lambda with the lowest held-out error:

```r
set.seed(1)
cv <- cv.glmnet(X, y, alpha = 0)          # 10-fold cross-validation over a grid of lambda
round(c(lambda.min = cv$lambda.min, lambda.1se = cv$lambda.1se), 3)
#> lambda.min lambda.1se
#>      0.666      6.815
```

`lambda.min` is the penalty with the smallest cross-validated error; `lambda.1se` is a slightly stronger penalty within one standard error of it, a common, more conservative default. Now the real test: train both models on 40 weeks, predict the other 20, and compare the root-mean-square error (RMSE, the typical size of a prediction miss).

```r
set.seed(99)
tr <- sample(nrow(ads), 40)               # 40 weeks to train, 20 held out to test
ols_fit <- lm(signups ~ ., data = ads[tr, ])
rid_fit <- cv.glmnet(X[tr, ], y[tr], alpha = 0)
rmse <- function(pred, actual) sqrt(mean((pred - actual)^2))
round(c(OLS   = rmse(predict(ols_fit, ads[-tr, ]),                ads$signups[-tr]),
        ridge = rmse(predict(rid_fit, X[-tr, ], s = "lambda.min"), ads$signups[-tr])), 2)
#>  OLS ridge
#> 2.33  1.99
```

Ridge predicts new weeks with about 15% less error (1.99 versus 2.33), from the very same data. It gave up a little accuracy on the training weeks (the bias) to stop chasing the noise that made OLS lurch (the variance), and came out ahead where it counts, on weeks it had never seen.

[NOTE]
The penalty \(\lambda \sum \beta_j^2\) depends on the SCALE of each predictor: a coefficient measured in dollars and one measured in thousands of dollars get penalized differently. So ridge must standardize the predictors first. `glmnet` does this for you by default and reports the coefficients back on the original scale, but if you ever compute ridge by hand, standardize before you penalize.

=== step === quiz
::eyebrow Check yourself
## Reading the tradeoff

You keep pushing lambda higher and higher, well past the value cross-validation chose. What happens to the model's error on new data?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- It keeps falling: more shrinkage always means a more stable, better model ::no Only up to a point. Past the sweet spot you are shrinking away real signal, not just noise, so the model starts underfitting.
- It stays flat once the coefficients have settled ::no Error does not plateau; over-shrinking actively hurts. Push lambda to infinity and every coefficient is zero, a model that just predicts the average.
- It falls to a minimum, then rises again as the model starts underfitting ::ok Right. Test error is U-shaped in lambda: too little penalty leaves OLS-like variance, too much adds so much bias that signal is lost. Cross-validation finds the bottom of that U.

=== step === concept
::eyebrow Know your tool
## When ridge earns its keep, and where it does not

Ridge is not a seasoning to sprinkle on every regression. It shines in specific, common situations.

**Reach for ridge when:**

- Your predictors are correlated (multicollinearity), the exact case that wrecked Maya's OLS model.
- You have many predictors relative to rows, even more predictors than rows (\(p > n\)), where OLS has no unique solution at all but ridge still does.
- You believe most predictors carry a little signal and you want to keep them all, just tamed.

**Its limits:**

- **It does not select.** Ridge shrinks every coefficient toward zero but never to zero, so it never drops a predictor or hands you a short list of the ones that matter. When you need selection, you need lasso.
- **It is biased on purpose.** The coefficients come out deliberately too small, so do not read a ridge coefficient as an unbiased effect size; read the model as a predictor.
- **It lives or dies by lambda.** The whole method depends on choosing lambda well, which means cross-validation every time, not a fixed rule of thumb.

[WARNING]
Because ridge keeps every predictor, its coefficients are built for prediction, not causal interpretation. With six near-identical channels it spread the credit evenly across all of them; that does not mean each channel truly contributes equally, only that ridge cannot, and does not try to, tell them apart.

That gap, ridge cannot pick WHICH correlated predictor matters, is exactly what the next lesson solves.

=== step === concept
::eyebrow Go deeper
## References

Four authoritative places to take this further:

- [Hoerl and Kennard (1970), Ridge Regression: Biased Estimation for Nonorthogonal Problems, Technometrics](https://doi.org/10.1080/00401706.1970.10488634) - the paper that introduced ridge and proved a beneficial lambda always exists.
- [An Introduction to Statistical Learning, ch. 6.2 (free PDF)](https://www.statlearning.com/) - the gentle, visual treatment of ridge and lasso, with the shrinkage geometry.
- [The Elements of Statistical Learning, ch. 3.4 (free PDF)](https://hastie.su.domains/ElemStatLearn/) - the full math: the closed form, the bias-variance decomposition, and the singular-value view.
- [glmnet vignette (CRAN)](https://cran.r-project.org/web/packages/glmnet/vignettes/glmnet.pdf) - the documentation for the package you used here, including cv.glmnet and the alpha argument.

=== step === complete
## Lesson 4 complete

You watched six near-identical ad channels turn ordinary least squares into nonsense, coefficients that swapped, went negative, and swung by a standard deviation of 2.0 across resamples. Then you fixed it: ridge regression adds an L2 penalty, \(\lambda \sum \beta_j^2\), that shrinks the coefficients toward zero, trading a little bias for a large drop in variance. You fit it with glmnet at alpha = 0, chose lambda by cross-validation, and measured the payoff, about 15% lower error on weeks the model had never seen.

Next, Lesson 5: Lasso and Elastic Net. Ridge shrinks every coefficient but keeps them all. Lasso uses a different penalty that drives the useless ones to exactly zero, doing feature selection for free, and elastic net blends the two so you can shrink AND select even when predictors are correlated.
