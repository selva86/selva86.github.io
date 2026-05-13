---
title: "Network Analysis Exercises in R: 20 Practice Problems with igraph"
slug: "Network-Analysis-Exercises-in-R"
description: "20 hands-on network analysis exercises in R with igraph: build graphs, centrality, communities, shortest paths, components. Hidden solutions, real workflows."
keywords: "network analysis R exercises, igraph R practice, R graph theory exercises, network centrality R, community detection R"
mathjax: false
webr: true
date: "2026-05-13"
post_type: "EX"
sidebar_title: "Network Analysis Exercises"
sidebar_order: 167
fr_parent: "R-Tutorial.html"
auto_link_terms: "network analysis R exercises|igraph R practice|graph theory R|community detection R|centrality measures R"
auto_link_case_sensitive: false
target_keyword: "network analysis R exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# Network Analysis Exercises in R: 20 Practice Problems with igraph

<p class="lead">Twenty practice problems that walk through real network analysis workflows in R: construction, degree and density, four centrality families, shortest paths, components, community detection, and ego subgraphs. Solutions are hidden and revealed on click.</p>

```r title="Run this once before any exercise"
library(igraph)
library(dplyr)
```

## Section 1. Building and inspecting graphs (3 problems)

### Exercise 1.1: Build an undirected friendship graph from an edge list

**Task:** A sociologist is encoding a small office friendship survey where seven coworkers (Ada, Ben, Cleo, Dan, Eva, Finn, Gia) reported mutual friendships: Ada-Ben, Ada-Cleo, Ben-Cleo, Cleo-Dan, Dan-Eva, Eva-Finn, Finn-Gia, Gia-Eva. Build an undirected igraph object from this two-column edge list using `graph_from_data_frame()` and save it to `ex_1_1`.

**Expected result:**

```
#> IGRAPH 4a1b2c3 UN-- 7 8 --
#> + attr: name (v/c)
#> + edges from 4a1b2c3 (vertex names):
#> [1] Ada --Ben  Ada --Cleo Ben --Cleo Cleo--Dan  Dan --Eva  Eva --Finn
#> [7] Finn--Gia  Gia --Eva
```

**Difficulty:** Beginner

```r title="Your turn"
edges <- data.frame(
  from = c("Ada","Ada","Ben","Cleo","Dan","Eva","Finn","Gia"),
  to   = c("Ben","Cleo","Cleo","Dan","Eva","Finn","Gia","Eva")
)
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
edges <- data.frame(
  from = c("Ada","Ada","Ben","Cleo","Dan","Eva","Finn","Gia"),
  to   = c("Ben","Cleo","Cleo","Dan","Eva","Finn","Gia","Eva")
)
ex_1_1 <- graph_from_data_frame(edges, directed = FALSE)
ex_1_1
#> IGRAPH UN-- 7 8 --
#> + attr: name (v/c)
```

**Explanation:** `graph_from_data_frame()` is the workhorse constructor when your raw data is a tidy edge list, which is how networks are usually stored in databases or CSV exports. The first two columns become the edge endpoints; any extra columns become edge attributes automatically. Passing `directed = FALSE` produces an undirected graph (note the `UN--` flag in the summary). For directed networks (followers, citations, transactions), set `directed = TRUE`.

</details>

### Exercise 1.2: Inspect graph topology with vcount, ecount, and is_directed

**Task:** Continuing from Exercise 1.1, the same sociologist now needs a quick summary for the report: the number of vertices, the number of edges, whether the graph is directed, and whether it is simple (no loops or multi-edges). Build a named list with elements `n`, `m`, `directed`, `simple` from `ex_1_1` and save the list to `ex_1_2`.

**Expected result:**

```
#> $n
#> [1] 7
#>
#> $m
#> [1] 8
#>
#> $directed
#> [1] FALSE
#>
#> $simple
#> [1] TRUE
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- list(
  n        = vcount(ex_1_1),
  m        = ecount(ex_1_1),
  directed = is_directed(ex_1_1),
  simple   = is_simple(ex_1_1)
)
ex_1_2
#> $n
#> [1] 7
#> $m
#> [1] 8
#> $directed
#> [1] FALSE
#> $simple
#> [1] TRUE
```

