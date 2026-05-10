# Category 05: Cookbook Recipe PSEO

**Total:** 600 slugs (canonical list lives in `Plans/PSEO/assets/cookbook.md`)
**Page template:** problem statement → 1 canonical solution → 2 alternatives → benchmark (when relevant) → why this approach
**Word count target:** 800 to 1500
**Parents:** topic parents (data wrangling, viz, strings, dates, modeling, etc.)

URL pattern: `/How-to-<Task>-in-R.html`

---

## Cross-reference

The cookbook is **also a non-PSEO asset track** (recipes drive highest CTR / dwell-time on the site). The full slug enumeration is maintained in:

> **`Plans/PSEO/assets/cookbook.md`**

This file exists to mark the cookbook's place in the 14-category PSEO taxonomy. All 600 slugs are tracked there, with subcategory rollups across:

| Subcategory | Slugs |
|---|---|
| Data import | 25 |
| Data cleaning | 40 |
| Wrangling | 80 |
| Strings | 50 |
| Dates / times | 50 |
| Aggregations | 30 |
| Joins / merge | 25 |
| Reshape | 20 |
| Sampling | 20 |
| Visualization | 80 |
| Modeling | 60 |
| Diagnostics | 30 |
| Validation | 25 |
| Tuning | 20 |
| Export | 20 |
| Reporting | 25 |
| Debugging | 15 |
| Performance | 25 |
| Reproducibility | 15 |
| File system | 15 |
| API / web | 15 |
| **Total** | **685 candidate, ship top 600** |

---

## Why split between category file and asset file

- **Category file (this file):** classifies the cookbook within the PSEO taxonomy. Used by the 14-category schema for `category_id` assignment.
- **Asset file (`assets/cookbook.md`):** canonical slug list, edited as the working document. Tracked in `programmatic-seo.json` (since cookbook recipes are PSEO posts in their pipeline behavior).

When in doubt, edit `assets/cookbook.md`. This file only needs updating if the subcategory structure itself changes.

---

## Tracking

Every cookbook recipe is tracked in `www/programmatic-seo.json` with:
- `category_id`: `"cookbook-recipe"`
- `subcategory_id`: one of the 21 subcategories above
- Standard 7-state lifecycle status

Status counts roll up to `category_meta.cookbook-recipe` in `programmatic-seo.json`.
