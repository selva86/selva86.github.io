---
title: "Product Sense and Metric Diagnosis Lesson 2: Metric Drop Diagnosis"
catalog_blurb: "The four-check order that tells a tracking break from a real metric drop."
description: "Driftwell's signups fall 26% after an iOS release. Learn the four checks, real, instrumentation, calendar, segment, that find the renamed tracking event."
keywords: "metric drop diagnosis, instrumentation bug, tracking break, event renaming, seasonality check, segment analysis, control limits, product analytics, standard deviation, product data science"
post_type: "LESSON"
curriculum_id: "3.10.2"
webr: true
mathjax: false
lesson_access: "free"
course_id: "pds-sense"
course_title: "Product Sense and Metric Diagnosis"
course_lesson: "2"
course_total: "6"
course_landing: "Product-Sense-and-Metric-Diagnosis-Course.html"
course_next: "Funnel-Decomposition.html"
course_prev: "Framing-an-Ambiguous-Product-Question.html"
---

=== step === cover
## Metric Drop Diagnosis

Today let's work out what to do the moment a number you track drops, before you decide what caused it.

Driftwell is a meditation and sleep app. Its growth lead, Priya, watches one number every morning: how many people complete a free trial signup that day. For three weeks it held close to 1,000 a day. Then Driftwell shipped a new iOS build, and the daily count fell and has stayed lower since.

A drop like that invites a story right away. Maybe the app got worse. Maybe a competitor launched something. Maybe interest is fading.

But reaching for a story before checking the number itself is how teams end up fixing the wrong thing.

So before any cause gets accepted, run four checks, always in this order.

::widget process-flow {"steps":[{"title":"Is it real?","sub":"rule out an ordinary day-to-day wobble before anything else"},{"title":"Is it instrumentation?","sub":"check whether something shipped broke the tracking itself"},{"title":"Is it the calendar?","sub":"compare the date against the same weekday in earlier weeks"},{"title":"Is it one segment?","sub":"split the number apart and see exactly where it moved"}]}

Those are the four checks this lesson walks through, one at a time. Each one rules out something ordinary first, so a real cause only gets the blame once the ordinary explanations are gone.

=== step === concept
## The numbers behind the drop

Here is Driftwell's daily free trial signups for 35 days, split by platform, with the before and after averages computed directly from it.

```r
# Build Driftwell's 35-day signups by platform and compare the before vs after averages
library(dplyr)

set.seed(82)
ios_pre  <- round(rnorm(21, mean = 520, sd = 21))
ios_post <- round(rnorm(14, mean = 260, sd = 21))
and_pre  <- round(rnorm(21, mean = 480, sd = 21))
and_post <- round(rnorm(14, mean = 480, sd = 21))

signups <- data.frame(
  day = c(1:21, 1:21, 22:35, 22:35),
  platform = c(rep("iOS", 21), rep("Android", 21), rep("iOS", 14), rep("Android", 14)),
  signups = c(ios_pre, and_pre, ios_post, and_post)
)

daily_total <- signups |>
  group_by(day) |>
  summarise(signups = sum(signups))

pre_mean  <- mean(daily_total$signups[daily_total$day <= 21])
post_mean <- mean(daily_total$signups[daily_total$day >= 22])
pct_drop  <- round((pre_mean - post_mean) / pre_mean * 100, 1)

round(pre_mean, 1)
#> [1] 1000.4
round(post_mean, 1)
#> [1] 740.6
pct_drop
#> [1] 26
```

`signups` holds one row per day per platform: the day number, iOS or Android, and that platform's signup count for that day. `daily_total` adds iOS and Android together to get the one number Priya actually watches each morning.

The first 21 days average 1,000.4 signups a day. The 14 days after the release average 740.6. That is a 26% drop.

Plotted across all 35 days, the drop looks less like a slow slide and more like a step.

```r
# Plot the daily total across all 35 days to see where the drop begins
library(ggplot2)

ggplot(daily_total, aes(day, signups)) +
  geom_line() +
  geom_vline(xintercept = 21.5, linetype = "dashed") +
  labs(x = "Day", y = "Daily signups (iOS + Android)")
```

