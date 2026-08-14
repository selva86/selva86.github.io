---
title: "Conditional probability: P(A given B), made concrete"
slug: "Foundations-Mini-1"
catalog_blurb: "Why a positive result from a 99% accurate test can still mean little."
description: "A disease hits 1 person in 1,000, the test is 99% accurate, and your result is positive. Work out what that really means, and learn conditional probability."
keywords: "conditional probability, P(A given B), base rate, false positives, Bayes theorem, medical test probability, R"
date: "2026-08-15"
post_type: "LESSON"
curriculum_id: "0.0.9"
lesson_access: "windowed"
course_id: "foundations-extras"
course_title: "Probability Foundations"
course_lesson: "1"
course_total: "6"
course_landing: "/dashboard.html"
course_prev: ""
course_next: ""
webr: true
mathjax: true
---

=== step === cover
::eyebrow Part 1 of 6
## P(A given B), made concrete

Meera is thirty-four, feels perfectly well, and takes a screening test because her employer pays for one every year. A week later a letter arrives saying her result is positive. The letter mentions two other things almost in passing: the test is 99% accurate, and the disease it looks for affects about 1 person in 1,000.

So how frightened should she be?

Nearly everybody says very, and they point at the 99% to justify it, because that is the only number in the letter that looks like an answer. It is the wrong number, and it is not even in the right neighbourhood. Meera's actual chance of having the disease, given everything that letter says, is a little under 10%. The overwhelmingly likely explanation for her positive result is that she is perfectly healthy and the test slipped.

That gap between 99% and 9% is not a trick or a technicality, and it is exactly what conditional probability exists to sort out. Once you have seen where the 9% comes from you will start noticing the same shape underneath spam filters, fraud alerts, DNA evidence in court, and every Bayesian method you ever meet.

Here is the whole answer in one picture. Imagine 10,000 people taking Meera's test on the same morning, split first by who genuinely has the disease and then by what the test said about each of them.

By the end you will be able to:

- Say what the word "given" does to a probability, and work one out by hand
- Get Meera's real answer three ways: by counting people, by formula, and by simulation
- Tell apart the two questions everybody mixes up, how often the test is right and how often a positive result is right
- Redo the whole calculation in R for any disease and any test, and say which number is doing the work
- Spot the same arithmetic in a spam filter and a fraud alert, and name what has to be true for it to hold

**What you need first:** you can read a simple R script, so a variable, a function call and a comparison are familiar sights. No statistics is assumed at all. Everything else gets built here from nothing.

::widget tree-diagram {"root":"has the disease?","l":"10 sick","r":"9,990 well","leaves":["10 flagged","0 missed","100 flagged","9,890 clear"]}

=== step === concept
::eyebrow Reading the letter
## Two sentences, four numbers

Before any arithmetic, notice that the letter has quietly handed Meera two completely different kinds of fact, and telling them apart is most of the battle.

The first is how common the disease is: about 1 person in 1,000. That number has nothing to do with Meera, or with her result, or with any test at all. It describes the crowd she came from before anybody tested anything, and it is called the **base rate**, or sometimes the prevalence. Written as a probability it is 1/1000, which is 0.001. Probability here means nothing more exotic than a share of a group, so 0.001 is simply the fraction of the crowd that the sentence is true of.

The second fact is how good the test is, and this is where "99% accurate" gets sneaky, because a test can be wrong in two separate ways and a single number cannot describe both. It can miss somebody who really is ill, and it can raise the alarm on somebody who is perfectly fine. Those two mistakes are counted separately and they have their own names.

| The number | What it promises | Value here |
|---|---|---|
| Base rate | of everyone tested, this share genuinely has the disease | 1 in 1,000 |
| Sensitivity | of the people who DO have it, this share gets flagged | 99 in 100 |
| Specificity | of the people who do NOT have it, this share gets cleared | 99 in 100 |
| False alarm rate | of the people who do NOT have it, this share gets flagged anyway | 1 in 100 |

That last row is not a fourth promise, it is specificity read backwards: if 99 in 100 healthy people are cleared, then the 1 in 100 left over is flagged by mistake. Keep your eye on it, because it turns out to be the villain of the whole story.

[NOTE]
A letter that says "99% accurate" without saying which kind of accuracy it means is being careless, and it is fair to ask. Meera's is read here in the friendliest possible way, with both promises sitting at 99%, which only makes what happens next more surprising.

=== step === concept
::eyebrow The trick that makes it obvious
## Turn the percentages into people

