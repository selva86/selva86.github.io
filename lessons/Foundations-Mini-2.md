---
title: "Expected value and variance, explained"
slug: "Foundations-Mini-2"
description: "A $2 scratch card usually pays nothing and rarely pays $500. Build expected value and variance from that one card, and see why the corner shop never worries."
keywords: "expected value, variance, standard deviation, expected value in R, variance in R, probability weighted average, expected value of a bet, insurance and variance"
mathjax: false
webr: true
date: "2026-08-21"
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
catalog_blurb: "What a bet is worth on average, and how much it swings."
---

=== step === cover
::eyebrow Probability Foundations
## Expected value and variance, explained

Ravi stops at the corner shop near his flat most evenings, and tonight he picks up a scratch card for $2.

The odds are printed in small type on the back. Almost every card pays nothing at all. One card in ten pays $5, and two cards in every thousand pay $500.

So is it a good deal?

Now, that question actually splits into two, and most people only ever ask the first half.

The first half is what the card is worth. If Ravi scratched cards all evening, what would one card pay him on average? That number is called the expected value, and the shop worked it out long before Ravi walked in. The shop is not running a charity.

The second half is what the evening feels like. Think of a card that hands you $1.50 every single time, and next to it the card Ravi is holding, which pays nothing almost always and $500 once in a very long while. On average those two are worth exactly the same. Sitting through them is nothing alike. That gap is called the variance.

Insurance runs on these two numbers. So do casinos, and so does every estimate you will ever compute from data.

So we are going to build both of them ourselves, out of the card in Ravi's hand, using dice and simulations and no calculus anywhere.

There are three moves to it.

::widget process-flow {"steps":[{"title":"Read the payout table","sub":"every payout on the card sits next to its chance"},{"title":"Weight and add","sub":"multiply each payout by its chance, then add them up"},{"title":"Measure the swing","sub":"how far a card lands from that average, on average"}]}

That is the whole plan. Everything from here is just doing it, one number at a time.

=== step === concept
## What the card actually pays

Before we can work anything out, the odds on the back of the card have to become something R can hold.

A payout table is the simplest way to do that. It is every outcome the card can produce, sitting next to the chance of that outcome. Three rows is all this card needs.

Press Run.

```r
# Put the odds printed on the back of the card into a table R can work with
card <- data.frame(
  payout = c(0, 5, 500),
  chance = c(0.898, 0.100, 0.002)
)

card
#>   payout chance
#> 1      0  0.898
#> 2      5  0.100
#> 3    500  0.002

sum(card$chance)
#> [1] 1
```

Read the rows as sentences. A card pays nothing 89.8% of the time, pays $5 ten percent of the time, and pays $500 two times in every thousand.

The last line is worth a moment. The chances add up to exactly 1, which is the arithmetic way of saying that one of these three things definitely happens. Every card does something, even if the something is nothing.

[NOTE]
If the chances in a payout table do not add to 1, either an outcome is missing or one of the numbers is wrong. It is the first thing to check and it takes one line.

=== step === concept
## Buying a hundred thousand cards

The brute force way to find out what a card is worth is to buy an awful lot of them and see what comes back.

Ravi cannot do that. R can. The `sample()` function draws payouts from the table over and over, using the `prob` argument so that each row comes up as often as its chance says it should.

So let's buy a hundred thousand cards.

```r
# Buy a hundred thousand of these cards and see what the average card pays
set.seed(9)
draws <- sample(card$payout, size = 1e5, replace = TRUE, prob = card$chance)

table(draws)
#> draws
#>     0     5   500
#> 89854  9945   201

mean(draws)
#> [1] 1.50225
```

`set.seed(9)` fixes which hundred thousand cards you get, so your numbers match mine. `1e5` is R's shorthand for 100,000.

Look at the counts first. 89,854 of the cards were duds, 9,945 paid $5, and 201 of them paid $500. That is what the odds on the back look like when you actually play them out.

