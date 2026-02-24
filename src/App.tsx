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
    <>
      <style>
        {`
          @import url('https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600,700,800&display=swap');
          
          .font-general { 
            font-family: 'General Sans', -apple-system, BlinkMacSystemFont, sans-serif; 
          }
          
          html {
            scroll-behavior: smooth;
          }
          
          ::selection {
            background: rgba(52, 211, 153, 0.3);
            color: white;
          }

          /* Premium scrollbar */
          ::-webkit-scrollbar {
            width: 8px;
          }
          
          ::-webkit-scrollbar-track {
            background: #000;
          }
          
          ::-webkit-scrollbar-thumb {
            background: rgba(255,255,255,0.1);
            border-radius: 4px;
          }
          
          ::-webkit-scrollbar-thumb:hover {
            background: rgba(255,255,255,0.2);
          }
        `}
      </style>

      <div className="font-general bg-black text-white antialiased">
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
    </>
  );
}
