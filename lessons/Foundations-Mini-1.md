---
title: "Conditional probability: P(A given B), made concrete"
description: "A positive result on a 99 percent accurate test for a 1-in-1,000 condition still leaves you about 9 percent likely to be ill. Count people and see why."
keywords: "conditional probability, P(A given B), base rate, false positive, medical test probability, Bayes rule, probability in R"
catalog_blurb: "How to work out what a positive test result really means."
post_type: "LESSON"
course_id: "foundations-extras"
course_title: "Probability Foundations"
course_lesson: "1"
course_total: "6"
course_landing: "/dashboard.html"
course_prev: ""
course_next: ""
curriculum_id: "0.0.9"
lesson_access: "windowed"
mathjax: true
webr: true
date: "2026-08-19"
---

=== step === cover

## P(A given B), made concrete

You are standing outside a screening camp holding a slip of paper. It says positive.

The condition it screens for is rare. About 1 person in 1,000 has it. The test is good. It is right 99 times out of 100.

Those two facts are all you know, and right now they feel like the worst news you have ever had.

So before you read on, take a guess. Given that slip in your hand, what is the chance you actually have the condition?

Almost everybody guesses high. The honest answer is closer to 9%.

Here is the whole puzzle in one picture. Line up 100,000 people, send every one of them through the same test, and they end up in four groups. Fill in those four question marks and the answer falls straight out.

::widget tree-diagram {"root": "100,000 tested", "l": "100 have it", "r": "99,900 do not", "leaves": ["? test +", "? test -", "? test +", "? test -"]}

Filling them in is all that conditional probability is. By the end of this you will be able to do it for any test, on paper or in your head, and you will recognise the same trick sitting inside spam filters, fraud alerts and every Bayesian method you ever meet.

=== step === concept

## 99% accurate, but 99% of whom?

::prose-only the move here is a question about what a sentence means, not something that can be drawn; the two rival readings are set side by side in the callout

Go back to the sentence that frightened you. The test is 99% accurate.

Read it slowly and you will notice something missing. It never says what the 99% is a share **of**. Ninety nine percent of whom?

There are two completely different groups it could mean.

It could mean: of the people who have the condition, 99 out of every 100 get a positive slip. That is a claim about sick people.

Or it could mean: of the people holding a positive slip, 99 out of every 100 have the condition. That is a claim about people like you, standing outside the tent with a piece of paper.

The first one is what the manufacturer measures in a lab and prints on the box. The second one is the only thing you care about. They are two different numbers, and shortly you will see that one of them is 99% and the other is 9%.

[KEY INSIGHT]
A percentage on its own means nothing until you say which group it is a share of. "99% accurate" is measured on sick people and on healthy people, separately. Your question is about a third group entirely: the people in the positive queue.

That is the whole lesson in one move. Name the group, then count it.

=== step === concept

## What does "given" actually mean?

"Given" is the plainest word in statistics and it does exactly one thing. It throws people away.

When somebody says "given you tested positive", they are telling you to walk back into that room of 100,000 people, send home everybody whose slip said negative, and look only at who is left standing. Whatever share of that smaller room has the condition, that is your answer.

So this is not algebra. It is counting. Let us build the room.

```r
n_people    <- 100000   # everyone who walks through the camp
prevalence  <- 0.001    # 1 person in 1,000 truly has the condition
sensitivity <- 0.99     # of those who have it, 99 in 100 test positive
specificity <- 0.99     # of those who do not, 99 in 100 test negative

has_it   <- n_people * prevalence   # 100 people
does_not <- n_people - has_it       # 99,900 people

true_positive  <- has_it * sensitivity           # has it, slip says positive
false_negative <- has_it - true_positive         # has it, slip says negative
false_positive <- does_not * (1 - specificity)   # healthy, slip says positive
true_negative  <- does_not - false_positive      # healthy, slip says negative

town <- matrix(c(true_positive,  false_negative,
                 false_positive, true_negative),
               nrow = 2, byrow = TRUE,
               dimnames = list(c("has it", "does not"),
                               c("test +", "test -")))
town
#>          test + test -
#> has it       99      1
#> does not    999  98901
```

Four numbers went in and four groups of people came out. Nothing here is a probability yet. These are head counts of a hundred thousand bodies, and every one of them is a whole person.

