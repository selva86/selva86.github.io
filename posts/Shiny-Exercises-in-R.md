---
title: "Shiny Exercises in R: 25 Real-World Practice Problems"
slug: "Shiny-Exercises-in-R"
description: "Twenty-five hands-on Shiny exercises in R covering UI, reactivity, modules, downloads, plotly, DT, themes and deployment polish. Solutions hidden."
keywords: "shiny exercises in R, shiny app practice, shiny reactive exercises, R shiny tutorial practice, shiny module exercises, shiny dashboard exercises"
mathjax: false
webr: false
date: "2026-05-12"
post_type: "EX"
sidebar_title: "Shiny Exercises"
sidebar_order: 133
fr_parent: "R-Tutorial.html"
auto_link_terms: "shiny exercises in R|shiny app practice|shiny reactive exercises|R shiny tutorial practice|shiny module exercises|shiny dashboard exercises"
auto_link_case_sensitive: false
target_keyword: "shiny exercises in R"
sibling_block_enabled: false
difficulty: "Mixed"
---

# Shiny Exercises in R: 25 Real-World Practice Problems

<p class="lead">Twenty-five practice problems that build real Shiny apps: UI layouts, reactivity, modules, downloads, brushing, plotly, DT, theming and deployment polish. Each exercise names a save-to variable and hides the solution behind a click. Build each app, run it locally with <code>runApp(ex_n_m)</code>, then compare to the solution.</p>

```r title="Run this once before any exercise"
library(shiny)
library(shinydashboard)
library(bslib)
library(dplyr)
library(ggplot2)
library(DT)
library(plotly)
```

Every solution defines a `shinyApp(ui, server)` object and assigns it to `ex_<section>_<problem>`. To preview locally, save the file and call `runApp(ex_1_1)` from the R console; the gallery output describes what the browser should show so you can verify against the screenshot in your head before peeking.

## Section 1. UI scaffolding (5 problems)

### Exercise 1.1: Build a Hello-name app with sidebarLayout

**Task:** A growth analyst onboarding to Shiny wants the smallest useful skeleton: a `sidebarLayout` with one `textInput` for a visitor name and a main panel that greets them by name as they type. Build the app and save the `shinyApp` object to `ex_1_1`.

**Expected result:**

```
# Browser shows:
# - title: "Hello Shiny"
# - sidebar: textInput labeled "Your name" (empty by default)
# - main panel: live text "Hello, <name>!" updating as the user types
# Initial render with empty input shows "Hello, !"
```

**Difficulty:** Beginner

```r title="Your turn"
ui <- # your code here

server <- # your code here

ex_1_1 <- shinyApp(ui, server)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ui <- fluidPage(
  titlePanel("Hello Shiny"),
  sidebarLayout(
    sidebarPanel(textInput("name", "Your name", "")),
    mainPanel(textOutput("greeting"))
  )
)

server <- function(input, output, session) {
  output$greeting <- renderText({
    paste0("Hello, ", input$name, "!")
  })
}

ex_1_1 <- shinyApp(ui, server)
```

**Explanation:** Every Shiny app pairs a `ui` (an `htmlTag` object) with a `server` (a function of `input`, `output`, `session`). The reactive link is `input$name` -> `renderText({...})` -> `output$greeting`. Because `renderText` re-runs whenever its referenced inputs change, no explicit observer is needed. Keep this skeleton memorised; nearly every Shiny app is a richer version of these eight lines.

</details>

### Exercise 1.2: Sum two numeric inputs with a reactive expression

**Task:** Build an app with two `numericInput` controls labeled "a" and "b" (both starting at 0) and a `verbatimTextOutput` showing their sum. Use a `reactive()` expression so the sum is computed once even if you reuse it later. Save the `shinyApp` object to `ex_1_2`.

**Expected result:**

```
# Browser shows two number boxes side by side and one output area.
# With a = 7 and b = 5 the output area reads:
# [1] 12
```

**Difficulty:** Beginner

```r title="Your turn"
ui <- # your code here
server <- # your code here
ex_1_2 <- shinyApp(ui, server)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ui <- fluidPage(
  numericInput("a", "a", 0),
  numericInput("b", "b", 0),
  verbatimTextOutput("sum")
)

server <- function(input, output, session) {
  total <- reactive(input$a + input$b)
  output$sum <- renderPrint(total())
}

ex_1_2 <- shinyApp(ui, server)
```

**Explanation:** A `reactive()` expression is lazy and cached: it only re-evaluates when one of its dependencies changes, and `total()` returns the cached value on subsequent reads. Without `reactive()`, doubling the use of `input$a + input$b` would recompute it twice. `renderPrint` differs from `renderText` because it dispatches the value through `print()`, so vectors and lists format with `[1]` prefixes.

</details>

### Exercise 1.3: Histogram of faithful eruptions with a sliderInput

**Task:** An onboarding tutorial classic: build an app that draws a histogram of `faithful$eruptions` with a `sliderInput` controlling the number of bins (range 5 to 50, default 20). Use base `hist()` inside `renderPlot`. Save the `shinyApp` object to `ex_1_3`.

**Expected result:**

```
# Browser shows:
# - title "Old Faithful Eruptions"
# - left sidebar: sliderInput "Bins" (5-50, default 20)
# - main panel: histogram of faithful$eruptions
# Bars cluster around two modes near 2 min and 4.5 min.
```

**Difficulty:** Intermediate

