---
title: "Time Series Decomposition Lesson 6: Feature extraction with feasts"
catalog_blurb: "Turn twenty time series into numbers you can compare and act on."
description: "Learn how features() turns twenty retail series into one row each, using STL strength, autocorrelation and spectral entropy, so you can compare and route them."
keywords: "time series features, feasts feature_set, feat_stl trend strength, seasonal strength year, ACF features R, spectral entropy time series, feature-based forecasting, tsibbledata aus_retail, routing time series to models"
post_type: "LESSON"
curriculum_id: "5.20.6"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ts-decomposition"
course_title: "Time Series Decomposition"
course_lesson: "6"
course_total: "6"
course_landing: "Time-Series-Decomposition-Course.html"
course_next: ""
course_prev: "Calendar-and-Population-Adjustments.html"
---

=== step === cover
## Feature extraction with feasts

Today let's understand how to boil a whole time series down into a handful of numbers, called features, so you can compare many series at once instead of eyeballing them one by one.

Victoria's retail sector reports monthly turnover, in millions of Australian dollars, for 20 different industries: department stores, liquor retailing, pharmaceutical and cosmetic retailing, takeaway food services, and 16 others besides. The Australian Bureau of Statistics has tracked every one of them since April 1982, 441 months per industry, right through to December 2018.

Below, each dot is one of those 20 industries, placed using two numbers computed from nothing but that industry's own 441 months of turnover.

::widget chart-plotter {"data":[{"x":0.997,"y":0.723,"fill":"Cafes, restaurants and catering services"},{"x":0.998,"y":0.821,"fill":"Cafes, restaurants and takeaway food services"},{"x":0.994,"y":0.956,"fill":"Clothing retailing"},{"x":0.996,"y":0.971,"fill":"Clothing, footwear and personal accessory retailing"},{"x":0.988,"y":0.986,"fill":"Department stores"},{"x":0.994,"y":0.960,"fill":"Electrical and electronic goods retailing"},{"x":0.999,"y":0.959,"fill":"Food retailing"},{"x":0.993,"y":0.953,"fill":"Footwear and other personal accessory retailing"},{"x":0.993,"y":0.820,"fill":"Furniture, floor coverings, houseware and textile goods retailing"},{"x":0.996,"y":0.935,"fill":"Hardware, building and garden supplies retailing"},{"x":0.997,"y":0.965,"fill":"Household goods retailing"},{"x":0.997,"y":0.973,"fill":"Liquor retailing"},{"x":0.938,"y":0.876,"fill":"Newspaper and book retailing"},{"x":0.986,"y":0.962,"fill":"Other recreational goods retailing"},{"x":0.998,"y":0.970,"fill":"Other retailing"},{"x":0.995,"y":0.936,"fill":"Other retailing n.e.c."},{"x":0.992,"y":0.814,"fill":"Other specialised food retailing"},{"x":0.997,"y":0.896,"fill":"Pharmaceutical, cosmetic and toiletry goods retailing"},{"x":0.999,"y":0.938,"fill":"Supermarket and grocery stores"},{"x":0.996,"y":0.764,"fill":"Takeaway food services"}],"geoms":["point"],"x":"trend_strength","y":"seasonal_strength_year","code":{"point":"ggplot(df, aes(x, y, colour = group)) +\n  geom_point(size = 2.6)"}}

That is what a feature does: it turns a series with hundreds of numbers into one number you can place directly against every other industry's. Each axis above is one such feature, computed once, the same way, for all 20 industries at once.

=== step === concept
## Twenty industries, one series each, too many to compare by eye

Look at four of Victoria's twenty retail industries side by side: liquor retailing, department stores, pharmaceutical and cosmetic retailing, and newspaper and book retailing.

```r
# Plot four Victoria retail industries side by side, each on its own scale
library(tsibble)
library(tsibbledata)
library(dplyr)
library(ggplot2)

vic <- tsibbledata::aus_retail |>
  filter(State == "Victoria")

four <- vic |>
  filter(Industry %in% c(
    "Liquor retailing",
    "Department stores",
    "Pharmaceutical, cosmetic and toiletry goods retailing",
    "Newspaper and book retailing"
  ))

ggplot(four, aes(x = Month, y = Turnover)) +
  geom_line() +
  facet_wrap(vars(Industry), scales = "free_y", ncol = 1)
```

