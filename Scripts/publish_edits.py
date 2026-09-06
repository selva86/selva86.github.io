"""Publish hand edits to lesson markdown files, safely.

Owner workflow: edit lessons/<slug>.md (prose only), then run

    python Scripts/publish_edits.py            # detect, build, commit, push
    python Scripts/publish_edits.py --dry-run  # show what would happen
    python Scripts/publish_edits.py --no-learn # publish without harvesting pairs

Safety rails:
  1. Refuses to run while batch_windowed.py is running.
  2. Refuses edits that touch code blocks, #> output, ::check/::quiz/::widget
     directives, or fenced regions (those need re-verification: hand to Claude).
  3. Refuses edits that introduce em/en dashes (site law).
  4. Warns about stray hand edits to _lessons/*.html or root HTML (they would
     be overwritten by the build; markdown is the only source of truth).
  5. Stages explicit paths only, never -A.
  6. Appends published slugs to Scripts/hand-edited-lessons.txt (the
     no-rebuild ledger).

Learning loop: each published edit is harvested as a BEFORE/AFTER pair into
.claude/skills/write-lesson/owner-edits.md (capped at the 50 most recent),
which the lesson builder rereads just before writing prose.
"""
import io, os, re, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
DRY = '--dry-run' in sys.argv
FORCE = '--force' in sys.argv  # bypass the batch-detection failure only
NO_LEARN = '--no-learn' in sys.argv
SKILLS_REPO = os.path.join(os.path.dirname(ROOT), '.claude')
PAIRS_FILE = os.path.join(SKILLS_REPO, 'skills', 'write-lesson', 'owner-edits.md')
MAX_PAIRS = 50

def run(cmd, **kw):
    return subprocess.run(cmd, capture_output=True, text=True, **kw)

def die(msg):
    print('REFUSED: ' + msg)
    sys.exit(1)

# ---- 1. batch guard -------------------------------------------------------
ps = run(['powershell', '-NoProfile', '-Command',
          "Get-CimInstance Win32_Process -Filter \"Name='python.exe'\" | "
          "Select-Object -ExpandProperty CommandLine"])
if ps.returncode != 0:
    if not FORCE:
        die('could not check for a running batch (PowerShell query failed). '
            'Re-run with --force only if you are sure no batch is running.')
    print('WARN: batch check failed, continuing under --force')
elif 'batch_windowed.py' in (ps.stdout or ''):
    die('batch_windowed.py is running. Edit and save your markdown freely, '
        'but publish only after the batch finishes.')

# ---- 2. find modified lesson markdown -------------------------------------
st = run(['git', 'status', '--porcelain']).stdout.splitlines()
md = [l[3:].strip() for l in st if l[:2].strip() in ('M', 'MM') and l[3:].startswith('lessons/') and l.endswith('.md')]
stray = [l[3:].strip() for l in st if l[:2].strip() in ('M', 'MM') and
         (l[3:].startswith('_lessons/') or re.match(r'...[A-Za-z0-9-]+\.html$', l))]
if stray:
    print('WARN: hand edits found in generated HTML (these will be overwritten '
          'by the build; put edits in lessons/*.md instead):')
    for f in stray:
        print('   ' + f)
if not md:
    die('no modified files under lessons/. Edit lessons/<slug>.md first.')

# ---- 3. inspect each diff: prose only, no dashes --------------------------
def fence_lines(path):
    """Line numbers (1-based) inside ``` fences in the current file."""
    inside, out = False, set()
    for i, line in enumerate(io.open(path, encoding='utf-8'), 1):
        if line.startswith('```'):
            inside = not inside
            out.add(i)
        elif inside:
            out.add(i)
    return out

blocked = []
for f in md:
    fences = fence_lines(f)
    diff = run(['git', 'diff', '-U0', '--', f]).stdout
    new_ln = 0
    for line in diff.splitlines():
        m = re.match(r'@@ -\d+(?:,\d+)? \+(\d+)', line)
        if m:
            new_ln = int(m.group(1)) - 1
            continue
        if line.startswith('+') and not line.startswith('+++'):
            new_ln += 1
            body = line[1:]
            if '—' in body or '–' in body:
                blocked.append((f, new_ln, 'introduces an em/en dash'))
            if (body.startswith('```') or body.startswith('#>') or
                    body.startswith('::') or new_ln in fences):
                blocked.append((f, new_ln, 'touches code/output/directives'))
        elif line.startswith('-') and not line.startswith('---'):
            body = line[1:]
            if body.startswith('```') or body.startswith('#>') or body.startswith('::'):
                blocked.append((f, new_ln, 'removes code/output/directive lines'))