```r title="Your turn"
ui <- # your code here
server <- # your code here
ex_1_3 <- shinyApp(ui, server)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ui <- fluidPage(
  titlePanel("Old Faithful Eruptions"),
  sidebarLayout(
    sidebarPanel(sliderInput("bins", "Bins", min = 5, max = 50, value = 20)),
    mainPanel(plotOutput("hist"))
  )
)

server <- function(input, output, session) {
  output$hist <- renderPlot({
    hist(faithful$eruptions, breaks = input$bins,
         col = "steelblue", main = NULL, xlab = "Eruptions (min)")
  })
}

ex_1_3 <- shinyApp(ui, server)
```

**Explanation:** `renderPlot` captures the entire plotting region: anything that produces a base R or grid graphic between the braces is rendered into the `plotOutput`. The histogram is bimodal because eruptions cluster into short (~2 min) and long (~4.5 min) categories, which is exactly the surprise this dataset is famous for. Setting `main = NULL` keeps the title-bar real estate for the `titlePanel`.

</details>

### Exercise 1.4: Tabbed mtcars explorer with tabsetPanel

**Task:** Build an app with three tabs over `mtcars`: a "Summary" tab showing `summary(mtcars)` via `verbatimTextOutput`, a "Table" tab showing the data with `tableOutput`, and a "Plot" tab showing a base scatter of `mpg` vs `wt`. Use `tabsetPanel`. Save the `shinyApp` object to `ex_1_4`.

**Expected result:**

```
# Browser shows three tabs at the top: Summary | Table | Plot.
# Summary tab: text output starting with
#   Min. 1st Qu.  Median    Mean 3rd Qu.    Max.
#   10.40   15.43   19.20   20.09   22.80   33.90  (mpg row)
# Table tab: 32-row table with columns mpg, cyl, ... carb.
# Plot tab: scatter, mpg on y, wt on x, points trend downward.
```

**Difficulty:** Intermediate

```r title="Your turn"
ui <- # your code here
server <- # your code here
ex_1_4 <- shinyApp(ui, server)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ui <- fluidPage(
  titlePanel("mtcars Explorer"),
  tabsetPanel(
    tabPanel("Summary", verbatimTextOutput("summary")),
    tabPanel("Table",   tableOutput("table")),
    tabPanel("Plot",    plotOutput("plot"))
  )
)

server <- function(input, output, session) {
  output$summary <- renderPrint(summary(mtcars))
  output$table   <- renderTable(mtcars, rownames = TRUE)
  output$plot    <- renderPlot(plot(mtcars$wt, mtcars$mpg, pch = 19))
}

ex_1_4 <- shinyApp(ui, server)
```

**Explanation:** `tabsetPanel` lets one app present several views without crowding the UI; only the active tab's outputs are visible, but all outputs are still computed by default. For expensive computations you can wrap them with `bindCache` or move them into `eventReactive` triggered by tab change to defer the work. `tableOutput` is a simple HTML table; for sortable, paged tables prefer `DTOutput` (used in Section 5).

</details>

### Exercise 1.5: Build a shinydashboard skeleton with three valueBoxes

**Task:** A retail ops lead wants a one-glance dashboard for `mtcars`. Use `shinydashboard::dashboardPage` with a header, blank sidebar and a body containing three `valueBox` widgets showing the count of cars, mean mpg and max horsepower. Save the `shinyApp` object to `ex_1_5`.

**Expected result:**

```
# Browser shows a dark-blue header bar reading "mtcars Ops".
# Body has three coloured boxes (blue, green, orange) reading:
#   32      cars
#   20.09   mean mpg
#   335     max hp
```

**Difficulty:** Intermediate

```r title="Your turn"
ui <- # your code here
server <- # your code here
ex_1_5 <- shinyApp(ui, server)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ui <- dashboardPage(
  dashboardHeader(title = "mtcars Ops"),
  dashboardSidebar(),
  dashboardBody(
    fluidRow(
      valueBox(nrow(mtcars),                       "cars",      icon = icon("car"),   color = "blue"),
      valueBox(round(mean(mtcars$mpg), 2),         "mean mpg",  icon = icon("road"),  color = "green"),
      valueBox(max(mtcars$hp),                     "max hp",    icon = icon("bolt"),  color = "orange")
    )
  )
)

server <- function(input, output, session) {}

ex_1_5 <- shinyApp(ui, server)
```

**Explanation:** `shinydashboard` is a CSS theme on top of plain Shiny that gives you the recognisable header + sidebar + body chrome. `valueBox` is the headline-number widget every ops dashboard needs; for reactive numbers you would wrap each one in `renderValueBox` and emit it from the server, but for static snapshots like this the calls can live directly in the UI.

</details>

## Section 2. Reactivity fundamentals (5 problems)

### Exercise 2.1: Cache a filtered subset with reactive()

**Task:** Build an app with a `selectInput` of `iris` species and two outputs: a `tableOutput` showing the first six rows of the filtered species and a `verbatimTextOutput` showing `summary()` of that subset. Use a single `reactive()` so the filter runs once per species change. Save the `shinyApp` object to `ex_2_1`.

**Expected result:**

```
# With "setosa" selected, the table shows the first six setosa rows
# (Sepal.Length values around 5.1, 4.9, 4.7, 4.6, 5.0, 5.4) and the
# summary block shows:
#   Sepal.Length    Sepal.Width  ...  Species
#   Min.   :4.300  Min.   :2.300  ...  setosa    :50
#   ...
```

**Difficulty:** Intermediate

```r title="Your turn"
ui <- # your code here
server <- # your code here
ex_2_1 <- shinyApp(ui, server)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ui <- fluidPage(
  selectInput("sp", "Species", choices = levels(iris$Species)),
  tableOutput("head"),
  verbatimTextOutput("summ")
)

server <- function(input, output, session) {
  filtered <- reactive(iris[iris$Species == input$sp, ])
  output$head <- renderTable(head(filtered()))
  output$summ <- renderPrint(summary(filtered()))
}

ex_2_1 <- shinyApp(ui, server)
```

