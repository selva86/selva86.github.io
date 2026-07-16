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
    ('Calculators', ['t-test-calculator','p-value-calculator','descriptive-statistics-calculator','mean-median-mode-calculator','standard-deviation-calculator','percentile-calculator','iqr-calculator','box-plot-calculator','correlation-calculator','correlation-matrix-calculator','linear-regression-calculator','anova-calculator','odds-ratio-calculator','fisher-exact-test-calculator','ab-test-calculator','statistical-significance-calculator','chi-square-calculator','confidence-interval-calculator','margin-of-error-calculator','bootstrap-ci-calculator','multiple-testing-correction','equivalence-noninferiority-calculator','z-score-percentile','normal-distribution-calculator','empirical-rule-calculator','binomial-probability-calculator','poisson-distribution-calculator','proportion-test-calculator']),
    ('Reference Tables', ['t-table','z-table','chi-square-table','f-table','binomial-table','pearson-critical-values-table']),
    ('Bayesian', ['bayes-factor-calculator','bayes-theorem-calculator','beta-distribution-calculator']),
    ('R Output Interpreters', ['lm-output-interpreter','glm-output-interpreter','anova-output-interpreter','diagnostic-plot-interpreter','vif-interpreter','confusion-matrix-interpreter']),
    ('Pickers and Decision Tools', ['statistical-test-chooser','normality-test-picker','nonparametric-test-picker','dag-confounder-picker']),
    ('Study Design and Power', ['sample-size-calculator','sample-size-t-test-calculator','sample-size-proportion-calculator','sample-size-anova-calculator','power-analysis','survival-power-calculator','effect-size-converter','type-i-ii-error-visualizer']),
    ('Specialized', ['ts-stationarity-calculator','acf-pacf-calculator','outlier-detection-calculator','roc-auc-calculator','cronbachs-alpha-calculator','cohens-kappa-calculator','icc-calculator','reprex-builder']),
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


