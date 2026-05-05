"""Inject a "What just happened" intro line above each tool's Inference banner.

The intro is a one-sentence preface that explains in plain language what
the tool just computed, bridging the gap between the input form and the
verdict prose in the inference banner. Lives at .method-intro, styled
in main.css as small italic muted text.
"""
import os, re

INTROS = {
    'ab-test-calculator': "We compared your two groups using a two-proportion z-test (frequentist) and a beta-binomial Bayesian model (probability that B is better) side by side.",
    'anova-output-interpreter': "We're reading your aov() output and checking which group differences are large enough to take seriously.",
    'bayes-factor-calculator': "We computed how strongly your data favor the alternative hypothesis over the null, expressed on the Jeffreys evidence scale.",
    'bayes-theorem-calculator': "We applied Bayes' theorem to update the probability of the condition given a positive test, using your prior, sensitivity, and specificity.",
    'bootstrap-ci-calculator': "We resampled your data thousands of times to estimate how much your statistic could plausibly vary across studies.",
    'chi-square-calculator': "We checked whether your observed counts deviate from what independence (or your expected proportions) would predict.",
    'confidence-interval-calculator': "We computed the range of plausible values for your statistic at your chosen confidence level.",
    'confusion-matrix-interpreter': "We tallied your classifier's predictions against the ground truth and computed the standard performance metrics.",
    'dag-confounder-picker': "We applied d-separation rules to your causal diagram to find the minimal sufficient adjustment set.",
    'diagnostic-plot-interpreter': "We're reading the four standard regression diagnostic plots to flag assumption violations like non-linearity, heteroscedasticity, or influential points.",
    'effect-size-converter': "We converted between effect-size measures using the standard mathematical relationships, accounting for sample size where it matters.",
    'equivalence-noninferiority-calculator': "We ran two one-sided tests (TOST) to check whether your difference falls within the equivalence margin you set.",
    'glm-output-interpreter': "We're reading your generalized linear model output and translating each coefficient back to the original outcome scale.",
    'lm-output-interpreter': "We're reading your linear model output and translating each coefficient into plain English.",
    'multiple-testing-correction': "We adjusted your p-values to control either the family-wise error rate (Bonferroni / Holm) or the false discovery rate (Benjamini-Hochberg).",
    'nonparametric-test-picker': "We ran the rank-based equivalent of the test you needed, since your data don't meet parametric assumptions.",
    'normality-test-picker': "We ran multiple normality tests (Shapiro-Wilk, Anderson-Darling, Kolmogorov-Smirnov) and combined them with visual checks to diagnose your distribution.",
    'outlier-detection-calculator': "We applied multiple outlier-detection rules (Tukey IQR, Grubbs, Hampel, Z-score) and showed which values each one flags.",
    'power-analysis': "We computed the sample size you need to detect your specified effect at the requested power and significance level.",
    'reprex-builder': "We packaged your code into a runnable, self-contained example ready to paste into Stack Overflow or GitHub.",
    'roc-auc-calculator': "We swept the threshold across all values to compute sensitivity and specificity at every cutoff, summarized as the area under the ROC curve.",
    'survival-power-calculator': "We computed the events and total sample size you need under proportional hazards to detect your hazard ratio.",
    't-test-calculator': "We compared your group means using a t-test, accounting for sample size and (optionally) unequal variance.",
    'ts-stationarity-calculator': "We ran ADF and KPSS unit-root tests on your series to determine whether differencing is needed before you fit ARIMA.",
    'type-i-ii-error-visualizer': "We plotted the null and alternative distributions and shaded the regions where Type I (false positive) and Type II (false negative) errors occur.",
    'vif-interpreter': "We computed Variance Inflation Factors for each predictor to flag multicollinearity in your regression model.",
    'z-score-percentile': "We converted your value to a z-score and percentile under the standard normal distribution.",
}


def main():
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    patched = 0
    for slug, intro in INTROS.items():
        p = os.path.join(repo_root, 'tools', f'{slug}.html')
        if not os.path.exists(p):
            print(f'WARN: {p} not found')
            continue
        with open(p, encoding='utf-8') as f:
            s = f.read()
        if 'class="method-intro"' in s:
            # Already injected — refresh the text inside
            s = re.sub(
                r'<p class="method-intro"[^>]*>[^<]*</p>',
                f'<p class="method-intro" id="method-intro">{intro}</p>',
                s, count=1
            )
        else:
            # Insert between section-eyebrow "Inference" and inference-banner
            old = '<div class="section-eyebrow">Inference</div>\n    <p class="inference-banner"'
            new = (
                f'<div class="section-eyebrow">Inference</div>\n'
                f'    <p class="method-intro" id="method-intro">{intro}</p>\n'
                f'    <p class="inference-banner"'
            )
            if old not in s:
                # Try alternative whitespace
                old2 = '<div class="section-eyebrow">Inference</div>'
                if old2 in s:
                    s = s.replace(
                        old2,
                        f'{old2}\n    <p class="method-intro" id="method-intro">{intro}</p>',
                        1
                    )
                else:
                    print(f'WARN {slug}: inference-section markup not matched')
                    continue
            else:
                s = s.replace(old, new, 1)
        with open(p, 'w', encoding='utf-8') as f:
            f.write(s)
        patched += 1
    print(f'Injected/refreshed method-intro on {patched}/27 tools')


if __name__ == '__main__':
    main()