Each panel has its own scale, so look at the shape, not the height. Liquor retailing and department stores both climb with a sharp spike every December. Pharmaceutical and cosmetic retailing climbs too, but more smoothly, without as sharp a spike. Newspaper and book retailing looks the least tidy of the four: its climb wanders rather than holding one clean line.

Four industries already took four separate panels to compare. Victoria has 20. Eyeballing 20 panels, or worse, 20 separate plots, does not scale, and it hands you no actual number you could give to a colleague or feed into another script. What you need instead is one function that looks at every series and hands back a row of numbers per industry.

=== step === concept
## What a feature is: one function call, one number per series

A **feature**, in this sense, is a single number computed from a whole series, standing in for something about its shape. `fabletools::features()` is the function that computes one for every series in a tsibble at once: give it the data, the column to measure, and a function that turns one series into a row of numbers, and it runs that function once per industry and stacks every row into a table.

`feat_stl()`, from the feasts package, is one such function. It fits an STL decomposition to a series and returns several numbers describing that decomposition. Run it across all 20 industries in a single call.

```r
# One feature function, one row of STL-based statistics per industry
library(feasts)
library(fabletools)
options(width = 150)

vic_stl_feat <- features(vic, Turnover, feat_stl)

vic_stl_feat |> select(Industry, trend_strength, seasonal_strength_year) |> print(n = 20)
#> # A tibble: 20 × 3
#>    Industry                                                          trend_strength seasonal_strength_year
#>    <chr>                                                                      <dbl>                  <dbl>
#>  1 Cafes, restaurants and catering services                                   0.997                  0.723
#>  2 Cafes, restaurants and takeaway food services                              0.998                  0.821
#>  3 Clothing retailing                                                         0.994                  0.956
#>  4 Clothing, footwear and personal accessory retailing                        0.996                  0.971
#>  5 Department stores                                                          0.988                  0.986
#>  6 Electrical and electronic goods retailing                                  0.994                  0.960
#>  7 Food retailing                                                             0.999                  0.959
#>  8 Footwear and other personal accessory retailing                            0.993                  0.953
#>  9 Furniture, floor coverings, houseware and textile goods retailing          0.993                  0.820
#> 10 Hardware, building and garden supplies retailing                           0.996                  0.935
#> 11 Household goods retailing                                                  0.997                  0.965
#> 12 Liquor retailing                                                           0.997                  0.973
#> 13 Newspaper and book retailing                                               0.938                  0.876
#> 14 Other recreational goods retailing                                         0.986                  0.962
#> 15 Other retailing                                                            0.998                  0.970
#> 16 Other retailing n.e.c.                                                     0.995                  0.936
#> 17 Other specialised food retailing                                           0.992                  0.814
#> 18 Pharmaceutical, cosmetic and toiletry goods retailing                      0.997                  0.896
#> 19 Supermarket and grocery stores                                             0.999                  0.938
#> 20 Takeaway food services                                                     0.996                  0.764
```

Twenty industries went in. Twenty rows came out, one per industry, each with its own trend_strength and seasonal_strength_year. Nothing here was computed by hand, and nothing here needed you to look at a single plot.

=== step === concept
## Strength of trend and seasonality, computed by STL

Both of those columns come from the same idea. An STL decomposition splits a series into three parts that add back up to the original: a trend component T, the slow-moving direction the series is heading; a season component S, the repeating shape within each year; and a remainder R, whatever is left over once T and S are subtracted out.

trend_strength and seasonal_strength_year are both variance ratios built from those three parts.

\[ \text{trend\_strength} = \max\left(0,\ 1 - \frac{\text{Var}(R)}{\text{Var}(T + R)}\right) \]

\[ \text{seasonal\_strength\_year} = \max\left(0,\ 1 - \frac{\text{Var}(R)}{\text{Var}(S + R)}\right) \]

