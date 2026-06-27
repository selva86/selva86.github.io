# Machine Learning Engineer Track - Complete Curriculum (2026)

> A new sibling track that completes the role ladder **Data Analyst -> Data Scientist -> ML Engineer**. The DS builds the model; the ML Engineer ships it, scales it, and keeps it healthy. One interactive lesson per line item, no slim lessons.

## Positioning (read first)

This is **ML engineering with R at the center**: for the many teams who *build models in R* (tidymodels, the stats stack) and need to take them to production and operate them. R is genuinely strong here now - **vetiver, plumber, targets, pins, pointblank, testthat, duckdb** make a real, R-native MLOps story. The infrastructure layer (containers, CI/CD, cloud, scale-out, streaming) is language-agnostic and taught with R-centric examples plus the real config; we are honest that those pieces run on real infra, not in a browser.

It does **not** overlap the existing `r-developer` track: that track is R-language and package *craft*; this track is *ML systems* (deploy, serve, monitor, scale models). They cross-link (an ML Engineer uses package-craft skills to ship code).

**Tiers:** `[CORE]` certified path · `[ADV]` senior depth. **WebR tag:** `(R)` runs live · `(R~)` runs live on a reduced demo / the logic runs even if full scale doesn't · `(static)` illustrative real config + precomputed output (needs containers, cloud, a cluster, GPU, a live server, or an API key).

## How the page differentiates (same shape as DS)

Two bands on `ml-engineer.html`: **Core - The certified path** (M1-M9, ends with a "- Certified ML Engineer -" milestone) then **Advanced - Operate at scale** (M10-M19). `tier` flag per section in `RM2.sections.mleng`; renderer groups + draws the milestone. Free/Pro lesson tags as elsewhere.

---

# CORE - The certified ML Engineer path

> Goal of Core: a graduate can take a trained R model and turn it into a tested, versioned, containerized, served, and CI/CD'd service - the end-to-end "notebook to endpoint" path. ~9 courses.

## M1. The ML engineering mindset and lifecycle  [CORE]
1. What an ML Engineer actually does - the system beyond the model `(static)`
2. The ML lifecycle and MLOps maturity levels `(static)`
3. From notebook to project - structuring an ML codebase `(R)`
4. Hidden technical debt in ML systems `(static)`
5. Environments and dependency management with renv and lockfiles `(R)`

## M2. Reproducible pipelines  [CORE]
1. Why pipelines - from a pile of scripts to a DAG `(R~)`
2. Build a pipeline with targets `(R~)`
3. Caching, invalidation and incremental runs `(R~)`
4. Parameterized and dynamic-branched pipelines `(R~)`
5. Pipeline testing and debugging `(R)`

## M3. Data engineering for ML  [CORE]
1. Data validation and contracts with pointblank `(R)`
2. Schema enforcement and data-quality gates `(R)`
3. Feature pipelines that do not leak - train/serving parity `(R)`
4. Columnar data with arrow and parquet `(R~)`
5. In-process analytics on big-ish data with duckdb `(R)`
6. Batch and incremental data processing `(R~)`

## M4. Experiment tracking and the model registry  [CORE]
1. Tracking experiments - params, metrics, artifacts `(R~)`
2. Model versioning with vetiver `(R~)`
3. Artifact storage with pins `(R~)`
4. A registry and promotion workflow (dev -> staging -> prod) `(R~)`
5. Reproducible model cards and metadata `(R)`

## M5. Packaging and serialization  [CORE]
1. Serializing models and objects - RDS, qs, and the gotchas `(R)`
2. Packaging ML code as an R package `(R)`
3. Capturing the serving environment (deps pinned for prod) `(R)`
4. Bundling preprocessing with the model - the recipe travels too `(R)`

## M6. Serving models  [CORE]
1. REST APIs with plumber - defining and testing endpoints `(R~)`
2. Serving a tidymodels / vetiver model as an API `(R~)`
3. Request validation, error handling and input schemas `(R)`
4. Batch vs real-time inference - the trade-offs `(static)`
5. API performance basics - serialization, payloads, concurrency `(R~)`

## M7. Containerization and deployment  [CORE]
1. Docker for R - a minimal, reproducible image `(static)`
2. Multi-stage builds and slim images `(static)`
3. Deploying a plumber/vetiver API (Posit Connect, Cloud Run, ...) `(static)`
4. Configuration and secrets management `(static)`
5. Health checks and readiness probes `(R~)`

## M8. Testing ML systems  [CORE]
1. Unit testing R code with testthat `(R)`
2. Testing data - schema, ranges, distributions `(R)`
3. Testing models - behavioral, invariance, directional tests `(R)`
4. Testing the serving layer - the API contract `(R~)`
5. What is worth testing in ML, and coverage `(R)`

## M9. CI/CD for ML  [CORE]
1. Continuous integration for R (GitHub Actions) `(static)`
2. Automated test and lint gates `(R)`
3. Continuous delivery - build and publish the model image `(static)`
4. Automated retraining pipelines `(R~)`
5. Infrastructure as code, an intro `(static)`

> **- Certified ML Engineer -**  (Core complete)

---

# ADVANCED - Operate ML at scale

## M10. Monitoring and observability  [ADV]
1. What to monitor - data, model, system `(R)`
2. Data drift detection - PSI, KS, distribution distances `(R)`
3. Concept drift and performance decay `(R)`
4. Computing metrics and alerting thresholds `(R)`
5. Logging, tracing and dashboards for ML services `(R~)`
6. Closing the loop - drift that triggers retraining `(R~)`

## M11. Training-serving skew and feature management  [ADV]
1. Training-serving skew - the number-one silent prod bug `(R)`
2. Feature/serving consistency - one definition, two code paths `(R)`
3. Feature stores - what they solve and when you need one `(static)`
4. Point-in-time correctness and time-travel features `(R~)`
5. Backfills and feature versioning `(R~)`

