"""Generate /tools/index.html, the landing page for the calculator suite.

Run via `python _build/gen_tools_landing.py` or imported by build.py.
Outputs tools/index.html with: hero, six category sections of cards
(one card per tool), an ItemList JSON-LD block for SEO, and a
BreadcrumbList. Pulls title/description from each tool file.
"""
import os, re, json
import html as htmllib

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

CATEGORIES = [
    ('Calculators', ['t-test-calculator','p-value-calculator','descriptive-statistics-calculator','ab-test-calculator','chi-square-calculator','confidence-interval-calculator','bootstrap-ci-calculator','multiple-testing-correction','equivalence-noninferiority-calculator','z-score-percentile']),
    ('Reference Tables', ['t-table','z-table']),
    ('Bayesian', ['bayes-factor-calculator','bayes-theorem-calculator']),
    ('R Output Interpreters', ['lm-output-interpreter','glm-output-interpreter','anova-output-interpreter','diagnostic-plot-interpreter','vif-interpreter','confusion-matrix-interpreter']),
    ('Pickers and Decision Tools', ['statistical-test-chooser','normality-test-picker','nonparametric-test-picker','dag-confounder-picker']),
    ('Study Design and Power', ['power-analysis','survival-power-calculator','effect-size-converter','type-i-ii-error-visualizer']),
    ('Specialized', ['ts-stationarity-calculator','outlier-detection-calculator','roc-auc-calculator','reprex-builder']),
]


def collect_tools():
    """Return {slug: {title, desc}} for every tool html file on disk."""
    tools = {}
    tools_dir = os.path.join(REPO_ROOT, 'tools')
    for fn in os.listdir(tools_dir):
        if not fn.endswith('.html') or fn == 'index.html':
            continue
        slug = fn[:-5]
        with open(os.path.join(tools_dir, fn), encoding='utf-8') as f:
            s = f.read()
        title_m = re.search(r'<title>([^<]+)</title>', s)
        desc_m = re.search(r'<meta name="description" content="([^"]+)"', s)
        raw_title = title_m.group(1) if title_m else slug
        title = raw_title.split(' &middot;')[0].split(' · ')[0].strip()
        title = htmllib.unescape(title)
        desc = htmllib.unescape(desc_m.group(1)) if desc_m else ''
        tools[slug] = {'title': title, 'desc': desc}
    return tools


def render():
    """The v3 tools landing is built by gen_sections.build_tools() (shared chrome).
    Delegate so the build.py path also emits v3. collect_tools()/CATEGORIES above
    remain the data source used by gen_sections."""
    import gen_sections
    gen_sections.build_tools()


if __name__ == '__main__':
    render()
