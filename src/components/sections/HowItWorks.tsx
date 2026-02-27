/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { ProcessStep } from '../ui/ProcessStep';
import { processSteps } from '../../data/features';
import { Upload, Brain, Search, Crosshair, MapPin } from 'lucide-react';

const stepIcons = [Upload, Brain, Search, Crosshair, MapPin];

export const HowItWorks: React.FC = () => {
  return (
    <section id="how-it-works" className="relative w-full py-24 md:py-32 bg-[#0a0a0a]">
      {/* Top gradient fade */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-black to-transparent pointer-events-none" />

      <div className="relative z-10 w-full px-5 md:px-[120px]">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="max-w-3xl mx-auto text-center mb-16 md:mb-20">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 
                         text-white/50 text-xs font-medium tracking-wider uppercase mb-4"
            >
              Pipeline
            </motion.span>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-3xl md:text-5xl font-semibold text-white mb-4 leading-tight"
            >
              From Photo to{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                Calibrated Location
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-white/50 text-base md:text-lg max-w-2xl mx-auto"
            >
              A five-stage pipeline that transforms any image into confidence-calibrated
              geolocation output.
            </motion.p>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            {/* Left: Steps */}
            <div className="order-2 lg:order-1">
              {processSteps.map((step, index) => (
                <ProcessStep
                  key={step.step}
                  step={step}
                  index={index}
                  isLast={index === processSteps.length - 1}
                />
              ))}
            </div>

            {/* Right: Visual Pipeline */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="order-1 lg:order-2 sticky top-24"
            >
              <div className="relative p-6 md:p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                {/* Pipeline visualization */}
                <div className="flex flex-col gap-3">
                  {processSteps.map((step, index) => {
                    const Icon = stepIcons[index];
                    const isLast = index === processSteps.length - 1;
                    
                    return (
                      <motion.div
                        key={step.step}
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                        whileHover={{ x: 4, transition: { duration: 0.2 } }}
                        className={`flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]
                                   hover:bg-white/[0.05] hover:border-white/[0.1] transition-all duration-300
                                   cursor-default ${isLast ? 'ring-1 ring-emerald-500/20' : ''}`}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0
                                        ${isLast ? 'bg-emerald-500/10' : 'bg-white/5'}`}>
                          <Icon className={`w-5 h-5 ${isLast ? 'text-emerald-400' : 'text-white/50'}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-white/30 text-xs">Step {step.step}</span>
                            {isLast && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px]">
                                Output
                              </span>
                            )}
                          </div>
                          <span className="text-white font-medium text-sm">{step.title}</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Decorative corner accents */}
                <div className="absolute top-0 left-0 w-8 h-8 border-l border-t border-white/10 rounded-tl-2xl" />
                <div className="absolute top-0 right-0 w-8 h-8 border-r border-t border-white/10 rounded-tr-2xl" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-l border-b border-white/10 rounded-bl-2xl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-r border-b border-white/10 rounded-br-2xl" />
              </div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 1 }}
                className="grid grid-cols-3 gap-4 mt-6"
              >
                {[
                  { value: '93.1%', label: 'Within 10km' },
                  { value: '<2s', label: 'Typical' },
                  { value: '55K+', label: 'Vectors' },
                ].map((stat, i) => (
                  <div key={i} className="text-center p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <div className="text-xl md:text-2xl font-bold text-white mb-1">{stat.value}</div>
                    <div className="text-white/40 text-xs">{stat.label}</div>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
