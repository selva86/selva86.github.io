---
title: "Causal Inference from Data Lesson 1: What a causal effect actually is"
catalog_blurb: "The two numbers behind every causal effect, and why only one is ever seen."
description: "A coupon test at a fictional store reveals the two numbers behind every causal effect, why real data only shows one of them, and how randomization fixes that."
keywords: "causal inference, potential outcomes, treatment effect, confounding, randomization, average treatment effect, ATE, ATT, R"
post_type: "LESSON"
curriculum_id: "4.130.1"
webr: true
mathjax: false
lesson_access: "free"
course_id: "res-causal"
course_title: "Causal Inference from Data"
course_lesson: "1"
course_total: "8"
course_landing: "Causal-Inference-from-Data-Course.html"
course_next: "Drawing-the-Assumptions-You-Cannot-Test"
course_prev: ""
---

=== step === cover
## What a causal effect actually is

Today let's understand what a causal effect actually is, the idea underneath every claim that one thing caused another.

Here's the example we'll use throughout. Nora runs an online kitchenware store. She is deciding whether to email a $10 coupon to her customers, and she wants to know one thing: does the coupon raise how much a customer spends at her store over the next month?

To answer that, picture each customer having two numbers attached to them. One is what they would spend next month if they got the coupon. The other is what they would spend next month if they did not. Below are eight of Nora's customers, with both numbers already filled in for each one, something you would never actually get to see in real life.

::widget styled-table {"cols": ["customer", "spend_with_coupon", "spend_without_coupon"], "rows": [[1,120,100],[2,150,130],[3,90,60],[4,200,150],[5,80,80],[6,110,90],[7,175,140],[8,60,70]], "formats": {"spend_with_coupon": "dollar", "spend_without_coupon": "dollar"}, "title": "One month, two numbers per customer", "note": "Each customer has two numbers: what they would spend with the coupon, and what they would spend without it."}

Look at that table again. For each customer, what would it even mean for the coupon to turn that top number into the bottom one, or the bottom into the top?

=== step === concept
## The two numbers behind every causal effect

Statisticians have names for those two numbers. The one under treatment, that is with the coupon, is written Y(1). The one without it is written Y(0). The 1 stands for got the treatment, and the 0 stands for did not. Y(1) and Y(0) are called the potential outcomes of that customer, because each one describes something that could potentially happen to them, depending on which version of the world they end up in.

Take customer 4. With the coupon, Y(1) is 200 dollars. Without it, Y(0) is 150 dollars. The causal effect of the coupon on customer 4 is the difference between those two numbers, 200 minus 150, which is 50 dollars. Sending the coupon to customer 4 raises their spend by 50 dollars.

Now take customer 8. With the coupon, Y(1) is 60 dollars. Without it, Y(0) is 70 dollars. The causal effect is 60 minus 70, which is -10 dollars. For customer 8, the coupon actually lowers spend by 10 dollars. A causal effect can run negative. The coupon does not have to help, and when it does help, it does not have to help everyone by the same amount.

Every customer's causal effect is built the same way: Y(1) minus Y(0). Build the full table in R, with that effect column added for all eight customers.

```r
# Build the 8 customers' two potential outcomes and their causal effect
customers <- data.frame(
  customer = 1:8,
  Y1 = c(120, 150, 90, 200, 80, 110, 175, 60),
  Y0 = c(100, 130, 60, 150, 80, 90, 140, 70)
)
customers$effect <- customers$Y1 - customers$Y0
customers
#>   customer  Y1  Y0 effect
#> 1        1 120 100     20
#> 2        2 150 130     20
#> 3        3  90  60     30
#> 4        4 200 150     50
#> 5        5  80  80      0
#> 6        6 110  90     20
#> 7        7 175 140     35
#> 8        8  60  70    -10
```

`Y1` holds each customer's spend with the coupon, `Y0` holds their spend without it, and `effect` is `Y1` minus `Y0`. Customer 5 has an effect of 0, the coupon changes nothing for them. Customer 4 has the largest effect, 50 dollars. Customer 8 is the only one whose effect is negative.

=== step === widget
## The one number you never actually see

There is a catch, though. Nora never gets to see the table you just built. In real life, each customer either gets the coupon or does not, never both. If a customer gets the coupon, Nora can observe what they actually spent, which is Y(1). But Y(0), what that same customer would have spent without it, never happens. It is not hidden somewhere waiting to be found. It simply never occurs.