**Explanation:** These four predicates are the first thing you check on any graph object: shape (n, m), orientation (directed yes/no), and whether the data is clean (no self-loops, no parallel edges). `is_simple()` returns `FALSE` if the graph has either loops or multi-edges, and the common fix is `simplify(g, remove.multiple = TRUE, remove.loops = TRUE)`. Confirming simplicity early prevents subtle metric bugs: degree counts double-count multi-edges, and shortest-path algorithms treat self-loops as zero-cost detours.

</details>

### Exercise 1.3: Attach vertex attributes (department) and access them

**Task:** The HR team adds department metadata to the seven coworkers from Exercise 1.1: Ada and Ben are in Sales, Cleo and Dan are in Engineering, Eva is in Marketing, Finn and Gia are in Sales. Attach a `dept` vertex attribute to `ex_1_1` and save the resulting graph as `ex_1_3`. Then verify by retrieving the attribute vector.

**Expected result:**

```
#> [1] "Sales"       "Sales"       "Engineering" "Engineering"
#> [5] "Marketing"   "Sales"       "Sales"
```

**Difficulty:** Intermediate

```r title="Your turn"
dept_map <- c(Ada="Sales", Ben="Sales", Cleo="Engineering",
              Dan="Engineering", Eva="Marketing", Finn="Sales", Gia="Sales")
ex_1_3 <- # your code here
V(ex_1_3)$dept
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
dept_map <- c(Ada="Sales", Ben="Sales", Cleo="Engineering",
              Dan="Engineering", Eva="Marketing", Finn="Sales", Gia="Sales")
ex_1_3 <- ex_1_1
V(ex_1_3)$dept <- dept_map[V(ex_1_3)$name]
V(ex_1_3)$dept
#> [1] "Sales" "Sales" "Engineering" "Engineering" "Marketing" "Sales" "Sales"
```

**Explanation:** Vertex attributes are how you carry "real-world meaning" inside the graph object so that downstream filtering, coloring, and community comparison work without external joins. The pattern `V(g)$attr <- value` assigns; `V(g)$attr` reads. Indexing `dept_map` by `V(g)$name` is the safe alignment trick: it tolerates a different vertex order than the source data. Edge attributes follow the symmetric pattern with `E(g)$weight <- ...`.

</details>

## Section 2. Degree, density, and transitivity (3 problems)

### Exercise 2.1: Compute the degree of each vertex and identify the most connected node

**Task:** A growth team analyzing the friendship graph from Exercise 1.1 wants to spot the most socially connected employee for a referral pilot. Compute the degree of every vertex of `ex_1_1`, then return a tibble with columns `name` and `degree` sorted descending by degree. Save the tibble to `ex_2_1`.

**Expected result:**

```
#> # A tibble: 7 x 2
#>   name  degree
#>   <chr>  <dbl>
#> 1 Cleo       3
#> 2 Eva        3
#> 3 Ada        2
#> 4 Ben        2
#> 5 Dan        2
#> 6 Finn       2
#> 7 Gia        2
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
deg <- degree(ex_1_1)
ex_2_1 <- tibble(name = names(deg), degree = deg) |>
  arrange(desc(degree))
ex_2_1
#> # A tibble: 7 x 2
#>   name  degree
#>   <chr>  <dbl>
#> 1 Cleo       3
#> 2 Eva        3
#> 3 Ada        2
#> ...
```

**Explanation:** Degree is the simplest and most interpretable centrality: the number of incident edges. Top-degree nodes are usually your "hub" candidates for seeding diffusion experiments, but degree alone is biased toward visibility, not structural importance, which is why we layer in betweenness and eigenvector centrality later. For directed graphs, pass `mode = "in"`, `"out"`, or `"all"` to distinguish follower count from following count.

</details>

### Exercise 2.2: Plot the degree distribution and identify any power-law shape