Read trend_strength as a question: if you took the trend back out of the series, how much of what is left would still be genuine movement rather than noise? Var(R) is the noise, and Var(T + R) is the trend plus that same noise. When the remainder is tiny next to the trend, that ratio is tiny, 1 minus a tiny number sits close to 1, and trend_strength lands near 1. seasonal_strength_year asks the identical question with the season component swapped in for the trend.

Both ratios are bounded between 0 and 1. The `max(0, ...)` only exists to catch the rare case where the remainder is actually bigger than the signal, which would otherwise push the ratio negative.

Sort the 20-industry table by each score and you get the most and least trend-dominated, and the most and least seasonal, industries.

```r
# Which industry is most trend-dominated, and which is most and least seasonal
top_trend <- vic_stl_feat |> slice_max(trend_strength, n = 1)
bottom_trend <- vic_stl_feat |> slice_min(trend_strength, n = 1)
top_season <- vic_stl_feat |> slice_max(seasonal_strength_year, n = 1)
bottom_season <- vic_stl_feat |> slice_min(seasonal_strength_year, n = 1)

cat("Highest trend_strength:", top_trend$Industry, "-", round(top_trend$trend_strength, 3), "\n")
cat("Lowest trend_strength:", bottom_trend$Industry, "-", round(bottom_trend$trend_strength, 3), "\n")
cat("Highest seasonal_strength_year:", top_season$Industry, "-", round(top_season$seasonal_strength_year, 3), "\n")
cat("Lowest seasonal_strength_year:", bottom_season$Industry, "-", round(bottom_season$seasonal_strength_year, 3), "\n")
#> Highest trend_strength: Food retailing - 0.999 
#> Lowest trend_strength: Newspaper and book retailing - 0.938 
#> Highest seasonal_strength_year: Department stores - 0.986 
#> Lowest seasonal_strength_year: Cafes, restaurants and catering services - 0.723 
```

Food retailing scores 0.999 on trend_strength, as close to a pure trend as this table gets. Newspaper and book retailing scores lowest at 0.938, which still sounds high on its own, but next to the rest of the table it is the one industry where the remainder carries relatively more weight. Department stores tops seasonal_strength_year at 0.986, the most Christmas-driven of the twenty. Cafes, restaurants and catering services sits lowest at 0.723, the steadiest across the calendar year of the group.

=== step === widget
## Plotting twenty industries in feature space

Put trend_strength and seasonal_strength_year on the same chart, one point per industry, and you get a map of all 20 industries at once. Statisticians call a chart like this **feature space**: every axis is a feature, and every point is one series.

::widget chart-plotter {"data":[{"x":0.997,"y":0.723,"fill":"Cafes, restaurants and catering services"},{"x":0.998,"y":0.821,"fill":"Cafes, restaurants and takeaway food services"},{"x":0.994,"y":0.956,"fill":"Clothing retailing"},{"x":0.996,"y":0.971,"fill":"Clothing, footwear and personal accessory retailing"},{"x":0.988,"y":0.986,"fill":"Department stores"},{"x":0.994,"y":0.960,"fill":"Electrical and electronic goods retailing"},{"x":0.999,"y":0.959,"fill":"Food retailing"},{"x":0.993,"y":0.953,"fill":"Footwear and other personal accessory retailing"},{"x":0.993,"y":0.820,"fill":"Furniture, floor coverings, houseware and textile goods retailing"},{"x":0.996,"y":0.935,"fill":"Hardware, building and garden supplies retailing"},{"x":0.997,"y":0.965,"fill":"Household goods retailing"},{"x":0.997,"y":0.973,"fill":"Liquor retailing"},{"x":0.938,"y":0.876,"fill":"Newspaper and book retailing"},{"x":0.986,"y":0.962,"fill":"Other recreational goods retailing"},{"x":0.998,"y":0.970,"fill":"Other retailing"},{"x":0.995,"y":0.936,"fill":"Other retailing n.e.c."},{"x":0.992,"y":0.814,"fill":"Other specialised food retailing"},{"x":0.997,"y":0.896,"fill":"Pharmaceutical, cosmetic and toiletry goods retailing"},{"x":0.999,"y":0.938,"fill":"Supermarket and grocery stores"},{"x":0.996,"y":0.764,"fill":"Takeaway food services"}],"geoms":["point"],"x":"trend_strength","y":"seasonal_strength_year","code":{"point":"ggplot(df, aes(x, y, colour = group)) +\n  geom_point(size = 2.6)"}}

