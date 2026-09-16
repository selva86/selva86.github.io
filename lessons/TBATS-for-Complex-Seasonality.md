---
title: "Dynamic Regression and Complex Seasonality Lesson 4: Fitting a TBATS model for complex seasonality"
catalog_blurb: "Fit one model that handles two seasonal cycles without hand-built Fourier terms."
description: "Fit tbats() on an hourly electricity series with two seasonal periods, map every fitted number to its letter, and time the search against one fixed model."
keywords: "TBATS, tbats(), msts(), Box-Cox transformation, trigonometric seasonal terms, ARMA errors, multiple seasonal periods, forecast package, dynamic harmonic regression, electricity demand forecasting"
post_type: "LESSON"
curriculum_id: "5.70.4"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ts-dynamic"
course_title: "Dynamic Regression and Complex Seasonality"
course_lesson: "4"
course_total: "6"
course_landing: "Dynamic-Regression-and-Complex-Seasonality-Course.html"
course_next: "Forecasting-with-Prophet.html"
course_prev: "Multiple-Seasonal-Periods.html"
---

=== step === cover
## Fitting a TBATS model for complex seasonality

Today let's understand a model built for a series that repeats on more than one clock at once, and watch it work out every piece of that seasonal pattern for itself, without you specifying a single term by hand.

Here's the running example. Victoria, the Australian state, records its electricity grid demand from half-hourly meters. Average that into hourly totals and take three consecutive weeks in winter, 504 hours of real demand in megawatts (MW), from the Australian Energy Market Operator.

Plot the hour index, 1 through 504, against that hour's demand.