Now let's look at the money. Pool everything those cards paid, share it across all hundred thousand of them, and one card comes to $1.50 and a fifth of a cent.

So a $2 card gives back about a dollar fifty. Hold that thought, because we have not paid for anything yet.

=== step === concept
## Where the $1.50 comes from without buying a card

Buying a hundred thousand cards worked, but it was a lot of effort for a number the shop could have read straight off the table.

Here is the shortcut. Take each payout, multiply it by the chance of getting it, and add up the results. That is the whole method.

```r
# Work out the average payout straight from the table, one row at a time
card$payout * card$chance
#> [1] 0.0 0.5 1.0

sum(card$payout * card$chance)
#> [1] 1.5
```

The first line lays the idea out in the open. The dud row contributes nothing. The $5 row contributes 5 times 0.100, which is 50 cents. The $500 row contributes 500 times 0.002, which is a whole dollar.

Add those three contributions and you get $1.50, the same number a hundred thousand simulated cards took the long way round to reach.

Notice what the multiplying does. The $500 prize is enormous, but it turns up so rarely that it only earns a dollar of influence over the answer. A payout gets a say in proportion to how often it shows up.

[KEY INSIGHT]
The expected value of something random is every outcome multiplied by its chance, all added up. In R that is one line: `sum(payout * chance)`. It is the long-run average of the thing, worked out on paper instead of by playing it.

=== step === concept
## Is a $2 card worth $2?
::prose-only one subtraction from the payout table already on screen

We now know what a card pays: $1.50 on average. We also know what a card costs: $2.

So put the two together. Ravi hands over $2 and gets back $1.50 in the long run, which leaves him 50 cents down on every card he ever buys.

That 50 cents is not a bad-luck story. It is the design. The shop chose the payouts and the odds so that a quarter of every dollar crossing the counter stays behind, and no amount of scratching changes it.

Buy one card an evening for a year and the arithmetic is 365 times 50 cents, which is $182.50 handed over for the fun of scratching.

That is what an expected value is for. It turns a page of odds into one number you can hold up against a price.

=== step === concept
## A fair die never lands on 3.5

There is one thing about expected values that catches almost everybody, and a die shows it faster than a scratch card does.

A fair die has six faces, each with a one in six chance. So let's put it in a payout table exactly like the card, then roll it a hundred thousand times to check.

```r
# A fair die as a payout table, averaged two ways
die <- data.frame(face = 1:6, chance = rep(1/6, 6))

sum(die$face * die$chance)
#> [1] 3.5

set.seed(2)
rolls <- sample(1:6, size = 1e5, replace = TRUE)
mean(rolls)
#> [1] 3.50625
```

The table says 3.5. A hundred thousand real rolls say 3.50625. They agree.

However, no die has ever landed on 3.5, and no die ever will. The faces are 1, 2, 3, 4, 5 and 6, and 3.5 is not among them.

So an expected value is not a prediction of what happens next. It is the balance point of all the outcomes, the place where the whole table would sit still if you laid it across a seesaw.

The scratch card works the same way. It pays 0, or 5, or 500. It never pays $1.50. That number is where a long pile of cards balances, not something you can hold in your hand.

[KEY INSIGHT]
An expected value is usually a number that no single outcome can produce. It answers "what does this average out to", never "what will I get".

=== step === quiz
## Quick check: what does a $1.50 average promise you?

Ravi is about to scratch one card, and he knows the average payout is $1.50. Which of these sentences is he actually allowed to say?

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- Most cards pay somewhere around $1.50. ::no
- $1.50 is the likeliest payout, so it is the sensible thing to expect from this card. ::no
- Nothing at all about this card. It says that across a long run of cards the money works out to about $1.50 each. ::ok That is the honest reading. The average lives in the long run, and the card in Ravi's hand knows nothing about it.
- After 100 cards Ravi is guaranteed to have $150 back. ::no None of those three hold up. The card only ever pays 0, 5 or 500, so no card pays around $1.50, and the likeliest payout by a mile is nothing at all, at 89.8%. Nor is anything guaranteed over 100 cards: an average is what a long run tends towards, not a promise about any particular stack.

