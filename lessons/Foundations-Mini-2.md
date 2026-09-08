---
title: "Expected value and variance, explained"
slug: "Foundations-Mini-2"
description: "Expected value tells you what a bet pays on average; variance tells you how far one result can land from it. Build both from a scratch card and simulations."
keywords: "expected value, variance, probability, scratch card, R, simulation, risk"
mathjax: true
webr: true
date: "2026-09-09"
post_type: "LESSON"
course_id: "foundations-extras"
course_title: "Probability Foundations"
course_lesson: "2"
course_total: "6"
course_landing: "/dashboard.html"
course_prev: "Foundations-Mini-1"
course_next: ""
curriculum_id: "0.0.16"
lesson_access: "windowed"
catalog_blurb: "Learn the two numbers that tell you what a bet is really worth."
---

=== step === cover
## Expected value and variance, explained

Today we are going to work out expected value and variance, the two numbers that tell you what a bet is really worth, and how much its result can swing around that number.

A gas station sells a scratch card for \$2. Wipe off the panel and you get one of three results: nothing, \$5, or a \$500 top prize.

Nothing turns up on about 8 out of 10 cards. The \$5 shows up on about 1 in 5. The \$500 top prize lands on roughly 1 in 1,000.

Buy one, and is it worth it? That is the first thing to work out.

There is a second question sitting right behind it. Two bets can share the exact same average payout and still feel nothing alike to play, one steady, one wild. Telling those two apart is the second thing to work out.

Press the buttons below and watch a computer play this exact card, over and over. Watch how rarely that top prize actually shows up, even after hundreds of tries.

::widget luck-simulator {"trials": 1, "p": 0.001, "observed": 1, "unit": "top prize wins"}

Notice how many tries it takes before that top prize shows up even once. Rare wins like that are exactly why you cannot judge this card by its best possible outcome alone.

=== step === concept
## What expected value means for the scratch card

Start by writing the card down in R terms: every payout it can pay, and how often each one happens.

```r
# Define the scratch card's payouts and their probabilities
card_vals <- c(0, 5, 500)
card_probs <- c(0.799, 0.2, 0.001)
```

`card_vals` holds the three amounts the card can pay: \$0, \$5, and \$500. `card_probs` holds how often each one happens, in that same order: 79.9%, 20%, and 0.1%.

Expected value takes each payout, multiplies it by how often it happens, and adds the results together. It is a probability-weighted average: the more likely an outcome is, the more it counts toward the total.

$$E[X] = \sum_{i} x_i \cdot P(X = x_i)$$

Each \(x_i\) is one payout, and \(P(X = x_i)\) is that payout's own probability. For the scratch card, there are three payouts, so three terms to add:

$$E[X] = 500(0.001) + 5(0.2) + 0(0.799) = 0.5 + 1 + 0 = 1.5$$

In R, that whole sum is one line.

```r
# Expected value: each payout times its own probability, summed
sum(card_vals * card_probs)
#> [1] 1.5
```

\$1.50. That is the expected value of the card. On average, every \$2 you spend on it comes back as \$1.50, a 25% expected loss.

[KEY INSIGHT]
Expected value is not a payout you will ever see on one card. This card only ever pays \$0, \$5, or \$500. \$1.50 is the number those three payouts average to if you played the card forever.

=== step === widget
## Simulating many scratch cards

\$1.50 is the theoretical answer, worked out from the formula. Does it actually hold up if you deal out real cards? Simulation is how you check.

The widget below plays this exact card, one draw at a time. Its chance of hitting is set to the card's own 20% probability of paying exactly \$5, so every click is one real card decided by that same 0.2 chance.

::widget luck-simulator {"trials": 1, "p": 0.2, "observed": 1, "unit": "five dollar payouts"}

Click Run 1,000 a few times. The running percentage bounces around early on, then settles in close to 20%, which is exactly `card_probs[2]`, the probability you set for the \$5 payout.

The same idea works in R directly. Draw 5,000 cards from the same distribution, using the payouts and probabilities you already defined, and compare the sample average against the theoretical \$1.50.

```r
# Simulate 5000 scratch cards and compare the sample average to the theoretical 1.5
set.seed(1)
card_draws <- sample(card_vals, size = 5000, replace = TRUE, prob = card_probs)

mean(card_draws)
#> [1] 1.448
```

The simulated average landed at \$1.448 against a theoretical \$1.50, close but not exact. 5,000 cards is not infinite, and this card's occasional \$500 win swings the average around more than a card without a big rare prize would. Run more cards, real or simulated, and that gap keeps shrinking.

::quiz {"correct": 1, "gate": true, "difficulty": "beginner"}
- Because with enough cards, the share that pays exactly \$5 converges toward its true probability, 0.2. ::ok Exactly. This is the law of large numbers: the more draws you take, the closer the observed share of an outcome lands to its real probability. It says nothing about what any single card will do.
- Because after a run of \$0 results, a \$5 payout becomes overdue. ::no
- Because 20% is close to the card's \$1.50 expected value, so most cards should land near that number. ::no
- Because the simulator drifts toward whichever result it produced first. ::no The fraction settles near 20% because of the law of large numbers, not because of streaks, luck owed, or an anchor to the first result. Each card is an independent draw from the same three probabilities every time, and more draws just make the observed share a better estimate of the true 0.2.

