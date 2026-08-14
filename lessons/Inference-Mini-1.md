---
title: "How Statistical Inference Works"
slug: "Inference-Mini-1"
catalog_blurb: "How to tell a real effect from a lucky streak."
description: "How statistical inference works, taught from zero with a taste-test experiment you simulate yourself. No formulas, just the reasoning."
keywords: "statistical inference, how inference works, statistics for beginners, R"
date: "2026-08-15"
post_type: "LESSON"
curriculum_id: "0.0.1"
lesson_access: "windowed"
course_id: "inference-from-zero"
course_title: "Inference from Zero"
course_lesson: "1"
course_total: "7"
course_landing: "/dashboard.html"
webr: true
mathjax: false
---

=== step === cover
::eyebrow Part 1 of 7
## How Statistical Inference Works

You are at a friend's place when Priya makes a claim over dinner: they can tell Coke from Pepsi by taste alone. Nobody at the table believes it, so you take ten identical plastic cups into the kitchen and fill each one by tossing a coin, heads for Coke and tails for Pepsi, writing down the answers as you go. Not even you know how many of each you poured. Priya tastes all ten and calls them one at a time.

Nine right. One wrong.

Now what? Nine out of ten certainly feels like a lot. The trouble is that a person with no ability whatsoever, someone purely guessing, would still get a fair share of them right by chance, and every so often that guesser would get almost all of them right. So the useful question is not whether nine sounds impressive, because it does. The question is how often blind luck manages nine.

You can just go and find out. Press the buttons below: every bar is a real round of ten pure-guess calls, played right now in front of you, and the orange bars are the rounds where luck alone did as well as Priya or better.

::widget luck-simulator {"trials": 10, "p": 0.5, "observed": 9, "unit": "correct guesses", "seed": 42}

By the end of this lesson you will be able to:

- Say why nine right out of ten is not, on its own, evidence of anything
- Build the guessing world in R and count how often it fakes a result that good
- Read the answer correctly, and name what it never says
- Run the same three moves somewhere else entirely, like a shop comparing two versions of its checkout page

**What you need first:** you can read a simple R script, so a variable, a function call and a comparison like `x >= 9` are familiar. No statistics is assumed at all. Everything else gets built here from nothing.

=== step === concept
::eyebrow The problem
## Two stories fit the same nine cups

Here is the awkward part. All you actually have is a single number, nine, and at least two completely different stories end with that number.

- **Priya really can taste the difference.** Their tongue does the work, they call nine correctly, and the one miss was a moment of doubt on a cup that had gone warm.
- **Priya was guessing the whole time and got lucky.** No ability at all, ten mental coin flips, and the flips happened to land well.

Nothing inside the number nine tells you which of those two you are actually in. That is genuinely uncomfortable, and it stays uncomfortable no matter how long you stare at the nine, because staring at a result never tells you what produced it.

None of this is really about taste tests, either. The same shape turns up in every argument anybody has ever made with data: a drug trial finishes with more recoveries in the group that got the drug, somebody points at the gap and calls it real, and the same rude question has been sitting there the whole time. What if nothing was going on and the numbers just fell that way? A marketing team runs into that question every time one version of a page outsells another, and so does anyone comparing this year's exam results against last year's.

[KEY INSIGHT]
Evidence does not speak for itself. A result only becomes evidence once you know what the boring explanation would have produced.

=== step === concept
::eyebrow The move
## Take the boring story seriously

Since you cannot rule out the lucky-guesser story by staring at the nine, do the opposite. Assume that story is true, then watch how well it copes.

So pretend, just for a minute, that Priya cannot taste the slightest difference between the two drinks. What follows from that? Every cup becomes a coin flip in their head: right half the time, wrong half the time, ten cups in a row, and each cup independent of the one before, because getting cup three wrong tells them nothing at all about cup four. Call that the chance-only world. It is a made-up world, but it is a completely specific made-up world, and being specific is what makes it useful, because you can build it, run it thousands of times, and see exactly what it tends to produce.

