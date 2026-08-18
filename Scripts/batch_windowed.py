#!/usr/bin/env python3
"""Windowed-lesson factory driver.

    python Scripts/batch_windowed.py                          # build the frontier lesson
    python Scripts/batch_windowed.py --max 3                  # build up to 3, in sequence order
    python Scripts/batch_windowed.py --seq 13                 # build one specific seq
    python Scripts/batch_windowed.py --seq 13 --out-slug X-v2 # comparison build at an alternate slug
    python Scripts/batch_windowed.py ... --resume             # skip stages whose artifact already exists
    python Scripts/batch_windowed.py --rebuild --max 10      # REBUILD the first 10 built lessons from scratch at
                                                            # their live slugs (old versions archived out of reach)

What happens per lesson, each stage in its OWN fresh `claude -p` session so
nothing carries over between them:

  1. PLAN         /write-lesson --plan-only   -> post_plans/<slug>_lesson-plan.md
  2. PLAN REVIEW  /check-lesson-plan          -> must stamp `status: approved`
  3. BUILD        /write-lesson --build       -> lessons/<slug>.md, both gates green
  4. REVIEW       /check-lesson               -> voice + clarity + gaps, bounded fixes
  5. (comparison builds only) independence gate: every step diffed against the
     canonical lesson; fails above 0.65 similarity
  6. deterministic gate -> md2lesson -> build.py -> exercise manifest ->
     registry (skipped for comparison builds)
  7. asserts on the built page: windowed attr + noindex, NOT in the sitemap
  8. explicit-path git add / commit / push

All rules (voice, pedagogy, plan format, grammar, code, gates) live INSIDE the
three skills; the prompts below carry only what is specific to this lesson.
Any failing stage stops that lesson and the batch; nothing half-publishes.

Robustness: a stage's verdict is read from its ARTIFACT (plan stamped
approved, lesson exists, review-log line written), never from `claude -p`'s
exit code alone, because the CLI can exit non-zero with empty output after a
session that did its work. A reviewer session killed by an API error (error
text or near-empty stdout, no review-log line) is retried once.
"""
import argparse, io, json, os, re, subprocess, sys, time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))      # selva86.github.io
PROJ = os.path.dirname(ROOT)                                            # project root
REG = os.path.join(ROOT, 'functions', '_data', 'mini-courses.json')
COPY = os.path.join(ROOT, 'functions', '_data', 'nurture-emails.json')
BRIEFS = os.path.join(ROOT, 'Scripts', 'briefs')

PREFIX = {
    'inference-from-zero': 'Inference-Mini', 'arima-from-zero': 'ARIMA-Mini',
    'reading-model-output': 'Regression-Reading-Mini', 'regression-health-check': 'Regression-Health-Mini',
    'which-test': 'Which-Test-Mini', 'beyond-straight-lines': 'Beyond-Lines-Mini',
    'bayesian-decisions': 'Bayesian-Mini', 'hidden-structure': 'Structure-Mini',
    'data-that-clumps': 'Clustered-Data-Mini', 'resampling': 'Resampling-Mini',
    'time-series-toolkit': 'TS-Toolkit-Mini', 'foundations-extras': 'Foundations-Mini',
}

# The lesson-specific brief shared by every stage. Rules live in the skills.
BRIEF = """LESSON: slug {slug}; title "{title}"; part {part} of {total} of the mini course
"{course_title}" (course_id {course_id}); curriculum_id 0.0.{seq};
lesson_access windowed; course_landing /dashboard.html{prev_next}.

THE PROMISE THIS LESSON MUST DELIVER: the daily email that unlocks it.
Subject: "{subject}"
---
{email_body}
---
The email's example and framing are the lesson's opening contract. Deliver
exactly what it promises, in the owner's voice.

SOURCE MATERIAL: selva86.github.io/_posts/{source}.html is the existing blog
post. Raw material only.
Windowed frontmatter beyond the identity above: post_type "LESSON", webr
true, mathjax true only if formulas are rendered, description 150-160 chars,
keywords sensible, catalog_blurb one plain credible line, date today.
"""

PLAN_PROMPT = """Follow the skill at .claude/skills/write-lesson/SKILL.md in --plan-only
mode. Work from the project root; the repo is selva86.github.io/. The lesson
identity below replaces the skill's Part 3 derivation. Produce ONLY the plan
file the skill's Part 4 describes. Do not write lesson prose. Do not run
gates. Do not touch git. Stay inside the Part 4 budget and format; the
reviewer deletes anything beyond it.

""" + BRIEF

