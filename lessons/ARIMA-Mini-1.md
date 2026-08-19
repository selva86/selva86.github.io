---
title: "ARIMA: what AR, I, and MA actually mean"
description: "Meera runs a coffee shop. Her 48 days of sales show what the AR, the I and the MA in ARIMA each mean, until a label like ARIMA(2,1,1) reads as plain English."
keywords: "ARIMA, what AR I MA mean, autoregressive, moving average, differencing, ARIMA p d q, time series in R, arima function"
post_type: "LESSON"
curriculum_id: "0.0.4"
course_id: "arima-from-zero"
course_title: "ARIMA from Zero"
course_lesson: "1"
course_total: "7"
course_landing: "/dashboard.html"
course_prev: ""
course_next: ""
lesson_access: "windowed"
catalog_blurb: "Read any ARIMA label as a plain sentence about your own data."
mathjax: true
webr: true
date: "2026-08-19"
---

=== step === cover

## ARIMA: what AR, I, and MA actually mean

Meera runs a coffee shop two streets from a train station. At closing time she writes down one number: how many cups she sold that day.

Seven weeks of that is 48 numbers. No weather column, no footfall counter, no marketing spreadsheet. Just the shop, day after day.

Sit with those 48 numbers for a while and three things come out of them.

Busy days come in runs. A rush that arrived out of nowhere is still felt a little the next day. And underneath both of those, the shop is slowly growing.

That is the whole thing. Those three sentences are the AR, the I and the MA in ARIMA.

::widget process-flow {"steps": [{"title": "Busy days come in runs", "sub": "a busy day is usually followed by another"}, {"title": "A rush leaves a mark", "sub": "the day after a rush is still not normal"}, {"title": "The shop keeps growing", "sub": "the everyday level creeps up week by week"}]}

By the end of this lesson, ARIMA(2,1,1) will read like a sentence about this shop: today leans on the last two days, the growth was taken out once, and one day of surprise still echoes.

=== step === concept

::eyebrow The data

## What are we actually looking at?

Here are Meera's numbers, one per day, day 1 to day 48.

I made them up, and I would rather say that plainly than pretend otherwise. But I built them to move the way a small shop actually moves, so everything you are about to see in them is real arithmetic on real numbers, not a story told over the top of them.

```r
cups <- c(126, 124, 126, 133, 147, 138, 139, 127, 129, 145,
          149, 144, 141, 137, 135, 140, 143, 137, 144, 153,
          156, 212, 174, 163, 155, 149, 146, 156, 155, 158,
          163, 175, 175, 178, 175, 171, 172, 175, 176, 188,
          182, 185, 187, 192, 196, 201, 193, 192)

length(cups)
#> [1] 48

head(cups, 10)
#>  [1] 126 124 126 133 147 138 139 127 129 145

plot(1:48, cups, type = "o", pch = 16, col = "#1f7a55",
     xlab = "Day", ylab = "Cups sold",
     main = "Meera: cups sold per day")
```

That is a **time series**: one column of numbers where the order is the point. Shuffle the 48 numbers and you have destroyed the thing you care about.

And notice what you do not have. In most prediction problems there are other columns to lean on, price and size and colour and so on. Here there is one column. So whatever you use to predict tomorrow has to come out of the series itself, out of its own past. That single constraint is where the whole of ARIMA comes from.

Two things already stand out in that chart. There is one wild day around day 22, and the line finishes higher than it started. Hold on to both.

=== step === concept

::eyebrow The AR part

## Do busy days really follow busy days?

The first of the three sentences was "busy days come in runs". That sounds like something you feel rather than something you measure. Let us measure it.

Take every day and write next to it what the shop sold the day before. Day 2 pairs with day 1, day 3 pairs with day 2, all the way to day 48 pairing with day 47. Day 1 has nothing before it, so you get 47 pairs.

Now put those pairs on a chart. Yesterday goes across, today goes up. Each dot is one pair of consecutive days.

