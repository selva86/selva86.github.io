---
title: "How statistical inference works, no formulas yet"
slug: "Inference-Mini-1"
description: "A friend calls nine of ten cups right in a Coke or Pepsi taste test. Is she skilled, or just lucky? Settle it by simulation in R, with no formulas anywhere."
keywords: "how statistical inference works, statistical inference, inference explained, null hypothesis, p-value intuition, simulation based inference, statistical significance, statistics in R"
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
course_next: "Inference-Mini-2"
curriculum_id: "0.0.1"
lesson_access: "windowed"
catalog_blurb: "The one question behind every statistical test, settled with a taste test."
---

=== step === cover
::eyebrow Inference from Zero
## How statistical inference works, no formulas yet

Let's start with a bet.

You are at a friend's place for dinner when Priya makes a claim: she can tell Coke from Pepsi by taste alone, every single time.

Nobody at the table believes her.

So you settle it. You carry ten identical cups into the kitchen and fill each one by tossing a coin, heads for Coke and tails for Pepsi, writing down what went where as you go. Until you check your own notes, not even you know how many of each you poured.

Priya tastes all ten and calls them one at a time.

She gets nine right.

Nine out of ten does sound like a lot. However, the trouble is that somebody with no ability at all, somebody flipping a mental coin over every cup, still gets a fair share of them right, and every so often that person gets almost all of them right.

So the question is not whether nine out of ten sounds impressive. It does. The real question is how often blind luck manages nine.

How do we find out?

Press the buttons below. Every bar you get is a real round of ten pure-guess calls, played right now in front of you, and the orange bars are the rounds where luck alone did as well as Priya or better.

::widget luck-simulator {"trials": 10, "p": 0.5, "observed": 9, "unit": "correct calls", "seed": 7}

Whatever reasoning you just used to make up your mind about Priya, you have already done statistical inference. Every statistical test you will ever run is that same reasoning, tightened up.

=== step === concept
## The ten cups, and the nine she called right

Let's start by putting that evening into R exactly as it happened, because every count we make from here on is based on it.

Two vectors do the whole job. `pours` is what the coin decided for each cup, and `calls` is what Priya said when she tasted it. She got every cup right except the third, so `calls` is a copy of `pours` with cup 3 flipped.

Press Run.

```r
# Pour ten cups by coin toss, record Priya's calls, and count how many she got right
set.seed(7)
pours <- sample(c("Coke", "Pepsi"), size = 10, replace = TRUE)

calls <- pours                                            # she matched every cup
calls[3] <- ifelse(pours[3] == "Coke", "Pepsi", "Coke")   # except the third one

taste_test <- data.frame(cup = 1:10, poured = pours, called = calls)
taste_test$correct <- taste_test$poured == taste_test$called

taste_test
#>    cup poured called correct
#> 1    1  Pepsi  Pepsi    TRUE
#> 2    2   Coke   Coke    TRUE
#> 3    3   Coke  Pepsi   FALSE
#> 4    4  Pepsi  Pepsi    TRUE
#> 5    5   Coke   Coke    TRUE
#> 6    6  Pepsi  Pepsi    TRUE
#> 7    7   Coke   Coke    TRUE
#> 8    8  Pepsi  Pepsi    TRUE
#> 9    9  Pepsi  Pepsi    TRUE
#> 10  10  Pepsi  Pepsi    TRUE

right <- sum(taste_test$correct)
right
#> [1] 9
```

`set.seed(7)` just fixes the coin tosses, so your ten cups come out the same as mine. `sample()` with `replace = TRUE` is the coin itself. Each cup gets Coke or Pepsi on its own toss, which is why the pours came out four Coke and six Pepsi instead of a tidy five and five.

The `correct` column compares the two vectors one cup at a time, and `sum()` over a column of TRUE and FALSE counts the TRUEs. That is where the 9 comes from.

