---
title: "ANOVA and Multiple Comparisons Lesson 3: When an effect depends on another"
catalog_blurb: "Why a factor's effect can be positive for one group and negative for another."
description: "Two tests on the same sign-up banner: one where both visitor groups respond alike, one where the effect reverses, and why one coefficient alone hides which."
keywords: "interaction effect, two-way ANOVA, simple effect, main effect, reference level, interaction.plot, dummy coding, moderator variable, R regression coefficients, crossed interaction"
post_type: "LESSON"
curriculum_id: "4.50.3"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "res-anova"
course_title: "ANOVA and Multiple Comparisons"
course_lesson: "3"
course_total: "8"
course_landing: "ANOVA-and-Multiple-Comparisons-Course.html"
course_next: "Fixed-or-Random-Which-Factor-Is-Which.html"
course_prev: "Two-Factors-and-Their-Combined-Effect.html"
---

=== step === cover
## When an effect depends on another

Today let's understand what happens when one factor's effect on an outcome is not the same size for every level of another factor.

An online course platform wants more visitors to sign up for a free account. So it tests a banner on its landing page: either a plain "Sign up" banner, or one that mentions a discount on the first paid course. It shows this banner to two kinds of visitors, New visitors who have never been to the site before, and Returning visitors who have been there before. Over twelve days, it ran each of the four combinations of visitor group and banner for three separate days, and recorded each day's sign-up rate as a percent of visitors who signed up.

Here are all twelve days, plotted together first, then split into one small chart per visitor group.

::widget facet-grid {"data":[{"x":"Plain","y":3.1,"facet":"New"},{"x":"Plain","y":4.7,"facet":"New"},{"x":"Plain","y":4.0,"facet":"New"},{"x":"Discount","y":5.0,"facet":"New"},{"x":"Discount","y":6.8,"facet":"New"},{"x":"Discount","y":6.0,"facet":"New"},{"x":"Plain","y":6.0,"facet":"Returning"},{"x":"Plain","y":8.3,"facet":"Returning"},{"x":"Plain","y":7.0,"facet":"Returning"},{"x":"Discount","y":8.0,"facet":"Returning"},{"x":"Discount","y":10.3,"facet":"Returning"},{"x":"Discount","y":9.0,"facet":"Returning"}],"geom":"bar","x":"banner","y":"sign-up rate (percent)","facetVar":"group"}

Flip the toggle. In the combined chart, Discount's bars sit a little ahead of Plain's throughout. Once each visitor group gets its own small chart, that gap looks the same size in New's panel and in Returning's panel.

=== step === concept
## Two simple effects, one for each group

Let's put real numbers on what that chart showed, and give that gap its proper name.

Build the twelve days into a data frame, then get each of the four group-banner combinations' average sign-up rate.

```r
# Build the first test's 12 real daily sign-up rates, one row per day
banner_parallel <- data.frame(
  group = rep(c("New", "Returning"), each = 6),
  banner = rep(rep(c("Plain", "Discount"), each = 3), 2),
  signup = c(3.1, 4.7, 4.0, 5.0, 6.8, 6.0, 6.0, 8.3, 7.0, 8.0, 10.3, 9.0)
)
banner_parallel$group <- factor(banner_parallel$group, levels = c("New", "Returning"))
banner_parallel$banner <- factor(banner_parallel$banner, levels = c("Plain", "Discount"))

cell_means <- tapply(banner_parallel$signup, list(banner_parallel$group, banner_parallel$banner), mean)
print(cell_means)
#>              Plain Discount
#> New       3.933333 5.933333
#> Returning 7.100000 9.100000
```

`group` and `banner` are stored as factors, R's name for a categorical variable with a fixed set of levels. R would order them alphabetically by default, which would put Discount before Plain. The levels are set explicitly here instead, Plain first and Discount second, so that choice is deliberate rather than left to chance, and it will matter later. `tapply()` then splits `signup` by `group` and `banner` together and averages each of the four resulting cells.

Now ask the same question within each visitor group separately: how much higher is the Discount banner's average sign-up rate than Plain's?

