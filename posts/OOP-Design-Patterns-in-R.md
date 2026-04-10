---
title: "OOP Design Patterns in R: Factory, Strategy & Observer in R6"
slug: "OOP-Design-Patterns-in-R"
description: "Implement classic OOP design patterns in R using R6: Factory, Strategy, Observer, Singleton, and Builder. Practical examples for R programmers."
keywords: "design patterns R, factory pattern R, strategy pattern R, observer pattern R, R6 design patterns, OOP patterns R"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "FR-oop-3"
post_type: "FR"
auto_link_terms: "OOP design patterns|factory pattern R|strategy pattern R|observer pattern R"
auto_link_case_sensitive: false
fr_parent: "OOP-in-R.html"
---

# OOP Design Patterns in R: Factory, Strategy & Observer in R6

<p class="lead">Design patterns are reusable solutions to common programming problems. While R isn't traditionally thought of as an OOP language, the <strong>R6</strong> class system makes patterns like <strong>Factory</strong>, <strong>Strategy</strong>, <strong>Observer</strong>, <strong>Singleton</strong>, and <strong>Builder</strong> clean and practical to implement.</p>

These patterns are especially useful when building R packages, Shiny apps, or any system with complex, interacting components.

## Factory Pattern

The Factory pattern creates objects without exposing the creation logic. A factory function or class decides which class to instantiate based on input.

```r
library(R6)

# Define a family of related classes
CSVReader <- R6Class("CSVReader",
  public = list(
    read = function(path) {
      cat("Reading CSV:", path, "\n")
      # read.csv(path) in real code
      data.frame(x = 1:3, y = 4:6)
    }
  )
)

JSONReader <- R6Class("JSONReader",
  public = list(
    read = function(path) {
      cat("Reading JSON:", path, "\n")
      # jsonlite::fromJSON(path) in real code
      list(x = 1:3, y = 4:6)
    }
  )
)

ExcelReader <- R6Class("ExcelReader",
  public = list(
    read = function(path) {
      cat("Reading Excel:", path, "\n")
      # readxl::read_excel(path) in real code
      data.frame(x = 1:3, y = 4:6)
    }
  )
)

# The Factory function
create_reader <- function(file_path) {
  ext <- tolower(tools::file_ext(file_path))
  switch(ext,
    "csv" = CSVReader$new(),
    "json" = JSONReader$new(),
    "xlsx" = ExcelReader$new(),
    "xls"  = ExcelReader$new(),
    stop("Unsupported file type: ", ext)
  )
}

# Usage -- caller doesn't need to know which class is created
reader <- create_reader("data.csv")
result <- reader$read("data.csv")

reader2 <- create_reader("config.json")
result2 <- reader2$read("config.json")
```

The Factory pattern is useful when:
- You have multiple classes that share an interface
- The caller shouldn't need to know which concrete class to use
- You might add new formats later without changing calling code

## Strategy Pattern

The Strategy pattern lets you swap algorithms at runtime. Define a family of interchangeable algorithm objects and inject one into a context object.

