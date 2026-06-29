---
title: "R Foundations Lesson 5: Install and Load Packages"
catalog_blurb: "Add and switch on the extra tools that base R does not ship with."
description: "Base R is only the starter kit. Install a package from CRAN once with install.packages, load it every session with library, and learn where packages live on your machine."
keywords: "install packages in R, install.packages, library in R, load packages in R, CRAN, R packages, .libPaths, could not find function, R for beginners"
post_type: "LESSON"
curriculum_id: "1.1.5"
webr: true
lesson_access: "free"
track: "foundations"
course_id: "nr-basics"
course_title: "R Foundations: The Basics"
course_lesson: "5"
course_total: "5"
course_landing: "R-Foundations-Basics-Course.html"
course_next: ""
course_prev: "Missing-and-Special-Values.html"
---

=== step === cover
::eyebrow Lesson 5 of 5
## Install and Load Packages

You have six names, typed by six different people, and they are a mess: `"ADA lovelace"`, `"grace HOPPER"`, `"katherine johnson"`, `"ALAN turing"`, `"dorothy VAUGHAN"`, `"john von NEUMANN"`. You want them all in clean Title Case, like `"Ada Lovelace"`. Base R can do it, but clumsily. One small add-on package, **stringr**, does the whole job in a single line, `str_to_title()`.

That is what packages are for: someone already solved your problem and bundled the solution. But before you can use that line, you have to do two things, in the right order. This lesson is those two things, and the difference between them is the single thing beginners trip on most.

By the end of this lesson you will be able to:

- Explain the difference between **installing** a package (once) and **loading** it (every session)
- Install a package from CRAN with `install.packages()`, and say where it lives on your machine
- Load a package with `library()`, call its functions, and fix the `could not find function` error when you forget

**Prerequisites:** [Lesson 1](R-Syntax-and-First-Objects.html) (running code, calling a function, and reading an error) and [Lesson 2](Atomic-Vectors-and-Data-Types.html) (building a character vector with `c()`). The flow below is the whole journey: do step 1 once, step 2 every session, then use your new tool.

::widget process-flow {"steps":[{"title":"Install from CRAN","sub":"install.packages: download to your machine, once"},{"title":"Load with library","sub":"switch the package on for this session"},{"title":"Use its functions","sub":"call str_to_title and the rest by name"}]}

=== step === concept
::eyebrow The idea
## Base R is the starter kit; packages add to it

When you install R you get **base R**: the language plus a generous set of built-in functions like `round()`, `mean()`, and `c()` from Lessons 1 to 4. It is a lot, but it is not everything. There is no built-in `str_to_title()`, no modern plotting, no fast data wrangling. Those live in **packages**.

A package is a bundle that someone wrote and shared: a set of related functions (and often sample data and documentation) you can add to R. Think of base R as the apps that came pre-installed on a new phone, and a package as an app you choose to add from the app store.

That app store has a name in R: **CRAN**, the Comprehensive R Archive Network, the official home of more than 20,000 packages. `stringr` (tidy text handling), `ggplot2` (charts), and `dplyr` (data wrangling) all live there. Adding one starts with a single base-R function:

```r-static
install.packages("stringr")   # fetch the stringr package from CRAN
```

[NOTE]
The package name goes in quotes here, `"stringr"`, because at this point it is just text: R does not know the name yet, it is about to go and find it. That changes once the package is on your machine, as you will see.

=== step === concept
::eyebrow Step 1, do it once
## Install: download the package onto your machine

`install.packages("stringr")` reaches out to CRAN over the internet, downloads the package, and saves it into a folder on your computer. You run it in the R console (in RStudio or your own session). It prints a short download log and ends with something like `package 'stringr' successfully unpacked`.

The key word is **once**. Installing copies files to disk, so the package stays there for good. You do not install it again tomorrow, or at the top of every script. You install it one time per machine (and again only after you upgrade to a new major version of R). To add several at once, pass a vector of names, the same `c()` you met in Lesson 2:

```r-static
install.packages(c("stringr", "dplyr", "ggplot2"))   # install three at once
```

[WARNING]
Installing needs an internet connection and can take a few seconds to a minute. If you put `install.packages()` inside a script that you or others run repeatedly, it will re-download every single time, which is slow and rude to CRAN. Install from the console, not from your scripts.

=== step === concept
::eyebrow Where it goes
## Where packages live on your machine

Installed packages are not scattered loose; they go into a **library**, which is simply a folder R uses to store packages. You can ask R where that folder is with `.libPaths()` (the name starts with a dot). On your own computer it prints real paths, something like this:

```r-static
.libPaths()
#> [1] "C:/Users/you/Documents/R/win-library/4.4"
#> [2] "C:/Program Files/R/R-4.4.1/library"
```

The first folder is your **personal** library (where your `install.packages()` downloads land); the second holds the packages that shipped with R itself. To check whether a package is already installed without loading it, ask `requireNamespace()`, which answers `TRUE` or `FALSE`, or read its version number:

```r
requireNamespace("stringr", quietly = TRUE)   # is stringr installed?
#> [1] TRUE
packageVersion("stringr")                      # which version do I have?
#> [1] '1.5.1'
```

[KEY INSIGHT]
"Installing" means *copying files into your library folder*. It is a one-time, on-disk action. That is the whole reason you never have to do it twice, and it sets up the contrast with loading, which you do have to repeat.

=== step === quiz
::eyebrow Check yourself
## Once, or every time?

You wrote a script that uses `stringr`. You will run that script most mornings. Where should `install.packages("stringr")` go?

::quiz {"correct":2,"gate":true,"difficulty":"beginner"}
- At the top of the script, so the package is guaranteed to be there each run ::no That re-downloads stringr from CRAN every single morning, which is slow and unnecessary. Installing copies files to disk once; it does not need repeating.
- Run it once in the console; the script itself only needs to load the package ::ok Right. Install copies the package to your library one time. After that the package is on disk for good, so the script just loads it each run.
- It must be run once per session, before each `library()` call

=== step === concept
::eyebrow Step 2, do it every session
## Load: switch the package on with `library()`

Here is the part that surprises beginners. After installing, the package sits in your library folder, but its functions are **not active yet**. A fresh R session starts with only base R switched on. To make `stringr`'s functions available, you **load** it with `library()`, once per session:

```r
library(stringr)   # switch stringr on for THIS session (no quotes needed now)
messy <- c("ADA lovelace", "grace HOPPER", "katherine johnson",
           "ALAN turing", "dorothy VAUGHAN", "john von NEUMANN")
str_to_title(messy)
#> [1] "Ada Lovelace"      "Grace Hopper"      "Katherine Johnson"
#> [4] "Alan Turing"       "Dorothy Vaughan"   "John Von Neumann"
```

There is the payoff: six tidy names from one call. Notice the name is **not** in quotes this time, `library(stringr)`, not `library("stringr")`. Once a package is installed, R recognises the name as a thing it knows about, so quotes are optional. (Both work; bare is the convention.)

What happens if you skip the `library()` line? R has no idea what `str_to_title` is, and says so:

```r-static
str_to_title(messy)
#> Error in str_to_title(messy) : could not find function "str_to_title"
```

That is the error you will see most often as a beginner, and the fix is almost always the same: run `library(stringr)` first. Because loading only lasts for the current session, every script you write starts with its `library()` calls at the top, one for each package it uses.

=== step === concept
::eyebrow What loading really does
## `library()` puts the package on the search path

When you call `library(stringr)`, R **attaches** the package to something called the **search path**: the ordered list of places R looks through, top to bottom, whenever you type a name. Loading stringr adds `package:stringr` near the top of that list, so a bare call to `str_to_title` now finds it. You can see the list with `search()`:

```r
library(stringr)
search()
#> [1] ".GlobalEnv"        "package:stringr"   "package:stats"
#> [4] "package:graphics"  "package:grDevices" "package:utils"
#> [7] "package:datasets"  "package:methods"   "Autoloads"
#> [10] "package:base"
```

