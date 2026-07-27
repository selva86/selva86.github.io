---
title: "p-Hacking, Forking Paths and Preregistration"
slug: "p-Hacking-and-Preregistration"
description: "P-hacking and the garden of forking paths quietly push false positives far above 5%. See it happen in R by simulation, then use preregistration to fix it."
keywords: "p-hacking, garden of forking paths, preregistration, researcher degrees of freedom, false positive rate, questionable research practices, confirmatory vs exploratory, p-hacking in R"
auto_link_terms: "p-hacking|garden of forking paths|forking paths|preregistration|researcher degrees of freedom|questionable research practices|optional stopping|confirmatory analysis|exploratory analysis|HARKing|multiverse analysis|p-hacking in R"
auto_link_case_sensitive: false
mathjax: true
webr: true
difficulty: "Intermediate"
date: "2026-07-27"
curriculum_id: "ST2-12.4"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "p-Hacking and Preregistration"
sidebar_order: 177
---

<p class="lead"><strong>p-Hacking</strong> is trying many analyses on the same data and reporting only the one that dips below p = 0.05. The <strong>garden of forking paths</strong> is the quieter cousin, where even a single, good-faith analysis is shaped by the data and inflates false positives without any conscious fishing. <strong>Preregistration</strong> fixes both by writing your analysis plan down before you ever see the numbers.</p>

## What is p-hacking, and why does it break your p-value?

A p-value below 0.05 only means "1-in-20 by chance" when the test was decided before you looked at the data. The moment you run several analyses and keep the best-looking one, that 1-in-20 promise quietly stops holding. The cleanest way to believe this is to watch it happen on data with no real effect at all. Everything here uses base R, so you can run each block in your browser.

Let's start with an honest researcher. We compare two groups of pure random noise with a t-test, repeat that 10,000 times, and count how often the p-value falls below 0.05. Since there is no real difference, the answer should be about 5%.

```r title="Honest single test on pure noise"
set.seed(101)
honest_test <- function() {
  group <- rep(c("A", "B"), each = 30)   # two groups, 30 each
  outcome <- rnorm(60)                    # pure noise: no real difference
  t.test(outcome ~ group)$p.value
}
false_alarms <- replicate(10000, honest_test())
mean(false_alarms < 0.05)
#> [1] 0.0486
```

The function draws 60 random values, splits them into two groups, and returns the t-test p-value. We repeat it 10,000 times and ask what fraction of those tests "found" a difference. The result, 0.0486, is almost exactly 5%. That is the false-positive rate working as advertised: run an honest test on noise, and about 1 in 20 will cross the line by luck.

Now let's p-hack. Imagine you measured five outcomes instead of one, say click-through, time-on-page, revenue, scroll depth, and returns. You run a test on each and report only the smallest p-value. Same noise, same null, but now you get five chances to get lucky.

```r title="Keep the smallest of five p-values"
set.seed(202)
phack_outcomes <- function() {
  group <- rep(c("A", "B"), each = 30)
  pvals <- replicate(5, t.test(rnorm(60) ~ group)$p.value)  # measure 5 outcomes
  min(pvals)                                                # keep the smallest
}
hacked <- replicate(10000, phack_outcomes())
mean(hacked < 0.05)
#> [1] 0.2236
```

Each study now generates five independent p-values, and we keep the minimum. Under the same pure-noise setup, the false-positive rate jumps from 5% to 0.2236, about 22%. Nothing about any single test changed. The p-values are still correct. What changed is the reporting rule: "show me the best of five" is a different question from "is this one test significant?"

![The p-hacking loop: keep tweaking the analysis until the p-value cooperates.](screenshots/p-Hacking-and-Preregistration-phacking-loop.webp)

*Figure 1: The p-hacking loop. Keep tweaking the analysis until the p-value cooperates, then report as if you ran one test.*

There is a simple formula behind that jump. If you run `m` roughly independent tests, each with a 5% false-positive rate, the chance that at least one of them dips below 0.05 by luck is:

