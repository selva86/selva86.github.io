---
title: "Time Series Decomposition Lesson 4: Box-Cox and variance-stabilizing transforms"
catalog_blurb: "Pick a transform so a seasonal swing that keeps growing stops breaking the model."
description: "Learn why a seasonal swing that grows with the level breaks an additive model, how guerrero() picks a Box-Cox lambda, and why forecasts need bias correction."
keywords: "Box-Cox transformation, variance stabilizing transform, guerrero method, lambda selection, box_cox function, inv_box_cox, bias-adjusted forecast, log transformation in R, fable R package, ETS forecasting"
post_type: "LESSON"
curriculum_id: "5.20.4"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ts-decomposition"
course_title: "Time Series Decomposition"
course_lesson: "4"
course_total: "6"
course_landing: "Time-Series-Decomposition-Course.html"
course_next: "Calendar-and-Population-Adjustments.html"
course_prev: "Seasonal-Adjustment-with-X13-and-STL.html"
---

=== step === cover
## Box-Cox and variance-stabilizing transforms

Today let's understand how to pick a transform that keeps a seasonal swing the same size, no matter how tall the series itself has grown.

Victoria's monthly turnover for cafes, restaurants and takeaway food services is a real series the Australian Bureau of Statistics has tracked every month since April 1982. Over 441 months it climbs from \$81.3 million a month to \$1,066.2 million a month.

Here is the whole series, plotted in the order the months actually happened.

