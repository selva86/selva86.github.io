---
title: "How statistical inference works, no formulas yet"
slug: "Inference-Mini-1"
description: "A colleague names 9 of 10 cups of Coke and Pepsi right. Simulate 10,000 guessing rounds in R and see how statistical inference tells real skill from luck."
keywords: "how statistical inference works, statistical inference, null hypothesis, inference by simulation, simulation in R, statistical inference explained, binom.test, chance and evidence"
mathjax: false
webr: true
date: "2026-09-04"
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
catalog_blurb: "How to tell a real result from an ordinary run of luck."
---

=== step === cover
::eyebrow Inference from Zero
## How statistical inference works, no formulas yet

Today we are going to build up the idea that sits under every statistical test you will ever run, and we are going to do it without writing down a single formula.

Here is where it starts.

My colleague Priya insists that if you hand her a cup, she can tell you by taste alone whether it is Coke or Pepsi. Nobody at the table believes her, so we settle it properly. We pour 10 identical cups, 5 from each bottle, in an order she cannot see, and we do not tell her how many of each went in. She tastes them one at a time and names each one.

She gets 9 of the 10 right.

Now, 9 out of 10 is a good score. But a person who cannot taste any difference at all, and is just picking a name for each cup, would still get some of them right. On a good run they would get a lot of them right.

So the question is not whether she did well on those 10 cups. She did. The question is how often 10 cups of pure guesswork would land on 9 or more.

That is the question statistical inference answers, and there are three moves to it.

::widget process-flow {"steps":[{"title":"Assume she is guessing","sub":"no tasting ability at all, each cup right half the time"},{"title":"Simulate 10,000 guessing rounds","sub":"10 cups per round, scored out of 10"},{"title":"Compare her 9 against them","sub":"count the rounds that reached 9 or more"}]}

That is the whole method. The rest is carrying it out in R, one move at a time.

=== step === concept
## What the 9 out of 10 actually measured

Before we can judge that score, we need the round itself in R, because every count we make from here uses it.

Each cup carries two facts: the drink that went into it, and the drink she named. So 10 cups give us 10 pairs.

Press Run.

```r
# Record what was poured into each cup and what Priya named it
tasting <- data.frame(
  cup    = 1:10,
  poured = c("Coke", "Pepsi", "Pepsi", "Coke", "Coke",
             "Pepsi", "Coke", "Pepsi", "Pepsi", "Coke"),
  named  = c("Coke", "Pepsi", "Pepsi", "Coke", "Pepsi",
             "Pepsi", "Coke", "Pepsi", "Pepsi", "Coke")
)

tasting
#>    cup poured named
#> 1    1   Coke  Coke
#> 2    2  Pepsi Pepsi
#> 3    3  Pepsi Pepsi
#> 4    4   Coke  Coke
#> 5    5   Coke Pepsi
#> 6    6  Pepsi Pepsi
#> 7    7   Coke  Coke
#> 8    8  Pepsi Pepsi
#> 9    9  Pepsi Pepsi
#> 10  10   Coke  Coke

sum(tasting$poured == tasting$named)
#> [1] 9
```

`poured == named` is TRUE on a cup she got right and FALSE on one she missed, and summing a vector of TRUEs and FALSEs counts the TRUEs. That comes to 9. Cup 5 is the only miss, where Coke went in and she said Pepsi.

So 9 of 10 is the measurement. It is a fact about these 10 cups and about nothing else.

The claim on the table is much bigger than that. She says she can taste the difference, and that covers the next 10 cups, and the 10 after those, and every cup she has never tasted.

Getting from the measurement to a conclusion about the claim is the job of statistical inference. And the first thing standing in the way is that someone with no tasting ability whatsoever can still score well on 10 cups.

[NOTE]
90% here means 9 of these 10 cups, nothing more. It is not her long-run accuracy. We have no idea yet what that number is, and one round of 10 cups on its own is not going to tell us.

=== step === concept
## Why start by assuming she is guessing

There are two explanations for 9 correct cups. Either she can taste the difference, or she cannot and this was a good run. Look at what each one gives you to work with.

"She can taste the difference" fixes no number at all. How good is she? Right on 95% of cups? On 70%? Barely better than half the time? The claim does not say, so there is nothing in it to compute with.

"She cannot taste the difference" fixes exactly one number. If the two drinks are indistinguishable to her, then on every cup she is choosing a name with nothing to go on, and she is right half the time. That is a probability of 0.5 per cup, cup after cup, for as many cups as you care to pour.

Only the second explanation can be written down and run. That is why the argument starts from the explanation you doubt rather than the one you are actually interested in.

