---
title: "Causal Inference Lesson 1: Correlation, Causation and Potential Outcomes"
catalog_blurb: "Why correlation is not causation, and what a real causal effect actually means."
description: "Why a correlation is never proof of cause: how a confounder fakes an effect, what a potential-outcomes causal effect is, and how randomizing recovers it."
keywords: "correlation vs causation, potential outcomes, counterfactual, confounding, average treatment effect, ATE, selection bias, randomization, causal inference in R, Rubin causal model"
post_type: "LESSON"
curriculum_id: "6.10.1"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-causal"
course_title: "Causal Inference in R"
course_lesson: "1"
course_total: "5"
course_landing: "R-Causal-Inference-Course.html"
course_next: "Causal-Diagrams-with-DAGs.html"
course_prev: ""
---

=== step === cover
::eyebrow Lesson 1 of 5
## Correlation, Causation and Potential Outcomes

Riverside Books, a small online bookshop, emailed a $10 coupon to some of its customers. The next month, the customers who got a coupon spent far more than the ones who did not. Marketing wants to declare victory: the coupon works, send it to everyone.

Before they do, look at the pattern below. Each dot is a customer: how loyal they were last year (across the bottom) against what they spent this month (up the side). It is a strong, real correlation, and it is exactly the kind of picture that fools people. This whole lesson is about the hard question hiding inside it: when does a pattern like this actually mean one thing *causes* another?

By the end of this lesson you will be able to:

- Explain why a correlation between two things does not prove that one causes the other
- Define a causal effect honestly, using the potential-outcomes idea at the heart of modern causal inference
- See, in real R, why the coupon's raw $18 "effect" is mostly an illusion, and how randomizing the coupon recovers its true $8 effect

**Prerequisites:** you can run R and take a mean, and you can read a scatterplot. Every new term is defined as it appears.

::widget chart-plotter {"data":[{"x":1.2,"y":75},{"x":0.86,"y":65},{"x":1.74,"y":72},{"x":-2.74,"y":15},{"x":-0.15,"y":59},{"x":-0.74,"y":35},{"x":-0.95,"y":37},{"x":-0.81,"y":28},{"x":0.11,"y":42},{"x":1.65,"y":69},{"x":0.19,"y":45},{"x":-1.42,"y":30},{"x":-0.13,"y":46},{"x":-1.14,"y":47},{"x":-0.4,"y":42},{"x":0.8,"y":57},{"x":-0.45,"y":42},{"x":0.45,"y":59}],"geoms":["point"],"x":"loyalty","y":"spend"}

=== step === concept
::eyebrow The pattern
## The gap Riverside Books sees

Let us put real numbers on the story. We will build Riverside Books' customer records right here, because each lesson runs in its own fresh R session. Each row is one customer, with three things we observe: their `loyalty` last year (a score centered at 0, where positive means more engaged), whether marketing emailed them a `coupon`, and their `spend` the next month in dollars.

Because this is a simulation, we can also secretly store two extra columns, `y0` and `y1`: the spend we *would* see for that customer without and with a coupon. Hold on to those, they are the whole trick of this lesson, and in real life you never get to see them.

```r
# Riverside Books: one row per customer.
set.seed(2024)
n  <- 2000
loyalty <- round(rnorm(n), 2)                      # last year's engagement, centered at 0
y0 <- round(45 + 10 * loyalty + rnorm(n, 0, 5))    # dollars spent WITHOUT a coupon
y1 <- y0 + 8                                        # WITH a coupon: a real +$8 for everyone
coupon <- rbinom(n, 1, plogis(1.2 * loyalty))      # marketing emailed loyal customers more
spend  <- ifelse(coupon == 1, y1, y0)              # you observe only ONE of y0, y1 per person
books  <- data.frame(loyalty, coupon, y0, y1, spend)

round(tapply(books$spend, books$coupon, mean), 1)  # average spend: no coupon vs coupon
#>    0    1
#> 40.2 58.0
```

There it is, the pattern marketing noticed: customers who got a coupon spent about **$58** on average, against **$40** for those who did not, a gap of about **$17.80**. The two variables, "got a coupon" and "spend," clearly move together. In the language of the earlier EDA lessons they are *correlated*: knowing one tells you something about the other.

A correlation is just a measured association. For two numbers it is summarized by Pearson's \(r\),

\[ r = \frac{\sum_i (x_i - \bar x)(y_i - \bar y)}{\sqrt{\sum_i (x_i - \bar x)^2}\;\sqrt{\sum_i (y_i - \bar y)^2}} \]

where \(x_i\) and \(y_i\) are the two measurements for customer \(i\), and \(\bar x, \bar y\) are their averages. The \(r\) on the cover scatter is about 0.9. But \(r\), and the $17.80 gap, are both silent about one thing: *why*.

