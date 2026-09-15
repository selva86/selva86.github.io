---
title: "Time Series Decomposition Lesson 5: Calendar and population adjustments"
catalog_blurb: "How much of a rising trend is genuine once calendar effects are removed?"
description: "Learn why raw monthly totals mix in month length, trading days and moving holidays, and how population and inflation adjustments reveal real growth underneath."
keywords: "calendar effects time series, trading day adjustment, moving holidays, days_in_month lubridate, per capita adjustment, inflation adjustment CPI, CPI deflation, Easter effect time series, tsibbledata global_economy, seasonal adjustment R"
post_type: "LESSON"
curriculum_id: "5.20.5"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "ts-decomposition"
course_title: "Time Series Decomposition"
course_lesson: "5"
course_total: "6"
course_landing: "Time-Series-Decomposition-Course.html"
course_next: "Time-Series-Features-with-feasts.html"
course_prev: "Box-Cox-and-Variance-Stabilizing-Transforms.html"
---

=== step === cover
## Calendar and population adjustments

Today let's understand why a raw monthly total mixes the calendar, the size of a population and genuine growth together, and how to tell them apart.

Victoria's monthly turnover for cafes, restaurants and takeaway food services is a real series the Australian Bureau of Statistics has tracked every month since April 1982. Over 441 months it climbs from \$81.3 million a month to \$1,066.2 million a month.

Here is the whole series, plotted in the order the months actually happened.

