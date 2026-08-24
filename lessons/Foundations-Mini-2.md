---
title: "Expected value and variance, explained"
slug: "Foundations-Mini-2"
description: "A scratch card usually pays nothing and rarely pays 500 dollars. Work out what one card is really worth, then measure how far a real card lands from that."
keywords: "expected value, variance, standard deviation, expected value formula, variance formula, expected value in R, discrete random variable, standard error"
mathjax: true
webr: true
date: "2026-08-24"
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
catalog_blurb: "Work out what a bet is worth, and how rough the ride is."
---

=== step === cover
::eyebrow Probability Foundations
## Expected value and variance, explained

Let's say you are at your corner shop and there is a rack of scratch cards by the till. The one on the end costs \$2.

Most of the time it pays you nothing at all. About one card in seven pays \$5, and one card in a thousand pays \$500.

So is it a good deal?

You already suspect the answer, because the shop is not running a charity. Suspecting is not the same as knowing though, and the number that settles it is called the expected value.

Now here is the part people skip. Even when you know what a card is worth on average, you still do not know what buying one feels like. A card that pays back a little every time and a card that pays nothing for years and then hands you \$500 can be worth exactly the same on paper.

So how bumpy the ride is turns out to be a second question with a second answer, and that answer is variance.

That is one card with two numbers to find. Here is the plan.

::widget process-flow {"steps":[{"title":"List every payout and its chance","sub":"three rows: nothing, five dollars, five hundred dollars"},{"title":"Weigh them into one number","sub":"multiply each payout by its chance, then add"},{"title":"Measure the distance from that number","sub":"how far a real card usually lands from the average"}]}

We are going to build both numbers from scratch, out of dice and a few hundred thousand simulated cards. There is no calculus anywhere. And once you have them, insurance, casinos and a good chunk of statistics stop looking like separate subjects.

=== step === concept
## The card, its three payouts and their chances

Let's start by turning the card into a table. It needs three rows, one for each thing that can happen, with the payout in one column and how often it happens in the other.

Getting nothing at all is by far the most common result, at a chance of 0.859. A \$5 win comes up with chance 0.14, which is roughly one card in seven. The \$500 jackpot has chance 0.001, or one card in a thousand.

Those three chances have to add up to exactly 1, because one of the three things happens on every single card. Press Run and check.

```r
# Build the card's payout table and check the three chances add up to 1
card <- data.frame(
  payout = c(0, 5, 500),          # what the card pays back, in dollars
  chance = c(0.859, 0.14, 0.001)  # how often that payout happens
)

card
#>   payout chance
#> 1      0  0.859
#> 2      5  0.140
#> 3    500  0.001

sum(card$chance)
#> [1] 1
```

Everything that follows comes out of those six numbers, or out of cards drawn at random from them.

[NOTE]
I built this table rather than copying one off a real card, so the arithmetic stays clean. The one thing I did copy is the payout rate: it returns 60 cents of every dollar it takes, which is where real state-lottery scratch cards sit.

=== step === concept
## Why a die averages 3.5 when no face shows 3.5

Let's park the card for a minute and try the same move on something simpler, where you already know the answer.

Roll a fair die. Ask anybody what the average roll is and they will say 3.5, and they are right, even though no face of the die has 3.5 on it. An average outcome does not have to be an outcome you can actually get.

So where does 3.5 come from? Every face has chance 1/6, so you take each face, multiply it by 1/6, and add the six pieces together.

The code below does it twice. The first way rolls a real die a hundred thousand times and takes the plain average. The second way does the weighing by hand, with no rolling at all.

```r
# Roll a fair die 100,000 times and compare the average to the weighted sum
set.seed(1)
rolls <- sample(1:6, size = 1e5, replace = TRUE)

mean(rolls)
#> [1] 3.50549

sum((1:6) * (1/6))
#> [1] 3.5
```

`set.seed(1)` fixes which rolls you get, so your numbers match mine.

A hundred thousand real rolls averaged 3.50549. The weighing says 3.5 exactly. The two sit five thousandths apart, and the more you roll the closer they get.

That second line is the move we need for the card. Take every outcome, multiply it by how often it happens, add up what you get.

