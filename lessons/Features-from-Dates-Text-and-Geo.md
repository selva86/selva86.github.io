---
title: "Feature Engineering Lesson 5: Features from Dates, Text and Geo"
catalog_blurb: "Turn timestamps, text and coordinates into numeric features a model can actually use."
description: "Turn raw columns into model-ready features in R: calendar parts and cyclical sine/cosine from timestamps, counts and flags from text, and haversine distance from coordinates."
keywords: "feature engineering, date features, cyclical encoding, sine cosine encoding, text features, bag of words, haversine distance, geospatial features, data leakage, R"
post_type: "LESSON"
curriculum_id: "6.60.5"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-feature-engineering"
course_title: "Feature Engineering in R"
course_lesson: "5"
course_total: "7"
course_landing: "R-Feature-Engineering-Course.html"
course_next: "Imputing-Missing-Values-in-Features.html"
course_prev: "Interaction-and-Spline-Features.html"
---

=== step === cover
::eyebrow Lesson 5 of 7
## Features from Dates, Text and Geo

In Lesson 4 you gave a linear model the power to bend, with interactions and splines. Those tricks reshaped columns that were already numbers. This lesson goes one step earlier, to the columns that are not numbers at all.

Meet our running example. Priya runs dispatch at a bike-courier food-delivery service, and she wants to predict how long each delivery will take. Her table has ten orders, and three of its columns hold things a model cannot do arithmetic on: `ordered_at` is a timestamp like `2026-02-07 20:05`, `note` is whatever the customer typed (say, "URGENT hand it to me directly"), and each order carries a pickup and a drop-off as raw latitude and longitude. A model only multiplies and adds, so as they stand these three columns are dead weight.

The widget below shows the whole job in one picture: the raw timestamp, note and coordinates on the left become tidy numeric feature columns on the right. That transformation is this entire lesson.

By the end you will be able to:

- Pull calendar features out of a timestamp, and encode cyclical time so late night sits next to early morning
- Turn a free-text note into numeric features a model can read
- Collapse a pickup and a drop-off into one honest distance
- Say which of these features are safe, and which can quietly leak the answer

**Prerequisites:** you can run R and read a data-frame column, you have dummy-coded a factor ([Encoding Categorical Variables](Encoding-Categorical-Variables.html)), and you have met target leakage ([Target Encoding Without Leakage](Target-Encoding-Without-Leakage.html)).

::widget table-transform {"code":"deliveries |> mutate(order_hour = hour(ordered_at), is_weekend = as.integer(wday(ordered_at) %in% c(1, 7)), trip_km = haversine_km(pickup_lat, pickup_lon, drop_lat, drop_lon))","caption":"The same three orders: on the left, three raw columns a model cannot read; on the right, five numeric features it can weigh.","before":{"cols":["ordered_at","note","drop_lat","drop_lon"],"rows":[["2026-02-02 12:15","leave at the door",37.7749,-122.4194],["2026-02-07 20:05","URGENT hand it to me directly",37.7620,-122.4350],["2026-02-19 22:15","URGENT no contact, leave at door",37.7340,-122.4460]]},"after":{"cols":["order_hour","is_weekend","note_urgent","trip_km","is_downtown"],"rows":[[12,0,0,3.22,1],[20,1,1,5.35,0],[22,0,1,8.28,0]]}}

=== step === concept
::eyebrow The shared problem
## Three columns a model cannot read

Every model you have built in this course eats a table of numbers and multiplies each column by a weight. Hand it the text "URGENT hand it to me directly" and there is nothing to multiply. Same for a timestamp, and same for a latitude paired with a longitude. The information is clearly there, a human reads urgency, rush hour and a long crosstown trip at a glance, but it is locked in the wrong TYPE.

Feature engineering from these columns is always the same move: read the raw value and emit one or more numeric columns that carry its signal. The plan for the lesson is exactly three passes of that move, one per raw type:

- **Dates:** a timestamp becomes hour, day-of-week, a weekend flag, and a cyclical encoding.
- **Text:** a note becomes its length, a word count, and keyword flags.
- **Geo:** a pickup and a drop-off become one distance, plus a landmark flag.

