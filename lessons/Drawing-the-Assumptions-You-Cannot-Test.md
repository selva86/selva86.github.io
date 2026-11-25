---
title: "Causal Inference from Data Lesson 2: Drawing the assumptions you cannot test"
catalog_blurb: "How to read a causal diagram and know which variables belong in your regression."
description: "A software company's onboarding call shows how a causal diagram, not the dataset's columns, decides which variables belong in a regression and which bias it."
keywords: "causal diagram, confounder, mediator, collider, directed acyclic graph, DAG, adjustment set, causal inference, regression, R"
post_type: "LESSON"
curriculum_id: "4.130.2"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "res-causal"
course_title: "Causal Inference from Data"
course_lesson: "2"
course_total: "8"
course_landing: "Causal-Inference-from-Data-Course.html"
course_next: "Propensity-Scores-and-Inverse-Probability-Weights"
course_prev: "What-a-Causal-Effect-Actually-Is"
---

=== step === cover
## Drawing the assumptions you cannot test

Today we are going to look at a simple picture called a causal diagram, and learn the rule it gives you for deciding which variables belong in a regression.

Priya runs a software company. She wants to know whether a first-week onboarding call raises how much a customer spends a year later. She has the data to run a regression and get a number. But whether that number is the honest answer depends on something the regression by itself cannot tell her: what else is going on between the call and the spend.

Below is a causal diagram with three variables, X, Y and Z. Switch between its three buttons, confounder, collider and mediator, and watch how differently Z sits between X and Y each time.

::widget causal-dag {}

Z plays a completely different part in each of those three pictures. Which part it plays is written right there in the diagram, in which arrows point where.

=== step === concept
## What a causal diagram actually claims
::prose-only the three shapes arrive one at a time starting next step, so there is nothing to draw on this step yet

A causal diagram is a simple picture with two parts. A node is a variable. An arrow from one node to another says that the first one causes the second.

That is the whole vocabulary. A diagram with three nodes and two arrows is making exactly two factual claims, nothing more and nothing less. Draw an arrow where there is really no cause, or leave one out where there is one, and the diagram tells you the wrong thing to do with your data.

So drawing it correctly is a decision you make before you look at the data. The data cannot hand it to you.

Here are Priya's two fixed nodes. The onboarding call is X. The year-two spend is Y.

A third variable, Z, is going to sit in Priya's data in three different ways. Each time, Z will be measured, real, and sitting right there as a column Priya could add to her regression. What changes is where the arrows point, and that alone decides whether adding it helps her or hurts her.

=== step === concept
## The confounder: a variable that explains a correlation away

Z's first role is a confounder. A confounder is a variable with an arrow pointing into both X and Y.

Suppose Priya's sales team already has a sense of which new customers look like big future spenders, and they spend their limited calling time on exactly those accounts. So a customer's spend before they even signed up, call it baseline_spend, pushes up both their chance of getting the onboarding call and their spend in year two. baseline_spend has an arrow into onboarding_call and a separate arrow into year2_spend. That is a confounder.

If baseline_spend confounds the comparison, then comparing year-two spend between customers who got the call and customers who did not is not a fair comparison. The two groups differ in more than the call. The ones who got it were already headed for higher spend.

Let's simulate this exactly, instead of guessing at the size of the problem. For 1,000 customers, baseline_spend is a random score, and a customer's chance of getting the call rises with that score. year2_spend depends only on baseline_spend here, with onboarding_call given no effect on it at all. So the true effect of the call on year2_spend, in this data, is exactly zero.

```r
# Simulate 1,000 customers where baseline spend confounds the call and the outcome
set.seed(1)
n <- 1000
baseline_spend <- rnorm(n)
onboarding_call <- rbinom(n, 1, plogis(1.2 * baseline_spend))
year2_spend <- 1.5 * baseline_spend + rnorm(n)
confound_dat <- data.frame(baseline_spend, onboarding_call, year2_spend)

coef(lm(year2_spend ~ onboarding_call, data = confound_dat))["onboarding_call"]
#> onboarding_call 
#>           1.467 
coef(lm(year2_spend ~ onboarding_call + baseline_spend, data = confound_dat))["onboarding_call"]
#> onboarding_call 
#>           0.047 
```