if blocked:
    print('These edits are beyond prose and need verification before shipping:')
    for f, ln, why in blocked[:12]:
        print(f'   {f}:{ln}  {why}')
    die('hand these edits to Claude to re-verify outputs and the exercise '
        'manifest, or revert them and re-run.')

slugs = [os.path.splitext(os.path.basename(f))[0] for f in md]

# ---- 3b. harvest BEFORE/AFTER pairs into the writer's corpus --------------
def harvest(files):
    import datetime
    entries = []
    for f in files:
        slug = os.path.splitext(os.path.basename(f))[0]
        diff = run(['git', 'diff', '-U0', '--', f]).stdout
        before, after = [], []
        def flush():
            b = ' '.join(before).strip()
            a = ' '.join(after).strip()
            if b and a and b != a:
                entries.append((slug, b, a))
            before.clear()
            after.clear()
        for line in diff.splitlines():
            if line.startswith('@@'):
                flush()
            elif line.startswith('-') and not line.startswith('---'):
                before.append(line[1:])
            elif line.startswith('+') and not line.startswith('+++'):
                after.append(line[1:])
        flush()
    if not entries:
        return
    old = ''
    if os.path.exists(PAIRS_FILE):
        old = io.open(PAIRS_FILE, encoding='utf-8').read()
    blocks = [b for b in old.split('\n## ') if b.strip() and not b.startswith('#')]
    today = datetime.date.today().isoformat()
    for slug, b, a in entries:
        blocks.append(slug + ' (' + today + ')\nBEFORE:\n' + b + '\nAFTER:\n' + a + '\n')
    blocks = blocks[-MAX_PAIRS:]
    head = ('# How Selva edits machine-written lessons\n\n'
            'Real corrections he made to published lessons: the machine passage,\n'
            'then his rewrite. Newest last.\n')
    io.open(PAIRS_FILE, 'w', encoding='utf-8', newline='\n').write(
        head + '\n## ' + '\n## '.join(blocks))
    run(['git', '-C', SKILLS_REPO, 'add', 'skills/write-lesson/owner-edits.md'])
    run(['git', '-C', SKILLS_REPO, 'commit', '-q', '-m',
         'owner-edits: +' + str(len(entries)) + ' pair(s) from published-lesson edits'])
    print(f'Learned {len(entries)} edit pair(s) -> {PAIRS_FILE}')

if not NO_LEARN and not DRY:
    harvest(md)

print('Publishing prose edits for: ' + ', '.join(slugs))
if DRY:
    print('Dry run complete. Nothing built, committed, pushed, or learned.')
    sys.exit(0)

# ---- 4. build -------------------------------------------------------------
for f in md:
    r = run([sys.executable, '_build/md2lesson.py', f])
    if r.returncode != 0:
        print(r.stdout[-1500:]); print(r.stderr[-1500:])
        die(f'md2lesson failed on {f}; nothing was committed')
r = run([sys.executable, '_build/build.py'])
if r.returncode != 0:
    print(r.stdout[-1500:]); print(r.stderr[-1500:])
    die('build.py failed; nothing was committed')

# ---- 5. commit explicit paths, push ---------------------------------------
paths = []
for s in slugs:
    paths += [f'lessons/{s}.md', f'_lessons/{s}.html', f'{s}.html']
paths += ['sitemap.xml', 'feed.xml']
run(['git', 'add'] + paths)
msg = 'Hand edits to ' + ', '.join(slugs)
c = run(['git', 'commit', '-m', msg])
if c.returncode != 0:
    print(c.stdout[-800:]); die('git commit failed')
p = run(['git', 'push', 'origin', 'master'])
if p.returncode != 0:
    print(p.stderr[-800:]); die('git push failed; the commit exists locally')

# ---- 6. ledger + report ---------------------------------------------------
ledger = os.path.join('Scripts', 'hand-edited-lessons.txt')
seen = set()
if os.path.exists(ledger):
    seen = set(io.open(ledger, encoding='utf-8').read().split())
with io.open(ledger, 'a', encoding='utf-8') as fh:
    for s in slugs:
        if s not in seen:
            fh.write(s + '\n')

print('Pushed. Live in ~15-25 minutes once Cloudflare deploys:')
for s in slugs:
    print(f'   https://r-statistics.co/{s}.html')
print(f'Recorded in {ledger} (the no-rebuild list).')
