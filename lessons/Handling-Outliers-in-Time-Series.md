---
title: "Intervention, Causal Impact, and Anomaly Detection Lesson 5: Handling outliers in a time series"
catalog_blurb: "Found an outlier with a known cause? Here's what to do about it next."
description: "Compare deleting, capping, and tsclean against coding a known time-series outlier as an intervention regressor, and see how each choice reshapes your forecast."
keywords: "handling outliers in time series, tsclean function R, winsorizing time series, intervention regressor, pulse variable ARIMA, Arima xreg, forecast package R, outlier treatment forecasting, known cause outlier"
post_type: "LESSON"
curriculum_id: "5.140.5"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "ts-intervention"
course_title: "Intervention, Causal Impact, and Anomaly Detection"
course_lesson: "5"
course_total: "5"
course_landing: "Intervention-Causal-Impact-and-Anomaly-Detection-Course.html"
course_next: ""
course_prev: "Anomaly-and-Outlier-Detection.html"
---

=== step === cover
## Handling outliers in a time series

Today we are going to look at one bad day sitting inside an otherwise ordinary time series, and work out exactly what to do about it.

Picture an online store that logs how many orders it gets every day. We have 90 days of that count. On an ordinary weekday the store does close to 240 orders, and on a weekend it settles down to about 150, because fewer people shop then. That weekly up and down is completely normal, and it repeats every 7 days.

Then look at day 61, a Tuesday. The chart below plots all 90 days. Somewhere past the two-thirds mark, the line drops to a single, deep spike down to 38 orders. That is not a mystery either: the store's payment gateway went down for six hours that day, and everyone already knows it.

::widget chart-plotter {"data":[{"x":1,"y":244},{"x":2,"y":151},{"x":3,"y":145},{"x":4,"y":249},{"x":5,"y":249},{"x":6,"y":239},{"x":7,"y":244},{"x":8,"y":235},{"x":9,"y":162},{"x":10,"y":166},{"x":11,"y":229},{"x":12,"y":234},{"x":13,"y":230},{"x":14,"y":238},{"x":15,"y":244},{"x":16,"y":134},{"x":17,"y":137},{"x":18,"y":222},{"x":19,"y":247},{"x":20,"y":255},{"x":21,"y":223},{"x":22,"y":217},{"x":23,"y":170},{"x":24,"y":125},{"x":25,"y":227},{"x":26,"y":249},{"x":27,"y":243},{"x":28,"y":248},{"x":29,"y":241},{"x":30,"y":148},{"x":31,"y":163},{"x":32,"y":229},{"x":33,"y":259},{"x":34,"y":236},{"x":35,"y":219},{"x":36,"y":233},{"x":37,"y":166},{"x":38,"y":146},{"x":39,"y":254},{"x":40,"y":231},{"x":41,"y":237},{"x":42,"y":220},{"x":43,"y":212},{"x":44,"y":151},{"x":45,"y":165},{"x":46,"y":246},{"x":47,"y":234},{"x":48,"y":247},{"x":49,"y":242},{"x":50,"y":238},{"x":51,"y":160},{"x":52,"y":149},{"x":53,"y":212},{"x":54,"y":241},{"x":55,"y":248},{"x":56,"y":243},{"x":57,"y":234},{"x":58,"y":158},{"x":59,"y":161},{"x":60,"y":232},{"x":61,"y":38},{"x":62,"y":245},{"x":63,"y":239},{"x":64,"y":238},{"x":65,"y":141},{"x":66,"y":150},{"x":67,"y":246},{"x":68,"y":263},{"x":69,"y":236},{"x":70,"y":220},{"x":71,"y":213},{"x":72,"y":151},{"x":73,"y":144},{"x":74,"y":244},{"x":75,"y":253},{"x":76,"y":240},{"x":77,"y":242},{"x":78,"y":232},{"x":79,"y":156},{"x":80,"y":159},{"x":81,"y":233},{"x":82,"y":238},{"x":83,"y":236},{"x":84,"y":256},{"x":85,"y":239},{"x":86,"y":146},{"x":87,"y":156},{"x":88,"y":258},{"x":89,"y":252},{"x":90,"y":249}],"geoms":["line"],"x":"day","y":"orders","code":{"line":"ggplot(orders_df, aes(day, orders)) +\n  geom_line()"}}

So the question for this whole lesson is not "how do we find this outlier." We already found it, and we even know why it happened. The real question is what to do with that one point before you fit a model or make a forecast on this data.

=== step === concept
## Why deleting a point breaks a time series

When you spot a bad value sitting in an ordinary table of unordered rows, say a list of transaction amounts, the easiest fix is often to just drop the row. You lose one data point, and that is the end of it. The rows that are left do not care that a neighbour is gone, because there were no real neighbours to begin with. Order never meant anything.

