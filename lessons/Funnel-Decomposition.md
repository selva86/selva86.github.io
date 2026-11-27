---
title: "Product Sense and Metric Diagnosis Lesson 3: Funnel Decomposition"
catalog_blurb: "The step by step breakdown that finds exactly where a funnel leaks."
description: "Harbor Market's checkout converts only 28.8% of cart openers. Learn to decompose that rate into four step rates in R and find exactly which one leaks."
keywords: "funnel decomposition, conversion rate, step conversion rate, product analytics, checkout funnel, drop-off analysis, product metrics, funnel analysis in R, product data science"
post_type: "LESSON"
curriculum_id: "3.10.3"
webr: true
mathjax: false
lesson_access: "free"
course_id: "pds-sense"
course_title: "Product Sense and Metric Diagnosis"
course_lesson: "3"
course_total: "6"
course_landing: "Product-Sense-and-Metric-Diagnosis-Course.html"
course_next: "Cohort-Analysis-and-Mix-Shift.html"
course_prev: "Metric-Drop-Diagnosis.html"
---

=== step === cover
## Funnel Decomposition

Today let's understand how one overall conversion rate breaks apart into the rate of every step inside it.

Harbor Market is a grocery delivery app. Its checkout takes a shopper through five stages: opening the cart, entering a delivery address, choosing a delivery slot, entering payment details, and confirming the order. Last week, fewer than 3 in 10 shoppers who opened the cart made it all the way to a confirmed order.

Here are those five stages.

::widget process-flow {"steps":[{"title":"Opened the cart","sub":"a shopper adds items and taps checkout"},{"title":"Entered a delivery address","sub":"where the order should be delivered"},{"title":"Chose a delivery slot","sub":"a time window for the delivery"},{"title":"Entered payment details","sub":"a card or a saved payment method"},{"title":"Confirmed the order","sub":"the order is placed"}]}

Those five boxes are the stages. What this lesson breaks apart is the rate between each neighboring pair of them.

=== step === concept
## Harbor Market's checkout funnel and the number Marcus wants fixed
::prose-only the five stages already have a diagram on the cover; this step adds the real counts behind them, in prose

Noor is a product analyst at Harbor Market. Marcus, the VP of Growth, stops by her desk with one line: checkout conversion is only 28.8%, go fix it.

Here is what that 28.8% is made of. Last week, 10,000 shoppers opened the cart. Of those, 8,000 went on to enter a delivery address, 7,600 chose a delivery slot, 7,200 entered payment details, and 2,880 confirmed the order.

2,880 out of the 10,000 who opened the cart is 2880 / 10000, which is 0.288, or 28.8%. That is the number Marcus just handed Noor.

But "go fix it" does not tell Noor where to start. The 28.8% is one number sitting on top of five stages and four steps between them, and it does not say which of those four steps is where most of the shoppers are actually leaving. That is what Noor has to find next.

=== step === concept
## What a funnel decomposition breaks a rate into

A funnel is the five stages a shopper passes through in order: opened the cart, entered a delivery address, chose a delivery slot, entered payment details, confirmed the order. Between any two neighboring stages sits one step.

For a step, define its **step conversion rate** as the share of the people who entered that step who went on to complete it. In words, step conversion rate equals the number who completed the step divided by the number who entered it, and the number who entered a step is just whoever reached the stage right before it.

Harbor Market's checkout has four such steps: opening the cart then entering a delivery address, entering a delivery address then choosing a delivery slot, choosing a delivery slot then entering payment details, and entering payment details then confirming the order.

Let's compute all four step conversion rates from the five counts, then check that multiplying them together reproduces the overall 28.8%.

```r
# Compute each step's conversion rate and check they multiply to the overall rate
harbor <- c(opened_cart = 10000, entered_address = 8000, chose_slot = 7600,
            entered_payment = 7200, confirmed_order = 2880)

entered <- harbor[c("opened_cart", "entered_address", "chose_slot", "entered_payment")]
completed <- harbor[c("entered_address", "chose_slot", "entered_payment", "confirmed_order")]
step_rate <- completed / entered
names(step_rate) <- c("cart_to_address", "address_to_slot", "slot_to_payment", "payment_to_order")

round(step_rate * 100, 1)
#>  cart_to_address  address_to_slot  slot_to_payment payment_to_order 
#>              80.0             95.0             94.7             40.0 

overall_rate <- unname(harbor["confirmed_order"] / harbor["opened_cart"])
product_rate <- unname(prod(step_rate))

round(overall_rate * 100, 1)
#> [1] 28.8
round(product_rate * 100, 1)
#> [1] 28.8
```

`entered` and `completed` line up the five counts into the four pairs that each step needs, one stage ahead of the other. Dividing `completed` by `entered` gives the four step rates: 80.0% from opening the cart to entering an address, 95.0% from there to choosing a slot, 94.7% on to entering payment, and only 40.0% from entering payment through to confirming the order.

