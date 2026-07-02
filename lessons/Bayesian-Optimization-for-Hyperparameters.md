---
title: "Advanced Supervised Learning Lesson 6: Bayesian Optimization for Hyperparameters"
catalog_blurb: "Tune expensive models in a handful of evaluations by modeling the search itself."
description: "Bayesian optimization in R from scratch: a GP surrogate over CV scores, the Expected Improvement rule, and a loop that tunes a real SVM in 8 evaluations."
keywords: "bayesian optimization, hyperparameter tuning, expected improvement, acquisition function, gaussian process surrogate, exploration exploitation, grid search, random search, SVM tuning, R"
post_type: "LESSON"
curriculum_id: "6.140.6"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-advanced-supervised"
course_title: "Advanced Supervised Learning"
course_lesson: "6"
course_total: "8"
course_landing: "R-Advanced-Supervised-Learning-Course.html"
course_next: "Approximate-Nearest-Neighbors-at-Scale.html"
course_prev: "Stacking-and-the-Super-Learner.html"
---

=== step === cover
::eyebrow Lesson 6 of 8
## Bayesian Optimization for Hyperparameters

In Lesson 5 you blended several strong models into a stack, and every one of them ran on settings we took on faith. This lesson is about choosing those settings when checking a single candidate is painfully expensive.

Meet Mara, a data scientist at an insurance company. Her fraud-detection model is an RBF SVM (Lessons 1 and 2), and she needs to tune its kernel width, gamma. On her real dataset of 40,000 claims, scoring ONE candidate gamma means one full 5-fold cross-validation: about 25 minutes. A modest 20-value grid over gamma alone is more than 8 hours; add a grid over cost and it is a week of compute. Her budget before Friday's model review: roughly **8 evaluations**, overnight. Eight questions to an oracle that takes 25 minutes per answer. Which eight should she ask?

Bayesian optimization (BO) answers by spending the budget like a scientist: build a cheap model OF the search itself, use it to predict where a better setting probably hides, evaluate exactly there, and learn from every result. By the end of this lesson you will be able to:

- Frame hyperparameter tuning as expensive black-box optimization, and say precisely why grid and random search waste a small budget
- Fit a GP surrogate to a handful of (setting, CV score) pairs and read its mean and band as everything the search knows so far
- Compute Expected Improvement, the rule that decides where the next evaluation goes, and explain how it trades exploitation against exploration
- Run the full BO loop in R, read its evaluation history, and judge when BO earns its keep over blind search

**Prerequisites:** the [RBF SVM and its gamma dial](Kernel-SVMs-and-the-Kernel-Trick.html) (Lesson 2), the [GP posterior mean and its honest band](Gaussian-Processes-for-Regression.html) (Lesson 4, the engine of this lesson), and [k-fold cross-validation](Cross-Validation-Strategies.html) as an accuracy estimate.

The interactive below is the whole lesson in one loop. The dashed curve is the true objective, which in real life you can never afford to trace. The three dots are evaluations already paid for; the blue curve and band are the surrogate; the lower panel is the acquisition score that picks the next evaluation. Press Next sample a few times and watch it home in on the global peak, then keep pressing and watch it double-check the runner-up bump.

::widget bayesopt-acq {}

=== step === concept
::eyebrow The problem
## One candidate costs one full CV run

First, put the problem in your hands. Gamma, from Lesson 2, sets how far one training claim's influence reaches: a small gamma makes broad, smooth boundaries; a large gamma wraps tight islands around individual points. Somewhere between underfitting and overfitting sits the gamma Mara wants, and the only way to score a candidate is to run the full cross-validation. That makes tuning a **black-box optimization** problem: there is no formula for the curve Mara is climbing and no gradient to follow, only the right to ask, at full price, "what is the score at this setting?"

Each lesson runs in a fresh interactive R session, so we build a small replica of Mara's problem right here: 300 claims, two features, and a known fraud pattern (late-night filings of mid-size claims). Small enough that one evaluation takes about a second in your browser instead of 25 minutes, so you can afford to play. The mechanics are identical.

