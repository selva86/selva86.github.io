---
title: "Install R & RStudio in 2026: The Setup That Actually Works First Time"
slug: "Install-R-and-RStudio-2026"
description: "Step-by-step R and RStudio installation for Windows, Mac, and Linux. First-run settings, common errors fixed, and a verify-it-works checklist."
keywords: "install R, install RStudio, R installation, download R, RStudio setup, R Windows, R Mac, R Linux"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "1.1.2"
post_type: "C"
auto_link_terms: "install R|install RStudio|R installation"
auto_link_case_sensitive: false
sidebar_section: "Learn R"
sidebar_title: "Install R & RStudio"
sidebar_order: 2
difficulty: "Beginner"
---

# Install R & RStudio in 2026: The Setup That Actually Works First Time

<p class="lead">To use R, you install two things: R itself (the language engine) and RStudio (the editor you'll actually work in). R does the computing; RStudio makes it comfortable. Both are free and take about 5 minutes total.</p>

Most installation guides show you where to click but skip the settings that save you hours later. This guide covers the full setup, installation, verification, first-run settings, and the most common errors with their fixes, for Windows, Mac, and Linux.

## Introduction

**R** is the programming language, the engine that runs your code. **RStudio** is an IDE (Integrated Development Environment), the dashboard where you write, run, and debug that code. You need both, and you must install R first because RStudio depends on it.

Think of it like this: R is the car engine, RStudio is the cockpit with the steering wheel, dashboard, and GPS. You wouldn't drive an engine without a cockpit, and you wouldn't use R without RStudio.

Here's the plan:

1. Install R (the engine)
2. Install RStudio (the cockpit)
3. Verify everything works
4. Configure first-run settings
5. Install your first package

By the end, you'll have a fully working R development environment and will have run your first R code.

## Prerequisites

Before installing, make sure your system meets these minimum requirements:

| Requirement | Windows | Mac | Linux (Ubuntu) |
|------------|---------|-----|----------------|
| OS version | Windows 10+ | macOS 12 (Monterey)+ | Ubuntu 20.04+ |
| Disk space | ~500 MB (R) + ~500 MB (RStudio) | ~500 MB + ~500 MB | ~500 MB + ~500 MB |
| RAM | 4 GB minimum, 8 GB recommended | 4 GB minimum, 8 GB recommended | 4 GB minimum, 8 GB recommended |
| Admin rights | Yes (for installation) | Yes (password required) | Yes (sudo access) |

> **Already have R installed?** If you have an older version, you can install the new version alongside it. The installer won't break your existing setup. After installing, RStudio will automatically use the newest version.

## Step 1: Install R

R is distributed through **CRAN** (the Comprehensive R Archive Network). Here's how to install it on each operating system.

### Windows

1. Go to the CRAN download page: **https://cran.r-project.org/**
2. Click **"Download R for Windows"**
3. Click **"base"** (this is the standard installation)
4. Click **"Download R-4.x.x for Windows"** (the version number will be the latest)
5. Run the downloaded `.exe` file
6. In the installer wizard:
   - Accept the default installation directory (`C:\Program Files\R\R-4.x.x`)
   - Accept the default components (all checked)
   - Choose **"No"** when asked about customizing startup options (the defaults are fine)
   - Click **"Next"** through the remaining screens and **"Finish"**

**That's it.** R is now installed. You'll see an "R" icon in your Start Menu, but you won't use it directly, you'll use RStudio instead.

### Mac

1. Go to **https://cran.r-project.org/**
2. Click **"Download R for macOS"**
3. Under "Latest release:", click the `.pkg` file that matches your Mac:
   - **Apple Silicon (M1/M2/M3/M4):** Download the `arm64` version
   - **Intel Mac:** Download the `x86_64` version
   - Not sure which you have? Click the Apple menu → **"About This Mac"** → look for "Chip" (Apple M-series) or "Processor" (Intel)
4. Open the downloaded `.pkg` file
5. Follow the installation wizard, you'll need to enter your Mac password
6. Click **"Install"** and then **"Close"** when finished

### Linux (Ubuntu/Debian)

Open a terminal and run these commands:

```
# Update package list
sudo apt update

# Install R
sudo apt install r-base r-base-dev -y

# Verify installation
R --version
```

For the **latest R version** (Ubuntu's default repos may be a version behind), add the official CRAN repository first:

```
# Add the CRAN GPG key
wget -qO- https://cloud.r-project.org/bin/linux/ubuntu/marutter_pubkey.asc | sudo tee /etc/apt/trusted.gpg.d/cran_ubuntu_key.asc

# Add the CRAN repository (replace "jammy" with your Ubuntu release codename)
sudo add-apt-repository "deb https://cloud.r-project.org/bin/linux/ubuntu $(lsb_release -cs)-cran40/"

# Update and install
sudo apt update
sudo apt install r-base r-base-dev -y
```

## Step 2: Install RStudio

Now that R is installed, install RStudio, the IDE you'll actually use every day.

### Windows

1. Go to **https://posit.co/download/rstudio-desktop/**
2. The page auto-detects your OS. Click the big blue **"Download RStudio"** button
3. Run the downloaded `.exe` file
4. Accept all defaults in the installer, click **"Next"** through everything and **"Finish"**
5. Open RStudio from the Start Menu

### Mac

1. Go to **https://posit.co/download/rstudio-desktop/**
2. Click **"Download RStudio"**, it'll download a `.dmg` file
3. Open the `.dmg` file
4. Drag the **RStudio icon** into the **Applications** folder
5. Open RStudio from the Applications folder or Launchpad

> **Mac security warning:** If you get a "cannot be opened because the developer cannot be verified" message, go to **System Preferences → Privacy & Security** and click **"Open Anyway"** next to the RStudio message.

### Linux (Ubuntu/Debian)

```
# Download the latest .deb package (check posit.co for the current URL)
wget https://download1.rstudio.org/electron/jammy/amd64/rstudio-2024.12.1-563-amd64.deb

# Install it
sudo dpkg -i rstudio-*.deb

# Fix any missing dependencies
sudo apt install -f -y
```

Then open RStudio from your application menu.

## Step 3: Verify It Works

Open RStudio. You should see four panels:

1. **Console** (bottom-left), where R code runs
2. **Source** (top-left), where you write scripts (may be hidden until you open a file)
3. **Environment** (top-right), shows your variables and data
4. **Files/Plots/Help** (bottom-right), file browser, plot viewer, help docs

If you see these panels, RStudio found R automatically. Let's verify by running code.

Click in the **Console** panel (bottom-left), type the following line, and press **Enter**:

```
R.version.string
```

You should see something like: `"R version 4.4.2 (2024-10-31)"`. If you see a version number, R is installed correctly.

Now try this longer test, you can run it right here in your browser to see what the output should look like, then compare it with what you get in your local RStudio:

```r title="Verify R install with quick tests"
# Test 1: Basic math
cat("2 + 2 =", 2 + 2, "\n")

# Test 2: Create a variable
my_name <- "R Learner"
cat("Hello,", my_name, "! R is working.\n")

# Test 3: Built-in dataset
cat("mtcars has", nrow(mtcars), "rows and", ncol(mtcars), "columns\n")

# Test 4: Basic statistics
cat("Average MPG of cars:", round(mean(mtcars$mpg), 1), "\n")

# Test 5: Your R version
cat("R version:", R.version.string, "\n")
```

If all five tests print output without errors, your installation is perfect. Click **Run** above to see the expected output, then try the same code in your local RStudio console.

## Step 4: First Settings to Change

RStudio's default settings are mostly fine, but there are three changes that will save you headaches later. Go to **Tools → Global Options** in RStudio:

### 4.1. Turn Off Workspace Saving

Go to **General → Basic** and change these:

- **"Restore .RData into workspace at startup"** → Uncheck this
- **"Save workspace to .RData on exit"** → Set to **"Never"**

**Why?** Old variables lingering from previous sessions cause hard-to-find bugs. You want every session to start clean. If you need data to persist, save it explicitly with `saveRDS()`.

### 4.2. Set Your CRAN Mirror

Go to **Packages** and click **"Change"** next to the CRAN mirror. Choose a mirror close to your location:

- **US:** any US mirror, or "0-Cloud" (which auto-selects the closest)
- **Europe:** your country's mirror
- **Asia:** Japan or Australia mirrors tend to be fast

This controls where R downloads packages from. A closer mirror means faster downloads.

### 4.3. Pick a Theme (Optional but Nice)

Go to **Appearance** and try different **Editor themes**. Popular choices:

- **Tomorrow Night**, dark theme, easy on the eyes
- **Solarized Dark**, warm tones, popular with developers
- **Textmate**, classic light theme

Also increase the **font size** if the default (10pt) feels small. Most people settle on 12-14pt.

## Step 5: Install Your First Package

Packages extend R's capabilities. The tidyverse is the most important collection of packages for data science, let's install it to verify your package system works.

In RStudio's Console, type:

```
install.packages("tidyverse")
```

This will take 1-3 minutes (it downloads and compiles several packages). You'll see lots of text scrolling, that's normal. When you see the `>` prompt again, it's done.

Now verify it works. You can run this code in your local RStudio, or try it here first to see the expected output:

```r title="Use dplyr to summarise mtcars"
# Load the tidyverse
library(dplyr)
library(ggplot2)

# Quick data manipulation
mtcars |>
  group_by(cyl) |>
  summarise(avg_mpg = round(mean(mpg), 1))
```

If you see a table with average MPG grouped by cylinder count, your package installation is working perfectly.

Now try creating a plot:

```r title="Your first ggplot2 scatter plot"
library(ggplot2)

# Your first ggplot2 visualization
ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point(color = "steelblue", size = 3) +
  geom_smooth(method = "lm", se = TRUE, color = "tomato") +
  labs(title = "Your First R Plot!",
       subtitle = "Car weight vs fuel efficiency",
       x = "Weight (1000 lbs)",
       y = "Miles per Gallon") +
  theme_minimal()
```

In your local RStudio, this plot will appear in the **Plots** panel (bottom-right). Click **"Export"** to save it as an image. Congratulations, you just created a publication-quality visualization.

## Common Installation Errors (and How to Fix Them)

### "R is not recognized as a command"

**Problem:** You installed R but the terminal can't find it.

**Fix (Windows):** Add R to your PATH. Search for "Environment Variables" in Windows Settings, edit the PATH variable, and add `C:\Program Files\R\R-4.x.x\bin`. Or simply use RStudio, it finds R automatically.

**Fix (Mac/Linux):** Run `which R` in the terminal. If nothing shows, R didn't install to the expected location. Reinstall using the steps above.

### "RStudio: Unable to locate R"

**Problem:** RStudio can't find your R installation.

**Fix:** RStudio looks for R in standard locations. If you installed R to a custom path, tell RStudio where to find it: **Tools → Global Options → General → R version → Change** and browse to your R installation.

### "Package installation failed: non-zero exit status"

**Problem:** A package failed to compile from source.

**Fix (Windows):** Install **Rtools** from https://cran.r-project.org/bin/windows/Rtools/. Rtools provides the compiler that some packages need.

**Fix (Mac):** Install Xcode Command Line Tools: open Terminal and run `xcode-select --install`.

**Fix (Linux):** Install development libraries: `sudo apt install build-essential libcurl4-openssl-dev libssl-dev libxml2-dev`.

### "Warning: package was built under R version X.X.X"

**Problem:** A package was built for a different R version.

**Fix:** This is usually just a warning, not an error. The package will still work. To get rid of it, update the package: `install.packages("package_name")`.

### "Cannot open connection" or "cannot open URL"

**Problem:** R can't reach the internet to download packages.

**Fix:** Check your internet connection. If you're behind a corporate firewall or VPN, try changing your CRAN mirror: `options(repos = "https://cloud.r-project.org/")` then retry the install.

### Permission denied errors (Linux)

**Problem:** You can't install packages to the system library.

**Fix:** Don't use `sudo` for package installation. Instead, R will ask to create a personal library, say **"yes"**. Packages will install to `~/R/` and work fine.

## Alternative: Positron IDE

In 2025, Posit (the company behind RStudio) released **Positron**, a new IDE built on VS Code's architecture. It supports both R and Python in one editor.

**Should you use Positron instead of RStudio?**

- If you're a **beginner** → stick with **RStudio**. It's more mature, better documented, and all R tutorials assume you're using it.
- If you're **experienced** and already use VS Code → try **Positron**. It feels familiar and handles polyglot (R + Python) workflows well.
- If you just want to **get started fast** → **RStudio** is the safe choice.

We cover Positron vs RStudio in detail in a later tutorial. For now, RStudio is the recommended starting point.

## Summary

Here's your complete setup checklist:

| Step | What to Do | Time |
|------|-----------|------|
| 1. Install R | Download from cran.r-project.org, run installer | 2 min |
| 2. Install RStudio | Download from posit.co/download, run installer | 2 min |
| 3. Open RStudio | Verify 4-panel layout, run `R.version.string` | 1 min |
| 4. Change settings | Turn off workspace save, set CRAN mirror | 2 min |
| 5. Install tidyverse | Run `install.packages("tidyverse")` in Console | 2-3 min |
| 6. Verify | Run `library(dplyr)` and `library(ggplot2)`, no errors | 30 sec |

**Total time: ~10 minutes.** You're ready to start coding in R.

## FAQ

### Do I need to install R if I only want RStudio?

Yes. RStudio is just an editor, it doesn't include R itself. You must install R first (from CRAN), then install RStudio. RStudio will automatically detect and use your R installation.

### Can I have multiple versions of R installed?

Yes. On Windows and Mac, each R version installs to its own folder. In RStudio, go to **Tools → Global Options → General → R version** to switch between them. This is useful when a project requires a specific R version.

### How do I update R to a new version?

Download and install the new version from CRAN, it installs alongside the old one. Then reinstall your packages. On Windows, the `installr` package can automate this: `installr::updateR()`.

### Is RStudio really free?

Yes. RStudio Desktop (the open-source edition) is completely free and always will be. Posit (the company) makes money from RStudio Server Pro, Posit Connect, and cloud services, not from the desktop IDE.

### Can I use R without RStudio?

Yes, but you probably shouldn't. You can run R from the command line, or use other editors like VS Code (with the R extension) or Positron. But RStudio is purpose-built for R and provides the best experience for beginners: integrated help, variable explorer, plot viewer, and package manager all in one window.

## Continue Learning

Now that R and RStudio are installed and configured, you're ready to start coding. The next tutorial walks you through the RStudio interface:

1. **RStudio IDE Tour**, learn what each panel does and the shortcuts that speed up your workflow
2. **R Syntax 101**, write your first working R script
3. **R Data Types**, understand the building blocks of every R program

Each tutorial includes interactive code blocks, just like the ones on this page, so you can practice as you learn.
