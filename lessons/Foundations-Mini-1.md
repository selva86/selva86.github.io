---
title: "Conditional probability: P(A given B), made concrete"
slug: "Foundations-Mini-1"
description: "A 99% accurate test for a 1-in-1,000 disease comes back positive. Count the town those numbers describe and see why your real chance of being sick is 9%."
keywords: "conditional probability, P(A given B), base rate, false positives, sensitivity and specificity, screening test probability, independence, conditional probability in R"
mathjax: true
webr: true
date: "2026-08-24"
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
catalog_blurb: "Why a positive test result often still means you are probably fine."
---

=== step === cover
::eyebrow Probability Foundations
## Conditional probability: P(A given B), made concrete

Let's start with a puzzle, because it is one of the best in all of statistics.

A disease affects 1 person in 1,000. The test for it is 99% accurate. You take the test, and your result comes back positive.

How worried should you be?

Most people say very worried. When a version of this question was put to sixty doctors and medical students at the Harvard Medical School teaching hospitals, the most common answer by far was 95%. Only eleven of the sixty got it right.

The real answer is that your chance of having the disease is still under 10%.

That is not a trick, and the test is not secretly a bad one. It is 99% accurate exactly as advertised. The catch is that in any 1,000 people there is only one sick person to find, while the healthy people the test gets wrong are drawn from a very large crowd.

Everything in that sentence is conditional probability, and we are going to work the number out ourselves rather than take it on faith. There are three moves, and every one of them is counting.

::widget process-flow {"steps":[{"title":"Build the town","sub":"100,000 people, 100 of them sick, and everyone tested"},{"title":"Keep only the positives","sub":"delete every person whose test came back negative"},{"title":"Count what is left","sub":"what share of the people still standing are sick"}]}

Do that and you have the number, the formula behind it, and a sentence you can say out loud to anyone who ever hands you a test result.

=== step === concept
## The screening test, written out as 100,000 people

Before we count anything, we have to be straight about what "99% accurate" really means, because it is not one promise. It is two, and they are made to two different groups of people.

The first promise is about sick people. Of every 100 people who do have the disease, 99 of them test positive. That rate is called **sensitivity**, and here it is 0.99.

The second promise is about healthy people. Of every 100 people who do not have the disease, 99 of them test negative. That one is called **specificity**, and here it is also 0.99.

Both land on 99%, which is why the two get squashed together into the single word "accurate". However, sensitivity is applied to a tiny group and specificity to an enormous one, and the whole surprise comes out of that one difference.

So rather than juggle percentages, let's make them countable. We build a town of 100,000 people, where 1 in every 1,000 is sick, and we test all of them. Press Run.

```r
# Build a town of 100,000 people, test every one of them, and count the results
prev <- 0.001   # 1 person in 1,000 has the disease
sens <- 0.99    # 99 of every 100 sick people test positive
spec <- 0.99    # 99 of every 100 healthy people test negative

screening <- data.frame(
  disease = rep(c("sick", "healthy"), c(100, 99900)),
  test    = c(rep(c("positive", "negative"), c(99, 1)),        # the 100 sick people
              rep(c("positive", "negative"), c(999, 98901)))   # the 99,900 healthy people
)

table(disease = screening$disease, test = screening$test)
#>          test
#> disease   negative positive
#>   healthy    98901      999
#>   sick           1       99
```

`rep(c("sick", "healthy"), c(100, 99900))` stamps out the word "sick" a hundred times and then "healthy" 99,900 times, which is 1 in 1,000 written as people instead of as a decimal.

Now read the four numbers slowly, because everything else here comes out of them.

- 99 sick people tested positive. The test caught them.
- 1 sick person tested negative. The test missed that one.
- 999 healthy people tested positive. There is nothing wrong with any of them.
- 98,901 healthy people tested negative and can go home.

Both promises were kept to the letter. 99 of the 100 sick people were caught, and 98,901 of the 99,900 healthy people were correctly cleared. Yet look down the positive column: 999 of those results belong to people who are perfectly fine.

