---
title: "Experimental Design and A/B Testing Lesson 1: Designing a study that can answer the question"
catalog_blurb: "The five decisions that decide whether your study can answer the question."
description: "A retailer's checkout test, simulated four ways, shows why randomizing who gets which version, not the sample size, decides if a study can answer its question."
keywords: "study design, randomization, confounding, A/B testing, selection bias, before-after comparison, experimental design, R"
post_type: "LESSON"
curriculum_id: "4.120.1"
webr: true
mathjax: false
lesson_access: "free"
course_id: "res-design"
course_title: "Experimental Design and A/B Testing"
course_lesson: "1"
course_total: "8"
course_landing: "Experimental-Design-and-A-B-Testing-Course.html"
course_next: "Randomize-What-You-Can-Block-What-You-Cannot"
course_prev: ""
---

=== step === cover
## Designing a study that can answer the question

Today let's understand the decisions that settle whether a study can answer its own question, decisions that all get made before a single row of data exists.

Here's the example we will use throughout. Northfield Kitchens, an online retailer of kitchen gear, is testing a redesigned one-page checkout against its old multi-page checkout. What gets measured is simple: did the visitor buy something during that visit, yes or no.

Before Northfield Kitchens collects a single visitor, five decisions already have to be made. Here they are.

::widget process-flow {"steps":[{"title":"Unit","sub":"the one thing each measurement is taken on, a visitor, a day, a store"},{"title":"Randomize","sub":"what decides which version a unit gets, chance or something else"},{"title":"Measure","sub":"the one outcome the whole comparison is built on"},{"title":"How many","sub":"how many units the study includes"},{"title":"Compare","sub":"what gets set against what, to read off an effect"}]}

Miss any one of these five, and the comparison Northfield Kitchens eventually runs can come back wrong, no matter how careful the analysis afterward is.

=== step === concept
## The five decisions every study design has to make

Let's fill in each of Northfield Kitchens's five decisions.

::widget styled-table {"cols":["Decision","Answer for Northfield Kitchens"],"rows":[["Unit","One visitor session"],["Randomized","Which checkout version the session sees, if anything"],["Measured","Whether the visitor bought something"],["How many","6,000 visitor sessions"],["Compared","New checkout purchase rate against old checkout purchase rate"]],"title":"The five decisions, filled in","note":"Every number in this lesson comes from a simulation with a known, fixed true effect, not from a real company."}

There's one more fact to fix before testing any design against it, a fact nobody running a real study ever actually gets to know. The new checkout truly does raise the purchase rate, from 10% to 12%, a lift of 2 percentage points. That lift is fixed on purpose, built into the simulation, so every design from here on is really being asked the same question: can it recover that same 2-point truth?

=== step === concept
## Randomize every visitor and the effect shows up

Here's the simplest design. Northfield Kitchens takes 6,000 visitors and flips a coin for each one, independently: heads, that visitor gets the new checkout, tails, the old one. Every visitor has exactly the same 50-50 chance, and one visitor's assignment says nothing about any other visitor's.

That is what "randomized" means here: assignment to a version is decided by chance alone, visitor by visitor. This design is called visitor-level randomization.

Press Run to simulate 3,000 visitors on each version and count how many of them buy.

```r
# Randomize every visitor independently; simulate purchases on each version
set.seed(79)
baseline_rate <- 0.10   # true purchase rate on the old checkout
new_rate      <- 0.12   # true purchase rate on the new checkout, the 2-point lift

n_per_version <- 3000
old_purchases <- rbinom(1, n_per_version, baseline_rate)
new_purchases <- rbinom(1, n_per_version, new_rate)

old_pct <- round(100 * old_purchases / n_per_version, 2)
new_pct <- round(100 * new_purchases / n_per_version, 2)

c(old_purchases = old_purchases, new_purchases = new_purchases, old_pct = old_pct, new_pct = new_pct)
#> old_purchases new_purchases       old_pct       new_pct 
#>        317.00        377.00         10.57         12.57 
```

The old checkout converted 317 of its 3,000 visitors, 10.57%. The new checkout converted 377 of its 3,000, 12.57%. The gap between them is 2 percentage points, exactly the true lift the simulation planted.

But one estimate landing on the true number does not, by itself, tell Northfield Kitchens the gap is real rather than noise. Run a two-proportion test on the same two counts to check.

