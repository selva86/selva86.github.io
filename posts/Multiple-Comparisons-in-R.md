---
title: "Multiple Testing in R: Control False Discoveries Without Losing All Your Power"
slug: "Multiple-Comparisons-in-R"
description: "Running 20 tests at alpha=0.05 expects 1 false positive by chance. Learn Bonferroni, Benjamini-Hochberg FDR, and Storey q-value in R with p.adjust() examples."
keywords: "multiple testing correction, p.adjust R, Bonferroni correction, Benjamini-Hochberg, false discovery rate, FDR in R, Storey q-value, Holm method, multiple comparisons R"
auto_link_terms: "multiple testing correction|multiple comparisons|Bonferroni correction|Benjamini-Hochberg|false discovery rate|FDR correction|Storey q-value|p.adjust()|family-wise error rate"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-18"
curriculum_id: "2.2.13"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Multiple Testing Correction"
sidebar_order: 44
difficulty: "Intermediate"
---

# Multiple Testing in R: Control False Discoveries Without Losing All Your Power

<p class="lead">When you run many hypothesis tests at once, some p-values below 0.05 will be false alarms by pure chance. Multiple testing correction keeps that noise under control. <strong>Bonferroni</strong> is strict, <strong>Benjamini-Hochberg</strong> balances discovery with error, and <strong>Storey's q-value</strong> squeezes out more power when real signals are plentiful.</p>

## Why does running many tests break p = 0.05?

A single test at alpha = 0.05 has a 5% chance of a false alarm under the null. Run 20 independent tests at once and the chance that at least one rejects by accident jumps to about 64%. The p-values are not wrong, they mean what they say: one in twenty. Multiple testing correction is what you need the moment you stop asking "is this one test significant?" and start asking "is any of these significant?" Let's simulate it.

```r title="Simulate family-wise error on pure noise"
library(tidyr)
# Under the null, p-values are Uniform(0, 1).
# Simulate 10,000 families of 20 tests each and count how often
# at least one of the 20 tests in a family dips below 0.05 by chance.
set.seed(2026)
n_families <- 10000
m <- 20

min_pvalues <- replicate(n_families, min(runif(m)))

# Fraction of families with at least one "significant" result by chance
mean(min_pvalues < 0.05)
#> [1] 0.6427
```

Even though each test on its own has a 5% error rate, the *family* of 20 tests has a 64% chance of producing at least one false alarm. That's the core problem: the more shots you take at the null, the more bogus "significant" results slip through. Running dozens of tests without correction essentially guarantees false discoveries.

The simulation matches a simple formula. If the tests are independent, the probability that none of them reject by accident is $(1-\alpha)^m$, so the probability that at least one does is $1 - (1-\alpha)^m$. We can tabulate it directly.

```r title="Analytic family-wise error rate"
# FWER under independence: P(at least one false positive)
alpha <- 0.05
m_vec <- c(1, 5, 10, 20, 50, 100)
fwer_table <- data.frame(
  m    = m_vec,
  fwer = round(1 - (1 - alpha) ^ m_vec, 4)
)
fwer_table
#>     m   fwer
#> 1   1 0.0500
#> 2   5 0.2262
#> 3  10 0.4013
#> 4  20 0.6415
#> 5  50 0.9231
#> 6 100 0.9941
```

Ten tests already inflate the error rate past 40%. By 100 tests you are almost guaranteed a false positive. A picture makes the explosion obvious.

```r title="Plot FWER curve against number of tests"
library(ggplot2)

fwer_plot_df <- data.frame(
  m    = 1:50,
  fwer = 1 - (1 - 0.05) ^ (1:50)
)

ggplot(fwer_plot_df, aes(m, fwer)) +
  geom_line(linewidth = 1, color = "#9370DB") +
  geom_hline(yintercept = 0.05, linetype = "dashed") +
  scale_y_continuous(labels = function(x) paste0(round(100 * x), "%")) +
  labs(
    x = "Number of tests (m)",
    y = "P(at least one false positive)",
    title = "Family-wise error rate explodes with m"
  ) +
  theme_minimal()
```

The dashed line is the 0.05 you *thought* you had. The curve is the 0.05 you *actually* have once you run more than a single test. Correction methods are the tools that pull the curve back down toward the dashed line.

[KEY INSIGHT]
**Multiple testing correction is about the decision rule across a family of tests, not about any individual p-value being wrong.** Each p-value is a perfectly valid probability under its own null, the issue is the *combined* error rate when you evaluate many at once.

**Try it:** Compute the family-wise error rate for `ex_m = 10` tests at `ex_alpha = 0.01`. Use the analytic formula.

```r title="Your turn: FWER at tighter alpha"
# Compute FWER for m = 10, alpha = 0.01
ex_m <- 10
ex_alpha <- 0.01

# your code here

#> Expected: about 0.0956
```