```r
# The banner's lift, computed separately within each visitor group
lift_new <- cell_means["New", "Discount"] - cell_means["New", "Plain"]
lift_returning <- cell_means["Returning", "Discount"] - cell_means["Returning", "Plain"]
print(lift_new)
#> [1] 2
print(lift_returning)
#> [1] 2
```

Both come out to 2.000 percentage points. The banner's effect measured within one specific level of the other factor, here within New or within Returning, is called its **simple effect**. New's simple effect of the banner is +2.000, and Returning's simple effect is also +2.000: the same number, computed completely separately from two different sets of six days.

That will not always happen.

=== step === concept
## What parallel lines in an interaction plot mean

There is a standard picture for comparing two simple effects like these at a glance, called an interaction plot.

Put the two visitor groups on the horizontal axis, and connect each banner's two cell means with its own line.

```r
# Plot each banner's mean sign-up rate across the two visitor groups
interaction.plot(banner_parallel$group, banner_parallel$banner, banner_parallel$signup,
                  xlab = "visitor group", ylab = "sign-up rate (percent)",
                  trace.label = "banner")
```

Plain's line runs from 3.933 at New to 7.100 at Returning. Discount's line runs from 5.933 at New to 9.100 at Returning. Both lines climb by exactly 3.167 points, because Returning visitors convert higher than New visitors on either banner, a separate fact from what we are after here.

What matters is the gap between the two lines: 2.000 at New, and 2.000 again at Returning. Since that gap never changes, the two lines sit exactly parallel, the same vertical distance apart everywhere.

Parallel lines are exactly what it looks like when one factor's effect does not depend on the other factor. When it does depend, when a factor's effect changes size or direction across the other factor's levels, statisticians call that an **interaction** between the two factors. This first test shows no interaction at all: the banner's effect stayed at +2.000 regardless of which visitor group you look at.

=== step === widget
## A second test: the same banner, reversed for Returning

Now imagine the platform runs a second, completely independent test, with the same setup over twelve new days. New visitors' six days come out unchanged, still a +2.000 lift. But by chance, Returning's two banner conditions land the other way around this time: the three days that would have been Plain now read 8.0, 10.3 and 9.0, and the three that would have been Discount now read 6.0, 8.3 and 7.0.

Here are those twelve new days, same chart as before.

::widget facet-grid {"data":[{"x":"Plain","y":3.1,"facet":"New"},{"x":"Plain","y":4.7,"facet":"New"},{"x":"Plain","y":4.0,"facet":"New"},{"x":"Discount","y":5.0,"facet":"New"},{"x":"Discount","y":6.8,"facet":"New"},{"x":"Discount","y":6.0,"facet":"New"},{"x":"Plain","y":8.0,"facet":"Returning"},{"x":"Plain","y":10.3,"facet":"Returning"},{"x":"Plain","y":9.0,"facet":"Returning"},{"x":"Discount","y":6.0,"facet":"Returning"},{"x":"Discount","y":8.3,"facet":"Returning"},{"x":"Discount","y":7.0,"facet":"Returning"}],"geom":"bar","x":"banner","y":"sign-up rate (percent)","facetVar":"group"}

Flip the toggle again. New's panel looks exactly like before, Discount still sits above Plain by about 2 points. But in Returning's panel, the order has flipped: Plain's bars are now the taller ones.

=== step === concept
## Crossed lines, set against the parallel case

Build this second test into its own data frame, and draw the same interaction plot, right next to the first one.

```r
# Build the second test, then plot its interaction alongside the first test's for comparison
banner_crossed <- data.frame(
  group = rep(c("New", "Returning"), each = 6),
  banner = rep(rep(c("Plain", "Discount"), each = 3), 2),
  signup = c(3.1, 4.7, 4.0, 5.0, 6.8, 6.0, 8.0, 10.3, 9.0, 6.0, 8.3, 7.0)
)
banner_crossed$group <- factor(banner_crossed$group, levels = c("New", "Returning"))
banner_crossed$banner <- factor(banner_crossed$banner, levels = c("Plain", "Discount"))

# Compare the parallel lines from the first test against the crossed lines from the second
par(mfrow = c(1, 2))
interaction.plot(banner_parallel$group, banner_parallel$banner, banner_parallel$signup,
                  xlab = "visitor group", ylab = "sign-up rate (percent)",
                  trace.label = "banner", main = "First test")
interaction.plot(banner_crossed$group, banner_crossed$banner, banner_crossed$signup,
                  xlab = "visitor group", ylab = "sign-up rate (percent)",
                  trace.label = "banner", main = "Second test")
par(mfrow = c(1, 1))
```

