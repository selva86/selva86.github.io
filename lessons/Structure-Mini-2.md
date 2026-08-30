---
title: "Exploratory factor analysis, step by step"
slug: "Structure-Mini-2"
description: "Twenty survey questions, and some always move together. Fit a factor analysis in R: choose how many factors, rotate them, and name what each column measures."
keywords: "exploratory factor analysis in R, factanal in R, how many factors to keep, scree plot, varimax rotation, factor loadings, communality and uniqueness, survey factor analysis"
mathjax: true
webr: true
date: "2026-08-30"
post_type: "LESSON"
course_id: "hidden-structure"
course_title: "Hidden Structure"
course_lesson: "2"
course_total: "4"
course_landing: "/dashboard.html"
course_prev: "Structure-Mini-1"
course_next: ""
curriculum_id: "0.0.54"
lesson_access: "windowed"
catalog_blurb: "How to find the hidden traits behind a survey and name each one."
---

=== step === cover
::eyebrow Hidden Structure
## Exploratory factor analysis, step by step

Let's say two hundred customers have just filled in your survey. Each of them answered twenty questions, on a scale where 1 means strongly disagree and 7 means strongly agree.

The first thing anyone does with a survey like that is correlate every question with every other one. Here are eight of the twenty, laid out as a grid.

::widget correlation-heatmap {"vars": ["happy_overall", "would_renew", "frustrating", "price_matters", "switch_cheaper", "checks_rivals", "uses_app", "reads_blog"], "matrix": [[1, 0.64, -0.63, 0.06, 0.02, 0.01, 0.05, -0.08], [0.64, 1, -0.56, -0.03, -0.06, -0.09, 0.02, -0.03], [-0.63, -0.56, 1, 0.06, 0, 0.03, 0.01, 0], [0.06, -0.03, 0.06, 1, 0.6, 0.59, -0.04, 0.04], [0.02, -0.06, 0, 0.6, 1, 0.59, -0.08, -0.04], [0.01, -0.09, 0.03, 0.59, 0.59, 1, -0.04, 0.03], [0.05, 0.02, 0.01, -0.04, -0.08, -0.04, 1, 0.03], [-0.08, -0.03, 0, 0.04, -0.04, 0.03, 0.03, 1]]}

Look at what the grid has done on its own. `happy_overall` and `would_renew` sit at 0.64. `price_matters` and `switch_cheaper` sit at 0.60. But take a question out of the first bunch and a question out of the second, and the number collapses: 0.06, then 0.02, then 0.01. The answers arrived pre-sorted into clumps, and nothing in the questionnaire put them there.

So something the survey never asked about is doing this. Nobody wrote a question called "how satisfied are you, really", and yet three of these questions behave as though they are all measuring exactly that, and three others behave as though they are measuring something else entirely.

Exploratory factor analysis is the method for chasing that down. The grid is the only thing it ever gets to see, and from that alone it asks what small set of unmeasured quantities would have to exist for these particular numbers to come out.

So we are going to do that whole job on this survey ourselves. We will settle the count when two respected rules disagree, see what `factanal()` hands back and how much of it to trust, watch what rotation does and does not change, and get from a column of numbers to a name you could defend to whoever asks.

Let's build the survey and get started.

=== step === concept
## The survey, and the answers that move together

Here is the survey itself. Nine of the twenty questions ask about satisfaction, seven ask about price, and four ask about habits like opening emails or reading the blog.

Two of the satisfaction questions are worded backwards on purpose, which is normal practice in survey design: `frustrating` and `thinking_quit` are phrased so that a happy customer disagrees with them. That will matter shortly.

The code below builds all twenty questions for two hundred customers. Press Run.

```r
# Build the 200 by 20 survey: two hidden drivers, and four questions with drivers of their own
set.seed(42)
n <- 200

satisfaction <- rnorm(n)
price_focus  <- rnorm(n)

ask <- function(driver, loading) {
  answer <- loading * driver + sqrt(1 - loading^2) * rnorm(n)
  round(pmin(pmax(4 + 1.5 * answer, 1), 7))
}

survey <- data.frame(
  happy_overall    = ask(satisfaction,  0.83),
  would_renew      = ask(satisfaction,  0.82),
  recommend        = ask(satisfaction,  0.81),
  easy_to_use      = ask(satisfaction,  0.79),
  good_support     = ask(satisfaction,  0.78),
  meets_needs      = ask(satisfaction,  0.80),
  worth_the_time   = ask(satisfaction,  0.77),
  frustrating      = ask(satisfaction, -0.79),
  thinking_quit    = ask(satisfaction, -0.80),
  price_matters    = ask(price_focus,   0.82),
  switch_cheaper   = ask(price_focus,   0.81),
  checks_rivals    = ask(price_focus,   0.80),
  compares_deals   = ask(price_focus,   0.79),
  waits_for_sale   = ask(price_focus,   0.78),
  budget_first     = ask(price_focus,   0.80),
  price_over_brand = ask(price_focus,   0.77),
  uses_app         = ask(rnorm(n), 0.8),
  reads_blog       = ask(rnorm(n), 0.8),
  opens_emails     = ask(rnorm(n), 0.8),
  attends_webinar  = ask(rnorm(n), 0.8)
)

dim(survey)
#> [1] 200  20
survey[1:4, 1:5]
#>   happy_overall would_renew recommend easy_to_use good_support
#> 1             7           5         6           7            5
#> 2             3           4         4           4            3
#> 3             4           5         5           5            5
#> 4             5           5         5           5            5
```