Percentages are slippery to reason with. People are not. So rather than juggling 0.001 and 0.99 in your head, picture a specific crowd: 10,000 people, all in Meera's situation, all taking the same test on the same morning.

Why 10,000 rather than 1,000? Purely because it keeps the numbers tidy. A disease that hits 1 person in 1,000 hits 10 people in 10,000, and ten whole people are much easier to hold in your head than one tenth of a person.

```r
people <- 10000
prevalence <- 1 / 1000

sick    <- people * prevalence
healthy <- people - sick

c(sick = sick, healthy = healthy)
#>    sick healthy 
#>      10    9990 
```

If you have not met `c()` before, it glues values together into one labelled row so they print side by side, and writing `sick = sick` simply asks R to print the label `sick` above the value. Nothing statistical is happening yet. Ten people in this crowd have the disease and 9,990 do not.

Now let the test loose on both groups. Sensitivity says 99 of every 100 sick people get flagged, so multiply the sick by 0.99. The false alarm rate says 1 of every 100 healthy people gets flagged anyway, so multiply the healthy by 0.01, which is `1 - specificity`.

```r
sensitivity <- 0.99   # of the sick, the share the test flags
specificity <- 0.99   # of the well, the share the test clears

true_positives  <- sick * sensitivity
false_positives <- healthy * (1 - specificity)

c(true_positives = true_positives, false_positives = false_positives)
#>  true_positives false_positives 
#>             9.9            99.9 
```

There it is, and it is worth staring at for a moment. The test does its job on the sick group almost perfectly, catching 9.9 of the 10 people who are genuinely ill. Meanwhile that harmless sounding 1% error rate, applied to a group of 9,990 healthy people, manufactures 99.9 false alarms.

You cannot meet 9.9 people, of course. A decimal turns up because this is what happens on average across many mornings like this one, and keeping the decimals means nothing gets lost to rounding. The tree below rounds them to 10 and 100 so the picture stays readable, and the arithmetic from here on keeps the exact values.

::widget tree-diagram {"root":"has the disease?","l":"10 sick","r":"9,990 well","leaves":["10 flagged","0 missed","100 flagged","9,890 clear"]}

=== step === concept
::eyebrow The answer
## Meera is one of 109.8 flagged people

Meera knows one thing about herself that morning: she got flagged. So the only people who are relevant to her question are the other people who also got flagged, and there are two very different groups of them.

```r
all_positives <- true_positives + false_positives
all_positives
#> [1] 109.8

true_positives / all_positives
#> [1] 0.09016393
```

The `[1]` at the start of each output line is only R keeping count for you, saying that the line begins with the first value, so read straight past it.

About 110 people walk out of that clinic with a positive result. Not quite 10 of them are genuinely ill, and about 100 of them are healthy people who have just been handed a fright. Meera is somewhere in that group of 110 and has no way of knowing which part she is in, so her chance of being one of the sick ones is 9.9 out of 109.8, which comes to 0.0902, or a bit over 9%.

The email that brought you here put it as a ratio, and now you can see exactly where that ratio comes from: for every one genuinely sick person the test finds, it frightens about ten healthy ones.

[KEY INSIGHT]
The test is excellent at its job and the answer is still 9%, because a 1% mistake rate applied to a very large healthy group produces more false alarms than there are sick people in the entire crowd.

=== step === quiz
::eyebrow Check yourself
## Where the 9% comes from

The test is right 99 times out of 100 in both directions, and yet a positive result still leaves Meera roughly 91% likely to be perfectly healthy. Which sentence explains that best?

::quiz {"correct":2,"gate":true,"difficulty":"beginner"}
- The test is not accurate enough to be worth taking
- Almost everyone tested is healthy, so a small error rate applied to that huge group produces far more false alarms than there are sick people to find ::ok Exactly. The 1% is small, but 1% of 9,990 healthy people is 99.9 false alarms, while the entire sick group only had 10 people in it to begin with. Size beats accuracy here.
- The 1% error rate gets applied twice, once to each group, so the errors double
- The test misses nine out of every ten people who really are sick ::no Not quite, and it is worth being precise about why. The test is genuinely accurate, and it caught 9.9 of the 10 sick people rather than missing nine of them, so it is not failing on the sick group at all. Nothing gets doubled either. The whole effect comes from the two group sizes: 1% of a 9,990-person crowd is simply a bigger number than 99% of a 10-person one.

=== step === concept
::eyebrow The move you just made
## Conditioning means throwing rows away

