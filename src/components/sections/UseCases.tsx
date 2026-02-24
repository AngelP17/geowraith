/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCases } from '../../data/extendedContent';
import { Globe, LifeBuoy, Shield, Lock, GraduationCap, Newspaper, ChevronRight, Check } from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  Globe,
  LifeBuoy,
  Shield,
  Lock,
  GraduationCap,
  Newspaper,
};

export const UseCases: React.FC = () => {
  const [activeCase, setActiveCase] = useState(useCases[0].id);
  const activeData = useCases.find(u => u.id === activeCase) || useCases[0];
  const ActiveIcon = iconMap[activeData.icon] || Globe;

  return (
    <section id="use-cases" className="relative w-full py-24 md:py-32 bg-[#050505]">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-[#050505] to-black pointer-events-none" />

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
              When Is It Useful
            </motion.span>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-5xl font-semibold text-white mb-4"
            >
              Use Cases & Applications
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-white/50 text-base md:text-lg"
            >
              From OSINT investigations to search and rescue operations—GeoWraith adapts to your mission.
            </motion.p>
          </div>

          {/* Use Cases Tabs */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Tabs List */}
            <div className="lg:col-span-4 space-y-2">
              {useCases.map((useCase, index) => {
                const Icon = iconMap[useCase.icon];
                const isActive = activeCase === useCase.id;
                
                return (
                  <motion.button
                    key={useCase.id}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    onClick={() => setActiveCase(useCase.id)}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl text-left transition-all duration-300
                                ${isActive 
                                  ? 'bg-white/10 border border-white/20' 
                                  : 'bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04]'}`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0
                                    ${isActive ? 'bg-white/20' : 'bg-white/5'}`}>
                      <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-white/50'}`} />
                    </div>
                    <div className="flex-1">
                      <span className={`block font-medium ${isActive ? 'text-white' : 'text-white/70'}`}>
                        {useCase.title}
                      </span>
                    </div>
                    <ChevronRight className={`w-4 h-4 transition-transform ${isActive ? 'rotate-90 text-white' : 'text-white/30'}`} />
                  </motion.button>
                );
              })}
            </div>

            {/* Active Case Detail */}
            <div className="lg:col-span-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeCase}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="h-full p-6 md:p-8 rounded-2xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] 
                             border border-white/[0.1]"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center">
                      <ActiveIcon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-xl">{activeData.title}</h3>
                      <span className="text-white/40 text-sm">Primary Application</span>
                    </div>
                  </div>

                  <p className="text-white/60 text-base leading-relaxed mb-6">
                    {activeData.description}
                  </p>

                  <div className="space-y-3">
                    <span className="text-white/40 text-xs uppercase tracking-wider">Common Scenarios</span>
                    {activeData.scenarios.map((scenario, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-center gap-3"
                      >
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-white/70 text-sm">{scenario}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