**Task:** A network researcher reviewing a 200-node Barabasi-Albert preferential attachment graph wants to verify the well-known heavy-tailed degree pattern. Generate a sample BA graph with `sample_pa(200, power = 1.2, m = 2, directed = FALSE)` using `set.seed(42)` for reproducibility, then compute the degree distribution as a named numeric vector (degree -> frequency). Save the distribution to `ex_2_2`.

**Expected result:**

```
#> Approximate (set.seed(42)):
#>   1    2    3    4    5    6    7    8   10   12   15   22
#> 0.405 0.225 0.110 0.075 0.040 0.035 0.025 ...
```

**Difficulty:** Intermediate

```r title="Your turn"
set.seed(42)
g_ba <- sample_pa(200, power = 1.2, m = 2, directed = FALSE)
ex_2_2 <- # your code here
head(ex_2_2, 10)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)
g_ba <- sample_pa(200, power = 1.2, m = 2, directed = FALSE)
ex_2_2 <- degree_distribution(g_ba)
names(ex_2_2) <- seq(0, length(ex_2_2) - 1)
head(ex_2_2, 10)
#>     0     1     2     3     4     5     6     7     8     9
#> 0.000 0.405 0.225 0.110 0.075 0.040 0.035 0.025 0.020 0.015
```

**Explanation:** `degree_distribution()` returns probabilities indexed from degree 0 upward, which is convenient for fitting a power-law tail with `fit_power_law()` from igraph. The Barabasi-Albert model produces a heavy-tailed distribution because new nodes preferentially attach to high-degree existing nodes, a process that shows up empirically in citation networks, web graphs, and protein interactions. If the head of the distribution looks roughly geometric instead, suspect Erdos-Renyi sampling, not preferential attachment.

</details>

### Exercise 2.3: Compute edge density and global transitivity (clustering coefficient)

**Task:** A research team comparing two student social networks (one from a high school, one from a graduate seminar) needs the two most basic structural metrics: edge density (how saturated the graph is) and global transitivity (how often friends of friends are also friends). Compute both for `ex_1_1` and return them as a named numeric vector `c(density = ..., transitivity = ...)` saved to `ex_2_3`.

**Expected result:**

```
#>      density transitivity
#>    0.3809524    0.6000000
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- c(
  density      = edge_density(ex_1_1),
  transitivity = transitivity(ex_1_1, type = "global")
)
ex_2_3
#>      density transitivity
#>    0.3809524    0.6000000
```

**Explanation:** Density is the ratio of observed edges to the maximum possible (`n*(n-1)/2` for undirected simple graphs), useful for comparing graphs of different sizes. Global transitivity is the proportion of connected triples that are closed into triangles, a classic measure of "small-world" structure. Real social networks typically show transitivity of 0.1 to 0.6 versus near-zero for random Erdos-Renyi graphs at the same density. Pass `type = "local"` to get a per-vertex clustering coefficient instead.

</details>

## Section 3. Centrality measures (4 problems)

### Exercise 3.1: Rank vertices by betweenness centrality

**Task:** An information security team mapping internal communication flows in a 30-employee firm wants to identify "broker" employees through which the most cross-team messages route. Using a karate-style sample graph from `make_graph("Zachary")`, compute betweenness centrality for every vertex, then return a tibble with `vertex`, `betweenness`, sorted descending. Save the top-10 rows to `ex_3_1`.

**Expected result:**

```
#> # A tibble: 10 x 2
#>    vertex betweenness
#>     <int>       <dbl>
#>  1      1       231.
#>  2     34       160.
#>  3     33       76.7
#>  4      3       75.9
#>  5     32       73.0
#>  ...
```

**Difficulty:** Advanced

```r title="Your turn"
g_kar <- make_graph("Zachary")
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
g_kar <- make_graph("Zachary")
btw <- betweenness(g_kar, directed = FALSE, normalized = FALSE)
ex_3_1 <- tibble(vertex = as.integer(V(g_kar)), betweenness = btw) |>
  arrange(desc(betweenness)) |>
  slice_head(n = 10)
ex_3_1
#> # A tibble: 10 x 2
#>    vertex betweenness
#>     <int>       <dbl>
#>  1      1       231.
#>  2     34       160.
#>  3     33        76.7
#>  ...
```