Look back at what you actually did. You started with 10,000 people, you ignored everybody whose test came back negative, and then you asked what fraction of the people left over had the disease. That two step move, restrict the crowd and then re-count, is the whole of conditional probability.

The words for it are "given". P(disease **given** a positive test) means: among only the people who tested positive, what share have the disease? The condition is not a fact about the disease and it does not change anybody's health. It changes who you are allowed to count.

The counts you built fit in four rows, one for each combination of truth and test result. Press "Show what changed" to condition on a positive test and watch two of those rows get struck out, because those are the 9,890 people you have just stopped counting.

::widget table-transform {"code":"df %>% filter(test == \"positive\")","caption":"Conditioning on a positive result keeps only the rows where the test said positive. The struck-out rows are the people you have stopped counting, and they never come back into the arithmetic.","before":{"cols":["disease","test","people"],"rows":[["yes","positive",10],["yes","negative",0],["no","positive",100],["no","negative",9890]]},"after":{"cols":["disease","test","people"],"rows":[["yes","positive",10],["no","positive",100]]}}

The two rows that survive are the entire universe of Meera's question, and 10 out of the 110 people in them are ill. The rounded counts in the picture give 9.1%, and the exact ones you computed give 9.02%, which is the same story told to one more decimal place.

[KEY INSIGHT]
Conditioning does not change any probability. It changes the denominator, by shrinking the group you are counting inside.

=== step === concept
::eyebrow The formalism
## The formula, symbol by symbol

Everything so far has been counting, and counting is the honest version. The formula is just that counting written compactly, and it looks like this.

\[ P(A \mid B) = \frac{P(A \text{ and } B)}{P(B)} \]

Read the pieces one at a time, because every symbol earns its place.

`A` is the thing you want to know about, here "this person has the disease". `B` is the thing you already know, here "this person tested positive". The vertical bar is read as the word "given", so the left hand side says the probability of A given B. `P(A and B)` is the probability that both are true of somebody picked at random out of the original 10,000, so it is the sick-and-flagged group as a share of everybody. `P(B)` is the probability that a random person out of the 10,000 gets flagged at all, whether they are ill or not.

Both of the pieces on the right are shares of the same original crowd, which is why the division works: dividing by `P(B)` is exactly the act of shrinking the world down to the people who tested positive.

```r
p_disease_and_positive <- true_positives / people
p_positive             <- all_positives / people

c(p_disease_and_positive = p_disease_and_positive, p_positive = p_positive)
#> p_disease_and_positive             p_positive 
#>                0.00099                0.01098 

p_disease_and_positive / p_positive
#> [1] 0.09016393
```

The same 0.09016393 as before, which is reassuring rather than surprising, since the formula is doing precisely what you did by hand. Notice how tiny both numbers on top and bottom are on their own. Roughly 1 person in 1,000 is both ill and flagged, and roughly 11 people in 1,000 are flagged at all. It is the ratio between two small numbers that carries the meaning, not either one alone.

=== step === tryit
::eyebrow Your turn
## What a negative result would have meant

Meera got the frightening letter, but her colleague sitting two desks away took the same test and was cleared. How reassured should he be?

Same move as before. Restrict the crowd to everyone who tested negative, then ask what share of them is nonetheless ill. Two groups end up in that crowd: the sick people the test missed, and the healthy people it correctly cleared. Both counts are already computed for you below, so the only thing left is the denominator, which has to be everybody who tested negative. Fill in the blank and press Check, keeping brackets around anything you add together.

```r
false_negatives <- sick * (1 - sensitivity)   # sick people the test missed
true_negatives  <- healthy * specificity      # well people the test cleared

false_negatives / ____
```
::check {"regex":"\\(\\s*(false_negatives\\s*\\+\\s*true_negatives|true_negatives\\s*\\+\\s*false_negatives)\\s*\\)","gate":true,"difficulty":"beginner","ok":"That is it. The answer comes out at 0.0000101, which is about 1 in 100,000, so a negative result on this test is genuinely excellent news even though a positive one told you almost nothing.","no":"The denominator has to be everybody who tested negative, which is both groups added together. Keep the brackets around them, because without brackets R does the division first and adds afterwards, which gives a completely different number: (false_negatives + true_negatives)."}
::solution
```r
false_negatives <- sick * (1 - sensitivity)
true_negatives  <- healthy * specificity

false_negatives / (false_negatives + true_negatives)
#> [1] 1.011102e-05
```