$$P(\text{at least one } p < 0.05) = 1 - (1 - \alpha)^m$$

Where:

- $\alpha$ = the per-test false-positive rate, here 0.05
- $m$ = the number of independent tests you tried

For five outcomes, that predicts $1 - 0.95^5 = 0.226$, which matches our simulated 0.2236 closely. If the math is not your thing, skip it: the simulation already told you the story. More tries means more false alarms.

[KEY INSIGHT]
**The p-values are still correct, your reporting rule is not.** Each individual test still has a 5% error rate; p-hacking inflates the overall error by silently picking the winner from many tries and presenting it as if it were the only test you ran.

**Try it:** Change the code to keep the smallest of ten outcomes instead of five. Predict the false-positive rate with the formula first, then check it by simulation.

```r title="Your turn: hack ten outcomes"
ex_phack10 <- function() {
  group <- rep(c("A", "B"), each = 30)
  # your code here: return the minimum of 10 t-test p-values
}
# When your body is ready, run:
# set.seed(303); mean(replicate(10000, ex_phack10()) < 0.05)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Ten-outcome hack solution"
ex_phack10 <- function() {
  group <- rep(c("A", "B"), each = 30)
  min(replicate(10, t.test(rnorm(60) ~ group)$p.value))
}
set.seed(303)
mean(replicate(10000, ex_phack10()) < 0.05)
#> [1] 0.4058
```

**Explanation:** With ten outcomes the false-positive rate climbs to about 41%, close to the formula's prediction of $1 - 0.95^{10} = 0.40$. Doubling the number of tries nearly doubled your odds of a false alarm.

</details>

## What are researcher degrees of freedom?

The five-outcomes trick is one example of a broader problem. Every analysis involves small choices, and each choice you make after seeing the data is a chance to nudge the result. Simmons, Nelson and Simonsohn named these "researcher degrees of freedom" in their 2011 paper, and showed that just four common ones can push the false-positive rate above 60%.

Here are the four they studied, in plain terms:

1. **Choice of outcome.** Measure several dependent variables and report whichever one worked (the trick you just simulated).
2. **Choice of sample size.** Keep collecting data and stop the moment the result turns significant. This is called optional stopping.
3. **Choice of covariates.** Add or drop control variables like age or gender until the key effect appears.
4. **Choice of conditions.** Drop an experimental group or a subset of trials that muddies the picture.

Optional stopping is worth simulating because it feels so innocent. "I'll just collect a bit more data and check again" sounds responsible, but checking repeatedly and stopping at the first significant result is a powerful way to manufacture false positives. Here we start with 20 per group, test, and if it is not significant we add five more per group and test again, up to 100 per group.

```r title="Peek and stop when it turns significant"
set.seed(404)
peek_until_significant <- function() {
  a <- rnorm(20); b <- rnorm(20)                 # start with 20 per group
  for (extra in 0:16) {                          # add up to 16 * 5 = 80 more
    if (extra > 0) { a <- c(a, rnorm(5)); b <- c(b, rnorm(5)) }
    if (t.test(a, b)$p.value < 0.05) return(TRUE) # stop the moment it "works"
  }
  FALSE
}
mean(replicate(5000, peek_until_significant()))
#> [1] 0.1878
```

The loop tests the data, and if the p-value is not yet below 0.05 it adds a few more observations and tests again, stopping as soon as it crosses the line. Both groups are pure noise, so a fair test should flag about 5%. Instead we get 0.1878, almost 19%. Peeking gave the noise many chances to cross 0.05, and roughly one time in five it eventually did.

[WARNING]
**Peeking at a running experiment and stopping at significance inflates your error rate.** Every extra look is another chance for noise to cross 0.05, so an analysis that "reached significance after we collected more data" is a red flag unless the stopping rule was fixed in advance.

**Try it:** Make the peeking even more aggressive by adding just two observations per group each step, up to a maximum of 40 per group. Does peeking more often make it better or worse?