Look at the second panel next to the first. At New, Discount's line still sits 2.000 points above Plain's, 3.933 against 5.933, same as before.

But by Returning, Discount has dropped to 7.100 while Plain has climbed all the way to 9.100, so now Plain sits 2.000 points above Discount. Both lines do rise from New to Returning, since Returning visitors convert higher than New visitors on either banner, but Discount's line rises far less steeply than Plain's.

The gap between the two lines starts at +2.000 in Discount's favor at New, and ends at -2.000 in Plain's favor at Returning. Somewhere between the two, the lines have to cross.

That crossing is exactly what an interaction looks like on this plot. The banner's simple effect reverses direction: +2.000 for New, -2.000 for Returning, depending entirely on which visitor group you look at.

=== step === concept
## The ANOVA table's interaction row confirms the plot

A plot is useful for the eye, but a two-way ANOVA puts a number on what it shows, through the interaction term's own row in the table.

Fit the same model, `signup` explained by `group`, `banner`, and their interaction, on both tests, and read the table each one produces.

```r
# Fit a two-way ANOVA with an interaction term on both tests
aov_parallel <- aov(signup ~ group * banner, data = banner_parallel)
aov_crossed  <- aov(signup ~ group * banner, data = banner_crossed)

summary(aov_parallel)
#>              Df Sum Sq Mean Sq F value   Pr(>F)    
#> group         1 30.083  30.083   29.23 0.000641 ***
#> banner        1 12.000  12.000   11.66 0.009160 ** 
#> group:banner  1  0.000   0.000    0.00 1.000000    
#> Residuals     8  8.233   1.029                     
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1

summary(aov_crossed)
#>              Df Sum Sq Mean Sq F value   Pr(>F)    
#> group         1 30.083  30.083   29.23 0.000641 ***
#> banner        1  0.000   0.000    0.00 1.000000    
#> group:banner  1 12.000  12.000   11.66 0.009160 ** 
#> Residuals     8  8.233   1.029                     
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
```

The formula `group * banner` expands to three rows: `group`, `banner`, and `group:banner`, the interaction row. On the first test, `group:banner` reads F = 0.00, p = 1.000000, as plain as a statistic gets: no interaction, matching the parallel lines exactly. On the second, `group:banner` reads F = 11.66, p = 0.009160, a real, detectable interaction, matching the crossed lines.

That table holds two more things worth noticing.

`group`'s own row reads identically in both tests, F = 29.23, p = 0.000641. Swapping which banner pairs with which day inside Returning never changes Returning's own six totals, so Returning's overall average against New's stays the same either way.

But `banner`'s own row flips: F = 11.66, p = 0.009160 on the first test, and F = 0.00, p = 1.000000 on the second. The banner did not stop mattering on the second test, it mattered just as much as before. What changed is that it helped New and hurt Returning by the same 2.000 points, and averaged together, those two effects cancel out exactly.

That cancellation is where the next trap lives.

=== step === concept
## The trap: a coefficient's effect at one reference level only

That vanishing act in `banner`'s own row is exactly why it is easy to misread a regression coefficient once an interaction term is in the model.

Fit the same model with `lm()` instead of `aov()`, and read the `bannerDiscount` row specifically, on both tests.

```r
# Fit the same two-way model with lm() and read the bannerDiscount row on both tests
fit_parallel <- lm(signup ~ group * banner, data = banner_parallel)
fit_crossed  <- lm(signup ~ group * banner, data = banner_crossed)

coef(summary(fit_parallel))["bannerDiscount", ]
#>   Estimate Std. Error    t value   Pr(>|t|) 
#> 2.00000000 0.82831824 2.41453091 0.04220873 
coef(summary(fit_crossed))["bannerDiscount", ]
#>   Estimate Std. Error    t value   Pr(>|t|) 
#> 2.00000000 0.82831824 2.41453091 0.04220873 
```

