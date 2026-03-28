# RStudio in 15 Minutes: The Only IDE Tour You'll Ever Need

Master RStudio's four panes, the most-used keyboard shortcuts, and the settings that make a real difference — without wading through features you'll never touch.

## What Is RStudio?

RStudio is the most popular IDE (integrated development environment) for R. It gives you a code editor, console, file browser, plot viewer, help system, and debugger — all in one window. Think of it as mission control for your R work.

RStudio is made by Posit (formerly RStudio, Inc.). The desktop version is free and open source. You can also run RStudio in a browser via Posit Cloud or RStudio Server.

## The Four Panes

When you open RStudio, you see four rectangular areas (panes). Each pane has a specific job. Here's the layout:

| Position | Pane | Purpose |
|----------|------|---------|
| Top-left | Source Editor | Write and edit R scripts |
| Bottom-left | Console | Run code interactively, see output |
| Top-right | Environment / History | View variables, command history |
| Bottom-right | Files / Plots / Packages / Help | Browse files, view plots, get help |

You can resize any pane by dragging its border. You can also rearrange them in Tools > Global Options > Pane Layout.

### Pane 1: Source Editor (Top-Left)

This is where you write R scripts. Key features:

- **Syntax highlighting** — R code is color-coded automatically
- **Code completion** — Press Tab to auto-complete function names and arguments
- **Line numbers** — Every line is numbered for easy reference
- **Multiple tabs** — Open several scripts at once
- **Run button** — Execute the current line or selection

The Source Editor is where you spend most of your time. You write code here, then send it to the Console to run.

Try typing this in the code block below — it simulates writing in the Source Editor and sending code to the Console:

```r
# This is like writing in the Source Editor
# Each line runs in order, like a script

greeting <- "Hello from the Source Editor!"
cat(greeting, "\n")

# Define a function
square <- function(x) x^2

# Use it
cat("5 squared =", square(5), "\n")
cat("12 squared =", square(12), "\n")
```

### Pane 2: Console (Bottom-Left)

The Console is R's interactive command line. Type a command, press Enter, and see the result instantly. It is ideal for quick experiments and testing.

Key behaviors:

- **The `>` prompt** means R is ready for input
- **The `+` prompt** means R is waiting for you to finish an incomplete command (missing a closing parenthesis or bracket)
- **Press Escape** to cancel a running command or clear an incomplete one
- **Up/Down arrows** scroll through your command history

```r
# Console-style interactive work
# Type each line and see the result immediately

2 + 2

sqrt(144)

pi

nchar("How long is this string?")
```

The difference between the Source Editor and Console:
- **Source Editor:** Write scripts you want to keep. Save as `.R` files.
- **Console:** Quick experiments. Nothing is saved automatically.

### Pane 3: Environment and History (Top-Right)

The Environment tab shows every variable currently in memory. It displays the variable name, type, and value (or a preview for large objects).

```r
# Run this block — then check the Environment pane in your local RStudio
name <- "Alice"
age <- 29
scores <- c(88, 92, 76, 95, 81)
df <- data.frame(
  x = 1:5,
  y = c(2.1, 4.3, 5.8, 8.2, 9.9)
)

# List all variables (this is what the Environment pane shows)
cat("Variables in memory:\n")
ls()
```

```r
# Check the structure of each variable
cat("name:", name, "(", class(name), ")\n")
cat("age:", age, "(", class(age), ")\n")
cat("scores:", scores, "(", class(scores), ")\n")
cat("\nData frame:\n")
str(df)
```

The **History tab** (next to Environment) records every command you've run in the Console. You can search it, and double-click any entry to re-run it.

**Tip:** Click the broom icon in the Environment tab to clear all variables. This is useful when you want a fresh start.

### Pane 4: Files, Plots, Packages, Help (Bottom-Right)

This pane has five tabs:

**Files tab:** A file browser. Navigate your project folder, open scripts, rename files, and create new folders — all without leaving RStudio.

