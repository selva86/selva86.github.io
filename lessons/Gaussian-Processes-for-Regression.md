---
title: "Advanced Supervised Learning Lesson 4: Gaussian Processes for Regression"
catalog_blurb: "Predict a curve and get honest uncertainty that widens where data is thin."
description: "Gaussian process regression in R from scratch: the RBF kernel, a posterior mean with an honest 95 percent band, tuning the lengthscale, and when GPs break."
keywords: "gaussian process regression, GP regression, RBF kernel, lengthscale, kriging, posterior mean, predictive uncertainty, marginal likelihood, kernlab, gausspr, R"
post_type: "LESSON"
curriculum_id: "6.140.4"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-advanced-supervised"
course_title: "Advanced Supervised Learning"
course_lesson: "4"
course_total: "8"
course_landing: "R-Advanced-Supervised-Learning-Course.html"
course_next: "Stacking-and-the-Super-Learner.html"
course_prev: "Regularized-Discriminant-Analysis.html"
---

=== step === cover
::eyebrow Lesson 4 of 8
## Gaussian Processes for Regression

In Lesson 3 you steadied a classifier on thin data by blending two covariance estimates. This lesson stays in the thin-data world but changes jobs: regression, where the model must not only predict a number but admit how sure it is.

Meet Asha, a process engineer at a small ceramics factory. She needs the kiln temperature that maximizes glaze hardness. Each test firing ties up the kiln for a full day, so her entire dataset is **six firings**: temperatures from 880 to 1180 degrees Celsius, hardness measured in Vickers (HV) for each. Between 1000 and 1140 degrees there is a 140 degree stretch where she has never fired at all. Before she books another kiln day, she wants two things from a model: its best guess at every untried temperature, and an honest admission of **where that guess is shaky**.

That is exactly what a Gaussian process (GP) delivers: a prediction curve plus a band that pinches tight at her six firings and flares wide in the gap. By the end of this lesson you will be able to:

- Explain what "a distribution over functions" means and how the RBF kernel encodes "close temperatures give similar hardness"
- Compute the GP posterior mean and its predictive uncertainty from the kernel matrix, in a few lines of base R
- Read a GP band: why it pinches to roughly the noise level at a data point, flares in gaps, and returns to the prior far away
- Tune the lengthscale with the log marginal likelihood, and spot the overconfidence a wrong lengthscale causes

**Prerequisites:** the [kernel trick lesson](Kernel-SVMs-and-the-Kernel-Trick.html) (the RBF kernel as a similarity score; here it takes on a second role), ordinary [linear regression](Linear-Regression.html), the normal distribution (mean, sd, and what a 95% interval is), and the bias-variance trade-off from the ML Workflow course.

The interactive below is the whole lesson in miniature: a GP fit to six points, its 95% band pinching at the data and flaring between and beyond it. Toggle the lengthscale and watch the fit change character; we will build every part of this picture from scratch.

::widget gp-posterior {}

=== step === concept
::eyebrow The problem
## A prediction without a confession

Every regression tool you have met so far hands back one curve. Let us see what that costs Asha. Each lesson runs in a fresh R session, so we start by typing in her lab notebook: six firings, six hardness readings.

```r
library(ggplot2)

kiln <- data.frame(
  temp     = c(880, 920, 970, 1000, 1140, 1180),  # firing temperature, deg C
  hardness = c(448, 502, 561, 584, 573, 522)      # glaze hardness, Vickers HV
)
kiln
#>   temp hardness
#> 1  880      448
#> 2  920      502
#> 3  970      561
#> 4 1000      584
#> 5 1140      573
#> 6 1180      522
```

Hardness climbs to 584 at 1000 degrees, then is already falling by 1140. The peak Asha wants is probably somewhere inside the gap she never fired. Fit the standard tool, a quadratic regression (one parabola through the points), and ask it about three temperatures: 970 (right next to a firing), 1070 (the middle of the gap), and 1250 (past her hottest firing, into territory the kiln has never seen).

