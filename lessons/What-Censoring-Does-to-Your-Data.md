---
title: "Survival and Event History Analysis Lesson 1: What censoring does to your data"
catalog_blurb: "Why dropping or capping unfinished subscribers both get the average time wrong."
description: "Maya's fitness app follows 24 subscribers for 12 months. Nine have not cancelled by the end, and both naive averages of the time to cancel come out badly wrong."
keywords: "right-censoring, censoring, survival analysis, survival function, hazard function, time-to-event data, R"
post_type: "LESSON"
curriculum_id: "4.140.1"
webr: true
mathjax: true
lesson_access: "free"
course_id: "res-survival"
course_title: "Survival and Event History Analysis"
course_lesson: "1"
course_total: "8"
course_landing: "Survival-and-Event-History-Analysis-Course.html"
course_next: "Kaplan-Meier-Curves-and-the-Log-Rank-Test"
course_prev: ""
---

=== step === cover
## What censoring does to your data

Today let's understand what censoring means in data, and why it quietly ruins an ordinary average if you do not know it is there.

Maya runs Pulse, a fitness app that sells a monthly subscription. She wants to know one thing: how many months does a subscriber typically stay before cancelling? So she picks 24 subscribers who all signed up on the same day, and follows every one of them for a fixed 12-month window, writing down the month each one cancels.

By month 12, 15 of them have cancelled, each on a known month. The other 9 are still subscribed. Maya does not know when, or even if, those 9 will ever cancel. All she knows is that each of them has lasted at least 12 months so far.

Here is what she has on record for all 24 subscribers.

::widget styled-table {"cols": ["subscriber", "status", "month"], "rows": [[1,"cancelled",4],[2,"cancelled",12],[3,"cancelled",5],[4,"cancelled",1],[5,"cancelled",9],[6,"still subscribed","12+"],[7,"cancelled",6],[8,"cancelled",7],[9,"still subscribed","12+"],[10,"still subscribed","12+"],[11,"still subscribed","12+"],[12,"still subscribed","12+"],[13,"cancelled",2],[14,"cancelled",1],[15,"still subscribed","12+"],[16,"cancelled",6],[17,"cancelled",9],[18,"cancelled",11],[19,"still subscribed","12+"],[20,"cancelled",7],[21,"still subscribed","12+"],[22,"cancelled",12],[23,"still subscribed","12+"],[24,"cancelled",4]], "title": "The 24 Pulse subscribers at month 12", "note": "Cancelled rows show the month it happened. Still subscribed rows show 12+, since all we know is that they lasted at least 12 months."}

Look at that table. Fifteen rows have a clean number for month. Nine do not, they just say 12+. So what is the average time to cancel, when 9 of your 24 numbers are not finished yet?

=== step === concept
## Averaging only the subscribers who already cancelled

The simplest thing to try is to just use the subscribers whose story is finished. Keep only the 15 subscribers who have a real cancellation month on record, drop the 9 who are still subscribed, and average what is left.

```r
# Average the month among the subscribers who already cancelled
set.seed(42)
true_month <- round(rexp(24, rate = 1 / 18))
true_month[true_month == 0] <- 1
cutoff <- 12
month <- pmin(true_month, cutoff)
status <- as.integer(true_month <= cutoff)
pulse <- data.frame(subscriber = 1:24, month = month, status = status)

cancelled <- pulse[pulse$status == 1, ]
nrow(cancelled)
#> [1] 15
mean(cancelled$month)
#> [1] 6.4
```

`pulse` holds all 24 subscribers: `month` is the number Maya actually recorded for each one, and `status` is 1 if that number is a real cancellation and 0 if the subscriber is still subscribed. Filtering to `status == 1` keeps exactly the 15 subscribers who already have a real cancellation month, and their average month is 6.4.

That is Maya's first guess: subscribers cancel after about 6.4 months, on average. It only uses the 15 subscribers with a finished number, and it says nothing at all about the other 9.

=== step === concept
## Treating month 12 as everyone's cancellation month

A different fix keeps all 24 subscribers instead of dropping any of them. For the 9 who are still subscribed, this fix treats month 12, the last month Maya actually watched them, as if it were their cancellation month.

Pulse's own `month` column already does exactly that. For the 9 still-subscribed subscribers, Maya cannot write down a cancellation month that has not happened yet, so the only honest number she has on record for them is 12, the length of time she has watched them so far. This keeps those exact same `month` numbers, just without dropping any of the 24 rows this time.