```r title="Your turn: peek every two observations"
ex_peek2 <- function() {
  a <- rnorm(20); b <- rnorm(20)
  # your code here: add 2 per group each step, up to n = 40, stop early if p < 0.05
}
# set.seed(505); mean(replicate(5000, ex_peek2()))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Peek-every-two solution"
ex_peek2 <- function() {
  a <- rnorm(20); b <- rnorm(20)
  for (extra in 0:10) {
    if (extra > 0) { a <- c(a, rnorm(2)); b <- c(b, rnorm(2)) }
    if (t.test(a, b)$p.value < 0.05) return(TRUE)
  }
  FALSE
}
set.seed(505)
mean(replicate(5000, ex_peek2()))
#> [1] 0.1258
```

**Explanation:** Even with a smaller data budget (a maximum of 40 per group), peeking still lifts the false-positive rate to about 13%. The inflation comes from the repeated looks, not the sample size.

</details>

## What is the garden of forking paths?

So far every example involved a researcher who consciously tried many things and cherry-picked. But here is the unsettling part: you can inflate your error rate without ever running more than one test. Andrew Gelman and Eric Loken called this "the garden of forking paths".

The idea is that your single analysis is not fixed in advance. It is contingent on the data. If the effect had shown up in men, you would have reported the male subgroup. If a value looked extreme, you would have dropped it as an outlier. You only walk one path, so you feel honest, but the path you take depends on what the data hands you. To measure your true error rate, you have to count every fork you could have taken.

Let's simulate a good-faith analyst. They correlate two unrelated variables, but their choice of which subgroup to report depends on the data. We count all the forks: the full sample, the "low" subgroup, and the "high" subgroup, and report the best-looking one.

```r title="Report the best of three forks"
set.seed(606)
forking_analysis <- function() {
  x <- rnorm(100); y <- rnorm(100)                 # x and y are unrelated
  covar <- sample(c("low", "high"), 100, replace = TRUE)
  p_all  <- cor.test(x, y)$p.value
  p_low  <- cor.test(x[covar == "low"],  y[covar == "low"])$p.value
  p_high <- cor.test(x[covar == "high"], y[covar == "high"])$p.value
  min(p_all, p_low, p_high)                         # report the best-looking fork
}
mean(replicate(5000, forking_analysis()) < 0.05)
#> [1] 0.1092
```

For each study the analyst computes three correlations and reports the smallest p-value, because that is the one they would have found "interesting" enough to write up. The false-positive rate is 0.1092, about 11%, even though each finished paper contains exactly one reported test. The forks share data so they are correlated, which is why 11% sits below the fully-independent ceiling of $1 - 0.95^3 = 14\%$, but it is still more than double the 5% you were promised.

![The garden of forking paths: one dataset, many analyses you could have run, one reported.](screenshots/p-Hacking-and-Preregistration-forking-paths.webp)

*Figure 2: The garden of forking paths. One dataset supports many analyses you could have run, and reporting only the branch that worked inflates the error rate.*

[NOTE]
**"I only ran one test" is not a defense against the forking paths.** What matters is not how many tests you ran, but how many you would have been willing to run had the data looked different. Data-dependent choices are implicit multiple comparisons even when you never see the other branches.

This is the deep difference between the two problems. p-Hacking is a behavior you can choose to stop. The garden of forking paths is a structure that traps even careful, well-meaning researchers, which is exactly why good intentions are not enough.

**Try it:** Add a fourth fork to the analysis, a "remove the most extreme value" path, and report the minimum p-value across all four. The scaffold below already sets up the data.