=== step === concept
## What the word "given" does to the question

Here is your situation. You do not know whether you are sick, and you are not one of 100,000 people any more. You are one of the people whose test came back positive, and that result is the only thing you know.

Conditional probability is the tool built for exactly that: a probability worked out after you have been told something.

The word "given" is really an instruction, and a blunt one. Throw away every row where the given thing did not happen, then ask your question of whatever is left.

So let's throw them away. Everybody whose test came back negative walks out of the room.

```r
# Keep only the people who tested positive, then see how many of them are sick
positives <- screening[screening$test == "positive", ]

nrow(positives)                     # how many people are left in the room
#> [1] 1098

sum(positives$disease == "sick")    # of those, how many actually have the disease
#> [1] 99

mean(positives$disease == "sick")   # that count as a share of the room
#> [1] 0.09016393
```

1,098 people got a positive result, and 99 of them have the disease. That is 0.0902, or about 9%, which is the answer to the puzzle and the number almost nobody guesses.

Notice what moved and what did not. The 99 sick people holding a positive result are the same 99 they always were, and no arithmetic touched them. What changed is the crowd they are being measured against: 100,000 people before you knew your result, 1,098 people after.

[KEY INSIGHT]
Conditioning does not change what happened. It changes the denominator. You delete every row where the given event did not occur, then take the share of what survives.

=== step === quiz
## Quick check: what does "given a positive result" change?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- It changes how many people in the town have the disease, because a positive result is evidence that somebody is sick. ::no
- It changes who gets counted. The 99 sick people with a positive result stay exactly as they were, but the group they are divided by drops from 100,000 to 1,098. ::ok That is the whole move. Conditioning is a deletion followed by a division, and here the deletion took 98,902 people out of the denominator and nothing at all out of the numerator.
- It makes the test more accurate, because we now know something about the person that we did not know before. ::no
- It changes nothing at all, since the test was 99% accurate before you took it and it is still 99% accurate now. ::no Conditioning never edits the data. It removes rows. Everybody who tested negative leaves, so the same 99 sick positives are now measured against 1,098 people instead of 100,000, and that is what lifts the answer from 1 in 1,000 to about 1 in 11.

=== step === concept
## P(A given B), written as a formula

You have just computed something worth naming. In notation it is written P(A | B), with a vertical bar in the middle, and it is read out loud as "the probability of A given B".

For us, A is "this person is sick" and B is "this person tested positive", so the thing you want is P(sick | positive).

There is a formula behind the counting, and it is nothing more than those same two numbers written as probabilities instead of head counts:

\[ P(A \mid B) = \frac{P(A \text{ and } B)}{P(B)} \]

The top is the probability that both things are true, sick and positive, which was 99 people out of the 100,000. The bottom is the probability of the thing you were told, positive, which was 1,098 out of the 100,000. Dividing one by the other cancels the size of the town and leaves the share you are after.

```r
# Compute the same answer from the two probabilities the formula asks for
p_sick_and_positive <- mean(screening$disease == "sick" & screening$test == "positive")
p_positive          <- mean(screening$test == "positive")

c(p_sick_and_positive   = p_sick_and_positive,
  p_positive            = p_positive,
  p_sick_given_positive = p_sick_and_positive / p_positive)
#>   p_sick_and_positive            p_positive p_sick_given_positive
#>            0.00099000            0.01098000            0.09016393
```

0.00099 divided by 0.01098 gives 0.09016393, which is what the counting gave, down to the last digit. It has to be, because it is the same division: 99/100,000 over 1,098/100,000 is just 99/1,098 with the 100,000s cancelled.

That top term has a name of its own. P(A and B) is the **joint probability**, which is the chance of landing in one particular cell of the table you built. The bar then cuts that cell down by the chance of the condition.

[NOTE]
The formula needs P(B) to be bigger than zero. You cannot condition on something that never happens, because there would be no rows left to take a share of.