That output is R's shorthand for a very small number: `1.011102e-05` means 1.011102 divided by 100,000, or 0.00001011102. Call it 1 in 100,000.

Sit the two results side by side, because they are the same test on the same morning. A positive result moves Meera from 1 in 1,000 to about 1 in 11. A negative result moves her colleague from 1 in 1,000 down to about 1 in 100,000. The identical test is enormously informative in one direction and nearly useless in the other, purely because of how few sick people there were to find.

=== step === concept
::eyebrow The classic mistake
## The two questions everybody swaps

There are two sentences in play here, they differ by four words, and confusing them is probably the single most expensive mistake in applied probability.

- P(flagged **given** sick) is 0.99. Of the people who have the disease, 99% get flagged. This is the test's promise, measured in a lab on people whose status was already known.
- P(sick **given** flagged) is 0.09. Of the people who got flagged, 9% have the disease. This is Meera's question, and the answer depends on how many sick people there were in the crowd in the first place.

Both are conditional probabilities. They condition on opposite things, and swapping one for the other is called the inverse fallacy, or in a courtroom, the prosecutor's fallacy. It is the exact move behind "the DNA match has a one in a million error rate, therefore there is only a one in a million chance the defendant is innocent", and it has put people in prison.

The tree makes the difference visible if you read it in two directions. Going downwards, you start at "has the disease?", take the left branch to the 10 sick people, and see that essentially all of them get flagged, 9.9 before the picture rounds it. That is the 99%, and it lives entirely inside the left half of the tree. Going along the bottom instead, you gather up every flagged person wherever they came from, which means 10 from the left plus 100 from the right, and ask what share of that pile is sick. That is Meera's 9%, and it only exists because you allowed both halves of the tree to contribute.

::widget tree-diagram {"root":"has the disease?","l":"10 sick","r":"9,990 well","leaves":["10 flagged","0 missed","100 flagged","9,890 clear"]}

=== step === quiz
::eyebrow Check yourself
## Which sentence is the 99%?

Meera's letter says the test is 99% accurate. Which of these does that 99% actually describe?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- The chance that Meera has the disease, now that she has tested positive
- The chance that a positive result from this test is correct, whoever takes it
- Of the people who genuinely have the disease, the share that this test flags ::ok Right, and notice that the sentence never mentions Meera. It is a fact about the test measured on people whose status was already known, so it can be true no matter how rare or common the disease is. Her question runs the other way round and needs the base rate before it can be answered at all.
- The share of all tests, positive and negative, that come back with the right answer ::no The first two turn the 99% into a claim about a result rather than about the test, and the last one is a different measure altogether: an overall right-answer rate blends the sick and the healthy into a single figure, which hides which of the two mistakes it is talking about. The 99% was measured on people already known to be ill, so it says what the test does to them. What a positive result means for the person holding it depends on how many healthy people were tested alongside them, which is why the same 99% test gives 9% here and would give something completely different in a hospital ward full of symptomatic patients.

=== step === concept
::eyebrow The famous formula
## Bayes' theorem is these two sentences rearranged

You now have everything needed to derive Bayes' theorem, and it takes two lines, because the theorem is not a new idea. It is the definition you already have, written twice and set equal to itself.

The definition of conditioning, rearranged so the joint probability is on its own, says the chance of both A and B is the chance of B times the chance of A once B has happened.

\[ P(A \text{ and } B) = P(A \mid B) \, P(B) \]

Nothing stops you telling the same story in the other order, since "both happened" does not care which one you mention first.

\[ P(A \text{ and } B) = P(B \mid A) \, P(A) \]

Two expressions for the same quantity have to be equal, so set them equal and divide both sides by `P(B)`. That is Bayes' theorem.

\[ P(A \mid B) = \frac{P(B \mid A) \, P(A)}{P(B)} \]

Every piece has a name worth knowing, because you will meet these words everywhere. `P(A)` is the **prior**, what you believed before the evidence arrived, which here is the base rate of 0.001. `P(B given A)` is the **likelihood**, how readily the evidence appears when A is true, which here is the sensitivity of 0.99. `P(B)` is the **evidence**, how often the evidence appears at all, counting every way it can happen. And `P(A given B)` is the **posterior**, your updated belief.

The only piece that takes any work is the evidence on the bottom, because a positive test can arrive by two different routes: from a sick person the test caught, or from a healthy person it flagged by mistake. Add both routes.