Then you compare. If the chance-only world spits out nine-or-better all the time, Priya's nine is nothing to write home about. If it hardly ever does, the guessing story is straining badly to explain what you watched happen at the table.

::widget process-flow {"steps":[{"title":"The claim","sub":"Priya says they can tell Coke from Pepsi by taste"},{"title":"The boring story","sub":"pretend they are guessing: each cup right half the time"},{"title":"Run that world","sub":"play thousands of pure-guess rounds of ten cups"},{"title":"Count and decide","sub":"how often did luck reach nine or more"}]}

The claim at the top is just what you walked in with. The three moves underneath it are the whole idea, and the rest of statistics is machinery for doing those three faster, or in situations where you cannot simulate your way out of trouble.

=== step === quiz
::eyebrow Check yourself
## Where the reasoning starts

You want to judge Priya's nine correct cups. Which assumption do you make first, before you touch any data at all?

::quiz {"correct":2,"gate":true,"difficulty":"beginner"}
- Assume Priya really can taste the difference, then check whether nine out of ten is consistent with that
- Assume Priya is guessing, then work out how often guessing alone reaches nine or more ::ok That is the move, and it feels backwards the first time. You take the explanation you are least excited about, build the world it implies, and see how hard that world has to strain to produce what you actually saw.
- Work out the probability that Priya has the skill, given that nine cups came back correct ::no Both of those start at the wrong end. Assuming Priya really can taste the difference settles nothing, because nine out of ten sits comfortably inside the guessing story too, and that ambiguity is the exact thing you are trying to break. Working backwards from nine cups to the probability that Priya has the skill is the number everybody wants, and it needs something those ten cups do not contain.

=== step === concept
::eyebrow In R
## Play one round of the guessing world

Time to build that imaginary guesser. One round is ten calls, each one right or wrong with an even chance, so all R has to do is draw ten slips out of a bag that holds one slip saying "correct" and one saying "wrong".

```r
set.seed(1)
one_game <- sample(c("correct", "wrong"), size = 10, replace = TRUE)
one_game
#> [1] "correct" "wrong"   "correct" "correct" "wrong"   "correct" "correct"
#> [8] "correct" "wrong"   "wrong"

sum(one_game == "correct")
#> [1] 6
```

Four things happen there, and none of them stays mysterious for long.

`c("correct", "wrong")` is the bag, holding one slip of each kind. `size = 10` says draw ten times, once per cup. `replace = TRUE` puts the slip back in the bag after each draw, which is what keeps every cup an independent coin flip instead of emptying the bag after two draws. And `set.seed(1)` pins down R's random numbers so that your ten draws come out identical to the ones printed above, which turns this into something you can check rather than something you have to take on trust.

If the output looks cluttered, the `[1]` and `[8]` at the start of the two lines are only R keeping count for you, saying "this line starts at draw number 1" and "this one starts at draw number 8". They are not part of the result.

The last line does the counting. `one_game == "correct"` compares all ten draws against the word "correct" and hands back ten TRUE or FALSE answers, then `sum()` adds those up, counting every TRUE as one. This particular round, our imaginary guesser scored 6.

Six out of ten, from somebody with no ability at all. Worth remembering the next time a six sounds like it means something.

=== step === concept
::eyebrow Once is not enough
## One round tells you nothing, so play twenty

That round happened to score 6, but run it again and you will get something else, because it is a random world and one draw from a random world is just an anecdote about it. Anecdotes are what got us into this mess in the first place. What we want is the full range of what guessing is capable of.

So wrap the round up in a function and call it as often as we like.

```r
play_one_game <- function() {
  guesses <- sample(c("correct", "wrong"), size = 10, replace = TRUE)
  sum(guesses == "correct")
}

set.seed(2026)
first_20 <- replicate(20, play_one_game())
first_20
#>  [1] 6 5 3 5 5 5 7 8 5 4 7 7 6 3 8 5 5 2 4 4
```

