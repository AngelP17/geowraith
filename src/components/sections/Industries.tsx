/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { industries } from '../../data/extendedContent';
import { Building2, Radio, Siren, ShieldCheck, Scale, Microscope, Umbrella, Home } from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  Building2,
  Radio,
  Siren,
  ShieldCheck,
  Scale,
  Microscope,
  Umbrella,
  Home,
};

export const Industries: React.FC = () => {
  return (
    <section id="industries" className="relative w-full py-24 md:py-32 bg-black">
      <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-black to-[#050505] pointer-events-none" />

      <div className="relative z-10 w-full px-5 md:px-[120px]">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="max-w-3xl mx-auto text-center mb-16">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 
                         text-white/50 text-xs font-medium tracking-wider uppercase mb-4"
            >
              Industries
            </motion.span>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-5xl font-semibold text-white mb-4"
            >
              Trusted Across Verticals
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-white/50 text-base md:text-lg"
            >
              From government agencies to research institutions, organizations trust GeoWraith 
              for mission-critical location intelligence.
            </motion.p>
          </div>

          {/* Industries Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {industries.map((industry, index) => {
              const Icon = iconMap[industry.icon];
              return (
                <motion.div
                  key={industry.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="group p-5 rounded-xl bg-white/[0.02] border border-white/[0.06] 
                             hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300"
                >
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center mb-4
                                  group-hover:bg-white/10 transition-colors">
                    <Icon className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" />
                  </div>

                  <h3 className="text-white font-semibold text-base mb-2">{industry.name}</h3>
                  <p className="text-white/40 text-sm leading-relaxed mb-3">{industry.description}</p>
                  
                  <div className="pt-3 border-t border-white/[0.06]">
                    <span className="text-emerald-400/80 text-xs font-medium">{industry.stats}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
