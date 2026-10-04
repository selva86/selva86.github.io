---
title: "The Expert Edge in Forecasting Like a Pro Lesson 6: Judgmental adjustments and forecast governance"
catalog_blurb: "When to trust a human override on a forecast, and when not to."
description: "Tell a forecast override that fixes a known gap from one driven by optimism, anchoring or authority, and build the governance rules that measure which is which."
keywords: "judgmental forecast adjustment, forecast override, demand planning bias, anchoring bias, optimism bias, authority bias, forecast governance, reason code, forecast value added, S&OP forecast process"
post_type: "LESSON"
curriculum_id: "5.150.6"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "ts-expert"
course_title: "The Expert Edge in Forecasting Like a Pro"
course_lesson: "6"
course_total: "7"
course_landing: "The-Expert-Edge-Forecasting-Like-a-Pro-Course.html"
course_next: "Checking-Prediction-Interval-Coverage.html"
course_prev: "Scaled-Errors-and-the-Lessons-of-the-M-Competitions.html"
---

=== step === cover
## Judgmental adjustments and forecast governance

Today let's understand when a person should reach in and change a statistical forecast by hand, and when that same habit is quietly making the forecast worse.

Priya is the demand planner for a company that sells insulated steel water bottles online. Every month a statistical model forecasts next month's unit sales for one product line, and before that number goes to the factory, Priya can adjust it herself. Over the last 12 months she adjusted it 6 times.

Here is her whole year: the statistical forecast, the adjusted forecast she actually sent to the factory, and what customers actually bought.

::widget chart-plotter {"data":[{"x":1,"y":900,"fill":"Statistical forecast"},{"x":2,"y":950,"fill":"Statistical forecast"},{"x":3,"y":1000,"fill":"Statistical forecast"},{"x":4,"y":1100,"fill":"Statistical forecast"},{"x":5,"y":1150,"fill":"Statistical forecast"},{"x":6,"y":1250,"fill":"Statistical forecast"},{"x":7,"y":1300,"fill":"Statistical forecast"},{"x":8,"y":1350,"fill":"Statistical forecast"},{"x":9,"y":1300,"fill":"Statistical forecast"},{"x":10,"y":1400,"fill":"Statistical forecast"},{"x":11,"y":1450,"fill":"Statistical forecast"},{"x":12,"y":1500,"fill":"Statistical forecast"},{"x":1,"y":900,"fill":"Adjusted forecast"},{"x":2,"y":950,"fill":"Adjusted forecast"},{"x":3,"y":1150,"fill":"Adjusted forecast"},{"x":4,"y":1320,"fill":"Adjusted forecast"},{"x":5,"y":1150,"fill":"Adjusted forecast"},{"x":6,"y":1380,"fill":"Adjusted forecast"},{"x":7,"y":1200,"fill":"Adjusted forecast"},{"x":8,"y":1350,"fill":"Adjusted forecast"},{"x":9,"y":1500,"fill":"Adjusted forecast"},{"x":10,"y":1490,"fill":"Adjusted forecast"},{"x":11,"y":1450,"fill":"Adjusted forecast"},{"x":12,"y":1500,"fill":"Adjusted forecast"},{"x":1,"y":920,"fill":"Actual"},{"x":2,"y":920,"fill":"Actual"},{"x":3,"y":1140,"fill":"Actual"},{"x":4,"y":1080,"fill":"Actual"},{"x":5,"y":1190,"fill":"Actual"},{"x":6,"y":1395,"fill":"Actual"},{"x":7,"y":1330,"fill":"Actual"},{"x":8,"y":1300,"fill":"Actual"},{"x":9,"y":1280,"fill":"Actual"},{"x":10,"y":1510,"fill":"Actual"},{"x":11,"y":1475,"fill":"Actual"},{"x":12,"y":1465,"fill":"Actual"}],"geoms":["line"],"x":"month","y":"units","code":{"line":"ggplot(ledger_long, aes(month, units, colour = series)) +\n  geom_line()"}}

Look at where the adjusted forecast, the line Priya actually sent to the factory, pulls close to the actual line in some months and pulls away from it in others. That gap, and why it opens up only sometimes, is what this lesson explains.

=== step === concept
## What counts as a judgmental adjustment

