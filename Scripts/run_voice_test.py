"""Voice-experiment runner: build seq 13 with the new voice pack, then
rewrite Inference-Mini-1 in the owner voice. Sequential (git safety).
Detached-safe; each stage logs under Scripts/briefs/."""
import os, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BRIEFS = os.path.join(ROOT, 'Scripts', 'briefs')

stages = [
    ('voice-test-seq13.log', ['Scripts/batch_windowed.py', '--seq', '13', '--max', '1']),
    ('voice-test-rewrite.log', ['Scripts/rewrite_windowed_voice.py', 'Inference-Mini-1']),
]
for logname, args in stages:
    with open(os.path.join(BRIEFS, logname), 'w', encoding='utf-8') as f:
        rc = subprocess.run([sys.executable] + args, cwd=ROOT,
                            stdout=f, stderr=subprocess.STDOUT).returncode
    if rc != 0:
        print(f'stage {args[0]} failed rc={rc}', flush=True)
        sys.exit(rc)
print('voice test complete', flush=True)
