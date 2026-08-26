---
title: "Bayes' theorem: the simulation that makes it click"
slug: "Bayesian-Mini-1"
description: "An email shouting WINNER is evidence. Build the mailbox in R, count the answer off the messages that shouted, and watch Bayes theorem give back the same number."
keywords: "Bayes theorem, Bayes theorem in R, conditional probability, prior and posterior, base rate, false positive rate, spam filter probability, positive test result"
mathjax: true
webr: true
date: "2026-08-26"
post_type: "LESSON"
course_id: "bayesian-decisions"
course_title: "Bayesian Decisions"
course_lesson: "1"
course_total: "9"
course_landing: "/dashboard.html"
course_prev: ""
course_next: ""
curriculum_id: "0.0.30"
lesson_access: "windowed"
catalog_blurb: "How to update a belief with new evidence, counted out in R."
---

=== step === cover
::eyebrow Bayesian Decisions
## Bayes' theorem: the simulation that makes it click

An email lands in your inbox with the subject line WINNER!!! and you know it is junk before you read a word of it.

Your spam filter knows it too, and it gets there by arithmetic.

Here is what it does. Before it reads anything it already believes this message is probably legitimate, because most mail always has been. Then it sees the word WINNER, which turns up in junk fairly often and in real mail almost never. So it takes the belief it walked in with, moves it by whatever that word is worth, and lands on a new belief.

Belief in, evidence in, updated belief out. That is the whole move, and it has a name.

::widget process-flow {"steps":[{"title":"What you believed before","sub":"most mail is legitimate, so junk is the unlikely guess"},{"title":"What the word is worth","sub":"WINNER is common in junk and very rare in real mail"},{"title":"What you believe now","sub":"the old belief, moved by what the word is worth"}]}

Today we are not going to memorise the formula that does this. We are going to build a mailbox of 100,000 past messages, throw away every message that stayed quiet, and count the answer straight off the ones that are left. Then we will put names on the four numbers we counted, and find we have written the famous formula without meaning to.

=== step === concept
## What the filter believes before it reads a word

Every spam filter starts with a history. Ours has 100,000 messages that were sorted by hand at some point in the past, so for each one we know the truth: junk or not junk.

Out of those 100,000, exactly 20,000 turned out to be spam.

That is the number the filter carries into every new message that arrives. Before it has read a single word, its best guess is that this message has a 1 in 5 chance of being junk. There is nothing clever about it. It is just the share that has been junk before.

Let's put that mailbox in front of you. Press Run.

```r
# Build the filter's labelled history: 100,000 past messages, 20,000 of them spam
mailbox <- data.frame(
  spam = rep(c(TRUE, FALSE), c(20000, 80000))
)

nrow(mailbox)
#> [1] 100000

table(spam = mailbox$spam)
#> spam
#> FALSE  TRUE
#> 80000 20000

mean(mailbox$spam)
#> [1] 0.2
```

`rep(c(TRUE, FALSE), c(20000, 80000))` writes 20,000 TRUEs and then 80,000 FALSEs, so the first 20,000 rows are the spam and the other 80,000 are the legitimate mail. `mean()` on a column of TRUEs and FALSEs is just the share of TRUEs, which comes back as 0.2.

That 0.2 has a name. It is the **prior**: what you believe before any evidence turns up.

=== step === concept
## How often each kind of message shouts WINNER

A prior on its own decides nothing. To get anything out of the word WINNER, you also need to know how often each kind of message uses it.

Two rates were measured on that same history, and they are what make the word worth reading.

- WINNER appears in 5% of the spam.
- WINNER appears in 0.1% of the legitimate mail, which is 1 message in every 1,000.

Notice the word is not exclusive to junk. Real mail does shout WINNER sometimes, in a lottery result forwarded by a friend or a sales team celebrating a deal. It is rare, and that small rate will matter far more than you would think.

Let's mark the shouting messages at exactly those two rates.

```r
# Mark which messages shout WINNER: 5% of the spam and 0.1% of the legitimate mail
mailbox$winner <- c(rep(c(TRUE, FALSE), c(1000, 19000)),
                    rep(c(TRUE, FALSE), c(80, 79920)))

table(spam = mailbox$spam, winner = mailbox$winner)
#>        winner
#> spam    FALSE  TRUE
#>   FALSE 79920    80
#>   TRUE  19000  1000
```