A time series is different. The order of the rows is not just bookkeeping, it is information. Day 61 is not interchangeable with day 60 or day 62, each one sits on a specific weekday with its own expected level, and the one-day gap between consecutive rows is itself part of what a model learns from.

So what happens if you delete day 61's row outright? Every day after it slides one position earlier. The count that used to belong to day 62, a Wednesday, is now sitting at position 61. But position 61 is still supposed to be a Tuesday, as far as any weekly pattern built from position 1 onward is concerned.

Nothing in the data warns you about this. The series still looks like 89 evenly spaced numbers, so unless you go back and manually realign the calendar, every weekday label from that point on is off by one day.

Let's see this for real on our 90-day series.

```r
# Build 90 days of orders, then see what happens to the calendar if day 61 is deleted
set.seed(410)
n <- 90
day <- 1:n
wdnames <- c("Fri", "Sat", "Sun", "Mon", "Tue", "Wed", "Thu")
weekday_of_day <- function(d) wdnames[((d - 1) %% 7) + 1]
weekday <- weekday_of_day(day)
is_weekend <- weekday %in% c("Sat", "Sun")

base_level <- ifelse(is_weekend, 150, 240)
orders <- round(base_level + rnorm(n, mean = 0, sd = 12))
orders[61] <- 38

data.frame(day = 58:64, weekday = weekday[58:64], orders = orders[58:64])
#>   day weekday orders
#> 1  58     Sat    158
#> 2  59     Sun    161
#> 3  60     Mon    232
#> 4  61     Tue     38
#> 5  62     Wed    245
#> 6  63     Thu    239
#> 7  64     Fri    238

orders_deleted <- orders[-61]
true_weekday <- weekday[-61]
assumed_weekday <- weekday_of_day(1:length(orders_deleted))

data.frame(position = 58:64, true_weekday = true_weekday[58:64], assumed_weekday = assumed_weekday[58:64])
#>   position true_weekday assumed_weekday
#> 1       58          Sat             Sat
#> 2       59          Sun             Sun
#> 3       60          Mon             Mon
#> 4       61          Wed             Tue
#> 5       62          Thu             Wed
#> 6       63          Fri             Thu
#> 7       64          Sat             Fri
```

Look at position 61 onward. `true_weekday` is the weekday the surviving number actually belongs to. `assumed_weekday` is what a plain 7-day cycle, restarted from position 1, would call that same position.

The two agree everywhere up to position 60. Starting right at position 61, the row that used to be day 62, they part ways: the real data is a Wednesday's count, but anything downstream that assumes a plain weekly cycle calls it a Tuesday instead.

So deleting day 61 did not just lose one count. It quietly mislabeled every day after it, which throws off the weekly pattern, and any lagged feature (lag 1, lag 7) built from this point on, for the rest of the series.

=== step === concept
## Why capping hides how unusual day 61 was

Deleting is not the only quick fix people reach for. Another common one is capping, also called winsorizing: instead of removing the row, you replace the extreme value with the nearest value a rule says is still acceptable.

A common fence for "still acceptable" comes from the quartiles. Q1 is the value below which a quarter of the data falls, and Q3 is the value below which three quarters fall. The gap between them, Q3 minus Q1, is called the interquartile range (IQR), and a common rule marks anything more than 1.5 times the IQR below Q1 as too low to count as ordinary.

Day 61 is a Tuesday, so the honest comparison is against the other Tuesdays in this series, not against every day. Let's pull just those out.

```r
# Cap day 61 using the IQR rule computed on the series' other Tuesdays
tuesday_days <- day[weekday == "Tue" & day != 61]
tuesday_orders <- orders[tuesday_days]
tuesday_orders
#>  [1] 249 234 247 249 259 231 234 241 263 253 238 252

q1 <- quantile(tuesday_orders, 0.25)
q3 <- quantile(tuesday_orders, 0.75)
lower_bound <- q1 - 1.5 * (q3 - q1)
round(lower_bound, 2)
#>    25% 
#> 214.12 

capped <- orders
capped[61] <- lower_bound
c(original = orders[61], capped = round(capped[61], 2))
#> original   capped 
#>    38.00   214.12 
```

The twelve other Tuesdays run from 231 to 263 orders. Their first quartile, Q1, comes out at 237, and their third quartile, Q3, at 252.25, so the IQR is only 15.25. The lower fence sits at 237 minus 1.5 times 15.25, which works out to about 214.12.

Capping replaces day 61's 38 with that fence, 214.12. The series still has 90 evenly spaced days, with no misaligned calendar this time.

But look closely at what 214.12 actually is. It is not an estimate of what day 61 would have looked like without the outage. It is just the edge of "ordinary," the same boundary every unusually low Tuesday would get pushed to, whether it fell by 5 orders or by 500. Capping keeps all 90 days in place, so it does not cause the weekday-misalignment problem deleting does, but it throws away how unusual day 61 really was, swapping a real, recorded number, 38, for a generic floor that was never actually observed on any Tuesday in this data.