So `right` is 9, and from here on that is the number the whole evening rests on.

=== step === concept
## What you can see, and what you want to know
::prose-only the split here is between an observed count and an unobserved ability, and the picture that carries it is the pile of guessing rounds the simulation builds shortly after

There are two different things in play here, and it is worth separating them now, because most arguments about statistics turn out to be arguments about which of the two somebody means.

The first is what you saw, which is nine cups out of ten, on one evening, at one dinner table. That number is settled. Nobody can dispute it, and running the evening again would not change what already happened.

The second is what you actually care about, which is whether Priya can taste the difference. That is a fact about Priya, not about the evening. There is no table you can read it off, and no amount of pouring will show it to you directly.

Statistical inference is the move from the first to the second. You have a number you can see, you want a fact you cannot see, and you need a defensible way of getting from one to the other.

And the defensible way is a strange one, so let's slow down for it. You do not argue that Priya is skilled. You argue about the opposite.

That is, you work out in full detail what would happen if she had no ability whatsoever, then check how comfortably the evening you saw fits inside that. When it does not fit, you have learned something.

=== step === concept
## What a pure guesser gets right

So let's build that no-ability world properly, because everything from here runs on it.

Think about what the coin bought you. Every cup was filled by a toss Priya never saw, so before she tasted anything, her chance of calling any single cup right with no ability at all was one half. It is not roughly one half. It is exactly one half, and it stays one half for all ten cups no matter what she said about the ones before.

That is why the coin was worth the trouble. If you had poured five Coke and five Pepsi and announced it, a guesser could count as she went and improve her odds on the later cups. And if you had simply poured whatever was in the fridge, nobody could say what pure guessing is worth here at all. The coin is what makes a no-ability caller a precisely known quantity, and you can only judge how surprising nine is against something precisely known.

In R, a pure guesser is one more call to `sample()`. She calls each cup with a coin of her own, and we compare her ten calls against the same ten pours.

```r
# Have a caller with no ability guess all ten cups once, and count her matches
set.seed(11)
one_round <- sample(c("Coke", "Pepsi"), size = 10, replace = TRUE)

sum(one_round == pours)
#> [1] 5
```

She got five out of ten. That is nothing to impress a dinner table, and notice that it is not zero either. Pure guessing is not the same as being wrong. It is being right about half the time, and on this round that meant five cups.

`set.seed(11)` pins this particular guesser, so the block gives 5 every time you run it and your number matches mine. Change the seed and you get a different guesser. Some land four, some land seven, and every so often one of them lands nine.

And that last part is the whole problem in miniature. One round cannot tell you how often nine happens.

=== step === quiz
## Quick check: what did the coin toss decide?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- It made sure exactly five cups held Coke and five held Pepsi, so neither drink had an advantage. ::no
- It fixed the chance that a caller with no ability names any single cup correctly at exactly one half. ::ok Exactly. The coin, plus the fact that Priya never saw it, is what makes a no-ability caller worth one half per cup. That known half is the yardstick everything else gets measured against.
- It made nine correct calls harder to reach, so a high score counts for more. ::no
- It took luck out of the pouring, so whatever Priya scored has to be ability. ::no The coin did not balance the two drinks, it did not make the calling harder, and it certainly did not remove luck. Four cups came out Coke and six came out Pepsi, and luck is exactly what is still on the table. What the coin did was fix the odds for a caller with no ability at one half per cup, which is the only reason we can say what pure guessing is worth.

=== step === concept
## Ten thousand rounds of pure guessing

One guesser landing five tells you almost nothing. What we need is the full range of what luck can do over ten cups, and the way to get it is to run the round again and again and keep every result.

`replicate()` does exactly that. You hand it an expression and a number of repetitions, and it collects the answers into one vector. Inside it goes the round we already have, where a guesser calls ten cups and we count her matches against `pours`. Ten thousand rounds takes a couple of seconds.

