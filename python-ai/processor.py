#!/usr/bin/env python3
import sys
import json
import csv
import math
import statistics
import os

def analyze_csv_data(filepath):
    if not os.path.exists(filepath):
        return {"error": f"File not found: {filepath}"}
    
    rows = []
    headers = []
    with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
        reader = csv.reader(f)
        try:
            headers = next(reader)
        except StopIteration:
            return {"error": "Empty CSV file"}
        
        for row in reader:
            if row:
                rows.append(row)
    
    total_rows = len(rows)
    total_cols = len(headers)
    
    columns_summary = []
    numeric_columns = {}
    
    for col_idx, col_name in enumerate(headers):
        col_values = [row[col_idx] if col_idx < len(row) else "" for row in rows]
        non_empty = [v.strip() for v in col_values if v.strip() != ""]
        
        num_vals = []
        for v in non_empty:
            try:
                num_vals.append(float(v))
            except ValueError:
                pass
        
        is_numeric = len(num_vals) > (len(non_empty) * 0.8) and len(num_vals) > 0
        
        col_info = {
            "name": col_name,
            "total_values": len(col_values),
            "non_empty": len(non_empty),
            "type": "numeric" if is_numeric else "text",
            "unique_count": len(set(col_values))
        }
        
        if is_numeric and num_vals:
            numeric_columns[col_name] = num_vals
            sorted_vals = sorted(num_vals)
            n = len(sorted_vals)
            mean_val = statistics.mean(num_vals)
            stdev_val = statistics.stdev(num_vals) if n > 1 else 0.0
            median_val = statistics.median(sorted_vals)
            min_val = min(sorted_vals)
            max_val = max(sorted_vals)
            q1 = sorted_vals[int(n * 0.25)] if n > 3 else min_val
            q3 = sorted_vals[int(n * 0.75)] if n > 3 else max_val
            
            col_info["stats"] = {
                "count": n,
                "mean": round(mean_val, 4),
                "std": round(stdev_val, 4),
                "median": round(median_val, 4),
                "min": round(min_val, 4),
                "max": round(max_val, 4),
                "q1": round(q1, 4),
                "q3": round(q3, 4),
                "skewness": round((mean_val - median_val) / (stdev_val + 1e-9), 4)
            }
        else:
            freq = {}
            for v in non_empty[:200]:
                freq[v] = freq.get(v, 0) + 1
            top_categories = sorted(freq.items(), key=lambda x: x[1], reverse=True)[:5]
            col_info["top_categories"] = [{"value": k, "count": v} for k, v in top_categories]
            
        columns_summary.append(col_info)
    
    correlation_matrix = {}
    num_keys = list(numeric_columns.keys())
    if len(num_keys) >= 2:
        for i, k1 in enumerate(num_keys):
            correlation_matrix[k1] = {}
            for j, k2 in enumerate(num_keys):
                v1 = numeric_columns[k1]
                v2 = numeric_columns[k2]
                min_len = min(len(v1), len(v2))
                if min_len > 1:
                    m1 = statistics.mean(v1[:min_len])
                    m2 = statistics.mean(v2[:min_len])
                    num = sum((x - m1) * (y - m2) for x, y in zip(v1[:min_len], v2[:min_len]))
                    den = math.sqrt(sum((x - m1)**2 for x in v1[:min_len]) * sum((y - m2)**2 for y in v2[:min_len]))
                    corr = num / den if den != 0 else 0.0
                    correlation_matrix[k1][k2] = round(corr, 3)
                else:
                    correlation_matrix[k1][k2] = 1.0
    
    preview_rows = []
    for row in rows[:10]:
        preview_rows.append({headers[i]: (row[i] if i < len(row) else "") for i in range(len(headers))})
        
    return {
        "status": "success",
        "file_name": os.path.basename(filepath),
        "total_rows": total_rows,
        "total_columns": total_cols,
        "headers": headers,
        "columns": columns_summary,
        "correlation_matrix": correlation_matrix,
        "preview": preview_rows
    }

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: processor.py <csv_filepath>"}))
        sys.exit(1)
    
    file_path = sys.argv[1]
    result = analyze_csv_data(file_path)
    print(json.dumps(result))

if __name__ == "__main__":
    main()
