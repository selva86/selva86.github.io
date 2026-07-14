---
title: "Top 20 Bayesian Problems to Solve in R"
slug: "Top-20-Bayesian-Problems-in-R"
description: "Bayesian statistics problems in R: 20 worked exercises on prior-to-posterior updating, Beta-Binomial conjugacy, credible intervals and Monte Carlo sampling."
keywords: "bayesian statistics problems, bayesian exercises R, beta-binomial conjugacy, credible interval, grid approximation, posterior prediction"
mathjax: true
webr: true
date: "2026-07-14"
post_type: "EX"
sidebar_title: "Top 20 Bayesian Problems"
sidebar_order: 145
fr_parent: "Bayesian-Statistics-in-R.html"
auto_link_terms: "bayesian statistics problems|beta-binomial conjugacy|credible interval|posterior predictive|grid approximation|bayes factor"
auto_link_case_sensitive: false
target_keyword: "bayesian statistics problems"
sibling_block_enabled: false
difficulty: "Mixed"
---

# Top 20 Bayesian Problems to Solve in R

<p class="lead">This featured collection gathers the 20 Bayesian problems worth mastering in R: updating a prior by hand, Beta-Binomial conjugacy, credible versus confidence intervals, prior sensitivity, posterior prediction, grid approximation and Monte Carlo sampling. Every problem runs on base R, is fully worked, and hides its solution until you are ready to check.</p>

The thread running through all 20 is a single identity, Bayes' theorem: $P(\theta \mid x) \propto P(x \mid \theta)\,P(\theta)$. The posterior is the prior reweighted by the likelihood. Work top to bottom and you will see that identity applied by hand, in closed form, on a grid, and by simulation.

```r title="Run this once before any exercise"
# Every problem below runs on base R only. No add-on packages are required.
library(stats)   # dbeta(), pbeta(), qbeta(), rbeta(), dbinom(), beta() are all base R
set.seed(123)    # fixes the seed for the Monte Carlo problems in Section 6
```

## Section 1. Updating beliefs with Bayes' theorem by hand (4 problems)

These four problems apply $P(\theta \mid x) \propto P(x \mid \theta)\,P(\theta)$ directly, with no conjugacy shortcuts, so the mechanics stay visible.

### Exercise 1.1: Update disease probability after a positive screening test

**Task:** A hospital screening program tests for a condition present in 1% of the screened population, using a test with 99% sensitivity and 95% specificity. Apply Bayes' theorem to find the probability a patient truly has the condition given a positive result, and save the value to `ex_1_1`.

**Expected result:**

```
#> [1] 0.1666667
```

**Difficulty:** Beginner

[HINTS]
The number you want flips the test around: given a positive, how many positives are the real ones? Weigh true positives against all positives.
Compute P(positive) = sensitivity * prevalence + (1 - specificity) * (1 - prevalence), then divide the true-positive term by it.

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
prevalence  <- 0.01
sensitivity <- 0.99
specificity <- 0.95
p_pos  <- sensitivity * prevalence + (1 - specificity) * (1 - prevalence)
ex_1_1 <- (sensitivity * prevalence) / p_pos
ex_1_1
#> [1] 0.1666667
```

**Explanation:** This is the classic base-rate lesson. Even a 99% sensitive test flags only about 1 in 6 positives as genuine, because the 5% false-positive rate acts on the 99% of patients who are healthy and swamps the tiny pool of true positives. The common mistake is to read the test's accuracy as the answer; Bayes' theorem forces the prevalence back into the calculation. Lower the prevalence and the posterior collapses further.

</details>

### Exercise 1.2: Turn a discrete prior into a posterior over three coin biases

**Task:** You hold three hypotheses for a coin's bias theta in c(0.3, 0.5, 0.7) with prior weights c(0.2, 0.6, 0.2). After observing 3 heads in 4 tosses, update each hypothesis to its posterior weight and save the normalized result as a data frame `ex_1_2` with columns theta, prior and posterior.

**Expected result:**

```
#>   theta prior  posterior
#> 1   0.3   0.2 0.06110572
#> 2   0.5   0.6 0.60620757
#> 3   0.7   0.2 0.33268671
```

**Difficulty:** Intermediate

[HINTS]
Each posterior weight is prior times likelihood, then rescaled so the three weights add up to one.
The binomial likelihood up to a constant is theta^3 * (1 - theta); multiply by the prior and divide by the sum.

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
theta <- c(0.3, 0.5, 0.7)
prior <- c(0.2, 0.6, 0.2)
lik   <- theta^3 * (1 - theta)          # 3 heads in 4 tosses, up to a constant
post  <- prior * lik / sum(prior * lik)
ex_1_2 <- data.frame(theta, prior, posterior = post)
ex_1_2
#>   theta prior  posterior
#> 1   0.3   0.2 0.06110572
#> 2   0.5   0.6 0.60620757
#> 3   0.7   0.2 0.33268671
```