=== step === concept
::eyebrow Why the gap lies
## A confounder is hiding in the gap

Here is what the average hides. Look again at how the coupons were handed out: `plogis(1.2 * loyalty)` means the more loyal a customer already was, the more likely marketing was to email them one. The coupon did not fall from the sky at random. It landed on the customers who were *already going to spend more anyway*.

So the coupon group and the no-coupon group were not comparable to begin with. The coupon group was stacked with loyal big spenders. Some of their extra $17.80 is the coupon doing real work, and some of it is just *who was in the group*. That second part has a name.

A **confounder** is a third variable that influences both who gets the treatment and the outcome. Here it is loyalty: it pushed customers toward getting a coupon, and it pushed their spending up on its own. Whenever a confounder is in play, a plain correlation blends the true effect with the confounder's shadow.

In fact, any time two things A and B are correlated, one of a few stories must be true:

1. A really does cause B (the coupon lifts spending).
2. B causes A (the reverse: big spenders get offered more coupons).
3. A confounder C causes both (loyalty drives coupons *and* spending).
4. It is a coincidence in a small sample.

[KEY INSIGHT]
A correlation tells you two things move together. It cannot, on its own, tell you which of those stories produced the pattern. That is why "correlation is not causation" is not a slogan but a genuine gap in what the data can prove.

=== step === quiz
::eyebrow Check yourself
## Spot the flaw

Riverside's team notices a second pattern: customers who installed the shop's app spend more than those who did not, and someone suggests the app itself drives the extra spending. What is the most important worry before believing the app *causes* higher spend?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The sample of app users is probably too small to trust ::no Sample size is a separate issue, and the shop has plenty of app users. Even with millions of them the comparison would still be broken, for the reason in the correct answer. More data does not fix a confounded comparison.
- The customers who bother to install the app are probably the keener shoppers already, so they would spend more even with no app at all ::ok Exactly. Keenness is a confounder: it pushes people toward installing the app AND toward spending more on their own. The app group and the no-app group were not comparable to start with, so the gap blends any real effect with that head start.
- A correlation this strong is very unlikely by chance, so it must be causal ::no A tiny p-value rules out "pure coincidence," but it says nothing about *why* the two move together. A confounder produces a strong, highly significant correlation just as easily as a true cause does.

=== step === concept
::eyebrow The honest definition
## Two worlds for one customer

To even ask whether the coupon *caused* Maya to spend more, we first have to say what "caused" means for one person. The clean way is to imagine two parallel worlds.

In one world, Maya gets the coupon; call what she spends there \(Y_{\text{Maya}}(1)\), read "Maya's outcome under treatment." In the other world everything about Maya is identical but she gets no coupon; call that \(Y_{\text{Maya}}(0)\), "her outcome under control." These two numbers are her **potential outcomes**, and her personal causal effect of the coupon is simply the difference:

\[ \tau_{\text{Maya}} = Y_{\text{Maya}}(1) - Y_{\text{Maya}}(0) \]

where \(\tau\) (tau) is the effect for that one customer: the extra dollars the coupon caused *for her*, with everything else held fixed. More generally, for customer \(i\) we write \(W_i = 1\) if they got the coupon and \(0\) if not, and their effect is \(\tau_i = Y_i(1) - Y_i(0)\).

Now the catch that makes causal inference hard. Picture three customers:

| Customer | Coupon? | Spend WITH, Y(1) | Spend WITHOUT, Y(0) | Effect |
|---|---|---|---|---|
| Maya | yes | **62** (seen) | ? never happened | ? |
| Leo | no | ? never happened | **41** (seen) | ? |
| Ada | yes | **70** (seen) | ? never happened | ? |

For every customer, exactly one column is real and the other is a **counterfactual**: a world that did not happen. Maya got the coupon, so we see her \(Y(1) = 62\) but never her \(Y(0)\). Leo got none, so we see his \(Y(0) = 41\) but never his \(Y(1)\). The effect column is all question marks, because an effect is a difference between two numbers and we only ever get one of them.

[KEY INSIGHT]
The **fundamental problem of causal inference**: for any single person you can observe at most one potential outcome, never both. An individual causal effect can never be measured directly, only reasoned about. Everything that follows is a way around this one wall.

=== step === concept
::eyebrow From one person to the average
## The effect we can chase, and the bias in the gap

If we can never get one person's effect, what *can* we get? The average. We give up on Maya's personal \(\tau\) and aim for the **average treatment effect** across all customers:

\[ \text{ATE} = \mathbb{E}\big[\,Y_i(1) - Y_i(0)\,\big] = \mathbb{E}[Y_i(1)] - \mathbb{E}[Y_i(0)] \]

where \(\mathbb{E}[\cdot]\) means "the average over all customers." In words: if *everyone* got a coupon versus if *no one* did, how much would average spend change? For Riverside that is the number worth knowing.