That one line has two halves because the mailbox has two halves. The first 20,000 rows are the spam, so the first `rep()` marks 1,000 of them as shouting and leaves 19,000 quiet. The next 80,000 rows are the legitimate mail, so the second `rep()` marks 80 and leaves 79,920.

Read that table one row at a time. The bottom row is the 20,000 spam messages, and 1,000 of them shout WINNER, which is the 5%. The top row is the 80,000 legitimate messages, and 80 of them shout, which is the 0.1%.

There is no random draw here and no seed. The history is already labelled, so the counts land on the given rates exactly.

=== step === concept
## Counting the answer off the messages that shouted

Now for the question you actually care about. A new message arrives, it shouts WINNER, and you want to know whether it is junk.

Look at which way that question runs. The two rates you were handed run from the sender to the word: given that a message is spam, how often does it shout? The question in front of you runs the other way: given that a message shouted, how often is it spam?

Those are different questions with different answers, and the mailbox you just built can settle the second one by counting.

Here is the move, and it is a small one. Throw away every message that stayed quiet. Whatever the word WINNER has to say, it says nothing at all about a message that never used it. What is left is the pile that shouted, and the answer is the share of that pile which is spam.

```r
# Keep only the messages that shouted WINNER, then count the share of them that is spam
flagged <- mailbox[mailbox$winner, ]

nrow(flagged)
#> [1] 1080

sum(flagged$spam)
#> [1] 1000

mean(flagged$spam)
#> [1] 0.9259259
```

1,080 messages shouted. Of those, 1,000 are spam. So the answer is 1000 divided by 1080, which is 0.926.

Look at those two numbers for a second. Before the word, this message was 20% likely to be junk. After the word, it is 92.6% likely to be junk.

[KEY INSIGHT]
Belief went in at 0.20 and came out at 0.926, and nothing moved it except counting. Keep only the messages that carry the evidence, then read the share off what is left. That is Bayes' theorem, done with your hands.

Nothing was assumed and no formula was used. You filtered a table and took a mean.

=== step === concept
## The same mailbox drawn as a tree

One piece of that counting is worth seeing rather than reading, because it is the piece people drop.

Here is the same 100,000 messages as a tree. It splits once on the truth, junk or not junk, and then each side splits again on whether the message shouted.

::widget tree-diagram {"root":"Is it spam?","l":"Shouts WINNER?","r":"Shouts WINNER?","leaves":["1,000","19,000","80","79,920"]}

There are four leaves, and they add up to 100,000. Only two of them shouted: the 1,000 on the spam side and the 80 on the legitimate side. Those two survived the filtering, so they are the only leaves the answer is made of.

The top of the fraction is one leaf, the 1,000. The bottom is both shouting leaves added together, 1,000 plus 80.

That bottom number is where nearly everyone goes wrong. People remember to put the 1,000 on top. Then they divide by 20,000, or by 100,000, and the answer comes out wrong. What goes underneath is every message that shouted, of either kind, added up.

=== step === quiz
## Quick check: which messages belong in the denominator?

A message arrives shouting WINNER and you want the chance that it is spam. Which group goes underneath the 1,000?

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- All 100,000 messages in the history. ::no
- The 20,000 spam messages. ::no
- All 1,080 messages that shouted WINNER, spam and legitimate together. ::ok That is the one. Once a message has shouted, the quiet ones are out of the running, and the only fair comparison left is against the other messages that also shouted.
- Only the 1,000 spam messages that shouted. ::no The denominator is every message that could have produced the evidence you are holding, which is all 1,080 that shouted. Divide by 100,000 and you have answered a question nobody asked. Divide by the 1,000 spam shouts alone and you get 1, which would say the word WINNER is proof.

=== step === concept
## Why 80 false alarms decide the answer

Look again at where the two shouting leaves came from. The 1,000 came out of a group of 20,000. The 80 came out of a group of 80,000, which is four times bigger.

That is why the legitimate side carries so much more weight than its tiny rate suggests. A rate of 0.1% sounds like nothing until you apply it to 80,000 messages.

Those 80 messages have a name: **false alarms**, or false positives. They are the innocent mail that happens to carry the evidence anyway.

The code below uses a word you will meet everywhere in this corner of the subject. Filters call legitimate mail **ham**, the opposite of spam, and that is all `ham_rates` means.

