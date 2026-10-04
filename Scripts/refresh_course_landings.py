#!/usr/bin/env python3
"""Link built lessons from their course landing pages.

A landing page (posts/<Course-Landing>.md, post_type C) is written once, when
its course's first lesson publishes, so every later lesson is listed as
"Lesson N is coming soon." and nothing ever updated it: on 2026-10-04, 37
such lines across 11 landings pointed at lessons that were already live.

For every course in courses.json whose landing markdown exists, each BUILT
lesson's "Lesson N is coming soon." line becomes
"[Start Lesson N: <catalog title>](<slug>.html)" and its "### Lesson N:"
heading takes the catalog title. Lessons not yet built are left alone.

  python Scripts/refresh_course_landings.py           # rewrite the markdown, print changed landings
  python Scripts/refresh_course_landings.py --build   # also convert + build each changed landing page

Run from the repo root. batch_lessons.py sync() calls it with --build.
"""
import json, os, re, subprocess, sys

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))


def refresh():
    with open(os.path.join(ROOT, 'courses.json'), encoding='utf-8') as f:
        courses = json.load(f)['courses']
    changed = []
    for c in courses:
        landing = (c.get('landing') or '').replace('.html', '')
        path = os.path.join(ROOT, 'posts', landing + '.md')
        if not landing or '/' in landing or not os.path.exists(path):
            continue
        with open(path, 'rb') as f:
            raw = f.read()
        crlf = b'\r\n' in raw
        text = raw.decode('utf-8').replace('\r\n', '\n')
        new = text
        for l in c.get('lessons', []):
            n, slug, title = int(l.get('order', 0)), l.get('slug', ''), (l.get('title') or '').strip()
            if not (n and slug and title and l.get('built', True)):
                continue
            soon = re.compile(r'^Lesson %d is coming soon\.[ \t]*$' % n, re.M)
            if not soon.search(new):
                continue
            new = soon.sub('[Start Lesson %d: %s](%s.html)' % (n, title, slug), new)
            new = re.sub(r'^### Lesson %d: .*$' % n, '### Lesson %d: %s' % (n, title), new, flags=re.M)
        # The closing call to action starts the reader at the first BUILT lesson
        # (a course whose lesson 1 is still coming must not link to a 404).
        built = sorted((int(l['order']), l['slug'], l['title'].strip()) for l in c.get('lessons', [])
                       if l.get('order') and l.get('slug') and l.get('title') and l.get('built', True))
        if built:
            n, slug, title = built[0]
            m = re.search(r'^Ready\? \[Begin with Lesson \d+: [^\]]*\]\(([^)]*)\)\.[ \t]*$', new, re.M)
            if m and m.group(1) != slug + '.html':
                new = new[:m.start()] + 'Ready? [Begin with Lesson %d: %s](%s.html).' % (n, title, slug) + new[m.end():]
        if new != text:
            out = new.replace('\n', '\r\n') if crlf else new
            with open(path, 'wb') as f:
                f.write(out.encode('utf-8'))
            changed.append(landing)
    return changed


def build(landing):
    subprocess.run([sys.executable, os.path.join('_build', 'md2html.py'), os.path.join('posts', landing + '.md')], cwd=ROOT, check=True)
    subprocess.run([sys.executable, os.path.join('_build', 'build.py'), '--only', landing], cwd=ROOT, check=True)


if __name__ == '__main__':
    changed = refresh()
    for landing in changed:
        print('refreshed: ' + landing)
        if '--build' in sys.argv:
            build(landing)
    if not changed:
        print('all course landings current')