=== step === tryit
## Your turn: the shop across the road

The shop across the road sells a different card for $3. It pays nothing 90% of the time, $10 nine percent of the time, and $200 one percent of the time.

The table is already built below. Work out what one of those cards pays on average, then take off the $3 price to see what Ravi is really handing over.

```r
# The rival card: costs $3, pays 0 at 90 percent, 10 at 9 percent, 200 at 1 percent
rival <- data.frame(
  payout = c(0, 10, 200),
  chance = c(0.90, 0.09, 0.01)
)

# Work out what one rival card pays on average, then subtract the price of 3.
# Two lines. Press Check when you have them.
```
::check {"regex": "rival[$]payout\\s*[*]\\s*rival[$]chance|rival[$]chance\\s*[*]\\s*rival[$]payout", "gate": true, "difficulty": "beginner", "ok": "Right: the card pays $2.90 on average against a $3 price, so it costs Ravi 10 cents a card. Cheaper to play than the corner shop, which takes 50 cents.", "no": "Same recipe as the corner shop card: multiply each payout by its chance and add them up, so `sum(rival$payout * rival$chance)`, then the same line with `- 3` on the end."}
::solution
```r
# What one rival card pays, and what it costs once the price comes off
sum(rival$payout * rival$chance)
#> [1] 2.9

sum(rival$payout * rival$chance) - 3
#> [1] -0.1
```

Both shops sell you a loss. The one across the road just charges less for it.

=== step === concept
## Two very different cards with the same $1.50

Now let's come to the half of the question nobody asks.

Imagine the corner shop offered Ravi a second card. This one is about as boring as a card can get, because it pays $1.50 every single time and there is nothing to scratch. Its expected value is $1.50, exactly the same as the card he is holding.

So let's put a hundred thousand of each side by side and look at what the two evenings amount to.

```r
# A card that pays $1.50 every time, next to the scratch card
steady <- rep(1.5, 1e5)

data.frame(scratch_card = head(draws, 10), steady_card = head(steady, 10))
#>    scratch_card steady_card
#> 1             0         1.5
#> 2             0         1.5
#> 3             0         1.5
#> 4             0         1.5
#> 5             0         1.5
#> 6             0         1.5
#> 7             0         1.5
#> 8             0         1.5
#> 9             0         1.5
#> 10            5         1.5

c(scratch = mean(draws), steady = mean(steady))
#> scratch  steady
#> 1.50225 1.50000
```

The two averages match to a fifth of a cent. By the only number we have built so far, these cards are the same product.

Then look at the first ten cards. The steady card paid $1.50 ten times over, without any drama at all. The scratch card paid nothing nine times running and then handed over a five.

Expected value cannot tell those two apart, because it was never built to. It reports the balance point and says nothing whatsoever about the wobble around it. So we need a second number, and that number has to measure distance.

=== step === concept
## How far a card lands from $1.50

If we want to measure the wobble, the obvious first try is to ask how far a card lands from $1.50 and average that.

Let's do exactly that, and watch it fail.

```r
# Measure how far each card lands from $1.50, first raw and then squared
mean(draws - 1.5)
#> [1] 0.00225

mean((draws - 1.5)^2)
#> [1] 502.7295
```

The first line comes out at essentially zero, and it was never going to come out as anything else.

Think about who is in that pile. Nearly ninety thousand duds each land $1.50 below the average, which piles up into a very large negative total. Pushing back the other way are two hundred jackpots sitting $498.50 above it, and nearly ten thousand $5 cards sitting $3.50 above it. The average is the one spot where those totals cancel out exactly, so measuring distance from it and averaging will always hand you zero. That is what an average is.

Squaring fixes it, for a plain reason: a squared number is never negative. A card that lands $1.50 low and a card that lands $1.50 high both contribute the same 2.25, so nothing cancels anything.

