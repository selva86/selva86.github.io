# Machine Learning Engineer Track - Complete Curriculum (2026/27, v3)

> Completes the ladder **Data Analyst -> Data Scientist -> ML Engineer**. The DS builds the model; the ML Engineer ships, scales, secures and operates it - for classical models and AI/LLM systems alike. One interactive lesson per line item, no slim lessons.

## v3 changes (tightening pass - depth kept, fat trimmed)

v2 was right to rebalance toward AI/LLM systems but over-split three areas. v3 consolidates without losing depth:
- **Monitoring was 3 sections** (essentials + observability + drift). -> Core keeps a lean **M9 Monitoring & drift essentials**; Advanced has **one M10 Observability & continual learning** (the three pillars + tracing + the drift taxonomy + retraining/online learning). Two, not three.
- **Performance was 3 sections** (scaling + inference-opt + perf/FinOps). -> **M13 Scaling** stays; **M14 Inference optimization, performance & cost** merges the model-level and app-level perf + FinOps into one.
- **Platform engineering** was a thin standalone -> folded into **M1** (the platform you build on) and a **M22** capstone case.
Net: 25 -> **22 sections**, ~130 lessons. Still the most complete R-centric MLE curriculum anywhere; nothing essential dropped.

## Positioning (the honest 2026 R story)

Two realities, both taught, both tagged. **Classical ML production is R-native and largely runnable** (vetiver, plumber, targets, pins, pointblank, testthat, duckdb). **AI/LLM systems: you orchestrate and evaluate in R** (ellmer for LLM calls, tool/function calling, structured output; duckdb for embeddings + vector search) **and serve/train cross-language** (vLLM, GPUs = Python/infra, taught as real config). We never pretend a GPU runs in a browser. Does not overlap `r-developer` (R-language/package craft); this is ML/AI *systems*.

**Bands/tiers:** `[CORE]` certified · `[ADV]` operate at scale · `[AI]` AI & LLM systems · capstone. **WebR:** `(R)` live · `(R~)` live on a reduced demo / the logic runs · `(static)` real config + precomputed output (containers, cloud, cluster, GPU, live server, or API key). Page = three bands on `ml-engineer.html` (Core ends "- Certified ML Engineer -", then Advanced, then AI & LLM systems) + capstone; `tier` flag per section.

---

# CORE - The certified ML Engineer path

## M1. The ML engineering mindset and lifecycle  [CORE]
1. **What an ML Engineer does** - the system around the model (hidden technical debt, made concrete) `(static)`
2. **The ML lifecycle and MLOps maturity** - manual to automated to continuous training `(static)`
3. **From notebook to a structured, packaged ML codebase** `(R)`
4. **Environments, dependencies and reproducibility** - renv, lockfiles `(R)`
5. **The platform and the DS-to-MLE handoff** - the platform you build on, plus model cards, contracts and paved roads `(static)`

## M2. Reproducible pipelines and orchestration  [CORE]
1. **From a pile of scripts to a DAG** - why pipelines `(R~)`
2. **Build a pipeline with targets** `(R~)`
3. **Caching, invalidation and incremental runs** `(R~)`
4. **Parameterized and dynamically-branched pipelines** `(R~)`
5. **Scheduling and orchestration** - cron, and Airflow/Dagster-style when targets is not enough `(static)`
6. **Pipeline testing and debugging** `(R)`

## M3. Data and features for production  [CORE]
1. **Data validation and contracts with pointblank** `(R)`
2. **Schema enforcement and data-quality gates in the pipeline** `(R)`
3. **Data versioning and lineage** - why data needs git too (DVC / lakeFS concepts) `(static)`
4. **Feature pipelines that do not leak** - train/serving parity `(R)`
5. **Columnar and larger-than-memory data** - arrow, parquet, duckdb `(R)`
6. **Batch, incremental and change-data-capture ingestion** `(R~)`

