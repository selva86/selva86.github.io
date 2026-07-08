---
title: "Advanced Regression Lesson 7: Choosing Smoothness in a GAM"
catalog_blurb: "How to tell whether a fitted smooth curve is flexible enough and trustworthy."
description: "A GAM's penalty picks the smoothness, but you set the ceiling k. Learn to check k is big enough, read gam.check, and spot concurvity between smooths."
keywords: "GAM smoothness, choosing k, gam.check, k-index, concurvity, effective degrees of freedom, penalized splines, mgcv, REML, model diagnostics, R"
post_type: "LESSON"
curriculum_id: "6.130.7"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-reg-glm-expert"
course_title: "Advanced Regression and GLMs"
course_lesson: "7"
course_total: "13"
course_landing: "R-Advanced-Regression-Course.html"
course_next: "Count-Models-Poisson-and-Negative-Binomial.html"
course_prev: "GAMs-Splines-and-Smooths.html"
---

=== step === cover
::eyebrow Lesson 7 of 13
## Choosing Smoothness in a GAM

In Lesson 6, Priya's straight line was blind to the temperature hill, and a GAM using the same predictor explained 54% of her ice-cream sales instead of 0.6%. You wrapped a predictor in `s()`, and the wiggliness penalty quietly chose how much to bend. It felt like magic: no polynomial degree to guess, no knots to place.

But a GAM is not tuning-free, and trusting it blindly is how you ship a curve that is secretly wrong. There was a number you accepted without looking: `k`, the basis size. Was it big enough? And when Priya adds a second predictor, how does she know the two smooths are telling her separate things instead of fighting over the same signal?

This lesson is the diagnostic half of GAMs. You will learn to interrogate a smooth the way you already interrogate a linear model's residuals: is it flexible enough, are its assumptions holding, and are its predictors truly separate.

By the end of this lesson you will be able to:

- Tell `k` (the flexibility ceiling you set) apart from edf (the flexibility the penalty actually spends), and spot when the ceiling is too low
- Read `gam.check()`: its basis-size table and its four residual plots
- Raise `k` safely, knowing the penalty still protects you from overfitting
- Recognize and measure **concurvity**, the smooth-curve version of collinearity, and act on it

**Prerequisites:** you can fit a GAM and read its edf ([GAMs, Splines and Smooths](GAMs-Splines-and-Smooths.html), Lesson 6), you know the [bias-variance tradeoff](The-Bias-Variance-Tradeoff.html) (underfit vs overfit), and you can read a linear model's residual plots. It helps to have met multicollinearity: two predictors carrying the same information.

The dial below is the one from Lesson 6. Slide it left and the smooth is too stiff; slide it right and it chases noise. That slider IS the number `k`. This lesson is about finding the right setting on purpose, and proving you found it.

::widget spline-smoother {}

=== step === concept
::eyebrow The knob you did not look at
## The dial has a ceiling

This month Priya kept a finer log. For 400 visits she noted the **hour of day** and how many ice creams she sold in that hour, plus the **temperature** at that moment. Let us build her log inline (each lesson runs in a fresh R session, so all the data lives right here) and look at the first few rows.

```r
library(mgcv)
set.seed(1)
n <- 400
cart <- data.frame(hour = round(runif(n, 6, 22), 1))          # hour of day, 6am to 10pm
peak <- 30 * exp(-(cart$hour - 9)^2 / 1.5) +                  # a morning-commute rush
        40 * exp(-(cart$hour - 18)^2 / 2.5)                   # a bigger evening rush
cart$sales <- round(pmax(0, 45 + peak + rnorm(n, 0, 7)))      # ice creams sold that hour
cart$temp  <- round(15 + 1.4 * (cart$hour - 6) -              # temperature climbs through
                    0.05 * (cart$hour - 6)^2 + rnorm(n, 0, 0.8), 1)   # the day, then eases
head(cart, 4)
#>   hour sales temp
#> 1 10.2    59 19.7
#> 2 12.0    57 22.8
#> 3 15.2    58 24.1
#> 4 20.5    46 25.2
```

