---
title: "Time Series Foundations Lesson 4: EDA for time series"
catalog_blurb: "The plots-first checklist for spotting outliers, breaks and gaps before you model."
description: "Run the plots-first EDA workflow on a real monthly retail series in R: autoplot(), season summaries, an STL outlier rule, calendar effects, breaks and gaps."
keywords: "EDA for time series, exploratory data analysis time series, STL decomposition R, time series outliers, structural break time series, scan_gaps count_gaps"
post_type: "LESSON"
curriculum_id: "5.10.4"
webr: true
mathjax: false
lesson_access: "free"
course_id: "ts-foundations"
course_title: "Time Series Foundations"
course_lesson: "4"
course_total: "8"
course_landing: "Time-Series-Foundations-Course.html"
course_next: "Seasonal-Subseries-and-Lag-Plots.html"
course_prev: "Time-Series-Analysis-in-R.html"
---

=== step === cover
## EDA for time series

Today let's understand how to look at a time series properly, before you ever fit a model to it, using one real dataset.

Here is 37 years of real data: the monthly turnover of cafes, restaurants and takeaway food outlets in Victoria, Australia, from April 1982 to December 2018, in $ million. That's 441 months in a row, published by the Australian Bureau of Statistics, plotted once, in full.

::widget chart-plotter {"data":[{"x":1,"y":85.1},{"x":2,"y":85.1},{"x":3,"y":82.8},{"x":4,"y":82.1},{"x":5,"y":81.8},{"x":6,"y":84.6},{"x":7,"y":91.7},{"x":8,"y":97.7},{"x":9,"y":109.3},{"x":10,"y":94.6},{"x":11,"y":88.2},{"x":12,"y":92},{"x":13,"y":85.2},{"x":14,"y":86.8},{"x":15,"y":81.3},{"x":16,"y":85.6},{"x":17,"y":90.5},{"x":18,"y":90.8},{"x":19,"y":92.7},{"x":20,"y":95.8},{"x":21,"y":111.7},{"x":22,"y":92.7},{"x":23,"y":94.4},{"x":24,"y":97.8},{"x":25,"y":92.9},{"x":26,"y":101},{"x":27,"y":92.1},{"x":28,"y":92.5},{"x":29,"y":94.4},{"x":30,"y":90.4},{"x":31,"y":95.7},{"x":32,"y":100.6},{"x":33,"y":112.4},{"x":34,"y":96.3},{"x":35,"y":93.9},{"x":36,"y":98},{"x":37,"y":98.4},{"x":38,"y":101.8},{"x":39,"y":90.8},{"x":40,"y":98.3},{"x":41,"y":107},{"x":42,"y":103.2},{"x":43,"y":111.8},{"x":44,"y":112.3},{"x":45,"y":126.8},{"x":46,"y":113.8},{"x":47,"y":104.4},{"x":48,"y":109.7},{"x":49,"y":110.2},{"x":50,"y":118},{"x":51,"y":108.2},{"x":52,"y":123.5},{"x":53,"y":131.7},{"x":54,"y":132.9},{"x":55,"y":142.8},{"x":56,"y":138.3},{"x":57,"y":159.5},{"x":58,"y":138.9},{"x":59,"y":130.9},{"x":60,"y":136.3},{"x":61,"y":142.7},{"x":62,"y":144.2},{"x":63,"y":137.9},{"x":64,"y":149},{"x":65,"y":146.4},{"x":66,"y":146.4},{"x":67,"y":157.3},{"x":68,"y":155.3},{"x":69,"y":186.5},{"x":70,"y":143.3},{"x":71,"y":146.7},{"x":72,"y":159.6},{"x":73,"y":158.7},{"x":74,"y":151.7},{"x":75,"y":155.7},{"x":76,"y":154},{"x":77,"y":159.9},{"x":78,"y":165.3},{"x":79,"y":167.8},{"x":80,"y":176.4},{"x":81,"y":186.2},{"x":82,"y":167.2},{"x":83,"y":167.9},{"x":84,"y":180.6},{"x":85,"y":179.4},{"x":86,"y":182.9},{"x":87,"y":177.5},{"x":88,"y":183.3},{"x":89,"y":177.4},{"x":90,"y":188.3},{"x":91,"y":203},{"x":92,"y":203.6},{"x":93,"y":236.8},{"x":94,"y":198.3},{"x":95,"y":183.5},{"x":96,"y":204.6},{"x":97,"y":183.9},{"x":98,"y":183.5},{"x":99,"y":182.1},{"x":100,"y":193.4},{"x":101,"y":186.7},{"x":102,"y":182.9},{"x":103,"y":185.2},{"x":104,"y":183.1},{"x":105,"y":209.1},{"x":106,"y":187.8},{"x":107,"y":166.9},{"x":108,"y":174.1},{"x":109,"y":169.5},{"x":110,"y":177.7},{"x":111,"y":179},{"x":112,"y":179},{"x":113,"y":181.2},{"x":114,"y":183.2},{"x":115,"y":183.9},{"x":116,"y":189},{"x":117,"y":227.5},{"x":118,"y":192.3},{"x":119,"y":184.5},{"x":120,"y":197.9},{"x":121,"y":195.6},{"x":122,"y":193.9},{"x":123,"y":169.3},{"x":124,"y":177.9},{"x":125,"y":173.4},{"x":126,"y":190.6},{"x":127,"y":192.4},{"x":128,"y":195.4},{"x":129,"y":234},{"x":130,"y":207.4},{"x":131,"y":182.1},{"x":132,"y":191.1},{"x":133,"y":189.8},{"x":134,"y":192.1},{"x":135,"y":185.7},{"x":136,"y":200.2},{"x":137,"y":192.4},{"x":138,"y":195.1},{"x":139,"y":192.5},{"x":140,"y":202.3},{"x":141,"y":235.9},{"x":142,"y":194.1},{"x":143,"y":185.3},{"x":144,"y":194.6},{"x":145,"y":181.8},{"x":146,"y":179.9},{"x":147,"y":180},{"x":148,"y":194.6},{"x":149,"y":193.7},{"x":150,"y":206},{"x":151,"y":225.1},{"x":152,"y":219.9},{"x":153,"y":246.3},{"x":154,"y":222.3},{"x":155,"y":207.2},{"x":156,"y":238.1},{"x":157,"y":229},{"x":158,"y":222.4},{"x":159,"y":221.5},{"x":160,"y":225.4},{"x":161,"y":227.4},{"x":162,"y":233.4},{"x":163,"y":230.2},{"x":164,"y":240.4},{"x":165,"y":259.4},{"x":166,"y":239.1},{"x":167,"y":219},{"x":168,"y":238.4},{"x":169,"y":236.4},{"x":170,"y":235.6},{"x":171,"y":225.8},{"x":172,"y":229.9},{"x":173,"y":228.8},{"x":174,"y":219.2},{"x":175,"y":225.5},{"x":176,"y":233.3},{"x":177,"y":254.6},{"x":178,"y":242.1},{"x":179,"y":216.1},{"x":180,"y":249.9},{"x":181,"y":250.8},{"x":182,"y":252.7},{"x":183,"y":235.8},{"x":184,"y":237.5},{"x":185,"y":237.8},{"x":186,"y":235},{"x":187,"y":243.4},{"x":188,"y":238.5},{"x":189,"y":264.3},{"x":190,"y":241.5},{"x":191,"y":218},{"x":192,"y":245.4},{"x":193,"y":235.8},{"x":194,"y":240.2},{"x":195,"y":226.9},{"x":196,"y":248.4},{"x":197,"y":255.5},{"x":198,"y":248},{"x":199,"y":268},{"x":200,"y":260.5},{"x":201,"y":284.2},{"x":202,"y":267.7},{"x":203,"y":248.6},{"x":204,"y":283.3},{"x":205,"y":285.6},{"x":206,"y":299.1},{"x":207,"y":295.2},{"x":208,"y":321.5},{"x":209,"y":331.3},{"x":210,"y":340.2},{"x":211,"y":345.6},{"x":212,"y":352.3},{"x":213,"y":392.1},{"x":214,"y":331.1},{"x":215,"y":295.7},{"x":216,"y":337.2},{"x":217,"y":283.7},{"x":218,"y":308.9},{"x":219,"y":306.3},{"x":220,"y":301.3},{"x":221,"y":307.6},{"x":222,"y":296.9},{"x":223,"y":326.2},{"x":224,"y":324.8},{"x":225,"y":359.9},{"x":226,"y":336.3},{"x":227,"y":311.7},{"x":228,"y":358.4},{"x":229,"y":367},{"x":230,"y":354.4},{"x":231,"y":347.5},{"x":232,"y":371.3},{"x":233,"y":391.5},{"x":234,"y":349.1},{"x":235,"y":361.9},{"x":236,"y":366.2},{"x":237,"y":409.1},{"x":238,"y":385.2},{"x":239,"y":356},{"x":240,"y":399.2},{"x":241,"y":372.7},{"x":242,"y":368.8},{"x":243,"y":355.6},{"x":244,"y":414.5},{"x":245,"y":410},{"x":246,"y":392.5},{"x":247,"y":377.5},{"x":248,"y":393.1},{"x":249,"y":441.2},{"x":250,"y":446.4},{"x":251,"y":378.4},{"x":252,"y":418.4},{"x":253,"y":406.2},{"x":254,"y":426.2},{"x":255,"y":399.1},{"x":256,"y":449},{"x":257,"y":437.6},{"x":258,"y":434.9},{"x":259,"y":479.9},{"x":260,"y":473.8},{"x":261,"y":529.9},{"x":262,"y":478.1},{"x":263,"y":457},{"x":264,"y":499.3},{"x":265,"y":471.8},{"x":266,"y":468.5},{"x":267,"y":438.1},{"x":268,"y":468.4},{"x":269,"y":468.4},{"x":270,"y":490.9},{"x":271,"y":473.9},{"x":272,"y":463},{"x":273,"y":509.6},{"x":274,"y":432},{"x":275,"y":408.1},{"x":276,"y":436.7},{"x":277,"y":439.4},{"x":278,"y":430.9},{"x":279,"y":427.2},{"x":280,"y":451.1},{"x":281,"y":448.6},{"x":282,"y":441.9},{"x":283,"y":474.4},{"x":284,"y":474.2},{"x":285,"y":506.6},{"x":286,"y":468.2},{"x":287,"y":433.3},{"x":288,"y":503.8},{"x":289,"y":501.8},{"x":290,"y":522.5},{"x":291,"y":495.4},{"x":292,"y":507.1},{"x":293,"y":520.6},{"x":294,"y":513.5},{"x":295,"y":504.3},{"x":296,"y":528.6},{"x":297,"y":584.8},{"x":298,"y":523.9},{"x":299,"y":481.2},{"x":300,"y":545.1},{"x":301,"y":531.1},{"x":302,"y":510.3},{"x":303,"y":490.1},{"x":304,"y":497.6},{"x":305,"y":526.4},{"x":306,"y":494.6},{"x":307,"y":540.9},{"x":308,"y":547.9},{"x":309,"y":596.3},{"x":310,"y":539.6},{"x":311,"y":523.1},{"x":312,"y":550.6},{"x":313,"y":541.1},{"x":314,"y":548.6},{"x":315,"y":516.2},{"x":316,"y":541.8},{"x":317,"y":557.8},{"x":318,"y":537.3},{"x":319,"y":591.2},{"x":320,"y":584},{"x":321,"y":673.1},{"x":322,"y":647.8},{"x":323,"y":576},{"x":324,"y":634.5},{"x":325,"y":622.2},{"x":326,"y":631.6},{"x":327,"y":594.2},{"x":328,"y":613.4},{"x":329,"y":642.4},{"x":330,"y":615.6},{"x":331,"y":636.5},{"x":332,"y":654.1},{"x":333,"y":742},{"x":334,"y":657.9},{"x":335,"y":611.4},{"x":336,"y":704.2},{"x":337,"y":697.6},{"x":338,"y":692},{"x":339,"y":669.7},{"x":340,"y":724.2},{"x":341,"y":748.9},{"x":342,"y":735.8},{"x":343,"y":705},{"x":344,"y":693.9},{"x":345,"y":806.9},{"x":346,"y":649.4},{"x":347,"y":597.8},{"x":348,"y":689.6},{"x":349,"y":707.6},{"x":350,"y":699.1},{"x":351,"y":672.5},{"x":352,"y":694},{"x":353,"y":694.7},{"x":354,"y":686.9},{"x":355,"y":682.1},{"x":356,"y":681.5},{"x":357,"y":761.4},{"x":358,"y":638.4},{"x":359,"y":594.5},{"x":360,"y":679.6},{"x":361,"y":632.5},{"x":362,"y":666.8},{"x":363,"y":661.9},{"x":364,"y":676.4},{"x":365,"y":681.5},{"x":366,"y":662.4},{"x":367,"y":684.9},{"x":368,"y":707},{"x":369,"y":750.8},{"x":370,"y":655.5},{"x":371,"y":605.2},{"x":372,"y":683.2},{"x":373,"y":682.8},{"x":374,"y":682},{"x":375,"y":651.6},{"x":376,"y":656.7},{"x":377,"y":664.9},{"x":378,"y":665.7},{"x":379,"y":686},{"x":380,"y":707.5},{"x":381,"y":792.2},{"x":382,"y":721.2},{"x":383,"y":631.6},{"x":384,"y":725.5},{"x":385,"y":722.1},{"x":386,"y":718.8},{"x":387,"y":693.6},{"x":388,"y":753.8},{"x":389,"y":784.4},{"x":390,"y":791.9},{"x":391,"y":789.5},{"x":392,"y":778.2},{"x":393,"y":838.1},{"x":394,"y":786.6},{"x":395,"y":689.1},{"x":396,"y":753.4},{"x":397,"y":737.5},{"x":398,"y":740.3},{"x":399,"y":726.1},{"x":400,"y":780.8},{"x":401,"y":795},{"x":402,"y":795.8},{"x":403,"y":811.7},{"x":404,"y":832.6},{"x":405,"y":896.7},{"x":406,"y":790.8},{"x":407,"y":732.4},{"x":408,"y":793.3},{"x":409,"y":805.4},{"x":410,"y":808.9},{"x":411,"y":769},{"x":412,"y":828.7},{"x":413,"y":866.3},{"x":414,"y":878.3},{"x":415,"y":886.3},{"x":416,"y":879.5},{"x":417,"y":961.8},{"x":418,"y":861.4},{"x":419,"y":753.6},{"x":420,"y":868.4},{"x":421,"y":859.7},{"x":422,"y":845.2},{"x":423,"y":828.7},{"x":424,"y":857.6},{"x":425,"y":874.1},{"x":426,"y":872.4},{"x":427,"y":917.7},{"x":428,"y":925.7},{"x":429,"y":1008.1},{"x":430,"y":887.3},{"x":431,"y":810.6},{"x":432,"y":909.7},{"x":433,"y":898.6},{"x":434,"y":866.4},{"x":435,"y":873.1},{"x":436,"y":916.1},{"x":437,"y":943.8},{"x":438,"y":933.8},{"x":439,"y":960},{"x":440,"y":981.8},{"x":441,"y":1066.2}],"geoms":["line"],"x":"month","y":"turnover"}