::widget chart-plotter {"data":[{"x":1,"y":85.1},{"x":2,"y":85.1},{"x":3,"y":82.8},{"x":4,"y":82.1},{"x":5,"y":81.8},{"x":6,"y":84.6},{"x":7,"y":91.7},{"x":8,"y":97.7},{"x":9,"y":109.3},{"x":10,"y":94.6},{"x":11,"y":88.2},{"x":12,"y":92.0},{"x":13,"y":85.2},{"x":14,"y":86.8},{"x":15,"y":81.3},{"x":16,"y":85.6},{"x":17,"y":90.5},{"x":18,"y":90.8},{"x":19,"y":92.7},{"x":20,"y":95.8},{"x":21,"y":111.7},{"x":22,"y":92.7},{"x":23,"y":94.4},{"x":24,"y":97.8},{"x":25,"y":92.9},{"x":26,"y":101.0},{"x":27,"y":92.1},{"x":28,"y":92.5},{"x":29,"y":94.4},{"x":30,"y":90.4},{"x":31,"y":95.7},{"x":32,"y":100.6},{"x":33,"y":112.4},{"x":34,"y":96.3},{"x":35,"y":93.9},{"x":36,"y":98.0},{"x":37,"y":98.4},{"x":38,"y":101.8},{"x":39,"y":90.8},{"x":40,"y":98.3},{"x":41,"y":107.0},{"x":42,"y":103.2},{"x":43,"y":111.8},{"x":44,"y":112.3},{"x":45,"y":126.8},{"x":46,"y":113.8},{"x":47,"y":104.4},{"x":48,"y":109.7},{"x":49,"y":110.2},{"x":50,"y":118.0},{"x":51,"y":108.2},{"x":52,"y":123.5},{"x":53,"y":131.7},{"x":54,"y":132.9},{"x":55,"y":142.8},{"x":56,"y":138.3},{"x":57,"y":159.5},{"x":58,"y":138.9},{"x":59,"y":130.9},{"x":60,"y":136.3},{"x":61,"y":142.7},{"x":62,"y":144.2},{"x":63,"y":137.9},{"x":64,"y":149.0},{"x":65,"y":146.4},{"x":66,"y":146.4},{"x":67,"y":157.3},{"x":68,"y":155.3},{"x":69,"y":186.5},{"x":70,"y":143.3},{"x":71,"y":146.7},{"x":72,"y":159.6},{"x":73,"y":158.7},{"x":74,"y":151.7},{"x":75,"y":155.7},{"x":76,"y":154.0},{"x":77,"y":159.9},{"x":78,"y":165.3},{"x":79,"y":167.8},{"x":80,"y":176.4},{"x":81,"y":186.2},{"x":82,"y":167.2},{"x":83,"y":167.9},{"x":84,"y":180.6},{"x":85,"y":179.4},{"x":86,"y":182.9},{"x":87,"y":177.5},{"x":88,"y":183.3},{"x":89,"y":177.4},{"x":90,"y":188.3},{"x":91,"y":203.0},{"x":92,"y":203.6},{"x":93,"y":236.8},{"x":94,"y":198.3},{"x":95,"y":183.5},{"x":96,"y":204.6},{"x":97,"y":183.9},{"x":98,"y":183.5},{"x":99,"y":182.1},{"x":100,"y":193.4},{"x":101,"y":186.7},{"x":102,"y":182.9},{"x":103,"y":185.2},{"x":104,"y":183.1},{"x":105,"y":209.1},{"x":106,"y":187.8},{"x":107,"y":166.9},{"x":108,"y":174.1},{"x":109,"y":169.5},{"x":110,"y":177.7},{"x":111,"y":179.0},{"x":112,"y":179.0},{"x":113,"y":181.2},{"x":114,"y":183.2},{"x":115,"y":183.9},{"x":116,"y":189.0},{"x":117,"y":227.5},{"x":118,"y":192.3},{"x":119,"y":184.5},{"x":120,"y":197.9},{"x":121,"y":195.6},{"x":122,"y":193.9},{"x":123,"y":169.3},{"x":124,"y":177.9},{"x":125,"y":173.4},{"x":126,"y":190.6},{"x":127,"y":192.4},{"x":128,"y":195.4},{"x":129,"y":234.0},{"x":130,"y":207.4},{"x":131,"y":182.1},{"x":132,"y":191.1},{"x":133,"y":189.8},{"x":134,"y":192.1},{"x":135,"y":185.7},{"x":136,"y":200.2},{"x":137,"y":192.4},{"x":138,"y":195.1},{"x":139,"y":192.5},{"x":140,"y":202.3},{"x":141,"y":235.9},{"x":142,"y":194.1},{"x":143,"y":185.3},{"x":144,"y":194.6},{"x":145,"y":181.8},{"x":146,"y":179.9},{"x":147,"y":180.0},{"x":148,"y":194.6},{"x":149,"y":193.7},{"x":150,"y":206.0},{"x":151,"y":225.1},{"x":152,"y":219.9},{"x":153,"y":246.3},{"x":154,"y":222.3},{"x":155,"y":207.2},{"x":156,"y":238.1},{"x":157,"y":229.0},{"x":158,"y":222.4},{"x":159,"y":221.5},{"x":160,"y":225.4},{"x":161,"y":227.4},{"x":162,"y":233.4},{"x":163,"y":230.2},{"x":164,"y":240.4},{"x":165,"y":259.4},{"x":166,"y":239.1},{"x":167,"y":219.0},{"x":168,"y":238.4},{"x":169,"y":236.4},{"x":170,"y":235.6},{"x":171,"y":225.8},{"x":172,"y":229.9},{"x":173,"y":228.8},{"x":174,"y":219.2},{"x":175,"y":225.5},{"x":176,"y":233.3},{"x":177,"y":254.6},{"x":178,"y":242.1},{"x":179,"y":216.1},{"x":180,"y":249.9},{"x":181,"y":250.8},{"x":182,"y":252.7},{"x":183,"y":235.8},{"x":184,"y":237.5},{"x":185,"y":237.8},{"x":186,"y":235.0},{"x":187,"y":243.4},{"x":188,"y":238.5},{"x":189,"y":264.3},{"x":190,"y":241.5},{"x":191,"y":218.0},{"x":192,"y":245.4},{"x":193,"y":235.8},{"x":194,"y":240.2},{"x":195,"y":226.9},{"x":196,"y":248.4},{"x":197,"y":255.5},{"x":198,"y":248.0},{"x":199,"y":268.0},{"x":200,"y":260.5},{"x":201,"y":284.2},{"x":202,"y":267.7},{"x":203,"y":248.6},{"x":204,"y":283.3},{"x":205,"y":285.6},{"x":206,"y":299.1},{"x":207,"y":295.2},{"x":208,"y":321.5},{"x":209,"y":331.3},{"x":210,"y":340.2},{"x":211,"y":345.6},{"x":212,"y":352.3},{"x":213,"y":392.1},{"x":214,"y":331.1},{"x":215,"y":295.7},{"x":216,"y":337.2},{"x":217,"y":283.7},{"x":218,"y":308.9},{"x":219,"y":306.3},{"x":220,"y":301.3},{"x":221,"y":307.6},{"x":222,"y":296.9},{"x":223,"y":326.2},{"x":224,"y":324.8},{"x":225,"y":359.9},{"x":226,"y":336.3},{"x":227,"y":311.7},{"x":228,"y":358.4},{"x":229,"y":367.0},{"x":230,"y":354.4},{"x":231,"y":347.5},{"x":232,"y":371.3},{"x":233,"y":391.5},{"x":234,"y":349.1},{"x":235,"y":361.9},{"x":236,"y":366.2},{"x":237,"y":409.1},{"x":238,"y":385.2},{"x":239,"y":356.0},{"x":240,"y":399.2},{"x":241,"y":372.7},{"x":242,"y":368.8},{"x":243,"y":355.6},{"x":244,"y":414.5},{"x":245,"y":410.0},{"x":246,"y":392.5},{"x":247,"y":377.5},{"x":248,"y":393.1},{"x":249,"y":441.2},{"x":250,"y":446.4},{"x":251,"y":378.4},{"x":252,"y":418.4},{"x":253,"y":406.2},{"x":254,"y":426.2},{"x":255,"y":399.1},{"x":256,"y":449.0},{"x":257,"y":437.6},{"x":258,"y":434.9},{"x":259,"y":479.9},{"x":260,"y":473.8},{"x":261,"y":529.9},{"x":262,"y":478.1},{"x":263,"y":457.0},{"x":264,"y":499.3},{"x":265,"y":471.8},{"x":266,"y":468.5},{"x":267,"y":438.1},{"x":268,"y":468.4},{"x":269,"y":468.4},{"x":270,"y":490.9},{"x":271,"y":473.9},{"x":272,"y":463.0},{"x":273,"y":509.6},{"x":274,"y":432.0},{"x":275,"y":408.1},{"x":276,"y":436.7},{"x":277,"y":439.4},{"x":278,"y":430.9},{"x":279,"y":427.2},{"x":280,"y":451.1},{"x":281,"y":448.6},{"x":282,"y":441.9},{"x":283,"y":474.4},{"x":284,"y":474.2},{"x":285,"y":506.6},{"x":286,"y":468.2},{"x":287,"y":433.3},{"x":288,"y":503.8},{"x":289,"y":501.8},{"x":290,"y":522.5},{"x":291,"y":495.4},{"x":292,"y":507.1},{"x":293,"y":520.6},{"x":294,"y":513.5},{"x":295,"y":504.3},{"x":296,"y":528.6},{"x":297,"y":584.8},{"x":298,"y":523.9},{"x":299,"y":481.2},{"x":300,"y":545.1},{"x":301,"y":531.1},{"x":302,"y":510.3},{"x":303,"y":490.1},{"x":304,"y":497.6},{"x":305,"y":526.4},{"x":306,"y":494.6},{"x":307,"y":540.9},{"x":308,"y":547.9},{"x":309,"y":596.3},{"x":310,"y":539.6},{"x":311,"y":523.1},{"x":312,"y":550.6},{"x":313,"y":541.1},{"x":314,"y":548.6},{"x":315,"y":516.2},{"x":316,"y":541.8},{"x":317,"y":557.8},{"x":318,"y":537.3},{"x":319,"y":591.2},{"x":320,"y":584.0},{"x":321,"y":673.1},{"x":322,"y":647.8},{"x":323,"y":576.0},{"x":324,"y":634.5},{"x":325,"y":622.2},{"x":326,"y":631.6},{"x":327,"y":594.2},{"x":328,"y":613.4},{"x":329,"y":642.4},{"x":330,"y":615.6},{"x":331,"y":636.5},{"x":332,"y":654.1},{"x":333,"y":742.0},{"x":334,"y":657.9},{"x":335,"y":611.4},{"x":336,"y":704.2},{"x":337,"y":697.6},{"x":338,"y":692.0},{"x":339,"y":669.7},{"x":340,"y":724.2},{"x":341,"y":748.9},{"x":342,"y":735.8},{"x":343,"y":705.0},{"x":344,"y":693.9},{"x":345,"y":806.9},{"x":346,"y":649.4},{"x":347,"y":597.8},{"x":348,"y":689.6},{"x":349,"y":707.6},{"x":350,"y":699.1},{"x":351,"y":672.5},{"x":352,"y":694.0},{"x":353,"y":694.7},{"x":354,"y":686.9},{"x":355,"y":682.1},{"x":356,"y":681.5},{"x":357,"y":761.4},{"x":358,"y":638.4},{"x":359,"y":594.5},{"x":360,"y":679.6},{"x":361,"y":632.5},{"x":362,"y":666.8},{"x":363,"y":661.9},{"x":364,"y":676.4},{"x":365,"y":681.5},{"x":366,"y":662.4},{"x":367,"y":684.9},{"x":368,"y":707.0},{"x":369,"y":750.8},{"x":370,"y":655.5},{"x":371,"y":605.2},{"x":372,"y":683.2},{"x":373,"y":682.8},{"x":374,"y":682.0},{"x":375,"y":651.6},{"x":376,"y":656.7},{"x":377,"y":664.9},{"x":378,"y":665.7},{"x":379,"y":686.0},{"x":380,"y":707.5},{"x":381,"y":792.2},{"x":382,"y":721.2},{"x":383,"y":631.6},{"x":384,"y":725.5},{"x":385,"y":722.1},{"x":386,"y":718.8},{"x":387,"y":693.6},{"x":388,"y":753.8},{"x":389,"y":784.4},{"x":390,"y":791.9},{"x":391,"y":789.5},{"x":392,"y":778.2},{"x":393,"y":838.1},{"x":394,"y":786.6},{"x":395,"y":689.1},{"x":396,"y":753.4},{"x":397,"y":737.5},{"x":398,"y":740.3},{"x":399,"y":726.1},{"x":400,"y":780.8},{"x":401,"y":795.0},{"x":402,"y":795.8},{"x":403,"y":811.7},{"x":404,"y":832.6},{"x":405,"y":896.7},{"x":406,"y":790.8},{"x":407,"y":732.4},{"x":408,"y":793.3},{"x":409,"y":805.4},{"x":410,"y":808.9},{"x":411,"y":769.0},{"x":412,"y":828.7},{"x":413,"y":866.3},{"x":414,"y":878.3},{"x":415,"y":886.3},{"x":416,"y":879.5},{"x":417,"y":961.8},{"x":418,"y":861.4},{"x":419,"y":753.6},{"x":420,"y":868.4},{"x":421,"y":859.7},{"x":422,"y":845.2},{"x":423,"y":828.7},{"x":424,"y":857.6},{"x":425,"y":874.1},{"x":426,"y":872.4},{"x":427,"y":917.7},{"x":428,"y":925.7},{"x":429,"y":1008.1},{"x":430,"y":887.3},{"x":431,"y":810.6},{"x":432,"y":909.7},{"x":433,"y":898.6},{"x":434,"y":866.4},{"x":435,"y":873.1},{"x":436,"y":916.1},{"x":437,"y":943.8},{"x":438,"y":933.8},{"x":439,"y":960.0},{"x":440,"y":981.8},{"x":441,"y":1066.2}],"geoms":["line"],"x":"month","y":"turnover"}

