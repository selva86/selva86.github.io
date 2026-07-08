---
title: "Causal Inference Lesson 2: Causal Diagrams with DAGs"
catalog_blurb: "Reading confounders, colliders and mediators off a causal diagram."
description: "Draw your causal assumptions as a DAG and read off the graph what to control for: adjust for confounders, never colliders or mediators. Runnable R throughout."
keywords: "causal diagram, DAG, confounder, collider, mediator, backdoor path, backdoor criterion, adjustment set, d-separation, causal inference in R, dagitty, do-operator"
post_type: "LESSON"
curriculum_id: "6.10.2"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-causal"
course_title: "Causal Inference in R"
course_lesson: "2"
course_total: "5"
course_landing: "R-Causal-Inference-Course.html"
course_next: "AB-Testing-and-Experiment-Design.html"
course_prev: "Correlation-Causation-and-Potential-Outcomes.html"
---

=== step === cover
::eyebrow Lesson 2 of 5
## Causal Diagrams with DAGs

Last lesson, Riverside Books mailed a coupon and randomizing it recovered its true $8 effect. But randomizing was a luxury. This month Riverside wants to know something it *cannot* randomize: does joining **Riverside Plus**, its paid membership, actually make a customer spend more? You cannot force random shoppers to join a membership, so the clean coin flip is off the table.

When you cannot randomize, you are forced to reason from assumptions instead. A **causal diagram** (a DAG) is those assumptions drawn as a picture, and its payoff is remarkable: once the picture is on paper, you can read straight off it which variables you must control for and which ones you must leave strictly alone.

By the end of this lesson you will be able to:

- Draw a causal question as a DAG, where circles are variables and arrows are direct causes
- Recognize the three shapes every diagram is built from, and give the control rule for each: a confounder, a mediator, and a collider
- See, in real R, how controlling the wrong variable either hides a real effect or invents a fake one
- Use the backdoor criterion to choose exactly the right set of variables to adjust for

**Prerequisites:** [Lesson 1](Correlation-Causation-and-Potential-Outcomes.html) (confounding, selection bias, and randomization), and you can fit `lm()` and read a coefficient. Every new term is defined as it appears. Toggle the three buttons below to see the whole lesson in one picture.

::widget causal-dag {}

=== step === concept
::eyebrow The idea
## Causal Diagrams with DAGs

Start by writing Riverside's belief down. We think joining Plus (call it `plus`) raises monthly `spend`. That single belief is one arrow:

\[ \texttt{plus} \longrightarrow \texttt{spend} \]

That picture is a **DAG**, short for *directed acyclic graph*, and each word earns its place:

- **Graph** because it is circles joined by lines. Each circle is a **node**, one variable we can measure (`plus`, `spend`, and soon others).
- **Directed** because every line is an **arrow** with a direction. An arrow from A to B is a specific, strong claim: *A is a direct cause of B*. No arrow means you believe there is no direct causal link.
- **Acyclic** because you can never follow the arrows in a loop back to where you started. A variable cannot end up causing itself; causes flow forward in time.

A DAG is nothing more than your causal assumptions, made explicit and drawn. That is its whole power: assumptions written this plainly can be argued about, criticized, and checked against what you know of the world, instead of hiding silently inside a regression. Building one is three honest steps.

::widget process-flow {"steps":[{"title":"List the variables","sub":"the treatment, the outcome, and anything that might touch either one"},{"title":"Draw the arrows","sub":"one arrow for each DIRECT cause you actually believe in"},{"title":"Check it is acyclic","sub":"no variable may cause itself by following arrows around a loop"}]}

[NOTE]
A DAG does not come from the data. It comes from you, from what you know about how Riverside's customers behave. The data cannot draw the arrows for you; it can only be interpreted once the arrows are drawn.

=== step === concept
::eyebrow The building blocks
## A path, and the three shapes it can take

The `plus` and `spend` nodes are almost never alone. Other variables connect them, and a **path** is any trail of arrows you can walk from one node to another, *ignoring which way the arrows point*. Paths matter because association, the statistical "these two move together" that a correlation measures, flows along certain paths and is dammed on others. Some paths carry the real effect; some smuggle in a fake one.

