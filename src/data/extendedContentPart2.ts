/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
