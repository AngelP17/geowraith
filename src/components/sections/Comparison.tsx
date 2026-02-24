/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, useInView } from 'motion/react';
import { comparison } from '../../data/extendedContent';
import { Check, X, Trophy } from 'lucide-react';

export const Comparison: React.FC = () => {
  const sectionRef = React.useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  return (
    <section ref={sectionRef} id="comparison" className="relative w-full py-24 md:py-32 bg-[#050505]">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-[#050505] to-black pointer-events-none" />

      <div className="relative z-10 w-full px-5 md:px-[120px]">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="max-w-3xl mx-auto text-center mb-16">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              className="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 
                         text-white/50 text-xs font-medium tracking-wider uppercase mb-4"
            >
              Comparison
            </motion.span>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-5xl font-semibold text-white mb-6"
            >
              {comparison.headline}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 }}
              className="text-white/50 text-base md:text-lg"
            >
              {comparison.description}
            </motion.p>
          </div>

          {/* Comparison Table */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3 }}
            className="overflow-x-auto"
          >
            <div className="min-w-[700px] rounded-2xl border border-white/[0.08] overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-5 bg-white/[0.03]">
                {comparison.comparisonTable.headers.map((header, i) => (
                  <div
                    key={header}
                    className={`px-4 py-4 text-sm font-medium ${
                      i === 1 
                        ? 'text-emerald-400 bg-emerald-500/5' 
                        : 'text-white/60'
                    } ${i === 0 ? 'text-left' : 'text-center'}`}
                  >
                    {header}
                  </div>
                ))}
              </div>

              {/* Table Rows */}
              {comparison.comparisonTable.rows.map((row, index) => (
                <motion.div
                  key={row.feature}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.4 + index * 0.05 }}
                  className="grid grid-cols-5 border-t border-white/[0.06] hover:bg-white/[0.02] transition-colors"
                >
                  <div className="px-4 py-4 text-white/80 text-sm">{row.feature}</div>
                  <div className="px-4 py-4 text-center bg-emerald-500/5">
                    {row.geowraith === '✓' ? (
                      <Check className="w-5 h-5 text-emerald-400 mx-auto" />
                    ) : (
                      <span className="text-emerald-400 font-medium">{row.geowraith}</span>
                    )}
                  </div>
                  <div className="px-4 py-4 text-center">
                    {row.geospy === '✓' ? (
                      <Check className="w-5 h-5 text-white/40 mx-auto" />
                    ) : row.geospy === '✗' ? (
                      <X className="w-5 h-5 text-white/20 mx-auto" />
                    ) : (
                      <span className="text-white/40 text-sm">{row.geospy}</span>
                    )}
                  </div>
                  <div className="px-4 py-4 text-center">
                    {row.google === '✓' ? (
                      <Check className="w-5 h-5 text-white/40 mx-auto" />
                    ) : row.google === '✗' ? (
                      <X className="w-5 h-5 text-white/20 mx-auto" />
                    ) : (
                      <span className="text-white/40 text-sm">{row.google}</span>
                    )}
                  </div>
                  <div className="px-4 py-4 text-center">
                    <span className="text-white/40 text-sm">{row.diy}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Winner Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.8 }}
            className="mt-8 flex justify-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 
                            border border-emerald-500/20">
              <Trophy className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400 text-sm font-medium">
                Best balance of accuracy, privacy, and cost
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