That gives two hundred rows of whole numbers between 1 and 7, which is what a real survey hands you.

Now, factor analysis never looks at those rows. It looks at one thing only, the correlation matrix: every question against every other question, and nothing else. So before we fit anything, let's read that matrix ourselves on eight of the twenty questions.

```r
# Look at how eight of the twenty questions correlate with each other
eight <- c("happy_overall", "would_renew", "frustrating",
           "price_matters", "switch_cheaper", "checks_rivals",
           "uses_app", "reads_blog")

round(cor(survey[, eight]), 2)
#>                happy_overall would_renew frustrating price_matters
#> happy_overall           1.00        0.64       -0.63          0.06
#> would_renew             0.64        1.00       -0.56         -0.03
#> frustrating            -0.63       -0.56        1.00          0.06
#> price_matters           0.06       -0.03        0.06          1.00
#> switch_cheaper          0.02       -0.06        0.00          0.60
#> checks_rivals           0.01       -0.09        0.03          0.59
#> uses_app                0.05        0.02        0.01         -0.04
#> reads_blog             -0.08       -0.03        0.00          0.04
#>                switch_cheaper checks_rivals uses_app reads_blog
#> happy_overall            0.02          0.01     0.05      -0.08
#> would_renew             -0.06         -0.09     0.02      -0.03
#> frustrating              0.00          0.03     0.01       0.00
#> price_matters            0.60          0.59    -0.04       0.04
#> switch_cheaper           1.00          0.59    -0.08      -0.04
#> checks_rivals            0.59          1.00    -0.04       0.03
#> uses_app                -0.08         -0.04     1.00       0.03
#> reads_blog              -0.04          0.03     0.03       1.00
```

Three things here are worth saying out loud.

1. There are two dense square patches. `happy_overall`, `would_renew` and `frustrating` all sit around 0.6 with each other, and so do `price_matters`, `switch_cheaper` and `checks_rivals`.
2. Between the two patches the numbers are near zero: 0.06, then 0.02, then 0.01, then minus 0.09. Knowing how price-conscious somebody is tells you nothing about how satisfied they are.
3. `frustrating` carries a minus sign against the other satisfaction questions, minus 0.63 and minus 0.56. That is the backwards wording showing up exactly where it should, because agreeing that the product is frustrating goes with not renewing.

And `uses_app` and `reads_blog` correlate with nothing at all, except themselves. Hold on to that, because those two turn out to be a finding rather than a nuisance.

=== step === concept
## What a factor model says is behind one answer

Now let's write down what we actually believe about this survey, because everything from here on is a consequence of one small equation.

The claim is that behind the nine satisfaction questions there is one number per customer that nobody ever measured. Call it that customer's satisfaction. Each question is one noisy reading of it. Written out for question \(j\):

\[ x_j = \lambda_j F + u_j \]

There are three symbols there, and each one has a plain meaning.

- \(F\) is the **factor**: the unmeasured thing, one value per customer. Here that is satisfaction.
- \(\lambda_j\) is the **loading** of question \(j\) on that factor. It says how strongly the factor pulls that particular question around. A loading is a correlation between the question and the factor, so it runs from minus 1 to 1.
- \(u_j\) is everything about question \(j\) that the factor does not account for: its own wording, its own quirks, plain measurement noise. It is called the **unique** part, and it shares nothing with any other question.

Since the method works from correlations, every question comes in on the same standard scale, which puts the variance of \(x_j\) at 1. That 1 splits into exactly two pieces:

\[ 1 = \lambda_j^2 + \text{Var}(u_j) \]

The first piece, \(\lambda_j^2\), is the **communality**: the share of that question the factor explains. The second piece is the **uniqueness**: the share it does not. Two names, one split, and they always add up to 1.

The code you just ran is that equation. Look again at the line inside `ask()`, which reads `loading * driver + sqrt(1 - loading^2) * rnorm(n)`. The first term is \(\lambda_j F\) and the second is \(u_j\), with its size set so the two pieces sum to 1. Take `happy_overall`, built with a loading of 0.83.