[KEY INSIGHT]
This is called the fundamental problem of causal inference: for any one customer, you only ever observe one of their two potential outcomes, never both. Whichever one did not happen is not just unknown. It is unknowable from that customer alone.

Nora actually sent the coupon to customers 1, 2, 4 and 7, her four biggest spenders at the time. Customers 3, 5, 6 and 8 did not get it. Apply that real send to the table from the last step, and here is what Nora can actually observe.

::widget styled-table {"cols": ["customer", "got_coupon", "spend_with_coupon", "spend_without_coupon"], "rows": [[1,"yes",120,"?"],[2,"yes",150,"?"],[3,"no","?",60],[4,"yes",200,"?"],[5,"no","?",80],[6,"no","?",90],[7,"yes",175,"?"],[8,"no","?",70]], "formats": {"spend_with_coupon": "dollar", "spend_without_coupon": "dollar"}, "title": "What Nora actually observes", "note": "The question mark marks the potential outcome that never happened for that customer."}

Every question mark in that table is a number that is gone for good, not a number Nora forgot to write down.

=== step === widget
## Why comparing the groups you happened to see can mislead you

So if Nora cannot see both numbers for anyone, how can she ever learn the coupon's effect? The obvious thing to try is comparing the customers who got the coupon to the customers who did not, using only what she can actually observe.

```r
# Compare the average observed spend of the treated and untreated customers
sent_targeted <- customers$customer %in% c(1, 2, 4, 7)
observed <- ifelse(sent_targeted, customers$Y1, customers$Y0)
treated_mean <- mean(observed[sent_targeted])
control_mean <- mean(observed[!sent_targeted])
treated_mean
#> [1] 161.25
control_mean
#> [1] 75
treated_mean - control_mean
#> [1] 86.25
```

The customers who got the coupon spent 161.25 dollars on average. The customers who did not spent 75 dollars on average. The gap between them is 86.25 dollars, and on its face that looks like a huge win for the coupon.

But go back to the full table from two steps ago, the one Nora cannot see. Averaged honestly from both potential outcomes, the true effect for just those four targeted customers is 31.25 dollars, and the true effect across all eight customers is 20.625 dollars. Either way, the naive 86.25-dollar gap overstates the coupon's real effect by a wide margin.

Why does the naive comparison come out so much higher than either true number? Because Nora did not send the coupon at random. She targeted her four biggest existing spenders, customers who were already spending more than the others before any coupon existed. Part of that 86.25-dollar gap is the coupon. The rest of it is simply that the treated group was a higher-spending group to begin with, coupon or no coupon.

This is called confounding: a third factor, here a customer's prior spending, that affects both whether they got the coupon and what they go on to spend. It is drawn as a causal diagram, a picture where an arrow from one variable into another means the first causes the second.

In the diagram below, X is the treatment, the coupon. Y is the outcome, next month's spend. Z is the confounder, standing in for a customer's existing spend tier. Z has an arrow into X, because customers with a high spend tier were the ones chosen to get the coupon. Z also has an arrow into Y, because a customer's existing spend tier affects next month's spend directly, coupon or not.

::widget causal-dag {}

The diagram's default view is exactly this confounder pattern: Z points into both X and Y, which opens a path from X to Y that has nothing to do with the coupon itself. That extra path, running through spend tier, is the back door the 86.25-dollar gap travelled through.

=== step === quiz
## Quick check: why the $86.25 gap is not the coupon's effect

Nora's naive comparison showed treated customers spending 86.25 dollars more than untreated ones. Which of these explains why that gap overstates the coupon's true effect?

::quiz {"correct": 1, "gate": true, "difficulty": "beginner"}
- The four treated customers were already Nora's biggest spenders before she sent anyone a coupon, so some of the gap is that pre-existing difference, not the coupon. ::ok Right. That is confounding: spend tier affected who got the coupon, and it also affects next month's spend on its own, which inflates the naive gap on both counts.
- Eight customers is too small a sample to tell anything from. ::no
- A $10 coupon is too small to move spending by that much. ::no The sample size and the coupon's size are not what broke this comparison. What broke it is that the treated and untreated groups already differed before the coupon existed, which is exactly the confounding the diagram showed in the last step.

=== step === concept
## Randomization does not reveal the missing number, it balances the groups

So targeting the coupon by existing spend was the mistake. What if Nora had assigned the coupon by a coin flip instead, with no regard to how much a customer already spent?