=== step === tryit
## Your turn: what is P(healthy given a negative result)?

We asked what a positive result means. Now ask the opposite question, because this same test answers it very differently.

`screening` still holds all 100,000 people, one row each, with a `disease` column and a `test` column. Keep only the people whose test came back negative, and work out what share of them are free of the disease.

```r
# screening holds 100,000 people, one row each, with a disease column
# and a test column.
# Keep only the rows where the test came back negative, then take the
# share of those rows that belong to people without the disease.
# Two lines. Press Check when you have them.
```
::check {"regex": "(?=[\\s\\S]*==\\s*.negative)(?=[\\s\\S]*mean[(][^)]*healthy)", "gate": true, "difficulty": "beginner", "ok": "Right: 98,902 people tested negative and 98,901 of them are healthy, which is 0.9999899. The same test that is nearly useless when it says positive is nearly perfect when it says negative.", "no": "Filter first, then take the share. `negatives <- screening[screening$test == \"negative\", ]` on one line, then `mean(negatives$disease == \"healthy\")` on the next."}
::solution
```r
# Keep the people who tested negative and find the share of them who are healthy
negatives <- screening[screening$test == "negative", ]

nrow(negatives)
#> [1] 98902

mean(negatives$disease == "healthy")
#> [1] 0.9999899
```

One test, and two answers that could hardly be less alike. A positive result leaves you about 9% likely to be sick, while a negative result leaves you 99.999% likely to be fine.

=== step === concept
## P(positive given sick) is not P(sick given positive)

Swap the two events around the bar and you get a different question with a different answer. This is the mix-up at the heart of the whole puzzle, so let's take it slowly, with both numbers side by side.

P(positive | sick) reads: given that a person has the disease, how often does the test say positive? That is a fact about the test. It is the 99% printed on the box.

P(sick | positive) reads: given that a person's test said positive, how often is that person sick? That is a fact about the person holding the result. It is our 9%.

Both come out of the one table you already built, and the only difference is which way you divide it. `prop.table()` does both: pass it a 1 and every row turns into shares, pass it a 2 and every column does.

```r
# Read the same table two ways: along the rows, then down the columns
counts <- table(disease = screening$disease, test = screening$test)

round(prop.table(counts, 1), 4)   # each ROW sums to 1: P(test result given disease)
#>          test
#> disease   negative positive
#>   healthy     0.99     0.01
#>   sick        0.01     0.99

round(prop.table(counts, 2), 4)   # each COLUMN sums to 1: P(disease given test result)
#>          test
#> disease   negative positive
#>   healthy   1.0000   0.9098
#>   sick      0.0000   0.0902
```

In the first table, run your eye along the `sick` row: 0.99 of sick people test positive. That is the manufacturer's promise, kept exactly.

In the second table, run your eye down the `positive` column: 0.0902 of the people holding a positive result are sick, and 0.9098 of them are not. It is the same 99 people in the same cell of the same table, divided by a different total.

So the 99% and the 9% are not in competition, and neither of them is wrong. They answer questions that point in opposite directions.

[KEY INSIGHT]
A lab can only measure P(positive | sick), because that is what testing a test means: you take people whose status you already know and see what the machine says. What you want to know is P(sick | positive). Those two are free to be as far apart as 0.99 and 0.09.

=== step === quiz
## Quick check: which of the two numbers is the 99%?

A friend reads the box, sees that the test is 99% accurate, and tells you her positive result makes her 99% likely to be sick. Which quantity is the 99% on that box?

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- P(positive | sick): of the people who have the disease, 99% get a positive result. ::ok Exactly. That figure is measured on people already known to be sick, so it describes the test and not your friend. Pointed the other way, her answer is about 9%.
- P(sick | positive): of the people who get a positive result, 99% have the disease. ::no
- P(sick and positive): 99% of everyone who walks in is both sick and positive. ::no
- Both of them, because P(positive | sick) and P(sick | positive) are two ways of writing the same probability. ::no The 99% comes from running the test on people whose disease status was already known, which makes it P(positive | sick). Swapping the two events around the bar asks a completely different question, and in this town the two answers are 0.99 one way and 0.09 the other.