Do that and the answer jumps to 502.7, which is finally a number that noticed the swing.

=== step === concept
## Variance, and the version in dollars

That average squared distance has a name. It is the variance, and R will compute it for you with `var()`.

Let's run it on both cards, along with the standard deviation, which is nothing more complicated than the square root of the variance.

```r
# Variance and standard deviation for both cards
c(scratch = var(draws), steady = var(steady))
#>  scratch   steady
#> 502.7345   0.0000

c(scratch = sd(draws), steady = sd(steady))
#>  scratch   steady
#> 22.42174  0.00000
```

The scratch card's variance is 502.73, which matches the number we worked out by hand a moment ago almost exactly. The tiny difference is because `var()` divides by one less than the number of draws, a correction worth about five thousandths when you have a hundred thousand of them.

The steady card comes back as zero, twice. Nothing ever lands anywhere except on $1.50, so there is no distance to average and no swing to report. Zero variance is the honest answer for a sure thing.

Now, 502.73 is a real number but its units are squared dollars, which nobody can picture. That is what the square root is for. It puts the answer back into dollars, and the scratch card comes out at about $22.

[KEY INSIGHT]
Variance is the average squared distance from the expected value. Standard deviation is its square root, which drags the answer back into the units you started with. A card worth $1.50 on average swings about $22 around it.

=== step === concept
## The same number without buying anything

We got 502.73 out of a hundred thousand simulated cards, which makes it an estimate. The table can hand us the exact answer, the same way it handed us the exact $1.50.

The recipe is short: take the average of the squared payouts, then subtract the square of the average payout.

```r
# Variance from the table: the average of the squared payouts, minus the square of the average
sum(card$payout^2 * card$chance)
#> [1] 502.5

sum(card$payout^2 * card$chance) - 1.5^2
#> [1] 500.25

sqrt(sum(card$payout^2 * card$chance) - 1.5^2)
#> [1] 22.36627
```

Read it line by line. The first squares each payout, weights it by its chance and adds up: 0, plus 25 times 0.1, plus 250,000 times 0.002, which is 502.5. The second takes off 1.5 squared, which is 2.25, and lands on 500.25. The third takes the square root and gets $22.37.

So the true variance of this card is 500.25 and its true standard deviation is $22.37. A hundred thousand cards estimated them as 502.73 and $22.42, which is close. Close is the most a simulation ever promises.

Now put the two numbers next to each other and read them out loud. A card worth $1.50 has a swing of $22.37, roughly fifteen times its own average. That is not a small wobble around a stable payout. The wobble is the whole product.

=== step === widget
## Hold the average still and open up the spread

The steady card and the scratch card differ in exactly one way, and it helps to see that one difference on its own.

Below is a target with shots on it. Two dials control where those shots land, and they do two entirely different jobs.

The left dial is labelled bias, and all it does is slide the whole cluster off the bullseye, so the shots stay just as tight but land somewhere they should not be. We are leaving it parked at zero, so the centre of the cluster stays right on target, which is what "both cards average $1.50" looks like here.

The right dial is the one to play with. It is the spread.

::widget bias-variance-target {"bias": 0, "variance": 0.08}

Drag the right dial from its lowest setting up to its highest. The centre never moves. The shots simply go from a tight little knot on the bullseye, which is the steady card, out to a scatter across the whole board, which is the scratch card.

Watch the variance figure under the picture climb while the bias figure beside it stays at zero. Two dials, two jobs, and knowing one of them tells you nothing at all about the other.

That climbing number is the same quantity you worked out for the card, an average squared distance from the centre, measured on a dartboard instead of in dollars. The readout calls the wide end of that dial overfitting, which is the name this same picture goes by when the shots are a model's predictions rather than a card's payouts.

=== step === quiz
## Quick check: what a bigger variance changes