```r
# Take one question apart: what the factor explains, and what is left over
loading <- 0.83

c(loading     = loading,
  communality = loading^2,
  uniqueness  = 1 - loading^2)
#>     loading communality  uniqueness 
#>      0.8300      0.6889      0.3111 
```

So satisfaction accounts for 68.9% of the movement in `happy_overall`, and the remaining 31.1% belongs to that question alone.

Here is the consequence that makes the whole method work. If the only thing two questions have in common is the factor, then the only route by which they can correlate is through it. Their unique parts are unique to them, so those cannot do it. That gives you a prediction you can check with one multiplication:

\[ \text{cor}(x_j, x_k) = \lambda_j \lambda_k \]

`happy_overall` was built with a loading of 0.83 and `would_renew` with 0.82, so the model predicts a correlation of 0.83 times 0.82.

```r
# What the model predicts for two questions that share one factor, against the data
0.83 * 0.82
#> [1] 0.6806
cor(survey$happy_overall, survey$would_renew)
#> [1] 0.6367983
```

So the model predicts 0.68 and the data shows 0.64. The gap is small, and it has two ordinary sources. Real survey answers are whole numbers from 1 to 7 rather than the smooth quantities the equation assumes, and squeezing a smooth quantity onto seven steps costs you a little of the correlation. On top of that, two hundred customers is a sample, so the observed number would wobble either way with a different two hundred.

[KEY INSIGHT]
Loading, communality and uniqueness are three views of one split. The loading says how hard the factor pulls a question, its square says what share of that question the factor owns, and one minus that square says what share nobody else can reach. Every number you read for the rest of this survey is one of those three.

Working forwards was easy, because we knew the loadings. Real data hands you the correlations and hides everything else, so the job is to run the arrow backwards: from a matrix of correlations to the loadings that would produce it.

=== step === concept
## How many factors does the data support?

Before you can fit anything, you have to answer a question the data will not answer cleanly. How many factors are in there?

The standard first look uses the **eigenvalues** of the correlation matrix. An eigenvalue is the amount of variance one candidate factor would carry, measured in units of single questions. An eigenvalue of 5.8 means that factor accounts for as much of the movement across the survey as 5.8 questions' worth. Since each question contributes exactly 1 to the total, the twenty eigenvalues always add up to 20.

```r
# How much shared variance each possible factor would carry
ev <- eigen(cor(survey))$values
round(ev, 2)
#>  [1] 5.80 4.40 1.18 1.11 0.98 0.97 0.59 0.54 0.52 0.48 0.47 0.41 0.40 0.38 0.35
#> [16] 0.33 0.31 0.28 0.27 0.22
```

Read the first six: 5.80, 4.40, 1.18, 1.11, 0.98, 0.97.

The oldest rule for reading them is **Kaiser's rule**, still the default in a lot of software: keep every factor with an eigenvalue above 1. The reasoning sounds fair, because a factor carrying less than one question's worth of variance is doing less work than a single question would. Apply it here and it keeps four factors, since 5.80, 4.40, 1.18 and 1.11 all clear the bar.

But look at the actual sizes. The first two are 5.80 and 4.40. The third is 1.18. That is not a smaller factor of the same kind, it is a different order of thing entirely, and 1.18 sits shoulder to shoulder with 1.11, 0.98 and 0.97, which nobody would call factors. The gap is the signal, and a plot makes it obvious.

```r
# Draw the scree plot: the first ten eigenvalues in order
plot(ev[1:10], type = "b", pch = 19, col = "#1f7a55",
     xlab = "Factor number", ylab = "Eigenvalue",
     main = "Scree plot of the survey correlation matrix")
abline(h = 1, lty = 2, col = "grey50")
```

That picture is called a **scree plot**, after the loose rubble that piles up at the foot of a cliff. You read it by finding the elbow, the point where the steep drop ends and the flat rubble begins. Here the line falls from 5.80 to 4.40 to 1.18 and then goes essentially flat. The cliff is two points wide, and everything from the third point on is scree.

So two respected rules look at the same six numbers and disagree. Kaiser says four, the scree plot says two. That disagreement is not a flaw in the data, it is the normal state of affairs: eigenvalues narrow the count down, they do not settle it. Kaiser's rule in particular is known to over-extract, because sampling noise alone pushes a few eigenvalues just past 1 in almost any real survey.

What settles it is fitting the candidates and reading what comes out.

=== step === quiz
## Quick check: what do these eigenvalues settle?

