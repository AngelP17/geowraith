/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Radar, Shield, Route } from 'lucide-react';
import { dispatchDemo, type DemoKey } from '../../lib/demo';

const examples: Array<{
  title: string;
  label: string;
  icon: typeof Radar;
  steps: string[];
  outcome: string;
  key: DemoKey;
  mode: 'fast' | 'accurate';
}> = [
  {
    title: 'OSINT Verification',
    label: 'Open Source Intelligence',
    icon: Radar,
    steps: ['Upload a social image', 'Run fast scan', 'Refine with precision lock'],
    outcome: 'Verify location claims in minutes',
    key: 'downtown',
    mode: 'fast',
  },
  {
    title: 'Search & Rescue',
    label: 'Mission Support',
    icon: Route,
    steps: ['Ingest last-known photo', 'Map confidence radius', 'Deliver search grid'],
    outcome: 'Narrow search area quickly',
    key: 'ridge',
    mode: 'accurate',
  },
  {
    title: 'Security Audit',
    label: 'Operational Security',
    icon: Shield,
    steps: ['Analyze public imagery', 'Identify sensitive exposure', 'Generate risk report'],
    outcome: 'Reduce location leakage risk',
    key: 'industrial',
    mode: 'accurate',
  },
];

export const Examples: React.FC = () => {
  return (
    <section id="examples" className="relative w-full py-24 md:py-32 bg-[#050505]">
      <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-black to-[#050505] pointer-events-none" />

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
              <CheckCircle2 className="w-3.5 h-3.5" />
              Examples
            </motion.span>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-5xl font-semibold text-white mb-6"
            >
              Real-World Demo Scenarios
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-white/50 text-base md:text-lg"
            >
              Each scenario mirrors how the product UI is used during real investigations.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {examples.map((example, index) => (
              <motion.button
                key={example.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 + index * 0.1 }}
                onClick={() => {
                  const target = document.querySelector('#product');
                  if (target) target.scrollIntoView({ behavior: 'smooth' });
                  dispatchDemo(example.key, example.mode);
                }}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 flex flex-col gap-5 text-left hover:border-white/20 hover:bg-white/[0.04] transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center">
                    <example.icon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">{example.title}</p>
                    <p className="text-white/40 text-xs uppercase tracking-[0.2em]">{example.label}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {example.steps.map((step) => (
                    <div key={step} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <p className="text-white/50 text-sm">{step}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-auto rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
                  <p className="text-emerald-200 text-sm">{example.outcome}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
