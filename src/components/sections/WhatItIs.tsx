/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { whatItIs } from '../../data/extendedContent';
import { Layers, Search, Crosshair, Server } from 'lucide-react';

const iconMap = [Layers, Search, Crosshair, Server];

export const WhatItIs: React.FC = () => {
  return (
    <section id="what-it-is" className="relative w-full py-24 md:py-32 bg-black">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-[#050505] to-black pointer-events-none" />
      
      <div className="relative z-10 w-full px-5 md:px-[120px]">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="max-w-3xl mb-16 md:mb-20">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 
                         text-white/50 text-xs font-medium tracking-wider uppercase mb-4"
            >
              What It Is
            </motion.span>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-5xl font-semibold text-white mb-6 leading-tight"
            >
              {whatItIs.headline}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-white/50 text-base md:text-lg leading-relaxed"
            >
              {whatItIs.description}
            </motion.p>
          </div>

          {/* Capabilities Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-16">
            {whatItIs.capabilities.map((cap, index) => {
              const Icon = iconMap[index];
              return (
                <motion.div
                  key={cap.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="group p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] 
                             hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0
                                    group-hover:bg-white/10 transition-colors">
                      <Icon className="w-5 h-5 text-white/60" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-lg mb-2">{cap.title}</h3>
                      <p className="text-white/40 text-sm leading-relaxed">{cap.description}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Architecture */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="p-6 md:p-8 rounded-2xl bg-gradient-to-br from-white/[0.03] to-transparent 
                       border border-white/[0.08]"
          >
            <h3 className="text-white font-semibold text-lg mb-6">{whatItIs.architecture.title}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {whatItIs.architecture.layers.map((layer, index) => (
                <motion.div
                  key={layer.name}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="relative"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center 
                                     text-white/60 text-xs font-medium">
                      {index + 1}
                    </span>
                    <span className="text-white font-medium">{layer.name}</span>
                  </div>
                  <p className="text-white/40 text-sm pl-9">{layer.detail}</p>
                  {index < 2 && (
                    <div className="hidden md:block absolute top-3 left-full w-full h-px 
                                    bg-gradient-to-r from-white/20 to-transparent -ml-2" />
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
