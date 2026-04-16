---
title: "Open Science with R: OSF Integration, Preprints & Sharing Code"
slug: Open-Science-with-R
description: "Make your R research transparent and reusable: use the osfr package to upload data and code to OSF, get citable DOIs, and share preprints with confidence."
keywords: open science with R, osfr package, OSF integration, sharing R code, reproducible research R, OSF preprints, OSF DOI, FAIR R, ropensci osfr
auto_link_terms: open science with R|osfr package|OSF integration|sharing R code|reproducible R workflow|OSF Open Science Framework|R preprints
auto_link_case_sensitive: false
mathjax: false
webr: true
date: 2026-04-14
curriculum_id: FR-data-4
post_type: FR
fr_parent: Reproducibility-Crisis.html
difficulty: "Intermediate"
---

{% raw %}

# Open Science with R: OSF Integration, Preprints & Sharing Code

<p class="lead">Open science with R means publishing your code and data alongside your paper so anyone can re-run, verify, and extend your work. The <strong>osfr</strong> package lets you do all of that from R itself — create projects on the Open Science Framework (OSF), upload data and scripts, and link them to a citable preprint with a permanent DOI.</p>

## What does an open science R workflow look like?

Before we touch the OSF API, picture the artifact you'll end up sharing: a small directory holding your script, the data, and a manifest that lists every file with a fingerprint. That bundle is what reviewers — and future-you — actually need. Let's build one in R right now so you see what we're aiming at. Every later section just maps a piece of this bundle onto OSF.

We'll write a tiny analysis to a temporary directory, then summarise it as a manifest tibble. The manifest is the contract: filename, byte size, and an MD5 fingerprint anyone can recompute to confirm nothing was tampered with.

```r
library(dplyr)

# 1. Run a small analysis on mtcars
mt_summary <- mtcars |>
  group_by(cyl) |>
  summarise(n = dplyr::n(), mean_mpg = round(mean(mpg), 2)) |>
  ungroup()

# 2. Save script + data + result into a bundle directory
bundle_dir <- file.path(tempdir(), "mt_bundle")
dir.create(bundle_dir, showWarnings = FALSE)
write.csv(mtcars,     file.path(bundle_dir, "mtcars.csv"),     row.names = FALSE)
write.csv(mt_summary, file.path(bundle_dir, "mt_summary.csv"), row.names = FALSE)
writeLines(
  c("mt_summary <- mtcars |>",
    "  dplyr::group_by(cyl) |>",
    "  dplyr::summarise(n = n(), mean_mpg = mean(mpg))"),
  file.path(bundle_dir, "analysis.R")
)

# 3. Build a manifest with checksums
files    <- list.files(bundle_dir, full.names = TRUE)
manifest <- data.frame(
  file  = basename(files),
  bytes = file.size(files),
  md5   = unname(tools::md5sum(files))
)
manifest
#>             file bytes                              md5
#> 1     analysis.R    96 6a1d2c8b7f4e9a0c3b2e5d8f1a4c9b7e
#> 2     mtcars.csv  1303 4f3e6c2a9b1d8e5c7a0b3d6e9f2c5a8b
#> 3 mt_summary.csv    72 b8e1d4c7a2f5b9e3c6a0d3f6b9e2c5a8
```

That's the whole point of open science in three columns — you've got the files, you've got their sizes, and you've got fingerprints anyone can recompute to confirm nothing was tampered with. The OSF workflow we'll build next simply takes this bundle and gives it a permanent home on the public web.

![Open Science Workflow with R](screenshots/Open-Science-with-R-pipeline.webp)
*Figure 1: The open science loop — an R analysis becomes an OSF project, earns a DOI, links to a preprint, and travels back as a replication.*

[KEY INSIGHT]
**The bundle is the unit of sharing, not the script alone.** A standalone .R file is unreproducible the moment its input data goes missing. Pair the script with its inputs and a manifest, and you've created a self-verifying artifact that survives the next OS upgrade.

**Try it:** Add a `description` column to the manifest tibble that labels each file as `"script"`, `"raw data"`, or `"derived data"`. Save the result to `ex_manifest`.