::widget process-flow {"steps":[{"title":"Raw columns","sub":"a timestamp, a free-text note, two coordinate pairs: nothing a model can multiply"},{"title":"Extract","sub":"read each raw value and emit numeric columns that carry its signal"},{"title":"Numeric features","sub":"order_hour, is_weekend, note_words, note_urgent, trip_km, is_downtown"},{"title":"Model","sub":"now every column is a number the model can weigh"}]}

Then one last pass asks the question that runs through this whole course: which of these new features are safe, and which can leak.

=== step === concept
::eyebrow Dates, part one
## Unpack the timestamp

Here is Priya's table. Each lesson runs in a fresh R session, so we build the ten orders right here (run this once). The timestamps arrive as plain text, so the first job is to PARSE them into a real date-time with `lubridate::ymd_hm()`, which reads a "year-month-day hour:minute" string.

```r
suppressPackageStartupMessages(library(lubridate))

deliveries <- data.frame(
  ordered_at = c("2026-02-02 12:15", "2026-02-05 19:40", "2026-02-07 20:05",
                 "2026-02-09 07:50", "2026-02-12 13:30", "2026-02-14 18:20",
                 "2026-02-16 11:05", "2026-02-19 22:15", "2026-02-21 09:35",
                 "2026-02-23 17:50"),
  note = c("leave at the door", "ring the bell twice, apartment 4B",
           "URGENT hand it to me directly", "call on arrival, gate code 1980",
           "extra napkins please, no contact", "leave with the front desk",
           "ring the bell, gate on the left", "URGENT no contact, leave at door",
           "call me, apartment bell is broken", "hand to front desk, extra napkins"),
  pickup_lat = c(37.7955, 37.7935, 37.7965, 37.7940, 37.7950, 37.7960, 37.7945, 37.7958, 37.7952, 37.7949),
  pickup_lon = c(-122.3937, -122.3970, -122.3925, -122.3950, -122.3940, -122.3930, -122.3948, -122.3935, -122.3942, -122.3951),
  drop_lat = c(37.7749, 37.8044, 37.7620, 37.7850, 37.7699, 37.7793, 37.7811, 37.7340, 37.7875, 37.7699),
  drop_lon = c(-122.4194, -122.2712, -122.4350, -122.4010, -122.4830, -122.4192, -122.4103, -122.4460, -122.3990, -122.4148),
  stringsAsFactors = FALSE
)
deliveries$ordered_at <- ymd_hm(deliveries$ordered_at)   # text -> real date-time
```

A parsed date-time is not itself a feature (a model cannot multiply "2026-02-07 20:05"), but now we can ask it questions. `hour()` pulls the hour of day, `wday(label = TRUE)` gives the weekday name, and `month()` the month number. Each answer is a plain number or a factor, exactly what a model wants.

```r
deliveries$order_hour  <- hour(deliveries$ordered_at)              # 0..23
deliveries$order_dow   <- wday(deliveries$ordered_at, label = TRUE, abbr = TRUE)
deliveries$order_month <- month(deliveries$ordered_at)            # 1..12
deliveries[, c("ordered_at", "order_hour", "order_dow", "order_month")]
#>             ordered_at order_hour order_dow order_month
#> 1  2026-02-02 12:15:00         12       Mon           2
#> 2  2026-02-05 19:40:00         19       Thu           2
#> 3  2026-02-07 20:05:00         20       Sat           2
#> 4  2026-02-09 07:50:00          7       Mon           2
#> 5  2026-02-12 13:30:00         13       Thu           2
#> 6  2026-02-14 18:20:00         18       Sat           2
#> 7  2026-02-16 11:05:00         11       Mon           2
#> 8  2026-02-19 22:15:00         22       Thu           2
#> 9  2026-02-21 09:35:00          9       Sat           2
#> 10 2026-02-23 17:50:00         17       Mon           2
```

One timestamp just became three features, and there are more (day of month, quarter, is-it-a-holiday) whenever they help.

::widget table-transform {"code":"deliveries$order_hour  <- hour(deliveries$ordered_at)\ndeliveries$order_dow   <- wday(deliveries$ordered_at, label = TRUE)\ndeliveries$order_month <- month(deliveries$ordered_at)","caption":"One timestamp fans out into calendar features a model can use: the hour, the weekday, the month. Order 3 is the Saturday-evening order.","before":{"cols":["ordered_at"],"rows":[["2026-02-02 12:15"],["2026-02-07 20:05"],["2026-02-09 07:50"]]},"after":{"cols":["order_hour","order_dow","order_month"],"rows":[[12,"Mon",2],[20,"Sat",2],[7,"Mon",2]]}}