So why can we not just use the $17.80 gap for it? Write the gap in potential-outcome terms. What we actually computed was the average observed spend of the coupon group minus that of the no-coupon group. Because an observed spend is \(Y(1)\) for the treated and \(Y(0)\) for the untreated, that gap splits cleanly in two:

\[ \underbrace{\mathbb{E}[Y \mid W=1] - \mathbb{E}[Y \mid W=0]}_{\text{the naive gap}} = \underbrace{\mathbb{E}[Y(1) - Y(0) \mid W=1]}_{\text{real effect on the treated}} + \underbrace{\mathbb{E}[Y(0) \mid W=1] - \mathbb{E}[Y(0) \mid W=0]}_{\text{selection bias}} \]

The first piece is the honest effect for the customers who got a coupon. The second, **selection bias**, is the difference in the *no-coupon* spend between the two groups: how far apart they would have been even if no coupon had ever been sent. Since loyal big spenders were the ones handed coupons, that term is positive, and it inflates the gap. Because this is a simulation, we can measure all three numbers directly.

```r
ate      <- mean(books$y1 - books$y0)                                    # the true average effect
sel_bias <- mean(books$y0[books$coupon == 1]) - mean(books$y0[books$coupon == 0])
naive    <- mean(books$spend[books$coupon == 1]) - mean(books$spend[books$coupon == 0])
round(c(true_ATE = ate, selection_bias = sel_bias, naive_gap = naive), 2)
#>       true_ATE selection_bias      naive_gap
#>           8.00           9.82          17.82
```

There is the whole illusion in three numbers. The coupon's true effect is **$8**. Selection bias adds **$9.82**. Together they make the **$17.82** gap marketing saw (the same gap, the 40.2 and 58.0 you saw were just rounded), more than half of which is not the coupon at all, only loyal customers being loyal.

[WARNING]
The naive difference in means answers a causal question *only* when selection bias is zero, that is, only when the treated and untreated groups would have looked the same without any treatment. Whenever a confounder decides who gets treated, that condition fails and the raw gap is biased.

=== step === tryit
::eyebrow Your turn
## Measure the true effect

Because Riverside's records are simulated, both potential outcomes are sitting in `books`: `y1` (spend with a coupon) and `y0` (spend without). The true average treatment effect is just the average of their per-customer difference. Fill in the blank, then check it.

```r
ate <- mean(____)   # average of (spend WITH a coupon) minus (spend WITHOUT)
ate
```
::check {"regex":"books\\$y1\\s*-\\s*books\\$y0","gate":true,"difficulty":"intermediate","ok":"Right: mean(books$y1 - books$y0) = 8. In a simulation you can compute the ATE directly because you planted both potential outcomes. With real data you never can, which is the whole difficulty.","no":"You want the average of the per-customer difference: mean(books$y1 - books$y0). y1 is spend with a coupon, y0 is spend without."}
::solution
```r
ate <- mean(books$y1 - books$y0)
ate
#> [1] 8
```

=== step === concept
::eyebrow The fix
## Randomization: the great equalizer

Selection bias came from letting loyalty decide who got a coupon. So take that decision away from loyalty, and away from everything else about the customer, and hand it to a coin.

If the coupon is assigned by a fair coin flip, then whether a customer is treated has nothing to do with their potential outcomes. In symbols, \(W \perp \big(Y(0), Y(1)\big)\), where \(\perp\) means "is independent of." That independence forces \(\mathbb{E}[Y(0) \mid W=1] = \mathbb{E}[Y(0) \mid W=0]\): the two groups have the same no-coupon spend on average, so the selection-bias term collapses to zero. What is left of the naive gap is exactly the ATE.

That is the entire logic of a randomized experiment (an A/B test), in four moves:

::widget process-flow {"steps":[{"title":"Name the pieces","sub":"the treatment (coupon) and the outcome (spend)"},{"title":"Two potential outcomes","sub":"each customer has a Y(1) and a Y(0); you see one"},{"title":"Randomize the treatment","sub":"assign the coupon by coin flip so the groups match"},{"title":"Compare and test","sub":"the difference in group means estimates the effect"}]}

Let us prove it on the very same customers. We keep each person's planted `y0` and `y1`, but this time we ignore loyalty and flip a coin for the coupon.

```r
set.seed(7)
coupon_rand <- rbinom(n, 1, 0.5)                       # a fair coin, ignoring loyalty
spend_rand  <- ifelse(coupon_rand == 1, books$y1, books$y0)
rand_means  <- tapply(spend_rand, coupon_rand, mean)
round(rand_means, 2)                                   # the two group averages
#>     0     1
#> 45.12 53.22
round(as.numeric(rand_means[2] - rand_means[1]), 2)    # estimated coupon effect
#> [1] 8.1
```

