---
title: "Causal Inference for Decisions Lesson 4: Staggered DiD and the Negative-Weights Problem"
catalog_blurb: "When a policy rolls out in waves, the usual estimator can mislead."
description: "Staggered rollouts break simple difference-in-differences: two-way fixed effects can put negative weights on comparisons and understate the effect. See why, and the fix, in R."
keywords: "staggered difference-in-differences, negative weights problem, two-way fixed effects, TWFE bias, Goodman-Bacon decomposition, group-time ATT, event study, dynamic treatment effects, causal inference, R"
post_type: "LESSON"
curriculum_id: "6.180.4"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-causal-decisions"
course_title: "Causal Inference for Decisions"
course_lesson: "4"
course_total: "11"
course_landing: "R-Causal-Decisions-Course.html"
course_next: "Regression-Discontinuity.html"
course_prev: "Difference-in-Differences-and-Parallel-Trends.html"
---

=== step === cover
::eyebrow Lesson 4 of 11
## Staggered DiD and the Negative-Weights Problem

In Lesson 3 the world was tidy: one policy, one date, two groups. New Jersey raised its wage in April 1992, Pennsylvania did not, and one line of `lm(y ~ treat*post)` recovered the effect. Real policies are almost never that clean. States legalise something in different years, a company rolls a feature out region by region, a hospital chain adopts a protocol ward by ward. Treatment arrives in **waves**.

For twenty years the standard response was to throw all the waves into one regression with unit and time fixed effects and read off a single coefficient. Around 2018 the field discovered that this move can quietly break, so badly that it can report a **negative** effect when every unit was helped. This lesson shows you exactly how, on a rollout you can run yourself, and what to do instead.

By the end you will be able to:

- Set up a staggered-adoption panel and see why one `treat*post` no longer fits
- Fit two-way fixed effects (TWFE) and catch it understating an effect you planted yourself
- Explain the forbidden comparison: already-treated units used as controls, and why a growing effect turns it negative
- Build a clean group-time estimate with a never-treated control, and read the event study it gives you

**Prerequisites:** [Lesson 3](Difference-in-Differences-and-Parallel-Trends.html) (the 2x2 DiD, `lm(y ~ treat*post)`, and parallel trends). You can fit `lm`, read its coefficients, and subset a data frame in base R.

::widget did-parallel {}

=== step === concept
::eyebrow The setup
## When treatment comes in waves

Here is our running example for the whole lesson. **Northwind**, a grocery chain, launches a customer loyalty program, but not everywhere at once. It pilots in one set of regions first, expands to a second set two years later, and holds a third set back as a comparison. Call them the **early** cohort (60 regions, program on in year 3), the **late** cohort (60 regions, year 5), and the **never** cohort (60 regions, no program in our window). The outcome is average weekly revenue per store.

We build the panel here so the numbers are ours to check. Each region gets its own baseline revenue level, revenue drifts up 1 unit a year for everyone, and the loyalty program adds a lift that **grows** the longer it has been running: +2 in its launch year, +4 the next year, +6 the year after. That growth is the detail that will matter most.

```r
set.seed(2024)
years      <- 1:6
per_cohort <- 60
adopt_of   <- c(early = 3, late = 5, never = Inf)   # year each cohort switches the program on

region <- data.frame(
  region = 1:(3 * per_cohort),
  cohort = rep(c("early", "late", "never"), each = per_cohort)
)
region$adopt <- adopt_of[region$cohort]
region$base  <- rnorm(nrow(region), mean = 50, sd = 4)   # each region's own revenue level

panel <- expand.grid(region = region$region, year = years)
panel <- merge(panel, region, by = "region")
panel$treated <- as.integer(panel$year >= panel$adopt)                          # program live this year?
panel$evt     <- ifelse(is.finite(panel$adopt), panel$year - panel$adopt, NA)   # years since launch
panel$effect  <- ifelse(panel$treated == 1, 2 * (panel$evt + 1), 0)             # +2 at launch, growing +2/yr
panel$y       <- panel$base + 1 * (panel$year - 1) + panel$effect + rnorm(nrow(panel), 0, 2)

table(cohort = region$cohort, adopts_in_year = region$adopt)
#>        adopts_in_year
#> cohort   3  5 Inf
#>   early 60  0   0
#>   late   0 60   0
#>   never  0  0  60
```

Plotting each cohort's average revenue over time makes the staggered shape obvious. Watch where each line bends upward.

```r
library(ggplot2)
traj <- aggregate(y ~ year + cohort, panel, mean)   # average revenue per cohort per year
p <- ggplot(traj, aes(year, y, colour = cohort)) +
  geom_vline(xintercept = c(3, 5), linetype = "dashed") +
  geom_line(linewidth = 1) + geom_point(size = 2) +
  labs(x = "year", y = "avg weekly revenue per store ($000s)",
       colour = "cohort", title = "Three cohorts, two adoption dates")
print(p)
```

