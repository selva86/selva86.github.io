---
title: "How statistical inference works, no formulas yet"
slug: "Inference-Mini-1"
description: "A friend calls nine of ten cups right by taste. Skill, or luck? Build the luck-only world in R, count how often blind guessing wins, and meet inference."
keywords: "how statistical inference works, statistical inference, statistical inference explained, inference without formulas, null hypothesis intuition, simulation based inference, statistical inference in R, lady tasting tea"
mathjax: false
webr: true
date: "2026-08-21"
post_type: "LESSON"
course_id: "inference-from-zero"
course_title: "Inference from Zero"
course_lesson: "1"
course_total: "7"
course_landing: "/dashboard.html"
course_prev: ""
course_next: "Inference-Mini-2"
curriculum_id: "0.0.1"
lesson_access: "windowed"
catalog_blurb: "What a statistical test is really asking, built from one taste test."
---

=== step === cover
::eyebrow Inference from Zero
## How statistical inference works, no formulas yet

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

Press the buttons below and watch. Each press plays that many rounds of ten pure-guess calls, right now, in front of you. Every round lands on one of the eleven bars according to how many cups it got right, so the bars grow taller as the rounds pile up. The two orange bars on the right are nine and ten, the rounds where luck alone matched Priya or beat her.

::widget luck-simulator {"trials": 10, "p": 0.5, "observed": 9, "unit": "cups called right"}

Whatever you just talked yourself into while those bars piled up, that was statistical inference. Everything from here is the same move, done slowly and done properly.

=== step === concept
## Either Priya can taste the difference, or she got lucky

Let's start by getting the evening written down as data, because every count we make from here on comes out of it.

There are two rival explanations sitting on the table. One says Priya has a real ability to taste the difference. The other says she has no ability at all and simply caught a good run of guesses. Nobody in that kitchen can look at the ten cups and tell you which one of the two is true.

So let's rebuild the evening in R. The coin toss fills the cups, and Priya's ten calls go in beside them.

Press Run.

```r
# Pour ten cups on a coin toss and record the ten calls Priya made
set.seed(1)
pours <- sample(c("Coke", "Pepsi"), size = 10, replace = TRUE)

calls <- pours        # she matched the pour on nine of the ten cups
calls[4] <- "Pepsi"   # cup 4 held Coke and she said Pepsi, her one miss

data.frame(cup = 1:10, poured = pours, called = calls, correct = calls == pours)
#>    cup poured called correct
#> 1    1   Coke   Coke    TRUE
#> 2    2  Pepsi  Pepsi    TRUE
#> 3    3   Coke   Coke    TRUE
#> 4    4   Coke  Pepsi   FALSE
#> 5    5  Pepsi  Pepsi    TRUE
#> 6    6   Coke   Coke    TRUE
#> 7    7   Coke   Coke    TRUE
#> 8    8   Coke   Coke    TRUE
#> 9    9  Pepsi  Pepsi    TRUE
#> 10  10  Pepsi  Pepsi    TRUE
```

`sample()` with `replace = TRUE` is the coin toss. It draws from Coke and Pepsi ten times over, and each draw ignores the ones before it. That is why the pours came out six Coke and four Pepsi instead of a neat five and five, which is exactly what a real coin would have done.

`set.seed(1)` just fixes which ten pours you get, so your cups match mine.

Now count the cups she called correctly.

```r
# Count how many of the ten cups Priya called correctly
her_hits <- sum(calls == pours)
her_hits
#> [1] 9
```

`calls == pours` compares the two lists cup by cup and hands back ten TRUEs and FALSEs. `sum()` treats a TRUE as 1 and a FALSE as 0, so it simply adds up the hits.

So, nine. That is the number the rest of the evening is going to argue about.

=== step === concept
## Why does nine out of ten not settle it?

Nine out of ten feels like a lot, and that feeling is the thing we have to put to the test.

Here is what makes it hard. Somebody with no ability at all does not score zero. They are saying Coke or Pepsi on every cup, so on any single cup they have a coin's chance of being right, and across ten cups they will land a fair few by accident.