=== step === concept
## What forecast::tsclean() actually does to a flagged value

There is a purpose-built function for this exact kind of cleanup: `tsclean()`, from the `forecast` package.

Here is what it does, step by step:

1. It splits the series into three parts using STL (Seasonal-Trend decomposition using Loess): a slow-moving trend, a repeating seasonal pattern (here, the weekly up and down), and whatever is left over once both of those are subtracted out, called the remainder.
2. It checks how far each point's remainder sits from the rest of the remainders, on a scale built so that one huge outlier cannot drag the scale itself around. A point whose remainder sits unusually far out gets flagged.
3. Any flagged point (and any missing value) gets replaced: `tsclean()` strips the seasonal part out, fills the gap with a straight-line interpolation between the neighbouring points on that deseasonalized series, then adds the seasonal part back in.

Every other point on the series is left exactly as it was.

```r
# Run tsclean() and compare what it does to day 61 against the original
library(forecast)
orders_ts <- ts(orders, frequency = 7)
cleaned_ts <- tsclean(orders_ts)
cleaned <- as.numeric(cleaned_ts)

round(data.frame(day = 59:63, original = orders[59:63], cleaned = cleaned[59:63]), 2)
#>   day original cleaned
#> 1  59      161  161.00
#> 2  60      232  232.00
#> 3  61       38  241.01
#> 4  62      245  245.00
#> 5  63      239  239.00

max(abs(cleaned[-61] - orders[-61]))
#> [1] 0
```

Day 61 moves from 38 to about 241.01, right where its Tuesday neighbours, 232 and 245, say it should sit. And the last line confirms no other day moved at all: the largest difference between the cleaned series and the raw series, everywhere except day 61, is exactly 0.

That is a real improvement over capping. 241.01 is not a generic fence, it is an actual estimate of what day 61 would likely have looked like without the outage, built from the series' own trend and weekly pattern. But notice what is still true: the number 38 is gone from the data. Anyone opening this dataset later will see 241.01 sitting at day 61 and have no way of knowing an outage ever happened there, unless you tell them separately.

=== step === widget
## Comparing the raw series against the tsclean-replaced one

Let's put the raw series and the tsclean-replaced series on the same chart, so you can check for yourself that only day 61 moved.