`play_one_game()` is nothing more than the two lines you just read, packed into something reusable: draw ten cups, count the correct ones, hand back that count. `replicate(20, play_one_game())` then runs it twenty separate times and gathers the twenty scores together in one place, which is what the row of numbers underneath is.

Read those twenty numbers as twenty different people who cannot taste a thing. Most of them landed on 4, 5 or 6, which is what you would expect when half of ten is five. Two of them got as far as 8, and an 8 already looks fairly convincing if that is the only person you happen to watch. Not one of these twenty guessers reached 9.

Twenty rounds is a hint rather than an answer, though. To say anything solid about an event that might happen once in a hundred tries, twenty tries is nowhere near enough.

=== step === widget
::eyebrow Feel it
## Watch luck pile up

Here is the guessing world again, this time as a picture you build yourself. Press **Run 1 game** a few times and watch individual results drop in one at a time. Then press **Run 100**, then **Run 1,000**, and pay attention to the shape that appears.

::widget luck-simulator {"trials": 10, "p": 0.5, "observed": 9, "unit": "correct guesses", "seed": 42}

Reading it takes about ten seconds. The numbers along the bottom, 0 through 10, are how many cups a guesser got right in a round. The height of a bar is how many of your rounds finished on that score. So the tall bars in the middle are the ordinary guessers who landed near five, and the stubby ones out on the right are the lucky few.

The two orange bars are what the whole lesson turns on. Those are the rounds where pure guessing hit 9 or 10, which is to say the rounds where luck alone did as well as Priya or better. The line underneath keeps a running count of how often that happened out of everything you have played so far. Push it up to a few thousand rounds and watch that percentage stop bouncing around and settle: it moves a lot while the numbers are small, then parks itself near one percent and stays there.

=== step === concept
::eyebrow The number
## Count it properly over fifty thousand rounds

The widget gives you the feel of it. Now let's pin the number down, because that number is the answer to the question you asked at the dinner table.

One small piece of R first, because it is about to do a lot of work. When you compare things in R you get back TRUE and FALSE, and taking the `mean()` of TRUE and FALSE values gives you the fraction that are TRUE, since R counts every TRUE as one and every FALSE as zero.

```r
mean(c(TRUE, FALSE, TRUE, TRUE))
#> [1] 0.75
```

Three TRUEs out of four came back as 0.75, which is exactly what you would want the word "fraction" to mean. Keep that in your pocket for the next two blocks.

Now the real run: fifty thousand rounds of ten cups, every one of them played by a guesser with no ability at all.

```r
set.seed(7)
scores <- replicate(50000, play_one_game())
table(scores)
#> scores
#>     0     1     2     3     4     5     6     7     8     9    10
#>    46   480  2235  5860 10353 12069 10413  5855  2162   469    58
```

`table()` tallies how many rounds finished on each score, so this is the widget's picture written out as numbers. Twelve thousand rounds landed on 5, the boring middle. Only 46 rounds got every single cup wrong. And out at the far right, 469 rounds reached 9 and another 58 got a perfect 10.

Those last two columns are the ones we care about, because those are the rounds where luck did as well as Priya or better. Add them together and turn the total into a fraction.

```r
sum(scores >= 9)
#> [1] 527

mean(scores >= 9)
#> [1] 0.01054
```

`scores >= 9` puts the same question to all fifty thousand rounds at once: did this one reach nine or more? That gives fifty thousand TRUE or FALSE answers, so `sum()` counts the yeses and `mean()` turns that count into a fraction of the whole, exactly as it did on the four values a moment ago.

There is the answer. Out of fifty thousand rounds of pure guessing, 527 of them managed nine or more, which comes to 0.01054, or **a bit over one percent**.

=== step === tryit
::eyebrow Your turn
## What if the score had been eight?

Suppose Priya had missed two cups instead of one and finished on 8. Would that still be interesting?

You do not need to simulate anything new to find out, because all fifty thousand rounds are already sitting in `scores`. You only need to count a different set of them: the rounds where luck reached eight or more. Fill in the blank, then press Check.

