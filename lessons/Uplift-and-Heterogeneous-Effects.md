---
title: "Causal Inference for Decisions Lesson 8: Uplift and Heterogeneous Effects"
description: "A flat average effect hides who a treatment helps and who it hurts. Build a T-learner in R to score per-customer uplift, validate it, and target with a Qini curve."
keywords: "uplift modeling, heterogeneous treatment effects, T-learner, Qini curve, CATE, conditional average treatment effect, causal forest, targeting, sleeping dogs, R"
mathjax: true
webr: true
curriculum_id: "6.180.8"
post_type: "LESSON"
course_id: "ds-causal-decisions"
course_title: "Causal Inference for Decisions"
course_lesson: "8"
course_total: "11"
course_landing: "R-Causal-Decisions-Course.html"
course_next: "Double-Debiased-Machine-Learning.html"
course_prev: "Synthetic-Control.html"
lesson_access: "pro"
catalog_blurb: "Find which customers a treatment helps and which it hurts, then target accordingly."
---

=== step === cover
::eyebrow Lesson 8 of 11
## Uplift and Heterogeneous Effects

In Lesson 7 you measured the effect of a policy on a single treated city, one honest average number. Look back at every method in this course and they all share that goal: matching, weighting, difference-in-differences, instruments, synthetic control, each one hands you **one** number, the average effect across everybody.

But an average can lie by telling the truth. A retention email that lifts renewal by 15 points **on average** can still be helping some customers a lot, doing nothing for others, and actively **pushing a third group out the door**. Send it to everyone and you pay to annoy the very people it hurts. This lesson is about opening up that average: predicting the effect for each customer separately, so you treat the people a policy actually helps and leave the rest alone.

By the end of this lesson you will be able to:

- Explain why one average effect hides who is helped and who is hurt, and name the four customer types
- Build a T-learner in R, one model per treatment arm, to score each customer's individual uplift
- Validate an uplift model even though you can never see any single customer's true effect
- Read a Qini curve to decide how many customers to target, and know why the answer is often not "everyone"

**Prerequisites:** [Lesson 1](Matching-and-the-Propensity-Score.html) (potential outcomes \(Y(1)\) and \(Y(0)\)) and [Lesson 3](Difference-in-Differences-and-Parallel-Trends.html) (why a naive comparison is biased). You can read a `glm(y ~ x, binomial)` fit as "give me the probability," and you know base R subsetting.

::widget uplift-curve {}

=== step === concept
::eyebrow The setup
## One email, one average, 4,000 subscribers

Meet **Nadia**, who runs retention at **Cadence**, a music-streaming service. Every month a batch of subscribers reach their renewal date, and some are wavering. Nadia can send them a "**20% off your next three months, stay with us**" email. She wants one thing: to send it to the customers it helps, and not waste it (or worse) on the rest.

So she ran a clean experiment. She took **4,000** at-risk subscribers and flipped a coin for each one: a random half got the email, the other half got nothing. Then she waited to see who renewed. Because assignment was random, the two halves are comparable, exactly the randomized setup Lesson 1 fought to recover from messy observational data.

Each lesson runs in a fresh R session, so we build Nadia's experiment ourselves. The one feature we track is **engagement**, a standardized score of how much the subscriber used Cadence lately: `0` is a typical user, `+1` a heavy listener, `-1` someone who has barely opened the app. Because the data is simulated, we also know the hidden truth we will spend the lesson recovering: the email's true effect **varies by customer**.

```r
set.seed(5)
n <- 4000
engagement <- runif(n, -1, 1)                 # standardized recent-usage score, -1 (cold) .. +1 (hot)
email      <- rbinom(n, 1, 0.5)               # randomized: 1 = got the retention email, 0 = did not
tau        <- 0.35 * engagement + 0.15        # the HIDDEN true per-customer uplift (we know it; Nadia does not)
renewed    <- rbinom(n, 1, pmin(pmax(plogis(-0.2 + 0.5 * engagement) + email * tau, 0), 1))

head(data.frame(engagement = round(engagement, 2), email, renewed))
#>   engagement email renewed
#> 1      -0.60     1       0
#> 2       0.37     0       1
#> 3       0.83     0       1
#> 4      -0.43     1       1
#> 5      -0.79     1       1
#> 6       0.40     0       0
```

Now the number Nadia would actually report. Because the email was randomized, the honest average effect is just the renewal rate of the emailed group minus the renewal rate of the not-emailed group.