A judgmental adjustment is a change a person makes to a model's forecast, by hand, before that forecast gets used. The statistical forecast is whatever the model computed from past sales. The adjustment is the amount Priya added or subtracted. The adjusted forecast is the statistical forecast plus the adjustment, and that adjusted number, not the model's own number, is what actually goes to the factory.

Build Priya's 12-month ledger: the statistical forecast, the adjustment, the adjusted forecast, and what customers actually bought.

```r
# Build Priya's 12-month ledger: forecast, override, adjusted forecast, and actual
ledger <- data.frame(
  month = 1:12,
  statistical_forecast = c(900, 950, 1000, 1100, 1150, 1250, 1300, 1350, 1300, 1400, 1450, 1500),
  adjustment = c(0, 0, 150, 220, 0, 130, -100, 0, 200, 90, 0, 0),
  reason_category = c("none", "none", "known_one_off", "optimism", "none", "known_one_off",
                       "anchoring", "none", "authority", "known_one_off", "none", "none"),
  reason_detail = c("", "",
                     "Confirmed bulk order from a corporate gifting client",
                     "Regional manager pushed for a stretch target, no account named",
                     "",
                     "Scheduled promotion confirmed for the month",
                     "Planner leaned on last July's figure instead of updating for a higher baseline",
                     "",
                     "VP demanded a bigger number before a board meeting, no account named",
                     "Confirmed reorder from an existing retail partner",
                     "", ""),
  actual = c(920, 920, 1140, 1080, 1190, 1395, 1330, 1300, 1280, 1510, 1475, 1465),
  stringsAsFactors = FALSE
)
ledger$adjusted_forecast <- ledger$statistical_forecast + ledger$adjustment

ledger[, c("month", "statistical_forecast", "adjustment", "adjusted_forecast", "actual")]
#>    month statistical_forecast adjustment adjusted_forecast actual
#> 1      1                  900          0               900    920
#> 2      2                  950          0               950    920
#> 3      3                 1000        150              1150   1140
#> 4      4                 1100        220              1320   1080
#> 5      5                 1150          0              1150   1190
#> 6      6                 1250        130              1380   1395
#> 7      7                 1300       -100              1200   1330
#> 8      8                 1350          0              1350   1300
#> 9      9                 1300        200              1500   1280
#> 10    10                 1400         90              1490   1510
#> 11    11                 1450          0              1450   1475
#> 12    12                 1500          0              1500   1465
```

In 6 of the 12 months, the adjustment is 0, meaning Priya left the model's number untouched. In the other 6, she changed it, by as little as 90 units and as much as 220.

Now measure how those 6 changes did overall, using mean absolute error, MAE: the average size of a forecast's miss against the actual, ignoring whether it missed high or low.

```r
# Mean absolute error for the unadjusted and the adjusted forecast, over all 12 months
mae <- function(forecast, actual) mean(abs(forecast - actual))

unadjusted_mae <- mae(ledger$statistical_forecast, ledger$actual)
adjusted_mae   <- mae(ledger$adjusted_forecast, ledger$actual)

round(c(unadjusted_mae = unadjusted_mae, adjusted_mae = adjusted_mae), 2)
#> unadjusted_mae   adjusted_mae
#>          55.42          69.58

round(100 * (adjusted_mae - unadjusted_mae) / unadjusted_mae, 1)
#> [1] 25.6
```

The statistical forecast alone misses by 55.42 units a month on average. The adjusted forecast, the one Priya actually sent, misses by 69.58, which is 25.6% worse. Read only this one number, and Priya's adjustments look like they made things worse across the board.

Lay the whole ledger out as a table, with each override's reason attached.

::widget styled-table {"cols":["Month","Statistical forecast","Adjustment","Reason","Adjusted forecast","Actual"],"rows":[[1,900,0,"-",900,920],[2,950,0,"-",950,920],[3,1000,150,"Known one-off",1150,1140],[4,1100,220,"Optimism",1320,1080],[5,1150,0,"-",1150,1190],[6,1250,130,"Known one-off",1380,1395],[7,1300,-100,"Anchoring",1200,1330],[8,1350,0,"-",1350,1300],[9,1300,200,"Authority",1500,1280],[10,1400,90,"Known one-off",1490,1510],[11,1450,0,"-",1450,1475],[12,1500,0,"-",1500,1465]],"formats":{"Statistical forecast":"comma","Adjustment":"comma","Adjusted forecast":"comma","Actual":"comma"},"title":"The 12-month ledger: forecast, adjustment, reason, actual","note":"3 overrides carry a known one-off reason, and 3 carry optimism, anchoring or authority. Those 2 groups behave very differently."}

