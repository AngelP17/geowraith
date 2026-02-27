# GeoWraith Backend (v2.2 — CLIP Fallback Active)

This backend implements a deterministic, local-first geolocation pipeline:

- Input validation (`image_base64` or data URL)
- Three-tier embedding: GeoCLIP ONNX → CLIP text-matching (`@xenova/transformers`) → deterministic fallback
- CLIP mode: matches images against 355 world-city text embeddings (auto-downloads model from HuggingFace)
- GeoCLIP mode: uses ONNX vision/location encoders with 100K+ reference coordinates (when models present)
- HNSW approximate nearest-neighbor search
- Coordinate aggregation with continent filtering and confidence scoring
- EXIF GPS passthrough when geotags exist

## Quick Start

```bash
cd backend
npm install
npm run dev
```

The API will be available at `http://localhost:8080`.

## Commands

```bash
# Development
npm run dev              # Start API server
npm run lint             # TypeScript check
npm run build            # Compile TypeScript
npm run test             # Run unit tests

# Benchmarking
npm run benchmark:accuracy      # Synthetic accuracy test
npm run benchmark:validation     # Real landmark validation (46 images)
npm run benchmark:search        # Search performance

# Data Collection (Zero-Cost Public Sources)
npm run scrape:city -- --city="Tokyo" --count=100 --sources=wikimedia,flickr,openverse,mapillary,osv5m,geograph,kartaview
npm run scrape:global -- --count=12 --sources=wikimedia,flickr,openverse,mapillary,osv5m,geograph,kartaview

# Coordinate Generation
npm run generate:coords         # Generate 500K coordinates

# Gallery Building
npm run build:dataset           # Build reference dataset
npm run build:gallery          # Build validation gallery
npm run build:gallery:local    # Local sample gallery
npm run build:gallery:csv      # CSV-based gallery
npm run build:gallery:real    # Download landmarks
npm run smartblend            # Download SmartBlend landmarks
```

## Endpoints

- `GET /health`
- `POST /api/predict`

API contract: `backend/docs/openapi.yaml`

## Data Sources (Free/Public)

10 sources total - 7 work without API keys:

| Source | Description | License | API Key Required |
|--------|-------------|---------|------------------|
| Wikimedia Commons | Geotagged photos | CC BY-SA | No |
| Flickr Public | Public feed photos | Various | No |
| Openverse | CC0/PD images | CC0/PD | No |
| Mapillary | Street-level imagery | CC BY-SA | Optional |
| OSV-5M | 5.1M Mapillary images | CC BY-SA | No |
| Geograph UK | UK geotagged photos | CC BY-SA | No |
| KartaView | Open street view | CC BY-SA | No |
| Unsplash | High-quality photos | Unsplash | Optional |
| Pexels | High-quality photos | Pexels | Optional |
| Pixabay | High-quality photos | Pixabay | Optional |

## Configuration

Optional environment variables (see `.env.example`):

```bash
# Coordinate reference (default: 500000)
GEOWRAITH_COORDINATE_COUNT=500000

# ANN search tiers
GEOWRAITH_ANN_TIER1_CANDIDATES=500
GEOWRAITH_ANN_TIER2_CANDIDATES=200
GEOWRAITH_ANN_TIER3_CANDIDATES=50

# DBSCAN clustering (opt-in)
GEOWRAITH_DBSCAN_EPSILON=50000
GEOWRAITH_DBSCAN_MIN_POINTS=3
GEOWRAITH_DBSCAN_MAX_CLUSTERS=10

# Data sources
GEOWRAITH_ENABLE_OSV5M=true
GEOWRAITH_ENABLE_GEOGRAPH=true
GEOWRAITH_ENABLE_KARTAVIEW=true

# Optional: Unsplash API key
UNSPLASH_ACCESS_KEY=your_key

# Optional: Mapillary token
MAPILLARY_ACCESS_TOKEN=your_token
```

## Validation Results (v2.2)

```
Median error:      28m
Mean error:       243m
P95 error:        1.4km
Max error:        5.1km

Within 100m:      76.1%
Within 1km:        93.5%
Within 10km:       100.0%
```

## Important Notes

- **Zero-cost**: All data sources are free/public (except optional Unsplash)
- **Local-first**: No external API calls during inference
- **Accuracy**: Validated on 46 real landmarks (median 28m, P95 1.4km)
- **Confidence**: Low-confidence results are withheld to avoid false positives

## Runtime Diagnostics

`POST /api/predict` returns:

- `status`: `ok` or `low_confidence`
- `location_visibility`: `visible` or `withheld`
- `location_reason`: why location was withheld
- `diagnostics.embedding_source`: `geoclip` or `fallback`
- `diagnostics.reference_index_source`: `model`, `cache`, `fallback`, or `unknown`
- `diagnostics.reference_image_anchors`: count of multi-source image anchors
- `diagnostics.coordinate_count`: total reference coordinates

When confidence is below 0.6, GeoWraith returns `low_confidence` and withholds coordinates.

## License

MIT — Zero-cost, fully open source.