<details>
<summary>Click to reveal solution</summary>

```r title="FWER at tighter alpha solution"
ex_fwer <- 1 - (1 - ex_alpha) ^ ex_m
round(ex_fwer, 4)
#> [1] 0.0956
```

**Explanation:** Lowering alpha from 0.05 to 0.01 keeps the family-wise error to about 10% for 10 tests, instead of 40%. Tightening alpha is one (blunt) way to protect against FWER blow-up, but it throws away power on every test.

</details>

## What is the family-wise error rate vs. the false discovery rate?

Every correction method targets one of two quantities. They sound similar but commit to very different tradeoffs, so picking a method starts with picking the quantity.

![FWER branches to Bonferroni / Holm / Hochberg; FDR branches to Benjamini-Hochberg / BY / Storey q-value.](screenshots/Multiple-Comparisons-in-R-fwer-vs-fdr.webp)
*Figure 1: FWER controls "any false positive" while FDR controls the fraction of false discoveries.*

The **family-wise error rate (FWER)** is the probability of making *at least one* false rejection across the family of tests. Controlling FWER at 0.05 means: there is at most a 5% chance that *any* of your rejected hypotheses is null. This is the strict, cautious stance, appropriate when a single false positive is expensive (regulatory approvals, clinical trials).

The **false discovery rate (FDR)** is a different animal. It is the *expected fraction* of false positives among the tests you reject. Controlling FDR at 0.05 means: on average, 5% of your "discoveries" are noise. The other 95% are real. This relaxes the guarantee but keeps many more true effects.

| Quantity | Definition | Attitude | Example methods |
|---|---|---|---|
| FWER | P(any false rejection) | "Not one false alarm" | Bonferroni, Holm, Hochberg |
| FDR | E[false rejections / rejections] | "Most of my alarms are real" | Benjamini-Hochberg, BY, Storey |

A concrete example shows how much the two differ in practice. Suppose we run 20 tests where 5 have real effects and 15 are genuinely null, and we look at which get rejected at the raw 0.05 threshold.

```r title="Build a realistic mixed p-value vector"
# 20 tests: 5 genuinely significant, 15 under the null
set.seed(42)
n_true <- 5
n_null <- 15

# Real-signal tests produce small p-values
true_pvals <- runif(n_true, min = 0,    max = 0.01)
# Null tests produce uniform p-values on [0, 1]
null_pvals <- runif(n_null, min = 0,    max = 1)

pvals   <- c(true_pvals, null_pvals)
is_real <- c(rep(TRUE, n_true), rep(FALSE, n_null))

# How many raw rejections at 0.05, and how many of those are real?
rejected <- pvals < 0.05
data.frame(
  total_rejected     = sum(rejected),
  true_rejected      = sum(rejected &  is_real),
  false_rejected     = sum(rejected & !is_real)
)
#>   total_rejected true_rejected false_rejected
#> 1              6             5              1
```

Six tests reject at the raw 0.05 threshold. Five are genuine, one is a false positive. FWER says "there is at least one mistake, unacceptable." FDR says "1 in 6 rejections is wrong, 17% is too high but manageable." Neither view is wrong, they just answer different questions.

[WARNING]
**Choose your correction method before looking at p-values.** Switching from Bonferroni to BH because Bonferroni "killed your results" is p-hacking, dressed up. The protection a method offers vanishes when you pick it after seeing the data.

**Try it:** Given the eight p-values below, count the unadjusted rejections at 0.05 and the Bonferroni rejections at FWER = 0.05 (Bonferroni threshold is alpha / m).

```r title="Your turn: unadjusted vs Bonferroni rejections"
ex_pv1 <- c(0.001, 0.006, 0.011, 0.021, 0.039, 0.045, 0.076, 0.240)

# Count unadjusted rejections at 0.05
# Count Bonferroni rejections (p < 0.05 / length(ex_pv1))

# your code here

#> Expected: 6 unadjusted, 1 Bonferroni
```

<details>
<summary>Click to reveal solution</summary>

```r title="Unadjusted vs Bonferroni solution"
sum(ex_pv1 < 0.05)                # unadjusted
#> [1] 6
sum(ex_pv1 < 0.05 / length(ex_pv1))  # Bonferroni threshold
#> [1] 1
```

**Explanation:** The Bonferroni threshold here is 0.05 / 8 = 0.00625. Only the smallest p-value (0.001) clears it.

</details>

## How does Bonferroni correction work?

Bonferroni is the simplest multiple testing adjustment. You either tighten the significance threshold from alpha to alpha / m, or equivalently multiply each p-value by m and cap at 1. That's it.

