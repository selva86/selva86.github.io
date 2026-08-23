---
title: "How statistical inference works, no formulas yet"
slug: "Inference-Mini-1"
description: "A friend says she can tell Coke from Pepsi by taste, and gets nine of ten cups right. Build the luck-only world in R and watch a statistical test decide."
keywords: "how statistical inference works, statistical inference, null hypothesis, simulation in R, hypothesis testing for beginners, binom.test in R, statistical significance"
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
catalog_blurb: "The one question every statistical test asks, built from a bet over dinner."
---

=== step === cover
::eyebrow Inference from Zero
## How statistical inference works, no formulas yet

Let's start with a simple bet.

You are at a friend's place for dinner when Priya makes a claim. She says she can tell Coke from Pepsi by taste alone. Nobody at the table believes her.

So you carry ten identical plastic cups into the kitchen and fill each one by tossing a coin. Heads means you pour Coke, tails means Pepsi, and you write down what went into every cup as you go. Then you bring the tray back out.

Priya tastes all ten and calls them one at a time.

She gets nine right and one wrong.

::widget process-flow {"steps":[{"title":"Ten cups, filled by coin toss","sub":"heads is Coke, tails is Pepsi, and every pour is written down"},{"title":"Priya tastes and calls each cup","sub":"she never saw the pouring, and she calls them one at a time"},{"title":"Nine right, one wrong","sub":"the score everyone at the table now has to judge"}]}

Now, is Priya really skilled, or did she just get lucky?

Nine out of ten does feel like a lot. The trouble is that somebody with no ability at all, somebody purely guessing, still gets a fair share of the cups right, and every so often that guesser gets almost all of them.

So the question is not whether nine sounds impressive. It does. The real question is how often blind luck manages nine.

We are going to answer that without a single formula. We will build the world where Priya is guessing, replay those ten cups ten thousand times inside it, and count.

=== step === concept
## The ten cups, and what Priya called

Every number in this lesson comes out of the record of that evening, so that is where we start.

Two things were written down in the kitchen: what the coin poured into each cup, and what Priya called it. Press Run to rebuild both.

```r
# Write down what the coin poured and what Priya called, cup by cup
set.seed(1)
poured <- sample(c("Coke", "Pepsi"), size = 10, replace = TRUE)

called <- poured
called[7] <- ifelse(poured[7] == "Coke", "Pepsi", "Coke")

record <- data.frame(cup    = 1:10,
                     poured = poured,
                     called = called,
                     match  = ifelse(poured == called, "yes", "no"))
record
#>    cup poured called match
#> 1    1   Coke   Coke   yes
#> 2    2  Pepsi  Pepsi   yes
#> 3    3   Coke   Coke   yes
#> 4    4   Coke   Coke   yes
#> 5    5  Pepsi  Pepsi   yes
#> 6    6   Coke   Coke   yes
#> 7    7   Coke  Pepsi    no
#> 8    8   Coke   Coke   yes
#> 9    9  Pepsi  Pepsi   yes
#> 10  10  Pepsi  Pepsi   yes
```

`sample()` with `replace = TRUE` is the coin toss. Each cup gets its own draw of Coke or Pepsi, independent of the others, and that is why six Cokes and four Pepsis came out rather than a tidy five and five. `set.seed(1)` just fixes which pours you get, so your table matches mine.

The `called` column is what Priya said. It starts as a copy of the pours, and then the seventh entry is swapped for the other drink, which is all `ifelse()` is doing here: look at what cup seven held, and write down the opposite. So her call matches the pour on every cup except the seventh, where she said Pepsi and the cup held Coke. That is her nine out of ten.

Now count the matches.

```r
# Count the cups where her call matched what was poured
sum(poured == called)
#> [1] 9
```

Comparing the two columns gives ten TRUE or FALSE answers, one per cup, and `sum()` counts the TRUEs. Nine.

So nine is the number we have to judge. Everything from here on is about what nine is worth.

=== step === concept
## A pure guesser still gets some of the cups right

Now suppose Priya has no ability whatsoever. She never tasted a thing and simply said Coke or Pepsi at random for each cup. How many would she get right?

Not zero, and that is the part people skip. A random call matches the pour about half the time, so a guesser lands near five out of ten with no skill at all.

Let's watch one round of that. The calls below come from a coin rather than from tasting, and they are scored against the same ten pours.

