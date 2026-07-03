---
title: "Survival Analysis Lesson 1: Survival Data and Censoring"
catalog_blurb: "What censored follow-up data really says, and why ordinary averages get it wrong."
description: "Learn what makes time-to-event data special: right-censoring, the survival function S(t), the hazard, and why ordinary regression fails on censored follow-up."
keywords: "survival analysis, censoring, right censoring, time-to-event data, survival function, hazard rate, median survival, survival package, Surv object, censored data in R"
post_type: "LESSON"
curriculum_id: "6.150.1"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-survival"
course_title: "Survival Analysis"
course_lesson: "1"
course_total: "7"
course_landing: "R-Survival-Analysis-Course.html"
course_next: "Kaplan-Meier-and-the-Log-Rank-Test.html"
course_prev: ""
---

=== step === cover
::eyebrow Lesson 1 of 7
## Survival Data and Censoring

You have modeled numbers with regression and categories with classification. This course is about a third kind of outcome: how long until something happens.

Dr. Meera Rao has spent two years testing a new heart-failure drug. She enrolled 30 patients, 15 on the standard drug and 15 on the new one (each group is called an **arm** of the trial), and followed every patient for up to 24 months, recording the months from enrollment to death. The chart below summarizes her trial: each curve tracks the fraction of an arm still alive, month by month, and the small vertical ticks mark patients who slipped out of view while still alive. Those ticks, the patients whose story has no ending, are what this lesson is about.

By the end of this lesson you will be able to:

- Say exactly what a censored row of data does and does not tell you
- Show, with real numbers, why dropping censored patients or counting them as deaths biases results low, and why ordinary regression inherits the same problem
- Encode follow-up times and event indicators as a survival outcome in R
- Read a survival curve S(t), find its median, and connect it to the hazard

**Prerequisites:** you can fit and read a simple regression, you know probability as a long-run fraction, and you can work with a data frame in R.

::widget km-curve {}

=== step === concept
::eyebrow The setting
## The outcome is a waiting time

Take one of Dr. Rao's patients: Bhavna enrolled on 3 March, started the standard drug that day, and died 3.2 months later. Her outcome is not a category and not an ordinary measurement. It is a **waiting time**: the length of the gap between a defined starting point and a defined event.

Every time-to-event question has the same three ingredients:

- a **time origin**: the moment the clock starts (here, the day a patient enrolls)
- a **time scale**: the units the clock counts (here, months since enrollment)
- an **event**: the thing that stops the clock (here, death)

Swap the ingredients and the same machinery answers very different questions: months until a subscriber cancels, hours until a compressor fails, days until a loan defaults. Medicine named the field, so the outcome is called **survival time** even when nothing is alive.

Here are 10 of Dr. Rao's standard-arm patients. Each lesson runs in a fresh interactive R session, so we build the data right here (run this first):

```r
trial <- data.frame(
  patient = c("Arun", "Bhavna", "Chitra", "Devan", "Esha",
              "Farid", "Gita", "Hari", "Indu", "Joseph"),
  months  = c(18, 3.2, 11.5, 24, 6.1, 9.4, 15.8, 2.7, 24, 12.6),
  status  = c(0, 1, 1, 0, 1, 0, 1, 1, 0, 1)
)
trial
#>    patient months status
#> 1     Arun   18.0      0
#> 2   Bhavna    3.2      1
#> 3   Chitra   11.5      1
#> 4    Devan   24.0      0
#> 5     Esha    6.1      1
#> 6    Farid    9.4      0
#> 7     Gita   15.8      1
#> 8     Hari    2.7      1
#> 9    Indu   24.0      0
#> 10  Joseph   12.6      1
```

The `months` column records how long Dr. Rao watched each patient. The `status` column is the twist this whole lesson is about. Hold that thought for one step.

=== step === concept
::eyebrow The twist
## Still alive at last contact: right-censoring