Look near the start of that line, back in 1982. November sits at \$97.7 million and December at \$109.3 million, a jump of \$11.6 million. Now look at the far end, 2018. November closes at \$981.8 million and December jumps to \$1,066.2 million, a jump of \$84.4 million.

The line has grown more than ten times taller since 1982, and its December jump has grown right along with it.

=== step === concept
## Seasonal swings that grow with the level, and why that breaks an additive model

That December jump is not one unlucky year. It shows up every single year in this series, and its size has been climbing for decades.

An additive decomposition explains a series like this one by splitting it into parts that add back together: a **trend**, the slow-moving level of the series, and a **seasonal component**, the part of the pattern that repeats every twelve months. For this series, the seasonal component's December value is one fixed number, call it the December effect. Every December in the whole 37-year history gets that same fixed number added on top of whatever the trend says that month should be.

Look at what the actual December jump, December's turnover minus November's, has done across nine separate years: four from the early 1980s and five from the recent past.

```r
# Compute the December-minus-November jump for nine separate years
library(tsibble)
library(tsibbledata)
library(dplyr)
library(feasts)
library(fabletools)
library(fable)

cafe <- tsibbledata::aus_retail |>
  filter(State == "Victoria", Industry == "Cafes, restaurants and takeaway food services")

jump_for <- function(yr) {
  nov <- cafe |> filter(Month == yearmonth(paste(yr, "Nov"))) |> pull(Turnover)
  dec <- cafe |> filter(Month == yearmonth(paste(yr, "Dec"))) |> pull(Turnover)
  dec - nov
}

early_years <- 1982:1985
late_years <- c(2014, 2015, 2016, 2017, 2018)

data.frame(
  year = c(early_years, late_years),
  jump = round(c(sapply(early_years, jump_for), sapply(late_years, jump_for)), 1)
)
#>   year jump
#> 1 1982 11.6
#> 2 1983 15.9
#> 3 1984 11.8
#> 4 1985 14.5
#> 5 2014 59.9
#> 6 2015 64.1
#> 7 2016 82.3
#> 8 2017 82.4
#> 9 2018 84.4
```

