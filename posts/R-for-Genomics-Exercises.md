---
title: "R for Genomics Exercises: 19 Bioconductor Practice Problems"
slug: "R-for-Genomics-Exercises"
description: "Nineteen realistic R genomics drills: Biostrings, GRanges intervals, RNA-seq counts, DESeq2 differential expression, volcano plots, GO enrichment."
keywords: "bioconductor R exercises, R genomics exercises, RNA-seq R practice, GenomicRanges exercises, DESeq2 practice, Biostrings exercises"
mathjax: false
webr: false
date: "2026-05-13"
post_type: "EX"
sidebar_title: "R for Genomics"
sidebar_order: 158
fr_parent: "R-Tutorial.html"
auto_link_terms: "bioconductor R exercises|R genomics exercises|RNA-seq in R|GenomicRanges|DESeq2 in R"
auto_link_case_sensitive: false
target_keyword: "bioconductor R exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# R for Genomics Exercises: 19 Bioconductor Practice Problems

<p class="lead">Nineteen practice problems that mirror real bioinformatics work in R: sequence manipulation with Biostrings, interval operations with GRanges, RNA-seq count wrangling, DESeq2 differential expression, volcano plots, and GO enrichment. Each problem ships with the expected output and a hidden, fully explained solution.</p>

```r title="Run this once before any exercise"
library(Biostrings)
library(GenomicRanges)
library(IRanges)
library(DESeq2)
library(dplyr)
library(tibble)
library(ggplot2)
library(pheatmap)
library(clusterProfiler)

set.seed(42)
```

## Section 1. Sequence manipulation with Biostrings (4 problems)

### Exercise 1.1: Build a DNAString from a raw sequence

**Task:** A genomics lab onboarding workshop wants newcomers to practice creating a DNA sequence object from a raw character string of bases. Wrap the sequence `"ATGCGTACGTTAGCTAGCAATTGGCCGATCGTAA"` into a `DNAString` object so it supports IUPAC operations like reverse complement and translation, and save the result to `ex_1_1`.

**Expected result:**

```
#> 34-letter DNAString object
#> seq: ATGCGTACGTTAGCTAGCAATTGGCCGATCGTAA
```

**Difficulty:** Beginner

[HINTS]
A bare character string is just text in R; you need a typed sequence container that validates the bases and unlocks operations like reverse complement and translation.
Pass the raw string straight into the `DNAString()` constructor.

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- DNAString("ATGCGTACGTTAGCTAGCAATTGGCCGATCGTAA")
ex_1_1
#> 34-letter DNAString object
#> seq: ATGCGTACGTTAGCTAGCAATTGGCCGATCGTAA
```

**Explanation:** A bare character string is just text in R: nothing stops you from putting `"AXYZ"` in it. Wrapping it in `DNAString()` validates that every letter is one of the IUPAC DNA codes and stores the bases in a compact internal representation, which is what enables fast vectorised operations like `reverseComplement()`, `translate()`, and `letterFrequency()`. Use `RNAString()` for RNA and `AAString()` for amino-acid sequences.

</details>

### Exercise 1.2: Reverse complement a PCR primer

**Task:** A molecular biologist designing primers for a PCR reaction needs the reverse complement of the forward primer `"AGCTTGCCATGCGTACGTA"` so it can be ordered as the reverse primer. Compute the reverse complement using Biostrings so the result is a `DNAString` ready to paste into an oligo order form, and save it as `ex_1_2`.

**Expected result:**

```
#> 19-letter DNAString object
#> seq: TACGTACGCATGGCAAGCT
```

**Difficulty:** Beginner

[HINTS]
The reverse primer reads the opposite strand 5' to 3', so you need both the complement of every base and a flip of their order.
Wrap the string in `DNAString()`, then pass that to `reverseComplement()`, which does the flip and the complement in one pass.

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- reverseComplement(DNAString("AGCTTGCCATGCGTACGTA"))
ex_1_2
#> 19-letter DNAString object
#> seq: TACGTACGCATGGCAAGCT
```

**Explanation:** `reverseComplement()` does two operations in one pass: it complements each base (A to T, C to G, and back) and reverses the order so the result reads 5' to 3' on the opposite strand. Compare with `complement()`, which keeps the original order, and `reverse()`, which flips the order without complementing. The reverse complement is what you order from the oligo vendor because primers are always written 5' to 3'.

</details>

### Exercise 1.3: GC content of a coding region

**Task:** A bioinformatician auditing the GC bias of a custom gene panel wants the GC fraction of the 60-base coding region `"ATGCGTACGTACGTACGTACGTACGTACGTAAATAGCTAGCTAGCTAGCTAGCTAGCTAG"`. Use `letterFrequency()` to count G and C bases, divide by the sequence length to produce a single numeric value between 0 and 1, and save the result to `ex_1_3`.

**Expected result:**

```
#> [1] 0.4666667
```

**Difficulty:** Intermediate

