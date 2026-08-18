# Interactive Lesson contract (SSOT)

> **Note (2026-08-18):** the authoring grammar in this file is reproduced
> inside `.claude/skills/write-lesson/SKILL.md` (Part 6), which is what
> writers read. This file remains the DOM contract that `md2lesson.py`,
> `lesson-mode.js`, the widgets, and the exercise manifest builder keep in
> sync with each other. Change the grammar here AND in the skill.

The single source of truth for the lesson-mode pipeline. `md2lesson.py` PRODUCES this DOM, `www/lesson-mode.js` CONSUMES it, `www/lesson-widgets/*` mount into it, and `build_exercise_manifest.py` authorizes its gradable steps. Keep all four in sync with this file.

## Pipeline

```
lessons/<slug>.md  --(_build/md2lesson.py)-->  _lessons/<slug>.html  --(build.py + template.html)-->  /<slug>.html  (repo ROOT, flat URL)
```

- Source lives in `lessons/` (markdown) + `_lessons/` (fragments), parallel to `posts/`+`_posts/`. Both committed.
- Built page outputs to repo ROOT, so `hub_slug == file stem == URL segment` (grading reuse depends on this).
- `lessons/*.md` + `_lessons/*.html` are blocked from serving by `functions/_middleware.ts`.
- Slugs are GLOBALLY UNIQUE across `posts/` and `lessons/` (shared root + shared grading-hub namespace). Use a course prefix, e.g. `RF-Course-Lesson-1`.

## Frontmatter (flat `key: "value"` lines)

Required: `title`, `description`, `keywords`, `post_type: "LESSON"`, `curriculum_id` ("L.S.P"), `webr: true`, `course_id`, `course_title`, `course_lesson`, `course_total`.
Optional: `course_landing` (slug.html), `course_next` (slug.html), `course_prev` (slug.html), `lesson_access` ("free"|"pro" — overrides the curriculum_id rule), `mathjax`.

`lesson_access` default is derived at build time: **free if curriculum level==1 OR section==1, else pro.**

## Authoring grammar

Body = ordered steps. Each step starts with a fence line:

```
=== step === <type>
```

`<type>` ∈ `cover | concept | widget | quiz | tryit | complete`. (`cover` and `complete` are concept-like; the type is passed through as `data-step-type` for styling.) The splitter MUST ignore `=== step ===` lines that fall inside a ```` ``` ```` code fence.

Inside a step, lines starting with `::` are directives; everything else is ordinary markdown (rendered with the md2html leaf helpers: headings, paragraphs, callouts `[TIP]/[NOTE]/[WARNING]/[KEY INSIGHT]`, ```` ```r ```` blocks -> webr-container, lists, tables, `<details>`, inline bold/italic/code/links).

Directives:

- `::eyebrow <text>` — small label above the step heading.
- `::widget <type> <json>` — mount point for an interactive widget; `<json>` is the config object (see widget schema).
- `::quiz <json>` — begins a multiple-choice quiz. `<json>` = `{"correct": <1-based int>, "gate": true|false, "difficulty": "beginner|intermediate|advanced"}`. The lines immediately following are options:
  - `- <option text> ::ok <feedback>` (the correct option's feedback; there should be exactly one whose index == `correct`)
  - `- <option text> ::no <feedback>` (shown when any wrong option is chosen; last `::no` wins as the generic wrong-feedback)
  - An option may also be a plain `- <option text>` with no `::ok/::no`.
- `::check <json>` — turns the PRECEDING ```` ```r ```` block in the step into an editable, checked try-it. `<json>` = `{"regex": "<JS regex source>", "gate": true|false, "difficulty": "...", "ok": "<feedback>", "no": "<feedback>"}`.
- `::solution` — the NEXT ```` ```r ```` block is the revealable solution for the preceding `::check`.

A step is GRADABLE if it carries a `::quiz` or `::check` with `"gate": true`. Gradable steps block "Continue" until passed and emit a nested exercise section (below).

## Emitted DOM (per step)

```html
<section class="lesson-step" data-step="<N>" data-step-type="<type>"[ data-gate="1"]>
  <div class="lesson-step-eyebrow">EYEBROW</div>            <!-- only if ::eyebrow -->
  <!-- rendered markdown: <h2>, <p>, callouts, webr-container, lists, tables -->

  <!-- widget step: -->
  <div class="lesson-widget" data-widget-type="<TYPE>" data-widget-config='<JSON>'>
    <noscript><img src="..." alt="..."></noscript>           <!-- static fallback -->
  </div>

  <!-- quiz step (gated): wrap the quiz in the exercise contract so grading authorizes it -->
  <section class="exercise" data-exercise-id="<slug>-step<N>" data-grade-mode="self-check" data-difficulty="<DIFF>">
    <div class="lesson-quiz" data-correct="<K>">
      <button type="button" class="lesson-opt" data-i="1"><span class="lesson-opt-mk">A</span><span>OPTION 1</span></button>
      <button type="button" class="lesson-opt" data-i="2">...</button>
      <div class="lesson-qfb lesson-qfb-ok">OK FEEDBACK</div>
      <div class="lesson-qfb lesson-qfb-no">NO FEEDBACK</div>
    </div>
  </section>

  <!-- tryit step (gated): -->
  <section class="exercise" data-exercise-id="<slug>-step<N>" data-grade-mode="self-check" data-difficulty="<DIFF>">
    <div class="lesson-tryit" data-check-regex="<JS REGEX SOURCE>">
      <textarea class="lesson-tryit-input" spellcheck="false">STARTER CODE</textarea>
      <div class="lesson-tryit-actions">
        <button type="button" class="lesson-tryit-check">Check</button>
        <span class="lesson-tryit-fb lesson-tryit-ok">OK</span>
        <span class="lesson-tryit-fb lesson-tryit-no">NO</span>
      </div>
      <details class="lesson-tryit-sol"><summary>Show answer</summary><pre><code class="language-r">SOLUTION</code></pre></details>
    </div>
  </section>
</section>
```

Notes:
- `data-exercise-id` = `<file-stem>-step<N>` (N = 1-based step index). Globally unique because the slug is unique.
- `data-grade-mode="self-check"` for all lesson quizzes/try-its: the client decides pass and POSTs `passed:true`; the server awards XP by `data-difficulty` (manifest is the SSOT, client can't inflate).
- `data-difficulty` defaults to `beginner` (10 XP) if the directive omits it.
- The `<JSON>` in `data-widget-config` is wrapped in SINGLE quotes; widget configs must contain no single-quote characters (JSON uses double quotes).
- Non-gated quiz/widget steps still render; only `gate:true` adds `data-gate="1"` to the step and is required-to-pass.

## Consumer responsibilities (`www/lesson-mode.js`)

- Adds `body.lesson-js-ready`; CSS then shows one `.lesson-step.on` at a time (no-JS shows all steps -> crawlable).
- Injects player chrome: top bar (exit -> course_landing, "Lesson X of T", `Step N / M`), segmented progress, Back / Continue stepper.
- `data-gate="1"` step: Continue disabled until the step gains `.passed` (quiz answered correctly / try-it regex matches).
- On pass of a gradable step: `RSCExerciseAPI.reportSolve(hub, exerciseId, hintsUsed)`; resume + per-step passed flags in `localStorage["rsc-lesson-v1:" + location.pathname]`.
- Calls `window.LessonWidgets.mountAll(stepEl)` whenever a step becomes visible (canvases must size when shown, not while hidden).
- Pro gate: reads `body[data-lesson-access]`; if `pro` and user is not Pro (`body.pro` / `auth-hydrated`), lock steps after a 2-step preview and inject a paywall CTA to `/pricing.html`.

## Widget config schema (reference type: `decision-region`)

`window.LessonWidgets.register("<type>", function mount(el, cfg){...})`. `mount` is idempotent (guard on `el.dataset.mounted`), self-contained, deterministic (seeded PRNG), and must build its own controls + canvas inside `el`.

`decision-region` cfg:
```json
{
  "dataset": "two-blobs-diag",   // seeded generator id
  "control": "max-depth",         // the single slider variable
  "min": 1, "max": 10, "start": 3, "step": 1,
  "showTest": true,               // draw held-out points + report test accuracy
  "noise": "planted",             // plant opposite-class points so deep trees overfit
  "seed": 7,                      // mulberry32 seed (reproducible)
  "labels": { "c0": "stays", "c1": "churns" },
  "metrics": ["train_acc", "test_acc", "verdict"]
}
```

Widgets port the verified numeric models from `_mocks/rf-course-lesson{1,2,3}.html` (mulberry32 / gauss / blob / build / predict / forest averaging / OOB curve). Available reference types: `decision-region`, `forest-averaging`, `decorrelation`, `oob-tuner`.