The twenty eigenvalues of the survey correlation matrix start like this: 5.80, 4.40, 1.18, 1.11, 0.98, 0.97. On this evidence alone, what is the soundest reading?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- Keep four factors, because four eigenvalues come out above 1. ::no
- Keep six factors, because six eigenvalues come out above 0.9, and 0.9 is close enough to 1. ::no
- Keep two factors, because the values fall off a cliff after the second and then sit flat. ::ok That is the reading to trust. 5.80 and 4.40 are a different order of size from everything after them, and 1.18, 1.11, 0.98 and 0.97 are one flat run of numbers with no meaningful break in it.
- Keep one factor, because the first eigenvalue is far and away the largest. ::no The trap in three of these is treating a cutoff as an answer. A bar at 1 keeps four here, a bar at 0.9 would keep six, and taking the single biggest keeps one, so the count you get depends on which line you happened to draw. What the numbers actually show is a cliff: 5.80 and 4.40, then a flat run of 1.18, 1.11, 0.98 and 0.97 with no real break in it. Two is the count that survives, and fitting the model is what confirms it.

=== step === concept
## Fitting the model with factanal()

Base R fits a factor model with `factanal()`. You hand it the data and the number of factors, and it finds the loadings that best reproduce the observed correlation matrix.

We ask for two, and for now we switch rotation off with `rotation = "none"` so we can see the raw fit before anything is tidied up.

```r
# Fit two factors without rotating, and print everything the fit knows
fit_raw <- factanal(survey, factors = 2, rotation = "none")
fit_raw
#> 
#> Call:
#> factanal(x = survey, factors = 2, rotation = "none")
#> 
#> Uniquenesses:
#>    happy_overall      would_renew        recommend      easy_to_use 
#>            0.393            0.342            0.400            0.436 
#>     good_support      meets_needs   worth_the_time      frustrating 
#>            0.381            0.344            0.448            0.450 
#>    thinking_quit    price_matters   switch_cheaper    checks_rivals 
#>            0.458            0.420            0.352            0.424 
#>   compares_deals   waits_for_sale     budget_first price_over_brand 
#>            0.372            0.476            0.415            0.534 
#>         uses_app       reads_blog     opens_emails  attends_webinar 
#>            0.995            0.999            0.997            0.993 
#> 
#> Loadings:
#>                  Factor1 Factor2
#> happy_overall     0.764   0.156 
#> would_renew       0.808         
#> recommend         0.772         
#> easy_to_use       0.747         
#> good_support      0.779   0.110 
#> meets_needs       0.808         
#> worth_the_time    0.729   0.145 
#> frustrating      -0.736         
#> thinking_quit    -0.732         
#> price_matters    -0.145   0.748 
#> switch_cheaper   -0.138   0.793 
#> checks_rivals    -0.156   0.742 
#> compares_deals   -0.101   0.786 
#> waits_for_sale   -0.130   0.712 
#> budget_first              0.762 
#> price_over_brand -0.182   0.658 
#> uses_app                        
#> reads_blog                      
#> opens_emails                    
#> attends_webinar                 
#> 
#>                Factor1 Factor2
#> SS loadings      5.391   3.980
#> Proportion Var   0.270   0.199
#> Cumulative Var   0.270   0.469
#> 
#> Test of the hypothesis that 2 factors are sufficient.
#> The chi square statistic is 162.12 on 151 degrees of freedom.
#> The p-value is 0.254 
```

Four separate things came back, so let's take them one at a time.

**Uniquenesses.** These are one number per question, the share the two factors could not account for. The sixteen survey questions land between 0.342 and 0.534, so the factors are explaining roughly half to two thirds of each. The last four are 0.995, 0.999, 0.997 and 0.993, which says the factors explain essentially nothing about them.

**Loadings.** There are twenty rows, one per question, and two columns, one per factor. `factanal()` blanks any loading whose absolute value is below 0.1 to keep the display readable, which is why so many cells look empty.

**SS loadings.** Square every loading in a column and add them up. Factor 1 gives 5.391 and factor 2 gives 3.980, so the two factors between them account for 9.371 questions' worth of variance out of 20. That is the 0.469 on the `Cumulative Var` line, or 46.9% of everything the survey measured.

**The test.** `factanal()` also runs a chi-square test of the hypothesis that two factors are enough to reproduce the correlation matrix. The p-value is 0.254, comfortably above 0.05, so there is no evidence that two factors are too few. The test would push back if we had asked for too few, and it is not pushing back.

That last claim deserves a check rather than a nod. The model says two questions correlate only through what they share, and now we have fitted loadings to put into that multiplication. So multiply the two rows together and compare it with reality.

```r
# Rebuild one observed correlation from the fitted loadings
L_raw <- fit_raw$loadings
sum(L_raw["happy_overall", ] * L_raw["would_renew", ])
#> [1] 0.6280532
cor(survey$happy_overall, survey$would_renew)
#> [1] 0.6367983
```

