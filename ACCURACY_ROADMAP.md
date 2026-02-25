# GeoWraith Accuracy Roadmap: From 143 km to Meter-Level

**Current State:** 143 km median error (27 landmarks)  
**Target:** City-level (~5-10 km) or meter-level  
**Gap:** ~15-25x improvement needed

---

## Why Current System Fails at Fine-Grained Accuracy

### Root Cause Analysis

| Issue | Current | What's Needed |
|-------|---------|---------------|
| **Embedding model** | GeoCLIP (region-level pre-trained) | Fine-tuned GeoCLIP on dense city-level datasets |
| **Reference data** | 100k coordinate-only points | Millions of geotagged photos with visual features |
| **Matching** | Nearest neighbor on embeddings | Visual feature matching (SIFT/SuperGlue) + geometric verification |
| **Pose refinement** | None | SfM/3D reconstruction (hloc/Colmap) |

**The Istanbul/Liverpool Problem:**
- Current: Both are ~51°N, so embeddings are similar
- GeoCLIP was trained to distinguish continents/countries, not cities
- Without visual feature matching, it can't tell similar-looking urban scenes apart

---

## Phase 1: City-Level Accuracy (~5-10 km)

**Timeline:** 2-4 weeks  
**Cost:** Free (open source)  
**Effort:** High

### 1.1 Fine-Tune GeoCLIP on Dense Urban Dataset

**Dataset Options:**
- **Google Landmarks Dataset v2** (5M images, 200k landmarks)
- **Wikimedia Commons** (geotagged photos, scrape by city)
- **Mapillary** (street-level imagery, API available)

**Implementation:**
```python
# Train on (image, lat, lon) pairs with contrastive loss
# Focus on hard negatives (Istanbul vs Liverpool, Paris vs London)
```

**Expected Improvement:** 143 km → 50-100 km

### 1.2 Add Visual Feature Index (SuperPoint + SuperGlue)

Instead of just embedding matching, extract local features:

```typescript
// New pipeline step
1. Extract SuperPoint keypoints from query image
2. Match against database of landmark images with known poses
3. RANSAC geometric verification
4. Triangulate position from matched features
```

**Implementation:**
- Use `hloc` (hierarchical localization) library
- Pre-build feature database for major cities
- Runtime: ~2-5 seconds per query

**Expected Improvement:** 50-100 km → 5-20 km

### 1.3 Multi-Scale Search Strategy

```typescript
// Hierarchical search
Level 1: GeoCLIP (continent/country) - 100ms
Level 2: Fine-tuned GeoCLIP (city region) - 200ms  
Level 3: Visual features (exact pose) - 2-5s
```

---

## Phase 2: Meter-Level Accuracy (< 10m)

**Timeline:** 1-3 months  
**Cost:** Significant compute + storage  
**Effort:** Very High

### 2.1 Dense 3D Reconstruction (SfM)

For each target city, build a 3D map:

```bash
# Using COLMAP or hloc
# 1. Collect thousands of images per city
# 2. Run structure-from-motion
# 3. Build sparse 3D point cloud with camera poses
# 4. Store feature descriptors for each 3D point
```

**Storage:** ~10-100 GB per major city  
**Preprocessing:** Hours to days per city  
**Query time:** 5-30 seconds

### 2.2 Hierarchical Localization (hloc)

Standard computer vision pipeline:

```
Query Image
    ↓
Global Retrieval (NetVLAD/GeoCLIP) → Top-20 candidate images
    ↓
Local Feature Matching (SuperPoint + SuperGlue)
    ↓
PnP (Perspective-n-Point) with RANSAC
    ↓
6-DOF Camera Pose (lat, lon, altitude, roll, pitch, yaw)
```

**Libraries:**
- `hloc` (https://github.com/cvg/Hierarchical-Localization)
- `pycolmap` for PnP
- `kornia` for geometric operations

### 2.3 Continuous Learning

As users upload images:
- Add to reference database if location verified
- Periodically retrain embeddings
- Expand to new cities on demand

---

## Implementation Priority

### Quick Wins (Week 1-2)

1. **Scrape more training data** from Wikimedia by city (Openverse currently returns HTTP 401 in this workspace)
2. **Fine-tune GeoCLIP** on city-level pairs
3. **Test on Istanbul vs Liverpool** specifically

### Medium Investment (Week 3-4)

1. **Integrate hloc** for visual feature matching
2. **Build feature database** for top 100 cities
3. **A/B test** embedding-only vs visual features

### Major Investment (Month 2-3)

1. **Full SfM pipeline** for dense cities
2. **Sub-meter accuracy** on well-covered areas
3. **Real-time pose refinement**

---

## Accuracy Expectations

| Phase | Median Error | Use Case |
|-------|--------------|----------|
| Current | 143 km | Continent detection |
| Phase 1a (Fine-tuned) | 50-100 km | Country/region |
| Phase 1b (+Visual) | 5-20 km | City/district |
| Phase 2 (SfM) | < 10m | Street-level |

---

## Resource Requirements

| Phase | Compute | Storage | Time |
|-------|---------|---------|------|
| Phase 1a | 1 GPU, 8GB | 50 GB | 2-3 days training |
| Phase 1b | CPU + 16GB RAM | 500 GB | 1 week setup |
| Phase 2 | 4+ GPUs, 64GB | 10+ TB | Weeks per city |

---

## Immediate Next Steps

1. **Choose target cities** (Istanbul, Liverpool, etc.)
2. **Scrape Wikimedia** for those cities specifically
3. **Fine-tune GeoCLIP** on city-level data
4. **Test if Istanbul/Liverpool distinction improves**

Want me to start on Phase 1a (fine-tuning)?