=== step === tryit
::eyebrow Your turn
## Flag the weekend

A lazy Saturday delivery is not like a Monday lunch rush, so a weekend flag is a classic feature. The `wday()` function numbers days 1 to 7 starting at Sunday, so the weekend is day 1 (Sunday) and day 7 (Saturday). Fill in the blank so `is_weekend` is 1 on those two days and 0 otherwise.

```r
deliveries$is_weekend <- as.integer(wday(deliveries$ordered_at) %in% ____)
table(deliveries$is_weekend)
```
::check {"regex":"c\\(\\s*[17]\\s*,\\s*[17]\\s*\\)","gate":true,"difficulty":"beginner","ok":"Yes. wday() returns 1 for Sunday and 7 for Saturday, so %in% c(1, 7) marks exactly the weekend orders.","no":"You want the two weekend day-numbers: c(1, 7). wday() counts from Sunday = 1, so Saturday = 7."}
::solution
```r
deliveries$is_weekend <- as.integer(wday(deliveries$ordered_at) %in% c(1, 7))
table(deliveries$is_weekend)
#> 
#> 0 1 
#> 7 3
```

Three of the ten orders fall on a Saturday, so the flag is 1 for exactly those three.

=== step === concept
::eyebrow Dates, part two
## Time that wraps around

`order_hour` looks finished, but it hides a trap. As a plain number, hour 23 (11pm) and hour 0 (midnight) are as far apart as any two hours can be, 23 units. Yet on a clock they are neighbours, one minute apart. A model that treats the hour as a straight line will believe late night and early morning are opposites, which is nonsense for delivery demand.

The fix is to place each hour on a circle and hand the model its two coordinates. Sweep the 24 hours evenly around a circle and read off the horizontal and vertical position with cosine and sine:

\( s = \sin\left(\frac{2\pi h}{24}\right), \quad c = \cos\left(\frac{2\pi h}{24}\right) \)

Reading the symbols: \(h\) is the hour (0 to 23); \(2\pi\) is once around the circle in radians; dividing by 24 turns one hour into its slice of the circle. Call \(s\) the sine part (we will name the column `hour_sin`) and \(c\) the cosine part (`hour_cos`). The pair \((c, s)\) is the point for that hour, so two hours that are close on the clock now sit close on the circle, and their coordinates are close too. You need both numbers, not just one: on its own the sine repeats (3am and 9am share the same sine value), and only the cosine tells those two hours apart.

See it on three hours. Watch how 23 and 0 land almost on top of each other, while noon sits on the far side:

```r
clock <- function(h) {
  data.frame(hour     = h,
             hour_sin = round(sin(2 * pi * h / 24), 3),
             hour_cos = round(cos(2 * pi * h / 24), 3))
}
rbind(clock(23), clock(0), clock(12))
#>   hour hour_sin hour_cos
#> 1   23   -0.259    0.966
#> 2    0    0.000    1.000
#> 3   12    0.000   -1.000
```

Hour 23 sits at \((c, s) = (0.966, -0.259)\) and hour 0 at \((1.000, 0.000)\): almost the same point. Hour 12 is at \((-1.000, 0.000)\), the opposite side of the circle. Now build the two columns for every order:

```r
deliveries$hour_sin <- round(sin(2 * pi * deliveries$order_hour / 24), 3)
deliveries$hour_cos <- round(cos(2 * pi * deliveries$order_hour / 24), 3)
```

::widget table-transform {"code":"deliveries$hour_sin <- sin(2 * pi * deliveries$order_hour / 24)\ndeliveries$hour_cos <- cos(2 * pi * deliveries$order_hour / 24)","caption":"Each hour becomes a point on the circle. Hours 23 and 0 get nearly the same coordinates, so a model finally sees them as neighbours; 18:00 and 12:00 sit far apart.","before":{"cols":["order_hour"],"rows":[[0],[12],[18],[20],[23]]},"after":{"cols":["order_hour","hour_sin","hour_cos"],"rows":[[0,0,1],[12,0,-1],[18,-1,0],[20,-0.866,0.5],[23,-0.259,0.966]]}}

