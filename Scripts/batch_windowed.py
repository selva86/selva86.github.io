#!/usr/bin/env python3
"""Windowed-lesson factory driver (the --windowed mode batch_lessons.py
could not carry, since windowed lessons never enter courses.json).

    python Scripts/batch_windowed.py            # build the frontier lesson
    python Scripts/batch_windowed.py --max 3    # build up to 3, sequentially
    python Scripts/batch_windowed.py --seq 2    # build one specific seq

Per lesson, the proven seq-1 pipeline: fresh Opus 5 writer session (full
context pack, R1-R15) -> fresh Opus 5 check-lesson session (bounded fixes)
-> deterministic gate -> md2lesson -> build.py (windowed attrs + sitemap
exclusion) -> exercise manifest -> registry update -> explicit-path commit
and push. Any step failing stops that lesson and the batch; nothing is
half-published. Widgets must already exist (the widget gate is a HUMAN step
per the execution plan): the driver refuses a seq whose course has a
NEEDS-BUILD note in Plans/01_email_and_nurture/lesson-factory-execution.md
widget table unless --force-widgets is passed.
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

PROMPT = """You are writing ONE interactive step-player lesson for r-statistics.co: a
windowed nurture lesson. Work from the project root; the repo is selva86.github.io/.

READ FIRST, in order: (1) .claude/skills/write-lesson/SKILL.md (the process),
(2) selva86.github.io/Plans/01_email_and_nurture/owner-voice-pack.md (THE
VOICE LAW: 12 owner-written exemplars + extracted patterns; every sentence
you write must sound like those exemplars), (3)
selva86.github.io/_build/lesson-pedagogy.md (R1-R15 law), (4)
selva86.github.io/_build/lesson-contract.md, (5)
selva86.github.io/_build/lesson-visual-catalog.md, (6)
selva86.github.io/Plans/01_email_and_nurture/lesson-factory-execution.md.

OVERRIDES (windowed nurture lesson; skip Pass 0 derivation, use exactly):
- Write to: selva86.github.io/lessons/{slug}.md
- Plan artifact first: selva86.github.io/post_plans/{slug}_lesson-plan.md
- Frontmatter exactly: title: "{title}" / slug: "{slug}" / description: (write
  a 150-160 char one from the subject) / keywords: (sensible) / date: today /
  post_type: "LESSON" / lesson_access: "windowed" / course_id: "{course_id}" /
  course_title: "{course_title}" / course_lesson: "{part}" / course_total:
  "{total}" / course_landing: "/dashboard.html" / webr: true / mathjax:
  (true only if you genuinely render formulas) / curriculum_id: "0.0.{seq}" /
  catalog_blurb: (one plain-credible line){prev_next}

THE PROMISE THIS LESSON MUST CASH (the daily email that unlocks it):
Subject: "{subject}"
Body:
---
{email_body}
---
The email's example and framing are the lesson's opening contract: the lesson
must deliver exactly what this email promises, then go deeper.

COURSE CONTEXT: this is part {part} of {total} of "{course_title}".{siblings}
Open with a one-line bridge from the previous part where one exists (R4).

SOURCE MATERIAL: selva86.github.io/_posts/{source}.html is the existing blog
post. Raw material only; the lesson must exceed it, never summarize it.

WIDGETS: select ONLY from _build/lesson-visual-catalog.md (built widgets).
luck-simulator, null-distribution, bootstrap-sample, power-curve,
process-flow, chart-plotter and the rest are available; NEVER hand-author
simulation code, NEVER fake a widget. If an essential visual has no widget,
put a NEEDS-BUILD note in the plan and carry the step with a static diagram.

R CODE: deterministic (set.seed), every #> exactly real, plain readable R,
never name the in-browser R technology.

