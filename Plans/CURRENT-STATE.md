# Current state, 2026-08-07

Read this first. It is the handoff for the Publishing Handbook work and
everything that came out of it. Written at the end of a long session so a fresh
one can resume without archaeology.

Everything below is verified against the filesystem and git, not against a
status field. That distinction matters here: several bugs this session were
trackers claiming success the disk did not support.

---

## Branch

**Everything lives on `publishing-handbook`. Nothing is on `master`.**
So none of it is on r-statistics.co yet. The branch is pushed; the CF preview
builds from it.

The working tree carries roughly 1,900 uncommitted modified files from an
in-flight site rebuild that predates this work. Do not `git add -A`. Stage
explicit paths, always. The `tools/` directory is load-bearing and was wiped
once by a bulk add.

---

## The Publishing Handbook

A 65-chapter handbook on statistics for publication. Free, indexed, and the
trust layer under the paid lessons.

**16 of 65 chapters live**, verified against HEAD.

| Part | Chapters | Done |
|---|---|---|
| 1-7 (design, data, reporting, tables, figures, writing, guidelines) | 1-29 | 0 |
| 8 Reading a review (the hub) | 30 | 0, blocked |
| 9 The thirty objections | 31-60 | **16** |
| 10 Response and revision | 61-65 | 0 |

Within Part 9: assumptions 7/7, design 5/5, multiplicity 1/6, reporting 3/5,
model choice 0/6, reproducibility 0/1.

### The immediate next command

Chapter 44 is stuck in `writing` from a batch that was stopped externally.

```bash
# reset the stuck row, then resume
python - <<'EOF'
import json
t='handbook-status.json'; rows=json.load(open(t,encoding='utf-8'))
for r in rows:
    if r['chapter']==44: r['status']='pending'; r['slug']=None
json.dump(rows,open(t,'w',encoding='utf-8',newline='\n'),indent=2,ensure_ascii=False)
EOF
python Scripts/batch_handbook.py --part 9 --max 14
```

The pipeline runs clean. It has been stopped externally three times; it has not
failed on its own since the publisher was fixed.

### Chapter 30, the only genuinely blocked item

It is the handbook hub, `post_type: C`, 2,243 words, written before the handbook
skill existed. The owner decided it belongs to Part 8.

It fails the tutorial gate on **content**, not format: 4 auto-link terms where a
C post needs 5, no References H2, 5 runnable blocks where a C post needs 8, no
diagram. It also fails the handbook gate, correctly, because it matches neither
the seven-section objection template nor the five-section decision template.

To publish it: add `handbook: publishing`, `handbook_part: 8`,
`handbook_chapter: 30`, and exempt Part 8 in `Scripts/handbook_quality_check.py`
as a hub part with no fixed template. The hub is structurally different by
design and forcing either template would gut a page that works.

---

## The factory

Four stages, all working, all proven on real chapters.

```
/write-handbook-chapter -> handbook_quality_check.py -> /check-handbook-chapter -> /publish-handbook-chapter
   (writer)                  (deterministic gate)          (LLM judge)                 (mechanical publisher)
```

Driven by `Scripts/batch_handbook.py` from `handbook-status.json`, which is
seeded from `Plans/publishing-handbook-plan.md` by
`Scripts/build_handbook_tracker.py`. One fresh `claude -p` per chapter.

### Four bugs fixed this session, all the same shape

Each was a status claiming success the filesystem did not support. Worth
knowing because the pattern recurs:

1. **`publish()` trusted `claude -p`'s exit code**, which is 0 whether or not
   the skill did its work. Marked 7 chapters published when 1 had been built.
   Now checks fragment + page + committed.
2. **`verify_published()` used `git ls-files`**, which reads the index, so a
   staged-but-uncommitted file passed. Now `git cat-file -e HEAD:`.
3. **`set_state()` rewrote the whole tracker** from its startup snapshot, so an
   edit made mid-run was silently reverted. Now re-reads and merges.
4. **`/publish-tut` re-ran the tutorial gate** on handbook chapters, rejecting
   them for missing FAQ / Summary / References sections the format deliberately
   omits. Hence `/publish-handbook-chapter`, which runs no gate because the gate
   and judge already ran upstream.

### The judge is the interesting part

`Scripts/handbook_quality_check.py` carries no prose rules, on purpose. Six
regex "phrase families" were removed 2026-08-06 after they warned on *"that is
usually the whole answer"*, which is verbatim the sentence the authoring skill
holds up as the GOOD rewrite. A tic and a legitimate summary differ
semantically, not lexically.