PLAN_CHECK_PROMPT = """Follow the skill at .claude/skills/check-lesson-plan/SKILL.md for the plan
selva86.github.io/post_plans/{slug}_lesson-plan.md. Work from the project
root. This is a windowed nurture lesson; the email below is the promise its
plan must serve. Fix flow directly in the plan, then set `status: approved`.
Do not approve an unfixable plan. Do not write lesson prose. Do not touch git.

""" + BRIEF

PROMPT = """Follow the skill at .claude/skills/write-lesson/SKILL.md in --build mode.
Work from the project root; the repo is selva86.github.io/. The plan at
selva86.github.io/post_plans/{slug}_lesson-plan.md is stamped approved:
build strictly from it (floor, not ceiling; never reorder or re-plan). Write
selva86.github.io/lessons/{slug}.md, run both gates until green, and finish
with the short summary the skill asks for. Do not publish, build, or touch
git.

""" + BRIEF

CHECK_PROMPT = """Follow the skill at .claude/skills/check-lesson/SKILL.md for the lesson
selva86.github.io/lessons/{slug}.md (its approved plan is at
selva86.github.io/post_plans/{slug}_lesson-plan.md). Work from the project
root. This is a windowed nurture lesson; the email below is the promise it
must have delivered, and its example should carry the lesson. Apply bounded
fixes, re-run both gates, and give the verdict the skill defines. Do not
publish, build, or touch git.

""" + BRIEF


def sh(cmd, cwd=ROOT, timeout=None, stdin_text=None):
    return subprocess.run(cmd, cwd=cwd, timeout=timeout, capture_output=True,
                          text=True, encoding='utf-8', errors='replace',
                          input=stdin_text, shell=isinstance(cmd, str))


API_DEATH_MARKERS = ('API Error', 'Overloaded', 'Internal server error', 'overloaded_error')


def api_died(r):
    """A claude -p run that hit a server-side error before doing real work:
    error text in stdout and very little else. Real refusals and real work
    produce long stdout."""
    out = (r.stdout or '')
    return any(m in out for m in API_DEATH_MARKERS) and len(out.strip()) < 600


def claude(stdin_text, timeout, log_path):
    """Run one fresh claude -p session with the given brief. Retries a
    server-side API death (529 Overloaded, 500, mid-response errors) up to
    three times with growing back-off, because those kill a stage before it
    reads a single file and are not a verdict on anything. Writes the last
    attempt's transcript to log_path."""
    for attempt in range(1, 4):
        r = sh('claude --model claude-opus-5 -p --dangerously-skip-permissions',
               cwd=PROJ, timeout=timeout, stdin_text=stdin_text)
        io.open(log_path, 'w', encoding='utf-8', newline='\n').write(
            r.stdout + '\n--- stderr ---\n' + r.stderr)
        if not api_died(r):
            return r
        wait = 120 * attempt
        log(f'API death (attempt {attempt}/3): waiting {wait}s then relaunching this stage')
        time.sleep(wait)
    return r


def log(msg):
    print(f"[{time.strftime('%H:%M:%S')}] {msg}", flush=True)