::widget chart-plotter {"data":[{"x":1,"y":4164.2},{"x":2,"y":3922.1},{"x":3,"y":3650.7},{"x":4,"y":3507.8},{"x":5,"y":3506.4},{"x":6,"y":3825.1},{"x":7,"y":4496.6},{"x":8,"y":5137.1},{"x":9,"y":5617.1},{"x":10,"y":5758.7},{"x":11,"y":5667.6},{"x":12,"y":5567.4},{"x":13,"y":5456},{"x":14,"y":5433.7},{"x":15,"y":5469.3},{"x":16,"y":5454.5},{"x":17,"y":5563.7},{"x":18,"y":6022.9},{"x":19,"y":6044.9},{"x":20,"y":5691.8},{"x":21,"y":5366.5},{"x":22,"y":4985},{"x":23,"y":4647.9},{"x":24,"y":4761.1},{"x":25,"y":4345.4},{"x":26,"y":4078.1},{"x":27,"y":3808.3},{"x":28,"y":3628.8},{"x":29,"y":3619.8},{"x":30,"y":3893.2},{"x":31,"y":4584.7},{"x":32,"y":5185.3},{"x":33,"y":5538.3},{"x":34,"y":5503.3},{"x":35,"y":5328.6},{"x":36,"y":5188.7},{"x":37,"y":5107.4},{"x":38,"y":5104},{"x":39,"y":5070.8},{"x":40,"y":5074.5},{"x":41,"y":5236.4},{"x":42,"y":5770.9},{"x":43,"y":5903},{"x":44,"y":5644.4},{"x":45,"y":5364.4},{"x":46,"y":5017.7},{"x":47,"y":4716.4},{"x":48,"y":4822.9},{"x":49,"y":4396},{"x":50,"y":4107.1},{"x":51,"y":3817.1},{"x":52,"y":3633.1},{"x":53,"y":3623.3},{"x":54,"y":3916.9},{"x":55,"y":4693.9},{"x":56,"y":5270.2},{"x":57,"y":5608.3},{"x":58,"y":5538.4},{"x":59,"y":5328.5},{"x":60,"y":5186.3},{"x":61,"y":5089.3},{"x":62,"y":5089},{"x":63,"y":5058.4},{"x":64,"y":5072.8},{"x":65,"y":5238.7},{"x":66,"y":5859.1},{"x":67,"y":6086},{"x":68,"y":5783},{"x":69,"y":5522.8},{"x":70,"y":5141},{"x":71,"y":4811.8},{"x":72,"y":4915.7},{"x":73,"y":4509.5},{"x":74,"y":4226.3},{"x":75,"y":3914},{"x":76,"y":3672.2},{"x":77,"y":3633.9},{"x":78,"y":3903.5},{"x":79,"y":4690},{"x":80,"y":5317.8},{"x":81,"y":5717.9},{"x":82,"y":5744.6},{"x":83,"y":5735.7},{"x":84,"y":5737.6},{"x":85,"y":5710.9},{"x":86,"y":5682},{"x":87,"y":5552.2},{"x":88,"y":5544.1},{"x":89,"y":5684.7},{"x":90,"y":6133},{"x":91,"y":6208.4},{"x":92,"y":5872.9},{"x":93,"y":5588.1},{"x":94,"y":5150.4},{"x":95,"y":4813.9},{"x":96,"y":4907.4},{"x":97,"y":4449},{"x":98,"y":4149},{"x":99,"y":3808.6},{"x":100,"y":3678.1},{"x":101,"y":3670.5},{"x":102,"y":3931.8},{"x":103,"y":4682.7},{"x":104,"y":5308.3},{"x":105,"y":5765.5},{"x":106,"y":5774.7},{"x":107,"y":5569},{"x":108,"y":5457.6},{"x":109,"y":5458.6},{"x":110,"y":5475.4},{"x":111,"y":5436.9},{"x":112,"y":5413.3},{"x":113,"y":5503},{"x":114,"y":5979.7},{"x":115,"y":6115.1},{"x":116,"y":5800.2},{"x":117,"y":5539.8},{"x":118,"y":5175},{"x":119,"y":4905.7},{"x":120,"y":5047.9},{"x":121,"y":4600},{"x":122,"y":4264},{"x":123,"y":3850.4},{"x":124,"y":3587.7},{"x":125,"y":3498.9},{"x":126,"y":3571.8},{"x":127,"y":3859.8},{"x":128,"y":4142.4},{"x":129,"y":4579.5},{"x":130,"y":4739.8},{"x":131,"y":4650.1},{"x":132,"y":4518.1},{"x":133,"y":4512.3},{"x":134,"y":4501.1},{"x":135,"y":4455},{"x":136,"y":4536.3},{"x":137,"y":4825.2},{"x":138,"y":5418.5},{"x":139,"y":5561.2},{"x":140,"y":5286.7},{"x":141,"y":5042.9},{"x":142,"y":4798},{"x":143,"y":4669.8},{"x":144,"y":4852.5},{"x":145,"y":4505.5},{"x":146,"y":4152.2},{"x":147,"y":3767.9},{"x":148,"y":3536.9},{"x":149,"y":3435.2},{"x":150,"y":3467.2},{"x":151,"y":3650.9},{"x":152,"y":3818.6},{"x":153,"y":4214.5},{"x":154,"y":4428.4},{"x":155,"y":4417.7},{"x":156,"y":4345.5},{"x":157,"y":4308.3},{"x":158,"y":4313.2},{"x":159,"y":4329.4},{"x":160,"y":4479},{"x":161,"y":4817.5},{"x":162,"y":5414.4},{"x":163,"y":5636.8},{"x":164,"y":5439.9},{"x":165,"y":5237},{"x":166,"y":4914.3},{"x":167,"y":4645.4},{"x":168,"y":4781.3},{"x":169,"y":4443.9},{"x":170,"y":4174.4},{"x":171,"y":3850.8},{"x":172,"y":3667.8},{"x":173,"y":3666.8},{"x":174,"y":3995.2},{"x":175,"y":4794},{"x":176,"y":5534.7},{"x":177,"y":6071.2},{"x":178,"y":6142.1},{"x":179,"y":5888.1},{"x":180,"y":5655.2},{"x":181,"y":5517.5},{"x":182,"y":5542.9},{"x":183,"y":5509.8},{"x":184,"y":5533.3},{"x":185,"y":5707.1},{"x":186,"y":6298.7},{"x":187,"y":6489.6},{"x":188,"y":6153.6},{"x":189,"y":5879},{"x":190,"y":5493},{"x":191,"y":5045.8},{"x":192,"y":5127.3},{"x":193,"y":4787.7},{"x":194,"y":4462.4},{"x":195,"y":4127.4},{"x":196,"y":3934.3},{"x":197,"y":3927.8},{"x":198,"y":4250.5},{"x":199,"y":5120},{"x":200,"y":5898.9},{"x":201,"y":6376.9},{"x":202,"y":6359.4},{"x":203,"y":6092.6},{"x":204,"y":5821.1},{"x":205,"y":5613.8},{"x":206,"y":5567.2},{"x":207,"y":5508.7},{"x":208,"y":5539.2},{"x":209,"y":5773.1},{"x":210,"y":6425.9},{"x":211,"y":6651.8},{"x":212,"y":6395.9},{"x":213,"y":6093.8},{"x":214,"y":5689.9},{"x":215,"y":5167.4},{"x":216,"y":5230.5},{"x":217,"y":4818.4},{"x":218,"y":4480.4},{"x":219,"y":4179.5},{"x":220,"y":3984},{"x":221,"y":3973.3},{"x":222,"y":4298.9},{"x":223,"y":5153.8},{"x":224,"y":5902.4},{"x":225,"y":6382.2},{"x":226,"y":6365.9},{"x":227,"y":6043.4},{"x":228,"y":5764.7},{"x":229,"y":5538.4},{"x":230,"y":5485.3},{"x":231,"y":5393.2},{"x":232,"y":5400.4},{"x":233,"y":5588.7},{"x":234,"y":6234.4},{"x":235,"y":6506.9},{"x":236,"y":6240.6},{"x":237,"y":5971.2},{"x":238,"y":5596.1},{"x":239,"y":5161.7},{"x":240,"y":5201.4},{"x":241,"y":4764.4},{"x":242,"y":4409.1},{"x":243,"y":4112.4},{"x":244,"y":3938.1},{"x":245,"y":3916.4},{"x":246,"y":4240.6},{"x":247,"y":5066.9},{"x":248,"y":5806.5},{"x":249,"y":6313.2},{"x":250,"y":6367.9},{"x":251,"y":6177.3},{"x":252,"y":5960.7},{"x":253,"y":5723.8},{"x":254,"y":5637.1},{"x":255,"y":5494},{"x":256,"y":5465},{"x":257,"y":5638.9},{"x":258,"y":6259.6},{"x":259,"y":6484.6},{"x":260,"y":6257},{"x":261,"y":6020.1},{"x":262,"y":5551.8},{"x":263,"y":5188.1},{"x":264,"y":5263.3},{"x":265,"y":4804.6},{"x":266,"y":4474.1},{"x":267,"y":4119.2},{"x":268,"y":3881.8},{"x":269,"y":3881.8},{"x":270,"y":4204.2},{"x":271,"y":4958.3},{"x":272,"y":5642},{"x":273,"y":6129.3},{"x":274,"y":6064.4},{"x":275,"y":5733.7},{"x":276,"y":5518.8},{"x":277,"y":5344.1},{"x":278,"y":5277},{"x":279,"y":5229.9},{"x":280,"y":5240.4},{"x":281,"y":5400.5},{"x":282,"y":5942},{"x":283,"y":6069.7},{"x":284,"y":5754.1},{"x":285,"y":5509.9},{"x":286,"y":5139.4},{"x":287,"y":4863},{"x":288,"y":5029.8},{"x":289,"y":4567.4},{"x":290,"y":4178.8},{"x":291,"y":3805.9},{"x":292,"y":3550.9},{"x":293,"y":3455.2},{"x":294,"y":3568},{"x":295,"y":3852.3},{"x":296,"y":4121.9},{"x":297,"y":4612.8},{"x":298,"y":4898.1},{"x":299,"y":4885.8},{"x":300,"y":4819.9},{"x":301,"y":4755},{"x":302,"y":4744.2},{"x":303,"y":4708.5},{"x":304,"y":4749.4},{"x":305,"y":4980},{"x":306,"y":5474.8},{"x":307,"y":5508.6},{"x":308,"y":5197.4},{"x":309,"y":4953.3},{"x":310,"y":4687.2},{"x":311,"y":4540.9},{"x":312,"y":4745.5},{"x":313,"y":4354.3},{"x":314,"y":4006.5},{"x":315,"y":3631.3},{"x":316,"y":3430.8},{"x":317,"y":3277.6},{"x":318,"y":3256.3},{"x":319,"y":3394.1},{"x":320,"y":3566.6},{"x":321,"y":3981.4},{"x":322,"y":4348.9},{"x":323,"y":4521.3},{"x":324,"y":4567.5},{"x":325,"y":4576.6},{"x":326,"y":4561.5},{"x":327,"y":4505.6},{"x":328,"y":4564.5},{"x":329,"y":4716},{"x":330,"y":5249.6},{"x":331,"y":5477.2},{"x":332,"y":5216},{"x":333,"y":4973.7},{"x":334,"y":4617.8},{"x":335,"y":4362.5},{"x":336,"y":4515.9},{"x":337,"y":4150.7},{"x":338,"y":3853.3},{"x":339,"y":3552.6},{"x":340,"y":3392.3},{"x":341,"y":3391.8},{"x":342,"y":3708.6},{"x":343,"y":4523.1},{"x":344,"y":5321.7},{"x":345,"y":5716.5},{"x":346,"y":5656.6},{"x":347,"y":5448.4},{"x":348,"y":5326.2},{"x":349,"y":5274.5},{"x":350,"y":5277},{"x":351,"y":5253.1},{"x":352,"y":5249.3},{"x":353,"y":5418.1},{"x":354,"y":5882.6},{"x":355,"y":6050.9},{"x":356,"y":5707.8},{"x":357,"y":5408.6},{"x":358,"y":5005.8},{"x":359,"y":4591.9},{"x":360,"y":4751.2},{"x":361,"y":4351.4},{"x":362,"y":4010},{"x":363,"y":3710.9},{"x":364,"y":3516.7},{"x":365,"y":3523.8},{"x":366,"y":3835.6},{"x":367,"y":4674.5},{"x":368,"y":5479.7},{"x":369,"y":5722.9},{"x":370,"y":5643.4},{"x":371,"y":5470},{"x":372,"y":5334.9},{"x":373,"y":5317},{"x":374,"y":5342},{"x":375,"y":5274.5},{"x":376,"y":5236.8},{"x":377,"y":5409.8},{"x":378,"y":5972.9},{"x":379,"y":6064.9},{"x":380,"y":5740.5},{"x":381,"y":5445.6},{"x":382,"y":5017.8},{"x":383,"y":4640.6},{"x":384,"y":4774.7},{"x":385,"y":4354.4},{"x":386,"y":4043.1},{"x":387,"y":3738.6},{"x":388,"y":3537.6},{"x":389,"y":3541.1},{"x":390,"y":3854.1},{"x":391,"y":4676},{"x":392,"y":5440.2},{"x":393,"y":5736.5},{"x":394,"y":5661},{"x":395,"y":5505.9},{"x":396,"y":5384.8},{"x":397,"y":5269.3},{"x":398,"y":5244.9},{"x":399,"y":5183.1},{"x":400,"y":5117.4},{"x":401,"y":5258.9},{"x":402,"y":5785.3},{"x":403,"y":5978.9},{"x":404,"y":5678.3},{"x":405,"y":5377.6},{"x":406,"y":4988.4},{"x":407,"y":4633},{"x":408,"y":4736.6},{"x":409,"y":4330.3},{"x":410,"y":4009.6},{"x":411,"y":3667.1},{"x":412,"y":3485.1},{"x":413,"y":3469.6},{"x":414,"y":3744.2},{"x":415,"y":4512.3},{"x":416,"y":5183},{"x":417,"y":5359.7},{"x":418,"y":5320.1},{"x":419,"y":5234.1},{"x":420,"y":5166.5},{"x":421,"y":5098.8},{"x":422,"y":5103},{"x":423,"y":5130.3},{"x":424,"y":5221},{"x":425,"y":5437.4},{"x":426,"y":5679.5},{"x":427,"y":5831.5},{"x":428,"y":5518.1},{"x":429,"y":5221},{"x":430,"y":4797.5},{"x":431,"y":4465.9},{"x":432,"y":4633.9},{"x":433,"y":4196.4},{"x":434,"y":3881.1},{"x":435,"y":3569.2},{"x":436,"y":3401.6},{"x":437,"y":3387.4},{"x":438,"y":3684.1},{"x":439,"y":4415.9},{"x":440,"y":5093.2},{"x":441,"y":5313.9},{"x":442,"y":5309.7},{"x":443,"y":5237.3},{"x":444,"y":5174.6},{"x":445,"y":5081.4},{"x":446,"y":5029.6},{"x":447,"y":4932.1},{"x":448,"y":4919},{"x":449,"y":5147.8},{"x":450,"y":5664.4},{"x":451,"y":5811.4},{"x":452,"y":5543.3},{"x":453,"y":5290.5},{"x":454,"y":4946.7},{"x":455,"y":4685.5},{"x":456,"y":4878.6},{"x":457,"y":4429.5},{"x":458,"y":4027.2},{"x":459,"y":3684.4},{"x":460,"y":3460.5},{"x":461,"y":3406},{"x":462,"y":3504.5},{"x":463,"y":3800.2},{"x":464,"y":4117.3},{"x":465,"y":4589.8},{"x":466,"y":4848.8},{"x":467,"y":4857.2},{"x":468,"y":4938.4},{"x":469,"y":5042.4},{"x":470,"y":5091.1},{"x":471,"y":5067.9},{"x":472,"y":5148.6},{"x":473,"y":5273.4},{"x":474,"y":5676},{"x":475,"y":5817.3},{"x":476,"y":5507.5},{"x":477,"y":5249.5},{"x":478,"y":4986.5},{"x":479,"y":4799.7},{"x":480,"y":4975.3},{"x":481,"y":4622.4},{"x":482,"y":4235.3},{"x":483,"y":3832.9},{"x":484,"y":3567.4},{"x":485,"y":3475.8},{"x":486,"y":3518.1},{"x":487,"y":3703.3},{"x":488,"y":3896.6},{"x":489,"y":4339.6},{"x":490,"y":4584.2},{"x":491,"y":4560},{"x":492,"y":4446.8},{"x":493,"y":4381.3},{"x":494,"y":4389},{"x":495,"y":4399.5},{"x":496,"y":4540.2},{"x":497,"y":4849.3},{"x":498,"y":5524.1},{"x":499,"y":5880.2},{"x":500,"y":5661.6},{"x":501,"y":5443.9},{"x":502,"y":5074.6},{"x":503,"y":4667.6},{"x":504,"y":4751}],"geoms":["point","line"],"x":"Hour","y":"Demand"}