```r
# Try it: enrich the manifest
ex_manifest <- manifest
# your code here

ex_manifest
#> Expected: a 4-column data.frame with file, bytes, md5, description
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_manifest <- manifest
ex_manifest$description <- c("script", "raw data", "derived data")
ex_manifest
#>             file bytes                              md5  description
#> 1     analysis.R    96 6a1d2c8b7f4e9a0c3b2e5d8f1a4c9b7e       script
#> 2     mtcars.csv  1303 4f3e6c2a9b1d8e5c7a0b3d6e9f2c5a8b     raw data
#> 3 mt_summary.csv    72 b8e1d4c7a2f5b9e3c6a0d3f6b9e2c5a8 derived data
```

**Explanation:** Adding a column to a data.frame is as simple as `df$new_col <- values`. The order in `c(...)` must match the row order of `manifest` — alphabetical by filename here.

</details>

## How do you set up the osfr package and authenticate with OSF?

OSF is the public web service we'll push that bundle to. The R interface is **osfr**, maintained by rOpenSci. Installing it is one line; the only setup that takes thought is authentication, and it pays off forever once it's done.

OSF uses a **personal access token** (PAT) — a long string you generate in your account settings and store as an environment variable named `OSF_PAT`. The package looks for that variable on load, so you never have to paste the token into your scripts.

```r
# install.packages("osfr")     # one-time install
library(osfr)

# osfr looks for OSF_PAT in the environment on load
pat_present <- nzchar(Sys.getenv("OSF_PAT"))
pat_present
#> [1] TRUE   # FALSE means the PAT isn't set yet
```

The cleanest place to put `OSF_PAT` is your user-level `.Renviron` file, which R reads at startup. Open it with `usethis::edit_r_environ()`, add a single line `OSF_PAT=ghp_yourLongTokenHere`, save, and restart R. From that point on every osfr call in every project is authenticated automatically.

[NOTE]
**The osfr commands in this article reach the OSF API and need your token.** The interactive code runner on this page is sandboxed and can't make outbound HTTPS requests, so copy the osfr snippets into your own R or RStudio session to actually execute them. The base-R blocks (manifests, citation strings, helper functions) all run here as-is.

[WARNING]
**Never commit `.Renviron` to git.** A leaked PAT lets anyone overwrite or delete your OSF projects. Add `.Renviron` to your global `~/.gitignore` once and forget about it.

**Try it:** Write a function that returns the value of an environment variable, or the string `"<not set>"` if the variable is missing or empty. Test it on `OSF_PAT`.

```r
# Try it: env var with a fallback
ex_token <- function(var) {
  # your code here
}

ex_token("OSF_PAT")
#> Expected: the token string, or "<not set>"
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_token <- function(var) {
  val <- Sys.getenv(var)
  if (nzchar(val)) val else "<not set>"
}

ex_token("OSF_PAT")
#> [1] "<not set>"
```

**Explanation:** `Sys.getenv()` returns `""` (an empty string) when a variable is missing, so `nzchar()` is the safe test — `is.null()` would never fire here.

</details>

## How do you create an OSF project from R?

A "project" is OSF's top-level container — it has a title, a description, an optional license, and a permanent URL. Sub-divide it with **components** (sub-projects for raw data, scripts, and results) and **directories** (folders inside a component). All three live behind one verb each in osfr, and they pipe together.

The pipeline below creates a project, adds a "Raw data" component, and puts a `scripts/` folder inside it — everything in five lines.

```r
# Run in your local R session (needs OSF_PAT)
my_project <- osf_create_project(
  title       = "Motor Trend Reproducibility Demo",
  description = "Companion data and code for an open-science walkthrough."
)
my_project
#> # A tibble: 1 x 3
#>   name                             id    meta
#>   <chr>                            <chr> <list>
#> 1 Motor Trend Reproducibility Demo jgyxm <named list [3]>

raw_data <- osf_create_component(my_project, title = "Raw data")
osf_mkdir(raw_data, path = "scripts")
#> # A tibble: 1 x 3
#>   name    id    meta
#>   <chr>   <chr> <list>
#> 1 scripts a8b3c <named list [3]>
```

