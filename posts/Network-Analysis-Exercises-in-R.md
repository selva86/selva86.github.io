---
title: "Network Analysis Exercises in R: 15 Practice Problems"
slug: "Network-Analysis-Exercises-in-R"
description: "Master network analysis in R with 15 practice problems: igraph, degree, centrality, communities, paths. Hidden solutions."
keywords: "network analysis R exercises, igraph R practice, R graph theory exercises, network centrality R"
mathjax: false
webr: true
date: "2026-05-11"
post_type: "EX"
sidebar_title: "Network Analysis Exercises"
sidebar_order: 167
fr_parent: "R-Tutorial.html"
auto_link_terms: "network analysis R exercises|igraph R practice|R graph theory exercises"
auto_link_case_sensitive: false
target_keyword: "network analysis R exercises"
sibling_block_enabled: false
difficulty: "Advanced"
---

# Network Analysis Exercises in R: 15 Practice Problems

<p class="lead">Fifteen practice problems on network analysis in R with igraph: degrees, centrality, communities, paths, viz.</p>

```r title="Run this once before any exercise"
library(igraph)
```

### Exercise 1: Create graph from edges

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
graph_from_literal(A-B, B-C, C-D, A-D)
```

</details>

### Exercise 2: Number of nodes/edges

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
g <- graph_from_literal(A-B, B-C, C-D)
list(vcount = vcount(g), ecount = ecount(g))
```

</details>

### Exercise 3: Degree

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
g <- graph_from_literal(A-B, B-C, C-D, A-D)
degree(g)
```

</details>

### Exercise 4: Adjacency matrix

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
g <- graph_from_literal(A-B, B-C, C-D)
as_adjacency_matrix(g)
```

</details>

### Exercise 5: Plot

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
g <- graph_from_literal(A-B, B-C, C-D, A-D)
plot(g)
```

</details>

### Exercise 6: Directed graph

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
g <- graph_from_literal(A-+B, B-+C)
plot(g)
```

</details>

### Exercise 7: Betweenness centrality

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
g <- graph_from_literal(A-B, B-C, C-D, A-D, B-D)
betweenness(g)
```

</details>

### Exercise 8: Closeness

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
g <- graph_from_literal(A-B, B-C, C-D, A-D)
closeness(g)
```

</details>

### Exercise 9: Eigenvector centrality

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
g <- graph_from_literal(A-B, B-C, C-D, A-D)
eigen_centrality(g)$vector
```

</details>

### Exercise 10: Shortest path

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
g <- graph_from_literal(A-B, B-C, C-D, A-D)
shortest_paths(g, from = "A", to = "C")
```

</details>

### Exercise 11: Connected components

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
g <- graph_from_literal(A-B, C-D, E-F)
components(g)
```

</details>

### Exercise 12: Community detection (Louvain)

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
g <- erdos.renyi.game(20, 0.2)
cluster_louvain(g)
```

</details>

### Exercise 13: Edge list to data frame

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
g <- graph_from_literal(A-B, B-C, C-D)
as_data_frame(g)
```

</details>

### Exercise 14: Read from data frame

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
edges <- data.frame(from = c("A","B","C"), to = c("B","C","D"))
graph_from_data_frame(edges)
```

</details>

### Exercise 15: Density

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
g <- graph_from_literal(A-B, B-C, C-D, A-D, B-D)
edge_density(g)
```

</details>

## What to do next

- **Spatial-Analysis-Exercises** (shipped) — geographic networks.
- **Data-Visualization-Exercises** (shipped) — viz network plots.
