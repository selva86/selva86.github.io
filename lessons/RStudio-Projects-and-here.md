---
title: "R Foundations Lesson 1: RStudio Projects and here"
catalog_blurb: "Organize a project so its file paths work on any computer."
description: "Absolute file paths break when a project moves to another computer. Use an RStudio Project to anchor the working directory and the here package to build portable paths."
keywords: "RStudio Projects, here package in R, here::here, working directory in R, setwd, relative paths in R, file.path, reproducible R, portable file paths, R project setup"
post_type: "LESSON"
curriculum_id: "1.8.1"
webr: true
lesson_access: "free"
track: "foundations"
course_id: "nr-workflow"
course_title: "R Foundations: Reproducible Workflow"
course_lesson: "1"
course_total: "4"
course_landing: "R-Foundations-Workflow-Course.html"
course_next: "Reproducibility-with-renv-and-git.html"
course_prev: ""
---

=== step === cover
::eyebrow Lesson 1 of 4
## RStudio Projects and here

Maria, a data analyst, has just finished a tidy little sales analysis. It works perfectly on her laptop, so she emails the R script to a teammate. He opens it, hits Run, and it dies on the very first line. The script begins with `setwd("C:/Users/Maria/Documents/sales-analysis")`, and there is no folder by that name on his machine. Same script, same data, instant failure.

This lesson fixes that, for good. The trouble is never the analysis. It is the two lines at the top that pin the work to one exact spot on one exact computer. Get the folder and the paths right and your code travels: it runs unchanged on a teammate's laptop, on a new machine, or on a server, with nothing to edit.

By the end of this lesson you will be able to:

- Explain why a hard-coded absolute path breaks the moment a project moves to another machine or folder
- Set up an RStudio Project so the working directory is the project root automatically, on any computer
- Use `here()` to build a file path from the project root that works no matter which subfolder the code runs from

**Prerequisites:** you can [run R and call a function](R-Syntax-and-First-Objects.html), you have [read a CSV into R](Reading-CSV-and-Delimited-Files.html), and you can [install and load a package](Install-and-Load-Packages.html). The flow below is the whole journey.

::widget process-flow {"steps":[{"title":"One project folder","sub":"keep data, scripts and output together in one place"},{"title":"Open the project","sub":"the working directory is set to the project root, automatically"},{"title":"here() builds the path","sub":"every path starts from that root, so it runs on any machine"}]}

=== step === concept
::eyebrow The problem
## An absolute path names one machine

Maria's first line points at a path like `C:/Users/Maria/Documents/sales-analysis/data/sales.csv`. That is an **absolute path**: a complete address that starts at the very top of one specific computer (here, the `C:` drive) and spells out every folder down to the file. It is the equivalent of a full street address with the country, city and house number. Precise, but it only exists in one place in the world.

That precision is exactly the problem. Her teammate has no `C:/Users/Maria/` folder. His files live under `C:/Users/Raj/`, or `/home/raj/` on Linux. So the address Maria wrote points at nothing on his machine, and R gives up. We can see that failure for real. The path below is hard-coded to Maria's laptop, so on this machine `file.exists()` honestly reports that there is no such file:

```r
maria_path <- "C:/Users/Maria/Documents/sales-analysis/data/sales.csv"
file.exists(maria_path)   # is that exact file on THIS machine? no
#> [1] FALSE
```

Here is what her teammate actually sees when he runs the original script. It stops before it does any work at all:

```r-static
setwd("C:/Users/Maria/Documents/sales-analysis")
#> Error in setwd("C:/Users/Maria/Documents/sales-analysis") :
#>   cannot change working directory
```

[WARNING]
`setwd()` plus an absolute path is the single most common reason an R script that "works on my machine" fails on everyone else's. The fix is not a better absolute path. It is to stop writing absolute paths at all.

=== step === concept
::eyebrow The idea
## The working directory, and paths measured from it

R is always "standing in" one folder, called the **working directory**. It is R's sense of *you are here*. Ask for it with `getwd()`:

```r
getwd()                 # the folder R is standing in right now
#> [1] "/home/web_user"
```

The alternative to an absolute path is a **relative path**: an address measured *from the working directory* instead of from the top of the drive. The relative path `data/sales.csv` means "starting from wherever I am standing, step into `data/` and take `sales.csv`." No drive letter, no username, nothing tied to one machine. Build relative paths with `file.path()`, which joins the pieces with the correct separator for whatever operating system is running:

```r
file.path("data", "sales.csv")   # join folders into a portable relative path
#> [1] "data/sales.csv"
```

Let's prove a relative path actually works. We will create a small `data/` folder right here, write Maria's tiny sales file into it, then read it back with nothing but a relative path:

```r
dir.create("data", showWarnings = FALSE)
writeLines(c("region,sales", "North,1200", "South,900", "East,1500"), "data/sales.csv")
read.csv("data/sales.csv")    # relative path, resolved from the working directory
#>   region sales
#> 1  North  1200
#> 2  South   900
#> 3   East  1500
```

[KEY INSIGHT]
A relative path is only as good as the working directory it is measured from. Get every collaborator standing in the same folder (the project root) and the same relative path means the same file for everyone. That shared starting point is precisely what an RStudio Project gives you.

=== step === quiz
::eyebrow Check yourself
## What is it measured from?

You run `read.csv("data/sales.csv")` and it succeeds. Which folder did R look inside to find `data/sales.csv`?

::quiz {"correct":2,"gate":true,"difficulty":"beginner"}
- The folder where the script file is saved on disk ::no Close, but a relative path is not measured from the script's location. R resolves it from the working directory, which is often a different folder (and is exactly what changes under you later in this lesson).
- The current working directory, the folder R is standing in ::ok Right. A relative path is always resolved from the working directory. `data/sales.csv` means "from where R is standing, go into data and take sales.csv." Change the working directory and the same text points somewhere else.
- Maria's home folder, because that is where R always starts ::no There is no fixed home folder. R resolves a relative path from the current working directory, which you can move and which RStudio sets for you when you open a project.

=== step === concept
::eyebrow The fix, part one
## An RStudio Project anchors the working directory

An **RStudio Project** is just an ordinary folder with one small extra file in it, named with a `.Rproj` extension (for example `sales-analysis.Rproj`). You keep everything the analysis needs inside that one folder: the data, the scripts, the output. A typical layout looks like this:

```
sales-analysis/            <- the project root (holds sales-analysis.Rproj)
|-- sales-analysis.Rproj   <- the marker that makes this folder a Project
|-- data/
|   `-- sales.csv
|-- R/
|   `-- clean-data.R
`-- output/
    `-- sales-plot.png
```

The magic is what happens when you open that `.Rproj` file (File > Open Project in RStudio, or double-click it): RStudio starts a fresh R session and **sets the working directory to the project folder**, automatically. Maria's machine, her teammate's machine, a server, it does not matter, because opening the project always makes the project root the working directory. Now this single line means the same file for everyone, with no `setwd()` anywhere:

```r-static
# At the top of any script in the project. No setwd(), no drive letter:
sales <- read.csv("data/sales.csv")   # data/ is right inside the project root
```

[NOTE]
The rule of thumb from here on: never call `setwd()`, and never write an absolute path in a script. Open the project instead, and write every path relative to the project root. The `.Rproj` file does the anchoring so you do not have to.

=== step === concept
::eyebrow The leak
## One gap relative paths still cannot close

Opening a project fixes the working directory at the start. But the working directory can quietly **move while your code runs**, and when it does, a bare relative path breaks again. The classic case is rendering a report. When you knit an R Markdown or Quarto file that lives in a `report/` subfolder, R moves the working directory *into* `report/` for the duration of the render. So this line, which worked fine from the project root, now looks in the wrong place:

```r-static
# Knitting report/analysis.Rmd moves the working directory into report/.
# So R now hunts for the file inside report/data/, which does not exist:
read.csv("data/sales.csv")
#> Error: cannot open file 'data/sales.csv': No such file or directory
```

The same thing happens whenever code runs from somewhere other than the root: a script sourced from a subfolder, a scheduled job, a test. The relative path is correct *relative to the root*, but R is no longer standing at the root. We need a way to say "from the project root" explicitly, every time, regardless of where the code happens to be running.

=== step === concept
::eyebrow The fix, part two
## here() always builds from the project root

The **here** package solves exactly this. The function `here()` does not care where R is currently standing. It finds the project root on its own and builds the path from there. It works by looking in the current folder for a root marker (a `.Rproj` file, or a small `.here` file), and if it does not find one, stepping up to the parent folder, and the parent's parent, until it does. The flow:

::widget process-flow {"steps":[{"title":"Start where you are","sub":"begin in whatever folder the code is running from"},{"title":"Walk up the folders","sub":"check each parent folder for a project marker"},{"title":"Find the root marker","sub":"the folder holding .Rproj or .here is the project root"},{"title":"Build the path from there","sub":"join the root with data, sales.csv: the same answer every time"}]}