The line climbs and falls once a day, and riding on top of that a slower rise and fall repeats once a week: notice how the whole shape sits a little higher in the middle stretch of the plot than at either end.

=== step === concept
## What each letter in TBATS stands for

TBATS is a name built from five letters, and every one of them names one piece this model adds on top of a plain forecast.

- **T, Trigonometric seasonal terms.** A repeating shape represented as a pair of numbers for each seasonal period, and that pair is allowed to update at every new observation instead of staying fixed for the whole series. A model like this one is called a state space model, and "state" just means a number, or a small set of numbers, the model keeps in memory and updates as new data arrives, rather than one number chosen once and never touched again.
- **B, Box-Cox transformation.** A power transform on the raw series, controlled by one number called lambda, that steadies a swing that grows or shrinks along with the level of the series, before anything else gets fit.
- **A, ARMA errors.** Once trend and season are pulled out, whatever short-run pattern is still left in the residuals, the gap between the fitted value and the real one at each hour, gets modeled with an ARMA process: p of its own recent lags (the autoregressive part) and q of its own recent forecast errors (the moving average part).
- **T, Trend.** A smoothed level, meaning a running estimate of the series' typical size that updates a bit at a time, together with an optional slope for how fast that level climbs or falls, and an optional damping parameter that can flatten that slope out the further into the future the forecast reaches.
- **S, Seasonal.** However many periods repeat in the series get modeled at once. This series carries two, a 24-hour day and a 168-hour week, and TBATS is not capped at two the way seasonal ARIMA is capped at one.

Notice T appears twice, once for Trigonometric and once for Trend. They are two different letters describing two different pieces of the model, and this lesson will name them out in full each time to keep them apart.

Start with B, the Box-Cox transformation, since it acts on the raw series before anything else does.

\[ w_t = \begin{cases} \dfrac{y_t^{\lambda} - 1}{\lambda} & \lambda \neq 0 \\[4pt] \log(y_t) & \lambda = 0 \end{cases} \]

Here \(y_t\) is demand at hour \(t\) in its original megawatt units, and \(w_t\) is demand after the transform. Set \(\lambda = 0\) and the formula becomes \(\log(y_t)\), an ordinary log. Set \(\lambda = 1\) and it becomes \(y_t - 1\), the series shifted down by one, so its shape barely changes at all. Every value between those two extremes reshapes the series somewhere in between those two, pulling large values in harder than small ones, which is exactly what steadies a swing that would otherwise grow along with the level of demand.

=== step === concept
## Building a two-period series and fitting tbats()

A series with two seasonal periods needs a container that can hold both of them at once. The `msts()` function from the forecast package does exactly that: it tags a plain numeric vector with a vector of seasonal periods, `seasonal.periods = c(24, 168)` here, instead of the single period an ordinary `ts()` object takes.

Build the 504-hour series from real AEMO demand and tag it with both periods.

```r
# Build the 504-hour series of real electricity demand and tag it with two seasonal periods
library(tsibble)
library(tsibbledata)
library(dplyr)
library(forecast)

demand_ts <- tsibbledata::vic_elec |>
  filter(Date >= as.Date("2013-07-01"), Date <= as.Date("2013-07-21")) |>
  as_tibble() |>
  mutate(HourIdx = ceiling(row_number() / 2)) |>
  group_by(HourIdx) |>
  summarise(Demand = round(mean(Demand), 1), .groups = "drop") |>
  mutate(Hour = as.POSIXct("2013-07-01 00:00:00", tz = "UTC") + (HourIdx - 1) * 3600) |>
  select(Hour, HourIdx, Demand) |>
  as_tsibble(index = Hour)

demand_msts <- msts(demand_ts$Demand, seasonal.periods = c(24, 168))
```

Fit `tbats()` on it with nothing else specified, and behind that one call it searches Box-Cox on and off, trend on and off, damped trend on and off, several ARMA error orders, and a harmonic count for each of the two seasonal periods, before returning one fitted model. That search takes real time, about 40 seconds on an ordinary machine, too slow to run live on this page, so run this one locally instead:

```r-static
# Fit tbats() with nothing specified, letting it search every combination on its own
tbats_fit <- tbats(demand_msts)
tbats_fit
#> TBATS(0, {5,0}, -, {<24,11>, <168,6>})
#> 
#> Call: tbats(y = demand_msts)
#> 
#> Parameters
#>   Lambda: 3e-06
#>   Alpha: 0.109172
#>   Gamma-1 Values: -8.53382e-05 7.221974e-06
#>   Gamma-2 Values: -0.0001178985 0.0001106449
#>   AR coefficients: 1.405546 -0.62948 -0.266613 0.510719 -0.321501
#> 
#> Seed States:
#>                [,1]
#>  [1,]  8.4490817160
#>  [2,] -0.1087063624
#>  [3,] -0.0276278924
#>  [4,]  0.0450450069
#>  [5,]  0.0240042237
#>  [6,] -0.0027096513
#>  [7,] -0.0017038221
#>  [8,]  0.0060115061
#>  [9,]  0.0018055236
#> [10,] -0.0049446108
#> [11,] -0.0059768461
#> [12,] -0.0030890567
#> [13,] -0.1262833396
#> [14,] -0.1012039444
#> [15,]  0.0201366398
#> [16,]  0.0163437378
#> [17,] -0.0111033353
#> [18,] -0.0015151469
#> [19,] -0.0042527607
#> [20,] -0.0073604517
#> [21,] -0.0024942704
#> [22,] -0.0007572183
#> [23,] -0.0029579646
#> [24,] -0.0424344069
#> [25,]  0.0030540157
#> [26,]  0.0022314767
#> [27,] -0.0019222993
#> [28,]  0.0010904166
#> [29,]  0.0258020725
#> [30,]  0.0598334401
#> [31,]  0.0417720098
#> [32,]  0.0161470075
#> [33,]  0.0172024274
#> [34,]  0.0254104794
#> [35,]  0.0123445072
#> [36,]  0.0000000000
#> [37,]  0.0000000000
#> [38,]  0.0000000000
#> [39,]  0.0000000000
#> [40,]  0.0000000000
#> attr(,"lambda")
#> [1] 2.514725e-06
#> 
#> Sigma: 0.01429835
#> AIC: 7511.04
```

That is a lot to take in at once, so skip the Seed States block for now. It is forty numbers the fitting algorithm needs internally to start its search, and nothing this lesson reads again. The five lines above it, Lambda through AR coefficients, are the numbers worth remembering: each one maps to a letter in TBATS.

Two more things close out that printout. Sigma is the residual standard deviation on the transformed scale, after the Box-Cox transform, the trend and the season have all been accounted for. AIC, the Akaike Information Criterion, is a single score that rewards a model for fitting well and penalizes it for using more parameters, lower is better, and it is exactly what `tbats()` minimizes while it searches.

That first line also carries a small piece of the S letter. Each pair inside the curly braces, `<24,11>` and `<168,6>`, names a seasonal period and how many sine-cosine pairs, called harmonics, the trigonometric state uses to draw that period's shape: more harmonics can trace a sharper, less smooth curve.

The exact same numbers come back close to five times faster by skipping straight to the one combination that search already found: Box-Cox on, no trend, no damped trend, ARMA errors on. Fit it that way instead, live on this page.

```r
# Fit tbats() directly with the combination the full search above already found, which is much faster
tbats_fit <- tbats(demand_msts, use.box.cox = TRUE, use.trend = FALSE,
                    use.damped.trend = FALSE, use.arma.errors = TRUE)
as.character(tbats_fit)
#> [1] "TBATS(0, {5,0}, -, {<24,11>, <168,6>})"
```

