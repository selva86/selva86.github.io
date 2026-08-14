---
title: "ARIMA: what AR, I, and MA actually mean"
slug: "ARIMA-Mini-1"
catalog_blurb: "What AR, I and MA actually mean, before you fit anything."
description: "ARIMA looks like alphabet soup until each letter maps to something real. Here AR, I and MA get built one at a time from a coffee shop's 200 days of sales."
keywords: "ARIMA, what AR I MA mean, autoregressive, moving average, differencing, time series in R, arima function"
date: "2026-08-15"
post_type: "LESSON"
curriculum_id: "0.0.4"
lesson_access: "windowed"
course_id: "arima-from-zero"
course_title: "ARIMA from Zero"
course_lesson: "1"
course_total: "7"
course_landing: "/dashboard.html"
webr: true
mathjax: true
---

=== step === cover
::eyebrow Part 1 of 7
## ARIMA: what AR, I, and MA actually mean

Meera runs a coffee shop next to a bus stand, and for two hundred days she has written one number on the back of the till roll: cups sold. Here they are, all two hundred of them.

::widget chart-plotter {"data":[{"x":1,"y":221},{"x":2,"y":235},{"x":3,"y":244},{"x":4,"y":257},{"x":5,"y":270},{"x":6,"y":281},{"x":7,"y":288},{"x":8,"y":303},{"x":9,"y":308},{"x":10,"y":304},{"x":11,"y":305},{"x":12,"y":298},{"x":13,"y":293},{"x":14,"y":286},{"x":15,"y":293},{"x":16,"y":295},{"x":17,"y":283},{"x":18,"y":274},{"x":19,"y":266},{"x":20,"y":275},{"x":21,"y":280},{"x":22,"y":295},{"x":23,"y":309},{"x":24,"y":310},{"x":25,"y":311},{"x":26,"y":311},{"x":27,"y":319},{"x":28,"y":331},{"x":29,"y":346},{"x":30,"y":359},{"x":31,"y":349},{"x":32,"y":332},{"x":33,"y":323},{"x":34,"y":303},{"x":35,"y":280},{"x":36,"y":275},{"x":37,"y":271},{"x":38,"y":263},{"x":39,"y":250},{"x":40,"y":239},{"x":41,"y":231},{"x":42,"y":234},{"x":43,"y":244},{"x":44,"y":261},{"x":45,"y":262},{"x":46,"y":270},{"x":47,"y":290},{"x":48,"y":308},{"x":49,"y":313},{"x":50,"y":317},{"x":51,"y":307},{"x":52,"y":301},{"x":53,"y":291},{"x":54,"y":307},{"x":55,"y":323},{"x":56,"y":342},{"x":57,"y":361},{"x":58,"y":370},{"x":59,"y":371},{"x":60,"y":354},{"x":61,"y":349},{"x":62,"y":343},{"x":63,"y":343},{"x":64,"y":347},{"x":65,"y":359},{"x":66,"y":372},{"x":67,"y":382},{"x":68,"y":388},{"x":69,"y":380},{"x":70,"y":361},{"x":71,"y":337},{"x":72,"y":336},{"x":73,"y":338},{"x":74,"y":353},{"x":75,"y":366},{"x":76,"y":359},{"x":77,"y":358},{"x":78,"y":347},{"x":79,"y":339},{"x":80,"y":342},{"x":81,"y":345},{"x":82,"y":335},{"x":83,"y":329},{"x":84,"y":328},{"x":85,"y":318},{"x":86,"y":312},{"x":87,"y":308},{"x":88,"y":304},{"x":89,"y":295},{"x":90,"y":290},{"x":91,"y":283},{"x":92,"y":293},{"x":93,"y":297},{"x":94,"y":299},{"x":95,"y":304},{"x":96,"y":320},{"x":97,"y":333},{"x":98,"y":339},{"x":99,"y":338},{"x":100,"y":332},{"x":101,"y":323},{"x":102,"y":331},{"x":103,"y":337},{"x":104,"y":331},{"x":105,"y":335},{"x":106,"y":346},{"x":107,"y":359},{"x":108,"y":375},{"x":109,"y":405},{"x":110,"y":429},{"x":111,"y":457},{"x":112,"y":460},{"x":113,"y":461},{"x":114,"y":456},{"x":115,"y":463},{"x":116,"y":467},{"x":117,"y":474},{"x":118,"y":478},{"x":119,"y":472},{"x":120,"y":455},{"x":121,"y":451},{"x":122,"y":448},{"x":123,"y":441},{"x":124,"y":430},{"x":125,"y":439},{"x":126,"y":440},{"x":127,"y":424},{"x":128,"y":407},{"x":129,"y":412},{"x":130,"y":423},{"x":131,"y":420},{"x":132,"y":421},{"x":133,"y":431},{"x":134,"y":452},{"x":135,"y":448},{"x":136,"y":431},{"x":137,"y":432},{"x":138,"y":445},{"x":139,"y":442},{"x":140,"y":441},{"x":141,"y":441},{"x":142,"y":442},{"x":143,"y":444},{"x":144,"y":442},{"x":145,"y":452},{"x":146,"y":466},{"x":147,"y":479},{"x":148,"y":483},{"x":149,"y":475},{"x":150,"y":465},{"x":151,"y":466},{"x":152,"y":471},{"x":153,"y":483},{"x":154,"y":494},{"x":155,"y":502},{"x":156,"y":517},{"x":157,"y":520},{"x":158,"y":533},{"x":159,"y":551},{"x":160,"y":559},{"x":161,"y":565},{"x":162,"y":579},{"x":163,"y":587},{"x":164,"y":591},{"x":165,"y":590},{"x":166,"y":595},{"x":167,"y":586},{"x":168,"y":566},{"x":169,"y":558},{"x":170,"y":561},{"x":171,"y":565},{"x":172,"y":575},{"x":173,"y":587},{"x":174,"y":603},{"x":175,"y":613},{"x":176,"y":603},{"x":177,"y":599},{"x":178,"y":601},{"x":179,"y":608},{"x":180,"y":610},{"x":181,"y":601},{"x":182,"y":597},{"x":183,"y":592},{"x":184,"y":574},{"x":185,"y":571},{"x":186,"y":582},{"x":187,"y":589},{"x":188,"y":594},{"x":189,"y":594},{"x":190,"y":588},{"x":191,"y":581},{"x":192,"y":576},{"x":193,"y":577},{"x":194,"y":590},{"x":195,"y":604},{"x":196,"y":601},{"x":197,"y":594},{"x":198,"y":587},{"x":199,"y":579},{"x":200,"y":586}],"geoms":["line","point"],"x":"day","y":"cups"}

Three things are true about that line, and Meera could tell you all three without knowing any statistics.

First, busy days come in runs. A good Tuesday is usually followed by a decent Wednesday, because the weather holds, the road works stay finished, the same people keep coming. Second, the odd big day leaves a small trail behind it: the morning a delivery van broke down outside and forty stranded passengers wandered in, the next day was a bit above normal too. And third, underneath all the daily noise the shop is simply growing, from about 220 cups a day at the start to nearly 600 by the end.

Those three sentences are the whole of ARIMA. The AR part is busy days following busy days. The MA part is the trail left by one unusual day. The I part is the growth you have to strip out before either of the other two makes any sense. Everything else is notation.

By the end of this lesson you will be able to:

- Say what AR, I and MA each do, in words a shop owner would accept
- Build all three from nothing in R and watch what each one does to a line on a chart
- Read ARIMA(2,1,1) out loud as a sentence, and any other label like it
- Fit one to real numbers and match every figure R prints back to a letter
- Say when this whole method is the wrong tool for the job

**What you need first:** you can read a simple R script, so a variable, a vector and a `for` loop are familiar. No statistics at all is assumed. Correlation, coefficient, shock, lag and stationary all get defined here as they turn up.

One thing worth saying now, because it changes how you should read the rest. Meera and her shop are made up, and we build her two hundred days ourselves in R a little further down. That is deliberate rather than lazy: a made-up shop is the only kind where you know the true rules in advance, so at the end you can check whether ARIMA finds the rules you planted. On real data you never get to look at the answer key.

=== step === concept
::eyebrow The shape of it
## Three separate ideas wearing one label

ARIMA is written as ARIMA(p, d, q), which is where most people give up, because three letters and three numbers arrive at once and none of them explains itself. It helps to know that the three parts were invented separately and only later got packed into one name.

::widget process-flow {"steps":[{"title":"AR (the p)","sub":"busy days follow busy days"},{"title":"I (the d)","sub":"the business is growing, so use changes"},{"title":"MA (the q)","sub":"a rush yesterday still echoes today"}]}

The numbers p, d and q are just counts, one per part: how many past days the model leans on, how many times you difference the series, how many past surprises still echo. So ARIMA(2,1,1) is not a formula you need to memorise. It is a sentence with three slots filled in.

We are going to build each part on its own, in R, starting with a shop so simple it has none of them. Then we put the three back together, hand the result to R, and see whether it can work out what we did.

[NOTE]
The letters are usually taught in the order they appear in the name, which is unfortunate, because I is the hardest of the three and it sits in the middle. We will do AR, then MA, then I. The name stays the same.

