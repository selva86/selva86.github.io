---
title: "Strings & Dates Lesson 3: Dates and Times in R"
catalog_blurb: "Turn date text into real dates, calculate with them, and handle time zones."
description: "Parse messy date text into real dates with lubridate, do date arithmetic, extract the weekday and month, and convert times correctly across time zones."
keywords: "dates in R, lubridate, parse dates in R, ymd dmy mdy, date arithmetic in R, POSIXct, time zones in R, with_tz, wday, date components"
post_type: "LESSON"
curriculum_id: "1.5.3"
webr: true
lesson_access: "free"
track: "foundations"
course_id: "nr-strings"
course_title: "Strings, Dates and Factors in R"
course_lesson: "3"
course_total: "4"
course_landing: "R-Foundations-Strings-Course.html"
course_next: "Factors-with-forcats.html"
course_prev: "Regular-Expressions-in-R.html"
---

=== step === cover
::eyebrow Lesson 3 of 4
## Dates and Times in R
You run a small online plant shop, **Fern & Co.** Six orders came in during March 2026, and your order log wrote each order's date the way logs do: as plain text, like `"2026-03-02"`. You want simple answers. How many days from the first order to the last? Which weekday do people actually shop on? When a customer in New York orders at 9:30 in the morning, what time is that on your clock in Bengaluru?

You cannot answer any of those while the date is just text. The fix is to turn that text into a **real date**, and then R can count, compare and convert for you. That is what the **lubridate** package is for. By the end of this lesson you will be able to:

- Turn date text in any layout into a real date you can compute with
- Add, subtract and compare dates, and pull out the year, month or weekday
- Read a time correctly across time zones

**Prerequisites:** you can run a line of R and store a result with `<-` ([Your First R Session](R-Syntax-and-First-Objects.html)), and you know what a vector and the **character** type are ([Atomic Vectors and Data Types](Atomic-Vectors-and-Data-Types.html)). You just finished matching text with regular expressions; a date is text too, so this is the natural next step. Press Run to see the whole payoff at once; the rest of the lesson builds it up one piece at a time.

::widget table-transform {"caption":"Once the text is a real date, R can read its weekday and measure the days since the sale opened on 1 March.","code":"library(lubridate)\norder_date <- ymd(order_text)\nwday(order_date, label = TRUE)\norder_date - ymd(\"2026-03-01\")","before":{"cols":["order date (text)"],"rows":[["2026-03-02"],["2026-03-07"],["2026-03-08"],["2026-03-14"],["2026-03-15"],["2026-03-21"]]},"after":{"cols":["order date","weekday","days into sale"],"rows":[["2026-03-02","Mon","1"],["2026-03-07","Sat","6"],["2026-03-08","Sun","7"],["2026-03-14","Sat","13"],["2026-03-15","Sun","14"],["2026-03-21","Sat","20"]]}}

=== step === concept
::eyebrow The core idea
## A date is a number, not text

Here is the thing that trips everyone up at the start. To you, `"2026-03-02"` clearly means the 2nd of March. To R, it is just six characters between quotes, the same **character** type you used for names and cities. You cannot do arithmetic on it any more than you can on `"hello"`.

```r
library(lubridate)

# "2026-03-02" looks like a date, but to R it is plain text
order_chr <- "2026-03-02"
class(order_chr)
#> [1] "character"
```

A **real date** is different. When you parse that text into a `Date`, R stores it as a single number: **the count of days since 1 January 1970** (a fixed reference point called the epoch). That is the whole trick. Because a date is really a number underneath, R can subtract two of them, add seven to one, or sort them, just like ordinary numbers.

```r
order_day <- ymd("2026-03-02")   # parse the text into a real Date
class(order_day)
#> [1] "Date"
as.numeric(order_day)            # the number underneath: days since 1970-01-01
#> [1] 20514
```

So `2026-03-02` is day number 20514. You will almost never look at that number, but knowing it is there explains everything that follows. Once a date is a real `Date`, there are four jobs you will do with it, and this lesson walks through them in order:

::widget process-flow {"steps":[{"title":"Parse","sub":"turn date text into a real Date"},{"title":"Calculate","sub":"add, subtract and compare dates"},{"title":"Extract","sub":"pull out the year, month or weekday"},{"title":"Zones","sub":"read a time on the right clock"}]}

