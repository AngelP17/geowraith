/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { outcomes } from '../../data/extendedContent';
import { Clock, Lock, DollarSign, CheckCircle } from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  Clock,
  Lock,
  DollarSign,
  CheckCircle,
};

const AnimatedCounter: React.FC<{ value: string; label: string; delay: number }> = ({ value, label, delay }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const [displayValue, setDisplayValue] = React.useState('0');

  useEffect(() => {
    if (!isInView) return;

    const match = value.match(/^([^0-9]*)([0-9]+(?:\.[0-9]+)?)(.*)$/);
    if (!match) {
      setDisplayValue(value);
      return;
    }
    const prefix = match[1];
    const numericToken = match[2];
    const suffix = match[3];
    const target = Number(numericToken);
    const decimals = (numericToken.split('.')[1] ?? '').length;
    if (!Number.isFinite(target)) {
      setDisplayValue(value);
      return;
    }

    const duration = 2000;
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime - delay;
      if (elapsed < 0) {
        requestAnimationFrame(animate);
        return;
      }

      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 4);
      const current = target * easeOut;
      const formatted = progress >= 1
        ? target.toFixed(decimals)
        : (decimals > 0 ? current.toFixed(decimals) : Math.floor(current).toString());

      setDisplayValue(`${prefix}${formatted}${suffix}`);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [isInView, value, delay]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-2 tabular-nums">
        {displayValue}
      </div>
      <div className="text-white/40 text-sm uppercase tracking-wider">{label}</div>
    </div>
  );
};

export const Outcomes: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  return (
    <section ref={sectionRef} id="outcomes" className="relative w-full py-24 md:py-32 bg-black overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] 
                        bg-gradient-radial from-white/[0.02] to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full px-5 md:px-[120px]">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="max-w-3xl mx-auto text-center mb-16 md:mb-20">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 
                         text-white/50 text-xs font-medium tracking-wider uppercase mb-4"
            >
              Results
            </motion.span>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-3xl md:text-5xl font-semibold text-white mb-6 leading-tight"
            >
              {outcomes.headline}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-white/50 text-base md:text-lg"
            >
              {outcomes.description}
            </motion.p>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-20">
            {outcomes.goals.map((goal, index) => (
              <AnimatedCounter
                key={goal.title}
                value={goal.metric}
                label={goal.metricLabel}
                delay={index * 200}
              />
            ))}
          </div>

          {/* Results Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {outcomes.results.map((result, index) => {
              const Icon = iconMap[result.icon];
              return (
                <motion.div
                  key={result.title}
                  initial={{ opacity: 0, y: 30 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="group p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] 
                             hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-white/10 to-white/5 
                                    flex items-center justify-center shrink-0
                                    group-hover:from-white/15 group-hover:to-white/10 transition-all">
                      <Icon className="w-6 h-6 text-white/70" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-lg mb-2">{result.title}</h3>
                      <p className="text-white/40 text-sm leading-relaxed">{result.description}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
