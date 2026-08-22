---
title: "How statistical inference works, no formulas yet"
slug: "Inference-Mini-1"
description: "Arjun says he can spot an AI written review, and calls ten of twelve right. Build the pure guessing world in R and count how often luck does that well."
keywords: "how statistical inference works, statistical inference, null hypothesis, statistical significance, simulation in R, hypothesis testing for beginners, inference from scratch"
mathjax: false
webr: true
date: "2026-08-23"
post_type: "LESSON"
course_id: "inference-from-zero"
course_title: "Inference from Zero"
course_lesson: "1"
course_total: "7"
course_landing: "/dashboard.html"
course_prev: ""
course_next: ""
curriculum_id: "0.0.1"
lesson_access: "windowed"
catalog_blurb: "How to tell a real result from a lucky one, without formulas."
---

=== step === cover
::eyebrow Inference from Zero
## How statistical inference works, no formulas yet

You have probably heard the one about ten cups poured in a kitchen, nine of them called right, and a friend who swears she can taste Coke against Pepsi. Hold on to that scene for a second, because the same argument is about to break out at your lunch table over something more modern.

Arjun, who sits two desks away, makes a claim: he can spot an AI written product review just by reading it. The wording gives it away, he says.

Nobody at the table believes him.

So you settle it after lunch.

You print twelve product reviews and pick each one by tossing a coin. Heads and you take a review a real customer wrote, tails and you take one a chatbot wrote, while writing the answers on a slip of paper as you go.

By the time you fold the slip into your pocket and hand him the stack, even you have lost track of the order.

Arjun reads all twelve and calls them one at a time.

He gets ten right and two wrong.

Ten out of twelve does feel like a lot. The trouble is that somebody with no ability at all, somebody flipping a mental coin on every review, would still get a fair share of them right, and every so often that person would get nearly all of them.

So the question is not whether ten of twelve sounds impressive. It does. The real question is how often pure guessing manages ten.

Press the buttons below. Each round is twelve pure guesses played right now in front of you, and the bars stack up the scores those rounds land on. The orange ones are the scores where guessing alone did as well as Arjun or better.

::widget luck-simulator {"trials": 12, "p": 0.5, "observed": 10, "unit": "correct calls", "seed": 11}

=== step === concept
## The twelve calls, and how many Arjun got right

Let's get the numbers on the table first, because everything we work out later is measured against them.

The `truth` column below is the answer key that sat folded in your pocket, decided one coin toss at a time. The `call` column is what Arjun said out loud as he read. The `set.seed(4)` line pins down which coin tosses R hands you, so the twelve reviews on your screen are the same twelve I am talking about.

Press Run.

```r
# Build the twelve reviews, record what Arjun called, and score him
set.seed(4)
truth <- sample(c("human", "chatbot"), 12, replace = TRUE)   # one coin toss per review

calls <- truth          # start from the key, then put back the two he got wrong
calls[3]  <- "chatbot"  # a real customer review he called a chatbot
calls[10] <- "human"    # a chatbot review he called real

reviews <- data.frame(review = 1:12, truth = truth, call = calls)
n_right <- sum(reviews$call == reviews$truth)

reviews
#>    review   truth    call
#> 1       1 chatbot chatbot
#> 2       2   human   human
#> 3       3   human chatbot
#> 4       4   human   human
#> 5       5   human   human
#> 6       6 chatbot chatbot
#> 7       7   human   human
#> 8       8 chatbot chatbot
#> 9       9   human   human
#> 10     10 chatbot   human
#> 11     11   human   human
#> 12     12 chatbot chatbot

n_right
#> [1] 10
```

Read the two columns side by side and you can see exactly where he slipped. On review 3 a real customer's writing got called a chatbot, and on review 10 a chatbot got called real. Every other row matches.

`n_right` counts the rows where his call equals the key, and it comes to 10.

So the score is ten of twelve, and that is what everything from here on gets measured against.

=== step === concept
## What made the reading test fair

