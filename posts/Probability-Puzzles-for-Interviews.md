---
title: "Top 20 Probability Puzzles for Data Science Interviews"
slug: "Probability-Puzzles-for-Interviews"
description: "Probability interview questions solved in R: 20 puzzles from birthday and Monty Hall to coupon collector and Bayes, cracked by simulation with exact math."
keywords: "probability interview questions, probability puzzles data science, birthday problem in r, monty hall simulation, coupon collector problem, bayes base rate"
mathjax: true
webr: true
date: "2026-07-14"
post_type: "EX"
sidebar_title: "Probability Puzzles"
sidebar_order: 150
fr_parent: "Conditional-Probability-in-R.html"
auto_link_terms: "probability puzzles|probability interview questions|monty hall problem|birthday problem|coupon collector|bayes theorem"
auto_link_case_sensitive: false
target_keyword: "probability interview questions"
sibling_block_enabled: false
difficulty: "Mixed"
---

# Top 20 Probability Puzzles for Data Science Interviews

<p class="lead">Probability puzzles are the quiet killer of data science interviews: the birthday paradox, Monty Hall, the coupon collector, and Bayesian base-rate traps all have answers that feel wrong until you see the math. This featured collection works through 20 classic problems in R, cracking each one by simulation first and confirming the exact analytic answer second. Full solutions stay hidden until you try.</p>

The recipe is the same every time. Describe the random experiment, run it a few hundred thousand times, and read off the frequency. Because every simulation sets a seed, your numbers will match the ones shown here exactly, and each solution closes the loop by deriving the closed-form answer so you can defend it out loud. That "simulate to sanity-check, then prove" habit is exactly what a strong interviewer is listening for.

```r title="Run this once before any exercise"
library(ggplot2)

# Each exercise sets its own seed, so every result below is fully reproducible.
set.seed(42)
```

## Section 1. Dice, coins, and your first simulations (3 problems)

### Exercise 1.1: Estimate the chance of at least one six in four rolls

**Task:** A gambler bets that at least one six appears when a fair die is rolled four times. Simulate 100,000 rounds of four rolls, record whether a six shows up in each round, and estimate the probability of winning the bet. Save the estimate to `ex_1_1`.

**Expected result:**

```
#> [1] 0.5175
```

**Difficulty:** Beginner

[HINTS]
You need to repeat a small random experiment many times and average a TRUE/FALSE outcome; the average of a logical vector is a proportion.
Use `replicate()` around `any(sample(1:6, 4, replace = TRUE) == 6)`, then take `mean()`.

```r title="Your turn"
set.seed(42)
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)
rolls <- replicate(100000, any(sample(1:6, 4, replace = TRUE) == 6))
ex_1_1 <- round(mean(rolls), 4)
ex_1_1
#> [1] 0.5175
```

**Explanation:** This is the classic problem the Chevalier de Mere lost money on. The exact probability is the complement of never rolling a six: $1 - (5/6)^4 \approx 0.5177$. Our estimate of 0.5175 sits within Monte Carlo noise of that value. The key modelling move is to compute the complement of "no sixes" rather than trying to add up the messy overlapping cases of one, two, three, or four sixes.

</details>

### Exercise 1.2: Simulate the expected number of rolls to see a six

**Task:** You keep rolling a fair die until the first six appears and count how many rolls it took. Simulate this waiting time 100,000 times using a loop that stops on the first six, then estimate the average number of rolls needed. Save the mean to `ex_1_2`.

**Expected result:**

```
#> [1] 5.986
```

**Difficulty:** Beginner

[HINTS]
The number of trials until the first success of a repeated independent event has a well known expected value tied to the success probability.
Inside `replicate()`, use a `while` loop that increments a counter until `sample(1:6, 1) == 6`, then average the counts.

```r title="Your turn"
set.seed(42)
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)
first_six <- replicate(100000, {
  n <- 1
  while (sample(1:6, 1) != 6) n <- n + 1
  n
})
ex_1_2 <- round(mean(first_six), 3)
ex_1_2
#> [1] 5.986
```