`plogis()` turns any real number into a probability between 0 and 1, using the logistic curve. Multiplying baseline_spend by 1.2 before handing it to plogis() means a higher baseline spend turns into a higher chance of getting the call, which is exactly the confounding described above.

Look at the two coefficients on onboarding_call. Regressed on its own, the call reports 1.467. Add baseline_spend, and it drops to 0.047, close enough to zero to call noise.

The true effect built into this data is zero. The 1.467 was never the call's effect. It was baseline_spend's effect, leaking through onboarding_call because the two move together.

So here is the rule for a confounder: adjust for it. Add it to the regression, and the bias it was creating closes.

=== step === concept
## The mediator: adjusting for it deletes the effect you wanted

Z's second role is a mediator. A mediator sits on the path between X and Y: X has an arrow into it, and it has an arrow into Y.

Suppose the onboarding call genuinely helps, but only because it gets customers to set up more integrations in their first month. The call causes a customer to set up more integrations, call that integrations_setup, and integrations_setup is what actually drives higher year-two spend. The call still matters here. It just works by pushing integrations_setup, and integrations_setup is what is actually responsible for the change in spend.

This time, build the real effect in on purpose. integrations_setup depends on onboarding_call, and year2_spend depends only on integrations_setup. So the call's entire effect on year2_spend runs through integrations_setup, and the true total effect works out to 6.

```r
# Simulate 1,000 customers where the call's whole effect runs through integrations_setup
set.seed(2)
n <- 1000
onboarding_call <- rbinom(n, 1, 0.5)
integrations_setup <- 2 * onboarding_call + rnorm(n)
year2_spend <- 3 * integrations_setup + rnorm(n)
mediator_dat <- data.frame(onboarding_call, integrations_setup, year2_spend)

coef(lm(year2_spend ~ onboarding_call, data = mediator_dat))["onboarding_call"]
#> onboarding_call 
#>           6.081 
coef(lm(year2_spend ~ onboarding_call + integrations_setup, data = mediator_dat))["onboarding_call"]
#> onboarding_call 
#>          -0.094 
```

The unadjusted regression reports 6.081, almost exactly the 6 built into the data. That is the right answer, found without even naming integrations_setup.

Add integrations_setup, and the coefficient on onboarding_call collapses to -0.094, indistinguishable from zero. Adding the mediator did not make the estimate more honest. It deleted the effect we were trying to measure.

Once the regression already knows how many integrations a customer set up, knowing whether they got the call tells it nothing more about their spend. The call's whole effect was already sitting inside integrations_setup.

So the rule for a mediator is the opposite of a confounder: leave it out, if what you want is the call's total effect.

=== step === concept
## The collider: inventing a correlation from nothing

Z's third role is a collider. A collider is the reverse of a confounder: both X and Y have an arrow pointing into it, rather than the other way round.

Say Priya's customer success team nominates a customer for the advisory board, call that board_selected, whenever the customer either took the onboarding call, or already has high year-two spend, or both. board_selected has an arrow coming in from onboarding_call and a separate arrow coming in from year2_spend. Neither the call nor the spend has anything to do with the other.

This time, build the data so the call truly has no effect on spend at all. year2_spend is generated with no connection to onboarding_call whatsoever, so the true effect here is exactly zero, the same as the confounder example.