The dashed line marks day 21.5, the boundary between the pre-release and the post-release days. The daily total sits close to 1,000 for three weeks, drops sharply right at that boundary, and stays down after it. A drop this sudden, lined up exactly with a release, is the first clue that something tied to the release itself is responsible, not something that built up gradually.

=== step === concept
## Check 1: is the drop bigger than normal day-to-day noise?

Before anything else, rule out the most boring explanation: maybe 740.6 is just an unusually low day, well within how much the number normally wobbles. The standard deviation of the pre-release days measures exactly that wobble.

```r
# Measure how much the daily total normally wobbles, then compare the drop against it
pre_sd <- sd(daily_total$signups[daily_total$day <= 21])
z_score <- round((pre_mean - post_mean) / pre_sd, 1)

round(pre_sd, 1)
#> [1] 30.1
z_score
#> [1] 8.6
round(pre_mean - 2 * pre_sd, 1)
#> [1] 940.2
round(pre_mean + 2 * pre_sd, 1)
#> [1] 1060.6
```

The pre-release days wobble by about 30.1 signups a day around their mean of 1,000.4. That puts an ordinary day somewhere between 940.2 and 1,060.6, two standard deviations either side of the mean.

740.6 is nowhere near that range. It sits 8.6 standard deviations below the pre-release mean, far past the two or three standard deviations an ordinary day ever reaches. So the drop is real: it is not the kind of number day-to-day noise alone produces.

This check only tells you the drop is not noise. It says nothing yet about why it happened, which is exactly what the next check starts to answer.

=== step === concept
## Check 2: did something ship that could break tracking?

Once a drop is confirmed real, the next question is not "why did behavior change" but "did anything ship that could break how the behavior gets counted". This check runs second, right after confirming the drop is real, for a specific reason: a broken tracking event is the most common cause of a sudden metric drop, and it is the easiest one to skip past, because a behavioral story is always more interesting to tell than a tracking bug.

::prose-only the visual is a two-row log of the event name before and after the SDK upgrade, dated against the drop's start, shown as a table rather than a widget

Driftwell's drop starts exactly on day 22, the same day the iOS build ships. That build upgrades the app's analytics SDK, and the upgrade renames the event the app sends when someone finishes signing up.

| When | Event name the app sends | Does the backend count it? |
|---|---|---|
| Before day 22 (old build) | signup_complete | Yes |
| From day 22 onward (new build) | signup_completed | No |

The backend pipeline that counts free trial signups was only ever told to count `signup_complete`. After the new build ships, the app itself keeps working fine, and every signup on the new build still fires an event. But that event is now named `signup_completed`, and the backend has no rule for that name, so it never gets counted.

That is why this check matters so much. The product did not get worse on day 22. The counting broke on day 22.

The two look identical on a dashboard, a lower number, but they call for completely different responses: one calls for an engineering fix to the event name, the other calls for changes to the product. Running this check before reacting to the drop is what tells the two apart.

=== step === concept
## Check 3: could this just be the calendar?

Day 22 is a Monday. If Mondays always run a little low, the drop might just be an ordinary calendar pattern, not anything new. Averaging the pre-release signups by day of the week settles the question.

```r
# Average signups per weekday across the 21 pre-release days to check for a calendar pattern
weekday_labels <- c("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")

pre_only <- daily_total |>
  filter(day <= 21) |>
  mutate(weekday = weekday_labels[((day - 1) %% 7) + 1])

wd_avg <- pre_only |>
  group_by(weekday) |>
  summarise(avg_signups = round(mean(signups), 1)) |>
  arrange(match(weekday, weekday_labels))

cat(sprintf("%s: %.1f\n", wd_avg$weekday, wd_avg$avg_signups), sep = "")
#> Mon: 972.0
#> Tue: 995.7
#> Wed: 1017.3
#> Thu: 1021.7
#> Fri: 980.0
#> Sat: 1001.7
#> Sun: 1014.3
```

21 pre-release days give exactly three of each weekday. Monday's own average is 972.0, close to the overall pre-release mean of 1,000.4, and nowhere near the 740.6 Driftwell saw after the release. Every other weekday sits in that same 972.0 to 1,021.7 range, with no day standing out as unusually low.