::widget chart-plotter {"data":[{"x":1,"y":85.1},{"x":2,"y":85.1},{"x":3,"y":82.8},{"x":4,"y":82.1},{"x":5,"y":81.8},{"x":6,"y":84.6},{"x":7,"y":91.7},{"x":8,"y":97.7},{"x":9,"y":109.3},{"x":10,"y":94.6},{"x":11,"y":88.2},{"x":12,"y":92.0},{"x":13,"y":85.2},{"x":14,"y":86.8},{"x":15,"y":81.3},{"x":16,"y":85.6},{"x":17,"y":90.5},{"x":18,"y":90.8},{"x":19,"y":92.7},{"x":20,"y":95.8},{"x":21,"y":111.7},{"x":22,"y":92.7},{"x":23,"y":94.4},{"x":24,"y":97.8},{"x":25,"y":92.9},{"x":26,"y":101.0},{"x":27,"y":92.1},{"x":28,"y":92.5},{"x":29,"y":94.4},{"x":30,"y":90.4},{"x":31,"y":95.7},{"x":32,"y":100.6},{"x":33,"y":112.4},{"x":34,"y":96.3},{"x":35,"y":93.9},{"x":36,"y":98.0},{"x":37,"y":98.4},{"x":38,"y":101.8},{"x":39,"y":90.8},{"x":40,"y":98.3},{"x":41,"y":107.0},{"x":42,"y":103.2},{"x":43,"y":111.8},{"x":44,"y":112.3},{"x":45,"y":126.8},{"x":46,"y":113.8},{"x":47,"y":104.4},{"x":48,"y":109.7},{"x":49,"y":110.2},{"x":50,"y":118.0},{"x":51,"y":108.2},{"x":52,"y":123.5},{"x":53,"y":131.7},{"x":54,"y":132.9},{"x":55,"y":142.8},{"x":56,"y":138.3},{"x":57,"y":159.5},{"x":58,"y":138.9},{"x":59,"y":130.9},{"x":60,"y":136.3},{"x":61,"y":142.7},{"x":62,"y":144.2},{"x":63,"y":137.9},{"x":64,"y":149.0},{"x":65,"y":146.4},{"x":66,"y":146.4},{"x":67,"y":157.3},{"x":68,"y":155.3},{"x":69,"y":186.5},{"x":70,"y":143.3},{"x":71,"y":146.7},{"x":72,"y":159.6},{"x":73,"y":158.7},{"x":74,"y":151.7},{"x":75,"y":155.7},{"x":76,"y":154.0},{"x":77,"y":159.9},{"x":78,"y":165.3},{"x":79,"y":167.8},{"x":80,"y":176.4},{"x":81,"y":186.2},{"x":82,"y":167.2},{"x":83,"y":167.9},{"x":84,"y":180.6},{"x":85,"y":179.4},{"x":86,"y":182.9},{"x":87,"y":177.5},{"x":88,"y":183.3},{"x":89,"y":177.4},{"x":90,"y":188.3},{"x":91,"y":203.0},{"x":92,"y":203.6},{"x":93,"y":236.8},{"x":94,"y":198.3},{"x":95,"y":183.5},{"x":96,"y":204.6},{"x":97,"y":183.9},{"x":98,"y":183.5},{"x":99,"y":182.1},{"x":100,"y":193.4},{"x":101,"y":186.7},{"x":102,"y":182.9},{"x":103,"y":185.2},{"x":104,"y":183.1},{"x":105,"y":209.1},{"x":106,"y":187.8},{"x":107,"y":166.9},{"x":108,"y":174.1},{"x":109,"y":169.5},{"x":110,"y":177.7},{"x":111,"y":179.0},{"x":112,"y":179.0},{"x":113,"y":181.2},{"x":114,"y":183.2},{"x":115,"y":183.9},{"x":116,"y":189.0},{"x":117,"y":227.5},{"x":118,"y":192.3},{"x":119,"y":184.5},{"x":120,"y":197.9},{"x":121,"y":195.6},{"x":122,"y":193.9},{"x":123,"y":169.3},{"x":124,"y":177.9},{"x":125,"y":173.4},{"x":126,"y":190.6},{"x":127,"y":192.4},{"x":128,"y":195.4},{"x":129,"y":234.0},{"x":130,"y":207.4},{"x":131,"y":182.1},{"x":132,"y":191.1},{"x":133,"y":189.8},{"x":134,"y":192.1},{"x":135,"y":185.7},{"x":136,"y":200.2},{"x":137,"y":192.4},{"x":138,"y":195.1},{"x":139,"y":192.5},{"x":140,"y":202.3},{"x":141,"y":235.9},{"x":142,"y":194.1},{"x":143,"y":185.3},{"x":144,"y":194.6},{"x":145,"y":181.8},{"x":146,"y":179.9},{"x":147,"y":180.0},{"x":148,"y":194.6},{"x":149,"y":193.7},{"x":150,"y":206.0},{"x":151,"y":225.1},{"x":152,"y":219.9},{"x":153,"y":246.3},{"x":154,"y":222.3},{"x":155,"y":207.2},{"x":156,"y":238.1},{"x":157,"y":229.0},{"x":158,"y":222.4},{"x":159,"y":221.5},{"x":160,"y":225.4},{"x":161,"y":227.4},{"x":162,"y":233.4},{"x":163,"y":230.2},{"x":164,"y":240.4},{"x":165,"y":259.4},{"x":166,"y":239.1},{"x":167,"y":219.0},{"x":168,"y":238.4},{"x":169,"y":236.4},{"x":170,"y":235.6},{"x":171,"y":225.8},{"x":172,"y":229.9},{"x":173,"y":228.8},{"x":174,"y":219.2},{"x":175,"y":225.5},{"x":176,"y":233.3},{"x":177,"y":254.6},{"x":178,"y":242.1},{"x":179,"y":216.1},{"x":180,"y":249.9},{"x":181,"y":250.8},{"x":182,"y":252.7},{"x":183,"y":235.8},{"x":184,"y":237.5},{"x":185,"y":237.8},{"x":186,"y":235.0},{"x":187,"y":243.4},{"x":188,"y":238.5},{"x":189,"y":264.3},{"x":190,"y":241.5},{"x":191,"y":218.0},{"x":192,"y":245.4},{"x":193,"y":235.8},{"x":194,"y":240.2},{"x":195,"y":226.9},{"x":196,"y":248.4},{"x":197,"y":255.5},{"x":198,"y":248.0},{"x":199,"y":268.0},{"x":200,"y":260.5},{"x":201,"y":284.2},{"x":202,"y":267.7},{"x":203,"y":248.6},{"x":204,"y":283.3},{"x":205,"y":285.6},{"x":206,"y":299.1},{"x":207,"y":295.2},{"x":208,"y":321.5},{"x":209,"y":331.3},{"x":210,"y":340.2},{"x":211,"y":345.6},{"x":212,"y":352.3},{"x":213,"y":392.1},{"x":214,"y":331.1},{"x":215,"y":295.7},{"x":216,"y":337.2},{"x":217,"y":283.7},{"x":218,"y":308.9},{"x":219,"y":306.3},{"x":220,"y":301.3},{"x":221,"y":307.6},{"x":222,"y":296.9},{"x":223,"y":326.2},{"x":224,"y":324.8},{"x":225,"y":359.9},{"x":226,"y":336.3},{"x":227,"y":311.7},{"x":228,"y":358.4},{"x":229,"y":367.0},{"x":230,"y":354.4},{"x":231,"y":347.5},{"x":232,"y":371.3},{"x":233,"y":391.5},{"x":234,"y":349.1},{"x":235,"y":361.9},{"x":236,"y":366.2},{"x":237,"y":409.1},{"x":238,"y":385.2},{"x":239,"y":356.0},{"x":240,"y":399.2},{"x":241,"y":372.7},{"x":242,"y":368.8},{"x":243,"y":355.6},{"x":244,"y":414.5},{"x":245,"y":410.0},{"x":246,"y":392.5},{"x":247,"y":377.5},{"x":248,"y":393.1},{"x":249,"y":441.2},{"x":250,"y":446.4},{"x":251,"y":378.4},{"x":252,"y":418.4},{"x":253,"y":406.2},{"x":254,"y":426.2},{"x":255,"y":399.1},{"x":256,"y":449.0},{"x":257,"y":437.6},{"x":258,"y":434.9},{"x":259,"y":479.9},{"x":260,"y":473.8},{"x":261,"y":529.9},{"x":262,"y":478.1},{"x":263,"y":457.0},{"x":264,"y":499.3},{"x":265,"y":471.8},{"x":266,"y":468.5},{"x":267,"y":438.1},{"x":268,"y":468.4},{"x":269,"y":468.4},{"x":270,"y":490.9},{"x":271,"y":473.9},{"x":272,"y":463.0},{"x":273,"y":509.6},{"x":274,"y":432.0},{"x":275,"y":408.1},{"x":276,"y":436.7},{"x":277,"y":439.4},{"x":278,"y":430.9},{"x":279,"y":427.2},{"x":280,"y":451.1},{"x":281,"y":448.6},{"x":282,"y":441.9},{"x":283,"y":474.4},{"x":284,"y":474.2},{"x":285,"y":506.6},{"x":286,"y":468.2},{"x":287,"y":433.3},{"x":288,"y":503.8},{"x":289,"y":501.8},{"x":290,"y":522.5},{"x":291,"y":495.4},{"x":292,"y":507.1},{"x":293,"y":520.6},{"x":294,"y":513.5},{"x":295,"y":504.3},{"x":296,"y":528.6},{"x":297,"y":584.8},{"x":298,"y":523.9},{"x":299,"y":481.2},{"x":300,"y":545.1},{"x":301,"y":531.1},{"x":302,"y":510.3},{"x":303,"y":490.1},{"x":304,"y":497.6},{"x":305,"y":526.4},{"x":306,"y":494.6},{"x":307,"y":540.9},{"x":308,"y":547.9},{"x":309,"y":596.3},{"x":310,"y":539.6},{"x":311,"y":523.1},{"x":312,"y":550.6},{"x":313,"y":541.1},{"x":314,"y":548.6},{"x":315,"y":516.2},{"x":316,"y":541.8},{"x":317,"y":557.8},{"x":318,"y":537.3},{"x":319,"y":591.2},{"x":320,"y":584.0},{"x":321,"y":673.1},{"x":322,"y":647.8},{"x":323,"y":576.0},{"x":324,"y":634.5},{"x":325,"y":622.2},{"x":326,"y":631.6},{"x":327,"y":594.2},{"x":328,"y":613.4},{"x":329,"y":642.4},{"x":330,"y":615.6},{"x":331,"y":636.5},{"x":332,"y":654.1},{"x":333,"y":742.0},{"x":334,"y":657.9},{"x":335,"y":611.4},{"x":336,"y":704.2},{"x":337,"y":697.6},{"x":338,"y":692.0},{"x":339,"y":669.7},{"x":340,"y":724.2},{"x":341,"y":748.9},{"x":342,"y":735.8},{"x":343,"y":705.0},{"x":344,"y":693.9},{"x":345,"y":806.9},{"x":346,"y":649.4},{"x":347,"y":597.8},{"x":348,"y":689.6},{"x":349,"y":707.6},{"x":350,"y":699.1},{"x":351,"y":672.5},{"x":352,"y":694.0},{"x":353,"y":694.7},{"x":354,"y":686.9},{"x":355,"y":682.1},{"x":356,"y":681.5},{"x":357,"y":761.4},{"x":358,"y":638.4},{"x":359,"y":594.5},{"x":360,"y":679.6},{"x":361,"y":632.5},{"x":362,"y":666.8},{"x":363,"y":661.9},{"x":364,"y":676.4},{"x":365,"y":681.5},{"x":366,"y":662.4},{"x":367,"y":684.9},{"x":368,"y":707.0},{"x":369,"y":750.8},{"x":370,"y":655.5},{"x":371,"y":605.2},{"x":372,"y":683.2},{"x":373,"y":682.8},{"x":374,"y":682.0},{"x":375,"y":651.6},{"x":376,"y":656.7},{"x":377,"y":664.9},{"x":378,"y":665.7},{"x":379,"y":686.0},{"x":380,"y":707.5},{"x":381,"y":792.2},{"x":382,"y":721.2},{"x":383,"y":631.6},{"x":384,"y":725.5},{"x":385,"y":722.1},{"x":386,"y":718.8},{"x":387,"y":693.6},{"x":388,"y":753.8},{"x":389,"y":784.4},{"x":390,"y":791.9},{"x":391,"y":789.5},{"x":392,"y":778.2},{"x":393,"y":838.1},{"x":394,"y":786.6},{"x":395,"y":689.1},{"x":396,"y":753.4},{"x":397,"y":737.5},{"x":398,"y":740.3},{"x":399,"y":726.1},{"x":400,"y":780.8},{"x":401,"y":795.0},{"x":402,"y":795.8},{"x":403,"y":811.7},{"x":404,"y":832.6},{"x":405,"y":896.7},{"x":406,"y":790.8},{"x":407,"y":732.4},{"x":408,"y":793.3},{"x":409,"y":805.4},{"x":410,"y":808.9},{"x":411,"y":769.0},{"x":412,"y":828.7},{"x":413,"y":866.3},{"x":414,"y":878.3},{"x":415,"y":886.3},{"x":416,"y":879.5},{"x":417,"y":961.8},{"x":418,"y":861.4},{"x":419,"y":753.6},{"x":420,"y":868.4},{"x":421,"y":859.7},{"x":422,"y":845.2},{"x":423,"y":828.7},{"x":424,"y":857.6},{"x":425,"y":874.1},{"x":426,"y":872.4},{"x":427,"y":917.7},{"x":428,"y":925.7},{"x":429,"y":1008.1},{"x":430,"y":887.3},{"x":431,"y":810.6},{"x":432,"y":909.7},{"x":433,"y":898.6},{"x":434,"y":866.4},{"x":435,"y":873.1},{"x":436,"y":916.1},{"x":437,"y":943.8},{"x":438,"y":933.8},{"x":439,"y":960.0},{"x":440,"y":981.8},{"x":441,"y":1066.2}],"geoms":["line"],"x":"month","y":"turnover"}