```r
prior      <- 1 / 1000
likelihood <- sensitivity
evidence   <- sensitivity * prior + (1 - specificity) * (1 - prior)

c(prior = prior, likelihood = likelihood, evidence = evidence)
#>      prior likelihood   evidence 
#>    0.00100    0.99000    0.01098 

(likelihood * prior) / evidence
#> [1] 0.09016393
```

The same 0.09016393 for the third time. If the formula feels abstract, remember that `evidence` is 0.01098, which is 109.8 people out of 10,000, and you have already met all 109.8 of them.

=== step === concept
::eyebrow Make it reusable
## One function, any disease, any test

Meera's numbers are not special, so it is worth packaging the calculation once and then feeding it anything.

Written out in full, with a line per idea and nothing clever going on, it looks like this. It works with shares of one crowd rather than counts of people, so a prevalence of 0.001 means the sick share is 0.001 and the healthy share is the remaining 0.999.

```r
chance_it_is_real <- function(prevalence, sensitivity, specificity) {
  share_sick    <- prevalence
  share_healthy <- 1 - prevalence

  true_positive_share  <- share_sick * sensitivity
  false_positive_share <- share_healthy * (1 - specificity)

  true_positive_share / (true_positive_share + false_positive_share)
}

chance_it_is_real(1 / 1000, 0.99, 0.99)
#> [1] 0.09016393
```

The body is the same four lines you have run three times already, with `people <- 10000` dropped because the crowd size cancels out of the division. Ten people out of 10,000 and one person out of 1,000 give the same answer, which is why the choice of 10,000 earlier was purely for readability.

Now that it takes arguments you can ask it questions the letter never answered. What if the lab tightened the test so that only 1 healthy person in 1,000 is flagged by mistake, rather than 1 in 100?

```r
chance_it_is_real(1 / 1000, 0.99, 0.999)
#> [1] 0.4977376
```

A positive result now means roughly a coin flip rather than a 9% worry, and notice what changed to buy that. The sensitivity stayed at 0.99 throughout, so the improvement came entirely from making fewer mistakes on healthy people. When the disease is rare, the specificity is the number that matters and the sensitivity is nearly a spectator.

=== step === concept
::eyebrow The thing that really decides it
## The base rate does almost all the work

Since the function takes any prevalence, feed it a range of them and watch what the same 99% test does across different crowds. `sapply()` here just means "run this function once for every value in the vector and collect the answers".

```r
sick_per_1000 <- c(1, 2, 5, 10, 20, 50, 100)
chances <- sapply(sick_per_1000 / 1000, chance_it_is_real,
                  sensitivity = 0.99, specificity = 0.99)

data.frame(sick_per_1000, chance_percent = round(100 * chances, 1))
#>   sick_per_1000 chance_percent
#> 1             1            9.0
#> 2             2           16.6
#> 3             5           33.2
#> 4            10           50.0
#> 5            20           66.9
#> 6            50           83.9
#> 7           100           91.7
```

One test, one accuracy, and the meaning of a positive result runs all the way from 9% to 92% depending on nothing but who was in the room. Look at the row where 10 people in 1,000 are sick, which is a 1% base rate: with a 99% test that lands on exactly 50.0%, a perfect coin flip, and it is a handy landmark to carry around. Whenever a test is equally good in both directions and its error rate matches the base rate, a positive result is worth precisely one coin toss, whatever that shared number happens to be.

This is also why the same test can be honest in one place and useless in another. Used on a ward full of people with symptoms, where perhaps 10% genuinely have the disease, a positive result means 91.7% and doctors act on it. Used on 10,000 people who feel fine, the identical test means 9% and mostly generates frightening letters.

::widget chart-plotter {"data":[{"x":1,"y":9},{"x":2,"y":16.6},{"x":5,"y":33.2},{"x":10,"y":50},{"x":20,"y":66.9},{"x":50,"y":83.9},{"x":100,"y":91.7}],"geoms":["line","point"],"x":"sick_per_1000","y":"chance_percent"}

=== step === tryit
::eyebrow Your turn
## A different clinic, different numbers

Somewhere else entirely, a clinic screens for a condition that affects 1 person in 200, using a test that is right 95 times in 100 in both directions. Somebody has just tested positive.

Before you run anything, guess. The disease is five times commoner than Meera's, but the test is a lot sloppier, so which effect wins? Fill in the prevalence and press Check to find out.