Every override in this table has a reason attached. But not every reason points to the same kind of thing: some name a fact the model could not see, and some do not.

=== step === concept
## When a human sees something the model cannot: the known one-off

The statistical forecast is built entirely from past sales. A phone call that happened last week, a contract that was just signed, or a promotion scheduled for next month leaves no trace in that sales history, so none of it can enter the forecast.

3 of Priya's overrides fill exactly that gap. Filter the ledger down to those 3 months.

```r
# Filter the ledger to the 3 known one-off months and compare forecast, adjustment, and actual
ledger[ledger$month %in% c(3, 6, 10),
       c("month", "statistical_forecast", "adjustment", "adjusted_forecast", "actual")]
#>    month statistical_forecast adjustment adjusted_forecast actual
#> 3      3                 1000        150              1150   1140
#> 6      6                 1250        130              1380   1395
#> 10    10                 1400         90              1490   1510
```

Month 3's +150 came from a confirmed bulk order from a corporate gifting client. A sales contact had already told Priya the order was placed, but a signed contract leaves no trace in 12 months of past sales, so the forecast had no way to reflect it.

Month 6's +130 came from a scheduled promotion confirmed for that month. Marketing had already locked in the promotion before the month began, but the sales history contains nothing about a future marketing campaign either.

Month 10's +90 came from a confirmed reorder from an existing retail partner. The partner had already placed the reorder; again, that fact exists in an email, not in the sales numbers the model was trained on.

In every one of these 3 months, Priya is not guessing. She is adding a fact that is structurally absent from the forecast's input, because that input is built only from what already sold, never from what a human already knows is coming.

=== step === concept
## When the override is really a bias: optimism, anchoring, and deferring to authority

The other 3 overrides look the same on the surface, a number changed by hand with a reason attached, but the reason points to no fact the model could not see. Filter the ledger down to these 3 months instead.

```r
# Filter the ledger to the 3 biased months and compare forecast, adjustment, and actual
ledger[ledger$month %in% c(4, 7, 9),
       c("month", "statistical_forecast", "adjustment", "adjusted_forecast", "actual")]
#>   month statistical_forecast adjustment adjusted_forecast actual
#> 4     4                 1100        220              1320   1080
#> 7     7                 1300       -100              1200   1330
#> 9     9                 1300        200              1500   1280
```

Month 4's +220 is optimism: a regional manager pushed for a stretch target, with no account or order named behind it. Nothing was confirmed; someone simply wanted a bigger number to aim for.

Month 7's -100 is anchoring: the planner leaned on last July's figure instead of updating for a higher baseline. Anchoring means letting an old number pull your judgment toward it, even once the situation has moved past that number.

Month 9's +200 is deferring to authority: a VP demanded a bigger number before a board meeting, again with no account named. The adjustment happened because of who was asking, not because of anything new that was known.

None of these 3 reasons name a fact the statistical forecast was missing. A stretch target, an old number, and a senior person's demand are all things the model already had every chance to account for in its own way; they add pressure to change the number, not information the model structurally lacked.

=== step === widget
## Measuring whether an adjustment actually helped

Split the 6 overrides by their reason, known one-off against biased, and measure mean absolute error for each group separately instead of lumping all 12 months together.

```r
# Mean absolute error, before and after the override, split by why the override happened
none_rows   <- ledger$reason_category == "none"
known_rows  <- ledger$reason_category == "known_one_off"
biased_rows <- ledger$reason_category %in% c("optimism", "anchoring", "authority")

split_mae <- data.frame(
  override_type = c("none", "known_one_off", "biased"),
  unadjusted_mae = round(c(
    mae(ledger$statistical_forecast[none_rows], ledger$actual[none_rows]),
    mae(ledger$statistical_forecast[known_rows], ledger$actual[known_rows]),
    mae(ledger$statistical_forecast[biased_rows], ledger$actual[biased_rows])
  ), 2),
  adjusted_mae = round(c(
    mae(ledger$adjusted_forecast[none_rows], ledger$actual[none_rows]),
    mae(ledger$adjusted_forecast[known_rows], ledger$actual[known_rows]),
    mae(ledger$adjusted_forecast[biased_rows], ledger$actual[biased_rows])
  ), 2)
)
split_mae
#>   override_type unadjusted_mae adjusted_mae
#> 1          none          33.33        33.33
#> 2 known_one_off         131.67        15.00
#> 3        biased          23.33       196.67
```

