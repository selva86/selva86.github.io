---
title: "Probability and Estimation Lesson 1: What a random variable really is"
catalog_blurb: "What a random variable is, and why its expectation never depends on your sample."
description: "A random variable is a rule, not a wiggling number. Learn to tell discrete from continuous, and why its expectation never depends on your sample size."
keywords: "random variable, discrete random variable, continuous random variable, expectation, variance, binomial distribution, sampling distribution, R"
post_type: "LESSON"
curriculum_id: "4.10.1"
webr: true
mathjax: false
lesson_access: "free"
course_id: "res-probability"
course_title: "Probability and Estimation, from the ground up"
course_lesson: "1"
course_total: "7"
course_landing: "Probability-and-Estimation-Course.html"
course_next: "The-Four-Distributions-Inference-Runs-On.html"
course_prev: ""
---

=== step === cover
## What a random variable really is

Today let's understand what a random variable really is, with an example you can picture.

Kavya runs a small sourdough stall. She bakes exactly 20 loaves every morning, and by closing time some of them have sold. Her logbook keeps the last 20 mornings, and the count of loaves sold moves around: 16 one day, 12 the next, 18 on a particularly good one.

Here are all 20 of those mornings, one bar per day.

::widget chart-plotter {"data":[{"x":1,"y":16},{"x":2,"y":16},{"x":3,"y":15},{"x":4,"y":12},{"x":5,"y":17},{"x":6,"y":12},{"x":7,"y":12},{"x":8,"y":14},{"x":9,"y":14},{"x":10,"y":18},{"x":11,"y":17},{"x":12,"y":17},{"x":13,"y":14},{"x":14,"y":16},{"x":15,"y":14},{"x":16,"y":15},{"x":17,"y":14},{"x":18,"y":10},{"x":19,"y":16},{"x":20,"y":14}],"geoms":["bar"],"x":"day","y":"sold","code":{"bar":"ggplot(kavya_days, aes(factor(day), sold)) +\n  geom_col()"}}

Twenty mornings, and the number keeps landing somewhere different. So before anything else, there is one question worth answering: what kind of number is "loaves sold", exactly? That is what this lesson is about.

=== step === concept
::prose-only grounded in the cover's bar chart of Kavya's 20 logged days
## A random variable is a rule, not a number

Each of those bars is a number: 16, or 12, or 18. But none of those numbers is really what we want to understand. What we want to understand is the thing that produces that number, morning after morning.

Call it X, the number of loaves Kavya sells today. X is not 16, and it is not 12. X is the rule: count how many of the 20 baked loaves find a buyer by closing time. That rule is exactly the same every single day. What changes is the outcome of applying it, which morning you happen to be counting.

[KEY INSIGHT]
A random variable is a rule that assigns a number to an outcome that is not known in advance, not a number that wiggles by itself. The "random" part sits in which outcome a given morning delivers, not in the rule that turns the outcome into a number.

=== step === concept
::prose-only the possible-values list 0 through 20
## Discrete random variables: counting the loaves sold

Go back to X, the number of loaves Kavya sells today. However busy or quiet the morning, X can only land on one of 21 possible values: 0, 1, 2, 3, and so on, up to 20. It cannot read 14.5, because half a loaf sold does not happen, and it cannot read 23, because she only baked 20.

Write out every value X could possibly take, and you get a clean, countable list: 0, 1, 2, 3, all the way to 20. Nothing fits between 14 and 15. The very next value up from 14 is 15, full stop.

A random variable whose possible values form a list you could count off one at a time, even if the list is long, is called a discrete random variable. Loaves sold is one.

=== step === concept
::prose-only the three weighings beside step 3's discrete list
## Continuous random variables: the weight of a loaf

Now look at a different number from the same stall: the weight of one loaf. Kavya's loaves weigh close to 900 grams each. Three real weighings from her kitchen scale came back 897.4 grams, 900.1 grams and 902.6 grams.

Unlike loaves sold, this number is not stuck on a short, countable list. Between 900.1 grams and 902.6 grams sits 901 grams. Between 900.1 and 901 sits 900.5. Between 900.1 and 900.5 sits 900.3, and so on forever. However finely you slice the gap between any two weights, another weight always fits inside it.

