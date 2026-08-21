---
title: "Conditional probability: P(A given B), made concrete"
slug: "Foundations-Mini-1"
description: "A disease hits 1 person in 1,000 and the test is 99% accurate. Your slip says positive. Count 100,000 people in R and find the answer most people miss."
keywords: "conditional probability, P(A given B), conditional probability in R, base rate, false positives, independence, medical test probability, prop.table"
mathjax: true
webr: true
date: "2026-08-21"
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
catalog_blurb: "Why a positive result from a 99% accurate test usually means you are fine."
---

=== step === cover
::eyebrow Probability Foundations
## Conditional probability: P(A given B), made concrete

Meera goes to a free health camp on a Sunday morning. They are testing everyone who walks through the door for a disease, so she rolls up her sleeve along with everybody else.

Two things are worth knowing before her slip comes back.

The disease is rare. It affects about 1 person in every 1,000.

The test is good. It is right 99 times out of 100.

Her slip comes back positive.

So how worried should Meera be? Almost everyone answers it the same way. The test is 99% accurate and it came back positive, so she must be about 99% likely to have the disease.

That answer is wrong, and it is not wrong by a little.

Her real chance of being ill is about 9%. That is nine in a hundred, not ninety-nine.

You do not have to take my word for it, and we are not going to reach for a formula either. We are going to line up a hundred thousand people in R, hand every one of them the same test, and count what comes back.

::widget process-flow {"steps":[{"title":"Line up 100,000 people","sub":"1 in every 1,000 of them is ill, so 100 in all"},{"title":"Test every one of them","sub":"the test is right 99 times out of 100, both ways"},{"title":"Keep only the positive slips","sub":"then count how many of those people are really ill"}]}

Once the counts are in front of you, the answer stops being surprising. And that last move, where you keep only the people for whom one thing is true and then ask about another, is the whole of conditional probability.

=== step === concept
## One sick person in every thousand

Before we can count anything we need the crowd itself, so let's build it.

A probability is nothing more than a share of a crowd. When someone says the disease affects 1 person in 1,000, a crowd is exactly what they are describing. Pick 1,000 people at random and about one of them will be ill.

That is easier to work with if we take a bigger crowd. So let's take 100,000 people, which is the same camp scaled up until every count in it lands on a whole number. At 1 in 1,000, that gives us 100 sick people and 99,900 healthy ones.

We will hold them as a data frame with one row per person. `rep()` repeats a value as many times as you ask, so `rep("sick", 100)` hands back 100 people marked sick.

Press Run.

```r
# Build the health camp: 100,000 people, 1 in every 1,000 of them sick
camp <- data.frame(
  status = c(rep("sick", 100),      # 1 person in every 1,000
             rep("healthy", 99900))
)

table(camp$status)
#>
#> healthy    sick
#>   99900     100
```

`table()` counts how many times each value shows up in a column, so it is the counting tool we will keep coming back to.

So there is our crowd. Inside a camp of 100,000 people, 100 of them genuinely have the disease. Nobody has been tested yet, and that is what we do next.

[NOTE]
There is no randomness anywhere here. We are not drawing a random sample of 100,000 people, we are laying out exactly what a crowd of that size looks like at these rates. Every number you see is a plain count, so your output and mine match to the last digit.

=== step === concept
## What a test that is 99% accurate promises

"99% accurate" sounds like one promise. It is really two, and you need both of them to fill the camp in.

The first promise is about sick people. Of every 100 people who really have the disease, the test catches 99 and misses 1. The second promise is about healthy people. Of every 100 people who are perfectly fine, the test clears 99 and frightens 1.

Now run both promises through our camp.

Of the 100 sick people, 99 walk out with a positive slip and 1 walks out with a negative one. Of the 99,900 healthy people, 1 in every 100 gets a positive slip anyway, which comes to 999 people, and the remaining 98,901 are correctly cleared.

Let's add a result column and count the camp both ways at once.

```r
# Fill in what the test said about each person, right 99 times out of 100
camp$result <- c(rep("positive", 99), rep("negative", 1),        # the 100 sick people
                 rep("positive", 999), rep("negative", 98901))   # the 99,900 healthy people

counts <- table(status = camp$status, result = camp$result)
counts
#>          result
#> status    negative positive
#>   healthy    98901      999
#>   sick           1       99
```

