"""Assemble tools/coxph-output-interpreter.html.

Keeps the lib ?v= pins honest by hashing the files at build time, and keeps the
FAQ prose in one place so the visible accordion and the FAQPage JSON-LD cannot
drift apart. Run from the repo root:

  python Scripts/tool-truth/gen-coxph-page.py
"""
import hashlib
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(ROOT)

CSS = open('Scripts/tool-truth/coxph-page.css', encoding='utf-8').read()

LIBS = ['normal-math.js', 'ttest-math.js', 'dist-tables-math.js', 'cox-math.js',
        'coxph-presets.js', 'coxph-output-interpreter-ui.js']


def pin(name):
    with open(os.path.join('tools', 'lib', name), 'rb') as f:
        return hashlib.md5(f.read()).hexdigest()[:8]


PINS = {name: pin(name) for name in LIBS}

TITLE = "Free coxph Output Interpreter: Read a Cox Model"
# the audit gate wants 50-170 characters
DESC = ("Paste a survival::coxph summary and get every number decoded: hazard ratios "
        "in plain English, what an interval crossing 1 means, concordance, and the "
        "three global tests.")
OGDESC = ("Paste a Cox proportional hazards summary and get a labelled anatomy of every block, "
          "each hazard ratio read as a sentence about two patients, the concordance in words, "
          "and the proportional-hazards check R never runs for you.")

FAQ = [
    ("What is the hazard ratio in a Cox model?",
     "It is exp(coef), and nothing more. The coefficient is on the log-hazard scale, so exponentiating it gives the factor by which the hazard is multiplied for a one-unit increase in that covariate, holding every other term in the model fixed. A hazard ratio of 1.7 means 70 percent more risk of the event at any given instant; 0.59 means 41 percent less. The hazard is an instantaneous rate rather than a probability, so a hazard ratio of 2 does not mean twice as many deaths by the end of the study."),
    ("What does it mean when the confidence interval includes 1?",
     "A hazard ratio of 1 is the value that means no effect: the hazard is multiplied by one, so nothing changes. If the interval includes 1, the data are consistent with no effect at all, and usually with effects in both directions too. That is not evidence the covariate does nothing. It means this study, with this many events, cannot separate it from nothing. A wide interval around 1 and a narrow interval around 1 are very different findings even though both cross the line."),
    ("What is concordance in a Cox model?",
     "It is the c-statistic: take any two patients whose survival times can be ordered, and concordance is the proportion of those pairs the model ranks correctly. 0.5 is a coin flip, 1.0 is perfect. It is the closest thing a Cox model has to an accuracy score, and it answers a different question from the p-values. A model can be full of tiny p-values and still rank patients barely better than chance, which is worth knowing before anyone uses it to make decisions about people."),
    ("Why does coxph print three global tests, and which one do I report?",
     "The likelihood ratio, Wald and score tests all ask the same question: is this model better than one with no covariates at all? They are asymptotically equivalent, meaning they agree in large samples, which is why they usually land in the same place. Report the likelihood ratio test. It has the best small-sample behaviour of the three and is the one most reviewers expect."),
    ("What if the three global tests disagree?",
     "First check whether they disagree on the conclusion or merely on the statistic. Statistics of 210, 223 and 279 look far apart but all give p below 1e-44, so they agree completely and there is nothing to resolve. A real split, where one is significant and another is not, points at a small number of events, a covariate on a wildly different scale from the others, or near-separation where one group has almost no events. Trust the likelihood ratio test and investigate why the others drifted. If the model used a robust or clustered variance, a gap is expected: the Wald test uses the robust standard errors and the other two do not, which is what the note R prints underneath is telling you."),
    ("What is the proportional hazards assumption?",
     "It is the assumption that each hazard ratio is constant for the whole follow-up: the same number on day one and on the last day. Nothing in the printed summary tests it. The coefficients, p-values, concordance and global tests all look identical whether it holds or not. Check it with cox.zph(model), which correlates scaled Schoenfeld residuals with time, and read plot(cox.zph(model)) alongside the p-value. If it is violated, stratify the offending covariate with strata() when you do not need its hazard ratio, or fit a time-varying coefficient with tt() when you do."),
    ("Why is the confidence interval not symmetric around the hazard ratio?",
     "Because the interval is built on the log-hazard scale and then exponentiated. R computes coef plus or minus 1.96 times the standard error, which is symmetric around the coefficient, and then takes exp of both ends. Exponentiating stretches the upper end and compresses the lower one, so the interval is symmetric in log space and asymmetric in hazard-ratio space. That is correct and expected; an interval that looked symmetric around the hazard ratio would be the suspicious one."),
    ("What is exp(-coef) in the output?",
     "It is the reciprocal of the hazard ratio, and it exists purely to save you the arithmetic of reading the effect in the other direction. If exp(coef) is 0.588 for sex, then exp(-coef) is 1.701: the reference group carries 1.7 times the hazard of the comparison group. It is the same finding stated the other way round, not a second result."),
    ("Why does n not match my dataset?",
     "Because coxph drops any row with a missing value on any variable in the model, and it says so in the line under the counts: for example, 14 observations deleted due to missingness. The n reported is what was actually fitted. Note also that the number governing your standard errors is the event count, not n. A study with 1000 subjects and 12 events has roughly as much information about a coefficient as a study with 20 subjects and 12 events."),
]