Let's hold the spam side still and move only the false-alarm rate.

```r
# Recount the answer at three different rates for legitimate mail shouting WINNER
ham_rates <- c(0.0002, 0.001, 0.005)
false_alarms <- 80000 * ham_rates

data.frame(
  pct_of_legit_shouting = 100 * ham_rates,
  false_alarms          = false_alarms,
  all_flagged           = 1000 + false_alarms,
  share_spam            = round(1000 / (1000 + false_alarms), 3)
)
#>   pct_of_legit_shouting false_alarms all_flagged share_spam
#> 1                  0.02           16        1016      0.984
#> 2                  0.10           80        1080      0.926
#> 3                  0.50          400        1400      0.714
```

The spam side never moves. There are 1,000 spam shouts in every row, because 5% of 20,000 is 1,000 whatever the other side is doing.

The answer moves anyway, all the way from 0.984 down to 0.714. Pick a word that legitimate mail uses 1 time in 200 instead of 1 time in 1,000, and a flag that was nearly proof becomes a 5 in 7 chance. That is a good deal weaker.

[NOTE]
The false-alarm branch sets the ceiling. However strong the evidence is on the guilty side, the answer can never climb past what the innocent side lets through, because those false alarms sit in the denominator and nothing takes them out.

=== step === tryit
## Your turn: recount when legitimate mail shouts ten times as often

Suppose the filter looks at a noisier word than WINNER. Legitimate mail uses it 1% of the time, ten times as often, while spam still uses it 5% of the time. Everything else about the mailbox stays put.

Count the two piles and work out the share of the shouting messages that is spam.

```r
# Recount the share of shouting messages that is spam when 1% of legitimate mail shouts
# The mailbox is still 20,000 spam and 80,000 legitimate messages.
# 5% of the spam shouts the word.
# 1% of the legitimate mail now shouts it too.
# Count each pile, then divide. Press Check when you have it.
```
::check {"regex": "80000\\s*[*]\\s*0?\\.01|0?\\.01\\s*[*]\\s*80000|\\b800\\b|\\b1800\\b", "gate": true, "difficulty": "beginner", "ok": "That is it: 1,000 spam shouts against 800 false alarms, so 1000 / 1800 is 0.556. Ten times the false-alarm rate and the word has almost stopped saying anything.", "no": "Take the two groups one at a time. The spam side is 20000 * 0.05, which has not changed. The legitimate side is now 80000 * 0.01. Then divide the spam count by the two counts added together."}
::solution
```r
# The same counting with legitimate mail shouting ten times as often
spam_shouts <- 20000 * 0.05
ham_shouts  <- 80000 * 0.01

spam_shouts
#> [1] 1000

ham_shouts
#> [1] 800

spam_shouts / (spam_shouts + ham_shouts)
#> [1] 0.5555556
```

That is 800 false alarms against 1,000 real ones. The word still says something, but a message that shouts is now only barely likelier to be junk than not. Belief climbed from 0.20 to 0.556 and stopped there.

=== step === concept
## The four numbers you have been counting
::prose-only the four numbers are already on the page in the tree and the two tables; naming them adds no new picture

Everything so far was counting. Now let's put the standard names on what you counted, because these names are how the rest of the world talks about it.

- The **prior** is 0.20. The share of the mailbox that is spam, believed before a word is read.
- The **likelihood** is 0.05. How often a spam message shouts WINNER.
- The **false-alarm rate** is 0.001. How often a legitimate message shouts WINNER. It applies to the other 0.80 of the mailbox, the part that is not spam.
- The **evidence** is 1,080 messages. Every message that shouted, from either side, which is 1.08% of the mailbox.

And the answer, 0.926, is the **posterior**: what you believe once the evidence has arrived. Prior before, posterior after, and the two rates are what carried you from one to the other.

=== step === concept
## Bayes' theorem, that same counting divided through

Here is where the formula comes from, and it is a smaller step than you would expect.

Take the counting you just did and divide every count in it by 100,000. The 1,000 spam shouts become 0.01 of the mailbox, and that 0.01 is 0.05 times 0.20, because the 1,000 was 5% of the 20,000 and the 20,000 was 20% of the whole. The 80 false alarms become 0.0008, which the same way is 0.001 times 0.80. The answer does not move, because dividing the top and the bottom by the same number leaves a share exactly where it was.