A random variable whose possible values cannot be listed one at a time, because there is always another value squeezed in between any two, is called a continuous random variable. A loaf's weight is one. Loaves sold is not: it is discrete.

[NOTE]
The real test is whether another value always fits between any two you already have, not how many decimal places you happened to write down, and not whether the variable has a lowest or highest possible value. Loaves sold has a maximum (20) and is still discrete; a loaf's weight has an upper limit too, set by the size of the oven, and is still continuous.

=== step === quiz
## Quick check: discrete or continuous

Kavya starts logging one more thing: how many minutes her oven stays on each morning. Three mornings read 42.0, 42.3 and 42.31.

Is "minutes the oven stays on" discrete or continuous?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- Discrete, because the oven's timer only displays a couple of decimal places ::no
- Continuous, because between any two readings, like 42.3 and 42.31, infinitely many more readings could in principle sit in between ::ok Right. What the timer happens to display is a limit of the timer, not of the minutes themselves. Between any two real readings there is always a finer one, which is exactly the test for continuous.
- Discrete, because the oven cannot stay on forever, so there has to be some maximum number of minutes it runs ::no Neither of those is the real test. A display that rounds, or a value that has to stop somewhere, does not make a number discrete. Loaves sold is discrete because its values form a countable list with nothing in between; oven minutes fail that test, because between any two readings there is always another one squeezed in.

=== step === concept
::prose-only 14.65 set directly against 15
## A population figure versus a sample statistic

Kavya has run this stall for about three years now, somewhere around 900 mornings. Across all of them, 75% of what she bakes has sold by closing time. That 75% was not calculated from last Tuesday, or from any one week. It describes the stall's long-run behaviour, fixed, and the same number whether you ask about this year or last year. Call a number like that a population figure, a property of the process itself, here the 75% sell-through rate, rather than of any one batch of days you happen to look at.

Her logbook of 20 real mornings is a sample, a small slice drawn from that long run. In that sample, the average loaves sold works out to 14.65, not exactly 20 times 0.75, which is 15. Close, but not exact. Nothing has gone wrong. That is what a sample of 20 mornings drawn from a 75% long-run rate looks like. The population figure is 15, fixed. The sample average, 14.65, is just what these particular 20 mornings happened to show.

That distinction, between the fixed figure behind the process and the number one sample of days hands you, is exactly what expectation and variance are built to pin down.

=== step === widget
## Expectation as a long-run average

So the population sell-through rate, 75%, is fixed. But what does that actually predict about X, the number of loaves sold on any one morning?

Let's find out by simulating. `rbinom()` draws from a binomial distribution: give it a number of independent chances, here 20 loaves, each either selling or not, and a probability for each one, here 0.75, and it returns how many of them came out a sale. One call to `rbinom(1, 20, 0.75)` is one simulated morning. Repeat that 2,000 times with `replicate()`, and you get 2,000 simulated mornings of loaves sold.

```r
# Simulate 2,000 bakery mornings at a 75% sell-through rate and average them
set.seed(42)
sim_days <- replicate(2000, rbinom(1, 20, 0.75))
mean(sim_days)
#> [1] 15.058
```

Across those 2,000 simulated mornings, the average lands at 15.058, not 14.65. That is because 2,000 mornings pin down the long-run behaviour far more tightly than Kavya's 20 real ones ever could. Run even more simulated mornings and that average keeps settling closer to one fixed number.

That fixed number has a name: the expectation of X, written E[X]. It is the average X would settle to if the rule played out forever, not the average of any one batch of days. For a count built from n independent chances at probability p each, like 20 loaves each selling independently with probability 0.75, there is a shortcut that gives E[X] directly, with no simulation needed.

```r
# The shortcut for a count built from n independent chances at probability p
20 * 0.75
#> [1] 15
```

n times p, 20 times 0.75, lands at exactly 15. That matches the 2,000-morning simulation almost exactly, and it is no coincidence. The shortcut and the simulation are measuring the same fixed number from two different directions.

Press the buttons below and watch pure chance pile up, one simulated morning at a time, at Kavya's usual 75% rate.

::widget luck-simulator {"trials": 20, "p": 0.75, "observed": 18, "unit": "loaves sold out of 20"}

