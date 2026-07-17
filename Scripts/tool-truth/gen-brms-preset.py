# -*- coding: utf-8 -*-
"""Extract the brms summary() preset VERBATIM from the official brms docs.

No working C++ toolchain exists on this build box, so brms cannot compile a
Stan model locally and we cannot fit one ourselves. Rather than hand-type a
plausible-looking brms summary (which would be fabrication), this script
lifts the printed output straight out of Paul Buerkner's own brms
documentation site and strips knitr's "#> " comment prefix, which is the only
edit made to it.

Source: https://paulbuerkner.com/brms/  (the brms package homepage / README,
maintained by the package author). The model shown there is:

    fit1 <- brm(count ~ zAge + zBase * Trt + (1|patient),
                data = epilepsy, family = poisson())

Out: Scripts/tool-truth/brms-preset.json

Re-run to confirm the upstream text still matches what we ship:
    python Scripts/tool-truth/gen-brms-preset.py
"""
import io
import json
import os
import re
import sys

try:
    from urllib.request import urlopen, Request
except ImportError:  # pragma: no cover
    from urllib2 import urlopen, Request  # type: ignore

try:
    import html as _html

    def unescape(s):
        return _html.unescape(s)
except Exception:  # pragma: no cover
    import HTMLParser

    def unescape(s):
        return HTMLParser.HTMLParser().unescape(s)

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'brms-preset.json')
URL = 'https://paulbuerkner.com/brms/'
R_CALL = ('library(brms)\n'
          'fit1 <- brm(count ~ zAge + zBase * Trt + (1|patient),\n'
          '            data = epilepsy, family = poisson())\n'
          'summary(fit1)')


def fetch(url):
    req = Request(url, headers={'User-Agent': 'r-statistics.co tool-truth builder'})
    return urlopen(req, timeout=60).read().decode('utf-8', 'replace')


def extract_summary(src):
    """Pull the <pre> block holding summary(fit1) and undo knitr's prefix."""
    blocks = re.findall(r'<pre[^>]*>(.*?)</pre>', src, re.S)
    for raw in blocks:
        txt = unescape(re.sub(r'<[^>]+>', '', raw))
        if 'Population-Level Effects' not in txt or 'Bulk_ESS' not in txt:
            continue
        lines = txt.split('\n')
        out = []
        for ln in lines:
            if ln.strip() in ('summary(fit1)', ''):
                # drop the echoed call and any blank framing before the output
                if not out:
                    continue
            if ln.startswith('#> '):
                out.append(ln[3:])
            elif ln.startswith('#>'):
                out.append(ln[2:])
            elif out:
                # a non-output line after output started ends the block
                break
        # trim trailing blank lines, keep interior ones (they separate blocks)
        while out and not out[-1].strip():
            out.pop()
        while out and not out[0].strip():
            out.pop(0)
        return '\n'.join(out).rstrip()
    return None


# --- an INDEPENDENT parser, so the JS parser has something to be checked ----
NUM = re.compile(r'^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$')


def peel(line):
    toks = line.strip().split()
    nums = []
    while toks and NUM.match(toks[-1]):
        nums.insert(0, toks.pop())
    return ' '.join(toks), [float(n) for n in nums]


