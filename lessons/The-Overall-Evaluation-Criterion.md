---
title: "Product Metric Design Lesson 2: The Overall Evaluation Criterion"
catalog_blurb: "Combine four metrics into one weighted score fixed before the test runs."
description: "Arrow Outfitters' redesign moves four metrics in different directions. Learn to combine them into one Overall Evaluation Criterion fixed before the test runs."
keywords: "overall evaluation criterion, OEC, weighted metric score, percent change normalisation, metric weighting, ship decision, A/B test metrics, product data science, experimentation metrics"
post_type: "LESSON"
curriculum_id: "3.20.2"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "pds-metrics"
course_title: "Product Metric Design"
course_lesson: "2"
course_total: "9"
course_landing: "Product-Metric-Design-Course.html"
course_next: "Guardrail-Metrics.html"
course_prev: "Metric-Taxonomy-Input-Output-Leading-Lagging.html"
---

=== step === cover
## The Overall Evaluation Criterion

Today let's understand how a team turns four metrics, two of them wins and two of them costs, into one number that actually decides whether to ship.

Arrow Outfitters, an online apparel retailer, is A/B testing a redesigned product page against the one it runs today. The redesign gives the page a bigger image gallery and a simpler size chart. Equal-sized groups of visitors see the two pages, the current page as Control and the redesign as Variant B.

When the test finishes, four numbers have moved. Conversion rate went from 3.80% to 4.10%. Revenue per visitor went from \$3.10 to \$3.25. Return rate went from 9.0% to 10.4%. And page load time went from 1.8 seconds to 2.1 seconds.

Here is how Control and Variant B compare on all four.

::widget styled-table {"cols":["Metric","Control","Variant B"],"rows":[["Conversion rate","3.80%","4.10%"],["Revenue per visitor","$3.10","$3.25"],["Return rate","9.00%","10.40%"],["Page load time","1.8s","2.1s"]],"formats":{},"title":"Control vs Variant B for Arrow Outfitters","note":"Conversion rate and revenue per visitor favour Variant B. Return rate and page load time do not."}

Two of those four numbers are gains for Variant B and two are costs, and nothing in that table yet says which page actually wins.

=== step === concept
## What the Overall Evaluation Criterion is

A test that moves four metrics in four different ways leaves a team with a problem. Read conversion rate alone and Variant B looks good. Read page load time alone and it looks bad. Whichever metric gets checked first ends up deciding the ship decision, and a different favourite metric would have decided it differently.

::prose-only the definition stated plainly, no new visual needed yet

The fix used in controlled-experiment practice is the Overall Evaluation Criterion, or OEC. It is one number, built from several metrics, that the team agrees in advance will decide whether to ship. Agreeing on it in advance is the whole point. The team picks which metrics go in, and how much each one counts, before the test runs and before anyone has seen which page wins. Once the test is over, the OEC is read off, not negotiated.

=== step === concept
## Choosing which metrics belong in the OEC

Before combining anything, the team has to decide which metrics even belong in the OEC. Arrow Outfitters uses all four from the first table, but for two different reasons.

::prose-only the four metrics sorted into outcome and cost, no new visual needed

Conversion rate and revenue per visitor represent the outcome the redesign is actually for. A bigger image gallery and a simpler size chart exist to get more people to buy, and to get more revenue out of each visitor who does.

Return rate and page load time represent the costs a redesign like this could quietly create. A bigger image gallery can slow the page down. A simpler size chart can mean some buyers choose the wrong size and send it back.

Leave either pair out, and the OEC stops doing its job. Drop the cost metrics, and a redesign that sells more while quietly breaking size accuracy or page speed would still score well. Drop the outcome metrics, and a page that loads fast and gets few returns but sells nothing would score well too. The OEC only works when it covers both what the change is for and what it could cost.

=== step === concept
## Putting four differently-scaled metrics on one scale

Even once the right four metrics are chosen, they cannot just be added together. Look at what each one actually is. Conversion rate moved by 0.30 percentage points, from 3.80% to 4.10%. Revenue per visitor moved by \$0.15, from \$3.10 to \$3.25. Return rate moved by 1.4 percentage points, from 9.0% to 10.4%. And page load time moved by 0.3 seconds, from 1.8 to 2.1.

A percentage-point change, a dollar change, another percentage-point change and a change in seconds are four different kinds of number. Summing 0.30 and 0.15 and 1.4 and 0.3 would mix units that have nothing in common, the way adding 2 kilograms to 2 minutes does not give a usable number.