What you are left with is this.

\[ P(\text{spam} \mid \text{WINNER}) = \frac{P(\text{WINNER} \mid \text{spam})\,P(\text{spam})}{P(\text{WINNER} \mid \text{spam})\,P(\text{spam}) + P(\text{WINNER} \mid \text{legit})\,P(\text{legit})} \]

The vertical bar is read as "given". So \(P(\text{spam} \mid \text{WINNER})\) is said out loud as "the probability it is spam, given that it shouted WINNER", and that is the posterior you have been counting all along.

The top of the fraction is the spam leaf of the tree. The bottom is both shouting leaves added up. Let's write it as a function and hand it the mailbox's own three numbers.

```r
# Bayes theorem written out: prior in, two rates in, updated belief out
bayes_spam <- function(prior, rate_spam, rate_ham) {
  numerator <- rate_spam * prior
  evidence  <- rate_spam * prior + rate_ham * (1 - prior)
  numerator / evidence
}

bayes_spam(prior = 0.20, rate_spam = 0.05, rate_ham = 0.001)
#> [1] 0.9259259
```

That is 0.9259259, the number the counting gave, down to the last digit.

That is worth saying plainly. The formula is not a second method that happens to agree with the counting. It is the counting, written in shares instead of in messages.

=== step === quiz
## Quick check: which number is the prior?

Four numbers have been in play: 0.05, 0.20, 0.001 and 0.926. Which one of them is the prior?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- 0.05 ::no
- 0.20 ::ok Right. It is what you believed before the word arrived, and it came straight from the share of the history that was spam.
- 0.926 ::no
- 0.001 ::no The prior is the belief you hold before any evidence, which here is 0.20. The 0.05 is the likelihood, how often spam shouts. The 0.001 is the false-alarm rate on the legitimate side. And 0.926 is the posterior, which is where you finished, not where you started.

=== step === concept
## What happens when you read the evidence backwards

Here are two sentences about this mailbox, and both of them are true:

- 5% of spam messages shout WINNER.
- 92.6% of the messages that shout WINNER are spam.

They are built from the same four counts, and they are nowhere near each other. Let's take both of them off the same table.

```r
# Read the same table both ways, from sender to word and from word to sender
counts <- table(spam = mailbox$spam, winner = mailbox$winner)

# Of the spam, what share shouts WINNER?
counts["TRUE", "TRUE"] / sum(counts["TRUE", ])
#> [1] 0.05

# Of the shouting messages, what share is spam?
counts["TRUE", "TRUE"] / sum(counts[, "TRUE"])
#> [1] 0.9259259
```

The number on top is the same in both lines, the 1,000. The only thing that changed is what went underneath: the row total for the first, the column total for the second.

The first runs from the sender to the word. The second runs from the word to the sender. Swapping them is the most common error in this whole subject, and it has a name: **the flipped conditional**, sometimes called confusion of the inverse.

Here is a version nobody falls for. Almost everyone who has been struck by lightning was standing outdoors at the time. That tells you nothing at all about how risky it is to stand outdoors. Right? Same two directions, and this time the gap is obvious. In the mailbox the gap is just as wide, 0.05 against 0.926, and much harder to see.

=== step === quiz
## Quick check: which sentence reads it backwards?

All four sentences below are about the same mailbox. Three of them state a real number correctly. One takes a true number and points it in the wrong direction. Which one?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- Of the messages that shout WINNER, about 93 in 100 are spam. ::no
- Of the spam messages, 5 in 100 shout WINNER. ::no
- Of the spam messages, about 93 in 100 shout WINNER. ::ok Yes, that is the flip. 0.926 is the share of the shouting pile that is spam, not the share of spam that shouts. The share of spam that shouts is 5 in 100, which was one of the two rates you started with.
- Of the legitimate messages, 1 in 1,000 shouts WINNER. ::no Three of these four read straight off the table: 1,000 out of the 1,080 shouting messages are spam, 1,000 out of 20,000 spam messages shout, and 80 out of 80,000 legitimate messages shout. The odd one out takes 0.926, which describes the shouting pile, and reattaches it to the spam pile.

=== step === concept
## Change the base rate and the same word means something else

The two rates have been fixed all the way through. Spam shouts 5% of the time and legitimate mail shouts 0.1% of the time, and those are facts about the word, not about your mailbox.

