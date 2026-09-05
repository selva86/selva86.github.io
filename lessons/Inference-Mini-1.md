---
title: "How statistical inference works, no formulas yet"
slug: "Inference-Mini-1"
description: "Anita named 9 of 10 cups right by taste. Simulate the world where she only guesses, count how often luck reaches 9, and see how statistical inference works."
keywords: "how statistical inference works, statistical inference, null hypothesis, simulation in R, inference without formulas, statistical significance, taste test experiment"
mathjax: false
webr: true
date: "2026-09-06"
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
catalog_blurb: "How to tell a real result from a lucky run, no formulas needed."
---

=== step === cover
## How statistical inference works, no formulas yet

Let's work out how statistical inference actually works, using one taste test and not a single formula.

Here is the setup. Anita is sure that Coke and Pepsi taste nothing alike, and that she can name which is which blind. So ten cups go out in front of her, one drink in each, the pour decided by a coin flip. Six come out Coke and four come out Pepsi. She tastes each cup in turn and names the drink in it, and her score is 9 out of 10.

So what do you make of that?

Two explanations fit that score equally well. Either Anita really can taste the difference, or she cannot and this was a lucky run. The number 9 on its own does not tell you which one you are looking at.

Separating those two is the job. We cannot inspect Anita's palate, so we go after the other explanation instead: build the world where she is only guessing, see what that world produces, and check whether her result sits comfortably inside it.

That takes three steps.

::widget process-flow {"steps":[{"title":"Assume she is only guessing","sub":"every call is a 50/50 coin flip, no tasting involved"},{"title":"Simulate that world 10,000 times","sub":"count the correct calls in each round of ten"},{"title":"Compare her 9 against those rounds","sub":"how often does guessing alone reach 9 or more"}]}

Those three steps are the whole method. Everything from here is carrying them out on Anita's ten cups.

=== step === concept
## Nine correct calls out of ten, and two ways to explain them

Before we can reason about the result, we need it as data we can compute on. So let's lay the test out exactly as it happened: what went into each cup, and what Anita said was in it.

The `poured` column is the truth, fixed by the coin flips before she tasted anything. The `said` column is her call.

```r
# Build the ten poured cups beside Anita's calls and count the matches
cups <- data.frame(
  poured = c("Coke", "Pepsi", "Coke", "Coke", "Pepsi",
             "Coke", "Pepsi", "Coke", "Pepsi", "Coke"),
  said   = c("Coke", "Pepsi", "Coke", "Coke", "Pepsi",
             "Coke", "Coke",  "Coke", "Pepsi", "Coke")
)

cups$correct <- cups$poured == cups$said
cups
#>    poured  said correct
#> 1    Coke  Coke    TRUE
#> 2   Pepsi Pepsi    TRUE
#> 3    Coke  Coke    TRUE
#> 4    Coke  Coke    TRUE
#> 5   Pepsi Pepsi    TRUE
#> 6    Coke  Coke    TRUE
#> 7   Pepsi  Coke   FALSE
#> 8    Coke  Coke    TRUE
#> 9   Pepsi Pepsi    TRUE
#> 10   Coke  Coke    TRUE

sum(cups$correct)
#> [1] 9
```

`cups$poured == cups$said` compares the two columns cup by cup and returns TRUE wherever they agree. Summing a column of TRUE and FALSE counts the TRUEs, so `sum()` gives her score directly.

Only cup 7 went wrong. It was poured Pepsi and she called it Coke. Everything else she got right, which puts her at 9 out of 10, or 90%.

And here is where people jump straight to the wrong conclusion. That 90% settles nothing on its own, because both explanations produce numbers like it. Someone who really can tell the two drinks apart would score high, and 9 is high. But someone with no ability at all, naming every cup at random, also lands on 9 now and then. Not often. Sometimes.

So the useful question is not whether 9 is a lot. It is how often guessing alone gets to 9.