```r
# Average the recorded month over all 24 subscribers, censored ones included
nrow(pulse)
#> [1] 24
mean(pulse$month)
#> [1] 8.5
```

All 24 subscribers average out to 8.5 months. That is Maya's second guess, higher than the first one, because it keeps all 24 numbers instead of throwing 9 of them away.

=== step === widget
## Comparing both guesses against the real average

This dataset happens to be simulated for this lesson, which means there is a number Maya herself could never see: the true cancellation month for every subscriber, including the 9 who are still subscribed in her own records. Averaged over all 24 true cancellation months, the real answer is about 18.6 months.

Here is how Maya's two guesses stack up against that real number.

::widget chart-plotter {"data":[{"x":"Drop the 9","y":6.4},{"x":"Cap at month 12","y":8.5},{"x":"True average","y":18.6}],"geoms":["bar"],"x":"method","y":"average_month"}

Both guesses land far below 18.6, but not by the same amount. Dropping the 9 still-subscribed subscribers removes exactly the 9 subscribers who, it turns out, last the longest of all 24. Every one of their true cancellation months falls past month 12, which is longer than any of the 15 who already cancelled. Capping them at month 12 is closer to the truth, 8.5 against 6.4, because it still counts all 9 of them, it just understates how long each one actually lasts.

=== step === quiz
## Quick check: why both averages come out too low

Which of these correctly explains why dropping the 9 still-subscribed subscribers (6.4) comes out worse than capping them at month 12 (8.5)?

::quiz {"correct": 1, "gate": true, "difficulty": "beginner"}
- Dropping the 9 still-subscribed subscribers removes them from the average entirely, while capping their month at 12 still counts them, just at a number that is too low. ::ok Right. Dropping them throws away the 9 subscribers who, it turns out, lasted the longest. Capping them at 12 keeps all 24 rows, it just understates how long those 9 will actually last, which is why 8.5 lands closer to 18.6 than 6.4 does.
- Method A, dropping the 9, just used a smaller sample, so it is only less precise, not biased. ::no
- Capping at month 12 is the real mistake here. Dropping the still-subscribed subscribers is fine, since their data is incomplete anyway. ::no Both guesses are biased, not just one. Dropping the 9 removes exactly the subscribers who lasted the longest, which pulls the average down hard. Capping them at 12 is also wrong, just less so, because it still counts them, only at too low a number. A smaller sample on its own would not push an average in one direction, but removing the longest-lasting rows does exactly that.

=== step === concept
## Censoring is partial information, not missing data

Those 9 still-subscribed subscribers have a name for what is happening with their data. They are called right-censored. Right-censoring means you know a subscriber lasted at least some known length of time, but you do not know exactly when, or whether, the event will happen. It is called right-censoring because the part you are missing sits to the right of what you observed, further along in time, past the point where Maya stopped watching.

[KEY INSIGHT]
A right-censored row is not an unknown value waiting to be filled in. Subscriber 6's row says "still subscribed, 12+", and that is a true fact: subscriber 6's real cancellation month is at least 12. The only thing missing is whether it is 13, 40, or never. That is a very different, much smaller gap than knowing nothing at all.

Compare that to a genuinely missing value. Suppose Maya's spreadsheet had a blank cell for subscriber 6's month, because someone forgot to type it in, even though subscriber 6 had actually cancelled back in month 5. That blank cell would tell you nothing: no real fact, no lower bound, nothing to work with. Right-censoring is not that, since every one of the 9 censored rows already holds one true, usable fact.

That is exactly why both of Maya's guesses went wrong. Dropping a right-censored row throws away a true fact you already have. Capping it at 12 throws away the other half of that fact, that the real number is even bigger than 12. The right way to use a right-censored row is to use the one fact it actually gives you, "at least this long", not to erase it or round it down to the cutoff.

=== step === concept
## The survival function: how many are still subscribed at month t

Now put a name to the question this whole lesson has been circling: at any given month, what fraction of the original 24 subscribers are still subscribed? That fraction is called the survival function, written \(S(t)\), the fraction of the original 24 who have not cancelled by month \(t\).