**Explanation:** The binomial coefficient cancels in the normalization, so dropping it costs nothing. The prior favored 0.5 heavily, but the data pulled weight toward 0.7 because 3 heads in 4 is more likely under a biased coin. The posterior is a compromise: still peaked at 0.5, yet with the 0.7 hypothesis now the second strongest. Dividing by sum(prior * lik) is the discrete version of the normalizing constant.

</details>

### Exercise 1.3: Show sequential updating matches a single batch update

**Task:** Starting from a uniform prior over theta in c(0.3, 0.5, 0.7), fold in the tosses c(1, 1, 0, 1) one at a time so each posterior becomes the next prior, then redo the update in a single batch step. Store both posteriors and their largest absolute difference in a data frame `ex_1_3`.

**Expected result:**

```
#>   theta sequential     batch     max_diff
#> 1   0.3  0.1025502 0.1025502 1.110223e-16
#> 2   0.5  0.3391210 0.3391210 1.110223e-16
#> 3   0.7  0.5583288 0.5583288 1.110223e-16
```

**Difficulty:** Intermediate

[HINTS]
Bayesian updating is associative: processing data one point at a time or all at once must reach the same posterior.
Loop with `for (x in data)` using likelihood theta for a head and (1 - theta) for a tail; compare against theta^3 * (1 - theta)^1.

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
theta <- c(0.3, 0.5, 0.7)
prior <- c(1, 1, 1) / 3
data  <- c(1, 1, 0, 1)
p <- prior
for (x in data) {
  lik_x <- if (x == 1) theta else 1 - theta
  p <- p * lik_x / sum(p * lik_x)
}
lik_all <- theta^sum(data) * (1 - theta)^(length(data) - sum(data))
batch   <- prior * lik_all / sum(prior * lik_all)
ex_1_3  <- data.frame(theta, sequential = p, batch = batch,
                      max_diff = max(abs(p - batch)))
ex_1_3
#>   theta sequential     batch     max_diff
#> 1   0.3  0.1025502 0.1025502 1.110223e-16
#> 2   0.5  0.3391210 0.3391210 1.110223e-16
#> 3   0.7  0.5583288 0.5583288 1.110223e-16
```

**Explanation:** Coherent Bayesian updating is order independent and stream independent, so the running posterior after four single steps lands exactly on the one-shot batch posterior. The 1e-16 gap is floating-point rounding, not a real disagreement. One trap worth naming: use `if (x == 1) theta else 1 - theta`, not `ifelse()`, because `ifelse()` with a scalar test returns a single element and silently breaks the vectorized update.

</details>

### Exercise 1.4: Weigh a fair coin against a biased coin with a Bayes factor

**Task:** A game auditor compares two hypotheses for a coin: H1 says it is fair (theta = 0.5) and H2 says it is biased (theta = 0.75). After seeing 7 heads in 10 tosses under equal prior odds, compute the two likelihoods, the Bayes factor for H2 over H1, and the posterior probability of H2, storing them in `ex_1_4`.

**Expected result:**

```
#>       L_fair     L_biased bayes_factor      post_H2 
#>       0.1172       0.2503       2.1357       0.6811 
```

**Difficulty:** Intermediate

[HINTS]
With equal prior odds the posterior odds equal the ratio of the two likelihoods.
Use `dbinom(7, 10, p)` for each hypothesis; the Bayes factor is the likelihood ratio and the posterior probability is BF / (1 + BF).

```r title="Your turn"
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
L1 <- dbinom(7, 10, 0.5)
L2 <- dbinom(7, 10, 0.75)
BF <- L2 / L1
postH2 <- BF / (1 + BF)          # equal prior odds cancel
ex_1_4 <- round(c(L_fair = L1, L_biased = L2,
                  bayes_factor = BF, post_H2 = postH2), 4)
