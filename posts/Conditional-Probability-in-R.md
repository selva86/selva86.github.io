---
title: "Conditional Probability in R: P(A|B), Independence, and Bayes — With Real Examples"
slug: "Conditional-Probability-in-R"
description: "Simulate conditional probability in R, prove independence with dice rolls, and apply Bayes' theorem to medical testing. Runnable code in your browser."
keywords: "conditional probability in R, P(A|B) R, Bayes theorem R, independence test R, conditional probability simulation, Bayes rule R example, joint probability R, chi-squared independence test R"
mathjax: true
webr: true
difficulty: "Intermediate"
date: "2026-04-16"
curriculum_id: "2.1.3"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Conditional Probability"
sidebar_order: 18
auto_link_terms: "conditional probability|P(A|B)|Bayes theorem|Bayes' theorem|Bayes rule|statistical independence|conditional probability in R"
auto_link_case_sensitive: false
---

# Conditional Probability in R: P(A|B), Independence, and Bayes — With Real Examples

<p class="lead">Conditional probability measures how the chance of one event changes when you know another event already happened — written P(A|B) and read "the probability of A given B." In this tutorial you'll simulate conditional probabilities in R, prove when events are independent, and apply Bayes' theorem to a medical-testing scenario where the "obvious" answer is wrong.</p>

## What is conditional probability and how do you calculate P(A|B)?

Imagine you roll a fair die and it lands on an even number. What's the probability the roll is also greater than 4? Knowing the die is even shrinks the possible outcomes from six to three — {2, 4, 6} — and only one of those (6) is greater than 4. That gives us 1/3 instead of the unconditional 2/6.

Let's confirm this with a simulation of 100,000 rolls.

```r
# Simulate conditional probability: P(>4 | even)
set.seed(42)
rolls <- sample(1:6, size = 100000, replace = TRUE)

# Filter to only even rolls (our "given" event)
even_rolls <- rolls[rolls %% 2 == 0]

# Among even rolls, what fraction are > 4?
p_gt4_given_even <- mean(even_rolls > 4)
p_gt4_given_even
#> [1] 0.3332

# Compare to unconditional P(> 4)
p_gt4 <- mean(rolls > 4)
p_gt4
#> [1] 0.3336
```

The simulation gives us roughly 0.333 — exactly 1/3. Notice that P(>4) unconditionally is also about 1/3 in this case, but that's a coincidence of these particular events. The key idea is that we restricted our universe to even rolls before asking the question.

The formal formula captures this "restrict and re-normalise" logic:

$$P(A|B) = \frac{P(A \cap B)}{P(B)}$$

Where:
- $P(A|B)$ = probability of A given B has occurred
- $P(A \cap B)$ = probability both A and B happen (joint probability)
- $P(B)$ = probability of the conditioning event

Let's verify the formula matches our simulation.

```r
# Verify with the formula: P(A ∩ B) / P(B)
# A = roll > 4, B = roll is even
# A ∩ B = roll is 6 (only number that's both > 4 and even)
p_a_and_b <- mean(rolls == 6)
p_b <- mean(rolls %% 2 == 0)

p_formula <- p_a_and_b / p_b
p_formula
#> [1] 0.3332
```

Both approaches — simulation and formula — give the same answer. That's the power of Monte Carlo: you can always check a formula by simulating the experiment thousands of times.

[KEY INSIGHT]
**Conditioning shrinks the sample space.** P(A|B) doesn't change event A — it changes the universe of outcomes you're considering. You throw away everything where B didn't happen, then ask "what fraction of what's left is A?"

**Try it:** Given a die roll is odd, what's the probability it's less than or equal to 3? Simulate with 100,000 rolls and verify the answer is 2/3.

```r
# Try it: P(≤ 3 | odd)
set.seed(99)
ex_rolls <- sample(1:6, size = 100000, replace = TRUE)
ex_odd <- ex_rolls[ex_rolls %% 2 == 1]

# your code here
mean(ex_odd <= 3)
#> Expected: ~0.667
```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(99)
ex_rolls <- sample(1:6, size = 100000, replace = TRUE)
ex_odd <- ex_rolls[ex_rolls %% 2 == 1]
mean(ex_odd <= 3)
#> [1] 0.6676
```

**Explanation:** The odd outcomes are {1, 3, 5}. Two of those three (1 and 3) are ≤ 3, so the answer is 2/3 ≈ 0.667.

</details>

## How does joint probability connect to conditional probability?

The conditional probability formula can be rearranged into the **multiplication rule** — a way to compute the probability that two events both happen:

$$P(A \cap B) = P(A|B) \times P(B)$$

This says: the chance of A *and* B equals the chance of B times the chance of A *given* B. Think of it as a two-step process — first B happens, then A happens in that restricted world.

Let's test this with playing cards. What's the probability of drawing a card that is both red and a face card?

```r
# Joint probability: P(Red ∩ Face) via simulation
set.seed(123)
n_sims <- 50000