So let's put a pure guesser in that kitchen and let them call the very same ten cups. They taste nothing. They just say Coke or Pepsi at random.

```r
# Play one round where somebody with no ability guesses all ten cups
set.seed(7)
one_guess <- sample(c("Coke", "Pepsi"), size = 10, replace = TRUE)
sum(one_guess == pours)
#> [1] 4
```

Four out of ten, from somebody who cannot taste a thing. Not nine, but a long way from nothing.

And that was one round. Send in a different guesser and they might land three, or six, or on a very good night, nine.

That is the whole difficulty in one line. Luck does not hand you a zero by default. Luck gets cups right, and every so often it gets a great many of them right, and that is exactly why you cannot judge Priya's nine until you know how far luck can stretch.

=== step === concept
## What happens if we let luck try ten thousand times?

One guesser on one night tells us almost nothing. To learn what luck usually does, we have to watch it try thousands of times.

So let's send in ten thousand pure guessers, one after another. Each one calls the same ten cups Priya faced, each one guesses blind, and we write down every score.

The function `replicate()` in the code below runs the same round over and over and stores the score from each one.

```r
# Play ten thousand pure-guess rounds and store how many cups each one got right
set.seed(2)
luck_hits <- replicate(10000, {
  guess <- sample(c("Coke", "Pepsi"), size = 10, replace = TRUE)
  sum(guess == pours)
})

hist(luck_hits, breaks = seq(-0.5, 10.5, by = 1), col = "grey85", border = "white",
     main = "10,000 rounds played by pure guessing",
     xlab = "Cups called right out of ten")
abline(v = 9, col = "red", lwd = 3)
```

Let's read the output slowly, because everything else rests on it.

Each grey bar counts the rounds that scored that many cups. The tall bar over 5 holds the guessers who got half of them right, about 2,400 rounds, and there are more of those than of anything else. That is what a coin does.

Move right and the pile thins out fast. Seven turns up around 1,100 times. Eight drops to a bit over 400. Nine and ten are down near the floor of the chart, and you have to look for them.

The red line is Priya, at nine. She is not off the chart. Pure guessing does reach her, it just reaches her rarely. How rarely, exactly? Let's count that next.

=== step === quiz
## Quick check: what is that pile actually made of?

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- Ten thousand rounds that Priya herself played, so the pile shows how well she usually does. ::no
- The ten cups from the kitchen, counted up a different way. ::no
- Ten thousand rounds played by somebody with no ability at all, scored against the same ten cups Priya faced. ::ok That is it. Not one bar in that pile came from Priya. It is a made-up world where the taster is guessing every cup, built on purpose so we can see what guessing alone produces.
- Proof that Priya was guessing, because her nine shows up inside the pile. ::no Every bar in that pile is a round of blind guessing, not a round Priya played, so the pile says nothing about her by itself. We built it to answer one narrow question: how far can luck stretch? Her nine landing out in the thin right tail is the thing we go on to measure, and it is not a verdict on its own.

=== step === concept
## So how often does luck reach nine?

Now let's do the counting, which is shorter than you might expect.

We have ten thousand luck-only scores sitting in `luck_hits`, and we want the rounds that did as well as Priya or better. That means nine or ten. Anything under nine did worse than she did, so it does not count against her.

The "or better" catches people out, because Priya scored nine and not ten. Here is why it belongs. We are asking how easily luck produces an evening this impressive, and a guesser who lands all ten has cleared that bar too. Leave the tens out and you are quietly pretending luck never does better than nine, which would make luck look worse at this than it really is.

```r
# Count the pure-guess rounds that matched or beat Priya's nine
sum(luck_hits >= 9)
#> [1] 120
mean(luck_hits >= 9)
#> [1] 0.012
```

`luck_hits >= 9` turns the ten thousand scores into ten thousand TRUEs and FALSEs. `sum()` counts the TRUEs, and `mean()` writes that same count as a share of all ten thousand.

So 120 rounds out of 10,000 reached her, which as a share comes to 0.012, a little over one in a hundred.

