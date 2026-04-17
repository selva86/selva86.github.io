---
title: "Hypergeometric Distribution in R: Sampling Without Replacement"
slug: "Hypergeometric-Distribution-in-R"
description: "Model sampling without replacement in R with dhyper, phyper, qhyper, and rhyper. Worked QA, card, and audit examples plus how it differs from binomial."
keywords: "hypergeometric distribution R, dhyper, phyper, qhyper, rhyper, sampling without replacement, R probability distribution, finite population sampling"
mathjax: true
webr: true
difficulty: "Intermediate"
date: "2026-04-17"
curriculum_id: "FR-prob-12"
post_type: "FR"
fr_parent: "Binomial-and-Poisson-Distributions-in-R.html"
auto_link_terms: "hypergeometric distribution|sampling without replacement|dhyper()|phyper()|qhyper()|rhyper()|finite population correction|without replacement probability"
auto_link_case_sensitive: true
---

# Hypergeometric Distribution in R: Sampling Without Replacement

<p class="lead">The hypergeometric distribution gives the probability of drawing a certain number of successes from a finite population when you sample <em>without</em> replacement — think defective chips pulled from a shipment, or aces dealt from a poker deck. R ships four functions for it in base stats: dhyper(), phyper(), qhyper(), and rhyper().</p>

## What does the hypergeometric distribution model?

Picture a box of 50 microchips on a QA bench. Exactly 8 are defective and 42 are good. You pull 10 chips at random — no chip goes back in the box — and count the bad ones. The hypergeometric distribution tells you how likely any particular count is. Its key move is that every draw shrinks the remaining pool, so the odds of a defective chip shift as you sample.

Here is the payoff question for that scenario: what is the probability that exactly 2 of the 10 chips you pulled are defective?

```r
# QA scenario: 50 chips, 8 defective, 42 good. Sample of 10.
# P(exactly 2 defective in the sample) = dhyper(x, m, n, k)
p_two <- dhyper(x = 2, m = 8, n = 42, k = 10)
round(p_two, 4)
#> [1] 0.2812
```

There's about a 28.1% chance of finding exactly 2 defective chips. That single call answers the whole QA question in one line — no combinatorics by hand. The arguments map to the problem directly: `x` is the count of defectives you're asking about, `m` is the total defectives in the box, `n` is the total good chips, and `k` is the sample size.

![How m, n, and k map a finite population to a sample.](screenshots/Hypergeometric-Distribution-in-R-parameters.webp)
*Figure 1: How m, n, and k map a finite population to a sample.*

[KEY INSIGHT]
**Without replacement changes the odds mid-sample.** In a binomial setup, each trial has the same success probability. In a hypergeometric setup, every chip you pull alters the composition of the box — so trial 2's probability depends on trial 1's outcome. That dependence is the whole reason the hypergeometric distribution exists as its own family.

**Try it:** From the same box (8 defective, 42 good), you draw a smaller sample of 5 chips. Compute the probability of finding exactly 1 defective chip in that sample.

```r
# Try it: P(exactly 1 defective) in a sample of 5
ex_one_def <- dhyper(x = ___, m = ___, n = ___, k = ___)
round(ex_one_def, 4)
#> Expected: approximately 0.4015
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_one_def <- dhyper(x = 1, m = 8, n = 42, k = 5)
round(ex_one_def, 4)
#> [1] 0.4015
```

**Explanation:** With a smaller sample (k=5), pulling exactly one defective is the most likely single-count outcome — about 40%.

</details>

## How do you compute exact probabilities with dhyper()?

The single call you just ran is the whole density function. To see the distribution's shape, you evaluate `dhyper()` across every possible count of defectives and plot the result. The smallest possible count is 0 and the largest is `min(m, k)` — you can't pull more defectives than exist, and you can't pull more than the sample size.

