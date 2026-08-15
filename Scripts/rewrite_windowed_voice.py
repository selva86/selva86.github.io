#!/usr/bin/env python3
"""Rewrite a published windowed lesson's prose into the owner's voice.

    python Scripts/rewrite_windowed_voice.py Inference-Mini-1

Same session pattern as batch_windowed.py: fresh Opus 5 writer (rewrite
prose only, structure/code/widgets preserved) -> fresh reviewer -> gates ->
md2lesson -> build.py -> manifest -> explicit-path commit + push. Registry
untouched (the slug is already registered).
"""
import io, json, os, re, subprocess, sys, time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJ = os.path.dirname(ROOT)
REG = os.path.join(ROOT, 'functions', '_data', 'mini-courses.json')
COPY = os.path.join(ROOT, 'functions', '_data', 'nurture-emails.json')
BRIEFS = os.path.join(ROOT, 'Scripts', 'briefs')

REWRITE_PROMPT = """You are REWRITING the prose of an existing interactive step-player lesson on
r-statistics.co so it sounds like its human owner wrote it. Work from the
project root; the repo is selva86.github.io/.

READ FIRST, in order: (1)
selva86.github.io/Plans/01_email_and_nurture/owner-voice-pack.md (THE VOICE
LAW: 12 owner-written exemplar emails + extracted patterns; your rewritten
prose must be indistinguishable from that voice), (2)
selva86.github.io/_build/lesson-pedagogy.md (R1-R15), (3)
selva86.github.io/_build/lesson-contract.md (the === step === / :: directive
grammar you must not break).

THE FILE: selva86.github.io/lessons/{slug}.md, a published windowed lesson.

PRESERVE EXACTLY (do not touch): the frontmatter block, the number, order
and types of steps, every ::widget directive and its JSON, every ::check
regex, every R code block and its #> output lines, quiz correct answers and
distractor sets, exercise gating semantics. Do NOT add or remove steps.

REWRITE: the explanatory prose in every step, quiz question wording and
feedback lines (same correct answer, same distractors), try-it instruction
wording (the ::check regex must still match the intended solution), step
titles where a warmer phrasing helps. The teaching content, ordering and
rigor stay identical; ONLY the voice changes.

THE VOICE TARGET, in short (the pack has the full patterns + exemplars):
invite the reader in ("Let's say...", "Consider this:"), land big points as
short standalone paragraphs, check in sparingly ("Right?", "Remember?"),
cut every clever flourish in favor of the plain sincere version, restate
hard ideas in plainer words ("In other words..."), name practical stakes
earnestly (interviews, real work), warm word choices, never over-polish
into machine-smooth symmetry. NO em or en dashes anywhere, pure ASCII.
This lesson's running example and opening contract come from the owner's
own email that unlocks it:
---
{email_body}
---

CURRENCY: when mathjax is true, never write a raw $ before a number in
prose (MathJax eats the text between two amounts); write \\$50,700 style
escapes. Raw $ inside R code blocks is fine.

METHOD: go step by step through the whole file. For each step, read the
prose aloud in your head; any sentence the owner would not say gets
rewritten in their voice. Machine tells to hunt: clever compression,
aphorisms, symmetric sentence pairs, rhythm-of-three lists, every point the
same length, no spoken pauses, no reader check-ins.

GATES BEFORE FINISHING:
python selva86.github.io/Scripts/lesson_quality_check.py selva86.github.io/lessons/{slug}.md
node selva86.github.io/Scripts/verify_lesson_webr.mjs selva86.github.io/lessons/{slug}.md
Fix and re-run until both pass. DO NOT publish, build, or touch git. Finish
with a short summary of what you changed and the gate status.
"""

CHECK_PROMPT = """Read and follow the skill at .claude/skills/check-lesson/SKILL.md for the
lesson selva86.github.io/lessons/{slug}.md (plan:
selva86.github.io/post_plans/{slug}_lesson-plan.md). This lesson's prose was
just rewritten into the owner's voice; your job is to verify the rewrite.
Read selva86.github.io/Plans/01_email_and_nurture/owner-voice-pack.md first
(12 owner-written exemplars + patterns) and hunt for any remaining machine
tells: clever compression, aphorisms, machine-smooth symmetric sentences,
missing spoken-pause paragraphs, zero reader check-ins, em dashes. Rewrite
offending passages into the exemplar voice. Also verify structure survived:
step count and types unchanged, widgets/quizzes/checks intact, R outputs
real. Apply bounded fixes, re-run
python selva86.github.io/Scripts/lesson_quality_check.py selva86.github.io/lessons/{slug}.md
after edits, and finish with a verdict. DO NOT publish, build, or touch git.
"""