**Explanation:** The number of rolls until the first six is a geometric random variable with success probability $p = 1/6$, and its expectation is $1/p = 6$. The simulated 5.986 confirms it. A common interview trap is to guess "about 3" by confusing the median with the mean; the geometric distribution is right-skewed, so its mean sits above its median. The vectorised shortcut `mean(rgeom(1e5, 1/6) + 1)` gives the same answer faster.

</details>

### Exercise 1.3: Estimate the probability two dice sum to seven

**Task:** Two fair dice are rolled and their pips are added. Simulate 100,000 paired rolls by drawing two independent vectors of die faces, then estimate the probability that the two dice sum to exactly seven. Save the estimated probability to `ex_1_3`.

**Expected result:**

```
#> [1] 0.1662
```

**Difficulty:** Beginner

[HINTS]
Seven is the most likely total for two dice; think about how many of the 36 equally likely ordered outcomes add up to it.
Draw `d1` and `d2` with `sample(1:6, 100000, replace = TRUE)` and take `mean(d1 + d2 == 7)`.

```r title="Your turn"
set.seed(42)
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)
d1 <- sample(1:6, 100000, replace = TRUE)
d2 <- sample(1:6, 100000, replace = TRUE)
ex_1_3 <- round(mean(d1 + d2 == 7), 4)
ex_1_3
#> [1] 0.1662
```

**Explanation:** Of the 36 equally likely ordered pairs, six of them sum to seven: (1,6), (2,5), (3,4), (4,3), (5,2), (6,1). So the exact probability is $6/36 = 1/6 \approx 0.1667$, matching the simulated 0.1662. Seven is special because it is the only total reachable from every face of the first die, which is why it is the most common roll and the anchor of the game of craps.

</details>

## Section 2. The birthday problem (3 problems)

### Exercise 2.1: Simulate the birthday paradox for 23 people

**Task:** In a room of 23 people, what is the chance that at least two of them share a birthday? Assume 365 equally likely birthdays and ignore leap years. Simulate 100,000 rooms of 23 people and estimate the probability that some birthday is repeated. Save the estimate to `ex_2_1`.

**Expected result:**

```
#> [1] 0.5075
```

**Difficulty:** Intermediate

[HINTS]
Draw 23 birthdays with replacement and ask whether any value occurs more than once; there is a base function that flags repeats.
Use `any(duplicated(sample(1:365, 23, replace = TRUE)))` inside `replicate()`.

```r title="Your turn"
set.seed(42)
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)
has_match <- replicate(100000, any(duplicated(sample(1:365, 23, replace = TRUE))))
ex_2_1 <- round(mean(has_match), 4)
ex_2_1
#> [1] 0.5075
```

**Explanation:** The result surprises almost everyone: just 23 people give better-than-even odds of a shared birthday. The exact probability is $1 - \frac{365 \times 364 \times \cdots \times 343}{365^{23}} \approx 0.5073$, which our 0.5075 confirms. Intuition fails because people count comparisons to themselves, but the relevant quantity is the number of pairs, $\binom{23}{2} = 253$, and each pair is a fresh chance to collide.

</details>

### Exercise 2.2: Find the smallest group where a shared birthday is more likely than not

**Task:** Sweep group sizes from 2 to 30 and, for each size, simulate 20,000 rooms to estimate the probability of a shared birthday. Find the smallest group size whose estimated probability first reaches or exceeds 0.5, and report that size alongside its estimated shared-birthday probability. Save the named result to `ex_2_2`.

**Expected result:**

```
#> group_size   p_shared 
#>    23.0000     0.5109
```

**Difficulty:** Intermediate

[HINTS]
Wrap the single-room simulation in a helper function of the group size, then apply it across a range of sizes and scan for the first crossing of 0.5.
Build `probs <- sapply(2:30, p_match)`, locate `idx <- which(probs >= 0.5)[1]`, and pair `(2:30)[idx]` with `probs[idx]`.

```r title="Your turn"
set.seed(42)
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)
p_match <- function(k, sims = 20000) {
  mean(replicate(sims, any(duplicated(sample(1:365, k, replace = TRUE)))))
}
probs <- sapply(2:30, p_match)
idx <- which(probs >= 0.5)[1]
ex_2_2 <- c(group_size = (2:30)[idx], p_shared = round(probs[idx], 4))
ex_2_2
#> group_size   p_shared 
#>    23.0000     0.5109
```