```r
# Full PMF for 0..8 defectives in a sample of 10 (min(m, k) = 8)
defects <- 0:8
pmf <- dhyper(defects, m = 8, n = 42, k = 10)
round(pmf, 4)
#> [1] 0.1456 0.3362 0.2812 0.1524 0.0589 0.0173 0.0039 0.0007 0.0001

# Bar plot of the probability mass function
barplot(pmf, names.arg = defects,
        col = "steelblue", border = "white",
        xlab = "Number of defectives (x)",
        ylab = "P(X = x)",
        main = "Hypergeometric PMF: m=8, n=42, k=10")
```

The most likely outcome is 1 defective (33.6%), followed by 2 defectives (28.1%). The distribution is right-skewed and thins out fast — finding 5 or more defectives is below 2% combined. Those probabilities should sum to 1; a quick `sum(pmf)` confirms it.

[TIP]
**Support runs from 0 to min(m, k), not 0 to k.** If your sample size k is larger than the number of successes m in the population, x can never exceed m. R will still return 0 for dhyper(x, m, n, k) when x > min(m, k), but when you build a full PMF use `0:min(m, k)` so the plot stops at the real maximum.

[NOTE]
**R's hypergeometric uses m and n, not N.** Most textbooks write the hypergeometric in terms of total population size N and successes K. R splits the population into successes (m) and failures (n), so the total is m + n. Mix these up and you'll get garbage probabilities — always translate textbook N → m + n before calling dhyper().

Now swap out the QA context for a classic card example. A standard deck has 52 cards with 4 aces. You deal a 5-card poker hand. What is the probability of drawing exactly 3 aces?

```r
# 5-card hand from a 52-card deck: 4 aces (m), 48 non-aces (n), sample of 5
p_three_aces <- dhyper(x = 3, m = 4, n = 48, k = 5)
round(p_three_aces, 6)
#> [1] 0.001736
```

About 0.17% — roughly 1 hand in 577. Same function, same four arguments, completely different problem. That reusability is the reason to learn the function rather than memorize formulas per scenario.

**Try it:** Using the same 52-card deck setup, compute the probability of drawing exactly 2 kings in a 5-card hand.

```r
# Try it: P(exactly 2 kings in a 5-card hand)
ex_two_kings <- dhyper(x = ___, m = ___, n = ___, k = ___)
round(ex_two_kings, 4)
#> Expected: approximately 0.0399
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_two_kings <- dhyper(x = 2, m = 4, n = 48, k = 5)
round(ex_two_kings, 4)
#> [1] 0.0399
```

**Explanation:** 4 kings and 48 non-kings — same shape as the ace example because each face has the same count.

</details>

## How do you get cumulative probabilities with phyper()?

Quality control rarely asks "exactly 2 defectives?" The real question is "3 or fewer" or "more than 3." That's what `phyper()` computes — it sums the PMF up to a cutoff. By default it returns the lower-tail cumulative probability P(X ≤ q); set `lower.tail = FALSE` to get P(X > q) directly.

```r
# Cumulative: P(X <= 3) and P(X > 3) for the QA scenario
p_le3 <- phyper(q = 3, m = 8, n = 42, k = 10)
p_gt3 <- phyper(q = 3, m = 8, n = 42, k = 10, lower.tail = FALSE)
round(c(p_le3, p_gt3), 4)
#> [1] 0.9155 0.0845
```

In 91.6% of samples you'll see 3 or fewer defectives, leaving an 8.5% chance of finding more than 3. Those two values always sum to 1 — they're complementary events.

[TIP]
**Use lower.tail = FALSE for small tail probabilities.** Computing `1 - phyper(q, ...)` works, but when the tail is tiny (say 1e-12), subtraction from 1 loses precision and can return 0. The lower.tail = FALSE path evaluates the upper tail directly and keeps all significant digits.

Now shift to an auditing scenario. You receive a batch of 200 invoices from a vendor. Your historical data says about 5 invoices (2.5%) contain billing irregularities. You sample 20 invoices for audit. What is the probability of finding at most 1 irregular invoice?

```r
# Auditor: 200 invoices, 5 irregular, 195 clean, sample of 20
# P(at most 1 irregular invoice found) = phyper(1, 5, 195, 20)
p_audit_le1 <- phyper(q = 1, m = 5, n = 195, k = 20)
round(p_audit_le1, 4)
#> [1] 0.9416
```

