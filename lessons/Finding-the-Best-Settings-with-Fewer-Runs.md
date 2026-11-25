---
title: "Experimental Design and A/B Testing Lesson 7: Finding the best settings with fewer runs"
catalog_blurb: "How to find the best settings for two factors without testing every combination."
description: "A coffee roaster hunts the best roast temperature and time with a central composite design, then a sequential search needing far fewer roasts than a grid."
keywords: "response surface methodology, central composite design, factorial design, curvature check, confirmation run, Bayesian optimization, Expected Improvement, Gaussian process, sequential design, design of experiments"
post_type: "LESSON"
curriculum_id: "4.120.7"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "res-design"
course_title: "Experimental Design and A/B Testing"
course_lesson: "7"
course_total: "8"
course_landing: "Experimental-Design-and-A-B-Testing-Course.html"
course_next: "Writing-Down-the-Analysis-Before-the-Data"
course_prev: "A-B-Tests-and-the-Cost-of-Peeking"
---

=== step === cover
## Finding the best settings with fewer runs

Today let's look at how to find the best setting for something you can tune, without testing every combination it could take.

Elena roasts coffee for a living. Two things on her roaster decide how a batch turns out: the roast temperature, somewhere between 200 and 220 degrees Celsius, and the roast time, somewhere between 10 and 14 minutes. After every batch, a coffee quality panel tastes it and scores it on the 100-point cupping scale panels actually use. Elena wants the temperature and time that score the highest.

Just for this lesson, we're going to fix where the real best setting sits: temperature 210, time 12, a cupping score of 86. Elena never gets to see this number. It's an answer key, there only so that we can grade how close each of her searches actually gets.

She starts simple. Four roasts at the corners of her two ranges, crossing 200 or 220 degrees with 10 or 14 minutes, plus her usual setting of 210 and 12, repeated three times to see how much one roast's score wobbles on its own.

Here's where those seven roasts sit, before we look at how any of them scored.

::widget chart-plotter {"data":[{"x":200,"y":10,"fill":"corner"},{"x":200,"y":14,"fill":"corner"},{"x":220,"y":10,"fill":"corner"},{"x":220,"y":14,"fill":"corner"},{"x":210,"y":12,"fill":"center"},{"x":210,"y":12,"fill":"center"},{"x":210,"y":12,"fill":"center"}],"geoms":["point"],"x":"Temp","y":"Time"}

Four roasts sit in the corners of her two ranges, and three sit stacked right in the middle. That's the shape every design in this lesson will start from.

=== step === concept
## What a full grid of settings would actually cost

Before we get to Elena's seven roasts, let's see what the obvious approach would have cost her.

The obvious way to find the best setting is to just try everything: lay a grid over both ranges and taste a roast at every combination. Let's see how big that grid gets using just 9 settings for each factor, temperature and time.

```r
# Build a 9 by 9 grid over the roast temperature and time ranges, and count the roasts it needs
grid9 <- expand.grid(Temp = seq(200, 220, length.out = 9), Time = seq(10, 14, length.out = 9))
nrow(grid9)
#> [1] 81
```

That's eighty-one roasts, just to cover two factors at nine settings each. Coffee is forgiving compared to a lot of real experiments: a batch costs Elena a bag of beans and twenty minutes. In a clinical trial, a factory line, or a chemical process, a single run can cost real money or take days, and eighty-one of them is not a plan, it's a wall of work.

A response surface takes a different approach. Instead of tasting every combination, it fits a smooth model to a handful of roasts placed on purpose, and lets that model do the searching from there. Elena's seven roasts are exactly that handful.

=== step === concept
## A screening design can tell you curvature exists, but not its shape

Here's what those seven roasts actually scored.