[HINTS]
GC content is just the share of bases that are G or C, so you need a per-base count and the total sequence length to divide by.
Use `letterFrequency(seq, c("G", "C"))`, `sum()` the result, and divide by `length(seq)`.

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
seq <- DNAString("ATGCGTACGTACGTACGTACGTACGTACGTAAATAGCTAGCTAGCTAGCTAGCTAGCTAG")
gc_count <- sum(letterFrequency(seq, c("G", "C")))
ex_1_3 <- gc_count / length(seq)
ex_1_3
#> [1] 0.4666667
```

**Explanation:** `letterFrequency(seq, c("G", "C"))` returns a named integer vector with the count of each base, so summing collapses to total GC count. Dividing by `length(seq)` (which on a `DNAString` returns the number of bases, not the size of an R vector) yields the GC fraction. A shorter alternative is `letterFrequency(seq, "GC", as.prob = TRUE)`, which folds both ops into one call.

</details>

### Exercise 1.4: Build a named DNAStringSet for three reads

**Task:** A core sequencing facility receives three short read sequences and needs them stored as a named `DNAStringSet` so downstream tools can index them by sample id. Wrap the character vector `c(s1 = "ATGGCATG", s2 = "TTGCGACC", s3 = "CCGATAGA")` into a `DNAStringSet` that preserves the `s1`, `s2`, `s3` names, and save the result as `ex_1_4`.

**Expected result:**

```
#> DNAStringSet object of length 3:
#>     width seq                                names
#> [1]     8 ATGGCATG                           s1
#> [2]     8 TTGCGACC                           s2
#> [3]     8 CCGATAGA                           s3
```

**Difficulty:** Intermediate

[HINTS]
Multiple sequences need a set-style container rather than a single-sequence one, and the sample ids should ride along from the input vector automatically.
Pass the named character vector to `DNAStringSet()`.

```r title="Your turn"
reads <- c(s1 = "ATGGCATG", s2 = "TTGCGACC", s3 = "CCGATAGA")
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
reads <- c(s1 = "ATGGCATG", s2 = "TTGCGACC", s3 = "CCGATAGA")
ex_1_4 <- DNAStringSet(reads)
ex_1_4
#> DNAStringSet object of length 3:
#>     width seq                                names
#> [1]     8 ATGGCATG                           s1
#> [2]     8 TTGCGACC                           s2
#> [3]     8 CCGATAGA                           s3
```

**Explanation:** `DNAStringSet()` is the right container for multiple sequences of any length, the way `DNAString` is for a single sequence. Names carry through from the input character vector automatically. Once it is a `DNAStringSet` you can vectorise `letterFrequency()`, `reverseComplement()`, and `width()` across the whole set, which is how Biostrings keeps things fast for millions of reads.

</details>

## Section 2. Genomic intervals with GRanges (3 problems)

### Exercise 2.1: Construct a GRanges for three exons

**Task:** A genome browser team needs an interval table representing three exons on chromosome 1 starting at positions 1000, 5000, and 12000 with widths 200, 300, and 250 respectively, all on the plus strand. Build the matching `GRanges` with `seqnames = "chr1"`, an `IRanges` from the starts and widths, and `strand = "+"`, and save to `ex_2_1`.

**Expected result:**

```
#> GRanges object with 3 ranges and 0 metadata columns:
#>       seqnames      ranges strand
#>          <Rle>   <IRanges>  <Rle>
#>   [1]     chr1  1000-1199      +
#>   [2]     chr1  5000-5299      +
#>   [3]     chr1 12000-12249     +
#>   ---
#>   seqinfo: 1 sequence from an unspecified genome; no seqlengths
```

**Difficulty:** Intermediate

[HINTS]
An interval table needs three pieces: which chromosome, where each interval sits and how wide it is, and which strand it lies on.
Call `GRanges()` with `seqnames`, a `ranges` built from `IRanges(start = ..., width = ...)`, and `strand`.

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- GRanges(
  seqnames = "chr1",
  ranges   = IRanges(start = c(1000, 5000, 12000),
                     width = c(200, 300, 250)),
  strand   = "+"
)
ex_2_1
#> GRanges object with 3 ranges and 0 metadata columns:
#>       seqnames      ranges strand
#>          <Rle>   <IRanges>  <Rle>
#>   [1]     chr1  1000-1199      +
#>   [2]     chr1  5000-5299      +
#>   [3]     chr1 12000-12249     +
```

**Explanation:** `GRanges` is the workhorse interval container in Bioconductor. The three required pieces are a chromosome (`seqnames`), the start and width or start and end (`IRanges`), and the strand. Internally `start = 1000, width = 200` becomes `start = 1000, end = 1199` because GRanges is 1-based and end-inclusive, in contrast to BED files which are 0-based and end-exclusive. Confusing those two conventions is the single most common GRanges bug.

</details>

### Exercise 2.2: Find overlaps between two ChIP-seq peak sets

**Task:** A ChIP-seq pipeline merges peak calls from two replicates. Build peakset A on chr1 at intervals (100-300, 700-900, 1500-1800) and peakset B at (250-400, 1600-1900, 2100-2300), then use `findOverlaps()` to report which A indices overlap which B indices, and save the resulting `Hits` object to `ex_2_2`.

**Expected result:**

```
#> Hits object with 2 hits and 0 metadata columns:
#>       queryHits subjectHits
#>       <integer>   <integer>
#>   [1]         1           1
#>   [2]         3           2
#>   -------
#>   queryLength: 3 / subjectLength: 3
```

**Difficulty:** Advanced

[HINTS]
You want every query-subject index pair that shares at least one base, not the filtered intervals themselves.
Call `findOverlaps()` with peakset A as the query and peakset B as the subject.