```r
# Run ten thousand rounds of pure guessing and see the whole spread of results
set.seed(1)
luck_right <- replicate(10000, {
  guess <- sample(c("Coke", "Pepsi"), size = 10, replace = TRUE)
  sum(guess == pours)
})

table(luck_right)
#> luck_right
#>    0    1    2    3    4    5    6    7    8    9   10
#>   15  100  428 1197 2005 2544 2045 1141  428   91    6

hist(luck_right, breaks = seq(-0.5, 10.5, by = 1), col = "grey85", border = "white",
     main = "10,000 rounds of pure guessing",
     xlab = "Cups called right out of ten")
abline(v = 8.5, col = "red", lwd = 3)
```

`luck_right` now holds ten thousand numbers, one per round, each of them somewhere between 0 and 10. Let's read the table as a census of them.

Look at the middle first. A score of 5 came up 2,544 times, and scores of 4, 5 and 6 together account for 6,594 of the ten thousand rounds. That is luck being ordinary, where a guesser lands about half the cups, give or take one.

Now look at the edges. A score of 9 came up 91 times and a perfect 10 came up 6 times. Nobody arranged that. It fell out of ten thousand rounds of honest coin flipping, and it is the first real answer to the dinner-table question. A guesser reaching nine is not impossible, it is only rare.

The histogram says the same thing in one picture. Every bar is a possible score and its height is how often the ten thousand rounds landed there. The red line sits just to the left of the 9 bar, so everything to the right of it is a round where luck did as well as Priya or better. There is very little sitting over there.

=== step === concept
## Counting the rounds that did as well as Priya

Now let's settle the bet, and we settle it by counting.

`luck_right >= 9` compares every one of the ten thousand rounds against Priya's nine and gives back TRUE or FALSE for each one. `sum()` counts the TRUEs, and `mean()` on that same vector gives the share, because the average of a column of ones and zeros is nothing but the proportion of ones.

```r
# Count the luck-only rounds that reached nine or better, as a count and as a share
sum(luck_right >= 9)
#> [1] 97

mean(luck_right >= 9)
#> [1] 0.0097
```

Ninety-seven rounds out of ten thousand. As a share, that is 0.0097, or about one in a hundred.

That is the answer to the question you started with. Out of ten thousand callers with no ability whatsoever, each one calling ten cups poured by coin toss, ninety-seven did as well as Priya or better. The other 9,903 fell short of her.

[KEY INSIGHT]
The whole argument is a count. Assume the boring explanation, work out in detail what it produces, then count how often it produces something as good as what you actually saw. Here that count is 97 in 10,000, or about 1%.

None of it needed a formula, a table in the back of a textbook, or a threshold to clear. Ten thousand rounds of an honest coin produced the number, and every one of those rounds is there for you to inspect.

=== step === quiz
## Quick check: why count nine or better, not exactly nine?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Because every round that came close belongs in the count, so the 428 rounds that reached eight go in as well. ::no
- Because the question is how far luck can stretch, and a round of ten out of ten is luck stretching further than Priya did, so it belongs in the count too. ::ok Right. You are asking how impressive nine is, so every luck-only round that matched it or beat it counts against it. That is why the 91 and the 6 get added together into 97.
- Because ninety-one rounds is too small a number to work with, so the tens are added to pad it out. ::no
- Because Priya might have called all ten right on a different evening, so those six rounds stand in for the evenings she never played. ::no Counting exactly nine would throw away the six rounds where a pure guesser called all ten, and those are luck doing even better than Priya. The question is how far luck can reach, not whether it lands on one particular number, so the count runs from nine upwards: 91 plus 6, which is 97.

=== step === tryit
## Your turn: how often does luck reach seven?

Suppose Priya had called seven right instead of nine. It is the same ten cups and the same coin, just a weaker evening. Would that have settled anything?

`luck_right` still holds all ten thousand rounds, so you can answer this by moving the bar and counting again.

