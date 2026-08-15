"""Waits for the current windowed batch to finish, then launches the next.
Detached-safe: no harness dependencies, plain polling on the run log."""
import os, subprocess, sys, time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PREV = os.path.join(ROOT, 'Scripts', 'briefs', 'batch-windowed-run3.log')
OUT = os.path.join(ROOT, 'Scripts', 'briefs', 'batch-windowed-run4.log')

deadline = time.time() + 6 * 3600
while time.time() < deadline:
    try:
        txt = open(PREV, encoding='utf-8', errors='replace').read()
        if 'batch complete' in txt or 'FAIL' in txt.splitlines()[-1]:
            break
    except OSError:
        pass
    time.sleep(60)

with open(OUT, 'w', encoding='utf-8') as f:
    subprocess.run([sys.executable, os.path.join(ROOT, 'Scripts', 'batch_windowed.py'),
                    '--max', '10'], cwd=ROOT, stdout=f, stderr=subprocess.STDOUT)
