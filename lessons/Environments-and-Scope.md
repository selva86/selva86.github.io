---
title: "R Foundations Lesson 5: Environments and Scope"
catalog_blurb: "Where R looks up a name, and why functions cannot disturb your workspace."
description: "How R resolves a name inside a function: it looks in the function's own environment first, then outward to the global workspace, and why that keeps code safe."
keywords: "R environments, R scope, lexical scoping, global environment, local environment, variable scope in R, shadowing, super assignment operator, R for beginners"
post_type: "LESSON"
curriculum_id: "1.3.5"
webr: true
mathjax: true
lesson_access: "free"
track: "foundations"
course_id: "nr-programming"
course_title: "R Foundations: Programming"
course_lesson: "5"
course_total: "5"
course_landing: "R-Foundations-Programming-Course.html"
course_next: ""
course_prev: "Arguments-Defaults-and-the-Pipe.html"
---

=== step === cover
::eyebrow Lesson 5 of 5
## Environments and Scope

Back one last time to the weekend R study group: the five friends Mara, Dev, Ada, Theo and Iris, with their quiz scores 58, 91, 73, 49 and 84. All course long you have written functions like `grade(score, cutoff = 60)` that quietly "find" the names they need. This final lesson answers the question you have been leaning on the whole time: when a function uses a name, where exactly does R look for it, and in what order?

The answer is a single, dependable rule. R searches the function's own little workspace first, and only if the name is not there does it look outward to your global workspace. Get this rule and you will understand why functions can read your variables but cannot quietly overwrite them, the property that makes them safe to reuse anywhere.

By the end of this lesson you will be able to:

- Say what an **environment** is, and name the two that matter: your **global** workspace and a function's own **local** environment
- Trace how R **resolves a name** inside a function, local first then outward, and predict the result
- Explain **shadowing**: when a local and a global name collide, which one wins, and that the global is left untouched
- Predict whether assigning inside a function changes your global variables (it does not), and why that isolation is a feature

**Prerequisites:** you can [run R and assign with `<-`](R-Syntax-and-First-Objects.html), [build and name a vector](Atomic-Vectors-and-Data-Types.html), and [define and call a function](Writing-Functions-in-R.html) with arguments.

::widget scope-chain {"global":{"x":10,"y":20},"local":{"y":99}}

=== step === concept
::eyebrow The two workspaces
## Every function call gets its own workspace

Start with a name for the thing you have been typing into all along. An **environment** is just a named collection of bindings, each binding tying a name to a value, like `x = 10`. When you assign at the top level, `pass_mark <- 60`, that binding lives in the **global environment**: your workspace, the one `ls()` lists.

Here is the part that makes functions tick. Every time you *call* a function, R opens a brand-new **local environment** just for that call. It holds the function's arguments and any names the body creates, the body runs inside it, and the moment the function returns its value, that local environment is thrown away.

::widget process-flow {"steps":[{"title":"You call grade(58)","sub":"R needs a place to run the body"},{"title":"A fresh local environment opens","sub":"it holds the arguments and any names the body makes"},{"title":"The body runs there","sub":"names are looked up starting in this local environment"},{"title":"The value returns, the environment is discarded","sub":"local names vanish; your workspace is untouched"}]}

You can watch the local environment appear and disappear. The name `note` below is created inside the call, used, and then gone; it never reaches your workspace:

```r
pass_mark <- 60          # a binding in the GLOBAL environment

show_mark <- function() {
  note <- "made inside the call"   # a binding in show_mark's LOCAL environment
  pass_mark                        # the value this call hands back
}

show_mark()
#> [1] 60
exists("note")           # was anything left behind in your workspace?
#> [1] FALSE
```

The function returned `60`, but `note` does not exist afterward. That is the local environment being discarded: what happens inside a call stays inside the call.

=== step === concept
::eyebrow The rule
## How R resolves a name: local first, then outward

Now the central question. Inside `show_mark`, the body used `pass_mark`, a name it never created locally. So how did R find it? By following one rule, every single time.

When R needs the value of a name inside a function, it searches a sequence of environments in order and stops at the very first one that has the name:

\[ E_{\text{local}} \;\rightarrow\; E_{\text{global}} \;\rightarrow\; E_{\text{base}} \]

