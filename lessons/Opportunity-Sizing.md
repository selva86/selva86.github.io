---
title: "Product Sense and Metric Diagnosis Lesson 5: Opportunity Sizing"
catalog_blurb: "Estimate a feature's ceiling before building it, with the uncertainty included."
description: "Larkspur has 24,000 cart abandoners and a $42.50 recovery value, but not the conversion rate yet. Size the ceiling and its range with a bootstrap in R."
keywords: "opportunity sizing, product sense, conversion rate estimation, percentile bootstrap, bootstrap confidence interval, product metrics, feature prioritization, product data science, bootstrap in R"
post_type: "LESSON"
curriculum_id: "3.10.5"
webr: true
mathjax: false
lesson_access: "free"
course_id: "pds-sense"
course_title: "Product Sense and Metric Diagnosis"
course_lesson: "5"
course_total: "6"
course_landing: "Product-Sense-and-Metric-Diagnosis-Course.html"
course_next: ""
course_prev: "Cohort-Analysis-and-Mix-Shift.html"
---

=== step === cover
## Opportunity Sizing

Today let's understand how to put a number on a feature that has not been built yet.

Larkspur is a grocery delivery app. Its product team is considering a new button, Save Cart for Later, that would remind a shopper who abandons their cart and bring them back to finish checking out. Building it would take about two months of one engineer's time.

Before committing that time, Aiko, Larkspur's product data scientist, gets asked a plain question: how big could this realistically get?

This lesson works through the answer in three parts.

::widget process-flow {"steps":[{"title":"Three numbers multiplied together","sub":"how large the opportunity could get, multiplied out in one line"},{"title":"The one number nobody has measured yet","sub":"the button has never existed, so this one still has to be estimated"},{"title":"A range instead of a point","sub":"a small pilot means the answer comes with real uncertainty"}]}

That is the shape of the answer to come: three numbers multiplied together, one of them still unmeasured, and a final answer that comes as a range rather than a single point.

=== step === concept
## Why size an opportunity before it is built

Building the Save Cart for Later button costs Larkspur about two months of one engineer's time. Before signing up for that, the team wants an answer to one question first: is this worth building at all?

That question is exactly what opportunity sizing answers. Opportunity sizing is the practice of estimating a feature's upper-bound impact before any of it gets built, so that estimate can be weighed against what building the feature would cost.

That upper bound is called a ceiling. A ceiling is built from assumptions that are optimistic, but still realistic, never invented out of thin air. It is not a promised outcome: once a feature ships, the real result can land anywhere up to the ceiling, and often a bit below it, because an actual rollout rarely performs quite as well as the numbers behind the ceiling suggested.

=== step === concept
## The three numbers that make a ceiling

Every opportunity-sizing ceiling comes from the same formula.

ceiling = reachable population × conversion rate × effect per conversion

That formula multiplies three numbers together. Here is what each one means for Larkspur's button.

- **Reachable population** - everyone the button could ever reach. For Larkspur, that is not its whole user base, only the shoppers who actually abandon a cart.
- **Conversion rate** - of everyone the button reaches, the share who use it and come back to complete a purchase.
- **Effect per conversion** - the value each one of those completed purchases is worth.

Multiply the three together, and the result is the ceiling: the most this feature could plausibly add to revenue each month, if the assumptions behind each number hold.

=== step === concept
## Two of the three numbers, already sitting in Larkspur's data

Two of those three numbers, Larkspur already has. They come straight out of the order logs the company already keeps, with no pilot required.

Every month, 24,000 shoppers add something to their cart and then leave without buying it. That is the reachable population: everyone the Save Cart for Later button would ever get a chance to act on.

And when a shopper does come back and complete an order, Larkspur's order logs show that order is worth $42.50 on average. That is the effect per conversion. Both numbers rest on a large, already-recorded sample, thousands of past orders, so there is nothing left to estimate about either one.

Define both known numbers in R.

```r
# Larkspur's known reachable population and effect per conversion
reach <- 24000
aov <- 42.5

c(reach = reach, aov = aov)
#>   reach     aov
#> 24000.0    42.5
```

The one number still missing is the conversion rate: the share of those 24,000 who would actually use the button and come back to buy. Nobody can read that off the order logs, because the button has never existed. That is the missing piece the pilot has to supply.

=== step === concept
## Estimating the missing number from a small pilot

