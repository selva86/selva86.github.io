---
title: "Machine Learning in Production Lesson 3: Serving a model with plumber"
catalog_blurb: "Wrap a trained model in a small web service other systems can call."
description: "Serve a fitted R model with plumber: how an endpoint turns a JSON request into a prediction, the special comments that define it, and how vetiver generates the API."
keywords: "plumber R, REST API in R, serve a model in R, model deployment, plumber endpoint, predict API, jsonlite, vetiver_api, MLOps in R, R web service"
post_type: "LESSON"
curriculum_id: "6.120.3"
webr: true
lesson_access: "free"
track: "scientist"
course_id: "ds-production"
course_title: "Machine Learning in Production"
course_lesson: "3"
course_total: "6"
course_landing: "R-ML-Production-Course.html"
course_next: "Batch-vs-Real-Time-Inference.html"
course_prev: "Versioning-Models-with-vetiver-and-pins.html"
---

=== step === cover
::eyebrow Lesson 3 of 6
## Serving a model with plumber

In Lesson 2, Dev's meal-kit cancellation model finally had a safe home: [versioned on a board](Versioning-Models-with-vetiver-and-pins.html), any past version one line away. But it is still stuck inside R. When a customer's subscription comes up for renewal, it is the **billing system**, a completely separate service, that needs to ask "is this customer about to cancel?" and it cannot load an R object.

This lesson builds the bridge: a small **web service** that puts the model behind a URL, so any system can send it a customer and get a prediction back.

By the end of this lesson you will be able to:

- Explain why a stored model still cannot serve predictions to other systems, and what a REST API adds
- Trace a prediction endpoint's contract: a JSON request in over HTTP, a JSON prediction out
- Write a minimal plumber file, run it, and let vetiver generate one for you

**Prerequisites:** Lesson 2 (a versioned model and the vetiver bundle), and you can [fit a model and read `predict` output](Your-First-End-to-End-Model-in-R.html) and [write a function](Writing-Functions-in-R.html).

::widget process-flow {"steps":[{"title":"Train","sub":"fit the model (Lesson 1, a targets pipeline)"},{"title":"Version","sub":"register it on a board (Lesson 2)"},{"title":"Serve","sub":"put it behind a REST API so other systems can call it - this lesson"},{"title":"Monitor","sub":"watch it after launch (Lesson 5)"}]}

=== step === concept
::eyebrow The gap
## The model works, but nothing can reach it

Dev's model predicts beautifully, as long as you are sitting inside his R session. The billing system is not. It might be written in Java, it runs on a different machine, and it has no idea what an `.rds` file is. Handing it the model object solves nothing.

What every other system already knows how to do is make a **web request**: send some data to a URL and read the reply. So we meet them there. We wrap the model in a **REST API**, a small program that listens at an address like `http://models.internal/predict`, and follows one simple contract:

- A system sends a **request** to the URL, carrying the customer's details as **JSON** (a plain-text format every language can read and write).
- The API runs the model on those details and gets a probability.
- The API sends back a **response**, the prediction as JSON, over **HTTP** (the same protocol your browser uses to load a page).

That request-and-reply loop is the whole idea. A specific address you can POST a customer to, and a prediction that comes straight back.

::widget process-flow {"steps":[{"title":"A system sends a request","sub":"POST to /predict with the customer as JSON"},{"title":"The API runs your model","sub":"parse the JSON, call predict, get a probability"},{"title":"The API sends a response","sub":"return the prediction as JSON, over HTTP"}]}

=== step === concept
::eyebrow The core
## An endpoint is just a function

Here is the reassuring part. Strip away the web plumbing and a prediction **endpoint**, the code behind that `/predict` URL, is nothing more than an ordinary R function: inputs in, a prediction out. Everything plumber adds is wrapping around this.

Each lesson runs in its own fresh R session, so let us rebuild Dev's model inline (the same small customer table and glm from Lesson 2), then write the function that will sit behind the URL.