Look at that climb for a second. It is not a clean, steady line: it fluctuates up and down within every single year, and near the end that yearly swing is far bigger than the one back in 1982. Some of that climb, and some of that swing, is the calendar and the size of the country talking, not real growth.

=== step === widget
## Same month, different lengths: how many days each month has

Start with the simplest reason a raw monthly total can move: some months are just longer than others. February usually has 28 days. March, right next to it, has 31. That is three extra days for turnover to be recorded on, before any real change in how busy the shop actually is.

Look at Victoria's cafe, restaurant and takeaway turnover for every month of 2018, next to how many days each of those months actually held.

::widget styled-table {"cols":["Month","Turnover","Days"],"rows":[["Jan",887.3,31],["Feb",810.6,28],["Mar",909.7,31],["Apr",898.6,30],["May",866.4,31],["Jun",873.1,30],["Jul",916.1,31],["Aug",943.8,31],["Sep",933.8,30],["Oct",960.0,31],["Nov",981.8,30],["Dec",1066.2,31]],"formats":{"Turnover":"dollar"},"title":"Victoria cafe, restaurant and takeaway turnover, 2018 ($m)","note":"December is the peak month of 2018 and also its longest month. February is the smallest month of 2018 and also its shortest."}

December, at \$1,066.2 million, is both this series' single highest month across the whole 1982 to 2018 history and a 31-day month. February, at \$810.6 million, is 2018's smallest month, and it is also the shortest, 28 days. Some of December's size and some of February's smallness is simply that one of them had three more days to sell things on than the other.

