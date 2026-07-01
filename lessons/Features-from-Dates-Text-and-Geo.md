---
title: "Feature Engineering Lesson 5: Features from Dates, Text and Geo"
catalog_blurb: "Turn timestamps, text and coordinates into numeric features a model can actually use."
description: "Engineer model-ready features from timestamps, text and coordinates in R: date parts, cyclical hour encoding, keyword flags, and great-circle distance."
keywords: "feature engineering, date features, lubridate, cyclical encoding, text features, stringr, haversine distance, geospatial features, R, model-ready columns"
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

Picture a food-delivery app at dinnertime. Order #4811 lands at 7:40pm on a Saturday. The customer typed a note, "Please hurry, the kids are starving." The food leaves a pizzeria at one pair of map coordinates and has to reach a flat about 2 km away.

To a model, that order is three useless raw fields: a timestamp string, a sentence, and four decimal numbers. A model only eats numbers, and not one of these is a number it can learn from yet. Feature engineering is the craft of turning them into ones that are.

In the last lesson you reshaped a feature you already had. This lesson manufactures features out of columns that are not numbers at all, a timestamp, a piece of text, a pair of coordinates, and you will do it for all three.

By the end you will be able to:

- Crack a timestamp into calendar parts, and encode the cyclical ones so 11pm sits next to midnight
- Turn a free-text note into numeric signals a model can use
- Collapse two map coordinates into a single distance feature

Press Run on the table below to watch one raw timestamp column become three model-ready ones.

**Prerequisites:** you can write a `mutate()` ([The dplyr Verbs](The-dplyr-Verbs.html)) and you know a model is fed a table of numbers ([Train/Validation/Test and Data Leakage](Train-Validation-Test-and-Data-Leakage.html)). The date and string functions are re-taught from scratch as we go.

::widget table-transform {"caption":"Each timestamp becomes columns a model can read: the hour of day, the weekday, and a weekend flag.","before":{"cols":["order_id","placed_at"],"rows":[[4811,"2026-03-14 19:40"],[4813,"2026-03-16 08:20"],[4814,"2026-03-16 21:55"],[4817,"2026-03-20 23:15"]]},"after":{"cols":["order_id","placed_at","hour","weekday","is_weekend"],"rows":[[4811,"2026-03-14 19:40",19,"Sat",1],[4813,"2026-03-16 08:20",8,"Mon",0],[4814,"2026-03-16 21:55",21,"Mon",0],[4817,"2026-03-20 23:15",23,"Fri",0]]},"code":"library(lubridate)\ndf %>% mutate(\n  hour       = hour(ymd_hm(placed_at)),\n  weekday    = wday(ymd_hm(placed_at), label = TRUE),\n  is_weekend = as.integer(wday(ymd_hm(placed_at)) %in% c(1, 7))\n)"}

=== step === concept
::eyebrow Dates
## A timestamp is a stack of features

A single timestamp like `2026-03-14 19:40` quietly contains a dozen features. Buried inside it are the hour (dinner rush or 3am?), the day of week (weekday commute or lazy Sunday?), the month and season, and whether it is a weekend. A model cannot see any of that while the timestamp is still text. The first job is to parse the text into a real date-time, then pull the parts out into columns of their own.

First, the data. Each lesson runs in a fresh R session, so we build the orders table right here (run this once):

