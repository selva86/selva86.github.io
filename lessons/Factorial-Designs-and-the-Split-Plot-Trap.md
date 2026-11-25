---
title: "Experimental Design and A/B Testing Lesson 3: Factorial designs and the split-plot trap"
catalog_blurb: "Why one factorial experiment beats two separate tests, and the error it can hide."
description: "A bakery's 16-tray factorial test shows why crossing two factors beats testing them apart, and why a hard-to-change factor needs its own, bigger error term."
keywords: "factorial design, split-plot design, whole-plot error, subplot error, interaction effect, ANOVA, Error term in R, experimental design"
post_type: "LESSON"
curriculum_id: "4.120.3"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "res-design"
course_title: "Experimental Design and A/B Testing"
course_lesson: "3"
course_total: "8"
course_landing: "Experimental-Design-and-A-B-Testing-Course.html"
course_next: "Power-Analysis-by-Simulation-Not-Formula"
course_prev: "Randomize-What-You-Can-Block-What-You-Cannot"
---

=== step === cover
## Factorial designs and the split-plot trap

Today let's look at what happens when a study tests two things at once instead of one at a time, and why doing that well turns out to need more care than it looks.

Here is the example we will use throughout. A bakery wants to know what makes its cookies spread more on the tray: the oven temperature, Standard at 325F or High at 375F, and the recipe, the Original one or a New one with extra butter.

Temperature is awkward to test. Switching the oven from Standard to High and letting it settle again takes about 20 minutes, so a bakery cannot flip it before every single tray. Recipe is nothing like that. A baker can hand the New dough to one tray and the Original dough to the next tray in the very same oven run, with no waiting at all.

That gap, one factor cheap to change tray by tray and the other expensive to change at all, is already a hint that this design is going to need more care than a simple one.

Here is the design the bakery is going to run, before baking a single cookie.

![Eight oven runs, four at Standard and four at High, with one tray of each recipe baked inside every run.](screenshots/Factorial-Designs-and-the-Split-Plot-Trap-cover-design.png)

*Eight oven runs, four at Standard and four at High, with one tray of each recipe baked inside every run.*

Build that same design in R now, and reproduce this picture yourself.

```r
# Lay out the design: 8 oven runs, 4 at each temperature, two trays per run
library(ggplot2)
trays <- data.frame(
  Run = factor(rep(1:8, each = 2)),
  Temp = factor(rep(rep(c("Standard", "High"), each = 4), each = 2), levels = c("Standard", "High")),
  Recipe = factor(rep(c("Original", "New"), times = 8), levels = c("Original", "New"))
)

ggplot(trays, aes(x = Run, y = Recipe, color = Recipe)) +
  geom_point(size = 5) +
  facet_wrap(~ Temp, scales = "free_x") +
  labs(x = "Oven run", y = "Recipe baked in that run", title = "Eight oven runs, two trays each") +
  theme_minimal()
```

Every tray in this design already carries one level of each factor, before a single cookie has even gone into the oven. That pairing, both factors crossed on the very same trays, is what makes testing them together worth more than testing them apart.

=== step === concept
## Why one factorial experiment beats two separate ones

Before looking at a single measured cookie, it's worth asking why the bakery would bother testing both factors at once instead of running two separate, simpler experiments.

Suppose the bakery settles on 4 replicate trays for every combination it tests. For the factorial design, that means 4 trays times the 2x2 = 4 combinations of temperature and recipe, 16 trays total.

```r
# Count trays a factorial design needs against testing one factor at a time
reps_per_cell <- 4
cells_factorial <- 2 * 2
trays_factorial <- reps_per_cell * cells_factorial

reps_per_level_needed <- reps_per_cell * 2
levels_per_factor <- 2
trays_one_factor_alone <- reps_per_level_needed * levels_per_factor
trays_two_separate_tests <- 2 * trays_one_factor_alone

print(c(factorial = trays_factorial, two_separate_tests = trays_two_separate_tests))
#>          factorial two_separate_tests 
#>                 16                  32 
```

Those same 16 trays still compare 8 High trays against 8 Standard trays for temperature's main effect, because every tray serves both factors at once: each of the 4 Standard-run trays carries Original or New, and so does each of the 4 High-run trays, for 8 trays on each side.

Now suppose the bakery tests the factors one at a time instead. Matching that same 8-versus-8 precision on temperature alone needs 16 trays. Matching it again on recipe alone, holding temperature fixed, needs another 16. Testing them apart costs 32 trays for the exact same precision on each factor that the factorial design got from 16.

