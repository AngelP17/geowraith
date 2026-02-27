/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/sections/Hero';
import { ProductUI } from './components/sections/ProductUI';
import { Docs } from './components/sections/Docs';
import { Examples } from './components/sections/Examples';
import { Gallery } from './components/sections/Gallery';
import { WhatItIs } from './components/sections/WhatItIs';
import { Features } from './components/sections/Features';
import { UseCases } from './components/sections/UseCases';
import { Industries } from './components/sections/Industries';
import { HowItWorks } from './components/sections/HowItWorks';
import { Outcomes } from './components/sections/Outcomes';
import { Comparison } from './components/sections/Comparison';
import { PrivacyDeepDive } from './components/sections/PrivacyDeepDive';
import { TechStack } from './components/sections/TechStack';
import { Pricing } from './components/sections/Pricing';
import { FAQ } from './components/sections/FAQ';
import { Contact } from './components/sections/Contact';
import { FinalCTA } from './components/sections/FinalCTA';
import { Footer } from './components/sections/Footer';
import { ComingSoonModal } from './components/ui/ComingSoonModal';

interface ComingSoonContent {
  title: string;
  description: string;
}

export default function App() {
  const [comingSoonOpen, setComingSoonOpen] = useState(false);
  const [comingSoonContent, setComingSoonContent] = useState<ComingSoonContent>({
    title: 'Coming Soon',
    description: 'This feature is currently in development.',
  });

  const showComingSoon = useCallback((title: string, description: string) => {
    setComingSoonContent({ title, description });
    setComingSoonOpen(true);
  }, []);

  const closeComingSoon = useCallback(() => {
    setComingSoonOpen(false);
  }, []);

  return (
    <div className="font-general bg-[#060606] text-white antialiased">
      <Navbar onOpenComingSoon={showComingSoon} />
      <Hero onOpenComingSoon={showComingSoon} />
      <ProductUI />
      <Docs />
      <Examples />
      <Gallery />
      <WhatItIs />
      <Features />
      <UseCases />
      <Industries />
      <HowItWorks />
      <Outcomes />
      <Comparison />
      <PrivacyDeepDive />
      <TechStack />
      <Pricing />
      <FAQ />
      <Contact />
      <FinalCTA />
      <Footer onOpenComingSoon={showComingSoon} />

      {/* Global Coming Soon Modal */}
      <ComingSoonModal
        isOpen={comingSoonOpen}
        onClose={closeComingSoon}
        title={comingSoonContent.title}
        description={comingSoonContent.description}
      />
    </div>
  );
}