There's a 94.2% chance the audit turns up 0 or 1 irregularity — which means a 5.8% chance of catching 2 or more. If your audit policy says "flag the vendor on 2+ irregularities," that 5.8% is your alarm rate under the status-quo irregular share.

**Try it:** Using the QA box (m=8 defective, n=42 good, sample k=10), compute the probability of finding **at least 1** defective chip. Hint: "at least 1" is the complement of "exactly 0."

```r
# Try it: P(at least 1 defective) = 1 - P(X = 0)
ex_at_least_1 <- 1 - dhyper(___, m = 8, n = 42, k = 10)
round(ex_at_least_1, 4)
#> Expected: approximately 0.8544
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_at_least_1 <- 1 - dhyper(0, m = 8, n = 42, k = 10)
round(ex_at_least_1, 4)
#> [1] 0.8544

# Equivalent via phyper with upper tail:
phyper(0, m = 8, n = 42, k = 10, lower.tail = FALSE)
#> [1] 0.8544
```

**Explanation:** "At least 1" is 1 minus "exactly 0." Both approaches give the same answer; the `phyper(0, ..., lower.tail = FALSE)` form is equivalent because P(X > 0) = P(X ≥ 1).

</details>

## How do you find quantiles and simulate draws with qhyper() and rhyper()?

Two more functions finish the family. `qhyper()` is the inverse of `phyper()` — give it a probability, get back the smallest x such that P(X ≤ x) reaches that probability. `rhyper()` generates random draws from the distribution, letting you simulate thousands of hypothetical samples and check expectations empirically.

First, quantiles. In the QA scenario, what defective counts correspond to the 5th, 50th, and 95th percentiles?

```r
# Quantiles of the hypergeometric distribution
q_levels <- qhyper(p = c(0.05, 0.50, 0.95), m = 8, n = 42, k = 10)
q_levels
#> [1] 0 1 3
```

The median sample has 1 defective, only 5% of samples will have 0 defectives or fewer, and 95% have 3 or fewer. That last number is your "one-sided 95% prediction interval" — a useful bar for setting QA tolerance rules.

Next, simulation. `rhyper(nn, m, n, k)` generates `nn` random hypergeometric samples. Always call `set.seed()` first for reproducibility — different seeds produce different draws.

```r
# Simulate 10,000 QA samples; compare empirical mean to theoretical mean
set.seed(2026)
sim_defects <- rhyper(nn = 10000, m = 8, n = 42, k = 10)

# Theoretical mean is k * m / (m + n)
theoretical_mean <- 10 * 8 / (8 + 42)
round(c(empirical = mean(sim_defects), theoretical = theoretical_mean), 4)
#> empirical theoretical
#>    1.6029      1.6000

# Histogram of simulated defective counts
hist(sim_defects, breaks = seq(-0.5, 8.5, by = 1),
     col = "steelblue", border = "white",
     xlab = "Defectives per sample of 10",
     main = "10,000 simulated QA samples")
```

The empirical mean is 1.6029, within rounding of the theoretical mean 1.6000. The histogram matches the PMF shape from earlier — that's the convergence you'd expect with 10,000 reps. Simulation is handy when you need to estimate quantities that don't have closed-form expressions, like "the probability that two independent audits both flag the vendor."

[WARNING]
**Call set.seed() before every random function, not once per session.** Running rhyper() twice without reseeding produces different samples. If your report depends on reproducible numbers, put `set.seed(N)` on the line directly above each `rhyper()` (or any random) call — not in a distant setup block.

**Try it:** Simulate dealing 5 poker hands and report how many aces each hand contained. Use `rhyper(5, m = 4, n = 48, k = 5)` and `set.seed(99)`.