```r
# Test whether the gap between the two versions is more than noise
prop.test(c(new_purchases, old_purchases), c(n_per_version, n_per_version))
#> 
#> 	2-sample test for equality of proportions with continuity correction
#> 
#> data:  c(new_purchases, old_purchases) out of c(n_per_version, n_per_version)
#> X-squared = 5.6719, df = 1, p-value = 0.01724
#> alternative hypothesis: two.sided
#> 95 percent confidence interval:
#>  0.003489511 0.036510489
#> sample estimates:
#>    prop 1    prop 2 
#> 0.1256667 0.1056667 
```

The line to read is p-value = 0.01724, below the usual 0.05 cutoff for calling a result statistically significant. The 95% confidence interval, about 0.35 to 3.65 percentage points, also contains the 2-point truth the simulation planted. Northfield Kitchens can read this gap as caused by the checkout change, and not by who ended up in which group, precisely because nothing but chance decided who saw which version.

Here's the same test again, drawn as a picture. The curve below is what the gap would look like if the two checkouts truly converted at the same rate, and the shaded area is the p-value.

::widget null-distribution {"tails": 2, "max": 4, "start": 2.38, "label": "observed z"}

The slider already sits where this test's own result lands, at a z of about 2.38, and the shaded area it traces reads about 0.017, matching the prop.test p-value above. Drag it back toward zero, the shape a weaker gap would leave, and the shaded area grows. Push it further out, the shape a bigger gap would leave, and the shaded area shrinks toward nothing.

=== step === quiz
## Quick check: what a significant result tells you

The test on Northfield Kitchens's 6,000 visitors came back with p = 0.01724, below 0.05.

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- The p-value proves the new checkout's true lift is exactly 2 percentage points. ::no
- Because assignment to a version was decided purely by chance, a significant result here supports reading the gap as caused by the checkout change rather than by who ended up in which group. ::ok Right. Random assignment is what makes the two groups comparable before the checkout version even differs, so once a gap clears the noise you would expect by chance, the checkout itself is the most defensible explanation left standing.
- Because the result was significant on 6,000 visitors, the same test would also come back significant on a random 60 of them. ::no A p-value says how surprising a gap this size would be if the checkout truly made no difference, not the exact size of the effect, and whether a much smaller sample would also reach significance depends entirely on the sample size, which this one result says nothing about.

=== step === concept
## Randomize the day instead of the visitor

Visitor-level randomization is not the only way to randomize. Suppose Northfield Kitchens runs this test over 30 days, about 200 visitors a day, 6,000 in total, but this time it is each day, not each visitor, that gets coin-flipped to a checkout version.

That changes the unit being randomized from a visitor to a day: every visitor on a "new" day sees the new checkout, every visitor on an "old" day sees the old one.

Press Run to simulate 30 days of purchases, each day drawn at whichever rate its coin flip assigned it.

```r
# Randomize by day instead of by visitor; simulate purchases for each day
set.seed(126)
n_days <- 30
visitors_per_day <- 200

day_version <- sample(c("old", "new"), n_days, replace = TRUE)
day_rate <- ifelse(day_version == "new", new_rate, baseline_rate)
day_purchases <- rbinom(n_days, visitors_per_day, day_rate)

days <- data.frame(day = 1:n_days, version = day_version,
                    rate_pct = round(100 * day_purchases / visitors_per_day, 1))

old_rate_pct <- round(100 * sum(day_purchases[day_version == "old"]) / (sum(day_version == "old") * visitors_per_day), 2)
new_rate_pct <- round(100 * sum(day_purchases[day_version == "new"]) / (sum(day_version == "new") * visitors_per_day), 2)

c(days_old = sum(day_version == "old"), days_new = sum(day_version == "new"),
  old_rate_pct = old_rate_pct, new_rate_pct = new_rate_pct)
#>     days_old     days_new old_rate_pct new_rate_pct 
#>        16.00        14.00        10.28        12.29 
```

16 days landed old and 14 landed new. Pooled across all their visitors, the old days converted at 10.28% and the new days at 12.29%, a lift of about 2 percentage points, close to the truth again.

Plot each day's own rate against the version it happened to be assigned, to see how much a single day can wobble.

```r
# Plot each day's own purchase rate against its assigned version
library(ggplot2)
ggplot(days, aes(x = day, y = rate_pct, color = version)) +
  geom_point(size = 3) +
  geom_hline(yintercept = 100 * baseline_rate, linetype = "dashed", color = "grey50") +
  geom_hline(yintercept = 100 * new_rate, linetype = "dashed", color = "grey50") +
  labs(x = "Day", y = "Purchase rate (%)", color = "Version",
       title = "Each day's purchase rate, by the version it was assigned")
```

