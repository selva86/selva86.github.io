---
title: "How statistical inference works, no formulas yet"
slug: "Inference-Mini-1-v2"
catalog_blurb: "How to tell a real effect from a lucky streak."
description: "Priya calls nine of ten cups right by taste. Skill or luck? Build the guessing world in R, count what luck alone manages, and read the answer properly."
keywords: "statistical inference, how inference works, statistics for beginners, simulation in R, p-value intuition, R"
date: "2026-08-18"
post_type: "LESSON"
curriculum_id: "0.0.1"
lesson_access: "windowed"
course_id: "inference-from-zero"
course_title: "Inference from Zero"
course_lesson: "1"
course_total: "7"
course_landing: "/dashboard.html"
course_next: "Inference-Mini-2"
webr: true
mathjax: false
---

=== step === cover
::eyebrow Part 1 of 7
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

Press the buttons below. Every bar you get in the output is a real round of ten pure-guess calls, played right now in front of you, and the orange bars are the rounds where luck alone did as good as Priya or better.

::widget luck-simulator {"trials": 10, "p": 0.5, "observed": 9, "unit": "correct calls", "seed": 42}

By the end you will be able to:

- Say why nine right out of ten, on its own, does not settle anything
- Build the guessing world in R and know how often you get a result that good
- Read the answer correctly, and say plainly what it does not mean
- Tell what a middling score settles, and why a bigger test cures two mistakes at once
- Name what has to be true about an experiment before any of this is honest
- Apply the method somewhere else entirely, to a dog picking a hand and to a classroom where nothing is right or wrong

**What you need first:** you can read a simple R script, so a variable, a function call and a comparison like `x >= 9` are familiar. No statistics at all is assumed. We will build the intuition here from scratch.

=== step === concept
::eyebrow The problem
## Two stories fit the same nine cups

Here is the awkward part of that evening. All you are holding is a single number, nine, and two completely different stories both end with that number.

- **Priya really can taste the difference.** Her tongue does the work, she calls nine of the ten cups correctly, and the one she got wrong had been standing long enough to go warm and flat.
- **Priya was guessing the whole way and got lucky.** No ability at all, ten coin flips inside her head, and the flips happened to fall well.

Nothing inside the number nine tells you which of those two you are looking at, and staring at it longer does not help, because nine looks exactly the same in both stories.

Now think back to the moment you read the bet. You probably thought something along the lines of "nine is a lot, but a guesser could get lucky". Hold on to that thought, because that is already statistical inference. Everything we do from here only makes that instinct precise enough to put a number on.

And none of this is really about drinks. The same shape turns up in every argument anybody has ever had with data. A drug trial ends with more recoveries in the group that got the drug, somebody points at the gap and calls it real, and the same doubt has been sitting there the whole time: what if nothing was going on and the numbers simply fell that way? A teacher comparing this year's exam results against last year's is in exactly that position, and so is a shop owner comparing Saturday takings before and after a price change.

[KEY INSIGHT]
A result does not speak for itself. It becomes evidence only once you know what the boring explanation would have produced.

::prose-only two rival explanations of one number are not a structure, a process or a boundary, so the catalog has no archetype for them, and the bars on the cover already showed what the lucky-guesser story can produce.

=== step === concept
::eyebrow The move
## Take the boring story seriously

You cannot break the tie by staring at the nine, so let's try the opposite. Take the story you are least excited about, the one where Priya is guessing, and follow it wherever it leads.

Pretend for a minute that Priya cannot taste the slightest difference between the two drinks. What follows from that? There are two drinks and she has no way of telling them apart, so when a cup arrives she has nothing to go on and may as well toss a coin in her head. Right half the time, wrong half the time, ten cups in a row. And each cup stands on its own, because getting cup three wrong tells her nothing at all about cup four.

Let's call that the guessing world.

It is a made-up world. However, it is a completely specific made-up world, and being specific is what makes it useful. You can build it in R, play it thousands of times, and watch exactly what it tends to produce.

Then you compare. If the guessing world hands out nine-or-better all the time, Priya's nine is nothing to write home about. If it hardly ever does, then the guessing story is straining badly to explain what everyone watched happen at that table.

That is the core idea, and it comes down to three moves: take the boring story, build the world it implies, then count. The diagram below lays them out underneath the claim you walked in with.

::widget process-flow {"steps":[{"title":"The claim","sub":"Priya says she can tell Coke from Pepsi by taste"},{"title":"The boring story","sub":"pretend she is guessing, so each cup is a coin flip"},{"title":"Build that world","sub":"play thousands of pure-guess rounds of ten cups"},{"title":"Count and decide","sub":"how often did luck alone reach nine or more"}]}

=== step === quiz
::eyebrow Check yourself
## Where the reasoning starts

So you want to judge Priya's nine correct cups. Which assumption do you make first, before you touch any data at all?

::quiz {"correct":2,"gate":true,"difficulty":"beginner"}
- Assume Priya really can taste the difference, then check whether nine out of ten fits with that
- Assume Priya is guessing, then work out how often guessing alone reaches nine or more ::ok That is the move, and it does feel backwards the first time. You take the explanation you are least excited about, build the world it implies, and then watch how hard that world has to work to produce what you actually saw at the table.
- Work out the probability that Priya has the skill, given that nine cups came back correct ::no Both of those start at the wrong end. Assuming Priya really can taste the difference settles nothing, because nine out of ten sits comfortably inside the guessing story too, and that ambiguity is the exact thing you are trying to break. And working backwards from nine cups to the probability that Priya has the skill is the number everybody wants, but it needs something those ten cups simply do not contain.

=== step === concept
::eyebrow In R
## Play one round of the guessing world

Let's build that imaginary guesser. One round of the guessing world is ten calls, each one right or wrong with an even chance, so all R has to do is draw ten slips out of a bag holding one slip that says "correct" and one that says "wrong".

```r
set.seed(1)
cups <- sample(c("correct", "wrong"), size = 10, replace = TRUE)
cups
#>  [1] "correct" "wrong"   "correct" "correct" "wrong"   "correct" "correct"
#>  [8] "correct" "wrong"   "wrong"

sum(cups == "correct")
#> [1] 6
```

Four things happen there, and none of them stays mysterious for long.