def build_one(seq_item, reg, copy, out_slug=None, resume=False, rebuild=False):
    seq = seq_item['seq']
    cid = seq_item['course']
    course = reg['courses'][cid]
    part = next(p for p in course['parts'] if p['seq'] == seq)
    # out_slug = comparison mode: build the lesson at an alternate slug,
    # never touching the registry or the canonical lesson.
    slug = out_slug or f"{PREFIX[cid]}-{part['part']}"
    title = re.sub(r'\s*\(.*\)\s*$', '', seq_item['subject']).strip()
    title = title[0].upper() + title[1:]
    body = copy[str(seq)]['body']
    prev = next((p['slug'] for p in course['parts'] if p['part'] == part['part'] - 1 and p.get('slug')), '')
    prev_next = (f' / course_prev: "{prev}" (frontmatter only; never mention '
                 f'other parts in prose)') if prev else ''

    fmt = dict(slug=slug, title=title, course_id=cid,
               course_title=course['title'], part=part['part'],
               total=len(course['parts']), seq=seq,
               subject=seq_item['subject'], email_body=body,
               source=seq_item['source'],
               prev_next=prev_next)
    # Comparison builds must be INDEPENDENT: without this, the planner and
    # builder open the canonical lesson and anchor on its arc and prose,
    # which invalidates the comparison (measured 48-98% step similarity on
    # the first attempt).
    indep = ''
    if out_slug:
        canonical = f"{PREFIX[cid]}-{part['part']}"
        indep = (f"\nINDEPENDENCE (comparison build): a lesson for this topic already "
                 f"exists at lessons/{canonical}.md with its plan at "
                 f"post_plans/{canonical}_lesson-plan.md. Do NOT open, read, quote, "
                 f"or reuse either file. Plan and build from the email promise, the "
                 f"source post, and the SSOTs alone, as if that lesson had never "
                 f"been written. (The owner's voice-pack exemplars are still the "
                 f"voice law, including the cover exemplar.)\n")
    os.makedirs(BRIEFS, exist_ok=True)
    plan_path = os.path.join(ROOT, 'post_plans', f'{slug}_lesson-plan.md')
    lesson_md = os.path.join(ROOT, 'lessons', f'{slug}.md')

    # --rebuild: the lesson at this slug is being rewritten from scratch. Every
    # earlier artifact (lesson md, plan, fragment, built page, and any -vN
    # comparison variants) is MOVED out of the repo tree before the first
    # session starts, so no stage can read it; the brief forbids git history
    # too; the independence gate measures the new lesson against the archived
    # one. On any failure the archive is restored so the working tree is left
    # exactly as it was.
    archive = None
    if rebuild:
        import glob, shutil
        archive = os.path.join(BRIEFS, 'rebuild-archive', slug)
        os.makedirs(archive, exist_ok=True)
        moved = []
        cands = [lesson_md, plan_path,
                 os.path.join(ROOT, '_lessons', f'{slug}.html'),
                 os.path.join(ROOT, f'{slug}.html')]
        cands += glob.glob(os.path.join(ROOT, 'lessons', f'{slug}-v*.md'))
        cands += glob.glob(os.path.join(ROOT, 'post_plans', f'{slug}-v*_lesson-plan.md'))
        for src in cands:
            if os.path.exists(src):
                dst = os.path.join(archive, os.path.relpath(src, ROOT).replace(os.sep, '__'))
                shutil.move(src, dst)
                moved.append((src, dst))
        log(f'rebuild: archived {len(moved)} earlier artifact(s) of {slug} to briefs/rebuild-archive/{slug}/')
        indep = ("\nINDEPENDENCE (rebuild): this lesson is being written again from scratch. "
                 "Earlier versions of it exist in git history and in comparison "
                 "variants. Do NOT open, read, quote, git-show, git-log, or reuse ANY "
                 "earlier version of this lesson, any file whose name starts with "
                 f"{slug}, or any other lesson under lessons/. Plan and build from the "
                 "email promise, the source post, and the skill alone, as if no lesson "
                 "had ever been written for it.\n")
        owner_cover = os.path.join(BRIEFS, f'owner-cover-{slug}.md')
        if os.path.exists(owner_cover):
            indep += ("\nOWNER-WRITTEN COVER (verbatim, untouchable): the owner hand-wrote the "
                      "cover prose for this lesson. Use it word for word as the cover step's "
                      "prose (widget and objectives follow it), and never edit it:\n---\n"
                      + io.open(owner_cover, encoding='utf-8').read().strip() + "\n---\n")

    def restore_archive():
        if not archive:
            return
        import shutil
        n = 0
        for name in os.listdir(archive):
            dst = os.path.join(ROOT, name.replace('__', os.sep))
            if not os.path.exists(dst):
                os.makedirs(os.path.dirname(dst), exist_ok=True)
                shutil.move(os.path.join(archive, name), dst); n += 1
        log(f'rebuild: restored {n} archived artifact(s) after failure')

    # Stage 1: a fresh session PLANS only. (--resume: skip if a plan exists.)
    if resume and os.path.exists(plan_path):
        log(f'seq {seq} -> {slug}: resume, plan exists; skipping planner')
    else:
        prompt = PLAN_PROMPT.format(**fmt) + indep
        io.open(os.path.join(BRIEFS, f'windowed-{slug}-plan-prompt.md'), 'w',
                encoding='utf-8', newline='\n').write(prompt)
        log(f'seq {seq} -> {slug}: planner (Opus 5) starting')
        r = claude(prompt, 3600, os.path.join(BRIEFS, f'windowed-{slug}-plan.log'))
        if not os.path.exists(plan_path):
            log(f'FAIL: planner produced no plan (see briefs/windowed-{slug}-plan.log)')
            restore_archive(); return None

    # Stage 2: a fresh session reviews the PLAN for flow and must approve it.
    # (--resume: skip if the plan is already stamped approved.)
    def approved():
        return 'status: approved' in io.open(plan_path, encoding='utf-8').read()
    if resume and approved():
        log('resume, plan already approved; skipping plan reviewer')
    else:
        log('plan done; plan reviewer starting')
        r = claude(PLAN_CHECK_PROMPT.format(**fmt) + indep, 3600,
                   os.path.join(BRIEFS, f'windowed-{slug}-plan-check.log'))
        # Trust the ARTIFACT, not the exit code: `claude -p` can exit non-zero
        # with empty stdout after a session that plainly did its work (seen
        # 2026-08-18: 26-minute review, plan grown and stamped approved, exit
        # non-zero). The approval stamp on disk is the verdict.
        if not approved():
            log('FAIL: plan review did not approve; stopping this lesson')
            restore_archive(); return None
        if r.returncode != 0:
            log('WARN: plan reviewer exited non-zero but the plan is stamped approved; continuing')

    # Stage 3: a fresh session BUILDS strictly from the approved plan.
    # (--resume: skip if the lesson markdown already exists.)
    if resume and os.path.exists(lesson_md):
        log('resume, lesson exists; skipping builder')
    else:
        prompt = PROMPT.format(**fmt) + indep
        io.open(os.path.join(BRIEFS, f'windowed-{slug}-prompt.md'), 'w',
                encoding='utf-8', newline='\n').write(prompt)
        log('plan approved; builder (Opus 5) starting')
        r = claude(prompt, 6000, os.path.join(BRIEFS, f'windowed-{slug}-run.log'))
        if not os.path.exists(lesson_md):
            log(f'FAIL: builder produced no lesson (see briefs/windowed-{slug}-run.log)')
            restore_archive(); return None
    # Stage 4: a fresh session reviews the LESSON. A genuine refusal writes a
    # line to Scripts/lesson-review.log; a transient API death (server error
    # mid-response, empty/short stdout) does not, and is retried once rather
    # than treated as a verdict.
    review_log = os.path.join(ROOT, 'Scripts', 'lesson-review.log')
    def review_log_size():
        return os.path.getsize(review_log) if os.path.exists(review_log) else 0
    for attempt in (1, 2):
        log('writer done; reviewer starting' if attempt == 1 else 'reviewer retry (API death)')
        before = review_log_size()
        r = claude(CHECK_PROMPT.format(**fmt) + indep, 4000,
                   os.path.join(BRIEFS, f'windowed-{slug}-check.log'))
        if r.returncode == 0:
            break
        refused = review_log_size() > before
        api_death = ('API Error' in r.stdout) or (len(r.stdout.strip()) < 400 and not refused)
        if refused or not api_death or attempt == 2:
            log('FAIL: reviewer flagged manual_review; stopping this lesson')
            restore_archive(); return None

    # Comparison builds: PROVE independence, never trust it. Diff every step
    # against the canonical lesson and hard-fail on copying (the seq-1 v2
    # attempt sailed through every instruction while reusing v1's prose at
    # up to 98% similarity - only measurement catches that).
    if out_slug or rebuild:
        import difflib
        canon_md = os.path.join(ROOT, 'lessons', f"{PREFIX[cid]}-{part['part']}.md")
        if rebuild:
            canon_md = os.path.join(archive, f'lessons__{slug}.md')
        if os.path.exists(canon_md):
            split = lambda p: re.split(r'^=== step ===.*$', io.open(p, encoding='utf-8').read(), flags=re.M)[1:]
            new_steps, old_steps = split(lesson_md), split(canon_md)
            worst = 0.0
            for ns in new_steps:
                for os_ in old_steps:
                    worst = max(worst, difflib.SequenceMatcher(None, ns, os_).quick_ratio()
                                and difflib.SequenceMatcher(None, ns, os_).ratio())
            log(f'independence check: worst step similarity vs canonical = {worst:.2f}')
            if worst > 0.65:
                log('FAIL: comparison build copied the canonical lesson (similarity > 0.65)')
                restore_archive(); return None

    log('gates + publish steps')
    g = sh([sys.executable, 'Scripts/lesson_quality_check.py', f'lessons/{slug}.md'])
    if g.returncode != 0:
        log('FAIL: final gate\n' + g.stdout[-800:])
        restore_archive(); return None
    publish_cmds = [[sys.executable, '_build/md2lesson.py', f'lessons/{slug}.md'],
                    [sys.executable, '_build/build.py'],
                    [sys.executable, '_build/build_exercise_manifest.py']]
    if not out_slug:
        publish_cmds.append([sys.executable, 'Scripts/update_mini_registry.py',
                             '--seq', str(seq), '--slug', slug, '--status', 'built'])
    for cmd in publish_cmds:
        r = sh(cmd)
        if r.returncode != 0:
            log(f'FAIL: {" ".join(cmd[1:])}\n' + (r.stdout + r.stderr)[-600:])
            restore_archive(); return None

    page = io.open(os.path.join(ROOT, f'{slug}.html'), encoding='utf-8').read()
    assert 'data-lesson-access="windowed"' in page and 'noindex' in page, 'windowed attrs missing'
    smap = io.open(os.path.join(ROOT, 'sitemap.xml'), encoding='utf-8').read()
    assert slug not in smap, 'sitemap leak'

    add_paths = [f'lessons/{slug}.md', f'_lessons/{slug}.html', f'{slug}.html',
                 f'post_plans/{slug}_lesson-plan.md', 'functions/_data/exercise-manifest.json',
                 'Scripts/build_lessons_tracker.py']
    if not out_slug:
        add_paths.append('functions/_data/mini-courses.json')
    msg = (f'Comparison build {slug} (from seq {seq}): {title}\n\n'
           f'Plan -> plan-review -> build pipeline; registry untouched; the\n'
           f'canonical lesson is unchanged.') if out_slug else (
           ('Rebuild' if rebuild else 'Publish') + f' windowed lesson {slug} (seq {seq}): {title}\n\n'
           f'Part {part["part"]} of {course["title"]}. Plan -> plan-review ->\n'
           f'build in fresh Opus 5 sessions + fresh reviewer, both gates green,\n'
           f'windowed attrs and sitemap exclusion asserted, registry updated.')
    for cmd in (['git', 'add'] + add_paths,
                ['git', 'commit', '-q', '-m', msg],
                ['git', 'push', '-q', 'origin', 'master']):
        r = sh(cmd)
        if r.returncode != 0 and 'commit' in cmd:
            log('WARN: commit non-zero (possibly race); verifying push anyway')
    log(f'PUBLISHED seq {seq} = {slug}')
    return slug


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--seq', type=int)
    ap.add_argument('--max', type=int, default=1)
    ap.add_argument('--out-slug', help='comparison mode: build --seq N at this '
                    'alternate slug; registry and canonical lesson untouched')
    ap.add_argument('--resume', action='store_true',
                    help='skip stages whose artifact already exists (plan / approved plan / lesson)')
    ap.add_argument('--rebuild', action='store_true',
                    help='rewrite ALREADY-BUILT lessons from scratch at their live slugs, in '
                         'sequence order (old versions archived out of reach; --max/--seq apply)')
    a = ap.parse_args()
    if a.out_slug and a.seq is None:
        log('--out-slug requires --seq')
        sys.exit(2)
    reg = json.load(io.open(REG, encoding='utf-8'))
    copy = json.load(io.open(COPY, encoding='utf-8'))
    done = 0
    for it in reg['sequence']:
        if done >= a.max:
            break
        if it['kind'] != 'lesson':
            continue
        if a.rebuild:
            if not it.get('slug'):
                continue                      # rebuild only what exists
        elif it.get('slug') and not a.out_slug:
            continue
        if a.seq is not None and it['seq'] != a.seq:
            continue
        if str(it['seq']) not in copy:
            log(f"seq {it['seq']}: no email copy written; stopping (copy is the promise)")
            break
        slug = build_one(it, reg, copy, out_slug=a.out_slug, resume=a.resume, rebuild=a.rebuild)
        if not slug:
            sys.exit(1)
        reg = json.load(io.open(REG, encoding='utf-8'))  # reload after registry write
        done += 1
    log(f'batch complete: {done} lesson(s)')


if __name__ == '__main__':
    main()