Look at that shape for a second. It climbs for nearly four decades, but it is not a smooth climb: small bumps ride on top of it every single year. Everything in this lesson is about reading that shape properly, one piece at a time, before fitting anything to it.

=== step === concept
## The plots-first workflow and autoplot()

Before you fit anything to a time series, look at it properly first. That is exploratory data analysis, EDA for short, applied to a time series: a short, repeatable checklist you run before any model touches the data.

For a time series, that checklist covers six things, always in this order:

1. Shape - what does the series look like, overall?
2. Season-and-year summaries - how does it move within a year, and across years?
3. Outliers - which points do not fit the pattern the rest of the series follows?
4. Calendar effects - do those "outliers" actually repeat every year, at the same point in the calendar?
5. Structural breaks - did the whole series shift level at some point?
6. Missing runs - are there gaps in the data itself?

You already saw the first item on the cover: the raw shape of the series. To make that same plot in R, use `autoplot()`, the plotting function built for a tsibble that skips ggplot2's usual setup. Build the tsibble first.

```r
# Build the Victoria cafes and restaurants tsibble from the ABS retail data
library(tsibble)
library(tsibbledata)
library(dplyr)
options(pillar.sigfig = 6)

cafe <- tsibbledata::aus_retail %>%
  filter(State == "Victoria", Industry == "Cafes, restaurants and takeaway food services") %>%
  select(Month, Turnover)

cafe
#> # A tsibble: 441 x 2 [1M]
#>       Month Turnover
#>       <mth>    <dbl>
#>  1 1982 Apr     85.1
#>  2 1982 May     85.1
#>  3 1982 Jun     82.8
#>  4 1982 Jul     82.1
#>  5 1982 Aug     81.8
#>  6 1982 Sep     84.6
#>  7 1982 Oct     91.7
#>  8 1982 Nov     97.7
#>  9 1982 Dec    109.3
#> 10 1983 Jan     94.6
#> # i 431 more rows
```