```r
library(dplyr)
library(lubridate)
library(stringr)

# 8 food-delivery orders: a raw timestamp, a free-text note, and pickup/drop coordinates.
orders <- tibble(
  order_id  = 4811:4818,
  placed_at = c("2026-03-14 19:40", "2026-03-15 12:05", "2026-03-16 08:20",
                "2026-03-16 21:55", "2026-03-17 13:30", "2026-03-18 19:10",
                "2026-03-20 23:15", "2026-03-21 18:45"),
  note      = c("Please hurry, the kids are starving",
                "Leave at the door and ring twice",
                "",
                "Extra napkins please",
                "URGENT - meeting starts soon",
                "No contact delivery, thanks!",
                "Call me when you arrive",
                "Ring the top buzzer, hurry please"),
  rest_lat  = c(40.7128, 40.7320, 40.7480, 40.7128, 40.7600, 40.7128, 40.7350, 40.7500),
  rest_lng  = c(-74.0060, -73.9870, -73.9850, -74.0060, -73.9810, -74.0060, -73.9900, -73.9700),
  cust_lat  = c(40.7300, 40.7100, 40.7700, 40.7400, 40.7350, 40.7600, 40.7150, 40.7800),
  cust_lng  = c(-73.9950, -74.0100, -73.9600, -73.9900, -73.9700, -73.9750, -74.0000, -73.9550)
)
glimpse(orders)
#> Rows: 8
#> Columns: 8
#> $ order_id  <int> 4811, 4812, 4813, 4814, 4815, 4816, 4817, 4818
#> $ placed_at <chr> "2026-03-14 19:40", "2026-03-15 12:05", "2026-03-16 08:20", ...
#> $ note      <chr> "Please hurry, the kids are starving", "Leave at the door ...
```

The `lubridate` package parses dates and dissects them. `ymd_hm()` reads a "year-month-day hour:minute" string into a real datetime; then `hour()`, `wday()` and `month()` pull each piece out into its own column. We wrap them in `transmute()`, which is `mutate()` that keeps only the columns you name and drops the rest, so `features` holds just these:

```r
features <- orders |>
  transmute(
    order_id,
    placed     = ymd_hm(placed_at),                      # text -> a real datetime
    hour       = hour(placed),                            # 0 to 23
    weekday    = wday(placed, label = TRUE),              # Sun, Mon, ...
    is_weekend = as.integer(wday(placed) %in% c(1, 7)),   # wday: 1 = Sun, 7 = Sat
    month      = month(placed, label = TRUE)
  )
features
#> # A tibble: 8 x 6
#>   order_id placed               hour weekday is_weekend month
#>      <int> <dttm>              <int> <ord>        <int> <ord>
#> 1     4811 2026-03-14 19:40:00    19 Sat              1 Mar
#> 2     4812 2026-03-15 12:05:00    12 Sun              1 Mar
#> 3     4813 2026-03-16 08:20:00     8 Mon              0 Mar
#> 4     4814 2026-03-16 21:55:00    21 Mon              0 Mar
#> 5     4815 2026-03-17 13:30:00    13 Tue              0 Mar
#> 6     4816 2026-03-18 19:10:00    19 Wed              0 Mar
#> 7     4817 2026-03-20 23:15:00    23 Fri              0 Mar
#> 8     4818 2026-03-21 18:45:00    18 Sat              1 Mar
```

A handful of parts worth manufacturing from almost any timestamp:

- **hour / part of day** - rush hour, overnight, lunchtime
- **day of week** and an **is_weekend** flag - behaviour shifts sharply on weekends
- **month / quarter / season** - seasonality
- **is_holiday** - checked against a holiday calendar for your country
- **days since a reference event** - tenure, recency, time to a deadline

One caution before we go on: do not blindly add all of them. A tree-based model can split on a raw `hour` perfectly well, so the cyclical trick we meet next matters most for linear and distance-based models. Engineer the parts the problem actually needs.

=== step === concept
::eyebrow Dates: the cyclical trap
## Why 11pm and midnight should be neighbours

There is a trap hiding in that tidy `hour` column. As a plain number, the hours run 0, 1, 2, all the way to 23, and then snap back to 0. So 23:00 and 00:00, just one hour apart in real life, look 23 units apart to the model, while 00:00 and 01:00 look 1 apart. The number line has a cliff at midnight that the clock does not.

The fix is to bend the straight 0-to-23 line into a circle, so the last hour wraps around right next to the first. We place each hour at an angle and read off its position with sine and cosine:

\( \text{hour\_sin} = \sin\!\left(\frac{2\pi h}{24}\right), \qquad \text{hour\_cos} = \cos\!\left(\frac{2\pi h}{24}\right) \)

Here \(h\) is the hour from 0 to 23, and \(\frac{2\pi h}{24}\) turns it into an angle around a full circle (24 hours equals \(2\pi\) radians, one whole turn). The two numbers `hour_sin` and `hour_cos` together pin each hour to a point on a clock face. Now 23:00 and 00:00 land right next to each other, exactly as they should.

::widget chart-plotter {"x":"hour_cos","y":"hour_sin","geoms":["point"],"data":[{"x":1,"y":0},{"x":0.966,"y":0.259},{"x":0.866,"y":0.5},{"x":0.707,"y":0.707},{"x":0.5,"y":0.866},{"x":0.259,"y":0.966},{"x":0,"y":1},{"x":-0.259,"y":0.966},{"x":-0.5,"y":0.866},{"x":-0.707,"y":0.707},{"x":-0.866,"y":0.5},{"x":-0.966,"y":0.259},{"x":-1,"y":0},{"x":-0.966,"y":-0.259},{"x":-0.866,"y":-0.5},{"x":-0.707,"y":-0.707},{"x":-0.5,"y":-0.866},{"x":-0.259,"y":-0.966},{"x":0,"y":-1},{"x":0.259,"y":-0.966},{"x":0.5,"y":-0.866},{"x":0.707,"y":-0.707},{"x":0.866,"y":-0.5},{"x":0.966,"y":-0.259}],"code":{"point":"ggplot(df, aes(hour_cos, hour_sin)) +\n  geom_point(size = 3, colour = \"#1f7a55\") +\n  coord_equal() +\n  labs(title = \"Every hour placed on a 24-hour circle\")"}}

Every hour sits on the circle. Trace it: hour 23 and hour 0 are neighbours, not opposites. Here is the encoding computed for the hours either side of midnight:

```r
hrs <- c(22, 23, 0, 1, 2)
clock <- tibble(
  hour     = hrs,
  hour_sin = round(sin(2 * pi * hrs / 24), 3),
  hour_cos = round(cos(2 * pi * hrs / 24), 3)
)
clock
#> # A tibble: 5 x 3
#>    hour hour_sin hour_cos
#>   <dbl>    <dbl>    <dbl>
#> 1    22   -0.5      0.866
#> 2    23   -0.259    0.966
#> 3     0    0        1
#> 4     1    0.259    0.966
#> 5     2    0.5      0.866
```

Look at hours 23 and 0: their sine and cosine are almost identical, so in feature space they sit right on top of each other. The midnight cliff is gone.

This cyclical encoding pays off for models that measure distance or fit straight lines (linear and logistic regression, kNN, neural nets). Tree models split on thresholds and mostly shrug at the midnight cliff, so do not bother encoding cyclically for them. The same trick works for day of week (period 7) and month (period 12).

=== step === quiz
::eyebrow Check yourself
## The midnight cliff

You feed a logistic-regression model the raw `hour` column (0 to 23) to predict late deliveries. Orders at 23:00 and at 00:00 behave almost identically in reality, but the model treats them as far apart. What is the right fix?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Drop the hour feature; time of day cannot matter to a linear model. ::no Time of day matters a lot here (the dinner rush is real). The problem is the ENCODING, not the feature.
- Replace raw hour with its sine and cosine, so 23:00 and 00:00 land next to each other on a circle. ::ok Right. Cyclical sin/cos encoding removes the artificial midnight cliff, so hours that are close in time become close in feature space too.
- Standardize hour to mean 0 and standard deviation 1. ::no Centering and scaling only shifts and stretches the same straight line; 23:00 and 00:00 stay 23 units apart. Only wrapping the hours onto a circle fixes the cliff.

=== step === concept
::eyebrow Text
## A note is a bag of cheap signals

Free text looks hopeless to a model, a different sentence in every row. But you rarely need to *understand* the text to get value from it; you can often just *measure* it. The simplest, sturdiest text features are counts and flags, computed one row at a time with the `stringr` package:

- **length** with `str_length()` - longer instructions may signal a fussier or trickier delivery
- **word count** with `str_count()`
- **keyword flags** with `str_detect()` - does the note say *hurry*, *urgent*, *fragile*, *gate code*?
- **has-digits or all-caps** - a flat number to call, a SHOUTED instruction

Press Run to turn the note column into three numeric ones.

::widget table-transform {"caption":"A sentence becomes numbers: how long it is, how many words, and whether it signals urgency.","before":{"cols":["order_id","note"],"rows":[[4811,"Please hurry, the kids are starving"],[4812,"Leave at the door and ring twice"],[4813,""],[4815,"URGENT - meeting starts soon"]]},"after":{"cols":["order_id","note","note_len","word_count","has_urgent"],"rows":[[4811,"Please hurry, the kids are starving",35,6,1],[4812,"Leave at the door and ring twice",32,7,0],[4813,"",0,0,0],[4815,"URGENT - meeting starts soon",28,4,1]]},"code":"library(stringr)\ndf %>% mutate(\n  note_len   = str_length(note),\n  word_count = str_count(note, \"[A-Za-z]+\"),\n  has_urgent = as.integer(str_detect(str_to_lower(note), \"hurry|urgent|asap\"))\n)"}

These are the cheap, sturdy end of natural-language features. Full text modelling, TF-IDF, word embeddings, transformers, lives further up the road (and in the NLP course). But a length and a few keyword flags cost almost nothing, and they often capture most of the signal a short note actually carries. Start here.

=== step === tryit
::eyebrow Your turn
## Flag the urgent orders

You suspect notes that beg the driver to *hurry* (or shout *URGENT*) predict a tighter delivery window. Build a 0/1 flag that is 1 when the note contains any of `hurry`, `urgent`, or `asap`. We lowercase the note first with `str_to_lower()` so `URGENT` and `urgent` both match; you fill in the search pattern for `str_detect()`. Inside a regex, `|` means OR.

```r
urgent_orders <- orders |>
  mutate(is_urgent = as.integer(str_detect(str_to_lower(note), ____))) |>
  filter(is_urgent == 1) |>
  select(order_id, note, is_urgent)
urgent_orders
```
::check {"regex":"(hurry|urgent|asap)","gate":true,"difficulty":"beginner","ok":"Nice. str_detect returns TRUE/FALSE for each note, and as.integer turns that into the 0/1 column a model wants.","no":"Pass the alternation as a quoted string: \"hurry|urgent|asap\". The | means OR, so it matches a note containing any of the three words."}
::solution
```r
urgent_orders <- orders |>
  mutate(is_urgent = as.integer(str_detect(str_to_lower(note), "hurry|urgent|asap"))) |>
  filter(is_urgent == 1) |>
  select(order_id, note, is_urgent)
urgent_orders
#> # A tibble: 3 x 3
#>   order_id note                                is_urgent
#>      <int> <chr>                                   <int>
#> 1     4811 Please hurry, the kids are starving         1
#> 2     4815 URGENT - meeting starts soon                1
#> 3     4818 Ring the top buzzer, hurry please           1
```

=== step === concept
::eyebrow Geo
## Two points, one distance

Now the coordinates. Each order has a pickup point (the restaurant) and a drop point (the customer), each a latitude/longitude pair. Handing those four raw numbers to a model is close to useless: a latitude of 40.71 means nothing on its own, and the model has no way to know that two nearby points are nearby. The *useful* feature is the one thing a courier actually cares about, how far apart they are.

The honest way to measure the distance between two points on the globe is the **Haversine formula**, the great-circle (shortest path over a sphere) distance:

\( a = \sin^2\!\left(\frac{\Delta\phi}{2}\right) + \cos\phi_1 \cos\phi_2 \, \sin^2\!\left(\frac{\Delta\lambda}{2}\right) \)

