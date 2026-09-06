---
title: "How statistical inference works, no formulas yet"
slug: "Inference-Mini-1"
description: "Learn how statistical inference works from scratch: simulate a pure-luck crowd in R, no formulas, and see exactly how surprising a real result would be."
keywords: "statistical inference, hypothesis testing basics, p-value intuition, null hypothesis explained, simulation in R, statistics for beginners"
mathjax: false
webr: true
date: "2026-09-07"
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
catalog_blurb: "How to tell whether a surprising result is real skill or just luck."
---

=== step === cover
## How statistical inference works, no formulas yet

Today you are going to learn how to tell whether a surprising result is real, or nothing more than luck, and you will do the whole thing without touching a single formula.

Here is the situation. Priya swears her palate never misses: hand her any cola without the label and she will name the brand. You test her properly: 10 cups, each filled in secret with one drink or the other, poured in an order she cannot see. She tastes every cup and calls it. She gets 9 of the 10 right.

9 out of 10 is a lot of correct guesses. But before you believe Priya has a real skill, you have to ask an honest question: could someone with no ability to tell the drinks apart at all land on 9 correct just by luck?

Answering that question, for Priya's tasting test or for any experiment you will ever run, always comes down to the same four steps.

::widget process-flow {"steps":[{"title":"State the real result","sub":"Priya named 9 of the 10 cups correctly"},{"title":"Imagine pure chance","sub":"picture a guesser with no ability at all, right half the time by luck"},{"title":"Simulate pure chance many times","sub":"build a large crowd of such guessers and see where their scores land"},{"title":"Compare and judge","sub":"check how rare a score of 9 would be inside that crowd"}]}

That is the whole shape of it. Everything from here builds one piece of that picture, using Priya's test as the running example throughout.

=== step === concept
## Skill or luck: simulating one pure-chance guesser

Before you can judge Priya's result, you need to be precise about what you are comparing it against.

There are exactly two explanations for 9 correct guesses out of 10. Either Priya can genuinely tell Coke from Pepsi apart, or she has no ability at all and got lucky.

To check which one holds up, you need to know what "no ability at all" would actually look like in this test. If Priya truly cannot tell the two drinks apart, then on each cup she is really just flipping a coin in her head: right half the time, wrong half the time, and one cup's result has no bearing on the next.

Let's build exactly that: one taster with zero ability, guessing at 10 cups. Press Run.

```r
# Simulate one pure-luck guesser tasting 10 cups
set.seed(1)
truth <- sample(c("Coke", "Pepsi"), size = 10, replace = TRUE)
guess <- sample(c("Coke", "Pepsi"), size = 10, replace = TRUE)
sum(guess == truth)
#> [1] 4
```

`truth` is which drink actually filled each of the 10 cups, decided at random. `guess` is what our zero-ability taster calls each cup, also decided at random and completely unconnected to `truth`. `sum(guess == truth)` counts how many of the 10 guesses happened to match.

This particular run of pure luck landed on 4 correct out of 10. Run the code again with a different seed and you would get a different number: maybe 6, maybe 2, maybe even 9. A guesser with zero ability does not always score 5. Chance alone spreads results out.

=== step === concept
## Building a crowd of ten thousand pure-luck guessers

One pure-luck guesser only tells you one possible outcome. To see the full shape of what pure luck can do, you need thousands of them.

`rbinom()` does in one line what running the code above 10,000 times would do the slow way. Read `rbinom(10000, size = 10, prob = 0.5)` as: create 10,000 guessers, each one tossing 10 fair coins, and report how many of the 10 landed correct for each guesser.

Press Run.

```r
# Build a crowd of 10,000 pure-luck guessers, each tasting 10 cups
set.seed(1)
pure_luck_crowd <- rbinom(10000, size = 10, prob = 0.5)
mean(pure_luck_crowd)
#> [1] 5.003
min(pure_luck_crowd)
#> [1] 0
max(pure_luck_crowd)
#> [1] 10
```

The average score across all 10,000 pure-luck guessers is 5.003, almost exactly 5 out of 10. That makes sense: with a fair coin flip on each cup, getting half right is the typical outcome.

But look at the spread. Somewhere in that crowd of 10,000, at least one guesser scored a 0 and missed every single cup, and at least one scored a perfect 10. Pure luck alone is enough to produce those extremes occasionally, just not often. Priya's score of 9 sits out near that rare end, nowhere close to the typical 5.

=== step === widget
## Where nine out of ten falls in the pure-luck crowd

The two code blocks above already built the crowd. Now let's watch pure luck pile up, one guesser at a time, and see exactly how often it reaches Priya's score.

::widget luck-simulator {"trials": 10, "p": 0.5, "observed": 9, "unit": "correct guesses"}

Press "Run 1,000" a few times. Every bar is a count of pure-luck guessers who landed on that particular score out of 10, and the orange bars mark 9 and 10, the scores that match or beat Priya. Watch how short those orange bars stay even as the rest of the crowd grows tall in the middle.