What all four metrics can share is how big their change is relative to where they started. Divide each metric's change by its Control value, and multiply by 100, and every metric turns into a percent change relative to control, a plain number with no unit attached.

Press Run to turn all four raw changes into one comparable scale.

```r
# Turn each raw metric change into a percent change relative to control
control <- c(conversion = 3.80, revenue = 3.10, returns = 9.0, load_time = 1.8)
variant_b <- c(conversion = 4.10, revenue = 3.25, returns = 10.4, load_time = 2.1)
pct_change <- (variant_b - control) / control * 100
round(pct_change, 2)
#> conversion    revenue    returns  load_time 
#>       7.89       4.84      15.56      16.67 
```

Conversion rate rose 7.89% relative to its own Control value, revenue per visitor rose 4.84%, return rate rose 15.56%, and page load time rose 16.67%. Every one of the four is now on the same scale, a percent change relative to where that metric started. For the first time, 7.89 and 15.56 are directly comparable numbers, even though one came from a percentage-point change and the other also did on a different base, and 16.67 came from a change measured in seconds.

Without this step, the OEC would be adding together numbers that measure completely different things. With it, the four percent changes sit on one scale, which is exactly what combining them needs next.

=== step === concept
## Weighting each metric by how much it matters

A percent change on its own still does not say how much Arrow Outfitters should care about it. A 16.67% change in page load time and a 4.84% change in revenue per visitor are not equally important to the business, even though they are now on the same scale.

So the team assigns each metric a weight, a number that says how much it should count toward the final score. Revenue per visitor gets 0.50, the metric the business cares about most. Conversion rate gets 0.30. Return rate gets -0.15, and page load time gets -0.05.

The two cost metrics, return rate and page load time, get negative weights. Weighting by a negative number means a rise in that metric subtracts from the score instead of adding to it, which is exactly what a cost metric getting worse should do: pull the final number down, not up.

The four weights are chosen so their absolute values sum to 1, 0.50 plus 0.30 plus 0.15 plus 0.05. That keeps the scale of the final score tied to the scale of a single percent change, rather than letting the number grow just because more metrics were added in.

Press Run to see each metric's percent change next to the weight the team gave it.

```r
# Give each metric a business-chosen weight, negative for a cost metric
weights_v1 <- c(conversion = 0.30, revenue = 0.50, returns = -0.15, load_time = -0.05)
sum(abs(weights_v1))
#> [1] 1
data.frame(percent_change = round(pct_change, 2), weight = weights_v1)
#>            percent_change weight
#> conversion           7.89   0.30
#> revenue              4.84   0.50
#> returns             15.56  -0.15
#> load_time           16.67  -0.05
```

The absolute weights sum to exactly 1, confirmed by `sum(abs(weights_v1))`. And the table lines up each metric's percent change with the weight the team chose for it. The percent changes in the first column came from the data. The weights in the second column came from a decision the team made about what matters, and that decision was made before anyone had looked at which numbers the test would return.

=== step === widget
## Arrow Outfitters' OEC, laid out as one table

Multiply each metric's percent change by its weight, and the result is that metric's contribution to the final score. Add the four contributions together, and the result is the Overall Evaluation Criterion itself.

Here is that multiplication laid out as one table, each contribution and the total they sum to.

::widget styled-table {"cols":["Metric","Percent change","Weight","Weighted contribution"],"rows":[["Conversion rate","+7.89%","0.30","+2.37"],["Revenue per visitor","+4.84%","0.50","+2.42"],["Return rate","+15.56%","-0.15","-2.33"],["Page load time","+16.67%","-0.05","-0.83"],["Overall Evaluation Criterion","","","+1.62"]],"formats":{},"title":"The Overall Evaluation Criterion for Arrow Outfitters","note":"Weighted contribution is percent change multiplied by weight. The four contributions sum to the OEC."}

Conversion rate contributes +2.37, its 7.89% change times its 0.30 weight. Revenue per visitor contributes +2.42, its 4.84% change times its 0.50 weight. Return rate contributes -2.33, its 15.56% change times its -0.15 weight, a cost pulling the score down. Page load time contributes -0.83, its 16.67% change times its -0.05 weight, also pulling down.