=== step === concept
::eyebrow Starting from nothing
## A shop with no memory at all

Imagine a version of Meera's shop where nothing carries over from one day to the next. Every morning the shop forgets everything: it sells about 220 cups, give or take whatever the day throws at it, and yesterday has no say in the matter.

We can build exactly that in R. First the day-to-day surprises, which are the part of a day nobody could have predicted, then the sales themselves.

```r
set.seed(11)
n <- 200
surprise <- round(rnorm(n, mean = 0, sd = 8))
head(surprise, 12)
#>  [1]  -5   0 -12 -11   9  -7  11   5   0  -8  -7  -3

plain <- 220 + surprise
head(plain, 12)
#>  [1] 215 220 208 209 229 213 231 225 220 212 213 217
```

Four things are happening there. `rnorm(n, mean = 0, sd = 8)` draws 200 random numbers that average out to zero, with `sd = 8` saying how far from zero they usually stray: most land within about 8 either side, a few go further. `round()` turns them into whole cups, because you cannot sell 4.7 coffees. `set.seed(11)` pins R's random numbers down so your run matches the numbers printed here exactly, which is what makes any of this checkable. And `plain <- 220 + surprise` says the obvious thing: every day is the usual 220 plus whatever surprise the day brought.

Statisticians call that surprise term a **shock**, and it is worth getting comfortable with the word now because it turns up in every formula later. A shock is not a disaster. It is just the leftover: the part of today that no rule, no trend and no amount of history could have told you in advance.

::widget chart-plotter {"data":[{"x":1,"y":215},{"x":2,"y":220},{"x":3,"y":208},{"x":4,"y":209},{"x":5,"y":229},{"x":6,"y":213},{"x":7,"y":231},{"x":8,"y":225},{"x":9,"y":220},{"x":10,"y":212},{"x":11,"y":213},{"x":12,"y":217},{"x":13,"y":208},{"x":14,"y":218},{"x":15,"y":211},{"x":16,"y":220},{"x":17,"y":218},{"x":18,"y":227},{"x":19,"y":215},{"x":20,"y":215},{"x":21,"y":215},{"x":22,"y":220},{"x":23,"y":216},{"x":24,"y":223},{"x":25,"y":221},{"x":26,"y":220},{"x":27,"y":218},{"x":28,"y":214},{"x":29,"y":218},{"x":30,"y":212},{"x":31,"y":211},{"x":32,"y":212},{"x":33,"y":225},{"x":34,"y":207},{"x":35,"y":213},{"x":36,"y":224},{"x":37,"y":219},{"x":38,"y":232},{"x":39,"y":215},{"x":40,"y":217},{"x":41,"y":207},{"x":42,"y":220},{"x":43,"y":227},{"x":44,"y":213},{"x":45,"y":227},{"x":46,"y":217},{"x":47,"y":203},{"x":48,"y":227},{"x":49,"y":226},{"x":50,"y":222},{"x":51,"y":226},{"x":52,"y":218},{"x":53,"y":213},{"x":54,"y":224},{"x":55,"y":221},{"x":56,"y":224},{"x":57,"y":219},{"x":58,"y":224},{"x":59,"y":232},{"x":60,"y":220}],"geoms":["line","point"],"x":"day","y":"cups"}

That is the first sixty days of the no-memory shop. It bounces around 220 and it never goes anywhere. Nothing about the picture is wrong, exactly, but it is not Meera's shop: her line has runs and trends in it, and this one has neither.

=== step === concept
::eyebrow The first question
## Does yesterday tell you anything?

Meera's till roll is a **time series**: numbers recorded in order, where the order is part of the information. Shuffle the two hundred days into a random pile and the runs, the trails and the growth all disappear, even though every number is still sitting there. Here is the question every time-series method is quietly built on. If I tell you what happened yesterday, do you know anything more about today than you did before?

There is a neat way to look at that. Take every day in the series and pair it with the day before it, so day 2 gets paired with day 1, day 3 with day 2, and so on all the way down. Then put each pair on a chart: yesterday along the bottom, today up the side. If yesterday really tells you something, the dots will lean in a direction. If it tells you nothing, they will sit in a shapeless cloud.

::widget chart-plotter {"data":[{"x":215,"y":220},{"x":220,"y":208},{"x":208,"y":209},{"x":209,"y":229},{"x":229,"y":213},{"x":213,"y":231},{"x":231,"y":225},{"x":225,"y":220},{"x":220,"y":212},{"x":212,"y":213},{"x":213,"y":217},{"x":217,"y":208},{"x":208,"y":218},{"x":218,"y":211},{"x":211,"y":220},{"x":220,"y":218},{"x":218,"y":227},{"x":227,"y":215},{"x":215,"y":215},{"x":215,"y":215},{"x":215,"y":220},{"x":220,"y":216},{"x":216,"y":223},{"x":223,"y":221},{"x":221,"y":220},{"x":220,"y":218},{"x":218,"y":214},{"x":214,"y":218},{"x":218,"y":212},{"x":212,"y":211},{"x":211,"y":212},{"x":212,"y":225},{"x":225,"y":207},{"x":207,"y":213},{"x":213,"y":224},{"x":224,"y":219},{"x":219,"y":232},{"x":232,"y":215},{"x":215,"y":217},{"x":217,"y":207}],"geoms":["point"],"x":"yesterday_cups","y":"today_cups"}

A shapeless cloud, as promised. The number in the corner of that chart, r, is the **correlation**: one number summarising how well the dots line up, running from 1 (a perfect upward line) through 0 (no relationship at all) down to -1 (a perfect downward line). Here it is -0.05, which for practical purposes is zero with a rounding error attached.

R computes the same number directly, and the code is worth reading slowly because that shifted pairing is the move behind everything else in this lesson.

```r
yesterday <- plain[1:(n - 1)]
today <- plain[2:n]
cor(yesterday, today)
#> [1] -0.05942682
```

`plain[1:(n - 1)]` takes days 1 through 199, and `plain[2:n]` takes days 2 through 200. The two vectors are the same series, offset by one day, so lining them up side by side pairs each day with its predecessor. That offset has a name you will see everywhere: a **lag**. Pairing a series with itself one step back is looking at it at lag 1.

So in the no-memory shop, yesterday is worth nothing. Knowing the shop sold 231 cups yesterday leaves you exactly where you started for today: guess 220.

=== step === concept
::eyebrow The AR part
## AR: today leans on yesterday

Real shops do not work like that, and Meera would tell you why in one sentence. The people who came yesterday mostly still exist today. The weather that was good yesterday is often still good. If yesterday was quiet because the road was dug up, the road is probably still dug up.

So let's give the shop a memory. The rule we want is: today starts from the 220-cup average, then gets pulled part of the way back towards wherever yesterday ended up, and then the day adds its own fresh surprise on top. Written out with symbols, that is the **autoregressive model of order 1**, or AR(1):

\( y_t = \mu + \phi (y_{t-1} - \mu) + \varepsilon_t \)

Every symbol in plain words. \( y_t \) is the number of cups on day \( t \), the day we are working out. \( \mu \) (the Greek letter mu) is the long-run average the shop hovers around, 220 here. \( y_{t-1} - \mu \) is yesterday's **gap** above or below that average, so a 240-cup Tuesday has a gap of +20. \( \phi \) (phi) is the coefficient that decides what fraction of yesterday's gap survives into today. And \( \varepsilon_t \) (epsilon) is the shock, the same daily surprise from before.

Set \( \phi = 0.6 \) and the sentence reads: whatever gap yesterday had, keep 60 percent of it, then add today's surprise. Here is that shop, built one day at a time.

```r
steady <- numeric(n)
steady[1] <- 220
for (t in 2:n) {
  steady[t] <- round(220 + 0.6 * (steady[t - 1] - 220) + surprise[t])
}
head(steady, 12)
#>  [1] 220 220 208 202 218 212 226 229 225 215 210 211
```

`numeric(n)` makes an empty vector of 200 slots to fill in. The first day has no yesterday, so we start it at the average. Then the loop walks forward through the days, and each pass is the formula above with `220` for \( \mu \) and `0.6` for \( \phi \).

Follow one line through to see it working. Day 3 came out at 208, so its gap is 208 - 220 = -12, a quiet day. Sixty percent of -12 is -7.2, and day 4 got a surprise of -11 (the fourth number in `surprise`), so day 4 lands at 220 - 7.2 - 11 = 201.8, which rounds to 202. That is exactly what the output says. Nothing is hidden inside `arima` or any other function yet; it is arithmetic you can do on paper.