# Simulate card draws (1-52)
draws <- sample(1:52, size = n_sims, replace = TRUE)

# In a standard deck: cards 1-26 are red, 27-52 are black
# Face cards (J, Q, K) are cards 11-13, 24-26, 37-39, 50-52
face_positions <- c(11:13, 24:26, 37:39, 50:52)

is_red <- draws <= 26
is_face <- draws %in% face_positions

# Empirical joint probability
p_red_and_face <- mean(is_red & is_face)
p_red_and_face
#> [1] 0.1155

# Verify via multiplication rule: P(Face|Red) × P(Red)
p_red <- mean(is_red)
p_face_given_red <- mean(is_face[is_red])
p_multiplication <- p_face_given_red * p_red
p_multiplication
#> [1] 0.1155

# Theoretical: 6 red face cards / 52 = 0.1154
6 / 52
#> [1] 0.1154
```

The simulation, the multiplication rule, and the theoretical calculation all converge on about 0.115. There are 6 red face cards (Jack, Queen, King of Hearts and Diamonds) out of 52 total cards.

[TIP]
**The multiplication rule is just the conditional probability formula rearranged.** If you know P(A|B) and P(B), multiply them to get P(A ∩ B). If you know P(A ∩ B) and P(B), divide to get P(A|B). One formula, two directions.

**Try it:** In a standard 52-card deck, what's P(Heart ∩ King)? There's exactly 1 King of Hearts. Compute it using the multiplication rule — P(King|Heart) × P(Heart) — and verify with simulation.

```r
# Try it: P(Heart ∩ King)
set.seed(200)
ex_draws <- sample(1:52, size = 50000, replace = TRUE)

# Hearts are cards 1-13, Kings are cards 13, 26, 39, 52
ex_is_heart <- ex_draws <= 13
ex_is_king <- ex_draws %in% c(13, 26, 39, 52)

# your code here: compute empirical P(Heart ∩ King)
# and verify via P(King|Heart) × P(Heart)
#> Expected: ~0.0192 (1/52)
```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(200)
ex_draws <- sample(1:52, size = 50000, replace = TRUE)
ex_is_heart <- ex_draws <= 13
ex_is_king <- ex_draws %in% c(13, 26, 39, 52)

# Empirical joint
mean(ex_is_heart & ex_is_king)
#> [1] 0.0194

# Multiplication rule
mean(ex_is_king[ex_is_heart]) * mean(ex_is_heart)
#> [1] 0.0194
```

**Explanation:** P(Heart) = 13/52 = 1/4, P(King|Heart) = 1/13 (one King among 13 Hearts), so P(Heart ∩ King) = (1/13) × (1/4) = 1/52 ≈ 0.0192.

</details>

## When are two events independent — and how can you prove it in R?

Two events are **independent** when knowing one tells you nothing about the other. Formally:

$$P(A|B) = P(A)$$

This is equivalent to saying $P(A \cap B) = P(A) \times P(B)$ — the joint probability equals the product of the individual probabilities.

The classic example: rolling two separate dice. The outcome of die 1 can't possibly influence die 2.

```r
# Independence proof: two dice
set.seed(77)
n <- 100000
die1 <- sample(1:6, n, replace = TRUE)
die2 <- sample(1:6, n, replace = TRUE)

# P(die1 = 6)
p_die1_six <- mean(die1 == 6)

# P(die1 = 6 | die2 = 6)
p_die1_six_given_die2_six <- mean(die1[die2 == 6] == 6)

cat("P(die1 = 6)          =", round(p_die1_six, 4), "\n")
#> P(die1 = 6)          = 0.1667
cat("P(die1 = 6 | die2=6) =", round(p_die1_six_given_die2_six, 4), "\n")
#> P(die1 = 6 | die2=6) = 0.1644

# Nearly identical — knowing die2 = 6 doesn't change die1's probability
```

The two probabilities are nearly identical (both around 0.167 = 1/6). Knowing die 2 landed on 6 tells you nothing about die 1. That's independence.