## M4. Model packaging, serialization and the registry  [CORE]
1. **Serializing models and objects** - RDS, qs, ONNX, the portability gotchas `(R)`
2. **Bundling preprocessing with the model** - the recipe travels too `(R)`
3. **Packaging ML code as an R package** - and capturing the serving environment `(R)`
4. **Model versioning with vetiver** `(R~)`
5. **A model registry and promotion workflow** - dev -> staging -> prod, approval gates `(R~)`
6. **Model cards and metadata as first-class, queryable artifacts** `(R)`

## M5. Serving models - the serving discipline  [CORE]
1. **The serving landscape** - REST, gRPC, batch, streaming, embedded `(static)`
2. **REST APIs with plumber** - endpoints, schemas, validation, error contracts `(R~)`
3. **Serving a tidymodels / vetiver model end to end** `(R~)`
4. **Throughput and latency** - dynamic batching, concurrency, connection pooling `(R~)`
5. **Multi-model serving and version routing** `(R~)`
6. **Serving runtimes and when to leave R** - ONNX Runtime, BentoML, Ray Serve, Triton `(static)`
7. **Serverless, edge and on-device inference** `(static)`

## M6. Containerization and deployment  [CORE]
1. **Docker for R** - a minimal, reproducible image `(static)`
2. **Multi-stage builds and slim, secure images** `(static)`
3. **Configuration and secrets management** `(static)`
4. **Deploying** - Posit Connect, Cloud Run, the Kubernetes basics you need `(static)`
5. **Health checks, readiness and graceful shutdown** `(R~)`

## M7. Testing and evaluation engineering  [CORE]
1. **Unit and integration testing for ML code (testthat)** `(R)`
2. **Testing data** - schema, ranges, distributions `(R)`
3. **Testing models** - behavioral, invariance, directional, metamorphic tests `(R)`
4. **Testing the serving layer** - the API contract and golden requests `(R~)`
5. **Evaluation sets and golden datasets** - the source of truth `(R)`
6. **Regression testing for models** - did the new model quietly break a segment? `(R)`
7. **Slice-based and subgroup evaluation** - where the average hides failure `(R)`
8. **Offline vs online evaluation, and eval-driven development** `(R~)`

## M8. CI/CD/CT for ML  [CORE]
1. **CI for ML** - test, lint, and data + model gates (GitHub Actions) `(static)`
2. **Continuous delivery** - build and publish the model image `(static)`
3. **Continuous training (CT)** - automated retraining pipelines `(R~)`
4. **Model approval gates and automated rollback** `(R~)`
5. **Infrastructure as code, an intro** `(static)`

## M9. Monitoring and drift - keeping a model healthy  [CORE]
1. **What to monitor** - the data, model and system layers `(R)`
2. **Data drift detection** - PSI, KS, distance metrics `(R)`
3. **Concept drift and silent performance decay** `(R)`
4. **Alerts and thresholds without alert fatigue** `(R)`
5. **Closing the loop** - drift that triggers retraining `(R~)`

> **- Certified ML Engineer -**

---

# ADVANCED - Operate at scale

## M10. Observability and continual learning  [ADV]
1. **The three pillars** - metrics, logs and traces for ML `(R~)`
2. **Distributed tracing across a prediction request** - OpenTelemetry `(static)`
3. **The prediction store and eval-in-production (shadow scoring, delayed-label backfill)** `(R~)`
4. **The full drift taxonomy** - covariate, label, concept, prediction drift `(R)`
5. **Multivariate and embedding drift** - drift on unstructured data `(R~)`
6. **Retraining strategy** - cadence, triggers and the cost of staleness `(R)`
7. **Online and incremental learning** - when and how `(R~)`
8. **Feedback loops and their dangers** - the model that poisons its own data `(static)`

## M11. The data and feature platform  [ADV]
1. **Feature stores** - the online/offline split, and when you actually need one `(static)`
2. **Point-in-time correctness and time-travel joins** `(R~)`
3. **Feature freshness, the dual-write problem and serving latency** `(R~)`
4. **Feature versioning, lineage and reuse** `(R~)`
5. **The lakehouse and medallion architecture for ML** `(static)`
6. **Streaming features and real-time pipelines** `(static)`