The early line (dashed marker at year 3) breaks upward first and keeps accelerating as its lift compounds. The late line lifts off at year 5. The never line just drifts along the shared trend. Three groups, two switch-on dates: that is staggered adoption, and a single before/after split cannot describe it.

=== step === concept
::eyebrow The natural generalization
## Two-way fixed effects, and a nasty surprise

With many units and many periods, you cannot write one `post` indicator. The standard extension is **two-way fixed effects**: give every region its own intercept, give every year its own intercept, and let one coefficient carry the treatment.

\[ Y_{it} = \alpha_i + \lambda_t + \beta\, D_{it} + \varepsilon_{it} \]

Reading each symbol in plain words: \(Y_{it}\) is revenue for region \(i\) in year \(t\); \(\alpha_i\) is the **region fixed effect**, that region's own baseline (the `factor(region)` term); \(\lambda_t\) is the **year fixed effect**, whatever moved every region that year (the `factor(year)` term); \(D_{it}\) is 1 when region \(i\) has the program running in year \(t\) and 0 otherwise (our `treated` column); \(\beta\) is the single number everyone reads as "the effect"; and \(\varepsilon_{it}\) is noise. It looks like an honest generalization of `treat*post`, and for decades it was the default. Let us fit it.

```r
twfe <- lm(y ~ factor(region) + factor(year) + treated, data = panel)
round(coef(twfe)["treated"], 2)
#> treated
#>    2.89
```

TWFE says the loyalty program is worth about **+2.89** in weekly revenue. Now the advantage of building the data ourselves: we know the true answer. The real average effect across every region-year that actually had the program running is just the mean of the lift we planted.

```r
true_att <- mean(panel$effect[panel$treated == 1])   # we know the truth: we built it
round(true_att, 2)
#> [1] 4.33
```

The truth is **+4.33**. TWFE reported **+2.89**, understating the real effect by a third. Nothing is wrong with the data, the sample is large, and parallel trends hold by construction (every cohort shares the same year trend). The estimator itself is biased.

[WARNING]
This is not sampling noise you can average away with more regions. It is a structural bias in TWFE that appears specifically when units adopt at different times and the treatment effect changes over time. Find out why before you ever trust a staggered `treated` coefficient.

=== step === quiz
::eyebrow Check yourself
## Where did the third go?

TWFE returned +2.89 when the true average effect was +4.33, on clean, large, parallel-trending data. What is the most likely source of the gap?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- The cohorts started at different baseline revenue levels, so parallel trends is violated and the estimate is biased ::no Different baselines are exactly what the region fixed effects \(\alpha_i\) absorb, just as `treat` did in Lesson 3. Levels are harmless here; parallel trends holds by construction. The bias is coming from somewhere else.
- With only 60 regions per cohort the sample is too small; thousands of regions would close the gap ::no This is bias, not variance. More regions would tighten the estimate around +2.89, not move it toward +4.33. You cannot average away a systematic error.
- To estimate the late cohort's effect, TWFE ends up using the already-treated early cohort as a control, and that "control" is still rising ::ok Exactly. TWFE has no never-treated-only rule. When the late cohort switches on, the machinery compares it to whatever else is changing, including the early cohort, whose effect is still growing. That contaminated comparison is what drags the estimate down.

=== step === widget
::eyebrow Why it happens
## TWFE is an average of every 2x2 you can build

Andrew Goodman-Bacon proved the exact anatomy in 2021. The single TWFE coefficient is a weighted average of all the simple two-group, two-period DiDs you can form between your timing cohorts. With early, late and never cohorts, four kinds of 2x2 go into the blend:

::widget process-flow {"steps":[{"title":"Early vs never","sub":"clean: the never-adopting regions are a valid, always-untreated control"},{"title":"Late vs never","sub":"clean: never-treated is untreated the whole window"},{"title":"Early vs late, before the late cohort adopts","sub":"clean: while it waits, the late cohort is a not-yet-treated control"},{"title":"Late vs early, after the early cohort adopts","sub":"forbidden: the early cohort is already treated, so its still-changing outcome is not a clean control"}]}

The first three are fine. The fourth is the troublemaker. When the late cohort finally switches on, one of the comparisons TWFE forms uses the **early cohort as the control**, even though the early cohort is already treated and its effect is still climbing.

De Chaisemartin and D'Haultfoeuille wrote the same failure a different way. TWFE is a weighted sum of the individual treatment effects,

\[ \hat\beta_{\text{TWFE}} = \sum_{i,t} w_{it}\, \tau_{it}, \qquad \sum_{i,t} w_{it} = 1, \]

