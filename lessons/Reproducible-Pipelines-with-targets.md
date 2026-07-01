---
title: "Machine Learning in Production Lesson 1: Reproducible pipelines with targets"
catalog_blurb: "Rerun only the steps that changed, so results always match your code."
description: "Build your analysis as a dependency graph with the targets package, so rerunning it recomputes only the steps that changed and results always match your code."
keywords: "targets R package, reproducible pipelines in R, tar_make, dependency graph, reproducible analysis, tar_target, skip unchanged steps, data pipeline in R, targets vs source script"
post_type: "LESSON"
curriculum_id: "6.120.1"
webr: true
lesson_access: "free"
track: "scientist"
course_id: "ds-production"
course_title: "Machine Learning in Production"
course_lesson: "1"
course_total: "6"
course_landing: "R-ML-Production-Course.html"
course_next: "Versioning-Models-with-vetiver-and-pins.html"
course_prev: ""
---

=== step === cover
::eyebrow Lesson 1 of 6
## Reproducible pipelines with targets

You can build a model. Now you have to ship it, and keep it trustworthy. Meet Dev, a data scientist at a meal-kit company. He has one script, `analysis.R`, that predicts which customers will cancel: it reads the raw orders, aggregates them into per-customer numbers, fits a model, and writes a summary table. Start to finish it takes about 40 minutes, because fitting the model is slow.

This afternoon Dev changed the summary table six times, each time to round a number differently. Six times he waited 40 minutes. This lesson is about the tool that ends that: **targets**, which reruns only the steps that actually changed.

By the end of this lesson you will be able to:

- Explain why one long analysis script is slow to iterate on and lets your results quietly drift out of sync with your code
- Describe a targets pipeline as steps wired into a dependency graph, where each step is the output of a function
- Predict exactly which steps rerun after a change, so a one-character edit costs seconds instead of 40 minutes

**Prerequisites:** you can [fit a model end to end](Your-First-End-to-End-Model-in-R.html), you can [write a function](Writing-Functions-in-R.html), and it helps to have met [reproducibility with renv and git](Reproducibility-with-renv-and-git.html). The four boxes below are Dev's whole analysis.

::widget process-flow {"steps":[{"title":"Read orders","sub":"load the raw orders file"},{"title":"Build features","sub":"aggregate orders into per-customer numbers"},{"title":"Fit model","sub":"train the cancellation model (the slow step)"},{"title":"Write summary","sub":"the table Dev keeps tweaking"}]}

=== step === concept
::eyebrow The problem
## One script reruns everything

Dev's analysis lives in a single file. To run it, he calls `source("analysis.R")`, and it executes top to bottom:

```r-static
# analysis.R - the whole analysis in one file
library(readr); library(dplyr)

orders   <- read_csv("orders.csv")   # 12,000 raw order rows
features <- get_features(orders)     # aggregate to 800 customers
model    <- fit_model(features)      # trains the model ... ~38 minutes
summary  <- summarize_model(model)   # the little table at the end
write_csv(summary, "summary.csv")
```

The trouble is that `source()` is all-or-nothing. Change the last line, the one that rounds a number in the summary, and R still reruns the 38-minute model fit above it, because it has no idea the model did not change. Every tiny edit costs the full 40 minutes.

So Dev does what everyone does under time pressure: he comments out the slow line and reuses the `model` object still sitting in his workspace from the last run. It is faster, but now something dangerous has happened. The `summary.csv` he ships was built from an *old* model, while the code on disk describes a *new* one. The results and the code have silently drifted apart, and nobody can tell.

[WARNING]
This is the real cost of the one-big-script habit. Not just slow reruns, but the temptation to skip steps by hand, which lets the output you deliver stop matching the code that supposedly produced it. Reproducibility quietly dies here.

=== step === concept
::eyebrow The first move
## Break the analysis into steps

targets asks you to do one thing first: write each step of the analysis as its own small function, so each step has a clear input and a clear output. Nothing exotic, just ordinary R functions.