Identical. Both report `bannerDiscount` = 2.0000, the same standard error, the same t value, the same p = 0.0422. Reading only that one line, you would conclude the banner's effect is 2.000 points on both tests. That conclusion is right for the first test and wrong for the second.

Compare it against the banner's actual overall effect, averaged across both visitor groups.

```r
# Compare the banner's marginal mean, averaged across both visitor groups, on each test
tapply(banner_parallel$signup, banner_parallel$banner, mean)
#>    Plain Discount 
#> 5.516667 7.516667 
tapply(banner_crossed$signup, banner_crossed$banner, mean)
#>    Plain Discount 
#> 6.516667 6.516667 
```

On the first test, Plain averages 5.517 and Discount averages 7.517, a real overall gap of 2.000, matching `bannerDiscount`. On the second, Plain averages 6.517 and Discount also averages 6.517 to four decimal places, a gap of 0.000. The banner's true overall effect is 2.000 on the first test and 0.000 on the second. Yet `bannerDiscount` read 2.0000 on both.

Here is why. Look at the full table for the second test.

```r
# Look at the full coefficient table for the second test, interaction row included
summary(fit_crossed)
#>
#> Call:
#> lm(formula = signup ~ group * banner, data = banner_crossed)
#>
#> Residuals:
#>      Min       1Q   Median       3Q      Max 
#> -1.10000 -0.85833 -0.01667  0.79167  1.20000 
#>
#> Coefficients:
#>                               Estimate Std. Error t value Pr(>|t|)    
#> (Intercept)                     3.9333     0.5857   6.716 0.000150 ***
#> groupReturning                  5.1667     0.8283   6.238 0.000249 ***
#> bannerDiscount                  2.0000     0.8283   2.415 0.042209 *  
#> groupReturning:bannerDiscount  -4.0000     1.1714  -3.415 0.009160 ** 
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
#>
#> Residual standard error: 1.014 on 8 degrees of freedom
#> Multiple R-squared:  0.8364,	Adjusted R-squared:  0.775 
#> F-statistic: 13.63 on 3 and 8 DF,  p-value: 0.001645
```

R picked New as `group`'s reference level, because it was listed first, and Plain as `banner`'s reference level, for the same reason. `bannerDiscount` answers one specific question: moving from Plain to Discount while `group` stays at its reference level, New, how much does `signup` change?

That is all it has ever measured. It looked like an overall average on the first test only because New's and Returning's simple effects happened to be identical there, so the one-level number and the overall-average number coincided by chance.

The moment the interaction term, `groupReturning:bannerDiscount`, starts doing real work, -4.0000 here, that coincidence breaks. `bannerDiscount` keeps reporting New's simple effect alone, and that simple effect has stopped matching the overall picture.

[KEY INSIGHT]
Once a model includes an interaction term, a factor's own coefficient is never an average effect. It is that factor's simple effect at exactly one reference level of the other factor, the level R happened to list first.

=== step === quiz
## Quick check: reading the banner's coefficient correctly

On `banner_crossed`, `bannerDiscount` read 2.0000, yet the banner's true overall effect was 0.000. What does `bannerDiscount` actually measure here?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The banner's overall average effect, since `summary()` prints only one row named `banner`. ::no
- The banner's simple effect at New, the reference level that `group` defaults to in this model. ::ok Exactly. `bannerDiscount` never reports an average, it reports Discount's advantage over Plain while `group` sits at New. On the first test, New's and Returning's simple effects both happened to be 2.000, so that single number looked like an overall effect. On the second, they pulled apart to +2.000 and -2.000, and `bannerDiscount` kept reporting only New's own simple effect.
- Nothing. Once an interaction term is significant, every main-effect coefficient in the model becomes meaningless. ::no
- The gap between Plain's and Discount's marginal means, averaged across both visitor groups. ::no None of those is what `bannerDiscount` reports. It is not an average across both groups, a real interaction does not void every main-effect coefficient, and it is not the gap between the two marginal banner means either. It is the banner's simple effect at exactly one level of `group`, New, the reference level R picked because it was listed first. Read at Returning instead, and the banner's simple effect reverses completely.