Individual days swing well above and below their own true rate, the two dashed lines, because 200 visitors is not a lot to pin a rate down precisely. Day-level randomization still recovers the true effect once enough days are pooled together, just more noisily than visitor-level randomization, because the unit being randomized is now a day of 200 visitors instead of one visitor at a time.

=== step === concept
## Let visitors opt in, and the comparison breaks

Now try a design that feels tempting because it is so easy to build: let visitors choose. Northfield Kitchens puts a banner on the old checkout page inviting visitors to try the new one, and 1,200 of the 6,000 visitors click it and get the new checkout. The other 4,800 see the old checkout as usual.

Here is the problem, and it has nothing to do with sample size. Visitors who click a banner to try something new are already a different kind of visitor, more engaged shoppers who would have bought at a higher rate than average even on the old checkout. Say their own baseline, had they stayed on the old checkout, would have been 14%, not the usual 10%.

So two things are now mixed into one number. The clickers get the real 2-point lift from the new checkout, landing at 16%, their own 14% baseline plus the 2 points. But Northfield Kitchens never sees that 14% baseline on its own, it only sees the clickers' rate against the non-clickers' 10%.

Press Run to simulate this.

```r
# Let visitors opt in to the new checkout by clicking a banner
set.seed(378)
clicker_baseline <- 0.14   # clickers are more engaged shoppers than average, even before any checkout change
clicker_rate <- clicker_baseline + (new_rate - baseline_rate)   # their rate under the new checkout: their own baseline plus the same 2-point true lift

n_clickers <- 1200
n_nonclickers <- 4800

clicker_purchases <- rbinom(1, n_clickers, clicker_rate)
nonclicker_purchases <- rbinom(1, n_nonclickers, baseline_rate)

clicker_pct <- round(100 * clicker_purchases / n_clickers, 2)
nonclicker_pct <- round(100 * nonclicker_purchases / n_nonclickers, 2)
naive_lift <- round(clicker_pct - nonclicker_pct, 2)

c(clicker_pct = clicker_pct, nonclicker_pct = nonclicker_pct, naive_lift_points = naive_lift)
#>       clicker_pct    nonclicker_pct naive_lift_points 
#>             15.08              9.08              6.00 
```

The naive comparison reads 6 percentage points, three times the real 2-point lift. Of those 6 points, 2 are the checkout's real effect and the other 4 come entirely from clickers already converting at a higher rate before they ever saw the new checkout. Statisticians call this a confound: a second factor, how engaged a visitor already was, that moved along with the thing being compared, which checkout they got, so the comparison cannot tell the two apart.

And this is not a sampling accident like the noise a correctly randomized design shows from run to run. Running this design again with more visitors would not close the gap, because the bias is baked into who ended up in each group, not into how much data was collected. Collecting more data only makes the wrong number, 6 points, more precise.

=== step === concept
## Compare before and after, and the comparison breaks again

Here is a second way to break a comparison, and it does not involve anyone self-selecting into anything. Northfield Kitchens runs the old checkout for weeks 1 to 4, then switches every visitor to the new checkout for weeks 5 to 8, and compares the two periods.

That sounds harmless. Every visitor in weeks 5 to 8 really does get the new checkout. But weeks 5 to 8 also happen to carry a marketing campaign that nobody planned around the checkout test, and that campaign lifts the purchase rate by 3 points for every visitor, regardless of which checkout they see.

So the "after" period's true rate is not just the new checkout's 12%, it is 12% plus the campaign's 3 points, 15%.

```r
# Compare four weeks of the old checkout against four weeks of the new one
set.seed(83)
campaign_lift <- 0.03   # a marketing campaign ran only in weeks 5-8, adding 3 points for every visitor
after_rate <- new_rate + campaign_lift

n_before <- 3000   # weeks 1-4, old checkout, no campaign
n_after <- 3000    # weeks 5-8, new checkout, during the campaign

before_purchases <- rbinom(1, n_before, baseline_rate)
after_purchases <- rbinom(1, n_after, after_rate)

before_pct <- round(100 * before_purchases / n_before, 2)
after_pct <- round(100 * after_purchases / n_after, 2)
naive_lift <- round(after_pct - before_pct, 2)

c(before_pct = before_pct, after_pct = after_pct, naive_lift_points = naive_lift)
#>        before_pct         after_pct naive_lift_points 
#>              9.77             14.77              5.00 
```

Plot the two periods side by side to see the gap the naive comparison reports.

```r
# Plot the two periods' purchase rates side by side
library(ggplot2)
periods <- data.frame(period = c("Before (old checkout)", "After (new checkout)"),
                       rate_pct = c(before_pct, after_pct))
ggplot(periods, aes(x = period, y = rate_pct)) +
  geom_col(fill = "#1f7a55", width = 0.5) +
  labs(x = NULL, y = "Purchase rate (%)",
       title = "Before vs after: the naive comparison")
```

