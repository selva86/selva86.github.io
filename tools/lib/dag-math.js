/* dag-math.js - causal-DAG adjustment-set math for Tool Farm v2
   (tools/dag-confounder-picker.html).

   Implements Pearl's back-door criterion via explicit path enumeration and
   d-separation, then returns the minimum sufficient adjustment set(s).

   Ground truth: R 4.6.0 dagitty::adjustmentSets() (type = "minimal" and "all")
   and dagitty::descendants(). Verified set-for-set against
   Scripts/tool-truth/dag-confounder-picker.json across 12 canonical DAGs
   (confounder, collider, IV, mediator, M-bias, butterfly, two-confounder,
   diamond with alternative minimal sets, unidentifiable Y->X, and more).

   The engine is the stricter Pearl back-door criterion: a candidate set may
   contain no descendant of X. dagitty's generalized adjustment criterion agrees
   on every MINIMAL set here; it can additionally list non-minimal "all" sets
   that include an off-path descendant of X (never needed, never minimal), which
   this engine deliberately excludes. Reference: Pearl, Causality (2009),
   Definition 1.2.3 (d-separation) and Theorem 3.3.2 (back-door criterion).

   Pure: no DOM, no globals beyond the exported namespace. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    var api = factory();
    root.DAGMath = api;
    // Convenience globals for the page's existing call sites.
    ['findAdjustmentSets', 'colliderIndices', 'descendants', 'hasCycle',
     'allPaths', 'isBackDoor', 'pathBlocked', 'buildAdj', 'combinations',
     'isValidAdjustment'].forEach(function (k) {
      if (typeof root[k] === 'undefined') root[k] = api[k];
    });
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // in/out adjacency as Sets, keyed by node name.
  function buildAdj(nodes, edges) {
    var out = {}, inn = {};
    for (var i = 0; i < nodes.length; i++) { out[nodes[i]] = new Set(); inn[nodes[i]] = new Set(); }
    for (var j = 0; j < edges.length; j++) {
      var a = edges[j][0], b = edges[j][1];
      if (!out[a]) out[a] = new Set();
      if (!inn[b]) inn[b] = new Set();
      out[a].add(b); inn[b].add(a);
    }
    return { out: out, inn: inn };
  }

  // DFS 3-colour cycle detection.
  function hasCycle(nodes, edges) {
    var adj = buildAdj(nodes, edges);
    var out = adj.out;
    var WHITE = 0, GRAY = 1, BLACK = 2;
    var color = {};
    for (var i = 0; i < nodes.length; i++) color[nodes[i]] = WHITE;
    function dfs(u) {
      color[u] = GRAY;
      var nbrs = out[u] || [];
      for (var v of nbrs) {
        if (color[v] === GRAY) return true;
        if (color[v] === WHITE && dfs(v)) return true;
      }
      color[u] = BLACK;
      return false;
    }
    for (var k = 0; k < nodes.length; k++) if (color[nodes[k]] === WHITE && dfs(nodes[k])) return true;
    return false;
  }

  // Strict descendants of `node` (does NOT include the node itself).
  function descendants(node, nodes, edges) {
    var out = buildAdj(nodes, edges).out;
    var seen = new Set();
    var stack = [node];
    while (stack.length) {
      var u = stack.pop();
      var nbrs = out[u] || [];
      for (var v of nbrs) {
        if (!seen.has(v)) { seen.add(v); stack.push(v); }
      }
    }
    return seen;
  }

  // Enumerate all simple undirected paths from X to Y. Each step records the
  // edge orientation as seen from the previous node:
  //   ori = '+'  prev -> curr (arrow into curr from prev)
  //   ori = '-'  prev <- curr (arrow into prev from curr)
  // The starting node carries ori = null.
  function allPaths(X, Y, nodes, edges) {
    var adj = buildAdj(nodes, edges);
    var out = adj.out, inn = adj.inn;
    var paths = [];
    var path = [{ node: X, ori: null }];
    var onPath = new Set([X]);
    var MAX = 5000;
    function dfs(u) {
      if (paths.length > MAX) return;
      if (u === Y) { paths.push(path.slice()); return; }
      var vo = out[u] || [];
      for (var v of vo) {
        if (onPath.has(v)) continue;
        onPath.add(v); path.push({ node: v, ori: '+' });
        dfs(v);
        path.pop(); onPath.delete(v);
      }
      var vi = inn[u] || [];
      for (var w of vi) {
        if (onPath.has(w)) continue;
        onPath.add(w); path.push({ node: w, ori: '-' });
        dfs(w);
        path.pop(); onPath.delete(w);
      }
    }
    dfs(X);
    return paths;
  }

  // Back-door path: the edge incident to X points INTO X (path[1].ori === '-').
  function isBackDoor(path) {
    return path.length >= 2 && path[1].ori === '-';
  }

  // Interior node V (index i) is a collider iff both incident edges point INTO V:
  //   prev -> V  iff path[i].ori   === '+'
  //   next -> V  iff path[i+1].ori === '-'
  function colliderIndices(path) {
    var idx = [];
    for (var i = 1; i < path.length - 1; i++) {
      if (path[i].ori === '+' && path[i + 1].ori === '-') idx.push(i);
    }
    return idx;
  }

  // d-separation: a path is OPEN given S iff every non-collider on it is outside
  // S AND every collider on it is in S or has a descendant in S. Returns true
  // when the path is BLOCKED.
  function pathBlocked(path, S, descSets) {
    var colliders = new Set(colliderIndices(path));
    for (var i = 1; i < path.length - 1; i++) {
      var node = path[i].node;
      if (colliders.has(i)) {
        var ds = descSets[node];
        var opened = S.has(node);
        if (!opened && ds) {
          for (var d of ds) { if (S.has(d)) { opened = true; break; } }
        }
        if (!opened) return true; // closed collider blocks
      } else {
        if (S.has(node)) return true; // conditioned chain/fork blocks
      }
    }
    return false;
  }

  // Pearl's back-door criterion for a candidate set S:
  //   (i)  no element of S is a descendant of X (and S excludes X)
  //   (ii) S blocks every back-door path from X to Y
  function isValidAdjustment(S, backdoorPaths, X, descX, descSets) {
    if (S.has(X)) return false;
    for (var s of S) { if (descX.has(s)) return false; }
    for (var p = 0; p < backdoorPaths.length; p++) {
      if (!pathBlocked(backdoorPaths[p], S, descSets)) return false;
    }
    return true;
  }

  // Lexicographic k-combinations of arr.
  function combinations(arr, k) {
    var out = []; var n = arr.length;
    if (k > n) return out;
    var idx = []; for (var t = 0; t < k; t++) idx.push(t);
    while (true) {
      out.push(idx.map(function (i) { return arr[i]; }));
      var i = k - 1;
      while (i >= 0 && idx[i] === n - k + i) i--;
      if (i < 0) break;
      idx[i]++;
      for (var j = i + 1; j < k; j++) idx[j] = idx[j - 1] + 1;
    }
    return out;
  }

  // Find every valid adjustment set, then keep those of minimum cardinality.
  // Return shape (consumed by the page renderer):
  //   { ok, paths, backdoor, causalPaths, allValid, minSets, minSize,
  //     candidates, descX, descSets, openBackdoorPaths, ivCandidates,
  //     identifiable }
  function findAdjustmentSets(X, Y, nodes, edges) {
    if (nodes.indexOf(X) < 0 || nodes.indexOf(Y) < 0 || X === Y) {
      return { ok: false, reason: 'Pick a valid exposure (X) and outcome (Y).' };
    }
    if (hasCycle(nodes, edges)) {
      return { ok: false, reason: 'Graph has a cycle. The DAG must be acyclic.' };
    }
    var descSets = {};
    for (var n = 0; n < nodes.length; n++) descSets[nodes[n]] = descendants(nodes[n], nodes, edges);
    var descX = descSets[X];
    var candidates = nodes.filter(function (v) { return v !== X && v !== Y && !descX.has(v); });
    var paths = allPaths(X, Y, nodes, edges);
    var backdoor = paths.filter(isBackDoor);
    var causalPaths = paths.filter(function (p) { return !isBackDoor(p); });
    var emptySet = new Set();
    var openBackdoorPaths = backdoor.filter(function (p) { return !pathBlocked(p, emptySet, descSets); });
    var allValid = [];
    var minSize = -1;
    for (var kk = 0; kk <= candidates.length; kk++) {
      var combos = combinations(candidates, kk);
      for (var c = 0; c < combos.length; c++) {
        var S = new Set(combos[c]);
        if (isValidAdjustment(S, backdoor, X, descX, descSets)) {
          if (minSize < 0) minSize = kk;
          allValid.push(combos[c]);
        }
      }
    }
    var minSets = allValid.filter(function (s) { return s.length === minSize; });
    // Instrumental-variable hint: Z with an edge into X, no edge into Y, and Z
    // is not a descendant of X. Surfaced only as a semantic note.
    var adjForIV = buildAdj(nodes, edges);
    var ivCandidates = [];
    for (var m = 0; m < nodes.length; m++) {
      var z = nodes[m];
      if (z === X || z === Y) continue;
      if (descX.has(z)) continue;
      if (!(adjForIV.out[z] && adjForIV.out[z].has(X))) continue;
      if (adjForIV.out[z] && adjForIV.out[z].has(Y)) continue;
      ivCandidates.push(z);
    }
    // identifiable by covariate adjustment iff at least one valid set exists.
    var identifiable = minSize >= 0;
    return {
      ok: true, paths: paths, backdoor: backdoor, causalPaths: causalPaths,
      allValid: allValid, minSets: minSets, minSize: minSize, candidates: candidates,
      descX: descX, descSets: descSets, openBackdoorPaths: openBackdoorPaths,
      ivCandidates: ivCandidates, identifiable: identifiable
    };
  }

  return {
    buildAdj: buildAdj,
    hasCycle: hasCycle,
    descendants: descendants,
    allPaths: allPaths,
    isBackDoor: isBackDoor,
    colliderIndices: colliderIndices,
    pathBlocked: pathBlocked,
    isValidAdjustment: isValidAdjustment,
    combinations: combinations,
    findAdjustmentSets: findAdjustmentSets
  };
}));
