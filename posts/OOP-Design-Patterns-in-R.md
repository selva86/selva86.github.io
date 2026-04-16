---
title: "OOP Design Patterns in R: Factory, Strategy & Observer in R6"
slug: "OOP-Design-Patterns-in-R"
description: "Implement Factory, Strategy, Observer, Singleton & Builder design patterns in R using R6. Runnable examples, when to use each, and practical R6 idioms."
keywords: "R6 design patterns, factory pattern R, strategy pattern R, observer pattern R, singleton pattern R, builder pattern R, OOP patterns R, R6 class examples"
mathjax: false
webr: true
date: "2026-04-13"
curriculum_id: "FR-oop-3"
post_type: "FR"
auto_link_terms: "OOP design patterns in R|design patterns in R6|factory pattern in R|strategy pattern in R|observer pattern in R|singleton pattern in R|builder pattern in R"
auto_link_case_sensitive: false
fr_parent: "R6-Classes-in-R.html"
difficulty: "Intermediate"
---

# OOP Design Patterns in R: Factory, Strategy & Observer in R6

<p class="lead">Design patterns are reusable solutions to recurring object-oriented problems. R6's mutable reference classes make the classic Gang-of-Four patterns — <strong>Factory</strong>, <strong>Strategy</strong>, <strong>Observer</strong>, <strong>Singleton</strong> and <strong>Builder</strong> — natural, compact and genuinely useful inside R packages, Shiny apps and simulation code.</p>

## How does the Factory Pattern work in R6?

A factory is a function whose only job is to decide *which* class to build and hand you back an instance you can use without caring about the choice it made. It keeps the selection rule in one place and lets the rest of your code treat the result uniformly. The classic R use case: a single `read()` method that silently routes CSV, JSON and Excel files to the right reader.

Below we define three reader classes that share a `read()` method, then a tiny `create_reader()` factory that picks one based on the file extension. The caller never mentions `CSVReader` or `JSONReader` by name.

```r
library(R6)

CSVReader <- R6Class("CSVReader",
  public = list(
    read = function(path) {
      cat("Reading CSV:", path, "\n")
      data.frame(x = 1:3, y = c(4, 5, 6))
    }
  )
)

JSONReader <- R6Class("JSONReader",
  public = list(
    read = function(path) {
      cat("Reading JSON:", path, "\n")
      list(x = 1:3, y = list(4, 5, 6))
    }
  )
)

ExcelReader <- R6Class("ExcelReader",
  public = list(
    read = function(path) {
      cat("Reading Excel:", path, "\n")
      data.frame(x = 1:3, y = c(4, 5, 6))
    }
  )
)

create_reader <- function(path) {
  ext <- tolower(tools::file_ext(path))
  switch(ext,
    "csv"  = CSVReader$new(),
    "json" = JSONReader$new(),
    "xlsx" = ExcelReader$new(),
    "xls"  = ExcelReader$new(),
    stop("Unsupported file type: ", ext)
  )
}

reader1 <- create_reader("sales.csv")
reader1$read("sales.csv")
#> Reading CSV: sales.csv
#>   x y
#> 1 1 4
#> 2 2 5
#> 3 3 6

reader2 <- create_reader("config.json")
reader2$read("config.json")
#> Reading JSON: config.json
#> $x
#> [1] 1 2 3
#> $y
#> $y[[1]]
#> [1] 4
```

Two different classes, one line of calling code. Adding an `ParquetReader` tomorrow means adding one `R6Class` and one line in the `switch` — no caller touches change.

![Factory flow](screenshots/OOP-Design-Patterns-in-R-factory-flow.webp)
*Figure 1: How a factory routes one call to the right reader class.*

[KEY INSIGHT]
**Callers depend on the interface, not the concrete class.** Every reader exposes `$read()`, so the calling code is immune to *which* subclass the factory picked. That is the whole point of the pattern.

**Try it:** Add an `RDSReader` to the factory that handles `.rds` files. It should return `list(kind = "rds")` from its `read()` method.