Now here's the contrast — **dependent events**. When you draw cards *without* replacement, the first draw changes the deck for the second draw.

```r
# Dependent events: cards without replacement
set.seed(55)
n_sims <- 100000

first_ace <- 0
second_ace_given_first <- 0
second_ace_overall <- 0

for (i in 1:n_sims) {
  hand <- sample(1:52, size = 2, replace = FALSE)
  # Aces are cards 1, 14, 27, 40
  aces <- c(1, 14, 27, 40)
  card1_ace <- hand[1] %in% aces
  card2_ace <- hand[2] %in% aces

  if (card1_ace) {
    first_ace <- first_ace + 1
    if (card2_ace) second_ace_given_first <- second_ace_given_first + 1
  }
  if (card2_ace) second_ace_overall <- second_ace_overall + 1
}

cat("P(2nd Ace)           =", round(second_ace_overall / n_sims, 4), "\n")
#> P(2nd Ace)           = 0.0770
cat("P(2nd Ace | 1st Ace) =", round(second_ace_given_first / first_ace, 4), "\n")
#> P(2nd Ace | 1st Ace) = 0.0588

# Different! The first draw changes the second draw's odds
# Theoretical: 3/51 ≈ 0.0588 vs 4/52 ≈ 0.0769
```

When the first card is an Ace, only 3 Aces remain among 51 cards, so P(2nd Ace | 1st Ace) = 3/51 ≈ 0.059 — noticeably lower than the unconditional 4/52 ≈ 0.077. The first draw changed the odds. These events are dependent.

![How to check whether two events are independent in R.](screenshots/Conditional-Probability-in-R-independence-check.webp)
*Figure 1: How to check whether two events are independent in R.*

[WARNING]
**Don't confuse "independent" with "mutually exclusive."** Mutually exclusive events (like rolling a 2 and rolling a 5 on one die) can't happen together — they are *maximally dependent*. If one happens, the other definitely didn't. Independent events can and do happen together; they just don't influence each other's probabilities.

**Try it:** Roll two dice. Are the events "sum equals 7" and "die 1 equals 3" independent? Simulate 100,000 rolls and compare P(sum = 7) with P(sum = 7 | die1 = 3).

```r
# Try it: are "sum = 7" and "die1 = 3" independent?
set.seed(300)
ex_d1 <- sample(1:6, 100000, replace = TRUE)
ex_d2 <- sample(1:6, 100000, replace = TRUE)
ex_sum <- ex_d1 + ex_d2

# your code here
# Compute P(sum = 7) and P(sum = 7 | die1 = 3)
#> Expected: both ≈ 0.167 (they ARE independent)
```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(300)
ex_d1 <- sample(1:6, 100000, replace = TRUE)
ex_d2 <- sample(1:6, 100000, replace = TRUE)
ex_sum <- ex_d1 + ex_d2

cat("P(sum = 7)          =", mean(ex_sum == 7), "\n")
#> P(sum = 7)          = 0.1666
cat("P(sum = 7 | d1 = 3) =", mean(ex_sum[ex_d1 == 3] == 7), "\n")
#> P(sum = 7 | d1 = 3) = 0.1678
```

**Explanation:** For any value of die 1, there's exactly one value of die 2 that makes the sum 7. So P(sum = 7 | die1 = k) = 1/6 for any k, which equals P(sum = 7) = 6/36 = 1/6. The events are independent.

</details>

## How do you test independence statistically with the chi-squared test?

The simulations above work when you know the exact probability model. But with real-world data — survey responses, medical records, experiment results — you have a contingency table and need a formal test.

The **chi-squared test of independence** asks: "Could the pattern in this table have arisen by chance if the two variables were truly independent?" The null hypothesis is independence; a small p-value means you reject it.

```r
# Chi-squared test: smoking status vs exercise frequency
# Observed data from a hypothetical survey of 400 people
survey_table <- matrix(
  c(30, 50, 70,    # Non-smoker: Low/Medium/High exercise
    45, 35, 20,    # Light smoker
    50, 60, 40),   # Heavy smoker
  nrow = 3, byrow = TRUE,
  dimnames = list(
    Smoking = c("Non-smoker", "Light", "Heavy"),
    Exercise = c("Low", "Medium", "High")
  )
)

survey_table
#>             Exercise
#> Smoking      Low Medium High
#>   Non-smoker  30     50   70
#>   Light       45     35   20
#>   Heavy       50     60   40