That does not mean day count explains the whole gap between them. But it means a raw total cannot be read on its own: some of the difference between two months is genuine, and some of it is just how many days each month happened to hold.

=== step === concept
## Trading days: the same month length, a different number of weekdays

Month length is not the whole story either. Two months can hold exactly the same number of days and still differ in how many of those days are actually good for trade. Statisticians call these **trading days**: the weekdays, and for many businesses the Saturdays too, the days people are actually out and shopping.

April is always 30 days, every single year. But April 1 does not land on the same weekday every year, so the mix of weekdays and weekend days inside that 30-day block changes from one April to the next.

Compute that mix for two real Aprils, seven years apart, and compare them against Victoria's actual cafe turnover in each.

```r
# Compute days, weekday count and Saturday count for two real Aprils, seven years apart
library(tsibble)
library(tsibbledata)
library(dplyr)
library(lubridate)

cafe <- tsibbledata::aus_retail |>
  filter(State == "Victoria", Industry == "Cafes, restaurants and takeaway food services")

april_days <- function(yr) {
  d <- as.Date(paste0(yr, "-04-01"))
  all_days <- seq(d, by = "day", length.out = as.numeric(days_in_month(d)))
  wd <- wday(all_days, label = TRUE)
  data.frame(
    Year = yr,
    April1 = as.character(wday(d, label = TRUE, abbr = FALSE)),
    Days = as.numeric(days_in_month(d)),
    Weekdays = sum(!wd %in% c("Sat", "Sun")),
    Saturdays = sum(wd == "Sat"),
    Turnover = cafe |> filter(year(Month) == yr, month(Month) == 4) |> pull(Turnover)
  )
}

rbind(april_days(1989), april_days(1992))
#>   Year    April1 Days Weekdays Saturdays Turnover
#> 1 1989  Saturday   30       20         5    179.4
#> 2 1992 Wednesday   30       22         4    195.6
```