```r
ex_RDSReader <- R6Class("ex_RDSReader",
  public = list(
    read = function(path) {
      # your code here
    }
  )
)

ex_create_reader <- function(path) {
  ext <- tolower(tools::file_ext(path))
  switch(ext,
    "csv" = CSVReader$new(),
    "rds" = NULL,   # your code here
    stop("Unsupported: ", ext)
  )
}

ex_create_reader("model.rds")$read("model.rds")
#> Expected: $kind [1] "rds"
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_RDSReader <- R6Class("ex_RDSReader",
  public = list(
    read = function(path) list(kind = "rds", path = path)
  )
)

ex_create_reader <- function(path) {
  ext <- tolower(tools::file_ext(path))
  switch(ext,
    "csv" = CSVReader$new(),
    "rds" = ex_RDSReader$new(),
    stop("Unsupported: ", ext)
  )
}
ex_create_reader("model.rds")$read("model.rds")
#> $kind
#> [1] "rds"
#> $path
#> [1] "model.rds"
```

**Explanation:** The factory only needs the new mapping; every other caller still writes `create_reader(path)$read(path)`.

</details>

## How does the Strategy Pattern swap behavior at runtime?

Strategy splits *what* from *how*. A **context** object knows what job needs doing — computing a single score from a vector of numbers — and holds onto a **strategy** object that knows how to do it. Swap the strategy and the same context behaves differently, without a single `if`/`else`.

We'll build three scoring strategies (mean, median, trimmed mean) and a `Scorer` context that delegates to whichever strategy it currently holds. The important move is that the caller can change strategies midway through a session.

```r
MeanScore <- R6Class("MeanScore",
  public = list(score = function(x) mean(x))
)

MedianScore <- R6Class("MedianScore",
  public = list(score = function(x) median(x))
)

TrimmedScore <- R6Class("TrimmedScore",
  public = list(
    trim  = NULL,
    initialize = function(trim = 0.1) self$trim <- trim,
    score = function(x) mean(x, trim = self$trim)
  )
)

Scorer <- R6Class("Scorer",
  public = list(
    strategy = NULL,
    initialize  = function(strategy) self$strategy <- strategy,
    set_strategy = function(strategy) self$strategy <- strategy,
    run = function(x) self$strategy$score(x)
  )
)

sc <- Scorer$new(MeanScore$new())
sc$run(c(1, 2, 3, 4, 100))
#> [1] 22

sc$set_strategy(MedianScore$new())
sc$run(c(1, 2, 3, 4, 100))
#> [1] 3

sc$set_strategy(TrimmedScore$new(trim = 0.2))
sc$run(c(1, 2, 3, 4, 100))
#> [1] 3
```

The single outlier (`100`) drags the plain mean to 22, but both the median and the 20%-trimmed mean ignore it and report 3. Same `sc$run()` call, three completely different robust-statistics behaviors — decided by which strategy object is attached.

[TIP]
**Strategies can be plain functions when they carry no state.** If `TrimmedScore` didn't need to remember `trim`, you could skip the R6 wrapper entirely and pass `mean`, `median` or `function(x) mean(x, trim = 0.2)` directly. Reach for R6 only when the strategy itself needs fields.

**Try it:** Write `ex_MaxStrategy` — an R6 class whose `score()` method returns `max(x)` — and plug it into `Scorer` (already defined above).

```r
ex_MaxStrategy <- R6Class("ex_MaxStrategy",
  public = list(
    score = function(x) {
      # your code here
    }
  )
)

ex_sc <- Scorer$new(ex_MaxStrategy$new())
ex_sc$run(c(3, 1, 9, 4))
#> Expected: 9
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_MaxStrategy <- R6Class("ex_MaxStrategy",
  public = list(score = function(x) max(x))
)
ex_sc <- Scorer$new(ex_MaxStrategy$new())
ex_sc$run(c(3, 1, 9, 4))
#> [1] 9
```

**Explanation:** The context doesn't care how `score()` is computed — it only calls `self$strategy$score(x)`. Any object that implements `score()` plugs in cleanly.

</details>

## How does the Observer Pattern notify listeners of state changes?

Observer inverts the usual call direction. Instead of code polling an object (*"did anything change yet?"*), the object itself calls a list of subscribers whenever its state updates. Shiny's reactivity is built on this idea; so is every event bus you have ever used.