=== step === concept
## What it means to say she was only guessing

We have no way to test the first explanation. There is no measurement of whether Anita can taste the difference; that is the very thing in dispute. But the second explanation is a precise claim, and precise claims can be simulated.

Here is what it says. Anita cannot taste any difference at all. Every cup tastes identical to her, and she is naming a drink for each one at random. Each call is then a coin flip: right half the time, wrong half the time, with no connection to what was actually poured.

That assumption, the one saying there is no real effect here, is called the **null hypothesis**. It is written H0 and said out loud as "H nought". Notice which side we put it on. We assume the dull explanation is true, and then we go looking for evidence against it.

A coin flip is something R can do for us. `sample()` draws ten calls at random from the two drink names, and `replace = TRUE` puts each name back in the bag after it is drawn, so every call is independent of the ones before it.

```r
# Simulate one round in which the taster only guesses, and count her correct calls
set.seed(18)
one_round <- sample(c("Coke", "Pepsi"), 10, replace = TRUE)
one_round
#>  [1] "Pepsi" "Pepsi" "Coke"  "Pepsi" "Pepsi" "Pepsi" "Pepsi" "Coke"  "Pepsi"
#> [10] "Coke"

sum(one_round == cups$poured)
#> [1] 7
```

`set.seed(18)` fixes the random draws, so your ten calls match mine.

Now look at what pure guessing just did. It got 7 of the 10 cups right, with no tasting involved anywhere. This guesser has no ability whatsoever and still came away with 70%.

One round settles nothing, of course. But it already tells us something useful: guessing does not sit near zero. It scores high. What we need to know is how high it scores, and how often.

=== step === widget
## What pure guessing produces over 10,000 rounds

One round of guessing gave 7. Another would give something else. To see the full range that guessing produces, we have to run it over and over.

Start by running it yourself. Each press below plays out rounds of ten guessed calls, drops every round's score onto the histogram, and keeps a running count of how often guessing reached Anita's 9 or better.

::widget luck-simulator {"trials":10,"p":0.5,"observed":9,"unit":"correct calls","seed":42}

Press Run 1 game a few times and watch where the scores land. Then press Run 1,000. The pile builds up in the middle, around 5, and the two orange bars on the right, the rounds that reached 9 or 10, stay almost flat. Keep pressing and the percentage in the readout settles at about 1%.

Now let's build the same thing in R, so we have numbers to work with rather than a shape to look at. `replicate()` runs the same round over and over and stores the score from each one.

```r
# Run 10,000 rounds of pure guessing and plot the correct calls each round produced
set.seed(1)
luck_correct <- replicate(10000, {
  guesses <- sample(c("Coke", "Pepsi"), 10, replace = TRUE)
  sum(guesses == cups$poured)
})

hist(luck_correct, breaks = -0.5:10.5, col = "grey85", border = "white",
     main = "10,000 rounds of pure guessing",
     xlab = "Correct calls out of 10")
abline(v = 9, col = "red", lwd = 3)

table(luck_correct)
#> luck_correct
#>    0    1    2    3    4    5    6    7    8    9   10
#>    4   71  438 1190 1996 2490 2042 1225  441   97    6
```

`luck_correct` now holds 10,000 numbers, one per round, each of them somewhere between 0 and 10. The `breaks = -0.5:10.5` puts one bar over each whole number from 0 to 10, so the height of a bar is the number of rounds that scored exactly that many.

This pile is what every later number gets measured against, so it is worth reading slowly. The tall bars sit at 4, 5 and 6: a guesser usually gets about half the cups right, which is exactly what a coin should do. Out at the right, where the red line marks Anita's 9, the bars are barely off the axis. 97 rounds scored 9, and 6 rounds scored all 10.

That 6 at the end is worth a second look. Pure guessing does reach a perfect 10 out of 10. It just takes about 1,700 rounds to do it.