See the same 3 rows as a chart.

::widget chart-plotter {"data":[{"x":"No override","y":33.33,"fill":"Unadjusted"},{"x":"No override","y":33.33,"fill":"Adjusted"},{"x":"Known one-off","y":131.67,"fill":"Unadjusted"},{"x":"Known one-off","y":15.0,"fill":"Adjusted"},{"x":"Biased","y":23.33,"fill":"Unadjusted"},{"x":"Biased","y":196.67,"fill":"Adjusted"}],"geoms":["bar"],"x":"override type","y":"mean absolute error (units)","code":{"bar":"ggplot(split_mae_long, aes(override_type, mean_absolute_error, fill = forecast_type)) +\n  geom_col(position = \"dodge\")"}}

The 6 months with no override sit at 33.33 either way, which makes sense: with no adjustment, the adjusted forecast is just the statistical forecast, so there is nothing for an override to change.

The known one-off months tell a clear story. Mean absolute error falls from 131.67 to 15.00, an 88.6% reduction. Priya's 3 fact-based overrides turned a badly-missed forecast into a nearly exact one.

The biased months tell the opposite story. Mean absolute error rises from 23.33 to 196.67, about 8.4 times larger. The statistical forecast was already reasonably close in these 3 months, and the override, driven by optimism, anchoring or authority, pushed it far from the actual.

Now go back to the aggregate number from 2 steps ago: 55.42 unadjusted against 69.58 adjusted, 25.6% worse. That number is not wrong, but it hides the fact that 2 very different things happened. 3 overrides cut the error by 88.6%, and 3 raised it roughly 8-fold, and the biased group's misses were large enough to outweigh the known one-off group's gains when you average all 6 together.

=== step === quiz
## Quick check: does the type of override change the answer?

The aggregate said mean absolute error went from 55.42 to 69.58. Split by reason, the known one-off group went from 131.67 to 15.00, and the biased group went from 23.33 to 196.67.

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Judgmental overrides always hurt accuracy. The adjusted forecast's overall mean absolute error, 69.58, is higher than the unadjusted forecast's, 55.42, and that settles it. ::no
- The two kinds of override pull in opposite directions. The known one-off overrides cut mean absolute error from 131.67 to 15.00, while the biased overrides raise it from 23.33 to 196.67. The aggregate number mixes both groups together, so 55.42 against 69.58 hides which kind of override is actually responsible. ::ok Exactly. Split the 6 overrides by reason and the story reverses: the known one-off overrides clearly helped, and the biased ones clearly hurt. The aggregate just nets a big win against a bigger loss and reports it as "adjustments hurt".
- Judgmental overrides always help accuracy. The known one-off group's mean absolute error fell by 88.6%, which proves overrides are worth making. ::no
- With only 6 overrides in the ledger, there is not enough data to draw any conclusion either way. ::no None of these read the split correctly. The known one-off overrides cut mean absolute error from 131.67 to 15.00, and the biased overrides raised it from 23.33 to 196.67, in exactly opposite directions. 3 months per group is enough to see that the two types behave oppositely; the aggregate number is misleading because it averages them together, not because there is too little data.

=== step === concept
## Recording an adjustment so its value can be judged later

The split in the last step only worked because each override's reason was recorded in a way that could be grouped and measured later. See what happens when the reason is just a free-text note instead.

::widget styled-table {"cols":["Month","What Priya wrote down"],"rows":[[3,"boss confirmed a big order, bumping up"],[4,"push for a stretch target"],[6,"promo locked in, add some units"],[7,"feels high vs last year, pulling back a bit"],[9,"VP wants a bigger number before the board meeting"],[10,"reorder confirmed, add units"]],"title":"The same 6 overrides, as Priya actually wrote them down","note":"Every note uses different words, and none of them match any other note exactly. There is no column here you could group by."}

Free text like this cannot be grouped by a computer, and after a few months of notes like these, nobody can go back and ask which kind of reason tends to help and which kind tends to hurt. Now see the same 6 overrides logged a different way.