```r
# luck_right holds the number of cups called right in each of
# 10,000 rounds of pure guessing.
# Count how many of those rounds reached seven or better,
# then write that count as a share of all 10,000.
# Two lines. Press Check when you have them.
```
::check {"regex": "luck_right\\s*>=\\s*7", "gate": true, "difficulty": "beginner", "ok": "That is it: 1,666 rounds out of 10,000, a share of 0.1666. Roughly one evening in six of pure guessing gets to seven, so seven right would have settled nothing at all.", "no": "Take the counting line you just used and move the bar down: sum(luck_right >= 7), then the same line again with mean() in place of sum()."}
::solution
```r
# Count the luck-only rounds that reached seven or better, as a count and a share
sum(luck_right >= 7)
#> [1] 1666

mean(luck_right >= 7)
#> [1] 0.1666
```

Seven and nine are only two cups apart, and yet the verdicts are nothing alike. Seven turns up about seventeen times more often under pure guessing than nine does, off a swing of two cups. So a result does not earn attention by being large. It earns attention by landing somewhere luck rarely goes.

=== step === concept
## What the count lets you say, and what it does not
::prose-only the verdict is a reading of the count and the pile of guessing rounds already produced, so a fresh picture of the same numbers would add nothing

Let's be careful about what has actually been established, because this is where the sentence people say out loud usually goes wrong.

What the count supports is this: luck is a poor explanation for Priya's evening. If she had no ability, an evening like hers would turn up about once in every hundred attempts, and you did not run a hundred attempts. You ran one and got the rare outcome first time, which is possible but uncomfortable, and that discomfort is the evidence.

Now, here are the two things the count did not do.

It did not measure how good Priya is. The 0.0097 only says how often pure guessers reach nine. Whether Priya is right 95% of the time or 72% of the time is a different question, and nothing we have run so far even asks it.

It also did not prove she has an ability. Ninety-seven of those ten thousand rounds really did reach nine, and every single one of them was a guesser. Priya could be the ninety-eighth. The count tells you how uncomfortable that explanation is, and it never shuts the door on it.

That is the shape of the whole subject. You rule things out by degrees, you never prove anything outright, and the number you report measures how badly the boring explanation fits.

=== step === concept
## Why a skilled caller can still fall short

Now let's turn the question around. Priya's evening came out rare under pure guessing and we treated that as evidence. So what happens when somebody genuinely can taste the difference and the evening still comes out ordinary?

Let's build that person. She is right on 70% of cups, which is a real and useful ability, well short of perfect. We give her ten thousand evenings of ten cups each and watch how she does.

```r
# Run ten thousand evenings for a caller who is genuinely right 70 percent of the time
set.seed(3)
skilled_right <- replicate(10000, {
  correct <- runif(10) < 0.7      # each cup: right with probability 0.7
  sum(correct)
})

mean(skilled_right)
#> [1] 7.0183

mean(skilled_right >= 9)
#> [1] 0.1528
```

`runif(10)` draws ten numbers spread evenly between 0 and 1, so the share of them falling below 0.7 is the share of cups she calls right. Her average evening comes out at 7.0 cups, which is exactly the ability we gave her.

Now look at the number that matters. She reaches nine on 15% of evenings. On the other 85% she lands eight or fewer, and a dinner table watching one of those evenings would decide she was guessing.

She was not guessing. She has the ability we handed her on every single one of those ten thousand evenings. Ten cups is simply too few to show it reliably.

[WARNING]
A count that fails to rule out luck is not evidence that nothing is there. A 70% ability is real, and over ten cups it still falls short of nine on 85% of evenings. "We could not rule out luck" and "there is nothing to find" are different sentences, and only the first one is ever earned.