Most of the 20 points sit bunched in the top right: trend_strength above 0.98, seasonal_strength_year above 0.9. That is most of Victoria retail, strongly trending and strongly seasonal at once. Look for the one point sitting apart from that cluster, further left and lower than the rest. That is Newspaper and book retailing, the industry you already met at both ends of the sorted table in the last step.

=== step === quiz
## Quick check: reading the feature-space scatter

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- trend_strength and seasonal_strength_year come from two separate variance ratios, so a series can score high on both at once. Department stores does exactly that: 0.988 on trend_strength and 0.986 on seasonal_strength_year. ::ok Right. The two ratios split the series two different ways, once against the trend and once against the season, so nothing stops a series from scoring high on both.
- A high seasonal_strength_year forces a low trend_strength, since a series cannot be strongly seasonal and strongly trending at the same time. ::no Not so. Department stores scores 0.986 on seasonal_strength_year and 0.988 on trend_strength, both near the top of the table. The two ratios are computed from separate variance splits, so one does not push the other down.
- The industry sitting apart from the rest in the scatter, Newspaper and book retailing, has the lowest seasonal_strength_year of the twenty. ::no Not quite. Its seasonal_strength_year is 0.876, well inside the pack. What sits lowest for Newspaper and book retailing is trend_strength, 0.938, and that is what pulls it away from the cluster on the chart.
- Since both axes run from 0 to 1, every industry in the scatter is roughly equally strong in trend and season. ::no The axes share a scale, but the points do not cluster evenly across it. Most industries bunch above 0.98 on trend_strength and above 0.9 on seasonal_strength_year, and one, Newspaper and book retailing, sits well below both.

=== step === concept
## ACF features: how a series correlates with its own past values

trend_strength and seasonal_strength_year both come from splitting a series apart with STL. `feat_acf()`, a different feature function from the same feasts package, measures something else directly from the raw series, without decomposing anything first.

**Autocorrelation** answers a simple question: shift a copy of a series back by some number of months, called the lag, and compute the ordinary correlation between the original series and that shifted copy. That correlation, for one specific lag, is one autocorrelation coefficient.

acf1 is the autocorrelation at lag 1: how closely a month tracks the month right before it. season_acf1 is the autocorrelation at lag 12: how closely a month tracks the same month a year earlier. Because season_acf1 comes straight from the raw series rather than from an STL split, it can disagree with seasonal_strength_year when a series is seasonal but irregular about it.

```r
# One row of ACF-based features per industry, sorted by the yearly-lag correlation
vic_acf_feat <- features(vic, Turnover, feat_acf)

vic_acf_feat |> select(Industry, acf1, season_acf1) |> arrange(desc(season_acf1)) |> print(n = 20)
#> # A tibble: 20 × 3
#>    Industry                                                           acf1 season_acf1
#>    <chr>                                                             <dbl>       <dbl>
#>  1 Department stores                                                 0.575       0.939
#>  2 Other recreational goods retailing                                0.769       0.939
#>  3 Footwear and other personal accessory retailing                   0.867       0.929
#>  4 Food retailing                                                    0.976       0.918
#>  5 Clothing, footwear and personal accessory retailing               0.868       0.918
#>  6 Supermarket and grocery stores                                    0.980       0.918
#>  7 Liquor retailing                                                  0.911       0.917
#>  8 Electrical and electronic goods retailing                         0.883       0.912
#>  9 Household goods retailing                                         0.939       0.911
#> 10 Takeaway food services                                            0.980       0.909
#> 11 Cafes, restaurants and takeaway food services                     0.982       0.909
#> 12 Other retailing                                                   0.925       0.904
#> 13 Furniture, floor coverings, houseware and textile goods retailing 0.964       0.901
#> 14 Clothing retailing                                                0.873       0.901
#> 15 Cafes, restaurants and catering services                          0.981       0.900
#> 16 Other specialised food retailing                                  0.949       0.899
#> 17 Hardware, building and garden supplies retailing                  0.958       0.893
#> 18 Pharmaceutical, cosmetic and toiletry goods retailing             0.964       0.888
#> 19 Other retailing n.e.c.                                            0.931       0.886
#> 20 Newspaper and book retailing                                      0.709       0.769
```