where \(\tau_{it}\) is region \(i\)'s true effect in year \(t\) and \(w_{it}\) is the weight TWFE puts on it. The catch: some of those weights \(w_{it}\) are **negative**. That is the negative-weights problem. When weights go negative, a program that helped every single region can still produce a small, or even negative, \(\hat\beta\).

=== step === concept
::eyebrow The crux
## The forbidden comparison, computed

Talk is cheap; let us actually build the fourth 2x2 and watch it go negative. Take the two years framing the late cohort's adoption. **Before** is years 3 and 4, when the early cohort is already treated but the late cohort is not yet. **After** is years 5 and 6, when both are treated. Treat the late cohort as the "treated" group and the early cohort as the "control", exactly the forbidden comparison.

```r
before <- panel$year %in% c(3, 4)   # early already treated, late NOT yet
after  <- panel$year %in% c(5, 6)   # both treated now
avg <- function(coh, when) mean(panel$y[panel$cohort == coh & when])

late_change  <- avg("late",  after) - avg("late",  before)
early_change <- avg("early", after) - avg("early", before)
round(c(late_change  = late_change,
        early_change = early_change,
        forbidden_did = late_change - early_change), 2)
#>   late_change  early_change forbidden_did
#>          4.94          5.91         -0.97
```

Read the double difference: **-0.97**. This 2x2 says the loyalty program *reduced* revenue, when in truth it raised it for the late cohort too. The arithmetic explains itself. The late cohort's change (+4.94) is its real launch lift plus the shared trend. But the early cohort's change (+5.91) is even larger, because over those same two years its effect grew from the +2/+4 range into the +6/+8 range. Subtracting a control that is itself accelerating overshoots, and the difference flips negative.

[KEY INSIGHT]
The forbidden 2x2 is biased only because the effect is **dynamic**. If the loyalty lift were a flat +2 forever, the early cohort's change would carry no extra treatment growth, it would cancel cleanly, and even this comparison would return the truth. Staggered timing alone is survivable. Staggered timing plus a changing effect is what poisons TWFE.

=== step === tryit
::eyebrow In R
## Build a comparison that is not forbidden

The fix is a discipline: never let an already-treated unit serve as a control. Compare each treated cohort only against units that are clean, the **never-treated** regions. Build the honest 2x2 for the late cohort's first treated year (it adopts in year 5, so year 4 is its last untreated year). Fill in the control cohort.

```r
cell <- function(coh, yr) mean(panel$y[panel$cohort == coh & panel$year == yr])
att_5_5 <- (cell("late", 5) - cell("late", 4)) -
           (cell("____",  5) - cell("____",  4))    # the clean control cohort
round(att_5_5, 2)
```
::check {"regex":"never","gate":true,"difficulty":"intermediate","ok":"That is the honest comparison. Against the never-treated regions the late cohort's first-year lift comes out near +2.78, close to the +2 we planted, with no already-treated control to contaminate it.","no":"Use the never cohort. Only the never-treated regions are untreated in BOTH year 4 and year 5, so their change is a clean stand-in for what the late cohort would have done without the program."}
::solution
```r
cell <- function(coh, yr) mean(panel$y[panel$cohort == coh & panel$year == yr])
att_5_5 <- (cell("late", 5) - cell("late", 4)) -
           (cell("never", 5) - cell("never", 4))
round(att_5_5, 2)
#> [1] 2.78
```

=== step === concept
::eyebrow The fix
## Estimate each group-time effect, then aggregate

That clean 2x2 is one **group-time average treatment effect**, written \(\widehat{\text{ATT}}(g, t)\): the effect for the cohort that adopted in year \(g\), measured in year \(t\), using its own pre-adoption baseline (year \(g-1\)) and a never-treated control.

\[ \widehat{\text{ATT}}(g, t) = \big[\bar Y_{g,t} - \bar Y_{g,g-1}\big] - \big[\bar Y_{C,t} - \bar Y_{C,g-1}\big] \]

Here \(\bar Y_{g,t}\) is the mean outcome of cohort \(g\) in year \(t\), \(g-1\) is that cohort's last untreated year, and \(C\) is the never-treated control. This is the estimator of Callaway and Sant'Anna: compute one honest ATT for every cohort in every year it was treated, never reusing a treated unit as a control, then average them into an overall effect.

```r
gt <- function(g, t) {                        # ATT for cohort g at year t, never-treated control
  who <- if (g == 3) "early" else "late"
  m <- function(coh, yr) mean(panel$y[panel$cohort == coh & panel$year == yr])
  (m(who, t) - m(who, g - 1)) - (m("never", t) - m("never", g - 1))
}
cells <- rbind(data.frame(g = 3, t = 3:6),    # early: treated in years 3, 4, 5, 6
               data.frame(g = 5, t = 5:6))    # late:  treated in years 5, 6
cells$att <- mapply(gt, cells$g, cells$t)
round(mean(cells$att), 2)                     # aggregate: average over all treated group-time cells
#> [1] 4.54
```

