/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Image as ImageIcon, MapPin, Target } from 'lucide-react';
import { dispatchDemo, getDemoResult, type DemoKey } from '../../lib/demo';

const galleryItems: Array<{
  title: string;
  key: DemoKey;
}> = [
  {
    title: 'Downtown Core',
    key: 'downtown',
  },
  {
    title: 'Harbor District',
    key: 'harbor',
  },
  {
    title: 'Industrial Zone',
    key: 'industrial',
  },
  {
    title: 'Mountain Ridge',
    key: 'ridge',
  },
  {
    title: 'Coastal Highway',
    key: 'coastal',
  },
  {
    title: 'Campus Quadrant',
    key: 'campus',
  },
];

export const Gallery: React.FC = () => {
  return (
    <section id="gallery" className="relative w-full py-24 md:py-32 bg-black">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-[#050505] to-black pointer-events-none" />

      <div className="relative z-10 w-full px-5 md:px-[120px]">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 
                         text-white/50 text-xs font-medium tracking-wider uppercase mb-4"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              Gallery
            </motion.span>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-5xl font-semibold text-white mb-6"
            >
              Demo Results Gallery
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-white/50 text-base md:text-lg"
            >
              Sample outputs from the Product UI. Click any tile to jump to the map view.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {galleryItems.map((item, index) => (
              (() => {
                const demo = getDemoResult(item.key);
                const coords = `${demo.location.lat.toFixed(4)}, ${demo.location.lon.toFixed(4)}`;
                const confidence = `${Math.round(demo.confidence * 100)}%`;
                const radius = `${Math.round(demo.location.radius_m)}m`;
                return (
                  <motion.button
                    key={item.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.05 * index }}
                    onClick={() => {
                      const target = document.querySelector('#product');
                      if (target) target.scrollIntoView({ behavior: 'smooth' });
                      dispatchDemo(item.key);
                    }}
                    className="text-left rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 hover:border-white/20 hover:bg-white/[0.04] transition-all"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-white font-semibold">{item.title}</span>
                      <span className="text-white/30 text-xs uppercase tracking-[0.2em]">Demo</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-white/50 text-sm">
                        <MapPin className="w-4 h-4 text-emerald-400" />
                        <span>{coords}</span>
                      </div>
                      <div className="flex items-center gap-2 text-white/50 text-sm">
                        <Target className="w-4 h-4 text-cyan-400" />
                        <span>{confidence} confidence</span>
                      </div>
                    </div>

                    <p className="text-white/30 text-xs mt-4">Radius: {radius}</p>
                  </motion.button>
                );
              })()
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