```r
library(e1071)
library(ggplot2)

set.seed(42)
n <- 300
claims <- data.frame(
  hour   = round(runif(n, 0, 24), 1),   # hour of day the claim was filed
  amount = round(runif(n, 0.1, 10), 2)  # claim amount, thousands of dollars
)
# fraud concentrates in a pocket: filings around 2 am, claims around 6 thousand
d_pocket <- sqrt((claims$hour - 2)^2 / 4.5^2 + (claims$amount - 6)^2 / 3^2)
claims$fraud <- factor(ifelse(runif(n) < plogis(5 - 4 * d_pocket), "yes", "no"))
table(claims$fraud)
#>
#>  no yes
#> 231  69
```

Now the expensive function itself. It takes one candidate setting and returns one number: the 5-fold cross-validated accuracy of the SVM at that gamma. We search on the log scale, because gamma ranges over five orders of magnitude (0.001 to 100) and "nearby settings" only means anything on the log axis. Cost stays fixed at 1 so the picture stays one-dimensional; everything below works unchanged with more dials.

```r
cv_acc <- function(log_gamma) {
  folds <- rep(1:5, length.out = nrow(claims))
  hits <- 0
  for (k in 1:5) {
    fit <- svm(fraud ~ hour + amount, data = claims[folds != k, ],
               kernel = "radial", gamma = 10^log_gamma, cost = 1)
    hits <- hits + sum(predict(fit, claims[folds == k, ]) == claims$fraud[folds == k])
  }
  hits / nrow(claims)
}

X <- c(-2.5, 0.5, 1.5)          # log10(gamma) of three spread-out scouting runs
Y <- sapply(X, cv_acc)
data.frame(log_gamma = X, gamma = 10^X, cv_accuracy = round(Y, 4))
#>   log_gamma        gamma cv_accuracy
#> 1      -2.5  0.003162278      0.7700
#> 2       0.5  3.162277660      0.8900
#> 3       1.5 31.622776602      0.8467
```

Three evaluations spent, five left. The tiny gamma scores 0.77, which is exactly the share of non-fraud claims: that SVM predicts "no" for everyone. The middle candidate is the best so far at 0.89. And here is the question that defines this lesson: **where do evaluations 4 through 8 go?**

The standard answers are grid search (predetermined lattice) and random search (draws from the range). The interactive below shows both spending a 16-evaluation budget on a two-dial version of this problem. Notice the one thing they have in common: candidate number 9 is chosen exactly as if results 1 through 8 had never happened.

::widget tuning-search {}

[KEY INSIGHT]
Grid and random search are blind: they decide every candidate before seeing a single result. Mara has already paid for three answers, and those answers contain real information, such as "the far left is hopeless". A search that cannot use what it has already learned is wasting the most expensive thing she has.

=== step === concept
::eyebrow The surrogate
## Model the search itself

Here is the move that changes everything. The relationship between a setting \(x\) (log gamma) and its CV accuracy \(y\) is just an unknown function observed at a few points, and Lesson 4 gave you the exact tool for that situation: a Gaussian process, which turns a handful of (x, y) pairs into a best-guess curve plus an honest band. There Asha had six kiln firings; here Mara has three CV runs. Same math, new job. The GP standing in for the expensive function is called the **surrogate**: a cheap model of the search itself.

The kernel is the RBF you know, \( k(x, x') = \sigma_f^2 \exp\!\left(-\frac{(x - x')^2}{2\ell^2}\right) \), and its dials read naturally on this axis. The signal sd \(\sigma_f = 0.10\) says CV accuracy could plausibly swing about plus or minus 0.2 (two sigma) around its average. The lengthscale \(\ell = 1\) says two settings within about one order of magnitude of each other should score similarly. And a small noise term \(\sigma_n = 0.01\) admits that a CV score is an estimate, not gospel: re-splitting the folds would jiggle it by about a point. For a candidate \(x\), with \(y\) the accuracies so far, \(m\) their mean, \(K\) the kernel matrix of evaluated settings (noise on its diagonal), and \(K_*\) the similarities between \(x\) and each evaluated setting:

