---
title: "Machine Learning and Deep Forecasting Lesson 6: How a Temporal Fusion Transformer forecasts"
slug: "Temporal-Fusion-Transformers"
description: "See the three inputs a Temporal Fusion Transformer separates, compute a softmax attention weight by hand on real liquor sales, and judge if it earns its cost."
keywords: "Temporal Fusion Transformer, TFT forecasting, attention mechanism forecasting, static covariate, known future input, observed past input, softmax attention weights, multi-horizon forecasting, R time series"
mathjax: true
webr: true
date: "2026-10-03"
post_type: "LESSON"
course_id: "ts-ml"
course_title: "Machine Learning and Deep Forecasting"
course_lesson: "6"
course_total: "7"
course_landing: "Machine-Learning-and-Deep-Forecasting-Course.html"
course_prev: "Deep-Learning-DeepAR-N-BEATS-and-N-HiTS"
course_next: "Bootstrapping-Bagging-and-Forecast-Combinations"
curriculum_id: "5.130.6"
lesson_access: "pro"
catalog_blurb: "What a Temporal Fusion Transformer actually attends to, and whether it's worth the cost."
---

=== step === cover
## How a Temporal Fusion Transformer forecasts

Today let's see what a Temporal Fusion Transformer actually looks at before it makes a forecast, and why it can end up paying more attention to a month from a year ago than to last month.

Suppose you handle demand planning for liquor retailing in four Australian states: New South Wales, Victoria, South Australia and Western Australia. Across the 37 years in this data, December's turnover jumps well above November's every single year: by 42 percent in New South Wales, and by almost 60 percent in South Australia. So the calendar alone already carries real information about what is coming.

We will forecast December 2018 for all four states using only the data through November 2018. The real December 2018 figures stay hidden until the end, so we can check the forecast against them once it is made.

The chart below plots each state's monthly turnover from December 2017 to December 2018, in millions of Australian dollars.

::widget chart-plotter {"x":"month","y":"turnover","geoms":["line"],"data":[{"x":1,"y":489.3,"fill":"New South Wales"},{"x":2,"y":298.5,"fill":"New South Wales"},{"x":3,"y":272.2,"fill":"New South Wales"},{"x":4,"y":320.0,"fill":"New South Wales"},{"x":5,"y":290.9,"fill":"New South Wales"},{"x":6,"y":292.9,"fill":"New South Wales"},{"x":7,"y":281.9,"fill":"New South Wales"},{"x":8,"y":279.1,"fill":"New South Wales"},{"x":9,"y":290.2,"fill":"New South Wales"},{"x":10,"y":295.4,"fill":"New South Wales"},{"x":11,"y":294.6,"fill":"New South Wales"},{"x":12,"y":317.7,"fill":"New South Wales"},{"x":13,"y":468.1,"fill":"New South Wales"},{"x":1,"y":342.9,"fill":"Victoria"},{"x":2,"y":212.4,"fill":"Victoria"},{"x":3,"y":197.3,"fill":"Victoria"},{"x":4,"y":231.9,"fill":"Victoria"},{"x":5,"y":202.0,"fill":"Victoria"},{"x":6,"y":197.9,"fill":"Victoria"},{"x":7,"y":190.3,"fill":"Victoria"},{"x":8,"y":191.8,"fill":"Victoria"},{"x":9,"y":198.0,"fill":"Victoria"},{"x":10,"y":207.2,"fill":"Victoria"},{"x":11,"y":218.0,"fill":"Victoria"},{"x":12,"y":227.8,"fill":"Victoria"},{"x":13,"y":336.8,"fill":"Victoria"},{"x":1,"y":85.1,"fill":"South Australia"},{"x":2,"y":49.1,"fill":"South Australia"},{"x":3,"y":43.0,"fill":"South Australia"},{"x":4,"y":53.2,"fill":"South Australia"},{"x":5,"y":44.8,"fill":"South Australia"},{"x":6,"y":44.8,"fill":"South Australia"},{"x":7,"y":43.4,"fill":"South Australia"},{"x":8,"y":44.8,"fill":"South Australia"},{"x":9,"y":46.4,"fill":"South Australia"},{"x":10,"y":48.9,"fill":"South Australia"},{"x":11,"y":50.5,"fill":"South Australia"},{"x":12,"y":53.5,"fill":"South Australia"},{"x":13,"y":85.6,"fill":"South Australia"},{"x":1,"y":186.9,"fill":"Western Australia"},{"x":2,"y":121.3,"fill":"Western Australia"},{"x":3,"y":113.5,"fill":"Western Australia"},{"x":4,"y":132.8,"fill":"Western Australia"},{"x":5,"y":118.9,"fill":"Western Australia"},{"x":6,"y":119.1,"fill":"Western Australia"},{"x":7,"y":114.8,"fill":"Western Australia"},{"x":8,"y":118.4,"fill":"Western Australia"},{"x":9,"y":122.8,"fill":"Western Australia"},{"x":10,"y":122.8,"fill":"Western Australia"},{"x":11,"y":123.5,"fill":"Western Australia"},{"x":12,"y":130.4,"fill":"Western Australia"},{"x":13,"y":185.1,"fill":"Western Australia"}],"code":{"line":"ggplot(liq4, aes(month, turnover, colour = state)) +\n  geom_line()"}}