So days 1, 8 and 15, the three Mondays before the release, behaved like every other day of the week. If Mondays were genuinely slow, day 22 would be low for a reason that has nothing to do with the release, and that same weekly dip would have shown up on those three earlier Mondays too. It did not. That rules out the calendar as the explanation.

=== step === widget
## Check 4: is the drop everywhere, or in one slice?

A drop caused by a broken event name should sit entirely inside whatever shipped the broken code. A drop caused by a real change in behavior usually spreads across the whole product. Splitting the 35 days by platform shows which one this is.

```r
# Compare each platform's own before vs after average
ios_pre_avg      <- round(mean(signups$signups[signups$platform == "iOS" & signups$day <= 21]), 1)
ios_post_avg     <- round(mean(signups$signups[signups$platform == "iOS" & signups$day >= 22]), 1)
android_pre_avg  <- round(mean(signups$signups[signups$platform == "Android" & signups$day <= 21]), 1)
android_post_avg <- round(mean(signups$signups[signups$platform == "Android" & signups$day >= 22]), 1)

ios_pre_avg
#> [1] 518.3
ios_post_avg
#> [1] 259.8
android_pre_avg
#> [1] 482.1
android_post_avg
#> [1] 480.9

ios_pct_drop <- round((ios_pre_avg - ios_post_avg) / ios_pre_avg * 100, 1)
ios_pct_drop
#> [1] 49.9
```

iOS falls from 518.3 to 259.8 signups a day, a 49.9% drop on its own. Android barely moves, from 482.1 to 480.9. The entire 26% drop in the combined total comes from iOS; Android is carrying exactly as many signups as it always did.

Here is that same split drawn out across all 35 days, by platform.

::widget chart-plotter {"data":[{"x":1,"y":500,"fill":"Android"},{"x":1,"y":494,"fill":"iOS"},{"x":2,"y":462,"fill":"Android"},{"x":2,"y":526,"fill":"iOS"},{"x":3,"y":464,"fill":"Android"},{"x":3,"y":513,"fill":"iOS"},{"x":4,"y":509,"fill":"Android"},{"x":4,"y":491,"fill":"iOS"},{"x":5,"y":444,"fill":"Android"},{"x":5,"y":525,"fill":"iOS"},{"x":6,"y":475,"fill":"Android"},{"x":6,"y":511,"fill":"iOS"},{"x":7,"y":525,"fill":"Android"},{"x":7,"y":519,"fill":"iOS"},{"x":8,"y":466,"fill":"Android"},{"x":8,"y":500,"fill":"iOS"},{"x":9,"y":453,"fill":"Android"},{"x":9,"y":506,"fill":"iOS"},{"x":10,"y":476,"fill":"Android"},{"x":10,"y":576,"fill":"iOS"},{"x":11,"y":528,"fill":"Android"},{"x":11,"y":510,"fill":"iOS"},{"x":12,"y":455,"fill":"Android"},{"x":12,"y":513,"fill":"iOS"},{"x":13,"y":516,"fill":"Android"},{"x":13,"y":519,"fill":"iOS"},{"x":14,"y":489,"fill":"Android"},{"x":14,"y":513,"fill":"iOS"},{"x":15,"y":455,"fill":"Android"},{"x":15,"y":501,"fill":"iOS"},{"x":16,"y":511,"fill":"Android"},{"x":16,"y":529,"fill":"iOS"},{"x":17,"y":511,"fill":"Android"},{"x":17,"y":512,"fill":"iOS"},{"x":18,"y":494,"fill":"Android"},{"x":18,"y":533,"fill":"iOS"},{"x":19,"y":458,"fill":"Android"},{"x":19,"y":545,"fill":"iOS"},{"x":20,"y":450,"fill":"Android"},{"x":20,"y":534,"fill":"iOS"},{"x":21,"y":483,"fill":"Android"},{"x":21,"y":514,"fill":"iOS"},{"x":22,"y":482,"fill":"Android"},{"x":22,"y":292,"fill":"iOS"},{"x":23,"y":488,"fill":"Android"},{"x":23,"y":259,"fill":"iOS"},{"x":24,"y":478,"fill":"Android"},{"x":24,"y":230,"fill":"iOS"},{"x":25,"y":477,"fill":"Android"},{"x":25,"y":270,"fill":"iOS"},{"x":26,"y":472,"fill":"Android"},{"x":26,"y":251,"fill":"iOS"},{"x":27,"y":472,"fill":"Android"},{"x":27,"y":235,"fill":"iOS"},{"x":28,"y":480,"fill":"Android"},{"x":28,"y":262,"fill":"iOS"},{"x":29,"y":480,"fill":"Android"},{"x":29,"y":264,"fill":"iOS"},{"x":30,"y":461,"fill":"Android"},{"x":30,"y":281,"fill":"iOS"},{"x":31,"y":497,"fill":"Android"},{"x":31,"y":280,"fill":"iOS"},{"x":32,"y":483,"fill":"Android"},{"x":32,"y":231,"fill":"iOS"},{"x":33,"y":505,"fill":"Android"},{"x":33,"y":260,"fill":"iOS"},{"x":34,"y":463,"fill":"Android"},{"x":34,"y":249,"fill":"iOS"},{"x":35,"y":494,"fill":"Android"},{"x":35,"y":273,"fill":"iOS"}],"geoms":["line","point"],"x":"day","y":"signups"}

