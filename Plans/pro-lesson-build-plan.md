# Pro Lesson Experience: gap analysis, enhancements, and build plan

> Companion to mock v3 (`_mocks/pro-lesson-experience-mock-v3.html`) and the
> converged monetization plan. Model: free SEO tutorials stay public and indexed;
> Pro is a premium, deeper, beautifully-built learning experience of the same and
> deeper material. This doc finds the gaps in the mock, the highest-leverage
> enhancements, and a concrete build plan.

---

## 1. What the mock already gets right

A genuinely different class of artifact: calm ad-free reading, premium typography,
a concept diagram, a decision guide, real depth (the silent row explosion, key
mismatches, modern `join_by()`), expert-discipline callouts, and a practice block.
The depth, not the styling, is what justifies paying. Keep that bar.

---

## 2. Gap analysis

### A. Pedagogy and experience
1. **The code is not actually runnable.** The single biggest gap. A premium lesson
   must let you edit and run R live, change inputs, and watch the output, including
   watching the row explosion actually happen. The site can already run R in the
   browser. Faking it with a static "Run" wastes the strongest differentiator over
   both free posts and AI: AI describes, this lets you do.
2. **No inline active recall.** Reading is passive. There are no small "your turn"
   checkpoints between sections with an instant check. Premium learning is active.
3. **No in-lesson progress or resume.** No reading-progress bar, no section
   completion, no "resume where you left off." A paid experience should remember you.
4. **No retention layer.** Nothing brings the learner back. Free and AI never do;
   that is exactly the opening. No spaced-recall, no "due for review."
5. **The diagram is static.** The join lesson is begging for an interactive diagram
   (toggle the join type, drag a row, watch the result update).
6. **No connection to the rest of the system.** The lesson does not reference the
   learner's weak spots, the level project it feeds, or the certificate it counts
   toward. Cohesion is the thing AI cannot give; the mock under-uses it.
7. **No dark reading mode or type controls.** Table stakes for a premium reader.

### B. Conversion
8. **No defined free-to-Pro encounter.** The toggle is a demo device. In reality,
   how does a free reader discover and sample the Pro version? Undefined. This is the
   actual conversion surface and it is missing.
