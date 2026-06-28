---
title: "Interactive Dashboards Lesson 3: Your First Shiny App"
catalog_blurb: "Turn your analysis into a tool other people can use themselves."
description: "Reactivity from scratch in R: build the smallest Shiny app, an input that drives an output, and see exactly how the reactive graph re-runs only what changed."
keywords: "Shiny, reactivity, reactive graph, your first Shiny app, shinyApp, renderText, reactive, sliderInput, R dashboard, input output"
post_type: "LESSON"
curriculum_id: "2.8.3"
webr: true
lesson_access: "free"
course_id: "da-dashboards"
course_title: "Interactive Dashboards in R"
course_lesson: "3"
course_total: "3"
course_landing: "Dashboards-Course.html"
course_next: ""
course_prev: "Quarto-Dashboards-and-Linked-Views.html"
---

=== step === cover
::eyebrow Lesson 3 of 3
## Your First Shiny App
In Lesson 2 you put Maya's six bakery shops on one screen and **linked** the tiles with crosstalk: click a shop and every chart narrows to it. But crosstalk has a hard edge. It only ever *filters rows that were already computed* when the page was built. It can never run new R after the page loads.

So when Maya asks a planning question, *"if I raise prices by 10%, what would my projected revenue be?"*, crosstalk is stuck. That number does not exist anywhere on the page yet. Someone has to **run R again** with the new 10% to compute it. That is exactly what **Shiny** does, and the engine that makes it happen is called **reactivity**.

The dashboard below is the goal. Move the **Price increase** control and watch the projected-revenue boxes and both charts recompute, live, each from a fresh calculation.

By the end of this lesson you will be able to:

- Say what **reactive** means: an output that recomputes by itself when an input it depends on changes
- Name the three parts of every Shiny app, `ui`, `server`, and `shinyApp()`, and write the smallest one
- See that the work inside an app is ordinary R you already write, just placed where Shiny can re-run it
- Trace how the **reactive graph** re-runs only what changed, and decide when you truly need Shiny

**Prerequisites:** you can run R and load a package with `library()`, you have built a ggplot and computed a summary in the [ggplot2 course](ggplot2-Course.html), and you have finished [Lesson 1](Interactive-Charts-and-Maps-in-R.html) and [Lesson 2](Quarto-Dashboards-and-Linked-Views.html), where you met crosstalk and its limit: it filters, it does not re-run R. Every new term is defined as it appears.

::widget dashboard-layout {"filterLabel":"Price increase","views":{"0%":{"boxes":[["Projected revenue","$227K"],["Extra vs now","$0"],["Customers/day","1,015"]],"line":[{"x":1,"y":205},{"x":2,"y":212},{"x":3,"y":218},{"x":4,"y":221},{"x":5,"y":224},{"x":6,"y":227}],"bar":[{"x":"Old Town","y":53},{"x":"University","y":47},{"x":"Riverside","y":42},{"x":"Garden Gate","y":36},{"x":"Harbour","y":28},{"x":"Market Sq","y":21}]},"+5%":{"boxes":[["Projected revenue","$238K"],["Extra vs now","+$11K"],["Customers/day","1,015"]],"line":[{"x":1,"y":215},{"x":2,"y":223},{"x":3,"y":229},{"x":4,"y":232},{"x":5,"y":235},{"x":6,"y":238}],"bar":[{"x":"Old Town","y":56},{"x":"University","y":49},{"x":"Riverside","y":44},{"x":"Garden Gate","y":38},{"x":"Harbour","y":29},{"x":"Market Sq","y":22}]},"+10%":{"boxes":[["Projected revenue","$250K"],["Extra vs now","+$23K"],["Customers/day","1,015"]],"line":[{"x":1,"y":226},{"x":2,"y":233},{"x":3,"y":240},{"x":4,"y":243},{"x":5,"y":246},{"x":6,"y":250}],"bar":[{"x":"Old Town","y":58},{"x":"University","y":52},{"x":"Riverside","y":46},{"x":"Garden Gate","y":40},{"x":"Harbour","y":31},{"x":"Market Sq","y":23}]}}}

=== step === concept
::eyebrow The idea
## What "reactive" means

Think of a spreadsheet. Maya types each shop's monthly revenue into cells, and in one more cell she writes a formula that adds them up: `=SUM(B2:B7)`, which reads **$227,000**. Now she edits Old Town from 53,000 to 60,000. She does not re-run anything. The total **updates itself**, instantly, to $234,000. The total *depends on* those cells, so the moment they change, it recomputes.