=== step === concept
## The expected value formula, in plain words

What you just did with the die has a name and a piece of notation, and both are plainer than they look.

The name is the expected value. Written down, for a quantity X that can land on several different values:

\[ E[X] = \sum_{x} x \cdot P(x) \]

Read it left to right in English. Go through every value x that X can take, multiply that value by its chance P(x), and add up everything you get. The big sigma is an instruction to add, nothing more.

One more piece of notation while we are here, because it turns up in every formula from now on. The expected value gets its own short name, the Greek letter mu, written \(\mu\). So \(\mu = E[X]\), and wherever mu shows up later it means that same number.

The die version was `sum((1:6) * (1/6))`. The card version is the same line with the card's own two columns in it.

```r
# Weigh each of the card's payouts by its chance and add the three pieces up
sum(card$payout * card$chance)
#> [1] 1.2
```

`card$payout * card$chance` multiplies the two columns row by row, and `sum()` adds the three results together. One line, and it is the formula above with nothing left out.

=== step === concept
## What one card is actually worth

That 1.2 is the answer to the question we started with, so it deserves more than one line.

Let's take it one row at a time. The \$500 jackpot contributes 500 times 0.001, which is 50 cents. The \$5 win contributes 5 times 0.14, which is 70 cents. The empty card contributes 0 times 0.859, which is nothing at all.

Add the three and you get \$1.20.

```r
# Work out what one card returns, row by row, and what is left over for the shop
contribution <- card$payout * card$chance
contribution
#> [1] 0.0 0.7 0.5

ev_card <- sum(contribution)
ev_card
#> [1] 1.2

2 - ev_card
#> [1] 0.8
```

Look at `contribution` first. Those three numbers, 0, 0.7 and 0.5, are what each row of the table is worth per card. Notice that the tiny 0.001 chance of \$500 still contributes 50 cents, more than a third of the card's whole value, because 500 is such a large number to be multiplying by.

Now the last line. You hand over \$2 and you get \$1.20 back, so the shop keeps 80 cents.

And that is not true of just some cards. It is every card, on average, forever. Sell fifty thousand cards and the shop has taken fifty thousand times 80 cents.

[KEY INSIGHT]
Expected value turns a bet into a decision. Set \$1.20 beside the \$2 you paid and the answer stops being a matter of opinion: the card costs 67% more than it gives back.

=== step === concept
## Watching the average settle over 100,000 cards

Right now \$1.20 is only something a formula told us. Let's watch it come true.

We are going to buy a hundred thousand cards, one after another, drawing each one at random from the same three rows. After every card we work out the average payout so far. If \$1.20 really is the long-run average, that running average has to settle on 1.20 and stay there.

The x axis of the plot is on a log scale, so the first handful of cards get as much room as the last ninety thousand. The red line sits at 1.20.

```r
# Buy 100,000 cards one at a time and watch the running average settle on 1.20
set.seed(53)
draws <- sample(card$payout, size = 1e5, replace = TRUE, prob = card$chance)
running_mean <- cumsum(draws) / seq_along(draws)

plot(running_mean, type = "l", log = "x", col = "grey40",
     main = "Average payout so far, after each card bought",
     xlab = "Cards bought", ylab = "Average payout in dollars")
abline(h = 1.20, col = "red", lwd = 3)

round(running_mean[c(100, 1000, 10000, 100000)], 3)
#> [1] 0.350 1.165 1.389 1.212
```

`sample()` with `prob = card$chance` is what makes this an honest card: it picks 0, 5 or 500 with exactly the chances in the table. `cumsum(draws) / seq_along(draws)` divides the running total by the running count, which is the average after each card.

Read the four printed numbers left to right. After 100 cards the average is 35 cents, nowhere near 1.20. After 1,000 cards it is 1.165. After 10,000 it has overshot to 1.389, and after 100,000 it is 1.212.

Now look at the line itself. Early on it jumps about, and every one of those jumps is a single \$500 card landing, while the slow slide between them is the long run of empty cards. As the count grows, the line stops caring about any one card and flattens onto the red one.

That is all "long-run average" means, and it is the only sense in which \$1.20 is true. It never was a statement about your card.