`c("correct", "wrong")` is the bag, holding one slip of each kind. `size = 10` says draw ten times, once per cup. `replace = TRUE` puts the slip back in the bag after every draw, which is what keeps each cup an independent coin flip instead of emptying the bag after two draws. And `set.seed(1)` pins down R's random numbers so that your ten draws come out identical to the ones printed above, which turns this into something you can check rather than something you have to take on trust.

If the output looks cluttered, the `[1]` and `[8]` at the start of the two lines are only R keeping count for you. They say "this line starts at draw number 1" and "this one starts at draw number 8", and they are not part of the result.

The last line does the counting. `cups == "correct"` compares all ten draws against the word "correct" and hands back ten TRUE or FALSE answers, then `sum()` adds those up, counting every TRUE as one.

Six out of ten, from somebody with no ability whatsoever. That is worth holding on to.

=== step === concept
::eyebrow Once is not enough
## One round tells you nothing, so play twenty

That round happened to land on six, but run it again and you get something else, because it is a random world and one draw from a random world is an anecdote about it. Anecdotes are what got us into this argument in the first place. What we want is the full range of what guessing is capable of.

So let's wrap the round up in a function and call it as often as we like.

```r
play_one_game <- function() {
  calls <- sample(c("correct", "wrong"), size = 10, replace = TRUE)
  sum(calls == "correct")
}

set.seed(2026)
replicate(20, play_one_game())
#>  [1] 6 5 3 5 5 5 7 8 5 4 7 7 6 3 8 5 5 2 4 4
```

`play_one_game()` is nothing more than the two lines you just read, packed into something reusable: draw ten cups, count the correct ones, hand back that count. `replicate(20, play_one_game())` then runs it twenty separate times and gathers the twenty scores together in one place, which is the row of numbers underneath.

Read those twenty numbers as twenty different people who cannot taste a thing. Most of them landed on 4, 5 or 6, which is what you would expect when half of ten is five. But look at the eighth number and the fifteenth. Two of these people got as far as 8, and if either of them had been the only one you watched, you would probably have walked away impressed.

None of the twenty reached nine. Twenty rounds is a hint though, not an answer, because saying anything solid about an event that might happen once in a hundred tries takes a great deal more than twenty tries.

=== step === widget
::eyebrow Feel it
## Watch the shape settle

You met this picture on the cover, back when the bars did not mean anything yet. Now they do. One bar is one run of the `play_one_game()` function you wrote two steps ago, so it is ten cups called by somebody with no ability at all, and the number underneath it is how many of those ten came back correct.

Press **Run 1 game** a few times and watch the results drop in one at a time. Then press **Run 100**. Then **Run 1,000**.

Here is the thing to watch for, because it is easy to miss while you are enjoying the bars. One game is unpredictable, twenty games still look like noise, but somewhere in the hundreds the same shape starts appearing every single time: a tall middle around five that slopes away on both sides and thins right out at the edges. Press Reset and build it again and back it comes.

That steadiness is what makes counting worth doing at all. If the picture kept changing shape every time you built it, counting anything in it would settle nothing.

The two orange bars are the ones we care about. They are the rounds where pure guessing reached nine or ten, which is to say the rounds where luck alone did as well as Priya or better. The line underneath keeps a running count of how often that has happened out of everything you have played so far. Push it past a few thousand rounds and watch that percentage stop bouncing around and park itself near one percent.

::widget luck-simulator {"trials": 10, "p": 0.5, "observed": 9, "unit": "correct calls", "seed": 42}

=== step === concept
::eyebrow The whole pile
## What luck usually manages

The bars give you the feel of the shape. Now let's write it out exactly, because a picture you eyeball and a tally you can read are two different things.

Fifty thousand rounds of ten cups, every one of them played by a guesser with no ability at all.

```r
set.seed(7)
scores <- replicate(50000, play_one_game())
table(scores)
#> scores
#>     0     1     2     3     4     5     6     7     8     9    10
#>    46   480  2235  5860 10353 12069 10413  5855  2162   469    58
```

`table()` counts how many rounds finished on each score, so this row of numbers is that same picture written out longhand. The top line is the score, from 0 to 10, and the line under it is how many of the fifty thousand rounds finished there.

Read it slowly from the left, because most people jump straight to the far right and miss what the middle is saying. Only 46 rounds out of fifty thousand got every single cup wrong. 12,069 rounds landed on five, which is the most common outcome of the lot and exactly what you would expect from a coin. Then the counts fall away quickly on both sides: 10,353 landed on four, 5,860 on three, 2,235 on two.

Now the right-hand edge, where Priya is. 2,162 rounds reached eight, 469 reached nine, and 58 got all ten right.

So luck does reach Priya's score. It does not reach it often, and those five falling columns are where you can see how rarely.

=== step === concept
::eyebrow The number
## From a pile of games to a single number

Fifty thousand numbers is far too many to look at, so let's squeeze the whole pile into the one number the question at the dinner table actually needs: how often did guessing alone reach nine or more?

Notice the "or more" in that sentence, because it is easy to read straight past. Priya got exactly nine, so why count the rounds where a guesser managed all ten as well?

Because the question is whether her evening was surprising, and a guesser who calls all ten has done even better than she did. Leaving those rounds out would come to saying that a perfect ten is less impressive than a nine. So the honest count is every round that matched her or beat her.

One small piece of R first, because it is about to do all the work. When you compare things in R you get TRUE and FALSE back, and `mean()` of TRUE and FALSE values gives you the share that are TRUE, because R counts every TRUE as one and every FALSE as zero.

```r
c(TRUE, FALSE, TRUE, TRUE)
#> [1]  TRUE FALSE  TRUE  TRUE

mean(c(TRUE, FALSE, TRUE, TRUE))
#> [1] 0.75
```

Three TRUEs out of four came back as 0.75, which is exactly what you would want the word "share" to mean. Keep that in your pocket for the next block.

```r
sum(scores >= 9)
#> [1] 527

mean(scores >= 9)
#> [1] 0.01054
```

`scores >= 9` puts the same question to all fifty thousand rounds at once: did this one reach nine or more? That hands back fifty thousand TRUE or FALSE answers, so `sum()` counts the yeses and `mean()` turns that count into a share of the whole, exactly as it did on the four values a moment ago.

