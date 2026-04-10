---
title: "R String Manipulation Exercises: 10 stringr Practice Problems Solved"
slug: "R-String-Exercises"
description: "10 R string exercises: paste, grep, gsub, substr, stringr functions, regex patterns, and text cleaning. Interactive problems with solutions."
keywords: "R string exercises, stringr exercises, R text manipulation exercises, R regex practice, R gsub exercises"
mathjax: false
webr: true
date: "2026-03-29"
curriculum_id: "E1.7"
post_type: "EX"
auto_link_terms: "R string exercises|stringr exercises|R text manipulation exercises"
auto_link_case_sensitive: false
fr_parent: "R-Syntax-101.html"
---

# R String Manipulation Exercises: 10 stringr Practice Problems Solved

<p class="lead">Practice R string manipulation with 10 exercises: combining text, searching patterns, extracting substrings, replacing text, and cleaning messy data. Uses both base R and stringr functions.</p>

String manipulation is essential for data cleaning — fixing column names, parsing text fields, extracting patterns from messy data. These exercises progress from basic paste/grep to regex-powered text processing.

## Easy (1-4): Basic String Operations

### Exercise 1: Build Formatted Strings

Given vectors of first names, last names, and ages, create formatted strings like "Alice Smith (age 25)".

```r
# Exercise 1: Format strings
first <- c("Alice", "Bob", "Carol")
last <- c("Smith", "Jones", "Williams")
ages <- c(25, 32, 28)

# Create: "Alice Smith (age 25)", etc.

```

<details>
<summary>Click to reveal solution</summary>

```r
first <- c("Alice", "Bob", "Carol")
last <- c("Smith", "Jones", "Williams")
ages <- c(25, 32, 28)

# Method 1: paste()
result1 <- paste(first, last, paste0("(age ", ages, ")"))
cat("paste:", result1, sep = "\n")

# Method 2: sprintf() — more control
result2 <- sprintf("%s %s (age %d)", first, last, ages)
cat("\nsprintf:", result2, sep = "\n")

# Method 3: Build emails
emails <- paste0(tolower(first), ".", tolower(last), "@company.com")
cat("\nEmails:", emails, sep = "\n")
```

</details>

### Exercise 2: Case Conversion

Given messy product names, standardize them: title case for display, lowercase for IDs, uppercase for codes.

```r
# Exercise 2: Standardize text case
products <- c("  WIRELESS mouse  ", "USB keyboard", "  hdmi Cable", "MONITOR stand  ")

# 1. Trim whitespace from both ends
# 2. Create display names (Title Case)
# 3. Create IDs (lowercase, spaces → hyphens)
# Hint: trimws(), toupper(), tolower(), gsub()

```

<details>
<summary>Click to reveal solution</summary>

```r
products <- c("  WIRELESS mouse  ", "USB keyboard", "  hdmi Cable", "MONITOR stand  ")

# 1. Trim whitespace
trimmed <- trimws(products)
cat("Trimmed:", trimmed, sep = "\n")

# 2. Title case (capitalize first letter of each word)
title_case <- gsub("(^|\\s)(\\w)", "\\1\\U\\2", tolower(trimmed), perl = TRUE)
cat("\nTitle case:", title_case, sep = "\n")

# 3. IDs: lowercase, spaces to hyphens
ids <- gsub("\\s+", "-", tolower(trimmed))
cat("\nIDs:", ids, sep = "\n")

# 4. Codes: uppercase, no spaces
codes <- gsub("\\s+", "", toupper(trimmed))
cat("\nCodes:", codes, sep = "\n")
```

**Key concept:** `trimws()` removes leading/trailing whitespace. `gsub()` with regex handles pattern-based replacement. `\\U\\2` in `gsub(..., perl=TRUE)` uppercases the matched group.

</details>

### Exercise 3: Search and Filter

From a vector of file names, find all CSV files, all files that start with "data", and all files with a date pattern (YYYY-MM-DD).

```r
# Exercise 3: Filter strings by pattern
files <- c("data_2024-01-15.csv", "report.pdf", "data_summary.xlsx",
           "backup_2024-02-20.csv", "notes.txt", "data_2024-03-10.csv",
           "image.png", "analysis_final.csv")

# 1. Find CSV files
# 2. Find files starting with "data"
# 3. Find files containing a date (YYYY-MM-DD pattern)

```

<details>
<summary>Click to reveal solution</summary>