```r
# Try it: 5 simulated 5-card hands, count aces
set.seed(99)
ex_ace_counts <- rhyper(nn = ___, m = ___, n = ___, k = ___)
ex_ace_counts
#> Expected: integer vector of length 5
```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(99)
ex_ace_counts <- rhyper(nn = 5, m = 4, n = 48, k = 5)
ex_ace_counts
#> [1] 0 0 1 0 0
```

**Explanation:** Most 5-card hands have 0 aces; one in this run had 1 ace. Matches the rarity shown by dhyper(3, 4, 48, 5) = 0.17%.

</details>

## How is hypergeometric different from the binomial distribution?

Binomial and hypergeometric both count successes in a fixed number of trials with two outcomes. The split is whether draws are with replacement. Binomial assumes independent trials with a constant success probability `p`. Hypergeometric drops the replacement assumption — each draw changes the remaining pool — which shrinks the variance relative to binomial. The shrinkage factor is called the **finite population correction**.

![Decision flow: use binomial or hypergeometric?](screenshots/Hypergeometric-Distribution-in-R-binomial-vs-hyper.webp)
*Figure 2: Decision flow: use binomial or hypergeometric?*

Mathematically, for the same success rate p = m/(m+n) and sample size k:

$$\text{Var}_\text{binomial} = k \, p \, (1 - p)$$

$$\text{Var}_\text{hyper} = k \, p \, (1 - p) \, \frac{N - k}{N - 1}$$

Where:
- $N = m + n$ is the total population size
- $p = m / N$ is the success rate in the population
- The factor $(N - k)/(N - 1)$ is the finite population correction — always ≤ 1, so hypergeometric variance is always smaller

Let's see the effect in numbers. Same QA scenario, same "success rate" (8 defective out of 50 = 16%), and same sample size (10). Binomial would treat each draw as independent with p = 0.16.

```r
# Same success rate 0.16, same sample size 10
# Binomial treats draws as independent; hypergeometric accounts for no replacement
p_binom_2 <- dbinom(x = 2, size = 10, prob = 0.16)
p_hyper_2 <- dhyper(x = 2, m = 8, n = 42, k = 10)
round(c(binomial = p_binom_2, hypergeometric = p_hyper_2), 4)
#>       binomial hypergeometric
#>         0.2759         0.2812
```

The binomial gives 27.6%, the hypergeometric gives 28.1%. Close, but not identical — hypergeometric is slightly more concentrated around the mean. The gap widens as the sample fraction k/N grows.

Now make the population large relative to the sample and watch the two distributions converge.

```r
# Large population (N=10000), small sample (k=10), same 16% success rate
# Hypergeometric approaches binomial when sample is a tiny fraction of population
p_binom_small <- dbinom(x = 2, size = 10, prob = 0.16)
p_hyper_small <- dhyper(x = 2, m = 1600, n = 8400, k = 10)
round(c(binomial = p_binom_small, hypergeometric = p_hyper_small), 6)
#>       binomial hypergeometric
#>       0.275924       0.275934
```

The two probabilities now match to four decimal places. Sampling 10 items from a pool of 10,000 barely dents the pool, so "without replacement" behaves almost identically to "with replacement."

[KEY INSIGHT]
**Rule of thumb: use binomial when the sample is under 10% of the population.** Below that threshold, the finite population correction factor is close to 1 and the two distributions agree to practical precision. Above it, the hypergeometric is the correct choice — especially for QA sampling, auditing, and any case where the population is genuinely finite.

**Try it:** You have a population of 1,000 people with 100 known responders (p = 10%). You sample 50 people. Compute both the binomial and hypergeometric probabilities of finding exactly 5 responders. They should be very close because the sample is 5% of the population.

```r
# Try it: binomial vs hypergeometric for a 5% sample fraction
ex_binom <- dbinom(x = 5, size = 50, prob = 0.10)
ex_hyper <- dhyper(x = 5, m = ___, n = ___, k = 50)
round(c(binomial = ex_binom, hypergeometric = ex_hyper), 4)
#> Expected: approximately 0.1849, 0.1890
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_binom <- dbinom(x = 5, size = 50, prob = 0.10)
ex_hyper <- dhyper(x = 5, m = 100, n = 900, k = 50)
round(c(binomial = ex_binom, hypergeometric = ex_hyper), 4)
#> binomial  hypergeometric
#>   0.1849          0.1890
```

**Explanation:** A 5% sample means the finite population correction barely moves the needle — the two agree to within 0.004.

</details>

## Practice Exercises

### Exercise 1: Build a lot-acceptance rule

You're QA engineer for a shipment of 200 electronics. Quality history says m = 12 items are defective. Your acceptance rule is: sample 20 items, accept the lot if at most 1 defective is found. What is the probability the lot is accepted?

```r
# Exercise 1: P(accept lot) = P(defectives <= 1)
# Hint: one call to phyper() with the right q, m, n, k