The iOS line drops to roughly half its height right at day 22 and stays there for the rest of the 35 days. The Android line runs flat the whole way across. That is exactly the shape a tracking break on one platform's release produces, and not the shape you would expect if people everywhere had simply lost interest in Driftwell.

=== step === widget
## Putting the four checks into one answer

Four checks, four answers. Here they are together.

::widget styled-table {"cols":["Check","Verdict","Evidence"],"rows":[["Is it real?","Yes","740.6 sits 8.6 standard deviations below the 1,000.4 pre-release mean"],["Is it instrumentation?","Yes","the iOS build on day 22 renamed the signup event; the backend only counts the old name"],["Is it the calendar?","No","pre-release Mondays average 972.0, close to the 1,000.4 overall mean"],["Is it one segment?","Yes","iOS falls 49.9% from 518.3 to 259.8; Android moves only from 482.1 to 480.9"]],"title":"The completed diagnosis","note":"All four checks run, in order, before any cause is accepted."}

Every row points to the same explanation. The drop is real, not noise. Something shipped on the exact day it started, and that something renamed the event the backend was counting.

The calendar has nothing to do with it, and the drop sits entirely inside the platform that shipped the release. The only cause consistent with all four rows is the renamed tracking event, not an actual fall in how many people want to sign up.

=== step === quiz
## Quick check: reading the order right

The table above is where the four checks resolve into one answer. Once a drop clears check 1 and is confirmed real, which check runs next, before any explanation gets accepted?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- React to the drop as a sign the product got worse, and start investigating the product experience itself. ::no
- Check whether anything shipped that could break how the signup event is tracked. ::ok Right. Once a drop clears check 1 and is confirmed real, the very next thing to check is whether anything shipped that could break how the event is tracked. A broken tracking event is the most common cause of a sudden metric drop, and the easiest one to skip past in favor of a product story.
- Compare the drop's date against the same weekday in earlier weeks. ::no
- Split the metric by platform or segment to see where the drop sits. ::no Not quite. Once a drop is confirmed real, the instrumentation check runs next, before any behavioral story, any calendar check, or any segment breakdown, because a broken tracking event is the most common cause of a sudden drop and is easy to miss once a more interesting explanation is on the table.

=== step === tryit
## Your turn: check a second slice of the same drop

Check 1 asked whether the combined total's drop was bigger than its normal wobble. Android's own numbers can be checked the exact same way.

```r
# Apply check 1's noise rule to Android's own numbers
android_pre  <- signups$signups[signups$platform == "Android" & signups$day <= 21]
android_post <- signups$signups[signups$platform == "Android" & signups$day >= 22]

android_pre_mean <- mean(android_pre)
android_pre_sd   <- sd(android_pre)
android_post_mean <- mean(android_post)

round(android_pre_mean, 1)
#> [1] 482.1
round(android_pre_sd, 1)
#> [1] 26.9
round(android_post_mean, 1)
#> [1] 480.9

lower_band <- android_pre_mean - 2 * android_pre_sd
upper_band <- android_pre_mean + 2 * android_pre_sd
round(lower_band, 1)
#> [1] 428.3
round(upper_band, 1)
#> [1] 535.9

inside_normal_range <- NA
inside_normal_range
#> [1] NA
```