**Plots tab:** Displays every plot you create. Use the arrows to scroll through past plots. Click "Export" to save as PNG, PDF, or copy to clipboard.

```r
# This will appear in the Plots tab
plot(1:20, (1:20)^2,
     type = "b", pch = 19, col = "steelblue",
     main = "Quadratic Growth",
     xlab = "x", ylab = "x squared")
```

**Packages tab:** Shows all installed packages. Check the box to load a package, or click "Install" to add new ones.

```r
# See which packages you have
pkgs <- installed.packages()
cat("Total installed packages:", nrow(pkgs), "\n\n")

# Show the first 10 alphabetically
first_10 <- sort(rownames(pkgs))[1:10]
cat("First 10 packages:\n")
for (pkg in first_10) {
  cat(" ", pkg, "\n")
}
```

**Help tab:** R's built-in documentation appears here. Type `?function_name` in the Console to look up any function:

```r
# These commands open help in the Help tab
# In your local RStudio, try:
#   ?mean
#   ?read.csv
#   ?plot

# We can still show help content here:
cat("How to get help in R:\n\n")
cat("  ?mean          — Help for the mean() function\n")
cat("  ??regression   — Search all help for 'regression'\n")
cat("  help(package='stats') — List all functions in a package\n")
cat("  example(plot)  — Run built-in examples for plot()\n")
```

**Viewer tab:** Displays HTML output, Shiny app previews, and R Markdown rendered documents.

## Essential Keyboard Shortcuts

These shortcuts will save you hours. Memorize the top 5, then add more as needed.

### The Top 10 Shortcuts

| Shortcut (Windows/Linux) | Shortcut (Mac) | Action |
|--------------------------|----------------|--------|
| Ctrl + Enter | Cmd + Enter | Run current line / selection |
| Ctrl + Shift + Enter | Cmd + Shift + Enter | Run entire script |
| Ctrl + 1 | Cmd + 1 | Move cursor to Source Editor |
| Ctrl + 2 | Cmd + 2 | Move cursor to Console |
| Ctrl + Shift + N | Cmd + Shift + N | New R script |
| Ctrl + S | Cmd + S | Save current file |
| Ctrl + Z | Cmd + Z | Undo |
| Ctrl + Shift + C | Cmd + Shift + C | Comment/uncomment selection |
| Tab | Tab | Auto-complete |
| Ctrl + Shift + M | Cmd + Shift + M | Insert pipe operator |

### Code Navigation Shortcuts

| Shortcut (Windows/Linux) | Shortcut (Mac) | Action |
|--------------------------|----------------|--------|
| Ctrl + Shift + F | Cmd + Shift + F | Find in files |
| Ctrl + . | Cmd + . | Go to file/function |
| Alt + Up/Down | Option + Up/Down | Move line up/down |
| Ctrl + Shift + D | Cmd + Shift + D | Duplicate current line |
| Ctrl + D | Cmd + D | Delete current line |
| Ctrl + I | Cmd + I | Re-indent selection |
| Ctrl + Shift + A | Cmd + Shift + A | Reformat code |

### Console Shortcuts

| Shortcut | Action |
|----------|--------|
| Up arrow | Previous command |
| Ctrl + Up | Search command history |
| Ctrl + L | Clear console |
| Escape | Cancel current command |

Let's practice the most important one — running code line by line:

```r
# In RStudio: place your cursor on line 1, press Ctrl+Enter
# It runs that line and moves to the next
x <- 10
y <- 20
z <- x + y
cat("Result:", z, "\n")

# Select multiple lines and press Ctrl+Enter to run them all at once
a <- 100
b <- 200
cat("Sum:", a + b, "\n")
```

## Console vs Script: When to Use Each