=== step === quiz
## Quick check: what does an expected value of 1.20 mean?

The running average settled onto \$1.20. Which sentence says what that number actually means?

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- It is the payout you are most likely to get from one card. ::no
- It is the average of the three payouts on the card, 0, 5 and 500, which comes to \$168.33. ::no
- It is the average payout per card across a long run of cards, the number the running average settled onto. ::ok That is it. It is a statement about a great many cards, never about the one in your hand.
- It is what each card gives back, so a \$2 card always returns \$1.20 of value. ::no Three of these describe something an expected value is not. The likeliest payout is \$0, which happens on 859 cards in a thousand. The plain average of 0, 5 and 500 ignores the chances completely. And a single card pays 0, 5 or 500, never 1.20. Expected value is the average across many cards, weighted by how often each payout turns up.

=== step === tryit
## Your turn: the expected value of a cheaper card

The shop also sells a \$1 card. It pays nothing 75% of the time, \$2 with chance 0.24, and \$50 with chance 0.01.

Work out what one of those is worth. It is the same move as before: weigh each payout by its chance and add. The two vectors are already there for you.

```r
# The cheaper card pays 0 at 0.75, 2 at 0.24 and 50 at 0.01
# Weigh each payout by its chance and add the three pieces up.
# One line. Press Check when you have it.
payout <- c(0, 2, 50)
chance <- c(0.75, 0.24, 0.01)
```
::check {"regex": "sum[(][^)]*payout[^)]*chance[^)]*[)]|sum[(][^)]*chance[^)]*payout[^)]*[)]", "gate": true, "difficulty": "beginner", "ok": "Right: \\$0.98. So a \\$1 card gives back 98 cents and loses you 2 cents a play. Beside the \\$2 card, which keeps 80 cents, this one is nearly a fair bet.", "no": "It is the same line as before with these two vectors dropped into it: `sum(payout * chance)`."}
::solution
```r
# The expected value of the cheaper card
sum(payout * chance)
#> [1] 0.98
```

0 times 0.75 is nothing, 2 times 0.24 is 48 cents, and 50 times 0.01 is 50 cents. Add them and you get 98 cents against a \$1 price.

=== step === concept
## Three cards with the same expected value

We have squeezed the card down to one number. Now let's see what that one number cannot tell you.

Imagine the shop stocks two more cards beside ours. The first is a strange one: it pays \$1.20 every single time, guaranteed, no scratching required. The second pays nothing four times out of five and \$6 the fifth time. The third is our jackpot card.

Work out the expected value of all three.

```r
# Three different cards, each worth the same amount per play
flat    <- data.frame(payout = 1.20,    chance = 1)
steady  <- data.frame(payout = c(0, 6), chance = c(0.8, 0.2))
jackpot <- card

c(flat    = sum(flat$payout * flat$chance),
  steady  = sum(steady$payout * steady$chance),
  jackpot = sum(jackpot$payout * jackpot$chance))
#>    flat  steady jackpot 
#>     1.2     1.2     1.2 
```

All three come out at exactly \$1.20.

And yet nobody would say these are the same card. The flat one is a coin you can put straight in your pocket. The steady one hands you \$6 on about one card in five. The jackpot one will very probably pay you nothing for years.

Expected value cannot tell them apart, because it was never built to. It answers how much, not how rough. Filling that gap needs a second number.

=== step === concept
## Variance: the weighted average of squared distances

We want a number that says how far a card usually lands from \$1.20. The obvious way to build one fails, and it is worth watching it fail.

The obvious way is this. Take each payout, measure its distance from 1.20, then average those distances the way we averaged the payouts themselves. An empty card sits 1.20 below. A \$5 card sits 3.80 above. A \$500 card sits 498.80 above.

Weigh those three distances by their chances and add them up. Watch what comes out.