```r
# Taste 7 roasts (4 corners plus the center setting repeated 3 times), then fit a flat model
true_q <- function(Temp, Time) 86 - 0.02 * (Temp - 210)^2 - 0.75 * (Time - 12)^2

set.seed(42)
Temp1 <- c(200, 200, 220, 220, 210, 210, 210)
Time1 <- c(10, 14, 10, 14, 12, 12, 12)
design1 <- c("corner", "corner", "corner", "corner", "center", "center", "center")
y1 <- round(true_q(Temp1, Time1) + rnorm(7, sd = 1), 2)
y1
#> [1] 82.37 80.44 81.36 81.63 86.40 85.89 87.51

corner_mean <- mean(y1[design1 == "corner"])
center_mean <- mean(y1[design1 == "center"])
round(c(corner_mean = corner_mean, center_mean = center_mean), 2)
#> corner_mean center_mean 
#>       81.45       86.60 

fit1 <- lm(y1 ~ Temp1 + Time1)
round(coef(fit1), 4)
#> (Intercept)       Temp1       Time1 
#>     85.2021      0.0045     -0.2075 
```

The four corners averaged 81.45. The three repeats at the center averaged 86.60, a full 5.15 points higher. A single roast's score typically wobbles by about a point, not five, so that gap is too big to wave away as noise.

Fit the simplest model to all seven roasts: just a flat plane, one slope for temperature and one for time. The slopes come back at 0.0045 and -0.2075, both close to flat. Looking only at those two slopes, you'd conclude temperature and time barely matter.

But a flat plane cannot explain the center jump on its own terms. Temperature 210 sits exactly halfway between 200 and 220, and time 12 sits exactly halfway between 10 and 14, so if the true surface really were flat, its score at the center would just be the average of its score at the four corners, about 81.45. It actually came in at 86.60. The surface bends, and statisticians call that bend curvature.

So the seven roasts prove curvature is real. But can they tell you its shape, how much comes from temperature and how much from time? Look at the numbers behind the check you just ran: at every corner, temperature sits exactly 10 degrees from 210, so temperature's squared distance from center is always 100, whether temperature is 200 or 220. Time's squared distance is always 4 the same way.

Both squared terms freeze at one value across the four corners, so a model fit to the corners alone cannot tell them apart from a plain constant. Adding the center point back in only buys one more number, the curvature check you just computed, enough to prove something bends but not enough to split that one number into a temperature effect and a time effect. That's as far as a screening design like this one can take you.

=== step === concept
## Adding axial runs turns the screening design into a central composite design

The fix is to give temperature and time a third value each, one that isn't just a corner or the center.

Elena roasts four more batches, one at each "face center". Temperature gets pushed out to 200 or 220 while time stays at the safe middle of 12, and time gets pushed out to 10 or 14 while temperature stays at the safe middle of 210. Mixed with the seven roasts she already has, that's 11 roasts in total.

Statisticians call this shape a central composite design: a factorial at the corners, a center point, and these four "axial" or "star" points sitting out on each factor's own axis.

```r
# Add 4 axial roasts at the face centers, making 11 runs, and fit a full quadratic surface
TempA <- c(200, 220, 210, 210)
TimeA <- c(12, 12, 10, 14)
yA <- round(true_q(TempA, TimeA) + rnorm(4, sd = 1), 2)
yA
#> [1] 83.91 86.02 82.94 84.30

Temp2 <- c(Temp1, TempA)
Time2 <- c(Time1, TimeA)
y2 <- c(y1, yA)
quad <- lm(y2 ~ Temp2 + Time2 + I(Temp2^2) + I(Time2^2) + Temp2:Time2)
round(coef(quad), 4)
#> (Intercept)       Temp2       Time2  I(Temp2^2)  I(Time2^2) Temp2:Time2 
#>   -814.3305      7.7578     13.7695     -0.0192     -0.8154      0.0275 

round(summary(quad)$r.squared, 3)
#> [1] 0.918
```

Temperature and time now each take three distinct values instead of two, so their squared terms are finally free to vary on their own instead of being frozen. That lets the model estimate a full quadratic surface:

\( \hat y = b_0 + b_1\,\text{Temp} + b_2\,\text{Time} + b_{11}\,\text{Temp}^2 + b_{22}\,\text{Time}^2 + b_{12}\,\text{Temp}\cdot\text{Time} \)