Same model spec, same numbers, a fraction of the time.

=== step === concept
## Reading the printed TBATS components

The fitted object `tbats_fit` holds every number from that printout by name, ready to pull out and lay beside its letter.

```r
# Pull each fitted number off tbats_fit by name, dropping any extra attributes
as.numeric(tbats_fit$lambda)
tbats_fit$alpha
tbats_fit$beta
tbats_fit$damping.parameter
tbats_fit$gamma.one.values
tbats_fit$gamma.two.values
tbats_fit$ar.coefficients
#> [1] 2.514725e-06
#> [1] 0.109172
#> NULL
#> NULL
#> [1] -8.533820e-05  7.221974e-06
#> [1] -0.0001178985  0.0001106449
#>          [,1]       [,2]       [,3]      [,4]       [,5]
#> [1,] 1.405546 -0.6294804 -0.2666134 0.5107192 -0.3215009
```

`beta` and `damping.parameter` both come back `NULL`. Among the combinations `tbats()` tried, the one without a separate trend got the lowest AIC, so no slope and no damping parameter exist in this fit at all: not zero, simply absent. Here is every one of those numbers laid beside its letter.

::widget styled-table {"cols":["Letter","What it is","Fitted value","What it means"],"rows":[["S","Seasonal periods","24, 168","the two cycles this fit models, taken straight from seasonal.periods"],["B","Box-Cox lambda","0.000003","close enough to 0 to act like a log transform, steadying the swing in demand across the day"],["T","Trend level (alpha)","0.1092","how much weight the smoothed level puts on the demand in each new hour, versus its own past estimate"],["T","Trend slope (beta)","not used","no separate climb or fall was found worth adding over these three weeks"],["T","Trend damping","not used","only applies when a slope is fit, so it does not apply here either"],["T","Trigonometric, 24h season (gamma-1)","-0.0000853, 0.0000072","how much the daily shape is nudged at every new hour"],["T","Trigonometric, 168h season (gamma-2)","-0.0001179, 0.0001106","how much the weekly shape is nudged at every new hour"],["A","ARMA errors (order 5 AR)","1.4055, -0.6295, -0.2666, 0.5107, -0.3215","the short-run autocorrelation left once trend and season are removed"]],"title":"Every number tbats_fit holds, mapped to its letter","note":"Two rows are marked not used: the search compared a version with a trend against a version without one, and the version without won on AIC."}

Read the table top to bottom and every letter in TBATS has now shown up in a real, fitted number. S is the pair 24 and 168. B is a lambda near 0. Both T's, level and slope and damping for Trend, and the two gamma pairs for Trigonometric, sit in the middle. A is the five AR coefficients at the bottom.

=== step === quiz
## Quick check: the five letters and what they fit

`tbats()` picked `TBATS(0, {5,0}, -, {<24,11>, <168,6>})` for this series.

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- B, because a lambda this close to zero is decorative and does not actually change the fit. ::no A lambda this close to zero means the search chose something very close to a log transform, not that Box-Cox did nothing. It still reshapes every value before anything else in the model is fit.
- T, the Trigonometric seasonal terms, because gamma updates each seasonal state every period. ::ok Right. Each seasonal period keeps its own pair of gamma values, and TBATS uses them to nudge that period's shape at every new hour, which is exactly what lets the shape drift instead of staying fixed.
- A, because the ARMA coefficients absorb any pattern left over in the series. ::no The ARMA errors model whatever short-run autocorrelation is left in the residuals once trend and season are removed. They do not touch how the seasonal shape itself moves.
- S, because adding more seasonal periods always means more drift. ::no The number of seasonal periods, S, says how many cycles are modeled at once, 24 and 168 here. It says nothing about whether any one of those cycles is allowed to drift, that is the gamma values under the Trigonometric letter.

=== step === concept
## Why a TBATS seasonal shape can drift and a Fourier term cannot

A Fourier term is a sine and cosine pair used to represent a repeating shape: a sharper seasonal pattern needs more such pairs, called harmonics, stacked together. In an ordinary regression, those sine and cosine coefficients get estimated once, from the whole series, and then stay exactly as fit for every hour the model ever forecasts.

TBATS's trigonometric seasonal state does not work that way. Its pair of numbers for each period, the gamma values already read off the fit, get used to nudge that period's shape at every single new hour, so the shape is free to shift slowly as more hours arrive, even inside a series as short as this one.

Plot the model's own level and seasonal components to see them laid out.

```r
# Plot the fitted model's own components: the level and each evolving seasonal state, across all 504 hours
tbats_comp <- tbats.components(tbats_fit)
plot(tbats_comp)
```

Four panels stack up: observed, level, season1 and season2. Observed is the same 504-hour line from the cover. Level sits far smoother, since the search found no trend worth fitting and alpha only shifts it a little each hour. Season1, the 24-hour cycle, repeats roughly the same daily shape across all three weeks, and season2, the 168-hour cycle, repeats roughly the same weekly shape. Look closely at season1 and no two days are drawn as an identical wave: gamma-1's tiny push, about -0.0000853 and 0.0000072, edges that shape a little at every one of the 504 hours, something a fixed Fourier term, with its one coefficient pair for the whole series, could never do.

That is the one structural difference this step set out to show. A Fourier regression term is two fixed numbers, chosen once for the whole series. TBATS's trigonometric seasonal state is a pair of numbers gamma updates every single hour, so its shape stays free to drift as more hours arrive, even when that drift is small over any one three-week window.

=== step === concept
## Forecasting with the fitted model

`forecast()` works on a tbats fit the same way it works on any other forecast package model: give it the fit and how many periods ahead to go, `h`, and it returns a point forecast with an interval around each point.

```r
# Forecast 48 hours past the last observed hour, then look at the first and last of them
tbats_fc <- forecast(tbats_fit, h = 48)

forecast_table <- data.frame(
  Hour = 505:552,
  PointForecast = round(as.numeric(tbats_fc$mean), 1),
  Lo95 = round(as.numeric(tbats_fc$lower[, "95%"]), 1),
  Hi95 = round(as.numeric(tbats_fc$upper[, "95%"]), 1)
)

head(forecast_table, 3)
tail(forecast_table, 3)
#>   Hour PointForecast   Lo95   Hi95
#> 1  505        4401.1 4279.5 4526.2
#> 2  506        4154.3 3948.3 4370.9
#> 3  507        3913.3 3656.4 4188.3
#>    Hour PointForecast   Lo95   Hi95
#> 46  550        5432.1 4905.1 6015.6
#> 47  551        5113.1 4614.7 5665.3
#> 48  552        5237.7 4724.7 5806.3
```

`Lo95` and `Hi95` are the bottom and top of the 95 percent prediction interval, the range expected to hold the real demand 95 times out of 100 if the model is right. See both the history and the forecast on one hour axis.