You can compute \(S(t)\) directly from the 24 rows, without touching the hidden true cancellation months that Maya herself can never see. At month 0, nobody has cancelled yet, so \(S(0) = 1\). By month 3, 3 subscribers have cancelled (months 1, 1 and 2), leaving 21 of 24 still subscribed, so \(S(3) = 21/24 \approx 0.875\). By month 6, 8 have cancelled (add months 4, 4, 5, 6 and 6), leaving 16 of 24, so \(S(6) = 16/24 \approx 0.667\). By month 9, 12 have cancelled (add 7, 7, 9 and 9), leaving 12 of 24, so \(S(9) = 12/24 = 0.5\). And by month 12, all 15 eventual cancellations have happened, leaving the 9 still-subscribed subscribers, so \(S(12) = 9/24 = 0.375\).

Notice what that calculation never needed: the hidden true cancellation months. \(S(t)\) only ever asks about months up to 12, and 12 months is exactly as far as Maya ever watched anyone, so the recorded `month` and `status` columns are all it takes.

Here is \(S(t)\) traced across the whole 12-month window.

::widget chart-plotter {"data":[{"x":0,"y":1},{"x":3,"y":0.875},{"x":6,"y":0.667},{"x":9,"y":0.5},{"x":12,"y":0.375}],"geoms":["line"],"x":"month","y":"survival_fraction"}

The curve only ever goes down or stays flat, because once a subscriber cancels, they do not come back, and 24 is a fixed starting point that never grows.

=== step === concept
## The hazard function, and how it rebuilds the survival function

\(S(t)\) asks what fraction of the original 24 are still subscribed. The hazard function, \(h(t)\), asks a narrower question: of the subscribers who are still subscribed entering month \(t\), what statisticians call being at risk, what fraction cancel during that one month?

A subscriber is at risk entering month 9 if they have not cancelled, and have not dropped out of view, before month 9. That includes anyone whose recorded month is 9 or later, whether they go on to cancel then or stay subscribed all the way to 12.

```r
# Compute the hazard at month 9 from how many are at risk and how many cancel
at_risk_9 <- sum(pulse$month >= 9)
events_9 <- sum(pulse$month == 9 & pulse$status == 1)
h9 <- events_9 / at_risk_9
at_risk_9
#> [1] 14
events_9
#> [1] 2
h9
#> [1] 0.1428571
```

14 subscribers are at risk entering month 9, and 2 of them cancel that month, so \(h(9) = 2/14 \approx 0.143\).

Here is what makes \(S(t)\) and \(h(t)\) two views of one process, not two separate ideas. The fraction still subscribed past month 9 is just the fraction still subscribed past month 8, times the fraction of those who make it through month 9 without cancelling: \(S(9) = S(8) \times (1 - h(9))\).

```r
# Compute S(8) directly, then confirm S(8) times (1 - h(9)) equals S(9)
cancelled_by_8 <- sum(pulse$month <= 8 & pulse$status == 1)
S8 <- (24 - cancelled_by_8) / 24
S8
#> [1] 0.5833333
S8 * (1 - h9)
#> [1] 0.5
```

\(S(8) = 14/24 \approx 0.583\), the same kind of direct count used for \(S(6)\) and \(S(9)\). Multiply it by \((1 - h(9))\), about 0.857, and you get exactly 0.5, which is \(S(9)\) computed the direct way two steps ago. That is not a coincidence. A survival function is a running total built one month-by-month hazard at a time, which is why multiplying them back together reproduces it exactly.

=== step === quiz
## Quick check: reading a censored subscriber correctly

A 25th subscriber joins a similar study. They have been active for 10 months when the study ends, without having cancelled. What is true about their cancellation month?

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- Their cancellation month is at least 10, just not known exactly. ::ok Right. That 10 is a real lower bound, not the full answer and not nothing. This subscriber is right-censored at month 10, exactly like Maya's 9 still-subscribed subscribers were right-censored at month 12.
- Nothing useful is known about this subscriber, since the study ended before they cancelled. ::no
- Their cancellation month is exactly 10, since that is the last time they were seen. ::no Both of those miss the same fact. Saying nothing useful is known throws away the one true thing you do have, that they lasted at least 10 months. Saying their month is exactly 10 invents an ending that was never observed. The honest fact sits between the two: at least 10, no more specific than that.

=== step === tryit
## Your turn: compute a hazard and a survival value

Try this yourself on month 11. `pulse` is still loaded with all 24 subscribers. Fill in the two `NA` lines below: first \(h(11)\), the same way you computed \(h(9)\), then \(S(11)\), the same way you computed \(S(6)\) and \(S(9)\).