```r
# CONSOLE: Use for quick, throwaway calculations
# (Just type directly into the Console)
#   > 2 + 2
#   > nrow(mtcars)
#   > ?read.csv

# SCRIPT: Use for anything you want to keep
# (Write in Source Editor, save as .R file)

# Example script structure:
cat("# load-and-analyze.R\n")
cat("# -------------------\n")
cat("# 1. Load data\n")
cat("data(mtcars)\n\n")
cat("# 2. Clean and transform\n")
cat("mtcars$efficiency <- ifelse(mtcars$mpg > 20, 'High', 'Low')\n\n")
cat("# 3. Analyze\n")
cat("table(mtcars$efficiency)\n\n")
cat("# 4. Visualize\n")
cat("barplot(table(mtcars$efficiency))\n")
```

## RStudio Projects: Organize Your Work

RStudio Projects keep your files, data, and settings organized. Each project has its own working directory, history, and open files.

### How to Create a Project

1. Go to **File > New Project**
2. Choose **New Directory > New Project**
3. Name it and pick a location
4. Click **Create Project**

RStudio creates a `.Rproj` file in the folder. Double-click it anytime to open the project with all your files and settings restored.

### Why Projects Matter

- **Relative paths work:** `read.csv("data/sales.csv")` finds the file relative to the project root — no more `setwd()` headaches
- **Separate workspaces:** Each project has its own environment and history
- **Version control:** Projects integrate with Git for tracking changes

```r
# Without projects (fragile):
cat('setwd("C:/Users/alice/Documents/analysis_v3_final")\n')
cat('data <- read.csv("C:/Users/alice/Documents/analysis_v3_final/data/sales.csv")\n\n')

# With projects (portable):
cat('# Working directory is already set to project root\n')
cat('data <- read.csv("data/sales.csv")\n')
```

## Code Completion and Snippets

RStudio's code completion saves typing and prevents typos.

### Auto-Complete

Type the first few letters of a function name and press **Tab**. RStudio shows a dropdown of matching functions with descriptions.

```r
# Try these in your local RStudio:
# Type "rea" then Tab → suggests read.csv, read.table, readLines, etc.
# Type "sub" then Tab → suggests subset, substitute, substr, etc.

# Inside a function, Tab shows argument names:
# Type "plot(x, y, ma" then Tab → suggests main, mar, etc.

# Demo: auto-complete helps you discover functions
cat("Functions starting with 'is.':\n")
is_functions <- ls("package:base", pattern = "^is\\.")
cat(head(is_functions, 10), sep = "\n")
```

### Code Snippets

Type a keyword and press **Shift + Tab** to expand a code snippet:

| Snippet | Expands To |
|---------|-----------|
| `fun` | `name <- function(variables) { }` |
| `for` | `for (variable in vector) { }` |
| `if` | `if (condition) { }` |
| `el` | `else { }` |
| `while` | `while (condition) { }` |
| `lib` | `library(package)` |
| `mat` | `matrix(data, nrow = , ncol = )` |
| `apply` | `apply(X, MARGIN, FUN)` |

## The Global Environment

The Environment pane shows your current workspace — all variables, functions, and data frames in memory. Understanding it prevents common confusion.

```r
# Create some objects
x <- 42
my_name <- "RStudio User"
nums <- 1:100
my_func <- function(a, b) a + b

# What's in the environment?
cat("Objects in your environment:\n")
env_objects <- ls()
for (obj in env_objects) {
  val <- get(obj)
  cat("  ", obj, "- class:", class(val), "\n")
}
```

```r
# Remove a specific variable
rm(x)
cat("After removing x:\n")
cat("Objects:", paste(ls(), collapse = ", "), "\n\n")

# Clear everything (like clicking the broom icon)
rm(list = ls())
cat("After clearing all:\n")
cat("Objects:", length(ls()), "\n")
```

## Customizing RStudio's Appearance

### Change the Theme

Go to **Tools > Global Options > Appearance**. Pick a theme that's easy on your eyes. Popular choices:

