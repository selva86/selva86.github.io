---
title: "Energy Load Forecasting in R: an End-to-End Case Study"
slug: "Energy-Load-Forecasting-in-R"
description: "Energy load forecasting in R, end to end: audit hourly demand, model daily and weekly cycles with temperature, backtest five models, ship a day-ahead forecast."
keywords: "energy load forecasting in R, electricity demand forecasting R, short-term load forecasting, fable multiple seasonality, dynamic harmonic regression, temperature load model, vic_elec, day-ahead load forecast"
auto_link_terms: "energy load forecasting|electricity load forecasting|short-term load forecasting|electricity demand forecasting|load forecasting in R|energy demand forecasting|day-ahead load forecast|forecasting electricity demand|load forecasting case study"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-07-23"
curriculum_id: "TS2-13.5"
post_type: "C"
sidebar_section: "Time Series"
sidebar_title: "Energy Load Forecasting"
sidebar_order: 65
difficulty: "Advanced"
---

<p class="lead">Energy load forecasting in R turns a grid's demand history and a weather forecast into an hour-by-hour prediction of tomorrow's electricity load. This is a full short-term load forecasting case study, run the way a utility's analytics team would run it: audit sub-daily data, explore its daily and weekly cycles and the U-shaped temperature response, engineer degree-day and calendar features, fit and backtest five models, then hand the scheduling desk a defensible day-ahead forecast. Every step uses the tidyverts stack (tsibble, feasts, fable), and every block runs in your browser.</p>

## What decision does an energy load forecast feed, and what does getting it wrong cost?

Picture yourself on the operations desk at AuroraGrid, a regional utility that keeps the lights on across the state of Victoria. Every afternoon you commit to tomorrow's generation and buy any shortfall on the day-ahead market. That commitment rests on one number for each hour: how many megawatts the state will draw. Get it right and the grid runs cheaply. Get it wrong and one of two bills lands on your desk.

The two bills are not the same size, and that asymmetry is the whole reason this job matters. Buy too much power and you sell the surplus back at a small loss, a few tens of dollars per megawatt-hour. Buy too little on a scorching afternoon and you cover the gap on the spot market, where the price spikes toward the market cap, which sat near A$13,000 per megawatt-hour in 2014, more than two hundred times a quiet off-peak price of about A$50. A shortfall at the peak can also mean shedding load, which is a polite phrase for switching off suburbs. So the cost of under-forecasting a hot day dwarfs the cost of over-forecasting a mild one.

That is why "how hot will it be tomorrow" is the most valuable question on the desk. Here is the payoff we are building toward, shown before we explain a single line: forecasting the load for a record-breaking 43-degree day, once with a plain "same as last week" rule and once with a model that reads the temperature forecast. We load three years of real half-hourly demand for Victoria, roll it up to hourly, and score both approaches on the day they mattered most.

```r title="The forecast this case study earns"
library(fable); library(feasts); library(tsibble); library(tsibbledata)
library(dplyr); library(lubridate); library(tidyr); library(ggplot2)

# Roll the raw half-hourly demand up to hourly load
elec <- vic_elec |>
  index_by(Hour = floor_date(Time, "hour")) |>
  summarise(Demand = mean(Demand), Temperature = mean(Temperature),
            Holiday = any(Holiday)) |>
  ungroup() |>
  mutate(workday = !(as.integer(wday(Hour, week_start = 1)) >= 6 | Holiday),
         cool = pmax(Temperature - 18, 0),
         heat = pmax(18 - Temperature, 0))

history  <- elec |> filter_index("2013-11-01" ~ "2014-01-15")
tomorrow <- elec |> filter_index("2014-01-16")

history |>
  model(
    same_as_last_week = SNAIVE(Demand ~ lag("week")),
    temperature_model = TSLM(Demand ~ fourier(period = 24, K = 6) +
                             fourier(period = 168, K = 3) + cool + heat + workday)
  ) |>
  forecast(new_data = tomorrow) |>
  accuracy(elec) |>
  transmute(model = .model, RMSE = round(RMSE), MAPE = round(MAPE, 1))
#> # A tibble: 2 × 3
#>   model              RMSE  MAPE
#>   <chr>             <dbl> <dbl>
#> 1 same_as_last_week  2646  33.3
#> 2 temperature_model  1261  13.2
```

Read the two rows and the case study makes itself. On that 43-degree day, repeating last week's load was off by 2,646 megawatts on average, a 33% miss, because the previous week was mild. The temperature-aware model, reading the same weather forecast a meteorologist would hand the desk, cut that error to 1,261 megawatts, a 13% miss. Halving the error on the single hardest day of the year is worth millions when the shortfall settles at cap prices. Everything else in this tutorial exists to earn the right to trust that second number.

The data is real. It is the `vic_elec` series that ships with the `tsibbledata` package: half-hourly electricity demand and temperature for the whole state of Victoria, 2012 through 2014. We treat AuroraGrid as the operator of that grid, so the megawatt figures are state-scale, but the workflow is identical whether you forecast a state, a substation, or a single large factory.

[KEY INSIGHT]
**A load forecast is a procurement decision waiting to happen.** Every choice a forecaster makes, from how you handle temperature to which model you deploy, exists to make one downstream decision less wrong, and because the cost of being short is far larger than the cost of being long, we judge every choice by how well it protects the peak.

An engagement like this always moves through the same eight phases, and the rest of the tutorial walks them in order.

![A flowchart of the eight phases: business brief, data audit, EDA, feature build, strategy portfolio, tournament, executive summary, production](screenshots/Energy-Load-Forecasting-in-R-engagement-flow.webp)

*Figure 1: The eight phases of an end-to-end load-forecasting engagement.*

**Try it:** The desk also wants the single peak hour, because that is when the market is tightest. Adapt the block to forecast tomorrow's load with the temperature model alone, then pull out the hour with the highest predicted demand.

```r title="Your turn: find tomorrow's peak hour"
history |>
  model(temperature_model = TSLM(Demand ~ fourier(period = 24, K = 6) +
                                 fourier(period = 168, K = 3) + cool + heat + workday)) |>
  forecast(new_data = tomorrow) |>
  as_tibble() |>
  # keep the single highest predicted hour, then report it
  head()
```

<details>
<summary>Click to reveal solution</summary>

```r title="Predicted peak hour solution"
history |>
  model(temperature_model = TSLM(Demand ~ fourier(period = 24, K = 6) +
                                 fourier(period = 168, K = 3) + cool + heat + workday)) |>
  forecast(new_data = tomorrow) |>
  as_tibble() |>
  slice_max(.mean, n = 1) |>
  transmute(peak_hour = Hour, predicted_MW = round(.mean))
#> # A tibble: 1 × 2
#>   peak_hour           predicted_MW
#>   <dttm>                     <dbl>
#> 1 2014-01-16 15:00:00         7574
```

**Explanation:** The model expects the peak near 3pm at about 7,574 megawatts, far above a mild day's 5,500. The actual peak that day reached 9,313 megawatts, so even the good model under-calls a record heat event, a limitation we diagnose later in the tournament.

</details>

## Is the hourly load data clean enough to model?

A forecast is only as honest as the data beneath it, so the first real job is an audit. Sub-daily energy data has its own traps that monthly sales data never shows: clock changes, sensor dropouts, and demand spikes that are real events rather than errors. We check four things: how much history we hold, whether the calendar has holes, whether the numbers sit on a sensible scale, and whether anything looks like a data fault.

We already built `elec` in the opening block by rolling the raw half-hourly readings up to hourly load with `index_by()` and `summarise()`. Modelling hourly instead of half-hourly halves the number of rows with no loss of the patterns that matter for day-ahead scheduling, which clears in hourly blocks anyway. Start by looking at the object itself.

