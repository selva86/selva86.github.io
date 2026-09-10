---
title: "Time Series Decomposition Lesson 3: Seasonal adjustment with X-13 and STL"
catalog_blurb: "Turn a raw monthly jump into the seasonally adjusted number that actually matters."
description: "See how STL computes a seasonally adjusted number, why it is not the same as a forecast, and why X-13ARIMA-SEATS is the standard agencies publish with."
keywords: "seasonal adjustment, STL decomposition, season_adjust, X-13ARIMA-SEATS, seasonally adjusted vs forecast, Australian Bureau of Statistics, seasonal R package, trading day effects, moving holiday effect, X-11 SEATS"
post_type: "LESSON"
curriculum_id: "5.20.3"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "ts-decomposition"
course_title: "Time Series Decomposition"
course_lesson: "3"
course_total: "6"
course_landing: "Time-Series-Decomposition-Course.html"
course_next: "Box-Cox-and-Variance-Stabilizing-Transforms.html"
course_prev: "STL-Decomposition-in-Practice.html"
---

=== step === cover
## Seasonal adjustment with X-13 and STL

Today let's understand what a seasonally adjusted number actually is, and why the agencies that publish it never let it stand in for a forecast.

Victoria's monthly turnover for cafes, restaurants and takeaway food services is a real series the Australian Bureau of Statistics has tracked every month since April 1982. Over 441 months it climbs from $81.3 million a month to $1,066.2 million a month.

Here is the whole series, plotted in the order the months actually happened.