That judgment moved to `/check-handbook-chapter`, which uses a **deletion test**:
cut the sentence, and if only emphasis is lost it is a tic; if a fact, a scope,
a consequence or which-outcome-applies is lost, it is content.

**`claude -p` does not reliably propagate exit status.** The judge signals
blocking through `Scripts/handbook-review.log` as well as its exit code.
`batch_lessons.py` and `batch_tutorials.py` still rely on exit codes alone.
That is a latent bug in the existing factories.

---

## Interactive lessons

**1 lesson built and gate-clean**: `lessons/Multiplicity-Lesson-1.md`, 15 steps,
5 gated checks, all 9 R blocks verified in R 4.6.0 and in the browser.

**All 8 widgets built and verified** in `www/lesson-widgets/`:
`multiplicity-sim`, `assumption-dial`, `cluster-icc-sim`, `dag-editor`,
`report-four-ways`, `wrong-family-fit`, `repro-repair`, `review-triage`.

Verification was not cosmetic. The Cox fitter matches `survival::coxph` to 8
significant figures; cluster SEs match `sandwich::vcovHC`, `vcovCL` and
`lme4::lmer` exactly; the DAG's path-tracing solution checks against `lm()` on
300k rows. All 20 emitted R blocks execute.

**The design decision**: 30 lessons, 8 widgets, one lesson per objection. An
earlier draft said 8 lessons; that conflated widget cost with lesson count and
ran against this platform's own design, where lessons SELECT and CONFIGURE
widgets rather than hand-authoring simulation code.

**The constraint that governs every lesson**: it must not restate its chapter.
The chapter answers the objection the reader already received; the lesson shows
the mechanism and applies it to a case they did not choose. If a lesson's steps
could be lifted into its chapter without loss, it is not a lesson.

Full plan: `Plans/handbook-lessons-plan.md`.

**Known issue**: `www/lesson-mode.css` has no `html.dark` handling at all, so
the player is always light. The 7 newer widgets adapt via a luminance test;
`multiplicity-sim` hardcodes `#fff`. Latent, not live.

---

## Prose quality, the biggest find of the session

The owner flagged bad openings on live Statistics Handbook tutorials. Two root
causes, both now fixed in the instructions.

### The framing defect

Not a word list. These have identical subjects:

- "This guide covers arrows, shaded highlights, and labels" — fine
- "This guide keeps a promise the title makes" — the defect

**The cargo test**: cross out every phrase naming the article and read what is
left. A fact about the subject survives, or only a claim about the article's
promise survives. Confirm with a topic-swap: the defect pastes into any article
ever written.

A keyword gate was removed, not downgraded, because it fired on 319 of 1,505
posts. Framing lives in the LLM reviewer passes now.

### The flow defect, which is larger

Stacked short declaratives with no subordination. The deeper form: generated
prose is a list of true statements; human prose is an argument where each
sentence needs the one before it. **If a paragraph's sentences can be reordered
without loss, it is a list.**

`Scripts/prose_flow_check.py` measures it: connective density, sentence-length
variance, and the longest run of short subject-opening connective-free
sentences. Run against the flagged page it returned the exact passage the owner
quoted, unprompted.

**Corpus: 75% of posts contain a flat run of 3+. 19 of the worst 20 are PSEO.**

**Root cause** was an instruction nobody would suspect,
`write-post-interactive-v4/SKILL.md:340`:

> **Scan Test.** A reader who only reads the first sentence of each paragraph
> should understand 80% of the article.

A rule about which sentence *leads* a paragraph, read as "every sentence must
stand alone". Alongside it: a 30-word ceiling capping subordination, and a PSEO
rule mandating a bolded opener that sets a shape the paragraph copies.

**Fix**: new SSOT at `_build/prose-voice.md`, referenced (never copy-pasted)
from all 7 writer and reviewer skills. Sentence ceiling raised to 40 and
described as a ceiling, not a target.

### Still outstanding here

- **7 pages still open on injected graduate derivations** from the
  "search-intent upgrade" commit `90cff7e84f`: `UMVUE-in-R-2`,
  `Neyman-Pearson-Lemma-in-R-2`, `Complete-and-Ancillary-Statistics-in-R`,
  `Sufficiency-in-Statistics`, `Exponential-Family-Distributions-in-R`,
  `Likelihood-Ratio-Tests-and-Pivotal-Methods`, `Quadratic-Forms-in-R`.