Every bar above is a count of simulated mornings that landed on that many loaves sold out of 20. Press "Run 100" or "Run 1,000" a few times and watch where most of the bars pile up: it keeps settling in around 15, the same number the shortcut gave. The orange bars mark mornings that reached 18 or more loaves sold, a particularly good morning by Kavya's usual standard. Keep running games and you will see just how rare those are next to the pile sitting around 15.

[KEY INSIGHT]
E[X] = 15 belongs to the rule itself, the 20 loaves and the 75% rate. It has nothing to do with which 20 days land in Kavya's logbook, or how many mornings get simulated. Her real 20 days averaged 14.65. The simulation's 2,000 days averaged 15.058. Neither of those is E[X]. E[X] is 15, exactly, every time, because it is a property of the rule, not of any sample drawn from it.

=== step === widget
## Seeing the spread: variance in the simulated days

E[X] = 15 tells you where loaves sold is centred. It says nothing about how far a typical morning strays from that centre, and that is exactly what variance measures.

`sim_days` still holds the 2,000 mornings you just simulated. Tabulate them, and you can see the whole shape of where they landed.

```r
# Tabulate how many of the 2,000 simulated mornings landed on each count
table(sim_days)
#> sim_days
#>   8   9  10  11  12  13  14  15  16  17  18  19  20 
#>   4   6  16  43 147 211 325 385 376 286 143  47  11 
```

Here is that same tally, bar by bar.

::widget chart-plotter {"data":[{"x":8,"y":4},{"x":9,"y":6},{"x":10,"y":16},{"x":11,"y":43},{"x":12,"y":147},{"x":13,"y":211},{"x":14,"y":325},{"x":15,"y":385},{"x":16,"y":376},{"x":17,"y":286},{"x":18,"y":143},{"x":19,"y":47},{"x":20,"y":11}],"geoms":["bar"],"x":"sold","y":"count","code":{"bar":"ggplot(sim_tally, aes(factor(sold), count)) +\n  geom_col()"}}

Most of the 2,000 mornings pile up around 14, 15 and 16, with far fewer out at 9 or 20. That shape, tall in the middle and thin at the edges, is what 2,000 mornings drawn at a 75% rate actually looks like. Kavya's own 20 real mornings, averaging 14.65, are a small and much noisier slice of exactly this same pile.

Variance measures the typical spread of that pile, as the average squared distance of every value from the centre, 15. Squaring matters because a morning 3 loaves below 15 and a morning 3 loaves above 15 should count as an equally sized miss, and squaring turns both into the same positive number instead of letting them cancel out.

```r
# Measure how far each simulated morning landed from 15, squared, then average
sq_dist_from_15 <- (sim_days - 15)^2
mean(sq_dist_from_15)
#> [1] 3.913
```

That is the variance of the 2,000 simulated mornings, computed by hand: 3.913. Exactly as with expectation, a shortcut gives the same number with no simulation at all. For a count built from n independent chances at probability p each, the variance is n times p times (1 minus p).

```r
# The shortcut for variance: n times p times (1 minus p)
20 * 0.75 * (1 - 0.75)
#> [1] 3.75
```

3.75, matching the by-hand 3.913 almost exactly. The small gap is only because 2,000 mornings is a large sample, not an infinite one. Take the square root of either number and you get a typical swing of about 1.94 loaves around 15, in the same units as the loaves themselves, which is usually the easier number to picture.

```r
# The typical swing, in loaves, instead of loaves squared
sqrt(20 * 0.75 * (1 - 0.75))
#> [1] 1.936492
```

So a count around 13 to 17 loaves on any given morning is unremarkable: it sits well within one typical swing of 15. That variance has a name too, written Var(X). It is the second fixed number the rule carries, Var(X) = 3.75, alongside E[X] = 15.

=== step === quiz
## Closing quiz: the rule's number versus one sample's number