That is 0.628 from the model against 0.637 in the data, so those two agree to within a hundredth. The chi-square test above is that same comparison made across all 190 pairs at once. It adds up the gaps between the correlations the data shows and the ones the model implies, and asks whether the total is bigger than chance alone would produce. At p = 0.254 it is not.

=== step === concept
## What rotation changes, and what it leaves alone

Look back at the loadings we just got and one thing is annoying. Nearly every price question carries a small negative loading on factor 1: minus 0.145, minus 0.138, minus 0.156. Those are not real. We know they are not real, because the correlations between the satisfaction block and the price block were 0.06 and 0.02 and 0.01.

They are there because of a genuine looseness in the method. The factor solution is not unique. You can spin the pair of axes to any angle you like and the fitted correlations come out exactly the same, so `factanal()` has to pick some angle, and left alone it picks the one that loads as much as possible onto factor 1 first. That angle happens to smear a little of the price block onto the satisfaction axis.

**Rotation** is choosing a better angle. Varimax, the default, hunts for the angle that makes each column as lopsided as possible: loadings pushed toward large or toward zero, and as few middling values as it can manage. It is the same fit seen from a different direction. Let's ask for it and put the two side by side.

```r
# Put the unrotated and the rotated loadings side by side for six questions
fit <- factanal(survey, factors = 2)

side_by_side <- round(cbind(unclass(fit_raw$loadings), unclass(fit$loadings)), 3)
colnames(side_by_side) <- c("none_F1", "none_F2", "varimax_F1", "varimax_F2")

side_by_side[c("happy_overall", "worth_the_time", "frustrating",
               "price_matters", "compares_deals", "price_over_brand"), ]
#>                  none_F1 none_F2 varimax_F1 varimax_F2
#> happy_overall      0.764   0.156      0.778      0.040
#> worth_the_time     0.729   0.145      0.742      0.034
#> frustrating       -0.736  -0.092     -0.741      0.019
#> price_matters     -0.145   0.748     -0.031      0.761
#> compares_deals    -0.101   0.786      0.018      0.792
#> price_over_brand  -0.182   0.658     -0.081      0.678
```

Every one of those twelve numbers moved. `happy_overall` went from 0.156 down to 0.040 on factor 2, and `price_matters` went from minus 0.145 up to minus 0.031 on factor 1. The small cross-loadings collapsed toward zero and the big loadings grew slightly. Each question now leans on one factor and shrugs at the other, which is the whole point.

Now the part people get wrong. Moving all twelve numbers sounds like a different model. It is not. Rotation changes how the shared variance is divided between the columns, and changes nothing else at all.

```r
# Check what rotation left alone: the uniquenesses and the total squared loadings
all.equal(fit_raw$uniquenesses, fit$uniquenesses)
#> [1] TRUE
c(unrotated = sum(unclass(fit_raw$loadings)^2),
  rotated   = sum(unclass(fit$loadings)^2))
#> unrotated   rotated 
#>  9.371075  9.371075 
```

The uniquenesses are identical to the last decimal place, and the total explained variance is the same 9.371. The two solutions reproduce the correlation matrix equally well, because they are the same solution at two angles.

You can see the spin directly by plotting the twenty questions with their factor 1 loading across and their factor 2 loading up.

```r
# Plot the twenty questions in loading space, before and after rotation
par(mfrow = c(1, 2))
plot(unclass(fit_raw$loadings), pch = 19, col = "#2563a8",
     xlim = c(-1, 1), ylim = c(-1, 1), main = "Before rotation",
     xlab = "Factor 1", ylab = "Factor 2")
abline(h = 0, v = 0, col = "grey70")
plot(unclass(fit$loadings), pch = 19, col = "#1f7a55",
     xlim = c(-1, 1), ylim = c(-1, 1), main = "After varimax rotation",
     xlab = "Factor 1", ylab = "Factor 2")
abline(h = 0, v = 0, col = "grey70")
par(mfrow = c(1, 1))
```

It is the same cloud of points in both panels, the same distances between them, sitting at a slightly different angle. On the right the clusters hug the axes instead of hanging off them. Nothing about the cloud changed, the axes moved under it.

[NOTE]
Varimax keeps the two axes at right angles, which forces the two factors to be uncorrelated. That is a real assumption, and it suits this survey, where satisfaction and price sensitivity genuinely have nothing to do with each other. When you expect your factors to be related, ask for `rotation = "promax"` instead and let the axes tilt.

=== step === concept
## How to read a loadings matrix

Twenty rows of small numbers is not something anyone reads well. So before you read it, do two things to the display: hide everything below a threshold, and group the questions by the factor they belong to. `print()` on a loadings object takes both as arguments.

