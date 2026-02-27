/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { Play, ArrowRight } from 'lucide-react';
import { MagneticButton } from '../ui/SectionReveal';
import { VideoBackground, MeshGradient, AnimatedBackground } from '../ui/AnimatedBackground';

interface HeroProps {
  onOpenComingSoon?: (title: string, description: string) => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenComingSoon }) => {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 150]);
  const y2 = useTransform(scrollY, [0, 500], [0, 100]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  const scrollToFeatures = () => {
    const element = document.querySelector('#what-it-is');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToContact = () => {
    const element = document.querySelector('#contact');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const openGitHub = () => {
    window.open('https://github.com/AngelP17/geowraith', '_blank', 'noopener,noreferrer');
  };

  const handleDocsClick = () => {
    if (onOpenComingSoon) {
      onOpenComingSoon(
        'Documentation',
        'Comprehensive documentation with API reference, tutorials, and deployment guides are being prepared. Follow us on GitHub for updates.'
      );
    }
  };

  return (
    <section id="hero" className="relative w-full min-h-screen bg-[#060606] overflow-hidden font-general flex flex-col">
      {/* Background Video with Parallax - Now smooth and high quality */}
      <motion.div 
        style={{ y: y1 }}
        initial={{ opacity: 0, scale: 1.015 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
        className="absolute inset-0 w-full h-full z-0"
      >
        <VideoBackground />
        <AnimatedBackground />
      </motion.div>

      {/* Animated Grid Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none z-[1]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)`,
          backgroundSize: '100px 100px',
        }}
      />

      {/* Additional animated mesh for depth */}
      <div className="absolute inset-0 z-[1] opacity-25 pointer-events-none">
        <MeshGradient />
      </div>

      {/* Hero Content */}
      <motion.div 
        style={{ opacity }}
        className="relative z-10 flex flex-col items-center w-full px-5 pt-[160px] md:pt-[220px] pb-[80px] flex-1"
      >
        <div className="flex flex-col items-center gap-[32px] md:gap-[40px] w-full max-w-5xl mx-auto">
          {/* Premium Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            whileHover={{ scale: 1.05 }}
            onClick={handleDocsClick}
            className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-[rgba(255,255,255,0.04)]
                       border border-[rgba(255,255,255,0.12)] backdrop-blur-md cursor-pointer
                       group overflow-hidden relative transition-colors duration-300"
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent 
                            -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="relative"
            >
              <div className="w-2 h-2 rounded-full bg-[var(--gw-accent)]" />
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-[var(--gw-accent)] blur-sm" />
            </motion.div>
            
            <div className="text-[13px] font-medium tracking-wide">
              <span className="text-white/50">v2.2</span>
              <span className="text-white/30 mx-2">|</span>
              <span className="text-white/55">Fully Local</span>
              <span className="text-white/30 mx-2">|</span>
              <span className="text-white group-hover:text-[var(--gw-accent)] transition-colors">MIT Licensed</span>
            </div>
          </motion.div>

          {/* Heading with Staggered Reveal */}
          <motion.div style={{ y: y2 }} className="flex flex-col items-center gap-[20px] md:gap-[24px]">
            {/* Main Headline */}
            <div className="overflow-hidden">
              <motion.h1
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 1, delay: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                className="font-display max-w-[920px] text-[44px] sm:text-[60px] md:text-[76px]
                           lg:text-[88px] font-semibold leading-[0.9] text-center"
              >
                <span className="text-white">
                  High-Confidence
                </span>
                <br />
                <span className="hero-headline-accent">
                  Geolocation
                </span>
                <br />
                <span className="text-white/80">
                  from Any Photo
                </span>
              </motion.h1>
            </div>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.9 }}
              className="max-w-[680px] text-[15px] md:text-[17px] font-normal text-white/65 text-center
                         leading-relaxed"
            >
              Open-source local-first geolocation with transparent confidence reporting. GeoCLIP/CLIP
              embeddings, HNSW vector retrieval, and cohort-aware calibration.{' '}
              <span className="text-white/85">100% local-first.</span>{' '}
              <span className="text-[var(--gw-accent)]">Zero data leaves your machine.</span>
            </motion.p>

            {/* Premium CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.1 }}
              className="flex flex-col sm:flex-row items-center gap-3 md:gap-4 mt-6"
            >
              <MagneticButton
                strength={0.2}
                onClick={openGitHub}
                className="group relative px-8 py-4 bg-[var(--gw-accent)] text-black rounded-full
                           font-semibold text-[15px] overflow-hidden transition-all duration-300
                           hover:shadow-[0_0_36px_rgba(243,184,97,0.35)]"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Start Building
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </MagneticButton>
              
              <MagneticButton
                strength={0.2}
                onClick={scrollToFeatures}
                className="group px-8 py-4 bg-white/[0.03] text-white rounded-full font-medium text-[15px]
                           border border-[rgba(255,255,255,0.16)] backdrop-blur-sm hover:bg-white/[0.08]
                           hover:border-white/35 transition-all duration-300"
              >
                <span className="flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  Learn More
                </span>
              </MagneticButton>
            </motion.div>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.button
            onClick={scrollToFeatures}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 
                       text-white/20 hover:text-white/40 transition-colors cursor-pointer group"
          >
            <span className="text-[11px] uppercase tracking-[0.2em]">Explore</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-6 h-10 rounded-full border border-current flex items-start justify-center p-2"
            >
              <motion.div
                animate={{ opacity: [0.2, 1, 0.2], y: [0, 8, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="w-1 h-2 rounded-full bg-current"
              />
            </motion.div>
          </motion.button>
        </div>
      </motion.div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 w-full h-48 bg-gradient-to-t from-black to-transparent z-[5] pointer-events-none" />
    </section>
  );
};
