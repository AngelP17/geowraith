# GeoWraith Accuracy Improvement Plan

**Goal:** Distinguish Istanbul from Liverpool (city-level accuracy)  
**Current:** 143 km median error, cannot distinguish similar-latitude cities  
**Target:** 5-10 km median error for city-level precision

---

## Current System Diagnosis

### Why It Fails at City-Level

1. **GeoCLIP is region-trained** — it distinguishes continents/countries, not cities
2. **Coordinate-only matching** — Istanbul and Liverpool are both ~51°N, embeddings are similar
3. **No visual feature matching** — can't tell Hagia Sophia from Liverpool Cathedral visually
4. **No pose refinement** — no SfM to triangulate exact camera position

### Evidence: 27-Image Validation

| Metric | Result | Assessment |
|--------|--------|------------|
| Median error | 143 km | Country-level at best |
| Within 100 km | 44% | Less than half correct |
| City outliers | Times Square: 12,972 km | Total failure on urban scenes |

**The Istanbul/Liverpool problem is real** — both are northern, coastal, urban = similar embeddings.

---

## Phase 1: City-Level Training Data (Ready to Execute)

### 1.1 Scrape Dense City Datasets

**Tool:** `npm run scrape:city` (multi-source, already implemented)

**Priority cities to scrape:**
```bash
# High priority (test the Istanbul vs Liverpool hypothesis)
npm run scrape:city -- --city="Istanbul" --count=1000 --sources=wikimedia
npm run scrape:city -- --city="Liverpool" --count=1000 --sources=wikimedia
npm run scrape:city -- --city="London" --count=1000 --sources=wikimedia
npm run scrape:city -- --city="Paris" --count=1000 --sources=wikimedia

# Secondary (expand dataset)
npm run scrape:city -- --city="Barcelona" --count=1000 --sources=wikimedia
npm run scrape:city -- --city="Rome" --count=1000 --sources=wikimedia
npm run scrape:city -- --city="Berlin" --count=1000 --sources=wikimedia
npm run scrape:city -- --city="Amsterdam" --count=1000 --sources=wikimedia
```

**Expected yield:** 500-2000 images per city (depending on category size)

Note: Openverse requests returned HTTP 401 in this workspace; use `--sources=wikimedia` unless Openverse access is configured.

### 1.2 Fine-Tune GeoCLIP on City Pairs

**Objective:** Train model to distinguish similar-latitude cities

**Training strategy:**
```python
# Contrastive learning on city pairs
# Positive pairs: (image from Istanbul, Istanbul coordinates)
# Hard negatives: (image from Istanbul, Liverpool coordinates)
# Loss: Contrastive + distance-based regression
```

**Implementation:**
- Use `sentence-transformers` or `transformers` library
- Fine-tune GeoCLIP vision encoder
- Add coordinate regression head
- Train for 3-5 epochs on city dataset

**Expected improvement:** 143 km → 50-100 km

### 1.3 Test Istanbul vs Liverpool Classification

**Validation:**
- Hold out 20% of scraped images for testing
- Measure: Can the model correctly classify Istanbul vs Liverpool images?
- Target: >90% accuracy on binary classification

---

## Phase 2: Visual Feature Matching (Week 2-3)

### 2.1 Integrate hloc (Hierarchical Localization)

**Architecture:**
```
Query Image
    ↓
Level 1: Fine-tuned GeoCLIP → Top-20 candidate database images
    ↓
Level 2: SuperPoint keypoint detection
    ↓
Level 3: SuperGlue feature matching
    ↓
Level 4: RANSAC geometric verification
    ↓
Level 5: PnP (Perspective-n-Point) pose estimation
    ↓
Camera Pose (lat, lon, altitude, orientation)
```

**Components:**
- **SuperPoint:** Deep learning keypoint detector
- **SuperGlue:** Graph neural network feature matcher  
- **hloc:** Orchestrates the pipeline
- **pycolmap:** Bundle adjustment and pose refinement

**Implementation:**
```bash
pip install hloc pycolmap
```