=== step === concept
## Why ten healthy people are frightened for every sick one found

We have the 9%, but a number you cannot feel is a number you will soon forget. So let's watch where it gets made, drawn as the two questions the town is asked, one after the other.

::widget tree-diagram {"root":"Has the disease?","l":"Tests positive?","r":"Tests positive?","leaves":["99 found","1 missed","999 alarms","98,901 ok"]}

Start at the top with all 100,000 people. The first split is the disease itself, which sends 100 people down the left branch and 99,900 down the right. The second split is the test, applied to both groups with the same 99% accuracy.

Down the left branch, the test takes 99% of a very small group, and 99 people are correctly caught.

Down the right branch, it takes 1% of a very large group, and 999 people are wrongly alarmed.

That is the whole trick, and it is plain arithmetic. 1% of 99,900 is simply a bigger number than 99% of 100, and a positive result on its own cannot tell you which branch you came down.

```r
# Compare the two piles of positive results this town produces
false_alarms <- sum(screening$disease == "healthy" & screening$test == "positive")
true_catches <- sum(screening$disease == "sick"    & screening$test == "positive")

c(false_alarms = false_alarms, true_catches = true_catches)
#> false_alarms true_catches
#>          999           99

round(false_alarms / true_catches, 1)   # healthy people scared per sick person found
#> [1] 10.1
```

Ten healthy people get a frightening letter for every one person the test genuinely finds. Say that out loud and the 9% stops being a surprise, because ten scares for every catch is the same thing as one catch in every eleven letters.

=== step === concept
## Getting the same answer from the percentages alone

Building a whole town works, but nobody is going to hand you one. In real life you get three percentages: how common the disease is, and the test's two accuracy rates. So let's reach 9% from those alone.

Two rules do it. The first is the formula from a moment ago, rearranged, and the second is a careful way of adding.

Start with the **multiplication rule**. Multiply the formula through by P(B) and you get a way to fill in a cell of the table directly:

\[ P(A \text{ and } B) = P(B \mid A) \times P(A) \]

In words, a cell is its rate times the size of the group it came out of. Sick and positive is 0.99 times 0.001. Healthy and positive is 0.01 times 0.999.

The second is the **law of total probability**. There are exactly two ways to end up holding a positive result, being sick and testing positive or being healthy and testing positive, and since nobody can do both, P(positive) is the two of them added together.

```r
# Rebuild both positive cells from the three percentages, then divide
prev <- 0.001   # how common the disease is
sens <- 0.99    # P(positive given sick)
spec <- 0.99    # P(negative given healthy)

p_sick_and_pos    <- sens * prev              # P(positive given sick) times P(sick)
p_healthy_and_pos <- (1 - spec) * (1 - prev)  # P(positive given healthy) times P(healthy)
p_pos             <- p_sick_and_pos + p_healthy_and_pos

c(sick_and_pos    = p_sick_and_pos,
  healthy_and_pos = p_healthy_and_pos,
  positive        = p_pos,
  sick_given_pos  = p_sick_and_pos / p_pos)
#>    sick_and_pos healthy_and_pos        positive  sick_given_pos
#>      0.00099000      0.00999000      0.01098000      0.09016393
```

That is the same 0.09016393, with no town anywhere in it.

Before the division, look hard at the two joint probabilities, because they carry the whole story in two numbers: 0.00099 against 0.00999. The healthy-and-positive pile is ten times the sick-and-positive pile, which is the 999 against 99 you counted, written as probabilities.

=== step === concept
## What happens when the disease is common

If that 9% came from the test being weak, no test would ever be worth taking. So let's hold the test perfectly still at 99% and 99%, and move one thing only: how common the disease is among the people being tested.

