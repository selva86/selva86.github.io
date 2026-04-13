import unittest

from Scripts.seo.common import canonicalize_url


class CanonicalizeTests(unittest.TestCase):
    def test_strips_query(self):
        self.assertEqual(
            canonicalize_url("https://r-statistics.co/R-Vectors.html?utm=x"),
            "https://r-statistics.co/R-Vectors.html",
        )

    def test_strips_fragment(self):
        self.assertEqual(
            canonicalize_url("https://r-statistics.co/R-Vectors.html#top"),
            "https://r-statistics.co/R-Vectors.html",
        )

    def test_lowercases_host(self):
        self.assertEqual(
            canonicalize_url("https://R-Statistics.CO/R-Vectors.html"),
            "https://r-statistics.co/R-Vectors.html",
        )

    def test_collapses_trailing_slash(self):
        self.assertEqual(
            canonicalize_url("https://r-statistics.co/about/"),
            "https://r-statistics.co/about",
        )

    def test_keeps_root_slash(self):
        self.assertEqual(
            canonicalize_url("https://r-statistics.co/"),
            "https://r-statistics.co/",
        )

    def test_keeps_path_case(self):
        self.assertEqual(
            canonicalize_url("https://r-statistics.co/R-Closures.html"),
            "https://r-statistics.co/R-Closures.html",
        )

    def test_empty_input(self):
        self.assertEqual(canonicalize_url(""), "")

    def test_forces_https(self):
        self.assertEqual(
            canonicalize_url("http://r-statistics.co/R-Vectors.html"),
            "https://r-statistics.co/R-Vectors.html",
        )

    def test_forces_https_with_query_and_uppercase_host(self):
        self.assertEqual(
            canonicalize_url("HTTP://R-Statistics.CO/About/?x=1"),
            "https://r-statistics.co/About",
        )


if __name__ == "__main__":
    unittest.main()