# Card metadata for the /tools/ landing (C3 instrument-panel design,
# owner-approved 2026-07-13). Every tool gets a small schematic of its OUTPUT
# (the "dial"), a plain one-line blurb, and a mono badge naming the underlying
# statistic. New tools MUST add an entry here (a generic card renders, with a
# build warning, until they do).
C3META = {
 't-test-calculator': ('t-Test', 't',
  'Two means, paired or one-sample. Summary stats or raw values both work.',
  '<path class="s" d="M4 37 H40"/><path class="a" d="M5 37 C11 37 12 13 18 13 C24 13 25 37 31 37" fill="none"/><path class="a" style="opacity:.45" d="M13 37 C19 37 20 9 26 9 C32 9 33 37 39 37" fill="none"/>'),
 'ab-test-calculator': ('A/B Test', 'z',
  'Conversion counts for two variants, with sample-size planning and a Bayesian read.',
  '<path class="s" d="M6 38 H38"/><rect class="af" x="11" y="20" width="8" height="18"/><rect class="af" style="opacity:.45" x="25" y="13" width="8" height="25"/><path class="a" d="M15 20 V15 M12.5 15 H17.5" fill="none"/><path class="a" style="opacity:.6" d="M29 13 V8 M26.5 8 H31.5" fill="none"/>'),
 'statistical-significance-calculator': ('Statistical Significance', 'p&lt;.05',
  'Is the difference real or noise? Two conversion rates, two averages, or a rate versus a target, with a plain-English verdict.',
  '<path class="s" d="M22 6 V38" stroke-dasharray="2.5 2.5"/><path class="a" d="M15 22 H35 M15 17.5 V26.5 M35 17.5 V26.5" fill="none"/><circle class="af" cx="27" cy="22" r="3"/>'),
 'chi-square-calculator': ('Chi-Square', '&chi;&sup2;',
  'Counts in a table: independence, goodness-of-fit, homogeneity. Residuals show which cell drives the result.',
  '<path class="s" d="M4 38 H40"/><path class="a" d="M5 38 C7 16 10 8 14 8 C22 8 24 30 30 34 C33 36 36 37 39 37.6" fill="none"/><path class="s" d="M29 38 V16" stroke-dasharray="2.5 2.5"/><path class="af" d="M29 33.6 C33 36 36 37 39 37.6 L39 38 H29 Z"/>'),
 'confidence-interval-calculator': ('Confidence Intervals', 'CI',
  'Eight interval types for means, proportions, and variances, drawn to scale.',
  '<path class="s" d="M22 6 V16" stroke-dasharray="2.5 2.5"/><path class="a" d="M8 24 H36 M8 19.5 V28.5 M36 19.5 V28.5" fill="none"/><circle class="af" cx="22" cy="24" r="3"/>'),
 'margin-of-error-calculator': ('Margin of Error', 'MOE',
  'The plus-or-minus on a poll or survey, the sample size for a target margin, or the margin on an average.',
  '<path class="af" d="M12 20 H32 V28 H12 Z" style="opacity:.16"/><path class="a" d="M8 24 H36 M8 19 V29 M36 19 V29" fill="none"/><path class="a" d="M8 24 l5 -3 M8 24 l5 3 M36 24 l-5 -3 M36 24 l-5 3" fill="none"/><circle class="af" cx="22" cy="24" r="3"/>'),
 'bootstrap-ci-calculator': ('Bootstrap CI', 'boot',
  'Paste raw data and bootstrap a CI for the mean, median, SD, or any quantile.',
  '<path class="s" d="M22 6 V38" stroke-dasharray="2.5 2.5"/><path class="a" d="M10 13 H30 M10 10.5 V15.5 M30 10.5 V15.5" fill="none"/><path class="a" style="opacity:.65" d="M14 22 H36 M14 19.5 V24.5 M36 19.5 V24.5" fill="none"/><path class="a" style="opacity:.4" d="M8 31 H28 M8 28.5 V33.5 M28 28.5 V33.5" fill="none"/><circle class="af" cx="20" cy="13" r="2"/><circle class="af" style="opacity:.65" cx="25" cy="22" r="2"/><circle class="af" style="opacity:.4" cx="18" cy="31" r="2"/>'),
 'multiple-testing-correction': ('P-Value Adjustment', 'FDR',
  'Paste a column of p-values and see what survives Bonferroni, Holm, or the BH false-discovery rate.',
  '<path class="s" d="M4 25 H40" stroke-dasharray="3 2.5"/><circle class="af" cx="9" cy="14" r="2.6"/><circle class="af" cx="17" cy="9" r="2.6"/><circle class="af" cx="25" cy="18" r="2.6"/><circle class="ao" cx="32" cy="31" r="2.6"/><circle class="ao" cx="38" cy="35" r="2.6"/>'),
 'equivalence-noninferiority-calculator': ('Equivalence (TOST)', 'TOST',
  'Shows whether two treatments are close enough to call equivalent, not just &ldquo;not significantly different&rdquo;.',
  '<path class="s" d="M9 7 V37 M35 7 V37" stroke-dasharray="2.5 2.5"/><path class="a" d="M14 22 H30 M14 17.5 V26.5 M30 17.5 V26.5" fill="none"/><circle class="af" cx="22" cy="22" r="2.6"/>'),
 'z-score-percentile': ('Z-Score &harr; Percentile', 'z',
  'Convert a z-score to a percentile and back, with the shaded curve to match.',
  '<path class="s" d="M4 37 H40"/><path class="a" d="M5 37 C13 37 14 9 22 9 C30 9 31 37 39 37" fill="none"/><path class="af" d="M5 37 C13 37 14 9 22 9 C26 9 27.6 16 29 24 L29 37 Z" style="opacity:.18"/><path class="a" d="M29 37 V21" fill="none"/>'),
 'normal-distribution-calculator': ('Normal Distribution', 'pnorm',
  'Area below, above, between or outside a value on any normal curve, plus inverse cutoffs, with a shaded plot.',
  '<path class="s" d="M4 37 H40"/><path class="a" d="M5 37 C13 37 14 9 22 9 C30 9 31 37 39 37" fill="none"/><path class="af" d="M14.5 37 C17 30 19 16 22 9 C25 16 27 30 29.5 37 Z" style="opacity:.2"/><path class="a" d="M14.5 37 V25 M29.5 37 V25" fill="none" stroke-dasharray="2.5 2.5"/>'),
 'empirical-rule-calculator': ('Empirical Rule', '68-95-99.7',
  'The 68-95-99.7 rule for any mean and SD: the three bands and their ranges, which band a value is in, or the range for a coverage.',
  '<path class="s" d="M4 37 H40"/><path class="a" d="M5 37 C13 37 14 9 22 9 C30 9 31 37 39 37" fill="none"/><path class="af" d="M9 37 C14 37 15.5 15 22 9 C28.5 15 30 37 35 37 Z" style="opacity:.13"/><path class="af" d="M14.5 37 C17.5 30 19.5 16 22 9 C24.5 16 26.5 30 29.5 37 Z" style="opacity:.22"/><path class="a" d="M9 37 V25 M35 37 V25 M14.5 37 V23 M29.5 37 V23" fill="none" stroke-dasharray="2.5 2.5"/>'),
 'binomial-probability-calculator': ('Binomial Probability', 'dbinom',
  'The chance of k successes in n trials, exact or cumulative, a range, or the inverse count, with a shaded bar chart.',
  '<path class="s" d="M6 38 H40"/><rect class="af" style="opacity:.4" x="8" y="30" width="4.5" height="8"/><rect class="af" style="opacity:.4" x="14" y="22" width="4.5" height="16"/><rect class="af" x="20" y="14" width="4.5" height="24"/><rect class="af" style="opacity:.4" x="26" y="22" width="4.5" height="16"/><rect class="af" style="opacity:.4" x="32" y="30" width="4.5" height="8"/>'),
 'poisson-distribution-calculator': ('Poisson Distribution', 'dpois',
  'The chance of k events at an average rate lambda, exact or cumulative, a range, or the inverse count, with a shaded bar chart.',
  '<path class="s" d="M6 38 H40"/><rect class="af" style="opacity:.4" x="8" y="27" width="4.5" height="11"/><rect class="af" x="14" y="14" width="4.5" height="24"/><rect class="af" style="opacity:.7" x="20" y="19" width="4.5" height="19"/><rect class="af" style="opacity:.55" x="26" y="27" width="4.5" height="11"/><rect class="af" style="opacity:.4" x="32" y="33" width="4.5" height="5"/>'),
 'proportion-test-calculator': ('Proportion Z-Test', 'z',
  'A one- or two-proportion z-test the classroom way: hypotheses, the z statistic, a critical value, and the p-value, with the continuity-correction note.',
  '<path class="s" d="M4 37 H40"/><path class="a" d="M5 37 C13 37 14 9 22 9 C30 9 31 37 39 37" fill="none"/><path class="af" d="M5 37 C8.5 37 9.5 32 11 26 L11 37 Z" style="opacity:.28"/><path class="af" d="M33 26 C34.5 32 35.5 37 39 37 L33 37 Z" style="opacity:.28"/><path class="a" d="M28 37 V16" fill="none" stroke-dasharray="2.5 2.5"/>'),
 'p-value-calculator': ('p-Value Calculator', 'p',
  'Turn a t, z, chi-square, F, or r statistic into its p-value, or go the other way from alpha.',
  '<path class="s" d="M4 37 H40"/><path class="a" d="M5 37 C13 37 14 9 22 9 C30 9 31 37 39 37" fill="none"/><path class="af" d="M30 21.8 C31.6 26.6 33.4 33 35 35.4 C36.3 36.4 37.6 36.9 39 37 L39 37 H30 Z" style="opacity:.35"/><path class="a" d="M30 37 V18" fill="none" stroke-dasharray="2.5 2.5"/>'),
 'descriptive-statistics-calculator': ('Descriptive Statistics', 'summary',
  'Paste a column of numbers for the mean, median, SD, quartiles, skewness, and a live histogram and boxplot.',
  '<path class="s" d="M6 24 H38"/><rect class="af" x="8" y="16" width="6" height="8"/><rect class="af" x="15" y="9" width="6" height="15"/><rect class="af" x="22" y="12" width="6" height="12"/><rect class="af" x="29" y="18" width="6" height="6"/><path class="a" d="M9 34 H16 M28 34 H37" fill="none"/><rect class="a" x="16" y="30" width="12" height="8" rx="1" fill="none"/><path class="a" d="M22 30 V38" fill="none"/>'),
 'mean-median-mode-calculator': ('Mean, Median &amp; Mode', 'x&#772;',
  'Paste a list or a frequency table for the mean, median and mode together, with the range, midrange and a read on when the median beats the mean.',
  '<path class="s" d="M5 37 H40"/><rect class="af" x="8" y="19" width="4.5" height="18"/><rect class="af" x="13.5" y="12" width="4.5" height="25"/><rect class="af" x="19" y="22" width="4.5" height="15"/><rect class="af" x="24.5" y="27" width="4.5" height="10"/><rect class="af" x="30" y="31" width="4.5" height="6"/><path class="a" d="M17 8 V37" stroke-dasharray="2.5 2.5"/><path class="a" d="M23 8 V37" fill="none"/>'),
 'standard-deviation-calculator': ('Standard Deviation', 'SD',
  'Paste a list or a frequency table for the sample and population standard deviation, variance, standard error and CV, with every step shown.',
  '<path class="s" d="M4 37 H40"/><path class="a" d="M5 37 C13 37 14 9 22 9 C30 9 31 37 39 37" fill="none"/><path class="af" d="M15 37 C17.5 29 19.5 15 22 9 C24.5 15 26.5 29 29 37 Z" style="opacity:.2"/><path class="a" d="M15 37 V25 M29 37 V25" fill="none" stroke-dasharray="2.5 2.5"/><path class="a" d="M15 32 H29 M15 32 l3 -2 M15 32 l3 2 M29 32 l-3 -2 M29 32 l-3 2" fill="none"/>'),
 'percentile-calculator': ('Percentile Calculator', 'P90',
  'Paste data for the full percentile table, 1st to 99th plus any custom percentile, or the percentile rank of a value, in type 7 or 6.',
  '<path class="s" d="M5 37 H40"/><path class="a" d="M6 33 H13 V27 H20 V19 H27 V12 H34 V7 H40" fill="none"/><path class="s" d="M6 12 H27 M27 12 V37" stroke-dasharray="2.5 2"/><circle class="af" cx="27" cy="12" r="2.6"/>'),
 'iqr-calculator': ('IQR &amp; Outliers', 'IQR',
  'Paste data for the interquartile range, quartiles, five-number summary, the 1.5 IQR fences and every flagged outlier, on a labeled boxplot.',
  '<path class="s" d="M6 22 H12 M6 18 V26"/><path class="s" d="M32 22 H36 M36 18 V26"/><rect class="a" x="12" y="14" width="20" height="16" rx="2" fill="none"/><path class="a" d="M21 14 V30"/><circle class="af" cx="40" cy="22" r="2.6"/>'),
 'box-plot-calculator': ('Box Plot', 'boxplot',
  'Paste one group or several named groups for the five-number summary, quartiles, IQR and outliers, drawn as side-by-side box plots.',
  '<path class="s" d="M5 5 V39 H41"/><path class="s" d="M14 9 V13 M14 30 V34"/><rect class="a" x="9" y="13" width="10" height="17" rx="1.5" fill="none"/><path class="a" d="M9 22 H19"/><path class="s" d="M31 13 V17 M31 32 V36"/><rect class="a" x="26" y="17" width="10" height="15" rx="1.5" fill="none"/><path class="a" d="M26 24 H36"/><circle class="af" cx="31" cy="8" r="2.4"/>'),
 't-table': ('t Table', 'qt',
  'Look up t critical values by df and alpha, or go backwards from t to p. Printable.',
  '<rect class="s" x="6" y="8" width="32" height="28" rx="2" fill="none"/><path class="s" d="M6 15 H38 M6 22 H38 M6 29 H38 M14 8 V36 M22 8 V36 M30 8 V36"/><rect class="af" x="22" y="22" width="8" height="7" style="opacity:.8"/>'),
 'z-table': ('z Table', 'qnorm',
  'Standard normal areas: z to probability in any direction, and back. Printable.',
  '<path class="s" d="M4 34 H40"/><path class="a" d="M5 34 C13 34 14 8 22 8 C30 8 31 34 39 34" fill="none"/><path class="af" d="M5 34 C13 34 14 8 22 8 C24 8 25.4 9.6 26.6 12.4 L26.6 34 Z" style="opacity:.18"/><path class="s" d="M8 38 H36" stroke-dasharray="2 2.5"/>'),
 'chi-square-table': ('Chi-Square Table', 'qchisq',
  'Look up chi-square critical values by df and alpha, or go from a statistic to its p-value. Printable.',
  '<path class="s" d="M4 37 H40"/><path class="a" d="M5 37 C7 17 10 9 14 9 C22 9 25 30 31 34 C34 35.6 37 36.4 39 36.8" fill="none"/><path class="s" d="M28 37 V18" stroke-dasharray="2.5 2.5"/><path class="af" d="M28 33.2 C31 34.9 34 35.9 39 36.8 L39 37 H28 Z"/>'),
 'f-table': ('F Distribution Table', 'qf',
  'Look up F critical values by df1, df2 and alpha, or go from an F statistic to p. Printable.',
  '<path class="s" d="M4 37 H40"/><path class="a" d="M5 31 C6 16 8 10 11 10 C16 10 18 26 24 31 C29 35 34 36.4 39 36.9" fill="none"/><path class="s" d="M26 37 V20" stroke-dasharray="2.5 2.5"/><path class="af" d="M26 32.6 C30 35 34 36.4 39 36.9 L39 37 H26 Z"/>'),
 'binomial-table': ('Binomial Table', 'dbinom',
  'Look up the chance of k successes in n trials: exact and cumulative cells for n = 1 to 20, with the p &gt; 0.5 mirror handled for you. Printable.',
  '<rect class="s" x="6" y="8" width="32" height="28" rx="2" fill="none"/><path class="s" d="M6 15 H38 M14 8 V36"/><rect class="af" style="opacity:.4" x="17" y="27" width="4" height="6"/><rect class="af" x="23" y="20" width="4" height="13"/><rect class="af" style="opacity:.4" x="29" y="25" width="4" height="8"/>'),
 'pearson-critical-values-table': ('Pearson r Table', 'cor.test',
  'How strong a correlation has to be, at your sample size, to count as real. Critical r by df and alpha, with a verdict and an exact p-value. Printable.',
  '<rect class="s" x="6" y="8" width="32" height="28" rx="2" fill="none"/><path class="s" d="M6 15 H38 M14 8 V36"/><path class="a" d="M17 32 L35 20" fill="none"/><circle class="af" cx="18.5" cy="30.8" r="1.4"/><circle class="af" cx="24" cy="27.2" r="1.4"/><circle class="af" cx="29.5" cy="23.5" r="1.4"/><circle class="af" cx="34.5" cy="20.2" r="1.4"/>'),
 'beta-distribution-calculator': ('Beta Distribution', 'dbeta',
  'The distribution for a proportion: density, tail areas, quantiles and credible intervals for any alpha and beta, with a shaded curve.',
  '<path class="s" d="M4 37 H40"/><path class="a" d="M5 37 C11 37 12 11 19 11 C26 11 33 37 39 37" fill="none"/><path class="af" d="M5 37 C11 37 12 11 19 11 C23.5 11 27.5 21 30 30 L30 37 Z" style="opacity:.2"/><path class="s" d="M5 37 V27 M39 37 V27"/><path class="a" d="M30 37 V22" fill="none" stroke-dasharray="2.5 2.5"/>'),
 'bayes-factor-calculator': ('Bayes Factor', 'BF&#8321;&#8320;',
  'How strongly the data favor H1 over H0, with a plot showing how the answer moves as the prior changes.',
  '<path class="s" d="M4 36 H40"/><path class="s" d="M6 36 C13 27 31 27 38 36" fill="none"/><path class="a" d="M13 36 C18 36 19 8 24 8 C29 8 30 36 35 36" fill="none"/>'),
 'bayes-theorem-calculator': ("Bayes' Theorem", 'P(H|D)',
  'Base rate in, posterior out. Explains why a 95%-accurate test can still be usually wrong.',
  '<rect class="s" x="9" y="9" width="12" height="12" rx="1.5" fill="none"/><rect class="af" x="23" y="9" width="12" height="12" rx="1.5"/><rect class="af" style="opacity:.22" x="9" y="23" width="12" height="12" rx="1.5"/><rect class="s" x="23" y="23" width="12" height="12" rx="1.5" fill="none"/>'),
 'lm-output-interpreter': ('lm() Interpreter', 'lm',
  'Paste summary(lm(...)). Every coefficient, the R&sup2;, and the F-test explained line by line.',
  '<path class="s" d="M7 5 V38 H40"/><circle class="af" cx="13" cy="30" r="2"/><circle class="af" cx="18" cy="28" r="2"/><circle class="af" cx="22" cy="22" r="2"/><circle class="af" cx="28" cy="20" r="2"/><circle class="af" cx="33" cy="13" r="2"/><path class="a" d="M9 34 L38 10" fill="none"/>'),
 'glm-output-interpreter': ('glm() Interpreter', 'glm',
  'Paste summary(glm(...)). Coefficients become odds or rate ratios; deviance and AIC get a plain reading.',
  '<path class="s" d="M4 8 H40 M4 36 H40" stroke-dasharray="2.5 2.5"/><path class="a" d="M6 36 C16 36 20 8 38 8" fill="none"/><circle class="af" cx="9" cy="36" r="2"/><circle class="af" cx="14" cy="36" r="2"/><circle class="af" cx="30" cy="8" r="2"/><circle class="af" cx="35" cy="8" r="2"/>'),
 'anova-output-interpreter': ('ANOVA Interpreter', 'aov',
  'Paste aov() output. Recomputes each F from the sums of squares and adds effect sizes.',
  '<circle class="ao" cx="11" cy="16" r="1.8"/><circle class="ao" cx="12.5" cy="22" r="1.8"/><circle class="ao" cx="10" cy="27" r="1.8"/><circle class="ao" cx="22.5" cy="20" r="1.8"/><circle class="ao" cx="21" cy="26" r="1.8"/><circle class="ao" cx="23.5" cy="31" r="1.8"/><circle class="ao" cx="33" cy="10" r="1.8"/><circle class="ao" cx="34.5" cy="16" r="1.8"/><circle class="ao" cx="32" cy="21" r="1.8"/><path class="a" d="M7 21.5 H16 M18.5 25.5 H27.5 M29.5 15.5 H38.5" fill="none"/>'),
 'diagnostic-plot-interpreter': ('Diagnostic Plots', 'resid',
  'Reads the four plot(lm) panels for you: what a healthy one looks like and what yours is saying.',
  '<path class="s" d="M5 22 H40" stroke-dasharray="3 2.5"/><circle class="af" cx="9" cy="20" r="2"/><circle class="af" cx="14" cy="25" r="2"/><circle class="af" cx="19" cy="17" r="2"/><circle class="af" cx="24" cy="28" r="2"/><circle class="af" cx="30" cy="13" r="2"/><circle class="af" cx="36" cy="33" r="2"/>'),
 'vif-interpreter': ('VIF', 'VIF',
  'Checks whether your predictors are too correlated for the coefficients to mean anything.',
  '<circle class="a" cx="17" cy="17" r="9" fill="none"/><circle class="a" style="opacity:.6" cx="27" cy="17" r="9" fill="none"/><circle class="a" style="opacity:.35" cx="22" cy="27" r="9" fill="none"/>'),
 'confusion-matrix-interpreter': ('Confusion Matrix', '2&times;2',
  'Four cells in; precision, recall, F1, MCC and kappa out, with advice on which to trust when classes are imbalanced.',
  '<rect class="af" x="9" y="9" width="12" height="12" rx="1.5"/><rect class="s" x="23" y="9" width="12" height="12" rx="1.5" fill="none"/><rect class="s" x="9" y="23" width="12" height="12" rx="1.5" fill="none"/><rect class="af" x="23" y="23" width="12" height="12" rx="1.5"/>'),
 'statistical-test-chooser': ('Statistical Test Chooser', 'tree',
  'Answer plain questions about your goal and data; it walks the decision tree to the right test.',
  '<circle class="a" cx="22" cy="8" r="4" fill="none"/><path class="s" d="M19.5 11 L12 20 M24.5 11 L32 20"/><circle class="a" style="opacity:.55" cx="11" cy="24" r="3.4" fill="none"/><circle class="af" cx="33" cy="24" r="3.4"/><path class="s" d="M11 27.5 V32 M33 27.5 V32"/><rect class="s" x="6.5" y="32" width="9" height="6" rx="1.5" fill="none"/><rect class="af" x="28.5" y="32" width="9" height="6" rx="1.5" style="opacity:.55"/>'),
 'normality-test-picker': ('Normality Tests', 'Q-Q',
  'Shapiro-Wilk, Anderson-Darling and a Q-Q plot, plus a straight answer on whether normality even matters for your case.',
  '<path class="s" d="M7 37 L37 7"/><circle class="af" cx="10" cy="30" r="2"/><circle class="af" cx="15" cy="28" r="2"/><circle class="af" cx="20" cy="24" r="2"/><circle class="af" cx="25" cy="19" r="2"/><circle class="af" cx="30" cy="15" r="2"/><circle class="af" cx="35" cy="13.5" r="2"/>'),
 'nonparametric-test-picker': ('Nonparametric Tests', 'ranks',
  'Wilcoxon, Mann-Whitney, Kruskal-Wallis and Friedman, for when means and normality are off the table.',
  '<path class="a" d="M14 8 V13 M14 26 V32" fill="none"/><rect class="a" x="9" y="13" width="10" height="13" rx="1.5" fill="none"/><path class="a" d="M9 19 H19" fill="none"/><path class="a" style="opacity:.55" d="M30 12 V18 M30 31 V37" fill="none"/><rect class="a" style="opacity:.55" x="25" y="18" width="10" height="13" rx="1.5" fill="none"/><path class="a" style="opacity:.55" d="M25 24 H35" fill="none"/>'),
 'dag-confounder-picker': ('DAG Adjustment Sets', 'DAG',
  'Draw your causal diagram; it finds the minimum set of variables to adjust for and flags colliders.',
  '<circle class="a" cx="22" cy="9" r="4.5" fill="none"/><circle class="a" cx="10" cy="33" r="4.5" fill="none"/><circle class="a" cx="34" cy="33" r="4.5" fill="none"/><path class="s" d="M19 13 L12.5 29 M25 13 L31.5 29"/><path class="a" d="M15 33 H28" fill="none"/><path class="af" d="M29.5 33 L26 31 V35 Z"/>'),
 'sample-size-calculator': ('Sample Size Calculator', 'n',
  'Start here. Routes you to the right calculator for what you are comparing, or sizes a survey estimate from your margin of error.',
  '<path class="s" d="M23 38 V22"/><path class="a" d="M23 22 L11 10" fill="none"/><path class="a" d="M23 22 L35 10" fill="none"/><circle class="af" cx="9" cy="8" r="3.4"/><circle class="af" cx="37" cy="8" r="3.4"/><circle class="a" cx="23" cy="22" r="3.4" fill="none"/>'),
 'sample-size-t-test-calculator': ('Sample Size for t Tests', 'n',
  'How many participants a one-sample, two-group, or paired t test needs, from Cohen&rsquo;s d or from your means and SDs.',
  '<path class="s" d="M6 6 V36 H40"/><path class="a" d="M7 34 C18 34 17 12 39 10" fill="none"/><path class="s" d="M21 36 V20.5" stroke-dasharray="2.5 2.5"/><circle class="af" cx="21" cy="20.5" r="3.2"/>'),
 'sample-size-proportion-calculator': ('Sample Size for Proportions', 'h',
  'How many users an A/B test needs, or a one-proportion test against a target, from your rates or from Cohen&rsquo;s h.',
  '<path class="s" d="M6 6 V36 H40"/><path class="a" d="M13 36 V26 H21 V36" fill="none"/><path class="af" d="M27 36 V16 H35 V36 Z"/>'),
 'sample-size-anova-calculator': ('Sample Size for ANOVA', 'f',
  'How many per group a one-way ANOVA needs, from Cohen&rsquo;s f, from eta-squared, or from the group means you expect.',
  '<path class="s" d="M6 6 V36 H40"/><path class="a" d="M12 36 V24 H18 V36" fill="none"/><path class="af" d="M21 36 V13 H27 V36 Z"/><path class="a" d="M30 36 V20 H36 V36" fill="none"/>'),
 'power-analysis': ('Power Analysis', '1&minus;&beta;',
  'Solve for any one of sample size, power, effect size, or alpha across the common tests.',
  '<path class="s" d="M4 36 H40"/><path class="s" d="M4 36 C11 36 12 12 18 12 C24 12 25 36 32 36" fill="none"/><path class="a" d="M12 36 C19 36 20 12 26 12 C32 12 33 36 40 36" fill="none"/><path class="s" d="M24 8 V36" stroke-dasharray="2.5 2.5"/><path class="af" d="M24 13.5 C25 12.3 25.4 12 26 12 C32 12 33 36 40 36 L24 36 Z" style="opacity:.2"/>'),
 'survival-power-calculator': ('Survival Power', 'log-rank',
  'Events, sample size, or power for a log-rank test, with accrual, follow-up, and dropout built in.',
  '<path class="s" d="M6 5 V39 H40"/><path class="s" d="M6 8 H12 V16 H19 V24 H26 V32 H38"/><path class="a" d="M6 8 H15 V13 H23 V19 H31 V26 H38" fill="none"/>'),
 'effect-size-converter': ('Effect Size Converter', 'd&harr;r',
  "Translate between Cohen's d, r, odds ratios, and eta-squared without hunting for the formula.",
  '<path class="s" d="M4 36 H40"/><path class="s" d="M4 36 C10 36 11 16 16 16 C21 16 22 36 28 36" fill="none"/><path class="a" d="M16 36 C22 36 23 16 28 16 C33 16 34 36 40 36" fill="none"/><path class="a" d="M16 9 H28" fill="none"/><path class="af" d="M16 9 L19.5 7 V11 Z M28 9 L24.5 7 V11 Z"/>'),
 'type-i-ii-error-visualizer': ('Type I / II Errors', '&alpha;/&beta;',
  'Drag effect size, n, and alpha; watch the two error regions trade against each other.',
  '<path class="s" d="M4 36 H40"/><path class="s" d="M4 36 C11 36 12 12 18 12 C24 12 25 36 32 36" fill="none"/><path class="a" d="M12 36 C19 36 20 12 26 12 C32 12 33 36 40 36" fill="none"/><path class="s" d="M25 8 V36" stroke-dasharray="2.5 2.5"/><path class="sf" d="M25 14.6 C26.8 18 28 25 30 30 C30.8 32.4 31.4 34.6 32 36 L25 36 Z"/><path class="af" d="M25 15.5 C23.5 19 22.6 24 21 29 C20.2 31.6 19.4 34.4 18.6 36 L25 36 Z" style="opacity:.22"/>'),
 'ts-stationarity-calculator': ('Stationarity Tests', 'ADF',
  'ADF, KPSS and Phillips-Perron on your series, and what to do when they disagree.',
  '<path class="s" d="M4 24 H40" stroke-dasharray="3 2.5"/><path class="a" d="M4 30 L9 26 L13 32 L18 22 L23 27 L28 15 L33 20 L40 12" fill="none"/>'),
 'acf-pacf-calculator': ('ACF & PACF', 'Lags',
  'Both correlograms with the significance bands, and an honest read on the ARIMA order.',
  '<path class="s" d="M4 36 H42"/><path class="s" d="M4 22 H42" stroke-dasharray="3 2.5"/><path class="a" d="M7 36 V8"/><path class="a" d="M13 36 V14"/><path class="a" d="M19 36 V19"/><path class="s" d="M25 36 V25"/><path class="s" d="M31 36 V29"/><path class="s" d="M37 36 V32"/>'),
 'outlier-detection-calculator': ('Outlier Detection', 'IQR',
  'Grubbs, ESD, Hampel and IQR on the same data, side by side.',
  '<path class="s" d="M4 34 H40" stroke-dasharray="3 2.5"/><circle class="af" cx="8" cy="28" r="2.2"/><circle class="af" cx="14" cy="30" r="2.2"/><circle class="af" cx="20" cy="27" r="2.2"/><circle class="af" cx="26" cy="29" r="2.2"/><circle class="af" cx="31" cy="28" r="2.2"/><circle class="af" cx="37" cy="10" r="2.2"/><circle class="a" cx="37" cy="10" r="5.5" fill="none" stroke-dasharray="2.5 2"/>'),
 'roc-auc-calculator': ('ROC & AUC', 'AUC',
  'Paste scores and labels for the ROC curve, AUC with a DeLong CI, and the threshold that fits your costs.',
  '<path class="s" d="M8 4 V38 H40"/><path class="s" d="M8 38 L38 8" stroke-dasharray="2.5 2.5"/><path class="a" d="M8 38 C9 20 16 9 38 8" fill="none"/><circle class="af" cx="14" cy="16" r="2.4"/>'),
 'reprex-builder': ('Reprex Builder', '.md',
  'Turns your problem code into a minimal, runnable example people will actually answer.',
  '<rect class="s" x="10" y="5" width="24" height="34" rx="2.5" fill="none"/><path class="s" d="M14 12 H30 M14 26 H30 M14 33 H24"/><path class="a" d="M14 19 H30" fill="none" stroke-width="3"/>'),
 'cronbachs-alpha-calculator': ("Cronbach's Alpha", '&alpha;',
  'Paste item responses for alpha, its confidence interval, and a per-item read on what to keep or drop.',
  '<path class="s" d="M6 37 H40"/><rect class="af" x="8" y="27" width="6" height="9" rx="1"/><rect class="af" x="8" y="18" width="9" height="7" rx="1"/><rect class="af" x="8" y="10" width="7" height="6" rx="1"/><path class="a" d="M23 35 A12 12 0 0 1 40 35" fill="none"/><path class="af" d="M23 35 A12 12 0 0 1 34.6 24.1 L31.5 35 Z" style="opacity:.5"/><path class="a" d="M31.5 35 L35 23" fill="none"/><circle class="af" cx="31.5" cy="35" r="2.2"/>'),
 'cohens-kappa-calculator': ("Cohen's Kappa", '&kappa;',
  'Paste a confusion matrix or two rating columns for kappa, weighted kappa, a 95% CI and the agreement band.',
  '<rect class="s" x="8" y="8" width="30" height="30" rx="2" fill="none"/><path class="s" d="M18 8 V38 M28 8 V38 M8 18 H38 M8 28 H38"/><rect class="af" x="8" y="8" width="10" height="10"/><rect class="af" x="18" y="18" width="10" height="10"/><rect class="af" x="28" y="28" width="10" height="10"/>'),
 'icc-calculator': ('ICC Calculator', 'ICC',
  'Paste a rater table for all six intraclass correlation forms with CIs, and a picker for which one to report.',
  '<path class="s" d="M6 37 H40 M6 37 V7"/><circle class="af" cx="13" cy="30" r="2.4"/><circle class="af" cx="17" cy="28.4" r="2.4"/><circle class="s" cx="15" cy="21" r="2.4" fill="none"/><circle class="af" cx="27" cy="19" r="2.4"/><circle class="af" cx="31" cy="17.4" r="2.4"/><circle class="s" cx="29" cy="10" r="2.4" fill="none"/><path class="a" d="M11 33 L33 13" fill="none" stroke-dasharray="3 2.5"/>'),
 'correlation-calculator': ('Correlation', 'r',
  'Paste two columns for Pearson r, Spearman rho or Kendall tau-b with a CI, p-value and a live scatter plot.',
  '<path class="s" d="M8 5 V38 H41"/><path class="a" d="M10 35 L38 9" fill="none"/><circle class="af" cx="13" cy="31" r="2.2"/><circle class="af" cx="18" cy="29" r="2.2"/><circle class="af" cx="22" cy="23" r="2.2"/><circle class="af" cx="27" cy="21" r="2.2"/><circle class="af" cx="31" cy="15" r="2.2"/><circle class="af" cx="36" cy="12" r="2.2"/>'),
 'correlation-matrix-calculator': ('Correlation Matrix', 'cor',
  'Paste columns for the full Pearson or Spearman matrix, colour coded, with the p-value and the n behind every cell.',
  '<rect class="s" x="6" y="6" width="32" height="32" rx="2" fill="none"/><path class="s" d="M6 14 H38 M6 22 H38 M6 30 H38 M14 6 V38 M22 6 V38 M30 6 V38"/><rect class="af" x="6" y="6" width="8" height="8" style="opacity:.85"/><rect class="af" x="14" y="14" width="8" height="8" style="opacity:.85"/><rect class="af" x="22" y="22" width="8" height="8" style="opacity:.85"/><rect class="af" x="30" y="30" width="8" height="8" style="opacity:.85"/><rect class="af" x="22" y="6" width="8" height="8" style="opacity:.5"/><rect class="af" x="6" y="22" width="8" height="8" style="opacity:.5"/><rect class="af" x="30" y="14" width="8" height="8" style="opacity:.25"/><rect class="af" x="14" y="30" width="8" height="8" style="opacity:.25"/>'),
 'linear-regression-calculator': ('Linear Regression', 'lm',
  'Paste x and y for the fitted line, the slope and intercept with SEs, t and p, R-squared, and a scatter with the fit.',
  '<path class="s" d="M8 5 V38 H41"/><path class="a" d="M9 34 L39 11" fill="none"/><circle class="af" cx="14" cy="31" r="2.1"/><circle class="af" cx="20" cy="24" r="2.1"/><circle class="af" cx="26" cy="23" r="2.1"/><circle class="af" cx="32" cy="15" r="2.1"/><path class="s" d="M20 24 V26.3 M32 15 V17.1" stroke-dasharray="2 2"/>'),
 'anova-calculator': ('One-Way &amp; Two-Way ANOVA', 'aov',
  'Paste raw group data for the full ANOVA table (SS, df, F, p), effect sizes, a group-means plot, an assumption check and the R code.',
  '<path class="s" d="M6 38 H40"/><path class="a" d="M12 12 V28 M8 12 H16 M8 28 H16 M22 20 V34 M18 20 H26 M18 34 H26 M32 8 V22 M28 8 H36 M28 22 H36" fill="none"/><circle class="af" cx="12" cy="20" r="2.4"/><circle class="af" cx="22" cy="27" r="2.4"/><circle class="af" cx="32" cy="15" r="2.4"/>'),
 'odds-ratio-calculator': ('Odds Ratio', 'OR',
  'Enter a 2x2 table for the odds ratio, risk ratio, NNT and attributable risk, each with a confidence interval and the right p-value.',
  '<path class="s" d="M6 38 H40"/><rect class="af" x="9" y="15" width="9" height="23" rx="1"/><rect class="af" style="opacity:.5" x="22" y="26" width="9" height="12" rx="1"/><rect class="a" x="30" y="5" width="10" height="10" rx="1.5" fill="none"/><path class="a" d="M35 5 V15 M30 10 H40" fill="none"/>'),
 'fisher-exact-test-calculator': ("Fisher's Exact Test", 'FET',
  'Enter a 2x2 table for the exact one- and two-sided p, the odds ratio with an exact CI, and an optional mid-p, with the null distribution drawn.',
  '<path class="s" d="M6 38 H40"/><rect class="af" x="9" y="29" width="5" height="9" rx="1"/><rect class="af" x="16" y="13" width="5" height="25" rx="1"/><rect class="s" x="23" y="20" width="5" height="18" rx="1" fill="none"/><rect class="s" x="30" y="28" width="5" height="10" rx="1" fill="none"/><path class="a" d="M18.5 6 L15.5 10 H21.5 Z" fill="currentColor"/>'),
}

# (accent, one-sentence intro) per category, aligned by CATEGORIES order.
C3CATS = {
 'Calculators': ('#2563a8',
  'Enter your numbers. The page runs the test and writes out the conclusion, with the R call that reproduces it.'),
 'Reference Tables': ('#5b6472',
  'The printable critical-value tables, with a live lookup and a reverse mode on top.'),
 'Bayesian': ('#4b45b8',
  'For questions about how much to believe something, rather than whether p crossed a line.'),
 'R Output Interpreters': ('#1f7a55',
  'Paste output straight from your R console. These pages decode every line and recompute the numbers as a cross-check.'),
 'Pickers and Decision Tools': ('#b5631a',
  'Not sure which test fits? These narrow it down from the shape of your data and show the reasoning.'),
 'Study Design and Power': ('#a8322c',
  'Work out sample size and power while the study can still be changed.'),
 'Specialized': ('#0e7490',
  'Narrower jobs: time series, outliers, classifier curves, and preparing a question for Stack Overflow.'),
}