`aus_retail` is a large keyed tsibble bundled with the `tsibbledata` package: one series per Australian state and industry. Filtering down to Victoria's cafes, restaurants and takeaway food services leaves one series, 441 months, from April 1982 to December 2018. `[1M]` in the header says its index moves in fixed 1-month steps.

Now plot it with `autoplot()`.

```r
# The tsibble-aware plot: no ggplot() setup needed
library(feasts)

autoplot(cafe, Turnover)
```

`autoplot()` reads the tsibble's index directly, so you only name the column to plot, `Turnover`, and it draws the line correctly ordered by `Month` without you writing a single `ggplot()` call. The plot is the same one from the cover: a level that rises for nearly four decades, an unmistakable trend, with a small wave riding on top of it every year.

=== step === concept
## Summaries by season and year

Shape tells you the series rises. It does not tell you which months are typically strong and which are typically weak, or whether that pattern holds steady from one year to the next. For that, summarise the series by season and by year.

Pivot the tsibble so each row is a calendar month and each column is a year, for the last three years in the data.

```r
# Pivot the tsibble to a Year x Month table for 2016-2018
library(tidyr)
library(lubridate)

season_wide <- cafe %>%
  as_tibble() %>%
  mutate(Year = year(Month), Mon = month(Month, label = TRUE, abbr = TRUE)) %>%
  filter(Year %in% 2016:2018) %>%
  select(Year, Mon, Turnover) %>%
  pivot_wider(names_from = Year, values_from = Turnover)

season_wide
#> # A tibble: 12 x 4
#>    Mon   `2016` `2017` `2018`
#>    <ord>  <dbl>  <dbl>  <dbl>
#>  1 Jan    790.8  861.4  887.3
#>  2 Feb    732.4  753.6  810.6
#>  3 Mar    793.3  868.4  909.7
#>  4 Apr    805.4  859.7  898.6
#>  5 May    808.9  845.2  866.4
#>  6 Jun    769    828.7  873.1
#>  7 Jul    828.7  857.6  916.1
#>  8 Aug    866.3  874.1  943.8
#>  9 Sep    878.3  872.4  933.8
#> 10 Oct    886.3  917.7  960
#> 11 Nov    879.5  925.7  981.8
#> 12 Dec    961.8 1008.1 1066.2
```

Read down any one column and turnover climbs from a January dip to a December peak, the same shape every year. Read across any one row and the number grows a little every year, the trend you already saw on the plot. December 2018, at $1,066.2 million, is the single highest month in this slice; February 2016, at $732.4 million, is the lowest.

Three years hints at a pattern. Thirty-seven years confirms it. Average each calendar month over the full 1982-2018 history and rank the months from strongest to weakest.

```r
# The 37-year average for each calendar month, highest to lowest
month_avg <- cafe %>%
  as_tibble() %>%
  mutate(Mon = month(Month, label = TRUE, abbr = TRUE)) %>%
  group_by(Mon) %>%
  summarise(avg_turnover = round(mean(Turnover), 1), .groups = "drop") %>%
  arrange(desc(avg_turnover))

month_avg
#> # A tibble: 12 x 2
#>    Mon   avg_turnover
#>    <ord>        <dbl>
#>  1 Dec          461.4
#>  2 Nov          416
#>  3 Oct          412
#>  4 Mar          405
#>  5 Aug          404.4
#>  6 Sep          400.7
#>  7 Jul          396.8
#>  8 Jan          396.6
#>  9 May          390.2
#> 10 Apr          389
#> 11 Jun          376.9
#> 12 Feb          363.5
```

December averages $461.4 million across all 37 years, the highest of any month by a wide margin. February averages $363.5 million, the lowest. That is the seasonal pattern this series carries every single year: a December peak, driven by Christmas trading, and a February trough, a shorter month with fewer trading days. Here is the three-year slice again, as a report-ready table.

::widget styled-table {"cols":["Mon","2016","2017","2018"],"rows":[["Jan",790.8,861.4,887.3],["Feb",732.4,753.6,810.6],["Mar",793.3,868.4,909.7],["Apr",805.4,859.7,898.6],["May",808.9,845.2,866.4],["Jun",769,828.7,873.1],["Jul",828.7,857.6,916.1],["Aug",866.3,874.1,943.8],["Sep",878.3,872.4,933.8],["Oct",886.3,917.7,960],["Nov",879.5,925.7,981.8],["Dec",961.8,1008.1,1066.2]],"formats":{"2016":"1dp","2017":"1dp","2018":"1dp"},"title":"Monthly turnover ($ million), Victoria cafes and restaurants","note":"December leads every one of the three years; February trails every one of them."}

=== step === concept
## Spotting outliers with the STL remainder

Season-and-year summaries tell you the typical pattern. To find the months that broke it, you need to strip that pattern away and look at what is left over. STL, short for Seasonal-Trend decomposition using Loess, does exactly that: it splits a series into a trend (the slow-moving overall level), a season component (the repeating yearly wave) and a remainder (whatever is left once both are subtracted out).

Fit STL on `cafe`, with `season(window = "periodic")` telling it to use one fixed seasonal shape for the whole 37 years, rather than letting that shape drift year to year.

```r
# Split the series into trend, yearly season and remainder with STL
dcmp <- cafe %>%
  model(STL(Turnover ~ season(window = "periodic"))) %>%
  components()

dcmp %>%
  as_tibble() %>%
  select(Month, Turnover, trend, season_year, remainder) %>%
  mutate(across(trend:remainder, ~ round(.x, 1)))
#> # A tibble: 441 x 5
#>       Month Turnover trend season_year remainder
#>       <mth>    <dbl> <dbl>       <dbl>     <dbl>
#>  1 1982 Apr     85.1  88.8        -5.4       1.8
#>  2 1982 May     85.1  88.8        -6.1       2.5
#>  3 1982 Jun     82.8  88.7       -21.5      15.5
#>  4 1982 Jul     82.1  88.9        -3.3      -3.5
#>  5 1982 Aug     81.8    89         2.6      -9.8
#>  6 1982 Sep     84.6  89.2        -2.9      -1.7
#>  7 1982 Oct     91.7  89.5         6.6      -4.4
#>  8 1982 Nov     97.7  89.6         8.5      -0.4
#>  9 1982 Dec    109.3  89.8        51.8     -32.3
#> 10 1983 Jan     94.6  90.2         0.3       4.1
#> # i 431 more rows
```

Add up `trend`, `season_year` and `remainder` for any row and you get back `Turnover` exactly. `trend` is a smooth, slow-moving line. `season_year` is the same fixed December-up, February-down wave every year. `remainder` is what is left over: how far off `trend + season_year` sits from the real number, for that one month.

Most months have a small remainder, a few $million either way. A month whose remainder is unusually large, relative to the rest, is a candidate outlier. "Unusually large" needs a threshold, and standard deviation gives you a simple one: flag any month whose remainder sits more than 2 standard deviations from zero.

```r
# Flag any month whose remainder sits more than 2 standard deviations from zero
remainder_sd <- sd(dcmp$remainder)
remainder_sd
#> [1] 16.9647

flagged <- dcmp %>% filter(abs(remainder) > 2 * remainder_sd)
nrow(flagged)
#> [1] 29

flagged %>%
  as_tibble() %>%
  select(Month, remainder) %>%
  mutate(remainder = round(remainder, 1))
#> # A tibble: 29 x 2
#>       Month remainder
#>       <mth>     <dbl>
#>  1 1984 Dec     -35.9
#>  2 1985 Dec     -34.2
#>  3 1988 Dec     -36.1
#>  4 1998 Dec     -34.2
#>  5 2003 Jan      36.7
#>  6 2008 Sep     -34.4
#>  7 2009 Jan      43.4
#>  8 2010 Aug      41.4
#>  9 2010 Sep      34.4
#> 10 2010 Dec      54.9
#> # i 19 more rows
```

The remainder's standard deviation across all 441 months is about 17. Twice that is 34, so any month whose remainder is more than 34 $million above or below zero gets flagged. That rule catches 29 of the 441 months, about 1 in 15. Here is the full series again, with those 29 months picked out.