Read that as a grid of four boxes. Down the rows is the truth about a person, across the columns is what their slip said.

Now look only at the positive column, because that is the column Meera is standing in. It holds 999 healthy people and 99 sick people. The healthy positives outnumber the real ones by roughly ten to one.

[KEY INSIGHT]
The test did nothing wrong. It made its 1% mistake on 99,900 healthy people, and 1% of a very large number is bigger than 99% of a very small one.

=== step === widget
## Where the 1,098 positive slips come from

Four boxes are fine, but it is easier to watch the camp actually split. So here is the same 100,000 people falling through two questions, one after the other.

The first question is the one nobody in the room can answer just by looking. Is this person actually ill? That sends 100 people down the left and 99,900 down the right. The second question is the one the test answers. Did the slip come back positive? That splits each of those two groups again.

::widget tree-diagram {"root":"Actually ill?","l":"Test positive?","r":"Test positive?","leaves":["99","1","999","98,901"]}

There are four numbers at the bottom, and between them they account for every person in the camp.

On the left, 99 sick people got a positive slip and 1 sick person was missed. On the right, 999 healthy people got a positive slip and 98,901 were sent home clear.

Add the two positive leaves together and you have every positive slip handed out that day. That is 99 plus 999, which comes to 1,098. Meera is holding one of those 1,098 slips, and nothing on the slip tells her which branch she came down.

=== step === quiz
## Quick check: who fills the positive column?

The camp handed out 1,098 positive slips and 999 of them went to people who are perfectly healthy. Why do the healthy people fill up that column?

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- The test is faulty. Something has gone wrong with it if it labels 999 healthy people positive. ::no
- The sick people in the camp outnumber the healthy ones, so most positive slips were always going to belong to sick people. ::no
- The healthy group is enormous, and a small mistake rate applied to 99,900 people produces far more slips than a high catch rate applied to 100. ::ok That is exactly it. 1% of 99,900 is 999, while 99% of 100 is only 99. The size of the group the mistake gets made on is doing all the work.
- 99% of the positive slips belong to sick people, because the test is 99% accurate. ::no The 99% describes what the test does to a sick person, not what a positive slip is worth. Walk the two groups instead: 1% of the 99,900 healthy people is 999 slips, and 99% of the 100 sick people is 99 slips. The healthy group is so much bigger that its rare mistakes still outnumber the real catches about ten to one.

=== step === concept
## About nine in every hundred positive slips are real

Now we can answer Meera's actual question, and the way to do it is to throw most of the camp away.

She is holding a positive slip. That means the 98,902 people who tested negative have nothing to do with her question any more. They are not her crowd. The only people in her situation are the 1,098 who walked out holding a positive slip. So her chance of being ill is simply the share of sick people inside that smaller crowd.

Let's cut the camp down and count.

```r
# Throw away everyone who tested negative, then count the sick people left
positives <- camp[camp$result == "positive", ]

nrow(positives)
#> [1] 1098

mean(positives$status == "sick")
#> [1] 0.09016393
```

There are two lines there worth reading slowly.

`camp[camp$result == "positive", ]` keeps only the rows where the result was positive, and the comma with nothing after it means keep every column. `nrow()` then confirms that 1,098 people survived the cut.

The second line turns those 1,098 rows into TRUE and FALSE with `positives$status == "sick"`, and `mean()` over TRUE and FALSE is just the share that are TRUE. It comes back as 0.0902.

So Meera's chance of being ill, given that positive slip, is about 9 in 100. It is not 99 in 100. The test is genuinely excellent and the odds are still strongly in her favour.

=== step === widget
## What P(A given B) says in words

The move you just made has a name and a notation, and both are simpler than they look.

Written down it is P(A given B), and in most books the word "given" is a vertical bar: P(A | B). Say it out loud as "the probability of A, given B".

- **B is what you already know.** Meera has a positive slip, so B is "tested positive". B is the thing that shrinks the crowd.
- **A is what you want to find out.** Meera wants to know whether she is ill, so A is "is sick". A is the thing you count inside whatever crowd is left.
- **The bar is the throwing-away.** It says: drop everyone for whom B is false, then ask about A among the people who remain.

So Meera's question, written properly, is P(sick | positive). And we have already counted it. It is 0.0902.

