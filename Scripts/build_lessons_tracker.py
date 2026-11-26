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
    'ts-foundations': {'track': 'ts', 'trackLabel': 'Forecaster', 'section': 1,
                       'sectionLabel': 'Time series foundations'},
    'ts-decomposition': {'track': 'ts', 'trackLabel': 'Forecaster', 'section': 2,
                         'sectionLabel': 'Decomposition and features'},
    'ts-toolbox': {'track': 'ts', 'trackLabel': 'Forecaster', 'section': 3,
                   'sectionLabel': 'The forecasting toolbox'},
    'ts-regression': {'track': 'ts', 'trackLabel': 'Forecaster', 'section': 4,
                      'sectionLabel': 'Time series regression'},
    'ts-ets': {'track': 'ts', 'trackLabel': 'Forecaster', 'section': 5,
               'sectionLabel': 'Exponential smoothing (ETS)'},
    'ts-arima': {'track': 'ts', 'trackLabel': 'Forecaster', 'section': 6,
                 'sectionLabel': 'ARIMA and seasonal ARIMA'},
    'ts-dynamic': {'track': 'ts', 'trackLabel': 'Forecaster', 'section': 7,
                   'sectionLabel': 'Dynamic regression and complex seasonality'},
    'ts-statespace': {'track': 'ts', 'trackLabel': 'Forecaster', 'section': 8,
                      'sectionLabel': 'State space models and the Kalman filter'},
    'ts-spectral': {'track': 'ts', 'trackLabel': 'Forecaster', 'section': 9,
                    'sectionLabel': 'Spectral and frequency-domain analysis'},
    'ts-volatility': {'track': 'ts', 'trackLabel': 'Forecaster', 'section': 10,
                      'sectionLabel': 'Volatility modeling: ARCH and GARCH'},
    'ts-multivariate': {'track': 'ts', 'trackLabel': 'Forecaster', 'section': 11,
                        'sectionLabel': 'Multivariate time series'},
    'ts-hierarchical': {'track': 'ts', 'trackLabel': 'Forecaster', 'section': 12,
                        'sectionLabel': 'Hierarchical and grouped forecasting'},
    'ts-ml': {'track': 'ts', 'trackLabel': 'Forecaster', 'section': 13,
              'sectionLabel': 'Machine learning and deep forecasting'},
    'ts-intervention': {'track': 'ts', 'trackLabel': 'Forecaster', 'section': 14,
                        'sectionLabel': 'Intervention, causal impact and anomaly detection'},
    'ts-expert': {'track': 'ts', 'trackLabel': 'Forecaster', 'section': 15,
                  'sectionLabel': 'The expert edge: forecasting like a pro'},
    'ts-production': {'track': 'ts', 'trackLabel': 'Forecaster', 'section': 16,
                      'sectionLabel': 'Production forecasting'},
    'random-forest': {'track': 'ds', 'trackLabel': 'Data Scientist', 'section': 4,
                      'sectionLabel': 'Trees and gradient boosting'},
    # Researcher sections 2 and 3. `section` must equal the S(n, ...) number in
    # www/roadmap-curriculum.js and `sectionLabel` is copied from it verbatim,
    # or the player's breadcrumb and Back button point at the wrong section.
    'res-estimation': {'track': 'researcher', 'trackLabel': 'Applied Statistician', 'section': 2,
                       'sectionLabel': 'Estimation and the bootstrap'},
    'res-inference': {'track': 'researcher', 'trackLabel': 'Applied Statistician', 'section': 3,
                      'sectionLabel': 'Confidence intervals and p-values'},
    # Researcher section 1. `section` must equal the S(n, ...) number in
    # www/roadmap-curriculum.js or the player's Back button deep-links to the
    # wrong section, and sectionLabel is what the breadcrumb shows, so it is
    # copied from the roadmap verbatim.
    'res-probability': {'track': 'researcher', 'trackLabel': 'Applied Statistician', 'section': 1,
                        'sectionLabel': 'Probability, distributions and estimation'},
    't-test': {'track': 'researcher', 'trackLabel': 'Applied Statistician', 'section': 4,
               'sectionLabel': 'Hypothesis testing and test selection'},
    # Researcher section 4 holds eight roadmap items. `t-test` above covers three
    # of them and stays as it is; this course covers the other five, so both rows
    # carry the same section number and the same label.
    'res-test-selection': {'track': 'researcher', 'trackLabel': 'Applied Statistician', 'section': 4,
                           'sectionLabel': 'Hypothesis testing and test selection'},
    # Researcher sections 5 and 6. Absence from this dict is NOT harmless: a
    # course with no row gets `roadmap: {}`, and that has two consequences, one
    # cosmetic and one that costs money.
    #   1. www/dashboard.js reads c.roadmap.track, so the course and every
    #      lesson in it is invisible on the track page and the roadmap.
    #   2. line ~288 computes pro-lessons.json as
    #      `(c.get('roadmap') or {}).get('track') or 'any'`, so every Pro lesson
    #      in the course is published with track 'any'. In
    #      functions/_lib/entitlement.ts, scopeCovers() returns TRUE for
    #      track === 'any' on any scope other than "0", so the paid body is
    #      served in full to every Single Track buyer of any other track AND to
    #      any holder of the free Data Analyst pass.
    # Found on 2026-11-19 with five res-anova lessons already built and tagged
    # 'any' on the branch. The branch workflow is what caught it before merge.
    # `sectionLabel` is copied VERBATIM from the S(n, ...) row in
    # www/roadmap-curriculum.js, which is NOT the course title: section 5 reads
    # 'ANOVA, contrasts and multiple comparisons', not 'ANOVA and Multiple
    # Comparisons'. Add the row BEFORE the course's first lesson publishes.
    'res-anova': {'track': 'researcher', 'trackLabel': 'Applied Statistician', 'section': 5,
                  'sectionLabel': 'ANOVA, contrasts and multiple comparisons'},
    'res-linear-models': {'track': 'researcher', 'trackLabel': 'Applied Statistician', 'section': 6,
                          'sectionLabel': 'Linear regression, properly'},
    # Researcher sections 7-16, added 2026-11-19 BEFORE any of their lessons
    # exist, so the 'any' leak described above cannot happen again on this
    # track. An unused row costs nothing: this dict is only ever read as
    # COURSE_ROADMAP[cid] for a course that already has built lessons, so a row
    # for a course with no lessons is never looked up. Every sectionLabel below
    # is copied verbatim from the researcher S(n, ...) rows in
    # www/roadmap-curriculum.js. Take them from the RESEARCHER array only: other
    # tracks have their own S(7) and S(8) with different labels.
    'res-model-strategy': {'track': 'researcher', 'trackLabel': 'Applied Statistician', 'section': 7,
                           'sectionLabel': 'Regression modeling strategies'},
    'res-glm': {'track': 'researcher', 'trackLabel': 'Applied Statistician', 'section': 8,
                'sectionLabel': 'Generalized linear models'},
    'res-mixed': {'track': 'researcher', 'trackLabel': 'Applied Statistician', 'section': 9,
                  'sectionLabel': 'Mixed-effects and longitudinal models'},
    'res-additive': {'track': 'researcher', 'trackLabel': 'Applied Statistician', 'section': 10,
                     'sectionLabel': 'Additive and nonparametric models'},
    'res-bayes': {'track': 'researcher', 'trackLabel': 'Applied Statistician', 'section': 11,
                  'sectionLabel': 'Bayesian data analysis'},
    'res-design': {'track': 'researcher', 'trackLabel': 'Applied Statistician', 'section': 12,
                   'sectionLabel': 'Experimental design and A/B testing'},
    'res-causal': {'track': 'researcher', 'trackLabel': 'Applied Statistician', 'section': 13,
                   'sectionLabel': 'Causal inference from data'},
    'res-survival': {'track': 'researcher', 'trackLabel': 'Applied Statistician', 'section': 14,
                     'sectionLabel': 'Survival and event-history analysis'},
    'res-multivariate': {'track': 'researcher', 'trackLabel': 'Applied Statistician', 'section': 15,
                         'sectionLabel': 'Multivariate, measurement and missing data'},
    'res-reporting': {'track': 'researcher', 'trackLabel': 'Applied Statistician', 'section': 16,
                      'sectionLabel': 'Meta-analysis, reproducibility and defensible reporting'},

    # ---- Product Data Scientist (split out of Researcher 2026-11-26) ----
    # `section` MUST equal the S(n, ...) number in www/roadmap-curriculum.js
    # and sectionLabel is copied from it VERBATIM, or the lesson player's
    # breadcrumb and Back button point at the wrong section.
    'pds-metrics': {'track': 'product-ds', 'trackLabel': 'Product Data Scientist', 'section': 1,
                    'sectionLabel': 'Metrics that can carry a decision'},
    'pds-design': {'track': 'product-ds', 'trackLabel': 'Product Data Scientist', 'section': 2,
                   'sectionLabel': 'Designing an experiment you can defend'},
    'pds-pitfalls': {'track': 'product-ds', 'trackLabel': 'Product Data Scientist', 'section': 3,
                     'sectionLabel': 'When the experiment misbehaves'},
    'pds-targeting': {'track': 'product-ds', 'trackLabel': 'Product Data Scientist', 'section': 4,
                      'sectionLabel': 'Adaptive tests, heterogeneity and targeting'},
    'pds-causal': {'track': 'product-ds', 'trackLabel': 'Product Data Scientist', 'section': 5,
                   'sectionLabel': 'Causal inference without a randomiser'},
    'pds-honest': {'track': 'product-ds', 'trackLabel': 'Product Data Scientist', 'section': 6,
                   'sectionLabel': 'Making an observational claim honest'},
    'pds-longrun': {'track': 'product-ds', 'trackLabel': 'Product Data Scientist', 'section': 7,
                    'sectionLabel': 'Long-run effects and second-order damage'},
    'pds-decision': {'track': 'product-ds', 'trackLabel': 'Product Data Scientist', 'section': 8,
                     'sectionLabel': 'From evidence to decision'},
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
    'Bayesian-Mini-4': 'Credible vs confidence intervals: the difference that matters',
    'Bayesian-Mini-5': 'Compare Bayesian models: LOO and WAIC',
    'Bayesian-Mini-6': 'Brms: Bayesian regression without writing Stan',
    'Foundations-Mini-1': 'Conditional probability: P(A given B), made concrete',
    'Foundations-Mini-3': 'Law of Large Numbers vs CLT: the real difference',
    'Foundations-Mini-4': 'Statistical vs practical significance: report both',
    'Foundations-Mini-5': 'Which distribution when: a field guide',
    'Which-Test-Mini-2': "Welch's ANOVA: the test for unequal group variances",
    'Which-Test-Mini-2-v2': "Welch's ANOVA: the test for unequal group variances",
    'Which-Test-Mini-2-v3': "Welch's ANOVA: the test for unequal group variances",
    'Which-Test-Mini-3': 'Mann-Whitney U test: when and how to run it',
    'Which-Test-Mini-4': "Fisher's exact test: when and how, with a worked example",
    'Which-Test-Mini-5': 'Chi-square tests: which one to use and how',
    'Which-Test-Mini-6': 'ANOVA post-hoc tests: Tukey vs Bonferroni',
    'Which-Test-Mini-7': 'Kruskal-Wallis: the nonparametric ANOVA',
    'Resampling-Mini-1': 'Permutation tests: exact p-values without formulas',
    'Resampling-Mini-2': 'Bootstrap confidence intervals: for any statistic',
    'Beyond-Lines-Mini-1': 'Segmented regression: find the breakpoints',
    'Beyond-Lines-Mini-2': 'Poisson regression: model count data right',
    'Structure-Mini-1': 'Interpreting PCA: what loadings and scores mean',
    'TS-Toolkit-Mini-1': 'Cointegration: test when two series move together',
    'TS-Toolkit-Mini-2': 'Prediction intervals: put honest uncertainty on your forecasts',
}


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
    missing_access = []
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
        # Never derived. access decides whether the edge middleware strips
        # this page's body, and no positional rule reproduces the real tree
        # (6.10.x is section 1 yet pro; 4.2.x and 6.3.x are section 2 and 3
        # yet free). A missing field is an authoring bug, not a default.
        access = str(fm.get('lesson_access', '')).strip().lower()
        if access not in ('free', 'pro'):
            missing_access.append((slug, access or '(absent)'))
            continue
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

    if missing_access:
        sys.stderr.write(
            '\nERROR: %d lesson(s) have no usable `lesson_access` in frontmatter.\n'
            'It must be exactly `free`, `pro`, or `windowed`. It is never derived:\n'
            'this value drives functions/_data/pro-lessons.json, which the edge\n'
            'middleware uses to strip Pro content, so a guess either paywalls free\n'
            'content or leaks paid content.\n\n' % len(missing_access))
        for slug, got in missing_access:
            sys.stderr.write('  %-55s lesson_access: %s\n' % (slug, got))
        sys.stderr.write('\nNothing written. Fix the frontmatter and re-run.\n')
        raise SystemExit(2)

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