=== step === widget
## The honest simple effect at Returning, two ways

So if `bannerDiscount` only reports New's simple effect, how do you get Returning's honest number?

One way is by hand: add the reference-level coefficient to the interaction coefficient.

```r
# Add the reference coefficient and the interaction coefficient to get Returning's simple effect
coef(fit_crossed)["bannerDiscount"] + coef(fit_crossed)["groupReturning:bannerDiscount"]
#> bannerDiscount 
#>             -2 
```

2.0000 plus -4.0000 is -2.0000. The interaction coefficient is literally the difference between the two groups' simple effects: it says Returning's simple effect of the banner is 4.000 points lower than New's. New's is +2.000, so Returning's is +2.000 - 4.000 = -2.000.

The other way is to make Returning the reference level instead, and refit the exact same model.

```r
# Make Returning the reference level for group, then refit so bannerDiscount reads Returning's simple effect directly
banner_crossed_releveled <- banner_crossed
banner_crossed_releveled$group <- relevel(banner_crossed_releveled$group, ref = "Returning")

fit_releveled <- lm(signup ~ group * banner, data = banner_crossed_releveled)
coef(summary(fit_releveled))["bannerDiscount", ]
#>    Estimate  Std. Error     t value    Pr(>|t|) 
#> -2.00000000  0.82831824 -2.41453091  0.04220873 
```

Now `bannerDiscount` reads -2.0000 directly, with the same standard error, the same size of t value, and the same p = 0.0422 as the New-level version, just the opposite sign. Both routes agree.

See that -2.000 slope recovered visually. Here are just the six Returning days, with Plain recoded as 0 and Discount recoded as 1.

::widget ols-fit {"points":[{"x":0,"y":8.0},{"x":0,"y":10.3},{"x":0,"y":9.0},{"x":1,"y":6.0},{"x":1,"y":8.3},{"x":1,"y":7.0}]}

Snap to least squares, and the line's slope lands on -2.000, with an intercept of 9.100, Plain's own average at Returning. The decision this leads to is concrete: show Discount to New visitors and Plain to Returning visitors, not the same banner to everyone, because the banner genuinely helps one group and genuinely hurts the other.

=== step === quiz
## Quick check: what a crossed interaction row confirms

`banner_crossed`'s `group:banner` row read F = 11.66, p = 0.009160, and its interaction plot crossed between New and Returning. What does that combination actually confirm?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- It means the banner affects neither visitor group, since a significant interaction says nothing about either group on its own. ::no
- The banner's main effect must also be significant, since a real interaction drags the main-effect test down with it. ::no
- The banner's effect on sign-ups genuinely reverses direction between the two visitor groups, matching the crossing lines. ::ok Right. A significant `group:banner` row backed by crossing lines is two independent pieces of evidence for the same fact: the banner genuinely helps New visitors and genuinely hurts Returning visitors, by about 2.000 points each way.
- The result is untrustworthy, since an interaction term inflates p-values beyond what the data actually supports. ::no None of those follows from a significant interaction. It says nothing about whether the main effect is itself significant, which here actually read p = 1.000000; it does not inflate anything, it is testing a real pattern in the data; and it does not mean neither group is affected. Both groups show a real banner effect, just in opposite directions, which is exactly what the crossing lines and F = 11.66 are telling you together.

=== step === tryit
## Your turn: find the honest effect on a new dataset

A different, independent scenario: a support team is testing two reply templates for tickets, Standard and Detailed, crossed with the ticket's priority, Low or High. Three tickets per combination, twelve tickets total, hours to resolve recorded for each.

The code below builds that data, fits the same kind of two-way interaction model, and prints its coefficients.

