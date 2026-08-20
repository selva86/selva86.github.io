---
title: "How statistical inference works, no formulas yet"
slug: "Inference-Mini-1-v3"
description: "A friend calls nine of ten cups right by taste. Skill, or luck? Build the guessing game in R, count what luck does, and see what every test is really doing."
keywords: "how statistical inference works, statistical inference explained, inference without formulas, simulation based inference, null hypothesis intuition, luck versus skill, statistics for beginners, sample and replicate in R"
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
catalog_blurb: "How every statistical test decides whether a result could just be luck."
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

Press the buttons below. Every game is one round of ten pure-guess calls, played right now in front of you. The bars pile up over the score each round finished on, the orange ones are the scores that matched Priya or beat her, and the line underneath keeps the count.

::widget luck-simulator {"trials": 10, "p": 0.5, "observed": 9, "unit": "correct calls"}

That is the whole idea. Everything from here is us doing it properly, in R, on Priya's actual ten cups.

=== step === concept
## What exactly are we judging here?

Let's start by getting the actual record on the table, because everything we work out from here is built on it.

You walked out of that kitchen with two lists. One is your pour sheet, which says what went into each cup in the order you filled them. The other is what Priya called out, cup by cup, in that same order.

That is all the data there is. Ten pours and ten calls, and nothing else.

Let's put both of them into R and line them up.

Press Run.

```r
# Put the pour sheet beside Priya's calls and count how many she got right
poured <- c("Coke", "Pepsi", "Pepsi", "Coke", "Pepsi",
            "Coke", "Coke", "Pepsi", "Pepsi", "Coke")

priya <- c("Coke", "Pepsi", "Pepsi", "Coke", "Pepsi",
           "Coke", "Coke", "Pepsi", "Coke", "Coke")

taste_test <- data.frame(cup = 1:10,
                         poured = poured,
                         called = priya,
                         correct = priya == poured)
taste_test
#>    cup poured called correct
#> 1    1   Coke   Coke    TRUE
#> 2    2  Pepsi  Pepsi    TRUE
#> 3    3  Pepsi  Pepsi    TRUE
#> 4    4   Coke   Coke    TRUE
#> 5    5  Pepsi  Pepsi    TRUE
#> 6    6   Coke   Coke    TRUE
#> 7    7   Coke   Coke    TRUE
#> 8    8  Pepsi  Pepsi    TRUE
#> 9    9  Pepsi   Coke   FALSE
#> 10  10   Coke   Coke    TRUE

table(poured)
#> poured
#>  Coke Pepsi
#>     5     5

sum(priya == poured)
#> [1] 9
```

Read the last column of that table. Nine of the rows say TRUE and one says FALSE, and the one she lost was cup nine, where you had poured Pepsi and she called Coke.

The tally underneath tells you something you did not know while you were pouring. The coin happened to give you five of each.

Now look at that last line, because it is doing two jobs. `priya == poured` compares the two lists cup by cup and hands back ten TRUEs and FALSEs. `sum()` then counts the TRUEs, because R treats TRUE as 1 and FALSE as 0. So the score of 9 is not a number we typed in and asked you to accept. It came straight out of the record.

So the score is nine. That is the number the rest of the evening has to explain.

=== step === concept
## What would a pure guesser look like?

There are only two stories on the table that could have produced that nine.

The first is the one Priya is telling, which is that she can genuinely taste the difference.

The second is the boring one. She has no ability at all, and the evening simply went her way.

You cannot knock the boring story down by insisting that nine is a lot. You have to go and build that story, and see what it actually produces.

So let's send a caller with no ability whatsoever through your ten cups, somebody who tastes nothing at all and just tosses a coin for every cup.

```r
# Let somebody with no ability call all ten cups by coin toss, then score it
set.seed(1)
guess <- sample(c("Coke", "Pepsi"), 10, replace = TRUE)
guess
#>  [1] "Coke"  "Pepsi" "Coke"  "Coke"  "Pepsi" "Coke"  "Coke"  "Coke"  "Pepsi"
#> [10] "Pepsi"

sum(guess == poured)
#> [1] 7
```

`sample(c("Coke", "Pepsi"), 10, replace = TRUE)` draws ten times out of a two-item bag and puts the item back every time, which is a coin toss repeated ten times and nothing more. `set.seed(1)` fixes which tosses you get, so your run comes out the same as mine.