Before we make anything of that ten, we should be sure the test itself was worth running. A score of ten only means something if reading the review was the one thing that could have helped him.

Two decisions took care of that. Each review went into the stack on a coin toss, so no person chose how many of each kind Arjun would face. And the answers stayed folded in your pocket, so he had nothing to work with except the words in front of him.

Here is what the coin actually produced.

```r
# Count how many of the twelve reviews were human written and how many were chatbot
table(key = reviews$truth)
#> key
#> chatbot   human
#>       5       7
```

The coin gave seven human and five chatbot. That split is worth noticing, because nobody in the room knew it, Arjun included. Had somebody told him, he could have called seven of them human and collected correct answers for free, without reading a line.

=== step === quiz
## Quick check: what would have ruined the test?

You are setting the same test up again next week. Which one of these would stop the score from measuring his reading?

::quiz {"correct": 1, "gate": true, "difficulty": "beginner"}
- Telling Arjun at the start that seven of the twelve came from real customers. ::ok Right. The moment he knows seven are human, he can call seven of them human and beat a guesser without reading a word, so his score would be measuring arithmetic instead of reading.
- Tossing a coin for every review, so that not even you knew the split in advance. ::no
- Letting Arjun take as long as he wanted over each review. ::no
- Writing the answers on a slip of paper instead of trying to remember them. ::no Only one of these changes what the score measures. The coin toss, the unhurried reading and the slip of paper all leave his calls resting on the reviews themselves. Knowing the split does not, because seven human and five chatbot is something he can score off without reading anything. Showing him where each review came from, or choosing the twelve by hand, would break the test in the same way.

=== step === concept
## Start by assuming Arjun cannot tell at all

Now comes the move that feels backwards the first time you see it.

To argue that Arjun has skill, you do not begin by assuming he has skill. You begin by assuming the opposite: he cannot tell a chatbot review from a real one at all, and every call he made was a coin flip inside his head. Then you check whether his ten makes that assumption look ridiculous.

That starting assumption has a name. It is called the **null hypothesis**, written H0 and said out loud as "H nought". It is the boring story, the one where nothing interesting is going on.

Three moves take us from that assumption to an answer.

::widget process-flow {"steps": [{"title": "Assume no skill", "sub": "every call Arjun made was a coin flip"}, {"title": "Replay the guessing", "sub": "10,000 rounds of pure guessing on the same twelve reviews"}, {"title": "Count the matches", "sub": "how many of those rounds reached ten right"}]}

Everything from here is just doing those three things, one at a time.

=== step === concept
## What one pure guesser scores on the same twelve reviews

You might expect a guesser to get six of twelve, since half of twelve is six. On average that is exactly right. However, any single round of guessing is a different matter.

Let's put one guesser through the same twelve reviews. `sample()` with `replace = TRUE` draws twelve calls at random, each one human or chatbot with equal chance, which is a coin flipped twelve times.

```r
# Let one pure guesser call the same twelve reviews
set.seed(7)
one_round <- sample(c("human", "chatbot"), 12, replace = TRUE)
sum(one_round == reviews$truth)
#> [1] 8
```

A different seed here, so a different set of tosses from the ones that built the key, and again the same ones on your screen as on mine.

This guesser got eight of the twelve right, on no reading and no knowledge whatsoever, and still finished only two calls short of Arjun.

One round tells us nothing about what guessing usually does. For that we need a great many rounds.

=== step === concept
## Ten thousand rounds of pure guessing

`replicate()` runs the same block of code over and over and keeps the answer from every run. So we ask it for ten thousand rounds of pure guessing against the same answer key, and then draw the whole pile of scores. It takes a couple of seconds.

```r
# Play 10,000 rounds of pure guessing against the same answer key
set.seed(1)
luck_scores <- replicate(10000, {
  guesses <- sample(c("human", "chatbot"), 12, replace = TRUE)
  sum(guesses == reviews$truth)
})

hist(luck_scores, breaks = seq(-0.5, 12.5, by = 1), col = "grey85", border = "white",
     main = "10,000 rounds of pure guessing on the same twelve reviews",
     xlab = "Reviews called right out of twelve")
abline(v = 10, col = "red", lwd = 3)
```