```r title="Your turn: add a fourth fork"
ex_fork4 <- function() {
  x <- rnorm(100); y <- rnorm(100)
  covar <- sample(c("low", "high"), 100, replace = TRUE)
  # your code here: also test x and y after dropping the largest |x| value,
  # then return the minimum p-value across all four forks
}
# set.seed(707); mean(replicate(5000, ex_fork4()) < 0.05)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Four-fork solution"
ex_fork4 <- function() {
  x <- rnorm(100); y <- rnorm(100)
  covar <- sample(c("low", "high"), 100, replace = TRUE)
  drop <- which.max(abs(x))                         # the "remove an outlier" path
  p_all  <- cor.test(x, y)$p.value
  p_low  <- cor.test(x[covar == "low"],  y[covar == "low"])$p.value
  p_high <- cor.test(x[covar == "high"], y[covar == "high"])$p.value
  p_out  <- cor.test(x[-drop], y[-drop])$p.value
  min(p_all, p_low, p_high, p_out)
}
set.seed(707)
mean(replicate(5000, ex_fork4()) < 0.05)
#> [1] 0.1286
```

**Explanation:** Adding one more defensible-sounding choice pushes the false-positive rate to about 13%. Each extra fork you would have been willing to walk down adds more room for noise to look like signal.

</details>

## How does preregistration stop p-hacking?

If the problem is that your analysis choices depend on the data, the fix is to make those choices before the data exists. That is preregistration: you write down your hypothesis and your exact analysis plan, timestamp it in a public registry, and then collect your data. There are no forks left to walk because you already committed to a single path.

Watch what happens to the exact same forking scenario when the analysis is fixed in advance. The data-generating process is identical to the previous section, but now the analyst pre-specified one test on the full sample, with no subgroup fishing.

```r title="A pre-specified single analysis"
set.seed(808)
prereg_analysis <- function() {
  x <- rnorm(100); y <- rnorm(100)
  cor.test(x, y)$p.value                            # ONE test, decided in advance
}
mean(replicate(10000, prereg_analysis()) < 0.05)
#> [1] 0.0513
```

Same noise, same variables, but only one pre-committed test per study. The false-positive rate is 0.0513, right back at the nominal 5%. Preregistration did not change your data or your statistics. It removed the flexibility that was inflating your error rate in the first place.

A useful preregistration pins down every choice that could otherwise become a fork:

1. **The hypothesis and its direction.** What effect do you predict, and which way?
2. **Sample size and stopping rule.** How many observations, decided before you start, with no peeking.
3. **Exclusion criteria.** Exactly which data points you will drop, and the rule for doing so.
4. **The primary outcome.** The one measure that decides the question, chosen up front.
5. **The model and covariates.** The exact test or model, including which controls go in.
6. **Any transformations.** Logs, standardization, or trimming, specified in advance.

Preregistration does not ban curiosity. It separates two kinds of work that were tangled together. A **confirmatory** analysis tests a prediction you committed to in advance, and its p-value means what it says. An **exploratory** analysis goes looking for patterns after the fact, which is a wonderful way to generate new hypotheses, as long as you label it honestly and test those hypotheses on fresh data later.

![Preregistration splits research into confirmatory tests and labelled exploration.](screenshots/p-Hacking-and-Preregistration-confirmatory-exploratory.webp)

*Figure 3: Preregistration separates confirmatory tests, whose p-values are valid, from exploratory analysis, which generates ideas to test later.*

You can preregister for free in a few places. The Open Science Framework (OSF) hosts time-stamped registrations, AsPredicted asks nine short questions and is popular for quick studies, and a Registered Report goes further by sending your plan through peer review before data collection so the journal commits to publishing the result whichever way it turns out.

[TIP]
**A fixed random seed is a micro-preregistration of your randomness.** Calling set.seed() before any simulation or resampling locks in exactly one path through the random number generator, so anyone can reproduce your numbers. It is the same idea as preregistration, applied to your code. See our guide on the [reproducibility crisis](Reproducibility-Crisis.html) for the full set of habits.

**Try it:** Preregistration is not only about avoiding subgroups. Pre-specify a covariate-adjusted model, `lm(y ~ x + z)`, and confirm it also holds the false-positive rate near 5%.