Department stores and Other recreational goods retailing tie for the highest season_acf1, 0.939: whatever a month looked like last year, this year's same month tracks it closely. Newspaper and book retailing sits lowest again, at 0.769, the same industry that has now stood apart in every step since the facet plot.

Notice Department stores again. It has the lowest acf1 of the twenty, 0.575, so one month barely predicts the next. Yet its season_acf1, 0.939, is near the top. A series can be a poor month-to-month predictor of itself and still repeat its yearly shape closely; acf1 and season_acf1 are measuring two different kinds of memory.

=== step === concept
## Spectral entropy: how predictable a series looks

`feat_spectral()` looks at a series from a third angle again. Any series, however irregular it looks, can be rebuilt out of a set of repeating waves, each completing one cycle at its own frequency: some finish a cycle every few months, others take years. How much of the series' total variation each frequency accounts for is called that frequency's power, and the full collection of powers across every frequency is the series' spectrum.

spectral_entropy measures how spread out that spectrum is, scaled to sit between 0 and 1. A value near 0 means almost all the power sits at one or two frequencies, a strong and regular repeating pattern, easier to predict. A value near 1 means the power spreads out almost evenly across every frequency, closer to random noise, and harder to predict.

```r
# One row of spectral-entropy features per industry, sorted from least to most predictable-looking
vic_spec_feat <- features(vic, Turnover, feat_spectral)

vic_spec_feat |> select(Industry, spectral_entropy) |> arrange(desc(spectral_entropy)) |> print(n = 20)
#> # A tibble: 20 × 2
#>    Industry                                                          spectral_entropy
#>    <chr>                                                                        <dbl>
#>  1 Newspaper and book retailing                                                 0.619
#>  2 Other recreational goods retailing                                           0.247
#>  3 Furniture, floor coverings, houseware and textile goods retailing            0.236
#>  4 Clothing, footwear and personal accessory retailing                          0.217
#>  5 Department stores                                                            0.210
#>  6 Other retailing n.e.c.                                                       0.207
#>  7 Clothing retailing                                                           0.205
#>  8 Pharmaceutical, cosmetic and toiletry goods retailing                        0.203
#>  9 Other retailing                                                              0.168
#> 10 Liquor retailing                                                             0.159
#> 11 Footwear and other personal accessory retailing                              0.156
#> 12 Food retailing                                                               0.155
#> 13 Supermarket and grocery stores                                               0.144
#> 14 Other specialised food retailing                                             0.130
#> 15 Takeaway food services                                                       0.123
#> 16 Hardware, building and garden supplies retailing                             0.113
#> 17 Cafes, restaurants and catering services                                     0.107
#> 18 Cafes, restaurants and takeaway food services                                0.107
#> 19 Household goods retailing                                                    0.106
#> 20 Electrical and electronic goods retailing                                    0.106
```

One industry sits far above the rest: Newspaper and book retailing, at 0.619. The next highest, Other recreational goods retailing, is only 0.247, less than half of that. Every other industry sits under 0.25. By this measure Newspaper and book retailing is not just a little harder to predict than the rest of Victoria retail, it is in a league of its own.

=== step === widget
## How the four features relate to each other

Four feature functions, run so far, have handed back four different columns: trend_strength, seasonal_strength_year, acf1 and spectral_entropy. Join their three tables into one, one row per industry, and check how the four columns actually relate to each other.