::widget chart-plotter {"data":[{"x":1,"y":244,"fill":"Raw"},{"x":2,"y":151,"fill":"Raw"},{"x":3,"y":145,"fill":"Raw"},{"x":4,"y":249,"fill":"Raw"},{"x":5,"y":249,"fill":"Raw"},{"x":6,"y":239,"fill":"Raw"},{"x":7,"y":244,"fill":"Raw"},{"x":8,"y":235,"fill":"Raw"},{"x":9,"y":162,"fill":"Raw"},{"x":10,"y":166,"fill":"Raw"},{"x":11,"y":229,"fill":"Raw"},{"x":12,"y":234,"fill":"Raw"},{"x":13,"y":230,"fill":"Raw"},{"x":14,"y":238,"fill":"Raw"},{"x":15,"y":244,"fill":"Raw"},{"x":16,"y":134,"fill":"Raw"},{"x":17,"y":137,"fill":"Raw"},{"x":18,"y":222,"fill":"Raw"},{"x":19,"y":247,"fill":"Raw"},{"x":20,"y":255,"fill":"Raw"},{"x":21,"y":223,"fill":"Raw"},{"x":22,"y":217,"fill":"Raw"},{"x":23,"y":170,"fill":"Raw"},{"x":24,"y":125,"fill":"Raw"},{"x":25,"y":227,"fill":"Raw"},{"x":26,"y":249,"fill":"Raw"},{"x":27,"y":243,"fill":"Raw"},{"x":28,"y":248,"fill":"Raw"},{"x":29,"y":241,"fill":"Raw"},{"x":30,"y":148,"fill":"Raw"},{"x":31,"y":163,"fill":"Raw"},{"x":32,"y":229,"fill":"Raw"},{"x":33,"y":259,"fill":"Raw"},{"x":34,"y":236,"fill":"Raw"},{"x":35,"y":219,"fill":"Raw"},{"x":36,"y":233,"fill":"Raw"},{"x":37,"y":166,"fill":"Raw"},{"x":38,"y":146,"fill":"Raw"},{"x":39,"y":254,"fill":"Raw"},{"x":40,"y":231,"fill":"Raw"},{"x":41,"y":237,"fill":"Raw"},{"x":42,"y":220,"fill":"Raw"},{"x":43,"y":212,"fill":"Raw"},{"x":44,"y":151,"fill":"Raw"},{"x":45,"y":165,"fill":"Raw"},{"x":46,"y":246,"fill":"Raw"},{"x":47,"y":234,"fill":"Raw"},{"x":48,"y":247,"fill":"Raw"},{"x":49,"y":242,"fill":"Raw"},{"x":50,"y":238,"fill":"Raw"},{"x":51,"y":160,"fill":"Raw"},{"x":52,"y":149,"fill":"Raw"},{"x":53,"y":212,"fill":"Raw"},{"x":54,"y":241,"fill":"Raw"},{"x":55,"y":248,"fill":"Raw"},{"x":56,"y":243,"fill":"Raw"},{"x":57,"y":234,"fill":"Raw"},{"x":58,"y":158,"fill":"Raw"},{"x":59,"y":161,"fill":"Raw"},{"x":60,"y":232,"fill":"Raw"},{"x":61,"y":38,"fill":"Raw"},{"x":62,"y":245,"fill":"Raw"},{"x":63,"y":239,"fill":"Raw"},{"x":64,"y":238,"fill":"Raw"},{"x":65,"y":141,"fill":"Raw"},{"x":66,"y":150,"fill":"Raw"},{"x":67,"y":246,"fill":"Raw"},{"x":68,"y":263,"fill":"Raw"},{"x":69,"y":236,"fill":"Raw"},{"x":70,"y":220,"fill":"Raw"},{"x":71,"y":213,"fill":"Raw"},{"x":72,"y":151,"fill":"Raw"},{"x":73,"y":144,"fill":"Raw"},{"x":74,"y":244,"fill":"Raw"},{"x":75,"y":253,"fill":"Raw"},{"x":76,"y":240,"fill":"Raw"},{"x":77,"y":242,"fill":"Raw"},{"x":78,"y":232,"fill":"Raw"},{"x":79,"y":156,"fill":"Raw"},{"x":80,"y":159,"fill":"Raw"},{"x":81,"y":233,"fill":"Raw"},{"x":82,"y":238,"fill":"Raw"},{"x":83,"y":236,"fill":"Raw"},{"x":84,"y":256,"fill":"Raw"},{"x":85,"y":239,"fill":"Raw"},{"x":86,"y":146,"fill":"Raw"},{"x":87,"y":156,"fill":"Raw"},{"x":88,"y":258,"fill":"Raw"},{"x":89,"y":252,"fill":"Raw"},{"x":90,"y":249,"fill":"Raw"},{"x":1,"y":244,"fill":"Cleaned"},{"x":2,"y":151,"fill":"Cleaned"},{"x":3,"y":145,"fill":"Cleaned"},{"x":4,"y":249,"fill":"Cleaned"},{"x":5,"y":249,"fill":"Cleaned"},{"x":6,"y":239,"fill":"Cleaned"},{"x":7,"y":244,"fill":"Cleaned"},{"x":8,"y":235,"fill":"Cleaned"},{"x":9,"y":162,"fill":"Cleaned"},{"x":10,"y":166,"fill":"Cleaned"},{"x":11,"y":229,"fill":"Cleaned"},{"x":12,"y":234,"fill":"Cleaned"},{"x":13,"y":230,"fill":"Cleaned"},{"x":14,"y":238,"fill":"Cleaned"},{"x":15,"y":244,"fill":"Cleaned"},{"x":16,"y":134,"fill":"Cleaned"},{"x":17,"y":137,"fill":"Cleaned"},{"x":18,"y":222,"fill":"Cleaned"},{"x":19,"y":247,"fill":"Cleaned"},{"x":20,"y":255,"fill":"Cleaned"},{"x":21,"y":223,"fill":"Cleaned"},{"x":22,"y":217,"fill":"Cleaned"},{"x":23,"y":170,"fill":"Cleaned"},{"x":24,"y":125,"fill":"Cleaned"},{"x":25,"y":227,"fill":"Cleaned"},{"x":26,"y":249,"fill":"Cleaned"},{"x":27,"y":243,"fill":"Cleaned"},{"x":28,"y":248,"fill":"Cleaned"},{"x":29,"y":241,"fill":"Cleaned"},{"x":30,"y":148,"fill":"Cleaned"},{"x":31,"y":163,"fill":"Cleaned"},{"x":32,"y":229,"fill":"Cleaned"},{"x":33,"y":259,"fill":"Cleaned"},{"x":34,"y":236,"fill":"Cleaned"},{"x":35,"y":219,"fill":"Cleaned"},{"x":36,"y":233,"fill":"Cleaned"},{"x":37,"y":166,"fill":"Cleaned"},{"x":38,"y":146,"fill":"Cleaned"},{"x":39,"y":254,"fill":"Cleaned"},{"x":40,"y":231,"fill":"Cleaned"},{"x":41,"y":237,"fill":"Cleaned"},{"x":42,"y":220,"fill":"Cleaned"},{"x":43,"y":212,"fill":"Cleaned"},{"x":44,"y":151,"fill":"Cleaned"},{"x":45,"y":165,"fill":"Cleaned"},{"x":46,"y":246,"fill":"Cleaned"},{"x":47,"y":234,"fill":"Cleaned"},{"x":48,"y":247,"fill":"Cleaned"},{"x":49,"y":242,"fill":"Cleaned"},{"x":50,"y":238,"fill":"Cleaned"},{"x":51,"y":160,"fill":"Cleaned"},{"x":52,"y":149,"fill":"Cleaned"},{"x":53,"y":212,"fill":"Cleaned"},{"x":54,"y":241,"fill":"Cleaned"},{"x":55,"y":248,"fill":"Cleaned"},{"x":56,"y":243,"fill":"Cleaned"},{"x":57,"y":234,"fill":"Cleaned"},{"x":58,"y":158,"fill":"Cleaned"},{"x":59,"y":161,"fill":"Cleaned"},{"x":60,"y":232,"fill":"Cleaned"},{"x":61,"y":241.01,"fill":"Cleaned"},{"x":62,"y":245,"fill":"Cleaned"},{"x":63,"y":239,"fill":"Cleaned"},{"x":64,"y":238,"fill":"Cleaned"},{"x":65,"y":141,"fill":"Cleaned"},{"x":66,"y":150,"fill":"Cleaned"},{"x":67,"y":246,"fill":"Cleaned"},{"x":68,"y":263,"fill":"Cleaned"},{"x":69,"y":236,"fill":"Cleaned"},{"x":70,"y":220,"fill":"Cleaned"},{"x":71,"y":213,"fill":"Cleaned"},{"x":72,"y":151,"fill":"Cleaned"},{"x":73,"y":144,"fill":"Cleaned"},{"x":74,"y":244,"fill":"Cleaned"},{"x":75,"y":253,"fill":"Cleaned"},{"x":76,"y":240,"fill":"Cleaned"},{"x":77,"y":242,"fill":"Cleaned"},{"x":78,"y":232,"fill":"Cleaned"},{"x":79,"y":156,"fill":"Cleaned"},{"x":80,"y":159,"fill":"Cleaned"},{"x":81,"y":233,"fill":"Cleaned"},{"x":82,"y":238,"fill":"Cleaned"},{"x":83,"y":236,"fill":"Cleaned"},{"x":84,"y":256,"fill":"Cleaned"},{"x":85,"y":239,"fill":"Cleaned"},{"x":86,"y":146,"fill":"Cleaned"},{"x":87,"y":156,"fill":"Cleaned"},{"x":88,"y":258,"fill":"Cleaned"},{"x":89,"y":252,"fill":"Cleaned"},{"x":90,"y":249,"fill":"Cleaned"}],"geoms":["line"],"x":"day","y":"orders","code":{"line":"ggplot(orders_df, aes(day, orders, colour = series)) +\n  geom_line()"}}

