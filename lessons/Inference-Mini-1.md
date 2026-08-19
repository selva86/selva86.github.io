---
title: "How statistical inference works, no formulas yet"
description: "A friend calls nine of ten cups right by taste. Is she skilled or lucky? Build the pure-guessing world in R and see how statistical inference actually works."
keywords: "statistical inference, how statistical inference works, p-value explained, simulation in R, lady tasting tea, inference from zero, statistics for beginners"
catalog_blurb: "How to tell a real result from a lucky one, no formulas."
post_type: "LESSON"
course_id: "inference-from-zero"
course_title: "Inference from Zero"
course_lesson: "1"
course_total: "7"
course_landing: "/dashboard.html"
curriculum_id: "0.0.1"
lesson_access: "windowed"
mathjax: "false"
webr: "true"
date: "2026-08-19"
---

=== step === cover

## How Statistical Inference Works

Today let's understand the essence of how statistical inference works. 

Let's start with a simple bet. You are at a friend's place for dinner when Priya makes a claim: she can tell Coke from Pepsi purely by taste alone.

Nobody at the table believes it. 

So you carry ten identical plastic cups into the kitchen and fill each one by tossing a coin. When it lands heads you fill it with Coke and for tails fill it with Pepsi, while writing the answers down as you go. 

Not even you know how many of each you poured. Next, Priya tastes all ten and calls them one at a time.

She gets nine right and one wrong.

Now, is Priya really skilled, or just got lucky?

Getting nine out of ten right does feel like a lot. However, the trouble is that somebody with no ability whatsoever, somebody purely guessing, would still get a fair share of the cups right by chance, and every so often that guesser would get almost all of them right. 

So the question is not whether 9 out of 10 sounds impressive. It does. The real question is how often blind luck manages nine.

How can we find out?

Press the buttons below. Every bar you get in the output is a real round of ten pure-guess calls, played right now in front of you, and the orange bars are the rounds where luck alone did as good as Priya or better.

::widget luck-simulator {"trials": 10, "p": 0.5, "observed": 9, "unit": "correct guesses", "seed": 42}

By the end you will be able to:

- Say why nine right out of ten, on its own, is not evidence of anything
- Build the guessing world in R and know how often you get a result that good
- Read and understand the answer correctly, and state the inference plainly
- Apply the method somewhere else entirely, like an online shop comparing two versions of its checkout page

**What you need first:** you can read a simple R script, so a variable, a function call and a comparison like `x >= 9` are familiar. No statistics at all is assumed. We will build the intuition here from scratch.

=== step === concept

## What would a pure guesser actually do?

We cannot run tonight again. Priya has tasted the ten cups, the answer is on the table, and that is that.

But there is one version of tonight we can run as many times as we like, and that is the boring version, the one where Priya has no ability at all and is calling every cup at random.

That is the world we need. Watch a pure guesser play this exact game over and over, and you learn what luck alone is capable of. Then you can hold Priya's nine up against it.

So how does a pure guesser actually behave? On any one cup she has two answers to pick from, Coke or Pepsi, and nothing to help her choose between them. So she is right about half the time and wrong about half the time, which is exactly what a tossed coin does. That is why we can build her out of a coin, and let that coin call all ten cups.

```r
set.seed(101)
one_round <- sample(c("right", "wrong"), size = 10, replace = TRUE)
one_round
#>  [1] "right" "right" "wrong" "right" "right" "right" "wrong" "right" "right"
#> [10] "wrong"
```

`sample()` picks from the two words we handed it, ten times over. `replace = TRUE` lets it pick the same word again, which is what makes every cup its own independent toss instead of dealing from a fixed deck. And `set.seed(101)` pins the randomness down, so the ten calls you see are the ten calls I see.

Now count how many that guesser got right.

```r
sum(one_round == "right")
#> [1] 7
```

`one_round == "right"` compares each of the ten calls to the word right and hands back ten TRUEs and FALSEs. `sum()` counts the TRUEs.

That is seven out of ten, from something that knows nothing about Coke, Pepsi, or taste.

=== step === concept

## Why is one round not enough?