```r
round(c(treated = mean(renewed[email == 1]),
        control = mean(renewed[email == 0])), 3)
#> treated control
#>   0.600   0.452
round(mean(renewed[email == 1]) - mean(renewed[email == 0]), 2)   # the average treatment effect
#> [1] 0.15
```

The email lifts renewal from 45% to 60%, a **+15 point** average effect. A clear win. So send it to everyone?

```r
library(ggplot2)
rates <- data.frame(group = c("No email (control)", "Retention email"),
                    rate  = c(mean(renewed[email == 0]), mean(renewed[email == 1])))
ggplot(rates, aes(group, rate, fill = group)) +
  geom_col(width = 0.6, show.legend = FALSE) +
  geom_text(aes(label = paste0(round(rate * 100), "%")), vjust = -0.4) +
  scale_fill_manual(values = c("grey72", "#1c2c4f")) +
  labs(x = NULL, y = "renewed", title = "The email lifts renewal by about 15 points on average")
```

=== step === concept
::eyebrow The problem
## The +15 average hides who is hurt

That single +15 is a blend. To see what it blends, look at the hidden truth we built into the data. We wrote each customer's true uplift as \(\tau_i = 0.35 \times \text{engagement}_i + 0.15\), so the effect of the email is not one number, it is a **line** that slides with engagement.

First, a name for what we are after. For customer \(i\), imagine both futures: \(Y_i(1)\), whether they renew **if emailed**, and \(Y_i(0)\), whether they renew **if not**. The individual effect is the difference,

\[ \tau_i \;=\; Y_i(1) - Y_i(0). \]

The average of that over everybody is the **ATE** (average treatment effect), \(\text{ATE} = \mathbb{E}[\,Y(1) - Y(0)\,]\), the +0.15 Nadia just reported. What we actually want is the effect **for a given kind of customer**, the CATE (conditional average treatment effect),

\[ \tau(x) \;=\; \mathbb{E}[\,Y(1) - Y(0) \mid X = x\,], \]

read as: the average uplift among customers whose features \(X\) equal \(x\). Plot our known \(\tau(x)\) and the blend falls apart:

```r
truth <- data.frame(engagement, tau)
cut0  <- -0.15 / 0.35                                   # engagement where true uplift crosses zero
ggplot(truth, aes(engagement, tau)) +
  annotate("rect", xmin = -1, xmax = cut0, ymin = -Inf, ymax = 0, fill = "#c0392b", alpha = 0.12) +
  geom_hline(yintercept = 0, colour = "grey55") +
  geom_line(linewidth = 1.2, colour = "#1c2c4f") +
  annotate("text", x = -0.72, y = 0.06, label = "email HURTS\n(sleeping dogs)", size = 3, colour = "#c0392b") +
  labs(x = "engagement (standardized)", y = "true uplift  tau(x)",
       title = "The +0.15 average hides a line from -0.20 (hurt) to +0.50 (helped)")
```

```r
round(c(min_uplift = min(tau), max_uplift = max(tau), share_hurt = mean(tau < 0)), 2)
#> min_uplift max_uplift share_hurt
#>      -0.20       0.50       0.28
```

The email's real effect runs from **-0.20** for the least engaged to **+0.50** for the most, and a full **28%** of customers have a **negative** uplift, the email makes them *less* likely to renew. Marketers have names for the four kinds of customer hiding in that average:

| Type | Would renew without email? | Effect of the email | What to do |
|---|---|---|---|
| **Sure things** | Yes | none, they stay anyway | don't bother |
| **Lost causes** | No | none, they leave anyway | don't bother |
| **Persuadables** | No | positive, the offer tips them to stay | **target these** |
| **Sleeping dogs** | Yes | negative, the reminder makes them cancel | **never contact** |

[KEY INSIGHT]
Here is the catch that makes this hard. For any one customer we only ever see **one** of \(Y_i(1)\) or \(Y_i(0)\), the future that actually happened, never both. So \(\tau_i\) for an individual can **never be measured directly**. This is the fundamental problem of causal inference, and it is why uplift has to be **modelled**, not looked up.

=== step === quiz
::eyebrow Check yourself
## Can you read one customer's effect?

Customer #4 in the data got the email (`email = 1`) and renewed (`renewed = 1`). Nadia asks: "For *this* customer, how much did the email help?" What is the honest answer?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- The uplift is 1: they got the email and renewed, so the email caused the renewal
- The uplift is 0.15, the average effect applies to everyone
- You cannot know it: you see only their emailed outcome, never what they would have done unemailed ::ok Exactly. We observe \(Y_i(1)\) here but never \(Y_i(0)\) for the same person, so \(\tau_i = Y_i(1) - Y_i(0)\) is unknowable at the individual level. The best we can do is estimate the average uplift for customers **like** this one.
- The uplift is 0.60, the treated group's renewal rate ::no 0.60 is the treated group's average renewal, an outcome level, not an effect. An effect is always a difference between two futures, and we only ever see one of them per person.

