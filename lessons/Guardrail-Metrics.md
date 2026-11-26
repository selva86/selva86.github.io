---
title: "Product Metric Design Lesson 3: Guardrail Metrics"
catalog_blurb: "How to pick guardrail metrics and set their thresholds before a test runs."
description: "Crestline Hardware's one-click checkout wins its OEC but breaches a refund-rate guardrail. Learn to pick guardrails and fix their thresholds before a test runs."
keywords: "guardrail metrics, guardrail metric threshold, A/B test guardrails, overall evaluation criterion, OEC, one-sided threshold, two-proportion test, product data science, experimentation metrics, launch decision"
post_type: "LESSON"
curriculum_id: "3.20.3"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "pds-metrics"
course_title: "Product Metric Design"
course_lesson: "3"
course_total: "9"
course_landing: "Product-Metric-Design-Course.html"
course_next: "Goodharts-Law-and-Metric-Gaming.html"
course_prev: "The-Overall-Evaluation-Criterion.html"
---

=== step === cover
## Guardrail Metrics

Today let's understand guardrail metrics, the numbers a team checks on the side specifically to catch harm its main metric was never built to see.

Crestline Hardware, an online hardware and tools retailer, is A/B testing a new one-click Buy Now checkout button against the two-step checkout it runs today. The one-click button skips the order-review screen entirely: a shopper lands on the cart, presses Buy Now, and the order is placed right away. Equal-sized groups of visitors see the two checkouts, 10,000 each, the current two-step flow as Control and the one-click button as Variant B.

Crestline is deciding whether to ship the button using one number fixed in advance, its Overall Evaluation Criterion: completed purchase rate. Under the button, completed purchase rate rose from 3.90% to 4.41%. But refund rate within 7 days of purchase also moved, from 2.31% to 5.67%.

Here is how Control and Variant B compare on both numbers.

::widget styled-table {"cols":["Metric","Control","Variant B"],"rows":[["Completed purchase rate","3.90%","4.41%"],["Refund rate within 7 days","2.31%","5.67%"]],"formats":{},"title":"Control vs Variant B at Crestline Hardware","note":"Completed purchase rate and refund rate within 7 days both rise under Variant B."}

Completed purchase rate rose under Variant B. So did refund rate within 7 days.

=== step === concept
## What a guardrail metric is

Crestline's Overall Evaluation Criterion settles one question: does the button make more people complete a purchase? It does. Completed purchase rate rose from 3.90% to 4.41%, so on that one measure, the button wins.

::prose-only the distinction stated directly against the cover's own two numbers, no new visual needed

But a test can move more than the one metric the team is using to decide ship or not. Refund rate within 7 days is exactly that kind of second number, and it needs its own name for the job it does.

A guardrail metric is a metric checked separately from the OEC, built to catch harm the OEC was never designed to see. It answers a different question: not "did we win", but "did we do unacceptable harm". A guardrail is checked on its own, regardless of what the OEC says, and a breach can block the launch by itself, even when the OEC wins.

For this test, refund rate within 7 days is Crestline's guardrail.

=== step === concept
## Why the OEC alone cannot catch this kind of harm

It is worth asking why completed purchase rate, Crestline's OEC, did not already catch the refund problem on its own.

::prose-only reasoning continues on the cover's table, no new visual needed

Removing the confirmation step makes checkout faster. Fewer taps between wanting the item and placing the order means fewer shoppers give up partway through, which is exactly why completed purchase rate rose.

But the same missing step that speeds up checkout also removes the one moment where a shopper could catch a mistake, the wrong size, the wrong color, one too many of something, before the order goes through. Skip that moment and some of those mistakes turn into orders, and some of those orders turn into refunds. That is exactly why refund rate rose too.

Completed purchase rate and refund rate within 7 days are reading two different consequences of the exact same change. Completed purchase rate was built to see the first consequence, people getting through checkout. It has no way of seeing the second, people buying the wrong thing by accident, which is the whole reason a separate guardrail metric exists.

=== step === concept
## Choosing which metrics are guardrails

Refund rate was not the only metric Crestline could have turned into a guardrail. Before the test ran, the team had a longer list of candidates: refund rate within 7 days, support contact rate, page load time, and employee overtime hours.

Not every metric on that list deserves guardrail status. A guardrail needs two things. First, it has to be something the team would genuinely act on, a change big enough that they would stop the launch over it. Second, it has to be measurable within this particular test, with the sample and the timeframe this test actually has.

There is a third rule too, but it applies to the list as a whole rather than to any one metric: keep the list short. A long list of guardrails trips some threshold by pure chance on its own, so a team that tags everything as a guardrail ends up blocking launches for reasons that were never really there.