```r title="Your turn: pre-specify an adjusted model"
ex_prereg_adj <- function() {
  x <- rnorm(100); y <- rnorm(100); z <- rnorm(100)
  # your code here: fit lm(y ~ x + z) and return the p-value for x
}
# set.seed(909); mean(replicate(5000, ex_prereg_adj()) < 0.05)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Pre-specified adjusted model solution"
ex_prereg_adj <- function() {
  x <- rnorm(100); y <- rnorm(100); z <- rnorm(100)
  fit <- lm(y ~ x + z)
  summary(fit)$coefficients["x", "Pr(>|t|)"]
}
set.seed(909)
mean(replicate(5000, ex_prereg_adj()) < 0.05)
#> [1] 0.0446
```

**Explanation:** A single pre-specified model, even one with a covariate, holds the false-positive rate near 5%. What inflates error is choosing the covariate after seeing the data, not the covariate itself.

</details>

## What if you still need to explore the data?

Sometimes you genuinely cannot pre-specify everything. Which outliers count as errors, whether to log-transform, which covariates matter: these choices are debatable and data-dependent by nature. Hiding that uncertainty by reporting one path is p-hacking. The honest alternative is a multiverse analysis: run every reasonable version of the analysis and report the whole spread of results, so your reader can see how fragile or robust the finding is.

Here we take a dataset with a small, genuine effect and vary two defensible choices: whether to trim extreme outliers, and whether to adjust for age. That gives a small "multiverse" of four analyses.

```r title="Build a four-path multiverse"
set.seed(111)
n <- 120
treat <- rep(0:1, each = n / 2)
outcome <- 0.30 * treat + rnorm(n)                 # a small, real effect
age <- rnorm(n, 50, 10)

multiverse <- expand.grid(
  exclude = c("none", "trim2.5SD"),
  adjust  = c("no", "age"),
  stringsAsFactors = FALSE
)
run_path <- function(exclude, adjust) {
  keep <- if (exclude == "trim2.5SD") as.vector(abs(scale(outcome)) < 2.5) else rep(TRUE, n)
  d <- data.frame(outcome, treat, age)[keep, ]
  form <- if (adjust == "age") outcome ~ treat + age else outcome ~ treat
  coef(summary(lm(form, data = d)))["treat", "Pr(>|t|)"]
}
multiverse$p_value <- round(mapply(run_path, multiverse$exclude, multiverse$adjust), 4)
multiverse
#>     exclude adjust p_value
#> 1      none     no  0.0340
#> 2 trim2.5SD     no  0.0555
#> 3      none    age  0.0329
#> 4 trim2.5SD    age  0.0541
```

Each row is one defensible analysis and its p-value for the treatment effect. In the code, `scale()` rescales `outcome` into standard-deviation units, so `abs(scale(outcome)) < 2.5` keeps only the points within 2.5 standard deviations of the mean. Look closely: with no trimming the effect is significant (p around 0.033), but trimming outliers at 2.5 standard deviations pushes it just over 0.05 (p around 0.055). The finding sits right at the boundary of the outlier rule. A p-hacker would report only row 1 and call it a discovery. A multiverse analysis reports all four rows and lets you say, honestly, that the effect is real but fragile.

[WARNING]
**A multiverse you mine for the significant cell is p-hacking with extra steps.** The point of running every path is to report the whole distribution of results, not to scan it for the one row below 0.05. If you only show the branches that worked, you have rebuilt the garden of forking paths.

**Try it:** Add a third, looser exclusion rule, `trim3SD`, so the multiverse has six paths, then count how many of them are significant.

```r title="Your turn: expand the multiverse"
ex_multi <- expand.grid(
  exclude = c("none", "trim2.5SD", "trim3SD"),
  adjust  = c("no", "age"),
  stringsAsFactors = FALSE
)
# your code here: write a run_path that also handles "trim3SD",
# add a p_value column, then count how many paths fall below 0.05
```

<details>
<summary>Click to reveal solution</summary>

