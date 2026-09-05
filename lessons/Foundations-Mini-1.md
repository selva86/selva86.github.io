---
title: "Conditional probability: P(A given B), made concrete"
slug: "Foundations-Mini-1"
description: "A disease that 1 in 1,000 people have, a test that is 99% accurate, one positive result. Count 100,000 people in R and see what P(A given B) really says."
keywords: "conditional probability, P(A given B), conditional probability in R, positive predictive value, base rate, sensitivity and specificity, false positives, Bayes rule"
mathjax: true
webr: true
date: "2026-09-05"
post_type: "LESSON"
course_id: "foundations-extras"
course_title: "Probability Foundations"
course_lesson: "1"
course_total: "6"
course_landing: "/dashboard.html"
course_prev: ""
course_next: "Foundations-Mini-2"
curriculum_id: "0.0.9"
lesson_access: "windowed"
catalog_blurb: "What a positive test result really means when the disease is rare."
---

=== step === cover
## Conditional probability: P(A given B), made concrete

Today let's work out what a positive test result actually tells you, and pick up conditional probability while we do it.

Here is the situation. A clinic screens people for a disease that 1 in 1,000 people have. The test it uses is right 99% of the time in both directions: 99 out of every 100 people who have the disease test positive, and 99 out of every 100 people who do not have it test negative.

A person is screened, and the test says positive. How likely is it that they have the disease?

Almost everybody says 99%, and that includes plenty of people who handle test results every day. Count the people and it comes out under 10%.

We are not going to take that on trust. We will build all 100,000 people, count them, and read the answer off the counts.

::widget process-flow {"steps":[{"title":"Build 100,000 people","sub":"turn the three rates into exact counts of people"},{"title":"Count every positive result","sub":"how many of the 100,000 test positive"},{"title":"Keep the positives and count the ill ones","sub":"the share of that group with the disease is the answer"}]}

Three counts in that order, and the third one answers the question.

=== step === concept
## Turning the three rates into 100,000 people

The situation gave us three rates, and each one has a name worth knowing.

The first is the **prevalence**, the share of people who have the disease before anybody is tested. Here it is 1 in 1,000, or 0.001.

The second is the **sensitivity**, the share of people who have the disease that the test picks up. Here it is 0.99.

The third is the **specificity**, the share of people who do not have the disease that the test clears. Here it is 0.99 as well, so 1% of healthy people get a positive result anyway.

Rates that small are hard to hold in your head. Counts of people are not. So let's take a population big enough to make every count a whole number, and write the three rates into it.

Out of 100,000 people, 100 have the disease and 99,900 do not. Of the 100 who have it, 99 test positive and 1 tests negative. Of the 99,900 who do not, 1% is 999 who test positive, leaving 98,901 who test negative.

Press Run to build them.

```r
# Build 100,000 screened people, one row per person, with disease status and test result
people <- data.frame(
  disease = rep(c("yes", "no"), c(100, 99900)),
  test    = c(rep(c("positive", "negative"), c(99, 1)),       # the 100 who have the disease
              rep(c("positive", "negative"), c(999, 98901)))  # the 99,900 who do not
)

nrow(people)
#> [1] 100000
sum(people$disease == "yes")
#> [1] 100
```

`rep()` repeats a value as many times as you ask, so `rep(c("yes", "no"), c(100, 99900))` writes "yes" 100 times and then "no" 99,900 times. There is no random draw anywhere in that block, which is why the counts come out exact.

`people` now holds 100,000 rows and two columns. Every row is one person, with whether they have the disease and what their test said.

[NOTE]
These are constructed numbers, picked so the arithmetic stays clean. A real screening programme measures its sensitivity and specificity from data, and reports both with a margin of error around them.

=== step === concept
## Where the 1,098 positive results come from

Put the two columns against each other and every one of the 100,000 people lands in one of four boxes.

```r
# Count the 100,000 people by disease status and test result
table(disease = people$disease, test = people$test)
#>        test
#> disease negative positive
#>     no     98901      999
#>     yes        1       99
```

Read the four counts one at a time. 99 people have the disease and tested positive, the results the test got right. 1 person has the disease and tested negative, a **false negative**. 999 people do not have the disease and tested positive anyway, the **false positives**. And 98,901 people do not have it and were correctly cleared.

Now add up the positive results: 99 plus 999 is 1,098 people who walked out with a positive test.

