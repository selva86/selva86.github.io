# Plan: janitor Package in R: Clean Messy Data with 5 Lines of Code

## A. Frontmatter

| Field | Value |
|---|---|
| title | janitor Package in R: Clean Messy Data with 5 Lines of Code |
| slug | janitor-Package-in-R |
| description | janitor's clean_names(), tabyl(), and remove_empty() fix the messiest spreadsheet exports in 5 lines. Learn the full toolkit with before-and-after examples. |
| keywords | janitor R, clean_names R, tabyl, remove_empty R, janitor package, data cleaning R, clean column names R, get_dupes, adorn_totals, row_to_names |
| auto_link_terms | janitor package\|janitor\|clean_names()\|tabyl()\|remove_empty()\|get_dupes()\|row_to_names() |
| auto_link_case_sensitive | true |
| mathjax | false |
| webr | true |
| date | 2026-04-06 |
| curriculum_id | FR-clea-1 |
| post_type | FR |
| fr_parent | Data-Quality-Checking-in-R.html |

## B. Breadcrumb

Home > Data Wrangling > Cleaning > janitor Package in R

## C. Full Section Outline

### Lead paragraph
The janitor package provides simple functions like `clean_names()`, `tabyl()`, and `remove_empty()` that fix the messiest spreadsheet exports in just a few lines of R code.

### Introduction (2-3 paragraphs)
- Hook: Spreadsheet exports arrive with spaces in column names, empty rows, and duplicate records. janitor fixes all of that.
- What: janitor is a lightweight CRAN package of cleaning utilities built for messy real-world data.
- What you'll learn: clean_names, remove_empty, remove_constant, get_dupes, tabyl + adorn_*, row_to_names, excel_numeric_to_date.
- Note: All code runs in the browser -- no setup needed.

### Core H2 1: How Does clean_names() Fix Column Names?
- Theory: Spreadsheet columns arrive with spaces, mixed case, special characters. clean_names() converts to snake_case by default.
- Code block 1: Create messy data frame with bad column names, run clean_names()
- Code block 2: Show case argument options (snake, lower_camel, upper_camel, screaming_snake)
- Callout: TIP - Call clean_names() immediately after reading any Excel file.
- Inline exercise: Clean a data frame with 3 ugly column names.

### Core H2 2: How Do You Remove Empty Rows and Columns?
- Theory: Spreadsheet exports often include blank rows/columns used for formatting. remove_empty() strips them.
- Code block 3: Create data frame with empty rows and cols, run remove_empty()
- Also cover remove_constant() for columns with a single value.
- Callout: WARNING - Empty strings ("") are not the same as NA. remove_empty() only removes NA-filled rows/columns.
- Inline exercise: Remove empty rows/cols from a dataset.

### Core H2 3: How Does get_dupes() Find Duplicate Records?
- Theory: Finding duplicates is a critical data quality step. get_dupes() identifies exact or partial duplicates.
- Code block 4: Create dataset with duplicates, run get_dupes() on specific columns.
- Callout: KEY INSIGHT - get_dupes() returns the duplicate rows plus a count column, unlike duplicated() which returns only TRUE/FALSE.
- Inline exercise: Find duplicates in a dataset by a specific column.

### Core H2 4: How Does tabyl() Replace table() for Frequency Tables?
- Theory: base R table() returns an array that's hard to work with. tabyl() returns a tidy data frame with counts and percentages.
- Code block 5: One-way tabyl vs table comparison.
- Code block 6: Two-way cross-tabulation with tabyl.
- Cover adorn_totals(), adorn_percentages(), adorn_pct_formatting(), adorn_ns().
- Callout: TIP - Chain adorn_* functions to build publication-ready frequency tables in one pipeline.
- Inline exercise: Create a two-way tabyl with totals and percentages.