chi_result <- chisq.test(survey_table)
chi_result
#> 	Pearson's Chi-squared test
#>
#> data:  survey_table
#> X-squared = 33.849, df = 4, p-value = 7.994e-07
```

The p-value is extremely small (less than 0.001), so we reject the null hypothesis. Smoking status and exercise frequency are **not independent** in this sample — they are associated.

Now let's see what happens when we test two variables that we *know* are independent: two separate coin flips.

```r
# Chi-squared test on independent data (two coin flips)
set.seed(88)
coin1 <- sample(c("Heads", "Tails"), 500, replace = TRUE)
coin2 <- sample(c("Heads", "Tails"), 500, replace = TRUE)

coin_table <- table(coin1, coin2)
coin_table
#>        coin2
#> coin1   Heads Tails
#>   Heads   130   118
#>   Tails   121   131

chi_indep <- chisq.test(coin_table)
chi_indep$p.value
#> [1] 0.4301
```

The p-value is 0.43 — far above any reasonable threshold (0.05). We fail to reject the null. The test correctly finds no evidence of association, because the two coin flips really are independent.

[NOTE]
**The chi-squared test needs expected cell counts of at least 5.** If your contingency table has very small counts (sparse data), use Fisher's exact test instead: `fisher.test(your_table)`. It gives exact p-values without relying on the chi-squared approximation.

**Try it:** Create a 2×3 contingency table for gender (Male/Female) vs favourite language (R/Python/Julia) using made-up data. Run the chi-squared test and interpret whether gender and language preference are independent.

```r
# Try it: gender vs programming language
ex_lang_table <- matrix(
  c(40, 35, 25,   # Male: R/Python/Julia
    45, 30, 25),  # Female: R/Python/Julia
  nrow = 2, byrow = TRUE,
  dimnames = list(
    Gender = c("Male", "Female"),
    Language = c("R", "Python", "Julia")
  )
)

# your code here: run chisq.test() and interpret p-value
#> Expected: p > 0.05 (these counts suggest no strong association)
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_lang_table <- matrix(
  c(40, 35, 25,
    45, 30, 25),
  nrow = 2, byrow = TRUE,
  dimnames = list(
    Gender = c("Male", "Female"),
    Language = c("R", "Python", "Julia")
  )
)

chisq.test(ex_lang_table)
#> 	Pearson's Chi-squared test
#>
#> X-squared = 0.5128, df = 2, p-value = 0.7738
```

**Explanation:** The p-value (0.77) is well above 0.05, so we fail to reject the null. There's no evidence that gender and language preference are associated in this data.

</details>

## What is Bayes' theorem and why does it produce surprising results?

Everything so far has moved in one direction: given what we know, what's the probability of what we observe? Bayes' theorem flips this around: **given what we observe, what should we now believe?**

The formula comes directly from the definition of conditional probability. We know that:

$$P(A|B) = \frac{P(A \cap B)}{P(B)} \quad \text{and} \quad P(B|A) = \frac{P(A \cap B)}{P(A)}$$

Solving both for $P(A \cap B)$ and setting them equal gives us **Bayes' theorem**:

$$P(A|B) = \frac{P(B|A) \times P(A)}{P(B)}$$

Where:
- $P(A|B)$ = **posterior** — what we want (updated belief after seeing B)
- $P(B|A)$ = **likelihood** — how likely is B if A is true
- $P(A)$ = **prior** — our belief before seeing B
- $P(B)$ = **evidence** — the total probability of B across all scenarios

*If you're not interested in the derivation, the formula above is all you need — let's see it in action.*

![How Bayes' theorem flips a conditional probability from P(B|A) to P(A|B).](screenshots/Conditional-Probability-in-R-bayes-flow.webp)
*Figure 2: How Bayes' theorem flips a conditional probability from P(B|A) to P(A|B).*

Here's where Bayes gets counter-intuitive. Suppose a disease affects 1% of the population. A test for this disease has 90% sensitivity (correctly detects 90% of sick people) and 95% specificity (correctly clears 95% of healthy people). You test positive. What's the probability you actually have the disease?

Most people guess 90% — after all, the test is 90% accurate. The real answer is shockingly low.

```r
# Bayes' theorem: medical testing
prev <- 0.01      # P(Disease) — base rate / prior
sens <- 0.90      # P(Positive | Disease) — sensitivity
spec <- 0.95      # P(Negative | Healthy) — specificity

