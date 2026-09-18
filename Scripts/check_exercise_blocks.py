"""Check that every graded exercise names the block the learner writes in.

WHY THIS EXISTS
    exercise-hub.js has to decide which code block on a card is the learner's,
    because that is the one Check runs and grades. It used to decide by
    position: the first .webr-container not inside a <details>. The authored
    order puts a setup block before the answer, so on every exercise carrying
    its own setup the hub graded the setup block instead. Check re-ran the
    setup, compared its output with the expected result, and could never pass.
    Forty-seven exercises across seven hubs were unsolvable that way, which also
    put those hubs' badges out of reach.

    The hub now decides by the label the author gave the block. That makes the
    label load-bearing, so it needs checking rather than trusting.

THE RULES
    1. A runnable exercise has exactly one block titled "Your turn".
    2. An exercise with no runnable block at all is static: it gets a
       "Mark as done" control and is never graded. That is allowed.

    Rule 1 is what this script enforces. The old positional bug cannot come
    back while every runnable exercise is labelled, whatever order the blocks
    are authored in.

RUN IT
    python Scripts/check_exercise_blocks.py            # from the repo root
    python Scripts/check_exercise_blocks.py --verbose  # list every exercise

    Exits non-zero when a runnable exercise is missing its label or has more
    than one, so it can gate a build.
"""

import io
import json
import os
import re
import sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CATALOG = os.path.join(REPO, "www", "exercise-catalog.json")

SECTION_SPLIT = re.compile(r'(?=<section[^>]*class="[^"]*\bexercise\b)')
EX_ID = re.compile(r'data-exercise-id="([^"]+)"')
BLOCK_TITLE = re.compile(r'data-block-title="([^"]+)"')


def hub_slugs():
    with io.open(CATALOG, encoding="utf-8") as fh:
        catalog = json.load(fh)
    slugs = set()
    for category in catalog.get("categories", []):
        for hub in category.get("hubs", []):
            slug = hub.get("slug") or hub.get("id")
            if slug:
                slugs.add(slug)
    return sorted(slugs)


def exercises_in(html):
    """Yield (exercise_id, section_html) for each exercise card on a page."""
    for segment in SECTION_SPLIT.split(html)[1:]:
        found = EX_ID.search(segment)
        if not found:
            continue
        end = segment.find("</section>")
        yield found.group(1), (segment[:end] if end != -1 else segment)


def main(argv):
    verbose = "--verbose" in argv
    missing, duplicated = [], []
    hubs_seen = graded = static = 0

    for slug in hub_slugs():
        path = os.path.join(REPO, slug + ".html")
        if not os.path.exists(path):
            continue
        hubs_seen += 1
        with io.open(path, encoding="utf-8", errors="replace") as fh:
            html = fh.read()

        for exercise_id, section in exercises_in(html):
            titles = BLOCK_TITLE.findall(section)
            answers = [t for t in titles if t.strip().lower() == "your turn"]

            if not answers:
                if "webr-container" in section:
                    missing.append((exercise_id, titles))
                else:
                    static += 1          # no runnable block: never graded
                continue

            graded += 1
            if len(answers) > 1:
                duplicated.append((exercise_id, titles))
            if verbose:
                print("  ok  " + exercise_id)

    print("hubs checked                  : %d" % hubs_seen)
    print("graded exercises (labelled)   : %d" % graded)
    print("static exercises (not graded) : %d" % static)

    if missing:
        print("\nRunnable exercises with no \"Your turn\" block (%d):" % len(missing))
        for exercise_id, titles in missing:
            print("  %s  blocks: %s" % (exercise_id, ", ".join(titles) or "(none named)"))
    if duplicated:
        print("\nExercises with more than one \"Your turn\" block (%d):" % len(duplicated))
        for exercise_id, titles in duplicated:
            print("  %s  blocks: %s" % (exercise_id, ", ".join(titles)))

    if missing or duplicated:
        print("\nFAIL: every runnable exercise needs exactly one block titled "
              "\"Your turn\". Without it the hub falls back to guessing which "
              "block to grade.")
        return 1

    print("\nOK: every runnable exercise names the block it grades.")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