### Core H2 5: How Does row_to_names() Fix Header-Less Spreadsheets?
- Theory: Some Excel exports bury real headers in row 2 or 3. row_to_names() promotes a data row to column names.
- Code block 7: Create data frame where row 2 has the real headers, use row_to_names().
- Also cover excel_numeric_to_date() for Excel serial date numbers.
- Callout: NOTE - row_to_names() deletes everything above the header row by default. Set remove_rows_above = FALSE to keep them.
- Inline exercise: Promote row 3 to column names.

### Common Mistakes (3-5)
1. Forgetting to reassign after clean_names() (it doesn't modify in place)
2. Using remove_empty() on character "" columns (not NA)
3. Calling tabyl() on a grouped data frame (use ungroup() first)
4. Using get_dupes() without specifying columns (checks all columns by default)
5. Running row_to_names() with wrong row_number (off-by-one)

### Practice Exercises (2-3 capstone)
1. (Medium) Clean a messy dataset: clean names, remove empty, find duplicates -- full pipeline.
2. (Hard) Build a frequency report: tabyl + all adorn_* functions, combining concepts.
3. (Hard) Fix a spreadsheet export: row_to_names + clean_names + remove_empty + excel_numeric_to_date.

### Complete Example
End-to-end pipeline: take messy data with bad names, empty rows, duplicates, and buried headers. Fix everything in 5 lines using janitor.

### Summary
Table: function | what it does | when to use it.

### FAQ (3-5)
1. Is janitor compatible with the tidyverse pipe?
2. Can clean_names() handle non-English characters?
3. Does tabyl() work with more than 3 variables?
4. How is get_dupes() different from dplyr::distinct()?
5. Can I use janitor with data.table?

### References (5-10)
1. CRAN janitor vignette
2. GitHub sfirke/janitor
3. janitor CRAN reference manual
4. R for Data Science (Wickham) - tidy data chapter
5. Albert Rapp - janitor showcase

### What's Next
- Data-Quality-Checking-in-R.html (parent)
- Missing values handling
- dplyr data wrangling

## D. Diagram List
Diagrams optional for FR -- skipping (no genuinely useful visual for a package function tour).

## E. Code Block Master List

| Block # | Demonstrates | Libs | Vars introduced | Vars used (from prior) |
|---|---|---|---|---|
| 1 | Load janitor + create messy data | janitor, dplyr | messy_df | -- |
| 2 | clean_names() with case options | -- | clean_df, camel_df | messy_df |
| 3 | remove_empty() + remove_constant() | -- | sparse_df, cleaned_sparse | -- |
| 4 | get_dupes() on specific columns | -- | customers, dupes | -- |
| 5 | tabyl() one-way vs table() | -- | freq_table | -- |
| 6 | tabyl() two-way + adorn_* pipeline | -- | cross_tab | -- |
| 7 | row_to_names() + excel_numeric_to_date() | -- | raw_excel, fixed_excel | -- |
| 8 | Inline ex 1: clean_names scaffold | -- | ex_messy | -- |
| 9 | Inline ex 2: remove_empty scaffold | -- | ex_sparse | -- |
| 10 | Inline ex 3: get_dupes scaffold | -- | ex_orders | -- |
| 11 | Inline ex 4: tabyl scaffold | -- | ex_tab | -- |
| 12 | Inline ex 5: row_to_names scaffold | -- | ex_raw | -- |
| 13 | Common mistake 1: no reassign | -- | bad_df | -- |
| 14 | Common mistake 2: empty string vs NA | -- | char_df | -- |
| 15 | Capstone exercise 1 scaffold | -- | my_messy | -- |
| 16 | Capstone exercise 2 scaffold | -- | my_survey | -- |
| 17 | Capstone exercise 3 scaffold | -- | my_excel | -- |
| 18 | Complete example: full pipeline | janitor, dplyr | raw_data, final_data | -- |

Estimated word count: ~3500-4000 words
H2 sections: 12 (1 Intro + 5 core + 6 tail)
Code blocks: ~18 interactive