Read the table once, row by row. Of the 100 people who genuinely have the condition, 99 got a positive slip and 1 got a negative one. Of the 99,900 who are perfectly healthy, 999 got a positive slip anyway and 98,901 were correctly cleared.

Your slip says positive. So the room you belong to is the first column, and only the first column.

=== step === concept

## How do you write that down?

Nobody wants to keep writing "the share of the people in the positive queue who actually have the condition", so statisticians shortened it to this:

\[ P(A \mid B) \]

Say it out loud as "the probability of A, given B". That vertical bar is not doing anything clever. It is just the word "given".

Two jobs, and they are not interchangeable:

- **B is the group you are standing in.** It is the thing you already know is true. Here, B is "the slip says positive".
- **A is the thing you want to know about yourself.** Here, A is "I have the condition".

So your question, written down, is \(P(\text{has it} \mid \text{test} +)\). Both pieces are sitting in the table already.

```r
in_the_positive_queue <- sum(town[, "test +"])   # B: everyone whose slip says positive
in_the_positive_queue
#> [1] 1098

sick_and_in_the_queue <- town["has it", "test +"]   # A and B together
sick_and_in_the_queue
#> [1] 99
```

One thousand and ninety eight people walked out of that tent holding the same slip you are holding. Ninety nine of them have the condition.

You can probably already feel where this is going.

=== step === quiz

## Which probability does your slip actually ask for?

You are outside the tent with a positive result in your hand and one question on your mind: how worried should I be?

Four quantities are floating around this problem. Only one of them answers that question.

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- P(test says positive, given you have the condition)
- P(you have the condition, given the test says positive) ::ok Exactly. You already know B, that the slip says positive. A, whether you have the condition, is the unknown. So you want the share of the positive queue that is genuinely sick.
- P(you have the condition)
- P(the test gives the right answer) ::no Every one of these is a real number in this problem, but only one is a share of the group you are actually standing in. You already know your slip says positive, so that is your B. What you do not know is whether you have the condition, so that is your A. Anything conditioned the other way round, or not conditioned at all, is answering somebody else's question.

=== step === concept

## Who is actually standing in the positive queue?

Now put the counts back into the picture and look at what happened.

::widget tree-diagram {"root": "100,000 tested", "l": "100 have it", "r": "99,900 do not", "leaves": ["99 test +", "1 test -", "999 test +", "98,901 test -"]}

Follow the left side first. Of the 100 people who have the condition, the test catches 99 and misses 1. That is the test doing its job well.

Now follow the right side, because this is where the puzzle lives. Of the 99,900 healthy people, the test correctly clears 98,901 of them. But it wrongly alarms 999.

Sit with that number for a second. Nine hundred and ninety nine perfectly healthy people were handed the same slip you are holding. They walked out of the same tent, just as frightened as you are, and there is nothing wrong with any of them.

Hold those two numbers side by side. The test found 99 of the sick people, and it flagged 999 of the healthy ones. Both of those came out of the same test, the one that is right 99 times in 100, and it is worth a moment working out how before you read on.

So the queue at the follow-up desk is roughly ten frightened healthy people for every one genuinely sick person the test found.

=== step === concept

## So how worried should you be?

Everything is on the table now. You are one of the people in that first column, and you want to know what share of that column is genuinely ill.

```r
positive_slips <- sum(town[, "test +"])
positive_slips
#> [1] 1098

chance_you_are_sick <- town["has it", "test +"] / positive_slips
round(chance_you_are_sick, 4)
#> [1] 0.0902
```

Nine percent.

Not the 99% you were braced for. Out of every 100 people standing where you are standing, about 9 have the condition and about 91 are completely fine and will find that out at the follow-up appointment.

That is not a reason to ignore the slip. Nine percent is roughly ninety times your starting risk of 0.1%, so of course you go back for a second test. It is a reason not to spend tonight assuming the worst.

=== step === quiz

## Why do the false positives win?

