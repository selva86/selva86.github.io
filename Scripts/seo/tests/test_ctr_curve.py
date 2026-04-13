import unittest

from Scripts.seo.ctr_curve import CTR_TABLE, lookup_ctr


class CtrCurveTests(unittest.TestCase):
    def test_integer_lookup(self):
        for pos, ctr in CTR_TABLE.items():
            self.assertAlmostEqual(lookup_ctr(pos), ctr, places=6)

    def test_interpolation(self):
        expected = 0.5 * CTR_TABLE[5] + 0.5 * CTR_TABLE[6]
        self.assertAlmostEqual(lookup_ctr(5.5), expected, places=6)

    def test_clamp_low(self):
        self.assertAlmostEqual(lookup_ctr(0.1), CTR_TABLE[1], places=6)
        self.assertAlmostEqual(lookup_ctr(-5), CTR_TABLE[1], places=6)

    def test_clamp_high(self):
        self.assertAlmostEqual(lookup_ctr(25), CTR_TABLE[20], places=6)
        self.assertAlmostEqual(lookup_ctr(20.0), CTR_TABLE[20], places=6)

    def test_monotonic_decreasing(self):
        vals = [CTR_TABLE[i] for i in range(1, 21)]
        for a, b in zip(vals, vals[1:]):
            self.assertGreaterEqual(a, b)

    def test_none_input(self):
        self.assertAlmostEqual(lookup_ctr(None), CTR_TABLE[20], places=6)


if __name__ == "__main__":
    unittest.main()