## M12. Deployment strategies  [ADV]
1. Shadow deployment `(static)`
2. Canary and blue-green releases `(static)`
3. Online A/B testing of models `(R~)`
4. Progressive rollout and automated rollback `(static)`
5. Multi-model serving and routing `(R~)`

## M13. Scaling ML  [ADV]
1. Parallel R - future, furrr, mirai `(R~)`
2. Out-of-core and chunked processing `(R~)`
3. arrow and duckdb at scale `(R~)`
4. Distributed compute with Spark via sparklyr `(static)`
5. GPU and accelerated inference `(static)`
6. Scaling the serving layer - load balancing and autoscaling `(static)`

## M14. Performance, latency and cost  [ADV]
1. Profiling R for speed - profvis, bench `(R)`
2. Hot paths - vectorization, data.table, Rcpp `(R~)`
3. Latency budgets and tail latency `(R~)`
4. Caching predictions and features `(R)`
5. Cost and FinOps for ML/AI workloads `(static)`

## M15. Model optimization for production  [ADV]
1. Model compression - pruning and quantization `(static)`
2. Knowledge distillation `(static)`
3. Simpler-model substitution and the accuracy/latency frontier `(R)`
4. Cross-runtime export with ONNX `(static)`

## M16. Orchestration and scheduling  [ADV]
1. Scheduling pipelines - cron and Airflow-style orchestrators `(static)`
2. targets at scale and pipeline orchestration `(R~)`
3. Event-driven and streaming inference `(static)`
4. Workflow dependencies and SLAs `(static)`

## M17. Security, governance and reliability  [ADV]
1. Securing an ML API - auth and rate limiting `(static)`
2. Model security - adversarial inputs, model stealing, membership inference `(R~)`
3. Privacy in production - PII handling, differential privacy, federated basics `(R~)`
4. Audit trails, lineage and compliance (EU AI Act) `(static)`
5. Incident response, on-call and rollback for ML `(static)`
6. Reliability - SLOs and error budgets for ML services `(static)`

## M18. LLMOps  [ADV]
1. Serving and routing LLM apps - the gateway pattern `(static)`
2. Prompt and version management `(R~)`
3. Evaluating LLM systems in production - regression suites, LLM-as-judge `(static)`
4. Monitoring LLMs - cost, latency, drift, hallucination `(R~)`
5. RAG in production - indexing, refresh, retrieval quality `(static)`
6. Guardrails and safety in production `(static)`

## M19. ML system design  [ADV]
1. The ML system design framework `(static)`
2. Requirements to architecture - latency, scale, cost `(static)`
3. Case study - a real-time recommendation service `(static)`
4. Case study - a batch scoring pipeline `(R~)`
5. Case study - an LLM-powered feature `(static)`
6. The ML system design interview `(static)`

---

# WebR runnability - the honest answer to "how much is interactive?"

The instinct that "engineering can't run in a browser" is only half right. The **engineering logic** runs in WebR even when the infrastructure doesn't: you can build and run a `targets` pipeline, validate data with `pointblank`, compute drift (PSI/KS), write and pass `testthat` suites, serialize with `pins`/`qs`, define and unit-test `plumber` handlers, and query `duckdb`/`arrow` - all live. What you *cannot* do in a browser is build a Docker image, run a CI job, stand up a live server, spin up a Spark cluster, or hit a GPU. Those are taught with the **real** Dockerfile / YAML / config + precomputed output + a "run this locally / in your cloud" callout - never faked.

| Tier | Lessons | Live `(R)`+`(R~)` | Illustrative `(static)` |
|---|---|---|---|
| Core (M1-M9) | ~44 | **~64%** | ~36% (Docker, deploy, CI, IaC, batch/real-time) |
| Advanced (M10-M19) | ~52 | **~46%** | ~54% (scale-out, deploy strategies, LLMOps, security, system design) |
| **Whole track** | **~96** | **~54%** | **~46%** |

So **roughly half** the ML Engineer track is genuinely live-interactive R, concentrated in the logic-heavy lessons (pipelines, data validation, serialization, testing, monitoring math, profiling, duckdb). The other half is infrastructure, taught with real artifacts you run on real infra. This is the correct ratio for an *engineering* track - and it's still far more hands-on than any slides-only MLOps course.

**Lesson-design note:** `(static)` engineering lessons should lean on the lesson player's diagram/widget steps + real copy-pasteable config + a downloadable repo, so they are interactive in *experience* even where the code runs locally rather than in-browser. The signature widgets for this track skew toward **process-flow, pipeline-DAG, request/response, and architecture diagrams** rather than chart/stat widgets.

---

# Relationship to the Data Scientist track (the boundary)

- DS track **C12 ("Shipping your first model")** is the *intro* - enough for a DS to deploy a basic model. Everything past that (M2-M19) is this track. No duplication: C12 is "hello, plumber + vetiver + targets"; M-track is "operate it for real."
- DS **A7 (Robustness/drift)** is the *modeling* response to drift; MLE **M10 (Monitoring)** is the *systems* response (detect + alert + retrain). They cross-link.
- Shared prerequisite: a learner should finish DS Core (or equivalent) before MLE - you cannot productionize what you cannot build.

# Build order (suggested)
1. M2 (targets) + M3 (data validation) + M8 (testing) - all high-WebR, immediately useful, and the backbone. 2. M4/M5/M6 (registry, packaging, serving). 3. M7/M9 (Docker, CI - static but essential). 4. M10/M11 (monitoring, skew - high-WebR, high-value Advanced). 5. the rest of Advanced as demand dictates (M18 LLMOps and M19 system design are strong marketing hooks).