**Explanation:** The simulation lands on 23, the textbook answer, because the probability first crosses one half at exactly that group size: the exact analytic value is about 0.507, and our 20,000-room estimate reads 0.5109 while 22 people fall just short. Sweeping a parameter and locating a threshold crossing is a reusable pattern: define a function of the parameter, vectorise it with `sapply()`, and use `which()` to find the first index that satisfies your condition.

</details>

### Exercise 2.3: Plot the birthday collision probability curve

**Task:** Build the full birthday curve by simulating the shared-birthday probability for every group size from 2 to 60 people, using 2,000 rooms per size. Plot the probability against group size with a dashed reference line at 0.5, and save the finished plot object to `ex_2_3`.

**Expected result:**

```
#> A rising S-shaped curve climbing from near 0 at 2 people to near 1 by 60.
#> A dashed horizontal line at y = 0.5 is crossed at roughly 23 people.
```

**Difficulty:** Intermediate

[HINTS]
Reuse a per-size simulation across a longer range of group sizes and store the results in a two-column data frame before plotting.
Feed a `data.frame(group_size, p_match)` to `ggplot()` with `geom_line()` plus `geom_hline(yintercept = 0.5)`.

```r title="Your turn"
set.seed(42)
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)
sizes <- 2:60
p_collide <- sapply(sizes, function(k) {
  mean(replicate(2000, any(duplicated(sample(1:365, k, replace = TRUE)))))
})
df <- data.frame(group_size = sizes, p_match = p_collide)
ex_2_3 <- ggplot(df, aes(group_size, p_match)) +
  geom_line(color = "#2b6cb0", linewidth = 1) +
  geom_hline(yintercept = 0.5, linetype = "dashed") +
  labs(title = "Birthday problem: probability of a shared birthday",
       x = "People in the room", y = "P(at least one shared birthday)")
ex_2_3
#> Renders an S-curve crossing 0.5 near 23 people.
```

**Explanation:** Seeing the whole curve dissolves the paradox: the probability rises steeply, passes 0.5 near 23 people, and is already above 0.97 by 50. The steepness comes from the pair count growing quadratically with group size, so each extra person adds many new comparisons. Plotting a simulated quantity across a parameter range, rather than reporting a single number, is often what turns a surprising result into an obvious one for a stakeholder.

</details>

## Section 3. Monty Hall and conditional-probability traps (4 problems)

### Exercise 3.1: Settle the Monty Hall problem by simulation

**Task:** In the Monty Hall game the car hides behind one of three doors, you pick a door, the host opens a different door revealing a goat, and you may switch. Simulate 100,000 games where the host always reveals a goat, and estimate the win probability for the stay strategy and the switch strategy. Save the two-value named result to `ex_3_1`.

**Expected result:**

```
#>   stay switch 
#> 0.3312 0.6688
```

**Difficulty:** Intermediate

[HINTS]
The whole puzzle turns on the host's constraint: the opened door is never your pick and never the car, which leaks information.
Write a `play()` function that uses `setdiff()` to choose the host's door and the switch door, then average the two outcomes with `rowMeans()`.

```r title="Your turn"
set.seed(42)
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)
play <- function() {
  car  <- sample(1:3, 1)
  pick <- sample(1:3, 1)
  doors <- setdiff(1:3, c(pick, car))
  host <- if (length(doors) == 1) doors else sample(doors, 1)
  switch_to <- setdiff(1:3, c(pick, host))
  c(stay = pick == car, switch = switch_to == car)
}
res <- replicate(100000, play())
ex_3_1 <- round(rowMeans(res), 4)
ex_3_1
#>   stay switch 
#> 0.3312 0.6688
```

**Explanation:** Switching wins twice as often, close to the exact $2/3$ versus $1/3$. The reason is that your first pick is right only $1/3$ of the time, so $2/3$ of the time the car is behind one of the other two doors, and the host obligingly removes the empty one, concentrating that whole $2/3$ onto the single remaining door. The host's knowledge is the hinge: if he opened a door at random and happened to miss the car, the advantage would vanish.

</details>

### Exercise 3.2: Estimate P(two boys given at least one boy)