Only 99 of those 1,098 are correct. Look at where the 999 came from and it stops being surprising. The test is wrong about 1% of the time on healthy people, but there are 99,900 healthy people, and 1% of 99,900 is 999. It is right 99% of the time on ill people, and there are only 100 of those, so it can never produce more than 100 correct positives.

A small error rate applied to an enormous group beats a large success rate applied to a tiny one.

=== step === widget
## Conditioning: keeping only the people who tested positive

The question we started with is not about all 100,000 people. It is about one person whose result came back positive, which puts them in the group of 1,098.

That restriction is the whole idea. To answer a question about people who tested positive, you throw away every row where the test said negative, then count inside what is left. The four counts themselves never change. The group you count in does.

Here are the four counts as four rows, with the line of R that keeps only the positive ones.

::widget table-transform {"code":"subset(df, test == \"positive\")","caption":"Conditioning on a positive result keeps the two positive rows and drops the two negative ones. The counts inside the rows that stay are untouched.","before":{"cols":["disease","test","count"],"rows":[["yes","positive",99],["yes","negative",1],["no","positive",999],["no","negative",98901]]},"after":{"cols":["disease","test","count"],"rows":[["yes","positive",99],["no","positive",999]]}}

Two rows survive, 99 and 999. Press Show what changed and the two rows for negative results are struck out, which is exactly what conditioning does to them.

Now run the same restriction across all 100,000 rows and count what is left.

```r
# Keep only the people who tested positive, then count how many of them have the disease
positives <- subset(people, test == "positive")

nrow(positives)
#> [1] 1098
mean(positives$disease == "yes")
#> [1] 0.09016393
```

`subset()` keeps the rows where the condition is TRUE, so `positives` holds 1,098 people. `mean()` on a vector of TRUE and FALSE is the share that are TRUE, so `mean(positives$disease == "yes")` is the share of those 1,098 who have the disease.

That share is 0.09016, about 9%. So a person holding a positive result from this test has roughly a 1 in 11 chance of having the disease, not 99 in 100.

[KEY INSIGHT]
Conditioning does not change any count. It changes which people you divide by. Here it swapped a denominator of 100,000 for a denominator of 1,098, and that single swap is the whole calculation.

=== step === concept
## The formula for P(A given B), and where each piece comes from

What we just did has a name and a notation, and both are worth having.

Call A the event that the person has the disease, and call B the event that they tested positive. The quantity we computed is the **conditional probability** of A given B, written \(P(A \mid B)\) and said out loud as "the probability of A given B".

Its definition is one line.

\[ P(A \mid B) = \frac{P(A \text{ and } B)}{P(B)} \]

Both pieces on the right are shares of the full 100,000. \(P(A \text{ and } B)\), the **joint** probability because it asks for both things at once, is the share of everybody who has the disease **and** tested positive, which is 99 out of 100,000. \(P(B)\), the **marginal** probability because it ignores everything except the test result, is the share of everybody who tested positive, which is 1,098 out of 100,000. Let's compute both and divide.

```r
# Get the same answer from the joint and the marginal probability
p_joint    <- mean(people$disease == "yes" & people$test == "positive")
p_positive <- mean(people$test == "positive")

c(joint = p_joint, positive = p_positive, ratio = p_joint / p_positive)
#>      joint   positive      ratio
#> 0.00099000 0.01098000 0.09016393
```

`p_joint` is 0.00099 and `p_positive` is 0.01098, and their ratio is 0.09016. The same number the counting gave.

That agreement is not a coincidence. Dividing 0.00099 by 0.01098 is dividing 99/100,000 by 1,098/100,000, and the 100,000 cancels, leaving 99/1,098. The formula and the restriction are the same operation written two ways.

The definition also runs backwards, which is handy. Multiply both sides by \(P(B)\) and you get \(P(A \text{ and } B) = P(A \mid B) \times P(B)\): the chance of both things happening is the chance of B times the chance of A given B.

=== step === quiz
## Quick check: which group is the denominator?

You want the chance that a person has the disease, knowing their result came back positive. Which group goes on the bottom of that fraction?

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- All 100,000 people who were screened. ::no
- The 100 people who have the disease. ::no
- The 1,098 people whose result came back positive. ::ok Exactly. The condition names the group, and here the condition is a positive result. 99 of those 1,098 have the disease, which gives 0.090.
- The 999 people without the disease who tested positive. ::no The condition names the group you count inside, and the condition here is a positive result, so the denominator is all 1,098 people who got one. Divide by 100,000 instead and you get 0.00099, the chance of both things at once rather than one given the other. Divide by the 100 people who have the disease and you are answering a different question altogether.