```r
# Show that the plain distances from 1.20 cancel, then square them before weighing
mu <- sum(card$payout * card$chance)
distance <- card$payout - mu

sum(distance * card$chance)
#> [1] -1.110223e-16

data.frame(payout = card$payout, chance = card$chance,
           distance = distance, squared = distance^2,
           weighted = distance^2 * card$chance)
#>   payout chance distance   squared  weighted
#> 1      0  0.859     -1.2      1.44   1.23696
#> 2      5  0.140      3.8     14.44   2.02160
#> 3    500  0.001    498.8 248801.44 248.80144

sum(distance^2 * card$chance)
#> [1] 252.06
```

That first result, `-1.110223e-16`, is zero. R writes it that way because the arithmetic left a speck of rounding sixteen decimal places down, and the exact answer is 0.

It is not zero by luck either. It comes out zero for every table you will ever write, because the one big distance above the average is balanced exactly by all the small distances below it. That is what being the average means.

So plain distances are useless here: they always cancel. The fix is to square each distance first, which makes every one of them positive, and only then weigh by the chances. Dropping the minus signs instead would also have worked, and that quantity has a name, the mean absolute deviation. Squaring is the one that stuck, because squared distances add up neatly across many cards where plain ones do not, and we lean on that later.

Read the table across. The empty card sits 1.2 away, squares to 1.44, and 0.859 of that is 1.23696. The jackpot sits 498.8 away, squares to 248,801.44, and even one thousandth of that is 248.80144. Add the three weighted pieces and you land on 252.06.

That number is the **variance** of the card, written Var(X):

\[ \text{Var}(X) = \sum_{x} (x - \mu)^2 \, P(x) \]

Notice which row dominates. Nearly all of the 252.06 comes from the jackpot, the one outcome that almost never happens. Squaring is what does that: it makes a big distance count enormously more than a small one.

=== step === concept
## A shorter way to get the same variance

Building the variance that way works, and it shows you exactly what the quantity is. It is also more work than you need, because you have to find the average first and then walk the whole table a second time.

There is a one-pass version, and it is the one every textbook uses:

\[ \text{Var}(X) = E[X^2] - (E[X])^2 \]

In words: take the expected value of the squared payouts, then subtract the square of the expected value. It is the same two ingredients in the opposite order, and the two orders do not give the same answer. The gap between them is the variance.

Let's write both moves as small functions, since we are going to use them again and again.

```r
# Get the same variance in one pass: E of X squared, minus the square of E of X
ev <- function(x, p) sum(x * p)
variance <- function(x, p) sum(x^2 * p) - sum(x * p)^2

ev(card$payout^2, card$chance)
#> [1] 253.5

ev(card$payout, card$chance)^2
#> [1] 1.44

variance(card$payout, card$chance)
#> [1] 252.06
```

`ev(card$payout^2, card$chance)` squares the payouts before weighing them, which gives 253.5. Most of that is the jackpot again: 500 squared is 250,000, and a thousandth of that is 250.

The square of the expected value is 1.2 times 1.2, which is 1.44. Subtract, and 253.5 minus 1.44 is 252.06.

That is the same 252.06 we built by hand. Use whichever version you prefer. The shortcut is the one you will meet in books and in other people's code.

=== step === concept
## Standard deviation, or variance put back into dollars

There is a problem with 252.06. Ask what unit it is in and the answer is squared dollars, which is not a thing anybody has ever spent.

We squared the distances to stop them cancelling, so to read the answer back in money we undo the squaring and take the square root.

\[ \sigma = \sqrt{\text{Var}(X)} \]

That square root is the **standard deviation**, and it gets the Greek letter sigma, written \(\sigma\). That is the small sigma, not the big one that told you to add things up. The variance is then sigma squared, which is why you often see it written \(\sigma^2\).

Let's take the root for all three cards at once.

```r
# Put each card's variance back into dollars by taking its square root
swing <- c(flat    = sqrt(variance(flat$payout, flat$chance)),
           steady  = sqrt(variance(steady$payout, steady$chance)),
           jackpot = sqrt(variance(jackpot$payout, jackpot$chance)))
round(swing, 2)
#>    flat  steady jackpot 
#>    0.00    2.40   15.88 
```

All three cards share the same expected value of \$1.20, and all three have completely different standard deviations.

The flat card comes out at 0.00, which is exactly right: it pays \$1.20 every time, so it never lands any distance at all from its own average. No spread means no surprises. The steady card is \$2.40. The jackpot card is \$15.88.

