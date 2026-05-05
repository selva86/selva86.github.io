"""One-off: rewrite scenario-name labels across 27 tools to user-question form.

Rewrites every <span class="scenario-name">LABEL</span> from the cryptic
method-style label to a plain-English user question. Idempotent: only
rewrites if the exact OLD label is present.
"""
import os, re

REWRITES = {
    'ab-test-calculator': {
        'Plan a 2-arm test': 'How many users do I need?',
        'Analyze finished test': 'Did B actually beat A?',
        'Bayesian only': 'How confident am I that B wins?',
        'Sequential look': 'Can I peek before the test ends?',
        'Long-tail conversion': 'Tiny conversion rate, can I still test?',
        'Custom': 'Use my own numbers',
    },
    'anova-output-interpreter': {
        '1-way ANOVA': 'Compare means across groups',
        '2-way with interaction': 'Two factors that influence each other',
        '2-way no interaction': 'Two factors, independent effects',
        'Repeated measures': 'Same subjects, multiple time points',
        'Custom': 'Paste my own ANOVA output',
    },
    'bayes-factor-calculator': {
        'Two-sample, moderate': 'Two groups, modest difference',
        'Two-sample, extreme': 'Two groups, large gap',
        'Two-sample, near zero': 'Two groups, almost no difference',
        'Paired pre/post': 'Same subjects, before vs after',
        'Two-proportion': 'Two yes/no rates compared',
        'Correlation r=0.4': 'Is this correlation real?',
        'ANOVA (PlantGrowth)': 'Three or more groups',
        'Regression (mtcars)': 'Does this predictor matter?',
    },
    'bayes-theorem-calculator': {
        'HIV screening': 'Should I worry about a positive HIV test?',
        'Mammography': 'How reliable is a positive mammogram?',
        'COVID rapid test': 'Is my COVID rapid test trustworthy?',
        'Drug test': 'False positives in workplace drug tests',
        'Polygraph': 'How accurate are lie detectors?',
        '50/50/50 sanity': 'Even-odds sanity check',
    },
    'bootstrap-ci-calculator': {
        'Mean of n=30 normal': 'Average of 30 normal samples',
        'Median of n=100 lognormal': 'Median of skewed data (n=100)',
        'SD with outliers': 'Standard deviation when outliers exist',
        'IQR of n=200': 'Spread of 200 values',
        '90th percentile': "What's the 90th percentile?",
        'Custom function': 'Bootstrap any statistic I write',
    },
    'chi-square-calculator': {
        '2&times;2 vaccine': 'Did the vaccine reduce infections?',
        '2&times;3 dietary': 'Diet vs three outcome categories',
        '3&times;3 income x education': 'Are income and education linked?',
        'GoF: dice fairness': 'Is this die fair?',
        'GoF: expected proportions': 'Do my counts match expected?',
        'Custom': 'Use my own table',
    },
    'confidence-interval-calculator': {
        'Mean test score': "What's the average score, with margin?",
        'Conversion rate': 'How sure am I of my conversion rate?',
        'A/B difference': 'How big is the gap between A and B?',
        'Rare event 0/100': 'Zero events out of 100: what is the rate?',
        'Poisson rate': 'Events per unit time, with margin',
        'Correlation': 'How strong is the correlation, really?',
        'Custom': 'Use my own data',
    },
    'confusion-matrix-interpreter': {
        'Spam classifier': 'How good is my spam filter?',
        'Medical screening': 'Catching the disease without false alarms',
        'Fraud rare': 'Rare fraud: precision vs recall',
        '3-class iris': 'Three flower species classifier',
        '5-class digits': 'Recognizing handwritten digits',
        'Custom': 'Paste my own confusion matrix',
    },
    'dag-confounder-picker': {
        'Classic confounder': 'Spurious link from a hidden cause',
        'Collider trap': 'When adjusting makes things worse',
        'Instrumental variable': 'Causal estimate via a clean lever',
        'Pure mediator': 'Effect that runs through a middleman',
        'M-bias': 'Two-causes-one-effect trap (M-bias)',
        'Custom': 'Build my own DAG',
    },
    'diagnostic-plot-interpreter': {
        'Clean residuals': 'Healthy regression diagnostics',
        'Heteroscedastic': 'Variance grows with predictor',
        'Nonlinear': 'A curve the model missed',
        'Outlier present': 'One value way off',
        'Influential point': 'One point dragging the line',
        'Custom paste': 'Paste my own diagnostic data',
    },
    'effect-size-converter': {
        "Cohen's d, n=100": 'Standardized mean difference',
        'OR from 2&times;2': 'Odds ratio from a 2x2 table',
        'ANOVA &eta;&sup2;': 'Variance explained from ANOVA',
        'Pearson r=0.3': 'A moderate correlation',
        'Paired d': 'Paired differences effect',
        'Large multi-group': 'Several groups, large effect',
        'Custom': 'Convert any effect size',
    },
    'glm-output-interpreter': {
        'Logistic regression': 'Yes or no outcome',
        'Poisson count model': 'Counting events',
        'Quasi-Poisson': 'Counts with overdispersion',
        'Logistic with interaction': 'Yes/no with two factors interacting',
        'Gamma (log link)': 'Continuous positive outcomes',
        'Custom': 'Paste my own glm output',
    },
    'lm-output-interpreter': {
        'mtcars regression': 'Predict mpg from car specs',
        'iris regression': 'Predict petal size',
        'Factor predictor': 'A categorical predictor',
        'Interaction term': 'Two predictors interacting',
        'Polynomial term': 'A curved relationship',
        'Custom': 'Paste my own lm output',
    },
    'multiple-testing-correction': {
        'RNA-seq 20 genes': 'Testing 20 genes at once',
        '10-arm A/B/C test': '10 variants compared',
        'Pairwise (m = 15)': 'All pairs of 6 groups (15 tests)',
        'FDR-controlled discovery': 'Allow some false positives',
        'Custom': 'My own list of p-values',
    },
    'nonparametric-test-picker': {
        'MWU treatment vs control': 'Two groups, skewed data',
        'Paired pre/post (Wilcoxon)': 'Same subjects, before vs after',
        'Kruskal-Wallis: 3 groups': 'Three groups, non-normal',
        'Ordinal Likert (5-point)': 'Likert-scale ratings',
        'Heavy ties &rarr; sign test': 'Many tied values',
        'Custom': 'Use my own data',
    },
    'normality-test-picker': {
        'Small sample (n = 20)': 'Just 20 data points',
        'Large sample (n = 500)': 'Plenty of data',
        'Right-skewed (n = 80)': 'Lopsided distribution',
        'Heavy tails (t&#8323;)': 'Heavy-tailed distribution',
        'Log-transform helps': 'When log fixes it',
        'Custom': 'Test my own data',
    },
    'outlier-detection-calculator': {
        'One spike in 30': 'One value way off in 30',
        'Three outliers': 'Three suspicious values',
        'Lognormal tail': 'Long-tailed distribution',
        'Pre/post diffs': 'Before-after differences',
        'Lab QC': 'Quality-control limits',
        'Custom': 'Check my own values',
    },
    'power-analysis': {
        'Two-sample t, d=0.5': 'Compare two means, medium effect',
        'ANOVA k=4, f=0.25': 'Compare 4 groups, modest effect',
        'Two-prop 0.10 vs 0.15': 'Two yes/no rates',
        'Correlation r=0.3': 'Detect a moderate correlation',
        'Chi-sq df=4, w=0.3': 'Categorical, moderate effect',
        'Custom': 'Plan my own study',
    },
    'reprex-builder': {
        'Minimal example': 'Bare-bones runnable example',
        'Plot example': 'Reproduce a plotting bug',
        'dplyr workflow': 'Show a tidyverse pipeline',
        'Package conflict': 'Two packages clashing',
        "Data not dput'd": 'When data is not shareable',
        'Custom function bug': 'A function that misbehaves',
    },
    'roc-auc-calculator': {
        'Perfect classifier': 'An ideal classifier',
        'mtcars logistic': 'Predict from mtcars',
        'Imbalanced 1:9': 'Lots of negatives, few positives',
        'Sklearn breast cancer': 'Cancer screening dataset',
        'Near-random': 'Barely better than coin flip',
        'Custom paste': 'Paste my own labels and scores',
    },
    'survival-power-calculator': {
        'Cancer trial': 'Cancer trial, expected hazard',
        'Rare event': 'Few events expected',
        'Oncology dropout': 'Trial with patient dropout',
        'Long follow-up': 'Multi-year follow-up',
        'Balanced 1:1': 'Equal-sized treatment groups',
        '2:1 allocation': 'Twice as many on treatment',
    },
    't-test-calculator': {
        'IQ vs &mu;&#8320; = 100': "Is my group's average different from 100?",
        'Treatment vs control': 'Did the treatment work?',
        'Pre / post (paired)': 'Same people, before vs after',
        'Small n with outlier': 'Few subjects, one outlier',
        'Imbalanced groups': 'Group sizes very different',
        'Custom': 'Use my own data',
    },
    'ts-stationarity-calculator': {
        'AR(1) stationary': 'Stationary autoregressive series',
        'Random walk': 'Random walk, drifting',
        'Trend-stationary': 'Trending but otherwise stable',
        'Seasonal monthly': 'Monthly seasonal pattern',
        'ARMA(1,1)': 'Mixed AR and MA terms',
        'Custom': 'Test my own series',
    },
    'type-i-ii-error-visualizer': {
        'Underpowered': 'Test too small to detect effect',
        'Conventional': 'Standard 80% power, alpha 0.05',
        'Tight test': 'Strict alpha, low Type I',
        'Balanced': 'Balanced Type I vs II',
        'Tiny effect': 'Trying to detect a tiny effect',
        'Custom': 'Plug in my own values',
    },
    'vif-interpreter': {
        'Clean predictors': 'No multicollinearity',
        'Borderline VIF~5': 'Borderline collinearity',
        'Problematic VIF&gt;10': 'Severe multicollinearity',
        'Correlation matrix': 'Spot collinearity in correlations',
        'GVIF / factor': 'Categorical predictor (GVIF)',
    },
    'z-score-percentile': {
        'SAT score': 'Where does an SAT score rank?',
        'IQ 130': 'Top how-many percent at IQ 130?',
        'z critical 95% CI': 'Critical z for a 95% interval',
        'Area between &plusmn;1 SD': 'What % falls within 1 SD?',
        'Two-tailed |z|=3': 'Probability beyond +/-3 SD',
        'Custom': 'Use my own value',
    },
}