April 1989 opened on a Saturday, so that month held 20 weekdays and 5 Saturdays, and turnover came in at \$179.4 million. April 1992 opened on a Wednesday instead, giving that month 22 weekdays but only 4 Saturdays, and turnover was \$195.6 million.

Same 30 days both times. But one April carried an extra weekend day of trade at the expense of a weekday, and the other did not. A business whose sales lean toward the weekend feels that kind of difference more than a business that mostly trades Monday to Friday.

=== step === concept
## Converting a monthly total into a daily average

Once you know a month's length is doing some of the work in its raw total, the fix is direct: divide the total by the number of days in that month. What is left is a daily average, a figure that no longer depends on whether the month happened to have 28, 30 or 31 days.

Try it on the two months right next to each other at the end of this series, November and December 2018.

```r
# Convert November and December 2018 totals into daily averages, and compare the two kinds of change
nov_2018 <- cafe |> filter(Month == yearmonth("2018 Nov")) |> pull(Turnover)
dec_2018 <- cafe |> filter(Month == yearmonth("2018 Dec")) |> pull(Turnover)
nov_days <- as.numeric(days_in_month(as.Date(yearmonth("2018 Nov"))))
dec_days <- as.numeric(days_in_month(as.Date(yearmonth("2018 Dec"))))

nov_per_day <- nov_2018 / nov_days
dec_per_day <- dec_2018 / dec_days
raw_change <- (dec_2018 - nov_2018) / nov_2018 * 100
per_day_change <- (dec_per_day - nov_per_day) / nov_per_day * 100

data.frame(
  month = c("Nov 2018", "Dec 2018"),
  turnover = c(nov_2018, dec_2018),
  days = c(nov_days, dec_days),
  per_day = round(c(nov_per_day, dec_per_day), 2)
)
#>      month turnover days per_day
#> 1 Nov 2018    981.8   30   32.73
#> 2 Dec 2018   1066.2   31   34.39

cat("Raw change:", round(raw_change, 1), "%\n")
cat("Per-day change:", round(per_day_change, 1), "%\n")
#> Raw change: 8.6 %
#> Per-day change: 5.1 %
```

November 2018 has 30 days and turnover of \$981.8 million, a daily average of \$32.73. December has 31 days and \$1,066.2 million, a daily average of \$34.39. Divide, and December's extra day has already been paid for.

Look at the two ways of stating the November to December rise. The raw total rises 8.6%. The per-day figure rises only 5.1%. The gap between those two numbers is exactly the part of December's rise that was just one extra day on the calendar, nothing more.

So the 5.1% that survives the adjustment is the part of December's rise a per-day view still cannot explain away. That is a genuine seasonal effect, most likely the run-up to Christmas, not a trick of the calendar.

=== step === concept
## Moving holidays: a real driver a fixed calendar month cannot capture

Month length and weekday mix are not the only calendar quirks hiding inside a raw total. Some real drivers of a series, a holiday chief among them, do not even stay inside one fixed calendar month from year to year.

Easter is the clearest example. Its date follows a rule tied to the lunar calendar, not a fixed day on the ordinary calendar, so it drifts around by weeks from one year to the next. Statisticians call this kind of holiday a **moving holiday**.

Here are Easter's real dates for nine straight years, and which month each one fell in.

```r
# Easter's real date for nine straight years, and which month each one fell in
easter_dates <- data.frame(
  Year = 2010:2018,
  Easter = as.Date(c("2010-04-04", "2011-04-24", "2012-04-08", "2013-03-31",
                      "2014-04-20", "2015-04-05", "2016-03-27", "2017-04-16", "2018-04-01"))
)
easter_dates$Month <- format(easter_dates$Easter, "%b")

easter_dates
#>   Year     Easter Month
#> 1 2010 2010-04-04   Apr
#> 2 2011 2011-04-24   Apr
#> 3 2012 2012-04-08   Apr
#> 4 2013 2013-03-31   Mar
#> 5 2014 2014-04-20   Apr
#> 6 2015 2015-04-05   Apr
#> 7 2016 2016-03-27   Mar
#> 8 2017 2017-04-16   Apr
#> 9 2018 2018-04-01   Apr
```

Look at the Month column. Easter fell in March twice in this stretch, 2013 and 2016, and in April the other seven years. There is no way to write a fixed "March effect" or "April effect" for a driver that itself does not respect that boundary.

That matters for any business whose trade genuinely moves around Easter. A fixed calendar month cannot hold a driver that is not fixed to a calendar month in the first place.