=== step === concept
::eyebrow The method
## Model each arm, then subtract

We cannot see any customer's two futures, but we can do the next best thing: learn what each future looks like **on average** for a given engagement, and take the difference. That is the **T-learner** (T for "two models"): fit one outcome model on the emailed customers, another on the not-emailed customers, then ask both models to predict every customer's renewal probability and subtract.

Write \(\hat\mu_1(x)\) for the model trained on the emailed arm and \(\hat\mu_0(x)\) for the model trained on the control arm; each predicts a renewal probability at engagement \(x\). The predicted uplift is their gap,

\[ \hat\tau(x) \;=\; \hat\mu_1(x) - \hat\mu_0(x). \]

Because the arm was assigned at random, \(\hat\mu_1\) is an honest picture of "renewal if emailed" and \(\hat\mu_0\) of "renewal if not," so their difference estimates the causal effect rather than some correlation. Here are the two models, one `glm` per arm:

```r
m1 <- glm(renewed ~ engagement, binomial, subset = email == 1)   # the emailed arm:   mu1(x)
m0 <- glm(renewed ~ engagement, binomial, subset = email == 0)   # the control arm:   mu0(x)
rbind(emailed = coef(m1), control = coef(m0))
#>         (Intercept) engagement
#> emailed       0.570      2.611
#> control      -0.204      0.593
```

Notice the `engagement` slope: **2.611** in the emailed model versus **0.593** in the control model. Engagement matters far more when there is an offer on the table, which is exactly the heterogeneity we are trying to capture.

::widget process-flow {"steps":[{"title":"Split by arm","sub":"separate the emailed customers from the not-emailed ones"},{"title":"Model each arm","sub":"fit an outcome model on each group: renewal probability as a function of engagement"},{"title":"Subtract the predictions","sub":"for every customer, predicted renewal if emailed minus if not = predicted uplift"}]}

=== step === tryit
::eyebrow Your turn
## Turn two models into per-customer uplift

The models are fit. The last step of the T-learner is the one that matters: ask **both** models for every customer's renewal probability, then subtract to get each customer's predicted uplift \(\hat\tau(x) = \hat\mu_1(x) - \hat\mu_0(x)\). `predict(model, newdata, type = "response")` returns a probability for each row. Fill in the blank so `uplift` is the emailed prediction minus the control prediction.

```r
p1 <- predict(m1, data.frame(engagement), type = "response")   # renewal probability IF emailed
p0 <- predict(m0, data.frame(engagement), type = "response")   # renewal probability IF NOT emailed
uplift <- p1 ____ p0                                            # each customer's predicted uplift
round(quantile(uplift, c(0, .25, .5, .75, 1)), 2)
```
::check {"regex":"p1\\s*-\\s*p0","gate":true,"difficulty":"intermediate","ok":"Right. p1 - p0 is the T-learner's payoff: two separate models, subtracted per customer. The quantiles run from about -0.20 to +0.37, so the model has learned that some customers are hurt and others strongly helped.","no":"Uplift is renewal-if-emailed minus renewal-if-not. Subtract the control prediction from the emailed one: p1 - p0."}
::solution
```r
p1 <- predict(m1, data.frame(engagement), type = "response")
p0 <- predict(m0, data.frame(engagement), type = "response")
uplift <- p1 - p0
round(quantile(uplift, c(0, .25, .5, .75, 1)), 2)
#>    0%   25%   50%   75%  100%
#> -0.20 -0.05  0.20  0.35  0.37
```

=== step === concept
::eyebrow Does it work?
## A spread of scores, and proof they are real

The T-learner hands every customer a number. Plotting all 4,000 predicted uplifts shows a real spread, not a single value: a chunk of customers sit **left of zero**, flagged as hurt.

```r
uplift <- predict(m1, data.frame(engagement), type = "response") -
          predict(m0, data.frame(engagement), type = "response")
ggplot(data.frame(uplift), aes(uplift)) +
  geom_histogram(bins = 30, fill = "#1c2c4f") +
  geom_vline(xintercept = 0, colour = "#c0392b", linetype = "dashed") +
  labs(x = "predicted uplift", y = "customers",
       title = "The model spreads customers from hurt (left of 0) to strongly helped")
```