ex_1_4
#>       L_fair     L_biased bayes_factor      post_H2 
#>       0.1172       0.2503       2.1357       0.6811 
```

**Explanation:** The Bayes factor is the ratio of how well each hypothesis predicted the data, here about 2.1 in favor of the biased coin. Because the prior odds were 1 to 1, the posterior odds equal the Bayes factor, and converting odds to a probability gives 0.68. A Bayes factor near 2 is only weak evidence, so 7 heads in 10 is far from conclusive. Prior odds other than 1 to 1 would multiply through before the final conversion.

</details>

## Section 2. Beta-Binomial conjugacy (4 problems)

When the prior is a Beta and the data are binomial, the posterior is again a Beta, so updating reduces to adding counts. That closed form is the backbone of Bayesian inference for proportions.

### Exercise 2.1: Derive the Beta posterior from a Beta prior and binomial data

**Task:** Begin with a Beta(2, 2) prior for a success probability and observe 8 successes in 10 independent trials. Using conjugacy, compute the two parameters of the resulting Beta posterior and save them as a named vector `ex_2_1` with elements alpha and beta.

**Expected result:**

```
#> alpha  beta 
#>    10     4 
```

**Difficulty:** Beginner

[HINTS]
For a Beta prior and binomial data the posterior stays in the Beta family; you only add the observed counts.
The posterior is Beta(alpha0 + successes, beta0 + failures), so add 8 and 2 to the prior parameters.

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
a0 <- 2; b0 <- 2
successes <- 8; failures <- 2
ex_2_1 <- c(alpha = a0 + successes, beta = b0 + failures)
ex_2_1
#> alpha  beta 
#>    10     4 
```

**Explanation:** Conjugacy is what makes this a one-line update: the Beta prior and binomial likelihood combine into a Beta posterior with alpha incremented by successes and beta by failures. You can read the prior parameters as pseudo-counts, so Beta(2, 2) behaves like two prior heads and two prior tails before any real data arrives. This same rule powers every later problem in the section.

</details>

### Exercise 2.2: Summarise a Beta posterior with mean, mode and variance

**Task:** For the Beta(10, 4) posterior from the previous problem, compute the posterior mean, mode and variance from their closed forms and compare the mean against the maximum-likelihood estimate 0.8, storing all four numbers rounded in a named vector `ex_2_2`.

**Expected result:**

```
#>     mean     mode variance      mle 
#>   0.7143   0.7500   0.0136   0.8000 
```

**Difficulty:** Intermediate

[HINTS]
Every summary here is a simple function of the two Beta parameters; no simulation is needed.
Mean is a/(a+b), mode is (a-1)/(a+b-2), variance is ab/((a+b)^2 (a+b+1)).

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
a <- 10; b <- 4
p_mean <- a / (a + b)
p_mode <- (a - 1) / (a + b - 2)
p_var  <- (a * b) / ((a + b)^2 * (a + b + 1))
ex_2_2 <- round(c(mean = p_mean, mode = p_mode,
                  variance = p_var, mle = 0.8), 4)
ex_2_2
#>     mean     mode variance      mle 
#>   0.7143   0.7500   0.0136   0.8000 
```

**Explanation:** The posterior mean 0.714 sits below the MLE of 0.8 because the Beta(2, 2) prior shrinks the estimate toward its own mean of 0.5. Mean and mode differ (0.714 versus 0.75) because the Beta is skewed for unequal parameters; the mode matches what a penalized maximum would report. Reporting the variance alongside the mean is what turns a point estimate into an honest statement of uncertainty, which a bare MLE cannot give.

</details>

### Exercise 2.3: Compare a weak and a strong prior on the same data

**Task:** An analyst wants to see how much the prior matters for 8 successes in 10 trials. Update a weak Beta(1, 1) prior and a strong Beta(20, 20) prior, then compare the two posterior means in a data frame `ex_2_3` carrying the prior label and the posterior parameters.

**Expected result:**

```
#>         prior post_alpha post_beta post_mean
#> 1   Beta(1,1)          9         3      0.75
#> 2 Beta(20,20)         28        22      0.56
```

**Difficulty:** Intermediate

[HINTS]
A stronger prior carries more pseudo-counts, so it resists being pulled toward the data.
Add the same 8 and 2 to each prior's alpha and beta, then compute a/(a+b) for both.

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
s <- 8; f <- 2
weak   <- c(1, 1)
strong <- c(20, 20)
ex_2_3 <- data.frame(
  prior      = c("Beta(1,1)", "Beta(20,20)"),
  post_alpha = c(weak[1] + s, strong[1] + s),
  post_beta  = c(weak[2] + f, strong[2] + f),
  post_mean  = c((weak[1] + s) / (weak[1] + s + weak[2] + f),
                 (strong[1] + s) / (strong[1] + s + strong[2] + f)))
ex_2_3
#>         prior post_alpha post_beta post_mean
#> 1   Beta(1,1)          9         3      0.75
#> 2 Beta(20,20)         28        22      0.56
```

**Explanation:** Prior parameters act like data you have already seen, so Beta(20, 20) enters the update with 40 pseudo-observations centered at 0.5 and barely budges after only 10 real trials, landing at 0.56. The flat Beta(1, 1) prior adds almost nothing and lets the data speak, reaching 0.75. The lesson for practice is to size the prior to your actual confidence: a strong prior needs strong justification, because with small samples it dominates the answer.