Average the first four years and you get \$13.45 million. Average the last five and you get \$74.62 million, more than five times bigger. Whatever fixed December effect an additive model settles on, it will be too small for the recent years, too big for the early ones, or some uneasy compromise between the two. The swing itself has grown right along with the series, and one constant cannot describe a moving target.

=== step === concept
## From log to Box-Cox: one family of transforms

One common fix for a swing that grows with the level is to take logs first, and decompose the logged series instead of the raw one. A log turns a multiplication into an addition, so if a series grows by roughly the same percentage every December, its jump on the log scale should stay roughly the same size too, even while the dollar jump keeps growing.

The Box-Cox transform is a family that includes the log as one special case. It has a single number, lambda, that controls how strongly it reshapes the series:

\[ w_t = \begin{cases} \dfrac{y_t^{\lambda} - 1}{\lambda} & \lambda \neq 0 \\[4pt] \log(y_t) & \lambda = 0 \end{cases} \]

Here \(y_t\) is the original turnover in month \(t\) and \(w_t\) is the transformed value. Set \(\lambda = 0\) and the formula becomes \(\log(y_t)\), an ordinary log. Set \(\lambda = 1\) and it becomes \(y_t - 1\), just the series shifted down by one, so its shape does not change at all. Every value strictly between 0 and 1 reshapes the series somewhere between those two extremes, pulling large values in harder than small ones.