::widget chart-plotter {"data":[{"x":1,"y":85.1},{"x":2,"y":85.1},{"x":3,"y":82.8},{"x":4,"y":82.1},{"x":5,"y":81.8},{"x":6,"y":84.6},{"x":7,"y":91.7},{"x":8,"y":97.7},{"x":9,"y":109.3},{"x":10,"y":94.6},{"x":11,"y":88.2},{"x":12,"y":92.0},{"x":13,"y":85.2},{"x":14,"y":86.8},{"x":15,"y":81.3},{"x":16,"y":85.6},{"x":17,"y":90.5},{"x":18,"y":90.8},{"x":19,"y":92.7},{"x":20,"y":95.8},{"x":21,"y":111.7},{"x":22,"y":92.7},{"x":23,"y":94.4},{"x":24,"y":97.8},{"x":25,"y":92.9},{"x":26,"y":101.0},{"x":27,"y":92.1},{"x":28,"y":92.5},{"x":29,"y":94.4},{"x":30,"y":90.4},{"x":31,"y":95.7},{"x":32,"y":100.6},{"x":33,"y":112.4},{"x":34,"y":96.3},{"x":35,"y":93.9},{"x":36,"y":98.0},{"x":37,"y":98.4},{"x":38,"y":101.8},{"x":39,"y":90.8},{"x":40,"y":98.3},{"x":41,"y":107.0},{"x":42,"y":103.2},{"x":43,"y":111.8},{"x":44,"y":112.3},{"x":45,"y":126.8},{"x":46,"y":113.8},{"x":47,"y":104.4},{"x":48,"y":109.7},{"x":49,"y":110.2},{"x":50,"y":118.0},{"x":51,"y":108.2},{"x":52,"y":123.5},{"x":53,"y":131.7},{"x":54,"y":132.9},{"x":55,"y":142.8},{"x":56,"y":138.3},{"x":57,"y":159.5},{"x":58,"y":138.9},{"x":59,"y":130.9},{"x":60,"y":136.3},{"x":61,"y":142.7},{"x":62,"y":144.2},{"x":63,"y":137.9},{"x":64,"y":149.0},{"x":65,"y":146.4},{"x":66,"y":146.4},{"x":67,"y":157.3},{"x":68,"y":155.3},{"x":69,"y":186.5},{"x":70,"y":143.3},{"x":71,"y":146.7},{"x":72,"y":159.6},{"x":73,"y":158.7},{"x":74,"y":151.7},{"x":75,"y":155.7},{"x":76,"y":154.0},{"x":77,"y":159.9},{"x":78,"y":165.3},{"x":79,"y":167.8},{"x":80,"y":176.4},{"x":81,"y":186.2},{"x":82,"y":167.2},{"x":83,"y":167.9},{"x":84,"y":180.6},{"x":85,"y":179.4},{"x":86,"y":182.9},{"x":87,"y":177.5},{"x":88,"y":183.3},{"x":89,"y":177.4},{"x":90,"y":188.3},{"x":91,"y":203.0},{"x":92,"y":203.6},{"x":93,"y":236.8},{"x":94,"y":198.3},{"x":95,"y":183.5},{"x":96,"y":204.6},{"x":97,"y":183.9},{"x":98,"y":183.5},{"x":99,"y":182.1},{"x":100,"y":193.4},{"x":101,"y":186.7},{"x":102,"y":182.9},{"x":103,"y":185.2},{"x":104,"y":183.1},{"x":105,"y":209.1},{"x":106,"y":187.8},{"x":107,"y":166.9},{"x":108,"y":174.1},{"x":109,"y":169.5},{"x":110,"y":177.7},{"x":111,"y":179.0},{"x":112,"y":179.0},{"x":113,"y":181.2},{"x":114,"y":183.2},{"x":115,"y":183.9},{"x":116,"y":189.0},{"x":117,"y":227.5},{"x":118,"y":192.3},{"x":119,"y":184.5},{"x":120,"y":197.9},{"x":121,"y":195.6},{"x":122,"y":193.9},{"x":123,"y":169.3},{"x":124,"y":177.9},{"x":125,"y":173.4},{"x":126,"y":190.6},{"x":127,"y":192.4},{"x":128,"y":195.4},{"x":129,"y":234.0},{"x":130,"y":207.4},{"x":131,"y":182.1},{"x":132,"y":191.1},{"x":133,"y":189.8},{"x":134,"y":192.1},{"x":135,"y":185.7},{"x":136,"y":200.2},{"x":137,"y":192.4},{"x":138,"y":195.1},{"x":139,"y":192.5},{"x":140,"y":202.3},{"x":141,"y":235.9},{"x":142,"y":194.1},{"x":143,"y":185.3},{"x":144,"y":194.6},{"x":145,"y":181.8},{"x":146,"y":179.9},{"x":147,"y":180.0},{"x":148,"y":194.6},{"x":149,"y":193.7},{"x":150,"y":206.0},{"x":151,"y":225.1},{"x":152,"y":219.9},{"x":153,"y":246.3},{"x":154,"y":222.3},{"x":155,"y":207.2},{"x":156,"y":238.1},{"x":157,"y":229.0},{"x":158,"y":222.4},{"x":159,"y":221.5},{"x":160,"y":225.4},{"x":161,"y":227.4},{"x":162,"y":233.4},{"x":163,"y":230.2},{"x":164,"y":240.4},{"x":165,"y":259.4},{"x":166,"y":239.1},{"x":167,"y":219.0},{"x":168,"y":238.4},{"x":169,"y":236.4},{"x":170,"y":235.6},{"x":171,"y":225.8},{"x":172,"y":229.9},{"x":173,"y":228.8},{"x":174,"y":219.2},{"x":175,"y":225.5},{"x":176,"y":233.3},{"x":177,"y":254.6},{"x":178,"y":242.1},{"x":179,"y":216.1},{"x":180,"y":249.9},{"x":181,"y":250.8},{"x":182,"y":252.7},{"x":183,"y":235.8},{"x":184,"y":237.5},{"x":185,"y":237.8},{"x":186,"y":235.0},{"x":187,"y":243.4},{"x":188,"y":238.5},{"x":189,"y":264.3},{"x":190,"y":241.5},{"x":191,"y":218.0},{"x":192,"y":245.4},{"x":193,"y":235.8},{"x":194,"y":240.2},{"x":195,"y":226.9},{"x":196,"y":248.4},{"x":197,"y":255.5},{"x":198,"y":248.0},{"x":199,"y":268.0},{"x":200,"y":260.5},{"x":201,"y":284.2},{"x":202,"y":267.7},{"x":203,"y":248.6},{"x":204,"y":283.3},{"x":205,"y":285.6},{"x":206,"y":299.1},{"x":207,"y":295.2},{"x":208,"y":321.5},{"x":209,"y":331.3},{"x":210,"y":340.2},{"x":211,"y":345.6},{"x":212,"y":352.3},{"x":213,"y":392.1},{"x":214,"y":331.1},{"x":215,"y":295.7},{"x":216,"y":337.2},{"x":217,"y":283.7},{"x":218,"y":308.9},{"x":219,"y":306.3},{"x":220,"y":301.3},{"x":221,"y":307.6},{"x":222,"y":296.9},{"x":223,"y":326.2},{"x":224,"y":324.8},{"x":225,"y":359.9},{"x":226,"y":336.3},{"x":227,"y":311.7},{"x":228,"y":358.4},{"x":229,"y":367.0},{"x":230,"y":354.4},{"x":231,"y":347.5},{"x":232,"y":371.3},{"x":233,"y":391.5},{"x":234,"y":349.1},{"x":235,"y":361.9},{"x":236,"y":366.2},{"x":237,"y":409.1},{"x":238,"y":385.2},{"x":239,"y":356.0},{"x":240,"y":399.2},{"x":241,"y":372.7},{"x":242,"y":368.8},{"x":243,"y":355.6},{"x":244,"y":414.5},{"x":245,"y":410.0},{"x":246,"y":392.5},{"x":247,"y":377.5},{"x":248,"y":393.1},{"x":249,"y":441.2},{"x":250,"y":446.4},{"x":251,"y":378.4},{"x":252,"y":418.4},{"x":253,"y":406.2},{"x":254,"y":426.2},{"x":255,"y":399.1},{"x":256,"y":449.0},{"x":257,"y":437.6},{"x":258,"y":434.9},{"x":259,"y":479.9},{"x":260,"y":473.8},{"x":261,"y":529.9},{"x":262,"y":478.1},{"x":263,"y":457.0},{"x":264,"y":499.3},{"x":265,"y":471.8},{"x":266,"y":468.5},{"x":267,"y":438.1},{"x":268,"y":468.4},{"x":269,"y":468.4},{"x":270,"y":490.9},{"x":271,"y":473.9},{"x":272,"y":463.0},{"x":273,"y":509.6},{"x":274,"y":432.0},{"x":275,"y":408.1},{"x":276,"y":436.7},{"x":277,"y":439.4},{"x":278,"y":430.9},{"x":279,"y":427.2},{"x":280,"y":451.1},{"x":281,"y":448.6},{"x":282,"y":441.9},{"x":283,"y":474.4},{"x":284,"y":474.2},{"x":285,"y":506.6},{"x":286,"y":468.2},{"x":287,"y":433.3},{"x":288,"y":503.8},{"x":289,"y":501.8},{"x":290,"y":522.5},{"x":291,"y":495.4},{"x":292,"y":507.1},{"x":293,"y":520.6},{"x":294,"y":513.5},{"x":295,"y":504.3},{"x":296,"y":528.6},{"x":297,"y":584.8},{"x":298,"y":523.9},{"x":299,"y":481.2},{"x":300,"y":545.1},{"x":301,"y":531.1},{"x":302,"y":510.3},{"x":303,"y":490.1},{"x":304,"y":497.6},{"x":305,"y":526.4},{"x":306,"y":494.6},{"x":307,"y":540.9},{"x":308,"y":547.9},{"x":309,"y":596.3},{"x":310,"y":539.6},{"x":311,"y":523.1},{"x":312,"y":550.6},{"x":313,"y":541.1},{"x":314,"y":548.6},{"x":315,"y":516.2},{"x":316,"y":541.8},{"x":317,"y":557.8},{"x":318,"y":537.3},{"x":319,"y":591.2},{"x":320,"y":584.0},{"x":321,"y":673.1},{"x":322,"y":647.8},{"x":323,"y":576.0},{"x":324,"y":634.5},{"x":325,"y":622.2},{"x":326,"y":631.6},{"x":327,"y":594.2},{"x":328,"y":613.4},{"x":329,"y":642.4},{"x":330,"y":615.6},{"x":331,"y":636.5},{"x":332,"y":654.1},{"x":333,"y":742.0},{"x":334,"y":657.9},{"x":335,"y":611.4},{"x":336,"y":704.2},{"x":337,"y":697.6},{"x":338,"y":692.0},{"x":339,"y":669.7},{"x":340,"y":724.2},{"x":341,"y":748.9},{"x":342,"y":735.8},{"x":343,"y":705.0},{"x":344,"y":693.9},{"x":345,"y":806.9},{"x":346,"y":649.4},{"x":347,"y":597.8},{"x":348,"y":689.6},{"x":349,"y":707.6},{"x":350,"y":699.1},{"x":351,"y":672.5},{"x":352,"y":694.0},{"x":353,"y":694.7},{"x":354,"y":686.9},{"x":355,"y":682.1},{"x":356,"y":681.5},{"x":357,"y":761.4},{"x":358,"y":638.4},{"x":359,"y":594.5},{"x":360,"y":679.6},{"x":361,"y":632.5},{"x":362,"y":666.8},{"x":363,"y":661.9},{"x":364,"y":676.4},{"x":365,"y":681.5},{"x":366,"y":662.4},{"x":367,"y":684.9},{"x":368,"y":707.0},{"x":369,"y":750.8},{"x":370,"y":655.5},{"x":371,"y":605.2},{"x":372,"y":683.2},{"x":373,"y":682.8},{"x":374,"y":682.0},{"x":375,"y":651.6},{"x":376,"y":656.7},{"x":377,"y":664.9},{"x":378,"y":665.7},{"x":379,"y":686.0},{"x":380,"y":707.5},{"x":381,"y":792.2},{"x":382,"y":721.2},{"x":383,"y":631.6},{"x":384,"y":725.5},{"x":385,"y":722.1},{"x":386,"y":718.8},{"x":387,"y":693.6},{"x":388,"y":753.8},{"x":389,"y":784.4},{"x":390,"y":791.9},{"x":391,"y":789.5},{"x":392,"y":778.2},{"x":393,"y":838.1},{"x":394,"y":786.6},{"x":395,"y":689.1},{"x":396,"y":753.4},{"x":397,"y":737.5},{"x":398,"y":740.3},{"x":399,"y":726.1},{"x":400,"y":780.8},{"x":401,"y":795.0},{"x":402,"y":795.8},{"x":403,"y":811.7},{"x":404,"y":832.6},{"x":405,"y":896.7},{"x":406,"y":790.8},{"x":407,"y":732.4},{"x":408,"y":793.3},{"x":409,"y":805.4},{"x":410,"y":808.9},{"x":411,"y":769.0},{"x":412,"y":828.7},{"x":413,"y":866.3},{"x":414,"y":878.3},{"x":415,"y":886.3},{"x":416,"y":879.5},{"x":417,"y":961.8},{"x":418,"y":861.4},{"x":419,"y":753.6},{"x":420,"y":868.4},{"x":421,"y":859.7},{"x":422,"y":845.2},{"x":423,"y":828.7},{"x":424,"y":857.6},{"x":425,"y":874.1},{"x":426,"y":872.4},{"x":427,"y":917.7},{"x":428,"y":925.7},{"x":429,"y":1008.1},{"x":430,"y":887.3},{"x":431,"y":810.6},{"x":432,"y":909.7},{"x":433,"y":898.6},{"x":434,"y":866.4},{"x":435,"y":873.1},{"x":436,"y":916.1},{"x":437,"y":943.8},{"x":438,"y":933.8},{"x":439,"y":960.0},{"x":440,"y":981.8},{"x":441,"y":1066.2}],"geoms":["line"],"x":"month","y":"turnover"}