=== step === concept
## Why you cannot just read the holiday's effect off the bigger month

A natural next guess is to just compare March and April directly. If Easter fell in March, March should come out bigger. If Easter fell in April, April should come out bigger instead. Check whether that actually happens.

Print Victoria's cafe turnover for March and April across the same nine years, next to the month Easter fell in each year.

```r
# March and April turnover for 2010-2018, next to the month Easter fell in each year
library(tidyr)

march_april <- cafe |>
  filter(year(Month) %in% 2010:2018, month(Month) %in% c(3, 4)) |>
  as_tibble() |>
  mutate(Year = year(Month), MonthName = format(as.Date(Month), "%b")) |>
  select(Year, MonthName, Turnover) |>
  pivot_wider(names_from = MonthName, values_from = Turnover) |>
  left_join(easter_dates |> select(Year, EasterMonth = Month), by = "Year")

options(pillar.sigfig = 6)
march_april
#> # A tibble: 9 x 4
#>    Year   Mar   Apr EasterMonth
#>   <dbl> <dbl> <dbl> <chr>
#> 1  2010 704.2 697.6 Apr
#> 2  2011 689.6 707.6 Apr
#> 3  2012 679.6 632.5 Apr
#> 4  2013 683.2 682.8 Mar
#> 5  2014 725.5 722.1 Apr
#> 6  2015 753.4 737.5 Apr
#> 7  2016 793.3 805.4 Mar
#> 8  2017 868.4 859.7 Apr
#> 9  2018 909.7 898.6 Apr
```

Look at 2016. Easter fell in March that year, yet April's turnover, \$805.4 million, was higher than March's, \$793.3 million, the opposite of what "the Easter month gets the bump" would predict. Now look at 2018. Easter fell in April that year, yet March, \$909.7 million, was higher than April, \$898.6 million, the opposite result again.

Both years disagree with the simple guess, and in opposite directions. A single month's raw total carries the trend, the ordinary seasonal pattern and one moving holiday all mixed together, and the holiday is usually the smallest of the three, easy for the other two to swamp.

Official statistical agencies do not try to eyeball a holiday's effect off which raw month is bigger. They build a separate regressor from the holiday's real date each year and estimate its effect directly, alongside the trend and the seasonal pattern, instead of reading it off a comparison the trend and the season can easily overpower.

=== step === quiz
## Quick check: what a calendar adjustment does and does not remove

Put both calendar effects to the test: what a per-day conversion actually fixes, and what a raw month-to-month comparison cannot tell you about a moving holiday.

::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- A per-day conversion removes month length's mechanical effect, but a moving holiday's effect cannot be read off which raw month happens to be bigger. ::ok Right. Turnover divided by days_in_month strips out the extra-day effect, and 2016 and 2018 both showed the bigger raw month disagreeing with where Easter actually fell, in opposite directions each time. Trend and the ordinary seasonal pattern can easily swamp one holiday in a raw monthly total.
- December's per-day total is basically the same as November's, so December is not really any busier once you adjust for the calendar. ::no Not quite. The per-day rise is still 5.1%, a real difference that survives the adjustment. The calendar adjustment only removed the part of the raw 8.6% rise caused by December having one more day than November.
- Two months with the same number of days always have the same number of trading days too. ::no Not always. April 1989 and April 1992 were both 30 days long, yet the first held 20 weekdays and 5 Saturdays and the second held 22 weekdays and 4 Saturdays, because April 1 fell on a different weekday each year.
- April 2016 was higher than March 2016, so Easter's bump must have landed in April that year. ::no Easter actually fell in March in 2016, not April. April was still higher than March that year regardless, which is exactly why you cannot read a moving holiday's effect off which raw month came out bigger: trend and the ordinary seasonal pattern can easily overpower it.

=== step === concept
## Stepping up to the whole country, then dividing out how many people there are

Population is not published for Victoria's cafes alone. It is published for the whole of Australia. So to bring population into this series, first sum the same industry, cafes, restaurants and takeaway food services, across every Australian state and territory, turning Victoria's series into a national one.

Build the national annual total, then join it to Australia's population, and look at 1983 and 2017, the first and last full years both datasets share cleanly.