So does a plain log, \(\lambda = 0\), fix the growing December jump? Check the same nine years on the log scale.

```r
# Compute the same nine jumps on the log scale
log_jump_for <- function(yr) {
  nov <- cafe |> filter(Month == yearmonth(paste(yr, "Nov"))) |> pull(Turnover)
  dec <- cafe |> filter(Month == yearmonth(paste(yr, "Dec"))) |> pull(Turnover)
  log(dec) - log(nov)
}

log_jumps <- data.frame(
  year = c(early_years, late_years),
  log_jump = round(c(sapply(early_years, log_jump_for), sapply(late_years, log_jump_for)), 4)
)
print(log_jumps)
#>   year log_jump
#> 1 1982   0.1122
#> 2 1983   0.1536
#> 3 1984   0.1109
#> 4 1985   0.1214
#> 5 2014   0.0742
#> 6 2015   0.0742
#> 7 2016   0.0895
#> 8 2017   0.0853
#> 9 2018   0.0825

cat(sprintf("Early mean: %.4f\n", mean(log_jumps$log_jump[1:4])))
cat(sprintf("Late mean:  %.4f\n", mean(log_jumps$log_jump[5:9])))
#> Early mean: 0.1245
#> Late mean:  0.0811
```

On the log scale, the early four years average a jump of 0.1245 and the late five average 0.0811. That is not backwards from before: the late years' jump is now smaller than the early years', not bigger.

So log has clearly done something. But it has overshot: instead of a steady jump across both eras, log turns it into one that shrinks. A plain log is not the fix for this particular series, it needs a different lambda.

=== step === widget
## Watching a transform pull in a long tail

Before searching for the right lambda on Victoria's own series, it helps to see what changing lambda actually does to a skewed shape, using a simple generic example first.

The histogram below is not Victoria's turnover. It is a generic, right-skewed sample built just so you can feel what each transform does to a long tail. Toggle between none, log, square root and Box-Cox, and watch the skewness number change as the tail gets pulled in, the same family of transforms already used on the December jump above.

::widget transform-shaper {}

None of the four toggles move where the small values sit, only how far the large ones get pulled toward the middle. That pulling-in is the exact mechanism behind the December jump you saw shrink on the log scale a moment ago: a big December sitting next to a big November gets pulled in harder than a small December sitting next to a small November, which is what keeps a growing dollar jump from growing forever.

=== step === concept
## Choosing lambda with guerrero(), then transforming with box_cox()

Rather than guessing at lambda, the `feasts` package has a function that searches for the value that stabilizes the seasonal swing best: `guerrero()`. It tries a wide range of candidate lambdas and picks whichever one makes the seasonal subseries, the run of every December, every January, and so on, vary the least in size.

Run it on Victoria's turnover.

```r
# Let guerrero() search for the lambda that stabilizes the seasonal swings best
lambda <- cafe |>
  features(Turnover, features = guerrero) |>
  pull(lambda_guerrero)

round(lambda, 3)
#> [1] 0.176
```

guerrero() lands on lambda = 0.176, a long way from log's lambda = 0. That number alone does not do anything yet. To actually reshape a value, `fabletools` has two functions built for exactly this: `box_cox()` runs the formula forward, and `inv_box_cox()` runs it backward, recovering the original value exactly.

Transform the three most recent months and then invert them straight back.

```r
# Transform Oct-Dec 2018 with box_cox(), then invert it exactly with inv_box_cox()
last3 <- cafe |>
  filter(Month >= yearmonth("2018 Oct"), Month <= yearmonth("2018 Dec")) |>
  pull(Turnover)
last3
#> [1]  960.0  981.8 1066.2

transformed <- box_cox(last3, lambda)
round(transformed, 3)
#> [1] 13.351 13.426 13.706

back <- inv_box_cox(transformed, lambda)
round(back, 1)
#> [1]  960.0  981.8 1066.2
```

\$960.0 million becomes 13.351 on the Box-Cox scale, and inv_box_cox() turns 13.351 straight back into \$960.0 million. Nothing is lost. box_cox() and inv_box_cox() are exact inverses of each other, for whichever lambda you give them both.