Look at the very end of that line. November 2018 closes at $981.8 million, and December 2018 jumps to $1,066.2 million, a rise of 8.6 percent in a single month. Is that real growth, or the same jump every December brings once people start spending for Christmas?

=== step === concept
## What season_adjust means, and how STL produces it

STL splits a series into three parts that add back up to the original number: a **trend**, the slow-moving level; a **season_year**, the part of the pattern that repeats every twelve months, tied to the calendar rather than to the economy; and a **remainder**, whatever is left over once both of those are taken out.

Fit STL on the Victoria cafe series, then look at the last three months of 2018.

```r
# Build the Victoria cafe series, fit STL, and read October to December 2018
library(tsibble)
library(tsibbledata)
library(dplyr)
library(feasts)
library(fabletools)

cafe <- tsibbledata::aus_retail |>
  filter(State == "Victoria", Industry == "Cafes, restaurants and takeaway food services")

fit <- cafe |>
  model(STL(Turnover ~ trend(window = 21) + season(window = 11), robust = TRUE))

comp <- components(fit)

result <- comp |>
  filter(Month >= yearmonth("2018 Oct"), Month <= yearmonth("2018 Dec")) |>
  as_tibble() |>
  transmute(Month = as.character(Month),
            Turnover = round(Turnover, 1),
            season_year = round(season_year, 1),
            season_adjust = round(season_adjust, 1))

print(as.data.frame(result), row.names = FALSE)
#>     Month Turnover season_year season_adjust
#>  2018 Oct    960.0        11.9         948.1
#>  2018 Nov    981.8        28.5         953.3
#>  2018 Dec   1066.2        93.9         972.3
```