```r title="Your turn"
peaks_A <- GRanges("chr1", IRanges(c(100, 700, 1500), c(300, 900, 1800)))
peaks_B <- GRanges("chr1", IRanges(c(250, 1600, 2100), c(400, 1900, 2300)))
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
peaks_A <- GRanges("chr1", IRanges(c(100, 700, 1500), c(300, 900, 1800)))
peaks_B <- GRanges("chr1", IRanges(c(250, 1600, 2100), c(400, 1900, 2300)))
ex_2_2 <- findOverlaps(peaks_A, peaks_B)
ex_2_2
#> Hits object with 2 hits and 0 metadata columns:
#>       queryHits subjectHits
#>       <integer>   <integer>
#>   [1]         1           1
#>   [2]         3           2
```

**Explanation:** `findOverlaps()` returns a `Hits` object recording every (query, subject) index pair that shares at least one base, which is exactly the shape you want for joining metadata back. Peak 1 of A (100-300) overlaps peak 1 of B (250-400) at bases 250-300, and peak 3 of A (1500-1800) overlaps peak 2 of B (1600-1900). Peak 2 of A and peak 3 of B have no overlap. Use `subsetByOverlaps()` if you only need the filtered GRanges and not the index pairing.

</details>

### Exercise 2.3: Resize ChIP-seq peaks to a fixed-width window

**Task:** A motif analyst needs each ChIP-seq peak extended into a uniform 500 bp window centered on the original peak so downstream motif scanning sees consistent context. Starting from a 3-peak GRanges on chr1 at (100-150, 800-820, 2000-2030), use `resize()` with `width = 500` and `fix = "center"` to recenter every interval, and save the resized GRanges to `ex_2_3`.

**Expected result:**

```
#> GRanges object with 3 ranges and 0 metadata columns:
#>       seqnames    ranges strand
#>          <Rle> <IRanges>  <Rle>
#>   [1]     chr1 -125-374      *
#>   [2]     chr1  560-1059     *
#>   [3]     chr1 1765-2264     *
```

**Difficulty:** Advanced

[HINTS]
Each peak must become a uniform-width window that keeps its midpoint fixed while both edges move outward.
Call `resize()` with `width = 500` and `fix = "center"`.

```r title="Your turn"
peaks <- GRanges("chr1", IRanges(c(100, 800, 2000), c(150, 820, 2030)))
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
peaks <- GRanges("chr1", IRanges(c(100, 800, 2000), c(150, 820, 2030)))
ex_2_3 <- resize(peaks, width = 500, fix = "center")
ex_2_3
#> GRanges object with 3 ranges and 0 metadata columns:
#>       seqnames    ranges strand
#>          <Rle> <IRanges>  <Rle>
#>   [1]     chr1 -125-374      *
#>   [2]     chr1  560-1059     *
#>   [3]     chr1 1765-2264     *
```

**Explanation:** With `fix = "center"`, `resize()` keeps the midpoint of each interval and extends symmetrically outward, which is the right behaviour for motif scanning around a summit. `fix = "start"` and `fix = "end"` anchor to one edge instead. The first interval slides below zero because its original center was at 125 and we asked for half a kilobase on each side, so production code typically follows up with `trim(ex_2_3)` against a `Seqinfo` with `seqlengths` set to clip out-of-bounds coordinates.

</details>

## Section 3. RNA-seq count matrices (3 problems)

### Exercise 3.1: Build an integer counts matrix from raw numbers

**Task:** A transcriptomics core received raw read counts for 4 genes across 4 samples (ctrl_1, ctrl_2, treat_1, treat_2). Construct an integer `matrix` with the genes `g1, g2, g3, g4` as rownames and the four samples as colnames using the counts shown in the setup block, then save the populated matrix to `ex_3_1` ready for downstream normalization.

**Expected result:**

```
#>    ctrl_1 ctrl_2 treat_1 treat_2
#> g1     10     12      50      48
#> g2    100    110     105      98
#> g3      0      1       2       0
#> g4    500    520     200     210
```

**Difficulty:** Intermediate

[HINTS]
A count table is genes in rows and samples in columns; the values fill in one column at a time, which is why the vector is laid out sample by sample.
Call `matrix()` with `nrow = 4`, `ncol = 4`, and a `dimnames` list of the gene names and sample names.

```r title="Your turn"
counts_vec <- c(10, 100, 0, 500,
                12, 110, 1, 520,
                50, 105, 2, 200,
                48,  98, 0, 210)
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
counts_vec <- c(10, 100, 0, 500,
                12, 110, 1, 520,
                50, 105, 2, 200,
                48,  98, 0, 210)
ex_3_1 <- matrix(
  counts_vec,
  nrow = 4,
  ncol = 4,
  dimnames = list(c("g1", "g2", "g3", "g4"),
                  c("ctrl_1", "ctrl_2", "treat_1", "treat_2"))
)
ex_3_1
#>    ctrl_1 ctrl_2 treat_1 treat_2
#> g1     10     12      50      48
#> g2    100    110     105      98
#> g3      0      1       2       0
#> g4    500    520     200     210
```

**Explanation:** A count matrix is the canonical input shape for every RNA-seq tool: rows are features (genes, transcripts, exons), columns are samples, values are integer read counts. `matrix()` fills column-major by default, which is why the input vector is laid out one full sample at a time. The `dimnames` argument is the cheapest way to attach gene ids and sample labels in a single call instead of two separate `rownames<-` and `colnames<-` assignments.

