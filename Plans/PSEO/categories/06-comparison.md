# Category 06: Comparison PSEO

**Total:** 250 slugs (canonical list lives in `Plans/PSEO/assets/comparisons.md`)
**Page template:** TL;DR table (5 dimensions) → use-case A → use-case B → benchmark → decision tree
**Word count target:** 1000 to 2000 (deeper than templated PSEO; needs benchmarks)
**Parents:** topic parents

URL pattern: `/<A>-vs-<B>-in-R.html`

---

## Cross-reference

Comparisons are **also a non-PSEO asset track** (deeper writing required than templated PSEO). The full slug enumeration is maintained in:

> **`Plans/PSEO/assets/comparisons.md`**

This file exists to mark comparison's place in the 14-category PSEO taxonomy. All 250 (canonical 260, ship top 250) slugs are tracked there.

| Sub-type | Slugs |
|---|---|
| Same-package fn vs fn | 60 |
| Cross-package fn vs fn | 40 |
| Package vs package | 30 |
| Method vs method (statistical) | 50 |
| Concept vs concept | 40 |
| R vs Python by task | 30 |
| File format vs format | 10 |
| **Total** | **260 (ship 250)** |

---

## Why this category exists separately

- **PSEO category 06 (this file):** taxonomy slot for `category_id="comparison"`.
- **Asset file (`assets/comparisons.md`):** canonical slug list with target keywords, decision-table seeds, and parent mappings.

Comparisons are tracked in `programmatic-seo.json` (lifecycle behavior matches PSEO) but the spec lives in `assets/`.

---

## Tracking

Every comparison post is tracked in `www/programmatic-seo.json` with:
- `category_id`: `"comparison"`
- `subcategory_id`: one of the 7 sub-types above
- Standard 7-state lifecycle status

Status counts roll up to `category_meta.comparison` in `programmatic-seo.json`.