Two scratch cards cost the same and have the same expected value of $1.50, but the second one has four times the variance of the first. What does that extra variance change?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- It pulls the average payout down, because a wider spread gives you more ways to lose. ::no
- It leaves the average payout exactly where it is, and only changes how far a single card tends to land from it. ::ok Yes. Centre and spread are two independent dials, which is precisely why one number could never do both jobs.
- It means you lose more per card in the long run. ::no
- It makes the average less trustworthy, so the wider the spread the less you should believe the $1.50. ::no All three of those tie the spread back to the average, and it does not work that way. Variance measures distance from the expected value, so it can grow as large as you like while the expected value sits exactly where it was. The steady card and the scratch card both average $1.50, and only one of them has a swing of $22.37.

=== step === tryit
## Your turn: the coin card

Here is a card that could not be simpler. It pays $3 half the time and nothing the other half.

The table is below. Work out its average payout first, then its variance, then its standard deviation.

```r
# The coin card: pays 3 half the time and nothing half the time
coin <- data.frame(
  payout = c(3, 0),
  chance = c(0.5, 0.5)
)

# Work out the average payout, then the variance, then the standard deviation.
# Three lines. Press Check when you have them.
```
::check {"regex": "coin[$]payout\\s*\\^\\s*2|[(]\\s*coin[$]payout\\s*-\\s*1\\.5\\s*[)]\\s*\\^\\s*2", "gate": true, "difficulty": "beginner", "ok": "Correct: the average is $1.50, the variance is 2.25 and the standard deviation is $1.50. Same average as Ravi's card, with a swing of $1.50 against his $22.37.", "no": "Get the average first with `sum(coin$payout * coin$chance)`, which is 1.5. Then use the table recipe for variance: `sum(coin$payout^2 * coin$chance) - 1.5^2`. Then take the square root of that."}
::solution
```r
# Average, variance and standard deviation for the coin card
coin_mean <- sum(coin$payout * coin$chance)
coin_mean
#> [1] 1.5

coin_var <- sum(coin$payout^2 * coin$chance) - coin_mean^2
coin_var
#> [1] 2.25

sqrt(coin_var)
#> [1] 1.5
```

Three cards now share the same $1.50 average and carry standard deviations of $0, $1.50 and $22.37. The average was never going to tell them apart.

=== step === concept
## Why the shop is safe and Ravi is not

Ravi and the shop stand on opposite sides of the same counter facing the same odds, and only one of them is nervous. Both numbers together explain why.

So let's hand a hundred thousand cards to each of two thousand different shops and see what each shop ends up with. `rmultinom()` deals all hundred thousand cards in one go and reports how many landed on each row of the table, which is a great deal quicker than dealing them one at a time.

```r
# Deal 100,000 cards at each of 2,000 shops and see what each shop keeps
n_cards <- 1e5
till    <- 2 * n_cards          # 100,000 cards sold at 2 dollars each

set.seed(3)
takings <- replicate(2000, {
  sold <- rmultinom(1, size = n_cards, prob = card$chance)
  till - sum(card$payout * sold)
})

hist(takings, breaks = 40, col = "grey85", border = "white",
     main = "2,000 shops, 100,000 cards each",
     xlab = "What the shop keeps, in dollars")
abline(v = 50000, col = "red", lwd = 3)

range(takings)
#> [1] 26640 71510

sd(takings)
#> [1] 7062.57
```

The red line sits at $50,000, which is a hundred thousand cards at 50 cents of edge each. The grey pile of shops gathers around it, and the worst shop out of two thousand still walked away with $26,640. Not one of them lost money.

Here is the comparison that matters. One card swings $22.37 against an average of $1.50, about fifteen times its own size. A hundred thousand cards swing about $7,063 against $50,000, which is roughly a seventh of it.

The shop's swing did grow in absolute dollars. It just grew far slower than the money did, so measured against what is on the table it shrank to almost nothing.

Ravi never gets that. He buys one card, and one card pays 0 or 5 or 500 no matter how many cards the shop sells. Volume is the shop's product, and it is not for sale.