::widget chart-plotter {"data": [{"x":126,"y":124},{"x":124,"y":126},{"x":126,"y":133},{"x":133,"y":147},{"x":147,"y":138},{"x":138,"y":139},{"x":139,"y":127},{"x":127,"y":129},{"x":129,"y":145},{"x":145,"y":149},{"x":149,"y":144},{"x":144,"y":141},{"x":141,"y":137},{"x":137,"y":135},{"x":135,"y":140},{"x":140,"y":143},{"x":143,"y":137},{"x":137,"y":144},{"x":144,"y":153},{"x":153,"y":156},{"x":156,"y":212},{"x":212,"y":174},{"x":174,"y":163},{"x":163,"y":155},{"x":155,"y":149},{"x":149,"y":146},{"x":146,"y":156},{"x":156,"y":155},{"x":155,"y":158},{"x":158,"y":163},{"x":163,"y":175},{"x":175,"y":175},{"x":175,"y":178},{"x":178,"y":175},{"x":175,"y":171},{"x":171,"y":172},{"x":172,"y":175},{"x":175,"y":176},{"x":176,"y":188},{"x":188,"y":182},{"x":182,"y":185},{"x":185,"y":187},{"x":187,"y":192},{"x":192,"y":196},{"x":196,"y":201},{"x":201,"y":193},{"x":193,"y":192}], "geoms": ["point"], "x": "yesterday", "y": "today"}

If yesterday told you nothing about today, those dots would sit in a shapeless cloud. They do not. They climb from bottom left to top right, and the number the chart reports, r = 0.87, is the **correlation**: a single number between -1 and 1 saying how tightly the two move together. Zero would mean no relationship at all. 0.87 is a strong one.

So the feeling was right, and now it is a number. A busy yesterday really does mean a busier-than-usual today, in this shop, over these seven weeks.

One dot sits out on its own at the far right. That is the pair around the wild day, and we will come back to it.

=== step === concept

::eyebrow The AR part

## What the AR part does

A strong tilt on a chart is an invitation. If today follows yesterday, write down exactly how, and then use it.

The simplest honest version says: today is some baseline, plus a share of yesterday, plus whatever nobody could have seen coming.

```r
shop <- data.frame(
  day        = 1:48,
  today      = cups,
  yesterday  = c(NA, head(cups, -1)),
  day_before = c(NA, NA, head(cups, -2))
)

head(shop, 4)
#>   day today yesterday day_before
#> 1   1   126        NA         NA
#> 2   2   124       126         NA
#> 3   3   126       124        126
#> 4   4   133       126        124

one_lag <- lm(today ~ yesterday, data = shop)
round(coef(one_lag), 3)
#> (Intercept)   yesterday 
#>      22.907       0.865
```

Read that as a rule Meera could use tomorrow morning:

**today = 22.9 + 0.865 x yesterday**

If she sold 160 cups yesterday, the rule expects 22.9 + 0.865 x 160, which is about 161 today. If she sold 200 yesterday, it expects about 196.

That is autoregression, and the name is literal. A regression is the ordinary business of predicting one thing from another. Here the thing you predict from is the same series, earlier. Regressing the series on itself. Auto, meaning self.

In symbols it is written like this:

\[ y_t = c + \phi\, y_{t-1} + e_t \]

where \( y_t \) is today's value, \( y_{t-1} \) is yesterday's, \( c \) is the baseline (22.9 here), \( \phi \) is the share of yesterday that carries over (0.865 here), and \( e_t \) is today's surprise, the part the rule cannot reach.

[KEY INSIGHT] The AR part predicts today from the actual past **values** of the series. Nothing else. That is the whole idea, and everything else about AR is bookkeeping over how many past values you allow.

=== step === quiz

::eyebrow Check yourself

## Which of these is the AR part using?

