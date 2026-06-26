# Lessons Derivation (Pass 0 SSOT for /write-lesson)

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
- `title`: `"<Course> Lesson <n>: <focus>"`. The rail short title is everything after the colon, so write the focus to read well alone.
- `description`: 150-160 char meta description. `keywords`: comma-separated.

## Access rule (canonical - do NOT diverge)

```
free  <=>  curriculum_id level == 1  OR  section == 1
pro   otherwise
```

This is the single source of truth. It resolves conflict C1: the roadmap renderer must badge + route interactive courses from this SAME rule (via `courses.json`), so a course's catalog badge always matches its in-player paywall. Override only with an explicit, recorded business reason (`lesson_access` in frontmatter wins).

## Arc + focus

The lesson arc (how many lessons; each lesson's focus + signature widgets) comes from the course's entry in **`Plans/lessons-curriculum.md`** (the curriculum-arcs SSOT). Pass 0 reads that entry. If the course is NOT there, it is a NEW course: STOP and report it (do not invent an arc silently). Keep arcs to 3-6 lessons (or 1 for a standalone complex lesson); each lesson is one coherent slice taught from scratch.