The hat over y marks it as the model's own prediction, not a tasted score. Fitted to the 11 roasts, this surface reaches an R-squared of 0.918, meaning it accounts for 91.8% of how the scores varied. That's real structure, from a shape whose flat-plane predecessor had slopes that looked like nothing was going on at all.

The Temp:Time term is what lets the best time shift depending on which temperature you're roasting at, instead of forcing one fixed best time regardless of temperature.

=== step === concept
## Finding the fitted surface's peak, and confirming it with a real run

A smooth surface like this one has a single highest point, and you can find it without searching the whole range. At the peak, nudging temperature up or down does not change the score, and neither does nudging time: both slopes are exactly zero there, at the same setting.

Those two slopes come straight out of the fitted coefficients, so finding the peak means solving both of them at once:

\[ \begin{pmatrix} 2b_{11} & b_{12} \\ b_{12} & 2b_{22} \end{pmatrix} \begin{pmatrix} \text{Temp} \\ \text{Time} \end{pmatrix} = \begin{pmatrix} -b_1 \\ -b_2 \end{pmatrix} \]

R's `solve()` does exactly that.

```r
# Solve for the surface's peak, then taste one more roast exactly there to confirm it
b1  <- coef(quad)[["Temp2"]]
b2  <- coef(quad)[["Time2"]]
b11 <- coef(quad)[["I(Temp2^2)"]]
b22 <- coef(quad)[["I(Time2^2)"]]
b12 <- coef(quad)[["Temp2:Time2"]]

A_mat <- matrix(c(2 * b11, b12, b12, 2 * b22), nrow = 2, byrow = TRUE)
peak <- solve(A_mat, c(-b1, -b2))
round(peak, 2)
#> [1] 211  12

pred_at_peak <- unname(predict(quad, newdata = data.frame(Temp2 = peak[1], Time2 = peak[2])))
round(pred_at_peak, 2)
#> [1] 86.73

confirm_y <- round(true_q(peak[1], peak[2]) + rnorm(1, sd = 1), 2)
confirm_y
#> [1] 88.27
```

Solving it lands the peak at temperature 211 and time 12, with the surface predicting a score of 86.73 there.

That prediction comes entirely from the fitted model, so it's worth checking against reality. Elena roasts one more batch at exactly that setting, a run the model never saw, and it comes back at 88.27. A model's prediction and a single confirmation roast will rarely match exactly, since one roast still carries its own point-or-so wobble, but landing in the same neighborhood is what tells you the surface found something real, not just noise.

=== step === widget
## Choosing each run from what you already know: Expected Improvement

Eleven roasts, laid out in advance, got Elena to a peak she could trust. But what if, instead of deciding every roast's setting up front, she chose each new roast using everything the earlier ones already told her?

That takes two new ideas. The first is a surrogate model: a cheap stand-in that, at every setting you could try, gives you both a best guess at the score and how much uncertainty surrounds that guess. The guess stays tight near settings already tried and widens everywhere else, and the kind used here is called a Gaussian process.

The second idea is a rule for turning that guess-plus-uncertainty into one choice: which untried setting to taste next. That rule is Expected Improvement, and it scores every candidate by how much it could beat the best score found so far, weighing a high predicted score against a wide band of uncertainty. A setting with a merely-good guess but a lot of uncertainty can beat a setting with a slightly better guess that's already well pinned down, because the uncertain one still has a real chance of turning out best.

The widget below uses its own built-in curve, standing in for the roast's score against one knob at a time, say roast time alone with temperature already fixed near its best setting. A single curve is easier to watch than two surfaces moving together, but the idea carries over unchanged.

::widget bayesopt-acq {}

Press "Next sample" a few times. Watch the blue Expected Improvement curve: its peak marks where the search goes next, and that peak keeps relocating as each new sample narrows the uncertainty band near wherever it just looked. After a handful of samples it locks onto the curve's true high point, then spends one more sample double-checking the runner-up before settling.