```r
# Let someone with no ability call the same ten cups, then score the round
set.seed(11)
guesses <- sample(c("Coke", "Pepsi"), size = 10, replace = TRUE)
guesses
#>  [1] "Pepsi" "Pepsi" "Pepsi" "Coke"  "Pepsi" "Coke"  "Coke"  "Pepsi" "Pepsi"
#> [10] "Pepsi"

sum(guesses == poured)
#> [1] 7
```

Seven. Nobody tasted anything, nobody knew anything, and the coin still matched seven of the ten pours.

That is why you cannot judge nine by feel. Nine only means something next to what luck does on its own, and luck just reached seven.

=== step === concept
## Start by assuming she cannot taste at all

The round you just ran is the whole trick behind statistical inference, and it has a name.

To test a claim, you do not start by assuming it is true. You start by assuming the opposite, which is the plainest and most boring story that could have produced your data. Here that story is that Priya cannot taste any difference at all, and every call she made was a coin flip.

That assumption is called the **null hypothesis**. It is written H0 and said out loud as "H nought".

This is not a belief about Priya and it is not an accusation. We pick it because it is the only story we can actually build. Saying she has some ability does not tell you how much of it, so there is nothing to replay. Saying she is guessing tells you exactly what to do: flip a coin ten times and see how the score comes out.

Once you can replay that story, the rest is three moves.

::widget process-flow {"steps":[{"title":"Assume she is guessing","sub":"every call is a coin flip and no cup owes anything to taste"},{"title":"Replay the ten cups on luck alone","sub":"play that guessing round thousands of times over"},{"title":"Count how often luck reached nine","sub":"the share of guessing rounds that did as well as she did"}]}

Those three moves are what every statistical test does, whatever it is called and whatever data you hand it. The formulas and the tables and the printouts are just shortcuts for the second and the third move.

=== step === quiz
## Quick check: why start by assuming she is guessing?

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- Because most people who claim a talent like this turn out to be exaggerating, so guessing is the likelier story. ::no
- Because a good test is meant to be sceptical, and starting from doubt is the scientific way to behave. ::no
- Because guessing is the one story with no unknowns in it, so you can build it and replay it as often as you like. ::ok Exactly. You are not calling Priya a fraud. You are picking the one version of the evening you can rebuild from scratch, so that her nine has something to be compared against.
- Because the coin toss has already shown she has no ability, so guessing is the fair place to start. ::no The starting assumption is not a verdict on Priya, and it is not about being sceptical or polite. It is chosen because it is the only story that can be built and replayed: a fifty-fifty call, ten times over, as many rounds as you like. Nothing about her nine cups has been decided yet.

=== step === concept
## Ten thousand rounds of pure guessing

One round of guessing showed us that luck can reach seven. It cannot tell us how often luck reaches nine, because one round is just one round.

So play a lot more of them.

The buttons below run exactly the round you just ran. Ten cups, every call decided by a coin, scored against the same pours. Every bar is a real round played right now in front of you, stacked up by how many cups the guesser got right, and the orange bars are the rounds where luck alone did as well as Priya or better.

Press "Run 1 game" a few times to watch single rounds land, then run a thousand at a time.

::widget luck-simulator {"trials": 10, "p": 0.5, "observed": 9, "unit": "cups called right"}

Two things to notice here. The pile builds up around five, which is what a coin should give you over ten cups. And the orange bars do fill in, slowly, which means luck really does reach nine every once in a while.

That pile is the luck-only world. All that is left is to read it properly.

=== step === concept
## How often did luck alone reach nine?

The buttons give you the feel of it. Now let's build the same thing in R so we can count it exactly instead of eyeballing bars.

The function `replicate()` runs a piece of code over and over and keeps the answer from every run. The piece of code here is one guessing round: ten random calls, scored against the same ten pours. Ten thousand rounds of it takes a couple of seconds.

```r
# Play ten thousand rounds of pure guessing and keep the score from each one
set.seed(2)
luck_hits <- replicate(10000, {
  guesses <- sample(c("Coke", "Pepsi"), size = 10, replace = TRUE)
  sum(guesses == poured)
})

table(luck_hits)
#> luck_hits
#>    0    1    2    3    4    5    6    7    8    9   10 
#>   13   98  389 1161 2170 2414 2070 1135  430  109   11 
```

Let's read that tally as a row of buckets. The top row is the score out of ten, and the bottom row is how many of the ten thousand guessing rounds landed on it.

