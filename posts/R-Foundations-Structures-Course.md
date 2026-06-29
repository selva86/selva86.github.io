---
title: "R Foundations: Data Structures, A Hands-On Interactive Course"
slug: "R-Foundations-Structures-Course"
description: "Master R's data containers in five interactive lessons: lists and nested data, data frames and tibbles, inspecting structure, matrices and arrays, and type conversion."
keywords: "R data structures course, lists in R, nested data R, data frames R, tibbles, str function R, matrices in R, arrays R, type conversion R, interactive R course"
mathjax: false
webr: false
date: "2026-06-29"
curriculum_id: "1.2.0"
post_type: "C"
sidebar_section: "Learn R"
sidebar_title: "R Foundations: Data Structures (Course)"
sidebar_order: "11"
---

# R Foundations: Data Structures, A Hands-On Interactive Course

<p class="lead">A vector holds one type of value. Real analysis needs more: a mixed bundle, a table of columns, a numeric grid. This five-lesson interactive course teaches R's data structures from the ground up, with live code you run as you learn.</p>

Once you know vectors, the next question is how to hold data that is bigger and messier than a single row of numbers. This course builds up the containers in order of how often you reach for them: the flexible list, the data frame that every analysis revolves around, the tools to inspect any object, the matrix for pure numeric grids, and finally how to convert between types when data arrives in the wrong shape. Every lesson grounds one structure in a single running example.

Each lesson is a guided, interactive experience: you run R right in the page, answer checkpoints, and write code as you go. No setup, no installs.

## The five lessons

### Lesson 1: Lists and Nested Data

The list is R's most flexible container: it can hold values of different types, and even other lists. Learn to build one, reach any element with `[[` and `$`, and picture nested data as a tree.

[Start Lesson 1: Lists and Nested Data](Lists-and-Nested-Data.html)

### Lesson 2: Data Frames and Tibbles

The data frame is the table at the heart of nearly every R analysis: typed columns of equal length. Build one, pull a column, and see what the modern tibble adds on top.

[Start Lesson 2: Data Frames and Tibbles](Data-Frames-and-Tibbles.html)

### Lesson 3: Inspecting Data Structure

Before you compute, you look. Use `str()`, `class()`, `length()` and friends to read exactly what type, size and shape an object is, so you are never guessing what R just handed you.

[Start Lesson 3: Inspecting Data Structure](Inspecting-Data-Structure.html)

### Lesson 4: Matrices and Arrays

When every value is the same type, a matrix gives you a numeric grid you can sum and reduce by row or column. Build one, index it by `[row, col]`, and meet the array as its higher-dimensional cousin.

[Start Lesson 4: Matrices and Arrays](Matrices-and-Arrays.html)

### Lesson 5: Type Conversion in Practice

Data rarely arrives in the type you want. Convert deliberately with `as.numeric()`, `as.character()` and `as.factor()`, and fix the classic case of a number column that imported as text.

[Start Lesson 5: Type Conversion in Practice](Type-Conversion-in-Practice.html)

## Who this is for

Anyone comfortable with R vectors who wants to handle real, structured data. You do not need prior programming experience beyond the basics of running code and making a vector. By the end you will pick the right container for a problem and inspect any object with confidence.

## What you will be able to do

- Build and index lists, and navigate nested data with `[[` and `$`
- Create data frames and tibbles, and pull columns and rows cleanly
- Inspect any object's type, size and structure with `str()` and `class()`
- Work with matrices and arrays, reducing them by row or column
- Convert between types on purpose and repair a wrongly typed column

This course is part of the free New to R foundations track.

Ready? [Begin with Lesson 1: Lists and Nested Data](Lists-and-Nested-Data.html).