Trace the two lines with your eye. They sit exactly on top of each other for all 89 other days, including every other Tuesday. The only place they part is day 61, where the raw line drops to the floor at 38 and the cleaned line instead sits right where you would expect an ordinary Tuesday to sit, close to its neighbours on either side. That one-point difference is the entire effect of running `tsclean()` on this series.

=== step === quiz
## Quick check: delete, cap, or clean?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- Deleting day 61 only changes that one day's value; every other day in the series keeps its original weekday label. ::no
- Deleting shifts every later day's weekday label by one position, while capping and tsclean both keep all 90 days in place and only disagree on what value they put at day 61. ::ok Exactly. Delete day 61 and day 62's count slides into position 61, wearing the wrong weekday label from then on. Cap it or clean it and the value recorded at day 61 changes, but the calendar does not move: all 90 days stay exactly where they were.
- tsclean() deletes day 61's row outright and renumbers the remaining 89 days, the same risk as deleting it by hand. ::no
- Capping and tsclean both delete day 61's row too, so all three treatments break the weekday alignment the same way. ::no Capping and tsclean do not touch the row count or the calendar at all, they only change the single value recorded at day 61, so the series stays at 90 evenly spaced days either way. Deleting is the only one of the three that removes a row, and that is exactly what slides every later day into the wrong weekday, not just day 61 itself.

=== step === concept
## Treating a known outlier as an intervention regressor instead

Deleting, capping and tsclean all share one thing: each one edits the number sitting at day 61. But day 61's cause is not a mystery. We know exactly what happened, a six-hour payment-gateway outage, and we know exactly which day it happened on. When the cause is known like this, there is a cleaner option: leave the recorded 38 exactly as it is, and instead tell the model about the event directly.