Meera could record all sorts of things about her shop. The AR part of ARIMA uses exactly one of them.

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- The day of the week, because weekends run busier than Tuesdays
- The temperature and rainfall on the day before
- The number of cups sold on the days just before today ::ok Exactly. AR reaches back into the series itself, at the actual sales figures from the days just gone.
- A column marking which days had a discount running ::no AR does not look at any other column. It has one thing to work with: the past values of the series itself. Weekday, weather and promotions are all information from outside the series, and they belong to a different kind of model.

=== step === concept

::eyebrow The AR part

## What the p in ARIMA(p, d, q) counts

The rule so far reaches back exactly one day. There is no law saying it has to stop there. Let it see two.

```r
two_lag <- lm(today ~ yesterday + day_before, data = shop)
round(coef(two_lag), 3)
#> (Intercept)   yesterday  day_before 
#>      21.530       0.716       0.160
```

Now there are two shares instead of one. Today gets 0.716 of yesterday and 0.160 of the day before that, on top of a baseline of 21.5.

That count, how many days back the model is allowed to reach, is **p**. It is the first number in the label.

- p = 0 means today leans on no past values at all.
- p = 1 means today leans on yesterday.
- p = 2 means today leans on yesterday and the day before.

And that is genuinely all p is. It is a dial, and you set it.

Notice what the data says about where to set it here. The share on the day before is 0.160, small next to yesterday's 0.716. Once yesterday is in the room, the day before yesterday has little left to add. That is worth saying out loud rather than glossing over: p is your choice, and the numbers that come back tell you whether the choice was worth making.

=== step === concept

::eyebrow The MA part

## What counts as an error here?

Two of the three sentences are still waiting, and the next one is about the day the shop was slammed. To get at it you need one more idea, and it is a plain one.

Take the two-day rule from a moment ago and ask it to call every single day. Then, for each day, subtract what it said from what actually happened.

That difference is a **forecast error**: one number per day, in cups. Positive means the shop beat the rule. Negative means the rule was too generous.

```r
shop$predicted <- round(predict(two_lag, newdata = shop), 1)
shop$error     <- round(shop$today - shop$predicted, 1)

shop[20:26, c("day", "today", "predicted", "error")]
#>    day today predicted error
#> 20  20   153     146.5   6.5
#> 21  21   156     154.1   1.9
#> 22  22   212     157.7  54.3
#> 23  23   174     198.2 -24.2
#> 24  24   163     180.0 -17.0
#> 25  25   155     166.0 -11.0
#> 26  26   149     158.6  -9.6
```

There is the wild day. On day 22 the rule looked at the two unremarkable days before it and said 158 cups. Meera sold 212. The rule was 54 cups short.

Something happened that day that is nowhere in the sales figures. A post about the shop went around locally, say. The rule had no way to know, and that is not a flaw in it. Nothing built only from past sales could have seen it coming.

=== step === concept

::eyebrow The MA part

## What the MA part does

The interesting part is not day 22. It is the days after it.

```r
# how far off the rule is on an ordinary day
round(median(abs(shop$error), na.rm = TRUE), 1)
#> [1] 5.2

# the four days it got most wrong, biggest miss first
head(shop[order(-abs(shop$error)), c("day", "error")], 4)
#>    day error
#> 22  22  54.3
#> 23  23 -24.2
#> 24  24 -17.0
#> 8    8 -16.1

plot(shop$day, shop$error, type = "h", lwd = 3, col = "#1f7a55",
     xlab = "Day", ylab = "Miss, in cups",
     main = "The two-day rule: 46 daily misses")
abline(h = 0, col = "#677084")
```

On a typical day the rule is off by about 5 cups. Now look at the three biggest misses in the whole seven weeks. They are day 22, day 23 and day 24. One surprise, three bad days in a row.

Day 23 is the one to sit with. The rule was 24 cups **over**. It had just watched a packed day, it leaned on that packed day, and it expected most of the crowd to come back. Some did. Most did not.

So the misses are not independent little accidents scattered across the calendar. A big miss yesterday tells you something real about today's miss. And anything that carries information is worth putting into the model.

That is the MA part. It adds a share of yesterday's error to today's forecast:

\[ y_t = c + \theta\, e_{t-1} + e_t \]

where \( e_{t-1} \) is yesterday's forecast error, an actual number you can work out once yesterday has happened, \( \theta \) is the share of it carried into today, and \( e_t \) is today's own surprise.

\( \theta \) can come out positive or negative, and the sign tells you what kind of echo this is. For Meera it lands near -0.78 when the full label is fitted later on, which reads as: when the rule came in well under what the shop actually did yesterday, pull today back down, because that crowd is not all coming back.

[KEY INSIGHT] AR looks at past **values**. MA looks at past **misses**. That is the entire difference between the two letters.

=== step === quiz

::eyebrow Check yourself

## Is MA the same as a moving average?

MA stands for moving average, which is a genuinely unhelpful name, because a moving average is also a common way to smooth a wiggly line.

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- Yes. It replaces each day with the average of the last 7 days, so the line comes out smoother
- No. It is a weighted sum of the model's own past forecast errors ::ok Right. The MA part never touches the raw sales to smooth them. It works on the misses, the gaps between what happened and what the model said.
- Yes. It averages today with yesterday to take the noise out ::no The name is a trap. Smoothing averages the sales figures themselves and hands you a tidier line. The MA part of ARIMA averages the model's own forecast errors and hands you a better next forecast. Same two words, different job.

=== step === concept

::eyebrow The I part

## Why a growing shop breaks both of those

Everything so far has quietly assumed the shop has a normal level to come back to. The AR share only means something if there is a level to be above or below. The misses only mean something if they are measured against a target that stays put.

Look at what the normal level actually did over these seven weeks.

```r
round(mean(cups[1:24]), 1)
#> [1] 144.2

round(mean(cups[25:48]), 1)
#> [1] 174.8

plot(1:48, cups, type = "o", pch = 16, col = "#c5cdda",
     xlab = "Day", ylab = "Cups sold",
     main = "The level Meera sells around keeps moving")
segments(1, mean(cups[1:24]), 24, mean(cups[1:24]), col = "#1f7a55", lwd = 3)
segments(25, mean(cups[25:48]), 48, mean(cups[25:48]), col = "#b04a52", lwd = 3)
```

The first half averages 144 cups a day. The second half averages 175. The normal itself moved by 30 cups while we were busy talking about being above it and below it.

This is the third sentence from the start, "the shop keeps growing", and it is not a small detail sitting off to one side. It undermines the other two. A model built on "today is a share of yesterday" is chasing a target that will not stand still, and 180 cups is a good day in week one and a poor day in week seven.

So before anything else works properly, the growth has to go. And there is a beautifully simple way to take it out.

=== step === widget

::eyebrow The I part

## What differencing actually does

Stop modelling how many cups Meera sold. Model how much it **changed** from the day before.

Day 20 to day 21 is 153 to 156, a change of +3. Day 21 to day 22 is 156 to 212, a change of +56. That is all it is: subtract each day from the one after it.

::widget table-transform {"code": "df %>% mutate(change = cups - lag(cups)) %>% filter(!is.na(change))", "caption": "Every row now carries the change from the day before. Day 17 has no day before it in this window, so it drops out: 8 daily totals become 7 daily changes.", "before": {"cols": ["day", "cups"], "rows": [[17, 143], [18, 137], [19, 144], [20, 153], [21, 156], [22, 212], [23, 174], [24, 163]]}, "after": {"cols": ["day", "cups", "change"], "rows": [[18, 137, -6], [19, 144, 7], [20, 153, 9], [21, 156, 3], [22, 212, 56], [23, 174, -38], [24, 163, -11]]}}

This is called **differencing**, and here is why it fixes the growth problem. Suppose the shop reliably adds a cup a day. In the raw figures that shows up as a line climbing away from you forever. In the changes it shows up as a small steady number sitting near +1, day after day, going nowhere. The climb has been turned into a constant.

It costs you exactly one thing. Forty-eight daily totals give you only 47 changes, because the first day has no day before it.