Then we score that guesser against your pour sheet exactly the way we scored Priya.

Now look at what came back. Somebody who tasted nothing at all, who could not tell a Coke from a cup of tea, called seven of your ten cups correctly on the very first attempt.

So luck is not a harmless little story we can wave away. It is a serious competitor, and now we have to find out just how good a competitor it is.

=== step === quiz
## Quick check: what is the guessing round standing in for?

We just let a coin call all ten cups and it scored seven. So what was the point of doing that?

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- It shows Priya was probably guessing too, since a coin got fairly close to her score. ::no
- It is a warm-up to check the code runs before we start the real work. ::no
- It is the boring story built for real: if she has no ability, this is what her evening looks like, so now we can see what luck can do. ::ok Exactly. We are not accusing Priya of anything. We built the rival explanation on purpose, because until you know what luck produces, you cannot say whether nine is out of the ordinary.
- It proves that seven correct calls is about as far as luck can stretch. ::no One coin-toss round is not evidence about Priya, and it is not a ceiling on what luck can do. It is the rival explanation made concrete: this is the evening somebody with no ability would have had. It scored seven, which already tells you luck is worth taking seriously, and how far luck can stretch is the very next thing to find out.

=== step === concept
## What does luck do across ten thousand rounds?

One round of coin tosses scored seven. Run it again and you would get something else, maybe four, maybe eight. So a single round on its own tells you almost nothing.

What we actually want is luck's whole range. Not what one guesser scored on one evening, but what guessers score in general. How often do they land on four, how often on five, and how often do they stretch all the way up to nine or ten?

To find that out we run the same round over and over. The function `replicate()` in the code below takes a piece of code, runs it however many times you ask, and keeps the answer from each run. The piece of code we hand it is the guessing round you just watched, with the tossing and the scoring folded into one line: `sample()` calls all ten cups, `== poured` marks each call right or wrong, and `sum()` turns that into the round's score. We do ten thousand rounds, which takes a couple of seconds and is plenty to see the shape.

```r
# Replay ten thousand rounds of pure guessing and chart where luck lands
set.seed(42)
luck_scores <- replicate(10000, sum(sample(c("Coke", "Pepsi"), 10, replace = TRUE) == poured))

score_counts <- table(luck_scores)
score_counts
#> luck_scores
#>    0    1    2    3    4    5    6    7    8    9   10
#>    5  103  450 1204 2006 2367 2135 1144  474  106    6

barplot(score_counts,
        col = ifelse(as.integer(names(score_counts)) >= 9, "#d97706", "#93b4d8"),
        border = "white",
        main = "10,000 rounds of pure guessing",
        xlab = "Correct calls out of ten",
        ylab = "Rounds")
```

Let's read that table as two rows that go together. The top row is the score, from 0 correct up to 10. The bottom row is how many of the ten thousand rounds finished on that score.

So this is what luck looks like. The pile sits over 5, which is what you would hope, because a coin should get about half of a two-way call right. From there it thins out quickly on both sides. 1,144 rounds reached seven, 474 reached eight, only 106 got to nine, and 6 of them called all ten.

So an evening like Priya's can be done on luck alone. It just does not happen often. The orange bars in the chart are the ones we came here for, which are the rounds where a pure guesser did as well as she did or better.

=== step === concept
## How often does luck reach nine?

That table almost answers our question already. We want every round that matched Priya or beat her, which means the nines and the tens counted together.

```r
# Count the pure-guess rounds that matched or beat Priya's nine
sum(luck_scores >= 9)
#> [1] 112

mean(luck_scores >= 9)
#> [1] 0.0112
```

`luck_scores >= 9` goes through all ten thousand scores and hands back TRUE wherever the round reached nine or better. `sum()` then counts those TRUEs, and `mean()` gives you the same thing written as a share, because the average of ten thousand ones and zeros is just the fraction that are ones.

So luck matched or beat Priya in 112 rounds out of 10,000. As a share, that is 0.0112, which is about 1 in 100.

That one count is what the whole evening comes down to. If Priya has no ability at all, an evening as good as hers turns up about once in every hundred attempts.

[KEY INSIGHT]
Statistical inference is that count. You write down the result you actually got, build the world where it was pure luck, replay that world thousands of times, and count how often luck did as well as you did. Here it did as well 112 times out of 10,000.