[KEY INSIGHT]
That one number is statistical inference in a single move. Assume the boring explanation is true, replay the evening inside it thousands of times, and count how often luck alone does as well as the real result. Here, luck reached nine about 12 times in every 1,000 attempts.

So a guesser who matches Priya is not impossible, just rare. And rare is something you can act on, which is the thing to sort out next.

=== step === tryit
## Your turn: how often does luck reach seven?

Suppose Priya had called seven right instead of nine. Would the table have owed her an apology?

`luck_hits` still holds the scores of all ten thousand pure-guess rounds. Count the ones that reached seven or more, then write that same count as a share of ten thousand.

```r
# luck_hits holds the score of 10,000 pure-guess rounds of ten cups.
# Count the rounds that reached seven or more,
# then write that count as a share of all 10,000.
# Two lines. Press Check when you have them.
```
::check {"regex": "luck_hits\\s*>=\\s*7", "gate": true, "difficulty": "beginner", "ok": "Right: 1,685 rounds out of 10,000, a share of 0.1685. Blind guessing reaches seven about one time in six, so seven out of ten would have proved nothing at all.", "no": "Use the same two lines as before and move the bar from 9 down to 7: `sum(luck_hits >= 7)`, then the same line with `mean()` in place of `sum()`."}
::solution
```r
# Count the pure-guess rounds that reached seven or more, and the same as a share
sum(luck_hits >= 7)
#> [1] 1685
mean(luck_hits >= 7)
#> [1] 0.1685
```

Seven out of ten sounds impressive right up until you see this. Blind guessing gets there about one round in six, so if Priya had called seven the table would have been right to shrug.

Two cups made all the difference. Nine sits out where luck rarely reaches, whereas seven sits right where luck goes all the time.

=== step === concept
## Is one in a hundred rare enough to call it?

We have the number now. Luck reaches nine about 12 times in 1,000. What we do not have is a rule for what to do about it.

Rare is not a verdict on its own. Somebody has to decide how rare is rare enough before they are willing to say that luck is a poor explanation for what happened. That line is a choice, and it belongs to whoever is running the test.

Three lines get picked most often in practice: one in ten, one in twenty, and one in a hundred, which written as shares are 0.10, 0.05 and 0.01. Let's hold our number up against all three at once.

```r
# Compare the luck-only share against the three bars people pick most often
luck_share <- mean(luck_hits >= 9)
bars <- c(0.10, 0.05, 0.01)

data.frame(
  bar        = bars,
  luck_share = luck_share,
  verdict    = ifelse(luck_share < bars, "luck is a poor explanation", "luck stays on the table")
)
#>    bar luck_share                    verdict
#> 1 0.10      0.012 luck is a poor explanation
#> 2 0.05      0.012 luck is a poor explanation
#> 3 0.01      0.012    luck stays on the table
```

`ifelse()` checks the share against each bar in turn and writes the matching verdict, so all three answers land side by side.

Now look at the bottom row. Same evening, same nine cups, same 0.012, and the answer flips depending on the line you drew.

At one in ten and at one in twenty, luck looks like a poor way to explain Priya. At one in a hundred it does not, because 0.012 sits just above 0.01. One in twenty is the line most fields default to, and there is no deep reason for it. It is a habit somebody started and everybody kept.

[WARNING]
The bar is a decision, not a fact the data hands you. Pick it before the tasting starts and say out loud which one you picked. Choosing it afterwards, once you can see which side of the line you landed on, is how perfectly honest people end up talking themselves into the answer they were hoping for.

=== step === widget
## How the tasting went from a claim to a verdict

Everything that happened in that kitchen was five moves, and they came in a fixed order. It is worth naming them, because the order is what makes the final number mean anything.

::widget process-flow {"steps":[{"title":"Write the claim","sub":"Priya says she can tell Coke from Pepsi by taste"},{"title":"Assume no ability","sub":"the boring explanation: she is guessing every cup"},{"title":"Replay on luck alone","sub":"ten thousand blind rounds against the same ten cups"},{"title":"Count the matches","sub":"how many of those rounds reached nine or better"},{"title":"Compare with the bar","sub":"the line you picked before the tasting began"}]}

