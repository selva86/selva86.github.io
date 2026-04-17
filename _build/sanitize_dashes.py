#!/usr/bin/env python3
"""Replace em dashes with ', ' in tutorial prose.

Why: em dash (U+2014) is a reliable LLM tell. We convert to comma-plus-space in
all prose, but skip code blocks, inline code, HTML attribute values, and the
frontmatter fields that aren't prose (slug, curriculum_id, etc.).

Pipeline placement:
  - One-time run across _posts/*.html + posts/*.md, then build.py --full
    regenerates the root HTML with clean prose.
  - Imported by md2html.py so every new fragment is sanitized on write.

Usage:
  python _build/sanitize_dashes.py              # dry-run (default)
  python _build/sanitize_dashes.py --apply      # write changes in place
"""
import argparse
import glob
import os
import re
import sys


EM_DASH_RE = re.compile(r'\s*\u2014\s*')

# Order matters: longer/enclosing patterns first so they capture before
# inner patterns can match a fragment.
_PROTECT_HTML_BLOCK = re.compile(
    r'<(pre|code|script|style)(\s[^>]*)?>[\s\S]*?</\1>', re.IGNORECASE)
# Protect non-prose HTML attribute values (URLs, classes, IDs, etc.) so we
# don't rewrite em dashes inside them. Prose attributes (title, alt, content,
# placeholder, aria-label) are intentionally left exposed so SEO/a11y text
# gets sanitized alongside the body.
_PROTECT_HTML_ATTR = re.compile(
    r'\s(?:href|src|class|id|style|value|type|role|rel|target|'
    r'data-[a-zA-Z0-9_-]+|aria-(?!label)[a-zA-Z0-9_-]+|'
    r'on[a-zA-Z]+)\s*=\s*(?:"[^"]*"|\'[^\']*\')',
    re.IGNORECASE,
)
_PROTECT_MD_FENCED = re.compile(r'```[\s\S]*?```')
_PROTECT_MD_INLINE = re.compile(r'`[^`\n]+`')

_FM_OPEN_RE = re.compile(r'\A---\s*\n')
_FM_FIELD_RE = re.compile(r'^(\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:\s*)(.*)$')

# Frontmatter keys whose values are prose visible to readers / SERPs.
# Keys not in this set (slug, curriculum_id, post_type, auto_link_terms, etc.)
# are left untouched, even if they happen to contain a dash.
_PROSE_FIELDS = {
    'title',
    'description',
    'keywords',
    'seo_title',
    'meta_description',
    'sidebar_title',
    'h1',
    'subtitle',
}


def _replace_in_prose(text):
    return EM_DASH_RE.sub(', ', text)


def _sub_with_protection(text, patterns, replace_fn):
    """Replace regions matched by `patterns` with placeholders, run replace_fn
    on what remains, then restore the protected regions."""
    segments = []

    def grab(m):
        segments.append(m.group(0))
        return f'\x00PROTECT{len(segments) - 1}\x00'

    tmp = text
    for pat in patterns:
        tmp = pat.sub(grab, tmp)

    tmp = replace_fn(tmp)

    def restore(m):
        return segments[int(m.group(1))]

    return re.sub(r'\x00PROTECT(\d+)\x00', restore, tmp)


def _split_frontmatter(content):
    """Return (frontmatter_block, body). Frontmatter block includes the
    leading and closing '---' markers with trailing newline; empty string if
    the file has no frontmatter."""
    if not _FM_OPEN_RE.match(content):
        return '', content
    # Find the closing '---' on its own line after the opener.
    m = re.search(r'\n---\s*\n', content)
    if not m:
        return '', content
    end = m.end()
    return content[:end], content[end:]


def _sanitize_frontmatter(fm_block):
    lines = fm_block.split('\n')
    out = []
    for line in lines:
        m = _FM_FIELD_RE.match(line)
        if m and m.group(2) in _PROSE_FIELDS:
            indent, key, sep, val = m.groups()
            out.append(f'{indent}{key}{sep}{_replace_in_prose(val)}')
        else:
            out.append(line)
    return '\n'.join(out)


def sanitize_html_fragment(content):
    fm, body = _split_frontmatter(content)
    if fm:
        fm = _sanitize_frontmatter(fm)
    body = _sub_with_protection(
        body,
        [_PROTECT_HTML_BLOCK, _PROTECT_HTML_ATTR],
        _replace_in_prose,
    )
    return fm + body


def sanitize_markdown(content):
    fm, body = _split_frontmatter(content)
    if fm:
        fm = _sanitize_frontmatter(fm)
    body = _sub_with_protection(
        body,
        [_PROTECT_MD_FENCED, _PROTECT_MD_INLINE],
        _replace_in_prose,
    )
    return fm + body


def sanitize_text(content, kind):
    if kind == 'md':
        return sanitize_markdown(content)
    return sanitize_html_fragment(content)


def _count_dashes(text):
    return text.count('\u2014')


def _main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--apply', action='store_true',
                        help='Write changes in place (default: dry-run).')
    parser.add_argument('--only', default=None,
                        help='Glob (relative to repo root) limiting which '
                             'files are processed, e.g. "_posts/R-*.html".')
    args = parser.parse_args()

    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if args.only:
        targets = sorted(glob.glob(os.path.join(root, args.only)))
    else:
        targets = sorted(
            glob.glob(os.path.join(root, '_posts', '*.html')) +
            glob.glob(os.path.join(root, 'posts', '*.md'))
        )

    changed = []
    total_removed = 0
    for path in targets:
        with open(path, 'r', encoding='utf-8') as f:
            original = f.read()
        kind = 'md' if path.endswith('.md') else 'html'
        updated = sanitize_text(original, kind)
        if updated == original:
            continue
        removed = _count_dashes(original) - _count_dashes(updated)
        total_removed += removed
        changed.append((path, removed))
        if args.apply:
            with open(path, 'w', encoding='utf-8', newline='\n') as f:
                f.write(updated)

    verb = 'Replaced' if args.apply else 'Would replace'
    print(f'{verb} {total_removed} em dashes across {len(changed)} files '
          f'(scanned {len(targets)}).')
    for path, n in changed[:25]:
        rel = os.path.relpath(path, root)
        print(f'  {n:4d}  {rel}')
    if len(changed) > 25:
        print(f'  ... {len(changed) - 25} more files')
    return 0


if __name__ == '__main__':
    sys.exit(_main())