[NOTE]
A coin flip cannot make a missing potential outcome appear. Customer 1's Y(0) is still never observed once customer 1 gets the coupon. What randomization buys instead is comparability: it makes the treated and untreated groups alike on everything else, spend tier included, because which group a customer lands in no longer depends on their spend tier, or on anything else about them.

Try one random split: customers 1, 3, 6 and 7 get the coupon, customers 2, 4, 5 and 8 do not.

```r
# Recompute the observed averages under a random coupon assignment
sent_random <- customers$customer %in% c(1, 3, 6, 7)
observed_random <- ifelse(sent_random, customers$Y1, customers$Y0)
mean(observed_random[sent_random])
#> [1] 123.75
mean(observed_random[!sent_random])
#> [1] 107.5
mean(observed_random[sent_random]) - mean(observed_random[!sent_random])
#> [1] 16.25
```

This naive gap comes out to 16.25 dollars, much closer to the true 20.625-dollar average effect than the targeted design's 86.25 dollars. It is not exact. Eight customers is still too few for any one random split to land precisely on 20.625. But the gap is no longer pulled in one direction by a confounder, because spend tier no longer decides who gets the coupon.

Go back to the diagram from two steps ago. Randomization severs the arrow from spend tier into the coupon. Spend tier can still affect next month's spend directly, that arrow stays, but it no longer also decides who gets the coupon. With that one arrow cut, there is no back door left from the coupon to the outcome, which is exactly what makes the naive comparison trustworthy again.

=== step === concept
## Two different averages, two different questions: ATE and ATT

The true effects used in the last two steps deserve their own names, because one dataset can produce more than one honest average effect, depending on whose effects you average.

Average the effect column over all eight customers, and you get the average treatment effect, written ATE. Average it over just the four customers Nora actually targeted, customers 1, 2, 4 and 7, and you get the average treatment effect on the treated, written ATT.

```r
# Compute the ATE over everyone and the ATT over the targeted group
ate <- mean(customers$effect)
att <- mean(customers$effect[customers$customer %in% c(1, 2, 4, 7)])
ate
#> [1] 20.625
att
#> [1] 31.25
```

The ATE is 20.625 dollars. The ATT is 31.25 dollars. They are different numbers from the same eight customers, because customers 1, 2, 4 and 7 happen to have above-average effects, 20, 20, 50 and 35 dollars, against the full table's average of 20.625.

This is not a quirk of this one example. The ATT only covers the group that actually got treated, and that group can respond differently from everyone else. A fully randomized send across all eight customers, like the one in the last step, lands on an estimate of the ATE, because every customer has an equal chance of ending up in either group. A program that only ever reaches one particular group, like Nora's original targeted send to her top four spenders, can at best tell you that group's own ATT, never the ATE for customers who were never going to get the coupon in the first place.

=== step === tryit
## Your turn: compute a customer's effect and the group's average

Try this yourself. A ninth customer joins Nora's data: with the coupon, Y(1) = 140 dollars, and without it, Y(0) = 120 dollars. The code below adds this customer to the table, but leaves their effect as `NA`.

```r
# A 9th customer joins the table: Y(1) = 140, Y(0) = 120
ninth <- data.frame(customer = 9, Y1 = 140, Y0 = 120, effect = NA)
all_nine <- rbind(customers[, c("customer", "Y1", "Y0", "effect")], ninth)
all_nine
#>   customer  Y1  Y0 effect
#> 1        1 120 100     20
#> 2        2 150 130     20
#> 3        3  90  60     30
#> 4        4 200 150     50
#> 5        5  80  80      0
#> 6        6 110  90     20
#> 7        7 175 140     35
#> 8        8  60  70    -10
#> 9        9 140 120     NA
```

Replace the `NA` in `ninth` with the ninth customer's own causal effect, Y(1) minus Y(0). Then add one line that computes the mean of the effect column over all nine rows, `all_nine$effect`. That new mean is the ATE updated with a ninth customer. Press Check when you have both.

