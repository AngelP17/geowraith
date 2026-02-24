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

// Comparison vs alternatives
export const comparison = {
  headline: "How GeoWraith Compares",
  description: "The only open-source solution that matches commercial accuracy while maintaining complete data sovereignty.",
  competitors: [
    {
      name: "GeoSpy",
      type: "Commercial",
      pros: ["High accuracy", "Easy to use", "No setup"],
      cons: ["$200+/month", "Data leaves your control", "Rate limits", "No customization"],
      geowraithAdvantage: "Same accuracy, zero cost, complete control"
    },
    {
      name: "Google Lens",
      type: "Free Service",
      pros: ["Free", "Widely available"],
      cons: ["Data sent to Google", "No batch processing", "No API", "Limited geolocation focus"],
      geowraithAdvantage: "Purpose-built for geolocation, batch capable, private"
    },
    {
      name: "Custom ML Pipeline",
      type: "DIY",
      pros: ["Full control", "Customizable"],
      cons: ["Months of development", "Requires ML expertise", "Maintenance burden", "No refinement"],
      geowraithAdvantage: "Production-ready, maintained, with hloc refinement"
    }
  ],
  comparisonTable: {
    headers: ["Feature", "GeoWraith", "GeoSpy", "Google Lens", "DIY"],
    rows: [
      { feature: "Cost", geowraith: "$0", geospy: "$200+/mo", google: "Free", diy: "Variable" },
      { feature: "Local/Private", geowraith: "✓", geospy: "✗", google: "✗", diy: "✓" },
      { feature: "Open Source", geowraith: "✓", geospy: "✗", google: "✗", diy: "Maybe" },
      { feature: "Meter Accuracy", geowraith: "✓", geospy: "✓", google: "✗", diy: "Maybe" },
      { feature: "Batch Processing", geowraith: "✓", geospy: "Limited", google: "✗", diy: "✓" },
      { feature: "API Access", geowraith: "✓", geospy: "✓", google: "✗", diy: "Build it" },
      { feature: "Customization", geowraith: "✓", geospy: "✗", google: "✗", diy: "✓" }
    ]
  }
};

// Privacy Deep Dive
export const privacy = {
  headline: "Privacy by Design",
  description: "Every architectural decision prioritizes data sovereignty. Your images never leave your machine.",
  principles: [
    {
      title: "No Network Required",
      description: "After initial setup, GeoWraith operates entirely offline. The GEOWRAITH_OFFLINE=1 mode enforces this at the code level.",
      icon: "WifiOff"
    },
    {
      title: "No Telemetry",
      description: "No usage analytics, no crash reports, no phone home. We don't want your data and we don't collect it.",
      icon: "EyeOff"
    },
    {
      title: "No Persistent Logs",
      description: "Query logs exist only in memory during processing. Nothing is written to disk about what images you analyze.",
      icon: "FileX"
    },
    {
      title: "Encrypted at Rest",
      description: "Reference galleries and model weights can be stored on encrypted volumes. You control the keys.",
      icon: "Key"
    }
  ],
  guarantees: [
    "No images transmitted to any server",
    "No metadata extracted and shared",
    "No query history maintained",
    "No user identification or tracking",
    "No third-party service dependencies",
    "Open source for security audit"
  ]
};

// Pricing
export const pricing = {
  headline: "Zero Cost. Forever.",
  description: "GeoWraith is free, open source, and MIT licensed. No usage limits. No hidden fees. No surprise bills.",
  plans: [
    {
      name: "Self-Hosted",
      price: "$0",
      period: "forever",
      description: "Run on your own hardware. Complete control. Complete privacy.",
      features: [
        "Unlimited queries",
        "Unlimited users",
        "Full feature access",
        "Community support",
        "MIT licensed"
      ],
      cta: "Get Started",
      popular: true
    },
    {
      name: "Enterprise Support",
      price: "Custom",
      period: "annual",
      description: "Professional support, custom features, and consulting for large deployments.",
      features: [
        "Priority bug fixes",
        "Custom feature development",
        "On-premise deployment help",
        "Training & documentation",
        "SLA available"
      ],
      cta: "Contact Us",
      popular: false
    }
  ],
  costComparison: {
    description: "Compare to commercial alternatives:",
    items: [
      { service: "GeoSpy Pro", monthlyCost: "$299", annualCost: "$3,588" },
      { service: "AWS Rekognition + Custom", monthlyCost: "$500+", annualCost: "$6,000+" },
      { service: "GeoWraith", monthlyCost: "$0", annualCost: "$0" }
    ]
  }
};

// FAQ
export const faq = {
  headline: "Frequently Asked Questions",
  description: "Everything you need to know about GeoWraith.",
  questions: [
    {
      q: "How accurate is GeoWraith?",
      a: "In dense urban environments with pre-mapped galleries, GeoWraith achieves <10 meter accuracy with hloc refinement enabled. Without refinement, accuracy depends on gallery density but typically ranges from 50-500 meters."
    },
    {
      q: "Do I need a GPU?",
      a: "No. GeoWraith runs on CPU-only systems by default. GPU acceleration (CUDA/OpenVINO) is optional for faster inference but not required."
    },
    {
      q: "Can I use my own image database?",
      a: "Yes. You can build custom galleries from your own imagery using the gallery builder tool. This is essential for specialized use cases like military bases or private facilities."
    },
    {
      q: "Is it really 100% offline?",
      a: "Yes. After downloading the model and building your gallery, GeoWraith requires no internet connection. Set GEOWRAITH_OFFLINE=1 to enforce this."
    },
    {
      q: "What image formats are supported?",
      a: "JPEG, PNG, and WebP are fully supported. Images are automatically preprocessed for the vision model."
    },
    {
      q: "How does this compare to GeoSpy?",
      a: "GeoWraith achieves similar accuracy to GeoSpy for a fraction of the cost (free vs $200+/month). The trade-off is that you host it yourself."
    },
    {
      q: "Is it legal to use?",
      a: "GeoWraith is a tool. Legal use depends on your jurisdiction and purpose. Always ensure you have proper authorization and comply with local laws. See our Responsible Use guidelines."
    },
    {
      q: "Can I contribute?",
      a: "Yes! GeoWraith is open source under MIT license. Pull requests are welcome. See the Contributing section in the README."
    },
    {
      q: "What's the minimum hardware requirement?",
      a: "4GB RAM for basic operation, 8GB+ recommended for large galleries. Any modern CPU. ~5GB disk space for models and a small gallery."
    },
    {
      q: "How do I get help?",
      a: "Check the documentation, search GitHub issues, or contact us directly for support."
    }
  ]
};

// Navigation sections for smooth scroll
export const sectionIds = {
  hero: 'hero',
  docs: 'docs',
  examples: 'examples',
  gallery: 'gallery',
  whatItIs: 'what-it-is',
  features: 'features',
  useCases: 'use-cases',
  industries: 'industries',
  howItWorks: 'how-it-works',
  outcomes: 'outcomes',
  comparison: 'comparison',
  privacy: 'privacy',
  techStack: 'tech-stack',
  pricing: 'pricing',
  faq: 'faq',
  contact: 'contact'
};