**Explanation:** Betweenness counts the fraction of shortest paths through each vertex, so high-betweenness nodes act as bottlenecks ("brokers") whose removal would fragment the graph. In Zachary's karate club, vertices 1 (the instructor) and 34 (the president) score highest, which matches the historical split. For graphs above ~10,000 nodes the exact algorithm gets expensive; pass `cutoff = k` to estimate from paths of length <= k, or use `estimate_betweenness()`.

</details>

### Exercise 3.2: Compute closeness centrality on a connected component

**Task:** A logistics planner studying a regional courier network wants to find the depot from which the average delivery distance to all other depots is shortest. Using the same Zachary karate graph as in 3.1 (it is connected), compute normalized closeness centrality, return the top-5 vertices by closeness in a tibble with columns `vertex`, `closeness`. Save the tibble to `ex_3_2`.

**Expected result:**

```
#> # A tibble: 5 x 2
#>   vertex closeness
#>    <int>     <dbl>
#> 1      1    0.569
#> 2      3    0.559
#> 3     34    0.550
#> 4     32    0.541
#> 5      9    0.516
```

**Difficulty:** Advanced

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
clo <- closeness(g_kar, normalized = TRUE)
ex_3_2 <- tibble(vertex = as.integer(V(g_kar)), closeness = clo) |>
  arrange(desc(closeness)) |>
  slice_head(n = 5)
ex_3_2
#> # A tibble: 5 x 2
#>   vertex closeness
#>    <int>     <dbl>
#> 1      1    0.569
#> 2      3    0.559
#> ...
```

**Explanation:** Closeness is the reciprocal of mean geodesic distance to every other vertex, so high-closeness nodes can reach the whole graph in few hops. Normalization (`normalized = TRUE`) scales by `n-1` so values are comparable across graph sizes. Closeness is poorly defined on disconnected graphs because some pairs have infinite distance; in practice, compute it on the largest connected component (use `components()` and `induced_subgraph()`). Closeness and betweenness often disagree: a node can be close to many others without being a broker.

</details>

### Exercise 3.3: Eigenvector centrality and the "important-friends" intuition

**Task:** A marketing analyst studying an influencer network on a niche platform wants a centrality score that rewards being connected to other high-status accounts, not just having many followers. Compute eigenvector centrality on the Zachary karate graph from Exercise 3.1, then build a tibble of the top-5 vertices with columns `vertex`, `eigen`. Save to `ex_3_3`.

**Expected result:**

```
#> # A tibble: 5 x 2
#>   vertex eigen
#>    <int> <dbl>
#> 1     34 1.00
#> 2      3 0.866
#> 3      1 0.853
#> 4      2 0.770
#> 5     33 0.733
```

**Difficulty:** Advanced

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
eig <- eigen_centrality(g_kar)$vector
ex_3_3 <- tibble(vertex = as.integer(V(g_kar)), eigen = eig) |>
  arrange(desc(eigen)) |>
  slice_head(n = 5)
ex_3_3
#> # A tibble: 5 x 2
#>   vertex eigen
#>    <int> <dbl>
#> 1     34  1.00
#> 2      3  0.866
#> 3      1  0.853
#> ...
```

**Explanation:** Eigenvector centrality is recursive: your score is proportional to the sum of your neighbors' scores. Mathematically it is the leading eigenvector of the adjacency matrix. It often disagrees with raw degree because a node with three well-connected friends scores higher than a node with five isolated ones. PageRank is essentially eigenvector centrality with random-restart damping, which fixes pathologies on directed graphs with dangling nodes; reach for `page_rank()` when handling web-style directed data.

</details>

### Exercise 3.4: PageRank on a directed citation graph

**Task:** A library data scientist studying a small academic citation graph of seven papers (P1 cites P2, P3; P2 cites P3; P3 cites P5; P4 cites P3, P5; P5 cites P6; P6 cites P7; P7 cites P3) wants the most "influential" paper by PageRank, accounting for the directed nature of citations. Build the directed graph inline, compute PageRank with default damping 0.85, return a tibble `paper`, `pagerank` sorted descending, saved to `ex_3_4`.