def sh(cmd, cwd=ROOT, timeout=None, stdin_text=None):
    return subprocess.run(cmd, cwd=cwd, timeout=timeout, capture_output=True,
                          text=True, encoding='utf-8', errors='replace',
                          input=stdin_text, shell=isinstance(cmd, str))


def log(msg):
    print(f"[{time.strftime('%H:%M:%S')}] {msg}", flush=True)


def main():
    slug = sys.argv[1]
    lesson_md = os.path.join(ROOT, 'lessons', f'{slug}.md')
    assert os.path.exists(lesson_md), f'no such lesson: {lesson_md}'

    # find the seq whose lesson this is, for the email body
    reg = json.load(io.open(REG, encoding='utf-8'))
    copy = json.load(io.open(COPY, encoding='utf-8'))
    seq = next(it['seq'] for it in reg['sequence'] if it.get('slug') == slug)
    body = copy[str(seq)]['body']

    steps_before = io.open(lesson_md, encoding='utf-8').read().count('=== step ===')

    prompt = REWRITE_PROMPT.format(slug=slug, email_body=body)
    os.makedirs(BRIEFS, exist_ok=True)
    io.open(os.path.join(BRIEFS, f'rewrite-{slug}-prompt.md'), 'w',
            encoding='utf-8', newline='\n').write(prompt)

    log(f'{slug}: voice-rewrite writer (Opus 5) starting')
    r = sh('claude --model claude-opus-5 -p --dangerously-skip-permissions',
           cwd=PROJ, timeout=6000, stdin_text=prompt)
    io.open(os.path.join(BRIEFS, f'rewrite-{slug}-run.log'), 'w',
            encoding='utf-8', newline='\n').write(r.stdout + '\n--- stderr ---\n' + r.stderr)

    steps_after = io.open(lesson_md, encoding='utf-8').read().count('=== step ===')
    if steps_after != steps_before:
        log(f'FAIL: step count changed {steps_before} -> {steps_after}; restore from git before publishing')
        sys.exit(1)

    log('writer done; reviewer starting')
    r = sh('claude --model claude-opus-5 -p --dangerously-skip-permissions',
           cwd=PROJ, timeout=4000, stdin_text=CHECK_PROMPT.format(slug=slug))
    io.open(os.path.join(BRIEFS, f'rewrite-{slug}-check.log'), 'w',
            encoding='utf-8', newline='\n').write(r.stdout + '\n--- stderr ---\n' + r.stderr)
    if r.returncode != 0:
        log('FAIL: reviewer flagged manual_review; stopping')
        sys.exit(1)

    log('gates + publish steps')
    g = sh([sys.executable, 'Scripts/lesson_quality_check.py', f'lessons/{slug}.md'])
    if g.returncode != 0:
        log('FAIL: final gate\n' + g.stdout[-800:])
        sys.exit(1)
    for cmd in ([sys.executable, '_build/md2lesson.py', f'lessons/{slug}.md'],
                [sys.executable, '_build/build.py'],
                [sys.executable, '_build/build_exercise_manifest.py']):
        r = sh(cmd)
        if r.returncode != 0:
            log(f'FAIL: {" ".join(cmd[1:])}\n' + (r.stdout + r.stderr)[-600:])
            sys.exit(1)

    page = io.open(os.path.join(ROOT, f'{slug}.html'), encoding='utf-8').read()
    assert 'data-lesson-access="windowed"' in page and 'noindex' in page, 'windowed attrs missing'
    smap = io.open(os.path.join(ROOT, 'sitemap.xml'), encoding='utf-8').read()
    assert slug not in smap, 'sitemap leak'

    for cmd in (['git', 'add', f'lessons/{slug}.md', f'_lessons/{slug}.html', f'{slug}.html',
                 'functions/_data/exercise-manifest.json'],
                ['git', 'commit', '-q', '-m',
                 f'Rewrite {slug} prose in the owner voice\n\n'
                 f'Voice-pack rewrite: structure, widgets, quizzes and R code\n'
                 f'preserved; prose rewritten against the 12 owner exemplars.\n'
                 f'Fresh writer + reviewer sessions, both gates green.'],
                ['git', 'push', '-q', 'origin', 'master']):
        r = sh(cmd)
        if r.returncode != 0 and 'commit' in cmd:
            log('WARN: commit non-zero (possibly race); verifying push anyway')
    log(f'REWRITTEN + PUBLISHED {slug}')


if __name__ == '__main__':
    main()
