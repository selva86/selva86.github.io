---
title: "Counting Principles in R: Permutations, Combinations & Birthday Problem"
slug: Counting-Principles-in-R
description: "Master counting principles in R: the multiplication rule, permutations, combinations, and the birthday problem, with runnable examples and clear intuition."
keywords: "counting principles in R, permutations in R, combinations in R, choose function R, factorial R, birthday problem R, combn R, multiplication rule, combinatorics R"
auto_link_terms: "counting principles|permutations in R|combinations in R|birthday problem|multiplication rule|combinatorics in R"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: 2026-04-17
curriculum_id: FR-prob-1
post_type: FR
fr_parent: Sample-Spaces-Events-and-Probability-Axioms-in-R-With-Monte-Carlo-Proof.html
difficulty: "Intermediate"
---

# Counting Principles in R: Permutations, Combinations & Birthday Problem

<p class="lead">Counting principles in R let you count outcomes without listing them one by one. Use <code>factorial()</code> for orderings, <code>choose()</code> for unordered selections, and <code>combn()</code> to enumerate every subset — three tools that power permutations, combinations, and classic puzzles like the birthday problem.</p>

Every probability starts with a count. This post walks you through the three counting tools every R user needs, then uses them to crack the birthday problem from first principles. We stick to base R throughout.

## What is the multiplication rule in R?

Probability starts with counting, and counting starts with the multiplication rule. The rule says: if one step has *a* outcomes and a second independent step has *b* outcomes, the combined process has `a * b` outcomes. Every other counting formula in this post is a disguised version of this one idea. Let's count every possible result of rolling two dice.

```r
# Every outcome of rolling two dice
dice_outcomes <- expand.grid(die1 = 1:6, die2 = 1:6)
nrow(dice_outcomes)
#> [1] 36

head(dice_outcomes, 4)
#>   die1 die2
#> 1    1    1
#> 2    2    1
#> 3    3    1
#> 4    4    1

# Same answer by multiplication
6 * 6
#> [1] 36
```

`expand.grid()` builds every combination of the input vectors, one row per outcome. Counting the rows (36) matches `6 * 6` exactly — that is the multiplication rule in action. For small spaces, enumerating outcomes is fine. For larger ones, multiplication is the only practical path.

The rule generalises to any number of independent steps. For *k* steps with option counts $a_1, a_2, \ldots, a_k$, the total is:

$$N = a_1 \times a_2 \times \cdots \times a_k$$

Consider a 4-character password drawn from 26 letters plus 10 digits — 36 options per slot, four independent slots.

```r
# How many 4-char alphanumeric passwords?
n_passwords <- 36^4
n_passwords
#> [1] 1679616
```

Over 1.6 million combinations for a weak four-character password. The count grows as an exponent of the alphabet size, which is why one extra character massively expands the search space for a brute-force attacker.

[KEY INSIGHT]
**Every counting rule is a disguised multiplication rule.** Permutations, combinations, and even the birthday problem all reduce to multiplying the number of choices at each step — with adjustments for whether order matters and whether repetition is allowed.

**Try it:** How many outcomes are there when you roll one die and flip one coin? Save the result to `ex_outcomes`.

```r
# Try it: use the multiplication rule
ex_outcomes <- # your code here

ex_outcomes
#> Expected: 12
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_outcomes <- 6 * 2
ex_outcomes
#> [1] 12
```

**Explanation:** Six die faces times two coin sides gives 12 outcomes — the multiplication rule with two independent steps.

</details>

## How do you compute permutations in R?

A **permutation** is an ordered arrangement. "ABC" and "CAB" are different permutations of the same three letters because the positions are different. The count of ways to arrange all *n* distinct items is *n!*, read "n factorial", and R computes it with `factorial()`.

```r
# Arrange five distinct books on a shelf
factorial(5)
#> [1] 120

# The same thing, written out
5 * 4 * 3 * 2 * 1
#> [1] 120
```

Think of it as filling five slots. The first slot can hold any of five books, the second any of the remaining four, and so on — the multiplication rule, applied down to 1.

Often we only fill *k* slots out of *n*. The count of ordered arrangements of *n* items taken *k* at a time is the **permutation formula**:

$$P(n, k) = \frac{n!}{(n - k)!}$$

Where:

- $n$ = total items available
- $k$ = slots to fill
- $P(n, k)$ = number of ordered arrangements

The intuition: you fill *k* slots, with *n*, *n−1*, *n−2*, … options at each step — stopping after *k* multiplications. The formula is a shortcut for that product.