`package:stringr` now sits right under your own workspace (`.GlobalEnv`), so R finds its functions. There is also a way to use a single function **without** attaching the whole package: write the package name, two colons, then the function, `stringr::str_to_upper()`. This reaches straight into the package for one call and is handy when you only need one function or want to be explicit about where it comes from:

```r
stringr::str_to_upper(c("ada", "grace"))   # call one function, no library() needed
#> [1] "ADA"   "GRACE"
```

[KEY INSIGHT]
`library(pkg)` switches a package on for the whole session (every function available by its bare name). `pkg::fun()` borrows just one function, just once, without attaching anything. Use `library()` when you will lean on a package; use `::` for a one-off.

=== step === quiz
::eyebrow Check yourself
## Reading the error

A fresh R session. You run `str_detect("apple", "p")` and get `Error in str_detect(...) : could not find function "str_detect"`. You know `stringr` is installed. What is the most likely fix?

::quiz {"correct":1,"gate":true,"difficulty":"beginner"}
- Run `library(stringr)` first; installing a package does not load it into a session ::ok Exactly. The package is on disk but not switched on for this session. `library(stringr)` attaches it, and the bare `str_detect` call then works.
- Reinstall R, because a `could not find function` error means R is broken ::no Nothing is broken. This is a routine message meaning R has no function by that name on its current search path, almost always because the package is not loaded.
- Add quotes: call `str_detect("apple", "p")` differently ::no The call itself is fine. R cannot find the function at all because `stringr` was never loaded this session, not because of how you wrote the arguments.

=== step === tryit
::eyebrow Your turn
## Load a package and use it

You have a new vector, `books`, with three titles in lower case. Load `stringr`, then use `str_to_title()` to put each one into Title Case (expect `"The R Book"`, `"Advanced R"`, `"R For Data Science"`). The data and the `library()` line are written for you; replace the blank with the call.

```r
library(stringr)
books <- c("the r book", "advanced r", "r for data science")
____   # put each title into Title Case
```
::check {"regex":"str_to_title\\s*[(]\\s*books\\s*[)]","gate":true,"difficulty":"beginner","ok":"That is the pattern for every package: install once, library() each session, then call its functions. str_to_title(books) gives you the three tidy titles.","no":"Call str_to_title on the vector: str_to_title(books)."}
::solution
```r
library(stringr)
books <- c("the r book", "advanced r", "r for data science")
str_to_title(books)
#> [1] "The R Book"         "Advanced R"         "R For Data Science"
```

=== step === concept
::eyebrow Go deeper
## References

A few trustworthy, free places to take this further:

- [Installing packages (R Installation and Administration)](https://cran.r-project.org/doc/manuals/r-release/R-admin.html#Installing-packages) - the official word on `install.packages()` and libraries.
- [R for Data Science (2e): the prerequisites](https://r4ds.hadley.nz/intro#prerequisites) - shows installing and loading the tidyverse exactly as you did here.
- [R Packages (2e), by Wickham and Bryan](https://r-pkgs.org/) - what a package actually is, from the people who build them.
- [CRAN: available packages by name](https://cran.r-project.org/web/packages/available_packages_by_name.html) - the full app store; browse the 20,000+ packages you can install.

=== step === complete
## Lesson 5 complete

You learned the two-step rhythm behind every package in R: **install once** with `install.packages()` (it downloads from CRAN into your library folder and stays there), and **load every session** with `library()` (it switches the package on so you can call its functions by name). You saw where packages live with `.libPaths()`, how `library()` puts a package on the search path, the `pkg::fun()` shortcut for a single call, and how to read and fix the `could not find function` error.

That rhythm is the key to the rest of R. Almost every tool you meet from here on, reading data, reshaping it, and plotting it, lives in a package you will install once and load with `library()`. You now have the whole foundation: running code, vectors and types, operators, missing values, and packages. Next you will put it to work on real data structures and the tidyverse tools that build on everything you just learned.