=== step === quiz
## Quick check: what Expected Improvement is actually trading off

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- It always samples where the predicted mean is highest, since that is the setting most likely to score well. ::no
- It balances a high predicted mean against a wide band of uncertainty, so either a promising spot or a wide-open unexplored one can win. ::ok Right. Expected Improvement rewards both: a setting the surrogate already expects to score well, and a setting it simply hasn't tried yet, where the band is wide enough that the true score could still turn out to be the best one seen.
- It samples at random, just to make sure the whole range eventually gets explored. ::no Expected Improvement is not greedy and it is not random. It scores every untried setting by how much it could beat the best result found so far, which rewards a high predicted mean only when the band around it is not already narrow and confident, and rewards a wide band only where the predicted mean is still in contention.

=== step === concept
## Running the same sequential idea on the real two-factor problem

The widget searched one knob. Elena's real problem has two, temperature and time together, so the same Gaussian-process-plus-Expected-Improvement loop needs to run over both at once.

```r
# Pick each new roast with a Gaussian process surrogate plus Expected Improvement
library(kernlab)

norm_T  <- function(Temp) (Temp - 210) / 10
norm_Ti <- function(Time) (Time - 12) / 2
rbf2 <- function(X, Z, s) {
  n1 <- nrow(X); n2 <- nrow(Z); D2 <- matrix(0, n1, n2)
  for (k in 1:ncol(X)) D2 <- D2 + outer(X[, k], Z[, k], FUN = function(p, q) (p - q)^2)
  exp(-s * D2)
}
S <- 2    # kernel lengthscale, fixed for the whole search

set.seed(7)
Temp3 <- runif(3, 200, 220)
Time3 <- runif(3, 10, 14)
y3 <- round(true_q(Temp3, Time3) + rnorm(3, sd = 1), 2)

TempG <- seq(200, 220, length.out = 41)
TimeG <- seq(10, 14, length.out = 41)
cand <- expand.grid(Temp = TempG, Time = TimeG)
candX <- cbind(norm_T(cand$Temp), norm_Ti(cand$Time))

for (i in 1:12) {
  X <- cbind(norm_T(Temp3), norm_Ti(Time3))
  ybar <- mean(y3); ysd <- sd(y3); ys <- (y3 - ybar) / ysd
  Vs <- (1 / ysd)^2                                    # noise variance, standardized scale
  fit <- gausspr(X, ys, kernel = "rbfdot", kpar = list(sigma = S), var = Vs, scaled = FALSE)
  mu_s <- as.numeric(predict(fit, candX))

  K  <- rbf2(X, X, S) + Vs * diag(length(y3))
  Ki <- solve(K)
  Ks <- rbf2(candX, X, S)
  v_s <- 1 - rowSums((Ks %*% Ki) * Ks)                 # posterior variance, standardized scale
  sd_s <- sqrt(pmax(v_s, 1e-9))

  mu  <- mu_s * ysd + ybar                             # back to raw cupping-score units
  sdv <- sd_s * ysd
  best <- max(y3)
  z <- (mu - best) / sdv
  ei <- (mu - best) * pnorm(z) + sdv * dnorm(z)        # Expected Improvement at every candidate

  pick <- which.max(ei)
  Tn <- cand$Temp[pick]; Tin <- cand$Time[pick]
  yn <- round(true_q(Tn, Tin) + rnorm(1, sd = 1), 2)
  Temp3 <- c(Temp3, Tn); Time3 <- c(Time3, Tin); y3 <- c(y3, yn)
}

bi <- which.max(y3)
round(c(Temp = Temp3[bi], Time = Time3[bi], score = y3[bi]), 2)
#>   Temp   Time  score 
#> 211.50  12.40  88.12 

length(y3)
#> [1] 15

round(true_q(Temp3[bi], Time3[bi]), 2)
#> [1] 85.83

5^(2:5)
#> [1]   25  125  625 3125
```