```r
chance_it_is_real(____, 0.95, 0.95)
```
::check {"regex":"(1\\s*/\\s*200|0\\.005)","gate":true,"difficulty":"intermediate","ok":"About 0.087, so roughly 9% again, which is almost exactly where Meera landed. A commoner disease pushed the answer up and a sloppier test pulled it back down by about the same amount, and the two effects happened to cancel.","no":"A rate of 1 person in 200 written as a number for R is 1 / 200, which you could also type as 0.005."}
::solution
```r
chance_it_is_real(1 / 200, 0.95, 0.95)
#> [1] 0.08715596
```

Worth noticing how easily that would have been misread in the room. The disease being five times commoner sounds like it ought to make a positive result far more believable, and the test losing four percentage points of accuracy sounds minor. In fact the second effect quietly swallowed the first, because with 199 healthy people for every sick one, moving the false alarm rate from 1 in 100 to 5 in 100 lets through five times as many frightened healthy people.

=== step === concept
::eyebrow Do not take my word for it
## Simulate 200,000 people and count

Every number so far came out of arithmetic, and arithmetic can be done wrong. So build the crowd for real, one simulated person at a time, and count what actually happens to them.

`set.seed(2026)` pins R's random number generator to a fixed starting point, so everything below is random but repeatable: run it yourself and you will get this exact table rather than something slightly different. `runif(n)` draws n random numbers spread evenly between 0 and 1, so `runif(n) < 1/1000` is TRUE for about one draw in a thousand, which is exactly how you toss a very lopsided coin 200,000 times. The `ifelse()` line then applies the right rule to each person: if they are sick, they get flagged with probability 0.99, and if they are well, they get flagged with probability 0.01.

```r
set.seed(2026)
n <- 200000

has_disease    <- runif(n) < 1 / 1000
tests_positive <- ifelse(has_disease, runif(n) < 0.99, runif(n) < 0.01)

table(has_disease, tests_positive)
#>            tests_positive
#> has_disease  FALSE   TRUE
#>       FALSE 197854   1956
#>       TRUE       2    188
```

That table is the four rows from earlier, built by simulation rather than by multiplication. Out of 200,000 simulated people, 190 turned out to be ill and 188 of them were flagged, while 1,956 perfectly healthy people were flagged as well. Now condition, which in code is a single pair of square brackets.

```r
mean(has_disease[tests_positive])
#> [1] 0.08768657
```

`has_disease[tests_positive]` keeps only the entries where `tests_positive` is TRUE, so it is the same "throw the other rows away" move as the struck-out table, done to a vector. Taking the `mean()` of TRUE and FALSE values gives the fraction that are TRUE, because R counts every TRUE as 1 and every FALSE as 0.

The simulation says 8.77% and the exact arithmetic says 9.02%. The small gap is just the roughness of 200,000 people, since only about 2,100 of them ended up in the flagged group and small groups wobble. Run it with a different seed and it will wobble somewhere else, always around 9%.

=== step === concept
::eyebrow A word you will need next
## Independence: when conditioning changes nothing

Every conditional probability so far has moved. Knowing the test was positive dragged Meera's chance from 0.001 up to 0.09, and knowing it was negative dragged her colleague's down to 0.00001. Sometimes conditioning moves nothing at all, and that case has a name you will need in a moment.

Two events are **independent** when knowing one tells you nothing whatsoever about the other, which in symbols is

\[ P(A \mid B) = P(A) \]

and in words says the condition made no difference: restricting to the cases where B happened left the share of A exactly where it started.

Dice make it obvious. Roll two of them a hundred thousand times, ask how often the first die shows a six, then ask the identical question again but only among the rolls where the second die showed a six.

```r
set.seed(42)
die1 <- sample(1:6, 100000, replace = TRUE)
die2 <- sample(1:6, 100000, replace = TRUE)

mean(die1 == 6)
#> [1] 0.16458

mean(die1[die2 == 6] == 6)
#> [1] 0.1609477
```

Both come out near 0.167, which is 1/6, and the sliver between them is the wobble of a finite number of rolls rather than a real effect. `die1[die2 == 6]` conditioned on the second die, threw away five sixths of the rolls, and the answer refused to budge. That is independence.

[NOTE]
Independent is not the same as mutually exclusive, and the two get confused constantly. Rolling a 2 and rolling a 5 on one die cannot both happen, which makes them as dependent as two events can possibly be: learning that one occurred tells you the other definitely did not. Independent events happily happen together, they just carry no information about each other.

=== step === concept
::eyebrow The obvious next move
## What a second positive test would do

Meera does the sensible thing and asks for a retest. It comes back positive again. What now?