Here is how the four candidates score against the first two rules.

::widget styled-table {"cols":["Candidate metric","Would we act on it","Measurable in this test"],"rows":[["Refund rate within 7 days","Yes","Yes"],["Support contact rate","Yes","Yes"],["Page load time","Yes","No"],["Employee overtime hours","No","No"]],"formats":{},"title":"Crestline Hardware guardrail candidates","note":"Refund rate and support contact rate pass both rules. Page load time and employee overtime hours each fail at least one."}

Refund rate and support contact rate pass both rules, so those are the two guardrails Crestline fixed before the test ran. Page load time is something the team would act on, but Crestline did not record page load time as part of this test, so it fails the second rule. Employee overtime hours fails both: it is not something this launch decision would turn on, and it is not even a number tied to which checkout a visitor saw.

=== step === concept
## Where to set the threshold

Refund rate and support contact rate qualify as Crestline's two guardrails. The next decision is where each one's threshold sits, the line that separates a change the business can live with from one it cannot.

::prose-only states the two thresholds the reader will use again in step 8, no new visual needed

That threshold is not "any worsening at all". Refund rate was never going to stay at exactly 2.31% under a different checkout flow; some wobble between tests is normal. And it is not a measure of how confident the team is that the change is real either. How confident you are that something changed, and how much that change should worry the business, are two different questions, and a guardrail threshold only answers the second one.

The threshold is the smallest change the business is willing to absorb. Crestline priced out what a refund actually costs: the shipping already spent, the restocking, the staff time spent reviewing the return. Weighing that cost against what the one-click button could realistically earn back in extra sales, the team decided a rise in refund rate beyond 1.5 percentage points would cost more than the button could ever make up.

So 1.5 points became refund rate's threshold. The same reasoning, applied to what a support contact costs to handle, set support contact rate's threshold at 2.5 points.

One more detail matters here. Both thresholds only count a rise. A fall in refund rate or support contact rate is not a problem Crestline needs a guardrail for, so each threshold is one-sided: a guardrail is breached only when the metric moves in the direction that causes harm.

=== step === concept
## Fixing the threshold before the test runs

There is a reason Crestline set 1.5 points and 2.5 points before a single visitor was randomised into Control or Variant B, rather than after the results came in.

::prose-only the specific failure a threshold fixed in advance prevents, no new visual needed

A threshold chosen after the data is in can be quietly argued down. Picture the same 3.36-point rise in refund rate, but imagine the team only decided on a threshold after seeing it. Whoever wants the one-click button to ship has every reason to argue the real line should sit at 4 points, not 1.5, and there is no data that can prove them wrong, because the threshold was never a measurement to begin with. It is a business decision, and a decision made after looking at the answer is not really a decision at all.

Fixing 1.5 points and 2.5 points in advance removes that argument completely. By the time the test finishes, there is nothing left to negotiate: the refund-rate threshold already exists, independent of whatever number the test happens to produce. This is the same reason an analysis plan gets written and fixed before a test runs rather than after, so the rules cannot bend to fit whichever answer somebody prefers.

=== step === widget
## Is the refund-rate gap real, or could it be noise

Before comparing the 3.36-point rise in refund rate against its 1.5-point threshold, there is one more thing to settle. Ten thousand visitors a side is a lot of visitors, but refunds are rare, so a rise this size could, in principle, still be the luck of which shoppers landed on which checkout.

Rule that out with a one-sided two-proportion test. Pool the refund counts from both groups into one shared rate, the rate you would expect if Control and Variant B really refund at exactly the same rate. Then measure how many standard errors apart the two observed rates actually sit. That distance is the z statistic, and turning it into a one-sided p-value says how often a gap this large would appear by chance alone if the two rates really were identical.

Press Run to compute the two-proportion z statistic and its one-sided p-value.

```r
# Test whether Variant B's refund-rate rise is real or just sampling noise
library(tibble)

checkout <- tribble(
  ~group,      ~visitors, ~purchases, ~refunds, ~support_contacts,
  "Control",   10000,     390,        9,        7,
  "Variant B", 10000,     441,        25,       18
)

n_control <- checkout$purchases[checkout$group == "Control"]
n_variant <- checkout$purchases[checkout$group == "Variant B"]
p_control <- checkout$refunds[checkout$group == "Control"] / n_control
p_variant <- checkout$refunds[checkout$group == "Variant B"] / n_variant
p_pooled  <- sum(checkout$refunds) / sum(checkout$purchases)
se_pooled <- sqrt(p_pooled * (1 - p_pooled) * (1 / n_control + 1 / n_variant))
z         <- (p_variant - p_control) / se_pooled
p_value   <- 1 - pnorm(z)
round(c(z = z, p_value = p_value), 4)
#>       z p_value 
#>  2.4411  0.0073 
```