Seven out of ten from a pure guesser is already a bit surprising. But do not read anything into it yet, because that seven is itself a random number. Run the same guesser again and the number moves.

Here are three more rounds, with the same guesser and the same coin. There is no new seed this time, so the randomness simply carries on from where it was.

```r
round_two   <- sample(c("right", "wrong"), size = 10, replace = TRUE)
round_three <- sample(c("right", "wrong"), size = 10, replace = TRUE)
round_four  <- sample(c("right", "wrong"), size = 10, replace = TRUE)

c(round_two = sum(round_two == "right"),
  round_three = sum(round_three == "right"),
  round_four = sum(round_four == "right"))
#>   round_two round_three  round_four
#>           6           5           4
```

The guesser got six, then five, then four.

So one round tells you nothing about what luck usually does. It only tells you what luck did that one time. If we want to know what a guesser is capable of, we have to watch a lot of guessers.

=== step === concept

## What does luck usually manage?

So let's play the guessing world ten thousand times. Each round is a fresh guesser calling ten fresh cups, and we write the score down.

Ten thousand is not a magic number. It is just big enough that the answer stops wobbling when you run the whole thing again.

```r
set.seed(2026)
many_rounds <- replicate(10000, {
  guesses <- sample(c("right", "wrong"), size = 10, replace = TRUE)
  sum(guesses == "right")
})

table(many_rounds)
#> many_rounds
#>    0    1    2    3    4    5    6    7    8    9   10
#>    7   93  461 1127 2020 2460 2080 1215  410  115   12
```

`replicate()` does the same job over and over and keeps every answer, so `many_rounds` now holds ten thousand scores, one per round. `table()` tallies them up.

Read the bottom row as counts. Five came up 2,460 times, more than any other score. Four and six are close behind. And out at the far right, a pure guesser matched Priya with nine right in 115 of those rounds, and beat her with a perfect ten in 12 of them.

=== step === concept

## The shape of pure luck

Those counts have a shape, and the shape is the whole point. So let's draw it, with Priya's score and anything better in orange.

```r
bar_colour <- ifelse(0:10 >= 9, "#d97706", "#cfe0f3")

hist(many_rounds,
     breaks = seq(-0.5, 10.5, by = 1),
     col    = bar_colour,
     border = "white",
     main   = "10,000 rounds of pure guessing",
     xlab   = "Cups called right, out of ten",
     ylab   = "Number of rounds")
```

Only two lines in there need explaining. `breaks` forces one bar per score, so 0 through 10 each get their own bar instead of being lumped together, and `bar_colour` hands `hist()` a colour per bar, orange for 9 and 10 and pale blue for the rest.

The rounds pile up in the middle and thin out towards both ends, and they never quite run out at either end. The two orange bars are the rounds where a guesser did as well as Priya or better, and they are small, but they are there.

That last part is the bit people skip. Nine out of ten is not impossible for a guesser. It is only uncommon. And the difference between those two words, impossible and uncommon, is what all of statistical inference is built on.

=== step === quiz

## Where do pure guessers land?

Before we put a number on any of this, make sure you are reading that picture the way it is meant to be read.

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- A pure guesser lands on exactly 5 every time, because the coin is fair. ::no See the tally again.
- A pure guesser usually lands near 5, often lands a couple away from it, and only rarely reaches 9. ::ok That is the shape exactly. Five is the busiest score, the counts fall away steadily on both sides, and 9 sits out in the thin tail rather than off the map.
- Every score from 0 to 10 is equally likely, because the whole thing is random. ::no See the tally again.
- A pure guesser can come close to 9, but never actually gets there. ::no Go back to the tally. Five is the busiest score at 2,460 rounds out of 10,000, but that is far from every round, and 4 and 6 turn up almost as often. The ends are thin, and they are not empty: luck reached 9 in 115 rounds, and a perfect 10 in 12.

=== step === concept

## How often does luck reach nine?

Now we can answer the question the table was actually arguing about. Across those ten thousand pure-guess rounds, what share did as well as Priya or better?

The words or better matter a great deal here. We count the nines and the tens together, because a guesser who called all ten did at least as well as Priya did, and what we want to know is how often luck produces a night this impressive or more so.