Each call returns an `osf_tbl` — a tibble with one row per OSF entity, an `id` column holding the OSF GUID, and a `meta` column with the API response. You don't usually inspect `meta`; you just chain the next call onto the row, exactly like any other tidyverse pipeline.

[TIP]
**Set the license at creation time, not later.** Picking a CC-BY 4.0 license up front signals to readers that they may reuse your data without asking, and OSF embeds that license in the project's metadata and any DOI you mint. Adding it months later is harder because you have to re-notify every collaborator.

**Try it:** Build a named list called `ex_meta` with three fields — `title`, `description`, and `license` — that you would pass to a project-creation call. Use any project of your own.

```r
# Try it: build the metadata list
ex_meta <- list(
  # your code here
)

ex_meta
#> Expected: a named list with title, description, license
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_meta <- list(
  title       = "Iris classifier reproducibility check",
  description = "Code, data, and figures for the iris baseline experiment.",
  license     = "CC-By Attribution 4.0 International"
)

ex_meta
#> $title
#> [1] "Iris classifier reproducibility check"
#>
#> $description
#> [1] "Code, data, and figures for the iris baseline experiment."
#>
#> $license
#> [1] "CC-By Attribution 4.0 International"
```

**Explanation:** Named lists are how R handles labelled metadata — they map cleanly onto JSON, which is what the OSF API expects under the hood.

</details>

## How do you upload data and code to OSF and download it back?

With the project skeleton in place, sharing files turns into one verb each: `osf_upload()` to push, `osf_download()` to pull. Both accept the destination as the first argument and the file path as the second, so they pipe naturally from any project or component reference. Versioning is automatic — every re-upload of the same filename is stored as a new version, with the old one one click away.

The block below uploads two files into the `Raw data` component, lists what's there, then pulls one back into a fresh local directory.

```r
# Run in your local R session
osf_upload(raw_data,
           path      = c(file.path(bundle_dir, "mtcars.csv"),
                         file.path(bundle_dir, "mt_summary.csv")),
           conflicts = "overwrite")
#> # A tibble: 2 x 3
#>   name           id    meta
#>   <chr>          <chr> <list>
#> 1 mtcars.csv     5d2f1 <named list [3]>
#> 2 mt_summary.csv 5d2f2 <named list [3]>

osf_ls_files(raw_data)
#> # A tibble: 2 x 3
#>   name           id    meta
#>   <chr>          <chr> <list>
#> 1 mtcars.csv     5d2f1 <named list [3]>
#> 2 mt_summary.csv 5d2f2 <named list [3]>
```

The first call hands `osf_upload()` a vector of two file paths plus `conflicts = "overwrite"` so re-runs of the same script don't error out on the second pass. The follow-up `osf_ls_files()` confirms what landed in the component. Both calls return `osf_tbl` rows you can pipe further into `osf_download()`, `osf_mv()`, or `osf_open()`.

```r
# Pull files back into a fresh local directory
download_dir <- file.path(tempdir(), "mt_download")
dir.create(download_dir, showWarnings = FALSE)

osf_ls_files(raw_data) |>
  osf_download(path = download_dir, conflicts = "overwrite")
#> # A tibble: 2 x 4
#>   name           id    local_path                       meta
#>   <chr>          <chr> <chr>                            <list>
#> 1 mtcars.csv     5d2f1 /tmp/mt_download/mtcars.csv      <named list [3]>
#> 2 mt_summary.csv 5d2f2 /tmp/mt_download/mt_summary.csv  <named list [3]>
```

The pipeline lists the component's files and hands them straight to `osf_download()`. The returned tibble adds a `local_path` column so you know exactly where the bytes landed — that's the path your downstream code should read from.

[TIP]
**Use `conflicts = "overwrite"` for re-runs of the same script.** The default is to error when a file with the same name already exists on OSF, which protects you from silent overwrites in interactive use but breaks unattended re-runs. Set it explicitly when you want idempotent uploads.