Notice the second move, because it is the one people find strange. You do not start by assuming Priya is skilled and then hunt for support. You start by assuming she is not, and then check whether the evening makes that assumption look silly.

So why is it built backwards? Because there is exactly one way to be guessing, so we can build that world precisely and count inside it. There are a thousand ways to be skilled, and no single world you could build.

The fifth move is the only one that is not arithmetic. The first four hand you a number. The last one is you deciding what that number is worth.

=== step === concept
## A t-test asks the same question

::prose-only the five moves already have their diagram directly above, and this maps familiar test names onto that same diagram rather than drawing a new one

Here is the payoff for having done it by hand.

Every test you are going to meet in statistics is those same five moves. What changes is the data and the arithmetic in the middle. The shape never changes.

Take a t-test, which compares two groups. Say you have the average order value from two branches of a store, and one branch is ahead by 90 rupees. The boring explanation is that the two branches are really the same and 90 is a wobble. The luck world is all the ways those same customers could have been dealt out between the two branches, and the count is how often that wobble reaches 90.

An ANOVA runs the same move for three branches or ten instead of two. A chi-squared test runs it for counts in a table instead of averages. A correlation test runs it for two columns that seem to rise and fall together.

Claim, boring explanation, luck world, count, bar. That is the shape every time.

And that is why doing it the slow way is worth the hour. Learn one test as a recipe and you have learned exactly one test. Learn this move and the rest are variations you can reason your way through, including the ones you have never run.

=== step === concept
## Can R skip the ten thousand rounds?

Simulating ten thousand rounds is the honest way to see what the number really is. However, it is not how anybody computes it at work.

For a run of yes-or-no calls like this one, a function like `binom.test()` reaches the same answer exactly, in one line and without simulating anything at all. You hand it the hits, the number of cups, and the chance of being right by guessing.

```r
# Get the same answer straight from R, with no simulation involved
binom.test(her_hits, 10, p = 0.5, alternative = "greater")
#>
#> 	Exact binomial test
#>
#> data:  her_hits and 10
#> number of successes = 9, number of trials = 10, p-value = 0.01074
#> alternative hypothesis: true probability of success is greater than 0.5
#> 95 percent confidence interval:
#>  0.6058367 1.0000000
#> sample estimates:
#> probability of success
#>                    0.9
```

Read the arguments as "nine hits out of ten cups, when a guesser is right half the time". The `alternative = "greater"` part says we only care about doing better than guessing, not worse.

The line to look at is `p-value = 0.01074`. Our ten thousand rounds gave 0.012. The two agree to two decimal places, and neither one is more correct than the other.

So where does that exact 0.01074 come from? There is nothing mysterious in it. Think of a guesser's ten calls, not the pours this time. Since every call is a fifty-fifty choice, those ten calls can come out 1,024 different ways, all equally likely. Ten of those ways get exactly nine cups right and one gets all ten, so eleven of the 1,024 reach Priya or beat her.

```r
# Work out the exact answer by hand: the ways luck reaches nine or better, out of 1,024
ways <- choose(10, 9) + choose(10, 10)
c(ways = ways, out_of = 2^10)
#>   ways out_of
#>     11   1024
round(ways / 2^10, 5)
#> [1] 0.01074
```

Eleven in 1,024. That is the figure the test printed, and it is the figure our ten thousand rounds were circling.

This number has a name, and you have almost certainly met it long before it made any sense. It is the p-value, and it is nothing more exotic than the share you just counted by hand.

=== step === concept
## Would twenty cups have been more convincing?

Here is the question the table should have asked before anybody poured anything. How many cups is enough?

Picture the same evening with twenty cups, and Priya calling eighteen of them right. That is the same accuracy, nine in every ten. Her claim has not changed and her skill has not changed. The only thing that grew is the amount of evidence.

So let's pour twenty and send fifty thousand blind guessers at them.