=== step === concept
## Why you buy insurance even though it loses money

Now let's turn the whole thing around, because the same two numbers explain a decision that looks irrational until you have them.

Ravi is offered car insurance at $600 a year. The realistic bad year, the one where he writes off a car and injures somebody, costs him $200,000, and it lands on about 2 drivers in every 1,000.

Let's work out what going without the policy is worth.

```r
# What a year of driving costs Ravi if he does not buy the policy
policy <- data.frame(
  loss   = c(0, 200000),
  chance = c(0.998, 0.002)
)

expected_loss <- sum(policy$loss * policy$chance)
expected_loss
#> [1] 400

policy_sd <- sqrt(sum(policy$loss^2 * policy$chance) - expected_loss^2)
policy_sd
#> [1] 8935.323
```

The expected cost of driving uninsured is $400 a year. The premium is $600. So on expected value alone, buying the policy is a losing bet by $200 a year, and Ravi should refuse it for the same reason he should refuse the scratch card.

Almost nobody refuses, and they are right not to.

Now look at the second number. That $400 arrives with a standard deviation of $8,935, and look at the shape behind it: nothing whatsoever in 998 years out of a thousand, and a $200,000 hole in the other two. Ravi does not have $200,000. A year that costs him $400 on average is a year that could end his finances entirely.

The $200 is what it costs to delete that. He is not buying a good expected value, he is buying a variance of zero, and he is glad to overpay for it.

[KEY INSIGHT]
Expected value alone cannot tell you whether to take a bet. The scratch card and the insurance policy both lose money on average and the right answers are opposite, because in one case the swing is the thing you are buying and in the other it is the thing you are getting rid of.

=== step === quiz
## Quick check: the stall owner and the buyer

The corner shop sells a hundred thousand of these cards a year. Ravi buys one. Both face the same table and the same 50 cents of edge per card. Why is only Ravi taking a real risk?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- Selling in volume raises the shop's edge on each card, so the shop earns more than 50 cents a card. ::no
- Selling in volume makes each individual card safer, which helps the shop and Ravi equally. ::no
- The edge per card never changes for either of them. What changes is that across a hundred thousand cards the shop's total lands within a few thousand dollars of $50,000, while Ravi's single card still pays 0, 5 or 500. ::ok Exactly. Volume does not improve the odds, it shrinks the swing relative to the money at stake, and only the side doing the volume gets that.
- The shop needs luck every bit as much as Ravi does, it simply has more money to lose before it hurts. ::no None of those work. The 50 cents of edge is fixed by the table and volume cannot move it, and volume does nothing at all for a person who buys one card. What volume buys is predictability: two thousand simulated shops all landed between $26,640 and $71,510, and none of them lost money.

=== step === tryit
## Your turn: is the festival raffle worth $10?

The street festival is running a raffle. They print 500 tickets, sell them at $10 each, and one ticket wins a $2,000 prize.

The table is below. Work out what one ticket pays on average, then its standard deviation, then decide what you would tell Ravi.

```r
# The festival raffle: 500 tickets at 10 dollars each, one prize of 2,000
raffle <- data.frame(
  prize  = c(2000, 0),
  chance = c(1/500, 499/500)
)

# Work out what one ticket pays on average, then its standard deviation.
# Press Check when you have them.
```
::check {"regex": "raffle[$]prize\\s*[*]\\s*raffle[$]chance|raffle[$]chance\\s*[*]\\s*raffle[$]prize", "gate": true, "difficulty": "intermediate", "ok": "Right: a ticket pays $4 on average with a standard deviation of $89.35. So a $10 ticket is a $6 loss, and the swing is more than twenty times the average.", "no": "It is the same two recipes on a two row table. The average is `sum(raffle$prize * raffle$chance)`, and the variance is `sum(raffle$prize^2 * raffle$chance)` minus the square of that average."}
::solution
```r
# Average payout and standard deviation for one raffle ticket
raffle_mean <- sum(raffle$prize * raffle$chance)
raffle_mean
#> [1] 4

raffle_sd <- sqrt(sum(raffle$prize^2 * raffle$chance) - raffle_mean^2)
raffle_sd
#> [1] 89.35323
```

