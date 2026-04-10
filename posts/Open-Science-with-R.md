---
title: "Open Science with R: OSF Integration, Preprints & Sharing Code"
slug: "Open-Science-with-R"
description: "Practice open science with R using OSF, Zenodo, the osfr package, and FAIR principles. Share data, code, and preprints for transparent research."
keywords: "open science R, OSF R, osfr package, Zenodo R, FAIR principles, research transparency, preprints, code sharing"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "FR-data-4"
post_type: "FR"
auto_link_terms: "open science|OSF|osfr package|FAIR principles|Zenodo"
auto_link_case_sensitive: false
fr_parent: "Data-Ethics-in-R.html"
---

# Open Science with R: OSF Integration, Preprints & Sharing Code

<p class="lead">Open science means making your research data, code, and findings freely accessible. R's ecosystem — osfr, renv, targets, and R Markdown — makes it easier than ever to do research that anyone can inspect, reproduce, and build upon.</p>

The traditional model of science — collect data privately, analyze in secret, publish only the results — is being replaced by a transparent approach where every step is open. This isn't just idealism: open science produces more reliable results, gets more citations, and is increasingly required by funders and journals.

## The FAIR Principles

FAIR data is Findable, Accessible, Interoperable, and Reusable.

| Principle | Meaning | Implementation |
|-----------|---------|---------------|
| **Findable** | Others can discover your work | Assign DOIs, use metadata, register on OSF |
| **Accessible** | Anyone can access it | Open repositories, clear licenses |
| **Interoperable** | Works with other tools/data | Standard formats (CSV, JSON), ontologies |
| **Reusable** | Others can actually use it | Documentation, licenses, provenance |

```r
# Check: Is your project FAIR?
fair_checklist <- data.frame(
  Principle = c(rep("Findable", 3), rep("Accessible", 3),
                rep("Interoperable", 3), rep("Reusable", 3)),
  Criterion = c(
    "Has a persistent identifier (DOI)?",
    "Rich metadata describing the data?",
    "Registered in a searchable repository?",
    "Data retrievable by identifier?",
    "Open access (or clear access procedure)?",
    "Metadata accessible even if data isn't?",
    "Uses standard file formats (CSV, JSON)?",
    "Uses standard vocabularies/ontologies?",
    "References other related datasets?",
    "Clear and accessible usage license?",
    "Provenance information included?",
    "Meets community standards?"
  )
)

cat("=== FAIR Data Checklist ===\n")
for (p in unique(fair_checklist$Principle)) {
  cat(sprintf("\n%s:\n", p))
  sub <- fair_checklist[fair_checklist$Principle == p, ]
  for (i in 1:nrow(sub)) {
    cat(sprintf("  [ ] %s\n", sub$Criterion[i]))
  }
}
```

## OSF: The Open Science Framework

OSF (osf.io) is the central hub for open science. It stores your data, code, pre-registrations, and preprints — all in one place with version control and DOIs.

### Using osfr in R

```r
# osfr package workflow
cat("=== osfr Package ===\n\n")

cat("Installation:\n")
cat('  install.packages("osfr")\n')
cat('  library(osfr)\n\n')

cat("Authentication:\n")
cat('  # Create a token at osf.io/settings/tokens\n')
cat('  # Set in .Renviron: OSF_PAT=your_token_here\n\n')

cat("Create a project:\n")
cat('  project <- osf_create_project("My R Study 2026")\n\n')

cat("Upload files:\n")
cat('  osf_upload(project, "analysis.R")\n')
cat('  osf_upload(project, "data/clean_data.csv")\n')
cat('  osf_upload(project, "manuscript.pdf")\n\n')

cat("Create components (sub-projects):\n")
cat('  data_comp <- osf_create_component(project, "Data")\n')
cat('  code_comp <- osf_create_component(project, "Code")\n')
cat('  osf_upload(data_comp, "data.csv")\n')
cat('  osf_upload(code_comp, "analysis.R")\n\n')

cat("Download from OSF:\n")
cat('  osf_retrieve_node("abc12") |> osf_ls_files() |> osf_download()\n')
```

### Recommended OSF Project Structure

