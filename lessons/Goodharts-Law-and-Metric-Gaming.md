---
title: "Product Metric Design Lesson 4: Goodhart's Law and Metric Gaming"
catalog_blurb: "Why a metric that keeps improving can mean nothing improved at all."
description: "Harlow's handle time falls while resolution quietly falls too. Learn Goodhart's Law, why a targeted metric breaks, and the odds a shortcut wins by chance alone."
keywords: "Goodhart's Law, metric gaming, proxy metric, target metric, average handle time, first-contact resolution, gamed metric, multiple comparisons, p-hacking, product metrics"
post_type: "LESSON"
curriculum_id: "3.20.4"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "pds-metrics"
course_title: "Product Metric Design"
course_lesson: "4"
course_total: "9"
course_landing: "Product-Metric-Design-Course.html"
course_next: "Multiple-Testing-Across-Metrics.html"
course_prev: "Guardrail-Metrics.html"
---

=== step === cover
## Goodhart's Law and Metric Gaming

Today let's understand Goodhart's Law, what happens to a metric the moment someone starts chasing it as a target.

Harlow Customer Care, an online retailer's support team, ranks its support agents on one number: Average Handle Time, or AHT, the minutes it takes an agent to close a ticket. Shorter is meant to mean better service. Eight weeks after Harlow made AHT the one metric every agent is scored on, here is what happened to it.

::widget chart-plotter {"data":[{"x":1,"y":9.4},{"x":2,"y":8.8},{"x":3,"y":8.2},{"x":4,"y":7.6},{"x":5,"y":7.0},{"x":6,"y":6.4},{"x":7,"y":5.8},{"x":8,"y":5.1}],"geoms":["line"],"x":"week","y":"AHT"}

AHT fell from 9.4 minutes to 5.1 minutes over those 8 weeks. That line only goes one way: down. So did support actually get better?

=== step === concept
## The metric and the outcome it was meant to track

AHT is a metric, a number cheap enough to log on every single call, every single day, but it is not the thing Harlow actually cares about. What Harlow actually cares about is whether the customer's problem got solved, and the number that tracks that is First Contact Resolution, or FCR: the percent of tickets with no repeat contact from the same customer within 7 days. A high FCR means the agent solved it the first time; a low one means the customer had to come back.

Before AHT became a scored target, the two numbers moved together. FCR stood at 81% in week 1, the same week AHT started at 9.4 minutes. Here is Harlow's full 8 weeks, AHT and FCR side by side.

```r
# Build Harlow's 8-week table of AHT and FCR side by side
week <- 1:8
aht <- c(9.4, 8.8, 8.2, 7.6, 7.0, 6.4, 5.8, 5.1)
fcr <- c(81, 79, 77, 74, 72, 69, 67, 64)
harlow <- data.frame(week = week, aht = aht, fcr = fcr)
harlow
#>   week aht fcr
#> 1    1 9.4  81
#> 2    2 8.8  79
#> 3    3 8.2  77
#> 4    4 7.6  74
#> 5    5 7.0  72
#> 6    6 6.4  69
#> 7    7 5.8  67
#> 8    8 5.1  64
```

Look at the two columns together. `aht` goes down every single week. But `fcr` goes down too, from 81 in week 1 to 64 in week 8. The metric Harlow is scoring agents on is falling exactly as intended, and the outcome it was supposed to stand in for is falling right along with it.

=== step === concept
## Why a metric stops tracking the goal once it is the target

::prose-only states Goodhart's Law and the mechanism, grounded entirely in the harlow table already on the page

Before Harlow ranked agents on AHT, a short call and a solved ticket tended to arrive together, for an ordinary reason. The tickets that took an agent the least time to close were, mostly, the easy ones: a password reset, a question already answered in the first sentence. Those are also the tickets least likely to need a repeat contact within 7 days, so they score high on FCR too.

So a low AHT and a high FCR were never two separate achievements. They were the same fact, read off two different numbers.

The moment Harlow started scoring agents on AHT itself, that stopped being true. An agent's score now depends only on how fast the call ends, not on whether the problem actually got solved.

So the cheapest way to a better score is no longer the same thing as the cheapest way to a solved ticket. An agent chasing the score will take whichever path is cheaper for the score, even when that path leaves the customer's problem untouched.