```r
# Fill in h(11) and S(11) from the same 24 Pulse subscribers
at_risk_11 <- sum(pulse$month >= 11)
events_11 <- sum(pulse$month == 11 & pulse$status == 1)
h11 <- NA
h11
#> [1] NA

cancelled_by_11 <- sum(pulse$month <= 11 & pulse$status == 1)
S11 <- NA
S11
#> [1] NA
```

Replace the first `NA` with `events_11` divided by `at_risk_11`. Replace the second `NA` with 24 minus `cancelled_by_11`, divided by 24. Press Check when you have both.

::check {"regex": "(?=[\\s\\S]*(events_11\\s*/\\s*at_risk_11|1\\s*/\\s*12))(?=[\\s\\S]*(24\\s*-\\s*cancelled_by_11|11\\s*/\\s*24))", "gate": true, "difficulty": "intermediate", "ok": "Right. h(11) is 1/12, about 0.083: only 1 of the 12 subscribers at risk entering month 11 cancels that month. S(11) is 11/24, about 0.458, by the same direct count you used for S(6) and S(9).", "no": "Replace h11's NA with events_11 / at_risk_11 (or the fraction 1/12), and S11's NA with (24 - cancelled_by_11) / 24 (or the fraction 11/24)."}
::solution
```r
# Compute h(11) and S(11) from the same 24 Pulse subscribers
at_risk_11 <- sum(pulse$month >= 11)
events_11 <- sum(pulse$month == 11 & pulse$status == 1)
h11 <- events_11 / at_risk_11
h11
#> [1] 0.08333333

cancelled_by_11 <- sum(pulse$month <= 11 & pulse$status == 1)
S11 <- (24 - cancelled_by_11) / 24
S11
#> [1] 0.4583333
```

12 subscribers are at risk entering month 11, and only 1 of them cancels that month, which is why \(h(11)\) is so much smaller than \(h(9)\) was.

=== step === concept
## References
::prose-only the sources are text, not a visual

- Kaplan, E.L., and Meier, P. (1958). [Nonparametric Estimation from Incomplete Observations](https://doi.org/10.1080/01621459.1958.10501452). Journal of the American Statistical Association, 53(282), 457-481. The original paper naming right-censoring and building toward the estimator this course covers next.
- Kleinbaum, D.G., and Klein, M. (2012). [Survival Analysis: A Self-Learning Text](https://doi.org/10.1007/978-1-4419-6646-9) (3rd ed.). Springer. A step-by-step introduction to the survival and hazard functions, aimed at readers meeting them for the first time.
- Klein, J.P., and Moeschberger, M.L. (2003). [Survival Analysis: Techniques for Censored and Truncated Data](https://doi.org/10.1007/b97377) (2nd ed.). Springer. A fuller treatment of censoring mechanisms beyond the right-censoring covered in this lesson.
- Cox, D.R., and Oakes, D. (1984). [Analysis of Survival Data](https://www.routledge.com/Analysis-of-Survival-Data/Cox-Oakes/p/book/9780412244902). Chapman and Hall. The classical text connecting the survival and hazard functions to the regression models this course builds toward.
- Collett, D. (2015). [Modelling Survival Data in Medical Research](https://www.taylorfrancis.com/books/9781498731690) (3rd ed.). CRC Press. Worked medical examples of the same right-censoring this lesson introduces with a subscription dataset.

=== step === complete
## What this leaves you, and what comes after it

Here is Maya's honest answer. The real average time to cancel among her 24 subscribers is about 18.6 months, not the 6.4 months she got by dropping the still-subscribed, and not the 8.5 months she got by capping them at 12. Both guesses were wrong for the same reason: 9 of the 24 subscribers were never finished observations to begin with. They were right-censored, each one carrying a true fact, "lasted at least this long", and no fix that drops that fact or rounds it down to the cutoff can recover what it is hiding.

From now on, whenever you meet a dataset with a fixed follow-up window, a trial that ends on a date, a warranty period, any observation period with a cutoff, check for this exact pattern before you average anything: rows that end in a real event, and rows that just ran out of time. The survival function \(S(t)\) and the hazard function \(h(t)\) you built by hand in this lesson are the two tools built to handle that pattern honestly.

Here is a first look at what a full survival curve looks like, traced here across two different treatment arms, not Maya's subscribers.

::widget km-curve {}

That staircase shape is what the next lesson builds from scratch, one event at a time: the Kaplan-Meier estimator.