That extra efficiency has a name, hidden replication. Every tray in the factorial design works for the temperature comparison and the recipe comparison at the same time, which is why 16 trays buy as much precision on each factor as 32 would buying them one at a time.

There is a second reason the one-factor-at-a-time test can never catch up, no matter how many trays it gets. It never bakes the New recipe at High temperature, so it can never tell whether temperature changes how much the New recipe spreads. That question needs both factors crossed in the same design. It is called an interaction.

=== step === concept
## Reading an interaction from cell means

Here is what the bakery actually measured: every tray's cookie spread, in centimeters, once all 16 trays came out of the oven.

```r
# Measure the spread each of the 16 trays actually produced
set.seed(412)
base_spread <- 6.0
temp_effect <- 0.5
recipe_effect <- 0.6
interaction_effect <- 0.7

spread <- numeric(16)
k <- 0
for (run in 1:8) {
  whole_plot_noise <- rnorm(1, mean = 0, sd = 0.5)    # one draw per oven run
  subplot_noise <- rnorm(2, mean = 0, sd = 0.25)      # one draw per tray in that run
  for (tray in 1:2) {
    k <- k + 1
    te <- if (trays$Temp[k] == "High") temp_effect else 0
    re <- if (trays$Recipe[k] == "New") recipe_effect else 0
    ie <- if (trays$Temp[k] == "High" && trays$Recipe[k] == "New") interaction_effect else 0
    spread[k] <- round(base_spread + te + re + ie + whole_plot_noise + subplot_noise[tray], 2)
  }
}
trays$spread <- spread

cell_means <- aggregate(spread ~ Temp + Recipe, data = trays, FUN = mean)
cell_means$spread <- round(cell_means$spread, 2)
cell_means[order(cell_means$Temp, cell_means$Recipe), ]
#>       Temp   Recipe spread
#> 1 Standard Original   5.73
#> 2 Standard      New   6.25
#> 3     High Original   5.99
#> 4     High      New   7.35
```

Standard/Original trays spread to 5.73 cm on average, and Standard/New trays spread to 6.25 cm. That's a 0.52 cm bump from switching to the New recipe, if the oven stays at Standard temperature.

At High temperature, Original trays spread to 5.99 cm and New trays spread to 7.35 cm, a 1.36 cm bump from that same recipe switch.

The New recipe always adds spread, but it adds far more of it at High temperature than at Standard. That is what statisticians call an interaction: the effect of one factor, recipe, depends on the level of the other factor, temperature. If the two did not interact, New would have added roughly the same bump at both temperatures.

Here are all 16 trays plotted together, and then split one chart per temperature so the two recipe gaps sit side by side.

::widget facet-grid {"data":[{"x":0.012,"y":5.88,"facet":"Standard"},{"x":0.946,"y":6.18,"facet":"Standard"},{"x":0.026,"y":5.6,"facet":"Standard"},{"x":1.069,"y":6.04,"facet":"Standard"},{"x":0.005,"y":5.02,"facet":"Standard"},{"x":1.065,"y":5.8,"facet":"Standard"},{"x":0.024,"y":6.43,"facet":"Standard"},{"x":0.971,"y":6.99,"facet":"Standard"},{"x":-0.02,"y":6.83,"facet":"High"},{"x":0.955,"y":8.14,"facet":"High"},{"x":0.007,"y":5.75,"facet":"High"},{"x":1.001,"y":7.21,"facet":"High"},{"x":-0.043,"y":6.17,"facet":"High"},{"x":1.019,"y":6.89,"facet":"High"},{"x":0.026,"y":5.22,"facet":"High"},{"x":1.02,"y":7.15,"facet":"High"}],"geom":"point","x":"recipe code","y":"spread in cm","facetVar":"Temp"}

In the combined chart, the New recipe's points already sit a little higher than Original's. Split by temperature, the High panel shows a clearly bigger gap between the two recipes than the Standard panel does, the same interaction the cell means already showed in numbers.

=== step === quiz
## Quick check: reading an interaction from cell means

The bakery's four cell means: Standard/Original 5.73 cm, Standard/New 6.25 cm, High/Original 5.99 cm, High/New 7.35 cm. The New recipe added 0.52 cm of spread at Standard but 1.36 cm at High. What does that difference in gaps show?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- New recipe always spreads more regardless of temperature, so the exact size of the gap at each temperature does not matter. ::no
- Recipe's effect on spread depends on temperature: a small bump at Standard and a much bigger one at High. That dependence is what statisticians call an interaction. ::ok Right. If recipe and temperature did not interact, New would have added roughly the same bump at both temperatures. Here it adds 0.52 cm at Standard and 1.36 cm at High, so recipe's own effect changes size depending on which temperature the oven was running at.
- Temperature has no effect on spread, since Original's spread barely moves between temperatures. ::no Temperature does have its own effect, visible in the Original trays alone, 5.73 cm at Standard against 5.99 cm at High. The real story here is an interaction: recipe's own bump in spread is not one fixed number, it depends on which temperature the oven was running at.