```r
cat("=== Recommended OSF Project Structure ===\n\n")

structure <- data.frame(
  Component = c("Pre-Registration", "Data", "Code", "Materials",
                "Results", "Manuscript"),
  Contents = c(
    "Pre-analysis plan, power analysis, registered hypotheses",
    "Raw data (if shareable), processed data, codebook",
    "R scripts, renv.lock, _targets.R pipeline",
    "Survey instruments, stimuli, protocols",
    "Figures, tables, supplementary analyses",
    "Paper draft, preprint, final published version"
  ),
  Access = c("Public", "Public or Restricted", "Public", "Public",
             "Public", "Public after acceptance")
)

for (i in 1:nrow(structure)) {
  cat(sprintf("/%s/\n  Contents: %s\n  Access: %s\n\n",
      structure$Component[i], structure$Contents[i], structure$Access[i]))
}
```

## Zenodo: Permanent Archiving with DOIs

Zenodo (zenodo.org) is a CERN-hosted repository that assigns DOIs to any research output — datasets, code, papers, presentations.

```r
cat("=== Zenodo Integration ===\n\n")

cat("Why Zenodo + OSF?\n")
cat("  OSF: Collaboration, project management, pre-registration\n")
cat("  Zenodo: Permanent archival, DOIs, citation tracking\n\n")

cat("GitHub → Zenodo (automatic archiving):\n")
cat("  1. Connect your GitHub account at zenodo.org\n")
cat("  2. Enable Zenodo for your repository\n")
cat("  3. Create a GitHub release (e.g., v1.0.0)\n")
cat("  4. Zenodo automatically archives it with a DOI\n\n")

cat("Manual upload:\n")
cat("  1. Go to zenodo.org/deposit/new\n")
cat("  2. Upload your files (data, code, paper)\n")
cat("  3. Fill in metadata (title, authors, license, keywords)\n")
cat("  4. Publish → get a DOI\n\n")

cat("Citing your DOI:\n")
cat('  "Data and code available at https://doi.org/10.5281/zenodo.XXXXXXX"\n')
```

## Sharing Code Responsibly

### The Research Compendium

A research compendium is a standardized R project structure that contains everything needed to reproduce your work.

```r
cat("=== Research Compendium Structure ===\n\n")

cat("my-study/\n")
cat("  ├── DESCRIPTION          # Project metadata (like an R package)\n")
cat("  ├── README.md            # How to reproduce the analysis\n")
cat("  ├── LICENSE              # CC-BY-4.0 or MIT\n")
cat("  ├── renv.lock            # Locked package versions\n")
cat("  ├── _targets.R           # Analysis pipeline\n")
cat("  ├── R/                   # Analysis functions\n")
cat("  │   ├── clean.R\n")
cat("  │   ├── model.R\n")
cat("  │   └── visualize.R\n")
cat("  ├── data/\n")
cat("  │   ├── raw/             # Unmodified data (read-only)\n")
cat("  │   └── processed/       # Cleaned data\n")
cat("  ├── analysis/\n")
cat("  │   └── main.Rmd         # Main analysis notebook\n")
cat("  ├── output/\n")
cat("  │   ├── figures/\n")
cat("  │   └── tables/\n")
cat("  └── paper/\n")
cat("      └── manuscript.Rmd   # Paper in R Markdown\n")
```

### Choosing a License

| License | Allows | Best For |
|---------|--------|----------|
| CC-BY 4.0 | Any use with attribution | Data, text, figures |
| CC0 (Public Domain) | Any use, no restrictions | Maximizing reuse |
| MIT | Any use with license notice | Code |
| GPL-3.0 | Use if derivatives are also open | Code (copyleft) |
| CC-BY-NC 4.0 | Non-commercial use with attribution | Restricted sharing |

```r
cat("=== License Selection Guide ===\n\n")
cat("For maximum impact:\n")
cat("  Code: MIT license (permissive, widely understood)\n")
cat("  Data: CC0 or CC-BY-4.0 (maximizes reuse)\n")
cat("  Paper: CC-BY-4.0 (allows sharing with attribution)\n\n")

cat("How to add a license:\n")
cat("  1. Create a LICENSE file in your project root\n")
cat("  2. State the license in your README\n")
cat("  3. Add license metadata to Zenodo/OSF deposits\n")
cat("  4. Include in DESCRIPTION file: License: MIT + file LICENSE\n")
```

## Preprints

Preprints are papers shared before peer review. They accelerate science by making findings available immediately.