**Expected result:**

```
#> # A tibble: 7 x 2
#>   paper pagerank
#>   <chr>    <dbl>
#> 1 P3       0.296
#> 2 P5       0.181
#> 3 P7       0.105
#> 4 P6       0.099
#> 5 P2       0.083
#> ...
```

**Difficulty:** Intermediate

```r title="Your turn"
cites <- data.frame(
  from = c("P1","P1","P2","P3","P4","P4","P5","P6","P7"),
  to   = c("P2","P3","P3","P5","P3","P5","P6","P7","P3")
)
ex_3_4 <- # your code here
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
cites <- data.frame(
  from = c("P1","P1","P2","P3","P4","P4","P5","P6","P7"),
  to   = c("P2","P3","P3","P5","P3","P5","P6","P7","P3")
)
g_cite <- graph_from_data_frame(cites, directed = TRUE)
pr <- page_rank(g_cite, damping = 0.85)$vector
ex_3_4 <- tibble(paper = names(pr), pagerank = pr) |>
  arrange(desc(pagerank))
ex_3_4
#> # A tibble: 7 x 2
#>   paper pagerank
#>   <chr>    <dbl>
#> 1 P3       0.296
#> 2 P5       0.181
#> ...
```

**Explanation:** PageRank treats edges as directional endorsements and uses a random-walk-with-restart formulation: with probability `damping` the walker follows an outgoing edge, otherwise jumps to a uniform random vertex. The restart fixes two failure modes that break vanilla eigenvector centrality on directed graphs: dangling sinks and disconnected strongly-connected components. P3 wins here because four other papers cite it and one of those citers (P4) is itself cited.

</details>

## Section 4. Paths and connectivity (3 problems)

### Exercise 4.1: Find the shortest path between two named vertices

**Task:** A subway operator analyzing a small transit graph wants to confirm the minimum number of transfers between stations Ada and Finn in the friendship graph from Exercise 1.1 (treating each friendship as a one-step hop). Compute the shortest path vertex sequence from Ada to Finn on `ex_1_1` and save the vertex names along the path to a character vector `ex_4_1`.

**Expected result:**

```
#> [1] "Ada"  "Cleo" "Dan"  "Eva"  "Finn"
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
sp <- shortest_paths(ex_1_1, from = "Ada", to = "Finn")
ex_4_1 <- names(sp$vpath[[1]])
ex_4_1
#> [1] "Ada"  "Cleo" "Dan"  "Eva"  "Finn"
```

**Explanation:** `shortest_paths()` returns both vertex and edge sequences in a list; pull `$vpath[[1]]` for the vertex IDs and wrap in `names()` for the labels. The default algorithm is unweighted BFS, which gives geodesic distance in number of hops. For weighted edges (travel time, cost), set `weights = E(g)$weight` and igraph automatically switches to Dijkstra. When you only need the integer distance and not the path itself, `distances(g, v = "Ada", to = "Finn")` is much faster.

</details>

### Exercise 4.2: Full pairwise distance matrix and graph diameter

**Task:** A network reliability engineer studying a fiber backbone wants the full shortest-path distance matrix (for capacity planning) and the diameter (the worst-case latency) of the Zachary karate graph from Exercise 3.1. Compute both and return them as a list with elements `distances` (the matrix) and `diameter` (an integer), saved to `ex_4_2`.

**Expected result:**

```
#> $distances
#>    1 2 3 4 ...
#> 1  0 1 1 1 ...
#> 2  1 0 1 1 ...
#> ...
#>
#> $diameter
#> [1] 5
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2$diameter
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_2 <- list(
  distances = distances(g_kar),
  diameter  = diameter(g_kar)
)
ex_4_2$diameter
#> [1] 5
dim(ex_4_2$distances)
#> [1] 34 34
```

**Explanation:** `distances()` returns an n-by-n matrix in O(n*m) for unweighted graphs (Dijkstra on weighted), and `diameter()` is the maximum finite entry of that matrix. The karate graph's diameter of 5 means the most distant pair is reachable in five hops, which is why "six degrees of separation" sounds plausible: small-world graphs grow logarithmically in diameter. For very large graphs, `mean_distance()` is cheaper and more meaningful than the worst-case diameter.