You do this with a **pulse variable**, also called an intervention regressor: a column of 0s with a single 1 on the day the known event happened. It is 1 on day 61 and 0 everywhere else. You then hand this column to `Arima()` as an external regressor, through its `xreg` argument, right alongside the series itself.

This series also has a strong, known weekly pattern: weekday orders run close to 240 and weekend orders close to 150. So we give the model a second column too, a 0/1 flag for whether a day is a weekend, and the pulse term then only has to explain what the ordinary weekly swing cannot, which is day 61's outage.

The call below also sets `order = c(1, 0, 0)`. That asks for one autoregressive term, called AR(1) for short: each day's count is allowed to depend a little on the count from the day right before it, on top of whatever the weekend and pulse columns already explain.

```r
# Fit Arima errors with xreg: a weekend indicator plus a pulse for day 61's outage
pulse <- rep(0, n)
pulse[61] <- 1

fit_pulse <- Arima(orders_ts, order = c(1, 0, 0),
                    xreg = cbind(weekend = as.numeric(is_weekend), pulse = pulse))
fit_pulse
#> Series: orders_ts 
#> Regression with ARIMA(1,0,0) errors 
#> 
#> Coefficients:
#>          ar1  intercept   weekend      pulse
#>       0.1036   238.3636  -85.6323  -200.3913
#> s.e.  0.1076     1.5466    2.7562    11.2485
#> 
#> sigma^2 = 132.2:  log likelihood = -345.47
#> AIC=700.95   AICc=701.66   BIC=713.44
```

Read the coefficients table. `weekend` comes out at about -85.63: a weekend day runs about 85.63 orders below a weekday, holding everything else fixed. And `pulse` comes out at about -200.39, with a standard error of 11.25.

That is the outage's own estimated effect: on day 61, something pulled the order count down by about 200.39 orders, give or take 11.25. Divide the pulse coefficient by its standard error, 200.39 by 11.25, and that effect sits more than seventeen standard errors from zero, nowhere close to something you'd see by chance.

Notice what did not happen here. The number 38 is still sitting in the data, completely untouched. We have not cleaned anything. We have simply told the model, honestly, that something unusual happened on that one day, and let it tell us how big that something was, with a margin of error attached.

=== step === concept
## Why the regressor keeps what tsclean and capping both discard

Step back and compare what is actually sitting in each version of the data once you are done.

After capping, day 61 reads 214.12. After tsclean, it reads 241.01. Neither of those numbers ever happened. They are the method's best guess, or for capping just a fence, at what an ordinary Tuesday looks like, quietly standing in for what was actually recorded.

A colleague who opens either of those cleaned datasets six months from now, with no memory of this outage, will see a perfectly ordinary-looking Tuesday and have no reason to ask any questions.

After the intervention regressor, day 61 still reads 38, exactly what was recorded. The outage has not been edited out of the history. Instead, its effect lives in a separate, checkable number: a coefficient of -200.39 with a standard error of 11.25.

Capping and tsclean cannot give you anything like that. They only ever hand you a replacement value, never a measured size for what caused the replacement.

[KEY INSIGHT]
Capping and tsclean fix day 61 by changing what happened. The intervention regressor fixes it by explaining what happened, and leaves the real history alone.

So the real difference between these three is not just which one looks cleaner. It is whether the explanation for day 61 stays attached to the data, or gets silently absorbed into it.

=== step === widget
## How each treatment changes the forecast and its interval

Now put all four treatments through the exact same model and see what each one hands back for a forecast.

We fit the same structure on each: an AR(1) term plus the weekday/weekend indicator, with the pulse column added for the fourth treatment. That gives us the series with day 61 deleted, the capped series, the tsclean-replaced series, and the raw series with the pulse regressor. Then we forecast 14 days ahead (two weeks) from each fit and read off the point forecast and the width of the 95% interval on the final day of that window.

The deleted series has an extra wrinkle. Once day 61 is gone, the weekday/weekend column for every day after it has to be rebuilt by recomputing the weekly cycle from position 1 onward, the same recomputed cycle that drifted a day out of step once it passed day 61's old slot. So that model is quietly working from a calendar that no longer matches reality.