</details>

### Exercise 3.2: Filter out low-count genes

**Task:** A differential expression analyst wants to drop any gene with fewer than 10 total reads across all samples before running DESeq2, because such genes carry no statistical power and only inflate multiple-testing burden. Using the matrix from Exercise 3.1, compute the row sums, keep only rows where the total is at least 10, and save the filtered matrix to `ex_3_2`.

**Expected result:**

```
#>    ctrl_1 ctrl_2 treat_1 treat_2
#> g1     10     12      50      48
#> g2    100    110     105      98
#> g4    500    520     200     210
```

**Difficulty:** Intermediate

[HINTS]
A gene's total reads across all samples decides whether it stays, so turn that threshold test into a logical vector you can subset rows with.
Compute `rowSums(ex_3_1)`, compare it `>= 10`, and use the resulting logical vector to index the matrix rows.

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
keep <- rowSums(ex_3_1) >= 10
ex_3_2 <- ex_3_1[keep, ]
ex_3_2
#>    ctrl_1 ctrl_2 treat_1 treat_2
#> g1     10     12      50      48
#> g2    100    110     105      98
#> g4    500    520     200     210
```

**Explanation:** `rowSums()` is the fast vectorised total per gene; comparing to 10 produces a logical vector you can slice the rows with. Gene `g3` has total `0 + 1 + 2 + 0 = 3`, so it drops. A common variation is `rowSums(counts >= 1) >= smallest_group_size`, which keeps a gene only if it is detected in at least as many samples as the smallest treatment group. That variant is preferred when group sizes are imbalanced.

</details>

### Exercise 3.3: Normalize counts to CPM

**Task:** A bioinformatician comparing samples with different library sizes wants counts-per-million (CPM) so genes are on the same scale across samples. Using the filtered matrix from Exercise 3.2, divide each column by its column sum and multiply by 1e6 to produce a CPM matrix with the same dimensions, and save the result to `ex_3_3`.

**Expected result:**

```
#>       ctrl_1     ctrl_2    treat_1    treat_2
#> g1   16367.98   18691.59  140845.07  133519.55
#> g2  163679.81  171339.56  295774.65  272560.89
#> g4  818399.13  809968.85  563380.28  583821.66
#>  # values printed to ~2 decimals
```

**Difficulty:** Advanced

[HINTS]
Each sample's counts must be rescaled by its own library size so columns become comparable, then lifted onto a per-million scale.
Get per-sample totals with `colSums()`, divide column-wise using the `t(t(x) / v)` transpose trick (or `sweep(..., 2, ...)`), and multiply by 1e6.

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
lib_sizes <- colSums(ex_3_2)
ex_3_3 <- t(t(ex_3_2) / lib_sizes) * 1e6
round(ex_3_3, 2)
#>       ctrl_1    ctrl_2   treat_1   treat_2
#> g1  16367.98  18691.59 140845.07 133519.55
#> g2 163679.81 171339.56 295774.65 272560.89
#> g4 818399.13 809968.85 563380.28 583821.66
```

**Explanation:** Dividing a matrix by a vector recycles the vector down rows, not across columns, which is the opposite of what you want here. The `t(t(x) / v)` trick transposes so columns become rows, divides correctly, then transposes back. An equivalent idiom is `sweep(ex_3_2, 2, lib_sizes, "/") * 1e6`, which is slightly clearer for readers unfamiliar with the double-transpose pattern. CPM is the cheapest cross-sample normalization, but for cross-sample biological comparisons prefer DESeq2's `vst()` or TMM via `edgeR`.

</details>

## Section 4. Differential expression (3 problems)

### Exercise 4.1: Build a DESeqDataSet from counts and a design

**Task:** A wet-lab principal investigator hands a sample sheet of two control replicates and two treated replicates to the analysis core. Using the filtered count matrix `ex_3_2`, a `colData` data.frame with a `condition` factor (levels `ctrl`, `treat`), and `design = ~ condition`, construct a `DESeqDataSet` ready for the DESeq2 pipeline and save it to `ex_4_1`.

**Expected result:**

```
#> class: DESeqDataSet
#> dim: 3 4
#> metadata(1): version
#> assays(1): counts
#> rownames(3): g1 g2 g4
#> colnames(4): ctrl_1 ctrl_2 treat_1 treat_2
#> colData names(1): condition
```

**Difficulty:** Advanced

[HINTS]
The modelling object bundles three inputs: the count matrix, the per-sample metadata, and the formula describing the comparison.
Call `DESeqDataSetFromMatrix()` with `countData = ex_3_2`, `colData = coldata`, and `design = ~ condition`.

```r title="Your turn"
coldata <- data.frame(
  condition = factor(c("ctrl", "ctrl", "treat", "treat"),
                     levels = c("ctrl", "treat")),
  row.names = c("ctrl_1", "ctrl_2", "treat_1", "treat_2")
)
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
coldata <- data.frame(
  condition = factor(c("ctrl", "ctrl", "treat", "treat"),
                     levels = c("ctrl", "treat")),
  row.names = c("ctrl_1", "ctrl_2", "treat_1", "treat_2")
)
ex_4_1 <- DESeqDataSetFromMatrix(
  countData = ex_3_2,
  colData   = coldata,
  design    = ~ condition
)
ex_4_1
#> class: DESeqDataSet
#> dim: 3 4
#> assays(1): counts
#> rownames(3): g1 g2 g4
#> colnames(4): ctrl_1 ctrl_2 treat_1 treat_2
#> colData names(1): condition
```