The test gets 99 out of every 100 calls right, and yet nine tenths of the people it flags are healthy. Both of those are true at the same time.

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- The test is simply a bad test.
- Because 1% of a very large healthy group is more people than 99% of a very small sick group. ::ok That is it. 1% of 99,900 is 999 people; 99% of 100 is 99 people. The error rate is small, but it is charged against a group a thousand times bigger.
- Because 1% is a rounding error and can be ignored.
- Because the 99% and the 1% cancel each other out. ::no The two percentages are not applied to the same group, so they cannot be compared, cancelled or ignored. The 99% is charged against the 100 people who have the condition. The 1% is charged against the 99,900 who do not. What ends up in the queue is 99 people from one group and 999 from the other, and the size of those two groups is what decides the answer.

=== step === concept

## Is there a formula, and does it say the same thing?

You have done the whole calculation without a formula. Now here is the formula, so that when you meet it in a textbook you recognise it as something you already know how to do:

\[ P(A \mid B) = \frac{P(A \text{ and } B)}{P(B)} \]

In words: take the people who are both A and B, and divide by everybody who is B. The top is the sliver of the room you care about. The bottom is the room that is left after the condition threw everyone else out.

That is exactly the division you just did, only written as shares of the town instead of head counts.

```r
p_sick_and_positive <- town["has it", "test +"] / n_people   # A and B
p_positive          <- sum(town[, "test +"]) / n_people      # B

c(p_sick_and_positive = p_sick_and_positive, p_positive = p_positive)
#> p_sick_and_positive          p_positive
#>             0.00099             0.01098

p_sick_and_positive / p_positive
#> [1] 0.09016393
```

Same 9%. Dividing 99 by 1,098 and dividing 0.00099 by 0.01098 are the same sum, because the 100,000 cancels top and bottom. The formula is not a second method. It is the counting you already did, written short.

Since we are going to change the numbers a few times, let us wrap the whole thing in one small function.

```r
chance_given_positive <- function(prevalence, sensitivity, specificity) {
  sick_and_positive    <- prevalence * sensitivity
  healthy_and_positive <- (1 - prevalence) * (1 - specificity)
  sick_and_positive / (sick_and_positive + healthy_and_positive)
}

chance_given_positive(0.001, 0.99, 0.99)
#> [1] 0.09016393
```

=== step === tryit

## What if the condition were ten times commoner?

Keep the exact same test, with its 99% both ways. Change only how common the condition is: instead of 1 person in 1,000, make it 1 person in 100.

Before you run it, guess. Ten times more sick people in the town, so does the answer go up roughly ten times too, to about 90%?

Edit the prevalence in the line below from 0.001 to 0.01 and press Check.

```r
round(chance_given_positive(0.001, 0.99, 0.99), 4)
```

::check {"regex": "chance_given_positive\\s*[(]\\s*0\\.01\\s*,", "gate": true, "difficulty": "beginner", "ok": "Right. It lands on exactly 0.5. Ten times commoner, and the answer went from 9% to a coin flip.", "no": "Change only the first number inside the brackets, the prevalence, from 0.001 to 0.01. Leave the two 0.99s alone, because the test itself has not changed."}

::solution

```r
round(chance_given_positive(0.01, 0.99, 0.99), 4)
#> [1] 0.5
```

Exactly 0.5. Out of 100,000 people there are now 1,000 sick ones, of whom the test catches 990, and 99,000 healthy ones, of whom it wrongly alarms 990. Nine hundred and ninety against nine hundred and ninety. A positive slip has become a pure coin flip.

Nothing about the test changed. Only the crowd it was pointed at.

=== step === concept

## What happens if you turn the bar around?

Both of these are true about the same test on the same day, and they are the two readings you separated right at the start:

```r
p_positive_given_sick <- town["has it", "test +"] / sum(town["has it", ])
p_sick_given_positive <- town["has it", "test +"] / sum(town[, "test +"])

cat("P(test positive given you have it) =", round(p_positive_given_sick, 4), "\n")
#> P(test positive given you have it) = 0.99
cat("P(you have it given test positive) =", round(p_sick_given_positive, 4), "\n")
#> P(you have it given test positive) = 0.0902
```

Same table, same 99 people on top, and the answers are 99% and 9%.

The only thing that changed is what sits underneath. In the first line we divided by the 100 people who have the condition. In the second we divided by the 1,098 people in the positive queue. Different group underneath, different answer.