The threshold is a convention rather than a law. 0.3 is the usual choice, on the grounds that a loading under 0.3 means the factor explains under 9% of that question, which is too little to build an interpretation on.

```r
# Read the rotated loadings: hide anything under 0.3 and group the questions
print(fit$loadings, cutoff = 0.3, sort = TRUE)
#> 
#> Loadings:
#>                  Factor1 Factor2
#> happy_overall     0.778         
#> would_renew       0.810         
#> recommend         0.773         
#> easy_to_use       0.750         
#> good_support      0.787         
#> meets_needs       0.807         
#> worth_the_time    0.742         
#> frustrating      -0.741         
#> thinking_quit    -0.736         
#> price_matters             0.761 
#> switch_cheaper            0.805 
#> checks_rivals             0.757 
#> compares_deals            0.792 
#> waits_for_sale            0.724 
#> budget_first              0.763 
#> price_over_brand          0.678 
#> uses_app                        
#> reads_blog                      
#> opens_emails                    
#> attends_webinar                 
#> 
#>                Factor1 Factor2
#> SS loadings      5.350   4.021
#> Proportion Var   0.267   0.201
#> Cumulative Var   0.267   0.469
```

Now it reads like a table of contents.

Factor 1 holds exactly the nine satisfaction questions, seven of them between 0.742 and 0.810, with `frustrating` and `thinking_quit` at minus 0.741 and minus 0.736. Factor 2 holds exactly the seven price questions, between 0.678 and 0.805. Not one question loads on both. The last four load on neither, and their rows are blank.

That is a clean solution, and clean means something specific here: every question has one home, and the two homes are the two blocks that were already visible in the correlation matrix.

So what would have happened if we had followed Kaiser's rule and asked for four? Let's ask for one more and see what a third factor can find.

```r
# Ask for a third factor and see what it finds
fit3 <- factanal(survey, factors = 3)
print(fit3$loadings, cutoff = 0.3, sort = TRUE)
#> 
#> Loadings:
#>                  Factor1 Factor2 Factor3
#> happy_overall     0.777                 
#> would_renew       0.812                 
#> recommend         0.773                 
#> easy_to_use       0.753                 
#> good_support      0.786                 
#> meets_needs       0.807                 
#> worth_the_time    0.744                 
#> frustrating      -0.740                 
#> thinking_quit    -0.735                 
#> price_matters             0.747         
#> switch_cheaper            0.795         
#> checks_rivals             0.757         
#> compares_deals            0.785         
#> waits_for_sale            0.763         
#> budget_first              0.751         
#> price_over_brand          0.690         
#> uses_app                                
#> reads_blog                              
#> opens_emails                            
#> attends_webinar                   0.424 
#> 
#>                Factor1 Factor2 Factor3
#> SS loadings      5.355   4.028   0.494
#> Proportion Var   0.268   0.201   0.025
#> Cumulative Var   0.268   0.469   0.494
```

The first two columns barely moved. The third column has one entry in it, `attends_webinar` at 0.424, and nothing else clears 0.3. It carries 0.494 of variance, which is 2.5% of the survey, less than half of what a single question contributes.

A factor with one question on it is not a factor. It is that question, wearing a hat. A factor needs at least three questions loading on it before it means anything, because with fewer than three there is nothing shared to interpret: you cannot tell a common trait from one question's own quirks.

So the loadings settle what the eigenvalues left open. Two factors, and the third column is empty.

=== step === concept
## Naming each factor from its column

A factor is not finished until it has a name, and the name has to come out of the column rather than out of your expectations. Print each column sorted, biggest loading at the top, and read the question names.

```r
# Name each factor from the questions on it, biggest loading first
L <- fit$loadings

for (f in 1:2) {
  column <- L[, f]
  belong <- sort(column[abs(column) > 0.3], decreasing = TRUE)
  cat("Factor", f, "\n")
  print(round(belong, 2))
  cat("\n")
}
#> Factor 1 
#>    would_renew    meets_needs   good_support  happy_overall      recommend 
#>           0.81           0.81           0.79           0.78           0.77 
#>    easy_to_use worth_the_time  thinking_quit    frustrating 
#>           0.75           0.74          -0.74          -0.74 
#> 
#> Factor 2 
#>   switch_cheaper   compares_deals     budget_first    price_matters 
#>             0.81             0.79             0.76             0.76 
#>    checks_rivals   waits_for_sale price_over_brand 
#>             0.76             0.72             0.68 
#> 
```

Naming a factor is three questions answered in order.

**What is on it?** Factor 1 holds renewing, meeting needs, good support, being happy, recommending, ease of use and being worth the time. Factor 2 holds switching for a cheaper option, comparing deals, budgeting first, price mattering, checking rivals, waiting for a sale and choosing price over brand.