**Explanation:** Without `reactive()`, both `output$head` and `output$summ` would each recompute `iris[iris$Species == input$sp, ]`, and any heavier filter would be billed twice. The `reactive()` wrapper memoises the result and invalidates only when `input$sp` changes. Call it like a function: `filtered()`. This pattern is the single most useful idiom in non-trivial Shiny apps.

</details>

### Exercise 2.2: Notify on button click with observeEvent

**Task:** Add an `actionButton` labeled "Notify me" to a minimal app; on click, fire a `showNotification("Saved")` toast that lasts 3 seconds. Use `observeEvent` so the notification only triggers on click, not on app start. Save the `shinyApp` object to `ex_2_2`.

**Expected result:**

```
# Browser shows a single button "Notify me".
# On first click: a green toast appears bottom-right reading "Saved"
# and fades out after ~3 seconds.
# No toast on initial app load.
```

**Difficulty:** Intermediate

```r title="Your turn"
ui <- # your code here
server <- # your code here
ex_2_2 <- shinyApp(ui, server)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ui <- fluidPage(actionButton("go", "Notify me"))

server <- function(input, output, session) {
  observeEvent(input$go, {
    showNotification("Saved", type = "message", duration = 3)
  })
}

ex_2_2 <- shinyApp(ui, server)
```

**Explanation:** `observeEvent` reacts to the named event (here `input$go`) and ignores all other reactives accessed in its body. Crucially, it does NOT run on app start because the button counter is 0; a plain `observe({...})` block referring to `input$go` WOULD run once at start. Use `observeEvent` for side effects: notifications, writes, modal launches. Use `eventReactive` when you need the gated result to feed an output.

</details>

### Exercise 2.3: Re-sample on demand with eventReactive

**Task:** Build an app with an `actionButton` "Re-sample" and a `verbatimTextOutput`. On each click, draw 1000 values from `rnorm()` and print their mean and sd to four digits. The output must not change between clicks even if other inputs would. Save the `shinyApp` object to `ex_2_3`.

**Expected result:**

```
# On first click (seed-free), output reads roughly:
# mean = -0.0145  sd = 1.0021
# After a second click the numbers shift to a new draw.
# Before any click, output is empty.
```

**Difficulty:** Intermediate

```r title="Your turn"
ui <- # your code here
server <- # your code here
ex_2_3 <- shinyApp(ui, server)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ui <- fluidPage(
  actionButton("draw", "Re-sample"),
  verbatimTextOutput("stats")
)

server <- function(input, output, session) {
  sample_vals <- eventReactive(input$draw, rnorm(1000))
  output$stats <- renderText({
    x <- sample_vals()
    sprintf("mean = %.4f  sd = %.4f", mean(x), sd(x))
  })
}

ex_2_3 <- shinyApp(ui, server)
```

**Explanation:** `eventReactive` is the "I want a button-gated reactive value" tool: the body only runs when its trigger fires, and the resulting reactive returns the last computed value on subsequent reads. It is the natural pair to `observeEvent`. The output stays empty until the first click because, like a `reactive()`, calling `sample_vals()` before it has ever run returns an `silent.shiny.error`, which `renderText` skips gracefully.

</details>

### Exercise 2.4: Guard rendering with validate and need

**Task:** Build an app where a `selectInput` for `iris` species starts with no selection (`selected = ""`) and a `plotOutput` shows a sepal-length boxplot. Use `validate(need(...))` so the plot panel shows "Please pick a species" instead of erroring when nothing is selected. Save the `shinyApp` object to `ex_2_4`.

**Expected result:**

```
# Initial state: dropdown shows no selection.
# Plot panel reads (in light grey italic): "Please pick a species"
# After choosing "versicolor": a boxplot of Sepal.Length appears
# (whiskers roughly 4.9-7.0, median near 5.9).
```

**Difficulty:** Advanced

```r title="Your turn"
ui <- # your code here
server <- # your code here
ex_2_4 <- shinyApp(ui, server)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ui <- fluidPage(
  selectInput("sp", "Species",
              choices = c("", levels(iris$Species)),
              selected = ""),
  plotOutput("box")
)

server <- function(input, output, session) {
  output$box <- renderPlot({
    validate(need(nzchar(input$sp), "Please pick a species"))
    sub <- iris[iris$Species == input$sp, ]
    boxplot(sub$Sepal.Length, main = input$sp)
  })
}

ex_2_4 <- shinyApp(ui, server)
```

**Explanation:** `need(cond, msg)` returns `NULL` when `cond` is truthy and a `validation` error otherwise; `validate()` catches that and quietly renders `msg` instead of crashing the output. This is the right way to guard expensive renderings on optional inputs. Throwing a regular `stop()` would paint a red error box in the UI, which is jarring; `validate` paints a calm, italicised hint.

</details>

### Exercise 2.5: Break a dependency with isolate

**Task:** Build an app with a `textInput` "name" and a `numericInput` "version" plus a "Save" `actionButton`. A `verbatimTextOutput` should show a sentence like "Saved name=Selva at version 3", but it must update ONLY when Save is clicked, even if name or version change in between. Save the `shinyApp` object to `ex_2_5`.

**Expected result:**

```
# Type "Selva" into name and 1 into version: output stays blank.
# Click Save: output reads "Saved name=Selva at version 1".
# Change version to 5 without clicking Save: output still reads
# "Saved name=Selva at version 1".
# Click Save again: output now reads "Saved name=Selva at version 5".
```