```r
# 5 people, 3 chairs — how many seating orders?
p_5_3_a <- factorial(5) / factorial(5 - 3)
p_5_3_a
#> [1] 60

# Equivalent: pick an unordered group of 3, then shuffle them
p_5_3_b <- choose(5, 3) * factorial(3)
p_5_3_b
#> [1] 60
```

Both routes give 60. The first uses the permutation formula directly. The second says: pick the three people (unordered), then count the 3! ways to sit them in the chairs. That identity — "permutation = combination × k!" — shows up again in the birthday problem.

To see every permutation explicitly, we can filter `expand.grid()` for rows with no duplicates. This is the base-R trick when you do not want to reach for a package.

```r
# List every ordering of A, B, C
perm_abc <- expand.grid(pos1 = c("A", "B", "C"),
                        pos2 = c("A", "B", "C"),
                        pos3 = c("A", "B", "C"))
perm_abc <- perm_abc[!apply(perm_abc, 1, anyDuplicated), ]
rownames(perm_abc) <- NULL
perm_abc
#>   pos1 pos2 pos3
#> 1    A    B    C
#> 2    B    A    C
#> 3    A    C    B
#> 4    C    A    B
#> 5    B    C    A
#> 6    C    B    A
```

Six rows, matching `factorial(3) = 6`. For small *n* this is fine, but it scales terribly — `factorial(10)` is already 3.6 million orderings, so enumeration is rarely the right tool.

[NOTE]
**The gtools package has a convenient permutations() function.** It works in a regular R console but is not pre-compiled for the browser runtime powering the code blocks on this page, so we keep everything in base R. Installing gtools locally is worth it if you enumerate permutations often.

**Try it:** Use `factorial()` to compute P(10, 3) — the number of ways to award gold, silver, and bronze medals to 10 athletes. Save as `ex_p`.

```r
# Try it: permutation formula
ex_p <- # your code here

ex_p
#> Expected: 720
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_p <- factorial(10) / factorial(10 - 3)
ex_p
#> [1] 720
```

**Explanation:** Ten athletes for gold, nine remaining for silver, eight for bronze — 10 × 9 × 8 = 720, which is `10! / 7!`.

</details>

## How do you compute combinations in R?

A **combination** is an unordered selection. The team {Alice, Bob} is the same as {Bob, Alice} — only who is in matters. The count of *k*-element subsets of an *n*-element set is the **binomial coefficient**, written "n choose k":

$$C(n, k) = \binom{n}{k} = \frac{n!}{k!\,(n - k)!}$$

R computes it with `choose(n, k)`. No package needed.

```r
# Pick a 3-person team from 5 candidates
choose(5, 3)
#> [1] 10

# Intuition: permutations over-count by k! orderings per team
factorial(5) / (factorial(3) * factorial(5 - 3))
#> [1] 10
```

Ten teams. The formula adds a `k!` to the denominator of the permutation formula, erasing the over-counting from orderings that combinations ignore.

`choose()` tells you **how many**, but `combn()` gives you **the actual subsets**. `combn(x, m)` returns an m-by-C(n, m) matrix where each column is one combination.

```r
# Enumerate every 3-person team from 5 candidates
teams <- combn(c("Ava", "Bo", "Cy", "Di", "Ev"), 3)
dim(teams)
#> [1] 3 10

# Transpose so each row is a team (easier to read)
t(teams)
#>       [,1]  [,2]  [,3]
#>  [1,] "Ava" "Bo"  "Cy"
#>  [2,] "Ava" "Bo"  "Di"
#>  [3,] "Ava" "Bo"  "Ev"
#>  [4,] "Ava" "Cy"  "Di"
#>  [5,] "Ava" "Cy"  "Ev"
#>  [6,] "Ava" "Di"  "Ev"
#>  [7,] "Bo"  "Cy"  "Di"
#>  [8,] "Bo"  "Cy"  "Ev"
#>  [9,] "Bo"  "Di"  "Ev"
#> [10,] "Cy"  "Di"  "Ev"
```

Ten rows match `choose(5, 3)`. Order inside a row does not matter — `combn()` always emits combinations in lexicographic order.

[TIP]
**combn() can apply a function to every combination.** Pass a function as the third argument — `combn(1:5, 3, sum)` returns the sum of every 3-subset. This turns `combn()` into a one-liner for exhaustive search over small subsets.

**Try it:** How many 5-card hands can be dealt from a standard 52-card deck? Save to `ex_hands`.

```r
# Try it: combinations
ex_hands <- # your code here

ex_hands
#> Expected: 2598960
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_hands <- choose(52, 5)
ex_hands
#> [1] 2598960
```