First the raw data. Each lesson runs in a fresh R session, so we build a small stand-in for Dev's `orders.csv` right here. These 200 rows are one per customer: how many boxes they ordered, their total spend, weeks since their last order, and whether they cancelled.

```r
library(dplyr)

set.seed(1)
n <- 200
orders <- data.frame(
  customer_id   = 1:n,
  boxes_ordered = rpois(n, 8) + 1,
  total_spend   = round(runif(n, 40, 900), 2),
  weeks_since   = rpois(n, 3)
)
p <- plogis(-1.4 + 0.18 * orders$weeks_since - 0.06 * orders$boxes_ordered)
orders$cancelled <- rbinom(n, 1, p)
head(orders, 3)
#>   customer_id boxes_ordered total_spend weeks_since cancelled
#> 1           1             7      270.06           4         1
#> 2           2             8      228.03           1         1
#> 3           3             9      484.45           6         0
```

Now each step of the analysis becomes a function, one per box from the cover. One honest simplification: because our stand-in already has one row per customer, `get_features` here just derives a new column (spend per box) rather than doing Dev's full order-to-customer roll-up. The pipeline's shape is identical either way, and that shape is the whole point:

```r
get_features <- function(orders) {
  orders |>
    mutate(spend_per_box = round(total_spend / boxes_ordered, 1))
}
fit_model <- function(features) {
  glm(cancelled ~ boxes_ordered + weeks_since + spend_per_box,
      data = features, family = binomial)
}
summarize_model <- function(model) {
  co <- coef(model)
  data.frame(term = names(co), estimate = round(unname(co), 3))
}

# Run them in order: orders -> features -> model -> summary
features <- get_features(orders)
model    <- fit_model(features)
summarize_model(model)
#>            term estimate
#> 1   (Intercept)   -1.132
#> 2 boxes_ordered   -0.062
#> 3   weeks_since    0.146
#> 4 spend_per_box   -0.002
```

[KEY INSIGHT]
Notice the shape: `get_features` needs `orders`, `fit_model` needs `features`, `summarize_model` needs `model`. Each step consumes the output of the step before it. That chain of "needs" is the thing targets is about to exploit.

=== step === widget
::eyebrow The structure
## A pipeline is a dependency graph

Write down that chain of "needs" and you get a **dependency graph**: a picture of which step depends on which. Dev's analysis is a simple chain. `features` depends on `orders`; `model` depends on `features`; `summary` depends on `model`.

::widget process-flow {"steps":[{"title":"orders","sub":"the raw data; depends on nothing"},{"title":"features","sub":"depends on orders"},{"title":"model","sub":"depends on features"},{"title":"summary","sub":"depends on model"}]}

The word to hold onto is **downstream**. A step is downstream of another if it depends on it, directly or through a chain. `model` is downstream of `orders` (through `features`); `summary` is downstream of everything. Upstream is the reverse: `orders` is upstream of all three.

Why does this matter? Because the graph tells targets exactly what a change can and cannot affect. If you edit a step, the only results that can possibly change are that step and the ones **downstream** of it. Everything upstream is provably safe to reuse. That single fact is the whole trick, and the next step makes it concrete.

=== step === quiz
::eyebrow Check yourself
## What is downstream of features?

Look at the graph: `orders -> features -> model -> summary`. You edit the `features` step. Which results might now be wrong and therefore need rebuilding?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Only `features` itself; the others used their own code so they are fine ::no The others depend on `features` through the chain. If `features` changes, the `model` built from it and the `summary` built from that can both change too.
- `features`, `model`, and `summary`, everything from features onward ::ok Right. `model` and `summary` are downstream of `features`, so a change there can ripple through both. `orders` is upstream, so it is untouched.
- All four, including `orders` ::no `orders` is upstream of `features`; nothing you do to a later step can change the raw data that fed it. Only the changed step and its downstream rebuild.

=== step === concept
::eyebrow The one rule
## Rerun only what changed

