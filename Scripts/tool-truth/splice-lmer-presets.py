# Splice the REAL lme4 preset summaries into the lmer-output-interpreter UI, then
# re-pin the content-hash ?v= query strings on the tool page.
#
# The presets must be byte-identical to what lme4 actually printed. Hand-typing
# them once produced a fabricated preset that only the E2E caught, so they are
# only ever machine-copied from the R-generated truth table, and the E2E asserts
# byte-identity against that same JSON.
import io, json, os, re, hashlib

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TRUTH = os.path.join(ROOT, 'Scripts', 'tool-truth', 'lmer-output-interpreter.json')
UI = os.path.join(ROOT, 'tools', 'lib', 'lmer-output-interpreter-ui.js')
PAGE = os.path.join(ROOT, 'tools', 'lmer-output-interpreter.html')
MATH = os.path.join(ROOT, 'tools', 'lib', 'lmer-math.js')

with io.open(TRUTH, encoding='utf-8') as f:
    truth = json.load(f)

presets = {k: truth['presets'][k]['summary_text'] for k in ('ri', 'rs', 'glmer', 'lmertest')}
for k, v in presets.items():
    assert 'mixed model' in v.lower(), 'preset %s does not look like lme4 output' % k
    assert 'Random effects:' in v, 'preset %s missing random effects block' % k

block = '  /* __PRESETS_BEGIN__ */\n  var PRESET_TEXT = ' + json.dumps(presets, indent=2, ensure_ascii=True) + ';\n  /* __PRESETS_END__ */'
# JS-side indent tidy (cosmetic only; the string contents are untouched)
block = '\n'.join(('  ' + l if i else l) for i, l in enumerate(block.split('\n')))

with io.open(UI, encoding='utf-8') as f:
    ui = f.read()
new_ui, n = re.subn(r'  /\* __PRESETS_BEGIN__ \*/.*?/\* __PRESETS_END__ \*/', lambda m: block, ui, flags=re.S)
assert n == 1, 'preset markers not found in UI (n=%d)' % n
if new_ui != ui:
    io.open(UI, 'w', encoding='utf-8', newline='\n').write(new_ui)
    print('spliced %d presets into %s' % (len(presets), os.path.basename(UI)))
else:
    print('presets already current')

# verify round-trip: what we wrote parses back byte-identical
m = re.search(r'var PRESET_TEXT = (\{.*?\});\n', io.open(UI, encoding='utf-8').read(), re.S)
assert m, 'could not re-read PRESET_TEXT'
back = json.loads(m.group(1))
for k in presets:
    assert back[k] == presets[k], 'round-trip mismatch on preset %s' % k
print('round-trip byte-identity: OK (%s)' % ', '.join(sorted(presets)))

def h8(p):
    return hashlib.md5(io.open(p, 'rb').read()).hexdigest()[:8]

pins = {'PIN_LMER_MATH': h8(MATH), 'PIN_LMER_UI': h8(UI)}
with io.open(PAGE, encoding='utf-8') as f:
    page = f.read()
for token, val in pins.items():
    page = page.replace(token, val)
# re-pin on rebuilds (idempotent): swap whatever hash is there for the current one
page = re.sub(r'(lmer-math\.js\?v=)[a-f0-9]{8}', r'\g<1>' + pins['PIN_LMER_MATH'], page)
page = re.sub(r'(lmer-output-interpreter-ui\.js\?v=)[a-f0-9]{8}', r'\g<1>' + pins['PIN_LMER_UI'], page)
io.open(PAGE, 'w', encoding='utf-8', newline='\n').write(page)
print('pins: lmer-math=%s  ui=%s' % (pins['PIN_LMER_MATH'], pins['PIN_LMER_UI']))

# normal-math must stay untouched so its existing pin across other tools holds
nm = os.path.join(ROOT, 'tools', 'lib', 'normal-math.js')
print('normal-math md5 (must equal its existing ?v pin 8f6fd067): %s' % h8(nm))