**season_adjust** is Turnover with the season_year part taken out, nothing more. It is computed as `Turnover - season_year`. Since Turnover is the sum of all three parts, season_adjust is really trend plus remainder: everything except the calendar effect.

Look at December. Turnover that month is 1066.2, and season_year is 93.9, so season_adjust comes out at 1066.2 minus 93.9, which is 972.3. That 93.9 is STL's estimate of how much of a typical December's turnover is just "it's December", built from every December in the 37 years of data. Take it out, and what is left, 972.3, is the number this lesson is really about.

=== step === concept
## Reading November to December two ways: raw and adjusted

You already have what you need to answer whether that December jump was real growth or just Christmas. Raw Turnover rose 8.6 percent from November 2018 to December 2018. Does season_adjust rise by anything close to that?

```r
# Compare the raw and seasonally adjusted change from November to December 2018
nov <- comp |> filter(Month == yearmonth("2018 Nov")) |> as_tibble()
dec <- comp |> filter(Month == yearmonth("2018 Dec")) |> as_tibble()

raw_change <- (dec$Turnover - nov$Turnover) / nov$Turnover * 100
adjusted_change <- (dec$season_adjust - nov$season_adjust) / nov$season_adjust * 100

cat(sprintf("Raw change: %.1f%%\n", raw_change))
cat(sprintf("Seasonally adjusted change: %.1f%%\n", adjusted_change))
#> Raw change: 8.6%
#> Seasonally adjusted change: 2.0%
```