```r title="Glimpse the hourly load history"
elec |> select(Hour, Demand, Temperature, Holiday)
#> # A tsibble: 26,304 x 4 [1h] <Australia/Melbourne>
#>    Hour                Demand Temperature Holiday
#>    <dttm>               <dbl>       <dbl> <lgl>  
#>  1 2012-01-01 00:00:00  4323.        21.2 TRUE   
#>  2 2012-01-01 01:00:00  3963.        20.6 TRUE   
#>  3 2012-01-01 02:00:00  3951.        20.3 TRUE   
#>  4 2012-01-01 03:00:00  3628.        19.8 TRUE   
#>  5 2012-01-01 04:00:00  3396.        19.0 TRUE   
#>  6 2012-01-01 05:00:00  3318.        18.7 TRUE   
#>  7 2012-01-01 06:00:00  3274.        18.7 TRUE   
#>  8 2012-01-01 07:00:00  3432.        19.6 TRUE   
#>  9 2012-01-01 08:00:00  3650.        21.8 TRUE   
#> 10 2012-01-01 09:00:00  4001.        24.6 TRUE   
#> # ℹ 26,294 more rows
```

The header carries the vital facts. This is a tsibble, a data frame that knows its `Hour` column is time. The `[1h]` is the interval, one hour between rows, and `<Australia/Melbourne>` is the timezone, which will matter in a moment. Demand is in megawatts, temperature in degrees Celsius. Twenty-six thousand hourly readings across three years is a generous amount of history.

Now the checks that catch problems. A demand series can hide missing hours, a feed outage or a dead sensor, that quietly break a model. We count the rows, confirm the span, look for missing values, and ask `count_gaps()` whether any expected hour is absent.

```r title="Check coverage and calendar gaps"
c(rows    = nrow(elec),
  first   = as.character(min(elec$Hour)),
  last    = as.character(max(elec$Hour)),
  missing = sum(is.na(elec$Demand)))
#>                  rows                 first                  last 
#>               "26304"          "2012-01-01" "2014-12-31 23:00:00" 
#>               missing 
#>                   "0" 

count_gaps(elec)
#> # A tibble: 0 × 3
#> # ℹ 3 variables: .from <dttm>, .to <dttm>, .n <int>
```

Both checks come back clean: 26,304 hours from the start of 2012 to the end of 2014, no missing demand, and a zero-row gap table, which means every hour between the first and last is present. On a messier series you would repair it with `fill_gaps()` before modelling.

There is one sub-daily gotcha that a naive gap check misses, and it hides in the timezone. Twice a year the clocks change for daylight saving. On the spring-forward day an hour vanishes, and on the fall-back day an hour repeats. Because our index is in local Melbourne time, some days do not have 24 hours. We can see it by counting hours per day.

```r title="Find the daylight-saving days"
elec |>
  index_by(date = as_date(Hour)) |>
  summarise(hours = n()) |>
  filter(hours != 24)
#> # A tsibble: 6 x 2 [1D]
#>   date       hours
#>   <date>     <int>
#> 1 2012-04-01    25
#> 2 2012-10-07    23
#> 3 2013-04-07    25
#> 4 2013-10-06    23
#> 5 2014-04-06    25
#> 6 2014-10-05    23
```

Six days over three years break the 24-hour rule: three April days with 25 hours (clocks fall back) and three October days with 23 hours (clocks spring forward). This is not a data error, it is the calendar, and it is exactly why a load model built on local time needs a season term that tolerates the odd short or long day rather than assuming a rigid 24-hour block.

[NOTE]
**Sub-daily energy data lives in two clocks, and you must pick one on purpose.** Local time keeps demand aligned with human behaviour (people cook dinner at 7pm regardless of daylight saving), which is what a load model wants, at the price of these six irregular days. Modelling in UTC instead removes the irregular days but smears the evening peak across the clock change. We keep local time here.

Finally, scale and outliers. A quick five-number summary tells us whether the megawatt figures are plausible and flags any wild values.

```r title="Summarise the demand scale"
summary(elec$Demand)
#>    Min. 1st Qu.  Median    Mean 3rd Qu.    Max. 
#>    2864    3970    4635    4665    5244    9313 
```

Demand runs from about 2,860 megawatts in the small hours to 9,313 at the top. The maximum is more than three times the minimum, a huge swing, and that top value is the record heat afternoon from the opening block.

[WARNING]
**Do not clip the 9,313 megawatt peak as an outlier.** A demand spike that lines up with a 43-degree day is real load driven by air-conditioning, not a sensor fault, and deleting it would teach the model to under-forecast the exact hours that cost the most. Investigate spikes that have no physical explanation; keep the ones that match the weather.

**Try it:** A load series should never be zero or negative. Confirm the minimum demand is comfortably positive and that no value is missing, in one summary.

```r title="Your turn: sanity-check the values"
elec |>
  as_tibble() |>
  # report the minimum demand and whether any value is missing
  head()
```

<details>
<summary>Click to reveal solution</summary>

```r title="Value sanity-check solution"
elec |>
  as_tibble() |>
  summarise(min_MW = min(Demand), any_na = anyNA(Demand))
#> # A tibble: 1 × 2
#>   min_MW any_na
#>    <dbl> <lgl> 
#> 1  2864. FALSE 
```

**Explanation:** The floor is 2,864 megawatts and nothing is missing, so the series is physically sensible: a grid always draws some power, even at 4am.

</details>

## What patterns hide in hourly electricity demand?

The audit told us the data is trustworthy. Now we explore its structure, because the shape of a load series decides which models can fit it. Electricity demand is one of the most patterned series in all of forecasting, and we will pull out three layers: how much of it is season versus trend, what the daily and weekly shapes look like, and how the calendar bends them. Each view changes a modelling decision.

Start with a single summary. The `feat_stl()` feature from feasts runs a decomposition under the hood and reports the strength of the trend and the strength of the daily season, each on a 0-to-1 scale where 1 means "dominates completely".

```r title="Measure trend and seasonal strength"
elec |>
  features(Demand, feat_stl) |>
  transmute(trend_strength = round(trend_strength, 3),
            seasonal_strength_day = round(seasonal_strength_day, 3))
#> # A tibble: 1 × 2
#>   trend_strength seasonal_strength_day
#>            <dbl>                 <dbl>
#> 1          0.851                 0.887
```

A daily seasonal strength of 0.887 is enormous. It says the within-day pattern, the rise and fall between 4am and 6pm, is the single biggest feature of the series, even ahead of the slow trend at 0.851. That one number rules out any model that cannot handle strong seasonality and tells us the daily cycle is the thing to nail.

To see that daily cycle, look at a short slice of the raw series. A fortnight of hourly load shows both rhythms at once.

![Line chart of two weeks of hourly demand with a daily double-peak and lower weekend bands shaded](screenshots/Energy-Load-Forecasting-in-R-two-week-trace.webp)

*Figure 2: Hourly load carries a daily double-peak inside a weekly rhythm.*

Two patterns stack on top of each other. Within each day, demand traces a double hump: a morning shoulder as the state wakes and switches on, and a taller evening peak as people come home. Across each week, the five weekdays sit higher than the shaded weekends. That is two seasonal periods in one series, a daily cycle of 24 hours and a weekly cycle of 168 hours, which is what makes sub-daily load harder than the monthly sales you may have forecast before.

To see the daily shape on its own, overlay one line per day. The `gg_season()` helper from feasts wraps every day onto a common 24-hour axis.

```r title="Plot the daily shape across many days"
elec |>
  filter_index("2014-06-01" ~ "2014-07-13") |>
  gg_season(Demand, period = "day")
```

![Seasonal plot with one line per day wrapped onto a 24-hour axis, all sharing a morning shoulder and an evening peak near 6pm](screenshots/Energy-Load-Forecasting-in-R-gg-season-daily.webp)

*Figure 3: The daily load shape: a morning shoulder and an evening peak.*

Every day traces the same path: a trough around 4am, a climb to a morning shoulder near 9am, a midday plateau, and the day's high near 6pm before the evening wind-down. The lines fan apart in the afternoon because that is when weather does its work, some days far hotter than others, but the skeleton is remarkably stable. A stable daily shape is exactly what you want, because it means the model can learn one profile and reuse it.

Now the calendar. The audit already gave us a workday flag (a weekday that is not a public holiday). Averaging the demand within each day type shows how much the calendar moves the load.

```r title="Compare workdays, weekends and holidays"
elec |>
  as_tibble() |>
  mutate(day_type = case_when(Holiday ~ "holiday", !workday ~ "weekend",
                              TRUE ~ "workday")) |>
  group_by(day_type) |>
  summarise(mean_MW = round(mean(Demand)), peak_MW = round(max(Demand)),
            .groups = "drop")
#> # A tibble: 3 × 3
#>   day_type mean_MW peak_MW
#>   <chr>      <dbl>   <dbl>
#> 1 holiday     4061    7508
#> 2 weekend     4173    7804
#> 3 workday     4895    9313
```