\[ \mu(x) = m + K_* K^{-1} (y - m), \qquad \sigma^2(x) = \sigma_f^2 - K_* K^{-1} K_*^\top \]

The posterior mean \(\mu(x)\) is the surrogate's best guess at the accuracy at \(x\); the sd \(\sigma(x)\) is how wrong that guess could be. It is Lesson 4's ten lines, applied to the search:

```r
k_rbf <- function(a, b, l) exp(-outer(a, b, "-")^2 / (2 * l^2))
sigf <- 0.10   # accuracy could plausibly swing about +/- 0.2 around its mean
l    <- 1.0    # settings within about one log10 unit behave similarly
s_n  <- 0.01   # a CV score is an estimate, not gospel: allow small noise

gp_post <- function(X, Y, xg) {
  yc <- Y - mean(Y)
  K  <- sigf^2 * k_rbf(X, X, l) + s_n^2 * diag(length(X))
  Ks <- sigf^2 * k_rbf(xg, X, l)
  mu <- as.numeric(Ks %*% solve(K, yc)) + mean(Y)
  sd <- sqrt(pmax(sigf^2 - rowSums((Ks %*% solve(K)) * Ks), 1e-10))
  data.frame(x = xg, mu = mu, sd = sd)
}

xg   <- seq(-3, 2, by = 0.05)   # 101 candidate settings
post <- gp_post(X, Y, xg)
show <- round(post$x, 2) %in% c(-2.5, -1.0, 0.5, 1.5)
print(round(post[show, ], 3), row.names = FALSE)
#>     x    mu    sd
#>  -2.5 0.771 0.010
#>  -1.0 0.837 0.087
#>   0.5 0.889 0.010
#>   1.5 0.847 0.010
```

Read the sd column the way you learned to in Lesson 4. At the three evaluated settings it sits at 0.010, the noise floor: the search knows those answers about as well as CV can tell it. At \(-1.0\), the middle of the unexplored stretch between \(-2.5\) and \(0.5\), the sd is 0.087, nine times larger. The surrogate's guess there is 0.837, but the true value could plausibly sit anywhere within roughly plus or minus 0.17 of it. Draw the whole curve:

```r
evald <- data.frame(x = X, y = Y)   # the three paid-for evaluations
ggplot(post, aes(x, mu)) +
  geom_ribbon(aes(ymin = mu - 1.96 * sd, ymax = mu + 1.96 * sd),
              fill = "#2563a8", alpha = 0.15) +
  geom_line(colour = "#2563a8", linewidth = 1) +
  geom_point(data = evald, aes(x, y),
             inherit.aes = FALSE, size = 3) +
  labs(title = "What the search knows after three evaluations",
       x = "candidate setting, log10(gamma)", y = "5-fold CV accuracy") +
  theme_minimal(base_size = 13)
```

This picture IS the state of the search: everything three expensive evaluations bought, interpolated honestly. The band pinches at the paid-for answers and balloons in the gap. Evaluating this surrogate at all 101 candidate settings cost microseconds; evaluating the real objective at them would cost Mara 42 hours.

[KEY INSIGHT]
The surrogate replaces the question "what is the accuracy at x?" (25 minutes) with "what does everything I have seen so far imply about x?" (microseconds). The mean is the surrogate's best guess; the band is its confession of ignorance. Bayesian optimization is the art of reading that confession profitably.

=== step === quiz
::eyebrow Check yourself
## What does a wide band mean here?