Not close at all. Raw Turnover rose 8.6 percent, but season_adjust rose only 2.0 percent, from 953.3 to 972.3. The missing 6.6 points sit entirely inside season_year, which jumped from 28.5 in November to 93.9 in December: that jump is the predictable Christmas effect, and it is the same jump you would expect to see every year regardless of how the business is actually doing.

So the two numbers are answering two different questions. The raw 8.6 percent answers "how much higher was December than November". The seasonally adjusted 2.0 percent answers "how much of that was because the business actually grew, once you take the fact that it's December out of it". If you want to know whether Victoria's cafes and restaurants are doing better this year, the seasonally adjusted number is the one that answers that, not the raw one.

=== step === concept
## Who publishes seasonally adjusted numbers, and why

season_adjust is not a one-off trick. It is what every national statistics agency computes, every month, for the headline economic series it publishes.

- The Australian Bureau of Statistics (the ABS), the source of the Victoria series used throughout this lesson
- The US Census Bureau and the Bureau of Labor Statistics
- Eurostat, for the European Union
- The UK's Office for National Statistics (the ONS)

Each of these agencies publishes most of its economic series in three columns, side by side, every month: **Original** (the raw counted figures), **Seasonally Adjusted**, and **Trend** (the seasonally adjusted series smoothed further still).

A headline number, a retail sales figure or an unemployment rate, almost always quotes the Seasonally Adjusted column. That's because the raw month-to-month move is usually dominated by which calendar month it happens to be, exactly like the December jump you just measured, rather than by anything that actually changed in the economy.

=== step === widget
## A statistics agency's own report table

Format the same three months, October to December 2018, the way an agency's monthly release actually presents them.

```r
# Format the same three months the way a statistics agency would publish them
report <- comp |>
  filter(Month >= yearmonth("2018 Oct"), Month <= yearmonth("2018 Dec")) |>
  as_tibble() |>
  transmute(Month = as.character(Month),
            Original = round(Turnover, 1),
            `Seasonally Adjusted` = round(season_adjust, 1))

print(as.data.frame(report), row.names = FALSE)
#>     Month Original Seasonally Adjusted
#>  2018 Oct    960.0               948.1
#>  2018 Nov    981.8               953.3
#>  2018 Dec   1066.2               972.3
```

::widget styled-table {"cols":["Month","Original ($m)","Seasonally Adjusted ($m)"],"rows":[["2018 Oct",960.0,948.1],["2018 Nov",981.8,953.3],["2018 Dec",1066.2,972.3]],"formats":{"Original ($m)":"1dp","Seasonally Adjusted ($m)":"1dp"},"title":"How the ABS reports one series two ways","note":"Australian Bureau of Statistics, catalogue 8501.0, table 11."}

Toggle to "Report table" and this is exactly the shape a release from the ABS takes: the raw number the public tends to notice, and right beside it, the number the agency actually wants you to read.

=== step === widget
## Seeing the raw and adjusted lines together

Plot the last 36 months, January 2016 to December 2018, as two lines: Original and Seasonally Adjusted.