The wonderful fact is that no matter how large the diagram, every path is built from just three elementary shapes, defined by the arrows around the middle variable. Toggle each one below and read its verdict.

::widget causal-dag {}

- **Fork**, written \(X \leftarrow Z \rightarrow Y\): the middle variable Z is a **common cause** of both. This is a **confounder**. It fakes an association between X and Y, so you must **control for it**.
- **Chain**, written \(X \rightarrow M \rightarrow Y\): the middle variable M sits on the road *from* X *to* Y. This is a **mediator**. The real effect travels through it, so to measure the total effect you **leave it alone**.
- **Collider**, written \(X \rightarrow C \leftarrow Y\): both arrows crash *into* the middle variable C. This is a **collider**. It blocks association by default, and controlling for it **invents** one.

The next three steps take each shape in turn and make it bite, in real numbers, on Riverside's own data. Watch how the same act, adding a variable to a regression, is right for one shape and disastrous for the others.

=== step === concept
::eyebrow Shape 1: the fork
## A confounder inflates the effect

Here is Riverside's real problem. Loyal customers, the ones already engaged last year, are both far more likely to *join Plus* and, quite separately, inclined to *spend more anyway*. Loyalty sits at the top of a fork, an arrow running down to each side:

\[ \texttt{plus} \longleftarrow \texttt{loyalty} \longrightarrow \texttt{spend} \]

That path, `plus` <- `loyalty` -> `spend`, is a **backdoor path**: a trail connecting treatment and outcome that does not run *through* the treatment's effect. Association leaks across it, and a naive comparison of Plus versus non-Plus members scoops that leak up along with any real effect. Let us build the customers and watch it happen. Because this is a simulation we can plant the truth: Plus really adds **$5**, and loyalty lifts spend on its own.

```r
# Riverside Plus: one row per customer. loyalty is the confounder.
set.seed(1)
n <- 2000
loyalty <- rnorm(n)                                     # last year's engagement, centered at 0
plus    <- rbinom(n, 1, plogis(1.1 * loyalty))          # loyal customers join Plus more often
spend   <- 40 + 5 * plus + 12 * loyalty + rnorm(n, 0, 6) # TRUE Plus effect = $5; loyalty also lifts spend
confound <- data.frame(loyalty, plus, spend)

coef(lm(spend ~ plus, data = confound))["plus"]          # naive: compare Plus vs non-Plus, ignoring loyalty
#>     plus 
#> 15.42611 
```

The naive model says Plus is worth **$15.43**, three times the truth. The extra ten dollars are loyalty's shadow, leaking across the open backdoor: the Plus group was stacked with loyal big spenders to begin with. Now close the backdoor by **adjusting for** loyalty, which simply means putting it in the model so Plus and non-Plus customers are compared at the *same* loyalty.

```r
coef(lm(spend ~ plus + loyalty, data = confound))["plus"] # adjust for the confounder
#>     plus 
#> 5.109001 
```

The estimate collapses to **$5.11**, essentially the planted $5. One variable added, and the illusion is gone.

[KEY INSIGHT]
A fork is **open** by default, so a confounder leaks a fake association through the backdoor. Adjusting for the confounder **closes** the backdoor, and the leftover treatment coefficient is the honest effect.

=== step === quiz
::eyebrow Check yourself
## What to do with the confounder

In the study above, loyalty is a common cause of joining Plus and of spending. To recover the true effect of Plus on spend, what should you do with loyalty?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Put it in the model (adjust for it), so Plus and non-Plus customers are compared at equal loyalty ::ok Exactly. Loyalty is a confounder sitting on the backdoor path plus <- loyalty -> spend. Holding it fixed closes that backdoor, which is why the estimate dropped from 15.43 to 5.11, the truth.
- Leave it out, because adding more variables to a regression always biases it ::no Adding a variable is neither automatically good nor bad; it depends on the variable's role in the diagram. Leaving out a confounder is precisely what inflated the estimate here. (Adding a mediator or collider, coming up next, is the case where controlling backfires.)
- Drop every customer whose loyalty is above average, to balance the two groups ::no Throwing away data does not make the groups comparable and can create its own selection bias. Adjusting for loyalty inside the model uses every customer and compares like with like.