```r
# Build the support team's ticket data and fit the two-way interaction model
ticket_hours <- data.frame(
  priority = rep(c("Low", "High"), each = 6),
  template = rep(rep(c("Standard", "Detailed"), each = 3), 2),
  hours = c(1.8, 2.3, 2.0, 2.9, 3.4, 2.8, 6.3, 5.7, 6.1, 3.9, 4.3, 3.9)
)
ticket_hours$priority <- factor(ticket_hours$priority, levels = c("Low", "High"))
ticket_hours$template <- factor(ticket_hours$template, levels = c("Standard", "Detailed"))

fit <- lm(hours ~ priority * template, data = ticket_hours)
print(coef(fit))
#>                   (Intercept)                  priorityHigh 
#>                      2.033333                      4.000000 
#>              templateDetailed priorityHigh:templateDetailed 
#>                      1.000000                     -3.000000 

template_effect <- coef(fit)["templateDetailed"]
interaction_effect <- coef(fit)["priorityHigh:templateDetailed"]
```

`templateDetailed` is Detailed's simple effect at Low priority, `priority`'s reference level, the same kind of number `bannerDiscount` was for New. `template_effect` and `interaction_effect` above hold exactly those two coefficients.

```r
# template_effect and interaction_effect are already computed above.
# Add them to get Detailed's simple effect specifically at High priority,
# the same move used for Returning's banner effect earlier.
# One line. Press Check when you have it.
```
::check {"regex": "template_effect\\s*[+]\\s*interaction_effect|interaction_effect\\s*[+]\\s*template_effect", "gate": true, "difficulty": "intermediate", "ok": "Right: -2.0000. At High-priority tickets specifically, Detailed resolves tickets 2 hours faster than Standard, the opposite of what templateDetailed alone (+1.0000) suggests.", "no": "Add the two coefficients already pulled out above: template_effect + interaction_effect, in either order."}
::solution
```r
# Add template_effect and interaction_effect to get the simple effect at High priority
simple_effect_at_high <- template_effect + interaction_effect
print(unname(simple_effect_at_high))
#> [1] -2
```

`templateDetailed` alone, +1.0000, says nothing about High-priority tickets, it is Low priority's simple effect. Adding the interaction coefficient, -3.0000, moves it to High priority: 1.0000 + (-3.0000) = -2.0000. At High priority, Detailed actually resolves tickets two hours faster than Standard, the reverse of what the Low-priority number suggests on its own. Releveling `priority` to High and refitting would hand back this -2.0000 directly as `templateDetailed`, the same move used for Returning's banner effect earlier.

=== step === concept
## References

- Montgomery, D.C. (2017). "Design and Analysis of Experiments." Wiley. The two-factor interaction term and its sums of squares, the idea behind the `group:banner` row in this lesson.
- Maxwell, S.E. and Delaney, H.D. (2004). "Designing Experiments and Analyzing Data." Routledge. Why a main-effect coefficient describes one reference level once an interaction term is in the model, the trap at the center of this lesson.
- Keppel, G. and Wickens, T.D. (2004). "Design and Analysis: A Researcher's Handbook." Pearson. Simple effects as the honest alternative to a misread main effect.
- Field, A., Miles, J. and Field, Z. (2012). "Discovering Statistics Using R." Sage. Reading `interaction.plot()` output, parallel lines against crossed ones.
- [R documentation: interaction.plot](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/interaction.plot.html) - R Core Team, the function drawing every interaction plot in this lesson.
- [R documentation: relevel](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/relevel.html) - R Core Team, the function used to change a factor's reference level and recover Returning's simple effect directly.
- [R documentation: aov](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/aov.html) - R Core Team, the function fitting every two-way ANOVA table in this lesson.

=== step === complete
## One sentence before the term, one honest effect after

::prose-only the step is a one-screen recap in prose; no new visual is needed beyond what earlier steps already showed

You have now seen both halves of this.

- An interaction is one factor's effect changing size, or even direction, across the other factor's levels. The banner lifted New's sign-ups by 2.000 points and cut Returning's by 2.000 points, in the very same test.
- The `group:banner` row's F and p agree with what the interaction plot shows: F = 0.00, p = 1.000000 for parallel lines, F = 11.66, p = 0.009160 for crossed ones.
- The honest simple effect at a specific level comes from summing coefficients, or from releveling and refitting, never from the main-effect row alone once an interaction is in the model.

Next, the question moves from how two factors combine to a different one entirely: whether a factor in your design counts as fixed, like the two banners here, or random, like a sample of clinics or stores, because that choice changes the arithmetic that follows.
