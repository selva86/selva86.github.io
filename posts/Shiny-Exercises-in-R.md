---
title: "Shiny Exercises in R: 30 Practice Problems"
slug: "Shiny-Exercises-in-R"
description: "Master Shiny in R with 30 practice problems: UI, server, reactivity, inputs, outputs, modules, deployment. Hidden solutions."
keywords: "shiny exercises in R, shiny app practice, shiny exercises, R shiny tutorial practice, shiny reactive exercises"
mathjax: false
webr: false
date: "2026-05-11"
post_type: "EX"
sidebar_title: "Shiny Exercises"
sidebar_order: 133
fr_parent: "R-Tutorial.html"
auto_link_terms: "shiny exercises|shiny app practice|R shiny tutorial practice|shiny reactive exercises"
auto_link_case_sensitive: false
target_keyword: "shiny exercises in R"
sibling_block_enabled: false
difficulty: "Intermediate"
---

# Shiny Exercises in R: 30 Practice Problems

<p class="lead">Thirty practice problems on Shiny: UI elements, server logic, reactivity, inputs, outputs, modules, deployment. Solutions hidden.</p>

```r title="Run this once before any exercise"
library(shiny)
library(ggplot2)
library(dplyr)
```

## Section 1. UI basics (8 problems)

### Exercise 1.1: Minimal app

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
ui <- fluidPage("Hello world")
server <- function(input, output) {}
# shinyApp(ui, server)
```

</details>

### Exercise 1.2: title + page layout

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
ui <- fluidPage(titlePanel("Demo"), sidebarLayout(sidebarPanel("side"), mainPanel("main")))
```

</details>

### Exercise 1.3: textInput

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
ui <- fluidPage(textInput("name", "Name:"), textOutput("hello"))
server <- function(input, output) {
  output$hello <- renderText(paste("Hello", input$name))
}
```

</details>

### Exercise 1.4: numericInput

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
ui <- fluidPage(numericInput("n", "n:", value = 10),
                textOutput("sq"))
server <- function(input, output) {
  output$sq <- renderText(input$n^2)
}
```

</details>

### Exercise 1.5: sliderInput

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
ui <- fluidPage(sliderInput("x", "x:", min = 0, max = 100, value = 50),
                textOutput("y"))
server <- function(input, output) output$y <- renderText(input$x * 2)
```

</details>

### Exercise 1.6: selectInput

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
ui <- fluidPage(selectInput("c", "Choose:", choices = c("a","b","c")),
                textOutput("o"))
server <- function(input, output) output$o <- renderText(input$c)
```

</details>

### Exercise 1.7: actionButton

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ui <- fluidPage(actionButton("go", "Go"), textOutput("o"))
server <- function(input, output) {
  output$o <- renderText({ input$go; format(Sys.time()) })
}
```

</details>

### Exercise 1.8: checkboxGroupInput

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ui <- fluidPage(checkboxGroupInput("opts", "Options", c("a","b","c")),
                textOutput("o"))
server <- function(input, output) output$o <- renderText(paste(input$opts, collapse = ","))
```

</details>

## Section 2. Outputs (6 problems)

### Exercise 2.1: textOutput

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
ui <- fluidPage(textOutput("t"))
server <- function(input, output) output$t <- renderText("hello")
```

</details>

### Exercise 2.2: tableOutput

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
ui <- fluidPage(tableOutput("tbl"))
server <- function(input, output) output$tbl <- renderTable(head(mtcars))
```

</details>

### Exercise 2.3: plotOutput

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ui <- fluidPage(plotOutput("p"))
server <- function(input, output) {
  output$p <- renderPlot(plot(mtcars$wt, mtcars$mpg))
}
```

</details>

### Exercise 2.4: ggplot output

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ui <- fluidPage(plotOutput("p"))
server <- function(input, output) {
  output$p <- renderPlot(ggplot(mtcars, aes(wt, mpg)) + geom_point())
}
```

</details>

### Exercise 2.5: dataTableOutput (DT)

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ui <- fluidPage(DT::DTOutput("tbl"))
server <- function(input, output) output$tbl <- DT::renderDT(mtcars)
```

</details>

### Exercise 2.6: verbatimTextOutput

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ui <- fluidPage(verbatimTextOutput("o"))
server <- function(input, output) output$o <- renderPrint(summary(mtcars))
```