Look at where each line peaks: at both ends of the chart, December 2017 and December 2018, every single state sits at its highest point of the year.

=== step === concept
## Three kinds of input: static, known-future, observed-past

A Temporal Fusion Transformer does not treat every piece of information about a forecast the same way. It sorts each input into one of three kinds, and keeping them separate is the whole point of the architecture.

The first kind is the static covariate: a fact about the series that never changes over time. Here that is the state itself. New South Wales simply sells far more liquor than South Australia every month of the year, and that gap holds in December just as much as it holds in June.

The second kind is the known-future input: something you already know before the forecast is even made, because it comes from the calendar rather than from a measurement. For this backtest, the target month is December 2018, and whether that month is December is settled in November, long before anyone measures what actually sold.

The third kind is the observed-past input: a value that was only available up to the moment you are forecasting from. November 2018's turnover is observed-past. It is a real number, not a guess, but it stops the moment the forecast begins.

The table below lines up all four states against their static, known-future and observed-past inputs for this one backtest.

::widget styled-table {"cols":["State","Target month","Is December?","Turnover, Nov 2018"],"rows":[["New South Wales","December 2018","Yes","317.7"],["Victoria","December 2018","Yes","227.8"],["South Australia","December 2018","Yes","53.5"],["Western Australia","December 2018","Yes","130.4"]],"title":"The three input types, for all four states","note":"State is the static covariate. Target month and Is December are the known-future input. Turnover, Nov 2018 is the observed-past input."}

Treat the known-future input the same way you would an observed-past one, or drop it from the model altogether, and you throw away the one piece of information that is free here: you already know, for certain, that the month being forecast is December.

=== step === quiz
## Quick check: classify a feature into its input type

You have the three input types now: static, known-future and observed-past. Try sorting a new one into the right bucket.

Suppose you add one more feature to this backtest: how many public holidays fall in next month. Which input type does it belong to?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Last month's turnover ::no
- Next month's public holiday count ::ok Yes. You already know next month's public holiday calendar today, before the forecast is made, exactly like already knowing the target month is December. That makes it known-future.
- The state's population ::no
- The actual December turnover, the value the model is trying to forecast ::no None of the other three are known-future. Last month's turnover is observed-past: a real number, but it stops moving the moment you forecast from it. The state's population is static: it does not change with the forecast horizon. And the actual December turnover is not an input at all, it is the target the model is trying to predict.

=== step === concept
## The network's shape: two paths meeting at the forecast origin

Now that the three input types are sorted, follow where each one actually goes inside the network.

Observed-past steps, like every month of turnover up to November 2018, go into an encoder. Known-future steps, like the target month and whether it is December, go into a separate decoder. The static covariate, the state, gates both paths: it tells the network which state's scale and pattern it is reading.

Then comes the piece this lesson is named after. An attention layer looks back across the encoder's past steps before the decoder produces anything, and that is what lets the network decide, for this one forecast, which past months mattered most.

The diagram below walks through those stages in order, from the two separate inputs to the final forecast.

::widget process-flow {"steps":[{"title":"Observed past","sub":"turnover for every month up to November 2018 enters the encoder"},{"title":"Known future","sub":"the target month, December 2018, and whether it is December enter the decoder"},{"title":"Static covariate","sub":"the state gates what both the encoder and the decoder pay attention to"},{"title":"Attention layer","sub":"looks back across every past step the encoder holds, before the decoder acts"},{"title":"Decoder output","sub":"becomes the December forecast, plus a prediction interval around it"}]}