**Task:** A family has two children, each equally likely to be a boy or a girl. Given that at least one child is a boy, what is the probability that both are boys? Simulate 200,000 two-child families, keep only the families with at least one boy, and estimate the conditional probability of two boys. Save it to `ex_3_2`.

**Expected result:**

```
#> [1] 0.3333
```

**Difficulty:** Intermediate

[HINTS]
This is a conditioning problem: restrict attention to the families that satisfy the condition, then measure how many of those also satisfy the target.
Build a two-column matrix of "B"/"G", then divide `sum(both_boys)` by `sum(at_least_one_boy)`.

```r title="Your turn"
set.seed(42)
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)
n <- 200000
kids <- matrix(sample(c("B", "G"), 2 * n, replace = TRUE), ncol = 2)
at_least_one_boy <- kids[, 1] == "B" | kids[, 2] == "B"
both_boys <- kids[, 1] == "B" & kids[, 2] == "B"
ex_3_2 <- round(sum(both_boys) / sum(at_least_one_boy), 4)
ex_3_2
#> [1] 0.3333
```

**Explanation:** The answer is $1/3$, not the tempting $1/2$. Of the four equally likely families BB, BG, GB, GG, the condition "at least one boy" removes only GG, leaving three cases, and just one of them (BB) has two boys. The trap is treating the second child as if it were independent of the information given; conditioning on "at least one boy" is a statement about the pair, not about one specific child.

</details>

### Exercise 3.3: Contrast it with P(two boys given the older is a boy)

**Task:** Reuse the two-child setup but change the information: now you are told the older child (the first column) is a boy. Simulate 200,000 families, condition on the older child being a boy, and estimate the probability that both children are boys. Save the conditional estimate to `ex_3_3` and compare it against Exercise 3.2.

**Expected result:**

```
#> [1] 0.4997
```

**Difficulty:** Intermediate

[HINTS]
The condition now pins down a specific child rather than an unlabelled one, which changes the set of families you keep.
Condition on `kids[, 1] == "B"` instead of "at least one boy", then divide by its count.

```r title="Your turn"
set.seed(42)
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)
n <- 200000
kids <- matrix(sample(c("B", "G"), 2 * n, replace = TRUE), ncol = 2)
older_boy <- kids[, 1] == "B"
both_boys <- kids[, 1] == "B" & kids[, 2] == "B"
ex_3_3 <- round(sum(both_boys) / sum(older_boy), 4)
ex_3_3
#> [1] 0.4997
```

**Explanation:** Now the answer is $1/2$, confirmed by the simulated 0.4997. Naming a specific child ("the older one") makes the other child's sex genuinely independent, so it is a boy half the time. The lesson that trips up candidates is that "at least one is a boy" and "the older one is a boy" are different pieces of evidence: the first leaves three families in play, the second leaves two, and that difference is the whole gap between $1/3$ and $1/2$.

</details>

### Exercise 3.4: Crack the Tuesday-boy variant

**Task:** A parent says "I have two children, and at least one is a boy born on a Tuesday." Assuming 7 equally likely birth weekdays, simulate 500,000 families with a sex and a weekday per child, condition on having at least one Tuesday-born boy, and estimate the probability that both children are boys. Save the estimate to `ex_3_4`.

**Expected result:**

```
#> [1] 0.4787
```

**Difficulty:** Advanced

[HINTS]
Adding the weekday makes the condition far more specific, which shifts the answer away from the plain "at least one boy" value.
Encode Tuesday as day 2 and condition on `(s1 == "B" & d1 == 2) | (s2 == "B" & d2 == 2)`.

```r title="Your turn"
set.seed(42)
ex_3_4 <- # your code here
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)
n <- 500000
s1 <- sample(c("B", "G"), n, replace = TRUE); d1 <- sample(1:7, n, replace = TRUE)
s2 <- sample(c("B", "G"), n, replace = TRUE); d2 <- sample(1:7, n, replace = TRUE)
tue_boy <- (s1 == "B" & d1 == 2) | (s2 == "B" & d2 == 2)
both_boys <- s1 == "B" & s2 == "B"
ex_3_4 <- round(sum(both_boys & tue_boy) / sum(tue_boy), 4)
ex_3_4
#> [1] 0.4787
```