=== step === widget
## Seeing the December jump flatten on the transformed scale

Apply that same lambda, 0.176, to the nine years of December jumps from earlier: transform each year's November and December turnover with box_cox(), then take the difference on that transformed scale instead of the dollar scale.

::widget chart-plotter {"data":[{"x":"1982","y":11.6,"fill":"Raw jump"},{"x":"1983","y":15.9,"fill":"Raw jump"},{"x":"1984","y":11.8,"fill":"Raw jump"},{"x":"1985","y":14.5,"fill":"Raw jump"},{"x":"2014","y":59.9,"fill":"Raw jump"},{"x":"2015","y":64.1,"fill":"Raw jump"},{"x":"2016","y":82.3,"fill":"Raw jump"},{"x":"2017","y":82.4,"fill":"Raw jump"},{"x":"2018","y":84.4,"fill":"Raw jump"},{"x":"1982","y":0.2539,"fill":"Box-Cox jump"},{"x":"1983","y":0.3476,"fill":"Box-Cox jump"},{"x":"1984","y":0.2523,"fill":"Box-Cox jump"},{"x":"1985","y":0.2819,"fill":"Box-Cox jump"},{"x":"2014","y":0.2411,"fill":"Box-Cox jump"},{"x":"2015","y":0.2440,"fill":"Box-Cox jump"},{"x":"2016","y":0.2975,"fill":"Box-Cox jump"},{"x":"2017","y":0.2861,"fill":"Box-Cox jump"},{"x":"2018","y":0.2795,"fill":"Box-Cox jump"}],"geoms":["line"],"x":"year","y":"jump","code":{"line":"ggplot(jump9, aes(year, jump, color = series, group = series)) +\n  geom_line() +\n  geom_point()"}}

The raw jump line climbs in a clear step, from about \$13 million a year in the early cluster to about \$75 million a year in the late cluster. The Box-Cox jump line barely moves off the bottom of the chart the whole way across: 0.2839 on average in the early years, 0.2696 on average in the late years, within about 5 percent of each other. The swing that grew 5.5 times over on the dollar scale barely grew at all once box_cox() re-expressed it with lambda = 0.176.

=== step === quiz
## Quick check: what a Box-Cox transform is for

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- It removes the trend, the series' slow-moving level. ::no
- It re-expresses the series on a scale where the seasonal swing's size stops growing with the level, so an additive model becomes reasonable to fit. ::ok Right. guerrero() searches for the lambda that keeps the seasonal subseries' variation the most stable, and box_cox() applies it. On this series that lambda is 0.176, and it flattens the December jump from a 5.5-times swing on the dollar scale to within about 5 percent of itself.
- It always picks lambda = 0, which is the same thing as taking logs. ::no
- Log, square root and Box-Cox all pull in a long tail by about the same amount, so which lambda guerrero() picks barely matters. ::no None of those are right. guerrero() does not default to log, it picked 0.176 here, not 0. A transform does not remove trend either, that still needs fitting on whichever scale you choose. And the amount of pulling-in matters a lot: on this series, plain log alone still leaves the late era's jump about 1.5 times smaller than the early era's (0.0811 against 0.1245), while lambda = 0.176 gets the two eras within about 5 percent of each other.

=== step === concept
## Modelling and forecasting on the transformed scale

Fit an ETS model, short for Error, Trend, Seasonal, an exponential-smoothing forecaster that tracks a series' level, trend and seasonal pattern and projects them forward, but wrap its response in box_cox() with the lambda guerrero() already found, so the model fits and forecasts on the transformed scale instead of the raw dollar scale.

```r
# Fit ETS on the Box-Cox transformed series, then forecast 24 months ahead
fit <- cafe |> model(ets = ETS(box_cox(Turnover, lambda)))
fc <- fit |> forecast(h = 24)

preview <- fc |>
  as_tibble() |>
  transmute(Month = as.character(Month), Forecast = round(.mean, 1)) |>
  as.data.frame()

print(head(preview, 3), row.names = FALSE)
#>     Month Forecast
#>  2019 Jan    969.4
#>  2019 Feb    907.2
#>  2019 Mar    985.5

print(tail(preview, 3), row.names = FALSE)
#>     Month Forecast
#>  2020 Oct   1082.1
#>  2020 Nov   1089.9
#>  2020 Dec   1194.1
```

One month out, the forecast for January 2019 is \$969.4 million. Two years out, December 2020 sits at \$1,194.1 million. Every one of those forecasts, and the whole distribution behind each one, lives on the Box-Cox scale internally. `forecast()` and the `.mean` column you just printed have already converted it back to dollars for you, but that conversion is not just a simple undo of box_cox(), and that is worth looking at closely.