## M12. Deployment strategies and progressive delivery  [ADV]
1. **Shadow deployment** - test on prod traffic, risk-free `(static)`
2. **Canary and blue-green releases** `(static)`
3. **Online A/B testing of models** - and why offline metrics mislead `(R~)`
4. **Interleaving and multi-armed rollout** `(R~)`
5. **Progressive rollout, guardrail metrics and automated rollback** `(static)`
6. **Multi-model serving, routing and champion/challenger** `(R~)`

## M13. Scaling and distributed ML  [ADV]
1. **Parallel R** - future, furrr, mirai `(R~)`
2. **Out-of-core and chunked processing** `(R~)`
3. **arrow and duckdb at warehouse scale** `(R~)`
4. **Distributed compute with Spark via sparklyr** `(static)`
5. **Distributed and multi-GPU training** - the concepts `(static)`
6. **Autoscaling the serving layer** `(static)`

## M14. Inference optimization, performance and cost  [ADV]
1. **The accuracy-latency-cost-throughput frontier** `(R)`
2. **Quantization** - PTQ, QAT, int8/int4 (GPTQ / AWQ for LLMs) `(static)`
3. **Pruning, distillation and simpler-model substitution** `(R~)`
4. **Compilation and kernels** - ONNX Runtime, TensorRT, torch.compile `(static)`
5. **LLM-specific** - KV-cache, continuous batching, speculative decoding, paged attention `(static)`
6. **Profiling R hot paths and the hot 5%** - profvis, data.table, Rcpp `(R)`
7. **Latency budgets and caching** - tail latency (p99 is the product); caching predictions, features and responses `(R)`
8. **The economics of AI** - GPU hours, token costs, cost-aware routing and FinOps `(static)`

## M15. Reliability and SRE for ML  [ADV]
1. **SLOs, SLIs and error budgets for ML services** `(static)`
2. **Graceful degradation and fallback models** - always have a plan B `(R~)`
3. **Load, soak and chaos testing for ML** `(static)`
4. **Incident response, on-call and blameless postmortems for ML** `(static)`
5. **Capacity planning and the cost of reliability** `(static)`

## M16. Security, privacy and governance  [ADV]
1. **Securing an ML/AI API** - authn/z, rate limiting, abuse prevention `(static)`
2. **The ML attack surface** - data poisoning, model stealing, membership inference, adversarial inputs `(R~)`
3. **LLM security** - prompt injection, jailbreaks and the OWASP LLM Top 10 `(static)`
4. **Model and data supply chain** - provenance, SBOM-for-ML, signed artifacts `(static)`
5. **Privacy in production** - PII handling, differential privacy, federated basics `(R~)`
6. **Governance and compliance** - audit trails, lineage, model risk, the EU AI Act `(static)`

---

# AI & LLM SYSTEMS - the 2026/27 pillar

> Orchestrate and evaluate in R (ellmer, duckdb); serve and train cross-language. Tagged honestly.

## M17. LLM serving and inference systems  [AI]
1. **The LLM serving stack** - vLLM, TGI and the gateway pattern `(static)`
2. **Calling and routing LLMs from R with ellmer** `(static)`
3. **Streaming responses (SSE) and token-level UX** `(R~)`
4. **Throughput** - continuous batching, concurrency, rate limits `(static)`
5. **Model routing and fallback** - cheap-to-expensive, multi-provider `(R~)`
6. **Self-hosted vs API** - the build/buy/cost decision `(static)`

## M18. RAG and retrieval systems in production  [AI]
1. **The RAG architecture** - and where it actually breaks `(static)`
2. **Chunking and the indexing pipeline** `(R~)`
3. **Embeddings and vector search** - duckdb `vss`, and the vector-DB landscape `(R~)`
4. **Hybrid search and re-ranking** `(R~)`
5. **Retrieval evaluation** - is the retrieved context even relevant? `(R~)`
6. **Freshness, incremental indexing and cache invalidation** `(R~)`
7. **RAG observability and failure analysis** `(static)`

