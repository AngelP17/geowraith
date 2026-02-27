/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Feature, ProcessStep, TechStackItem, NavLink, FooterSection } from '../types';

export const features: Feature[] = [
  {
    id: 'local-pipeline',
    title: 'Local Inference Pipeline',
    description:
      'GeoCLIP ONNX is used when available, with CLIP and deterministic fallback paths for resilient local inference.',
    icon: 'Cpu',
  },
  {
    id: 'hnsw',
    title: 'HNSW Vector Search',
    description: 'hnswlib-node provides sub-millisecond approximate nearest neighbor search across 55K+ reference vectors. Disk-backed index for memory efficiency.',
    icon: 'Database',
  },
  {
    id: 'confidence-gating',
    title: 'Confidence-Gated Output',
    description:
      'Predictions include confidence tiers, scene context, and location withholding when reliability is too low.',
    icon: 'Target',
  },
  {
    id: 'privacy',
    title: '100% Local-First',
    description: 'Zero data leaves your machine. No cloud services, no tracking, no telemetry. Privacy mode runs entirely in browser with WASM.',
    icon: 'Shield',
  },
  {
    id: 'offline',
    title: 'Fully Offline Capable',
    description: 'GEOWRAITH_OFFLINE=1 mode disables all external access. Works air-gapped after initial setup. No internet required for inference.',
    icon: 'WifiOff',
  },
  {
    id: 'opensource',
    title: 'MIT Licensed',
    description: 'Open source and free forever. Fork, audit, extend, deploy. Zero cost, fully transparent. Community-driven development.',
    icon: 'Code2',
  },
];

export const processSteps: ProcessStep[] = [
  {
    step: 1,
    title: 'Upload',
    description: 'Drag and drop any photo',
    details: ['JPEG, PNG, WebP supported', 'No EXIF required', 'Browser-side preprocessing'],
  },
  {
    step: 2,
    title: 'Embed',
    description: 'Vision model creates embedding',
    details: ['ONNX/CLIP extraction path', 'Visual embedding vector', 'Sub-second processing'],
  },
  {
    step: 3,
    title: 'Search',
    description: 'HNSW similarity search',
    details: ['hnswlib-node ANN search', 'Top-k matches retrieved', 'Confidence scoring'],
  },
  {
    step: 4,
    title: 'Calibrate',
    description: 'Confidence and cohort analysis',
    details: ['Confidence tiering', 'Scene classification', 'Withhold-on-uncertain policy'],
  },
  {
    step: 5,
    title: 'Locate',
    description: 'GPS coordinates output',
    details: ['Lat/Lon coordinates', 'Accuracy radius', 'Map visualization'],
  },
];

export const techStack: TechStackItem[] = [
  { name: 'TypeScript', category: 'core', description: 'End-to-end typed inference and API pipeline' },
  { name: 'Express', category: 'core', description: 'Local API runtime' },
  { name: 'ONNX', category: 'core', description: 'Vision model inference' },
  { name: 'HNSW', category: 'storage', description: 'hnswlib-node ANN index' },
  { name: 'Node.js', category: 'core', description: 'Backend runtime environment' },
  { name: 'React', category: 'frontend', description: 'UI components' },
  { name: 'Tabler Icons', category: 'frontend', description: 'Interface iconography' },
  { name: 'Vite', category: 'frontend', description: 'Build tooling' },
  { name: 'Tailwind', category: 'frontend', description: 'Utility styling' },
  { name: 'Motion', category: 'frontend', description: 'Animations' },
  { name: 'MapLibre', category: 'frontend', description: 'Map rendering' },
];

export const navLinks: NavLink[] = [
  { label: 'Docs', href: '#docs', hasDropdown: true },
  { label: 'Examples', href: '#examples', hasDropdown: true },
  { label: 'Gallery', href: '#gallery', hasDropdown: false },
  { label: 'Contact', href: '#contact', hasDropdown: false },
];

export const footerSections: FooterSection[] = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'How It Works', href: '#how-it-works' },
      { label: 'Tech Stack', href: '#tech-stack' },
      { label: 'Pricing', href: '#pricing' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Documentation', href: '#docs' },
      { label: 'API Reference', href: '#api' },
      { label: 'Examples', href: '#examples' },
      { label: 'Gallery', href: '#gallery' },
    ],
  },
  {
    title: 'Community',
    links: [
      { label: 'GitHub', href: 'https://github.com/AngelP17/geowraith' },
      { label: 'Contact', href: '#contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'License (MIT)', href: '#license' },
      { label: 'Privacy Policy', href: '#privacy' },
      { label: 'Terms of Use', href: '#terms' },
      { label: 'Responsible Use', href: '#ethics' },
    ],
  },
];