A workday averages 4,895 megawatts, about 17% above a weekend and 20% above a public holiday. Offices, factories and schools switch on together on weekday mornings, and that block of business load is the difference. The three day types also draw slightly different shapes, which the picture makes clear.

![Line chart of average demand by hour of day for workdays, weekends and holidays, with workdays adding a sharp business-hours block](screenshots/Energy-Load-Forecasting-in-R-calendar-profiles.webp)

*Figure 4: Workdays, weekends and holidays draw different load shapes.*

The workday line sits above the other two through the whole business day and carries a sharper morning shoulder; weekends and holidays are lower and flatter, waking later. This tells us a good model needs more than a smooth weekly wave; it needs to know whether tomorrow is a working day.

[KEY INSIGHT]
**Hourly load is driven by three clocks at once: the hour of the day, the day of the week, and the calendar.** A model that captures only the daily cycle will miss every weekend; one that adds the weekly cycle will still miss public holidays. We will feed all three into the model as separate features rather than hoping one seasonal term absorbs them all.

**Try it:** The feasts package can also wrap the data onto a weekly axis. Draw the weekly-scale seasonal plot to see the weekday-to-weekend drop directly.

```r title="Your turn: plot the weekly shape"
elec |>
  filter_index("2014-06-01" ~ "2014-07-13") |>
  # change the period to view the weekly cycle
  gg_season(Demand, period = "day")
```

<details>
<summary>Click to reveal solution</summary>

```r title="Weekly seasonal plot solution"
elec |>
  filter_index("2014-06-01" ~ "2014-07-13") |>
  gg_season(Demand, period = "week")
```

**Explanation:** Switching `period = "week"` wraps the series onto a Monday-to-Sunday axis. Each line is one week, and you can read the weekday plateau falling away into the weekend, the same 17% drop the table quantified.

</details>

## Why does temperature bend the load curve?

The seasonal shapes explain the calm days. The wild days, the ones that decide the year, are driven by weather. Electricity load and temperature have one of the most important nonlinear relationships in applied forecasting, and understanding its shape is what separates a load model from a generic time series model.

The cleanest way to see the relationship is to group demand into temperature bands and read the average load in each.

```r title="Average demand by temperature band"
elec |>
  as_tibble() |>
  mutate(temp_band = cut(Temperature, breaks = c(0, 12, 18, 24, 30, 36, 45))) |>
  group_by(temp_band) |>
  summarise(mean_MW = round(mean(Demand)), hours = n(), .groups = "drop")
#> # A tibble: 6 × 3
#>   temp_band mean_MW hours
#>   <fct>       <dbl> <int>
#> 1 (0,12]       4645  5962
#> 2 (12,18]      4525 11887
#> 3 (18,24]      4597  6001
#> 4 (24,30]      5177  1787
#> 5 (30,36]      6357   565
#> 6 (36,45]      7906   102
```

Read the mean-demand column and the shape jumps out. Demand bottoms out at about 4,525 megawatts in the mild 12-to-18 band, ticks up slightly in the cold, then explodes on the hot side: 5,177 at 24 to 30 degrees, 6,357 at 30 to 36, and 7,906 above 36. The last band is built from only 102 hours across three years, but those 102 hours are precisely the peaks that break the budget. Plotting every hour draws the same shape as a smooth curve.

![Scatter of demand against temperature with a smooth curve forming a U: heating lifts the cold end, air-conditioning drives a steep hot end](screenshots/Energy-Load-Forecasting-in-R-load-temperature.webp)

*Figure 5: Demand versus temperature is a U, not a line.*

The relationship is a U, not a straight line. Demand is lowest in the mild middle, around 18 degrees, where nobody needs to heat or cool. As it gets colder, heaters switch on and demand climbs gently. As it gets hotter, air-conditioners switch on and demand climbs steeply, far more steeply than the heating side, until a 43-degree afternoon pushes the state past 9,000 megawatts. The two arms of the U are driven by different appliances, and the cooling arm is the dangerous one, because a hot-day forecast is exquisitely sensitive to the temperature it assumes.

To confirm the season and the weather are separable, decompose a few weeks with STL, telling it to fit both a daily and a weekly season.

```r title="Decompose load with two seasonal periods"
elec |>
  filter_index("2013-12-02" ~ "2013-12-22") |>
  model(STL(Demand ~ season(period = 24) + season(period = 168), robust = TRUE)) |>
  components() |>
  autoplot()
```

![STL decomposition into five panels: the data, a gentle trend, a large daily season, a smaller weekly season, and a remainder that spikes on hot days](screenshots/Energy-Load-Forecasting-in-R-stl-decomposition.webp)

*Figure 6: STL splits load into trend, a daily and a weekly season, and a remainder.*

STL pulls the series apart into a gentle trend, a big daily season (the `season_24` panel, swinging plus or minus 1,000 megawatts), a smaller weekly season (`season_168`), and a remainder. Notice the remainder is small and flat most of the time but jumps on a couple of days. Those jumps are the weather, the part no fixed seasonal pattern can explain, and they are exactly what temperature features are for.

[KEY INSIGHT]
**Temperature drives the extremes, seasonality drives the routine.** The daily and weekly cycles explain the calm 90% of hours, but the peaks that decide the procurement bill are weather events, so a competitive load model must carry temperature as an explicit input, and it must carry it in a shape that bends, because the response is a U, not a line.

**Try it:** A straight line through the U fits badly. Show that the demand correlates more strongly with distance from the 18-degree comfort point than with raw temperature.

```r title="Your turn: measure the U with correlations"
elec |>
  as_tibble() |>
  # correlate demand with raw temperature, and with |Temperature - 18|
  summarise(straight_line = round(cor(Demand, Temperature), 3))
```

<details>
<summary>Click to reveal solution</summary>

```r title="U-shape correlation solution"
elec |>
  as_tibble() |>
  summarise(straight_line = round(cor(Demand, Temperature), 3),
            distance_from_18 = round(cor(Demand, abs(Temperature - 18)), 3))
#> # A tibble: 1 × 2
#>   straight_line distance_from_18
#>           <dbl>            <dbl>
#> 1          0.26             0.33
```

**Explanation:** Raw temperature correlates only 0.26 with demand, because the cold and hot arms of the U pull in opposite directions and cancel. Distance from 18 degrees correlates 0.33, higher, because it treats both arms as "further from comfort means more load". This is the numeric fingerprint of the U shape.

</details>

## How do you turn weather and the calendar into model features?

The EDA handed us a shopping list: two seasonal cycles, a calendar effect, and a U-shaped temperature response. Now we turn each into a column the models can use. Good features are where a load forecast is won or lost, because they encode the physics the model cannot discover on its own.

In the opening block we quietly used three engineered columns. Here is what they are, plus one more that captures a subtlety of heat.

The temperature response is the star, and we encode its U shape with two degree-hour variables. Cooling degree-hours, `cool`, measure how far above 18 degrees it is (zero when it is cool), and drive the air-conditioning arm. Heating degree-hours, `heat`, measure how far below 18 it is, and drive the heating arm. Splitting the U at its base like this lets a straight-line regression bend, because each arm gets its own slope.

Heat also lingers. On the third day of a heatwave, buildings have soaked up warmth and demand runs higher than the same temperature on day one. We capture that memory with `cool_lag`, yesterday's cooling degree-hours at the same hour.

```r title="Engineer the temperature and calendar features"
elec <- elec |> mutate(cool_lag = lag(cool, 24))

elec |>
  filter_index("2014-01-16 15" ~ "2014-01-16 18") |>
  select(Hour, Demand, Temperature, cool, heat, cool_lag, workday)
#> # A tsibble: 4 x 7 [1h] <Australia/Melbourne>
#>   Hour                Demand Temperature  cool  heat cool_lag workday
#>   <dttm>               <dbl>       <dbl> <dbl> <dbl>    <dbl> <lgl>  
#> 1 2014-01-16 15:00:00  9214.        42.8  24.8     0     19.5 TRUE   
#> 2 2014-01-16 16:00:00  9307.        39.9  21.9     0     19.3 TRUE   
#> 3 2014-01-16 17:00:00  9313.        39.8  21.8     0     17.4 TRUE   
#> 4 2014-01-16 18:00:00  9006.        40.8  22.8     0     14.8 TRUE   
```