```r
mean(scores >= ____)
```
::check {"regex":"scores\\s*>=\\s*8","gate":true,"difficulty":"beginner","ok":"Right, and it comes out at about 0.054, so roughly five percent. Eight-or-more is a wider net than nine-or-more, so more of the guessing rounds fall into it, and the result gets correspondingly less remarkable.","no":"You want every round that reached eight or more, so the comparison to write is scores greater than or equal to 8."}
::solution
```r
mean(scores >= 8)
#> [1] 0.05378
```

=== step === concept
::eyebrow The decision
## What one percent actually buys you

A bit over one percent. Sit with that for a second, because what it licenses you to say is narrower, and stranger, than most people assume.

You watched something happen. If Priya was guessing, then what you watched belongs to a group of outcomes that shows up about once in every hundred attempts, which leaves you holding exactly two possibilities and needing to pick one:

- A one-in-a-hundred coincidence happened, in front of you, on the single evening somebody made the claim.
- The assumption you fed into the simulation is wrong, and Priya was not guessing.

Neither of those is proof of anything, and it matters that you feel how unsatisfying that is. The first one is perfectly possible, since one-in-a-hundred things happen constantly; they just do not usually happen on cue. What has changed is that the guessing story now has to do real work to stay standing, and the harder it has to work, the less comfortable you should be leaning on it.

[KEY INSIGHT]
A statistical test never tells you which story is true. It tells you how hard the boring story has to strain to explain what you saw, and then it hands the decision back to you.

That really is the entire logic. A t-test, a chi-square test, an A/B dashboard turning a cell green: every one of them is doing what you just did with `replicate()` and a comparison, only with a formula standing in for the simulation. If you have never met a t-test, that is fine and you have not missed anything, because you have just done the thinking that one is built out of.

=== step === quiz
::eyebrow Check yourself
## Say the number out loud

Your simulation found that pure guessing reaches nine or more about one percent of the time. Which of these says that correctly?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- There is a 1 percent chance that Priya was guessing
- There is a 99 percent chance that Priya can really taste the difference
- If Priya were guessing, a result this good or better would turn up about 1 percent of the time ::ok Exactly, and notice how carefully that sentence is built. The one percent is a property of the guessing world, because the guessing world is the only thing the simulation ever ran. You assumed guessing and asked what it produces, so the answer can only be a statement about what guessing produces.
- Priya is 99 percent accurate at telling the two drinks apart ::no Each of those turns the number into a claim about Priya, and it cannot be one. Your simulation only ever ran the guessing world, so the one percent is a fact about that world: guessing reaches nine or more roughly once in a hundred rounds. Turning it around into a probability about Priya needs something the ten cups simply do not contain.

=== step === concept
::eyebrow Honesty
## Three things that number does not say

The sentence you just picked is fussy on purpose, because three tempting readings of one percent are all wrong, and they are wrong in ways that cause real damage in published work.

- **It is not the probability that Priya was guessing.** The simulation was handed "Priya is guessing" as an assumption and never questioned it, so it cannot possibly report back on how likely that assumption was. Going in the other direction, from a result to the odds that a claim is true, needs to know how plausible the claim was before anybody poured a drink, and nothing in your ten cups measures that.
- **It does not prove that Priya has the skill.** All it says is that guessing is a strained explanation for what happened. Strained explanations are sometimes the correct ones, and if enough people around the world run enough taste tests tonight, some of them will hit nine out of ten while guessing, purely because a one-in-a-hundred event needs about a hundred tries.
- **It says nothing about how good Priya is.** One percent is not a score, a rating, or a measure of ability. Somebody who is right 95 percent of the time and somebody who is right 75 percent of the time could both have produced this evening's nine, and the one percent cannot tell them apart. Measuring how big an ability is takes a different tool, and it is what part 6 of this course is about.

=== step === concept
::eyebrow The other way to be wrong
## The test can also miss someone who is genuinely good