=== step === quiz
::eyebrow Check yourself
## Why not just use the raw hour?

A teammate says: encoding is overkill, just feed the model `order_hour` as a number from 0 to 23. For predicting a smooth daily pattern with a linear model, what breaks?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Nothing breaks; 0 to 23 already captures the time of day perfectly. ::no It captures the LABEL, but not the geometry. As a straight number, 11pm (23) and midnight (0) are 23 apart, the maximum possible gap, even though they are one minute apart in reality.
- The model treats midnight and 11pm as far apart, because 0 and 23 are 23 units apart on a line, so the daily cycle gets a false cliff at the wrap-around. ::ok Exactly. A raw hour is a line with a break between 23 and 0; sine and cosine wrap it into a circle so neighbouring hours have neighbouring values.
- Hours must always be split into 24 separate 0/1 columns, never anything else. ::no One-hot coding is a valid option, but it is not required and it throws away the ordering entirely (3am and 4am become unrelated columns). The cyclical pair keeps neighbours close with just two columns.

=== step === concept
::eyebrow Text, part one
## From a note to numbers

The `note` column is free text a customer typed. You will not do deep language modelling here (that is a course of its own); the win is a handful of cheap, sturdy signals that often carry real predictive value. Three of the most useful:

- **Length.** How many characters? A long fussy note ("URGENT no contact, leave at door") often means a trickier delivery than "leave at the door".
- **Word count.** Roughly the same idea, counted in words instead of characters.
- **Keyword flags.** A 0/1 column for a word that matters, such as whether the note shouts "urgent".

`stringr` gives one function for each: `str_length()` counts characters, `str_count(text, "\\S+")` counts runs of non-space characters (words), and `str_detect()` tests whether a pattern appears. We lowercase first with `str_to_lower()` so "URGENT" and "urgent" count as the same word.

```r
suppressPackageStartupMessages(library(stringr))

deliveries$note_chars  <- str_length(deliveries$note)
deliveries$note_words  <- str_count(deliveries$note, "\\S+")
deliveries$note_urgent <- as.integer(str_detect(str_to_lower(deliveries$note), "urgent"))
deliveries[, c("note", "note_chars", "note_words", "note_urgent")]
#>                                 note note_chars note_words note_urgent
#> 1                  leave at the door         17          4           0
#> 2  ring the bell twice, apartment 4B         33          6           0
#> 3      URGENT hand it to me directly         29          6           1
#> 4    call on arrival, gate code 1980         31          6           0
#> 5   extra napkins please, no contact         32          5           0
#> 6          leave with the front desk         25          5           0
#> 7    ring the bell, gate on the left         31          7           0
#> 8   URGENT no contact, leave at door         32          6           1
#> 9  call me, apartment bell is broken         33          6           0
#> 10 hand to front desk, extra napkins         33          6           0
```

Two orders shout "urgent", and their `note_urgent` is 1. None of this understands language; it just turns cheap surface signals into columns.

::widget table-transform {"code":"note_chars  <- str_length(note)\nnote_urgent <- str_detect(str_to_lower(note), \"urgent\")","caption":"The same note becomes three numbers: how long it is, how many words, and whether it shouts urgent.","before":{"cols":["note"],"rows":[["leave at the door"],["URGENT hand it to me directly"],["call on arrival, gate code 1980"]]},"after":{"cols":["note_chars","note_words","note_urgent"],"rows":[[17,4,0],[29,6,1],[31,6,0]]}}

=== step === tryit
::eyebrow Your turn
## Flag a contactless drop-off

Many customers ask the courier to leave the order somewhere rather than hand it over, and that is worth its own 0/1 feature. Use `str_detect()` on the lowercased note to flag every order whose note mentions leaving it. Fill in the pattern to search for.

```r
deliveries$note_dropoff <- as.integer(str_detect(str_to_lower(deliveries$note), ____))
sum(deliveries$note_dropoff)
```
::check {"regex":"leave","gate":true,"difficulty":"beginner","ok":"Right. str_detect() returns TRUE wherever the pattern appears, and as.integer() turns that into a 0/1 column.","no":"Pass the word to match as a quoted string. str_to_lower() already lowercased the note, so match it in lower case."}
::solution
```r
deliveries$note_dropoff <- as.integer(str_detect(str_to_lower(deliveries$note), "leave"))
sum(deliveries$note_dropoff)
#> [1] 3
```