`z`, about 2.44, says the gap sits about 2.44 standard errors away from the point where the two refund rates would be identical. `p_value`, about 0.0073, says that if refund rate really were identical under both checkouts, a gap this large or larger would appear in only about 7 of every 1,000 tests. That is rare enough to treat the 3.36-point rise as real, not chance.

Here is that same distance plotted against the null distribution, the spread of gaps you would expect to see under pure chance if refund rate did not actually differ between Control and Variant B.

::widget null-distribution {"tails": 1, "max": 4, "start": 2.4, "label": "z for the refund-rate gap"}

The marker starts at 2.4, almost exactly where the statistic just computed sits. The shaded tail is the p-value, the share of pure-chance gaps that reach that far out or further.

Drag the marker further from zero and the shaded tail keeps shrinking. Pull it back toward zero and the tail swells, meaning a gap that small would be unremarkable under pure chance. At 2.4, the tail is already thin, which is the picture behind the 0.0073 just calculated.

=== step === widget
## Reading the guardrail's verdict, and why it blocks the launch

The two-proportion test confirmed the refund-rate gap is real. Now it is time to compare that real gap against the threshold Crestline fixed before the test ran, for both of its guardrails.

Here is each guardrail next to its threshold.

::widget styled-table {"cols":["Guardrail","Observed change","Threshold","Verdict"],"rows":[["Refund rate within 7 days","+3.36 pts","1.5 pts","Breached"],["Support contact rate","+2.29 pts","2.5 pts","Passes"]],"formats":{},"title":"Crestline Hardware guardrail verdicts","note":"Refund rate rise is more than double its threshold. Support contact rate rise stays under its own."}

Refund rate rose 3.36 points, more than double its 1.5-point threshold. That is a breach. Support contact rate rose 2.29 points, which is also a rise in the wrong direction, but it stays under its own 2.5-point threshold. That is a pass.

Notice what each guardrail's verdict actually depends on. It is never just the direction a metric moved, worse is not automatically a breach. It is whether the size of that rise crosses the specific line fixed for that specific guardrail, in advance.

The launch rule Crestline set is simple: the OEC has to win, and every guardrail has to pass. Completed purchase rate did win, up 0.51 points, a 13.1% relative lift. But refund rate, one of the two guardrails, breached its threshold.

One breach is enough. Despite winning its OEC by a wide margin, Crestline's one-click button is blocked.

=== step === quiz
## Quick check: a winning OEC and a breached guardrail

Crestline's one-click checkout button won its OEC by 0.51 points, a 13.1% relative lift, and the two-proportion test confirmed refund rate's 3.36-point rise is real, not noise. Given both of those facts, what does this mean for the launch?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The button should ship. The OEC won, and a rise this size in refund rate could still just be sampling noise. ::no
- The button is blocked. The OEC won by 0.51 points, but refund rate, one of Crestline's two guardrails, breached its 1.5-point threshold, and one breach is enough regardless of the OEC. ::ok Right. The two-proportion test already ruled out noise, a z of about 2.44 and a one-sided p of about 0.0073, so the 3.36-point rise is real. Real and over the 1.5-point threshold is a breach, and the launch rule needs every guardrail to pass, not just the OEC to win.
- The button is blocked, but for a different reason: support contact rate also worsened, so both guardrails breached. ::no Two things to check before reading this one. First, the refund-rate rise already passed its own realness check back at the null distribution, a one-sided p of about 0.0073, so it is not noise. Second, a guardrail's verdict depends on its own threshold, not just which direction it moved: support contact rate also rose, 2.29 points, but that stayed under its 2.5-point threshold, so it passed. Refund rate is the one guardrail that actually breached, and that alone is enough to block the launch.

=== step === tryit
## Your turn: set a one-sided threshold from a dollar cost

QuickCart, a grocery delivery app, is testing a button that skips its address-confirmation screen. Order-cancellation rate is the metric the team is watching as a possible guardrail: skipping confirmation could let more orders go out to the wrong address, which gets cancelled once the mistake is caught. Run it through the two rules from a few steps back: the team would genuinely act on a rise in cancellation rate, and it is measurable within this test's own numbers, so cancellation rate qualifies as QuickCart's guardrail.

Now the team has to set its threshold the way Crestline set 1.5 points for refund rate: not from how confident they are the rate changed, but from a dollar cost. Each cancelled order costs QuickCart $4.50 in groceries that were already picked but never delivered. Across the 10,000 orders this test will run, the team has decided it can absorb at most $900 of that cost before the button is costing more than it could realistically earn back.