**Explanation:** `DESeqDataSetFromMatrix()` ties three things into one S4 object: the count matrix, the sample metadata (`colData` rows must align by name with `countData` columns), and the linear-model formula (`design`). Setting the factor `levels = c("ctrl", "treat")` explicitly is the cleanest way to fix the reference level so DESeq2 reports log2 fold change as `treat / ctrl`. Without it, the alphabetical default still happens to be correct here, but production code should never rely on alphabetical luck.

</details>

### Exercise 4.2: Extract genes that pass a 5 percent FDR cutoff

**Task:** The PI asks for the genes that pass a 5 percent FDR cutoff and wants them ranked from most to least significant. Given a tibble `de_res` with columns `gene`, `log2FoldChange`, `pvalue`, `padj`, keep only rows where `padj` is non-missing and below 0.05, sort by `padj` ascending, and save the filtered ranked tibble to `ex_4_2`.

**Expected result:**

```
#> # A tibble: 3 x 4
#>   gene  log2FoldChange   pvalue    padj
#>   <chr>          <dbl>    <dbl>   <dbl>
#> 1 g1              2.20 1.10e-08 5.0e-08
#> 2 g4             -1.40 4.00e-05 1.2e-04
#> 3 g2              0.80 1.20e-03 2.5e-03
```

**Difficulty:** Advanced

[HINTS]
Significance is decided by the adjusted p-value, and missing adjusted values should be excluded before ranking from strongest to weakest evidence.
Pipe `de_res` through `filter(!is.na(padj), padj < 0.05)` then `arrange(padj)`.

```r title="Your turn"
de_res <- tibble(
  gene           = c("g1", "g2", "g3", "g4", "g5"),
  log2FoldChange = c(2.20, 0.80, 0.10, -1.40, 0.30),
  pvalue         = c(1.1e-08, 1.2e-03, 0.45, 4.0e-05, 0.20),
  padj           = c(5.0e-08, 2.5e-03, 0.60, 1.2e-04, 0.35)
)
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
de_res <- tibble(
  gene           = c("g1", "g2", "g3", "g4", "g5"),
  log2FoldChange = c(2.20, 0.80, 0.10, -1.40, 0.30),
  pvalue         = c(1.1e-08, 1.2e-03, 0.45, 4.0e-05, 0.20),
  padj           = c(5.0e-08, 2.5e-03, 0.60, 1.2e-04, 0.35)
)
ex_4_2 <- de_res |>
  filter(!is.na(padj), padj < 0.05) |>
  arrange(padj)
ex_4_2
#> # A tibble: 3 x 4
#>   gene  log2FoldChange   pvalue    padj
#>   <chr>          <dbl>    <dbl>   <dbl>
#> 1 g1              2.20 1.10e-08 5.0e-08
#> 2 g4             -1.40 4.00e-05 1.2e-04
#> 3 g2              0.80 1.20e-03 2.5e-03
```

**Explanation:** Two things deserve attention. First, `padj` is intentionally NA for genes that DESeq2 filtered out via independent filtering, so `padj < 0.05` alone silently drops NAs but checking `!is.na(padj)` first is the explicit, reviewer-friendly version. Second, sorting by `padj` rather than `pvalue` is the convention for ranked output because adjusted p-values are what control the false discovery rate. Never report unadjusted p-values as "significant genes" in a manuscript.

</details>

### Exercise 4.3: Compute log2 fold change from group means

**Task:** A reviewer challenges the team to confirm the fold changes from DESeq2 by hand from the per-group mean expression. Given a tibble with columns `gene`, `ctrl_mean`, `treat_mean` containing the per-condition normalized means, compute a new column `log2fc` equal to log2(treat_mean / ctrl_mean), and save the augmented tibble to `ex_4_3`.

**Expected result:**

```
#> # A tibble: 4 x 4
#>   gene  ctrl_mean treat_mean log2fc
#>   <chr>     <dbl>      <dbl>  <dbl>
#> 1 g1         11         49    2.16
#> 2 g2        105        101.5 -0.0489
#> 3 g3          0.5        1    1.00
#> 4 g4        510        205   -1.31
```

**Difficulty:** Intermediate

[HINTS]
Fold change is the ratio of treated to control expression, expressed on a base-2 log scale so that a doubling reads as one unit.
Use `mutate()` to add `log2fc = log2(treat_mean / ctrl_mean)`.

```r title="Your turn"
group_means <- tibble(
  gene       = c("g1", "g2", "g3", "g4"),
  ctrl_mean  = c(11, 105, 0.5, 510),
  treat_mean = c(49, 101.5, 1, 205)
)
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
group_means <- tibble(
  gene       = c("g1", "g2", "g3", "g4"),
  ctrl_mean  = c(11, 105, 0.5, 510),
  treat_mean = c(49, 101.5, 1, 205)
)
ex_4_3 <- group_means |>
  mutate(log2fc = log2(treat_mean / ctrl_mean))
ex_4_3
#> # A tibble: 4 x 4
#>   gene  ctrl_mean treat_mean log2fc
#>   <chr>     <dbl>      <dbl>  <dbl>
#> 1 g1         11         49    2.16
#> 2 g2        105        101.5 -0.0489
#> 3 g3          0.5        1    1.00
#> 4 g4        510        205   -1.31
```