**Explanation:** Poker deals five cards from 52 without regard to order, so this is `choose(52, 5)` — roughly 2.6 million distinct hands.

</details>

## When do you use permutations vs combinations?

The entire decision comes down to one question: **does order matter?** If yes, use permutations. If no, use combinations. Phrased differently — if swapping two items in the arrangement produces a different outcome for your problem, order matters.

```r
# 3-digit PIN from 5 unique digits — order MATTERS (731 != 137)
n_pins <- factorial(5) / factorial(5 - 3)
n_pins
#> [1] 60

# 3-person committee from 5 candidates — order DOES NOT MATTER
n_committees <- choose(5, 3)
n_committees
#> [1] 10
```

Same (n, k), wildly different counts. The PIN problem produces 60 arrangements because a PIN of 731 is a different PIN from 137. The committee problem produces 10 because {Alice, Bob, Cy} is the same committee regardless of how we list the names.

The relationship is exact: permutations over-count by the *k!* orderings within each combination.

```r
# Identity: P(n,k) = k! * C(n,k)
factorial(3) * choose(5, 3) == factorial(5) / factorial(5 - 3)
#> [1] TRUE
```

This is why combinations are always smaller: they group all *k!* orderings of the same *k* items into a single unordered set.

[WARNING]
**Using choose() when order matters undercounts by k!.** Reaching for `choose()` on a seating problem or a PIN problem is a top-5 probability bug. Before calling a counting function, write one sentence explaining whether swapping two items changes the answer.

**Try it:** Given 7 books on a shelf, how many ways can you arrange 3 of them left-to-right? Save as `ex_arrange`.

```r
# Try it: does order matter here?
ex_arrange <- # your code here

ex_arrange
#> Expected: 210
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_arrange <- factorial(7) / factorial(7 - 3)
ex_arrange
#> [1] 210
```

**Explanation:** Left-to-right arrangement means order matters, so this is `P(7, 3)`. Seven books for the first slot, six for the second, five for the third — 7 × 6 × 5 = 210.

</details>

## How does the birthday problem apply counting principles in R?

The birthday problem asks: in a room of *n* people, what is the probability that at least two share a birthday? The counterintuitive answer is that with just 23 people, the probability is already above 50%. Most readers guess closer to 100 or 200.

The direct way — "count every way at least one pair matches" — is awkward. The trick is the **complement**: compute the probability that *everyone is different*, then subtract from 1.

Assume 365 equally likely birthdays and independence. For *n* people, there are $365^n$ possible birthday sequences. For all *n* to be different, the first person has 365 options, the second 364, the third 363, and so on — a permutation count, $P(365, n)$. So:

$$P(\text{shared}) = 1 - \frac{P(365, n)}{365^n} = 1 - \frac{365!}{(365 - n)! \cdot 365^n}$$

Where:

- $n$ = number of people
- $P(\text{shared})$ = probability at least two share a birthday

Factorials of 365 overflow `factorial()` in R. The fix is `lfactorial()` — the logarithm of the factorial — and exponentiating at the end.

```r
# Probability at least two out of n share a birthday
bday_prob <- function(n) {
  log_p_no_match <- lfactorial(365) - lfactorial(365 - n) - n * log(365)
  1 - exp(log_p_no_match)
}

p23 <- bday_prob(23)
round(p23, 4)
#> [1] 0.5073
```

With 23 people, the probability is 0.5073 — just over 50%. The function stays numerically stable up to n = 365 because all arithmetic is in log space before a single `exp()` at the end.

Next, sweep *n* from 1 to 60 and find the first *n* where the probability crosses 0.5.

```r
# Vectorise over group size
probs_1_60 <- sapply(1:60, bday_prob)

# First n where the probability exceeds 0.5
crossover <- which(probs_1_60 > 0.5)[1]
crossover
#> [1] 23

round(probs_1_60[c(10, 23, 30, 50)], 3)
#> [1] 0.117 0.507 0.706 0.970
```

Crossover happens at exactly 23 people. By 30 there is a 70% chance, and by 50 it is 97% — the curve climbs fast once the number of pairs grows large.

The simulation route skips the formula entirely: sample birthdays, check for duplicates, and repeat thousands of times.

```r
# Monte Carlo: 10,000 rooms of 23 people
set.seed(2026)
sim_p23 <- mean(replicate(10000, {
  any(duplicated(sample(365, 23, replace = TRUE)))
}))

sim_p23
#> [1] 0.5063
```

The simulation lands at 0.5063, within 0.001 of the analytic 0.5073 — a strong validation that the formula is correct. `replicate()` runs the expression 10,000 times, `sample()` draws 23 birthdays with replacement, and `duplicated()` flags any repeat.