Once it has the root, `here("data", "sales.csv")` joins it onto your folders and gives back a full, correct path, identical whether you call it from the root, from `report/`, or from a scheduled job. Let's run it. (`set_here(".")` drops a `.here` marker so `here()` knows this folder is the root, which in a real project the `.Rproj` file already does for you.)

```r
library(here)
set_here(".")               # mark THIS folder as the project root (the .Rproj does this for real)
here("data", "sales.csv")   # an absolute path, built from the root
```

Because `here()` resolves to the root no matter where the code runs, the read just works, every time:

```r
read.csv(here("data", "sales.csv"))   # find the file from the root, then read it
#>   region sales
#> 1  North  1200
#> 2  South   900
#> 3   East  1500
```

[KEY INSIGHT]
`read.csv("data/sales.csv")` trusts wherever R happens to be standing. `read.csv(here("data", "sales.csv"))` rebuilds the path from the project root first, so it cannot be fooled by a working directory that moved. In a project, reach for `here()` and you never think about the working directory again.

=== step === tryit
::eyebrow Your turn
## Build a path from the root

Maria saves her charts in an `output/` folder inside the project, and wants the path to `sales-plot.png` so she can write a figure there. Using `here()`, build the path to `output/sales-plot.png` from the project root. The `library(here)` line is written for you; replace the blank with the call.

```r
library(here)
____   # build the path to output/sales-plot.png from the project root
```
::check {"regex":"here\\s*[(][^)]*output[^)]*plot","gate":true,"difficulty":"beginner","ok":"That is the habit: here(folder, file) builds from the project root, so the path is correct from any subfolder, on any machine.","no":"Pass the folder then the file name to here(): the folder output first, then the file sales-plot.png, each in quotes."}
::solution
```r
library(here)
here("output", "sales-plot.png")   # path to the chart, from the project root
#> [1] "/home/you/sales-analysis/output/sales-plot.png"
```

=== step === quiz
::eyebrow Check yourself
## When do you still need here()?

Your code lives in a proper RStudio Project, so opening it sets the working directory to the root. In which situation would a bare `read.csv("data/sales.csv")` still fail, where `read.csv(here("data", "sales.csv"))` would not?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- Never. Once it is an RStudio Project, every relative path is guaranteed to work ::no The project fixes the working directory only at the start of the session. It can still move while the code runs, and that is the gap here() closes.
- Only on Windows, because of the backslash in its file paths ::no Path separators are a real cross-platform issue, but file.path() and here() both handle them. The failure here is about the working directory moving, not the operating system.
- When the code runs from a subfolder, such as knitting a report in report/, which moves the working directory ::ok Exactly. Knitting (or sourcing from a subfolder, or a scheduled job) moves the working directory off the root, so the bare relative path looks in the wrong place. here() rebuilds from the root, so it still finds the file.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative, free places to take this further:

- [R for Data Science (2e): Workflow, scripts and projects](https://r4ds.hadley.nz/workflow-scripts) - the project-oriented workflow, explained by the authors of the tidyverse.
- [Jenny Bryan: Project-oriented workflow](https://www.tidyverse.org/blog/2017/12/workflow-vs-script/) - the canonical argument for why `setwd()` and absolute paths should be retired.
- [The here package documentation](https://here.r-lib.org/) - the official reference for `here()` and how it finds the project root.
- [Using RStudio Projects (Posit Support)](https://support.posit.co/hc/en-us/articles/200526207-Using-RStudio-Projects) - how to create and open a Project, step by step.

=== step === complete
## Lesson 1 complete

You turned a fragile script into a portable one. An **absolute path** (`C:/Users/Maria/...`) names one folder on one machine, so it breaks the moment the work moves. A **relative path** (`data/sales.csv`) is measured from the working directory, so it travels, as long as everyone starts from the same folder. An **RStudio Project** guarantees that shared starting point: opening the `.Rproj` sets the working directory to the project root automatically. And `here()` closes the last gap, building every path from that root so it holds even when the working directory moves under you, such as when you knit a report.

Next, Lesson 2: **Reproducibility with renv and git.** A portable project still depends on the exact package versions it was written against, and on a record of how it changed over time. You will pin your packages with renv so the code runs the same a year from now, and track every change with git so you can always see what you did and undo it safely.