</details>

### Exercise 2.4: Express the posterior mean as a weighted average

**Task:** Demonstrate numerically that the Beta(2, 2) posterior mean after 8 successes in 10 trials equals a weighted average of the prior mean and the sample proportion. Compute the prior weight, the weighted average and the exact posterior mean, and confirm they agree in a named vector `ex_2_4`.

**Expected result:**

```
#>  prior_weight weighted_mean    exact_mean 
#>        0.2857        0.7143        0.7143 
```

**Difficulty:** Advanced

[HINTS]
The posterior mean always lies between the prior mean and the sample proportion; think about what fraction each side contributes.
The prior weight is (a0 + b0)/(a0 + b0 + n); apply it to the prior mean a0/(a0+b0) and one minus it to the sample proportion.

```r title="Your turn"
ex_2_4 <- # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
a0 <- 2; b0 <- 2; s <- 8; n <- 10
prior_mean  <- a0 / (a0 + b0)
sample_prop <- s / n
w <- (a0 + b0) / (a0 + b0 + n)
weighted <- w * prior_mean + (1 - w) * sample_prop
exact    <- (a0 + s) / (a0 + b0 + n)
ex_2_4 <- round(c(prior_weight = w, weighted_mean = weighted,
                  exact_mean = exact), 4)
ex_2_4
#>  prior_weight weighted_mean    exact_mean 
#>        0.2857        0.7143        0.7143 
```

**Explanation:** The Beta-Binomial posterior mean is a shrinkage estimator: it is the sample proportion pulled a fraction of the way back to the prior mean, with the fraction set by how many pseudo-counts the prior carries relative to the sample size. Here the prior weight is 4/14, so 29% prior and 71% data. As n grows, the prior weight shrinks toward zero and the posterior mean converges to the MLE, which is exactly why priors matter most when data are scarce.

</details>

## Section 3. Credible intervals versus confidence intervals (3 problems)

A credible interval is a direct probability statement about the parameter, read straight off the posterior. These problems build one and contrast it with the frequentist confidence interval it is so often confused with.

### Exercise 3.1: Build a 95% equal-tailed credible interval from a Beta posterior

**Task:** For the Beta(10, 4) posterior, compute the 95% equal-tailed credible interval by reading the 2.5% and 97.5% quantiles of the Beta distribution, and store the two endpoints in a named vector `ex_3_1` with elements lower and upper.

**Expected result:**

```
#>  lower  upper 
#> 0.4619 0.9091 
```

**Difficulty:** Beginner

[HINTS]
An equal-tailed interval leaves 2.5% of the posterior probability in each tail.
Use `qbeta(c(0.025, 0.975), 10, 4)` to read the two quantiles directly.

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- qbeta(c(0.025, 0.975), 10, 4)
names(ex_3_1) <- c("lower", "upper")
ex_3_1 <- round(ex_3_1, 4)
ex_3_1
#>  lower  upper 
#> 0.4619 0.9091 
```

**Explanation:** Because the posterior is a genuine probability distribution over theta, its quantiles carve out an interval that contains 95% of the posterior mass, and you can say plainly that there is a 95% probability theta lies inside it. That interpretation is exactly the one students wrongly attach to a confidence interval. The equal-tailed choice is the simplest; a highest-density interval would be slightly narrower for this skewed posterior but needs an optimizer.

</details>

### Exercise 3.2: Contrast a credible interval with a Wald confidence interval

**Task:** A statistician reviewing 8 successes in 10 trials wants both a Bayesian and a frequentist interval. Compute the Wald 95% confidence interval from the sample proportion and the 95% credible interval from a Beta(9, 3) posterior under a uniform prior, and place both in a data frame `ex_3_2` with columns method, lower and upper.

**Expected result:**

```
#>     method  lower  upper
#> 1  Wald CI 0.5521 1.0479
#> 2 Credible 0.4822 0.9398
```

**Difficulty:** Advanced

[HINTS]
One interval is about the plausibility of the parameter, the other about the long-run coverage of a procedure; they need not agree.
Wald uses phat plus or minus 1.96 * sqrt(phat (1 - phat) / n); credible uses `qbeta(c(0.025, 0.975), 9, 3)`.

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
phat <- 0.8; n <- 10
se   <- sqrt(phat * (1 - phat) / n)
wald <- phat + c(-1, 1) * qnorm(0.975) * se
cred <- qbeta(c(0.025, 0.975), 1 + 8, 1 + 2)   # uniform Beta(1,1) prior
ex_3_2 <- data.frame(
  method = c("Wald CI", "Credible"),
  lower  = round(c(wald[1], cred[1]), 4),
  upper  = round(c(wald[2], cred[2]), 4))
ex_3_2
#>     method  lower  upper
#> 1  Wald CI 0.5521 1.0479
#> 2 Credible 0.4822 0.9398
```