::widget chart-plotter {"data":[{"x":1,"y":790.8,"fill":"Original"},{"x":2,"y":732.4,"fill":"Original"},{"x":3,"y":793.3,"fill":"Original"},{"x":4,"y":805.4,"fill":"Original"},{"x":5,"y":808.9,"fill":"Original"},{"x":6,"y":769.0,"fill":"Original"},{"x":7,"y":828.7,"fill":"Original"},{"x":8,"y":866.3,"fill":"Original"},{"x":9,"y":878.3,"fill":"Original"},{"x":10,"y":886.3,"fill":"Original"},{"x":11,"y":879.5,"fill":"Original"},{"x":12,"y":961.8,"fill":"Original"},{"x":13,"y":861.4,"fill":"Original"},{"x":14,"y":753.6,"fill":"Original"},{"x":15,"y":868.4,"fill":"Original"},{"x":16,"y":859.7,"fill":"Original"},{"x":17,"y":845.2,"fill":"Original"},{"x":18,"y":828.7,"fill":"Original"},{"x":19,"y":857.6,"fill":"Original"},{"x":20,"y":874.1,"fill":"Original"},{"x":21,"y":872.4,"fill":"Original"},{"x":22,"y":917.7,"fill":"Original"},{"x":23,"y":925.7,"fill":"Original"},{"x":24,"y":1008.1,"fill":"Original"},{"x":25,"y":887.3,"fill":"Original"},{"x":26,"y":810.6,"fill":"Original"},{"x":27,"y":909.7,"fill":"Original"},{"x":28,"y":898.6,"fill":"Original"},{"x":29,"y":866.4,"fill":"Original"},{"x":30,"y":873.1,"fill":"Original"},{"x":31,"y":916.1,"fill":"Original"},{"x":32,"y":943.8,"fill":"Original"},{"x":33,"y":933.8,"fill":"Original"},{"x":34,"y":960.0,"fill":"Original"},{"x":35,"y":981.8,"fill":"Original"},{"x":36,"y":1066.2,"fill":"Original"},{"x":1,"y":803.0,"fill":"Seasonally Adjusted"},{"x":2,"y":809.3,"fill":"Seasonally Adjusted"},{"x":3,"y":788.1,"fill":"Seasonally Adjusted"},{"x":4,"y":806.2,"fill":"Seasonally Adjusted"},{"x":5,"y":813.8,"fill":"Seasonally Adjusted"},{"x":6,"y":802.3,"fill":"Seasonally Adjusted"},{"x":7,"y":833.4,"fill":"Seasonally Adjusted"},{"x":8,"y":859.2,"fill":"Seasonally Adjusted"},{"x":9,"y":887.2,"fill":"Seasonally Adjusted"},{"x":10,"y":875.3,"fill":"Seasonally Adjusted"},{"x":11,"y":852.3,"fill":"Seasonally Adjusted"},{"x":12,"y":869.2,"fill":"Seasonally Adjusted"},{"x":13,"y":873.2,"fill":"Seasonally Adjusted"},{"x":14,"y":830.8,"fill":"Seasonally Adjusted"},{"x":15,"y":863.4,"fill":"Seasonally Adjusted"},{"x":16,"y":861.2,"fill":"Seasonally Adjusted"},{"x":17,"y":850.7,"fill":"Seasonally Adjusted"},{"x":18,"y":862.9,"fill":"Seasonally Adjusted"},{"x":19,"y":862.7,"fill":"Seasonally Adjusted"},{"x":20,"y":867.0,"fill":"Seasonally Adjusted"},{"x":21,"y":880.9,"fill":"Seasonally Adjusted"},{"x":22,"y":906.3,"fill":"Seasonally Adjusted"},{"x":23,"y":897.8,"fill":"Seasonally Adjusted"},{"x":24,"y":914.8,"fill":"Seasonally Adjusted"},{"x":25,"y":898.8,"fill":"Seasonally Adjusted"},{"x":26,"y":887.9,"fill":"Seasonally Adjusted"},{"x":27,"y":904.8,"fill":"Seasonally Adjusted"},{"x":28,"y":900.7,"fill":"Seasonally Adjusted"},{"x":29,"y":872.4,"fill":"Seasonally Adjusted"},{"x":30,"y":908.1,"fill":"Seasonally Adjusted"},{"x":31,"y":921.5,"fill":"Seasonally Adjusted"},{"x":32,"y":936.7,"fill":"Seasonally Adjusted"},{"x":33,"y":941.9,"fill":"Seasonally Adjusted"},{"x":34,"y":948.1,"fill":"Seasonally Adjusted"},{"x":35,"y":953.3,"fill":"Seasonally Adjusted"},{"x":36,"y":972.3,"fill":"Seasonally Adjusted"}],"geoms":["line"],"x":"month","y":"value","code":{"line":"ggplot(monthly36, aes(month, value, color = group)) +\n  geom_line()"}}

Original spikes every December and dips every January and February, three times over in this 36-month window, once for 2016, once for 2017, once for 2018. Seasonally Adjusted climbs through the same 36 months without any of those regular spikes: it still bends where the business actually slowed down or picked up, but the part that was always going to happen in December is gone.