```r
luck_rate_9 <- mean(many_rounds >= 9)
luck_rate_9
#> [1] 0.0127
```

`many_rounds >= 9` turns the ten thousand scores into ten thousand TRUEs and FALSEs. Taking the mean of TRUEs and FALSEs gives you the share that are TRUE, because R counts every TRUE as 1 and every FALSE as 0.

So the answer is 0.0127. Pure guessing produced a night as good as Priya's, or better, in 1.3 percent of ten thousand attempts.

=== step === tryit

## How often does luck reach eight or better?

Before we read that 1.3 percent, get a feel for how quickly it moves. Priya got nine. Suppose she had got eight.

Lower the bar by a single cup and count again.

```r
# Priya scored 9, and we counted the rounds that reached 9 or more.
# Change the line below so it counts the rounds that reached 8 or more.
mean(many_rounds >= 9)
```

::check {"regex": "mean\\s*[(]\\s*many_rounds\\s*>=\\s*8\\s*[)]", "gate": true, "difficulty": "beginner", "ok": "0.0537. One cup lower, and luck clears the bar about four times as often: 5.4 percent instead of 1.3.", "no": "Change only the number. Keep mean() and many_rounds, and ask for 8 or more instead of 9 or more."}

::solution

```r
mean(many_rounds >= 8)
#> [1] 0.0537
```

Nine and eight sound like nearly the same result. Out at the thin edge of that picture they are not, and that is worth remembering the next time a number lands just short of a cutoff.

=== step === concept

## So what do we say about Priya?

We have everything we need now. So let's put that rate into the plainest form there is, which is one night in how many.

```r
round(1 / luck_rate_9)
#> [1] 79
```

Here is the whole evening in one sentence.

If Priya cannot taste the difference at all, a night this good turns up about once in every 79 attempts. Tonight it turned up on the first attempt.

That leaves you two ways to explain what happened in your kitchen. Either something that happens roughly once in 79 tries happened tonight, on the first go, right in front of you. Or she is not guessing at all.

Neither one is impossible. But one of them is a great deal easier to believe than the other, and saying so out loud is the entire act of statistical inference. You have not proved anything about Priya. You have only worked out which of the two explanations is easier to believe.

[KEY INSIGHT]
Inference never tells you what is true. It tells you how hard the boring explanation has become to believe.

=== step === quiz

## What does that 1.3 percent actually mean?

This is where almost everybody slips, so it is worth going slowly. The number is 1.3 percent. Which of these does it actually say?

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- There is a 1.3 percent chance that Priya was guessing. ::no Look at where the number came from.
- There is a 98.7 percent chance that Priya really can taste the difference. ::no Look at where the number came from.
- If Priya were guessing, a night at least this good would turn up about 1.3 percent of the time. ::ok Yes. Every number we computed came out of a world we built on purpose, the world where Priya is guessing, so the answer can only ever describe that world.
- There is a 1.3 percent chance that this experiment gave the wrong answer. ::no Look at where the number came from. We simulated one world and one world only, the one where Priya has no ability, so the rate can only describe that world: how often guessing produces a night this good. We never built a world in which she has the skill, so nothing here can tell you the chance that she has it, or the chance that the experiment misfired.

=== step === concept

## This number has a name

::prose-only the rate was computed, drawn and read correctly already; this step only attaches the label to it

You have computed one, you have drawn it, and you have read it correctly. So now it is time to give it its name.

That rate, the share of pure-luck rounds that did as well as the real result or better, is called a p-value.

That is all it is. It is not the probability that a claim is true, and it is not a measure of how big or how important anything is. A p-value answers one narrow question, and only that question: if nothing but luck were at work, how often would luck alone produce a result this good?

You will also run into a line drawn at 0.05, and results called significant when they fall under it. Priya's 0.0127 falls under it comfortably.

It is worth knowing where that line came from. Fisher suggested one in twenty as a convenient rule of thumb in the 1920s, and it stuck. It is a convention people found handy rather than a boundary in nature, and nothing about the evidence really changes when a number moves from 0.051 to 0.049.