```r
# Work out the answer for any prevalence, with the test held at 99% and 99%
posterior <- function(prevalence, sensitivity = 0.99, specificity = 0.99) {
  sick_and_pos    <- sensitivity * prevalence
  healthy_and_pos <- (1 - specificity) * (1 - prevalence)
  sick_and_pos / (sick_and_pos + healthy_and_pos)
}

data.frame(
  one_person_in       = c(1000, 100, 20, 5),
  chance_sick_percent = round(100 * posterior(c(1/1000, 1/100, 1/20, 1/5)), 1)
)
#>   one_person_in chance_sick_percent
#> 1          1000                 9.0
#> 2           100                50.0
#> 3            20                83.9
#> 4             5                96.1
```

Read down the second column, remembering that the test never changed. It goes 9.0%, then 50.0%, then 83.9%, then 96.1%.

The same positive result from the same machine is worth a coin flip when 1 person in 100 is sick, and it is close to a verdict when 1 in 5 is. Nothing about the test moved. Only the crowd it was pointed at changed.

That quantity has a name. How common the disease is among the people being tested is the **base rate**, also called the **prevalence**. Let's see it as a full curve instead of four rows.

```r
# Draw the answer across every base rate from very rare to fairly common
prevalence_grid <- seq(0.0005, 0.2, length.out = 300)

plot(100 * prevalence_grid, 100 * posterior(prevalence_grid), type = "l", lwd = 3,
     col = "steelblue",
     main = "One 99% accurate test, read at different base rates",
     xlab = "Share of people who have the disease (%)",
     ylab = "Chance of being sick after a positive result (%)")
abline(v = 0.1, col = "red", lwd = 2)
```

The red line marks our town at 1 person in 1,000, sitting far to the left where the curve is still down on the floor. Move a short way to the right and the answer climbs steeply. That is why one machine means one thing when a whole population is screened, and something else entirely in a clinic where everybody arrives with symptoms.

=== step === quiz
## Quick check: what makes the 9% so low?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- The test is not really 99% accurate. An answer that low means something is wrong with the machine. ::no
- Nothing does. 9% is a rounding artefact of using 100,000 people instead of working with the exact percentages. ::no
- The base rate does. Only 1 person in 1,000 is sick, so the healthy group is large enough that its 1% of mistakes outnumbers the sick group's 99% of catches. ::ok Yes. Hold the test at 99% and move the base rate to 1 in 100, and the very same positive result is worth 50%. The thing that changed was never the test.
- The 1% of sick people the test misses. Those missed cases are what drag the answer down. ::no The test performed exactly as promised in every one of those towns, and the exact percentages give 0.09016393 as well, so neither the machine nor the rounding is responsible. What moves the answer is the base rate: 1 in 1,000 gives 9%, and 1 in 20 gives 84%, out of the same machine.

=== step === concept
## Independence: when knowing B changes nothing

Everything so far has been about a B that moves the answer. Being told you tested positive took your chance of being sick from 1 in 1,000 up to about 1 in 11, which is a lot of movement for one word.

Now let's look at the opposite case, because it has a name you will run into everywhere.

Suppose the clinic's machine breaks and starts handing out results without looking at the patient at all: positive, negative, positive, negative, straight down the queue. It still produces plenty of positive results. Let's condition on one of them and see what happens.

```r
# Add a sham test that ignores the patient and just alternates its answer
screening$sham <- rep(c("positive", "negative"), 50000)

sham_positives <- screening[screening$sham == "positive", ]

c(p_sick                     = mean(screening$disease == "sick"),
  p_sick_given_sham_positive = mean(sham_positives$disease == "sick"))
#>                     p_sick p_sick_given_sham_positive
#>                      0.001                      0.001
```

It reads 0.001 before the sham result and 0.001 after it. The conditioning ran exactly as it did before, 50,000 rows were deleted, and the answer did not budge.

