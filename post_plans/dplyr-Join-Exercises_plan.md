# Plan: dplyr join() Exercises

## Frontmatter
- title: dplyr join() Exercises: 10 Left, Right, Inner & Full Join Problems — Solved Step-by-Step
- slug: dplyr-Join-Exercises
- description: Practise dplyr joins with 10 left, right, inner & full join problems and worked solutions. Build real R skills through hands-on exercises, beginner to advanced.
- keywords: dplyr join exercises, R join practice, left_join exercises, inner_join exercises, full_join exercises, right_join R, dplyr practice problems, R data wrangling exercises
- auto_link_terms: dplyr join exercises|join practice problems|dplyr joins practice|left_join exercises|inner_join exercises
- auto_link_case_sensitive: false
- mathjax: false
- webr: true
- date: 2026-04-06
- curriculum_id: E2.4
- post_type: EX
- sidebar_title: dplyr join() Exercises
- fr_parent: R-Joins.html

## Breadcrumb
Home > Data Wrangling > dplyr Basics > dplyr join() Exercises

## Lead sentence
These ten progressive exercises turn `left_join()`, `right_join()`, `inner_join()`, and `full_join()` into reflexes — each problem runs in your browser, with a worked solution you can reveal after trying.

## Introduction plan
Hook: joins look easy until they don't. Most learners memorise the four types, then fumble when keys mismatch, duplicates appear, or rows vanish silently. Exercises fix that faster than any tutorial.

What you'll do: solve 10 problems using small, inline datasets (employees, departments, salaries, projects). Each problem specifies the expected row count. Difficulty ramps from "match two 3-row tables" to "debug a join that silently duplicates rows".

Prerequisites: you should know what `inner_join()` and `left_join()` do conceptually. If not, read the dplyr joins tutorial first (linked in References). All code runs in your browser — just click Run.

## Section outline

### H2: Setup: The Datasets We'll Use
- Show the 4 small tables: employees, departments, salaries, projects
- One code block that creates all of them
- Prose explanation of the keys and join intent

### H2: Warm-Up: Your First Joins (Exercises 1-3)
- Ex 1: inner_join employees + departments (easy)
- Ex 2: left_join keep all employees, attach departments (easy)
- Ex 3: full_join departments + salaries to see who's missing (easy-medium)

### H2: Core Problems: Join Types That Feel Alike (Exercises 4-7)
- Ex 4: right_join and its equivalent left_join (medium)
- Ex 5: chain two joins (employees + departments + salaries) (medium)
- Ex 6: join by keys with different column names (medium)
- Ex 7: join on multiple keys (medium-hard)

### H2: Advanced Challenges: Filter Joins and Debugging (Exercises 8-10)
- Ex 8: semi_join / anti_join filter by membership (hard)
- Ex 9: handle duplicated keys producing row explosion (hard)
- Ex 10: detect and fix an unintended many-to-many join (hard)

### H2: Common Mistakes and How to Fix Them
1. Forgetting `by =` makes dplyr guess with a natural join (may work silently wrong)
2. Many-to-many joins without `relationship =` argument silently duplicate rows (in dplyr 1.1+, this warns)
3. Type mismatch on keys (integer vs character) drops all matches
4. Using inner_join when you meant left_join loses rows silently

### H2: Summary
- Table of join types vs row-keeping behaviour

### H2: FAQ
- Q1: What's the difference between left_join and merge()?
- Q2: Why does my join produce more rows than expected?
- Q3: When should I use semi_join instead of inner_join + select?
- Q4: Can I join on more than two columns?

### H2: References
1. dplyr mutating joins docs
2. dplyr filtering joins docs
3. R4DS Chapter 19 (Hadley)
4. Posit dplyr 1.1.0 many-to-many blog post
5. STAT 545 join cheatsheet

### H2: What's Next?
- Back to R-Joins tutorial (parent)
- dplyr group_by() Exercises
- dplyr filter() and select() tutorial

## Code Block Master List

| # | Demonstrates | Libs | Vars introduced | Vars used |
|---|---|---|---|---|
| 1 | Setup: build 4 datasets | dplyr | employees, departments, salaries, projects | — |
| 2 | Ex1 starter (filter) | — | — | employees, departments |
| 3 | Ex1 solution | — | ans1 | employees, departments |
| 4 | Ex2 starter | — | — | employees, departments |
| 5 | Ex2 solution | — | ans2 | employees, departments |
| 6 | Ex3 starter | — | — | departments, salaries |
| 7 | Ex3 solution | — | ans3 | departments, salaries |
| 8 | Ex4 starter | — | — | employees, departments |
| 9 | Ex4 solution | — | ans4a, ans4b | employees, departments |
| 10 | Ex5 starter | — | — | employees, departments, salaries |
| 11 | Ex5 solution | — | ans5 | employees, departments, salaries |
| 12 | Ex6 starter | — | — | employees, projects |
| 13 | Ex6 solution | — | ans6 | employees, projects |
| 14 | Ex7 starter | — | — | (new small tables inline) |
| 15 | Ex7 solution | — | ans7 | — |
| 16 | Ex8 starter | — | — | employees, projects |
| 17 | Ex8 solution | — | ans8a, ans8b | employees, projects |
| 18 | Ex9 starter | — | — | (new duplicate-key table) |
| 19 | Ex9 solution | — | ans9 | — |
| 20 | Ex10 starter | — | — | (new m:m table) |
| 21 | Ex10 solution | — | ans10 | — |