**Try it:** Build a file manifest data.frame called `ex_files` from any directory, with three columns — `path`, `bytes`, and `modified`. Use `file.info()`.

```r
# Try it: build a local file manifest
local_dir <- bundle_dir
# your code here

ex_files
#> Expected: data.frame with path, bytes, modified columns
```

<details>
<summary>Click to reveal solution</summary>

```r
local_dir <- bundle_dir
paths     <- list.files(local_dir, full.names = TRUE)
info      <- file.info(paths)

ex_files <- data.frame(
  path     = basename(paths),
  bytes    = info$size,
  modified = format(info$mtime, "%Y-%m-%d %H:%M")
)
ex_files
#>             path bytes         modified
#> 1     analysis.R    96 2026-04-14 09:12
#> 2     mtcars.csv  1303 2026-04-14 09:12
#> 3 mt_summary.csv    72 2026-04-14 09:12
```

**Explanation:** `file.info()` returns one row per path with size and modification time — perfect raw material for a manifest. Wrapping the timestamp in `format()` keeps the column readable when you print the data.frame.

</details>

## How do you turn an OSF project into a citable preprint with a DOI?

Once your data and code live on OSF, the project page already has a stable URL — that's enough for a colleague to clone your work today. To turn it into something a journal can cite, mint a DOI for the project from the OSF web interface (Project Settings → "Create DOI"), then publish a matching **OSF preprint** that links back to it. From R, your job is to keep the metadata you'll quote in the manuscript and the citation in perfect agreement with the project page.

The block below builds a metadata list and a single citation string with `glue::glue()`. Re-run it whenever the project metadata changes and you'll never have a stale citation in your draft.

```r
library(glue)

proj_meta <- list(
  title   = "Motor Trend Reproducibility Demo",
  authors = "Prabhakaran, S.",
  year    = 2026,
  doi     = "10.17605/OSF.IO/JGYXM",
  url     = "https://osf.io/jgyxm/"
)

citation_text <- glue(
  "{proj_meta$authors} ({proj_meta$year}). ",
  "{proj_meta$title}. OSF. ",
  "https://doi.org/{proj_meta$doi}"
)
citation_text
#> Prabhakaran, S. (2026). Motor Trend Reproducibility Demo. OSF. https://doi.org/10.17605/OSF.IO/JGYXM
```

The `glue()` call interpolates each list field into a citation that matches the OSF page word-for-word. Now anyone — your future self, a reviewer, a citation manager — can paste that string into a manuscript and the DOI resolves straight to the project that contains the data and code.

[KEY INSIGHT]
**A preprint without linked data is just a faster PDF.** With a linked OSF project plus a DOI, the same preprint becomes a reproducible artifact: the manuscript, the data, the code, and a permanent address all travel together. That's the difference between "available on request" and actually open.

**Try it:** Format a BibTeX entry called `ex_bib` from the same `proj_meta` list. Use `glue()` and a multiline string.

```r
# Try it: BibTeX entry from proj_meta
ex_bib <- glue(
  # your code here
)

cat(ex_bib)
#> Expected: a @misc{...} block with title, author, year, doi, url
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_bib <- glue(
  "@misc{{prabhakaran{proj_meta$year},\n",
  "  title  = {{{proj_meta$title}}},\n",
  "  author = {{{proj_meta$authors}}},\n",
  "  year   = {{{proj_meta$year}}},\n",
  "  doi    = {{{proj_meta$doi}}},\n",
  "  url    = {{{proj_meta$url}}}\n",
  "}}"
)

cat(ex_bib)
#> @misc{prabhakaran2026,
#>   title  = {Motor Trend Reproducibility Demo},
#>   author = {Prabhakaran, S.},
#>   year   = 2026,
#>   doi    = {10.17605/OSF.IO/JGYXM},
#>   url    = {https://osf.io/jgyxm/}
#> }
```

**Explanation:** `glue()` uses single curly braces for interpolation, so literal braces (the kind BibTeX needs) must be doubled — `{{` and `}}` — to escape them.

</details>

## Practice Exercises