LD_APP = {
    "@context": "https://schema.org", "@type": "WebApplication",
    "name": "coxph Output Interpreter",
    "url": "https://r-statistics.co/tools/coxph-output-interpreter.html",
    "applicationCategory": "EducationalApplication", "operatingSystem": "Any",
    "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"},
    "description": "Free Cox proportional hazards output interpreter: paste summary(coxph) and get a labelled anatomy of every block, hazard ratios read in plain English, the concordance explained, the three global tests reconciled, and the proportional-hazards check.",
    "publisher": {"@type": "Organization", "name": "r-statistics.co", "url": "https://r-statistics.co/"}
}

LD_FAQ = {
    "@context": "https://schema.org", "@type": "FAQPage",
    "mainEntity": [{"@type": "Question", "name": q,
                    "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in FAQ]
}

faq_html = '\n'.join('<details><summary>%s</summary><p>%s</p></details>' % (q, a)
                     for q, a in FAQ)

scripts = '\n'.join('<script src="/tools/lib/%s?v=%s"></script>' % (n, PINS[n]) for n in LIBS)

PLACEHOLDER = ("Call:&#10;coxph(formula = Surv(time, status) ~ sex, data = lung)&#10;&#10;"
               "  n= 228, number of events= 165 &#10;&#10;"
               "       coef exp(coef) se(coef)      z Pr(&gt;|z|)&#10;"
               "sex -0.5310    0.5880   0.1672 -3.176  0.00149")

HTML = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>__TITLE__</title>
<meta name="description" content="__DESC__">
<meta name="Author" content="Selva Prabhakaran">
<meta name="Robots" content="index, follow">
<link rel="canonical" href="https://r-statistics.co/tools/coxph-output-interpreter.html">
<link rel="icon" href="/screenshots/iconb-64.png?v=2" type="image/x-icon">
<meta property="og:title" content="__TITLE__">
<meta property="og:description" content="__OGDESC__">
<meta property="og:type" content="website">
<meta property="og:url" content="https://r-statistics.co/tools/coxph-output-interpreter.html">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Inter+Tight:wght@600;700;800&display=swap" rel="stylesheet">
<script type="application/ld+json">
__LDAPP__
</script>
<script type="application/ld+json">
__LDFAQ__
</script>
<link rel="stylesheet" href="/css/main.min.css?h=a2bb70ae">
<style>
__CSS__
</style>
</head>
<body>

<section class="hero">
<span class="crumb"><a href="/">Home</a> / <a href="/tools/">Tools</a> / coxph Output Interpreter</span>
<h1>coxph() Output Interpreter</h1>
<p class="dek">A Cox model prints four blocks, and the one everybody reads is the one that answers the smallest question. Paste the output of <code>summary(model)</code> from <b>survival::coxph()</b> and this labels every region, turns each <b>hazard ratio</b> into a sentence about two patients, says what an interval crossing 1 does and does not prove, and points at the assumption the printout never checks.</p>

<div class="modes" role="tablist" aria-label="What to read">
<button class="mode on" data-mode="anatomy" role="tab">Anatomy of the output</button>
<button class="mode"    data-mode="hazard"  role="tab">Hazard ratios</button>
<button class="mode"    data-mode="fit"     role="tab">Fit and global tests</button>
<button class="mode"    data-mode="ph"      role="tab">Proportional hazards</button>
</div>

<p class="iwant" id="iwant">I want to
<select class="psel" id="psel" aria-label="What do you want to do">
<option value="anatomy">understand what every block of this output is</option>
<option value="hazard">read the hazard ratios in plain English</option>
<option value="fit">judge how well the model fits</option>
<option value="ph">check the proportional hazards assumption</option>
</select>
</p>

<div class="scen" aria-label="Worked examples">
<span class="sl">Try a real coxph summary:</span>
<button class="chip" data-scen="sex">sex only</button>
<button class="chip" data-scen="multi">age + sex + ph.ecog</button>
<button class="chip" data-scen="factor">a factor and four terms</button>
</div>
</section>

<div class="grid">

<section class="card" aria-label="Your model output">
<div class="group">
<div class="glabel"><span>Paste summary(model) here</span><button class="gclear" id="clearbtn" type="button">Clear</button></div>
<label class="sr-only" for="paste" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">Paste the summary output of your coxph model</label>
<textarea class="pastebox" id="paste" spellcheck="false" autocapitalize="off" autocorrect="off" placeholder="__PLACEHOLDER__"></textarea>
</div>
<p class="hint" id="hint">Copy the whole summary, the Call line through the last test. Keep the spacing as R printed it.</p>
<div class="ierr" id="ierr"></div>
</section>

<section class="card" aria-live="polite" aria-label="Reading">
<div class="res">
<span class="vchip" id="vchip">Waiting for a paste</span>
<h2 id="vhead">Paste a coxph summary to decode it</h2>
<p class="vs" id="vsub">Or load one of the three real model summaries above.</p>
</div>

<div class="stats" id="statgrid" hidden>
<div class="st"><div class="k" id="k1">Events</div><div class="v acc" id="v1">-</div></div>
<div class="st"><div class="k" id="k2">Concordance</div><div class="v" id="v2">-</div></div>
<div class="st"><div class="k" id="k3">Largest HR</div><div class="v" id="v3">-</div></div>
<div class="st"><div class="k" id="k4">Events per covariate</div><div class="v" id="v4">-</div></div>
</div>

<div id="body"></div>

<div class="warn" id="warn" hidden></div>
<p class="plain" id="plain" hidden></p>
<p class="infline" id="inference-line" hidden></p>
<div class="copyrow" id="copyrow" hidden>
<span class="report" id="report"></span>
<button class="copy" id="copybtn">Copy verdict</button>
</div>
</section>
</div>

<details class="how" id="how">
<summary>How this is computed</summary>
<div class="step"><span class="n">1</span><span id="h1c">Paste a coxph summary and this fills in with your model's own numbers.</span></div>
<div class="step"><span class="n">2</span><span id="h2c"></span></div>
<div class="step"><span class="n">3</span><span id="h3c"></span></div>
<div class="step"><span class="n">4</span><span id="h4c"></span></div>
</details>

<div class="rcode">
<div class="rhd"><b>The same reading, from the model object in R</b><button id="rcopy">Copy code</button></div>
<pre id="rcodepre"></pre>
</div>

<p class="trust">
<span><span class="tick">&#10003;</span> Nothing you paste leaves your browser</span>
<span><span class="tick">&#10003;</span> Parsing and arithmetic verified against R's <code style="font-family:ui-monospace,Consolas,monospace;font-size:12.5px">survival::coxph()</code> over 16 real fits</span>
<span><span class="tick">&#10003;</span> Free, no sign-up</span>
</p>

<section class="sect">
<h2>The block everyone reads, and the block worth reading</h2>
<p class="sl">The coefficient table answers "is it significant". The interval table answers "how big is it, and how sure are we". Only one of those is a finding.</p>
<p>A Cox model does something clever: it never models the baseline hazard at all. It refuses to say how likely the event is at any particular time, and only ever says how much <i>more or less</i> likely it is for one patient than another. That refusal is why the model works on almost any survival data without you having to claim the events follow a Weibull or an exponential curve, and it is why every number it gives you is a <b>ratio</b> rather than a risk.</p>
<p>So the coefficient is on the log-hazard scale, which nobody has intuition for, and <code>exp(coef)</code> puts it back on the ratio scale, which everybody does. That single exponential is the whole trick. A <code>coef</code> of -0.5310 is meaningless on sight; <code>exp(-0.5310) = 0.588</code> says the hazard is cut by 41 percent, and that is a sentence a clinician can act on.</p>
<p>The p-value in the coefficient table is a <b>Wald</b> test: it asks whether the coefficient is distinguishable from zero, which after exponentiating is the same as asking whether the hazard ratio is distinguishable from 1. It is the least informative number in the block. It tells you nothing about size, nothing about direction beyond the sign you can already see, and nothing about whether the model is any good. The interval tells you all three.</p>
</section>

<section class="sect">
<h2>What a hazard ratio is not</h2>
<p class="sl">The hazard is an instantaneous rate. It is not a probability, and the ratio is not a risk ratio.</p>
<p>A hazard ratio of 2 does not mean twice as many patients die. It does not mean anyone dies twice as fast, and it does not mean survival time is halved. It means that at any instant, among patients who have made it that far, the rate at which the event arrives is doubled. Over a whole study a hazard ratio of 2 typically produces far less than twice the deaths, because both groups' survival curves bend and the pool of patients still at risk shrinks differently in each.</p>
<p>This matters most when someone asks the obvious follow-up: so how much longer do they live? The Cox model does not answer that, on purpose. It never modelled the baseline hazard, so it has no absolute times to give you. If the question is about time or absolute risk rather than relative rate, you need <code>survfit(model, newdata = ...)</code>, which combines the hazard ratios with an estimated baseline to produce actual survival curves for actual patients. The hazard ratio is the model's finding; the survival curve is what a patient would want to be told.</p>
<p>One more trap: a hazard ratio is only interpretable <b>relative to the other terms in the model</b>. It is the effect of that covariate among patients alike on everything else the model knows about. Add a covariate and every other hazard ratio can move. That is not instability, it is the definition.</p>
</section>

<section class="sect">
<h2>The assumption in the name</h2>
<p class="sl">Cox proportional hazards. The second half of that name is a claim, and the printout never checks it.</p>
<p>Every hazard ratio in the output is a single number applied to the entire follow-up. The model asserts that the effect on day 1 equals the effect on the last day. That is a strong claim about the world, and a great many real effects break it. Surgery raises the hazard sharply for a fortnight and lowers it afterwards. A drug works for a year and then stops. Two survival curves cross, which is the clearest violation there is, and the model responds by reporting an average hazard ratio near 1, hiding a large effect in each direction.</p>
<p>Nothing above tells you which case you are in. The check lives in a separate function:</p>
<div class="tscroll"><table>
<tr><th>Step</th><th>Command</th><th>What it tells you</th></tr>
<tr><td>Test</td><td><code>cox.zph(model)</code></td><td>One row per covariate plus GLOBAL. A small p means that covariate's effect moves over time</td></tr>
<tr><td>Look</td><td><code>plot(cox.zph(model))</code></td><td>A flat line means proportional. A drift or a crossing shows you the shape of the violation</td></tr>
<tr><td>Stratify</td><td><code>strata(x)</code></td><td>Lets each level have its own baseline hazard. Use when you do not need x's hazard ratio</td></tr>
<tr><td>Time-vary</td><td><code>tt(x)</code></td><td>Lets the coefficient change with time. Use when you do need x's effect</td></tr>
</table></div>
<p>Like any hypothesis test, <code>cox.zph()</code> has power that scales with your event count. Few events and it misses real violations; tens of thousands and it flags violations too small to matter. Read the plot next to the p-value, not instead of it.</p>
</section>

<section class="sect">
<h2>Concordance, and why it is the number to quote</h2>
<p class="sl">A model can be built entirely of significant coefficients and still be useless at ranking patients.</p>
<p>Concordance takes every pair of patients whose survival can be ordered and asks how often the model gets the order right. That is a question about usefulness rather than about statistical detectability, and the two come apart constantly. With enough events, a covariate that shifts the hazard by 3 percent will have a tiny p-value and change nobody's prognosis. The p-value scales with sample size; concordance does not.</p>
<p>Read it like this: 0.5 is a coin flip, because a coin flip gets half of all orderings right. 0.6 is weak but real. 0.7 is a genuinely useful model. Anything above 0.9 on real survival data is rare enough that the first thing to check is whether a covariate is leaking information about the outcome, such as a treatment given only to patients already known to be dying.</p>
</section>

<section class="sect">
<h2>Common questions</h2>
<div class="faq">
__FAQ__
</div>
</section>

<section class="sect">
<h2>Go deeper</h2>
<p class="sl">The survival material on this site, in the order that makes sense after this page.</p>
<div class="tscroll"><table>
<tr><th>Page</th><th>Why next</th></tr>
<tr><td><a href="/Cox-Proportional-Hazards.html">Cox proportional hazards</a></td><td>The model behind this output, built up from the partial likelihood</td></tr>
<tr><td><a href="/Checking-Proportional-Hazards.html">Checking proportional hazards</a></td><td>cox.zph, Schoenfeld residuals, and what to do when the assumption fails</td></tr>
<tr><td><a href="/Kaplan-Meier-and-the-Log-Rank-Test.html">Kaplan-Meier and the log-rank test</a></td><td>The survival curve a hazard ratio is relative to</td></tr>
<tr><td><a href="/R-Survival-Analysis-Course.html">Survival analysis course</a></td><td>Censoring and survival data from the start, in order</td></tr>
<tr><td><a href="/Survival-Analysis-Exercises-in-R.html">Survival analysis exercises</a></td><td>18 practice problems on real datasets</td></tr>
<tr><td><a href="/tools/survival-power-calculator.html">Survival power calculator</a></td><td>How many events a hazard ratio of this size needs before a study can see it</td></tr>
<tr><td><a href="/tools/lm-output-interpreter.html">lm() output interpreter</a></td><td>The same treatment for a linear model summary</td></tr>
<tr><td><a href="/tools/glm-output-interpreter.html">glm() output interpreter</a></td><td>Odds ratios, the other coefficient people exponentiate</td></tr>
</table></div>
</section>

__SCRIPTS__
<script>
/* GA wiring: tool_use fires once on first input, tool_copy on each copy.
   Kept inline so the events are visible in the served HTML. */
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
</script>
</body>
</html>
"""

out = (HTML
       .replace('__TITLE__', TITLE)
       .replace('__DESC__', DESC)
       .replace('__OGDESC__', OGDESC)
       .replace('__LDAPP__', json.dumps(LD_APP, ensure_ascii=False))
       .replace('__LDFAQ__', json.dumps(LD_FAQ, ensure_ascii=False))
       .replace('__CSS__', CSS)
       .replace('__FAQ__', faq_html)
       .replace('__PLACEHOLDER__', PLACEHOLDER)
       .replace('__SCRIPTS__', scripts))

assert '—' not in out, 'em dash found'
assert 'JetBrains' not in out, 'JetBrains Mono reference found'
assert 'eyebrow' not in out, 'eyebrow kicker found'

with open('tools/coxph-output-interpreter.html', 'w', encoding='utf-8', newline='\n') as f:
    f.write(out)

print('wrote tools/coxph-output-interpreter.html  %d bytes' % len(out))
print('title %dch | meta desc %dch' % (len(TITLE), len(DESC)))
for k, v in PINS.items():
    print('  pin %-36s %s' % (k, v))