To get that missing number, Larkspur ran a small pilot by hand, before writing a single line of button code. Someone on the team contacted 50 shoppers who had just abandoned a cart, doing manually what the button would eventually do: reminding them and asking them to come back and finish checking out.

Out of those 50 shoppers, 6 came back and completed a purchase.

That gives a point estimate for the conversion rate directly: the share who converted, out of the share contacted.

conversion rate ≈ 6 / 50 = 0.12, or 12%

Now feed that rate into the ceiling formula, alongside the reachable population and the effect per conversion already pulled from Larkspur's order logs. Compute that point estimate in R.

```r
# Point estimate: 6 of 50 pilot shoppers came back and bought
rate_hat <- 6 / 50
ceiling <- reach * rate_hat * aov

c(rate_hat = rate_hat, ceiling = ceiling)
#>  rate_hat   ceiling
#>      0.12 122400.00
```

24,000 times 0.12 times $42.50 comes to $122,400 a month. That is the point-estimate ceiling: the most the Save Cart for Later button could plausibly add to monthly revenue, based on a conversion rate measured on 50 people.

=== step === quiz
## Quick check: reading the formula correctly

Before moving on, check that each of Larkspur's three numbers is attached to the right term, and that one of them still stands on shakier ground than the other two.

::quiz {"correct": 4, "gate": true, "difficulty": "beginner"}
- 24,000 is Larkspur's entire user base, 12% is the conversion rate, and $42.50 is the effect per conversion. All three numbers come from the same place, Larkspur's order logs. ::no Larkspur's whole user base is larger than 24,000. The reachable population is only the shoppers who actually abandon a cart, the one slice the button would ever act on, and that is a smaller group than everyone who uses the app.
- 24,000 is the reachable population, $42.50 is the conversion rate, and 12% is the effect per conversion. ::no This swaps two of the terms. $42.50 is the effect per conversion, the value of each completed purchase, and 12% is the conversion rate, the share of the reachable population who convert.
- 24,000 is the reachable population, 12% is the conversion rate, and $42.50 is the effect per conversion. All three rest on the same amount of data, so none of them is any less certain than the others. ::no The term matching is right here, but the certainty is not. 24,000 and $42.50 come from thousands of recorded orders. 12% comes from only 50 pilot shoppers, a far smaller sample.
- 24,000 is the reachable population, 12% is the conversion rate, and $42.50 is the effect per conversion. Of the three, the conversion rate is the one still resting on just 50 people, not Larkspur's larger order logs. ::ok Exactly right. The terms match, and the conversion rate is the one number here that still rests on a small pilot rather than a large existing sample.

=== step === concept
## Why one number from 50 people is not the whole story
::prose-only names the method to come, the bootstrap; the mechanics and the numbers arrive in the next two steps

12% came from a real pilot, but it also came from only 50 people. And that matters more than it might seem.

Imagine Larkspur ran that exact same pilot again, on a different 50 cart-abandoners. Would exactly 6 of them come back and buy, again? Not necessarily. It could just as easily land on 4, or on 9, purely because of who happened to get contacted that time.

So the 12% point estimate by itself overstates how sure Larkspur can be. That uncertainty is real, and it needs to be measured, not ignored.

That uncertainty can be measured directly from the 50 outcomes already collected, using a method called the bootstrap.

=== step === widget
## Drawing one bootstrap resample from the pilot

Here is how the bootstrap works, using Larkspur's own pilot.

Picture each one of the 50 pilot shoppers as a card, marked either bought or did not buy. Draw a card at random, write down what it says, and put it back before drawing again. Repeat that 50 times, and the result is one bootstrap resample.

Because each card goes back after every draw, the same shopper's card can get drawn more than once in a single resample. By the same logic, some shoppers' cards might not get drawn at all in that resample. The ones left out are called out-of-bag, OOB for short.

The widget below draws one resample live, on a smaller strip of 12 cards standing in for a slice of the 50-person pilot.

::widget bootstrap-sample {"n": 12, "seed": 5, "tail": "This strip stands for a smaller slice of the 50-person pilot Larkspur ran. The real pilot works exactly the same way, just at full size."}

Press Draw again, and a new resample comes back each time, a different mix of repeats and OOB cards. That is the one new mechanic behind everything that follows, which builds on doing this same resampling many times over.

=== step === concept
## From one resample to 2,000 of them