**Explanation:** The exact answer is the famously counterintuitive $13/27 \approx 0.4815$, which our 0.4787 estimates. Counting ordered (sex, weekday) pairs where at least one is a Tuesday boy gives 27 configurations, and 13 of them have two boys. Adding a specific-sounding detail pushes the probability from $1/3$ toward $1/2$ because it makes the two-boy families easier to satisfy in two independent ways; the more specific the condition, the closer you drift to the "named child" answer.

</details>

## Section 4. Base-rate and Bayes traps (3 problems)

### Exercise 4.1: Expose the base-rate fallacy in a medical test

**Task:** A disease affects 1% of people. A test has 99% sensitivity (it flags 99% of sick people) and a 5% false-positive rate among healthy people. Simulate 1,000,000 people, apply the test, and estimate the probability that a person who tests positive is actually sick. Save this posterior probability to `ex_4_1`.

**Expected result:**

```
#> [1] 0.1645
```

**Difficulty:** Advanced

[HINTS]
Generate the true disease status first, then draw a positive/negative test with a probability that depends on that status; finally restrict to positives.
Use `rbinom()` for disease status and an `ifelse()` to pick the positive rate (0.99 if sick, 0.05 if healthy).

```r title="Your turn"
set.seed(42)
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)
n <- 1000000
disease <- rbinom(n, 1, 0.01)
positive <- ifelse(disease == 1, rbinom(n, 1, 0.99), rbinom(n, 1, 0.05))
ex_4_1 <- round(sum(disease == 1 & positive == 1) / sum(positive == 1), 4)
ex_4_1
#> [1] 0.1645
```

**Explanation:** Most people, including many clinicians, guess about 95%, but the true posterior is only about 17%. Bayes gives $\frac{0.01 \times 0.99}{0.01 \times 0.99 + 0.99 \times 0.05} \approx 0.167$, matching the simulated 0.1645. With such a rare disease the healthy group is so large that its 5% false positives (about 49,500 people) swamp the 990 genuine positives. The base rate dominates, which is why a single positive on a rare-disease screen is rarely a diagnosis on its own.

</details>

### Exercise 4.2: Update the diagnosis after a second positive test

**Task:** Take the same disease and test from Exercise 4.1, but now run the test twice independently on each person. Simulate 1,000,000 people, keep those who test positive on both tries, and estimate the probability that a doubly positive person truly has the disease. Save the updated posterior to `ex_4_2`.

**Expected result:**

```
#> [1] 0.7926
```

**Difficulty:** Intermediate

[HINTS]
Two independent positives multiply the evidence, so the same person's positive probability is used twice with fresh draws.
Compute `p_pos` once with `ifelse()`, draw `test1` and `test2` from it, and condition on both being 1.

```r title="Your turn"
set.seed(42)
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)
n <- 1000000
disease <- rbinom(n, 1, 0.01)
p_pos <- ifelse(disease == 1, 0.99, 0.05)
test1 <- rbinom(n, 1, p_pos)
test2 <- rbinom(n, 1, p_pos)
both_pos <- test1 == 1 & test2 == 1
ex_4_2 <- round(sum(disease == 1 & both_pos) / sum(both_pos), 4)
ex_4_2
#> [1] 0.7926
```

**Explanation:** A second independent positive transforms a weak 17% into a strong 79%. The exact posterior is $\frac{0.01 \times 0.99^2}{0.01 \times 0.99^2 + 0.99 \times 0.05^2} \approx 0.798$, and 0.7926 confirms it. Independence is doing the heavy lifting: a healthy person clears both 5% hurdles only 0.25% of the time, so a double positive is far harder to fake by chance. This is the quantitative reason confirmatory testing works, and why interviewers love it as a follow-up to the single-test trap.

</details>

### Exercise 4.3: Resolve Bertrand's box paradox

**Task:** Three boxes hold two coins each: one has two gold coins, one has two silver, and one has a gold and a silver. You pick a box at random and draw one coin at random; it is gold. Simulate 300,000 draws and estimate the probability that the other coin in that box is also gold. Save the estimate to `ex_4_3`.

**Expected result:**

```
#> [1] 0.6674
```

**Difficulty:** Intermediate

[HINTS]
Condition on the coin you actually drew being gold, then check the colour of the remaining coin in the same box.
Store each box as a length-two vector, `sample()` its two coins to fix a draw order, and divide gold-and-gold by first-gold.