=== step === concept

::eyebrow The I part

## What the d in ARIMA(p, d, q) counts

**d** is how many times you take that change. It is the second number in the label, and I stands for integrated, which is the formal name for undoing a difference to get back to real cups at the end.

- d = 0 means the series is left alone, in cups.
- d = 1 means you work with day-to-day changes.
- d = 2 means you take the change of the changes. Rare, and usually a sign of a series that is accelerating rather than just growing.

Here is Meera's shop with d = 1.

```r
change <- diff(cups)

length(change)
#> [1] 47

round(mean(change), 2)
#> [1] 1.4

plot(2:48, change, type = "h", lwd = 3, col = "#1f7a55",
     xlab = "Day", ylab = "Change in cups since the day before",
     main = "The same seven weeks, as changes")
abline(h = 0, col = "#677084")
```

Compare that with the first chart you drew. The raw sales wandered upward across the page. The changes hover around a line and stay there, up on some days, down on others, with the day-22 rush now showing as one spike up followed immediately by one spike down.

They hover around +1.4 rather than exactly 0, and that +1.4 is Meera's growth: about one and a half extra cups a day, every day. Differencing did not delete the growth. It turned it from a moving target into a single small number, which is a far easier thing for a model to carry.

=== step === tryit

::eyebrow Your turn

## Difference the series yourself

One function does it. Replace the blank with the R function that turns 48 daily totals into 47 daily changes, then press Check.

```r
# Turn the 48 daily totals into 47 daily changes.
change_yours <- ____(cups)

length(change_yours)
head(change_yours)
```

::check {"regex": "diff\\s*[(]\\s*cups\\s*[)]", "gate": true, "difficulty": "beginner", "ok": "That is it. diff() subtracts each value from the one after it, which is exactly one difference, exactly d = 1.", "no": "The function is diff(). Give it the whole vector, like diff(cups), and it hands back the 47 gaps between consecutive days."}

::solution

```r
change_yours <- diff(cups)

length(change_yours)
#> [1] 47

head(change_yours)
#> [1] -2  2  7 14 -9  1
```

Forty-seven numbers, and the first one is -2 because Meera sold 126 cups on day 1 and 124 on day 2. Taking the difference twice, with `diff(cups, differences = 2)`, would be d = 2.

=== step === concept

::eyebrow Putting it together

## How do the three letters fit in one label?

You now have all three ideas, and each one arrived with a number attached. ARIMA(p, d, q) is nothing more than those three numbers written down in a fixed order.

| The letter | The question it answers | Meera at (2, 1, 1) |
|---|---|---|
| AR, the p | How many past days may today lean on? | 2, so today leans on the last two days |
| I, the d | How many times do we take the change? | 1, so the growth is taken out once |
| MA, the q | How many past misses does today carry? | 1, so one day of surprise still echoes |

The order never changes, so ARIMA(2,1,1) is always p = 2, d = 1, q = 1. And each number stands on its own. You can have p without q, as in ARIMA(1,0,0), or q without p, as in ARIMA(0,0,1), or neither of them.

One detail worth being straight about. Once d = 1, the p and the q are working on the **changes**, not on the raw cups. So ARIMA(2,1,1) for Meera says: today's change leans on the last two days of changes, and carries one day of past miss, on a series that has been differenced once.

=== step === tryit

::eyebrow Your turn

## Fit ARIMA(2,1,1) to Meera's shop

The label is not just a description. It is an instruction you can hand to R, and R hands you back the shares.

Fill in the three numbers for ARIMA(2,1,1), in that order, and press Check.

```r
# Fit the label ARIMA(2, 1, 1) to Meera's 48 days.
fit <- arima(cups, order = c(____, ____, ____))

fit
```

::check {"regex": "order\\s*=\\s*c[(]\\s*2\\s*,\\s*1\\s*,\\s*1\\s*[)]", "gate": true, "difficulty": "beginner", "ok": "That is the label, handed straight to R. The order argument takes p, d and q in that order, always.", "no": "The order argument wants p, d and q in that order, so ARIMA(2,1,1) is order = c(2, 1, 1)."}