Add those four contributions and the OEC comes to +1.62. Add the table's rounded figures by hand, 2.37 plus 2.42 minus 2.33 minus 0.83, and the total lands a cent off, at 1.63, because rounding each contribution first throws away a sliver of precision. The real OEC rounds only once, after summing the full-precision contributions, which is where +1.62 comes from. It is positive, so by the rule fixed before the test, a positive OEC means Arrow Outfitters ships Variant B.

Notice what just happened. Two of the four raw metrics, return rate and page load time, got worse under Variant B. The OEC still comes out positive, because the two metrics the team weighted more heavily, conversion rate and revenue per visitor, outweighed the two it weighted less heavily. The ship decision came from the whole weighted sum, not from any one metric on its own.

=== step === widget
## Charting the OEC as a balance of gains and costs

The OEC table already holds the four weighted contributions. Plotted as bars, the same four numbers show something a column of numbers does not: which ones are pulling the score up, and which ones are pulling it down.

Here are those four weighted contributions as bars instead of numbers.

::widget chart-plotter {"data":[{"x":"Conversion","y":2.37},{"x":"Revenue","y":2.42},{"x":"Returns","y":-2.33},{"x":"Load time","y":-0.83}],"geoms":["bar"],"x":"metric","y":"weighted_contribution"}

Conversion rate and revenue per visitor sit above zero, the two contributions pulling the OEC up. Return rate and page load time sit below zero, the two pulling it down. The OEC itself is not a fifth bar sitting somewhere else. It is what is left once the bars above zero and the bars below zero are added together, +2.37 plus 2.42 minus 2.33 minus 0.83, the same +1.62 as before.

Seen this way, the OEC is not a verdict that arrived from nowhere. It is a net: four contributions pulling in two directions, and the score is just which side wins.

=== step === concept
## What changing the weights does to the decision

Suppose a different team at Arrow Outfitters cared much more about returns, maybe because a return costs more in shipping and restocking than a sale is worth. That team would set the weights differently: revenue per visitor at 0.35, conversion rate at 0.20, return rate at -0.35, and page load time at -0.10. The absolute values still sum to 1, so the new weights are a legitimate OEC, just one that leans harder on the cost side.

Nothing about the test itself changes. The four percent changes, 7.89, 4.84, 15.56 and 16.67, are exactly the same numbers either team would use.

Press Run to recompute the OEC with these new weights on the same percent changes.

```r
# Re-weight toward the cost metrics and recompute the OEC on the same data
weights_v2 <- c(conversion = 0.20, revenue = 0.35, returns = -0.35, load_time = -0.10)
oec_v2 <- sum(weights_v2 * pct_change)
round(oec_v2, 2)
#> [1] -3.84
```

The OEC comes back negative, -3.84. Where the first weighting said ship, this one would block the launch, on the identical four percent changes from the identical test.

That is the whole risk the Overall Evaluation Criterion creates if it is not handled carefully. The weights decide the outcome, not the metrics. Which is exactly why the weights have to be fixed and agreed before the test runs, not chosen afterward by whichever side wants a particular number to come out ahead. A team that picks its weights after seeing +1.62 and -3.84 is not measuring anything. It is choosing its own answer.

=== step === concept
## What the OEC score does and does not tell you

Go back to Arrow Outfitters' first weighting, the one that gave +1.62 and a ship decision. What does that +1.62 actually settle, and what does it leave open?

::prose-only the point is what the score from the earlier table settles versus what it leaves open, no new visual needed

What it settles is the one question the team agreed in advance it would settle: given these four metrics and these weights, does the weighted, normalised combination favour Variant B or not. Here it does, so the team ships it. That is the whole and only job the OEC was built to do, and it is worth having precisely because a team cannot quietly swap in a different answer once the result is in.

What it does not say is that every metric improved. It did not. Return rate and page load time both got worse under Variant B, visible back in the first table. The OEC does not erase that. It weighs the gains against the costs and still comes out positive.

And it says nothing about whether either cost, on its own, is large enough to actually worry about. A 15.56% rise in return rate might be a problem worth fixing even while the overall score says ship. The OEC was never built to answer that question, only the ship-or-not question it was set up in advance to settle.

=== step === quiz
## Quick check: reading an OEC score