Finally, visualise the full curve with both methods overlaid. The base-R plot runs directly in the browser.

```r
# Compare theory and simulation across group sizes
set.seed(2026)
ns <- 2:75
theory <- sapply(ns, bday_prob)
sim <- sapply(ns, function(n) {
  mean(replicate(2000, any(duplicated(sample(365, n, replace = TRUE)))))
})

plot(ns, theory, type = "l", lwd = 2, col = "steelblue",
     xlab = "Number of people in the room",
     ylab = "P(at least two share a birthday)",
     main = "The birthday problem: theory vs simulation")
points(ns, sim, pch = 20, col = "tomato")
abline(h = 0.5, lty = 2, col = "grey40")
abline(v = 23, lty = 2, col = "grey40")
legend("bottomright", legend = c("Formula", "Simulation"),
       col = c("steelblue", "tomato"), lty = c(1, NA), pch = c(NA, 20))
```

The simulated points sit almost exactly on the analytic curve. Dashed guides mark the 50% line and n = 23 — the famous crossover point.

[KEY INSIGHT]
**The magic of n = 23 comes from counting pairs, not people.** With 23 people there are `choose(23, 2) = 253` distinct pairs. Each pair has a 1/365 chance of matching, so the expected number of matches is about 0.69 — big enough that at least one match becomes likely. The probability grows with pairs, which grow quadratically in *n*.

**Try it:** Modify `bday_prob()` so the year length is an argument `days` (default 365). Use it to find the crossover `n` for a leap year (`days = 366`). Save as `ex_crossover`.

```r
# Try it: parametrise the year length
bday_prob_gen <- function(n, days = 366) {
  # your code here
}

ex_crossover <- # your code here
ex_crossover
#> Expected: 23
```

<details>
<summary>Click to reveal solution</summary>

```r
bday_prob_gen <- function(n, days = 366) {
  log_p_no_match <- lfactorial(days) - lfactorial(days - n) - n * log(days)
  1 - exp(log_p_no_match)
}

ex_crossover <- which(sapply(1:60, bday_prob_gen, days = 366) > 0.5)[1]
ex_crossover
#> [1] 23
```

**Explanation:** Adding one day (Feb 29) barely shifts the probabilities — crossover is still at 23. The birthday problem is robust to small changes in the denominator because it is driven by the number of pairs.

</details>

## Practice Exercises

These capstones combine several ideas from the tutorial. Use variable names prefixed with `my_` so they do not overwrite tutorial variables.

### Exercise 1: Probability of a flush in poker

Compute the probability that a random 5-card hand from a standard 52-card deck is a flush — all five cards of the same suit. Combine `choose()` with the multiplication rule: pick a suit, then pick 5 cards from that suit. Save to `my_flush_prob`.

```r
# Exercise 1: probability of a flush
# Hint: 4 suits, each with 13 cards; divide by choose(52, 5)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_flush_prob <- (4 * choose(13, 5)) / choose(52, 5)
round(my_flush_prob, 5)
#> [1] 0.00198
```

**Explanation:** Four suits times `choose(13, 5)` same-suit hands gives the flush count; dividing by `choose(52, 5)` gives roughly 0.2% — about 1 in 505 hands. (Poker convention excludes straight flushes from this count, but the formula above matches the general "all same suit" question.)

</details>

### Exercise 2: Triple-birthday simulation

Simulate the probability that in a room of 30 random people, at least **three** people share a birthday (not just two). The closed form is messy, so use simulation only: draw 30 birthdays, check whether any single birthday appears three or more times, repeat 10,000 times. Save to `my_triple_prob`.

```r
# Exercise 2: at least one triple
# Hint: tabulate sampled birthdays and check max count >= 3

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
set.seed(1)
my_triple_prob <- mean(replicate(10000, {
  b <- sample(365, 30, replace = TRUE)
  max(tabulate(b)) >= 3
}))
round(my_triple_prob, 4)
#> [1] 0.0287
```

**Explanation:** `tabulate()` counts occurrences of each integer, and `max() >= 3` asks whether any birthday appears at least three times. Around 2.9% — much rarer than the pair version, but still non-trivial in a standard classroom.

</details>

### Exercise 3: 4-digit PINs that contain a 7

Count how many 4-digit PINs with distinct digits from 0-9 contain the digit 7 at least once. Generate all such PINs with `combn()` plus permutation, then filter. Save the count to `my_with7`.

