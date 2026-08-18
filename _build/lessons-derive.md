# Lessons Derivation (Pass 0 SSOT for /write-lesson)

> **Note (2026-08-18):** the derivation rules here are reproduced inside
> `.claude/skills/write-lesson/SKILL.md` (Part 3), which is what writers
> read. Change a rule here AND in the skill.

How `/write-lesson` computes a lesson's metadata + frontmatter from a course request with ZERO interaction. Mirrors `pseo-derive.md`. Curriculum SSOT = the roadmap (`www/roadmap-curriculum.js`, RM2); a "course" is a roadmap node turned into a multi-lesson interactive module. Built catalog = `courses.json` (from `Scripts/build_lessons_tracker.py`).

## Input

A course/lesson identifier, one of:
- `<course-slug>` - build the next unbuilt lesson in the arc.
- `<course-slug>:<n>` - build lesson n (1-based).

Resolved against the course's planned arc (below) + `courses.json` (what is already built).

## Derived frontmatter (all flat strings)

- `post_type`: always `LESSON`.
- `course_id`: the course slug (e.g. `random-forest`).
- `course_title`: the course's human title.
- `course_lesson`: n. `course_total`: total lessons in the arc.
- `course_landing`: `<Course-Landing>.html` (the `post_type: C` landing).
- `course_prev` / `course_next`: sibling lesson slugs (`""` at the ends).
- filename / slug: `<CoursePrefix>-Lesson-<n>` - globally unique (md2lesson collision-checks vs posts/_posts/_lessons/root).
- `curriculum_id`: the roadmap node id `L.S.P` (level.section.position).
- `lesson_access`: the CANONICAL positional rule (below).
- `mathjax`: `true` if the lesson contains MathJax (`\(` or `\[`), else omit.
- `webr`: `true` (lessons run interactive R).
- `title`: `"<Course> Lesson <n>: <focus>"`. The text after the colon is the **catalog title** - the name shown on the roadmap, the player rail, and the player chrome. Write `<focus>` to read well alone, and make the lesson's **cover-step H2 exactly equal it** (roadmap row == cover heading == breadcrumb; the player derives its on-screen title from the cover H2). Do NOT give the cover an evocative-hook H2 that differs from the catalog title - put any hook in the cover body instead.
- `catalog_blurb`: a one-line **reason to take the lesson** - what it is for and why it matters - in a plain, credible practitioner voice. Required on every lesson. <= 14 words, concrete, **no function/method names** ("filter and sort rows", never `filter()`), and **no hype or AI-tells**: avoid salesy verbs and over-promises (e.g. "wreck", "in seconds", "for free", "quietly", "drowning", "supercharge"). State the purpose honestly; don't sell. Flows through `courses.json` to the roadmap subtitle. GOOD: "How to handle missing values so they don't distort your results." FLAT (too thin): "Handle missing values." OVERDONE (salesy): "Gaps quietly wreck every result, fix them in seconds."
- `description`: 150-160 char meta description. `keywords`: comma-separated.

## Access rule (canonical - do NOT diverge)

```
free  <=>  curriculum_id level == 1  OR  course_lesson == 1
pro   otherwise
```

Read `course_lesson == 1` **literally**: the FIRST lesson of every course is `free`; lessons 2..N are `pro` (the per-section free on-ramp). Do NOT read this as the curriculum_id middle number: a course whose id is `6.170.x` still has its lesson 1 (`6.170.1`, `course_lesson: "1"`) `free` and `6.170.2`+ `pro`. Section quizzes (`course_lesson = content+1`) are always `pro`. So: if `course_lesson == 1` -> `lesson_access: "free"`; else -> `lesson_access: "pro"` (unless the whole track is a level-1 free track, where all lessons are free).

This is the single source of truth. It resolves conflict C1: the roadmap renderer must badge + route interactive courses from this SAME rule (via `courses.json`), so a course's catalog badge always matches its in-player paywall. Override only with an explicit, recorded business reason (`lesson_access` in frontmatter wins).

## Arc + focus

The lesson arc (how many lessons; each lesson's focus + signature widgets) comes from the course's entry in **`Plans/lessons-curriculum.md`** (the curriculum-arcs SSOT). Pass 0 reads that entry. If the course is NOT there, it is a NEW course: STOP and report it (do not invent an arc silently). Keep arcs to 3-6 lessons (or 1 for a standalone complex lesson); each lesson is one coherent slice taught from scratch.