=== step === concept
::eyebrow Job 1
## Parse: turn text into a real date

Parsing is where lubridate shines. Base R makes you spell out a format with cryptic codes like `%Y-%m-%d`. lubridate asks one easy question instead: **what order are the parts in?** You pick the function whose name is that order, `y`ear, `m`onth, `d`ay, and it figures out the separators (dashes, slashes, spaces, even month names) for you.

```r
ymd("2026-03-02")     # year, month, day
#> [1] "2026-03-02"
dmy("02/03/2026")     # day, month, year
#> [1] "2026-03-02"
mdy("March 2, 2026")  # month, day, year
#> [1] "2026-03-02"
```

Three different-looking strings, one real date. Notice every result prints back in the same tidy `YYYY-MM-DD` form: that is just how a `Date` displays, regardless of how it came in. Now let's parse the real Fern & Co. log. The website recorded all six orders the same way, so one call to `ymd()` handles the whole vector at once:

```r
# the March order log, six dates as text
order_text <- c("2026-03-02", "2026-03-07", "2026-03-08",
                "2026-03-14", "2026-03-15", "2026-03-21")
order_date <- ymd(order_text)
order_date
#> [1] "2026-03-02" "2026-03-07" "2026-03-08" "2026-03-14" "2026-03-15" "2026-03-21"
```

[KEY INSIGHT]
Choose the parser by the order the parts appear in the text, not by the separators. `dmy()` reads `"02/03/2026"`, `"02-03-2026"` and `"2 March 2026"` all the same way, because all three are day, then month, then year.

=== step === quiz
::eyebrow Check yourself
## Read the order right

A European supplier emails you an order dated `04/03/2026`. You know from the email that it was placed on **the 4th of March, 2026**. Which call returns that exact date?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- `dmy("04/03/2026")` ::ok Right. `dmy()` reads the parts as day, month, year, so `04/03/2026` becomes 4 March 2026. The order of the parts is what you declare, and it matches what the supplier meant.
- `mdy("04/03/2026")` ::no `mdy()` reads month, then day, so it returns 3 April 2026, a month too late. The digits are identical; only the order you declare changes the meaning, which is exactly why a numeric date like this is ambiguous until you say how to read it.
- `ymd("04/03/2026")` ::no `ymd()` expects the year first, but this text starts with the day. It cannot line the parts up, so it returns `NA` with a warning rather than the date you want.

=== step === concept
::eyebrow Job 2
## Calculate: add, subtract and compare

This is the payoff for parsing. Because a `Date` is a number of days, arithmetic just works, and the answers come back in friendly date units. Adding a plain number adds that many **days**:

```r
# a delivery promised 5 days after each order
order_date + 5
#> [1] "2026-03-07" "2026-03-12" "2026-03-13" "2026-03-19" "2026-03-20" "2026-03-26"
```

Subtracting one date from another tells you the gap between them. R returns a **difftime**, a labelled difference that says what the units are:

```r
# how long from the first order to the last?
order_date[6] - order_date[1]
#> Time difference of 19 days
```

The same subtraction works against any reference date. Say the spring sale opened on 1 March; how many days into the sale was each order placed? Just subtract the start date:

```r
# days between each order and the sale opening on 1 March
order_date - ymd("2026-03-01")
#> Time differences in days
#> [1]  1  6  7 13 14 20
```

And when you need *now* rather than a fixed date, lubridate reads the computer clock for you:

```r
# these change every time you run them, so no fixed output is shown
today()   # the current date, as a Date
now()     # the current date-time, in your own time zone
```

`today()` is perfect for "how many days until this subscription renews?", measured from whatever day the code actually runs.

=== step === tryit
::eyebrow Your turn
## When does the refund window close?

Fern & Co. gives every order a **30-day** refund window: it closes 30 days after the order date. The `order_date` vector is ready below. Replace the blank with a single expression that returns the closing date of each window. (Adding a plain number to a date adds that many days.)