**Explanation:** The Wald interval runs past 1.0, an impossible value for a probability, which exposes how badly the normal approximation behaves near a boundary with only 10 trials. The credible interval stays inside [0, 1] by construction because the Beta posterior lives there. Beyond the numbers, the interpretations differ: the credible interval is a statement about theta given this data set, whereas the confidence interval is a statement about the procedure across hypothetical repetitions.

</details>

### Exercise 3.3: Compute posterior tail probabilities for a threshold

**Task:** Using the Beta(10, 4) posterior, compute the posterior probability that the success probability exceeds 0.5 and the probability it exceeds 0.9, saving both in a named vector `ex_3_3`. These are the direct probability statements a confidence interval cannot provide.

**Expected result:**

```
#> P(theta>0.5) P(theta>0.9) 
#>       0.9539       0.0342 
```

**Difficulty:** Intermediate

[HINTS]
A posterior tail probability is one minus the cumulative distribution evaluated at the threshold.
Use `pbeta(0.5, 10, 4, lower.tail = FALSE)` and the same call with 0.9.

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
p_gt_half <- pbeta(0.5, 10, 4, lower.tail = FALSE)
p_gt_nine <- pbeta(0.9, 10, 4, lower.tail = FALSE)
ex_3_3 <- round(c("P(theta>0.5)" = p_gt_half,
                  "P(theta>0.9)" = p_gt_nine), 4)
ex_3_3
#> P(theta>0.5) P(theta>0.9) 
#>       0.9539       0.0342 
```

**Explanation:** Setting lower.tail = FALSE returns the upper-tail area, so these are direct answers to "how probable is it that theta beats this bar." There is a 95% posterior probability the coin favors heads and only a 3% probability it is extreme past 0.9. A frequentist cannot make either statement, because in that framework theta is a fixed unknown, not a random quantity. This is the machinery decisions are actually built on: probabilities of hypotheses, not just intervals.

</details>

## Section 4. Prior sensitivity and posterior prediction (4 problems)

Two questions every applied Bayesian faces: does the answer hinge on the prior, and what does the model predict next? These problems tackle both, staying inside the Beta-Binomial world so the answers are exact.

### Exercise 4.1: Run a prior sensitivity analysis across three priors

**Task:** A reviewer challenges your choice of prior for 8 successes in 10 trials. Recompute the posterior mean and 95% credible interval under a uniform Beta(1, 1), a Jeffreys Beta(0.5, 0.5) and an informative Beta(20, 20) prior, and assemble the three rows into a data frame `ex_4_1`.

**Expected result:**

```
#>         prior post_mean  lower  upper
#> 1     uniform    0.7500 0.4822 0.9398
#> 2    Jeffreys    0.7727 0.4972 0.9559
#> 3 informative    0.5600 0.4221 0.6933
```

**Difficulty:** Advanced

[HINTS]
Keep the data fixed and vary only the prior parameters, reading off each posterior in turn.
For each prior add 8 and 2 to alpha and beta, then compute a/(a+b) and `qbeta(c(0.025, 0.975), a, b)`.

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
s <- 8; f <- 2
priors <- list(uniform = c(1, 1), Jeffreys = c(0.5, 0.5), informative = c(20, 20))
ex_4_1 <- do.call(rbind, lapply(names(priors), function(nm) {
  pr <- priors[[nm]]; a <- pr[1] + s; b <- pr[2] + f
  ci <- qbeta(c(0.025, 0.975), a, b)
  data.frame(prior = nm, post_mean = round(a / (a + b), 4),
             lower = round(ci[1], 4), upper = round(ci[2], 4))
}))
rownames(ex_4_1) <- NULL
ex_4_1
#>         prior post_mean  lower  upper
#> 1     uniform    0.7500 0.4822 0.9398
#> 2    Jeffreys    0.7727 0.4972 0.9559
#> 3 informative    0.5600 0.4221 0.6933
```

**Explanation:** The uniform and Jeffreys priors are both weak, so with 10 observations they land within two percentage points of each other, which is the reassuring case where the prior barely matters. The informative Beta(20, 20) tells a different story: it adds 40 pseudo-counts at 0.5 and drags the mean down to 0.56 with a much tighter interval. A sensitivity table like this is standard practice; when weak priors agree you report robustness, and when a strong prior disagrees you must defend it.

</details>