=== step === concept
## What makes a factor hard to change, and why that forces a split-plot

Temperature and recipe got onto these 16 trays in very different ways, and that difference has a name.

Temperature is set once per oven run. The bakery ran the oven 8 times total, 4 runs at Standard and 4 at High, and every tray baked in that run shares whatever temperature the oven happened to be at. An oven run is what statisticians call the whole plot, the bigger experimental unit that one level of the hard-to-change factor gets assigned to.

Recipe is set once per tray. Inside a single oven run, one tray gets the Original dough and the other gets the New dough. A tray is the subplot, the smaller unit nested inside the whole plot, where the easy-to-change factor gets assigned.

Here are all 16 trays, grouped by the oven run that produced them.

```r
# Look at the 16 trays grouped by the oven run that produced them
trays[order(trays$Run), ]
#>    Run     Temp   Recipe spread
#> 1    1 Standard Original   5.88
#> 2    1 Standard      New   6.18
#> 3    2 Standard Original   5.60
#> 4    2 Standard      New   6.04
#> 5    3 Standard Original   5.02
#> 6    3 Standard      New   5.80
#> 7    4 Standard Original   6.43
#> 8    4 Standard      New   6.99
#> 9    5     High Original   6.83
#> 10   5     High      New   8.14
#> 11   6     High Original   5.75
#> 12   6     High      New   7.21
#> 13   7     High Original   6.17
#> 14   7     High      New   6.89
#> 15   8     High Original   5.22
#> 16   8     High      New   7.15
```

Every pair of rows sharing a Run number also shares a Temp value. That's whole-plot structure sitting right in the data: temperature only ever changes between runs, never within one.

This split matters because it creates two separate sources of random noise. Run-to-run noise, called whole-plot error, comes from everything that varies from one oven run to the next: a slightly different oven calibration, a slightly different ambient humidity, the exact way the oven behaved during its 20 minutes of restabilizing. Tray-to-tray noise within the same run, called subplot error, comes from smaller things, like exact dough placement or a slightly uneven spot on the same rack.

In this bakery's data, whole-plot error has a standard deviation of 0.5 cm and subplot error has a standard deviation of 0.25 cm, half as much. That's typical. A whole oven run picks up more ways to go wrong than two trays baked side by side in the same run ever will.

So this design produces two different error terms, and a correct analysis has to test each factor against the right one. That is the split-plot structure.

=== step === concept
## The trap: the same data, two analyses, two different answers for temperature

Fit the obvious analysis first, the one that ignores all of that whole-plot and subplot structure and throws temperature, recipe and their interaction into one plain factorial ANOVA. Then fit the correct one, which tells `aov()` to split the error into the whole-plot term with `Error(Run)` and the subplot term left over.

```r
# Fit the same 16 trays two ways: a plain factorial, then the correct split-plot
naive_fit <- aov(spread ~ Temp * Recipe, data = trays)
summary(naive_fit)
#>             Df Sum Sq Mean Sq F value  Pr(>F)   
#> Temp         1  1.836   1.836   5.352 0.03922 * 
#> Recipe       1  3.516   3.516  10.249 0.00761 **
#> Temp:Recipe  1  0.697   0.697   2.033 0.17945   
#> Residuals   12  4.116   0.343                   
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1

correct_fit <- aov(spread ~ Temp * Recipe + Error(Run), data = trays)
summary(correct_fit)
#> 
#> Error: Run
#>           Df Sum Sq Mean Sq F value Pr(>F)
#> Temp       1  1.836  1.8360   2.993  0.134
#> Residuals  6  3.681  0.6135               
#> 
#> Error: Within
#>             Df Sum Sq Mean Sq F value   Pr(>F)    
#> Recipe       1  3.516   3.516  48.441 0.000437 ***
#> Temp:Recipe  1  0.697   0.697   9.607 0.021130 *  
#> Residuals    6  0.435   0.073                     
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
```

Read the naive analysis first. Temp comes back with F = 5.35 and p = 0.039, comfortably under the usual 0.05 cutoff. By this analysis, temperature's effect on spread looks statistically significant.

Now look inside the `Error: Run` block of the correct analysis. Temp gets F = 2.99 and p = 0.134. The exact same data, analysed correctly, says temperature is not significant.