::widget chart-plotter {"data":[{"x":1,"y":220},{"x":2,"y":220},{"x":3,"y":208},{"x":4,"y":202},{"x":5,"y":218},{"x":6,"y":212},{"x":7,"y":226},{"x":8,"y":229},{"x":9,"y":225},{"x":10,"y":215},{"x":11,"y":210},{"x":12,"y":211},{"x":13,"y":203},{"x":14,"y":208},{"x":15,"y":204},{"x":16,"y":210},{"x":17,"y":212},{"x":18,"y":222},{"x":19,"y":216},{"x":20,"y":213},{"x":21,"y":211},{"x":22,"y":215},{"x":23,"y":213},{"x":24,"y":219},{"x":25,"y":220},{"x":26,"y":220},{"x":27,"y":218},{"x":28,"y":213},{"x":29,"y":214},{"x":30,"y":208},{"x":31,"y":204},{"x":32,"y":202},{"x":33,"y":214},{"x":34,"y":203},{"x":35,"y":203},{"x":36,"y":214},{"x":37,"y":215},{"x":38,"y":229},{"x":39,"y":220},{"x":40,"y":217},{"x":41,"y":205},{"x":42,"y":211},{"x":43,"y":222},{"x":44,"y":214},{"x":45,"y":223},{"x":46,"y":219},{"x":47,"y":202},{"x":48,"y":216},{"x":49,"y":224},{"x":50,"y":224},{"x":51,"y":228},{"x":52,"y":223},{"x":53,"y":215},{"x":54,"y":221},{"x":55,"y":222},{"x":56,"y":225},{"x":57,"y":222},{"x":58,"y":225},{"x":59,"y":235},{"x":60,"y":229}],"geoms":["line","point"],"x":"day","y":"cups"}

Same sixty days, same surprises, one new rule. The line still hovers around 220, but it now moves in stretches: a slump around days 13 to 16, a good patch in the fifties. That stickiness is all the AR part is.

=== step === concept
::eyebrow The same test, second time
## Now the cloud has a tilt in it

Run the identical yesterday-versus-today test on the shop with a memory, and the picture changes.

::widget chart-plotter {"data":[{"x":220,"y":220},{"x":220,"y":208},{"x":208,"y":202},{"x":202,"y":218},{"x":218,"y":212},{"x":212,"y":226},{"x":226,"y":229},{"x":229,"y":225},{"x":225,"y":215},{"x":215,"y":210},{"x":210,"y":211},{"x":211,"y":203},{"x":203,"y":208},{"x":208,"y":204},{"x":204,"y":210},{"x":210,"y":212},{"x":212,"y":222},{"x":222,"y":216},{"x":216,"y":213},{"x":213,"y":211},{"x":211,"y":215},{"x":215,"y":213},{"x":213,"y":219},{"x":219,"y":220},{"x":220,"y":220},{"x":220,"y":218},{"x":218,"y":213},{"x":213,"y":214},{"x":214,"y":208},{"x":208,"y":204},{"x":204,"y":202},{"x":202,"y":214},{"x":214,"y":203},{"x":203,"y":203},{"x":203,"y":214},{"x":214,"y":215},{"x":215,"y":229},{"x":229,"y":220},{"x":220,"y":217},{"x":217,"y":205}],"geoms":["point"],"x":"yesterday_cups","y":"today_cups"}

Same forty days, yesterday along the bottom and today up the side exactly as before, and now the dots lean upward with r = 0.5. Low days sit next to low days, high next to high. Across the full two hundred days the number is even clearer.

```r
cor(steady[1:(n - 1)], steady[2:n])
#> [1] 0.5786145
```

About 0.58. Notice how close that is to the 0.6 we planted, and notice that it is not exactly 0.6, which is normal and worth expecting: two hundred days is a finite sample, so anything measured off it lands near the truth rather than on it.

That correlation is the fingerprint of an AR series, and the size of it tells you how sticky the shop is. Somewhere near 0 and yesterday is telling you nothing. Somewhere near 0.9 and the series barely moves from day to day. At 0.58 the shop remembers yesterday clearly but has plenty of room left for the day to go its own way.

=== step === widget
::eyebrow Feel it
## The coefficient is a slope you can drag to

Here is a fact that makes the AR part much less mysterious: \( \phi \) is a slope. Nothing more exotic than that. Draw the yesterday-versus-today dots, run the best straight line through them, and the steepness of that line is the coefficient.

Try it below. The dots are thirty real days from the shop with a memory (days 100 to 130), measured as gaps from the 220-cup average rather than raw cups, so a dot at (+15, +22) means yesterday was 15 above average and today was 22 above. Drag the slope handle and watch the red squares.

::widget ols-fit {"points":[{"x":0,"y":-4},{"x":-4,"y":0},{"x":0,"y":5},{"x":5,"y":2},{"x":2,"y":-16},{"x":-16,"y":-5},{"x":-5,"y":1},{"x":1,"y":-7},{"x":-7,"y":6},{"x":6,"y":13},{"x":13,"y":15},{"x":15,"y":22},{"x":22,"y":17},{"x":17,"y":-8},{"x":-8,"y":-6},{"x":-6,"y":-8},{"x":-8,"y":-8},{"x":-8,"y":-3},{"x":-3,"y":-2},{"x":-2,"y":0},{"x":0,"y":20},{"x":20,"y":7},{"x":7,"y":14},{"x":14,"y":14},{"x":14,"y":6},{"x":6,"y":15},{"x":15,"y":19},{"x":19,"y":16},{"x":16,"y":20},{"x":20,"y":5}]}

Each square is one day's miss. The line is the model's guess for today given yesterday, the vertical stick is how far off it was, and the square is that miss multiplied by itself. Squaring is what stops a wild miss being cancelled out by a wild miss the other way, and the running total underneath, the sum of squared errors, is the single number saying how badly the line is doing overall.

It starts you at a slope of 0.27, deliberately too flat. Drag it up and the squares shrink; overshoot past 0.8 and they grow again. Press **Snap to least squares** and the slope readout stops at 0.60, which is as close as the slider gets to the true best of 0.595, and the running total settles at 2067.35 against the best possible 2067.26 printed beside it.

That 0.60 is the AR coefficient, found by eye on thirty days. Now ask R to do the same job properly on all two hundred.

```r
arima(steady, order = c(1, 0, 0))
#>
#> Call:
#> arima(x = steady, order = c(1, 0, 0))
#>
#> Coefficients:
#>          ar1  intercept
#>       0.5777   220.0157
#> s.e.  0.0576     1.2736
#>
#> sigma^2 estimated as 58.62:  log likelihood = -691.1,  aic = 1388.21
```

`order = c(1, 0, 0)` is `c(p, d, q)`, so it says one AR term, no differencing, no MA term. Read the output as three answers. `ar1` is 0.5777, the \( \phi \) we planted as 0.6. `intercept` is 220.0157, the \( \mu \) we planted as 220. And `s.e.` underneath each one is the standard error, an estimate of how much that number would jump around if you collected another two hundred days: 0.0576 for the coefficient, so anything between roughly 0.46 and 0.69 would have been an unremarkable result from a shop whose real value is 0.6.

[KEY INSIGHT]
An AR coefficient is the slope of today against yesterday. When R prints ar1 = 0.5777 it is telling you that about 58 percent of yesterday's gap from the average is still sitting in today.

=== step === quiz
::eyebrow Check yourself
## What the coefficient says

R reported `ar1 = 0.5777` for the shop that averages 220 cups a day. Which sentence says what that means?

::quiz {"correct":2,"gate":true,"difficulty":"beginner"}
- Today the shop sells about 58 percent of whatever it sold yesterday
- About 58 percent of yesterday's gap from the 220-cup average is still there today ::ok That is it. The coefficient works on gaps from the average, never on the raw totals. Yesterday came in 20 cups above average, so today starts about 12 above, and then the day adds its own surprise on top.
- The model gets the right answer on about 58 percent of days
- About 58 percent of the days in the series are above average ::no All three of those read the coefficient as something it is not. It is not a fraction of yesterday's total, because 58 percent of a 240-cup day would be 139 cups and the shop has never had a day like that. It is not an accuracy score either, since nothing here counts right and wrong answers. And it says nothing about how many days sit above the line. It is one thing only: the share of yesterday's gap from average that carries into today.

=== step === concept
::eyebrow The p in ARIMA
## p is how many days back the model reaches

The p in ARIMA(p, d, q) counts AR terms, which is the same as asking how far back the model is allowed to look.

With p = 1 the model sees yesterday and nothing else, which does not mean older days are irrelevant. The day before yesterday still influences today, but only through yesterday, in the way a rumour reaches you second hand. With p = 2 the model gets to look at the last two days directly, each with its own coefficient:

\( y_t = \mu + \phi_1 (y_{t-1} - \mu) + \phi_2 (y_{t-2} - \mu) + \varepsilon_t \)

where \( \phi_1 \) weighs yesterday and \( \phi_2 \) weighs the day before. Those two can pull in opposite directions, which is exactly why anyone bothers with p = 2: a series that overshoots and corrects itself, up one day and down the next, needs a negative \( \phi_2 \) to describe that bounce, and no single-term model can do it.

| p | What the model is allowed to look at | The kind of series it suits |
|---|---|---|
| 0 | nothing, every day starts from the average | days that genuinely do not depend on each other |
| 1 | yesterday | steady stickiness, runs of good and bad days |
| 2 | yesterday and the day before | stickiness plus a bounce, or a slow cycle |
| 7 | the last full week | daily data where the same weekday matters, though a seasonal term usually does this better |

