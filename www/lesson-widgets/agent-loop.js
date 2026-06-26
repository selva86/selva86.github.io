/* agent-loop.js - the ReAct agent cycle (Thought -> Action -> Observation,
 * repeating until it can Answer), stepped through a worked trace. The cycle
 * nodes light up by phase; Step reveals the trace one entry at a time. Static
 * structure + a Step/Reset control. Reusable for any LLM-agent lesson.
 * cfg (optional): { trace:[{p:'Thought|Action|Observation|Answer', t:'...'}] }
 */
(function () {
  'use strict';
  var INK = '#131720', MUT = '#677084', ACC = '#1f7a55', LINE = '#c5cdda';
  var PC = { Thought: '#2563a8', Action: '#1f7a55', Observation: '#b5631a', Answer: '#8a46b0' };

  function mount(el, cfg) {
    cfg = cfg || {};
    var trace = (cfg.trace && cfg.trace.length) ? cfg.trace : [
      { p: 'Thought', t: 'The user wants the overall churn rate; I should query the data.' },
      { p: 'Action', t: 'run_sql("SELECT AVG(churned) FROM customers")' },
      { p: 'Observation', t: '0.062' },
      { p: 'Thought', t: '6.2% overall. They also asked which plan churns worst.' },
      { p: 'Action', t: 'run_sql("... GROUP BY plan ORDER BY churn DESC LIMIT 1")' },
      { p: 'Observation', t: 'plan = "basic", churn = 0.11' },
      { p: 'Answer', t: 'Churn is 6.2% overall; the basic plan is worst at 11%.' }
    ];
    var i = 0;

    el.innerHTML =
      '<div class="lw-diagram">' +
      '<div class="al-cycle" style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;align-items:center;margin-bottom:12px"></div>' +
      '<div class="al-trace" style="border:1px solid ' + LINE + ';border-radius:10px;padding:8px 12px;min-height:118px;background:#fff"></div>' +
      '<div style="text-align:center;margin-top:10px">' +
        '<button type="button" class="al-step" style="font:600 12px \'IBM Plex Mono\',monospace;color:#fff;background:' + ACC + ';border:0;border-radius:7px;padding:8px 16px;cursor:pointer">Step &rarr;</button> ' +
        '<button type="button" class="al-reset" style="font:600 12px \'IBM Plex Mono\',monospace;color:' + MUT + ';background:none;border:1px solid ' + LINE + ';border-radius:7px;padding:8px 14px;cursor:pointer">Reset</button>' +
      '</div></div>';

    var cycle = el.querySelector('.al-cycle'), traceEl = el.querySelector('.al-trace'),
        stepBtn = el.querySelector('.al-step'), resetBtn = el.querySelector('.al-reset');
    cycle.innerHTML = ['Thought', 'Action', 'Observation'].map(function (p) {
      return '<span class="al-node" data-p="' + p + '" style="font:600 11px \'IBM Plex Mono\',monospace;border:1.5px solid ' + LINE + ';border-radius:20px;padding:6px 12px;color:' + MUT + '">' + p + '</span>';
    }).join('<span style="color:' + MUT + '">&rarr;</span>') + '<span style="color:' + MUT + ';font-size:15px">&#8635;</span>';
    var nodes = cycle.querySelectorAll('.al-node');

    function render() {
      var html = '', k;
      for (k = 0; k < i; k++) {
        var s = trace[k], c = PC[s.p] || MUT;
        html += '<div style="margin:5px 0;font:13px/1.5 \'IBM Plex Sans\',system-ui,sans-serif">' +
          '<span style="font-family:\'IBM Plex Mono\',monospace;font-size:11px;font-weight:700;color:' + c + '">' + s.p + '</span> ' +
          '<span style="color:' + INK + '">' + s.t + '</span></div>';
      }
      traceEl.innerHTML = html || '<div style="color:' + MUT + ';font:13px \'IBM Plex Sans\',system-ui,sans-serif">Press Step to watch the agent reason, act, and observe in a loop until it can answer.</div>';
      var active = i > 0 ? trace[i - 1].p : null;
      Array.prototype.forEach.call(nodes, function (n) {
        var on = n.getAttribute('data-p') === active;
        n.style.borderColor = on ? PC[active] : LINE;
        n.style.color = on ? PC[active] : MUT;
      });
      stepBtn.disabled = i >= trace.length;
      stepBtn.style.opacity = i >= trace.length ? '.5' : '1';
    }
    stepBtn.addEventListener('click', function () { if (i < trace.length) { i++; render(); } });
    resetBtn.addEventListener('click', function () { i = 0; render(); });
    render();
  }
  if (window.LessonWidgets) window.LessonWidgets.register('agent-loop', mount);
})();