Here \(E_{\text{local}}\) is the function call's own environment, \(E_{\text{global}}\) is your workspace, and \(E_{\text{base}}\) is where R keeps its built-in functions like `mean`. R looks in \(E_{\text{local}}\) first; if the name is not there it steps outward to \(E_{\text{global}}\), and so on. This is called **lexical scoping**: the search always starts where the function was written.

Strip the rule down to two letters and watch it walk. Below, a global `x` and `y` live in your workspace, and a function `f` makes its own local `y`. Pick a name and see where R finds it: `x` is only global, so the search steps outward; `y` exists locally, so the search stops at once.

::widget scope-chain {"global":{"x":10,"y":20},"local":{"y":99}}

[KEY INSIGHT]
The search is one-directional and stops early: local first, then outward to global, never the reverse. A function can always see your global names, but a global can never see a function's local ones.

=== step === quiz
::eyebrow Check yourself
## Where does R find it?

You have a global `pass_mark <- 60`. A function `grade()` uses `pass_mark` in its body but never creates a local one of its own. When you call `grade(73)`, what value does R use for `pass_mark`?

::quiz {"correct":2,"gate":true,"difficulty":"beginner"}
- Nothing: the call fails with "object 'pass_mark' not found", because a function can only use its own local names ::no A function is not sealed off. When a name is not local, R steps outward and checks the global environment, where pass_mark = 60 lives.
- 60, found by stepping outward from the function to the global environment ::ok Right. pass_mark is not local to grade(), so R follows the rule outward to your workspace and finds 60 there.
- NA, because an undefined local name defaults to missing ::no R does not invent an NA for a missing name. It searches outward, and only if no environment in the chain has the name does it raise an error.

=== step === tryit
::eyebrow Your turn
## Make a local name win

This week's quiz was brutal, so for one function you want to lower the pass mark to 50, without disturbing the school-wide `pass_mark` of 60 that everything else relies on. When a local name and a global of the same name collide, the local one wins and the global is hidden but unchanged: that is **shadowing**. Create a **local** `pass_mark` inside `grade_tough` by filling in the blank, then check.

```r
pass_mark <- 60   # the school-wide pass mark, in your workspace

grade_tough <- function(score) {
  pass_mark <- ____   # a LOCAL pass mark, just for this function
  if (score >= pass_mark) "pass" else "needs help"
}

grade_tough(52)   # 52 should clear the lowered local bar
pass_mark         # the school-wide mark must be unchanged
```
::check {"regex":"pass_mark\\s*<-\\s*50","gate":true,"difficulty":"intermediate","ok":"Exactly. Inside grade_tough the local pass_mark = 50 is found first and wins, so 52 passes. Outside, the global pass_mark is still 60, untouched.","no":"Create the local pass mark with the lowered value: pass_mark <- 50."}
::solution
```r
pass_mark <- 60

grade_tough <- function(score) {
  pass_mark <- 50
  if (score >= pass_mark) "pass" else "needs help"
}

grade_tough(52)
#> [1] "pass"
pass_mark
#> [1] 60
```

=== step === concept
::eyebrow The payoff
## Assigning inside a function leaves your variables alone

That last exercise showed something bigger than a lowered cut-off. Setting `pass_mark` inside `grade_tough` did **not** change the global `pass_mark`. This is the rule's mirror image: R *reads* names by walking outward, but the `<-` assignment always *writes* into the **local** environment. Reading reaches out; writing stays in.

Watch a counter that tries, and fails, to climb:

```r
tally <- 0     # a counter in your workspace

add_one <- function() {
  tally <- tally + 1   # reads the global 0, then writes 1 to a LOCAL tally
  tally                # the call's own copy
}

add_one()   # the local result...
#> [1] 1
add_one()   # ...and again: each call starts fresh from the global 0
#> [1] 1
tally       # your global counter never moved
#> [1] 0
```

Each call reads the global `tally` (0), adds one in its own local environment, and returns 1. The global never changes, which is why calling `add_one()` a hundred times would still leave `tally` at 0.

[KEY INSIGHT]
`<-` inside a function writes locally, always. A function can read your workspace but cannot silently rewrite it. That isolation is exactly why you can drop a function into any script and trust it not to clobber your data.

=== step === quiz
::eyebrow Check yourself
## Did the global move?

