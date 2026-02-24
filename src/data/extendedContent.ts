/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// What It Is - Detailed explanation
export const whatItIs = {
  headline: "Visual Place Recognition at Machine Speed",
  description: `GeoWraith is a complete visual geolocation system that determines where a photograph was taken by analyzing its visual content. Unlike EXIF-based solutions that rely on embedded metadata, GeoWraith uses deep learning to extract visual features and match them against a database of known locations.`,
  capabilities: [
    {
      title: "Visual Feature Extraction",
      description: "ONNX vision model processes images into 384-dimensional embeddings that capture unique visual characteristics of any location."
    },
    {
      title: "Vector Similarity Search",
      description: "LanceDB performs sub-second approximate nearest neighbor search across millions of reference images."
    },
    {
      title: "Geometric Refinement",
      description: "hloc + COLMAP structure-from-motion pipeline refines coarse matches to meter-level GPS coordinates."
    },
    {
      title: "Complete Local Operation",
      description: "Everything runs on your hardware. No API calls, no data transmission, no external dependencies after setup."
    }
  ],
  architecture: {
    title: "Three-Layer Architecture",
    layers: [
      { name: "Inference Layer", detail: "Rust + ONNX Runtime for vision model inference" },
      { name: "Search Layer", detail: "LanceDB for vector storage and similarity search" },
      { name: "Refinement Layer", detail: "Python hloc bridge for geometric pose estimation" }
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
  headline: "What You Achieve with GeoWraith",
  description: "The ultimate goal is actionable location intelligence—turning any image into reliable geographic data without compromising operational security or privacy.",
  goals: [
    {
      title: "Sub-10-Meter Accuracy",
      description: "Achieve meter-level precision in dense urban environments with structure-from-motion refinement.",
      metric: "<10m",
      metricLabel: "Accuracy"
    },
    {
      title: "Sub-Second Response",
      description: "Get location results in under 2 seconds for rapid decision-making during time-sensitive operations.",
      metric: "<2s",
      metricLabel: "Inference"
    },
    {
      title: "Zero Data Exposure",
      description: "Process sensitive imagery without ever transmitting data to external services or cloud providers.",
      metric: "100%",
      metricLabel: "Local"
    },
    {
      title: "Unlimited Scale",
      description: "Build city-scale galleries with millions of reference images. No per-query costs or rate limits.",
      metric: "∞",
      metricLabel: "Queries"
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
      description: "Confidence scores and accuracy metrics for every result. Know when to trust and when to verify further."
    }
  ]
};

export { comparison, privacy, pricing, faq, sectionIds } from "./extendedContentPart2";