We'll model a temperature sensor as the **subject** and attach two **observers**: a logger that prints every reading, and an alerter that only fires when the value crosses a threshold.

```r
TempSensor <- R6Class("TempSensor",
  public = list(
    observers = list(),
    value     = NA_real_,
    subscribe = function(obs) {
      self$observers <- c(self$observers, obs)
      invisible(self)
    },
    unsubscribe = function(obs) {
      self$observers <- Filter(function(o) !identical(o, obs), self$observers)
      invisible(self)
    },
    set_value = function(x) {
      self$value <- x
      for (obs in self$observers) obs$update(x)
      invisible(self)
    }
  )
)

LoggerObs <- R6Class("LoggerObs",
  public = list(
    update = function(x) cat("[log] value =", x, "\n")
  )
)

AlertObs <- R6Class("AlertObs",
  public = list(
    threshold = NULL,
    initialize = function(threshold) self$threshold <- threshold,
    update = function(x) {
      if (x > self$threshold) cat("[alert] ", x, "exceeds", self$threshold, "\n")
    }
  )
)

sensor <- TempSensor$new()
log1   <- LoggerObs$new()
alert1 <- AlertObs$new(threshold = 30)

sensor$subscribe(log1)$subscribe(alert1)
sensor$set_value(22)
#> [log] value = 22

sensor$set_value(35)
#> [log] value = 35
#> [alert]  35 exceeds 30
```

Neither `LoggerObs` nor `AlertObs` knows the other exists — the sensor just walks its observer list and calls `update()` on each. Adding a third observer tomorrow is a single `$subscribe()` call; removing one is a single `$unsubscribe()`.

![Observer sequence](screenshots/OOP-Design-Patterns-in-R-observer-seq.webp)
*Figure 2: The subject notifies every subscribed observer whenever its state changes.*

[WARNING]
**R6 objects are reference-semantic — always mutate in place.** Writing `self$observers <- c(self$observers, obs)` works; writing it outside the R6 method using `x <- sensor; x$observers <- ...` mutates the original sensor too, because `x` is not a copy. This is exactly why R6 fits Observer cleanly: one subject is one shared identity.

**Try it:** Write `ex_AverageObs` — an observer that keeps a running vector of readings in a public `values` field and prints the running mean on every update.

```r
ex_AverageObs <- R6Class("ex_AverageObs",
  public = list(
    values = c(),
    update = function(x) {
      # your code here
    }
  )
)

ex_sensor <- TempSensor$new()
ex_sensor$subscribe(ex_AverageObs$new())
ex_sensor$set_value(10)
ex_sensor$set_value(20)
#> Expected: running mean 10, then running mean 15
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_AverageObs <- R6Class("ex_AverageObs",
  public = list(
    values = c(),
    update = function(x) {
      self$values <- c(self$values, x)
      cat("running mean =", mean(self$values), "\n")
    }
  )
)
ex_sensor <- TempSensor$new()
ex_sensor$subscribe(ex_AverageObs$new())
ex_sensor$set_value(10)
#> running mean = 10
ex_sensor$set_value(20)
#> running mean = 15
```

**Explanation:** Because R6 mutates in place, appending to `self$values` inside `update()` persists across notifications. A plain-function observer would need external storage.

</details>

## When should you reach for Singleton or Builder patterns?

Two smaller patterns fill obvious niches. **Singleton** guarantees exactly one instance exists — useful for a shared configuration, a database connection, or a logger. **Builder** handles objects whose construction has many optional knobs and you want a fluent, readable call site.

The cleanest R singleton hides the instance inside a closure-scoped variable rather than a true class, because R packages already behave like process-wide namespaces.

```r
get_config <- local({
  instance <- NULL
  function() {
    if (is.null(instance)) {
      instance <<- R6Class("Config",
        public = list(
          host = "localhost",
          port = 8080,
          set_host = function(h) { self$host <- h; invisible(self) }
        )
      )$new()
    }
    instance
  }
})

cfg1 <- get_config()
cfg2 <- get_config()
cfg1$set_host("prod.example.com")
cfg2$host
#> [1] "prod.example.com"

identical(cfg1, cfg2)
#> [1] TRUE
```

`cfg1` and `cfg2` are the same object — setting the host through one shows up in the other.