</details>

### Exercise 4.3: Identify connected components and extract the largest one

**Task:** A fraud analyst examining a transaction network knows that suspicious clusters often appear as small disconnected islands separate from the legitimate giant component. Construct a small disconnected graph with `graph_from_literal(A-B-C, D-E, F)`, compute its components (membership and sizes), and save the size of the largest component (as a length-1 integer) to `ex_4_3`.

**Expected result:**

```
#> Components found: 3
#> Component sizes:  3 2 1
#> Largest component (saved to ex_4_3):
#> [1] 3
```

**Difficulty:** Beginner

```r title="Your turn"
g_disc <- graph_from_literal(A-B-C, D-E, F)
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
g_disc <- graph_from_literal(A-B-C, D-E, F)
comp <- components(g_disc)
ex_4_3 <- max(comp$csize)
ex_4_3
#> [1] 3
```

**Explanation:** `components()` returns three pieces: `membership` (vertex -> component ID), `csize` (size of each component), and `no` (number of components). For directed graphs, pass `mode = "weak"` to ignore direction or `"strong"` to require bidirectional reachability. The largest weakly connected component is usually the "main" graph for analysis: extract it with `induced_subgraph(g, V(g)[membership == which.max(csize)])` to drop noise islands before computing centrality.

</details>

## Section 5. Community detection (4 problems)

### Exercise 5.1: Detect communities with the Louvain algorithm

**Task:** A social media team studying conversation clusters in a tightly-knit interest community needs a fast modularity-optimizing partition of the Zachary karate graph from Exercise 3.1. Run `cluster_louvain()` on `g_kar`, then save the resulting `communities` object to `ex_5_1`. Print the number of detected communities and the modularity score.

**Expected result:**

```
#> IGRAPH clustering multi level, groups: 4, mod: 0.45
#> + groups:
#>   $`1` ...
```

**Difficulty:** Intermediate

```r title="Your turn"
set.seed(7)
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(7)
ex_5_1 <- cluster_louvain(g_kar)
ex_5_1
#> IGRAPH clustering multi level, groups: 4, modularity: 0.4449037
length(ex_5_1)
#> [1] 4
modularity(ex_5_1)
#> [1] 0.4449037
```

**Explanation:** Louvain is the default "greedy modularity" community detector for large graphs because it scales near-linearly and almost always finds the best partition. The output is a `communities` object you can call `membership()`, `length()` (community count), and `sizes()` on. Modularity around 0.3 is "weak" community structure, 0.4+ is strong, and >0.7 is essentially block-diagonal. Louvain is non-deterministic (random tie-breaking), so set a seed for reproducible reports.

</details>

### Exercise 5.2: Compare community sizes with the sizes() helper

**Task:** A data product manager preparing a stakeholder report on the Louvain partition from Exercise 5.1 wants a clean named integer vector of community sizes for a horizontal bar chart. Extract it from `ex_5_1` and save it (named by community ID) to `ex_5_2`.

**Expected result:**

```
#> Community sizes
#>  1  2  3  4
#> 11 12  6  5
```