When P(A | B) comes out equal to P(A), the two events are called **independent**, meaning that knowing B happened tells you nothing at all about A. And since P(A | B) is P(A and B) over P(B), independence can be written the other way round too, which is the form you will usually see:

\[ P(A \text{ and } B) = P(A) \times P(B) \]

Both halves of that hold in this town. 50 people are both sick and sham positive, and multiplying the two probabilities on their own predicts the same 50.

```r
# Check independence the other way round: the joint count against the product
sum(screening$disease == "sick" & screening$sham == "positive")
#> [1] 50

100000 * mean(screening$disease == "sick") * mean(screening$sham == "positive")
#> [1] 50
```

The real test is not independent of the disease, and that is the entire reason it is worth taking. A test earns its keep exactly when conditioning on its result moves the probability, and the further the probability moves, the more the result was worth.

=== step === quiz
## Quick check: which pair of events is independent?

::quiz {"correct": 4, "gate": true, "difficulty": "intermediate"}
- Having the disease and getting a positive result from the real test. Only 100 people in the town are sick, and events that rare barely interact. ::no
- Having the disease and not having the disease. Nobody can be both, so neither one can influence the other. ::no
- Getting a positive result and getting a negative result from the real test. No single person gets both, so the two are unrelated. ::no Two events that cannot happen together are the opposite of independent: learning that one happened tells you for certain that the other did not. Independence means the probability does not move at all when you condition on it, which is what the sham test does and what the real test very much does not.
- Having the disease and getting a positive result from the sham test. P(sick given a sham positive) is 0.001, and P(sick) on its own is also 0.001. ::ok Right. Independence is not about being rare and it is not about being unable to happen together. It is the conditioning leaving the probability exactly where it already was.

=== step === tryit
## Practice: what share of positive results are false alarms?

Now put it to work. `positives` still holds the 1,098 people in the town whose test came back positive, with the same `disease` column as before.

Work out the share of that group who do not have the disease. It is the headline number seen from the other side.

```r
# positives holds the 1,098 people whose test came back positive.
# Work out what share of them do not carry the disease at all.
# One line. Press Check when you have it.
```
::check {"regex": "positives[$]disease\\s*==\\s*.healthy", "gate": true, "difficulty": "intermediate", "ok": "Right: 0.9098. More than nine in every ten positive results in this town are false alarms, which is the 9% you already had, stated from the other end.", "no": "The same move as before, on the group you already have: `mean(positives$disease == \"healthy\")`. Your answer and the 0.0902 must add to 1."}
::solution
```r
# Find the share of the positive results that belong to healthy people
mean(positives$disease == "healthy")
#> [1] 0.9098361
```

0.9098 and 0.0902 add to exactly 1, because everyone left in that room is either sick or healthy and the conditioning kept every one of them.

=== step === quiz
## Practice: reading a positive result out loud

Your result is positive, the disease affects 1 person in 1,000, and the test is right 99% of the time in both directions. Which sentence states what you now know?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- There is a 99% chance I have the disease, because the test is 99% accurate. ::no
- There is a 1% chance I have the disease, because 1% is how often this test gets things wrong. ::no
- About 9 in every 100 people holding a positive result like mine have the disease, because a positive result is ten times more likely to come out of the huge healthy group than out of the tiny sick one. ::ok That is the sentence. It says which group it is talking about, it carries the base rate, and it lands on the right number.
- There is a 90% chance I have the disease, because 9 in 100 is the rate of false alarms. ::no The 99% is P(positive given sick), a fact about the machine measured on people already known to be sick. What you want is P(sick given positive), and that needs the base rate as well. In a town where 1 person in 1,000 is sick it comes out at about 9%, which leaves the false alarm share at about 91%.

=== step === tryit
## Practice: the same test inside a high-risk clinic

This is the last one, and this time there is no town to count.

A specialist clinic only sees people who already have symptoms, so 1 person in 20 who walks through its door has the disease. The test is untouched: 99% sensitivity and 99% specificity.

