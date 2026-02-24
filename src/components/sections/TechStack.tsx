/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { TechCard } from '../ui/TechCard';
import { techStack } from '../../data/features';
import { Terminal } from 'lucide-react';

export const TechStack: React.FC = () => {
  const categories = ['core', 'storage', 'frontend', 'infrastructure'] as const;
  
  const categoryNames: Record<string, string> = {
    core: 'Core Engine',
    storage: 'Storage & Database',
    frontend: 'Frontend & UI',
    infrastructure: 'Infrastructure',
  };

  return (
    <section id="tech-stack" className="relative w-full py-24 md:py-32 bg-black">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-black to-black pointer-events-none" />

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
              Technology
            </motion.span>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-3xl md:text-5xl font-semibold text-white mb-4 leading-tight"
            >
              Built with Modern{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                Battle-Tested Tech
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-white/50 text-base md:text-lg max-w-2xl mx-auto"
            >
              A carefully selected stack optimized for performance, security, and local-first operation.
            </motion.p>
          </div>

          {/* Tech Grid by Category */}
          <div className="space-y-12">
            {categories.map((category, catIndex) => {
              const categoryTechs = techStack.filter(t => t.category === category);
              
              return (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: catIndex * 0.1 }}
                >
                  <h3 className="text-white/40 text-xs uppercase tracking-wider font-medium mb-4">
                    {categoryNames[category]}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                    {categoryTechs.map((tech, index) => (
                      <TechCard 
                        key={tech.name} 
                        tech={tech} 
                        index={catIndex * 10 + index} 
                      />
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Code Snippet */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-16 md:mt-20"
          >
            <div className="max-w-3xl mx-auto">
              <div className="rounded-2xl bg-[#0d0d0d] border border-white/[0.08] overflow-hidden">
                {/* Terminal Header */}
                <div className="flex items-center gap-2 px-4 py-3 bg-white/[0.02] border-b border-white/[0.06]">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <div className="flex items-center gap-2 ml-2 text-white/30 text-xs">
                    <Terminal className="w-3.5 h-3.5" />
                    <span>terminal</span>
                  </div>
                </div>

                {/* Code Content */}
                <div className="p-4 md:p-6 overflow-x-auto">
                  <pre className="text-sm font-mono leading-relaxed">
                    <code>
                      <span className="text-white/30"># Clone and run locally</span>
                      {'\n'}
                      <span className="text-cyan-400">git</span>
                      <span className="text-white/70"> clone https://github.com/AngelP17/geowraith.git</span>
                      {'\n'}
                      <span className="text-cyan-400">cd</span>
                      <span className="text-white/70"> geowraith</span>
                      {'\n\n'}
                      <span className="text-white/30"># Start the full stack</span>
                      {'\n'}
                      <span className="text-emerald-400">docker compose</span>
                      <span className="text-white/70"> up --build</span>
                      {'\n\n'}
                      <span className="text-white/30"># Or backend only for development</span>
                      {'\n'}
                      <span className="text-emerald-400">docker compose</span>
                      <span className="text-white/70"> -f docker-compose.backend.yml up</span>
                    </code>
                  </pre>
                </div>
              </div>

              <p className="text-center text-white/30 text-xs mt-4">
                Zero configuration required. Runs entirely offline after setup.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