::widget chart-plotter {"data":[{"x":1,"y":85.1,"fill":"Typical"},{"x":2,"y":85.1,"fill":"Typical"},{"x":3,"y":82.8,"fill":"Typical"},{"x":4,"y":82.1,"fill":"Typical"},{"x":5,"y":81.8,"fill":"Typical"},{"x":6,"y":84.6,"fill":"Typical"},{"x":7,"y":91.7,"fill":"Typical"},{"x":8,"y":97.7,"fill":"Typical"},{"x":9,"y":109.3,"fill":"Typical"},{"x":10,"y":94.6,"fill":"Typical"},{"x":11,"y":88.2,"fill":"Typical"},{"x":12,"y":92,"fill":"Typical"},{"x":13,"y":85.2,"fill":"Typical"},{"x":14,"y":86.8,"fill":"Typical"},{"x":15,"y":81.3,"fill":"Typical"},{"x":16,"y":85.6,"fill":"Typical"},{"x":17,"y":90.5,"fill":"Typical"},{"x":18,"y":90.8,"fill":"Typical"},{"x":19,"y":92.7,"fill":"Typical"},{"x":20,"y":95.8,"fill":"Typical"},{"x":21,"y":111.7,"fill":"Typical"},{"x":22,"y":92.7,"fill":"Typical"},{"x":23,"y":94.4,"fill":"Typical"},{"x":24,"y":97.8,"fill":"Typical"},{"x":25,"y":92.9,"fill":"Typical"},{"x":26,"y":101,"fill":"Typical"},{"x":27,"y":92.1,"fill":"Typical"},{"x":28,"y":92.5,"fill":"Typical"},{"x":29,"y":94.4,"fill":"Typical"},{"x":30,"y":90.4,"fill":"Typical"},{"x":31,"y":95.7,"fill":"Typical"},{"x":32,"y":100.6,"fill":"Typical"},{"x":33,"y":112.4,"fill":"Flagged"},{"x":34,"y":96.3,"fill":"Typical"},{"x":35,"y":93.9,"fill":"Typical"},{"x":36,"y":98,"fill":"Typical"},{"x":37,"y":98.4,"fill":"Typical"},{"x":38,"y":101.8,"fill":"Typical"},{"x":39,"y":90.8,"fill":"Typical"},{"x":40,"y":98.3,"fill":"Typical"},{"x":41,"y":107,"fill":"Typical"},{"x":42,"y":103.2,"fill":"Typical"},{"x":43,"y":111.8,"fill":"Typical"},{"x":44,"y":112.3,"fill":"Typical"},{"x":45,"y":126.8,"fill":"Flagged"},{"x":46,"y":113.8,"fill":"Typical"},{"x":47,"y":104.4,"fill":"Typical"},{"x":48,"y":109.7,"fill":"Typical"},{"x":49,"y":110.2,"fill":"Typical"},{"x":50,"y":118,"fill":"Typical"},{"x":51,"y":108.2,"fill":"Typical"},{"x":52,"y":123.5,"fill":"Typical"},{"x":53,"y":131.7,"fill":"Typical"},{"x":54,"y":132.9,"fill":"Typical"},{"x":55,"y":142.8,"fill":"Typical"},{"x":56,"y":138.3,"fill":"Typical"},{"x":57,"y":159.5,"fill":"Typical"},{"x":58,"y":138.9,"fill":"Typical"},{"x":59,"y":130.9,"fill":"Typical"},{"x":60,"y":136.3,"fill":"Typical"},{"x":61,"y":142.7,"fill":"Typical"},{"x":62,"y":144.2,"fill":"Typical"},{"x":63,"y":137.9,"fill":"Typical"},{"x":64,"y":149,"fill":"Typical"},{"x":65,"y":146.4,"fill":"Typical"},{"x":66,"y":146.4,"fill":"Typical"},{"x":67,"y":157.3,"fill":"Typical"},{"x":68,"y":155.3,"fill":"Typical"},{"x":69,"y":186.5,"fill":"Typical"},{"x":70,"y":143.3,"fill":"Typical"},{"x":71,"y":146.7,"fill":"Typical"},{"x":72,"y":159.6,"fill":"Typical"},{"x":73,"y":158.7,"fill":"Typical"},{"x":74,"y":151.7,"fill":"Typical"},{"x":75,"y":155.7,"fill":"Typical"},{"x":76,"y":154,"fill":"Typical"},{"x":77,"y":159.9,"fill":"Typical"},{"x":78,"y":165.3,"fill":"Typical"},{"x":79,"y":167.8,"fill":"Typical"},{"x":80,"y":176.4,"fill":"Typical"},{"x":81,"y":186.2,"fill":"Flagged"},{"x":82,"y":167.2,"fill":"Typical"},{"x":83,"y":167.9,"fill":"Typical"},{"x":84,"y":180.6,"fill":"Typical"},{"x":85,"y":179.4,"fill":"Typical"},{"x":86,"y":182.9,"fill":"Typical"},{"x":87,"y":177.5,"fill":"Typical"},{"x":88,"y":183.3,"fill":"Typical"},{"x":89,"y":177.4,"fill":"Typical"},{"x":90,"y":188.3,"fill":"Typical"},{"x":91,"y":203,"fill":"Typical"},{"x":92,"y":203.6,"fill":"Typical"},{"x":93,"y":236.8,"fill":"Typical"},{"x":94,"y":198.3,"fill":"Typical"},{"x":95,"y":183.5,"fill":"Typical"},{"x":96,"y":204.6,"fill":"Typical"},{"x":97,"y":183.9,"fill":"Typical"},{"x":98,"y":183.5,"fill":"Typical"},{"x":99,"y":182.1,"fill":"Typical"},{"x":100,"y":193.4,"fill":"Typical"},{"x":101,"y":186.7,"fill":"Typical"},{"x":102,"y":182.9,"fill":"Typical"},{"x":103,"y":185.2,"fill":"Typical"},{"x":104,"y":183.1,"fill":"Typical"},{"x":105,"y":209.1,"fill":"Typical"},{"x":106,"y":187.8,"fill":"Typical"},{"x":107,"y":166.9,"fill":"Typical"},{"x":108,"y":174.1,"fill":"Typical"},{"x":109,"y":169.5,"fill":"Typical"},{"x":110,"y":177.7,"fill":"Typical"},{"x":111,"y":179,"fill":"Typical"},{"x":112,"y":179,"fill":"Typical"},{"x":113,"y":181.2,"fill":"Typical"},{"x":114,"y":183.2,"fill":"Typical"},{"x":115,"y":183.9,"fill":"Typical"},{"x":116,"y":189,"fill":"Typical"},{"x":117,"y":227.5,"fill":"Typical"},{"x":118,"y":192.3,"fill":"Typical"},{"x":119,"y":184.5,"fill":"Typical"},{"x":120,"y":197.9,"fill":"Typical"},{"x":121,"y":195.6,"fill":"Typical"},{"x":122,"y":193.9,"fill":"Typical"},{"x":123,"y":169.3,"fill":"Typical"},{"x":124,"y":177.9,"fill":"Typical"},{"x":125,"y":173.4,"fill":"Typical"},{"x":126,"y":190.6,"fill":"Typical"},{"x":127,"y":192.4,"fill":"Typical"},{"x":128,"y":195.4,"fill":"Typical"},{"x":129,"y":234,"fill":"Typical"},{"x":130,"y":207.4,"fill":"Typical"},{"x":131,"y":182.1,"fill":"Typical"},{"x":132,"y":191.1,"fill":"Typical"},{"x":133,"y":189.8,"fill":"Typical"},{"x":134,"y":192.1,"fill":"Typical"},{"x":135,"y":185.7,"fill":"Typical"},{"x":136,"y":200.2,"fill":"Typical"},{"x":137,"y":192.4,"fill":"Typical"},{"x":138,"y":195.1,"fill":"Typical"},{"x":139,"y":192.5,"fill":"Typical"},{"x":140,"y":202.3,"fill":"Typical"},{"x":141,"y":235.9,"fill":"Typical"},{"x":142,"y":194.1,"fill":"Typical"},{"x":143,"y":185.3,"fill":"Typical"},{"x":144,"y":194.6,"fill":"Typical"},{"x":145,"y":181.8,"fill":"Typical"},{"x":146,"y":179.9,"fill":"Typical"},{"x":147,"y":180,"fill":"Typical"},{"x":148,"y":194.6,"fill":"Typical"},{"x":149,"y":193.7,"fill":"Typical"},{"x":150,"y":206,"fill":"Typical"},{"x":151,"y":225.1,"fill":"Typical"},{"x":152,"y":219.9,"fill":"Typical"},{"x":153,"y":246.3,"fill":"Typical"},{"x":154,"y":222.3,"fill":"Typical"},{"x":155,"y":207.2,"fill":"Typical"},{"x":156,"y":238.1,"fill":"Typical"},{"x":157,"y":229,"fill":"Typical"},{"x":158,"y":222.4,"fill":"Typical"},{"x":159,"y":221.5,"fill":"Typical"},{"x":160,"y":225.4,"fill":"Typical"},{"x":161,"y":227.4,"fill":"Typical"},{"x":162,"y":233.4,"fill":"Typical"},{"x":163,"y":230.2,"fill":"Typical"},{"x":164,"y":240.4,"fill":"Typical"},{"x":165,"y":259.4,"fill":"Typical"},{"x":166,"y":239.1,"fill":"Typical"},{"x":167,"y":219,"fill":"Typical"},{"x":168,"y":238.4,"fill":"Typical"},{"x":169,"y":236.4,"fill":"Typical"},{"x":170,"y":235.6,"fill":"Typical"},{"x":171,"y":225.8,"fill":"Typical"},{"x":172,"y":229.9,"fill":"Typical"},{"x":173,"y":228.8,"fill":"Typical"},{"x":174,"y":219.2,"fill":"Typical"},{"x":175,"y":225.5,"fill":"Typical"},{"x":176,"y":233.3,"fill":"Typical"},{"x":177,"y":254.6,"fill":"Typical"},{"x":178,"y":242.1,"fill":"Typical"},{"x":179,"y":216.1,"fill":"Typical"},{"x":180,"y":249.9,"fill":"Typical"},{"x":181,"y":250.8,"fill":"Typical"},{"x":182,"y":252.7,"fill":"Typical"},{"x":183,"y":235.8,"fill":"Typical"},{"x":184,"y":237.5,"fill":"Typical"},{"x":185,"y":237.8,"fill":"Typical"},{"x":186,"y":235,"fill":"Typical"},{"x":187,"y":243.4,"fill":"Typical"},{"x":188,"y":238.5,"fill":"Typical"},{"x":189,"y":264.3,"fill":"Typical"},{"x":190,"y":241.5,"fill":"Typical"},{"x":191,"y":218,"fill":"Typical"},{"x":192,"y":245.4,"fill":"Typical"},{"x":193,"y":235.8,"fill":"Typical"},{"x":194,"y":240.2,"fill":"Typical"},{"x":195,"y":226.9,"fill":"Typical"},{"x":196,"y":248.4,"fill":"Typical"},{"x":197,"y":255.5,"fill":"Typical"},{"x":198,"y":248,"fill":"Typical"},{"x":199,"y":268,"fill":"Typical"},{"x":200,"y":260.5,"fill":"Typical"},{"x":201,"y":284.2,"fill":"Flagged"},{"x":202,"y":267.7,"fill":"Typical"},{"x":203,"y":248.6,"fill":"Typical"},{"x":204,"y":283.3,"fill":"Typical"},{"x":205,"y":285.6,"fill":"Typical"},{"x":206,"y":299.1,"fill":"Typical"},{"x":207,"y":295.2,"fill":"Typical"},{"x":208,"y":321.5,"fill":"Typical"},{"x":209,"y":331.3,"fill":"Typical"},{"x":210,"y":340.2,"fill":"Typical"},{"x":211,"y":345.6,"fill":"Typical"},{"x":212,"y":352.3,"fill":"Typical"},{"x":213,"y":392.1,"fill":"Typical"},{"x":214,"y":331.1,"fill":"Typical"},{"x":215,"y":295.7,"fill":"Typical"},{"x":216,"y":337.2,"fill":"Typical"},{"x":217,"y":283.7,"fill":"Typical"},{"x":218,"y":308.9,"fill":"Typical"},{"x":219,"y":306.3,"fill":"Typical"},{"x":220,"y":301.3,"fill":"Typical"},{"x":221,"y":307.6,"fill":"Typical"},{"x":222,"y":296.9,"fill":"Typical"},{"x":223,"y":326.2,"fill":"Typical"},{"x":224,"y":324.8,"fill":"Typical"},{"x":225,"y":359.9,"fill":"Typical"},{"x":226,"y":336.3,"fill":"Typical"},{"x":227,"y":311.7,"fill":"Typical"},{"x":228,"y":358.4,"fill":"Typical"},{"x":229,"y":367,"fill":"Typical"},{"x":230,"y":354.4,"fill":"Typical"},{"x":231,"y":347.5,"fill":"Typical"},{"x":232,"y":371.3,"fill":"Typical"},{"x":233,"y":391.5,"fill":"Typical"},{"x":234,"y":349.1,"fill":"Typical"},{"x":235,"y":361.9,"fill":"Typical"},{"x":236,"y":366.2,"fill":"Typical"},{"x":237,"y":409.1,"fill":"Typical"},{"x":238,"y":385.2,"fill":"Typical"},{"x":239,"y":356,"fill":"Typical"},{"x":240,"y":399.2,"fill":"Typical"},{"x":241,"y":372.7,"fill":"Typical"},{"x":242,"y":368.8,"fill":"Typical"},{"x":243,"y":355.6,"fill":"Typical"},{"x":244,"y":414.5,"fill":"Typical"},{"x":245,"y":410,"fill":"Typical"},{"x":246,"y":392.5,"fill":"Typical"},{"x":247,"y":377.5,"fill":"Typical"},{"x":248,"y":393.1,"fill":"Typical"},{"x":249,"y":441.2,"fill":"Typical"},{"x":250,"y":446.4,"fill":"Flagged"},{"x":251,"y":378.4,"fill":"Typical"},{"x":252,"y":418.4,"fill":"Typical"},{"x":253,"y":406.2,"fill":"Typical"},{"x":254,"y":426.2,"fill":"Typical"},{"x":255,"y":399.1,"fill":"Typical"},{"x":256,"y":449,"fill":"Typical"},{"x":257,"y":437.6,"fill":"Typical"},{"x":258,"y":434.9,"fill":"Typical"},{"x":259,"y":479.9,"fill":"Typical"},{"x":260,"y":473.8,"fill":"Typical"},{"x":261,"y":529.9,"fill":"Typical"},{"x":262,"y":478.1,"fill":"Typical"},{"x":263,"y":457,"fill":"Typical"},{"x":264,"y":499.3,"fill":"Typical"},{"x":265,"y":471.8,"fill":"Typical"},{"x":266,"y":468.5,"fill":"Typical"},{"x":267,"y":438.1,"fill":"Typical"},{"x":268,"y":468.4,"fill":"Typical"},{"x":269,"y":468.4,"fill":"Typical"},{"x":270,"y":490.9,"fill":"Typical"},{"x":271,"y":473.9,"fill":"Typical"},{"x":272,"y":463,"fill":"Typical"},{"x":273,"y":509.6,"fill":"Typical"},{"x":274,"y":432,"fill":"Typical"},{"x":275,"y":408.1,"fill":"Typical"},{"x":276,"y":436.7,"fill":"Typical"},{"x":277,"y":439.4,"fill":"Typical"},{"x":278,"y":430.9,"fill":"Typical"},{"x":279,"y":427.2,"fill":"Typical"},{"x":280,"y":451.1,"fill":"Typical"},{"x":281,"y":448.6,"fill":"Typical"},{"x":282,"y":441.9,"fill":"Typical"},{"x":283,"y":474.4,"fill":"Typical"},{"x":284,"y":474.2,"fill":"Typical"},{"x":285,"y":506.6,"fill":"Typical"},{"x":286,"y":468.2,"fill":"Typical"},{"x":287,"y":433.3,"fill":"Typical"},{"x":288,"y":503.8,"fill":"Typical"},{"x":289,"y":501.8,"fill":"Typical"},{"x":290,"y":522.5,"fill":"Typical"},{"x":291,"y":495.4,"fill":"Typical"},{"x":292,"y":507.1,"fill":"Typical"},{"x":293,"y":520.6,"fill":"Typical"},{"x":294,"y":513.5,"fill":"Typical"},{"x":295,"y":504.3,"fill":"Typical"},{"x":296,"y":528.6,"fill":"Typical"},{"x":297,"y":584.8,"fill":"Typical"},{"x":298,"y":523.9,"fill":"Typical"},{"x":299,"y":481.2,"fill":"Typical"},{"x":300,"y":545.1,"fill":"Typical"},{"x":301,"y":531.1,"fill":"Typical"},{"x":302,"y":510.3,"fill":"Typical"},{"x":303,"y":490.1,"fill":"Typical"},{"x":304,"y":497.6,"fill":"Typical"},{"x":305,"y":526.4,"fill":"Typical"},{"x":306,"y":494.6,"fill":"Typical"},{"x":307,"y":540.9,"fill":"Typical"},{"x":308,"y":547.9,"fill":"Typical"},{"x":309,"y":596.3,"fill":"Typical"},{"x":310,"y":539.6,"fill":"Typical"},{"x":311,"y":523.1,"fill":"Typical"},{"x":312,"y":550.6,"fill":"Typical"},{"x":313,"y":541.1,"fill":"Typical"},{"x":314,"y":548.6,"fill":"Typical"},{"x":315,"y":516.2,"fill":"Typical"},{"x":316,"y":541.8,"fill":"Typical"},{"x":317,"y":557.8,"fill":"Typical"},{"x":318,"y":537.3,"fill":"Flagged"},{"x":319,"y":591.2,"fill":"Typical"},{"x":320,"y":584,"fill":"Typical"},{"x":321,"y":673.1,"fill":"Typical"},{"x":322,"y":647.8,"fill":"Flagged"},{"x":323,"y":576,"fill":"Typical"},{"x":324,"y":634.5,"fill":"Typical"},{"x":325,"y":622.2,"fill":"Typical"},{"x":326,"y":631.6,"fill":"Typical"},{"x":327,"y":594.2,"fill":"Typical"},{"x":328,"y":613.4,"fill":"Typical"},{"x":329,"y":642.4,"fill":"Typical"},{"x":330,"y":615.6,"fill":"Typical"},{"x":331,"y":636.5,"fill":"Typical"},{"x":332,"y":654.1,"fill":"Typical"},{"x":333,"y":742,"fill":"Typical"},{"x":334,"y":657.9,"fill":"Typical"},{"x":335,"y":611.4,"fill":"Typical"},{"x":336,"y":704.2,"fill":"Typical"},{"x":337,"y":697.6,"fill":"Typical"},{"x":338,"y":692,"fill":"Typical"},{"x":339,"y":669.7,"fill":"Typical"},{"x":340,"y":724.2,"fill":"Typical"},{"x":341,"y":748.9,"fill":"Flagged"},{"x":342,"y":735.8,"fill":"Flagged"},{"x":343,"y":705,"fill":"Typical"},{"x":344,"y":693.9,"fill":"Typical"},{"x":345,"y":806.9,"fill":"Flagged"},{"x":346,"y":649.4,"fill":"Flagged"},{"x":347,"y":597.8,"fill":"Flagged"},{"x":348,"y":689.6,"fill":"Typical"},{"x":349,"y":707.6,"fill":"Typical"},{"x":350,"y":699.1,"fill":"Typical"},{"x":351,"y":672.5,"fill":"Typical"},{"x":352,"y":694,"fill":"Typical"},{"x":353,"y":694.7,"fill":"Typical"},{"x":354,"y":686.9,"fill":"Typical"},{"x":355,"y":682.1,"fill":"Typical"},{"x":356,"y":681.5,"fill":"Typical"},{"x":357,"y":761.4,"fill":"Flagged"},{"x":358,"y":638.4,"fill":"Typical"},{"x":359,"y":594.5,"fill":"Flagged"},{"x":360,"y":679.6,"fill":"Typical"},{"x":361,"y":632.5,"fill":"Typical"},{"x":362,"y":666.8,"fill":"Typical"},{"x":363,"y":661.9,"fill":"Typical"},{"x":364,"y":676.4,"fill":"Typical"},{"x":365,"y":681.5,"fill":"Typical"},{"x":366,"y":662.4,"fill":"Typical"},{"x":367,"y":684.9,"fill":"Typical"},{"x":368,"y":707,"fill":"Typical"},{"x":369,"y":750.8,"fill":"Typical"},{"x":370,"y":655.5,"fill":"Typical"},{"x":371,"y":605.2,"fill":"Flagged"},{"x":372,"y":683.2,"fill":"Typical"},{"x":373,"y":682.8,"fill":"Typical"},{"x":374,"y":682,"fill":"Typical"},{"x":375,"y":651.6,"fill":"Typical"},{"x":376,"y":656.7,"fill":"Typical"},{"x":377,"y":664.9,"fill":"Typical"},{"x":378,"y":665.7,"fill":"Typical"},{"x":379,"y":686,"fill":"Typical"},{"x":380,"y":707.5,"fill":"Typical"},{"x":381,"y":792.2,"fill":"Flagged"},{"x":382,"y":721.2,"fill":"Typical"},{"x":383,"y":631.6,"fill":"Flagged"},{"x":384,"y":725.5,"fill":"Typical"},{"x":385,"y":722.1,"fill":"Typical"},{"x":386,"y":718.8,"fill":"Typical"},{"x":387,"y":693.6,"fill":"Typical"},{"x":388,"y":753.8,"fill":"Typical"},{"x":389,"y":784.4,"fill":"Typical"},{"x":390,"y":791.9,"fill":"Flagged"},{"x":391,"y":789.5,"fill":"Typical"},{"x":392,"y":778.2,"fill":"Typical"},{"x":393,"y":838.1,"fill":"Typical"},{"x":394,"y":786.6,"fill":"Typical"},{"x":395,"y":689.1,"fill":"Flagged"},{"x":396,"y":753.4,"fill":"Typical"},{"x":397,"y":737.5,"fill":"Typical"},{"x":398,"y":740.3,"fill":"Typical"},{"x":399,"y":726.1,"fill":"Typical"},{"x":400,"y":780.8,"fill":"Typical"},{"x":401,"y":795,"fill":"Typical"},{"x":402,"y":795.8,"fill":"Typical"},{"x":403,"y":811.7,"fill":"Typical"},{"x":404,"y":832.6,"fill":"Typical"},{"x":405,"y":896.7,"fill":"Flagged"},{"x":406,"y":790.8,"fill":"Typical"},{"x":407,"y":732.4,"fill":"Flagged"},{"x":408,"y":793.3,"fill":"Typical"},{"x":409,"y":805.4,"fill":"Typical"},{"x":410,"y":808.9,"fill":"Typical"},{"x":411,"y":769,"fill":"Flagged"},{"x":412,"y":828.7,"fill":"Typical"},{"x":413,"y":866.3,"fill":"Typical"},{"x":414,"y":878.3,"fill":"Flagged"},{"x":415,"y":886.3,"fill":"Typical"},{"x":416,"y":879.5,"fill":"Typical"},{"x":417,"y":961.8,"fill":"Flagged"},{"x":418,"y":861.4,"fill":"Typical"},{"x":419,"y":753.6,"fill":"Flagged"},{"x":420,"y":868.4,"fill":"Typical"},{"x":421,"y":859.7,"fill":"Typical"},{"x":422,"y":845.2,"fill":"Typical"},{"x":423,"y":828.7,"fill":"Typical"},{"x":424,"y":857.6,"fill":"Typical"},{"x":425,"y":874.1,"fill":"Typical"},{"x":426,"y":872.4,"fill":"Typical"},{"x":427,"y":917.7,"fill":"Typical"},{"x":428,"y":925.7,"fill":"Typical"},{"x":429,"y":1008.1,"fill":"Flagged"},{"x":430,"y":887.3,"fill":"Typical"},{"x":431,"y":810.6,"fill":"Flagged"},{"x":432,"y":909.7,"fill":"Typical"},{"x":433,"y":898.6,"fill":"Typical"},{"x":434,"y":866.4,"fill":"Flagged"},{"x":435,"y":873.1,"fill":"Typical"},{"x":436,"y":916.1,"fill":"Typical"},{"x":437,"y":943.8,"fill":"Typical"},{"x":438,"y":933.8,"fill":"Typical"},{"x":439,"y":960,"fill":"Typical"},{"x":440,"y":981.8,"fill":"Typical"},{"x":441,"y":1066.2,"fill":"Flagged"}],"geoms":["point","line"],"x":"month","y":"turnover"}