=== step === tryit
## Your turn: how often does luck reach seven?

`luck_scores` still holds the score from all ten thousand pure-guess rounds, so you can move the bar and count again.

Suppose Priya had called seven right instead of nine. Would an evening like that have been worth anything?

Count the rounds that reached seven or more, then write that same count as a share of all 10,000.

```r
# luck_scores holds the score from each of 10,000 pure-guess rounds.
# Count the rounds that reached seven or more correct calls,
# then write that same count as a share of all 10,000.
# Two lines. Press Check when you have them.
```
::check {"regex": "luck_scores\\s*>=\\s*7", "gate": true, "difficulty": "beginner", "ok": "That is it: 1,730 rounds out of 10,000, a share of 0.173. Roughly one guesser in six reaches seven, so seven would have been a thoroughly ordinary evening for somebody with no ability at all.", "no": "Reuse the counting line from the block above and just move the bar: `sum(luck_scores >= 7)`, then the same line with `mean()` in place of `sum()`."}
::solution
```r
# Count the pure-guess rounds that reached seven or more, then as a share
sum(luck_scores >= 7)
#> [1] 1730

mean(luck_scores >= 7)
#> [1] 0.173
```

That is 1,730 out of 10,000, which is a share of 0.173, or about 17 in every 100.

Same guesser and the same ten cups, and all we moved was one number. Nine was a once-in-a-hundred evening. Seven happens to roughly one guesser in six.

=== step === concept
## So what verdict does each of those two numbers earn?
::prose-only both counts are already on screen from the blocks above; what is new here is the reading, not another picture

Let's put the two counts side by side.

If she calls seven, luck matches her 1,730 times in 10,000, which is about 17 in 100. If she calls nine, luck matches her 112 times in 10,000, which is about 1 in 100.

Start with seven. That is an evening pure guessers produce about seventeen times in every hundred attempts. There is nothing about a score like that which is hard to explain with luck, so luck stays on the table as a perfectly reasonable story and you have learned very little.

Now take nine. An evening that good turns up about once in a hundred pure-guess attempts. You can still tell the luck story if you want to, but you are now asking everyone at that table to believe that the one-in-a-hundred evening happened tonight, in front of them, on the first try. Most people will stop believing that and start believing Priya.

Notice that neither number forced a verdict on anybody. There is no fixed line in the sand here, and no rule that hands down a verdict at 112. It is evidence, and the people at the table decide how much of it they want before they change their mind.

[WARNING]
Failing to rule luck out is not the same as showing there is nothing there. If Priya had called seven, the honest sentence is "an evening like this is well within what luck does", not "Priya cannot taste the difference". She might have a real but modest talent that ten cups was never going to reveal.

=== step === quiz
## Quick check: which reading of 112 in 10,000 is right?

Luck reached nine or better in 112 of the ten thousand rounds. Which sentence reads that count correctly?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- There is about a 1 in 100 chance that Priya was just lucky tonight. ::no
- If Priya has no ability at all, an evening as good as hers turns up about once in every hundred attempts. ::ok Yes, and notice the order of it. It assumes the boring story first, then reports how ordinary her evening would be inside that story. That is the only direction this count ever runs.
- About 1 in 100 people can genuinely tell Coke from Pepsi by taste. ::no
- Priya has about a 99 in 100 chance of being genuinely skilled. ::no Three of these four quietly turn the count into a statement about Priya, or about people in general. The 112 was counted inside a world we built by hand, a world where she has no ability and every call is a coin toss, and all it says is how often that world produces an evening as good as hers. It never measured how likely she is to be skilled.

=== step === concept
## What did we just do, in four moves?

We have now run the same thing several times over, so let's give it a name while it is still fresh.

::widget process-flow {"steps":[{"title":"Write down the result","sub":"Priya called nine of the ten cups right"},{"title":"Assume it was pure luck","sub":"no ability at all, one coin toss per cup"},{"title":"Replay luck ten thousand times","sub":"ten fresh coin-toss calls, scored against the pour"},{"title":"Count how often luck did as well","sub":"112 of the 10,000 rounds reached nine or better"}]}

Move one is the only part that comes from the real world. Priya called nine of the ten right, and that is the score we have to explain.

Move two is a decision we make, not something we discovered. We assume the boring story, which is no ability at all and every call a coin toss. We assume it precisely because it is the story we want to put to the test.