Now let's check that against `pure_luck_crowd`, the full crowd of 10,000 you already built.

```r
# Count how many of the 10,000 pure-luck guessers matched or beat Priya's score
sum(pure_luck_crowd >= 9)
#> [1] 101
length(pure_luck_crowd)
#> [1] 10000
sum(pure_luck_crowd >= 9) / length(pure_luck_crowd)
#> [1] 0.0101
```

101 out of 10,000 pure-luck guessers matched or beat Priya's 9. As a share, that is 0.0101, or about 1%.

Keep pressing the buttons on the widget above and your own count will bounce around a little each time, since it is a fresh batch of random guessers every run. But the more games you run, the closer it settles to that same 1% ballpark. That is not a coincidence. It is the same question, asked two different ways.

=== step === quiz
## Quick check: does a stricter threshold catch more guessers, or fewer?

Before moving on, check that you can predict this without running any more code.

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- It rises, because a higher score should pull in more of the crowd. ::no
- It falls, because fewer pure-luck guessers are lucky enough to reach a rarer, more extreme score. ::ok That is right. Raising the bar shrinks the slice of the crowd that clears it, the same thing you just watched happen between a score of 9 and the scores below it.
- It stays the same, because the size of the crowd never changes. ::no
- It falls all the way to zero, because pure luck can never reach 9 or higher. ::no A stricter threshold always shrinks the count of pure-luck guessers who clear it, or leaves it unchanged, since a higher bar is harder to reach, not easier. It never rises, and rare is not the same as impossible: 101 of the 10,000 guessers in your crowd reached 9 or higher by chance alone.

=== step === concept
## Naming the fraction: the p-value, and what it doesn't mean
::prose-only the number and its shape were already shown by the widget two steps back; this step names and interprets it

That 1% figure you just counted has a name statisticians use constantly: the p-value.

Here is the exact definition, built entirely from what you just did. A p-value is the fraction of pure-chance outcomes that match or beat the real result you saw. For Priya's test, the p-value is 0.0101, the same number you already computed.

A small p-value like this makes the pure-chance story look unlikely. It does not make it impossible. Remember, 101 of your 10,000 pure-luck guessers really did reach 9 or higher, purely by chance, with zero tasting ability. A p-value never rules the chance story out. It only tells you how rare that story's best outcomes are.

[KEY INSIGHT]
A p-value is not the probability that Priya has real skill. It is the probability that pure luck, with no skill at all, produces a result this good or better. Those are two different questions, and mixing them up is the single most common mistake made with this number.

=== step === widget
## The same shaded tail, for any test statistic

The bar chart in the last widget only works because you can count 10,000 individual guessers one by one. But most real tests do not use a simple count out of 10. They use all kinds of test statistics, like the gap between two conversion rates or the difference between two group averages. The good news is the exact same idea still works, just drawn as a smooth curve instead of separate bars.

::widget null-distribution {"tails": 1, "start": 2.3, "label": "how far the marked result sits from the middle of the pure-luck crowd"}

The curve is what your bar chart would look like if you smoothed it out: still centered where pure luck lands most often, still thin at the edges. The dot marks Priya's result, and the shaded sliver to its right is the same kind of count you did by hand, just expressed as a share of the whole curve instead of a share of 10,000 guessers.

Drag the dot further right, away from the center, and the shaded sliver shrinks: a more extreme result is rarer under pure chance. Drag it back toward the center and the sliver grows: a middling result is common under pure chance. That is exactly the relationship you already found with the threshold in the pure-luck crowd. This widget just shows it for any result, not only a count out of 10.

Underneath the curve, the label will read "reject H0" or "fail to reject H0" as you drag. H0 is short for the null hypothesis, which is just a formal name for the pure-chance story: the claim that nothing but luck produced the result. Many fields draw the line for "rare enough to doubt pure chance" at a shaded sliver of 5%, calling anything thinner than that "reject H0" and anything wider "fail to reject H0". For now, keep your eye on the sliver itself: the smaller it is, the more surprising the real result would be if only chance were at work.

=== step === concept
## The general recipe behind every statistical test
::prose-only the recipe restates the arc already built, step by step; no new computation

Step back for a second and look at everything you just did, because it fits a pattern you will meet again and again.

1. State the real result. Priya named 9 of the 10 cups correctly.
2. Define what pure chance alone would look like. A guesser with no ability at all is right half the time, and each cup's result is independent of the others.
3. Simulate that pure-chance world many times over. You built a crowd of 10,000 such guessers and saw where they landed.
4. Compare the real result to that crowd, and read off how far into the rare end it falls. Priya's 9 sat out near the 1% mark.

A t-test, an A/B test on a website, and Priya's tasting test are all running this exact same four-step recipe. What changes from test to test is only the kind of data and the kind of result you are measuring: a correct-guess count here, a difference in two averages there, a gap in conversion rates somewhere else. The four-step shape underneath never changes.