=== step === quiz
## Quick check: what can the count never prove?

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- That Priya genuinely can tell the two drinks apart. ::ok Yes. The count measures how badly luck explains the evening, and that is the most it can ever do. Ninety-seven pure guessers did reach nine, so the door to luck is narrow, but it never shuts.
- That an evening as good as Priya's is rare when nobody has any ability. ::no
- That ninety-seven of ten thousand luck-only rounds reached nine or better. ::no
- That a weaker evening, seven right, would have been unremarkable. ::no Those three are all things the ten thousand rounds actually established: a share of 0.0097 at nine or better, ninety-seven rounds in that count, and 0.1666 at seven or better. The one thing the rounds can never deliver is proof of Priya's ability, because every round in them was played by somebody with no ability at all.

=== step === widget
## What twenty cups would have settled

Ten cups was never quite enough, and it is worth seeing how fast that changes.

So let's keep Priya's standard exactly where it is. She called 90% of the cups right, so over twenty cups that same standard means eighteen of them. And the question is the one we have been asking all along: how often does pure guessing get there?

Below, the guesser is calling twenty cups a round. Press Run 1,000 and read the counter.

::widget luck-simulator {"trials": 20, "p": 0.5, "observed": 18, "unit": "correct calls", "seed": 11}

The counter will most likely settle at 0.0%. Over ten cups, luck reached nine about once in a hundred rounds, so a thousand rounds of guessing would have thrown up roughly ten of them. Over twenty cups, a thousand rounds will usually not turn up a single eighteen. Same claim and same success rate, and yet the evening goes from awkward for the sceptic to almost impossible to wave away.

Nothing about Priya changed. We just collected more of her calls.

=== step === concept
## The two things that move the count

Two things decide how small that count comes out, and both are worth naming.

The first is how far your result sits from what luck normally does. Seven is inside the crowd and nine is out at the edge, and moving between them took the share from one in six to one in a hundred.

The second is how much data you collected. Ten cups and twenty cups asked the same question of the same ability, and the twenty-cup version answered it far more sharply.

So let's put both on one line each and read them side by side. `luck_reaches()` builds a fresh set of ten thousand luck-only rounds for whatever number of cups you give it, then reports the share of them that reached the bar.

One thing inside it changes, and it is only bookkeeping. Rather than pour cups and then compare calls against them, it draws the outcome of each cup straight away, TRUE for a call that came out right and FALSE for one that did not. It is the same coin doing the same job with less to carry around, and `sum()` still counts the TRUEs.

```r
# Report how often pure guessing reaches k correct calls out of n cups
luck_reaches <- function(k, n) {
  set.seed(42)
  rounds <- replicate(10000, sum(sample(c(TRUE, FALSE), size = n, replace = TRUE)))
  mean(rounds >= k)
}

data.frame(
  cups         = c(10, 10, 20, 40),
  called_right = c(7, 9, 18, 36),
  luck_reaches = c(luck_reaches(7, 10), luck_reaches(9, 10),
                   luck_reaches(18, 20), luck_reaches(36, 40))
)
#>   cups called_right luck_reaches
#> 1   10            7       0.1788
#> 2   10            9       0.0117
#> 3   20           18       0.0001
#> 4   40           36       0.0000
```

Read the first two rows against each other. The number of cups is the same in both, so the only thing moving is where the bar sits, and two extra cups called right drops the share from 0.1788 to 0.0117.

Now read rows two, three and four together. The standard is 90% correct in every one of them, and only the number of cups grows. The share falls to 0.0001, which is a single round out of ten thousand, and then to nothing at all, because not one of the ten thousand forty-cup rounds reached thirty-six.

Row two should look slightly odd, so let's clear that up. `luck_reaches(9, 10)` returns 0.0117 where the count you made by hand came out 0.0097, and that is because this is a different set of ten thousand rounds. A simulated share is itself an estimate, and it wobbles in the third decimal place. Both are saying the same thing, which is about one in a hundred.

=== step === concept
## The three moves, and the names they go by