There is a cost to raising p, and it is the same cost as in any model. Every extra term is another number estimated from the same fixed pile of days, so each one is pinned down less firmly than the last, and a model with seven AR terms will happily fit the wiggles that happened to be in your two hundred days and then forecast them into next month, where they will not happen again. Choosing p honestly is a whole topic, and it is part 3 of this course.

=== step === concept
::eyebrow The MA part
## MA: yesterday's surprise still echoes

Now the letter with the worst name in statistics.

Picture the delivery van from the cover. It breaks down outside the shop one Wednesday morning, forty stranded passengers come in for coffee, and the day finishes 30 cups above where it should have been. Nothing about the shop changed; it was a one-off. But Thursday is still a little above normal, because a few of those passengers came back, and someone told a friend.

That is an echo of a shock, and it is different from AR stickiness in a way worth being precise about. AR says today is pulled towards yesterday's **level**. MA says today carries a piece of yesterday's **surprise**. In the AR shop, a quiet Tuesday leads to a quiet Wednesday because Tuesday's low number itself is what gets carried forward. In the MA shop, what gets carried forward is only the unexpected part of Tuesday.

The moving average model of order 1, MA(1), says it like this:

\( y_t = \mu + \varepsilon_t + \theta \varepsilon_{t-1} \)

\( \mu \) is the average again, \( \varepsilon_t \) is today's shock, \( \varepsilon_{t-1} \) is yesterday's shock, and \( \theta \) (theta) is the fraction of yesterday's shock that is still around. Set \( \theta = 0.4 \) and every day is 220 cups, plus today's surprise, plus 40 percent of yesterday's.

Press **Show what changed** below to watch that arithmetic run down eight real days.

::widget table-transform {"code":"df %>% mutate(echo = 0.4 * lag(surprise, default = 0), cups = round(220 + surprise + echo))","caption":"Every day is 220 cups, plus the surprise of the day, plus 40 percent of the surprise from the day before.","before":{"cols":["day","surprise"],"rows":[[1,-5],[2,0],[3,-12],[4,-11],[5,9],[6,-7],[7,11],[8,5]]},"after":{"cols":["day","surprise","echo","cups"],"rows":[[1,-5,0,215],[2,0,-2,218],[3,-12,0,208],[4,-11,-4.8,204],[5,9,-4.4,225],[6,-7,3.6,217],[7,11,-2.8,228],[8,5,4.4,229]]}}

Day 5 is the clearest one. Its own surprise was +9, a good day, but day 4 had been rough at -11, and 40 percent of -11 is -4.4 still hanging around. So day 5 lands at 220 + 9 - 4.4 = 224.6, rounded to 225 cups, slightly less than the +9 alone would have given.

[WARNING]
The name is a trap. A moving average in the everyday sense means smoothing a line by averaging each point with its neighbours, and MA in ARIMA has nothing to do with that. It is an average of past shocks, not of past values. If it helps, read the letters as "memory of the last surprise" and you will never misuse it.

=== step === concept
::eyebrow What the echo does
## An echo that stops after one day

Build the echo shop the same way we built the other two, using the same two hundred surprises, and see what the rule does to the line.

```r
echo <- numeric(n)
echo[1] <- 220 + surprise[1]
for (t in 2:n) {
  echo[t] <- round(220 + surprise[t] + 0.4 * surprise[t - 1])
}
head(echo, 12)
#>  [1] 215 218 208 204 225 217 228 229 222 212 210 214
```

Day 1 has no yesterday to echo, so it is just 220 plus its own surprise. Every day after that adds the 40 percent trail.

::widget chart-plotter {"data":[{"x":1,"y":215},{"x":2,"y":218},{"x":3,"y":208},{"x":4,"y":204},{"x":5,"y":225},{"x":6,"y":217},{"x":7,"y":228},{"x":8,"y":229},{"x":9,"y":222},{"x":10,"y":212},{"x":11,"y":210},{"x":12,"y":214},{"x":13,"y":207},{"x":14,"y":213},{"x":15,"y":210},{"x":16,"y":216},{"x":17,"y":218},{"x":18,"y":226},{"x":19,"y":218},{"x":20,"y":213},{"x":21,"y":213},{"x":22,"y":218},{"x":23,"y":216},{"x":24,"y":221},{"x":25,"y":222},{"x":26,"y":220},{"x":27,"y":218},{"x":28,"y":213},{"x":29,"y":216},{"x":30,"y":211},{"x":31,"y":208},{"x":32,"y":208},{"x":33,"y":222},{"x":34,"y":209},{"x":35,"y":208},{"x":36,"y":221},{"x":37,"y":221},{"x":38,"y":232},{"x":39,"y":220},{"x":40,"y":215},{"x":41,"y":206},{"x":42,"y":215},{"x":43,"y":227},{"x":44,"y":216},{"x":45,"y":224},{"x":46,"y":220},{"x":47,"y":202},{"x":48,"y":220},{"x":49,"y":229},{"x":50,"y":224},{"x":51,"y":227},{"x":52,"y":220},{"x":53,"y":212},{"x":54,"y":221},{"x":55,"y":223},{"x":56,"y":224},{"x":57,"y":221},{"x":58,"y":224},{"x":59,"y":234},{"x":60,"y":225}],"geoms":["line","point"],"x":"day","y":"cups"}

To the eye this looks a lot like the AR shop, which is the honest reason people mix the two up. The difference shows up when you measure how far the memory reaches.

```r
cor(echo[1:(n - 1)], echo[2:n])
#> [1] 0.3001171

cor(echo[1:(n - 2)], echo[3:n])
#> [1] 0.02005171
```

The first line pairs each day with the day before, as we did earlier, and finds a real relationship of 0.30. The second pairs each day with the day **two** back, and finds nothing at all. That is the signature of an MA(1): connected at lag 1, disconnected at lag 2 and everywhere beyond, because a shock only lives for one extra day and then it is gone from the arithmetic entirely.

R can estimate \( \theta \) the same way it estimated \( \phi \).

```r
arima(echo, order = c(0, 0, 1))
#>
#> Call:
#> arima(x = echo, order = c(0, 0, 1))
#>
#> Coefficients:
#>          ma1  intercept
#>       0.3594   220.0003
#> s.e.  0.0710     0.7304
#>
#> sigma^2 estimated as 57.88:  log likelihood = -689.7,  aic = 1385.39
```

`order = c(0, 0, 1)` asks for no AR terms, no differencing, one MA term. R reports `ma1 = 0.3594` against the 0.4 we planted, and an intercept of 220.0003 against the 220 we planted. Both land close, both land off by a little, for the same finite-sample reason as before.

There is a fair question hiding in that output, and it is the thing that trips most people up about MA. The formula needs yesterday's shock, but a shock is by definition the part of a day nobody could have predicted, so how did R use one it never saw? We only knew the shocks here because we invented them ourselves; on somebody else's sales figures nobody hands you a `surprise` column.

R works them out as it goes. It starts at the beginning of the series, predicts day 2, compares that prediction with what day 2 actually did, and calls the gap day 2's shock. That shock then feeds the prediction for day 3, which produces a new gap, and it walks forward like that to the end. So an estimated shock is really a forecast error, which is why you will often see MA described as learning from the model's own past mistakes, and R settles on the \( \theta \) that makes those errors smallest overall.

=== step === concept
::eyebrow Telling them apart
## AR fades forever, MA stops dead

The cleanest way to see the difference between the two is to ask a single question of each: one unusual day happens, a rush of +10 cups. How long is it still detectable?

For the MA shop the answer is short. Today is +10, tomorrow keeps 40 percent of it, and after that the shock has fallen out of the formula, because an MA(1) only ever looks one day back.

```r
ma_trail <- c(10, 4, 0, 0, 0, 0, 0, 0)
ma_trail
#> [1] 10  4  0  0  0  0  0  0
```

::widget chart-plotter {"data":[{"x":0,"y":10},{"x":1,"y":4},{"x":2,"y":0},{"x":3,"y":0},{"x":4,"y":0},{"x":5,"y":0},{"x":6,"y":0},{"x":7,"y":0}],"geoms":["bar","line"],"x":"days_later","y":"extra_cups"}

For the AR shop it never quite ends. Today is +10, so tomorrow keeps 60 percent of that, and the day after keeps 60 percent of what tomorrow had, and so on down a chain that shrinks but never actually reaches zero.

```r
ar_trail <- 10 * 0.6^(0:7)
round(ar_trail, 2)
#> [1] 10.00  6.00  3.60  2.16  1.30  0.78  0.47  0.28
```

`0.6^(0:7)` raises 0.6 to the powers 0 through 7, which is the compounding written compactly: 0.6 once, then 0.6 twice, then three times. Multiply by the 10-cup rush and you get the trail.

::widget chart-plotter {"data":[{"x":0,"y":10},{"x":1,"y":6},{"x":2,"y":3.6},{"x":3,"y":2.16},{"x":4,"y":1.3},{"x":5,"y":0.78},{"x":6,"y":0.47},{"x":7,"y":0.28}],"geoms":["bar","line"],"x":"days_later","y":"extra_cups"}

