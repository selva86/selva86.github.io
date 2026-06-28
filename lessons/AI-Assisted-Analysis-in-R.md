---
title: "Communicate and Automate Lesson 3: AI-Assisted Analysis"
description: "Use an LLM from R to summarize and label data with ellmer, force tidy structured output, ground it in real data with tools, and know when to trust it and when not to."
keywords: "AI assisted analysis, LLM in R, ellmer, large language model, structured output, type_enum, text classification, sentiment labeling, hallucination, tool calling, data analyst, R"
post_type: "LESSON"
curriculum_id: "2.9.3"
webr: true
lesson_access: "free"
course_id: "da-communicate"
course_title: "Communicate and Automate with R"
course_lesson: "3"
course_total: "3"
course_landing: "Communicate-Automate-Course.html"
course_next: ""
course_prev: "Telling-a-Story-with-Data.html"
---

=== step === cover
::eyebrow Lesson 3 of 3
## Let a model read what you cannot

In Lesson 2, Priya, the analyst at the Inkwell Books chain, learned to lead with the answer. This Monday she is stuck on a different problem. A new feedback form has produced about 4,000 free-text customer reviews across the six stores, things like "Great books, painfully slow checkout." There is no star rating, just sentences. She cannot read 4,000 of them before the morning meeting.

A **large language model** (LLM), a program trained on huge amounts of text that, given an instruction, writes a sensible text response, can read every review in about a minute. It can summarize the themes and tag each review as positive, neutral, or negative. The question this whole lesson answers is the hard one: where is that genuinely useful, and where will the model quietly make something up?

By the end of this lesson you will be able to:

- Use an LLM from R to summarize free text and label each row, with the `ellmer` package
- Force structured output so the model hands back a tidy column, not a paragraph
- Ground the model in your real data with tools, so it stops guessing numbers
- Decide, task by task, when to trust an LLM and when to compute the answer in R instead

**Prerequisites:** you can run R and load a package with `library()`, you know the dplyr verbs `filter()`, `count()` and `summarise()` from [The dplyr Verbs](The-dplyr-Verbs.html), and you have a reproducible report from [Lesson 1](Reproducible-Reports-with-Quarto.html). Every new term is defined as it appears.

The widget below is where we are heading: an LLM reasoning over Priya's store data, one step at a time, to answer a real question. Press **Step** to watch. We spend the lesson earning the right to trust it.

::widget agent-loop {"trace":[{"p":"Thought","t":"The user asks which store has the worst service; I should query the ratings, not guess."},{"p":"Action","t":"avg_rating_by_store(metric = service)"},{"p":"Observation","t":"Lakeside 2.9, Riverside 3.4, all other stores above 4.1"},{"p":"Thought","t":"Lakeside is lowest. I should read WHY by summarizing its negative reviews."},{"p":"Action","t":"summarize_reviews(store = Lakeside, sentiment = negative)"},{"p":"Observation","t":"Recurring theme: long checkout lines and understaffed evenings."},{"p":"Answer","t":"Lakeside has the worst service rating at 2.9; reviews blame long lines and understaffing."}]}

=== step === concept
::eyebrow What it is
## An LLM is a text-to-text function

Strip away the hype and an LLM is one thing: a function whose input is text and whose output is text. You hand it an instruction, called a **prompt**, and it returns words. Under the hood it works in **tokens** (short chunks of text, roughly a few characters each) and predicts the next likely token over and over. You do not need that machinery to use it; you need to know what it is good at.

For a data analyst, two jobs fit it almost perfectly, and both turn messy text into something you can use:

- **Summarize**: many rows of text in, one short paragraph out. "Here are 4,000 reviews; give me the three most common complaints."
- **Label (classify)**: one row of text in, one category out. "Is this single review positive, neutral, or negative?" Run it over every row and you have a new column.

Notice what these have in common. Both take language, the thing spreadsheets and `mean()` cannot touch, and hand back something tidy: a paragraph you can read, or a category you can count. That is the whole reason an LLM earns a place next to dplyr. Keep one thing in mind from the start, though: it is reading and judging text, not doing arithmetic. We will lean on that distinction for the rest of the lesson.

=== step === concept
::eyebrow Summarize
## Calling the model from R