```r
# Sum turnover for this industry across every state, then to a national annual total
national <- tsibbledata::aus_retail |>
  filter(Industry == "Cafes, restaurants and takeaway food services") |>
  as_tibble() |>
  group_by(Month) |>
  summarise(Turnover = sum(Turnover), .groups = "drop") |>
  mutate(Year = year(Month)) |>
  group_by(Year) |>
  summarise(Turnover = round(sum(Turnover), 1), .groups = "drop")

aus_economy <- tsibbledata::global_economy |>
  filter(Country == "Australia") |>
  as_tibble() |>
  select(Year, Population, CPI)

nat_pop <- national |>
  inner_join(aus_economy, by = "Year") |>
  filter(Year %in% c(1983, 2017)) |>
  mutate(PerCapita = round(Turnover * 1e6 / Population, 2))

nat_pop
#> # A tibble: 2 x 5
#>    Year Turnover Population     CPI PerCapita
#>   <dbl>    <dbl>      <dbl>   <dbl>     <dbl>
#> 1  1983   4439.5   15369000 36.7846    288.86
#> 2  2017  44223.9   24598933 115.687   1797.8

cat("Raw multiple:", round(nat_pop$Turnover[2] / nat_pop$Turnover[1], 2), "\n")
cat("Population multiple:", round(nat_pop$Population[2] / nat_pop$Population[1], 2), "\n")
cat("Per-capita multiple:", round(nat_pop$PerCapita[2] / nat_pop$PerCapita[1], 2), "\n")
#> Raw multiple: 9.96
#> Population multiple: 1.6
#> Per-capita multiple: 6.22
```

National turnover for this industry rose from \$4,439.5 million in 1983 to \$44,223.9 million in 2017, a rise of 9.96 times. Over the same stretch, Australia's population rose from 15,369,000 to 24,598,933, a rise of 1.60 times. Part of that 9.96 times rise is simply that there are more people around to spend money.

Divide turnover by population and you get turnover per person: \$288.86 in 1983, \$1,797.80 in 2017. That is a rise of 6.22 times, smaller than the raw 9.96 times, because dividing out population growth has already removed the part of the rise that was just a bigger country.

=== step === concept
## Dividing out how much a dollar was worth

Population is one confound. Inflation is the other: a dollar in 1983 could buy more than a dollar can buy today, because prices in general have risen since then. The **Consumer Price Index**, CPI, tracks exactly that: the average price level of a basket of goods and services, set so it can be compared across years.

Australia's CPI rose from 36.7846 in 1983 to 115.6868 in 2017, a rise of 3.14 times. Restate the 1983 total in 2017 dollars by multiplying it by that same ratio, 2017's CPI over 1983's, and you get a total in the same money terms as the 2017 figure.

```r
# Restate the 1983 national total in 2017 dollars using the CPI ratio, then compare to the actual 2017 total
cpi_1983 <- nat_pop$CPI[nat_pop$Year == 1983]
cpi_2017 <- nat_pop$CPI[nat_pop$Year == 2017]
turnover_1983 <- nat_pop$Turnover[nat_pop$Year == 1983]
turnover_2017 <- nat_pop$Turnover[nat_pop$Year == 2017]

deflated_1983 <- round(turnover_1983 * (cpi_2017 / cpi_1983), 1)

cat("CPI multiple:", round(cpi_2017 / cpi_1983, 2), "\n")
cat("1983 total in 2017 dollars: $", deflated_1983, "million\n")
cat("2017 actual total: $", turnover_2017, "million\n")
cat("Inflation-adjusted multiple:", round(turnover_2017 / deflated_1983, 2), "\n")
#> CPI multiple: 3.14
#> 1983 total in 2017 dollars: $ 13962.1 million
#> 2017 actual total: $ 44223.9 million
#> Inflation-adjusted multiple: 3.17
```

\$4,439.5 million in 1983 is worth \$13,962.1 million in 2017 dollars, once you account for the 3.14 times general rise in prices. Compare that to what turnover actually was in 2017, \$44,223.9 million, and you get a multiple of 3.17. That is smaller than the raw 9.96 times, but it is still a real rise, once inflation alone is divided out.

=== step === widget
## Layering the adjustments: what is left after removing population and prices

You now have four different multiples for the same 1983 to 2017 stretch, each one dividing out one more confound than the last. Put them side by side.

::widget chart-plotter {"data":[{"x":"Raw","y":9.96},{"x":"Per-capita","y":6.22},{"x":"Inflation-adjusted","y":3.17},{"x":"Real per-capita","y":1.98}],"geoms":["col"],"x":"adjustment","y":"multiple, 1983 to 2017","code":{"col":"adjustments <- data.frame(\n  Adjustment = factor(\n    c(\"Raw\", \"Per-capita\", \"Inflation-adjusted\", \"Real per-capita\"),\n    levels = c(\"Raw\", \"Per-capita\", \"Inflation-adjusted\", \"Real per-capita\")\n  ),\n  Multiple = c(9.96, 6.22, 3.17, 1.98)\n)\n\nggplot(adjustments, aes(Adjustment, Multiple)) +\n  geom_col()"}}

Raw turnover rose 9.96 times. Divide out population growth alone and it is 6.22 times. Divide out inflation alone instead and it is 3.17 times. Divide out both population and inflation together, real turnover per person, and it is 1.98 times: real per-person spending rose from \$908.46 in 1983 to \$1,797.80 in 2017.