Multiply those four numbers together and you land back on 28.8%, the same overall rate Marcus quoted.

[KEY INSIGHT]
An overall conversion rate is always the product of every step's conversion rate along the way. So the 28.8% was never one fact. It is four facts multiplied together, and three of those four look perfectly healthy.

=== step === widget
## Reading Harbor Market's step conversion rates

A table puts the four step rates side by side, so the odd one out is easy to find.

::widget styled-table {"cols":["Step","Users entering","Users completing","Step conversion"],"rows":[["Opening the cart to entering a delivery address",10000,8000,0.800],["Entering a delivery address to choosing a delivery slot",8000,7600,0.950],["Choosing a delivery slot to entering payment details",7600,7200,0.9474],["Entering payment details to confirming the order",7200,2880,0.400]],"formats":{"Users entering":"comma","Users completing":"comma","Step conversion":"pct"},"title":"Harbor Market checkout, step by step","note":"Three steps convert above 80 percent. One sits at 40 percent."}

Three of the four rows sit between 80.0% and 95.0%. The last row, entering payment details through to confirming the order, sits at 40.0%, well below the other three. Toggle the table from raw to formatted and that 40.0% row is the one to look at first.

=== step === widget
## Seeing the same rates on a chart

The same four rates read just as clearly as bars.

::widget chart-plotter {"data":[{"x":"Cart to address","y":80.0,"fill":"Healthy"},{"x":"Address to slot","y":95.0,"fill":"Healthy"},{"x":"Slot to payment","y":94.7,"fill":"Healthy"},{"x":"Payment to order","y":40.0,"fill":"Leak"}],"geoms":["bar"],"x":"step","y":"conversion_pct","code":{"bar":"ggplot(step_rates, aes(step, conversion_pct, fill = category)) +\n  geom_col()"}}

Three bars stand at roughly the same height, between 80.0% and 95.0%. The fourth, entering payment details through to confirming the order, comes in at less than half the height of the other three. That gap is exactly what a decomposed funnel chart is for: the overall rate hides it, the chart does not.

=== step === quiz
## Quick check: what does 28.8% actually tell Noor

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- It tells Noor that the step losing the most people in raw count, entering a delivery address, which drops 2,000 shoppers, is the one to fix. ::no
- It tells Noor Harbor Market's overall share of cart openers who go on to confirm an order, and nothing about which step between the stages loses them. Only the step by step breakdown she just built shows that. ::ok Right. The overall rate is one number built from four step rates multiplied together. Finding which step is leaking needs the step by step breakdown, not the aggregate.
- It tells Noor that each of the four steps loses about the same share of its own entering users. ::no
- It tells Noor that Harbor Market simply needs more shoppers to open the cart in the first place. ::no Three of these four treat a single aggregate rate as if it could point at a cause by itself. It cannot. 28.8% is the product of four separate step rates, and only a step by step breakdown, like the one just built, shows which of those four is unusually low.

=== step === concept
## Naming the leak, and what it costs Harbor Market

Call a step's rate a **leak** when it sits unusually low next to the other steps in the same funnel. At Harbor Market, the leak sits between entering payment details and confirming the order, where only 40.0% of the 7,200 shoppers who entered payment went on to confirm.

A typical rate for a step like this one, confirming an order once payment is already entered, is closer to 90%. One line of code prices the gap between Harbor Market's real 40.0% and that typical 90%.

```r
# Price the leak: what entering payment would carry at a typical 90% rate
harbor <- c(opened_cart = 10000, entered_address = 8000, chose_slot = 7600,
            entered_payment = 7200, confirmed_order = 2880)

typical_rate <- 0.90
expected_orders <- unname(harbor["entered_payment"] * typical_rate)
orders_lost <- expected_orders - unname(harbor["confirmed_order"])

expected_orders
#> [1] 6480
orders_lost
#> [1] 3600
```

At a 90% rate, the same 7,200 shoppers who entered payment would produce 6,480 confirmed orders instead of 2,880. That gap, 3,600 orders, is what the 40.0% rate costs Harbor Market every week, at last week's traffic.

That is what Noor can now hand back to Marcus. Not "fix checkout", but "entering payment details to confirming the order converts at 40%, and closing that to a typical 90% is worth 3,600 confirmed orders a week."

=== step === quiz
## Quick check: locating a leak in a funnel you have not decomposed yet

Fernbright, a different app, logs its signup funnel for last week: 20,000 people downloaded the app, 16,000 opened it, 15,200 created an account, 14,400 verified their email, and 10,800 completed their profile.