Using that same `tally <- 0` and `add_one` (which runs `tally <- tally + 1` inside), you call `add_one()` three times in a row. Afterward you type `tally` at the top level. What prints?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- 0, because each call wrote to its own local tally and the global was only ever read ::ok Right. The inner `<-` writes locally every time, so the global tally is read but never changed: it stays 0.
- 3, because the three calls accumulated into the global counter ::no That is the trap. The inner assignment never touches the global; each call makes a separate local tally and throws it away, so nothing accumulates.
- 1, because the function set tally to 1 and that value persisted ::no The 1 lived in a local environment that was discarded when the call returned. The global tally was never assigned, so it is still 0.

=== step === concept
::eyebrow When you really must reach out
## The escape hatch: super-assignment

So how would you make a counter that actually persists? R gives you a deliberate way to break the isolation: the **super-assignment** operator `<<-`. Where `<-` writes locally, `<<-` searches *outward* for an existing binding of that name and assigns there instead, reaching your global workspace if that is where the name lives.

```r
tally <- 0

add_for_real <- function() {
  tally <<- tally + 1   # <<- reaches OUTWARD and updates the global tally
  tally
}

add_for_real()
#> [1] 1
add_for_real()
#> [1] 2
tally                   # this time the global really changed
#> [1] 2
```

Now the count climbs across calls, because every call edits the one global `tally`.

[WARNING]
Reach for `<<-` rarely. A function that quietly rewrites your workspace is one of the hardest kinds of bug to track down, because nothing at the call site shows that it happened. The safe habit is the opposite: have the function **return** a value and reassign it yourself, so the change is visible in your code. Super-assignment has its place (a persistent counter inside a closure, a topic for later), but treat it as a sharp tool, not a default.

=== step === tryit
::eyebrow Put it together
## Update a global the safe way

Here is the habit the warning recommends. Instead of `<<-`, write `bump` so it just **returns** one more than the current `attempts`, then you reassign it yourself at the top level. Inside the function, read the global `attempts` and add one. Fill in the blank.

```r
attempts <- 0   # a global counter

bump <- function() {
  ____          # return one more than the current attempts (read the global)
}

new_count <- bump()      # capture the returned value...
attempts  <- new_count   # ...and reassign the global yourself, in plain sight
c(new_count = new_count, attempts = attempts)
```
::check {"regex":"attempts\\s*\\+\\s*1","gate":true,"difficulty":"intermediate","ok":"That is the safe pattern: bump() reads the global attempts (0), returns 1, and YOU reassign attempts in code where the change is visible, no hidden super-assignment.","no":"Return one more than the global: attempts + 1."}
::solution
```r
attempts <- 0

bump <- function() {
  attempts + 1
}

new_count <- bump()
attempts  <- new_count
c(new_count = new_count, attempts = attempts)
#> new_count  attempts
#>         1         1
```

=== step === concept
::eyebrow Go deeper
## References

A few authoritative, free places to take this further:

- [Advanced R (2e), Environments](https://adv-r.hadley.nz/environments.html) - what an environment really is, the data structure that scoping is built on.
- [Advanced R (2e), Functions: lexical scoping](https://adv-r.hadley.nz/functions.html) - the precise rules R follows to resolve a name, with the edge cases.
- [An Introduction to R: Scope](https://cran.r-project.org/doc/manuals/r-release/R-intro.html) - the official manual on local versus global variables and the `<<-` operator.
- [The R Language Definition: Scope of variables](https://cran.r-project.org/doc/manuals/r-release/R-lang.html) - the canonical specification of environments and how an assignment chooses one.

=== step === complete
## Lesson 5 complete

You now know the rule that ties this whole course together. A function call gets its **own local environment**; R **resolves a name local-first, then outward** to your global workspace (lexical scoping); a local name **shadows** a global of the same name while leaving that global untouched; and because `<-` always writes locally, a function can read your variables but never silently overwrite them, the isolation that makes functions safe to reuse. When you truly must reach out, `<<-` does it on purpose, and you saw why to prefer returning a value instead.

That is the programming core of R: you can write functions, give them flexible arguments, chain them with the pipe, and reason about exactly where their names live. From here the natural next step is getting data **into** R and reshaping it, where every one of these habits pays off.