Here is that same restriction done to the four boxes of our camp. You can run it yourself, and pressing Show what changed strikes out the rows that get dropped so you can watch the crowd shrink.

::widget table-transform {"code": "df[df$result == \"positive\", ]", "caption": "Keeping only the positive rows leaves 99 sick people and 999 healthy ones, the 1,098 people who all walked out holding a positive slip.", "before": {"cols": ["status", "result", "people"], "rows": [["sick", "positive", 99], ["sick", "negative", 1], ["healthy", "positive", 999], ["healthy", "negative", 98901]]}, "after": {"cols": ["status", "result", "people"], "rows": [["sick", "positive", 99], ["healthy", "positive", 999]]}}

Two rows fall away and 98,902 people go with them. What is left is Meera's crowd, and 99 of those 1,098 people are sick.

=== step === concept
## P(A given B) as a fraction of two counts

Throwing rows away and counting works, and it will always work. There is also a formula, and it is worth seeing, because it is the very same counting written as a fraction.

Let's start somewhere slightly different, with what is called a joint probability. P(sick and positive) asks: pick one person at random out of the whole camp of 100,000, what is the chance they are both sick and holding a positive slip? That is the 99 people in the corner box, out of 100,000, which is 0.00099.

Now take P(positive) on its own. Pick one person out of the whole camp, what is the chance their slip says positive? That is 1,098 out of 100,000, or 0.01098.

Divide the first by the second and you have the rule.

\[ P(A \mid B) = \frac{P(A \text{ and } B)}{P(B)} \]

Both of those probabilities were measured over the same crowd of 100,000, so when you divide, the 100,000 cancels and you are left with 99 over 1,098. The formula is not doing anything clever behind your back. It is the count of people who are both, over the count of people in the smaller crowd.

Let's put it against the table and check. Two bits of indexing show up here. `counts["sick", "positive"]` pulls a single box out of the table by name, and `counts[, "positive"]` with nothing before the comma pulls the whole positive column, which `sum()` then adds up.

```r
# Check the formula against the counts: P(sick and positive) over P(positive)
n <- nrow(camp)
p_sick_and_positive <- counts["sick", "positive"] / n
p_positive          <- sum(counts[, "positive"]) / n

c(joint = p_sick_and_positive,
  given = p_positive,
  answer = p_sick_and_positive / p_positive)
#>      joint      given     answer
#> 0.00099000 0.01098000 0.09016393
```

0.09016393, which is exactly what the counting gave us. Two roads, and they arrive at the same place.

[NOTE]
Notice how far apart the joint and the conditional are. P(sick and positive) is 0.00099, about 1 in 1,000, because it is measured over the whole camp. P(sick | positive) is 0.0902, about 1 in 11, because it is measured over the 1,098 people holding a positive slip. Same 99 people on top, very different crowd underneath.

=== step === tryit
## Your turn: how safe is a negative result?

Meera's neighbour in the queue, Ravi, walks out with a negative slip. It is the same camp and the same test, with the opposite result.

His crowd is the other one, the 98,902 people whose slip came back negative. Exactly one of them really is ill, the single sick person the test missed. Work out Ravi's chance of being ill.

The camp is still in memory. `camp$result` reads "positive" or "negative", and `camp$status` reads "sick" or "healthy". Restrict to the negative slips, then take the share of those people who are sick.

```r
# Ravi tested negative. Keep only the people whose result was negative,
# then work out the share of them who are sick.
# camp$result is "positive" or "negative"; camp$status is "sick" or "healthy".
# Two lines. Press Check when you have them.
```
::check {"regex": "mean[(][^)]*negative|negative[^(]*mean[(]", "gate": true, "difficulty": "beginner", "ok": "Right: 1.011102e-05, which is R shorthand for 0.00001, or about 1 in 99,000. A negative slip here is very close to a clean bill of health.", "no": "Take the restriction you used on the positive slips and flip the word: keep the rows where `camp$result == \"negative\"`, then take the `mean()` of `status == \"sick\"` over what is left."}
::solution
```r
# Keep only the negative slips, then find the share of those people who are sick
negatives <- camp[camp$result == "negative", ]
mean(negatives$status == "sick")
#> [1] 1.011102e-05
```