The surrogate reports mean 0.837 and sd 0.087 at \(\log_{10}\gamma = -1\), a setting Mara has never evaluated. What is that sd actually telling her?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- No evaluation has landed near that setting, so the true CV accuracy there could plausibly be far above (or below) 0.837; probing there could uncover a much better setting ::ok Exactly. The sd is the surrogate's ignorance, not the model's instability: it is wide where the paid-for evaluations say little. That upside, "could be far above the mean", is what the next step turns into a search rule.
- The SVM at gamma = 0.1 is a high-variance model, so its predictions on new claims are unstable ::no That would be a property of the SVM itself, and nothing in the surrogate measures it. The band is about the SEARCH, not the classifier: it is wide at -1 only because no evaluation has been spent nearby. The same SVM would get a razor-thin band if Mara had evaluated there.
- If Mara re-ran the same 5-fold CV at -1 with different fold splits, the accuracy would swing by about plus or minus 0.17 ::no Fold-resplit jitter is the small noise term, about 0.01, the same at every setting. The rest of that sd is pure not-yet-evaluated ignorance, and it collapses to the noise floor the moment an evaluation lands there.

=== step === concept
::eyebrow The decision rule
## Explore or exploit, priced in one formula

Evaluation 4 has to go somewhere, and the surrogate offers two temptations. **Exploit:** the mean is highest right around the best evaluation so far at \(0.5\), so sample next door and squeeze out a fraction more. But the band there is the noise floor; the surrogate is already sure that neighborhood scores about 0.89, and confirming it teaches nothing. **Explore:** the band is widest around \(-1\), so sample there and learn the most. But breadth for its own sake happily spends budget mapping regions the mean already says are mediocre. Each instinct alone fails; the search needs a rule that prices both.

That rule is called an **acquisition function**: a score, computed from the surrogate alone, for how valuable an evaluation at each candidate would be. The classic one is **Expected Improvement (EI)**. Let \(y^{+}\) be the best score already banked, called the **incumbent** (here \(y^{+} = 0.89\)), and let \(\mu(x)\) and \(\sigma(x)\) be the surrogate's mean and sd at candidate \(x\). EI asks: if I evaluate at \(x\), by how much do I beat \(y^{+}\) on average, counting a miss as zero? Because the surrogate's belief at \(x\) is a normal distribution, that expectation has a closed form:

\[ \mathrm{EI}(x) = \big(\mu(x) - y^{+}\big)\,\Phi(z) \;+\; \sigma(x)\,\phi(z), \qquad z = \frac{\mu(x) - y^{+}}{\sigma(x)} \]