::check {"regex": "(?=[\\s\\S]*(140\\s*-\\s*120|ninth\\$Y1\\s*-\\s*ninth\\$Y0|Y1\\s*-\\s*Y0))(?=[\\s\\S]*mean\\s*[(]\\s*all_nine)", "gate": true, "difficulty": "intermediate", "ok": "Right. The ninth customer's effect is 140 minus 120, which is 20. Added to the other eight, the mean effect over all nine customers comes out to about 20.56, barely moved from the 20.625 you had with eight.", "no": "Replace the NA in ninth with the subtraction 140 - 120 (or ninth$Y1 - ninth$Y0), then add a line that calls mean() on the effect column of all_nine, such as mean(all_nine$effect)."}
::solution
```r
# A 9th customer joins the table: Y(1) = 140, Y(0) = 120
ninth <- data.frame(customer = 9, Y1 = 140, Y0 = 120, effect = 140 - 120)
all_nine <- rbind(customers[, c("customer", "Y1", "Y0", "effect")], ninth)
all_nine
#>   customer  Y1  Y0 effect
#> 1        1 120 100     20
#> 2        2 150 130     20
#> 3        3  90  60     30
#> 4        4 200 150     50
#> 5        5  80  80      0
#> 6        6 110  90     20
#> 7        7 175 140     35
#> 8        8  60  70    -10
#> 9        9 140 120     20
mean(all_nine$effect)
#> [1] 20.55556
```

185 divided by 9 is about 20.56, barely different from the 20.625 you had with eight customers, because this ninth customer's effect, 20, sits close to the group's average.

=== step === quiz
## Quick check: what a randomized comparison is really estimating

Suppose Nora runs a brand new coupon send, this time deciding by a coin flip whether each customer gets the coupon, with no regard to how much anyone already spends. Comparing the treated and untreated groups afterward estimates which quantity?

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- The average treatment effect (ATE) over everyone who could have been sent the coupon or not. ::ok Right. Every customer had an equal chance of landing in either group, so the comparison is a fair stand-in for the effect averaged over all of them, which is exactly what the ATE is.
- The average treatment effect on the treated (ATT) of Nora's original targeted group from before. ::no
- The individual causal effect of one specific customer in the new send. ::no A coin-flip send gives every customer an equal chance of either group, which is what makes the comparison a stand-in for the ATE over everyone in it. It is not the ATT of a different, earlier targeted group, and no single comparison of group averages can isolate one customer's individual effect, since that would still need both of that one customer's potential outcomes.

=== step === concept
## References
::prose-only the sources are text, not a visual

- [Estimating Causal Effects of Treatments in Randomized and Nonrandomized Studies](https://doi.org/10.1037/h0037350) - Rubin, D.B. (1974), Journal of Educational Psychology, 66(5), 688-701. The potential-outcomes framework this lesson builds Y(1) and Y(0) from.
- [Statistics and Causal Inference](https://doi.org/10.2307/2289064) - Holland, P.W. (1986), Journal of the American Statistical Association, 81(396), 945-960. Names the fundamental problem of causal inference and works through what randomization buys you.
- [Causal Inference for Statistics, Social, and Biomedical Sciences](https://www.cambridge.org/core/books/causal-inference-for-statistics-social-and-biomedical-sciences/71126BE90C58F1A431FE9B2DD07938AB) - Imbens, G.W., and Rubin, D.B. (2015), Cambridge University Press. A complete modern treatment of potential outcomes, from this lesson's definitions through estimation.
- [Mostly Harmless Econometrics](https://press.princeton.edu/books/paperback/9780691120355/mostly-harmless-econometrics) - Angrist, J.D., and Pischke, J-S. (2009), Princeton University Press. A practitioner's guide to the ATE and ATT and the designs built around them.
- [Causal Inference: What If](https://www.hsph.harvard.edu/miguel-hernan/causal-inference-book/) - Hernan, M.A., and Robins, J.M. (2020), Chapman and Hall/CRC. A free, rigorous text covering potential outcomes, confounding and randomization in depth.

=== step === complete
## What this gives you for every causal claim you read next

Here is Nora's honest answer. The coupon raises average monthly spend by about $20.63, the ATE across all eight customers, and that number is trustworthy only because the comparison behind it was randomized rather than built from two groups that already differed before the coupon arrived.

From now on, when you read a claim that one thing caused another, you have two questions to ask. What are the two potential outcomes being compared, and for the units in this claim, were they actually assigned at random? If the answer to the second question is no, treat the comparison the way you treated Nora's targeted send: a real number, just not necessarily the treatment's effect.

Next: how to draw the assumptions behind a comparison as a precise diagram, and how that diagram tells you when controlling for a variable helps and when it quietly makes things worse.