Bayes handles this without any new machinery, because a posterior is just a belief, and a belief is what a prior is. Yesterday's answer becomes today's starting point: she walked into the first test as a 1-in-1,000 person and walked out as a 9%-chance person, so she walks into the second test as a 9%-chance person.

```r
after_one <- chance_it_is_real(1 / 1000, 0.99, 0.99)
after_two <- chance_it_is_real(after_one, 0.99, 0.99)

round(c(after_one = after_one, after_two = after_two), 4)
#> after_one after_two 
#>    0.0902    0.9075 
```

From 9% to 91% on the strength of one more result, which is a bigger jump than most people expect. It happens because the second test is no longer working against a crowd of 9,990 healthy people. It is working against a crowd where roughly one person in eleven is genuinely ill, and in that crowd a 1% false alarm rate simply cannot manufacture enough noise to drown out the signal. The base rate did the damage the first time, and having been dragged upwards, it now works in her favour.

[WARNING]
That 91% is only honest if the two tests can fail independently of each other, and often they cannot. If the retest ran on the same blood sample, or the same substance in her body cross-reacts with the test both times, then the second positive is partly a copy of the first rather than fresh evidence, and multiplying the belief up as if it were new information overstates the case. This is exactly why a good clinician retests with a different kind of test rather than the same one twice.

=== step === quiz
::eyebrow Check yourself
## What the retest assumes

Meera's second positive test lifted her from 9% to 91%. What has to be true for that 91% to be trustworthy?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Nothing extra, since the arithmetic is the same as the first time
- The second test has to be able to go wrong independently of the first, so its result is fresh evidence rather than a repeat of the same mistake ::ok Exactly. The calculation treats the second result as new information, and it only is new if whatever made the first test wrong does not automatically make the second one wrong too. Same sample, same cross-reaction, same faulty batch, and the second positive is mostly an echo.
- The base rate has to be recalculated, because Meera is now known to be a positive tester
- The two tests have to come back within a short time of each other ::no The arithmetic is not the issue and the timing is not either. The base rate genuinely does change, and correctly so, since her 9% is now the right starting point for the second test. What the calculation quietly assumes is independence between the two failures, and that assumption is doing real work: without it, a second positive from the same sample tells you far less than the numbers claim.

=== step === concept
::eyebrow Somewhere with no doctors in it
## The same arithmetic, wearing different clothes

None of this reasoning is about medicine. Take an imaginary inbox of 1,000 emails where 300 are spam and 700 are genuine, and a spam filter with exactly one rule: does the email contain the word "invoice"?

Made-up counts, chosen to be readable, but the arithmetic on them is the real thing.

```r
inbox <- data.frame(
  kind         = c("spam", "spam", "real", "real"),
  says_invoice = c("yes", "no", "yes", "no"),
  emails       = c(180, 120, 40, 660)
)

inbox
#>   kind says_invoice emails
#> 1 spam          yes    180
#> 2 spam           no    120
#> 3 real          yes     40
#> 4 real           no    660
```

The base rate here is the share of the inbox that is spam before you read a single word, which is 300 out of 1,000, or 0.3. Now condition on the word, which is the same restrict-and-recount move you have made all lesson, this time written with square brackets on a data frame.

```r
with_invoice <- inbox[inbox$says_invoice == "yes", ]
with_invoice
#>   kind says_invoice emails
#> 1 spam          yes    180
#> 3 real          yes     40

sum(with_invoice$emails[with_invoice$kind == "spam"]) / sum(with_invoice$emails)
#> [1] 0.8181818
```

`inbox[inbox$says_invoice == "yes", ]` keeps the rows where the word appears and drops the rest, and the comma with nothing after it says "keep all the columns". The row numbers 1 and 3 that R prints are a small giveaway that rows 2 and 4 have been thrown away, which is conditioning leaving its fingerprints.

Seeing the word "invoice" takes an email from a 30% chance of being spam to an 82% chance. Meera's letter did the same job starting from far lower down, taking her from 0.1% to 9%, and both are the same calculation: a prior, a piece of evidence, and a posterior that lands wherever the two of them together put it.

::widget table-transform {"code":"df %>% filter(says_invoice == \"yes\")","caption":"The filter keeps the emails containing the word and strikes out the rest, which is the same conditioning move as the medical table, on a completely different subject.","before":{"cols":["kind","says_invoice","emails"],"rows":[["spam","yes",180],["spam","no",120],["real","yes",40],["real","no",660]]},"after":{"cols":["kind","says_invoice","emails"],"rows":[["spam","yes",180],["real","yes",40]]}}