And there is the answer to the question you asked at the table. Out of fifty thousand rounds of pure guessing, 527 of them managed nine or more, which comes to 0.01054, or about one round in a hundred.

=== step === tryit
::eyebrow Your turn
## What if the score had been eight?

Let's say Priya had missed two cups instead of one and finished on eight. Would that still be interesting?

You do not need to simulate anything new to find out, because all fifty thousand rounds are already sitting in `scores`. You only need to count a different set of them, the rounds where luck reached eight or more. Fill in the blank, then press Check.

```r
mean(scores >= ____)
```
::check {"regex":"scores\\s*>=\\s*8","gate":true,"difficulty":"beginner","ok":"Yes, and it comes out at about 0.054, so roughly one guessing round in twenty. Eight-or-more is a wider net than nine-or-more, so more of the rounds fall inside it and the result gets that much less impressive.","no":"You want every round that reached eight or more, so the comparison to write is scores greater than or equal to 8."}
::solution
```r
mean(scores >= 8)
#> [1] 0.05378
```

=== step === concept
::eyebrow The decision
## What one percent actually buys you

About one round in a hundred. Let's sit with that for a second, because what it lets you say is a good deal narrower than most people assume, and a little stranger too.

You watched something happen at that table. If Priya was guessing, then what you watched belongs to a group of outcomes that turns up about once in every hundred attempts, which leaves you holding exactly two possibilities and needing to pick one:

- A one-in-a-hundred coincidence happened, in front of you, on the single evening somebody made the claim.
- The assumption you fed into the simulation is wrong, and Priya was not guessing.

Neither of those is proof of anything. Not the clean answer you were hoping for, I know.

The first one is perfectly possible, because one-in-a-hundred things happen constantly. They just do not usually happen on cue. What has changed since the start of the evening is that the guessing story now has to do real work to stay standing, and the harder it has to work, the less comfortable you should be leaning on it.

[KEY INSIGHT]
A statistical test never tells you which story is true. It tells you how hard the boring story has to strain to explain what you saw, and then it hands the decision back to you.

Notice what is deliberately missing here. There is no pass mark, no line at which the strain officially becomes too much to bear. Statistics does have a customary line and you will meet it in part 5, but somebody agreed on that line by convention. The counting itself never hands it to you. For now, read the number as strain, and the smaller it gets the harder the guessing story is straining.

::prose-only this step is a way of reading a number the bars at step 7 already showed, so there is no new object to draw.

=== step === concept
::eyebrow Honesty
## Three things that number does not say

Saying that one percent correctly takes some care, because three tempting readings of it are all wrong, and they are wrong in ways that cause real damage in published work.

1. **It is not the probability that Priya was guessing.** The simulation was handed "Priya is guessing" as an assumption and never once questioned it, so it cannot possibly report back on how likely that assumption was. Going the other way, from a result to the odds that a claim is true, needs to know how plausible the claim was before anybody poured a drink, and nothing in those ten cups measures that.
2. **It does not prove that Priya has the skill.** All it says is that guessing is a strained explanation for what happened at the table. Strained explanations are sometimes the correct ones. If enough people around the world run a ten-cup taste test tonight, a few of them will hit nine out of ten while guessing, purely because a one-in-a-hundred event needs about a hundred tries.
3. **It says nothing about how good Priya's palate is.** One percent is not a score, or a rating, or a measure of ability. Somebody who is right 95 percent of the time and somebody who is right 75 percent of the time could both have produced this evening's nine, and the one percent cannot tell the two of them apart.

That first one comes up in interviews more often than you would expect, so it is worth being able to say out loud without stumbling.

::prose-only these are three statements about a number, not objects with a shape.

=== step === quiz
::eyebrow Check yourself
## Say the number out loud

Your count found that pure guessing reaches nine or more about one percent of the time. Which of these sentences says that correctly?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- There is a 1 percent chance that Priya was guessing
- There is a 99 percent chance that Priya can really taste the difference
- If Priya were guessing, a result this good or better would turn up about one time in a hundred ::ok Exactly right, and notice how carefully that sentence is put together. The one percent belongs to the guessing world, because the guessing world is the only thing you ever counted. You assumed guessing and asked what it produces, so the answer can only be a statement about what guessing produces.
- Priya is 99 percent accurate at telling the two drinks apart ::no Each of those turns the number into a claim about Priya, and it cannot be one. The counting happened inside the guessing world, so the one percent is a fact about that world: guessing reaches nine or more roughly once in a hundred rounds. Turning it around into a probability about Priya herself needs to know how plausible her claim was before anybody poured the first cup, and those ten cups say nothing at all about that.

=== step === concept
::eyebrow The other outcome
## What if Priya had got seven right?

Let's run the evening that did not happen. Same method, same fifty thousand rounds, a different result to judge: Priya finishes on seven out of ten instead of nine.

```r
mean(scores >= 7)
#> [1] 0.17088
```

About 17 percent, so roughly one guesser in every six reaches seven or better. In other words, somebody with no ability at all will hand you a seven often enough that you would run into one at plenty of dinner parties, and nobody at those parties should be impressed.

Notice that nothing about the method changed. Same fifty thousand rounds, same comparison, read the same way. All that changed is the result being judged, and the answer went from "guessing has to strain" to "guessing does this constantly". That is exactly why you want a method rather than a gut feeling, because a method treats the flattering result and the boring one identically.

The picture below is the same guessing world, with the orange region now covering every round that reached seven or more. Look how much wider it is.

::widget luck-simulator {"trials": 10, "p": 0.5, "observed": 7, "unit": "correct calls", "seed": 11}

=== step === concept
::eyebrow The gradient
## How fast luck runs out

That is two scores judged now, and a pattern is forming. So let's do the same count for every score Priya might have come home with, from six all the way up to ten.

```r
bars <- 6:10
data.frame(at_least = bars,
           share_of_guessing_games = sapply(bars, function(k) mean(scores >= k)))
#>   at_least share_of_guessing_games
#> 1        6                 0.37914
#> 2        7                 0.17088
#> 3        8                 0.05378
#> 4        9                 0.01054
#> 5       10                 0.00116
```