Look at the record 3pm hour: 42.8 degrees gives 24.8 cooling degree-hours and zero heating degree-hours, and `cool_lag` of 19.5 says yesterday was hot too, so heat has been building. The `workday` flag confirms it was a Thursday. Those four columns, plus the seasonal terms below, are the model's entire view of the world.

That leaves the two seasonal cycles. We could add a dummy variable for every hour of the day and every hour of the week, but that is 24 plus 168 columns of clutter. Instead we use Fourier terms, a handful of sine and cosine waves that trace a smooth repeating shape with far fewer parameters. In fable, `fourier(period = 24, K = 6)` draws the daily cycle with six wave pairs and `fourier(period = 168, K = 3)` draws the weekly cycle with three.

[NOTE]
**Fourier terms are the standard way to model multiple seasonality in a regression.** A period of 24 with K wave pairs captures the daily shape; a period of 168 captures the weekly shape. The number K controls how wiggly the fitted shape can be, and you raise it until the shape stops improving. Two Fourier blocks in one formula is how a single regression carries two seasons at once.

**Try it:** We built cooling degree-hours; now build the heating side and confirm both make sense. Count how many hours the state spent heating versus cooling, and find the coldest reading.

```r title="Your turn: summarise the degree-hour features"
elec |>
  as_tibble() |>
  # report the largest heat value, and how many hours had heat > 0 vs cool > 0
  head()
```

<details>
<summary>Click to reveal solution</summary>

```r title="Degree-hour summary solution"
elec |>
  as_tibble() |>
  summarise(coldest = round(max(heat), 1),
            hours_heating = sum(heat > 0),
            hours_cooling = sum(cool > 0))
#> # A tibble: 1 × 3
#>   coldest hours_heating hours_cooling
#>     <dbl>         <int>         <int>
#> 1    16.4         17778          8455
```

**Explanation:** The coldest hour was 16.4 degrees below the 18-degree base (about 1.6 degrees Celsius). Victoria spent far more hours heating (17,778) than cooling (8,455), which fits a temperate climate, but the cooling hours, though fewer, contain the extreme peaks.

</details>

## Which forecasting strategies suit sub-daily load?

We now know the shape of the problem: two strong seasonal cycles, a workday effect, and a steep U-shaped temperature response. That points to a short list of strategies, and a good forecaster tries several rather than betting on one. We fit five genuinely different models, each a plausible answer to this specific problem, and at least two of them handle the multiple seasonality head-on.

First split the history. We train on everything up to 12 January 2014 and hold out the week of 13 to 19 January, the heatwave week, as our first test. No model gets to see the days it will be judged on. The `filter_index()` helper selects rows by date: a two-sided `"2013-11-01" ~ "2014-01-19"` keeps every hour between those two dates, and a one-sided `~ "2014-01-12"` keeps everything up to and including that day.

Each model earns its place for a reason:

1. **Seasonal naive** repeats the load from the same hour one week ago. It is the honest benchmark: if a model cannot beat "same time last week", it is not worth deploying.
2. **Harmonic regression** is a linear model with the two Fourier blocks, the degree-hour features, and the workday flag. It is transparent, so you can read the effect of every driver, and it handles both seasons through the Fourier terms.
3. **Dynamic harmonic regression** takes that same regression and lets ARIMA errors model whatever autocorrelation is left over, so a miss in one hour informs the next. The `PDQ(0,0,0)` switches off ARIMA's own seasonal machinery, because the Fourier terms already carry the seasonality.
4. **STL hybrid** decomposes the load into its two seasons and a seasonally adjusted remainder, forecasts that smooth remainder with exponential smoothing, then adds the seasons back. It handles multiple seasonality through the decomposition rather than through the regression.
5. **Combination** averages the three model-based forecasts, because blending models that make different errors often beats any one of them.

All five fit in one `model()` call, and the combination is built by averaging the three model columns.

```r title="Fit the five-strategy portfolio"
win   <- elec |> filter_index("2013-11-01" ~ "2014-01-19")
train <- win |> filter_index(~ "2014-01-12")
test  <- win |> filter_index("2014-01-13" ~ "2014-01-19")

fits <- train |>
  model(
    seasonal_naive = SNAIVE(Demand ~ lag("week")),
    harmonic = TSLM(Demand ~ fourier(period = 24, K = 6) +
                    fourier(period = 168, K = 3) + cool + heat + cool_lag + workday),
    dynamic_hr = ARIMA(Demand ~ fourier(period = 24, K = 6) +
                       fourier(period = 168, K = 3) + cool + heat + cool_lag + workday +
                       pdq(2, 0, 1) + PDQ(0, 0, 0)),
    stl_hybrid = decomposition_model(
      STL(Demand ~ season(period = 24) + season(period = 168), robust = TRUE),
      ETS(season_adjust ~ error("A") + trend("N") + season("N")))
  ) |>
  mutate(combo = (harmonic + dynamic_hr + stl_hybrid) / 3)
fits
#> # A mable: 1 x 5
#>   seasonal_naive harmonic                  dynamic_hr                stl_hybrid         combo
#>          <model>  <model>                     <model>                   <model>       <model>
#> 1       <SNAIVE>   <TSLM> <LM w/ ARIMA(2,0,1) errors> <STL decomposition model> <COMBINATION>
```

The result is a mable, a table of fitted models, one per strategy. Each label tells a story. The harmonic model is a plain `TSLM`. The dynamic harmonic model came back as `LM w/ ARIMA(2,0,1) errors`, meaning the search found that a second-order autoregressive, first-order moving-average error process mops up the leftover hour-to-hour correlation. The STL hybrid is flagged as a decomposition model.

The harmonic regression is the transparent one, so use it to read the drivers straight off the coefficients. Because the model is linear in the features, each coefficient is a megawatts-per-unit effect.

```r title="Read the demand drivers from the regression"
fits |>
  select(harmonic) |>
  tidy() |>
  filter(term %in% c("cool", "heat", "cool_lag", "workdayTRUE")) |>
  transmute(term, estimate = round(estimate, 1), p.value = signif(p.value, 2))
#> # A tibble: 4 × 3
#>   term        estimate   p.value
#>   <chr>          <dbl>     <dbl>
#> 1 cool            79.6 1.40e-125
#> 2 heat            65.2 4.6 e- 34
#> 3 cool_lag        34.4 4.50e- 31
#> 4 workdayTRUE    711.  2.20e- 95
```

These four numbers are the physics of the grid in plain sight, and every one is significant beyond doubt. Each cooling degree-hour adds 79.6 megawatts of demand, so a jump from 18 to 40 degrees adds roughly 22 times 80, about 1,750 megawatts, from air-conditioning alone. Each heating degree-hour adds 65.2 megawatts. Yesterday's heat adds another 34.4 megawatts per lagged cooling degree-hour, confirming that heat carries over. And a working day adds a flat 711 megawatts of business load. A stakeholder needs no statistics to act on "every degree above 18 adds about 80 megawatts".

[TIP]
**Always keep the seasonal naive benchmark in the field, even when you expect it to lose.** It is the yardstick every other model is measured against, and a sophisticated model that cannot beat "same time last week" is quietly telling you its extra complexity is buying nothing.

**Try it:** How much is temperature actually worth? Fit the harmonic model with and without the temperature features on the training set, forecast the heatwave week, and compare their errors.

```r title="Your turn: price the temperature features"
train |>
  model(
    with_temp = TSLM(Demand ~ fourier(period = 24, K = 6) +
                     fourier(period = 168, K = 3) + cool + heat + cool_lag + workday),
    no_temp   = TSLM(Demand ~ fourier(period = 24, K = 6) +
                     fourier(period = 168, K = 3) + workday)
  ) |>
  forecast(new_data = test) |>
  accuracy(win) |>
  transmute(.model, RMSE = round(RMSE), MAPE = round(MAPE, 1)) |>
  # sort so the better model is on top
  head()
```

<details>
<summary>Click to reveal solution</summary>