=== step === concept
::eyebrow Shape 2: the chain
## A mediator carries the effect, so leave it alone

Now the opposite mistake. Suppose Plus works entirely by nudging people onto the app: members open the app more, and more app visits lead to more spending. Nothing about Plus touches spend *except* through those visits:

\[ \texttt{plus} \longrightarrow \texttt{visits} \longrightarrow \texttt{spend} \]

`visits` is a **mediator**: it sits on the causal road from Plus to spend. Here the whole effect is real and travels down the chain. To keep the fork out of the way, we randomize Plus this time, so there is no confounder to worry about, only the mediator.

```r
# Randomize Plus so nothing confounds it; the ONLY route to spend is through visits.
set.seed(2)
n <- 2000
plus   <- rbinom(n, 1, 0.5)                     # assigned by a coin, so no confounding
visits <- 3 + 4 * plus + rnorm(n, 0, 1.5)       # Plus drives app visits (the mediator M)
spend  <- 20 + 6 * visits + rnorm(n, 0, 5)      # spend depends on visits, not directly on Plus
mediate <- data.frame(plus, visits, spend)

coef(lm(spend ~ plus, data = mediate))["plus"]           # TOTAL effect of Plus, all of it via visits
#>     plus 
#> 23.51342 
```

Plus is worth **$23.51** in total: each membership adds about 4 visits, and each visit adds about $6. That is the number Riverside cares about. Watch what happens if you "control for" visits, thinking more variables must mean a cleaner estimate.

```r
coef(lm(spend ~ plus + visits, data = mediate))["plus"]  # control the mediator: the effect vanishes
#>       plus 
#> -0.6247043 
```

The Plus coefficient falls to essentially **zero**. By holding visits fixed you asked a different, misleading question, "does Plus help *beyond* the visits it causes?", and the honest answer is no, because visits were the entire mechanism. Report this number and you would tell Riverside that Plus does nothing, when it actually adds $23.

[WARNING]
Controlling for a mediator **removes the very effect you are trying to measure**. A chain is open by default (the effect flows), and conditioning on the middle closes it. When you want a treatment's *total* effect, never adjust for a variable that the treatment itself causes.

=== step === concept
::eyebrow Shape 3: the collider
## A collider invents an effect out of nothing

The third shape is the sneakiest, because here controlling for a variable creates an association that was never there. Riverside hands out a **Top Reader badge** to any customer who is *either* a Plus member *or* a big spender. The badge is a **common effect**: two arrows crash into it.

\[ \texttt{plus} \longrightarrow \texttt{badge} \longleftarrow \texttt{spend} \]

Suppose, for this demonstration, that Plus and spend are genuinely **unrelated**, no arrow between them at all. Overall they should look independent, and they do.

```r
# plus and spend are INDEPENDENT here (no arrow between them). Both cause the badge.
set.seed(3)
n <- 4000
plus  <- rbinom(n, 1, 0.5)
spend <- 40 + rnorm(n, 0, 10)                   # independent of membership
badge <- as.integer(plus == 1 | spend > 55)     # Top Reader: Plus members OR big spenders
collide <- data.frame(plus, spend, badge)

cor(collide$plus, collide$spend)                 # overall: essentially zero
#> [1] -0.0280188
```

Now an analyst, wanting a "cleaner" sample, studies only badged customers, that is, conditions on the collider.

```r
badged <- collide[collide$badge == 1, ]          # keep only Top Reader customers
cor(badged$plus, badged$spend)                   # a strong NEGATIVE link appears from nowhere
#> [1] -0.4634357
round(tapply(badged$spend, badged$plus, mean), 1) # average spend, non-Plus vs Plus, among the badged
#>    0    1 
#> 59.2 39.4 
```

A firm negative correlation materializes, and the averages explain why. Among badged customers, a *non-member* had only one way to earn the badge: by spending a lot. So within this group, being non-Plus all but guarantees high spend ($59) and being Plus does not ($39). The badge "explains away" one cause by the other, manufacturing a link between two variables that are truly independent.