```r
# Simulate 1,000 customers where board_selected is caused by BOTH the call and the spend
set.seed(3)
n <- 1000
onboarding_call <- rbinom(n, 1, 0.5)
year2_spend <- rnorm(n)
board_selected <- 0.9 * onboarding_call + 0.9 * year2_spend + rnorm(n)
collider_dat <- data.frame(onboarding_call, year2_spend, board_selected)

coef(lm(year2_spend ~ onboarding_call, data = collider_dat))["onboarding_call"]
#> onboarding_call 
#>           0.072 
coef(lm(year2_spend ~ onboarding_call + board_selected, data = collider_dat))["onboarding_call"]
#> onboarding_call 
#>          -0.430 
```

The unadjusted regression reports 0.072, close to the true zero. That is correct: the call and the spend really are unrelated here.

Add board_selected, and the coefficient on onboarding_call jumps to -0.430. That is not noise sitting around zero. It is a clear, sizeable, entirely fake relationship, and adjusting for board_selected is what created it.

Here is why. Inside the group of customers nominated to the board, the two routes in trade off against each other.

A board member who did not get the onboarding call must have earned the nomination through high year2_spend instead, since the call was not there to explain it. A board member who did get the call does not need an especially high spend to explain the nomination.

So inside the nominated group, knowing someone got the call now points to a lower expected spend, purely because of how board_selected was built. It says nothing about what the call does to spend.

This is the one that catches people out, because it runs backward from the other two. Adding a variable to a regression feels like it should only ever make the estimate more honest. A collider is the counter-example. It is a variable to leave alone, and putting it in invents an effect that was never there.

=== step === quiz
## Quick check: confounder, mediator or collider?

Before moving on, try one on a variable you have not seen simulated.

A teammate wants to add whether a customer was invited to the year-two customer advisory panel, call it panel_invite. Customers get invited to the panel when they either received the onboarding call, or already have high year-two spend, or both. The teammate wants to add panel_invite to the regression, reasoning that since it is correlated with both onboarding_call and year2_spend, it should be adjusted for the same way baseline_spend was.

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- It is a confounder. panel_invite happens before year2_spend is fully realised, so add it to the regression the way baseline_spend was added. ::no
- It is a mediator. The call drives panel_invite, and panel_invite is what actually drives the spend, so add it to isolate the direct effect. ::no
- It is a collider. Both onboarding_call and year2_spend point into panel_invite, not the other way round, so leave it out of the regression. ::ok Right. The arrows run from onboarding_call and from year2_spend into panel_invite, which makes it a collider. Adding it would invent an association between the call and the spend the same way adjusting for board_selected did.
- It does not matter either way, since panel_invite is correlated with both onboarding_call and year2_spend regardless of which variable caused which. ::no Being correlated with both variables is not enough to decide what to do here. What matters is the direction of the arrows: a confounder points out to X and Y, a mediator sits between them, and a collider points in from both. panel_invite has arrows pointing in, which makes it a collider, and adjusting for a collider invents a relationship rather than removing one.

=== step === widget
## Reading the adjustment set off a diagram

Real data usually mixes more than one of these shapes at once, so this diagram lets you edit a confounder and a mediator together on the same picture.

::widget dag-editor {"scenario": "confounding"}

Its names map onto Priya's story directly. Z, labelled baseline severity, is baseline_spend. X, labelled treatment, is onboarding_call.

Y, labelled outcome, is year2_spend. M, labelled adherence, is integrations_setup, the mediator.

As the diagram loads, Z confounds X and Y exactly like baseline_spend did, and the path through M is switched off. The panel above the diagram already shows the result: the model reports 0.690 for X, while the true direct effect drawn into the diagram is only 0.300.

Click the node Z to adjust for it. The reported coefficient drops to 0.300, matching the truth exactly, the same way adding baseline_spend closed that gap.

Now click the two ghosted arrows, the one running from X to M and the one from M to Y, to switch the mediator path on. The true effect printed above the diagram grows to 0.520, since a real part of the call's effect is now running through M, the same way integrations_setup carried the whole effect when it played the mediator. With only Z adjusted, the model still correctly reports 0.520, because the path through M is open and running freely all the way from X to Y.