That last stage, the decoder output, is built from the same attention weights you are about to compute by hand.

=== step === widget
## How attention reaches back past the most recent month

An attention layer does not just average the past months, or lean only on the most recent one. It learns a score for every past step, and that score can reflect the same-month pattern you already saw in the chart: since December so reliably jumps, the layer can learn to lean heavily on last December when forecasting this one.

A trained Temporal Fusion Transformer learns those scores from data, over many related series and many training rounds, and that training cannot run in the browser here. So to see exactly what the mechanism does, we will assign Victoria's past seven months a set of illustrative scores by hand, built to favor both recency and a same-calendar-month match, and carry them through the real formula a trained network would use.

Victoria's seven months for this exercise are December 2017, then June through November 2018.

December 2017 gets a score of 2.0, the highest of the seven, because it shares its calendar month with the month being forecast. June 2018 gets a score of negative 0.2, the lowest, because it sits furthest back and is not a December. The other five months climb steadily from July towards November, reflecting plain recency.

A raw score like 2.0 is not yet a weight. Softmax turns a list of raw scores into weights that are all positive and add up to 100 percent: it raises each score as a power of e, then divides by the sum of all seven of those powers.

Written as a formula, the weight for month i is this.

\[ \text{weight}_i = \frac{\exp(\text{score}_i)}{\sum_j \exp(\text{score}_j)} \]

The block below runs that formula on Victoria's seven scores, and prints each weight as a percentage.

```r
# Compute softmax attention weights for Victoria's 7 past months
months <- c("Dec 2017", "Jun 2018", "Jul 2018", "Aug 2018", "Sep 2018", "Oct 2018", "Nov 2018")
vic_scores <- c(2.0, -0.2, 0.0, 0.1, 0.3, 0.6, 1.0)
names(vic_scores) <- months

vic_weights <- exp(vic_scores) / sum(exp(vic_scores))
round(vic_weights * 100, 1)
#> Dec 2017 Jun 2018 Jul 2018 Aug 2018 Sep 2018 Oct 2018 Nov 2018 
#>     45.6      5.1      6.2      6.8      8.3     11.2     16.8 
```

December 2017 alone takes 45.6 percent of the weight, more than two and a half times November 2018's 16.8 percent, even though November is the most recent month. That is the whole point of attention: it is free to weigh an older step more heavily than a newer one, whenever the pattern calls for it.

To turn these weights into an actual forecast, multiply each weight by that month's real turnover and add the products up.

```r
# Turn the weights into a forecast estimate for December 2018
vic_values <- c(342.9, 190.3, 191.8, 198.0, 207.2, 218.0, 227.8)
names(vic_values) <- months

vic_estimate <- sum(vic_weights * vic_values)
round(vic_estimate, 1)
#> [1] 271.3
```

That gives 271.3. Now compare it with two forecasts that use no attention at all: forecasting December with last month's value alone, or with the average of the last six months. The block below lines up all three estimates, and then checks each one against the real December 2018 turnover, 336.8.

```r
# Compare the attention-weighted estimate with two naive estimates
last_month_estimate <- unname(vic_values["Nov 2018"])
six_month_mean <- mean(vic_values[c("Jun 2018", "Jul 2018", "Aug 2018", "Sep 2018", "Oct 2018", "Nov 2018")])

round(c(attention_weighted = vic_estimate, last_month = last_month_estimate, six_month_mean = six_month_mean), 1)
#> attention_weighted         last_month     six_month_mean 
#>              271.3              227.8              205.5 

real_december_2018 <- 336.8
round(c(attention_weighted = real_december_2018 - vic_estimate,
        last_month = real_december_2018 - last_month_estimate,
        six_month_mean = real_december_2018 - six_month_mean), 1)
#> attention_weighted         last_month     six_month_mean 
#>               65.5              109.0              131.3 
```

The attention-weighted estimate misses by 65.5. Forecasting with last month alone misses by 109.0, and the six-month average misses by 131.3. None of the three nails the real value, but leaning on last December, the way the attention weights do, lands closest.

