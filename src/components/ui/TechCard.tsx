/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import type { TechStackItem } from '../../types';

interface TechCardProps {
  tech: TechStackItem;
  index: number;
}

const categoryColors: Record<string, string> = {
  core: 'from-orange-500/20 to-amber-500/10 border-orange-500/20',
  storage: 'from-blue-500/20 to-cyan-500/10 border-blue-500/20',
  frontend: 'from-cyan-500/20 to-teal-500/10 border-cyan-500/20',
  infrastructure: 'from-purple-500/20 to-pink-500/10 border-purple-500/20',
};

const categoryLabels: Record<string, string> = {
  core: 'Core',
  storage: 'Storage',
  frontend: 'Frontend',
  infrastructure: 'Infra',
};

export const TechCard: React.FC<TechCardProps> = ({ tech, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: 'easeOut' }}
      whileHover={{ 
        scale: 1.03, 
        transition: { duration: 0.2 } 
      }}
      className={`group relative p-4 rounded-xl bg-gradient-to-br ${categoryColors[tech.category]} 
                  border backdrop-blur-sm cursor-pointer
                  hover:from-opacity-30 hover:to-opacity-20 transition-all duration-300`}
    >
      {/* Shine effect on hover */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/5 to-transparent 
                      -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />

      <div className="relative z-10">
        {/* Category Badge */}
        <span className="text-[10px] uppercase tracking-wider text-white/40 font-medium">
          {categoryLabels[tech.category]}
        </span>

        {/* Tech Name */}
        <h4 className="text-white font-semibold text-base mt-1 mb-0.5 group-hover:text-white transition-colors">
          {tech.name}
        </h4>

        {/* Description */}
        <p className="text-white/40 text-xs group-hover:text-white/50 transition-colors">
          {tech.description}
        </p>
      </div>
    </motion.div>
  );
};