So far we have worried in one direction only, about luck being mistaken for skill. The mistake runs the other way too, and it is easy to demonstrate, because we can simulate a taster who genuinely has ability.

Suppose Priya is good but not superhuman: right about 8 times out of 10 on average, so real skill with real slip-ups. In R that is the same bag as before with the odds tilted, which is what `prob = c(0.8, 0.2)` does. It says the first slip in the bag, "correct", comes up 80 percent of the time and "wrong" comes up the other 20 percent.

```r
skilled_game <- function() {
  guesses <- sample(c("correct", "wrong"), size = 10,
                    replace = TRUE, prob = c(0.8, 0.2))
  sum(guesses == "correct")
}

set.seed(500)
skilled <- replicate(50000, skilled_game())
mean(skilled >= 9)
#> [1] 0.3746
```

Look at that number carefully, because it is not the one people expect. A genuinely skilled taster, right 8 times in 10, clears the nine-out-of-ten bar only about 37 percent of the time. So on more than six evenings out of ten, real ability lands on 8 or fewer and gets a shrug from everyone at the table.

So "the result was unremarkable" and "there is nothing there" are two very different statements, and a ten-cup experiment is nowhere near sharp enough to tell them apart. Choosing an experiment big enough to catch the effect you care about has a name, power analysis, and it is part 4 of this course.

=== step === concept
::eyebrow The other outcome
## What if the score had been seven?

Let's run the evening that did not happen. Same reasoning, same fifty thousand rounds, different result to judge: Priya finishes on 7 out of 10 instead of 9.

The widget below is the identical guessing world, with the orange region now covering every round that reached seven or more. Watch how much wider it is.

::widget luck-simulator {"trials": 10, "p": 0.5, "observed": 7, "unit": "correct guesses", "seed": 11}

And the count from the rounds we already have:

```r
mean(scores >= 7)
#> [1] 0.17088
```

About 17 percent, so roughly one guesser in every six reaches seven or better. That is not a coincidence worth remarking on; that is a Tuesday. Somebody sitting there with no ability at all will hand you a 7 often enough that you would run into one at plenty of dinner parties.

Notice that nothing about the method changed between this step and the last one. It is the same simulation and the same comparison, read the same way. All that changed is the result being judged, and the answer went from "guessing has to strain" to "guessing does this constantly". That is exactly why you want a method rather than a gut feeling, because a method treats the flattering result and the boring one identically.

=== step === concept
::eyebrow Size matters
## Ten cups is a small experiment

Ten cups is not many, and you can see precisely what that costs by running the same evening at a bigger scale.

Say you had poured twenty cups instead of ten and Priya had got 18 of them right. That is the same 90 percent hit rate as nine out of ten, so it feels like exactly the same performance. Ask the guessing world what it makes of it.

```r
play_20_cups <- function() {
  guesses <- sample(c("correct", "wrong"), size = 20, replace = TRUE)
  sum(guesses == "correct")
}

set.seed(99)
scores_20 <- replicate(50000, play_20_cups())
sum(scores_20 >= 18)
#> [1] 9

mean(scores_20 >= 18)
#> [1] 0.00018
```

Nine rounds out of fifty thousand. The same 90 percent hit rate that luck faked 527 times over ten cups gets faked 9 times over twenty cups, which is roughly two in ten thousand instead of one in a hundred.

That gap is not a small difference in degree. It is the whole reason experiments have sizes at all. A short experiment is cheap for luck to counterfeit, because there are only so many ways ten coin flips can land and a few of them look brilliant. Stretch the same performance over twenty cups and luck has to hold the streak together twice as long, which it manages far less often. So every time you meet a headline built on a handful of observations, this is the arithmetic quietly working against it.

=== step === concept
::eyebrow When the whole thing breaks
## The chance-only world has to be the right pretend world

Every number in this lesson rests on one assumption: that a guesser gets each cup right half the time, independently, ten times over. That assumption is not free, and it is bought entirely by how you ran the experiment.