```r
library(R6)

# Strategy: different imputation methods
MeanImputer <- R6Class("MeanImputer",
  public = list(
    impute = function(x) {
      x[is.na(x)] <- mean(x, na.rm = TRUE)
      x
    },
    name = function() "mean"
  )
)

MedianImputer <- R6Class("MedianImputer",
  public = list(
    impute = function(x) {
      x[is.na(x)] <- median(x, na.rm = TRUE)
      x
    },
    name = function() "median"
  )
)

ZeroImputer <- R6Class("ZeroImputer",
  public = list(
    impute = function(x) {
      x[is.na(x)] <- 0
      x
    },
    name = function() "zero"
  )
)

# Context: uses whichever strategy is injected
DataCleaner <- R6Class("DataCleaner",
  public = list(
    initialize = function(strategy) {
      private$strategy <- strategy
    },

    set_strategy = function(strategy) {
      private$strategy <- strategy
      invisible(self)
    },

    clean = function(df) {
      cat("Imputing with strategy:", private$strategy$name(), "\n")
      for (col in names(df)) {
        if (is.numeric(df[[col]]) && any(is.na(df[[col]]))) {
          df[[col]] <- private$strategy$impute(df[[col]])
        }
      }
      df
    }
  ),

  private = list(
    strategy = NULL
  )
)

# Create data with NAs
df <- data.frame(
  a = c(1, NA, 3, NA, 5),
  b = c(10, 20, NA, 40, 50)
)
cat("Original:\n")
print(df)

# Try different strategies
cleaner <- DataCleaner$new(MeanImputer$new())
cat("\nMean imputed:\n")
print(cleaner$clean(df))

cleaner$set_strategy(MedianImputer$new())
cat("\nMedian imputed:\n")
print(cleaner$clean(df))

cleaner$set_strategy(ZeroImputer$new())
cat("\nZero imputed:\n")
print(cleaner$clean(df))
```

## Observer Pattern

The Observer pattern lets objects subscribe to events and get notified when something happens. This is the backbone of reactive programming (and Shiny).

```r
library(R6)

# Event emitter (subject)
EventEmitter <- R6Class("EventEmitter",
  public = list(
    on = function(event, callback) {
      if (is.null(private$listeners[[event]])) {
        private$listeners[[event]] <- list()
      }
      private$listeners[[event]] <- c(private$listeners[[event]], list(callback))
      invisible(self)
    },

    emit = function(event, ...) {
      callbacks <- private$listeners[[event]]
      if (!is.null(callbacks)) {
        for (cb in callbacks) {
          cb(...)
        }
      }
      invisible(self)
    },

    remove_all = function(event) {
      private$listeners[[event]] <- NULL
      invisible(self)
    }
  ),

  private = list(
    listeners = list()
  )
)

# A model that emits events when data changes
DataModel <- R6Class("DataModel",
  inherit = EventEmitter,
  public = list(
    initialize = function(data = data.frame()) {
      super$initialize()
      private$data <- data
    },

    add_row = function(...) {
      new_row <- data.frame(..., stringsAsFactors = FALSE)
      private$data <- rbind(private$data, new_row)
      self$emit("data_changed", private$data)
      invisible(self)
    },

    get_data = function() private$data
  ),

  private = list(
    data = NULL
  )
)

# Create model and attach observers
model <- DataModel$new()

# Observer 1: log changes
model$on("data_changed", function(data) {
  cat("[Logger] Data now has", nrow(data), "rows\n")
})

# Observer 2: validate data
model$on("data_changed", function(data) {
  if (nrow(data) > 3) cat("[Validator] Warning: dataset getting large!\n")
})

# Observer 3: summary stats
model$on("data_changed", function(data) {
  if (ncol(data) > 0 && is.numeric(data[[1]])) {
    cat("[Stats] Mean of first column:", mean(data[[1]]), "\n")
  }
})

# Add data -- all observers are notified
model$add_row(x = 10, y = "a")
cat("\n")
model$add_row(x = 20, y = "b")
cat("\n")
model$add_row(x = 30, y = "c")
cat("\n")
model$add_row(x = 40, y = "d")
```

## Singleton Pattern

The Singleton pattern ensures only one instance of a class exists. Useful for configuration, logging, or database connection pools.

```r
library(R6)

# Singleton using a closure
AppConfig <- (function() {
  instance <- NULL

  R6Class("AppConfig",
    public = list(
      initialize = function() {
        if (!is.null(instance)) {
          stop("Use AppConfig$get_instance() instead of $new()")
        }
        private$settings <- list()
      },

      set = function(key, value) {
        private$settings[[key]] <- value
        invisible(self)
      },

      get = function(key, default = NULL) {
        val <- private$settings[[key]]
        if (is.null(val)) default else val
      },

      print = function(...) {
        cat("AppConfig:", length(private$settings), "settings\n")
        for (nm in names(private$settings)) {
          cat("  ", nm, "=", private$settings[[nm]], "\n")
        }
      }
    ),

    private = list(
      settings = NULL
    )
  )
})()

# Simple singleton via manual management
config <- AppConfig$new()
config$set("debug", TRUE)
config$set("max_retries", 3)
config$print()

# Access from anywhere
cat("Debug:", config$get("debug"), "\n")
cat("Timeout:", config$get("timeout", default = 30), "\n")
```