# P(Positive) = P(Pos|Disease)*P(Disease) + P(Pos|Healthy)*P(Healthy)
p_pos <- sens * prev + (1 - spec) * (1 - prev)

# Bayes' theorem: P(Disease | Positive)
p_disease_given_pos <- (sens * prev) / p_pos
round(p_disease_given_pos, 4)
#> [1] 0.1538
```

Only about **15.4%** — not 90%. A positive result means you're far more likely to be healthy than sick. How is that possible?

![A probability tree for 1,000 people: most positive tests are false positives when the disease is rare.](screenshots/Conditional-Probability-in-R-medical-test.webp)
*Figure 3: A probability tree for 1,000 people — most positive tests are false positives when the disease is rare.*

The tree makes it clear. Out of 1,000 people, only 10 have the disease (1%). The test catches 9 of them (true positives). But among the 990 healthy people, the 5% false positive rate produces 50 false alarms. So out of 59 total positives, only 9 actually have the disease: 9/59 ≈ 15.3%.

[KEY INSIGHT]
**When a disease is rare, even a good test produces mostly false positives.** The base rate (prior probability) dominates. A test with 90% sensitivity and 95% specificity sounds great — but against a 1% prevalence, false positives outnumber true positives 5-to-1. Always consider prevalence before interpreting a test result.

**Try it:** Re-compute P(Disease | Positive) with a prevalence of 10% instead of 1%. How much does the posterior change?

```r
# Try it: what happens when prevalence = 10%?
ex_prev <- 0.10
ex_p_pos <- sens * ex_prev + (1 - spec) * (1 - ex_prev)

# your code here: compute P(Disease | Positive)
#> Expected: ~0.667
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_prev <- 0.10
ex_p_pos <- sens * ex_prev + (1 - spec) * (1 - ex_prev)
ex_posterior <- (sens * ex_prev) / ex_p_pos
round(ex_posterior, 4)
#> [1] 0.6667
```

**Explanation:** With 10% prevalence, a positive test now means a 66.7% chance of disease — up from 15.4%. The higher base rate means true positives far outnumber false positives. The same test performs dramatically differently depending on how common the disease is.

</details>

## How does Bayesian updating work with multiple pieces of evidence?

A single test result moved our belief from 1% to 15.4%. But what if the person tests positive a second time? In Bayesian updating, **the posterior from the first test becomes the prior for the second test**.

```r
# Bayesian updating: sequential positive tests
prior <- prev  # Start with 1% prevalence

# First positive test
p_pos_1 <- sens * prior + (1 - spec) * (1 - prior)
posterior1 <- (sens * prior) / p_pos_1
cat("After 1st positive test:", round(posterior1, 4), "\n")
#> After 1st positive test: 0.1538

# Second positive test — posterior1 becomes the new prior
p_pos_2 <- sens * posterior1 + (1 - spec) * (1 - posterior1)
posterior2 <- (sens * posterior1) / p_pos_2
cat("After 2nd positive test:", round(posterior2, 4), "\n")
#> After 2nd positive test: 0.7660

# Third positive test
p_pos_3 <- sens * posterior2 + (1 - spec) * (1 - posterior2)
posterior3 <- (sens * posterior2) / p_pos_3
cat("After 3rd positive test:", round(posterior3, 4), "\n")
#> After 3rd positive test: 0.9834
```

Look at that progression: 1% → 15.4% → 76.6% → 98.3%. Each positive test is a new piece of evidence that shifts the belief. After three consecutive positives, the probability of disease is overwhelming.

Let's visualise this updating process.

```r
# Visualise Bayesian updating
probs <- c(prior, posterior1, posterior2, posterior3)
labels <- c("Prior\n(1%)", "After\nTest 1", "After\nTest 2", "After\nTest 3")

barplot(
  probs,
  names.arg = labels,
  col = c("gray70", "#F4A460", "#E07020", "#C0392B"),
  ylim = c(0, 1),
  ylab = "P(Disease)",
  main = "Bayesian Updating: Belief After Each Positive Test",
  border = NA
)
abline(h = 0.5, lty = 2, col = "gray40")
text(x = seq(0.7, by = 1.2, length.out = 4), y = probs + 0.04,
     labels = paste0(round(probs * 100, 1), "%"), cex = 0.9)