The clean estimate is **+4.54**, right on the true +4.33 and worlds away from TWFE's +2.89. Same data, same parallel trends, one rule changed: controls must be genuinely untreated. That single discipline is the whole difference between a biased answer and an honest one.

=== step === concept
::eyebrow Read the dynamics
## The event study TWFE hid

Because every ATT is tagged with a cohort and a year, you can line them up by **event time**, the number of years since a cohort adopted, and see how the effect evolves. This is the event study, and it recovers the exact growth pattern we planted.

```r
cells$e <- cells$t - cells$g                  # event time: years since this cohort adopted
es <- aggregate(att ~ e, cells, mean)         # average clean ATT at each event time
print(round(es, 2))
#>   e  att
#> 1 0 2.26
#> 2 1 4.26
#> 3 2 6.22
#> 4 3 7.96

p_es <- ggplot(es, aes(e, att)) +
  geom_hline(yintercept = 0, colour = "grey70") +
  geom_line(linewidth = 1) + geom_point(size = 2.5) +
  labs(x = "years since adoption", y = "estimated effect (ATT)",
       title = "The dynamic effect TWFE averaged away")
print(p_es)
```

A clean, rising staircase: about +2.3 in the launch year, +4.3, +6.2, +8.0. The loyalty program did not just help; it helped **more every year**. That is exactly the growth TWFE could not see, because the single coefficient crushes a whole trajectory into one biased number. Reporting one figure for a dynamic effect is a mistake even when it is not biased; the event study is what a decision-maker actually needs.

=== step === quiz
::eyebrow Check yourself
## When is plain TWFE actually safe?

You will still meet two-way fixed effects everywhere, and it is not always wrong. In which situation does a single staggered TWFE coefficient recover the true average effect without this bias?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Whenever the panel contains a never-treated group, since TWFE can then use it as a control ::no Having a never-treated group does not stop TWFE from also forming the forbidden comparisons between the early and late cohorts. It uses every comparison available, clean or not. The never-treated group helps the honest estimators, not TWFE itself.
- When either all units adopt at the same time, or the treatment effect is constant over time ::ok Right. A single adoption date is just the Lesson 3 2x2, with no already-treated controls to misuse. And if the effect never changes, an already-treated control has a flat, cancelable effect, so even the forbidden 2x2 returns the truth. Staggered timing plus a changing effect is the specific danger.
- As long as parallel trends holds for the untreated potential outcomes ::no This is the trap of the lesson. Parallel trends held perfectly in our data, and TWFE was still biased. Parallel trends licenses the honest group-time estimator; it does not rescue TWFE from negative weights under staggered timing.

=== step === concept
::eyebrow Go deeper
## References

Five authoritative places to take staggered DiD further:

- [Goodman-Bacon (2021), Difference-in-Differences with Variation in Treatment Timing (NBER)](https://www.nber.org/papers/w25018) - the decomposition behind the forbidden 2x2 you computed, in full.
- [de Chaisemartin and D'Haultfoeuille (2020), Two-Way Fixed Effects with Heterogeneous Effects (AER)](https://www.aeaweb.org/articles?id=10.1257/aer.20181169) - the theorem that TWFE is a weighted sum of effects with possibly-negative weights.
- [Callaway and Sant'Anna, the `did` R package](https://bcallaway11.github.io/did/) - the group-time ATT estimator you built by hand, production-ready with standard errors and event studies.
- [Roth, Sant'Anna, Bilinski and Poet (2023), What's Trending in Difference-in-Differences? (arXiv)](https://arxiv.org/abs/2201.01194) - the modern synthesis of the problem and the competing fixes.
- [Cunningham, Causal Inference: The Mixtape, DiD chapter](https://mixtape.scunning.com/09-difference_in_differences) - a from-scratch walk-through of the Bacon decomposition with runnable R.

=== step === complete
## Lesson 4 complete

You watched a trusted estimator lie. Two-way fixed effects returned +2.89 for a program whose true average effect was +4.33, not from noise but from structure: under staggered adoption it quietly uses already-treated units as controls, and when the effect is still growing, that forbidden comparison (you computed it: -0.97) drags the answer down through negative weights. The repair was a single discipline. Compare each cohort only to genuinely untreated units, estimate one honest ATT per group and year, and aggregate; that recovered +4.54 and, as an event study, the full rising path +2.3, +4.3, +6.2, +8.0 that the single coefficient had crushed flat.

Next, Lesson 5: Regression Discontinuity. When no group is left untreated at all, but treatment is switched by a sharp cutoff on some running variable, a passing grade, an income threshold, a vote share just over 50%, you can still read a causal effect from the jump right at the line. You will fit it, and learn how far from the cutoff you are allowed to look.