Switch that widget to points and the 29 flagged months stand out clearly against the rest. But a flag is only a candidate. The next question is whether each one is a genuine surprise, or something the calendar explains perfectly well.

=== step === quiz
## Quick check: the table and the flagging rule

::quiz {"correct": 1, "gate": true, "difficulty": "beginner"}
- December is the highest month in the table for 2016, 2017 and 2018, and since 2 x 17 = 34, a remainder of 40 clears that threshold and gets flagged. ::ok Right on both counts. December leads the table in every one of the three years, and 40 is bigger than the 34 threshold, so it gets flagged.
- August is the highest month in the table for 2016, 2017 and 2018. ::no
- February is the highest month in the table for 2016, 2017 and 2018. ::no
- December is the highest month, but a remainder of 25 also clears the 2 x 17 threshold and gets flagged. ::no December really is the highest month in the table for all three years, that part is right. But the threshold check is wrong: 2 x 17 = 34, and 25 is below 34, so a remainder of 25 would not be flagged. Only a remainder past 34, like 40, would.

=== step === concept
## Calendar effects: when a big residual isn't an outlier

29 flagged months is a starting list, not a final answer. Before you call any of them a genuine surprise, check whether it repeats. A remainder that comes back at the same calendar position, year after year, is not one-off at all: it is the fixed seasonal shape `season(window = "periodic")` assumed failing to fit that particular month exactly. That is a calendar effect, not an outlier.