```r title="Temperature-value solution"
train |>
  model(
    with_temp = TSLM(Demand ~ fourier(period = 24, K = 6) +
                     fourier(period = 168, K = 3) + cool + heat + cool_lag + workday),
    no_temp   = TSLM(Demand ~ fourier(period = 24, K = 6) +
                     fourier(period = 168, K = 3) + workday)
  ) |>
  forecast(new_data = test) |>
  accuracy(win) |>
  transmute(.model, RMSE = round(RMSE), MAPE = round(MAPE, 1)) |>
  arrange(RMSE)
#> # A tibble: 2 × 3
#>   .model     RMSE  MAPE
#>   <chr>     <dbl> <dbl>
#> 1 with_temp  1111  12.5
#> 2 no_temp    2130  23.6
```

**Explanation:** Dropping temperature nearly doubles the error over the heatwave week, from 1,111 to 2,130 megawatts. The Fourier seasons and the workday flag alone cannot see a heatwave coming; the degree-hour features are what make the model earn its keep.

</details>

## Which model actually wins on data it has not seen?

Five models are fitted. Now comes the honest part: judging them on data they never saw. This is the step that decides whether a forecasting project succeeds, because a model that hugs the training data can still forecast the future terribly. We judge in three ways: a first look at the heatwave week, a proper rolling backtest across many days, and a check that the prediction intervals can be trusted.

Start with the heatwave hold-out. We forecast the week of 13 to 19 January, feeding each model the actual temperatures for that week, and score them with `accuracy()`.

```r title="Score the models on the heatwave week"
fc <- fits |> forecast(new_data = test)
fc |>
  accuracy(win) |>
  select(.model, RMSE, MAE, MAPE, MASE) |>
  mutate(across(RMSE:MASE, function(x) round(x, 1))) |>
  arrange(RMSE)
#> # A tibble: 5 × 5
#>   .model          RMSE   MAE  MAPE  MASE
#>   <chr>          <dbl> <dbl> <dbl> <dbl>
#> 1 harmonic       1111.  859.  12.5   2.2
#> 2 combo          1631  1240.  17.4   3.2
#> 3 dynamic_hr     1646. 1256.  17.8   3.3
#> 4 seasonal_naive 2094. 1598.  22.8   4.2
#> 5 stl_hybrid     2170. 1646   23.1   4.3
```

The transparent harmonic regression wins outright at 1,111 megawatts, because it reads temperature and the heatwave was all about temperature. Seasonal naive and the STL hybrid, the two models with no view of the weather, land at the bottom near 2,100 megawatts, because "last week" and "the usual season" both said "mild". Interestingly the dynamic harmonic model, which fit the training data best, forecast worse than the plain harmonic here: over a seven-day horizon through a regime shift, its short-term error dynamics add little and can overshoot. A picture makes the gap vivid.

![Line chart of the heatwave week with the actual load towering above a flat seasonal-naive forecast, while the temperature models track the peaks](screenshots/Energy-Load-Forecasting-in-R-heatwave-forecast.webp)

*Figure 7: The heat-wave week: temperature models track, "same as last week" collapses.*

The black actual line spikes above 9,000 megawatts on the hot days; the temperature models (blue and green) climb with it, while the seasonal naive line (red) stays flat near 6,000, repeating the mild prior week and missing the peak by roughly 3,000 megawatts. But look at the calm weekend on the right, where all the lines converge. A single week hides a more nuanced story, so break the error down day by day.

```r title="Break the error down by day"
fc |>
  as_tibble() |>
  mutate(day = as_date(Hour)) |>
  left_join(as_tibble(test) |> select(Hour, actual = Demand), by = "Hour") |>
  group_by(.model, day) |>
  summarise(rmse = round(sqrt(mean((.mean - actual)^2))), .groups = "drop") |>
  filter(.model %in% c("harmonic", "seasonal_naive")) |>
  pivot_wider(names_from = .model, values_from = rmse)
#> # A tibble: 7 × 3
#>   day        harmonic seasonal_naive
#>   <date>        <dbl>          <dbl>
#> 1 2014-01-13      861           1487
#> 2 2014-01-14     1377           2929
#> 3 2014-01-15     1398           3090
#> 4 2014-01-16     1486           2646
#> 5 2014-01-17     1252           1778
#> 6 2014-01-18      371            415
#> 7 2014-01-19      376            114
```

Read the two columns against each other and the crossover jumps out. Through the hot days of 14 to 17 January the temperature model crushes seasonal naive, halving the error or better. But on the cool weekend of 18 and 19 January the gap closes, and on the 19th seasonal naive actually wins (114 versus 376), because that quiet Sunday really did look like the previous Sunday. The bar chart shows the whole week at a glance.

![Grouped bar chart of daily RMSE for each model across the heatwave week, temperature models lowest on hot days, seasonal naive lowest on the cool weekend](screenshots/Energy-Load-Forecasting-in-R-per-day-rmse.webp)

*Figure 8: Who wins the peak, who wins the shoulder.*

That is the real lesson of a tournament: no model owns every day. Temperature models own the peaks; the naive rule is fine on quiet days. To choose one model to deploy, we cannot rely on a single week, so we run a rolling backtest. We step an origin forward through January, and at each origin we refit every model on the previous six weeks and forecast the next day, the day-ahead horizon the desk actually uses. This is the slowest block in the tutorial, because it refits every model at ten different origins.

```r title="Backtest day-ahead across many origins"
backtest_day <- function(origin) {
  tr <- elec |> filter_index(as.character(origin - 42) ~ as.character(origin - 1))
  te <- elec |> filter_index(as.character(origin))
  tr |>
    model(
      seasonal_naive = SNAIVE(Demand ~ lag("week")),
      harmonic = TSLM(Demand ~ fourier(period = 24, K = 6) +
                      fourier(period = 168, K = 3) + cool + heat + cool_lag + workday),
      dynamic_hr = ARIMA(Demand ~ fourier(period = 24, K = 6) +
                         fourier(period = 168, K = 3) + cool + heat + cool_lag + workday +
                         pdq(2, 0, 1) + PDQ(0, 0, 0))
    ) |>
    forecast(new_data = te) |>
    accuracy(elec) |>
    mutate(origin = origin, hot = max(te$Temperature) >= 32)
}
origins <- seq(as_date("2014-01-06"), as_date("2014-01-24"), by = 2)
cv <- purrr::map_dfr(origins, backtest_day)

cv |>
  group_by(.model) |>
  summarise(RMSE = round(mean(RMSE)), MAE = round(mean(MAE)),
            MAPE = round(mean(MAPE), 1), .groups = "drop") |>
  arrange(RMSE)
#> # A tibble: 3 × 4
#>   .model          RMSE   MAE  MAPE
#>   <chr>          <dbl> <dbl> <dbl>
#> 1 harmonic         481   406   7.6
#> 2 dynamic_hr       661   541   8.7
#> 3 seasonal_naive  1533  1359  24.4
```

Across ten forecast days the picture holds: the temperature models average a day-ahead error near 500 megawatts (about 7.6% for harmonic), while seasonal naive is three times worse at 1,533. Day-ahead, you should always use a model. But averaging over hot and mild days together hides which model to reach for on which day, so split the backtest by conditions.

```r title="Split the backtest by conditions"
cv |>
  group_by(.model, conditions = if_else(hot, "hot day", "mild day")) |>
  summarise(RMSE = round(mean(RMSE)), .groups = "drop") |>
  pivot_wider(names_from = conditions, values_from = RMSE)
#> # A tibble: 3 × 3
#>   .model         `hot day` `mild day`
#>   <chr>              <dbl>      <dbl>
#> 1 dynamic_hr          1548        281
#> 2 harmonic             741        370
#> 3 seasonal_naive      2410       1157
```

Now the two temperature models split the work. On mild days the dynamic harmonic model wins (281 versus 370), because when nothing dramatic is happening, its short-term error correction shaves the last bit off a routine forecast. On hot days the plain harmonic wins by a wide margin (741 versus 1,548), because during a fast temperature swing the ARIMA error dynamics chase the wrong signal, while the transparent regression just follows the thermometer. This is the kind of nuance that only a conditioned backtest reveals.

Point accuracy is only half the job. The desk sizes its reserve from the prediction interval, so an interval that lies about its own uncertainty is dangerous even when the point forecast is good. Check how often the actual load fell inside each model's stated 80% and 95% bands over the heatwave week.