Three notes ask you to leave the order, so the flag sums to 3.

=== step === concept
::eyebrow Text, part two
## A bag of words, and where it leaks

Keyword flags do not scale: you cannot hand-pick a column for every useful word. The systematic version is the **bag of words**. Pick a vocabulary (a fixed list of words worth tracking) and make one 0/1 column per word, set to 1 when the note contains it. Grammar and order are thrown away, only presence is kept, hence "bag".

```r
vocab <- c("door", "bell", "gate", "napkins", "urgent", "desk")
bag <- sapply(vocab, function(w) as.integer(str_detect(str_to_lower(deliveries$note), fixed(w))))
colnames(bag) <- paste0("has_", vocab)
head(bag, 6)
#>      has_door has_bell has_gate has_napkins has_urgent has_desk
#> [1,]        1        0        0           0          0        0
#> [2,]        0        1        0           0          0        0
#> [3,]        0        0        0           0          1        0
#> [4,]        0        0        1           0          0        0
#> [5,]        0        0        0           1          0        0
#> [6,]        0        0        0           0          0        1
```

Here is the catch, and it is the theme of this whole course. That `vocab` is not handed down from above; in a real project you LEARN it from the data, usually by keeping the most frequent words in your training notes. That makes the bag of words a **learned transform**, exactly like the target encoding in Lesson 2. If you build the vocabulary from the full dataset before splitting, words that appear only in the test notes help decide your columns, and the test set has leaked into your features.

[WARNING]
A keyword flag for a fixed word like "urgent" is safe: it reads only the current row. A bag of words whose vocabulary is chosen from the data is a learned transform: pick the vocabulary on the training rows only, then apply that same fixed list to the test rows.

There is also a plain cost: a big vocabulary means hundreds of mostly-zero columns (a sparse, high-cardinality block) that can swamp a simple model. Keep the vocabulary small and purposeful, or reach for TF-IDF and embeddings once shallow flags stop paying off.

::widget table-transform {"code":"vocab <- c(\"door\", \"bell\", \"gate\", \"urgent\")\nbag <- sapply(vocab, function(w) as.integer(str_detect(str_to_lower(note), fixed(w))))","caption":"Four notes, four words tracked: each note becomes a row of 0/1 flags. Real vocabularies are longer, and learned from the training notes only.","before":{"cols":["note"],"rows":[["leave at the door"],["ring the bell twice, apartment 4B"],["URGENT hand it to me directly"],["call on arrival, gate code 1980"]]},"after":{"cols":["has_door","has_bell","has_urgent","has_gate"],"rows":[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]}}

=== step === quiz
::eyebrow Check yourself
## Where can a bag of words leak?

You build your bag-of-words vocabulary by taking the 200 most common words across ALL of your notes, then split into train and test to score the model. The score looks great. What went wrong?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- The vocabulary was chosen using the test notes too, so the test set helped decide which feature columns exist. It must come from the training notes only, then be applied unchanged to the test notes. ::ok Right. Choosing the words is a learned step. Fit it on the training fold, freeze the list, and apply that same list to new data, like any other learned transform in this course.
- Nothing leaked; a bag of words is a fixed formula, so it cannot leak. ::no The formula is fixed only AFTER you pick the vocabulary, and you picked it from every note including the test ones. That choice is where the test set crept in.
- A bag of words can never be used with a train/test split. ::no It can, and should. You build the vocabulary on the training notes and reuse that exact list on the test notes, which is what a preprocessing pipeline does for you.

=== step === concept
::eyebrow Geo, part one
## Two pins are not a number

Each order carries four more raw numbers: a pickup latitude and longitude, and a drop-off latitude and longitude. On their own they are nearly useless to a model. A latitude of 37.79 is not "big" or "small" in any way the delivery time cares about; what matters is the RELATIONSHIP between the two pins, above all how far apart they are.

Plot the orders and the problem is obvious. The pickups (the restaurants) cluster tightly downtown, while the drop-offs scatter across the city. Raw coordinates only place dots on a map; the feature we actually want is the length of the line between each pickup and its drop-off. Run the chart to see the pins.

