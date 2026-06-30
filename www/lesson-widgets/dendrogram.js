/* dendrogram.js - hierarchical clustering as a merge tree. Leaves join into bigger and
 * bigger groups going up; the height of each join is how dissimilar the two groups were.
 * Drag the cut line down and the tree splits into more clusters - that is how you turn a
 * dendrogram into k groups. Emits runnable R that runs hclust and cuts the tree.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;
  var COL = [P.c0, P.acc, (P.c2 || '#c9a24a'), '#7a8a55', '#9a6a9a'];
  // 8 leaves; merges as [left, right, height] building a binary tree (precomputed, plausible)
  var LEAVES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  var MERGES = [
    { l: { leaf: 0 }, r: { leaf: 1 }, h: 0.8 },
    { l: { leaf: 2 }, r: { leaf: 3 }, h: 1.0 },
    { l: { leaf: 5 }, r: { leaf: 6 }, h: 0.9 },
    { l: { leaf: 4 }, r: { m: 2 }, h: 1.6 },
    { l: { m: 0 }, r: { m: 1 }, h: 2.4 },
    { l: { m: 3 }, r: { leaf: 7 }, h: 2.9 },
    { l: { m: 4 }, r: { m: 5 }, h: 4.2 }
  ];

  function mount(el, cfg) {
    cfg = cfg || {}; var cut = 3.4, HMAX = 4.6;
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="dn-plot"></div>' +
      '<label style="display:block;font:600 12.5px/1.6 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:12px 0 2px">cut height <b class="dn-h" style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '"></b>' +
        '<input class="dn-s" type="range" min="0.4" max="4.4" step="0.05" value="3.4" style="width:100%;accent-color:' + P.acc + '"></label>' +
      '<div class="dn-read" style="font:13px/1.5 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:8px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Run hclust and cut the tree in R' });

    var plot = el.querySelector('.dn-plot'), read = el.querySelector('.dn-read'), slider = el.querySelector('.dn-s'), hEl = el.querySelector('.dn-h');
    var W = 420, H = 220, m = 24, leafX = {}, lw = (W - 2 * m) / (LEAVES.length - 1);
    LEAVES.forEach(function (_, i) { leafX[i] = m + i * lw; });
    function px(node) { return node.leaf != null ? leafX[node.leaf] : (px(MERGES[node.m].l) + px(MERGES[node.m].r)) / 2; }
    function py(h) { return (H - 22) - h / HMAX * (H - 40); }
    // cluster id below the cut: assign colours
    function clustersBelow() {
      var id = LEAVES.map(function (_, i) { return i; }), next = LEAVES.length;
      MERGES.forEach(function (mg, mi) { if (mg.h <= cut) { /* merge clusters of l and r */ var li = repId(mg.l), ri = repId(mg.r); var a = id[li], b = id[ri]; for (var k = 0; k < id.length; k++) if (id[k] === b) id[k] = a; mg._cl = a; } });
      function repId(node) { return node.leaf != null ? node.leaf : firstLeaf(MERGES[node.m]); }
      function firstLeaf(mg2) { return mg2.l.leaf != null ? mg2.l.leaf : firstLeaf(MERGES[mg2.l.m]); }
      // relabel to 0..k-1
      var uniq = {}, c = 0, out = id.map(function (v) { if (uniq[v] == null) uniq[v] = c++; return uniq[v]; });
      return { id: out, k: c };
    }
    function leafColor(i, cl) { return COL[cl.id[i] % COL.length]; }
    function draw() {
      var cl = clustersBelow();
      var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="dendrogram">';
      MERGES.forEach(function (mg) {
        var xl = px(mg.l), xr = px(mg.r), y = py(mg.h), yl = py(mg.l.leaf != null ? 0 : MERGES[mg.l.m].h), yr = py(mg.r.leaf != null ? 0 : MERGES[mg.r.m].h);
        var col = mg.h <= cut ? COL[(mg._cl || 0) % COL.length] : P.mut;
        svg += '<path d="M' + xl + ',' + yl + ' V' + y + ' H' + xr + ' V' + yr + '" fill="none" stroke="' + col + '" stroke-width="2"/>';
      });
      LEAVES.forEach(function (lab, i) { svg += '<circle cx="' + leafX[i] + '" cy="' + py(0) + '" r="4" fill="' + leafColor(i, cl) + '"/><text x="' + leafX[i] + '" y="' + (H - 6) + '" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="10" fill="' + P.mut + '">' + lab + '</text>'; });
      svg += '<line x1="' + m + '" y1="' + py(cut).toFixed(1) + '" x2="' + (W - m) + '" y2="' + py(cut).toFixed(1) + '" stroke="' + P.ink + '" stroke-dasharray="5 3"/>';
      svg += '</svg>'; plot.innerHTML = svg;
      read.innerHTML = 'Cutting at height <b style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '">' + cut.toFixed(1) + '</b> gives <b>' + cl.k + '</b> cluster' + (cl.k === 1 ? '' : 's') + '. Lower the cut for more, finer clusters; raise it to merge them.';
      hEl.textContent = cut.toFixed(1);
    }
    slider.addEventListener('input', function () { cut = +slider.value; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# Hierarchical clustering builds a tree of merges; cut it at a height to get k groups.',
      'd <- dist(scale(iris[, 1:4]))         # pairwise distances',
      'hc <- hclust(d, method = "ward.D2")',
      'plot(hc, labels = FALSE)              # the dendrogram',
      '',
      'groups <- cutree(hc, k = 3)           # cut into 3 clusters',
      'table(groups, iris$Species)           # do the cuts match the species?'
    ].join('\n');
  }

  window.LessonWidgets.register('dendrogram', mount);
})();
