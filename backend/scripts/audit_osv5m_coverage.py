#!/usr/bin/env python3
"""
OSV-5M Coverage Audit Script

Checks if OSV-5M dataset has sufficient images near the 4 failure locations:
- Marrakech Medina
- Cape Point
- Copacabana Beach
- Table Mountain

Usage:
    cd backend/scripts
    python audit_osv5m_coverage.py

Requirements:
    pip install pandas huggingface_hub
"""

import json
import sys
from math import radians, cos, sin, asin, sqrt
from pathlib import Path

def haversine(lon1: float, lat1: float, lon2: float, lat2: float) -> float:
    """Calculate distance in km between two lat/lon points."""
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    return 2 * asin(sqrt(a)) * 6371  # Earth radius in km


def main():
    # Failure locations from validation benchmark
    targets = [
        {"name": "Marrakech", "lat": 31.6295, "lon": -7.9811},
        {"name": "CapePoint", "lat": -34.3570, "lon": 18.4971},
        {"name": "Copacabana", "lat": -22.9714, "lon": -43.1822},
        {"name": "TableMountain", "lat": -33.9628, "lon": 18.4098},
    ]

    print("=" * 60)
    print("OSV-5M Coverage Audit for GeoWraith Failure Locations")
    print("=" * 60)
    print()

    try:
        import pandas as pd
        from huggingface_hub import hf_hub_download
    except ImportError:
        print("ERROR: Required libraries not installed.")
        print("Install with: pip install pandas huggingface_hub")
        sys.exit(1)

    # Create output directory
    output_dir = Path("../../.cache/osv5m_audit")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Check if we already have the metadata
    metadata_file = output_dir / "train.csv"
    
    if metadata_file.exists():
        print(f"Loading cached metadata from {metadata_file}...")
        print("(This may take a minute for the 2.9GB file)")
        df = pd.read_csv(metadata_file)
    else:
        print("Downloading OSV-5M metadata from Hugging Face...")
        print("File: train.csv (2.9GB)")
        print("This will take 15-45 minutes depending on connection speed...")
        print()
        
        try:
            # Download the CSV file
            downloaded_path = hf_hub_download(
                repo_id="osv5m/osv5m",
                filename="train.csv",
                repo_type="dataset",
                local_dir=str(output_dir),
                local_dir_use_symlinks=False
            )
            print(f"Downloaded to: {downloaded_path}")
            print()
            print("Loading CSV file (this may take a minute)...")
            df = pd.read_csv(downloaded_path)
            
        except Exception as e:
            print(f"ERROR: Failed to download OSV-5M metadata: {e}")
            print()
            print("Alternative approaches:")
            print("1. Download manually from: https://huggingface.co/datasets/osv5m/osv5m")
            print("   Place train.csv in: backend/.cache/osv5m_audit/")
            print("2. Skip OSV-5M and proceed with LLM verifier (Phase 2)")
            sys.exit(1)

    print(f"Loaded {len(df):,} images from OSV-5M")
    print()

    radius_km = 50
    results = {}

    print(f"Searching for images within {radius_km}km of each target...")
    print("-" * 60)

    # Check column names
    print(f"Available columns: {list(df.columns)}")
    
    # Try to find lat/lon columns
    lat_col = None
    lon_col = None
    id_col = None
    
    for col in df.columns:
        if col.lower() in ['latitude', 'lat']:
            lat_col = col
        if col.lower() in ['longitude', 'lon', 'lng', 'long']:
            lon_col = col
        if col.lower() in ['id', 'image_id', 'photo_id']:
            id_col = col
    
    if not lat_col or not lon_col:
        print("ERROR: Could not find latitude/longitude columns in dataset")
        print("Available columns:", list(df.columns))
        sys.exit(1)
    
    if not id_col:
        id_col = df.columns[0]
    
    print(f"Using columns: id={id_col}, lat={lat_col}, lon={lon_col}")
    print()

    for target in targets:
        print(f"\nSearching near {target['name']} ({target['lat']}, {target['lon']})...")
        
        # Calculate distances for all images (vectorized for speed)
        lats = df[lat_col].astype(float)
        lons = df[lon_col].astype(float)
        
        # Vectorized haversine calculation
        lat1, lon1 = radians(target["lat"]), radians(target["lon"])
        lat2, lon2 = lats.apply(radians), lons.apply(radians)
        
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        
        a = (dlat/2).apply(sin)**2 + cos(lat1) * lat2.apply(cos) * (dlon/2).apply(sin)**2
        distances = 2 * 6371 * a.apply(lambda x: asin(sqrt(x)) if x <= 1 else float('nan'))
        
        # Filter images within radius
        nearby_mask = distances <= radius_km
        nearby_count = nearby_mask.sum()
        
        # Get sample of nearby images
        nearby_df = df[nearby_mask].head(5)
        sample = nearby_df.apply(
            lambda row: {
                "id": str(row[id_col]),
                "lat": float(row[lat_col]),
                "lon": float(row[lon_col]),
                "distance_km": round(float(distances[row.name]), 2),
            },
            axis=1
        ).tolist() if len(nearby_df) > 0 else []
        
        results[target["name"]] = {
            "target": target,
            "count": int(nearby_count),
            "sample": sample,
        }

        print(f"  Found: {nearby_count:,} images within {radius_km}km")
        
        # Save IDs for targeted download (first 5000)
        nearby_ids = df[nearby_mask][id_col].head(5000).astype(str).tolist()
        if nearby_ids:
            ids_file = output_dir / f"osv5m_{target['name'].lower()}_nearby.txt"
            with open(ids_file, "w") as f:
                for img_id in nearby_ids:
                    f.write(f"{img_id}\n")
            print(f"  Saved {len(nearby_ids)} IDs to: {ids_file}")

    # Summary
    print()
    print("=" * 60)
    print("AUDIT SUMMARY")
    print("=" * 60)
    print()
    
    total_images = sum(r["count"] for r in results.values())
    print(f"Total images found within {radius_km}km of all targets: {total_images:,}")
    print()
    
    for name, data in results.items():
        status = "✅ SUFFICIENT" if data["count"] >= 100 else "⚠️  LOW"
        print(f"{name:15} | {data['count']:6,} images | {status}")
    
    print()
    
    # Decision
    min_count = min(r["count"] for r in results.values())
    if min_count >= 100:
        print("✅ RECOMMENDATION: Proceed with OSV-5M densification")
        print("   All failure locations have sufficient coverage.")
    elif min_count >= 50:
        print("⚠️  RECOMMENDATION: Proceed with caution")
        print("   Some locations have limited coverage but may still help.")
    else:
        print("❌ RECOMMENDATION: Skip OSV-5M densification")
        print("   Insufficient coverage to justify the effort.")
        print("   Consider Phase 2 (LLM verifier) instead.")
    
    print()
    
    # Save full report
    report_file = output_dir / "coverage_report.json"
    with open(report_file, "w") as f:
        json.dump({
            "targets": targets,
            "radius_km": radius_km,
            "results": results,
            "recommendation": "proceed" if min_count >= 100 else "skip",
        }, f, indent=2)
    print(f"Full report saved to: {report_file}")


if __name__ == "__main__":
    main()