Each adjustment strips out exactly one confound, more people or higher prices, without pretending the series did not grow at all. Once both are gone, what is left, 1.98 times, is the real growth in how much each person actually spent, in comparable dollars.

=== step === quiz
## Quick check: reading a layered adjustment

Read the four bars from the last step the way a practitioner would, not as four unrelated numbers.

::quiz {"correct": 1, "gate": true, "difficulty": "advanced"}
- Most of the raw 9.96 times rise in turnover reflects more people and higher prices, but real per-person spending still rose about 1.98 times, genuine growth once both are divided out. ::ok Right. The four multiples answer four different questions, and the smallest of them, 1.98 times, is the one that is left once every confound this lesson covered has been divided out.
- Population only rose 1.60 times, so population adjustment barely matters. ::no Population's own rise is modest, but dividing it out still takes the multiple from 9.96 times down to 6.22 times, a large share of the raw rise.
- The inflation-adjusted multiple and the real per-capita multiple should be the same number. ::no They answer different questions. The inflation-adjusted multiple, 3.17 times, has divided out rising prices but not population growth. The real per-capita multiple, 1.98 times, has divided out both.
- A 1.98 times rise after both adjustments means the 9.96 times figure was wrong. ::no Both figures are correct; they just answer different questions. 9.96 times is the raw rise in dollars actually spent. 1.98 times is what remains once you ask how much more each person is really spending, in real, comparable dollars.

=== step === tryit
## Your turn: check the real per-capita multiple yourself

`nat_pop` still holds Turnover, Population and CPI for 1983 and 2017 from a few steps back. Compute real per-capita turnover yourself: divide Turnover by CPI, multiply by 2017's CPI to restate it in 2017 dollars, then divide by Population. Fill in the blank and check that the ratio lands near 1.98.

```r
# Compute real (inflation- and population-adjusted) per-capita turnover, 1983 vs 2017
cpi_2017 <- nat_pop$CPI[nat_pop$Year == 2017]

nat_pop |>
  mutate(RealPerCapita = round((Turnover / CPI * cpi_2017) / ____ * 1e6, 2)) |>
  select(Year, RealPerCapita)
```
::check {"regex": "CPI[\\s\\S]*/\\s*Population", "gate": true, "difficulty": "intermediate", "ok": "Right: $908.46 in 1983 against $1,797.80 in 2017, a multiple of 1.98, the same figure you already read off the chart two steps back.", "no": "Divide by the one thing not yet in the expression: Population. The full line is (Turnover / CPI * cpi_2017) / Population * 1e6."}
::solution
```r
# Divide by Population to finish the real per-capita computation
cpi_2017 <- nat_pop$CPI[nat_pop$Year == 2017]

nat_pop |>
  mutate(RealPerCapita = round((Turnover / CPI * cpi_2017) / Population * 1e6, 2)) |>
  select(Year, RealPerCapita)
#> # A tibble: 2 x 2
#>    Year RealPerCapita
#>   <dbl>         <dbl>
#> 1  1983        908.46
#> 2  2017       1797.8
```

=== step === concept
## References

- Hyndman, R.J. & Athanasopoulos, G., "Forecasting: Principles and Practice" (3rd ed.), OTexts, section 3.1, "Transformations and adjustments," on calendar, population and inflation adjustments.
- [tsibbledata::global_economy documentation](https://tsibbledata.tidyverts.org/reference/global_economy.html), the population and CPI data joined in this lesson, compiled from World Bank sources.
- [lubridate::day reference](https://lubridate.tidyverse.org/reference/day.html), documenting days_in_month(), used to compute each month's length.
- U.S. Census Bureau, "X-13ARIMA-SEATS Reference Manual," the trading-day and moving-holiday regressors official statistical agencies use instead of comparing raw monthly totals.
- [Retail Trade, Australia](https://www.abs.gov.au/statistics/industry/retail-and-wholesale-trade/retail-trade-australia), Australian Bureau of Statistics, catalogue 8501.0, table 11, the source of the series used throughout this course.

=== step === complete
## Quick recap

A longer month, or a month with more weekdays and weekend days in its particular mix, inflates a raw total before any real seasonality gets a say. Dividing a total by days_in_month turns it into a daily average that no longer depends on the calendar's shape, and whatever change survives that conversion is genuine.

A moving holiday like Easter cannot be pinned to one fixed calendar month, and its effect cannot be read off which raw month happens to be bigger: 2016 and 2018 both disagreed with that guess, in opposite directions. Official agencies build a separate regressor from the holiday's real date instead.

Dividing by population and by CPI each strip out one more confound from a dollar series. Together, on this course's own turnover series, they turned a 9.96 times raw rise into a genuine 1.98 times rise in real, per-person spending.