Click M as well, to adjust for it the way an analyst might out of habit. The model's number falls back to 0.300. It did not become more honest. It blocked the 0.220 of real effect running through M, the same mistake a mediator causes when someone adjusts for it, now sitting on the same diagram as the confounder you just fixed.

=== step === widget
## The mistake with a name: controlling for everything you measured

Switch to the diagram's other shape, where the mistake is already built into how the data were collected, not into the regression formula.

::widget dag-editor {"scenario": "selection"}

X and Y are still onboarding_call and year2_spend. S, stayed in the study, stands for whether a customer answered this quarter's customer survey, which is the dataset Priya is actually sitting on. The diagram loads already adjusting for S, because that is exactly what analysing survey respondents only amounts to: every row in that dataset already satisfies S.

Look at what the model reports: about -0.212. The true effect, built into the diagram, is 0.300. The onboarding call looks like it hurts spend, when it really helps.

Here is why. Say only customers who either got the call or who already spend a lot tend to answer the survey.

Among the survey respondents who did not get the call, the only way most of them qualified for the survey is through high spend. Among the respondents who did get the call, no high spend was needed to qualify.

So inside the surveyed group alone, getting the call now points to a lower typical spend, purely because of who answered the survey, not because of anything the call did.

Click S to stop adjusting for it, which in Priya's data would mean analysing every customer rather than only the ones who answered the survey. The reported coefficient jumps to 0.300, matching the truth exactly.

This is collider bias again, wearing a different disguise. S is caused by both X and Y, the same as board_selected was. Restricting a dataset to survey respondents, to patients who completed a trial, or to customers who are still active a year later, is the same move as adjusting for a collider.

It happens automatically, often before anyone writes a line of regression code, which is why controlling for everything you measured is not a safe default. Sometimes the thing doing the controlling is which rows made it into the dataset at all.

=== step === tryit
## Your turn: pick the regression the diagram asks for

Here is a fourth customer dataset. The code below builds it and prints the true effect of the call on spend, the number this exercise is built to recover.

```r
# Build a fourth dataset and reveal the true effect baked into it
set.seed(4)
n <- 1000
account_size <- rnorm(n)
onboarding_call <- rbinom(n, 1, plogis(1.2 * account_size))
year2_spend <- 1.5 * account_size + rnorm(n)
tryit_dat <- data.frame(account_size, onboarding_call, year2_spend)

true_effect <- 0
true_effect
#> [1] 0
```

Read the three lines that build account_size, onboarding_call and year2_spend the way you would read a diagram: which variable is a parent of which. Then decide whether account_size belongs in the regression, and edit the line below so that it recovers the true effect, 0.

```r
# Edit this line: does the regression need account_size, or not?
lm(year2_spend ~ onboarding_call, data = tryit_dat)
```
::check {"regex": "(?=[\\s\\S]*lm[(])(?=[\\s\\S]*year2_spend)(?=[\\s\\S]*onboarding_call)(?=[\\s\\S]*account_size)", "gate": true, "difficulty": "intermediate", "ok": "Right. account_size causes both onboarding_call and year2_spend, the same shape baseline_spend had, so it has to go in. With it in the regression, the coefficient on onboarding_call lands at 0.001, matching the true effect of 0.", "no": "Trace the three lines again. account_size feeds into both onboarding_call and year2_spend, which makes it a confounder of the call and the spend, the same shape baseline_spend had. Add it to the formula: lm(year2_spend ~ onboarding_call + account_size, data = tryit_dat)."}
::solution
```r
# The correct fit: adjust for the confounder, account_size
lm(year2_spend ~ onboarding_call + account_size, data = tryit_dat)
#> 
#> Call:
#> lm(formula = year2_spend ~ onboarding_call + account_size, data = tryit_dat)
#> 
#> Coefficients:
#>     (Intercept)  onboarding_call     account_size  
#>           0.040            0.001            1.506  
```

Leave account_size out, and the same call would have reported 1.320 instead, the same kind of bias baseline_spend produces whenever it is left out of a regression it belongs in.