Five is the most crowded bucket with 2,414 rounds, and four, five and six between them hold most of the rounds. Then it thins out fast. 430 rounds reached eight, 109 reached nine, and 11 rounds called all ten correctly on pure luck.

Nine or better is those last two buckets put together. Let's count them.

```r
# Count the guessing rounds that matched or beat Priya's nine
sum(luck_hits >= 9)
#> [1] 120

mean(luck_hits >= 9)
#> [1] 0.012
```

`luck_hits >= 9` turns the ten thousand scores into ten thousand TRUE or FALSE answers to a single question: did this round reach nine? `sum()` counts the TRUEs, and `mean()` writes that same count as a share, because averaging TRUEs and FALSEs gives you the proportion of TRUEs.

120 rounds out of 10,000, which is 0.012. A bit more than one round in a hundred.

That is the number the whole bet turns on. Pure guessing, with no ability at all, reaches nine or better about once in every hundred rounds.

[KEY INSIGHT]
You never needed to know anything about Priya to get 0.012. It came out of the boring story alone: ten coin flips, ten thousand times over. That is what a statistical test computes for you, no matter which test it is or what the data looks like.

=== step === tryit
## Your turn: how often does luck get all ten right?

`luck_hits` still holds the score from every one of those ten thousand guessing rounds. Suppose Priya had gone perfect instead, all ten cups out of ten.

Count how many guessing rounds got all ten right, then write that count as a share of the ten thousand. It is the same pair of lines you just ran, with the bar moved up.

```r
# luck_hits holds the score from each of 10,000 pure-guessing rounds.
# Count the rounds that got all ten cups right,
# then write that count as a share of all 10,000.
# Two lines. Press Check when you have them.
```
::check {"regex": "luck_hits\\s*(==|>=)\\s*10", "gate": true, "difficulty": "beginner", "ok": "Right: 11 rounds out of 10,000, a share of 0.0011. Luck does reach a perfect ten, roughly once in a thousand rounds.", "no": "Reuse the counting pair from the block above and move the bar to ten: sum(luck_hits >= 10), then the same line with mean() in place of sum()."}
::solution
```r
# Count the guessing rounds that called all ten cups correctly
sum(luck_hits == 10)
#> [1] 11

mean(luck_hits == 10)
#> [1] 0.0011
```

Eleven rounds in ten thousand. A perfect score is a lot rarer than nine, which is exactly what you would hope for. The better the result, the harder luck finds it.

=== step === concept
## Pick the bar before you pour the cups
::prose-only the bar is a decision rather than an object, and the count it gets compared against is already on screen

One piece of this has to happen before a single cup is poured, and it is the easiest one to get wrong.

You have to decide in advance how rare the luck-only result has to be before you will accept the claim. That bar has a name, the significance level, and by long habit people set it at one in twenty, or 0.05. Priya's 0.012 comes in under that, so on this evidence her claim stands.

Why decide in advance? Because if you wait until you have seen the score, you will put the bar just underneath it. Nine right, and one in a hundred sounds like the obvious place to draw the line. Six right, and one in five starts to feel reasonable. A bar picked after the fact is not a bar at all. It is a rubber stamp for whatever happened.

There is nothing sacred about 0.05 either. It is a convention that stuck, and where a wrong call is expensive people set a stricter one. What matters far more than the number is that you wrote it down before the pouring started.

=== step === concept
## So, is Priya skilled or just lucky?
::prose-only the verdict is a sentence about the count already computed, and saying it correctly is the thing being taught

Back to the dinner table, where everybody is waiting for a verdict. Here is what you can honestly say, and it is worth saying slowly.

If Priya cannot taste any difference at all, a score of nine or better would still turn up in about 1 round in 100. She got nine on her first and only attempt.

So one of two things happened that evening. Either a one-in-a-hundred run of luck landed on the very first try, or she can genuinely taste the difference. The second is much easier to believe, so that is the call you make.

Now notice what that does not say. It does not prove she can taste the difference, and no number of cups ever will. A test only tells you how easily luck accounts for what you saw. When luck accounts for it badly enough, you stop leaning on luck as the explanation. That is the whole of the verdict.

And notice what the 0.012 is attached to. It is not the chance that Priya was guessing. It runs the other way. It is how often guessing produces a result like hers.

[KEY INSIGHT]
A test does not prove a claim true. It measures how easily luck alone accounts for your result, and 0.012 says luck accounts for Priya's nine rather badly.

