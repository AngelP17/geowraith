/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, Terminal, Link2, ShieldCheck } from 'lucide-react';

export const Docs: React.FC = () => {
  return (
    <section id="docs" className="relative w-full py-24 md:py-32 bg-black">
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
              <BookOpen className="w-3.5 h-3.5" />
              Docs
            </motion.span>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-5xl font-semibold text-white mb-6"
            >
              Quick Start & API
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-white/50 text-base md:text-lg"
            >
              Everything you need to run the frontend, start the local API, and call the prediction endpoint.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center">
                  <Terminal className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-white font-semibold">Frontend</h3>
              </div>
              <pre className="text-xs text-white/50 bg-black/50 border border-white/5 rounded-lg p-3 overflow-x-auto">
                <code>{`npm install\nnpm run dev`}</code>
              </pre>
              <p className="text-white/40 text-xs mt-3">Runs the product UI and landing page.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="text-white font-semibold">Backend API</h3>
              </div>
              <pre className="text-xs text-white/50 bg-black/50 border border-white/5 rounded-lg p-3 overflow-x-auto">
                <code>{`npm run start\n# or: cd backend && npm run dev`}</code>
              </pre>
              <p className="text-white/40 text-xs mt-3">Local API at `http://localhost:8080/health`.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center">
                  <Link2 className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-white font-semibold">API Contract</h3>
              </div>
              <p className="text-white/50 text-sm">`POST /api/predict`</p>
              <p className="text-white/40 text-xs mt-2">Spec: `backend/docs/openapi.yaml`</p>
              <p className="text-white/30 text-xs mt-4">Send `image_base64` (or a data URL in `image_url`) with mode.</p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