Count the 29 flagged months by which calendar month they fall on.

```r
# Count how many flagged months fall on each calendar month
library(lubridate)

flagged_named <- flagged %>%
  as_tibble() %>%
  mutate(Mon = month(Month, label = TRUE, abbr = TRUE))

flagged_named %>% count(Mon, sort = TRUE)
#> # A tibble: 7 x 2
#>   Mon       n
#>   <ord> <int>
#> 1 Dec      11
#> 2 Feb       8
#> 3 Sep       4
#> 4 Jan       3
#> 5 May       1
#> 6 Jun       1
#> 7 Aug       1
```

Two months dominate the list: December, 11 of the 29 flags, and February, 8 of them. Together that is 19 of the 29, two out of every three flagged months, all landing on the same two calendar positions. Look at each one closely, with its year and its sign.

```r
# Look at every flagged February and December, with its year and sign
flagged_named %>%
  mutate(Year = year(Month),
         sign = ifelse(remainder > 0, "positive", "negative"),
         remainder = round(remainder, 1)) %>%
  filter(Mon %in% c("Feb", "Dec")) %>%
  arrange(Mon, Year) %>%
  select(Month, Year, remainder, sign)
#> # A tibble: 19 x 4
#>       Month  Year remainder sign
#>       <mth> <dbl>     <dbl> <chr>
#>  1 2011 Feb  2011     -62.9 negative
#>  2 2012 Feb  2012     -39.8 negative
#>  3 2013 Feb  2013     -35.1 negative
#>  4 2014 Feb  2014       -46 negative
#>  5 2015 Feb  2015     -40.8 negative
#>  6 2016 Feb  2016     -40.3 negative
#>  7 2017 Feb  2017     -72.6 negative
#>  8 2018 Feb  2018     -53.8 negative
#>  9 1984 Dec  1984     -35.9 negative
#> 10 1985 Dec  1985     -34.2 negative
#> 11 1988 Dec  1988     -36.1 negative
#> 12 1998 Dec  1998     -34.2 negative
#> 13 2010 Dec  2010      54.9 positive
#> 14 2011 Dec  2011      36.7 positive
#> 15 2013 Dec  2013      41.7 positive
#> 16 2015 Dec  2015        45 positive
#> 17 2016 Dec  2016      51.4 positive
#> 18 2017 Dec  2017      63.9 positive
#> 19 2018 Dec  2018      41.7 positive
```