```r
files <- c("data_2024-01-15.csv", "report.pdf", "data_summary.xlsx",
           "backup_2024-02-20.csv", "notes.txt", "data_2024-03-10.csv",
           "image.png", "analysis_final.csv")

# 1. CSV files (end with .csv)
csv_files <- grep("\\.csv$", files, value = TRUE)
cat("CSV files:", csv_files, sep = "\n")

# 2. Files starting with "data"
data_files <- grep("^data", files, value = TRUE)
cat("\nData files:", data_files, sep = "\n")

# 3. Files with dates (YYYY-MM-DD)
dated_files <- grep("\\d{4}-\\d{2}-\\d{2}", files, value = TRUE)
cat("\nDated files:", dated_files, sep = "\n")

# Bonus: extract just the dates
dates <- regmatches(dated_files, regexpr("\\d{4}-\\d{2}-\\d{2}", dated_files))
cat("\nExtracted dates:", dates, "\n")
```

**Key concept:** `grep(pattern, x, value=TRUE)` returns matching elements. `$` anchors to end, `^` to start. `\\d{4}` matches exactly 4 digits.

</details>

### Exercise 4: Substring Extraction

Extract parts of structured product codes: the category (first 3 chars), the ID (digits), and the region (last 2 chars).

```r
# Exercise 4: Parse product codes
codes <- c("ELC-1234-US", "FUR-5678-UK", "CLO-9012-DE", "TOY-3456-JP")

# Extract: category (ELC, FUR, etc.), ID (1234, etc.), region (US, UK, etc.)
# Hint: substr(), strsplit(), or regex

```

<details>
<summary>Click to reveal solution</summary>

```r
codes <- c("ELC-1234-US", "FUR-5678-UK", "CLO-9012-DE", "TOY-3456-JP")

# Method 1: substr (positional)
categories <- substr(codes, 1, 3)
ids <- substr(codes, 5, 8)
regions <- substr(codes, 10, 11)

cat("Categories:", categories, "\n")
cat("IDs:", ids, "\n")
cat("Regions:", regions, "\n")

# Method 2: strsplit
parts <- strsplit(codes, "-")
cat("\nParsed with strsplit:\n")
for (i in seq_along(parts)) {
  cat(sprintf("  %s → Category: %s, ID: %s, Region: %s\n",
    codes[i], parts[[i]][1], parts[[i]][2], parts[[i]][3]))
}
```

</details>

## Medium (5-7): Pattern Matching and Replacement

### Exercise 5: Clean Messy Phone Numbers

Standardize phone numbers to the format (XXX) XXX-XXXX.

```r
# Exercise 5: Standardize phone numbers
phones <- c("5551234567", "555-123-4567", "(555) 123-4567",
            "555.123.4567", "1-555-123-4567", "555 123 4567")

# Standardize ALL to: (555) 123-4567 format

```

<details>
<summary>Click to reveal solution</summary>

```r
phones <- c("5551234567", "555-123-4567", "(555) 123-4567",
            "555.123.4567", "1-555-123-4567", "555 123 4567")

# Step 1: Remove all non-digit characters
digits <- gsub("[^0-9]", "", phones)
cat("Digits only:", digits, "\n")

# Step 2: Remove leading 1 (country code) if 11 digits
digits <- ifelse(nchar(digits) == 11 & substr(digits, 1, 1) == "1",
                 substr(digits, 2, 11), digits)
cat("Normalized:", digits, "\n")

# Step 3: Format as (XXX) XXX-XXXX
formatted <- sprintf("(%s) %s-%s",
  substr(digits, 1, 3),
  substr(digits, 4, 6),
  substr(digits, 7, 10))

cat("\nFormatted:\n")
for (i in seq_along(phones)) {
  cat(sprintf("  %-20s → %s\n", phones[i], formatted[i]))
}
```

**Key concept:** `gsub("[^0-9]", "", x)` removes everything except digits. Then `sprintf()` reformats with consistent structure. This pattern works for any standardization task.

</details>

### Exercise 6: Extract Data from Text

Parse structured text to extract names, values, and units.

```r
# Exercise 6: Parse measurement strings
measurements <- c("Temperature: 72.5 F", "Humidity: 45 %",
                   "Pressure: 1013.25 hPa", "Wind Speed: 12.3 mph")

# Extract: parameter name, numeric value, and unit from each string

```

<details>
<summary>Click to reveal solution</summary>