This split has a name: Goodhart's Law, after the economist Charles Goodhart. It is usually stated in the sharper form the anthropologist Marilyn Strathern gave it: "when a measure becomes a target, it ceases to be a good measure." A measure, in that sentence, is exactly the same thing this lesson has been calling a metric.

The moment a metric stops being watched and starts being rewarded, the cheapest way to move the metric and the cheapest way to produce the outcome it used to track can pull apart. Harlow's own 8 weeks, already on the page, are exactly that: AHT falling the way a rewarded metric is supposed to fall, while FCR, the thing AHT was only ever standing in for, falls right along with it.

=== step === concept
## The shortcuts agents actually used

So what does an agent chasing a lower AHT, instead of a solved ticket, actually do differently? At Harlow, three shortcuts showed up.

Each one cuts the clock on the call. None of them require the customer's problem to actually get fixed.

- **Transfer the ticket before resolving it.** The call moves to another queue, so the clock on this agent's handle time stops the moment the transfer happens, whether or not the problem is anywhere close to solved.
- **Tell the customer to email instead.** Ending the call this way stops the clock immediately, but the issue is still open; it has just moved out of the call and into an inbox nobody is timing.
- **Close the ticket as resolved on a guess.** Marking a ticket closed takes a few seconds and ends the clock, whether the fix actually worked or the agent just hoped it did.

Every one of these drives AHT down. None of them makes the customer's problem go away any faster, and each one leaves plenty of room for the customer to come back within 7 days, the exact thing FCR counts.

=== step === concept
## Why trying several untested shortcuts raises the odds one looks like a win

::prose-only states the chance of a false win in words, sets up the widget in step 7

There is a second way a team can convince itself a shortcut works, even when it does nothing at all.

Suppose a team wants to check whether some new shortcut actually lowers AHT without hurting FCR. The usual way to check is a statistical test: compare AHT with the shortcut against AHT without it, and call the shortcut a win if the test clears a threshold, almost always set at 5%.

That threshold is a promise about error, not about truth. If a shortcut truly does nothing, a single check like this still has a 5% chance of clearing the bar anyway, purely by chance. One shortcut in twenty looks like a win for no reason at all.

Now suppose the team does not test just one shortcut. It tries k different untested shortcuts and keeps whichever one clears the 5% bar.

Even if every single one of those k shortcuts truly does nothing, the chance that at least one of them clears the bar by chance is no longer 5%. It climbs to \(1 - 0.95^{k}\), because the team only needs one of the k checks to come back a false win. The more shortcuts tried, the closer that chance gets to a certainty.

Hold onto that formula. The next widget lets you drag k and watch exactly how fast that chance climbs.

=== step === widget
## Watching FCR keep falling as AHT improves

The AHT line on the cover only shows half the story. Here is the same 8 weeks, but now FCR sits on the vertical axis instead of AHT, and you can switch between three ways of looking at the same numbers.

::widget chart-plotter {"data":[{"x":1,"y":81},{"x":2,"y":79},{"x":3,"y":77},{"x":4,"y":74},{"x":5,"y":72},{"x":6,"y":69},{"x":7,"y":67},{"x":8,"y":64}],"geoms":["point","line","bar"],"x":"week","y":"FCR"}

Switch between point, line and bar. Whichever view you pick, the shape underneath is the same: FCR drops every single week, from 81 in week 1 to 64 in week 8, across exactly the same 8 weeks AHT was falling on the cover.

Harlow's scored metric was improving the entire time its real outcome was getting worse.

=== step === widget
## How often chance alone produces a false win

::prose-only the visual is the multiplicity-sim widget directly below, read at k = 5 and k = 20

This widget does not chart Harlow's own AHT or FCR numbers. It simulates something more general: many studies where a shortcut is checked against a 5% threshold and, in every single study, truly does nothing at all, the exact setup from the last step.

::widget multiplicity-sim {"kMax": 25, "kStart": 5, "alpha": 0.05, "corrections": ["none"], "nStudies": 100000}

Set k to 5. The chart reads that about 22.6% of the time, at least one of 5 untested shortcuts clears the 5% bar purely by chance, matching \(1 - 0.95^{5}\) from the last step.

Now drag k up to 20. The share climbs to about 64.2%, which is \(1 - 0.95^{20}\). Trying 20 untested shortcuts makes it more likely than not that one of them looks like a win, even though every single one of the 20 does nothing at all.

