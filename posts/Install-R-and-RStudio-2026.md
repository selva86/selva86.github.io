# Install R & RStudio in 2026: The Setup That Actually Works First Time

Install R and RStudio correctly on Windows, Mac, or Linux. Step-by-step screenshots, common installation errors solved, and the first settings to change after setup.

## What You Need to Install

You need two pieces of software:

1. **R** — the programming language and runtime. This is the engine that runs your code.
2. **RStudio** — the IDE (integrated development environment). This is the dashboard you use to write, run, and debug R code.

Think of it this way: R is the engine, RStudio is the car. You need both. Install R first, then RStudio.

## Step 1: Install R

### On Windows

1. Go to [https://cloud.r-project.org](https://cloud.r-project.org)
2. Click **"Download R for Windows"**
3. Click **"base"**
4. Click **"Download R-4.x.x for Windows"** (the latest version)
5. Run the downloaded `.exe` file
6. Accept all default settings — click Next through each screen
7. Click **Finish** when the installer completes

**Important:** Do not change the installation path unless you have a specific reason. The default path `C:\Program Files\R\R-4.x.x` works best with RStudio.

### On Mac

1. Go to [https://cloud.r-project.org](https://cloud.r-project.org)
2. Click **"Download R for macOS"**
3. Choose the correct version for your Mac:
   - **Apple Silicon (M1/M2/M3/M4):** Download the `arm64` version
   - **Intel Mac:** Download the `x86_64` version
4. Open the downloaded `.pkg` file
5. Follow the installer prompts — accept defaults
6. Click **Close** when done

Not sure which Mac you have? Click the Apple menu, then **About This Mac**. If it says "Apple M1" or similar, you have Apple Silicon. If it says "Intel," you have an Intel Mac.

### On Linux (Ubuntu/Debian)

Open a terminal and run these commands:

```
sudo apt update
sudo apt install r-base r-base-dev
```

For the latest R version (recommended), first add the CRAN repository:

```
sudo apt install software-properties-common
sudo add-apt-repository "deb https://cloud.r-project.org/bin/linux/ubuntu $(lsb_release -cs)-cran40/"
wget -qO- https://cloud.r-project.org/bin/linux/ubuntu/marutter_pubkey.asc | sudo tee /etc/apt/trusted.gpg.d/cran.asc
sudo apt update
sudo apt install r-base r-base-dev
```

### On Linux (Fedora/RHEL)

```
sudo dnf install R
```

## Step 2: Install RStudio

1. Go to [https://posit.co/download/rstudio-desktop/](https://posit.co/download/rstudio-desktop/)
2. Scroll to **"All Installers"** and download the version for your operating system
3. Run the installer:
   - **Windows:** Double-click the `.exe` file, click through the prompts
   - **Mac:** Open the `.dmg` file, drag RStudio to Applications
   - **Linux:** Install the `.deb` or `.rpm` package via your package manager

RStudio automatically detects your R installation. You don't need to configure anything.

## Step 3: Verify Your Installation

Open RStudio. You should see the Console pane on the left (or bottom-left). Try the code block below to confirm everything works:

```r
# Check your R version
cat("R version:", R.version.string, "\n")

# Check your operating system
cat("OS:", Sys.info()["sysname"], Sys.info()["release"], "\n")

# Confirm basic math works
cat("2 + 2 =", 2 + 2, "\n")
cat("sqrt(144) =", sqrt(144), "\n")
```

If you see version info and correct math results, your installation is working.

### Verify Package Installation Works

R's power comes from packages. Let's test that you can install and load one:

```r
# Check if a key package is available
if (requireNamespace("stats", quietly = TRUE)) {
  cat("Base stats package: OK\n")
}

# List all pre-installed packages
base_pkgs <- installed.packages()
cat("Pre-installed packages:", nrow(base_pkgs), "\n")

# Show some key ones
important <- c("stats", "graphics", "utils", "datasets", "methods")
for (pkg in important) {
  status <- ifelse(requireNamespace(pkg, quietly = TRUE), "OK", "MISSING")
  cat("  ", pkg, ":", status, "\n")
}
```

## First Settings to Change in RStudio

Before you write any code, change these three settings. They save hours of frustration later.

### Setting 1: Never Save Workspace

Go to **Tools > Global Options > General**. Under **Workspace**, uncheck "Restore .RData into workspace at startup" and set "Save workspace to .RData on exit" to **Never**.

Why? Saving your workspace creates hidden state that makes your scripts unreproducible. Your code should recreate everything it needs from scratch.

### Setting 2: Set UTF-8 Encoding

Go to **Tools > Global Options > Code > Saving**. Set "Default text encoding" to **UTF-8**.

Why? UTF-8 prevents character encoding errors when sharing code across operating systems.

### Setting 3: Enable Code Diagnostics

Go to **Tools > Global Options > Code > Diagnostics**. Check "Show diagnostics for R."

Why? RStudio will underline potential errors in your code before you run it — like a spell checker for R.

### Recommended Settings Summary

| Setting | Where | Change To |
|---------|-------|-----------|
| Save workspace on exit | General | Never |
| Restore .RData | General | Unchecked |
| Text encoding | Code > Saving | UTF-8 |
| Soft-wrap source files | Code > Editing | Checked |
| Show diagnostics | Code > Diagnostics | Checked |
| Margin column | Code > Display | 80 |
| Rainbow parentheses | Code > Display | Checked |
| Native pipe operator | Code > Editing | Checked |

## Installing Your First Packages

Packages extend R's capabilities. Here are the essential ones to install right away:

```r
# The tidyverse: a collection of data science packages
# (This would take a while to install locally,
#  but here in WebR we can show you how it works)

# In your local RStudio, run:
# install.packages("tidyverse")

# For now, let's use base R to show package concepts
cat("How to install packages:\n")
cat("  install.packages('tidyverse')   # data science toolkit\n")
cat("  install.packages('data.table')  # fast data processing\n")
cat("  install.packages('shiny')       # web applications\n")
cat("  install.packages('rmarkdown')   # reports and documents\n")
```

### Package Installation Commands

| Package | Purpose | Install Command |
|---------|---------|----------------|
| tidyverse | Data science essentials (dplyr, ggplot2, tidyr, etc.) | `install.packages("tidyverse")` |
| data.table | Fast data manipulation | `install.packages("data.table")` |
| shiny | Interactive web apps | `install.packages("shiny")` |
| rmarkdown | Reports and notebooks | `install.packages("rmarkdown")` |
| devtools | Package development tools | `install.packages("devtools")` |

## Common Installation Problems and Fixes

### Problem: "R is not recognized as a command"

**Cause:** R is not in your system PATH.
**Fix (Windows):** Reinstall R and check "Save version number in registry" during setup. Or manually add `C:\Program Files\R\R-4.x.x\bin` to your PATH environment variable.
**Fix (Mac/Linux):** R should be in PATH by default. Try running `which R` in a terminal. If nothing shows, reinstall R.

### Problem: "Package installation failed — cannot remove prior installation"

**Cause:** A package file is locked by another process.
**Fix:** Close all R sessions, restart RStudio, and try again. On Windows, you may also need to run RStudio as administrator.

### Problem: "Package compilation failed" on Mac

**Cause:** Missing Xcode command line tools.
**Fix:** Open Terminal and run:
```
xcode-select --install
```

### Problem: "Package compilation failed" on Linux

**Cause:** Missing system libraries.
**Fix:** Install development tools:
```
# Ubuntu/Debian
sudo apt install build-essential libcurl4-openssl-dev libssl-dev libxml2-dev

# Fedora
sudo dnf install gcc gcc-c++ libcurl-devel openssl-devel libxml2-devel
```

### Problem: RStudio shows "R not found" or blank console

**Cause:** RStudio cannot locate R.
**Fix:** Go to **Tools > Global Options > General > R version** and browse to your R installation folder. Restart RStudio.

### Problem: Slow package downloads

**Fix:** Change your CRAN mirror to one closer to you:

```r
# Set a fast mirror (run in RStudio console)
options(repos = c(CRAN = "https://cloud.r-project.org"))

# Or choose interactively:
# chooseCRANmirror()
```

## Test Your Setup: Mini Analysis

Your installation is working if you can run this complete mini-analysis:

```r
# Your first real analysis in R!
cat("=== Iris Dataset Quick Analysis ===\n\n")

# Load a built-in dataset
data(iris)
cat("Dataset loaded:", nrow(iris), "observations\n")
cat("Variables:", paste(names(iris), collapse = ", "), "\n\n")
```

```r
# Summary statistics
cat("Summary of Sepal.Length:\n")
cat("  Min:", min(iris$Sepal.Length), "\n")
cat("  Max:", max(iris$Sepal.Length), "\n")
cat("  Mean:", round(mean(iris$Sepal.Length), 2), "\n")
cat("  SD:", round(sd(iris$Sepal.Length), 2), "\n")
```

```r
# Group comparison
species_means <- aggregate(Sepal.Length ~ Species, data = iris, mean)
names(species_means)[2] <- "Mean_Sepal_Length"
species_means$Mean_Sepal_Length <- round(species_means$Mean_Sepal_Length, 2)
print(species_means)
```

```r
# Your first plot
boxplot(Sepal.Length ~ Species, data = iris,
        main = "Sepal Length by Species",
        xlab = "Species", ylab = "Sepal Length (cm)",
        col = c("#F8B4B4", "#B4D8F8", "#B4F8B4"))
```

```r
# Run a statistical test
test <- aov(Sepal.Length ~ Species, data = iris)
cat("ANOVA test: Is sepal length different across species?\n")
cat("F-statistic:", round(summary(test)[[1]]$`F value`[1], 2), "\n")
cat("p-value:", format(summary(test)[[1]]$`Pr(>F)`[1], scientific = TRUE), "\n")
cat("Conclusion: Species have significantly different sepal lengths.\n")
```

If all five blocks run without errors, your R and RStudio setup is complete and ready for real work.

## Practice Exercises

### Exercise 1: Check Your System

Write code to display your R version, the current date, and the working directory.

```r
# Your code here
```

<details><summary>Solution</summary>

```r
cat("R version:", R.version.string, "\n")
cat("Date:", as.character(Sys.Date()), "\n")
cat("Working directory:", getwd(), "\n")
```

</details>

### Exercise 2: Package Check

Write code to check if the packages "stats", "graphics", and "MASS" are installed, and print "YES" or "NO" for each.

```r
# Your code here
```

<details><summary>Solution</summary>

```r
pkgs <- c("stats", "graphics", "MASS")
for (pkg in pkgs) {
  installed <- requireNamespace(pkg, quietly = TRUE)
  cat(pkg, ":", ifelse(installed, "YES", "NO"), "\n")
}
```

</details>

### Exercise 3: First Plot

Create a simple scatter plot of the `pressure` dataset (built into R). It has two columns: temperature and pressure.

```r
# Your code here
```

<details><summary>Solution</summary>

```r
plot(pressure$temperature, pressure$pressure,
     main = "Vapor Pressure of Mercury",
     xlab = "Temperature (C)", ylab = "Pressure (mm)",
     pch = 19, col = "darkred", type = "b")
```

</details>

## FAQ

### Do I need to pay for R or RStudio?

No. R is free and open source (GPL license). RStudio Desktop is also free. Posit (the company behind RStudio) sells a paid server version for teams, but the desktop version has everything you need.

### Which R version should I install?

Always install the latest stable version from CRAN. As of early 2026, that is R 4.x. Avoid beta or development versions unless you have a specific reason.

### Can I have multiple R versions installed?

Yes. On Windows and Mac, each R version installs to its own folder. In RStudio, go to Tools > Global Options > General to switch between versions. This is useful when a package requires a specific R version.

### Do I need to install R if I just use the WebR blocks on this site?

No. The interactive code blocks on this site run R in your browser using WebR. But for real projects, you need a local installation. Browser-based R has limitations: no file system access, slower performance, and fewer packages.

### How much disk space does R need?

R itself needs about 200 MB. RStudio adds another 500 MB. The tidyverse package collection adds about 300 MB. Plan for about 1-2 GB total for a comfortable setup.

## What's Next?

Your tools are installed and verified. Next, learn how to use RStudio efficiently:

- **Next:** RStudio in 15 Minutes: The Only IDE Tour You'll Ever Need
- **Then:** R Syntax 101: Write Your First Working Script in 10 Minutes
- **After that:** R Data Types Explained