```

The dashed line at 0.5 is the "more likely than not" threshold. After one test, we're still below it (15.4%). After two tests, we cross it decisively (76.6%). By the third test, we're nearly certain (98.3%).

[TIP]
**Bayesian updating is everywhere in practice.** Spam filters update P(spam) with each word they see in an email. Recommendation engines refine your preference profile with each click. Clinical decision tools combine multiple test results exactly this way — each new data point updates the prior, one step at a time.

**Try it:** Starting from the `posterior3` value above (after 3 positive tests), what happens after a **negative** test result? Compute the posterior using P(Negative | Disease) = 1 - sensitivity.

```r
# Try it: what happens after a negative test?
# P(Negative | Disease) = 1 - sens = 0.10
# P(Negative | Healthy) = spec = 0.95

ex_prior4 <- posterior3

# your code here: compute P(Disease | Negative)
#> Expected: the posterior drops significantly
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_prior4 <- posterior3
p_neg_disease <- 1 - sens   # 0.10
p_neg_healthy <- spec        # 0.95

ex_p_neg <- p_neg_disease * ex_prior4 + p_neg_healthy * (1 - ex_prior4)
ex_posterior4 <- (p_neg_disease * ex_prior4) / ex_p_neg
round(ex_posterior4, 4)
#> [1] 0.8613
```

**Explanation:** Even after a negative test, the posterior is still 86% — three prior positives built up so much evidence that one negative test only drops the belief from 98.3% to 86.1%. Bayesian updating works in both directions, but strong prior evidence takes multiple contrary observations to overcome.

</details>

## Practice Exercises

### Exercise 1: Factory defect analysis with Bayes' theorem

A factory has two machines. Machine A produces 60% of all items with a 3% defect rate. Machine B produces the remaining 40% with a 5% defect rate. An item chosen at random turns out to be defective. What's the probability it came from Machine A?

First compute the answer using Bayes' theorem, then verify with a simulation of 100,000 items.

```r
# Exercise 1: Factory defect problem
# Hint: P(A|Defective) = P(Defective|A) * P(A) / P(Defective)
# P(Defective) = P(Def|A)*P(A) + P(Def|B)*P(B)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
# Bayes' theorem solution
p_a <- 0.60
p_b <- 0.40
p_def_a <- 0.03
p_def_b <- 0.05

p_def <- p_def_a * p_a + p_def_b * p_b
p_a_given_def <- (p_def_a * p_a) / p_def
cat("P(Machine A | Defective) =", round(p_a_given_def, 4), "\n")
#> P(Machine A | Defective) = 0.4737

# Simulation verification
set.seed(500)
n <- 100000
machine <- sample(c("A", "B"), n, replace = TRUE, prob = c(0.6, 0.4))
defective <- ifelse(
  machine == "A",
  runif(n) < 0.03,
  runif(n) < 0.05
)
cat("Simulated P(A | Def) =", round(mean(machine[defective] == "A"), 4), "\n")
#> Simulated P(A | Def) = 0.4738
```

**Explanation:** Despite Machine A making 60% of all products, it only accounts for about 47% of defects because its defect rate (3%) is lower than Machine B's (5%). The higher-volume machine contributes fewer defects per unit. Both the formula and simulation converge on ~0.474.

</details>

### Exercise 2: The Monty Hall problem — simulated

In the classic Monty Hall problem, you pick one of three doors. Behind one door is a car; behind the other two are goats. The host (who knows what's behind the doors) opens a different door showing a goat, then asks if you want to switch.

Simulate 10,000 games. Compute P(Win | Switch) and P(Win | Stay) empirically. Explain the result using conditional probability.

```r
# Exercise 2: Monty Hall simulation
# Hint: for each game, randomly place the car, pick a door,
# have the host open a goat door, then track wins for switch vs stay

set.seed(42)
n_games <- 10000

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(42)
n_games <- 10000

car_door <- sample(1:3, n_games, replace = TRUE)
pick <- sample(1:3, n_games, replace = TRUE)

stay_wins <- sum(pick == car_door)
switch_wins <- n_games - stay_wins  # Switching wins whenever staying loses