```r
order_date <- ymd(c("2026-03-02","2026-03-07","2026-03-08","2026-03-14","2026-03-15","2026-03-21"))
____   # the date 30 days after each order
```
::check {"regex":"order_date\\s*[+]\\s*30","gate":true,"difficulty":"beginner","ok":"Exactly. order_date + 30 adds 30 days to every date at once, and the month rollovers (March into April) are handled for you.","no":"Add the number of days straight to the date vector: order_date + 30."}
::solution
```r
order_date <- ymd(c("2026-03-02","2026-03-07","2026-03-08","2026-03-14","2026-03-15","2026-03-21"))
order_date + 30
#> [1] "2026-04-01" "2026-04-06" "2026-04-07" "2026-04-13" "2026-04-14" "2026-04-20"
```

=== step === concept
::eyebrow Job 3
## Extract: pull out the parts

Often you do not want the whole date, just one piece of it: the year for a report, the month for a chart, the weekday to spot a pattern. lubridate has a small, predictable verb for each part. Give it a date vector and it pulls that part out of every entry:

::widget table-transform {"caption":"Each verb reads one calendar part out of every real date.","code":"library(lubridate)\nyear(order_date)\nmonth(order_date, label = TRUE)\nwday(order_date, label = TRUE)","before":{"cols":["order_date"],"rows":[["2026-03-02"],["2026-03-07"],["2026-03-08"],["2026-03-14"],["2026-03-15"],["2026-03-21"]]},"after":{"cols":["order_date","year","month","weekday"],"rows":[["2026-03-02","2026","Mar","Mon"],["2026-03-07","2026","Mar","Sat"],["2026-03-08","2026","Mar","Sun"],["2026-03-14","2026","Mar","Sat"],["2026-03-15","2026","Mar","Sun"],["2026-03-21","2026","Mar","Sat"]]}}

By default `month()` and `wday()` return a number (March is `3`, Sunday is `1`). Add `label = TRUE` and you get readable names instead, which is almost always what you want when reading or plotting:

```r
year(order_date)                      # the year of each order
#> [1] 2026 2026 2026 2026 2026 2026
wday(order_date, label = TRUE)        # the weekday, as a name
#> [1] Mon Sat Sun Sat Sun Sat
#> Levels: Sun < Mon < Tue < Wed < Thu < Fri < Sat
```

Now answer the question we opened with: which weekday do people buy plants on? Count the weekdays with `table()`:

```r
# how many orders land on each weekday?
table(wday(order_date, label = TRUE))
#>
#> Sun Mon Tue Wed Thu Fri Sat
#>   2   1   0   0   0   0   3
```

Five of the six orders landed on a Saturday or Sunday. The weekend is when Fern & Co. should run its ads, and you could not see that until the dates were real and the weekday was pulled out.

=== step === tryit
::eyebrow Your turn
## Name each order's weekday

Using the same `order_date` vector, return the **weekday name** of each order, so the result reads `Mon Sat Sun Sat Sun Sat` rather than a column of numbers. Reach for `wday()`, and remember the argument that switches numbers to names.

```r
order_date <- ymd(c("2026-03-02","2026-03-07","2026-03-08","2026-03-14","2026-03-15","2026-03-21"))
____   # the weekday of each order, as a name like Mon or Sat
```
::check {"regex":"wday\\s*[(]\\s*order_date[^)]*label\\s*=\\s*TRUE","gate":true,"difficulty":"intermediate","ok":"That is it. wday(order_date, label = TRUE) returns the weekday as a readable name instead of a number from 1 to 7.","no":"Call wday on the vector and switch on the names with label = TRUE: wday(order_date, label = TRUE)."}
::solution
```r
order_date <- ymd(c("2026-03-02","2026-03-07","2026-03-08","2026-03-14","2026-03-15","2026-03-21"))
wday(order_date, label = TRUE)
#> [1] Mon Sat Sun Sat Sun Sat
#> Levels: Sun < Mon < Tue < Wed < Thu < Fri < Sat
```

=== step === concept
::eyebrow Job 4
## Time zones: the same instant, different clocks

So far every order has been a plain date. But a real timestamp carries a **time of day** and a **time zone**, and time zones are where dates quietly go wrong. A date-time is built with `ymd_hms()` (year-month-day, then hour-minute-second), and you tell it which zone the clock reading belongs to:

```r
# Maria, a customer in New York, ordered at 9:30 in the morning her time
maria <- ymd_hms("2026-03-15 09:30:00", tz = "America/New_York")
maria
#> [1] "2026-03-15 09:30:00 EDT"
```