Here is the \$15.88 in plain words. A typical card lands about \$15.88 away from \$1.20, which is roughly thirteen times the average it is supposed to be bouncing around.

To be exact about it, \$15.88 is not the plain average distance, since we squared before averaging and then unsquared at the end. It reads as a typical distance though, and that is how everybody uses it.

[KEY INSIGHT]
Expected value says where the middle is. Standard deviation says how far from the middle you should expect to land, in the same units as the outcome itself.

=== step === quiz
## Quick check: which card carries the most risk?

All three cards return \$1.20 a play. Their standard deviations are \$0.00 for the flat card, \$2.40 for the steady one and \$15.88 for the jackpot one. Which statement is right?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The jackpot card is the best deal of the three, because its \$500 prize gives it the highest expected value. ::no
- All three are worth the same per play, and the jackpot card is the riskiest to hold, because its outcomes land furthest from \$1.20. ::ok Exactly. The risk lives in the rare big payout, and it never shows up in the expected value at all.
- The flat card is the riskiest, because a guaranteed \$1.20 is less than the \$5 and \$500 the other two can pay. ::no
- The jackpot card must have a higher expected value than the flat card, since \$500 is so much larger than \$1.20. ::no All three expected values are identical at \$1.20, and that is what makes the comparison worth making. A big prize does not raise the expected value on its own, because its chance was cut to match. What a big prize does raise is the spread, and the standard deviation is the number that reports it.

=== step === tryit
## Your turn: the variance and standard deviation of the cheaper card

Back to the \$1 card: nothing at 0.75, \$2 at 0.24, \$50 at 0.01. You already found it is worth 98 cents a play.

Now find its variance with the one-pass formula, then take the square root to put the answer back into dollars. That is two lines.

```r
# The cheaper card pays 0 at 0.75, 2 at 0.24 and 50 at 0.01, and is worth 0.98 a play
# Variance is the expected value of the squared payouts minus the squared mean.
# Then take the square root for the typical swing.
# Two lines. Press Check when you have them.
payout <- c(0, 2, 50)
chance <- c(0.75, 0.24, 0.01)
```
::check {"regex": "sum[(][^)]*payout\\^2[^)]*chance[^)]*[)]", "gate": true, "difficulty": "beginner", "ok": "Yes: a variance of 25.00 and a standard deviation of \\$5.00 to the penny. A \\$1 card with a five-dollar swing, so the ride is five times the price of the ticket.", "no": "Square the payouts inside the weighing, then subtract the squared mean: `sum(payout^2 * chance) - sum(payout * chance)^2`. Wrap that in `sqrt()` for the second line."}
::solution
```r
# Variance and standard deviation of the cheaper card
var_small <- sum(payout^2 * chance) - sum(payout * chance)^2
var_small
#> [1] 24.9996

sqrt(var_small)
#> [1] 4.99996
```

`sum(payout^2 * chance)` comes to 25.96, almost all of it from the \$50 prize, and 0.98 squared is 0.9604. The difference is 24.9996, and its square root is 4.99996, which is \$5.00 for any purpose that matters.

=== step === concept
## What changes when you buy twenty cards

Nobody buys one card. So let's buy twenty and see what happens to our two numbers.

The expected payout is the easy half. Twenty cards at \$1.20 each is \$24, against \$40 spent. Expected values add, and they add whether or not the cards have anything to do with each other.

The spread is the half people get wrong. The tempting guess is that twenty cards means twenty times the swing, so twenty times \$15.88, which would be about \$317. It is nothing like that.

What adds is the variance, not the swing. Twenty cards that have no influence on each other, which is what independent means here, carry twenty times the variance between them. So 20 times 252.06 is 5041.2, and the swing is the square root of that.

Let's check that rule against reality. We buy twenty cards, add up what they pay, and repeat the whole thing ten thousand times.

