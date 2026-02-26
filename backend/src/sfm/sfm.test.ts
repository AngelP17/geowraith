/**
 * SfM pipeline tests.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { runSfMPipeline } from './pipeline.js';

describe('SfM Pipeline', () => {
  it('should return error for missing reference images when token not configured', async () => {
    // Create a simple 1x1 pixel PNG
    const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const imageBuffer = Buffer.from(base64Image, 'base64');
    
    const result = await runSfMPipeline(imageBuffer, {
      coarseLocation: { lat: 48.8584, lon: 2.2945 }, // Eiffel Tower
      radiusMeters: 1000,
      maxReferences: 10,
    });
    
    // When MAPILLARY_ACCESS_TOKEN is not set, should fail gracefully
    assert.strictEqual(result.success, false);
    assert.ok(result.error?.includes('Insufficient reference images') || result.error?.includes('MAPILLARY_ACCESS_TOKEN'));
  });

  it('should validate input parameters', async () => {
    const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const imageBuffer = Buffer.from(base64Image, 'base64');
    
    // Test with invalid coordinates
    const result = await runSfMPipeline(imageBuffer, {
      coarseLocation: { lat: 999, lon: 999 }, // Invalid coordinates
      radiusMeters: 1000,
      maxReferences: 10,
    });
    
    // Should still run but likely fail to find images
    assert.ok(typeof result.success === 'boolean');
    assert.ok(typeof result.processingTimeMs === 'number');
  });

  it('should handle PNG with alpha channel (4 channels)', async () => {
    // Create a 2x2 RGBA PNG
    const rgbaBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABZJREFUeNpi2r9//38gYGAEESAAEGAAasgJOgzOKCoAAAAASUVORK5CYII=';
    const imageBuffer = Buffer.from(rgbaBase64, 'base64');
    
    const result = await runSfMPipeline(imageBuffer, {
      coarseLocation: { lat: 51.5074, lon: -0.1278 }, // London
      radiusMeters: 500,
      maxReferences: 5,
    });
    
    // Should not throw "unsupported number of channels" error
    assert.ok(typeof result.success === 'boolean');
    assert.ok(result.processingTimeMs > 0);
  });

  it('should return valid result structure', async () => {
    const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const imageBuffer = Buffer.from(base64Image, 'base64');
    
    const result = await runSfMPipeline(imageBuffer, {
      coarseLocation: { lat: 40.7128, lon: -74.0060 }, // NYC
      radiusMeters: 1000,
      maxReferences: 10,
    });
    
    // Verify result structure
    assert.ok(typeof result.success === 'boolean');
    assert.ok(typeof result.location === 'object');
    assert.ok(typeof result.location.lat === 'number');
    assert.ok(typeof result.location.lon === 'number');
    assert.ok(typeof result.confidence === 'number');
    assert.ok(typeof result.processingTimeMs === 'number');
    
    // Verify confidence is between 0 and 1
    assert.ok(result.confidence >= 0 && result.confidence <= 1);
    
    // Verify processing time is reasonable (less than 30 seconds)
    assert.ok(result.processingTimeMs < 30000);
  });
});

describe('SfM Feature Extraction', () => {
  it('should extract features from PNG with various channel counts', async () => {
    const { extractFeatures } = await import('./featureExtractor.js');
    
    // RGBA PNG (4 channels)
    const rgbaPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABZJREFUeNpi2r9//38gYGAEESAAEGAAasgJOgzOKCoAAAAASUVORK5CYII=', 'base64');
    
    const features = await extractFeatures(rgbaPng);
    
    assert.ok(features.keypoints.length > 0);
    assert.ok(features.descriptors.length > 0);
    assert.ok(features.scores.length > 0);
  });
});