```r
# Dev's cancellation model, rebuilt from scratch (one row per customer)
set.seed(1)
n <- 200
customers <- data.frame(
  boxes_ordered = rpois(n, 8) + 1,
  weeks_since   = rpois(n, 3),
  spend_per_box = round(runif(n, 6, 22), 1)
)
p <- plogis(-1.4 + 0.18 * customers$weeks_since - 0.02 * customers$boxes_ordered)
customers$cancelled <- rbinom(n, 1, p)

model <- glm(cancelled ~ boxes_ordered + weeks_since + spend_per_box,
             data = customers, family = binomial)

# The endpoint's job, as a plain function: a customer in, a probability out
score_customer <- function(boxes_ordered, weeks_since, spend_per_box) {
  newdata <- data.frame(boxes_ordered, weeks_since, spend_per_box)
  unname(predict(model, newdata, type = "response"))
}

# The one customer we will carry through: 3 boxes, 6 weeks since, $12.50 a box
score_customer(boxes_ordered = 3, weeks_since = 6, spend_per_box = 12.5)
#> [1] 0.3768709
```

About a 38% chance this customer cancels. That number, computed by a plain function, is exactly what the API has to deliver to the billing system. All that is missing is the part that carries the customer in and the answer out over the network.

=== step === concept
::eyebrow The wire
## JSON is how the request and reply travel

A request does not arrive as tidy R arguments. It arrives as **text**: a JSON string in the body of an HTTP request. So an endpoint really does three things in order: read the JSON into R, run the function, and turn the answer back into JSON to send home.

You can do all three by hand right now. The `jsonlite` package parses JSON with `fromJSON` and produces it with `toJSON`. This is precisely what plumber does around your function, made visible.

```r
library(jsonlite)

# 1. The raw request body the billing system POSTs (a plain JSON string)
request_body <- '{"boxes_ordered": 3, "weeks_since": 6, "spend_per_box": 12.5}'

# 2. Parse that text into R values
req <- fromJSON(request_body)
str(req)
#> List of 3
#>  $ boxes_ordered: int 3
#>  $ weeks_since  : int 6
#>  $ spend_per_box: num 12.5

# 3. Run the model, then serialize the answer back to JSON to send over the wire
prob <- score_customer(req$boxes_ordered, req$weeks_since, req$spend_per_box)
toJSON(list(cancel_probability = prob), auto_unbox = TRUE)
#> {"cancel_probability":0.3769}
```

That last line is the response the billing system receives. Text goes in, text comes out, and your model does the work in the middle. An API is just this loop, running for every request that arrives.

[KEY INSIGHT]
An endpoint = parse the JSON request, call your function, serialize the JSON response. plumber's whole job is to run that loop for you and attach it to a URL, so you only write the function in the middle.

=== step === quiz
::eyebrow Check yourself
## Why stand up an API at all?

Dev already has the fitted model saved as a file. The billing team just needs cancellation probabilities. What is the reason to wrap the model in a running web service instead of simply sending them the model file?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Email the saved model file to the billing team; they can load it whenever they need a prediction ::no They would need R and the exact model packages installed to load it, and their copy goes stale the instant Dev retrains. An API keeps one live, versioned model that any system calls over the network.
- Stand up an API: the model runs behind a URL, so any system, in any language, on any machine, sends inputs and gets a fresh prediction back ::ok Exactly. The API is the neutral meeting point. The billing service speaks HTTP and JSON, not R, and it always reaches the current model without ever loading it.
- JSON and HTTP are browser technology, so a backend billing service cannot use them ::no HTTP and JSON are how most services talk to each other, browser or not. The billing service will happily POST JSON and read the JSON reply.

=== step === concept
::eyebrow The tool
## A plumber file: comments that become an API

You have written the function and seen the JSON loop. **plumber** is the package that ties them together: you take an ordinary R function and, in special comments right above it, declare the URL and method it should answer to. plumber reads those comments and stands up the web service.

