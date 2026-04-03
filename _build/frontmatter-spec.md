# Frontmatter Specification for r-statistics.co Posts

This is the **single source of truth** for post frontmatter fields. Referenced by:
- `/write-post-interactive` (command and skill)
- `/publish-post` (skill)
- `CLAUDE.md` (project guide)

## Full YAML Frontmatter

```yaml
---
title: "<CTR-optimized title — under 60 chars for SERP display>"
slug: "<Slug-With-Dashes — becomes the filename and URL>"
description: "<meta description, 150-160 chars, includes primary keyword>"
keywords: "<comma-separated SEO keywords>"
mathjax: true/false
webr: true
date: "<YYYY-MM-DD>"
curriculum_id: "<from curriculum-status.json, e.g. 1.2.3, ERR5, FR-func-1, or null>"
post_type: "<C | FR | EX | PSEO>"
auto_link_terms: "<pipe-separated terms for auto-linking>"
auto_link_case_sensitive: false
sidebar_section: "<sidebar section name — only for [C] posts>"
sidebar_title: "<short title for sidebar — only for [C] and [EX] posts>"
sidebar_order: "<sort position in section — only for [C] and [EX] posts>"
fr_parent: "<parent-slug.html — only for [FR], [EX], and [PSEO] posts>"
---
```

## Field Reference

| Field | Required | Types | Description |
|-------|----------|-------|-------------|
| `title` | All | All | Full SEO/CTR title. Under 60 chars. |
| `slug` | All | All | URL slug. Becomes `<slug>.html`. Dashes, no spaces. |
| `description` | All | All | Meta description. 150-160 chars. Include primary keyword. |
| `keywords` | All | All | Comma-separated SEO keywords. |
| `mathjax` | All | All | `true` if post uses math notation, else `false`. |
| `webr` | All | All | `true` if post has interactive R code blocks. |
| `date` | All | All | Publication date. `YYYY-MM-DD` format. |
| `curriculum_id` | All | All | ID from `curriculum-status.json`. `null` for non-curriculum posts. |
| `post_type` | All | All | `C` (Core), `FR` (Further Reading), `EX` (Exercise), `PSEO` (Programmatic SEO). |
| `auto_link_terms` | Recommended | All | Pipe-separated terms other posts would use when referencing this topic. |
| `auto_link_case_sensitive` | If auto_link_terms set | All | `false` for natural language, `true` for function names with `()`. |
| `sidebar_section` | Required | C | Which sidebar section: Learn R, Data Wrangling, Visualization, Statistics, Time Series, Machine Learning, Advanced R, Reporting, Specializations. |
| `sidebar_title` | Required | C, EX | Short title for sidebar display (e.g., "R Data Types", "dplyr (15 problems)"). |
| `sidebar_order` | Required | C, EX | Position in sidebar section. Count existing items + 1. |
| `fr_parent` | Required | FR, EX, PSEO | Parent post filename(s), pipe-separated. e.g., `R-Vectors.html` or `dplyr-filter-select.html\|dplyr-mutate-rename.html`. |

## auto_link_terms Rules

- Pick **3-5 terms** that would naturally appear in OTHER tutorials when referencing this topic
- Include the primary keyword phrase (e.g., "R data types")
- Include key function names if applicable (e.g., "class()", "typeof()")
- Use `|` (pipe) as separator
- Natural language terms → `auto_link_case_sensitive: false`
- Function names with `()` → `auto_link_case_sensitive: true`
- **NEVER** use single generic words like "data", "model", "test", "plot"

## sidebar_section Mapping

| Sidebar Section | Curriculum Path |
|-----------------|----------------|
| Learn R | `/learn-r/` |
| Data Wrangling | `/data-wrangling/` |
| Visualization | `/visualization/` |
| Statistics | `/statistics/` |
| Time Series | `/time-series/` |
| Machine Learning | `/machine-learning/` |
| Advanced R | `/advanced-r/` |
| Reporting | `/reporting/` |
| Specializations | `/specializations/` |
| Practice Exercises | (all [EX] posts) |

## How to Determine sidebar_order

1. Read `selva86.github.io/www/sidebar.json`
2. Find the target `sidebar_section`
3. Count existing items in that section's `items` array
4. Use `count + 1` as the order value