**Difficulty:** Advanced

```r title="Your turn"
ui <- # your code here
server <- # your code here
ex_2_5 <- shinyApp(ui, server)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ui <- fluidPage(
  textInput("name", "Name", "Selva"),
  numericInput("version", "Version", 1),
  actionButton("save", "Save"),
  verbatimTextOutput("msg")
)

server <- function(input, output, session) {
  saved <- eventReactive(input$save, {
    paste0("Saved name=", isolate(input$name),
           " at version ", isolate(input$version))
  })
  output$msg <- renderText(saved())
}

ex_2_5 <- shinyApp(ui, server)
```

**Explanation:** `eventReactive(input$save, ...)` already gates on the button, but inside the body any `input$name` reference would create a reactive dependency, so changing the name between clicks would re-fire. Wrapping each input in `isolate()` reads its current value WITHOUT creating a reactive dependency. The combination "trigger via eventReactive, read via isolate" is the standard pattern for save/submit/commit buttons.

</details>

## Section 3. Inputs, outputs and filtering (5 problems)

### Exercise 3.1: Populate a selectInput from data

**Task:** Build an app whose `selectInput` choices are the unique species in `iris`, computed at server startup (not hardcoded). Below the selector, render the filtered rows in a `tableOutput`. The first six rows are enough; use `head()`. Save the `shinyApp` object to `ex_3_1`.

**Expected result:**

```
# Dropdown choices: setosa | versicolor | virginica (alphabetical).
# Default selection "setosa" shows a 6-row table whose Sepal.Length
# column begins 5.1, 4.9, 4.7, 4.6, 5.0, 5.4 and Species column
# is all "setosa".
```

**Difficulty:** Beginner

```r title="Your turn"
ui <- # your code here
server <- # your code here
ex_3_1 <- shinyApp(ui, server)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ui <- fluidPage(
  selectInput("sp", "Species", choices = sort(unique(as.character(iris$Species)))),
  tableOutput("tbl")
)

server <- function(input, output, session) {
  output$tbl <- renderTable(head(iris[iris$Species == input$sp, ]))
}

ex_3_1 <- shinyApp(ui, server)
```

**Explanation:** Computing `choices` from the data, instead of hardcoding `c("setosa", "versicolor", "virginica")`, is what makes the app self-updating when new data arrives. For very large vectors, sort once at app start (as here in `ui`) rather than on every render. If the choices themselves depend on a reactive input (cascading dropdowns), use `updateSelectInput` from the server side.

</details>

### Exercise 3.2: Date-range filter on the economics dataset

**Task:** A finance team wants to inspect any window of the `ggplot2::economics` series. Build an app with a `dateRangeInput` (initial range: 1990-01-01 to 2000-12-31) and a `plotOutput` showing a line plot of `pce` over `date` for that window using ggplot2. Save the `shinyApp` object to `ex_3_2`.

**Expected result:**

```
# Browser shows a dateRangeInput defaulting to 1990-01-01 / 2000-12-31
# and a line plot below.
# pce rises roughly from 3700 (1990) to 6800 (2000), monotonic.
# Changing the end date to 1995-12-31 truncates the line at ~4900.
```

**Difficulty:** Intermediate

```r title="Your turn"
ui <- # your code here
server <- # your code here
ex_3_2 <- shinyApp(ui, server)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ui <- fluidPage(
  dateRangeInput("rng", "Window",
                 start = "1990-01-01", end = "2000-12-31"),
  plotOutput("line")
)

server <- function(input, output, session) {
  output$line <- renderPlot({
    d <- economics %>% filter(date >= input$rng[1], date <= input$rng[2])
    ggplot(d, aes(date, pce)) + geom_line(colour = "steelblue") + theme_minimal()
  })
}

ex_3_2 <- shinyApp(ui, server)
```

**Explanation:** `input$rng` returns a length-2 `Date` vector, so subscript with `[1]` and `[2]`. The `economics` dataset is bundled with ggplot2 and ships pre-loaded once you call `library(ggplot2)`; that is why no `data(economics)` is needed. For very long series, do the filter inside a `reactive()` and use it across multiple outputs (Exercise 2.1) instead of refiltering inside every `renderPlot`.

</details>

### Exercise 3.3: Reveal advanced inputs with conditionalPanel

**Task:** Build an app with a `checkboxInput("adv", "Show advanced")` and a `conditionalPanel` that, when checked, reveals two more controls: a `numericInput` for sample size (default 100) and a `selectInput` for distribution ("normal" or "uniform"). A `plotOutput` always shows a histogram. Save the `shinyApp` object to `ex_3_3`.

**Expected result:**

```
# Initial: checkbox unchecked; only the histogram of rnorm(100) shows.
# After checking "Show advanced": two extra controls appear; choosing
# "uniform" with n = 500 renders a roughly flat histogram between 0 and 1.
```

**Difficulty:** Intermediate

```r title="Your turn"
ui <- # your code here
server <- # your code here
ex_3_3 <- shinyApp(ui, server)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ui <- fluidPage(
  checkboxInput("adv", "Show advanced", FALSE),
  conditionalPanel(
    condition = "input.adv == true",
    numericInput("n", "Sample size", 100, min = 10, max = 5000),
    selectInput("dist", "Distribution", c("normal", "uniform"))
  ),
  plotOutput("hist")
)

server <- function(input, output, session) {
  output$hist <- renderPlot({
    n    <- if (isTruthy(input$n))    input$n    else 100
    dist <- if (isTruthy(input$dist)) input$dist else "normal"
    x <- if (dist == "uniform") runif(n) else rnorm(n)
    hist(x, col = "grey80", main = NULL)
  })
}

ex_3_3 <- shinyApp(ui, server)
```