A $10 ticket that pays $4 is worse value than Ravi's scratch card, and the honest thing to tell him is that it does not matter. The festival keeps $3,000 to run itself, and he knew that when he handed over the note. A $6 loss you chose on purpose is a donation, not a mistake.

And that is rather the point. These two numbers tell you exactly what a bet is. Deciding whether you want it is still yours to do.

=== step === quiz
## Quick check: which number answers which question

Ravi has two decisions in front of him. The scratch card costs $2 and pays $1.50 on average. The insurance costs $600 against an expected loss of $400. Both lose money on average. So what separates them?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Nothing separates them. Both have a negative expected value, so the consistent answer is to refuse both. ::no
- The card gives Ravi nothing in return for its swing, while the policy exists precisely to remove a swing he could not survive. Expected value ranks them the same, and variance is what tells them apart. ::ok That is the whole reason today needed two numbers instead of one.
- The higher variance bet is always the worse bet, and the policy is the one with less variance. ::no
- The policy must really pay out more than it costs, otherwise no insurer could sell it. ::no None of those hold. Refusing both ignores that Ravi cannot absorb a $200,000 year. Variance is not automatically the enemy either, since the swing is the entire reason anybody buys a lottery ticket. And the insurer genuinely does collect $600 to cover $400: that $200 is its business, and Ravi pays it willingly to turn a small chance of ruin into a fixed bill.

=== step === concept
## References

- [Introduction to Probability, second edition](https://doi.org/10.1201/9780429428357) - Blitzstein and Hwang (2019), CRC Press. Chapters 4 and 6 build expectation and variance for discrete outcomes from scratch, with no calculus needed.
- [All of Statistics](https://doi.org/10.1007/978-0-387-21736-9) - Wasserman (2004), Springer. Chapter 3 states expectation, variance and the shortcut identity compactly, along with the properties worth learning next.
- [Prospect Theory: An Analysis of Decision under Risk](https://doi.org/10.2307/1914185) - Kahneman and Tversky (1979), Econometrica 47(2), 263-291. The classic account of why real people pay above expected value for insurance and below it for lottery tickets.
- R Core Team, the reference pages for [sd() and var()](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/sd.html) in the stats package and [sample()](https://stat.ethz.ch/R-manual/R-devel/library/base/html/sample.html) in base, including exactly which denominator `var()` uses.

=== step === complete
## Quick recap

You started with a $2 card and three lines of small print, and you now have the two numbers the shop had all along.

- **Expected value** is every payout multiplied by its chance, added up: `sum(payout * chance)`. Ravi's card came to $1.50, which is why a $2 card is a 50 cent loss every time he buys one.
- It is a balance point, not a forecast. A fair die averages 3.5 and never lands there, and the card never pays $1.50 either.
- **Variance** is the average squared distance from that balance point, and the table gives it exactly: the average of the squared payouts minus the square of the average, or 502.5 minus 2.25, which is 500.25.
- **Standard deviation** is its square root, back in dollars: $22.37. So this is a card worth a dollar fifty that swings twenty two dollars around it.
- The same average with a different swing gives you a completely different product. The steady card, the coin card and the scratch card all average $1.50 and carry standard deviations of $0, $1.50 and $22.37.

So when somebody hands you a bet, here is the sentence to say about it:

"On average it pays this much, and a single go typically lands about that far away from it."

One last thing worth carrying with you. When you buy a hundred thousand cards and take the average, that average is itself a random thing with a variance of its own, and it is a much smaller one. That is why the shop sleeps fine and Ravi does not, and it is also why every number you will ever compute from data arrives with a wobble attached.

Congratulations, you made it through. Enjoy the rest of your day.
