/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { SCAN_LINES } from './types';

export const BackgroundGrid: React.FC = () => (
  <div className="absolute inset-0 pointer-events-none">
    <div
      className="absolute inset-0 opacity-[0.03]"
      style={{
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
      }}
    />
    <div className="absolute inset-0 overflow-hidden opacity-[0.02]">
      {Array.from({ length: SCAN_LINES }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-full h-px bg-white"
          style={{ top: `${(i / SCAN_LINES) * 100}%` }}
          animate={{ opacity: [0.1, 0.5, 0.1] }}
          transition={{ duration: 3, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
    <svg className="absolute top-8 left-8 w-16 h-16 text-white/5" viewBox="0 0 64 64">
      <path d="M0 0 L20 0 L20 2 L2 2 L2 20 L0 20 Z" fill="currentColor" />
    </svg>
    <svg className="absolute top-8 right-8 w-16 h-16 text-white/5" viewBox="0 0 64 64">
      <path d="M64 0 L44 0 L44 2 L62 2 L62 20 L64 20 Z" fill="currentColor" />
    </svg>
    <svg className="absolute bottom-8 left-8 w-16 h-16 text-white/5" viewBox="0 0 64 64">
      <path d="M0 64 L0 44 L2 44 L2 62 L20 62 L20 64 Z" fill="currentColor" />
    </svg>
    <svg className="absolute bottom-8 right-8 w-16 h-16 text-white/5" viewBox="0 0 64 64">
      <path d="M64 64 L44 64 L44 62 L62 62 L62 44 L64 44 Z" fill="currentColor" />
    </svg>
  </div>
);