Put the two side by side and the distinction is sharp. A shock in an MA(1) world has a hard expiry date. A shock in an AR(1) world is still there a week later, down to a quarter of a cup, which is nothing you could ever notice but is not zero.

This is why the two parts coexist in one model rather than competing. Real series often have both: a persistent pull from the general level of business, plus a short one-day trail behind unusual events. Fitting only one of them means forcing a single mechanism to explain two different things.

=== step === quiz
::eyebrow Check yourself
## How long does a rush last?

A delivery van breaks down outside the shop on a Tuesday and the day finishes 30 cups above normal. Nothing else changes. Which describes what happens next?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Under both models the rush leaves a trace that fades away over the following week
- Under MA(1) the rush leaves a trace on Wednesday and nothing after that, while under AR(1) it leaves a shrinking trace for many days ::ok Exactly. MA(1) keeps precisely one day of memory because only the previous shock appears in its formula, so by Thursday the van is gone from the arithmetic. AR(1) keeps a fraction of a fraction of a fraction, which shrinks fast and never technically hits zero.
- Under MA(1) the rush gets smoothed away, because a moving average averages each day with its neighbours
- Under AR(1) the rush is forgotten on Wednesday, since the model only looks one day back ::no Each of those misses how the memory works. The two models do not behave the same way: one has a hard cut-off and the other fades. MA in ARIMA is not smoothing at all, it is an average of past shocks rather than of past days. And looking one day back is exactly what makes AR(1) last a long time, because Wednesday looks at Tuesday, Thursday looks at Wednesday, and the trace gets handed along the chain.

=== step === concept
::eyebrow Back to the real shop
## Meera's shop, written as R

Time to build the shop from the cover. It has AR stickiness, it has an MA echo, and it has the thing the practice shops did not: it grows.

Growth changes where the moving parts live. In the practice shops the rule described the level of sales, which is why every formula had a 220 in it. In a growing shop there is no fixed level to describe, so the rule describes the **daily change** instead: how much today went up or down compared with yesterday. Some days the change is +14 cups, some days it is -7, and on average it is a little bit positive, which is what growth means.

```r
set.seed(72)
wobble <- rnorm(n, mean = 0, sd = 8)

change <- numeric(n)
change[1] <- 1.2
for (t in 2:n) {
  change[t] <- 1.2 + 0.4 * (change[t - 1] - 1.2) + wobble[t] + 0.3 * wobble[t - 1]
}

cups <- round(220 + cumsum(change))
head(cups, 14)
#>  [1] 221 235 244 257 270 281 288 303 308 304 305 298 293 286
```

`wobble` is the same kind of daily surprise as before, kept under a different name so the practice shops stay intact and you can still re-run any block above. The loop is the AR and MA rules you already know, applied to the change rather than the level: `1.2` is the average daily growth, `0.4 * (change[t - 1] - 1.2)` is the AR part saying a bigger-than-usual jump tends to be followed by another one, and `wobble[t] + 0.3 * wobble[t - 1]` is today's surprise plus 30 percent of yesterday's.

Then the last line does the important thing. `cumsum(change)` is the running total of all the changes up to each day, so adding it to the starting 220 turns a list of daily moves into a list of daily levels. Day 1 added 1.2 cups, day 2 added another 13.8 on top of that, which is how the first two days come out at 221 and 235, and the shop climbs from there.

::widget chart-plotter {"data":[{"x":1,"y":221},{"x":2,"y":235},{"x":3,"y":244},{"x":4,"y":257},{"x":5,"y":270},{"x":6,"y":281},{"x":7,"y":288},{"x":8,"y":303},{"x":9,"y":308},{"x":10,"y":304},{"x":11,"y":305},{"x":12,"y":298},{"x":13,"y":293},{"x":14,"y":286},{"x":15,"y":293},{"x":16,"y":295},{"x":17,"y":283},{"x":18,"y":274},{"x":19,"y":266},{"x":20,"y":275},{"x":21,"y":280},{"x":22,"y":295},{"x":23,"y":309},{"x":24,"y":310},{"x":25,"y":311},{"x":26,"y":311},{"x":27,"y":319},{"x":28,"y":331},{"x":29,"y":346},{"x":30,"y":359},{"x":31,"y":349},{"x":32,"y":332},{"x":33,"y":323},{"x":34,"y":303},{"x":35,"y":280},{"x":36,"y":275},{"x":37,"y":271},{"x":38,"y":263},{"x":39,"y":250},{"x":40,"y":239},{"x":41,"y":231},{"x":42,"y":234},{"x":43,"y":244},{"x":44,"y":261},{"x":45,"y":262},{"x":46,"y":270},{"x":47,"y":290},{"x":48,"y":308},{"x":49,"y":313},{"x":50,"y":317},{"x":51,"y":307},{"x":52,"y":301},{"x":53,"y":291},{"x":54,"y":307},{"x":55,"y":323},{"x":56,"y":342},{"x":57,"y":361},{"x":58,"y":370},{"x":59,"y":371},{"x":60,"y":354},{"x":61,"y":349},{"x":62,"y":343},{"x":63,"y":343},{"x":64,"y":347},{"x":65,"y":359},{"x":66,"y":372},{"x":67,"y":382},{"x":68,"y":388},{"x":69,"y":380},{"x":70,"y":361},{"x":71,"y":337},{"x":72,"y":336},{"x":73,"y":338},{"x":74,"y":353},{"x":75,"y":366},{"x":76,"y":359},{"x":77,"y":358},{"x":78,"y":347},{"x":79,"y":339},{"x":80,"y":342},{"x":81,"y":345},{"x":82,"y":335},{"x":83,"y":329},{"x":84,"y":328},{"x":85,"y":318},{"x":86,"y":312},{"x":87,"y":308},{"x":88,"y":304},{"x":89,"y":295},{"x":90,"y":290},{"x":91,"y":283},{"x":92,"y":293},{"x":93,"y":297},{"x":94,"y":299},{"x":95,"y":304},{"x":96,"y":320},{"x":97,"y":333},{"x":98,"y":339},{"x":99,"y":338},{"x":100,"y":332},{"x":101,"y":323},{"x":102,"y":331},{"x":103,"y":337},{"x":104,"y":331},{"x":105,"y":335},{"x":106,"y":346},{"x":107,"y":359},{"x":108,"y":375},{"x":109,"y":405},{"x":110,"y":429},{"x":111,"y":457},{"x":112,"y":460},{"x":113,"y":461},{"x":114,"y":456},{"x":115,"y":463},{"x":116,"y":467},{"x":117,"y":474},{"x":118,"y":478},{"x":119,"y":472},{"x":120,"y":455},{"x":121,"y":451},{"x":122,"y":448},{"x":123,"y":441},{"x":124,"y":430},{"x":125,"y":439},{"x":126,"y":440},{"x":127,"y":424},{"x":128,"y":407},{"x":129,"y":412},{"x":130,"y":423},{"x":131,"y":420},{"x":132,"y":421},{"x":133,"y":431},{"x":134,"y":452},{"x":135,"y":448},{"x":136,"y":431},{"x":137,"y":432},{"x":138,"y":445},{"x":139,"y":442},{"x":140,"y":441},{"x":141,"y":441},{"x":142,"y":442},{"x":143,"y":444},{"x":144,"y":442},{"x":145,"y":452},{"x":146,"y":466},{"x":147,"y":479},{"x":148,"y":483},{"x":149,"y":475},{"x":150,"y":465},{"x":151,"y":466},{"x":152,"y":471},{"x":153,"y":483},{"x":154,"y":494},{"x":155,"y":502},{"x":156,"y":517},{"x":157,"y":520},{"x":158,"y":533},{"x":159,"y":551},{"x":160,"y":559},{"x":161,"y":565},{"x":162,"y":579},{"x":163,"y":587},{"x":164,"y":591},{"x":165,"y":590},{"x":166,"y":595},{"x":167,"y":586},{"x":168,"y":566},{"x":169,"y":558},{"x":170,"y":561},{"x":171,"y":565},{"x":172,"y":575},{"x":173,"y":587},{"x":174,"y":603},{"x":175,"y":613},{"x":176,"y":603},{"x":177,"y":599},{"x":178,"y":601},{"x":179,"y":608},{"x":180,"y":610},{"x":181,"y":601},{"x":182,"y":597},{"x":183,"y":592},{"x":184,"y":574},{"x":185,"y":571},{"x":186,"y":582},{"x":187,"y":589},{"x":188,"y":594},{"x":189,"y":594},{"x":190,"y":588},{"x":191,"y":581},{"x":192,"y":576},{"x":193,"y":577},{"x":194,"y":590},{"x":195,"y":604},{"x":196,"y":601},{"x":197,"y":594},{"x":198,"y":587},{"x":199,"y":579},{"x":200,"y":586}],"geoms":["line","point"],"x":"day","y":"cups"}

There is the cover chart again, now with a recipe behind it. Look at what the growth does to the picture: the line does not hover around anything. It averages about 292 cups over the first thirty days, about 342 over days 61 to 90, and about 591 over the last thirty, so no single number deserves to be called the average of that series.