```r
# Buy twenty cards, ten thousand times over, and look at the spread of the totals
set.seed(11)
batch20 <- replicate(10000, sum(sample(card$payout, size = 20,
                                       replace = TRUE, prob = card$chance)))

hist(batch20, breaks = 100, col = "grey85", border = "white",
     main = "Total payout from 10,000 batches of twenty cards",
     xlab = "Total payout in dollars")
abline(v = 24, col = "red", lwd = 3)

c(mean = mean(batch20), median = median(batch20), sd = sd(batch20))
#>     mean   median       sd 
#> 23.63050 15.00000 69.29067 

sum(batch20 >= 500)
#> [1] 191

sqrt(20 * variance(card$payout, card$chance))
#> [1] 71.00141

sqrt(variance(card$payout, card$chance) / 20)
#> [1] 3.55007
```

The ten thousand batches averaged \$23.63, near the \$24 we predicted. Their standard deviation came out at \$69.29 against the \$71.00 the rule predicted. Those agree, and the small gap is the simulation's own wobble, which shrinks if you run more batches. What it is definitely not is \$317.

Now look at the histogram. Almost all of it is one clump on the left, running from nothing to about \$50. Then comes a wide empty stretch. Then, out around \$500, a few bars so short you have to hunt for them, and those are the 191 batches in 10,000 that happened to contain a jackpot card.

That shape explains the two numbers underneath it. The median batch paid \$15, and the red line of the average sits at \$24, well to the right of where most batches land. Those 191 nearly invisible bars are dragging the average up on their own.

The last line points the same rule at the per-card average instead of the total. Divide the variance by 20 rather than multiplying, and the average payout per card has a swing of \$3.55, down from \$15.88 on a single card.

[KEY INSIGHT]
Totals and averages move in opposite directions. Buy n cards and the swing of the total grows with the square root of n, while the swing of the per-card average shrinks with the square root of n. Both come from one rule: variance adds, and the swing is its square root.

=== step === concept
## Why the shop and the insurer are not gambling

You now have everything you need to explain something that looks unfair and is not.

The buyer and the shop hold the same card, with the same \$1.20 expected value and the same \$15.88 swing. The only thing that differs is how many cards each of them sees.

A shop that sells 50,000 cards a week takes \$100,000 and expects to pay out \$60,000. Let's play one of those weeks out, card by card.

```r
# Play one week of 50,000 cards and compare the shop's profit with the expected 40,000
set.seed(9)
week <- sample(card$payout, size = 50000, replace = TRUE, prob = card$chance)

c(revenue = 2 * 50000, paid_out = sum(week), profit = 2 * 50000 - sum(week))
#>  revenue paid_out   profit 
#>   100000    60975    39025 

sqrt(50000 * variance(card$payout, card$chance))
#> [1] 3550.07

sqrt(variance(card$payout, card$chance) / 50000)
#> [1] 0.07100141
```

The week paid out \$60,975 against an expected \$60,000, and the shop cleared \$39,025.

Now put the two swings beside that. Across the whole week the swing of the total is \$3,550, which sounds like a lot until you set it against a \$40,000 edge: zero profit sits more than eleven swings away, and an eleven-swing miss is not something that happens.

The second number is the per-card swing, 7 cents. The buyer's per-card swing is \$15.88 and the shop's is 7 cents, on the very same card. Volume is the entire difference between them.

An insurance company runs this table backwards. It collects a small certain amount from you, the premium, and takes your rare large payout off your hands in exchange. You hand over a swing you could not absorb, and the insurer adds it to a hundred thousand others and watches it shrink into one it can.

[NOTE]
That is the whole business model, and it is why "the house always wins" is a sloppy way to put it. The house does not win every card. It wins because it holds enough cards that the average is the only thing left standing.

=== step === concept
## The two numbers behind every estimate you compute

One more move and these two numbers stop being about scratch cards at all.

Anything you compute from a random sample is itself random. Take a different sample and you get a different answer. So the number you computed, whether it is a mean or a proportion or a regression coefficient, is a random quantity in its own right, and every random quantity has an expected value and a standard deviation.

The average payout of 25 cards is exactly that kind of number. Let's buy 25 cards, write down the average, and do it two thousand times over.

