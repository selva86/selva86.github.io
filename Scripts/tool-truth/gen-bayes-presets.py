# -*- coding: utf-8 -*-
"""Build tools/lib/bayes-output-presets.js from the two truth tables, and re-pin
the page's ?v= content hashes.

Every preset string is REAL console output. Nothing here is hand-typed:

  * the five rstanarm presets come from Scripts/tool-truth/bayesian-output-interpreter.json,
    written by bayesian-output-interpreter.R, which fitted the models on this box;
  * the brms preset comes from Scripts/tool-truth/brms-preset.json, lifted verbatim
    from the official brms documentation by gen-brms-preset.py (brms cannot be fitted
    here - no C++ toolchain).

Run: python Scripts/tool-truth/gen-bayes-presets.py
"""
import hashlib
import io
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
TRUTH = os.path.join(HERE, 'bayesian-output-interpreter.json')
BRMS = os.path.join(HERE, 'brms-preset.json')
OUT = os.path.join(ROOT, 'tools', 'lib', 'bayes-output-presets.js')
MATH = os.path.join(ROOT, 'tools', 'lib', 'bayes-output-math.js')
UI = os.path.join(ROOT, 'tools', 'lib', 'bayesian-output-interpreter-ui.js')
PAGE = os.path.join(ROOT, 'tools', 'bayesian-output-interpreter.html')

# chip order on the page
ORDER = ['gauss', 'logit', 'mlm', 'brms', 'weak', 'diverge']


def h8(p):
    return hashlib.md5(io.open(p, 'rb').read()).hexdigest()[:8]


def main():
    truth = json.load(io.open(TRUTH, encoding='utf-8'))
    brms = json.load(io.open(BRMS, encoding='utf-8'))

    presets = {}
    for key, pre in truth['presets'].items():
        presets[key] = {
            'engine': 'rstanarm',
            'label': pre['label'],
            'blurb': pre['blurb'],
            'r': pre['r_call'],
            'text': pre['summary_text'],
        }
    bp = brms['preset']
    presets['brms'] = {
        'engine': 'brms',
        'label': bp['label'],
        'blurb': bp['blurb'],
        'r': bp['r_call'],
        'text': bp['summary_text'],
        'provenance': brms['meta']['provenance'],
    }

    # ---- sanity: these must actually look like what they claim to be
    for k in ORDER:
        assert k in presets, 'missing preset %s' % k
        t = presets[k]['text']
        if presets[k]['engine'] == 'rstanarm':
            assert 'Model Info:' in t, '%s: not rstanarm output' % k
            assert 'Estimates:' in t, '%s: no Estimates block' % k
            assert 'MCMC diagnostics' in t, '%s: no MCMC diagnostics block' % k
        else:
            assert 'Family:' in t, '%s: not brms output' % k
            assert 'Bulk_ESS' in t and 'Tail_ESS' in t, '%s: no ESS columns' % k
            assert '#>' not in t, '%s: knitr prefix leaked in' % k
    assert 'divergent transitions' in presets['diverge']['text'], 'diverge preset lost its warnings'
    assert 'Markov chains did not converge' in presets['weak']['text'], 'weak preset lost its warnings'
    assert len(set(ORDER)) == len(ORDER)
    for k in presets:
        assert k in ORDER, 'preset %s is not in ORDER' % k

    meta = {
        'r_version': truth['meta']['r_version'],
        'rstanarm_version': truth['meta']['rstanarm_version'],
        'rstan_version': truth['meta']['rstan_version'],
        'print_digits': truth['meta']['print_digits'],
        'brms_source_url': brms['meta']['source_url'],
    }

    body = json.dumps(
        {'order': ORDER, 'meta': meta, 'presets': presets},
        indent=2, ensure_ascii=True, sort_keys=True)

    header = (
        '/* bayes-output-presets.js - GENERATED, do not hand-edit.\n'
        '   Regenerate: python Scripts/tool-truth/gen-bayes-presets.py\n'
        '\n'
        '   Every "text" below is REAL console output, never hand-typed.\n'
        '\n'
        '   The five rstanarm presets are the verbatim output of\n'
        '   print(summary(fit), digits = %d) on models fitted by\n'
        '   Scripts/tool-truth/bayesian-output-interpreter.R with\n'
        '   %s / rstanarm %s / rstan %s.\n'
        '\n'
        '   The brms preset could not be fitted here: brms compiles every model with a\n'
        '   C++ toolchain and no Rtools is installed on the build box. It is therefore\n'
        '   quoted verbatim from the official brms documentation at\n'
        '   %s (knitr\'s "#> " prefix stripped,\n'
        '   nothing else changed) rather than invented. The page says so too. */\n'
        % (meta['print_digits'], meta['r_version'], meta['rstanarm_version'],
           meta['rstan_version'], meta['brms_source_url'])
    )

    js = (header +
          '(function (root, factory) {\n'
          "  if (typeof module === 'object' && module.exports) { module.exports = factory(); }\n"
          '  else { root.BayesPresets = factory(); }\n'
          "}(typeof self !== 'undefined' ? self : this, function () {\n"
          "  'use strict';\n"
          '  return ' + body + ';\n'
          '}));\n')

    with io.open(OUT, 'w', encoding='utf-8', newline='\n') as f:
        f.write(js)
    print('wrote %s (%d bytes)' % (OUT, len(js.encode('utf-8'))))

    # ---- round-trip: what we wrote must read back byte-identical
    sys.path.insert(0, HERE)
    written = io.open(OUT, encoding='utf-8').read()
    m = re.search(r'return (\{.*\});\n\}\)\);', written, re.S)
    assert m, 'could not read the payload back'
    back = json.loads(m.group(1))
    for k in ORDER:
        assert back['presets'][k]['text'] == presets[k]['text'], 'round-trip mismatch on %s' % k
    print('round-trip: all %d presets identical' % len(ORDER))

    # ---- pin the page
    if not os.path.exists(PAGE):
        print('page not written yet; skipping pin step')
        return 0
    pins = {
        'PIN_BAYES_MATH': h8(MATH),
        'PIN_BAYES_PRESETS': h8(OUT),
        'PIN_BAYES_UI': h8(UI),
    }
    page = io.open(PAGE, encoding='utf-8').read()
    for token, val in pins.items():
        page = page.replace(token, val)
    # idempotent re-pin on later rebuilds
    page = re.sub(r'(bayes-output-math\.js\?v=)[a-f0-9]{8}', r'\g<1>' + pins['PIN_BAYES_MATH'], page)
    page = re.sub(r'(bayes-output-presets\.js\?v=)[a-f0-9]{8}', r'\g<1>' + pins['PIN_BAYES_PRESETS'], page)
    page = re.sub(r'(bayesian-output-interpreter-ui\.js\?v=)[a-f0-9]{8}', r'\g<1>' + pins['PIN_BAYES_UI'], page)
    with io.open(PAGE, 'w', encoding='utf-8', newline='\n') as f:
        f.write(page)
    print('pins: math=%s presets=%s ui=%s'
          % (pins['PIN_BAYES_MATH'], pins['PIN_BAYES_PRESETS'], pins['PIN_BAYES_UI']))

    nm = os.path.join(ROOT, 'tools', 'lib', 'normal-math.js')
    print('normal-math md5 (must stay 8f6fd067 so other tools keep their pin): %s' % h8(nm))
    return 0


if __name__ == '__main__':
    sys.exit(main())