The chart below plots all seven weights, in order from December 2017 to November 2018.

::widget chart-plotter {"x":"month","y":"weight_pct","geoms":["bar"],"data":[{"x":"Dec 2017","y":45.6},{"x":"Jun 2018","y":5.1},{"x":"Jul 2018","y":6.2},{"x":"Aug 2018","y":6.8},{"x":"Sep 2018","y":8.3},{"x":"Oct 2018","y":11.2},{"x":"Nov 2018","y":16.8}],"code":{"bar":"ggplot(vic_weight_df, aes(month, weight_pct)) +\n  geom_col()"}}

The bar for December 2017 stands far above every other month. That bar is the attention layer's decision, made visible: of everything in Victoria's recent past, it leaned most heavily on the one month that shares December's pattern.

=== step === concept
## What an attention weight tells you, and when the cost is worth paying

An attention weight tells you exactly one thing: how much the network drew on that particular past step when it built this one forecast. It does not tell you why the pattern exists, and it does not tell you how accurate the forecast is.

The block below sorts Victoria's seven weights from the last step and prints the two largest.

```r
# Sort Victoria's attention weights and show which past month mattered most
sorted_weights <- sort(vic_weights, decreasing = TRUE)
round(sorted_weights * 100, 1)[1:2]
#> Dec 2017 Nov 2018 
#>     45.6     16.8 
```

December 2017 and November 2018 are the two months the network leaned on most for this forecast. But that does not mean December causes the spike, and it does not mean the forecast is reliable: the attention-weighted estimate, 271.3, still missed the real value of 336.8 by 65.5. A weight only describes where the network looked. It says nothing about whether it looked at the right thing, or how close the result lands.

So when does a Temporal Fusion Transformer earn its training cost? It needs hundreds of related series or more, so the encoder and decoder can learn patterns shared across series instead of just one series' quirks. It needs rich known-future covariates too, like prices, promotions and a full holiday calendar, so the known-future path has real work to do. And building all three input pipelines takes real GPU training time and engineering effort.

The table below compares it against the other forecasters this course has already built.

| Model | Series needed | Runs as live code here | Main benefit |
|---|---|---|---|
| Global model (modeltime) | A handful of related series | Yes | One model borrows strength across series instead of fitting each alone |
| Gradient boosting (gbm) | One series, reshaped into lagged features | Yes | Captures nonlinear patterns in the lagged values |
| Neural network (nnetar) | One series | Yes | Learns a nonlinear function of the recent months, averaged over 20 random starts |
| Temporal Fusion Transformer | Hundreds of related series or more, plus rich known-future covariates | No | Separates static, known-future and observed-past inputs, with attention weights you can read back |

For this one backtest, four related series and no covariate beyond the calendar, a Temporal Fusion Transformer is more machine than the problem calls for. The three simpler forecasters above run as real code on this page. A Temporal Fusion Transformer needs torch, and torch cannot load here at all.

=== step === quiz
## Closing quiz

One last check on both halves of this lesson: reading an attention weight correctly, and judging whether the model fits a situation.

Victoria's attention weight on December 2017 was 45.6 percent. What does that number actually mean?

::quiz {"correct": 1, "gate": true, "difficulty": "advanced"}
- The network drew most heavily on December 2017 when forming this one forecast. ::ok Yes. An attention weight only describes how much the network leaned on that step while building this one forecast. It says nothing about cause, accuracy, or how the business as a whole runs.
- December causes Victoria's sales to spike every year. ::no
- The forecast is 45.6 percent accurate. ::no
- Victoria's business depends mostly on what happens in December. ::no None of the other three readings hold. A weight is not a causal claim: it says nothing about why December spikes. It is not an accuracy figure either: the attention-weighted estimate still missed the real December 2018 value by 65.5. And it describes one forecast, not the whole business: Victoria sells liquor every month of the year, December is simply the month this one weight happened to favor.

=== step === tryit
## Closing coding exercise

Now do the same computation on a different state. South Australia's matching seven months are the same ones as Victoria's: December 2017, then June through November 2018.

The illustrative scores from the attention step, `vic_scores`, are still in your session. South Australia's real turnover for these seven months is supplied below.