[KEY INSIGHT]
The pile is what "she was only guessing" looks like once you actually build it. It is not a formula and not an opinion about Anita. It is 10,000 rounds of coin flips, counted.

=== step === concept
## How often does guessing reach 9 or more?

The guessing-only world is sitting in `luck_correct`, and Anita's result is 9. Comparing the two is now a counting job: how many of those 10,000 rounds matched or beat her 9?

```r
# Count the guessing rounds that matched or beat Anita's 9 correct calls
sum(luck_correct >= 9)
#> [1] 103
mean(luck_correct >= 9)
#> [1] 0.0103
```

`luck_correct >= 9` returns a TRUE or FALSE for each of the 10,000 rounds. `sum()` counts the TRUEs. `mean()` on the same TRUEs and FALSEs is that count divided by 10,000, which turns it into a share.

103 rounds out of 10,000. As a share, 0.0103, or roughly 1 in 100.

That is the number we came for. If Anita cannot taste any difference at all, a result as good as hers still turns up in about 1 taste test out of every 100.

Look at what it took to get there. We counted the rounds that did as well as she did or better, and divided by how many rounds we ran. A count and a division, and that is the entire calculation.

=== step === concept
## What the 1 in 100 does not say

::prose-only the point is one conditional statement read in the wrong direction; the histogram of the 10,000 guessing rounds already carries the picture

0.0103 is a small number, and small numbers get turned into big claims. So let's be exact about what it measures and what it does not.

It answers this question: if Anita were guessing, how often would she reach 9 or more? About once in every 100 taste tests.

It does not answer this one: given that she reached 9, how likely is it that she was guessing? That is a different question with a different answer, and 0.0103 is not it.

The two are easy to mix up, because they use the same words in a different order. So try the same reversal somewhere the answer is obvious. Nearly every professional basketball player is over 6 feet tall. Now read it backwards: nearly every person over 6 feet tall is a professional basketball player. Same two facts, opposite direction, and the second version is nonsense.

| What 0.0103 answers | What it does not answer |
|---|---|
| If she was guessing, how often does a guesser reach 9 or more? | Given that she reached 9, how likely is it that she was guessing? |
| Counted here: 103 rounds out of 10,000. | Not counted anywhere here, and not equal to 0.0103. |

There is a second thing 0.0103 is not, and that is proof. 103 of the simulated guessers did reach 9 or more, and not one of them could taste anything. Had Anita been one of those 103, her score would look exactly the way it looks now.

So what does the number actually give you? Evidence against the guessing explanation, and a measured amount of it. A result that guessing produces once in every 100 tries is an awkward fit for the guessing story. That is a long way from a verdict on Anita's palate, and keeping those two apart is most of what it takes to read a test correctly.

=== step === quiz
## Quick check: what the 10,000 rounds do and do not say

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- They are 10,000 replays of Anita's own taste test, so the pile shows how well she performs. ::no
- They are 10,000 rounds of pure guessing, and 9 or more correct calls turned up in 103 of them, about 1 in 100. ::ok Yes. Not one of those rounds involved tasting anything, and 103 of them still reached 9 or better. That count, divided by 10,000, is the 0.0103.
- They show there is a 1.03% chance that Anita was guessing. ::no
- They prove that a guesser cannot reach 9 correct calls, so Anita must be able to taste the difference. ::no Every one of those 10,000 rounds is a guesser, never Anita: they are built by assuming she cannot taste anything, so they say what guessing produces, not what she does. They also prove nothing of the sort, since 103 of them reached 9 or better, 6 of those scoring all 10. And the 0.0103 only runs in one direction. It is how often guessing reaches her result, never the chance that she was guessing.

=== step === widget
## The same 70 percent, with ten times the cups

One more thing decides how much a result is worth, and it is not the percentage. It is how many cups you poured.

Suppose Anita had named 7 of the 10 correctly instead of 9. That is 70%. Now suppose a second taster, Ravi, sat down to 100 cups and named 70 of them correctly. Also 70%. On paper the two scores are identical.