::solution

```r
fit <- arima(cups, order = c(2, 1, 1))

fit
#> 
#> Call:
#> arima(x = cups, order = c(2, 1, 1))
#> 
#> Coefficients:
#>          ar1     ar2      ma1
#>       0.5142  0.0163  -0.7760
#> s.e.  0.2119  0.1577   0.1554
#> 
#> sigma^2 estimated as 126.1:  log likelihood = -180.45,  aic = 368.91
```

Those three coefficients are the shares you have been meeting all lesson, now estimated properly rather than by eye.

`ar1` is 0.51, so about half of yesterday's change carries into today's. `ar2` is 0.02, effectively nothing, which is the model saying the day before yesterday has nothing left to add here. `ma1` is -0.78, so a big share of yesterday's miss is carried into today, with a minus sign: a day the model badly underestimated pulls the next day's forecast back down.

The row marked `s.e.` under each one is its standard error, a measure of how firmly 48 days of data pin that number down. Notice that 0.0163 is much smaller than its own standard error of 0.1577. That is R telling you, without any drama, that the second AR term is not earning its place.

The bottom line is R scoring the fit rather than describing the shop. `sigma^2` measures how much surprise the model could not account for, and `aic` is a score whose only use is comparing one label against another on the same series.

=== step === quiz

::eyebrow Check yourself

## Read ARIMA(0,1,2) out loud

Meera has a friend with a bakery down the road, and a model for the bakery comes back as ARIMA(0,1,2). Same three slots, same order.

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Two past days, the growth taken out once, and no past misses carried
- No past days at all, the growth taken out once, and two days of past misses carried ::ok Exactly right. p = 0 means the model leans on no past values whatsoever, so the whole memory of that series sits in q, in the last two forecast errors.
- No past days, the change taken twice, and one day of past miss ::no The three slots are always p, then d, then q. So the 0 is p, and it says the model uses no past values at all. The 1 is d, one difference. The 2 is q, two days of past misses. Reading the slots in the wrong order is the single most common way to misread a label.

=== step === concept

::eyebrow Where this comes from

## References

The shop and its numbers are mine. The ideas underneath are standard, and these are the places to go deeper.

- Hyndman and Athanasopoulos, *Forecasting: Principles and Practice* (3rd edition), chapter 9 on ARIMA models: [otexts.com/fpp3/arima.html](https://otexts.com/fpp3/arima.html)
- The R documentation for the function used here, `stats::arima`: [the R manual page](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/arima.html)
- Hyndman and Khandakar (2008), Automatic Time Series Forecasting, *Journal of Statistical Software* 27(3): [jstatsoft.org/article/view/v027i03](https://www.jstatsoft.org/article/view/v027i03)
- Shumway and Stoffer, *Time Series Analysis and Its Applications* (4th edition), chapter 3, for the full treatment.
- Box, Jenkins, Reinsel and Ljung, *Time Series Analysis: Forecasting and Control* (5th edition), Wiley, 2015. The original source of the method.

=== step === complete

## You can read the label now

Three sentences about a coffee shop, and you have met all three.

Busy days come in runs, so today leans on the days just before it. That is **AR**, and **p** counts how many days back it may reach.

The shop keeps growing, so the level itself will not stand still. Take the change from day to day instead. That is **I**, and **d** counts how many times you do it.

A rush that came from nowhere still leaves a mark on the next day, so the model carries a share of yesterday's miss. That is **MA**, and **q** counts how many days of misses it carries.

Put them in order and ARIMA(2,1,1) stops being soup. Today leans on the last two days, the growth was taken out once, and one day of surprise still echoes. You can read any label you are handed the same way now, on Meera's shop or on your own data.

Which leaves one honest gap, and it is the obvious one: those three numbers were handed to you. Working them out for yourself comes down to reading two plots that show how far back a series really remembers.