=== step === quiz
## Quick check: what does one round in a hundred describe?

Priya called nine of the ten cups right, and pure guessing reaches nine or better in about 1 round in 100. Which sentence says what that 0.012 actually describes?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- There is roughly a 1% chance that Priya was guessing all along. ::no
- If Priya were guessing, a score of nine or better would still come up in about 1 round in 100. ::ok That is it. It starts inside the guessing story and reports how often data like hers turns up in there. That is the only direction the number ever runs.
- There is a 99% chance that Priya can tell Coke from Pepsi. ::no
- Priya calls about 99% of cups correctly when she tastes them. ::no The 0.012 was built entirely inside the guessing world: ten coin flips, ten thousand times, and 120 of those rounds reaching nine. It says how often that story produces a score like hers. It puts no probability on Priya being a guesser, and it says nothing about how often she is right when she really tastes, which was nine times in ten here.

=== step === concept
## The coin toss was doing more work than it looked

Everything so far rests on one assumption, which is that a guesser's call matches the pour half the time. Where did that half come from? The coin.

Because every cup was filled by its own toss, Coke and Pepsi were equally likely in every single cup, and nothing about the order or the totals could be worked out from across the room. A caller with no ability has nothing whatsoever to go on, so a call lands right half of the time.

Break that and the comparison stops being fair. Suppose you had poured whatever was left in the two bottles, eight cups of Coke and two of Pepsi, and Priya could see those bottles sitting on the counter. Somebody who cannot taste a thing can now say "Coke" ten times and do rather well.

```r
# Pour eight Cokes on purpose, then let a caller who says Coke every time score the round
rigged_poured <- c(rep("Coke", 8), rep("Pepsi", 2))
always_coke <- rep("Coke", 10)

sum(always_coke == rigged_poured)
#> [1] 8
```

Eight out of ten, from somebody who never tasted a thing and used one word all evening. Judged against a fifty-fifty luck world, eight looks close to remarkable. It is nothing of the sort, and the reason is in the pouring, not in the tasting.

Three things earned us the right to compare Priya against a fifty-fifty world:

1. The coin decided each pour, so Coke and Pepsi were equally likely in every cup.
2. Priya was out of the kitchen, so no cup could be worked out by watching.
3. The answers were written down before she called anything, so nothing could be adjusted afterwards.

Break any one of those and the number you compute is still a number, but it is no longer measuring what you think it is. That is why statisticians are so fussy about how the data was collected. The comparison world is only as good as the collecting.

=== step === concept
## Ten cups is a small test, even for a real taster

Let's turn the question around for a moment. Suppose Priya really can taste the difference, but not perfectly. Say she is right about eight times in ten over the long run. How often would a talent like that clear the bar of nine?

We can replay that world too. Same ten cups and the same scoring, except each call is now right with probability 0.8 instead of 0.5.

```r
# Play ten thousand rounds for a real taster who is right eighty percent of the time
set.seed(3)
taster_hits <- replicate(10000, {
  calls <- sample(c("right", "wrong"), size = 10, replace = TRUE, prob = c(0.8, 0.2))
  sum(calls == "right")
})

mean(taster_hits >= 9)
#> [1] 0.3814
```

`prob = c(0.8, 0.2)` is the only thing that changed. It makes each call right eight times out of ten rather than five, and the round is scored the same way as before.

38 rounds in every 100. Somebody with real, genuine ability reaches nine or better on ten cups about a third of the time, and falls short the other two thirds.

So a score of six from Priya would not have shown she was making it up. It would have shown that ten cups is not many cups. A small test misses real ability all the time, and the smaller the ability, the more often it gets missed.

[NOTE]
Failing to clear the bar is not the same as showing the claim is false. It means this particular evidence was not enough to rule luck out, which leaves the question open rather than settling it the other way.

=== step === quiz
## Quick check: what would a score of six have told you?

::quiz {"correct": 4, "gate": true, "difficulty": "intermediate"}
- It would have shown that Priya cannot tell the two drinks apart. ::no
- It would have shown the tasting was badly run, because a fair test gives a clear answer. ::no
- It would mean the odds are about six in ten that she can taste the difference. ::no A score of six settles very little in either direction. Six is a thoroughly ordinary result for a guesser, and a real taster who is right eight times in ten still fails to reach nine in about two rounds out of three on only ten cups. A score is not the odds that a claim is true, and a test that comes back short is not a broken test.
- Not much either way. Six is an ordinary score for a guesser, and even a real taster misses nine most of the time on ten cups. ::ok Exactly right. Falling short of the bar leaves the question open. To close it you would need more cups, not a different opinion about the six.