That grey pile is what pure guessing looks like when you let it run ten thousand times. Every bar sits over a score, and the height of the bar is how many of the ten thousand rounds finished on that score.

Look at where the pile sits. The tall bars are around six, which is what a coin should give you. But the pile has real width to it. Guessing wanders up to eight and nine often enough to see clearly, and it keeps going, thinning as it goes, until the bars almost run out on the right.

The red line is Arjun's ten. Notice that it is not off the chart. It sits out in the thin part, where guessing does reach but rarely.

Rarely is not a number, and a number is what we need. So let's count.

=== step === quiz
## Quick check: what one bar in that pile means

Take the bar sitting over 9 in the chart you just drew. What is its height counting?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- The chance that Arjun scores 9 the next time somebody hands him twelve reviews. ::no
- The number of reviews that a guesser called correctly. ::no
- The number of those 10,000 pure guessing rounds that finished with exactly 9 calls right. ::ok Exactly. Each bar is a plain count of rounds, nothing more. Ten thousand rounds were played, every round landed on a score from 0 to 12, and each bar counts the rounds that landed on it.
- How confident we are that Arjun really scored 9. ::no Every bar is a count of rounds of guessing, and only that. Arjun appears nowhere in the chart, because none of those ten thousand rounds involved him or anybody reading anything. The pile is what the boring story produces, drawn so that we have something to compare his ten against.

=== step === concept
## How often guessing alone reached ten

`luck_scores` holds ten thousand numbers, one score for each round of guessing. To find how often guessing alone reached Arjun's ten, we ask how many of those numbers are ten or more. Ten or more rather than exactly ten, because the question is how often luck does at least as well as he did, and a round that scored eleven was luck outdoing him.

```r
# Count the guessing rounds that reached ten or better, then write it as a share
sum(luck_scores >= 10)
#> [1] 204

mean(luck_scores >= 10)
#> [1] 0.0204
```

So 204 of the ten thousand rounds reached ten or better.

The second line writes that same count as a share. `luck_scores >= 10` turns the ten thousand scores into ten thousand TRUE and FALSE values, and `mean()` over TRUE and FALSE is simply the fraction that came out TRUE. So 204 out of 10,000 is 0.0204.

That is about two in a hundred, and it answers the question the table argued about over lunch. How often does pure guessing manage ten of twelve? Roughly twice in every hundred attempts.

=== step === concept
## The verdict, and the bar you set before looking

A count is not yet a decision. Somebody has to say how rare is rare enough, and to see what that choice is worth, let's watch the count change as the bar moves.

The block below does the same counting at four different bars, 9, 10, 11 and 12. `sapply()` is what saves us writing the same two lines out four times: it runs the count once for every number in `bar` and collects the answers.

```r
# Show how the share of guessing rounds shrinks as the bar moves up
bar <- 9:12
data.frame(
  at_least = bar,
  rounds   = sapply(bar, function(k) sum(luck_scores >= k)),
  share    = sapply(bar, function(k) mean(luck_scores >= k))
)
#>   at_least rounds  share
#> 1        9    731 0.0731
#> 2       10    204 0.0204
#> 3       11     31 0.0031
#> 4       12      3 0.0003
```

Nine or better is nothing special: guessing manages it seven times in a hundred. Ten drops that to two in a hundred. Eleven is three in a thousand.

Arjun landed on ten. Two in a hundred is poor going for the guessing story. It can still explain what happened, but only by leaning on something that turns up about twice in every hundred tries, and skill explains the same result far more comfortably. So we drop the assumption that he was guessing and say he can do it.

Now here is the honest part. There is no natural point where rare becomes rare enough. The line most fields use is 5 in 100, and it is a convention somebody started and everybody kept. What matters more than the number is that you fix it before you look at the result. Deciding what would have convinced you after you already know the answer is not deciding anything.