::widget chart-plotter {"data":[{"x":1,"y":4164.2,"fill":"history"},{"x":2,"y":3922.1,"fill":"history"},{"x":3,"y":3650.7,"fill":"history"},{"x":4,"y":3507.8,"fill":"history"},{"x":5,"y":3506.4,"fill":"history"},{"x":6,"y":3825.1,"fill":"history"},{"x":7,"y":4496.6,"fill":"history"},{"x":8,"y":5137.1,"fill":"history"},{"x":9,"y":5617.1,"fill":"history"},{"x":10,"y":5758.7,"fill":"history"},{"x":11,"y":5667.6,"fill":"history"},{"x":12,"y":5567.4,"fill":"history"},{"x":13,"y":5456,"fill":"history"},{"x":14,"y":5433.7,"fill":"history"},{"x":15,"y":5469.3,"fill":"history"},{"x":16,"y":5454.5,"fill":"history"},{"x":17,"y":5563.7,"fill":"history"},{"x":18,"y":6022.9,"fill":"history"},{"x":19,"y":6044.9,"fill":"history"},{"x":20,"y":5691.8,"fill":"history"},{"x":21,"y":5366.5,"fill":"history"},{"x":22,"y":4985,"fill":"history"},{"x":23,"y":4647.9,"fill":"history"},{"x":24,"y":4761.1,"fill":"history"},{"x":25,"y":4345.4,"fill":"history"},{"x":26,"y":4078.1,"fill":"history"},{"x":27,"y":3808.3,"fill":"history"},{"x":28,"y":3628.8,"fill":"history"},{"x":29,"y":3619.8,"fill":"history"},{"x":30,"y":3893.2,"fill":"history"},{"x":31,"y":4584.7,"fill":"history"},{"x":32,"y":5185.3,"fill":"history"},{"x":33,"y":5538.3,"fill":"history"},{"x":34,"y":5503.3,"fill":"history"},{"x":35,"y":5328.6,"fill":"history"},{"x":36,"y":5188.7,"fill":"history"},{"x":37,"y":5107.4,"fill":"history"},{"x":38,"y":5104,"fill":"history"},{"x":39,"y":5070.8,"fill":"history"},{"x":40,"y":5074.5,"fill":"history"},{"x":41,"y":5236.4,"fill":"history"},{"x":42,"y":5770.9,"fill":"history"},{"x":43,"y":5903,"fill":"history"},{"x":44,"y":5644.4,"fill":"history"},{"x":45,"y":5364.4,"fill":"history"},{"x":46,"y":5017.7,"fill":"history"},{"x":47,"y":4716.4,"fill":"history"},{"x":48,"y":4822.9,"fill":"history"},{"x":49,"y":4396,"fill":"history"},{"x":50,"y":4107.1,"fill":"history"},{"x":51,"y":3817.1,"fill":"history"},{"x":52,"y":3633.1,"fill":"history"},{"x":53,"y":3623.3,"fill":"history"},{"x":54,"y":3916.9,"fill":"history"},{"x":55,"y":4693.9,"fill":"history"},{"x":56,"y":5270.2,"fill":"history"},{"x":57,"y":5608.3,"fill":"history"},{"x":58,"y":5538.4,"fill":"history"},{"x":59,"y":5328.5,"fill":"history"},{"x":60,"y":5186.3,"fill":"history"},{"x":61,"y":5089.3,"fill":"history"},{"x":62,"y":5089,"fill":"history"},{"x":63,"y":5058.4,"fill":"history"},{"x":64,"y":5072.8,"fill":"history"},{"x":65,"y":5238.7,"fill":"history"},{"x":66,"y":5859.1,"fill":"history"},{"x":67,"y":6086,"fill":"history"},{"x":68,"y":5783,"fill":"history"},{"x":69,"y":5522.8,"fill":"history"},{"x":70,"y":5141,"fill":"history"},{"x":71,"y":4811.8,"fill":"history"},{"x":72,"y":4915.7,"fill":"history"},{"x":73,"y":4509.5,"fill":"history"},{"x":74,"y":4226.3,"fill":"history"},{"x":75,"y":3914,"fill":"history"},{"x":76,"y":3672.2,"fill":"history"},{"x":77,"y":3633.9,"fill":"history"},{"x":78,"y":3903.5,"fill":"history"},{"x":79,"y":4690,"fill":"history"},{"x":80,"y":5317.8,"fill":"history"},{"x":81,"y":5717.9,"fill":"history"},{"x":82,"y":5744.6,"fill":"history"},{"x":83,"y":5735.7,"fill":"history"},{"x":84,"y":5737.6,"fill":"history"},{"x":85,"y":5710.9,"fill":"history"},{"x":86,"y":5682,"fill":"history"},{"x":87,"y":5552.2,"fill":"history"},{"x":88,"y":5544.1,"fill":"history"},{"x":89,"y":5684.7,"fill":"history"},{"x":90,"y":6133,"fill":"history"},{"x":91,"y":6208.4,"fill":"history"},{"x":92,"y":5872.9,"fill":"history"},{"x":93,"y":5588.1,"fill":"history"},{"x":94,"y":5150.4,"fill":"history"},{"x":95,"y":4813.9,"fill":"history"},{"x":96,"y":4907.4,"fill":"history"},{"x":97,"y":4449,"fill":"history"},{"x":98,"y":4149,"fill":"history"},{"x":99,"y":3808.6,"fill":"history"},{"x":100,"y":3678.1,"fill":"history"},{"x":101,"y":3670.5,"fill":"history"},{"x":102,"y":3931.8,"fill":"history"},{"x":103,"y":4682.7,"fill":"history"},{"x":104,"y":5308.3,"fill":"history"},{"x":105,"y":5765.5,"fill":"history"},{"x":106,"y":5774.7,"fill":"history"},{"x":107,"y":5569,"fill":"history"},{"x":108,"y":5457.6,"fill":"history"},{"x":109,"y":5458.6,"fill":"history"},{"x":110,"y":5475.4,"fill":"history"},{"x":111,"y":5436.9,"fill":"history"},{"x":112,"y":5413.3,"fill":"history"},{"x":113,"y":5503,"fill":"history"},{"x":114,"y":5979.7,"fill":"history"},{"x":115,"y":6115.1,"fill":"history"},{"x":116,"y":5800.2,"fill":"history"},{"x":117,"y":5539.8,"fill":"history"},{"x":118,"y":5175,"fill":"history"},{"x":119,"y":4905.7,"fill":"history"},{"x":120,"y":5047.9,"fill":"history"},{"x":121,"y":4600,"fill":"history"},{"x":122,"y":4264,"fill":"history"},{"x":123,"y":3850.4,"fill":"history"},{"x":124,"y":3587.7,"fill":"history"},{"x":125,"y":3498.9,"fill":"history"},{"x":126,"y":3571.8,"fill":"history"},{"x":127,"y":3859.8,"fill":"history"},{"x":128,"y":4142.4,"fill":"history"},{"x":129,"y":4579.5,"fill":"history"},{"x":130,"y":4739.8,"fill":"history"},{"x":131,"y":4650.1,"fill":"history"},{"x":132,"y":4518.1,"fill":"history"},{"x":133,"y":4512.3,"fill":"history"},{"x":134,"y":4501.1,"fill":"history"},{"x":135,"y":4455,"fill":"history"},{"x":136,"y":4536.3,"fill":"history"},{"x":137,"y":4825.2,"fill":"history"},{"x":138,"y":5418.5,"fill":"history"},{"x":139,"y":5561.2,"fill":"history"},{"x":140,"y":5286.7,"fill":"history"},{"x":141,"y":5042.9,"fill":"history"},{"x":142,"y":4798,"fill":"history"},{"x":143,"y":4669.8,"fill":"history"},{"x":144,"y":4852.5,"fill":"history"},{"x":145,"y":4505.5,"fill":"history"},{"x":146,"y":4152.2,"fill":"history"},{"x":147,"y":3767.9,"fill":"history"},{"x":148,"y":3536.9,"fill":"history"},{"x":149,"y":3435.2,"fill":"history"},{"x":150,"y":3467.2,"fill":"history"},{"x":151,"y":3650.9,"fill":"history"},{"x":152,"y":3818.6,"fill":"history"},{"x":153,"y":4214.5,"fill":"history"},{"x":154,"y":4428.4,"fill":"history"},{"x":155,"y":4417.7,"fill":"history"},{"x":156,"y":4345.5,"fill":"history"},{"x":157,"y":4308.3,"fill":"history"},{"x":158,"y":4313.2,"fill":"history"},{"x":159,"y":4329.4,"fill":"history"},{"x":160,"y":4479,"fill":"history"},{"x":161,"y":4817.5,"fill":"history"},{"x":162,"y":5414.4,"fill":"history"},{"x":163,"y":5636.8,"fill":"history"},{"x":164,"y":5439.9,"fill":"history"},{"x":165,"y":5237,"fill":"history"},{"x":166,"y":4914.3,"fill":"history"},{"x":167,"y":4645.4,"fill":"history"},{"x":168,"y":4781.3,"fill":"history"},{"x":169,"y":4443.9,"fill":"history"},{"x":170,"y":4174.4,"fill":"history"},{"x":171,"y":3850.8,"fill":"history"},{"x":172,"y":3667.8,"fill":"history"},{"x":173,"y":3666.8,"fill":"history"},{"x":174,"y":3995.2,"fill":"history"},{"x":175,"y":4794,"fill":"history"},{"x":176,"y":5534.7,"fill":"history"},{"x":177,"y":6071.2,"fill":"history"},{"x":178,"y":6142.1,"fill":"history"},{"x":179,"y":5888.1,"fill":"history"},{"x":180,"y":5655.2,"fill":"history"},{"x":181,"y":5517.5,"fill":"history"},{"x":182,"y":5542.9,"fill":"history"},{"x":183,"y":5509.8,"fill":"history"},{"x":184,"y":5533.3,"fill":"history"},{"x":185,"y":5707.1,"fill":"history"},{"x":186,"y":6298.7,"fill":"history"},{"x":187,"y":6489.6,"fill":"history"},{"x":188,"y":6153.6,"fill":"history"},{"x":189,"y":5879,"fill":"history"},{"x":190,"y":5493,"fill":"history"},{"x":191,"y":5045.8,"fill":"history"},{"x":192,"y":5127.3,"fill":"history"},{"x":193,"y":4787.7,"fill":"history"},{"x":194,"y":4462.4,"fill":"history"},{"x":195,"y":4127.4,"fill":"history"},{"x":196,"y":3934.3,"fill":"history"},{"x":197,"y":3927.8,"fill":"history"},{"x":198,"y":4250.5,"fill":"history"},{"x":199,"y":5120,"fill":"history"},{"x":200,"y":5898.9,"fill":"history"},{"x":201,"y":6376.9,"fill":"history"},{"x":202,"y":6359.4,"fill":"history"},{"x":203,"y":6092.6,"fill":"history"},{"x":204,"y":5821.1,"fill":"history"},{"x":205,"y":5613.8,"fill":"history"},{"x":206,"y":5567.2,"fill":"history"},{"x":207,"y":5508.7,"fill":"history"},{"x":208,"y":5539.2,"fill":"history"},{"x":209,"y":5773.1,"fill":"history"},{"x":210,"y":6425.9,"fill":"history"},{"x":211,"y":6651.8,"fill":"history"},{"x":212,"y":6395.9,"fill":"history"},{"x":213,"y":6093.8,"fill":"history"},{"x":214,"y":5689.9,"fill":"history"},{"x":215,"y":5167.4,"fill":"history"},{"x":216,"y":5230.5,"fill":"history"},{"x":217,"y":4818.4,"fill":"history"},{"x":218,"y":4480.4,"fill":"history"},{"x":219,"y":4179.5,"fill":"history"},{"x":220,"y":3984,"fill":"history"},{"x":221,"y":3973.3,"fill":"history"},{"x":222,"y":4298.9,"fill":"history"},{"x":223,"y":5153.8,"fill":"history"},{"x":224,"y":5902.4,"fill":"history"},{"x":225,"y":6382.2,"fill":"history"},{"x":226,"y":6365.9,"fill":"history"},{"x":227,"y":6043.4,"fill":"history"},{"x":228,"y":5764.7,"fill":"history"},{"x":229,"y":5538.4,"fill":"history"},{"x":230,"y":5485.3,"fill":"history"},{"x":231,"y":5393.2,"fill":"history"},{"x":232,"y":5400.4,"fill":"history"},{"x":233,"y":5588.7,"fill":"history"},{"x":234,"y":6234.4,"fill":"history"},{"x":235,"y":6506.9,"fill":"history"},{"x":236,"y":6240.6,"fill":"history"},{"x":237,"y":5971.2,"fill":"history"},{"x":238,"y":5596.1,"fill":"history"},{"x":239,"y":5161.7,"fill":"history"},{"x":240,"y":5201.4,"fill":"history"},{"x":241,"y":4764.4,"fill":"history"},{"x":242,"y":4409.1,"fill":"history"},{"x":243,"y":4112.4,"fill":"history"},{"x":244,"y":3938.1,"fill":"history"},{"x":245,"y":3916.4,"fill":"history"},{"x":246,"y":4240.6,"fill":"history"},{"x":247,"y":5066.9,"fill":"history"},{"x":248,"y":5806.5,"fill":"history"},{"x":249,"y":6313.2,"fill":"history"},{"x":250,"y":6367.9,"fill":"history"},{"x":251,"y":6177.3,"fill":"history"},{"x":252,"y":5960.7,"fill":"history"},{"x":253,"y":5723.8,"fill":"history"},{"x":254,"y":5637.1,"fill":"history"},{"x":255,"y":5494,"fill":"history"},{"x":256,"y":5465,"fill":"history"},{"x":257,"y":5638.9,"fill":"history"},{"x":258,"y":6259.6,"fill":"history"},{"x":259,"y":6484.6,"fill":"history"},{"x":260,"y":6257,"fill":"history"},{"x":261,"y":6020.1,"fill":"history"},{"x":262,"y":5551.8,"fill":"history"},{"x":263,"y":5188.1,"fill":"history"},{"x":264,"y":5263.3,"fill":"history"},{"x":265,"y":4804.6,"fill":"history"},{"x":266,"y":4474.1,"fill":"history"},{"x":267,"y":4119.2,"fill":"history"},{"x":268,"y":3881.8,"fill":"history"},{"x":269,"y":3881.8,"fill":"history"},{"x":270,"y":4204.2,"fill":"history"},{"x":271,"y":4958.3,"fill":"history"},{"x":272,"y":5642,"fill":"history"},{"x":273,"y":6129.3,"fill":"history"},{"x":274,"y":6064.4,"fill":"history"},{"x":275,"y":5733.7,"fill":"history"},{"x":276,"y":5518.8,"fill":"history"},{"x":277,"y":5344.1,"fill":"history"},{"x":278,"y":5277,"fill":"history"},{"x":279,"y":5229.9,"fill":"history"},{"x":280,"y":5240.4,"fill":"history"},{"x":281,"y":5400.5,"fill":"history"},{"x":282,"y":5942,"fill":"history"},{"x":283,"y":6069.7,"fill":"history"},{"x":284,"y":5754.1,"fill":"history"},{"x":285,"y":5509.9,"fill":"history"},{"x":286,"y":5139.4,"fill":"history"},{"x":287,"y":4863,"fill":"history"},{"x":288,"y":5029.8,"fill":"history"},{"x":289,"y":4567.4,"fill":"history"},{"x":290,"y":4178.8,"fill":"history"},{"x":291,"y":3805.9,"fill":"history"},{"x":292,"y":3550.9,"fill":"history"},{"x":293,"y":3455.2,"fill":"history"},{"x":294,"y":3568,"fill":"history"},{"x":295,"y":3852.3,"fill":"history"},{"x":296,"y":4121.9,"fill":"history"},{"x":297,"y":4612.8,"fill":"history"},{"x":298,"y":4898.1,"fill":"history"},{"x":299,"y":4885.8,"fill":"history"},{"x":300,"y":4819.9,"fill":"history"},{"x":301,"y":4755,"fill":"history"},{"x":302,"y":4744.2,"fill":"history"},{"x":303,"y":4708.5,"fill":"history"},{"x":304,"y":4749.4,"fill":"history"},{"x":305,"y":4980,"fill":"history"},{"x":306,"y":5474.8,"fill":"history"},{"x":307,"y":5508.6,"fill":"history"},{"x":308,"y":5197.4,"fill":"history"},{"x":309,"y":4953.3,"fill":"history"},{"x":310,"y":4687.2,"fill":"history"},{"x":311,"y":4540.9,"fill":"history"},{"x":312,"y":4745.5,"fill":"history"},{"x":313,"y":4354.3,"fill":"history"},{"x":314,"y":4006.5,"fill":"history"},{"x":315,"y":3631.3,"fill":"history"},{"x":316,"y":3430.8,"fill":"history"},{"x":317,"y":3277.6,"fill":"history"},{"x":318,"y":3256.3,"fill":"history"},{"x":319,"y":3394.1,"fill":"history"},{"x":320,"y":3566.6,"fill":"history"},{"x":321,"y":3981.4,"fill":"history"},{"x":322,"y":4348.9,"fill":"history"},{"x":323,"y":4521.3,"fill":"history"},{"x":324,"y":4567.5,"fill":"history"},{"x":325,"y":4576.6,"fill":"history"},{"x":326,"y":4561.5,"fill":"history"},{"x":327,"y":4505.6,"fill":"history"},{"x":328,"y":4564.5,"fill":"history"},{"x":329,"y":4716,"fill":"history"},{"x":330,"y":5249.6,"fill":"history"},{"x":331,"y":5477.2,"fill":"history"},{"x":332,"y":5216,"fill":"history"},{"x":333,"y":4973.7,"fill":"history"},{"x":334,"y":4617.8,"fill":"history"},{"x":335,"y":4362.5,"fill":"history"},{"x":336,"y":4515.9,"fill":"history"},{"x":337,"y":4150.7,"fill":"history"},{"x":338,"y":3853.3,"fill":"history"},{"x":339,"y":3552.6,"fill":"history"},{"x":340,"y":3392.3,"fill":"history"},{"x":341,"y":3391.8,"fill":"history"},{"x":342,"y":3708.6,"fill":"history"},{"x":343,"y":4523.1,"fill":"history"},{"x":344,"y":5321.7,"fill":"history"},{"x":345,"y":5716.5,"fill":"history"},{"x":346,"y":5656.6,"fill":"history"},{"x":347,"y":5448.4,"fill":"history"},{"x":348,"y":5326.2,"fill":"history"},{"x":349,"y":5274.5,"fill":"history"},{"x":350,"y":5277,"fill":"history"},{"x":351,"y":5253.1,"fill":"history"},{"x":352,"y":5249.3,"fill":"history"},{"x":353,"y":5418.1,"fill":"history"},{"x":354,"y":5882.6,"fill":"history"},{"x":355,"y":6050.9,"fill":"history"},{"x":356,"y":5707.8,"fill":"history"},{"x":357,"y":5408.6,"fill":"history"},{"x":358,"y":5005.8,"fill":"history"},{"x":359,"y":4591.9,"fill":"history"},{"x":360,"y":4751.2,"fill":"history"},{"x":361,"y":4351.4,"fill":"history"},{"x":362,"y":4010,"fill":"history"},{"x":363,"y":3710.9,"fill":"history"},{"x":364,"y":3516.7,"fill":"history"},{"x":365,"y":3523.8,"fill":"history"},{"x":366,"y":3835.6,"fill":"history"},{"x":367,"y":4674.5,"fill":"history"},{"x":368,"y":5479.7,"fill":"history"},{"x":369,"y":5722.9,"fill":"history"},{"x":370,"y":5643.4,"fill":"history"},{"x":371,"y":5470,"fill":"history"},{"x":372,"y":5334.9,"fill":"history"},{"x":373,"y":5317,"fill":"history"},{"x":374,"y":5342,"fill":"history"},{"x":375,"y":5274.5,"fill":"history"},{"x":376,"y":5236.8,"fill":"history"},{"x":377,"y":5409.8,"fill":"history"},{"x":378,"y":5972.9,"fill":"history"},{"x":379,"y":6064.9,"fill":"history"},{"x":380,"y":5740.5,"fill":"history"},{"x":381,"y":5445.6,"fill":"history"},{"x":382,"y":5017.8,"fill":"history"},{"x":383,"y":4640.6,"fill":"history"},{"x":384,"y":4774.7,"fill":"history"},{"x":385,"y":4354.4,"fill":"history"},{"x":386,"y":4043.1,"fill":"history"},{"x":387,"y":3738.6,"fill":"history"},{"x":388,"y":3537.6,"fill":"history"},{"x":389,"y":3541.1,"fill":"history"},{"x":390,"y":3854.1,"fill":"history"},{"x":391,"y":4676,"fill":"history"},{"x":392,"y":5440.2,"fill":"history"},{"x":393,"y":5736.5,"fill":"history"},{"x":394,"y":5661,"fill":"history"},{"x":395,"y":5505.9,"fill":"history"},{"x":396,"y":5384.8,"fill":"history"},{"x":397,"y":5269.3,"fill":"history"},{"x":398,"y":5244.9,"fill":"history"},{"x":399,"y":5183.1,"fill":"history"},{"x":400,"y":5117.4,"fill":"history"},{"x":401,"y":5258.9,"fill":"history"},{"x":402,"y":5785.3,"fill":"history"},{"x":403,"y":5978.9,"fill":"history"},{"x":404,"y":5678.3,"fill":"history"},{"x":405,"y":5377.6,"fill":"history"},{"x":406,"y":4988.4,"fill":"history"},{"x":407,"y":4633,"fill":"history"},{"x":408,"y":4736.6,"fill":"history"},{"x":409,"y":4330.3,"fill":"history"},{"x":410,"y":4009.6,"fill":"history"},{"x":411,"y":3667.1,"fill":"history"},{"x":412,"y":3485.1,"fill":"history"},{"x":413,"y":3469.6,"fill":"history"},{"x":414,"y":3744.2,"fill":"history"},{"x":415,"y":4512.3,"fill":"history"},{"x":416,"y":5183,"fill":"history"},{"x":417,"y":5359.7,"fill":"history"},{"x":418,"y":5320.1,"fill":"history"},{"x":419,"y":5234.1,"fill":"history"},{"x":420,"y":5166.5,"fill":"history"},{"x":421,"y":5098.8,"fill":"history"},{"x":422,"y":5103,"fill":"history"},{"x":423,"y":5130.3,"fill":"history"},{"x":424,"y":5221,"fill":"history"},{"x":425,"y":5437.4,"fill":"history"},{"x":426,"y":5679.5,"fill":"history"},{"x":427,"y":5831.5,"fill":"history"},{"x":428,"y":5518.1,"fill":"history"},{"x":429,"y":5221,"fill":"history"},{"x":430,"y":4797.5,"fill":"history"},{"x":431,"y":4465.9,"fill":"history"},{"x":432,"y":4633.9,"fill":"history"},{"x":433,"y":4196.4,"fill":"history"},{"x":434,"y":3881.1,"fill":"history"},{"x":435,"y":3569.2,"fill":"history"},{"x":436,"y":3401.6,"fill":"history"},{"x":437,"y":3387.4,"fill":"history"},{"x":438,"y":3684.1,"fill":"history"},{"x":439,"y":4415.9,"fill":"history"},{"x":440,"y":5093.2,"fill":"history"},{"x":441,"y":5313.9,"fill":"history"},{"x":442,"y":5309.7,"fill":"history"},{"x":443,"y":5237.3,"fill":"history"},{"x":444,"y":5174.6,"fill":"history"},{"x":445,"y":5081.4,"fill":"history"},{"x":446,"y":5029.6,"fill":"history"},{"x":447,"y":4932.1,"fill":"history"},{"x":448,"y":4919,"fill":"history"},{"x":449,"y":5147.8,"fill":"history"},{"x":450,"y":5664.4,"fill":"history"},{"x":451,"y":5811.4,"fill":"history"},{"x":452,"y":5543.3,"fill":"history"},{"x":453,"y":5290.5,"fill":"history"},{"x":454,"y":4946.7,"fill":"history"},{"x":455,"y":4685.5,"fill":"history"},{"x":456,"y":4878.6,"fill":"history"},{"x":457,"y":4429.5,"fill":"history"},{"x":458,"y":4027.2,"fill":"history"},{"x":459,"y":3684.4,"fill":"history"},{"x":460,"y":3460.5,"fill":"history"},{"x":461,"y":3406,"fill":"history"},{"x":462,"y":3504.5,"fill":"history"},{"x":463,"y":3800.2,"fill":"history"},{"x":464,"y":4117.3,"fill":"history"},{"x":465,"y":4589.8,"fill":"history"},{"x":466,"y":4848.8,"fill":"history"},{"x":467,"y":4857.2,"fill":"history"},{"x":468,"y":4938.4,"fill":"history"},{"x":469,"y":5042.4,"fill":"history"},{"x":470,"y":5091.1,"fill":"history"},{"x":471,"y":5067.9,"fill":"history"},{"x":472,"y":5148.6,"fill":"history"},{"x":473,"y":5273.4,"fill":"history"},{"x":474,"y":5676,"fill":"history"},{"x":475,"y":5817.3,"fill":"history"},{"x":476,"y":5507.5,"fill":"history"},{"x":477,"y":5249.5,"fill":"history"},{"x":478,"y":4986.5,"fill":"history"},{"x":479,"y":4799.7,"fill":"history"},{"x":480,"y":4975.3,"fill":"history"},{"x":481,"y":4622.4,"fill":"history"},{"x":482,"y":4235.3,"fill":"history"},{"x":483,"y":3832.9,"fill":"history"},{"x":484,"y":3567.4,"fill":"history"},{"x":485,"y":3475.8,"fill":"history"},{"x":486,"y":3518.1,"fill":"history"},{"x":487,"y":3703.3,"fill":"history"},{"x":488,"y":3896.6,"fill":"history"},{"x":489,"y":4339.6,"fill":"history"},{"x":490,"y":4584.2,"fill":"history"},{"x":491,"y":4560,"fill":"history"},{"x":492,"y":4446.8,"fill":"history"},{"x":493,"y":4381.3,"fill":"history"},{"x":494,"y":4389,"fill":"history"},{"x":495,"y":4399.5,"fill":"history"},{"x":496,"y":4540.2,"fill":"history"},{"x":497,"y":4849.3,"fill":"history"},{"x":498,"y":5524.1,"fill":"history"},{"x":499,"y":5880.2,"fill":"history"},{"x":500,"y":5661.6,"fill":"history"},{"x":501,"y":5443.9,"fill":"history"},{"x":502,"y":5074.6,"fill":"history"},{"x":503,"y":4667.6,"fill":"history"},{"x":504,"y":4751,"fill":"history"},{"x":505,"y":4401.1,"fill":"forecast"},{"x":506,"y":4154.3,"fill":"forecast"},{"x":507,"y":3913.3,"fill":"forecast"},{"x":508,"y":3772,"fill":"forecast"},{"x":509,"y":3822.6,"fill":"forecast"},{"x":510,"y":4133.6,"fill":"forecast"},{"x":511,"y":4887.8,"fill":"forecast"},{"x":512,"y":5526.8,"fill":"forecast"},{"x":513,"y":6031.8,"fill":"forecast"},{"x":514,"y":6094.1,"fill":"forecast"},{"x":515,"y":5957,"fill":"forecast"},{"x":516,"y":5769.2,"fill":"forecast"},{"x":517,"y":5658.5,"fill":"forecast"},{"x":518,"y":5575.2,"fill":"forecast"},{"x":519,"y":5507.2,"fill":"forecast"},{"x":520,"y":5483.6,"fill":"forecast"},{"x":521,"y":5687.7,"fill":"forecast"},{"x":522,"y":6222.3,"fill":"forecast"},{"x":523,"y":6419.7,"fill":"forecast"},{"x":524,"y":6088,"fill":"forecast"},{"x":525,"y":5834.3,"fill":"forecast"},{"x":526,"y":5430.9,"fill":"forecast"},{"x":527,"y":5121.2,"fill":"forecast"},{"x":528,"y":5252.6,"fill":"forecast"},{"x":529,"y":4852.4,"fill":"forecast"},{"x":530,"y":4494.9,"fill":"forecast"},{"x":531,"y":4162,"fill":"forecast"},{"x":532,"y":3937,"fill":"forecast"},{"x":533,"y":3922.1,"fill":"forecast"},{"x":534,"y":4163,"fill":"forecast"},{"x":535,"y":4849.7,"fill":"forecast"},{"x":536,"y":5428.3,"fill":"forecast"},{"x":537,"y":5902.5,"fill":"forecast"},{"x":538,"y":5966.3,"fill":"forecast"},{"x":539,"y":5853.1,"fill":"forecast"},{"x":540,"y":5697.6,"fill":"forecast"},{"x":541,"y":5622.4,"fill":"forecast"},{"x":542,"y":5572,"fill":"forecast"},{"x":543,"y":5530.4,"fill":"forecast"},{"x":544,"y":5523.2,"fill":"forecast"},{"x":545,"y":5736,"fill":"forecast"},{"x":546,"y":6273.2,"fill":"forecast"},{"x":547,"y":6463.4,"fill":"forecast"},{"x":548,"y":6116.8,"fill":"forecast"},{"x":549,"y":5848.4,"fill":"forecast"},{"x":550,"y":5432.1,"fill":"forecast"},{"x":551,"y":5113.1,"fill":"forecast"},{"x":552,"y":5237.7,"fill":"forecast"}],"geoms":["point","line"],"x":"Hour","y":"Demand"}