```r
# Join the three feature tables into one row per industry, then check how the four columns correlate
vic_features <- vic_stl_feat |>
  left_join(vic_acf_feat, by = "Industry") |>
  left_join(vic_spec_feat, by = "Industry") |>
  as_tibble() |>
  select(Industry, trend_strength, seasonal_strength_year, acf1, spectral_entropy)

print(vic_features, n = 20)
#> # A tibble: 20 × 5
#>    Industry                                                          trend_strength seasonal_strength_year  acf1 spectral_entropy
#>    <chr>                                                                      <dbl>                  <dbl> <dbl>            <dbl>
#>  1 Cafes, restaurants and catering services                                   0.997                  0.723 0.981            0.107
#>  2 Cafes, restaurants and takeaway food services                              0.998                  0.821 0.982            0.107
#>  3 Clothing retailing                                                         0.994                  0.956 0.873            0.205
#>  4 Clothing, footwear and personal accessory retailing                        0.996                  0.971 0.868            0.217
#>  5 Department stores                                                          0.988                  0.986 0.575            0.210
#>  6 Electrical and electronic goods retailing                                  0.994                  0.960 0.883            0.106
#>  7 Food retailing                                                             0.999                  0.959 0.976            0.155
#>  8 Footwear and other personal accessory retailing                            0.993                  0.953 0.867            0.156
#>  9 Furniture, floor coverings, houseware and textile goods retailing          0.993                  0.820 0.964            0.236
#> 10 Hardware, building and garden supplies retailing                           0.996                  0.935 0.958            0.113
#> 11 Household goods retailing                                                  0.997                  0.965 0.939            0.106
#> 12 Liquor retailing                                                           0.997                  0.973 0.911            0.159
#> 13 Newspaper and book retailing                                               0.938                  0.876 0.709            0.619
#> 14 Other recreational goods retailing                                         0.986                  0.962 0.769            0.247
#> 15 Other retailing                                                            0.998                  0.970 0.925            0.168
#> 16 Other retailing n.e.c.                                                     0.995                  0.936 0.931            0.207
#> 17 Other specialised food retailing                                           0.992                  0.814 0.949            0.130
#> 18 Pharmaceutical, cosmetic and toiletry goods retailing                      0.997                  0.896 0.964            0.203
#> 19 Supermarket and grocery stores                                             0.999                  0.938 0.980            0.144
#> 20 Takeaway food services                                                     0.996                  0.764 0.980            0.123

vic_features |> select(-Industry) |> cor() |> round(2)
#>                        trend_strength seasonal_strength_year  acf1 spectral_entropy
#> trend_strength                   1.00                   0.06  0.59            -0.93
#> seasonal_strength_year           0.06                   1.00 -0.40             0.05
#> acf1                             0.59                  -0.40  1.00            -0.57
#> spectral_entropy                -0.93                   0.05 -0.57             1.00
```

::widget correlation-heatmap {"vars":["trend_strength","seasonal_strength_year","acf1","spectral_entropy"],"matrix":[[1,0.06,0.59,-0.93],[0.06,1,-0.4,0.05],[0.59,-0.4,1,-0.57],[-0.93,0.05,-0.57,1]]}

seasonal_strength_year is close to independent of the other three: 0.06 against trend_strength, 0.05 against spectral_entropy, and only -0.40 against acf1. A series' seasonal_strength_year genuinely tells you something the other three columns do not.

trend_strength and spectral_entropy, though, move together tightly here: -0.93 across these 20 industries. Whenever the remainder carries relatively little weight against the trend, that same remainder also tends to leave the spectrum concentrated at a few frequencies rather than spread out, so a strong trend and a predictable spectrum tend to arrive together on this table. That is not obvious from either formula on its own. You only see it by actually computing both, across real series, and comparing.

=== step === widget
## Routing each industry to a model family by its features

Put these numbers to work. A simple rule can route each industry toward a different kind of model, using nothing but two of the columns just computed.

seasonal_strength_year splits the 20 industries almost exactly in half at 0.94: ten industries score above it, ten below. Above that line, a series is seasonal enough that a model needs an explicit seasonal term to fit it well. spectral_entropy splits off just one industry at 0.3: only Newspaper and book retailing clears it, at 0.619, more than double the next highest score on that column. A series that far into unpredictable territory is worth flagging for extra scrutiny before you trust any model's forecast from it. Everything else gets a plainer trend model.

```r
# Route each industry using two thresholds: how seasonal it is, and how unpredictable its spectrum looks
vic_routes <- vic_features |>
  mutate(route = case_when(
    seasonal_strength_year > 0.94 ~ "seasonal model",
    spectral_entropy > 0.3 ~ "flag for review",
    TRUE ~ "plain trend model"
  ))

vic_routes |> count(route)
#> # A tibble: 3 × 2
#>   route                 n
#>   <chr>             <int>
#> 1 flag for review       1
#> 2 plain trend model     9
#> 3 seasonal model       10
```