So the same test hands out two wildly different pieces of news. A negative slip almost settles the matter, and a positive slip barely moves it. That difference comes entirely from how rare the disease is.

=== step === concept
## Ninety-nine percent accurate and nine percent sick, both true

Two numbers have been sitting next to each other for a while now, 99% and 9%, and they look like they cannot both be right. They can. They are reading the same four boxes in different directions.

`prop.table()` turns a table of counts into a table of shares. Hand it a 1 and it makes each row add up to 1. Hand it a 2 and it makes each column add up to 1.

```r
# Read the same table twice: once across the rows, once down the columns
round(prop.table(counts, 1), 4)
#>          result
#> status    negative positive
#>   healthy     0.99     0.01
#>   sick        0.01     0.99

round(prop.table(counts, 2), 4)
#>          result
#> status    negative positive
#>   healthy   1.0000   0.9098
#>   sick      0.0000   0.0902
```

The first table reads across the rows, which means it starts from the truth about a person and asks what the test said about them. The sick row says 0.99 positive. That is P(positive | sick), and it is the 99% the camp advertised on its poster.

The second table reads down the columns, which means it starts from the slip and asks about the truth. The positive column says 0.0902 sick. That is P(sick | positive), and it is Meera's answer.

It is the same 99 people and the same four boxes, answering two completely different questions.

[WARNING]
The 0.0000 in the bottom left corner is rounding, not a zero. The true value is 0.00001, the single sick person hiding among 98,902 negative slips, and rounding to four places flattens it out of sight.

=== step === quiz
## Quick check: which direction does 99% describe?

The camp advertised a test that is 99% accurate, and Meera is holding a positive slip. What is that 99% a statement about?

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- P(positive | sick): of the people who really are ill, 99 in 100 get a positive slip. On its own it says nothing about what a positive slip is worth. ::ok Yes. It runs from the truth to the test. Meera needs it the other way round, from the test to the truth, and that direction depends on how many healthy people were standing in the queue with her.
- P(sick | positive): of the people holding a positive slip, 99 in 100 really are ill. ::no
- It is the average of the two directions, so a positive slip means roughly 99% either way. ::no
- It means 1% of positive slips are wrong, so Meera has a 1% chance of being fine. ::no Three of these read the 99% as a statement about the slip. It is a statement about the person: give this test to someone who really is ill and 99 times in 100 it comes back positive. Turning it round into P(sick | positive) drags in all 99,900 healthy people, and that is what pulls the answer down to 0.0902.

=== step === concept
## Why symptoms change what Meera's slip is worth

Here is the part that surprises people most. Meera's slip is worth 9%, but change nothing at all about the test and the very same slip can be worth a great deal more.

Suppose she had never walked into a screening camp. Suppose instead she had gone to a doctor because she had felt unwell for three weeks, and the doctor ordered this test for that reason. Among people who turn up with those symptoms the disease is far more common, roughly 1 in 20 rather than 1 in 1,000.

The laboratory has not changed. The queue has. So let's rebuild the camp at 1 in 20 and run the same count over it.

At 1 in 20, a crowd of 100,000 holds 5,000 sick people and 95,000 healthy ones. The test catches 99% of the 5,000, which is 4,950 real positives, and frightens 1% of the 95,000, which is 950 false ones.

```r
# Rebuild the camp for people who arrived with symptoms: 1 in 20 is sick
symptom_camp <- data.frame(
  status = c(rep("sick", 5000), rep("healthy", 95000)),
  result = c(rep("positive", 4950), rep("negative", 50),
             rep("positive", 950),  rep("negative", 94050))
)

symptom_counts <- table(status = symptom_camp$status, result = symptom_camp$result)
symptom_counts
#>          result
#> status    negative positive
#>   healthy    94050      950
#>   sick          50     4950

symptom_positives <- symptom_camp[symptom_camp$result == "positive", ]
mean(symptom_positives$status == "sick")
#> [1] 0.8389831
```

0.839. The same positive slip, from the same test, is now worth about 84% instead of 9%.

Nothing about the laboratory moved. What moved is who else was in the queue. In the screening camp the healthy people outnumbered the sick 999 to 1, so their rare mistakes swamped the real catches. Among people with symptoms they outnumber them only 19 to 1, and the real catches win comfortably.

[KEY INSIGHT]
A test result is never worth a fixed amount. What it is worth depends on the crowd the person came from, and handling that properly is exactly what conditional probability is for.