# Write your code:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_accept_prob <- phyper(q = 1, m = 12, n = 188, k = 20)
round(my_accept_prob, 4)
#> [1] 0.6930
```

**Explanation:** `phyper(1, 12, 188, 20)` sums the PMF for 0 and 1 defective in the sample. About 69.3% of lots with 12 defects out of 200 pass this rule — if you want a stricter gate, lower the acceptance cutoff or increase the sample size.

</details>

### Exercise 2: Validate dhyper() with rhyper()

Using `m = 15`, `n = 85`, `k = 20`, simulate 100,000 hypergeometric samples with `set.seed(1)`, compute the empirical PMF, then compare to the theoretical PMF from `dhyper()`. Report the maximum absolute difference across all possible outcomes.

```r
# Exercise 2: empirical vs theoretical PMF
# Hint: use table(my_sim) / length(my_sim) for the empirical PMF
# Hint: support is 0:min(m, k)

# Write your code:

```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(1)
my_sim <- rhyper(nn = 100000, m = 15, n = 85, k = 20)

support <- 0:min(15, 20)
theoretical <- dhyper(support, m = 15, n = 85, k = 20)

# Empirical PMF aligned to same support
emp <- table(factor(my_sim, levels = support)) / length(my_sim)
my_emp_pmf <- as.numeric(emp)

my_max_diff <- max(abs(my_emp_pmf - theoretical))
round(my_max_diff, 4)
#> [1] 0.0019
```

**Explanation:** With 100,000 samples, the empirical PMF lines up with the theoretical PMF to about 0.002 at the worst-matched outcome. That closeness is a sanity check — if your simulation and the analytic formula disagreed by much more, one of them would be wrong.

</details>

## Complete Example

Put all four functions to work on a realistic auditing problem.

**Setup.** A supplier delivers 250 invoices for the quarter. Based on prior audits, 15 invoices (6%) contain irregularities. Your team samples 30 invoices and inspects each for compliance.

**Step 1 — PMF of irregularities found.** How many irregular invoices might the sample turn up?

```r
# Invoice audit setup
invoice_total <- 250
invoice_irregular <- 15
invoice_clean <- invoice_total - invoice_irregular
invoice_sample <- 30

# Full PMF across possible outcomes
invoice_support <- 0:min(invoice_irregular, invoice_sample)
invoice_pmf <- dhyper(invoice_support, m = invoice_irregular,
                     n = invoice_clean, k = invoice_sample)
round(invoice_pmf, 4)
#> [1] 0.1361 0.2836 0.2731 0.1619 0.0665 0.0201 0.0046 0.0008 0.0001 0.0000 0.0000
#> [12] 0.0000 0.0000 0.0000 0.0000 0.0000
```

The most likely outcome is 1 irregular invoice (28.4%), followed by 2 (27.3%).

**Step 2 — Risk of missing everything.** What is the probability of seeing zero irregularities — the "audit missed them all" event?

```r
# P(0 irregularities in the sample)
invoice_miss_all <- dhyper(0, m = invoice_irregular,
                          n = invoice_clean, k = invoice_sample)
round(invoice_miss_all, 4)
#> [1] 0.1361
```

There's a 13.6% chance the audit finds nothing, even though 15 of 250 invoices are actually irregular. That's a meaningful false-clean rate — big enough to justify either a larger sample or a follow-up review when the first audit comes back clean.

**Step 3 — 95% upper prediction bound.** What's the largest count of irregularities you'd expect 95% of the time?

