"""Exact adjudicator for bayesian-ab-test-calculator (no quadrature at all).

Why this exists: R's integrate() and my JS both work in doubles, so when they
agree on a value like loss = 5e-29 the agreement proves nothing - both could be
reporting the same rounding noise. (Evidence they are: windowing the R integral
moved clear-winner's lossB from 1.2e-29 to 5.2e-29.)

For INTEGER shape parameters there is an exact finite sum for
P(X > Y), X~Beta(a,b), Y~Beta(c,d)  (Cook, "Exact calculation of beta
inequalities"), so nothing has to be integrated:

    P(X > Y) = 1 - sum_{i=0}^{c-1} B(a+i, b+d) / ( (d+i) B(1+i, d) B(a, b) )

Every posterior here has integer shapes whenever the prior does (a1 = a0 + cA
etc.), which covers all cases but the Jeffreys prior.

The losses then need no quadrature either:
    E[pB 1(pB>pA)] = mB P(B' > A),  B' ~ Beta(a2+1, b2)
    E[pA 1(pB>pA)] = mA P(B > A'),  A' ~ Beta(a1+1, b1)
    => loss_choose_A = E[max(pB-pA,0)] = mB P(B'>A) - mA P(B>A')

Run at 80 dp, the difference above is exact to far past double precision, so
the "negligible" losses can be checked rather than assumed.

The formula's orientation is not taken on trust: reproduce_known() re-derives a
case where R's integrate, a 4e6-draw Monte Carlo and the JS all already agree,
and refuses to emit anything unless the closed form lands on it to 1e-13.
"""
import json
from mpmath import mp, mpf, beta as B

mp.dps = 80


def p_x_gt_y(a, b, c, d):
    """P(X > Y) for X~Beta(a,b), Y~Beta(c,d). Requires integer c."""
    c_i = int(round(c))
    assert abs(c - c_i) < 1e-12, f'need integer c, got {c}'
    a, b, d = mpf(a), mpf(b), mpf(d)
    total = mpf(0)
    Bab = B(a, b)
    for i in range(c_i):
        i = mpf(i)
        total += B(a + i, b + d) / ((d + i) * B(1 + i, d) * Bab)
    return 1 - total


def p_b_gt_a(a1, b1, a2, b2):
    """P(pB > pA): X = B ~ Beta(a2,b2), Y = A ~ Beta(a1,b1) (a1 must be integer)."""
    return p_x_gt_y(a2, b2, a1, b1)


def loss_choose_a(a1, b1, a2, b2):
    """E[max(pB - pA, 0)] - expected loss of choosing A."""
    mA = mpf(a1) / (mpf(a1) + mpf(b1))
    mB = mpf(a2) / (mpf(a2) + mpf(b2))
    return mB * p_x_gt_y(a2 + 1, b2, a1, b1) - mA * p_x_gt_y(a2, b2, a1 + 1, b1)


def loss_choose_b(a1, b1, a2, b2):
    return loss_choose_a(a2, b2, a1, b1)


truth = json.load(open('Scripts/tool-truth/bayesian-ab-test-calculator.json'))


def reproduce_known():
    """Refuse to adjudicate with a formula that cannot reproduce a value three
    independent routes already agree on."""
    v = truth['typical']
    p = v['post']
    got = p_b_gt_a(p['a1'], p['b1'], p['a2'], p['b2'])
    want = mpf(repr(v['integ']['pBgtA']))
    rel = abs(got - want) / want
    print(f"orientation check (typical P(B>A)): closed form {mp.nstr(got, 17)} "
          f"vs R {mp.nstr(want, 17)}  rel {mp.nstr(rel, 3)}")
    assert rel < 1e-13, 'closed form does not reproduce a known-good value'
    # and the loss route, against the same case
    gotl = loss_choose_a(p['a1'], p['b1'], p['a2'], p['b2'])
    wantl = mpf(repr(v['integ']['lossChooseA']))
    rell = abs(gotl - wantl) / wantl
    print(f"orientation check (typical lossA):  closed form {mp.nstr(gotl, 17)} "
          f"vs R {mp.nstr(wantl, 17)}  rel {mp.nstr(rell, 3)}")
    assert rell < 1e-10, 'closed-form loss does not reproduce a known-good value'


reproduce_known()

out = {}
print(f"\n{'case':17} {'quantity':12} {'R (double)':>15} {'exact 80dp':>15} {'rel':>10}")
for name, v in truth.items():
    p = v['post']
    a1, b1, a2, b2 = p['a1'], p['b1'], p['a2'], p['b2']
    if abs(a1 - round(a1)) > 1e-12 or abs(a2 - round(a2)) > 1e-12:
        print(f"{name:17} skipped - non-integer shapes (Jeffreys prior), no exact sum")
        continue
    row = {}
    for q, fn in (('pBgtA', p_b_gt_a), ('lossChooseA', loss_choose_a),
                  ('lossChooseB', loss_choose_b)):
        exact = fn(a1, b1, a2, b2)
        rv = mpf(repr(v['integ'][q]))
        rel = abs(rv - exact) / exact if exact != 0 else mpf(0)
        row[q] = mp.nstr(exact, 30)
        print(f"{name:17} {q:12} {mp.nstr(rv, 9):>15} {mp.nstr(exact, 9):>15} {mp.nstr(rel, 3):>10}")
    out[name] = row

json.dump(out, open('Scripts/tool-truth/bayesian-ab-exact.json', 'w'), indent=1)
print(f'\nwrote {len(out)} exactly-adjudicated cases')
