/* survival-math.js - log-rank / Cox trial-planning math for Tool Farm v2.
   Ground truth: R 4.6.0 qnorm/pnorm for the closed-form event & power
   formulas, and R integrate() for the event-probability integrals (see
   Scripts/tool-truth/survival-power.json, 1182 cases <=1e-6).

   All time inputs are in MONTHS. Composes normal-math.js for the
   R-matching normal CDF/quantile. Browser global (window.SurvivalMath)
   + Node (require). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./normal-math.js'));
  } else {
    root.SurvivalMath = factory(root.NormalMath);
  }
}(typeof self !== 'undefined' ? self : this, function (NM) {
  'use strict';

  var pnorm = NM.pnorm, qnorm = NM.qnorm;
  var LN2 = Math.log(2);

  // z_{1-alpha/sided} + z_{power}
  function zsum(alpha, power, sided) {
    return qnorm(1 - alpha / sided) + qnorm(power);
  }

  // ---- required total events -----------------------------------------
  // Schoenfeld (1981/1983): the standard log-rank / Cox sample-size result.
  function schoenfeldEvents(HR, alpha, power, k, sided) {
    sided = sided || 2;
    if (!(HR > 0) || HR === 1) return Infinity;
    var z = zsum(alpha, power, sided);
    var l = Math.log(HR);
    return z * z * (1 + k) * (1 + k) / (k * l * l);
  }

  // Freedman (1982): the classical variance form, slightly more
  // conservative than Schoenfeld away from HR = 1.
  function freedmanEvents(HR, alpha, power, k, sided) {
    sided = sided || 2;
    if (!(HR > 0) || HR === 1) return Infinity;
    var z = zsum(alpha, power, sided);
    var ratio = (1 + k * HR) / (1 - HR);
    return ratio * ratio * z * z / k;
  }

  function requiredEvents(method, HR, alpha, power, k, sided) {
    return method === 'freedman'
      ? freedmanEvents(HR, alpha, power, k, sided)
      : schoenfeldEvents(HR, alpha, power, k, sided);
  }

  // ---- power given a fixed number of events --------------------------
  function powerFromEvents(D, HR, alpha, k, sided) {          // Schoenfeld inverse
    sided = sided || 2;
    if (!(D > 0) || !(HR > 0) || HR === 1) return 0;
    var za = qnorm(1 - alpha / sided);
    return pnorm(Math.sqrt(D * k) / (1 + k) * Math.abs(Math.log(HR)) - za);
  }
  function powerFromEventsFreedman(D, HR, alpha, k, sided) {  // Freedman inverse
    sided = sided || 2;
    if (!(D > 0) || !(HR > 0) || HR === 1) return 0;
    var za = qnorm(1 - alpha / sided);
    return pnorm(Math.sqrt(D * k) * Math.abs(1 - HR) / (1 + k * HR) - za);
  }
  function powerFromEventsBy(method, D, HR, alpha, k, sided) {
    return method === 'freedman'
      ? powerFromEventsFreedman(D, HR, alpha, k, sided)
      : powerFromEvents(D, HR, alpha, k, sided);
  }

  // ---- hazards -------------------------------------------------------
  function medianToHazard(median) { return LN2 / median; }

  // annual loss-to-follow-up eta -> constant monthly dropout hazard
  function dropoutMonthlyHazard(annual) {
    if (!(annual > 0)) return 0;
    if (annual >= 1) annual = 0.999;
    return -Math.log(1 - annual) / 12;
  }

  // ---- probability that a patient contributes an event --------------
  // Exponential survival at hazard lambda, uniform accrual over [0, A],
  // followed to calendar time A+F (so a patient enrolled at u is followed
  // for A+F-u). Closed form = integral over u / A. Validated vs R integrate.
  function pEventExp(lambda, A, F) {
    if (A <= 0) return 1 - Math.exp(-lambda * F);
    if (lambda <= 0) return 0;
    var term = (Math.exp(-lambda * F) - Math.exp(-lambda * (A + F))) / (lambda * A);
    return 1 - term;
  }

  // Same, but with a competing exponential dropout hazard mu. Cause-specific
  // event probability = (lambda/(lambda+mu)) * (1 - exp(-(lambda+mu)*t)).
  function pEventWithDropout(lambda, mu, A, F) {
    if (mu <= 0) return pEventExp(lambda, A, F);
    var tot = lambda + mu;
    if (A <= 0) return (lambda / tot) * (1 - Math.exp(-tot * F));
    var term = (Math.exp(-tot * F) - Math.exp(-tot * (A + F))) / (tot * A);
    return (lambda / tot) * (1 - term);
  }

  // ---- end-to-end planner -------------------------------------------
  // p = {HR, alpha, power, k, medianC, accrual, followup, dropoutAnnual,
  //      method, sided}. Returns hazards, per-arm event probabilities,
  //      required events D, and enrollment n (total + per arm).
  function plan(p) {
    var sided = p.sided || 2;
    var lamC = medianToHazard(p.medianC);
    var lamT = p.HR * lamC;
    var mu = dropoutMonthlyHazard(p.dropoutAnnual || 0);
    var useDrop = mu > 0;
    var pEC = useDrop ? pEventWithDropout(lamC, mu, p.accrual, p.followup)
                      : pEventExp(lamC, p.accrual, p.followup);
    var pET = useDrop ? pEventWithDropout(lamT, mu, p.accrual, p.followup)
                      : pEventExp(lamT, p.accrual, p.followup);
    var pEbar = (pEC + p.k * pET) / (1 + p.k);
    var D = requiredEvents(p.method, p.HR, p.alpha, p.power, p.k, sided);
    var nTotal = pEbar > 0 ? D / pEbar : Infinity;
    return {
      lamC: lamC, lamT: lamT, mu: mu,
      pEC: pEC, pET: pET, pEbar: pEbar,
      D: D, nTotal: nTotal,
      n1: nTotal / (1 + p.k), n2: p.k * nTotal / (1 + p.k)
    };
  }

  // Power achieved for a given total enrollment n (power mode). Expected
  // events = n * pEbar, then the method's power-from-events inverse.
  function powerAt(p) {
    var sided = p.sided || 2;
    var lamC = medianToHazard(p.medianC);
    var lamT = p.HR * lamC;
    var mu = dropoutMonthlyHazard(p.dropoutAnnual || 0);
    var useDrop = mu > 0;
    var pEC = useDrop ? pEventWithDropout(lamC, mu, p.accrual, p.followup)
                      : pEventExp(lamC, p.accrual, p.followup);
    var pET = useDrop ? pEventWithDropout(lamT, mu, p.accrual, p.followup)
                      : pEventExp(lamT, p.accrual, p.followup);
    var pEbar = (pEC + p.k * pET) / (1 + p.k);
    var eventsExpected = p.n * pEbar;
    var power = powerFromEventsBy(p.method, eventsExpected, p.HR, p.alpha, p.k, sided);
    return { pEC: pEC, pET: pET, pEbar: pEbar, eventsExpected: eventsExpected, powerAchieved: power };
  }

  // survival S(t) for the exponential model (viz)
  function survExp(lambda, t) { return Math.exp(-lambda * t); }

  return {
    schoenfeldEvents: schoenfeldEvents,
    freedmanEvents: freedmanEvents,
    requiredEvents: requiredEvents,
    powerFromEvents: powerFromEvents,
    powerFromEventsFreedman: powerFromEventsFreedman,
    powerFromEventsBy: powerFromEventsBy,
    medianToHazard: medianToHazard,
    dropoutMonthlyHazard: dropoutMonthlyHazard,
    pEventExp: pEventExp,
    pEventWithDropout: pEventWithDropout,
    plan: plan,
    powerAt: powerAt,
    survExp: survExp
  };
}));