You do not leave R to do this. The **`ellmer`** package (from the team behind the tidyverse) connects R to a model from a provider such as OpenAI or Anthropic. You create a chat object pointed at a model, then send it a prompt with `$chat()`.

Here is Priya summarizing a batch of reviews. This needs an API key and a network call, so it runs on your own machine, not here in the lesson, but the shape is exactly what you would type:

```r-static
library(ellmer)

# point ellmer at a model (set your API key once, e.g. OPENAI_API_KEY)
chat <- chat_openai(model = "gpt-4o-mini")

# summarize: many reviews in, one short answer out
chat$chat("Summarize the three most common complaints in these reviews,
           one bullet each:
           - Waited twenty minutes to pay
           - Great books, painfully slow checkout
           - Understaffed on weeknights
           - Loved the staff-picks shelf")
#> - Slow checkout and long waits to pay
#> - Stores feel understaffed, especially on weeknights
#> - Book selection and staff picks are appreciated
```

That is the summarize job, done in three lines. It is genuinely useful: in seconds you have the gist of text that would take an hour to skim. But a paragraph is hard to chart. For the analysis Priya actually needs, store-by-store counts, the label job is what we want, and labeling well takes one more idea.

=== step === widget
::eyebrow Label every row
## Make the output a tidy column

If you ask the model "is this review positive or negative?" in plain language, it might reply "Mostly positive, though the customer notes a delay." That is a sentence, not data. You cannot `count()` sentences. The fix is **structured output**: you tell the model, up front, the exact shape of the answer you will accept.

In `ellmer` you describe that shape with a type. `type_object` declares the record you want back, and inside it `type_enum` pins the answer to a fixed set of allowed values, so every review comes back as exactly one of `positive`, `neutral`, or `negative`, never a paragraph. Then `parallel_chat_structured()` sends all the reviews at once and returns one tidy row per review. The flow is the same five steps every time:

::widget process-flow {"steps":[{"title":"Define the task","sub":"one review in, one label out, from a fixed list"},{"title":"Pin a schema","sub":"type_enum forces positive, neutral or negative, never a paragraph"},{"title":"Label every row","sub":"parallel_chat_structured sends all reviews, returns a tidy column"},{"title":"Validate","sub":"check the labels are in your set; spot-check a sample by hand"},{"title":"Analyze in R","sub":"count, group and chart the labels like any other column"}]}

In code, that schema and call look like this (again, run on your own machine):

```r-static
library(ellmer)

# 1. Pin the output: exactly one label from a fixed set, nothing else
review_label <- type_object(
  "Sentiment of one customer review",
  sentiment = type_enum(
    "Overall sentiment of the review",
    values = c("positive", "neutral", "negative")
  )
)

# 2. Send every review at once; get one tidy row back per review
chat   <- chat_openai(model = "gpt-4o-mini")
labels <- parallel_chat_structured(chat, reviews$text, type = review_label)

# labels$sentiment is now a clean column, aligned to your reviews
```

The schema is the whole trick. Without it you get prose; with it you get a column that slots straight into dplyr.

=== step === quiz
::eyebrow Check yourself
## Why pin the labels with type_enum?

Priya could just ask the model, in plain English, to describe each review's sentiment. Instead she forces the answer to be one of `positive`, `neutral`, or `negative` with `type_enum`. What does that constraint buy her?

::quiz {"correct":1,"gate":true,"difficulty":"beginner"}
- Every review comes back as the same kind of value, a clean category she can count, group and chart like any other column ::ok Right. Structured output turns free text into tidy data: one column, a fixed set of values, the same shape on every row. That is what makes it usable in dplyr and ggplot.
- The model is more accurate when it is forced to write less ::no Constraining the format does not make the underlying judgement more accurate; it makes the OUTPUT usable. A pinned label is about tidy, machine-readable data, not about correctness.
- It is mainly a way to use fewer tokens and save money ::no Shorter answers cost slightly less, but that is a side effect. The real win is structure: a fixed-value column you can analyze, instead of a different sentence every row.

=== step === concept
::eyebrow Back in plain R
## A label is just another column

Once the model has labeled the reviews, the AI part is over. The result is an ordinary column of categories, and from here it is the plain dplyr you already know. To prove it runs end to end, each lesson starts a fresh R session, so we build the labeled table right here, pasting in the labels the model returned, then count them:

```r
library(dplyr)

# the model read each review and returned a sentiment label;
# we paste those labels in as a column so this runs offline
reviews <- data.frame(
  store     = c("Downtown", "Lakeside", "Lakeside", "Riverside",
                "Downtown", "Lakeside", "Airport", "Riverside"),
  text      = c("Loved the staff-picks shelf",
                "Waited twenty minutes to pay",
                "Great books, painfully slow checkout",
                "Friendly team, cozy reading corner",
                "Best little bookshop in town",
                "Understaffed on weeknights",
                "Quick and easy visit",
                "Helpful clerk tracked down my order"),
  sentiment = c("positive", "negative", "negative", "positive",
                "positive", "negative", "positive", "positive")
)

# the model's labels are now just a column we can count
reviews |> count(sentiment)
#>   sentiment n
#> 1  negative 3
#> 2  positive 5
```

Five positive, three negative, computed by R from the labels the model produced. The model did the reading; dplyr did the counting. That split, model for the words, R for the numbers, is the backbone of trustworthy AI-assisted analysis, and the rest of the lesson is about getting it right.

=== step === tryit
::eyebrow Your turn
## Which store is dragging on service?

The three negative reviews are the ones Priya needs to act on. Find where they cluster: keep only the negative reviews, then count them by `store`. Fill in the blank so `count()` tallies the rows per store.

```r
reviews |>
  filter(sentiment == "negative") |>
  count(____)
```
::check {"regex":"count\\s*[(]\\s*store","gate":true,"difficulty":"beginner","ok":"Exactly. All three negatives are Lakeside, so count(store) returns Lakeside = 3. That is the same store the agent flagged on the cover, now found from the data itself.","no":"You want to tally the filtered rows by store: count(store)."}
::solution
```r
reviews |>
  filter(sentiment == "negative") |>
  count(store)
#>      store n
#> 1 Lakeside 3
```

=== step === widget
::eyebrow Stop it guessing
## Ground the model in your real data

Here is the trap that catches people. You ask the model directly, "What was Lakeside's average service rating?" It answers "about 3.8," in a confident, fluent sentence. The problem: it never saw your data. It is predicting plausible text, so it produced a plausible-looking number. That is a **hallucination**, an answer that reads as fact but was invented.