- **Priya cannot see, hear or smell anything useful.** If the Coke cups come out of a bottle that hisses, half the cups are not a coin flip any more and the simulation is describing a world nobody was in.
- **Each cup gets filled by its own coin toss.** This is the fussy detail from the very first step, and it is fussy for a reason. If you had poured exactly five of each and announced it, a guesser who simply keeps count does better than a coin flip on the later cups, because by cup nine they may already know what has to be left. Filling by coin toss, with nobody knowing the totals, is what makes each cup a genuine 50-50 call.
- **No feedback while the tasting is happening.** Tell Priya after cup three that they got it right and cup four stops being independent of cup three, because now there is information in the room.
- **The number of cups is fixed before the first sip.** Ten cups was decided in the kitchen, not discovered later.

[WARNING]
That last one is the assumption that quietly ruins real experiments. "Keep tasting until it looks convincing" is a completely different experiment from "do exactly ten and stop", and the ten-cup simulation says nothing whatsoever about the first one. Whenever the decision to stop collecting data depends on how the results are going, the number your test hands back is not the number you think it is.

=== step === concept
::eyebrow Somewhere else entirely
## The same three moves on a checkout page

Nothing in this reasoning is about drinks, so let's take it somewhere with money in it.

Your shop is running two versions of its checkout page, and every visitor is sent to one of them by a coin toss, so both versions see roughly the same traffic. By closing time you have 40 purchases: 26 of them finished on the new page and 14 on the old one. The room wants to ship the new page.

Before anybody ships anything, run the same skeptical question. What is the boring story here? That the new page made no difference at all. And if it made no difference, then which version a buyer happened to be looking at when they paid is just the coin toss that sent them there, so 40 purchases are 40 coin flips. That is the guessing world again with different words painted on it: 40 cups instead of 10, and "new page" in place of "correct".

::widget luck-simulator {"trials": 40, "p": 0.5, "observed": 26, "unit": "buyers on the new page", "seed": 21}

Run a few thousand of those days and you can see the shape of what a no-difference world produces. In code it is the same two functions you have written twice already, with 40 in place of 10.

```r
split_one_day <- function() {
  buyers <- sample(c("new", "old"), size = 40, replace = TRUE)
  sum(buyers == "new")
}

set.seed(303)
splits <- replicate(50000, split_one_day())
head(splits, 12)
#>  [1] 23 23 21 23 17 16 15 18 24 17 19 22
```

Rather than print all fifty thousand days, `head(splits, 12)` shows just the first twelve. Every one of them is a day on which the two pages were genuinely identical, and look at them wander: 23, 23, 21, 23, and then a run of 17, 16, 15. On the ninth day the new page took 24 of the 40 purchases against the old page's 16, purely because that is how the coin tosses went. A world where nothing whatsoever is happening still hands you gaps of eight or ten purchases without breaking a sweat. None of these first twelve got as far as 26, but out of fifty thousand days, some of them will have.

=== step === tryit
::eyebrow Your turn
## Count the no-difference days

You have fifty thousand simulated days in `splits`, each one from a world where the new page changed nothing. Your real day gave 26 purchases on the new page.

So count the simulated days that did as well as your real one or better, and fill in the blank to do it.

```r
mean(splits >= ____)
```
::check {"regex":"splits\\s*>=\\s*26","gate":true,"difficulty":"intermediate","ok":"That is it: about 0.041, so roughly four percent of days go that way with two identical pages. Worth a second look, and nowhere near the slam dunk that 26 against 14 felt like in the room.","no":"You are counting the simulated days that matched your real result or beat it, and your real result was 26 buyers on the new page, so the comparison is splits greater than or equal to 26."}
::solution
```r
mean(splits >= 26)
#> [1] 0.04052
```

=== step === concept
::eyebrow The name
## What you have been computing is called a p-value

Every percentage you counted along the way, the 1.05 percent for nine cups, the 17 percent for seven, the 4.1 percent for the checkout page, is a p-value. That is all the term means: the fraction of the boring world's outcomes that are as good as the one you saw or better.