`sapply` runs the same count once for each value in `bars`, so the first line is `mean(scores >= 6)`, the second is `mean(scores >= 7)`, and so on down to ten. Nothing new was simulated here. These are the same fifty thousand rounds, counted five different ways.

Read that second column downward. Six or better happens in 38 percent of guessing rounds, which is nearly half of them. Seven drops it to 17 percent, eight to 5 percent, nine to 1 percent, and ten to roughly one round in a thousand. Each extra correct cup makes the share several times smaller, and the drop gets steeper the higher you climb: going from six to seven roughly halves it, while going from nine to ten cuts it by a factor of nine.

So evidence is not a switch that flips somewhere between eight and nine. It is a slope, and Priya's nine happens to sit a long way down it.

::widget chart-plotter {"data":[{"x":"6","y":0.37914},{"x":"7","y":0.17088},{"x":"8","y":0.05378},{"x":"9","y":0.01054},{"x":"10","y":0.00116}],"geoms":["bar"],"x":"at_least","y":"share"}

=== step === concept
::eyebrow The other way to be wrong
## The test can also miss someone who is genuinely good

So far we have worried in one direction only, about luck being mistaken for skill. The mistake runs the other way too, and it is easy to show, because we can simulate a taster who genuinely has ability.

Let's say Priya is good but not superhuman: right about eight times out of ten, so real skill with real slip-ups. To play that world we need the same helper as before with one thing added, a dial for how often the taster is right.

```r
play_n_cups <- function(n, chance_right = 0.5) {
  calls <- sample(c("correct", "wrong"), size = n, replace = TRUE,
                  prob = c(chance_right, 1 - chance_right))
  sum(calls == "correct")
}

set.seed(5)
skilled <- replicate(50000, play_n_cups(10, chance_right = 0.8))
mean(skilled >= 9)
#> [1] 0.37394

mean(skilled >= 8)
#> [1] 0.67664
```

Two small mechanics before the number. Writing `chance_right = 0.5` in the definition makes 0.5 the default, so `play_n_cups(10)` with nothing else typed is still the guessing world you already know, and passing `chance_right = 0.8` is the good taster. `prob = c(chance_right, 1 - chance_right)` tilts the bag: the first slip, "correct", comes up 80 percent of the time and "wrong" the other 20.

Now look at that first number, because it is not the one people expect. A genuinely skilled taster, right eight times in ten, clears the nine-out-of-ten bar only 37 percent of the time.

Surprising, right?

So on more than six evenings out of ten, real ability lands on eight or fewer and nobody at the table is impressed. Which means "the result was unremarkable" and "there is nothing there" are two very different statements, and ten cups is nowhere near sharp enough to tell them apart. Choosing an experiment big enough to catch the ability you care about has a name, power analysis, and it is part 4 of this course.

And here is the uncomfortable overlap, sitting right on the score we counted a moment ago. Eight-or-better turns up in about one guessing round in twenty, while eight is also the good taster's most ordinary evening, cleared 68 percent of the time. Both stories are at home around eight, so a score of eight on ten cups settles nothing at all.

The picture below is the skilled taster's world rather than the guessing world. Every bar is one of her ten-cup attempts, and the orange region is the share of those attempts that reach Priya's nine.

::widget luck-simulator {"trials": 10, "p": 0.8, "observed": 9, "unit": "correct calls", "seed": 8}

=== step === concept
::eyebrow Size matters
## Ten cups is a small experiment

Ten cups is not many, and you can see precisely what that costs by running the same evening at a bigger scale.

Let's hold the performance fixed at 90 percent of the cups called correctly and change only the number of cups. Nine out of ten, eighteen out of twenty, forty five out of fifty. Then ask the guessing world how often luck alone manages each one.

```r
set.seed(99)
sizes <- c(10, 20, 50)
reaches_90 <- sapply(sizes, function(n) mean(replicate(20000, play_n_cups(n)) >= 0.9 * n))
data.frame(cups = sizes, luck_reaches_90_percent = reaches_90)
#>   cups luck_reaches_90_percent
#> 1   10                 0.01035
#> 2   20                 0.00020
#> 3   50                 0.00000
```

`play_n_cups(n)` is the helper from the last step called without a `chance_right`, so it falls back to its default of 0.5 and we are in the guessing world again. For each of the three sizes we play twenty thousand rounds and count the ones that reached 90 percent of their cups, which is what `0.9 * n` works out for each size.

On ten cups, luck manages it about once in a hundred rounds, and that is Priya's evening. On twenty cups it drops to two rounds in ten thousand. On fifty cups it did not turn up once in twenty thousand rounds, and let's say that honestly, because not happening in twenty thousand tries is not the same thing as impossible.

That collapse is why the size of an experiment matters so much. A short experiment is easy for luck to do well on, since there are only so many ways ten coin flips can land and a handful of them look brilliant. Ask luck to keep the same streak going over fifty cups and it almost never manages. So when somebody shows you a result built on a handful of observations, that handful is the first thing to ask about.

The picture below is the twenty-cup version of Priya's evening: every bar is twenty pure-guess calls, and the orange region is the rounds that reached eighteen or more.

::widget luck-simulator {"trials": 20, "p": 0.5, "observed": 18, "unit": "correct calls", "seed": 5}

=== step === concept
::eyebrow Both mistakes at once
## A bigger test also stops missing the good taster

Growing the experiment did something useful to the lucky guesser. Now let's check what it does to the good taster from two steps ago, because a bigger test would not be worth much if it fixed one mistake by making the other one worse.

Here is the setup. For each size, pick a bar that pure guessing reaches only about one time in a hundred, which for ten cups is Priya's nine. Then ask how often the eighty-percent taster clears that same demanding bar.

```r
set.seed(101)
luck_reaches <- c(
  mean(replicate(20000, play_n_cups(10)) >= 9),
  mean(replicate(20000, play_n_cups(20)) >= 16),
  mean(replicate(20000, play_n_cups(50)) >= 34)
)

good_taster_reaches <- c(
  mean(replicate(20000, play_n_cups(10, chance_right = 0.8)) >= 9),
  mean(replicate(20000, play_n_cups(20, chance_right = 0.8)) >= 16),
  mean(replicate(20000, play_n_cups(50, chance_right = 0.8)) >= 34)
)

data.frame(cups = c(10, 20, 50),
           bar = c(9, 16, 34),
           luck_reaches = luck_reaches,
           good_taster_reaches = good_taster_reaches)
#>   cups bar luck_reaches good_taster_reaches
#> 1   10   9      0.01060             0.38090
#> 2   20  16      0.00600             0.62790
#> 3   50  34      0.00825             0.98615
```

