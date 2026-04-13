import unittest
from pathlib import Path

from Scripts.seo.common import connect_to_cache
from Scripts.seo.fixtures.build_fixture import FIXTURE_PATH, build
from Scripts.seo.levers import (
    backlog as backlog_mod,
    cannibalization,
    content_gaps,
    decay,
    low_ctr,
    striking_distance,
)


class LeverTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        build()
        cls.con = connect_to_cache(FIXTURE_PATH)

    @classmethod
    def tearDownClass(cls):
        cls.con.close()

    def test_striking_distance_finds_bayesian(self):
        out = striking_distance.find(self.con, window_days=150)
        queries = [r["query"] for r in out]
        self.assertIn("bayesian regression in r", queries)

    def test_low_ctr_finds_closures(self):
        main, ambig = low_ctr.find(self.con, window_days=150)
        queries = [r["query"] for r in main]
        self.assertIn("r closures explained", queries)

    def test_cannibalization_finds_linear_regression(self):
        out = cannibalization.find(self.con, window_days=150)
        queries = [r["query"] for r in out]
        self.assertIn("linear regression r tutorial", queries)

    def test_content_gaps_finds_off_topic(self):
        out = content_gaps.find(self.con, window_days=150)
        queries = [r["query"] for r in out]
        self.assertTrue(
            "r vs python data science" in queries
            or "shapiro wilk test normality" in queries
        )

    def test_decay_finds_kmeans(self):
        out = decay.find(self.con)
        pages = [r["page"] for r in out]
        self.assertTrue(any("KMeans-Clustering" in p for p in pages))

    def test_backlog_merge_sorts_by_score(self):
        strike = striking_distance.find(self.con, window_days=150)
        main, _ = low_ctr.find(self.con, window_days=150)
        merged = backlog_mod.merge(strike, main)
        scores = [r["score"] for r in merged]
        self.assertEqual(scores, sorted(scores, reverse=True))


if __name__ == "__main__":
    unittest.main()