[NOTE]
Two in a hundred clears the usual 5 in 100 bar, so Arjun walks away vindicated. Had he scored nine, the count would have been about seven in a hundred, and by that same convention the table would have gone back to work with no verdict at all.

=== step === tryit
## Your turn: how often does guessing reach eleven?

One more correct call would have put Arjun on eleven. Count how often pure guessing gets there.

```r
# luck_scores holds the score from each of 10,000 pure guessing rounds.
# Count the rounds that reached 11 or more, then write that same
# count as a share of all 10,000.
# Two lines. Press Check when you have them.
```
::check {"regex": "luck_scores\\s*>=\\s*11", "gate": true, "difficulty": "beginner", "ok": "Yes: 31 rounds out of 10,000, a share of 0.0031. One extra correct call takes the result from rare to almost unheard of.", "no": "Use the same two counting lines with the bar moved up: `sum(luck_scores >= 11)`, then the same line with `mean()` in place of `sum()`."}
::solution
```r
# Count the guessing rounds that reached eleven or better
sum(luck_scores >= 11)
#> [1] 31

mean(luck_scores >= 11)
#> [1] 0.0031
```

That is three in a thousand. The bar you set decides how much evidence you are asking for, and moving it by a single call changes that a great deal.

=== step === concept
## What the two-in-a-hundred does not say
::prose-only the point is which direction the reasoning runs, and the picture that carries it is the pile of guessing scores already drawn

There is one sentence people say about a result like this that sounds right and is not. Let's pin it down while the numbers are still fresh, because it is the difference between reading a result correctly and reading it backwards.

Our 0.0204 was counted inside a world we built by hand, a world where Arjun has no skill whatsoever. All ten thousand of those rounds were pure guessing, by construction. So the number says one thing and one thing only: if Arjun could not tell the difference at all, a score of ten or better would still show up about twice in a hundred tests.

What it does not say is that there is a 2% chance he was guessing. That would be a statement about Arjun, and we never worked out anything about Arjun. We worked out what a guessing machine produces.

[KEY INSIGHT]
The count runs in one direction. Assume no skill, then ask how ordinary Arjun's result would be. It never runs the other way, from his result back to the chance that he has no skill.

The two sentences use the same ingredients, which is why they sound like the same sentence. They are not the same, and keeping them apart is most of what it takes to read a result honestly.

=== step === concept
## Why a three-review test could never settle this

Twelve reviews was a choice you made while standing at the printer. So let's see what a shorter test would have been able to settle.

Suppose you had printed three reviews instead of twelve and Arjun had called all three right. That is a perfect score, and it would have looked wonderful. Here is how often pure guessing manages the same thing.

```r
# Run the same guessing test on only the first three reviews
set.seed(3)
tiny_scores <- replicate(10000, {
  guesses <- sample(c("human", "chatbot"), 3, replace = TRUE)
  sum(guesses == reviews$truth[1:3])
})

mean(tiny_scores == 3)
#> [1] 0.1198
```

That happens about twelve times in a hundred. A guesser sweeps all three roughly once in every eight attempts, which is common enough that you could never rule it out.

So a perfect score on a three-review test is worth almost nothing, however good it looks written down. How big you make the test decides what the test is able to settle, and it decides that before anybody reads a word.

=== step === concept
## The claim is about Arjun, not about these twelve reviews

Here is what makes all of this inference rather than counting.

Nobody at the table cares about those twelve particular reviews. They were printed, called and thrown in the recycling. The claim on trial is about Arjun himself: can he do this, in general, on reviews nobody has shown him yet? The twelve were only a sample of every review he might have been handed.

That matters, because a sample wobbles. To see how much, take a caller who genuinely has the skill, somebody who is right 80% of the time, and hand him twelve reviews ten thousand times over. `rbinom(10000, 12, 0.8)` asks: out of twelve calls, each right with probability 0.8, how many came out right this time? Then it does that ten thousand times.

