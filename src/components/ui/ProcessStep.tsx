/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Check, ArrowRight } from 'lucide-react';
import type { ProcessStep as ProcessStepType } from '../../types';

interface ProcessStepProps {
  step: ProcessStepType;
  index: number;
  isLast: boolean;
}

export const ProcessStep: React.FC<ProcessStepProps> = ({ step, index, isLast }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.15, ease: 'easeOut' }}
      className="relative flex gap-4 md:gap-6"
    >
      {/* Step Number & Connector */}
      <div className="flex flex-col items-center">
        {/* Number Badge */}
        <motion.div
          whileHover={{ scale: 1.1 }}
          className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/[0.05] border border-white/[0.1] 
                     flex items-center justify-center shrink-0 z-10
                     hover:bg-white/[0.1] hover:border-white/[0.2] transition-all duration-300
                     cursor-default"
        >
          <span className="text-white font-semibold text-sm md:text-base">{step.step}</span>
        </motion.div>

        {/* Connector Line */}
        {!isLast && (
          <div className="w-px flex-1 bg-gradient-to-b from-white/20 via-white/10 to-transparent mt-2 min-h-[60px]" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-8 md:pb-10">
        <motion.div
          whileHover={{ x: 4 }}
          transition={{ duration: 0.2 }}
          className="cursor-default"
        >
          <h3 className="text-white font-semibold text-lg md:text-xl mb-1">{step.title}</h3>
          <p className="text-white/50 text-sm md:text-base mb-3">{step.description}</p>

          {/* Details */}
          <ul className="space-y-1.5">
            {step.details.map((detail, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-2 text-white/40 text-xs md:text-sm"
              >
                <Check className="w-3.5 h-3.5 text-emerald-400/70 shrink-0" />
                <span>{detail}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {/* Arrow to next step (mobile only) */}
        {!isLast && (
          <div className="md:hidden mt-4 flex justify-center">
            <ArrowRight className="w-4 h-4 text-white/20 rotate-90" />
          </div>
        )}
      </div>
    </motion.div>
  );
};
