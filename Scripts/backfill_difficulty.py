"""One-off script: add difficulty: field to all posts/*.md that lack it.

Infers difficulty from sidebar_section / post_type. Skips posts that already
have the field. Run from selva86.github.io/:

    python Scripts/backfill_difficulty.py
    python Scripts/backfill_difficulty.py --dry-run   # preview only
"""
import os, re, sys

POSTS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)),
                         'selva86.github.io', 'posts')
# If running from selva86.github.io/ directly:
if not os.path.isdir(POSTS_DIR):
    POSTS_DIR = os.path.join(os.path.dirname(__file__), '..', 'posts')
if not os.path.isdir(POSTS_DIR):
    POSTS_DIR = 'posts'

DIFFICULTY_MAP = {
    'Learn R': 'Beginner',
    'R Fundamentals': 'Beginner',
    'Practice Exercises': 'Intermediate',
    'Functional Programming': 'Advanced',
    'Data Wrangling': 'Intermediate',
    'Visualization': 'Intermediate',
    'Statistics': 'Intermediate',
    'Time Series': 'Intermediate',
    'Machine Learning': 'Advanced',
    'Advanced R': 'Advanced',
    'Reporting': 'Intermediate',
    'Specializations': 'Advanced',
}

dry_run = '--dry-run' in sys.argv

updated = 0
skipped = 0

for fname in sorted(os.listdir(POSTS_DIR)):
    if not fname.endswith('.md'):
        continue
    fpath = os.path.join(POSTS_DIR, fname)
    text = open(fpath, encoding='utf-8').read()

    if not text.startswith('---'):
        continue

    # Check if difficulty already set
    end = text.index('---', 3)
    fm_block = text[3:end]
    if re.search(r'^difficulty:', fm_block, re.MULTILINE):
        skipped += 1
        continue

    # Extract sidebar_section and post_type
    section_m = re.search(r'^sidebar_section:\s*"?([^"\n]+)"?', fm_block, re.MULTILINE)
    section = section_m.group(1).strip() if section_m else ''

    type_m = re.search(r'^post_type:\s*"?([^"\n]+)"?', fm_block, re.MULTILINE)
    post_type = type_m.group(1).strip() if type_m else 'C'

    # Determine difficulty
    difficulty = DIFFICULTY_MAP.get(section, 'Intermediate')

    # FR/EX posts without sidebar_section: try to infer from fr_parent or default
    if not section and post_type in ('FR', 'EX', 'PSEO'):
        difficulty = 'Intermediate'  # safe default

    # Insert difficulty before closing ---
    new_fm = fm_block.rstrip() + f'\ndifficulty: "{difficulty}"\n'
    new_text = '---' + new_fm + '---' + text[end + 3:]

    if dry_run:
        print(f'  [DRY] {fname:<55} -> {difficulty}')
    else:
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(new_text)
        print(f'  [SET] {fname:<55} -> {difficulty}')

    updated += 1

print(f'\nDone. Updated: {updated}, Skipped (already had difficulty): {skipped}')
if dry_run:
    print('(Dry run — no files were modified)')