=== step === concept
::eyebrow Why the trick breaks
## A growing series makes yesterday look like a genius

Run our yesterday-versus-today test on the growing shop and something strange happens.

::widget chart-plotter {"data":[{"x":221,"y":235},{"x":235,"y":244},{"x":244,"y":257},{"x":257,"y":270},{"x":270,"y":281},{"x":281,"y":288},{"x":288,"y":303},{"x":303,"y":308},{"x":308,"y":304},{"x":304,"y":305},{"x":305,"y":298},{"x":298,"y":293},{"x":293,"y":286},{"x":286,"y":293},{"x":293,"y":295},{"x":295,"y":283},{"x":283,"y":274},{"x":274,"y":266},{"x":266,"y":275},{"x":275,"y":280},{"x":280,"y":295},{"x":295,"y":309},{"x":309,"y":310},{"x":310,"y":311},{"x":311,"y":311},{"x":311,"y":319},{"x":319,"y":331},{"x":331,"y":346},{"x":346,"y":359},{"x":359,"y":349},{"x":349,"y":332},{"x":332,"y":323},{"x":323,"y":303},{"x":303,"y":280},{"x":280,"y":275},{"x":275,"y":271},{"x":271,"y":263},{"x":263,"y":250},{"x":250,"y":239},{"x":239,"y":231},{"x":231,"y":234},{"x":234,"y":244},{"x":244,"y":261},{"x":261,"y":262},{"x":262,"y":270},{"x":270,"y":290},{"x":290,"y":308},{"x":308,"y":313},{"x":313,"y":317},{"x":317,"y":307},{"x":307,"y":301},{"x":301,"y":291},{"x":291,"y":307},{"x":307,"y":323},{"x":323,"y":342},{"x":342,"y":361},{"x":361,"y":370},{"x":370,"y":371},{"x":371,"y":354},{"x":354,"y":349}],"geoms":["point"],"x":"yesterday_cups","y":"today_cups"}

Those dots sit almost exactly on a line, and across all two hundred days the correlation is enormous.

```r
cor(cups[1:(n - 1)], cups[2:n])
#> [1] 0.9960062
```

A correlation of 0.996 looks like the best result in the lesson so far, and it is worth almost nothing. Of course today is close to yesterday: the shop was selling 250 cups a day in month two and 580 in month seven, so any two neighbouring days in the same week are bound to be similar. The correlation is picking up the trend, not the memory. Ask it to predict tomorrow and the honest content of its advice is "about the same as today", which you did not need a model for.

Watch what happens if we ignore that and fit the AR model anyway.

```r
arima(cups, order = c(1, 0, 0))
#>
#> Call:
#> arima(x = cups, order = c(1, 0, 0))
#>
#> Coefficients:
#>          ar1  intercept
#>       0.9981   405.3416
#> s.e.  0.0025   152.3110
#>
#> sigma^2 estimated as 106.6:  log likelihood = -753.45,  aic = 1512.89
```

Two numbers in that output are shouting. The coefficient is 0.9981, which is as close to 1 as makes no difference, and a coefficient of exactly 1 means today equals yesterday plus a shock, with nothing at all pulling the series back towards any particular level. A series that behaves that way is called a **random walk**, and the name is fair: each day steps away from the last in a random direction and never has a home to return to. Then look at the intercept, which is supposed to be the long-run average: 405 cups, with a standard error of 152, so R cannot tell you whether the average is 250 or 550. It cannot tell you because the question has no answer. This series has no fixed average to find.

[KEY INSIGHT]
An AR coefficient sitting within a whisker of 1, with a hopelessly imprecise intercept, is the standard tell that you fitted a model to levels when you should have fitted it to changes.

=== step === concept
::eyebrow The I part
## Difference it: turn levels into changes

The fix is the one Meera would reach for by instinct if you asked her how business is doing. Not "how many cups today", but "how many more than yesterday".

Subtracting each day from the one before is called **differencing**, and the resulting series is the daily changes. Press **Show what changed** to see it on the first eight days.

::widget table-transform {"code":"df %>% mutate(change = cups - lag(cups))","caption":"Each change is today minus yesterday, so day 1 has nothing to subtract from and comes out as NA.","before":{"cols":["day","cups"],"rows":[[1,221],[2,235],[3,244],[4,257],[5,270],[6,281],[7,288],[8,303]]},"after":{"cols":["day","cups","change"],"rows":[[1,221,"NA"],[2,235,14],[3,244,9],[4,257,13],[5,270,13],[6,281,11],[7,288,7],[8,303,15]]}}

Written as symbols, differencing is the plainest formula in the lesson:

\( \Delta y_t = y_t - y_{t-1} \)

where \( \Delta \) (delta) just means "the change in". R has this built in as `diff()`.

```r
daily_change <- diff(cups)
head(daily_change, 12)
#>  [1] 14  9 13 13 11  7 15  5 -4  1 -7 -5
```

Those numbers behave completely differently from the levels they came from. They are small, they sit around a modest positive figure, and crucially they do not go anywhere over time.

::widget chart-plotter {"data":[{"x":2,"y":14},{"x":3,"y":9},{"x":4,"y":13},{"x":5,"y":13},{"x":6,"y":11},{"x":7,"y":7},{"x":8,"y":15},{"x":9,"y":5},{"x":10,"y":-4},{"x":11,"y":1},{"x":12,"y":-7},{"x":13,"y":-5},{"x":14,"y":-7},{"x":15,"y":7},{"x":16,"y":2},{"x":17,"y":-12},{"x":18,"y":-9},{"x":19,"y":-8},{"x":20,"y":9},{"x":21,"y":5},{"x":22,"y":15},{"x":23,"y":14},{"x":24,"y":1},{"x":25,"y":1},{"x":26,"y":0},{"x":27,"y":8},{"x":28,"y":12},{"x":29,"y":15},{"x":30,"y":13},{"x":31,"y":-10},{"x":32,"y":-17},{"x":33,"y":-9},{"x":34,"y":-20},{"x":35,"y":-23},{"x":36,"y":-5},{"x":37,"y":-4},{"x":38,"y":-8},{"x":39,"y":-13},{"x":40,"y":-11},{"x":41,"y":-8},{"x":42,"y":3},{"x":43,"y":10},{"x":44,"y":17},{"x":45,"y":1},{"x":46,"y":8},{"x":47,"y":20},{"x":48,"y":18},{"x":49,"y":5},{"x":50,"y":4},{"x":51,"y":-10},{"x":52,"y":-6},{"x":53,"y":-10},{"x":54,"y":16},{"x":55,"y":16},{"x":56,"y":19},{"x":57,"y":19},{"x":58,"y":9},{"x":59,"y":1},{"x":60,"y":-17},{"x":61,"y":-5},{"x":62,"y":-6},{"x":63,"y":0},{"x":64,"y":4},{"x":65,"y":12},{"x":66,"y":13},{"x":67,"y":10},{"x":68,"y":6},{"x":69,"y":-8},{"x":70,"y":-19},{"x":71,"y":-24},{"x":72,"y":-1},{"x":73,"y":2},{"x":74,"y":15},{"x":75,"y":13},{"x":76,"y":-7},{"x":77,"y":-1},{"x":78,"y":-11},{"x":79,"y":-8},{"x":80,"y":3},{"x":81,"y":3},{"x":82,"y":-10},{"x":83,"y":-6},{"x":84,"y":-1},{"x":85,"y":-10},{"x":86,"y":-6},{"x":87,"y":-4},{"x":88,"y":-4},{"x":89,"y":-9},{"x":90,"y":-5},{"x":91,"y":-7},{"x":92,"y":10},{"x":93,"y":4},{"x":94,"y":2},{"x":95,"y":5},{"x":96,"y":16},{"x":97,"y":13},{"x":98,"y":6},{"x":99,"y":-1},{"x":100,"y":-6},{"x":101,"y":-9},{"x":102,"y":8},{"x":103,"y":6},{"x":104,"y":-6},{"x":105,"y":4},{"x":106,"y":11},{"x":107,"y":13},{"x":108,"y":16},{"x":109,"y":30},{"x":110,"y":24},{"x":111,"y":28},{"x":112,"y":3},{"x":113,"y":1},{"x":114,"y":-5},{"x":115,"y":7},{"x":116,"y":4},{"x":117,"y":7},{"x":118,"y":4},{"x":119,"y":-6},{"x":120,"y":-17},{"x":121,"y":-4},{"x":122,"y":-3},{"x":123,"y":-7},{"x":124,"y":-11},{"x":125,"y":9},{"x":126,"y":1},{"x":127,"y":-16},{"x":128,"y":-17},{"x":129,"y":5},{"x":130,"y":11},{"x":131,"y":-3},{"x":132,"y":1},{"x":133,"y":10},{"x":134,"y":21},{"x":135,"y":-4},{"x":136,"y":-17},{"x":137,"y":1},{"x":138,"y":13},{"x":139,"y":-3},{"x":140,"y":-1},{"x":141,"y":0},{"x":142,"y":1},{"x":143,"y":2},{"x":144,"y":-2},{"x":145,"y":10},{"x":146,"y":14},{"x":147,"y":13},{"x":148,"y":4},{"x":149,"y":-8},{"x":150,"y":-10},{"x":151,"y":1},{"x":152,"y":5},{"x":153,"y":12},{"x":154,"y":11},{"x":155,"y":8},{"x":156,"y":15},{"x":157,"y":3},{"x":158,"y":13},{"x":159,"y":18},{"x":160,"y":8},{"x":161,"y":6},{"x":162,"y":14},{"x":163,"y":8},{"x":164,"y":4},{"x":165,"y":-1},{"x":166,"y":5},{"x":167,"y":-9},{"x":168,"y":-20},{"x":169,"y":-8},{"x":170,"y":3},{"x":171,"y":4},{"x":172,"y":10},{"x":173,"y":12},{"x":174,"y":16},{"x":175,"y":10},{"x":176,"y":-10},{"x":177,"y":-4},{"x":178,"y":2},{"x":179,"y":7},{"x":180,"y":2},{"x":181,"y":-9},{"x":182,"y":-4},{"x":183,"y":-5},{"x":184,"y":-18},{"x":185,"y":-3},{"x":186,"y":11},{"x":187,"y":7},{"x":188,"y":5},{"x":189,"y":0},{"x":190,"y":-6},{"x":191,"y":-7},{"x":192,"y":-5},{"x":193,"y":1},{"x":194,"y":13},{"x":195,"y":14},{"x":196,"y":-3},{"x":197,"y":-7},{"x":198,"y":-7},{"x":199,"y":-8},{"x":200,"y":7}],"geoms":["line","point"],"x":"day","y":"change_in_cups"}