::widget chart-plotter {"data":[{"x":0.107,"y":0.723,"fill":"plain trend model"},{"x":0.107,"y":0.821,"fill":"plain trend model"},{"x":0.205,"y":0.956,"fill":"seasonal model"},{"x":0.217,"y":0.971,"fill":"seasonal model"},{"x":0.210,"y":0.986,"fill":"seasonal model"},{"x":0.106,"y":0.960,"fill":"seasonal model"},{"x":0.155,"y":0.959,"fill":"seasonal model"},{"x":0.156,"y":0.953,"fill":"seasonal model"},{"x":0.236,"y":0.820,"fill":"plain trend model"},{"x":0.113,"y":0.935,"fill":"plain trend model"},{"x":0.106,"y":0.965,"fill":"seasonal model"},{"x":0.159,"y":0.973,"fill":"seasonal model"},{"x":0.619,"y":0.876,"fill":"flag for review"},{"x":0.247,"y":0.962,"fill":"seasonal model"},{"x":0.168,"y":0.970,"fill":"seasonal model"},{"x":0.207,"y":0.936,"fill":"plain trend model"},{"x":0.130,"y":0.814,"fill":"plain trend model"},{"x":0.203,"y":0.896,"fill":"plain trend model"},{"x":0.144,"y":0.938,"fill":"plain trend model"},{"x":0.123,"y":0.764,"fill":"plain trend model"}],"geoms":["point"],"x":"spectral_entropy","y":"seasonal_strength_year","code":{"point":"ggplot(df, aes(x, y, colour = group)) +\n  geom_point(size = 2.6)"}}

Ten industries cleared the seasonal_strength_year bar and route to a seasonal model. Nine sit below that bar and route to a plainer trend model instead. One, off toward the right of the chart where spectral_entropy is highest, routes to a flag for review: the same Newspaper and book retailing you have now seen stand apart in every step since the facet plot.

=== step === quiz
## Closing quiz

Supermarket and grocery stores scores trend_strength = 0.999, seasonal_strength_year = 0.938, acf1 = 0.980 and spectral_entropy = 0.144. Under the rule from the last step, which model family does it route to?

::quiz {"correct": 2, "gate": true, "difficulty": "advanced"}
- Seasonal model, because acf1 = 0.980 is nearly as high as an autocorrelation gets, so the series is clearly strongly seasonal. ::no acf1 measures month-to-month memory, not yearly seasonality, and it plays no part in the routing rule. Back when ACF features came up, Department stores had the lowest acf1 of the twenty, 0.575, and still tied for the highest season_acf1, so a high acf1 does not by itself mean strong seasonality.
- Plain trend model. seasonal_strength_year, 0.938, sits just under the 0.94 cutoff, and spectral_entropy, 0.144, is nowhere near 0.3. ::ok Right. Neither threshold is cleared, so the rule falls through to the plain trend model, the same way it did for nine of the twenty industries.
- Flag for review, since spectral_entropy, 0.144, is still a positive number, and the rule flags any series with a nonzero spectral_entropy. ::no Not so. The rule's flag-for-review bar sits at 0.3, not at zero. Supermarket and grocery stores' spectral_entropy, 0.144, sits comfortably below that bar, the same range as every industry except Newspaper and book retailing, the one series whose spectral_entropy actually cleared it.
- Seasonal model, because trend_strength, 0.999, is nearly the maximum possible score. ::no trend_strength never enters the routing rule at all. The rule only checks seasonal_strength_year and spectral_entropy, and this industry's seasonal_strength_year, 0.938, falls just short of the 0.94 cutoff.

=== step === tryit
## Your turn: route three held-out industries yourself

Three of the 20 real industries, held back from the table above with their route removed, are Cafes, restaurants and catering services, Liquor retailing and Newspaper and book retailing.