```r title="Your turn"
set.seed(42)
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)
n <- 300000
boxes <- list(c("G", "G"), c("G", "S"), c("S", "S"))
draw <- replicate(n, {
  b <- boxes[[sample(1:3, 1)]]
  sample(b, 2)
})
first_gold <- draw[1, ] == "G"
other_gold <- draw[2, ] == "G"
ex_4_3 <- round(sum(first_gold & other_gold) / sum(first_gold), 4)
ex_4_3
#> [1] 0.6674
```

**Explanation:** The intuitive answer of $1/2$ is wrong; the correct probability is $2/3$, confirmed by 0.6674. The mistake is conditioning on the box when you should condition on the coin. Drawing a gold coin is twice as likely from the all-gold box as from the mixed box, so among all gold draws, two-thirds come from the box whose partner is also gold. Counting individual coins rather than boxes is the same subtle shift that makes Monty Hall work.

</details>

## Section 5. Expected-value puzzles (4 problems)

### Exercise 5.1: Estimate the coupon collector's expected packs

**Task:** A cereal brand hides one of six equally likely coupons in each pack, and you want the complete set. Simulate 100,000 shoppers who keep buying packs until they own all six coupons, and estimate the average number of packs a shopper needs. Save the mean to `ex_5_1`.

**Expected result:**

```
#> [1] 14.681
```

**Difficulty:** Intermediate

[HINTS]
Track which of the six coupons you have already seen and keep drawing until the set is complete, counting the draws.
Inside `replicate()`, use a `while (!all(seen))` loop that marks `seen[sample(1:6, 1)] <- TRUE` and increments a counter.

```r title="Your turn"
set.seed(42)
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)
collect_all <- function(k = 6) {
  seen <- logical(k)
  draws <- 0
  while (!all(seen)) {
    seen[sample(1:k, 1)] <- TRUE
    draws <- draws + 1
  }
  draws
}
ex_5_1 <- round(mean(replicate(100000, collect_all(6))), 3)
ex_5_1
#> [1] 14.681
```

**Explanation:** The exact expectation is $6 \times (1 + \tfrac12 + \tfrac13 + \tfrac14 + \tfrac15 + \tfrac16) = 6 \times 2.45 = 14.7$, which the simulated 14.681 confirms. The intuition is that collecting the first new coupon is instant, but the last one takes an average of six packs on its own because you rarely hit the single missing type. That final stretch is why complete-the-set promotions are so much more expensive than they look.

</details>

### Exercise 5.2: Plot the coupon collector's distribution

**Task:** Reveal the shape behind the coupon collector's average by simulating 20,000 shoppers completing a set of six coupons and recording each one's pack count. Draw a histogram of the pack counts with a dashed vertical line at the mean, and save the plot object to `ex_5_2`.

**Expected result:**

```
#> A right-skewed histogram peaking around 12 to 13 packs.
#> A dashed vertical line marks the mean near 14.7, with a long tail past 40.
```

**Difficulty:** Intermediate

[HINTS]
Collect the raw pack counts into a vector first, then let the plotting layer bin them into a histogram.
Pass `data.frame(packs)` to `ggplot()` with `geom_histogram(binwidth = 1)` and add `geom_vline(xintercept = mean(packs))`.

```r title="Your turn"
set.seed(42)
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)
packs <- replicate(20000, {
  seen <- logical(6); n <- 0
  while (!all(seen)) { seen[sample(1:6, 1)] <- TRUE; n <- n + 1 }
  n
})
ex_5_2 <- ggplot(data.frame(packs = packs), aes(packs)) +
  geom_histogram(binwidth = 1, fill = "#2b6cb0", color = "white") +
  geom_vline(xintercept = mean(packs), linetype = "dashed") +
  labs(title = "Coupon collector: packs needed to complete a set of 6",
       x = "Packs bought", y = "Frequency")
ex_5_2
#> Renders a right-skewed histogram with the mean line near 14.7.
```

**Explanation:** The histogram explains why a single average can mislead: the distribution is strongly right-skewed, with most shoppers finishing around 12 to 13 packs but a heavy tail of unlucky collectors needing 30, 40, or more. The mean of 14.7 sits to the right of the mode, dragged up by that tail. Whenever a waiting-time process has a rare but costly worst case, plotting the full distribution rather than quoting the mean is what keeps a plan realistic.