One resample gives one more plausible conversion rate, close to 12% but not always exactly 12%. To see the full range of what is plausible, that resampling needs to happen many times, not once.

In R, that means repeating the same resample-and-recompute move 2,000 times: draw 50 outcomes with replacement from the pilot, take their mean as one plausible rate, then multiply that rate by the known reachable population and effect per conversion to get one plausible ceiling. Build the 50-outcome pilot and run that resampling 2,000 times.

```r
# Build the 50-outcome pilot and resample it 2,000 times
pilot <- c(rep(1, 6), rep(0, 44))

set.seed(42)
boot_rates <- numeric(2000)
for (i in 1:2000) {
  resample <- sample(pilot, size = 50, replace = TRUE)
  boot_rates[i] <- mean(resample)
}
boot_ceilings <- reach * boot_rates * aov

quantile(boot_rates, probs = c(0.05, 0.5, 0.95))
#>   5%  50%  95%
#> 0.06 0.12 0.20
quantile(boot_ceilings, probs = c(0.05, 0.5, 0.95))
#>     5%    50%    95%
#>  61200 122400 204000
```

`pilot` holds the 50 outcomes, 6 ones for the conversions and 44 zeros for the rest. `sample(pilot, size = 50, replace = TRUE)` draws one bootstrap resample exactly the way the widget just showed, and `mean()` of that resample is one plausible conversion rate. Doing that 2,000 times, then multiplying each rate by the known reach and effect per conversion, produces 2,000 plausible ceilings instead of just one.

Look at the rate quantiles first. The middle of the 2,000 resampled rates sits at 12%, matching the original point estimate, but the 5th percentile drops to 6% and the 95th percentile rises to 20%. The same spread shows up in the ceilings: 5th at $61,200 and 95th at $204,000.

=== step === widget
## Reading the spread of 2,000 ceiling estimates

Those 2,000 ceiling estimates are easier to read as a picture than as a table of quantiles. Here they are as a histogram.

::widget chart-plotter {"data":[{"x":61200},{"x":61200},{"x":61200},{"x":81600},{"x":81600},{"x":81600},{"x":81600},{"x":102000},{"x":102000},{"x":102000},{"x":122400},{"x":122400},{"x":122400},{"x":122400},{"x":122400},{"x":122400},{"x":122400},{"x":142800},{"x":142800},{"x":142800},{"x":142800},{"x":142800},{"x":142800},{"x":163200},{"x":163200},{"x":163200},{"x":163200},{"x":163200},{"x":183600},{"x":183600}],"geoms":["histogram"],"x":"ceiling","code":{"histogram":"ggplot(ceilings, aes(ceiling)) +\n  geom_histogram(bins = 10)"}}

Most of the bars sit well below $122,400, the original point estimate, but the bars stretch out past $200,000 too. The middle 90% of all 2,000 estimates, from the 5th percentile to the 95th, runs from $61,200 to $204,000. Statisticians call that range a percentile bootstrap interval: the middle slice of a distribution built entirely by resampling.

$122,400 sits almost exactly in the middle of that range. But the range itself is the more honest answer, because it shows how much that single point estimate could have moved if the pilot had reached a slightly different 50 people.

=== step === quiz
## Quick check: the range instead of the point

One more check, on what that range actually means for Larkspur's decision.

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- The $61,200 to $204,000 range means the bootstrap failed to settle on a real answer. ::no The bootstrap did exactly what it is supposed to do. A range is not a failure to find one number, it is the honest shape of what a 50-person pilot can actually support.
- The honest number to report is still $122,400, since that is what the pilot's point estimate gave. ::no $122,400 is the midpoint of the range, not the full answer. Reporting it alone hides how much a different 50-person pilot could have shifted that single number.
- The range, $61,200 to $204,000, is the honest answer a 50-person pilot can support, and even its low end, $61,200 a month, is worth weighing against the two months of engineering time the button would cost. ::ok Exactly right. The range is the honest answer, and its low end is the number that should drive the build decision, since it is the floor of what the pilot supports, not just its best case.
- Larkspur should report $204,000, the upper end of the range, since that is the real ceiling the button could reach. ::no $204,000 is only the top of the middle 90% of resampled estimates, not a guaranteed ceiling. Treating the high end as the one number to plan around overstates what a 50-person pilot can support.