=== step === concept
## The rarer the disease, the more false alarms crowd out the real ones

Two crowds give you a hint. Four of them give you a pattern. The thing we keep changing has a name. It is called the base rate, and it just means how common the disease is in the crowd before anybody has been tested. So let's move the base rate around and hold everything else still.

We could build 100,000 people over and over again, but the calculation is short enough to write once as a small function. Read it a line at a time.

```r
# Work out the chance of being sick after a positive slip, for any base rate
rate_for <- function(base_rate) {
  sick_and_positive    <- base_rate * 0.99         # sick people the test catches
  healthy_and_positive <- (1 - base_rate) * 0.01   # healthy people it frightens
  sick_and_positive / (sick_and_positive + healthy_and_positive)
}

sweep <- data.frame(
  one_person_in = c(10, 100, 1000, 10000),
  chance_sick   = round(rate_for(1 / c(10, 100, 1000, 10000)), 4)
)
sweep
#>   one_person_in chance_sick
#> 1            10      0.9167
#> 2           100      0.5000
#> 3          1000      0.0902
#> 4         10000      0.0098
```

`function(base_rate)` says: hand me a base rate and I will hand you back a number. Inside it, the first line is the share of the whole crowd who are both sick and positive, and the second is the share who are both healthy and positive. The last line divides the real catches by all the positives, which is P(sick | positive) written as a fraction of two shares instead of two counts.

Now read the table from top to bottom. At 1 in 10 a positive slip means 92%. At 1 in 100 it means a coin flip. At 1 in 1,000, our camp, it means 9%. At 1 in 10,000 it means 1%.

Here are the same four numbers drawn out. `log = "x"` spaces the crowds evenly along the bottom, which they need because each one is ten times rarer than the one before it.

```r
# Draw those four numbers: the rarer the disease, the lower the chance
plot(sweep$one_person_in, sweep$chance_sick,
     log = "x", type = "b", pch = 19, lwd = 2, col = "#b5631a",
     xlab = "Disease affects 1 person in ...",
     ylab = "Chance of being sick, given a positive slip",
     main = "The same 99% test, four different crowds")
```

The line falls away steeply. Every point to the right makes the disease ten times rarer. And each time the healthy group grows, its 1% of mistakes grows along with it while the pool of real cases shrinks.

That is why screening a whole population for something rare produces mostly false alarms, however good the test is.

=== step === concept
## When the given changes nothing at all

So far we have moved the crowd around and watched the answer follow. Now let's leave the crowd alone and break the test instead.

Imagine the camp runs out of reagent, and rather than send everyone home, the technician just decides each result with a coin. Heads is positive, tails is negative. The slip now has nothing whatsoever to do with the person holding it.

It is the same 100 sick people and the same 99,900 healthy ones, except that half of each group now walks out with a positive slip.

```r
# Rebuild the same camp with a useless test: a coin flip decides every result
coin_camp <- data.frame(
  status = c(rep("sick", 100), rep("healthy", 99900)),
  result = c(rep("positive", 50), rep("negative", 50),
             rep("positive", 49950), rep("negative", 49950))
)

coin_counts <- table(status = coin_camp$status, result = coin_camp$result)
coin_counts
#>          result
#> status    negative positive
#>   healthy    49950    49950
#>   sick          50       50

coin_positives <- coin_camp[coin_camp$result == "positive", ]
c(given_a_positive  = mean(coin_positives$status == "sick"),
  in_the_whole_camp = mean(coin_camp$status == "sick"))
#>  given_a_positive in_the_whole_camp
#>             0.001             0.001
```

Look hard at those two numbers. P(sick | positive) is 0.001, and P(sick) across the entire camp is also 0.001.

Knowing the slip came back positive told us absolutely nothing. We restricted the crowd, we counted inside it, and the answer landed exactly where it started.

That is what independence means, and the definition is one line: two events are independent when P(A | B) equals P(A). Learning B leaves your answer about A untouched.

[NOTE]
This is the check to reach for whenever you want to know whether two things are related at all. Work out P(A | B), compare it with P(A), and look at the gap. With the real test the gap is enormous, 0.0902 against 0.001. With the coin test there is no gap whatsoever.