\( d = 2R \,\arcsin\!\left(\sqrt{a}\right) \)

Reading the symbols: \(\phi_1, \phi_2\) are the two latitudes and \(\lambda_1, \lambda_2\) the two longitudes (in radians); \(\Delta\phi\) and \(\Delta\lambda\) are the differences between them; \(R \approx 6371\) km is the Earth's radius; and \(d\) is the distance along the surface. The \(\cos\phi_1\cos\phi_2\) term corrects for lines of longitude bunching closer together as you move away from the equator.

It is a few lines of base R, and it vectorizes over the whole column at once:

```r
# Haversine: great-circle distance (km) between two lat/lng points (Earth radius 6371 km).
haversine_km <- function(lat1, lon1, lat2, lon2) {
  to_rad <- pi / 180
  dlat <- (lat2 - lat1) * to_rad
  dlon <- (lon2 - lon1) * to_rad
  a <- sin(dlat / 2)^2 +
       cos(lat1 * to_rad) * cos(lat2 * to_rad) * sin(dlon / 2)^2
  2 * 6371 * asin(pmin(1, sqrt(a)))
}

orders |>
  mutate(distance_km = round(
    haversine_km(rest_lat, rest_lng, cust_lat, cust_lng), 2)) |>
  select(order_id, distance_km)
#> # A tibble: 8 x 2
#>   order_id distance_km
#>      <int>       <dbl>
#> 1     4811        2.13
#> 2     4812        3.12
#> 3     4813        3.23
#> 4     4814        3.31
#> 5     4815        2.93
#> 6     4816        5.86
#> 7     4817        2.38
#> 8     4818        3.57
```

::widget table-transform {"caption":"Two coordinate pairs collapse into one number a model can use: the straight-line distance in kilometers.","before":{"cols":["order_id","rest_lat","rest_lng","cust_lat","cust_lng"],"rows":[[4811,40.7128,-74.006,40.73,-73.995],[4813,40.748,-73.985,40.77,-73.96],[4817,40.735,-73.99,40.715,-74]]},"after":{"cols":["order_id","rest_lat","rest_lng","cust_lat","cust_lng","distance_km"],"rows":[[4811,40.7128,-74.006,40.73,-73.995,2.13],[4813,40.748,-73.985,40.77,-73.96,3.23],[4817,40.735,-73.99,40.715,-74,2.38]]},"code":"df %>% mutate(\n  distance_km = round(2 * 6371 * asin(sqrt(\n    sin((cust_lat - rest_lat) * pi / 180 / 2)^2 +\n    cos(rest_lat * pi / 180) * cos(cust_lat * pi / 180) *\n    sin((cust_lng - rest_lng) * pi / 180 / 2)^2\n  )), 2))"}

A caveat worth knowing: Haversine gives the straight-line distance over a perfect sphere. Real delivery follows roads, so the true trip is longer, and Earth is a slightly squashed sphere, so very long distances drift by a fraction of a percent. For most models the great-circle distance is a strong, cheap feature; when you genuinely need road distance or travel time, those come from a routing API, not a formula.

=== step === quiz
::eyebrow Check yourself
## Why distance beats raw coordinates

A teammate skips the distance calculation and feeds the four raw columns `rest_lat`, `rest_lng`, `cust_lat`, `cust_lng` straight into a linear model. Why is the engineered `distance_km` usually a far better feature?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- A linear model treats each coordinate as a separate number and cannot combine four of them into "how far apart"; distance_km hands it the exact quantity that drives delivery time. ::ok Exactly. The thing the model needs (closeness) is a nonlinear combination of all four raw columns. Computing the distance yourself gives the model the signal directly instead of hoping it reverse-engineers the Haversine formula on its own.
- Raw coordinates always slow training down too much to use. ::no Speed is not the issue; four columns are cheap. The problem is that the raw numbers do not express the thing that matters, the distance between the two points.
- Latitude and longitude are categorical, so a model cannot use them at all. ::no They are perfectly good continuous numbers. The trouble is only that, on their own, they do not encode the distance the model actually needs.