Arrow Outfitters' first weighting gave an OEC of +1.62. What does that number actually tell you?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Every one of Arrow Outfitters' four metrics improved under Variant B. ::no
- The weighted, normalised combination of the four metrics favours Variant B, which is why the team ships it. ::ok Right. That is the one question an OEC settles: under the weights chosen before the test, does the combination favour the variant or not. It says nothing about whether every metric improved, and the weights themselves were a business choice fixed in advance, not something measured from the test.
- The weights were estimated by measuring how much each metric moved during the test, the way a regression coefficient is estimated. ::no The weights are not estimated from the test data. Arrow Outfitters set 0.30, 0.50, -0.15 and -0.05 before the test ran, the way a weight on a scale is set by hand, not fit like a regression coefficient. A positive OEC also does not mean every metric improved, return rate and page load time both got worse under Variant B.

=== step === tryit
## Your turn: compute the OEC under a new set of weights

`pct_change` still holds the four percent changes. Suppose a third team sets the weights at conversion 0.30, revenue 0.40, returns -0.20 and load time -0.10. Compute the OEC those weights give on the same percent changes, and see which side of zero it lands on.

```r
# Compute a third OEC score from the same percent changes, a different weight set
weights_v3 <- c(conversion = 0.30, revenue = 0.40, returns = -0.20, load_time = -0.10)
oec_v3 <- ____
round(oec_v3, 2)
```
::check {"regex": "(?=[\\s\\S]*sum[(])(?=[\\s\\S]*weights_v3)(?=[\\s\\S]*pct_change)", "gate": true, "difficulty": "intermediate", "ok": "Right: -0.47. Negative, so this third weighting also lands on the do not ship side, though only just. A weight set this close to zero shows how sensitive the ship decision can be to a choice made before anyone sees the data.", "no": "Multiply the weight vector by the pct_change object and add the four products: sum(weights_v3 * pct_change)."}
::solution
```r
# Compute a third OEC score from the same percent changes, a different weight set
weights_v3 <- c(conversion = 0.30, revenue = 0.40, returns = -0.20, load_time = -0.10)
oec_v3 <- sum(weights_v3 * pct_change)
round(oec_v3, 2)
#> [1] -0.47
```

=== step === concept
## References
::prose-only the references are text, not a visual

- Kohavi, R., Tang, D., and Xu, Y. (2020). [Trustworthy Online Controlled Experiments: A Practical Guide to A/B Testing](https://doi.org/10.1017/9781108653985). Cambridge University Press. Defines the Overall Evaluation Criterion and its role in deciding an experiment before it runs.
- Kohavi, R. and Longbotham, R. (2017). [Online Controlled Experiments and A/B Testing](https://doi.org/10.1007/978-1-4899-7687-1_891). Encyclopedia of Machine Learning and Data Mining, Springer. Introduces the OEC as a single metric a team agrees on in advance.
- Kohavi, R., Deng, A., Frasca, B., Walker, T., Xu, Y., and Pohlmann, N. (2013). [Online Controlled Experiments at Large Scale](https://doi.org/10.1145/2487575.2488217). Proceedings of the 19th ACM SIGKDD International Conference on Knowledge Discovery and Data Mining. Discusses combining several metrics into one overall evaluation criterion at scale.
- Tang, D., Agarwal, A., O'Brien, D., and Meyer, M. (2010). [Overlapping Experiment Infrastructure: More, Better, Faster Experimentation](https://doi.org/10.1145/1835804.1835810). Proceedings of the 16th ACM SIGKDD International Conference on Knowledge Discovery and Data Mining. An early industry account of combining multiple metrics into one experiment-level decision metric.

=== step === complete
## One number, chosen in advance

Arrow Outfitters ran one test and got two different answers. Weighted the first way, conversion 0.30, revenue 0.50, returns -0.15, load time -0.05, the OEC came to +1.62 and the page shipped. Weighted the second way, revenue 0.35, conversion 0.20, returns -0.35, load time -0.10, the identical four percent changes gave -3.84 and the page would not have shipped.

Nothing about the test changed between those two numbers. Conversion rate still rose 7.89%, revenue per visitor still rose 4.84%, return rate still rose 15.56%, and page load time still rose 16.67%. Only the weights changed, and the weights are a business decision, not a measurement.

That is why the Overall Evaluation Criterion earns its name only when the weights are fixed before the test runs. Pick the metrics that cover both what the redesign is for and what it could cost, turn their raw changes into comparable percent changes, assign each one a weight the team can defend before anyone has seen a single result, and the final number settles the ship decision honestly. Choose the weights after looking at the data, and the number stops measuring anything at all.

The next lesson takes this further: guardrail metrics, the ones that can block a launch even when the OEC itself improves.