=== step === tryit
## Your turn: size Haverford's opportunity

Try the same method on a different case.

Haverford is an online course platform considering an enrollment-reminder feature, the same kind of idea as Larkspur's button, aimed at students who start enrolling in a course and then stop partway through. Here is what Haverford's own pilot found.

```r
# Haverford, an online course platform, is sizing an enrollment-reminder
# feature. It can reach 9,000 enrollment-abandoners a month, each
# completed enrollment is worth $89, and a 40-person pilot of the
# reminder saw 5 of the 40 come back and enroll.
#
# Build the 40-outcome pilot vector, compute the point-estimate ceiling,
# then resample it with replacement 2,000 times and find the 5th and
# 95th percentile of the resulting ceilings.
# Press Check when you have them.
```
::check {"regex": "(?=[\\s\\S]*replace\\s*=\\s*TRUE)(?=[\\s\\S]*quantile[(])", "gate": true, "difficulty": "intermediate", "ok": "Right: the point estimate comes out to $100,125, and the bootstrap gives a range of about $40,050 to $180,225. A pilot this size still leaves a wide gap between the low and high ends, just like it did for Larkspur.", "no": "Build pilot2 as 5 ones and 35 zeros with rep(), then resample it with replace = TRUE 2,000 times, the same way as the earlier bootstrap loop, and run quantile() on the resulting ceilings with probs = c(0.05, 0.95)."}
::solution
```r
# Haverford: build the pilot, compute the point-estimate ceiling, then bootstrap a 90% interval
pilot2 <- c(rep(1, 5), rep(0, 35))
reach2 <- 9000
price2 <- 89

# Point-estimate ceiling
rate_hat2 <- mean(pilot2)
ceiling2 <- reach2 * rate_hat2 * price2
c(rate_hat2 = rate_hat2, ceiling2 = ceiling2)
#>  rate_hat2   ceiling2
#>      0.125 100125.000

# Resample 2,000 times for the 90% percentile bootstrap interval
set.seed(123)
boot_rates2 <- numeric(2000)
for (i in 1:2000) {
  resample2 <- sample(pilot2, size = 40, replace = TRUE)
  boot_rates2[i] <- mean(resample2)
}
boot_ceilings2 <- reach2 * boot_rates2 * price2
quantile(boot_ceilings2, probs = c(0.05, 0.95))
#>     5%    95%
#>  40050 180225
```

$100,125 is Haverford's point-estimate ceiling, and $40,050 to $180,225 is its percentile bootstrap interval. The method is identical to Larkspur's. Only the numbers changed, and a point estimate alone would have overstated how sure anyone could be here too.

=== step === concept
## References
::prose-only the references are text, not a visual

- Efron, B. (1979). [Bootstrap Methods: Another Look at the Jackknife](https://doi.org/10.1214/aos/1176344552). Annals of Statistics, 7(1), 1-26. The original method behind resampling a sample with replacement to measure a statistic's own uncertainty.
- Efron, B. and Tibshirani, R. (1993). [An Introduction to the Bootstrap](https://www.routledge.com/An-Introduction-to-the-Bootstrap/Efron-Tibshirani/p/book/9780412042317). Chapman and Hall. The standard reference for the percentile bootstrap interval used in this lesson.
- Torres, T. (2021). [Continuous Discovery Habits](http://continuousdiscoveryhabits.com). Product Talk LLC. Sizing an opportunity as part of product discovery, before a feature gets built.
- Perri, M. (2018). [Escaping the Build Trap](https://www.oreilly.com/library/view/escaping-the-build/9781491973783/). O'Reilly Media. Why a team sizes a feature's impact before committing engineering time to it.

=== step === complete
## Quick recap

Larkspur sized up the Save Cart for Later button before writing a line of code for it, using one formula: ceiling equals reachable population times conversion rate times effect per conversion.

Two of those numbers, 24,000 reachable shoppers and a $42.50 effect per conversion, came straight from existing order logs. The third, the conversion rate, had to come from a 50-person pilot, which gave a point estimate of 12% and a point-estimate ceiling of $122,400 a month.

Because 50 people is a small sample, that single number was not the whole story. Resampling the pilot 2,000 times turned the single $122,400 estimate into a percentile bootstrap interval, $61,200 to $204,000, the honest range a pilot that size can actually support.

Next up is a short quiz covering everything in this section.