```r
# Buy 25 cards, record the average payout, and repeat two thousand times
set.seed(21)
card_means <- replicate(2000, mean(sample(card$payout, size = 25,
                                          replace = TRUE, prob = card$chance)))

c(mean_of_means = mean(card_means), spread = sd(card_means),
  rule = sqrt(variance(card$payout, card$chance) / 25))
#> mean_of_means        spread          rule 
#>      1.215900      3.191567      3.175280 
```

That gives two thousand estimates of the same thing. They average to 1.2159, close to the \$1.20 they are all aiming at, and that is what it means to say an estimate has an expected value.

Their spread is 3.19 and the rule predicted 3.175. That prediction is just \$15.88 divided by the square root of 25, which is 5.

\[ \text{SD of the sample mean} = \frac{\sigma}{\sqrt{n}} \]

That quantity has a name you already use every week. It is the **standard error** of the mean. Every standard error you have ever read off a model summary is this: the standard deviation of an estimate, shrinking with the square root of the sample size.

And that settles every sample-size argument you will ever have. To halve a standard error you do not need twice the data, you need four times as much, because the square root of 4 is 2.

=== step === quiz
## Quick check: the shop doubles the jackpot

The shop reprints the card. The top prize moves from \$500 at chance 0.001 to \$1,000 at chance 0.0005, and the \$5 row is left untouched at 0.14. What happens to the two numbers?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- Both of them go up, since the biggest payout on the card has doubled. ::no
- The expected value doubles to \$2.40 and the variance is unchanged at 252.06. ::no
- The expected value stays at \$1.20 and the variance almost doubles, from 252.06 to 502.06. ::ok Right. 1,000 times 0.0005 is the same 50 cents that 500 times 0.001 gave, so the card is worth what it always was. Squaring is what breaks the tie: 1,000 squared is four times 500 squared, and only half as many cards win it, so that term doubles.
- The expected value stays at \$1.20 and the variance is unchanged too, since nothing was added or taken away overall. ::no Work the two formulas separately and it comes apart cleanly. The expected value uses each payout once, and 1,000 at 0.0005 contributes the same 50 cents that 500 at 0.001 did, so \$1.20 stands. The variance uses each payout squared, and squaring does not survive the trade: the new jackpot is worth four times as much per win at half the win rate, so the variance climbs to 502.06. The same card on paper, twice as wild in the hand.

=== step === quiz
## Quick check: buying a hundred cards

You buy a hundred of the original cards in one go, at \$2 each. One card is worth \$1.20 with a standard deviation of \$15.88. Which line is right about the hundred?

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- The expected total payout is \$120, the swing of the total grows tenfold to about \$158.80, and the swing of the per-card average shrinks tenfold to about \$1.59. ::ok Yes, and the tenfold in both directions is the square root of 100. That one fact is why a standard error carries a root n underneath it.
- The expected total payout is \$120 and the swing of the total grows a hundredfold, to \$1,588. ::no
- The expected total payout is \$120 and the swing of the total is unchanged at \$15.88, since the card itself has not changed. ::no
- The expected total payout is \$120, and the total swing and the per-card average swing both shrink, because more cards means less risk. ::no Expected values multiply straight through: a hundred cards at \$1.20 is \$120. Swings do not. It is the variance that multiplies by 100, so the swing of the total is the square root of that, ten times \$15.88, or about \$158.80. The per-card average goes the other way and shrinks by the same ten, to \$1.59.

=== step === tryit
## Your turn: price a card that keeps forty cents

The shop wants a new card and has two payout tables to choose between. Whichever one it picks, it will price the card at its expected value plus 40 cents, so the shop keeps 40 cents a sale either way.

Card A pays nothing at 0.70, \$3 at 0.28 and \$20 at 0.02. Card B pays nothing at 0.795, \$2 at 0.20 and \$100 at 0.005.

There is one more condition. The owner will not print a card whose swing goes past \$6, because a card that pays nothing for months is a card people stop buying.

Work out the expected value and the standard deviation of each table, price them both, and say which one the shop should print.