The forecast picks up right where hour 504 left off and keeps both the daily climb-and-fall and the slower weekly rise-and-fall going for another 48 hours. But the interval is not the same width all the way through. At hour 505, Lo95 to Hi95 runs 4279.5 to 4526.2, a band of about 247 MW. By hour 552, the last forecasted hour, that band has widened to 4724.7 to 5806.3, about 1082 MW. The interval grows because the model is less sure about demand the further ahead it looks.

=== step === concept
## What the automatic search costs, and when it is worth paying

`tbats()`'s default call searches over several combinations before settling on one model, and that search itself takes real time, about 40 seconds on an ordinary machine, still too slow to run live on this page. Time it directly:

```r-static
# Time the default full search, with nothing specified
system.time(tbats(demand_msts))
#>    user  system elapsed 
#>   40.88    0.64   42.58 
```

Now time one call with every one of those axes set explicitly and no search at all, live on this page:

```r
# Time one call with every search axis set explicitly and no search
system.time(tbats_fixed <- tbats(demand_msts, use.box.cox = TRUE, use.trend = FALSE,
                                  use.damped.trend = FALSE, use.arma.errors = TRUE))
#>    user  system elapsed 
#>    8.20    0.20    8.94 
```

`elapsed` is real wall-clock seconds on the machine that ran each one, so the exact numbers will move around on a different machine, but the gap between them holds up: the default search took close to 4.8 times as long as the fixed call just timed above. That fixed call skipped searching over Box-Cox on and off, trend on and off, and damped trend on and off, since all three were set explicitly up front, and it still landed on the same `TBATS(0, {5,0}, -, {<24,11>, <168,6>})` the default search found.