</details>

## Section 3. Reactivity (6 problems)

### Exercise 3.1: reactive expression

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ui <- fluidPage(numericInput("n", "n:", 10), textOutput("sq"))
server <- function(input, output) {
  squared <- reactive(input$n^2)
  output$sq <- renderText(squared())
}
```

</details>

### Exercise 3.2: observeEvent

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ui <- fluidPage(actionButton("go", "Go"))
server <- function(input, output) {
  observeEvent(input$go, message("clicked"))
}
```

</details>

### Exercise 3.3: eventReactive

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
ui <- fluidPage(numericInput("n", "n:", 10), actionButton("go","Go"), textOutput("o"))
server <- function(input, output) {
  v <- eventReactive(input$go, input$n^2)
  output$o <- renderText(v())
}
```

</details>

### Exercise 3.4: req() to gate

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ui <- fluidPage(textInput("name","Name:"), textOutput("o"))
server <- function(input, output) {
  output$o <- renderText({
    req(input$name)
    paste("Hello", input$name)
  })
}
```

</details>

### Exercise 3.5: isolate

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
ui <- fluidPage(numericInput("a","a:",1), actionButton("go","Go"), textOutput("o"))
server <- function(input, output) {
  output$o <- renderText({ input$go; isolate(input$a) })
}
```

</details>

### Exercise 3.6: reactiveVal

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
ui <- fluidPage(actionButton("go","+1"), textOutput("o"))
server <- function(input, output) {
  count <- reactiveVal(0)
  observeEvent(input$go, count(count() + 1))
  output$o <- renderText(count())
}
```

</details>

## Section 4. Layout and dynamic UI (5 problems)

### Exercise 4.1: tabsetPanel

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ui <- fluidPage(tabsetPanel(tabPanel("A","panel A"), tabPanel("B","panel B")))
```

</details>

### Exercise 4.2: navbarPage

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ui <- navbarPage("App", tabPanel("One", "..."), tabPanel("Two", "..."))
```

</details>

### Exercise 4.3: conditionalPanel

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
ui <- fluidPage(checkboxInput("show", "show?"),
                conditionalPanel("input.show == true", "secret content"))
```

</details>

### Exercise 4.4: insertUI / removeUI

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
ui <- fluidPage(actionButton("add","Add"), tags$div(id = "host"))
server <- function(input, output) {
  observeEvent(input$add,
    insertUI("#host", "afterBegin", textInput(paste0("t", input$add), "text")))
}
```

</details>

### Exercise 4.5: renderUI

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
ui <- fluidPage(numericInput("n","n:",3), uiOutput("dyn"))
server <- function(input, output) {
  output$dyn <- renderUI({
    lapply(1:input$n, function(i) textInput(paste0("t",i), paste("Field",i)))
  })
}
```

</details>

## Section 5. Modules and deployment (5 problems)

### Exercise 5.1: Module UI

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
counterUI <- function(id) {
  ns <- NS(id)
  tagList(actionButton(ns("go"), "+1"), textOutput(ns("o")))
}
```

</details>

### Exercise 5.2: Module server

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
counterServer <- function(id) moduleServer(id, function(input, output, session) {
  count <- reactiveVal(0)
  observeEvent(input$go, count(count()+1))
  output$o <- renderText(count())
})
```

</details>

### Exercise 5.3: Wire module

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
ui <- fluidPage(counterUI("c1"))
server <- function(input, output) counterServer("c1")
```

</details>

### Exercise 5.4: rsconnect deployment basics

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
# After setting account once:
# rsconnect::deployApp("path/to/app")
```

</details>

### Exercise 5.5: Reactive value sharing across modules

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
serverA <- function(id, shared) moduleServer(id, function(input, output, session) {
  observeEvent(input$go, shared(shared() + 1))
})
```

</details>

## What to do next

- **R-Markdown-Exercises** (coming) — reproducible reporting.
- **Data-Visualization-Exercises** (shipped) — viz inside Shiny.