But a spread of predictions is worthless if the predictions are wrong, and we just spent a whole step arguing that no customer's true uplift is observable. So how do you check a model whose target you can never see? With a clever move: **group, then compare**. Sort customers into four bins by their *predicted* uplift. Inside each bin, the email was still randomized, so the treated-minus-control renewal difference is an honest estimate of that bin's **actual** average uplift, no model needed for the check. Formally, within any group \(g\),

\[ \underbrace{\mathbb{E}[Y \mid T = 1, g] - \mathbb{E}[Y \mid T = 0, g]}_{\text{observed, from randomization}} \;=\; \underbrace{\mathbb{E}[\tau \mid g]}_{\text{the group's true uplift}}. \]

If the model ranks customers well, this observed difference should **climb** from the lowest predicted-uplift bin to the highest.

```r
q <- cut(uplift, quantile(uplift, 0:4/4), labels = 1:4, include.lowest = TRUE)   # quartiles of predicted uplift
val <- sapply(1:4, function(g) mean(renewed[q == g & email == 1]) -
                                mean(renewed[q == g & email == 0]))              # actual uplift per bin
round(val, 2)
#> [1] -0.09  0.02  0.26  0.39
```

```r
ggplot(data.frame(quartile = factor(1:4), actual = val), aes(quartile, actual)) +
  geom_hline(yintercept = 0, colour = "grey55") +
  geom_col(width = 0.65, fill = "#1c2c4f") +
  geom_text(aes(label = round(actual, 2)), vjust = ifelse(val < 0, 1.3, -0.4)) +
  labs(x = "predicted-uplift quartile (1 = lowest)", y = "actual treated - control renewal",
       title = "Actual uplift climbs across the quartiles the model predicted")
```

It works. The bottom quartile's true uplift is **-0.09** (these customers are hurt), and it rises to **+0.39** at the top. The model found the sleeping dogs and the persuadables, using data that never once revealed a single customer's individual effect.

=== step === quiz
::eyebrow Check yourself
## Why the quartile check is fair

In the top quartile, emailed customers renewed 39 points more than un-emailed ones, and we called that an honest estimate of the quartile's true uplift, even though no individual's uplift is observable. What makes that estimate trustworthy?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The T-learner is accurate, so its predictions can be trusted directly
- The email was randomized, so within the quartile the treated and control customers are comparable, and their renewal gap estimates the group's average effect ::ok Exactly. Sorting by predicted uplift does not break randomization *within* a bin, so treated and control there are still like-for-like. Their observed difference is a clean estimate of that group's true average uplift, no counterfactual needed.
- The quartile has 1,000 customers, and any large sample gives the right answer
- Uplift is defined as treated minus control, so the two must agree by definition ::no The predicted uplift (from the models) and the observed group difference are computed in completely different ways. That they line up is evidence the model ranks customers correctly, not a definition.

=== step === concept
::eyebrow The payoff
## Target by uplift, and stop before the sleeping dogs

Now the decision Nadia actually faces: given a score per customer, **who gets the email?** Rank everyone from most-helped to least, treat from the top down, and track the cumulative extra renewals you win. That running total is the **Qini curve**, the uplift cousin of a lift chart. Toggle the widget below between **Uplift model** and **Random targeting**: ordering by predicted uplift bends the curve well above the random diagonal, the same email budget saves far more subscribers.

We can build the Qini in a few lines of base R. At each depth it compares renewals among the treated we have reached to the control renewal rate, scaled to the same headcount:

```r
ord  <- order(uplift, decreasing = TRUE)                 # customers, most-helped first
o    <- data.frame(email = email[ord], renewed = renewed[ord])
Nt <- cumsum(o$email); Nc <- cumsum(1 - o$email)                          # treated / control reached so far
Yt <- cumsum(o$renewed * o$email); Yc <- cumsum(o$renewed * (1 - o$email))
qini <- Yt - Yc * ifelse(Nc > 0, Nt / Nc, 0)             # extra renewals vs the control rate at each depth
frac <- (1:n) / n
round(c(peak_fraction      = frac[which.max(qini)],      # target down to here, then stop
        peak_incremental   = max(qini),                  # renewals saved at the peak
        if_target_everyone = qini[n]), 2)                # fewer, because the tail is sleeping dogs
#> peak_fraction  peak_incremental if_target_everyone
#>          0.82            348.32             290.76
```

The curve **peaks at 82%** of the list and then falls. Emailing everyone would save about **291** subscribers; stopping at the top 82% saves **348**. Those last 18% are the sleeping dogs: contacting them costs you renewals. The Qini curve turns "who is helped" into a concrete budget: treat down to the peak, no further.

Now the fine print, because uplift is easy to get wrong:

- **Randomization is the price of entry.** Our clean subtraction worked because the arm was assigned at random. On observational data, uplift inherits every confounding trap from Lessons 1 to 6, you would first need matching, weighting, or an instrument to earn the comparison.
- **You validate by group, never by individual.** The quartile check is the strongest honesty test available, but it can only confirm the *ranking*, no method reveals a single customer's \(\tau_i\).
- **A difference of two models is fragile.** Subtracting \(\hat\mu_1\) and \(\hat\mu_0\) can amplify the noise in each. In production you would reach for a method that targets the uplift directly, like a **causal forest**, which grows trees to split on effect heterogeneity itself.

```r-static
# The production tool (run this locally): install.packages("grf")
library(grf)
X  <- matrix(engagement, ncol = 1)
cf <- causal_forest(X = X, Y = renewed, W = email)   # honest trees that split on the EFFECT
tau_hat <- predict(cf)$predictions                   # per-customer uplift, out-of-bag
average_treatment_effect(cf)                          # the ATE, plus targeting via rank(tau_hat)
```

Same idea you built by hand, one sturdier estimator. Building the T-learner from scratch is how you know what a causal forest is doing under the hood, and when to trust its scores.

::widget uplift-curve {}

=== step === quiz
::eyebrow Check yourself
## Should Nadia email the whole list?

The average treatment effect was a healthy **+0.15**, and the offer costs Cadence very little. A colleague argues: "The average is clearly positive, so send the retention email to every at-risk subscriber." Using what the uplift model found, what is the right call?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- No: the bottom quartile has negative uplift and the Qini curve peaks around 82%, so emailing the whole list destroys value on the sleeping dogs ::ok Right. A positive *average* does not mean a positive effect for *everyone*. The model located a group the email actively hurts; targeting down to the Qini peak captures more renewals than blasting all 4,000.
- Yes: a positive average effect means every customer benefits at least a little
- Yes: the offer is cheap, so any customer who might renew is worth emailing
- It cannot be decided without running a second experiment ::no The one randomized experiment already carries the answer. The predicted-uplift quartiles and the Qini curve, both validated on this data, are enough to see that full-list targeting is worse than targeting the top.

=== step === concept
::eyebrow Go deeper
## References

Five solid places to take uplift and heterogeneous effects further:

- [Athey and Imbens (2016), Recursive Partitioning for Heterogeneous Causal Effects (PNAS)](https://doi.org/10.1073/pnas.1510489113) - the "causal tree" idea behind honest splitting on treatment effects.
- [Wager and Athey (2018), Estimation and Inference of Heterogeneous Treatment Effects using Random Forests (JASA)](https://doi.org/10.1080/01621459.2017.1319839) - the causal forest, with confidence intervals for \(\tau(x)\).
- [Kunzel, Sekhon, Bickel and Yu (2019), Metalearners for estimating heterogeneous treatment effects (PNAS)](https://doi.org/10.1073/pnas.1804597116) - the S-, T-, and X-learner framework the T-learner here comes from.
- [grf: Generalized Random Forests (CRAN)](https://cran.r-project.org/package=grf) - the production R package: causal forests, `average_treatment_effect`, and targeting.
- [Gutierrez and Gerardy (2017), Causal Inference and Uplift Modelling: A Review](https://proceedings.mlr.press/v67/gutierrez17a.html) - a readable survey of uplift methods and the Qini metric.

=== step === complete
## Lesson 8 complete

You cracked open the average. A retention email with a healthy **+0.15** average effect turned out to help engaged subscribers by up to **+0.50** and **hurt** the least engaged by **-0.20**, with 28% of customers made *less* likely to renew. Because no single customer's true effect is ever observable, you estimated it with a **T-learner**, one `glm` per arm, subtracted per customer, and then, cleverly, validated the scores without ever seeing the truth: within randomized predicted-uplift quartiles the actual uplift climbed from **-0.09** to **+0.39**. Finally the **Qini curve** turned those scores into a decision, target the top **82%** and stop before the sleeping dogs, beating a full-list blast. The lesson underneath: one number is a policy for the average person, and the average person may not exist.

Next, Lesson 9: Double/Debiased Machine Learning. The T-learner leaned on a simple `glm`; what if you want the flexibility of modern machine learning for the nuisance pieces without letting its bias leak into your effect estimate? You will use cross-fitting and orthogonal scores to get the best of both.