Compare that with the chart two steps up. The levels climbed from 220 to nearly 600; the changes wander around a low positive number from the first day to the last, and day 190 looks statistically like day 10. A series with that property, no drifting level and roughly steady spread, is called **stationary**, and it is the state ARIMA needs its input to be in before the AR and MA parts can mean anything. The d in ARIMA(p, d, q) is simply how many times you had to difference to get there.

Best of all, the memory did not disappear when the trend did. It moved into the changes.

```r
cor(daily_change[1:(n - 2)], daily_change[2:(n - 1)])
#> [1] 0.5819437
```

A busy jump tends to be followed by another jump, at 0.58, which is exactly the kind of relationship the AR part was built for. That is the whole reason differencing comes first: it clears the trend out of the way so that AR and MA have something meaningful left to describe.

=== step === tryit
::eyebrow Your turn
## How fast is the shop actually growing?

Meera's landlord wants a number: on an average day, how many more cups does the shop sell than the day before?

You have `cups`, the two hundred daily totals. Turn them into changes and take the average of those. Fill in the blank, then press Check.

```r
mean(diff(____))
```
::check {"regex":"mean\\s*\\(\\s*(diff\\s*\\(\\s*cups\\s*\\)|daily_change)\\s*\\)","gate":true,"difficulty":"beginner","ok":"About 1.83 cups a day. It sounds tiny next to a 400-cup day, and that is the point: two hundred days of adding not-quite-two cups is what carried the shop from 221 to 586.","no":"You want the average of the daily changes, so difference the levels first and then take the mean of the result: mean of diff of cups."}
::solution
```r
mean(diff(cups))
#> [1] 1.834171
```

=== step === concept
::eyebrow The cost of overdoing it
## More differencing is not safer

Since differencing removed a trend so neatly, a reasonable person might conclude that more of it is better, and that setting d = 2 or 3 is a cheap insurance policy. It is not. Differencing a series that did not need it makes things actively worse, and you can watch it happen on the very first shop we built, the one with no memory and no trend at all.

```r
sd(plain)
#> [1] 7.657879

sd(diff(plain))
#> [1] 11.15369
```

`sd()` is the standard deviation, one number for how spread out a set of values is: roughly the typical distance from the average. The no-memory shop sat 7.66 cups from its average on a typical day. Difference it, and the typical move becomes 11.15 cups, nearly one and a half times bigger. That makes sense once you see it: each change is built from two days of independent surprise instead of one, so it inherits both.

::widget chart-plotter {"data":[{"x":2,"y":5},{"x":3,"y":-12},{"x":4,"y":1},{"x":5,"y":20},{"x":6,"y":-16},{"x":7,"y":18},{"x":8,"y":-6},{"x":9,"y":-5},{"x":10,"y":-8},{"x":11,"y":1},{"x":12,"y":4},{"x":13,"y":-9},{"x":14,"y":10},{"x":15,"y":-7},{"x":16,"y":9},{"x":17,"y":-2},{"x":18,"y":9},{"x":19,"y":-12},{"x":20,"y":0},{"x":21,"y":0},{"x":22,"y":5},{"x":23,"y":-4},{"x":24,"y":7},{"x":25,"y":-2},{"x":26,"y":-1},{"x":27,"y":-2},{"x":28,"y":-4},{"x":29,"y":4},{"x":30,"y":-6},{"x":31,"y":-1},{"x":32,"y":1},{"x":33,"y":13},{"x":34,"y":-18},{"x":35,"y":6},{"x":36,"y":11},{"x":37,"y":-5},{"x":38,"y":13},{"x":39,"y":-17},{"x":40,"y":2},{"x":41,"y":-10},{"x":42,"y":13},{"x":43,"y":7},{"x":44,"y":-14},{"x":45,"y":14},{"x":46,"y":-10},{"x":47,"y":-14},{"x":48,"y":24},{"x":49,"y":-1},{"x":50,"y":-4},{"x":51,"y":4},{"x":52,"y":-8},{"x":53,"y":-5},{"x":54,"y":11},{"x":55,"y":-3},{"x":56,"y":3},{"x":57,"y":-5},{"x":58,"y":5},{"x":59,"y":8},{"x":60,"y":-12}],"geoms":["line","point"],"x":"day","y":"change_in_cups"}

There is a second, sneakier cost. Differencing something that was already stationary plants a pattern in it that was never in the original.

```r
cor(diff(plain)[1:(n - 2)], diff(plain)[2:(n - 1)])
#> [1] -0.5269709
```

The raw no-memory shop had a lag-1 correlation of -0.06, near enough to nothing. Its differences have -0.53, a strong negative relationship: a big jump up is now reliably followed by a move back down. That is pure arithmetic, not business. Today's change contains yesterday's surprise with a minus sign in front of it, so the two changes are linked by construction. Feed that to a model and it will faithfully fit a pattern you manufactured yourself.

So d is not a safety dial. It is a decision, and it should be the smallest number that flattens the trend, which for most business series is 0 or 1, occasionally 2 for something that grows at an accelerating rate. Deciding it properly is part 5 of this course, where a couple of formal tests do the arguing for you.

=== step === quiz
::eyebrow Check yourself
## Picking d

A colleague says: "My sales series still looks like it drifts upward a bit, so I set d = 3 just to be safe." What is wrong with that?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- Nothing, a higher d is the safe choice because it removes any trend that might be left
- Nothing important, since differencing can always be undone afterwards
- Differencing more than the series needs inflates the noise and manufactures a pattern that was not in the data ::ok Right on both counts. The spread grows with every extra difference, and each one plants a fresh negative relationship between neighbouring values, so the model ends up fitting something the arithmetic created rather than something the business did.
- d has no effect on its own, it only matters once you also raise p ::no None of those hold up. Extra differencing is not free insurance, because it enlarges the day-to-day spread and builds in a bounce that was never there, and being able to undo a transformation later does not repair a model that was fitted to the distorted version. It is also not inert: d changes what the series being modelled actually is, whatever p happens to be.

=== step === concept
::eyebrow The payoff
## Reading ARIMA(2,1,1) as a sentence

Everything is now in place to read the label the email promised. ARIMA(2, 1, 1) means, in order:

::widget process-flow {"steps":[{"title":"d = 1 happens first","sub":"difference once: work with day-to-day changes"},{"title":"p = 2","sub":"each change leans on the last two changes"},{"title":"q = 1","sub":"one day of surprise still echoes into today"}]}

Out loud: **difference the series once, then model each daily change using the two changes before it and one day of leftover surprise.** That is it. That is the whole label.

Two details make the reading reliable. The d comes first in the order of operations even though it sits second in the name, because p and q describe the differenced series, not the original one. And p and q count terms rather than days: q = 1 means one shock term, which happens to reach back one day, but q = 2 would mean two shock terms reaching back two days.

Here are the labels you will meet most often, read the same way.

| Label | Out loud |
|---|---|
| ARIMA(0, 0, 0) | pure noise, every day is the average plus a surprise, nothing carries over |
| ARIMA(1, 0, 0) | no trend to remove, today leans on yesterday's level |
| ARIMA(0, 0, 1) | no trend, today carries a piece of yesterday's surprise |
| ARIMA(0, 1, 0) | a random walk: today is yesterday plus a surprise, and that is all |
| ARIMA(1, 1, 1) | difference once, then one AR term and one MA term on the changes |
| ARIMA(2, 1, 1) | difference once, two AR terms and one MA term on the changes |

The fourth row is worth a second look, because ARIMA(0, 1, 0) is the model with nothing in it at all, and it is a surprisingly hard one to beat. It says tomorrow is today, plus whatever tomorrow brings. Any model you build has to earn its keep against that.

