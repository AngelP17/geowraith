import assert from 'node:assert';
import { describe, it } from 'node:test';
import type { GalleryImage } from './validationBenchmark/types.js';
import {
  classifySceneType,
  classifyValidationCohort,
  extractLocationMetadata,
} from './validationBenchmark/geo.js';

function buildImage(title: string, categories: string[]): GalleryImage {
  return {
    id: 'test_image',
    source: 'test',
    filename: 'test.jpg',
    url: '',
    local_path: '',
    coordinates: { lat: 48.8584, lon: 2.2945 },
    accuracy_radius: 30,
    image_info: {
      width: 1000,
      height: 800,
      size_bytes: 100_000,
      mime_type: 'image/jpeg',
    },
    metadata: {
      title,
      categories,
    },
  };
}

describe('Validation Benchmark Cohort Classification', () => {
  it('classifies Eiffel Tower as iconic landmark', () => {
    const cohort = classifyValidationCohort('Eiffel Tower, Paris', ['landmark', 'tower']);
    assert.strictEqual(cohort, 'iconic_landmark');
  });

  it('classifies generic beach as generic scene', () => {
    const cohort = classifyValidationCohort('Beach sunset', ['nature', 'coastal']);
    assert.strictEqual(cohort, 'generic_scene');
  });

  it('treats mountain scenes as generic even with urban hints', () => {
    const cohort = classifyValidationCohort('Table Mountain skyline', ['urban', 'mountain']);
    assert.strictEqual(cohort, 'generic_scene');
  });

  it('keeps landmark scenes iconic when no generic hints are present', () => {
    const cohort = classifyValidationCohort('US Capitol building', ['landmark', 'architecture']);
    assert.strictEqual(cohort, 'iconic_landmark');
  });

  it('defaults unknown scenes to generic cohort', () => {
    const cohort = classifyValidationCohort('Street photo', ['photojournalism']);
    assert.strictEqual(cohort, 'generic_scene');
  });
});

describe('Validation Benchmark Scene Type Classification', () => {
  it('classifies scene types with shared regex constants', () => {
    assert.strictEqual(classifySceneType('Golden Gate Bridge', ['landmark']), 'landmark');
    assert.strictEqual(classifySceneType('Copacabana Beach', ['nature', 'coastal']), 'nature');
    assert.strictEqual(classifySceneType('Downtown skyline', ['urban']), 'urban');
    assert.strictEqual(classifySceneType('Farm countryside', ['rural']), 'rural');
  });
});

describe('extractLocationMetadata', () => {
  it('returns continent, sceneType, and cohort together', () => {
    const image = buildImage('Eiffel Tower, Paris', ['landmark', 'tower']);
    const metadata = extractLocationMetadata(image);

    assert.strictEqual(metadata.continent, 'Europe');
    assert.strictEqual(metadata.sceneType, 'landmark');
    assert.strictEqual(metadata.cohort, 'iconic_landmark');
  });
});