```r
# Score a caller who really is right 80 percent of the time, over 10,000 tests
set.seed(5)
skilled_scores <- rbinom(10000, 12, 0.8)
table(skilled_scores)
#> skilled_scores
#>    4    5    6    7    8    9   10   11   12
#>    5   37  173  539 1326 2372 2827 2053  668

mean(skilled_scores < 10)
#> [1] 0.4452
```

Read the table first. A caller who is right 80% of the time usually scores nine, ten or eleven, but his scores run all the way from four to twelve. It is the same person with the same ability every time, judging twelve reviews at a go.

Now look at the second number. In 44.52% of those tests, a genuinely skilled caller scored below ten. Nearly half the time, real ability produces a result no better than the one we spent the afternoon judging, and often worse.

That is not a flaw in the test. It is what judging a person from a handful of examples means. Twelve reviews tell you about Arjun only indirectly, and that is exactly why we counted how often guessing reaches ten instead of simply admiring the ten.

=== step === concept
## binom.test does the ten thousand rounds in one line

You will not want to write a guessing simulation every time a question like this comes up. For a setup this simple, R already has the count built in.

`binom.test()` works out the same share with exact arithmetic instead of simulation. Read its arguments as "ten right out of twelve calls". The `alternative = "greater"` part says we only care about doing better than a coin, not worse.

```r
# Ask the same question with the built-in exact test
binom.test(10, 12, alternative = "greater")
#>
#> 	Exact binomial test
#>
#> data:  10 and 12
#> number of successes = 10, number of trials = 12, p-value = 0.01929
#> alternative hypothesis: true probability of success is greater than 0.5
#> 95 percent confidence interval:
#>  0.5618946 1.0000000
#> sample estimates:
#> probability of success
#>              0.8333333
```

The line to look at is `p-value = 0.01929`.

Ten thousand rounds of guessing gave us 0.0204. The exact arithmetic gives 0.01929. They agree, and they were always going to: the simulation is an estimate of the very number this function computes exactly. Run the rounds again from a different starting seed and you would land somewhere else close by, a little above or a little below.

And this is where it stops being about Arjun at all. Swap the twelve calls for two groups of patients and you have a t-test. Swap them for the average order value at three branches of a store and you have ANOVA. The data changes, the arithmetic changes, and the question underneath stays exactly the same: how surprising would this result be if nothing but luck were at work?

=== step === quiz
## Quick check: seven of twelve, and what to make of it

Suppose the afternoon had gone differently and Arjun had called seven of the twelve right instead of ten. It is the same coin toss, the same twelve reviews and the same key in your pocket. What should the table make of seven?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Seven is above half, so it is weak evidence that he has some skill. ::no
- Guessing alone reaches seven or better in roughly 38 rounds out of every 100, so a score of seven settles nothing either way. ::ok That is it. Of the ten thousand guessing rounds, 3,775 reached seven or better. A result that ordinary gives you no reason to drop the guessing story, and no reason to believe it either.
- Seven of twelve shows he was guessing, since a guesser averages six. ::no
- Seven is only three short of ten, so the verdict barely changes. ::no Seven sits in the fattest part of the guessing pile: 3,775 of the ten thousand pure guessing rounds got there or better. That is far too ordinary to argue against guessing, and it is no proof of guessing either, because a skilled caller has bad days too. A test that lands there has settled nothing, which is a real and honest outcome rather than a failure.

=== step === tryit
## Your turn: hand Arjun twenty reviews instead

Twelve reviews was your decision on the day. A longer test changes what counts as convincing, and it changes it in a direction most people find surprising.

Ten of twelve is 83% correct. Fifteen of twenty is 75% correct, a weaker performance. Count how often pure guessing reaches fifteen out of twenty, then compare it with the two in a hundred that Arjun's ten came to.