The special comments start with `#*` (a hash and an asterisk, so plumber can tell them from normal `#` comments). Save this as `plumber.R`. It cannot run a live server inside this page, so this block is for you to run locally.

```r-static
# plumber.R  -  save this file, then run it locally (it starts a web server)
library(plumber)

model <- readRDS("cancellation-model.rds")   # the versioned model retrieved in Lesson 2

#* Predict a customer's cancellation probability
#* @post /predict
#* @param boxes_ordered:int   how many boxes the customer has ordered
#* @param weeks_since:int      weeks since their last order
#* @param spend_per_box:dbl    average spend per box
#* @serializer json
function(boxes_ordered, weeks_since, spend_per_box) {
  newdata <- data.frame(
    boxes_ordered = as.integer(boxes_ordered),
    weeks_since   = as.integer(weeks_since),
    spend_per_box = as.numeric(spend_per_box)
  )
  prob <- predict(model, newdata, type = "response")
  list(cancel_probability = unname(prob))
}
```

Read the three annotations and the whole file falls into place:

- `@post /predict` declares the **method** and **path**: this function answers HTTP POST requests to `/predict`. POST is the verb for "here is some data, do something with it," which is exactly a prediction request.
- `@param` lines name the inputs the request must carry and their types (`int`, `dbl`), so plumber can hand them to your function as arguments.
- `@serializer json` tells plumber to send whatever the function returns back as JSON. Return an R list, the caller receives a JSON object.

Now launch it and call it. In a fresh R console:

```r-static
library(plumber)
plumb("plumber.R")$run(port = 8000)
#> Running plumber API at http://127.0.0.1:8000
```

`run(port = 8000)` starts the server and it keeps listening; it does not return, because it is now waiting for requests on port 8000 (a numbered door on the machine). From any other system, a terminal, the billing service, a Python script, you send it the customer and read the reply:

```r-static
# curl, from a terminal on any machine that can reach the server:
curl -X POST "http://127.0.0.1:8000/predict" \
     -H "Content-Type: application/json" \
     -d '{"boxes_ordered": 3, "weeks_since": 6, "spend_per_box": 12.5}'
#> {"cancel_probability":0.3769}
```

Same number as before, now delivered over the network. The billing system never touched R.

=== step === quiz
::eyebrow Check yourself
## Read the annotation

In `plumber.R`, the line `#* @post /predict` sits directly above the function. What does that one line actually do?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- Nothing special; it is an ordinary R comment, and plumber infers the route from the function's name ::no The `#*` comments are exactly how plumber learns the method and path. A plain `#` comment would be ignored and no route would exist.
- It runs the function once when the file loads and caches that single prediction ::no It does not run anything. It registers a route. The function runs fresh for every request, on whatever customer that request carries.
- It registers the function as the handler for HTTP POST requests to the /predict path ::ok Right. That comment is the whole difference between a loose function and an endpoint: it binds the function to a method (POST) and a path (/predict) that clients can call.

=== step === tryit
::eyebrow Your turn
## Make the reply a single number

An endpoint must return clean JSON. Here is the reply step from earlier, but there is a catch: by default `toJSON` treats every value as a vector, so a single probability comes out wrapped in brackets as an array, `[0.3769]`. The billing team wants a plain number, `0.3769`.

`toJSON` has an argument that unwraps length-one values into scalars. Fill it in so the reply reads `{"cancel_probability":0.3769}`, not `{"cancel_probability":[0.3769]}`.

```r
prob <- score_customer(3, 6, 12.5)

# Make the API reply with a scalar, not a one-element array:
toJSON(list(cancel_probability = prob), auto_unbox = ____)
```
::check {"regex":"auto_unbox\\s*=\\s*TRUE","gate":true,"difficulty":"intermediate","ok":"That is it: auto_unbox = TRUE turns length-one vectors into JSON scalars, so the reply is a clean number the caller can use directly.","no":"Set auto_unbox = TRUE. Without it, jsonlite wraps the single probability in an array: [0.3769]."}
::solution
```r
prob <- score_customer(3, 6, 12.5)
toJSON(list(cancel_probability = prob), auto_unbox = TRUE)
#> {"cancel_probability":0.3769}
```