[KEY INSIGHT]
A collider is **blocked** by default (nothing leaks). Conditioning on it, whether by putting it in the model or by only studying the cases where it happened, **opens** a fake path. Selecting your sample on a common effect is the same mistake wearing a disguise.

=== step === tryit
::eyebrow Your turn
## Close the backdoor yourself

Back to the confounded `confound` data from earlier, which has three columns: `loyalty` (the confounder), `plus` (the treatment), and `spend` (the outcome). The naive `coef(plus)` was an inflated $15.43. Complete the model so it estimates the true, unconfounded effect of Plus, then check it.

```r
fit <- lm(spend ~ plus + ____, data = confound)   # add the variable that closes the backdoor
coef(fit)["plus"]
```
::check {"regex":"plus\\s*\\+\\s*loyalty","gate":true,"difficulty":"intermediate","ok":"Right: adjusting for loyalty gives coef(plus) = 5.11, the true effect. loyalty is the single variable on the backdoor path plus <- loyalty -> spend, so it is exactly what to control for.","no":"Add the confounder loyalty: lm(spend ~ plus + loyalty, data = confound). It is the common cause of Plus and spend, the variable sitting on the backdoor path."}
::solution
```r
fit <- lm(spend ~ plus + loyalty, data = confound)
coef(fit)["plus"]
#>     plus 
#> 5.109001 
```

=== step === concept
::eyebrow One rule to bind them
## Open, blocked, and how conditioning flips each

You have now seen every case. They collapse into one compact rule about whether a path is **open** (association flows) or **blocked** (it does not), and what conditioning on the middle variable does to it.

| Shape | The middle variable is... | The path is, by default... | Condition on the middle and the path... |
|---|---|---|---|
| Fork (confounder) | a common cause of X and Y | OPEN, leaking a fake association | becomes BLOCKED, so the bias is removed |
| Chain (mediator) | a step on the road from X to Y | OPEN, carrying the real effect | becomes BLOCKED, so the effect is removed |
| Collider | a common effect of X and Y | BLOCKED, leaking nothing | becomes OPEN, inventing a fake link |

Read the last column carefully: **conditioning flips every path**. On a fork or a chain, conditioning on the middle *closes* the path. On a collider, conditioning *opens* it. This single flip rule (the heart of what is formally called *d-separation*) is enough to look at any diagram and say which variables belong in your model and which must stay out. A confounder in, a mediator and a collider out.

=== step === concept
::eyebrow The recipe
## The backdoor criterion picks the adjustment set