```r
fit_lm <- lm(hardness ~ poly(temp, 2), data = kiln)   # an ordinary curved (quadratic) fit
new_temps <- data.frame(temp = c(970, 1070, 1250))
round(predict(fit_lm, new_temps, interval = "prediction"), 1)
#>     fit   lwr   upr
#> 1 562.2 541.4 583.0
#> 2 599.5 577.4 621.5
#> 3 417.8 379.3 456.4
```

Look closely at the interval widths. At 970, where a real firing sits 30 degrees away, the interval is about 42 HV wide. At 1070, the centre of a 140 degree hole in the data, it is about 44 HV wide. **Nearly identical.** The parabola is just as confident where Asha has no evidence as where she has plenty, because its confidence comes from trusting the parabola shape everywhere. And at 1250 it calmly announces that hardness collapses to 418, a strong claim about a region it has never seen.

```r
curve_df <- data.frame(temp = seq(850, 1250, by = 5))
curve_df$hardness <- predict(fit_lm, curve_df)
ggplot(kiln, aes(temp, hardness)) +
  annotate("rect", xmin = 1000, xmax = 1140, ymin = -Inf, ymax = Inf,
           alpha = 0.08, fill = "#2563a8") +
  geom_line(data = curve_df, colour = "#b5631a", linewidth = 1) +
  geom_point(size = 3) +
  labs(title = "One confident curve, even where Asha never fired",
       x = "firing temperature (deg C)", y = "glaze hardness (HV)") +
  theme_minimal(base_size = 13)
```

The shaded strip is the no-data gap, and the curve sails through it without blinking. What Asha needs is a model whose uncertainty is **local**: small where firings exist, large where they do not. That requires a different starting point entirely.

=== step === concept
::eyebrow The idea
## A distribution over functions

Here is the mental shift. Instead of picking one curve and defending it, a Gaussian process starts from **all** smooth curves that could plausibly relate temperature to hardness, and treats the true one as an unknown draw from that collection. Before seeing any data, every plausible curve is on the table; this collection-with-probabilities is called the **prior** (what the model believes before evidence). Data will then eliminate the curves that disagree with the six firings, and whatever spread remains at each temperature IS the uncertainty.

But "all plausible curves" needs a precise definition, and one number does the defining. A Gaussian process says: pick any set of temperatures, and the hardness values there follow a joint normal distribution whose covariance between two temperatures \(x\) and \(x'\) is given by a **kernel function**. Ours is the RBF (radial basis function) kernel you met in the SVM lesson, now playing a new role, covariance rather than classifier similarity:

\[ k(x, x') = \sigma_f^2 \exp\!\left( -\frac{(x - x')^2}{2\ell^2} \right) \]