**Difficulty:** Beginner

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_2 <- sizes(ex_5_1)
ex_5_2
#> Community sizes
#>  1  2  3  4
#> 11 12  6  5
```

**Explanation:** `sizes()` is just `table(membership(comm))` under the hood, but it returns a `table` object with a tidy print method. The community IDs are arbitrary labels assigned during the optimization run, so they have no inherent meaning across runs (random tie-breaking can swap labels). For longitudinal comparisons (week-over-week communities), match communities by overlap rather than by ID with `compare(comm1, comm2, method = "nmi")`.

</details>

### Exercise 5.3: Compare two community detection algorithms with modularity

**Task:** A network science PhD student benchmarking algorithms on the Zachary karate graph wants to compare the modularity of three partitions: Louvain, edge betweenness (Girvan-Newman), and walktrap. Run all three with `set.seed(11)`, collect their modularity scores into a named numeric vector, and save it to `ex_5_3`.

**Expected result:**

```
#>     louvain edge_btw    walktrap
#>   0.4449037 0.4012985 0.3532216
```

**Difficulty:** Advanced

```r title="Your turn"
set.seed(11)
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(11)
c_lou <- cluster_louvain(g_kar)
c_eb  <- cluster_edge_betweenness(g_kar)
c_wt  <- cluster_walktrap(g_kar)
ex_5_3 <- c(
  louvain  = modularity(c_lou),
  edge_btw = modularity(c_eb),
  walktrap = modularity(c_wt)
)
ex_5_3
#>     louvain edge_btw    walktrap
#>   0.4449037 0.4012985 0.3532216
```

**Explanation:** Different algorithms optimize different objectives and have different scaling properties. Louvain optimizes modularity directly and scales to millions of edges. Edge betweenness (Girvan-Newman) iteratively removes the highest-betweenness edge and is O(n*m^2), so it is only viable below ~1000 nodes but produces interpretable hierarchical splits. Walktrap uses random-walk distance and finds tighter, more cohesive communities. On clean toy graphs they often agree; on noisy real-world data, comparing modularity (or NMI against ground truth) is the right way to choose.

</details>

### Exercise 5.4: Visualize a community-colored graph plot

**Task:** A communications designer producing a figure for a blog post wants to render the karate graph with each Louvain community colored differently, vertices sized by degree, and the layout fixed by `layout_with_fr()` for reproducibility. Save the plot output to `ex_5_4` (the function call invisibly returns NULL; capturing layout matrix for grading). Use `set.seed(99)` for layout reproducibility.

**Expected result:**

```
#> A 34 x 2 numeric matrix of Fruchterman-Reingold coordinates.
#> Plot rendered: 4 communities colored, vertex size proportional to degree.
```

**Difficulty:** Intermediate

```r title="Your turn"
set.seed(99)
ex_5_4 <- # your code here
dim(ex_5_4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(99)
ex_5_4 <- layout_with_fr(g_kar)
plot(
  g_kar,
  layout      = ex_5_4,
  vertex.color = membership(ex_5_1),
  vertex.size  = 3 + degree(g_kar) * 0.8,
  vertex.label.cex = 0.7
)
dim(ex_5_4)
#> [1] 34  2
```

**Explanation:** Separating the layout (`layout_with_fr()`) from the plot call is the standard idiom because force-directed layouts are stochastic; computing them once and passing the matrix in lets you produce identical figures across renders. `vertex.color` accepts any integer vector (one per vertex); pairing it with `membership(comm)` gives community-aware coloring "for free". Avoid putting raw degree into `vertex.size` without scaling; degrees of 1-2 produce dots smaller than the vertex label.

</details>

## Section 6. Subgraphs and structural queries (3 problems)

### Exercise 6.1: Extract the largest connected component as an induced subgraph

**Task:** A fraud analyst (continuing from Exercise 4.3) wants to run centrality and community detection on only the main legitimate cluster, discarding the small isolated islands. Build `g_disc` again as in 4.3, extract the largest weakly connected component as an `igraph` object using `induced_subgraph()`, and save it to `ex_6_1`.

**Expected result:**

```
#> IGRAPH UN-- 3 2 --
#> + attr: name (v/c)
#> + edges from ...:
#> [1] A--B B--C
```

**Difficulty:** Intermediate

```r title="Your turn"
g_disc <- graph_from_literal(A-B-C, D-E, F)
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
g_disc <- graph_from_literal(A-B-C, D-E, F)
comp <- components(g_disc)
biggest <- which.max(comp$csize)
ex_6_1 <- induced_subgraph(g_disc, V(g_disc)[comp$membership == biggest])
ex_6_1
#> IGRAPH UN-- 3 2 --
#> + attr: name (v/c)
#> + edges:
#> [1] A--B B--C
```

**Explanation:** `induced_subgraph()` keeps the listed vertices and all edges among them, preserving vertex and edge attributes. Combine it with `components()$membership` to slice out connected pieces, or with a boolean filter `V(g)[degree > 5]` to keep a "core" set. The alternative `subgraph()` is deprecated; use `induced_subgraph()` for vertex-based slicing and `subgraph.edges()` for edge-based slicing.

</details>

### Exercise 6.2: Compute one-step ego networks for a target vertex

**Task:** A user-research lead studying personal influence wants the immediate ego network (1-step neighborhood) around vertex 1 of the Zachary karate graph: the focal vertex plus all its direct neighbors and any edges among them. Build it from `g_kar` with `make_ego_graph()`, return the single resulting graph object, and save it to `ex_6_2`.

**Expected result:**

```
#> IGRAPH U--- 17 41 --
#> + edges from ...:
#> (vertex 1 plus its 16 neighbors and all edges among them)
```

**Difficulty:** Advanced

```r title="Your turn"
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ego_list <- make_ego_graph(g_kar, order = 1, nodes = 1)
ex_6_2 <- ego_list[[1]]
ex_6_2
#> IGRAPH U--- 17 41 --
#> + edges:
#> (vertex 1 plus 16 neighbors, 41 edges among them)
vcount(ex_6_2); ecount(ex_6_2)
#> [1] 17
#> [1] 41
```

**Explanation:** `make_ego_graph()` returns a list because you can request multiple egos at once; if you pass a single node, just extract `[[1]]`. The `order` argument controls the radius: `order = 1` is direct neighbors, `order = 2` adds friends-of-friends. Ego networks are the building block for personal-influence studies and for breaking very large graphs into per-user sub-analyses that fit in memory. For just the vertex IDs without building the subgraph, use the lighter `ego()` or `neighborhood()`.

</details>

### Exercise 6.3: Filter edges by a weight attribute and rebuild a sparser graph

**Task:** A trading desk reviewing a co-trading network where edge weights represent USD volume in millions wants to threshold the network at >= 5 million to focus on material relationships. Build a weighted graph inline (six edges with weights `c(2, 3, 5, 6, 8, 11)`), then return a new igraph object containing only edges with `weight >= 5`. Save the sparser graph to `ex_6_3`.

**Expected result:**

```
#> IGRAPH UNW- 4 3 --
#> + attr: name (v/c), weight (e/n)
#> + edges from ... (vertex names):
#> [1] C--D D--E E--F
```

**Difficulty:** Intermediate

```r title="Your turn"
edges <- data.frame(
  from   = c("A","B","C","D","E","F"),
  to     = c("B","C","D","E","F","A"),
  weight = c(2, 3, 5, 6, 8, 11)
)
g_w <- graph_from_data_frame(edges, directed = FALSE)
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
edges <- data.frame(
  from   = c("A","B","C","D","E","F"),
  to     = c("B","C","D","E","F","A"),
  weight = c(2, 3, 5, 6, 8, 11)
)
g_w <- graph_from_data_frame(edges, directed = FALSE)
keep_e <- E(g_w)[weight >= 5]
ex_6_3 <- subgraph.edges(g_w, keep_e, delete.vertices = TRUE)
ex_6_3
#> IGRAPH UNW- 4 3 --
#> + attr: name (v/c), weight (e/n)
#> + edges (vertex names):
#> [1] C--D D--E E--F
```

**Explanation:** `subgraph.edges()` keeps only the listed edges and (with `delete.vertices = TRUE`) drops any vertices left isolated. Note the convenient `E(g)[weight >= 5]` syntax: igraph evaluates the expression inside the brackets against the edge attribute set, similar to `dplyr::filter()`. The `UNW-` flag in the summary confirms the graph is undirected, named, and weighted. After thresholding, always re-check `components()` because a sparsifying filter often splits the graph into pieces.

</details>

## What to do next

- [dplyr Joins Exercises](dplyr-Joins-Exercises-in-R.html): joining edge lists and vertex attribute tables.
- [Data Visualization Exercises](Data-Visualization-Exercises-in-R.html): practice plotting graphs and other complex structures.
- [Spatial Analysis Exercises](Spatial-Analysis-Exercises-in-R.html): geographic networks and adjacency from spatial data.
- [Apply Family Exercises](Apply-Family-Exercises-in-R.html): vectorize per-vertex computations across centrality measures.