=== step === concept
::eyebrow The shortcut
## vetiver writes the plumber file for you

You just wrote the endpoint by hand, which is the best way to understand it. In practice you rarely have to. Remember the **vetiver bundle** `v` from Lesson 2, the model packed together with its input **prototype** (the expected column names and types) and its metadata? vetiver can turn that bundle straight into a plumber API.

```r-static
library(vetiver); library(plumber)

# v is the vetiver bundle from Lesson 2: model + input prototype + metadata
pr() |>                       # start an empty plumber router
  vetiver_api(v) |>           # add the /predict endpoint, generated from the bundle
  pr_run(port = 8000)         # serve it
```

Because `v` already carries the prototype, `vetiver_api()` gives you three things the hand-written file did not, for free:

- A `/predict` endpoint wired to the exact model in the bundle, no `readRDS` line to get wrong.
- **Input validation**: a request missing `weeks_since`, or sending it as text, is rejected with a clear error instead of returning a confident wrong answer.
- A `/ping` health check and interactive **OpenAPI docs** at `/__docs__`, so anyone can see the contract and try the endpoint in a browser.

[KEY INSIGHT]
Hand-writing the plumber file teaches you what an endpoint is; vetiver generates the same thing from your versioned bundle, with input checking and docs included. The bundle you built to store the model in Lesson 2 is the same artifact that serves it here.

=== step === concept
::eyebrow Know your tool
## Where it works, where it bites

plumber turns any R model into an API in a few lines. But an API is a running program on a server, not a script you run once, and that brings real operational concerns.

**Strengths**

- Any model that lives in R can be served; you write plain R, plumber handles the HTTP.
- vetiver generates the endpoint, input validation, and docs from a versioned bundle.
- The model stays in one place; every caller reaches the same current version.

**Watch out for**

- **Concurrency**: one plumber process handles one request at a time (R is single-threaded). For real traffic you run several worker processes behind a load balancer, or a tool like `rsconnect`/Posit Connect that manages them.
- **Hosting**: the server has to run somewhere and stay up. In practice you package it in a **Docker** container (vetiver can write the Dockerfile) so it runs the same on your laptop and in production.
- **Validation and security**: never trust request data. Let the prototype reject malformed input, and put authentication in front of anything that is not public.
- **Latency**: a heavy model, or one loaded on every request instead of once at startup, makes each call slow. Load the model once when the server starts.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative, free places to take this further:

- [plumber: Get started (official docs)](https://www.rplumber.io/articles/quickstart.html) - the annotations, routing, and running a plumber API end to end.
- [plumber: Rendering and serializers](https://www.rplumber.io/articles/rendering-output.html) - how requests are parsed and responses are serialized, JSON and beyond.
- [vetiver: Deploy with plumber](https://vetiver.posit.co/get-started/deploy.html) - turning a vetiver bundle into a documented, validated API.
- [jsonlite vignette (Ooms, 2014)](https://cran.r-project.org/web/packages/jsonlite/vignettes/json-aaquickstart.html) - how R objects map to JSON, the mapping behind every request and reply.

=== step === complete
## Lesson 3 complete

Dev's model is no longer trapped in an R session. It sits behind a URL, and the billing system, which has never heard of R, sends a customer as JSON and gets a cancellation probability straight back. You saw the whole contract from the inside: an endpoint parses the JSON request, runs your function, and serializes the JSON reply; the `#*` comments in a plumber file bind that function to a method and path; and vetiver generates the same API, with input checking and docs, from the versioned bundle you built in Lesson 2.

Next, Lesson 4: **Batch vs real-time inference.** A live API answers one customer at a time, on demand. But sometimes you would rather score every customer overnight in one big job. You will learn which serving pattern fits which decision, and what each one costs.