=== step === quiz
## Closing check: read the diagram, choose the fix

One more, and this one asks for everything at once: name the shape, decide whether to adjust, and predict which way a wrong adjustment would move the answer.

Priya's account managers offer a renewal discount to a customer if the customer either got the onboarding call, or already has high year-two spend, or both. An analyst wants to add renewal_discount to the regression, since it looks related to both the call and the spend.

::quiz {"correct": 3, "gate": true, "difficulty": "advanced"}
- renewal_discount is a confounder, since it is tied to both onboarding_call and year2_spend, so add it to the regression to remove the bias. ::no
- renewal_discount is a mediator, since the call leads to the discount and the discount is part of how spend plays out, so add it to isolate the direct effect. ::no
- renewal_discount is a collider, since both onboarding_call and year2_spend cause it rather than the other way round. Leave it out. Adjusting for it would turn a real, near-zero relationship between the call and the spend into a reported negative one. ::ok Right. The arrows into renewal_discount come from onboarding_call and from year2_spend, which makes it a collider, and the same mechanics as board_selected apply. Adjusting for a variable that two positively related causes both feed into manufactures a negative association between those two causes, where none exists.
- renewal_discount is a collider, so leave it out, but adjusting for it would not change the coefficient at all, since the call and the spend are unrelated to begin with. ::no A collider is exactly the kind of variable that does change the coefficient once adjusted for, often by a lot. Both onboarding_call and year2_spend feed into renewal_discount here, which makes it a collider, and adjusting for it would manufacture a negative association between the call and the spend where none exists, the same mechanics already seen with board_selected.

=== step === concept
## References
::prose-only the sources are text, not a visual

- [Causal diagrams for empirical research](https://academic.oup.com/biomet/article/82/4/669/246105) - Pearl, J. (1995), Biometrika, 82(4), 669-688. Introduces d-separation and the back-door criterion the adjustment-set rule in this lesson comes from.
- [Causal diagrams for epidemiologic research](https://doi.org/10.1097/00001648-199901000-00008) - Greenland, S., Pearl, J., Robins, J.M. (1999), Epidemiology, 10(1), 37-48. The practical guide to drawing a diagram and reading confounders off it.
- [A structural approach to selection bias](https://doi.org/10.1097/01.ede.0000135174.63482.43) - Hernan, M.A., Hernandez-Diaz, S., Robins, J.M. (2004), Epidemiology, 15(5), 615-625. The basis for the survey-respondents collider example in this lesson.
- [Endogenous selection bias: the problem of conditioning on a collider variable](https://doi.org/10.1146/annurev-soc-071913-043455) - Elwert, F., Winship, C. (2014), Annual Review of Sociology, 40, 31-53. The collider-bias result demonstrated numerically in this lesson.
- [Causal Inference: What If](https://www.hsph.harvard.edu/miguel-hernan/causal-inference-book/) - Hernan, M.A., Robins, J.M. (2020), Chapman and Hall/CRC. A free, rigorous text covering confounders, mediators and colliders in full.

=== step === complete
## What this gives you before you run a single regression

Here is Priya's honest answer. Whether the onboarding call really raised year-two spend depends on which diagram is true: baseline_spend reaching into both the call and the spend, integrations_setup carrying the call's effect forward, or board_selected pulled in from both sides. The dataset's columns look the same regardless of which one it is. Only the diagram tells you which one you are looking at.

So here is the rule this lesson was building toward. A confounder gets adjusted for. A mediator and a collider do not, if what you want is the call's total effect. And controlling for everything you measured is not a safe default, because some of what gets measured is a collider waiting to invent an effect that was never there, sometimes through nothing more than which rows made it into the dataset.

Draw the diagram first. Read the adjustment set off it. Then write the regression.

Next: how to use the propensity score, the fitted probability of getting the treatment, both as a weight and as a check that the two groups actually overlap.