Starting from three random roasts, Expected Improvement picked twelve more, one at a time, always at whichever untried setting balanced a promising guess against real uncertainty. Fifteen roasts in total found a setting at temperature 211.50, time 12.40. Elena tasted it at 88.12, and on the fixed surface this lesson has been grading against, that setting is really worth 85.83, just 0.17 off the true peak of 86.

Now compare that to a grid. A 5-level grid over 2 factors needs 25 roasts, and that climbs to 125 for 3 factors, 625 for 4, and 3125 for 5, since each new factor multiplies a grid's cost by the number of levels again. A sequential design doesn't work that way: you choose its run budget directly, 15 roasts or 50, whatever you can afford, and that number does not have to multiply just because another factor joined the search. That's why the gap between a grid and a sequential design only grows as more factors pile up.

=== step === widget
## Where each design actually placed its runs

One picture can show how differently these three designs spent their roasts.

::widget facet-grid {"data":[{"x":200,"y":10,"facet":"factorial"},{"x":200,"y":14,"facet":"factorial"},{"x":220,"y":10,"facet":"factorial"},{"x":220,"y":14,"facet":"factorial"},{"x":210,"y":12,"facet":"factorial"},{"x":210,"y":12,"facet":"factorial"},{"x":210,"y":12,"facet":"factorial"},{"x":200,"y":10,"facet":"central-composite"},{"x":200,"y":14,"facet":"central-composite"},{"x":220,"y":10,"facet":"central-composite"},{"x":220,"y":14,"facet":"central-composite"},{"x":210,"y":12,"facet":"central-composite"},{"x":210,"y":12,"facet":"central-composite"},{"x":210,"y":12,"facet":"central-composite"},{"x":200,"y":12,"facet":"central-composite"},{"x":220,"y":12,"facet":"central-composite"},{"x":210,"y":10,"facet":"central-composite"},{"x":210,"y":14,"facet":"central-composite"},{"x":219.78,"y":10.28,"facet":"sequential"},{"x":207.95,"y":10.97,"facet":"sequential"},{"x":202.31,"y":13.17,"facet":"sequential"},{"x":203.5,"y":10.8,"facet":"sequential"},{"x":203,"y":10,"facet":"sequential"},{"x":204,"y":11.6,"facet":"sequential"},{"x":200,"y":11.6,"facet":"sequential"},{"x":200,"y":11.6,"facet":"sequential"},{"x":220,"y":14,"facet":"sequential"},{"x":211.5,"y":12.4,"facet":"sequential"},{"x":213.5,"y":12.6,"facet":"sequential"},{"x":209,"y":12.4,"facet":"sequential"},{"x":210,"y":13.1,"facet":"sequential"},{"x":210.5,"y":12,"facet":"sequential"},{"x":220,"y":12.3,"facet":"sequential"}],"geom":"point","x":"Temp","y":"Time","facetVar":"design"}

The factorial panel shows four bare corners and a stack in the middle, nothing in between. The central composite panel adds a ring of four axial points around that same stack, enough to let the surface's bend show up. The sequential panel looks nothing like either one: its roasts cluster thick near the true peak, with just a few scattered out toward the edges where Expected Improvement went to double-check it wasn't missing anything better.

Three designs tackled the same two factors with three completely different spending patterns: 7, 11, and 15 roasts, 33 in total.

=== step === quiz
## Quick check: why the screening design couldn't find the peak itself

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- The center roasts were wasted, and should have been spent on more corners instead. ::no
- The factorial design used too few roasts in total; more corners would have fixed it. ::no More corners would not have helped. Every corner still sits at the same two non-center values of Temp and Time, so stacking on more of them never buys a third value to estimate curvature from.
- Temperature and time each sat at only two non-center values in that design, so their squared effects couldn't be told apart from the overall mean. ::ok Exactly. The center repeats proved curvature was there, but with only two non-center values per factor, the design had no way to split that one curvature number into a Temp effect and a Time effect, let alone locate where the surface actually peaks.