Move three is where R earns its keep. One coin-toss evening tells you nothing, so we run ten thousand of them and keep the score from every single one.

Move four is just a count. How many of those pure-luck evenings did as well as Priya or better? It was 112 of them.

That is the whole skeleton, and it does not change. Everything else is detail.

=== step === tryit
## Your turn: what if you had stopped after four cups?

Here is where those four moves start paying for themselves, because you can now run them on a test that never even happened.

Suppose you had got bored after four cups, and Priya had called all four of them right for a perfect score. Is a score like that worth anything?

Build the luck game for that shorter test yourself. It is the same four moves with smaller numbers, and `poured[1:4]` gives you the record of the first four cups you filled.

```r
# Build the luck game for a four-cup taste test.
# poured[1:4] is the record of the first four cups you filled.
# Use set.seed(5), then replay 10,000 rounds of four coin-toss calls,
# and use all() to ask whether a round called every one of the four right.
# Then count how many of the 10,000 rounds were perfect, and write that
# count as a share. Press Check when you have it.
```
::check {"regex": "poured[^A-Za-z]{0,3}1\\s*:\\s*4", "gate": true, "difficulty": "intermediate", "ok": "Right: 627 perfect rounds out of 10,000, a share of 0.0627. A pure guesser goes four for four about once every sixteen attempts, so a perfect four-cup score would have proved very little.", "no": "Keep the four moves and shrink the test. Score against `poured[1:4]`, and use `all()` in place of `sum()`, because at four cups only a perfect round counts. Set the seed to 5, replicate 10,000 rounds, then count them with `sum()` and take the share with `mean()`."}
::solution
```r
# Count how often four pure-guess calls get all four cups right
set.seed(5)
perfect4 <- replicate(10000, all(sample(c("Coke", "Pepsi"), 4, replace = TRUE) == poured[1:4]))

sum(perfect4)
#> [1] 627

mean(perfect4)
#> [1] 0.0627
```

That is 627 perfect rounds out of 10,000, which is a share of 0.0627, or about 1 in 16.

That number should look familiar if you think about the coin for a second. Getting four tosses to all land the way you need them is 1 in 16, and the simulation found 0.0627 against the exact 0.0625 you would work out by hand.

So if you had stopped at four cups, Priya could have gone perfect and you would still have had almost nothing to show for it.

=== step === concept
## So how many cups did Priya need?

A perfect score on four cups turned out to be a 1 in 16 fluke, so four cups was never going to settle anything. Ten cups clearly did better than that. So somewhere between the two, this test became worth running, and we can watch exactly where that happens.

We keep the four moves and change only the length of the test. At each length, we count how often a pure guesser calls every single cup right. The `for` line below is what lets us do all three in one go. It runs the same block three times over, once with `cups` set to 4, then 6, then 8, and `cat()` prints one line of plain text at the end of each pass.

```r
# Count the perfect pure-guess rounds as the taste test gets longer
set.seed(5)
for (cups in c(4, 6, 8)) {
  perfect <- replicate(10000, all(sample(c("Coke", "Pepsi"), cups, replace = TRUE) == poured[1:cups]))
  cat(cups, "cups:", sum(perfect), "perfect rounds in 10,000\n")
}
#> 4 cups: 627 perfect rounds in 10,000
#> 6 cups: 148 perfect rounds in 10,000
#> 8 cups: 29 perfect rounds in 10,000
```

Now add in the one you already have. In the ten-cup table of luck scores, a perfect ten came up just 6 times in 10,000.

So pure luck went perfect 627 times at four cups, 148 times at six, 29 times at eight, and 6 times at ten.

Every extra pair of cups roughly quarters luck's chances, because luck now has to win two more coin tosses on top of everything it was already winning. That is the whole reason a bigger test is worth the trouble. You are not collecting more data because more of it is tidier. You are making the boring story harder and harder to tell.

[KEY INSIGHT]
How big a test needs to be is really a question about how easy the luck story stays. Four cups leave luck a 1 in 16 escape route. Ten cups cut a perfect score down to 6 in 10,000, which is why ten cups were worth pouring.

=== step === concept
## Is this really what every test is doing?

You will meet plenty of tests with names on them, like the t-test, the chi-squared test, ANOVA and a long list of others. It is easy to assume that each one is a separate machine with its own private logic.