def main():
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    total_replacements = 0
    total_files = 0
    for slug, mapping in REWRITES.items():
        p = os.path.join(repo_root, 'tools', f'{slug}.html')
        if not os.path.exists(p):
            print(f'WARN: {p} not found')
            continue
        with open(p, encoding='utf-8') as f:
            s = f.read()
        orig = s
        rep = 0
        for old, new in mapping.items():
            token_old = f'<span class="scenario-name">{old}</span>'
            token_new = f'<span class="scenario-name">{new}</span>'
            if token_old in s:
                s = s.replace(token_old, token_new, 1)
                rep += 1
        if s != orig:
            with open(p, 'w', encoding='utf-8') as f:
                f.write(s)
            total_files += 1
            total_replacements += rep
    print(f'Rewrote {total_replacements} scenario labels across {total_files} tool files')

    # Equivalence-noninferiority uses template literal SCENARIOS[k].name
    p = os.path.join(repo_root, 'tools', 'equivalence-noninferiority-calculator.html')
    with open(p, encoding='utf-8') as f:
        s = f.read()
    eq_rewrites = {
        "name: 'Plan TOST means'":           "name: 'Plan equivalence test'",
        "name: 'Plan NI two-prop'":          "name: 'Plan non-inferiority'",
        "name: 'Plan TOST proportions'":     "name: 'Plan TOST for proportions'",
        "name: 'Analyze TOST means'":        "name: 'Did my means stay equivalent?'",
        "name: 'Analyze TOST proportions'":  "name: 'Did my proportions stay equivalent?'",
        "name: 'Custom'":                    "name: 'Use my own numbers'",
    }
    rep = 0
    for old, new in eq_rewrites.items():
        if old in s:
            s = s.replace(old, new, 1)
            rep += 1
    if rep:
        with open(p, 'w', encoding='utf-8') as f:
            f.write(s)
    print(f'Equivalence-noninferiority: {rep} JS scenario name fields rewritten')


if __name__ == '__main__':
    main()