That is six counts, written one line per size so you can read each one straight off the page. The top three lines are the guessing world at ten, twenty and fifty cups; the next three are the eighty-percent taster at the same three sizes.

The `luck_reaches` column is there to show the three bars are fair. All three sit around one in a hundred for a pure guesser, so the good taster is being asked to clear an equally hard bar every time. Nine on ten cups is the same kind of ask as sixteen on twenty and thirty four on fifty.

Now read the last column, which is the good taster. On ten cups she clears the bar 38 percent of the time, so most evenings she walks away looking ordinary and the table shrugs. On twenty cups she clears it 63 percent of the time. On fifty cups she clears it 99 percent of the time, which means she is essentially never missed.

That is one change fixing both mistakes at once. The same growth that made it much harder for luck to reach the bar also made real ability much harder to overlook, and nothing was traded away to get it.

::widget chart-plotter {"data":[{"x":"10","y":0.38090},{"x":"20","y":0.62790},{"x":"50","y":0.98615}],"geoms":["bar"],"x":"cups","y":"good_taster_reaches"}

=== step === quiz
::eyebrow Check yourself
## Seven out of ten, and what it settles

A second friend, Arun, takes the same ten-cup test after Priya and gets seven right. What can you honestly say about Arun?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- Arun has no ability, since seven is not a rare score for a guesser
- Arun has some ability but less than Priya, since seven is below nine
- Not much either way, because ten cups is too small a test to separate the two stories at seven ::ok Right, and both counts are already on this page. Seven or better turns up in about one guessing round in six, so it is nothing special for a guesser. But a genuinely good taster drops to seven or fewer about a third of the time, so it is nothing special for her either. The honest finding is about the test, not about Arun.
- Arun and Priya are equally likely to be guessing ::no Both of those read a middling score as a verdict. Seven is an ordinary score for a guesser and also an ordinary bad evening for a taster who really can tell the drinks apart, so the score does not point either way. What you have found out is that ten cups is too small an experiment to tell you anything about Arun.

=== step === concept
::eyebrow When the whole thing breaks
## Your pretend world has to match the real one

Every number so far rests on one assumption: that a guesser gets each cup right half the time, independently, ten times over. That assumption is not automatic. It holds only because of the way those cups were poured, and there are four ordinary-looking ways to break it.

- **The pour was not decided at random.** A coin toss per cup is what makes each cup a genuine fifty-fifty call. Pour five of each because it feels tidier and the later cups stop being coin flips.
- **Priya could see or hear the pour.** If the Coke bottle hisses when it opens, half the cups are not a coin flip any more, and the guessing world is describing an evening nobody was actually in.
- **She was told the totals beforehand.** Announce that exactly five cups are Coke and a guesser who simply keeps count does better than a coin flip as she goes, because by cup nine she may already know what has to be left. Her ten calls are then not ten independent coin flips, which is precisely what the counting assumed they were.
- **The test was re-run until a good score turned up.** Ten cups was decided in the kitchen, before the first sip, not settled afterwards once everyone saw how it was going.

[WARNING]
That last one is the assumption that quietly ruins real experiments. "Keep tasting until it looks convincing" is a completely different experiment from "do exactly ten and stop", and the ten-cup count says nothing whatsoever about the first one. Whenever the decision to stop collecting data depends on how the results are going, the number you report is not the number you think it is.

Notice that none of these four is cured by pouring more cups. A bigger experiment fixed the two problems in the last few steps, whereas a pretend world that does not match how the cups were actually poured is broken at any size.

::prose-only what breaks here is a fact about how an experiment was run, not a structure or a process with a shape.

=== step === quiz
::eyebrow Check yourself
## Which change breaks the pretend world

The evening gets run again with one small change. Which of these changes means the guessing world is no longer a fair stand-in for what happened?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The cups are poured in a different room from the one Priya waits in
- Priya is told beforehand that exactly five of the ten cups are Coke ::ok That is the one. Once she knows the totals, a guesser can keep count as she goes, so her later calls lean on the earlier ones and the ten calls stop being ten independent coin flips. The counting assumed independence, so the number it produces no longer describes her evening.
- Priya drinks a glass of water between cups to clear her palate
- Priya calls the cups in a different order from the one they were poured in ::no Those changes leave the guessing world intact. Pouring in another room, sipping water and calling the cups in a different order all keep each cup an independent fifty-fifty call, which is the only thing the simulation ever assumed. What breaks it is anything that lets one call lean on another, or that leaks information about what is in the cup.

=== step === concept
::eyebrow Somewhere else
## The same three moves, a different claim

Time to take the method somewhere with no drinks in it.

Let's say a volunteer at a dog shelter tells you that Bruno, a retriever who has been there a couple of months, can smell which closed hand holds the treat. So you try it. Fifteen times you put the treat in one hand or the other, deciding by a coin toss each time, and hold out both fists. Bruno picks the right hand twelve times.

Twelve out of fifteen feels much like nine out of ten, and it comes with the same doubt sitting underneath it.

Move one, the boring story: pretend Bruno cannot smell a thing and is just choosing a hand, so each try is a coin flip. Move two, build that world in R. Move three, count how often it reaches twelve.

```r
play_dog_game <- function() {
  choices <- sample(c("right", "wrong"), size = 15, replace = TRUE)
  sum(choices == "right")
}

set.seed(3)
dog <- replicate(50000, play_dog_game())
```

That is fifty thousand rounds of fifteen coin-flip choices now sitting in `dog`, and notice the function is Priya's with two words changed: fifteen instead of ten, "right" instead of "correct". Nothing has been counted yet, because the counting is yours in the next step.

Here is the same four-box recipe, with Bruno's words in it.

::widget process-flow {"steps":[{"title":"The claim","sub":"Bruno picks the hand with the treat, 12 of 15"},{"title":"The boring story","sub":"pretend he is guessing, so each try is a coin flip"},{"title":"Build that world","sub":"play fifty thousand rounds of fifteen choices"},{"title":"Count and decide","sub":"how often did random choosing reach twelve"}]}

