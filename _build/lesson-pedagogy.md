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
- **R12 Grounded, plain-spoken, and warm (the teaching-quality rule).** Open the lesson, and each new concept, with a CONCRETE, NAMED, NUMBERED example from everyday life (a specific person, a specific thing, real units, real numbers), THEN generalize to the abstraction; never the reverse. Carry ONE running example through the whole lesson so the learner always has something tangible to picture. NO undefined referents: name the noun before the pronoun - never "you measured something", "a sample", "the difference", "a value" with nothing said about what it actually is - and define every term and symbol in plain words on first use. Voice: a patient, friendly teacher who sits the learner down and explains every step, anticipates exactly where they will get confused, and never hand-waves. Abstract-first openings, jargon-before-definition, and "a sample of what?" gaps are defects, not style. MEASURE (judge): at every step, could a beginner picture exactly what is being measured? is there one concrete running example throughout? any undefined "it" / "sample" / "difference"?

- **R13 As many steps as it takes (NO cap, NO time box).** There is no step limit and no minute budget. Use as many steps as a learner at the entry bar needs to understand everything in full detail, with nothing rushed, glossed, compressed, or skipped. NEVER shorten, drop, or speed through an explanation to hit a step or word count - thoroughness beats brevity every single time, and expanding for a beginner's sake is never "padding." A lesson still covers ONE coherent TOPIC: split into a multi-lesson course only at a genuine conceptual seam (a separate topic that deserves its own arc), judged by CONCEPTUAL COHERENCE, never by step count. A rich topic taught properly may run long, and that is correct and good; a lesson that is short but leaves a learner behind has failed. Plan the arc (and any topic split) UP FRONT. MEASURE: judge confirms each lesson is one coherent topic AND that no idea was rushed or omitted for length. There is NO step-count penalty; the only length defect is a step that is a wall of text (split THAT step, do not cut content).
- **R14 Room to breathe (care over speed - the anti-rushing rule).** Give every new idea its own space: introduce it in plain words, show ONE concrete worked example, then a check, before moving to the next idea. Do NOT stack two new ideas into one step, and do NOT race to the next thing. Two specific defects that read as "rushed and careless," both hard failures: (a) **clever-golf code** - a compact idiom a beginner cannot parse (e.g. `r * (tau - (r < 0))`). Prefer explicit, readable R (`ifelse`, named intermediates, one operation per line); if a terse idiom is genuinely necessary, SHOW what it computes on a concrete input before using it. (b) **assert-not-show** - claiming a non-obvious line or formula "does X" without demonstrating it. Instead RUN it on a concrete value so the reader sees the result (e.g. `check_loss(15, 0.9)` -> `13.5`, `check_loss(-15, 0.9)` -> `1.5`), then generalize. MEASURE (judge): at every step, was this explained with a patient teacher's care or rushed? is any code clever-cryptic instead of readable? is any non-obvious claim asserted instead of shown on a concrete value?

- **R15 Prose voice (shared SSOT: `_build/prose-voice.md`).** Three rules, all apply
  to every word of step prose, quiz stems and try-it framing. **P1 write about the topic, not the page:**
  cross out any phrase naming the lesson ("this lesson", "you will learn", "by the
  end") and check that a fact about the SUBJECT survives; if only a claim about the
  lesson's promise or method is left, cut the sentence. There is no banned word
  list. **P2 each sentence follows from the one before:** adjacent facts need a connective saying how
  one bears on the other (`because`, `so`, `which means`, `whereas`, `even though`,
  `once`, `until`), openings must not all be the subject, and length must vary hard
  (longest at least twice the shortest in any 3+ sentence paragraph). The reorder
  test: shuffle a step's sentences, and if it reads just as well, it is a list
  wearing prose punctuation. MEASURE (automated, WARN):
  `python Scripts/prose_flow_check.py lessons/<slug>.md`. MEASURE (judge): the
  reorder test on the two flattest steps. **P3 never make up a number:** every number in prose must be sourced, measured, or removed. "Almost always" is honest when you have not counted; "ninety percent of the time" is not. Take the position without manufacturing a statistic to support it.

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
| LLM-judge (rubric, fresh agent) | **prose voice (R15: cargo test on any self-referential sentence; reorder test on the two flattest steps)**, from-scratch (R2), depth ladder (R3), continuity (R4), **visual fit (R6: any visualizable concept taught in prose alone? is each visual the right one?)**, **grounded + warm (R12: concrete named running example throughout, no undefined referents, friendly-teacher voice)**, **one coherent topic, nothing rushed or compressed to fit a length (R13)**, **care over speed (R14: each idea given room; no clever-cryptic code; non-obvious claims shown on a concrete value, not asserted)**, distractor quality (R5), gap critique (R8) |
| Headless (Playwright) | functional QA (R10) |

## Definition-of-done checklist

- [ ] Plan artifact exists; every objective has a teaching step + a check
- [ ] Cover has a visual (widget / diagram / image), not text alone
- [ ] Every visualizable concept (structure / process / distribution / boundary / sample / relationship) is shown at its step, not prose alone
- [ ] Prerequisites stated + linked; no unexplained leaps
- [ ] Nothing rushed (R13/R14): each new idea gets its own space (intro -> concrete example -> check); no two new ideas crammed into one step; length is whatever thoroughness needs, with NO step cap
- [ ] Code is readable, not clever-golf; every non-obvious line/formula shown on a concrete value, not asserted (R14)
- [ ] Prose voice (R15): no sentence whose only cargo is the lesson itself; connectives present; sentence length varies; no step survives the reorder test
- [ ] Core concepts hit the depth ladder; formulas rendered in MathJax
- [ ] >=1 try-it + >=1 quiz; a check near each concept; distractors are real misconceptions
- [ ] Every widget computes real results
- [ ] Gap critique done + fixes applied
- [ ] 3-5 references, all resolving
- [ ] Headless QA passes (steps / gates / widgets / links / no-JS / Pro gate)
- [ ] A finisher can pass all objective-checks unaided