Three numbers have shown up for how many loaves Kavya sells: 14.65, the average of her own 20 real mornings; 15.058, the average of the 2,000 simulated mornings; and 15, which is 20 times 0.75. Which one is E[X], fixed by the rule itself, no matter which days or how many mornings get sampled?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- 14.65, because it came from Kavya's own real logbook, not a simulation ::no
- 15, because it comes from the rule itself, 20 loaves at a 75% sell-through rate, and does not depend on which days or how many mornings get sampled ::ok Right. 15 comes straight from n times p, 20 times 0.75, and that never changes no matter which 20 real days Kavya happens to log or how many mornings get simulated.
- 15.058, because running more simulated mornings makes it the more accurate answer ::no Both of the other numbers are real, but neither is E[X]. 14.65 is just what Kavya's own 20 real mornings happened to show, and 15.058 is just what one particular run of 2,000 simulated mornings happened to show. Rerun the simulation with a different seed and you would get a slightly different average, maybe 14.97 or 15.11. E[X] itself never moves, because it belongs to the rule, n = 20 and p = 0.75, not to any sample drawn from it.

=== step === tryit
## Your turn: expectation and variance for a new rate

Kavya is testing a slower weekend recipe. On weekends, historically only 60% of the 20 loaves she bakes sell by closing time, instead of the usual 75%.

Repeat the same two moves from the last two steps for this new rate: simulate 2,000 such weekend mornings, then compute the mean and the average squared distance from the centre the rule predicts.

```r
# sim_days above was simulated at Kavya's usual 75% sell-through rate.
# Simulate 2,000 weekend mornings instead, where only 60% of the 20
# loaves sell: replicate(2000, rbinom(1, 20, 0.6)). Store the result,
# then print its mean, and the average squared distance of each value
# from 20 times 0.6.
# Four lines. Press Check when you have them.
```
::check {"regex": "rbinom[(]1,\\s*20,\\s*0.6[)]", "gate": true, "difficulty": "intermediate", "ok": "Right: a mean near 12 (20 times 0.6) and an average squared distance near 4.8 (20 times 0.6 times 0.4). Same rule, same two moves, just a different rate.", "no": "Change the probability inside the rbinom() call you used for the usual rate: replicate(2000, rbinom(1, 20, 0.6)) in place of 0.75. Then run mean() on the result, and mean() again on the squared distance of each value from 20 times 0.6."}
::solution
```r
# Simulate 2,000 weekend mornings at a 60% sell-through rate
set.seed(7)
weekend_days <- replicate(2000, rbinom(1, 20, 0.6))
mean(weekend_days)
#> [1] 11.9845
mean((weekend_days - 12)^2)
#> [1] 4.7125
```

11.9845 sits close to 12, which is 20 times 0.6. And 4.7125 sits close to 4.8, which is 20 times 0.6 times 0.4. Same two moves as before, a different rate, and the same match between simulation and the closed-form shortcut.

=== step === concept
::prose-only the sources are text, not a visual
## References

A few authoritative places to take this further:

- [Wasserman, L., *All of Statistics* (Springer), Chapter 2, Random Variables](https://doi.org/10.1007/978-0-387-21736-9) - a compact, rigorous first pass at exactly the definitions taught here.
- [Casella, G. and Berger, R., *Statistical Inference* (2nd ed., Chapman and Hall/CRC), Chapter 2, Transformations and Expectations](https://www.routledge.com/Statistical-Inference/Berger-Casella/p/book/9781032593036) - the fuller treatment of expectation and variance, including why the shortcuts work.
- [NIST/SEMATECH e-Handbook of Statistical Methods, section 1.3.6.1, What is a Probability Distribution](https://www.itl.nist.gov/div898/handbook/eda/section3/eda361.htm) - a free reference page on discrete and continuous probability functions.
- Khan Academy, Random Variables (Statistics and Probability library) - short videos and practice problems on the same discrete versus continuous split.

=== step === complete
## Why E[X] describes the rule, not the dataset

Through this whole lesson, two things never changed: the batch size, 20 loaves, and the sell-through rate, 75%. Because those two never moved, E[X] = 15 and Var(X) = 3.75 never moved either. What changed, every time, was which sample happened to land in front of you: 14.65 on Kavya's own 20 real mornings, 15.058 on the first run of 2,000 simulated ones, and something slightly different again had that simulation run on another seed.

Neither 14.65 nor 15.058 is wrong. They are both just samples, drawn from a rule whose true centre and spread never move. That is what it means to say E[X] and Var(X) describe the rule itself, and not any one dataset, including Kavya's own.

Next, we will meet four distributions, the normal, the t, the chi-squared and the F, built from exactly this same idea of a rule with a fixed centre and spread, and see what each one is actually the distribution of.
