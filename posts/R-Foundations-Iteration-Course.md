---
title: "R Foundations: Iteration, A Hands-On Interactive Course"
slug: "R-Foundations-Iteration-Course"
description: "Learn to repeat work in R the idiomatic way across four interactive lessons: vectorization, the apply family, the purrr map family, and resilient nested iteration."
keywords: "R iteration course, vectorization in R, apply family R, lapply sapply vapply, purrr map R, map2 pmap, safely possibly purrr, list-columns nest unnest, interactive R course"
mathjax: false
webr: false
date: "2026-06-29"
curriculum_id: "1.6.0"
post_type: "C"
sidebar_section: "Learn R"
sidebar_title: "R Foundations: Iteration (Course)"
sidebar_order: "15"
---

# R Foundations: Iteration, A Hands-On Interactive Course

<p class="lead">Almost every R task repeats one operation across many values. This four-lesson interactive course teaches the idiomatic ways to do that, from operating on a whole vector at once to mapping a function over a list and keeping a long run going past its failures.</p>

Beginners reach for a `for` loop because it is the first tool they learn, but R rewards a different habit: describe the operation once and let it run across the whole collection. This course builds that habit in the order you need it, starting with the simplest case (a single vector) and ending with iteration over awkward, nested data that does not fit a neat rectangle.

Each lesson is a guided, interactive experience: you run R right in the page, answer checkpoints, and write code as you go. No setup, no installs.

## The four lessons

### Lesson 1: Why Vectorization Beats Loops

Operate on a whole vector in one expression instead of visiting each element with a loop, learn how recycling applies one number (or a matching list of numbers) across the vector, and see why the vectorized version is both shorter and far faster.

[Start Lesson 1: Why Vectorization Beats Loops](Why-Vectorization-Beats-Loops.html)

### Lesson 2: The apply Family

`apply` over the rows or columns of a matrix, `lapply` and `sapply` over a list, and the type-safe `vapply` for when you want to state the result shape up front and catch surprises early.

[Start Lesson 2: The apply Family](The-apply-Family.html)

### Lesson 3: The purrr map Family

`map` and its typed variants (`map_dbl`, `map_chr` and friends), `map2` and `pmap` for iterating over several inputs in step, and `walk` for the side-effect case where you want the action, not a returned value.

[Start Lesson 3: The purrr map Family](The-purrr-map-Family.html)

### Lesson 4: Resilient and Nested Iteration

Keep a long run going past errors with `safely` and `possibly`, then work with list-columns: pack each group into a column of tables with `nest`, map a function over each, and `unnest` back to a flat frame.

[Start Lesson 4: Resilient and Nested Iteration](Resilient-and-Nested-Iteration.html)

## Who this is for

You can write a `for` loop and call a function, and that is enough. You do not need any prior experience with functional programming. By the end you will reach for a vectorized expression or a `map` call by default, and fall back to a loop only when it is genuinely the clearer choice.

## What you will be able to do

- Rewrite an element-by-element loop as a single vectorized expression, and explain why it runs faster
- Choose between `apply`, `lapply`, `sapply` and `vapply` for iterating over matrices and lists
- Map a function over one or several inputs with `map`, `map2` and `pmap`, and pick the right typed output
- Keep a long iteration running past failures with `safely` and `possibly`
- Iterate over grouped data using list-columns with `nest` and `unnest`

This course is part of the free New to R foundations track.

Ready? [Begin with Lesson 1: Why Vectorization Beats Loops](Why-Vectorization-Beats-Loops.html).