```r
# 95th-percentile count
invoice_upper95 <- qhyper(0.95, m = invoice_irregular,
                         n = invoice_clean, k = invoice_sample)
invoice_upper95
#> [1] 4
```

Ninety-five percent of audits turn up 4 or fewer irregularities; seeing 5 or more would be in the top 5% of samples — worth flagging for escalation.

**Step 4 — Simulate to cross-check.**

```r
# Simulate 10,000 audits, compare empirical to analytic summaries
set.seed(42)
invoice_sim <- rhyper(nn = 10000, m = invoice_irregular,
                     n = invoice_clean, k = invoice_sample)

invoice_empirical <- c(
  mean = mean(invoice_sim),
  p_zero = mean(invoice_sim == 0),
  q95 = quantile(invoice_sim, 0.95, names = FALSE)
)
invoice_theoretical <- c(
  mean = invoice_sample * invoice_irregular / invoice_total,
  p_zero = invoice_miss_all,
  q95 = invoice_upper95
)
round(rbind(empirical = invoice_empirical,
            theoretical = invoice_theoretical), 4)
#>                mean p_zero q95
#> empirical    1.8023 0.1343   4
#> theoretical  1.8000 0.1361   4
```

Empirical and theoretical line up: mean ≈ 1.8 irregularities per audit, 13.4–13.6% chance of missing them all, 95th percentile at 4. Now you can pitch a clear audit policy to the team: "Expect 1–2 irregularities per random sample of 30; flag any sample returning 5 or more."

[WARNING]
**Double-check that m + n equals your full population.** A common error is passing the total population size as `n`, which ignores the defective items and inflates the probabilities. Always define `n = total - m` explicitly and sanity-check `m + n` against your documented population size before trusting the output.

## Summary

| Function | Role | Typical question |
|---|---|---|
| `dhyper(x, m, n, k)` | Probability mass | What is the probability of exactly x successes? |
| `phyper(q, m, n, k)` | Cumulative probability | What is the probability of q or fewer successes? |
| `qhyper(p, m, n, k)` | Quantile (inverse CDF) | What count corresponds to the pth percentile? |
| `rhyper(nn, m, n, k)` | Random draws | Simulate hypothetical sample outcomes. |

Key ideas to take away:

1. Use the hypergeometric distribution whenever the population is **finite** and sampling is **without replacement** — QA lots, audits, card games, lotteries, capture-recapture.
2. R parameterizes by **m (successes) and n (failures)**, not total population size N. Translate textbook N → m + n before calling the functions.
3. When the **sample is under 10%** of the population, the binomial distribution is a fine approximation. Above that, use the hypergeometric.
4. Always **`set.seed()` directly above each random call** to keep reports reproducible.
5. **`lower.tail = FALSE`** gives tail probabilities with full precision — prefer it over `1 - phyper()` for small tails.

## References

1. R Core Team — *The Hypergeometric Distribution* (stats package reference). [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/Hypergeometric.html)
2. Dalgaard, P. — *Introductory Statistics with R*, 2nd Edition. Springer (2008). Chapter 3: Probability and distributions.
3. Wasserman, L. — *All of Statistics*. Springer (2004). Chapter 2: Random Variables.
4. NIST/SEMATECH — *Engineering Statistics Handbook*, Hypergeometric Distribution. [Link](https://www.itl.nist.gov/div898/handbook/eda/section3/eda366c.htm)
5. Wikipedia — *Hypergeometric distribution*. [Link](https://en.wikipedia.org/wiki/Hypergeometric_distribution)
6. R Core Team — *An Introduction to R*. [Link](https://cran.r-project.org/doc/manuals/r-release/R-intro.html)

## Continue Learning

- [Binomial vs Poisson in R](Binomial-and-Poisson-Distributions-in-R.html) — the parent post that compares two other count distributions you'll reach for when replacement *is* allowed.
- [Normal Distribution in R](Normal-Distribution-in-R.html) — the continuous distribution you'll hit once your sample sizes grow past the point where discrete counts are natural.
- [Probability Distributions in R](Probability-Distributions-in-R.html) — a tour of R's `d/p/q/r` convention across every built-in distribution.