=== step === quiz
## Quick check: is the real test independent of the disease?

Let's go back to the real camp with the working test. P(sick) across the whole camp is 0.001, and P(sick | positive) among the 1,098 people holding a positive slip is 0.0902. Are being sick and testing positive independent?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Yes, because both things can happen to the same person, and plenty of people are sick and also test positive. ::no
- No. Independence means P(A | B) equals P(A), and here 0.0902 is about ninety times 0.001, so knowing the slip changed the answer enormously. ::ok Exactly. The slip moved the number from 0.001 to 0.0902, so it carried real information. A working test had better not be independent of the disease it is looking for.
- No, because being sick and testing positive are mutually exclusive, so they cannot both be true at once. ::no
- Yes, because the test still makes mistakes, and a test that makes mistakes cannot be related to the truth. ::no Independence is one comparison and nothing else: does P(A | B) equal P(A)? Here 0.001 became 0.0902, so no. Two events being able to happen together is not independence, and two events being unable to happen together is a different idea altogether, called mutually exclusive.

=== step === tryit
## Your turn: a camp where 1 person in 200 is ill

A second camp opens in a nearby town, running the same test with the same two promises. In that town the disease is more common, 1 person in 200.

Build that crowd yourself, 100,000 people again, and find out what a positive slip is worth there.

There are three things to work out before you type anything. How many of the 100,000 are sick at 1 in 200? How many of those does the test catch at 99%? And how many of the healthy ones does it frighten at 1%?

```r
# A new camp of 100,000 people where 1 person in 200 is sick.
# The same test: 99 of every 100 sick people come back positive,
# and 99 of every 100 healthy people come back negative.
# Build the camp, keep only the positive slips, and find the share
# of those people who are sick.
# Press Check when you have it.
```
::check {"regex": "495|1490|0[.]3322", "gate": true, "difficulty": "intermediate", "ok": "That is it: 1,490 positive slips, 495 of them real, which is 0.3322. Five times more common than the first camp, and a positive slip is worth about a third instead of a tenth.", "no": "Work the counts out first. 1 in 200 of 100,000 is 500 sick and 99,500 healthy. The test catches 99% of the 500, which is 495, and frightens 1% of the 99,500, which is 995. Build those four groups with `rep()`, restrict to the positive rows, then take the share who are sick."}
::solution
```r
# Build a camp where 1 person in 200 is sick, then condition on a positive slip
camp_200 <- data.frame(
  status = c(rep("sick", 500), rep("healthy", 99500)),
  result = c(rep("positive", 495), rep("negative", 5),
             rep("positive", 995), rep("negative", 98505))
)

positives_200 <- camp_200[camp_200$result == "positive", ]

c(positive_slips = nrow(positives_200),
  chance_sick    = mean(positives_200$status == "sick"))
#> positive_slips    chance_sick
#>   1490.0000000      0.3322148
```

=== step === quiz
## Quick check: which sentence gets both numbers right?

Here are two numbers from the screening camp, side by side.

- 0.99 is the share of sick people whose slip comes back positive.
- 0.0902 is the share of positive slips that belong to sick people.

Somebody at the camp now has to explain both of them to Meera in one sentence. Which sentence gets them right?

::quiz {"correct": 4, "gate": true, "difficulty": "intermediate"}
- The test is 99% accurate, so your positive slip is 99% likely to be right, and only about 9% of results go wrong. ::no
- The test is right only 9% of the time on people like you, so a positive slip is weak evidence about anything. ::no
- The test is 99% accurate on people who are ill, so 99 of every 100 positive slips belong to someone ill. ::no The other three all hand a number to the wrong crowd. 0.99 is counted among people who are ill, and 0.0902 is counted among people holding a positive slip. Neither one is a claim about how often the test goes wrong, and swapping the two crowds is precisely what makes a positive slip sound like a diagnosis.
- If you are ill, the test says positive 99 times in 100. But the disease is rare, so of everyone holding a positive slip today, only about 9 in 100 are ill. ::ok Yes. It gives each number its own crowd: the 99 is counted among ill people, the 9 is counted among people holding a positive slip. Once you say which crowd a number lives in, both can be true at the same time without contradicting each other.

=== step === tryit
## Your turn: what share of the 1,098 positive slips are healthy people?

One last count, and it is a short one.