The simple difference in means is now **$8.10**, essentially the true $8. Same customers, same coupon, same code for the gap, and one changed thing: *how the coupon was assigned*. Randomizing made the groups comparable, and the bias vanished.

=== step === widget
::eyebrow The last question
## Is the effect beyond chance?

Randomizing gave us an estimate of $8.10. But the coin could have fallen a little unevenly, so we owe one more question: could a difference this big come from luck alone, if the coupon truly did nothing?

That is a hypothesis test. We suppose a sceptic's world in which the coupon has zero effect (the **null hypothesis**), and ask how surprising our $8.10 would be there. The **p-value** is that surprise: the probability of seeing a gap at least this large if the true effect were really zero. Drag the observed statistic below and watch its tail area, the p-value, shrink as the estimate moves further from zero.

::widget null-distribution {"tails":2,"max":5,"start":2,"label":"observed t"}

For our experiment, R runs the test directly.

```r
t.test(spend_rand ~ coupon_rand)
#>
#>  Welch Two Sample t-test
#>
#> data:  spend_rand by coupon_rand
#> t = -16.502, df = 1988.8, p-value < 2.2e-16
#> alternative hypothesis: true difference in means between group 0 and group 1 is not equal to 0
#> 95 percent confidence interval:
#>  -9.060698 -7.135879
#> sample estimates:
#> mean in group 0 mean in group 1
#>        45.12233        53.22062
```

The p-value is under \(2.2 \times 10^{-16}\), astronomically small, so we reject "the coupon does nothing." (The t-value is negative only because R reported group 0 minus group 1; the coupon still *raised* spend, by about $8.) The 95% interval, roughly $7.1 to $9.1, comfortably brackets the true $8 and excludes zero.

[NOTE]
Randomization is the gold standard, but you often cannot use it: you cannot randomly assign people to smoke, or rerun last year's prices. When an experiment is off the table, causal inference has to lean on assumptions you argue for instead. Drawing and defending those assumptions is the job of the rest of this course.

=== step === quiz
::eyebrow Check yourself
## Why the coin flip works

In Riverside's experiment, assigning the coupon by a coin flip let the plain difference in group means estimate the true causal effect, which the original targeted rollout could not. Why does randomizing fix it?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- It makes who gets the coupon independent of the customers' potential outcomes, so the two groups are comparable and selection bias is zero ::ok Exactly. Randomization severs the link between treatment and everything about the customer, including their would-be spend. The groups start out equivalent on average, so the leftover difference is the effect itself.
- It gives you a larger sample, and large samples remove bias ::no Size and bias are different problems. The targeted rollout could have a million customers and still be confounded; more rows shrink noise, not bias. Randomizing changes *how* customers are sorted into groups, not how many there are.
- It makes the coupon more effective by sending it to a fair mix of customers ::no Randomizing does not change the coupon's effect on anyone; each person's Y(1) and Y(0) are fixed. It changes only who we *compare*, making the two groups exchangeable so the comparison is fair.

=== step === concept
::eyebrow Go deeper
## References

Four authoritative places to take this further:

- [Hernan and Robins, Causal Inference: What If (free PDF)](https://www.hsph.harvard.edu/miguel-hernan/causal-inference-book/) - the standard modern text; Chapters 1 and 2 define potential outcomes and the fundamental problem exactly as we did here.
- [Holland (1986), Statistics and Causal Inference, JASA](https://doi.org/10.1080/01621459.1986.10478354) - the paper that named the "fundamental problem of causal inference" and formalized the potential-outcomes view.
- [Cunningham, Causal Inference: The Mixtape (free, online)](https://mixtape.scunning.com/04-potential_outcomes) - the potential-outcomes chapter, worked slowly from intuition with code.
- [Rubin (1974), Estimating causal effects of treatments (DOI)](https://doi.org/10.1037/h0037350) - the origin of the potential-outcomes framework these ideas rest on.

=== step === complete
## Lesson 1 complete

You now have the frame that all of causal inference is built on. A correlation, even a strong and highly significant one, blends any real effect with selection bias whenever a confounder decides who gets treated, so it can never prove cause by itself. A causal effect is defined honestly through potential outcomes, \(Y_i(1)\) and \(Y_i(0)\), one of which is always a missing counterfactual, which is why we chase the average treatment effect instead of any one person's. And randomizing the treatment makes the groups comparable, zeroing the selection-bias term so a plain difference in means estimates the effect, exactly as you watched the coupon's illusory $17.82 gap collapse back to its true $8.

Next, Lesson 2: Causal Diagrams with DAGs. When you cannot randomize, you have to state your assumptions about what causes what, out loud and on paper. You will learn to draw those assumptions as a diagram and then read straight off it which variables you must adjust for, and which ones you must leave well alone.