=== step === widget

## The whole method in four moves

Look back at what you actually did tonight. Take out the Coke, the cups and the friend, and four moves are left, in this order.

::widget process-flow {"steps": [{"title": "Assume pure luck", "sub": "suppose Priya has no ability and is guessing every cup"}, {"title": "Play that world", "sub": "run 10,000 rounds of ten calls and record every score"}, {"title": "Count as good or better", "sub": "how many of those rounds reached 9 right or more"}, {"title": "Judge", "sub": "rare under pure luck makes luck a poor explanation"}]}

Move one is the move that asks the most of you, because you have to be willing to describe the boring world precisely enough to build it. Move two we did by brute force, by literally playing that world ten thousand times.

And move two is the only part that changes when you meet the tests that have names. A t-test, a chi-squared test, an ANOVA: each of them swaps our ten thousand rounds for a formula that works out the same answer without any playing. The arithmetic is different and the question is identical. How often would luck alone do this well?

=== step === concept

## Does this work anywhere but a dinner table?

Priya is fun, but nobody is paying you to referee taste tests. So let's take the same evening to work.

An online shop rewrites its checkout page. The old page converts about half of the visitors who reach it, which is unusually good for a checkout and makes the arithmetic clean. They show the new page to the next 40 visitors. 25 of them buy.

25 out of 40 is 62.5 percent, against the old 50. The room wants to ship it.

The question has not changed one bit. If the new page made no difference at all, so that each of those 40 visitors was still a coin toss, how often would luck alone hand you 25 buyers or more?

Press the buttons and watch it happen.

::widget luck-simulator {"trials": 40, "p": 0.5, "observed": 25, "unit": "purchases", "seed": 7}

=== step === tryit

## How often does luck give 25 out of 40?

Now let's run it properly. It is the same four moves with new numbers. The code below is Priya's simulation, untouched, and exactly two numbers need to move: ten cups become 40 visitors, and nine right becomes 25 buyers.

```r
set.seed(404)
checkout_rounds <- replicate(10000, {
  visitors <- sample(c("bought", "left"), size = 10, replace = TRUE)
  sum(visitors == "bought")
})

mean(checkout_rounds >= 9)
```

::check {"regex": "size\\s*=\\s*40[\\s\\S]*>=\\s*25", "gate": true, "difficulty": "beginner", "ok": "About 0.075. Luck alone hands you 25 buyers or better out of 40 roughly 7.5 percent of the time.", "no": "Two numbers change and nothing else: size = 10 becomes size = 40, and the 9 on the last line becomes 25."}

::solution

```r
set.seed(404)
checkout_rounds <- replicate(10000, {
  visitors <- sample(c("bought", "left"), size = 40, replace = TRUE)
  sum(visitors == "bought")
})

mean(checkout_rounds >= 25)
#> [1] 0.0752
```

=== step === concept

## Reading the second answer

Put the two evenings side by side. The block below re-runs the shop simulation from scratch, so both numbers land in one place.

```r
set.seed(404)
checkout_rounds <- replicate(10000, {
  visitors <- sample(c("bought", "left"), size = 40, replace = TRUE)
  sum(visitors == "bought")
})

luck_rate_25 <- mean(checkout_rounds >= 25)

round(c(priya = luck_rate_9, checkout = luck_rate_25), 4)
#>    priya checkout
#>   0.0127   0.0752
```

It is the same four moves and the same code, and the answer is six times larger. So how often is that, one test in how many?

```r
round(1 / luck_rate_25)
#> [1] 13
```

That is about one in 13. Run this experiment on a checkout page that changed absolutely nothing, thirteen times over, and one of those runs would hand you a 25 out of 40 and a room full of people wanting to ship it.

Priya's night was rare enough to need explaining. The shop's night is not.

=== step === quiz

## What should the shop do?