=== step === quiz
## Quick check: what season_adjust removes

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- It removes the random month-to-month noise, so what is left behind is a perfectly smooth line. ::no
- It removes the season_year component, the repeating calendar-driven pattern, and keeps trend and remainder. ::ok Right. season_adjust is Turnover minus season_year, nothing more. Trend and remainder both stay inside it, which is exactly why season_adjust still moves: December 2018's season_adjust, 972.3, is the highest value in the whole 441-month series, not a flattened-out number.
- It smooths the series so every month reads about the same, a flat line with the seasonal bumps sanded off. ::no
- It removes both season_year and the remainder, leaving only trend behind. ::no season_adjust only removes season_year, the repeating calendar effect. Trend and remainder both stay inside it: that's exactly why season_adjust still climbs to a new high in December 2018 (972.3) instead of flattening out, and why the random month-to-month noise, the remainder, is still in there too.

=== step === concept
## Why a seasonally adjusted figure is not a forecast

Here's a question worth asking directly: does season_adjust tell you anything about January 2019?

No, and the reason is worth seeing for yourself rather than taking on faith.

```r
# Check whether the fitted STL has anything to say about a month it never saw
cat(sprintf("Last month in the fitted data: %s\n", format(max(comp$Month))))

comp |>
  filter(Month == yearmonth("2019 Jan")) |>
  nrow()
#> Last month in the fitted data: 2018 Dec
#> [1] 0
```

`comp` has no row for January 2019, or for any month after December 2018. STL only ever re-expresses months it has already seen: December 2018's season_adjust, 972.3, takes the already-known Turnover for that month, 1066.2, and estimates how much of it was the calendar's doing, using every December already in the 37 years of history. It never runs forward.

A **forecast** does the opposite job. It predicts an unknown future month, using a model like ETS or ARIMA fit on the whole history, and it has to guess, because the actual Turnover for that month does not exist yet. Adjustment answers "how much did this month really move, once you take the calendar out of it". Forecasting answers "what will next month probably be". They are different questions, and when you do build a forecasting model, it is normally fit on the seasonally adjusted series or one that models the season explicitly, never swapped in as a stand-in for seasonal adjustment itself.

=== step === concept
## X-13ARIMA-SEATS: the standard behind the official numbers

::prose-only defines X-13ARIMA-SEATS, X-11 and SEATS, and the calendar effects they model, so the next step's R call makes sense on sight

STL is not what the ABS, the US Census Bureau or Eurostat actually run to produce the official Seasonally Adjusted column you see in a release. They run **X-13ARIMA-SEATS**, a program the US Census Bureau maintains, and the standard most national statistics agencies have settled on.

The name packages two separate methods, and an agency picks which one runs underneath:

- **X-11**, the Census Bureau's own filtering method, in production use since the 1960s
- **SEATS**, short for Signal Extraction in ARIMA Time Series, developed at the Bank of Spain

Before either method runs, X-13ARIMA-SEATS does one thing STL never does: it fits a regression with ARIMA errors to model **calendar effects** directly. Two matter most. One is **trading-day counts**: a 31-day January skews a raw retail total against a 28-day February even if nothing about demand changed. The other is **moving holidays** like Easter, which falls in March some years and April in others, shifting a chunk of spending from one month to the next depending on the year.

STL's season_year has no such model attached to it. It only conditions on which calendar month a value falls in, April is always April, so a moving Easter's effect does not get modeled out. It lands in STL's remainder instead, mixed in with everything else STL could not explain.

=== step === concept
## X-13ARIMA-SEATS in R, shown but not run here

The `seasonal` package wraps the Census Bureau's X-13 program for R. Fit it on the same Victoria series and pull the seasonally adjusted values back out with `final()`, the same idea as season_adjust, produced by different machinery underneath.

```r-static
# Fit X-13ARIMA-SEATS on the same series and read off the seasonally adjusted values
library(seasonal)

fit_x13 <- seas(ts(cafe$Turnover, start = c(1982, 4), frequency = 12))
adjusted <- final(fit_x13)

tail(adjusted, 3)
```

`seas()` needs the X-13 binary installed on the machine that runs it, so this is code to run locally, not something this page runs for you. `install.packages("seasonal")` gets you the R package; the package itself tells you how to get the binary the first time you call `seas()`.

=== step === quiz
## Quick check: adjustment, forecasting and X-13

An agency's monthly release notes that today's seasonally adjusted figure used X-13ARIMA-SEATS, not a forecast. What does that actually mean?