```r
cat("=== Preprint Servers ===\n\n")

servers <- data.frame(
  Server = c("OSF Preprints", "arXiv", "bioRxiv", "medRxiv",
             "PsyArXiv", "SocArXiv", "EarthArXiv"),
  Fields = c("All disciplines", "Math, CS, Physics, Stats",
             "Biology", "Medicine & health",
             "Psychology", "Social sciences", "Earth sciences"),
  URL = c("osf.io/preprints", "arxiv.org", "biorxiv.org",
          "medrxiv.org", "psyarxiv.com", "socarxiv.org", "eartharxiv.org")
)

for (i in 1:nrow(servers)) {
  cat(sprintf("  %-15s  %-30s  %s\n",
      servers$Server[i], servers$Fields[i], servers$URL[i]))
}

cat("\nPreprint benefits:\n")
cat("  - Immediate visibility (no 6-12 month review wait)\n")
cat("  - Gets a DOI (citable immediately)\n")
cat("  - Feedback before formal review\n")
cat("  - Establishes priority\n")
cat("  - Still compatible with journal submission\n")
```

## Complete Open Science Workflow

```r
cat("=== End-to-End Open Science Workflow ===\n\n")

steps <- data.frame(
  Phase = c("Design", "Design", "Design",
            "Collect", "Collect",
            "Analyze", "Analyze", "Analyze",
            "Share", "Share", "Share", "Share"),
  Step = c(
    "1. Write pre-analysis plan",
    "2. Register on OSF/AsPredicted",
    "3. Run power analysis",
    "4. Collect data per protocol",
    "5. Store raw data (read-only)",
    "6. Clean with documented code",
    "7. Run pre-registered analysis",
    "8. Run exploratory analyses (labeled)",
    "9. Post preprint",
    "10. Upload data + code to OSF/Zenodo",
    "11. Get DOIs for everything",
    "12. Submit to journal with all links"
  ),
  Tool = c(
    "R Markdown, DeclareDesign",
    "osf.io, aspredicted.org",
    "power.t.test(), DeclareDesign",
    "Qualtrics, REDCap, etc.",
    "data/raw/ directory, Git",
    "R scripts, targets pipeline",
    "Pre-specified R code",
    "Additional R scripts",
    "OSF Preprints, bioRxiv",
    "osfr, zenodo.org",
    "Zenodo, OSF",
    "Journal submission system"
  )
)

for (phase in unique(steps$Phase)) {
  cat(sprintf("--- %s Phase ---\n", phase))
  sub <- steps[steps$Phase == phase, ]
  for (i in 1:nrow(sub)) {
    cat(sprintf("  %-45s [%s]\n", sub$Step[i], sub$Tool[i]))
  }
  cat("\n")
}
```

## Reproducibility Toolkit Summary

| Tool | Purpose | Install |
|------|---------|---------|
| renv | Lock package versions | `install.packages("renv")` |
| targets | Pipeline automation | `install.packages("targets")` |
| osfr | OSF integration | `install.packages("osfr")` |
| rmarkdown | Literate programming | `install.packages("rmarkdown")` |
| here | Relative file paths | `install.packages("here")` |
| Git | Version control | git-scm.com |
| Docker | Environment capture | docker.com |

## FAQ

**Do I have to share all my data?**
No. Some data can't be shared due to privacy, consent, or legal restrictions. In those cases, share synthetic data, aggregated data, or detailed metadata. Always share as much as ethically possible, and explain any restrictions clearly.

**Will sharing my code before publication let others scoop me?**
This is a common fear but rarely happens in practice. Pre-registration with a timestamp actually protects your priority. And the Open Science community norms strongly discourage scooping. The benefits of openness (more citations, collaborations, trust) far outweigh the risk.

**How much extra work is open science?**
Less than you think. If you're already writing R scripts, using Git, and documenting your analysis, you're 80% there. The main additional steps are: uploading to OSF/Zenodo (10 minutes), choosing a license (5 minutes), and writing a good README (30 minutes). The upfront investment pays off in easier collaboration and fewer "but I can't reproduce it" headaches.

## Continue Learning
- [Data Ethics in R](Data-Ethics-in-R.html) — The ethical foundations underlying open science
- [Pre-Analysis Plans in R](Pre-Analysis-Plans-in-R.html) — Detailed pre-registration guide
- [Reproducibility Crisis](Reproducibility-Crisis.html) — Why open science matters