Here is how targets decides what to skip. For every step it stores a **recipe**: the step's code plus the inputs it depends on. Before running a step, it compares the current recipe to the stored one. If they are identical, the result cannot have changed, so it reuses the saved result and moves on. If the recipe differs, it rebuilds that step, and because the rebuilt output is a new input, every step downstream rebuilds too.

That is the entire idea, and it fits in about ten lines you can run. Here is a toy version of it:

```r
# For each step, remember the recipe it last ran (its code + its inputs).
cache <- list()

run_step <- function(name, recipe, compute) {
  if (!is.null(cache[[name]]) && identical(cache[[name]]$recipe, recipe)) {
    cat(name, "-> up to date, skipped\n")
    return(invisible(cache[[name]]$value))
  }
  cat(name, "-> changed, rebuilding\n")
  cache[[name]] <<- list(recipe = recipe, value = compute())
  invisible(cache[[name]]$value)
}
```

Now the three steps. Each step's recipe is its code plus the *value* of the step it depends on, so a rebuilt upstream automatically changes a downstream recipe:

```r
build_all <- function(orders_version, summary_code) {
  feat <- run_step("features",
                   list(code = "get_features", input = orders_version),
                   function() paste("features of", orders_version))
  mod  <- run_step("model",
                   list(code = "fit_model", input = feat),
                   function() paste("model on", feat))
  run_step("summary",
           list(code = summary_code, input = mod),
           function() paste(summary_code, "->", mod))
}

build_all(orders_version = "v1", summary_code = "round 2dp")   # first run: nothing cached
#> features -> changed, rebuilding
#> model -> changed, rebuilding
#> summary -> changed, rebuilding

build_all(orders_version = "v1", summary_code = "round 2dp")   # run again, nothing changed
#> features -> up to date, skipped
#> model -> up to date, skipped
#> summary -> up to date, skipped
```

Now the two cases that matter. Edit only the summary, and only the summary rebuilds. Change the raw data, and the change cascades through everything downstream:

```r
build_all(orders_version = "v1", summary_code = "round 1dp")   # edited only the summary code
#> features -> up to date, skipped
#> model -> up to date, skipped
#> summary -> changed, rebuilding

build_all(orders_version = "v2", summary_code = "round 1dp")   # the raw data changed
#> features -> changed, rebuilding
#> model -> changed, rebuilding
#> summary -> changed, rebuilding
```

[KEY INSIGHT]
targets does exactly this, with a real content hash instead of our toy strings, so it notices any change to a step's code or its inputs. Skip when the recipe matches; rebuild the changed step and everything downstream. That is the difference between a 40-minute rerun and a half-second one.

=== step === tryit
::eyebrow Your turn
## Wire a step to its input

A downstream step is defined by what it consumes. You have `get_features()`, `fit_model()` and `summarize_model()` loaded from earlier, plus the `features` object you built. The model step should be fed the features. Fill in the blank so the model trains on the right input.

```r
# The model step consumes the OUTPUT of the step before it.
model2 <- fit_model(____)
```
::check {"regex":"features","gate":true,"difficulty":"intermediate","ok":"Exactly. The model step takes the features as its input, which is precisely the dependency targets records: model depends on features.","no":"The step before the model produced the features object. Feed that in: fit_model(features)."}
::solution
```r
model2 <- fit_model(features)
```

=== step === concept
::eyebrow Writing it down
## Put the pipeline in _targets.R

You express all of this in one special file named `_targets.R`. It loads your functions and returns a list of **targets**: one `tar_target(name, recipe)` per step. The recipe just calls your function, and it declares a dependency simply by naming another target inside it, exactly the `fit_model(features)` wiring you just wrote.

```r-static
# _targets.R  - the pipeline definition
library(targets)
tar_source()   # loads get_features(), fit_model(), summarize_model() from the R/ folder

list(
  tar_target(orders_file, "orders.csv", format = "file"),  # track the raw file itself
  tar_target(orders,   read_csv(orders_file)),
  tar_target(features, get_features(orders)),
  tar_target(model,    fit_model(features)),               # the slow step
  tar_target(summary,  summarize_model(model))
)
```

