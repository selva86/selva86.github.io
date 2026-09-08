---
title: "Conditional probability: P(A given B), made concrete"
slug: "Foundations-Mini-1"
description: "A 99% accurate test still gets most positives wrong. See why by splitting a screening population into counts, then compute P(A given B) yourself in R."
keywords: "conditional probability, P(A given B), Bayes theorem basics, base rate fallacy, medical test probability, independent events in R, probability formula"
mathjax: true
webr: true
date: "2026-09-07"
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
catalog_blurb: "Why a positive test can still mean you probably don't have the disease."
---

=== step === cover
## Conditional probability: P(A given B), made concrete

Today let's understand conditional probability, the idea of how knowing one fact changes the probability of another.

Here is an example: Given a disease that affects 100 out of every 100,000 people, and a test for it that is right 99% of the time, we want to know whether the person tested is actually sick or actually healthy.

The diagram below splits all 100,000 people first by whether they have the disease, then by what the test told each of them.

::widget tree-diagram {"root": "Has the disease?", "l": "Tested positive?", "r": "Tested positive?", "leaves": ["99 people", "1 person", "999 people", "98,901 people"]}

Follow the branches down: everyone starts at the top, splits into the 100 who have the disease and the 99,900 who don't, and each of those groups splits again by what the test said.

=== step === concept
## The plain probability of having the disease

Every probability starts from the same idea: Count how many times something happens, then divide by how many times it could have happened.

Here is that count for the disease in the tree above: 100 sick people out of the full 100,000.

```r
# Compute the plain probability of having the disease
sick <- 100
total <- 100000
p_disease <- sick / total
p_disease
#> [1] 0.001
```

P(Disease) comes out to 0.001, exactly the 1-in-1,000 prevalence from the tree. This is the probability before you know anything else about the person, before any test result. It has a name: the unconditional probability, the chance of an event on its own, with no other information attached.

=== step === concept
## What restricting to a positive result actually tells you

So far you have the plain probability of having the disease, with no test result involved. Now suppose the person's test comes back positive. Does that change the probability?

To answer that, restrict your view to only the people who tested positive, and ask the same kind of question again: what fraction of this smaller group has the disease?

That is what conditional probability means. Statisticians write it as P(A given B), sometimes shortened to P(A|B), and it asks for the probability of A once you already know B is true. That relationship has a formula:

$$P(A \mid B) = \frac{P(A \text{ and } B)}{P(B)}$$

Here, A is "has the disease" and B is "tested positive." P(A and B) is called the joint probability, the chance that both things are true at once. P(B) is the probability of the event you are conditioning on, the one you already know happened.

Restrict the same 100,000-person population to only the people who tested positive.

::widget table-transform {"code": "df %>% filter(test_result == \"Positive\")", "caption": "Restricting to the 1,098 people who tested positive", "before": {"cols": ["disease_status", "test_result", "people"], "rows": [["Sick", "Positive", 99], ["Sick", "Negative", 1], ["Healthy", "Positive", 999], ["Healthy", "Negative", 98901]]}, "after": {"cols": ["disease_status", "test_result", "people"], "rows": [["Sick", "Positive", 99], ["Healthy", "Positive", 999]]}}

Out of the 1,098 people who tested positive, only 99 actually have the disease. So P(Disease and Positive) = 99/100,000 = 0.00099, and P(Positive) = 1,098/100,000 = 0.01098.

Divide those two numbers the way the formula says to.

```r
# Compute P(Disease given Positive) by restricting to the people who tested positive
disease_and_positive <- 99
total_positive <- 1098
p_disease_given_positive <- disease_and_positive / total_positive
round(p_disease_given_positive, 4)
#> [1] 0.0902
```

P(Disease given Positive) comes out to about 0.0902, just over 9%. That is far below the test's own 99% figure, and it can feel wrong at first. Here is why: among the 99,900 healthy people, even a small 1% false-positive rate produces 999 false alarms, about ten times more than the 99 real cases the test correctly caught. So most of the 1,098 positive results belong to healthy people, not sick ones.

[KEY INSIGHT]
A rare condition means the unaffected population vastly outnumbers the affected one. So even a small error rate among the unaffected group can produce more false alarms than the affected group produces correct detections.

=== step === concept
## P(A given B) is not P(B given A)

Now restrict the same table a different way: to only the people who are sick, instead of only the people who tested positive.