That single instant exists everywhere at once; different places just read a different clock for it. `with_tz()` re-displays the **same moment** on another zone's clock. Maria's 9:30am in New York is the same instant as 7:00pm on your Bengaluru clock:

::widget table-transform {"caption":"One instant, three clocks. with_tz keeps the moment fixed and only changes the clock it is shown on.","code":"library(lubridate)\nmaria <- ymd_hms(\"2026-03-15 09:30:00\", tz = \"America/New_York\")\nwith_tz(maria, \"Asia/Kolkata\")","before":{"cols":["the order from New York"],"rows":[["2026-03-15 09:30 EDT"]]},"after":{"cols":["New York","UTC","Bengaluru"],"rows":[["09:30 EDT","13:30 UTC","19:00 IST"]]}}

There is a second, very different operation, and mixing them up is the classic time-zone bug. `force_tz()` does **not** convert the moment; it keeps the clock reading `09:30` exactly and just slaps a new zone label on it, which points at a completely different instant:

```r
maria <- ymd_hms("2026-03-15 09:30:00", tz = "America/New_York")
with_tz(maria,  "Asia/Kolkata")   # SAME instant, Bengaluru clock
#> [1] "2026-03-15 19:00:00 IST"
force_tz(maria, "Asia/Kolkata")   # SAME clock reading 09:30, now a DIFFERENT instant
#> [1] "2026-03-15 09:30:00 IST"
```

[NOTE]
A simple rule of thumb: use `with_tz()` when you want to know what time it *was somewhere else* for a moment that already happened (almost always). Reach for `force_tz()` only to fix a timestamp that was recorded with the wrong zone label in the first place.

=== step === quiz
::eyebrow Check yourself
## with_tz or force_tz?

Maria's order is stored as `2026-03-15 09:30:00 EDT` (New York time). You run `with_tz(maria, "Asia/Kolkata")` to see it on your Bengaluru clock. What comes back?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- `2026-03-15 19:00:00 IST`, the same instant shown on the Bengaluru clock ::ok Right. `with_tz()` holds the exact moment fixed and only changes the clock it is displayed on. 9:30am in New York is 7:00pm the same day in Bengaluru, so the reading moves but the instant does not.
- `2026-03-15 09:30:00 IST`, the clock still reads 9:30, now labelled IST ::no That is what `force_tz()` would do: keep the reading 9:30 and relabel the zone, which points at a different instant entirely. `with_tz()` converts the displayed time instead of relabelling it.
- An error, because a time zone cannot be changed after a time is recorded ::no It can. `with_tz()` re-displays an existing instant in any zone you ask for; it is one of lubridate's most-used functions.

=== step === concept
::eyebrow Go deeper
## References

Four trustworthy, free places to take dates and times further:

- [lubridate (tidyverse) - official site](https://lubridate.tidyverse.org/) - the home page and full reference for every parser and accessor you used here.
- [R for Data Science (2e): Dates and times](https://r4ds.hadley.nz/datetimes) - the canonical, example-led chapter, including spans and periods we only touched on.
- [Posit lubridate cheatsheet](https://rstudio.github.io/cheatsheets/html/lubridate.html) - a one-page visual map of parsing, components and time-zone tools, worth keeping open.
- [Do more with dates and times (vignette)](https://lubridate.tidyverse.org/articles/lubridate.html) - the package authors' own tour, with the difference between durations, periods and intervals.

=== step === complete
## Lesson 3 complete

You took a log of plain-text order dates and made them genuinely useful. The key was the first move: a `Date` is a **number of days since 1970**, so once you **parse** text into one, everything else is ordinary arithmetic and lookup. You ran the four jobs: **parse** with `ymd()`, `dmy()` and `mdy()` (choose the function by the order of the parts), **calculate** by adding days and subtracting dates, **extract** the year, month and weekday with `year()`, `month()` and `wday()`, and handled **time zones** with `with_tz()` (same instant, new clock) versus `force_tz()` (same clock, new instant).

That weekend finding, five of six orders on a Saturday or Sunday, came from turning a date into a weekday. It is a hint of what is next: the weekday is a **category**, one of a fixed set of values with a natural order. In Lesson 4: Factors with forcats, you will learn to store and reorder categories like these so your counts and charts come out in the order you want, not alphabetical.