### Exercise 4.2: Predict the next trial with the posterior predictive mean

**Task:** Show that the posterior predictive probability that the very next trial is a success, given a Beta(10, 4) posterior, equals the posterior mean of theta. Compute this single predictive probability and save it to `ex_4_2`.

**Expected result:**

```
#> [1] 0.7142857
```

**Difficulty:** Advanced

[HINTS]
Average the Bernoulli success probability over the whole posterior, not just its peak value.
By the law of total probability the predictive probability equals E[theta] = a/(a+b) for a Beta(a, b) posterior.

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
a <- 10; b <- 4
ex_4_2 <- a / (a + b)
ex_4_2
#> [1] 0.7142857
```

**Explanation:** The posterior predictive integrates the outcome model over every value of theta weighted by the posterior, and for a single Bernoulli trial that integral is just the posterior mean. It happens to coincide with the plug-in estimate here only because the success probability is linear in theta. Any nonlinear summary, such as the odds in Exercise 6.3 or the count in the next problem, would separate the fully-averaged predictive from the naive plug-in, which is the whole reason prediction and estimation are distinct steps.

</details>

### Exercise 4.3: Derive the posterior predictive over five future trials

**Task:** Using the Beta(10, 4) posterior, compute the Beta-Binomial posterior predictive distribution for the number of successes in 5 future independent trials, tabulating the probability of 0 through 5 successes in a data frame `ex_4_3` and confirming the probabilities sum to one.

**Expected result:**

```
#>   successes   prob
#> 1         0 0.0065
#> 2         1 0.0408
#> 3         2 0.1284
#> 4         3 0.2568
#> 5         4 0.3338
#> 6         5 0.2337
```

**Difficulty:** Advanced

[HINTS]
Integrating the binomial likelihood over the Beta posterior gives a Beta-Binomial compound distribution, wider than a plain binomial at a single theta.
Use P(y) = choose(m, y) * beta(a + y, b + m - y) / beta(a, b) with m = 5 and the base `beta()` function.

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
a <- 10; b <- 4; m <- 5
y  <- 0:m
pp <- choose(m, y) * beta(a + y, b + m - y) / beta(a, b)
ex_4_3 <- data.frame(successes = y, prob = round(pp, 4))
ex_4_3
#>   successes   prob
#> 1         0 0.0065
#> 2         1 0.0408
#> 3         2 0.1284
#> 4         3 0.2568
#> 5         4 0.3338
#> 6         5 0.2337
sum(pp)
#> [1] 1
```

**Explanation:** The Beta-Binomial is what you get when you refuse to freeze theta at a point estimate and instead carry its full posterior into the forecast. The resulting distribution has heavier tails than a binomial evaluated at theta-hat = 0.714, because it folds in the uncertainty about theta on top of the sampling variability. Predicting with `dbinom(y, 5, 0.714)` is the common shortcut that understates how uncertain a five-trial forecast really is.

</details>

### Exercise 4.4: Compare two models with their marginal likelihoods

**Task:** Compare a uniform-prior model M1 with prior Beta(1, 1) against a point-null model M2 that fixes theta = 0.5, for 8 successes in 10 trials. Compute each model's marginal likelihood and the Bayes factor for M1 over M2, storing the three numbers in a named vector `ex_4_4`.

**Expected result:**

```
#> marg_uniform    marg_null        BF_10 
#>       0.0909       0.0439       2.0687 
```

**Difficulty:** Advanced

[HINTS]
A model's marginal likelihood averages its data likelihood over its own prior, so a point-null model simply evaluates the binomial at 0.5.
M1's marginal is choose(n, k) * beta(1 + k, 1 + n - k) / beta(1, 1); M2's is `dbinom(8, 10, 0.5)`.

```r title="Your turn"
ex_4_4 <- # your code here
ex_4_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
n <- 10; k <- 8
marg_M1 <- choose(n, k) * beta(1 + k, 1 + (n - k)) / beta(1, 1)  # uniform prior
marg_M2 <- dbinom(k, n, 0.5)                                     # point null
BF10 <- marg_M1 / marg_M2
ex_4_4 <- round(c(marg_uniform = marg_M1, marg_null = marg_M2, BF_10 = BF10), 4)
ex_4_4
#> marg_uniform    marg_null        BF_10 
#>       0.0909       0.0439       2.0687 
```

**Explanation:** The marginal likelihood is the probability of the data averaged over a model's prior, and comparing two of them yields a Bayes factor that automatically penalizes needless flexibility, an embodiment of Occam's razor. The value near 2 says the free-parameter model explains 8 in 10 only about twice as well as the fair-coin model, which counts as weak evidence. Marginal likelihoods are notoriously sensitive to prior width, so a Bayes factor should always be reported with the prior it used.