```r title="Six-path multiverse solution"
run_path2 <- function(exclude, adjust) {
  cut  <- switch(exclude, "trim2.5SD" = 2.5, "trim3SD" = 3, Inf)
  keep <- as.vector(abs(scale(outcome)) < cut)
  d <- data.frame(outcome, treat, age)[keep, ]
  form <- if (adjust == "age") outcome ~ treat + age else outcome ~ treat
  coef(summary(lm(form, data = d)))["treat", "Pr(>|t|)"]
}
ex_multi$p_value <- round(mapply(run_path2, ex_multi$exclude, ex_multi$adjust), 4)
sum(ex_multi$p_value < 0.05)
#> [1] 4
```

**Explanation:** Four of the six paths are significant. The looser 3 SD trim keeps more data and recovers significance, so whether you call the result "significant" depends on a choice most readers would never see. Reporting all six is what makes the analysis honest.

</details>

## Complete Example: From p-Hacking to a Preregistered A/B Test

Let's tie everything together with a story you might actually live through. You run an A/B test on a website. There is no real difference between the control and the treatment: both convert at 20%. The overall test will say so. But you are under pressure to find a "win", so you start slicing the results by device, browser, and country, testing every segment for a difference.

```r title="Fish an A/B test across segments"
set.seed(4242)
n_ab <- 3000
ab <- data.frame(
  variant   = rep(c("control", "treatment"), each = n_ab / 2),
  device    = sample(c("mobile", "desktop"), n_ab, replace = TRUE),
  browser   = sample(c("chrome", "safari", "firefox"), n_ab, replace = TRUE),
  country   = sample(c("US", "UK", "IN"), n_ab, replace = TRUE),
  converted = rbinom(n_ab, 1, 0.20)                # same 20% rate for everyone
)
overall <- prop.test(table(ab$variant, ab$converted))$p.value
slice_p <- with(ab, tapply(seq_len(n_ab), list(device, browser, country), function(i) {
  prop.test(table(variant[i], converted[i]))$p.value   # test every segment
}))
round(c(overall = overall, best_slice = min(slice_p, na.rm = TRUE)), 3)
#>    overall best_slice
#>      0.788      0.017
```

The overall test returns p = 0.788, correctly reporting no difference. But once we split the users into 18 device-by-browser-by-country segments and keep the best one, we find a slice (desktop, Safari, UK) with p = 0.017. Framed as "Safari users on desktop in the UK converted significantly better", that looks like a real, shippable finding. It is pure noise, dressed up by 18 chances to get lucky.

Now here is the same test run the preregistered way. Before the experiment launched, you wrote down a plan: the primary metric is the overall conversion rate, tested once with a two-proportion test at alpha = 0.05. Segment breakdowns are allowed, but they are labelled exploratory and would need their own confirmatory test later.

```r title="Report the preregistered primary metric"
prereg_result <- prop.test(table(ab$variant, ab$converted))
round(prereg_result$p.value, 3)
#> [1] 0.788
```

The preregistered analysis reports p = 0.788 and honestly concludes there was no lift. The Safari-desktop-UK pattern is not thrown away; it becomes a hypothesis you can test in the next experiment. Same data, same code, but one workflow ships a false positive and the other tells the truth.

## Practice Exercises

These combine several ideas from the tutorial. Each uses its own variable names so it will not clash with the code above.

### Exercise 1: Measure the cost of one extra outcome

Compare an honest analyst to a mild p-hacker in a single run. The honest analyst runs one t-test on 25-per-group noise. The hacker measures three outcomes and keeps the smallest p-value. Estimate both false-positive rates over 5,000 simulations and report them together.

```r title="Exercise 1 starter"
# Build honest_rate (one test) and hacked_rate (best of three), then compare.
# Hint: wrap the test logic in replicate(5000, { ... < 0.05 }) and take the mean.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
set.seed(1212)
honest_rate <- mean(replicate(5000, {
  g <- rep(c("A", "B"), each = 25)
  t.test(rnorm(50) ~ g)$p.value < 0.05
}))
hacked_rate <- mean(replicate(5000, {
  g <- rep(c("A", "B"), each = 25)
  min(replicate(3, t.test(rnorm(50) ~ g)$p.value)) < 0.05
}))
round(c(honest = honest_rate, hacked = hacked_rate), 3)
#> honest hacked
#>  0.050  0.143
```