=== step === concept
## Why a back-transformed point forecast needs a bias adjustment

Here is the subtlety hiding in that `.mean` column. `fc$Turnover` does not hold one number per month, it holds fable's entire forecast distribution for that month: every value turnover could take that month, and how likely each one is. `.mean` is just one summary already computed from that distribution for you.

On the Box-Cox scale, ETS treats each month's forecast distribution as symmetric, a bell curve centred on its own mean. For a symmetric distribution, the mean and the median, the value exactly in the middle, sit at exactly the same point.

But converting a value back from the Box-Cox scale to dollars is a curved operation, not a straight-line one, since it raises a number to a power. A curved transformation does something uneven to a symmetric distribution: the median comes through unchanged, because whatever value was exactly in the middle stays exactly in the middle no matter how you reshape the scale. The mean does not survive that same way. Once you curve a distribution, its average shifts.

See the size of that shift directly, at the first month forecast and at the last.

```r
# Compare the back-transformed median against the back-transformed mean
h1 <- fc |> filter(Month == yearmonth("2019 Jan"))
h24 <- fc |> filter(Month == yearmonth("2020 Dec"))

med1 <- median(h1$Turnover[[1]]);   mean1 <- mean(h1$Turnover[[1]])
med24 <- median(h24$Turnover[[1]]); mean24 <- mean(h24$Turnover[[1]])

compare <- data.frame(
  horizon = c("h = 1 (Jan 2019)", "h = 24 (Dec 2020)"),
  median  = round(c(med1, med24), 2),
  mean    = round(c(mean1, mean24), 2),
  gap     = round(c(mean1 - med1, mean24 - med24), 2)
)
print(compare, row.names = FALSE)
#>            horizon  median    mean  gap
#>   h = 1 (Jan 2019)  969.01  969.37 0.36
#>  h = 24 (Dec 2020) 1188.97 1194.06 5.08
```

At one month out, the gap is tiny: \$969.37 million against \$969.01 million, just \$0.36 million apart, because the forecast distribution is still narrow this early. At two years out, the gap has grown to \$5.08 million, \$1,194.06 million against \$1,188.97 million, because the forecast distribution has widened by then, and a wider symmetric distribution gets pulled further off its median once it is curved back to dollars.

Which one should you report? The median, \$1,188.97 million, is the value exactly as likely to be too high as too low. The mean, \$1,194.06 million, is the value that correctly averages out every future the distribution assigns some probability to, once you are back on the dollar scale.

And `.mean`, the column `forecast()` handed you, already is this bias-adjusted mean, not the naive median. Convert only the middle of the Box-Cox distribution back to dollars by hand, and you would understate every one of these forecasts beyond the very first month.

=== step === concept
## When a transform is not worth the interpretability cost
::prose-only weighs the transform's benefit, a stable seasonal swing and a correct forecast mean, against its cost, a lambda scale with no everyday meaning, using the lesson's own numbers to decide

Box-Cox buys something real: a series where an additive model, and a bias-corrected forecast, both make sense. But it also costs something.

A 1 percent change in Turnover is an easy sentence to say out loud: turnover was up 1 percent in December. A 1-unit change on a lambda = 0.176 scale has no such sentence. It is not a percentage and it is not a dollar amount, it is just a position on a scale nobody outside a statistics course has any intuition for.

Victoria's cafe series earns that cost. Its December jump grew 5.5 times over, from \$13.45 million a year on average in the early 1980s to \$74.62 million a year on average by the late 2010s. Left alone, that growth would make an additive decomposition, and any forecast built on top of it, unreliable. The Box-Cox scale buys back a stable seasonal swing, and a correctly bias-adjusted forecast, at the cost of a number that needs translating before anyone outside a statistics course can use it.

A series whose seasonal swing already stays close to the same dollar size all the way through would gain almost nothing from that trade. It would still pay the interpretability cost, translating every number back before reporting it, for a stability it already had for free. Box-Cox is worth reaching for when the swing is visibly tied to the level, the way Victoria's is, and worth skipping when it is not.

=== step === quiz
## Quick check: reading a bias-adjusted forecast

A colleague pulls the Dec 2020 forecast off the transformed scale by hand, back-transforms it, and reports \$1,188.97 million as "the forecast". Is that right?