</details>

## Section 5. Grid approximation (2 problems)

When no conjugate form exists, you can still approximate a posterior by evaluating prior times likelihood on a dense grid and normalizing. These two problems show the method reproducing a known answer, then handling a prior with no closed form.

### Exercise 5.1: Approximate a Beta-Binomial posterior on a grid

**Task:** Approximate the posterior for a success probability given 8 successes in 10 trials under a uniform prior by evaluating the likelihood on a grid of 1001 points from 0 to 1, normalizing to a posterior, and computing the grid posterior mean. Compare it with the exact Beta(9, 3) mean in a named vector `ex_5_1`.

**Expected result:**

```
#>  grid_mean exact_mean 
#>       0.75       0.75 
```

**Difficulty:** Intermediate

[HINTS]
A grid turns the integral behind the posterior mean into a weighted sum over closely spaced parameter values.
Evaluate `dbinom(8, 10, grid)`, divide by its sum to normalize, then compute sum(grid * post).

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
grid <- seq(0, 1, length.out = 1001)
lik  <- dbinom(8, 10, grid)      # uniform prior is a flat constant, drops out
post <- lik / sum(lik)
grid_mean  <- sum(grid * post)
exact_mean <- 9 / 12             # Beta(1+8, 1+2) mean
ex_5_1 <- round(c(grid_mean = grid_mean, exact_mean = exact_mean), 4)
ex_5_1
#>  grid_mean exact_mean 
#>       0.75       0.75 
```

**Explanation:** Grid approximation replaces calculus with arithmetic: lay down closely spaced values of theta, weight each by prior times likelihood, normalize so the weights sum to one, and any posterior summary becomes a weighted sum. With 1001 points it recovers the exact conjugate mean to the printed precision. The catch is dimensionality: a grid is fine for one or two parameters but the number of points explodes with each extra dimension, which is why real models reach for sampling instead.

</details>

### Exercise 5.2: Grid-approximate a posterior under a non-conjugate triangular prior

**Task:** Repeat the grid approximation for 8 successes in 10 trials but with a triangular prior peaked at 0.5, whose density is proportional to one minus twice the distance from 0.5 and has no conjugate form. Compute the grid posterior mean and the maximum a posteriori estimate, saving both in a named vector `ex_5_2`.

**Expected result:**

```
#> post_mean       map 
#>    0.6968    0.7270 
```

**Difficulty:** Advanced

[HINTS]
Grid methods do not care whether the prior is conjugate; you still multiply prior by likelihood pointwise.
Build the prior with `pmax(0, 1 - 2 * abs(grid - 0.5))`, multiply by the likelihood, normalize, then read sum(grid * post) and grid[which.max(post)].

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
grid  <- seq(0, 1, length.out = 1001)
prior <- pmax(0, 1 - 2 * abs(grid - 0.5))   # triangular tent peaked at 0.5
lik   <- dbinom(8, 10, grid)
post  <- prior * lik / sum(prior * lik)
post_mean <- sum(grid * post)
map_est   <- grid[which.max(post)]
ex_5_2 <- round(c(post_mean = post_mean, map = map_est), 4)
ex_5_2
#> post_mean       map 
#>    0.6968    0.7270 
```

**Explanation:** The triangular prior has no conjugate partner, so there is no Beta shortcut, yet the grid method handles it with the same three steps as before. The prior's pull toward 0.5 lowers the posterior mean to 0.697, below the conjugate 0.75, and the maximum a posteriori estimate at 0.727 marks the grid point of highest posterior density. The gap between the MAP and the mean signals a skewed posterior, a diagnostic you get for free once the whole curve is in hand.

</details>

## Section 6. Monte Carlo posterior sampling (3 problems)

The most general tool is to draw samples from the posterior and estimate any quantity by the matching sample statistic. Every problem here fixes the seed at 123 so the draws, and therefore the answers, reproduce exactly.

### Exercise 6.1: Summarise a Beta posterior from Monte Carlo draws

**Task:** Draw 10000 samples from the Beta(10, 4) posterior after setting the seed to 123, then estimate the posterior mean and a 95% credible interval from the samples and compare the Monte Carlo mean with the exact value 10/14, saving all four numbers in `ex_6_1`.

**Expected result:**

```
#>    mc_mean   mc_lower   mc_upper exact_mean 
#>     0.7142     0.4648     0.9124     0.7143 
```

**Difficulty:** Intermediate

[HINTS]
A large random sample from the posterior lets you estimate any summary by the corresponding sample statistic.
Use `set.seed(123)` then `rbeta(10000, 10, 4)`; take mean() and quantile(., c(0.025, 0.975)).