That self-updating is **reactivity**, and a Shiny app is built from exactly three kinds of thing:

- An **input**: a value the user sets, here a slider for the price increase. (The editable cells.)
- An **output**: something shown back, here the projected-revenue number and a chart. (The total cell.)
- A **reaction**: the R code that turns inputs into outputs. (The `SUM` formula.)

The magic word is *depends*. You never tell Shiny "recompute now." You just declare which output is built from which input, and Shiny recomputes it for you the instant that input changes.

Everything below is built from Maya's six shops. Each lesson runs in a fresh R session, so build that data right here (run this once, then every later block can use it):

```r
shops <- data.frame(
  name      = c("Riverside", "Old Town", "Market Square", "University", "Harbour", "Garden Gate"),
  area      = c("South", "North", "South", "North", "South", "North"),
  customers = c(180, 240, 95, 210, 130, 160),   # average customers per day
  revenue   = c(42000, 53000, 21000, 47000, 28000, 36000)   # revenue last month, dollars
)
sum(shops$revenue)   # the total Maya's spreadsheet shows today
#> [1] 227000
```

[KEY INSIGHT]
Reactivity is automatic recomputation. You describe *dependencies* (this output is built from that input), not *timing*. Shiny watches the inputs and re-runs the right code itself.

=== step === concept
::eyebrow The structure
## The reactive graph

Those dependencies form a small map that Shiny keeps in its head, called the **reactive graph**. It has a direction: arrows point from an input, through the R that uses it, to the output it produces.

For Maya's app the graph is a straight line: the **slider** (`input$increase`) feeds a **reaction** that recomputes projected revenue, which feeds the **output** on screen.

::widget process-flow {"steps":[{"title":"Input","sub":"the slider value input$increase, set by the user"},{"title":"Reaction","sub":"R re-runs and recomputes projected revenue from it"},{"title":"Output","sub":"the number and the bar chart redraw by themselves"}]}

The single rule that makes everything work: **when an input changes, Shiny re-runs everything downstream of it in the graph, and nothing else.** Drag the slider and the projected-revenue output recomputes, because it depends on the slider. The shop names, the page title, the layout? Untouched, because nothing connects them to that slider.

[NOTE]
"Downstream" is the whole idea. An output re-runs only if there is a path to it *from* the input that just changed. This is why Shiny apps stay fast even when they are large: a click re-runs a sliver of the graph, never the whole thing.

=== step === quiz
::eyebrow Check yourself
## Which depends on which?

Maya's app shows **projected revenue** computed from a **price-increase slider**. In the reactive graph, what is the relationship between the two?

::quiz {"correct":1,"gate":true,"difficulty":"beginner"}
- The output (projected revenue) depends on the input (the slider); change the slider and the output recomputes by itself ::ok Exactly. Arrows run input to output. The projected number is built from the slider, so it sits downstream and re-runs whenever the slider moves.
- The input (the slider) depends on the output; the projected number drives the slider ::no That is backwards. The user sets the slider; the number is *computed from* it. Dependencies point from the input the user controls to the outputs built on top of it.
- They are independent; Maya must refresh the page to make them match ::no Refreshing is exactly what reactivity removes. Because the output depends on the input, Shiny recomputes it automatically the moment the slider changes, with no refresh.

=== step === concept
::eyebrow The anatomy
## The smallest Shiny app

Every Shiny app, from this one to a giant dashboard, is just **two objects and one call**:

- a **`ui`** object: what the user sees, the inputs and the empty slots where outputs will appear;
- a **`server`** function: the recipe that fills each output from the inputs;
- a **`shinyApp(ui, server)`** call: hands both to Shiny, which starts the app.

Here is the entire smallest app for Maya's question. A slider feeds one text output. (Run this one *locally* in RStudio, an app needs a live R server, which a later step explains; here we read it.)

```r-static
library(shiny)
# shops is the data frame you built earlier, defined at the top of the app file

ui <- fluidPage(
  sliderInput("increase", "Price increase (%)", min = 0, max = 20, value = 0),
  textOutput("projected_text")
)

server <- function(input, output) {
  output$projected_text <- renderText({
    total <- sum(shops$revenue * (1 + input$increase / 100))
    paste0("Projected revenue: $", format(round(total), big.mark = ","))
  })
}

shinyApp(ui, server)
```

Read the wiring: the `ui` names a slider `"increase"` and an output slot `"projected_text"`. The `server` fills that slot by **reading `input$increase`** and **writing `output$projected_text`**. That single `renderText({ ... })` block *is* the reaction from the graph: Shiny re-runs it whenever `input$increase` changes.