The fix is **grounding**: instead of asking the model to recall a number, you give it a **tool**, an R function it is allowed to call, that fetches the real value. The model then works in a loop known as **ReAct**: it has a **Thought**, takes an **Action** (calls your tool), reads the **Observation** (your function's real result), and repeats until it can give a grounded **Answer**. This is the loop from the cover. Press **Step** and watch it query the data instead of guessing:

::widget agent-loop {"trace":[{"p":"Thought","t":"The user asks which store has the worst service; I should query the ratings, not guess."},{"p":"Action","t":"avg_rating_by_store(metric = service)"},{"p":"Observation","t":"Lakeside 2.9, Riverside 3.4, all other stores above 4.1"},{"p":"Thought","t":"Lakeside is lowest. I should read WHY by summarizing its negative reviews."},{"p":"Action","t":"summarize_reviews(store = Lakeside, sentiment = negative)"},{"p":"Observation","t":"Recurring theme: long checkout lines and understaffed evenings."},{"p":"Answer","t":"Lakeside has the worst service rating at 2.9; reviews blame long lines and understaffing."}]}

Every number in that answer came from an Action, a real R function running on real data, not from the model's memory. In `ellmer` you wrap a function with `tool()` and register it on the chat:

```r-static
library(ellmer)

# a tool is just an R function the model may call to get a REAL number;
# `ratings` is Priya's score table: one row per rating, with a numeric
# `rating` and a `kind` column naming the metric (e.g. "service")
avg_rating_by_store <- function(metric) {
  ratings |>
    group_by(store) |>
    summarise(rating = mean(rating[kind == metric]))
}

chat <- chat_openai(model = "gpt-4o-mini")
chat$register_tool(tool(
  avg_rating_by_store,
  "Average rating for a given service metric, by store"
))

# now the model calls your function instead of inventing a value
chat$chat("Which store has the worst service rating, and why?")
```

[KEY INSIGHT]
A grounded model does not need to KNOW your numbers; it needs to be able to LOOK THEM UP. Tools turn "trust the model's memory" into "trust your own R function, narrated by the model."

=== step === concept
::eyebrow Be honest about it
## When to trust it, and when not

Grounding fixes the worst failure, but an LLM has three you should keep in mind before you put its output in a report:

[WARNING]
**Hallucination.** Asked for a fact it does not have, the model invents a fluent, confident-sounding one. Never accept a number, a citation, or a quote from a model that was not handed the source. Confidence is not evidence.

[NOTE]
**Non-determinism.** Send the same prompt twice and you can get two different answers. For labeling that is usually small noise; for anything that must be exactly reproducible (the Lesson 1 goal), pin it down: lower the randomness setting, spot-check, and store the labels rather than re-generating them each render.

[WARNING]
**Privacy.** A hosted model sends your text to an outside company. Customer names, emails, anything confidential should be removed or kept on a local model before it leaves your machine. "Convenient" is not "allowed."

The practical rule is a division of labor. Let the model do what only it can, read and judge language, and let R do what it does exactly:

| Give it to the LLM | Keep it in R / SQL |
|---|---|
| Summarize 4,000 reviews into three themes | Count how many reviews each store got |
| Label each review positive / neutral / negative | Compute the average rating per store |
| Draft a first-pass title for a chart | Sum revenue, calculate the percent change |
| Suggest which columns might explain churn | Fit the model and report the actual numbers |

The left column is judgement on text; the right column is arithmetic with one correct answer. Never ask the model to do the right column. You can already compute it, exactly, and the model can only guess.

=== step === quiz
::eyebrow Check yourself
## The confident wrong number

Priya types into the chat: "What was Inkwell's total revenue last week?" The model replies, instantly and fluently, "Approximately $48,200." She never gave it the sales data. What should she do?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Treat it as unknown and compute it in R from the sales data with `sum()`; an invented statistic is worthless however confident it sounds ::ok Exactly. The model never saw the numbers, so its answer is a plausible-sounding guess, a hallucination. Revenue is exact arithmetic: compute it in R, where there is one right answer.
- Trust it; the model was trained on enormous amounts of data and stated it with confidence ::no Confidence is not correctness. It was never given Inkwell's private sales table, so it cannot know the figure; the fluent tone is exactly what makes hallucinations dangerous.
- Ask the same question a few more times and average the replies ::no Averaging guesses does not turn them into a measurement. The model still has no access to your data; every reply is invented. Compute the real figure in R instead.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [ellmer: call LLMs from R](https://ellmer.tidyverse.org/) - the package used throughout this lesson, from the tidyverse team; start here to install it and make your first call.
- [ellmer: Structured data](https://ellmer.tidyverse.org/articles/structured-data.html) - the canonical guide to `type_enum`, `type_object` and `parallel_chat_structured`, the tidy-column trick at the heart of labeling.
- [ellmer: Tool and function calling](https://ellmer.tidyverse.org/articles/tool-calling.html) - how to register R functions as tools so the model looks up real values instead of guessing them.
- [Ji et al. (2023), Survey of Hallucination in Natural Language Generation](https://arxiv.org/abs/2202.03629) - the research survey on why models invent fluent, confident, wrong answers, and what to do about it.

=== step === complete
## Lesson 3 complete, and the course is done

You added an LLM to the analyst's toolkit without losing your footing. An LLM is a **text-to-text function** that shines at two jobs: **summarizing** many rows into a paragraph and **labeling** each row into a category. With `ellmer` you call it from R, and with **structured output** (`type_enum`) you get a tidy column instead of prose, then analyze it in plain dplyr. You learned to **ground** the model with **tools** so the ReAct loop looks numbers up instead of inventing them, and you built a clear rule for **trust**: the model judges language, R computes the numbers, and you verify anything that matters.

That completes **Communicate and Automate with R**. Across three lessons you turned an analysis into a reproducible Quarto report, structured it to lead with the answer so a busy reader acts in thirty seconds, and learned to bring an LLM in safely. Priya can now go from raw data to a trustworthy, self-updating, well-told report, with AI doing the parts it is actually good at.