Which raises a fair question. If it is that ordinary, why does every statistics course make it look like machinery? Because for most situations there is a formula that gets the same number without waiting on fifty thousand simulated rounds, and a formula was the only option back when nobody could ask a computer to play the games. R has one built in for this exact experiment.

```r
binom.test(9, 10, p = 0.5, alternative = "greater")
#>
#>     Exact binomial test
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

Read the arguments as the story you already know: 9 correct out of 10 cups, `p = 0.5` is the chance-only world where each cup is a coin flip, and `alternative = "greater"` says you only care about doing unusually well, not unusually badly. R then repeats that last argument back at you in the line beginning "alternative hypothesis", which is its own way of writing down the question you asked it. The confidence interval it prints underneath is a different question with a different answer, so leave it alone for now; part 3 of this course is entirely about that line.

Then look at the p-value it reports: 0.01074. Your simulation gave 0.01054. Both of those round to 1.1 percent, and the sliver between them is only the roughness of fifty thousand rounds measured against an exact calculation. The function did nothing cleverer than you did. It counted the same thing without playing the games.

The same trade is on offer for every other test you will ever run: somebody worked the counting out in advance, so you get the number without playing the games. When you eventually meet a t-test, it is asking this same question about a difference in averages instead of a count of cups.

=== step === quiz
::eyebrow Check yourself
## One more claim

A colleague says their new email subject line beats the old one. They ran both, checked the numbers every morning, and stopped on the first day the new one was far enough ahead to look convincing. Then they ran exactly the count you just ran and got a small percentage. What is the honest thing to say about that percentage?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- It is fine, because the count itself was calculated correctly
- It is fine as long as the percentage came out small enough
- It does not mean what it normally means, because the world that was simulated is not the world the data came from ::ok Exactly right. The simulation assumes a fixed experiment that was decided in advance, but your colleague ran an experiment that could stop on any of several mornings and stopped on the best one. Given enough mornings, a no-difference world will eventually offer up a convincing-looking day, so the count that gets reported is measuring the stopping rule as much as the subject line.
- It proves the new subject line is actually worse ::no Not quite, and the problem sits upstream of the arithmetic. Getting the count right does not help, and a smaller percentage does not rescue it, because the simulated world assumes an experiment that was fixed in advance while this one was allowed to stop on whichever morning looked best. It does not flip the conclusion around either, since a broken measurement is not evidence for the opposite claim, it is simply not evidence.

=== step === concept
::eyebrow Go deeper
## References

Four places worth an hour if you want to go further than this lesson does.

- [The lady tasting tea, the original 1935 experiment](https://en.wikipedia.org/wiki/Lady_tasting_tea) - Ronald Fisher ran almost exactly this experiment with tea and milk, and the reasoning you just followed is his.
- [OpenIntro Statistics, foundations for inference (free PDF)](https://www.openintro.org/book/os/) - a patient textbook treatment of the same logic, with the formulas this lesson deliberately skipped.
- [R documentation for binom.test()](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/binom.test.html) - the function you ran at the end, including what its confidence interval means and when it is exact.
- [Seeing Theory, frequentist inference, Brown University](https://seeing-theory.brown.edu/frequentist-inference/index.html) - animated companions to the histogram you built, if a moving picture helps it stick.

=== step === complete
## Part 1 complete

You started with nine cups and a claim, and you now have a method. Assume the explanation you find least interesting, build the world it implies, run that world thousands of times, and count how often it produces something as good as what you actually saw. About one percent, in Priya's case, which is not proof but is enough to make guessing an uncomfortable story to defend.

You also know what the number refuses to tell you. It is not the probability that Priya was guessing, it does not measure how good they are, and it evaporates entirely if the experiment let somebody stop when the results looked nice.

Part 2 is called "What p-values mean (and what they never meant)". You have already counted three of them by hand, so rather than starting from the definition, that lesson can go straight after the misreadings, the ones that have had published findings withdrawn and started long arguments between people who all had the arithmetic right, and show you exactly where each one turns the corner.