Replace the `NA` with a comparison that checks whether `android_post_mean` falls between `lower_band` and `upper_band`. Press Check when you have it.

::check {"regex": "android_post_mean\\s*[<>]=?\\s*lower_band\\s*&{1,2}\\s*android_post_mean\\s*[<>]=?\\s*upper_band", "gate": true, "difficulty": "beginner", "ok": "Right. 480.9 sits inside 428.3 to 535.9, so inside_normal_range is TRUE. Android's post-release average never left its own normal range, the same test iOS failed in check 1.", "no": "Replace the NA with android_post_mean > lower_band & android_post_mean < upper_band, the same kind of comparison check 1 made for the combined total."}
::solution
```r
# Apply check 1's noise rule to Android's own numbers
android_pre  <- signups$signups[signups$platform == "Android" & signups$day <= 21]
android_post <- signups$signups[signups$platform == "Android" & signups$day >= 22]

android_pre_mean <- mean(android_pre)
android_pre_sd   <- sd(android_pre)
android_post_mean <- mean(android_post)

round(android_pre_mean, 1)
#> [1] 482.1
round(android_pre_sd, 1)
#> [1] 26.9
round(android_post_mean, 1)
#> [1] 480.9

lower_band <- android_pre_mean - 2 * android_pre_sd
upper_band <- android_pre_mean + 2 * android_pre_sd
round(lower_band, 1)
#> [1] 428.3
round(upper_band, 1)
#> [1] 535.9

inside_normal_range <- android_post_mean > lower_band & android_post_mean < upper_band
inside_normal_range
#> [1] TRUE
```

480.9 sits comfortably inside 428.3 to 535.9. Android passes check 1's own test: its post-release average never left its normal range, exactly what you would expect from a platform that was never touched by the renamed event.

=== step === concept
## References
::prose-only the sources are text, not a visual

- Kohavi, R., Tang, D., and Xu, Y. (2020). [Trustworthy Online Controlled Experiments](https://www.cambridge.org/core/books/trustworthy-online-controlled-experiments/D97B26382EB0EB2DC2019A7A7B518F59). Cambridge University Press. On validating that a metric's instrumentation is correct before trusting what it reports.
- Vallis, O., Hochenbaum, J., and Kejariwal, A. (2014). [A Novel Technique for Long-Term Anomaly Detection in the Cloud](https://www.usenix.org/conference/hotcloud14/workshop-program/presentation/vallis). USENIX HotCloud. On telling a real shift in a metric apart from normal day-to-day and seasonal variation.
- Montgomery, D.C. (2024). Introduction to Statistical Quality Control, 8th ed. Wiley. On control limits, the idea behind checking whether a new value sits outside a process's normal range.
- Rodden, K., Hutchinson, H., and Fu, X. (2010). [Measuring the User Experience on a Large Scale](https://doi.org/10.1145/1753326.1753687). CHI 2010. On tying a product metric to the user action it is meant to represent, the first thing a tracking break breaks.

=== step === complete
## What you now know before you trust a number

Driftwell's signups did not actually fall. The iOS release renamed the event the backend was counting, so real signups stopped being counted on one platform, and the dashboard showed a 26% drop that was never really there.

That answer did not come from a hunch. It came from running four checks, in order:

- Is it real? 740.6 sat 8.6 standard deviations below the pre-release mean, far past normal noise.
- Is it instrumentation? The iOS build on day 22 renamed the signup event, and the backend never learned the new name.
- Is it the calendar? Every weekday in the pre-release data behaved alike, so day 22 being a Monday explained nothing.
- Is it one segment? iOS fell 49.9% while Android stayed flat, so the drop sat entirely inside the platform that shipped the release.

The next time a number you track drops, run those same four checks, in that order, before deciding what caused it. The next lesson looks at what to do when the number that drops is a rate rather than a raw count, broken into the funnel steps that produce it.
