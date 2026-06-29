---
title: "R Foundations Lesson 2: Reproducibility with renv and git"
catalog_blurb: "Keep your project running the same months from now, and track every change."
description: "A portable project still breaks when package versions drift or an edit goes wrong. Pin exact package versions with renv and track every change with git."
keywords: "renv, reproducibility in R, renv.lock, git for R, version control in R, pin package versions, renv snapshot, renv restore, reproducible environment, git commit"
post_type: "LESSON"
curriculum_id: "1.8.2"
webr: true
lesson_access: "free"
track: "foundations"
course_id: "nr-workflow"
course_title: "R Foundations: Reproducible Workflow"
course_lesson: "2"
course_total: "4"
course_landing: "R-Foundations-Workflow-Course.html"
course_next: "The-Modern-R-Toolchain-2026.html"
course_prev: "RStudio-Projects-and-here.html"
---

=== step === cover
::eyebrow Lesson 2 of 4
## Reproducibility with renv and git

In Lesson 1, Maria fixed her `sales-analysis` project so the file paths work on any computer. The script is portable now: a teammate can open the project and the paths just resolve. Job done?

Not quite. Eighteen months later a colleague clones the project onto a fresh laptop, runs it, and a chart comes out different. The code is identical. The data is identical. What changed is everything *underneath* the code: a newer version of a package, a newer version of R. And there is no record of how the project got to where it is, so when an edit breaks something, there is no clean way back.

This lesson closes those two gaps for good. You will **pin your package versions with renv** so the analysis computes the same answer next year, and **track every change with git** so you always have a labeled snapshot to return to.

By the end of this lesson you will be able to:

- Explain why an analysis that ran last year can give a different result today, even with the same code and the same data
- Use renv to record your project's exact package versions and rebuild them on any machine
- Use git to save labeled snapshots of your project and see its history

**Prerequisites:** you have a [portable RStudio Project from Lesson 1](RStudio-Projects-and-here.html), you can [install and load a package](Install-and-Load-Packages.html), and you can [run R and call a function](R-Syntax-and-First-Objects.html). The journey below is the whole lesson.

::widget process-flow {"steps":[{"title":"Portable project","sub":"paths work on any machine (Lesson 1)"},{"title":"Pinned packages","sub":"renv records the exact versions, so results hold up later"},{"title":"Tracked history","sub":"git saves a labeled snapshot of every change"}]}

=== step === concept
::eyebrow The problem
## Same code is not the same result

We tend to think of an analysis as just its code and its data. But the answer also depends on the **environment**: the exact version of R you ran, and the exact version of every package you loaded. That environment is invisible, and it **drifts**: packages get updated, R gets updated, and a function that behaved one way last year can behave differently today.

Here is a concrete, famous case. In April 2019, **R 3.6.0** changed the default method R uses to draw random numbers. After that release, the same two lines, `set.seed(1)` then `sample(1:6)`, return a *different* ordering than they did before. Nothing in the code changed. The version of R underneath it did, and any analysis that relied on that draw silently gave a new answer.

Run this to see your current environment. Every number it prints is something your results can depend on:

```r
library(jsonlite)              # a real package your analysis depends on

getRversion()                  # the exact version of R running right now
#> [1] '4.3.2'
packageVersion("jsonlite")     # the exact version of that package
#> [1] '1.8.7'
RNGkind()[3]                   # even base R is versioned: this sampler changed in R 3.6.0
#> [1] "Rejection"
```

The exact version numbers you see are whatever this session happens to have, and that is precisely the point: they are facts about *one* environment.

[WARNING]
"It works on my machine" is usually a version story. The code is fine; the machine has different package versions than yours. To make an analysis reproducible you have to capture the environment, not just the code and data.

=== step === concept
::eyebrow The fix, part one
## renv records the exact versions in a lockfile

The **renv** package solves the version-drift problem in two moves. First, it gives each project its **own private package library**, so installing or upgrading a package in one project never disturbs another. Second, and this is the part that makes you reproducible, it writes a **lockfile** named `renv.lock` that records the exact version of R and of every package the project uses.

A lockfile is not magic. It is a plain text file in JSON format, a list of records, one per package, each saying *which package, which exact version, and where it came from*. We can prove that by writing a tiny lockfile by hand and reading the versions back out of it:

```r
library(jsonlite)

# A renv.lock is just JSON. Here is a miniature one with two packages pinned:
lock_text <- '{
  "R": { "Version": "4.3.2" },
  "Packages": {
    "dplyr":   { "Package": "dplyr",   "Version": "1.1.4", "Source": "Repository" },
    "ggplot2": { "Package": "ggplot2", "Version": "3.5.1", "Source": "Repository" }
  }
}'

lock <- fromJSON(lock_text, simplifyVector = FALSE)
lock$R$Version               # the exact R version this project was built with
#> [1] "4.3.2"
lock$Packages$dplyr$Version  # the exact dplyr version, pinned
#> [1] "1.1.4"
```

[KEY INSIGHT]
The lockfile turns an invisible, drifting environment into a written, version-controlled fact. "This project uses dplyr 1.1.4" stops being something you hope is still true and becomes something the project carries with it.

=== step === widget
::eyebrow The fix, part one
## The renv workflow: init, snapshot, restore

You drive renv with three commands, and the flow below is the whole loop. You **init** once to give the project its private library, **snapshot** whenever you want to record the current versions into `renv.lock`, and **restore** on any other machine to rebuild that exact set of versions.

::widget process-flow {"steps":[{"title":"init","sub":"give the project its own private package library"},{"title":"snapshot","sub":"write every package and its exact version into renv.lock"},{"title":"restore","sub":"on a new machine, reinstall those exact versions from renv.lock"}]}

In Maria's project she runs these once, then commits the resulting `renv.lock`:

```r-static
# Run these in the project. renv writes a project-local library plus renv.lock:
renv::init()       # start renv for this project; it finds the packages you use
renv::snapshot()   # record the exact version of every package into renv.lock
renv::restore()    # on another machine: reinstall those exact versions from renv.lock
```

[NOTE]
renv pins your **packages** and records the R version, but it does not pin everything. It will tell a colleague they need R 4.3.2, but it will not install R itself, and it cannot capture the operating system or system libraries underneath. For bit-for-bit reproducibility you would add a container such as Docker. renv covers the layer that breaks most often, by far: the packages.

=== step === quiz
::eyebrow Check yourself
## Which command rebuilds the versions?

A colleague clones Maria's project onto a fresh laptop that already has the *newest* version of every package installed. Maria's `renv.lock` records the older versions her analysis was written against. Which command gives the colleague Maria's exact versions?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- `renv::restore()`, which reads renv.lock and reinstalls the recorded versions ::ok Right. restore is the "rebuild from the lockfile" step: it reads renv.lock and installs the exact versions written there, overriding whatever newer ones happen to be on the machine.
- `renv::snapshot()`, which records the versions ::no Backwards. snapshot *writes* the lockfile from whatever is currently installed, so here it would capture the colleague's newer versions, the opposite of what you want. restore reads the lockfile and installs from it.
- Nothing special; `install.packages()` always installs compatible versions ::no Newer is not always compatible, that is the whole drift problem. install.packages grabs the latest, which may behave differently. restore pins you to the recorded versions.

=== step === tryit
::eyebrow Your turn
## Read a pinned version

Reading a version straight out of the lockfile is a handy habit (it answers "what was this project built with?" without guessing). The `lock` object from earlier is still loaded. It has the same shape as `lock$Packages$dplyr$Version` that you saw. Pull out the exact **ggplot2** version this project pinned.

```r
# 'lock' is the parsed lockfile from earlier in the lesson.
lock$Packages$ggplot2$____   # get the recorded ggplot2 version
```
::check {"regex":"Version","gate":true,"difficulty":"beginner","ok":"That is it: each package record carries a Version field, so the lockfile answers exactly which version the project used.","no":"Each package record has a Version field, like lock$Packages$dplyr$Version. Ask for ggplot2's Version the same way."}
::solution
```r
lock$Packages$ggplot2$Version   # the exact ggplot2 version, read from the lockfile
#> [1] "3.5.1"
```

=== step === widget
::eyebrow The fix, part two
## git saves labeled snapshots you can return to

renv handles the environment. The other gap is **history**: as Maria edits her analysis, there is no record of what she changed or when, and no safe way to undo a bad edit. **git** fixes that. It is a version-control tool that lets you save **commits**: a commit is a labeled snapshot of your whole project at a moment in time, with a message saying what changed.

