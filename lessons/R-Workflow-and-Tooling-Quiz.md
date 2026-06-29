---
title: "Reproducible Workflow and Tooling: Quiz"
description: "A short, graded check on a reproducible R workflow: projects and here, pinning packages with renv, version control with git, big-data tools, and reproducibility with set.seed."
keywords: "R quiz, reproducible workflow, RStudio Projects, here package, renv, git, duckdb, arrow, set.seed, R practice"
post_type: "LESSON"
curriculum_id: "1.8.5"
webr: true
lesson_access: "free"
track: "foundations"
course_id: "nr-workflow"
course_title: "R Foundations: Reproducible Workflow"
course_lesson: "5"
course_total: "5"
course_landing: "R-Foundations-Workflow-Course.html"
lesson_kind: "quiz"
course_prev: "Capstone-A-Reproducible-Analysis.html"
course_next: ""
catalog_blurb: "Check what stuck before you move on."
---

=== step === cover
::eyebrow Check your understanding
## Quiz
You have finished the workflow section: organizing work with RStudio Projects and here, pinning packages with renv, tracking changes with git, the modern 2026 toolchain, and a reproducible analysis from start to finish. This short quiz checks what stuck. Pick an answer to continue; you can retry until it clicks. The last two steps are live R, run them and tinker.

=== step === quiz
::eyebrow Question 1 of 8
## Paths that do not break
Why prefer `here("data", "sales.csv")` over a hard-coded path like `"C:/Users/me/project/data/sales.csv"`?
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- `here()` builds the path from the project root, so it works on any machine and for any collaborator. ::ok Right. The same code runs on your laptop and a teammate's because the path is relative to the project, not your home folder.
- `here()` is shorter to type. ::no Brevity is a side benefit; the real win is portability across machines.
- Hard-coded paths are faster. ::no Speed is not the issue; a hard-coded path simply breaks on another computer.
- `here()` encrypts the path. ::no It has nothing to do with encryption.

=== step === quiz
::eyebrow Question 2 of 8
## What renv pins
What problem does `renv` solve?
::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- It speeds up your code. ::no `renv` manages packages; it does not change run speed.
- It records the exact package versions a project uses, so it can be rebuilt the same way later. ::ok Right. `renv` snapshots versions into a lockfile, so the project keeps working even as packages change over time.
- It writes your code for you. ::no It manages dependencies, not the code itself.
- It replaces git. ::no `renv` and git solve different problems and are used together.

=== step === quiz
::eyebrow Question 3 of 8
## What git tracks
What does git give you in a project?
::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- A faster R interpreter. ::no git does not change how R runs.
- Automatic bug fixes. ::no git records changes; it does not fix bugs for you.
- A history of changes you can review, compare and roll back to. ::ok Right. Each commit is a save point, so you can see what changed, when, and undo it if needed.
- A spreadsheet of your data. ::no git versions files; it is not a data viewer.

=== step === quiz
::eyebrow Question 4 of 8
## Why a project, not setwd
What is the main benefit of working inside an RStudio Project rather than calling `setwd()`?
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- The project is self-contained, so paths resolve from its root and the work runs anywhere without editing `setwd()`. ::ok Right. A Project sets a stable root automatically, which is what makes `here()` and shared code just work.
- `setwd()` is faster. ::no Speed is not the point; portability and reproducibility are.
- Projects disable packages. ::no Projects do not affect package loading.
- There is no difference. ::no A Project removes the brittle, machine-specific `setwd()` step entirely.

=== step === quiz
::eyebrow Question 5 of 8
## Data bigger than memory
Your dataset is too large to fit comfortably in R's memory. Which modern tool is built to query it without loading it all in?
::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- `read.csv()` with more rows. ::no That still pulls everything into memory, which is the problem.
- duckdb or arrow, which query columnar data on disk and return only the result. ::ok Right. These engines work over data larger than memory and hand R just the small answer.
- A wider monitor. ::no Screen size has nothing to do with memory.
- Deleting half the rows by hand. ::no That loses data; the tools let you keep it all and query efficiently.

=== step === quiz
::eyebrow Question 6 of 8
## Making randomness repeatable
Your analysis uses random sampling, and you need the exact same result every time you run it. What makes that happen?
::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- Run it on the same day. ::no The date does not control R's random numbers.
- Nothing; random is always different. ::no Random draws are reproducible once you fix the seed.
- Call `set.seed()` with a fixed number before the random step. ::ok Right. A fixed seed makes R's random sequence repeatable, so anyone running your code gets the same draw.
- Use a faster computer. ::no Speed does not affect which numbers come up.

=== step === concept
::eyebrow Run it: reproducible randomness
## set.seed in live R
Fix the seed, then draw five random numbers. Run it twice and notice you get the *same* five numbers, then change `42` to another number and watch them change.

```r
set.seed(42)
sample(1:100, 5)
```

A fixed seed makes the random draw repeatable, the foundation of an analysis anyone can reproduce exactly.

=== step === concept
::eyebrow Run it: a tiny reproducible analysis
## A small pipeline in live R
Run a self-contained analysis: average miles-per-gallon by cylinder count, from a built-in dataset. Run it, then change `mean` to `max`.

```r
result <- aggregate(mpg ~ cyl, data = mtcars, FUN = mean)
result
```

Because it uses a built-in dataset and no external state, this analysis gives the same answer for anyone who runs it, which is the whole point of a reproducible workflow.

=== step === complete
## Section complete
Excellent. You can keep paths portable with `here()`, pin versions with `renv`, track history with git, explain why a Project beats `setwd()`, reach for duckdb or arrow on big data, and make an analysis repeatable with `set.seed()`. That completes the New to R foundations: you now have a solid, reproducible command of base R and the modern toolchain.