def parse_brms(text):
    """Read the brms summary the way a reader would, for the truth table."""
    lines = text.split('\n')
    out = {'groups': [], 'population': [], 'family_specific': []}
    for ln in lines:
        m = re.match(r'^\s*Family:\s*(\S+)', ln)
        if m:
            out['family'] = m.group(1)
        m = re.match(r'^\s*Formula:\s*(.+?)\s*$', ln)
        if m and 'formula' not in out:
            out['formula'] = m.group(1)
        m = re.search(r'Number of observations:\s*(\d+)', ln)
        if m:
            out['nobs'] = int(m.group(1))
        m = re.search(r'total post-warmup draws\s*=\s*(\d+)', ln)
        if m:
            out['draws'] = int(m.group(1))
        m = re.search(r'Number of levels:\s*(\d+)', ln)
        if m:
            out['group_levels'] = int(m.group(1))

    bucket = None
    cols = None
    for ln in lines:
        if re.match(r'^\s*Group-Level Effects:', ln):
            bucket, cols = 'groups', None
            continue
        if re.match(r'^\s*Population-Level Effects:', ln):
            bucket, cols = 'population', None
            continue
        if re.match(r'^\s*Family Specific Parameters:', ln):
            bucket, cols = 'family_specific', None
            continue
        if re.match(r'^\s*Draws were sampled', ln):
            bucket = None
            continue
        if bucket is None or not ln.strip():
            continue
        if ln.strip().startswith('~'):
            continue
        if 'Estimate' in ln and 'Est.Error' in ln:
            cols = ['estimate', 'est_error', 'lower', 'upper', 'rhat', 'bulk_ess', 'tail_ess']
            continue
        if cols is None:
            continue
        name, nums = peel(ln)
        if not name or len(nums) != len(cols):
            continue
        rec = {'name': name}
        for k, v in zip(cols, nums):
            rec[k] = v
        out[bucket].append(rec)
    return out


def main():
    try:
        src = fetch(URL)
    except Exception as e:
        sys.stderr.write('could not reach %s: %s\n' % (URL, e))
        if os.path.exists(OUT):
            sys.stderr.write('keeping the existing %s\n' % OUT)
            return 0
        return 1

    text = extract_summary(src)
    if not text:
        sys.stderr.write('could not find a brms summary block at %s\n' % URL)
        return 1

    # sanity: it has to look like brms output, not something else
    for needle in ('Family:', 'Formula:', 'Population-Level Effects:',
                   'Bulk_ESS', 'Tail_ESS', 'l-95% CI', 'u-95% CI'):
        assert needle in text, 'extracted block is missing %r' % needle
    assert '#>' not in text, 'knitr prefix survived the strip'

    parsed = parse_brms(text)
    assert parsed.get('family') == 'poisson', parsed.get('family')
    assert parsed.get('nobs') == 236, parsed.get('nobs')
    assert len(parsed['population']) == 5, parsed['population']
    assert len(parsed['groups']) == 1, parsed['groups']

    payload = {
        'meta': {
            'generated_by': 'Scripts/tool-truth/gen-brms-preset.py',
            'provenance': ('Verbatim from the official brms documentation at '
                           'https://paulbuerkner.com/brms/ (package homepage, '
                           'maintained by the brms author Paul Buerkner). knitr\'s '
                           '"#> " output prefix is stripped; nothing else is changed.'),
            'source_url': URL,
            'why_not_fitted_locally': ('brms compiles each model with a C++ toolchain. '
                                       'No Rtools is installed on the build box, so brms '
                                       'cannot fit locally and this output is quoted from '
                                       'the package documentation rather than fabricated.'),
            'r_call': R_CALL,
        },
        'preset': {
            'label': 'brms, multilevel Poisson',
            'blurb': ('The epilepsy example from the brms documentation. Shows the brms '
                      'layout: credible interval columns, Bulk_ESS and Tail_ESS, and a '
                      'group-level sd row.'),
            'r_call': R_CALL,
            'summary_text': text,
            'expect': parsed,
        },
    }

    with io.open(OUT, 'w', encoding='utf-8', newline='\n') as f:
        f.write(json.dumps(payload, indent=2, ensure_ascii=False, sort_keys=True))
        f.write(u'\n')
    print('wrote %s' % OUT)
    print('  family=%s nobs=%s draws=%s population rows=%d group rows=%d'
          % (parsed.get('family'), parsed.get('nobs'), parsed.get('draws'),
             len(parsed['population']), len(parsed['groups'])))
    return 0


if __name__ == '__main__':
    sys.exit(main())