Now Builder: a report object with many optional fields, built up with chained calls.

```r
ReportBuilder <- R6Class("ReportBuilder",
  public = list(
    title   = NULL,
    author  = NULL,
    body    = NULL,
    format  = "html",
    set_title  = function(x) { self$title  <- x; invisible(self) },
    set_author = function(x) { self$author <- x; invisible(self) },
    set_body   = function(x) { self$body   <- x; invisible(self) },
    set_format = function(x) { self$format <- x; invisible(self) },
    build = function() {
      list(title = self$title, author = self$author,
           body = self$body, format = self$format)
    }
  )
)

report <- ReportBuilder$new()$
  set_title("Quarterly Review")$
  set_author("Selva")$
  set_body("Revenue up 12%.")$
  set_format("pdf")$
  build()

report$title
#> [1] "Quarterly Review"
report$format
#> [1] "pdf"
```

Each setter returns `invisible(self)`, which is the trick that makes the fluent `$set_x()$set_y()` chain work. The final `$build()` hands you the finished object.

[NOTE]
**R package namespaces already give you a de-facto singleton.** Any object stored in your package environment (via `.onLoad` or a top-level assignment) exists exactly once per session — no pattern required. Reach for the closure-style singleton only when you want lazy initialization or a stand-alone script.

**Try it:** Extend the config singleton with a `set_port(p)` method that updates the port. Show that changing it via one reference is visible from the other.

```r
# Modify the Config R6Class inside get_config above to add set_port.
# Then test:
a <- get_config()
b <- get_config()
a$set_port(9090)
b$port
#> Expected: 9090
```

<details>
<summary>Click to reveal solution</summary>

```r
get_config <- local({
  instance <- NULL
  function() {
    if (is.null(instance)) {
      instance <<- R6Class("Config",
        public = list(
          host = "localhost",
          port = 8080,
          set_host = function(h) { self$host <- h; invisible(self) },
          set_port = function(p) { self$port <- p; invisible(self) }
        )
      )$new()
    }
    instance
  }
})

a <- get_config()
b <- get_config()
a$set_port(9090)
b$port
#> [1] 9090
```

**Explanation:** `a` and `b` point at the same underlying R6 object, so any mutation on one is observable through the other.

</details>

## How do you choose the right pattern for your problem?

Patterns are not a checklist. They are vocabulary — a way to name a shape that keeps turning up in your code so that you and your reviewers can discuss it without re-explaining the mechanics. The question to ask is always "what pain am I feeling?" and then pick the pattern whose intent matches.

![Pattern map](screenshots/OOP-Design-Patterns-in-R-pattern-map.webp)
*Figure 3: The five R6 patterns grouped by purpose — creational versus behavioral.*

Here is the decision shortcut I use when reviewing R code:

| Symptom in your code | Reach for |
|---|---|
| A growing `if`/`switch` that picks *which class* to build | **Factory** |
| A growing `if`/`switch` that picks *how to compute something* | **Strategy** |
| State change in one place needs to trigger work elsewhere | **Observer** |
| You want exactly one shared instance of something | **Singleton** |
| Constructor has 10+ optional arguments and call sites are painful | **Builder** |

Below is a concrete "before and after": a slope classifier that starts as a nested `if`/`else` and becomes a clean Strategy. Notice how the second version is open to new rules without editing `classifier`.

```r
classify_v1 <- function(slope, kind) {
  if (kind == "strict") {
    if (slope > 0.5) "up" else if (slope < -0.5) "down" else "flat"
  } else if (kind == "loose") {
    if (slope > 0.1) "up" else if (slope < -0.1) "down" else "flat"
  } else stop("unknown kind")
}

SlopeStrategy <- R6Class("SlopeStrategy",
  public = list(
    cutoff = NULL,
    initialize = function(cutoff) self$cutoff <- cutoff,
    label = function(slope) {
      if (slope >  self$cutoff) "up"
      else if (slope < -self$cutoff) "down"
      else "flat"
    }
  )
)

classify_v2 <- function(slope, strategy) strategy$label(slope)

classify_v1(0.3, "strict")
#> [1] "flat"
classify_v2(0.3, SlopeStrategy$new(cutoff = 0.5))
#> [1] "flat"
classify_v2(0.3, SlopeStrategy$new(cutoff = 0.1))
#> [1] "up"
```