=== step === tryit
::eyebrow Your turn
## Count how often luck gets twelve of fifteen

Your turn to finish it. The fifty thousand random-choosing rounds are in `dog`, and Bruno's real result was twelve right out of fifteen.

Count the rounds that matched Bruno or beat him. Fill in the blank, then press Check.

```r
mean(dog >= ____)
```
::check {"regex":"dog\\s*>=\\s*12","gate":true,"difficulty":"beginner","ok":"That is it, and it comes out at about 0.018. Random choosing reaches twelve or more in roughly one round in fifty five, so this is the same kind of answer Priya got: possible under the boring story, but the boring story is straining.","no":"You are counting the rounds that matched Bruno's real result or beat it, and his real result was twelve, so the comparison is dog greater than or equal to 12."}
::solution
```r
mean(dog >= 12)
#> [1] 0.01794
```

=== step === concept
::eyebrow A different kind of data
## Twenty four children and two ways of teaching fractions

Priya's evening and Bruno's fifteen tries both came down to counting right answers, which made the boring story easy to describe: a coin flip, over and over. Most results you meet in real work are not like that.

Let's say Kavya runs a small tuition centre. She has always taught fractions the usual way, with rules on the board, and this term she wants to try a different way that starts with folding paper into pieces. Twenty four children, split into two groups of twelve by drawing names out of a bowl. Twelve learn the usual way, twelve learn the new way, and at the end everyone sits the same test, marked out of twenty.

Nothing here is right or wrong to count. What comes back is twenty four marks.

The twelve taught the usual way scored 11, 14, 9, 13, 12, 10, 15, 8, 12, 13, 11 and 10. The twelve taught the new way scored 13, 12, 15, 11, 14, 11, 16, 12, 13, 12, 15 and 12.

The chart below draws each group as a box. The line inside a box is the middle mark of that group, half the children scored above it and half below. The box itself covers the middle half of the group, and the whiskers reach out to the rest. So a box sitting higher up means that group generally did better.

The new-way box does sit a little higher. However, the two boxes overlap a good deal, which is why nobody should be announcing anything yet.

::widget chart-plotter {"data":[{"x":"old way","y":11},{"x":"old way","y":14},{"x":"old way","y":9},{"x":"old way","y":13},{"x":"old way","y":12},{"x":"old way","y":10},{"x":"old way","y":15},{"x":"old way","y":8},{"x":"old way","y":12},{"x":"old way","y":13},{"x":"old way","y":11},{"x":"old way","y":10},{"x":"new way","y":13},{"x":"new way","y":12},{"x":"new way","y":15},{"x":"new way","y":11},{"x":"new way","y":14},{"x":"new way","y":11},{"x":"new way","y":16},{"x":"new way","y":12},{"x":"new way","y":13},{"x":"new way","y":12},{"x":"new way","y":15},{"x":"new way","y":12}],"geoms":["boxplot"],"x":"method","y":"marks"}

=== step === concept
::eyebrow One number
## The gap is one and a half marks

Priya's whole evening compressed into one number, and that number was nine. Kavya's classroom needs the same treatment, because two clouds of twelve marks are hard to argue about until you can point at a single figure.

The obvious figure is the difference between the two averages.

```r
old_way <- c(11, 14,  9, 13, 12, 10, 15,  8, 12, 13, 11, 10)
new_way <- c(13, 12, 15, 11, 14, 11, 16, 12, 13, 12, 15, 12)

mean(old_way)
#> [1] 11.5

mean(new_way)
#> [1] 13

mean(new_way) - mean(old_way)
#> [1] 1.5
```

One and a half marks in favour of the new way. That gap is Kavya's nine out of ten: the single number the rest of the argument is about.

And the same doubt arrives with it. Twenty four children is not many, the two groups were filled by drawing names out of a bowl, and any draw of names gives one group a few of the stronger children by pure chance. So one and a half marks might be the paper folding, or it might be the bowl.

=== step === concept
::eyebrow The boring story again
## What the boring story says when there are no right answers

Move one, in Kavya's terms this time. What does the boring story even mean when there is nothing to get right?

If the new way made no difference whatsoever, then every child would have scored exactly what they scored no matter which group they had landed in. The child who got 16 would have got 16 either way. The child who got 8 would have got 8 either way.

In other words, the twenty four marks were already settled, and the only thing chance handed out that term was the labels. Names came out of a bowl, twelve of them got called "new way" and twelve got called "old way", and that draw is the only random thing that happened in the whole story.

Read that once more, because everything that follows turns on it. Priya's boring story made every cup a coin flip. Kavya's boring story makes every label a draw from a bowl.

So if the labels are the only random thing, we can do to them exactly what we did to Priya's cups. Deal them out again, at random, and see what gap comes out the other side.

::prose-only the picture of this idea is the re-deal itself, which the next step shows as a real before and after.

=== step === concept
::eyebrow One re-deal
## Put the same marks into different groups

Let's do one re-deal by hand and watch what it produces.

```r
all_marks <- c(old_way, new_way)
methods   <- rep(c("old way", "new way"), each = 12)

set.seed(4)
reshuffled <- sample(methods)
head(reshuffled, 8)
#> [1] "new way" "old way" "new way" "old way" "old way" "old way" "old way"
#> [8] "old way"

mean(all_marks[reshuffled == "new way"]) - mean(all_marks[reshuffled == "old way"])
#> [1] -0.5
```

A few things to read there. `all_marks` is all twenty four marks in one line, in the order the children were listed. `methods` is the twenty four labels, twelve of one and twelve of the other, which `rep(..., each = 12)` builds by repeating each word twelve times. And `sample(methods)` with no `size` given shuffles the whole thing, so the same twelve-and-twelve labels come back out in a fresh order. The `head(reshuffled, 8)` line is only there to keep the printout short, showing the first eight of the twenty four labels rather than all of them.

The last line then does the arithmetic on the re-dealt groups. `reshuffled == "new way"` marks the twelve positions that got the new-way label this time, and `all_marks[...]` pulls out the marks sitting at those positions, so we get an average for each new group and the gap between them.

This particular re-deal produced a gap of -0.5, so the children who happened to be labelled "new way" came out half a mark below the others, not above. That did not happen because anybody taught anything differently, since no teaching happened here at all. Only the labels moved.