::prose-only The two objects (ui, server) and the shinyApp() call are labeled inline in the code above; a separate box diagram would only relabel the same two blocks. The flow that IS visual, input to reaction to output, was shown in the reactive-graph step.

=== step === tryit
::eyebrow Your turn
## The reaction is ordinary R

Strip the Shiny wrapper away and the reaction is plain R you can run right now. A price increase of `p` percent multiplies every shop's revenue by `(1 + p / 100)`. Write that as a function and it computes real numbers, no app required:

```r
projected <- function(increase) {
  shops$revenue * (1 + increase / 100)   # each shop's revenue after the rise
}
projected(10)                            # all six shops at +10%
#> [1] 46200 58300 23100 51700 30800 39600
sum(projected(10))                       # the company total at +10%
#> [1] 249700
```

This is the *exact* expression that sits inside `renderText()`; the only difference is that Shiny passes it `input$increase` instead of you typing a number. Your turn: compute Maya's total projected revenue at a **5%** rise. Fill in the rate.

```r
total_at_5 <- sum(projected(____))   # a 5 percent price rise
total_at_5
```
::check {"regex":"projected\\D*5(?!\\d)","gate":true,"difficulty":"beginner","ok":"That is it: sum(projected(5)) returns 238350. Swap the 5 for input$increase and the same line becomes a live Shiny output.","no":"Call the function with the rate as its argument: projected(5), then wrap it in sum()."}
::solution
```r
total_at_5 <- sum(projected(5))
total_at_5
#> [1] 238350
```

=== step === widget
::eyebrow Feel it
## Move the input, the output recomputes

Here is the reactive loop you just built, made tangible. Move the **Price increase** control. Each setting hands a new value to the reaction, which recomputes the projected-revenue boxes and redraws both charts, exactly what the running app does when the slider moves.

::widget dashboard-layout {"filterLabel":"Price increase","views":{"0%":{"boxes":[["Projected revenue","$227K"],["Extra vs now","$0"],["Customers/day","1,015"]],"line":[{"x":1,"y":205},{"x":2,"y":212},{"x":3,"y":218},{"x":4,"y":221},{"x":5,"y":224},{"x":6,"y":227}],"bar":[{"x":"Old Town","y":53},{"x":"University","y":47},{"x":"Riverside","y":42},{"x":"Garden Gate","y":36},{"x":"Harbour","y":28},{"x":"Market Sq","y":21}]},"+5%":{"boxes":[["Projected revenue","$238K"],["Extra vs now","+$11K"],["Customers/day","1,015"]],"line":[{"x":1,"y":215},{"x":2,"y":223},{"x":3,"y":229},{"x":4,"y":232},{"x":5,"y":235},{"x":6,"y":238}],"bar":[{"x":"Old Town","y":56},{"x":"University","y":49},{"x":"Riverside","y":44},{"x":"Garden Gate","y":38},{"x":"Harbour","y":29},{"x":"Market Sq","y":22}]},"+10%":{"boxes":[["Projected revenue","$250K"],["Extra vs now","+$23K"],["Customers/day","1,015"]],"line":[{"x":1,"y":226},{"x":2,"y":233},{"x":3,"y":240},{"x":4,"y":243},{"x":5,"y":246},{"x":6,"y":250}],"bar":[{"x":"Old Town","y":58},{"x":"University","y":52},{"x":"Riverside","y":46},{"x":"Garden Gate","y":40},{"x":"Harbour","y":31},{"x":"Market Sq","y":23}]}}}

Nothing here is faked: the projected-revenue boxes and the bars are `shops$revenue * (1 + p / 100)` for that increase, the same arithmetic your `projected()` function runs.

=== step === quiz
::eyebrow Check yourself
## What re-runs when you drag the slider?

There is one efficiency to add first. Maya's real dashboard has *two* outputs that both need the projected numbers, the headline figure **and** the bar chart. Rather than computing the projection twice, wrap the shared work in **`reactive({ ... })`**. A reactive expression is a reusable node in the graph: it computes once when its inputs change, and every output that calls it reads the same result.

```r-static
server <- function(input, output) {
  # the shared reaction: computed once whenever the slider changes
  projected <- reactive({
    shops$revenue * (1 + input$increase / 100)
  })

  output$projected_text <- renderText({
    paste0("Projected revenue: $", format(round(sum(projected())), big.mark = ","))
  })

  output$projected_plot <- renderPlot({
    barplot(projected(), names.arg = shops$name)
  })
}
```