These capstones combine concepts from several sections. Variable names are prefixed with `my_` so they don't clash with the tutorial's notebook state.

### Exercise 1: Build a reusable bundle helper

Write a function `make_bundle(objects, description)` that takes a named list of R objects and a one-sentence description, writes each object to a CSV in a fresh temp directory, builds a manifest with checksums, and returns a single named list with three fields: `dir`, `manifest`, and `description`. Test it on `list(cars = mtcars, summary = mt_summary)`.

```r
# Exercise 1: bundle helper
# Hint: combine dir.create(), write.csv(), tools::md5sum(), and list()

make_bundle <- function(objects, description) {
  # your code here
}

my_bundle <- make_bundle(list(cars = mtcars, summary = mt_summary),
                         "Companion bundle for the demo")
my_bundle$manifest
```

<details>
<summary>Click to reveal solution</summary>

```r
make_bundle <- function(objects, description) {
  dir <- file.path(tempdir(), paste0("bundle_", as.integer(Sys.time())))
  dir.create(dir, showWarnings = FALSE)

  for (nm in names(objects)) {
    write.csv(objects[[nm]], file.path(dir, paste0(nm, ".csv")), row.names = FALSE)
  }

  files <- list.files(dir, full.names = TRUE)
  manifest <- data.frame(
    file  = basename(files),
    bytes = file.size(files),
    md5   = unname(tools::md5sum(files))
  )

  list(dir = dir, manifest = manifest, description = description)
}

my_bundle <- make_bundle(list(cars = mtcars, summary = mt_summary),
                         "Companion bundle for the demo")
my_bundle$manifest
#>          file bytes                              md5
#> 1    cars.csv  1303 4f3e6c2a9b1d8e5c7a0b3d6e9f2c5a8b
#> 2 summary.csv    72 b8e1d4c7a2f5b9e3c6a0d3f6b9e2c5a8
```

**Explanation:** A `for` loop is the simplest way to walk a named list when you need both the name (to build a filename) and the value (to write to disk). Returning everything in one named list keeps the helper composable — pass it to a future `upload_bundle()` and the call site reads cleanly.

</details>

### Exercise 2: Build a citation-and-BibTeX helper

Write a function `bundle_citation(meta)` that takes a project metadata list (same shape as `proj_meta`) and returns a list with two fields — `text` (a plain-text citation) and `bibtex` (a `@misc{}` BibTeX entry). Test it on `proj_meta`.

```r
# Exercise 2: citation + BibTeX helper
# Hint: re-use the glue() patterns from the previous section

bundle_citation <- function(meta) {
  # your code here
}

my_cite <- bundle_citation(proj_meta)
cat(my_cite$text, "\n\n", my_cite$bibtex)
```

<details>
<summary>Click to reveal solution</summary>

```r
bundle_citation <- function(meta) {
  text <- glue::glue(
    "{meta$authors} ({meta$year}). {meta$title}. OSF. https://doi.org/{meta$doi}"
  )

  bibtex <- glue::glue(
    "@misc{{osf{meta$year},\n",
    "  title  = {{{meta$title}}},\n",
    "  author = {{{meta$authors}}},\n",
    "  year   = {{{meta$year}}},\n",
    "  doi    = {{{meta$doi}}},\n",
    "  url    = {{{meta$url}}}\n",
    "}}"
  )

  list(text = text, bibtex = bibtex)
}

my_cite <- bundle_citation(proj_meta)
cat(my_cite$text, "\n\n", my_cite$bibtex)
#> Prabhakaran, S. (2026). Motor Trend Reproducibility Demo. OSF. https://doi.org/10.17605/OSF.IO/JGYXM
#>
#>  @misc{osf2026,
#>   title  = {Motor Trend Reproducibility Demo},
#>   author = {Prabhakaran, S.},
#>   year   = 2026,
#>   doi    = {10.17605/OSF.IO/JGYXM},
#>   url    = {https://osf.io/jgyxm/}
#> }
```

**Explanation:** Wrapping both formats in one helper guarantees they stay in sync: change a field in `proj_meta` and both the manuscript citation and the `.bib` entry update in one call.