Swapping the two sides of the bar is the most common mistake in all of statistics. It has a name, the confusion of the inverse, and the name is worth knowing because you will catch yourself doing it.

=== step === quiz

## Which sentence has flipped the conditional?

All four sentences below are about the screening programme you have been counting. Three of them are true. One has quietly swapped the two groups around.

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Of the people who have the condition, 99 in 100 will test positive.
- Of the people who test positive, 99 in 100 have the condition. ::ok Caught it. That sentence takes the 99%, which is measured on the 100 people who have the condition, and quietly re-applies it to the 1,098 people in the positive queue. The true figure for that queue is about 9 in 100.
- Of the people who do not have the condition, 1 in 100 will still test positive.
- Of the people who test positive, about 9 in 100 have the condition. ::no Read each sentence as "of the people who are X, what share are Y", then check the group X against the table. Three of these describe a group you can point at in the counts and a share that really does match it. One takes a share measured on one group and pins it on a completely different group.

=== step === concept

## What does a negative result tell you?

We have been hard on this test. So let us give it a fair hearing and ask the other question: what if your slip had said negative?

```r
negative_slips <- sum(town[, "test -"])
negative_slips
#> [1] 98902

town["does not", "test -"]
#> [1] 98901

p_clear_given_negative <- town["does not", "test -"] / negative_slips
round(p_clear_given_negative * 100, 3)
#> [1] 99.999
```

Of the 98,902 people who got a negative slip, 98,901 are genuinely healthy. Exactly one person in that whole crowd was missed.

So a negative result here is very close to a guarantee, at 99.999%.

[NOTE]
This is the honest verdict on the test. It is not a bad test at all. It is a lopsided one. It is superb at ruling the condition out and poor at ruling it in, and that is exactly what you want from a first round screen: catch nearly everybody, then send the small flagged group on for something slower and more accurate.

=== step === concept

## What is really driving the answer?

Something in the try-it should be nagging at you. The test never changed. Its 99% and its 1% stayed exactly where they were. Yet the answer moved from 9% to 50%.

So the answer was never really a property of the test. It was mostly a property of the crowd the test was pointed at, and that starting rate has a name: the base rate.

Let us watch it move. Hold the test fixed and slide the base rate from very rare to fairly common.

```r
prevalence_grid <- seq(0.0001, 0.2, length.out = 400)
posterior_curve <- chance_given_positive(prevalence_grid, 0.99, 0.99)

plot(prevalence_grid, posterior_curve, type = "l", lwd = 2, col = "#2563a8",
     xlab = "how common the condition is",
     ylab = "chance you have it, given a positive slip",
     main = "One fixed 99% test, pointed at different crowds")
abline(h = 0.5, lty = 2, col = "#677084")
abline(v = 0.01, lty = 2, col = "#b5631a")
```

The line climbs steeply out of the bottom left corner and then flattens off near the top. Where it crosses the halfway mark is worth remembering: that happens at a base rate of exactly 1%, which is this test's own false alarm rate.

That gives you a rule of thumb for tests built like this one. If the condition is rarer than the test's false alarm rate, a positive slip is more likely to be a false alarm than a real finding. Rarer than 1% here means most positives are noise. Commoner than 1% means most positives are real.

=== step === concept

## When does knowing B change nothing at all?

One more question to finish the idea off. Everything so far has been about a condition that moves the answer a lot. What about one that moves it not at all?

Suppose we also note down the day of the week each person was tested. That day was decided by which morning they happened to be free, and a person's body knows nothing about the camp timetable. So knowing somebody was tested on a Monday should tell us precisely nothing about whether they are ill.

```r
set.seed(11)
person_has_it <- c(rep(TRUE, 100), rep(FALSE, 99900))
test_day <- sample(c("Mon", "Tue", "Wed", "Thu", "Fri"), 100000, replace = TRUE)

# how many in every 1,000, across everybody
round(mean(person_has_it) * 1000, 2)
#> [1] 1

# how many in every 1,000, day by day
round(tapply(person_has_it, test_day, mean) * 1000, 2)
#>  Fri  Mon  Thu  Tue  Wed
#> 1.00 0.99 1.11 0.80 1.10
```