Every one of the 8 flagged Februaries is negative, and every one of them falls in 2011 or later. February is a short month with fewer trading days than a 30 or 31-day month, so its total turnover runs low even when daily spending has not changed at all. As the whole series grew larger in later decades, that same February shortfall turned into a bigger dollar gap, big enough to clear the 34 threshold from 2011 on.

December tells a two-part story. The 4 flagged Decembers from 1984 to 1998 are all negative: the fixed seasonal shape from `season(window = "periodic")` was set higher than the smaller 1980s and 90s economy actually delivered. The 7 flagged Decembers from 2010 on are all positive: Christmas trading grew to outgrow that same fixed shape. Same calendar month, opposite sign, two different eras.

A flag that recurs at the same calendar position most years, in a direction the calendar itself explains, is a calendar effect. That leaves 10 of the original 29 flags, the ones scattered across September, January, May, June and August, as points still worth a closer look for a genuine, one-off surprise.

=== step === concept
## Structural breaks: a level shift the trend doesn't explain

Calendar effects repeat every year. A structural break is different: a point where the series shifts to a new level and stays there, something the smooth `trend` component was not built to catch in one sharp move.

Compute the mean turnover for each of the 37 years, then the percentage change from one year to the next.

```r
# Year-over-year percent change in the yearly mean turnover
yearly <- cafe %>%
  as_tibble() %>%
  mutate(Year = year(Month)) %>%
  group_by(Year) %>%
  summarise(mean_turnover = round(mean(Turnover), 1), .groups = "drop") %>%
  arrange(Year) %>%
  mutate(pct_change = round((mean_turnover / lag(mean_turnover) - 1) * 100, 1))

yearly
#> # A tibble: 37 x 3
#>     Year mean_turnover pct_change
#>    <dbl>         <dbl>      <dbl>
#>  1  1982          88.9       NA
#>  2  1983          91.3        2.7
#>  3  1984          96.4        5.6
#>  4  1985         103.2        7.1
#>  5  1986         124.4       20.5
#>  6  1987         147.7       18.7
#>  7  1988         160.4        8.6
#>  8  1989         187.3       16.8
#>  9  1990         189.7        1.3
#> 10  1991         183.2       -3.4
#> # i 27 more rows

yearly %>% arrange(desc(pct_change)) %>% head(3)
#> # A tibble: 3 x 3
#>    Year mean_turnover pct_change
#>   <dbl>         <dbl>      <dbl>
#> 1  1999         313.5       26.6
#> 2  1986         124.4       20.5
#> 3  1987         147.7       18.7
```

`lag(mean_turnover)` shifts the column down by one row, so subtracting it from the current row's value and dividing gives each year's change from the year before. Most years land somewhere between roughly 1% and 20%. One year sits well clear of all the others: 1999, up 26.6% on 1998, the single biggest year-over-year jump anywhere in this 37-year series.

A jump that size, that does not repeat and does not fade back, is a structural break: the series moved to a new level around 1999 and stayed there. At this stage in the EDA-for-time-series workflow, the job is to flag that break for whoever builds the model next, not to explain it. Whatever caused it, a chain expanding, a new competitor closing, a change in how the ABS measured the category, is a separate investigation. What matters here is that any model fit across 1999 has to account for that level shift directly, or the jump ends up folded into ordinary trend and season terms that were never built to explain it.

=== step === concept
## Missing runs: finding gaps before you model

The last item on the checklist has nothing to do with unusual values. It is about rows that are not there at all. Here is a second, much smaller tsibble to show it clearly: a shop's daily sales for the first 17 days of January 2024, with 3 days missing because the shop closed for a stocktake.

```r
# 14 days of shop sales out of 17, with a 3-day stocktake gap
library(tsibble)

shop <- tsibble(
  date = as.Date("2024-01-01") + c(0:6, 10:16),
  sales = c(41, 38, 45, 52, 49, 33, 29, 47, 50, 44, 39, 36, 31, 46),
  index = date
)

shop
#> # A tsibble: 14 x 2 [1D]
#>    date       sales
#>    <date>     <dbl>
#>  1 2024-01-01    41
#>  2 2024-01-02    38
#>  3 2024-01-03    45
#>  4 2024-01-04    52
#>  5 2024-01-05    49
#>  6 2024-01-06    33
#>  7 2024-01-07    29
#>  8 2024-01-11    47
#>  9 2024-01-12    50
#> 10 2024-01-13    44
#> 11 2024-01-14    39
#> 12 2024-01-15    36
#> 13 2024-01-16    31
#> 14 2024-01-17    46
```

14 rows, not 17. Nothing in that print shouts "gap" on its own; you would have to notice the date column jumps from January 7 straight to January 11. `scan_gaps()` and `count_gaps()` do that check for you.