=== step === quiz
## Quick check: what does a p-value of 0.01 actually say?

Here is one more check before you try this yourself on a new result. Suppose Priya's test had come back with a p-value of 0.01 instead of 0.0101.

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- There is a 1% chance she has no real ability. ::no
- She is 99% likely to be a better taster than average. ::no
- If she had no real ability and were only guessing, a result at least this extreme would happen only about 1% of the time. ::ok Exactly right. A p-value of 0.01 only ever describes the pure-chance world: how often a result this extreme or better would show up if nothing but luck were at work. It says nothing about how likely Priya is to have real skill.
- The test proves she can really tell the drinks apart. ::no A p-value cannot prove anything, and it never puts a probability on Priya having real skill. It only describes how rare a result like hers would be under pure chance. Reading it as a 1% chance she lacks skill, or a 99% chance she is better than average, both flip the question around onto Priya, when the number only ever describes the pure-luck crowd.

=== step === tryit
## Your turn: test two new tasters

Two more tasters just finished the same test. The first correctly named 8 of the 10 cups. The second named 7. Are either of those results surprising, or could pure luck easily produce them?

`pure_luck_crowd` still holds your 10,000 pure-luck guessers from earlier. For each new taster, count how many of those 10,000 matched or beat that taster's score, then write that count as a share of 10,000, the same two-line approach you used for Priya's score of 9.

```r
# pure_luck_crowd still holds the 10,000 pure-luck guessers from earlier.
# A first taster scored 8 out of 10; a second scored 7 out of 10.
# For each score, write the share of pure-luck guessers who matched or
# beat it, out of the full 10,000.
# Two lines. Press Check when you have them.
```
::check {"regex": "pure_luck_crowd\\s*>=\\s*8[\\s\\S]*pure_luck_crowd\\s*>=\\s*7", "gate": true, "difficulty": "intermediate", "ok": "Right: 581 out of 10,000 for the 8-correct taster, about 5.8%, and 1,795 out of 10,000 for the 7-correct taster, about 18%. The first is still fairly rare. The second is common: pure luck lands on 7 or better roughly one time in six.", "no": "Reuse the counting lines from a few steps back with a new threshold: sum(pure_luck_crowd >= 8) / length(pure_luck_crowd), then the same line with 7 in place of 8."}
::solution
```r
# The full pure-luck crowd, checked against both new scores
sum(pure_luck_crowd >= 8) / length(pure_luck_crowd)
#> [1] 0.0581
sum(pure_luck_crowd >= 7) / length(pure_luck_crowd)
#> [1] 0.1795
```

8 out of 10 gives 0.0581, about 5.8%. Pure luck can reach that score, but not often. It still sits toward the rare end, though not as rare as Priya's 9.

7 out of 10 gives 0.1795, about 18%. That is common. Pure luck lands on 7 or better roughly one guesser in every six, so a score of 7 tells you almost nothing about whether the taster has real skill.

Notice the pattern. As the score you check against drops from 9 to 8 to 7, the pure-luck crowd catches up to it faster and faster, and the result stops looking surprising.

=== step === concept
## References

- [Statistical Inference: The Big Picture](https://doi.org/10.1214/10-STS337) - Kass, R. E. (2011), Statistical Science, 26(1).
- [OpenIntro Statistics](https://www.openintro.org/book/os/) - Diez, D., Barr, C., and Cetinkaya-Rundel, M., 4th edition, the chapter on simulation-based inference.
- [The Introductory Statistics Course: A Ptolemaic Curriculum?](https://escholarship.org/uc/item/6hb3k0nz) - Cobb, G. W. (2007), Technology Innovations in Statistics Education.
- [All of Statistics: A Concise Course in Statistical Inference](https://doi.org/10.1007/978-0-387-21736-9) - Wasserman, L. (2004), Springer.
- [Statistical hypothesis testing](https://en.wikipedia.org/wiki/Statistical_hypothesis_testing) - Wikipedia.

=== step === complete
## Wrapping up: the pure-luck test in one recipe

You started with one simple question: was Priya's 9 out of 10 real skill, or just a lucky guesser having a good day?

To answer it, you built the pure-chance story by hand: one guesser with no ability, then a crowd of 10,000 of them. You counted how many of that crowd matched or beat Priya's score, 101 out of 10,000, and gave that fraction its proper name, the p-value.

Then you saw the same shaded-tail idea generalize past counting correct guesses, to any result from any test at all: state the real result, build the pure-chance crowd, and see how far into the rare end the real result falls.

You also tried it yourself on two new tasters. A score of 8 stayed fairly rare. A score of 7 turned out to be common, nowhere near surprising enough to suggest real skill.

You did not use a formula anywhere. Every number came from a crowd you built and counted by hand, which is exactly how a p-value works underneath, no matter which test produces it.