Everything you just did comes down to three moves, in the same order, every time.

1. Assume the boring explanation. Priya has no ability and the coin is doing all the work.
2. Work out what that explanation produces. Ten thousand rounds of pure guessing and the whole spread of scores they land on.
3. Count how often it produced something as good as what you saw. Ninety-seven rounds out of ten thousand.

The first two have proper names, and now is a good time to pick them up.

The boring explanation is called the **null hypothesis**. It is written H0 and said out loud as "H nought". It is not a guess about what is true and it is not something you believe. It is the assumption you adopt on purpose, so that you have something precise enough to compute with.

The count is called the **p-value**. It is the share of results, in a world where the null hypothesis holds, that match or beat the one you actually got. Yours was 0.0097.

R will run all three moves in a single line. `binom.test()` takes nine successes out of ten trials, sets the null hypothesis at `p = 0.5` (the coin), and asks how often chance alone reaches nine or better.

```r
# Run the same three moves with a formula in place of ten thousand rounds
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

The line to look out for is `p-value = 0.01074`. Your ten thousand rounds gave 0.0097 and the formula gives 0.01074, which is the exact figure those rounds were circling. Neither one is more correct than the other. The formula is faster. The rounds are the one that shows you what the number actually is. The other lines in that printout are answering a different question, the one about how good Priya actually is, which is the question your count was never able to touch.

`alternative = "greater"` is what makes it count nine or better, instead of treating unusually bad calling as evidence too. That is the same choice you made by hand when you counted upwards from nine.

[KEY INSIGHT]
A t-test, a chi-square test, ANOVA: they all run these same three moves. Assume the null hypothesis, work out what it produces, report the share that matches or beats your data. The formula changes with the situation. The argument never does.

=== step === tryit
## Your turn: judge a fresh claim from start to finish

A colleague hears about the dinner and wants his own turn. This time it is fifteen cups, poured by coin toss in exactly the same way, and he calls twelve of them right.

Twelve out of fifteen is 80% correct, which is a weaker standard than Priya's 90%, over five more cups. So where does it land? Build the luck-only yardstick for fifteen cups and count.

```r
# A colleague called 12 of 15 cups right, poured the same way by coin toss.
# Build the luck-only yardstick: 10,000 rounds of a pure guesser
# calling 15 cups, then report the share that reached 12 or better.
# Use set.seed(5) so your number matches the answer.
# Press Check when you have it.
```
::check {"regex": "replicate[\\s\\S]*>=\\s*12", "gate": true, "difficulty": "intermediate", "ok": "That is the whole argument run start to finish, on a claim you had never seen: a share of 0.0182, about 2 in 100. Luck reaches twelve of fifteen roughly twice in every hundred tries, so his claim stands up about as well as Priya's did.", "no": "Reuse the round you built for ten cups and change two things: size = 15 inside the sampling, and a bar of 12 at the end. Start with set.seed(5), then replicate(10000, sum(sample(c(TRUE, FALSE), size = 15, replace = TRUE))), then take mean() of that vector at 12 or more."}
::solution
```r
# Build the luck-only yardstick for fifteen cups and count the rounds reaching twelve
set.seed(5)
luck15 <- replicate(10000, sum(sample(c(TRUE, FALSE), size = 15, replace = TRUE)))