```r title="Check whether the intervals can be trusted"
fc |>
  hilo(level = c(80, 95)) |>
  as_tibble() |>
  left_join(as_tibble(test) |> select(Hour, actual = Demand), by = "Hour") |>
  mutate(in80 = actual >= `80%`$lower & actual <= `80%`$upper,
         in95 = actual >= `95%`$lower & actual <= `95%`$upper) |>
  group_by(.model) |>
  summarise(covered_80 = round(100 * mean(in80)),
            covered_95 = round(100 * mean(in95)), .groups = "drop") |>
  arrange(desc(covered_95))
#> # A tibble: 5 × 3
#>   .model         covered_80 covered_95
#>   <chr>               <dbl>      <dbl>
#> 1 stl_hybrid             48         60
#> 2 harmonic               41         57
#> 3 dynamic_hr             38         51
#> 4 combo                  38         48
#> 5 seasonal_naive         42         48
```

Every model badly under-covers. Harmonic's 95% band, which should contain the truth 95% of the time, caught only 57% of the actual hours, and its 80% band only 41%. The reason is instructive: the intervals were estimated from ordinary weeks, and a record heatwave is far more variable than an ordinary week, so bands calibrated on calm data are far too narrow exactly when the risk is highest.

[WARNING]
**Prediction intervals fitted on calm data understate the risk during an extreme event.** The heatwave week blew straight through every model's 95% band, so treating a fitted interval as a hard reserve level would have left the grid dangerously short. During known extreme-weather events, widen the reserve by hand rather than trusting the model's interval.

There is one more honesty check. Even the winning harmonic model has a worst day, and it is worth diagnosing. Its largest daily error over the heatwave week was on 16 January, the day of the record 9,313-megawatt peak. The model under-called that peak because two forces compound at the extreme: the temperature response, though bent, still underestimates how fast demand accelerates past 40 degrees, and heat had been accumulating for days in a way a single lagged term only partly captures. The failure is not random; it is the model reaching the edge of what its features can express.

**Try it:** Different error measures can reorder a ranking. Rank the three backtested models by MAPE instead of RMSE and confirm the winner does not change.

```r title="Your turn: rank the backtest by MAPE"
cv |>
  group_by(.model) |>
  summarise(RMSE = round(mean(RMSE)), .groups = "drop") |>
  # summarise MAPE instead, and sort by it
  arrange(RMSE)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Backtest ranked by MAPE solution"
cv |>
  group_by(.model) |>
  summarise(MAPE = round(mean(MAPE), 1), .groups = "drop") |>
  arrange(MAPE)
#> # A tibble: 3 × 2
#>   .model          MAPE
#>   <chr>          <dbl>
#> 1 harmonic         7.6
#> 2 dynamic_hr       8.7
#> 3 seasonal_naive  24.4
```

**Explanation:** The order is unchanged: harmonic on top, then dynamic harmonic, then seasonal naive far behind. When two different error measures agree on the ranking, you can trust it is not an artefact of one metric.

</details>

## What do you tell the people who buy the power?

This section is for the people who never see a line of R: the traders and schedulers who turn the forecast into purchase orders. It should read on its own, so here is the whole engagement in plain language.

**The recommendation, in one sentence:** deploy the temperature-aware harmonic regression as the day-ahead workhorse, lean on the dynamic harmonic model on calm days, and keep "same as last week" only as a sanity check. The decision rule is small enough to pin above the desk.

![A decision tree: for a day-ahead forecast, if a heat or cold event is forecast use harmonic regression, otherwise use dynamic harmonic, and hedge with the combination](screenshots/Energy-Load-Forecasting-in-R-model-decision.webp)

*Figure 9: Which model to run for tomorrow's load.*

The quantified impact is the headline. Across the January backtest, the temperature model cut the day-ahead error from the naive rule's 1,533 megawatts to 481, a reduction of about 1,000 megawatts of average miss.

```r title="State the impact in one table"
tibble(rule = c("same as last week", "temperature model"),
       day_ahead_RMSE_MW = c(1533, 481),
       avg_error_pct = c(24.4, 7.6))
#> # A tibble: 2 × 3
#>   rule              day_ahead_RMSE_MW avg_error_pct
#>   <chr>                         <dbl>         <dbl>
#> 1 same as last week              1533          24.4
#> 2 temperature model               481           7.6
```

Here is what those numbers mean for the business, with no jargon:

| What the desk asks | What the forecast says |
|---|---|
| How good is the day-ahead number? | Off by about 7.6% on average, versus 24% for the old rule. |
| Where does it help most? | On hot days, where it halves the peak miss that costs the most. |
| What is the peak error worth? | Cutting a 3,000 megawatt peak miss to 1,500 avoids buying that gap at cap prices. |
| Which model runs tomorrow? | Harmonic if heat or cold is forecast, dynamic harmonic on calm days. |

[TIP]
**Order to the point forecast and size the reserve from the upper bound, then widen it by hand for forecast heat.** The point forecast sets the base schedule; the interval sets the reserve on a normal day; but because the bands understate extreme risk, a forecast heatwave is the cue to add reserve above what the model suggests.

**The top three caveats, stated up front.** The first is the one that keeps forecasters awake: **the model runs on a weather forecast, not the real weather.** In this case study we fed it the actual temperatures; in production tomorrow's temperature is itself a forecast, and its error flows straight into the load forecast. We can measure that sensitivity by shifting the temperatures the model sees.

```r title="Test the dependence on the weather forecast"
score_temp <- function(shift) {
  te <- test |> mutate(cool = pmax(Temperature + shift - 18, 0),
                       heat = pmax(18 - (Temperature + shift), 0))
  fits |> select(harmonic) |> forecast(new_data = te) |>
    accuracy(win) |> pull(RMSE) |> round()
}
tibble(weather_forecast = c("2C too cool", "perfect", "2C too warm"),
       RMSE = c(score_temp(-2), score_temp(0), score_temp(2)))
#> # A tibble: 3 × 2
#>   weather_forecast  RMSE
#>   <chr>            <dbl>
#> 1 2C too cool       1227
#> 2 perfect           1111
#> 3 2C too warm       1000
```

A weather forecast that is 2 degrees too cool lifts the load error from 1,111 to 1,227 megawatts, and worse than the size of the miss is its direction: under-calling the heat makes the load model under-forecast demand right before a peak, which is the expensive, lights-out direction. (The 2-degrees-too-warm row looks better here only because the model already under-shoots the record peak, so a warm bias accidentally compensates this one week; do not read it as "warm is safe".) The second caveat is the interval problem from the tournament: the bands are too narrow in extremes. The third is structural change, covered next.

**Try it:** How bad is a really poor weather forecast? Reuse the `score_temp()` helper to see the error when the temperature forecast is 3 degrees too cool.

```r title="Your turn: a worse weather miss"
# call the score_temp() helper with a 3-degree-too-cool shift
score_temp(-2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Bigger weather-miss solution"
score_temp(-3)
#> [1] 1285
```

**Explanation:** A 3-degree-too-cool forecast pushes the error to 1,285 megawatts, up from 1,111 with perfect weather. The load forecast inherits the weather forecast's error, which is why load forecasters watch the meteorology as closely as their own model.

</details>

## What happens after the forecast goes live?

Shipping the model is the start of the job, not the end. A forecast that was sharp in January drifts as the grid changes, so you watch it and refit on a schedule. The core idea is simple: keep scoring the live model against what actually happened, and raise a flag when its error crosses a limit you set in advance. Here is that check, wrapped so we can point it at any week.

```r title="Monitor the live model against a limit"
control_check <- function(train_set, test_set) {
  train_set |>
    model(harmonic = TSLM(Demand ~ fourier(period = 24, K = 6) +
                          fourier(period = 168, K = 3) + cool + heat + cool_lag + workday)) |>
    forecast(new_data = test_set) |>
    accuracy(elec) |>
    transmute(MAPE = round(MAPE, 1),
              status = if_else(MAPE < 8, "in control", "investigate"))
}

# a calm week
control_check(elec |> filter_index("2013-12-01" ~ "2014-02-09"),
              elec |> filter_index("2014-02-10" ~ "2014-02-16"))
#> # A tibble: 1 × 2
#>    MAPE status    
#>   <dbl> <chr>     
#> 1   7.1 in control
```

On a normal February week the model runs at 7.1% error, under our 8% limit, so it is in control. Point the same check at the January heatwave and it behaves exactly as a monitor should.