=== step === concept
## binom.test does all of it in one line

We did this the long way on purpose, because the long way is what shows you what the number really is. In practice nobody replays ten thousand rounds to settle a bet like this. R has the whole argument packed into a single function.

`binom.test()` asks your question word for word: nine right out of ten tries, when each try is right half the time by chance alone, how often does luck do this well or better? The `alternative = "greater"` part says you only care about beating chance, which is exactly what you counted.

```r
# Ask the same question with the standard test
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

Read the arguments as "nine right out of ten tries, with a half chance on each try".

The line to look out for is `p-value = 0.01074`. Our ten thousand rounds gave 0.012. Both agree to two decimal places because they answer the same question, and the small gap between them is only the wobble of having replayed ten thousand rounds rather than every possible one. R works it out exactly with arithmetic, which is why it is instant and gives the same answer every time.

`probability of success 0.9` is just Priya's score written as a share. The interval above it answers a different question, which is how good she is rather than whether she is guessing.

The number R labels `p-value` is the count you built by hand. That is all a p-value has ever been.

=== step === concept
## A t-test asks the same question about numbers

Priya's cups gave us counts: right or wrong, nine out of ten. Most data does not come in that shape. It comes as measurements, and the question can sound like a different one at first.

Say the tasting is over and the two bottles get poured into labelled glasses, so everybody at the table can score both drinks for sweetness out of ten, all eight of them. Nobody has to guess which drink is which now. You are not counting correct calls any more, you are comparing two sets of numbers that came from the same eight people.

```r
# Score both drinks for sweetness and compare the two sets of scores
sweet_coke  <- c(6, 7, 5, 6, 7, 6, 8, 6)
sweet_pepsi <- c(8, 8, 7, 7, 9, 8, 9, 8)

t.test(sweet_pepsi, sweet_coke, paired = TRUE)
#> 
#> 	Paired t-test
#> 
#> data:  sweet_pepsi and sweet_coke
#> t = 8.8807, df = 7, p-value = 4.652e-05
#> alternative hypothesis: true mean difference is not equal to 0
#> 95 percent confidence interval:
#>  1.192318 2.057682
#> sample estimates:
#> mean difference 
#>           1.625 
```

`paired = TRUE` says the two sets of scores came from the same eight people in the same order, so the comparison happens person by person rather than group against group.

`mean difference 1.625` says the average person scored Pepsi 1.625 points sweeter than Coke. And `p-value = 4.652e-05`, which is R's way of writing 0.00004652, is the same kind of number you counted for Priya. If the two drinks were equally sweet, so that any gap came out of nothing but the ordinary disagreement between eight people, a gap as big as 1.625 would show up fewer than 5 times in every 100,000 tables like this one.

The three moves are the same. Assume nothing is going on, which here means the two drinks taste equally sweet. Work out what that assumption produces. Then see how often it produces a gap as big as yours. The only difference is that a t-test does the middle move with arithmetic instead of replays, because for measurements like these the shape of the luck-only world is already worked out.

Put three drinks on the table instead of two and the test picks up a new name, ANOVA, and asks that same question of all three at once.

=== step === quiz
## Practice: which change would break the luck-only world?

One of these changes to the evening would make a fifty-fifty guessing world the wrong thing to compare Priya against. Which one?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Priya calls the cups in a different order from the one they were poured in. ::no
- You pour whatever is left in the two bottles, so seven cups are Coke, and the bottles stay in view on the counter. ::ok Yes. Two things went wrong at once. The cups stopped being an even toss, and the bottles told a caller which way to lean, so someone with no ability at all can now beat a fifty-fifty world without tasting a thing.
- You use twenty cups instead of ten, with each one still filled by its own coin toss. ::no
- Priya sips water between cups to clear her mouth. ::no The fifty-fifty world holds as long as a caller with no ability has nothing to go on. A different order, more cups and a sip of water all leave that alone, because every cup is still an even toss she cannot see. Pouring the leftovers in plain sight does not leave it alone, and that is what breaks the comparison.

=== step === tryit
## Practice: how often would a seventy percent taster reach nine?

The taster we replayed a moment ago was right eight times in ten, and about 38 rounds in every 100 reached nine or better. Now try a weaker talent, somebody who is right seven times in ten.

Play the same ten thousand rounds for that taster and read off the share of rounds that reach nine or better. Keep everything else the same and use `set.seed(5)` so your number matches mine.

```r
# taster_hits came from 10,000 rounds where each call was right 80% of the time.
# Play the same 10,000 rounds for a taster who is right 70% of the time,
# then read off the share of rounds that reached nine or better.
# Use set.seed(5). Press Check when you have it.
```
::check {"regex": "0?\\.7[\\s\\S]*(>=|>)\\s*9", "gate": true, "difficulty": "intermediate", "ok": "Yes: 0.146, which is about 15 rounds in every 100. Drop the talent from eight in ten to seven in ten and the chance of clearing the bar on ten cups falls by more than half.", "no": "Copy the taster block, put prob = c(0.7, 0.3) where c(0.8, 0.2) was, keep set.seed(5), and finish with mean() of the scores at nine or better."}
::solution
```r
# Play ten thousand rounds for a taster who is right seventy percent of the time
set.seed(5)
weak_hits <- replicate(10000, {
  calls <- sample(c("right", "wrong"), size = 10, replace = TRUE, prob = c(0.7, 0.3))
  sum(calls == "right")
})