One in a thousand overall, and about one in a thousand on every single day. The days wobble a little, because only 100 sick people are being split five ways and small counts are jumpy, but they wobble around the same place rather than moving to a new one.

When knowing B leaves the answer where it already was, so that \(P(A \mid B) = P(A)\), we say A and B are **independent**. The day of your test is independent of your health. Your test result is emphatically not: it dragged the answer from 1 in 1,000 up to 90 in 1,000.

That contrast is the whole point of conditioning. Some facts are worth knowing and some are not, and this is how you tell which is which.

=== step === tryit

## The second test is positive too. Now what?

You go back for a second test. It is a genuinely fresh test, not a rerun of the same sample, and it is just as accurate: 99% both ways.

It also comes back positive.

Here is the move that makes this easy. You are no longer a random person off the street with a 1-in-1,000 risk. You are a person who has already tested positive once, so your starting rate going into the second test is 9%, not 0.1%. Today's answer becomes tomorrow's base rate.

Feed first_answer in where the prevalence used to be, then press Check.

```r
first_answer <- chance_given_positive(0.001, 0.99, 0.99)
round(first_answer, 4)
#> [1] 0.0902

round(chance_given_positive(0.001, 0.99, 0.99), 4)
```

::check {"regex": "chance_given_positive\\s*[(]\\s*first_answer\\s*,", "gate": true, "difficulty": "intermediate", "ok": "That is it. 0.9075, so about 91%. Two positives on a 99% test take you from 0.1% to 9% to 91%.", "no": "In the last line, replace the prevalence 0.001 with first_answer, and leave the two 0.99s alone. You are pointing the same test at a new crowd: people who have already tested positive once."}

::solution

```r
first_answer <- chance_given_positive(0.001, 0.99, 0.99)
round(chance_given_positive(first_answer, 0.99, 0.99), 4)
#> [1] 0.9075
```

About 91%. Now the slip means what you originally feared it meant.

Notice that nothing mystical happened. The second test was pointed at a crowd where roughly 9 in 100 are genuinely ill instead of 1 in 1,000, and against that crowd its 1% false alarm rate can no longer drown out the true positives. Stacking one result on top of another like this is the engine underneath every Bayesian method you will ever use.

=== step === concept

## References

Everything above is arithmetic you can check yourself. If you want to read further, these are the sources worth your time.

- Gigerenzer, G. and Hoffrage, U. (1995). [How to improve Bayesian reasoning without instruction: frequency formats](https://doi.org/10.1037/0033-295X.102.4.684). *Psychological Review*, 102(4). The experiments showing that counting people, exactly as we did here, beats teaching the formula.
- Diez, D., Cetinkaya-Rundel, M. and Barr, C. [OpenIntro Statistics](https://www.openintro.org/book/os/), chapter 3. Conditional probability and tree diagrams, free and beginner friendly.
- Pishro-Nik, H. [Introduction to Probability, Statistics and Random Processes](https://www.probabilitycourse.com/chapter1/1_4_0_conditional_probability.php), section 1.4. The formal definition with many worked examples.
- Elmore, J. et al. (1998). [Ten-year risk of false positive screening mammograms](https://doi.org/10.1056/NEJM199804163381601). *New England Journal of Medicine*, 338(16). The same arithmetic measured in a real screening programme rather than a made-up one.

=== step === complete

## You can now read any test result

You came in with a slip that looked like a death sentence and you leave knowing it means about a 9% chance, because you counted the people instead of trusting the percentage.

Three moves get you there every time.

1. **Name the queue.** Write down what you already know. That is B, the group you are standing in.
2. **Count who is in it.** Build the whole crowd, sort it into the four groups, and see how many of each kind ended up in your queue.
3. **Take the share.** Divide the people who are both A and B by everybody in B. That is P(A given B).

Those same three moves are running inside a spam filter deciding whether the word "invoice" means you have been hacked, a bank deciding whether your card was stolen, and every Bayesian model that updates a belief when fresh evidence turns up. All of them are asking what share of the flagged group is genuinely guilty.

And keep the base rate lesson close. When somebody quotes you an accuracy figure, the first question is never how accurate. It is: accurate on whom, and how common is the thing in the crowd you are pointing it at.

Next time we put a single number on what a random thing is worth, and on how much it wobbles: expected value and variance.