::widget chart-plotter {"x":"lon","y":"lat","geoms":["point"],"data":[{"x":-122.3937,"y":37.7955,"fill":"pickup"},{"x":-122.3925,"y":37.7965,"fill":"pickup"},{"x":-122.3950,"y":37.7940,"fill":"pickup"},{"x":-122.3930,"y":37.7960,"fill":"pickup"},{"x":-122.4194,"y":37.7749,"fill":"drop"},{"x":-122.2712,"y":37.8044,"fill":"drop"},{"x":-122.4350,"y":37.7620,"fill":"drop"},{"x":-122.4830,"y":37.7699,"fill":"drop"},{"x":-122.4460,"y":37.7340,"fill":"drop"},{"x":-122.3990,"y":37.7875,"fill":"drop"}],"code":{"point":"library(ggplot2)\nggplot(df, aes(lon, lat, color = group)) +\n  geom_point(size = 3)"}}

The dots carry the information, but a model needs one number per order. That number is the distance.

=== step === concept
::eyebrow Geo, part two
## One number: how far apart

The distance between two points on a globe is the **great-circle distance**, the length of the shortest arc over the curved surface. The standard formula for it is the **haversine**. With latitudes and longitudes converted to radians:

\( a = \sin^2\left(\frac{\Delta\varphi}{2}\right) + \cos\varphi_1 \cos\varphi_2 \sin^2\left(\frac{\Delta\lambda}{2}\right), \quad d = 2R\arcsin\left(\sqrt{a}\right) \)

Reading the symbols: \(\varphi_1\) and \(\varphi_2\) are the two latitudes; \(\Delta\varphi\) is the difference in latitude and \(\Delta\lambda\) the difference in longitude; \(R\) is the Earth's radius (about 6371 km); \(d\) is the distance you want. The middle quantity \(a\) is just a convenient halfway step. Degrees become radians by multiplying by \(\pi/180\). In R that is a short function:

```r
haversine_km <- function(lat1, lon1, lat2, lon2) {
  R    <- 6371                       # Earth's radius in kilometres
  p1   <- lat1 * pi / 180            # latitudes, degrees -> radians
  p2   <- lat2 * pi / 180
  dphi <- (lat2 - lat1) * pi / 180   # change in latitude, in radians
  dlam <- (lon2 - lon1) * pi / 180   # change in longitude, in radians
  a    <- sin(dphi / 2)^2 + cos(p1) * cos(p2) * sin(dlam / 2)^2
  2 * R * asin(sqrt(a))
}
```

Never trust a formula you have not seen fire. Check it on a pair you can sanity-check by eye, from a point near the waterfront across the bay, which should be roughly 11 km:

```r
round(haversine_km(37.7955, -122.3937, 37.8044, -122.2712), 2)
#> [1] 10.81
```

10.81 km, which matches the real crossing. The same function also builds a LANDMARK feature: the distance from each drop-off to a fixed downtown pin. Anything within 2 km we will call a downtown drop.

```r
centre_lat <- 37.7793; centre_lon <- -122.4192          # a fixed downtown point
deliveries$to_centre_km <- round(haversine_km(deliveries$drop_lat, deliveries$drop_lon,
                                              centre_lat, centre_lon), 2)
deliveries$is_downtown  <- as.integer(deliveries$to_centre_km < 2)
sum(deliveries$is_downtown)
#> [1] 5
```

Notice the landmark pin is a FIXED number we chose, not something learned from the data, so `is_downtown` reads only the current row. Hold that thought for the last step.

=== step === tryit
::eyebrow Your turn
## Measure every trip

Now use `haversine_km()` to turn each order's two pins into the one feature that matters: the straight-line trip distance. Fill in the function name.

```r
deliveries$trip_km <- ____(deliveries$pickup_lat, deliveries$pickup_lon,
                           deliveries$drop_lat, deliveries$drop_lon)
round(head(deliveries$trip_km), 2)
```
::check {"regex":"haversine_km","gate":true,"difficulty":"beginner","ok":"That is the feature: one honest distance per order, ready for the model.","no":"Call the function you just defined: haversine_km(pickup_lat, pickup_lon, drop_lat, drop_lon)."}
::solution
```r
deliveries$trip_km <- haversine_km(deliveries$pickup_lat, deliveries$pickup_lon,
                                   deliveries$drop_lat, deliveries$drop_lon)
round(head(deliveries$trip_km), 2)
#> [1]  3.22 11.12  5.35  1.13  8.30  2.96
```