That is the second trap sitting underneath Harlow's falling AHT. Even a team not actively gaming the metric, just trying one shortcut after another to see what moves the number, will eventually find one that appears to work, for no reason but luck.

=== step === quiz
## Quick check: a metric that moved for the wrong reason

A delivery team is ranked on its on-time rate. Over one quarter, on-time rate rises from 72% to 94%. In the same quarter, complaints about wrong or missing items triple.

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The rising on-time rate alone proves delivery genuinely improved. ::no
- Likely a gamed win: drivers may be rushing to beat the on-time clock at the cost of getting the right items to the door, the same way Harlow's agents cut AHT without fixing tickets. ::ok Right. A scored metric rising next to a real outcome falling is exactly Harlow's pattern: the team found a cheap way to move the number it is measured on, and the outcome that number was supposed to track paid for it.
- The two trends are unrelated coincidences, since on-time rate and complaint counts measure different things. ::no A rising metric never proves a real improvement by itself, and two trends moving opposite ways in the same quarter are not an unrelated coincidence just because they measure different things. Together they are the same warning sign Harlow's AHT and FCR gave.

=== step === tryit
## Your turn: how often does a useless shortcut look like a win

The shortcuts step showed three ways an agent can cut AHT without fixing anything. The widget just showed what happens when a team tries several such shortcuts and keeps whichever one clears the 5% bar by chance.

Change `k` below from 5 to 20 and run it again, to see the chance for yourself.

```r
# Compute the chance that at least one of k untested shortcuts clears the 5% bar purely by chance
alpha <- 0.05
k <- 5
1 - (1 - alpha)^k
```
::check {"regex": "k\\s*<-\\s*20", "gate": true, "difficulty": "beginner", "ok": "Right: 0.6415, so about 64.2%. Trying 20 untested shortcuts makes it more likely than not that one clears the bar on luck alone, even if every single one of them does nothing.", "no": "Change the line k <- 5 to k <- 20, then run the block again."}
::solution
```r
# Same formula, with k changed from 5 to 20
alpha <- 0.05
k <- 20
1 - (1 - alpha)^k
#> [1] 0.6415141
```

=== step === concept
## References

::prose-only the references are text, not a visual

- Goodhart, C. (1975). Problems of Monetary Management: The U.K. Experience. Papers in Monetary Economics, Reserve Bank of Australia. The paper that gave the law its name: a measure used as a policy target stops behaving the way it did before anyone targeted it.
- [Strathern, M. (1997). "Improving ratings": audit in the British university system.](https://www.cambridge.org/core/journals/european-review/article/improving-ratings-audit-inthe-british-university-system/FC2EE640C0C44E3DB87C29FB666E9AAB) European Review, 5(3), 305 to 321. The sharper phrasing used in this lesson, that a measure becoming a target stops it being a good measure.
- [Campbell, D. T. (1979). Assessing the Impact of Planned Social Change.](https://doi.org/10.1016/0149-7189%2879%2990048-X) Evaluation and Program Planning, 2(1), 67 to 90. Campbell's Law, the same mechanism stated for social programs: the more a quantitative indicator is used for decisions, the more it invites the exact kind of gaming Harlow's AHT shows.
- [Muller, J. Z. (2018). The Tyranny of Metrics.](https://press.princeton.edu/books/hardcover/9780691174952/the-tyranny-of-metrics) Princeton University Press. A full length account of metric gaming across medicine, education, policing and business, with Harlow's pattern repeated industry after industry.

=== step === complete
## Reading a target metric next to an outcome it does not reward

Harlow's AHT fell from 9.4 to 5.1 minutes, exactly what a scored metric is supposed to do when agents are rewarded for moving it. But AHT only ever existed because it used to track FCR, the share of tickets actually solved the first time. Once agents were scored on AHT itself, the cheapest way to move AHT and the cheapest way to solve a ticket pulled apart, and agents took the cheaper one: transferring tickets early, pushing customers to email, closing tickets on a guess. FCR fell from 81% to 64% across those same 8 weeks, and that fall is what the falling AHT alone could never show.

The one check that would have caught this early is simple: never read a target metric's improvement by itself. Read it next to an outcome nobody is rewarded for moving, the way FCR was never anybody's scored target at Harlow. If the target improves while that outcome holds steady or improves too, the gain is probably real. If the target improves while the outcome falls, as happened here, the number is being gamed, not the service.