**Explanation:** `log2(treat / ctrl)` is the canonical signed effect size in genomics because every unit on the log2 scale is a doubling: a log2fc of 1 means treated samples are 2x control, -1 means 0.5x. Genes with zero in either group blow up to `-Inf` or `+Inf`, which is why production pipelines add a small pseudo-count or rely on DESeq2 / edgeR shrinkage estimators rather than raw ratios. Always confirm the sign convention is `treat / ctrl`, not `ctrl / treat`, before interpreting up vs down.

</details>

## Section 5. Visualization and enrichment (3 problems)

### Exercise 5.1: Build a volcano plot of DE results

**Task:** A grant figure needs a volcano plot showing every gene's effect size on the x axis and statistical evidence on the y axis, coloured by significance. Given a DE results tibble `de_res` with `log2FoldChange`, `padj`, and `gene` columns, build a ggplot2 figure with `geom_point()` mapped to those columns, colour by `padj < 0.05`, label the axes, and save the plot object to `ex_5_1`.

**Expected result:**

```
# A ggplot object: scatter of log2FoldChange (x) vs -log10(padj) (y),
# points coloured by significance flag (padj < 0.05). One point per gene.
```

**Difficulty:** Advanced

[HINTS]
A volcano plot puts effect size on the x axis and strength of evidence on the y axis, with points coloured by whether they clear the significance cutoff.
Build a `ggplot()` with `aes(x = log2FoldChange, y = -log10(padj), color = padj < 0.05)` and add `geom_point()`.

```r title="Your turn"
de_res <- tibble(
  gene           = c("g1", "g2", "g3", "g4", "g5"),
  log2FoldChange = c(2.20, 0.80, 0.10, -1.40, 0.30),
  padj           = c(5.0e-08, 2.5e-03, 0.60, 1.2e-04, 0.35)
)
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
de_res <- tibble(
  gene           = c("g1", "g2", "g3", "g4", "g5"),
  log2FoldChange = c(2.20, 0.80, 0.10, -1.40, 0.30),
  padj           = c(5.0e-08, 2.5e-03, 0.60, 1.2e-04, 0.35)
)
ex_5_1 <- ggplot(de_res, aes(x = log2FoldChange,
                             y = -log10(padj),
                             color = padj < 0.05)) +
  geom_point(size = 3) +
  scale_color_manual(values = c("FALSE" = "grey60", "TRUE" = "firebrick"),
                     name = "FDR < 5%") +
  labs(x = "log2 fold change",
       y = "-log10 adjusted p-value",
       title = "Volcano plot") +
  theme_minimal()
ex_5_1
# A ggplot scatter, three red significant genes and two grey not-significant.
```

**Explanation:** The volcano gets its name from the V-shape that appears when many genes have small fold changes near zero clustered at low y, and the highly significant up/down regulated genes splay outward to the upper left and right. Mapping `color = padj < 0.05` (a logical) creates a discrete two-level scale that `scale_color_manual` can recolour directly. Common upgrades are adding `geom_text_repel()` from ggrepel for top gene labels and dashed `geom_hline`/`geom_vline` at the significance thresholds.

</details>

### Exercise 5.2: Heatmap of the top variable genes

**Task:** A reviewer wants a heatmap of the 20 most variable genes across samples for the manuscript discussion section. Starting from a 50-gene by 6-sample CPM matrix `cpm_mat` (built in the setup below), compute per-gene variance across columns, take the 20 rows with the largest variance, build a `pheatmap()` of that subset with row scaling, and save the heatmap object to `ex_5_2`.

**Expected result:**

```
# A pheatmap object: 20 rows (top variable genes) x 6 columns (samples),
# z-score scaled across rows, default red/blue diverging colour palette,
# row and column dendrograms drawn by complete linkage.
```

**Difficulty:** Advanced

[HINTS]
Keep only the genes that vary most across samples, then draw a row-scaled heatmap so the colours show relative rather than absolute expression.
Compute per-row variance with `apply(cpm_mat, 1, var)`, take the top 20 with `order(..., decreasing = TRUE)`, and pass that subset to `pheatmap()` with `scale = "row"`.

```r title="Your turn"
cpm_mat <- matrix(rnorm(50 * 6, mean = 10, sd = 2), nrow = 50,
                  dimnames = list(paste0("g", 1:50),
                                  paste0("s", 1:6)))
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
cpm_mat <- matrix(rnorm(50 * 6, mean = 10, sd = 2), nrow = 50,
                  dimnames = list(paste0("g", 1:50),
                                  paste0("s", 1:6)))
row_var <- apply(cpm_mat, 1, var)
top_idx <- order(row_var, decreasing = TRUE)[1:20]
ex_5_2 <- pheatmap(cpm_mat[top_idx, ],
                   scale = "row",
                   main = "Top 20 variable genes")
# A 20 x 6 heatmap, row z-scored.
```