Working out the four step rates the same way as Harbor Market's gives 80.0%, 95.0%, 94.7%, and 75.0%, in that order. The first step, downloading the app to opening it, drops the most people in raw count, 4,000. The last step, verifying the email to completing the profile, drops fewer people, 3,600, but at a lower rate, 75.0% against the first step's 80.0%.

Which step is Fernbright's leak?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Downloading the app to opening it, since it drops the most people in raw count, 4,000. ::no
- Verifying the email to completing the profile, since its rate, 75.0%, is the lowest of the four, even though it drops fewer people in raw count, 3,600. ::ok Right. A leak is the step with the lowest rate, not the step with the biggest raw headcount loss. 75.0% is lower than the other three rates, so this step loses a bigger share of the people who reached it, even though that share is a smaller raw number.
- Opening the app to creating an account, since 95.0% is the highest of the four and stands furthest from the others. ::no
- Creating an account to verifying the email, since 94.7% is close to a typical rate for that kind of step. ::no Reading a funnel by raw headcount lost, or by how close a rate sits to some typical value, both miss the leak. The leak is whichever step's rate is the lowest relative to the others in the same funnel, here 75.0% against 80.0%, 95.0% and 94.7%.

=== step === tryit
## Your turn: find Larkspur's leak in R

Larkspur runs a weekly newsletter. Last week, 5,000 people visited its signup page, 4,200 of them entered an email address, 3,990 confirmed the email link sent to them, and 1,995 set a password.

Turn those four counts into three step conversion rates, then find which step has the lowest one.

```r
# Turn Larkspur's funnel counts into step conversion rates and find the leak
larkspur <- c(visited_page = 5000, entered_email = 4200, confirmed_link = 3990, set_password = 1995)

entered <- larkspur[c("visited_page", "entered_email", "confirmed_link")]
completed <- larkspur[c("entered_email", "confirmed_link", "set_password")]
step_rate <- completed / entered
names(step_rate) <- c("page_to_email", "email_to_link", "link_to_password")

round(step_rate * 100, 1)
#>    page_to_email    email_to_link link_to_password 
#>               84               95               50 

leak <- NA
leak
#> [1] NA
```

Replace the `NA` with the name of the step whose rate is lowest. Press Check when you have it.

::check {"regex": "names[(]step_rate[)].*which\\.min[(]step_rate[)]", "gate": true, "difficulty": "intermediate", "ok": "Right. link_to_password is the lowest of the three at 50%, so confirming the email link through to setting a password is Larkspur's leak, even though every one of its raw counts is smaller than Harbor Market's or Fernbright's.", "no": "Replace the NA with names(step_rate)[which.min(step_rate)]: which.min(step_rate) finds the position of the smallest rate, and names() reads off which step that position belongs to."}
::solution
```r
# Turn Larkspur's funnel counts into step conversion rates and find the leak
larkspur <- c(visited_page = 5000, entered_email = 4200, confirmed_link = 3990, set_password = 1995)

entered <- larkspur[c("visited_page", "entered_email", "confirmed_link")]
completed <- larkspur[c("entered_email", "confirmed_link", "set_password")]
step_rate <- completed / entered
names(step_rate) <- c("page_to_email", "email_to_link", "link_to_password")

leak <- names(step_rate)[which.min(step_rate)]
leak
#> [1] "link_to_password"
```

=== step === concept
## References
::prose-only a list of sources behind funnel decomposition as a product analytics technique; no new concept to show

- Croll, A. and Yoskovitz, B. (2024). [Lean Analytics](https://www.oreilly.com/library/view/lean-analytics/9781098168179/), 2nd ed. O'Reilly Media. The funnel metrics chapter on choosing what a funnel should measure.
- Mixpanel documentation. [Funnels overview](https://docs.mixpanel.com/docs/reports/funnels/funnels-overview). How a product analytics tool computes and displays step by step conversion.
- Amplitude documentation. [Funnel Analysis](https://amplitude.com/docs/analytics/charts/funnel-analysis). Step by step conversion and drop-off in a funnel report.
- Google Analytics 4 Help Center. [Funnel exploration](https://support.google.com/analytics/answer/9327974). The funnel report model GA4 users rely on.

=== step === complete
## Quick recap

Harbor Market's checkout converts 28.8% of cart openers into confirmed orders, and that number comes from four step rates multiplied together: 80.0%, 95.0%, 94.7%, and 40.0%.

The 40.0% step, entering payment details through to confirming the order, is the leak. Three steps are healthy, one is not, and the overall rate alone could never have shown which one.

Closing that step's rate to a typical 90% would be worth 3,600 more confirmed orders a week, at last week's traffic. That is what Noor hands back to Marcus: not a fix for the whole funnel, but one step, named and priced.

The same decomposition, step rates multiplied and checked against each other, works on any funnel: a checkout, a signup flow, a newsletter. The next lesson looks at a different way a metric can mislead: one that looks steady on average while one slice underneath it is moving.
