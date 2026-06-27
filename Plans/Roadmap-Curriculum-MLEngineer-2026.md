# Machine Learning Engineer Track - Complete Curriculum (2026/27, v2)

> A new sibling track completing the ladder **Data Analyst -> Data Scientist -> ML Engineer**. The DS builds the model; the ML Engineer ships it, scales it, secures it, and keeps it healthy - for both classical models and AI/LLM systems. One interactive lesson per line item, no slim lessons.

## What changed in v2 (the critique that drove this rewrite)

The v1 draft was strong on classical-ML production but **weighted like it was 2022**. Six problems, all fixed below:

1. **GenAI was one section for an entire discipline.** v1 had a single `LLMOps` section for the whole LLM/RAG/agent world. In 2026 heading into 2027, AI/LLM systems are the *majority* of new ML-engineering work. Rebalanced into a **5-section "AI & LLM Systems" band** (serving, RAG, agents, evaluation, safety/LLMOps).
2. **Agents were absent.** The defining workload of 2026/27. Added **M22 Agentic systems in production** (tool calling, orchestration, agent observability, agent eval, cost control, guardrails).
3. **Evaluation was an afterthought.** Eval is now its own engineering discipline (the same "a whole section was hiding in one lesson" move you spotted for linear regression). Elevated to **M7 Testing & Evaluation Engineering** + a dedicated **M23 LLM & AI evaluation** (golden sets, LLM-as-judge and its biases, slice/subgroup eval, regression suites, red-teaming).
4. **Serving was thin.** v1 = "plumber + REST" in 5 lessons. Serving is a discipline: deepened **M5** to runtimes (vLLM/TGI/ONNX-Runtime/BentoML/Triton), gRPC vs REST, dynamic batching, streaming, multi-model routing, serverless/edge.
5. **Monitoring conflated three jobs.** Split into **M10 ML observability (the three pillars + tracing/OpenTelemetry + eval-in-prod)** and **M11 Drift, feedback loops & continual learning (full drift taxonomy incl. embedding/prediction drift, retraining strategy, feedback-loop hazards)**.
6. **Security & inference-opt were pre-LLM.** **M18** now leads with **prompt injection + the OWASP LLM Top 10 + model/data supply chain (provenance, SBOM-for-ML)**; **M15 Inference optimization** is modernized (quantization PTQ/QAT/int4, KV-cache, continuous batching, speculative decoding, compilation).

Also new senior pillars: **M17 Reliability & SRE for ML**, **M19 ML platform engineering**, and a deepened **M12 data & feature platform**.

## Positioning (the honest 2026 R story)

Two realities, both taught, both tagged:
- **Classical ML production is R-native and largely runnable** - vetiver, plumber, targets, pins, pointblank, testthat, duckdb make a real MLOps story you can do live.
- **AI/LLM systems: you orchestrate and evaluate in R, and serve/train cross-language.** R's **ellmer** is a genuine entry point for LLM calls, tool/function calling (agents), structured output, and eval orchestration; **duckdb** does embeddings + vector search. The LLM *serving and training* layer (vLLM, GPUs) is Python/infra and taught as real config + concepts. We never pretend a GPU runs in a browser.

This does **not** overlap `r-developer` (R-language/package craft); this is ML/AI *systems*.

**Tiers / bands:** `[CORE]` certified path · `[ADV]` operate at scale · `[AI]` AI & LLM systems · capstone. **WebR tag:** `(R)` live · `(R~)` live on a reduced demo / the logic runs `(static)` real config + precomputed output (needs containers, cloud, a cluster, GPU, a live server, or an API key).