::quiz {"correct": 1, "gate": true, "difficulty": "advanced"}
- The published figure re-expresses this month's already-collected turnover with its calendar effect removed, and it says nothing about next month. ::ok Exactly right. X-13ARIMA-SEATS is an adjustment method, not a forecasting one: it takes a month that already happened and estimates how much of it was the calendar's doing, the same job season_adjust did in this lesson, just with a calendar-effects regression added on top.
- The agency ran a forecasting model to predict this month's figure before the data arrived. ::no
- X-13ARIMA-SEATS is just another name for STL. ::no
- Seasonally adjusted figures always equal the trend component alone. ::no Seasonal adjustment, by either method, only removes the calendar-driven part of a series; it never predicts an unseen month, and X-13ARIMA-SEATS is not STL under another name, it fits its own calendar-effects regression that STL has no equivalent for. Nor does a seasonally adjusted figure collapse to trend alone: December 2018's season_adjust, 972.3, still differs from its trend, 958.3, because remainder stays inside it too.

=== step === tryit
## Your turn: adjust a second month and compare

`comp` still holds the fitted STL components for the whole series. Pull November and December 2017, the year before the one you have been working with, and confirm the same pattern holds: a smaller rise once you adjust for the season.

```r
# Compare the raw and seasonally adjusted change from November to December 2017
nov17 <- comp |> filter(Month == yearmonth("2017 Nov")) |> as_tibble()
dec17 <- comp |> filter(Month == yearmonth("2017 Dec")) |> as_tibble()

raw_change_17 <- (dec17$Turnover - nov17$Turnover) / nov17$Turnover * 100
adjusted_change_17 <- ____

cat(sprintf("Raw change: %.1f%%\n", raw_change_17))
cat(sprintf("Seasonally adjusted change: %.1f%%\n", adjusted_change_17))
```
::check {"regex": "dec17\\$season_adjust[\\s\\S]*nov17\\$season_adjust[\\s\\S]*100", "gate": true, "difficulty": "intermediate", "ok": "Right: the raw change is 8.9%, but the seasonally adjusted change is only 1.9%, the same pattern from November to December 2018. December's season_year is always going to be far above November's, so a chunk of every year's November-to-December rise is the calendar, not real growth.", "no": "Reuse the same computation from two steps back, swapping in the 2017 objects: (dec17$season_adjust - nov17$season_adjust) / nov17$season_adjust * 100."}
::solution
```r
# November to December 2017: raw change versus seasonally adjusted change
nov17 <- comp |> filter(Month == yearmonth("2017 Nov")) |> as_tibble()
dec17 <- comp |> filter(Month == yearmonth("2017 Dec")) |> as_tibble()

raw_change_17 <- (dec17$Turnover - nov17$Turnover) / nov17$Turnover * 100
adjusted_change_17 <- (dec17$season_adjust - nov17$season_adjust) / nov17$season_adjust * 100

cat(sprintf("Raw change: %.1f%%\n", raw_change_17))
cat(sprintf("Seasonally adjusted change: %.1f%%\n", adjusted_change_17))
#> Raw change: 8.9%
#> Seasonally adjusted change: 1.9%
```

=== step === concept
## References

- Cleveland, R.B., Cleveland, W.S., McRae, J.E. & Terpenning, I. (1990), "STL: A Seasonal-Trend Decomposition Procedure Based on Loess," Journal of Official Statistics, 6(1), the method behind season_adjust in this lesson.
- [X-13ARIMA-SEATS](https://www.census.gov/data/software/x13as.html), US Census Bureau, census.gov, the official documentation for the program covered in this lesson.
- Gomez, V. & Maravall, A., "Seasonal Adjustment and Signal Extraction in Economic Time Series," Banco de Espana, the source of the SEATS method.
- [seasonal package reference](https://cran.r-project.org/package=seasonal), the R package wrapping X-13ARIMA-SEATS shown in this lesson.
- [Retail Trade, Australia](https://www.abs.gov.au/statistics/industry/retail-and-wholesale-trade/retail-trade-australia), Australian Bureau of Statistics, catalogue 8501.0, table 11, the agency and series used throughout.

=== step === complete
## Quick recap

- season_adjust removes exactly one thing: season_year, the repeating calendar effect. It is computed as Turnover minus season_year, and trend and remainder both stay inside it.
- A seasonally adjusted figure is not a forecast. It never produces a row for a month that has not happened yet; it only re-expresses months already observed.
- X-13ARIMA-SEATS, the US Census Bureau's program combining X-11 and SEATS, is what most national statistics agencies actually run to publish their official numbers, because it models calendar effects, trading days and moving holidays like Easter, that STL's season_year has no equivalent for.

Next time a headline quotes a "seasonally adjusted" figure, you will know exactly what got removed from it, and exactly what it is not claiming to tell you about the month ahead.

The next part of this course moves to a different kind of problem: a series whose seasonal swings grow as the series itself grows, and the transformations that handle it.