```r title="Confirm the monitor fires on an extreme"
control_check(elec |> filter_index("2013-11-01" ~ "2014-01-12"),
              elec |> filter_index("2014-01-13" ~ "2014-01-19"))
#> # A tibble: 1 × 2
#>    MAPE status     
#>   <dbl> <chr>      
#> 1  12.5 investigate
```

The heatwave week comes back at 12.5% and flips to "investigate". That is the monitor earning its keep: it catches the exact conditions where the model is weakest, prompting a human to add reserve rather than trust the machine blindly. In production you would run this every day on the newest actuals.

[NOTE]
**Refit on a rolling window, and refit immediately after any known structural change.** For hourly load, re-estimating on the trailing several weeks each week keeps the model current with the season and recent weather sensitivity; a known change such as a large new industrial connection warrants an immediate refit rather than waiting for the schedule.

What breaks a load model first? Three things, roughly in order. New load, such as the electric-vehicle chargers and data centres that did not exist when the model was trained, slowly lifts the whole curve. Rooftop solar is the sharpest structural break: as households generate their own midday power, the daytime demand the grid sees sags and can even invert the classic shape, so a model trained before mass solar adoption will over-forecast midday. And genuine one-off breaks, a new tariff, a major plant closure, shift the level in a way no smooth model absorbs.

Two r-statistics.co chapters carry this forward: [Forecast Monitoring in R](Forecast-Monitoring-in-R.html) builds the full monitoring dashboard this check only hints at, and [Detecting Structural Breaks in R](Structural-Breaks-in-R.html) shows how to spot the solar-driven and tariff-driven shifts before they wreck your accuracy.

**Try it:** A tighter operation might demand a stricter limit. Rerun the calm-week check with an 8% limit lowered to 6% and see whether the model still passes.

```r title="Your turn: tighten the control limit"
elec |> filter_index("2013-12-01" ~ "2014-02-09") |>
  model(harmonic = TSLM(Demand ~ fourier(period = 24, K = 6) +
                        fourier(period = 168, K = 3) + cool + heat + cool_lag + workday)) |>
  forecast(new_data = elec |> filter_index("2014-02-10" ~ "2014-02-16")) |>
  accuracy(elec) |>
  transmute(MAPE = round(MAPE, 1), status = if_else(MAPE < 8, "in control", "investigate"))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Stricter limit solution"
elec |> filter_index("2013-12-01" ~ "2014-02-09") |>
  model(harmonic = TSLM(Demand ~ fourier(period = 24, K = 6) +
                        fourier(period = 168, K = 3) + cool + heat + cool_lag + workday)) |>
  forecast(new_data = elec |> filter_index("2014-02-10" ~ "2014-02-16")) |>
  accuracy(elec) |>
  transmute(MAPE = round(MAPE, 1), status = if_else(MAPE < 6, "in control", "investigate"))
#> # A tibble: 1 × 2
#>    MAPE status     
#>   <dbl> <chr>      
#> 1   7.1 investigate
```

**Explanation:** At a 6% limit the same 7.1% week now reads "investigate". Where you set the limit is a business call: a tighter limit catches drift sooner but raises more false alarms, so pick it from the cost of a missed forecast, not from a textbook.

</details>

## Practice Exercises

These capstone problems put the whole engagement to work. Each runs in the same session as the tutorial, so the objects above are available. Try each before opening the solution.

### Exercise 1: Does temperature still win in winter?

The heatwave crowned the temperature model, but summer is its best case. Rerun the tournament on a **winter** week instead. Train on data up to 13 July 2013 and forecast the week of 14 to 20 July, comparing seasonal naive against the harmonic model. Does temperature still help when there is no heat spike?

```r title="Your turn: a winter tournament"
# Build a winter window (1 May to 20 July 2013), train through 13 July,
# forecast 14-20 July, score seasonal_naive vs harmonic, rank by RMSE.

```

<details>
<summary>Click to reveal solution</summary>

```r title="Winter tournament solution"
w_win   <- elec |> filter_index("2013-05-01" ~ "2013-07-20")
w_train <- w_win |> filter_index(~ "2013-07-13")
w_test  <- w_win |> filter_index("2013-07-14" ~ "2013-07-20")

w_train |>
  model(
    seasonal_naive = SNAIVE(Demand ~ lag("week")),
    harmonic = TSLM(Demand ~ fourier(period = 24, K = 6) +
                    fourier(period = 168, K = 3) + cool + heat + cool_lag + workday)
  ) |>
  forecast(new_data = w_test) |>
  accuracy(w_win) |>
  transmute(.model, RMSE = round(RMSE), MAPE = round(MAPE, 1)) |>
  arrange(RMSE)
#> # A tibble: 2 × 3
#>   .model          RMSE  MAPE
#>   <chr>          <dbl> <dbl>
#> 1 harmonic         229   3.7
#> 2 seasonal_naive   428   8  
```

**Explanation:** Temperature still wins (229 versus 428), but the whole contest plays out at a much lower error, under 4% for the winner, because a calm winter week is far more predictable than a heatwave. The model earns its biggest margins in the extremes, but it is never worse than the naive rule.

</details>

### Exercise 2: Degree-days or a quadratic curve?

We modelled the U-shaped temperature response with piecewise degree-hours. A common alternative is a quadratic: `Temperature + I(Temperature^2)`. Fit both versions of the harmonic model on the training set, forecast the heatwave week, and see which handles the extreme better. Which would you ship?

```r title="Your turn: two ways to bend the temperature curve"
# Fit degree_days = ...cool + heat + cool_lag... and
# quadratic = ...Temperature + I(Temperature^2)..., forecast test, rank by RMSE.

```

<details>
<summary>Click to reveal solution</summary>

```r title="Degree-days versus quadratic solution"
train |>
  model(
    degree_days = TSLM(Demand ~ fourier(period = 24, K = 6) +
                       fourier(period = 168, K = 3) + cool + heat + cool_lag + workday),
    quadratic   = TSLM(Demand ~ fourier(period = 24, K = 6) +
                       fourier(period = 168, K = 3) + Temperature + I(Temperature^2) + workday)
  ) |>
  forecast(new_data = test) |>
  accuracy(win) |>
  transmute(.model, RMSE = round(RMSE), MAPE = round(MAPE, 1)) |>
  arrange(RMSE)
#> # A tibble: 2 × 3
#>   .model       RMSE  MAPE
#>   <chr>       <dbl> <dbl>
#> 1 quadratic     942  12.7
#> 2 degree_days  1111  12.5
```

**Explanation:** The two are close, and the quadratic actually edges out on RMSE here (942 versus 1,111), because its upward curvature extrapolates the record peak a little more aggressively. The degree-hours version is fractionally better on MAPE and, crucially, far more interpretable ("80 megawatts per cooling degree" versus two abstract quadratic coefficients). This is a real trade-off: pick the quadratic if you only care about the number, the degree-hours if a stakeholder must understand it.

</details>

### Exercise 3: Turn the forecast into a reserve level

Operations does not want a distribution, it wants a single number to plan the peak around. From the harmonic forecast of the heatwave week, find the hour with the highest 95% upper bound and report the expected load, the level to plan for, and the reserve margin between them.

```r title="Your turn: size the peak reserve"
# From fits |> select(harmonic) |> forecast(new_data = test) |> hilo(level = 95),
# pick the hour with the largest 95% upper bound and report the reserve.

```

<details>
<summary>Click to reveal solution</summary>

```r title="Peak reserve solution"
fits |>
  select(harmonic) |>
  forecast(new_data = test) |>
  hilo(level = 95) |>
  as_tibble() |>
  slice_max(`95%`$upper, n = 1) |>
  transmute(peak_hour = Hour,
            expected_MW = round(.mean),
            plan_for_MW = round(`95%`$upper),
            reserve_MW = round(`95%`$upper - .mean))
#> # A tibble: 1 × 4
#>   peak_hour           expected_MW plan_for_MW reserve_MW
#>   <dttm>                    <dbl>       <dbl>      <dbl>
#> 1 2014-01-17 16:00:00        7414        8159        745
```

**Explanation:** The model expects a 7,414 megawatt peak near 4pm on 17 January and, at the 95% level, says to plan for 8,159, a reserve of 745 megawatts. Remember the tournament's warning: because the intervals under-cover in extremes, on a forecast heatwave you would treat even this as a floor and add more by hand.

