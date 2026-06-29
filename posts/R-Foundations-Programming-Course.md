---
title: "R Foundations: Programming, A Hands-On Interactive Course"
slug: "R-Foundations-Programming-Course"
description: "Learn to program in R from the ground up in five interactive lessons: subsetting and replacement, control flow, writing functions, arguments and the pipe, and scope."
keywords: "R programming course, learn R programming, R for beginners, subsetting in R, control flow R, writing functions R, R pipe operator, environments and scope, interactive R course"
mathjax: false
webr: false
date: "2026-06-29"
curriculum_id: "1.3.0"
post_type: "C"
sidebar_section: "Learn R"
sidebar_title: "R Foundations: Programming (Course)"
sidebar_order: "12"
---

# R Foundations: Programming, A Hands-On Interactive Course

<p class="lead">Programming in R comes down to a handful of moves: pulling values out of objects, putting new ones back, repeating work, and wrapping it in functions. This five-lesson interactive course teaches each one from scratch, with live code you run as you learn.</p>

Most beginner material lists syntax and hopes it sticks. This course builds the ideas in the order you actually need them, starting with how to reach into an object and change it, and ending with how R decides which value a name refers to. Every lesson grounds one concept in a single running example, so nothing is abstract.

Each lesson is a guided, interactive experience: you run R right in the page, answer checkpoints, and write code as you go. No setup, no installs.

## The five lessons

### Lesson 1: Subsetting and Replacement

Pull elements out of vectors and data frames with `[`, `[[` and `$`, using positions, a "drop these" minus sign, TRUE/FALSE conditions and names, then write new values back in place with `x[i] <- value`. The two moves nearly every R task is built from.

[Start Lesson 1: Subsetting and Replacement](Subsetting-and-Replacement.html)

### Lesson 2: Control Flow

`if` and `else` to choose a path, `for` and `while` to repeat work, and `next` and `break` to steer a loop, watched one iteration at a time so you see exactly what runs and when.

[Start Lesson 2: Control Flow](Control-Flow-in-R.html)

### Lesson 3: Writing Functions

Wrap repeated work in your own function: the arguments it takes, the body that does the work, and the value it hands back. The step that turns a pile of commands into reusable tools.

[Start Lesson 3: Writing Functions](Writing-Functions-in-R.html)

### Lesson 4: Arguments, Defaults and the Pipe

Default and named arguments, the `...` dots for passing extras through, and chaining several steps into a readable sequence with the `|>` pipe.

[Start Lesson 4: Arguments, Defaults and the Pipe](Arguments-Defaults-and-the-Pipe.html)

### Lesson 5: Environments and Scope

How R resolves a name: it looks inside the function first, then works outward to the global environment. Understand this and the surprising bugs around variables stop being surprising.

[Start Lesson 5: Environments and Scope](Environments-and-Scope.html)

## Who this is for

You can open R and run a line of code, and that is enough. You do not need any prior programming experience. By the end you will be able to read and write everyday R with confidence and understand why it behaves the way it does.

## What you will be able to do

- Subset and replace parts of vectors and data frames using positions, conditions and names
- Direct your code with `if`/`else` and repeat work with `for` and `while` loops
- Write your own functions with arguments, defaults and sensible return values
- Chain steps with the `|>` pipe and pass arguments cleanly through `...`
- Explain how R looks up a name through environments, and avoid the scope bugs that catch beginners

This course is part of the free New to R foundations track.

Ready? [Begin with Lesson 1: Subsetting and Replacement](Subsetting-and-Replacement.html).