=== step === tryit
## Your turn: solve for the optimum from a fitted surface's coefficients

A quadratic surface like this one has six fitted coefficients. Fill in the blank 2 by 2 system the same way: row 1 is `(2 * b11, b12)`, row 2 is `(b12, 2 * b22)`. Then run it to recover the peak.

```r
# A quadratic surface's own fitted coefficients
b1  <- 7.7577982
b2  <- 13.7694737
b11 <- -0.0191658
b22 <- -0.8153947
b12 <- 0.0275

# Fill in the 2 by 2 system: row 1 is (2 * b11, b12), row 2 is (b12, 2 * b22)
A_mat <- matrix(c(NA, NA, NA, NA), nrow = 2, byrow = TRUE)
peak <- solve(A_mat, c(-b1, -b2))
round(peak, 2)
```
::check {"regex": "(?=[\\s\\S]*2\\s*\\*\\s*b11)(?=[\\s\\S]*2\\s*\\*\\s*b22)(?=[\\s\\S]*b12)(?=[\\s\\S]*solve[(])", "gate": true, "difficulty": "intermediate", "ok": "Right: temperature 211 and time 12, the surface's true peak, found by solving where both of its slopes hit zero at once. The off-diagonal b12 term appears twice because the surface's twist, how the best time shifts with temperature, pulls on both slopes at once.", "no": "Fill the matrix with (2 * b11, b12, b12, 2 * b22), in that order, then run it again."}
::solution
```r
# The 2 by 2 system solved: row 1 is (2*b11, b12), row 2 is (b12, 2*b22)
A_mat <- matrix(c(2 * b11, b12, b12, 2 * b22), nrow = 2, byrow = TRUE)
peak <- solve(A_mat, c(-b1, -b2))
round(peak, 2)
#> [1] 211  12
```

=== step === complete
## Fewer runs, chosen on purpose

Seven roasts, placed as a factorial, proved curvature was real: the center scored 86.60 against the corners' 81.45, a gap too big for a flat model to explain. Four more axial roasts turned that factorial into a central composite design, 11 roasts in total, and fitting a full quadratic surface to them placed the peak at temperature 211 and time 12, a prediction of 86.73 that a fresh confirmation roast backed up at 88.27.

A sequential design did the same job a different way. Instead of laying out every roast in advance, it placed each one where a Gaussian process surrogate and Expected Improvement said it was most likely to pay off, and 15 roasts in, starting from three random ones, it had already found a setting really worth 85.83, just 0.17 off the true peak of 86. Against an 81-roast grid for these same two factors, and the 625 a grid would need for four factors instead of two, that's the whole case for choosing a design on purpose instead of laying one out in advance.

=== step === concept
## References

- [On the Experimental Attainment of Optimum Conditions](https://doi.org/10.1111/j.2517-6161.1951.tb00067.x) - Box, G.E.P. and Wilson, K.B. (1951), Journal of the Royal Statistical Society, Series B, 13(1), 1-45. The founding paper for response surface methodology.
- Myers, R.H., Montgomery, D.C., and Anderson-Cook, C.M. Response Surface Methodology: Process and Product Optimization Using Designed Experiments. Wiley. The standard reference for central composite designs and curvature checks.
- Montgomery, D.C. Design and Analysis of Experiments. Wiley. Covers fractional factorial designs and why a two-level design cannot estimate curvature.
- [Efficient Global Optimization of Expensive Black-Box Functions](https://doi.org/10.1023/A:1008306431147) - Jones, D.R., Schonlau, M., and Welch, W.J. (1998), Journal of Global Optimization, 13(4), 455-492. Introduces the Expected Improvement acquisition function.
- [Practical Bayesian Optimization of Machine Learning Algorithms](https://arxiv.org/abs/1206.2944) - Snoek, J., Larochelle, H., and Adams, R.P. (2012), Advances in Neural Information Processing Systems 25. Applies the same sequential design idea to tuning model settings.