**Explanation:** `conditionalPanel`'s `condition` is a JavaScript expression evaluated client-side, so it uses `input.adv` with a dot, not `input$adv`. Because the hidden inputs are not yet attached to the DOM when the checkbox is off, `input$n` is `NULL` initially; `isTruthy` is the canonical guard that returns `FALSE` for `NULL`, `""`, `NA` or empty vectors. Hide things to keep the UI calm; defer them to keep the server fast.

</details>

### Exercise 3.4: Download the filtered subset as CSV

**Task:** Build an app with a `selectInput` for `mtcars` cylinder counts (4, 6, 8) and a `downloadButton` "Download CSV". Clicking the button must save the currently filtered subset to a file named `mtcars_<cyl>.csv`. Save the `shinyApp` object to `ex_3_4`.

**Expected result:**

```
# Browser shows cylinder dropdown and a "Download CSV" button.
# Selecting 6 and clicking the button triggers a save dialog for
# the file "mtcars_6.csv" containing 7 rows (the six-cylinder cars):
#   mpg,cyl,disp,hp,drat,wt,qsec,vs,am,gear,carb
#   21.0,6,160,110,3.9,2.62,16.46,0,1,4,4
#   ...
```

**Difficulty:** Intermediate

```r title="Your turn"
ui <- # your code here
server <- # your code here
ex_3_4 <- shinyApp(ui, server)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ui <- fluidPage(
  selectInput("cyl", "Cylinders", c(4, 6, 8)),
  downloadButton("dl", "Download CSV")
)

server <- function(input, output, session) {
  subset_df <- reactive(mtcars[mtcars$cyl == as.numeric(input$cyl), ])

  output$dl <- downloadHandler(
    filename = function() paste0("mtcars_", input$cyl, ".csv"),
    content  = function(file) write.csv(subset_df(), file, row.names = TRUE)
  )
}

ex_3_4 <- shinyApp(ui, server)
```

**Explanation:** `downloadHandler` needs two functions: `filename` returns the suggested file name shown in the browser dialog, and `content` writes the bytes to the `file` path Shiny supplies. Pair it with `downloadButton(id, label)` in the UI; the `id` must match. Because `input$cyl` is a string from `selectInput`, cast it to numeric before filtering or use string equality on `as.character(mtcars$cyl)`.

</details>

### Exercise 3.5: Build a counter with reactiveValues

**Task:** Build an app with two buttons "Up" and "Down" and a large `verbatimTextOutput` showing the current count, starting at 0. Use `reactiveValues` to hold the count so both observers can mutate it. Save the `shinyApp` object to `ex_3_5`.

**Expected result:**

```
# Initial display: 0
# After: Up Up Up Down -> display: 2
# Counter persists across other unrelated input changes.
```

**Difficulty:** Advanced

```r title="Your turn"
ui <- # your code here
server <- # your code here
ex_3_5 <- shinyApp(ui, server)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ui <- fluidPage(
  actionButton("up",   "Up"),
  actionButton("down", "Down"),
  verbatimTextOutput("count")
)

server <- function(input, output, session) {
  state <- reactiveValues(n = 0L)
  observeEvent(input$up,   state$n <- state$n + 1L)
  observeEvent(input$down, state$n <- state$n - 1L)
  output$count <- renderText(state$n)
}

ex_3_5 <- shinyApp(ui, server)
```

**Explanation:** `reactiveValues()` is the mutable counterpart of `reactive()`: many writers, many readers, no caching of derived values. Anything that reads `state$n` (here `renderText`) re-fires when `n` changes; anything that writes (here the two observers) does not create a read dependency. Avoid `<<-` and global variables in Shiny apps; they break when a second user session opens. `reactiveValues` is session-scoped by default and is the right tool.

</details>

## Section 4. Modules and reusability (4 problems)

### Exercise 4.1: A histogram module with NS and moduleServer

**Task:** Build a Shiny module called `histModule` with a UI function `histUI(id, label)` (sliderInput for bins, plotOutput) and a server function `histServer(id, data)` that draws a base histogram of the supplied numeric vector. Mount one instance in an app using `histUI("e")` and `histServer("e", faithful$eruptions)`. Save the `shinyApp` object to `ex_4_1`.

**Expected result:**

```
# Browser shows a single sliderInput labeled "Eruptions bins"
# (range 5-50, default 20) and a histogram below.
# Histogram is bimodal as in Exercise 1.3.
```

**Difficulty:** Advanced

```r title="Your turn"
histUI <- # your code here
histServer <- # your code here
ex_4_1 <- shinyApp(...)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
histUI <- function(id, label = "Bins") {
  ns <- NS(id)
  tagList(
    sliderInput(ns("bins"), label, 5, 50, 20),
    plotOutput(ns("plot"))
  )
}

histServer <- function(id, data) {
  moduleServer(id, function(input, output, session) {
    output$plot <- renderPlot({
      hist(data, breaks = input$bins, col = "steelblue",
           main = NULL, xlab = NULL)
    })
  })
}

ui <- fluidPage(histUI("e", "Eruptions bins"))
server <- function(input, output, session) histServer("e", faithful$eruptions)

ex_4_1 <- shinyApp(ui, server)
```

**Explanation:** `NS(id)` returns a namespacing function so the UI's `bins` input becomes `e-bins` in the rendered DOM, preventing id collisions when the module is reused. `moduleServer` creates an isolated `input`/`output`/`session` scope so the server logic only sees its own namespaced ids. Modules are how Shiny apps stay maintainable past a few hundred lines; a module is the Shiny equivalent of a function.