=== step === widget
## The other direction: how often does an ill person test positive?

The same four counts answer a second question, and it pays to see how little has to change.

This time the condition is having the disease rather than testing positive. So keep the rows where `disease` is "yes" and throw away the rest.

::widget table-transform {"code":"subset(df, disease == \"yes\")","caption":"Conditioning on disease status keeps the two rows for people who have the disease. Same four counts, a different group to divide by.","before":{"cols":["disease","test","count"],"rows":[["yes","positive",99],["yes","negative",1],["no","positive",999],["no","negative",98901]]},"after":{"cols":["disease","test","count"],"rows":[["yes","positive",99],["yes","negative",1]]}}

Two rows survive again, but different ones: 99 and 1. Press Show what changed and it is now the two rows for people without the disease that get struck out.

Run the same restriction across all 100,000 people.

```r
# Keep only the people who have the disease, then count the positive results
mean(people$test[people$disease == "yes"] == "positive")
#> [1] 0.99
```

That is 0.99, which is the sensitivity we started with. In notation it is \(P(B \mid A)\), the probability of a positive result given the disease.

Compare the two calculations. The numerator was 99 both times. The denominator was 1,098 in one and 100 in the other, and that is the only difference between 0.090 and 0.99.

Notice which of the two a "99% accurate" claim reports. Sensitivity and specificity are both measured on people whose disease status is already known, so both of them condition on that status. Neither conditions on the test result, which is the only thing the person holding that result actually knows.

[WARNING]
\(P(A \mid B)\) and \(P(B \mid A)\) are two different numbers. Reading the accuracy claim as though it answered the first question turns a 9% chance into a near certainty, off by a factor of eleven, from the very same four counts.

=== step === concept
## What the base rate does to a positive result

The 0.090 has a standard name: it is the **positive predictive value**, the share of positive results that are correct.

It came out low here because the disease is rare, and that is worth showing rather than asserting. Write the two pieces of the formula as rates instead of counts, and the prevalence becomes something we can vary.

The people who correctly test positive are `prev * sens` of the population. The people who wrongly test positive are `(1 - prev) * (1 - spec)`. Everybody with a positive result is one or the other, so the positive predictive value is the first over the sum of both. Hold sensitivity and specificity at 0.99 and try four different base rates.

```r
# Work out the chance of disease after a positive result at four base rates
ppv <- function(prev, sens = 0.99, spec = 0.99) {
  prev * sens / (prev * sens + (1 - prev) * (1 - spec))
}

base_rates <- c(0.001, 0.01, 0.05, 0.20)

data.frame(
  people_with_the_disease = c("1 in 1,000", "1 in 100", "1 in 20", "1 in 5"),
  prevalence              = base_rates,
  chance_of_disease       = round(ppv(base_rates), 3)
)
#>   people_with_the_disease prevalence chance_of_disease
#> 1              1 in 1,000      0.001             0.090
#> 2                1 in 100      0.010             0.500
#> 3                 1 in 20      0.050             0.839
#> 4                  1 in 5      0.200             0.961
```

Read the last column downwards: 0.090, then 0.500, then 0.839, then 0.961. The top row is the case we counted by hand, 99 out of 1,098, so the formula is doing the same job the restriction did. The same positive result is worth almost nothing at the top of that column and close to a certainty at the bottom.

Nothing about the test moved. Sensitivity and specificity are 0.99 in every row. The only thing that changed is how common the disease is among the people being screened.

Look at the middle row again. At 1 in 100 the answer is exactly 0.5, because the correct positives work out at 0.01 times 0.99 and the wrong ones at 0.99 times 0.01. Those are the same product, so the two groups are the same size and a positive result is a coin toss.

[KEY INSIGHT]
How accurate a test is does not by itself tell you what a positive result means. You need the base rate as well. That is also why screening is aimed at high-risk groups: raising the prevalence among the people tested is what makes a positive result worth acting on.

=== step === quiz
## Quick check: reading one positive result