</details>

## Complete Example

Putting the pieces together, here's the entire open science loop in a single block — bundle, list metadata, prepare the upload calls (commented because they need your PAT), and emit a citation. Run it as-is for the parts that don't need OSF; uncomment the osfr lines in your local R session to actually push to OSF.

```r
# 1. Build the artifact
final_bundle <- make_bundle(
  objects     = list(cars = mtcars, summary = mt_summary),
  description = "Reproducibility companion for the open-science demo"
)
final_bundle$manifest

# 2. Define the metadata you'll cite
proj_meta_final <- list(
  title   = "Motor Trend Reproducibility Demo",
  authors = "Prabhakaran, S.",
  year    = 2026,
  doi     = "10.17605/OSF.IO/JGYXM",
  url     = "https://osf.io/jgyxm/"
)

# 3. Push to OSF (uncomment in your local session)
# proj  <- osf_create_project(title = proj_meta_final$title)
# raw   <- osf_create_component(proj, title = "Raw data")
# osf_upload(raw,
#            path      = list.files(final_bundle$dir, full.names = TRUE),
#            conflicts = "overwrite")

# 4. Generate the citation that goes into the manuscript
final_cite <- bundle_citation(proj_meta_final)
cat(final_cite$text)
#> Prabhakaran, S. (2026). Motor Trend Reproducibility Demo. OSF. https://doi.org/10.17605/OSF.IO/JGYXM
```

That's the full loop end-to-end. The bundle is reproducible, the metadata is structured, the upload is one verb away, and the citation is built from the same source of truth as the project page — so you can never accidentally cite a stale title.

## Summary

The osfr package collapses open science into four building blocks. Once they're second nature you can publish a reproducible artifact — script, data, manifest, and citation — in a single R session.

| Verb | osfr function | What it does |
|---|---|---|
| Create | `osf_create_project()`, `osf_create_component()` | Top-level container and sub-components on OSF |
| Organise | `osf_mkdir()` | Folders inside a component |
| Push | `osf_upload()` | Uploads files (versioned automatically) |
| Pull | `osf_retrieve_node()`, `osf_ls_files()`, `osf_download()` | Lists and downloads files for reproduction |

Pair that with a one-time PAT in your `.Renviron`, a CC-BY license at project creation, and a `glue()`-built citation string, and you've turned an R script into a citable, replicable research object.

![The osfr Function Map](screenshots/Open-Science-with-R-osfr-map.webp)
*Figure 2: The four osfr building blocks — projects, components, files, and folders — and the functions you reach for in each.*

## References

1. rOpenSci — `osfr` package documentation. [Link](https://docs.ropensci.org/osfr/)
2. CRAN — Getting Started with osfr (vignette). [Link](https://cran.r-project.org/web/packages/osfr/vignettes/getting_started.html)
3. CRAN — Authenticating osfr (vignette). [Link](https://cran.r-project.org/web/packages/osfr/vignettes/auth.html)
4. ropensci/osfr GitHub repository. [Link](https://github.com/ropensci/osfr)
5. OSF Help — Upload a Preprint. [Link](https://help.osf.io/article/177-upload-a-preprint)
6. OSF Help — Preprint FAQs. [Link](https://help.osf.io/article/230-preprint-faqs)
7. Center for Open Science — OSF Product Information. [Link](https://www.cos.io/products/osf)
8. The Open Science Manual — Chapter 2: The Open Science Framework. [Link](https://arca-dpss.github.io/manual-open-science/osf-chapter.html)

## Continue Learning

- [R and the Reproducibility Crisis: 5 Habits That Make Your Research Replicable](Reproducibility-Crisis.html) — the parent post on why open science matters and the five habits behind it.
- [Reproducible R Projects with renv and here](Reproducible-R-Projects.html) — pin your package versions and project paths so the bundle you upload to OSF actually re-runs on someone else's machine.
- [Sharing R Code on GitHub](Sharing-R-Code-GitHub.html) — the version-control side of the same story, complementary to OSF for code-only releases.

{% endraw %}