The number is on the table. There are 25 buyers out of 40, and luck alone reaches that about one test in 13. So what do you tell the room?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Ship the new page. 25 out of 40 beats the 20 you would have expected from the old one. ::no Read the 7.5 percent again.
- Nothing yet. Luck alone does this well about once in 13 tries, which is far too often to call the new page better. ::ok Right. And notice what you are not saying. Not that the page is worse, not that it is the same, only that 40 visitors cannot tell it apart from luck. Keep the test running and come back at 400.
- Drop the new page. The test has shown it is no better than the old one. ::no Read the 7.5 percent again.
- Re-run the test, because a result this murky means something went wrong with it. ::no The 7.5 percent says one thing only: luck alone does this well about once in 13 tries, so 25 out of 40 is not enough to call the new page better. That is a different statement from showing it is no better, and nothing went wrong with the test either. A result too weak to act on is a normal, honest outcome, and the usual answer is more visitors rather than a different verdict.

=== step === concept

## What this method does not tell you

There are three limits to all of this, and they matter more than anything else you have seen so far.

The first limit is that it never proves skill. Priya's night was rare under guessing, so guessing got hard to believe, and that is as far as it goes. Rare things do happen. Run the taste test on 200 confident dinner guests who are all guessing, and two or three of them will hand you a nine out of ten and a story to go with it. Evidence is not proof.

The second limit is that it says nothing about how good she is. Nine out of ten fits a taster who is right 80 percent of the time just as well as it fits one who is right 95 percent. All this method does is rule luck in or out. How big the effect is, that is a separate question, and in most real work it is the more useful one.

The third limit is the easiest mistake to make, so let's catch it now. The whole argument rests on the size of the test. Give Priya four cups instead of ten, and let her get all four right.

```r
set.seed(7)
tiny_test <- replicate(10000, {
  guesses <- sample(c("right", "wrong"), size = 4, replace = TRUE)
  sum(guesses == "right")
})

mean(tiny_test >= 4)
#> [1] 0.0585
```

She gets a perfect score, and it means almost nothing. Pure guessing gets four out of four about 6 percent of the time, roughly one guesser in 17. Ten cups was doing real work, and no amount of careful arithmetic afterwards can rescue a test that was too small to start with.

=== step === concept

## References

The dinner-table experiment is not ours. It is nearly a hundred years old, and it is where this entire way of arguing began.

- [Fisher, R. A. (1935), The Design of Experiments](https://en.wikipedia.org/wiki/The_Design_of_Experiments): chapter 2 lays out the original of tonight's bet, a lady who claimed she could taste whether the milk went into the cup before the tea or after it.
- [Salsburg, D. (2001), The Lady Tasting Tea](https://en.wikipedia.org/wiki/The_Lady_Tasting_Tea): the same story and the century that followed it, told with no mathematics at all.
- [Wasserstein, R. and Lazar, N. (2016), The ASA Statement on p-Values](https://www.amstat.org/asa/files/pdfs/P-ValueStatement.pdf): the American Statistical Association setting out, in six short principles, what the number does and does not mean.
- [Hesterberg, T. (2015), What Teachers Should Know About the Bootstrap](https://arxiv.org/abs/1411.5279): the case for teaching inference by simulating first and reaching for formulas second, which is what we did tonight.
- [Downey, A. (2011), There Is Only One Test](https://allendowney.blogspot.com/2011/05/there-is-only-one-test.html): a short, sharp argument that every named test is these same four moves with different arithmetic.

=== step === complete

## You just did statistical inference

You did all of that without a single formula. You built the world where nothing interesting is happening, you played it ten thousand times, you counted how often blind luck did as well as the real result, and then you judged.

That is the engine, and you have turned it three times already:

- Priya called 9 of 10, and luck manages that about once in 79 nights, so guessing became hard to believe.
- The checkout page got 25 of 40, and luck manages that about once in 13 tests, so there is nothing here to act on yet.
- Four cups gave a perfect score, and luck manages that about once in 17, so the test was never big enough to say anything at all.

Every test with a name is running those same four moves. The t-test, the chi-squared test, the ANOVA sitting behind somebody's dashboard: each one carries a formula that works out how often luck alone would do this well, so that nobody has to sit and play ten thousand rounds by hand. The formula is the shortcut. The question underneath it is the one you just answered yourself.

Next time we stay with that number, the p-value, and look hard at what it does and does not say, because most people who use it every day read it the wrong way.