::widget styled-table {"cols":["Method","Elapsed time (s)","Takes external regressors","How the seasonal shape is chosen","Does the shape drift over time"],"rows":[["TBATS, default (full search)","42.6","No","found automatically, harmonic count k chosen per period by AIC","Yes, gamma updates it every hour"],["TBATS, fixed (no search)","8.9","No","same automatic choice, only box-cox, trend, damped trend and ARMA errors are skipped","Yes, gamma updates it every hour"],["Dynamic harmonic regression","not fit in this lesson","Yes","harmonic count K chosen by hand, checked against AIC","No, fixed for the whole series"]],"title":"Two tbats() timings against one fixed configuration, and where dynamic harmonic regression differs","note":"The default search took close to 4.8 times as long as the fixed call here, and that gap grows with every seasonal period TBATS has to search over."}

Dynamic harmonic regression pairs a handful of sine and cosine terms, its harmonic count called K, with an ARIMA model for the short-run errors. Unlike TBATS, it can take external regressors, a predictor like temperature or a holiday flag, alongside those Fourier terms, and it fits in one pass once K is chosen, whether picked by hand or checked by comparing AIC across a few candidate values. TBATS never takes an external regressor at all, no matter how the search is configured, and its own search grows with every seasonal period added, since each one gets its own harmonic count and gamma pair to search over.