::quiz {"correct": 2, "gate": true, "difficulty": "advanced"}
- \$1,188.97 million is right, median and mean always match once you back-transform a forecast. ::no
- That understates it. fable's own `.mean` already reports \$1,194.06 million, about \$5.08 million higher, because back-transforming pulls the mean above the median once the forecast distribution has real spread. ::ok Exactly right. The colleague back-transformed the middle of the distribution, the median, and reported that as if it were the mean. The two only match when there is no spread to speak of, like at h = 1, where the gap was just \$0.36 million. By h = 24 the forecast distribution has widened enough that the gap grows to \$5.08 million.
- The \$5.08 million gap means the ETS fit is wrong and should be refit. ::no
- It depends on which random seed the forecast happened to use. ::no None of those are right. The gap is not a sign of a bad fit, it shows up whenever lambda is not 1, precisely because a curved back-transformation always pulls a symmetric distribution's mean away from its median once there is real spread. Nor does it depend on a random seed: fable computes this bias-adjusted mean with a formula, not a simulation, so the same model and the same lambda give the same \$1,194.06 million every time.

=== step === tryit
## Your turn: check the bias gap at a middle horizon

`fit` and `fc` are still sitting in your session from a few steps back, the same ETS model and its 24-month forecast. Pull the December 2019 row, h = 12, right in between the two horizons you have already checked, and see where its bias gap falls.

```r
# Compute the median-vs-mean gap at h = 12 (December 2019)
h12 <- fc |> filter(Month == yearmonth("2019 Dec"))
med12 <- median(h12$Turnover[[1]])
mean12 <- ____

cat(sprintf("Median: %.2f\n", med12))
cat(sprintf("Mean:   %.2f\n", mean12))
cat(sprintf("Gap:    %.2f\n", mean12 - med12))
```
::check {"regex": "mean[(]h12\\$Turnover", "gate": true, "difficulty": "intermediate", "ok": "Right: the gap is \\$2.55 million, \\$1,129.71 million against \\$1,127.15 million, sitting neatly between the \\$0.36 million gap at h = 1 and the \\$5.08 million gap at h = 24. The gap grows with the horizon because the forecast distribution keeps widening the further out you forecast.", "no": "Do the same thing you did for h1 and h24: `mean(h12$Turnover[[1]])`."}
::solution
```r
# December 2019 (h = 12): median against mean
h12 <- fc |> filter(Month == yearmonth("2019 Dec"))
med12 <- median(h12$Turnover[[1]])
mean12 <- mean(h12$Turnover[[1]])

cat(sprintf("Median: %.2f\n", med12))
cat(sprintf("Mean:   %.2f\n", mean12))
cat(sprintf("Gap:    %.2f\n", mean12 - med12))
#> Median: 1127.15
#> Mean:   1129.71
#> Gap:    2.55
```

=== step === concept
## References

- Box, G.E.P. & Cox, D.R. (1964), "[An Analysis of Transformations](https://doi.org/10.1111/j.2517-6161.1964.tb00553.x)," Journal of the Royal Statistical Society, Series B, 26(2), the paper that introduced the Box-Cox transform used throughout this lesson.
- Guerrero, V.M. (1993), "[Time-series analysis supported by power transformations](https://doi.org/10.1002/for.3980120104)," Journal of Forecasting, 12(1), the method behind guerrero() and the lambda it picked here.
- Hyndman, R.J. & Athanasopoulos, G., "[Forecasting: Principles and Practice](https://otexts.com/fpp3/transformations.html)" (3rd ed.), OTexts, section 3.1, "Transformations and adjustments," the source for the bias-adjusted back-transformation covered in this lesson.
- [fabletools reference](https://fabletools.tidyverts.org/reference/), the R package documenting box_cox(), inv_box_cox() and guerrero() used throughout this lesson.
- [Retail Trade, Australia](https://www.abs.gov.au/statistics/industry/retail-and-wholesale-trade/retail-trade-australia), Australian Bureau of Statistics, catalogue 8501.0, table 11, the source of the series used throughout this course.

=== step === complete
## Quick recap

- A seasonal swing that grows with a series' level breaks an additive model: no single fixed December effect can describe a \$13.45 million jump in one era and a \$74.62 million jump in another.
- The Box-Cox transform is a family with one number, lambda: log is its lambda = 0 case, and leaving the series alone is its lambda = 1 case. `guerrero()` searches for the lambda that keeps a series' seasonal swings the most stable, 0.176 for this series, and `box_cox()` / `inv_box_cox()` transform a value and recover it exactly.
- On the Box-Cox scale, the December jump that grew 5.5 times over on the dollar scale stayed within about 5 percent of itself across nearly four decades.
- A back-transformed forecast needs a bias adjustment: the mean sits above the median once you curve a symmetric distribution back to dollars, by \$0.36 million at h = 1 and by \$5.08 million at h = 24, and fable's `.mean` already carries that correction.
- The trade only pays off when a series actually needs it. Victoria's cafe turnover does; a series whose seasonal swing already holds its dollar size steady would just pay the interpretability cost for nothing.

The next part of this course turns from the size of a series to its calendar: the month lengths and moving holidays that can look like seasonality but are not.
