/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// What It Is - Detailed explanation
export const whatItIs = {
  headline: 'Visual Geolocation with Confidence Gating',
  description: `GeoWraith estimates where a photo was taken by encoding visual signals and matching them against a local reference index. It prioritizes GeoCLIP ONNX when available, falls back to CLIP when needed, and explicitly withholds weak predictions.`,
  capabilities: [
    {
      title: 'Visual Feature Extraction',
      description:
        'GeoCLIP ONNX embeddings are used when available, with CLIP fallback for resilient local operation.',
    },
    {
      title: 'HNSW Vector Retrieval',
      description:
        'hnswlib-node performs approximate nearest-neighbor search over a 55K+ mixed coordinate and anchor index.',
    },
    {
      title: 'Confidence-Aware Output',
      description:
        'Confidence tiers and scene/cohort calibration reduce false certainty and withhold unreliable locations.',
    },
    {
      title: 'Complete Local Operation',
      description:
        'Everything runs on your hardware. No cloud inference, no telemetry, and no external API dependency.',
    }
  ],
  architecture: {
    title: 'Three-Layer Architecture',
    layers: [
      { name: 'Inference Layer', detail: 'TypeScript pipeline + ONNX Runtime + CLIP fallback path' },
      { name: 'Search Layer', detail: 'HNSW ANN index with coordinate vectors and image anchors' },
      { name: 'Decision Layer', detail: 'Confidence thresholds, cohort hints, and location withholding' },
    ]
  }
};

// Use Cases - When is it useful
export const useCases = [
  {
    id: "osint",
    title: "Open Source Intelligence",
    icon: "Globe",
    description: "Verify the location of social media images, investigate disinformation campaigns, and geolocate user-generated content for journalistic verification.",
    scenarios: [
      "Verify claims about conflict zones",
      "Track misinformation spread",
      "Corroborate eyewitness accounts",
      "Investigate human rights violations"
    ]
  },
  {
    id: "sar",
    title: "Search & Rescue",
    icon: "LifeBuoy",
    description: "Locate missing persons by analyzing photos from their last known locations. Identify terrain features to narrow search areas.",
    scenarios: [
      "Locate hikers from trail photos",
      "Identify disaster zone locations",
      "Coordinate ground team deployment",
      "Verify distress signal origins"
    ]
  },
  {
    id: "law-enforcement",
    title: "Law Enforcement",
    icon: "Shield",
    description: "Support investigations with location intelligence from photographic evidence. Build geographic timelines from image data.",
    scenarios: [
      "Corroborate alibi statements",
      "Track suspect movements",
      "Verify evidence authenticity",
      "Map criminal activity patterns"
    ]
  },
  {
    id: "security",
    title: "Security Operations",
    icon: "Lock",
    description: "Assess security risks from shared imagery. Identify if sensitive locations are visible in public photos.",
    scenarios: [
      "Assess OPSEC violations",
      "Monitor facility exposure",
      "Detect location-based threats",
      "Audit social media presence"
    ]
  },
  {
    id: "research",
    title: "Academic Research",
    icon: "GraduationCap",
    description: "Study urban environments, analyze geographic patterns, and build datasets for computer vision research.",
    scenarios: [
      "Urban morphology studies",
      "Visual place recognition research",
      "Geographic data mining",
      "Computer vision benchmarking"
    ]
  },
  {
    id: "journalism",
    title: "Investigative Journalism",
    icon: "Newspaper",
    description: "Fact-check location claims, verify sources, and build geographically accurate narratives.",
    scenarios: [
      "Verify photo locations",
      "Cross-reference witness accounts",
      "Document conflict zones",
      "Expose false narratives"
    ]
  }
];

// Industries - Vertical markets (removed fake stats)
export const industries = [
  {
    name: "Government & Defense",
    description: "Intelligence agencies, defense contractors, and security services use GeoWraith for location intelligence without data exposure risks.",
    icon: "Building2",
    stats: "Air-gapped deployments"
  },
  {
    name: "Journalism & Media",
    description: "News organizations and fact-checkers verify the authenticity and location of user-generated content.",
    icon: "Radio",
    stats: "Open source verification"
  },
  {
    name: "Emergency Services",
    description: "Search and rescue teams, disaster response agencies, and emergency coordination centers locate incidents faster.",
    icon: "Siren",
    stats: "Rapid deployment ready"
  },
  {
    name: "Cybersecurity",
    description: "Security teams assess operational security risks and investigate threats with geographic components.",
    icon: "ShieldCheck",
    stats: "Privacy-first design"
  },
  {
    name: "Legal & Compliance",
    description: "Law firms and compliance officers verify evidence and investigate fraud with location verification.",
    icon: "Scale",
    stats: "Audit trail capable"
  },
  {
    name: "Research & Academia",
    description: "Universities and research institutions study visual geolocation, urban environments, and computer vision.",
    icon: "Microscope",
    stats: "Fully reproducible"
  },
  {
    name: "Insurance",
    description: "Claims investigators verify incident locations and detect fraudulent location claims.",
    icon: "Umbrella",
    stats: "Local data processing"
  },
  {
    name: "Real Estate",
    description: "Property researchers verify location claims and analyze neighborhood characteristics from imagery.",
    icon: "Home",
    stats: "Due diligence workflows"
  }
];

// End Goals / Outcomes
export const outcomes = {
  headline: 'What You Achieve with GeoWraith',
  description:
    'Actionable location intelligence with transparent confidence reporting and reproducible benchmarks.',
  goals: [
    {
      title: '93.1% Within 10km',
      description:
        'Current validated snapshot: 54/58 within 10km. Cohorts: iconic 100.0%, generic 88.9%.',
      metric: '93.1%',
      metricLabel: 'Within 10km',
    },
    {
      title: 'Sub-Second Hot Path',
      description:
        'After warmup, typical requests complete quickly enough for interactive analysis workflows.',
      metric: '<2s',
      metricLabel: 'Typical',
    },
    {
      title: 'Zero Data Exposure',
      description:
        'Process sensitive imagery without transmitting image payloads to external services.',
      metric: '100%',
      metricLabel: 'Local',
    },
    {
      title: '55K+ Indexed Vectors',
      description:
        'Current combined index is ~55K vectors (coordinates + image anchors), with no per-query billing.',
      metric: '55K+',
      metricLabel: 'Vectors',
    }
  ],
  results: [
    {
      icon: "Clock",
      title: "Faster Investigations",
      description: "Reduce location verification from hours to seconds. Eliminate manual reverse image searches and geographic guessing."
    },
    {
      icon: "Lock",
      title: "Secure Operations",
      description: "Process classified or sensitive imagery air-gapped. No data leaves your controlled environment."
    },
    {
      icon: "DollarSign",
      title: "Cost Elimination",
      description: "Zero per-query costs. No API subscriptions. No usage limits. Predictable infrastructure costs only."
    },
    {
      icon: "CheckCircle",
      title: "Verified Intelligence",
      description: "Confidence scores, cohort-aware calibration, and accuracy metrics for every result. Know when to trust and when to verify further."
    }
  ]
};

export { comparison, privacy, pricing, faq, sectionIds } from "./extendedContentPart2";