Put it together into a procedure. To estimate the effect of a treatment X on an outcome Y, you want to keep the real causal path (X's arrows flowing forward to Y) open, while blocking every **backdoor path**, a trail that leaks association through an arrow pointing *into* X. The set of variables you condition on to do this is the **adjustment set**.

::widget process-flow {"steps":[{"title":"Draw the DAG","sub":"write down every direct cause you believe in as an arrow"},{"title":"Find the backdoor paths","sub":"every non-causal trail from treatment to outcome that starts with an arrow INTO the treatment"},{"title":"Block them all","sub":"choose variables that close every backdoor while opening no collider"},{"title":"Fit and read off","sub":"regress the outcome on the treatment plus that adjustment set"}]}

This is the **backdoor criterion**: a set of variables Z is a valid adjustment set if it blocks every backdoor path and contains no descendant of X (no mediators, and no colliders on the causal path). Adjust for such a Z and the plain regression coefficient equals the causal effect. In the notation of the *do-operator*, where \(do(X{=}x)\) means "reach in and *set* X to x for everyone, snapping the arrows that point into X" (an intervention, not the mere observation \(P(Y \mid X{=}x)\)):

\[ P\big(Y \mid do(X{=}x)\big) \;=\; \sum_{z} P\big(Y \mid X{=}x,\, Z{=}z\big)\, P(Z{=}z) \]

In words: the effect of *setting* X is the association between X and Y computed *within* each stratum of the adjustment set Z, then averaged over Z. Adjusting for the confounder loyalty is exactly this formula at work, which is why `lm(spend ~ plus + loyalty)` returned the truth.

=== step === concept
::eyebrow In practice
## Let a tool read the adjustment set for you

For Riverside's small diagram you can find the adjustment set by eye: loyalty is the only backdoor, so adjust for loyalty. Real diagrams have dozens of nodes, and finding every backdoor by hand gets error-prone. The professional move is to encode the DAG once and let software return a valid adjustment set. The `dagitty` package does exactly that. It is not part of interactive R, so run this one locally.

```r-static
# Run locally after: install.packages("dagitty")
g <- dagitty::dagitty('dag {
  loyalty -> plus;  loyalty -> spend
  plus -> visits;   visits  -> spend
  plus -> badge;    spend   -> badge
  plus -> spend
}')

# Ask for a set that identifies the effect of plus on spend:
dagitty::adjustmentSets(g, exposure = "plus", outcome = "spend")
#> { loyalty }
```

It returns `{ loyalty }`: adjust for loyalty, and leave visits (a mediator) and badge (a collider) untouched, exactly the reading you now do by hand.

[WARNING]
A DAG is only as good as its arrows, and the arrows are assumptions the data cannot verify for you. Draw them wrong and you will confidently adjust for the wrong thing. Worst of all, if a true confounder is **unmeasured**, no adjustment can close its backdoor: you cannot control for a column you do not have. Honest causal work means arguing for your diagram, and admitting what it rests on.

=== step === quiz
::eyebrow Check yourself
## Good controls and bad controls

A study estimates the effect of a job-training program (the treatment) on later wages (the outcome). Which ONE of these variables should you adjust for?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Prior education, which shapes both who enrolls in the training and later wages ::ok Correct. Prior education is a confounder, a common cause of enrolling and of wages, sitting on the backdoor path training <- education -> wages. Adjusting for it closes that backdoor. It happens before training, so it is neither a mediator nor a collider.
- The number of job interviews the training helped the person land, on the way to a wage ::no That is a mediator (training -> interviews -> wages). Controlling it strips out part of the effect you want, understating the program.
- Whether the person got hired at all, which both the training and high earning potential make more likely ::no That is a collider (a common effect of training and earning potential). Adjusting for it, or studying only the hired, opens a fake path and biases the estimate.

=== step === concept
::eyebrow Go deeper
## References

Four authoritative places to take this further:

- [Pearl and Mackenzie, The Book of Why (2018)](http://bayes.cs.ucla.edu/WHY/) - the accessible introduction to causal diagrams, the do-operator, and why confounders and colliders behave so differently.
- [Hernan and Robins, Causal Inference: What If (free PDF)](https://www.hsph.harvard.edu/miguel-hernan/causal-inference-book/) - Chapters 6 and 7 develop DAGs, backdoor paths, and the backdoor criterion with full rigor.
- [Cinelli, Forney and Pearl (2024), A Crash Course in Good and Bad Controls](https://doi.org/10.1177/00491241221099552) - a clean catalogue of which variables help and which hurt, built entirely on the three shapes you learned here.
- [Textor et al. (2016), the dagitty R package, Int. J. Epidemiology](https://doi.org/10.1093/ije/dyw341) - the tool that finds adjustment sets from a DAG for you; the paper explains the algorithm.

=== step === complete
## Lesson 2 complete

You can now turn a causal question into a diagram and read the answer off it. A DAG is your assumptions drawn as nodes and arrows. Association flows along open paths, and every path is a fork, a chain, or a collider. A confounder (fork) leaks a fake effect through a backdoor, so you adjust for it, and you watched Riverside's inflated $15.43 fall to the true $5.11. A mediator (chain) carries the real effect, so controlling it wrongly erased Plus's $23 down to zero. A collider is silent until you condition on it, and then it invents a link from nothing. The backdoor criterion ties it together: block every backdoor, touch no mediator or collider, and the plain regression coefficient is the causal effect.

Next, Lesson 3: A/B Testing and Experiment Design. When you *can* randomize the treatment, every arrow pointing into it is snapped, so every backdoor path vanishes at once, and the tangle of forks and colliders collapses back to the clean comparison you met in Lesson 1. You will learn to design that experiment and size it so it can actually detect the effect you care about.