Every symbol in words: \(z\) measures how many sds the surrogate's guess sits above the incumbent. \(\Phi(z)\) (R's `pnorm`) is the probability that the true value at \(x\) beats the incumbent, so the first term is the predicted improvement weighted by its chance of being real: the **exploitation term**. \(\phi(z)\) (R's `dnorm`) is the normal density, so the second term pays a bonus proportional to \(\sigma(x)\): the **exploration term**, reward for the chance that a wide band hides a big surprise. Compute it at every candidate:

```r
best <- max(Y)                                # 0.89, the incumbent
z  <- (post$mu - best) / post$sd
ei <- (post$mu - best) * pnorm(z) + post$sd * dnorm(z)

show <- round(post$x, 2) %in% c(-2.5, -1.0, -0.45, 0.5)
print(data.frame(x = post$x[show], mu = round(post$mu[show], 3),
           sd = round(post$sd[show], 3), ei = round(ei[show], 4)), row.names = FALSE)
#>      x    mu    sd     ei
#>  -2.50 0.771 0.010 0.0000
#>  -1.00 0.837 0.087 0.0145
#>  -0.45 0.870 0.071 0.0195
#>   0.50 0.889 0.010 0.0036
```

Read the four rows like a negotiation. At \(-2.5\): known and bad, EI zero, never going back. At the incumbent \(0.5\): a mean about as high as anywhere on the grid, yet EI only 0.0036, because re-measuring near-certainty cannot produce much improvement. At \(-1.0\): the mean is 0.837, BELOW the incumbent, yet EI is four times higher at 0.0145, because an sd of 0.087 leaves real room to land above 0.89. And the winner at \(-0.45\): a decent mean AND a wide band, both terms pulling together, EI 0.0195. Stack the two pictures and the logic is visible:

```r
library(patchwork)
surro <- data.frame(x = xg, mu = post$mu, sd = post$sd, ei = ei)
p_top <- ggplot(surro, aes(x, mu)) +
  geom_ribbon(aes(ymin = mu - 1.96 * sd, ymax = mu + 1.96 * sd),
              fill = "#2563a8", alpha = 0.15) +
  geom_line(colour = "#2563a8", linewidth = 1) +
  geom_point(data = evald, aes(x, y), inherit.aes = FALSE, size = 3) +
  geom_hline(yintercept = best, linetype = 3) +
  labs(x = NULL, y = "CV accuracy") + theme_minimal(base_size = 12)
p_bot <- ggplot(surro, aes(x, ei)) +
  geom_line(colour = "#b5631a", linewidth = 1) +
  geom_vline(xintercept = xg[which.max(ei)], linetype = 2) +
  labs(x = "candidate setting, log10(gamma)", y = "EI") +
  theme_minimal(base_size = 12)
p_top / p_bot + plot_layout(heights = c(2, 1))
```

The EI curve is the cover widget's lower panel, rebuilt by hand. It is zero wherever the search is confident, swells over the unexplored gap, and peaks where promise and uncertainty overlap. Evaluation 4 goes to the candidate where EI is largest, its **argmax**: \(-0.45\).

[KEY INSIGHT]
EI never asks "where is the predicted accuracy highest?" It asks "where might I most exceed the best I already have?" A high mean raises that hope; a wide band raises it too; certainty about mediocrity kills it. That one formula is the entire explore-exploit negotiation, settled in closed form.

=== step === tryit
::eyebrow Your turn
## Write the decision rule

The pieces are sitting in your session: `mu` and `sd_s` (the surrogate over all 101 candidates), `best` (the incumbent, 0.89) and `z`. Write the Expected Improvement line, the one formula that decides where evaluation 4 goes. The last line then reveals the chosen candidate.

```r
best <- max(Y)                  # the incumbent: 0.89
mu   <- post$mu
sd_s <- post$sd
z    <- (mu - best) / sd_s
ei   <- ____
xg[which.max(ei)]               # where should the search look next?
```
::check {"regex":"pnorm.*dnorm|dnorm.*pnorm","gate":true,"difficulty":"intermediate","ok":"That is the closed form: predicted improvement weighted by its probability, plus the uncertainty bonus. Its argmax is -0.45, the same candidate the dashed line ringed in the plot.","no":"Combine the two terms: (mu - best) * pnorm(z) + sd_s * dnorm(z). The pnorm term prices the chance of beating the incumbent; the dnorm term pays the bonus for a wide band."}
::solution
```r
best <- max(Y)
mu   <- post$mu
sd_s <- post$sd
z    <- (mu - best) / sd_s
ei   <- (mu - best) * pnorm(z) + sd_s * dnorm(z)
xg[which.max(ei)]
#> [1] -0.45
```

=== step === concept
::eyebrow The loop
## Run the whole search

Now close the loop. Bayesian optimization is these four moves, repeated until the budget runs out or nothing promising is left:

::widget process-flow {"steps":[{"title":"Fit the surrogate","sub":"refit the GP to every (setting, CV score) pair paid for so far"},{"title":"Score every candidate","sub":"Expected Improvement prices promise and uncertainty together"},{"title":"Evaluate the EI argmax","sub":"spend one real CV run at the single most valuable setting"},{"title":"Update and repeat","sub":"bank the new pair; stop when EI collapses or the budget ends"}]}

Mara has five evaluations left, so the loop runs five times. Watch what each pick learns from the one before:

```r
ei_max <- numeric(5)
for (i in 1:5) {
  post <- gp_post(X, Y, xg)                          # refit on everything so far
  z    <- (post$mu - max(Y)) / post$sd
  ei   <- (post$mu - max(Y)) * pnorm(z) + post$sd * dnorm(z)
  ei_max[i] <- max(ei)
  xn <- xg[which.max(ei)]                            # the most promising candidate
  X  <- c(X, xn)
  Y  <- c(Y, cv_acc(xn))                             # one expensive evaluation
}
print(data.frame(eval = 1:8, log_gamma = round(X, 2), gamma = round(10^X, 3),
           cv_accuracy = round(Y, 4)), row.names = FALSE)
#>  eval log_gamma  gamma cv_accuracy
#>     1     -2.50  0.003      0.7700
#>     2      0.50  3.162      0.8900
#>     3      1.50 31.623      0.8467
#>     4     -0.45  0.355      0.9100
#>     5     -0.15  0.708      0.9033
#>     6     -1.00  0.100      0.9133
#>     7     -0.80  0.158      0.9200
#>     8     -0.80  0.158      0.9200
```

This table is the whole method in eight rows. Pick 4 lands at \(-0.45\) and immediately beats the incumbent: 0.9100. Pick 5 checks the other shoulder of the ridge (0.9033, useful news: not that way). Pick 6 pushes deeper into the gap and does better still (0.9133). Pick 7 splits the difference at \(-0.80\) and finds 0.9200, the best yet. And pick 8 asks for \(-0.80\) again: the search has nothing better left to request. Its internal EI record makes the same point numerically:

```r
round(ei_max, 4)
#> [1] 0.0195 0.0060 0.0053 0.0038 0.0012
```

The best remaining hope collapsed from 0.0195 to 0.0012, a sixteenth of where it started. In our replica we can afford the luxury Mara never gets: trace the true curve on a 26-point grid (about 11 hours of compute in her world) and see what the loop was navigating blind.

```r
truth <- data.frame(log_gamma = seq(-3, 2, by = 0.2))
truth$cv_accuracy <- sapply(truth$log_gamma, cv_acc)
print(truth[which.max(truth$cv_accuracy), ], row.names = FALSE)
#>  log_gamma cv_accuracy
#>       -0.8        0.92
```

The true best on that grid: 0.92, at \(-0.8\). Exactly what the loop reached with 8 evaluations instead of 26. Plot where every evaluation actually went:

```r
evals <- data.frame(x = X, y = Y,
                    chosen_by = rep(c("starter", "EI"), c(3, 5)))
ggplot(truth, aes(log_gamma, cv_accuracy)) +
  geom_line(colour = "grey55", linewidth = 0.9) +
  geom_point(data = evals, aes(x, y, colour = chosen_by), size = 3) +
  scale_colour_manual(values = c(starter = "#2563a8", EI = "#b5631a")) +
  labs(title = "Where the 8 evaluations actually went",
       x = "candidate setting, log10(gamma)", y = "5-fold CV accuracy",
       colour = "chosen by") +
  theme_minimal(base_size = 13)
```

Every orange point sits on the hill. Not one EI pick was wasted on the flat left plateau or the overfitting slide on the right, because after the starters, the surrogate already believed those regions were poor, and EI acted on that belief.

=== step === quiz
::eyebrow Check yourself
## Reading the run

On its final pick, evaluation 8, the loop re-requested \(-0.80\), a setting it had already evaluated, and its EI record had collapsed from 0.0195 to 0.0012. What is the right reading of those two facts together?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The surrogate has broken down numerically and the loop is stuck; the run should be restarted with different starting points ::no Nothing is broken: the loop did exactly what EI told it to. When no unexplored candidate offers meaningful expected improvement, the argmax can fall on an already-evaluated point (the small noise term keeps EI just above zero there). The result, 0.92 at -0.80, matches the true grid best.
- No candidate offers meaningful expected improvement anymore: under the surrogate's assumptions the search has converged, and that is the natural signal to stop spending budget ::ok Right. A collapsing EI trace is BO's built-in stopping signal, something grid and random search simply do not have. Note the honest qualifier: "under the surrogate's assumptions". EI near zero is the surrogate's opinion, not a mathematical proof.
- The search has now proven that gamma near 0.16 is the global optimum, so no further validation of the chosen model is ever needed ::no Too strong, in the same way Lesson 4's band was not a guarantee. EI near zero says the SURROGATE sees no likely improvement; a surprise could still hide between grid points or outside the searched range, and the winning setting still deserves a final honest evaluation on held-out data before shipping.

=== step === quiz
::eyebrow The showdown
## Blind search, same budget

The fair fight: give random search the identical budget of 8 evaluations on the identical problem, and compare.

```r
set.seed(7)
draws <- round(runif(8, -3, 2), 2)
rand_acc <- sapply(draws, cv_acc)
print(data.frame(log_gamma = draws, cv_accuracy = round(rand_acc, 4)), row.names = FALSE)
#>  log_gamma cv_accuracy
#>       1.94      0.8167
#>      -1.01      0.9133
#>      -2.42      0.7700
#>      -2.65      0.7700
#>      -1.78      0.8733
#>       0.96      0.8867
#>      -1.30      0.9067
#>       1.86      0.8333
```

Random search reached 0.9133, respectable, only 0.007 behind BO's 0.9200. But look at the spend: five of its eight draws landed on the hopeless plateau or the overfitting slope, evaluations Mara pays 25 minutes each for. And a lucky draw is exactly that, luck. Re-run the same experiment with three different seeds:

```r
rand_best <- sapply(c(11, 21, 123), function(s) {
  set.seed(s)
  max(sapply(round(runif(8, -3, 2), 2), cv_acc))
})
round(rand_best, 4)
#> [1] 0.91 0.89 0.92
```

Sometimes 0.92, sometimes 0.89, depending on where the darts happen to land. BO's 0.9200 was not a dart: every pick after the starters was the argmax of a computed quantity, and the same procedure re-run lands in the same place. So what is the honest conclusion?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Random search came close here, which shows BO is rarely worth its extra machinery in practice ::no This replica is deliberately easy on random search: one dial, a broad peak covering about a fifth of the range, and one-second evaluations. Even here random wasted five of eight draws and its result swung with the seed. Shrink the good region, add dials, or price evaluations at 25 minutes, and the gap widens fast.
- On a cheap one-dial problem random search is a strong baseline, but the economics flip when evaluations are expensive, the budget is small, and dials multiply: BO buys evaluation-efficiency precisely where evaluations are the scarce resource ::ok Exactly. The comparison to internalize is not 0.9200 vs 0.9133 on this toy, it is where the budget went: all five EI picks on the hill versus five of eight darts in dead zones. On Mara's real problem that difference is measured in hours of compute and in whether Friday's model is the good one.
- Random search failed because it never landed exactly on -0.80, and BO's answer is proven optimal since EI went to zero ::no Neither half holds. Random at -1.01 scored 0.9133, a perfectly usable setting, and BO's EI collapse is the surrogate's opinion, not a proof of optimality (the previous quiz made that distinction). The real difference is budget discipline, not a certificate.

=== step === concept
::eyebrow In practice
## Production tools, and when BO breaks

You have now built every part a production BO tuner contains: a surrogate, an acquisition function, and the loop. In day-to-day work you hand those parts to a package. In the tidymodels stack, `tune_bayes()` runs this exact recipe over any tunable workflow, with a GP surrogate and EI as the default acquisition; it re-tunes the surrogate's own dials by marginal likelihood (Lesson 4's tool) at every iteration, rather than trusting fixed values as we did. This one is for your local R, since it pulls in the full tidymodels stack:

```r-static
# Run locally: tidymodels tunes with a GP surrogate + EI out of the box
library(tidymodels)

svm_spec <- svm_rbf(cost = 1, rbf_sigma = tune()) |>
  set_engine("kernlab") |>
  set_mode("classification")

wf <- workflow() |>
  add_formula(fraud ~ hour + amount) |>
  add_model(svm_spec)

set.seed(1)
res <- tune_bayes(wf,
                  resamples = vfold_cv(claims, v = 5),
                  initial   = 3,     # the scouting evaluations
                  iter      = 5,     # the surrogate-guided picks
                  metrics   = metric_set(accuracy))
show_best(res, metric = "accuracy")
```

The same idea ships as `mlr3mbo` in the mlr3 ecosystem and as the standalone `ParBayesianOptimization` package. Whichever wrapper you use, the decision of whether to reach for BO at all is yours, and it has a clean answer:

| Situation | Sensible search |
|---|---|
| Evaluations cost seconds, thousands affordable | grid or random search: blanket the space, fully parallel |
| Evaluations cost minutes to hours, budget in the tens | Bayesian optimization |
| Twenty-plus dials, or categorical / conditional settings | random search, or BO with tree-based surrogates instead of a GP |

And the failure modes, honestly. **Cheap objectives:** BO pays per-pick overhead (refit, optimize EI) and is sequential by nature, one pick waits for the last result; random search costs nothing to plan and parallelizes perfectly, so with plentiful cheap evaluations it wins on wall-clock. **Many dials:** a GP surrogate gets unreliable past roughly 20 dimensions, there is simply too much space per evaluation. **Categorical and conditional settings** (optimizer type, or "dropout rate exists only if dropout is on") do not fit a smooth RBF kernel; tree-ensemble surrogates in the SMAC style (a random forest standing in where we used a GP) handle them, which is what several libraries switch to. **Noisy objectives:** a CV score wobbles with the fold split, which is why our surrogate carried a noise term; without one, the surrogate chases fold luck. And the quiet one, inherited straight from Lesson 4:

[WARNING]
The acquisition function is only as honest as the surrogate underneath it. A lengthscale that is too long makes the band collapse in unexplored regions, and EI, reading false confidence, stops looking there, exactly the overconfidence trap from the GP lesson, now steering real compute. Production tools re-fit the surrogate dials by marginal likelihood each round for precisely this reason. (You may also have noticed our band poking above accuracy 1.0: the GP does not know accuracy is bounded. Cosmetic here, but it is the same lesson, a surrogate believes only what its assumptions allow.)

=== step === concept
::eyebrow Go deeper
## References

Five solid places to take this further, in reading order:

- [Agnihotri and Batra, "Exploring Bayesian Optimization" (Distill, 2020)](https://distill.pub/2020/bayesian-optimization/) - interactive surrogates and acquisition functions; the cover widget's ideas, explorable in depth.
- [Frazier (2018), "A Tutorial on Bayesian Optimization"](https://arxiv.org/abs/1807.02811) - the clearest full treatment: EI derived, other acquisitions (knowledge gradient, entropy search), noisy and parallel variants.
- [Jones, Schonlau and Welch (1998), "Efficient Global Optimization of Expensive Black-Box Functions"](https://link.springer.com/article/10.1023/A:1008306431147) - the EGO paper where Expected Improvement over a GP surrogate was put to work; this lesson is its recipe.
- [Snoek, Larochelle and Adams (2012), "Practical Bayesian Optimization of Machine Learning Algorithms"](https://arxiv.org/abs/1206.2944) - the paper that made BO the default for ML hyperparameters; reads directly onto Mara's problem.
- [tune_bayes() in tidymodels](https://tune.tidymodels.org/reference/tune_bayes.html) - the production wrapper for the loop you built, with its GP surrogate and acquisition options documented.

=== step === complete
## Lesson 6 complete

You gave Mara her eight questions. You framed tuning as expensive black-box optimization and saw exactly why grid and random search waste a small budget: they cannot learn from their own results. You re-hired Lesson 4's Gaussian process as a surrogate, a cheap model of the search itself whose band confesses where the search is ignorant. You priced the explore-exploit trade in one closed formula, Expected Improvement, watched it send evaluation 4 into the most promising gap, and ran the full loop: five guided picks, every one on the hill, converging on the true grid optimum (0.92 at gamma near 0.16) and announcing its own convergence as EI collapsed sixteen-fold. Then you gave random search the same budget, watched it burn five of eight draws in dead zones, and drew the honest boundary: BO earns its keep when evaluations are expensive and the budget is tight, not everywhere.

Next, Lesson 7: Approximate Nearest Neighbors at Scale. Everything in this lesson treated the model fit as the expensive step. But for nearest-neighbour methods the cost lives somewhere else entirely: every single prediction means measuring the distance to every stored point. At a million points that is the bottleneck, and the fix, trading a sliver of exactness for orders of magnitude of speed, is the next lesson.