</details>

## Complete Example

Here is the entire engagement compressed into one runnable script: load the real demand history, roll it to hourly, build the features, fit the three headline strategies, forecast the heatwave week, and rank them. This is the skeleton you would adapt for any new load series.

```r title="The whole engagement end to end"
library(fable); library(feasts); library(tsibble); library(tsibbledata)
library(dplyr); library(lubridate)

# 1. Load and aggregate to hourly, with weather and calendar features
elec <- vic_elec |>
  index_by(Hour = floor_date(Time, "hour")) |>
  summarise(Demand = mean(Demand), Temperature = mean(Temperature),
            Holiday = any(Holiday)) |>
  ungroup() |>
  mutate(workday = !(as.integer(wday(Hour, week_start = 1)) >= 6 | Holiday),
         cool = pmax(Temperature - 18, 0), heat = pmax(18 - Temperature, 0),
         cool_lag = lag(cool, 24))

# 2. Split off the heatwave test week
ce_win <- elec |> filter_index("2013-11-01" ~ "2014-01-19")
ce_tr  <- ce_win |> filter_index(~ "2014-01-12")
ce_te  <- ce_win |> filter_index("2014-01-13" ~ "2014-01-19")

# 3. Fit benchmark, harmonic regression, and dynamic harmonic regression
# 4. Forecast the hold-out and rank
ce_tr |>
  model(
    seasonal_naive = SNAIVE(Demand ~ lag("week")),
    harmonic = TSLM(Demand ~ fourier(period = 24, K = 6) +
                    fourier(period = 168, K = 3) + cool + heat + cool_lag + workday),
    dynamic_hr = ARIMA(Demand ~ fourier(period = 24, K = 6) +
                       fourier(period = 168, K = 3) + cool + heat + cool_lag + workday +
                       pdq(2, 0, 1) + PDQ(0, 0, 0))
  ) |>
  forecast(new_data = ce_te) |>
  accuracy(ce_win) |>
  select(.model, RMSE, MAPE, MASE) |>
  mutate(RMSE = round(RMSE), MAPE = round(MAPE, 1), MASE = round(MASE, 2)) |>
  arrange(RMSE)
#> # A tibble: 3 × 4
#>   .model          RMSE  MAPE  MASE
#>   <chr>          <dbl> <dbl> <dbl>
#> 1 harmonic        1111  12.5  2.25
#> 2 dynamic_hr      1646  17.8  3.28
#> 3 seasonal_naive  2094  22.8  4.18
```

From four numbered steps you have a ranked, weather-aware set of day-ahead forecasts. Swapping in a different region, a longer horizon, or an extra model is a one-line change to this skeleton, which is the real payoff of doing energy load forecasting the tidyverts way.

## Frequently asked questions

**How much history do you need to forecast electricity load?**
For an hourly series with daily and weekly cycles, a few months captures the seasonal shapes, but you want at least a full year so the model sees both summer cooling and winter heating. This case study trained on a rolling six-week window for day-ahead forecasts, which keeps the model current with the season, and used two to three years for the exploratory analysis. Too little history and the temperature response is estimated from too few hot days.

**Which model is best for energy load forecasting?**
There is no single winner. On this data the temperature-aware harmonic regression won overall, but the dynamic harmonic model was better on calm days and seasonal naive was competitive on quiet weekends. That is why the workflow runs a tournament and splits it by conditions rather than crowning one model. Fit several, backtest across many days, and let the numbers pick per situation.

**Why aggregate to hourly instead of forecasting the raw half-hourly data?**
Day-ahead scheduling and procurement clear in hourly blocks, so hourly is the decision-relevant resolution, and it halves the data with no loss of the daily and weekly patterns that matter. If your decision genuinely needs half-hourly granularity, keep it and raise the Fourier orders to `period = 48` and `period = 336`; the workflow is otherwise identical.

**Should I use degree-days or a quadratic for temperature?**
Both bend the load curve into its U shape and perform similarly, as Exercise 2 shows. Degree-hours (cooling and heating split at a comfort temperature) are more interpretable, because each coefficient is a clean megawatts-per-degree effect a stakeholder can act on. A quadratic can extrapolate extreme heat slightly more aggressively. Pick degree-hours when the model must be explained, the quadratic when only accuracy matters.

**How much does the weather forecast affect the load forecast?**
A lot, and it is the biggest risk in production. Feeding the model a temperature forecast that was 2 degrees too cool raised the load error from about 1,111 to 1,227 megawatts and, worse, biased the load estimate downward right before a peak. The load forecast can only be as good as the weather forecast it consumes, so a load-forecasting team watches the meteorology as closely as its own model.

**What do MAPE and MASE mean for a load forecast?**
MAPE is the average error as a percent of actual demand, so 7.6% means the forecast is off by about 7.6% on a typical hour, which is easy to explain to a stakeholder. MASE scales the error against the seasonal naive benchmark, so a MASE above 1 means a model did worse than "same time last week" on the metric's in-sample baseline. Report MAPE and megawatt RMSE to the business, and use MASE as a unit-free way to compare across series.

## Summary

An end-to-end energy load forecast is a sequence of decisions, not a single model call. The table maps each phase of the engagement to what it produces.

| Phase | What you do | What it produces |
|---|---|---|
| Business brief | Name the decision and the asymmetric cost | A target: the day-ahead forecast |
| Data audit | Check coverage, gaps, DST, scale | A trustworthy hourly tsibble |
| EDA | Measure seasons, calendar, temperature | The features the model needs |
| Feature build | Degree-hours, lag, workday, Fourier | Columns that encode the physics |
| Portfolio | Fit five different strategies | Candidate models to compare |
| Tournament | Rolling backtest by condition + intervals | A defensible, situational model choice |
| Executive summary | Translate to megawatts and a rule | A forecast the desk can act on |
| Production | Monitor, refit, watch for solar | A forecast that stays honest |

![A mindmap summarising the whole engagement: audit, explore, model, judge, ship](screenshots/Energy-Load-Forecasting-in-R-overview-mindmap.webp)

*Figure 10: The whole engagement at a glance.*

The one idea to carry away: the model is the easy part. The value is in framing the asymmetric cost, auditing sub-daily data for its own traps, encoding the U-shaped temperature response as features, backtesting honestly across hot and mild days, checking that the interval is trustworthy and not just the point, and being frank that the whole thing rides on a weather forecast. Do those well and a transparent harmonic regression becomes a forecast a grid can schedule against.

## References

1. Hyndman, R.J., & Athanasopoulos, G. - *Forecasting: Principles and Practice*, 3rd ed. Section 12.1: Complex seasonality. [Link](https://otexts.com/fpp3/complexseasonality.html)
2. Hyndman, R.J., & Athanasopoulos, G. - *Forecasting: Principles and Practice*, 3rd ed. Chapter 10: Dynamic regression models. [Link](https://otexts.com/fpp3/dynamic.html)
3. Hyndman, R.J., & Athanasopoulos, G. - *Forecasting: Principles and Practice*, 3rd ed. Section 5.10: Time series cross-validation. [Link](https://otexts.com/fpp3/tscv.html)
4. fable documentation - Forecasting models for tidy time series. [Link](https://fable.tidyverts.org/)
5. feasts documentation - Feature extraction and statistics for time series. [Link](https://feasts.tidyverts.org/)
6. tsibbledata documentation - vic_elec: Half-hourly electricity demand for Victoria, Australia. [Link](https://tsibbledata.tidyverts.org/reference/vic_elec.html)
7. Australian Energy Market Commission - how the National Electricity Market works, including the spot-market price cap that makes an under-forecast so costly. [Link](https://www.aemc.gov.au/energy-system/electricity/electricity-market)

**Continue learning on this site:**

- [Dynamic Regression in R](Dynamic-Regression-in-R.html) - a deeper look at ARIMA models with external covariates, the engine behind the dynamic harmonic model.
- [Time Series Cross-Validation in R](Time-Series-Cross-Validation-in-R.html) - the rolling-origin backtesting that decided this tournament, in full.
- [Forecast Monitoring in R](Forecast-Monitoring-in-R.html) - build the production dashboard that watches a deployed load forecast for drift.