What changed is only the denominator. The naive analysis divides temperature's effect by one pooled error term built from all 12 leftover degrees of freedom, mean square 0.343. The correct analysis divides it by the whole-plot error alone, mean square 0.6135 on 6 degrees of freedom, nearly twice as large. Temperature was only ever tested on 8 oven runs, 4 per level, not on 16 trays, and the correct error term reflects that smaller effective sample size.

The mistake runs the other way for recipe and its interaction with temperature. Both belong to the subplot error, mean square 0.073 on 6 degrees of freedom, far smaller than the naive analysis's pooled 0.343. The naive analysis gives the interaction F = 2.03, p = 0.179, not significant, while the correct analysis gives it F = 9.61, p = 0.021, significant. One pooled error term was too small for temperature and too big for the interaction, both at the same time.

That is one dataset. To check it isn't just an unlucky draw, simulate the same 16-tray design 1000 times with temperature, recipe and the interaction all set to exactly zero, so any analysis that rejects the null hypothesis here is simply wrong.

```r
# Simulate the same design 1000 times under a true null, and compare the two analyses
set.seed(2026)
n_reps <- 1000
naive_reject <- logical(n_reps)
correct_reject <- logical(n_reps)

for (trial in 1:n_reps) {
  sim_spread <- numeric(16)
  k2 <- 0
  for (run in 1:8) {
    whole_plot_noise <- rnorm(1, mean = 0, sd = 0.5)
    subplot_noise <- rnorm(2, mean = 0, sd = 0.25)
    for (tray in 1:2) {
      k2 <- k2 + 1
      sim_spread[k2] <- base_spread + whole_plot_noise + subplot_noise[tray]   # no true effect at all
    }
  }
  sim_trays <- trays
  sim_trays$spread <- sim_spread

  naive_p <- summary(aov(spread ~ Temp * Recipe, data = sim_trays))[[1]][["Pr(>F)"]][1]
  correct_p <- summary(aov(spread ~ Temp * Recipe + Error(Run), data = sim_trays))[["Error: Run"]][[1]][["Pr(>F)"]][1]

  naive_reject[trial] <- naive_p < 0.05
  correct_reject[trial] <- correct_p < 0.05
}

round(100 * c(naive = mean(naive_reject), correct = mean(correct_reject)), 1)
#>   naive correct 
#>    13.4     5.5 
```

Out of 1000 simulated experiments where nothing was really going on, the naive analysis called temperature significant 13.4% of the time. It should have done that about 5% of the time, the usual false-positive rate for a 0.05 cutoff. The correct split-plot analysis called it significant only 5.5% of the time, right where it should be.

A naive factorial ANOVA on a split-plot design does not just get one p-value wrong by chance. It is wrong in a predictable direction, every time, because it tests the hard-to-change factor against the wrong error term.

=== step === widget
## The intraclass correlation sets how much the two error terms disagree

The size of the gap between the naive and the correct analysis is not random. It is set by one number: how much of the total noise sits between oven runs rather than between trays within the same run. Statisticians call that the intraclass correlation.

For this bakery, whole-plot variance is 0.5 squared, 0.25, and subplot variance is 0.25 squared, 0.0625. The intraclass correlation is the whole-plot share of the total: 0.25 divided by (0.25 + 0.0625), which is 0.8. Eighty percent of the total noise in a tray's spread comes from which oven run it was baked in, not from the tray itself.

The widget below runs the same comparison this lesson has been building, but lets you drag that intraclass correlation up from 0 and watch four different standard errors for the same effect pull apart. Its "cluster" is this lesson's oven run and its "observation" is a tray, the same whole-plot and subplot pairing the bakery's design already uses.

::widget cluster-icc-sim {"k": 8, "m": 2, "tau": 0.9, "iccMax": 0.8, "levels": 11, "start": 0, "sims": 3000, "seed": 412}

At an intraclass correlation of 0 there is nothing to correct for, so every standard error agrees. Drag the dial up toward 0.8, this bakery's own value, and the ordinary and robust standard errors stay flat and wrong while the cluster-aware ones climb to match the truth. The further the dial moves, the more a naive analysis understates how uncertain the hard-to-change factor's effect really is.

=== step === quiz
## Quiz: which error term is right

Suppose a different bakery runs the exact same oven-run and tray design, 8 runs of 2 trays each, and gets a naive p-value for temperature that looks promising. Which analysis actually gives temperature's effect the right standard error?