=== step === concept
## Why the average alone can mislead

\$1.50 tells you what this card returns on average. It does not tell you what any one card actually pays. This card only ever pays \$0, \$5, or \$500, never \$1.50.

So the average alone leaves out something important: how far a typical result sits from that average. A card that always paid exactly \$1.50 and a card that pays \$0 most of the time but occasionally hands you \$500 can share the exact same expected value and still feel completely different to hold in your hand.

That gap, how far outcomes tend to sit from the mean, is what variance measures.

Variance is the average of the squared distance between each outcome and the mean. It is squared so that a payout below the mean and a payout above the mean do not cancel each other out.

A \$500 win sits \$498.50 above the mean, and a \$0 result sits \$1.50 below it. Left unsquared, those distances could offset each other and hide exactly the spread you are trying to measure. Squared, every distance adds to the total no matter which direction it points.

=== step === concept
## The variance formula, worked by hand

Squaring every distance from the mean and averaging it works, but there is a shortcut that skips computing each individual distance first.

$$\text{Var}(X) = E[(X - \mu)^2] = E[X^2] - (E[X])^2$$

Here \(\mu\) is the mean, the same \(E[X]\) you already computed. \(E[X^2]\) is new: take each payout, square it, multiply by its own probability, and add those up. It is the same probability-weighted average as before, just applied to the squared payouts instead of the payouts themselves.

For the scratch card:

$$E[X^2] = 500^2(0.001) + 5^2(0.2) + 0^2(0.799) = 250 + 5 + 0 = 255$$

$$\text{Var}(X) = 255 - 1.5^2 = 255 - 2.25 = 252.75$$

Now compare that against a steadier \$2 card, one that pays either \$1 or \$2, each with equal 50% probability.

$$E[X] = 1(0.5) + 2(0.5) = 1.5$$

This is the same \$1.50 average as the scratch card. But watch its variance:

$$E[X^2] = 1^2(0.5) + 2^2(0.5) = 0.5 + 2 = 2.5$$

$$\text{Var}(X) = 2.5 - 1.5^2 = 2.5 - 2.25 = 0.25$$

Define the steadier card in R next to the scratch card, and compute both variances with the shortcut formula in one block.

```r
# Compute variance for both cards with the shortcut formula: E[X^2] - (E[X])^2
steady_vals <- c(1, 2)
steady_probs <- c(0.5, 0.5)

card_var <- sum(card_vals^2 * card_probs) - sum(card_vals * card_probs)^2
steady_var <- sum(steady_vals^2 * steady_probs) - sum(steady_vals * steady_probs)^2

c(card_var = card_var, steady_var = steady_var)
#>   card_var steady_var 
#>     252.75       0.25 
```

Both cards share the same \$1.50 mean. But their variances are 252.75 against 0.25, a thousand-fold difference. The scratch card's occasional \$500 win, rare as it is, drags that number up enormously. The shortcut formula squares every distance from the mean, and \$500 is a very long way from \$1.50.

=== step === widget
## Same average, very different variance

Run the steadier card through the same kind of simulator, and the difference between 252.75 and 0.25 stops being just two numbers on a page.

This time the chance of a hit is set to 0.5, the steadier card's own probability of landing on its higher payout, \$2.

::widget luck-simulator {"trials": 1, "p": 0.5, "observed": 1, "unit": "two dollar payouts"}

Click Run 1,000 a few times and watch the running percentage settle near 50%, not 20%. Every other card, roughly, pays \$2 instead of \$1.

Put the two widgets side by side in your head. The scratch card's \$5 result showed up close to one time in five, and its \$500 win was rare enough that you may not have seen it at all.

The steadier card's higher payout, \$2, turns up about every other card. Both cards average \$1.50.

One of them wanders far from that average on a regular basis. The other barely leaves it. That difference is exactly what the variance numbers, 252.75 against 0.25, were describing before you watched it happen.

=== step === quiz
## Reading variance: which card is the risky one

Both cards cost \$2. Both average \$1.50 back. By the mean alone, they look identical. But you have now watched both of them run: one settling calmly near its \$2 payout half the time, the other swinging between a common \$0, an occasional \$5, and a rare \$500.

Variance is the number that tells you which one is riskier before you ever have to watch it play out. The scratch card's variance is 252.75. The steadier card's is 0.25.

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- The scratch card is riskier. Its variance, 252.75, is far larger than the steadier card's 0.25, meaning its outcomes typically sit much further from the \$1.50 average. ::ok Right. Same mean, wildly different variance. A larger variance means outcomes routinely land far from the average, which is exactly the scratch card's mostly-\$0, rarely-\$500 pattern. The steadier card almost never strays from \$1.50 by more than fifty cents.
- The steadier card is riskier, because its payout changes on almost every single card. ::no
- Neither card is riskier than the other, since both average \$1.50. ::no
- The scratch card is riskier simply because \$500 is a large number. ::no The size of one payout, on its own, does not decide risk. Variance measures how far outcomes typically sit from the mean, weighted by how likely each one is. The steadier card's payout changes every card too, but only by fifty cents from the mean each time, which is why its variance stays tiny at 0.25 against the scratch card's 252.75.

