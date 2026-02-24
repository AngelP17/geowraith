/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Cpu, Database, Target, Shield, WifiOff, Code2, type LucideIcon } from 'lucide-react';
import type { Feature } from '../../types';

const iconMap: Record<string, LucideIcon> = {
  Cpu,
  Database,
  Target,
  Shield,
  WifiOff,
  Code2,
};

interface FeatureCardProps {
  feature: Feature;
  index: number;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ feature, index }) => {
  const Icon = iconMap[feature.icon] || Cpu;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: 'easeOut' }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] 
                 hover:bg-white/[0.04] hover:border-white/[0.12] transition-all duration-300
                 cursor-pointer"
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.03] to-transparent 
                      opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Top edge glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r 
                      from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 
                      transition-opacity duration-300" />

      <div className="relative z-10">
        {/* Icon */}
        <div className="w-12 h-12 rounded-xl bg-white/[0.05] border border-white/[0.08] 
                        flex items-center justify-center mb-4 group-hover:bg-white/[0.08] 
                        group-hover:border-white/[0.12] transition-all duration-300">
          <Icon className="w-5 h-5 text-white/70 group-hover:text-white transition-colors duration-300" />
        </div>

        {/* Title */}
        <h3 className="text-white font-semibold text-lg mb-2 group-hover:text-white transition-colors">
          {feature.title}
        </h3>

        {/* Description */}
        <p className="text-white/50 text-sm leading-relaxed group-hover:text-white/60 transition-colors">
          {feature.description}
        </p>
      </div>
    </motion.div>
  );
};