The naive comparison reads 5 percentage points, 3 more than the real 2-point lift. This is the same kind of problem as the banner, a confound, except here time is the second factor moving along with the checkout version instead of visitor engagement. Every visitor in the "after" period got both the new checkout and the campaign, so there is no way to split the 5 points back into "2 from the checkout" and "3 from the campaign" using this data alone.

=== step === widget
## Sweeping all four designs across sample size

One question is still open: would the opt-in and before-after designs eventually find the true 2-point lift if Northfield Kitchens just collected more data? Rerun all four designs, the same simulations from the last few steps, at six sample sizes from 500 visitors up to 16,000, and compare the lift each one estimates.

Each point below is one simulated run of a design at one sample size. Switch to the small-multiples view to see the four designs apart.

::widget facet-grid {"data":[{"x":500,"y":0.40,"facet":"Visitor-level"},{"x":500,"y":2.05,"facet":"Day-level"},{"x":500,"y":5.50,"facet":"Opt-in"},{"x":500,"y":4.40,"facet":"Before-after"},{"x":1000,"y":0.80,"facet":"Visitor-level"},{"x":1000,"y":0.51,"facet":"Day-level"},{"x":1000,"y":6.88,"facet":"Opt-in"},{"x":1000,"y":4.80,"facet":"Before-after"},{"x":2000,"y":2.90,"facet":"Visitor-level"},{"x":2000,"y":2.59,"facet":"Day-level"},{"x":2000,"y":6.56,"facet":"Opt-in"},{"x":2000,"y":6.30,"facet":"Before-after"},{"x":4000,"y":2.40,"facet":"Visitor-level"},{"x":4000,"y":1.69,"facet":"Day-level"},{"x":4000,"y":4.84,"facet":"Opt-in"},{"x":4000,"y":5.55,"facet":"Before-after"},{"x":8000,"y":2.10,"facet":"Visitor-level"},{"x":8000,"y":2.43,"facet":"Day-level"},{"x":8000,"y":6.84,"facet":"Opt-in"},{"x":8000,"y":5.75,"facet":"Before-after"},{"x":16000,"y":2.57,"facet":"Visitor-level"},{"x":16000,"y":2.22,"facet":"Day-level"},{"x":16000,"y":6.27,"facet":"Opt-in"},{"x":16000,"y":4.61,"facet":"Before-after"}],"geom":"point","x":"visitors in the study","y":"estimated lift, in points","facetVar":"design"}

Switch to facet_wrap(~design) and read the Visitor-level and Day-level panels first. At 500 visitors their estimates wander, as low as 0.4 points and as high as 2.05. By 16,000 visitors they have settled at 2.57 and 2.22, both close to the 2-point truth. That is what more data buys a correctly randomized design: a tighter answer, centred on the right number.

Now read the Opt-in and Before-after panels. At every sample size from 500 to 16,000, their estimates sit well above 2 points, never once dropping below 4.4. More data does not pull either one toward the truth, because their 4-point and 3-point biases come from who was compared and when, not from how much data was collected.

=== step === concept
## Why more data cannot rescue a bad design

Here's the recap all four designs earn.

::widget styled-table {"cols":["Design","Randomized","Confounded with","Detects the 2-point truth"],"rows":[["1. Visitor-level","Yes, visitor by visitor","Nothing","Yes, about 2 points"],["2. Day-level","Yes, day by day","Nothing, just noisier","Yes, about 2 points"],["3. Opt-in","No, visitors self-selected","Visitor engagement","No, about 6 points"],["4. Before-after","No, time decided the version","The marketing campaign","No, about 5 points"]],"title":"Four designs, one true effect","note":"Confounded with names the second factor that moved along with the checkout version."}

Designs 1 and 2 share one property: nothing but chance decided who, or which day, got which checkout version. Designs 3 and 4 share the opposite property: something other than chance decided it, visitor engagement in one case, the calendar in the other, and that something also happened to move the purchase rate on its own.

That is the entire reason the sample-size sweep looked the way it did. A design's bias is a property of *how* the comparison was built, fixed the moment the study was designed, before a single visitor arrived. Sample size controls how precisely a design estimates whatever it is actually estimating, but it has no power to change what that is.

Collecting more data, running a fancier test, or adjusting the analysis afterward cannot fix a design that was confounded from the start, because none of those happen until after the one decision that mattered: who got assigned to what, and how.

=== step === quiz
## Quick check: naming what went wrong