Work out the chance that a person holding a positive result at this clinic is sick, starting from the two ways of getting a positive result.

```r
# In this clinic 1 person in 20 has the disease, and the test still catches
# 99 percent of sick people and clears 99 percent of healthy people.
# Build the two ways of getting a positive result, add them together, and
# divide the sick one by that total.
# Three lines. Press Check when you have them.
```
::check {"regex": "posterior\\s*[(]|(?=[\\s\\S]*(0[.]99|sens)\\s*[*])(?=[\\s\\S]*(0[.]05|1\\s*/\\s*20))", "gate": true, "difficulty": "intermediate", "ok": "Right: 0.8390. The same machine that was worth 9% out in the town is worth 84% here, because the people who walk through this particular door are fifty times more likely to be sick.", "no": "Two joint probabilities and one division: `0.99 * 0.05` for sick and positive, `0.01 * 0.95` for healthy and positive, then the first divided by the sum of both. The `posterior()` function you built does the same job in one call: `posterior(1/20)`."}
::solution
```r
# Compute the answer for a clinic where 1 person in 20 has the disease
sick_and_pos    <- 0.99 * 0.05
healthy_and_pos <- 0.01 * 0.95

sick_and_pos / (sick_and_pos + healthy_and_pos)
#> [1] 0.8389831
```

The test is the same and the 99% is the same, yet the answer moved from 9% to 84%, purely because of who was standing in the queue.

=== step === concept
## References

- [Interpretation of a Screening Test Result](https://doi.org/10.1056/NEJM197811022991808) - Casscells, Schoenberger and Graboys (1978), New England Journal of Medicine 299, 999-1001. The study that put this puzzle to sixty doctors and medical students and collected their answers.
- [How to Improve Bayesian Reasoning Without Instruction: Frequency Formats](https://doi.org/10.1037/0033-295X.102.4.684) - Gigerenzer and Hoffrage (1995), Psychological Review 102(4), 684-704. The evidence that counting people beats quoting percentages.
- [Probabilistic Reasoning in Clinical Medicine: Problems and Opportunities](https://doi.org/10.1017/CBO9780511809477.019) - Eddy (1982), chapter 18 of Kahneman, Slovic and Tversky, Judgment Under Uncertainty. The mammography version of the same base-rate error.
- [Introduction to Probability, second edition](http://probabilitybook.net/) - Blitzstein and Hwang, chapter 2. The standard textbook treatment of conditioning and independence.
- [proportions and prop.table](https://stat.ethz.ch/R-manual/R-devel/library/base/html/proportions.html) - R Core Team, the documentation for turning a table into row shares or column shares.

=== step === complete
## Quick recap

You took a puzzle that fools most of the people who meet it, doctors included, and settled it by counting 100,000 imaginary townspeople. Here is what you can take away.

- Conditioning is a deletion followed by a division. Given B, you delete every row where B did not happen and take the share of what is left. Yours was 99 sick people out of the 1,098 who tested positive, or 0.0902.
- The formula says the same thing in probabilities. P(A given B) is P(A and B) divided by P(B), and 0.00099 over 0.01098 gives the identical 0.09016393.
- Swapping the two events asks a different question. P(positive given sick) is 0.99 and describes the test. P(sick given positive) is 0.09 and describes you.
- The base rate decides which of those two shocks you. Hold the test at 99% and move the base rate from 1 in 1,000 to 1 in 20, and a positive result goes from 9% to 84%.
- When conditioning moves nothing at all, so that P(A given B) equals P(A), the two events are independent. The sham test showed it: 0.001 before, 0.001 after.

So the next time a result comes back positive, the first question is not how accurate the test is. It is how many people like you actually have the thing being tested for.

That move, updating what you believe once new evidence arrives, is the engine underneath spam filters and medical screening, and it is what every piece of Bayesian work is built on.

Congratulations, you made it through. Have a great day!