Now the question. Maya drags the slider from 0% to 10%. What does Shiny actually do?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- Nothing happens until she clicks a Run or Submit button ::no That is a non-reactive script. Shiny reacts automatically: changing an input triggers the recompute with no button, which is the entire point of reactivity.
- It re-runs the whole app from scratch, rebuilding the ui and re-reading the data ::no Reactivity is selective, not a full reset. The ui is not rebuilt and the data is not re-read; only the parts that depend on the changed input re-run.
- It re-runs only the reaction and the outputs that read input$increase, recomputing projected revenue; everything else is left alone ::ok Exactly. The slider invalidates the `projected()` reactive; both outputs that call it recompute; nodes with no path from the slider are untouched. That selective re-run is the reactive graph at work.

=== step === tryit
::eyebrow Your turn
## Wire the slider into the output

Here is the text output's reaction, almost complete. It should read the slider so it recomputes whenever Maya moves it. Right now the rate is hard-coded to `10`. Replace the blank with the value Shiny gives you for the slider named `"increase"`, so the output becomes truly reactive.

```r
output$projected_text <- renderText({
  total <- sum(shops$revenue * (1 + ____ / 100))   # read the slider, not a fixed 10
  paste0("Projected revenue: $", format(round(total), big.mark = ","))
})
```
::check {"regex":"input\\$increase","gate":true,"difficulty":"intermediate","ok":"Yes. input$increase is how the server reads the slider named in the ui. Because the reaction reads it, Shiny re-runs this output every time the slider moves, that is the dependency that makes it reactive.","no":"An input named \"increase\" in the ui is read in the server as input$increase. Put that where the rate goes."}
::solution
```r-static
output$projected_text <- renderText({
  total <- sum(shops$revenue * (1 + input$increase / 100))
  paste0("Projected revenue: $", format(round(total), big.mark = ","))
})
```

=== step === concept
::eyebrow Know the edge
## When you actually need Shiny

Reactivity is powerful, but it comes with a real cost worth understanding before you reach for it. Because Shiny *runs R live* in response to every input, it needs a **running R process** to talk to, a server. That is the whole difference from the tools in Lessons 1 and 2.

| You want to... | Reach for | Why |
|---|---|---|
| Re-run a calculation, model, or query when the user acts | **Shiny** | Live R reacting to inputs; needs a running R server |
| Filter or highlight the same precomputed data across charts | **crosstalk** (Lesson 2) | Browser-only row filtering; ships in a static file, no server |
| Show fixed numbers and charts at a glance, no interaction between tiles | **Quarto dashboard** (Lesson 2) | Value boxes and cards are enough; skip reactivity entirely |

[WARNING]
A Shiny app is not a file you can email. A Quarto dashboard renders to a static `.html` anyone can open; a Shiny app must be **hosted** on something that keeps R running, the free [shinyapps.io](https://www.shinyapps.io/), Posit Connect, or your own server. If your interaction only needs *filtering*, crosstalk stays server-free. Reach for Shiny when, and only when, you need a number that does not exist until the user asks for it, like Maya's projection.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [Mastering Shiny, by Hadley Wickham (free online)](https://mastering-shiny.org/) - the definitive guide; start with "Your first Shiny app" and grow from there.
- [Mastering Shiny, ch. 3: Basic reactivity](https://mastering-shiny.org/basic-reactivity.html) - the reactive graph, reactive expressions, and exactly how re-running works, in depth.
- [Shiny get-started tutorial (Posit)](https://shiny.posit.co/r/getstarted/shiny-basics/lesson1/index.html) - the canonical hands-on walkthrough from the package authors.
- [Deploying Shiny apps (Posit)](https://shiny.posit.co/r/deploy.html) - because a Shiny app needs a running R server: the official options for putting one online.

=== step === complete
## Course complete

You built reactivity from scratch. You saw that **reactive** means an output recomputes itself when an input it depends on changes; that every Shiny app is just a **`ui`**, a **`server`**, and a **`shinyApp()`** call; that the reaction inside it is ordinary R, the same `projected()` arithmetic you ran here, placed where Shiny can re-run it; and that the **reactive graph** re-runs only what is downstream of the input that changed. You also learned the edge: Shiny needs a live R server, so reach for it only when you need a value that does not yet exist on the page.

That completes **Interactive Dashboards in R**. Across three lessons you went from a single interactive chart and map, to a linked Quarto dashboard, to a live Shiny app, the full toolkit for turning a data frame into something a decision-maker can actually use. Claim your certificate from the course page, and put Maya's app online with the deployment guide above.