</details>

### Exercise 5.3: Simulate the expected flips until two heads in a row

**Task:** You flip a fair coin until you see two heads in a row (the pattern HH) and count the flips. Simulate this waiting time 100,000 times with a loop that remembers the previous flip, and estimate the average number of flips required. Save the mean to `ex_5_3`.

**Expected result:**

```
#> [1] 6.024
```

**Difficulty:** Advanced

[HINTS]
You must track the previous flip so you can detect the moment two heads land back to back; a single-value memory is enough.
Keep a `prev` symbol and a counter in a `repeat` loop, returning the count when `prev == "H"` and the current flip is also "H".

```r title="Your turn"
set.seed(42)
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)
flips_until_HH <- function() {
  prev <- NA
  count <- 0
  repeat {
    cur <- sample(c("H", "T"), 1)
    count <- count + 1
    if (!is.na(prev) && prev == "H" && cur == "H") return(count)
    prev <- cur
  }
}
ex_5_3 <- round(mean(replicate(100000, flips_until_HH())), 3)
ex_5_3
#> [1] 6.024
```

**Explanation:** The exact expected wait for HH is 6 flips, confirmed by 6.024. The surprise is that different patterns take different times even though each is equally likely on any given pair: HT has expected wait 4, while HH has 6. The gap exists because a failed HH attempt (getting HT) throws you all the way back, whereas overlapping patterns can partially reuse progress. This waiting-time asymmetry underlies Penney's game, where the second player can always pick a pattern that beats the first.

</details>

### Exercise 5.4: Estimate the expected number of matches in the hat-check problem

**Task:** At a party, 10 guests check identical-looking hats and receive them back in a completely random order. Simulate 100,000 such nights by drawing a random permutation each time, count how many guests get their own hat back, and estimate the average number of matches. Save the mean to `ex_5_4`.

**Expected result:**

```
#> [1] 1.005
```

**Difficulty:** Intermediate

[HINTS]
A random assignment of hats to guests is just a random permutation; a match is a position where the permutation equals the identity.
Use `perm <- sample(1:10)` and count `sum(perm == 1:10)` inside `replicate()`.

```r title="Your turn"
set.seed(42)
ex_5_4 <- # your code here
ex_5_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)
matches <- replicate(100000, {
  perm <- sample(1:10)
  sum(perm == 1:10)
})
ex_5_4 <- round(mean(matches), 3)
ex_5_4
#> [1] 1.005
```

**Explanation:** The expected number of matches is exactly 1 no matter how many guests there are, and 1.005 confirms it. The clean way to see this is linearity of expectation: each guest recovers their own hat with probability $1/10$, and summing those ten probabilities gives 1, without ever untangling how the matches depend on each other. This decomposition trick, turning a hard joint question into a sum of easy marginal ones, is one of the most reused tools in interview probability.

</details>

## Section 6. Random walks, ruin, and infinite expectations (3 problems)

### Exercise 6.1: Simulate the gambler's ruin win probability

**Task:** A gambler starts with 3 dollars and bets 1 dollar per round on a fair coin, aiming to reach 10 dollars before going broke at 0. Simulate 50,000 such games as a random walk that stops at 0 or 10, and estimate the probability of reaching the 10-dollar target. Save the estimate to `ex_6_1`.

**Expected result:**

```
#> [1] 0.298
```

**Difficulty:** Intermediate

[HINTS]
Model the bankroll as a value that steps up or down by 1 each round and stop when it hits either boundary.
Use a `while (money > 0 && money < target)` loop with `money + ifelse(runif(1) < 0.5, 1, -1)`, then test `money == target`.

```r title="Your turn"
set.seed(42)
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)
ruin_game <- function(start = 3, target = 10, p = 0.5) {
  money <- start
  while (money > 0 && money < target) {
    money <- money + ifelse(runif(1) < p, 1, -1)
  }
  money == target
}
ex_6_1 <- round(mean(replicate(50000, ruin_game())), 4)
ex_6_1
#> [1] 0.298
```