Look at Arun, the first row. He enrolled six months after the trial opened, came to every check-up, and was still alive when the study closed, 18 months into his follow-up. So what is Arun's survival time? **Nobody knows.** All Dr. Rao knows is that it is longer than 18 months. His `status` of 0 records exactly that: the clock was still running when we stopped watching.

This is **right-censoring**: follow-up ends before the event happens, so the true survival time is hidden somewhere to the right of the last time we looked. It happens for mundane reasons:

- **The study ends.** Devan and Indu enrolled on day one, reached the 24-month close alive, and were censored at 24. This is called administrative censoring.
- **The patient drops out of view.** Farid moved to another city after 9.4 months and stopped coming to check-ups. He was alive at last contact, so he is censored at 9.4. This is loss to follow-up.

Here is the standard notation, worth reading slowly. Each patient has a true survival time \(T\) (the months from enrollment to death, which we may never see) and a censoring time \(C\) (the months until we would lose sight of them, because the study closes or they move away). What the study actually records is the smaller of the two, \(Y = \min(T, C)\), together with an **event indicator** \(\delta\) (the Greek letter delta): \(\delta = 1\) when the death was observed (\(T \le C\)) and \(\delta = 0\) when the patient was censored first. Our `months` column is \(Y\) and `status` is \(\delta\).

You can see the whole table at a glance by drawing each patient's follow-up as a line: a filled dot is a death Dr. Rao observed, a cross is a patient last seen alive.

```r
library(ggplot2)

trial$outcome <- ifelse(trial$status == 1, "died", "still alive at last contact")
trial$patient <- reorder(trial$patient, trial$months)

ggplot(trial, aes(x = months, y = patient)) +
  geom_segment(aes(xend = 0, yend = patient), linewidth = 0.6, colour = "grey60") +
  geom_point(aes(shape = outcome, colour = outcome), size = 3, stroke = 1.2) +
  scale_shape_manual(values = c("died" = 16, "still alive at last contact" = 4)) +
  labs(x = "months of follow-up since enrollment", y = NULL,
       title = "What Dr. Rao actually observed")
```

[KEY INSIGHT]
A censored row is not missing data. Arun's row proves he survived at least 18 months, and that "at least" is real, usable information. The entire survival toolkit exists to use it honestly instead of throwing it away or pretending it is exact.

=== step === quiz
::eyebrow Check yourself
## What do we know about Arun?

Arun was still alive when the study closed, 18 months after he enrolled. His row reads `months = 18, status = 0`. What does that row tell Dr. Rao about his survival time?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Only that his survival time is longer than 18 months. The 18 is a floor, not his time of death ::ok Right. Arun was alive at last contact, so his row carries the partial but real information that T is greater than 18. Every method in this course is built to use that floor honestly.
- His survival time is 18 months, so we can use 18 as his time of death ::no That invents a death that never happened. Arun was alive at month 18. Writing 18 down as a death time systematically shortens survival, and the next step shows by how much.
- His outcome is missing, so the honest fix is to drop his row ::no Partial is not missing. His row proves he survived at least 18 months, and dropping survivors like him keeps mostly the early deaths, which biases every estimate low.

=== step === concept
::eyebrow Why it matters
## Two tempting shortcuts, both wrong

Suppose Dr. Rao wants something simple: the average survival time on the standard drug. Her table has censored rows in it, and two shortcuts suggest themselves. Shortcut 1: drop the censored patients and average the deaths she actually saw. Shortcut 2: keep every row and average the `months` column as if each number were a death time.

Let's test both on data where we know the truth. That is the one thing a simulation buys us: we generate every patient's true time of death, then hide some behind censoring, exactly what a real study does to you.