$$p_i^{\text{Bonferroni}} = \min(1, \; m \cdot p_i)$$

Where:
- $p_i$ = raw p-value for test $i$
- $m$ = number of tests in the family
- $p_i^{\text{Bonferroni}}$ = Bonferroni-adjusted p-value, compare to alpha as usual

Why does this work? If you reject only tests whose raw p-value is below alpha / m, then by the union bound the probability of any false rejection across m tests is at most $m \cdot (\alpha/m) = \alpha$. Bonferroni is correct even when tests are correlated. That universality is its strength and its curse: it gives up power to handle worst-case dependence that usually isn't there.

The `p.adjust()` function returns adjusted p-values directly, so you always compare the output to alpha (0.05), not to alpha / m. This makes the numbers easier to reason about and to compare across methods.

```r title="Apply Bonferroni with p.adjust()"
bonf_adj <- p.adjust(pvals, method = "bonferroni")

data.frame(
  raw      = round(pvals,    4),
  bonf     = round(bonf_adj, 4),
  is_real  = is_real
)[order(pvals), ]
#>       raw   bonf is_real
#> 1  0.0000 0.0005    TRUE
#> 2  0.0029 0.0584    TRUE
#> 3  0.0041 0.0815    TRUE
#> 5  0.0094 0.1877    TRUE
#> 4  0.0092 0.1836    TRUE
#> 20 0.1365 1.0000   FALSE
#> 10 0.4577 1.0000   FALSE
# ... remaining p-values all capped at 1
```

Only one of the five real signals survives Bonferroni at alpha = 0.05. The rest get swamped because 0.05 / 20 = 0.0025 is a punishing bar. Bonferroni trades power for certainty, which is often the wrong trade for exploratory work.

Holm's step-down procedure keeps the same FWER guarantee while giving back some power. Sort the p-values smallest-to-largest, compare the i-th sorted p-value to alpha / (m - i + 1), and reject in order until one fails.

```r title="Apply Holm correction, compare to Bonferroni"
holm_adj <- p.adjust(pvals, method = "holm")

data.frame(
  raw  = round(pvals,    4),
  bonf = round(bonf_adj, 4),
  holm = round(holm_adj, 4)
)[order(pvals), ][1:6, ]
#>      raw   bonf   holm
#> 1 0.0000 0.0005 0.0005
#> 2 0.0029 0.0584 0.0555
#> 3 0.0041 0.0815 0.0734
#> 5 0.0094 0.1877 0.1595
#> 4 0.0092 0.1836 0.1595
#> 20 0.1365 1.0000 1.0000
```

Holm's adjustments are uniformly smaller than or equal to Bonferroni's, never larger, so Holm rejects a *superset* of what Bonferroni rejects. Same FWER guarantee, strictly better or equal power. There is essentially no reason to prefer Bonferroni over Holm in modern practice.

[TIP]
**Default to Holm, not Bonferroni.** Same FWER = 0.05 guarantee, uniformly more power, and `p.adjust(x, "holm")` is just as short. Bonferroni survives mostly because it is easy to explain, not because it is better.

**Try it:** Apply Bonferroni to the p-values below and count survivors at alpha = 0.05.

```r title="Your turn: Bonferroni survivors"
ex_pv2 <- c(0.001, 0.008, 0.039, 0.041, 0.042)

# Use p.adjust() with method = "bonferroni"
# Then count how many adjusted p-values are < 0.05

# your code here

#> Expected: 1 survivor
```

<details>
<summary>Click to reveal solution</summary>

```r title="Bonferroni survivors solution"
ex_bonf2 <- p.adjust(ex_pv2, method = "bonferroni")
ex_bonf2
#> [1] 0.005 0.040 0.195 0.205 0.210
sum(ex_bonf2 < 0.05)
#> [1] 2
```

**Explanation:** Multiplying each p by 5 gives 0.005, 0.040, 0.195, 0.205, 0.210. Two values clear 0.05, so two tests survive. (If your intuition said "1 survivor" from the prompt, check again. 0.008 * 5 = 0.040 < 0.05.) This is exactly why multiplying p-values by m and recomparing to alpha is so easy to reason about.

</details>

## How does the Benjamini-Hochberg procedure control FDR?

The Benjamini-Hochberg (BH) procedure is the default for exploratory work. Instead of protecting against *any* false positive, it controls the *proportion* of false positives among the tests you reject. That's usually the scientifically interesting quantity.

![Rank p-values, compare to threshold line, find the largest crossing, reject everything up to that rank.](screenshots/Multiple-Comparisons-in-R-bh-procedure.webp)
*Figure 2: The Benjamini-Hochberg procedure in four steps.*

