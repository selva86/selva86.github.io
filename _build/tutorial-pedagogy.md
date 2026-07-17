# Tutorial Pedagogy (SSOT)

The quality contract for every core tutorial post written by the tutorial factory
(`Scripts/batch_tutorials.py` -> `/write-tut` -> `/verify-tut` -> `/publish-tut`).
`Scripts/tutorial_quality_check.py` enforces the deterministic half; `/verify-tut`
(a fresh agent) enforces the judgment half. Adapted from `_build/lesson-pedagogy.md`
for the article format: H2 sections instead of player steps, runnable code blocks and
rendered diagrams instead of widgets, plus the SEO surface (title, meta, FAQ,
references) that lessons do not carry. Terse by design: a rule with no measure is
not a rule.

## Definition of done

A post is done only when **a reader who knows basic R (can install a package, make
a vector, call a function) can read it top to bottom and understand every sentence,
every symbol, and every line of code without opening another tab.** Nothing used is
left undefined. The reader finishes able to DO the thing the title promises, not
just recognize the words. That is the whole game: a reader who never gets stuck
never leaves, and a page readers do not leave is a page that ranks.

Three gates, in order: **PLAN** (before writing) -> **BUILD** (while writing) ->
**VERIFY** (before publish).

## The exemplar

`posts/MCMC-in-R.md` is the structural gold standard: read it
before writing to calibrate section rhythm, code density (roughly one runnable block
per 200 words), callout usage, figure placement, FAQ, and reference style. Match its
polish; do not copy its topic-specific choices.

## Gate 1 - PLAN (artifact required before authoring)

Write `post_plans/<slug>_plan.md` first. No plan, no post. Before drafting a single
sentence, decide HOW to teach this topic, not just what to cover. It must contain:

- **Objectives** - 3 to 6 observable "by the end you can..." statements. MEASURE:
  each maps to (a) the H2 section that teaches it and (b) the code block or worked
  example where the reader sees it done (objective -> section -> payoff table).
- **Pedagogy and sequencing** - the deliberate teaching plan, decided up front: the
  simplest true path from zero to the objectives, and the order that lets a reader
  build understanding with no gap and nothing used before it is explained. State in
  2-4 sentences WHY this order (what must be understood before what, where the one
  hard idea sits and how the sections before it make it easy). MEASURE: the concept
  order and section arc below follow it; the judge checks the sequence has no leap.