::quiz {"correct": 2, "gate": true, "difficulty": "advanced"}
- A plain aov(spread ~ Temp * Recipe, data = trays), since it fits every row of the data and nothing is left out. ::no
- aov(spread ~ Temp * Recipe + Error(Run), data = trays), so temperature's effect is tested against the whole-plot error instead of one error term pooled across every row. ::ok Right. Temperature only ever changed between oven runs, so its effect has to be judged against how much oven runs vary from each other, not against how much individual trays vary within the same run.
- It does not matter which call you use, since both give the same p-value for temperature here. ::no They do not agree, and they are not supposed to. This lesson's own 16 trays gave the pooled analysis p = 0.039 for temperature and the split-plot analysis p = 0.134, because the pooled analysis tests temperature against an error term built mostly out of tray-to-tray noise instead of the bigger run-to-run noise it actually varied with.

=== step === tryit
## Your turn: write the split-plot formula

The 16-row `trays` data frame, spread column and all, is still sitting in memory. Fill in the blank so this call analyses it as the split-plot design it actually is, rather than as a plain factorial.

```r
# Analyse the 16 trays with the correct split-plot structure
summary(aov(spread ~ Temp * Recipe + ____, data = trays))
```

Press Check when you have it.

::check {"regex": "Error\\s*[(]\\s*Run\\s*[)]", "gate": true, "difficulty": "intermediate", "ok": "Right. Error(Run) tells aov() that Run is the whole-plot unit, so Temp gets tested against run-to-run variation while Recipe and the interaction get tested against the smaller tray-to-tray variation within a run.", "no": "Add Error(Run) after Temp * Recipe. Run is the whole-plot unit temperature was actually assigned to, so it needs its own error term separate from the trays."}
::solution
```r
# Analyse the 16 trays with the correct split-plot structure
summary(aov(spread ~ Temp * Recipe + Error(Run), data = trays))
#> 
#> Error: Run
#>           Df Sum Sq Mean Sq F value Pr(>F)
#> Temp       1  1.836  1.8360   2.993  0.134
#> Residuals  6  3.681  0.6135               
#> 
#> Error: Within
#>             Df Sum Sq Mean Sq F value   Pr(>F)    
#> Recipe       1  3.516   3.516  48.441 0.000437 ***
#> Temp:Recipe  1  0.697   0.697   9.607 0.021130 *  
#> Residuals    6  0.435   0.073                     
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
```

=== step === concept
## References

- [Split-Plot Designs: What, Why, and How](https://www.jmp.com/content/dam/jmp/documents/en/white-papers/split-plot-designs-what-why-and-how.pdf) - Jones, B. and Nachtsheim, C.J. (2009), Journal of Quality Technology 41(4). The practical warning against analysing a split-plot as a full factorial.
- [Design and Analysis of Experiments, 10th edition](https://www.wiley.com/en-us/Design+and+Analysis+of+Experiments%2C+10th+Edition-p-9781119722106) - Montgomery, D.C. (2019), Wiley. The standard text covering both factorial and split-plot designs.
- [Statistics for Experimenters: Design, Innovation, and Discovery, 2nd edition](https://www.wiley-vch.de/de/fachgebiete/mathematik-und-statistik/statistics-for-experimenters-978-0-471-71813-0) - Box, G.E.P., Hunter, W.G. and Hunter, J.S. (2005), Wiley. The hidden-replication argument for factorial design.
- [The Design and Analysis of Factorial Experiments](https://repository.rothamsted.ac.uk/id/eprint/31748) - Yates, F. (1937), Imperial Bureau of Soil Science, Technical Communication No. 35. The original agricultural split-plot structure.
- [aov: Fit an Analysis of Variance Model](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/aov.html) - R Core Team, the documentation for aov() and the Error() term used throughout this lesson.

=== step === complete
## What a split-plot buys you, and what it costs

Two results carry this whole lesson, and they are worth holding onto past this one bakery.

One factorial experiment answers two questions, and sees how they interact, for close to the price of testing one question twice. Sixteen trays here did the work that would have taken 32 trays run one factor at a time, and the one-at-a-time version could never have shown that the New recipe's extra spread depends on temperature at all.

A split-plot design, which shows up any time one factor is harder to change than another, hands over two different error terms whether you ask for them or not. Analyse it as a plain factorial and you borrow the wrong error term for at least one factor, usually the hard-to-change one, and that factor's p-value cannot be trusted no matter how carefully the rest of the analysis was done.

Next time an ANOVA table crosses your desk, it's worth asking one question before trusting any of its p-values: was every factor actually easy to change on every single row, or did one of them come from a bigger, harder-to-change unit?

Next: turning this same approach, simulating a study many times and counting what happens, toward a different question: how many runs a study actually needs before you ever collect a single row.