**What do you call it?** Factor 1 is overall satisfaction. Factor 2 is price sensitivity. Neither name is a question in the survey, and that is expected, because the factor is the thing all those questions were circling.

**Which end means what?** This is the part people skip, and it is where sign errors get published. A high score on factor 1 means a customer agreed with `would_renew` and `meets_needs`, which are worded positively, and disagreed with `frustrating` and `thinking_quit`, which are worded backwards. Both halves point the same way, so high on factor 1 means satisfied. The two negative loadings are the confirmation rather than a problem: if `frustrating` had come back positive alongside `would_renew`, something would be wrong with the data or with your reading of the questions.

[TIP]
Write the name down as a full sentence with its direction attached, the way you would have to say it in a meeting. "Factor 1 is overall satisfaction, high means satisfied." A factor named without a direction is the easiest way there is to read a result backwards a month later.

=== step === concept
## The four questions that belong to no factor

Sixteen questions found a home. Four did not, and it is worth being precise about how badly.

The measure for this is the **communality**, the share of a question the factors explain, which comes straight out of the fit as one minus the uniqueness. Multiply it by 100 and it reads as a percentage.

```r
# How much of each question the two factors explain, as a percentage
communality <- 1 - fit$uniquenesses
round(100 * sort(communality, decreasing = TRUE), 1)
#>      would_renew      meets_needs   switch_cheaper   compares_deals 
#>             65.8             65.6             64.8             62.8 
#>     good_support    happy_overall        recommend     budget_first 
#>             61.9             60.7             60.0             58.5 
#>    price_matters    checks_rivals      easy_to_use   worth_the_time 
#>             58.0             57.6             56.4             55.2 
#>      frustrating    thinking_quit   waits_for_sale price_over_brand 
#>             55.0             54.2             52.4             46.6 
#>  attends_webinar         uses_app     opens_emails       reads_blog 
#>              0.7              0.5              0.3              0.1 
```

Sort those as bars and the shape of the result is impossible to miss.

::widget importance-bars {"items": [{"label": "would_renew", "value": 65.8}, {"label": "meets_needs", "value": 65.6}, {"label": "switch_cheaper", "value": 64.8}, {"label": "compares_deals", "value": 62.8}, {"label": "good_support", "value": 61.9}, {"label": "happy_overall", "value": 60.7}, {"label": "recommend", "value": 60}, {"label": "budget_first", "value": 58.5}, {"label": "price_matters", "value": 58}, {"label": "checks_rivals", "value": 57.6}, {"label": "easy_to_use", "value": 56.4}, {"label": "worth_the_time", "value": 55.2}, {"label": "frustrating", "value": 55}, {"label": "thinking_quit", "value": 54.2}, {"label": "waits_for_sale", "value": 52.4}, {"label": "price_over_brand", "value": 46.6}, {"label": "attends_webinar", "value": 0.7}, {"label": "uses_app", "value": 0.5}, {"label": "opens_emails", "value": 0.3}, {"label": "reads_blog", "value": 0.1}]}

Sixteen questions run from 65.8% down to 46.6%, a gentle slope. Then the floor drops out: 0.7%, 0.5%, 0.3%, 0.1%. There is no middle ground, no question sitting at 20% and wondering which way to go.

`uses_app`, `reads_blog`, `opens_emails` and `attends_webinar` share nothing with anything. Each one moves entirely on its own.

That is a genuine result about the survey rather than a failure of the analysis. Those four ask about behaviours instead of attitudes, and in this data the behaviours are unrelated both to satisfaction and to price sensitivity. A customer who opens your emails is no more likely to be happy, and no more likely to be price-conscious, than one who never opens them.

What you do about it is a judgement call, and there are three honest options: drop the four and report the sixteen that hang together, keep them as four separate single-question measures reported on their own terms, or go back and write more behaviour questions so that block has a chance to form a factor of its own. What you must not do is force them onto factor 1 or factor 2 because you expected them to be there.

=== step === quiz
## Quick check: why do four questions still load on nothing?

`uses_app`, `reads_blog`, `opens_emails` and `attends_webinar` came back with communalities of 0.7%, 0.5%, 0.3% and 0.1%, both before rotation and after it. Why did varimax not help them?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Varimax failed on those four, because rotation only converges properly for questions that already load somewhere. ::no
- Rotation moves loadings between the factors, it never changes how much of a question the factors explain in total, and for those four that total was already almost zero. ::ok Exactly. Communality is one minus the uniqueness, and the uniquenesses came back identical at both angles. Rotation cannot hand a question variance the factors never had.
- Those four need a factor of their own, and asking for six factors would give each of them one. ::no
- Those four were answered carelessly, so their answers are noise and nothing can be recovered from them. ::no Rotation only redistributes shared variance between the columns, so the total explained per question is fixed before any rotating begins, which is why the uniquenesses were identical at both angles. And a near-zero communality is a real result rather than a defect. Those four questions move on their own, so no rotation, no extra factor, and no assumption about careless answering will connect them to satisfaction or to price.