```r
# Find the missing dates, then summarise them as one run
scan_gaps(shop)
#> # A tsibble: 3 x 1 [1D]
#>   date
#>   <date>
#> 1 2024-01-08
#> 2 2024-01-09
#> 3 2024-01-10

count_gaps(shop)
#> # A tibble: 1 x 3
#>   .from      .to           .n
#>   <date>     <date>     <int>
#> 1 2024-01-08 2024-01-10     3
```

`scan_gaps()` lists every missing date, one row at a time: January 8, 9 and 10. `count_gaps()` groups a run of consecutive missing dates into a single summary row instead: `.from` and `.to` mark where the run starts and ends, and `.n` counts how many dates fall inside it, 3 in this case, the exact 3-day stocktake closure.

Neither function changes `shop`. If you want the missing dates turned into real rows instead of just reported, `fill_gaps(shop)` does that: it inserts a row for each of the 3 missing dates, with `sales` set to `NA`, taking `shop` from 14 rows to 17. Report first with `scan_gaps()` and `count_gaps()`, repair only if the next step in your workflow actually needs a complete series.

=== step === quiz
## Quick check: outlier, calendar effect, or structural break?

A colleague looks at three flagged points in their own retail series and asks you to sort them. The first is a month that comes in far below its neighbours every single year, always at the same point in the calendar. The second is one year where the yearly mean jumps far more than in any other year, and it never happens again. The third is a flagged month with no repeating pattern before or after it, just one unexplained spike.

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- The first is a calendar effect, the second is a structural break, and the third is a genuine outlier. ::ok Right. A flag that repeats every year at the same calendar position is a calendar effect. A one-off jump in the yearly mean that never repeats is a structural break. A flagged point with no repeating pattern around it is a genuine outlier.
- The first is a genuine outlier, the second is a calendar effect, and the third is a structural break. ::no
- The first is a structural break, the second is a genuine outlier, and the third is a calendar effect. ::no
- The first is a calendar effect, the second is a genuine outlier, and the third is a structural break. ::no The one that repeats every year at the same calendar position is the calendar effect, the same pattern February and December showed. A single jump in the yearly mean that never happens again is the structural break, the same shape 1999 showed. And a flagged point with nothing repeating around it, before or after, is the genuine outlier.

=== step === tryit
## Your turn: find the gap and flag the point

Here is a second small series to practice both rules on: a helpdesk's daily ticket count for the 42 days from March 1 to April 11, 2024, with one day missing.

```r
# Helpdesk tickets, March 1 to April 11, with March 19 missing
library(tsibble)

tickets <- tsibble(
  date = as.Date("2024-03-01") + c(0:17, 19:41),
  count = c(31, 29, 34, 40, 42, 28, 25, 33, 31, 38, 44, 41, 27, 24, 36, 39, 45, 30,
            32, 37, 43, 46, 29, 26, 34, 38, 41, 29, 95, 36, 42, 30, 27, 35, 40, 44,
            28, 25, 33, 37, 39),
  index = date
)

tickets
#> # A tsibble: 41 x 2 [1D]
#>    date       count
#>    <date>     <dbl>
#>  1 2024-03-01    31
#>  2 2024-03-02    29
#>  3 2024-03-03    34
#>  4 2024-03-04    40
#>  5 2024-03-05    42
#>  6 2024-03-06    28
#>  7 2024-03-07    25
#>  8 2024-03-08    33
#>  9 2024-03-09    31
#> 10 2024-03-10    38
#> # i 31 more rows
```

Before your turn starts, here is the remainder column already computed for you, the same way you built it in the outlier step: fill the one missing day with the average of its two neighbours, so STL has a complete series to decompose, then run STL exactly as before.

```r
# Fill the missing day, decompose the series, and read off its remainder sd
library(feasts)

tickets_filled <- fill_gaps(tickets)
gap_row <- which(is.na(tickets_filled$count))
tickets_filled$count[gap_row] <- mean(tickets_filled$count[c(gap_row - 1, gap_row + 1)])

tickets_dcmp <- tickets_filled %>%
  model(STL(count ~ season(window = "periodic"))) %>%
  components() %>%
  as_tibble() %>%
  select(date, count, remainder)

remainder_sd <- sd(tickets_dcmp$remainder)
remainder_sd
#> [1] 9.047743
```

That's a remainder sd of about 9.05. Now it's your turn: find the missing date in `tickets` with `count_gaps()`, and flag the oversized day in `tickets_dcmp` with the same 2 times sd rule you used earlier, `abs(remainder) > 2 * remainder_sd`.

```r
# tickets still holds the original 41-day series, with one date missing.
# tickets_dcmp holds the filled, decomposed version, with a remainder column,
# and remainder_sd already holds its standard deviation.
# 1. Find the missing date with count_gaps(tickets).
# 2. Flag the oversized day: filter(tickets_dcmp, abs(remainder) > 2 * remainder_sd).
# Press Check when you have both.
```
::check {"regex": "(?=[\\s\\S]*count_gaps[(]tickets[)])(?=[\\s\\S]*filter[(][\\s\\S]*abs[(]remainder[)][\\s\\S]*>[\\s\\S]*2)[\\s\\S]*", "gate": true, "difficulty": "intermediate", "ok": "Right: the missing day is March 19, and the only day that clears 2 x 9.05 = 18.1 is March 30, a count of 95 against a remainder of about 38.2.", "no": "Two calls: count_gaps(tickets) to find the missing date, then filter(tickets_dcmp, abs(remainder) > 2 * remainder_sd) to flag the oversized day."}
::solution
```r
# Find the missing date, then flag the oversized day
count_gaps(tickets)
#> # A tibble: 1 x 3
#>   .from      .to           .n
#>   <date>     <date>     <int>
#> 1 2024-03-19 2024-03-19     1

filter(tickets_dcmp, abs(remainder) > 2 * remainder_sd)
#> # A tibble: 1 x 3
#>   date       count remainder
#>   <date>     <dbl>     <dbl>
#> 1 2024-03-30    95      38.2
```

March 19 is the missing day, the same one `count_gaps()` reported earlier. March 30 is the only day whose remainder clears 18.1: a count of 95 tickets against a typical day nearby, well outside anything the rest of the series produced.

=== step === concept
## References

Before you go, here is where the ideas in this lesson come from.

- [Forecasting: Principles and Practice, 3rd edition](https://otexts.com/fpp3/) - Hyndman, R.J. and Athanasopoulos, G. The chapters on time series graphics and STL decomposition behind this lesson's checklist.
- [STL: A Seasonal-Trend Decomposition Procedure Based on Loess](https://www.wessa.net/download/stl.pdf) - Cleveland, R.B., Cleveland, W.S., McRae, J.E. and Terpenning, I. (1990), Journal of Official Statistics 6(1), 3-73. The original STL paper.
- [tsibble package reference](https://tsibble.tidyverts.org/) - has_gaps(), scan_gaps(), count_gaps() and fill_gaps() documentation.
- [Retail Trade, Australia](https://www.abs.gov.au/statistics/industry/retail-and-wholesale-trade/retail-trade-australia) - Australian Bureau of Statistics. The source series behind tsibbledata::aus_retail.

=== step === complete
## Putting the EDA-for-time-series workflow together

Run back through the six-item checklist against what this one series actually showed you. Shape: a 37-year climb with a wave riding on top of it every year. Season-and-year summaries: December is the strongest month every year, averaging $461.4 million, and February the weakest, averaging $363.5 million. Outliers: an STL remainder with a standard deviation of about 17 flagged 29 of the 441 months. Calendar effects: 19 of those 29 flags, 8 Februaries and 11 Decembers, turned out to be the fixed seasonal shape missing a short month or an outgrown Christmas peak, not real surprises. Structural breaks: 1999 stood out as a 26.6% jump in the yearly mean, a level shift to flag for whoever models this series next, not to explain away. Missing runs: `scan_gaps()` and `count_gaps()` found a clean 3-day gap in the shop series, without needing to repair anything.

That order matters. Run the checks in this sequence and each one narrows what the next has to explain: season-and-year summaries account for the regular wave, the outlier rule finds what is left over, calendar effects clear out the repeating half of those flags, structural breaks catch the one-off level shifts, and missing runs catch what was never recorded in the first place. Skip straight to modelling without this pass and you risk fitting a model to a calendar quirk, a level shift, or a gap it was never built to handle.

Next, you will look at the seasonal shape itself more closely, with plots built specifically to compare one year's pattern against another.