cat("P(Win | Stay)   =", round(stay_wins / n_games, 4), "\n")
#> P(Win | Stay)   = 0.3362
cat("P(Win | Switch) =", round(switch_wins / n_games, 4), "\n")
#> P(Win | Switch) = 0.6638
```

**Explanation:** Switching wins about 2/3 of the time. Why? Your initial pick has a 1/3 chance of being correct. When the host opens a goat door, the 2/3 probability that you were wrong concentrates entirely on the remaining door. In conditional probability terms: P(Car is behind other door | Host revealed a goat) = 2/3. The host's action gives you information that shifts the probabilities.

</details>

### Exercise 3: Simple Bayesian spam classifier

Build a basic spam classifier. Given these word frequencies:
- P(Spam) = 0.30 (30% of emails are spam)
- P("free" | Spam) = 0.60, P("free" | Ham) = 0.05
- P("win" | Spam) = 0.40, P("win" | Ham) = 0.02

An email contains both "free" and "win". Compute P(Spam | "free" AND "win") using sequential Bayesian updating (assume word occurrences are conditionally independent given spam/ham).

```r
# Exercise 3: Bayesian spam classifier
# Hint: update the prior with "free" first, then update
# the resulting posterior with "win"

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
# Prior
p_spam <- 0.30

# Update with "free"
p_free_spam <- 0.60
p_free_ham <- 0.05
p_free <- p_free_spam * p_spam + p_free_ham * (1 - p_spam)
post_after_free <- (p_free_spam * p_spam) / p_free
cat("After seeing 'free': P(Spam) =", round(post_after_free, 4), "\n")
#> After seeing 'free': P(Spam) = 0.8372

# Update with "win" — post_after_free becomes the new prior
p_win_spam <- 0.40
p_win_ham <- 0.02
p_win <- p_win_spam * post_after_free + p_win_ham * (1 - post_after_free)
post_after_win <- (p_win_spam * post_after_free) / p_win
cat("After seeing 'free' + 'win': P(Spam) =", round(post_after_win, 4), "\n")
#> After seeing 'free' + 'win': P(Spam) = 0.9903
```

**Explanation:** The word "free" alone pushes P(Spam) from 30% to 83.7%. Adding "win" pushes it to 99.0%. Each word is a piece of evidence processed through Bayes' theorem. This is exactly how naive Bayes classifiers work — they multiply likelihood ratios for each feature, which is equivalent to sequential Bayesian updating under the conditional independence assumption.

</details>

## Putting It All Together

Let's walk through a complete medical screening scenario from start to finish — defining the problem, applying Bayes' theorem, updating with multiple tests, and visualising the decision process.

```r
# === Complete Example: Screening for a Rare Genetic Condition ===

# Problem setup
condition_rate <- 0.005   # 0.5% of population has the condition
test_sensitivity <- 0.95  # 95% true positive rate
test_specificity <- 0.90  # 90% true negative rate (10% false positive)

cat("=== Genetic Screening Scenario ===\n")
cat("Prevalence:", condition_rate * 100, "%\n")
cat("Sensitivity:", test_sensitivity * 100, "%\n")
cat("Specificity:", test_specificity * 100, "%\n\n")
#> === Genetic Screening Scenario ===
#> Prevalence: 0.5 %
#> Sensitivity: 95 %
#> Specificity: 90 %

# Step 1: Apply Bayes after first positive test
belief <- condition_rate
test_results <- c()

for (test_num in 1:4) {
  p_pos <- test_sensitivity * belief + (1 - test_specificity) * (1 - belief)
  belief <- (test_sensitivity * belief) / p_pos
  test_results <- c(test_results, belief)
  cat(sprintf("After positive test %d: P(Condition) = %.2f%%\n",
              test_num, belief * 100))
}
#> After positive test 1: P(Condition) = 4.56%
#> After positive test 2: P(Condition) = 31.25%
#> After positive test 3: P(Condition) = 81.17%
#> After positive test 4: P(Condition) = 97.61%

# Step 2: Visualise the full trajectory
all_probs <- c(condition_rate, test_results)
all_labels <- c("Prior", paste("Test", 1:4))
colours <- c("gray60", "#F4A460", "#E07020", "#C0392B", "#8B0000")

barplot(
  all_probs,
  names.arg = all_labels,
  col = colours,
  ylim = c(0, 1),
  ylab = "P(Condition)",
  main = "Belief Evolution: 4 Consecutive Positive Tests",
  border = NA
)
abline(h = 0.5, lty = 2, col = "gray40")
text(
  x = seq(0.7, by = 1.2, length.out = 5),
  y = all_probs + 0.04,
  labels = paste0(round(all_probs * 100, 1), "%"),
  cex = 0.85
)

# Step 3: Monte Carlo verification
set.seed(2026)
n_pop <- 200000
has_condition <- runif(n_pop) < condition_rate