::widget styled-table {"cols":["Month","Reason code","Magnitude","Requested by"],"rows":[[3,"known_one_off","15.0%","Anil Mehta, Key Accounts"],[4,"optimism","20.0%","Mark Chen, Regional Sales"],[6,"known_one_off","10.4%","Divya Rao, Marketing"],[7,"anchoring","7.7%","Priya (self)"],[9,"authority","15.4%","Denise Okafor, VP Sales"],[10,"known_one_off","6.4%","Grace Liu, Retail Partnerships"]],"title":"The same 6 overrides, logged with a fixed reason code","note":"reason_code comes from one fixed list, chosen before the actual is known, not written up afterwards to justify the number."}

A reason code is a label chosen from a short, fixed list, known_one_off, optimism, anchoring, authority, decided at the moment of the override, before anyone knows what the actual will turn out to be. Magnitude is the size of the override, and requested_by names who asked for it. With these 3 fields recorded every time, the split from 2 steps back, known one-off against biased, can be recomputed any month a planning team wants to check it. With free-text notes, it cannot.

=== step === concept
## How big an override should need a second signature

A reason code alone does not catch everything worth catching. Compute each override's magnitude, its size as a percent of the statistical forecast it changed, and compare it against a fixed threshold.

```r
# Magnitude as a percent of the statistical forecast, and whether it clears a 10% threshold
overrides <- ledger[ledger$adjustment != 0, ]
overrides$magnitude_pct <- round(100 * abs(overrides$adjustment) / overrides$statistical_forecast, 1)
overrides$flagged <- overrides$magnitude_pct > 10

overrides[, c("month", "statistical_forecast", "adjustment", "reason_category", "magnitude_pct", "flagged")]
#>    month statistical_forecast adjustment reason_category magnitude_pct flagged
#> 3      3                 1000        150   known_one_off          15.0    TRUE
#> 4      4                 1100        220        optimism          20.0    TRUE
#> 6      6                 1250        130   known_one_off          10.4    TRUE
#> 7      7                 1300       -100       anchoring           7.7   FALSE
#> 9      9                 1300        200       authority          15.4    TRUE
#> 10    10                 1400         90   known_one_off           6.4   FALSE

sum(overrides$flagged)
#> [1] 4
```

Set the threshold at 10%, and 4 of the 6 overrides clear it: 15.0%, 20.0%, 10.4% and 15.4%. Only 2 fall under it, the 6.4% known one-off in month 10 and the 7.7% anchoring override in month 7.

Notice which override that magnitude gate would let through unquestioned: the 7.7% anchoring override. It is small by size, but it is one of the most harmful overrides in the whole ledger, the adjusted forecast missed by 130 units against an unadjusted miss of only 30. Magnitude tells you how big a change is, not whether it was a good idea. A small override can still be a bad one, which is exactly why the magnitude gate and the reason code gate have to work together, each catching what the other misses.

=== step === concept
## The governance rules that keep the process honest
::prose-only the checklist restates rules already established and computed in the previous steps; nothing new to plot

Put the last 3 steps together and you get 4 rules that keep a judgmental-adjustment process honest.

1. Never overwrite the statistical forecast. Store it beside the adjusted forecast, the way the ledger does, so both numbers survive and can be compared later.
2. Every override carries one reason code from a fixed, short list, chosen before the actual is known, never written up afterwards to justify the number.
3. Any override over the magnitude threshold needs a second signature, whatever its reason code says. A known one-off reason does not excuse a large override from review, and the threshold exists precisely because a small, low-scrutiny override like the 7.7% anchoring one can still do real damage.
4. On a fixed schedule, recompute the mean absolute error split by reason code. A reason code that keeps hurting accuracy gets restricted or removed from the approved list; one that keeps helping keeps a lighter review going forward.

None of these 4 rules requires guessing whether a specific override will turn out well. They require recording enough, at the moment of the override, that the question can be answered later with real numbers instead of memory.

=== step === quiz
## Quick check: applying the rules to a new override

A regional manager asks for a 15% bump to next month's forecast before a trade show, naming no specific account or order behind the request.