```r
set.seed(15)
n <- 200
true_t <- rexp(n, rate = 0.08)          # every true time to death (we know it!)
cens_t <- runif(n, 0, 24)               # when the study would lose sight of each patient
months <- pmin(true_t, cens_t)          # what a real study records
status <- as.integer(true_t <= cens_t)  # 1 = death observed, 0 = censored

table(status)
#> status
#>   0   1
#>  77 123

round(mean(true_t), 1)                  # the truth a real study never sees
#> [1] 11.7
round(mean(months[status == 1]), 1)     # shortcut 1: average only the observed deaths
#> [1] 6.1
round(mean(months), 1)                  # shortcut 2: treat every time as a death time
#> [1] 7
```

The true average is 11.7 months. Shortcut 1 says 6.1 and shortcut 2 says 7. Both nearly halve it, and each for its own reason:

- **Dropping censored rows** keeps the early deaths and discards the long survivors. Long times get censored more often (a patient who lives a long time gives the study more chances to lose them), so what remains is a sample tilted toward quick deaths.
- **Counting censored times as deaths** turns "Farid survived at least 9.4 months" into "Farid died at 9.4 months". Every one of those substitutions is an underestimate, and they all push the same direction.

[WARNING]
Neither error washes out with more data. Collect 10,000 patients instead of 200 and each shortcut lands just as far from the truth, only more precisely wrong. This is bias, not noise.

And ordinary regression? Least squares needs one exact outcome value per row, so feeding it the `months` column is shortcut 2 in disguise. There is simply no way to type "at least 18" into a plain numeric response. Handling that "at least" takes a different encoding of the outcome, which is the very next step.

=== step === quiz
::eyebrow Check yourself
## Can regression just power through?

You regress `months` on treatment arm with ordinary least squares, using all 200 simulated rows, censored ones included. What actually happens?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Every censored time enters the fit as if it were a death time, so the model systematically underestimates survival. It is shortcut 2 wearing a formula ::ok Right. Least squares needs one exact outcome per row, so a floor like "18 or more" silently becomes the value 18. All those substitutions point the same way, and the bias does not shrink with more data.
- Censored rows are just noisy measurements of the death time, and with 200 rows the noise averages out ::no Censoring is not noise. Noise scatters symmetrically around the truth; a censored value always sits BELOW the true time, so the errors all point one way and averaging cannot cancel them.
- Dropping the censored rows first makes the regression valid ::no That is shortcut 1: keeping only observed deaths discards the long survivors. In our simulation that estimate came out at 6.1 months against a truth of 11.7.

=== step === tryit
::eyebrow In R
## The Surv object: how R writes "at least"

The fix starts with the outcome itself. The `survival` package (it ships with R) bundles the two columns, time and event indicator, into a single outcome object built by `Surv()`. Run it on Dr. Rao's ten patients:

```r
library(survival)

response <- Surv(time = trial$months, event = trial$status)
response
#>  [1] 18.0+  3.2  11.5  24.0+  6.1   9.4+ 15.8   2.7  24.0+ 12.6
```

Read Arun's entry: `18.0+`. The plus sign is R's notation for "at least": a survival time known only to exceed 18. Exact death times print plain. This object is what goes on the left-hand side of every model formula in this course, so the model always knows which numbers are floors and which are facts.

Now encode two patients yourself. Ask of each one: did we see the event happen?

```r
# Arun was still alive at his last contact, 18 months in.
# Chitra died 11.5 months after enrolling.
# Fill in the two event codes (1 = death observed, 0 = censored):
Surv(time = c(18, 11.5), event = c(____, ____))
```
::check {"regex":"c\\(\\s*0\\s*,\\s*1\\s*\\)","gate":true,"difficulty":"intermediate","ok":"Arun gets 0: his 18 is a floor, and it prints as 18+. Chitra gets 1: her death was observed at 11.5.","no":"Ask of each patient: did we see the event happen? Arun was alive at last contact, so his code is 0 (censored). Chitra died on study, so hers is 1."}
::solution
```r
Surv(time = c(18, 11.5), event = c(0, 1))
#> [1] 18.0+ 11.5
```