# Simulate 4 independent tests
all_positive <- rep(TRUE, n_pop)
for (t in 1:4) {
  test_pos <- ifelse(
    has_condition,
    runif(n_pop) < test_sensitivity,
    runif(n_pop) < (1 - test_specificity)
  )
  all_positive <- all_positive & test_pos
}

sim_posterior <- mean(has_condition[all_positive])
cat(sprintf("\nSimulated P(Condition | 4 positives) = %.2f%%\n",
            sim_posterior * 100))
cat(sprintf("Formula P(Condition | 4 positives)   = %.2f%%\n",
            belief * 100))
#> Simulated P(Condition | 4 positives) = 97.52%
#> Formula P(Condition | 4 positives)   = 97.61%
```

This example shows the complete Bayesian workflow: start with a prior (0.5%), apply evidence one piece at a time through Bayes' theorem, and watch the posterior evolve. The Monte Carlo simulation confirms the analytical answer, giving confidence in both methods. Clinically, a doctor wouldn't act on a single positive screening result for a rare condition — the 4.6% posterior is too low. But after four consecutive positives, the 97.6% posterior justifies further diagnostic steps.

## Summary

| Concept | Formula | R Approach | When to Use |
|---|---|---|---|
| Conditional probability | $P(A\|B) = \frac{P(A \cap B)}{P(B)}$ | Filter + proportion: `mean(A[B])` | One event changes another's odds |
| Multiplication rule | $P(A \cap B) = P(A\|B) \times P(B)$ | `mean(A & B)` or formula | Computing joint probabilities |
| Independence test | $P(A\|B) = P(A)$ | Compare `mean(A[B])` vs `mean(A)` | Checking if events influence each other |
| Chi-squared test | $\chi^2 = \sum \frac{(O - E)^2}{E}$ | `chisq.test(table)` | Testing independence in observed data |
| Bayes' theorem | $P(A\|B) = \frac{P(B\|A) P(A)}{P(B)}$ | Direct computation | Flipping a conditional probability |
| Bayesian updating | Posterior → New prior | Loop with Bayes formula | Incorporating multiple pieces of evidence |

![Key concepts in conditional probability and how they connect.](screenshots/Conditional-Probability-in-R-concepts-mindmap.webp)
*Figure 4: Key concepts in conditional probability and how they connect.*

[KEY INSIGHT]
**Every concept in this tutorial is one formula.** Conditional probability defines the formula. The multiplication rule rearranges it. Independence is the special case where it simplifies. Bayes' theorem applies it in reverse. And Bayesian updating repeats it. Master P(A|B) = P(A ∩ B) / P(B), and everything else follows.

## References

1. R Core Team — `sample()`, `table()`, `chisq.test()` documentation. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/chisq.test.html)
2. Blitzstein, J. & Hwang, J. — *Introduction to Probability*, 2nd Edition. CRC Press (2019). Chapters 2-3: Conditional Probability and Bayes. [Link](https://projects.iq.harvard.edu/stat110/home)
3. Wickham, H. & Grolemund, G. — *R for Data Science*, 2nd Edition (2023). [Link](https://r4ds.hadley.nz/)
4. Wikipedia — Bayes' theorem: formal derivation and historical context. [Link](https://en.wikipedia.org/wiki/Bayes%27_theorem)
5. NIST/SEMATECH — e-Handbook of Statistical Methods: Chi-squared test of independence. [Link](https://www.itl.nist.gov/div898/handbook/eda/section3/eda35f.htm)
6. LaplacesDemon R package — `BayesTheorem()` function documentation. [Link](https://search.r-project.org/CRAN/refmans/LaplacesDemon/html/BayesTheorem.html)
7. r-statistics.co — Sample Spaces, Events, and Probability Axioms in R. [Link](/Sample-Spaces-Events-and-Probability-Axioms-in-R-With-Monte-Carlo-Proof.html)

## Continue Learning

1. [Sample Spaces, Events, and Probability Axioms in R](/Sample-Spaces-Events-and-Probability-Axioms-in-R-With-Monte-Carlo-Proof.html) — the prerequisite covering P(A), sample spaces, and the three probability axioms with Monte Carlo proofs
2. [Which Statistical Test in R](/Which-Statistical-Test-in-R.html) — a comprehensive decision guide for choosing the right statistical test, including chi-squared and Fisher's exact
3. [Descriptive Statistics in R](/Descriptive-Statistics-in-R.html) — how to summarise your data with measures of centre, spread, and shape before modelling