## Builder Pattern

The Builder pattern constructs complex objects step by step, especially when an object has many optional parameters.

```r
library(R6)

# The product
Plot <- R6Class("Plot",
  public = list(
    title = NULL, x_label = NULL, y_label = NULL,
    theme = NULL, colors = NULL, width = NULL, height = NULL,

    render = function() {
      cat("=== Plot ===\n")
      cat("Title:", self$title %||% "(none)", "\n")
      cat("X label:", self$x_label %||% "(auto)", "\n")
      cat("Y label:", self$y_label %||% "(auto)", "\n")
      cat("Theme:", self$theme %||% "default", "\n")
      cat("Size:", self$width %||% 800, "x", self$height %||% 600, "\n")
      cat("Colors:", paste(self$colors %||% "auto", collapse = ", "), "\n")
    }
  )
)

# The builder
PlotBuilder <- R6Class("PlotBuilder",
  public = list(
    initialize = function() {
      private$plot <- Plot$new()
    },

    set_title = function(title) {
      private$plot$title <- title
      invisible(self)
    },

    set_labels = function(x = NULL, y = NULL) {
      if (!is.null(x)) private$plot$x_label <- x
      if (!is.null(y)) private$plot$y_label <- y
      invisible(self)
    },

    set_theme = function(theme) {
      private$plot$theme <- theme
      invisible(self)
    },

    set_size = function(width, height) {
      private$plot$width <- width
      private$plot$height <- height
      invisible(self)
    },

    set_colors = function(colors) {
      private$plot$colors <- colors
      invisible(self)
    },

    build = function() {
      result <- private$plot
      private$plot <- Plot$new()  # Reset for next build
      result
    }
  ),

  private = list(
    plot = NULL
  )
)

# Fluent builder usage
plot1 <- PlotBuilder$new()$
  set_title("MPG vs Weight")$
  set_labels(x = "Weight (1000 lbs)", y = "Miles per Gallon")$
  set_theme("minimal")$
  set_size(1200, 800)$
  set_colors(c("#E41A1C", "#377EB8", "#4DAF4A"))$
  build()

plot1$render()
```

## Summary Table

| Pattern | Purpose | When to Use |
|---------|---------|-------------|
| Factory | Create objects without specifying exact class | Multiple classes sharing an interface |
| Strategy | Swap algorithms at runtime | Interchangeable behaviors (imputation, sorting, scoring) |
| Observer | Notify subscribers of state changes | Event systems, reactive UIs, logging |
| Singleton | One instance only | Config, DB connections, loggers |
| Builder | Construct complex objects step by step | Objects with many optional parameters |

## Practice Exercises

**Exercise 1:** Implement a Factory that creates different normalization strategies: MinMaxScaler (0-1), StandardScaler (z-score), and RobustScaler (using median/IQR).

<details><summary>Click to reveal solution</summary>

```r
library(R6)

MinMaxScaler <- R6Class("MinMaxScaler",
  public = list(
    transform = function(x) (x - min(x)) / (max(x) - min(x)),
    name = function() "min-max"
  )
)

StandardScaler <- R6Class("StandardScaler",
  public = list(
    transform = function(x) (x - mean(x)) / sd(x),
    name = function() "standard"
  )
)

RobustScaler <- R6Class("RobustScaler",
  public = list(
    transform = function(x) (x - median(x)) / IQR(x),
    name = function() "robust"
  )
)

create_scaler <- function(method) {
  switch(method,
    "minmax" = MinMaxScaler$new(),
    "standard" = StandardScaler$new(),
    "robust" = RobustScaler$new(),
    stop("Unknown method: ", method)
  )
}

x <- c(10, 20, 30, 100, 50)
for (m in c("minmax", "standard", "robust")) {
  scaler <- create_scaler(m)
  cat(scaler$name(), ":", round(scaler$transform(x), 3), "\n")
}
```