One of the 100,000 gets a positive result and asks you what it means. Which answer is right, and right for the right reason?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- About 99%, because the test is right 99% of the time. ::no
- About 9%, because 999 of the 1,098 positive results come from people who do not have the disease. ::ok Yes. Restrict to the 1,098 people who tested positive, count the 99 among them who have the disease, and you get 0.090.
- Still about 1 in 1,000, because one test cannot tell you much. ::no
- About 50%, because at these accuracy rates a positive result leaves it a coin toss. ::no The answer is about 9%, and the way to get there is to count inside the 1,098 people who tested positive. 99% is the share of ill people the test catches, which is a different question. One in 1,000 is the chance before testing, and a positive result really does raise it, from 1 in 1,000 to about 1 in 11. And 0.5 is the correct answer only when the disease is a hundred times more common than it is here.

=== step === tryit
## Your turn: what does a second positive test do?

Suppose the clinic retests all 1,098 people whose result came back positive, using the same test again.

Inside that group the chance of having the disease is no longer 1 in 1,000. It is 99/1098, about 0.0902. So that is the base rate the second test starts from, and `ppv()` will take it from there.

Work out the chance of having the disease after a second positive result.

```r
# ppv(prev) gives the chance of disease after a positive result, at sensitivity
# and specificity 0.99.
# Among the people who already tested positive, the chance of disease is 99/1098,
# so that is the base rate the second test starts from.
# One line. Press Check when you have it.
```
::check {"regex": "ppv\\s*[(]\\s*(99\\s*/\\s*1098|0?\\.09)", "gate": true, "difficulty": "intermediate", "ok": "Right: 0.907. The first positive result carried the chance from 0.001 to 0.090, and the second carries it from 0.090 to 0.907. That holds only if the second test errs independently of the first, which for a repeat of the same test on the same person is a strong assumption.", "no": "Feed the answer from one positive result back in as the base rate for the next one: `ppv(99 / 1098)`, or `ppv(0.0902)`. Wrap it in `round(..., 3)` to read it off cleanly."}
::solution
```r
# Use the chance after the first positive result as the base rate for the second test
round(ppv(99 / 1098), 3)
#> [1] 0.907
```

Two positive results in a row are far better evidence than one, and the reason is the base rate again. The second test is run on a group where the disease is 90 times more common than it was in the clinic queue. The 0.907 also takes for granted that the second test errs independently of the first. Run the same test twice on the same person and that is a strong thing to take for granted.

Carrying an answer forward as the base rate for the next piece of evidence is what Bayesian updating means. It is conditioning done twice.

=== step === concept
## References

- [Simple tools for understanding risks: from innumeracy to insight](https://doi.org/10.1136/bmj.327.7417.741) - Gigerenzer and Edwards (2003), BMJ 327:741-744. Shows that counts of people, the 100,000 we built, fix the errors that rates alone produce.
- [Judgment under Uncertainty: Heuristics and Biases](https://doi.org/10.1017/CBO9780511809477) - Kahneman, Slovic and Tversky (1982). Eddy's chapter on probabilistic reasoning in clinical medicine is where most physicians were found reading P(positive given disease) as P(disease given positive).
- [Introduction to Probability, Second Edition](https://doi.org/10.1201/9780429428357) - Blitzstein and Hwang (2019). Chapter 2 defines conditional probability exactly as it is defined here, and calls the swap of P(A given B) for P(B given A) the prosecutor's fallacy.
- [Uses and abuses of screening tests](https://doi.org/10.1016/S0140-6736(02)07948-5) - Grimes and Schulz (2002), The Lancet 359:881-884. Sensitivity, specificity and predictive value as clinicians are asked to use them.

=== step === complete
## Quick recap

You took one screening question and answered it by counting people, then put the standard names on what you had done.

- Conditioning restricts the group and recounts. None of the four counts changed; only the denominator did.
- The same four counts answer two different questions: 99/1098 = 0.090 is the chance of disease given a positive result, and 99/100 = 0.99 is the chance of a positive result given the disease.
- A "99% accurate" claim reports the second one. On its own it says nothing about what a positive result is worth.
- \(P(A \mid B) = P(A \text{ and } B) / P(B)\) is that counting written down: 0.00099 divided by 0.01098.
- The base rate decides how far apart the two answers sit. With the same test, the chance after a positive result runs from 0.090 at 1 in 1,000 up to 0.961 at 1 in 5.

So the next time a test result arrives with an accuracy figure attached, you know that figure alone cannot answer the question, and you know which two numbers to ask for.
