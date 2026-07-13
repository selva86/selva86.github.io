# /write-tool dag — build plan + parity checklist

Slug: `dag-confounder-picker`. Existing file: 225KB, v1-era tool with v2 chrome injected.
Full JS DAG engine already present (Pearl back-door criterion + d-separation + minimal
adjustment-set enumeration), cross-checked against dagitty for canonical DAGs on-page.

## Pass 0 — FEATURE INVENTORY (existing tool, all must carry into v2)

Scenario presets (6): confounder, collider, iv, mediator, mbias, custom — icon/title/story/nodes/edges/X/Y.
Inputs: edges textarea (`A -> B` / `A <- B`, `;`/newline), add-edge (from→to selects), add-node,
  exposure (X) select, outcome (Y) select.
Engine (findAdjustmentSets): cycle guard, allPaths (undirected), back-door classification,
  collider detection, d-separation (pathBlocked), Pearl criterion (isValidAdjustment),
  ALL minimal sets, all-valid count, descendants(X) forbidden set, IV-candidate heuristic.
Outputs: banner sentence, result card ({ } set + chips + aux), recap-mini (NODES/EDGES/X-Y/
  BACK-DOOR/CAUSAL/COLLIDERS/DESC(X)), interactive draggable SVG DAG (X blue / Y orange /
  adjustment filled / colliders tinted) + readout, warnings/callouts, inference banner,
  R emitter (dagitty adjustmentSets minimal+all + impliedConditionalIndependencies + suggested lm()).
Explainers: tool-lead, 4-min primer dropdown, Context (ws-method), Anatomy read-more (4 steps),
  Caveats "wrong tool" alt-list, Further reading, numerical-accuracy note.

## v1 remnants / v2 gaps to fix

1. WebR loaded (webr.min.css + webr-init.min.js), runnable R block w/ Run+Reset → static copy-only block.  [MANDATORY]
2. No external math lib → extract engine to tools/lib/dag-math.js (UMD), page loads it.               [SKILL]
3. No R truth table → Scripts/tool-truth/dag-confounder-picker.{R,json} vs dagitty.                    [SKILL]
4. No trust line (.trust: No data leaves / Cross-checked vs dagitty::adjustmentSets() / Free).         [SKILL]
5. No on-page FAQ (JSON-LD has 3 Q's) → add plain <details> FAQ matching JSON-LD.                      [SKILL]
6. IBM Plex Mono (36×) for code → ui-monospace,SFMono-Regular,Menlo,Consolas,monospace; drop from font <link>. [OWNER RULE]
7. banner-sentence is an output echo → convert to canonical "I want to work through <select scenario>"
   intent banner synced with scenario cards (rubric item 6).                                           [OWNER RULE]

## Parity checklist (every line must ship or be waived w/ reason)

- [ ] 6 scenario presets load and set the DAG + X/Y
- [ ] edges textarea parse (`->`, `<-`, `;`/newline), add-edge, add-node, X/Y selects
- [ ] cycle detection refuses cyclic graphs
- [ ] minimal adjustment set(s) match dagitty for all truth DAGs
- [ ] all-valid count, descendants(X), IV hint preserved
- [ ] draggable SVG viz preserved (X/Y/adjustment/collider colors)
- [ ] recap-mini + warnings + inference banner preserved
- [ ] R emitter (dagitty) preserved, now STATIC copy block, code runs in R
- [ ] tool-lead, primer, Context, Anatomy, Caveats, Further reading preserved

## Waivers

- WebR "Run" dropped (v2 rule: no in-browser R runtime). Replaced by static, copyable dagitty
  code the reader runs locally. Taught: trust line says "Cross-checked against dagitty::adjustmentSets()".

## Truth DAGs (Pass 1)

confounder, collider, iv, mediator, mbias, chain (X→Y direct), confounder+collider (butterfly),
two-confounder, mediator-with-descendant, diamond (Z→X, Z→W, W→Y, X→Y), no-path (Y→X only).
Capture per DAG: adjustmentSets(type=minimal), adjustmentSets(type=all), #backdoor paths (via
paths() incidence), descendants(X), and a couple d-sep probes (dseparated()).
