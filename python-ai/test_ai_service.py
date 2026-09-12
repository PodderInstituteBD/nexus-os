import unittest
import tempfile
import os
import sys
import json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from processor import analyze_csv_data

class TestProcessor(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.NamedTemporaryFile(delete=False, mode='w', suffix='.csv', encoding='utf-8')
        self.tmp.write("task,estimate_hours,velocity,risk\n")
        self.tmp.write("Auth Module,12.5,4.2,Low\n")
        self.tmp.write("Database Migration,8.0,3.8,Medium\n")
        self.tmp.write("API Gateway,16.0,4.5,High\n")
        self.tmp.write("Frontend UI,20.0,5.0,Low\n")
        self.tmp.close()

    def tearDown(self):
        if os.path.exists(self.tmp.name):
            os.remove(self.tmp.name)

    def test_csv_analysis_summary(self):
        result = analyze_csv_data(self.tmp.name)
        self.assertEqual(result["status"], "success")
        self.assertEqual(result["total_rows"], 4)
        self.assertEqual(result["total_columns"], 4)
        self.assertIn("estimate_hours", result["correlation_matrix"])
        
        # Test numeric column stats
        est_col = next(c for c in result["columns"] if c["name"] == "estimate_hours")
        self.assertEqual(est_col["type"], "numeric")
        self.assertAlmostEqual(est_col["stats"]["mean"], 14.125, places=2)

if __name__ == "__main__":
    unittest.main()