```r
# Card A pays 0 at 0.70, 3 at 0.28 and 20 at 0.02; card B pays 0 at 0.795, 2 at 0.20 and 100 at 0.005
# Find the expected value and the standard deviation of each card,
# add 40 cents to each expected value to get its price,
# and pick the card whose standard deviation stays under 6.
# Press Check when you have it.
a_payout <- c(0, 3, 20)
a_chance <- c(0.70, 0.28, 0.02)
b_payout <- c(0, 2, 100)
b_chance <- c(0.795, 0.20, 0.005)
```
::check {"regex": "^(?=[\\s\\S]*sqrt[(])(?=[\\s\\S]*a_payout\\^2)", "gate": true, "difficulty": "intermediate", "ok": "That is the one. Card A is worth \\$1.24 with a \\$3.00 swing, so it prices at \\$1.64. Card B is worth 90 cents with a \\$7.07 swing, so it prices at \\$1.30 and breaks the six-dollar rule. Print card A.", "no": "Two computations per card, the same pair you have used the whole way through: `sum(payout * chance)` for the expected value, then `sqrt(sum(payout^2 * chance) - sum(payout * chance)^2)` for the swing. Do it for the a_ vectors, then again for the b_ vectors."}
::solution
```r
# Expected value, swing and price for both candidate cards
ev_a <- sum(a_payout * a_chance)
sd_a <- sqrt(sum(a_payout^2 * a_chance) - ev_a^2)

ev_b <- sum(b_payout * b_chance)
sd_b <- sqrt(sum(b_payout^2 * b_chance) - ev_b^2)

round(c(ev_a = ev_a, sd_a = sd_a, price_a = ev_a + 0.40), 2)
#>    ev_a    sd_a price_a 
#>    1.24    3.00    1.64 

round(c(ev_b = ev_b, sd_b = sd_b, price_b = ev_b + 0.40), 2)
#>    ev_b    sd_b price_b 
#>    0.90    7.07    1.30 
```

Card B looks like the cheaper ticket at \$1.30, and it is the one to turn down. Its \$100 prize pushes the swing to \$7.07, past the owner's limit, and almost all of that comes from a prize one buyer in two hundred will ever see.

Card A costs more and behaves better: \$1.64 a card, a \$3.00 swing, and the shop keeps its 40 cents either way.

=== step === concept
## References

- [Introduction to Probability, chapter 6: Expected Value and Variance](https://math.dartmouth.edu/~prob/prob/prob.pdf) - Grinstead and Snell, 2nd revised edition, American Mathematical Society. The free full text. Chapter 6 defines both quantities and proves that variance adds over independent variables.
- [Introduction to Probability, chapter 4: Expectation](https://probabilitybook.net/) - Blitzstein and Hwang, 2nd edition, CRC Press, free full text from the authors. Chapter 4 works through the chance-weighted-average reading and the one-pass variance identity.
- [18.05 Introduction to Probability and Statistics, readings: Variance of Discrete Random Variables](https://ocw.mit.edu/courses/18-05-introduction-to-probability-and-statistics-spring-2022/pages/readings/) - MIT OpenCourseWare. Reading notes and worked class problems on exactly the two-formula comparison.
- [Correlation, Variance and Covariance](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/cor.html) - R Core Team, the documentation for var(). Worth reading for one detail: R divides by n minus 1, not n, so var() on a column of data is not quite the same computation as the variance of a table of chances.

=== step === complete
## Quick recap

You started with a \$2 scratch card and built the two numbers that answer the two different questions people ask about it.

- Expected value is the chance-weighted average payout: multiply every payout by its chance and add. Our card came to \$1.20, which is what makes \$2 a bad price and 80 cents a card a business.
- An average outcome does not have to be an outcome. No card pays \$1.20 and no die face shows 3.5.
- Variance is the same weighing done on squared distances from the average, squared because the plain distances always cancel to zero. Ours is 252.06.
- Standard deviation is that variance put back into dollars, \$15.88 for our card. Same \$1.20 as a card that pays \$1.20 every time, and a completely different thing to hold.
- Totals add and swings do not. Buy n cards and the swing of the total grows by the square root of n while the swing of the per-card average shrinks by the square root of n. That root n is the same one sitting under every standard error you read.

So the next time somebody puts a price and a table of payouts in front of you, you have both halves of the answer: what it is worth, and how rough the ride there is going to be.

That is the shop's whole edge, and now it is yours too. Have a great day!