=== step === concept
::eyebrow The main object
## The survival function S(t)

With the outcome encoded honestly, what should Dr. Rao estimate? Not a single average. The natural summary of a waiting time is a whole curve: the **survival function**

\[ S(t) = P(T > t), \]

the probability that a patient's survival time \(T\) is longer than \(t\). In words: pick a patient at random from an arm; \(S(12)\) is the chance they are still alive 12 months after enrolling.

Three things are always true of this curve, whatever the data:

- \(S(0) = 1\): everyone is alive the moment their clock starts.
- It never rises: as \(t\) grows, the group still alive can only shrink or hold.
- The **median survival** is the time where the curve crosses 0.5, the point by which half the arm has died. It is the standard one-number summary of a survival curve.

Now look again at the chart from the cover, this time knowing how to read it. The vertical axis is \(S(t)\). The dashed line marks 50 percent. The standard arm's curve crosses it around 6 months; the new drug's curve around 13.5 months. And the little ticks are the Aruns: censored patients, sitting on the curve without pulling it down.

::widget km-curve {}

How those censored ticks are handled, giving each patient credit for every month they were seen alive and no more, is exactly what the Kaplan-Meier estimator does, and it is the whole of Lesson 2. One more reading note: the standard summary is the median, not the mean, because survival times are stretched to the right by long survivors, and with open-ended censored times like `24+` in the data the mean may not even be computable within the study window. The median sits right there on the curve.

=== step === concept
::eyebrow The second lens
## The hazard: the risk of the moment

\(S(t)\) answers "how many are still standing at time \(t\)". Survival analysis leans just as heavily on a second lens. Of the patients who have made it to month \(t\), how fast are they dying right now? That instantaneous rate is the **hazard**, written \(h(t)\).

You already have an intuition for it from ordinary life: the chance a 25-year-old dies this year is tiny; for a 90-year-old it is large. That is a statement about the risk faced by people who are still alive at each age, and it changes with age. Formally,

\[ h(t) = \lim_{\Delta t \to 0} \; \frac{P(t \le T < t + \Delta t \mid T \ge t)}{\Delta t}. \]

Read it piece by piece: the vertical bar means "given", so the numerator is the probability the death lands in the next little window of width \(\Delta t\), given the patient is still alive at \(t\). Dividing by \(\Delta t\) and letting the window shrink to nothing turns that into a rate per month, like a speedometer reading for risk. A hazard is a rate, not a probability, so it can exceed 1.

The two lenses are locked together: accumulate the hazard and you get survival back,

\[ S(t) = \exp\!\left(-\int_0^t h(u)\, du\right), \]

where the integral simply adds up the risk of every instant from 0 to \(t\), and \(\exp\) is the exponential function, e raised to a power. High hazard early makes the curve dive early; low steady hazard makes a long, gentle slide.

The simplest possible case makes this concrete: a **constant** hazard. Suppose the standard drug leaves patients with \(h = 0.12\) deaths per person-month while the new drug cuts it to 0.06. Then \(S(t) = e^{-ht}\), and you can draw both curves and solve for their medians. Setting \(e^{-ht} = 0.5\) gives \(t = \log(2)/h\), where \(\log\) is the natural logarithm and \(\log(2) \approx 0.69\):

```r
curve(exp(-0.12 * x), from = 0, to = 24, ylim = c(0, 1),
      xlab = "months since enrollment", ylab = "S(t)",
      col = "firebrick", lwd = 2)
curve(exp(-0.06 * x), add = TRUE, col = "navy", lwd = 2)
abline(h = 0.5, lty = 2)
legend("topright", c("hazard 0.12 per month (standard)", "hazard 0.06 per month (new)"),
       col = c("firebrick", "navy"), lwd = 2, bty = "n")

# median survival: solve exp(-h * t) = 0.5, so t = log(2) / h
round(log(2) / c(standard = 0.12, new = 0.06), 1)
#> standard      new
#>      5.8     11.6
```

