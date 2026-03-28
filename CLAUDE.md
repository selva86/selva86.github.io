# CLAUDE.md - r-statistics.co Project Guide

## Project Overview

**Site:** [r-statistics.co](http://r-statistics.co) - Educational resource for machine learning and statistical computing in R
**Owner:** Selva Prabhakaran
**Repo:** selva86/selva86.github.io (GitHub Pages)
**Domain:** r-statistics.co (via CNAME)
**License:** Creative Commons BY-NC 3.0

## Architecture

### Current State: Static HTML (no build system)

- **42 tutorial pages** as standalone HTML files in the root directory
- **No static site generator active** - Jekyll metadata exists but is dormant; no `_config.yml`, `_posts/`, `_layouts/`, or `_includes/`
- Original workflow was R Markdown (.rmd) -> knitr/pandoc -> HTML, but .rmd source files are no longer in the repo
- Each HTML page is **self-contained** with the full layout (header, sidebar nav, content, footer, scripts) duplicated in every file
- **No build pipeline, CI/CD, or automation** exists

### Directory Structure

```
/                        # Root: 42 tutorial HTML files + index.html + 404.html
/about/                  # About page (index.html)
/codes/                  # R preprocessing scripts
/css/main.css            # Site styles (450 lines)
/datasets/               # CSV data files used in tutorials (ozone.csv, etc.)
/figures/                # RMarkdown-generated plot PNGs (build artifacts)
/screenshots/            # 226 PNG images - tutorial plots, diagrams, favicon
/www/                    # Frontend assets: Bootstrap 3.3.5, jQuery 1.11.3, highlight.css, toc.js
/www/bootstrap-3.3.5/    # Bootstrap themes (25+ theme CSS files available)
/www/navigation-1.1/     # RMarkdown navigation JS (codefolding, tabsets)
/r/                      # Mostly empty archive directory
```

### Tech Stack

| Component | Details |
|-----------|---------|
| Framework | Static HTML (no SSG) |
| CSS | Bootstrap 3.3.5 + custom `/css/main.css` |
| JS | jQuery 1.11.3, Bootstrap JS, `toc.js` (auto-generates TOC from headers) |
| Math | MathJax (CDN) |
| Fonts | Google Fonts: Inconsolata; body: Helvetica Neue/Roboto/Arial |
| Analytics | Google Analytics (UA-69351797-1) |
| Search | Custom Google site search (`site:http://r-statistics.co`) |
| Hosting | GitHub Pages |

### Page Template Structure

Every HTML page follows this exact layout:
```
<head>: meta tags, favicon, Bootstrap CSS, highlight.css, Google Fonts, inline styles, search JS
<body>:
  .container
    .masthead: site title "r-statistics.co by Selva Prabhakaran", search bar
    .row
      .col-sm-3 #nav: sidebar with .well (nav links), subscribe/chat links, #toc placeholder
      .col-sm-8 #content: tutorial content (headings, code blocks, images, MathJax)
    .footer: copyright, credits
  Scripts: jQuery, Bootstrap JS, toc.js, MathJax, Google Analytics
```

### Navigation Categories (hardcoded in every page sidebar)

1. **Tutorial** - R Tutorial
2. **ggplot2** - 5 pages (intro, advanced, themes, masterlist, cheatsheet)
3. **Foundations** - Linear Regression, Statistical Tests, Missing Values, Outliers, Feature Selection, Model Selection, Logistic Regression
4. **Advanced Regression Models** - 15+ specialized regression types (Ridge, Lasso, Robust, Kernel, Loess, Isotonic, Probit, Ordinal, Multinomial, Beta, Dirichlet, Poisson/NB)
5. **Time Series** - Analysis, Forecasting, Extended Forecasting
6. **High Performance Computing** - Parallel Computing, Code Optimization
7. **Useful Techniques** - Association Mining, MDS, Optimization, InformationValue

### Code Block Format

R code in tutorials uses this HTML pattern:
```html
<div class="sourceCode"><pre><code class="language-r">
# R code here
model <- lm(y ~ x, data = df)
summary(model)
#=> Output shown as comments
</code></pre></div>
```

### File Naming Convention

Tutorial files: `Title-With-Dashes-And-Capitals.html` (e.g., `Linear-Regression.html`, `Logistic-Regression-With-R.html`)

---

## Strategic Roadmap

### Goal 1: Publish Many More Posts & Organize the Site

**Current pain points:**
- Navigation is hardcoded HTML duplicated across all 42 pages - adding a new page requires editing every file
- No templating system - massive duplication
- No categories, tags, or search beyond Google site search
- No sitemap automation, no RSS feed generation

**Recommended migration path:**
1. **Migrate to a static site generator** - Hugo (fast, Go-based) or Quarto (R-native, ideal for R tutorials)
   - Quarto is strongly recommended: it renders .qmd files with live R execution, produces HTML, and has native code block features
   - Alternative: Hugo with custom shortcodes for R code blocks
2. **Create a shared layout template** to eliminate duplication across all pages
3. **Implement taxonomy** - categories, tags, series for tutorials
4. **Add a posts/ directory** with proper front matter (title, date, category, tags, description)
5. **Build a content pipeline**: write in .qmd/.Rmd -> render -> deploy via GitHub Actions

**Content areas to expand:**
- tidyverse ecosystem (dplyr, tidyr, purrr, stringr)
- Shiny app development
- R package development
- Modern ML with tidymodels
- Bayesian statistics with brms/Stan
- Spatial data analysis (sf, terra)
- Text mining / NLP with R
- Bioinformatics with Bioconductor
- Data.table advanced usage
- Database connectivity (DBI, dbplyr)

### Goal 2: Online R Compiler (like pythoncompiler.io for R)

**Concept:** A standalone web app where users can write and execute R code in the browser.

**Architecture options:**

1. **WebR (recommended)** - R compiled to WebAssembly, runs entirely in the browser
   - No server needed for basic R execution
   - Supports 10,000+ CRAN packages via webR package repo
   - Used by Quarto for interactive documents
   - Repo: https://github.com/r-wasm/webr

2. **Server-based approach** - R backend (Plumber API or OpenCPU) with sandboxed execution
   - More powerful (full R capabilities, system libraries)
   - Requires server infrastructure, security sandboxing
   - Higher operational cost

**Key features to build:**
- Code editor with R syntax highlighting (CodeMirror or Monaco)
- Run button with output panel (console + plots)
- Pre-loaded example scripts
- Package installation support
- File upload for datasets
- Shareable code snippets (via URL or gist)
- Multiple tabs/files
- Plot/visualization output panel
- Download results (CSV, PNG, PDF)

**Suggested tech stack:**
- Frontend: React/Next.js or vanilla JS with CodeMirror
- R execution: WebR (client-side) with optional server fallback
- Hosting: Can be a subdomain like `compiler.r-statistics.co` or separate repo

### Goal 3: Interactive R Code Blocks in Posts

**Concept:** Make every R code block in tutorials executable - users click "Run" and see output inline.

**Implementation with WebR:**
1. Add WebR JavaScript to the site
2. Replace static `<pre><code>` blocks with interactive editor widgets
3. Each code block gets: editable code area, "Run" button, output panel, "Reset" button
4. Code blocks can share state (variables from block 1 available in block 2)
5. Pre-load required packages per tutorial

**Implementation steps:**
1. Add `webr.mjs` to the site assets
2. Create a custom JS component `interactive-r-block` that:
   - Renders a CodeMirror editor initialized with the existing code
   - Has Run/Reset buttons
   - Shows console output and plot output below
   - Shares a WebR session across all blocks on the page
3. Convert existing `<pre><code class="language-r">` blocks to use the interactive component
4. Add a toggle: "Static" vs "Interactive" mode (for accessibility/performance)

**Alternative: Quarto + webR extension**
- If migrating to Quarto, the `quarto-webr` extension does this out of the box
- Each code chunk can be made interactive with `{webr-r}` instead of `{r}`
- This is the lowest-effort path if Quarto migration happens first

---

## Development Guidelines

### When Creating New Tutorial Pages

1. Follow the existing naming convention: `Topic-Name-With-R.html`
2. Include all required meta tags (Description, Keywords, Author, Robots)
3. Include the full sidebar navigation (until templating is added)
4. Use `<h2>` for main sections, `<h4>` for subsections (toc.js scans these)
5. Use the established code block HTML format with `class="language-r"`
6. Place images in `/screenshots/` with descriptive filenames
7. Place datasets in `/datasets/`
8. Include MathJax script if page uses mathematical notation

### When Modifying Navigation

- The sidebar nav is duplicated in every HTML file
- Adding/removing a nav item requires editing ALL tutorial pages
- This is the #1 reason to migrate to a templating system

### Code Style in Tutorials

- Use `<-` for assignment (R convention), not `=`
- Show output as `#=>` comments inline
- Include `library()` calls at the top of each tutorial
- Use built-in datasets or datasets from `/datasets/` directory
- Include expected output/plots as screenshots in `/screenshots/`

### Git Workflow

- Repository has 135 commits; commit messages are informal
- Push directly to main branch (GitHub Pages deploys from main)
- No branch protection, no PR workflow currently
- No CI/CD - consider adding GitHub Actions for build/deploy

### Assets & Dependencies

- Bootstrap 3.3.5 is outdated (current: 5.x) - plan upgrade during migration
- jQuery 1.11.3 is outdated - upgrade when moving off Bootstrap 3
- Google Fonts loaded via HTTP (not HTTPS) - should be updated
- Google Analytics uses legacy UA tracking - should migrate to GA4

---

## Build System (NEW)

### How It Works

A lightweight Python-based templating system for creating new posts:

```
_build/template.html   # Shared page template with {{TITLE}}, {{CONTENT}}, {{MATHJAX}}, {{DESCRIPTION}}, {{KEYWORDS}} placeholders
_build/build.py        # Build script (zero dependencies, Python 3 stdlib only)
_posts/                # Source files for new posts (HTML fragments with front matter)
```

### Creating a New Post

1. Create `_posts/Your-Post-Name.html` with this format:
```html
---
title: Your Post Title
description: SEO description for meta tag
keywords: comma, separated, keywords
mathjax: true
---
<h1>Your Post Title</h1>
<blockquote><p>Intro paragraph.</p></blockquote>
<h2>Section 1</h2>
<p>Content here...</p>
```

2. Build: `python _build/build.py`
3. Test locally: `python -m http.server 8000` then visit `http://localhost:8000/Your-Post-Name.html`
4. Push: `git add Your-Post-Name.html _posts/Your-Post-Name.html && git commit && git push`

### Front Matter Fields

| Field | Required | Default | Description |
|-------|----------|---------|-------------|
| `title` | Yes | - | Page `<title>` tag |
| `description` | No | Generic R tutorials description | Meta description for SEO |
| `keywords` | No | Generic R/ML keywords | Meta keywords for SEO |
| `mathjax` | No | `true` | Include MathJax scripts |

### Important Notes

- Filename = output URL: `_posts/My-Post.html` builds to `/My-Post.html`
- The 42 existing HTML pages are NOT managed by the build system
- Use `<h2>` for sections (toc.js auto-generates sidebar TOC from h2 tags)
- Use `<div class="sourceCode"><pre class="sourceCode r"><code class="sourceCode r">` for R code blocks
- Build script also auto-updates `sitemap.xml` with new entries

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `CNAME` | GitHub Pages custom domain: r-statistics.co |
| `index.html` | Homepage with welcome message and nav |
| `404.html` | Custom error page |
| `css/main.css` | Primary stylesheet |
| `www/toc.js` | Auto-generates table of contents from h2/h4/h5 tags |
| `www/bootstrap.min.css` | Bootstrap 3.3.5 styles |
| `feed.xml` | RSS feed (static, from 2017 Jekyll era) |
| `sitemap.xml` | Sitemap (auto-updated by build.py) |
| `_build/template.html` | Shared page template for new posts |
| `_build/build.py` | Build script for new posts |
| `_posts/` | Source files for new posts |
| `.jekyll-metadata` | Dormant Jekyll cache file |

## Quick Commands

```bash
# Serve locally for testing (Python)
cd selva86.github.io && python -m http.server 8000

# Serve locally (Ruby/Jekyll - if you install it)
bundle exec jekyll serve

# Count tutorial pages
ls *.html | wc -l

# Find all R code blocks
grep -l "language-r" *.html

# Check which pages reference a specific screenshot
grep -l "screenshot-name.png" *.html
```