```r
# rbinom(10000, 20, 0.5) plays 10,000 rounds of a twenty review test
# for a pure guesser, and gives the number of correct calls in each round.
# Store those scores, then write the share of them that reached 15 or more.
# Press Check when you have it.
set.seed(6)
```
::check {"regex": "rbinom\\s*[(]\\s*10000\\s*,\\s*20\\s*,\\s*0?\\.5", "gate": true, "difficulty": "intermediate", "ok": "Right: 213 rounds out of 10,000 reached fifteen, a share of 0.0213. Fifteen of twenty is the weaker performance, and the longer test still leaves guessing only about 2 chances in 100 of matching it.", "no": "Build the scores first, then count them: `big_scores <- rbinom(10000, 20, 0.5)`, then `mean(big_scores >= 15)`."}
::solution
```r
# Count how often a pure guesser reaches fifteen right out of twenty
set.seed(6)
big_scores <- rbinom(10000, 20, 0.5)

sum(big_scores >= 15)
#> [1] 213

mean(big_scores >= 15)
#> [1] 0.0213
```

Fifteen of twenty lands in the same place as Arjun's ten of twelve, about 2 in 100, even though 75% correct is the weaker showing. Give a test more calls to make and a smaller edge becomes just as hard for guessing to fake.

=== step === quiz
## Quick check: which sentence states the verdict correctly

The count came to 204 rounds out of 10,000, which is 0.0204. Somebody at the table asks what that actually means. Which sentence says it correctly?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- There is about a 2% chance Arjun was only guessing. ::no
- If Arjun were only guessing, a score of ten or better would still turn up in about 2 tests out of every 100. He got one. ::ok Yes. It assumes the boring story first and then reports how ordinary his result would be inside it. That is the only direction this count ever runs.
- There is about a 98% chance Arjun can genuinely tell the two apart. ::no
- Arjun reads reviews correctly about 98% of the time. ::no Three of these four put the probability on Arjun, or on how good he is. The count only ever says how often data like his turns up in a world where he has no skill at all. He got ten of twelve, which is 83% correct, and 0.0204 is how ordinary a score like that would be under pure guessing.

=== step === concept
## References

- [The Design of Experiments](https://archive.org/details/in.ernet.dli.2015.502684) - Fisher (1935), chapter 2. The lady tasting tea, where this way of arguing was first written down properly.
- [The Introductory Statistics Course: A Ptolemaic Curriculum](https://doi.org/10.5070/T511000028) - Cobb (2007), Technology Innovations in Statistics Education 1(1). The case for teaching inference by simulation before formulas.
- [Permutation Methods: A Basis for Exact Inference](https://doi.org/10.1214/088342304000000396) - Ernst (2004), Statistical Science 19(4), 676-685. Why counting rearrangements is a real test rather than a shortcut.
- [Introduction to Statistical Investigations](http://www.isi-stats.com/isi/) - Tintle, Chance, Cobb, Rossman, Roy, Swanson and VanderStoep (2016), Wiley. A full course built on simulated worlds where nothing is going on.
- [Exact binomial test](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/binom.test.html) - R Core Team, the documentation for the one line version of the count you ran by hand.

=== step === complete
## Quick recap

You just did the whole of statistical inference on one small question, and you did it without a formula in sight. Here is the shape of what you did.

- A claim turned up that could be skill or could be luck. Arjun called ten of twelve reviews right.
- The test was built so that nothing but reading could help him. A coin chose every review and the answer key stayed out of sight.
- You assumed the boring story first, that he cannot tell at all, and played ten thousand rounds of pure guessing to see what that story produces.
- You counted the rounds that reached his ten. 204 out of 10,000, about 2 in 100.
- Two in a hundred is poor going for the guessing story, so skill is the better reading. The bar you judge against is a convention, and you fix it before you look.
- The count says how ordinary his ten would be if he were guessing. It never says how likely it is that he was guessing.
- Twelve reviews were only a sample of the reviews he might face, so scores wobble, and how big you make a test decides what it can settle.

Every named test works this way underneath. A t-test, ANOVA, a chi-squared test: different data, different arithmetic, the same question about how far luck alone can stretch.

That count you made, 204 out of 10,000, has a name. It is called the p-value, and it is misread more often than any other number in statistics, which is where we go tomorrow.

See you then.
