# Ops Spec: Linking and Schema

Covers ops items 5, 6 (should-haves):
- Cluster-aware sibling linking via `inject_sibling_block()` extension to `_build/auto_link.py`
- Schema markup auto-injection (HowTo, FAQPage, SoftwareApplication, BreadcrumbList, Course) via `_build/build.py`

---

## 1. Sibling block injection

### Concept

`auto_link.py` already injects:
- Inline auto-links (term -> URL) within body text
- "Further Reading" parent block (parent post -> children)

This adds:
- Sibling-to-sibling block at the end of every PSEO post: "Related in this series" with up to 8 sibling links

### Why sibling links matter

- Increases session depth: a reader landing on `dplyr-select-in-R` sees links to `dplyr-filter-in-R`, `dplyr-mutate-in-R`, etc.
- Reinforces topical authority: search engines weight clusters where pages cross-link densely
- Drives crawl: new sibling pages get crawled faster when linked from already-indexed siblings

### Storage

Sibling relationships derived from `programmatic-seo.json`:
```json
{
  "series": [
    {
      "id": "dplyr-verbs",
      "category_id": "function-deep",
      "posts": [
        {"slug": "dplyr-select-in-R", "status": "published", ...},
        {"slug": "dplyr-filter-in-R", "status": "published", ...},
        ...
      ]
    }
  ]
}
```

A post's siblings are all OTHER posts in the same `series.id` with `status="published"`.

### Implementation in `_build/auto_link.py`

New function `inject_sibling_block(html_path)`:

1. Read frontmatter from `_posts/<slug>.html` to get `series_id` (added field) or look up the post in `programmatic-seo.json` by slug
2. Find all siblings (same series, status=published, not the post itself)
3. Order siblings by `published_date` ascending
4. Take up to 8 siblings
5. If sibling count < 3, skip (block looks empty/sad)
6. Inject this block before the existing `</article>` close (or after `auto-further-reading` if present):

```html
<div id="auto-sibling-block" class="auto-link-section">
  <h4>Related in this series</h4>
  <ul>
    <li><a href="dplyr-filter-in-R.html">dplyr filter() in R</a></li>
    <li><a href="dplyr-mutate-in-R.html">dplyr mutate() in R</a></li>
    ...
  </ul>
</div>
```

### Modes (mirror existing auto_link.py modes)

- **Additive:** if `<div id="auto-sibling-block">` already exists, skip
- **Reprocess:** strip existing sibling block, rebuild
- **Cleanup:** remove sibling links pointing to a specific URL (when post deprecated)

### Manual override

Same convention as FR block:
- Frontmatter `sibling_block_enabled: false` skips this post
- HTML comment `<!-- siblings-manual -->` in body skips this post

### CSS

Add to `css/main.css`:

```css
.auto-link-section {
  margin-top: 2.5rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}
.auto-link-section h4 {
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
}
.auto-link-section ul {
  list-style: none;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.4rem 1rem;
}
```

### Integration with sync_registries.py

`sync_registries.py` already auto-refreshes parent FR blocks. Extend it: after publishing a PSEO post, also rebuild sibling blocks for ALL posts in the same series (not just the parent). One additional list comprehension; no architectural change.

---

## 2. JSON-LD schema markup auto-injection

### Schemas to emit

| Schema type | When | Source of data |
|---|---|---|
| `HowTo` | post is in cookbook subcategory or category 05 | h2/h4 sequence of steps |
| `FAQPage` | post body contains H2 or H4 named "FAQ" with ≥3 question/answer pairs | parsed FAQ block |
| `SoftwareApplication` | URL is under `/tools/` | calculator metadata + name + url |
| `Course` | URL matches `/courses/` or post_type=Course | course frontmatter |
| `BreadcrumbList` | every page | derived from `category_meta` parent chain |
| `Article` | every Core (`C`) post | title, author=Selva Prabhakaran, datePublished |

### Implementation in `_build/build.py`

New `inject_jsonld(template, frontmatter, content)` function called during template rendering:

1. Determine schema types applicable to this post (rules above)
2. For each, build JSON-LD object
3. Concatenate all objects into a single `<script type="application/ld+json">` block in `<head>`

### Example output (cookbook recipe)

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to convert factor to numeric in R",
  "totalTime": "PT5M",
  "step": [
    {"@type": "HowToStep", "name": "Identify factor", "text": "..."},
    {"@type": "HowToStep", "name": "Convert via as.character then as.numeric", "text": "..."}
  ]
}
</script>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://r-statistics.co/"},
    {"@type": "ListItem", "position": 2, "name": "Data Wrangling", "item": "https://r-statistics.co/data-wrangling/"},
    {"@type": "ListItem", "position": 3, "name": "Convert factor to numeric in R", "item": "https://r-statistics.co/Convert-Factor-to-Numeric-in-R.html"}
  ]
}
</script>
```

### Detection rules

#### HowTo
- post body has H2 or H4 sequence implying ordered steps (3 or more)
- frontmatter `category_id` in {`cookbook-recipe`, `chart-type`, `function-deep`}
- emit one HowToStep per identified H4 step or numbered list item

#### FAQPage
- regex match: H2 or H4 with text "FAQ" or "Frequently Asked Questions"
- following Q/A pairs (each Q is H4 or H5 starting with question word; A is paragraph after)
- emit each as `Question` + `Answer` Schema entity

#### SoftwareApplication
- URL pattern `/tools/<slug>.html`
- name = title from frontmatter
- applicationCategory = "EducationalApplication"
- offers.price = "0"
- offers.priceCurrency = "USD"

#### BreadcrumbList
- always emit
- chain derived from `parent_post` link or sidebar section path

#### Article
- always emit for non-/tools/ pages
- author = "Selva Prabhakaran"
- publisher = "r-statistics.co"
- datePublished = frontmatter date

### Validation

After build:
```bash
python Scripts/validate_jsonld.py
```

Validates every emitted JSON-LD block against schema.org JSON Schema. Errors block publish.

CI hook: validate before commit.

### SERP impact

Schema markup gives:
- **HowTo:** rich result with step thumbnails; ~30% CTR uplift on mobile
- **FAQPage:** expandable FAQ block in SERP; ~20% CTR uplift
- **SoftwareApplication:** rating stars (when reviews accumulate); ~15% CTR uplift
- **BreadcrumbList:** breadcrumb path in SERP (cleaner display); ~5% CTR uplift
- **Article:** publisher logo + author name in SERP; ~10% CTR uplift

Cumulative uplift across the site: estimated 15 to 25% traffic increase once schema is universally deployed and Google has reindexed.

### Reindex prompts

After deploying schema markup site-wide:
1. Submit updated `sitemap.xml` to Google Search Console
2. Use URL Inspection -> Request Indexing for top 50 pages
3. Reindex completes over 2 to 6 weeks for the full site
