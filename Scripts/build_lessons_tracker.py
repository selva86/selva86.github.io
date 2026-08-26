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
                      'sectionLabel': 'Trees and gradient boosting'},
    't-test': {'track': 'researcher', 'trackLabel': 'Researcher', 'section': 4,
               'sectionLabel': 'Hypothesis testing and test selection'},
    'llm-agents': {'track': 'ds', 'trackLabel': 'Data Scientist', 'section': 16,
                   'sectionLabel': 'The frontier (2026): LLMs and modern ML'},
    # Data Scientist track sections 1-5 (the "core" tier; section 4 sits alongside random-forest).
    'ds-ml-workflow': {'track': 'ds', 'trackLabel': 'Data Scientist', 'section': 1, 'sectionLabel': 'The ML workflow and first models'},
    'ds-regression': {'track': 'ds', 'trackLabel': 'Data Scientist', 'section': 2, 'sectionLabel': 'Regression, done properly'},
    'ds-classification': {'track': 'ds', 'trackLabel': 'Data Scientist', 'section': 3, 'sectionLabel': 'Classification fundamentals'},
    'ds-boosting': {'track': 'ds', 'trackLabel': 'Data Scientist', 'section': 4, 'sectionLabel': 'Trees and gradient boosting'},
    'ds-tidymodels': {'track': 'ds', 'trackLabel': 'Data Scientist', 'section': 5, 'sectionLabel': 'The tidymodels workflow'},
    'ds-feature-engineering': {'track': 'ds', 'trackLabel': 'Data Scientist', 'section': 6, 'sectionLabel': 'Feature engineering and selection'},
    'ds-evaluation-tuning': {'track': 'ds', 'trackLabel': 'Data Scientist', 'section': 7, 'sectionLabel': 'Model evaluation, resampling and tuning'},
    'ds-imbalanced-classification': {'track': 'ds', 'trackLabel': 'Data Scientist', 'section': 8, 'sectionLabel': 'Imbalanced, cost-sensitive and calibrated classification'},
    'ds-unsupervised': {'track': 'ds', 'trackLabel': 'Data Scientist', 'section': 9, 'sectionLabel': 'Unsupervised - clustering and dimensionality reduction'},
    'ds-causal': {'track': 'ds', 'trackLabel': 'Data Scientist', 'section': 10, 'sectionLabel': 'Experiment and causal basics'},
    'ds-interpretability': {'track': 'ds', 'trackLabel': 'Data Scientist', 'section': 11, 'sectionLabel': 'Interpretability and responsible AI (essentials)'},
    'ds-production': {'track': 'ds', 'trackLabel': 'Data Scientist', 'section': 12, 'sectionLabel': 'Shipping your first model (production essentials)'},
    'ds-reg-glm-expert': {'track': 'ds', 'trackLabel': 'Data Scientist', 'section': 13, 'sectionLabel': 'Regression and GLMs - the expert cut'},
    'ds-advanced-supervised': {'track': 'ds', 'trackLabel': 'Data Scientist', 'section': 14, 'sectionLabel': 'Advanced supervised learning'},
    'ds-survival': {'track': 'ds', 'trackLabel': 'Data Scientist', 'section': 15, 'sectionLabel': 'Survival and time-to-event'},
    'ds-bayesian': {'track': 'ds', 'trackLabel': 'Data Scientist', 'section': 16, 'sectionLabel': 'Bayesian and hierarchical modeling'},
    'ds-experimentation': {'track': 'ds', 'trackLabel': 'Data Scientist', 'section': 17, 'sectionLabel': 'Experimentation and online learning'},
    'ds-causal-decisions': {'track': 'ds', 'trackLabel': 'Data Scientist', 'section': 18, 'sectionLabel': 'Causal inference for decisions'},
    'ds-robustness-drift': {'track': 'ds', 'trackLabel': 'Data Scientist', 'section': 19, 'sectionLabel': 'Robustness, drift and distribution shift'},
    'ds-anomaly': {'track': 'ds', 'trackLabel': 'Data Scientist', 'section': 20, 'sectionLabel': 'Anomaly detection and advanced unsupervised'},
    'ds-uncertainty': {'track': 'ds', 'trackLabel': 'Data Scientist', 'section': 21, 'sectionLabel': 'Uncertainty: conformal, calibration, probabilistic'},
    # Data Analyst track (level 2, all free) - one course per roadmap section.
    'nr-basics': {'track': 'foundations', 'trackLabel': 'New to R', 'section': 1, 'sectionLabel': 'Syntax, types and vectors'},
    'nr-structures': {'track': 'foundations', 'trackLabel': 'New to R', 'section': 2, 'sectionLabel': 'Lists, data frames and tibbles'},
    'nr-programming': {'track': 'foundations', 'trackLabel': 'New to R', 'section': 3, 'sectionLabel': 'Subsetting, control flow and functions'},
    'nr-import': {'track': 'foundations', 'trackLabel': 'New to R', 'section': 4, 'sectionLabel': 'Importing and exporting real data'},
    'nr-strings': {'track': 'foundations', 'trackLabel': 'New to R', 'section': 5, 'sectionLabel': 'Strings, dates and regular expressions'},
    'nr-iteration': {'track': 'foundations', 'trackLabel': 'New to R', 'section': 6, 'sectionLabel': 'Iteration: the apply family and purrr'},
    'nr-debugging': {'track': 'foundations', 'trackLabel': 'New to R', 'section': 7, 'sectionLabel': 'Defensive code and debugging'},
    'nr-workflow': {'track': 'foundations', 'trackLabel': 'New to R', 'section': 8, 'sectionLabel': 'Reproducible workflow and the 2026 toolchain'},
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
    # Windowed nurture lessons: build() skips them, but lesson_quality_check.py
    # reads this map for its cover-H2 check, and their titles carry a colon.
    'Inference-Mini-3': 'Confidence intervals: what they really mean',
    'Inference-Mini-4': 'Power analysis: find the sample size you need',
    'Inference-Mini-5': 'Hypothesis testing: the framework, explained',
    'Inference-Mini-6': "Effect size: Cohen's d and friends, explained",
    'Inference-Mini-6-v2': "Effect size: Cohen's d and friends, explained",
    'Inference-Mini-6-v3': "Effect size: Cohen's d and friends, explained",
    'Inference-Mini-1': 'How statistical inference works, no formulas yet',
    'ARIMA-Mini-1': 'ARIMA: what AR, I, and MA actually mean',
    'ARIMA-Mini-2': 'ACF and PACF: how to read the plots for ARIMA orders',
    'ARIMA-Mini-3': 'How to choose ARIMA order (p, d, q): a practical guide',
    'ARIMA-Mini-4': 'ARIMA diagnostics: the two checks before you trust a forecast',
    'ARIMA-Mini-5': 'Test stationarity: ADF, KPSS, and when to difference',
    'Regression-Reading-Mini-1': 'Interaction effects: test and interpret them',
    'Regression-Reading-Mini-2': 'Linear regression assumptions: the 5 checks',
    'Regression-Health-Mini-1': 'Multicollinearity: why your coefficients look wrong, and the fix',
    'Regression-Health-Mini-2': 'Autocorrelation in residuals: how to test and fix it',
    'Regression-Health-Mini-3': 'Robust regression: when outliers bite',
    'Regression-Health-Mini-4': "Cook's distance: find the points that change your model",
    'Bayesian-Mini-1': "Bayes' theorem: the simulation that makes it click",
    'Bayesian-Mini-2': 'Choosing priors: the decision that matters',
    'Bayesian-Mini-3': 'The Bayesian t-test: measure evidence, not just significance',
    'Foundations-Mini-1': 'Conditional probability: P(A given B), made concrete',
    'Foundations-Mini-3': 'Law of Large Numbers vs CLT: the real difference',
    'Which-Test-Mini-2': "Welch's ANOVA: the test for unequal group variances",
    'Which-Test-Mini-2-v2': "Welch's ANOVA: the test for unequal group variances",
    'Which-Test-Mini-2-v3': "Welch's ANOVA: the test for unequal group variances",
    'Which-Test-Mini-3': 'Mann-Whitney U test: when and how to run it',
    'Which-Test-Mini-4': "Fisher's exact test: when and how, with a worked example",
    'Resampling-Mini-1': 'Permutation tests: exact p-values without formulas',
    'Resampling-Mini-2': 'Bootstrap confidence intervals: for any statistic',
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
        # Windowed nurture lessons are non-public: never in courses.json or
        # pro-lessons.json (the mini-courses registry + middleware own them).
        if str(fm.get('lesson_access', '')).strip().lower() == 'windowed':
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
            'subtitle': str(fm.get('catalog_blurb', '') or '').strip(),
            'kind': str(fm.get('lesson_kind', '') or 'lesson').strip().lower(),
            'order': order,
            'access': access,
            'built': True,
        })

    out = {'version': 1,
           'note': 'Auto-generated by Scripts/build_lessons_tracker.py from _lessons/ frontmatter. Public; served at /courses.json.',
           'courses': []}
    for cid in sorted(courses):
        c = courses[cid]
        c['lessons'].sort(key=lambda l: (1 if l.get('kind') == 'quiz' else 0, l['order']))
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

    # Pro-lesson slug map for the edge middleware (server-side content strip)
    # and the exercise-attempt Pro guard. Value = the course's roadmap track
    # key so Single Track entitlements can be scoped; 'any' = any Pro plan.
    # Shipped inside the Worker bundle via functions/_data/.
    pro = {l['slug']: (c.get('roadmap') or {}).get('track') or 'any'
           for c in data['courses'] for l in c['lessons']
           if l.get('access') == 'pro'}
    pro_out = os.path.join(ROOT, 'functions', '_data', 'pro-lessons.json')
    with open(pro_out, 'w', encoding='utf-8') as f:
        json.dump(pro, f, indent=2, sort_keys=True)
        f.write('\n')
    print('Wrote %s: %d pro lesson page(s).' % (os.path.relpath(pro_out, ROOT), len(pro)))
    return 0


if __name__ == '__main__':
    sys.exit(main())