- **Reader questions, before and after** - list the questions a real reader brings
  BEFORE reading (what is this, why do I need it, when do I use it, how is it
  different from the obvious alternative) and the questions they will have AFTER
  (edge cases, gotchas, common errors, "which option do I pick", "why did I get
  this message"). MEASURE: every before-question is answered early in the body;
  every after-question is answered by a later section or the FAQ. This list seeds
  both the section arc and the FAQ.
- **Entry bar** - what the reader is assumed to know (keep it to "basic R" plus at
  most 1-2 linked site posts). Everything above the bar is taught inline. MEASURE:
  stated explicitly; "from scratch" is judged relative to it.
- **Concept order** - the NEW concepts the post introduces, in dependency order:
  nothing is used before it is defined. MEASURE: an ordered list the build follows.
- **Section arc** - every H2 in order, each naming: the ONE question it answers
  (H2s are phrased as questions), the new idea it adds, the code payoff the reader
  runs there, and any figure it carries. MEASURE: one-new-idea-per-section; every
  concept used appears in an earlier section or the entry bar.
- **Diagram plan** - which concept gets the Mermaid diagram(s) and what each shows.
  [C] posts need at least one rendered diagram (project hard rule).
- **Running example** - the ONE concrete, named, numbered scenario that opens the
  post and threads through it (see T12).

## Gate 2 - BUILD (authoring rules)

- **T1 First code block pays off.** The first runnable block delivers the payoff
  the reader came for: a visible, meaningful result shown as `#>` output, inside
  the FIRST H2, after just enough prose for the reader to predict what each line
  does. Never a bare `library()` + read-data block with nothing to show, and no
  figure above it to push it below the fold. MEASURE (automated): first ```r block
  appears in section 1 and contains `#>` output lines.
- **T2 From scratch, no leaps.** Every term, symbol, function, and argument is
  explained in words on first use; every concept is either in the entry bar or
  taught inline before it is used. Jargon-before-definition is a defect. MEASURE
  (judge): "could a reader who knows only basic R follow every single line?"
- **T3 Depth ladder (rigor).** Each core concept gets four layers: (1) intuition and
  why it matters; (2) the formalism - definition/formula with every symbol defined,
  in real MathJax `\(...\)` when math is involved (never prose like "s squared over
  n"); (3) a worked example the reader RUNS; (4) limits / when it breaks or misleads.
  Posts containing formulas set `mathjax: true`. MEASURE: core concepts hit layers
  1-3 minimum; the judge checks layer 4 on the post's central concept.
- **T4 Continuity.** Each section opens by bridging from the previous one; the post
  ends with a Summary that closes the loop on the opening scenario. No orphan
  sections; every concept introduced gets used. MEASURE (judge).
- **T5 Code cadence.** Runnable code within every teaching section; a [C] post has
  at least 8 runnable blocks (5 for FR/EX). Each block is 5-25 lines, teaches ONE
  thing, and shows REAL output as `#>` comments captured from an actual R run,
  never invented. Blocks share state down the page (the reader's session persists
  like notebook cells) but the PAGE as a whole is self-contained: every object used
  is created by an earlier block on this page, every file read is written by an
  earlier block, every package is `library()`-ed before use. MEASURE (automated):
  block counts, `#>` presence, object/file self-containment, real execution.
- **T6 Show the structure.** Any concept that is inherently visual - an object
  hierarchy, a decision flow, a process, a data layout - is carried by a rendered
  Mermaid diagram or a plot the reader generates, AT the section that introduces
  it, never prose alone. Diagrams are written as `.mmd` in `_build/mermaid/`,
  rendered via `python Scripts/render_mermaid.py _build/mermaid/ --output
  screenshots/`, and referenced as `![alt](screenshots/<slug>-<name>.webp)` with a
  caption line. MEASURE (automated): [C] posts reference at least one existing
  `screenshots/<slug>-*.webp`; (judge): the diagram sits at the right concept.
- **T7 Integrity.** No fabricated outputs, data, stats, or citations. Every `#>`
  line is what the code actually printed. Never name WebR in the post (say
  "interactive code" / "runs in your browser"). No em dashes anywhere (use a
  hyphen, a colon, or a comma). MEASURE (automated): execution match + banned
  strings.
- **T8 Package fencing.** The browser runtime runs a known package set:
  `Scripts/webr-package-compat.json` is the ONLY source of truth. A ```r block may
  only `library()` packages whose status is `runnable`. Teaching a package that is
  not in the registry (or not runnable) is fine and often necessary: put that code
  in a ```r-static block (rendered as non-runnable, R-highlighted), frame it "run
  this locally", and still show its real output as `#>` lines captured from a local
  R run. Never mark a runnable package static (a static dplyr/ggplot2 block is a
  defect); never let an unrunnable package into a live block. MEASURE (automated):
  registry check per block.
- **T12 Grounded, plain-spoken, and warm (the teaching-quality rule).** Open the
  post, and each new concept, with a CONCRETE, NAMED, NUMBERED example (a specific
  person or dataset, real units, real numbers), THEN generalize. Carry ONE running
  example through the whole post so the reader always has something to picture. No
  undefined referents: never "a series", "the object", "the difference" with
  nothing said about what it is. Voice: a patient, friendly teacher who anticipates
  exactly where the reader will get confused and never hand-waves. Abstract-first
  openings are defects, not style. MEASURE (judge).
- **T13 Complete first, concise second (no padding, no redundancy).** Completeness
  of understanding is the top priority: when in doubt, explain MORE, never less;
  over-explaining a point beats leaving the reader stuck on it. But completeness is
  not repetition. Cover each idea ONCE, at the depth a basic-R reader needs, then
  move on.
  **The prove-once rule (concrete, and NOT in tension with completeness).** List the
  post's handful of central claims (e.g. "this series is multiplicative"; "classical
  decomposition loses the recent trend"). Each claim is ESTABLISHED ONCE, with the
  single most convincing demonstration - and that demonstration keeps its full,
  rigorous, unhurried treatment. Any SECOND or THIRD demonstration of the SAME claim
  is then collapsed to a one-line confirmation that points back ("the remainder test
  agrees, and shrinks over the decade"), never a fresh full worked example, table, or
  code block re-deriving the settled point. This removes NO depth: the claim still
  gets its complete treatment; you are only refusing to re-litigate a point the
  reader already accepted. A genuinely DIFFERENT claim (e.g. "which METHOD leaves
  least in the remainder" is a comparison of methods, not another proof that the
  series is multiplicative) is a new point and earns its own demonstration. Same for
  the running example: it opens the post and threads through, but each callback must
  teach something NEW; a callback that only re-states the payoff already delivered is
  cut. A correct rewrite of a bloated post comes out SHORTER, because the duplicate
  demonstrations collapsed, even though every original idea is still present.
  No word budget in either direction - a rich topic taught properly runs long and
  that is correct, and a post inflated by re-proving what the reader already accepted
  is bloated even when every sentence is true. The cut test: remove a passage ONLY if
  the reader loses no understanding they need; if it carries a new idea, a genuinely
  helpful new angle, or a needed worked step, keep it even if the post is already
  long. Wall-of-text sections remain a defect (split THAT section, do not cut
  content). MEASURE (judge): each central claim is demonstrated in full exactly once,
  extra demonstrations of it collapsed to one-line confirmations; every retained
  passage adds understanding the reader does not already have.
- **T14 Room to breathe (care over speed).** One new idea at a time: introduce it
  in plain words, show ONE concrete worked example, then move on. Readable R over
  clever golf (`ifelse()` and named intermediates, never `r * (tau - (r < 0))`);
  if a terse idiom is unavoidable, SHOW what it computes on a concrete value first.
  Never assert that a non-obvious line "does X": run it and show the result, then
  generalize. MEASURE (judge).
- **T15 Literal and grounded, no dramatic flourish.** Describe what the code, the
  numbers, and the method actually do, in plain literal language. Ban personification
  and dramatic metaphor: a method does not "shrug" or give "an answer of NA with a
  shrug", a frozen index is not a "rubber stamp", drift does not "masquerade as
  noise" or "pretend to be" anything, one value does not "drag its neighbours", data
  is not a "truth serum", an ACF does not "stop dead". These read as generated-copy
  flourish and cost the reader precision. Real-world examples and analogies are
  welcome, but ONLY when literally accurate and used to clarify a mechanism (a
  centred average genuinely needs points on both sides, so "the window runs off the
  end of the data" is fine - it is literally true); never reach for a vivid image
  for its own sake. Given a plain sentence and a clever one that say the same thing,
  write the plain one. MEASURE (judge): flag personified verbs and metaphor used for
  colour rather than accuracy.

### Article furniture (the parts lessons do not have)

- **Lead paragraph**: the first paragraph after the frontmatter directly answers
  the title's question in 2-3 sentences (the featured-snippet target). Write it
  last, write it plainly.
- **H2s as questions** where natural ("What is a ts object?", "When should you use
  xts instead?"). h3 is not used on this site; use `###` only knowing it renders
  as an h4 visual level.
- **Callouts**: use the site's blockquote callouts sparingly (a `> **Note:**` or
  `> **Watch out:**` where a real trap exists), never decoration.
- **FAQ section** near the end: 4-6 real questions people ask (phrased as a reader
  would type them), each answered in 2-4 sentences. No keyword stuffing.
- **Summary**: key takeaways as a compact table or tight bullets.
- **References**: 5-10 authoritative, REAL sources (package docs, CRAN vignettes,
  canonical texts like Hyndman's fpp3, papers), each a working URL with a one-line
  "why read this". MEASURE (automated): count + URLs resolve.
- **SEO fields** come from the curriculum entry: title from `ctr_title` (trim to
  <= 65 chars if longer; the site learned the hard way that Google mangles longer
  titles), meta description from `meta_description` (140-160 chars, sanitize any
  broken characters), keywords, and 10-15 `auto_link_terms` OTHER posts would use
  to reference this one.

## Gate 3 - VERIFY (nothing publishes until these pass)

- **T9 Deterministic gate**: `python Scripts/tutorial_quality_check.py
  posts/<slug>.md` exits 0. It checks frontmatter, structure, block counts, package
  fencing, self-containment, REAL EXECUTION of every block against its `#>` claims,
  diagram presence, banned strings, references, and the plan artifact.
- **T10 Fresh-eyes review**: `/verify-tut <slug>` - a separate agent (never the
  author) judges AI-tells, grounding, no-leaps, code-output sanity, section flow,
  distractor... (n/a for posts) FAQ quality, and runs the gap critique: what would
  a confused beginner still not get? what was used but never defined? what is the
  likeliest misconception and does the post address it? Bounded fixes, then the
  deterministic gate must still pass.
- **T11 Mastery.** A finisher can do what the objectives promised, using only what
  the post taught. MEASURE: objective -> section -> payoff table complete in the
  plan and honest in the build.

## Enforcement map

| Layer | Enforces |
|---|---|
| PLAN artifact | objectives <-> sections, pedagogy + sequencing, reader questions (before/after), entry bar, concept order, section arc, diagram plan, running example |
| `tutorial_quality_check.py` (deterministic) | frontmatter completeness + lengths, T1 first-code payoff, T5 counts + self-containment + REAL execution, T6 diagram exists ([C]), T7/T8 banned strings + package fencing, references resolve, plan exists |
| `/verify-tut` (fresh agent) | T2 no leaps, T3 depth ladder, T4 continuity, T12 grounded + warm, T13 complete-but-no-redundancy (no conclusion proven twice, no padding), T14 care over speed, T15 literal voice (no dramatic metaphor/personification), AI-tells, gap critique |
| `/publish-tut` | build + registries + tracker update + live verification |

## Definition-of-done checklist

- [ ] Plan artifact exists; every objective has a section + a payoff
- [ ] Plan states the pedagogy/sequencing and the reader's before/after questions
- [ ] Lead paragraph answers the title in 2-3 plain sentences
- [ ] First runnable block pays off inside the first H2
- [ ] Every term/symbol/function defined on first use; entry bar respected
- [ ] Core concepts hit the depth ladder; formulas in MathJax
- [ ] One concrete running example threads the whole post
- [ ] Every ```r block executes cleanly; every `#>` line is real output
- [ ] Package fencing per the registry; no static-runnable or live-unrunnable blocks
- [ ] [C]: at least one rendered diagram at the right concept
- [ ] No conclusion proven more than once; no padding; every passage earns its place (T13)
- [ ] Literal voice: no personification or dramatic metaphor for flourish (T15)
- [ ] No em dashes, no AI-tell phrases, WebR never named
- [ ] FAQ (4-6 real questions), Summary, References (5-10, resolving)
- [ ] Gap critique done and fixes applied (verify-tut)
- [ ] Deterministic gate green before AND after verify-tut's fixes