```r
# Three industries held out from vic_routes, with the route column removed
vic_quiz3 <- vic_routes |>
  filter(Industry %in% c(
    "Cafes, restaurants and catering services",
    "Liquor retailing",
    "Newspaper and book retailing"
  )) |>
  select(Industry, seasonal_strength_year, spectral_entropy)

vic_quiz3
#> # A tibble: 3 × 3
#>   Industry                                 seasonal_strength_year spectral_entropy
#>   <chr>                                                     <dbl>            <dbl>
#> 1 Cafes, restaurants and catering services                  0.723            0.107
#> 2 Liquor retailing                                          0.973            0.159
#> 3 Newspaper and book retailing                              0.876            0.619
```

Now write the rule yourself and check each industry against its real route.

```r
# vic_quiz3 holds seasonal_strength_year and spectral_entropy for three
# industries held out from step 10's table.
# Add a route column using the same rule from that step:
# seasonal_strength_year above 0.94 routes to "seasonal model",
# spectral_entropy above 0.3 routes to "flag for review",
# anything else routes to "plain trend model".
# Four lines. Press Check when you have them.
```
::check {"regex": "seasonal_strength_year\\s*>\\s*0\\.94[\\s\\S]*spectral_entropy\\s*>\\s*0\\.3", "gate": true, "difficulty": "intermediate", "ok": "Right. Liquor retailing clears 0.94 on seasonal_strength_year and routes to a seasonal model. Cafes, restaurants and catering services and Newspaper and book retailing both fall under 0.94, so the rule checks spectral_entropy next: Newspaper and book retailing clears 0.3 and gets flagged for review, and Cafes, restaurants and catering services clears neither bar and lands on a plain trend model.", "no": "Use the same two thresholds from the last step, checked in the same order: seasonal_strength_year above 0.94 first, then spectral_entropy above 0.3."}
::solution
```r
# Add a route column using the same rule from the last step
vic_quiz3 |>
  mutate(route = case_when(
    seasonal_strength_year > 0.94 ~ "seasonal model",
    spectral_entropy > 0.3 ~ "flag for review",
    TRUE ~ "plain trend model"
  ))
#> # A tibble: 3 × 4
#>   Industry                                 seasonal_strength_year spectral_entropy route            
#>   <chr>                                                     <dbl>            <dbl> <chr>            
#> 1 Cafes, restaurants and catering services                  0.723            0.107 plain trend model
#> 2 Liquor retailing                                          0.973            0.159 seasonal model   
#> 3 Newspaper and book retailing                              0.876            0.619 flag for review  
```

=== step === concept
## References

- [Forecasting: Principles and Practice, the Time Series Features chapter](https://otexts.com/fpp3/features.html) - Hyndman, R.J. and Athanasopoulos, G. (3rd ed.), OTexts.
- [feasts::feature_set() reference](https://feasts.tidyverts.org/reference/feature_set.html) - the feasts package documentation for feature_set(), feat_stl(), feat_acf() and feat_spectral(), the four feature functions used throughout this lesson.
- [Retail Trade, Australia](https://www.abs.gov.au/statistics/industry/retail-and-wholesale-trade/retail-trade-australia), Australian Bureau of Statistics, catalogue 8501.0, the source of the series used throughout this course.
- Hyndman, R.J., Wang, E. and Laptev, N. (2015), "Large-Scale Unusual Time Series Detection," IEEE International Conference on Data Mining Workshop (ICDMW), the origin of the feature-space approach this lesson's routing rule is built on.

=== step === complete
## Quick recap

Twenty industries, 441 months each, and four feature functions turned all of that into four numbers per industry: trend_strength and seasonal_strength_year from an STL split, acf1 and season_acf1 from the raw autocorrelation, and spectral_entropy from the spectrum. Every one of those numbers came from `features()`, run once across every series in the tsibble at once, never from reading a single plot by eye.

Plotted against each other, those numbers turned into a map: most of Victoria retail sits bunched together, strongly trending and strongly seasonal, with Newspaper and book retailing sitting apart on nearly every axis that mattered. And a simple rule on two of those numbers, seasonal_strength_year and spectral_entropy, was enough to route all 20 industries toward a model family, seasonal, plain trend, or flagged for review, without fitting a single model first.

The next part covers what a fitted model's own residuals can tell you, once you actually fit one.