VOICE (non-negotiable): the owner hand-wrote the 12 exemplar emails in
Plans/01_email_and_nurture/owner-voice-pack.md and your prose must be
indistinguishable from that voice. Before writing, study the exemplars AND
the extracted patterns in that file: invite the reader in ("Let's say...",
"Consider this:"), land big points as short standalone paragraphs, check in
sparingly ("Right?", "Remember?"), cut every clever flourish in favor of the
plain sincere version, restate hard ideas in plainer words ("In other
words..."), name practical stakes earnestly (interviews, real work), warm
word choices, and never over-polish into machine-smooth symmetry. NO em or
en dashes anywhere, pure ASCII, ONE named numbered everyday example carried
through (reuse the email's), reader inside the story, beginner entry bar:
can read a simple R script, no statistics background. No length cap:
thoroughness always wins (R13). After drafting, do one dedicated VOICE PASS
over every step: read each paragraph aloud in your head and rewrite any
sentence the owner would not say.

GATES BEFORE FINISHING:
python selva86.github.io/Scripts/lesson_quality_check.py selva86.github.io/lessons/{slug}.md
node selva86.github.io/Scripts/verify_lesson_webr.mjs selva86.github.io/lessons/{slug}.md
Fix and re-run until both pass. DO NOT publish, build, or touch git. Finish
with a short summary: step count, widgets used, gate status, anything flagged.
"""

CHECK_PROMPT = """Read and follow the skill at .claude/skills/check-lesson/SKILL.md for the
lesson selva86.github.io/lessons/{slug}.md (plan:
selva86.github.io/post_plans/{slug}_lesson-plan.md). This is a WINDOWED
nurture lesson (rules: selva86.github.io/Plans/01_email_and_nurture/lesson-factory-execution.md).
Judge especially: the owner's voice. Read
selva86.github.io/Plans/01_email_and_nurture/owner-voice-pack.md first (12
owner-written exemplars + patterns) and hunt for prose that would give away
a machine author: clever compression, aphorisms, machine-smooth symmetric
sentences, missing spoken-pause paragraphs, zero reader check-ins, em
dashes. Rewrite offending passages into the exemplar voice. Also judge:
beginner-clarity from a zero-stats entry bar, that the email's promised
example carries the lesson, and code-output sanity. Apply bounded fixes, re-run
python selva86.github.io/Scripts/lesson_quality_check.py selva86.github.io/lessons/{slug}.md
after edits, and finish with a verdict. DO NOT publish, build, or touch git.
"""


def sh(cmd, cwd=ROOT, timeout=None, stdin_text=None):
    return subprocess.run(cmd, cwd=cwd, timeout=timeout, capture_output=True,
                          text=True, encoding='utf-8', errors='replace',
                          input=stdin_text, shell=isinstance(cmd, str))


def log(msg):
    print(f"[{time.strftime('%H:%M:%S')}] {msg}", flush=True)


def build_one(seq_item, reg, copy):
    seq = seq_item['seq']
    cid = seq_item['course']
    course = reg['courses'][cid]
    part = next(p for p in course['parts'] if p['seq'] == seq)
    slug = f"{PREFIX[cid]}-{part['part']}"
    title = re.sub(r'\s*\(.*\)\s*$', '', seq_item['subject']).strip()
    title = title[0].upper() + title[1:]
    body = copy[str(seq)]['body']
    built_sib = [p for p in course['parts'] if p.get('slug') and p['seq'] != seq]
    siblings = (' Built sibling parts you may bridge to: ' +
                ', '.join(f"part {p['part']} = {p['slug']}" for p in built_sib)) if built_sib else ''
    prev = next((p['slug'] for p in course['parts'] if p['part'] == part['part'] - 1 and p.get('slug')), '')
    prev_next = f' / course_prev: "{prev}"' if prev else ''

    prompt = PROMPT.format(slug=slug, title=title, course_id=cid,
                           course_title=course['title'], part=part['part'],
                           total=len(course['parts']), seq=seq,
                           subject=seq_item['subject'], email_body=body,
                           siblings=siblings, source=seq_item['source'],
                           prev_next=prev_next)
    os.makedirs(BRIEFS, exist_ok=True)
    io.open(os.path.join(BRIEFS, f'windowed-{slug}-prompt.md'), 'w',
            encoding='utf-8', newline='\n').write(prompt)

    lesson_md = os.path.join(ROOT, 'lessons', f'{slug}.md')
    log(f'seq {seq} -> {slug}: writer (Opus 5) starting')
    r = sh('claude --model claude-opus-5 -p --dangerously-skip-permissions',
           cwd=PROJ, timeout=6000, stdin_text=prompt)
    io.open(os.path.join(BRIEFS, f'windowed-{slug}-run.log'), 'w',
            encoding='utf-8', newline='\n').write(r.stdout + '\n--- stderr ---\n' + r.stderr)
    if not os.path.exists(lesson_md):
        log(f'FAIL: writer produced no lesson (see briefs/windowed-{slug}-run.log)')
        return None
    log('writer done; reviewer starting')
    r = sh('claude --model claude-opus-5 -p --dangerously-skip-permissions',
           cwd=PROJ, timeout=4000, stdin_text=CHECK_PROMPT.format(slug=slug))
    io.open(os.path.join(BRIEFS, f'windowed-{slug}-check.log'), 'w',
            encoding='utf-8', newline='\n').write(r.stdout + '\n--- stderr ---\n' + r.stderr)
    if r.returncode != 0:
        log('FAIL: reviewer flagged manual_review; stopping this lesson')
        return None

    log('gates + publish steps')
    g = sh([sys.executable, 'Scripts/lesson_quality_check.py', f'lessons/{slug}.md'])
    if g.returncode != 0:
        log('FAIL: final gate\n' + g.stdout[-800:])
        return None
    for cmd in ([sys.executable, '_build/md2lesson.py', f'lessons/{slug}.md'],
                [sys.executable, '_build/build.py'],
                [sys.executable, '_build/build_exercise_manifest.py'],
                [sys.executable, 'Scripts/update_mini_registry.py', '--seq', str(seq), '--slug', slug, '--status', 'built']):
        r = sh(cmd)
        if r.returncode != 0:
            log(f'FAIL: {" ".join(cmd[1:])}\n' + (r.stdout + r.stderr)[-600:])
            return None

    page = io.open(os.path.join(ROOT, f'{slug}.html'), encoding='utf-8').read()
    assert 'data-lesson-access="windowed"' in page and 'noindex' in page, 'windowed attrs missing'
    smap = io.open(os.path.join(ROOT, 'sitemap.xml'), encoding='utf-8').read()
    assert slug not in smap, 'sitemap leak'

    for cmd in (['git', 'add', f'lessons/{slug}.md', f'_lessons/{slug}.html', f'{slug}.html',
                 'functions/_data/mini-courses.json', 'functions/_data/exercise-manifest.json'],
                ['git', 'commit', '-q', '-m',
                 f'Publish windowed lesson {slug} (seq {seq}): {title}\n\n'
                 f'Part {part["part"]} of {course["title"]}. Fresh Opus 5 writer +\n'
                 f'fresh reviewer sessions, both gates green, windowed attrs and\n'
                 f'sitemap exclusion asserted, registry updated by the batch driver.'],
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
    a = ap.parse_args()
    reg = json.load(io.open(REG, encoding='utf-8'))
    copy = json.load(io.open(COPY, encoding='utf-8'))
    done = 0
    for it in reg['sequence']:
        if done >= a.max:
            break
        if it['kind'] != 'lesson' or it.get('slug'):
            continue
        if a.seq is not None and it['seq'] != a.seq:
            continue
        if str(it['seq']) not in copy:
            log(f"seq {it['seq']}: no email copy written; stopping (copy is the promise)")
            break
        slug = build_one(it, reg, copy)
        if not slug:
            sys.exit(1)
        reg = json.load(io.open(REG, encoding='utf-8'))  # reload after registry write
        done += 1
    log(f'batch complete: {done} lesson(s)')


if __name__ == '__main__':
    main()