</details>

### Exercise 4.2: Reuse the histogram module twice side by side

**Task:** Take `histUI` and `histServer` from Exercise 4.1 and mount TWO instances in a `fluidRow` with two `column(6, ...)` halves: one for `faithful$eruptions` (id "e") and one for `faithful$waiting` (id "w"). The two histograms must have independent sliders. Save the `shinyApp` object to `ex_4_2`.

**Expected result:**

```
# Browser shows two side-by-side panels.
# Left: slider "Eruptions" + histogram of faithful$eruptions (bimodal).
# Right: slider "Waiting" + histogram of faithful$waiting (also
# bimodal, modes near 55 and 80).
# Adjusting the left slider does NOT change the right plot.
```

**Difficulty:** Advanced

```r title="Your turn"
ui <- # your code here
server <- # your code here
ex_4_2 <- shinyApp(ui, server)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
histUI <- function(id, label = "Bins") {
  ns <- NS(id)
  tagList(
    sliderInput(ns("bins"), label, 5, 50, 20),
    plotOutput(ns("plot"))
  )
}

histServer <- function(id, data) {
  moduleServer(id, function(input, output, session) {
    output$plot <- renderPlot({
      hist(data, breaks = input$bins, col = "steelblue", main = NULL)
    })
  })
}

ui <- fluidPage(
  fluidRow(
    column(6, histUI("e", "Eruptions")),
    column(6, histUI("w", "Waiting"))
  )
)
server <- function(input, output, session) {
  histServer("e", faithful$eruptions)
  histServer("w", faithful$waiting)
}

ex_4_2 <- shinyApp(ui, server)
```

**Explanation:** The two instances share NO state because `NS("e")` and `NS("w")` namespace the bins slider into `e-bins` and `w-bins`. This is the payoff of writing a module: a non-trivial widget can be parameterised and dropped wherever it is needed without copy-paste drift. Compare to a non-modular version where you would maintain two parallel sets of input ids and two separate render expressions.

</details>

### Exercise 4.3: Return a reactive from a module

**Task:** Build a `pickerUI(id)` (a `selectInput` of `iris` species) and `pickerServer(id)` that RETURNS a `reactive()` of the filtered data frame. In the main app, mount the picker and use the returned reactive to drive a `tableOutput` showing the first six rows. Save the `shinyApp` object to `ex_4_3`.

**Expected result:**

```
# Browser shows a species dropdown and a 6-row table below.
# Switching to "virginica" updates the table to the first six
# virginica rows (Sepal.Length values 6.3, 5.8, 7.1, 6.3, 6.5, 7.6).
```

**Difficulty:** Advanced

```r title="Your turn"
pickerUI <- # your code here
pickerServer <- # your code here
ex_4_3 <- shinyApp(...)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
pickerUI <- function(id) {
  ns <- NS(id)
  selectInput(ns("sp"), "Species", choices = levels(iris$Species))
}

pickerServer <- function(id) {
  moduleServer(id, function(input, output, session) {
    reactive(iris[iris$Species == input$sp, ])
  })
}

ui <- fluidPage(pickerUI("p"), tableOutput("tbl"))

server <- function(input, output, session) {
  filtered <- pickerServer("p")
  output$tbl <- renderTable(head(filtered()))
}

ex_4_3 <- shinyApp(ui, server)
```

**Explanation:** A module's server function can RETURN anything it likes; returning a `reactive()` is the canonical way to expose a value to the parent without exposing the internal input ids. The parent calls `pickerServer("p")` and stores the returned reactive in a local name, then reads it with `filtered()` like any other reactive. This is how you build composable Shiny apps without leaking namespaces.

</details>

### Exercise 4.4: Communicate between two modules via a reactive

**Task:** Compose two modules: `pickerUI/pickerServer` from Exercise 4.3 and a new `tableUI(id)` + `tableServer(id, data)` that renders `head(data(), 6)`. In the main app, wire the picker's return value into the table module. The two modules must not reference each other's input ids directly. Save the `shinyApp` object to `ex_4_4`.

**Expected result:**

```
# Browser shows dropdown above, table below (same shape as 4.3
# visually). Architecture difference: the table is rendered by
# tableServer, not the main server function.
# Selecting "setosa" updates the 6-row table to setosa rows.
```

**Difficulty:** Advanced

```r title="Your turn"
pickerUI <- # ...
pickerServer <- # ...
tableUI <- # ...
tableServer <- # ...
ex_4_4 <- shinyApp(...)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
pickerUI <- function(id) {
  ns <- NS(id)
  selectInput(ns("sp"), "Species", choices = levels(iris$Species))
}
pickerServer <- function(id) {
  moduleServer(id, function(input, output, session) {
    reactive(iris[iris$Species == input$sp, ])
  })
}

tableUI <- function(id) {
  ns <- NS(id)
  tableOutput(ns("tbl"))
}
tableServer <- function(id, data) {
  moduleServer(id, function(input, output, session) {
    output$tbl <- renderTable(head(data(), 6))
  })
}

ui <- fluidPage(pickerUI("p"), tableUI("t"))

server <- function(input, output, session) {
  filtered <- pickerServer("p")
  tableServer("t", filtered)
}

ex_4_4 <- shinyApp(ui, server)
```

**Explanation:** The contract between modules is a function call: the picker exposes a reactive returning a filtered data frame, the table accepts that reactive and renders the head. Neither module knows the other's namespace, so you can swap implementations freely. This same pattern scales to dozens of modules in production apps: each module owns its UI, its input ids and its server logic, communicating only through arguments and return values.

