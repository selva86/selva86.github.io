#!/usr/bin/env python3
"""Generate the public /courses.json from the built lesson fragments.

courses.json is the single source the player rail + catalog read. Rather than
parse the client-side roadmap JS (RM2), we derive it from the ground truth of
what is actually built: the frontmatter in _lessons/*.html (course_id,
course_title, course_lesson, course_total, course_landing, lesson_access, title,
curriculum_id). Group by course_id, order by course_lesson, emit.

This REPLACES the hand-seeded courses.json once real lessons exist; for one
course it reproduces the same shape. Track / roadmap-node mapping (for the
catalog) is an optional overlay added later; absent here it is "".

Usage:
  python Scripts/build_lessons_tracker.py            # write courses.json
  python Scripts/build_lessons_tracker.py --json     # print, do not write
"""
import sys, os, re, json, glob

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
sys.path.insert(0, os.path.join(ROOT, '_build'))
from md2html import parse_frontmatter

LESSONS_DIR = os.path.join(ROOT, '_lessons')
OUT = os.path.join(ROOT, 'courses.json')

# Where each course sits in the roadmap (for the player breadcrumb + exit target).
# track = RM2 key; the breadcrumb is Roadmap > trackLabel > sectionLabel > lesson,
# and exit goes to /roadmap/#rm-<track>. Hand-maintained (small); courses absent
# here simply get no breadcrumb (graceful).
COURSE_ROADMAP = {
    'random-forest': {'track': 'ds', 'trackLabel': 'Data Scientist', 'section': 4,
                      'sectionLabel': 'Tree-based models and gradient boosting'},
    't-test': {'track': 'researcher', 'trackLabel': 'Researcher', 'section': 4,
               'sectionLabel': 'Hypothesis testing and test selection'},
    'llm-agents': {'track': 'ds', 'trackLabel': 'Data Scientist', 'section': 16,
                   'sectionLabel': 'The frontier (2026): LLMs and modern ML'},
    # Data Analyst track (level 2, all free) - one course per roadmap section.
    'da-dplyr': {'track': 'analyst', 'trackLabel': 'Data Analyst', 'section': 1, 'sectionLabel': 'Wrangle and tidy with dplyr'},
    'da-joins': {'track': 'analyst', 'trackLabel': 'Data Analyst', 'section': 2, 'sectionLabel': 'Join and reshape any dataset'},
    'da-eda': {'track': 'analyst', 'trackLabel': 'Data Analyst', 'section': 3, 'sectionLabel': 'Exploratory data analysis'},
    'da-ggplot': {'track': 'analyst', 'trackLabel': 'Data Analyst', 'section': 4, 'sectionLabel': 'Visualization with ggplot2'},
    'da-ggplot2-adv': {'track': 'analyst', 'trackLabel': 'Data Analyst', 'section': 5, 'sectionLabel': 'Advanced ggplot2 and composition'},
    'da-datatable': {'track': 'analyst', 'trackLabel': 'Data Analyst', 'section': 6, 'sectionLabel': 'data.table and bigger-than-memory'},
    'da-tables': {'track': 'analyst', 'trackLabel': 'Data Analyst', 'section': 7, 'sectionLabel': 'Report-ready tables'},
    'da-dashboards': {'track': 'analyst', 'trackLabel': 'Data Analyst', 'section': 8, 'sectionLabel': 'Interactive output and dashboards'},
    'da-communicate': {'track': 'analyst', 'trackLabel': 'Data Analyst', 'section': 9, 'sectionLabel': 'Communicate, automate and AI-assist (2026)'},
}


# Explicit catalog-name overrides (the roadmap-visible lesson label).
# short_title() derives the label from the frontmatter title by taking the text
# after the first colon, which assumes a "Course Prefix: Real Name" format. That
# holds for the da-* lessons but NOT for titles shaped "Real Name: hook" (the
# t-test / llm-agents lessons), where the colon-tail is a stray fragment. List
# those here, keyed by slug; absent slugs fall back to short_title().
LESSON_CATALOG_TITLE = {
    'Missing-Value-Treatment': 'Missing Value Treatment',
    'LLM-Agents-in-R': 'Build an LLM agent from scratch',
    'The-t-test-from-scratch': 'The t-test from scratch',
    'Comparing-Groups-with-t-tests': 'Comparing groups with t-tests',
}


def access_from_curriculum(cid):
    """Positional gate (the canonical rule): free if level==1 or section==1, else pro."""
    m = re.match(r'\s*(\d+)\.(\d+)', str(cid or ''))
    if not m:
        return 'free'   # fail open
    level, section = int(m.group(1)), int(m.group(2))
    return 'free' if (level == 1 or section == 1) else 'pro'


def short_title(full, course_title):
    """'Random Forests Lesson 1: Decision Trees from scratch' -> 'Decision Trees from scratch'."""
    full = (full or '').strip()
    if ':' in full:
        tail = full.split(':', 1)[1].strip()
        if tail:
            return tail
    return full


def build():
    courses = {}
    for path in sorted(glob.glob(os.path.join(LESSONS_DIR, '*.html'))):
        with open(path, encoding='utf-8') as f:
            fm, _ = parse_frontmatter(f.read())
        if str(fm.get('post_type', '')).strip().upper() != 'LESSON':
            continue
        cid = str(fm.get('course_id', '')).strip()
        if not cid:
            continue
        slug = os.path.splitext(os.path.basename(path))[0]
        try:
            order = int(str(fm.get('course_lesson', '0')).strip() or 0)
        except ValueError:
            order = 0
        access = str(fm.get('lesson_access', '')).strip().lower() or access_from_curriculum(fm.get('curriculum_id'))
        c = courses.setdefault(cid, {
            'course_id': cid,
            'title': str(fm.get('course_title', '') or cid).strip(),
            'landing': str(fm.get('course_landing', '') or '').strip(),
            'track': str(fm.get('track', '') or '').strip(),
            'curriculum_id': re.match(r'\s*(\d+\.\d+)', str(fm.get('curriculum_id', ''))).group(1)
                              if re.match(r'\s*(\d+\.\d+)', str(fm.get('curriculum_id', ''))) else '',
            'lessons': [],
        })
        c['lessons'].append({
            'slug': slug,
            'title': LESSON_CATALOG_TITLE.get(slug) or short_title(fm.get('title'), c['title']),
            'order': order,
            'access': access,
            'built': True,
        })

    out = {'version': 1,
           'note': 'Auto-generated by Scripts/build_lessons_tracker.py from _lessons/ frontmatter. Public; served at /courses.json.',
           'courses': []}
    for cid in sorted(courses):
        c = courses[cid]
        c['lessons'].sort(key=lambda l: l['order'])
        c['access_default'] = 'free' if all(l['access'] == 'free' for l in c['lessons']) else 'pro'
        if cid in COURSE_ROADMAP:
            c['roadmap'] = COURSE_ROADMAP[cid]
        out['courses'].append(c)
    return out


def main():
    data = build()
    if '--json' in sys.argv[1:]:
        print(json.dumps(data, indent=2))
        return 0
    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)
        f.write('\n')
    n_courses = len(data['courses'])
    n_lessons = sum(len(c['lessons']) for c in data['courses'])
    print('Wrote %s: %d course(s), %d lesson(s).' % (os.path.relpath(OUT, ROOT), n_courses, n_lessons))
    return 0


if __name__ == '__main__':
    sys.exit(main())