**Explanation:** The honest rate sits at the expected 5%, while keeping the best of three outcomes nearly triples it to about 14%. Even a "small" amount of flexibility has a large, measurable cost.

</details>

### Exercise 2: Stack two degrees of freedom

Real p-hacking rarely uses just one trick. Write a function that combines optional stopping with multiple outcomes: track two outcomes, peek after every batch of 10 new observations per group (starting at 20, up to 60), and declare success if either outcome ever crosses 0.05. Estimate the false-positive rate over 3,000 simulations.

```r title="Exercise 2 starter"
combo_hack <- function() {
  # your code here: peek up to n = 60 AND test two outcomes each step,
  # returning TRUE if either outcome ever reaches p < 0.05
  FALSE
}
# set.seed(1313); mean(replicate(3000, combo_hack()))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
set.seed(1313)
combo_hack <- function() {
  a1 <- rnorm(20); b1 <- rnorm(20)
  a2 <- rnorm(20); b2 <- rnorm(20)
  for (extra in 0:4) {
    if (extra > 0) {
      a1 <- c(a1, rnorm(10)); b1 <- c(b1, rnorm(10))
      a2 <- c(a2, rnorm(10)); b2 <- c(b2, rnorm(10))
    }
    if (t.test(a1, b1)$p.value < 0.05 || t.test(a2, b2)$p.value < 0.05) return(TRUE)
  }
  FALSE
}
mean(replicate(3000, combo_hack()))
#> [1] 0.2283333
```

**Explanation:** Combining two flexibilities pushes the false-positive rate to about 23%, higher than either trick alone. Researcher degrees of freedom stack, which is how honest-looking studies reach the 60%-plus rates in the literature.

</details>

### Exercise 3: Preregister the sample size

Show that fixing the plan in advance repairs the damage from Exercise 2's peeking. Write a function that draws a fixed 60 observations per group, decided before any data is seen, runs the t-test exactly once, and returns whether p is below 0.05. Estimate the rate over 5,000 simulations.

```r title="Exercise 3 starter"
fixed_n_test <- function() {
  # your code here: draw 60 per group, run ONE t-test, return TRUE if p < 0.05
}
# set.seed(1414); mean(replicate(5000, fixed_n_test()))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
set.seed(1414)
fixed_n_test <- function() {
  a <- rnorm(60); b <- rnorm(60)     # sample size fixed in advance, tested once
  t.test(a, b)$p.value < 0.05
}
mean(replicate(5000, fixed_n_test()))
#> [1] 0.049
```

**Explanation:** With the sample size preregistered and a single test, the false-positive rate falls back to 5%. The cure for optional stopping is not a fancier statistic, it is committing to your `n` before you look.

</details>

## Summary

p-Hacking, the garden of forking paths, and preregistration are three views of one idea: a p-value is only trustworthy when the analysis that produced it was chosen independently of the data. The mindmap below recaps how the pieces fit.

![The whole picture: problem, structure, behavior, and fix.](screenshots/p-Hacking-and-Preregistration-overview-mindmap.webp)

*Figure 4: The problem (researcher degrees of freedom), the structure (forking paths), the behavior (selective reporting), and the fix (preregistration).*

Here are the takeaways worth keeping:

| Concept | What it is | Why it inflates error | The fix |
|---|---|---|---|
| p-Hacking | Trying many analyses, reporting the best | Many chances to cross 0.05 by luck | Pre-specify one analysis |
| Researcher degrees of freedom | Flexible choices in outcomes, sample size, covariates, conditions | Each post-hoc choice is a hidden test | Decide every choice up front |
| Garden of forking paths | Data-dependent choices in a single analysis | Implicit multiple comparisons, even in good faith | Preregistration removes the forks |
| Optional stopping | Collecting data until significant | Every peek is another chance | Fix the sample size in advance |
| Multiverse analysis | Running every reasonable version | Only a problem if you cherry-pick | Report the full spread, not one cell |