</details>

## Section 5. Data apps with plots and tables (4 problems)

### Exercise 5.1: ggplot2 scatter with reactive filtering

**Task:** Build an app with a `sliderInput` for `diamonds$carat` (range 0.2 to 5, default 1 to 3) and a `plotOutput` showing a ggplot2 scatter of `price` vs `carat` for the filtered subset, coloured by `cut`. Save the `shinyApp` object to `ex_5_1`.

**Expected result:**

```
# Browser shows a range slider (0.2-5) and a scatter plot below.
# Default window 1-3: cloud of points rising left to right;
# colour legend on the right with five cut levels.
# Narrowing the slider to 1-1.5 thins the cloud sharply.
```

**Difficulty:** Intermediate

```r title="Your turn"
ui <- # your code here
server <- # your code here
ex_5_1 <- shinyApp(ui, server)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ui <- fluidPage(
  sliderInput("ct", "Carat", min = 0.2, max = 5, value = c(1, 3), step = 0.1),
  plotOutput("scatter")
)

server <- function(input, output, session) {
  output$scatter <- renderPlot({
    d <- diamonds %>% filter(carat >= input$ct[1], carat <= input$ct[2])
    ggplot(d, aes(carat, price, colour = cut)) +
      geom_point(alpha = 0.4) +
      theme_minimal()
  })
}

ex_5_1 <- shinyApp(ui, server)
```

**Explanation:** A two-handle slider returns a length-2 numeric vector, used here as `input$ct[1]` and `input$ct[2]`. `alpha = 0.4` is the right default for overplotted scatterplots like `diamonds`, which has 53,940 rows. For very large data you would either pre-aggregate (heatmap-style) or use `geom_hex()`; rendering 50k+ points in `ggplot2` every keystroke is the leading cause of sluggish Shiny apps.

</details>

### Exercise 5.2: DT::renderDataTable with column filters

**Task:** Build an app that renders `mtcars` as a `DT::datatable` with per-column filter boxes turned on, pagination at 10 rows per page, and row names visible. Wrap the call so search works on every column. Save the `shinyApp` object to `ex_5_2`.

**Expected result:**

```
# Browser shows a DataTable of mtcars (32 rows, 11 columns) with a
# search box on every column, a global search, and "Show 10 entries"
# pagination.
# Filtering cyl to "8" reduces visible rows to 14.
```

**Difficulty:** Intermediate

```r title="Your turn"
ui <- # your code here
server <- # your code here
ex_5_2 <- shinyApp(ui, server)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ui <- fluidPage(DTOutput("tbl"))

server <- function(input, output, session) {
  output$tbl <- renderDT(
    datatable(mtcars,
              filter   = "top",
              rownames = TRUE,
              options  = list(pageLength = 10))
  )
}

ex_5_2 <- shinyApp(ui, server)
```

**Explanation:** `DT::datatable` is the standard widget when a static `tableOutput` is not enough: sorting, paging and column-level filtering all come free. `filter = "top"` puts a small input under each header row; values are coerced to the column's type, so numeric columns get range sliders, factors get dropdowns and characters get text boxes. For very large tables, pair with `server = TRUE` so DT pages the data server-side.

</details>

### Exercise 5.3: Convert a ggplot to an interactive plotly chart

**Task:** Build an app that renders the `mpg` vs `wt` ggplot scatter of `mtcars`, coloured by `cyl`, as an interactive plotly chart via `ggplotly`. Use `renderPlotly` and `plotlyOutput`. Hovering on a point should show its row label. Save the `shinyApp` object to `ex_5_3`.

**Expected result:**

```
# Browser shows a plotly chart with hover tooltips.
# Hovering over the point near (5.25, 10.4) reveals
#   wt: 5.250
#   mpg: 10.4
#   cyl: 8
#   label: Cadillac Fleetwood
# Toolbar (zoom, pan, save png) appears top-right.
```

**Difficulty:** Advanced

```r title="Your turn"
ui <- # your code here
server <- # your code here
ex_5_3 <- shinyApp(ui, server)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ui <- fluidPage(plotlyOutput("p"))

server <- function(input, output, session) {
  output$p <- renderPlotly({
    df <- mtcars
    df$label <- rownames(df)
    g <- ggplot(df, aes(wt, mpg, colour = factor(cyl), text = label)) +
      geom_point(size = 3) +
      theme_minimal()
    ggplotly(g, tooltip = c("wt", "mpg", "colour", "text"))
  })
}

ex_5_3 <- shinyApp(ui, server)
```

**Explanation:** `ggplotly` walks the ggplot graphics stack and converts each layer into a plotly trace, preserving aesthetics and faceting. The `text` aesthetic carries the row label into the tooltip without changing the visual; `tooltip = c(...)` whitelists which fields show. Plotly is heavier than base plotting and adds ~3MB to the page, so reserve it for charts that genuinely benefit from hover and zoom.

</details>

### Exercise 5.4: Brush-to-select on a plotOutput

**Task:** Build an app with a `plotOutput("sc", brush = "br")` showing `mtcars` (`wt` vs `mpg`) and a `verbatimTextOutput("sel")` below that prints the rows currently inside the brush rectangle using `brushedPoints`. Save the `shinyApp` object to `ex_5_4`.

**Expected result:**