Four raw coordinates per order collapsed into one meaningful number. The cross-bay order (11.12 km) really is the longest of the first six.

=== step === concept
::eyebrow The unifying idea
## Stateless or learned?

Step back and sort every feature you built by one question: does computing it need anything beyond the current row?

| Feature | Needs only this row? | Kind |
|---|---|---|
| order_hour, is_weekend, hour_sin / hour_cos | yes | stateless |
| note_chars, note_words, note_urgent | yes | stateless |
| trip_km, is_downtown (fixed pin) | yes | stateless |
| bag-of-words vocabulary | no (learned from many notes) | learned |
| neighbourhood average delivery time | no (learned from the target) | learned |
| standardized version of trip_km | no (needs the training mean and sd) | learned |

The stateless features cannot leak: each row's value is computed from that row alone, so it makes no difference whether the row is in train or test. The learned features are exactly the ones this course keeps warning about, target encoding, scaling, spline knots, and now a text vocabulary. They must be fit on the training rows only, then applied unchanged to new rows.

The clean way to guarantee that is to put every transform, stateless or learned, inside a preprocessing pipeline that is fit on train and replayed on test. In tidymodels the date and holiday features are one step each:

```r-static
library(recipes)
# The recipe LEARNS only from the training rows, then bakes new data the same way.
rec <- recipe(minutes ~ ordered_at + note + pickup_lat + drop_lat, data = train) |>
  step_date(ordered_at, features = c("dow", "month")) |>   # calendar parts
  step_holiday(ordered_at) |>                              # public-holiday flags
  step_dummy(all_nominal_predictors())                     # factors -> 0/1 columns
# prep(rec) fits on train; bake(rec, test) applies the SAME rules to the test set.
```

[KEY INSIGHT]
Ask of every feature: could I compute it for a single new row, alone, with nothing else? If yes, it is stateless and safe. If it needs a summary of many rows (a vocabulary, a mean, an sd), it is learned and belongs inside a pipeline fit on the training set only.

=== step === quiz
::eyebrow Check yourself
## Which one must be fit on train only?

Priya wants to add four features. Three are safe to compute row by row on the whole dataset. Which ONE is a learned transform that must be fit on the training rows only?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- `hour_sin` and `hour_cos` from the order time. ::no These read only the current row's hour, so they are stateless and cannot leak. Compute them anywhere.
- `trip_km`, the haversine distance between the two pins. ::no The distance uses only that order's four coordinates, nothing learned across rows. Stateless and safe.
- The average past delivery time for the drop-off neighbourhood, added as a column. ::ok Right. That average is learned from the target across many rows, so computing it on all data leaks the test outcomes. Fit it on the training fold and apply it to the rest, like the target encoding in Lesson 2.
- `note_urgent`, a 0/1 flag for whether the note contains "urgent". ::no A fixed keyword flag reads only the current note, so it is stateless. It is the LEARNED vocabulary of a full bag of words that must be fit on train.

=== step === concept
::eyebrow Go deeper
## References

- [Kuhn & Johnson, Feature Engineering and Selection (free online)](http://www.feat.engineering/) - the standard reference for engineering features from dates, text and more, with the reasoning behind each choice.
- [lubridate reference (tidyverse)](https://lubridate.tidyverse.org/) - every date-time accessor used here (hour, wday, month, and parsers like ymd_hm).
- [recipes: step_date and friends (tidymodels)](https://recipes.tidymodels.org/reference/step_date.html) - the leak-free way to build date, holiday and dummy features inside a pipeline.
- [geosphere package (CRAN)](https://cran.r-project.org/web/packages/geosphere/index.html) - production-grade great-circle and other spatial distances when you outgrow the hand-rolled haversine.

=== step === complete
## Lesson 5 complete

You turned three columns a model cannot read into features it can: calendar parts and a cyclical sine/cosine from the timestamp, length, counts and keyword flags from the note, and one honest haversine distance from the coordinates. Then you sorted them by the question that matters: stateless features that are leak-safe by construction, and learned features (a vocabulary, a mean) that must be fit on the training set only.

Next, Lesson 6: Imputing Missing Values in Features. Real feature columns arrive with holes in them, and filling those holes is itself a learned step, so it has to happen inside the pipeline, for exactly the reason you just met here.