Here is the guessing-only world for Ravi's 100 cups. Every round is 100 guessed calls now, and the orange bars, the ones that would match him, start at 70.

::widget luck-simulator {"trials":100,"p":0.5,"observed":70,"unit":"correct calls","seed":7}

Press Run 1,000 a couple of times. The pile gathers around 50, as a coin should, and the readout for 70 or more sits at 0.0%. Press it as often as you like and it stays there. At 100 cups, guessing its way to 70 is rare enough that a thousand rounds at a time will almost certainly never turn one up.

Which means a thousand rounds cannot measure it. We need far more of them, so let's run 200,000 at once. `rbinom(200000, 100, 0.5)` does that in one line: 200,000 rounds, 100 calls each, every call right with probability 0.5. It returns the number correct in each round, which saves us building the calls one at a time.

```r
# Count how often 100 guessed calls reach 70 or more correct
set.seed(3)
luck_100 <- rbinom(200000, 100, 0.5)

sum(luck_100 >= 70)
#> [1] 7
mean(luck_100 >= 70)
#> [1] 3.5e-05
```

7 rounds out of 200,000. R prints that share as `3.5e-05`, its shorthand for 0.000035, or about 1 in 29,000.

Now hold the two 70% scores side by side. Over 10 cups, 7 or more correct is something guessing does constantly: of the 10,000 guessing rounds, 1,225 scored exactly 7 and another 544 scored above that, which is roughly 1 round in 6. Over 100 cups, 70 or more correct is something guessing manages about once in 29,000 rounds.

Same percentage, and nothing alike in what they are worth. The percentage tells you how well the taster did. The number of cups tells you how hard that was to do by luck.

=== step === concept
## The same three steps behind t-tests and ANOVA

Everything so far was built by hand, and that was deliberate: you can point at exactly where 0.0103 came from. In practice nobody simulates 10,000 rounds to judge a taste test. There is a function for it.

`binom.test()` takes the same three facts we have been using: 9 correct, out of 10 cups, against a guessing rate of 0.5. The argument `alternative = "greater"` says we only care about scores at or above hers, which is the direction we counted.