```r
# Fit the same Arima structure on all four treated series and forecast two weeks ahead
h <- 14
future_weekday <- weekday_of_day((n + 1):(n + h))
future_weekend <- as.numeric(future_weekday %in% c("Sat", "Sun"))

# 1. the series with day 61 deleted, using the misaligned, recomputed weekday cycle
assumed_weekend <- as.numeric(assumed_weekday %in% c("Sat", "Sun"))
future_weekday_deleted <- weekday_of_day((length(orders_deleted) + 1):(length(orders_deleted) + h))
future_weekend_deleted <- as.numeric(future_weekday_deleted %in% c("Sat", "Sun"))
fit_deleted <- Arima(ts(orders_deleted, frequency = 7), order = c(1, 0, 0), xreg = assumed_weekend)
fc_deleted <- forecast(fit_deleted, h = h, xreg = future_weekend_deleted)

# 2. the capped series
fit_capped <- Arima(ts(capped, frequency = 7), order = c(1, 0, 0), xreg = as.numeric(is_weekend))
fc_capped <- forecast(fit_capped, h = h, xreg = future_weekend)

# 3. the tsclean-replaced series
fit_cleaned <- Arima(cleaned_ts, order = c(1, 0, 0), xreg = as.numeric(is_weekend))
fc_cleaned <- forecast(fit_cleaned, h = h, xreg = future_weekend)

# 4. the raw series with the pulse regressor (fit_pulse was already fitted above)
future_xreg <- cbind(weekend = future_weekend, pulse = rep(0, h))
fc_pulse <- forecast(fit_pulse, h = h, xreg = future_xreg)

read_off <- function(fc) c(point = as.numeric(fc$mean[h]),
                            width95 = as.numeric(fc$upper[h, "95%"] - fc$lower[h, "95%"]))

round(rbind(deleted = read_off(fc_deleted),
            capped  = read_off(fc_capped),
            tsclean = read_off(fc_cleaned),
            pulse   = read_off(fc_pulse)), 2)
#>         point width95
#> deleted 231.77  111.94
#> capped  238.01   46.19
#> tsclean 238.40   45.07
#> pulse   238.36   45.32
```

::widget styled-table {"cols":["Treatment","Point forecast, 14 days out","95% interval width"],"rows":[["Deleted day 61",231.77,111.94],["Capped to the IQR bound",238.01,46.19],["tsclean replacement",238.40,45.07],["Intervention regressor",238.36,45.32]],"title":"Forecasting two weeks ahead under all four treatments","note":"Deleting inflates the width to 111.94 by misaligning the weekly pattern. The other three land within a point of each other on both numbers."}

Look at the deleted row first. Its point forecast, 231.77, sits lower than the other three, and its interval is more than twice as wide, 111.94 against roughly 45 to 46 for the rest. That gap is not the model being extra careful. It is the weekday-misalignment problem catching up with it: part of the weekend indicator the model is using from day 61 onward now points at the wrong days, so the model fits worse across the board.

Now compare the other three. Capped comes in at 238.01 with a width of 46.19. tsclean comes in at 238.40 with a width of 45.07. The pulse regressor comes in at 238.36 with a width of 45.32.

For practical purposes, those three are tied. Whichever of them you pick, you get almost the same forecast and almost the same interval.

So width and point forecast alone cannot tell you which of those three to prefer. Something else has to decide it.

=== step === concept
## Picking the right treatment for a known-cause outlier
::prose-only the comparison numbers already sit in the widget one step back; this step reasons about them in words, not a new visual

Start with what the forecast comparison already ruled out. Deleting is not competitive on either number: it gives both the lowest point forecast and, by a wide margin, the widest interval, for a reason that has nothing to do with real extra uncertainty about this store's orders. It is paying for the weekday-misalignment risk that deleting creates in the first place.

That leaves capping, tsclean, and the intervention regressor, and on the forecast and its width, they are close enough to call a tie: 238.01 against 238.40 against 238.36, and 46.19 against 45.07 against 45.32. If you only looked at those two numbers, you would have no real basis for choosing between them.

So the deciding question is not "which one gives the tightest interval." It is "which one is honest about what actually happened, and leaves you with something you can check later." Capping replaces 38 with 214.12, a generic fence that was never meant to estimate day 61 in the first place. tsclean replaces it with 241.01, a genuinely better guess, built from the series' own pattern, but still a guess standing in for a real recorded number.

The intervention regressor is the only one of the three that keeps the recorded 38 exactly as it happened, and on top of that hands you a coefficient, -200.39, and a standard error, 11.25, describing the outage itself: a number you could report, defend, or compare against a different outage next quarter.

For a known-cause outlier like this one, that is the treatment to reach for. You are not just picking the model with the smallest number. You are picking the one that keeps the true history intact and turns the cause of the anomaly into something you can actually measure.

=== step === quiz
## Quick check: reading the comparison table

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- tsclean has the narrowest interval of the four, so it is always the safer pick over the intervention regressor. ::no
- Deleting has the widest interval of the four, because its extra width comes from the weekday misalignment that deleting itself causes, not from any real extra uncertainty about the store's orders. ::ok Exactly. Its 111.94-point width next to roughly 45 to 46 for the other three is not deletion being honestly cautious, it is the model quietly working from a misaligned calendar.
- Capping and tsclean must be doing the same thing to day 61, since their forecasts and widths come out nearly identical. ::no
- Deleting's wider interval means it is the most conservative, cautious choice, so it is actually the safest of the four. ::no The width to focus on is the gap between the deleted treatment's 111.94 and the other three's 45 to 46, and that gap traces back to the weekday misalignment that deleting itself causes, not to real extra randomness in the store's orders. A wider interval here is not caution, it is a symptom of a shifted calendar. And a small gap between two already-close numbers, like tsclean's 45.07 against the pulse regressor's 45.32, is too small to mean one of them is more trustworthy than the other.