Baseline cancellation rate is 1.20%. Work out how many extra cancellations $900 actually buys, then turn that count into a one-sided percentage-point threshold, the same way Crestline turned a refund's cost into 1.5 points.

```r
# Turn QuickCart's dollar budget into a one-sided percentage-point threshold
orders_tested <- 10000
extra_cancellations_allowed <- ____
threshold_pct <- extra_cancellations_allowed / orders_tested * 100
round(threshold_pct, 2)
```
::check {"regex": "(?=[\\s\\S]*900)(?=[\\s\\S]*4\\.5)", "gate": true, "difficulty": "intermediate", "ok": "Right: 2. 900 divided by 4.50 is 200 extra cancellations QuickCart can absorb, and 200 out of 10,000 orders is a 2 percentage point threshold. Any rise in cancellation rate beyond 2 points from now on breaches QuickCart guardrail.", "no": "Divide the dollar budget by the cost of one cancellation: 900 / 4.50. That gives the extra cancellations the budget allows, which the next line turns into a percentage."}
::solution
```r
# Turn QuickCart's dollar budget into a one-sided percentage-point threshold
orders_tested <- 10000
extra_cancellations_allowed <- 900 / 4.50
threshold_pct <- extra_cancellations_allowed / orders_tested * 100
round(threshold_pct, 2)
#> [1] 2
```

Notice the baseline cancellation rate, 1.20%, never entered the calculation. The threshold comes entirely from what the business can absorb in dollars, the same way Crestline's 1.5 points came from what a refund costs to process, not from how often refunds already happen.

=== step === concept
## References
::prose-only the references are text, not a visual

- Kohavi, R., Tang, D., and Xu, Y. (2020). [Trustworthy Online Controlled Experiments: A Practical Guide to A/B Testing](https://doi.org/10.1017/9781108653985). Cambridge University Press. Defines guardrail metrics and the practice of fixing their thresholds before a test runs.
- Dmitriev, P. and Wu, X. (2016). [Measuring Metrics](https://doi.org/10.1145/2983323.2983356). Proceedings of the 25th ACM International Conference on Information and Knowledge Management (CIKM), 429-437. On measuring the sensitivity and trustworthiness of the metrics a team chooses to track in an experiment.
- Deng, A. and Shi, X. (2016). [Data-Driven Metric Development for Online Controlled Experiments: Seven Lessons Learned](https://doi.org/10.1145/2939672.2939700). Proceedings of the 22nd ACM SIGKDD International Conference on Knowledge Discovery and Data Mining, 77-86. Lessons on developing and selecting experiment metrics, including organisational guardrail-style metrics.
- Xu, Y., Chen, N., Fernandez, A., Sinno, O., and Bhasin, A. (2015). [From Infrastructure to Culture: A/B Testing Challenges in Large Scale Social Networks](https://doi.org/10.1145/2783258.2788602). Proceedings of the 21st ACM SIGKDD International Conference on Knowledge Discovery and Data Mining, 2227-2236. An industry account of operating guardrail metrics and trust at scale.
- Fabijan, A., Dmitriev, P., McFarland, C., Vermeer, L., Holmstrom Olsson, H., and Bosch, J. (2018). [Experimentation Growth: Evolving Trustworthy A/B Testing Capabilities in Online Software Companies](https://doi.org/10.1002/smr.2113). Journal of Software: Evolution and Process, 30(12), e2113. On the organisational practice of setting guardrail and OEC metrics as an experimentation program matures.

=== step === complete
## One breach is enough

Crestline's one-click checkout button won its OEC. Completed purchase rate rose 0.51 points, from 3.90% to 4.41%, a 13.1% relative lift. By that one measure alone, the button looks like a clear win.

But a guardrail metric exists to catch exactly the kind of harm an OEC was never built to see. Refund rate within 7 days and support contact rate both qualified as guardrails because the team would act on a rise in either one and both are measurable within this test. Each one's threshold, 1.5 points for refund rate and 2.5 points for support contact rate, was fixed before a single visitor was randomised, from what each kind of harm actually costs the business, not from whatever the test happened to produce.

Refund rate's rise, confirmed real by a two-proportion test, came in at 3.36 points, more than double its threshold. Support contact rate rose too, 2.29 points, but stayed under its own 2.5-point line. One guardrail breached is all the launch rule needs: the button is blocked, despite winning its OEC by a wide margin.

The next lesson turns to what happens once a metric everyone is watching becomes a target worth gaming.