**Database building:**
- For each city, extract SuperPoint features from all scraped images
- Store feature descriptors and 3D coordinates (from GPS)
- Build searchable index

**Expected improvement:** 50-100 km → 5-20 km

### 2.2 City-Specific Feature Databases

**Storage per city:**
- ~500-2000 images
- ~100-500k keypoints
- ~10-50 MB feature database

**Query time:** 2-5 seconds (acceptable for batch processing)

---

## Phase 3: Sub-Meter Accuracy (Month 2-3)

### 3.1 Structure-from-Motion (SfM)

**For each city:**
1. Collect 5,000-10,000 images
2. Run COLMAP or hloc SfM
3. Build sparse 3D point cloud
4. Triangulate query image pose against 3D points

**Requirements:**
- GPU: 4+ GPUs for feature extraction
- Storage: 100+ GB per city
- Time: Days of preprocessing per city

**Expected accuracy:** < 10 meters (street-level)

### 3.2 Dense Reconstruction (Optional)

For highest accuracy:
- Multi-view stereo (MVS) dense reconstruction
- Pixel-level alignment
- Sub-meter pose estimation

---

## Implementation Roadmap

### Week 1: Data Collection + Fine-Tuning

**Day 1-2:** Scrape city datasets
```bash
npm run scrape:city -- --city="Istanbul" --count=2000
npm run scrape:city -- --city="Liverpool" --count=2000
npm run scrape:city -- --city="London" --count=2000
npm run scrape:city -- --city="Paris" --count=2000
```

**Day 3-4:** Set up fine-tuning infrastructure
- Python training script
- Contrastive loss implementation
- Coordinate regression head

**Day 5-7:** Fine-tune and validate
- Train on city pairs
- Test Istanbul vs Liverpool classification
- Measure accuracy improvement

### Week 2: Visual Features

**Day 1-3:** Integrate hloc
- Install dependencies
- Build feature extraction pipeline
- Create city-specific databases

**Day 4-5:** Implement query pipeline
- Query image → feature extraction → matching → pose
- A/B test against embedding-only approach

**Day 6-7:** Validation
- Test on 50+ images per city
- Measure median error
- Document improvement

### Week 3-4: Polish & Expand

- Expand to 20+ cities
- Optimize query speed
- Build user-facing improvements
- Document accuracy gains

---

## Resource Requirements

| Phase | GPU | Storage | Time |
|-------|-----|---------|------|
| Week 1 (Fine-tuning) | 1x GPU (8GB) | 50 GB | 2-3 days training |
| Week 2 (Visual features) | CPU | 100 GB | 1 week |
| Week 3-4 (SfM) | 4x GPU | 500 GB | 2-4 weeks |

**Cloud option:** Runtraining on Google Colab or Lambda Labs ($0.50-2/hour)

---

## Success Metrics

| Milestone | Target | Current |
|-----------|--------|---------|
| Istanbul vs Liverpool classification | >90% | N/A (baseline GeoCLIP ~60%) |
| City-level median error | <50 km | 143 km |
| District-level median error | <10 km | Not achieved |
| Street-level median error | <10 m | Not achieved |

---

## Immediate Next Steps

1. **Scrape more cities** — Start with Istanbul, Liverpool, London, Paris
2. **Set up training environment** — Install PyTorch, transformers, sentence-transformers
3. **Implement fine-tuning script** — Contrastive learning on city pairs
4. **Test hypothesis** — Can we train GeoCLIP to distinguish similar cities?

**Estimated time to city-level accuracy:** 2-4 weeks  
**Estimated time to meter-level accuracy:** 2-3 months

---

## Commands Ready to Execute

```bash
# Scrape city datasets
cd backend
npm run scrape:city -- --city="Istanbul" --count=2000

# Fine-tune (when ready)
cd ../ml-training
python train_city_geoclip.py --cities=Istanbul,Liverpool,London,Paris

# Validate
npm run benchmark:validation
```

**Ready to start?** The scraper is working, we have 6 Istanbul images already. Next is setting up the fine-tuning pipeline.