The little table below shows the first eight children before and after that re-deal. Watch the marks column, which does not move a single digit, while the method column changes. Press Run to deal the labels again and you get a different arrangement, which is exactly the point.

::widget table-transform {"code":"df$method <- sample(df$method)\ndf","caption":"the same eight marks, with the group labels dealt out again","before":{"cols":["child","marks","method"],"rows":[[1,11,"old way"],[2,14,"old way"],[3,9,"old way"],[4,13,"old way"],[5,12,"old way"],[6,10,"old way"],[7,15,"old way"],[8,8,"old way"]]},"after":{"cols":["child","marks","method"],"rows":[[1,11,"new way"],[2,14,"old way"],[3,9,"new way"],[4,13,"old way"],[5,12,"old way"],[6,10,"old way"],[7,15,"old way"],[8,8,"old way"]]}}

=== step === quiz
::eyebrow Check yourself
## What the shuffling pretends

When you shuffle the labels and recompute the gap, what exactly are you pretending is true?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- That the two groups happened to have the same average to begin with
- That the new way changed nothing, so each child would have scored the same in either group ::ok Exactly. If the teaching made no difference, a child's mark was settled before the names came out of the bowl, and the label they ended up with was pure chance. Shuffling the labels replays that draw, which is the only random thing the boring story allows.
- That the marks themselves are random numbers
- That the children were equally good at fractions before the term started ::no Not quite, and the difference matters. The marks are never treated as random and they never move; the whole shuffle holds all twenty four of them exactly where they are. The groups are not assumed to be equal either, because a bowl of names gives one group a few stronger children all the time, and that is precisely the wobble you are measuring. The one thing being pretended is that the teaching did nothing, so only the labels were dealt by chance.

=== step === concept
::eyebrow The whole pile again
## Fifty thousand shuffles

One re-deal tells you as little as one round of the guessing world did. Remember? So let's do fifty thousand of them, which is the identical move you made for Priya, with a shuffle in place of a coin flip.

```r
shuffle_once <- function() {
  reshuffled <- sample(methods)
  mean(all_marks[reshuffled == "new way"]) - mean(all_marks[reshuffled == "old way"])
}

set.seed(12)
gaps <- replicate(50000, shuffle_once())
round(head(gaps, 8), 3)
#> [1]  1.000 -1.667 -0.167  1.000  0.667 -0.500  0.667  0.333
```

`shuffle_once()` is the block you just read, packed into a function, and `replicate(50000, ...)` runs it fifty thousand times. `round(head(gaps, 8), 3)` then shows only the first eight of those gaps, trimmed to three decimals so they fit on a line.

Look at those eight. A world where the new way did precisely nothing still throws up gaps of a full mark, and in both directions. On the second shuffle the old-way label happened to collect a group that scored 1.667 marks higher.

Now let's draw the picture, where each bar counts how many of the shuffles landed on that gap.

```r
hist(gaps, breaks = 30,
     main = "Fifty thousand shuffles of the same 24 marks",
     xlab = "gap between the two groups (marks)")
abline(v = 1.5, lwd = 2)
```

It is the same kind of picture you built for Priya, drawn for gaps in marks instead of counts of correct cups. It piles up around zero, because most re-deals of the labels leave the two groups fairly even, and it thins out towards the edges where a re-deal happened to load one group with the stronger children.

The vertical line is Kavya's real gap of 1.5 marks. It sits out in the thin right-hand edge, and counting how many shuffles got out there with it is the last thing left to do.

=== step === tryit
::eyebrow Your turn
## How often did a shuffle reach one and a half?

Time to finish Kavya's question the same way you finished Priya's and Bruno's.

The fifty thousand shuffled gaps are in `gaps`, all of them from a world where the teaching made no difference. Kavya's real gap was 1.5 marks. Count the shuffles that matched it or beat it.

```r
mean(gaps >= ____)
```
::check {"regex":"gaps\\s*>=\\s*1\\.5","gate":true,"difficulty":"intermediate","ok":"That is the answer: about 0.039, which is 1,952 of the 50,000 shuffles. So shuffling alone produced a gap this big roughly four times in a hundred, and the boring story is straining without being ruled out.","no":"You want every shuffle that reached the real gap or beat it, and the real gap between the two groups was 1.5 marks."}
::solution
```r
mean(gaps >= 1.5)
#> [1] 0.03904
```

=== step === concept
::eyebrow The shortcut
## R has a one-line shortcut for Priya's count

Fair question at this point. If this reasoning is standard enough to have a name, does R not have it built in already?

It does, and it has had it for decades, because for most ordinary situations somebody worked the counting out in advance with a formula. That was the only option back when nobody could ask a computer to play fifty thousand games. Here is the built-in version of Priya's evening.

```r
binom.test(9, 10, p = 0.5, alternative = "greater")
#>
#> 	Exact binomial test
#>
#> data:  9 and 10
#> number of successes = 9, number of trials = 10, p-value = 0.01074
#> alternative hypothesis: true probability of success is greater than 0.5
#> 95 percent confidence interval:
#>  0.6058367 1.0000000
#> sample estimates:
#> probability of success
#>                    0.9
```

Read the arguments as the story you already know: 9 correct out of 10 cups, `p = 0.5` is the guessing world where each cup is a coin flip, and `alternative = "greater"` says you only care about doing unusually well, not unusually badly. R repeats that last argument back at you on the line beginning "alternative hypothesis", which is its own way of writing down the question you asked.

Now find the number. On the line about successes and trials, at the end, sits `p-value = 0.01074`. Your own count gave 0.01054.

Those are the same answer. The small gap between them is only the roughness of fifty thousand simulated rounds set against an exact calculation, and the function did nothing cleverer than you did. It counted the same thing without playing the games.

The confidence interval printed underneath is a different question with a different answer, so leave it alone for now. Part 3 of this course is entirely about that line.

=== step === concept
::eyebrow The famous one
## And a one-line shortcut for Kavya's gap

Kavya's classroom has a built-in shortcut too, and this one you have definitely heard of.