Read every symbol. \(x\) and \(x'\) are two firing temperatures. \(\sigma_f\) (sigma-f, the **signal sd**) is how far hardness can plausibly swing away from its average level; we will use 50 HV, close to the spread in Asha's notebook. \(\ell\) (ell, the **lengthscale**) is the distance in degrees over which two firings stop resembling each other; we will start at 60 degrees. The kernel returns a covariance: large when the temperatures are close (their hardness values must move together), near zero when far apart (free to differ). In plain words: **glaze fired at 960 should be about as hard as glaze fired at 970, but 1180 owes 880 nothing.**

```r
k_rbf <- function(a, b, sigf, l) sigf^2 * exp(-outer(a, b, "-")^2 / (2 * l^2))
sigf <- 50   # signal sd: how far hardness can swing around its average (HV)
l    <- 60   # lengthscale: how far apart two firings stop resembling each other (deg C)

# similarity between two firings 40, 140 and 300 degrees apart:
round(exp(-c(40, 140, 300)^2 / (2 * l^2)), 3)
#> [1] 0.801 0.066 0.000
```

Two firings 40 degrees apart share 80% of their variation. Across the 140 degree gap, less than 7%. Across 300 degrees, essentially nothing. That fading similarity is the entire model.

To see what this prior actually believes, we can draw whole curves from it: build the kernel matrix over a fine temperature grid, then use its Cholesky factor (a matrix square root) to turn independent normal noise into correlated, smooth curves.

```r
xs <- seq(850, 1250, by = 5)                            # a fine grid of temperatures
Kp <- k_rbf(xs, xs, sigf, l) + 1e-8 * diag(length(xs))  # tiny jitter keeps chol() stable

set.seed(9)
draws <- t(chol(Kp)) %*% matrix(rnorm(length(xs) * 3), ncol = 3)
prior_df <- data.frame(temp = rep(xs, 3),
                       hardness = as.vector(draws) + 532,  # centred on a typical hardness
                       draw = factor(rep(1:3, each = length(xs))))
ggplot(prior_df, aes(temp, hardness, colour = draw)) +
  geom_line(linewidth = 0.9, show.legend = FALSE) +
  geom_point(data = kiln, aes(temp, hardness), inherit.aes = FALSE, size = 3) +
  labs(title = "Three curves drawn from the prior, before seeing any data",
       x = "firing temperature (deg C)", y = "glaze hardness (HV)") +
  theme_minimal(base_size = 13)
```

Three perfectly plausible hardness curves: smooth, wandering within about plus or minus 100 HV of the centre (that is \(2\sigma_f\)), each forgetting its own level after a couple of lengthscales. Notice that none of them passes through Asha's black points. Of course not: the prior has not met the data yet. Making the curves obey the data is the next step.

[KEY INSIGHT]
A kernel is a prior over functions stated as one line of math. Choosing \(\sigma_f\), \(\ell\), and the kernel shape IS the modeling assumption, in the same way "it is a parabola" was the quadratic fit's assumption. The difference: the GP assumption is only about smoothness, not about global shape, and it will confess ignorance wherever the data leaves it unconstrained.

=== step === concept
::eyebrow The posterior
## Condition on the six firings

Now keep only the prior curves that agree with the notebook. "Agree" allows for measurement noise: Asha's hardness tester repeats to about \(\sigma_n = 8\) HV (sigma-n, the **noise sd**), so a surviving curve must pass within roughly 8 HV of each reading, not exactly through it. The curves that survive this filter are the **posterior**: the prior updated by evidence. Because everything is jointly normal, the surviving collection is again a normal distribution at every temperature, and its mean and sd have closed formulas. For a new temperature \(x_*\):

\[ \mu_* = K_* \, K^{-1} y, \qquad \sigma_*^2 = k(x_*, x_*) - K_* \, K^{-1} K_*^\top \]

Every symbol in words: \(y\) is the vector of six hardness readings (centred, so the prior mean is zero). \(K\) is the 6 by 6 kernel matrix of the training firings **plus \(\sigma_n^2\) on its diagonal** (the noise allowance). \(K_*\) holds the kernel similarities between the new temperature and each of the six firings. So the posterior mean \(\mu_*\) is a weighted sum of the six readings, where the weights \(K^{-1}y\) are computed once and the similarities \(K_*\) do the reaching. The predictive variance \(\sigma_*^2\) starts at the prior variance \(k(x_*,x_*) = \sigma_f^2\) and **subtracts** whatever the six firings explain. Near a firing they explain almost everything; in the gap, very little. That subtraction is where the honest band comes from.

Ten lines of base R, no packages:

```r
sig_n <- 8                                    # tester repeatability: about 8 HV of noise
yc    <- kiln$hardness - mean(kiln$hardness)  # centre hardness so the prior mean is 0

K     <- k_rbf(kiln$temp, kiln$temp, sigf, l) + sig_n^2 * diag(6)  # 6 x 6 training kernel
Ks    <- k_rbf(xs, kiln$temp, sigf, l)                             # grid-to-training kernel
alpha <- solve(K, yc)                                              # the prediction weights
mu    <- as.numeric(Ks %*% alpha) + mean(kiln$hardness)            # posterior mean
sd_f  <- sqrt(pmax(sigf^2 - rowSums((Ks %*% solve(K)) * Ks), 0))   # predictive sd

post <- data.frame(temp = xs, mean = round(mu, 1), sd = round(sd_f, 1))
print(post[post$temp %in% c(880, 970, 1000, 1070, 1140, 1250), ], row.names = FALSE)
#>  temp  mean   sd
#>   880 451.8  7.6
#>   970 562.4  6.8
#>  1000 582.1  7.4
#>  1070 597.6 28.8
#>  1140 570.1  7.7
#>  1250 502.8 40.0
```

Read the sd column like a story. At the six firings and right next to them, the sd sits near 7, basically the tester's own noise: the model knows the curve there as well as the instrument allows. At 1070, mid-gap, the sd has quadrupled to 28.8. At 1250, beyond every firing, it reaches 40 and is heading back to the prior's 50: past the data, the GP steadily returns to "your guess is as good as mine."

One caution so the comparison with the quadratic fit stays fair. This sd describes the underlying hardness curve, not a single future firing, while `predict(..., interval = "prediction")` back in step 2 included the measurement noise. To predict a new firing, widen the GP band to \(\sqrt{\sigma_*^2 + \sigma_n^2}\): about 10.5 at 970 and 29.9 at 1070. Now the comparison is honest, and the verdict is unchanged: at 970 both tools give a band about 42 HV wide, but at 1070 the GP's grows to 117 HV while the parabola's stayed at 44.

```r
ggplot(post, aes(temp, mean)) +
  geom_ribbon(aes(ymin = mean - 1.96 * sd, ymax = mean + 1.96 * sd),
              fill = "#2563a8", alpha = 0.15) +
  geom_line(colour = "#2563a8", linewidth = 1) +
  geom_point(data = kiln, aes(temp, hardness), inherit.aes = FALSE, size = 3) +
  labs(title = "Tight at the six firings, wide where she never fired",
       x = "firing temperature (deg C)", y = "glaze hardness (HV)") +
  theme_minimal(base_size = 13)
```

This is the picture from the cover, built by hand. And it answers Asha's real question with unusual honesty: the posterior mean does bulge upward in the gap (597.6 at 1070, higher than either neighbouring firing), hinting the hardness peak may hide in there, but the band says the truth at 1070 could be anywhere from about 541 to 654. Translation: **the most valuable thing Asha can do next is fire inside the gap.** A model that tells you where it is ignorant tells you where to look.

=== step === quiz
::eyebrow Check yourself
## Why does the band pinch?

At 970 degrees, one grid point away from a real firing, the GP reports sd 6.8, yet at 1070 it reports 28.8. Why does the model claim near-certainty at 970?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Conditioning collapsed the spread there: every prior curve that survived must pass within measurement noise of the 561 observed at 970, so at that temperature the survivors barely disagree ::ok Exactly. The posterior is the set of prior curves consistent with the data. At a firing they are all pinned to within about the noise sd (8 HV), so the spread is about 7; in the gap the kernel lets them fan out, so the spread grows.
- The GP memorizes training points the way 1-nearest-neighbour does, so its error and its sd at a training temperature are exactly zero ::no The sd at 970 is 6.8, small but not zero, because the noise term keeps the model from treating the reading as exact truth. Nothing is memorized: the whole curve is constrained jointly by the kernel, which is why the sd rises smoothly, not in steps.
- The band is a fixed-width ribbon drawn around the mean curve, and the mean happens to pass close to the data points ::no The width is computed pointwise from the kernel algebra and varies from 6.8 to 40 across this single plot. A fixed-width ribbon is what the quadratic fit effectively gave, and it is exactly the failure this lesson set out to fix.

=== step === concept
::eyebrow The dial
## The lengthscale decides everything

You set \(\ell = 60\) on my say-so. It deserves suspicion: the lengthscale is the strongest assumption in the model, the same bias-variance dial you have turned in every lesson of this track. Refit the same six points at \(\ell = 15\) (only firings within a few degrees resemble each other), 60, and 300 (everything resembles everything).

```r
post_l <- function(l) {
  K  <- k_rbf(kiln$temp, kiln$temp, sigf, l) + sig_n^2 * diag(6)
  Ks <- k_rbf(xs, kiln$temp, sigf, l)
  m  <- as.numeric(Ks %*% solve(K, yc)) + mean(kiln$hardness)
  s  <- sqrt(pmax(sigf^2 - rowSums((Ks %*% solve(K)) * Ks), 0))
  data.frame(temp = xs, mean = m, sd = s, setting = paste("lengthscale =", l))
}
sweep3 <- rbind(post_l(15), post_l(60), post_l(300))
sweep3$setting <- factor(sweep3$setting,
  levels = c("lengthscale = 15", "lengthscale = 60", "lengthscale = 300"))

ggplot(sweep3, aes(temp, mean)) +
  geom_ribbon(aes(ymin = mean - 1.96 * sd, ymax = mean + 1.96 * sd),
              fill = "#2563a8", alpha = 0.15) +
  geom_line(colour = "#2563a8", linewidth = 0.9) +
  geom_point(data = kiln, aes(temp, hardness), inherit.aes = FALSE, size = 1.6) +
  facet_wrap(~ setting) +
  labs(x = "firing temperature (deg C)", y = "glaze hardness (HV)") +
  theme_minimal(base_size = 12)
```

Same data, three different worldviews. At \(\ell = 15\) the mean spikes at each firing and slumps back to the flat average between them: the model forgets each observation within a few degrees, so it wiggles locally and panics everywhere else. At \(\ell = 300\) the mean is a stiff, gentle arc and the band is skinny everywhere, even mid-gap: if everything resembles everything, six points feel like abundant coverage. Put numbers on that danger, the mid-gap sd under each setting:

```r
sapply(c(15, 60, 300), function(l) round(post_l(l)$sd[xs == 1070], 1))
#> [1] 50.0 28.8  5.0
```

[WARNING]
The long lengthscale claims sd 5 at a temperature Asha never fired, a tighter claim than the tester's own 8 HV of noise. An overlong lengthscale does not just smooth the mean; it manufactures false confidence exactly where honesty matters most. The band is only as truthful as the dial behind it. This is the same short-versus-long trade you can feel in the cover interactive's toggle.

=== step === tryit
::eyebrow Your turn
## The one line that makes the prediction

All of GP prediction funnels through one line: turning the training kernel matrix `K` and the centred readings `yc` into the weight vector `alpha`, by solving the linear system \(K\alpha = y\). Fill in the blank (both objects are still in your session), and the second line will predict the mid-gap hardness at 1070 degrees.

```r
alpha <- ____
round(as.numeric(k_rbf(1070, kiln$temp, sigf, l) %*% alpha) + mean(kiln$hardness), 1)
```
::check {"regex":"solve[^)]*K","gate":true,"difficulty":"intermediate","ok":"That is the heart of the GP: alpha = K inverse times y, computed the stable way. Every prediction is then just similarities times these six weights, which is why it lands on 597.6, the same mid-gap value as the table.","no":"Solve the linear system K alpha = yc. In R that is solve(K, yc), which computes K inverse times yc without forming the inverse explicitly."}
::solution
```r
alpha <- solve(K, yc)
round(as.numeric(k_rbf(1070, kiln$temp, sigf, l) %*% alpha) + mean(kiln$hardness), 1)
#> [1] 597.6
```

=== step === concept
::eyebrow Let the data decide
## Tuning the dial with the marginal likelihood

Cross-validation could pick \(\ell\), but with six points there is barely anything to hold out. GPs carry their own tuning instrument: the **log marginal likelihood**, the log-probability of the six readings under the prior that a given \(\ell\) defines, with every possible curve averaged over. For centred readings \(y\) and the noise-augmented kernel matrix \(K\):

\[ \log p(y \mid \ell) = -\tfrac{1}{2} y^\top K^{-1} y \;-\; \tfrac{1}{2} \log |K| \;-\; \tfrac{n}{2} \log 2\pi \]

Two working parts (the third term is a constant, with \(n = 6\)). The first term, \(-\tfrac12 y^\top K^{-1} y\), rewards a kernel that finds the data unsurprising: it is a fit term. The second, \(-\tfrac12 \log |K|\) where \(|K|\) is the determinant (the volume of outcomes the prior spreads itself over), **penalizes a kernel that could explain anything**. A wiggly short-\(\ell\) prior spreads over a huge volume of curves, so it pays a big penalty; a rigid long-\(\ell\) prior concentrates on few curves, so if the data disagrees the fit term punishes it. The best \(\ell\) balances the two, an automatic Occam's razor. Sweep it:

```r
log_ml <- function(l) {
  K <- k_rbf(kiln$temp, kiln$temp, sigf, l) + sig_n^2 * diag(6)
  fit_term   <- -0.5 * sum(yc * solve(K, yc))               # reward: K explains the data
  complexity <- -0.5 * as.numeric(determinant(K)$modulus)   # penalty: K spreads too wide
  fit_term + complexity - 3 * log(2 * pi)                   # n/2 = 3 for the constant
}
grid <- data.frame(lengthscale = seq(20, 200, by = 5))
grid$logML <- sapply(grid$lengthscale, log_ml)
grid$lengthscale[which.max(grid$logML)]
#> [1] 70
```

```r
ggplot(grid, aes(lengthscale, logML)) +
  geom_line(colour = "#2563a8", linewidth = 1) +
  geom_vline(xintercept = 70, linetype = 2) +
  labs(title = "The data votes for a lengthscale near 70 degrees",
       x = "lengthscale (deg C)", y = "log marginal likelihood") +
  theme_minimal(base_size = 13)
```

The curve climbs away from the twitchy short lengthscales, peaks near 70, then falls off a cliff toward the overconfident long ones (by \(\ell = 300\) it is catastrophically low; the stiff prior is genuinely shocked by the data's rise and fall). Our hand-picked 60 was close to the data's own choice of 70. In practice you tune \(\sigma_f\) and \(\sigma_n\) the same way, usually all three at once with an optimizer rather than a grid.

=== step === concept
::eyebrow In practice
## One package call, and when a GP breaks

You have now built everything a GP package does. In day-to-day work, `kernlab` wraps it in one call with the same formula interface as `lm()`. Two translation notes, because they bite: `gausspr()` standardizes the inputs before fitting, so our 60 degree lengthscale must be converted to standardized units, and its `rbfdot` kernel writes the RBF as \(\exp(-\sigma (x - x')^2)\), so \(\sigma = 1 / (2\ell^2)\).

```r
library(kernlab)

l_scaled <- 60 / sd(kiln$temp)   # gausspr standardizes inputs; convert our 60 degrees
fit_gp <- gausspr(hardness ~ temp, data = kiln, kernel = "rbfdot",
                  kpar = list(sigma = 1 / (2 * l_scaled^2)),  # rbfdot: sigma = 1/(2 l^2)
                  var  = 64 / var(kiln$hardness))             # noise, in scaled-y units
round(as.numeric(predict(fit_gp, new_temps)), 1)
#> [1] 562.4 598.1 502.6
```

Within a hardness point of our hand-built 562.4, 597.6 and 502.8; the sliver of difference is kernlab using the sample variance as its signal variance where we chose 50 squared. For the uncertainty band, keep the ten honest lines you wrote in this lesson; `gausspr`'s variance interface is limited, and you now know the band is just one more `solve()` away.

So when do you reach for a GP, and when do you run from it?

| Tool | Prediction | Uncertainty | Comfortable n |
|---|---|---|---|
| Quadratic lm | one global shape | trusts that shape everywhere, even in gaps | huge |
| Random forest | flexible | rough add-ons, often poorly calibrated | large |
| Gaussian process | flexible and smooth | widens off the data by construction | small to a few thousand |

**Reach for a GP** when observations are few and expensive, and knowing where you are ignorant is worth real money: lab experiments like Asha's, simulator calibration, drug dose-response, and, in two lessons, hyperparameter search, where a GP stands in for an expensive model-training run. **It breaks** in three known ways. First, cost: prediction runs through `solve()` on an n by n matrix, whose work grows with the cube of n, so tens of thousands of rows need sparse approximations or a different tool. Second, the kernel is the assumption: fit an RBF to seasonal data and both the mean and the band will be confidently wrong (kernels exist for periodic, linear-trend, and rougher behaviour; see the references). Third, as you saw at \(\ell = 300\), an untuned dial silently converts honest uncertainty into false confidence.

=== step === quiz
::eyebrow Check yourself
## Is the band a guarantee?

A colleague looks at Asha's plot and says: "Nice. So by definition, 95% of all future firings will land inside that band, whatever kernel and lengthscale you happened to pick." Are they right?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Yes: the band is mean plus or minus 1.96 sd, and 1.96 sd covers 95% of any normal distribution, so the coverage holds automatically ::no The 1.96 arithmetic is correct inside the model, and that is precisely the catch: the sd it multiplies is computed from the kernel. If the kernel or its dials misdescribe reality, the model's normal distribution is not the one future firings are drawn from. And even under a perfect kernel, the plotted band describes the curve; covering future firings needs the tester noise added back in.
- No: the band is honest only conditional on the kernel and its tuned dials; at lengthscale 300 the model claimed sd 5 in the mid-gap while lengthscale 60 said 28.8, and nothing inside either model flags which claim to trust ::ok Right. The band inherits every assumption behind it, which is why you tuned the lengthscale with the marginal likelihood and why, with data to spare, you would still check coverage on held-out points. Honest uncertainty is conditional honesty.
- No, but only because six points are too few; once Asha has twenty firings, any reasonable kernel's 95% band can be taken at face value ::no More data tightens and stabilizes the band near the data, but a misspecified kernel keeps making confident, wrong claims in unexplored regions, like the RBF fit to seasonal data. Sample size does not repair a wrong assumption; checking the kernel does.

=== step === concept
::eyebrow Go deeper
## References

Four solid places to take this further:

- [Rasmussen and Williams, "Gaussian Processes for Machine Learning" (free book)](https://gaussianprocess.org/gpml/) - the canonical text; chapter 2 is exactly this lesson's math, with the marginal likelihood in chapter 5.
- [A Visual Exploration of Gaussian Processes (Distill)](https://distill.pub/2019/visual-exploration-gaussian-processes/) - interactive priors, posteriors, and kernels; the best complement to the widget on the cover.
- [The Kernel Cookbook (David Duvenaud)](https://www.cs.toronto.edu/~duvenaud/cookbook/) - what each kernel family assumes and how to combine them, for the day RBF is the wrong shape.
- [kernlab on CRAN](https://cran.r-project.org/package=kernlab) - the package behind `gausspr()`, with the kernel zoo (`rbfdot`, `polydot`, and friends) documented.

=== step === complete
## Lesson 4 complete

You can now do what almost no other regression tool does: predict and confess in the same breath. You watched a quadratic fit stay equally confident inside a 140 degree data hole, rebuilt the fix from one line of math (the RBF kernel as a prior over smooth curves), conditioned it on six kiln firings with a handful of base R lines, and got a posterior mean plus a band that pinches to the tester's noise at the data and flares to near-prior width beyond it. You felt the lengthscale act as the bias-variance dial, caught the long-lengthscale fit manufacturing false certainty, let the marginal likelihood pick the dial honestly, and matched it all with a one-call `kernlab` fit.

Next, Lesson 5: Stacking and the Super Learner. You now have several strong, very different learners in hand: SVMs, discriminant blends, GPs, forests. Instead of crowning one winner, we will let cross-validation blend them into a stack that outperforms every single one of them.