::widget table-transform {"code": "df %>% filter(disease_status == \"Sick\")", "caption": "Restricting to the 100 people who are sick", "before": {"cols": ["disease_status", "test_result", "people"], "rows": [["Sick", "Positive", 99], ["Sick", "Negative", 1], ["Healthy", "Positive", 999], ["Healthy", "Negative", 98901]]}, "after": {"cols": ["disease_status", "test_result", "people"], "rows": [["Sick", "Positive", 99], ["Sick", "Negative", 1]]}}

Among those 100 people, 99 tested positive. So P(Positive given Disease) = 99/100 = 0.99, which is the test's own accuracy figure.

Compare that with the result from restricting to positive results a moment ago. P(Disease given Positive) was 0.0902. P(Positive given Disease) is 0.99.

Same two events, sick and positive, but the conditioning runs in the opposite direction, and the two numbers are nowhere close. The test's 99% figure is P(Positive given Disease), not P(Disease given Positive), and mixing up the two is exactly what makes this topic feel confusing at first.

=== step === quiz
## Quick check: why a 99% accurate test still misleads

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Because the test is 99% accurate, so P(Disease given Positive) should also land around 99%. ::no
- Because among the 99,900 healthy people, the 1% false-positive rate alone produces 999 false alarms, about ten times more than the 99 real cases the test caught among the sick people. ::ok Exactly right. The test sounds accurate, but the healthy population is so much bigger than the sick population that even a small error rate on the healthy side produces more false alarms than the sick side produces true positives.
- Because P(Disease given Positive) and P(Positive given Disease) are actually the same number, both equal to 99%. ::no
- Because the false positives and the false negatives cancel out, leaving the answer close to the original 99% figure. ::no Nothing cancels here; the two mistakes above are the common ones. The test's own accuracy, P(Positive given Disease) = 99%, comes from restricting to the 100 sick people. P(Disease given Positive) comes from restricting to the 1,098 people who tested positive, a mix of 99 truly sick people and 999 healthy people caught by the 1% false-positive rate, which pulls the answer down to about 9%.

=== step === concept
## The multiplication rule: from conditional to joint

The same formula can also run in the other direction. Rearranged, it looks like this:

$$P(A \text{ and } B) = P(A \mid B) \times P(B)$$

Apply that here, using P(Positive given Disease) = 0.99 and P(Disease) = 0.001.

Multiplying those two numbers should hand back the same joint probability you already know.

```r
# Recover the joint probability using the multiplication rule
p_positive_given_disease <- 0.99   # from restricting to the sick people in the previous step
p_disease_and_positive <- p_positive_given_disease * p_disease
p_disease_and_positive
#> [1] 0.00099
```

That is 0.00099, exactly 99 divided by 100,000, the same joint probability sitting in the tree diagram above. The multiplication rule and the earlier restrict-and-divide method are the same formula, just rearranged and run in different directions.

=== step === concept
## Independent events: when one outcome tells you nothing about another

Not every condition changes the answer. Some events are independent, meaning knowing one tells you nothing new about the other.

A clean example is two fair coin flips. There are 4 equally likely outcomes: both heads, first heads then tails, first tails then heads, and both tails.

List all 4 outcomes, then compare the plain probability of the second flip being heads with that same probability once you already know the first flip was heads.

```r
# List the 4 equally likely outcomes of two coin flips and compare the two probabilities
coin_outcomes <- expand.grid(flip1 = c("H", "T"), flip2 = c("H", "T"))
coin_outcomes
#>   flip1 flip2
#> 1     H     H
#> 2     T     H
#> 3     H     T
#> 4     T     T

p_second_heads <- mean(coin_outcomes$flip2 == "H")
p_second_heads
#> [1] 0.5

p_second_heads_given_first_heads <- mean(coin_outcomes$flip2[coin_outcomes$flip1 == "H"] == "H")
p_second_heads_given_first_heads
#> [1] 0.5
```

Both numbers come out to 0.5. Restricting to just the outcomes where the first flip was heads, rows 1 and 2, still leaves the second flip heads exactly half the time. Knowing the first flip changed nothing about the second.

That is the opposite of what happened with the disease and the test. There, restricting to a positive result moved the probability from 0.001 all the way up to 0.0902, a big change. When conditioning changes the probability like that, the two events are dependent. When conditioning changes nothing, like the two coin flips, the events are independent.

=== step === quiz
## Quiz: putting conditional probability together

Here is one more scenario, to see if the method travels. A company has 200 applicants. 80 of them hold a coding certificate, and 60 of those 80 get hired. Of the remaining 120 applicants without a certificate, 30 get hired.