mean(weak_hits >= 9)
#> [1] 0.146
```

About 15 rounds in 100. There is real ability at that table, and ten cups still miss it nearly six times out of seven.

=== step === quiz
## Practice: which number in the binom.test output did you build by hand?

Look back at what the one-line test returned. Besides the nine and the ten you handed it, it printed 0.01074, 0.9, and an interval running from 0.6058367 to 1. One of those numbers is the share of luck-only rounds you counted yourself. Which one, and why?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- 0.9, the probability of success, because it is the share of cups Priya called right. ::no
- 0.6058367, the lower end of the interval, because it is the share luck would have to reach. ::no
- 0.01074, the p-value, because it is the share of guessing rounds that reach nine or better, which is the counting move. ::ok Exactly. You built that same share with sum(luck_hits >= 9) and mean(), and ten thousand replays gave you 0.012. R works it out exactly instead of replaying.
- 1, the upper end of the interval, because a share can never go higher than that. ::no Only one of those numbers counts luck-only rounds. 0.9 is Priya's own score written as a share, and 0.6058367 to 1 is the interval, which answers how good she is rather than how often guessing does this well. The p-value, 0.01074, is the number you built with sum(luck_hits >= 9) and mean(): the share of rounds where guessing alone reached nine, which is the third of the three moves.

=== step === concept
## References

- [Lady tasting tea](https://en.wikipedia.org/wiki/Lady_tasting_tea) - the encyclopedia entry on Fisher's original experiment from The Design of Experiments (1935), chapter 2, which is where this bet comes from.
- [Statistical Inference: The Big Picture](https://doi.org/10.1214/10-STS337) - Kass (2011), Statistical Science 26(1), 1-9. What inference is actually doing, and the assumptions holding it up.
- [The Introductory Statistics Course: A Ptolemaic Curriculum](https://doi.org/10.5070/T511000028) - Cobb (2007), Technology Innovations in Statistics Education 1(1). The case for teaching simulation before formulas.
- [OpenIntro Statistics](https://www.openintro.org/book/os/) - Diez, Cetinkaya-Rundel and Barr, 4th edition. The foundations for inference chapter covers this ground at book length, free to download.
- [Exact binomial test](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/binom.test.html) - R Core Team, the documentation for `binom.test()`.

=== step === complete
## Quick recap

You settled a dinner table bet without a single formula, and the way you settled it is the way every statistical test works. To summarize:

- Priya called nine of ten cups right, and nine on its own is worth nothing until you know what luck does with ten cups.
- So you assumed the boring story first: no ability at all, every call a coin flip.
- You replayed that story ten thousand times and counted. 120 rounds reached nine or better, a share of 0.012.
- About 1 round in 100. Either a rare run of luck landed on the first try, or Priya can taste the difference, and the second is far easier to believe.
- `binom.test(9, 10, p = 0.5, alternative = "greater")` answers the same question in one line and returns 0.01074. It calls that number a p-value.
- None of it counts unless the pouring was fair: a coin per cup, nobody watching, and the answers written down first.

Say it out loud once and it will stick. Assume nothing is going on, replay that world, and count how often it does as well as you did.

That number the test called a p-value has two readings that almost everybody gets wrong. Pulling those apart is a topic for another day.