9. **No in-lesson trust or social proof** (completed-by counts, ratings, "written by
   the author of the tutorials").
10. **No outcome framing at the top** ("after this lesson you can join messy tables
    without corrupting totals"), which is what a buyer is actually buying.

### C. Production and scalability (the real cost)
11. **No authoring system.** Each premium lesson looks bespoke. Without a component
    library and a templated pipeline, this does not scale past a handful of pages.
12. **No reuse strategy.** The free tutorial should be the starting draft for the Pro
    lesson, then deepened and redesigned. Not defined.
13. **Diagrams do not scale.** Custom illustrations per lesson are expensive without
    a small reusable diagram kit and a house illustration style.

### D. SEO and technical
14. **Duplicate-content risk is unaddressed.** Pro pages covering free topics must
    never compete with the free pages in search. Needs a definite answer (below).
15. **No URL or access architecture** for Pro pages.

---

## 3. Top enhancement ideas (ranked by leverage)

1. **Live, editable, runnable R, with the messy dataset loaded.** Edit, run, break
   it, watch the row count explode, fix it. This is the heart of "Pro makes you good,"
   and the site can already do it. Non-negotiable for v1.

2. **"Spot what the AI got wrong" (the signature feature).** Each lesson includes a
   real-looking AI-generated solution with a subtle, costly bug (a silent
   many-to-many, a leaked target, a mis-specified test), and challenges the learner to
   find it before revealing it. This is the entire "judgment in the age of AI" thesis
   made concrete, it is fun, it is shareable, and a free AI tutor structurally cannot
   offer it about itself. This alone could define the brand.

3. **Inline "your turn" micro-checkpoints** with instant deterministic checks between
   sections. Converts passive reading into active practice without leaving the lesson.

4. **A retention engine: spaced-recall review cards.** Key ideas resurface days later
   ("4 cards due from Joins"). This builds the daily habit, lifts mastery, and is the
   single strongest driver of renewal. Deterministic, no AI, cheap to run.

5. **An interactive concept diagram** (toggle join type, drag a row, see the output
   change). Understanding plus wow, reusable as a diagram-kit pattern across topics.

6. **System cohesion**: every lesson shows the track and certificate it counts toward,
   references the learner's weak spots, and names the project it feeds, ending in the
   portfolio. The connective tissue AI and free blogs cannot provide.

7. **Premium reader polish**: dark mode, type-size control, reading progress, resume,
   and a downloadable polished PDF of each lesson (the "handbook" download perk).

8. **Outcome and trust framing** at the top and bottom of every lesson (the capability
   you gain, completed-by count, author byline, "written by a human").

---

## 4. The build plan

### 4.1 The Pro lesson design system (build once, reuse everywhere)

A component library so lessons are authored in markdown, not hand-built:

- **Lesson chrome**: track/stage/lesson, progress dots, reading-progress bar, resume,
  save, dark toggle, type-size.
- **Typography**: Newsreader serif for prose + IBM Plex for UI and code (as in the mock).
- **Runnable code block**: editable, real in-browser execution, inline output, reset.
- **Inline checkpoint**: a "your turn" prompt with an instant deterministic check.
- **Callout kit**: warning, expert, under-the-hood, and the **AI-pitfall** variant.
- **Diagram kit**: a small set of reusable, house-style interactive diagrams
  (join viz, distribution viz, model-fit viz, pipeline viz) rather than bespoke art.
- **Decision guide**: the cards pattern ("which join / test / model?").
- **Practice block**: attempt-free, Pro worked solutions.
- **Review cards**: the spaced-recall component.
- **Summary + next-lesson + cert/track footer.**

Deliverable: a `pro_lesson` builder (a sibling to the existing `md2html` + template
pipeline) that renders these components from a markdown spec.

### 4.2 SEO-safe access architecture (decided)

- **Pro lessons live behind auth** at `/learn/<slug>`. A Pages Function checks the Pro
  entitlement. Bots and logged-out users never see the full premium content, so there
  is **zero duplicate-content risk**.
- **Public preview** of each Pro lesson: the first section plus a tasteful paywall,
  served at the same URL to logged-out users, set `noindex` and `canonical` to the
  free tutorial. This is the conversion surface.
- **The free SEO post** keeps its rankings untouched and carries **one** tasteful
  link: "There is a premium, deeper, ad-free version of this lesson." That single
  internal link is the discovery path; no keyword stuffing, no SEO change.

### 4.3 Authoring pipeline (how this scales for a solo operator)

1. Start each Pro lesson from the **existing free tutorial markdown** as the first
   draft (the content already exists and is trusted).
2. Deepen it: add the failure modes, the modern idioms, the expert discipline, the
   AI-pitfall, and the runnable dataset.
3. Drop in components from the library (callouts, diagram, checkpoints, practice).
4. Author once, reuse the design system. The marginal cost per lesson is the depth,
   not the design, which is exactly the right thing to spend on.

### 4.4 Which lessons to premiumize first (prioritization)

Criteria: high free traffic (proven intent), high learning-intent (people actively
upskilling, not just looking something up), foundational (unblocks the path for
everyone), and depth-rich (where the premium gap is dramatic).

**Launch set (about 12 lessons), in order:**
1. R data structures (vectors, lists, data frames) - the on-ramp everyone hits.
2. dplyr core verbs - highest daily-use intent.
3. Joining data with dplyr - already prototyped; depth is dramatic.
4. Tidy data and reshaping (pivot) - high confusion, high payoff.
5. ggplot2 grammar of graphics - flagship, visual, high traffic.
6. Exploratory data analysis - the analyst's core workflow.
7. Linear regression - flagship, depth-rich (diagnostics, assumptions).
8. Logistic regression and classification - high job-intent.
9. Choosing the right statistical test - judgment-heavy, AI-pitfall gold.
10. Missing values and data cleaning - universal pain, depth-rich.
11. Functional programming with purrr - the developer on-ramp.
12. Hypothesis testing framework - researcher on-ramp.

That set covers a complete premium Level 1, the spine of Level 2, and a flagship
proof point in each of Levels 3 and 5, enough to launch Pro credibly without
premiumizing all 90 lessons.

### 4.5 Phasing

- **Phase 0 (proof):** build the design system + the runnable-code component + one
  flagship lesson (Joins) + the auth-gate, preview, and paywall + the free-post link.
  Instrument conversion. Ship to a small audience.
- **Phase 1 (the on-ramp):** premiumize the full launch set (12 lessons). Add the
  inline checkpoints and the cert/track cohesion.
- **Phase 2 (stickiness):** add the retention engine (review cards) and the
  "spot the AI bug" feature across the launch set. These drive renewal.
- **Phase 3 (breadth + B2B):** expand to the rest of Levels 2 to 6 by traffic
  priority; ship the Teams page.

### 4.6 What to measure

Preview-to-upgrade rate (the core funnel), lesson completion, return rate and
review-card engagement (retention), assessment starts and certificate claims, and
renewal. The leading indicator to obsess over early is **preview-to-upgrade**: it
tells you whether the premium gap is obvious enough to pay for.

---

## 5. The honest cost and the one risk

The design system, the runnable engine, and the SEO plumbing are a real but bounded
one-time build. The recurring cost is **authoring depth**: every Pro lesson must
genuinely carry the joins-lesson level of judgment and craft, or the model collapses
into "the free post with nicer fonts." That is the single risk, and the single thing
worth protecting. Build the system once; spend the ongoing effort on depth, starting
with the twelve lessons above, and let it compound.