The `v1` function grows a new `else if` branch every time someone invents a new rule. The `v2` function will never change again — you just construct a new strategy with whatever cutoff (or entirely different logic) you need.

[KEY INSIGHT]
**Patterns are vocabulary, not scaffolding.** Don't force Strategy onto a script that has two branches and one caller. Reach for it when you catch yourself adding branches repeatedly, or when reviewers keep asking "wait, where does this behavior come from?"

**Try it:** Your teammate keeps adding new chart types to a monster `if`/`else` in `plot_dispatch()`. Which pattern fixes this, and in one sentence, why?

```r
# Write your answer as an R comment below:
# Pattern:
# Reason:
```

<details>
<summary>Click to reveal solution</summary>

```r
# Pattern: Strategy (or Factory, depending on what's branching).
# Reason: The branch is deciding *how to plot*, so each chart type
# becomes a strategy object exposing a common draw() method; the
# dispatcher just calls strategy$draw(data) and never grows again.
```

**Explanation:** If the branching picked *which class to build*, Factory would fit; because it picks *how to do the work*, Strategy is the right name.

</details>

## Practice Exercises

### Exercise 1: A Strategy-based discount system

Build a `Cart` context and three discount strategies: `NoDiscount`, `PercentDiscount` (takes a rate like 0.1 = 10% off), and `FlatDiscount` (takes a fixed amount off). `Cart` holds `items` (a numeric vector of prices) and a strategy, and exposes `total()` which returns the discounted total. Save the final totals into `my_totals` as a named list.

```r
# Exercise 1: Strategy-based discount system
# Hint: each strategy has apply(subtotal) -> new total
# Cart$total() calls self$strategy$apply(sum(self$items))

# Write your code below:

my_totals <- list()
my_totals
```

<details>
<summary>Click to reveal solution</summary>

```r
NoDiscount <- R6Class("NoDiscount",
  public = list(apply = function(sub) sub)
)
PercentDiscount <- R6Class("PercentDiscount",
  public = list(
    rate = NULL,
    initialize = function(rate) self$rate <- rate,
    apply = function(sub) sub * (1 - self$rate)
  )
)
FlatDiscount <- R6Class("FlatDiscount",
  public = list(
    amount = NULL,
    initialize = function(amount) self$amount <- amount,
    apply = function(sub) max(0, sub - self$amount)
  )
)

Cart <- R6Class("Cart",
  public = list(
    items = NULL,
    strategy = NULL,
    initialize = function(items, strategy) {
      self$items <- items
      self$strategy <- strategy
    },
    set_strategy = function(s) self$strategy <- s,
    total = function() self$strategy$apply(sum(self$items))
  )
)

items <- c(20, 30, 50)
my_totals <- list(
  none    = Cart$new(items, NoDiscount$new())$total(),
  percent = Cart$new(items, PercentDiscount$new(0.1))$total(),
  flat    = Cart$new(items, FlatDiscount$new(25))$total()
)
my_totals
#> $none
#> [1] 100
#> $percent
#> [1] 90
#> $flat
#> [1] 75
```

**Explanation:** `Cart` doesn't know (or care) which discount math happens — it delegates to whatever strategy it currently holds. Swapping strategies is a one-line operation.

</details>

### Exercise 2: Factory + Observer broadcast hub

Build a `make_notifier(kind)` factory that returns an `EmailNotifier`, `SmsNotifier` or `SlackNotifier` — each implements a `send(msg)` method that `cat()`s a tagged line. Then build an `AlertHub` subject that stores a list of notifiers and broadcasts every alert to all of them via `$raise(msg)`. Save the hub to `my_hub` and raise one alert that reaches three notifiers.

```r
# Exercise 2: Factory + Observer
# Hint: the factory returns one of three R6 classes;
# AlertHub$raise(msg) loops its notifiers and calls $send(msg).

# Write your code below:

my_hub <- NULL
```

<details>
<summary>Click to reveal solution</summary>