```r
# Pour twenty cups and play fifty thousand pure-guess rounds against them
set.seed(3)
pours20 <- sample(c("Coke", "Pepsi"), size = 20, replace = TRUE)

luck20 <- replicate(50000, {
  guess <- sample(c("Coke", "Pepsi"), size = 20, replace = TRUE)
  sum(guess == pours20)
})

hist(luck20, breaks = seq(-0.5, 20.5, by = 1), col = "grey85", border = "white",
     main = "50,000 rounds of twenty cups, played by pure guessing",
     xlab = "Cups called right out of twenty")
abline(v = 18, col = "red", lwd = 3)
```

The pile has moved. Its tall bars now sit around ten, which is half of twenty, and the red line at eighteen is far out at the edge where there is barely anything left. Across all fifty thousand rounds, not one guesser managed a clean twenty.

Now set that beside the ten-cup picture, where nine sat close enough to the crowd that you had to squint at it.

Doubling the cups did not make Priya better. It made luck worse at imitating her. That is worth holding on to, because the two are easy to mix up. Nine of ten and eighteen of twenty are the same skill. They are not the same evidence.

=== step === tryit
## Your turn: how often does luck reach eighteen of twenty?

Put a number on it. `luck20` holds the scores of all fifty thousand blind rounds of twenty cups. Count the ones that reached eighteen or more, then write that count as a share of fifty thousand.

```r
# luck20 holds the score of 50,000 pure-guess rounds of twenty cups.
# Count the rounds that reached eighteen or more,
# then write that count as a share of all 50,000.
# Two lines. Press Check when you have them.
```
::check {"regex": "luck20\\s*>=\\s*18", "gate": true, "difficulty": "beginner", "ok": "Yes: 12 rounds out of 50,000, a share of 0.00024. Luck reaches nine of ten about once in a hundred tries, and eighteen of twenty about twice in ten thousand.", "no": "The same two lines as before, pointed at the twenty-cup scores: `sum(luck20 >= 18)`, then the same line with `mean()` in place of `sum()`."}
::solution
```r
# Count the twenty-cup pure-guess rounds that reached eighteen or more, and the share
sum(luck20 >= 18)
#> [1] 12
mean(luck20 >= 18)
#> [1] 0.00024
```

Twelve rounds in fifty thousand. Put that next to the ten-cup answer, where 120 rounds in ten thousand reached nine.

One in a hundred was interesting. Two in ten thousand is the sort of number that ends an argument at a dinner table. Same claim, same accuracy, twice the cups.

=== step === concept
## What made the tasting fair?

::prose-only this is a procedure to follow before any data exists rather than an object to draw, and the five moves it protects already have their diagram

The count we did is only worth something if the evening was set up properly. Three things had to be true before Priya tasted a drop, and each one is easy to get wrong.

- **The pours had to be random.** Every cup was filled on a coin toss, which is the only reason a guesser has an even chance on each one. Fill six with Coke because there was more Coke in the fridge, mention it to Priya, and she can score well by saying Coke a lot.
- **She had to be blind.** No labels, no odd cup out, no watching you pour, and no reactions from the table between calls. Each of those gives her a second way of being right, and then a high score stops meaning the thing we counted.
- **The bar had to go in first.** We picked our line before we knew the answer. Settling on one in a hundred after seeing 0.012, precisely because it lets you keep the answer you liked, is not a decision. It is a story.

There is a fourth trap that catches more people than those three combined. Suppose the table had let Priya taste again and again, and then counted only her best run. The count would be worthless. The world we built assumed ten cups, once. Every extra attempt you throw away is one more chance for luck to hand you a nine.

None of this is arithmetic, and none of it can be repaired afterwards. It is all decided before the first cup is poured, and no amount of careful counting later can rescue an evening that was set up badly.

=== step === concept
## What does that one in a hundred still not tell you?

::prose-only the limits here are about what a claim may and may not say, and the pile of luck-only rounds they refer to is already drawn

We have a number and we have a verdict. Now the fine print, because this is where careful people still overreach.