Which of these is P(Hired given Certificate)?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- 0.4, since 80 of the 200 applicants hold a certificate. ::no
- 0.75, since 60 of the 80 applicants with a certificate got hired. ::ok Right. Restricting to the 80 applicants who hold a certificate and asking what fraction of them got hired gives 60/80 = 0.75. That is P(Hired given Certificate).
- 0.667, since 60 of the 90 hired applicants held a certificate. ::no
- 0.45, since certificate status makes no difference to hiring. ::no 0.45 is just the overall hire rate, 90 of 200, and it does not mean certificate status makes no difference. Restricting to certificate holders (60 of 80 = 0.75) versus restricting to hired applicants (60 of 90 = 0.667) give two different numbers, so the two events are not independent, and P(Hired given Certificate) is not the same as P(Certificate given Hired). Restrict to the 80 applicants who hold a certificate, then ask what fraction of them got hired: 60/80 = 0.75.

=== step === tryit
## Your turn: a more common disease, the same formula

Try the same method on a different disease, one that is much more common: 1 in 20 people have it, instead of 1 in 1,000. Everything else about the test stays the same, right 99% of the time on both sick and healthy people.

Out of 100,000 people, that is 5,000 sick and 95,000 healthy.

Fill in the same restrict-and-divide steps you used earlier for this new population.

```r
# A new population: 100,000 people, but this disease affects 1 in 20, not 1 in 1,000
ex_sick <- 5000
ex_healthy <- 95000

# The test is still right 99% of the time on both sick and healthy people.
# Compute the true positives (ex_tp) and the false positives (ex_fp),
# then P(Disease given Positive) = ex_tp / (ex_tp + ex_fp)
# Three lines. Press Check when you have them.
```
::check {"regex": "ex_tp\\s*/\\s*[(]\\s*ex_tp\\s*\\+\\s*ex_fp\\s*[)]", "gate": true, "difficulty": "intermediate", "ok": "Right: about 0.839. With 1 in 20 people sick instead of 1 in 1,000, the sick population is much closer in size to the healthy population, so the 950 false alarms no longer swamp the 4,950 real cases the way 999 swamped 99 before.", "no": "Restrict the same way you did earlier: true positives are 99% of the sick people (ex_sick * 0.99), false positives are 1% of the healthy people (ex_healthy * 0.01), then divide the true positives by their sum."}
::solution
```r
# Recompute true positives, false positives, and P(Disease given Positive) for the 1-in-20 case
ex_tp <- ex_sick * 0.99
ex_fp <- ex_healthy * 0.01
ex_tp / (ex_tp + ex_fp)
#> [1] 0.8389831
```

That is 0.839, far higher than the 0.0902 you got with the rarer disease. The formula never changed: restrict to the positive group, then divide. What changed was the base rate. When the disease is common enough, the sick population is no longer swamped by false alarms from a much larger healthy population.

=== step === concept
## References

- [How to Improve Bayesian Reasoning Without Instruction: Frequency Formats](https://doi.org/10.1037/0033-295X.102.4.684) - Gigerenzer and Hoffrage (1995), Psychological Review 102(4), 684-704.
- [All of Statistics: A Concise Course in Statistical Inference](https://link.springer.com/book/10.1007/978-0-387-21736-9) - Wasserman (2004), Springer Texts in Statistics, Chapter 1 on probability.
- [Statistical Inference](https://search.worldcat.org/title/statistical-inference/oclc/46538638) - Casella and Berger (2002), 2nd edition, Duxbury Press, Chapter 1.
- [Conditional probability and independence](https://www.khanacademy.org/math/statistics-probability/probability-library/conditional-probability-independence/a/check-independence-conditional-probability) - Khan Academy, Statistics and Probability course.
- [Ten Great Ideas About Chance](https://press.princeton.edu/books/hardcover/9780691174167/ten-great-ideas-about-chance) - Diaconis and Skyrms (2018), Princeton University Press, Chapter 3.

=== step === complete
## What conditional probability gives you

You now have a complete method for conditional probability, and it only ever takes three moves.

First, define a probability as a count over a total, the way you did for the plain P(Disease) = 0.001. Second, restrict that total to the people who match a known condition, the way you restricted to the 1,098 positive results. Third, divide again inside that smaller group, which is what turned 99 into 0.0902.

The same three moves also explain why direction matters. Restricting to the sick people gave you the test's own accuracy, 0.99. Restricting to the positive people gave you something else entirely, 0.0902. And when restricting changes nothing at all, like it didn't for the two coin flips, that is what independence looks like.