**Page:** three bands on `ml-engineer.html` - **Core** (ends "- Certified ML Engineer -"), **Advanced - operate at scale**, **AI & LLM systems** - plus the capstone. `tier: core|advanced|ai` per section; renderer groups + draws the milestone (same machinery as the DS track's bands).

---

# CORE - The certified ML Engineer path

> Goal: take a trained model and turn it into a validated, versioned, served, tested, CI/CD'd, monitored service - the real "notebook to a healthy endpoint" path.

## M1. The ML engineering mindset and lifecycle  [CORE]
1. What an ML Engineer does - the system around the model (hidden technical debt, made concrete) `(static)`
2. The ML lifecycle and MLOps maturity - manual to automated to continuous training `(static)`
3. From notebook to a structured, packaged ML codebase `(R)`
4. Environments, dependencies and reproducibility - renv, lockfiles, the "works on my machine" tax `(R)`
5. The DS -> MLE handoff - model cards, contracts, and what to demand before you ship `(static)`

## M2. Reproducible pipelines and orchestration  [CORE]
1. From a pile of scripts to a DAG - why pipelines `(R~)`
2. Build a pipeline with targets `(R~)`
3. Caching, invalidation and incremental runs `(R~)`
4. Parameterized and dynamically-branched pipelines `(R~)`
5. Scheduling and orchestration - cron, and Airflow/Dagster-style when targets is not enough `(static)`
6. Pipeline testing, debugging and observability `(R)`

## M3. Data and features for production  [CORE]
1. Data validation and contracts with pointblank `(R)`
2. Schema enforcement and data-quality gates in the pipeline `(R)`
3. Data versioning and lineage - why data needs git too (DVC / lakeFS concepts) `(static)`
4. Feature pipelines that do not leak - train/serving parity `(R)`
5. Columnar and larger-than-memory data - arrow, parquet, duckdb `(R)`
6. Batch, incremental and change-data-capture ingestion `(R~)`

## M4. Model packaging, serialization and the registry  [CORE]
1. Serializing models and objects - RDS, qs, ONNX, the portability gotchas `(R)`
2. Bundling preprocessing with the model - the recipe travels too `(R)`
3. Packaging ML code as an R package and capturing the serving environment `(R)`
4. Model versioning with vetiver `(R~)`
5. A model registry and promotion workflow - dev -> staging -> prod, approval gates `(R~)`
6. Model cards and metadata as first-class, queryable artifacts `(R)`

## M5. Serving models - the serving discipline  [CORE]
1. The serving landscape - REST, gRPC, batch, streaming, embedded `(static)`
2. REST APIs with plumber - endpoints, input schemas, validation, error contracts `(R~)`
3. Serving a tidymodels / vetiver model end to end `(R~)`
4. Throughput and latency - dynamic batching, concurrency, connection pooling `(R~)`
5. Multi-model serving and version routing `(R~)`
6. Serving runtimes and when to leave R - ONNX Runtime, BentoML, Ray Serve, Triton `(static)`
7. Serverless, edge and on-device inference `(static)`

## M6. Containerization and deployment  [CORE]
1. Docker for R - a minimal, reproducible image `(static)`
2. Multi-stage builds and slim, secure images `(static)`
3. Configuration and secrets management `(static)`
4. Deploying - Posit Connect, Cloud Run, the Kubernetes basics you actually need `(static)`
5. Health checks, readiness and graceful shutdown `(R~)`

## M7. Testing and evaluation engineering  [CORE]
1. Unit and integration testing for ML code (testthat) `(R)`
2. Testing data - schema, ranges, distributions `(R)`
3. Testing models - behavioral, invariance, directional and metamorphic tests `(R)`
4. Testing the serving layer - the API contract and golden requests `(R~)`
5. Evaluation sets and golden datasets - building the source of truth `(R)`
6. Regression testing for models - did the new model quietly break a segment? `(R)`
7. Slice-based and subgroup evaluation - where the average hides failure `(R)`
8. Offline vs online evaluation, and eval-driven development `(R~)`

## M8. CI/CD/CT for ML  [CORE]
1. CI for ML - test, lint, and data + model gates (GitHub Actions) `(static)`
2. Continuous delivery - build and publish the model image `(static)`
3. Continuous training (CT) - automated retraining pipelines `(R~)`
4. Model approval gates and automated rollback `(R~)`
5. Infrastructure as code, an intro `(static)`

## M9. Monitoring and drift - keeping a model healthy  [CORE]
1. What to monitor - the data, model and system layers `(R)`
2. Data drift detection - PSI, KS, distance metrics `(R)`
3. Concept drift and silent performance decay `(R)`
4. Alerts and thresholds without alert fatigue `(R)`
5. Closing the loop - drift that triggers retraining `(R~)`

> **- Certified ML Engineer -**  (Core complete)

---

# ADVANCED - Operate at scale

## M10. ML observability - the three pillars  [ADV]
1. Metrics, logs and traces for ML systems `(R~)`
2. Distributed tracing across a prediction request - OpenTelemetry `(static)`
3. Structured logging and a prediction store - log what you scored `(R)`
4. The ML observability stack - Evidently / Arize / Grafana-style `(static)`
5. Eval-in-production - shadow scoring and delayed-label backfill `(R~)`
6. Debugging a production incident from traces and logs `(static)`

## M11. Drift, feedback loops and continual learning  [ADV]
1. The full drift taxonomy - covariate, label, concept and prediction drift `(R)`
2. Multivariate and embedding drift - drift on unstructured data `(R~)`
3. Monitoring quality when labels are delayed or absent `(R)`
4. Retraining strategy - cadence, triggers and the cost of staleness `(R)`
5. Online and incremental learning - when and how `(R~)`
6. Feedback loops and their dangers - the model that poisons its own data `(static)`

## M12. The data and feature platform  [ADV]
1. Feature stores - the online/offline split, and when you actually need one `(static)`
2. Point-in-time correctness and time-travel joins `(R~)`
3. Feature freshness, the dual-write problem and serving latency `(R~)`
4. Feature versioning, lineage and reuse `(R~)`
5. The lakehouse and medallion architecture for ML `(static)`
6. Streaming features and real-time pipelines `(static)`

## M13. Deployment strategies and progressive delivery  [ADV]
1. Shadow deployment - test on prod traffic, risk-free `(static)`
2. Canary and blue-green releases `(static)`
3. Online A/B testing of models - and why offline metrics mislead `(R~)`
4. Interleaving and multi-armed rollout `(R~)`
5. Progressive rollout, guardrail metrics and automated rollback `(static)`
6. Multi-model serving, routing and champion/challenger `(R~)`

## M14. Scaling and distributed ML  [ADV]
1. Parallel R - future, furrr, mirai `(R~)`
2. Out-of-core and chunked processing `(R~)`
3. arrow and duckdb at warehouse scale `(R~)`
4. Distributed compute with Spark via sparklyr `(static)`
5. Distributed and multi-GPU training - the concepts `(static)`
6. Autoscaling the serving layer `(static)`

## M15. Inference optimization  [ADV]
1. The accuracy-latency-cost-throughput frontier `(R)`
2. Quantization - PTQ, QAT, int8/int4 (GPTQ / AWQ for LLMs) `(static)`
3. Pruning and sparsity `(static)`
4. Knowledge distillation and simpler-model substitution `(R~)`
5. Compilation and kernels - ONNX Runtime, TensorRT, torch.compile `(static)`
6. LLM-specific - KV-cache, continuous batching, speculative decoding, paged attention `(static)`

## M16. Performance, caching and FinOps for AI  [ADV]
1. Profiling R hot paths - profvis, bench `(R)`
2. The hot 5% - vectorization, data.table, Rcpp `(R~)`
3. Latency budgets and tail latency - p99 is the product `(R~)`
4. Caching - predictions, features, embeddings, semantic caching `(R)`
5. The economics of AI - GPU hours, token costs, cost-aware model routing `(static)`
6. FinOps - cost attribution, budgets and the cost/quality trade-off `(static)`

## M17. Reliability and SRE for ML  [ADV]
1. SLOs, SLIs and error budgets for ML services `(static)`
2. Graceful degradation and fallback models - always have a plan B `(R~)`
3. Load, soak and chaos testing for ML `(static)`
4. Incident response, on-call and blameless postmortems for ML `(static)`
5. Capacity planning and the cost of reliability `(static)`

## M18. Security, privacy and governance  [ADV]
1. Securing an ML/AI API - authn/z, rate limiting, abuse prevention `(static)`
2. The ML attack surface - data poisoning, model stealing, membership inference, adversarial inputs `(R~)`
3. LLM security - prompt injection, jailbreaks and the OWASP LLM Top 10 `(static)`
4. Model and data supply chain - provenance, SBOM-for-ML, signed artifacts `(static)`
5. Privacy in production - PII handling, differential privacy, federated basics `(R~)`
6. Governance and compliance - audit trails, lineage, model risk, the EU AI Act `(static)`

## M19. ML platform engineering  [ADV]
1. The internal ML platform - paved roads and golden paths `(static)`
2. Self-serve templates and scaffolding for teams `(R~)`
3. Standardizing the stack - registry, serving and monitoring as a product `(static)`
4. Developer experience and platform adoption `(static)`

---

# AI & LLM SYSTEMS - the 2026/27 pillar

> You orchestrate and evaluate in R (ellmer, duckdb); you serve and train cross-language. Tagged honestly.

## M20. LLM serving and inference systems  [AI]
1. The LLM serving stack - vLLM, TGI and the gateway pattern `(static)`
2. Calling and routing LLMs from R with ellmer `(static)`
3. Streaming responses (SSE) and token-level UX `(R~)`
4. Throughput - continuous batching, concurrency, rate limits `(static)`
5. Model routing and fallback - cheap-to-expensive, multi-provider `(R~)`
6. Self-hosted vs API - the build/buy/cost decision `(static)`

## M21. RAG and retrieval systems in production  [AI]
1. The RAG architecture - and where it actually breaks `(static)`
2. Chunking and the indexing pipeline `(R~)`
3. Embeddings and vector search - duckdb `vss`, and the vector-DB landscape `(R~)`
4. Hybrid search and re-ranking `(R~)`
5. Retrieval evaluation - is the retrieved context even relevant? `(R~)`
6. Freshness, incremental indexing and cache invalidation `(R~)`
7. RAG observability and failure analysis `(static)`

## M22. Agentic systems in production  [AI]
1. From chains to agents - tool and function calling with ellmer `(R~)`
2. Agent architectures - ReAct, plan-and-execute, multi-agent `(static)`
3. Orchestration, state and memory `(R~)`
4. Agent observability and tracing - every tool call, every token `(static)`
5. Evaluating agents - task success, trajectory quality, cost per task `(R~)`
6. Cost and latency control for multi-call agents `(R~)`
7. Guardrails and human-in-the-loop for agents `(static)`

## M23. LLM and AI evaluation  [AI]
1. Why LLM eval is hard - there is no single ground truth `(static)`
2. Building eval sets and golden datasets for LLM tasks `(R~)`
3. LLM-as-judge - and its pitfalls (position, verbosity, self-preference bias) `(R~)`
4. Reference-based and reference-free metrics - faithfulness, groundedness, relevance `(R~)`
5. Human eval pipelines and inter-rater reliability `(R)`
6. Online eval and regression suites in CI `(R~)`
7. Red-teaming and adversarial evaluation `(static)`

## M24. AI safety, guardrails and LLMOps  [AI]
1. Guardrails - input/output filtering, schema enforcement, validation `(R~)`
2. Content safety, toxicity and PII redaction `(R~)`
3. Hallucination mitigation and grounding `(static)`
4. Prompt management - versioning, testing and the prompt registry `(R~)`
5. Fine-tuning and adapter ops - LoRA serving, adapter management `(static)`
6. Semantic caching and cost/latency control for LLM apps `(R~)`
7. Monitoring LLMs in prod - cost, latency, drift, quality, safety `(R~)`

---

# CAPSTONE

## M25. ML and AI system design  [CAPSTONE]
1. The system-design framework - from requirements to architecture `(static)`
2. Latency, scale and cost trade-offs `(static)`
3. Case study - a real-time recommendation service `(static)`
4. Case study - a batch scoring pipeline `(R~)`
5. Case study - a production RAG service `(static)`
6. Case study - an agentic workflow `(static)`
7. The ML/AI system design interview `(static)`

---

# WebR runnability (honest)

| Band | Sections | Lessons | Live `(R)`+`(R~)` | `(static)` |
|---|---|---|---|---|
| Core (M1-M9) | 9 | ~51 | **~63%** | ~37% (Docker, deploy, CI, IaC, serving runtimes) |
| Advanced (M10-M19) | 10 | ~56 | **~45%** | ~55% (infra, scale-out, deploy strategies, security, platform) |
| AI & LLM systems (M20-M24) | 5 | ~33 | **~40%** | ~60% (serving, fine-tuning, vLLM, infra = cross-language) |
| Capstone (M25) | 1 | 7 | ~15% | ~85% |
| **Whole track** | **25** | **~147** | **~48%** | **~52%** |

The runnable half is real and concentrated where it counts: **pipelines, data validation, drift math, testing, evaluation (incl. LLM-as-judge and retrieval eval orchestrated via ellmer + duckdb), serialization, profiling, caching, agent tool-calling logic**. The static half is genuine infrastructure (containers, GPUs, clusters, live servers, vLLM) - taught with the real Dockerfile/YAML/config + precomputed output + a "run this locally / in your cloud" callout, plus diagram and architecture widgets so a `(static)` lesson is still interactive *in experience*. For an engineering track that now spans GPU-served AI systems, ~48% genuinely-live is strong - and far beyond any slides-only MLOps course.

# Boundary with the Data Scientist track
- DS **C12** is the *shipping intro* (hello plumber/vetiver/targets); everything past it is this track.
- DS **A7 (robustness/drift)** is the *modeling* response; MLE **M9/M10/M11** are the *systems* response. Cross-link, don't duplicate.
- DS Specialization **S4 (LLMs & GenAI)** teaches the DS how to *use* LLMs; MLE **M20-M24** teach how to *operate* them at scale. Same topic, different altitude.
- Prerequisite: finish DS Core (you cannot productionize what you cannot build).

# Build order
1. M2 (targets) + M3 (data validation) + M7 (testing/eval) - high-WebR backbone. 2. M4/M5 (registry, serving). 3. M6/M8 (Docker, CI). 4. M9/M10/M11 (monitoring, observability, drift - high value). 5. the AI band: M21 (RAG) + M23 (eval) + M22 (agents) first - they are the strongest marketing hooks and the most ellmer-runnable. 6. the rest of Advanced as demand dictates; M25 capstone last.