That assumption of no ability is called the **null hypothesis**, written H0 and said out loud as "H nought". It is not what we believe about Priya. It is the one story specific enough to simulate, so we are going to simulate it and find out whether 9 correct cups is the sort of thing it produces.

Let's play a single round of it. The round is 10 cups, with one right-or-wrong draw per cup, right half the time, and no tasting anywhere in the process.

```r
# Score one round of 10 cups played with no tasting ability at all
set.seed(1)
one_round <- sample(c("right", "wrong"), 10, replace = TRUE)
one_round
#>  [1] "right" "wrong" "right" "right" "wrong" "right" "right" "right" "wrong"
#> [10] "wrong"

sum(one_round == "right")
#> [1] 6
```

`sample()` draws 10 times from those two words with replacement, so each cup comes out right or wrong with equal probability. `set.seed(1)` fixes the draws, so your numbers match mine.

The round came out at 6 correct out of 10. Nobody tasted anything, and the score still landed above half.

That one round already shows the problem. A guesser does not politely score 5 out of 10 and stop there. Guessing produces a whole spread of scores, and until you know how far that spread reaches, 9 correct cups is a number you cannot judge.

=== step === concept
## What 10,000 rounds of guessing produce

A single round told us that guessing can reach 6. To see the full range guessing produces, and how often it reaches the far end of that range, we need thousands of rounds.

`replicate()` runs the same block of code over and over and keeps the result of each run. The block here is one 10-cup round, and the result it keeps is that round's score.

```r
# Play 10,000 guessing rounds and count how often each score came up
set.seed(1)
luck <- replicate(10000, {
  guesses <- sample(c("right", "wrong"), 10, replace = TRUE)
  sum(guesses == "right")
})

table(luck)
#> luck
#>    0    1    2    3    4    5    6    7    8    9   10
#>   15  101  445 1155 1995 2543 2015 1185  447   89   10

barplot(table(luck), col = "grey85", border = "white",
        main = "10,000 rounds of guessing, scored out of 10",
        xlab = "Cups named correctly", ylab = "Rounds")
```

Read the counts along the bottom row of the table. The most common score is 5, which came up 2,543 times out of 10,000. Scores of 4 and 6 are nearly as common. From there the counts drop away fast in both directions: 447 rounds scored 8, 89 rounds scored 9, and 10 rounds got every cup right.

The bars draw those same counts. A tall pile sits in the middle around 5 and thins out towards both ends, until the bars at 0 and at 10 are barely off the floor.

Priya's 9 belongs out on the thin right-hand end. So let's count exactly how much of the pile is out there with her.

```r
# Count the guessing rounds that matched or beat her 9 correct cups
sum(luck >= 9)
#> [1] 99

mean(luck >= 9)
#> [1] 0.0099
```

`luck >= 9` marks every round that scored 9 or 10. Summing those marks counts the rounds, and taking their mean writes that same count as a share of all 10,000.

So that is 99 rounds out of 10,000, a share of 0.0099. Pure guessing reaches 9 or more about once in every 100 rounds of 10 cups.

[KEY INSIGHT]
A guesser can score 9 out of 10. It happened 99 times in these 10,000 rounds, so it is rare rather than impossible. How rare is exactly the thing we needed, because without that count, 9 correct cups has nothing to be judged against.

=== step === widget
## Run the guessing rounds yourself

Those 10,000 rounds went past in one keystroke. Here is the same round again, this time played at whatever pace you like, so you can watch the count build up.

Each run below plays one round of 10 cups with no tasting ability in it, scores the round, and drops that score onto the bars. The orange bars are the scores that match or beat Priya's 9.

::widget luck-simulator {"trials": 10, "p": 0.5, "observed": 9, "unit": "correct cups", "seed": 42}

Start with the first button and play a few single rounds. Watch where the scores land: mostly in the middle, now and then further out, and hardly ever on an orange bar.

Then use the second button, and after that the third one a few times over. Two things settle down as the rounds pile up. The bars take the shape you saw in the barplot, with a peak at 5 and thin tails. And the readout for 9 or more settles near 1%, which is the 0.0099 we counted.

The share is the number that matters here, not the raw count. Keep pressing and the count of rounds at 9 or more only climbs, while the share settles.

=== step === quiz
## Quick check: what the 10,000 guessing rounds stand for