`positives` still holds the 1,098 people from the screening camp who walked out with a positive slip, and its `status` column reads "sick" or "healthy". You already know that 0.0902 of them are sick. Work out the share who are healthy, then add the two together and see what you get.

```r
# positives holds the 1,098 people from the camp who tested positive.
# positives$status reads "sick" or "healthy".
# Find the share of them who are healthy, then add that to the
# share of them who are sick.
# Press Check when you have it.
```
::check {"regex": "mean[(][^)]*healthy", "gate": true, "difficulty": "intermediate", "ok": "Right: 0.9098 healthy, and 0.9098 plus 0.0902 comes to exactly 1. Every one of those 1,098 people is either sick or healthy, so the two shares have to fill the crowd completely.", "no": "It is the same `mean()` over the same restricted crowd with one word changed: `mean(positives$status == \"healthy\")`. Then add it to `mean(positives$status == \"sick\")`."}
::solution
```r
# Among the positive slips, find the share that belong to healthy people
mean(positives$status == "healthy")
#> [1] 0.9098361

# The two shares over the same restricted crowd add to 1
mean(positives$status == "healthy") + mean(positives$status == "sick")
#> [1] 1
```

That is worth holding on to. Once you fix the crowd, conditional probabilities behave like ordinary ones. They are shares of that crowd, and if you add up every way a person in it can turn out, you get 1. Meera has about a 9% chance of being ill and about a 91% chance of being fine, and there is nothing else she can be.

=== step === concept
## References

- [How to improve Bayesian reasoning without instruction: frequency formats](https://doi.org/10.1037/0033-295X.102.4.684) - Gigerenzer and Hoffrage (1995), Psychological Review 102(4), 684-704. The evidence that counting people, the way we did here, beats feeding the same numbers into a formula.
- [Judgment under Uncertainty: Heuristics and Biases](https://doi.org/10.1017/CBO9780511809477) - Kahneman, Slovic and Tversky (1982), Cambridge University Press. It carries Eddy's chapter on probabilistic reasoning in clinical medicine, where most of the doctors asked a question of exactly this shape answered about ten times too high.
- [Helping doctors and patients make sense of health statistics](https://doi.org/10.1111/j.1539-6053.2008.00033.x) - Gigerenzer, Gaissmaier, Kurz-Milcke, Schwartz and Woloshin (2007), Psychological Science in the Public Interest 8(2), 53-96. Real screening numbers worked through as counts of people rather than percentages.
- Casella and Berger (2002), Statistical Inference, second edition, section 1.3, Conditional Probability and Independence. The formal definitions sitting underneath all of this counting.
- R Core Team, the base R documentation for the two counting functions used throughout: [table()](https://stat.ethz.ch/R-manual/R-devel/library/base/html/table.html) and [prop.table()](https://stat.ethz.ch/R-manual/R-devel/library/base/html/marginSums.html).

=== step === complete
## Quick recap

Nice work. You started with a puzzle that fools almost everybody, and you answered it by counting 100,000 people rather than by trusting a percentage. Here is the whole thing in one place.

- A conditional probability is a share of a smaller crowd. P(A | B) says: drop everyone for whom B is false, then count how often A is true among the people left.
- In R that is two moves. Restrict the rows with `camp[camp$result == "positive", ]`, then count with `mean()`.
- Written as a formula it is P(A and B) divided by P(B), which is those same two counts as a fraction.
- Direction matters more than anything else. P(positive | sick) is 0.99 and P(sick | positive) is 0.0902, out of the very same four boxes.
- The base rate drives the answer. Hold the test still and move the disease from 1 in 20 to 1 in 10,000, and a positive slip falls from being worth 84% to being worth 1%.
- Independence is one comparison: P(A | B) equals P(A). The coin test had it. The real test did not, which is the whole reason it is worth taking.

None of this is really about medicine. A spam filter holding a flagged email, or a bank holding a flagged payment, is standing exactly where Meera stood: a good test, a rare thing being looked for, and a pile of false alarms that have to be counted before the result means anything.

And when somebody tells you a test is 99% accurate, here is the sentence to say back:

"Ninety-nine percent of ill people test positive, yes. But how common is the disease? Because if it is rare, most of the positive results are healthy people."

That one question, how common is it, is the whole of what we did today. Congratulations, and have a great day!