Then you drive the pipeline with three commands from the R console:

```r-static
tar_make()          # build every target that is out of date, skip the rest
tar_visnetwork()    # see the dependency graph, colored by what is up to date
tar_read(summary)   # pull any target's result back into R to inspect it
```

[NOTE]
`format = "file"` is the piece that watches your *data*. It tells targets to hash `orders.csv` itself, so if the raw file changes, everything downstream rebuilds; if it does not, nothing does. targets tracks the dependencies you declare (target-to-target links and files); it does not pin package versions or capture your operating system. That layer is renv and, for full isolation, a container.

=== step === concept
::eyebrow The payoff
## Change one thing, rebuild one thing

Now replay Dev's afternoon with the pipeline in place. He edits `summarize_model()` to round to one decimal and runs `tar_make()` again. targets checks each target's recipe against what it stored last time. Only the summary's recipe changed, so only the summary rebuilds. The 38-minute model is untouched.

::widget process-flow {"steps":[{"title":"orders","sub":"raw file unchanged; skipped"},{"title":"features","sub":"code and input unchanged; skipped"},{"title":"model","sub":"the 38-minute step, unchanged; skipped"},{"title":"summary","sub":"you edited it; rebuilt in seconds"}]}

The console log makes the skipping visible. The exact wording and symbols vary by targets version, but it reads roughly like this:

```r-static
tar_make()
#> skip orders_file
#> skip orders
#> skip features
#> skip model
#> run  summary
#> completed summary [0.5 seconds]
```

Six edits to the summary now cost about three seconds total instead of four hours. And the stale-object temptation is gone: because targets always reuses the *correct* cached result and rebuilds anything genuinely out of date, the output you ship is guaranteed to match the current code. Fast and trustworthy, at the same time.

=== step === quiz
::eyebrow Check yourself
## What actually reruns?

Dev's pipeline is built and up to date. He edits only `summarize_model()` to change the rounding, saves, and runs `tar_make()`. The model fit takes 38 minutes. What happens?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Only the `summary` target rebuilds, in seconds; `orders`, `features` and `model` are up to date and skipped ::ok Right. Only the summary's recipe changed, and nothing is downstream of it, so targets rebuilds just that one step and reuses the rest.
- The whole pipeline reruns, including the 38-minute model, because the file changed ::no That is the old `source()` behavior. targets compares each target's recipe; the model's code and inputs did not change, so it is skipped, not rerun.
- Nothing reruns, because the model and features are already cached ::no The summary's code *did* change, so its recipe no longer matches; targets must rebuild that target. It skips only the ones whose recipes are unchanged.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative, free places to take this further:

- [The {targets} R package user manual](https://books.ropensci.org/targets/) - the canonical, book-length guide to pipelines, dependencies and caching.
- [A walkthrough to get started](https://books.ropensci.org/targets/walkthrough.html) - build your first working pipeline from an empty folder, step by step.
- [tar_make() reference](https://docs.ropensci.org/targets/reference/tar_make.html) - the exact behavior of the command that builds only out-of-date targets.
- [Landau (2021), The targets R package, JOSS](https://doi.org/10.21105/joss.02959) - the short peer-reviewed paper describing the design.

=== step === complete
## Lesson 1 complete

You turned a fragile 40-minute script into a pipeline that reruns only what changed. The moves: write each step as a function, let their inputs and outputs form a dependency graph, and let targets skip any step whose recipe (code plus inputs) is unchanged while rebuilding the changed step and everything downstream. The result is an analysis that is both fast to iterate on and guaranteed to stay in sync with its code.

Next, Lesson 2: **Versioning models with vetiver and pins.** Your pipeline produces a trained model; now you will register, version and retrieve that model the same disciplined way you version code, so you always know exactly which model is in production.