```r
EmailNotifier <- R6Class("EmailNotifier",
  public = list(send = function(msg) cat("[email]", msg, "\n"))
)
SmsNotifier <- R6Class("SmsNotifier",
  public = list(send = function(msg) cat("[sms]  ", msg, "\n"))
)
SlackNotifier <- R6Class("SlackNotifier",
  public = list(send = function(msg) cat("[slack]", msg, "\n"))
)

make_notifier <- function(kind) {
  switch(kind,
    "email" = EmailNotifier$new(),
    "sms"   = SmsNotifier$new(),
    "slack" = SlackNotifier$new(),
    stop("unknown kind: ", kind)
  )
}

AlertHub <- R6Class("AlertHub",
  public = list(
    notifiers = list(),
    add = function(n) { self$notifiers <- c(self$notifiers, n); invisible(self) },
    raise = function(msg) {
      for (n in self$notifiers) n$send(msg)
      invisible(self)
    }
  )
)

my_hub <- AlertHub$new()$
  add(make_notifier("email"))$
  add(make_notifier("sms"))$
  add(make_notifier("slack"))

my_hub$raise("disk full")
#> [email] disk full
#> [sms]   disk full
#> [slack] disk full
```

**Explanation:** The factory hides the class choice; the observer hub broadcasts one event to many listeners. Two patterns, one ten-line pipeline.

</details>

## Complete Example

Here's a tiny end-to-end pipeline that uses three of the patterns together. A factory picks a reader for `mtcars` (we just fake one); a strategy picks the scoring method; an observer logs every result. One function, five lines of calling code, all three patterns.

```r
Reader <- R6Class("Reader",
  public = list(read = function() mtcars$mpg)
)

make_reader <- function(kind) switch(kind,
  "mtcars" = Reader$new(),
  stop("unknown")
)

pipe_sensor <- TempSensor$new()
pipe_logger <- LoggerObs$new()
pipe_sensor$subscribe(pipe_logger)

pipe_scorer <- Scorer$new(TrimmedScore$new(trim = 0.1))
result      <- pipe_scorer$run(make_reader("mtcars")$read())
pipe_sensor$set_value(result)
#> [log] value = 20.13

result
#> [1] 20.13462
```

The calling code never says `TrimmedScore`, never says `LoggerObs`, and never says `Reader` — it just says "give me a reader, score its data, and tell the sensor." Every piece is replaceable independently. That is what the patterns buy you.

## Summary

| Pattern | Category | Intent | Reach for it when… |
|---|---|---|---|
| Factory | Creational | Decide which class to build in one place | A branch is choosing *which class* to instantiate |
| Strategy | Behavioral | Swap algorithms at runtime | A branch is choosing *how to compute* something |
| Observer | Behavioral | Notify many listeners of one state change | State change needs fan-out without tight coupling |
| Singleton | Creational | Guarantee a single shared instance | You want one config/logger/connection per session |
| Builder | Creational | Fluent step-by-step construction | Constructor has many optional arguments |

Reach for these patterns by name when a shape keeps recurring, not because the textbook told you to. R6's reference semantics make all five compact — most fit in under 25 lines.

## References

1. Wickham, H. — *Advanced R*, 2nd Edition. Chapter 14: R6. [Link](https://adv-r.hadley.nz/r6.html)
2. R6 package documentation on CRAN. [Link](https://cran.r-project.org/package=R6)
3. R6P: Design Patterns in R (tidylab). [Link](https://tidylab.github.io/R6P/)
4. Gamma, Helm, Johnson, Vlissides — *Design Patterns: Elements of Reusable Object-Oriented Software*. Addison-Wesley (1994).
5. Refactoring.Guru — Catalog of Design Patterns. [Link](https://refactoring.guru/design-patterns)
6. tidyverse R6 vignette — Introduction to R6. [Link](https://r6.r-lib.org/articles/Introduction.html)

## Continue Learning

- [R6 Classes in R](R6-Classes-in-R.html) — the parent tutorial that teaches R6 fields, methods, inheritance and active bindings.
- [OOP in R](OOP-in-R.html) — overview of R's four OOP systems (S3, S4, R5/Reference Classes, R6).
- [S4 Classes in R](S4-Classes-in-R.html) — the formal, generic-function-based alternative to R6 for package-grade type systems.
