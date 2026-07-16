"""Emit the coxph presets as a JS module, straight from the R truth table.

The presets on the page must be REAL summary(coxph) output. Hand-typing one is
how a fabricated preset ships: it looks plausible, and every number the tool
derives from it is then wrong in a way no reader can see. So the text is copied
byte for byte out of Scripts/tool-truth/coxph-output-interpreter.json (which R
wrote) and spliced in mechanically. --check re-verifies the shipped file still
matches R, and is part of the gate.

  python Scripts/tool-truth/gen-coxph-presets.py          # write the JS
  python Scripts/tool-truth/gen-coxph-presets.py --check  # verify byte-identity
"""
import json
import sys
import os

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TRUTH = os.path.join(ROOT, 'Scripts', 'tool-truth', 'coxph-output-interpreter.json')
OUT = os.path.join(ROOT, 'tools', 'lib', 'coxph-presets.js')

# slug -> (chip label, one-line framing shown under the chip row)
PRESETS = [
    ('preset_sex', 'sex only',
     'The classic teaching fit: one binary covariate on the NCCTG lung cancer data.'),
    ('preset_multi', 'age + sex + ph.ecog',
     'Three covariates, one of them continuous, and a row that is not significant.'),
    ('preset_factor', 'a factor and four terms',
     'A named factor level plus three continuous terms, and two rows worth arguing about.'),
]


def js_string(s):
    """A JS string literal that survives R's backslashes and quotes intact."""
    return json.dumps(s, ensure_ascii=True)


def build():
    with open(TRUTH, encoding='utf-8') as f:
        truth = json.load(f)
    cases = {c['id']: c for c in truth['cases']}

    parts = []
    for cid, label, blurb in PRESETS:
        c = cases[cid]
        parts.append('  %s: {\n    label: %s,\n    blurb: %s,\n    text: %s\n  }' % (
            json.dumps(cid.replace('preset_', '')),
            js_string(label), js_string(blurb), js_string(c['text'])))

    body = (
        '/* coxph-presets.js - GENERATED, do not hand-edit.\n'
        '   Source: Scripts/tool-truth/coxph-output-interpreter.json, written by\n'
        '   Scripts/tool-truth/coxph-output-interpreter.R (R 4.6.0 survival).\n'
        '   Regenerate: python Scripts/tool-truth/gen-coxph-presets.py\n'
        '   Every string below is byte-for-byte what summary(coxph(...)) printed. */\n'
        '(function (root, factory) {\n'
        '  if (typeof module === \'object\' && module.exports) { module.exports = factory(); }\n'
        '  else { root.CoxPresets = factory(); }\n'
        '}(typeof self !== \'undefined\' ? self : this, function () {\n'
        '  \'use strict\';\n'
        '  return {\n'
        + ',\n'.join(parts) +
        '\n  };\n'
        '}));\n'
    )
    return body


def main():
    body = build()
    if '--check' in sys.argv:
        if not os.path.exists(OUT):
            print('FAIL: %s does not exist' % OUT)
            return 1
        with open(OUT, encoding='utf-8') as f:
            cur = f.read()
        if cur.replace('\r\n', '\n') != body.replace('\r\n', '\n'):
            print('FAIL: tools/lib/coxph-presets.js does not match the R truth table.')
            print('      A preset was edited by hand or the truth table moved.')
            print('      Run: python Scripts/tool-truth/gen-coxph-presets.py')
            return 1
        print('OK: presets are byte-identical to R output')
        return 0

    with open(OUT, 'w', encoding='utf-8', newline='\n') as f:
        f.write(body)
    print('wrote %s (%d bytes)' % (OUT, len(body)))
    return 0


if __name__ == '__main__':
    sys.exit(main())