**Explanation:** For a fair game the probability of hitting the target before ruin is simply the starting fraction of the way there, $k/N = 3/10 = 0.3$, matching the simulated 0.298. The elegant part is that the answer ignores the path entirely and depends only on the endpoints. It also explains why a small bankroll chasing a large target usually busts: starting at 3 out of 10, you reach the goal less than a third of the time even with perfectly fair odds.

</details>

### Exercise 6.2: Estimate the expected duration of the gambler's ruin

**Task:** Using the same fair game that starts at 3 dollars with a target of 10, count how many bets each game lasts before it ends at 0 or 10. Simulate 50,000 games, tracking the number of rounds until absorption, and estimate the average game length. Save the mean number of bets to `ex_6_2`.

**Expected result:**

```
#> [1] 20.99
```

**Difficulty:** Advanced

[HINTS]
This is the same random walk, but now you accumulate a step counter instead of a win flag.
Reuse the boundary `while` loop and increment `steps` on every bet, then average the counts.

```r title="Your turn"
set.seed(42)
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)
ruin_duration <- function(start = 3, target = 10, p = 0.5) {
  money <- start
  steps <- 0
  while (money > 0 && money < target) {
    money <- money + ifelse(runif(1) < p, 1, -1)
    steps <- steps + 1
  }
  steps
}
ex_6_2 <- round(mean(replicate(50000, ruin_duration())), 2)
ex_6_2
#> [1] 20.99
```

**Explanation:** The exact expected duration of a fair gambler's ruin is $k(N - k) = 3 \times 7 = 21$ bets, confirmed by 20.99. The formula is pleasingly symmetric: games starting near the middle of the range last longest, while games starting near a boundary end quickly. Interviewers pair this with the win-probability question because it shows two very different quantities, the chance of winning and the time it takes, can both come out of the same simple random walk.

</details>

### Exercise 6.3: Feel the St. Petersburg paradox through sample size

**Task:** In the St. Petersburg game a fair coin is flipped until the first tail; the payout is 1 dollar doubled once for every head before that tail. Simulate the average payout twice, first over 10,000 plays and then over 1,000,000 plays, and compare. Save both averages as a named vector in `ex_6_3`.

**Expected result:**

```
#> n_1e4 n_1e6 
#>  7.45 10.11
```

**Difficulty:** Advanced

[HINTS]
The payout is a power of two determined by the run of heads before the first tail, so a doubling loop captures one play.
Write `st_pete()` that doubles a payout while `sample(c("H", "T"), 1) == "H"`, then seed and average it at each sample size.

```r title="Your turn"
set.seed(42)
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
st_pete <- function() {
  payout <- 1
  while (sample(c("H", "T"), 1) == "H") payout <- payout * 2
  payout
}
set.seed(42)
avg_1e4 <- mean(replicate(1e4, st_pete()))
set.seed(42)
avg_1e6 <- mean(replicate(1e6, st_pete()))
ex_6_3 <- round(c(n_1e4 = avg_1e4, n_1e6 = avg_1e6), 2)
ex_6_3
#> n_1e4 n_1e6 
#>  7.45 10.11
```

**Explanation:** The theoretical expected payout is infinite, because a payout of $2^k$ occurs with probability $(1/2)^{k+1}$, so every term contributes $1/2$ to the sum forever. The simulation shows why that is not a bug: the average keeps climbing as you add plays (7.45 at ten thousand plays, 10.11 at a million), dragged up by rare enormous jackpots rather than settling down. It is the standard demonstration that a distribution with no finite mean has a sample average that never converges, which is why nobody would pay a large fixed fee to play despite the "infinite" expectation.

</details>

## What to do next

You have now simulated your way through the puzzles interviewers reach for most. Keep the momentum going with these related tutorials and exercise sets:

- [Conditional Probability in R](Conditional-Probability-in-R.html): the theory behind Monty Hall, the two-child problem, and Bertrand's box.
- [Bayes Theorem in R](Bayes-Theorem-in-R.html): turn the base-rate simulations into exact posterior calculations.
- [Binomial Distribution Exercises in R](Binomial-Distribution-Exercises-in-R.html): drill the coin-and-dice mechanics that power these simulations.
- [Bayesian Statistics Exercises in R](Bayesian-Statistics-Exercises-in-R.html): go deeper on updating beliefs with data.
