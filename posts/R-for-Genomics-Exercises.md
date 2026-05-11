---
title: "R for Genomics Exercises: 15 Practice Problems"
slug: "R-for-Genomics-Exercises"
description: "Master genomics in R with 15 practice problems: Bioconductor, differential expression, sequence data, ranges, plots. Hidden solutions."
keywords: "R genomics exercises, Bioconductor R practice, RNA-seq R, GenomicRanges R, R for biologists"
mathjax: false
webr: false
date: "2026-05-11"
post_type: "EX"
sidebar_title: "R for Genomics"
sidebar_order: 158
fr_parent: "R-Tutorial.html"
auto_link_terms: "R genomics exercises|Bioconductor R practice|RNA-seq R|GenomicRanges R"
auto_link_case_sensitive: false
target_keyword: "R genomics exercises"
sibling_block_enabled: false
difficulty: "Advanced"
---

# R for Genomics Exercises: 15 Practice Problems

<p class="lead">Fifteen practice problems for genomics in R using Bioconductor: ranges, sequences, RNA-seq counts, differential expression. Hidden solutions.</p>

```r title="Run this once before any exercise"
# library(Biostrings); library(GenomicRanges); library(DESeq2); library(edgeR)
```

### Exercise 1: DNA string

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
# Biostrings::DNAString("ACGTACGT")
```

</details>

### Exercise 2: Reverse complement

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
# Biostrings::reverseComplement(Biostrings::DNAString("ACGT"))
```

</details>

### Exercise 3: GC content

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
# s <- Biostrings::DNAString("ACGTACGTGG")
# sum(letterFrequency(s, c("G","C"))) / length(s)
```

</details>

### Exercise 4: Build GRanges

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
# GenomicRanges::GRanges(seqnames = "chr1",
#                       ranges = IRanges::IRanges(start = c(100, 200), end = c(150, 250)))
```

</details>

### Exercise 5: Find overlapping ranges

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
# gr1 <- GRanges("chr1", IRanges(100, 200))
# gr2 <- GRanges("chr1", IRanges(150, 250))
# findOverlaps(gr1, gr2)
```

</details>

### Exercise 6: Subset to a chromosome

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
# gr[seqnames(gr) == "chr1"]
```

</details>

### Exercise 7: Read a FASTA

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
# Biostrings::readDNAStringSet("seqs.fasta")
```

</details>

### Exercise 8: Read RNA-seq counts

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
# counts <- read.delim("counts.tsv", row.names = 1)
# dim(counts)
```

</details>

### Exercise 9: DESeq2 design

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
# coldata <- data.frame(condition = c("ctrl","ctrl","treat","treat"))
# dds <- DESeq2::DESeqDataSetFromMatrix(countData = counts, colData = coldata,
#                                       design = ~ condition)
```

</details>

### Exercise 10: Run DESeq2

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
# dds <- DESeq2::DESeq(dds)
# res <- DESeq2::results(dds)
# head(res[order(res$padj), ])
```

</details>

### Exercise 11: Volcano plot

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
# library(ggplot2)
# res_df <- as.data.frame(res); res_df$sig <- res_df$padj < 0.05
# ggplot(res_df, aes(log2FoldChange, -log10(padj), color = sig)) + geom_point()
```

</details>

### Exercise 12: edgeR alternative

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
# y <- edgeR::DGEList(counts = counts, group = c("ctrl","ctrl","treat","treat"))
# y <- edgeR::calcNormFactors(y)
# y <- edgeR::estimateDisp(y)
# fit <- edgeR::glmQLFit(y, design)
```

</details>

### Exercise 13: GO enrichment (concept)

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
# clusterProfiler::enrichGO(gene = up_genes, OrgDb = org.Hs.eg.db,
#                          ont = "BP", pAdjustMethod = "BH")
```

</details>

### Exercise 14: Save GRanges to BED

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
# rtracklayer::export.bed(gr, "out.bed")
```

</details>

### Exercise 15: Annotate genes near peaks

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
# ChIPseeker::annotatePeak(peaks, tssRegion = c(-2000, 2000), TxDb = txdb)
```

</details>

## What to do next

- **R-for-Biostatistics-Exercises** (shipped) — clinical stats.
- **Linear-Regression-Exercises** (shipped) — model expression vs phenotype.