::quiz {"correct": 4, "gate": true, "difficulty": "advanced"}
- Approve it. The request comes from a regional manager, a senior role, and that is reason enough. ::no
- Approve it. 15% is not that large a change, so it should not need any extra scrutiny. ::no
- Reject the request outright, with no path to approval. ::no
- The reason code here is authority, not known_one_off, since no account or order is named, so it fails the reason-code gate on its own. At 15%, it also clears the 10% magnitude threshold, so it fails that gate too. Route it for a second signature rather than approving or rejecting it outright. ::ok Exactly right. A senior requester is not a reason code, and "not that large" does not hold once you check it against the actual 10% threshold, since 15% clears it. The governance rules do not reject an override outright either; they route anything that fails a gate to a second signature, where someone can weigh it properly.

=== step === tryit
## Your turn: decide whether month 13's override gets flagged

A sales rep asks for a +250 adjustment to month 13's statistical forecast of 1550, before a trade show, naming no account.

```r
# Month 13's request: forecast 1550, a sales rep asks for +250 before a trade show, naming no account
month13 <- data.frame(
  statistical_forecast = 1550,
  adjustment = 250,
  reason_category = "authority"
)

# Compute magnitude_pct, the adjustment as a percent of the statistical forecast,
# then flag the request if magnitude_pct is over 10, or if reason_category is not known_one_off
```
::check {"regex": "month13\\$adjustment[\\s\\S]*month13\\$statistical_forecast[\\s\\S]*>\\s*10[\\s\\S]*reason_category", "gate": true, "difficulty": "intermediate", "ok": "Exactly. magnitude_pct comes out to 16.1%, which clears the 10% threshold on its own. The reason code is authority, not known_one_off, so it fails that gate too. This request gets flagged for a second signature on both grounds.", "no": "Compute magnitude_pct as 100 times month13$adjustment divided by month13$statistical_forecast, compare that to 10, and separately check whether month13$reason_category equals known_one_off. Flag the request if either check fails."}
::solution
```r
# Magnitude as a percent of the statistical forecast, then the two governance gates
magnitude_pct  <- round(100 * month13$adjustment / month13$statistical_forecast, 1)
over_threshold <- magnitude_pct > 10
wrong_reason   <- month13$reason_category != "known_one_off"
flagged        <- over_threshold | wrong_reason

magnitude_pct
flagged
#> [1] 16.1
#> [1] TRUE
```

Month 13's request fails both gates at once: 16.1% is over the 10% magnitude threshold, and authority is not the known_one_off reason code the fixed list treats as fact-based. Either failure alone would be enough to route it for a second signature.

=== step === concept
## References

- [Against Your Better Judgment? How Organizations Can Improve Their Use of Management Judgment in Forecasting](https://doi.org/10.1287/inte.1070.0309) - Fildes, R. & Goodwin, P. (2007), Interfaces, 37(6), 570-576.
- [Improving the Voluntary Integration of Statistical Forecasts and Judgment](https://doi.org/10.1016/S0169-2070(99)00026-6) - Goodwin, P. (2000), International Journal of Forecasting, 16(1), 85-99.
- [Judgmental Forecasting: A Review of Progress Over the Last 25 Years](https://doi.org/10.1016/j.ijforecast.2006.03.007) - Lawrence, M., Goodwin, P., O'Connor, M., & Onkal, D. (2006), International Journal of Forecasting, 22(3), 493-518.
- Gilliland, M. (2010). The Business Forecasting Deal: Exposing Myths, Eliminating Bad Practices, Providing Practical Solutions. Wiley.
- [Judgment under Uncertainty: Heuristics and Biases](https://doi.org/10.1126/science.185.4157.1124) - Kahneman, D. & Tversky, A. (1974), Science, 185(4157), 1124-1131.

=== step === complete
## What forecast governance comes down to

By the end of this lesson, you can tell a judgmental override likely to help apart from one likely to hurt, and you can measure, after the fact, which one actually happened.

The aggregate number, 55.42 unadjusted against 69.58 adjusted, made Priya's 6 overrides look like a net negative. Splitting by reason showed the opposite of a flat story: the 3 known one-off overrides cut mean absolute error from 131.67 to 15.00, and the 3 biased overrides raised it from 23.33 to 196.67. Averaging those together, rather than keeping them apart, is what made the overrides look uniformly bad.

Keep both numbers, the statistical forecast and the adjusted one. Attach a reason code from a fixed list, chosen before the actual is known. Gate any override over the magnitude threshold for a second signature, whatever its reason code says. And recompute the reason-code split on a fixed schedule, so a reason that keeps hurting gets restricted, and one that keeps helping keeps its lighter review. That is what turns "did the override help" from a guess into a number you can check.