## M19. Agentic systems in production  [AI]
1. **From chains to agents** - tool and function calling with ellmer `(R~)`
2. **Agent architectures** - ReAct, plan-and-execute, multi-agent `(static)`
3. **Orchestration, state and memory** `(R~)`
4. **Agent observability and tracing** - every tool call, every token `(static)`
5. **Evaluating agents** - task success, trajectory quality, cost per task `(R~)`
6. **Cost and latency control for multi-call agents** `(R~)`
7. **Guardrails and human-in-the-loop for agents** `(static)`

## M20. LLM and AI evaluation  [AI]
1. **Why LLM eval is hard** - there is no single ground truth `(static)`
2. **Building eval sets and golden datasets for LLM tasks** `(R~)`
3. **LLM-as-judge** - and its pitfalls (position, verbosity, self-preference bias) `(R~)`
4. **Reference-based and reference-free metrics** - faithfulness, groundedness, relevance `(R~)`
5. **Human eval pipelines and inter-rater reliability** `(R)`
6. **Online eval and regression suites in CI** `(R~)`
7. **Red-teaming and adversarial evaluation** `(static)`

## M21. AI safety, guardrails and LLMOps  [AI]
1. **Guardrails** - input/output filtering, schema enforcement, validation `(R~)`
2. **Content safety, toxicity and PII redaction** `(R~)`
3. **Hallucination mitigation and grounding** `(static)`
4. **Prompt management** - versioning, testing and the prompt registry `(R~)`
5. **Fine-tuning and adapter ops** - LoRA serving, adapter management `(static)`
6. **Semantic caching and cost/latency control for LLM apps** `(R~)`
7. **Monitoring LLMs in prod** - cost, latency, drift, quality, safety `(R~)`

---

# CAPSTONE

## M22. ML and AI system design  [CAPSTONE]
1. **The system-design framework** - from requirements to architecture `(static)`
2. **Latency, scale and cost trade-offs** `(static)`
3. **Case** - a real-time recommendation service `(static)`
4. **Case** - a batch scoring pipeline `(R~)`
5. **Case** - a production RAG service `(static)`
6. **Case** - an agentic workflow `(static)`
7. **Case** - building the internal ML platform (paved roads) `(static)`
8. **The ML/AI system design interview** `(static)`

---

# WebR runnability (honest)

| Band | Sections | Lessons | Live `(R)`+`(R~)` | `(static)` |
|---|---|---|---|---|
| Core (M1-M9) | 9 | ~52 | **~63%** | ~37% |
| Advanced (M10-M16) | 7 | ~44 | **~45%** | ~55% |
| AI & LLM systems (M17-M21) | 5 | ~33 | **~40%** | ~60% |
| Capstone (M22) | 1 | 8 | ~13% | ~87% |
| **Whole track** | **22** | **~137** | **~49%** | **~51%** |

~half genuinely live, concentrated where it counts (pipelines, validation, drift math, testing, evaluation incl. LLM-as-judge + retrieval eval via ellmer/duckdb, serialization, profiling, caching, agent tool-calling). The static half is real infrastructure - taught with the real Dockerfile/YAML/config + precomputed output + architecture/DAG widgets so a `(static)` lesson is still interactive in experience.

# Boundary with the Data Scientist track
- DS **C12** = the shipping intro; everything past it is this track.
- DS **A7 (robustness/drift)** = the modeling response; MLE **M9/M10** = the systems response. Cross-link.
- DS Spec **S4 (LLMs/GenAI)** = how a DS *uses* LLMs; MLE **M17-M21** = how to *operate* them. Same topic, different altitude.
- Prerequisite: finish DS Core (you cannot productionize what you cannot build).

# Build order
1. M2 + M3 + M7 (high-WebR backbone). 2. M4/M5 (registry, serving). 3. M6/M8 (Docker, CI). 4. M9/M10 (monitoring, observability). 5. the AI band - M18 (RAG) + M20 (eval) + M19 (agents) first (most ellmer-runnable, strongest hooks). 6. remaining Advanced; M22 capstone last.