</details>

**Exercise 2:** Create a simple Observer-based `Counter` that emits "threshold" when the count exceeds a given value.

<details><summary>Click to reveal solution</summary>

```r
library(R6)

ObservableCounter <- R6Class("ObservableCounter",
  public = list(
    initialize = function(threshold = 5) {
      private$count <- 0
      private$threshold <- threshold
      private$listeners <- list()
    },
    on_threshold = function(callback) {
      private$listeners <- c(private$listeners, list(callback))
      invisible(self)
    },
    increment = function(n = 1) {
      private$count <- private$count + n
      cat("Count:", private$count, "\n")
      if (private$count >= private$threshold) {
        for (cb in private$listeners) cb(private$count)
      }
      invisible(self)
    },
    get_count = function() private$count
  ),
  private = list(count = NULL, threshold = NULL, listeners = NULL)
)

ctr <- ObservableCounter$new(threshold = 3)
ctr$on_threshold(function(n) cat("ALERT: count reached", n, "!\n"))
ctr$increment()
ctr$increment()
ctr$increment()  # Triggers alert
ctr$increment()
```

</details>

**Exercise 3:** Implement a Builder for a `Report` object with optional title, author, sections (list of strings), and format ("html"/"pdf").

<details><summary>Click to reveal solution</summary>

```r
library(R6)

Report <- R6Class("Report",
  public = list(
    title = "Untitled", author = "Anonymous",
    sections = list(), format = "html",
    render = function() {
      cat("=== Report ===\n")
      cat("Title:", self$title, "\n")
      cat("Author:", self$author, "\n")
      cat("Format:", self$format, "\n")
      cat("Sections:", length(self$sections), "\n")
      for (s in self$sections) cat("  -", s, "\n")
    }
  )
)

ReportBuilder <- R6Class("ReportBuilder",
  public = list(
    initialize = function() { private$r <- Report$new() },
    title = function(t) { private$r$title <- t; invisible(self) },
    author = function(a) { private$r$author <- a; invisible(self) },
    add_section = function(s) { private$r$sections <- c(private$r$sections, s); invisible(self) },
    format = function(f) { private$r$format <- f; invisible(self) },
    build = function() { out <- private$r; private$r <- Report$new(); out }
  ),
  private = list(r = NULL)
)

report <- ReportBuilder$new()$
  title("Quarterly Analysis")$
  author("Alice")$
  add_section("Introduction")$
  add_section("Methods")$
  add_section("Results")$
  format("pdf")$
  build()

report$render()
```

</details>

## FAQ

**Q: Are design patterns overkill for R?**
For scripts and one-off analyses, yes. For packages, Shiny apps, and production systems, no. Patterns make code more maintainable and testable.

**Q: Can I use design patterns with S3 or S4?**
Yes, but R6's mutable objects and encapsulation make patterns much more natural. Factory can work with S3 (just return different S3 objects). Strategy and Observer are awkward without mutable state.

**Q: Which pattern is most useful for R programmers?**
Strategy is probably the most practical for data science workflows (swappable models, preprocessors, or scoring functions). Observer is essential for Shiny development.

## Continue Learning
- [R6 Classes in R](R6-Classes-in-R.html) -- Learn R6 basics if you haven't already
- [R6 Advanced: Inheritance & Active Bindings](R6-Advanced.html) -- Deeper R6 features
- [OOP in R Exercises](R-OOP-Exercises.html) -- Practice problems covering all OOP systems