=== step === tryit
## Your turn: a raffle ticket

One more payout, this time you do the work. A \$5 raffle ticket pays \$0 with probability 0.9, \$20 with probability 0.08, or \$200 with probability 0.02.

Define its payouts and probabilities, then compute E[X] and Var(X) with the same shortcut formula you just used twice. Finish by simulating 5,000 tickets to check your numbers.

```r
# A $5 raffle ticket: define its payouts and probabilities, then find E[X] and Var(X)
raffle_vals <- c(0, 20, 200)
raffle_probs <- c(0.9, 0.08, 0.02)

# Compute E[X] and Var(X) here using the shortcut formula


# Simulate 5000 tickets to check your answer
set.seed(2)
raffle_draws <- sample(raffle_vals, size = 5000, replace = TRUE, prob = raffle_probs)
```
::check {"regex": "(?=[\\s\\S]*raffle_vals\\s*\\*\\s*raffle_probs)(?=[\\s\\S]*raffle_vals\\s*\\^\\s*2)", "gate": true, "difficulty": "intermediate", "ok": "Both numbers check out: E[X] = 5.6, Var(X) = 800.64. The ticket costs 5 dollars and returns 5.60 back on average, just barely worth it before you even weigh the risk.", "no": "Use the same shortcut you used for the two cards: sum(raffle_vals * raffle_probs) for E[X], then sum(raffle_vals^2 * raffle_probs) minus E[X] squared for the variance."}
::solution
```r
# Solve the raffle ticket with the shortcut formula, then simulate to check it
raffle_vals <- c(0, 20, 200)
raffle_probs <- c(0.9, 0.08, 0.02)

raffle_mean <- sum(raffle_vals * raffle_probs)
raffle_var <- sum(raffle_vals^2 * raffle_probs) - raffle_mean^2

c(mean = raffle_mean, variance = raffle_var)
#>     mean variance 
#>     5.60   800.64 

set.seed(2)
raffle_draws <- sample(raffle_vals, size = 5000, replace = TRUE, prob = raffle_probs)
c(sample_mean = mean(raffle_draws), sample_var = var(raffle_draws))
#> sample_mean  sample_var 
#>      6.0920    884.1044 
```

The theoretical numbers: a \$5.60 expected return on a \$5 ticket, and a variance of 800.64, even bigger than the scratch card's 252.75, because \$200 sits even further from the mean than \$500 did on the cheaper card.

5,000 tickets is a lot, but with a variance this large, do not expect a razor-exact match. The sample mean landed at \$6.09 and the sample variance at 884.10, both in the right neighborhood but visibly bouncing around the theoretical \$5.60 and 800.64. That bounce is not a mistake in the code. It is variance itself, doing exactly what a variance of 800.64 predicts a few thousand draws should look like.

=== step === concept
## References

- [All of Statistics: A Concise Course in Statistical Inference](https://doi.org/10.1007/978-0-387-21736-9) - Wasserman, L. (2004), Springer Texts in Statistics, Chapter 3: Expectation.
- Casella, G. and Berger, R., *Statistical Inference* (2nd ed., 2002), Section 2.2: Expected Values.
- Wackerly, D., Mendenhall, W., and Scheaffer, R., *Mathematical Statistics with Applications* (7th ed.), Chapter 4: Mathematical Expectation.
- [Random Samples and Permutations](https://stat.ethz.ch/R-manual/R-devel/library/base/html/sample.html) - R Core Team, the documentation for `sample()`.
- [Sample Variance](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/var.html) - R Core Team, the documentation for `var()`.
- Khan Academy, "Expected value" and "Variance of a random variable" units, Statistics and Probability course.

=== step === complete
## What expected value and variance tell you together

These two cards lead to one shared takeaway. Both the scratch card and the steadier card cost \$2. Both average \$1.50 back, a 25% expected loss either way. On the mean alone, they are identical.

| | Expected value | Variance |
|---|---|---|
| Scratch card (\$0 / \$5 / \$500) | \$1.50 | 252.75 |
| Steadier card (\$1 / \$2) | \$1.50 | 0.25 |

Expected value answers "what does this pay on average." Variance answers a completely different question: "how far can a single result land from that average."

Neither number can stand in for the other. A payout described only by its mean hides whether it is calm or wild. A payout described only by its variance says nothing about whether it is worth playing in the first place.

Read together, they describe a payout completely. \$1.50 and 252.75 tell you the scratch card returns fifty cents less than you paid, on average, and that any one card can land almost anywhere from \$0 to \$500. \$1.50 and 0.25 tell you the steadier card returns that same fifty cents less on average, but almost never surprises you along the way.

Whenever you meet a new payout, whether it is a bet, a business decision, or a model's prediction, ask for both numbers before you judge it. The average alone does not tell you everything.
