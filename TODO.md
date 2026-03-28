# r-statistics.co — To-Do List

## SEO & Growth (Priority Order)

### 1. Programmatic SEO — Individual Topic Pages (HIGH PRIORITY)
Create dedicated pages for high-volume long-tail keywords:
- **dplyr verbs**: `dplyr-select.html`, `dplyr-filter.html`, `dplyr-mutate.html`, `dplyr-group-by.html`, `dplyr-summarise.html`, `dplyr-arrange.html`, `dplyr-joins.html`
- **R operators**: `R-Assignment-Operator.html`, `R-Pipe-Operator.html`
- **R vs Python comparisons**: "How to filter data in R vs Python", "How to group by in R vs Python"
- Each page targets a specific long-tail keyword, links back to the parent tutorial, and has interactive WebR code blocks
- This multiplies the site's surface area in search results dramatically

### 2. Highlight WebR Interactive Code as a Ranking Moat
- Add a prominent banner on every WebR post: "Run every code block in your browser. No installation needed."
- Mention interactivity in meta descriptions for click-through rate
- Consider adding a "Playground" mode for open-ended R coding
- This increases time-on-page and reduces bounce rate — both ranking signals

### 3. Featured Snippet & "People Also Ask" Optimization
- Add definition paragraphs after H1s (e.g., "What is R syntax?", "What is dplyr?") — Google pulls these for snippets
- Add FAQ sections with `FAQPage` schema to all posts (Post 2 already has FAQ content — add schema)
- Add `HowTo` schema to step-by-step tutorials (Post 1 has 10 steps — perfect for rich results)
- Target PAA questions as H2/H3 subsections in existing content

### 4. Downloadable Cheat Sheet PDFs for Backlink Earning
- Convert the cheat sheet tables in R Syntax 101 and dplyr posts into shareable, downloadable PDFs
- Cheat sheets earn backlinks from educational blogs, university courses, and "best R resources" roundups
- Host on the site with a landing page, not just a direct PDF link

### 5. Embeddable Interactive R Widget
- Allow other sites to embed a single interactive WebR code block (like CodePen embeds)
- Creates natural backlinks as educators and bloggers embed examples from r-statistics.co
- Implement as an `<iframe>` embed code with attribution link

## Technical SEO Fixes
- [ ] Fix broken internal links in R Syntax 101 (R-Data-Frames.html, Import-Data-Into-R.html don't exist)
- [ ] Add `<link rel="canonical">` to all pages
- [ ] Add Open Graph (`og:title`, `og:description`, `og:image`) and Twitter Card meta tags
- [ ] Fix Google Fonts HTTP -> HTTPS in template
- [ ] Add `lang="en"` to `<html>` tag
- [ ] Add `FAQPage` schema to R Basic Syntax post (already has FAQ content)
- [ ] Add `HowTo` schema to R Syntax 101 post
- [ ] Add `Article` schema to all posts
- [ ] Add WebR interactive code to dplyr post (currently static code blocks)
- [ ] Expand dplyr post content: add across(), case_when(), window functions, real-world dataset (~3000+ words target)
- [ ] Add internal links to dplyr post body (currently zero)
- [ ] Differentiate Post 1 vs Post 2 keyword targeting to prevent cannibalization
- [ ] Migrate sitemap URLs from http:// to https://