- The PSEO corpus still reads choppy. Instructions are fixed; pages are not.

---

## Customer fulfilment email

Built, committed, **behind two flags, both OFF**. Owner's instruction: do not
send to real customers until the **2026-09-08** launch.

```bash
wrangler kv key put --binding KV flag:fulfilment-email on
wrangler kv key put --binding KV flag:renewal-reminder on
```

Two separate flags deliberately: turning on the purchase email must not also
start a job that mails existing subscribers.

While off, the fully rendered message goes to `audit_log` under
`fulfilment.email.skipped_flag_off` so it is readable before launch.

**Test send not done.** `ZOHO_ZEPTOMAIL_TOKEN` is a CF Pages secret and
Cloudflare will not return it. Owner has the token; one command sends it, with a
hard allowlist of `selva@r-statistics.co` and `selva86@gmail.com`:

```bash
ZOHO_ZEPTOMAIL_TOKEN="Zoho-enczapikey <key>" \
node Scripts/functions-truth/send-test-fulfilment-email.mjs --send --template lifetime
```

**This code will not reach the two existing customers.** It fires on
`transaction.completed` and their transactions are already processed. When the
flag flips, send those two by hand using `--render`.

**Paddle cannot cover renewal reminders** for this case (they send only where
legally required, terms of 6 months or more). The sweep currently piggybacks on
the admin dashboard, throttled to one run per 6 hours. Fine at 2 subscribers,
needs a companion cron Worker beyond that.

---

## Redirects, and a mechanism you must know about

**`_redirects` does not work on this project.** Legacy `pages_build_output_dir`
model; the middleware rewrites `/X.html` before the asset server sees it. Its
header now says INERT.

**The working mechanism** is `functions/_data/renamed-pages.json`, an old-to-new
map read by `functions/_middleware.ts` before the `.html` rewrite. It covers
both `/Old.html` and the extensionless twin.

It holds the 13 handbook chapter renames plus the two retired tools.

Two tool retirements had silently never taken effect and were serving
`noindex` meta-refresh stubs, which actively discard link equity rather than
passing it. Fixed. Their replacements were also missing from the `/tools/`
landing page entirely.

**48 built root pages still carry old tool slugs in their baked sidebar.** The
source is correct; a full `build.py` heals them. Not run because of the 1,900
uncommitted files.

**`_build/gen_tools_landing.py` is not safe to run standalone** — it drops the
site masthead, because the standalone path skips `patch_tool_pages()`.

---

## Decisions the owner has made

- Handbook is 65 chapters, not 36 or 96
- Chapter titles are `<Topic> in Peer Review`, not `Reviewer Says X`
- Chapter 30 belongs to Part 8
- No word limit on handbook chapters, at all
- Fulfilment email waits for the 2026-09-08 launch
- 30 lessons, one per objection

## Decisions still open

- **The gating model.** Recommended: meter practice volume rather than content
  access, rolling monthly allowance of graded exercises, Lifetime promoted to
  the headline tier. Most of `Plans/growth-playbook-2026.md` assumes an answer.
- **Dichotomising vs dichotomize** for chapter 47. Unpublished, one line.
- **Whether to delete `_redirects`** now that it is provably inert.
- **Going live.** Proposal was chapter 35 alone to master first, page only, no
  navbar change, so the end result can be verified before the rest follows.

---

## The plans

| File | What it holds |
|---|---|
| `Plans/publishing-handbook-plan.md` | The 65-chapter curriculum. The tracker parses this. |
| `Plans/reviewer-2-course-plan.md` | Chapter template, positioning, the Researcher track |
| `Plans/handbook-lessons-plan.md` | The 30 lessons, 8 widgets, the review simulator |
| `Plans/growth-playbook-2026.md` | The funnel. 24 items, sourced research. |
| `Plans/offer-design-2026.md` | Offer construction, from 20+ platforms studied |
| `_build/prose-voice.md` | The writing SSOT all 7 skills reference |

---

## One thing to build

Several bugs this session were the same shape: a status field claiming success
the filesystem did not support.

A `Scripts/verify_state.py` reconciling every tracker (`handbook-status.json`,
`lessons-status.json`, `pseo-status.json`, `curriculum-status.json`) against
disk and git would catch that class before it misleads anyone. Same check
`batch_handbook.verify_published()` now does, applied everywhere.

Worth an hour. The alternative is finding out the way this session did, twice.