```r
# South Australia's real turnover at the same 7 months as Victoria's scores
sa_values <- c(85.1, 43.4, 44.8, 46.4, 48.9, 50.5, 53.5)
names(sa_values) <- months

# vic_scores from the attention step is still in your session.
# Compute the softmax weights from vic_scores, sort them to find
# the two largest, and compute the weighted estimate:
# sum(weights * sa_values). Press Check when you have them.
```
::check {"regex": "(?=[\\s\\S]*exp[(])(?=[\\s\\S]*sum[(])(?=[\\s\\S]*(sort[(]|order[(]))", "gate": true, "difficulty": "intermediate", "ok": "Yes. December 2017 is still the heaviest weight at 45.6%, exactly as it was for Victoria, and the weighted estimate lands near 65.7 against the real 85.6.", "no": "Reuse the softmax formula from the attention step: sa_weights <- exp(vic_scores) / sum(exp(vic_scores)). Then sort them with sort(sa_weights, decreasing = TRUE), and compute sum(sa_weights * sa_values) for the estimate."}
::solution
```r
# Compute South Australia's attention-weighted estimate with Victoria's scores
sa_weights <- exp(vic_scores) / sum(exp(vic_scores))
round(sort(sa_weights, decreasing = TRUE) * 100, 1)[1:2]
#> Dec 2017 Nov 2018 
#>     45.6     16.8 

sa_estimate <- sum(sa_weights * sa_values)
round(sa_estimate, 1)
#> [1] 65.7

round(c(attention_weighted = sa_estimate, last_month = unname(sa_values["Nov 2018"]), six_month_mean = mean(sa_values[2:7])), 1)
#> attention_weighted         last_month     six_month_mean 
#>               65.7               53.5               47.9 
```

The weights themselves do not change. December 2017 is still 45.6 percent and November 2018 is still 16.8 percent, because the weights only depend on the seven scores, never on which state's values you multiply them by. Only the estimate changes: 65.7 against the real December 2018 value of 85.6, off by 19.9. That beats last month alone, off by 32.1, and the six-month mean, off by 37.7, the same order Victoria's three estimates came in.

=== step === concept
## References

- [Temporal Fusion Transformers for Interpretable Multi-horizon Time Series Forecasting](https://arxiv.org/abs/1912.09363) - Lim, Arik, Loeff and Pfister (2021), International Journal of Forecasting 37(4), 1748-1764. The paper behind the three input types, the encoder-decoder shape and the attention weights used in this lesson.
- [Attention Is All You Need](https://arxiv.org/abs/1706.03762) - Vaswani and colleagues (2017), Advances in Neural Information Processing Systems 30. The paper that introduced the softmax attention mechanism this lesson computes by hand.
- [Forecasting: Principles and Practice, 3rd edition](https://otexts.com/fpp3/) - Hyndman and Athanasopoulos, OTexts. The benchmark forecasters this lesson compares a Temporal Fusion Transformer against.
- [tsibbledata](https://tsibbledata.tidyverts.org/) - O'Hara-Wild, Hyndman and Wang. The package behind `aus_retail`, the source of every liquor turnover figure in this lesson.
- A note on reproducibility: the `torch` package that real Temporal Fusion Transformer implementations depend on does not load in a browser-based R session, which is why this lesson explains and shows the architecture rather than running it as live code.

=== step === complete
## What this lesson leaves you able to do

You took apart what a Temporal Fusion Transformer actually does with its three kinds of input, and computed one of its attention weights by hand. To summarize:

- A Temporal Fusion Transformer separates three input types: the static covariate (the state), the known-future input (the target month, and whether it is December), and the observed-past input (turnover up to the forecast origin).
- An encoder reads the observed-past steps and a decoder reads the known-future steps, the static covariate gates both, and an attention layer looks back across the encoder's steps before the decoder forecasts.
- Softmax turned seven illustrative scores into weights that summed to 100 percent. December 2017 took 45.6 percent of Victoria's weight against November 2018's 16.8 percent, and the attention-weighted estimate of 271.3 landed closer to the real 336.8 than either naive estimate.
- An attention weight only describes where the network looked for one forecast. It is not a causal claim and not an accuracy figure.
- The model earns its training cost on hundreds of related series or more, with rich known-future covariates. For four series and the calendar alone, the simpler forecasters already in this course do the job, and they actually run as code on this page.

The next lesson moves from picking one forecaster to combining several of them at once.