The whole argument is measured against those 10,000 scores. So what are they?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- They model the way Priya tastes, so the peak at 5 is the score she is most likely to get. ::no
- They are the no-ability explanation carried out in full: the scores you get when nobody can taste the difference. ::ok Yes. Every one of those rounds was played with a right-half-the-time draw and no tasting in it anywhere, which is why a count taken from them says how ordinary 9 correct cups would be under guessing.
- They reshuffle her original 10 cups, so the scores come out of the data she actually produced. ::no
- The peak at 5 shows she was guessing, because her own score should have landed there too. ::no None of Priya's cups went into those 10,000 rounds. They were generated from a 50-50 draw and they describe a guesser, not her: they are what you hold her 9 against, not a rerun of her round and not a measure of her ability.

=== step === concept
## What the 1 in 100 is the probability of
::prose-only the point is a distinction between two readings of one count, and the picture that carries it is the barplot of the 10,000 guessing scores

The 99 was a count of guessing rounds. Every round in it was generated under the assumption that Priya has no tasting ability, so 0.0099 is a statement about that world and no other. If she cannot taste the difference, a score of 9 or better turns up about once in every 100 rounds.

Now read the same number backwards and watch it go wrong. "There is a 1% chance she was guessing." That sentence puts the probability on the explanation, and we never computed anything of the kind.

The two questions run in opposite directions, and only one of them has an answer here:

- How often does guessing produce 9 correct cups or better? That is 0.0099, and it is what we counted.
- Given 9 correct cups, how likely is it that she was guessing? That was never computed, and this count on its own cannot answer it.

The other half of the same caution is that nothing here proves she can taste the difference. What we can say is that the no-ability explanation accounts for these 10 cups poorly. Rare things do happen, and 99 rounds in 10,000 is precisely how rare this one is.

[WARNING]
A small share never says the null hypothesis is false, and it never says how good Priya is. It says one thing only: results like hers are uncommon in a world where she has no ability.

=== step === widget
## The same claim with only 3 cups

Change one thing about the test and that same apparent success stops being worth much.

Suppose we had poured 3 cups instead of 10, and she had named all 3 correctly. That is a perfect score, and on the face of it better than 9 out of 10.

Below, the guessing round is played with 3 cups. Everything else is the same: no tasting ability, each cup right half the time.

::widget luck-simulator {"trials": 3, "p": 0.5, "observed": 3, "unit": "correct cups", "seed": 11}

Run 1,000 rounds and look at the readout. Guessing reaches all 3 in roughly 12.5% of them, which is about 1 round in every 8. That is not an accident of the simulation: 3 cups, each right half the time, gives 0.5 times 0.5 times 0.5, which is 0.125 exactly.

Hold that against the 0.0099 we counted for 9 or more out of 10 cups. A perfect 3 is an everyday result for a guesser. A 9 out of 10 is not.

So the better-looking score, 100% here against 90% there, is the weaker evidence of the two. What decides the strength is how many cups produced the result.

=== step === concept
## How t-tests and ANOVA use the same three steps

Nothing we did was specific to Coke and Pepsi. Take the drinks out and what remains is a procedure with three moves:

1. Write down the chance-only explanation in enough detail to generate data from it. Here, that means no tasting ability and each cup right half the time.
2. Work out the results that explanation produces. Here, that is 10,000 rounds with the scores piled up around 5.
3. Put the observed result against them and count how often chance alone matches or beats it. Here, that is 99 rounds out of 10,000, a share of 0.0099.

We did the middle move by simulation, because simulating it makes the answer visible. For a setup this simple you do not have to. A run of 10 cups, each right with probability 0.5 under the null hypothesis, is a standard enough situation that R can work the share out exactly.