**Explanation:** Filtering to the top-variance rows is the standard trick to keep heatmaps interpretable: showing every gene buries the signal in noise. `scale = "row"` z-scores each gene independently so the colours encode relative expression across samples, not absolute level, which is almost always what you want for sample clustering. For more publication-ready output, swap `pheatmap` for `ComplexHeatmap`, which supports annotation tracks and split rows.

</details>

### Exercise 5.3: Top 5 enriched GO biological process terms

**Task:** A senior scientist asks for the top 5 enriched biological-process GO terms for the upregulated gene set after FDR adjustment. Given a stand-in `enrich_df` data.frame with columns `Description`, `pvalue`, `p.adjust`, sort by `p.adjust` ascending, take the first 5 rows of `Description` and `p.adjust`, and save the result tibble to `ex_5_3`.

**Expected result:**

```
#> # A tibble: 5 x 2
#>   Description                       p.adjust
#>   <chr>                                <dbl>
#> 1 immune response                    2.0e-12
#> 2 cytokine production                5.0e-10
#> 3 leukocyte activation               1.0e-08
#> 4 inflammatory response              4.0e-07
#> 5 response to bacterium              2.0e-06
```

**Difficulty:** Advanced

[HINTS]
Rank the terms by their adjusted significance, keep just the term name and that value, then trim down to the leading five rows.
Pipe through `arrange(p.adjust)`, `select(Description, p.adjust)`, and `slice(1:5)`.

```r title="Your turn"
enrich_df <- tibble(
  Description = c("immune response", "cytokine production",
                  "leukocyte activation", "inflammatory response",
                  "response to bacterium", "translation",
                  "cell cycle"),
  pvalue      = c(1e-13, 4e-11, 7e-10, 3e-08, 1e-07, 2e-04, 1e-02),
  p.adjust    = c(2e-12, 5e-10, 1e-08, 4e-07, 2e-06, 3e-03, 1e-01)
)
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
enrich_df <- tibble(
  Description = c("immune response", "cytokine production",
                  "leukocyte activation", "inflammatory response",
                  "response to bacterium", "translation",
                  "cell cycle"),
  pvalue      = c(1e-13, 4e-11, 7e-10, 3e-08, 1e-07, 2e-04, 1e-02),
  p.adjust    = c(2e-12, 5e-10, 1e-08, 4e-07, 2e-06, 3e-03, 1e-01)
)
ex_5_3 <- enrich_df |>
  arrange(p.adjust) |>
  select(Description, p.adjust) |>
  slice(1:5)
ex_5_3
#> # A tibble: 5 x 2
#>   Description            p.adjust
#> 1 immune response         2.0e-12
#> 2 cytokine production     5.0e-10
#> 3 leukocyte activation    1.0e-08
#> 4 inflammatory response   4.0e-07
#> 5 response to bacterium   2.0e-06
```

**Explanation:** In a real workflow, `enrichGO()` from `clusterProfiler` returns an `enrichResult` S4 object whose `result` slot is the data.frame you would feed into this same pipeline. The cleaned tibble that comes out is exactly the shape stakeholders want in a slide deck: term name and FDR, ordered. Always cite the gene universe used (all genes detected, not all genes in the genome) because using the wrong universe is the most common reason GO enrichments fail to replicate.

</details>

## Section 6. End-to-end workflows (3 problems)

### Exercise 6.1: Per-sample QC summary from a count matrix

**Task:** A QC dashboard needs per-sample stats so the team can spot outliers before running DESeq2. Using the original count matrix `ex_3_1` from Exercise 3.1, compute for each sample the library size (column sum), the number of detected genes (count greater than zero), and the median nonzero count, returning a tibble with one row per sample, and save to `ex_6_1`.

**Expected result:**

```
#> # A tibble: 4 x 4
#>   sample  lib_size detected median_nonzero
#>   <chr>      <int>    <int>          <dbl>
#> 1 ctrl_1       610        3           100
#> 2 ctrl_2       643        4           111
#> 3 treat_1      357        4            77.5
#> 4 treat_2      356        3            98
```

**Difficulty:** Intermediate

[HINTS]
For each sample you need three numbers: its total reads, how many genes were detected, and the typical size of a nonzero count.
Build a `tibble()` using `colSums()` for library size, `colSums(ex_3_1 > 0)` for detected genes, and `apply(ex_3_1, 2, ...)` taking a median over nonzero values.

```r title="Your turn"
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_1 <- tibble(
  sample         = colnames(ex_3_1),
  lib_size       = colSums(ex_3_1),
  detected       = colSums(ex_3_1 > 0),
  median_nonzero = apply(ex_3_1, 2, function(x) median(x[x > 0]))
)
ex_6_1
#> # A tibble: 4 x 4
#>   sample  lib_size detected median_nonzero
#>   <chr>      <int>    <int>          <dbl>
#> 1 ctrl_1       610        3           100
#> 2 ctrl_2       643        4           111
#> 3 treat_1      357        4            77.5
#> 4 treat_2      356        3            98
```

**Explanation:** Library size and detection rate are the two QC numbers every RNA-seq report opens with: low library size flags failed sequencing, low detection rate flags failed RNA. The median nonzero count protects against the long zero-inflated tail that a plain `median()` would collapse to zero. The `apply(x, 2, ...)` walks columns and is the right answer when there is no vectorised column summary that already implements your reducer.

</details>

### Exercise 6.2: Export a GRanges to a BED-style tibble