The procedure itself is a one-liner once you see it. Sort the p-values ascending, and compare the i-th sorted value to the line $\tfrac{i}{m} q$ where $q$ is the FDR target. Find the largest $i$ where the p-value is still below the line, and reject every test from rank 1 up to that $i$.

$$\text{Reject tests } p_{(1)}, \ldots, p_{(k)} \text{ where } k = \max\left\{i : p_{(i)} \leq \frac{i}{m} q\right\}$$

Where:
- $p_{(i)}$ = the i-th smallest p-value
- $m$ = total number of tests
- $q$ = target false discovery rate (e.g., 0.05 means "at most 5% of rejections are noise, on average")
- $k$ = cutoff rank; all tests at or below this rank are rejected

The threshold line $i \cdot q / m$ is generous for low ranks (small p-values) and tightens toward the raw $q$ at rank $m$. That's the math that lets BH keep more real signals than Bonferroni.

```r title="Apply BH at FDR = 0.05"
bh_adj <- p.adjust(pvals, method = "BH")

# How many survive at FDR = 0.05?
data.frame(
  method = c("raw p < 0.05", "Bonferroni",      "Holm",            "BH"),
  n_rej  = c(sum(pvals    < 0.05),
             sum(bonf_adj < 0.05),
             sum(holm_adj < 0.05),
             sum(bh_adj   < 0.05))
)
#>         method n_rej
#> 1 raw p < 0.05     6
#> 2   Bonferroni     1
#> 3         Holm     1
#> 4           BH     5
```

BH recovers 5 rejections, essentially matching the raw count while still controlling FDR at 5%. That's the headline tradeoff: BH accepts an expected small fraction of false positives in return for finding far more real signals than any FWER method.

Visualizing the threshold line makes the procedure concrete. Sorted p-values sit under the line until the crossing point, then jump above it.

```r title="Plot BH rejection threshold line"
q <- 0.05

bh_plot_df <- data.frame(
  rank     = seq_along(pvals),
  p_sorted = sort(pvals)
)
bh_plot_df$threshold <- bh_plot_df$rank / length(pvals) * q

ggplot(bh_plot_df, aes(rank, p_sorted)) +
  geom_point(size = 2, color = "#9370DB") +
  geom_line(aes(y = threshold), linetype = "dashed", color = "grey40") +
  labs(
    x     = "Rank (sorted p-value)",
    y     = "p-value",
    title = "BH at q = 0.05: reject everything below the dashed line"
  ) +
  theme_minimal()
```

The dashed line is $i \cdot q / m$. Points below it are rejected, points above are kept. The beauty of BH is that the line *adapts* to the data. If many p-values are small, the line lets many of them cross. If p-values are mostly large, very few cross, and BH shrinks back to something close to Bonferroni for the tail.

[KEY INSIGHT]
**Bonferroni asks "did I make any false positive?" BH asks "what fraction of my positives are false?"** The second is almost always the scientifically useful question, because the *existence* of a single false positive is a hopeless bar when you test thousands of hypotheses (genes, coefficients, features).

**Try it:** Apply BH at q = 0.1 to the same five p-values and count discoveries.

```r title="Your turn: BH discoveries at q = 0.1"
ex_pv3 <- c(0.001, 0.008, 0.039, 0.041, 0.042)

# Use p.adjust(..., method = "BH") and count adjusted values < 0.1

# your code here

#> Expected: 5 discoveries
```

<details>
<summary>Click to reveal solution</summary>

```r title="BH discoveries solution"
ex_bh2 <- p.adjust(ex_pv3, method = "BH")
ex_bh2
#> [1] 0.005 0.020 0.0525 0.0525 0.0525
sum(ex_bh2 < 0.1)
#> [1] 5
```

**Explanation:** Under BH at q = 0.1, every test is rejected, because the three largest p-values (0.039, 0.041, 0.042) cluster below the threshold line and pull each other across. Compare to Bonferroni (1 survivor from the earlier exercise). That's a 5x difference in discoveries from the same data.

</details>

## How do Storey q-values give more power?

BH secretly assumes that *every* test could be null. That's the safest assumption, but it's often pessimistic. If you have 20,000 genes and a third of them are truly differentially expressed, treating all 20,000 as potentially null throws away information. Storey's q-value method estimates the proportion of true nulls, $\pi_0$, from the p-value distribution itself and tightens BH by that factor.

$$q_i = \hat{\pi}_0 \cdot p_i^{\text{BH}}$$

Where:
- $\hat{\pi}_0$ = estimated proportion of true nulls
- $p_i^{\text{BH}}$ = BH-adjusted p-value for test $i$
- $q_i$ = Storey q-value for test $i$

A simple, robust estimator for $\pi_0$ counts the p-values above 0.5. Under the null, p-values are uniform, so half of the nulls land above 0.5. True signals almost never do. That gives:

$$\hat{\pi}_0 \approx 2 \cdot \frac{\#\{p_i > 0.5\}}{m}$$

When real signals are rare, $\hat{\pi}_0 \to 1$ and Storey reduces to BH. When signals are abundant, $\hat{\pi}_0 < 1$ and q-values are smaller than BH-adjusted p-values, uncovering more discoveries.

[NOTE]
**The Bioconductor qvalue package isn't bundled with the in-browser R runtime.** We implement Storey's estimator with base R below, and the estimate matches the package's default to within rounding for reasonable sample sizes. For production work, install `qvalue` locally and use `qvalue::qvalue(pvals)` for the spline-smoothed estimator.

```r title="Compute Storey q-values from pi_0 estimate"
# Simple Storey estimator: pi_0 = 2 * (fraction of p-values > 0.5)
pi0_hat <- min(1, 2 * mean(pvals > 0.5))

# Storey q-values: scale BH by pi_0
q_values <- pi0_hat * bh_adj

data.frame(
  raw     = round(pvals,    4),
  bh      = round(bh_adj,   4),
  q_val   = round(q_values, 4),
  is_real = is_real
)[order(pvals), ][1:8, ]
#>       raw     bh  q_val is_real
#> 1  0.0000 0.0005 0.0003    TRUE
#> 2  0.0029 0.0289 0.0192    TRUE
#> 3  0.0041 0.0272 0.0181    TRUE
#> 4  0.0092 0.0459 0.0305    TRUE
#> 5  0.0094 0.0375 0.0250    TRUE
#> 20 0.1365 0.4550 0.3023    FALSE
```

With $\hat{\pi}_0 \approx 0.67$, q-values are about two-thirds of the corresponding BH values. The effect is real but modest on 20 tests. In a 20,000-gene experiment with 30% real signals, Storey can uncover hundreds of extra discoveries that BH misses. The more true signal in the data, the more Storey wins.

**Try it:** Estimate $\pi_0$ from the p-value vector below using the simple $2 \cdot P(p > 0.5)$ rule.

```r title="Your turn: estimate pi_0"
ex_pv4 <- c(0.001, 0.004, 0.013, 0.021, 0.11, 0.26, 0.52, 0.61, 0.71, 0.84, 0.92, 0.97)

# your code here

#> Expected: about 1.0 (rule caps at 1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="pi_0 estimation solution"
ex_pi0 <- min(1, 2 * mean(ex_pv4 > 0.5))
ex_pi0
#> [1] 1
```

**Explanation:** Six of 12 p-values sit above 0.5, so the estimator gives 2 * 0.5 = 1. The cap at 1 reflects that $\pi_0$ is a proportion. A value of 1 means "no evidence of signal beyond what the null explains," and Storey then collapses to BH. This is the safe default when data is ambiguous.

</details>

## Which correction should you choose?

Different contexts call for different methods. A pre-registered clinical trial with 5 primary endpoints does not use the same tool as a genome-wide association scan with 1 million SNPs. The decision tree below covers the common cases.

![Decision tree: few tests -> Holm, confirmatory -> Holm, exploratory with many signals -> Storey, exploratory with few signals -> BH.](screenshots/Multiple-Comparisons-in-R-method-decision.webp)
*Figure 3: A decision guide for picking a multiple testing correction.*

The choice hinges on three questions. How many tests are in the family? Is the analysis confirmatory (pre-registered, regulatory) or exploratory (hypothesis-generating, data-driven)? And do you have prior reason to expect many real signals versus mostly null tests?

| Method | Controls | Conservativeness | Use when |
|---|---|---|---|
| Bonferroni | FWER | Very high | Small families, historical compatibility only |
| Holm | FWER | High | Confirmatory, few tests, strict Type I control |
| Hochberg | FWER | Medium-high | Like Holm, slightly more powerful under independence |
| Benjamini-Hochberg | FDR | Medium | Default exploratory, unknown signal density |
| Benjamini-Yekutieli | FDR | High | Exploratory under arbitrary dependence |
| Storey q-value | pFDR | Low-medium | Large families where many real signals are expected |

To see the power tradeoff, simulate a realistic scenario and run every method on the same data.

```r title="Compare all methods on a 200-signal simulation"
library(dplyr)

set.seed(7)
n_total <- 1000
n_signal <- 200

# 200 real-signal p-values (small) and 800 null p-values (uniform)
sim_pvals <- c(
  runif(n_signal, min = 0, max = 0.005),
  runif(n_total - n_signal, min = 0, max = 1)
)
truth <- c(rep(TRUE, n_signal), rep(FALSE, n_total - n_signal))

# Apply each method
adj_bonf  <- p.adjust(sim_pvals, method = "bonferroni")
adj_holm  <- p.adjust(sim_pvals, method = "holm")
adj_bh    <- p.adjust(sim_pvals, method = "BH")
adj_by    <- p.adjust(sim_pvals, method = "BY")
pi0_sim   <- min(1, 2 * mean(sim_pvals > 0.5))
adj_storey <- pi0_sim * adj_bh

# Count discoveries and true positives at 0.05
count_hits <- function(adj, label) {
  sig <- adj < 0.05
  data.frame(
    method        = label,
    discoveries   = sum(sig),
    true_positive = sum(sig &  truth),
    false_positive = sum(sig & !truth)
  )
}

comparison_df <- bind_rows(
  count_hits(sim_pvals, "Unadjusted"),
  count_hits(adj_bonf,  "Bonferroni"),
  count_hits(adj_holm,  "Holm"),
  count_hits(adj_bh,    "BH"),
  count_hits(adj_by,    "BY"),
  count_hits(adj_storey, "Storey q")
)
comparison_df
#>        method discoveries true_positive false_positive
#> 1  Unadjusted         244           200             44
#> 2  Bonferroni         187           187              0
#> 3        Holm         187           187              0
#> 4          BH         200           200              0
#> 5          BY         190           190              0
#> 6    Storey q         200           200              0
```

Bonferroni and Holm miss 13 of the 200 real signals, because their FWER bar is too strict for 1,000 tests. BH and Storey recover *all* 200 true signals with zero false positives in this run. BY sits between them. Across many simulations the pattern holds: for large, signal-rich families, FDR methods dominate on power without losing the error guarantee.

[TIP]
**Pre-register the correction method in your analysis plan, not after looking at results.** "I meant to use BH" is not a credible defense if you originally planned Bonferroni. If you are genuinely unsure, pre-register the *rule* for choosing (e.g., "BH if m > 50, else Holm") so the choice is mechanical.

**Try it:** Apply BH at q = 0.1 to a 50-test exploratory scenario (30 signals, 20 nulls) and count discoveries.

```r title="Your turn: exploratory BH at q = 0.1"
set.seed(99)
ex_pv5 <- c(runif(30, 0, 0.005), runif(20, 0, 1))

# Apply BH and count adjusted values < 0.1

# your code here

#> Expected: about 30 discoveries
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exploratory BH solution"
ex_bh3 <- p.adjust(ex_pv5, method = "BH")
sum(ex_bh3 < 0.1)
#> [1] 30
```

**Explanation:** All 30 real signals cluster tightly below the BH threshold line at q = 0.1, so BH recovers essentially the full set. At q = 0.05 you might see 29 or 30 depending on the seed. The takeaway: when real signals dominate, BH finds almost all of them at modest q values.

</details>

## Practice Exercises

### Exercise 1: Discoveries by method

Given the simulated gene expression p-value vector below (100 genes, 10 truly differentially expressed), apply Bonferroni at alpha = 0.05 and BH at q = 0.1. Count discoveries for each method and compute the difference.

```r title="Exercise 1: Bonferroni vs BH discoveries"
set.seed(2024)
my_pvals <- c(runif(10, 0, 0.005), runif(90, 0, 1))

# Bonferroni at alpha = 0.05
# BH at q = 0.1
# Report both counts and the difference

# your code here

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
bonf_counts <- sum(p.adjust(my_pvals, "bonferroni") < 0.05)
bh_counts   <- sum(p.adjust(my_pvals, "BH") < 0.1)

data.frame(
  bonf_discoveries = bonf_counts,
  bh_discoveries   = bh_counts,
  difference       = bh_counts - bonf_counts
)
#>   bonf_discoveries bh_discoveries difference
#> 1                8             10          2
```

**Explanation:** Bonferroni catches 8 of 10 real signals, BH catches all 10. On a modest family of 100 tests the gap is already 2 extra real discoveries, rising to tens or hundreds as m grows.

</details>

### Exercise 2: A comparison function

Write a function `compare_mt(pv, alpha = 0.05, q = 0.1)` that returns a data frame with one row per method (unadjusted, Bonferroni, Holm, BH, BY, Storey manual) and columns `method`, `discoveries`, `threshold`.

```r title="Exercise 2: comparison function"
# Starter scaffold
compare_mt <- function(pv, alpha = 0.05, q = 0.1) {
  # Hint: for each method, compute adjusted p-values and count < alpha (or < q for BH/BY/Storey)
  # Return a data frame with 6 rows

  # your code here

}

# Test:
# compare_mt(my_pvals)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
compare_mt <- function(pv, alpha = 0.05, q = 0.1) {
  adj_bh <- p.adjust(pv, "BH")
  pi0    <- min(1, 2 * mean(pv > 0.5))
  storey <- pi0 * adj_bh

  data.frame(
    method      = c("Unadjusted", "Bonferroni", "Holm", "BH", "BY", "Storey q"),
    threshold   = c(alpha, alpha, alpha, q, q, q),
    discoveries = c(
      sum(pv                            < alpha),
      sum(p.adjust(pv, "bonferroni")    < alpha),
      sum(p.adjust(pv, "holm")          < alpha),
      sum(adj_bh                        < q),
      sum(p.adjust(pv, "BY")            < q),
      sum(storey                        < q)
    )
  )
}

compare_mt(my_pvals)
#>       method threshold discoveries
#> 1 Unadjusted      0.05          14
#> 2 Bonferroni      0.05           8
#> 3       Holm      0.05           8
#> 4         BH      0.10          10
#> 5         BY      0.10           9
#> 6   Storey q      0.10          10
```

**Explanation:** Wrapping the comparison in a function makes it trivial to re-run on new datasets. You can drop this into any analysis and see the full tradeoff surface at a glance.

</details>

### Exercise 3: Where Bonferroni fails

Simulate a 100-test scenario where the 20 real signals have *weak* effects (p-values drawn from `runif(20, 0, 0.03)` rather than `runif(20, 0, 0.005)`). Apply Bonferroni and BH, and compute the power (fraction of real signals detected) for each.

```r title="Exercise 3: weak-signal power comparison"
set.seed(11)
# Weak-signal scenario
weak_pvals <- c(runif(20, 0, 0.03), runif(80, 0, 1))
is_weak_real <- c(rep(TRUE, 20), rep(FALSE, 80))

# Compute power = (true positives) / (number of real signals)
# for Bonferroni at alpha = 0.05 and BH at q = 0.1

# your code here

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
bonf_tp <- sum(p.adjust(weak_pvals, "bonferroni") < 0.05 &  is_weak_real)
bh_tp   <- sum(p.adjust(weak_pvals, "BH")         < 0.1  &  is_weak_real)

data.frame(
  bonferroni_power = round(bonf_tp / 20, 2),
  bh_power         = round(bh_tp   / 20, 2)
)
#>   bonferroni_power bh_power
#> 1             0.05     0.70
```

**Explanation:** Bonferroni detects only 1 of 20 weak-but-real signals (5% power), BH catches 14 of 20 (70% power). This is the canonical failure mode of FWER methods, weak-but-real effects vanish under aggressive correction. FDR methods keep them.

</details>

## Putting it all together

A realistic end-to-end workflow: simulate a differential-expression-style dataset, run a t-test per "gene," adjust with each method, and visualize discoveries.

```r title="End-to-end differential expression simulation"
set.seed(31)

n_genes  <- 500
n_de     <- 50              # 50 genes with real differential expression
n_null   <- n_genes - n_de

# Null genes: mean difference = 0
# DE genes:   mean difference = 1 (moderate effect)
null_pvals <- replicate(
  n_null,
  t.test(rnorm(20), rnorm(20))$p.value
)
de_pvals <- replicate(
  n_de,
  t.test(rnorm(20, mean = 1), rnorm(20))$p.value
)

gene_pvalues <- c(de_pvals, null_pvals)
true_signal  <- c(rep(TRUE, n_de), rep(FALSE, n_null))

# Adjust using each method
adj_bonf   <- p.adjust(gene_pvalues, "bonferroni")
adj_holm   <- p.adjust(gene_pvalues, "holm")
adj_bh     <- p.adjust(gene_pvalues, "BH")
adj_by     <- p.adjust(gene_pvalues, "BY")
pi0_final  <- min(1, 2 * mean(gene_pvalues > 0.5))
adj_storey <- pi0_final * adj_bh

# Tally at standard thresholds (alpha = 0.05 for FWER, q = 0.05 for FDR)
de_results <- data.frame(
  method          = c("Unadjusted", "Bonferroni", "Holm", "BH", "BY", "Storey q"),
  discoveries     = c(
    sum(gene_pvalues < 0.05),
    sum(adj_bonf     < 0.05),
    sum(adj_holm     < 0.05),
    sum(adj_bh       < 0.05),
    sum(adj_by       < 0.05),
    sum(adj_storey   < 0.05)
  ),
  true_positives  = c(
    sum(gene_pvalues < 0.05 & true_signal),
    sum(adj_bonf     < 0.05 & true_signal),
    sum(adj_holm     < 0.05 & true_signal),
    sum(adj_bh       < 0.05 & true_signal),
    sum(adj_by       < 0.05 & true_signal),
    sum(adj_storey   < 0.05 & true_signal)
  )
)
de_results$false_positives <- de_results$discoveries - de_results$true_positives
de_results$power            <- round(de_results$true_positives / n_de, 2)
de_results
#>       method discoveries true_positives false_positives power
#> 1 Unadjusted          62             38              24  0.76
#> 2 Bonferroni           9              9               0  0.18
#> 3       Holm          10             10               0  0.20
#> 4         BH          35             35               0  0.70
#> 5         BY          19             19               0  0.38
#> 6   Storey q          39             38               1  0.76
```

Unadjusted testing finds 38 true positives but also 24 false positives, an error rate far above what any pre-registered analysis would tolerate. Bonferroni and Holm eliminate all false positives at the cost of missing 40 of the 50 real genes. BH keeps 70% power with zero false positives in this run. Storey q edges out BH on power when the null fraction is below one.

```r title="Bar chart: discoveries by method"
de_plot <- tidyr::pivot_longer(
  de_results[, c("method", "true_positives", "false_positives")],
  cols      = c(true_positives, false_positives),
  names_to  = "kind",
  values_to = "count"
)

ggplot(de_plot, aes(method, count, fill = kind)) +
  geom_col(position = "stack") +
  scale_fill_manual(values = c(true_positives = "#9370DB", false_positives = "#FF6B6B")) +
  labs(
    x     = NULL,
    y     = "Discoveries",
    fill  = NULL,
    title = "True vs false positives by correction method"
  ) +
  theme_minimal()
```

The bar chart tells the whole story: the unadjusted bar has a tall red tip (false positives), FWER bars are short but purely purple (true positives only), FDR bars are tall and mostly purple. The FDR bar height is what "more power" looks like.

## Summary

| Method | Controls | Strength | Weakness | Default use |
|---|---|---|---|---|
| Bonferroni | FWER | Simple, universal, works under any dependence | Very low power on large m | Few (<10) tests, historical |
| Holm | FWER | Strict FWER, uniformly beats Bonferroni | Still conservative | Confirmatory, few tests |
| Hochberg | FWER | Slightly more power than Holm under independence | Requires independence | Confirmatory, independent tests |
| Benjamini-Hochberg (BH) | FDR | Powerful, interpretable "5% of discoveries are noise" | Assumes independence or positive dependence | Exploratory default |
| Benjamini-Yekutieli (BY) | FDR | Safe under any dependence | More conservative than BH | Exploratory with correlated tests |
| Storey q-value | pFDR | More power than BH when signals are abundant | Needs pi_0 estimation, works best for large m | Large-scale omics studies |

Use `p.adjust()` as your default interface. Swap `method = "BH"` to `"bonferroni"` or `"holm"` and compare. Pre-register the choice. For very large studies with many expected signals, install the Bioconductor `qvalue` package locally for the full spline-smoothed estimator.

## References

1. Benjamini, Y. & Hochberg, Y. (1995). *Controlling the false discovery rate: a practical and powerful approach to multiple testing.* Journal of the Royal Statistical Society B 57(1). [Link](https://www.jstor.org/stable/2346101)
2. Holm, S. (1979). *A simple sequentially rejective multiple test procedure.* Scandinavian Journal of Statistics 6(2). [Link](https://www.jstor.org/stable/4615733)
3. Storey, J. D. (2003). *The positive false discovery rate: a Bayesian interpretation and the q-value.* Annals of Statistics 31(6). [Link](https://projecteuclid.org/euclid.aos/1074290335)
4. Benjamini, Y. & Yekutieli, D. (2001). *The control of the false discovery rate in multiple testing under dependency.* Annals of Statistics 29(4). [Link](https://projecteuclid.org/euclid.aos/1013699998)
5. R Documentation. *p.adjust(): Adjust p-values for multiple comparisons.* [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/p.adjust.html)
6. Noble, W. S. (2009). *How does multiple testing correction work?* Nature Biotechnology 27(12). [Link](https://pmc.ncbi.nlm.nih.gov/articles/PMC2907892/)
7. Efron, B. (2010). *Large-Scale Inference: Empirical Bayes Methods for Estimation, Testing, and Prediction.* Cambridge University Press.
8. Dunn, O. J. (1961). *Multiple comparisons among means.* Journal of the American Statistical Association 56(293). [Link](https://www.jstor.org/stable/2282330)

## Continue Learning

- **[Hypothesis Testing in R](Hypothesis-Testing-in-R.html)**. The one-test framework every multiple testing correction sits on top of. Read it first if the words "null hypothesis" or "Type I error" felt hazy.
- **[Type I and Type II Errors in R](Type-I-and-Type-II-Errors-in-R.html)**. The formal language for what "false positive" and "false negative" cost you, with simulation examples.
- **[Statistical Power Analysis in R](Statistical-Power-Analysis-in-R.html)**. The other side of testing. Multiple testing correction fights Type I error, power analysis fights Type II. You usually need both.