```
# Drag a rectangle around the upper-left cluster (light cars).
# Output below shows something like:
#   mpg  cyl disp  hp drat   wt qsec vs am gear carb
#   Fiat 128  32.4   4   78.7  66 4.08 2.20 19.47 1 1 4 1
#   Honda Civic 30.4 4  75.7  52 4.93 1.615 18.52 1 1 4 2
#   Toyota Corolla 33.9 4 71.1 65 4.22 1.835 19.90 1 1 4 1
#   ...
```

**Difficulty:** Advanced

```r title="Your turn"
ui <- # your code here
server <- # your code here
ex_5_4 <- shinyApp(ui, server)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ui <- fluidPage(
  plotOutput("sc", brush = "br"),
  verbatimTextOutput("sel")
)

server <- function(input, output, session) {
  output$sc <- renderPlot(plot(mtcars$wt, mtcars$mpg, pch = 19,
                               xlab = "wt", ylab = "mpg"))
  output$sel <- renderPrint({
    brushedPoints(mtcars, input$br, xvar = "wt", yvar = "mpg")
  })
}

ex_5_4 <- shinyApp(ui, server)
```

**Explanation:** Brushing turns a plot into an interactive selector: `brush = "br"` on the plotOutput exposes `input$br`, a list with the brush coordinates. `brushedPoints` filters the source data frame to the rows whose `xvar`/`yvar` values fall inside the rectangle. This is the simplest way to add drill-down to a Shiny app; combine with a `DTOutput` for a click-rectangle-see-rows pattern that analysts love.

</details>

## Section 6. UX polish and deployment hardening (2 problems)

### Exercise 6.1: Show progress on a slow computation with withProgress

**Task:** Build an app with an `actionButton` "Run slow job" and a `plotOutput` showing the histogram of the result. The "job" is a `Sys.sleep`-padded loop that draws 100k normal values in five 20k chunks. Wrap the loop in `withProgress` and call `incProgress(1/5)` per chunk so users see a progress bar. Save the `shinyApp` object to `ex_6_1`.

**Expected result:**

```
# Click "Run slow job". A blue progress bar in the top-right slides
# from 0% to 100% over ~5 seconds, labelled "Drawing samples...".
# When it disappears, a histogram of 100,000 normal values appears
# (bell-shaped, x roughly -4 to 4).
```

**Difficulty:** Advanced

```r title="Your turn"
ui <- # your code here
server <- # your code here
ex_6_1 <- shinyApp(ui, server)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ui <- fluidPage(
  actionButton("go", "Run slow job"),
  plotOutput("h")
)

server <- function(input, output, session) {
  result <- eventReactive(input$go, {
    withProgress(message = "Drawing samples...", value = 0, {
      out <- numeric(0)
      for (i in 1:5) {
        Sys.sleep(1)
        out <- c(out, rnorm(20000))
        incProgress(1 / 5)
      }
      out
    })
  })
  output$h <- renderPlot(hist(result(), col = "steelblue", main = NULL))
}

ex_6_1 <- shinyApp(ui, server)
```

**Explanation:** `withProgress` opens a progress notification scoped to the surrounding reactive context; `incProgress(amount, detail)` advances it by `amount` (a fraction of 1) and optionally updates the detail label. Without progress feedback, any computation over ~2 seconds feels broken to users. For chained pipelines, prefer `Progress$new()` with explicit `$set(value, detail)` calls; for one-shot loops like this, `withProgress + incProgress` is enough.

</details>

### Exercise 6.2: Apply a bslib theme for a branded look

**Task:** Build a small app with a `titlePanel`, a `sliderInput` and a `plotOutput`, and apply a custom `bs_theme` using `bslib::bs_theme(bg = "white", fg = "navy", primary = "#0d6efd", base_font = font_google("Inter"))`. Save the `shinyApp` object to `ex_6_2`.

**Expected result:**

```
# Browser shows the same histogram-of-faithful app from Exercise 1.3
# but with:
#   - body background white, foreground navy
#   - slider track and active states in blue (#0d6efd)
#   - all text in the Inter Google font
```

**Difficulty:** Advanced

```r title="Your turn"
ui <- # your code here
server <- # your code here
ex_6_2 <- shinyApp(ui, server)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ui <- fluidPage(
  theme = bs_theme(
    bg        = "white",
    fg        = "navy",
    primary   = "#0d6efd",
    base_font = font_google("Inter")
  ),
  titlePanel("Old Faithful"),
  sliderInput("bins", "Bins", 5, 50, 20),
  plotOutput("p")
)

server <- function(input, output, session) {
  output$p <- renderPlot(hist(faithful$eruptions, breaks = input$bins,
                              col = "steelblue", main = NULL))
}

ex_6_2 <- shinyApp(ui, server)
```

**Explanation:** `bslib::bs_theme()` builds a Bootstrap 5 theme from a small set of variables; passing it to `fluidPage(theme = ...)` swaps in compiled CSS at app start. `font_google()` fetches the named font from Google Fonts and wires up the `@font-face` rule for you. For interactive theme exploration during development call `bs_theme_preview(theme)` in your R console; once happy, hard-code the values as above.

</details>

## What to do next

You have built twenty-five working Shiny apps that cover layout, reactivity, modules, downloads, theming and brushing. To deepen the practice:

- Tighten dplyr chops by working through [dplyr exercises](dplyr-Exercises-in-R.html) so the data work feeding your apps is fluent.
- Sharpen visuals with the [ggplot2 exercises](ggplot2-Exercises-in-R.html); most Shiny apps stand or fall on the quality of their charts.
- Practise functional helpers from the [apply family exercises](Apply-Family-Exercises-in-R.html) to keep your server logic tidy.
- Round out your R fluency through the [R for Beginners exercises](R-Beginner-Exercises-in-R.html) if any earlier solution felt unsteady.