=== step === tryit
## Your turn: rebuild a correlation from the loadings

Here is the claim behind the whole method, put to the test one last time on a pair we have not tried yet. The model says two questions can only correlate through what they share, so multiplying their loading rows together and adding up the products should land on the correlation the data actually shows.

Do it for `price_matters` and `checks_rivals`, then print the observed correlation next to it.

```r
# L holds the rotated loadings: one row per question, one column per factor.
# Multiply the two questions' loading rows element by element, add the
# products, then print the correlation the data actually shows.
# Two lines. Press Check when you have them.
```
::check {"regex": "sum[(][^)]*price_matters[^)]*checks_rivals", "gate": true, "difficulty": "intermediate", "ok": "That is it: 0.578 from the loadings against 0.592 in the data. Two questions, three numbers between them, and the correlation comes back out.", "no": "Pull the two rows out of the loadings matrix, multiply them element by element, and sum the result: sum of L[price_matters, ] times L[checks_rivals, ], with each question name in quotes. Then cor() on the two survey columns for the comparison."}
::solution
```r
# Rebuild the correlation between price_matters and checks_rivals from their loadings
sum(L["price_matters", ] * L["checks_rivals", ])
#> [1] 0.577785
cor(survey$price_matters, survey$checks_rivals)
#> [1] 0.591596
```

That is 0.578 against 0.592. They agree to a hundredth, and the products came from two rows of three-decimal numbers.

That is what a fitted factor model is for. Two hundred customers answered twenty questions, which is 190 separate correlations to account for, and the fit accounts for all of them with forty loadings and twenty uniquenesses. The reason `price_matters` and `checks_rivals` move together is that both are reading the same hidden quantity, and now you can put a number on how much of each one they read.

=== step === concept
## References

- [Evaluating the use of exploratory factor analysis in psychological research](https://doi.org/10.1037/1082-989X.4.3.272) - Fabrigar, Wegener, MacCallum and Strahan (1999), Psychological Methods 4(3), 272-299. The standard guidance on extraction, on choosing the number of factors, and on rotation.
- [Best practices in exploratory factor analysis](https://doi.org/10.7275/jyj1-4868) - Costello and Osborne (2005), Practical Assessment, Research and Evaluation 10(7). The practical checklist, including the evidence that the eigenvalue greater than 1 rule over-extracts.
- [The application of electronic computers to factor analysis](https://doi.org/10.1177/001316446002000116) - Kaiser (1960), Educational and Psychological Measurement 20(1), 141-151. Where the eigenvalue greater than 1 rule comes from.
- [Latent Variable Models and Factor Analysis](https://doi.org/10.1002/9781119970583) - Bartholomew, Knott and Moustaki (2011), Wiley, third edition. The formal common factor model and how it is estimated by maximum likelihood.
- [Factor analysis](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/factanal.html) - R Core Team. Exactly what the loadings, uniquenesses, SS loadings row and printed test contain.

=== step === complete
## Quick recap

You took a twenty-question survey from a wall of correlations to two named factors, and every move had a number attached to it.

- **Correlations in.** The method sees the correlation matrix and nothing else. Yours held two dense blocks around 0.6, near zero between them, and a backwards-worded question showing up as minus 0.63.
- **One equation.** Each answer is a loading times a hidden factor plus a part of its own. The loading squared is the communality, the leftover is the uniqueness, and the two always sum to 1.
- **Count the factors.** The eigenvalues were 5.80, 4.40, 1.18, 1.11, 0.98, 0.97. Kaiser's rule kept four, the cliff in the scree plot said two, and the fit settled it.
- **Fit.** Two factors reproduced 46.9% of the survey's variance with a chi-square p-value of 0.254, and rebuilt the correlation between `happy_overall` and `would_renew` as 0.628 against an observed 0.637.
- **Rotate.** Varimax moved every loading and changed nothing that mattered: identical uniquenesses, and the same 9.371 of explained variance at both angles.
- **Read and name.** Nine questions landed on factor 1, seven of them between 0.74 and 0.81 and the two backwards-worded ones at minus 0.74. Seven landed on factor 2, between 0.68 and 0.81. No question landed on both. Factor 1 is overall satisfaction, high means satisfied. Factor 2 is price sensitivity.
- **Report the leftovers.** Four questions came back with communalities under 1%. They share nothing with anything, and saying so is part of the result.

Next time a survey lands on your desk with questions that clearly move together, you have the whole route: correlate, count, fit, rotate, read, name. Have a great day.