| Theme | Type | Good For |
|-------|------|----------|
| Textmate (default) | Light | Daytime work |
| Cobalt | Dark | Late-night coding |
| Dracula | Dark | Popular among developers |
| Solarized Dark | Dark | Low contrast, easy on eyes |
| Tomorrow Night | Dark | Clean and minimal |

### Font Size

In the same Appearance settings, set your font size to 12-14pt for comfortable reading. On high-DPI screens (4K monitors), go up to 16pt.

### Pane Layout

Go to **Tools > Global Options > Pane Layout** to rearrange the four panes. Some programmers prefer the Console on the right or the Source Editor at full width on top.

## Practice Exercises

### Exercise 1: Variable Inspector

Create 5 variables of different types (numeric, character, logical, vector, data frame) and use `ls()` and `class()` to inspect them.

```r
# Your code here
```

<details><summary>Solution</summary>

```r
age <- 30
name <- "Bob"
active <- TRUE
scores <- c(88, 92, 76)
info <- data.frame(item = c("a", "b"), value = c(1, 2))

for (obj_name in ls()) {
  obj <- get(obj_name)
  cat(obj_name, ":", class(obj), "\n")
}
```

</details>

### Exercise 2: Console Math

Calculate the area of a circle with radius 7, the hypotenuse of a right triangle with sides 3 and 4, and 2 to the power of 10. Print all three results.

```r
# Your code here
```

<details><summary>Solution</summary>

```r
area <- pi * 7^2
hypotenuse <- sqrt(3^2 + 4^2)
power <- 2^10

cat("Circle area (r=7):", round(area, 2), "\n")
cat("Hypotenuse (3,4):", hypotenuse, "\n")
cat("2^10:", power, "\n")
```

</details>

### Exercise 3: Help System

Look up the `seq()` function using R's help system, then use it to create a sequence from 0 to 1 in steps of 0.1.

```r
# Your code here
```

<details><summary>Solution</summary>

```r
# In RStudio, type ?seq to read the help page
# Then use what you learned:
my_seq <- seq(from = 0, to = 1, by = 0.1)
cat("Sequence:", my_seq, "\n")
cat("Length:", length(my_seq), "\n")
```

</details>

### Exercise 4: Simple Plot

Create a bar chart showing the number of cars with 4, 6, and 8 cylinders in the `mtcars` dataset.

```r
# Your code here
```

<details><summary>Solution</summary>

```r
cyl_counts <- table(mtcars$cyl)
barplot(cyl_counts,
        main = "Cars by Number of Cylinders",
        xlab = "Cylinders", ylab = "Count",
        col = c("#4ECDC4", "#FFD93D", "#FF6B6B"))
```

</details>

## FAQ

### Can I use RStudio without R installed?

No. RStudio is just an interface — it needs R installed on your system to run any code. Install R first, then RStudio.

### Is there a dark mode?

Yes. Go to Tools > Global Options > Appearance and choose any dark theme (Cobalt, Dracula, Tomorrow Night, etc.). The editor, console, and all panes switch to dark colors.

### What is Posit Cloud?

Posit Cloud (formerly RStudio Cloud) is RStudio in your web browser. No installation needed. It is free for light use, with paid plans for more compute time and memory. Great for classrooms and quick experiments.

### Should I use RStudio or VS Code for R?

RStudio is purpose-built for R and works better out of the box. VS Code with the R extension is a good alternative if you already use VS Code for other languages. For R-only work, RStudio is the stronger choice.

### How do I update RStudio?

Go to Help > Check for Updates. RStudio will tell you if a newer version is available and link you to the download page. Updates are safe — your settings and projects are preserved.

## What's Next?

You know your way around RStudio. Time to write real R code:

- **Next:** R Syntax 101: Write Your First Working Script in 10 Minutes
- **Then:** R Data Types Explained
- **After that:** R Data Frames: Create, Access, and Manipulate
