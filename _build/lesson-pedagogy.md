# Lesson Pedagogy (SSOT)

The quality contract for every interactive lesson. The `/write-lesson` skill follows it; `Scripts/lesson_quality_check.py` (deterministic + LLM-judge + headless) enforces it. Companion: `_build/lesson-contract.md` (the DOM + authoring mechanics). Terse by design: a rule with no measure is not a rule.

## Definition of done

A lesson is done only when **a learner who meets the stated prerequisites can finish it with zero unexplained leaps and then pass every check unaided.** "From scratch" = from an explicitly declared entry bar, nothing used is left undefined. One lesson gets a learner to *competent* on its slice; *expert* = the whole course + spaced practice + references + the assessment.

Three gates, in order: **PLAN** (before writing) -> **BUILD** (while writing) -> **VERIFY** (before done).

## Gate 1 - PLAN (artifact required before authoring)

Write `post_plans/<slug>_lesson-plan.md` first. No plan, no lesson.

- **Objectives** - 3 to 6 observable "by the end you can..." statements. MEASURE: each maps to (a) a step that teaches it and (b) a check that tests it (objective -> step -> check table). An objective with no check fails.
- **Prerequisites (entry bar)** - assumed prior knowledge, each linked to its lesson/resource. MEASURE: stated explicitly; "from scratch" is judged relative to it.
- **Concept order** - the NEW concepts this lesson introduces, in dependency (topological) order: nothing is used before it is defined. MEASURE: an ordered list the build follows.
- **Step arc** - the ordered steps, each naming the ONE new idea it adds + **the visual that carries it** (widget / diagram / image, chosen from `_build/lesson-visual-catalog.md`) or an explicit `prose-only (why)` + its check + why. MEASURE: one-new-idea-per-step; every concept used appears earlier; **every step that introduces something visualizable (a structure, process, distribution, boundary, sample, or relationship) names a visual, never prose alone** - a blank or unjustified `prose-only` on a visualizable concept fails plan review.

## Gate 2 - BUILD (authoring rules)

- **R1 Cover carries a visual.** The first step (cover) MUST include a high-quality visual - an interactive widget, a diagram, or an image - never plain text alone. It should hint at the lesson's payoff. MEASURE (automated): the cover step contains a `::widget` or an `<img>`/diagram; a text-only cover fails.
- **R2 From scratch, no leaps.** Every term, symbol, and formula is defined in words on first use; every concept is either a linked prerequisite or taught inline before it is used. MEASURE (judge): "could a learner at the entry bar follow every single line?"
- **R3 Depth ladder (rigor).** Each core concept is taught in four layers: (1) intuition / why it matters; (2) formalism - the definition/math/formula with every symbol defined, in **real MathJax** (`\(...\)`), not prose like "s squared over B"; (3) a worked example + interactive exploration; (4) limits / when it breaks. MEASURE: core concepts hit layers 1-3 minimum; "expert" needs all four. Lessons that contain formulas set `mathjax: true`.
- **R4 Continuity.** Each step bridges from the previous; the lesson opens with a one-line recap of the prior lesson and ends motivating the next. No orphan steps; every concept introduced is used. MEASURE (judge): bridges present, no orphans.
- **R5 Practice cadence.** A check (quiz or try-it) within ~2 to 3 steps of every major concept; **at least one try-it AND at least one quiz** per lesson; easy checks right after teaching, one synthesizing exercise near the end. A try-it is an application solvable in under 2 minutes that needs thought, not recall. Quiz distractors are real misconceptions, not filler. MEASURE: automated counts + judge for distractor quality + placement.
- **R6 Show it, don't just tell it.** Any concept that is inherently visual - a structure (tree, network, matrix), a process or flow, a distribution, a decision boundary, a sample/resample, or a numeric relationship - MUST be carried by a visual (interactive widget, diagram, or image) AT the step that introduces it, never described in prose alone. Pick the visual from `_build/lesson-visual-catalog.md`; if none fits, add a NEEDS-BUILD row and flag it for hand-build, never skip or fake it. Interactives are reserved for "feel-it" moments (an abstract idea made manipulable) and MUST compute REAL results (no faked numbers/curves); static diagrams or images carry everything else and are the default. MEASURE: every visualizable step has a widget/diagram/image (deterministic lexicon check + judge); each widget maps to a concept; numbers are real.
- **R7 Integrity.** No fabricated data, metrics, citations, or testimonials. Runnable code actually runs; widget models are numerically correct. Never name WebR in user-facing text.

## Gate 3 - VERIFY (nothing ships until these pass)

- **R8 Gap / misconception critique.** Adversarial pass: what would a confused learner still not get? what was used but not defined? what is the single likeliest misconception - and is a quiz targeting it? which step describes something visualizable in words alone and should be shown instead? what did competitors cover that we did not? Apply the fixes; feed the misconceptions into quiz distractors. Best run by a fresh agent (do not let the author grade itself). MEASURE: a written critique + applied fixes (judge).
- **R9 References.** 3 to 5 authoritative, REAL sources (papers, official docs, canonical repos), each link-checked to resolve, each with a one-line "why read this." MEASURE (automated): count + every URL resolves.
- **R10 Functional QA (headless).** Every step advances; every gate opens only on the correct answer; every widget mounts + computes; every link/button resolves (no 404); no console errors; no-JS shows the full content (SEO); the Pro gate behaves. MEASURE: Playwright + link-check.
- **R11 Mastery.** A finisher can answer all objective-checks unaided; ideally an end-of-lesson synthesizing exercise. MEASURE: objective -> check coverage complete.

## Enforcement map

| Layer | Enforces |
|---|---|
| PLAN artifact (skill writes it; reviewable) | objectives <-> checks, prerequisites, concept order, step arc |
| `lesson_quality_check.py` (deterministic) | cover visual (R1), **visual coverage (R6): no step whose prose hits the visualizable lexicon lacks a widget/diagram/image**, >=1 try-it + >=1 quiz (R5), 3-5 references that resolve (R9), every `::widget` type exists, every gated step in the grading manifest, `mathjax:true` when formulas are present |
| LLM-judge (rubric, fresh agent) | from-scratch (R2), depth ladder (R3), continuity (R4), **visual fit (R6: any visualizable concept taught in prose alone? is each visual the right one?)**, distractor quality (R5), gap critique (R8) |
| Headless (Playwright) | functional QA (R10) |

## Definition-of-done checklist

- [ ] Plan artifact exists; every objective has a teaching step + a check
- [ ] Cover has a visual (widget / diagram / image), not text alone
- [ ] Every visualizable concept (structure / process / distribution / boundary / sample / relationship) is shown at its step, not prose alone
- [ ] Prerequisites stated + linked; no unexplained leaps
- [ ] Core concepts hit the depth ladder; formulas rendered in MathJax
- [ ] >=1 try-it + >=1 quiz; a check near each concept; distractors are real misconceptions
- [ ] Every widget computes real results
- [ ] Gap critique done + fixes applied
- [ ] 3-5 references, all resolving
- [ ] Headless QA passes (steps / gates / widgets / links / no-JS / Pro gate)
- [ ] A finisher can pass all objective-checks unaided