```r
# Exercise 3: PINs containing a 7
# Hint: use combn() to pick the 4 digits, then expand.grid-style permute

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
# Total 4-digit PINs with distinct digits
total_pins <- factorial(10) / factorial(10 - 4)

# PINs with NO 7: pick 4 distinct digits from 0-9 excluding 7, then order them
no7_pins <- factorial(9) / factorial(9 - 4)

my_with7 <- total_pins - no7_pins
my_with7
#> [1] 2016
```

**Explanation:** Using the complement is cleaner than enumeration. Total permutations `P(10, 4) = 5040`, PINs with no 7 are `P(9, 4) = 3024`, so 2016 PINs contain at least one 7 — about 40%.

</details>

## Complete Example: the bootcamp-classroom question

A data science bootcamp has 28 students per cohort. The instructor wants to open each class with the fact that two students probably share a birthday. Write one script that (a) estimates the probability analytically, (b) validates it by simulation, and (c) reports how many distinct pairs of students exist.

```r
# 1. Analytic probability
bday_prob_28 <- bday_prob(28)

# 2. Simulation with 20,000 cohorts
set.seed(2026)
sim_28 <- mean(replicate(20000, {
  any(duplicated(sample(365, 28, replace = TRUE)))
}))

# 3. Number of distinct pairs
n_pairs <- choose(28, 2)

cat("Analytic P(shared):  ", round(bday_prob_28, 4), "\n")
cat("Simulated P(shared): ", round(sim_28, 4), "\n")
cat("Distinct pairs:      ", n_pairs, "\n")
#> Analytic P(shared):   0.6545
#> Simulated P(shared):  0.6541
#> Distinct pairs:       378
```

A 28-person cohort has a 65% shared-birthday probability, backed by 378 distinct pairs — any of which could collide. Analytic and simulated probabilities agree to within 0.001. The same three-step pattern — formula, simulation, pair count — answers almost every intro-probability counting question that comes up in practice.

## Summary

The three tools in this tutorial cover almost every counting problem in introductory probability.

| Concept | R function | Order matters? | Example |
|---|---|---|---|
| Multiplication rule | `a * b` | N/A | Two dice → 36 outcomes |
| Factorial | `factorial(n)` | Yes, all n | 5 books in a row → 120 |
| Permutations | `factorial(n) / factorial(n - k)` | Yes | 5 people, 3 chairs → 60 |
| Combinations (count) | `choose(n, k)` | No | 3-person team from 5 → 10 |
| Combinations (enumerate) | `combn(x, k)` | No | List every team |
| Large-n formulas | `lfactorial()` | — | Birthday problem |

Key takeaways:

- The multiplication rule is the foundation: everything else adjusts for order and repetition.
- If order matters use permutations, otherwise combinations. Writing the rule in a sentence prevents the most common probability bug.
- `choose()` gives the count, `combn()` gives the actual subsets — both are base R.
- For probabilities of rare events over large spaces, `lfactorial()` keeps arithmetic stable; simulation via `replicate()` is a sanity check that rarely disagrees.
- The birthday problem's surprise is quadratic pair growth — `choose(n, 2)` climbs fast, which is why 23 people already give you a 50% chance of a match.

## References

1. Grinstead, C. M. & Snell, J. L. — *Introduction to Probability*, Chapter 3: Combinatorics. Hosted on LibreTexts. [Link](https://stats.libretexts.org/Bookshelves/Probability_Theory/Introductory_Probability_(Grinstead_and_Snell)/03:_Combinatorics)
2. Wikipedia — *Birthday problem*. [Link](https://en.wikipedia.org/wiki/Birthday_problem)
3. R Core Team — `choose`, `factorial`, and `combn` reference (base package). [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/Special.html)
4. Robinson, D. — *The birthday paradox puzzle: tidy simulation in R*. Variance Explained. [Link](http://varianceexplained.org/r/birthday-problem/)
5. Heiss, A. — *Calculating birthday probabilities with R instead of math*. [Link](https://www.andrewheiss.com/blog/2024/05/03/birthday-spans-simulation-sans-math/)
6. Wickham, H. — *Advanced R*, 2nd Edition. CRC Press (2019). [Link](https://adv-r.hadley.nz/)

## Continue Learning

- [Sample Spaces, Events and Probability Axioms in R](Sample-Spaces-Events-and-Probability-Axioms-in-R-With-Monte-Carlo-Proof.html) — the parent post, where every counting principle here becomes a probability via the axioms.
- [Conditional Probability in R](Conditional-Probability-in-R.html) — builds on counting to update beliefs when new information arrives.
- [Central Limit Theorem in R](Central-Limit-Theorem-in-R.html) — another Monte Carlo showcase, using `replicate()` to validate a theoretical result.