Let's start with what we are entitled to say. Blind guessing reaches nine of ten about once in a hundred tries. Priya reached nine. So guessing is a poor explanation for what happened at that table. That is the whole claim, and it is a real one.

Here is what it does not say.

It does not say how good Priya is. Our count never measured her ability at all. It measured what a guesser does. Somebody who can tell the two drinks apart every single time, and somebody who can tell them apart three times in four, would both produce a nine often enough, and one evening cannot separate them.

It does not say she will do it again. The next ten cups are a fresh evening with fresh luck in them. She might call all ten. She might call six.

And it does not say there is a one in a hundred chance she was guessing. Read that one twice, because it sounds identical to what we found and it is not. We began by assuming she was guessing, then asked how often that assumption produces a nine. We never asked how likely the assumption itself was, and nothing in the count could have told us.

So the honest sentence, the one you can say out loud at the table without being wrong, is this. If Priya had no ability at all, an evening this good would turn up about once in a hundred tries, and we just watched one.

=== step === quiz
## Quick check: what can you fairly say about Priya's nine?

Priya called nine of ten, and blind guessing reaches nine or better about 12 times in every 1,000 rounds. Which sentence is fair?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- There is about a one in a hundred chance that Priya was guessing. ::no
- If Priya had no ability at all, an evening this good would turn up about once in a hundred tries, so guessing is a poor explanation for what we saw. ::ok Exactly right. It assumes the boring explanation first, then reports how ordinary Priya's evening would be inside it. That is the only direction this count ever runs.
- Priya gets about nine of ten right, so she can tell the drinks apart roughly 90% of the time. ::no
- The evening proves Priya can taste the difference. ::no Three of these four claim more than the count can support. Two of them put odds on Priya, either on her being a guesser or on her true ability, and neither was ever measured; the count only ever describes a world where she is guessing. The third treats one evening as proof, when a rare result makes luck a poor explanation without making anything certain.

=== step === concept
## References

- [The Design of Experiments](https://archive.org/details/in.ernet.dli.2015.502684) - Fisher (1935). Chapter 2 sets out the tasting experiment this evening is built on: cups poured at random, then counted against what chance alone would manage.
- [The Lady Tasting Tea](https://openlibrary.org/works/OL4274440W) - Salsburg (2001). The story of the afternoon behind Fisher's chapter, and how one question at a tea table reshaped the way experiments are designed.
- [The Introductory Statistics Course: A Ptolemaic Curriculum?](https://doi.org/10.5070/T511000028) - Cobb (2007), Technology Innovations in Statistics Education 1(1). The case for teaching inference by counting luck-only outcomes before any formula arrives.
- [Introduction to Statistical Investigations](https://www.isi-stats.com/isi/) - Tintle, Chance, Cobb, Rossman and colleagues. A full course built on the move you just made.
- [Exact binomial test](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/binom.test.html) - R Core Team, the documentation for `binom.test()`.

=== step === complete
## Quick recap

You settled a bet at a dinner table by building the boring world where Priya is guessing every cup, and then counting inside it. To summarize:

- The question was never whether nine of ten sounds impressive. It was how often blind luck manages nine.
- You built the luck-only world by hand: ten thousand rounds of pure guessing against the same ten cups.
- You counted the rounds that matched Priya or beat her. 120 out of 10,000, a share of 0.012, and `binom.test()` put the exact figure at 0.01074, which is eleven ways out of 1,024.
- You picked a bar and watched the verdict move with it, which is exactly why the bar goes in before the tasting starts.
- You poured twenty cups instead of ten and watched the same accuracy turn into far stronger evidence: 12 rounds in 50,000.

Five moves, every time. Write the claim, assume no ability, replay on luck alone, count the matches, compare with the bar.

Every test you are ever going to run is those same five moves in different clothes. A t-test, an ANOVA, a chi-squared test: the data changes, the arithmetic in the middle changes, and the shape holds.

So the next time a result lands on your desk, you have one question to ask of it. How often would luck alone have done this well?

Next time we take the number this count produced, the p-value, and go after everything people get wrong about it.