```r
measurements <- c("Temperature: 72.5 F", "Humidity: 45 %",
                   "Pressure: 1013.25 hPa", "Wind Speed: 12.3 mph")

# Split on ": " to get name and value+unit
parts <- strsplit(measurements, ": ")
names_vec <- sapply(parts, `[`, 1)

# Extract numeric value and unit from the second part
value_unit <- sapply(parts, `[`, 2)
values <- as.numeric(gsub("[^0-9.]", "", value_unit))
units <- trimws(gsub("[0-9.]", "", value_unit))

# Create a data frame
result <- data.frame(
  parameter = names_vec,
  value = values,
  unit = units,
  stringsAsFactors = FALSE
)

print(result)
```

**Key concept:** Combine `strsplit()` for structured parts and `gsub()` with regex for extracting numbers vs text. `gsub("[^0-9.]", "", x)` keeps only digits and dots.

</details>

### Exercise 7: Text Search and Replace

Clean a paragraph of text: fix double spaces, standardize quotes, remove trailing punctuation from a list, and count word frequency.

```r
# Exercise 7: Text cleaning
text <- '  The   "quick"  brown fox   jumped  over the  lazy   dog.  The dog  was  not  amused.  The  fox  ran  away.  '

# 1. Trim and collapse multiple spaces to single
# 2. Replace curly quotes with straight quotes
# 3. Count total words
# 4. Find the 3 most common words

```

<details>
<summary>Click to reveal solution</summary>

```r
text <- '  The   "quick"  brown fox   jumped  over the  lazy   dog.  The dog  was  not  amused.  The  fox  ran  away.  '

# 1. Trim and collapse spaces
clean <- trimws(text)
clean <- gsub("\\s+", " ", clean)
cat("Cleaned:", clean, "\n\n")

# 2. Replace special quotes (if any)
clean <- gsub('[\u201c\u201d]', '"', clean)

# 3. Count words
words <- tolower(unlist(strsplit(clean, "\\s+")))
words <- gsub("[^a-z]", "", words)  # Remove punctuation
words <- words[nchar(words) > 0]    # Remove empty strings
cat("Word count:", length(words), "\n\n")

# 4. Most common words
freq <- sort(table(words), decreasing = TRUE)
cat("Top 5 words:\n")
print(head(freq, 5))
```

**Key concept:** `gsub("\\s+", " ", x)` collapses all whitespace runs to single spaces. `strsplit(x, "\\s+")` splits on any whitespace. `table()` counts frequencies.

</details>

## Hard (8-10): Real-World Text Processing

### Exercise 8: CSV Line Parser

Write a function that parses a CSV line, handling quoted fields that may contain commas.

```r
# Exercise 8: Parse CSV with quoted fields
# "John Smith","New York, NY","45","Engineer"
# The comma in "New York, NY" should NOT split the field

lines <- c(
  '"Alice","San Francisco, CA","30","Designer"',
  '"Bob","Austin, TX","25","Developer"',
  '"Carol","Portland, OR","35","Manager"'
)

# Parse each line into a vector of 4 fields

```

<details>
<summary>Click to reveal solution</summary>

```r
lines <- c(
  '"Alice","San Francisco, CA","30","Designer"',
  '"Bob","Austin, TX","25","Developer"',
  '"Carol","Portland, OR","35","Manager"'
)

parse_csv_line <- function(line) {
  # Use a regex that matches quoted fields
  matches <- regmatches(line, gregexpr('"[^"]*"', line))[[1]]
  # Remove surrounding quotes
  gsub('^"|"$', "", matches)
}

# Parse all lines
for (line in lines) {
  fields <- parse_csv_line(line)
  cat(sprintf("Name: %-8s City: %-20s Age: %s  Job: %s\n",
    fields[1], fields[2], fields[3], fields[4]))
}

# Or build a data frame
records <- lapply(lines, parse_csv_line)
df <- do.call(rbind, lapply(records, function(r) {
  data.frame(name=r[1], city=r[2], age=as.integer(r[3]), job=r[4],
             stringsAsFactors=FALSE)
}))
cat("\nData frame:\n")
print(df)
```

**Key concept:** `gregexpr('"[^"]*"', line)` finds all quoted strings. `[^"]*` means "any characters except quotes." This handles commas inside quotes correctly.

</details>

### Exercise 9: Log File Analysis

Parse web server log entries to extract IP addresses, timestamps, and status codes.

```r
# Exercise 9: Parse log entries
logs <- c(
  '192.168.1.1 - - [2024-03-15 10:23:45] "GET /index.html" 200 1234',
  '10.0.0.42 - - [2024-03-15 10:24:01] "POST /api/login" 401 89',
  '192.168.1.1 - - [2024-03-15 10:24:15] "GET /dashboard" 200 5678',
  '172.16.0.5 - - [2024-03-15 10:25:00] "GET /api/data" 500 0',
  '10.0.0.42 - - [2024-03-15 10:25:30] "POST /api/login" 200 445'
)

# Extract: IP, timestamp, HTTP method, path, status code

```

<details>
<summary>Click to reveal solution</summary>

```r
logs <- c(
  '192.168.1.1 - - [2024-03-15 10:23:45] "GET /index.html" 200 1234',
  '10.0.0.42 - - [2024-03-15 10:24:01] "POST /api/login" 401 89',
  '192.168.1.1 - - [2024-03-15 10:24:15] "GET /dashboard" 200 5678',
  '172.16.0.5 - - [2024-03-15 10:25:00] "GET /api/data" 500 0',
  '10.0.0.42 - - [2024-03-15 10:25:30] "POST /api/login" 200 445'
)

# Extract with regex
ips <- regmatches(logs, regexpr("^[\\d.]+", logs))
timestamps <- regmatches(logs, regexpr("\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}", logs))
methods <- regmatches(logs, regexpr("(GET|POST|PUT|DELETE)", logs))
paths <- regmatches(logs, regexpr("/[^\"]+", logs))
status <- as.integer(regmatches(logs, regexpr("\\b[2-5]\\d{2}\\b", logs)))

# Build data frame
log_df <- data.frame(ip = ips, time = timestamps, method = methods,
                     path = paths, status = status, stringsAsFactors = FALSE)
print(log_df)

# Analysis
cat("\nStatus code distribution:\n")
print(table(log_df$status))
cat("\nRequests per IP:\n")
print(table(log_df$ip))
cat("\nFailed requests:", sum(log_df$status >= 400), "\n")
```

**Key concept:** `regexpr()` finds the first match, `regmatches()` extracts it. Each regex targets a specific part of the log format. This is how real log analysis works.

</details>

### Exercise 10: Email Validator and Parser

Write functions to validate email addresses and extract the username and domain parts.

```r
# Exercise 10: Email validation and parsing
emails <- c("alice@example.com", "bob.smith@company.co.uk", "invalid@",
            "@nodomain.com", "carol+tag@gmail.com", "not an email",
            "david@sub.domain.org", "eve@.com")

# 1. Validate each email (TRUE/FALSE)
# 2. For valid emails: extract username and domain
# 3. Count emails per domain

```

<details>
<summary>Click to reveal solution</summary>

```r
emails <- c("alice@example.com", "bob.smith@company.co.uk", "invalid@",
            "@nodomain.com", "carol+tag@gmail.com", "not an email",
            "david@sub.domain.org", "eve@.com")

# 1. Validate with regex
is_valid_email <- function(x) {
  grepl("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", x)
}

valid <- is_valid_email(emails)
cat("Validation:\n")
for (i in seq_along(emails)) {
  cat(sprintf("  %-30s %s\n", emails[i], if (valid[i]) "VALID" else "INVALID"))
}

# 2. Parse valid emails
valid_emails <- emails[valid]
parts <- strsplit(valid_emails, "@")
usernames <- sapply(parts, `[`, 1)
domains <- sapply(parts, `[`, 2)

cat("\nParsed valid emails:\n")
parsed <- data.frame(email = valid_emails, user = usernames, domain = domains,
                     stringsAsFactors = FALSE)
print(parsed)

# 3. Count per domain
cat("\nEmails per domain:\n")
print(table(domains))
```

**Key concept:** The email regex `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$` checks for: valid characters before @, valid domain, and a TLD of 2+ letters. `strsplit(x, "@")` cleanly separates username and domain.

</details>

## Summary: Skills Practiced

| Exercises | String Skills |
|-----------|-------------|
| 1-4 (Easy) | `paste`/`sprintf`, case conversion, `grep`, `substr`/`strsplit` |
| 5-7 (Medium) | `gsub` with regex, text extraction, word frequency |
| 8-10 (Hard) | CSV parsing, log analysis, email validation with regex |

## Continue Learning

More exercise sets:

1. **R Date/Time Exercises** — lubridate practice problems
2. **R apply Family Exercises** — master apply, lapply, sapply, tapply

Or continue learning: **Data Wrangling with dplyr** tutorial.