=== step === concept
::eyebrow The payoff
## Built row by row, so it cannot leak

Put the three acts together and the order that was three useless raw fields becomes a tidy block of numbers a model can learn from:

```r
model_ready <- orders |>
  transmute(
    order_id,
    # --- from the timestamp ---
    hour        = hour(ymd_hm(placed_at)),
    is_weekend  = as.integer(wday(ymd_hm(placed_at)) %in% c(1, 7)),
    hour_sin    = sin(2 * pi * hour / 24),
    hour_cos    = cos(2 * pi * hour / 24),
    # --- from the note ---
    note_len    = str_length(note),
    has_urgent  = as.integer(str_detect(str_to_lower(note), "hurry|urgent|asap")),
    # --- from the coordinates ---
    distance_km = round(haversine_km(rest_lat, rest_lng, cust_lat, cust_lng), 2)
  )
glimpse(model_ready)
#> Rows: 8
#> Columns: 8
#> $ order_id    <int> 4811, 4812, 4813, 4814, 4815, 4816, 4817, 4818
#> $ hour        <int> 19, 12, 8, 21, 13, 19, 23, 18
#> $ is_weekend  <int> 1, 1, 0, 0, 0, 0, 0, 1
#> $ hour_sin    <dbl> -0.966, 0, 0.866, -0.707, -0.259, -0.966, -0.259, -1
#> $ note_len    <int> 35, 32, 0, 20, 28, 28, 23, 33
#> $ has_urgent  <int> 1, 0, 0, 0, 1, 0, 0, 1
#> $ distance_km <dbl> 2.13, 3.12, 3.23, 3.31, 2.93, 5.86, 2.38, 3.57
```

Look at what every one of those features has in common. Each is computed from a single row using only that row's own values: the hour from this order's timestamp, the urgency flag from this order's note, the distance from this order's two points. Nothing was learned by looking across rows.

[KEY INSIGHT]
Row-wise features are leak-safe by construction. Because each value depends only on its own row, it is identical whether you compute it before or after a train/test split. So unlike the target encoding (Lesson 2), the scaling (Lesson 3), and the spline knots (Lesson 4), date, text and geo features like these cannot leak the test set into training.

That is a real gift: you can engineer them once, up front, on the whole dataset, and move on. The moment a feature starts *learning* a statistic across rows, an average target per category, a mean to subtract, a set of knots, you are back in leakage territory and it has to move inside the modelling pipeline. Which is exactly the trap waiting in the next lesson.

=== step === concept
::eyebrow Go deeper
## References

- [Kuhn & Johnson, *Feature Engineering and Selection* (free online)](https://www.feat.engineering/) - the practical reference for turning raw fields into model-ready predictors.
- [R for Data Science (2e), ch.17 "Dates and times"](https://r4ds.hadley.nz/datetimes) - parsing dates and pulling out components with lubridate.
- [R for Data Science (2e), ch.14 "Strings"](https://r4ds.hadley.nz/strings) - measuring and extracting from text with stringr.
- [Movable Type: distance between two lat/long points (Haversine)](https://www.movable-type.co.uk/scripts/latlong.html) - the great-circle formula, clearly derived.
- [tidymodels recipes: step_date()](https://recipes.tidymodels.org/reference/step_date.html) - building date features inside a leak-free modelling pipeline.

=== step === complete
## Lesson 5 complete

You turned three columns that were not numbers into features a model can use: a timestamp cracked into calendar parts and cyclical hours, a free-text note measured into length and keyword flags, and a pair of coordinates collapsed into one great-circle distance. And you saw why this whole family is safe to build up front, each feature reads only its own row, so none of it can leak.

Next, Lesson 6: Imputing Missing Values in Features. Here is the twist: filling a gap means estimating it from the *other* rows (a mean, a median, a model), so imputation learns across rows and, done carelessly, leaks. You will learn to do it inside the pipeline so it stays honest.