```r
t.test(new_way, old_way, alternative = "greater")
#>
#> 	Welch Two Sample t-test
#>
#> data:  new_way and old_way
#> t = 1.964, df = 20.977, p-value = 0.03146
#> alternative hypothesis: true difference in means is greater than 0
#> 95 percent confidence interval:
#>  0.1856959       Inf
#> sample estimates:
#> mean of x mean of y
#>      13.0      11.5
```

There it is: `p-value = 0.03146`. Your shuffling gave 0.03904. Both say the same thing in plain words, that a gap this big turns up a few times in a hundred when the teaching made no difference at all.

They are not identical, and it is worth being honest about why. The t-test never shuffles anything. It uses a formula worked out in advance that stands in for the shuffling, and a formula that stands in for something lands close to it rather than exactly on it.

So the t-test, the one everybody reaches for, is not a new idea at all. It is these same three moves with a formula doing the counting for you.

One more name while we are here, because the family is large and you will meet it soon. When Kavya has three teaching methods to compare instead of two, the very same move is called ANOVA. Nothing about the reasoning changes, only the arithmetic that stands in for the shuffling. Part 5 is where the whole family gets sorted out and named properly.

=== step === concept
::eyebrow The name
## The number you have been counting has a name

Every share you counted today is called a p-value. That is all the word means.

Look back at what you actually did, three times over:

- **Priya.** Boring story: she is guessing. Build it: fifty thousand rounds of ten coin flips. Count: 0.01054 of them reached nine or more.
- **Bruno.** Boring story: he is choosing a hand at random. Build it: fifty thousand rounds of fifteen choices. Count: 0.01794 of them reached twelve or more.
- **Kavya.** Boring story: the teaching changed nothing, so only the labels were dealt by chance. Build it: fifty thousand re-deals of the labels. Count: 0.03904 of them reached a gap of 1.5 marks or more.

[KEY INSIGHT]
A p-value is the share of the boring world's outcomes that are as good as the one you actually saw, or better. It is always counted inside a world where the boring story is assumed true.

Every p-value you ever meet, in a paper, in a dashboard, in a colleague's slide, was produced by that same recipe with different arithmetic. And part 2 of this course, "What p-values mean (and what they never meant)", takes the number apart properly, because misreading it has had published findings withdrawn and started long arguments between people who all had the arithmetic right.

::prose-only naming a number the reader has already counted three times adds no new object to draw.

=== step === quiz
::eyebrow Check yourself
## One more claim to judge

A cafe owner says customers prefer their new coffee blend. They ran ten-person taste panels every morning for two weeks, watched the results as they came in, and stopped on the first morning a panel came out strongly in favour. Then they counted exactly as you have been counting and got a small share. What is the honest thing to say about that number?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- Compute the share for that panel and read it the way you read Priya's
- The result is fine, because each panel was properly randomised
- The number means very little, because the panel was chosen after seeing the results ::ok Exactly, and notice the problem sits upstream of the arithmetic. The counting assumes an experiment fixed before the first cup, whereas this one ran until a good morning turned up and then reported that morning. Run enough panels and a world where the blends are identical will eventually hand you a convincing one, so the number is measuring the stopping rule as much as the coffee.
- The result is fine as long as the share came out small enough ::no The arithmetic is not what is broken here. The counting describes an experiment that was fixed in advance, while this one was allowed to stop on whichever morning looked best, so a no-difference world would eventually produce a convincing panel on its own. Randomising within each panel does not rescue that, and a smaller share does not either, because the number is answering a question about a different experiment from the one that was run.

=== step === concept
::eyebrow Honest limits
## What this method settles, and what it never will

Let's close by being straight about the size of what you now have, because it is smaller than most people assume.

It settles one thing:

- How often the boring story, all on its own, produces a result as good as the one you saw. That is all the counting ever measured.

It never settles these:

- Whether the claim is true. Priya's one percent is a fact about guessing, never a probability about Priya.
- How big the effect is. Kavya's count says a gap of 1.5 marks is uncommon when nothing is going on. It does not say the new way is worth 1.5 marks, or one mark, or three.

[KEY INSIGHT]
This whole method answers "could the boring story have done this?" and nothing else. "How big is it, and how sure are we?" is a different question with different machinery, and it is the other half of the subject.

That other half is where parts 2 and 3 go. You will build the second question the same way you built this one, by making a world and watching what it does, so nothing you learned today gets thrown away.

::prose-only a summary of what a number can and cannot support has no object to draw.

=== step === concept
::eyebrow Go deeper
## References

Here are five places worth your time if you want to push this further.

- [The lady tasting tea, the original experiment](https://en.wikipedia.org/wiki/Lady_tasting_tea) - Ronald Fisher ran almost exactly this experiment with tea and milk in 1935, and the reasoning you followed tonight is his.
- [OpenIntro Statistics, free textbook](https://www.openintro.org/book/os/) - the same logic told patiently over a full chapter, with the formulas this lesson deliberately skipped.
- [R documentation for binom.test()](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/binom.test.html) - the function that reproduced Priya's count, including what its confidence interval means.
- [R documentation for t.test()](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/t.test.html) - the second shortcut, the one that answered Kavya's gap, and its arguments explained.
- [Seeing Theory, frequentist inference, Brown University](https://seeing-theory.brown.edu/frequentist-inference/index.html) - animated companions to the bars you built here, if a moving picture helps it stick.

=== step === complete
## Part 1 complete

You started the evening with nine cups and a claim, and you now have a method. Take the explanation you find least interesting, build the world it implies, play that world thousands of times, and count how often it produces something as good as what you actually saw. About one percent, in Priya's case. Not proof, but enough to make guessing an uncomfortable story to keep defending.

You also carried that method to a dog picking a hand and to a classroom where nothing was right or wrong, and both times the only thing that changed was how the boring story got built. Then `binom.test()` and `t.test()` handed back the numbers you had already counted by hand.

And you know what the number refuses to tell you. It is not the probability that Priya was guessing, it says nothing about how good her palate is, and it falls apart entirely if somebody was allowed to stop the experiment when the results looked nice. Being able to say all of that plainly is worth more than it sounds. It comes up in interviews, and it comes up in meetings where somebody is about to ship the wrong thing.

Part 2 is "What p-values mean (and what they never meant)". You have counted several p-values by hand now, so instead of starting from the definition, that lesson can go straight after the misreadings.