```r
# Work out the same share exactly, by counting instead of simulating
binom.test(9, 10, 0.5, alternative = "greater")
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

Read the first three arguments as "9 correct cups out of 10, against a guessing rate of 0.5 per cup". The `alternative = "greater"` part says we are counting scores of 9 and up, which is what `sum(luck >= 9)` did by hand.

The line to look at is `p-value = 0.01074`. Our 10,000 rounds gave 0.0099, and the two agree to two decimal places. They are answering the identical question: how often does guessing alone reach 9 or more? The simulation sampled 10,000 rounds to find out, while `binom.test()` accounts for every possible way 10 cups can come out, so its share is exact.

That share has a standard name. It is the p-value.

And here is where the three moves pay off. A t-test asks the same question with a different chance-only explanation: if these two groups have the same mean, how often does a difference this big turn up? ANOVA asks it for several groups at once, and a chi-square test asks it for counts in a table. The chance-only explanation changes with the question. The three moves never do.

=== step === quiz
## Quick check: 3 cups, 3 correct

Suppose the whole thing had been run with 3 cups instead of 10, and Priya had named all 3 correctly. Which reading of that result is right?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- A perfect 3 out of 3 is a better score than 9 out of 10, so it is stronger evidence. ::no
- There is a 12.5% chance she was guessing, which leaves an 87.5% chance she can taste the difference. ::no
- Guessing produces a perfect 3 about once in every 8 rounds, so a result like that is ordinary and settles nothing. ::ok Exactly. A share of 0.125 against the 0.0099 for 9 of 10 cups: the same apparent success, far weaker evidence, because only 3 cups produced it.
- Getting 3 correct cups in a row cannot happen by chance, so this proves she can taste the difference. ::no Two things to keep straight. The count only ever runs one way, saying how often guessing produces a result like this, never how likely it is that she was guessing. And a perfect score on a handful of cups is easy for a guesser to hit, which makes 3 of 3 weaker evidence than 9 of 10, not stronger.

=== step === tryit
## Your turn: 20 cups and 18 correct

Priya is unimpressed by the 3-cup version and wants a longer test. We pour 20 cups this time, in the same way as before, and she names 18 of them correctly.

The `luck` scores cannot answer this one. They are scores out of 10, and the question is now about scores out of 20. So build the guessing rounds again at the new size and count against those instead.

```r
# Priya names 18 of 20 cups correctly in a fresh round.
# Build 10,000 guessing rounds of 20 cups with set.seed(7)
# and store the scores in luck20.
# Then count the rounds that reached 18 or more, and write
# that count as a share of all 10,000.
# Press Check when you have it.
```
::check {"regex": "luck20\\s*>=\\s*18", "gate": true, "difficulty": "intermediate", "ok": "That is it: 2 rounds out of 10,000, a share of 0.0002, which R prints as 2e-04. Guessing almost never reaches 18 of 20, so a score like that is far harder to put down to luck than 9 of 10.", "no": "Build the round again with 20 draws instead of 10, keep the same scoring line inside `replicate(10000, ...)`, and store the result as `luck20`. Then `sum(luck20 >= 18)`, and the same line with `mean()` in place of `sum()`."}
::solution
```r
# Build 10,000 guessing rounds of 20 cups and count the ones reaching 18
set.seed(7)
luck20 <- replicate(10000, {
  guesses <- sample(c("right", "wrong"), 20, replace = TRUE)
  sum(guesses == "right")
})

sum(luck20 >= 18)
#> [1] 2

mean(luck20 >= 18)
#> [1] 2e-04
```

That is just 2 rounds in 10,000. R prints that share as `2e-04`, which is its shorthand for 0.0002.

Notice that 18 of 20 and 9 of 10 are the same accuracy, 90% either way. Guessing reached the first one twice in 10,000 rounds and the second one 99 times. The accuracy is identical, and the extra 10 cups are what make 18 of 20 the far stronger evidence.

=== step === concept
## References

- [The Design of Experiments](https://archive.org/details/in.ernet.dli.2015.502684) - Fisher, R. A. (1935), chapter 2. The tea-tasting experiment this reasoning comes from, worked out cup by cup.
- [The Lady Tasting Tea](https://openlibrary.org/works/OL4274440W) - Salsburg, D. (2001). How that one afternoon experiment shaped the way statistics is done now.
- [The Introductory Statistics Course: A Ptolemaic Curriculum?](https://doi.org/10.5070/T511000028) - Cobb, G. W. (2007), Technology Innovations in Statistics Education 1(1). The case for teaching inference by simulation before formulas.
- [Exact binomial test](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/binom.test.html) - R Core Team, the documentation for `binom.test()`.

=== step === complete
## Quick recap

You started with a claim and 10 cups of soft drink, and finished with a number that says how often guessing alone would match her score. Every part of it was counted rather than looked up.

- The measurement was 9 correct cups out of 10. That is a fact about those 10 cups, not a measure of her ability.
- The null hypothesis is the explanation you doubt: no tasting ability, each cup right half the time. Of the two explanations, it is the only one specific enough to simulate.
- 10,000 guessing rounds gave the full spread of scores, centred on 5. 99 of them reached 9 or more, a share of 0.0099.
- `binom.test()` worked the same share out exactly, at 0.01074, without simulating anything.
- How much data produced the result decides how strong the evidence is. Guessing gets a perfect 3 out of 3 once in 8 rounds, and 18 out of 20 twice in 10,000.

The three moves are yours now, ready for the next claim somebody brings you. Assume the chance-only explanation. Work out the results it produces. Count how often those results match or beat the one in front of you.

The p-value you counted, 0.0099, gets misread constantly, and taking it apart properly is a topic for another day. Well done for getting through this one.