The prior is different. It is a fact about whose inbox this is. A public address that has been scraped for twenty years is mostly junk. A fresh work address behind a corporate filter is almost entirely real mail.

So let's hold the word still and move the mailbox instead.

```r
# Move only the share of the mailbox that is spam and watch the same word change value
priors <- c(0.02, 0.20, 0.60)

data.frame(
  prior      = priors,
  after_word = round(bayes_spam(priors, rate_spam = 0.05, rate_ham = 0.001), 3)
)
#>   prior after_word
#> 1  0.02      0.505
#> 2  0.20      0.926
#> 3  0.60      0.987
```

One word gives three different answers. In the clean mailbox that is only 2% junk, a WINNER flag leaves you at a coin flip. In the dirty one that is 60% junk, the very same flag takes you to 98.7%.

[KEY INSIGHT]
Evidence does not carry a fixed meaning. What a piece of evidence is worth to you depends on what you believed before it arrived, which is exactly why the prior sits inside the formula rather than beside it.

This is also the answer to the usual complaint that Bayes' theorem makes you invent a starting number. You are not inventing it. You are admitting that you already had one.

=== step === concept
## The same arithmetic on a medical test

Nothing in that function knows it is looking at email. Swap the nouns and it works on anything that has two possibilities and a test that is sometimes wrong.

Take the classic case. A disease affects 1 person in every 1,000. There is a test for it that is right 99% of the time in both directions: it catches 99% of the people who have the disease, and it correctly clears 99% of the people who do not.

Line those three numbers up against the mailbox and every one of them has a match. Having the disease is the prior, 0.001. Catching it is the likelihood, 0.99. And clearing 99% of healthy people means the test still flags the other 1% of them, so the false-alarm rate is 0.01.

You test positive. What is the chance you have it?

```r
# The same function, called with a screening test's three numbers
bayes_spam(prior = 0.001, rate_spam = 0.99, rate_ham = 0.01)
#> [1] 0.09016393
```

Nine percent.

The test is right 99% of the time, and a positive result still leaves you far likelier to be well than sick. The reason is the one you already watched in the mailbox. Out of 100,000 people, 100 have the disease and 99 of them test positive. The other 99,900 are healthy, and 1% of them, which is 999 people, test positive anyway. That is 999 false alarms against 99 real ones, and 99 out of 1,098 is 9%.

[WARNING]
A test being 99% accurate is a statement about the test. Whether your positive result is real is a statement about you, and it depends on how likely you were to have the disease before you walked in. Same test, different patient, different answer.

=== step === quiz
## Practice: which change would move the answer the most?

Back to the mailbox: a prior of 20%, spam shouting 5% of the time, legitimate mail shouting 0.1% of the time, and an answer of 0.926. Three changes are on offer, one at a time. Which one moves the answer furthest from 0.926?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Halving the false-alarm rate, from 0.1% to 0.05%. ::no
- Halving the share of the mailbox that is spam, from 20% to 10%. ::ok Right, and it is the only one of the three that moves the answer down. It lands on 0.847, a drop of 0.079, while either change to the rates lifts the answer to 0.962, a rise of 0.036.
- Doubling the rate at which spam shouts, from 5% to 10%. ::no
- None of them, because 0.926 is fixed by the word WINNER itself. ::no All three of them do something. Halving the false-alarm rate and doubling the spam rate both land on 0.962, because each one doubles the ratio of real flags to false ones. Halving the prior pulls the answer down to 0.847, the biggest move of the three, which is why the base rate deserves more of your attention than it usually gets.

=== step === tryit
## Practice: a word that pushes belief the other way

Every update so far has pushed belief upwards. It does not have to.

The filter now looks at a different word: invoice. It turns up in 2% of spam and in 4% of legitimate mail, because real people send real invoices. The mailbox is unchanged at 20% spam, so the prior is still 0.20.

Work out what seeing the word invoice does to that belief.