**Task:** A collaborator using bedtools asks for the GRanges from Exercise 2.1 as a BED-style tibble with the standard six columns `chrom, start, end, name, score, strand`, where `name` is `peak_1, peak_2, peak_3`, `score` is fixed at 1000, and the start coordinate is converted from 1-based inclusive to 0-based half-open. Save the tibble to `ex_6_2`.

**Expected result:**

```
#> # A tibble: 3 x 6
#>   chrom start   end name   score strand
#>   <chr> <dbl> <dbl> <chr>  <dbl> <chr>
#> 1 chr1    999  1199 peak_1  1000 +
#> 2 chr1   4999  5299 peak_2  1000 +
#> 3 chr1  11999 12249 peak_3  1000 +
```

**Difficulty:** Advanced

[HINTS]
BED uses 0-based half-open coordinates, so the start coordinate shifts down by one while the end stays as is.
Build a `tibble()` using the `seqnames()`, `start()`, `end()`, and `strand()` accessors, subtracting `1L` from the start.

```r title="Your turn"
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_2 <- tibble(
  chrom  = as.character(seqnames(ex_2_1)),
  start  = start(ex_2_1) - 1L,
  end    = end(ex_2_1),
  name   = paste0("peak_", seq_along(ex_2_1)),
  score  = 1000,
  strand = as.character(strand(ex_2_1))
)
ex_6_2
#> # A tibble: 3 x 6
#>   chrom start   end name   score strand
#> 1 chr1    999  1199 peak_1  1000 +
#> 2 chr1   4999  5299 peak_2  1000 +
#> 3 chr1  11999 12249 peak_3  1000 +
```

**Explanation:** BED files use 0-based half-open coordinates: a 200 bp interval starting at base 1000 in GRanges (1000-1199 inclusive) is encoded as `start = 999, end = 1199` in BED. Forgetting to subtract one from start is the single most common BED export bug, because the off-by-one only shifts intervals by one base and is easy to miss in spot checks. Production code uses `rtracklayer::export.bed()` which handles this conversion automatically, but rolling your own makes the convention visible.

</details>

### Exercise 6.3: Annotate each peak with the nearest gene

**Task:** A ChIP-seq follow-up needs every peak labelled with the nearest gene id and the distance to that gene's TSS. Given the peak GRanges `ex_2_1` on chr1 and a TSS GRanges with three genes at positions 800, 5200, and 11000, use `distanceToNearest()` to find the nearest gene index per peak, attach the gene id and distance as metadata columns, and save the augmented GRanges to `ex_6_3`.

**Expected result:**

```
#> GRanges object with 3 ranges and 2 metadata columns:
#>       seqnames      ranges strand |   gene_id  distance
#>          <Rle>   <IRanges>  <Rle> | <character> <integer>
#>   [1]     chr1  1000-1199      + |     GENE1       0
#>   [2]     chr1  5000-5299      + |     GENE2       0
#>   [3]     chr1 12000-12249     + |     GENE3     1000
```

**Difficulty:** Advanced

[HINTS]
Each peak needs the closest gene and the gap to it, which is a nearest-neighbour search between the two interval sets.
Call `distanceToNearest()` on the peaks and TSS, then attach `gene_id` and `distance` via `mcols()`, indexing the genes with `subjectHits()`.

```r title="Your turn"
tss <- GRanges("chr1", IRanges(c(800, 5200, 11000), width = 1),
               gene_id = c("GENE1", "GENE2", "GENE3"))
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
tss <- GRanges("chr1", IRanges(c(800, 5200, 11000), width = 1),
               gene_id = c("GENE1", "GENE2", "GENE3"))
hits <- distanceToNearest(ex_2_1, tss)
ex_6_3 <- ex_2_1
mcols(ex_6_3)$gene_id  <- tss$gene_id[subjectHits(hits)]
mcols(ex_6_3)$distance <- mcols(hits)$distance
ex_6_3
#> GRanges object with 3 ranges and 2 metadata columns:
#>       seqnames      ranges strand |   gene_id  distance
#>   [1]     chr1  1000-1199      + |     GENE1       0
#>   [2]     chr1  5000-5299      + |     GENE2       0
#>   [3]     chr1 12000-12249     + |     GENE3     1000
```

**Explanation:** `distanceToNearest()` is the workhorse for peak-to-gene annotation: it returns a `Hits` object whose `distance` column is the gap between query and the chosen subject, with 0 when they overlap. Peaks 1 and 2 overlap GENE1 (800) and GENE2 (5200) respectively, so their distances are 0; peak 3 (12000-12249) is 1000 bp from GENE3 (11000). For production work, swap in `ChIPseeker::annotatePeak()`, which adds TSS region classification (promoter, intron, distal) and is the standard for ChIP-seq reports.

</details>

## What to do next

- **[R-for-Biostatistics-Exercises.html](R-for-Biostatistics-Exercises.html)**: clinical-trial and survival-analysis drills using the same exercise format.
- **[Linear-Regression-Exercises.html](Linear-Regression-Exercises.html)**: practice modelling expression and phenotype with `lm()` and diagnostics.
- **[dplyr-Exercises-in-R.html](dplyr-Exercises-in-R.html)**: sharpen the data-wrangling verbs every genomics workflow leans on.
- **[R-Tutorial.html](R-Tutorial.html)**: the parent tutorial hub if you need a refresher on R basics first.