```r title="Your turn"
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(123)
draws <- rbeta(10000, 10, 4)
ex_6_1 <- round(c(mc_mean  = mean(draws),
                  mc_lower = quantile(draws, 0.025, names = FALSE),
                  mc_upper = quantile(draws, 0.975, names = FALSE),
                  exact_mean = 10 / 14), 4)
ex_6_1
#>    mc_mean   mc_lower   mc_upper exact_mean 
#>     0.7142     0.4648     0.9124     0.7143 
```

**Explanation:** Monte Carlo trades algebra for samples: with 10000 draws the sample mean matches the analytic posterior mean to three decimals, and the sample quantiles reproduce the credible interval from Exercise 3.1. The approximation error shrinks like one over the square root of the sample count, so more draws buy more precision. Fixing the seed is what makes the result reproducible, and it is the reason the same three problems in this section share identical draws.

</details>

### Exercise 6.2: Estimate a tail probability by Monte Carlo

**Task:** Using 10000 Beta(10, 4) posterior draws with the seed fixed at 123, estimate the posterior probability that theta exceeds 0.5 as the fraction of draws above that threshold, and compare it with the exact `pbeta` value, storing both in a named vector `ex_6_2`.

**Expected result:**

```
#>    mc_prob exact_prob 
#>     0.9551     0.9539 
```

**Difficulty:** Intermediate

[HINTS]
A probability is the expected value of a yes/no indicator, so averaging the indicator over your draws estimates it.
Compute mean(draws > 0.5) and compare with `pbeta(0.5, 10, 4, lower.tail = FALSE)`.

```r title="Your turn"
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(123)
draws <- rbeta(10000, 10, 4)
ex_6_2 <- round(c(mc_prob    = mean(draws > 0.5),
                  exact_prob = pbeta(0.5, 10, 4, lower.tail = FALSE)), 4)
ex_6_2
#>    mc_prob exact_prob 
#>     0.9551     0.9539 
```

**Explanation:** The comparison draws > 0.5 produces a logical vector, and taking its mean averages ones and zeros into the sampled probability, which lands within 0.002 of the exact tail area. This indicator-average trick estimates any event probability the same way, including events with no closed form where `pbeta` is unavailable. Its Monte Carlo error scales with the square root of p times one minus p over the sample size, so rare events need many more draws for the same relative accuracy.

</details>

### Exercise 6.3: Propagate posterior uncertainty into the odds

**Task:** Transform 10000 Beta(10, 4) posterior draws (seed 123) into the odds theta/(1 - theta), then report the posterior mean odds and a 95% credible interval for the odds, saving the three numbers in `ex_6_3`. This shows how uncertainty carries through a nonlinear transform.

**Expected result:**

```
#> mean_odds     lower     upper 
#>    3.3549    0.8685   10.4145 
```

**Difficulty:** Advanced

[HINTS]
To get the posterior of a function of theta, apply the function to each draw and summarise the transformed sample.
Compute odds <- draws / (1 - draws), then take mean(odds) and quantile(odds, c(0.025, 0.975)).

```r title="Your turn"
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(123)
draws <- rbeta(10000, 10, 4)
odds  <- draws / (1 - draws)
ex_6_3 <- round(c(mean_odds = mean(odds),
                  lower = quantile(odds, 0.025, names = FALSE),
                  upper = quantile(odds, 0.975, names = FALSE)), 4)
ex_6_3
#> mean_odds     lower     upper 
#>    3.3549    0.8685   10.4145 
```

**Explanation:** The change-of-variables calculus that a nonlinear transform normally demands disappears once you have draws: apply the function elementwise and summarise the result. The odds distribution is strongly right-skewed, so its mean of 3.35 sits well above its median and the upper credible bound stretches past 10. Plugging the posterior mean odds from a single point estimate would badly understate that upper tail, which is precisely why Monte Carlo is the default for derived quantities in modern Bayesian work.

</details>

## What to do next

You have now applied Bayes' theorem by hand, in closed form, on a grid, and by simulation. Keep going with these related resources:

- [Bayesian Statistics in R](Bayesian-Statistics-in-R.html): the full tutorial behind these problems, from priors to posterior inference.
- [Bayesian Statistics Exercises in R](Bayesian-Statistics-Exercises-in-R.html): more practice on priors, likelihoods and posterior summaries.
- [Probability Distributions Exercises in R](Probability-Distributions-Exercises-in-R.html): drill the Beta, Binomial and Normal densities these problems lean on.
- [Confidence Interval Exercises in R](Confidence-Interval-Exercises-in-R.html): sharpen the frequentist side of the credible-versus-confidence contrast.