Her sales across the day are not one hill but two: a morning-commute bump around 9am and a bigger evening rush around 6pm, with a lull in between. That is a genuinely wiggly shape. Fit the obvious GAM, a smooth of `hour`, and read the smooth term.

```r
g <- gam(sales ~ s(hour), data = cart, method = "REML")
round(summary(g)$s.table, 2)
#>          edf Ref.df     F p-value
#> s(hour) 8.81   8.99 123.9       0
```

That looks wonderful. The smooth is wildly significant, and (not shown) it explains 74% of the variation in sales. You might stop here. But look closely at the two numbers and ask where they came from. The **edf** is 8.81: the fitted curve spent about 8.8 straight-lines'-worth of flexibility. The **Ref.df** is 8.99. Those two are suspiciously close, and 8.99 is not an accident.

When you write `s(hour)`, `mgcv` uses a default basis of `k = 10` building-block curves. That `k` is a **ceiling**: it caps how wiggly the smooth is *allowed* to get. The penalty then chooses the actual wiggliness *up to that ceiling*. In symbols, the effective degrees of freedom are boxed in:

\[ 1 \le \text{edf} \le k - 1 \]

The lower bound, edf near 1, is a straight line. The upper bound, \(k-1\), is the wiggliest the basis can express (mgcv reserves one degree for the overall level, so the usable ceiling is \(k-1 = 9\), which it reports as **k'**). Our edf came back at 8.81, pressed right up against that ceiling of 9. That is the tell we need to chase down next: is 8.81 the honest answer, or just as high as the ceiling would let the curve climb?

=== step === concept
::eyebrow The failure mode
## When the ceiling bites

Here is the subtle trap. The wiggliness penalty can only ever make a curve *smoother* than the basis allows; it can never make it *wigglier* than the ceiling. So if the true relationship needs more bends than \(k-1\) can express, the penalty is helpless. It leaves the edf pinned at the ceiling, and the curve underfits, even though the penalty did its job perfectly. A too-low `k` fails silently: the model still fits, still reports a significant smooth, still looks fine.

How do you catch a silent failure without knowing the true curve? Refit at a few rising ceilings and watch the edf. If lifting the ceiling lets the edf climb, the ceiling was holding the curve down.

```r
basis_size <- function(k) {
  fit <- gam(sales ~ s(hour, k = k), data = cart, method = "REML")
  kc  <- k.check(fit)                       # k' = usable ceiling; edf = flexibility used
  data.frame(k = k, k_prime = kc[, "k'"], edf = round(kc[, "edf"], 1))
}
do.call(rbind, lapply(c(10, 20, 40, 60), basis_size))
#>    k k_prime  edf
#> 1 10       9  8.8
#> 2 20      19 14.6
#> 3 40      39 16.4
#> 4 60      59 16.6
```

Read that top to bottom. At the default `k = 10`, the edf is 8.8, sitting at its ceiling of 9. Lift the ceiling to `k = 20` and the edf does not stay put: it leaps to 14.6, far past where it was trapped before. Push to `k = 40` and it settles near 16.5, then barely moves at `k = 60`. That plateau near 16.5 is the truth: Priya's daily sales curve wants about 16 degrees of freedom to trace its two peaks and the lull. The default ceiling of 9 was strangling it. The leap when you lifted the ceiling is the proof.

[KEY INSIGHT]
edf pinned at k' is a warning, not a verdict. It means "the curve wants at least this much flexibility, and maybe more." The only way to know if there is more is to lift the ceiling and look. When edf finally settles comfortably below k', the ceiling is no longer the thing limiting the fit.

=== step === quiz
::eyebrow Check yourself
## Reading the climb

You fit a smooth and its edf comes back at 8.8, right at the ceiling k' = 9. You raise `k` to 20 and refit; now the edf reports 14.6. What does that jump tell you?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Raising k to 20 caused the model to overfit; the honest edf was the smaller 8.8 ::no Raising k does not force overfitting, because the penalty still chooses the actual wiggliness. If 8.8 were the honest answer, lifting the ceiling would have left the edf near 8.8. It leapt instead, which is the opposite signal.
- The default ceiling of 9 was holding the curve down: k = 10 was too small for this wiggly relationship ::ok Exactly. The edf only jumps when it was pinned against the ceiling. A curve that wanted ~15 degrees of flexibility was capped at 9, so it underfit. The jump is the diagnosis.
- Nothing useful; edf and k are unrelated numbers ::no They are tightly related: k sets the ceiling and edf must obey 1 <= edf <= k-1. Watching edf move as you change the ceiling is exactly how you diagnose a too-small k.

=== step === concept
::eyebrow The built-in tool
## Reading gam.check

The climb test works, but `mgcv` gives you the same diagnosis in one call: `gam.check()`. It does two jobs. First, it prints a **basis-size table** with the numbers we care about. Second, it draws **four residual plots** (the next step). Start with the table. The cleanest way to see just the table is `k.check()`, which is the piece `gam.check()` prints. Run it on a deliberately too-small fit, `k = 5`:

```r
g5 <- gam(sales ~ s(hour, k = 5), data = cart, method = "REML")
set.seed(4)                 # the k-index p-value is simulation-based, so seed it to reproduce
round(k.check(g5), 2)
#>         k'  edf k-index p-value
#> s(hour)  4 3.99    0.64       0
```

Four numbers, and here is how to read each one:

- **k'** is the usable ceiling, \(k-1 = 4\).
- **edf** is 3.99, jammed against that ceiling. First red flag: edf is essentially equal to k'.
- **k-index** compares the variability of residuals that are neighbours in `hour` against the overall residual variability. If the smooth has captured the pattern, neighbouring residuals are no more alike than random, and the index sits around 1. Below 1 means there is still pattern left between neighbours that the smooth was too stiff to reach. Here it is 0.64, well below 1: second red flag.
- **p-value** tests that k-index against chance. Here it rounds to 0 (it is below 2e-16): the low k-index is not noise. Third red flag.

All three agree: `k = 5` is far too small. The full `gam.check()` printout says the same thing in words and adds significance stars. Run it locally to also see the four plots:

```r-static
gam.check(g5)
#>
#> Method: REML   Optimizer: outer newton
#> full convergence after 11 iterations.
#> ...
#> Basis dimension (k) checking results. Low p-value (k-index<1) may
#> indicate that k is too low, especially if edf is close to k'.
#>
#>           k'  edf k-index p-value
#> s(hour) 4.00 3.99    0.64  <2e-16 ***
```

That last line is the whole message: **a k-index below 1 with a small p-value, especially when edf is close to k', means k is too low.** Raise it.

=== step === widget
::eyebrow The other half of gam.check
## The four residual plots

The basis table tells you if the smooth is flexible enough. The four plots `gam.check()` draws tell you whether the model's *assumptions* hold, exactly the questions you ask of an `lm()`. The most important is the top-left panel: **residuals versus the fitted values**. You read it the same way you read a linear model's residual plot. Toggle the shapes below and watch what each one means.

::widget residual-plot {}

A **flat, even band** around zero (the healthy case) is what you want: constant spread, no leftover curve. A **funnel** means the spread grows with the prediction (non-constant variance), so the model's uncertainty estimates are wrong. A **bend or arc** means the model missed a nonlinearity, and for a GAM that usually points straight back to a smooth whose `k` is too small to follow the shape. The other three panels of `gam.check()` (a Q-Q plot and a histogram of residuals to check normality, and observed-versus-fitted to check overall fit) round out the picture, but residuals-versus-fitted is where trouble shows first.

=== step === quiz
::eyebrow Check yourself
## What would you do?

You fit `gam(y ~ s(x))` and run `gam.check()`. The basis table reads: k' = 9, edf = 8.9, k-index = 0.82, p-value = 0.01. The residuals-versus-fitted plot shows a gentle leftover arc. What is the right next move?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Raise k (say to 20) and refit: edf is at the ceiling, k-index is below 1 with a small p-value, and the arc signals a missed bend ::ok Right. Every signal points the same way: the smooth is too stiff. edf is pinned at k', k-index < 1 is significant, and the leftover arc is the shape the smooth could not reach. Increase k and re-run the check.
- Nothing: the smooth term is significant, so the model is fine ::no Significance does not mean the shape is captured. A too-stiff smooth can be highly significant and still underfit. edf at the ceiling plus a low k-index plus a leftover arc all say to raise k.
- Drop the smooth and use a plain linear term for x ::no That goes the wrong way. The diagnostics say the fit needs MORE flexibility, not less. A linear term is the stiffest possible smooth and would underfit even harder.

=== step === concept
::eyebrow The fix, and why it is safe
## Raise k, the penalty still guards

The fix for a too-small `k` is simply to raise it. Give Priya's sales curve a generous ceiling and re-check.

```r
g20 <- gam(sales ~ s(hour, k = 20), data = cart, method = "REML")
set.seed(4)
round(k.check(g20), 2)
#>         k'   edf k-index p-value
#> s(hour) 19 14.63    1.04    0.77
```

Now everything is calm. The edf is 14.63, sitting well below the ceiling of 19, so the ceiling is no longer the binding constraint. The k-index is back up at 1.04 (around 1, as it should be), and its p-value of 0.77 gives no reason to worry. And the fit genuinely improved:

```r
round(c(default_k10 = summary(g)$dev.expl,
        generous_k20 = summary(g20)$dev.expl), 3)
#>  default_k10 generous_k20
#>        0.742        0.757
```

Deviance explained rose from 74.2% to 75.7% just by letting the curve reach its natural shape.

[KEY INSIGHT]
Setting `k` too high does NOT cause overfitting. The penalty still chooses the actual smoothness from the data, so a bigger ceiling the fit does not need simply goes unused (the edf settles where it wants). The only cost of a too-large `k` is a little extra computation. So the practical rule is: **when in doubt, set `k` generously and let `gam.check()` confirm the edf settled below it.** You lose nothing by giving the curve room.

[NOTE]
Every fit here uses `method = "REML"`. That tells `mgcv` to choose the smoothness by restricted maximum likelihood, which is more stable and less prone to occasional overfitting than the default (GCV). When you care about getting the smoothness right, which is this entire lesson, `method = "REML"` is the one to reach for.

=== step === tryit
::eyebrow Your turn
## Check a smooth yourself

A colleague fit Priya's sales with a small basis, `k = 6`, and says "the smooth is significant, so we are good." You are not so sure. Write the one line that reports the basis-size table for their fit, so you can see whether `k` is big enough. (Either `k.check()` or `gam.check()` will do.)

```r
g6 <- gam(sales ~ s(hour, k = 6), data = cart, method = "REML")
____
```
::check {"regex":"(gam\\.check|k\\.check)\\s*\\(","gate":true,"difficulty":"intermediate","ok":"That prints the basis table. edf 4.97 sits at the ceiling k'=5, and the k-index is 0.69 (below 1): k=6 is still too small. Your colleague's significant smooth is underfitting.","no":"You want the basis-size check. Call k.check(g6) (the table) or gam.check(g6) (the table plus the four plots)."}
::solution
```r
g6 <- gam(sales ~ s(hour, k = 6), data = cart, method = "REML")
set.seed(4)
round(k.check(g6), 2)
#>         k'  edf k-index p-value
#> s(hour)  5 4.97    0.69       0
```

edf 4.97 is pinned at the ceiling k' = 5, and the k-index of 0.69 is well below 1: `k = 6` is still too small, no matter how significant the smooth looks. A significant term can still underfit.

=== step === concept
::eyebrow A different kind of trouble
## Concurvity: collinearity for curves

Sizing `k` keeps each smooth honest on its own. The second thing that can quietly wreck a GAM shows up when smooths interact. Priya asks a natural question: does **temperature** drive her sales, or is it just standing in for the time of day? After all, the day warms up from morning to afternoon, so `temp` and `hour` rise together. Check how tightly.

```r
round(cor(cart$hour, cart$temp), 2)
#> [1] 0.9
```

A correlation of 0.9. Now add a smooth of temperature alongside the smooth of hour and read both terms.

```r
gc <- gam(sales ~ s(hour, k = 20) + s(temp, k = 20), data = cart, method = "REML")
round(summary(gc)$s.table, 2)
#>           edf Ref.df     F p-value
#> s(hour) 14.57  16.86 64.71    0.00
#> s(temp)  1.84   2.39  0.57    0.56
```

Look what happened to temperature. On its own, `temp` tracks the day's sales closely (it is 0.9 correlated with the hour that drives them). But placed next to `s(hour)`, its smooth collapses to an edf of 1.84 and a p-value of 0.56, apparently insignificant. The GAM cannot tell whose effect is whose, so it hands almost all the shared signal to `hour` and leaves `temp` looking flat and useless.

This is **concurvity**: the smooth-curve version of multicollinearity. In a linear model, two predictors are collinear when one is nearly a linear combination of the others. In a GAM, two smooths are *concurve* when one can be closely reproduced by a smooth function of the others. Here `s(temp)` is redundant because temperature is essentially a smooth function of the hour. When that happens, the individual smooth estimates become unstable and their p-values untrustworthy: you cannot read either term on its own.

=== step === concept
::eyebrow Put a number on it
## Measure it: concurvity()

You do not have to eyeball it. `concurvity()` scores how much each smooth overlaps the others, on a scale from 0 (no overlap, fully separable) to 1 (one smooth is entirely reconstructable from the others).

\[ 0 \le \text{concurvity} \le 1 \]

```r
round(concurvity(gc), 2)
#>          para s(hour) s(temp)
#> worst       0    0.94    0.94
#> observed    0    0.28    0.78
#> estimate    0    0.81    0.83
```

Read the **worst** row first; it is the pessimistic, most conservative measure and the one to act on. Both smooths score 0.94, dangerously close to 1: `s(hour)` and `s(temp)` are almost interchangeable. The `observed` and `estimate` rows are two less-pessimistic angles on the same overlap; when `worst` is high, treat the pair as entangled regardless of what the softer rows say. A common rule of thumb: below about 0.3 you are fine, above about 0.8 the affected terms cannot be interpreted separately.

[WARNING]
High concurvity does not throw an error or even a warning when you fit. The model runs, prints tidy coefficients, and looks authoritative. `concurvity()` is something you have to run yourself, every time you put two or more smooths of related predictors in one GAM.

=== step === quiz
::eyebrow Check yourself
## What the insignificant term means

In the model above, `s(temp)` came back with p = 0.56 (apparently insignificant) while `concurvity()` reported 0.94 for the pair. Priya concludes "temperature has no real effect on my sales." Is she right?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Yes: p = 0.56 is not significant, so temperature genuinely does not affect sales and she should drop it ::no The p-value is unreliable precisely because concurvity is 0.94. Temperature and hour are nearly redundant, so the model could not separate their effects and parked the shared signal on hour. Fit temp on its own and it looks strongly predictive. Insignificant-under-concurvity is not the same as irrelevant.
- No: with concurvity 0.94 the two smooths are nearly redundant, so the model cannot attribute the shared signal; the insignificance is about separability, not about temperature being irrelevant ::ok Right. When two smooths are concurve, their individual p-values and shapes are untrustworthy. The right reading is "hour and temperature carry the same information here," not "temperature does nothing." She should choose which one to keep, not conclude temperature is meaningless.
- Concurvity of 0.94 means temperature explains 94% of the variation in sales ::no Concurvity measures overlap between predictors, not variation explained in the response. 0.94 says s(temp) is 94% reconstructable from the other smooths, which is why its own effect cannot be trusted here.

=== step === concept
::eyebrow The fix, and the honest limits
## What to do about it

The fix for concurvity is the same as for collinearity: do not keep two terms that carry the same information. Drop the redundant one (or combine them into a single term). Because `hour` is the more interpretable driver of footfall, keep `s(hour)` and drop `s(temp)`. Confirm you lost nothing.

```r
round(c(with_temp = summary(gc)$s.table["s(hour)", "edf"],
        no_temp   = summary(g20)$s.table["s(hour)", "edf"]), 2)
#> with_temp   no_temp
#>     14.57     14.63
round(c(with_temp = summary(gc)$dev.expl,
        no_temp   = summary(g20)$dev.expl), 3)
#> with_temp   no_temp
#>     0.758     0.757
```

Dropping temperature barely moves the hour smooth (edf 14.57 to 14.63) and barely moves the fit (75.8% to 75.7% deviance explained). Temperature was adding instability and an untrustworthy p-value, not signal. The simpler model is the honest one.

[WARNING]
A GAM can mislead in three ways this lesson has now armed you against. **k too small:** the curve underfits silently while still looking significant; catch it with `gam.check()` (edf at k', k-index below 1). **High concurvity:** individual smooths and their p-values become meaningless; catch it with `concurvity()`. **Patterned residuals:** a funnel or arc in the residual plots means a broken assumption (non-constant variance or a missed shape, sometimes a sign you need a different response family, which is exactly where the next lessons go). Check all three before you trust a fitted GAM.

=== step === concept
::eyebrow Go deeper
## References

- [Simon Wood, Generalized Additive Models: An Introduction with R (2nd ed.)](https://www.taylorfrancis.com/books/mono/10.1201/9781315370279/generalized-additive-models-simon-wood) - the definitive book by mgcv's author; chapters 5 to 6 cover basis size, penalties, and checking.
- [mgcv reference: choose.k (help on choosing basis dimension)](https://stat.ethz.ch/R-manual/R-devel/library/mgcv/html/choose.k.html) - the official guidance on `k`, `gam.check`, and the k-index, straight from the package docs.
- [mgcv reference: concurvity](https://stat.ethz.ch/R-manual/R-devel/library/mgcv/html/concurvity.html) - what the worst / observed / estimate measures mean and how to act on them.
- [Noam Ross, GAMs in R (free interactive course)](https://noamross.github.io/gams-in-r-course/) - chapter 2 walks through `gam.check`, basis size, and concurvity hands-on.
- [Wood (2011), Fast stable REML estimation of semiparametric GLMs (JRSS-B)](https://doi.org/10.1111/j.1467-9868.2010.00749.x) - the paper behind `method = "REML"` and why it is the stable choice for smoothness selection.

=== step === complete
## Lesson 7 complete

You can now interrogate a smooth instead of trusting it. You learned that `k` is a ceiling on wiggliness, not the wiggliness itself: the penalty spends the effective degrees of freedom up to \(k-1\), so when edf sits pinned at the ceiling you raise `k` and re-check, safe in the knowledge that a generous `k` never overfits because the penalty still guards. You read `gam.check()`, both its basis-size table (k', edf, k-index and its p-value) and its four residual plots, the same way you read a linear model. And you met concurvity, the smooth-curve version of collinearity, measured it with `concurvity()`, and saw why two near-redundant smooths make each other's estimates untrustworthy.

Next, Lesson 8: Count models, Poisson and negative binomial. Priya's sales are counts, whole ice creams, never negative and never fractional, yet every model so far has treated them as if they could be any real number. You will match the model to the response by swapping in a family built for counts, and meet the overdispersion problem that Poisson regression runs into and the negative-binomial fix for it.
