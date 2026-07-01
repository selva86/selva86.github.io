---
title: "Machine Learning in Production Lesson 2: Versioning models with vetiver and pins"
catalog_blurb: "Register, version and retrieve a trained model so you know which one is live."
description: "Version a model with pins and vetiver: store every model on a board, keep and retrieve any past version, and read it back ready to predict, no retraining."
keywords: "vetiver R, pins R package, model versioning, MLOps in R, pin_write, vetiver_model, board_folder, model registry, reproducible model, deploy a model in R"
post_type: "LESSON"
curriculum_id: "6.120.2"
webr: true
lesson_access: "free"
track: "scientist"
course_id: "ds-production"
course_title: "Machine Learning in Production"
course_lesson: "2"
course_total: "6"
course_landing: "R-ML-Production-Course.html"
course_next: "Serving-a-Model-with-plumber.html"
course_prev: "Reproducible-Pipelines-with-targets.html"
---

=== step === cover
::eyebrow Lesson 2 of 6
## Versioning models with vetiver and pins

In Lesson 1, Dev's [targets pipeline](Reproducible-Pipelines-with-targets.html) started producing a trained model that predicts which meal-kit customers will cancel. Good. But right now that model is just a variable sitting in his R session. Close the laptop and it is gone. Retrain it next week and the old one is quietly overwritten, with no record of which model actually made last month's predictions.

Code has git for exactly this problem. Models had nothing. This lesson gives them the same discipline: a place to **register** a model, keep **every version**, and **retrieve** any one of them on demand.

By the end of this lesson you will be able to:

- Explain why a model left as a workspace object is unsafe to ship
- Store a model on a **board** and read it back, in any session, with pins
- Keep and retrieve past **versions** of a model, and understand what vetiver adds on top

**Prerequisites:** you can [fit a model end to end](Your-First-End-to-End-Model-in-R.html) and read `predict` output, and you can [write a function](Writing-Functions-in-R.html). The four boxes below are the model's whole life in production; this lesson is the second one.

::widget process-flow {"steps":[{"title":"Train","sub":"fit the model (last lesson: a targets pipeline)"},{"title":"Version","sub":"register it on a board, every write a new version"},{"title":"Retrieve","sub":"pull any version back, ready to predict"},{"title":"Serve","sub":"wrap it in an API (next lesson)"}]}

=== step === concept
::eyebrow The problem
## A trained model is just a loose object

Let us rebuild Dev's model so we can see the problem for real. Each lesson runs in a fresh R session, so here is a small stand-in for his customer data (one row per customer: boxes ordered, weeks since the last order, spend per box, and whether they cancelled) and the model fit on it.

```r
set.seed(1)
n <- 200
customers <- data.frame(
  boxes_ordered = rpois(n, 8) + 1,
  weeks_since   = rpois(n, 3),
  spend_per_box = round(runif(n, 6, 22), 1)
)
p <- plogis(-1.4 + 0.18 * customers$weeks_since - 0.02 * customers$boxes_ordered)
customers$cancelled <- rbinom(n, 1, p)
head(customers, 3)
#>   boxes_ordered weeks_since spend_per_box cancelled
#> 1             7           2          16.5         1
#> 2             8           2           9.0         1
#> 3             9           3          21.3         0
```

```r
model <- glm(cancelled ~ boxes_ordered + weeks_since + spend_per_box,
             data = customers, family = binomial)
class(model)
#> [1] "glm" "lm"
```

That `model` is a live object in memory, and nothing more. It predicts fine right now, but it has no home on disk, no name the rest of your team can ask for, and no record of when or how it was built.

[WARNING]
This is where models silently go wrong in production. Someone retrains, overwrites the object, ships it, and three weeks later a prediction looks off. Which model produced last month's numbers? Nobody can say, because the model was never stored, named, or versioned. We are about to fix all three.

=== step === concept
::eyebrow The store
## A board is a place you write models to

The **pins** package gives you a **board**: a store you write R objects to by name and read back later. Think of it as a shared shelf for models and datasets. The board can be a local folder, an S3 bucket, or a Posit Connect server; the code you write is identical, only the `board_*()` line changes.

```r-static
library(pins)

board <- board_folder("~/model-board")            # a folder; could be board_s3() or board_connect()
pin_write(board, model, name = "cancellation")    # store the model under a name
pin_read(board, "cancellation")                   # read it back, even in a brand-new session
```

Under the hood, a pin is just an object serialized to disk and read back. You already know the base R version of that, and it works here in your browser session, writing to a temporary file and reading it straight back:

```r
# What pin_write / pin_read do at their core: persist an object, then restore it.
path <- tempfile(fileext = ".rds")
saveRDS(model, path)          # write the model out
back <- readRDS(path)         # read it back into a fresh object
identical(coef(back), coef(model))
#> [1] TRUE
```

[KEY INSIGHT]
A board turns a model from a fragile in-memory object into a durable, named artifact. Anyone with access to the board can ask for `"cancellation"` and get the exact model back, no need to re-run Dev's training script.

=== step === concept
::eyebrow The point of it
## Every write keeps the old one

Persistence alone is not the win. The win is **versioning**. When you pin a model under a name that already exists, pins does not overwrite it. It keeps the old copy and adds a new **version**, stamped with the time and a content hash (a short fingerprint computed from the model's contents), like `20260701T090000Z-9b7e2`. You can list every version and read back any one of them.

```r-static
pin_write(board, model,     name = "cancellation")   # today's model    -> version 1
# ... a week later, Dev retrains on fresh data ...
pin_write(board, new_model, name = "cancellation")   # the new model    -> version 2, version 1 kept

pin_versions(board, "cancellation")
#> # A tibble: 2 x 3
#>   version                created             hash
#>   <chr>                  <dttm>              <chr>
#> 1 20260624T140000Z-a1c3f 2026-06-24 14:00:00 a1c3f
#> 2 20260701T090000Z-9b7e2 2026-07-01 09:00:00 9b7e2
```

Here is that exact behavior in a few lines of base R, so you can watch it happen. Our toy board is a list, and writing appends a version instead of replacing one:

```r
board <- list()   # a toy board; real pins uses a folder, the idea is identical

pin_write_toy <- function(board, name, object) {
  version <- sprintf("%s-v%d", name, length(board[[name]]) + 1)  # real pins uses a timestamp + hash
  board[[name]] <- c(board[[name]], list(list(version = version, object = object)))
  board
}
pin_read_toy <- function(board, name, which = length(board[[name]])) {
  board[[name]][[which]]$object   # default: the newest version
}

board <- pin_write_toy(board, "cancellation", model)        # version 1

model_v2 <- glm(cancelled ~ boxes_ordered + weeks_since,    # Dev retrains, a simpler model
                data = customers, family = binomial)
board <- pin_write_toy(board, "cancellation", model_v2)     # version 2

sapply(board[["cancellation"]], function(e) e$version)
#> [1] "cancellation-v1" "cancellation-v2"
```

[KEY INSIGHT]
Both models are still on the board. Retraining did not destroy last week's work, it added to a history. That is exactly what git does for code, now done for models: an append-only trail you can always walk back through.

=== step === quiz
::eyebrow Check yourself
## What happens to last week's model?

Dev's `"cancellation"` model is already on the board (version 1). He retrains on new data and calls `pin_write` again under the same name `"cancellation"`. What happens to the version 1 model?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- It is overwritten; a board only ever holds the latest model under each name ::no That is the loose-object behavior we are escaping. A board keeps the old copy: the new write becomes the latest version, and version 1 is still there to read back.
- It is kept as version 1; the new model becomes the latest, and you can still retrieve the old one ::ok Right. Writing under an existing name appends a new version, it never overwrites. The full history stays on the board, so last week's model is one `pin_read` away.
- The write fails with an error because the name already exists ::no Re-using the name is the normal case, not an error. That is precisely how a new version gets recorded.

=== step === tryit
::eyebrow Your turn
## Retrieve a specific version

You have the `board` and `pin_read_toy()` from the last step, holding two versions of `"cancellation"`. By default the reader returns the newest version. Read back the **first** version specifically instead, by filling in its index.

```r
old_model <- pin_read_toy(board, "cancellation", which = ____)
coef(old_model)
```
::check {"regex":"which\\s*=\\s*1","gate":true,"difficulty":"intermediate","ok":"That pulls version 1 back, the original model, untouched by the retrain. Being able to name an exact past version is the whole point of versioning.","no":"Version 1 lives at index 1 in the history. Set which = 1."}
::solution
```r
old_model <- pin_read_toy(board, "cancellation", which = 1)
coef(old_model)
```

=== step === concept
::eyebrow The upgrade
## vetiver: a model needs more than the object

A pin will happily store any object. But a **model** you plan to serve needs more than the fitted object to be trustworthy: it needs to know what valid input looks like, and it needs a record of how it was built. The **vetiver** package bundles all of that into a single "vetiver model" and then pins it for you.

```r-static
library(vetiver)

v <- vetiver_model(model, "cancellation")   # bundle: the model + an input prototype + metadata
```

You do not have to take that on faith. Here is the same bundle built by hand, so you can see the two extra pieces vetiver adds. The **prototype** is a zero-row copy of the input: it carries the column names and types, but no data.

```r
prototype <- customers[0, c("boxes_ordered", "weeks_since", "spend_per_box")]  # 0 rows: shape only
sapply(prototype, class)          # the columns and types valid new data must have
#> boxes_ordered   weeks_since spend_per_box
#>     "numeric"     "integer"     "numeric"

v_model <- list(
  model     = model,              # the fitted model, ready to predict
  prototype = prototype,          # the input contract: names and types
  metadata  = list(
    r_version = R.version.string,
    packages  = "stats::glm",
    trained   = "captured at write time"
  )
)
names(v_model)
#> [1] "model"     "prototype" "metadata"
```

The prototype is what lets a deployed model reject bad input before it predicts nonsense. Send it a request missing `weeks_since`, or with `weeks_since` as text, and vetiver catches the mismatch instead of returning a confident wrong answer.

::widget process-flow {"steps":[{"title":"The fitted model","sub":"the trained model, ready to predict"},{"title":"The input prototype","sub":"the column names and types valid new data must have"},{"title":"The metadata","sub":"R and package versions, and when it was trained"},{"title":"Pinned to a board","sub":"stored and versioned, exactly like a raw pin"}]}

=== step === concept
::eyebrow The whole loop
## Write, version, retrieve, predict

vetiver reuses the same board, so the workflow is the one you already know, with `vetiver_pin_write` in place of `pin_write` and `vetiver_pin_read` to get a model back ready to predict.

```r-static
library(pins); library(vetiver)
board <- board_folder("~/model-board")

vetiver_pin_write(board, v)                 # store the bundled model as a new version
pin_versions(board, "cancellation")         # every version you have kept

# On the serving machine: pull a specific version back and predict. No retraining.
v_live <- vetiver_pin_read(board, "cancellation",
                           version = "20260701T090000Z-9b7e2")
predict(v_live, new_customer)
```

And the runnable version of that final, important move: store the bundle, pull it back, and predict from the retrieved model, no retraining anywhere.

```r
board <- pin_write_toy(board, "cancellation-vetiver", v_model)   # store the whole bundle

pulled <- pin_read_toy(board, "cancellation-vetiver")            # pull it back (the latest version)
new_customer <- data.frame(boxes_ordered = 3, weeks_since = 6, spend_per_box = 12.5)
predict(pulled$model, newdata = new_customer, type = "response")
#>         1
#> 0.3768709
```

[KEY INSIGHT]
The model in production is now a named, versioned artifact you can retrieve exactly and predict from immediately. That closes the loop: whatever is serving predictions is a specific version on the board, not a mystery object someone left in a session.

=== step === quiz
::eyebrow Check yourself
## Why can you predict straight away?

In the last step you read a model back with `vetiver_pin_read()` and called `predict()` on it immediately, with no retraining. What made that possible?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The board re-fit the model from the training data it saved alongside it ::no The board stores the model object, not the training data, and nothing is re-fit on read. Re-fitting would not even be reproducible.
- The bundle carried the fitted model itself plus its input prototype, so the exact trained model predicts and the prototype checks the new data has the right columns and types ::ok Exactly. vetiver stored the fitted model, so no retraining is needed, and the prototype guards the input so predictions run on well-formed data.
- pins reconstructed the model from its version hash ::no A hash only identifies a version, it cannot rebuild a model. The fitted object itself is what was stored and read back.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative, free places to take this further:

- [pins for R (official docs)](https://pins.rstudio.com/) - the board abstraction and how automatic versioning works, with every board backend.
- [pins: Get started](https://pins.rstudio.com/articles/pins.html) - a hands-on walkthrough of writing, reading and versioning a pin.
- [vetiver (official docs)](https://vetiver.posit.co/) - the version, deploy and monitor framework this lesson builds toward, for R and Python.
- [vetiver: Get started](https://vetiver.posit.co/get-started/) - build a vetiver model, store it on a board, and read it back, the exact workflow you just met.

=== step === complete
## Lesson 2 complete

Dev's model is no longer a loose object that vanishes with his session. It lives on a board, under a name, with a full version history he can walk back through, and vetiver wraps it with the input contract and metadata that make it safe to serve. The moves: write each model to a board, let every write become an immutable version, retrieve any version on demand, and read it back ready to predict without retraining.

Next, Lesson 3: **Serving a model with plumber.** You have a versioned model you can retrieve on any machine. Now you will wrap it in a small REST API so other systems can send it data and get predictions back, and you will see how vetiver can generate that API for you from the very bundle you built here.