The loop has one wrinkle worth understanding. You do not commit straight from your edits. You first **stage** the changes you want to include (the staging area lets you choose *what* goes into the next snapshot), then **commit** them together with a message. After that, the history is a list of those snapshots, oldest to newest, each one a point you can return to.

::widget process-flow {"steps":[{"title":"Edit","sub":"change your scripts and files as you work"},{"title":"Stage","sub":"git add: choose what goes into the next snapshot"},{"title":"Commit","sub":"git commit: save a labeled snapshot you can return to"},{"title":"History","sub":"git log: every snapshot in order, each one undoable"}]}

These are command-line steps (RStudio's Git pane runs the same commands behind buttons):

```bash
git init                                  # start tracking this project folder
git add renv.lock analysis.R              # stage the files for the next snapshot
git commit -m "First working analysis"    # save a labeled snapshot
git log --oneline                         # see the history of snapshots
```

[KEY INSIGHT]
A commit is not a backup of your latest files; it is a permanent, labeled point in the project's timeline. Because every commit is kept, you can always compare two of them, or roll the project back to the exact state of a working one. git is built for code and small text files like `renv.lock`, not for large data files or the package library, so you keep those out of it.

=== step === concept
::eyebrow Putting it together
## Commit renv.lock so the versions travel

Here is where the two tools click together. git tracks your *files* as they change. renv writes one special file, `renv.lock`, that captures your *environment*. So if you commit `renv.lock` into git alongside your scripts, then every snapshot in your history carries the exact package versions that went with that version of the code. Roll the project back to last March's commit and `renv::restore()` rebuilds last March's environment.

That is the full reproducibility story, and it is three legs holding up one stool:

::widget process-flow {"steps":[{"title":"Project","sub":"one folder, portable paths (Lesson 1)"},{"title":"renv.lock","sub":"the exact package versions, pinned"},{"title":"git history","sub":"commit renv.lock so the versions travel with every change"}]}

[KEY INSIGHT]
Portable paths get the project onto another machine. renv makes the packages match. git makes the history, including the lockfile, recoverable. Together they answer the question that started this lesson: yes, a colleague can reproduce your exact result, eighteen months later, on a fresh laptop.

=== step === quiz
::eyebrow Check yourself
## What is the one more file to commit?

Maria has been committing her scripts to git as she works. To make the project fully reproducible for a teammate, the lesson says she should commit one more file. Which file, and why?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- `renv.lock`, so the exact package versions travel with the code history ::ok Exactly. renv.lock is small, text, and it is the record of every package version. Commit it and each point in the history carries the environment that built it, so restore can rebuild it.
- The installed packages folder (`renv/library`), so the package binaries travel ::no You never commit the library itself: it is large, machine-specific, and rebuildable. renv even gitignores it for you. restore() reinstalls it from renv.lock, which is the small file you do commit.
- Nothing else; once the scripts are in git, the versions are tracked automatically ::no git tracks changes to your *files*, not which package *versions* you had installed. Only renv.lock records those, so without it the history has no environment to restore.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative, free places to take this further:

- [Introduction to renv](https://rstudio.github.io/renv/articles/renv.html) - the official walk-through of the init / snapshot / restore workflow and what `renv.lock` contains.
- [The renv package site](https://rstudio.github.io/renv/) - the full reference, including how renv interacts with git and how it ignores the library folder.
- [Happy Git and GitHub for the useR](https://happygitwithr.com/) - Jenny Bryan's complete, R-focused guide to using git in real projects.
- [Pro Git (free book)](https://git-scm.com/book/en/v2) - the canonical reference for commits, the staging area, and history.

=== step === complete
## Lesson 2 complete

You closed the last two reproducibility gaps. **renv** captures the invisible part of an analysis, the exact R and package versions, into a small `renv.lock` file, and rebuilds them anywhere with `restore()`. **git** records your project's history as a series of labeled commits you can always return to. Commit `renv.lock` into git and the two combine: every point in your history carries the environment that produced it. With the portable project from Lesson 1, that is the full three-legged stool of a reproducible analysis.

Next, Lesson 3: **The Modern R Toolchain (2026).** You have a reproducible project; now meet the tools that make working in it fast and pleasant, from the Positron editor to talking to a database with duckdb and even to an LLM from R.