=== step === tryit
## Your turn: code a known outlier as a regressor

Here is a second known event on this same 90-day series, for you to code yourself. Suppose a two-day shipping-carrier strike also disrupted deliveries, hitting hardest on day 20, a Wednesday, and pulling that day's count down to 95.

Build the matching pulse vector for the strike day, and fit it the same way you already fit day 61's outage: an AR(1) term, the weekend indicator, and this new pulse column, all handed to `Arima()` through `xreg`.

```r
# Build orders2: the same 90 days, but with the strike's count swapped in
orders2 <- orders
orders2[20] <- 95
orders2_ts <- ts(orders2, frequency = 7)

pulse2 <- rep(0, n)

# YOUR CODE: flag the strike day in pulse2, then fit an Arima model with an
#            AR(1) term, the weekend indicator, and pulse2 as regressors

```
::check {"regex": "pulse2[\\s\\S]{0,15}20[\\s\\S]*Arima[(][\\s\\S]*xreg", "gate": true, "difficulty": "intermediate", "ok": "Right pattern. pulse2 comes out at -140.06 with a standard error of 23.91: the strike pulled that day down by about 140 orders, too big to be ordinary noise, measured the same honest way you measured day 61's outage.", "no": "Flag the strike day the same way you flagged day 61 earlier: pulse2[20] should be set to 1, then call Arima(orders2_ts, order = c(1, 0, 0), xreg = cbind(weekend = as.numeric(is_weekend), pulse2 = pulse2))."}
::solution
```r
# Flag day 20, then fit the same AR(1) plus weekend plus pulse structure
pulse2[20] <- 1

fit2 <- Arima(orders2_ts, order = c(1, 0, 0),
              xreg = cbind(weekend = as.numeric(is_weekend), pulse2 = pulse2))
fit2
#> Series: orders2_ts 
#> Regression with ARIMA(1,0,0) errors 
#> 
#> Coefficients:
#>          ar1  intercept   weekend     pulse2
#>       0.0126   235.0659  -82.7530  -140.0643
#> s.e.  0.1051     3.0183    5.5502    23.9069
#> 
#> sigma^2 = 589.2:  log likelihood = -412.7
#> AIC=835.4   AICc=836.11   BIC=847.9
```

Same move you already made on day 61, on a different day: a 0/1 pulse column that is 1 only where the known event happened, handed to `Arima()` through `xreg` next to the weekend indicator. The strike's coefficient, -140.06, with a standard error of 23.91, is about six standard errors from zero, a real effect, not noise.

=== step === concept
## References

- [Forecasting: Principles and Practice, the chapter on outliers and missing values](https://otexts.com/fpp3/missing-outliers.html) - Hyndman, R.J. and Athanasopoulos, G. (3rd ed.).
- [forecast package](https://cran.r-project.org/web/packages/forecast/index.html) - Hyndman et al., CRAN. Documentation for `tsclean()` and `Arima()`.
- Box, G.E.P. and Tiao, G.C. (1975), "Intervention Analysis with Applications to Economic and Environmental Problems," Journal of the American Statistical Association, 70(349), 70-79.
- Chen, C. and Liu, L-M. (1993), "Joint Estimation of Model Parameters and Outlier Effects in Time Series," Journal of the American Statistical Association, 88(421), 284-297.
- [tsoutliers package](https://cran.r-project.org/web/packages/tsoutliers/index.html) - Lopez-de-Lacalle. Documentation and vignette on coding additive, level-shift, and transient outliers as regressors.

=== step === complete
## What you can do now

You looked at one outlier with a known cause, and worked through four honest ways to handle it:

- **Deleting** the row keeps nothing, and it breaks the calendar for every day after it, because a time series' order and spacing are information a cross-sectional row never carried.
- **Capping** keeps the spacing, but swaps the real value for a generic fence that was never meant to estimate what actually happened.
- **tsclean()** keeps the spacing too, and its STL-based replacement is a genuinely better guess than a fence, but it still quietly edits a known event out of the record.
- The **intervention regressor** keeps the recorded value exactly as it happened, and hands you a coefficient and a standard error that measure the event itself.

The one question that decides between them is simple: is the cause known? If it is not, cleaning the point is often the only option you have. If it is, as it was here, coding it as a regressor keeps your history honest and gives you a measured effect you can actually check, instead of a number that quietly stands in for one you'll never see again.