```r
# Work out what the word invoice does to the same 20% starting belief
# bayes_spam(prior, rate_spam, rate_ham) is already defined and ready to call.
# invoice appears in 2% of spam and in 4% of legitimate mail.
# One line. Press Check when you have it.
```
::check {"regex": "bayes_spam\\s*[(][^)]*[^0-9.]0?\\.04(?![0-9])", "gate": true, "difficulty": "intermediate", "ok": "That is it: 0.111. Belief fell from 0.20 down to 0.111, because a word that legitimate mail uses twice as often as spam is evidence that the message is legitimate.", "no": "Call the function with the prior first, then the spam rate, then the legitimate rate: bayes_spam(prior = 0.20, rate_spam = 0.02, rate_ham = 0.04). Nothing else about the mailbox changes."}
::solution
```r
# The word invoice pushes belief down instead of up
bayes_spam(prior = 0.20, rate_spam = 0.02, rate_ham = 0.04)
#> [1] 0.1111111
```

Belief went in at 0.20 and came out at 0.111, which is lower than where it started.

That is still an update, and it is still the same arithmetic. Evidence that is more common in the innocent group than in the guilty one pushes belief down, and the formula does that without being told to.

=== step === quiz
## Practice: saying the test result out loud without getting it wrong

You tested positive on that screening test: 1 person in 1,000 has the disease, and the test is right 99% of the time in both directions. Which sentence states the result correctly?

::quiz {"correct": 4, "gate": true, "difficulty": "intermediate"}
- A positive result means about a 99% chance of having the disease. ::no
- The test is wrong about 91% of the time. ::no
- About 9% of people have the disease. ::no The 9% belongs to one group and one group only: the people who tested positive. It is not the share of everyone who is ill, which is 1 in 1,000, and it is not a measure of the test, which is right 99% of the time in both directions. Reading that 99% as your chance of being ill is the flipped conditional again, because 99% is how often the test catches a sick person, not how often a positive person is sick.
- Of everyone who tests positive, about 9 in 100 turn out to have the disease. ::ok Exactly. It runs from the result back to the person, which is the direction you care about, and it keeps the 9% attached to the group it actually describes.

=== step === concept
## References

- [An Essay towards solving a Problem in the Doctrine of Chances](https://doi.org/10.1098/rstl.1763.0053) - Bayes (1763), Philosophical Transactions of the Royal Society of London 53, 370-418. The original statement, published two years after his death.
- [How to improve Bayesian reasoning without instruction: frequency formats](https://doi.org/10.1037/0033-295X.102.4.684) - Gigerenzer and Hoffrage (1995), Psychological Review 102(4), 684-704. The evidence that counting messages is far easier to reason about than multiplying probabilities, which is why the mailbox came before the formula here.
- [A Bayesian Approach to Filtering Junk E-Mail](https://www.aaai.org/Library/Workshops/1998/ws98-05-009.php) - Sahami, Dumais, Heckerman and Horvitz (1998), AAAI Workshop on Learning for Text Categorization. The paper that put this arithmetic inside real spam filters.
- [Helping Doctors and Patients Make Sense of Health Statistics](https://doi.org/10.1111/j.1539-6053.2008.00033.x) - Gigerenzer, Gaissmaier, Kurz-Milcke, Schwartz and Woloshin (2007), Psychological Science in the Public Interest 8(2), 53-96. How often doctors misread a positive test, and what fixes it.
- [Statistical Inference, 2nd edition](https://archive.org/details/statisticalinfer0000case) - Casella and Berger (2002), section 1.3. Conditional probability and Bayes' rule stated formally.

=== step === complete
## Quick recap

You did not memorise anything. You built a mailbox, threw away the quiet messages, and counted what was left.

- The prior is what you believe before the evidence. Here it was 0.20, the share of the history that was spam.
- The answer is the share of the pile that carries the evidence: 1,000 spam shouts out of 1,080 shouts in all, which is 0.926.
- The formula is that same counting divided through by 100,000. `bayes_spam()` returned 0.9259259, digit for digit what the counting gave.
- What goes in the denominator is every message that shouted, of either kind. The false alarms on the innocent side set the ceiling, which is why 80 messages out of 80,000 mattered so much.
- The direction matters. 5% of spam shouts WINNER and 92.6% of shouting messages are spam, and mixing those two up is the most expensive mistake in the subject.
- Move the prior and the same word means something else, from 0.505 in a clean mailbox to 0.987 in a dirty one.

Belief in, evidence in, updated belief out. The next time somebody tells you a test is 99% accurate, you will know the question to ask back: accurate at what, and how common is the thing it is looking for?

That is Bayes' theorem, and you got there by counting. Have a great day.