=== step === concept
::eyebrow Honesty
## Where this calculation quietly breaks

Everything above rests on assumptions that are easy to hold and easy to lose. Four are worth carrying with you.

- **The base rate has to be the right one for this person.** 1 in 1,000 is the rate among everybody screened. If Meera had symptoms, or a family history, or belonged to a group where the disease is commoner, her honest starting point would be higher than 1 in 1,000 and the answer would climb accordingly, exactly as the table of prevalences showed. Choosing the base rate is a judgement, not a lookup, and it is where most real arguments happen.
- **Sensitivity and specificity are estimates, and often flattering ones.** They come from studies, and those studies frequently measure the test on people who are clearly ill and people who are clearly well, which is the easiest possible exam. Out in a screening clinic, with early or borderline cases, real accuracy tends to be lower than the brochure.
- **Repeated tests are rarely independent.** The 91% from a second positive assumed two genuinely separate chances to be wrong, and same-sample retests do not deliver that.
- **A single accuracy figure hides which mistake it describes.** When a rare disease is involved, the specificity is the number you want, because it is the one multiplied by the enormous healthy group.

[WARNING]
There is a bigger, quieter version of all this. Screening people who feel perfectly fine is the situation where false alarms are at their most damaging, because the base rate is at its lowest exactly when the crowd is at its largest. That is not an argument against screening, but it is why screening programmes come with follow-up tests attached, and why "the test is 99% accurate" is never a complete answer to the question anyone is actually asking.

=== step === quiz
::eyebrow One last one
## A fraud alert, from scratch

A bank flags card transactions it believes are fraudulent. About 1 transaction in 500 really is fraud. The alarm catches 99% of genuine fraud, and it also fires on 2% of perfectly ordinary transactions. Your card has just been flagged.

Roughly what is the chance the flagged transaction really is fraud?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- About 99%, since that is what the alarm catches
- About 50%, because the alarm is good but not perfect
- About 9%, because the 2% false alarm rate applies to a vastly larger group of ordinary transactions ::ok Right, and you can do this one in your head now. Out of 10,000 transactions, 20 are fraud and about 20 of those get caught, while 2% of the other 9,980 gives roughly 200 false alarms. So about 20 real out of 220 flagged, which is a bit over 9%. Running chance_it_is_real(1 / 500, 0.99, 0.98) gives 0.0902.
- Impossible to say without knowing how many transactions the bank processes ::no The 99% describes what the alarm does to fraud, not what a flag means to you, and the total number of transactions cancels out of the calculation entirely. What decides it is the collision between a 1-in-500 base rate and a 2% false alarm rate on everything else: roughly 20 real frauds caught against roughly 200 false alarms, so a flag is right about 9% of the time. It is Meera's letter with a card reader instead of a clinic.

=== step === concept
::eyebrow Go deeper
## References

Four places worth an hour if you want to push past this lesson.

- [Gigerenzer and Edwards (2003), Simple tools for understanding risks, BMJ](https://pmc.ncbi.nlm.nih.gov/articles/PMC200816/) - the paper behind the counting-people trick, including evidence that doctors get the screening question right far more often when the numbers are put as frequencies rather than percentages.
- [Seeing Theory, compound probability, Brown University](https://seeing-theory.brown.edu/compound-probability/index.html) - animated conditional probability, if watching the sample space shrink helps it stick.
- [OpenIntro Statistics, chapter 3 (free PDF)](https://www.openintro.org/book/os/) - a patient textbook treatment of conditioning, independence and Bayes, with the exercises this lesson does not have room for.
- [The base rate fallacy](https://en.wikipedia.org/wiki/Base_rate_fallacy) - the name for the mistake, with the court cases and the psychology experiments that made it famous.

=== step === complete
## Part 1 complete

You started with a frightening letter and you now have an answer that most people, including plenty of professionals, get wrong: a positive result from a 99% accurate test for a 1-in-1,000 disease leaves Meera about 9% likely to be ill, because the test's small mistake rate is being applied to an enormous healthy crowd.

More usefully, you have the move that produced it. Restrict the world to the cases where the condition actually happened, count what is left, and divide. That is conditioning, that is what the bar in P(A given B) means, and Bayes' theorem is just the same idea written so you can run it in the direction you care about.

Part 2 is about expected value and variance, which answer a different pair of questions: not how likely something is, but what it is worth on average and how wildly it swings around that average. You will meet the same habit there of turning an abstract formula back into a crowd of concrete cases and counting them.