The habit is simple to state and hard to keep: separate confirmatory work, which tests a plan you committed to, from exploratory work, which generates the plans you will test next. When you cannot pre-specify a choice, run the multiverse and show the reader every branch. Your future self, and everyone who tries to build on your result, will thank you.

## Frequently Asked Questions

### Is p-hacking the same as fraud?

No. Fraud means fabricating or falsifying data on purpose. Most p-hacking is done by honest researchers who believe each individual choice they make is reasonable. That is what makes it so common and so hard to catch. The data are real; only the reporting rule is biased.

### How is the garden of forking paths different from p-hacking?

p-Hacking is a behavior: you consciously try several analyses and keep the best one. The garden of forking paths is a structure: even if you run a single analysis, your choice of that analysis was shaped by the data you saw. You do not need to fish deliberately to inflate your error rate, so the forking paths trap even careful people.

### Does preregistration mean I cannot explore my data?

Not at all. Preregistration does not forbid exploration; it labels it. Anything you planned in advance is confirmatory, and its p-value is valid. Anything you discover after looking is exploratory, which is a great source of new hypotheses you can confirm in a later study on fresh data.

### Can I preregister after I have already collected the data?

Only if you have not looked at it in a way that could bias your plan. The whole point is that your analysis choices are independent of the outcomes. If the data already shaped your thinking, a "preregistration" written afterward does not remove the forks. In that situation, be transparent and run a multiverse analysis instead.

### How is this different from correcting for multiple comparisons?

Multiple-comparison corrections like Bonferroni assume you can count every test you ran. p-Hacking and forking paths are harder because the extra tests are hidden or hypothetical, so there is no clean count to correct. Preregistration prevents the hidden tests from happening at all. See [Multiple Testing in R](Multiple-Comparisons-in-R.html) for the correction math when the count is known.

## References

1. Simmons, J. P., Nelson, L. D., & Simonsohn, U. (2011). *False-Positive Psychology: Undisclosed Flexibility in Data Collection and Analysis Allows Presenting Anything as Significant*. Psychological Science, 22(11). [Link](https://journals.sagepub.com/doi/10.1177/0956797611417632)
2. Gelman, A., & Loken, E. (2013). *The Garden of Forking Paths: Why Multiple Comparisons Can Be a Problem, Even When There Is No "Fishing Expedition"*. [Link](http://www.stat.columbia.edu/~gelman/research/unpublished/forking.pdf)
3. Steegen, S., Tuerlinckx, F., Gelman, A., & Vanpaemel, W. (2016). *Increasing Transparency Through a Multiverse Analysis*. Perspectives on Psychological Science, 11(5). [Link](https://journals.sagepub.com/doi/10.1177/1745691616658637)
4. Head, M. L., Holman, L., Lanfear, R., Kahn, A. T., & Jennions, M. D. (2015). *The Extent and Consequences of P-Hacking in Science*. PLOS Biology, 13(3). [Link](https://journals.plos.org/plosbiology/article?id=10.1371/journal.pbio.1002106)
5. Nosek, B. A., et al. (2018). *The Preregistration Revolution*. PNAS, 115(11). [Link](https://www.pnas.org/doi/10.1073/pnas.1708274114)
6. Center for Open Science. *Preregistration on the Open Science Framework (OSF)*. [Link](https://www.cos.io/initiatives/prereg)
7. R Core Team. *t.test and cor.test, base stats package documentation*. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/t.test.html)

## Continue Learning

- [What p-Values Mean (and What They Never Meant)](What-p-Values-Mean.html) - build the p-value from scratch by simulation, so the false-positive logic here feels obvious.
- [Multiple Testing in R](Multiple-Comparisons-in-R.html) - when you deliberately run many tests, correct them with Bonferroni and Benjamini-Hochberg FDR.
- [R and the Reproducibility Crisis](Reproducibility-Crisis.html) - five R habits, from seeds to pre-specified plans, that make your analysis verifiable.