Those medians, 5.8 and 11.6 months, land close to the 6 and 13.5 you read off Dr. Rao's chart: her arms behave roughly like constant hazards of 0.12 and 0.06. Notice the clean structure: halve the hazard and you double the median. Comparing two arms through the ratio of their hazards is the core idea behind the Cox model in Lesson 3.

[NOTE]
Real hazards are rarely constant. Risk after heart surgery is highest in the first weeks and then falls; a machine part fails rarely for years and then wears out; human mortality does both, high in infancy, low for decades, rising in old age. Assume the wrong shape and every estimate inherits the error. That is why the workhorse estimator you meet next assumes no shape at all.

=== step === quiz
::eyebrow Check yourself
## Put the two lenses together

Take the new drug's hazard as roughly constant at 0.06 per month. Then \(S(12) = e^{-0.06 \times 12} = e^{-0.72}\), which is about 0.49. Which reading is correct?

::quiz {"correct":1,"gate":true,"difficulty":"advanced"}
- A new-drug patient has about a 49 percent chance of living longer than 12 months, so 12 months is close to the median survival on that arm ::ok Exactly. S(t) is the probability of surviving PAST t, and the curve crossing 0.5 marks the median: log(2)/0.06 is about 11.6 months, so month 12 sits just past it.
- There is about a 49 percent chance a new-drug patient is dead by month 12 ::no That is the classic inversion. S(12) is the chance of still being ALIVE at month 12. The chance of dying by then is 1 minus 0.49, about 51 percent.
- The average new-drug patient survives 12 months ::no The 0.5 crossing is the median, not the mean. Survival times are stretched right by long survivors; for this constant hazard the mean is 1/0.06, nearly 17 months, well above the median.

=== step === concept
::eyebrow Go deeper
## References

Four solid places to take this further:

- [The survival package vignette (Therneau, CRAN)](https://cran.r-project.org/web/packages/survival/vignettes/survival.pdf) - the canonical R reference; its opening sections cover exactly the Surv objects and censored data you met here.
- [An Introduction to Statistical Learning, ch. 11 (free PDF)](https://www.statlearning.com/) - a gentle, complete chapter on survival analysis and censored data.
- [Clark, Bradburn, Love and Altman (2003), Survival Analysis Part I, British Journal of Cancer](https://doi.org/10.1038/sj.bjc.6601118) - the classic clinician-friendly introduction to censoring, S(t) and the hazard, with real trial examples.
- [Moore, Applied Survival Analysis Using R (Springer)](https://link.springer.com/book/10.1007/978-3-319-31245-3) - a book-length treatment where every idea arrives with R code.

One honest scope note: this lesson covered right-censoring, by far the most common kind. Data can also be left-censored (the event happened before observation began) or interval-censored (it happened between two check-ups); the references above cover both.

And one assumption hides inside everything you just learned: every method in this course treats censoring as unrelated to a patient's risk. Farid moving to another city is harmless, because his move tells us nothing about his heart. But if patients quietly stop coming to check-ups because they are getting sicker, the censored rows are hiding the worst outcomes, and no formula can detect that from the data alone. So carry one question into every survival analysis you ever read: why were these patients censored?

=== step === complete
## Lesson 1 complete

You now know what makes time-to-event data its own subject. A censored row like Arun's `18+` is a floor, not a value and not a gap; dropping such rows or treating them as deaths biases everything low (11.7 became 6.1 and 7 in our simulation); `Surv()` encodes the floor so models can respect it; and the two central objects are the survival curve \(S(t) = P(T > t)\), read at its median, and the hazard \(h(t)\), the risk of the moment among those still standing.

Next, Lesson 2: Kaplan-Meier and the log-rank test. You will build the estimator that turns a censored table like Dr. Rao's into the survival curves on the cover, one at-risk set at a time, and then test whether the gap between two arms is real.
