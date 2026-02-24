/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { MagneticButton } from '../ui/SectionReveal';

export const FinalCTA: React.FC = () => {
  const scrollToContact = () => {
    const element = document.querySelector('#contact');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const openGitHub = () => {
    window.open('https://github.com/AngelP17/geowraith', '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="relative w-full py-32 md:py-40 bg-black overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] 
                        bg-gradient-radial from-white/[0.03] to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full px-5 md:px-[120px]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center"
        >
          {/* Decorative line */}
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2 }}
            className="w-20 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent mx-auto mb-10"
          />

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight"
          >
            Ready to Build the
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400">
              Future of Geolocation?
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="text-white/40 text-lg md:text-xl max-w-2xl mx-auto mb-10"
          >
            Join the community of developers, researchers, and security professionals 
            building the next generation of location intelligence.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <MagneticButton
              strength={0.15}
              onClick={scrollToContact}
              className="group px-10 py-5 bg-white text-black rounded-full font-semibold text-base 
                         hover:shadow-[0_0_60px_rgba(255,255,255,0.25)] transition-all duration-300"
            >
              <span className="flex items-center gap-2">
                Get Started Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </MagneticButton>
            
            <MagneticButton
              strength={0.15}
              onClick={openGitHub}
              className="px-10 py-5 text-white rounded-full font-medium text-base border border-white/20
                         hover:bg-white/5 hover:border-white/30 transition-all duration-300"
            >
              View on GitHub
            </MagneticButton>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.7 }}
            className="text-white/20 text-sm mt-8"
          >
            MIT Licensed • Free Forever • No Credit Card Required
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
};
