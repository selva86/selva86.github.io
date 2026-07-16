# binomial-table - build plan + parity checklist

Wave 3, Tier B, printable-table cluster. Sibling pattern: `t-table`, `z-table`,
`chi-square-table`, `f-table` (baked SEO tables + interactive lookup).

## Pass 0 - feature inventory

**No predecessor.** No `tools/binomial-table.html` in the worktree, in git
history, or on any preview branch. So the bar is the depth of the best existing
tools rather than a parity list against an old version:

| Depth-bar item | Shipped as |
|---|---|
| Multiple modes | 3: exactly k / at most k / at least k (pills + "I want to" selector) |
| Scenario presets | 5 chips, each teaching a different facet: coin, zero-defects, at-least, p > .5 mirror, off-table p |
| Plain-English verdict | `.plain` box: probability, percent, mean, distance from the mean in SD |
| Live inference line | `.infline`, mode-specific and decisive (at-least/at-most get the 5% reading; exactly-k is told why a single bar is not a verdict) |
| R code emitter | live `dbinom`/`pbinom` one-liner + the whole-row idiom; every emitted call was run in R and reproduces the displayed value |
| Explainer + FAQ | "How to read this table" walkthrough, the p > 0.5 symmetry section, a which-table method table, 6 FAQs |
| Real interactivity | recompute on every input; PMF bar chart; table cell highlight; jump-to-cell |
| Visual answer | PMF bars with the queried outcomes filled + the highlighted table cell |

**Beyond the spec:** the exact-rational display engine (below) and the honest
tiny-value readout.

## Spec items

- [x] Printable exact **and** cumulative tables, standard grid n = 1..20 x p = .05(.05).50 (230 rows each, both in the DOM for SEO/print)
- [x] Interactive lookup: n, p, k -> P(X=k), P(X<=k), P(X>=k)
- [x] Highlighted row/cell in the rendered table, per mode (at-least highlights k-1, since that is the cell you actually read)
- [x] Plain-English readout, steps, R one-liners (dbinom/pbinom)
- [x] "How to read this table" walkthrough (worked example, 6 steps)
- [x] p > 0.5 symmetry trick **taught**: its own section with both identities, the mirrored cell highlighted live, a preset chip, and an FAQ
- [x] Every displayed probability verified vs R dbinom/pbinom (all 4600 cells + 28 lookup cases + edges)
- [x] Cross-links: binomial-probability-calculator + poisson-distribution-calculator (in "Keep going", the method table, and the FAQ)
- [x] `binomial-table` in the `SIZE_EXEMPT` list in `Scripts/tool-audit/page_audit.mjs` (already present; page is 345KB, 175KB of it table data)

## Registration

- [x] `COMPENDIUM_TOOLS` + icon in `_build/build.py` (Reference tables group)
- [x] `CATEGORIES` + `C3META` card in `_build/gen_tools_landing.py`
- [x] content-hash `?v` pin on every lib ref (`binomial-math.js?v=4679a85a`); the
      sibling `binomial-probability-calculator.html` re-pinned onto the same hash
      and its harness re-run (79/79) to prove the additive lib edit is safe
- [x] slug added to `Scripts/tool-audit/tool-list.json`

## The one real design decision: printed digits

A 4dp table is hostage to the last bit of a double, because many of these
probabilities terminate exactly one digit past the printed precision
(`dbinom(1, 6, 0.5)` is exactly 0.09375) and so land ON a rounding tie. There,
R is not a usable oracle for the printed digit:

- `dbinom(1, 6, 0.5) == 0.09375` is **FALSE** in R (R is 1.4e-17 low, though the
  value is exactly representable), so `sprintf("%.4f")` prints `0.0937`
- `dbinom(0, 5, 0.5) == 0.03125` is **TRUE**, and R then breaks the tie to even
  and prints `0.0312`

So R's tie digit is half its own float error and half a half-to-even rule, and
no formatting rule can reproduce it. The cells are therefore computed as **exact
rationals** (BigInt: `C(n,k) m^k (10^t-m)^(n-k) / 10^(tn)` for decimal
p = m/10^t) and ties round **half up** - the printed-table convention, the rule a
reader applies by hand, and the one that agrees with what R shows at the console
(`dbinom(1, 6, 0.5)` prints `0.09375`, which rounds to our `0.0938`).

Consequence, held to proof rather than waived: 11 of 4600 cells differ from R's
`sprintf("%.4f")`. `test-binomial-table-math.js` requires each one to be a true
tie (exact remainder = half) with R's double within 8 ulp of the exact value;
anything else fails the gate. The same `fmtExact` routine prints the cells and
the live readout, so the two can never drift.

## Gates

| Gate | Result |
|---|---|
| Pass 1 R truth | `binomial-table.R` -> 2300 grid cells x (dbinom, pbinom, upper, 4dp strings) + 28 lookups + 6 symmetry cases |
| Pass 2 math harness | **16384/16384**, worst rel **4.26e-11**; sibling harness still 79/79 |
| Pass 4.1 local E2E | **172/172** rendered-value checks vs R, all 3 modes, mirror, off-table, errors, R code, table integrity |
| Pass 4.2 chrome | 1 injected chrome, 0 own masthead, canonical `.sitenav`, 68 sidebar links, `.rail-fold`, no in-page footer, no `data-tool-v2` |
| Pass 4.3 mobile | 360/390/768/1280: overflow 0 at every width |
| Emitted R code | every one-liner run in R 4.6.0; reproduces the displayed value |
| Page audit | clean except `/api/me` + `/cdn-cgi/trace` 404s, which are Cloudflare-only endpoints absent from a local static server |

## Known, accepted

- **Tap targets 33-39px** on the shell classes (`.mode` 39, `.chip` 33, `.copy`
  38). Identical on `t-table`/`z-table`: a fleet-wide Lab-sheet characteristic,
  not a regression here. Fixing it belongs in the shell, not on one page.
- **345KB page** (175KB of it the two baked tables). Size is data, not design
  debt: that is what the `SIZE_EXEMPT` list exists for.
- **Exact engine caps out** at a denominator of 10^2000 (`EXACT_MAX_DIGITS`);
  past that the readout falls back to `toFixed` on the double. Unreachable from
  the UI (n <= 1000 and a sane p), and ties are not a concern off the grid.