They are not. Every one of them runs the same four moves you just ran. Only two things change from one test to the next, which are the number they use as the score and the way they replay the luck.

So let's take a case that has nothing to do with taste. You have two branches of a shop and someone asks whether one branch really does better than the other. Let's set that beside Priya, row by row.

| The four moves | Priya's ten cups | Two shop branches |
|---|---|---|
| Write down the result | She called 9 of the 10 right | Branch A is averaging 240 rupees more per order |
| Assume it was pure luck | She has no ability, every call is a coin toss | The branch a customer walked into changed nothing about their order |
| Replay luck many times | 10,000 rounds of ten coin-toss calls | 10,000 reshuffles of the same orders between the two branch labels |
| Count how often luck did as well | 112 rounds reached 9 or better | However many reshuffles produced a gap of 240 or more |

Read down the left column first, then across each row. The four moves stay exactly where they are. What changes is the score, which goes from a count of correct calls to a gap between two averages. The luck model changes too, from tossing a coin to shuffling labels between customers. That is all that changes.

So a test with a name on it is really just a fast, agreed way of doing moves three and four for one particular kind of score. Underneath the name it is still asking the question you asked at that dinner table. How often would luck alone have done this well?

=== step === quiz
## Quick check: where are the four moves in a test on two shop branches?

Branch A is running 240 rupees ahead of Branch B on average order value, and you want to know whether that gap is real. Which of these is move two, the assumption you build on purpose?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- You assume Branch A is genuinely better, then look through the data for support. ::no
- You assume a 240 rupee gap is too small to matter, then check whether it is big enough to bother with. ::no
- You assume the branch a customer walked into changed nothing about their order, then reshuffle the orders between the two labels thousands of times and count how often luck alone reached 240. ::ok Exactly, and it is the same pair of moves you ran on the cups. The coin toss becomes a reshuffle of labels, the score becomes a gap in rupees, and the reasoning underneath is untouched.
- You assume the two branches serve different kinds of customers, then adjust the averages to make them comparable. ::no The move you always start from is the boring one: assume the thing you are testing changed nothing at all. Here that means the branch label had no effect on anybody's order. You then replay that world thousands of times and count how often luck alone produced a gap of 240 rupees or more. Assuming the answer you want, arguing about whether 240 matters, and adjusting the data first are all different jobs.

=== step === concept
## References

- [The Design of Experiments](https://archive.org/details/in.ernet.dli.2015.502684) - Fisher (1935). Chapter 2 is the lady tasting tea, the original version of the exact argument you just ran, written down nine decades ago.
- [The Lady Tasting Tea](https://archive.org/details/TheladytastingteaSalsburg2001) - Salsburg (2001). Where that tea experiment came from, and what it started.
- [The Introductory Statistics Course: A Ptolemaic Curriculum?](https://doi.org/10.5070/T511000028) - Cobb (2007), Technology Innovations in Statistics Education 1(1). The case for teaching inference by simulation first and formulas later.
- [Introduction to Statistical Investigations](http://www.isi-stats.com/isi/) - Tintle and colleagues. A whole introductory course built on the shuffle-and-count move used here.
- [The documentation for sample](https://stat.ethz.ch/R-manual/R-devel/library/base/html/sample.html) - R Core Team, on the function that tossed every coin in this lesson.

=== step === complete
## Quick recap

You started with an argument at a dinner table and finished by building the reasoning that sits underneath every statistical test there is. Here are the five things worth keeping:

- Nine out of ten is never judged on its own. It is judged against what pure luck does with the same ten cups.
- Luck is not harmless. One coin-toss round already called seven of your cups correctly.
- The verdict is a count. 112 of the 10,000 pure-guess rounds reached nine or better, which is about 1 in 100.
- That count describes luck's world, not Priya. It says how often a guesser has an evening this good. It never says how likely she is to be skilled.
- A bigger test makes the luck story harder to tell. Four cups leave a 1 in 16 escape route, and ten cups cut a perfect score to 6 in 10,000.

So when the table turns to you for a verdict, here is the sentence you can actually say out loud:

"If you could not taste the difference at all, an evening as good as yours would turn up about once in a hundred tries. I am going to believe you."

Every test you meet from here runs those same four moves. Next time we take the count you just built, 112 out of 10,000, and give it its proper name, because that number is a p-value.

Congratulations, you made it through. Have a great day.