So the choice comes down to what the series actually needs. A series with no external predictor, where letting the seasonal shape drift over a long history matters, favors TBATS despite the fitting cost. A series that needs a predictor like temperature in the model at all, or where a fixed seasonal shape is close enough, favors dynamic harmonic regression instead.

=== step === quiz
## Quick check: reading the fitting-time evidence

The default `tbats()` search took about 42.6 seconds against 8.9 seconds for one fixed configuration, roughly 4.8 times longer, and TBATS takes no external regressors at all. Victoria's grid operator wants next-hour demand forecasts refit constantly, and it wants temperature in the model as a predictor.

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- TBATS, because its seasonal state adapts over time and that is always worth the extra fitting time. ::no TBATS's adapting seasonal state is real, but it says nothing about whether the model can take an external regressor. Here temperature has to be in the model, and TBATS has no way to take it at all.
- Dynamic harmonic regression, because it accepts temperature as an external regressor and fits directly without searching axes. ::ok Right. TBATS cannot take temperature no matter how it is configured, and refitting it constantly at close to five times the cost of one fixed configuration is a real ongoing expense dynamic harmonic regression does not carry.
- TBATS, because a slower fit is generally the more careful, more accurate one. ::no A slower fit here only means more configurations were tried before picking the one with the lowest AIC. It says nothing about accuracy, and it says nothing about whether the model can even use the predictor this operator needs.
- Dynamic harmonic regression, because it is always faster to fit than TBATS regardless of the series. ::no Dynamic harmonic regression fits in one pass instead of searching several configurations, so it usually costs less to fit. But always faster regardless of the series overstates what this one timing comparison actually measured.

=== step === tryit
## Your turn: forecast 48 hours from the TBATS fit

`tbats_fit` still holds the fitted model, ready to forecast from.

```r
# tbats_fit holds the fitted TBATS model.
# Complete the call that forecasts 48 hours ahead from tbats_fit.
# One line. Press Check when you have it.
```
::check {"regex": "forecast[(]\\s*tbats_fit\\s*,\\s*h\\s*=\\s*48\\s*[)]", "gate": true, "difficulty": "intermediate", "ok": "Right, forecast(tbats_fit, h = 48) extends the series 48 hours past hour 504, with the same 80 and 95 percent intervals already read.", "no": "Call forecast() on tbats_fit with h set to 48: forecast(tbats_fit, h = 48)."}
::solution
```r
# Forecast 48 hours ahead from tbats_fit, then check the first and last hour
tbats_fc <- forecast(tbats_fit, h = 48)
round(as.numeric(tbats_fc$mean)[c(1, 48)], 1)
#> [1] 4401.1 5237.7
```

The first and last of the 48 forecasted hours, 4401.1 and 5237.7, match the top and bottom rows of `forecast_table`.

=== step === concept
## References

- De Livera, A.M., Hyndman, R.J. and Snyder, R.D. (2011), "Forecasting Time Series With Complex Seasonal Patterns Using Exponential Smoothing," Journal of the American Statistical Association, 106(496). The paper that introduced the TBATS state-space model.
- [Forecasting: Principles and Practice (3rd ed.)](https://otexts.com/fpp3/) - Hyndman, R.J. and Athanasopoulos, G. Complex seasonality and TBATS in the advanced forecasting chapter.
- [forecast package reference](https://pkg.robjhyndman.com/forecast/) - documentation for `tbats()`, `msts()`, and `forecast()`.
- [tsibbledata::vic_elec documentation](https://tsibbledata.tidyverts.org/reference/vic_elec.html) - source of the half-hourly Victorian electricity demand aggregated to hourly totals here, from the Australian Energy Market Operator.

=== step === complete
## What you can do now

You can name every letter in TBATS and what each one controls: T for the trigonometric seasonal terms that let a seasonal shape drift, B for the Box-Cox transform that steadies the variance, A for the ARMA errors left after trend and season are removed, T for the trend's level, slope and damping, and S for however many seasonal periods the series carries.

You can build an `msts()` object carrying two seasonal periods, fit `tbats()` on it, and read off a point forecast with its interval using `forecast()`.

You can weigh TBATS against dynamic harmonic regression using real evidence: a measured fitting-time gap, TBATS's inability to take external regressors, and the trade-off between a seasonal shape that can drift and one that stays fixed for the whole series.