=== step === quiz
::eyebrow Check yourself
## Read the label

Someone hands you a model described as ARIMA(2, 1, 1). Which sentence matches it?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Difference the series twice, then use one past day and one past surprise
- Difference the series once, then use the last two changes and one day of leftover surprise ::ok Exactly right, and in that order: the differencing happens first, and the two AR terms and one MA term then work on the changes rather than the raw levels.
- Use two past surprises, difference once, and lean on one past day
- Use the last two days and one past surprise, with no differencing at all ::no The three numbers are always in the order p, then d, then q, so 2 is the count of AR terms, 1 is the number of times you difference, and the last 1 is the count of MA terms. Swapping the first and last numbers gives you a different model, and dropping the middle one entirely leaves the trend sitting in the data.

=== step === concept
::eyebrow The test
## Fit it, and see whether R finds the rules we planted

We built Meera's shop out of three known pieces: differencing once to handle the growth, one AR term of 0.4 on the changes, and one MA term of 0.3. In ARIMA notation, that is an ARIMA(1, 1, 1). Written as a formula, the model being fitted is

\( \Delta y_t = c + \phi \Delta y_{t-1} + \varepsilon_t + \theta \varepsilon_{t-1} \)

which is the AR(1) and MA(1) formulas from earlier, with \( \Delta y_t \) (the daily change) everywhere \( y_t \) used to be, and \( c \) standing for the average change.

Now the honest test. R never saw the recipe, only the two hundred numbers.

```r
arima(cups, order = c(1, 1, 1))
#>
#> Call:
#> arima(x = cups, order = c(1, 1, 1))
#>
#> Coefficients:
#>          ar1     ma1
#>       0.4097  0.3068
#> s.e.  0.0952  0.0947
#>
#> sigma^2 estimated as 66.07:  log likelihood = -699.61,  aic = 1405.22
```

`ar1 = 0.4097` against the 0.4 we planted, and `ma1 = 0.3068` against the 0.3. Both standard errors are about 0.095, so both estimates land comfortably within their own margin of error of the truth. Given two hundred numbers and no other information, the method reconstructed the rules that generated them.

Worth naming the rest of the output while it is in front of you. `sigma^2` is the estimated variance of the shocks, which is the square of the spread we measured with `sd()` earlier, so taking the square root of 66 gives the typical daily surprise: about 8 cups, which is the `sd = 8` we used to make `wobble`. The log likelihood and AIC are scores for comparing this model against other candidates, and they earn their own lesson: AIC is how part 3 chooses between ARIMA(1,1,1), ARIMA(2,1,1) and everything else on the shortlist.

[NOTE]
One thing `arima()` does not report here is the growth rate itself. With d = 1 the function models the changes and leaves the average change out of the model, which is why the 1.2 cups a day we planted is nowhere in the output. Adding it back is a `drift` term, available through `Arima()` in the forecast package, and part 4 of this course needs it because the drift is what makes a forecast keep climbing instead of flattening out.

=== step === tryit
::eyebrow Your turn
## Write the model yourself

A colleague describes the model they want in words: **difference the series once, lean on the last two changes, and use no surprise term at all.**

Turn that sentence into an `arima()` call on Meera's `cups`. The `order` argument takes `c(p, d, q)` in that order. Fill in the three blanks, then press Check.

```r
arima(cups, order = c(____, ____, ____))
```
::check {"regex":"order\\s*=\\s*c\\(\\s*2\\s*,\\s*1\\s*,\\s*0\\s*\\)","gate":true,"difficulty":"intermediate","ok":"That is ARIMA(2,1,0): two AR terms, differenced once, no MA term. Run it and you will see ar1 = 0.7203 and ar2 = -0.2098, which look nothing like the 0.4 and 0.3 of the true model. With the MA term taken away, the two AR terms rearrange themselves to imitate the echo as best they can.","no":"Read the sentence one number at a time: two past changes is p, differencing once is d, and no surprise term is q. They go into the order argument in exactly that order, p then d then q."}
::solution
```r
arima(cups, order = c(2, 1, 0))
#>
#> Call:
#> arima(x = cups, order = c(2, 1, 0))
#>
#> Coefficients:
#>          ar1      ar2
#>       0.7203  -0.2098
#> s.e.  0.0696   0.0697
#>
#> sigma^2 estimated as 65.91:  log likelihood = -699.36,  aic = 1404.72
```

=== step === concept
::eyebrow Where it breaks
## When plain ARIMA is the wrong tool

Every honest method comes with a list of things it cannot do, and ARIMA has a specific one. It is a machine for learning from a series' own recent past, so it fails precisely where the past stops being a guide.

- **A repeating calendar pattern.** If Meera's Saturdays are always busy and her Mondays always quiet, plain ARIMA cannot see it. A weekly rhythm needs terms that reach back exactly 7 days, which is what seasonal ARIMA adds. It is the single most common reason a beginner's forecast looks wrong on real data.
- **A cause that lives outside the series.** ARIMA only knows the cups. If sales jumped because Meera cut prices, or because a competitor opened, or because it rained for a fortnight, nothing in the numbers can tell you which. Bringing outside variables in makes it ARIMAX, and that is part 6.
- **A spread that grows with the level.** ARIMA assumes the size of the daily surprise stays roughly steady. A shop where a bad day costs 8 cups when small and 80 cups when large breaks that assumption, and the usual fix is to model the logarithm of sales instead of the raw counts.
- **A genuine break in the story.** A lockdown, a relocation, a road closing permanently. The series before the break and the series after it come from two different shops, and no amount of differencing bridges them.
- **Very short series.** Two hundred days gave us standard errors around 0.095. Twenty days would leave the coefficients so loosely pinned down that the model tells you little you could act on.
- **Forecasting far ahead.** An ARIMA forecast without a drift term settles back to a flat line within a handful of steps, because that is what the mathematics implies once the memory of the last observation fades. It is a short-horizon tool, and it is honest about that if you read the widening interval around the forecast.

None of this makes ARIMA a bad model. It makes it a specific one: excellent at short-horizon forecasting for a series whose own history really is the best available information, and quietly useless when something outside the history is driving events.

=== step === quiz
::eyebrow Check yourself
## The busy Saturdays

Meera mentions that Saturdays are always her best day and Mondays her worst, week in and week out. Will the ARIMA(1,1,1) you just fitted pick that up?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- Yes, the AR term learns the weekly rhythm as soon as p goes above 1
- Yes, differencing removes the weekly pattern along with the trend
- No: a weekly rhythm needs terms reaching back 7 days, which is what a seasonal ARIMA adds ::ok Correct. An ARIMA(1,1,1) only ever looks one day back, so it can see that today resembles yesterday but never that today resembles this day last week. Seasonal ARIMA, usually written with a second bracket for the seasonal part, adds terms at the seasonal lag to handle exactly this.
- No, and a repeating weekly pattern is something no version of ARIMA can handle ::no The first two are wishful. Raising p to 2 or 3 still leaves the model looking only a few days back, and differencing at lag 1 subtracts yesterday, which does nothing to a pattern that repeats every seven days. But it is also not hopeless: seasonal ARIMA exists precisely for repeating calendar patterns, and it works by adding terms at the seasonal lag.

=== step === concept
::eyebrow Go deeper
## References

Four places worth your time if you want to go past what this lesson covers.

- [Forecasting: Principles and Practice, the ARIMA chapter](https://otexts.com/fpp3/arima.html) - Hyndman and Athanasopoulos, free online and the standard modern reference. Read 9.3 and 9.4 next; they are the formal version of the AR and MA sections you just did.
- [R documentation for arima()](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/arima.html) - the function you ran, including what every argument does and how the seasonal bracket is specified.
- [Robert Nau, notes on ARIMA models, Duke University](https://people.duke.edu/~rnau/411arim.htm) - decades of teaching this to business students, and the best plain-language writing anywhere on why differencing comes first.
- [NIST/SEMATECH e-Handbook, Box-Jenkins models](https://www.itl.nist.gov/div898/handbook/pmc/section4/pmc446.htm) - the short, precise engineering-handbook treatment, useful when you want a definition rather than an explanation.

=== step === complete
## Part 1 complete

You started with a coffee shop and three ordinary observations, and you can now read the notation that encodes them. Busy days following busy days is the AR part, and its coefficient is the fraction of yesterday's gap from average that survives into today. A rush leaving a one-day trail is the MA part, whose echo stops dead after q days while an AR echo fades forever. And the growth underneath everything is the I part, removed by differencing, which is the step that has to happen before either of the others means anything.

You also built all three from nothing, watched R recover the rules you planted to within a rounding error, and saw the tell of a model fitted to levels when it should have been fitted to changes: a coefficient pinned against 1 and an intercept nobody can estimate.

One question has been carefully avoided throughout. We knew p, d and q here because we chose them. On somebody else's data you have to work them out from the series itself, and there are two plots that do most of that job. Part 2, "ACF and PACF: how to read the plots for ARIMA orders", is about reading them, and it is the difference between guessing at a model and choosing one.