```r
# Run the standard test for this result and read the p-value it reports
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

The line to read is `p-value = 0.01074`. Our 10,000 rounds gave 0.0103. They agree to two decimal places, and the small gap between them is only there because we counted 10,000 rounds instead of working the answer out exactly.

So the share you counted has a standard name. It is the **p-value**: assume the null hypothesis is true, then ask how often a result at least as good as yours turns up. Ours turned up 103 times in 10,000.

Which is why it was worth building by hand once. A t-test compares two group means. An ANOVA compares several. A chi-square test compares counts in a table. Underneath, each one assumes there is no effect, works out what that assumption produces, and reports where your result falls inside it. The three steps never change. Only the arithmetic in the middle does, and where we counted rounds, they use a formula that goes straight to the answer.

=== step === quiz
## Quick check: does 70 percent always mean the same thing?

Two tasters, both scoring 70%. Anita named 7 of 10 cups correctly. Ravi named 70 of 100. Which reading of those two results is right?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- They are equally convincing. Both tasters scored 70%, and the percentage is what matters. ::no
- Ravi is far more convincing. Guessing reaches 7 of 10 about 1 round in 6, but it reaches 70 of 100 about once in 29,000, so the number of cups decides the weight. ::ok Right. The score tells you how the taster did. The number of cups tells you how easily luck could have done the same. Ten cups leave plenty of room for a lucky 70%. A hundred cups leave almost none.
- Anita is more convincing, because getting 7 right out of only 10 leaves much less room for error. ::no
- Neither is convincing, because 70% is below the 95% a result has to clear before you can call it real. ::no Both tasters scored the same percentage, so the percentage cannot be the thing that separates them. Simulate the guessing-only world at each size and the difference is enormous: 7 or more correct out of 10 turns up in roughly 1 guessing round in 6, while 70 or more out of 100 turns up about once in 29,000. More cups means luck has far less room to fake the result. As for 95%, that is a threshold borrowed from somewhere else entirely, and it has no bearing on either score.

=== step === tryit
## Your turn: how often does guessing reach 7 or more?

Suppose Anita had named 7 of the 10 cups correctly instead of 9. `luck_correct` still holds the correct-call counts from all 10,000 rounds of guessing, so you can weigh that weaker result exactly the way we weighed her 9.

Count the rounds that reached 7 or more correct calls, then write that same count as a share of the 10,000.

```r
# luck_correct holds the correct-call counts from 10,000 rounds of pure guessing.
# Count the rounds that reached 7 or more correct calls,
# then write that same count as a share of all 10,000.
# Two lines. Press Check when you have them.
```
::check {"regex": "luck_correct\\s*>=\\s*7", "gate": true, "difficulty": "beginner", "ok": "That is 1,769 rounds out of 10,000, a share of 0.1769, or about 1 round in 6. Guessing produces a 7 out of 10 all the time, so on its own that score would tell you almost nothing about Anita.", "no": "Reuse the counting line and move the bar: `sum(luck_correct >= 7)`, then the same line with `mean()` in place of `sum()`."}
::solution
```r
# Count the guessing rounds that reached 7 or more correct calls
sum(luck_correct >= 7)
#> [1] 1769
mean(luck_correct >= 7)
#> [1] 0.1769
```

Two cups is all that separates those two results, and it changes everything. 9 correct out of 10 came in at 0.0103. 7 correct out of the same 10 cups comes in at 0.1769, which is 17 times more often.

=== step === concept
## References

- [The Design of Experiments](https://archive.org/details/in.ernet.dli.2015.502684) - Fisher (1935), chapter 2. The original tasting experiment, settled by counting the possible arrangements by hand rather than simulating them.
- [The Lady Tasting Tea](https://archive.org/details/TheladytastingteaSalsburg2001) - Salsburg (2001), Henry Holt. The story of that experiment and of the reasoning it set off.
- [The Introductory Statistics Course: A Ptolemaic Curriculum?](https://doi.org/10.5070/T511000028) - Cobb (2007), Technology Innovations in Statistics Education 1(1). The case for teaching simulation before formulas, which is the order used here.
- [Introduction to Statistical Investigations](http://www.isi-stats.com/isi/) - Tintle and colleagues (2016), Wiley. A full introductory course built on simulated null distributions.
- [Exact binomial test](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/binom.test.html) - R Core Team, the documentation for `binom.test()`.

=== step === complete
## Quick recap

You took a claim that cannot be checked directly and measured it anyway, without a formula appearing once. To pull it together:

- Anita named 9 of 10 cups correctly. Real ability and a lucky run both explain a score like that, so the 9 by itself decides nothing.
- The null hypothesis is the dull explanation stated precisely: she cannot taste any difference, so every call is a coin flip. That is the one you can simulate.
- 10,000 rounds of those coin flips gave the whole range guessing produces. Most rounds landed at 4, 5 or 6 correct.
- 103 of the 10,000 reached 9 or more, a share of 0.0103. That is how often guessing does as well as Anita did.
- 0.0103 is evidence against the guessing explanation. It is not the chance that she was guessing, and it is not proof that she can taste anything, since 103 guessers reached her score.
- The number of cups decides what a percentage is worth. 70% over 10 cups is ordinary under guessing. 70% over 100 cups is very nearly impossible.

So the next time someone puts a result in front of you and asks whether it is real, you have a way to answer that needs no formula at all. Build the world where nothing is going on, run it, and count how often it does what you saw.

That counted share has a name, the p-value, and it comes with a set of traps that catch experienced people every day. Those traps are the next thing worth seeing.