Go back to the opt-in design: Northfield Kitchens let 1,200 visitors self-select into the new checkout by clicking a banner.

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- How many: the design used too few visitors to detect the effect. ::no
- Randomized: visitors were allowed to choose their own checkout version instead of being assigned one by chance. ::ok Right. The unit, what was measured, and what got compared were all fine. The one decision that failed was leaving who gets what up to the visitor instead of to chance, which is exactly what let the confound take hold.
- Measured: the design recorded the wrong outcome for a checkout test. ::no The sample size and the outcome definition were both fine, the sample-size sweep shows this design's bias holds at every n tested, from 500 visitors to 16,000. What actually broke the comparison was letting visitors choose their own version instead of being assigned one at random, which is the "randomized" decision, not "how many" or "measured".

=== step === tryit
## Your turn: make the comparison random again

Here is the opt-in design's banner-click assignment. Edit the line that builds `version` so it assigns the checkout by a fair coin flip instead, independent of whether a visitor clicked the banner.

```r
# Northfield Kitchens let visitors opt in to the new checkout by clicking a
# banner; 1 in 5 visitors clicked it
n_visitors <- 6000
clicked_banner <- rep(c(TRUE, FALSE, FALSE, FALSE, FALSE), length.out = n_visitors)
version <- ifelse(clicked_banner, "new", "old")
table(version)
#> version
#>  new  old 
#> 1200 4800 
```

Replace the `ifelse(clicked_banner, "new", "old")` line so every visitor has the same chance of either checkout, regardless of `clicked_banner`. Two functions that draw by chance are `sample()` and `rbinom()`. Press Check when you have it.

::check {"regex": "sample\\s*[(]|rbinom\\s*[(]", "gate": true, "difficulty": "intermediate", "ok": "Right. Once version is assigned by a fair coin flip instead of by clicked_banner, the two groups are comparable again before the checkout version is even decided, which is exactly what visitor-level randomization had and this one did not.", "no": "Replace the ifelse(clicked_banner, \"new\", \"old\") line with a random draw instead, something like sample(c(\"old\", \"new\"), n_visitors, replace = TRUE), so the result no longer depends on clicked_banner at all."}
::solution
```r
# Assign the checkout version by a fair coin flip, independent of clicked_banner
set.seed(21)
n_visitors <- 6000
clicked_banner <- rep(c(TRUE, FALSE, FALSE, FALSE, FALSE), length.out = n_visitors)
version <- sample(c("old", "new"), n_visitors, replace = TRUE)
table(version)
#> version
#>  new  old 
#> 3054 2946 
```

Now the split is close to even and has nothing to do with who clicked a banner, which is what a randomized assignment looks like.

=== step === concept
## References

- Fisher, R.A. (1935). The Design of Experiments. Oliver and Boyd. The original argument for randomization as the source of a comparison's validity.
- Box, G.E.P., Hunter, W.G. and Hunter, J.S. (2005). Statistics for Experimenters, 2nd edition. Wiley. Covers blocking, factorial design and confounding in depth.
- [Trustworthy Online Controlled Experiments](https://www.cambridge.org/core/books/trustworthy-online-controlled-experiments/D97B26382EB0EB2DC2019A7A7B518F59) - Kohavi, R., Tang, D. and Xu, Y. (2020), Cambridge University Press. A/B testing practice and the design pitfalls this lesson simulates.
- [Observational Studies, 2nd edition](https://doi.org/10.1007/978-1-4757-3692-2) - Rosenbaum, P.R. (2002), Springer. Why confounding in a non-randomized comparison resists being fixed by statistics alone.
- [For Objective Causal Inference, Design Trumps Analysis](https://doi.org/10.1214/08-AOAS187) - Rubin, D.B. (2008), Annals of Applied Statistics, 2(3), 808-840. The source behind this lesson's thesis.

=== step === complete
## What a defensible study design buys you

Let's pull the whole lesson into one place. Five decisions settle a study design before any data exists: the unit, what gets randomized, what gets measured, how many units, and what gets compared against what. Northfield Kitchens tested the same 2-point true lift four ways. Visitor-level and day-level randomization both recovered it, the first cleanly, the second more noisily, while letting visitors opt in and comparing before against after both missed it by a fixed amount, 4 points and 3 points, no matter how much data either one collected.

The lesson underneath all four designs is this: a study design decides, before a single visitor arrives, whether the comparison it eventually produces can be trusted. No amount of data and no amount of clever analysis afterward substitutes for that one decision.

Next: what to do when randomization alone will not spread some known difference evenly across groups, and how blocking fixes that.