mean(luck15 >= 12)
#> [1] 0.0182
```

One sentence covers it. If he could not taste the difference at all, twelve of fifteen or better would still turn up in about 2% of attempts, and his attempt went that way first time. Notice where it landed. It is 0.0182 against Priya's 0.0097, near her but not quite as strong, because his weaker standard pushed the count up while his extra cups pushed it back down.

=== step === quiz
## Quick check: which sentence reports the taste test correctly?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- There is about a 1% chance that Priya was just lucky. ::no
- If Priya had no ability at all, an evening of nine right or better would still turn up about 1% of the time. She got one. ::ok That is the sentence to say out loud. It starts inside the no-ability world, reports how ordinary an evening like hers would be in there, and then stops. Nothing about whether she is skilled, nothing about how skilled.
- The evening shows Priya can tell the two drinks apart about 99% of the time. ::no
- There is about a 99% chance that Priya can genuinely taste the difference. ::no The other three all shift the probability onto Priya. Two of them put it on whether she is skilled, and one turns it into a measure of how skilled she is. What you counted was a share of luck-only evenings that reached nine, so the sentence has to start in the luck-only world and stay there.

=== step === quiz
## Quick check: what would change the verdict?

Priya wants a result that is even harder to dismiss as luck. Which of these would actually shrink the count?

::quiz {"correct": 2, "gate": true, "difficulty": "advanced"}
- Pouring the same ten cups, but telling her in advance that five are Coke and five are Pepsi. ::no
- Pouring forty cups by coin toss and holding her to the same standard, so she has to call thirty-six of them right. ::ok Yes, and that is the lever with real reach. Off the same 90% standard, nine of ten left 117 luck-only rounds in ten thousand, while thirty-six of forty left none at all.
- Running the same ten-cup evening again next week and reporting whichever of the two evenings went better. ::no
- Raising the number of simulated rounds from ten thousand to a million. ::no None of the other three shrinks the count. Telling her the split in advance helps a guesser rather than hurting one, so it makes luck a better explanation instead of a worse one. Picking the better of two evenings does not make her result rarer, it only hides the other evening. And a million rounds just sharpens the estimate of a share that was always going to sit near 0.01.

=== step === concept
## References

- [The Design of Experiments](https://archive.org/details/in.ernet.dli.2015.502684) - Fisher (1935), chapter 2. The lady tasting tea, where this exact argument was first written down: assume no ability, work out what chance produces, count.
- [The Lady Tasting Tea: How Statistics Revolutionized Science in the Twentieth Century](https://archive.org/details/TheladytastingteaSalsburg2001) - Salsburg (2001). The history around Fisher's test and the people who built the rest of the subject on top of it.
- [The Introductory Statistics Course: A Ptolemaic Curriculum?](https://doi.org/10.5070/T511000028) - Cobb (2007), Technology Innovations in Statistics Education 1(1). The case for teaching inference by simulation first and formulas second.
- [OpenIntro Statistics](https://www.openintro.org/book/os/) - Diez, Cetinkaya-Rundel and Barr. The foundations-for-inference chapters work randomization-based inference through in full.
- [Exact Binomial Test](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/binom.test.html) - R Core Team, the documentation for `binom.test()`.

=== step === complete
## Quick recap

You settled a dinner-table bet with ten cups and a coin, and in doing that you ran the argument every statistical test runs.

- Pouring by coin toss is what made a caller with no ability worth exactly half the cups. That known half is what everything else got measured against.
- Ten thousand rounds of pure guessing gave the full spread. A score of 5 came up 2,544 times, 9 came up 91 times, and a perfect 10 came up 6 times.
- Counting the rounds that reached nine or better gave 97 out of 10,000, a share of 0.0097. `binom.test()` put the exact figure at 0.01074.
- The count says luck explains the evening badly. It does not measure Priya's ability and it never proves she has one: a caller who is genuinely right 70% of the time still falls short of nine on 85% of evenings.
- Two things move the count, how far the result sits from what luck does and how many cups you poured. At the same 90% standard, ten cups gave 0.0117 and forty gave nothing at all in ten thousand rounds.

So when somebody asks what the taste test showed:

"If Priya could not taste the difference at all, nine right or better out of ten would still turn up in about 1% of evenings. We saw one."

The boring explanation you assumed is the null hypothesis. The count you reported is the p-value. Those two words carry the rest of this course, where the t-test, ANOVA and all the others turn out to be this same argument, with a formula standing in for the ten thousand rounds.
